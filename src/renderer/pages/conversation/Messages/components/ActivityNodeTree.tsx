/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ActivityNode } from '@/common/chat/chatLib';
import { Badge, Tag } from '@arco-design/web-react';
import type { TFunction } from 'i18next';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './MessageActivity.module.css';

/**
 * #252 Phase 2 - shared, recursive renderer for an ActivityNode subtree.
 *
 * Extracted from MessageActivity so the same depth-N tree + click-into-detail
 * (monologue / streamed tool stdout) machine is reused by both the per-turn
 * activity card AND the sub-agent drill-down card. Each node click toggles its
 * accumulated `detail`; sub-agent nodes recurse into an indented `children`
 * subtree (depth-N). Expand state is local to this component (one open node per
 * level), matching the Foundry expand-on-click pattern.
 */

const nodeStatusBadge: Record<ActivityNode['status'], 'processing' | 'success' | 'error'> = {
  running: 'processing',
  done: 'success',
  failed: 'error',
};

const statusLabel = (status: ActivityNode['status'], t: TFunction): string => {
  switch (status) {
    case 'running':
      return t('conversation.activity.statusWorking', { defaultValue: 'Working' });
    case 'failed':
      return t('conversation.activity.statusFailed', { defaultValue: 'Failed' });
    default:
      return t('conversation.activity.statusDone', { defaultValue: 'Done' });
  }
};

const kindLabel = (kind: ActivityNode['kind'], t: TFunction): string => {
  switch (kind) {
    case 'thinking':
      return t('conversation.activity.kindThinking', { defaultValue: 'Thinking' });
    case 'sub_agent':
      return t('conversation.activity.kindSubAgent', { defaultValue: 'Sub-agent' });
    case 'circuit':
      return t('conversation.activity.kindCircuit', { defaultValue: 'Provider' });
    case 'browser':
      return t('conversation.activity.kindBrowser', { defaultValue: 'Browser' });
    case 'cua':
      return t('conversation.activity.kindCua', { defaultValue: 'Computer' });
    default:
      return t('conversation.activity.kindTool', { defaultValue: 'Tool' });
  }
};

const formatDuration = (startTime?: number, endTime?: number): string | null => {
  if (startTime == null || endTime == null) return null;
  const secs = (endTime - startTime) / 1000;
  if (secs < 0) return null;
  return secs.toFixed(1) + 's';
};

const handleKeyToggle = (e: React.KeyboardEvent, fn: () => void): void => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

const ActivityNodeTree: React.FC<{ nodes: ActivityNode[] }> = ({ nodes }) => {
  const { t } = useTranslation();
  // One open node per level (drill into its detail / nested subtree).
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  return (
    <>
      {nodes.map((node) => {
        const duration = formatDuration(node.startTime, node.endTime);
        const isOpen = expandedNodeId === node.id;
        const hasDetail = Boolean(node.detail && node.detail.length);
        const hasChildren = Boolean(node.children && node.children.length);
        const isClickable = hasDetail || hasChildren;
        return (
          <div key={node.id}>
            <div
              className={styles.item}
              onClick={() => isClickable && setExpandedNodeId(isOpen ? null : node.id)}
              onKeyDown={(e) => isClickable && handleKeyToggle(e, () => setExpandedNodeId(isOpen ? null : node.id))}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              style={isClickable ? { cursor: 'pointer' } : undefined}
            >
              {node.status === 'running' && <span className={styles.heartbeat} aria-hidden='true' />}
              <Badge status={nodeStatusBadge[node.status]} />
              <Tag size='small' className={styles.statusText}>
                {statusLabel(node.status, t)}
              </Tag>
              <Tag size='small' className={styles.kindTag}>
                {kindLabel(node.kind, t)}
              </Tag>
              <span className={styles.nodeName}>{node.name || kindLabel(node.kind, t)}</span>
              {duration && <span className={styles.duration}>{duration}</span>}
            </div>
            {isOpen && hasDetail && (
              <div className={styles.detail}>
                <pre className={styles.detailText}>{node.detail}</pre>
              </div>
            )}
            {isOpen && hasChildren && (
              <div className={styles.childTree}>
                <ActivityNodeTree nodes={node.children!} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default ActivityNodeTree;
