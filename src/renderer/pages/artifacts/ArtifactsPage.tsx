/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE RAIL. Everything a chat or a scheduled task has ever saved for the user,
 * in one place they can find again tomorrow.
 *
 * Three rules this page exists to keep, all of them about not lying:
 *
 *  - A ROW IS NEVER REMOVED FOR BEING BROKEN. A deliverable whose file has gone
 *    is the exact case the user came here to investigate; filtering it out
 *    answers "where did my report go?" with an empty page. Every row renders,
 *    labelled with what the filesystem said at enumeration time and, when that
 *    is not `ready`, a plain-English reason.
 *  - A PARTIALLY UNREADABLE LEDGER RENDERS WHAT PARSED. One corrupt JSONL line
 *    must not blank the rail. What parsed is listed and the rest is counted out
 *    loud above it.
 *  - NO PATH LEAVES THIS COMPONENT. Every action sends an `artifactId`. The
 *    host re-resolves it through the ledger and re-verifies the file on every
 *    click, so a stale or mismatched row cannot make the host act on a file of
 *    the renderer's choosing.
 *
 * REMOVE FROM LIST IS NOT DELETE. The ledger gained an append-only TOMBSTONE,
 * so a row can now be dismissed - and that is all it does. No path is resolved,
 * no bytes are touched, and re-publication brings the row straight back. The
 * complaint it closes is exact: deleting a deliverable in Finder turned its row
 * into a red Missing one the app gave you no way to get rid of.
 *
 * It still ASKS FIRST. Not because the file is at risk - it is not - but
 * because a button called "remove" next to a report the user cares about must
 * not be a one-click surprise, and the confirm is the only place there is room
 * to say plainly that the file survives.
 */

import { ipcBridge } from '@/common';
import { ARTIFACT_CHANGED_ERROR } from '@/common/types/artifacts';
import type { ArtifactDiskStatus, ArtifactSummary } from '@/common/types/artifacts';
import PageShell from '@renderer/components/layout/PageShell';
import { usePreviewLauncher } from '@renderer/hooks/file/usePreviewLauncher';
import { PreviewPanel, PreviewProvider, usePreviewContext } from '@/renderer/pages/conversation/Preview';
import {
  previewContentTypeForFileName,
  previewIsEditable,
} from '@renderer/pages/conversation/Preview/previewContentType';
import { formatArtifactSize } from '@/common/types/artifacts';
import { Modal } from '@arco-design/web-react';
import {
  AlertTriangle,
  Braces,
  File,
  FileCode,
  FileText,
  FolderOpen,
  Package,
  Save,
  Table2,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; artifacts: ArtifactSummary[]; unreadableEntries: number; truncated: boolean };

/*
  THE SHELF SPEAKS THE CARD'S LANGUAGE.

  A row here and the in-chat card are the same object seen twice, so they use
  the same tile tints, the same type/size/time meta line, the same button
  shapes and the same one-accent-button rule. Four identical flat text links -
  what this row used to be - is precisely the treatment that was rejected.

  BORDERS ARE WRITTEN AS ARBITRARY VALUES, DELIBERATELY. `b-border` emits
  NOTHING in this repo's UnoCSS config (verified by running the generator with
  `bg-1` as a known positive first) and `b-base` resolves to the PAGE
  background, which would paint #0a0a0a onto a #222222 panel. Only
  `b-[var(--border-base)]` reaches the rule colour. The same probe found
  `text-t-3` - which this page used in three places, including the Ready label
  and the whole meta line - emits nothing at all, so that text had no colour
  rule and simply inherited. The real key is `t-tertiary`.
*/
const buttonBase =
  'flex shrink-0 items-center gap-6px whitespace-nowrap rd-7px px-10px py-5px cursor-pointer ' +
  'b-1px b-solid text-12px font-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

/** The one accent-filled control per row. `#1a0d06` is a literal because no
 *  token exists for text ON the brand colour, and the brand is theme-stable. */
const primaryButtonClass = `${buttonBase} bg-brand b-[var(--brand)] text-[#1a0d06] font-600 hover:bg-[var(--brand-hover)]`;

const secondaryButtonClass = `${buttonBase} bg-3 b-[var(--border-base)] text-t-primary hover:bg-2`;

/** Quiet by design: removal must not compete with the actions that open things. */
const quietButtonClass = `${buttonBase} bg-transparent b-[var(--border-light)] text-t-secondary hover:bg-2 hover:text-t-primary`;

