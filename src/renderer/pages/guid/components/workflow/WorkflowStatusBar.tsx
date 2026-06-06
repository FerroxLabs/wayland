/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowStatusBar - STR 1 of the workflow launch surface.
 *
 * A dense, monospace status strip pinned to the bottom of the workflow rail.
 * Shows: `● status │ ⏱ elapsed │ ~ETA │ 🪙 tokens │ 💵 spend`.
 *
 * Source of truth: SPEC.md §5.4. Hidden entirely when the session has been
 * archived (`status === 'ended'`). The elapsed segment ticks every second
 * while the session is active; the interval is torn down on unmount and
 * any non-active status to avoid leaked timers.
 */

import React, { useEffect, useState } from 'react';
import { Clock, Coins, DollarSign } from 'lucide-react';

import type { StepState, WorkflowSession } from '@/common/types/workflowTypes';
import styles from './WorkflowStatusBar.module.css';

export type WorkflowStatusBarProps = {
  session: WorkflowSession;
  /** Optional live token + cost - if undefined, hide those segments. Caller wires from usage telemetry. */
  liveStats?: {
    tokens: number;
    spentCents: number;
  };
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
};

const countDoneSteps = (steps: StepState[]): number =>
  steps.reduce((acc, step) => (step.status === 'done' ? acc + 1 : acc), 0);

const computeEtaRemainingMs = (
  elapsedMs: number,
  stepsDone: number,
  totalSteps: number,
): number | null => {
  if (stepsDone <= 0) return null;
  const stepsRemaining = Math.max(0, totalSteps - stepsDone);
  if (stepsRemaining === 0) return 0;
  const perStep = elapsedMs / stepsDone;
  return Math.round(perStep * stepsRemaining);
};

const statusDotClass = (status: WorkflowSession['status']): string => {
  if (status === 'active') return `${styles.statusDot} ${styles.statusDotActive}`;
  if (status === 'errored') return `${styles.statusDot} ${styles.statusDotErrored}`;
  return `${styles.statusDot} ${styles.statusDotComplete}`;
};

export const WorkflowStatusBar: React.FC<WorkflowStatusBarProps> = ({ session, liveStats }) => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (session.status !== 'active') return;
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [session.status]);

  if (session.status === 'ended') return null;

  const elapsedMs = Math.max(0, now - session.created_at);
  const stepsDone = countDoneSteps(session.steps);
  const etaMs = computeEtaRemainingMs(elapsedMs, stepsDone, session.total_steps);

  const showTokens = liveStats !== undefined;
  const showSpend = liveStats !== undefined;
  const spendDollars = liveStats !== undefined ? liveStats.spentCents / 100 : 0;

  return (
    <div
      className={`${styles.bar} font-mono`}
      data-testid='workflow-status-bar'
      role='status'
      aria-live='polite'
    >
      <span className={styles.segment} data-testid='workflow-status-bar-status'>
        <span className={statusDotClass(session.status)} aria-hidden='true' />
        <span className={styles.statusLabel}>{session.status}</span>
      </span>

      <span className={styles.divider} aria-hidden='true'>
        │
      </span>

      <span className={styles.segment} data-testid='workflow-status-bar-elapsed'>
        <span className={styles.segmentIcon} aria-hidden='true'>
          <Clock size={11} />
        </span>
        {formatDuration(elapsedMs)}
      </span>

      <span className={styles.divider} aria-hidden='true'>
        │
      </span>

      <span className={styles.segment} data-testid='workflow-status-bar-eta'>
        {etaMs === null ? '-' : `~${formatDuration(etaMs)}`}
      </span>

      {showTokens && (
        <>
          <span className={styles.divider} aria-hidden='true'>
            │
          </span>
          <span className={styles.segment} data-testid='workflow-status-bar-tokens'>
            <span className={styles.segmentIcon} aria-hidden='true'>
              <Coins size={11} />
            </span>
            {liveStats.tokens.toLocaleString('en-US')}
          </span>
        </>
      )}

      {showSpend && (
        <>
          <span className={styles.divider} aria-hidden='true'>
            │
          </span>
          <span className={styles.segment} data-testid='workflow-status-bar-spend'>
            <span className={styles.segmentIcon} aria-hidden='true'>
              <DollarSign size={11} />
            </span>
            {`$${spendDollars.toFixed(2)}`}
          </span>
        </>
      )}
    </div>
  );
};
