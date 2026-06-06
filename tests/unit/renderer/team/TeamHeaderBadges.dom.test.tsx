/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * W2c - TeamHeaderBadges DOM tests. Covers:
 *   - Standing badge renders only when launcher._standing === true
 *   - Backend rollup groups team.agents by agentType and renders
 *     "N × Backend" comma-joined
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import type { TeamAgent } from '@/common/types/teamTypes';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

import TeamHeaderBadges from '@/renderer/pages/team/components/TeamHeaderBadges';

const agent = (over: Partial<TeamAgent> = {}): TeamAgent => ({
  slotId: 's',
  conversationId: 'c',
  role: 'teammate',
  agentType: 'claude',
  agentName: 'x',
  conversationType: 'acp',
  status: 'idle',
  ...over,
});

describe('TeamHeaderBadges', () => {
  it('renders the Standing badge when the launcher is Standing', () => {
    const launcher = { _standing: true } as AssistantListItem;
    render(<TeamHeaderBadges agents={[agent()]} launcher={launcher} />);
    expect(screen.getByTestId('team-header-standing-badge')).toBeTruthy();
    expect(screen.getByText('Standing')).toBeTruthy();
  });

  it('does not render the Standing badge when no launcher / non-standing launcher', () => {
    const { rerender } = render(<TeamHeaderBadges agents={[agent()]} launcher={null} />);
    expect(screen.queryByTestId('team-header-standing-badge')).toBeNull();
    rerender(<TeamHeaderBadges agents={[agent()]} launcher={{ _standing: false } as AssistantListItem} />);
    expect(screen.queryByTestId('team-header-standing-badge')).toBeNull();
  });

  it('groups agents by backend and renders the rollup', () => {
    const agents = [
      agent({ slotId: 'a', agentType: 'claude' }),
      agent({ slotId: 'b', agentType: 'claude' }),
      agent({ slotId: 'c', agentType: 'claude' }),
      agent({ slotId: 'd', agentType: 'gemini' }),
      agent({ slotId: 'e', agentType: 'gemini' }),
    ];
    render(<TeamHeaderBadges agents={agents} launcher={null} />);
    expect(screen.getByTestId('team-header-backend-rollup').textContent).toBe('3 × Claude, 2 × Gemini');
  });

  it('renders only the rollup (no badge) when launcher omits _standing', () => {
    render(<TeamHeaderBadges agents={[agent({ agentType: 'codex' })]} launcher={null} />);
    expect(screen.queryByTestId('team-header-standing-badge')).toBeNull();
    expect(screen.getByTestId('team-header-backend-rollup').textContent).toBe('1 × Codex');
  });
});
