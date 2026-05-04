import Link from 'next/link';
import { ArrowRight, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { serverFetch } from '@/lib/auth';
import { cn } from '@/lib/cn';
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
  contacted:    'var(--brand, #7c3aed)',
  trial_booked: '#f59e0b',
  member:       '#10b981',
  dropped:      '#94a3b8',
};

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;

  // One stats call for column counts, plus one list call per status — capped
  // small enough that this is fast even with thousands of leads. Each column
  // links to the full filtered list when it overflows.
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

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Every lead, grouped by where they are in the funnel. Click a card to update status or add notes."
      />

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
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="grid min-w-[1100px] grid-cols-5 gap-4 xl:min-w-0">
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
    </>
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
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: COLUMN_COLORS[status] }}
          />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {LEAD_STATUS_LABELS[status]}
          </span>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
          {count}
        </span>
      </div>

      {/* Card stack */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {leads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
            No leads
          </div>
        ) : (
          leads.map((l) => <LeadCard key={l.id} lead={l} studioId={studioId} />)
        )}
        {overflow > 0 && (
          <Link
            href={`/admin/studios/${studioId}/leads?status=${status}`}
            className="mt-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-[color:var(--brand,#7c3aed)] hover:text-[color:var(--brand,#7c3aed)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            +{overflow} more
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, studioId }: { lead: Lead; studioId: string }) {
  return (
    <Link
      href={`/admin/studios/${studioId}/leads/${lead.id}`}
      className={cn(
        'group block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all',
        'hover:-translate-y-0.5 hover:border-[color:var(--brand,#7c3aed)] hover:shadow-card-hover',
        'dark:border-slate-800 dark:bg-slate-950',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {lead.name}
          </div>
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
            {lead.email}
          </div>
        </div>
        <Badge tone="neutral" className="shrink-0">
          {lead.fitnessPlan}
        </Badge>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>{relativeTime(lead.createdAt)}</span>
        {lead.notes && (
          <span
            className="truncate text-slate-400"
            title={lead.notes}
          >
            📝 {firstLine(lead.notes)}
          </span>
        )}
      </div>
    </Link>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function firstLine(s: string): string {
  const line = s.split('\n')[0] ?? '';
  return line.length > 32 ? line.slice(0, 31) + '…' : line;
}
