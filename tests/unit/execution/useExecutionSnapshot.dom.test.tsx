/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TMessage } from '@/common/chat/chatLib';
import type { ExecutionEvent, ExecutionSeed } from '@/common/execution';
import { useBackendExecutionSnapshot, useExecutionSnapshot } from '@/renderer/hooks/execution/useExecutionSnapshot';

const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const now = 1_000;
const seed: ExecutionSeed = {
  identity,
  actor: { backend: 'wcore', agentId: 'core' },
  scope: { workspaceId: 'workspace-1', host: 'desktop', trust: 'trusted', scheduled: false },
  requestedGovernance: { mode: 'ask', enforceability: 'advisory' },
};

describe('execution renderer hook', () => {
  it('consumes canonical execution events', () => {
    const events: ExecutionEvent[] = [
      {
        eventId: 'running-1',
        sequence: 0,
        identity,
        observedAt: now,
        type: 'lifecycle',
        lifecycle: 'running',
      },
    ];
    const { result } = renderHook(() => useExecutionSnapshot(seed, events, { now }));
    expect(result.current.lifecycle).toBe('running');
    expect(result.current.integrity.status).toBe('valid');
  });

  it('routes backend messages through the canonical adapter and reducer', () => {
    const messages = [
      {
        id: 'activity-1',
        conversation_id: 'conversation-1',
        type: 'activity',
        content: { turnId: 'turn-1', status: 'running', nodes: [] },
        createdAt: now,
      },
    ] as TMessage[];
    const { result } = renderHook(() => useBackendExecutionSnapshot('wcore', seed, messages, { now }));
    expect(result.current.lifecycle).toBe('running');
  });
});
