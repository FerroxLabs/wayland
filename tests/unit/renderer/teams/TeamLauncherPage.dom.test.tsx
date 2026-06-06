/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for the W2b TeamLauncherPage. Verifies:
 *  - Pre-configured load (URL /teams/marketing-agency/launch) hydrates the
 *    roster from the bundle launcher's _teammates field (5 entries, first
 *    becomes leader, remaining four become teammates).
 *  - Build-my-own (URL /teams/new) starts with an empty roster, surfaces
 *    the name input + goal text-box + disabled Suggest button.
 *  - Roster edits: removing a teammate updates state and DOM; adding via
 *    the picker pushes a new row; backend pill changes are persisted.
 *  - Launch CTA fires ipcBridge.team.create.invoke with leader + teammates
 *    in the agents array and the expected payload shape.
 *  - On success, navigate(`/team/${id}`) fires (singular route - the
 *    active team page in Router.tsx).
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// ---- mock data --------------------------------------------------------------

const mockAssistants = vi.hoisted(() => {
  const SPECIALISTS = [
    { id: 'research', name: 'Research' },
    { id: 'mira', name: 'Mira' },
    { id: 'beacon', name: 'Beacon' },
    { id: 'copy', name: 'Copy' },
    { id: 'lens', name: 'Lens' },
    { id: 'pace', name: 'Pace' },
  ];
  const launcher = {
    id: 'ext-marketing-agency',
    name: 'Marketing Agency',
    nameI18n: { 'en-US': 'Marketing Agency' },
    descriptionI18n: { 'en-US': 'Standing marketing org.' },
    isBuiltin: false,
    isPreset: true,
    presetAgentType: 'gemini',
    _source: 'extension',
    _kind: 'team',
    _teammates: ['research', 'mira', 'beacon', 'copy', 'lens'],
    _rituals: [{ name: 'weekly', cadence: 'weekly:monday:09:00' }],
    _standing: true,
  };
  const specialists = SPECIALISTS.map((s) => ({
    id: `ext-${s.id}`,
    name: s.name,
    nameI18n: { 'en-US': s.name },
    descriptionI18n: { 'en-US': `${s.name} description` },
    isBuiltin: false,
    isPreset: true,
    presetAgentType: 'gemini',
    _source: 'extension',
    _kind: 'specialist',
  }));
  return [launcher, ...specialists];
});

const navigateMock = vi.hoisted(() => vi.fn());
const teamCreateInvokeMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string; count?: number; name?: string }) => {
      let v = opts?.defaultValue ?? _key;
      if (opts?.count !== undefined) v = v.replace('{{count}}', String(opts.count));
      if (opts?.name !== undefined) v = v.replace('{{name}}', String(opts.name));
      return v;
    },
  }),
}));

// Arco's Message helpers call legacy ReactDOM.render which is removed in
// React 19. Replace just the Message API with no-op spies; keep every other
// Arco export (Button, Input, Tooltip, etc.) as real components.
const messageMock = vi.hoisted(() => ({
  info: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  clear: vi.fn(),
}));
vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return { ...actual, Message: messageMock };
});

vi.mock('@/renderer/utils/platform', () => ({
  resolveExtensionAssetUrl: (v: string) => v,
}));

vi.mock('@/renderer/hooks/assistant', () => ({
  useAssistantList: () => ({
    assistants: mockAssistants,
    activeAssistantId: null,
    setActiveAssistantId: vi.fn(),
    activeAssistant: null,
    isExtensionAssistant: () => true,
    loadAssistants: vi.fn().mockResolvedValue(undefined),
    localeKey: 'en-US',
  }),
}));

// Hoisted to give the mock a stable identity across renders. Returning a
// fresh object literal on every render would invalidate downstream useMemo
// dependency arrays in TeamLauncherPage and trigger an infinite re-render
// loop (caught the hard way in vitest hang at first commit).
const availableBackendsMock = vi.hoisted(() => ({
  available: ['gemini', 'claude', 'wayland-core'],
  recommend: (presetAgentType?: string) =>
    presetAgentType && ['gemini', 'claude', 'wayland-core'].includes(presetAgentType)
      ? presetAgentType
      : 'wayland-core',
}));
vi.mock('@/renderer/hooks/assistant/useAvailableBackends', () => ({
  useAvailableBackends: () => availableBackendsMock,
}));

