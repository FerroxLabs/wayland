/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * T5. THE CARD. The whole reason this milestone exists.
 *
 * The turn ends, the sweep registers what the chat produced, and this appears
 * under the assistant's message naming the actual file. The user clicked
 * nothing to summon it.
 *
 * -------------------------------------------------------------------------
 * LABEL DISCIPLINE, WHICH IS A REAL BUG AND NOT A STYLE PREFERENCE.
 * -------------------------------------------------------------------------
 * The app has two different destinations for a deliverable and had one word for
 * both. On a PDF the existing strings produce "[Preview] [Open in Preview]"
 * side by side - one of those stays inside Wayland, the other hands the file to
 * Apple's Preview.app, and nothing on screen says which is which. So:
 *
 *   INTERNAL -> "Open here"            (this app renders the bytes)
 *   EXTERNAL -> "Open in {App} app"    (the OS launches its handler)
 *
 * The internal control never says "Preview", because "Preview" is the name of
 * somebody else's application.
 *
 * -------------------------------------------------------------------------
 * IDS CROSS THE BOUNDARY. PATHS DO NOT.
 * -------------------------------------------------------------------------
 * Every host action here sends an `artifactId`. The host re-resolves it through
 * the ledger and re-verifies containment, symlink-freedom, regular-file-ness
 * and the sha256 on EVERY click - not once at registration. The path this card
 * displays came FROM the host and is never sent back, so a card rendering a
 * stale summary cannot make the host act on a file of the renderer's choosing.
 *
 * -------------------------------------------------------------------------
 * "CHANGED SINCE IT WAS MADE" IS AN ACTION, NOT A DEAD END.
 * -------------------------------------------------------------------------
 * Editing the file - the next turn revising it, or the user typing in a cell of
 * their own .csv - makes the digest gate refuse every button. That refusal is
 * correct and stays. What this adds is the repair: one control that re-runs the
 * FULL registration over the new bytes (`artifacts.refresh`, T4) and then
 * retries what the user actually asked for. Nothing here skips a check.
 */

import { ipcBridge } from '@/common';
import type { IMessageArtifactCard } from '@/common/chat/chatLib';
import type { ArtifactSummary } from '@/common/types/artifacts';
import { usePreviewLauncher } from '@/renderer/hooks/file/usePreviewLauncher';
import {
  previewContentTypeForFileName,
  previewIsEditable,
} from '@/renderer/pages/conversation/Preview/previewContentType';
import { ExternalLink, FileText, FolderOpen, RefreshCw, Save } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** The host's exact wording when verification refuses on changed bytes. */
const CHANGED_ERROR = 'artifact has changed since it was recorded';

const buttonClass =
  'flex shrink-0 items-center gap-4px whitespace-nowrap px-8px py-4px rd-6px cursor-pointer border-none bg-transparent ' +
  'text-12px text-t-secondary hover:bg-3 hover:text-t-primary transition-colors disabled:opacity-50';

interface ArtifactRowProps {
  artifact: ArtifactSummary;
}

