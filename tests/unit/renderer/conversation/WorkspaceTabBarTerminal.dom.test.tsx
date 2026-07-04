/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 7 — the Terminal tab is gated by the advanced flag: absent when
 * off, present + selectable when on.
 */
import React from 'react';
import { render } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceTabBar from '@/renderer/pages/conversation/Workspace/components/WorkspaceTabBar';

const t = ((k: string) => k) as unknown as TFunction;

const baseProps = {
  t,
  activeTab: 'files' as const,
  onTabChange: vi.fn(),
  changeCount: 0,
  branch: null,
  branches: [],
};

describe('WorkspaceTabBar terminal tab gating (#645)', () => {
  it('hides the Terminal tab when the flag is off', () => {
    const { queryByText } = render(<WorkspaceTabBar {...baseProps} showTerminal={false} />);
    expect(queryByText('conversation.workspace.terminal.tab')).toBeNull();
  });

  it('shows the Terminal tab when the flag is on', () => {
    const { queryByText } = render(<WorkspaceTabBar {...baseProps} showTerminal={true} />);
    expect(queryByText('conversation.workspace.terminal.tab')).not.toBeNull();
  });
});
