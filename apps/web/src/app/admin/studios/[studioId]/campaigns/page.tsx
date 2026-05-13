import Link from 'next/link';
import { Megaphone, Plus, Users, Link as LinkIcon, ExternalLink, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { serverFetch } from '@/lib/auth';
import type { Campaign } from '@/lib/types';
import { CopyLink } from './CopyLink';
import { cn } from '@/lib/cn';

interface ListResp {
  campaigns: Campaign[];
}

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const { campaigns } = await serverFetch<ListResp>(`/api/v1/studios/${studioId}/campaigns`);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campaigns"
        description="Each campaign generates a unique lead-capture link you can drop in an Instagram bio or ad."
        actions={
          <Link href={`/admin/studios/${studioId}/campaigns/new`}>
            <Button leftIcon={<Plus className="h-4 w-4" />} className="shadow-lg shadow-brand-500/20" suppressHydrationWarning>
              New campaign
            </Button>
          </Link>
        }
      />

      {campaigns.length === 0 ? (
        <Card className="border-none bg-white/40 backdrop-blur-xl dark:bg-slate-900/40">
          <EmptyState
            icon={<Megaphone className="h-8 w-8 text-slate-400" />}
            title="No campaigns yet"
            description="Create your first campaign to start collecting leads from a shareable link."
            action={
              <Link href={`/admin/studios/${studioId}/campaigns/new`}>
                <Button leftIcon={<Plus className="h-4 w-4" />} suppressHydrationWarning>New campaign</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c, i) => (
            <CampaignCard key={c.id} campaign={c} studioId={studioId} index={i} />
          ))}
          
          <Link 
            href={`/admin/studios/${studioId}/campaigns/new`}
            className="group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/30 p-8 transition-all hover:border-brand-500/50 hover:bg-white/50 dark:border-slate-800 dark:bg-slate-900/10 dark:hover:border-brand-500/30 dark:hover:bg-slate-900/30"
          >
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform group-hover:scale-110 dark:bg-slate-900 dark:ring-slate-800">
              <Plus className="h-6 w-6 text-brand-500" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Create New Campaign</span>
            <span className="mt-1 text-xs text-slate-500">Add another lead magnet</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign, studioId, index }: { campaign: Campaign, studioId: string, index: number }) {
  const delay = `${index * 0.1}s`;
  
  return (
    <div 
      className="group relative animate-in"
      style={{ animationDelay: delay }}
    >
      <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-br from-brand-500/20 to-sky-500/20 opacity-0 blur transition duration-500 group-hover:opacity-100" />
      
      <Card className="relative h-full border-none bg-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60 dark:shadow-none" noPadding>
        <div className="flex h-full flex-col p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20">
              <Zap className="h-6 w-6" />
            </div>
            <Badge tone={campaign.active ? 'success' : 'neutral'} className="rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">
              {campaign.active ? 'Active' : 'Draft'}
            </Badge>
          </div>

          <div className="mb-2">
            <Link 
              href={`/admin/studios/${studioId}/campaigns/${campaign.id}`}
              className="text-xl font-black tracking-tight text-slate-900 hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
            >
              {campaign.name}
            </Link>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <LinkIcon className="h-3 w-3" />
              /{campaign.slug}
            </div>
          </div>

          <p className="mb-6 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {campaign.description || "Start collecting leads with this premium capture form."}
          </p>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-100/50 p-3 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Users className="h-3 w-3" />
                Leads
              </div>
              <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                {campaign.leadCount ?? 0}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100/50 p-3 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Zap className="h-3 w-3" />
                Plans
              </div>
              <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                {campaign.fitnessPlans.length}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <CopyLink url={campaign.shareUrl} />
              </div>
              <Link 
                href={campaign.shareUrl} 
                target="_blank"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                title="Preview live page"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
