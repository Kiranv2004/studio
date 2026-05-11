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
    <>
      <PageHeader
        title="Channels"
        description="Each tab is a messaging surface for this studio. WhatsApp is live now; Instagram, Messenger, and X land in subsequent phases (the data model + inbox already support them)."
      />
      <ChannelTabs studioId={studioId} channels={channels} />
    </>
  );
}
