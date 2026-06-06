/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Integration test for the /teams library page (W2a). Verifies:
 *  - Standing Companies sub-group renders exactly 5 cards
 *  - Teams sub-group renders exactly 19 cards
 *  - BuildMyOwn dashed card renders at the end of the Teams grid
 *  - Specialists (kind !== 'team') are filtered out
 *  - Clicking a team card navigates to /teams/<id>/launch
 *  - Clicking BuildMyOwn navigates to /teams/new
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const STANDING_IDS = ['customer-success-org', 'dev-shop', 'editorial-newsroom', 'marketing-agency', 'sales-org'];

const NON_STANDING_TEAM_IDS = [
  'cold-outbound',
  'product-launch',
  'sales-pipeline',
  'info-product-launch',
  'validate-before-build',
  'first-customers',
  'fundraise',
  'founder-setup',
  'bootstrap-profit',
  'affiliate-site-engine',
  'support-stack',
  'growth-loop',
  'creator-studio',
  'ecommerce-engine',
  'saas-mvp-sprint',
  'content-studio',
  'service-studio',
  'marketing-strategy',
  'damage-control',
];

const mockAssistants = vi.hoisted(() => {
  const STANDING = ['customer-success-org', 'dev-shop', 'editorial-newsroom', 'marketing-agency', 'sales-org'];
  const TEAMS = [
    'cold-outbound',
    'product-launch',
    'sales-pipeline',
    'info-product-launch',
    'validate-before-build',
    'first-customers',
    'fundraise',
    'founder-setup',
    'bootstrap-profit',
    'affiliate-site-engine',
    'support-stack',
    'growth-loop',
    'creator-studio',
    'ecommerce-engine',
    'saas-mvp-sprint',
    'content-studio',
    'service-studio',
    'marketing-strategy',
    'damage-control',
  ];
  const make = (id: string, kind: 'team' | 'specialist', isStanding = false) => ({
    id,
    name: id,
    nameI18n: { 'en-US': id },
    descriptionI18n: { 'en-US': `${id} description` },
    isBuiltin: false,
    isPreset: true,
    presetAgentType: 'gemini',
    _source: 'extension',
    _kind: kind,
    ...(kind === 'team'
      ? {
          _teammates: ['a', 'b', 'c'],
          _rituals: [{ name: 'standup', cadence: 'daily' }],
          _standing: isStanding,
        }
      : {}),
  });
  return [
    ...STANDING.map((id) => make(id, 'team', true)),
    ...TEAMS.map((id) => make(id, 'team', false)),
    make('research-specialist', 'specialist'),
    make('design-specialist', 'specialist'),
  ];
});

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string; count?: number }) => {
      const fallback = opts?.defaultValue ?? _key;
      if (opts?.count !== undefined) return fallback.replace('{{count}}', String(opts.count));
      return fallback;
    },
  }),
}));

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

// The page reads auth state via useAuth; provide a default so it renders
// without an AuthProvider wrapper.
vi.mock('@renderer/hooks/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue(undefined),
  }),
  AuthProvider: ({ children }: { children?: React.ReactNode }) => children,
}));

import TeamsLibraryPage from '../../../../src/renderer/pages/teams/TeamsLibraryPage';

const renderPage = (initialRoute = '/teams') =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <TeamsLibraryPage />
    </MemoryRouter>
  );

describe('TeamsLibraryPage', () => {
  it('renders Standing Companies sub-group with exactly 5 cards', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('teams-group-standing'));
    const standingGroup = screen.getByTestId('teams-group-standing');
    const standingCards = standingGroup.querySelectorAll('[data-card-variant="standing"]');
    expect(standingCards.length).toBe(5);
    for (const id of STANDING_IDS) {
      expect(standingGroup.querySelector(`[data-testid="team-card-${id}"]`)).not.toBeNull();
    }
  });

  it('renders non-Standing Teams sub-group with exactly 19 cards', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('teams-group-teams'));
    const teamsGroup = screen.getByTestId('teams-group-teams');
    const teamCards = teamsGroup.querySelectorAll('[data-card-variant="team"]');
    expect(teamCards.length).toBe(19);
    for (const id of NON_STANDING_TEAM_IDS) {
      expect(teamsGroup.querySelector(`[data-testid="team-card-${id}"]`)).not.toBeNull();
    }
  });

  it('renders the BuildMyOwn dashed card at the end of the Teams group', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('teams-group-teams'));
    const teamsGroup = screen.getByTestId('teams-group-teams');
    const buildCard = teamsGroup.querySelector('[data-testid="team-card-build-my-own"]');
    expect(buildCard).not.toBeNull();
    expect(buildCard?.parentElement?.lastElementChild).toBe(buildCard);
  });

  it('filters out non-team assistants (specialists) entirely', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('teams-library-page'));
    expect(screen.queryByTestId('team-card-research-specialist')).toBeNull();
    expect(screen.queryByTestId('team-card-design-specialist')).toBeNull();
  });

  it('clicking a team card navigates to /teams/<id>/launch', async () => {
    navigateMock.mockClear();
    renderPage();
    await waitFor(() => screen.getByTestId('team-card-cold-outbound'));
    fireEvent.click(screen.getByTestId('team-card-cold-outbound'));
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/teams/cold-outbound/launch');
    });
  });

  it('clicking BuildMyOwn navigates to /teams/new', async () => {
    navigateMock.mockClear();
    renderPage();
    await waitFor(() => screen.getByTestId('team-card-build-my-own'));
    fireEvent.click(screen.getByTestId('team-card-build-my-own'));
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/teams/new');
    });
  });

  it('action-bar CTA also navigates to /teams/new', async () => {
    navigateMock.mockClear();
    renderPage();
    await waitFor(() => screen.getByTestId('teams-build-my-own-cta'));
    fireEvent.click(screen.getByTestId('teams-build-my-own-cta'));
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/teams/new');
    });
  });

  it('total count reads 24 (5 standing + 19 teams)', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('teams-total-count'));
    expect(screen.getByTestId('teams-total-count').textContent).toContain('24');
  });
});
