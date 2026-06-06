/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * W2c + W3a - TeamRightRail DOM tests. Covers:
 *   - Teammate rows (avatar + name + role + backend + status dot)
 *   - Workspace placeholder (linked vs empty)
 *   - Rituals section (empty + populated)
 *   - W3a: + Add teammate button + picker handoff
 *   - W3a: Restart icon for failed teammates + IPC wiring
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import type { TeamAgent } from '@/common/types/teamTypes';

const { restartAgentInvoke, addAgentInvoke } = vi.hoisted(() => ({
  restartAgentInvoke: vi.fn(() => Promise.resolve()),
  addAgentInvoke: vi.fn(() => Promise.resolve()),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));
// Arco Message tries to render a toast via ReactDOM which is not available in
// the jsdom test env (CopyReactDOM.render is undefined). Stub it out - the
// tests assert the IPC call shape, not the toast.
vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});
vi.mock('@renderer/utils/model/agentLogo', () => ({
  getAgentLogo: (agentType: string) => (agentType === 'gemini' ? '/gemini.svg' : null),
}));
vi.mock('@/common', () => ({
  ipcBridge: {
    team: {
      restartAgent: { invoke: restartAgentInvoke },
      addAgent: { invoke: addAgentInvoke },
    },
  },
}));
vi.mock('@/renderer/hooks/assistant', () => ({
  useAssistantList: () => ({
    assistants: [
      {
        id: 'ext-copywriter',
        name: 'Copywriter',
        nameI18n: { 'en-US': 'Copywriter' },
        _kind: 'specialist',
      },
      {
        id: 'ext-analyst',
        name: 'Analyst',
        nameI18n: { 'en-US': 'Analyst' },
        _kind: 'specialist',
      },
    ],
    localeKey: 'en-US',
  }),
}));

// AddTeammatePicker depends on WaylandModal + ThemeProvider; the right-rail
// test only cares that the rail mounts it with the right props and forwards
// onPick. Replace the picker with a thin stub that exposes a single click
// target per specialist so the handoff contract can be asserted directly.
vi.mock('@/renderer/pages/teams/components/AddTeammatePicker', () => ({
  default: ({
    visible,
    onPick,
    specialists,
  }: {
    visible: boolean;
    onPick: (id: string) => void;
    specialists: { id: string; name?: string }[];
  }) => {
    if (!visible) return null;
    return (
      <div data-testid='teams-launcher-picker'>
        {specialists.map((s) => (
          <button
            key={s.id}
            type='button'
            data-testid={`teams-launcher-picker-option-${s.id}`}
            onClick={() => onPick(s.id)}
          >
            {s.name ?? s.id}
          </button>
        ))}
      </div>
    );
  },
}));

import TeamRightRail from '@/renderer/pages/team/components/TeamRightRail';

const makeAgent = (over: Partial<TeamAgent> = {}): TeamAgent => ({
  slotId: 'slot-1',
  conversationId: 'conv-1',
  role: 'teammate',
  agentType: 'gemini',
  agentName: 'Copy',
  conversationType: 'gemini',
  status: 'idle',
  ...over,
});

