/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';

const mockFastAckInvoke = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      fastAck: { invoke: (...args: unknown[]) => mockFastAckInvoke(...args) },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { useFastAck } from '@/renderer/pages/conversation/platforms/wcore/useFastAck';
import {
  ACK_CLEAR_EVENT,
  ackMsgId,
  type AckClearDetail,
} from '@/renderer/pages/conversation/platforms/wcore/ackEvents';
import {
  MessageListProvider,
  useMessageList,
} from '@/renderer/pages/conversation/Messages/hooks';
import type { TMessage } from '@/common/chat/chatLib';

const CONVO = 'c1';
const MSG = 'm1';

let captured: TMessage[] = [];
let fire: (prompt: string, msgId: string) => void = () => {};

const Probe: React.FC = () => {
  const { fireAck } = useFastAck(CONVO);
  const list = useMessageList();
  captured = list;
  fire = fireAck;
  return null;
};

const renderProbe = () =>
  render(
    <MessageListProvider value={[]}>
      <Probe />
    </MessageListProvider>
  );

const dispatchClear = (detail: AckClearDetail) =>
  window.dispatchEvent(new CustomEvent<AckClearDetail>(ACK_CLEAR_EVENT, { detail }));

/** A promise plus its resolver, so a test can resolve the ack on demand. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useFastAck', () => {
  beforeEach(() => {
    mockFastAckInvoke.mockReset();
    captured = [];
  });

  it('inserts a transient ack bubble when the ack resolves before the main response starts', async () => {
    mockFastAckInvoke.mockResolvedValue({ success: true, data: { text: 'Scanning the auth module first.' } });
    renderProbe();

    await act(async () => {
      fire('Refactor auth', MSG);
    });

    await waitFor(() => {
      const ack = captured.find((m) => m.msg_id === ackMsgId(MSG));
      expect(ack).toBeTruthy();
      expect(ack?.position).toBe('left');
      expect((ack as { content: { content: string } }).content.content).toContain(
        'Scanning the auth module first.'
      );
    });
  });

  it('does NOT insert when the turn was cleared before the ack resolved (race guard)', async () => {
    const ack = deferred<unknown>();
    mockFastAckInvoke.mockReturnValue(ack.promise);
    renderProbe();

    await act(async () => {
      fire('Refactor auth', MSG);
    });
    // Main response starts (clear) BEFORE the ack resolves.
    act(() => {
      dispatchClear({ conversationId: CONVO, msgId: MSG });
    });
    await act(async () => {
      ack.resolve({ success: true, data: { text: 'Too late take.' } });
    });

    // Give the message-list flush a tick, then assert nothing was inserted.
    await new Promise((r) => setTimeout(r, 20));
    expect(captured.find((m) => m.msg_id === ackMsgId(MSG))).toBeUndefined();
  });

  it('removes the transient bubble on ACK_CLEAR_EVENT', async () => {
    mockFastAckInvoke.mockResolvedValue({ success: true, data: { text: 'Here is the plan.' } });
    renderProbe();

    await act(async () => {
      fire('Refactor auth', MSG);
    });
    await waitFor(() => {
      expect(captured.find((m) => m.msg_id === ackMsgId(MSG))).toBeTruthy();
    });

    act(() => {
      dispatchClear({ conversationId: CONVO, msgId: MSG });
    });
    await waitFor(() => {
      expect(captured.find((m) => m.msg_id === ackMsgId(MSG))).toBeUndefined();
    });
  });

  it('shows nothing when the ack returns empty text', async () => {
    mockFastAckInvoke.mockResolvedValue({ success: true, data: { text: '' } });
    renderProbe();

    await act(async () => {
      fire('Refactor auth', MSG);
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(captured.find((m) => m.msg_id === ackMsgId(MSG))).toBeUndefined();
  });
});
