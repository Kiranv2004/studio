import Link from 'next/link';
import { ExternalLink, Inbox, Megaphone, Plus, Settings as SettingsIcon } from 'lucide-react';
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
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl text-sm font-bold text-white shadow-sm"
              style={{ background: studio.brandColor }}
            >
              {studio.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={studio.logoUrl} alt="" className="h-10 w-10 object-cover" />
              ) : (
                brandInitials(studio.name)
              )}
            </span>
            {studio.name}
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-500">/{studio.slug}</span>
            <span className="text-slate-300">·</span>
            <Badge tone={studio.active ? 'success' : 'neutral'}>
              {studio.active ? 'Active' : 'Inactive'}
            </Badge>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/admin/studios/${studio.id}/settings`}>
              <Button variant="outline" leftIcon={<SettingsIcon className="h-4 w-4" />}>
                Settings
              </Button>
            </Link>
            <Link href={`/admin/studios/${studio.id}/campaigns/new`}>
              <Button leftIcon={<Plus className="h-4 w-4" />}>New campaign</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Campaigns"
          value={campaigns.length}
          icon={<Megaphone className="h-5 w-5" />}
          href={`/admin/studios/${studio.id}/campaigns`}
          hint={`${activeCampaigns} active`}
        />
        <StatCard
          label="Leads"
          value={totalLeads}
          icon={<Inbox className="h-5 w-5" />}
          href={`/admin/studios/${studio.id}/leads`}
          hint={newLeads > 0 ? `${newLeads} awaiting first touch` : 'all caught up'}
        />
        <StatCard
          label="Brand"
          value={
            <span className="flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700"
                style={{ background: studio.brandColor }}
              />
              <span className="font-mono text-base">{studio.brandColor}</span>
            </span>
          }
          href={`/admin/studios/${studio.id}/settings`}
          hint="Edit logo & color"
        />
      </div>

      {/* Funnel widgets — visualize the pipeline at a glance. */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <FunnelStrip
          byStatus={stats.byStatus}
          total={stats.total}
          studioId={studio.id}
          className="lg:col-span-3"
        />
        <StatusDonut
          byStatus={stats.byStatus}
          total={stats.total}
          className="lg:col-span-2"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent campaigns */}
        <div className="lg:col-span-2">
          <Card
            title="Recent campaigns"
            action={
              <Link
                href={`/admin/studios/${studio.id}/campaigns`}
                className="text-sm font-medium text-[color:var(--brand,#7c3aed)] hover:underline"
              >
                View all →
              </Link>
            }
            noPadding
          >
            {campaigns.length === 0 ? (
              <EmptyState
                icon={<Megaphone className="h-5 w-5" />}
                title="No campaigns yet"
                description="Create your first campaign to get a shareable lead-capture URL."
                action={
                  <Link href={`/admin/studios/${studio.id}/campaigns/new`}>
                    <Button leftIcon={<Plus className="h-4 w-4" />}>New campaign</Button>
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Plans</th>
                    <th className="px-5 py-3 font-medium">Leads</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 6).map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/studios/${studio.id}/campaigns/${c.id}`}
                          className="font-medium text-slate-900 hover:text-[color:var(--brand,#7c3aed)] dark:text-slate-100"
                        >
                          {c.name}
                        </Link>
                        <div className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                          /{c.slug}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {c.fitnessPlans.slice(0, 2).join(', ')}
                        {c.fitnessPlans.length > 2 && (
                          <span className="text-slate-400"> +{c.fitnessPlans.length - 2}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {c.leadCount ?? 0}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={c.active ? 'success' : 'neutral'}>
                          {c.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </Card>
        </div>

        {/* Recent leads */}
        <div>
          <Card
            title="Latest leads"
            action={
              leadsResp.leads.length > 0 && (
                <Link
                  href={`/admin/studios/${studio.id}/leads`}
                  className="text-sm font-medium text-[color:var(--brand,#7c3aed)] hover:underline"
                >
                  Open inbox →
                </Link>
              )
            }
          >
            {leadsResp.leads.length === 0 ? (
              <p className="py-2 text-sm text-slate-500 dark:text-slate-400">
                Submissions will show up here.
              </p>
            ) : (
              <ul className="space-y-3">
                {leadsResp.leads.slice(0, 5).map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/studios/${studio.id}/leads/${l.id}`}
                      className="flex items-start justify-between gap-3 rounded-lg p-2 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {l.name}
                        </div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {l.fitnessPlan} · {l.email}
                        </div>
                      </div>
                      <Badge tone={statusTone[l.status]}>{l.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
            <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
              <ExternalLink className="h-3.5 w-3.5" />
              How studio admins sign in
            </div>
            <p className="mt-1.5 leading-snug">
              Studio admins use the same{' '}
              <code className="font-mono text-slate-700 dark:text-slate-200">/login</code>
              {' '}URL — their account routes them straight to this studio after login.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
