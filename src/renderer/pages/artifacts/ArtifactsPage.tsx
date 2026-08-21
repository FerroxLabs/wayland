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
 * DELETE IS DELIBERATELY ABSENT. The ledger is append-only with no tombstone,
 * so a "remove from list" verb is a change to a security-audited store, not a
 * button. The accepted consequence is that a Missing row cannot be dismissed.
 */

import { ipcBridge } from '@/common';
import type { ArtifactDiskStatus, ArtifactSummary } from '@/common/types/artifacts';
import PageShell from '@renderer/components/layout/PageShell';
import { usePreviewLauncher } from '@renderer/hooks/file/usePreviewLauncher';
import { PreviewPanel, PreviewProvider, usePreviewContext } from '@/renderer/pages/conversation/Preview';
import {
  previewContentTypeForFileName,
  previewIsEditable,
} from '@renderer/pages/conversation/Preview/previewContentType';
import { AlertTriangle, FileText, FolderOpen, Package, Save } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; artifacts: ArtifactSummary[]; unreadableEntries: number };

const buttonClass =
  'flex shrink-0 items-center gap-4px whitespace-nowrap px-8px py-4px rd-6px cursor-pointer border-none bg-transparent ' +
  'text-12px text-t-secondary hover:bg-3 hover:text-t-primary transition-colors disabled:opacity-50';

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

/** Local time of day, for the per-row timestamp. */
function timeOf(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleTimeString();
}

const STATUS_KEY: Record<ArtifactDiskStatus, string> = {
  ready: 'preview.artifactStatusReady',
  empty: 'preview.artifactStatusEmpty',
  missing: 'preview.artifactStatusMissing',
};

const STATUS_CLASS: Record<ArtifactDiskStatus, string> = {
  ready: 'text-t-3',
  empty: 'text-warning',
  missing: 'text-danger',
};

const ArtifactsRail: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  const runAction = useCallback(
    async (artifactId: string, action: 'reveal' | 'saveCopy'): Promise<void> => {
      setBusyId(artifactId);
      setNotice(null);
      try {
        if (action === 'reveal') {
          const result = await ipcBridge.artifacts.reveal.invoke({ artifactId });
          // Resolve-only: a refusal arrives as `{ ok: false }`, never as a
          // rejection, so an unchecked await is a dead button.
          if (!result?.ok) setNotice(t('preview.artifactRevealFailed', { error: result?.error ?? '' }));
          return;
        }
        const result = await ipcBridge.artifacts.saveCopy.invoke({ artifactId });
        if (!result?.ok) {
          setNotice(t('preview.artifactSaveFailed', { error: result?.error ?? '' }));
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
    [t]
  );

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
        <div className={previewOpen ? 'w-380px shrink-0 min-w-0' : 'flex-1 min-w-0'}>
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

      {groups.map((group) => (
        <section key={group.key} className='mb-20px' data-testid='artifacts-rail-group'>
          <h2 className='mb-8px text-12px font-medium text-t-secondary' data-testid='artifacts-rail-day'>
            {group.label}
          </h2>
          <ul className='list-none p-0 m-0 flex flex-col gap-6px'>
            {group.rows.map((artifact) => {
              const status: ArtifactDiskStatus = artifact.diskStatus ?? 'ready';
              const reachable = status === 'ready';
              return (
                <li
                  key={artifact.artifactId}
                  className='flex items-start gap-10px rd-8px px-10px py-8px bg-1 hover:bg-2 transition-colors'
                  data-testid='artifacts-rail-row'
                  data-disk-status={status}
                >
                  <FileText size={16} className='mt-2px shrink-0 text-t-3' />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-8px min-w-0'>
                      <span className='truncate text-13px text-t-primary'>{artifact.fileName}</span>
                      <span
                        className={`shrink-0 text-11px ${STATUS_CLASS[status]}`}
                        data-testid='artifacts-rail-status'
                      >
                        {t(STATUS_KEY[status])}
                      </span>
                    </div>
                    <div className='mt-2px truncate text-11px text-t-3'>
                      {timeOf(artifact.runAt)} · {artifact.declaredBy}
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
                  <div className='flex shrink-0 items-center gap-2px'>
                    {/* A missing file has nothing to open or copy. Reveal still
                        works: showing the user the folder their file is NOT in
                        is exactly how they find out what happened to it. */}
                    <button
                      type='button'
                      className={buttonClass}
                      disabled={!reachable || busyId === artifact.artifactId}
                      onClick={() => openHere(artifact)}
                    >
                      {t('preview.artifactOpenHere')}
                    </button>
                    <button
                      type='button'
                      className={buttonClass}
                      disabled={busyId === artifact.artifactId}
                      onClick={() => void runAction(artifact.artifactId, 'reveal')}
                    >
                      <FolderOpen size={13} />
                      {t('preview.artifactReveal')}
                    </button>
                    <button
                      type='button'
                      className={buttonClass}
                      disabled={!reachable || busyId === artifact.artifactId}
                      onClick={() => void runAction(artifact.artifactId, 'saveCopy')}
                    >
                      <Save size={13} />
                      {t('preview.artifactSaveCopy')}
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
