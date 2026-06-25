/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #252 reframe behavioral guard: rendering the message-list switch for an
 * `activity` turn must produce NO activity-card DOM (the tree moved to the
 * ObservabilityPanel). This renders the real MessageItem switch through
 * MessageList - with the heavy, non-pure deps (Virtuoso layout, auto-scroll,
 * contexts, ipc) stubbed - and asserts the activity message flows through the
 * switch (its wrapper row mounts) yet emits no `activity-card`. A regression
 * that re-introduces the inline card via any code path would fail here, where a
 * source string-grep would not.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { IMessageActivity, TMessage } from '@/common/chat/chatLib';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

// react-virtuoso has no layout engine in jsdom; render items inline so the
// MessageItem switch actually runs for each row.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: unknown[];
    itemContent: (index: number, item: unknown) => React.ReactNode;
  }) => (
    <div data-testid='virtuoso-root'>
      {data.map((item, i) => (
        <div key={i}>{itemContent(i, item)}</div>
      ))}
    </div>
  ),
}));

// The message stream the list renders. Controlled per test.
let messageList: TMessage[] = [];
vi.mock('@/renderer/pages/conversation/Messages/hooks', () => ({
  useMessageList: () => messageList,
}));

// Non-pure side-effect hooks / leaf components: stub to no-ops so the switch is
// the only thing exercised.
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
vi.mock('@/renderer/hooks/file/useAutoPreviewOfficeFiles', () => ({
  useAutoPreviewOfficeFiles: () => {},
}));
vi.mock('@/renderer/hooks/context/ConversationContext', () => ({
  useConversationContextSafe: () => null,
}));
vi.mock('@/renderer/pages/guid/components/workflow/workflowViewMode', () => ({
  useWorkflowViewMode: () => ({ isWorkflow: false, mode: 'conversation' }),
}));
vi.mock('@/renderer/pages/conversation/Messages/components/SelectionReplyButton', () => ({
  default: () => null,
}));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ state: null, key: 'default' }),
}));
vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: { get: { invoke: vi.fn().mockResolvedValue(null) } },
  },
}));

import MessageList from '@/renderer/pages/conversation/Messages/MessageList';

const activity = (id: string): IMessageActivity => ({
  id,
  msg_id: `turn-${id}`,
  conversation_id: 'c1',
  type: 'activity',
  position: 'left',
  content: {
    turnId: `turn-${id}`,
    status: 'running',
    nodes: [{ id: 'n1', kind: 'tool', callId: 'n1', name: 'ReadFile', status: 'running', startTime: 1 }],
  },
});

describe('MessageList #252 activity relocation (behavioral)', () => {
  it('renders no activity card for an activity turn (case returns null)', () => {
    messageList = [activity('a1')];
    render(<MessageList />);

    // The activity message flowed through the switch: its wrapper row mounts...
    expect(screen.getByTestId('message-activity-left')).toBeTruthy();
    // ...but the big inline activity card is NOT rendered (moved to the panel).
    expect(screen.queryByTestId('activity-card')).toBeNull();
    // And no node from the tree leaks into the inline list.
    expect(screen.queryByText('ReadFile')).toBeNull();
  });
});
