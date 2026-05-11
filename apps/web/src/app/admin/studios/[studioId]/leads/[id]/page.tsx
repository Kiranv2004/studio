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
    <>
      <PageHeader
        title={lead.name}
        description={
          <>
            From{' '}
            <Link
              href={`/admin/studios/${studioId}/campaigns/${lead.campaignId}`}
              className="font-medium text-[color:var(--brand,#7c3aed)] hover:underline"
            >
              {lead.campaignName ?? lead.campaignId}
            </Link>{' '}
            · submitted {formatDateTime(lead.createdAt)}
          </>
        }
        actions={
          <Link
            href={`/admin/studios/${studioId}/leads`}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            ← All leads
          </Link>
        }
      />

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
    </>
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
