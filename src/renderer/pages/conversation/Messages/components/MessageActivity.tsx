/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ActivityNode, IMessageActivity } from '@/common/chat/chatLib';
import { Badge } from '@arco-design/web-react';
import { Down, Right } from '@icon-park/react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityNodeTree from './ActivityNodeTree';
import styles from './MessageActivity.module.css';

/**
 * #252 - composite, collapsible "activity tree" card for one turn.
 *
 * Port of Foundry's MessageForgeActivity, adapted to Wayland's ActivityNode
 * model and orange/dark tokens. One self-contained Virtuoso row (the list is
 * virtualized): the card auto-expands while the turn is running, auto-collapses
 * when every node is terminal (Foundry's prevHadWorking ref pattern), and each
 * node can be clicked to drill into its accumulated detail (streamed tool
 * stdout, thinking text, op-trail summary).
 */

const handleKeyToggle = (e: React.KeyboardEvent, fn: () => void): void => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

const computeTotalDuration = (nodes: ActivityNode[]): string | null => {
  let earliest = Infinity;
  let latest = -Infinity;
  for (const n of nodes) {
    if (n.startTime != null && n.startTime < earliest) earliest = n.startTime;
    if (n.endTime != null && n.endTime > latest) latest = n.endTime;
  }
  if (!isFinite(earliest) || !isFinite(latest) || latest < earliest) return null;
  return ((latest - earliest) / 1000).toFixed(1) + 's';
};

const MessageActivity: React.FC<{ message: IMessageActivity; showCost?: boolean }> = ({
  message,
  showCost = false,
}) => {
  const { t } = useTranslation();
  const { nodes, perTurnCost, status } = message.content;

  const [expanded, setExpanded] = useState(status === 'running');

  // Auto-collapse when all nodes finish (Foundry prevHadWorking ref pattern).
  const prevHadRunning = useRef(false);
  useEffect(() => {
    const hasRunning = status === 'running';
    const allDone = nodes.length > 0 && nodes.every((n) => n.status !== 'running');
    if (prevHadRunning.current && allDone) {
      setExpanded(false);
    }
    prevHadRunning.current = hasRunning;
  }, [nodes, status]);

  // Cost is opt-in (off by default): a cost-only turn renders nothing unless shown.
  const costVisible = showCost && perTurnCost != null && perTurnCost.length > 0;

  // Nothing to render until at least one node or a visible cost row exists.
  if (nodes.length === 0 && !costVisible) {
    return null;
  }

  const runningCount = nodes.filter((n) => n.status === 'running').length;
  const allDone = nodes.every((n) => n.status !== 'running');
  const totalDuration = computeTotalDuration(nodes);

  const headerStatus = status === 'running' ? 'processing' : status === 'failed' ? 'error' : 'success';

  // Per-turn cost block, reused in both the collapsed summary and the expanded
  // detail. With Show cost on, a completed turn auto-collapses but must still
  // surface its final spend (mock: cost attaches to the completed answer, not
  // gated behind re-expanding the card).
  const costBlock = costVisible ? (
    <div className={styles.cost}>
      {perTurnCost.map((c) => (
        <div key={c.turn} className={styles.costRow}>
          <span className={styles.costModel}>{c.model}</span>
          <span className={styles.costProvider}>{c.provider}</span>
          <span className={styles.costValue}>
            {t('conversation.activity.costPerTurn', {
              defaultValue: '${{cost}}',
              cost: c.costUsd.toFixed(4),
            })}
          </span>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div className={styles.container} data-testid='activity-card' data-activity-status={status}>
      <div
        className={styles.header}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => handleKeyToggle(e, () => setExpanded((v) => !v))}
        role='button'
        tabIndex={0}
        aria-expanded={expanded}
      >
        {runningCount > 0 && <span className={styles.heartbeat} aria-hidden='true' />}
        <Badge
          status={headerStatus}
          text={t('conversation.activity.activeHeader', { defaultValue: 'Activity', count: nodes.length })}
        />
        <span className={styles.count}>
          {t('conversation.activity.stepCount', { defaultValue: '{{count}} steps', count: nodes.length })}
        </span>
        <span className={styles.spacer} />
        {expanded ? <Down size='14' /> : <Right size='14' />}
      </div>

      {!expanded && allDone && (
        <>
          {nodes.length > 0 && (
            <div className={styles.summary}>
              <Badge status={headerStatus} />
              <span>
                {t('conversation.activity.completedSummary', {
                  defaultValue: 'Completed {{count}} steps in {{duration}}',
                  count: nodes.length,
                  duration: totalDuration || '?',
                })}
              </span>
            </div>
          )}
          {costBlock}
        </>
      )}

      {expanded && (
        <div className={styles.list}>
          <ActivityNodeTree nodes={nodes} />
          {costBlock}
        </div>
      )}
    </div>
  );
};

export default React.memo(
  MessageActivity,
  (prev, next) => prev.message.content === next.message.content && prev.showCost === next.showCost
);
