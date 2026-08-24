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
 * THE SHAPE IS THREE BANDS, AND THAT IS THE POINT.
 * -------------------------------------------------------------------------
 * What shipped first was a 1px outline around four identical text links, and
 * it was rejected on sight. The approved design is a real object:
 *
 *   HEADER   a tinted type tile, the FILENAME as the loudest line on the card,
 *            and a quiet `TYPE - SIZE - TIME` under it.
 *   BODY     the first lines of the actual file, on its own ground, faded out
 *            at the bottom. Never an empty box.
 *   ACTIONS  a footer band on its own ground with ONE accent-filled primary
 *            button and three secondary ones.
 *
 * The border is written as `b-[var(--border-base)]`. It is NOT `b-border`,
 * which emits no CSS at all in this repo's UnoCSS config and left the card
 * falling back to `currentColor`, and it is NOT `b-base`, which resolves to
 * `--bg-base` and would paint #0a0a0a onto a #222222 panel. Both were verified
 * by running the repo's own generator.
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
 * IDS CROSS THE BOUNDARY AS ARGUMENTS. PATHS CROSS ONLY AS TEXT.
 * -------------------------------------------------------------------------
 * Every host ACTION here sends an `artifactId` and nothing else. The host
 * re-resolves it through the ledger and re-verifies containment,
 * symlink-freedom, regular-file-ness and the sha256 on EVERY call - not once at
 * registration. `canonicalPath` does travel main -> renderer, and it is
 * rendered as a tooltip and handed to this app's own viewer, but it is never an
 * argument to a host call, so a card holding a stale summary cannot make the
 * host act on a file of the renderer's choosing.
 *
 * -------------------------------------------------------------------------
 * THE PREVIEW BAND RENDERS UNTRUSTED BYTES. THE ELEMENT IS THE SAFETY.
 * -------------------------------------------------------------------------
 * Text goes into a `<pre>` and nothing else. Image bytes go into an `<img>` and
 * nothing else. No `dangerouslySetInnerHTML`, no iframe, no srcdoc, no
 * innerHTML. An HTML deliverable previews as its SOURCE, which is why the host
 * contract has no `html` arm. The host has already refused binaries, oversized
 * files, svg and anything whose digest moved before a byte reaches here.
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
import type {
  ArtifactPreview,
  ArtifactRejectionBucket,
  ArtifactSummary,
  UnsupportedClaimVerdict,
  UnsupportedSavedFileClaim,
} from '@/common/types/artifacts';
import {
  ARTIFACT_CHANGED_ERROR,
  formatArtifactSize,
  rejectionBucketFor,
} from '@/common/types/artifacts';
import { usePreviewLauncher } from '@/renderer/hooks/file/usePreviewLauncher';
import {
  previewContentTypeForFileName,
  previewIsEditable,
} from '@/renderer/pages/conversation/Preview/previewContentType';
import { Braces, ExternalLink, File, FileCode, FileText, FolderOpen, RefreshCw, Save, Table2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * At most three rows get drawn, and only the FIRST gets a preview band.
 *
 * `registered` is every deliverable currently in the chat's namespace, not just
 * this turn's, capped host-side at 512. Six 104px bands is a 900px card and six
 * preview reads per render; three headers and one band is a card. The rest are
 * named by a quiet line pointing at the Artifacts page, which is where a list
 * belongs.
 */
const MAX_ROWS = 3;

/**
 * Format proper nouns, deliberately NOT translated and deliberately closed.
 *
 * "Markdown" is Markdown in every locale. Anything not named here falls back to
 * the uppercased extension ("DOCX", "JSON", "PDF"), which is also not
 * translated and is never wrong. There is no "File" or "Text document"
 * fallback: that would be a translatable string for a segment that can simply
 * be omitted instead.
 */
const FORMAT_NAMES: Record<string, string> = {
  md: 'Markdown',
  markdown: 'Markdown',
  htm: 'HTML',
  html: 'HTML',
  jpg: 'JPEG',
  jpeg: 'JPEG',
  webp: 'WebP',
  yml: 'YAML',
  yaml: 'YAML',
};

/** The tile's look, by extension. Soft tokens only - see below. */
interface TypeLook {
  Icon: typeof FileText;
  /**
   * Tints come from the SOFT token pairs, never from the raw semantic colours.
   * Light-mode `--success` is #047857 and `--warning` is #a8500a - deliberate
   * WCAG flips, not the same family as their dark values - so a tile filled
   * with the raw colour is a different object in the two themes. The soft pairs
   * are defined in both blocks and are what they are for.
   */
  tile: string;
  icon: string;
}

const NEUTRAL_LOOK: TypeLook = { Icon: File, tile: 'bg-3 b-[var(--border-base)]', icon: 'text-t-secondary' };

const TYPE_LOOKS: Record<string, TypeLook> = {
  html: { Icon: FileCode, tile: 'bg-[var(--brand-soft-bg)] b-[var(--brand-soft-border)]', icon: 'text-brand' },
  htm: { Icon: FileCode, tile: 'bg-[var(--brand-soft-bg)] b-[var(--brand-soft-border)]', icon: 'text-brand' },
  md: { Icon: FileText, tile: 'bg-[var(--warning-soft-bg)] b-[var(--warning-soft-border)]', icon: 'text-warning' },
  markdown: {
    Icon: FileText,
    tile: 'bg-[var(--warning-soft-bg)] b-[var(--warning-soft-border)]',
    icon: 'text-warning',
  },
  json: { Icon: Braces, tile: 'bg-[var(--success-soft-bg)] b-[var(--success-soft-border)]', icon: 'text-success' },
  csv: { Icon: Table2, tile: 'bg-[var(--success-soft-bg)] b-[var(--success-soft-border)]', icon: 'text-success' },
};

/**
 * The five buckets, as an exhaustive table.
 *
 * `satisfies Record<ArtifactRejectionBucket, ...>` is the guard: a sixth bucket
 * added to the host contract fails to COMPILE here rather than rendering as
 * `undefined` under a user's report that did not arrive.
 */
/**
 * The two verdicts, as an exhaustive table.
 *
 * `satisfies Record<UnsupportedClaimVerdict, ...>` is the same guard the
 * rejection buckets carry: a third verdict added to the host contract fails to
 * COMPILE here rather than rendering as `undefined` - or as the raw word
 * `absent` - under a user's missing report.
 */
const UNSUPPORTED_KEYS = {
  absent: 'conversation.artifactCard.claimedButAbsent',
  elsewhere: 'conversation.artifactCard.claimedElsewhere',
} satisfies Record<UnsupportedClaimVerdict, string>;

/**
 * THE `elsewhere` STRING REFUTED ITSELF WHENEVER THE FILE SAT AT THE ROOT.
 *
 * `chatRun` builds the elsewhere lookup with an empty prefix, so a file in the
 * workspace folder itself gets `actualPath === fileName` and the card read
 * "handoff.md was written to handoff.md, not to this conversation's files."
 * Observed on two of Sean's real conversations with the file still on disk, and
 * the workspace root is the common case - it is where a chat writes when it is
 * not writing into its own namespace. A path with no separator in it is that
 * case, and it gets a sentence that says something.
 */
const CLAIMED_IN_WORKSPACE_KEY = 'conversation.artifactCard.claimedElsewhereInWorkspace';

const unsupportedKeyFor = (claim: UnsupportedSavedFileClaim): string =>
  claim.verdict === 'elsewhere' && claim.actualPath !== undefined && !claim.actualPath.includes('/')
    ? CLAIMED_IN_WORKSPACE_KEY
    : UNSUPPORTED_KEYS[claim.verdict];

const REJECTION_KEYS = {
  'outside-folder': 'conversation.artifactCard.rejectedOutsideFolder',
  'not-a-file': 'conversation.artifactCard.rejectedNotAFile',
  'too-big': 'conversation.artifactCard.rejectedTooBig',
  'too-many': 'conversation.artifactCard.rejectedTooMany',
  unreadable: 'conversation.artifactCard.rejectedUnreadable',
} satisfies Record<ArtifactRejectionBucket, string>;

const extensionOf = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
};

