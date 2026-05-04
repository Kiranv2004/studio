import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { brandInitials } from '@/lib/color';
import { serverFetch } from '@/lib/auth';
import type { Studio } from '@/lib/types';

interface ListResp {
  studios: Studio[];
}

export default async function StudiosListPage() {
  const { studios } = await serverFetch<ListResp>('/api/v1/admin/studios');

  const totalCampaigns = studios.reduce((sum, s) => sum + (s.campaignCount ?? 0), 0);
  const totalLeads = studios.reduce((sum, s) => sum + (s.leadCount ?? 0), 0);
  const activeCount = studios.filter((s) => s.active).length;

  return (
    <>
      <PageHeader
        title="Studios"
        description="Each studio is a tenant — its own admins, campaigns, leads, branding, and lead-capture URLs."
        actions={
          <Link href="/admin/studios/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New studio</Button>
          </Link>
        }
      />

      {studios.length === 0 ? (
        <Card noPadding>
          <EmptyState
            icon={<Building2 className="h-5 w-5" />}
            title="No studios yet"
            description="Create the first studio to onboard a vendor onto the platform."
            action={
              <Link href="/admin/studios/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>Create studio</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Summary strip */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <SummaryTile label="Studios" value={studios.length} hint={`${activeCount} active`} />
            <SummaryTile label="Total campaigns" value={totalCampaigns} />
            <SummaryTile label="Total leads" value={totalLeads} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {studios.map((s) => (
              <StudioCard key={s.id} studio={s} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function SummaryTile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </span>
        {hint && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </div>
    </div>
  );
}

function StudioCard({ studio: s }: { studio: Studio }) {
  return (
    <Link href={`/admin/studios/${s.id}`} className="group block focus:outline-none">
      <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900">
        {/* Brand-color accent strip */}
        <div className="h-1.5 w-full" style={{ background: s.brandColor }} />
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-base font-bold text-white shadow-sm"
              style={{ background: s.brandColor }}
            >
              {s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt="" className="h-12 w-12 object-cover" />
              ) : (
                brandInitials(s.name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                  {s.name}
                </h3>
                <Badge tone={s.active ? 'success' : 'neutral'}>
                  {s.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-0.5 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                /{s.slug}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/60 dark:text-slate-400">
            <span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {s.campaignCount ?? 0}
              </span>{' '}
              campaigns
            </span>
            <span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {s.leadCount ?? 0}
              </span>{' '}
              leads
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
