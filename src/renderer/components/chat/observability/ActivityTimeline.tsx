/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 observability rework - the centerpiece collapsible activity timeline.
 *
 * The Claude-style "did N things" reasoning/tool timeline shown inline under an
 * in-progress / completed turn. Consumes the canonical `ActivityStep[]`
 * projection (see common/chat/activity/activityStep.ts) - one renderer, every
 * backend. While the turn runs the timeline is expanded with a live header;
 * once every step is terminal it auto-collapses (edge-triggered, once) into a
 * calm one-line "Did N things" summary. Rows drill into per-step detail and
 * recurse into nested sub-agent timelines.
 */

import {
  doneCount,
  formatDuration,
  rollupStatus,
  stepDurationSec,
  type ActivityStep,
} from '@/common/chat/activity/activityStep';
import { Badge, Tag } from '@arco-design/web-react';
import { Check, Close, Right } from '@icon-park/react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SourceBlock from './SourceBlock';
import styles from './ActivityTimeline.module.css';

type Props = { steps: ActivityStep[]; defaultExpanded?: boolean };

const handleKeyToggle = (e: React.KeyboardEvent, fn: () => void): void => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

/** Overall span: max(endTime) - min(startTime), formatted (e.g. "19.5s"). */
const spanDuration = (steps: ActivityStep[]): string => {
  let earliest = Infinity;
  let latest = -Infinity;
  for (const s of steps) {
    if (s.startTime != null && s.startTime < earliest) earliest = s.startTime;
    if (s.endTime != null && s.endTime > latest) latest = s.endTime;
  }
  if (!isFinite(earliest) || !isFinite(latest) || latest < earliest) return '';
  return formatDuration((latest - earliest) / 1000);
};

/** Leading glyph for a step row, keyed by status. NO emoji - icon-park only. */
const StepGlyph: React.FC<{ status: ActivityStep['status'] }> = ({ status }) => {
  switch (status) {
    case 'running':
      return <span className={styles.spinner} aria-hidden='true' />;
    case 'failed':
      return <Close className={styles.glyphFailed} size='14' aria-hidden='true' />;
    default:
      return <Check className={styles.glyphDone} size='14' aria-hidden='true' />;
  }
};

