'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Home,
  Inbox,
  KanbanSquare,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  MessagesSquare,
  Plug,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { brandInitials, withAlpha } from '@/lib/color';
import { cn } from '@/lib/cn';
import type { Me } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  match?: (pathname: string) => boolean;
}

function navItemsFor(me: Me): NavItem[] {
  if (me.role === 'super_admin') {
    return [
      {
        href: '/admin/studios',
        label: 'Studios',
        icon: <Building2 className="h-[18px] w-[18px]" />,
        match: (p) => p === '/admin/studios' || p.startsWith('/admin/studios/'),
      },
    ];
  }
  const sid = me.studioId!;
  const base = `/admin/studios/${sid}`;
  return [
    { href: base,                 label: 'Dashboard', icon: <Home className="h-[18px] w-[18px]" />,           match: (p) => p === base },
    { href: `${base}/inbox`,      label: 'Inbox',     icon: <MessagesSquare className="h-[18px] w-[18px]" />, match: (p) => p.startsWith(`${base}/inbox`) },
    { href: `${base}/pipeline`,   label: 'Pipeline',  icon: <KanbanSquare className="h-[18px] w-[18px]" />,   match: (p) => p.startsWith(`${base}/pipeline`) },
    { href: `${base}/campaigns`,  label: 'Campaigns', icon: <Megaphone className="h-[18px] w-[18px]" />,      match: (p) => p.startsWith(`${base}/campaigns`) },
    { href: `${base}/leads`,      label: 'Leads',     icon: <Inbox className="h-[18px] w-[18px]" />,          match: (p) => p.startsWith(`${base}/leads`) },
    { href: `${base}/channels`,   label: 'Channels',  icon: <Plug className="h-[18px] w-[18px]" />,           match: (p) => p.startsWith(`${base}/channels`) },
    { href: `${base}/settings`,   label: 'Settings',  icon: <Settings className="h-[18px] w-[18px]" />,       match: (p) => p.startsWith(`${base}/settings`) },
  ];
}

