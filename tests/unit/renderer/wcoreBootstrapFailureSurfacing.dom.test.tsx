/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * K-02 / DIA-01, the renderer half.
 *
 * Live-verified defect on released Core v0.12.26: when the engine refuses to
 * start, the main process does everything right - it logs the cause, calls
 * `emitStartFailure`, and emits `error` followed by `finish` on
 * `conversation.responseStream`. The chat showed the user NOTHING. Not the
 * error, not even their own message. The turn sat on "queued" forever.
 *
 * The distinguishing feature of the bootstrap-failure path, and the reason the
 * mid-turn error path looks fine while this one does not, is that there is no
 * `start` frame at all: the engine never reached `stream_start`, so the
 * renderer never entered a stream-running state that the error could clear, and
 * every guard keyed on an in-flight turn sees nothing in flight.
 *
 * These cases pin the contract the UI must honour for that sequence:
 * the error must reach the message list, and the turn must not be left running.
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type StreamEvent = { type: string; data: unknown; msg_id: string; conversation_id: string };
let streamHandler: ((e: StreamEvent) => void) | null = null;
const addOrUpdateMessage = vi.fn();
const clearErrorTips = vi.fn();

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
  useClearErrorTips: () => clearErrorTips,
}));

vi.mock('@/renderer/hooks/system/useTabResumeEffect', () => ({
  useTabResumeEffect: () => {},
}));

vi.mock('@/renderer/services/i18n', () => ({
  default: { t: (key: string) => key },
}));

import { useWCoreMessage } from '@/renderer/pages/conversation/platforms/wcore/useWCoreMessage';

const CONV = 'conv1';
const USER_MSG = 'user-msg-1';
const emit = (e: Partial<StreamEvent> & { type: string }) =>
  act(() => {
    streamHandler?.({ msg_id: USER_MSG, conversation_id: CONV, data: {}, ...e });
  });

/** Byte-for-byte the sequence `WCoreManager.emitStartFailure` emits. */
const emitStartFailureSequence = (detail: string) => {
  emit({ type: 'error', data: detail, msg_id: USER_MSG });
  emit({ type: 'finish', data: null, msg_id: 'finish-msg-1' });
};

describe('useWCoreMessage on an engine bootstrap failure (K-02 / DIA-01)', () => {
  beforeEach(() => {
    streamHandler = null;
    addOrUpdateMessage.mockClear();
    clearErrorTips.mockClear();
  });

  it('surfaces the engine failure reason to the message list even with no preceding start frame', () => {
    const onError = vi.fn();
    renderHook(() => useWCoreMessage(CONV, { onError }));
    expect(streamHandler).toBeTruthy();

    const detail =
      'Agent failed to start: wcore refused to start: storage.credentials.backend is set to "plaintext"';
    emitStartFailureSequence(detail);

    // The user has to be told. This is the whole point of K-02: an engine that
    // refuses to start must produce a visible reason, not a silent spinner.
    expect(onError).toHaveBeenCalledTimes(1);
    const rendered = addOrUpdateMessage.mock.calls.map(([m]) => JSON.stringify(m)).join('\n');
    expect(rendered).toContain('plaintext');
  });

  it('does not leave the turn running after a bootstrap failure', () => {
    const { result } = renderHook(() => useWCoreMessage(CONV));

    emitStartFailureSequence('Agent failed to start: wcore exited with code 1 during init');

    expect(result.current.running).toBe(false);
  });

  it('keeps the failure visible: a content-free failed turn must not clear its error tip', () => {
    renderHook(() => useWCoreMessage(CONV));

    emitStartFailureSequence('Agent failed to start: no API key configured');

    // clearErrorTips is gated on the turn having produced content AND not having
    // ended in error. A bootstrap failure satisfies neither, so the tip - the
    // only feedback the user gets - must survive the trailing finish frame.
    expect(clearErrorTips).not.toHaveBeenCalled();
  });
});
