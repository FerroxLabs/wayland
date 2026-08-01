/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { createExecutionHandoff } from '@/common/execution';

const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;

describe('provider handoff contract', () => {
  it('records WCore to ACP continuity, capability delta, losses, and unresolved side effects', () => {
    const handoff = createExecutionHandoff({
      id: 'handoff-1',
      identity,
      from: 'wcore',
      to: 'acp',
      checkpoint: 'checkpoint-7',
      preserved: ['project', 'workspace', 'outcomes', 'receipts', 'project'],
      lost: ['backend-session', 'in-flight-plan'],
      capabilityAdded: ['native-cli-tools'],
      capabilityRemoved: ['wcore-scheduler'],
      unresolvedSideEffects: ['email-send:unknown', 'email-send:unknown'],
      receiptId: 'receipt-handoff-1',
    });
    expect(handoff.preserved).toEqual(['outcomes', 'project', 'receipts', 'workspace']);
    expect(handoff.unresolvedSideEffects).toEqual(['email-send:unknown']);
    expect(handoff.requiresFreshRun).toBe(true);
  });

  it('requires a fresh run for ACP to WCore even when no side effect is unresolved', () => {
    const handoff = createExecutionHandoff({
      id: 'handoff-2',
      identity,
      from: 'acp',
      to: 'wcore',
      checkpoint: 'checkpoint-8',
      preserved: ['project', 'workspace'],
      lost: [],
      capabilityAdded: ['scheduler'],
      capabilityRemoved: ['native-cli-session'],
      unresolvedSideEffects: [],
      receiptId: 'receipt-handoff-2',
    });
    expect(handoff.requiresFreshRun).toBe(true);
  });
});
