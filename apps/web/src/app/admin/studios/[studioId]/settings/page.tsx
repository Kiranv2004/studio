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
    <div className="space-y-6">
      {/* Premium Settings Header Box */}
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Studio settings</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Update the studio&rsquo;s name, logo, and brand color configuration.
            </p>
          </div>
        </div>
      </div>
      <SettingsForm studio={studio} />
    </div>
  );
}