export function AppShell({ me, children }: { me: Me; children: ReactNode }) {
  const isStudio = me.role === 'studio_admin' && !!me.studio;
  const brand = isStudio ? me.studio!.brandColor : '#7c3aed';

  // All hooks must run unconditionally — keep them above the lockout branch.
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close the drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileOpen]);

  const themeStyle: CSSProperties = {
    ['--brand' as string]: brand,
    ['--brand-soft' as string]: withAlpha(brand, 0.08),
    ['--brand-softer' as string]: withAlpha(brand, 0.16),
    ['--brand-onbrand' as string]: '#ffffff',
  };

  // Studio-admin of an inactive studio: full-screen lockout. The backend
  // also 403s every studio-scoped endpoint with `studio_inactive`; this is
  // the matching UX wrapper. Super-admin always sees the normal shell.
  if (isStudio && me.studio!.active === false) {
    return <StudioInactiveScreen me={me} />;
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
      style={themeStyle}
    >
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <div className="lg:flex">
        <Sidebar me={me} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar me={me} onMenuClick={() => setMobileOpen(true)} />
          <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-brand-500/5 blur-[120px] animate-pulse-soft" />
              <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-sky-500/5 blur-[120px] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  me,
  mobileOpen,
  onClose,
}: {
  me: Me;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = navItemsFor(me);
  const isStudio = me.role === 'studio_admin' && !!me.studio;
  const studio = isStudio ? me.studio! : null;

  return (
    <aside
      className={cn(
        // Mobile: fixed drawer that slides in from the left
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white/80 px-4 py-5 backdrop-blur-xl transition-all duration-300 ease-out',
        'dark:border-slate-800 dark:bg-slate-950/80',
        // Desktop: sticky in flow, always visible
        'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none lg:transition-all',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
      )}
      aria-label="Primary navigation"
    >
      {/* Mobile-only close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label="Close menu"
        suppressHydrationWarning
      >
        <X className="h-4 w-4" />
      </button>

      {/* Brand block */}
      {isStudio ? (
        <div className="mb-7 flex animate-in items-center gap-3" style={{ animationDelay: '100ms' }}>
          <div
            className="grid h-12 w-12 shrink-0 animate-float place-items-center overflow-hidden rounded-2xl text-sm font-bold text-white shadow-lg shadow-brand-500/20 ring-4 ring-[var(--brand-soft)]"
            style={{ background: studio!.brandColor }}
          >
            {studio!.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={studio!.logoUrl} alt="" className="h-12 w-12 object-cover" />
            ) : (
              brandInitials(studio!.name)
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
              {studio!.name}
            </div>
            <div className="truncate font-mono text-[11px] font-medium text-slate-500">
              /{studio!.slug}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-7 flex animate-in items-center gap-3" style={{ animationDelay: '100ms' }}>
          <div className="grid h-12 w-12 shrink-0 animate-float place-items-center rounded-2xl bg-gradient-to-br from-brand-300 via-brand-primary to-brand-700 text-sm font-extrabold text-white shadow-lg shadow-brand-500/20 ring-4 ring-brand-100 dark:ring-brand-900/30">
            1H
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
              1herosocial.ai
            </div>
            <div className="text-[11px] font-medium text-slate-500">Platform admin</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {items.map((item, idx) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex animate-in items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
                active
                  ? 'text-[color:var(--brand)] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 hover:pl-4 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100',
              )}
              style={{
                animationDelay: `${150 + idx * 50}ms`,
                ...(active ? { background: 'var(--brand-soft)', color: 'var(--brand)' } : {}),
              }}
            >
              <span className={cn('shrink-0 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12', active && '[&>svg]:stroke-[2.5]')}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="mt-6 animate-in rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-500 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" />
          Tip
        </div>
        <p className="mt-1.5 leading-relaxed">
          {isStudio
            ? 'Drop your campaign link in your Instagram bio to start collecting leads.'
            : 'Studios sign in at the same /login URL — their account routes them to their own dashboard.'}
        </p>
      </div>
    </aside>
  );
}

function Topbar({ me, onMenuClick }: { me: Me; onMenuClick: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    try {
      await api('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/70 px-4 backdrop-blur-xl sm:px-6 lg:justify-end lg:px-10 dark:border-slate-800 dark:bg-slate-950/70">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label="Open menu"
        suppressHydrationWarning
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 rounded-2xl p-1 pr-3 transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          suppressHydrationWarning
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-lg ring-2 ring-white dark:ring-slate-900">
            {(me.email[0] ?? '').toUpperCase()}
          </div>
          <div className="hidden flex-col items-start sm:flex">
            <span className="max-w-[150px] truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {me.email.split('@')[0]}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {me.role.replace('_', ' ')}
            </span>
          </div>
          <Menu className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", open && "rotate-90")} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-3 w-64 animate-in overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 z-20">
              <div className="border-b border-slate-100 p-5 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-lg font-bold text-white">
                    {(me.email[0] ?? '').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{me.email.split('@')[0]}</div>
                    <div className="truncate text-xs text-slate-500">{me.email}</div>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  suppressHydrationWarning
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

// Full-screen lockout for studio-admins whose studio has been deactivated.
// Mirrors the backend 403 — they can sign out, but cannot navigate anywhere
// in the admin. Super-admins never see this (their AppShell branch skips it).
function StudioInactiveScreen({ me }: { me: Me }) {
  const router = useRouter();
  const studio = me.studio!;

  async function logout() {
    try {
      await api('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-slate-900/5 text-slate-500 dark:bg-slate-50/5 dark:text-slate-400">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {studio.name} is inactive
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          The platform admin has paused this studio. You can&rsquo;t access campaigns,
          leads, or settings until it&rsquo;s reactivated. Reach out to your platform
          admin if you think this is a mistake.
        </p>
        <div className="mt-8">
          <Button variant="outline" onClick={logout} leftIcon={<LogOut className="h-4 w-4" />} suppressHydrationWarning>
            Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}
