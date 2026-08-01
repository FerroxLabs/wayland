/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression test for #910(b): the aggregation is named "Conversations" while
 * every unit it aggregates is a "Chat". The two English-only aggregation labels
 * - the sider nav entry and the Conversations page H1 - must read "Chats".
 *
 * The `conversations.*` namespace has NO locale file, so every string resolves
 * through its inline defaultValue; the i18n mock mirrors that by returning the
 * defaultValue, so the assertion follows the shipped default swap.
 */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/renderer/pages/projects/hooks/useProjects', () => ({
  useProjects: () => ({ projects: [] }),
}));

vi.mock('@/renderer/pages/projects/components/AssignToProjectModal', () => ({
  default: { useModal: () => [{ open: vi.fn() }, null] },
}));

vi.mock('@/renderer/hooks/chat/useSendBoxDraft', () => ({
  clearPersistedDraftsForConversation: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    database: {
      getUserConversations: { invoke: vi.fn(() => Promise.resolve([])) },
    },
    conversation: {
      listChanged: { on: vi.fn(() => () => void 0) },
    },
  },
}));

import { SiderSessionsEntry } from '../../../src/renderer/components/layout/Sider/SiderNav';
import ConversationsListPage from '../../../src/renderer/pages/conversations/ConversationsListPage';

const siderProps = {
  isMobile: false,
  isActive: false,
  collapsed: false,
  siderTooltipProps: {} as never,
  onClick: vi.fn(),
};

describe('Conversations aggregation label (#910b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('the sider nav entry reads "Chats"', () => {
    render(
      <MemoryRouter>
        <SiderSessionsEntry {...siderProps} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('sider-sessions-entry')).toHaveTextContent('Chats');
    expect(screen.queryByText('Conversations')).not.toBeInTheDocument();
  });

  it('the Conversations page H1 reads "Chats"', async () => {
    render(
      <MemoryRouter>
        <ConversationsListPage />
      </MemoryRouter>
    );
    expect(await screen.findByText('Chats')).toBeInTheDocument();
    expect(screen.queryByText('Conversations')).not.toBeInTheDocument();
  });
});
