/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Home-screen model picker (Packet 2E) — behavior contract.
 *
 * Covers the spec §4.8 surface:
 *  - the picker reads the curated set scoped to the selected agent via
 *    `useModelRegistry().curatedForAgent(agentKey)`
 *  - switching the selected agent re-scopes the model list (a different
 *    `curatedForAgent` result)
 *  - each curated row shows a $/$$/$$$ price tier derived from cost
 *  - a one-line plain-language scope caption renders inline at the picker
 *  - an agent with no curated models (`curatedForAgent` → []) shows a
 *    sensible message, not a blank picker
 *
 * `useModelRegistry` is mocked so `curatedForAgent` is fully controlled;
 * `@arco-design/web-react` is partial-mocked (the `Dropdown` renders its
 * droplist inline so the menu rows are queryable without opening it).
 * The `.dom.test.tsx` suffix runs the file in the jsdom Vitest project.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CuratedModel } from '../../../src/process/providers/types';
import { costToPriceTier } from '../../../src/renderer/pages/guid/components/GuidModelSelector';

// ---------------------------------------------------------------------------
// Mocks — i18n echoes the key (+ interpolation) so assertions read clean.
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts === 'object') {
        let out = key;
        for (const [k, v] of Object.entries(opts)) {
          if (k === 'defaultValue') continue;
          out += `:${k}=${String(v)}`;
        }
        return out;
      }
      return key;
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Brain: () => <span>Brain</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  Plus: () => <span>Plus</span>,
}));

vi.mock('@/renderer/styles/colors', () => ({
  iconColors: { primary: '#000', secondary: '#666' },
}));

