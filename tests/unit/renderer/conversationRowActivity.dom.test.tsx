/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Minimal i18n: return the key (or defaultValue) so labels are assertable
// without loading locale JSON.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => (options?.defaultValue as string | undefined) ?? key,
  }),
}));

import type { ConversationActivitySnapshot } from '@/common/chat/activity/conversationActivity';
import { ConversationActivityStatus } from '@/renderer/pages/conversation/GroupedHistory/ConversationRowActivity';

const snapshot = (over: Partial<ConversationActivitySnapshot> = {}): ConversationActivitySnapshot => ({
  label: 'Searching the web',
  glyph: 'web',
  agents: [],
  ...over,
});

describe('ConversationActivityStatus', () => {
  it('shows the current humanized action label with no caret for a flat turn', () => {
    render(<ConversationActivityStatus activity={snapshot()} />);
    expect(screen.getByText('Searching the web')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('falls back to the "working" label when the snapshot has no action yet', () => {
    render(<ConversationActivityStatus activity={snapshot({ label: '' })} />);
    expect(screen.getByText('conversation.sidebarActivity.working')).toBeTruthy();
  });

  it('reveals the spawned sub-agents only after the caret is expanded', () => {
    render(
      <ConversationActivityStatus
        activity={snapshot({
          agents: [
            { id: 'p1', name: 'researcher', label: 'Searching the web', glyph: 'web', status: 'running' },
            { id: 'p2', name: 'coder', label: 'Reading a file', glyph: 'file', status: 'done' },
          ],
        })}
      />
    );

    // Collapsed: caret + count badge shown, agent names hidden.
    const caret = screen.getByRole('button', { name: 'conversation.sidebarActivity.toggleAgents' });
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.queryByText('researcher')).toBeNull();

    fireEvent.click(caret);

    // Expanded: each sub-agent surfaces with its own current step.
    expect(screen.getByText('researcher')).toBeTruthy();
    expect(screen.getByText('coder')).toBeTruthy();
    expect(screen.getByText('Reading a file')).toBeTruthy();
  });
});
