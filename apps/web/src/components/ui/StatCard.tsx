import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  href?: string;
  hint?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, href, hint, className }: StatCardProps) {
  const inner = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all dark:border-slate-800 dark:bg-slate-900',
        href && 'hover:border-[color:var(--brand,#7c3aed)] hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </div>
          {hint && (
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div>
          )}
        </div>
        {icon && (
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
          >
            {icon}
          </div>
        )}
      </div>
      {href && (
        <div
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
