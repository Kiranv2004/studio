'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/datetime';
import type { ChannelAccount, ChannelKind, ChannelStatus } from '@/lib/types';

const KIND_LABELS: Record<ChannelKind, string> = {
  whatsapp_meta: 'WhatsApp',
  instagram_meta: 'Instagram DMs',
  messenger_meta: 'Facebook Messenger',
  x_dm: 'X DMs',
};

const STATUS_TONE: Record<ChannelStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  error: 'danger',
  disconnected: 'neutral',
};

export function ChannelList({ studioId, channels }: { studioId: string; channels: ChannelAccount[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function disconnect(id: string) {
    if (!confirm('Disconnect this channel? Inbound messages will stop arriving and you won\'t be able to send.')) {
      return;
    }
    setPendingId(id);
    try {
      await api(`/api/v1/studios/${studioId}/messaging/channels/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card title="Connected channels" noPadding>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {channels.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {KIND_LABELS[c.kind]}
                </span>
                <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
              </div>
              <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                {c.displayHandle} · connected {formatDate(c.connectedAt)}
              </div>
              {c.status === 'error' && c.lastError && (
                <div className="mt-2 truncate text-xs text-red-600 dark:text-red-400" title={c.lastError}>
                  {c.lastError}
                </div>
              )}
            </div>
            {c.status !== 'disconnected' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnect(c.id)}
                loading={pendingId === c.id}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
