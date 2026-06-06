/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// vi.mock is hoisted - must come before the imports that use the mocked modules.
vi.mock('@renderer/pages/team/hooks/useTeamList', () => ({
  useTeamList: vi.fn(),
}));

vi.mock('@renderer/components/layout/Sider/SiderNav/SiderActiveTeams', () => ({
  default: () => <div data-testid='active-teams-stub' />,
}));

vi.mock('@renderer/components/layout/Sider/TeamSiderSection', () => ({
  default: () => <div data-testid='team-sider-stub' />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useTeamList } from '@renderer/pages/team/hooks/useTeamList';
import { SiderTeamsSection } from '@renderer/components/layout/Sider/SiderAccordion/SiderTeamsSection';
import { ACCORDION_STORAGE_KEY } from '@renderer/components/layout/Sider/SiderAccordion/useSiderAccordionState';

const mockUseTeamList = useTeamList as unknown as ReturnType<typeof vi.fn>;

interface RenderOpts {
  collapsed?: boolean;
  pathname?: string;
}

function renderSection(opts: RenderOpts = {}) {
  return render(
    <MemoryRouter>
      <SiderTeamsSection
        collapsed={opts.collapsed ?? false}
        pathname={opts.pathname ?? '/'}
        siderTooltipProps={{}}
      />
    </MemoryRouter>
  );
}

/** Helper - produce a teams payload with N running agents distributed across teams. */
function teamsWithRunning(runningCount: number) {
  return [
    {
      id: 't1',
      name: 'Alpha',
      agents: Array.from({ length: runningCount }, (_, i) => ({
        slotId: `s${i}`,
        agentName: `Agent ${i}`,
        agentType: 'claude',
        status: 'active' as const,
      })),
    },
    {
      id: 't2',
      name: 'Beta',
      agents: [{ slotId: 's-idle', agentName: 'Idle', agentType: 'claude', status: 'idle' as const }],
    },
  ];
}

describe('SiderTeamsSection', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseTeamList.mockReset();
  });

  it('renders accordion shell with the Teams label whenever the user has any team (even idle)', () => {
    // Idle team - agents exist but none currently active. Must still appear
    // in the sidebar so newly-created teams are discoverable immediately.
    mockUseTeamList.mockReturnValue({ teams: teamsWithRunning(0) });
    renderSection();
    expect(screen.getByTestId('sider-teams-section')).toBeInTheDocument();
    expect(screen.getByText('sider.accordion.teams')).toBeInTheDocument();
  });

  it('hide-when-empty: renders nothing when the user has zero teams (expanded mode)', () => {
    mockUseTeamList.mockReturnValue({ teams: [] });
    const { container } = renderSection();
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('sider-teams-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sider-accordion-badge')).not.toBeInTheDocument();
  });

  it('hide-when-empty: renders nothing when the user has zero teams (collapsed mode)', () => {
    mockUseTeamList.mockReturnValue({ teams: [] });
    const { container } = renderSection({ collapsed: true });
    expect(container.firstChild).toBeNull();
  });

  it('idle teams: no badge shown when no agents are running, but section stays visible', () => {
    mockUseTeamList.mockReturnValue({ teams: teamsWithRunning(0) });
    renderSection();
    expect(screen.getByTestId('sider-teams-section')).toBeInTheDocument();
    expect(screen.queryByTestId('sider-accordion-badge')).not.toBeInTheDocument();
  });

  it('idle teams: Running subgroup is hidden when liveCount is 0 (only My teams shown)', () => {
    mockUseTeamList.mockReturnValue({ teams: teamsWithRunning(0) });
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify({ scheduled: false, workflows: false, teams: true }));
    renderSection();
    expect(screen.queryByTestId('sider-teams-running-group')).not.toBeInTheDocument();
    expect(screen.getByTestId('sider-teams-myteams-group')).toBeInTheDocument();
  });

  it('shows the live badge with the running-agent count when ≥ 1', () => {
    mockUseTeamList.mockReturnValue({ teams: teamsWithRunning(3) });
    renderSection();
    const badge = screen.getByTestId('sider-accordion-badge');
    expect(badge).toHaveTextContent('3');
    // SiderAccordionShell stamps the `live` class when isLive=true.
    expect(badge.className).toMatch(/live/);
  });

  it('mounts the preserved SiderActiveTeams inside the Running group when open', () => {
    mockUseTeamList.mockReturnValue({ teams: teamsWithRunning(2) });
    // Outer accordion needs to be open to render its body.
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify({ scheduled: false, workflows: false, teams: true }));
    renderSection();
    expect(screen.getByTestId('sider-teams-running-group')).toBeInTheDocument();
    expect(screen.getByTestId('active-teams-stub')).toBeInTheDocument();
  });

  it('mounts the preserved TeamSiderSection inside the My teams group when open', () => {
    mockUseTeamList.mockReturnValue({ teams: teamsWithRunning(1) });
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify({ scheduled: false, workflows: false, teams: true }));
    renderSection();
    expect(screen.getByTestId('sider-teams-myteams-group')).toBeInTheDocument();
    expect(screen.getByTestId('team-sider-stub')).toBeInTheDocument();
  });

  it('outer toggle flips only the accordion `teams` key (per-team inner state untouched)', () => {
    mockUseTeamList.mockReturnValue({ teams: teamsWithRunning(1) });
    // Seed an inner per-team-group state - must survive the outer toggle.
    const innerKey = 'wayland.sider.teamGroups';
    localStorage.setItem(innerKey, JSON.stringify({ t1: { expanded: false } }));
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'sider.accordion.teams' }));

    const outerRaw = localStorage.getItem(ACCORDION_STORAGE_KEY);
    expect(outerRaw).not.toBeNull();
    const outerParsed = JSON.parse(outerRaw ?? '{}') as Record<string, boolean>;
    expect(outerParsed.teams).toBe(true);

    // Inner per-team-group persistence must be byte-identical.
    expect(localStorage.getItem(innerKey)).toBe(JSON.stringify({ t1: { expanded: false } }));
  });

  it('returns no accordion shell in collapsed mode (uses icon-only button instead)', () => {
    mockUseTeamList.mockReturnValue({ teams: teamsWithRunning(2) });
    renderSection({ collapsed: true });
    expect(screen.queryByTestId('sider-teams-section')).not.toBeInTheDocument();
  });
});
