'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { api } from '@/lib/api';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type Lead, type LeadStatus } from '@/lib/types';

export function LeadEditor({ studioId, lead }: { studioId: string; lead: Lead }) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const dirty = status !== lead.status || notes !== lead.notes;

  async function save() {
    setSaving(true);
    try {
      await api(`/api/v1/studios/${studioId}/leads/${lead.id}`, {
        method: 'PATCH',
        json: { status, notes },
      });
      setSavedAt(new Date());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Update status">
      <div className="space-y-5">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="notes">Internal notes</Label>
          <Textarea
            id="notes"
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Call notes, next steps, blockers…"
          />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/60">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : 'Changes are not auto-saved.'}
          </span>
          <Button onClick={save} disabled={!dirty} loading={saving} size="sm">
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}
