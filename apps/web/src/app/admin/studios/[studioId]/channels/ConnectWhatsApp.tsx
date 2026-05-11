'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plug } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FieldError, FieldHint, Label } from '@/components/ui/Label';
import { ApiError, api } from '@/lib/api';

export function ConnectWhatsApp({ studioId }: { studioId: string }) {
  const router = useRouter();
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api(`/api/v1/studios/${studioId}/messaging/channels/whatsapp`, {
        method: 'POST',
        json: { wabaId, phoneNumberId, displayPhone, accessToken },
      });
      // Reset + refresh.
      setWabaId('');
      setPhoneNumberId('');
      setDisplayPhone('');
      setAccessToken('');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not connect.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Connect WhatsApp" subtitle="Direct via Meta WhatsApp Cloud API. Token is encrypted at rest.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="wabaId">WhatsApp Business Account (WABA) ID</Label>
          <Input
            id="wabaId"
            placeholder="e.g. 1234567890"
            required
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
        <div>
          <Label htmlFor="phoneNumberId">Phone Number ID</Label>
          <Input
            id="phoneNumberId"
            placeholder="e.g. 9876543210"
            required
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            className="font-mono text-xs"
          />
          <FieldHint>From the WhatsApp → API Setup page in your Meta App.</FieldHint>
        </div>
        <div>
          <Label htmlFor="displayPhone">Display phone number</Label>
          <Input
            id="displayPhone"
            placeholder="+65 9123 4567"
            required
            value={displayPhone}
            onChange={(e) => setDisplayPhone(e.target.value)}
          />
          <FieldHint>Shown in the inbox header. Just for humans.</FieldHint>
        </div>
        <div>
          <Label htmlFor="accessToken">Access token</Label>
          <Input
            id="accessToken"
            type="password"
            required
            placeholder="EAAG... (permanent System User token recommended)"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="font-mono text-xs"
          />
          <FieldHint>Encrypted at rest with AES-256-GCM. Never written to logs.</FieldHint>
        </div>
        <FieldError message={error ?? undefined} />
        <Button type="submit" className="w-full" loading={submitting} leftIcon={<Plug className="h-4 w-4" />}>
          Connect
        </Button>
      </form>
    </Card>
  );
}
