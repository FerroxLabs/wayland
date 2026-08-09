/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { deriveStep as humanizeStep } from '@/common/chat/activity/activityLabels';
import type { ExecutionActivity, selectCanonicalRunSnapshot } from '@/common/execution';
import { Empty, Progress, Tag, Typography } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

type CanonicalRun = ReturnType<typeof selectCanonicalRunSnapshot>;

/**
 * Reuse the chat timeline's humanizer so a step reads the same in both places
 * ("Running printf 'ok'", not "Bash") - which holds only because the humanizer
 * builds from the invocation; a cross-audit caught the two diverging when it
 * built from output instead. The canonical activity kinds are named
 * for the execution model; only two differ from the chat node's vocabulary, and
 * an unmapped kind falls through to the rule list on name + detail, which is
 * the same treatment an ordinary tool gets.
 */
const CHAT_KIND: Partial<Record<ExecutionActivity['kind'], 'sub_agent' | 'cua'>> = {
  'sub-agent': 'sub_agent',
  computer: 'cua',
};

const deriveStep = (activity: ExecutionActivity): { label: string } =>
  humanizeStep({
    kind: CHAT_KIND[activity.kind] ?? (activity.kind === 'thinking' ? 'thinking' : 'tool'),
    name: activity.name,
    detail: activity.detail,
    ...(activity.command ? { command: activity.command } : {}),
  });

const dotColor = (status: ExecutionActivity['status']): string => {
  if (status === 'completed') return 'bg-success';
  if (status === 'failed') return 'bg-danger';
  if (status === 'running') return 'bg-primary';
  return 'bg-fill-3';
};

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
          {t(`conversation.execution.lifecycle.${run.lifecycle}`, { defaultValue: run.lifecycle })}
        </Tag>
      </div>
      {run.progress.total > 0 && (
        <>
          <Progress percent={run.progress.percent} size='small' showText={false} />
          <div className='text-12px text-t-secondary mt-6px mb-12px'>{progressLabel}</div>
          {/*
           * Numbered markers, not a bare `list-style: decimal`. The step text
           * wraps to two and three lines constantly, and a browser marker sits
           * on the FIRST line with the continuation running back underneath it,
           * so a wrapped list stops reading as a list at all. A fixed-width
           * numeral in its own column keeps the left edge of the text straight
           * however far it wraps, which is the whole reason the numbers are
           * there.
           */}
          <ol className='m-0 p-0 list-none flex flex-col gap-8px'>
            {run.plan.map((step, index) => (
              <li key={step.id} className='flex items-start gap-8px'>
                <span
                  className={`mt-1px shrink-0 w-18px h-18px rounded-full flex items-center justify-center text-11px tabular-nums ${
                    step.status === 'completed' ? 'bg-fill-2 text-t-tertiary' : 'bg-fill-3 text-t-secondary'
                  }`}
                  aria-hidden='true'
                >
                  {index + 1}
                </span>
                <span className={step.status === 'completed' ? 'text-t-secondary line-through' : 'text-t-primary'}>
                  {step.content}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      {/*
       * A panel that renders nothing reads as broken rather than as idle. The
       * workspace file list already answers this with Arco's Empty - a faded
       * illustration, a title and a line saying what will appear here - so this
       * uses the same one rather than inventing a second empty language.
       */}
      {run.progress.total === 0 && run.activities.length === 0 && (
        <div className='flex-1 flex items-center justify-center py-24px' data-testid='execution-mission-empty'>
          <Empty
            description={
              <div>
                <span className='text-t-secondary font-bold text-14px'>
                  {t('conversation.execution.emptyTitle', { defaultValue: 'No steps yet' })}
                </span>
                <div className='text-t-secondary text-12px'>
                  {t('conversation.execution.emptyDescription', {
                    defaultValue: 'The plan and each step taken will appear here as this task runs.',
                  })}
                </div>
              </div>
            }
          />
        </div>
      )}

      {run.activities.length > 0 && (
        <div className={run.progress.total > 0 ? 'mt-16px pt-12px border-t border-1' : ''}>
          <div className='font-600 mb-8px'>{t('conversation.execution.steps', { defaultValue: 'Steps taken' })}</div>
          <ol className='m-0 p-0 list-none flex flex-col gap-6px' data-testid='execution-mission-steps'>
            {run.activities.map((activity) => (
              <li key={activity.id} className='flex items-start gap-8px text-12px'>
                <span className={`mt-5px shrink-0 w-6px h-6px rounded-full ${dotColor(activity.status)}`} />
                <span className={activity.status === 'failed' ? 'text-danger' : 'text-t-primary'}>
                  {deriveStep(activity).label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {run.planHistory.length > 1 && (
        <div className='mt-16px pt-12px border-t border-1'>
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
        <div className='mt-16px pt-12px border-t border-1'>
          <div className='font-600'>{t('conversation.execution.outputs', { defaultValue: 'Outputs' })}</div>
          {run.outcomes.map((outcome) => (
            <div key={outcome.id} className='text-12px mt-6px'>
              {outcome.label}
            </div>
          ))}
        </div>
      )}

      {run.handoffs.length > 0 && (
        <div className='mt-16px pt-12px border-t border-1'>
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
        <div className='mt-16px pt-12px border-t border-1' data-testid='execution-cost-ledger'>
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
