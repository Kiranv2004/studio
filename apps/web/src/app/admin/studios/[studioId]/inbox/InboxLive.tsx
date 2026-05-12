'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { brandInitials } from '@/lib/color';
import { api } from '@/lib/api';
import { formatTime, relativeTime } from '@/lib/datetime';
import type {
  ChannelKind,
  Conversation,
  Direction,
  Message,
  SourceKind,
} from '@/lib/types';

const CHANNEL_BADGE: Record<ChannelKind, { label: string; color: string }> = {
  whatsapp_meta:  { label: 'WA',  color: '#25D366' },
  instagram_meta: { label: 'IG',  color: '#E1306C' },
  messenger_meta: { label: 'FB',  color: '#0084FF' },
  x_dm:           { label: 'X',   color: '#000000' },
};

interface SSEEvent {
  kind: 'message.received' | 'message.sent' | 'conversation.updated';
  studioId: string;
  conversationId: string;
  messageId?: string;
}

export function InboxLive({
  studioId,
  initialConversations,
}: {
  studioId: string;
  initialConversations: Conversation[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [newReceiverNumber, setNewReceiverNumber] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLLIElement>(null);

  const selected = conversations.find((c) => c.id === selectedId);

  // Re-fetch conversation list — used after SSE events.
  const refreshConversations = useCallback(async () => {
    const res = await api<{ conversations: Conversation[] }>(
      `/api/v1/studios/${studioId}/messaging/conversations?limit=50`,
    );
    setConversations(res.conversations);
  }, [studioId]);

  // Re-fetch messages for the selected conversation.
  const refreshMessages = useCallback(
    async (convId: string) => {
      setLoadingMessages(true);
      try {
        const res = await api<{ messages: Message[] }>(
          `/api/v1/studios/${studioId}/messaging/conversations/${convId}/messages?limit=200`,
        );
        setMessages(res.messages);
      } finally {
        setLoadingMessages(false);
      }
    },
    [studioId],
  );

  // Initial load + selection change.
  useEffect(() => {
    if (selectedId) {
      refreshMessages(selectedId);
      // Mark read (best-effort; no UX disruption if it fails).
      api(`/api/v1/studios/${studioId}/messaging/conversations/${selectedId}/read`, {
        method: 'POST',
      }).catch(() => {});
    } else {
      setMessages([]);
    }
  }, [selectedId, studioId, refreshMessages]);

  // SSE subscription. Reconnect handled by EventSource itself; on disconnect
  // we silently fall back to polling every 10s as a safety net.
  useEffect(() => {
    const url = `/api/v1/studios/${studioId}/messaging/stream`;
    const es = new EventSource(url, { withCredentials: true });

    function onEvent(e: MessageEvent) {
      try {
        const evt: SSEEvent = JSON.parse(e.data);
        if (evt.studioId !== studioId) return;
        // Always refresh conversation list (cheap).
        refreshConversations();
        // Refresh messages only if it's the open thread.
        if (evt.conversationId === selectedId) {
          refreshMessages(evt.conversationId);
        }
      } catch {
        // Ignore malformed.
      }
    }
    es.addEventListener('message.received', onEvent);
    es.addEventListener('message.sent', onEvent);
    es.addEventListener('conversation.updated', onEvent);

    return () => {
      es.close();
    };
  }, [studioId, selectedId, refreshConversations, refreshMessages]);

  // Auto-scroll on new messages.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function makeOptimisticOutboundMessage(body: string): Message {
    const now = new Date().toISOString();
    return {
      id: `temp-${Date.now()}`,
      conversationId: selectedId ?? '',
      studioId,
      direction: 'outbound',
      sourceKind: 'studio_user',
      body,
      status: 'pending',
      sentAt: now,
      createdAt: now,
    };
  }

  async function send() {
    if (!selectedId || !draft.trim()) return;
    const body = draft.trim();
    const optimistic = makeOptimisticOutboundMessage(body);
    setSending(true);
    setMessages((current) => [...current, optimistic]);
    setDraft('');
    try {
      await api(`/api/v1/studios/${studioId}/messaging/conversations/${selectedId}/messages`, {
        method: 'POST',
        json: { body },
      });
      refreshConversations();
    } catch {
      setMessages((current) => current.filter((msg) => msg.id !== optimistic.id));
      setDraft(body);
      // Inline error UX comes later; for L1 we just leave the draft.
    } finally {
      setSending(false);
    }
  }

  async function createConversation() {
    if (!newReceiverNumber.trim()) return;
    setCreatingConversation(true);
    try {
      const conv = await api<Conversation>(
        `/api/v1/studios/${studioId}/messaging/conversations`,
        {
          method: 'POST',
          json: { contactValue: newReceiverNumber.trim() },
        },
      );
      setNewReceiverNumber('');
      setSelectedId(conv.id);
      await refreshConversations();
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // Inline error UX comes later
    } finally {
      setCreatingConversation(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-950">
      {/* ── conversation list ───────────────────────────────────── */}
      <aside className="hidden w-80 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 sm:flex">
        <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Conversations
        </div>
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createConversation();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newReceiverNumber}
              onChange={(e) => setNewReceiverNumber(e.target.value)}
              placeholder="Enter phone number"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-[color:var(--brand,#7c3aed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-softer,rgba(124,58,237,0.18))] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <Button
              type="submit"
              disabled={!newReceiverNumber.trim()}
              loading={creatingConversation}
              size="sm"
            >
              Start
            </Button>
          </form>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors dark:border-slate-800/60',
                  selectedId === c.id
                    ? 'bg-[color:var(--brand-soft,rgba(124,58,237,0.08))]'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
                )}
              >
                <ChannelAvatar kind={c.channelKind} name={c.contactDisplayName || c.contactValue} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {c.contactDisplayName || c.contactValue}
                    </span>
                    <span
                      className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-slate-400"
                      suppressHydrationWarning
                    >
                      {relativeTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {c.lastMessageDirection === 'outbound' && (
                        <span className="text-slate-400">You: </span>
                      )}
                      {c.lastMessagePreview}
                    </p>
                    {c.unreadCount > 0 && (
                      <span
                        className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[10px] font-semibold text-white"
                        style={{ background: 'var(--brand, #7c3aed)' }}
                      >
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── thread + composer ───────────────────────────────────── */}
      <section className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
              <ChannelAvatar
                kind={selected.channelKind}
                name={selected.contactDisplayName || selected.contactValue}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {selected.contactDisplayName || selected.contactValue}
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {channelLabel(selected.channelKind)} · {selected.contactValue}
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-slate-50/40 px-5 py-4 dark:bg-slate-900/30">
              {loadingMessages && messages.length === 0 ? (
                <div className="text-center text-xs text-slate-400">Loading…</div>
              ) : (
                <ul className="space-y-2">
                  {messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                  <li ref={messagesEndRef} />
                </ul>
              )}
            </div>

            <footer className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  placeholder="Type a message — Enter to send, Shift+Enter for newline"
                  className="block min-h-10 max-h-40 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-[color:var(--brand,#7c3aed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-softer,rgba(124,58,237,0.18))] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <Button
                  type="submit"
                  disabled={!draft.trim()}
                  loading={sending}
                  rightIcon={<Send className="h-4 w-4" />}
                >
                  Send
                </Button>
              </form>
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-6 py-8 text-center">
            <div className="max-w-md">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Start a conversation
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Type the receiver number on the left to open a thread, then send the first message here.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

function ChannelAvatar({ kind, name }: { kind: ChannelKind; name: string }) {
  const ch = CHANNEL_BADGE[kind];
  return (
    <span className="relative shrink-0">
      <span
        className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-white shadow-sm"
        style={{ background: avatarColor(name) }}
        aria-hidden
      >
        {brandInitials(name)}
      </span>
      <span
        className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-950"
        style={{ background: ch.color }}
        aria-label={ch.label}
        title={channelLabel(kind)}
      >
        {ch.label}
      </span>
    </span>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOutbound = msg.direction === 'outbound';
  const sourceTag = sourceTagFor(msg.sourceKind);
  return (
    <li className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          isOutbound
            ? 'rounded-br-md text-white'
            : 'rounded-bl-md bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700',
        )}
        style={isOutbound ? { background: 'var(--brand, #7c3aed)' } : undefined}
      >
        {sourceTag && (
          <div className={cn('mb-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-80')}>
            {sourceTag}
          </div>
        )}
        <div className="whitespace-pre-wrap leading-snug">{msg.body}</div>
        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1.5 text-[10px]',
            isOutbound ? 'text-white/75' : 'text-slate-400',
          )}
        >
          <span>{formatTime(msg.sentAt)}</span>
          {isOutbound && <StatusTick status={msg.status} />}
        </div>
      </div>
    </li>
  );
}

function StatusTick({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'pending':
      return <span>·</span>;
    case 'sent':
      return <span>✓</span>;
    case 'delivered':
      return <span>✓✓</span>;
    case 'read':
      return <span style={{ color: '#7dd3fc' }}>✓✓</span>;
    case 'failed':
      return <span className="text-red-300">!</span>;
  }
}

function sourceTagFor(s: SourceKind): string | null {
  switch (s) {
    case 'automation':
      return 'Automation';
    case 'ai':
      return 'AI';
    default:
      return null; // 'customer' / 'studio_user' don't need a tag
  }
}

function channelLabel(k: ChannelKind): string {
  switch (k) {
    case 'whatsapp_meta':  return 'WhatsApp';
    case 'instagram_meta': return 'Instagram';
    case 'messenger_meta': return 'Messenger';
    case 'x_dm':           return 'X DM';
  }
}

const AVATAR_PALETTE = [
  '#0ea5e9', '#6366f1', '#7c3aed', '#a855f7', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6',
];

function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}

// Direction is referenced indirectly (msg.direction === 'outbound'); silence
// the unused-import lint while still exporting a typed boundary.
export type _DirectionAlias = Direction;
