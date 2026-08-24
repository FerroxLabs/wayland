/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The artifact actions, and the one piece of state they produce.
 *
 * WHY THIS IS A HOOK AND NOT A COMPONENT'S BUSINESS.
 *
 * These three actions used to live inside `ArtifactActionBar`, directly under a
 * toolbar that already offered "Open in system app" and "Download". To a reader
 * that was the same row twice. It was NOT the same thing twice: the toolbar's
 * controls take `metadata.filePath` and hand a RAW PATH to
 * `shell.openFile`, while these take an artifact id and nothing else - the
 * boundary `artifacts.*` exists to keep. Folding one into the other by deleting
 * the id-based row would have quietly downgraded that boundary, which is why the
 * actions moved instead of being removed.
 *
 * So the logic lives here, the panel owns ONE instance of it, and both the
 * toolbar (the buttons) and the bar (the changed-file banner and its repair)
 * read the same state. `changed` is the reason a hook is required rather than
 * two copies: it is discovered by ATTEMPTING an action - the host refuses with
 * `ARTIFACT_CHANGED_ERROR` - so the control that triggers it and the banner that
 * reports it must share one state, or the banner never appears.
 *
 * Every call still sends an id and only an id. Nothing about verification is
 * relaxed here; this is a move, not a rewrite.
 */

import { ipcBridge } from '@/common';
import type { ArtifactSummary } from '@/common/types/artifacts';
// The canonical refusal string. Matched exactly and turned into STATE rather
// than a toast: a toast said the one thing the user could not act on and then
// took itself away.
import { ARTIFACT_CHANGED_ERROR } from '@/common/types/artifacts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface ArtifactActions {
  /** A host call is in flight; every control disables rather than double-firing. */
  busy: boolean;
  /** The file on disk no longer matches the ledger. Sticky until a repair clears it. */
  changed: boolean;
  /** The application the OS would open this with, once the host has named it. */
  applicationName: string | null;
  open: () => Promise<void>;
  reveal: () => Promise<void>;
  saveCopy: () => Promise<void>;
  /** Re-register the artifact over its current bytes. Keeps the id stable. */
  repair: () => Promise<void>;
}

export function useArtifactActions(
  artifact: ArtifactSummary | null,
  onMessage: (kind: 'success' | 'error', text: string) => void
): ArtifactActions {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);
  const [applicationName, setApplicationName] = useState<string | null>(null);

  const artifactId = artifact?.artifactId ?? null;

  useEffect(() => {
    // Reset first: switching artifacts must never show the previous file's app
    // name or changed-file banner for even one frame.
    setApplicationName(null);
    setChanged(false);
    if (!artifactId) return;
    let cancelled = false;
    void ipcBridge.artifacts.openTarget
      .invoke({ artifactId })
      .then((result) => {
        if (!cancelled) setApplicationName(result?.applicationName ?? null);
      })
      .catch(() => {
        // An unresolvable app name is the normal case on Windows and on any type
        // the OS has no handler for. The control keeps saying "Open".
        if (!cancelled) setApplicationName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [artifactId]);

  /**
   * The bridge has no rejection channel, so a refusal arrives as a resolved
   * `{ ok: false }`. Reporting it is the difference between a refusal and a dead
   * button - the failure mode #616 had to fix once.
   */
  const reportRefusal = useCallback(
    (error: string | undefined, key: string) => {
      if (error === ARTIFACT_CHANGED_ERROR) {
        setChanged(true);
        return;
      }
      onMessage('error', t(key, { error: error ?? '' }));
    },
    [onMessage, t]
  );

  const open = useCallback(async () => {
    if (!artifactId) return;
    setBusy(true);
    try {
      const result = await ipcBridge.artifacts.open.invoke({ artifactId });
      if (!result?.ok) reportRefusal(result?.error, 'preview.artifactOpenFailed');
    } finally {
      setBusy(false);
    }
  }, [artifactId, reportRefusal]);

  const reveal = useCallback(async () => {
    if (!artifactId) return;
    setBusy(true);
    try {
      const result = await ipcBridge.artifacts.reveal.invoke({ artifactId });
      if (!result?.ok) reportRefusal(result?.error, 'preview.artifactRevealFailed');
    } finally {
      setBusy(false);
    }
  }, [artifactId, reportRefusal]);

  const saveCopy = useCallback(async () => {
    if (!artifactId) return;
    setBusy(true);
    try {
      const result = await ipcBridge.artifacts.saveCopy.invoke({ artifactId });
      if (!result?.ok) {
        reportRefusal(result?.error, 'preview.artifactSaveFailed');
        return;
      }
      // No `savedTo` means the user cancelled the dialog, which is not an outcome
      // that deserves a toast in either direction.
      if (result.savedTo) onMessage('success', t('preview.artifactSaved', { path: result.savedTo }));
    } finally {
      setBusy(false);
    }
  }, [artifactId, onMessage, reportRefusal, t]);

  /**
   * "Yes, I edited it - record what it is NOW."
   *
   * The host's `artifacts.refresh` re-runs the FULL registration (containment,
   * symlink refusal, size cap, device/inode re-check, fresh sha256) and keeps the
   * artifact id stable. Nothing about verification is relaxed; the repair is a
   * RE-REGISTRATION, which is why it is safe to offer.
   */
  const repair = useCallback(async () => {
    if (!artifactId) return;
    setBusy(true);
    try {
      const result = await ipcBridge.artifacts.refresh.invoke({ artifactId });
      if (result?.ok) {
        setChanged(false);
        onMessage('success', t('preview.artifactUpdated'));
        return;
      }
      onMessage('error', t('preview.artifactUpdateFailed', { error: result?.error ?? '' }));
    } finally {
      setBusy(false);
    }
  }, [artifactId, onMessage, t]);

  return { busy, changed, applicationName, open, reveal, saveCopy, repair };
}
