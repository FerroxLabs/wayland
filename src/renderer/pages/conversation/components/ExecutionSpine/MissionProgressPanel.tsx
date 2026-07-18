/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { selectCanonicalRunSnapshot } from '@/common/execution';
import { Progress, Tag, Typography } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

type CanonicalRun = ReturnType<typeof selectCanonicalRunSnapshot>;

const statusColor = (status: string): 'green' | 'red' | 'orange' | 'blue' | 'gray' => {
  if (status === 'completed' || status === 'authoritative') return 'green';
  if (status === 'failed' || status === 'mismatch') return 'red';
  if (status === 'waiting' || status === 'blocked' || status === 'paused') return 'orange';
  if (status === 'running') return 'blue';
  return 'gray';
};

const MissionProgressPanel: React.FC<{ run: CanonicalRun; progressLabel: string }> = ({ run, progressLabel }) => {
  const { t } = useTranslation();
  return (
    <div
      className='flex flex-1 min-h-0 flex-col px-16px py-14px overflow-y-auto'
      aria-label={t('conversation.execution.missionRail', { defaultValue: 'Mission progress' })}
      data-testid='execution-mission-rail'
      data-run-id={run.identity.runId}
    >
      <div className='flex items-center justify-between gap-8px mb-12px'>
        <Typography.Title heading={6} className='!m-0'>
          {t('conversation.execution.progress', { defaultValue: 'Progress' })}
        </Typography.Title>
        <Tag size='small' color={statusColor(run.lifecycle)}>
          {run.lifecycle}
        </Tag>
      </div>
      {run.progress.total > 0 && (
        <>
          <Progress percent={run.progress.percent} size='small' showText={false} />
          <div className='text-12px text-t-secondary mt-6px mb-12px'>{progressLabel}</div>
          <ol className='m-0 pl-18px flex flex-col gap-8px'>
            {run.plan.map((step) => (
              <li
                key={step.id}
                className={step.status === 'completed' ? 'text-t-secondary line-through' : 'text-t-primary'}
              >
                {step.content}
              </li>
            ))}
          </ol>
        </>
      )}

      {run.planHistory.length > 1 && (
        <div className='mt-16px pt-12px border-t border-border-1'>
          <div className='font-600'>{t('conversation.execution.replans', { defaultValue: 'Plan changes' })}</div>
          <div className='text-12px text-t-secondary mt-4px'>
            {t('conversation.execution.replanCount', {
              defaultValue: '{{count}} recorded revisions',
              count: run.planHistory.length,
            })}
          </div>
          {run.planHistory.map((revision) => (
            <div key={revision.id} className='text-12px mt-6px'>
              {revision.source === 'producer'
                ? t('conversation.execution.producerPlan', { defaultValue: 'Agent plan' })
                : t('conversation.execution.localPlan', { defaultValue: 'Desktop plan' })}
              {revision.reason ? ` — ${revision.reason}` : ''}
            </div>
          ))}
        </div>
      )}

      {run.outcomes.length > 0 && (
        <div className='mt-16px pt-12px border-t border-border-1'>
          <div className='font-600'>{t('conversation.execution.outputs', { defaultValue: 'Outputs' })}</div>
          {run.outcomes.map((outcome) => (
            <div key={outcome.id} className='text-12px mt-6px'>
              {outcome.label}
            </div>
          ))}
        </div>
      )}

      {run.handoffs.length > 0 && (
        <div className='mt-16px pt-12px border-t border-border-1'>
          <div className='font-600'>{t('conversation.execution.handoffs', { defaultValue: 'Handoffs' })}</div>
          {run.handoffs.map((handoff) => {
            const continuity =
              handoff.lost.length > 0 ? 'lost' : handoff.unresolvedSideEffects.length > 0 ? 'unresolved' : 'preserved';
            return (
              <div key={handoff.receiptId} className='mt-6px flex items-center justify-between gap-8px text-12px'>
                <span>
                  {handoff.from} → {handoff.to}
                </span>
                <Tag
                  size='small'
                  color={continuity === 'preserved' ? 'green' : continuity === 'lost' ? 'red' : 'orange'}
                >
                  {continuity}
                </Tag>
              </div>
            );
          })}
        </div>
      )}

      {run.costLedger.status !== 'unavailable' && (
        <div className='mt-16px pt-12px border-t border-border-1' data-testid='execution-cost-ledger'>
          <div className='flex items-center justify-between gap-8px'>
            <span className='font-600'>
              {t('conversation.execution.cost', { defaultValue: 'Receipt-backed cost' })}
            </span>
            <Tag size='small' color={statusColor(run.costLedger.status)}>
              {run.costLedger.status}
            </Tag>
          </div>
          {run.costLedger.status === 'authoritative' && (
            <div className='text-16px font-600 mt-8px'>
              {run.costLedger.currency} {run.costLedger.total?.toFixed(4)}
            </div>
          )}
          {run.costLedger.status === 'paused' && (
            <div className='text-12px text-warning mt-6px'>{run.costLedger.reason}</div>
          )}
          {run.costLedger.status === 'mismatch' && (
            <div className='text-12px text-danger mt-6px'>
              {t('conversation.execution.costMismatch', {
                defaultValue: 'Cost evidence does not reconcile. Total hidden.',
              })}
            </div>
          )}
          {run.costLedger.attempts.map((attempt) => (
            <div key={attempt.id} className='text-12px mt-6px flex justify-between gap-8px'>
              <span>
                {attempt.role} · {attempt.providerId}
              </span>
              <span>
                {attempt.currency} {attempt.amount?.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MissionProgressPanel;
