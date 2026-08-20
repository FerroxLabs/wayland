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
 *
 * AND ONE THING MAY NOT ARRIVE AT ALL. "Send to..." is offered only when the
 * host reports a connector the user has actually configured, with somebody it
 * is authorized to reach. Nothing configured means NO BUTTON - not a disabled
 * one, not one that opens an empty menu. The other products put a destination
 * in the primary slot because their artifact lives somewhere awkward and every
 * action starts with a download; ours is already a real file in the user's own
 * Documents folder, so an unbacked destination here would be decoration.
 *
 * The menu shows a recipient's LABEL and sends that recipient's ID. The address
 * on screen is never what travels: main re-resolves the id against the live
 * connector registry, so a revoked recipient stops being reachable immediately
 * and a card rendering hostile data cannot name a destination of its own.
 */

import { ipcBridge } from '@/common';
import type {
  ArtifactSendErrorCode,
  ArtifactSendTarget,
  ArtifactSeriesRun,
  ArtifactSeriesView,
  ArtifactSummary,
} from '@/common/types/artifacts';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileWarning,
  FolderOpen,
  Save,
  Send,
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
}

const buttonClass =
  'flex shrink-0 items-center gap-4px whitespace-nowrap px-8px py-4px rd-6px cursor-pointer border-none bg-transparent ' +
  'text-12px text-t-secondary hover:bg-3 hover:text-t-primary transition-colors disabled:opacity-50';

const linkClass =
  'px-6px py-2px rd-4px cursor-pointer border-none bg-transparent text-12px text-t-secondary ' +
  'hover:bg-3 hover:text-t-primary transition-colors disabled:opacity-50 truncate max-w-200px';

/**
 * A refusal code, in words.
 *
 * `unknown_target`, `unknown_destination` and `invalid_request` all collapse to
 * the same sentence on purpose: from the user's side they are one situation -
 * the connector list moved between drawing the menu and clicking it, because
 * something was disabled or a recipient was revoked in Settings. Three
 * different messages for one situation is noise, and the distinctions matter to
 * the host, not to them.
 */
function sendReasonKey(code: ArtifactSendErrorCode | undefined): string {
  switch (code) {
    case 'unknown_artifact':
      return 'preview.artifactSendReasonMissing';
    case 'too_large':
      return 'preview.artifactSendReasonTooLarge';
    case 'send_failed':
      return 'preview.artifactSendReasonFailed';
    default:
      return 'preview.artifactSendReasonUnavailable';
  }
}

/** Local date and time. A run is a moment in the user's day, not a UTC string. */
function formatRunTime(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
}

