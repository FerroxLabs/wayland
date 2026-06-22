/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tabs } from '@arco-design/web-react';
import { Clock, Gauge, PictureInPicture2, RefreshCw, Users } from 'lucide-react';
import { ipcBridge } from '@/common';
import { useIsPopoutMode } from '@/renderer/hooks/system/useIsPopoutMode';
import { useMissionControl } from './useMissionControl';
import { CostTab } from './cost/CostTab';
import PageShell from '@/renderer/components/layout/PageShell';
import type { LedgerCounts, LedgerEntry, LedgerStatus } from '@/common/types/missionControl';
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
};

/** Statuses that get a pulsing dot (live work). */
const LIVE_STATUS = new Set<LedgerStatus>(['running', 'verifying', 'failed']);

const STAT_ORDER: LedgerStatus[] = ['running', 'verifying', 'pending', 'blocked', 'failed', 'zombie', 'done', 'idle'];

/** Urgency sections, rendered top-to-bottom; empty ones are skipped. */
const SECTIONS: Array<{ key: string; statuses: LedgerStatus[]; accent: string }> = [
  { key: 'attention', statuses: ['failed', 'zombie', 'blocked'], accent: STATUS_ACCENT.failed },
  { key: 'active', statuses: ['running'], accent: STATUS_ACCENT.running },
  { key: 'verifying', statuses: ['verifying'], accent: STATUS_ACCENT.verifying },
  { key: 'scheduled', statuses: ['pending'], accent: STATUS_ACCENT.pending },
  { key: 'done', statuses: ['done'], accent: STATUS_ACCENT.done },
  { key: 'idle', statuses: ['idle'], accent: STATUS_ACCENT.idle },
];

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

const StatTile: React.FC<{ status: LedgerStatus; count: number }> = ({ status, count }) => {
  const { t } = useTranslation();
  // Guard against a partial/stale snapshot omitting a bucket: a missing count
  // must render as 0, never NaN (which `useCountUp`'s tween would otherwise show).
  const safeCount = Number.isFinite(count) ? count : 0;
  const shown = useCountUp(safeCount);
  return (
    <div
      className={`${styles.statTile} ${safeCount === 0 ? styles.zero : ''}`}
      style={{ '--accent': STATUS_ACCENT[status] } as React.CSSProperties}
    >
      <span className={styles.statNum}>{shown}</span>
      <span className={styles.statLabel}>{t(`missionControl.status.${status}`)}</span>
    </div>
  );
};

const Row: React.FC<{ entry: LedgerEntry; index: number }> = ({ entry, index }) => {
  const { t } = useTranslation();
  const accent = STATUS_ACCENT[entry.status];
  const live = LIVE_STATUS.has(entry.status);
  const subtitle = [entry.context, entry.detail].filter(Boolean).join(' · ');
  const next = entry.source === 'cron' ? relTime(entry.nextRunAtMs) : null;
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
    <div
      className={styles.row}
      style={{ '--accent': accent, animationDelay: `${Math.min(index, 12) * 32}ms` } as React.CSSProperties}
    >
      <span className={`${styles.dot} ${live ? styles.dotLive : ''}`} />
      <div className={styles.main}>
        <span className={styles.rowTitle}>{entry.title}</span>
        {subtitle ? <span className={styles.rowSub}>{subtitle}</span> : null}
      </div>
      <span className={styles.pill} style={{ '--accent': accent } as React.CSSProperties}>
        {t(`missionControl.status.${entry.status}`)}
      </span>
      {entry.needsHuman ? <span className={styles.needsHuman}>{t('missionControl.meta.needsHuman')}</span> : null}
      <div className={styles.meta}>
        <span className={styles.sourceChip}>
          {entry.source === 'cron' ? <Clock size={12} /> : <Users size={12} />}
          {t(`missionControl.source.${entry.source}`)}
        </span>
        {verdict ? <span className={styles.metaTime}>{verdict}</span> : null}
        {retries ? <span className={styles.metaTime}>{retries}</span> : null}
        <span className={styles.metaTime}>{metaTime}</span>
      </div>
    </div>
  );
};

const Section: React.FC<{ label: string; accent: string; entries: LedgerEntry[] }> = ({ label, accent, entries }) => {
  if (entries.length === 0) return null;
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionDot} style={{ '--accent': accent } as React.CSSProperties} />
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.sectionCount}>{entries.length}</span>
      </div>
      <div className={styles.list}>
        {entries.map((entry, i) => (
          <Row key={entry.id} entry={entry} index={i} />
        ))}
      </div>
    </div>
  );
};

const OperationsView: React.FC = () => {
  const { t } = useTranslation();
  const { snapshot, loading, refresh } = useMissionControl();
  const entries = snapshot?.entries ?? [];
  const counts: LedgerCounts = snapshot?.counts ?? {
    running: 0,
    verifying: 0,
    pending: 0,
    blocked: 0,
    failed: 0,
    zombie: 0,
    done: 0,
    idle: 0,
    total: 0,
  };

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
        {STAT_ORDER.map((status) => (
          <StatTile key={status} status={status} count={counts[status]} />
        ))}
      </div>

      {entries.length === 0 ? (
        <div className={styles.empty}>
          <Gauge size={40} className={styles.emptyRadar} />
          <span className={styles.emptyTitle}>{t('missionControl.empty')}</span>
          <span className={styles.emptyHint}>{t('missionControl.emptyHint')}</span>
        </div>
      ) : (
        SECTIONS.map((section) => (
          <Section
            key={section.key}
            label={t(`missionControl.section.${section.key}`)}
            accent={section.accent}
            entries={entries.filter((e) => section.statuses.includes(e.status))}
          />
        ))
      )}
    </>
  );
};

const MissionControlPage: React.FC = () => {
  const { t } = useTranslation();
  const isPopout = useIsPopoutMode();

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
      <Tabs defaultActiveTab='operations' className={styles.tabs}>
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
