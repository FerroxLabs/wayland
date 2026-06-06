/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * W2d - SiderActiveTeams DOM tests. Covers:
 *   - Renders only teams that have at least one agent with status='active'
 *   - Each row shows name + backend rollup + formatted token/cost rollup
 *   - Click navigates to /team/${id}
 *   - Returns null when collapsed or no active teams (no empty stub)
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { TTeam } from '@/common/types/teamTypes';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: Record<string, unknown>) => {
      const dv = (opts && (opts.defaultValue as string)) ?? _key;
      // Interpolate {{token}}-style placeholders so tests can assert formatted output
      return dv.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => String(opts?.[k] ?? ''));
    },
  }),
}));

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const useTeamListMock = vi.hoisted(() => vi.fn());
vi.mock('@renderer/pages/team/hooks/useTeamList', () => ({
  useTeamList: () => useTeamListMock(),
}));

const useTeamCostMeterMock = vi.hoisted(() => vi.fn());
vi.mock('@renderer/hooks/team/useTeamCostMeter', () => ({
  useTeamCostMeter: (teamId: string) => useTeamCostMeterMock(teamId),
}));

vi.mock('@renderer/utils/ui/siderTooltip', () => ({
  cleanupSiderTooltips: vi.fn(),
}));
vi.mock('@renderer/utils/ui/focus', () => ({
  blurActiveElement: vi.fn(),
}));

// SiderActiveTeams reads the assistant list to colorize each row's tile via
// the launcher record. Tests don't exercise palette resolution, so a stub
// list keeps the hook quiet without setting up the full i18n + IPC layer.
vi.mock('@renderer/hooks/assistant', () => ({
  useAssistantList: () => ({ assistants: [], localeKey: 'en-US' }),
}));

import SiderActiveTeams from '@/renderer/components/layout/Sider/SiderNav/SiderActiveTeams';

const makeTeam = (over: Partial<TTeam> & { id: string; activeAgentCount?: number; agentTypes?: string[] }): TTeam => {
  const types = over.agentTypes ?? ['claude'];
  const activeCount = over.activeAgentCount ?? 0;
  return {
    id: over.id,
    userId: 'u1',
    name: over.name ?? `Team ${over.id}`,
    workspace: '',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-0',
    agents: types.map((t, i) => ({
      slotId: `slot-${i}`,
      conversationId: `conv-${i}`,
      role: i === 0 ? 'leader' : 'teammate',
      agentType: t,
      agentName: `${t}-${i}`,
      conversationType: t,
      status: i < activeCount ? 'active' : 'idle',
    })),
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
};

describe('SiderActiveTeams', () => {
  it('renders only teams with at least one active agent', () => {
    useTeamListMock.mockReturnValue({
      teams: [
        makeTeam({ id: 'live', name: 'Live Squad', activeAgentCount: 1, agentTypes: ['claude'] }),
        makeTeam({ id: 'dormant', name: 'Dormant Crew', activeAgentCount: 0, agentTypes: ['gemini'] }),
        makeTeam({ id: 'live2', name: 'Other Live', activeAgentCount: 2, agentTypes: ['claude', 'gemini'] }),
      ],
      mutate: vi.fn(),
      removeTeam: vi.fn(),
    });
    useTeamCostMeterMock.mockReturnValue({ totalTokens: 0, totalUsd: 0, isLoading: false });

    render(<SiderActiveTeams pathname='/guid' collapsed={false} />);

    expect(screen.getByTestId('sider-active-teams')).toBeTruthy();
    expect(screen.getByTestId('sider-active-team-live')).toBeTruthy();
    expect(screen.getByTestId('sider-active-team-live2')).toBeTruthy();
    expect(screen.queryByTestId('sider-active-team-dormant')).toBeNull();
  });

  it('returns null when no active teams', () => {
    useTeamListMock.mockReturnValue({
      teams: [makeTeam({ id: 'a', activeAgentCount: 0 })],
      mutate: vi.fn(),
      removeTeam: vi.fn(),
    });
    useTeamCostMeterMock.mockReturnValue({ totalTokens: 0, totalUsd: 0, isLoading: false });

    const { container } = render(<SiderActiveTeams pathname='/guid' collapsed={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when collapsed', () => {
    useTeamListMock.mockReturnValue({
      teams: [makeTeam({ id: 'live', activeAgentCount: 1 })],
      mutate: vi.fn(),
      removeTeam: vi.fn(),
    });
    useTeamCostMeterMock.mockReturnValue({ totalTokens: 1000, totalUsd: 0.5, isLoading: false });

    const { container } = render(<SiderActiveTeams pathname='/guid' collapsed={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows formatted token + USD rollup ("1.2M tokens · ~$3.40 this week")', () => {
    useTeamListMock.mockReturnValue({
      teams: [makeTeam({ id: 'live', name: 'Launch', activeAgentCount: 1, agentTypes: ['claude', 'gemini'] })],
      mutate: vi.fn(),
      removeTeam: vi.fn(),
    });
    useTeamCostMeterMock.mockReturnValue({ totalTokens: 1_234_567, totalUsd: 3.4, isLoading: false });

    render(<SiderActiveTeams pathname='/guid' collapsed={false} />);

    const rollup = screen.getByTestId('sider-active-team-rollup-live');
    expect(rollup.textContent).toContain('1.2M tokens');
    expect(rollup.textContent).toContain('$3.40');
    // Backend rollup line shows both unique backends
    expect(screen.getByText(/Claude · Gemini/)).toBeTruthy();
  });

  it('clicking a row navigates to /team/${id}', () => {
    useTeamListMock.mockReturnValue({
      teams: [makeTeam({ id: 'go-here', activeAgentCount: 1 })],
      mutate: vi.fn(),
      removeTeam: vi.fn(),
    });
    useTeamCostMeterMock.mockReturnValue({ totalTokens: 100, totalUsd: 0.01, isLoading: false });
    navigateMock.mockReset();

    render(<SiderActiveTeams pathname='/guid' collapsed={false} />);

    fireEvent.click(screen.getByTestId('sider-active-team-go-here'));
    expect(navigateMock).toHaveBeenCalledWith('/team/go-here');
  });
});