const ArtifactActionBar: React.FC<ArtifactActionBarProps> = ({ artifact, onMessage }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [applicationName, setApplicationName] = useState<string | null>(null);
  const [series, setSeries] = useState<ArtifactSeriesView | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { launchPreview } = usePreviewLauncher();
  const [sendTargets, setSendTargets] = useState<ArtifactSendTarget[]>([]);
  const [sendOpen, setSendOpen] = useState(false);

  const artifactId = artifact.artifactId;

  useEffect(() => {
    // Reset first: a card switching artifacts must never show the previous
    // file's app name or history for even one frame.
    setApplicationName(null);
    let cancelled = false;
    void ipcBridge.artifacts.openTarget
      .invoke({ artifactId })
      .then((result) => {
        if (!cancelled) setApplicationName(result?.applicationName ?? null);
      })
      .catch(() => {
        // An unresolvable app name is the normal case on Windows and on any
        // type the OS has no handler for. The button keeps saying "Open".
        if (!cancelled) setApplicationName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [artifactId]);

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

  useEffect(() => {
    setSendTargets([]);
    setSendOpen(false);
    let cancelled = false;
    void ipcBridge.artifacts.sendTargets
      .invoke()
      .then((result) => {
        if (!cancelled) setSendTargets(Array.isArray(result) ? result : []);
      })
      .catch(() => {
        // Nothing configured is the honest rendering of "we could not tell",
        // and it must never take the preview panel down.
        if (!cancelled) setSendTargets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [artifactId]);

  /**
   * Every authorized recipient, across every configured connector, each still
   * carrying the connector it belongs to. Flattened because the user is picking
   * a PERSON, not a protocol - "email it to my team" is one decision, and
   * making them choose a transport first would be the product explaining its
   * own plumbing.
   */
  const destinations = useMemo(
    () =>
      sendTargets.flatMap((target) =>
        target.destinations.map((destination) => ({
          targetId: target.targetId,
          destinationId: destination.destinationId,
          label: destination.label,
        }))
      ),
    [sendTargets]
  );

  const sendTo = useCallback(
    async (targetId: string, destinationId: string) => {
      // Closed before the await: the native confirmation is modal and the menu
      // must not still be hanging open behind it when it returns.
      setSendOpen(false);
      setBusy(true);
      try {
        const result = await ipcBridge.artifacts.sendTo.invoke({ artifactId, targetId, destinationId });
        if (!result?.ok) {
          // The connector's own words are appended when it gave any: "the
          // connector refused it (SMTP 535 authentication failed)" is
          // actionable, "could not send" is not. They are NOT translated -
          // they came off a wire, and inventing a locale for them would be a
          // lie about their origin.
          const reason = result?.message
            ? `${t(sendReasonKey(result?.errorCode))} (${result.message})`
            : t(sendReasonKey(result?.errorCode));
          onMessage('error', t('preview.artifactSendFailed', { file: artifact.fileName, reason }));
          return;
        }
        // No `sentTo` means the user declined the native confirmation, which is
        // not an outcome that deserves a toast in either direction.
        if (result.sentTo)
          onMessage('success', t('preview.artifactSent', { file: artifact.fileName, destination: result.sentTo }));
      } finally {
        setBusy(false);
      }
    },
    [artifact.fileName, artifactId, onMessage, t]
  );

  const openById = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        const result = await ipcBridge.artifacts.open.invoke({ artifactId: id });
        // The bridge has no rejection channel, so a refusal arrives as a
        // resolved `{ ok: false }`. Reporting it is the difference between a
        // refusal and a dead button - the failure mode #616 had to fix once.
        if (!result?.ok) onMessage('error', t('preview.artifactOpenFailed', { error: result?.error ?? '' }));
      } finally {
        setBusy(false);
      }
    },
    [onMessage, t]
  );

  const run = useCallback(
    async (action: 'open' | 'reveal' | 'saveCopy') => {
      if (action === 'open') {
        await openById(artifactId);
        return;
      }
      setBusy(true);
      try {
        if (action === 'reveal') {
          const result = await ipcBridge.artifacts.reveal.invoke({ artifactId });
          if (!result?.ok) onMessage('error', t('preview.artifactRevealFailed', { error: result?.error ?? '' }));
          return;
        }
        const result = await ipcBridge.artifacts.saveCopy.invoke({ artifactId });
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
    [artifactId, onMessage, openById, t]
  );

  // `preview.openWithApp` already says "Open in {{app}}" in all twelve locales
  // and is what the system-app control next door uses. A second key with the
  // same sentence is how two buttons that do the same thing start reading
  // differently.
  const openLabel = applicationName ? t('preview.openWithApp', { app: applicationName }) : t('preview.artifactOpen');

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
        {/* Still wraps: two labelled actions fit a 296px panel, three do not. */}
        <div className='flex flex-wrap items-center justify-end gap-8px'>
          <button
            type='button'
            className={buttonClass}
            disabled={busy}
            onClick={() => void run('open')}
            data-testid='artifact-open'
          >
            <ExternalLink className='size-14px' />
            {openLabel}
          </button>
          <button type='button' className={buttonClass} disabled={busy} onClick={() => void run('reveal')}>
            <FolderOpen className='size-14px' />
            {t('preview.artifactReveal')}
          </button>
          <button type='button' className={buttonClass} disabled={busy} onClick={() => void run('saveCopy')}>
            <Save className='size-14px' />
            {t('preview.artifactSaveCopy')}
          </button>
          {/*
            Rendered ONLY when the host reported somewhere to send. `destinations`
            is empty for an unconfigured app, for a disabled connector and for a
            connector nobody is authorized on - all three are "no button".
          */}
          {destinations.length > 0 && (
            <button
              type='button'
              className={buttonClass}
              disabled={busy}
              onClick={() => setSendOpen((open) => !open)}
              data-testid='artifact-send'
            >
              <Send className='size-14px' />
              {t('preview.artifactSendTo')}
            </button>
          )}
        </div>
      </div>

      {sendOpen && destinations.length > 0 && (
        <ul className='m-0 mb-6px flex list-none flex-col gap-2px px-12px pb-2px' data-testid='artifact-send-menu'>
          {destinations.map((destination) => (
            <li key={`${destination.targetId}:${destination.destinationId}`} className='flex'>
              <button
                type='button'
                className={linkClass}
                disabled={busy}
                onClick={() => void sendTo(destination.targetId, destination.destinationId)}
                data-testid='artifact-send-destination'
              >
                {destination.label}
              </button>
            </li>
          ))}
        </ul>
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
