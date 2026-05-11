import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { serverFetch } from '@/lib/auth';
import { formatDateTime } from '@/lib/datetime';
import type { Lead, LeadStatus } from '@/lib/types';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/lib/types';
import { LeadFilters } from './LeadFilters';

interface ListResp {
  leads: Lead[];
  total: number;
}

interface SearchParams {
  campaignId?: string;
  status?: string;
  page?: string;
}

const PAGE_SIZE = 25;

const statusTone: Record<LeadStatus, 'info' | 'brand' | 'warning' | 'success' | 'neutral'> = {
  new: 'info',
  contacted: 'brand',
  trial_booked: 'warning',
  member: 'success',
  dropped: 'neutral',
};

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ studioId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { studioId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const qs = new URLSearchParams();
  if (sp.campaignId) qs.set('campaignId', sp.campaignId);
  if (sp.status && (LEAD_STATUSES as string[]).includes(sp.status)) qs.set('status', sp.status);
  qs.set('limit', String(PAGE_SIZE));
  qs.set('offset', String(offset));

  const data = await serverFetch<ListResp>(`/api/v1/studios/${studioId}/leads?${qs.toString()}`);

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${data.total} total — every form submission lands here.`}
      />

      <div className="mb-5">
        <LeadFilters status={sp.status} />
      </div>

      {data.leads.length === 0 ? (
        <Card noPadding>
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="No leads match these filters"
            description="Try changing the status filter or share a campaign link to start collecting submissions."
          />
        </Card>
      ) : (
        <>
          <Card noPadding className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Contact</th>
                    <th className="px-6 py-3 font-medium">Plan</th>
                    <th className="px-6 py-3 font-medium">Campaign</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leads.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-3.5">
                        <Link
                          href={`/admin/studios/${studioId}/leads/${l.id}`}
                          className="font-medium text-slate-900 hover:text-[color:var(--brand,#7c3aed)] dark:text-slate-100"
                        >
                          {l.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="text-slate-700 dark:text-slate-300">{l.email}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{l.phone}</div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">{l.fitnessPlan}</td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                        {l.campaignName ?? l.campaignId}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge tone={statusTone[l.status]}>{LEAD_STATUS_LABELS[l.status]}</Badge>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">
                        {formatDateTime(l.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination total={data.total} pageSize={PAGE_SIZE} page={page} />
        </>
      )}
    </>
  );
}
