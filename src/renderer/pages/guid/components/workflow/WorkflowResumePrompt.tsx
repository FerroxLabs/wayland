/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '@arco-design/web-react';

import type { WorkflowSession } from '@/common/types/workflowTypes';

import styles from './WorkflowResumePrompt.module.css';

export type WorkflowResumePromptProps = {
  /** The in-flight session that triggered the prompt. */
  existingSession: WorkflowSession;
  /** User chose to resume the existing run - loads it into /guid. */
  onResume: () => void;
  /** User chose to discard - archive current and start a new session. */
  onStartFresh: () => void;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Format `updated_at` (epoch ms) as a human-readable relative time string.
 * Standalone helper - no date-fns dependency, no localization (English-only
 * to match the rest of the workflow surface).
 *
 * Buckets per SPEC §5.7:
 *   - < 1 min        → "just now"
 *   - < 60 min       → "{n} minute(s) ago"
 *   - < 24 h         → "{n} hour(s) ago"
 *   - 1-2 days       → "yesterday"
 *   - > 2 days       → "{n} days ago"
 */
export const formatRelativeTime = (updatedAt: number, now: number = Date.now()): string => {
  const delta = Math.max(0, now - updatedAt);

  if (delta < MINUTE_MS) {
    return 'just now';
  }

  if (delta < HOUR_MS) {
    const minutes = Math.floor(delta / MINUTE_MS);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  if (delta < DAY_MS) {
    const hours = Math.floor(delta / HOUR_MS);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  const days = Math.floor(delta / DAY_MS);
  if (days <= 2) {
    return 'yesterday';
  }

  return `${days} days ago`;
};

/**
 * Inline resume prompt rendered inside `WorkflowDetailModal` when the user
 * clicks "Launch now" on a workflow that already has an in-flight session
 * within the 14-day cross-session window (SPEC §5.7, §10.2).
 *
 * Offers two outs: `Resume` (loads existing session) or `Start fresh`
 * (archives current, creates new). The 14-day gating + session lookup is
 * the caller's responsibility - this component just renders.
 */
export const WorkflowResumePrompt: React.FC<WorkflowResumePromptProps> = ({
  existingSession,
  onResume,
  onStartFresh,
}) => {
  const relativeTime = formatRelativeTime(existingSession.updated_at);

  return (
    <div className={styles.card} data-testid='workflow-resume-prompt' role='region'>
      <p className={styles.heading}>Resume from Step {existingSession.current_step}?</p>
      <p className={styles.subline}>Last touched {relativeTime}</p>
      <div className={styles.actions}>
        <Button type='primary' onClick={onResume}>
          Resume
        </Button>
        <Button onClick={onStartFresh}>Start fresh</Button>
      </div>
    </div>
  );
};

export default WorkflowResumePrompt;
