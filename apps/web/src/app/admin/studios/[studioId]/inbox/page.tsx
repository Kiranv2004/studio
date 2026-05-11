import { MessagesSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
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

      {data.total === 0 ? (
        <Card noPadding>
          <EmptyState
            icon={<MessagesSquare className="h-5 w-5" />}
            title="No conversations yet"
            description="Once a customer messages a connected channel, the thread will land here."
          />
        </Card>
      ) : (
        <InboxLive studioId={studioId} initialConversations={data.conversations} />
      )}
    </>
  );
}
