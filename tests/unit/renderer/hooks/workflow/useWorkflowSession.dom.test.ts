/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkflowSession } from '@/common/types/workflowTypes';

const findAllActiveMock = vi.fn();
const updateSessionStateMock = vi.fn();
const dispatchAutonomousStepMock = vi.fn();
const sendMessageMock = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    workflow: {
      findAllActive: { invoke: (...a: unknown[]) => findAllActiveMock(...a) },
      updateSessionState: { invoke: (...a: unknown[]) => updateSessionStateMock(...a) },
      dispatchAutonomousStep: { invoke: (...a: unknown[]) => dispatchAutonomousStepMock(...a) },
    },
    conversation: {
      sendMessage: { invoke: (...a: unknown[]) => sendMessageMock(...a) },
    },
  },
}));

import { useWorkflowSession } from '@/renderer/hooks/workflow/useWorkflowSession';

const makeSession = (overrides: Partial<WorkflowSession> = {}): WorkflowSession => ({
  id: 'wf-1',
  workflow_name: 'shipping-checklist',
  workflow_title: 'Shipping Checklist',
  conversation_id: 'conv-1',
  current_step: 1,
  total_steps: 3,
  steps: [
    {
      n: 1,
      title: 'Step 1',
      body_excerpt: 'do thing',
      status: 'now',
      started_at: 1000,
      completed_at: null,
      eta_seconds: null,
      eta_source: null,
      autonomous_run: null,
    },
    {
      n: 2,
      title: 'Step 2',
      body_excerpt: 'next thing',
      status: 'todo',
      started_at: null,
      completed_at: null,
      eta_seconds: null,
      eta_source: null,
      autonomous_run: null,
    },
    {
      n: 3,
      title: 'Step 3',
      body_excerpt: 'last thing',
      status: 'todo',
      started_at: null,
      completed_at: null,
      eta_seconds: null,
      eta_source: null,
      autonomous_run: null,
    },
  ],
  skills: [],
  asks: [],
  status: 'active',
  palette: null,
  category: null,
  created_at: 1000,
  updated_at: 1000,
  completed_at: null,
  ...overrides,
});

beforeEach(() => {
  findAllActiveMock.mockReset();
  updateSessionStateMock.mockReset();
  dispatchAutonomousStepMock.mockReset();
  sendMessageMock.mockReset();
  sendMessageMock.mockResolvedValue({ success: true });
});

