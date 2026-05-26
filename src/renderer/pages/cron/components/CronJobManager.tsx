/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clock } from 'lucide-react';
import { iconColors } from '@/renderer/styles/colors';
import { ipcBridge } from '@/common';
import type { ICronJob } from '@/common/adapter/ipcBridge';
import type { TMessage } from '@/common/chat/chatLib';
import { Button, Popover, Tooltip } from '@arco-design/web-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCronJobs } from '../useCronJobs';
import { getJobStatusFlags } from '../cronUtils';
import CreateTaskDialog from '../ScheduledTasksPage/CreateTaskDialog';
import { extractCronPromptFromUserMessages } from '@renderer/utils/cron/extractCronPromptFromUserMessages';
import { emitter } from '@renderer/utils/emitter';

interface CronJobManagerProps {
  conversationId: string;
  /** When provided (e.g. from conversation.extra.cronJobId), fetch the job directly */
  cronJobId?: string;
  /**
   * Title of the source conversation — passed through to CreateTaskDialog
   * so the user doesn't have to retype their chat's intent when turning it
   * into a scheduled task. Optional; the dialog falls back to its own
   * defaults when absent.
   */
  conversationTitle?: string;
  /**
   * Backend type (gemini | wcore | claude | codex | ...) — passed through
   * to CreateTaskDialog so the new cron job inherits the chat's agent type
   * by default rather than dropping to 'claude'.
   */
  agentType?: string;
  /**
   * @deprecated Retained for API compatibility — the empty-state cron pill is
   * always rendered as a discovery surface (carried over from upstream
   * AionUI), so this prop no longer gates visibility. v0.6.2.5: the "Create
   * Now" click opens CreateTaskDialog directly with this chat as the cron
   * source; no agent involvement needed to bind the job.
   */
  hasCronSkill?: boolean;
}

/**
 * Cron job manager component for ChatLayout headerExtra
 * Shows a single job per conversation with navigation to task detail
 */
