/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for the collapsible TeamRightRail (v0.6.2.1 Fix C). Covers:
 *   - Default expanded render (toggle button visible)
 *   - Collapse → 36px icon strip with badge
 *   - localStorage persistence + cross-instance sync via custom event
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/common', () => ({
  ipcBridge: {
    team: {
      restartAgent: { invoke: vi.fn() },
    },
  },
}));

vi.mock('@/renderer/hooks/assistant', () => ({
  useAssistantList: () => ({ assistants: [], localeKey: 'en-US' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string; count?: number }) => opts?.defaultValue ?? _key,
  }),
}));

vi.mock('@renderer/utils/model/agentLogo', () => ({ getAgentLogo: () => null }));
vi.mock('@renderer/utils/model/backendLabel', () => ({ getBackendLabel: (t: string) => t }));
vi.mock('@/renderer/pages/teams/components/AddTeammatePicker', () => ({
  default: () => null,
}));
vi.mock('@/renderer/pages/guid/components/AssistantIconTile', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/renderer/pages/teams/components/teamPalette', () => ({
  resolveSpecialistPalette: () => null,
}));

import TeamRightRail from '@renderer/pages/team/components/TeamRightRail';
import type { TeamAgent, TeammateStatus } from '@/common/types/teamTypes';

const STORAGE_KEY = 'wayland.teamRightRail.collapsed';

function makeAgent(overrides: Partial<TeamAgent> = {}): TeamAgent {
  return {
    slotId: 's1',
    role: 'leader',
    agentType: 'claude',
    agentName: 'Alpha',
    conversationType: 'acp',
    conversationId: 'conv-1',
    status: 'idle',
    customAgentId: null,
    ...overrides,
  } as TeamAgent;
}

function renderRail(props: {
  agents?: TeamAgent[];
  statusMap?: Map<string, { status: TeammateStatus }>;
} = {}) {
  return render(
    <TeamRightRail
      agents={props.agents ?? [makeAgent()]}
      statusMap={props.statusMap ?? new Map()}
      launcher={null}
      workspacePath=''
      teamId='team-1'
    />
  );
}

describe('TeamRightRail collapse', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to expanded (no localStorage key set)', () => {
    renderRail();
    const aside = screen.getByTestId('team-right-rail');
    expect(aside).toHaveAttribute('data-collapsed', 'false');
    expect(aside.className).toMatch(/w-260px/);
    expect(screen.getByTestId('team-right-rail-toggle')).toBeInTheDocument();
  });

  it('reads stored collapsed state synchronously (no expanded flash)', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    renderRail();
    const aside = screen.getByTestId('team-right-rail');
    expect(aside).toHaveAttribute('data-collapsed', 'true');
    expect(aside.className).toMatch(/w-36px/);
  });

  it('toggle persists collapsed state to localStorage', () => {
    renderRail();
    fireEvent.click(screen.getByTestId('team-right-rail-toggle'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    expect(screen.getByTestId('team-right-rail')).toHaveAttribute('data-collapsed', 'true');
  });

  it('toggle from collapsed state restores expanded layout', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    renderRail();
    fireEvent.click(screen.getByTestId('team-right-rail-toggle'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
    expect(screen.getByTestId('team-right-rail')).toHaveAttribute('data-collapsed', 'false');
  });

  it('collapsed view shows total teammate count badge', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    renderRail({
      agents: [
        makeAgent({ slotId: 's1' }),
        makeAgent({ slotId: 's2', role: 'teammate', agentName: 'Beta' }),
        makeAgent({ slotId: 's3', role: 'teammate', agentName: 'Gamma' }),
      ],
    });
    expect(screen.getByTestId('team-right-rail-collapsed-badge')).toHaveTextContent('3');
  });

  it('cross-renderer reconciliation via custom event (same window)', () => {
    renderRail();
    expect(screen.getByTestId('team-right-rail')).toHaveAttribute('data-collapsed', 'false');
    act(() => {
      localStorage.setItem(STORAGE_KEY, 'true');
      window.dispatchEvent(new Event('wayland:team-right-rail-collapsed-changed'));
    });
    expect(screen.getByTestId('team-right-rail')).toHaveAttribute('data-collapsed', 'true');
  });

  it('cross-window reconciliation via storage event', () => {
    renderRail();
    act(() => {
      localStorage.setItem(STORAGE_KEY, 'true');
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: 'true' }));
    });
    expect(screen.getByTestId('team-right-rail')).toHaveAttribute('data-collapsed', 'true');
  });
});
