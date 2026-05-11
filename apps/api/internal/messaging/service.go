package messaging

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/projectx/api/internal/messaging/channels"
)

// Service is the messaging use-case layer. Webhooks call HandleInboundWhatsApp,
// the UI calls SendOutbound, and the worker drains the outbound_jobs queue.
type Service struct {
	repo *Repo
	bus  Bus
}

func NewService(repo *Repo, bus Bus) *Service {
	return &Service{repo: repo, bus: bus}
}

// ============================================================
// Channel CRUD (thin wrappers around repo + future webhook subscription)
// ============================================================

type ConnectWhatsAppInput struct {
	WABAID         string  // parent (WhatsApp Business Account)
	PhoneNumberID  string  // external_id Meta sends in webhooks
	DisplayPhone   string  // human-readable, e.g. "+65 9123 4567"
	AccessToken    string  // permanent system-user or user-access token
}

func (s *Service) ConnectWhatsApp(ctx context.Context, studioID uuid.UUID, in ConnectWhatsAppInput) (*ChannelAccount, error) {
	in.WABAID = strings.TrimSpace(in.WABAID)
	in.PhoneNumberID = strings.TrimSpace(in.PhoneNumberID)
	in.DisplayPhone = strings.TrimSpace(in.DisplayPhone)
	in.AccessToken = strings.TrimSpace(in.AccessToken)

	if in.WABAID == "" || in.PhoneNumberID == "" || in.DisplayPhone == "" || in.AccessToken == "" {
		return nil, errors.New("wabaId, phoneNumberId, displayPhone, accessToken are all required")
	}

	return s.repo.CreateChannel(ctx, CreateChannelInput{
		StudioID:      studioID,
		Kind:          KindWhatsAppMeta,
		BSP:           "meta_direct",
		ExternalID:    in.PhoneNumberID,
		ParentID:      in.WABAID,
		DisplayHandle: in.DisplayPhone,
		AccessToken:   in.AccessToken,
	})
}

func (s *Service) ListChannels(ctx context.Context, studioID uuid.UUID) ([]ChannelAccount, error) {
	return s.repo.ListChannels(ctx, studioID)
}

func (s *Service) DisconnectChannel(ctx context.Context, studioID, id uuid.UUID) error {
	return s.repo.DisconnectChannel(ctx, studioID, id)
}

// ============================================================
// Inbound (called by the Meta webhook handler)
// ============================================================

// HandleInboundWhatsAppMessage processes one message from Meta's webhook.
// Idempotent — duplicate webhook deliveries collapse into a single message
// row via the unique index on (conversation_id, external_id).
func (s *Service) HandleInboundWhatsAppMessage(ctx context.Context,
	wabaID string,
	meta channels.WhatsAppWebhookMetadata,
	contact *channels.WhatsAppWebhookContact,
	msg channels.WhatsAppWebhookMessage,
) error {
	// 1. Resolve the channel account by phone_number_id.
	channel, err := s.repo.GetChannelByExternalID(ctx, KindWhatsAppMeta, meta.PhoneNumberID)
	if err != nil {
		// Not connected to any studio — nothing to do (don't error to Meta).
		return nil
	}

	displayName := ""
	if contact != nil {
		displayName = contact.Profile.Name
	}

	// 2. Open a tx for the identity → conversation → message chain so we
	//    never end up with a half-stitched conversation.
	tx, err := s.repo.Pool().BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// 3. Identity stitching: phone → contact_identity (find or create).
	identity, err := s.repo.FindOrCreateIdentity(ctx, tx, channel.StudioID, IdentityPhone, msg.From, displayName)
	if err != nil {
		return err
	}

	// 4. Find/open the conversation for (channel, contact-phone).
	conv, err := s.repo.FindOrCreateConversation(ctx, tx, channel.StudioID, channel.ID, identity.ID, msg.From)
	if err != nil {
		return err
	}

	// 5. Insert the message (deduped by external_id).
	body := ""
	atts := []Attachment{}
	if msg.Text != nil {
		body = msg.Text.Body
	}
	if msg.Image != nil {
		atts = append(atts, Attachment{Type: "image", Mime: msg.Image.MimeType})
		if body == "" {
			body = msg.Image.Caption
		}
	}
	if msg.Video != nil {
		atts = append(atts, Attachment{Type: "video", Mime: msg.Video.MimeType})
		if body == "" {
			body = msg.Video.Caption
		}
	}
	if msg.Audio != nil {
		atts = append(atts, Attachment{Type: "audio", Mime: msg.Audio.MimeType})
	}
	if msg.Document != nil {
		atts = append(atts, Attachment{Type: "document", Mime: msg.Document.MimeType})
	}
	if body == "" && len(atts) == 0 {
		// Unknown type — skip but don't error to Meta.
		return tx.Commit(ctx)
	}

	inReply := ""
	if msg.Context != nil {
		inReply = msg.Context.ID
	}

	stored, err := s.repo.InsertMessage(ctx, tx, CreateMessageInput{
		ConversationID: conv.ID,
		StudioID:       channel.StudioID,
		Direction:      DirectionInbound,
		SourceKind:     SourceCustomer,
		Body:           body,
		Attachments:    atts,
		ExternalID:     msg.ID,
		InReplyTo:      inReply,
		Status:         MsgSent,
		SentAt:         channels.ParseTimestamp(msg.Timestamp),
	})
	if err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit: %w", err)
	}

	// 6. Publish event for SSE / future automations / future AI suggester.
	if stored != nil {
		s.bus.Publish(ctx, Event{
			Kind:           EvtMessageReceived,
			StudioID:       channel.StudioID,
			ConversationID: conv.ID,
			MessageID:      &stored.ID,
		})
	} else {
		// Duplicate — still notify so the UI re-fetches in case the dedupe
		// happened across replicas. Cheap.
		s.bus.Publish(ctx, Event{
			Kind:           EvtConversationUpdated,
			StudioID:       channel.StudioID,
			ConversationID: conv.ID,
		})
	}
	return nil
}

