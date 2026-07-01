/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #457 True Continue - the truncation/max-turns banner must resume the live
 * turn (dispatch CHAT_CONTINUE_EVENT) rather than re-send the original prompt
 * (CHAT_RETRY_EVENT). Regression guard for the banner -> Continue wiring.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CHAT_CONTINUE_EVENT,
  CHAT_RETRY_EVENT,
  type ChatContinueDetail,
} from '@/renderer/pages/conversation/Messages/components/MessageActions';

// Keep the real event constants; stub only the heavy MessageActions component.
vi.mock('@/renderer/pages/conversation/Messages/components/MessageActions', async () => {
  const actual = await vi.importActual<
    typeof import('@/renderer/pages/conversation/Messages/components/MessageActions')
  >('@/renderer/pages/conversation/Messages/components/MessageActions');
  return { ...actual, __esModule: true, default: () => React.createElement('div', { 'data-testid': 'actions' }) };
});

vi.mock('@arco-design/web-react', () => ({
  Alert: ({ action }: { action?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'alert' }, action),
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) =>
    React.createElement('button', { onClick }, children),
  Input: { TextArea: () => React.createElement('textarea') },
  Message: { error: vi.fn() },
}));

vi.mock('@/renderer/hooks/context/ConversationContext', () => ({
  useConversationContextSafe: () => ({ conversationId: 'conv-1', workspace: '/ws' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? _k }),
}));

vi.mock('@renderer/components/Markdown', () => ({ __esModule: true, default: () => React.createElement('div') }));
vi.mock('@renderer/components/chat/CollapsibleContent', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => React.createElement('div', {}, children),
}));
vi.mock('@renderer/components/media/FilePreview', () => ({
  __esModule: true,
  default: () => React.createElement('div'),
}));
vi.mock('@renderer/components/media/HorizontalFileList', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => React.createElement('div', {}, children),
}));
vi.mock('./WorkflowMessageBody', () => ({
  WorkflowMessageBody: ({ children, body }: { children: (b: string) => React.ReactNode; body: string }) =>
    React.createElement('div', {}, children(body)),
}));
vi.mock('./MessageCronBadge', () => ({ __esModule: true, default: () => React.createElement('div') }));
vi.mock('./TeammateMessageAvatar', () => ({ __esModule: true, default: () => React.createElement('div') }));
vi.mock('@/renderer/utils/ui/clipboard', () => ({ copyText: vi.fn(() => Promise.resolve()) }));
vi.mock('@/renderer/utils/chat/thinkTagFilter', () => ({
  stripThinkTags: (s: string) => s,
  hasThinkTags: () => false,
}));
vi.mock('@/renderer/utils/chat/skillSuggestParser', () => ({
  stripSkillSuggest: (s: string) => s,
  hasSkillSuggest: () => false,
}));
vi.mock('@/renderer/utils/model/agentLogo', () => ({ getAgentLogo: () => null }));
vi.mock('classnames', () => ({ __esModule: true, default: () => '' }));

import MessageText from '@/renderer/pages/conversation/Messages/components/MessageText';

const truncatedMessage = {
  id: 'a1',
  type: 'text' as const,
  position: 'left' as const,
  conversation_id: 'conv-1',
  createdAt: 1,
  content: { content: '', truncatedDueToBudget: true },
};

afterEach(() => vi.clearAllMocks());

describe('MessageText truncation banner (#457)', () => {
  it('Continue button dispatches CHAT_CONTINUE_EVENT (resume), NOT CHAT_RETRY_EVENT (restart)', () => {
    const continueSpy = vi.fn();
    const retrySpy = vi.fn();
    const onContinue = (e: Event) => continueSpy((e as CustomEvent<ChatContinueDetail>).detail);
    const onRetry = () => retrySpy();
    window.addEventListener(CHAT_CONTINUE_EVENT, onContinue);
    window.addEventListener(CHAT_RETRY_EVENT, onRetry);

    render(<MessageText message={truncatedMessage as never} retryText='the original user prompt' />);

    fireEvent.click(screen.getByText('Continue'));

    expect(continueSpy).toHaveBeenCalledWith({ conversationId: 'conv-1' });
    expect(retrySpy).not.toHaveBeenCalled();

    window.removeEventListener(CHAT_CONTINUE_EVENT, onContinue);
    window.removeEventListener(CHAT_RETRY_EVENT, onRetry);
  });
});
