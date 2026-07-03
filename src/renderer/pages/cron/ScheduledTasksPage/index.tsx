/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clock, Plus } from 'lucide-react';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Switch, Message, Empty, Spin, Tooltip } from '@arco-design/web-react';
import { useLayoutContext } from '@renderer/hooks/context/LayoutContext';
import { useAllCronJobs } from '@renderer/pages/cron/useCronJobs';
import { formatSchedule, formatNextRun } from '@renderer/pages/cron/cronUtils';
import { systemSettings, type ICronJob } from '@/common/adapter/ipcBridge';
import { ACP_BACKENDS_ALL, type AcpBackendAll, type AcpBackendConfig } from '@/common/types/acpTypes';
import { getAgentLogo } from '@renderer/utils/model/agentLogo';
import PageShell from '@/renderer/components/layout/PageShell';
import CronStatusTag from './CronStatusTag';
import CreateTaskDialog from './CreateTaskDialog';

function normalizeAgentBackend(agent: string | undefined): AcpBackendAll | undefined {
  if (!agent) return undefined;
  return agent.replace(/^cli:/, '').replace(/^preset:/, '') as AcpBackendAll;
}

function getJobAgentMeta(job: ICronJob): { name?: string; logo?: string | null } {
  const backend = job.metadata.agentConfig?.backend || normalizeAgentBackend(job.metadata.agentType);
  if (!backend) return {};

  return {
    name:
      job.metadata.agentConfig?.name ||
      (ACP_BACKENDS_ALL as Record<string, AcpBackendConfig>)[backend]?.name ||
      backend,
    logo: getAgentLogo(backend),
  };
}

