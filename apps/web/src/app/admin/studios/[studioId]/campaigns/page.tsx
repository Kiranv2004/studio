import Link from 'next/link';
import { Megaphone, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { serverFetch } from '@/lib/auth';
import type { Campaign } from '@/lib/types';
import { CopyLink } from './CopyLink';

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
    <>
      <PageHeader
        title="Campaigns"
        description="Each campaign generates a unique lead-capture link you can drop in an Instagram bio or ad."
        actions={
          <Link href={`/admin/studios/${studioId}/campaigns/new`}>
            <Button leftIcon={<Plus className="h-4 w-4" />}>New campaign</Button>
          </Link>
        }
      />

      {campaigns.length === 0 ? (
        <Card noPadding>
          <EmptyState
            icon={<Megaphone className="h-5 w-5" />}
            title="No campaigns yet"
            description="Create your first campaign to start collecting leads from a shareable link."
            action={
              <Link href={`/admin/studios/${studioId}/campaigns/new`}>
                <Button leftIcon={<Plus className="h-4 w-4" />}>New campaign</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Plans</th>
                <th className="px-6 py-3 font-medium">Leads</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Share link</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/studios/${studioId}/campaigns/${c.id}`}
                      className="font-medium text-slate-900 hover:text-[color:var(--brand,#7c3aed)] dark:text-slate-100"
                    >
                      {c.name}
                    </Link>
                    <div className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">/{c.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {c.fitnessPlans.slice(0, 3).join(', ')}
                    {c.fitnessPlans.length > 3 && (
                      <span className="text-slate-400"> +{c.fitnessPlans.length - 3}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    {c.leadCount ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <Badge tone={c.active ? 'success' : 'neutral'}>
                      {c.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <CopyLink url={c.shareUrl} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </>
  );
}