const CronJobManager: React.FC<CronJobManagerProps> = ({
  conversationId,
  cronJobId,
  conversationTitle,
  agentType,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string>('');

  // v0.6.2.6 smart prefill — CronJobManager mounts in ChatLayout's
  // headerExtra slot, which is ABOVE the per-backend MessageListProvider
  // tree. We can't `useMessageList()` from here. Fetch via the existing
  // database IPC on-demand when the modal is about to open; cheap (single
  // DB query) and avoids any prop-drilling through ChatLayout. The util
  // filters out short/ack/cron-meta/teammate messages.
  const openCreateDialog = useCallback(async () => {
    setShowCreateDialog(true);
    try {
      const messages = (await ipcBridge.database.getConversationMessages.invoke({
        conversation_id: conversationId,
        page: 0,
        pageSize: 200,
      })) as TMessage[];
      setInitialPrompt(extractCronPromptFromUserMessages(messages ?? []));
    } catch (err) {
      console.warn('[CronJobManager] Failed to fetch messages for smart prefill:', err);
      setInitialPrompt('');
    }
  }, [conversationId]);

  // v0.6.2.6 — listen for "Schedule this chat" events from the sidebar
  // 3-dot menu. Only respond when the event targets THIS conversation
  // (multiple CronJobManagers can mount simultaneously when the user
  // navigates between chats while the dialog is open elsewhere).
  useEffect(() => {
    const handler = (payload: { conversationId: string }) => {
      if (payload.conversationId !== conversationId) return;
      void openCreateDialog();
    };
    emitter.on('cron.modal.openForChat', handler);
    return () => {
      emitter.off('cron.modal.openForChat', handler);
    };
  }, [conversationId, openCreateDialog]);

  // v0.6.2.6 — handle ?schedule=1 query param (set by sidebar menu when
  // user picks "Schedule this chat" on a DIFFERENT conversation than the
  // currently-open one). Open the dialog on mount, then strip the param
  // via replace navigation so a refresh doesn't re-trigger it.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('schedule') !== '1') return;
    void openCreateDialog();
    const next = new URLSearchParams(searchParams);
    next.delete('schedule');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, openCreateDialog]);

  // For child conversations spawned by a cron job, fetch the job directly by ID
  const [directJob, setDirectJob] = useState<ICronJob | null>(null);
  const [directLoading, setDirectLoading] = useState(!!cronJobId);

  useEffect(() => {
    if (!cronJobId) return;
    setDirectLoading(true);
    ipcBridge.cron.getJob
      .invoke({ jobId: cronJobId })
      .then((job) => setDirectJob(job ?? null))
      .catch(() => setDirectJob(null))
      .finally(() => setDirectLoading(false));
  }, [cronJobId]);

  // For regular conversations, use the existing hook
  const { jobs, loading: listLoading, hasJobs } = useCronJobs(cronJobId ? undefined : conversationId);

  const job = cronJobId ? directJob : (jobs[0] ?? null);
  const loading = cronJobId ? directLoading : listLoading;
  const found = cronJobId ? !!directJob : hasJobs;

  // Always render the dialog so it can open from either the empty-state pill
  // or (future) other entry points without remounting. visible toggles it.
  const dialogNode = (
    <CreateTaskDialog
      visible={showCreateDialog}
      onClose={() => setShowCreateDialog(false)}
      conversationId={conversationId}
      conversationTitle={conversationTitle}
      agentType={agentType}
      initialPrompt={initialPrompt}
    />
  );

  // Empty-state discovery pill: always rendered when no job exists for this
  // conversation. v0.6.2.5 — clicking "Create Now" opens the existing
  // CreateTaskDialog with the current chat as the cron source, so the user
  // picks a schedule and the cron job is created directly via IPC. Replaces
  // the inherited AionUI behavior of dumping a canned prompt into the sendbox
  // (which relied on the agent to interpret + call cron tools and failed when
  // the cron skill wasn't loaded).
  if (!found && !loading) {
    return (
      <>
        <Popover
          trigger='hover'
          position='bottom'
          content={
            <div className='flex flex-col gap-8px p-4px max-w-240px'>
              <div className='text-13px text-t-secondary'>{t('cron.status.unconfiguredHint')}</div>
              <Button type='primary' size='mini' onClick={openCreateDialog}>
                {t('cron.status.createNow')}
              </Button>
            </div>
          }
        >
          <Button
            type='text'
            size='small'
            className='cron-job-manager-button chat-header-cron-pill !h-auto !w-auto !min-w-0 !px-0 !py-0'
          >
            <span className='inline-flex items-center gap-2px rounded-full px-8px py-2px bg-2'>
              <Clock size={16} color={iconColors.disabled} />
              <span className='ml-4px w-8px h-8px rounded-full bg-[#86909c]' />
            </span>
          </Button>
        </Popover>
        {dialogNode}
      </>
    );
  }

  if (loading || !job) return null;

  const { hasError, isPaused } = getJobStatusFlags(job);
  const tooltipContent = isPaused ? t('cron.status.paused') : hasError ? t('cron.status.error') : job.name;

  return (
    <Tooltip content={tooltipContent}>
      <Button
        type='text'
        size='small'
        className='cron-job-manager-button chat-header-cron-pill !h-auto !w-auto !min-w-0 !px-0 !py-0'
        onClick={() => navigate(`/scheduled/${job.id}`)}
      >
        <span className='inline-flex items-center gap-2px rounded-full px-8px py-2px bg-2'>
          <Clock size={16} color={iconColors.primary} />
          <span
            className={`ml-4px w-8px h-8px rounded-full ${hasError ? 'bg-[#f53f3f]' : isPaused ? 'bg-[#ff7d00]' : 'bg-[#00b42a]'}`}
          />
        </span>
      </Button>
    </Tooltip>
  );
};

export default CronJobManager;
