// Horizontal-bar visualization of lead counts at each funnel stage.
// Pure SVG/CSS — no charts library. Each row's bar width is proportional
// to the largest stage so you can read the shape at a glance.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LeadStatus } from '@/lib/types';
import { LEAD_STATUS_LABELS } from '@/lib/types';

export interface FunnelStripProps {
  byStatus: Record<LeadStatus, number>;
  total: number;
  /** Studio id for the "Open pipeline →" link. */
  studioId: string;
  className?: string;
}

// Order matters: visual top-to-bottom of the funnel.
const ORDER: LeadStatus[] = ['new', 'contacted', 'trial_booked', 'member', 'dropped'];

const COLORS: Record<LeadStatus, string> = {
  new:          '#0ea5e9', // sky
  contacted:    'var(--brand, #7c3aed)',
  trial_booked: '#f59e0b', // amber
  member:       '#10b981', // emerald
  dropped:      '#94a3b8', // slate
};

export function FunnelStrip({ byStatus, total, studioId, className }: FunnelStripProps) {
  const max = Math.max(1, ...ORDER.map((s) => byStatus[s] ?? 0));

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900', className)}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pipeline at a glance
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {total} <span className="text-sm font-normal text-slate-500">leads total</span>
          </div>
        </div>
        <Link
          href={`/admin/studios/${studioId}/pipeline`}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[color:var(--brand,#7c3aed)] hover:bg-[color:var(--brand-soft,rgba(124,58,237,0.08))]"
        >
          Open pipeline
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="space-y-2.5">
        {ORDER.map((status) => {
          const count = byStatus[status] ?? 0;
          const pct = (count / max) * 100;
          const sharePct = total === 0 ? 0 : Math.round((count / total) * 100);
          return (
            <li key={status} className="grid grid-cols-[7rem,1fr,3.5rem] items-center gap-3 sm:grid-cols-[8rem,1fr,4.5rem]">
              <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                {LEAD_STATUS_LABELS[status]}
              </span>
              <div className="relative h-6 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                <div
                  className="absolute inset-y-0 left-0 rounded-md transition-all"
                  style={{ width: `${pct}%`, background: COLORS[status] }}
                />
              </div>
              <span className="text-right text-xs tabular-nums text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{count}</span>
                <span className="ml-1 text-slate-400">{sharePct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