/**
 * THE DELIVERABLE LEADS.
 *
 * `withPreview` and `accent` are both `position === 0`, so ORDER decides which
 * file gets the preview and the one accent button. Left in write order, a
 * morning report put its machine-readable `mr.json` first and the actual brief
 * second - the JSON got the preview and the orange button while the document a
 * person came to read got a plain row and no preview. That is backwards.
 *
 * Rank is by what the file IS to a reader, not by size or write order:
 * something you read, then something you look at, then the data behind it.
 * Ties keep their original order, so this only ever moves a document ahead of
 * its own data.
 */
const READABLE_DOCUMENT = new Set(['html', 'htm', 'md', 'markdown', 'pdf', 'docx', 'rtf']);
const VIEWABLE_IMAGE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']);

const deliverableRank = (fileName: string): number => {
  const extension = extensionOf(fileName);
  if (READABLE_DOCUMENT.has(extension)) return 0;
  if (VIEWABLE_IMAGE.has(extension)) return 1;
  return 2;
};

const formatLabel = (fileName: string): string => {
  const extension = extensionOf(fileName);
  if (!extension) return '';
  return FORMAT_NAMES[extension] ?? extension.toUpperCase();
};

/**
 * Clock time, not "just now".
 *
 * A relative phrase is a translatable string that goes stale the moment it is
 * painted and needs a timer to stay true. The time the file was written is a
 * fact, it is one `Intl` call, and it is the same fact in every locale.
 */