const ArtifactRow: React.FC<ArtifactRowProps> = ({ artifact }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [applicationName, setApplicationName] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { launchPreview } = usePreviewLauncher();

  const artifactId = artifact.artifactId;

  useEffect(() => {
    // Reset first: a row switching artifacts must never show the previous
    // file's app name for even one frame.
    setApplicationName(null);
    let cancelled = false;
    void ipcBridge.artifacts.openTarget
      .invoke({ artifactId })
      .then((result) => {
        if (!cancelled) setApplicationName(result?.applicationName ?? null);
      })
      .catch(() => {
        // Unresolvable is the normal case on Windows and for any type the OS
        // has no handler for. The button keeps its generic external wording.
        if (!cancelled) setApplicationName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [artifactId]);

  /**
   * Note what a refusal MEANS, not just that one happened.
   *
   * A changed digest is the one failure the user can fix, so it becomes the
   * "Update" affordance. Everything else is reported as text - a dead button
   * with no explanation is the failure mode this app has shipped before.
   */
  const noteFailure = useCallback(
    (message: string | undefined) => {
      if (message === CHANGED_ERROR) {
        setChanged(true);
        setError(null);
        return;
      }
      setError(message ?? t('conversation.artifactCard.unknownError'));
    },
    [t]
  );

  const openExternally = useCallback(async () => {
    setBusy(true);
    try {
      // The bridge has no rejection channel: a refusal arrives as a RESOLVED
      // `{ ok: false }`. Not reading it is how a button becomes silently dead.
      const result = await ipcBridge.artifacts.open.invoke({ artifactId });
      if (result?.ok) {
        setChanged(false);
        setError(null);
        return;
      }
      noteFailure(result?.error);
    } finally {
      setBusy(false);
    }
  }, [artifactId, noteFailure]);

  /**
   * INTERNAL. Renders the bytes in this app's own viewer.
   *
   * No launcher is involved and nothing is executed, so the OS type gate's
   * reasons for existing do not apply here - this is the same `fs.readFile`
   * path the workspace tree uses for any file it displays.
   */
  const openHere = useCallback(() => {
    const contentType = previewContentTypeForFileName(artifact.fileName);
    void launchPreview({
      originalPath: artifact.canonicalPath,
      fileName: artifact.fileName,
      title: artifact.fileName,
      contentType,
      editable: previewIsEditable(contentType),
    });
  }, [artifact.canonicalPath, artifact.fileName, launchPreview]);

  const reveal = useCallback(async () => {
    setBusy(true);
    try {
      const result = await ipcBridge.artifacts.reveal.invoke({ artifactId });
      if (!result?.ok) noteFailure(result?.error);
    } finally {
      setBusy(false);
    }
  }, [artifactId, noteFailure]);

  const saveCopy = useCallback(async () => {
    setBusy(true);
    try {
      const result = await ipcBridge.artifacts.saveCopy.invoke({ artifactId });
      if (!result?.ok) noteFailure(result?.error);
    } finally {
      setBusy(false);
    }
  }, [artifactId, noteFailure]);

  /**
   * Re-run registration over the bytes that are there now.
   *
   * This does NOT relax verification - `artifacts.refresh` re-applies
   * containment, symlink refusal, non-regular-file refusal, the size cap and
   * the device/inode re-check to the new file. A refusal here is a real
   * refusal and is reported as one.
   */
  const update = useCallback(async () => {
    setBusy(true);
    try {
      const result = await ipcBridge.artifacts.refresh.invoke({ artifactId });
      if (result?.ok) {
        setChanged(false);
        setError(null);
        return;
      }
      // A REFUSAL, not a formality: the file may now be a symlink, a directory,
      // gone, or over the cap. Say which.
      setError(result?.error ?? t('conversation.artifactCard.unknownError'));
    } finally {
      setBusy(false);
    }
  }, [artifactId, t]);

  const externalLabel = applicationName
    ? t('conversation.artifactCard.openInApp', { app: applicationName })
    : t('conversation.artifactCard.openExternally');

  return (
    <div className='flex flex-col gap-4px' data-testid='artifact-card-row'>
      <div className='flex items-center gap-8px'>
        <FileText className='size-14px shrink-0 text-t-secondary' />
        <span className='min-w-0 flex-1 truncate font-medium' title={artifact.canonicalPath}>
          {artifact.fileName}
        </span>
      </div>

      <div className='flex flex-wrap items-center gap-8px'>
        <button
          type='button'
          className={buttonClass}
          disabled={busy}
          onClick={openHere}
          data-testid='artifact-card-open-here'
        >
          <FileText className='size-14px' />
          {t('conversation.artifactCard.openHere')}
        </button>
        <button
          type='button'
          className={buttonClass}
          disabled={busy}
          onClick={() => void openExternally()}
          data-testid='artifact-card-open-external'
        >
          <ExternalLink className='size-14px' />
          {externalLabel}
        </button>
        <button
          type='button'
          className={buttonClass}
          disabled={busy}
          onClick={() => void reveal()}
          data-testid='artifact-card-reveal'
        >
          <FolderOpen className='size-14px' />
          {t('conversation.artifactCard.reveal')}
        </button>
        <button
          type='button'
          className={buttonClass}
          disabled={busy}
          onClick={() => void saveCopy()}
          data-testid='artifact-card-save-copy'
        >
          <Save className='size-14px' />
          {t('conversation.artifactCard.saveCopy')}
        </button>
      </div>

      {changed && (
        <div className='flex items-center gap-8px text-t-secondary' data-testid='artifact-card-changed'>
          <span>{t('conversation.artifactCard.changed')}</span>
          <button
            type='button'
            className={buttonClass}
            disabled={busy}
            onClick={() => void update()}
            data-testid='artifact-card-update'
          >
            <RefreshCw className='size-14px' />
            {t('conversation.artifactCard.update')}
          </button>
        </div>
      )}

      {error && (
        <div className='text-t-secondary' data-testid='artifact-card-error'>
          {error}
        </div>
      )}
    </div>
  );
};

const MessageArtifactCard: React.FC<{ message: IMessageArtifactCard }> = ({ message }) => {
  const { t } = useTranslation();
  const artifacts = message.content?.artifacts ?? [];
  const rejected = message.content?.rejected ?? [];

  // A card with nothing on it is never written by the host, but a persisted
  // conversation from a future/older shape must not render an empty box.
  if (artifacts.length === 0 && rejected.length === 0) return null;

  return (
    <div
      className='flex flex-col gap-8px my-4px p-12px rd-8px b-solid b-1px b-border text-12px'
      data-testid='artifact-card'
    >
      <span className='text-t-secondary'>{t('conversation.artifactCard.title')}</span>
      {artifacts.map((artifact) => (
        <ArtifactRow key={artifact.artifactId} artifact={artifact} />
      ))}

      {/*
        THE REJECTION LINE. Without it a file the ledger refused is simply
        absent, which the user reads as "the agent never wrote it". Naming the
        count and the reason is the difference between a bug report and a
        setting they can change.
      */}
      {rejected.length > 0 && (
        <div className='text-t-secondary' data-testid='artifact-card-rejected'>
          {t('conversation.artifactCard.rejected', {
            count: rejected.reduce((total, entry) => total + entry.count, 0),
            detail: rejected.map((entry) => `${entry.count} ${entry.reason}`).join(', '),
          })}
        </div>
      )}
    </div>
  );
};

export default MessageArtifactCard;
