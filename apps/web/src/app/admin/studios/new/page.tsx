'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FieldError, FieldHint, Label } from '@/components/ui/Label';
import { PageHeader } from '@/components/ui/PageHeader';
import { ApiError, api } from '@/lib/api';
import type { Studio } from '@/lib/types';

interface CreateResp {
  studio: Studio;
  adminId: string;
}

export default function NewStudioPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brandColor, setBrandColor] = useState('#7c3aed');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const res = await api<CreateResp>('/api/v1/admin/studios', {
        method: 'POST',
        json: { name, slug, brandColor, logoUrl, contactEmail, adminEmail, adminPassword },
      });
      router.push(`/admin/studios/${res.studio.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
      } else {
        setErrors({ _: 'failed to create studio' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New studio"
        description="Configure the studio's identity and create its first admin login. The admin gets full access to their studio (campaigns, leads, branding) and nothing else."
      />
      <div className="mx-auto max-w-2xl space-y-6">
        <Card title="Studio identity">
          <form id="studio-form" onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">Studio name</Label>
              <Input
                id="name"
                placeholder="Yoga Bliss Singapore"
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
                placeholder="auto-generated from name"
                invalid={!!errors.slug}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <FieldHint>
                Used in public URLs: <code className="font-mono">/l/&lt;slug&gt;/&lt;campaign&gt;</code>
              </FieldHint>
              <FieldError message={errors.slug} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="brandColor">Brand color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="brandColor"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-md border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    invalid={!!errors.brandColor}
                    className="font-mono"
                  />
                </div>
                <FieldError message={errors.brandColor} />
              </div>
              <div>
                <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
                <FieldHint>Square image works best. Used on the public form.</FieldHint>
              </div>
            </div>

            <div>
              <Label htmlFor="contactEmail">Contact email (optional)</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="hello@studio.com"
                invalid={!!errors.contactEmail}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <FieldError message={errors.contactEmail} />
            </div>
          </form>
        </Card>

        <Card title="First admin login" subtitle="The studio admin uses this to sign in.">
          <div className="space-y-5">
            <div>
              <Label htmlFor="adminEmail">Admin email</Label>
              <Input
                id="adminEmail"
                type="email"
                form="studio-form"
                required
                invalid={!!errors.adminEmail}
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@studio.com"
              />
              <FieldError message={errors.adminEmail} />
            </div>
            <div>
              <Label htmlFor="adminPassword">Temporary password</Label>
              <Input
                id="adminPassword"
                type="password"
                form="studio-form"
                required
                invalid={!!errors.adminPassword}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <FieldHint>Share this securely with the studio admin. They sign in at the same /login page.</FieldHint>
              <FieldError message={errors.adminPassword} />
            </div>
          </div>
        </Card>

        <FieldError message={errors._} />

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="studio-form"
            loading={submitting}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create studio
          </Button>
        </div>
      </div>
    </>
  );
}