// HandleStatus updates an outbound message's delivery state when Meta tells
// us it was delivered/read/failed. Looked up by Meta wamid.
func (s *Service) HandleStatus(ctx context.Context, st channels.WhatsAppWebhookStatus) error {
	if st.ID == "" || st.Status == "" {
		return nil
	}
	ts := channels.ParseTimestamp(st.Timestamp)
	switch st.Status {
	case "delivered":
		_, err := s.repo.Pool().Exec(ctx, `
			UPDATE messages SET delivered_at = $2, status = 'delivered'
			WHERE external_id = $1 AND direction = 'outbound'
		`, st.ID, ts)
		return err
	case "read":
		_, err := s.repo.Pool().Exec(ctx, `
			UPDATE messages SET read_at = $2, status = 'read'
			WHERE external_id = $1 AND direction = 'outbound'
		`, st.ID, ts)
		return err
	case "failed":
		_, err := s.repo.Pool().Exec(ctx, `
			UPDATE messages SET status = 'failed' WHERE external_id = $1 AND direction = 'outbound'
		`, st.ID)
		return err
	}
	return nil
}

// ============================================================
// Outbound (called by the UI via REST → enqueues)
// ============================================================

type SendInput struct {
	StudioID       uuid.UUID
	ConversationID uuid.UUID
	UserID         uuid.UUID // who in the studio is sending
	Body           string
}

// EnqueueReply queues a manual reply on an existing conversation. Worker
// dispatches via the channel adapter. Returns the job id so the UI can
// optimistically render.
func (s *Service) EnqueueReply(ctx context.Context, in SendInput) (int64, error) {
	in.Body = strings.TrimSpace(in.Body)
	if in.Body == "" {
		return 0, errors.New("body is required")
	}
	conv, err := s.repo.GetConversation(ctx, in.StudioID, in.ConversationID)
	if err != nil {
		return 0, err
	}
	if conv.Status == ConvClosed {
		return 0, errors.New("conversation is closed")
	}
	return s.repo.EnqueueOutbound(ctx, OutboundJob{
		StudioID:       in.StudioID,
		ConversationID: in.ConversationID,
		Body:           in.Body,
		SourceKind:     SourceStudioUser,
		SourceUserID:   &in.UserID,
		ScheduledFor:   time.Now().UTC(),
	})
}

// ============================================================
// Listing / reading (REST endpoints call these)
// ============================================================

func (s *Service) ListConversations(ctx context.Context, studioID uuid.UUID, f ListConversationsFilter) ([]Conversation, int, error) {
	return s.repo.ListConversations(ctx, studioID, f)
}

func (s *Service) GetConversation(ctx context.Context, studioID, id uuid.UUID) (*Conversation, error) {
	return s.repo.GetConversation(ctx, studioID, id)
}

func (s *Service) ListMessages(ctx context.Context, studioID, conversationID uuid.UUID, limit int) ([]Message, error) {
	return s.repo.ListMessages(ctx, studioID, conversationID, limit)
}

func (s *Service) MarkRead(ctx context.Context, studioID, conversationID uuid.UUID) error {
	if err := s.repo.MarkConversationRead(ctx, studioID, conversationID); err != nil {
		return err
	}
	s.bus.Publish(ctx, Event{
		Kind:           EvtConversationUpdated,
		StudioID:       studioID,
		ConversationID: conversationID,
	})
	return nil
}