describe('TeamRightRail', () => {
  it('renders teammate rows with role, backend, and status dot', () => {
    const agents: TeamAgent[] = [
      makeAgent({ slotId: 's1', agentName: 'Marketing Lead', role: 'leader', agentType: 'claude' }),
      makeAgent({ slotId: 's2', agentName: 'Copy', role: 'teammate', agentType: 'gemini' }),
    ];
    const statusMap = new Map<string, { status: TeamAgent['status'] }>([
      ['s1', { status: 'active' }],
      ['s2', { status: 'idle' }],
    ]);

    render(
      <TeamRightRail
        agents={agents}
        statusMap={statusMap}
        launcher={null}
        workspacePath=''
        teamId='team-1'
      />
    );

    // Teammates section heading + both rows
    expect(screen.getByText('Teammates')).toBeTruthy();
    const rows = screen.getAllByTestId('team-right-rail-teammate');
    expect(rows).toHaveLength(2);

    // Status dots reflect the statusMap (active for leader, idle for teammate)
    const dots = screen.getAllByTestId('team-right-rail-status-dot');
    expect(dots[0].getAttribute('data-status')).toBe('active');
    expect(dots[1].getAttribute('data-status')).toBe('idle');

    // Role + backend caption
    expect(screen.getByText(/leader · claude/i)).toBeTruthy();
    expect(screen.getByText(/specialist · gemini/i)).toBeTruthy();

    // Gemini agent renders an avatar image (logo); claude has no logo in mock → initials
    const geminiAvatar = screen.getByAltText('gemini') as HTMLImageElement;
    expect(geminiAvatar.src).toContain('/gemini.svg');
    expect(screen.getByText('ML')).toBeTruthy(); // initials for "Marketing Lead"
  });

  it('renders the workspace placeholder (linked vs empty)', () => {
    const agents: TeamAgent[] = [makeAgent()];
    const statusMap = new Map();
    const { rerender } = render(
      <TeamRightRail
        agents={agents}
        statusMap={statusMap}
        launcher={null}
        workspacePath=''
        teamId='team-1'
      />
    );
    // Empty state
    expect(screen.getByText('No workspace bound to this team yet.')).toBeTruthy();

    // Linked state
    rerender(
      <TeamRightRail
        agents={agents}
        statusMap={statusMap}
        launcher={null}
        workspacePath='/tmp/myteam'
        teamId='team-1'
      />
    );
    expect(screen.getByText('Browse files in the workspace panel →')).toBeTruthy();
  });

  it('renders empty rituals section when the launcher carries no _rituals', () => {
    const agents: TeamAgent[] = [makeAgent()];
    render(
      <TeamRightRail
        agents={agents}
        statusMap={new Map()}
        launcher={null}
        workspacePath=''
        teamId='team-1'
      />
    );
    expect(screen.getByText('Rituals')).toBeTruthy();
    expect(screen.getByText('No rituals - not a Standing Company.')).toBeTruthy();
  });

  it('renders ritual entries from the source launcher', () => {
    const agents: TeamAgent[] = [makeAgent()];
    const launcher = {
      id: 'ext-marketing-agency',
      name: 'Marketing Agency',
      _standing: true,
      _rituals: [
        { name: 'Editorial standup', cadence: 'Mon 9am' },
        { name: 'Campaign retro', cadence: '1st of month' },
      ],
    } as unknown as AssistantListItem;

    render(
      <TeamRightRail
        agents={agents}
        statusMap={new Map()}
        launcher={launcher}
        workspacePath=''
        teamId='team-1'
      />
    );
    expect(screen.getByText('Editorial standup')).toBeTruthy();
    expect(screen.getByText('- Mon 9am')).toBeTruthy();
    expect(screen.getByText('Campaign retro')).toBeTruthy();
    expect(screen.getByText('- 1st of month')).toBeTruthy();
  });

  describe('W3a - + Add teammate', () => {
    it('renders the + Add teammate button', () => {
      const agents: TeamAgent[] = [makeAgent()];
      render(
        <TeamRightRail
          agents={agents}
          statusMap={new Map()}
          launcher={null}
          workspacePath=''
          teamId='team-1'
        />
      );
      expect(screen.getByTestId('team-right-rail-add-teammate')).toBeTruthy();
    });

    it('opens the picker on click', () => {
      const agents: TeamAgent[] = [makeAgent()];
      render(
        <TeamRightRail
          agents={agents}
          statusMap={new Map()}
          launcher={null}
          workspacePath=''
          teamId='team-1'
        />
      );
      fireEvent.click(screen.getByTestId('team-right-rail-add-teammate'));
      expect(screen.getByTestId('teams-launcher-picker')).toBeTruthy();
    });

    it('calls onTeammateAdded with the picked specialist', async () => {
      const onTeammateAdded = vi.fn(() => Promise.resolve());
      const agents: TeamAgent[] = [makeAgent()];
      render(
        <TeamRightRail
          agents={agents}
          statusMap={new Map()}
          launcher={null}
          workspacePath=''
          teamId='team-1'
          onTeammateAdded={onTeammateAdded}
        />
      );
      fireEvent.click(screen.getByTestId('team-right-rail-add-teammate'));
      const pickOption = await screen.findByTestId('teams-launcher-picker-option-ext-copywriter');
      fireEvent.click(pickOption);
      await waitFor(() => {
        expect(onTeammateAdded).toHaveBeenCalledTimes(1);
      });
      const arg = onTeammateAdded.mock.calls[0][0] as { id: string };
      expect(arg.id).toBe('ext-copywriter');
    });
  });

  describe('W3a - Restart action for failed agents', () => {
    it('renders the Restart icon when status === failed', () => {
      const agents: TeamAgent[] = [makeAgent({ slotId: 's2', status: 'failed' })];
      const statusMap = new Map<string, { status: TeamAgent['status'] }>([['s2', { status: 'failed' }]]);
      render(
        <TeamRightRail
          agents={agents}
          statusMap={statusMap}
          launcher={null}
          workspacePath=''
          teamId='team-1'
        />
      );
      expect(screen.getByTestId('team-right-rail-restart')).toBeTruthy();
    });

    it('does NOT render the Restart icon for non-failed agents', () => {
      const agents: TeamAgent[] = [makeAgent({ slotId: 's2', status: 'idle' })];
      const statusMap = new Map<string, { status: TeamAgent['status'] }>([['s2', { status: 'idle' }]]);
      render(
        <TeamRightRail
          agents={agents}
          statusMap={statusMap}
          launcher={null}
          workspacePath=''
          teamId='team-1'
        />
      );
      expect(screen.queryByTestId('team-right-rail-restart')).toBeNull();
    });

    it('invokes restartAgent IPC with teamId + slotId on click', async () => {
      restartAgentInvoke.mockClear();
      const agents: TeamAgent[] = [makeAgent({ slotId: 's2', status: 'failed' })];
      const statusMap = new Map<string, { status: TeamAgent['status'] }>([['s2', { status: 'failed' }]]);
      render(
        <TeamRightRail
          agents={agents}
          statusMap={statusMap}
          launcher={null}
          workspacePath=''
          teamId='team-99'
        />
      );
      fireEvent.click(screen.getByTestId('team-right-rail-restart'));
      await waitFor(() => {
        expect(restartAgentInvoke).toHaveBeenCalledWith({ teamId: 'team-99', slotId: 's2' });
      });
    });
  });
});
