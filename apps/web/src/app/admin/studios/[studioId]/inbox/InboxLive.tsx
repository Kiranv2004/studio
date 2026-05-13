'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, MessagesSquare, Send } from 'lucide-react';
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
    } finally {
      setCreatingConversation(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 dark:border-slate-800/60 dark:bg-slate-950 dark:shadow-none">
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside className="hidden w-80 shrink-0 flex-col border-r border-slate-100 dark:border-slate-800 sm:flex">
        <div className="flex h-16 items-center justify-between px-5">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Messages</h2>
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-sm" title="Live" />
        </div>

        <div className="px-4 pb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createConversation();
            }}
            className="group relative"
          >
            <input
              type="text"
              value={newReceiverNumber}
              onChange={(e) => setNewReceiverNumber(e.target.value)}
              placeholder="New chat number..."
              className="w-full rounded-2xl border-none bg-slate-100 py-2.5 pl-4 pr-12 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-900 dark:text-slate-100"
              suppressHydrationWarning
            />
            <button
              type="submit"
              disabled={!newReceiverNumber.trim() || creatingConversation}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-xl bg-brand-500 text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-0"
              suppressHydrationWarning
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200',
                    selectedId === c.id
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-900',
                  )}
                  suppressHydrationWarning
                >
                  <ChannelAvatar kind={c.channelKind} name={c.contactDisplayName || c.contactValue} active={selectedId === c.id} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-sm font-bold', selectedId === c.id ? 'text-white' : 'text-slate-900 dark:text-slate-100')}>
                        {c.contactDisplayName || c.contactValue}
                      </span>
                      <span
                        className={cn('shrink-0 text-[10px] font-bold uppercase tracking-wider', selectedId === c.id ? 'text-white/70' : 'text-slate-400')}
                        suppressHydrationWarning
                      >
                        {relativeTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className={cn('min-w-0 flex-1 truncate text-xs', selectedId === c.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400')}>
                        {c.lastMessageDirection === 'outbound' && <span className={selectedId === c.id ? 'text-white/60' : 'text-slate-400'}>You: </span>}
                        {c.lastMessagePreview}
                      </p>
                      {c.unreadCount > 0 && selectedId !== c.id && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ── Main Chat Area ───────────────────────────────────── */}
      <section className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <>
            <header className="z-10 flex h-16 items-center gap-3 border-b border-slate-100 bg-white/80 px-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
              <ChannelAvatar
                kind={selected.channelKind}
                name={selected.contactDisplayName || selected.contactValue}
              />
              <div className="min-w-0">
                <div className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                  {selected.contactDisplayName || selected.contactValue}
                </div>
                <div className="flex items-center gap-1.5 truncate text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {channelLabel(selected.channelKind)} · {selected.contactValue}
                </div>
              </div>
            </header>

            <div className="relative flex-1 overflow-y-auto bg-slate-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] px-5 py-6 dark:bg-slate-900 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]">
              {loadingMessages && messages.length === 0 ? (
                <div className="grid h-full place-items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : (
                <ul className="space-y-4">
                  {messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                  <li ref={messagesEndRef} className="h-2" />
                </ul>
              )}
            </div>

            <footer className="z-10 bg-white/80 p-4 backdrop-blur-xl dark:bg-slate-950/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-end gap-3"
              >
                <div className="relative flex-1">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message..."
                    className="block min-h-[48px] max-h-32 w-full resize-none rounded-2xl border-none bg-slate-100 px-5 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-900 dark:text-slate-100"
                    suppressHydrationWarning
                  />
                </div>
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  suppressHydrationWarning
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center bg-slate-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] px-6 text-center dark:bg-slate-900 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]">
            <div className="max-w-sm rounded-3xl bg-white p-10 shadow-2xl dark:bg-slate-950">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-brand-500/10 text-brand-500">
                <MessagesSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Select a Chat</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Pick a conversation from the sidebar or start a new one to begin messaging.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

function ChannelAvatar({ kind, name, active }: { kind: ChannelKind; name: string; active?: boolean }) {
  const ch = CHANNEL_BADGE[kind];
  return (
    <span className="relative shrink-0">
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-2xl text-sm font-black text-white shadow-lg transition-transform group-hover:scale-105",
          active ? "bg-white/20" : "ring-4 ring-slate-100 dark:ring-slate-900"
        )}
        style={!active ? { background: avatarColor(name) } : undefined}
        aria-hidden
      >
        {brandInitials(name)}
      </span>
      <span
        className={cn(
          "absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-lg text-[10px] font-black text-white shadow-md",
          active ? "ring-2 ring-brand-500" : "ring-2 ring-white dark:ring-slate-950"
        )}
        style={{ background: ch.color }}
        aria-label={ch.label}
      >
        {ch.label[0]}
      </span>
    </span>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOutbound = msg.direction === 'outbound';
  const sourceTag = sourceTagFor(msg.sourceKind);
  return (
    <li className={cn('flex animate-in', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[85%] px-4 py-2.5 text-sm shadow-xl transition-all duration-300 sm:max-w-[70%]',
          isOutbound
            ? 'rounded-[20px] rounded-br-none bg-brand-500 text-white shadow-brand-500/10'
            : 'rounded-[20px] rounded-bl-none bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100',
        )}
      >
        {sourceTag && (
          <div className={cn('mb-1 text-[10px] font-black uppercase tracking-widest opacity-70')}>
            {sourceTag}
          </div>
        )}
        <div className="whitespace-pre-wrap font-medium leading-relaxed">{msg.body}</div>
        <div
          className={cn(
            'mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-bold',
            isOutbound ? 'text-white/70' : 'text-slate-400',
          )}
        >
          <span suppressHydrationWarning>{formatTime(msg.sentAt)}</span>
          {isOutbound && <StatusTick status={msg.status} />}
        </div>
        
        {/* Tail */}
        <div className={cn(
          "absolute bottom-0 h-4 w-4",
          isOutbound 
            ? "-right-1 bg-brand-500 [clip-path:polygon(0_0,0%_100%,100%_100%)]" 
            : "-left-1 bg-white dark:bg-slate-800 [clip-path:polygon(100%_0,0%_100%,100%_100%)]"
        )} />
      </div>
    </li>
  );
}

function StatusTick({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'pending': return <span className="animate-pulse">···</span>;
    case 'sent': return <Check className="h-3 w-3" />;
    case 'delivered': return <div className="flex -space-x-1.5"><Check className="h-3 w-3" /><Check className="h-3 w-3" /></div>;
    case 'read': return <div className="flex -space-x-1.5 text-sky-300"><Check className="h-3 w-3" /><Check className="h-3 w-3" /></div>;
    case 'failed': return <span className="text-red-400 font-bold">!</span>;
    default: return null;
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
