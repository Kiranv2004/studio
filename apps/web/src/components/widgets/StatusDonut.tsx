// SVG donut chart for the lead status distribution. No deps; renders the
// 5 status slices with status colors, with the total in the center.

import type { LeadStatus } from '@/lib/types';
import { LEAD_STATUS_LABELS } from '@/lib/types';
import { cn } from '@/lib/cn';

export interface StatusDonutProps {
  byStatus: Record<LeadStatus, number>;
  total: number;
  className?: string;
}

const ORDER: LeadStatus[] = ['new', 'contacted', 'trial_booked', 'member', 'dropped'];

const COLORS: Record<LeadStatus, string> = {
  new:          '#0ea5e9',
  contacted:    'var(--brand, #7c3aed)',
  trial_booked: '#f59e0b',
  member:       '#10b981',
  dropped:      '#94a3b8',
};

export function StatusDonut({ byStatus, total, className }: StatusDonutProps) {
  // SVG geometry
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 64;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * r;

  let cursor = 0;

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900', className)}>
      <div className="mb-4">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Status mix
        </div>
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Where every lead currently stands
        </div>
      </div>

      <div className="grid items-center gap-5 sm:grid-cols-[auto,1fr]">
        <div className="relative grid place-items-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            {/* Track */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-slate-100 dark:stroke-slate-800"
            />
            {total > 0 &&
              ORDER.map((status) => {
                const count = byStatus[status] ?? 0;
                if (count === 0) return null;
                const length = (count / total) * circumference;
                const dasharray = `${length} ${circumference - length}`;
                const dashoffset = -cursor;
                cursor += length;
                return (
                  <circle
                    key={status}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={COLORS[status]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dasharray}
                    strokeDashoffset={dashoffset}
                    strokeLinecap="butt"
                  />
                );
              })}
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {total}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Leads
              </div>
            </div>
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          {ORDER.map((status) => {
            const count = byStatus[status] ?? 0;
            const sharePct = total === 0 ? 0 : Math.round((count / total) * 100);
            return (
              <li key={status} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: COLORS[status] }}
                  />
                  <span className="truncate">{LEAD_STATUS_LABELS[status]}</span>
                </span>
                <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{count}</span>
                  <span className="ml-1 text-xs text-slate-400">{sharePct}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
