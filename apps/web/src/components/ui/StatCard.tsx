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
        'group relative overflow-hidden rounded-[32px] border-none bg-white/60 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 dark:bg-slate-900/60 dark:shadow-none',
        href && 'hover:-translate-y-1 hover:bg-white/80 hover:shadow-2xl hover:shadow-brand-500/20 dark:hover:bg-slate-800/80',
        className,
      )}
    >
      <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-br from-brand-500/10 to-sky-500/10 opacity-0 blur transition duration-500 group-hover:opacity-100" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {icon && (
              <span className="text-brand-500">{icon}</span>
            )}
            {label}
          </div>
          <div className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </div>
          {hint && (
            <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{hint}</div>
          )}
        </div>
      </div>
      
      {href && (
        <div className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-xl bg-brand-500/10 text-brand-500 opacity-0 transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );
  
  return href ? <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950 rounded-[32px]">{inner}</Link> : inner;
}
