/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * K-03 Task 1 - the permanent UI-layer proof for TRN-03: a turn with no
 * assistant text at all (no `text_delta`, no `tool_group`, no `thought`
 * between `start` and `finish`) still clears `useWCoreMessage`'s combined
 * `running` state the instant its `finish` frame arrives.
 *
 * This was ALREADY GREEN at the time this test was written - it is not the
 * defect (the defect is transport-layer buffering proven by
 * `desktopContractV1.test.ts`'s new K-03 cases and
 * `streamEndUnterminatedLine.test.ts`'s real-process proof). It is committed
 * here as a permanent "preserve and prove" regression guard for the UI-layer
 * link in the chain (`useWCoreMessage` -> `OrbitThinking`'s elapsed-time
 * badge), mirroring `wcoreFinishReconcile.dom.test.tsx`'s mocking shape but
 * asserting on `result.current.running` directly, which that file never
 * does.
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

describe('useWCoreMessage running state on a content-free finish (K-03 / TRN-03)', () => {
  beforeEach(() => {
    streamHandler = null;
    addOrUpdateMessage.mockClear();
  });

  it('transitions running true -> false on finish with no intervening content/tool/thought frame', () => {
    const { result } = renderHook(() => useWCoreMessage(CONV));
    expect(streamHandler).toBeTruthy();
    expect(result.current.running).toBe(false);

    emit({ type: 'start', data: {} });
    expect(result.current.running).toBe(true);

    // No text_delta, no tool_group, no thought - the literal "no assistant
    // text" repro.
    emit({ type: 'finish', data: { finish_reason: 'stop' } });
    expect(result.current.running).toBe(false);
  });

  it('also clears running on a content-free finish that ends via finish_reason: error', () => {
    const { result } = renderHook(() => useWCoreMessage(CONV));

    emit({ type: 'start', data: {} });
    expect(result.current.running).toBe(true);

    emit({ type: 'finish', data: { finish_reason: 'error' } });
    expect(result.current.running).toBe(false);
  });
});
