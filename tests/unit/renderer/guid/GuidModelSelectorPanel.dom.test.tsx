/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `ModelSelectorPanel` is now a thin adapter: it composes the home data via
 * `useModelSelectorViewModel(agentKey)` and renders the shared
 * `ModelSelectorFlyout`, mapping the flyout's `(modelId, providerId)` selection
 * back to `onPick(CuratedModel)`. The flyout's own rendering/search/empty/more
 * behavior is covered by `tests/unit/renderer/modelSelector/*`; this file only
 * asserts the adapter wiring (rows surface, pick maps to the full model,
 * manage routes through `onAddProvider`).
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// i18n - echo the key (+ interpolation) so assertions read clean.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (!options) return key;
      let out = key;
      for (const [k, v] of Object.entries(options)) {
        if (k === 'defaultValue') continue;
        out += `:${k}=${String(v)}`;
      }
      return out;
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => () => undefined,
}));

// View-model deps - drive the flyout deterministically off `curatedForAgent`.
const mockCuratedForAgent = vi.fn();
vi.mock('@/renderer/hooks/useModelRegistry', () => ({
  useModelRegistry: () => ({ curatedForAgent: mockCuratedForAgent, registryVersion: 0 }),
}));
vi.mock('@/renderer/hooks/useFluxConnected', () => ({ useFluxConnected: () => false }));
const togglePinSpy = vi.fn();
vi.mock('@/renderer/hooks/usage/usePinnedModels', () => ({
  pinKey: (providerId: string, modelId: string) => `${providerId}:${modelId}`,
  usePinnedModels: () => ({ pinned: new Set<string>(), toggle: togglePinSpy }),
}));
vi.mock('@/renderer/hooks/usage/useRecentlyUsedModels', () => ({
  useRecentlyUsedModels: () => ({ models: [], loading: false }),
}));

import { ModelSelectorPanel } from '@/renderer/pages/guid/components/GuidModelSelector';
import type { CuratedModel, ProviderId } from '@process/providers/types';

const m = (
  id: string,
  providerId: ProviderId,
  displayName: string,
  opts: { recommended?: boolean; role?: 'flagship' | 'previous' | 'fast'; family?: string } = {}
): CuratedModel => ({
  id,
  providerId,
  displayName,
  family: opts.family ?? displayName,
  kind: 'text',
  enriched: true,
  tags: [],
  recommended: opts.recommended ?? true,
  enabled: true,
  role: opts.role,
  status: 'available',
});

const CURATED: CuratedModel[] = [
  m('claude-opus-4-7', 'anthropic', 'Opus 4.7', { recommended: true, role: 'flagship' }),
  m('gpt-5-5', 'openai', 'GPT-5.5', { recommended: true, role: 'flagship' }),
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

describe('<ModelSelectorPanel> (delegates to ModelSelectorFlyout)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCuratedForAgent.mockResolvedValue(CURATED);
  });

  it('renders curated models as flyout rows', async () => {
    render(<ModelSelectorPanel {...baseProps} onPick={vi.fn()} />);
    expect(await screen.findByText('Opus 4.7')).toBeInTheDocument();
    expect(screen.getByText('GPT-5.5')).toBeInTheDocument();
  });

  it('maps a row selection back to onPick with the full CuratedModel', async () => {
    const onPick = vi.fn();
    render(<ModelSelectorPanel {...baseProps} onPick={onPick} />);
    const row = await screen.findByText('GPT-5.5');
    fireEvent.click(row);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].id).toBe('gpt-5-5');
    expect(onPick.mock.calls[0][0].providerId).toBe('openai');
  });

  it('routes the footer "Manage models" action through onAddProvider', async () => {
    const onAddProvider = vi.fn();
    render(<ModelSelectorPanel {...baseProps} onAddProvider={onAddProvider} />);
    fireEvent.click(await screen.findByText('conversation.modelSelector.manageModels'));
    expect(onAddProvider).toHaveBeenCalledTimes(1);
  });

  it('shows the empty-state card when no models are curated and flux is off', async () => {
    mockCuratedForAgent.mockResolvedValue([]);
    render(<ModelSelectorPanel {...baseProps} curated={[]} />);
    expect(await screen.findByText('conversation.modelSelector.emptyTitle')).toBeInTheDocument();
  });
});
