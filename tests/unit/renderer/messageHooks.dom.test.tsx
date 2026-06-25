import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MessageListProvider,
  useAddOrUpdateMessage,
  useMessageList,
  useMessageLstCache,
  useRemoveMessageByMsgId,
} from '@/renderer/pages/conversation/Messages/hooks';
import { transformMessage, type TMessage } from '@/common/chat/chatLib';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';

const mockGetConversationMessagesInvoke = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    database: {
      getConversationMessages: {
        invoke: (...args: unknown[]) => mockGetConversationMessagesInvoke(...args),
      },
    },
  },
}));

type TestMessage = {
  id: string;
  msg_id?: string;
  conversation_id: string;
  type: string;
  position?: string;
  content: {
    content: string;
  };
  createdAt?: number;
};

const CacheProbe = ({ conversationId }: { conversationId: string }) => {
  useMessageLstCache(conversationId);
  const messages = useMessageList();
  return <pre data-testid='messages'>{JSON.stringify(messages)}</pre>;
};

const MutationProbe = () => {
  const addOrUpdateMessage = useAddOrUpdateMessage();
  const removeMessageByMsgId = useRemoveMessageByMsgId();
  const messages = useMessageList();

  return (
    <div>
      <button
        type='button'
        onClick={() =>
          addOrUpdateMessage(
            {
              id: 'msg-1',
              msg_id: 'msg-1',
              conversation_id: 'conv-1',
              type: 'text',
              position: 'right',
              content: { content: 'queued message' },
            },
            true
          )
        }
      >
        add-message
      </button>
      <button type='button' onClick={() => removeMessageByMsgId('msg-1')}>
        remove-message
      </button>
      <pre data-testid='mutated-messages'>{JSON.stringify(messages)}</pre>
    </div>
  );
};

describe('message hooks cache merge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps same-conversation streaming messages while filtering out messages from the previous conversation', async () => {
    const dbMessages: TestMessage[] = [
      {
        id: 'db-1',
        msg_id: 'db-1',
        conversation_id: 'conv-1',
        type: 'text',
        content: { content: 'from db' },
      },
    ];

    mockGetConversationMessagesInvoke.mockResolvedValue(dbMessages);

    const initialMessages: TestMessage[] = [
      {
        id: 'stream-1',
        msg_id: 'stream-1',
        conversation_id: 'conv-1',
        type: 'text',
        content: { content: 'streaming current conversation' },
      },
      {
        id: 'stream-2',
        msg_id: 'stream-2',
        conversation_id: 'conv-2',
        type: 'text',
        content: { content: 'streaming stale conversation' },
      },
    ];

    render(
      <MessageListProvider value={initialMessages}>
        <CacheProbe conversationId='conv-1' />
      </MessageListProvider>
    );

    await waitFor(() => {
      const content = screen.getByTestId('messages').textContent;
      expect(content).toContain('db-1');
      expect(content).toContain('stream-1');
    });

    const merged = JSON.parse(screen.getByTestId('messages').textContent ?? '[]') as TestMessage[];

    expect(merged.map((message) => message.id)).toEqual(['db-1', 'stream-1']);
  });

  it('adds optimistic messages and removes them by msg id', async () => {
    mockGetConversationMessagesInvoke.mockResolvedValue([]);

    render(
      <MessageListProvider value={[]}>
        <MutationProbe />
      </MessageListProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'add-message' }));

    await waitFor(() => {
      expect(screen.getByTestId('mutated-messages').textContent).toContain('msg-1');
    });

    fireEvent.click(screen.getByRole('button', { name: 'remove-message' }));

    await waitFor(() => {
      expect(screen.getByTestId('mutated-messages').textContent).not.toContain('msg-1');
    });
  });
});

// ---------------------------------------------------------------------------
// #252 composeMessageWithIndex coverage (the LIVE renderer merge path).
// composeMessage (the non-index fallback) is covered in chatLib.test.ts, but
// the app actually runs composeMessageWithIndex via useAddOrUpdateMessage's
// batched flush. These drive the real hook so the production merge path is
// verified for the new activity + sub_agent message types, and so the two
// implementations cannot silently drift.
// ---------------------------------------------------------------------------

const resp = (m: Partial<IResponseMessage> & { type: string }): IResponseMessage =>
  ({ conversation_id: 'conv-1', ...m }) as unknown as IResponseMessage;

const subAgentResp = (parentCallId: string, agentName: string, inner: unknown): IResponseMessage =>
  resp({ type: 'sub_agent_event', msg_id: '', data: { parentCallId, agentName, inner } });

// Drives a fixed stream of TMessage through the real useAddOrUpdateMessage merge
// path (add=false, exactly how live stream events arrive) and renders the list.
const StreamProbe = ({ stream }: { stream: TMessage[] }) => {
  const addOrUpdateMessage = useAddOrUpdateMessage();
  const messages = useMessageList();
  return (
    <div>
      <button type='button' onClick={() => stream.forEach((m) => addOrUpdateMessage(m, false))}>
        run-stream
      </button>
      <pre data-testid='stream-messages'>{JSON.stringify(messages)}</pre>
    </div>
  );
};