const StepRow: React.FC<{ step: ActivityStep }> = ({ step }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const hasDetail = Boolean(step.detail && step.detail.length);
  const hasChildren = Boolean(step.children && step.children.length);
  const hasSources = Boolean(step.sources && step.sources.length);
  const expandable = hasDetail || hasChildren || hasSources;
  const toggle = (): void => setOpen((v) => !v);

  const showAgentTag = step.kind === 'sub_agent' || Boolean(step.agent);
  const duration = formatDuration(stepDurationSec(step));

  return (
    <div className={styles.step} data-step-status={step.status}>
      <div
        className={styles.stepHead}
        onClick={expandable ? toggle : undefined}
        onKeyDown={expandable ? (e) => handleKeyToggle(e, toggle) : undefined}
        role={expandable ? 'button' : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-expanded={expandable ? open : undefined}
      >
        <span className={styles.glyph}>
          <StepGlyph status={step.status} />
        </span>
        <span className={`${styles.label} ${step.status === 'running' ? styles.labelActive : ''}`}>
          {step.label}
        </span>
        <span className={styles.meta}>
          {showAgentTag && step.agent && (
            <Tag size='small' color='arcoblue' className={styles.agentTag}>
              {step.agent}
            </Tag>
          )}
          {step.source && <span className={styles.sourceChip}>{step.source}</span>}
          {duration && <span className={styles.dur}>{duration}</span>}
          {expandable && (
            <Right className={`${styles.chev} ${open ? styles.chevOpen : ''}`} size='12' aria-hidden='true' />
          )}
        </span>
      </div>

      {open && hasDetail && (
        <div className={styles.detailRail}>
          <p className={styles.detailText}>{step.detail}</p>
        </div>
      )}
      {open && hasChildren && (
        <div className={styles.childRail}>
          <ActivityTimeline steps={step.children!} defaultExpanded />
        </div>
      )}
      {open && hasSources && (
        <div className={styles.detailRail}>
          <SourceBlock sources={step.sources!} />
        </div>
      )}

      {/* Visually-hidden detail label keeps i18n key referenced and aids SR. */}
      {expandable && (
        <span className={styles.srOnly}>
          {t('conversation.observability.expandRow', { defaultValue: 'Toggle step detail' })}
        </span>
      )}
    </div>
  );
};

const ActivityTimeline: React.FC<Props> = ({ steps, defaultExpanded }) => {
  const { t } = useTranslation();
  const status = rollupStatus(steps);
  const running = status === 'running';

  const [expanded, setExpanded] = useState(defaultExpanded ?? running);

  // Edge-triggered auto-collapse: collapse exactly once on the
  // was-running -> all-done transition. Never fight a user who re-expands.
  const prevHadRunning = useRef(running);
  useEffect(() => {
    if (prevHadRunning.current && !running) {
      setExpanded(false);
    }
    prevHadRunning.current = running;
  }, [running]);

  if (steps.length === 0) return null;

  const runningCount = steps.filter((s) => s.status === 'running').length;
  const toggle = (): void => setExpanded((v) => !v);

  const headerStatus = running ? 'processing' : status === 'failed' ? 'error' : 'success';

  // Some sources (grouped tool_group items) carry no timing, so a span duration
  // isn't always available - drop the "· {{duration}}" suffix when it's empty.
  const dur = running ? '' : spanDuration(steps);
  const doneSummary = dur
    ? t('conversation.observability.summaryDid', { defaultValue: 'Did {{count}} things · {{duration}}', count: doneCount(steps), duration: dur })
    : t('conversation.observability.summaryDidShort', { defaultValue: 'Did {{count}} things', count: doneCount(steps) });

  // "What I did" at-a-glance: name the real actions under the collapsed summary
  // (only for genuinely multi-step turns; a single action is self-evident).
  const doneLabels = steps.filter((s) => s.status !== 'running' && s.label).map((s) => s.label.replace(/[.…]+$/, ''));
  const stepDetail =
    doneLabels.length >= 2
      ? doneLabels.length > 3
        ? t('conversation.observability.summaryDidMore', {
            defaultValue: '{{steps}} · +{{count}} more',
            steps: doneLabels.slice(0, 3).join(' · '),
            count: doneLabels.length - 3,
          })
        : doneLabels.join(' · ')
      : '';

  return (
    <div className={styles.container} data-testid='activity-timeline' data-timeline-status={status}>
      <div
        className={styles.header}
        onClick={toggle}
        onKeyDown={(e) => handleKeyToggle(e, toggle)}
        role='button'
        tabIndex={0}
        aria-expanded={expanded}
      >
        {running ? (
          <>
            <span className={styles.heartbeat} aria-hidden='true' />
            <Badge status={headerStatus} />
            <span className={styles.headerText}>
              {t('conversation.observability.runningHeader', {
                defaultValue: '{{count}} steps',
                count: steps.length,
              })}
            </span>
          </>
        ) : (
          <>
            <Check className={styles.glyphDone} size='15' aria-hidden='true' />
            <span className={styles.summaryText}>{doneSummary}</span>
          </>
        )}
        <span className={styles.spacer} />
        {runningCount > 0 && (
          <span className={styles.srOnly}>
            {t('conversation.observability.runningCount', {
              defaultValue: '{{count}} running',
              count: runningCount,
            })}
          </span>
        )}
        <Right className={`${styles.chev} ${expanded ? styles.chevOpen : ''}`} size='13' aria-hidden='true' />
      </div>

      {!running && !expanded && stepDetail && (
        <div className={styles.summaryDetail} data-testid='activity-summary-detail'>
          {stepDetail}
        </div>
      )}

      {expanded && (
        <div className={styles.list}>
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
