package messaging

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/projectx/api/internal/messaging/channels"
	"github.com/projectx/api/internal/platform/httpx"
	"github.com/projectx/api/internal/platform/logger"
)

// MetaWebhookHandler exposes:
//
//   GET  /api/v1/webhooks/meta/whatsapp   — Meta verification handshake
//   POST /api/v1/webhooks/meta/whatsapp   — inbound events (messages, statuses)
//
// Both endpoints are single, app-level (one Meta App = one webhook URL = many
// connected studios). Studio-level routing happens via the phone_number_id in
// the payload, which we look up against channel_accounts.
type MetaWebhookHandler struct {
	svc           *Service
	verifyToken   string // arbitrary string we set in Meta App config + here
	appSecret     string // Meta app secret — used to verify X-Hub-Signature-256
	log           *slog.Logger
}

func NewMetaWebhookHandler(svc *Service, verifyToken, appSecret string, log *slog.Logger) *MetaWebhookHandler {
	return &MetaWebhookHandler{
		svc:         svc,
		verifyToken: verifyToken,
		appSecret:   appSecret,
		log:         log,
	}
}

// GET handler: Meta sends ?hub.mode=subscribe&hub.verify_token=X&hub.challenge=Y
// We echo `hub.challenge` if `hub.verify_token` matches our configured token.
func (h *MetaWebhookHandler) Verify(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	mode := q.Get("hub.mode")
	token := q.Get("hub.verify_token")
	challenge := q.Get("hub.challenge")

	if mode != "subscribe" || token != h.verifyToken {
		logger.FromCtx(r.Context(), h.log).Warn("meta webhook verify mismatch",
			"mode", mode, "token_len", len(token))
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	_, _ = w.Write([]byte(challenge))
}

// POST handler: receive WhatsApp events. Verify HMAC, parse, dispatch to service.
// We always 200 to Meta even on internal errors so they don't retry forever
// (errors are logged on our side).
func (h *MetaWebhookHandler) Receive(w http.ResponseWriter, r *http.Request) {
	log := logger.FromCtx(r.Context(), h.log).With("webhook", "meta_whatsapp")

	body, err := io.ReadAll(io.LimitReader(r.Body, 5<<20)) // 5 MB cap
	if err != nil {
		log.Error("read body", "err", err)
		http.Error(w, "bad body", http.StatusBadRequest)
		return
	}

	if !h.verifySignature(r.Header.Get("X-Hub-Signature-256"), body) {
		log.Warn("invalid signature on meta webhook — rejecting")
		http.Error(w, "bad signature", http.StatusUnauthorized)
		return
	}

	var payload channels.WhatsAppWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Error("decode payload", "err", err, "body", string(body))
		// Still ack to avoid Meta retry storm.
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ignored"})
		return
	}

	if payload.Object != "whatsapp_business_account" {
		// Could be IG / Messenger objects on the same webhook URL once we add them.
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ignored_object"})
		return
	}

	for _, entry := range payload.Entry {
		for _, change := range entry.Changes {
			if change.Field != "messages" {
				continue
			}
			value := change.Value

			// Customer profiles arrive once per webhook batch — index by wa_id.
			contactsByWAID := map[string]*channels.WhatsAppWebhookContact{}
			for i := range value.Contacts {
				c := value.Contacts[i]
				contactsByWAID[c.WAID] = &c
			}

			for _, msg := range value.Messages {
				if err := h.svc.HandleInboundWhatsAppMessage(r.Context(),
					entry.ID, value.Metadata, contactsByWAID[msg.From], msg); err != nil {
					log.Error("handle inbound", "err", err, "from", msg.From, "id", msg.ID)
				}
			}

			for _, st := range value.Statuses {
				if err := h.svc.HandleStatus(r.Context(), st); err != nil {
					log.Error("handle status", "err", err, "id", st.ID)
				}
			}
		}
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// verifySignature: Meta signs the raw body with HMAC-SHA256 using the App
// Secret. Header format: "sha256=<hex>". Constant-time compare.
func (h *MetaWebhookHandler) verifySignature(header string, body []byte) bool {
	if h.appSecret == "" {
		// Misconfiguration: refuse rather than silently accept.
		return false
	}
	if !strings.HasPrefix(header, "sha256=") {
		return false
	}
	provided, err := hex.DecodeString(header[len("sha256="):])
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, []byte(h.appSecret))
	mac.Write(body)
	expected := mac.Sum(nil)
	return subtle.ConstantTimeCompare(provided, expected) == 1
}
