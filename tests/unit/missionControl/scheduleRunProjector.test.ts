/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { ICronJob } from '@/common/adapter/ipcBridge';
import type { TMessage } from '@/common/chat/chatLib';
import { projectScheduleRuns } from '@process/services/missionControl/ScheduleRunProjector';

const digest = (character: string): string => `sha256:${character.repeat(64)}`;

function job(state: Partial<ICronJob['state']> = {}): ICronJob {
  return {
    id: 'job-1',
    name: 'Daily report',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 9 * * *', description: 'Daily' },
    target: { payload: { kind: 'message', text: 'Report' }, executionMode: 'existing' },
    metadata: {
      conversationId: 'conversation-1',
      conversationTitle: 'Reports',
      agentType: 'wcore',
      createdBy: 'user',
      createdAt: 1,
      updatedAt: 2,
    },
    state: { runCount: 1, retryCount: 0, maxRetries: 3, ...state },
  };
}

function trigger(id: string, triggeredAt: number, cronJobId = 'job-1'): TMessage {
  return {
    id,
    msg_id: id,
    type: 'cron_trigger',
    position: 'center',
    conversation_id: 'conversation-1',
    content: { cronJobId, cronJobName: 'Daily report', triggeredAt },
    createdAt: triggeredAt,
    status: 'finish',
  };
}

function prompt(id: string, triggeredAt: number): TMessage {
  return {
    id,
    msg_id: id,
    type: 'text',
    position: 'right',
    conversation_id: 'conversation-1',
    content: {
      content: 'Run report',
      cronMeta: { source: 'cron', cronJobId: 'job-1', cronJobName: 'Daily report', triggeredAt },
    },
    createdAt: triggeredAt + 1,
    hidden: true,
    status: 'finish',
  };
}

function result(id: string, text: string, createdAt: number, msgId = id): TMessage {
  return {
    id,
    msg_id: msgId,
    type: 'text',
    position: 'left',
    conversation_id: 'conversation-1',
    content: { content: text },
    createdAt,
    status: 'finish',
  };
}

function manualPrompt(id: string, text: string, createdAt: number): TMessage {
  return {
    id,
    msg_id: id,
    type: 'text',
    position: 'right',
    conversation_id: 'conversation-1',
    content: { content: text },
    createdAt,
    status: 'finish',
  };
}

function receipt(
  id: string,
  taskId: string,
  createdAt: number,
  options: { desktopTrustStatus?: string; supersedesReceiptId?: string } = { desktopTrustStatus: 'active' }
): TMessage {
  return {
    id,
    msg_id: id,
    type: 'execution_evidence',
    position: 'left',
    conversation_id: 'conversation-1',
    content: {
      acceptedBy: 'desktop-core-v1-consumer',
      acceptedAt: createdAt,
      event: {
        type: 'anvil_receipt',
        receipt_id: `receipt-${id}`,
        event_id: `event-${id}`,
        origin: 'core/anvil',
        contract_version: '1.0',
        session_id: 'session-1',
        run_id: `run-${id}`,
        task_id: taskId,
        sequence: 3,
        artifact_digest: digest('a'),
        gate_closure_digest: digest('b'),
        receipt_body_digest: digest('c'),
        ...(options.desktopTrustStatus ? { desktop_trust_status: options.desktopTrustStatus } : {}),
        ...(options.supersedesReceiptId ? { supersedes_receipt_id: options.supersedesReceiptId } : {}),
      },
    },
    createdAt,
    hidden: true,
    status: 'finish',
  };
}

function invalidation(receiptId: string, taskId: string, createdAt: number): TMessage {
  return {
    id: `invalidate-${receiptId}`,
    msg_id: `invalidate-${receiptId}`,
    type: 'execution_evidence',
    position: 'left',
    conversation_id: 'conversation-1',
    content: {
      acceptedBy: 'desktop-core-v1-consumer',
      acceptedAt: createdAt,
      event: {
        type: 'anvil_receipt_invalidated',
        receipt_id: receiptId,
        event_id: `invalidation-${receiptId}`,
        origin: 'core/anvil',
        contract_version: '1.0',
        session_id: 'session-1',
        run_id: receiptId.replace('receipt-', 'run-'),
        task_id: taskId,
        sequence: 4,
        reason: 'artifact_mutated',
        prior_artifact_digest: digest('a'),
        invalidation_body_digest: digest('d'),
      },
    },
    createdAt,
    hidden: true,
    status: 'finish',
  };
}