const runStream = async (stream: TMessage[]) => {
  render(
    <MessageListProvider value={[]}>
      <StreamProbe stream={stream} />
    </MessageListProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'run-stream' }));
  await waitFor(() => {
    expect(screen.getByTestId('stream-messages').textContent).not.toBe('[]');
  });
  // Allow the setTimeout-batched flush to drain every queued event.
  await waitFor(() => {
    const parsed = JSON.parse(screen.getByTestId('stream-messages').textContent ?? '[]') as TMessage[];
    expect(parsed.length).toBeGreaterThan(0);
  });
  return JSON.parse(screen.getByTestId('stream-messages').textContent ?? '[]') as TMessage[];
};

describe('composeMessageWithIndex - activity merge (#252)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('merges two tool_chunk deltas for the same turn into one activity card', async () => {
    const a = transformMessage(
      resp({ type: 'tool_chunk', msg_id: 'turn-1', data: { callId: 'c1', toolName: 'Bash', chunk: 'aaa' } })
    )!;
    const b = transformMessage(
      resp({ type: 'tool_chunk', msg_id: 'turn-1', data: { callId: 'c1', toolName: 'Bash', chunk: 'bbb' } })
    )!;

    await waitFor(async () => {
      const list = await runStream([a, b]);
      const cards = list.filter((m) => m.type === 'activity');
      expect(cards).toHaveLength(1);
      expect((cards[0] as Extract<TMessage, { type: 'activity' }>).content.nodes[0].detail).toBe('aaabbb');
    });
  });

  it('does NOT fragment the turn text when an activity card is interleaved (regression)', async () => {
    const text = (content: string): TMessage =>
      ({
        id: 'x',
        type: 'text',
        msg_id: 'turn-1',
        position: 'left',
        conversation_id: 'conv-1',
        content: { content },
      }) as TMessage;
    const activity = transformMessage(
      resp({ type: 'tool_chunk', msg_id: 'turn-1', data: { callId: 'c1', toolName: 'Bash', chunk: 'out' } })
    )!;

    await waitFor(async () => {
      const list = await runStream([text('Hello '), activity, text('World')]);
      const textCards = list.filter((m) => m.type === 'text');
      expect(textCards).toHaveLength(1);
      expect((textCards[0] as Extract<TMessage, { type: 'text' }>).content.content).toBe('Hello World');
      expect(list.filter((m) => m.type === 'activity')).toHaveLength(1);
    });
  });
});

describe('composeMessageWithIndex - sub_agent subtree merge (#252 Phase 2)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('merges a child tool_request then tool_result into one evolving node', async () => {
    const req = transformMessage(
      subAgentResp('spawn:1:w', 'w', {
        type: 'tool_request',
        msg_id: 'm1',
        call_id: 'c1',
        tool: { name: 'Bash', category: 'exec', args: {}, description: '' },
      })
    )!;
    const res = transformMessage(
      subAgentResp('spawn:1:w', 'w', {
        type: 'tool_result',
        msg_id: 'm1',
        call_id: 'c1',
        tool_name: 'Bash',
        status: 'success',
        output: 'done output',
        output_type: 'text',
      })
    )!;

    await waitFor(async () => {
      const list = await runStream([req, res]);
      const cards = list.filter((m) => m.type === 'sub_agent');
      expect(cards).toHaveLength(1);
      const nodes = (cards[0] as Extract<TMessage, { type: 'sub_agent' }>).content.nodes!;
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toMatchObject({ id: 'c1', kind: 'tool', name: 'Bash', status: 'done' });
    });
  });

  it('folds a nested sub_agent_event into a child subtree', async () => {
    const nested = transformMessage(
      subAgentResp('spawn:1:parent', 'parent', {
        type: 'sub_agent_event',
        parent_call_id: 'spawn:2:child',
        agent_name: 'child',
        inner: { type: 'tool_request', msg_id: 'm2', call_id: 'grandchild', tool: { name: 'ReadFile', category: 'info', args: {}, description: '' } },
      })
    )!;

    await waitFor(async () => {
      const list = await runStream([nested]);
      const cards = list.filter((m) => m.type === 'sub_agent');
      expect(cards).toHaveLength(1);
      const nodes = (cards[0] as Extract<TMessage, { type: 'sub_agent' }>).content.nodes!;
      // The nested sub-agent appears as a node whose own children hold the grandchild tool.
      const child = nodes.find((n) => n.children && n.children.length > 0);
      expect(child).toBeDefined();
      expect(child!.children!.some((c) => c.name === 'ReadFile')).toBe(true);
    });
  });
});
