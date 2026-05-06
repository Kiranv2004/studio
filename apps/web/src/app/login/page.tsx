'use client';

import { useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { ArrowRight, Building2, Inbox, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FieldError, Label } from '@/components/ui/Label';
import { ApiError, api } from '@/lib/api';
import { withAlpha } from '@/lib/color';
import type { Me } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Once we know who logged in we can briefly preview their studio brand on the
  // form so the transition into the themed dashboard isn't a jarring color flip.
  const [postBrand, setPostBrand] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const me = await api<Me>('/api/v1/auth/login', {
        method: 'POST',
        json: { email, password },
      });
      if (me.role === 'studio_admin' && me.studioId) {
        setPostBrand(me.studio?.brandColor ?? null);
        router.push(`/admin/studios/${me.studioId}`);
      } else {
        router.push('/admin/studios');
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Could not sign in. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Keep the form's primary button accent on the platform brand by default;
  // swap to the studio's brand once we know it (right before navigation).
  const themeStyle: CSSProperties = postBrand
    ? ({
        ['--brand' as string]: postBrand,
        ['--brand-soft' as string]: withAlpha(postBrand, 0.08),
        ['--brand-softer' as string]: withAlpha(postBrand, 0.16),
        ['--brand-onbrand' as string]: '#ffffff',
      } as CSSProperties)
    : {};

  return (
    <main className="min-h-screen w-full bg-white text-slate-900" style={themeStyle}>
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[1.1fr,1fr] xl:grid-cols-[1.2fr,1fr]">
        {/* Hero (hidden on mobile to save vertical space) */}
        <section className="relative hidden overflow-hidden bg-slate-950 text-slate-100 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 60% at 15% 0%, rgba(124,58,237,0.55) 0%, rgba(15,23,42,0) 60%), radial-gradient(60% 60% at 95% 90%, rgba(76,29,149,0.55) 0%, rgba(15,23,42,0) 60%)',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-300 via-brand-primary to-brand-700 text-sm font-extrabold text-white shadow-xl ring-1 ring-white/20">
                1H
              </div>
              <div className="text-base font-bold tracking-tight">1herosocial.ai</div>
            </div>

            <h1 className="mt-16 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl xl:text-6xl">
              The AI-run marketing OS for fitness studios.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400">
              Onboard studios in minutes. Generate campaigns, capture leads in a
              shared inbox, and ship them straight into your spreadsheet — all
              from one console.
            </p>
          </div>

          <div className="relative mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Feature icon={<Building2 className="h-4 w-4" />} title="Multi-studio" body="Each studio is its own tenant with branded URLs." />
            <Feature icon={<Inbox className="h-4 w-4" />} title="Lead inbox" body="Form submissions land in Postgres + Sheets, never lost." />
            <Feature icon={<Sparkles className="h-4 w-4" />} title="Per-studio brand" body="Each studio's color and logo render on the public form." />
          </div>
        </section>

        {/* Form */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile-only logo header */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-300 via-brand-primary to-brand-700 text-sm font-extrabold text-white shadow-sm ring-1 ring-white/20">
                1H
              </div>
              <div className="text-sm font-bold tracking-tight">1herosocial.ai</div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Welcome back. Enter your email and password to continue.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <FieldError message={error ?? undefined} />
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={submitting}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Sign in
              </Button>
            </form>

            <p className="mt-10 text-xs leading-relaxed text-slate-500">
              Studio admins and platform admins both sign in here — your account
              determines what you see next.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-brand-300">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}
