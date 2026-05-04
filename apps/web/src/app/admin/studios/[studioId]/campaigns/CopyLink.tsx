'use client';

import { useState } from 'react';
import { Check, Copy as CopyIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy link:', url);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="max-w-[260px] truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {url}
      </code>
      <Button
        variant="outline"
        size="sm"
        onClick={copy}
        leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
      <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open in new tab">
        <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
          Open
        </Button>
      </a>
    </div>
  );
}