// Arco partial mock — the real package is heavy; the Dropdown renders ONLY
// its droplist (not its trigger button) so menu rows are queryable inline
// and the trigger's selected-model label doesn't duplicate row text.
vi.mock('@arco-design/web-react', () => {
  const Menu = Object.assign(({ children }: React.PropsWithChildren) => <div>{children}</div>, {
    Item: ({ children, onClick }: React.PropsWithChildren & { onClick?: (e: unknown) => void }) => (
      <div role='menuitem' onClick={onClick}>
        {children}
      </div>
    ),
    ItemGroup: ({ children, title }: React.PropsWithChildren & { title?: React.ReactNode }) => (
      <div>
        <div>{title}</div>
        {children}
      </div>
    ),
  });
  return {
    Button: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
    Dropdown: ({ droplist }: React.PropsWithChildren & { droplist?: React.ReactNode }) => <>{droplist}</>,
    Menu,
    Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

// useModelRegistry — only `curatedForAgent` is consumed by the picker.
const mockCuratedForAgent = vi.fn();
vi.mock('@/renderer/hooks/useModelRegistry', () => ({
  useModelRegistry: () => ({ curatedForAgent: mockCuratedForAgent }),
}));

// Import after mocks are registered.
import GuidModelSelector from '@/renderer/pages/guid/components/GuidModelSelector';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function curated(over: Partial<CuratedModel>): CuratedModel {
  return {
    id: 'model-id',
    providerId: 'anthropic',
    displayName: 'A Model',
    family: 'Claude',
    kind: 'text',
    enriched: true,
    recommended: true,
    enabled: true,
    ...over,
  };
}

const CLAUDE_MODELS: CuratedModel[] = [
  curated({
    id: 'claude-opus',
    displayName: 'Claude Opus 4.7',
    family: 'Claude Opus',
    costInPerM: 15,
    costOutPerM: 75,
  }),
  curated({
    id: 'claude-haiku',
    displayName: 'Claude Haiku 4.5',
    family: 'Claude Haiku',
    costInPerM: 0.8,
    costOutPerM: 4,
  }),
];

const GPT_MODELS: CuratedModel[] = [
  curated({
    id: 'gpt-5',
    providerId: 'openai',
    displayName: 'GPT-5.5',
    family: 'GPT-5',
    costInPerM: 5,
    costOutPerM: 15,
  }),
];

const baseProps = {
  isGeminiMode: true,
  modelList: [],
  currentModel: undefined,
  setCurrentModel: vi.fn().mockResolvedValue(undefined),
  currentAcpCachedModelInfo: null,
  selectedAcpModel: null,
  setSelectedAcpModel: vi.fn(),
};

beforeEach(() => {
  mockCuratedForAgent.mockReset();
  baseProps.setCurrentModel.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// costToPriceTier — pure unit
// ---------------------------------------------------------------------------

describe('costToPriceTier', () => {
  it('returns null when the model has no cost data', () => {
    expect(costToPriceTier(undefined, undefined)).toBeNull();
  });

  it('maps cheap models to $', () => {
    expect(costToPriceTier(0.5, 1.5)).toBe('$');
  });

  it('maps mid-tier models to $$', () => {
    expect(costToPriceTier(5, 15)).toBe('$$');
  });

  it('maps premium models to $$$', () => {
    expect(costToPriceTier(15, 75)).toBe('$$$');
  });
});

// ---------------------------------------------------------------------------
// GuidModelSelector — home picker
// ---------------------------------------------------------------------------

describe('GuidModelSelector home picker', () => {
  it('reads the curated set scoped to the selected agent', async () => {
    mockCuratedForAgent.mockResolvedValue(CLAUDE_MODELS);

    render(<GuidModelSelector {...baseProps} agentKey='wcore' />);

    await waitFor(() => {
      expect(mockCuratedForAgent).toHaveBeenCalledWith('wcore');
    });
    expect(await screen.findByText('Claude Opus 4.7')).toBeInTheDocument();
    expect(screen.getByText('Claude Haiku 4.5')).toBeInTheDocument();
  });

  it('renders a price tier per curated row', async () => {
    mockCuratedForAgent.mockResolvedValue(CLAUDE_MODELS);

    render(<GuidModelSelector {...baseProps} agentKey='wcore' />);

    // Opus (15/75) → $$$, Haiku (0.8/4) → $.
    expect(await screen.findByText('$$$')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders the plain-language scope caption inline', async () => {
    mockCuratedForAgent.mockResolvedValue(CLAUDE_MODELS);

    // 'claude' resolves to the `scope.claude` plain-language sentence.
    render(<GuidModelSelector {...baseProps} agentKey='claude' />);

    expect(await screen.findByText('settings.agentsPage.scope.claude')).toBeInTheDocument();
  });

  it('re-scopes the model list when the selected agent changes', async () => {
    mockCuratedForAgent.mockImplementation((agentKey: string) =>
      Promise.resolve(agentKey === 'codex' ? GPT_MODELS : CLAUDE_MODELS)
    );

    const { rerender } = render(<GuidModelSelector {...baseProps} agentKey='claude' />);
    expect(await screen.findByText('Claude Opus 4.7')).toBeInTheDocument();

    rerender(<GuidModelSelector {...baseProps} agentKey='codex' />);

    await waitFor(() => {
      expect(mockCuratedForAgent).toHaveBeenCalledWith('codex');
    });
    expect(await screen.findByText('GPT-5.5')).toBeInTheDocument();
    expect(screen.queryByText('Claude Opus 4.7')).not.toBeInTheDocument();
  });

  it('shows a sensible message when the agent has no curated models', async () => {
    mockCuratedForAgent.mockResolvedValue([]);

    render(<GuidModelSelector {...baseProps} agentKey='claude' />);

    expect(await screen.findByText('settings.modelsPage.homePicker.empty')).toBeInTheDocument();
  });

  it('resolves the right provider when two configured providers expose the same model id', async () => {
    mockCuratedForAgent.mockResolvedValue([
      curated({ id: 'gpt-5', providerId: 'openai', displayName: 'GPT-5.5', family: 'GPT-5' }),
    ]);
    // Two configured providers both list `gpt-5` (a `new-api` gateway and the
    // real OpenAI provider). The curated row's `providerId` is `'openai'`,
    // matching the second row's `platform` — the picker must pick that one,
    // not the gateway whose `platform` is `'new-api'`.
    const fireEventClick = (await import('@testing-library/react')).fireEvent.click;
    const setCurrentModel = vi.fn().mockResolvedValue(undefined);
    const modelList = [
      // Wrong provider — shares the model id via a gateway.
      {
        id: 'uuid-gateway',
        platform: 'new-api',
        name: 'Gateway',
        baseUrl: 'https://gateway.example',
        apiKey: '',
        model: ['gpt-5'],
      },
      // Correct provider — `platform === providerId`.
      {
        id: 'uuid-openai',
        platform: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com',
        apiKey: '',
        model: ['gpt-5'],
      },
    ] as unknown as typeof baseProps.modelList;

    render(
      <GuidModelSelector {...baseProps} agentKey='codex' modelList={modelList} setCurrentModel={setCurrentModel} />
    );

    const row = await screen.findByText('GPT-5.5');
    fireEventClick(row);

    await waitFor(() => expect(setCurrentModel).toHaveBeenCalledTimes(1));
    const arg = setCurrentModel.mock.calls[0][0];
    expect(arg.platform).toBe('openai');
    expect(arg.id).toBe('uuid-openai');
    expect(arg.useModel).toBe('gpt-5');
  });
});
