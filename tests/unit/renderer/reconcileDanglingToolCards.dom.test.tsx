/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// #486 defense-in-depth: when a turn ends (stream_end / error) any tool card
// left in Executing/Confirming/Pending must be terminalized so its spinner
// stops. Covers the pure reconcile plus the live hook through the real
// MessageListProvider (the batched, deferred update path).

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MessageListProvider,
  reconcileDanglingToolGroups,
  useAddOrUpdateMessage,
  useMessageList,
  useReconcileDanglingToolCards,
  useUpdateMessageList,
} from '@/renderer/pages/conversation/Messages/hooks';
import type { TMessage } from '@/common/chat/chatLib';

vi.mock('@/common', () => ({
  ipcBridge: {
    database: {
      getConversationMessages: { invoke: vi.fn().mockResolvedValue([]) },
    },
  },
}));

type Tool = { callId: string; name: string; status: string; description?: string };

const toolGroup = (id: string, tools: Tool[]): TMessage =>
  ({
    id,
    msg_id: id,
    conversation_id: 'conv-1',
    type: 'tool_group',
    content: tools,
  }) as unknown as TMessage;

const statusesOf = (msg: TMessage) => (msg.content as unknown as Tool[]).map((t) => t.status);

describe('reconcileDanglingToolGroups (pure)', () => {
  it('terminalizes an Executing card to Canceled', () => {
    const list = [toolGroup('g1', [{ callId: 'c1', name: 'ReadFile', status: 'Executing' }])];
    const next = reconcileDanglingToolGroups(list);
    expect(statusesOf(next[0])).toEqual(['Canceled']);
  });

  it('terminalizes Confirming and Pending too', () => {
    const list = [
      toolGroup('g1', [
        { callId: 'c1', name: 'A', status: 'Confirming' },
        { callId: 'c2', name: 'B', status: 'Pending' },
      ]),
    ];
    const next = reconcileDanglingToolGroups(list);
    expect(statusesOf(next[0])).toEqual(['Canceled', 'Canceled']);
  });

  it('leaves already-terminal cards untouched and preserves list identity when nothing dangles', () => {
    const list = [
      toolGroup('g1', [
        { callId: 'c1', name: 'A', status: 'Success' },
        { callId: 'c2', name: 'B', status: 'Error' },
        { callId: 'c3', name: 'C', status: 'Canceled' },
      ]),
      {
        id: 't1',
        msg_id: 't1',
        conversation_id: 'conv-1',
        type: 'text',
        content: { content: 'hi' },
      } as unknown as TMessage,
    ];
    const next = reconcileDanglingToolGroups(list);
    // Referential identity preserved so React can skip the re-render.
    expect(next).toBe(list);
    expect(statusesOf(next[0])).toEqual(['Success', 'Error', 'Canceled']);
  });

  it('only rewrites the cards that dangle within a mixed group', () => {
    const list = [
      toolGroup('g1', [
        { callId: 'c1', name: 'A', status: 'Success' },
        { callId: 'c2', name: 'B', status: 'Executing' },
      ]),
    ];
    const next = reconcileDanglingToolGroups(list);
    expect(statusesOf(next[0])).toEqual(['Success', 'Canceled']);
    // Untouched tool object kept by reference.
    expect((next[0].content as unknown as Tool[])[0]).toBe((list[0].content as unknown as Tool[])[0]);
  });
});

// Live hook through the real provider: a turn ends with a dangling Executing
// card; invoking the reconcile callback must (after its deferred macrotask)
// flip the persisted card to a terminal state.
const Harness = ({ seed, lateFrame }: { seed: TMessage[]; lateFrame?: TMessage }) => {
  const update = useUpdateMessageList();
  const addOrUpdate = useAddOrUpdateMessage();
  const reconcile = useReconcileDanglingToolCards();
  const messages = useMessageList();
  return (
    <div>
      <button type='button' onClick={() => update(() => seed)}>
        seed
      </button>
      <button type='button' onClick={() => reconcile()}>
        end-turn
      </button>
      <button type='button' onClick={() => lateFrame && addOrUpdate(lateFrame, false)}>
        late-frame
      </button>
      <pre data-testid='msgs'>{JSON.stringify(messages)}</pre>
    </div>
  );
};

describe('useReconcileDanglingToolCards (live provider)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('turn ending with a dangling Executing card -> card becomes terminal', async () => {
    render(
      <MessageListProvider value={[]}>
        <Harness seed={[toolGroup('g1', [{ callId: 'c1', name: 'ReadFile', status: 'Executing' }])]} />
      </MessageListProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'seed' }));
    await waitFor(() => expect(screen.getByTestId('msgs').textContent).toContain('Executing'));

    fireEvent.click(screen.getByRole('button', { name: 'end-turn' }));

    await waitFor(() => {
      const content = screen.getByTestId('msgs').textContent ?? '';
      expect(content).toContain('Canceled');
      expect(content).not.toContain('Executing');
    });
  });

  // Safety property: the reconcile is non-destructive. If a genuine late
  // tool_group frame arrives AFTER the reconcile flipped the card to Canceled,
  // composeMessage's merge-by-callId must let the real status win (guards the
  // JSDoc claim against future merge-strategy drift).
  it('a genuine late tool_group frame overwrites the Canceled placeholder', async () => {
    render(
      <MessageListProvider value={[]}>
        <Harness
          seed={[toolGroup('g1', [{ callId: 'c1', name: 'ReadFile', status: 'Executing' }])]}
          lateFrame={toolGroup('g1', [{ callId: 'c1', name: 'ReadFile', status: 'Success' }])}
        />
      </MessageListProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'seed' }));
    await waitFor(() => expect(screen.getByTestId('msgs').textContent).toContain('Executing'));

    fireEvent.click(screen.getByRole('button', { name: 'end-turn' }));
    await waitFor(() => expect(screen.getByTestId('msgs').textContent).toContain('Canceled'));

    // Real terminal frame lands late.
    fireEvent.click(screen.getByRole('button', { name: 'late-frame' }));
    await waitFor(() => {
      const content = screen.getByTestId('msgs').textContent ?? '';
      expect(content).toContain('Success');
      expect(content).not.toContain('Canceled');
    });
  });
});
