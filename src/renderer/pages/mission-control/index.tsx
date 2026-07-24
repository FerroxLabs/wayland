/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Tabs } from '@arco-design/web-react';
import { AlertTriangle, Bot, Clock, Gauge, GitBranch, PictureInPicture2, RefreshCw, Users } from 'lucide-react';
import { ipcBridge } from '@/common';
import { useIsPopoutMode } from '@/renderer/hooks/system/useIsPopoutMode';
import { useMissionControl } from './useMissionControl';
import { CostTab } from './cost/CostTab';
import PageShell from '@/renderer/components/layout/PageShell';
import {
  CatalogPaginationControls,
  useCatalogPagination,
} from '@/renderer/components/layout/library/CatalogPagination';
import type { ActivityGroup, LedgerEntry, LedgerSource, LedgerStatus } from '@/common/types/missionControl';
import styles from './MissionControl.module.css';

/** Accent color per normalized status (drives the CSS --accent var). */
const STATUS_ACCENT: Record<LedgerStatus, string> = {
  running: '#ff6b35',
  verifying: '#b07bff',
  failed: '#ff4d4f',
  zombie: '#c0392b',
  blocked: '#ff9f43',
  pending: '#5b8def',
  done: '#2ec27e',
  idle: '#7a818c',
  unknown: '#7a818c',
};

/** Statuses that get a pulsing dot (live work). */
const LIVE_STATUS = new Set<LedgerStatus>(['running', 'verifying', 'failed']);

const GROUPS: Array<{ group: ActivityGroup; label: string; accent: string }> = [
  { group: 'needs-you', label: 'Needs you', accent: STATUS_ACCENT.failed },
  { group: 'running', label: 'Running', accent: STATUS_ACCENT.running },
  { group: 'upcoming', label: 'Upcoming', accent: STATUS_ACCENT.pending },
  { group: 'recent', label: 'Recent', accent: STATUS_ACCENT.done },
];

const ACTIVITY_PAGE_SIZE = 48;

/** Selects only a lane backed by the entry's sealed provenance. */
export function workbenchSectionForActivity(entry: LedgerEntry): string | undefined {
  if (!entry.action.path.startsWith('/conversation/')) return undefined;
  if (entry.provenance.kind === 'approval') return 'projection:consequential';
  if (entry.provenance.kind === 'workflow' || entry.provenance.kind === 'schedule-run') {
    return 'projection:automation';
  }
  if (entry.provenance.kind === 'team' || entry.provenance.kind === 'sub-agent') return 'projection:team';
  if (entry.provenance.origin === 'core') return 'projection:core';
  return 'workspace';
}

