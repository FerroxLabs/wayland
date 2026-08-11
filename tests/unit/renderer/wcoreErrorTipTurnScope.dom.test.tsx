/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A successful turn must not erase the error tips of OTHER, older turns.
 *
 * `clearErrorTips` filtered every error tip in the conversation, so one good
 * turn silently deleted the only explanation earlier failed turns had left
 * behind. Seen live: a chat with a failed turn part-way up scrolled clean the
 * moment the next request worked.
 *
 * The scoping key is `msg_id`, established by execution rather than assumed:
 * `transformMessage` stamps an error tip with the emitting frame's `msg_id`
 * (chatLib.ts, case 'error'), and the `finish` frame that ends the turn carries
 * the same `msg_id`. A probe of this exact harness showed the turn-1 tip in the
 * list as `msg_id: 'turn-1'` after turn 1, and gone after turn 2 finished.
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { MessageListProvider, useMessageList } from '@/renderer/pages/conversation/Messages/hooks';
import { useWCoreMessage } from '@/renderer/pages/conversation/platforms/wcore/useWCoreMessage';

let streamHandler: ((message: IResponseMessage) => void) | null = null;

vi.mock('@/renderer/services/i18n', () => ({ default: { t: (key: string) => key } }));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      get: { invoke: vi.fn().mockResolvedValue({ status: 'running', type: 'wcore' }) },
      update: { invoke: vi.fn().mockResolvedValue(true) },
      responseStream: {
        on: (handler: (message: IResponseMessage) => void) => {
          streamHandler = handler;
          return () => {
            streamHandler = null;
          };
        },
      },
    },
    database: { getConversationMessages: { invoke: vi.fn().mockResolvedValue([]) } },
  },
}));

const CONV = 'conv-scope';

type RenderedMessage = {
  type: string;
  msg_id?: string;
  content?: { type?: string; content?: string };
};

const Harness = () => {
  useWCoreMessage(CONV);
  const messages = useMessageList();
  return <pre data-testid='messages'>{JSON.stringify(messages)}</pre>;
};

const renderHarness = () =>
  render(
    <MessageListProvider value={[]}>
      <Harness />
    </MessageListProvider>
  );

const emit = (message: Partial<IResponseMessage> & { type: string }) => {
  act(() => {
    streamHandler?.({ conversation_id: CONV, ...message } as IResponseMessage);
  });
};

const readList = (): RenderedMessage[] => JSON.parse(screen.getByTestId('messages').textContent ?? '[]');

const errorTips = (list: RenderedMessage[]) => list.filter((m) => m.type === 'tips' && m.content?.type === 'error');

/** Let the deferred clear (a macrotask) and the batched flush both settle. */
const settle = () => act(async () => void (await new Promise((resolve) => setTimeout(resolve, 50))));

describe('error tips are scoped to the turn that is ending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamHandler = null;
  });

  it('keeps an older failed turn error while clearing the current turn transient', async () => {
    renderHarness();
    await waitFor(() => expect(streamHandler).toBeTypeOf('function'));

    // Turn 1 fails outright and leaves the only explanation the user will get.
    emit({ type: 'start', msg_id: 'turn-1', data: null });
    emit({ type: 'error', msg_id: 'turn-1', data: 'Turn one failed: provider returned 400' });
    emit({ type: 'finish', msg_id: 'turn-1', data: { finish_reason: 'error' } });
    await settle();
    expect(errorTips(readList())).toHaveLength(1);

    // Turn 2 hits a non-fatal mid-turn diagnostic, recovers, and succeeds.
    emit({ type: 'start', msg_id: 'turn-2', data: null });
    emit({ type: 'error', msg_id: 'turn-2', data: 'Cache full miss: TtlExpiry' });
    emit({ type: 'content', msg_id: 'turn-2', data: 'All good now.' });
    emit({ type: 'finish', msg_id: 'turn-2', data: { finish_reason: 'stop' } });
    await settle();

    const list = readList();
    // Turn 2's own transient tip is gone...
    expect(list.some((m) => m.content?.content === 'Cache full miss: TtlExpiry')).toBe(false);
    // ...and turn 1's failure explanation survived.
    const survivors = errorTips(list);
    expect(survivors).toHaveLength(1);
    expect(survivors[0].msg_id).toBe('turn-1');
    expect(survivors[0].content?.content).toContain('provider returned 400');
    // The successful reply is still there.
    expect(list.some((m) => m.type === 'text' && m.content?.content === 'All good now.')).toBe(true);
  });

  it('still clears an error the same turn recovered from, so nothing lingers', async () => {
    // The engine retries inside one turn: the error frame and the finish frame
    // share a msg_id, so the transient tip is cleared by the turn that owns it.
    renderHarness();
    await waitFor(() => expect(streamHandler).toBeTypeOf('function'));

    emit({ type: 'start', msg_id: 'turn-1', data: null });
    emit({ type: 'error', msg_id: 'turn-1', data: 'Cache full miss: TtlExpiry' });
    emit({ type: 'content', msg_id: 'turn-1', data: 'Recovered answer.' });
    emit({ type: 'finish', msg_id: 'turn-1', data: { finish_reason: 'stop' } });
    await settle();

    expect(errorTips(readList())).toHaveLength(0);
  });

  it('leaves an out-of-band notice alone: it belongs to no turn', async () => {
    // A missed scheduled run posts a `tips` row that is not model output. It
    // must never be swept up by a turn ending.
    renderHarness();
    await waitFor(() => expect(streamHandler).toBeTypeOf('function'));

    emit({
      type: 'tips',
      msg_id: 'notice-1',
      data: { content: 'Scheduled task "Morning digest" was not executed.', type: 'warning' },
    });
    emit({ type: 'start', msg_id: 'turn-1', data: null });
    emit({ type: 'content', msg_id: 'turn-1', data: 'Answer.' });
    emit({ type: 'finish', msg_id: 'turn-1', data: { finish_reason: 'stop' } });
    await settle();

    const list = readList();
    expect(list.some((m) => m.type === 'tips' && m.content?.content?.includes('Morning digest'))).toBe(true);
  });
});
