/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TTeam } from '@/common/types/teamTypes';

// Arco's Collapse is a fairly heavy component; mock it with a lightweight surrogate
// that mirrors the props ActiveTeamGroup actually depends on:
//   - activeKey: when it includes the panel's `name`, body is rendered
//   - onChange:  fires with the toggled keys array on header click
vi.mock('@arco-design/web-react', () => {
  type CollapseItemProps = {
    name: string;
    header: React.ReactNode;
    children?: React.ReactNode;
    showExpandIcon?: boolean;
  };
  type CollapseProps = {
    activeKey: string[];
    onChange?: (key: string, keys: string[]) => void;
    children?: React.ReactNode;
    className?: string;
    bordered?: boolean;
  };

  const Collapse: React.FC<CollapseProps> & { Item: React.FC<CollapseItemProps> } = ({
    activeKey,
    onChange,
    children,
  }) => {
    const items = React.Children.toArray(children) as React.ReactElement<CollapseItemProps>[];
    return (
      <div data-testid='mock-collapse'>
        {items.map((child) => {
          const isOpen = activeKey.includes(child.props.name);
          return (
            <div key={child.props.name} data-testid={`mock-collapse-panel-${child.props.name}`}>
              <div
                data-testid={`mock-collapse-header-${child.props.name}`}
                onClick={() => {
                  const next = isOpen ? [] : [child.props.name];
                  onChange?.(child.props.name, next);
                }}
              >
                <span
                  data-testid={`mock-chevron-${child.props.name}`}
                  data-show-icon={child.props.showExpandIcon ? 'true' : 'false'}
                >
                  ▸
                </span>
                {child.props.header}
              </div>
              {isOpen && <div data-testid={`mock-collapse-body-${child.props.name}`}>{child.props.children}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  const CollapseItem: React.FC<CollapseItemProps> = ({ children }) => <>{children}</>;
  Collapse.Item = CollapseItem;

  return { Collapse };
});

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lucide-react')>()),
  Bot: (props: { size?: number; color?: string }) => (
    <span data-testid='bot-icon' data-size={props.size} data-color={props.color} />
  ),
}));

vi.mock('@renderer/styles/colors', () => ({
  iconColors: { primary: '#FF6B35' },
}));

import ActiveTeamGroup from '@/renderer/components/layout/Sider/ActiveTeamGroup';
import {
  useTeamGroupPersistence,
  __TEAM_GROUP_STORAGE_KEY,
} from '@/renderer/components/layout/Sider/useTeamGroupPersistence';

function makeTeam(overrides: Partial<TTeam> = {}): TTeam {
  return {
    id: 'team-1',
    userId: 'user-1',
    name: 'Engineering',
    workspace: '/tmp',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-leader',
    agents: [
      {
        slotId: 'slot-leader',
        conversationId: 'cid-leader',
        role: 'leader',
        agentType: 'claude',
        agentName: 'Lead',
        conversationType: 'acp',
        status: 'idle',
      },
      {
        slotId: 'slot-2',
        conversationId: 'cid-2',
        role: 'teammate',
        agentType: 'claude',
        agentName: 'Helper',
        conversationType: 'acp',
        status: 'idle',
      },
    ],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

// Thin host that drives ActiveTeamGroup through the real persistence hook so we
// exercise the full read → toggle → write cycle the same way the sidebar does.
const HostedGroup: React.FC<{
  team: TTeam;
  unreadCount?: number;
  onTeammateClick?: (slotId: string) => void;
}> = ({ team, unreadCount = 0, onTeammateClick }) => {
  const { isExpanded, toggle } = useTeamGroupPersistence();
  return (
    <ActiveTeamGroup
      team={team}
      expanded={isExpanded(team.id)}
      onToggle={() => toggle(team.id)}
      header={
        <div>
          <span data-testid='header-name'>{team.name}</span>
          {unreadCount > 0 && <span data-testid='header-badge'>{unreadCount > 99 ? '99+' : String(unreadCount)}</span>}
        </div>
      }
      onTeammateClick={(t) => onTeammateClick?.(t.slotId)}
    />
  );
};

describe('ActiveTeamGroup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the header and (by default, first run) the teammates body', () => {
    render(<HostedGroup team={makeTeam()} />);

    expect(screen.getByTestId('header-name')).toHaveTextContent('Engineering');
    // First run: no persisted state → default to expanded → body visible.
    expect(screen.getByTestId('mock-collapse-body-team-1')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Helper')).toBeInTheDocument();
  });

  it('toggling the header collapses the body and persists state to localStorage', () => {
    render(<HostedGroup team={makeTeam()} />);

    expect(screen.getByTestId('mock-collapse-body-team-1')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('mock-collapse-header-team-1'));
    });

    // Body must be gone.
    expect(screen.queryByTestId('mock-collapse-body-team-1')).not.toBeInTheDocument();

    // localStorage now reflects collapsed state.
    const raw = localStorage.getItem(__TEAM_GROUP_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as Record<string, { expanded: boolean }>;
    expect(parsed['team-1']).toEqual({ expanded: false });
  });

  it('re-mounting restores the persisted collapsed state (survives reload)', () => {
    // Seed storage as if the previous session had collapsed this team.
    localStorage.setItem(__TEAM_GROUP_STORAGE_KEY, JSON.stringify({ 'team-1': { expanded: false } }));

    render(<HostedGroup team={makeTeam()} />);

    // The persisted collapsed state should win on first paint.
    expect(screen.queryByTestId('mock-collapse-body-team-1')).not.toBeInTheDocument();
  });

  it('toggling twice round-trips the persisted state back to expanded', () => {
    render(<HostedGroup team={makeTeam()} />);

    act(() => {
      fireEvent.click(screen.getByTestId('mock-collapse-header-team-1'));
    });
    act(() => {
      fireEvent.click(screen.getByTestId('mock-collapse-header-team-1'));
    });

    expect(screen.getByTestId('mock-collapse-body-team-1')).toBeInTheDocument();

    const parsed = JSON.parse(localStorage.getItem(__TEAM_GROUP_STORAGE_KEY) as string) as Record<
      string,
      { expanded: boolean }
    >;
    expect(parsed['team-1']).toEqual({ expanded: true });
  });

  it('clicking a teammate invokes onTeammateClick with the correct slot id', () => {
    const onTeammateClick = vi.fn();
    render(<HostedGroup team={makeTeam()} onTeammateClick={onTeammateClick} />);

    act(() => {
      fireEvent.click(screen.getByTestId('team-group-teammate-team-1-slot-2'));
    });

    expect(onTeammateClick).toHaveBeenCalledTimes(1);
    expect(onTeammateClick).toHaveBeenCalledWith('slot-2');
  });

  it('renders no body and no chevron when the team has zero agents', () => {
    render(<HostedGroup team={makeTeam({ agents: [] })} />);

    // No body div at all (we render `null` for the body when teammates.length === 0).
    expect(screen.queryByTestId('team-group-body-team-1')).not.toBeInTheDocument();
    // Mock chevron records the showExpandIcon flag passed by ActiveTeamGroup.
    expect(screen.getByTestId('mock-chevron-team-1')).toHaveAttribute('data-show-icon', 'false');
  });

  it('survives corrupted localStorage payloads gracefully', () => {
    localStorage.setItem(__TEAM_GROUP_STORAGE_KEY, 'this is not json');

    render(<HostedGroup team={makeTeam()} />);

    // Falls back to default-expanded.
    expect(screen.getByTestId('mock-collapse-body-team-1')).toBeInTheDocument();
  });

  it('isolates persistence per team id', () => {
    const teamA = makeTeam({ id: 'team-a', name: 'Alpha' });
    const teamB = makeTeam({ id: 'team-b', name: 'Bravo' });

    render(
      <>
        <HostedGroup team={teamA} />
        <HostedGroup team={teamB} />
      </>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('mock-collapse-header-team-a'));
    });

    expect(screen.queryByTestId('mock-collapse-body-team-a')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-collapse-body-team-b')).toBeInTheDocument();

    const parsed = JSON.parse(localStorage.getItem(__TEAM_GROUP_STORAGE_KEY) as string) as Record<
      string,
      { expanded: boolean }
    >;
    expect(parsed['team-a']).toEqual({ expanded: false });
    expect(parsed['team-b']).toBeUndefined();
  });
});
