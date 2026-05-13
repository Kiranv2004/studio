import { PageHeader } from '@/components/ui/PageHeader';
import { serverFetch } from '@/lib/auth';
import type { Conversation } from '@/lib/types';
import { InboxLive } from './InboxLive';
import { Activity } from 'lucide-react';

interface ListResp {
  conversations: Conversation[];
  total: number;
}

export default async function InboxPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;

  const data = await serverFetch<ListResp>(
    `/api/v1/studios/${studioId}/messaging/conversations?limit=50`,
  );

  return (
    <div className="space-y-6">
      {/* Premium Inbox Header Box */}
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/5 blur-3xl" />
        
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Inbox</h1>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Live
              </div>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {data.total} active conversation{data.total === 1 ? '' : 's'} · Connected to WhatsApp
            </p>
          </div>
          
          <div className="hidden text-right sm:block">
            <div className="flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Activity className="h-3 w-3" />
              Connection
            </div>
            <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">Streaming Enabled</div>
          </div>
        </div>
      </div>

      <InboxLive studioId={studioId} initialConversations={data.conversations} />
    </div>
  );
}
