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
    <div className="animate-in">
      <PageHeader
        title="Studios"
        description="Each studio is a tenant — its own admins, campaigns, leads, branding, and lead-capture URLs."
        actions={
          <Link href="/admin/studios/new">
            <Button leftIcon={<Plus className="h-4 w-4" />} suppressHydrationWarning>New studio</Button>
          </Link>
        }
      />

      {studios.length === 0 ? (
        <Card noPadding elevated>
          <EmptyState
            icon={<Building2 className="h-8 w-8" />}
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
          <div className="mb-8 grid gap-6 sm:grid-cols-3">
            <SummaryTile label="Studios" value={studios.length} hint={`${activeCount} active`} delay="100ms" />
            <SummaryTile label="Total campaigns" value={totalCampaigns} delay="200ms" />
            <SummaryTile label="Total leads" value={totalLeads} delay="300ms" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {studios.map((s, idx) => (
              <StudioCard key={s.id} studio={s} delay={`${400 + idx * 50}ms`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryTile({ label, value, hint, delay }: { label: string; value: number; hint?: string; delay: string }) {
  return (
    <div 
      className="animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900"
      style={{ animationDelay: delay }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </span>
        {hint && <span className="text-xs font-medium text-brand-600 dark:text-brand-400">{hint}</span>}
      </div>
    </div>
  );
}

function StudioCard({ studio: s, delay }: { studio: Studio; delay: string }) {
  return (
    <Link 
      href={`/admin/studios/${s.id}`} 
      className="group block animate-in focus:outline-none"
      style={{ animationDelay: delay }}
    >
      <div className="relative h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:rotate-[0.5deg] hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900">
        {/* Brand-color accent strip */}
        <div className="h-2.5 w-full opacity-80" style={{ background: s.brandColor }} />
        
        <div className="p-7">
          <div className="flex items-start gap-5">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl text-xl font-bold text-white shadow-xl ring-4 ring-slate-50 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 dark:ring-slate-800/50"
              style={{ background: s.brandColor }}
            >
              {s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt="" className="h-14 w-14 object-cover" />
              ) : (
                brandInitials(s.name)
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {s.name}
                </h3>
                <Badge tone={s.active ? 'success' : 'neutral'}>
                  {s.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                /{s.slug}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800/60">
            <div className="flex gap-6">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {s.campaignCount ?? 0}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Campaigns</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {s.leadCount ?? 0}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Leads</span>
              </div>
            </div>
            
            <div className="rounded-full bg-slate-50 p-2 text-slate-400 transition-colors group-hover:bg-brand-50 group-hover:text-brand-500 dark:bg-slate-800 dark:text-slate-500">
              <Plus className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
