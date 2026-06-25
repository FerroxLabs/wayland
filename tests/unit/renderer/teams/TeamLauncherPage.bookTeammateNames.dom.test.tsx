/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Regression for A1: the "Book Publishing House" native team listed teammates
 * (e.g. `book-story-architect`) that exist only as generic ASSISTANT_PRESETS
 * stored as `builtin-<slug>` with NO `kind`. `isSelectableSpecialist` filters
 * those out, so they were absent from the launcher's lookup map and the roster
 * (plus the launched team) showed the RAW id instead of a friendly name.
 *
 * The fix builds the launcher's identity-resolution map from the FULL assistant
 * list (not just selectable specialists), so the friendly name resolves while
 * the picker (which reads the separate selectable-specialists array) still
 * excludes the generic presets.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const mockAssistants = vi.hoisted(() => {
  // The native team launcher. Its teammates are BARE slugs that map to
  // `builtin-<slug>` preset records below.
  const launcher = {
    id: 'builtin-book-publishing-house',
    name: 'Book Publishing House',
    nameI18n: { 'en-US': 'Book Publishing House' },
    descriptionI18n: { 'en-US': 'Native book company.' },
    isBuiltin: true,
    isPreset: true,
    presetAgentType: 'gemini',
    _source: 'builtin',
    _kind: 'team',
    _teammates: ['book-story-architect', 'book-developmental-editor'],
  };
  // The two teammates: generic presets stored as `builtin-<slug>` with NO
  // `_kind`. `isSelectableSpecialist` excludes these (isBuiltin && no kind).
  const presetTeammates = [
    { id: 'builtin-book-story-architect', name: 'Story Architect' },
    { id: 'builtin-book-developmental-editor', name: 'Developmental Editor' },
  ].map((s) => ({
    id: s.id,
    name: s.name,
    nameI18n: { 'en-US': s.name },
    descriptionI18n: { 'en-US': `${s.name} description` },
    isBuiltin: true,
    isPreset: true,
    presetAgentType: 'gemini',
    _source: 'builtin',
    // NOTE: intentionally NO _kind - this is the crux of the bug.
  }));
  return [launcher, ...presetTeammates];
});

const navigateMock = vi.hoisted(() => vi.fn());
const teamCreateInvokeMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

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
    isExtensionAssistant: () => false,
    loadAssistants: vi.fn().mockResolvedValue(undefined),
    localeKey: 'en-US',
  }),
}));

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
  ipcBridge: { team: { create: { invoke: teamCreateInvokeMock } } },
}));

vi.mock('@/renderer/pages/guid/constants', () => ({
  CUSTOM_AVATAR_IMAGE_MAP: {} as Record<string, string>,
}));

vi.mock('@renderer/components/base/WaylandModal', () => ({
  default: ({ children, visible }: { children?: React.ReactNode; visible?: boolean }) =>
    visible ? <div data-testid='teams-launcher-modal-shell'>{children}</div> : null,
}));

import TeamLauncherPage from '../../../../src/renderer/pages/teams/TeamLauncherPage';

const renderAt = (route: string, pattern: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={pattern} element={<TeamLauncherPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('TeamLauncherPage - book teammate friendly names (A1)', () => {
  it('renders friendly teammate names (not raw ids) for preset teammates with no kind', async () => {
    renderAt('/teams/builtin-book-publishing-house/launch', '/teams/:teamId/launch');
    await waitFor(() => screen.getByTestId('launcher-roster-card'));

    expect(screen.queryByTestId('launcher-load-error')).toBeNull();

    // The entries still bind to the real `builtin-<slug>` specialist ids.
    expect(screen.getByTestId('launcher-row-leader').getAttribute('data-specialist-id')).toBe(
      'builtin-book-story-architect'
    );
    expect(screen.getByTestId('launcher-row-teammate-0').getAttribute('data-specialist-id')).toBe(
      'builtin-book-developmental-editor'
    );

    // The friendly names render - NOT the raw ids.
    const leaderRow = screen.getByTestId('launcher-row-leader');
    expect(leaderRow.textContent).toContain('Story Architect');
    expect(leaderRow.textContent).not.toContain('book-story-architect');

    const teammateRow = screen.getByTestId('launcher-row-teammate-0');
    expect(teammateRow.textContent).toContain('Developmental Editor');
    expect(teammateRow.textContent).not.toContain('book-developmental-editor');
  });

  it('launches with friendly agentName values for the preset teammates', async () => {
    navigateMock.mockClear();
    teamCreateInvokeMock.mockReset();
    teamCreateInvokeMock.mockResolvedValue({
      id: 'team-book',
      userId: 'test-user-1',
      name: 'Book Publishing House',
      workspace: '',
      workspaceMode: 'shared',
      leaderAgentId: 'slot-1',
      agents: [],
      createdAt: 0,
      updatedAt: 0,
    });

    renderAt('/teams/builtin-book-publishing-house/launch', '/teams/:teamId/launch');
    await waitFor(() => screen.getByTestId('launcher-launch-cta'));
    fireEvent.click(screen.getByTestId('launcher-launch-cta'));

    await waitFor(() => expect(teamCreateInvokeMock).toHaveBeenCalledTimes(1));
    const arg = teamCreateInvokeMock.mock.calls[0][0];
    expect(arg.agents[0]).toEqual(
      expect.objectContaining({ role: 'leader', customAgentId: 'builtin-book-story-architect', agentName: 'Story Architect' })
    );
    expect(arg.agents[1]).toEqual(
      expect.objectContaining({
        role: 'teammate',
        customAgentId: 'builtin-book-developmental-editor',
        agentName: 'Developmental Editor',
      })
    );
  });
});
