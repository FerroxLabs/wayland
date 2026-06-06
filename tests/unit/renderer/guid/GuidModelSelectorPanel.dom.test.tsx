/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// react-i18next mock - returns a tiny in-test translation map for the keys
// the panel actually renders, and interpolates {{var}} from the options bag.
// Unknown keys fall through as the raw key so the tests stay deterministic
// without pulling in the real locale files.
const TR: Record<string, string> = {
  'common.loading': 'Loading',
  'common.defaultModel': 'Default model',
  'settings.addModel': 'Add a model',
  'settings.modelsPage.homePicker.empty': 'No models available for this agent yet.',
  'settings.modelsPage.homePicker.searchPlaceholder': 'Search models - by name or provider',
  'settings.modelsPage.homePicker.searchMatches': '{{count}} matches',
  'settings.modelsPage.homePicker.searchNoMatches': 'No models match your search.',
  'settings.modelsPage.homePicker.sectionRecommended': 'Recommended',
  'settings.modelsPage.homePicker.sectionRecommendedSubtitle': 'flagships per provider',
  'settings.modelsPage.homePicker.sectionFrequentlyUsed': 'Frequently used',
  'settings.modelsPage.homePicker.sectionFrequentlyUsedSubtitle': 'learned from your use',
  'settings.modelsPage.homePicker.sectionAllProvider': 'All {{provider}} models',
  'settings.modelsPage.homePicker.frequentlyUsedEmptyTitle': 'Nothing here yet.',
  'settings.modelsPage.homePicker.frequentlyUsedEmptyBody':
    "Pick a model and we'll surface your favorites here as you go.",
  'settings.modelsPage.homePicker.useCountBadge': '{{count}} uses',
  'settings.modelsPage.homePicker.badgeFlagship': 'flagship',
  'settings.modelsPage.homePicker.badgePreview': 'preview',
  'settings.modelsPage.homePicker.badgeLegacy': 'legacy',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const tpl = TR[key] ?? key;
      if (!options) return tpl;
      return tpl.replace(/{{\s*(\w+)\s*}}/g, (_, name: string) => String(options[name] ?? ''));
    },
  }),
}));

// react-router stub - the panel itself doesn't use the navigate hook, but the
// surrounding selector default export does. The panel under test never reads
// react-router so this is just defensive.
vi.mock('react-router-dom', () => ({
  useNavigate: () => () => undefined,
}));

// Module under test must come AFTER the i18next mock so it picks the stub up.
const fuMock = vi.hoisted(() => ({
  useFrequentlyUsedModels: vi.fn(() => ({ models: [], loading: false })),
}));
vi.mock('@/renderer/hooks/usage/useFrequentlyUsedModels', () => fuMock);

import { ModelSelectorPanel } from '@/renderer/pages/guid/components/GuidModelSelector';
import type { CuratedModel, ProviderId } from '@process/providers/types';

const m = (
  id: string,
  providerId: ProviderId,
  displayName: string,
  opts: {
    recommended?: boolean;
    role?: 'flagship' | 'previous' | 'fast';
    family?: string;
    status?: 'available' | 'preview' | 'deprecated';
  } = {}
): CuratedModel => ({
  id,
  providerId,
  displayName,
  family: opts.family ?? displayName,
  kind: 'text',
  enriched: true,
  tags: [],
  recommended: opts.recommended ?? false,
  enabled: opts.recommended ?? false,
  role: opts.role,
  status: opts.status ?? 'available',
});

const CURATED: CuratedModel[] = [
  m('claude-opus-4-7', 'anthropic', 'Opus 4.7', { recommended: true, role: 'flagship' }),
  m('claude-sonnet-4-6', 'anthropic', 'Sonnet 4.6', { recommended: true, role: 'previous' }),
  m('claude-haiku-4-5', 'anthropic', 'Haiku 4.5'),
  m('gemini-3-pro', 'google-gemini', 'Gemini 3 Pro', { recommended: true, role: 'flagship' }),
  m('gemini-3-flash', 'google-gemini', 'Gemini 3 Flash'),
  m('antigravity-preview', 'google-gemini', 'Antigravity Preview', { status: 'preview' }),
  m('gpt-5-5', 'openai', 'GPT-5.5', { recommended: true, role: 'flagship' }),
  m('legacy-model', 'openai', 'Legacy GPT-3.5', { status: 'deprecated' }),
];

const baseProps = {
  agentKey: 'gemini',
  curated: CURATED,
  selectedCuratedKey: 'anthropic:claude-opus-4-7',
  selectedProviderId: 'anthropic' as ProviderId,
  onPick: vi.fn(),
  onAddProvider: vi.fn(),
  scopeCaption: 'Pick the model your agent will think with.',
  panelOpen: true,
  recordTelemetry: vi.fn(),
};

