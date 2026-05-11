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
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
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
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-200 ease-out',
        'dark:border-slate-800 dark:bg-slate-950',
        // Desktop: sticky in flow, always visible
        'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none lg:transition-none',
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
      >
        <X className="h-4 w-4" />
      </button>

      {/* Brand block */}
      {isStudio ? (
        <div className="mb-7 flex items-center gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-bold text-white shadow-sm"
            style={{ background: studio!.brandColor }}
          >
            {studio!.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={studio!.logoUrl} alt="" className="h-10 w-10 object-cover" />
            ) : (
              brandInitials(studio!.name)
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {studio!.name}
            </div>
            <div className="truncate font-mono text-[11px] text-slate-500">
              /{studio!.slug}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-300 via-brand-primary to-brand-700 text-sm font-extrabold text-white shadow-sm ring-1 ring-white/20">
            1H
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              1herosocial.ai
            </div>
            <div className="text-[11px] font-medium text-slate-500">Platform admin</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'text-[color:var(--brand)]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
              )}
              style={
                active
                  ? { background: 'var(--brand-soft)', color: 'var(--brand)' }
                  : undefined
              }
            >
              <span className={cn('shrink-0', active && '[&>svg]:stroke-[2.5]')}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
          <Sparkles className="h-3.5 w-3.5" />
          Tip
        </div>
        <p className="mt-1 leading-snug">
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

  async function logout() {
    try {
      await api('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:justify-end lg:px-10 dark:border-slate-800 dark:bg-slate-950/85">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 text-sm sm:gap-3">
        <span className="hidden truncate text-slate-500 sm:inline-block dark:text-slate-400">
          {me.email}
        </span>
        <Button variant="ghost" size="sm" onClick={logout} leftIcon={<LogOut className="h-4 w-4" />}>
          <span className="hidden sm:inline">Sign out</span>
        </Button>
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
          <Button variant="outline" onClick={logout} leftIcon={<LogOut className="h-4 w-4" />}>
            Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}