vi.mock('@/renderer/hooks/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-1' } }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    team: {
      create: { invoke: teamCreateInvokeMock },
    },
  },
}));

vi.mock('@/renderer/pages/guid/constants', () => ({
  CUSTOM_AVATAR_IMAGE_MAP: {} as Record<string, string>,
}));

// WaylandModal pulls in ThemeContext, which we don't wire in jsdom tests. The
// shim renders only when visible so the picker assertions still work.
vi.mock('@renderer/components/base/WaylandModal', () => ({
  default: ({
    children,
    visible,
    header,
    footer,
  }: {
    children?: React.ReactNode;
    visible?: boolean;
    header?: React.ReactNode | { render?: () => React.ReactNode; title?: React.ReactNode };
    footer?: React.ReactNode;
  }) => {
    if (!visible) return null;
    const headerNode =
      header && typeof header === 'object' && 'render' in header
        ? header.render?.()
        : header && typeof header === 'object' && 'title' in header
          ? header.title
          : header;
    return (
      <div data-testid='teams-launcher-modal-shell'>
        {headerNode}
        <div>{children}</div>
        {footer}
      </div>
    );
  },
}));

import TeamLauncherPage from '../../../../src/renderer/pages/teams/TeamLauncherPage';

// ---- helpers ----------------------------------------------------------------

const renderAt = (route: string, pattern: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={pattern} element={<TeamLauncherPage />} />
      </Routes>
    </MemoryRouter>
  );

const renderPreconfigured = (teamId = 'marketing-agency') =>
  renderAt(`/teams/${teamId}/launch`, '/teams/:teamId/launch');

const renderBuildMyOwn = () => renderAt('/teams/new', '/teams/new');

// ---- tests ------------------------------------------------------------------

