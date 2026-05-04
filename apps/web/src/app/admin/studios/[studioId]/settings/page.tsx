import { PageHeader } from '@/components/ui/PageHeader';
import { serverFetch } from '@/lib/auth';
import type { Studio } from '@/lib/types';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  // Use the /me/studios/{id} endpoint so studio_admins can also load it.
  const studio = await serverFetch<Studio>(`/api/v1/me/studios/${studioId}`);

  return (
    <>
      <PageHeader
        title="Studio settings"
        description="Update the studio's name, logo, and brand color. The brand color drives the look of the public lead-capture form."
      />
      <SettingsForm studio={studio} />
    </>
  );
}
