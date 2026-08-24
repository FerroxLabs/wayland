/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9. The host-owned controls for a deliverable, and its run history.
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
 * a file of the renderer's choosing. That holds for an EARLIER RUN too: a
 * history row carries the artifact ids of that run, and clicking one is the
 * same `artifacts.open` call, through the same resolution and the same type
 * gate, as clicking the button at the top.
 *
 * TWO THINGS ARRIVE LATE, AND NEITHER MAY DELAY THE CARD.
 *
 *  - The APP NAME. There is no cross-platform API for the default handler of a
 *    file extension, so the host resolves it out of process and may not be able
 *    to answer at all. The button therefore renders as "Open" immediately and
 *    UPGRADES to "Open in Preview" if and when a name arrives. No spinner: a
 *    spinner on the primary action would make the card look busy in order to
 *    tell the user something they can already act without.
 *  - The RUN HISTORY. It reads a directory tree and the ledger. Absent, the
 *    card is exactly what it was before this round.
 */

import { ipcBridge } from '@/common';
import type { ArtifactSeriesRun, ArtifactSeriesView, ArtifactSummary } from '@/common/types/artifacts';
import type { ArtifactActions } from '@/renderer/pages/conversation/Preview/hooks/useArtifactActions';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileWarning,
  FolderOpen,
  RefreshCw,
  Save,
} from 'lucide-react';
import { usePreviewLauncher } from '@/renderer/hooks/file/usePreviewLauncher';
import {
  previewContentTypeForFileName,
  previewIsEditable,
} from '@/renderer/pages/conversation/Preview/previewContentType';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ArtifactActionBarProps {
  artifact: ArtifactSummary;
  /** Toast sink. Kept as a prop so the panel's message context owns the surface. */
  onMessage: (kind: 'success' | 'error', text: string) => void;
  /**
   * The SHARED action state, owned by the panel.
   *
   * `changed` is discovered by ATTEMPTING an action - the host refuses with
   * `ARTIFACT_CHANGED_ERROR` - and the controls that attempt it now live in the
   * toolbar above. A second `useArtifactActions` here would give this bar its own
   * `changed`, which the toolbar's refusal would never set, and the banner would
   * never appear. One instance, passed in.
   */
  actions: ArtifactActions;
}

const buttonClass =
  'flex shrink-0 items-center gap-4px whitespace-nowrap px-8px py-4px rd-6px cursor-pointer border-none bg-transparent ' +
  'text-12px text-t-secondary hover:bg-3 hover:text-t-primary transition-colors disabled:opacity-50';

/**
 * The one accent-filled control in this bar. Reserved for the repair, which is
 * the only action here that is a RECOMMENDATION rather than a choice: when the
 * record is stale, updating it is what the user wants next. `#1a0d06` is a
 * literal on purpose - there is no token for text ON the brand colour, and the
 * brand orange is the same value in both themes.
 */
const primaryButtonClass =
  'flex shrink-0 items-center gap-4px whitespace-nowrap px-10px py-4px rd-6px cursor-pointer border-none ' +
  'bg-brand text-12px font-600 text-[#1a0d06] hover:opacity-90 transition-opacity disabled:opacity-50';

const linkClass =
  'px-6px py-2px rd-4px cursor-pointer border-none bg-transparent text-12px text-t-secondary ' +
  'hover:bg-3 hover:text-t-primary transition-colors disabled:opacity-50 truncate max-w-200px';

/**
 * The task-id namespace a chat's deliverables are filed under. Mirrors
 * `chatTaskIdFor` in the host's `chatRun.ts`; both sides derive it from the same
 * conversation id at registration time.
 */
const CHAT_TASK_PREFIX = 'chat:';

/**
 * Would the host actually honour an Update on this deliverable?
 *
 * `refreshChatArtifact` refuses a published series run BY DESIGN: re-registering
 * one would launder a tampered file into a fresh valid record, and the record of
 * what a scheduled task produced on a given day is the whole point of a series.
 * So an Update button on a series run is a button that always fails, which is
 * worse than no button - it promises a repair and then blames the user.
 *
 * The host gates on the record's `relativePath` (`artifacts/chat/<id>/...`),
 * which the renderer never sees; the summary carries `taskId`. Both are written
 * by the same `sweepChatRun` call from the same conversation id, so they agree -
 * and `artifactRepairEligibility.test.ts` proves it by running the real
 * registration paths and comparing this predicate against what
 * `refreshChatArtifact` ACTUALLY returns, so the two cannot drift apart quietly.
 */
