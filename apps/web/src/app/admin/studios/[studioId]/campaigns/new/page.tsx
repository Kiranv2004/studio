'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FieldError, FieldHint, Label } from '@/components/ui/Label';
import { PageHeader } from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError, api } from '@/lib/api';
import type { Campaign } from '@/lib/types';

export default function NewCampaignPage() {
  const router = useRouter();
  const params = useParams<{ studioId: string }>();
  const studioId = params.studioId;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [plansText, setPlansText] = useState('Yoga\nHIIT\nPersonal Training\nGroup Class');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    const fitnessPlans = plansText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    try {
      const c = await api<Campaign>(`/api/v1/studios/${studioId}/campaigns`, {
        method: 'POST',
        json: { name, slug, description, fitnessPlans },
      });
      router.push(`/admin/studios/${studioId}/campaigns/${c.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
      } else if (err instanceof ApiError && err.code === 'slug_taken') {
        setErrors({ slug: 'this slug is already in use within this studio' });
      } else {
        setErrors({ _: 'failed to create campaign' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New campaign"
        description="A campaign defines the fitness plans the form offers and produces a unique shareable link."
      />
      <div className="mx-auto max-w-2xl">
        <Card>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">Campaign name</Label>
              <Input
                id="name"
                placeholder="Spring Promo 2026"
                required
                invalid={!!errors.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <FieldError message={errors.name} />
            </div>

            <div>
              <Label htmlFor="slug">URL slug (optional)</Label>
              <Input
                id="slug"
                placeholder="auto-generated if empty"
                invalid={!!errors.slug}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <FieldHint>
                Public URL: <code className="font-mono">/l/&lt;studio&gt;/&lt;slug&gt;</code>
              </FieldHint>
              <FieldError message={errors.slug} />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Shown above the form on the public page"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="plans">Fitness plans (one per line)</Label>
              <Textarea
                id="plans"
                rows={5}
                invalid={!!errors.fitnessPlans}
                value={plansText}
                onChange={(e) => setPlansText(e.target.value)}
              />
              <FieldHint>These appear as choices on the public form.</FieldHint>
              <FieldError message={errors.fitnessPlans} />
            </div>

            <FieldError message={errors._} />

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-5 dark:border-slate-800/60">
              <Button variant="ghost" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} leftIcon={<Plus className="h-4 w-4" />}>
                Create campaign
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
