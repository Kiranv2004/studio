'use client';

import { useState, type ReactNode } from 'react';
import { Clock, Plug } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { ChannelAccount, ChannelKind } from '@/lib/types';
import { ChannelList } from './ChannelList';
import { ConnectWhatsApp } from './ConnectWhatsApp';

interface TabDef {
  kind: ChannelKind;
  label: string;
  brand: string; // brand color for the tab pill
  status: 'available' | 'coming_soon';
  comingSoonNote?: ReactNode;
}

const TABS: TabDef[] = [
  {
    kind: 'whatsapp_meta',
    label: 'WhatsApp',
    brand: '#25D366',
    status: 'available',
  },
  {
    kind: 'instagram_meta',
    label: 'Instagram DMs',
    brand: '#E1306C',
    status: 'coming_soon',
    comingSoonNote: (
      <>
        Same Meta Graph API as WhatsApp — adapter is wired in the backend
        (channel kind <code className="font-mono text-xs">instagram_meta</code> already in
        the schema). Needs Meta App Review for{' '}
        <code className="font-mono text-xs">instagram_basic</code> +{' '}
        <code className="font-mono text-xs">instagram_manage_messages</code> scopes
        before studios can connect a real IG Business account.
      </>
    ),
  },
  {
    kind: 'messenger_meta',
    label: 'Facebook Messenger',
    brand: '#0084FF',
    status: 'coming_soon',
    comingSoonNote: (
      <>
        Connects a Facebook Page's Messenger inbox. Needs Meta App Review for{' '}
        <code className="font-mono text-xs">pages_messaging</code> +{' '}
        <code className="font-mono text-xs">pages_show_list</code>. Will land
        right after Instagram since both share the Graph API plumbing.
      </>
    ),
  },
  {
    kind: 'x_dm',
    label: 'X (Twitter) DMs',
    brand: '#000000',
    status: 'coming_soon',
    comingSoonNote: (
      <>
        X moved to pay-per-use in Feb 2026 (~$0.01 per outbound DM). We&rsquo;ll
        wire this after Meta channels are live and per-studio volume justifies
        the cost.
      </>
    ),
  },
];

export function ChannelTabs({
  studioId,
  channels,
}: {
  studioId: string;
  channels: ChannelAccount[];
}) {
  const [active, setActive] = useState<ChannelKind>('whatsapp_meta');
  const activeTab = TABS.find((t) => t.kind === active)!;
  const channelsForTab = channels.filter((c) => c.kind === active);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => {
          const isActive = t.kind === active;
          const connectedCount = channels.filter((c) => c.kind === t.kind).length;
          return (
            <button
              key={t.kind}
              type="button"
              onClick={() => setActive(t.kind)}
              className={cn(
                'group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: t.brand }}
              />
              {t.label}
              {connectedCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {connectedCount}
                </span>
              )}
              {t.status === 'coming_soon' && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Soon
                </span>
              )}
              {isActive && (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                  style={{ background: t.brand }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab.status === 'available' ? (
        <AvailablePanel
          studioId={studioId}
          channels={channelsForTab}
          kind={activeTab.kind}
          label={activeTab.label}
        />
      ) : (
        <ComingSoonPanel tab={activeTab} />
      )}
    </div>
  );
}

function AvailablePanel({
  studioId,
  channels,
  kind,
  label,
}: {
  studioId: string;
  channels: ChannelAccount[];
  kind: ChannelKind;
  label: string;
}) {
  // For Phase A only WhatsApp is "available" — the form is WhatsApp-specific.
  // When IG/Messenger ship, swap on `kind` to render the right Connect form.
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {channels.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Plug className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No {label} accounts connected yet
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Connect your {label} account to start receiving messages and collect leads directly into this studio.
              </p>
              <div className="mt-4">
                <Button onClick={() => document.getElementById('connect-whatsapp')?.scrollIntoView({ behavior: 'smooth' })}>
                  Connect WhatsApp
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <ChannelList studioId={studioId} channels={channels} />
        )}
      </div>
      <div className="space-y-6">
        {kind === 'whatsapp_meta' && <ConnectWhatsApp studioId={studioId} />}
      </div>
    </div>
  );
}

function ComingSoonPanel({ tab }: { tab: TabDef }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <div className="flex items-start gap-4 py-2">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm"
              style={{ background: tab.brand }}
            >
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {tab.label} — coming next
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {tab.comingSoonNote}
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Once this channel is wired, conversations will appear in the
                same Inbox alongside your WhatsApp threads — same identity
                stitching, same composer, same automation hooks.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Card title="What you can do today">
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-2">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>Connect WhatsApp now to start collecting leads</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>Use the campaign share link in your Instagram/FB bio — submissions land in Leads regardless</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>Subscribe in your launch checklist — we&rsquo;ll email when this channel ships</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
