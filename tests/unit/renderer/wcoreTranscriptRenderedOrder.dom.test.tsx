/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { TMessage } from '@/common/chat/chatLib';
import { buildMessageIndex, composeMessageWithIndex } from '@/renderer/pages/conversation/Messages/hooks';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: unknown[];
    itemContent: (index: number, item: unknown) => React.ReactNode;
  }) => (
    <div data-testid='virtuoso-root'>
      {data.map((item, index) => (
        <div key={index}>{itemContent(index, item)}</div>
      ))}
    </div>
  ),
}));
vi.mock('@/renderer/pages/conversation/Messages/components/MessageText', () => ({
  default: ({ message }: { message: Extract<TMessage, { type: 'text' }> }) => (
    <span data-testid='rendered-text'>{message.content.content}</span>
  ),
}));
vi.mock('@/renderer/components/chat/observability/ActivityTimeline', () => ({
  default: ({ steps }: { steps: Array<{ id?: string; label?: string }> }) => (
    <span data-testid='rendered-tool'>{steps[0]?.id ?? steps[0]?.label}</span>
  ),
}));
vi.mock('@/renderer/pages/conversation/Messages/useAutoScroll', () => ({
  useAutoScroll: () => ({
    virtuosoRef: { current: null },
    handleScrollerRef: () => {},
    handleScroll: () => {},
    handleAtBottomStateChange: () => {},
    handleFollowOutput: () => false as const,
    showScrollButton: false,
    scrollToBottom: () => {},
    hideScrollButton: () => {},
  }),
}));
vi.mock('@/renderer/hooks/file/useAutoPreviewOfficeFiles', () => ({ useAutoPreviewOfficeFiles: () => {} }));
vi.mock('@/renderer/hooks/context/ConversationContext', () => ({ useConversationContextSafe: () => null }));
vi.mock('@/renderer/pages/guid/components/workflow/workflowViewMode', () => ({
  useWorkflowViewMode: () => ({ isWorkflow: false, mode: 'conversation' }),
}));
vi.mock('@/renderer/pages/guid/components/workflow/WorkflowTranscript', () => ({ WorkflowTranscript: () => null }));
vi.mock('@/renderer/pages/conversation/Messages/components/SelectionReplyButton', () => ({ default: () => null }));
vi.mock('react-router-dom', () => ({ useLocation: () => ({ state: null, key: 'order' }) }));
vi.mock('@/common', () => ({
  ipcBridge: { conversation: { get: { invoke: vi.fn().mockResolvedValue(null) } } },
}));

let messageList: TMessage[] = [];
vi.mock('@/renderer/pages/conversation/Messages/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/renderer/pages/conversation/Messages/hooks')>();
  return { ...actual, useMessageList: () => messageList };
});

import MessageList from '@/renderer/pages/conversation/Messages/MessageList';

const text = (id: string, segmentId: string, content: string): TMessage =>
  ({
    id,
    msg_id: 'turn-1',
    segment_id: segmentId,
    conversation_id: 'conversation-1',
    type: 'text',
    position: 'left',
    content: { content },
  }) as TMessage;

const tool = (id: string, callId: string): TMessage =>
  ({
    id,
    msg_id: 'turn-1',
    segment_id: `turn-1:tool:${callId}`,
    conversation_id: 'conversation-1',
    type: 'tool_group',
    content: [{ callId, name: 'Bash', description: callId, status: 'Success' }],
  }) as TMessage;

describe('MessageList renders segmented WCore transcript order', () => {
  it('keeps the final answer after both tools', () => {
    const incoming = [
      text('text-a', 'segment-a', 'A-before-first-tool.'),
      tool('tool-1', 'call-order-one'),
      text('text-b', 'segment-b', 'B-between-tools.'),
      tool('tool-2', 'call-order-two'),
      text('text-c', 'segment-c', 'C-final-answer.'),
    ];
    const index = buildMessageIndex([]);
    messageList = incoming.reduce<TMessage[]>((list, message) => composeMessageWithIndex(message, list, index), []);

    render(<MessageList />);

    const rendered = Array.from(screen.getByTestId('virtuoso-root').children).map((row) => row.textContent);
    expect(rendered).toEqual([
      'A-before-first-tool.',
      'call-order-one',
      'B-between-tools.',
      'call-order-two',
      'C-final-answer.',
    ]);
  });
});
