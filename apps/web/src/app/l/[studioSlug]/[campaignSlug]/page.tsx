import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { fetchPublicCampaign, fetchPublicStudio } from '@/lib/public';
import { LeadForm } from './form';

export default async function CampaignFormPage({
  params,
}: {
  params: Promise<{ studioSlug: string; campaignSlug: string }>;
}) {
  const { studioSlug, campaignSlug } = await params;
  const [studio, campaign] = await Promise.all([
    fetchPublicStudio(studioSlug),
    fetchPublicCampaign(studioSlug, campaignSlug),
  ]);
  if (!studio || !campaign) notFound();

  // Per-studio branding: drive the gradient + accent colors from the studio's
  // brand_color via inline style on the wrapper. Fully isolated to this route.
  const brand = studio.brandColor;

  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{
        background: `linear-gradient(160deg, ${brand}10 0%, #ffffff 50%, ${brand}18 100%)`,
      }}
    >
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl text-xl font-bold text-white shadow-lg"
            style={{ background: brand }}
          >
            {studio.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={studio.logoUrl} alt={studio.name} className="h-16 w-16 object-cover" />
            ) : (
              studio.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {studio.name}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {campaign.name}
          </h1>
          {campaign.description && (
            <p className="mt-2 text-slate-600">{campaign.description}</p>
          )}
        </div>

        <Card title="Tell us about yourself" elevated>
          <LeadForm
            studioSlug={studio.slug}
            campaignSlug={campaign.slug}
            fitnessPlans={campaign.fitnessPlans}
            brandColor={brand}
          />
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          We&rsquo;ll only use your details to follow up about your fitness goals.
        </p>
      </div>
    </main>
  );
}
