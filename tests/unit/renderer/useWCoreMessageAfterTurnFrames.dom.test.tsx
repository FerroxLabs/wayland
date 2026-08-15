/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The spinner must stay off once the engine says the turn ended.
 *
 * Three frames ride out of the turn-end path AFTER `finish`: the activity
 * settle, the stripped-text correction, and the propose card. All three name
 * the turn, so any one of them counted as "the turn is talking" re-arms
 * `streamRunning` — and nothing further is coming, so it never clears again.
 *
 * `activity_turn_end` and `content_replace` were each excluded when they were
 * added. `cron_propose` was not, and it is emitted from the same function, one
 * statement above the `content_replace` that was. Reproduced live on Core
 * 0.13.0: a cron turn read "Working… 254s" minutes after the engine had logged
 * `stream_end`, and navigating away and back cleared it — the durable state was
 * already right, only the mounted view was wrong.
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
      get: { invoke: vi.fn().mockResolvedValue(null) },
      update: { invoke: vi.fn().mockResolvedValue(undefined) },
      responseStream: {
        on: (handler: (message: IResponseMessage) => void) => {
          streamHandler = handler;
          return () => {
            streamHandler = null;
          };
        },
      },
    },
    database: {
      getConversationMessages: { invoke: vi.fn().mockResolvedValue([]) },
    },
  },
}));

const CONV = 'conv-after-turn';
const TURN = 'turn-1';

const Harness = () => {
  const { running } = useWCoreMessage(CONV);
  useMessageList();
  return <span data-testid='running'>{String(running)}</span>;
};

const renderHarness = () =>
  render(
    <MessageListProvider value={[]}>
      <Harness />
    </MessageListProvider>
  );

const emit = (message: IResponseMessage) =>
  act(() => {
    streamHandler?.(message);
  });

const frame = (type: string, data: unknown = ''): IResponseMessage =>
  ({ type, conversation_id: CONV, msg_id: TURN, data }) as unknown as IResponseMessage;

/** Drive a whole turn up to and including the engine's terminal frame. */
const runTurnToFinish = async () => {
  renderHarness();
  await waitFor(() => expect(streamHandler).not.toBeNull());
  emit(frame('start'));
  emit(frame('content', 'scheduling that for you'));
  emit(frame('finish'));
  await waitFor(() => expect(screen.getByTestId('running').textContent).toBe('false'));
};

describe('wcore turn end — frames that arrive after `finish`', () => {
  beforeEach(() => {
    streamHandler = null;
  });

  it('stays settled when the cron propose card arrives after the turn ended', async () => {
    await runTurnToFinish();

    emit(frame('cron_propose', { name: 'Market Summary', schedule: 'weekdays 09:00' }));

    // The regression: this flipped the spinner back on, permanently.
    expect(screen.getByTestId('running').textContent).toBe('false');
  });

  it('stays settled when the concierge propose card arrives after the turn ended', async () => {
    await runTurnToFinish();

    emit(frame('concierge_propose', { summary: 'update your defaults' }));

    expect(screen.getByTestId('running').textContent).toBe('false');
  });

  it('stays settled for the two after-turn frames that were already excluded', async () => {
    // The contrast that keeps the case above honest: if a change ever collapses
    // this list back to a single hardcoded comparison, one of these fails rather
    // than all three quietly agreeing on the wrong answer.
    await runTurnToFinish();

    emit(frame('activity_turn_end', { outcome: 'done' }));
    emit(frame('content_replace', 'scheduling that for you'));

    expect(screen.getByTestId('running').textContent).toBe('false');
  });

  it('still re-arms on real output that arrives after a premature finish', async () => {
    // The guard this fix must not break: genuine content after `finish` means
    // the turn is talking again, and the spinner has to come back.
    await runTurnToFinish();

    emit(frame('content', 'actually, one more thing'));

    expect(screen.getByTestId('running').textContent).toBe('true');
  });
});
