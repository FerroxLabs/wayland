import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { MessageListProvider, useMessageList } from '@/renderer/pages/conversation/Messages/hooks';
import { useWCoreMessage } from '@/renderer/pages/conversation/platforms/wcore/useWCoreMessage';

// Capture the responseStream handler so the test can drive engine events.
let streamHandler: ((message: IResponseMessage) => void) | null = null;
const mockConversationGetInvoke = vi.fn();
const mockConversationUpdateInvoke = vi.fn();

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

const CONV = 'conv-101';
const ACTIVE_MSG = 'turn-msg-1';

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

const errorTip = () => ({
  type: 'error' as const,
  conversation_id: CONV,
  msg_id: ACTIVE_MSG,
  data: 'Cache full miss: TtlExpiry',
});

const content = (text: string): IResponseMessage => ({
  type: 'content',
  conversation_id: CONV,
  msg_id: ACTIVE_MSG,
  data: text,
});

const finish = (): IResponseMessage => ({
  type: 'finish',
  conversation_id: CONV,
  msg_id: ACTIVE_MSG,
  data: '',
});

describe('useWCoreMessage — transient error tip clearing on finish (#101)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamHandler = null;
    mockConversationGetInvoke.mockResolvedValue({ status: 'running', type: 'wcore' });
    mockConversationUpdateInvoke.mockResolvedValue(true);
  });

  it('clears a mid-turn non-fatal error tip once the turn produces output and finishes', async () => {
    renderHarness();
    await waitFor(() => expect(streamHandler).toBeTypeOf('function'));

    // Engine emits a non-fatal cache diagnostic mid-turn, then keeps streaming.
    emit(errorTip() as unknown as IResponseMessage);
    emit(content('Here is the edited text and a final summary.'));
    emit(finish());

    await waitFor(() => {
      const list = JSON.parse(screen.getByTestId('messages').textContent ?? '[]') as Array<{
        type: string;
        content?: { type?: string; content?: string };
      }>;
      // The assistant output is present...
      expect(list.some((m) => m.type === 'text' && m.content?.content?.includes('final summary'))).toBe(true);
      // ...and the stale error banner has been removed.
      expect(list.some((m) => m.type === 'tips' && m.content?.type === 'error')).toBe(false);
    });
  });

  it('keeps a fatal error tip when the turn finishes without producing output', async () => {
    renderHarness();
    await waitFor(() => expect(streamHandler).toBeTypeOf('function'));

    // A turn that errors and ends with no assistant content: the error stays.
    emit(errorTip() as unknown as IResponseMessage);
    emit(finish());

    await waitFor(() => {
      const list = JSON.parse(screen.getByTestId('messages').textContent ?? '[]') as Array<{
        type: string;
        content?: { type?: string };
      }>;
      expect(list.some((m) => m.type === 'tips' && m.content?.type === 'error')).toBe(true);
    });
  });
});