function trustChanged(receiptId: string, createdAt: number): TMessage {
  return {
    id: `trust-${receiptId}`,
    msg_id: `trust-${receiptId}`,
    type: 'execution_evidence',
    position: 'left',
    conversation_id: 'conversation-1',
    content: {
      acceptedBy: 'desktop-core-v1-consumer',
      acceptedAt: createdAt,
      event: {
        type: 'anvil_trust_changed',
        receipt_ids: [receiptId],
        status: 'historical',
        reason: 'disconnected',
        requires_fresh_core_validation: true,
      },
    },
    createdAt,
    hidden: true,
    status: 'finish',
  };
}

describe('projectScheduleRuns', () => {
  it('does not let a schedule definition or model claim mint a receipt', () => {
    const claimed = job({ lastRunAtMs: 100, lastStatus: 'ok' }) as ICronJob & {
      receipt: { status: 'verified'; receiptId: string };
    };
    claimed.receipt = { status: 'verified', receiptId: 'model-claim' };
    const nestedClaim = result('nested-claim', 'Done', 102, 'p1') as TMessage & {
      content: TMessage['content'] & { receipt: { receipt_id: string; desktop_trust_status: string } };
    };
    nestedClaim.content.receipt = { receipt_id: 'imported-claim', desktop_trust_status: 'active' };

    const [run] = projectScheduleRuns(claimed, [
      {
        conversationId: 'conversation-1',
        messages: [trigger('t1', 100), prompt('p1', 100), nestedClaim],
      },
    ]);
    expect(run.result).toMatchObject({ status: 'available', summary: 'Done' });
    expect(run.receipt).toEqual({ status: 'unavailable', reason: 'no accepted receipt is correlated to this run' });
  });

  it('fails closed when result and receipt are missing', () => {
    const [run] = projectScheduleRuns(job({ lastRunAtMs: 100, lastStatus: 'ok' }), [
      { conversationId: 'conversation-1', messages: [trigger('t1', 100), prompt('p1', 100)] },
    ]);
    expect(run.result.status).toBe('unavailable');
    expect(run.receipt.status).toBe('unavailable');
    expect(run.outcome).toEqual({ status: 'available', value: 'ok', source: 'scheduler-state' });
  });

  it('does not let a later manual reply mint a scheduled result', () => {
    const [run] = projectScheduleRuns(job({ lastRunAtMs: 100, lastStatus: 'ok' }), [
      {
        conversationId: 'conversation-1',
        messages: [
          trigger('t1', 100),
          prompt('p1', 100),
          manualPrompt('manual-prompt', 'Unrelated question', 102),
          result('manual-result', 'Unrelated manual answer', 103),
        ],
      },
    ]);

    expect(run.result).toEqual({
      status: 'unavailable',
      reason: 'no persisted assistant result is correlated to this run',
    });
  });

  it('keeps the scheduled result when a later manual turn exists', () => {
    const [run] = projectScheduleRuns(job({ lastRunAtMs: 100, lastStatus: 'ok' }), [
      {
        conversationId: 'conversation-1',
        messages: [
          trigger('t1', 100),
          prompt('p1', 100),
          result('scheduled-result', 'Scheduled answer', 102, 'p1'),
          manualPrompt('manual-prompt', 'Unrelated question', 103),
          result('manual-result', 'Unrelated manual answer', 104),
        ],
      },
    ]);

    expect(run.result).toMatchObject({
      status: 'available',
      summary: 'Scheduled answer',
      messageId: 'scheduled-result',
    });
  });

  it('fails closed when more than one cron prompt claims the same run', () => {
    const [run] = projectScheduleRuns(job({ lastRunAtMs: 100, lastStatus: 'ok' }), [
      {
        conversationId: 'conversation-1',
        messages: [
          trigger('t1', 100),
          prompt('p1', 100),
          prompt('p2', 100),
          result('r1', 'Ambiguous', 103),
          receipt('ambiguous', 'p1', 104),
        ],
      },
    ]);

    expect(run.result).toEqual({
      status: 'unavailable',
      reason: 'no unique persisted cron prompt is correlated to this run',
    });
    expect(run.receipt).toEqual({
      status: 'unavailable',
      reason: 'no unique persisted cron prompt is correlated to this run',
    });
  });

  it("does not let another job's cron prompt mint this run's result", () => {
    const foreignPrompt = prompt('foreign-prompt', 100);
    foreignPrompt.content.cronMeta = {
      source: 'cron',
      cronJobId: 'job-2',
      cronJobName: 'Other job',
      triggeredAt: 100,
    };
    const [run] = projectScheduleRuns(job({ lastRunAtMs: 100, lastStatus: 'ok' }), [
      {
        conversationId: 'conversation-1',
        messages: [trigger('t1', 100), foreignPrompt, result('foreign-result', 'Other job result', 102)],
      },
    ]);

    expect(run.result).toEqual({
      status: 'unavailable',
      reason: 'no unique persisted cron prompt is correlated to this run',
    });
  });

  it("does not let an earlier concurrent cron turn's late reply mint this run's result", () => {
    const otherPrompt = prompt('job-2-prompt', 99);
    otherPrompt.msg_id = 'job-2-task';
    otherPrompt.content.cronMeta = {
      source: 'cron',
      cronJobId: 'job-2',
      cronJobName: 'Other job',
      triggeredAt: 99,
    };
    const currentPrompt = prompt('job-1-prompt', 100);
    currentPrompt.msg_id = 'job-1-task';
    const [run] = projectScheduleRuns(job({ lastRunAtMs: 100, lastStatus: 'ok' }), [
      {
        conversationId: 'conversation-1',
        messages: [
          otherPrompt,
          trigger('t1', 100),
          currentPrompt,
          result('job-2-result', 'Other job result', 102, 'job-2-task'),
        ],
      },
    ]);

    expect(run.result).toEqual({
      status: 'unavailable',
      reason: 'no persisted assistant result is correlated to this run',
    });
  });

  it('requires canonical active Desktop trust instead of an accepted envelope alone', () => {
    const base = [trigger('t1', 100), prompt('p1', 100), result('r1', 'Done', 102, 'p1')];
    const withoutTrust = projectScheduleRuns(job({ lastRunAtMs: 100, lastStatus: 'ok' }), [
      { conversationId: 'conversation-1', messages: [...base, receipt('untrusted', 'p1', 103, {})] },
    ])[0];
    const inactiveTrust = projectScheduleRuns(job({ lastRunAtMs: 100, lastStatus: 'ok' }), [
      {
        conversationId: 'conversation-1',
        messages: [...base, receipt('inactive', 'p1', 103, { desktopTrustStatus: 'historical' })],
      },
    ])[0];

    expect(withoutTrust.receipt).toEqual({
      status: 'unavailable',
      reason: 'canonical Desktop receipt trust is not active',
    });
    expect(inactiveTrust.receipt).toEqual({
      status: 'unavailable',
      reason: 'canonical Desktop receipt trust is not active',
    });
  });

  it('orders multiple runs newest-first and only correlates an exact accepted receipt', () => {
    const messages = [
      trigger('t1', 100),
      prompt('p1', 100),
      result('r1', 'First', 102, 'p1'),
      receipt('foreign', 'not-p1', 103),
      trigger('t2', 200),
      prompt('p2', 200),
      result('r2', 'Second', 202, 'p2'),
      receipt('second', 'p2', 203),
      trigger('collision', 300, 'different-job'),
    ];
    const runs = projectScheduleRuns(job({ runCount: 2, lastRunAtMs: 200, lastStatus: 'error' }), [
      { conversationId: 'conversation-1', messages },
    ]);

    expect(runs.map((run) => run.triggeredAt)).toEqual([200, 100]);
    expect(runs[0]).toMatchObject({
      outcome: { status: 'available', value: 'error' },
      result: { status: 'available', summary: 'Second' },
      receipt: { status: 'verified', receiptId: 'receipt-second', taskId: 'p2' },
      action: { path: '/conversation/conversation-1' },
    });
    expect(runs[1].outcome.status).toBe('unavailable');
    expect(runs[1].receipt).toMatchObject({ status: 'partial', receiptId: 'receipt-foreign' });
  });

  it('does not assign an older scheduler outcome to a newer in-flight trigger', () => {
    const runs = projectScheduleRuns(job({ runCount: 2, lastRunAtMs: 150, lastStatus: 'ok' }), [
      {
        conversationId: 'conversation-1',
        messages: [trigger('t1', 100), prompt('p1', 100), trigger('t2', 200), prompt('p2', 200)],
      },
    ]);

    expect(runs.find((run) => run.triggeredAt === 200)?.outcome).toEqual({
      status: 'unavailable',
      reason: 'per-run scheduler outcome is not retained',
    });
  });

  it('does not back-attribute newer scheduler state when its trigger is missing', () => {
    const [run] = projectScheduleRuns(job({ runCount: 2, lastRunAtMs: 200, lastStatus: 'error' }), [
      {
        conversationId: 'conversation-1',
        messages: [trigger('t1', 100), prompt('p1', 100), result('r1', 'Successful older result', 102, 'p1')],
      },
    ]);

    expect(run.triggeredAt).toBe(100);
    expect(run.outcome).toEqual({
      status: 'unavailable',
      reason: 'per-run scheduler outcome is not retained',
    });
    expect(run.result).toMatchObject({ status: 'available', summary: 'Successful older result' });
  });

  it('keeps a mismatched-origin trigger out of the job run list', () => {
    const runs = projectScheduleRuns(job(), [
      { conversationId: 'conversation-1', messages: [trigger('other', 100, 'core:workflow:job-1')] },
    ]);
    expect(runs).toEqual([]);
  });

  it('applies late invalidation and reconnect revocation across later run boundaries', () => {
    const runA = [
      trigger('t1', 100),
      prompt('p1', 100),
      result('r1', 'First', 102, 'p1'),
      receipt('first', 'p1', 103),
      trigger('t2', 200),
      prompt('p2', 200),
      invalidation('receipt-first', 'p1', 201),
    ];
    const invalidated = projectScheduleRuns(job({ runCount: 2, lastRunAtMs: 200, lastStatus: 'ok' }), [
      { conversationId: 'conversation-1', messages: runA },
    ]).find((run) => run.triggeredAt === 100);
    const reconnected = projectScheduleRuns(job({ runCount: 2, lastRunAtMs: 200, lastStatus: 'ok' }), [
      {
        conversationId: 'conversation-1',
        messages: [
          ...runA.filter((message) => message.type !== 'execution_evidence' || !message.id.startsWith('invalidate-')),
          trustChanged('receipt-first', 202),
        ],
      },
    ]).find((run) => run.triggeredAt === 100);

    expect(invalidated?.receipt).toMatchObject({ status: 'unavailable' });
    expect(reconnected?.receipt).toMatchObject({ status: 'unavailable' });
  });

  it('downgrades a receipt superseded by later accepted Core evidence', () => {
    const runs = projectScheduleRuns(job({ runCount: 2, lastRunAtMs: 200, lastStatus: 'ok' }), [
      {
        conversationId: 'conversation-1',
        messages: [
          trigger('t1', 100),
          prompt('p1', 100),
          result('r1', 'First', 102, 'p1'),
          receipt('first', 'p1', 103),
          trigger('t2', 200),
          prompt('p2', 200),
          receipt('second', 'p2', 203, {
            desktopTrustStatus: 'active',
            supersedesReceiptId: 'receipt-first',
          }),
        ],
      },
    ]);

    expect(runs.find((run) => run.triggeredAt === 100)?.receipt).toEqual({
      status: 'unavailable',
      reason: 'the correlated receipt was superseded',
    });
    expect(runs.find((run) => run.triggeredAt === 200)?.receipt).toMatchObject({
      status: 'verified',
      receiptId: 'receipt-second',
    });
  });
});