const ScheduledTasksPage: React.FC = () => {
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const { t } = useTranslation();
  const navigate = useNavigate();
  // #554: the list reconciles with the SQLite cron store on mount (route-enter
  // remounts this page) and on window focus / tab-visible via useAllCronJobs,
  // so a chat-created task surfaces even when its one-shot onJobCreated event
  // was lost because this page was unmounted or the window was blurred.
  const { jobs, loading, pauseJob, resumeJob } = useAllCronJobs();
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [createInitialWorkflowSlug, setCreateInitialWorkflowSlug] = useState<string | undefined>(undefined);
  const [keepAwake, setKeepAwake] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Open the Create dialog pre-filled with a workflow when navigated to
  // via `/scheduled?workflow=<slug>` (Workflows page → Schedule button).
  // The URL param is cleared on open so a manual reload doesn't re-fire
  // the dialog.
  useEffect(() => {
    const slug = searchParams.get('workflow');
    if (!slug) return;
    setCreateInitialWorkflowSlug(slug);
    setCreateDialogVisible(true);
    const next = new URLSearchParams(searchParams);
    next.delete('workflow');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    systemSettings.getKeepAwake
      .invoke()
      .then(setKeepAwake)
      .catch((err) => console.warn('[ScheduledTasksPage.getKeepAwake]', err));
  }, []);

  const handleKeepAwakeChange = useCallback(async (enabled: boolean) => {
    try {
      await systemSettings.setKeepAwake.invoke({ enabled });
      setKeepAwake(enabled);
    } catch (err) {
      Message.error(String(err));
    }
  }, []);

  const handleGoToDetail = useCallback(
    (job: ICronJob) => {
      navigate(`/scheduled/${job.id}`);
    },
    [navigate]
  );

  const handleToggleEnabled = useCallback(
    async (job: ICronJob) => {
      try {
        if (job.enabled) {
          await pauseJob(job.id);
          Message.success(t('cron.pauseSuccess'));
        } else {
          await resumeJob(job.id);
          Message.success(t('cron.resumeSuccess'));
        }
      } catch (err) {
        Message.error(String(err));
      }
    },
    [pauseJob, resumeJob, t]
  );

  return (
    <PageShell
      title={t('cron.scheduledTasks')}
      icon={<Clock size={20} />}
      subtitle={t('cron.page.description')}
      width='full'
      actions={
        <Button
          type='primary'
          className='shrink-0'
          icon={<Plus size={14} />}
          onClick={() => setCreateDialogVisible(true)}
        >
          {t('cron.page.newTask')}
        </Button>
      }
    >
      <div className={classNames('flex w-full box-border flex-col', isMobile ? 'gap-14px' : 'gap-16px')}>
        <div className='grid w-full box-border grid-cols-[minmax(0,1fr)_auto] items-center gap-x-12px gap-y-10px rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-2 px-14px py-12px sm:rounded-14px sm:px-16px max-[520px]:grid-cols-1'>
          <span
            className={classNames(
              'min-w-0 text-t-primary',
              isMobile ? 'text-12px leading-18px' : 'text-13px leading-20px'
            )}
          >
            {t('cron.page.awakeBanner')}
          </span>
          <div className='justify-self-end max-[520px]:justify-self-start'>
            <Tooltip content={t('cron.page.keepAwakeTooltip')}>
              <div className='flex items-center gap-8px text-t-secondary text-12px leading-18px sm:text-13px'>
                <span>{t('cron.page.keepAwake')}</span>
                <Switch size='small' checked={keepAwake} onChange={handleKeepAwakeChange} />
              </div>
            </Tooltip>
          </div>
        </div>

        {loading ? (
          <div className='flex min-h-220px items-center justify-center rounded-16px border border-dashed border-border-2 bg-fill-1'>
            <Spin />
          </div>
        ) : jobs.length === 0 ? (
          <div className='flex min-h-220px items-center justify-center rounded-16px border border-dashed border-border-2 bg-fill-1'>
            <Empty description={t('cron.noTasks')} />
          </div>
        ) : (
          <div
            className={classNames(
              'grid w-full items-start grid-cols-1 gap-12px',
              isMobile ? '' : 'sm:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {jobs.map((job) => {
              const agentMeta = getJobAgentMeta(job);
              const isManualOnly = job.schedule.kind === 'cron' && !job.schedule.expr;
              const executionModeLabel =
                job.target.executionMode === 'new_conversation'
                  ? t('cron.page.form.newConversation')
                  : t('cron.page.form.existingConversation');
              // Plain-English schedule is the primary line; the raw cron sits small
              // underneath for the technically-minded. Hide the raw line when the
              // schedule has no cron expression (manual/every) or when the
              // humanized text is the expression itself (humanizer fell back).
              const scheduleText = formatSchedule(job, t);
              const rawCron = job.schedule.kind === 'cron' ? job.schedule.expr : '';
              const showRawCron = Boolean(rawCron) && rawCron !== scheduleText;

              return (
                <div
                  key={job.id}
                  className={classNames(
                    'group flex cursor-pointer flex-col border border-solid border-[var(--color-border-2)] bg-fill-1 transition-colors duration-200 hover:border-[var(--color-border-3)] hover:shadow-sm',
                    isMobile ? 'rounded-12px px-16px py-16px' : 'rounded-12px px-20px py-18px'
                  )}
                  onClick={() => handleGoToDetail(job)}
                >
                  <div className='mb-12px flex items-center justify-between gap-8px'>
                    <span
                      className={classNames(
                        'mr-8px min-w-0 flex-1 font-medium text-t-primary',
                        isMobile ? 'truncate text-14px leading-20px' : 'truncate text-15px leading-22px'
                      )}
                    >
                      {job.name}
                    </span>
                    <CronStatusTag job={job} />
                  </div>

                  <div className='min-w-0'>
                    <div
                      className={classNames(
                        'break-words text-t-primary',
                        isMobile ? 'text-13px leading-20px' : 'text-14px leading-22px'
                      )}
                      title={scheduleText}
                    >
                      {scheduleText}
                    </div>
                    {showRawCron && (
                      <div
                        className='mt-3px break-all font-mono text-12px leading-16px text-[var(--color-text-3)]'
                        title={rawCron}
                      >
                        {rawCron}
                      </div>
                    )}
                  </div>

                  <div
                    className='mt-16px min-w-0 break-words text-t-secondary text-13px leading-20px'
                    title={job.state.nextRunAtMs ? `${t('cron.nextRun')} ${formatNextRun(job.state.nextRunAtMs)}` : '-'}
                  >
                    {job.state.nextRunAtMs ? `${t('cron.nextRun')} ${formatNextRun(job.state.nextRunAtMs)}` : '-'}
                  </div>

                  <div className='mt-14px flex items-center justify-between gap-10px'>
                    <div className='min-w-0 flex items-center gap-6px text-12px leading-18px text-t-secondary'>
                      {agentMeta.name ? (
                        <Tooltip content={agentMeta.name}>
                          <div className='flex h-16px w-16px shrink-0 items-center justify-center text-t-secondary'>
                            {agentMeta.logo ? (
                              <img
                                src={agentMeta.logo}
                                alt={agentMeta.name}
                                className='h-16px w-16px shrink-0 rounded-50%'
                              />
                            ) : (
                              <span className='flex h-16px w-16px items-center justify-center rounded-50% text-10px font-medium text-t-secondary'>
                                {agentMeta.name.slice(0, 1)}
                              </span>
                            )}
                          </div>
                        </Tooltip>
                      ) : null}
                      <span className='min-w-0 truncate'>{executionModeLabel}</span>
                    </div>

                    <div className='shrink-0' onClick={(e) => e.stopPropagation()}>
                      {!isManualOnly && (
                        <Switch size='small' checked={job.enabled} onChange={() => handleToggleEnabled(job)} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <CreateTaskDialog
          visible={createDialogVisible}
          onClose={() => {
            setCreateDialogVisible(false);
            setCreateInitialWorkflowSlug(undefined);
          }}
          initialWorkflowSlug={createInitialWorkflowSlug}
        />
      </div>
    </PageShell>
  );
};

export default ScheduledTasksPage;