/** Tween a number from its previous value to the target with an ease-out curve. */
function useCountUp(target: number, durationMs = 700): number {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    let raf = 0;
    let startTs = 0;
    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const p = Math.min(1, (now - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (target - from) * eased);
      setVal(next);
      fromRef.current = next;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

function relTime(ms: number | undefined): string | null {
  if (!ms) return null;
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60_000) return 'just now';
  const mins = Math.round(abs / 60_000);
  const hrs = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const unit = mins < 60 ? `${mins}m` : hrs < 24 ? `${hrs}h` : `${days}d`;
  return diff < 0 ? `${unit} ago` : `in ${unit}`;
}

const StatTile: React.FC<{ label: string; accent: string; count: number }> = ({ label, accent, count }) => {
  // Guard against a partial/stale snapshot omitting a bucket: a missing count
  // must render as 0, never NaN (which `useCountUp`'s tween would otherwise show).
  const safeCount = Number.isFinite(count) ? count : 0;
  const shown = useCountUp(safeCount);
  return (
    <div
      className={`${styles.statTile} ${safeCount === 0 ? styles.zero : ''}`}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <span className={styles.statNum}>{shown}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
};

const Row: React.FC<{ entry: LedgerEntry; index: number }> = ({ entry, index }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accent = STATUS_ACCENT[entry.status];
  const live = LIVE_STATUS.has(entry.status);
  const subtitle = [entry.context, entry.detail].filter(Boolean).join(' · ');
  const next = entry.provenance.kind === 'schedule' ? relTime(entry.nextRunAtMs) : null;
  const heartbeat = entry.lastHeartbeat ? relTime(entry.lastHeartbeat) : null;
  const retries =
    entry.retryBudget != null && entry.retriesUsed != null
      ? t('missionControl.meta.retries', { used: entry.retriesUsed, total: entry.retryBudget })
      : null;
  const verdict =
    entry.verdict === 'pass'
      ? t('missionControl.meta.verdictPass')
      : entry.verdict === 'fail'
        ? t('missionControl.meta.verdictFail')
        : null;
  // Zombie rows surface staleness via the last heartbeat; otherwise prefer next-run (cron) then updated.
  const metaTime =
    entry.status === 'zombie' && heartbeat
      ? t('missionControl.meta.heartbeat', { time: heartbeat })
      : next
        ? t('missionControl.meta.nextRun', { time: next })
        : heartbeat
          ? t('missionControl.meta.heartbeat', { time: heartbeat })
          : t('missionControl.meta.updated', { time: relTime(entry.updatedAt) ?? '' });

  return (
    <button
      type='button'
      className={styles.row}
      style={{ '--accent': accent, animationDelay: `${Math.min(index, 12) * 32}ms` } as React.CSSProperties}
      onClick={() => {
        const sectionId = workbenchSectionForActivity(entry);
        void navigate(
          entry.action.path,
          sectionId
            ? { state: { workbenchRequest: { id: sectionId, key: `${entry.id}:${entry.updatedAt}` } } }
            : undefined
        );
      }}
      aria-label={`${entry.action.label}: ${entry.title}`}
    >
      <span className={`${styles.dot} ${live ? styles.dotLive : ''}`} />
      <div className={styles.main}>
        <span className={styles.rowTitle}>{entry.title}</span>
        {subtitle ? <span className={styles.rowSub}>{subtitle}</span> : null}
      </div>
      <span className={styles.pill} style={{ '--accent': accent } as React.CSSProperties}>
        {t(`missionControl.status.${entry.status}`, { defaultValue: entry.status })}
      </span>
      {entry.needsHuman ? <span className={styles.needsHuman}>{t('missionControl.meta.needsHuman')}</span> : null}
      <div className={styles.meta}>
        <span className={styles.sourceChip}>
          <SourceIcon source={entry.source} />
          {sourceLabel(entry.source)}
        </span>
        {verdict ? <span className={styles.metaTime}>{verdict}</span> : null}
        {retries ? <span className={styles.metaTime}>{retries}</span> : null}
        <span className={styles.metaTime}>{metaTime}</span>
      </div>
    </button>
  );
};

function SourceIcon({ source }: { source: LedgerSource }): React.ReactElement {
  if (source === 'scheduler') return <Clock size={12} />;
  if (source === 'desktop-teams') return <Users size={12} />;
  if (source === 'desktop-workflows') return <GitBranch size={12} />;
  return <Bot size={12} />;
}

function sourceLabel(source: LedgerSource): string {
  const labels: Record<LedgerSource, string> = {
    'desktop-teams': 'Desktop team',
    'desktop-workflows': 'Desktop workflow',
    scheduler: 'Schedule',
    'core-execution': 'Wayland Core',
    approvals: 'Approval',
  };
  return labels[source];
}

const Section: React.FC<{ label: string; accent: string; entries: LedgerEntry[]; totalCount: number }> = ({
  label,
  accent,
  entries,
  totalCount,
}) => {
  if (entries.length === 0) return null;
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionDot} style={{ '--accent': accent } as React.CSSProperties} />
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.sectionCount}>{totalCount}</span>
      </div>
      <div className={styles.list}>
        {entries.map((entry, i) => (
          <Row key={entry.id} entry={entry} index={i} />
        ))}
      </div>
    </div>
  );
};