describe('TeamLauncherPage', () => {
  describe('pre-configured load', () => {
    it('hydrates the roster from the bundle launcher (5 teammates → 1 leader + 4 teammates)', async () => {
      renderPreconfigured('marketing-agency');
      await waitFor(() => screen.getByTestId('launcher-roster-card'));
      // Leader row hydrates from the first _teammates entry.
      expect(screen.getByTestId('launcher-row-leader')).not.toBeNull();
      expect(screen.getByTestId('launcher-row-leader').getAttribute('data-specialist-id')).toBe(
        'ext-research'
      );
      // 4 remaining teammates.
      expect(screen.getByTestId('launcher-row-teammate-0').getAttribute('data-specialist-id')).toBe(
        'ext-mira'
      );
      expect(screen.getByTestId('launcher-row-teammate-1').getAttribute('data-specialist-id')).toBe(
        'ext-beacon'
      );
      expect(screen.getByTestId('launcher-row-teammate-2').getAttribute('data-specialist-id')).toBe(
        'ext-copy'
      );
      expect(screen.getByTestId('launcher-row-teammate-3').getAttribute('data-specialist-id')).toBe(
        'ext-lens'
      );
      // Standing badge surfaced for marketing-agency.
      expect(screen.queryByTestId('launcher-standing-badge')).not.toBeNull();
    });

    it('does not show the goal text-box on pre-configured', async () => {
      renderPreconfigured('marketing-agency');
      await waitFor(() => screen.getByTestId('launcher-roster-card'));
      expect(screen.queryByTestId('launcher-goal-card')).toBeNull();
    });
  });

  describe('build-my-own', () => {
    it('renders empty roster + goal text-box + disabled Suggest button', async () => {
      renderBuildMyOwn();
      await waitFor(() => screen.getByTestId('launcher-roster-card'));
      // No leader, no teammates.
      expect(screen.queryByTestId('launcher-row-leader')).toBeNull();
      expect(screen.queryByTestId('launcher-row-teammate-0')).toBeNull();
      // Goal box visible.
      expect(screen.queryByTestId('launcher-goal-card')).not.toBeNull();
      const suggest = screen.getByTestId('launcher-suggest-btn') as HTMLButtonElement;
      expect(suggest.disabled).toBe(true);
      // Name input visible.
      expect(screen.queryByTestId('launcher-name-input')).not.toBeNull();
    });
  });

  describe('roster editing', () => {
    it('removes a teammate when the row remove button is clicked', async () => {
      renderPreconfigured('marketing-agency');
      await waitFor(() => screen.getByTestId('launcher-row-teammate-0'));
      // Drop the first teammate (mira).
      fireEvent.click(screen.getByTestId('launcher-remove-teammate-0'));
      await waitFor(() => {
        // teammate-0 now holds what was teammate-1 (beacon).
        expect(screen.getByTestId('launcher-row-teammate-0').getAttribute('data-specialist-id')).toBe(
          'ext-beacon'
        );
        // Only 3 teammates remain.
        expect(screen.queryByTestId('launcher-row-teammate-3')).toBeNull();
      });
    });

    it('adds a teammate via the picker', async () => {
      renderPreconfigured('marketing-agency');
      await waitFor(() => screen.getByTestId('launcher-add-teammate'));
      fireEvent.click(screen.getByTestId('launcher-add-teammate'));
      await waitFor(() => screen.getByTestId('teams-launcher-picker'));
      // Pace is not in the initial roster - should show up.
      fireEvent.click(screen.getByTestId('teams-launcher-picker-option-ext-pace'));
      await waitFor(() => {
        expect(screen.getByTestId('launcher-row-teammate-4').getAttribute('data-specialist-id')).toBe(
          'ext-pace'
        );
      });
    });

    it('excludes already-selected specialists from the picker', async () => {
      renderPreconfigured('marketing-agency');
      await waitFor(() => screen.getByTestId('launcher-add-teammate'));
      fireEvent.click(screen.getByTestId('launcher-add-teammate'));
      await waitFor(() => screen.getByTestId('teams-launcher-picker'));
      // mira is already on the roster - should NOT appear in the picker.
      expect(screen.queryByTestId('teams-launcher-picker-option-ext-mira')).toBeNull();
      // pace IS still pickable.
      expect(screen.queryByTestId('teams-launcher-picker-option-ext-pace')).not.toBeNull();
    });
  });

  describe('launch CTA', () => {
    it('fires ipcBridge.team.create.invoke with leader + teammates and navigates on success', async () => {
      navigateMock.mockClear();
      teamCreateInvokeMock.mockReset();
      teamCreateInvokeMock.mockResolvedValue({
        id: 'team-xyz',
        userId: 'test-user-1',
        name: 'Marketing Agency',
        workspace: '',
        workspaceMode: 'shared',
        leaderAgentId: 'slot-1',
        agents: [],
        createdAt: 0,
        updatedAt: 0,
      });

      renderPreconfigured('marketing-agency');
      await waitFor(() => screen.getByTestId('launcher-launch-cta'));
      fireEvent.click(screen.getByTestId('launcher-launch-cta'));

      await waitFor(() => {
        expect(teamCreateInvokeMock).toHaveBeenCalledTimes(1);
      });
      const arg = teamCreateInvokeMock.mock.calls[0][0];
      expect(arg).toEqual(
        expect.objectContaining({
          userId: 'test-user-1',
          name: 'Marketing Agency',
          workspace: '',
          workspaceMode: 'shared',
        })
      );
      // agents[0] is the leader (research); 4 teammates after.
      expect(arg.agents.length).toBe(5);
      expect(arg.agents[0]).toEqual(
        expect.objectContaining({ role: 'leader', customAgentId: 'ext-research' })
      );
      expect(arg.agents[1]).toEqual(
        expect.objectContaining({ role: 'teammate', customAgentId: 'ext-mira' })
      );

      // Success → navigate to /team/<id>.
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith('/team/team-xyz');
      });
    });

    it('does NOT call team.create when the build-my-own form has no leader', async () => {
      navigateMock.mockClear();
      teamCreateInvokeMock.mockReset();
      renderBuildMyOwn();
      await waitFor(() => screen.getByTestId('launcher-name-input'));
      // Type a name but skip leader.
      const nameInput = within(screen.getByTestId('launcher-name-input').parentElement!).getByPlaceholderText(
        'e.g. Launch Sprint, Renewal Push, Q1 Brand Refresh'
      );
      fireEvent.change(nameInput, { target: { value: 'My Squad' } });
      fireEvent.click(screen.getByTestId('launcher-launch-cta'));
      // Give the (synchronous) validation a tick.
      await new Promise((r) => setTimeout(r, 10));
      expect(teamCreateInvokeMock).not.toHaveBeenCalled();
    });
  });
});
