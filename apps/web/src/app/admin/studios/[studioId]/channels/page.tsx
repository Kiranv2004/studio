import { PageHeader } from '@/components/ui/PageHeader';
import { serverFetch } from '@/lib/auth';
import type { ChannelAccount } from '@/lib/types';
import { ChannelTabs } from './ChannelTabs';

interface ListResp {
  channels: ChannelAccount[];
}

export default async function ChannelsPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const { channels } = await serverFetch<ListResp>(
    `/api/v1/studios/${studioId}/messaging/channels`,
  );

  return (
    <div className="space-y-6">
      {/* Premium Channels Header Box */}
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Channels</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Connect your social accounts to receive messages and automate leads.
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Connectivity</div>
            <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">Multi-Channel API</div>
          </div>
        </div>
      </div>
      <ChannelTabs studioId={studioId} channels={channels} />
    </div>
  );
}
