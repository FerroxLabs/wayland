/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import { clearPersistedDraftsForConversation } from '@/renderer/hooks/chat/useSendBoxDraft';
import AssignToProjectModal from '@/renderer/pages/projects/components/AssignToProjectModal';
import { useProjects } from '@/renderer/pages/projects/hooks/useProjects';
import {
  getConversationPinnedAt,
  isConversationPinned,
} from '@/renderer/pages/conversation/GroupedHistory/utils/groupingHelpers';
import { getActivityTime } from '@/renderer/utils/chat/timeline';
import PageShell from '@/renderer/components/layout/PageShell';
import { Input, Message, Modal, Spin } from '@arco-design/web-react';
import { MessageSquare, MessagesSquare, Plus } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ConversationRow from './ConversationRow';
import { type ConversationMenuAction } from './ConversationMenu';
import ResumeCard from './ResumeCard';
import styles from './conversationCards.module.css';

const DAY = 86_400_000;
const RESUME_COUNT = 4;

const startOfToday = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

const getProjectId = (conv: TChatConversation): string | undefined =>
  (conv.extra as { projectId?: string } | undefined)?.projectId;

/**
 * A full-width browse surface for every conversation. "Jump back in" cards
 * resume the latest few; starred chats pin to the top; the rest fall into
 * date sections. Each chat carries the full context menu (open, rename, star,
 * move to project, delete) on right-click and the ⋯ button - all on the same
 * wired actions the sidebar history uses.
 */
const ConversationsListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const [all, setAll] = useState<TChatConversation[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Rename modal state.
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameBusy, setRenameBusy] = useState(false);

  const [assignProjectCtrl, assignProjectNode] = AssignToProjectModal.useModal({ conversationId: undefined });

  const projectById = useMemo<Map<string, IProject>>(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const fetchAll = useCallback(async () => {
    try {
      const result = await ipcBridge.database.getUserConversations.invoke({ page: 0, pageSize: 10000 });
      const list = Array.isArray(result) ? result : [];
      // Hide health-checks and team-attached conversations - they aren't user chats.
      const filtered = list.filter((conv) => {
        const extra = conv.extra as { isHealthCheck?: boolean; teamId?: string } | undefined;
        return extra?.isHealthCheck !== true && !extra?.teamId;
      });
      setAll(filtered);
    } catch (err) {
      console.error('[ConversationsListPage] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    const unsub = ipcBridge.conversation.listChanged.on(() => void fetchAll());
    return () => unsub();
  }, [fetchAll]);

  const timeLabel = useCallback(
    (ts: number | undefined): string => {
      if (!ts) return '';
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return t('conversations.time.now', { defaultValue: 'just now' });
      if (mins < 60) return t('conversations.time.minutes', { defaultValue: '{{n}}m ago', n: mins });
      const hours = Math.floor(diff / 3600000);
      if (hours < 24) return t('conversations.time.hours', { defaultValue: '{{n}}h ago', n: hours });
      const days = Math.floor(diff / DAY);
      if (days < 30) return t('conversations.time.days', { defaultValue: '{{n}}d ago', n: days });
      return new Date(ts).toLocaleDateString();
    },
    [t]
  );

  // --- search + grouping ---
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((c) => (c.name ?? '').toLowerCase().includes(q)) : all;
  }, [all, query]);

  const byActivityDesc = useCallback(
    (list: TChatConversation[]) => list.toSorted((a, b) => getActivityTime(b) - getActivityTime(a)),
    []
  );

  const resume = useMemo(
    () => (query ? [] : byActivityDesc(searched).slice(0, RESUME_COUNT)),
    [searched, query, byActivityDesc]
  );

  const pinnedList = useMemo(
    () =>
      query
        ? []
        : searched
            .filter(isConversationPinned)
            .toSorted((a, b) => getConversationPinnedAt(b) - getConversationPinnedAt(a)),
    [searched, query]
  );

  const dateSections = useMemo(() => {
    const normal = byActivityDesc(query ? searched : searched.filter((c) => !isConversationPinned(c)));
    const today0 = startOfToday();
    const buckets: Record<string, TChatConversation[]> = { today: [], yesterday: [], week: [], month: [], older: [] };
    for (const c of normal) {
      const ts = getActivityTime(c);
      if (ts >= today0) buckets.today.push(c);
      else if (ts >= today0 - DAY) buckets.yesterday.push(c);
      else if (ts >= today0 - 7 * DAY) buckets.week.push(c);
      else if (ts >= today0 - 30 * DAY) buckets.month.push(c);
      else buckets.older.push(c);
    }
    return (
      [
        { key: 'today', label: t('conversations.group.today', { defaultValue: 'Today' }), items: buckets.today },
        {
          key: 'yesterday',
          label: t('conversations.group.yesterday', { defaultValue: 'Yesterday' }),
          items: buckets.yesterday,
        },
        { key: 'week', label: t('conversations.group.week', { defaultValue: 'Previous 7 days' }), items: buckets.week },
        {
          key: 'month',
          label: t('conversations.group.month', { defaultValue: 'Previous 30 days' }),
          items: buckets.month,
        },
        { key: 'older', label: t('conversations.group.older', { defaultValue: 'Older' }), items: buckets.older },
      ] as const
    ).filter((s) => s.items.length > 0);
  }, [searched, query, byActivityDesc, t]);

  // --- actions (the same wired IPC the sidebar history uses) ---
  const togglePin = useCallback(
    async (conv: TChatConversation) => {
      const pinned = isConversationPinned(conv);
      await ipcBridge.conversation.update.invoke({
        id: conv.id,
        updates: {
          extra: { pinned: !pinned, pinnedAt: pinned ? undefined : Date.now() } as Partial<TChatConversation['extra']>,
        } as Partial<TChatConversation>,
        mergeExtra: true,
      });
      void fetchAll();
    },
    [fetchAll]
  );

  const confirmDelete = useCallback(
    (conv: TChatConversation) => {
      Modal.confirm({
        title: t('conversation.history.deleteTitle', { defaultValue: 'Delete conversation' }),
        content: t('conversation.history.deleteConfirm', { defaultValue: 'This cannot be undone.' }),
        okText: t('conversation.history.confirmDelete', { defaultValue: 'Delete' }),
        cancelText: t('conversation.history.cancelDelete', { defaultValue: 'Cancel' }),
        okButtonProps: { status: 'danger' },
        alignCenter: true,
        style: { borderRadius: '12px' },
        getPopupContainer: () => document.body,
        onOk: async () => {
          try {
            const ok = await ipcBridge.conversation.remove.invoke({ id: conv.id });
            if (ok) {
              clearPersistedDraftsForConversation(conv.id);
              Message.success(t('conversation.history.deleteSuccess', { defaultValue: 'Deleted' }));
              void fetchAll();
            } else {
              Message.error(t('conversation.history.deleteFailed', { defaultValue: 'Delete failed' }));
            }
          } catch (error) {
            console.error('Failed to remove conversation:', error);
            Message.error(t('conversation.history.deleteFailed', { defaultValue: 'Delete failed' }));
          }
        },
      });
    },
    [fetchAll, t]
  );

  const confirmRename = useCallback(async () => {
    const name = renameName.trim();
    if (!renameId || !name) return;
    setRenameBusy(true);
    try {
      const ok = await ipcBridge.conversation.update.invoke({ id: renameId, updates: { name } });
      if (ok) {
        Message.success(t('conversation.history.renameSuccess', { defaultValue: 'Renamed' }));
        setRenameOpen(false);
        setRenameId(null);
        setRenameName('');
        void fetchAll();
      } else {
        Message.error(t('conversation.history.renameFailed', { defaultValue: 'Rename failed' }));
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      Message.error(t('conversation.history.renameFailed', { defaultValue: 'Rename failed' }));
    } finally {
      setRenameBusy(false);
    }
  }, [renameId, renameName, fetchAll, t]);

  const handleAction = useCallback(
    (conv: TChatConversation, action: ConversationMenuAction) => {
      switch (action) {
        case 'open':
          navigate(`/conversation/${conv.id}`);
          break;
        case 'rename':
          setRenameId(conv.id);
          setRenameName(conv.name || '');
          setRenameOpen(true);
          break;
        case 'pin':
          void togglePin(conv);
          break;
        case 'move':
          assignProjectCtrl.open({ conversationId: conv.id });
          break;
        case 'delete':
          confirmDelete(conv);
          break;
      }
    },
    [navigate, togglePin, assignProjectCtrl, confirmDelete]
  );

  const renderRow = (conv: TChatConversation) => {
    const projectId = getProjectId(conv);
    return (
      <ConversationRow
        key={conv.id}
        conversation={conv}
        pinned={isConversationPinned(conv)}
        project={projectId ? projectById.get(projectId) : undefined}
        timeLabel={timeLabel(getActivityTime(conv))}
        onOpen={() => navigate(`/conversation/${conv.id}`)}
        onAction={(action) => handleAction(conv, action)}
      />
    );
  };

  const isEmpty = !loading && searched.length === 0;

  const newChatButton = (
    <button
      type='button'
      className='flex items-center gap-6px h-32px px-12px rd-8px border-none cursor-pointer bg-[rgb(var(--primary-6))] text-white'
      onClick={() => navigate('/guid', { state: { resetAssistant: true } })}
    >
      <Plus size={16} />
      <span className='text-13px'>{t('conversations.list.newButton', { defaultValue: 'New Chat' })}</span>
    </button>
  );

  return (
    <PageShell
      title={t('conversations.list.title', { defaultValue: 'Conversations' })}
      icon={<MessagesSquare size={20} />}
      subtitle={t('conversations.list.subtitle', { defaultValue: 'Every chat and session' })}
      actions={newChatButton}
      width='full'
    >
      {/* Search */}
      <div className='pb-12px shrink-0 max-w-[560px] w-full'>
        <Input.Search
          allowClear
          value={query}
          onChange={setQuery}
          placeholder={t('conversations.list.searchPlaceholder', { defaultValue: 'Search by title…' })}
        />
      </div>

      {/* Body */}
      <div className='pb-32px'>
        <Spin loading={loading} style={{ display: 'block' }}>
          {isEmpty ? (
            <div className='flex flex-col items-center justify-center gap-12px py-64px text-center'>
              <div className='flex items-center justify-center w-56px h-56px rd-16px bg-fill-1 text-t-tertiary'>
                <MessageSquare size={26} />
              </div>
              <div className='text-15px font-600 text-t-primary'>
                {query
                  ? t('conversations.empty.noResults', { defaultValue: 'No conversations found' })
                  : t('conversations.empty.title', { defaultValue: 'No conversations yet' })}
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-24px'>
              {/* Jump back in */}
              {resume.length > 0 && (
                <section className='flex flex-col gap-10px'>
                  <span className={styles.sectionLabel}>
                    {t('conversations.group.resume', { defaultValue: 'Jump back in' })}
                  </span>
                  <div className={styles.rail}>
                    {resume.map((conv) => (
                      <ResumeCard
                        key={conv.id}
                        conversation={conv}
                        pinned={isConversationPinned(conv)}
                        timeLabel={timeLabel(getActivityTime(conv))}
                        onOpen={() => navigate(`/conversation/${conv.id}`)}
                        onAction={(action) => handleAction(conv, action)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Starred */}
              {pinnedList.length > 0 && (
                <section className='flex flex-col gap-6px'>
                  <span className={`${styles.sectionLabel} px-12px`}>
                    {t('conversations.group.starred', { defaultValue: 'Starred' })}
                  </span>
                  <div className='flex flex-col'>{pinnedList.map(renderRow)}</div>
                </section>
              )}

              {/* Date sections */}
              {dateSections.map((section) => (
                <section key={section.key} className='flex flex-col gap-6px'>
                  <span className={`${styles.sectionLabel} px-12px`}>{section.label}</span>
                  <div className='flex flex-col'>{section.items.map(renderRow)}</div>
                </section>
              ))}
            </div>
          )}
        </Spin>
      </div>

      {/* Rename modal */}
      <Modal
        title={t('conversations.menu.rename', { defaultValue: 'Rename' })}
        visible={renameOpen}
        onCancel={() => setRenameOpen(false)}
        onOk={() => void confirmRename()}
        confirmLoading={renameBusy}
        okText={t('common.confirm', { defaultValue: 'Save' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        style={{ borderRadius: '12px' }}
        autoFocus
      >
        <Input
          value={renameName}
          onChange={setRenameName}
          onPressEnter={() => void confirmRename()}
          placeholder={t('conversations.list.searchPlaceholder', { defaultValue: 'Name…' })}
          maxLength={120}
          showWordLimit
        />
      </Modal>

      {assignProjectNode}
    </PageShell>
  );
};

export default ConversationsListPage;
