/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression test for #678: closing a chat tab (X button) must also remove the
 * chat content from the screen.
 *
 * The content panel is route-driven (/conversation/:id). The tabs context
 * updates `activeTabId` on close, but unless the tab bar ALSO navigates, the
 * router keeps rendering the conversation that was just closed - tab gone,
 * stale content still on screen.
 */

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      create: { invoke: vi.fn() },
      popout: { invoke: vi.fn(() => Promise.resolve()) },
      dockBack: { invoke: vi.fn(() => Promise.resolve()) },
      popoutClosed: { on: vi.fn(() => () => void 0) },
    },
  },
}));

// Popout affordances are Electron-only; disable to keep the tab minimal.
vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => false,
}));

vi.mock('../../../src/renderer/pages/conversation/hooks/useConversationAgents', () => ({
  useConversationAgents: () => ({ cliAgents: [], presetAssistants: [], isLoading: false }),
}));

vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));

// Avoid pulling the guid page's static image imports into the test bundle.
vi.mock('@/renderer/pages/guid/constants', () => ({
  CUSTOM_AVATAR_IMAGE_MAP: {},
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

import { STORAGE_KEYS } from '../../../src/common/config/storageKeys';
import ConversationTabs from '../../../src/renderer/pages/conversation/components/ConversationTabs';
import { ConversationTabsProvider } from '../../../src/renderer/pages/conversation/hooks/ConversationTabsContext';

const TAB_A = { id: 'conv-a', name: 'Chat A', workspace: '/ws/a', type: 'gemini' as const };
const TAB_B = { id: 'conv-b', name: 'Chat B', workspace: '/ws/b', type: 'gemini' as const };

const ConversationContent: React.FC = () => {
  const { id } = useParams();
  return <div data-testid='conversation-content'>content-of-{id}</div>;
};

const seedTabs = (tabs: Array<typeof TAB_A>, activeTabId: string) => {
  localStorage.setItem(STORAGE_KEYS.CONVERSATION_TABS, JSON.stringify({ openTabs: tabs, activeTabId }));
};

const renderTabsApp = (initialConversationId: string) =>
  render(
    <ConversationTabsProvider>
      <MemoryRouter initialEntries={[`/conversation/${initialConversationId}`]}>
        <ConversationTabs />
        <Routes>
          <Route path='/conversation/:id' element={<ConversationContent />} />
          <Route path='/guid' element={<div data-testid='welcome-page'>welcome</div>} />
        </Routes>
      </MemoryRouter>
    </ConversationTabsProvider>
  );

/** The X close icon inside a tab (stamped `icon-X` by the global Lucide mock). */
const closeButtonOfTab = (tabName: string) => {
  const tabLabel = screen.getByText(tabName);
  const tab = tabLabel.closest('.group\\/tab') as HTMLElement;
  expect(tab).not.toBeNull();
  return within(tab).getByTestId('icon-X');
};

describe('ConversationTabs close (#678)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('switches the content area to the remaining tab when the active tab is closed', () => {
    seedTabs([TAB_A, TAB_B], TAB_B.id);
    renderTabsApp(TAB_B.id);

    // Sanity: the active tab's content is on screen.
    expect(screen.getByTestId('conversation-content')).toHaveTextContent('content-of-conv-b');

    fireEvent.click(closeButtonOfTab('Chat B'));

    // Tab is gone AND the content area no longer shows the closed conversation.
    expect(screen.queryByText('Chat B')).not.toBeInTheDocument();
    expect(screen.getByTestId('conversation-content')).toHaveTextContent('content-of-conv-a');
    expect(screen.queryByText('content-of-conv-b')).not.toBeInTheDocument();
  });

  it('shows the welcome page when the last tab is closed', () => {
    seedTabs([TAB_A], TAB_A.id);
    renderTabsApp(TAB_A.id);

    expect(screen.getByTestId('conversation-content')).toHaveTextContent('content-of-conv-a');

    fireEvent.click(closeButtonOfTab('Chat A'));

    expect(screen.queryByTestId('conversation-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
  });

  it('keeps the current content when closing an inactive tab', () => {
    seedTabs([TAB_A, TAB_B], TAB_B.id);
    renderTabsApp(TAB_B.id);

    fireEvent.click(closeButtonOfTab('Chat A'));

    // Closed tab is gone; the active conversation stays on screen.
    expect(screen.queryByText('Chat A')).not.toBeInTheDocument();
    expect(screen.getByTestId('conversation-content')).toHaveTextContent('content-of-conv-b');
  });
});