export function canRepairArtifact(artifact: Pick<ArtifactSummary, 'taskId'>): boolean {
  return typeof artifact.taskId === 'string' && artifact.taskId.startsWith(CHAT_TASK_PREFIX);
}

/** Local date and time. A run is a moment in the user's day, not a UTC string. */
function formatRunTime(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
}

const ArtifactActionBar: React.FC<ArtifactActionBarProps> = ({ artifact, onMessage, actions }) => {
  const { busy, changed, repair } = actions;
  const { t } = useTranslation();
  const [series, setSeries] = useState<ArtifactSeriesView | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { launchPreview } = usePreviewLauncher();

  const artifactId = artifact.artifactId;

  useEffect(() => {
    setSeries(null);
    setExpanded(false);
    let cancelled = false;
    void ipcBridge.artifacts.series
      .invoke({ artifactId })
      .then((result) => {
        if (!cancelled) setSeries(result ?? null);
      })
      .catch(() => {
        // No history is the honest answer for an artifact that is not filed in
        // a series, and it must never take the preview panel down.
        if (!cancelled) setSeries(null);
      });
    return () => {
      cancelled = true;
    };
  }, [artifactId]);

  /**
   * PREVIEW IS THE INTERNAL VIEWER; OPEN IS THE EXTERNAL TOOL.
   *
   * A history row used to LAUNCH the earlier run in the OS default application,
   * which put "show me yesterday's as well" in a second external window - and
   * made it hostage to whatever that application does with the format. This app
   * already renders the deliverable; the row is a link inside the viewer, so it
   * previews here and `Open in <app>` stays the one explicit hand-off outward.
   *
   * The path is the host's own `canonicalPath` off the summary, read through the
   * same `fs.readFile` the workspace tree uses for any file it shows. Nothing
   * new crosses the boundary and no launcher is involved, so none of the type
   * gate's reasons for existing apply: this renders bytes, it does not ask the
   * OS to execute anything.
   */
  const previewRun = useCallback(
    (deliverable: ArtifactSummary) => {
      const contentType = previewContentTypeForFileName(deliverable.fileName);
      void launchPreview({
        originalPath: deliverable.canonicalPath,
        fileName: deliverable.fileName,
        title: deliverable.fileName,
        contentType,
        editable: previewIsEditable(contentType),
      });
    },
    [launchPreview]
  );

  // reportRefusal / openById / repair / run / openLabel all moved into
  // `useArtifactActions`, because the controls that call them moved to the
  // toolbar and `changed` has to be ONE state shared with this banner.

  const newestRun: ArtifactSeriesRun | undefined = series?.runs[0];
  const currentRun = useMemo(() => series?.runs.find((entry) => entry.current), [series]);
  const showingNewest = Boolean(newestRun && currentRun && currentRun.runId === newestRun.runId);

  return (
    <div className='flex flex-col bd-b b-solid b-1px b-border text-12px'>
      {/*
        IDENTITY ROW, THEN ACTION ROW.

        One row could not hold both. The panel this bar lives in is ~296px by
        default, and the three labelled buttons plus the type chip need ~335px
        on their own - so the row first squeezed the canonical path to ZERO
        width (deleting the one thing the bar exists to state) and then still
        pushed "Save a copy" past the panel edge, with `overflow-x: visible`
        and no scroll port to reach it. The third action was unclickable at the
        width the user actually gets.

        Stacking is unconditional rather than breakpoint-driven on purpose:
        UnoCSS breakpoints track the VIEWPORT, and this panel is resized
        independently of it, so a `sm:` rule would flip on window width while
        the panel stayed narrow.
      */}
      <div className='flex flex-col gap-4px px-12px py-6px'>
        <div className='flex items-center gap-8px'>
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
        </div>
        {/*
          THE ACTION ROW MOVED TO THE TOOLBAR - it is not gone.

          It carried Open with <app>, Show in folder and Save a copy, directly
          under a toolbar already offering Open in system app and Download. To a
          reader that was the same row twice. It was NOT the same thing twice:
          the toolbar's controls handed `metadata.filePath` - a RAW PATH - to
          `shell.openFile`, while these sent an artifact id and nothing else.
          Deleting the id-based row would have quietly downgraded that boundary,
          so the ACTIONS moved up and took their id-only calls with them: the
          toolbar routes through `useArtifactActions` whenever the preview is
          artifact-backed.

          What stays here is what is duplicated nowhere - the canonical path this
          preview resolves to, the changed-file banner with its one honest
          repair, and the run history.
        */}
      </div>

      {/*
        THE CHANGED-FILE BANNER, AND THE ONE REPAIR THAT IS NOT A LIE.

        Sits between the actions and the history because it changes what those
        actions MEAN: the file the buttons address is not the file the ledger
        describes. Amber, not red - nothing is broken and nothing is lost, the
        record is simply out of date.

        A CHAT deliverable gets an Update button, which re-registers the file
        through the full verification path and keeps the same artifact id, so
        the card already on screen survives the repair. A published SERIES run
        gets a SENTENCE instead, because `refreshChatArtifact` refuses one on
        purpose and an Update there would fail every single time.
      */}
      {changed && (
        <div
          className='flex flex-wrap items-center gap-8px b-t-1px b-t-solid b-t-[var(--border-light)] bg-[var(--warning-soft-bg)] px-12px py-6px text-warning'
          role='status'
          data-testid='artifact-bar-changed'
        >
          <AlertTriangle className='size-14px shrink-0' />
          <span className='min-w-0 flex-1'>{t('preview.artifactChanged')}</span>
          {canRepairArtifact(artifact) ? (
            <button
              type='button'
              className={primaryButtonClass}
              disabled={busy}
              onClick={() => void repair()}
              data-testid='artifact-bar-update'
            >
              <RefreshCw className='size-14px' />
              {t('preview.artifactUpdate')}
            </button>
          ) : (
            <span className='text-t-secondary' data-testid='artifact-bar-changed-series'>
              {t('preview.artifactChangedSeries')}
            </span>
          )}
        </div>
      )}

      {series && series.runs.length > 0 && (
        <div className='flex flex-col px-12px pb-6px' data-testid='artifact-series'>
          <div className='flex items-center gap-8px text-t-secondary'>
            <span data-testid='artifact-series-position'>
              {showingNewest
                ? t('preview.artifactRunNewest', { when: formatRunTime(currentRun?.at ?? artifact.runAt) })
                : t('preview.artifactRunEarlier', { when: formatRunTime(currentRun?.at ?? artifact.runAt) })}
            </span>
            {series.totalRuns > 1 ? (
              <button
                type='button'
                className={buttonClass}
                onClick={() => setExpanded((open) => !open)}
                data-testid='artifact-series-toggle'
              >
                {expanded ? <ChevronDown className='size-14px' /> : <ChevronRight className='size-14px' />}
                {t('preview.artifactRunCount', { total: series.totalRuns })}
              </button>
            ) : (
              <span data-testid='artifact-series-only'>{t('preview.artifactOnlyRun')}</span>
            )}
          </div>

          {/*
            The newest run failing is the case the console.warn used to hide
            completely: the series simply stopped advancing and nothing said
            why. It is surfaced whether or not the history is expanded, because
            it changes what the file on screen MEANS - it is no longer today's.
          */}
          {newestRun && newestRun.status === 'failed' && (
            <div className='flex items-center gap-4px pt-4px text-t-secondary' data-testid='artifact-series-alert'>
              <AlertTriangle className='size-14px' />
              {t('preview.artifactNewestRunFailed', { when: formatRunTime(newestRun.at) })}
            </div>
          )}

          {expanded && (
            <ul className='m-0 mt-4px flex list-none flex-col gap-2px p-0' data-testid='artifact-series-runs'>
              {series.runs.map((entry) => (
                <li key={entry.runId} className='flex items-center gap-8px py-2px' data-testid='artifact-series-run'>
                  <span className='w-140px shrink-0 text-t-secondary'>{formatRunTime(entry.at)}</span>
                  {entry.status === 'failed' && (
                    <span className='flex items-center gap-4px text-t-secondary' title={entry.message ?? ''}>
                      <AlertTriangle className='size-14px' />
                      {t('preview.artifactRunFailed')}
                    </span>
                  )}
                  {entry.status === 'no-output' && (
                    <span className='flex items-center gap-4px text-t-secondary'>
                      <FileWarning className='size-14px' />
                      {t('preview.artifactRunNoOutput')}
                    </span>
                  )}
                  {entry.artifacts.map((deliverable) => (
                    <button
                      key={deliverable.artifactId}
                      type='button'
                      className={linkClass}
                      disabled={busy}
                      title={deliverable.canonicalPath}
                      onClick={() => previewRun(deliverable)}
                    >
                      {deliverable.fileName}
                    </button>
                  ))}
                  {entry.current && <span className='text-t-secondary'>{t('preview.artifactRunCurrent')}</span>}
                </li>
              ))}
              {series.totalRuns > series.runs.length && (
                <li className='py-2px text-t-secondary' data-testid='artifact-series-capped'>
                  {t('preview.artifactHistoryCapped', { shown: series.runs.length, total: series.totalRuns })}
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtifactActionBar;
