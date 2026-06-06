import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoTitle } from '@/renderer/hooks/chat/useAutoTitle';
import type { TMessage } from '@/common/chat/chatLib';

const conversationGetMock = vi.fn();
const conversationUpdateMock = vi.fn();
const getConversationMessagesMock = vi.fn();
const generateTitleMock = vi.fn();
const updateTabNameMock = vi.fn();
const emitterEmitMock = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      get: {
        invoke: (...args: unknown[]) => conversationGetMock(...args),
      },
      update: {
        invoke: (...args: unknown[]) => conversationUpdateMock(...args),
      },
      generateTitle: {
        invoke: (...args: unknown[]) => generateTitleMock(...args),
      },
    },
    database: {
      getConversationMessages: {
        invoke: (...args: unknown[]) => getConversationMessagesMock(...args),
      },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: () => 'New Chat',
  }),
}));

vi.mock('@/renderer/pages/conversation/hooks/ConversationTabsContext', () => ({
  useConversationTabs: () => ({
    updateTabName: updateTabNameMock,
  }),
}));

vi.mock('@/renderer/utils/emitter', () => ({
  emitter: {
    emit: (...args: unknown[]) => emitterEmitMock(...args),
  },
}));

const createUserMessage = (content: string): TMessage => ({
  id: content,
  conversation_id: 'conv-1',
  type: 'text',
  position: 'right',
  content: { content },
  createdAt: Date.now(),
});

describe('useAutoTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No AI-summarized title available -> hook falls back to plain truncation.
    generateTitleMock.mockResolvedValue({ success: false, title: null });
  });

  it('uses the first user message from history for the title', async () => {
    conversationGetMock.mockResolvedValue({ id: 'conv-1', name: 'New Chat' });
    getConversationMessagesMock.mockResolvedValue([
      createUserMessage('Help me put together a monorepo CI failure troubleshooting checklist'),
      createUserMessage('Continue'),
    ]);
    conversationUpdateMock.mockResolvedValue(true);

    const { result } = renderHook(() => useAutoTitle());

    await result.current.checkAndUpdateTitle('conv-1', 'Continue');

    // With no AI-summarized title available, the hook falls back to the plain
    // truncation from buildAutoTitleFromContent (first line, 50-char cap).
    expect(conversationUpdateMock).toHaveBeenCalledWith({
      id: 'conv-1',
      updates: { name: 'Help me put together a monorepo CI failure trouble' },
    });
    expect(updateTabNameMock).toHaveBeenCalledWith('conv-1', 'Help me put together a monorepo CI failure trouble');
    expect(emitterEmitMock).toHaveBeenCalledWith('chat.history.refresh');
  });

  it('falls back to the current input when history is still empty', async () => {
    conversationGetMock.mockResolvedValue({ id: 'conv-1', name: 'New Chat' });
    getConversationMessagesMock.mockResolvedValue([]);
    conversationUpdateMock.mockResolvedValue(true);

    const { result } = renderHook(() => useAutoTitle());

    await result.current.checkAndUpdateTitle('conv-1', 'Continue');

    expect(conversationUpdateMock).toHaveBeenCalledWith({
      id: 'conv-1',
      updates: { name: 'Continue' },
    });
  });
});
