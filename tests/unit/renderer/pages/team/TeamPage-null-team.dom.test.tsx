/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

// Live-smoke fix #2 (2026-05-19) - TeamIndex null-team branch.
// Asserts the /team/<id> route renders an in-place error state when
// `team.get` resolves to null, instead of redirecting to the launcher
// page (which was the previous UX dead-end Sean hit on every saved
// team click during smoke).

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

// SWR's default fetcher is the IPC stub; we mock useSWR directly so we can
// flip between loading / null-team without touching the real bridge.
const mockUseSWR = vi.fn();
vi.mock('swr', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return { ...actual, default: (...args: unknown[]) => mockUseSWR(...args) };
});

vi.mock('@/common', () => ({
  ipcBridge: {
    team: {
      get: { invoke: vi.fn().mockResolvedValue(null) },
    },
  },
}));

// TeamPage is heavy + pulls a chunk of process-only types. Stub to a
// marker div so this test stays scoped to the wrapper's branching logic.
vi.mock('@/renderer/pages/team/TeamPage', () => ({
  default: ({ team }: { team: { id: string; name: string } }) => (
    <div data-testid='real-team-page'>{team.name}</div>
  ),
}));

import TeamIndex from '@/renderer/pages/team/index';

function renderAtTeamRoute(teamId = 'team-zombie') {
  return render(
    <MemoryRouter initialEntries={[`/team/${teamId}`]}>
      <Routes>
        <Route path='/team/:id' element={<TeamIndex />} />
        {/* Capture navigation target so we can assert NO redirect happened. */}
        <Route path='/teams' element={<div data-testid='teams-library-fallback' />} />
        <Route
          path='/teams/:id/launch'
          element={<div data-testid='team-launcher-fallback' />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('TeamIndex null-team handling', () => {
  it('renders an in-place error state when team.get resolves to null (does NOT redirect to launcher)', () => {
    mockUseSWR.mockReturnValue({ data: null, isLoading: false });
    renderAtTeamRoute();

    // In-place error is visible
    const errorBlock = screen.getByTestId('team-page-load-error');
    expect(errorBlock).toBeTruthy();
    expect(screen.getByText('This team could not be loaded')).toBeTruthy();
    expect(screen.getByTestId('team-page-load-error-back-cta')).toBeTruthy();

    // Critically: the launcher fallback route was NOT activated by a redirect.
    expect(screen.queryByTestId('team-launcher-fallback')).toBeNull();
    // And we did not render the real TeamPage either.
    expect(screen.queryByTestId('real-team-page')).toBeNull();
  });

  it('clicking the Back to Teams CTA navigates to /teams', () => {
    mockUseSWR.mockReturnValue({ data: null, isLoading: false });
    renderAtTeamRoute();

    expect(screen.queryByTestId('teams-library-fallback')).toBeNull();
    fireEvent.click(screen.getByTestId('team-page-load-error-back-cta'));
    expect(screen.getByTestId('teams-library-fallback')).toBeTruthy();
  });

  it('still renders the real TeamPage when team.get returns a non-null record', () => {
    mockUseSWR.mockReturnValue({ data: { id: 'team-alive', name: 'Alive' }, isLoading: false });
    renderAtTeamRoute('team-alive');
    expect(screen.getByTestId('real-team-page').textContent).toBe('Alive');
    expect(screen.queryByTestId('team-page-load-error')).toBeNull();
  });
});
