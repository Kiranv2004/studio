import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  // primary uses CSS variables --brand / --brand-onbrand set by <AppShell>.
  // Falls back to the platform violet when no theme scope is in effect.
  primary: cn(
    'bg-[var(--brand,#7c3aed)] text-[color:var(--brand-onbrand,#fff)] shadow-sm',
    'hover:opacity-95 hover:shadow-card',
    'active:opacity-90',
  ),
  secondary: cn(
    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
    'hover:bg-slate-200 dark:hover:bg-slate-700',
  ),
  ghost: cn(
    'bg-transparent text-slate-700 dark:text-slate-200',
    'hover:bg-slate-100 dark:hover:bg-slate-800',
  ),
  outline: cn(
    'bg-transparent text-slate-700 dark:text-slate-200',
    'border border-slate-300 dark:border-slate-700',
    'hover:bg-slate-50 dark:hover:bg-slate-800/60',
    'hover:border-[var(--brand,#7c3aed)]',
  ),
  danger: cn(
    'bg-red-600 text-white shadow-sm',
    'hover:bg-red-700',
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    children,
    className,
    type = 'button',
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap select-none',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand,#7c3aed)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner className="h-4 w-4" /> : leftIcon ? <span className="flex shrink-0 items-center">{leftIcon}</span> : null}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="flex shrink-0 items-center">{rightIcon}</span>}
    </button>
  );
});

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}
