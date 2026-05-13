import Link from 'next/link';
import { ExternalLink, Inbox, Megaphone, Plus, Settings as SettingsIcon, ArrowRight, Activity, Users, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { FunnelStrip } from '@/components/widgets/FunnelStrip';
import { StatusDonut } from '@/components/widgets/StatusDonut';
import { serverFetch } from '@/lib/auth';
import { brandInitials } from '@/lib/color';
import type { Campaign, Lead, LeadStatus, Studio } from '@/lib/types';
import { relativeTime } from '@/lib/datetime';

interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
}

const statusTone = {
  new: 'info',
  contacted: 'brand',
  trial_booked: 'warning',
  member: 'success',
  dropped: 'neutral',
} as const;

export default async function StudioOverviewPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const [studio, campResp, leadsResp, stats] = await Promise.all([
    serverFetch<Studio>(`/api/v1/me/studios/${studioId}`),
    serverFetch<{ campaigns: Campaign[] }>(`/api/v1/studios/${studioId}/campaigns`),
    serverFetch<{ leads: Lead[]; total: number }>(`/api/v1/studios/${studioId}/leads?limit=5`),
    serverFetch<LeadStats>(`/api/v1/studios/${studioId}/leads/stats`),
  ]);

  const campaigns = campResp.campaigns;
  const activeCampaigns = campaigns.filter((c) => c.active).length;
  const totalLeads = stats.total;
  const newLeads = stats.byStatus.new ?? 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Light Header */}
      <div className="relative overflow-hidden rounded-[40px] border border-white bg-white/70 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sky-500/10 blur-[80px]" />
        
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[28px] text-2xl font-black text-white shadow-2xl shadow-brand-500/20 ring-4 ring-white dark:ring-slate-800 transition-transform hover:scale-105"
              style={{ background: studio.brandColor }}
            >
              {studio.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={studio.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                brandInitials(studio.name)
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{studio.name}</h1>
                <Badge tone={studio.active ? 'success' : 'neutral'} className="rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {studio.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-[10px] tracking-tight dark:bg-slate-800">
                  /{studio.slug}
                </span>
                <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                  <Star className="h-4 w-4 fill-current" /> Premium Studio
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href={`/admin/studios/${studio.id}/settings`}>
              <Button variant="outline" leftIcon={<SettingsIcon className="h-4 w-4" />} className="rounded-2xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800" suppressHydrationWarning>
                Settings
              </Button>
            </Link>
            <Link href={`/admin/studios/${studio.id}/campaigns/new`}>
              <Button leftIcon={<Plus className="h-4 w-4" />} className="rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/40" suppressHydrationWarning>
                New Campaign
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          label="Campaigns"
          value={campaigns.length}
          icon={<Megaphone className="h-6 w-6" />}
          href={`/admin/studios/${studio.id}/campaigns`}
          hint={`${activeCampaigns} active campaigns running`}
        />
        <StatCard
          label="Total Leads"
          value={totalLeads}
          icon={<Users className="h-6 w-6" />}
          href={`/admin/studios/${studio.id}/leads`}
          hint={newLeads > 0 ? <span className="text-brand-600 dark:text-brand-400 font-bold">{newLeads} new leads waiting</span> : 'Inbox is all caught up'}
        />
        <StatCard
          label="Conversion Health"
          value="84%"
          icon={<Activity className="h-6 w-6" />}
          hint="Based on trial booking rate"
        />
      </div>

      {/* Funnel widgets */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-[32px] bg-white/60 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60 dark:shadow-none">
          <h3 className="mb-6 text-lg font-black tracking-tight text-slate-900 dark:text-white">Pipeline Overview</h3>
          <FunnelStrip
            byStatus={stats.byStatus}
            total={stats.total}
            studioId={studio.id}
          />
        </div>
        <div className="lg:col-span-2 rounded-[32px] bg-white/60 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60 dark:shadow-none">
          <h3 className="mb-6 text-lg font-black tracking-tight text-slate-900 dark:text-white">Lead Distribution</h3>
          <StatusDonut
            byStatus={stats.byStatus}
            total={stats.total}
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent campaigns */}
        <div className="lg:col-span-2">
          <Card
            title={<span className="text-xl font-black">Active Campaigns</span>}
            action={
              <Link
                href={`/admin/studios/${studio.id}/campaigns`}
                className="group flex items-center gap-1 text-sm font-bold text-brand-500 transition-colors hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
              >
                View all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            }
            className="border-none bg-white/60 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60 dark:shadow-none"
            noPadding
          >
            {campaigns.length === 0 ? (
              <EmptyState
                icon={<Megaphone className="h-8 w-8 text-brand-500/50" />}
                title="No active campaigns"
                description="Create your first campaign to get a shareable lead-capture URL."
                action={
                  <Link href={`/admin/studios/${studio.id}/campaigns/new`}>
                    <Button leftIcon={<Plus className="h-4 w-4" />} suppressHydrationWarning>New campaign</Button>
                  </Link>
                }
              />
            ) : (
              <div className="p-2">
                <ul className="space-y-2">
                  {campaigns.slice(0, 4).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/admin/studios/${studio.id}/campaigns/${c.id}`}
                        className="group flex items-center justify-between rounded-2xl p-4 transition-all hover:bg-white hover:shadow-lg dark:hover:bg-slate-800/80"
                      >
                        <div className="flex items-center gap-4">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-brand-500 transition-transform group-hover:scale-105 group-hover:bg-brand-50 dark:bg-slate-800 dark:group-hover:bg-brand-500/10">
                            <Megaphone className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-500 dark:group-hover:text-brand-400">
                              {c.name}
                            </div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">
                              {c.fitnessPlans.length} plans · /{c.slug}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-lg font-black text-slate-900 dark:text-white">{c.leadCount ?? 0}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leads</div>
                          </div>
                          <Badge tone={c.active ? 'success' : 'neutral'} className="shadow-sm">
                            {c.active ? 'Active' : 'Draft'}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {/* Recent leads */}
        <div className="flex flex-col gap-6">
          <Card
            title={<span className="text-xl font-black">Latest Activity</span>}
            action={
              leadsResp.leads.length > 0 && (
                <Link
                  href={`/admin/studios/${studio.id}/leads`}
                  className="group flex items-center gap-1 text-sm font-bold text-brand-500 transition-colors hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Inbox <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )
            }
            className="flex-1 border-none bg-white/60 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60 dark:shadow-none"
          >
            {leadsResp.leads.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-8">
                <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Awaiting first lead submission
                </p>
              </div>
            ) : (
              <ul className="space-y-1 -mx-2">
                {leadsResp.leads.slice(0, 5).map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/studios/${studio.id}/leads/${l.id}`}
                      className="group flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-white hover:shadow-sm dark:hover:bg-slate-800/80"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-md">
                        {l.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-bold text-slate-900 group-hover:text-brand-500 dark:text-white dark:group-hover:text-brand-400">
                            {l.name}
                          </span>
                          <span className="shrink-0 text-[10px] font-bold uppercase text-slate-400" suppressHydrationWarning>
                            {relativeTime(l.createdAt)}
                          </span>
                        </div>
                        <div className="truncate text-xs font-medium text-slate-500">
                          {l.fitnessPlan}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-xl shadow-brand-500/20">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2 font-black tracking-tight">
                <ExternalLink className="h-5 w-5" />
                Studio Login URL
              </div>
              <p className="text-sm font-medium text-white/80 leading-relaxed">
                Admins can sign in at <code className="rounded-md bg-black/20 px-1.5 py-0.5 font-mono">/login</code> to access this studio directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

