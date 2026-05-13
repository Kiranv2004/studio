import Link from 'next/link';
import { ArrowRight, Inbox, MessageSquareText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { serverFetch } from '@/lib/auth';
import { brandInitials } from '@/lib/color';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/datetime';
import type { Lead, LeadStatus } from '@/lib/types';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/lib/types';

interface ListResp {
  leads: Lead[];
  total: number;
}

interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
}

const COLUMN_CAP = 50; // leads shown per column

const COLUMN_COLORS: Record<LeadStatus, string> = {
  new:          '#0ea5e9',
  contacted:    '#7c3aed',
  trial_booked: '#f59e0b',
  member:       '#10b981',
  dropped:      '#94a3b8',
};

// Avatar palette — picked deterministically from the lead's name so the
// same person always gets the same color across visits.
const AVATAR_PALETTE = [
  '#0ea5e9', '#6366f1', '#7c3aed', '#a855f7', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6',
];

function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;

  // One stats call for column counts + one list call per status. Capped
  // small enough that this is fast even with thousands of leads. Each
  // column links to the full filtered list when it overflows.
  const [stats, ...buckets] = await Promise.all([
    serverFetch<LeadStats>(`/api/v1/studios/${studioId}/leads/stats`),
    ...LEAD_STATUSES.map((s) =>
      serverFetch<ListResp>(
        `/api/v1/studios/${studioId}/leads?status=${s}&limit=${COLUMN_CAP}`,
      ),
    ),
  ]);

  const byStatus = LEAD_STATUSES.reduce(
    (acc, status, i) => {
      acc[status] = buckets[i]?.leads ?? [];
      return acc;
    },
    {} as Record<LeadStatus, Lead[]>,
  );

  const activeCount =
    (stats.byStatus.new ?? 0) +
    (stats.byStatus.contacted ?? 0) +
    (stats.byStatus.trial_booked ?? 0);
  const memberCount = stats.byStatus.member ?? 0;
  const conversionPct =
    stats.total > 0 ? Math.round((memberCount / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Premium Pipeline Header Box */}
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Pipeline</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {stats.total} total leads · {activeCount} active in pipeline · {conversionPct}% conversion rate
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Stage Health</div>
            <div className="mt-1 text-sm font-black text-brand-600 dark:text-brand-400">Optimal Velocity</div>
          </div>
        </div>
      </div>

      {stats.total === 0 ? (
        <Card noPadding>
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="No leads yet"
            description="Once people submit a campaign form, they'll show up here grouped by status."
          />
        </Card>
      ) : (
        // Horizontal scroll on small screens; 5-column grid on xl+.
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="grid min-w-[1180px] grid-cols-5 gap-4 xl:min-w-0">
            {LEAD_STATUSES.map((status) => (
              <PipelineColumn
                key={status}
                status={status}
                count={stats.byStatus[status] ?? 0}
                leads={byStatus[status]}
                studioId={studioId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineColumn({
  status,
  count,
  leads,
  studioId,
}: {
  status: LeadStatus;
  count: number;
  leads: Lead[];
  studioId: string;
}) {
  const overflow = count - leads.length;
  const color = COLUMN_COLORS[status];

  return (
    <section
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
      aria-label={LEAD_STATUS_LABELS[status]}
    >
      {/* Color bar across the top — gives each column an instant visual
          identity even before you read the header. */}
      <div className="h-1.5" style={{ background: color }} aria-hidden />

      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: color, boxShadow: `0 0 0 3px ${color}1a` }}
          />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {LEAD_STATUS_LABELS[status]}
          </h3>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
          style={{ background: `${color}1a`, color }}
        >
          {count}
        </span>
      </header>

      {/* Card stack — subtle column tint differentiates from the white cards inside */}
      <div className="flex flex-1 flex-col gap-2 bg-slate-50/60 p-3 dark:bg-slate-900/40">
        {leads.length === 0 ? (
          <div
            className="rounded-xl border border-dashed px-3 py-8 text-center text-xs"
            style={{
              borderColor: `${color}33`,
              color: '#64748b',
              background: `${color}05`,
            }}
          >
            No leads in this stage
          </div>
        ) : (
          leads.map((l) => (
            <LeadCard key={l.id} lead={l} studioId={studioId} accent={color} />
          ))
        )}
        {overflow > 0 && (
          <Link
            href={`/admin/studios/${studioId}/leads?status=${status}`}
            className="mt-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-[color:var(--brand,#7c3aed)] hover:text-[color:var(--brand,#7c3aed)] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            +{overflow} more
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </section>
  );
}

function LeadCard({
  lead,
  studioId,
  accent,
}: {
  lead: Lead;
  studioId: string;
  accent: string;
}) {
  const av = avatarColor(lead.name);
  return (
    <Link
      href={`/admin/studios/${studioId}/leads/${lead.id}`}
      className={cn(
        'group block rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200 transition-all',
        'hover:-translate-y-0.5 hover:shadow-card-hover',
        'dark:bg-slate-950 dark:ring-slate-800',
      )}
      style={{ ['--card-accent' as string]: accent }}
    >
      {/* Top row: avatar + name + email */}
      <div className="flex items-center gap-2.5">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white shadow-sm"
          style={{ background: av }}
          aria-hidden
        >
          {brandInitials(lead.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
            {lead.name}
          </div>
          <div className="truncate text-[11px] leading-tight text-slate-500 dark:text-slate-400">
            {lead.email}
          </div>
        </div>
      </div>

      {/* Middle row: plan chip + time */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {lead.fitnessPlan}
        </span>
        <span
          className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-slate-400"
          suppressHydrationWarning
        >
          {relativeTime(lead.createdAt)}
        </span>
      </div>

      {/* Notes preview — only when present */}
      {lead.notes && (
        <div className="mt-3 flex items-start gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] leading-snug text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <MessageSquareText className="mt-px h-3 w-3 shrink-0 text-slate-400" />
          <span className="line-clamp-2">{firstLines(lead.notes)}</span>
        </div>
      )}
    </Link>
  );
}

function firstLines(s: string): string {
  const lines = s.split('\n').filter(Boolean).slice(0, 2);
  return lines.join(' · ');
}
