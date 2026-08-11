/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Two defects seen in the running app, both at the render layer, both with the
 * correct data already in the database:
 *
 *  1. An in-thread notice (the Constitution key-ring reclaim, a missed cron run)
 *     never appeared in the session that produced it. It rendered perfectly
 *     after a restart, which is the tell: the row is written, the LIVE delivery
 *     is not. Also covered here: a FATAL error tip that was deleted from the
 *     live list a moment after it appeared, because the turn's own settlement
 *     frame was counted as "the turn recovered".
 *
 *  2. Re-opening a conversation whose last turn had already failed brought the
 *     "Working the problem..." indicator and a live stop button back, forever.
 *     The engine emits session-level frames (`mcp_session_state`, `mcp_ready`)
 *     while a conversation is merely being opened, and the stream handler's
 *     catch-all treated them as turn output.
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { MessageListProvider, useMessageList } from '@/renderer/pages/conversation/Messages/hooks';
import { useWCoreMessage } from '@/renderer/pages/conversation/platforms/wcore/useWCoreMessage';

let streamHandler: ((message: IResponseMessage) => void) | null = null;
const mockConversationGetInvoke = vi.fn();
const mockConversationUpdateInvoke = vi.fn();

vi.mock('@/renderer/services/i18n', () => ({
  default: { t: (key: string) => key },
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      get: { invoke: (...args: unknown[]) => mockConversationGetInvoke(...args) },
      update: { invoke: (...args: unknown[]) => mockConversationUpdateInvoke(...args) },
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

const CONV = 'conv-notice';
const TURN = 'turn-1';

type ListItem = { type: string; msg_id?: string; content?: { type?: string; content?: string } };

const Harness = () => {
  const { running } = useWCoreMessage(CONV);
  const messages = useMessageList();
  return (
    <div>
      <pre data-testid='messages'>{JSON.stringify(messages)}</pre>
      <span data-testid='running'>{String(running)}</span>
    </div>
  );
};

const renderHarness = () =>
  render(
    <MessageListProvider value={[]}>
      <Harness />
    </MessageListProvider>
  );

const emit = (message: IResponseMessage) => {
  act(() => {
    streamHandler?.(message);
  });
};

const list = (): ListItem[] => JSON.parse(screen.getByTestId('messages').textContent ?? '[]') as ListItem[];

/** The shape main already puts on the wire for an out-of-band notice (CronService). */
const tipsNotice = (content: string, kind: 'warning' | 'error'): IResponseMessage => ({
  type: 'tips',
  conversation_id: CONV,
  msg_id: 'notice-1',
  data: { content, type: kind },
});

const errorFrame = (): IResponseMessage => ({
  type: 'error',
  conversation_id: CONV,
  msg_id: TURN,
  data: 'Provider returned an empty response. No content and no tool calls.',
});

/** WCoreManager settles the turn's activity card from handleTurnEnd, BEFORE it emits `finish`. */
const activityTurnEnd = (outcome: 'done' | 'failed'): IResponseMessage => ({
  type: 'activity_turn_end',
  conversation_id: CONV,
  msg_id: TURN,
  data: { outcome },
});

const finishWithReason = (reason: 'stop' | 'error'): IResponseMessage => ({
  type: 'finish',
  conversation_id: CONV,
  msg_id: TURN,
  data: { finish_reason: reason } as unknown as IResponseMessage['data'],
});

/** Session-level engine frames. They name no turn: main emits them with an empty msg_id. */
const mcpSessionState = (): IResponseMessage => ({
  type: 'mcp_session_state',
  conversation_id: CONV,
  msg_id: '',
  data: { expectedServerNames: [], receipts: {} },
});

const mcpReady = (): IResponseMessage => ({
  type: 'mcp_ready',
  conversation_id: CONV,
  msg_id: '',
  data: { name: 'wayland-team-guide', tools: [] },
});

describe('in-thread notices reach the live conversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamHandler = null;
    mockConversationUpdateInvoke.mockResolvedValue(true);
    mockConversationGetInvoke.mockResolvedValue({ status: 'running', type: 'wcore' });
  });

  it('renders a notice pushed on the live stream, with no reload', async () => {
    renderHarness();
    await waitFor(() => expect(streamHandler).toBeTypeOf('function'));

    emit(tipsNotice('Wayland could not unlock the Constitution key ring saved on this machine.', 'warning'));

    await waitFor(() => {
      const notice = list().find((m) => m.type === 'tips' && m.content?.type === 'warning');
      expect(notice?.content?.content).toContain('could not unlock the Constitution key ring');
    });
  });

  it('keeps the fatal error tip when the turn settles its activity card before finishing', async () => {
    renderHarness();
    await waitFor(() => expect(streamHandler).toBeTypeOf('function'));

    // The exact live sequence: the provider fails, the manager settles the turn's
    // activity card as failed, then the engine's stream_end arrives reporting
    // finish_reason 'stop' (it describes the STREAM, not the outcome).
    emit(errorFrame());
    emit(activityTurnEnd('failed'));
    emit(finishWithReason('stop'));

    await waitFor(() => {
      expect(list().some((m) => m.type === 'tips' && m.content?.type === 'error')).toBe(true);
    });
    // Give the deferred clear a chance to run before asserting it did not.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(list().some((m) => m.type === 'tips' && m.content?.type === 'error')).toBe(true);
  });
});

describe('a conversation whose last turn failed rehydrates as terminal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamHandler = null;
    mockConversationUpdateInvoke.mockResolvedValue(true);
    // Re-opening after a restart: main has no live task, so the turn is terminal.
    mockConversationGetInvoke.mockResolvedValue({ status: 'finished', type: 'wcore' });
  });

  it('stays settled while the engine reports session-level readiness on open', async () => {
    const { getByTestId } = renderHarness();
    await waitFor(() => expect(streamHandler).toBeTypeOf('function'));
    await waitFor(() => expect(getByTestId('running').textContent).toBe('false'));

    // Opening the conversation warms the engine; these frames belong to the
    // SESSION, not to any turn.
    emit(mcpSessionState());
    emit(mcpReady());

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getByTestId('running').textContent).toBe('false');
  });

  it('stays settled when a notice is pushed into it', async () => {
    const { getByTestId } = renderHarness();
    await waitFor(() => expect(streamHandler).toBeTypeOf('function'));
    await waitFor(() => expect(getByTestId('running').textContent).toBe('false'));

    emit(tipsNotice('A scheduled task was missed while Wayland was closed.', 'warning'));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getByTestId('running').textContent).toBe('false');
  });
});
