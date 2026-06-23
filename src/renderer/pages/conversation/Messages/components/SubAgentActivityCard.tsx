/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMessageSubAgent } from '@/common/chat/chatLib';
import { Spin } from '@arco-design/web-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityNodeTree from './ActivityNodeTree';
import styles from './SubAgentActivityCard.module.css';

const SubAgentActivityCard: React.FC<{ message: IMessageSubAgent }> = ({ message }) => {
  const { t } = useTranslation();
  const { agentName, status, body, nodes } = message.content;
  const [expanded, setExpanded] = useState(true);

  // #252 Phase 2: when the inner stream parsed into a real activity subtree
  // (the sub-agent's own tools / thinking / nested sub-agents), drill into the
  // depth-N tree. A malformed / opaque / text-only inner has no nodes and falls
  // back to the legacy flat `body` render below (no regression).
  const hasTree = Boolean(nodes && nodes.length);

  const isDone = status === 'done';
  const isFailed = status === 'failed';
  const isRunning = status === 'running';

  const statusLabel = isDone
    ? t('conversation.subAgent.statusDone', { defaultValue: 'Done' })
    : isFailed
      ? t('conversation.subAgent.statusFailed', { defaultValue: 'Failed' })
      : t('conversation.subAgent.statusRunning', { defaultValue: 'Running' });

  const headerLabel = `${agentName} - ${statusLabel}`;

  return (
    <div
      className={styles.container}
      data-sub-agent-status={status}
      data-sub-agent-name={agentName}
      data-testid='sub-agent-activity-card'
    >
      <hr className={styles.divider} />
      <div className={styles.header} onClick={() => setExpanded((v) => !v)}>
        {isRunning && <Spin size={12} />}
        {isDone && <span className={styles.dotDone} aria-label='done' />}
        {isFailed && <span className={styles.dotFailed} aria-label='failed' />}
        <span className={`${styles.arrow} ${expanded ? styles.arrowExpanded : ''}`}>{'▶'}</span>
        <span className={styles.summary}>{headerLabel}</span>
      </div>
      {expanded && hasTree && (
        <div className={styles.tree}>
          <ActivityNodeTree nodes={nodes!} />
        </div>
      )}
      {!hasTree && body && (
        <div className={`${styles.body} ${!expanded ? styles.collapsed : ''}`}>{body}</div>
      )}
      <hr className={styles.divider} />
    </div>
  );
};

export default SubAgentActivityCard;
