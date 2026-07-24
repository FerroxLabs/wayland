/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression test for #910(a): the Conversations page is the lone surface that
 * calls the pin action "Star"/"Starred" (and even pairs the Pin icon with
 * "Star" text). It must speak ONE vocabulary - "Pin" / "Unpin" / "Pinned" -
 * by reusing the already-translated `conversation.history.*` keys, and drop the
 * Star icon for Pin.
 */

// Resolve only the pin vocabulary keys to their English text; everything else
// falls back to the inline defaultValue (so today's "Star" defaults still show
// and the test goes RED until the code switches to the translated keys).
const TRANSLATIONS: Record<string, string> = {
  'conversation.history.pin': 'Pin',
  'conversation.history.unpin': 'Unpin',
  'conversation.history.pinnedSection': 'Pinned',
};
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => TRANSLATIONS[key] ?? opts?.defaultValue ?? key,
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

const PINNED_CONV = {
  id: 'conv-pinned',
  name: 'Pinned chat',
  type: 'gemini',
  extra: { pinned: true },
  model: { useModel: 'gemini-2.0' },
};

vi.mock('@/common', () => ({
  ipcBridge: {
    database: {
      getUserConversations: { invoke: vi.fn(() => Promise.resolve([PINNED_CONV])) },
    },
  },
}));

import ConversationMenu from '../../../src/renderer/pages/conversations/ConversationMenu';
import ConversationRow from '../../../src/renderer/pages/conversations/ConversationRow';
import ConversationsListPage from '../../../src/renderer/pages/conversations/ConversationsListPage';

describe('Conversations page pin vocabulary (#910a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('the context menu says "Pin" when unpinned and "Unpin" when pinned', () => {
    const { rerender } = render(<ConversationMenu pinned={false} onAction={vi.fn()} />);
    expect(screen.getByText('Pin')).toBeInTheDocument();
    expect(screen.queryByText('Star')).not.toBeInTheDocument();

    rerender(<ConversationMenu pinned onAction={vi.fn()} />);
    expect(screen.getByText('Unpin')).toBeInTheDocument();
    expect(screen.queryByText('Unstar')).not.toBeInTheDocument();
  });

  it("the row's pin control exposes an accessible name of Pin / Unpin", () => {
    const conv = { id: 'c1', name: 'Row chat', type: 'gemini', model: { useModel: 'x' } } as never;

    const { rerender } = render(
      <MemoryRouter>
        <ConversationRow conversation={conv} pinned={false} timeLabel='now' onOpen={vi.fn()} onAction={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Pin')).toBeInTheDocument();
    expect(screen.queryByLabelText('Star')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ConversationRow conversation={conv} pinned timeLabel='now' onOpen={vi.fn()} onAction={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Unpin')).toBeInTheDocument();
  });

  it('the pinned-group header on the list page reads "Pinned"', async () => {
    render(
      <MemoryRouter>
        <ConversationsListPage />
      </MemoryRouter>
    );
    expect(await screen.findByText('Pinned')).toBeInTheDocument();
    expect(screen.queryByText('Starred')).not.toBeInTheDocument();
  });

  it('the row uses the Pin icon, not the Star icon', () => {
    const conv = { id: 'c2', name: 'Icon chat', type: 'gemini', model: { useModel: 'x' } } as never;
    render(
      <MemoryRouter>
        <ConversationRow conversation={conv} pinned timeLabel='now' onOpen={vi.fn()} onAction={vi.fn()} />
      </MemoryRouter>
    );
    const pinBtn = screen.getByLabelText('Unpin');
    // Lucide mock stamps data-testid='icon-<Name>'.
    expect(within(pinBtn).queryByTestId('icon-Star')).not.toBeInTheDocument();
    expect(within(pinBtn).getByTestId('icon-PinOff')).toBeInTheDocument();
  });
});
