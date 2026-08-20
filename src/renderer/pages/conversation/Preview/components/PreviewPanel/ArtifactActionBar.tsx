/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9. The host-owned controls for a deliverable.
 *
 * "Host-owned chrome" is the load-bearing part of the name. These controls sit
 * in APP chrome, outside the previewed document, and they show the CANONICAL
 * TARGET the host resolved - because the filename inside a generated report is
 * model-authored text, and "Open brief.html" printed over a file that is really
 * `report.command` is precisely the misrepresentation this placement prevents.
 * The user sees what will open before they open it.
 *
 * Every action sends an ARTIFACT ID. No path leaves this component. The path it
 * displays arrived FROM the host and is never sent back - the host re-resolves
 * from the ledger and re-verifies identity on every single click, so even a
 * component rendering a stale or mismatched summary cannot make the host act on
 * a file of the renderer's choosing.
 */

import { ipcBridge } from '@/common';
import type { ArtifactSummary } from '@/common/types/artifacts';
import { ExternalLink, FolderOpen, Save } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ArtifactActionBarProps {
  artifact: ArtifactSummary;
  /** Toast sink. Kept as a prop so the panel's message context owns the surface. */
  onMessage: (kind: 'success' | 'error', text: string) => void;
}

const buttonClass =
  'flex items-center gap-4px px-8px py-4px rd-6px cursor-pointer border-none bg-transparent ' +
  'text-12px text-t-secondary hover:bg-3 hover:text-t-primary transition-colors disabled:opacity-50';

const ArtifactActionBar: React.FC<ArtifactActionBarProps> = ({ artifact, onMessage }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (action: 'open' | 'reveal' | 'saveCopy') => {
      setBusy(true);
      try {
        if (action === 'open') {
          const result = await ipcBridge.artifacts.open.invoke({ artifactId: artifact.artifactId });
          // The bridge has no rejection channel, so a refusal arrives as a
          // resolved `{ ok: false }`. Reporting it is the difference between a
          // refusal and a dead button - the failure mode #616 had to fix once.
          if (!result?.ok) onMessage('error', t('preview.artifactOpenFailed', { error: result?.error ?? '' }));
          return;
        }
        if (action === 'reveal') {
          const result = await ipcBridge.artifacts.reveal.invoke({ artifactId: artifact.artifactId });
          if (!result?.ok) onMessage('error', t('preview.artifactRevealFailed', { error: result?.error ?? '' }));
          return;
        }
        const result = await ipcBridge.artifacts.saveCopy.invoke({ artifactId: artifact.artifactId });
        if (!result?.ok) {
          onMessage('error', t('preview.artifactSaveFailed', { error: result?.error ?? '' }));
          return;
        }
        // No `savedTo` means the user cancelled the dialog, which is not an
        // outcome that deserves a toast in either direction.
        if (result.savedTo) onMessage('success', t('preview.artifactSaved', { path: result.savedTo }));
      } finally {
        setBusy(false);
      }
    },
    [artifact.artifactId, onMessage, t]
  );

  return (
    <div className='flex items-center gap-8px px-12px py-6px bd-b b-solid b-1px b-border text-12px'>
      <span className='shrink-0 px-6px py-2px rd-4px bg-3 text-t-secondary'>{t('preview.artifactLabel')}</span>
      {/*
        The canonical target, and the reason this bar exists. `dir="rtl"` with
        `text-left` keeps the END of the path visible when it overflows - the
        filename and its extension are the part that decides what opens, and a
        head-truncated path hides exactly that. The full path is in the tooltip.
      */}
      <span
        className='min-w-0 flex-1 truncate font-mono text-t-secondary'
        dir='rtl'
        title={artifact.canonicalPath}
        data-testid='artifact-canonical-path'
      >
        {artifact.canonicalPath}
      </span>
      <button type='button' className={buttonClass} disabled={busy} onClick={() => void run('open')}>
        <ExternalLink className='size-14px' />
        {t('preview.artifactOpen')}
      </button>
      <button type='button' className={buttonClass} disabled={busy} onClick={() => void run('reveal')}>
        <FolderOpen className='size-14px' />
        {t('preview.artifactReveal')}
      </button>
      <button type='button' className={buttonClass} disabled={busy} onClick={() => void run('saveCopy')}>
        <Save className='size-14px' />
        {t('preview.artifactSaveCopy')}
      </button>
    </div>
  );
};

export default ArtifactActionBar;
