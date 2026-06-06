/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowCompleteCard - replaces the step rail when a workflow session
 * reaches `status === 'complete'`. Surfaces the duration + step count
 * (and optional token/cost), up to 3 markdown-rendered "key outputs" the
 * W4 integration extracts from agent messages, the two terminal CTAs
 * (`Save this run`, `Run again`), and up to 3 suggested next workflows.
 *
 * See SPEC §5.5 (`.planning/brainstorm/2026-05-25-workflow-launch-surface/SPEC.md`).
 */

import { Button } from '@arco-design/web-react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { WorkflowSession } from '@/common/types/workflowTypes';
import MarkdownView from '@/renderer/components/Markdown';

import styles from './WorkflowCompleteCard.module.css';

export type WorkflowCompleteCardProps = {
  session: WorkflowSession;
  /** Total tokens consumed across the workflow run. */
  totalTokens?: number;
  /** Total cost in cents. */
  totalCostCents?: number;
  /** Key outputs extracted by the W4 integration. */
  keyOutputs?: string[];
  /** Suggested follow-up workflows (slug + display name). */
  suggestedNext?: Array<{ slug: string; display: string }>;
  onSaveRun: () => void;
  onRunAgain: () => void;
  onLaunchNext: (slug: string) => void;
};

/**
 * Format a duration in milliseconds as either `Xm Ys` (under an hour) or
 * `Xh Ym` (an hour or more). Values are floored so we never round up.
 */
const formatDuration = (ms: number): string => {
  const safe = Math.max(0, Math.floor(ms / 1000));
  if (safe < 3600) {
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatTokens = (n: number): string => n.toLocaleString('en-US');

const formatCostUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

export const WorkflowCompleteCard: React.FC<WorkflowCompleteCardProps> = ({
  session,
  totalTokens,
  totalCostCents,
  keyOutputs,
  suggestedNext,
  onSaveRun,
  onRunAgain,
  onLaunchNext,
}) => {
  const { t } = useTranslation();

  const end = session.completed_at ?? Date.now();
  const duration = formatDuration(end - session.created_at);
  const stepCount = session.steps.length;
  const outputs = (keyOutputs ?? []).slice(0, 3);
  const next = (suggestedNext ?? []).slice(0, 3);

  return (
    <div className={styles.root} data-testid='workflow-complete-card'>
      <div className={styles.checkTile} data-testid='workflow-complete-check'>
        <CheckCircle2 size={36} strokeWidth={2} />
      </div>

      <h2 className={styles.headline}>
        {t('workflow.complete.headline', 'Workflow Complete')}
      </h2>

      <div className={styles.stats} data-testid='workflow-complete-stats'>
        <span>{duration}</span>
        <span className={styles.statSep}>·</span>
        <span>
          {t('workflow.complete.steps', '{{n}} steps', { n: stepCount }).replace('{{n}}', String(stepCount))}
        </span>
        {typeof totalTokens === 'number' ? (
          <>
            <span className={styles.statSep}>·</span>
            <span>
              {t('workflow.complete.tokens', '{{n}} tokens', { n: formatTokens(totalTokens) }).replace(
                '{{n}}',
                formatTokens(totalTokens)
              )}
            </span>
          </>
        ) : null}
        {typeof totalCostCents === 'number' ? (
          <>
            <span className={styles.statSep}>·</span>
            <span>{formatCostUsd(totalCostCents)}</span>
          </>
        ) : null}
      </div>

      {outputs.length > 0 ? (
        <section className={styles.section} aria-labelledby='workflow-complete-outputs-title'>
          <div className={styles.sectionTitle} id='workflow-complete-outputs-title'>
            {t('workflow.complete.outputsTitle', 'What this produced')}
          </div>
          <div className={styles.outputs}>
            {outputs.map((md, i) => (
              <div
                key={i}
                className={styles.outputCard}
                data-testid='workflow-complete-output'
              >
                <MarkdownView>{md}</MarkdownView>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.ctaRow}>
        <Button type='primary' onClick={onSaveRun}>
          {t('workflow.complete.save', 'Save this run')}
        </Button>
        <Button type='secondary' onClick={onRunAgain}>
          {t('workflow.complete.runAgain', 'Run again')}
        </Button>
      </div>

      {next.length > 0 ? (
        <section className={styles.section} aria-labelledby='workflow-complete-next-title'>
          <div className={styles.sectionTitle} id='workflow-complete-next-title'>
            {t('workflow.complete.nextTitle', 'Up next')}
          </div>
          <div className={styles.nextRow}>
            {next.map((nx) => (
              <button
                type='button'
                key={nx.slug}
                className={styles.nextCard}
                onClick={() => onLaunchNext(nx.slug)}
              >
                <span className={styles.nextCardIcon}>
                  <ArrowRight size={14} />
                </span>
                <span>{nx.display}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
