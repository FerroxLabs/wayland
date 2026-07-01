/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #486 defense-in-depth: the wcore engine can end a turn without delivering a
 * matching-callId tool completion frame (root cause wayland-core#133), leaving
 * a step-panel card stuck Executing/Confirming after the assistant already
 * responded. useWCoreMessage's `finish` handler now terminalizes any still-active
 * card. These tests drive the REAL hook through its ipcBridge responseStream
 * handler (transformMessage is real) and assert the reconcile fires only for
 * dangling cards, with the right terminal status.
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type StreamEvent = { type: string; data: unknown; msg_id: string; conversation_id: string };
let streamHandler: ((e: StreamEvent) => void) | null = null;
const addOrUpdateMessage = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: {
        on: (cb: (e: StreamEvent) => void) => {
          streamHandler = cb;
          return () => {
            streamHandler = null;
          };
        },
      },
      get: { invoke: () => Promise.resolve({ status: 'idle', type: 'wcore' }) },
      update: { invoke: () => Promise.resolve() },
    },
  },
}));

vi.mock('@/renderer/pages/conversation/Messages/hooks', () => ({
  useAddOrUpdateMessage: () => addOrUpdateMessage,
  useClearErrorTips: () => vi.fn(),
}));

vi.mock('@/renderer/hooks/system/useTabResumeEffect', () => ({
  useTabResumeEffect: () => {},
}));

vi.mock('@/renderer/services/i18n', () => ({
  default: { t: (key: string) => key },
}));

import { useWCoreMessage } from '@/renderer/pages/conversation/platforms/wcore/useWCoreMessage';

const CONV = 'conv1';
const emit = (e: Partial<StreamEvent> & { type: string }) =>
  act(() => {
    streamHandler?.({ msg_id: 'm1', conversation_id: CONV, data: {}, ...e });
  });

const toolCard = (callId: string, status: string, name = 'read_file') => ({
  callId,
  name,
  description: '',
  status,
  renderOutputAsMarkdown: false,
});

// Pull the tool_group updates the hook pushed to the message list.
const toolGroupCalls = () =>
  addOrUpdateMessage.mock.calls
    .map(([m]) => m)
    .filter(
      (m): m is { type: 'tool_group'; content: Array<{ callId: string; status: string }> } => m?.type === 'tool_group'
    );

describe('useWCoreMessage finish-time tool reconcile (#486)', () => {
  beforeEach(() => {
    streamHandler = null;
    addOrUpdateMessage.mockClear();
  });

  it('terminalizes a card left Executing when the turn finishes cleanly', () => {
    renderHook(() => useWCoreMessage(CONV));
    expect(streamHandler).toBeTruthy();

    emit({ type: 'tool_group', data: [toolCard('c1', 'Executing')] });
    emit({ type: 'finish', data: {} });

    const groups = toolGroupCalls();
    const last = groups[groups.length - 1];
    expect(last.content[0].callId).toBe('c1');
    expect(last.content[0].status).toBe('Success');
  });

  it('marks the dangling card Error when the turn ends in error', () => {
    renderHook(() => useWCoreMessage(CONV));

    emit({ type: 'tool_group', data: [toolCard('c1', 'Executing')] });
    emit({ type: 'finish', data: { finish_reason: 'error' } });

    const last = toolGroupCalls().at(-1)!;
    expect(last.content[0].status).toBe('Error');
  });

  it('does not paint false Success on a card that never ran (Confirming/Pending -> Canceled)', () => {
    renderHook(() => useWCoreMessage(CONV));

    emit({ type: 'tool_group', data: [toolCard('c1', 'Confirming'), toolCard('c2', 'Pending')] });
    emit({ type: 'finish', data: {} });

    const last = toolGroupCalls().at(-1)!;
    const byId = Object.fromEntries(last.content.map((t) => [t.callId, t.status]));
    // clean finish, but neither tool actually executed -> Canceled, not Success
    expect(byId).toEqual({ c1: 'Canceled', c2: 'Canceled' });
  });

  it('emits a status-only update (no name) so composeMessage cannot clobber the card', () => {
    renderHook(() => useWCoreMessage(CONV));

    emit({ type: 'tool_group', data: [toolCard('c1', 'Executing', 'read_file')] });
    emit({ type: 'finish', data: {} });

    const last = toolGroupCalls().at(-1)!;
    expect(last.content[0]).toEqual({ callId: 'c1', status: 'Success' });
  });

  it('clears tracking on a new turn start so a prior dangling card cannot leak', () => {
    renderHook(() => useWCoreMessage(CONV));

    // Turn 1 leaves c1 dangling then ends via an error frame with NO finish.
    emit({ type: 'tool_group', data: [toolCard('c1', 'Executing')] });
    emit({ type: 'error', data: { error: { code: 'x', message: 'boom', retryable: false } } });
    // Turn 2 starts fresh and finishes cleanly with no tools of its own.
    emit({ type: 'start', data: {} });
    const beforeFinish = addOrUpdateMessage.mock.calls.length;
    emit({ type: 'finish', data: {} });

    // c1 must NOT be terminalized against turn 2's finish.
    expect(addOrUpdateMessage.mock.calls.length).toBe(beforeFinish);
  });

  it('does NOT re-emit for a card the engine already completed', () => {
    renderHook(() => useWCoreMessage(CONV));

    emit({ type: 'tool_group', data: [toolCard('c1', 'Executing')] });
    emit({ type: 'tool_group', data: [toolCard('c1', 'Success')] });
    const beforeFinish = addOrUpdateMessage.mock.calls.length;
    emit({ type: 'finish', data: {} });

    // finish must add no further tool_group update — the card was already terminal
    expect(addOrUpdateMessage.mock.calls.length).toBe(beforeFinish);
  });

  it('reconciles only the still-dangling card among parallel calls', () => {
    renderHook(() => useWCoreMessage(CONV));

    emit({ type: 'tool_group', data: [toolCard('c1', 'Executing', 'read_file')] });
    emit({ type: 'tool_group', data: [toolCard('c2', 'Executing', 'skill_view')] });
    emit({ type: 'tool_group', data: [toolCard('c1', 'Success', 'read_file')] });
    emit({ type: 'finish', data: {} });

    const last = toolGroupCalls().at(-1)!;
    // only c2 (never completed) is terminalized by the reconcile
    expect(last.content.map((t) => t.callId)).toEqual(['c2']);
    expect(last.content[0].status).toBe('Success');
  });
});
