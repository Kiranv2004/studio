import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

// Intentionally NOT extending HTMLAttributes — DOM `title` is `string`, ours is ReactNode.
export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  elevated?: boolean;
  glass?: boolean;
  noPadding?: boolean;
  className?: string;
  children?: ReactNode;
  id?: HTMLAttributes<HTMLDivElement>['id'];
}

export function Card({
  title, subtitle, action, footer, elevated = false, glass = false, noPadding = false,
  className, children, id,
}: CardProps) {
  return (
    <div
      id={id}
      className={cn(
        'rounded-2xl transition-all duration-300',
        glass ? 'glass' : 'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        elevated ? 'shadow-card-hover scale-[1.01]' : 'shadow-card',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800/60">
          <div className="min-w-0">
            {title && (
              <h3 className="text-base font-bold leading-tight text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(noPadding ? '' : 'p-6')}>{children}</div>
      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4 dark:border-slate-800/60 dark:bg-slate-900/30">
          {footer}
        </div>
      )}
    </div>
  );
}