export const OperationsView: React.FC = () => {
  const { t } = useTranslation();
  const { snapshot, loading, refresh } = useMissionControl();
  const entries = snapshot?.entries ?? [];
  const groupCounts = snapshot?.groupCounts ?? { 'needs-you': 0, running: 0, upcoming: 0, recent: 0 };
  const unhealthy = snapshot?.sourceHealth.filter((health) => health.status !== 'ok') ?? [];
  const windowResetKey = useMemo(() => entries.map((entry) => entry.id).join('|'), [entries]);
  const pagination = useCatalogPagination(entries, windowResetKey, ACTIVITY_PAGE_SIZE);

  return (
    <>
      <div className={styles.opsToolbar}>
        <span className={styles.live}>
          <span className={styles.liveDot} />
          {t('missionControl.live')}
        </span>
        <Button size='small' icon={<RefreshCw size={14} />} loading={loading} onClick={() => void refresh()}>
          {t('missionControl.refresh')}
        </Button>
      </div>

      <div className={styles.statRow}>
        {GROUPS.map(({ group, label, accent }) => (
          <StatTile key={group} label={label} accent={accent} count={groupCounts[group]} />
        ))}
      </div>

      {unhealthy.length > 0 ? (
        <div className={styles.healthWarning} role='status'>
          <AlertTriangle size={16} />
          <div>
            <strong>Activity is incomplete</strong>
            <span>
              {unhealthy
                .map((health) => `${sourceLabel(health.source)}: ${health.detail ?? health.status}`)
                .join(' · ')}
            </span>
          </div>
        </div>
      ) : null}

      {entries.length === 0 ? (
        <div className={styles.empty}>
          <Gauge size={40} className={styles.emptyRadar} />
          <span className={styles.emptyTitle}>
            {snapshot?.completeness === 'complete' ? t('missionControl.empty') : 'No verified activity available'}
          </span>
          <span className={styles.emptyHint}>
            {snapshot?.completeness === 'complete'
              ? t('missionControl.emptyHint')
              : 'One or more activity sources could not be read. Refresh or open the source directly.'}
          </span>
        </div>
      ) : (
        <>
          <div id='mission-control-activity-window' data-testid='mission-control-activity-window'>
            {GROUPS.map((section) => (
              <Section
                key={section.group}
                label={section.label}
                accent={section.accent}
                entries={pagination.visibleItems.filter((entry) => entry.group === section.group)}
                totalCount={groupCounts[section.group]}
              />
            ))}
          </div>
          <CatalogPaginationControls
            visibleCount={pagination.visibleCount}
            totalCount={pagination.totalCount}
            remainingCount={pagination.remainingCount}
            pageSize={pagination.pageSize}
            firstVisibleIndex={pagination.firstVisibleIndex}
            lastVisibleIndex={pagination.lastVisibleIndex}
            hasPrevious={pagination.hasPrevious}
            hasMore={pagination.hasMore}
            onNextPage={pagination.nextPage}
            onPreviousPage={pagination.previousPage}
            controlsId='mission-control-activity-window'
            testId='mission-control-activity-next'
          />
        </>
      )}
    </>
  );
};

const MissionControlPage: React.FC = () => {
  const { t } = useTranslation();
  const isPopout = useIsPopoutMode();

  // Honor a `?tab=` deep-link (e.g. the Titlebar SpendPill opens ?tab=cost),
  // while keeping the tab user-switchable.
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'cost' ? 'cost' : 'operations');

  // Re-sync when the deep-link changes while the page is ALREADY mounted (e.g.
  // clicking SpendPill from Mission Control): the one-shot initial state above
  // would otherwise leave the tab stale (xaudit finding 1).
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'cost' || tab === 'operations') setActiveTab(tab);
  }, [searchParams]);

  // Hide the pop-out trigger when this page is itself rendered inside a pop-out
  // window - there is nothing to pop out into from there (#157).
  const actions = isPopout ? undefined : (
    <Button
      type='text'
      size='small'
      icon={<PictureInPicture2 size={16} />}
      aria-label={t('missionControl.popout')}
      title={t('missionControl.popout')}
      onClick={() => {
        void ipcBridge.application.popoutRoute.invoke({ route: 'mission-control' });
      }}
    />
  );

  return (
    <PageShell
      title={t('missionControl.pageTitle')}
      icon={<Gauge size={20} />}
      subtitle={t('missionControl.description')}
      width='full'
      actions={actions}
    >
      <Tabs activeTab={activeTab} onChange={setActiveTab} className={styles.tabs}>
        <Tabs.TabPane key='operations' title={t('missionControl.tabs.operations')}>
          <OperationsView />
        </Tabs.TabPane>
        <Tabs.TabPane key='cost' title={t('missionControl.tabs.cost')}>
          <CostTab />
        </Tabs.TabPane>
      </Tabs>
    </PageShell>
  );
};

export default MissionControlPage;
