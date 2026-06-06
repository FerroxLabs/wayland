/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Labelled (NOT collapsible) Recent Chats section per SPEC §4.4 / cross-audit Q1.
 * Header is purely visual - no chevron, no expand affordance, body always visible.
 */

import { MessageSquare } from 'lucide-react';
import React, { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { WorkspaceGroupedHistoryProps } from '@renderer/pages/conversation/GroupedHistory/types';
import styles from './SiderRecentChatsSection.module.css';

const WorkspaceGroupedHistory = React.lazy(() => import('@renderer/pages/conversation/GroupedHistory'));

const COUNT_DEBOUNCE_MS = 500;
const COUNT_PAGE_SIZE = 10000;

export type SiderRecentChatsSectionProps = WorkspaceGroupedHistoryProps;

export const SiderRecentChatsSection: React.FC<SiderRecentChatsSectionProps> = (props) => {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const collapsed = props.collapsed ?? false;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void ipcBridge.database.getUserConversations
          .invoke({ page: 0, pageSize: COUNT_PAGE_SIZE })
          .then((list) => {
            if (!alive) return;
            if (Array.isArray(list)) {
              // Match WorkspaceGroupedHistory's visible-set filter: drop health-checks and team-attached.
              const visible = list.filter((conv) => {
                const extra = conv.extra as { isHealthCheck?: boolean; teamId?: string } | undefined;
                return extra?.isHealthCheck !== true && !extra?.teamId;
              });
              setCount(visible.length);
            } else {
              setCount(0);
            }
          })
          .catch(() => {
            /* swallow - badge stays at last known good value */
          });
      }, COUNT_DEBOUNCE_MS);
    };

    refresh();
    const unsub = ipcBridge.conversation.listChanged.on(refresh);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, []);

  // Collapsed-mode fallback - body would be too dense for icon-only;
  // instead, delegate to WorkspaceGroupedHistory's own collapsed treatment.
  if (collapsed) {
    return (
      <Suspense fallback={null}>
        <WorkspaceGroupedHistory {...props} />
      </Suspense>
    );
  }

  const showBadge = count > 0;

  return (
    <div className={styles.section} data-testid='sider-recent-chats-section'>
      <div className={styles.header}>
        <MessageSquare size={16} className={styles.icon} />
        <span className={styles.label}>{t('sider.accordion.recentChats')}</span>
        {showBadge && (
          <span
            className={styles.badge}
            role='status'
            aria-live='polite'
            aria-label={`${count} chats`}
            data-testid='recent-chats-badge'
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
      <Suspense fallback={<div className={styles.fallback} />}>
        <WorkspaceGroupedHistory {...props} />
      </Suspense>
    </div>
  );
};
