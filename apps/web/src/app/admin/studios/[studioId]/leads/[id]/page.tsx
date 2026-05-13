import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { serverFetch } from '@/lib/auth';
import { formatDateTime } from '@/lib/datetime';
import type { Lead } from '@/lib/types';
import { LeadEditor } from './editor';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ studioId: string; id: string }>;
}) {
  const { studioId, id } = await params;
  const lead = await serverFetch<Lead>(`/api/v1/studios/${studioId}/leads/${id}`);

  return (
    <div className="space-y-6">
      {/* Premium Lead Detail Header Box */}
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-black text-white shadow-lg">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{lead.name}</h1>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Lead captured from <span className="font-bold text-brand-600 dark:text-brand-400">{lead.campaignName ?? lead.campaignId}</span> · {formatDateTime(lead.createdAt)}
              </p>
            </div>
          </div>
          <Link
            href={`/admin/studios/${studioId}/leads`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            &larr; Back to Leads
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card title="Contact details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
              <Field label="Email" value={lead.email} />
              <Field label="Phone" value={lead.phone} />
              <Field label="Fitness plan" value={lead.fitnessPlan} />
              <Field label="Source" value={lead.source} />
              {lead.goals && <Field label="Goals" value={lead.goals} className="col-span-2" />}
            </dl>
          </Card>
        </div>

        <div className="md:col-span-1">
          <LeadEditor studioId={studioId} lead={lead} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-slate-900 dark:text-slate-100">{value || '—'}</dd>
    </div>
  );
}