/**
 * The tile's look, by extension.
 *
 * Tints come from the SOFT token pairs, never the raw semantic colours: light
 * `--success` is #047857 and light `--warning` is #a8500a, deliberate WCAG
 * flips rather than the same family, so a tile filled with the raw colour is a
 * different object in the two themes.
 *
 * Kept in step with the in-chat card by hand. The two tables live in different
 * files because they belong to different lanes of this change; folding them
 * into one shared module is a named follow-up, not a thing to do at the same
 * time as the restyle they both describe.
 */
interface TypeLook {
  Icon: typeof FileText;
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

/** Format proper nouns are NOT translated; anything unknown is its uppercased
 *  extension, and a file with no extension contributes no segment at all. */
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

const extensionOf = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
};

const formatLabel = (fileName: string): string => {
  const extension = extensionOf(fileName);
  if (!extension) return '';
  return FORMAT_NAMES[extension] ?? extension.toUpperCase();
};

/**
 * The day a deliverable belongs to, as a stable key AND a printable heading.
 *
 * Grouped on the LOCAL date: a run is a moment in the user's day, and grouping
 * a 6am brief under the previous day because UTC says so is the kind of detail
 * that makes a list feel broken without being wrong anywhere you can point at.
 */
function dayOf(iso: string): { key: string; label: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { key: 'unknown', label: iso };
  const key = `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
  return {
    key,
    label: parsed.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

/**
 * Local clock time for the per-row timestamp, to the minute.
 *
 * `toLocaleTimeString()` printed seconds, which is noise on a shelf grouped by
 * day and does not match the card. Same `Intl` options as the card uses.
 */
function timeOf(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(parsed);
  } catch {
    return '';
  }
}

const STATUS_KEY: Record<ArtifactDiskStatus, string> = {
  ready: 'preview.artifactStatusReady',
  empty: 'preview.artifactStatusEmpty',
  missing: 'preview.artifactStatusMissing',
};

const STATUS_CLASS: Record<ArtifactDiskStatus, string> = {
  // `text-t-3` was not a real utility - it emitted no rule at all, so the Ready
  // label had no colour and simply inherited. `t-tertiary` is the actual key.
  ready: 'text-t-tertiary',
  empty: 'text-warning',
  missing: 'text-danger',
};

const ArtifactsRail: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** The row awaiting a confirmed Remove, or null. Never a boolean plus an id. */
  const [pendingForget, setPendingForget] = useState<ArtifactSummary | null>(null);
  const { launchPreview } = usePreviewLauncher();
  // The rail hosts its own preview surface (see the provider below), so this
  // reads the LOCAL panel's state, not the conversation's.
  const { isOpen: previewOpen } = usePreviewContext();

  const load = useCallback(async (): Promise<void> => {
    try {
      const listing = await ipcBridge.artifacts.list.invoke();
      // The listing is an ENVELOPE. `?? []` on the whole thing would be a type
      // lie, so the shape is checked before it is trusted: a paired WebUI's
      // denied call rejects into the catch below, but a malformed reply from
      // anywhere else must not reach `.map`.
      if (!listing || !Array.isArray(listing.artifacts)) {
        setState({ kind: 'failed' });
        return;
      }
      setState({
        kind: 'loaded',
        artifacts: listing.artifacts,
        unreadableEntries: Number.isSafeInteger(listing.unreadableEntries) ? listing.unreadableEntries : 0,
        // The host caps the listing at MAX_LISTED_ARTIFACTS. Until now row 501
        // simply vanished, which contradicts this page's own first promise that
        // a row is never removed. `=== true` rather than truthiness: an older
        // host that predates the field must read as "not truncated", not as
        // "unknown, so say something alarming".
        truncated: listing.truncated === true,
      });
    } catch {
      // `artifacts.` is remote-denied, so on a paired WebUI this call REJECTS
      // (BridgeUnavailableError) rather than resolving. Reporting the failure
      // is the difference between an honest empty state and a blank page.
      setState({ kind: 'failed' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    if (state.kind !== 'loaded') return [];
    const byDay = new Map<string, { key: string; label: string; rows: ArtifactSummary[] }>();
    // The host already sorted newest-first; grouping preserves that order, so
    // the day headers come out newest-first too without a second sort.
    for (const artifact of state.artifacts) {
      const day = dayOf(artifact.runAt);
      const existing = byDay.get(day.key);
      if (existing) existing.rows.push(artifact);
      else byDay.set(day.key, { key: day.key, label: day.label, rows: [artifact] });
    }
    return [...byDay.values()];
  }, [state]);

  const openHere = useCallback(
    (artifact: ArtifactSummary) => {
      const contentType = previewContentTypeForFileName(artifact.fileName);
      void launchPreview({
        originalPath: artifact.canonicalPath,
        fileName: artifact.fileName,
        title: artifact.fileName,
        contentType,
        editable: previewIsEditable(contentType),
      });
    },
    [launchPreview]
  );

  /**
   * ONE HOST REFUSAL IS NOT A SENTENCE, SO IT DOES NOT GET INTERPOLATED.
   *
   * `artifact has changed since it was recorded` is an internal literal about a
   * digest check. Printed into "Could not show this deliverable: {{error}}" it
   * told a non-technical person nothing they could act on, at the exact moment
   * their file was in fact perfectly fine. It is intercepted BY VALUE against
   * the shared contract constant and replaced with a sentence; every other
   * refusal keeps its interpolation, because the others do read.
   *
   * The rail says what happened and stops there. The REPAIR lives in the action
   * bar, which this page already renders in its own preview panel - opening the
   * row is how you get the Update button, and duplicating it per row would put
   * a second, differently-worded repair on the same file.
   */
  const refusalText = useCallback(
    (error: string | undefined, key: string): string =>
      error === ARTIFACT_CHANGED_ERROR ? t('preview.artifactChanged') : t(key, { error: error ?? '' }),
    [t]
  );

  const runAction = useCallback(
    async (artifactId: string, action: 'reveal' | 'saveCopy'): Promise<void> => {
      setBusyId(artifactId);
      setNotice(null);
      try {
        if (action === 'reveal') {
          const result = await ipcBridge.artifacts.reveal.invoke({ artifactId });
          // Resolve-only: a refusal arrives as `{ ok: false }`, never as a
          // rejection, so an unchecked await is a dead button.
          if (!result?.ok) setNotice(refusalText(result?.error, 'preview.artifactRevealFailed'));
          return;
        }
        const result = await ipcBridge.artifacts.saveCopy.invoke({ artifactId });
        if (!result?.ok) {
          setNotice(refusalText(result?.error, 'preview.artifactSaveFailed'));
          return;
        }
        // No `savedTo` means the user cancelled the dialog. Not a failure.
        if (result.savedTo) setNotice(t('preview.artifactSaved', { path: result.savedTo }));
      } catch {
        setNotice(t('preview.artifactsRailFailed'));
      } finally {
        setBusyId(null);
      }
    },
    [refusalText, t]
  );

  /**
   * Confirmed removal. Optimistic on purpose: the host has already appended the
   * tombstone by the time this resolves, and re-reading the whole listing to
   * drop one row would repaint a 500-row page for a change we already know the
   * shape of. On a refusal nothing is dropped and the reason is said out loud.
   */
  const confirmForget = useCallback(async (): Promise<void> => {
    const target = pendingForget;
    if (!target) return;
    setPendingForget(null);
    setBusyId(target.artifactId);
    setNotice(null);
    try {
      const result = await ipcBridge.artifacts.forget.invoke({ artifactId: target.artifactId });
      if (!result?.ok) {
        setNotice(t('preview.artifactForgetFailed', { error: result?.error ?? '' }));
        return;
      }
      setState((current) =>
        current.kind === 'loaded'
          ? { ...current, artifacts: current.artifacts.filter((entry) => entry.artifactId !== target.artifactId) }
          : current
      );
      setNotice(t('preview.artifactForgotten'));
    } catch {
      // Remote-denied on a paired WebUI, like every other artifacts call here.
      setNotice(t('preview.artifactsRailFailed'));
    } finally {
      setBusyId(null);
    }
  }, [pendingForget, t]);

  const total = state.kind === 'loaded' ? state.artifacts.length : 0;

  return (
    <PageShell
      title={t('preview.artifactsRailTitle')}
      subtitle={t('preview.artifactsRailSubtitle')}
      icon={<Package size={20} />}
      countLabel={state.kind === 'loaded' ? String(total) : undefined}
      countTestId='artifacts-rail-count'
      testId='artifacts-rail'
    >
      <div className='flex items-start gap-16px'>
        <div className={previewOpen ? 'w-420px shrink-0 min-w-0' : 'flex-1 min-w-0'}>
          {notice ? (
            <div className='mb-12px text-12px text-t-secondary' role='status'>
              {notice}
            </div>
          ) : null}

          {state.kind === 'failed' ? (
            <div className='py-40px text-center text-13px text-t-secondary' data-testid='artifacts-rail-failed'>
              {t('preview.artifactsRailFailed')}
            </div>
          ) : null}

          {state.kind === 'loaded' && state.unreadableEntries > 0 ? (
            // ABOVE the list, never instead of it.
            <div
              className='mb-12px flex items-start gap-6px rd-6px px-10px py-8px bg-2 text-12px text-warning'
              role='alert'
              data-testid='artifacts-rail-partial'
            >
              <AlertTriangle size={14} className='mt-2px shrink-0' />
              <span>{t('preview.artifactsRailPartial', { count: state.unreadableEntries })}</span>
            </div>
          ) : null}

          {state.kind === 'loaded' && total === 0 ? (
            <div className='py-40px text-center' data-testid='artifacts-rail-empty'>
              <div className='text-14px text-t-primary'>{t('preview.artifactsRailEmpty')}</div>
              <div className='mt-4px text-12px text-t-secondary'>{t('preview.artifactsRailEmptyHint')}</div>
            </div>
          ) : null}

          {state.kind === 'loaded' && state.truncated ? (
            /* Under the warning and ABOVE the list: it is a fact about the list, so
           it belongs where the list starts, not buried at the bottom where a
           500-row page means nobody reads it. */
            <div className='mb-12px text-12px text-t-secondary' role='status' data-testid='artifacts-rail-truncated'>
              {t('preview.artifactsRailTruncated', { shown: total })}
            </div>
          ) : null}

          {groups.map((group) => (
            <section key={group.key} className='mb-20px' data-testid='artifacts-rail-group'>
              <h2 className='mb-8px text-12px font-medium text-t-secondary' data-testid='artifacts-rail-day'>
                {group.label}
              </h2>
              <ul className='list-none p-0 m-0 flex flex-col gap-6px'>
                {group.rows.map((artifact) => {
                  const status: ArtifactDiskStatus = artifact.diskStatus ?? 'ready';
                  const reachable = status === 'ready';
                  const look = TYPE_LOOKS[extensionOf(artifact.fileName)] ?? NEUTRAL_LOOK;
                  const TileIcon = look.Icon;
                  // TYPE - SIZE - TIME - WHO. Empty segments are dropped rather
                  // than printed as a run of separators.
                  const meta = [
                    formatLabel(artifact.fileName),
                    formatArtifactSize(artifact.sizeBytes),
                    timeOf(artifact.runAt),
                    artifact.declaredBy,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <li
                      key={artifact.artifactId}
                      className='flex flex-wrap items-center gap-12px rd-10px b-1px b-solid b-[var(--border-base)]
                    bg-1 px-12px py-10px hover:bg-2 transition-colors'
                      data-testid='artifacts-rail-row'
                      data-disk-status={status}
                    >
                      <div
                        className={`grid size-36px shrink-0 place-items-center rd-9px b-1px b-solid ${look.tile}`}
                        aria-hidden
                      >
                        <TileIcon className={`size-16px ${look.icon}`} />
                      </div>
                      {/* A floor, not min-w-0. At zero the shrink-0 action buttons
                      eat the whole row and the file name collapses to a single
                      letter; with a floor the actions wrap onto their own line
                      instead, which is what flex-wrap on the row is for. */}
                      <div className='min-w-160px flex-1'>
                        <div className='flex items-center gap-8px min-w-0'>
                          {/* The filename is the strong line. It is what the user
                          is looking for; everything else on the row is context
                          for it. */}
                          <span
                            className='truncate text-13px font-500 text-t-primary'
                            title={artifact.canonicalPath}
                            data-testid='artifacts-rail-name'
                          >
                            {artifact.fileName}
                          </span>
                          <span
                            className={`shrink-0 text-11px ${STATUS_CLASS[status]}`}
                            data-testid='artifacts-rail-status'
                          >
                            {t(STATUS_KEY[status])}
                          </span>
                        </div>
                        <div
                          className='mt-2px truncate text-11px font-mono text-t-tertiary'
                          data-testid='artifacts-rail-meta'
                        >
                          {meta}
                        </div>
                        {status === 'missing' ? (
                          <div className='mt-4px text-11px text-t-secondary' data-testid='artifacts-rail-reason'>
                            {t('preview.artifactMissingReason')}
                          </div>
                        ) : null}
                        {status === 'empty' ? (
                          <div className='mt-4px text-11px text-t-secondary' data-testid='artifacts-rail-reason'>
                            {t('preview.artifactEmptyReason')}
                          </div>
                        ) : null}
                      </div>
                      {/* ONE accent button per row, and it is the one that shows
                      the user their file. Four equal-weight controls is what
                      made this row read as a list of links rather than as a
                      thing with a primary action.

                      NOT `shrink-0` ON THIS CONTAINER, and that is load-bearing.
                      With the preview panel open the list column is a fixed
                      420px; a shrink-0 actions block keeps its full 512px
                      single-line width even after wrapping onto its own row, so
                      it overflowed by ~105px and Remove from list was CLIPPED
                      OFF THE ROW with no way to reach it. Measured in the
                      running app, not reasoned about. Letting the container
                      shrink lets its own flex-wrap break the buttons across
                      lines instead; the BUTTONS stay shrink-0 so no label ever
                      squashes. */}
                      <div className='flex min-w-0 flex-wrap items-center justify-end gap-6px'>
                        {/* A missing file has nothing to open or copy. Reveal still
                        works: showing the user the folder their file is NOT in
                        is exactly how they find out what happened to it. */}
                        <button
                          type='button'
                          className={primaryButtonClass}
                          disabled={!reachable || busyId === artifact.artifactId}
                          onClick={() => openHere(artifact)}
                          data-testid='artifacts-rail-open-here'
                        >
                          <FileText className='size-14px' />
                          {t('preview.artifactOpenHere')}
                        </button>
                        <button
                          type='button'
                          className={secondaryButtonClass}
                          disabled={busyId === artifact.artifactId}
                          onClick={() => void runAction(artifact.artifactId, 'reveal')}
                        >
                          <FolderOpen className='size-14px' />
                          {t('preview.artifactReveal')}
                        </button>
                        <button
                          type='button'
                          className={secondaryButtonClass}
                          disabled={!reachable || busyId === artifact.artifactId}
                          onClick={() => void runAction(artifact.artifactId, 'saveCopy')}
                        >
                          <Save className='size-14px' />
                          {t('preview.artifactSaveCopy')}
                        </button>
                        {/* Enabled on EVERY status, including missing. The row that
                        most needs removing is the red one whose file is gone -
                        gating this on `reachable` would leave the actual
                        complaint unfixed. */}
                        <button
                          type='button'
                          className={quietButtonClass}
                          disabled={busyId === artifact.artifactId}
                          title={t('preview.artifactForgetHint')}
                          onClick={() => setPendingForget(artifact)}
                          data-testid='artifacts-rail-forget'
                        >
                          <Trash2 className='size-14px' />
                          {t('preview.artifactForget')}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        {previewOpen ? (
          /* A definite height, deliberately. PageShell is a SCROLLING page
             (min-height:100%, overflow-y:auto), not a fixed-height app shell,
             so a fill-style child inside it resolves to zero - the same defect
             that made the Workbench tree invisible. 80vh gives the viewer real
             room without depending on an ancestor that has none to give. */
          <div className='flex-1 min-w-0 sticky top-0' style={{ height: '80vh' }} data-testid='artifacts-rail-preview'>
            <PreviewPanel />
          </div>
        ) : null}
      </div>

      {/*
        ASK FIRST. Same shape as the preview panel's external-open confirm, so
        the app has one dialog idiom rather than two. Cancel is the default: the
        modal's own dismissal paths (Escape, backdrop, the X) all land on
        `onCancel`, so nothing but a deliberate click removes the row.

        The body says the file survives, because that is the one thing a person
        needs to know before pressing a button called Remove, and it is the
        thing the word "remove" does not tell them.
      */}
      <Modal
        visible={pendingForget !== null}
        title={t('preview.artifactForgetTitle')}
        onCancel={() => setPendingForget(null)}
        onOk={() => void confirmForget()}
        okText={t('preview.artifactForgetConfirm')}
        cancelText={t('common.cancel')}
        okButtonProps={{ status: 'warning' }}
        style={{ borderRadius: '12px' }}
        alignCenter
        // The dialog LEAVES when it is dismissed. Arco keeps a closed modal
        // mounted by default, which means a hidden confirm for a row the user
        // decided to keep stays in the tree with its Ok handler still bound to
        // that row's id.
        unmountOnExit
        getPopupContainer={() => document.body}
      >
        <div className='text-14px text-t-secondary' data-testid='artifacts-rail-forget-confirm'>
          {t('preview.artifactForgetMessage')}
        </div>
      </Modal>
    </PageShell>
  );
};

/**
 * The rail owns its preview surface.
 *
 * `openPreview` only sets state; something must RENDER it. The global
 * `PreviewProvider` is mounted app-wide but the only `PreviewPanel` lived
 * inside the conversation layout, and `/artifacts` is routed bare - so the
 * rail's own open button set state nobody drew and the click did nothing at
 * all: no navigation, no panel, no console output, no IPC. A local provider
 * also keeps the Sider's route-change `closePreview` from tearing it down.
 * Same shape as ProjectFilesPanel, which solved this once already.
 */
const ArtifactsPage: React.FC = () => (
  <PreviewProvider>
    <ArtifactsRail />
  </PreviewProvider>
);

export default ArtifactsPage;
