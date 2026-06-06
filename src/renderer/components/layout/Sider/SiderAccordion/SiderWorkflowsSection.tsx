/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExternalLink, MoreVertical, Trash2, Workflow } from 'lucide-react';
import { Dropdown, Menu, Message, Modal } from '@arco-design/web-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ipcBridge } from '@/common';

import { SiderAccordionShell } from './SiderAccordionShell';
import { useSiderAccordionState } from './useSiderAccordionState';

const IN_FLIGHT_CAP = 5;
const COUNT_DEBOUNCE_MS = 300;

type InFlightRow = {
  sessionId: string;
  workflowName: string;
  conversationId: string;
  currentStep: number;
  totalSteps: number;
};

export type SiderWorkflowsSectionProps = {
  collapsed: boolean;
};

/**
 * Sider accordion that surfaces in-flight workflow sessions plus a See-all
 * link. Badge subscribes to the lightweight `workflow.countActive` provider
 * (debounced 300ms) so updates do not pay for a full session-list refetch.
 * Full row data is fetched lazily, only while the accordion is open.
 *
 * Source of truth: SPEC §4.4 (Workflows accordion). W0 froze the IPC surface.
 */
export const SiderWorkflowsSection: React.FC<SiderWorkflowsSectionProps> = ({ collapsed }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, toggle } = useSiderAccordionState();
  const [count, setCount] = useState(0);
  const [activeSessions, setActiveSessions] = useState<InFlightRow[]>([]);
  const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);

  // Badge subscription - lightweight countActive with 300ms trailing debounce.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void (async () => {
          try {
            const n = await ipcBridge.workflow.countActive.invoke();
            if (alive) setCount(n);
          } catch {
            /* badge can stay stale on transient IPC failure */
          }
        })();
      }, COUNT_DEBOUNCE_MS);
    };
    refresh();
    const unsub = ipcBridge.workflow.sessionChanged.on(refresh);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, []);

  // Full session payload - only when accordion is open.
  useEffect(() => {
    if (!state.workflows) return;
    let alive = true;
    const fetchAll = async () => {
      try {
        const result = await ipcBridge.workflow.findAllActive.invoke({});
        if (!alive) return;
        const rows: InFlightRow[] = (result?.sessions ?? []).map((row) => ({
          sessionId: row.session.id,
          workflowName: row.session.workflow_title || row.session.workflow_name,
          conversationId: row.session.conversation_id,
          currentStep: row.session.current_step ?? 1,
          totalSteps: row.session.total_steps ?? 1,
        }));
        setActiveSessions(rows);
      } catch {
        /* keep previous list on transient IPC failure */
      }
    };
    void fetchAll();
    const unsub = ipcBridge.workflow.sessionChanged.on(() => {
      void fetchAll();
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [state.workflows]);

  const visibleInFlight = activeSessions.slice(0, IN_FLIGHT_CAP);
  const overflow = Math.max(0, activeSessions.length - IN_FLIGHT_CAP);

  const handleRowClick = useCallback(
    (row: InFlightRow) => {
      // Defensive guard: preset launch defer leaves these null until the
      // session is materialised - bail rather than navigating to a broken URL.
      if (!row.sessionId || !row.conversationId) return;
      navigate(`/conversation/${row.conversationId}`, { state: { workflowSessionId: row.sessionId } });
    },
    [navigate]
  );

  const handleDelete = useCallback(
    (row: InFlightRow) => {
      Modal.confirm({
        title: t('workflow.delete.title', { defaultValue: 'Delete workflow?' }),
        content: t('workflow.delete.confirm', {
          defaultValue: 'This permanently removes the workflow session. This cannot be undone.',
        }),
        okText: t('conversation.history.deleteTitle', { defaultValue: 'Delete' }),
        okButtonProps: { status: 'danger' },
        style: { borderRadius: '12px' },
        getPopupContainer: () => document.body,
        onOk: async () => {
          try {
            await ipcBridge.workflow.deleteSession.invoke({ sessionId: row.sessionId });
            // sessionChanged fires → list refetches; optimistically drop it now too.
            setActiveSessions((prev) => prev.filter((s) => s.sessionId !== row.sessionId));
            Message.success(t('workflow.delete.success', { defaultValue: 'Workflow deleted.' }));
          } catch (err) {
            console.error('Failed to delete workflow session:', err);
            Message.error(t('workflow.delete.failed', { defaultValue: 'Failed to delete workflow.' }));
          }
        },
      });
    },
    [t]
  );

  // v0.6.2.1 hide-when-empty: TopZone "Workflows" entry handles discover/create
  // when nothing is in flight, so the runtime accordion only earns its row when
  // count > 0. Applies to both collapsed and expanded modes - one icon per
  // concept (don't make me think).
  if (count === 0) return null;

  if (collapsed) {
    return (
      <button
        type='button'
        className='w-full h-40px flex items-center justify-center rd-7px bg-transparent border-none cursor-pointer hover:bg-fill-2 text-text-2 hover:text-text-1 relative'
        onClick={() => navigate('/workflows')}
        aria-label={`Workflows (${count} in-flight)`}
        title={`Workflows · ${count} in-flight`}
      >
        <Workflow size={18} />
        <span
          className='absolute top-6px right-6px w-6px h-6px rounded-full bg-[rgb(var(--primary-6))] shadow-[0_0_0_2px_rgba(254,153,0,0.25)]'
          aria-hidden
        />
      </button>
    );
  }

  const liveBadge = count > 0;

  return (
    <SiderAccordionShell
      icon={<Workflow size={16} />}
      label={t('sider.accordion.workflows')}
      badgeCount={count}
      isLive={liveBadge}
      open={state.workflows}
      onToggle={() => toggle('workflows')}
      badgeAriaLabel={`${count} in-flight workflows`}
      testId='sider-workflows-section'
    >
      {visibleInFlight.length > 0 && (
        <>
          <div className='px-10px py-4px text-9px tracking-wide text-text-4 uppercase font-bold'>
            {t('sider.accordion.inFlight')}
          </div>
          {visibleInFlight.map((row) => (
            <div
              key={row.sessionId}
              data-testid={`workflow-row-${row.sessionId}`}
              className='group flex items-center gap-8px px-10px py-6px pl-28px cursor-pointer hover:bg-fill-2 text-text-2'
              onClick={() => handleRowClick(row)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuVisibleId(row.sessionId);
              }}
            >
              <span className='w-6px h-6px rounded-full bg-success' />
              <span className='truncate flex-1'>{row.workflowName}</span>
              <span
                className={`text-text-3 tabular-nums text-10px ${menuVisibleId === row.sessionId ? 'hidden' : 'group-hover:hidden'}`}
              >
                {row.currentStep} / {row.totalSteps}
              </span>
              <Dropdown
                trigger='click'
                position='br'
                popupVisible={menuVisibleId === row.sessionId}
                onVisibleChange={(v) => setMenuVisibleId(v ? row.sessionId : null)}
                getPopupContainer={() => document.body}
                droplist={
                  <Menu
                    onClickMenuItem={(key) => {
                      setMenuVisibleId(null);
                      if (key === 'open') handleRowClick(row);
                      else if (key === 'delete') handleDelete(row);
                    }}
                  >
                    <Menu.Item key='open'>
                      <div className='flex items-center gap-8px'>
                        <ExternalLink size={14} />
                        <span>{t('workflow.menu.open', { defaultValue: 'Open' })}</span>
                      </div>
                    </Menu.Item>
                    <Menu.Item key='delete'>
                      <div className='flex items-center gap-8px text-[rgb(var(--warning-6))]'>
                        <Trash2 size={14} />
                        <span>{t('workflow.menu.delete', { defaultValue: 'Delete' })}</span>
                      </div>
                    </Menu.Item>
                  </Menu>
                }
              >
                <span
                  className={`flex-center cursor-pointer hover:bg-fill-3 rd-4px p-2px ${menuVisibleId === row.sessionId ? 'flex' : 'hidden group-hover:flex'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuVisibleId(row.sessionId);
                  }}
                >
                  <MoreVertical size={14} />
                </span>
              </Dropdown>
            </div>
          ))}
        </>
      )}

      <div
        data-testid='sider-workflows-see-all'
        className='px-10px py-6px pl-28px text-10px text-text-3 italic cursor-pointer hover:text-orange'
        onClick={() => navigate('/workflows')}
      >
        {overflow > 0 ? t('sider.accordion.showMore', { count: overflow }) : t('sider.accordion.seeAllWorkflows')}
      </div>
    </SiderAccordionShell>
  );
};
