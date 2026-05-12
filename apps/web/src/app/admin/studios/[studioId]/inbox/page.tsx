import { PageHeader } from '@/components/ui/PageHeader';
import { serverFetch } from '@/lib/auth';
import type { Conversation } from '@/lib/types';
import { InboxLive } from './InboxLive';

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
    <>
      <PageHeader
        title="Inbox"
        description={`${data.total} conversation${data.total === 1 ? '' : 's'}. Live updates via SSE — new messages appear without refresh.`}
      />

      <InboxLive studioId={studioId} initialConversations={data.conversations} />
    </>
  );
}