describe('<ModelSelectorPanel>', () => {
  beforeEach(() => {
    fuMock.useFrequentlyUsedModels.mockReturnValue({ models: [], loading: false });
    baseProps.onPick.mockReset?.();
    baseProps.onAddProvider.mockReset?.();
  });

  it('renders the Recommended section with provider sub-headers', () => {
    render(<ModelSelectorPanel {...baseProps} onPick={vi.fn()} onAddProvider={vi.fn()} />);
    // Section head present (exact match - avoids colliding with the subtitle).
    expect(screen.getByText(/^★ Recommended$/)).toBeTruthy();
    // Recommended models surface; non-recommended Haiku does not appear under
    // Recommended but does appear inside the "All Anthropic" collapse.
    expect(screen.getAllByText('Opus 4.7').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sonnet 4.6').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GPT-5.5').length).toBeGreaterThan(0);
    // Provider sub-headers visible (Anthropic, Google, OpenAI in Recommended).
    expect(screen.getAllByText('Anthropic').length).toBeGreaterThan(0);
  });

  it('shows the empty-state copy when no frequently-used models', () => {
    render(<ModelSelectorPanel {...baseProps} />);
    expect(screen.getByText('Nothing here yet.')).toBeTruthy();
  });

  it('renders Frequently used rows when the hook returns data', () => {
    fuMock.useFrequentlyUsedModels.mockReturnValue({
      models: [
        { modelId: 'claude-sonnet-4-6', useCount: 42, lastUsedMs: 1_000 },
        { modelId: 'gpt-5-5', useCount: 18, lastUsedMs: 900 },
      ],
      loading: false,
    });
    render(<ModelSelectorPanel {...baseProps} />);
    // Empty state must NOT be present
    expect(screen.queryByText('Nothing here yet.')).toBeNull();
    // Interpolated badge text appears
    expect(screen.getByText('42 uses')).toBeTruthy();
    expect(screen.getByText('18 uses')).toBeTruthy();
  });

  it('filters across all sections when a search query is entered', () => {
    render(<ModelSelectorPanel {...baseProps} />);
    const input = screen.getByPlaceholderText('Search models - by name or provider');
    fireEvent.change(input, { target: { value: 'sonnet' } });
    // Match count shows
    expect(screen.getByText('1 matches')).toBeTruthy();
    // Sonnet 4.6 is the single match
    expect(screen.queryByText('Opus 4.7')).toBeNull();
    expect(screen.queryByText('Haiku 4.5')).toBeNull();
    // Sonnet name appears (wrapped in the highlight span - the visible text
    // is still "Sonnet 4.6" via concatenated child nodes).
    expect(screen.queryByText('GPT-5.5')).toBeNull();
  });

  it('shows the "no matches" empty state for an unmatched query', () => {
    render(<ModelSelectorPanel {...baseProps} />);
    const input = screen.getByPlaceholderText('Search models - by name or provider');
    fireEvent.change(input, { target: { value: 'xyzzy-no-such-model' } });
    expect(screen.getByText('No models match your search.')).toBeTruthy();
  });

  it('fires onPick when a model row is clicked', () => {
    const onPick = vi.fn();
    render(<ModelSelectorPanel {...baseProps} onPick={onPick} />);
    // Click the first Sonnet row (rendered in Recommended).
    const targets = screen.getAllByText('Sonnet 4.6');
    fireEvent.click(targets[0]);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].id).toBe('claude-sonnet-4-6');
  });

  it('renders the loading state until curated resolves', () => {
    render(<ModelSelectorPanel {...baseProps} curated={undefined} />);
    expect(screen.getByText('Loading')).toBeTruthy();
  });

  it('shows the empty curated state when curated array is empty', () => {
    render(<ModelSelectorPanel {...baseProps} curated={[]} />);
    expect(screen.getByText('No models available for this agent yet.')).toBeTruthy();
  });

  it('default-expands the All section for the selected provider', () => {
    render(<ModelSelectorPanel {...baseProps} />);
    // The "All Anthropic models" section default-opens; Haiku (non-recommended,
    // in Anthropic) should render in the All section.
    expect(screen.getAllByText('Haiku 4.5').length).toBeGreaterThan(0);
  });

  it('does NOT auto-expand other provider sections', () => {
    render(<ModelSelectorPanel {...baseProps} />);
    // Antigravity preview is google-gemini, non-recommended; selectedProvider
    // is anthropic. Google section is collapsed → preview row not in DOM.
    expect(screen.queryByText('Antigravity Preview')).toBeNull();
  });

  it('toggles a provider section when its header is clicked', () => {
    render(<ModelSelectorPanel {...baseProps} />);
    // "All Google models" header (after interpolation via the test t-mock).
    const heading = screen.getByText('All Google models');
    fireEvent.click(heading);
    // After click the Google section opens and the preview model shows.
    expect(screen.getByText('Antigravity Preview')).toBeTruthy();
  });
});