const formatRunTime = (runAt: string): string => {
  const at = new Date(runAt);
  if (Number.isNaN(at.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(at);
  } catch {
    return '';
  }
};

const buttonBase =
  'flex min-w-0 items-center gap-6px whitespace-nowrap rd-7px px-12px py-6px cursor-pointer ' +
  'b-1px b-solid text-12px font-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

/** Glyphs never squash; only the label beside them gives ground. */
const buttonIconClass = 'size-14px shrink-0';

/** ONE of these on the card. Four equal buttons is the thing being fixed. */
const primaryButtonClass = `${buttonBase} bg-brand b-[var(--brand)] text-[#1a0d06] font-600 hover:bg-[var(--brand-hover)]`;

const secondaryButtonClass = `${buttonBase} bg-3 b-[var(--border-base)] text-t-primary hover:bg-2`;

interface ArtifactRowProps {
  artifact: ArtifactSummary;
  /** Only the newest deliverable gets a preview band, and so a preview read. */
  withPreview: boolean;
  /** Rows after the first are separated by a rule rather than by a gap. */
  divided: boolean;
  /**
   * THE ACCENT BELONGS TO THE CARD, NOT TO THE ROW.
   *
   * Found by looking at a three-deliverable card in the running app: with the
   * accent on every row it drew THREE orange buttons and the hierarchy this
   * whole redesign exists to restore was gone again. The newest deliverable
   * owns the one filled button; the rows under it are entirely secondary.
   */
  accent: boolean;
}

const ArtifactRow: React.FC<ArtifactRowProps> = ({ artifact: recorded, withPreview, divided, accent }) => {
  const { t } = useTranslation();
  /**
   * The summary the row is CURRENTLY describing.
   *
   * It starts as the one persisted on the card and is replaced by the one
   * `artifacts.refresh` hands back. Without this the meta line kept saying
   * "387 B" after a repair that had just re-registered the file at 422 B - the
   * preview band had the new bytes and the line above it had the old size,
   * which is the card contradicting itself about the same file. Seen on screen,
   * not in a test.
   */
  const [summary, setSummary] = useState<ArtifactSummary>(recorded);
  /**
   * Derived, NOT reset in an effect. A row handed a different artifact falls
   * back to the persisted summary on the very same render - no effect, no
   * frame of the previous file's size - and an effect keyed on the prop would
   * also throw away a repair every time the parent re-rendered.
   */
  const artifact = summary.artifactId === recorded.artifactId ? summary : recorded;
  const [busy, setBusy] = useState(false);
  const [applicationName, setApplicationName] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ArtifactPreview | null>(null);
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
   * The preview band's bytes, read once per mount.
   *
   * A REJECTION IS EXPECTED HERE AND IS NOT AN ERROR. `artifacts.` is
   * remote-denied by prefix, so on a paired WebUI viewer this throws
   * `BridgeUnavailableError` on every render. Every other control on the card
   * is click-triggered and therefore only fails when touched; a mount-time read
   * is the one that would fail unprompted, so it falls back to the file glyph
   * and says nothing. Any other transport failure lands in the same place, and
   * that is the honest answer for both: there is no preview.
   */
  useEffect(() => {
    if (!withPreview) return;
    setPreview(null);
    let cancelled = false;
    void ipcBridge.artifacts.preview
      .invoke({ artifactId })
      .then((result) => {
        if (cancelled) return;
        setPreview(result ?? { kind: 'none', reason: 'unavailable' });
        // The digest gate is the only signal the card gets without a click:
        // there is no filesystem watcher, so a hand-edit surfaces on the next
        // mount and this is that surface.
        if (result?.kind === 'none' && result.reason === 'changed') setChanged(true);
      })
      .catch(() => {
        if (!cancelled) setPreview({ kind: 'none', reason: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, [artifactId, withPreview]);

  /**
   * Note what a refusal MEANS, not just that one happened.
   *
   * A changed digest is the one failure the user can fix, so it becomes the
   * "Update" affordance. Everything else is reported as text - a dead button
   * with no explanation is the failure mode this app has shipped before.
   */
  const noteFailure = useCallback(
    (message: string | undefined) => {
      if (message === ARTIFACT_CHANGED_ERROR) {
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
   * GATED ON A VERIFIED READ FIRST, which it was not before. This is the card's
   * primary button and it was the one path that skipped the ledger entirely: it
   * handed `canonicalPath` to a generic renderer read and never called
   * `noteFailure`, so clicking it on a file the user had edited silently showed
   * them the NEW bytes under the OLD card and could never raise the changed
   * state. `artifacts.preview` re-resolves, re-confines and re-hashes; only a
   * digest refusal blocks the launch, because that is the one the user can
   * repair. Every other refusal still opens the viewer, which is today's
   * behaviour and is better than a dead button.
   */
  const openHere = useCallback(async () => {
    setBusy(true);
    try {
      const verified = await ipcBridge.artifacts.preview.invoke({ artifactId }).catch((): ArtifactPreview | null => null);
      if (verified?.kind === 'none' && verified.reason === 'changed') {
        setPreview(verified);
        setChanged(true);
        setError(null);
        return;
      }
      const contentType = previewContentTypeForFileName(artifact.fileName);
      void launchPreview({
        originalPath: artifact.canonicalPath,
        fileName: artifact.fileName,
        title: artifact.fileName,
        contentType,
        editable: previewIsEditable(contentType),
      });
    } finally {
      setBusy(false);
    }
  }, [artifact.canonicalPath, artifact.fileName, artifactId, launchPreview]);

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
        // The re-verified record, so the size and time above the band describe
        // the bytes now IN it. Discarding this is what made the card contradict
        // itself after a repair.
        if (result.artifact) setSummary(result.artifact);
        // The band was showing a digest refusal. Re-read it so the repair is
        // visible rather than merely claimed.
        if (withPreview) {
          const refreshed = await ipcBridge.artifacts.preview.invoke({ artifactId }).catch((): ArtifactPreview | null => null);
          setPreview(refreshed ?? { kind: 'none', reason: 'unavailable' });
        }
        return;
      }
      // A REFUSAL, not a formality: the file may now be a symlink, a directory,
      // gone, or over the cap. Say which.
      setError(result?.error ?? t('conversation.artifactCard.unknownError'));
    } finally {
      setBusy(false);
    }
  }, [artifactId, t, withPreview]);

  const externalLabel = applicationName
    ? t('conversation.artifactCard.openInApp', { app: applicationName })
    : t('conversation.artifactCard.openExternally');

  const look = TYPE_LOOKS[extensionOf(artifact.fileName)] ?? NEUTRAL_LOOK;
  const TileIcon = look.Icon;
  const meta = [formatLabel(artifact.fileName), formatArtifactSize(artifact.sizeBytes), formatRunTime(artifact.runAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={divided ? 'b-t-1px b-t-solid b-t-[var(--border-light)]' : ''} data-testid='artifact-card-row'>
      {/* (a) HEADER. The filename is the strong line; everything else is quiet. */}
      <div className='flex items-center gap-12px px-15px py-14px'>
        <div
          className={`grid size-36px shrink-0 place-items-center rd-9px b-1px b-solid ${look.tile}`}
          aria-hidden='true'
        >
          <TileIcon className={`size-16px ${look.icon}`} />
        </div>
        <div className='min-w-0 flex-1'>
          <div
            className='truncate text-14px font-500 text-t-primary'
            title={artifact.canonicalPath}
            data-testid='artifact-card-name'
          >
            {artifact.fileName}
          </div>
          {meta && (
            <div className='truncate text-11px font-mono text-t-tertiary' data-testid='artifact-card-meta'>
              {meta}
            </div>
          )}
        </div>
      </div>

      {/* (b) BODY. The real first lines, on the page ground, faded at the foot. */}
      {withPreview && (
        <div className='px-15px pb-14px'>
          <div
            className='relative h-104px of-hidden rd-9px b-1px b-solid b-[var(--border-light)] bg-base'
            data-testid='artifact-card-preview'
          >
            {preview?.kind === 'text' && (
              <pre
                className='m-0 h-full of-hidden whitespace-pre-wrap break-all p-11px text-10px font-mono
                  leading-[1.55] text-t-secondary'
                style={{
                  WebkitMaskImage: 'linear-gradient(to bottom, #000 62%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, #000 62%, transparent 100%)',
                }}
                data-testid='artifact-card-preview-text'
              >
                {preview.text}
              </pre>
            )}
            {preview?.kind === 'image' && (
              <img
                className='h-full w-full object-cover'
                src={preview.dataUrl}
                alt={artifact.fileName}
                data-testid='artifact-card-preview-image'
              />
            )}
            {(!preview || preview.kind === 'none') && (
              <div className='grid h-full place-items-center' data-testid='artifact-card-preview-glyph'>
                <TileIcon className={`size-28px ${preview ? look.icon : 'text-t-tertiary'} opacity-60`} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* The seam. An edited file says so here, between the bytes and the buttons. */}
      {changed && (
        <div
          className='flex items-center gap-8px px-15px pb-10px text-12px text-warning'
          data-testid='artifact-card-changed'
        >
          <span>{t('conversation.artifactCard.changed')}</span>
        </div>
      )}

      {error && (
        <div className='px-15px pb-10px text-12px text-danger' data-testid='artifact-card-error'>
          {error}
        </div>
      )}

      {/*
        (c) ACTIONS. Its own ground, and exactly one accent-filled button.

        ONE ROW, AND IT SHRINKS RATHER THAN WRAPS - designed against 348px. The
        card no longer caps at 520px (it takes the message column), so the wide
        case has more room than this row needs; the narrow case is what it is
        designed for and is unchanged. With the
        workbench docked, the narrowest column the shell will ever hand this card
        is WORKBENCH_DOCK_MIN_WIDTH 740 (components/ChatLayout/index.tsx) less
        WorkbenchHost's 340px panel and its 36px rail, less MessageList's
        px-8px - about 348px. `flex-wrap` broke "Save a copy" onto a second line
        there and the footer stopped reading as one band, so the row does not
        wrap at all now: every labelled button carries `min-w-0`, every label
        `truncate`, every glyph `shrink-0`, and flexbox takes the squeeze out of
        the longest label first.
      */}
      <div
        className='flex flex-nowrap items-center gap-7px b-t-1px b-t-solid b-t-[var(--border-light)] bg-2 px-15px
          py-12px'
        data-testid='artifact-card-actions'
      >
        {changed && (
          <button
            type='button'
            className={accent ? primaryButtonClass : secondaryButtonClass}
            disabled={busy}
            onClick={() => void update()}
            data-testid='artifact-card-update'
          >
            <RefreshCw className={buttonIconClass} />
            <span className='truncate'>{t('conversation.artifactCard.update')}</span>
          </button>
        )}
        <button
          type='button'
          className={accent && !changed ? primaryButtonClass : secondaryButtonClass}
          disabled={busy}
          onClick={() => void openHere()}
          data-testid='artifact-card-open-here'
        >
          <FileText className={buttonIconClass} />
          <span className='truncate'>{t('conversation.artifactCard.openHere')}</span>
        </button>
        <button
          type='button'
          className={secondaryButtonClass}
          disabled={busy}
          onClick={() => void openExternally()}
          data-testid='artifact-card-open-external'
        >
          <ExternalLink className={buttonIconClass} />
          <span className='truncate'>{externalLabel}</span>
        </button>
        {/*
          ICON ONLY, exactly as the mockup draws it, and it is a WIDTH decision
          measured in the running app rather than a taste one. These labels are
          long ("Open in Hearth app" alone measured ~185px), and at the ~348px
          the strip above is designed against, 30px of card padding plus 21px of
          gaps plus this 34px button leaves ~263px for the other three - so this
          one giving up its text is necessary even with truncation doing the
          rest. The folder glyph is the most self-evident of the four, so it is
          the one that loses it, and it keeps the label as its tooltip and its
          accessible name. `shrink-0` because there is nothing left to give.
        */}
        <button
          type='button'
          className={`${secondaryButtonClass} shrink-0 px-9px`}
          disabled={busy}
          onClick={() => void reveal()}
          title={t('conversation.artifactCard.reveal')}
          aria-label={t('conversation.artifactCard.reveal')}
          data-testid='artifact-card-reveal'
        >
          <FolderOpen className='size-14px' />
        </button>
        <button
          type='button'
          className={secondaryButtonClass}
          disabled={busy}
          onClick={() => void saveCopy()}
          data-testid='artifact-card-save-copy'
        >
          <Save className={buttonIconClass} />
          <span className='truncate'>{t('conversation.artifactCard.saveCopy')}</span>
        </button>
      </div>
    </div>
  );
};

const MessageArtifactCard: React.FC<{ message: IMessageArtifactCard }> = ({ message }) => {
  const { t } = useTranslation();
  const artifacts = message.content?.artifacts ?? [];
  const rejected = message.content?.rejected ?? [];
  const unsupported = message.content?.unsupported ?? [];

  /**
   * Fold the host's thirteen reasons into the five a person can act on.
   *
   * `1 escapes-workspace` was being rendered to a non-technical user at the
   * exact moment their report did not arrive. `rejectionBucketFor` is the
   * host's own table and the union is closed, so a fourteenth reason is a build
   * error rather than a slug on screen.
   */
  const rejectionDetail = useMemo(() => {
    const counts = new Map<ArtifactRejectionBucket, number>();
    for (const entry of rejected) {
      const bucket = rejectionBucketFor(entry.reason);
      counts.set(bucket, (counts.get(bucket) ?? 0) + entry.count);
    }
    return [...counts].map(([bucket, count]) => t(REJECTION_KEYS[bucket], { count })).join(', ');
  }, [rejected, t]);

  // A card with nothing on it is never written by the host, but a persisted
  // conversation from a future/older shape must not render an empty box.
  if (artifacts.length === 0 && rejected.length === 0 && unsupported.length === 0) return null;

  // Stable: `sort` is stable in every engine we ship on, and equal ranks compare
  // 0, so files of the same kind keep the order the host recorded them in.
  const ordered = [...artifacts].sort(
    (left, right) => deliverableRank(left.fileName) - deliverableRank(right.fileName)
  );
  const shown = ordered.slice(0, MAX_ROWS);
  const overflow = ordered.length - shown.length;

  return (
    <div
      // THE CARD TAKES THE MESSAGE COLUMN, and the `!` is still load-bearing.
      //
      // It used to cap at 520px. Live, that made the card visibly narrower than
      // the prose directly above it - the answer text ran past the card's right
      // edge - so it read as a different, smaller object rather than part of the
      // same reply. It also cost nothing but legibility: the action row shrinks
      // rather than wraps, so the squeeze came straight out of the labels and
      // "Open here" / "Save a copy" rendered as "Open h…" / "Save a co…" on a
      // column with room to spare. A card that lists N files wants that width.
      //
      // The `!` stays because the hosting bubble carries `[&>div]:max-w-full`,
      // whose generated `.…max-w-full > div` selector outranks a plain utility -
      // measured in the running app, where getComputedStyle reported maxWidth
      // 100% while the class was present and generated the whole time.
      //
      // The narrow case is unchanged and still real: with the workbench docked
      // the shell can hand this card ~348px, which is what the action row below
      // is designed against.
      className='my-6px !max-w-full of-hidden rd-14px b-1px b-solid b-[var(--border-base)] bg-1'
      data-testid='artifact-card'
    >
      {/*
        B5. THE CORRECTION, ABOVE THE FILES IT IS CORRECTING.
        -------------------------------------------------------------------
        The assistant said it saved a file and the host, holding the directory
        walk and the assistant's own words at the same instant, could not find
        it. It is stated QUIETLY and FACTUALLY: no red banner, no toast, no
        modal, and nothing about the model. The host says what it checked.
        The failure being fixed is silent wrongness, and the remedy for silent
        wrongness is a visible fact in the place the user goes looking for
        files - not an alarm they learn to dismiss. It rides the persisted card
        rather than a transient notification so it is still there tomorrow.
      */}
      {unsupported.length > 0 && (
        <div
          className='b-b-1px b-b-solid b-b-[var(--border-light)] px-15px py-11px text-12px text-t-secondary'
          data-testid='artifact-card-unsupported'
        >
          {unsupported.map((claim) => (
            <div key={`${claim.verdict}:${claim.fileName}`} className='truncate'>
              {t(unsupportedKeyFor(claim), {
                fileName: claim.fileName,
                actualPath: claim.actualPath ?? '',
              })}
            </div>
          ))}
        </div>
      )}

      {shown.map((artifact, position) => (
        <ArtifactRow
          key={artifact.artifactId}
          artifact={artifact}
          withPreview={position === 0}
          divided={position > 0}
          accent={position === 0}
        />
      ))}

      {overflow > 0 && (
        <div
          className='b-t-1px b-t-solid b-t-[var(--border-light)] px-15px py-10px text-11px text-t-tertiary'
          data-testid='artifact-card-more'
        >
          {t('conversation.artifactCard.more', { count: overflow })}
        </div>
      )}

      {/*
        THE REJECTION LINE. Without it a file the ledger refused is simply
        absent, which the user reads as "the agent never wrote it". Naming the
        count and the reason is the difference between a bug report and a
        setting they can change.
      */}
      {rejected.length > 0 && (
        <div
          className='b-t-1px b-t-solid b-t-[var(--border-light)] px-15px py-10px text-11px text-t-tertiary'
          data-testid='artifact-card-rejected'
        >
          {t('conversation.artifactCard.rejected', {
            count: rejected.reduce((total, entry) => total + entry.count, 0),
            detail: rejectionDetail,
          })}
        </div>
      )}
    </div>
  );
};

export default MessageArtifactCard;