describe('useWorkflowSession', () => {
  it('returns loading=false / data=null when sessionId is undefined and never calls IPC', () => {
    const { result } = renderHook(() => useWorkflowSession(undefined));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isActive()).toBe(false);
    expect(findAllActiveMock).not.toHaveBeenCalled();
  });

  it('seeds state from initialSession without any IPC fetch', async () => {
    const seed = makeSession();
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    expect(result.current.data).toEqual(seed);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isActive()).toBe(true);
    expect(findAllActiveMock).not.toHaveBeenCalled();
  });

  it('refresh() fetches via findAllActive and filters to the matching sessionId', async () => {
    const seed = makeSession();
    const updated = makeSession({ current_step: 2, updated_at: 2000 });
    findAllActiveMock.mockResolvedValue({
      sessions: [
        { session: makeSession({ id: 'other' }), conversation_preview: 'x' },
        { session: updated, conversation_preview: 'y' },
      ],
    });
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    await act(async () => {
      await result.current.refresh();
    });
    expect(findAllActiveMock).toHaveBeenCalledTimes(1);
    expect(result.current.data?.current_step).toBe(2);
    expect(result.current.data?.updated_at).toBe(2000);
  });

  it('refresh() with no matching session leaves data untouched', async () => {
    const seed = makeSession();
    findAllActiveMock.mockResolvedValue({
      sessions: [{ session: makeSession({ id: 'someone-else' }), conversation_preview: 'x' }],
    });
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.data).toEqual(seed);
  });

  it('fetches initial state via findAllActive when sessionId provided without seed', async () => {
    const fetched = makeSession();
    findAllActiveMock.mockResolvedValue({
      sessions: [{ session: fetched, conversation_preview: '' }],
    });
    const { result } = renderHook(() => useWorkflowSession('wf-1'));
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data?.id).toBe('wf-1');
    expect(findAllActiveMock).toHaveBeenCalledTimes(1);
  });

  it('applyStepMarker() calls updateSessionState and replaces data with the response session', async () => {
    const seed = makeSession();
    const next = makeSession({
      current_step: 2,
      steps: seed.steps.map((s) => (s.n === 1 ? { ...s, status: 'done' as const } : s)),
    });
    updateSessionStateMock.mockResolvedValue({ session: next });
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    await act(async () => {
      await result.current.applyStepMarker(1, 'done', 'worker');
    });
    expect(updateSessionStateMock).toHaveBeenCalledWith({
      sessionId: 'wf-1',
      patch: expect.objectContaining({
        setStepStatus: expect.objectContaining({ n: 1, status: 'done' }),
      }),
    });
    expect(result.current.data?.steps[0]?.status).toBe('done');
  });

  it('jumpToStep() applies a step marker as "now" with source="user" and sends the jump message', async () => {
    const seed = makeSession();
    const next = makeSession({
      steps: seed.steps.map((s) => ({ ...s, status: s.n === 2 ? 'now' : s.status })),
    });
    updateSessionStateMock.mockResolvedValue({ session: next });
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    await act(async () => {
      await result.current.jumpToStep(2);
    });
    expect(updateSessionStateMock).toHaveBeenCalledWith({
      sessionId: 'wf-1',
      patch: expect.objectContaining({
        setStepStatus: expect.objectContaining({ n: 2, status: 'now' }),
      }),
    });
    // sendMessage is best-effort - it should be invoked with the conversation_id from data.
    expect(sendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: 'conv-1',
        input: expect.stringMatching(/now do step 2/i),
      })
    );
  });

  it('answerAsk() routes to updateSessionState with the answerAsk patch and updates data', async () => {
    const seed = makeSession();
    const next = makeSession({ updated_at: 9999 });
    updateSessionStateMock.mockResolvedValue({ session: next });
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    await act(async () => {
      await result.current.answerAsk('ask-123', 'yes please');
    });
    expect(updateSessionStateMock).toHaveBeenCalledWith({
      sessionId: 'wf-1',
      patch: expect.objectContaining({
        answerAsk: expect.objectContaining({ askId: 'ask-123', answer: 'yes please' }),
      }),
    });
    expect(result.current.data?.updated_at).toBe(9999);
  });

  it('markBeginSent() persists setBeginSent and hydrates data so subsequent reads see the new begin_sent_at', async () => {
    const seed = makeSession({ begin_sent_at: null });
    const stamped = makeSession({ begin_sent_at: 4_444_444_444 });
    updateSessionStateMock.mockResolvedValue({ session: stamped });
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    let returned: ReturnType<typeof useWorkflowSession>['data'] = null;
    await act(async () => {
      returned = await result.current.markBeginSent(4_444_444_444);
    });
    expect(updateSessionStateMock).toHaveBeenCalledWith({
      sessionId: 'wf-1',
      patch: { setBeginSent: 4_444_444_444 },
    });
    // Synchronous hydration - closes the Strict-Mode race that Audit A flagged:
    // the returned promise resolves with the new session AND the hook's
    // local data reflects it before the next effect can re-enter.
    expect(returned?.begin_sent_at).toBe(4_444_444_444);
    expect(result.current.data?.begin_sent_at).toBe(4_444_444_444);
  });

  it('markBeginSent() default `at` parameter falls through to Date.now()', async () => {
    const seed = makeSession({ begin_sent_at: null });
    updateSessionStateMock.mockResolvedValue({ session: seed });
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    await act(async () => {
      await result.current.markBeginSent();
    });
    const call = updateSessionStateMock.mock.calls[0][0] as {
      patch: { setBeginSent: number };
    };
    expect(typeof call.patch.setBeginSent).toBe('number');
    expect(call.patch.setBeginSent).toBeGreaterThan(0);
  });

  it('end() sends setSessionStatus=ended via updateSessionState', async () => {
    const seed = makeSession();
    const ended = makeSession({ status: 'ended' });
    updateSessionStateMock.mockResolvedValue({ session: ended });
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    await act(async () => {
      await result.current.end();
    });
    expect(updateSessionStateMock).toHaveBeenCalledWith({
      sessionId: 'wf-1',
      patch: { setSessionStatus: 'ended' },
    });
    expect(result.current.data?.status).toBe('ended');
    expect(result.current.isActive()).toBe(false);
  });

  it('runStepAutonomously() calls dispatchAutonomousStep and returns the dispatchId', async () => {
    const seed = makeSession();
    dispatchAutonomousStepMock.mockResolvedValue({ dispatchId: 'disp-77' });
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    let out: { dispatchId: string } | undefined;
    await act(async () => {
      out = await result.current.runStepAutonomously(2);
    });
    expect(out).toEqual({ dispatchId: 'disp-77' });
    expect(dispatchAutonomousStepMock).toHaveBeenCalledWith({ sessionId: 'wf-1', stepN: 2 });
  });

  it('runStepAutonomously() surfaces the IPC error when W5 stub throws', async () => {
    const seed = makeSession();
    dispatchAutonomousStepMock.mockRejectedValue(new Error('not yet implemented'));
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    await expect(
      act(async () => {
        await result.current.runStepAutonomously(2);
      })
    ).rejects.toThrow(/not yet implemented/);
  });

  it('error from refresh is exposed via the error field and clears loading', async () => {
    const seed = makeSession();
    findAllActiveMock.mockRejectedValue(new Error('ipc down'));
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toMatch(/ipc down/);
    expect(result.current.loading).toBe(false);
  });

  it('pause()/resume() do not call any IPC (local-only)', async () => {
    const seed = makeSession();
    const { result } = renderHook(() => useWorkflowSession('wf-1', seed));
    act(() => {
      result.current.pause();
    });
    act(() => {
      result.current.resume();
    });
    expect(updateSessionStateMock).not.toHaveBeenCalled();
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(findAllActiveMock).not.toHaveBeenCalled();
  });

  it('isActive() is true for status=errored and false for status=complete/ended', () => {
    const { result: errored } = renderHook(() => useWorkflowSession('wf-1', makeSession({ status: 'errored' })));
    expect(errored.current.isActive()).toBe(true);

    const { result: complete } = renderHook(() => useWorkflowSession('wf-1', makeSession({ status: 'complete' })));
    expect(complete.current.isActive()).toBe(false);

    const { result: ended } = renderHook(() => useWorkflowSession('wf-1', makeSession({ status: 'ended' })));
    expect(ended.current.isActive()).toBe(false);
  });

  it('mutations no-op when sessionId is undefined', async () => {
    const { result } = renderHook(() => useWorkflowSession(undefined));
    await act(async () => {
      await result.current.applyStepMarker(1, 'done');
      await result.current.answerAsk('a', 'b');
      await result.current.end();
      await result.current.refresh();
      await result.current.jumpToStep(1);
    });
    expect(updateSessionStateMock).not.toHaveBeenCalled();
    expect(findAllActiveMock).not.toHaveBeenCalled();
    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});
