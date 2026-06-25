/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Home-screen model picker (Packet 2E) - behavior contract.
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
// Mocks - i18n echoes the key (+ interpolation) so assertions read clean.
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

// `vi.hoisted` lifts the mock above the `vi.mock` hoist so the mock factory
// can reference `mockNavigate` (which the tests assert against).
const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lucide-react')>()),
  Brain: () => <span>Brain</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronRight: () => <span>ChevronRight</span>,
  Pin: () => <span>Pin</span>,
  Plus: () => <span>Plus</span>,
  Search: () => <span>Search</span>,
}));

vi.mock('@/renderer/styles/colors', () => ({
  iconColors: { primary: '#000', secondary: '#666' },
}));

// Arco partial mock - the real package is heavy; the Dropdown renders ONLY
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
  // The picker added an Arco search Input above the model list (Packet 3B).
  const Input = ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string;
    onChange?: (v: string) => void;
    placeholder?: string;
  }) => <input value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} />;
  return {
    Button: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
    Dropdown: ({ droplist }: React.PropsWithChildren & { droplist?: React.ReactNode }) => <>{droplist}</>,
    Input,
    Menu,
    Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

// useModelRegistry - `curatedForAgent` is consumed by both the picker's own
// fetch and the delegated `useModelSelectorViewModel`. `registryVersion` is
// read by the view-model hook's effect deps.
const mockCuratedForAgent = vi.fn();
vi.mock('@/renderer/hooks/useModelRegistry', () => ({
  useModelRegistry: () => ({ curatedForAgent: mockCuratedForAgent, registryVersion: 0 }),
}));

// The home picker now delegates rendering to the shared `ModelSelectorFlyout`
// via `useModelSelectorViewModel`, which composes these three sources. Mock
// them deterministically (flux off, no pins, no recents) so the view model is
// driven purely by `curatedForAgent` - the behavior these tests assert.
vi.mock('@/renderer/hooks/useFluxConnected', () => ({
  useFluxConnected: () => false,
}));
vi.mock('@/renderer/hooks/usage/usePinnedModels', () => ({
  pinKey: (providerId: string, modelId: string) => `${providerId}:${modelId}`,
  usePinnedModels: () => ({ pinned: new Set<string>(), toggle: vi.fn() }),
}));
vi.mock('@/renderer/hooks/usage/useRecentlyUsedModels', () => ({
  useRecentlyUsedModels: () => ({ models: [], loading: false }),
}));

// `ipcBridge.modelRegistry.resolveForChatStart` - the chat-start refactor
// (Packet 3B) replaced the legacy `modelList` lookup with this IPC call.
const { mockResolveForChatStart } = vi.hoisted(() => ({ mockResolveForChatStart: vi.fn() }));
vi.mock('@/common', () => ({
  ipcBridge: {
    modelRegistry: {
      resolveForChatStart: { invoke: mockResolveForChatStart },
    },
    // GuidModelSelector fires fire-and-forget usage telemetry on selection
    // (useUsageTelemetry -> ipcBridge.usage.recordEvent.invoke). Without this
    // namespace the call reads `.recordEvent` off undefined and the rejection
    // escapes after the test completes, failing the whole shard.
    usage: {
      recordEvent: { invoke: vi.fn().mockResolvedValue(undefined) },
      // The delegated flyout's recently-used zone queries this on open.
      queryRecentlyUsedModels: { invoke: vi.fn().mockResolvedValue([]) },
    },
  },
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
  mockNavigate.mockReset();
  mockResolveForChatStart.mockReset();
  // Default to a benign not-connected result so the cold-start auto-pick effect
  // (which now fires on mount for a provider-agent picker with no selection)
  // resolves cleanly and stays silent in tests that don't exercise it.
  mockResolveForChatStart.mockResolvedValue({ ok: false, error: 'not-connected' });
  baseProps.setCurrentModel.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// costToPriceTier - pure unit
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
// GuidModelSelector - home picker
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

  it('renders one row per curated model in the provider picker', async () => {
    mockCuratedForAgent.mockResolvedValue(CLAUDE_MODELS);

    render(<GuidModelSelector {...baseProps} agentKey='wcore' />);

    // The provider-based picker (ModelSelectorPanel) lists each curated model
    // by display name. Price-tier glyphs are exercised by the costToPriceTier
    // unit tests above; the inline tier badge now renders only on the ACP
    // cached-model path, not in this curated panel.
    expect(await screen.findByText('Claude Opus 4.7')).toBeInTheDocument();
    expect(screen.getByText('Claude Haiku 4.5')).toBeInTheDocument();
  });

  it('renders the curated models through the shared flyout', async () => {
    mockCuratedForAgent.mockResolvedValue(CLAUDE_MODELS);

    // The home picker delegates to ModelSelectorFlyout; the scope caption is a
    // dropped home-only affordance. Verify the flyout's own title + rows render.
    render(<GuidModelSelector {...baseProps} agentKey='claude' />);

    expect(await screen.findByText('Claude Opus 4.7')).toBeInTheDocument();
    expect(screen.getByText('conversation.modelSelector.title')).toBeInTheDocument();
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

  it('shows the empty-state card when the agent has no curated models', async () => {
    mockCuratedForAgent.mockResolvedValue([]);

    // Flux is mocked off + no curated models => the flyout's empty card.
    render(<GuidModelSelector {...baseProps} agentKey='claude' />);

    expect(await screen.findByText('conversation.modelSelector.emptyTitle')).toBeInTheDocument();
    expect(screen.getByText('conversation.modelSelector.connectProvider')).toBeInTheDocument();
  });

  it('navigates to the new /settings/models route when the resolver reports the provider is not connected', async () => {
    // The chat-start refactor (Packet 3B) replaces the legacy `modelList`
    // lookup with `modelRegistry.resolveForChatStart`. If the resolver returns
    // `not-connected`, the picker routes the user to the Models page.
    mockCuratedForAgent.mockResolvedValue([
      curated({ id: 'unknown-model', providerId: 'mistral', displayName: 'Unknown', family: 'X' }),
    ]);
    mockResolveForChatStart.mockResolvedValue({ ok: false, error: 'not-connected' });
    const fireEventClick = (await import('@testing-library/react')).fireEvent.click;
    const setCurrentModel = vi.fn().mockResolvedValue(undefined);

    render(<GuidModelSelector {...baseProps} agentKey='wcore' modelList={[]} setCurrentModel={setCurrentModel} />);

    const row = await screen.findByText('Unknown');
    fireEventClick(row);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/settings/models'));
    expect(setCurrentModel).not.toHaveBeenCalled();
  });

  it('falls back to the first curated model when the pinned one is no longer curated (Packet 3B graceful fallback)', async () => {
    // A chat pinned to an older model id (e.g. one that fell out of the
    // catalog after the migration) must not silently keep dispatching against
    // a model the user can no longer pick. The picker auto-routes to
    // `curated[0]` via the regular resolve+pick flow.
    mockCuratedForAgent.mockResolvedValue([
      curated({
        id: 'claude-sonnet-4-7',
        providerId: 'anthropic',
        displayName: 'Claude Sonnet 4.7',
        family: 'Claude Sonnet',
      }),
    ]);
    mockResolveForChatStart.mockResolvedValue({
      ok: true,
      provider: {
        id: 'anthropic',
        providerId: 'anthropic',
        name: 'Anthropic',
        platform: 'anthropic',
        modelId: 'claude-sonnet-4-7',
        baseUrl: 'https://api.anthropic.com',
        apiKey: 'sk-ant',
      },
    });
    const setCurrentModel = vi.fn().mockResolvedValue(undefined);
    // Pin a model id that is NOT in the curated set.
    const droppedCurrent = {
      id: 'anthropic',
      platform: 'anthropic',
      name: 'Anthropic',
      baseUrl: '',
      apiKey: '',
      useModel: 'claude-1-deprecated',
    } as unknown as typeof baseProps.currentModel;

    render(
      <GuidModelSelector
        {...baseProps}
        agentKey='claude'
        currentModel={droppedCurrent}
        setCurrentModel={setCurrentModel}
      />
    );

    // Effect fires once after curated resolves; it should call resolveForChatStart
    // with the FALLBACK model (curated[0]), not the pinned one.
    await waitFor(() => expect(mockResolveForChatStart).toHaveBeenCalled());
    expect(mockResolveForChatStart).toHaveBeenCalledWith({
      providerId: 'anthropic',
      modelId: 'claude-sonnet-4-7',
    });
    await waitFor(() => expect(setCurrentModel).toHaveBeenCalledTimes(1));
    const arg = setCurrentModel.mock.calls[0][0];
    expect(arg.useModel).toBe('claude-sonnet-4-7');
  });

  it('auto-picks the recommended curated model on cold start when nothing is selected', async () => {
    // Remote/headless WebUI: the legacy getModelConfig-based default can resolve
    // empty, so the registry curated list drives the cold-start default. With no
    // selection at all, the home auto-picks the first safe model through the
    // chat-start path so a brand-new user is not stranded on "No model configured
    // yet" until they manually open the picker.
    mockCuratedForAgent.mockResolvedValue([
      curated({ id: 'flux-auto', providerId: 'flux-router', displayName: 'Flux Auto', family: 'Flux' }),
    ]);
    mockResolveForChatStart.mockResolvedValue({
      ok: true,
      provider: {
        id: 'flux-router',
        providerId: 'flux-router',
        name: 'Flux Router',
        platform: 'openai-compatible',
        modelId: 'flux-auto',
        baseUrl: '',
        accountId: 'default',
      },
    });
    const setCurrentModel = vi.fn().mockResolvedValue(undefined);

    render(<GuidModelSelector {...baseProps} agentKey='wcore' setCurrentModel={setCurrentModel} />);

    await waitFor(() =>
      expect(mockResolveForChatStart).toHaveBeenCalledWith({ providerId: 'flux-router', modelId: 'flux-auto' })
    );
    await waitFor(() => expect(setCurrentModel).toHaveBeenCalledTimes(1));
    expect(setCurrentModel.mock.calls[0][0].useModel).toBe('flux-auto');
    // Silent: the cold-start pick must never navigate the user off /guid.
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not fire the graceful fallback when the pinned model is still curated', async () => {
    mockCuratedForAgent.mockResolvedValue([
      curated({ id: 'claude-opus', providerId: 'anthropic', displayName: 'Claude Opus 4.7', family: 'Claude Opus' }),
    ]);
    const setCurrentModel = vi.fn().mockResolvedValue(undefined);
    const pinned = {
      id: 'anthropic',
      platform: 'anthropic',
      name: 'Anthropic',
      baseUrl: '',
      apiKey: '',
      useModel: 'claude-opus',
    } as unknown as typeof baseProps.currentModel;

    render(
      <GuidModelSelector {...baseProps} agentKey='claude' currentModel={pinned} setCurrentModel={setCurrentModel} />
    );

    // Wait for the curated set to settle, then assert no resolve was triggered.
    await screen.findByText('Claude Opus 4.7');
    expect(mockResolveForChatStart).not.toHaveBeenCalled();
    expect(setCurrentModel).not.toHaveBeenCalled();
  });

  it('renders a price tier on ACP-mode rows via fuzzy-matching against the curated set', async () => {
    // Wave 4B R3 fix: ACP-mode CLI options (Claude Code, etc.) use short ids
    // like `sonnet`/`haiku`/`opus` that never equal a curated model id like
    // `claude-sonnet-4-5`. The tier resolver must fuzzy-match on family /
    // displayName tokens so the $ / $$ / $$$ badge actually renders.
    mockCuratedForAgent.mockResolvedValue([
      curated({
        id: 'claude-sonnet-4-5',
        providerId: 'anthropic',
        displayName: 'Claude Sonnet 4.5',
        family: 'claude-sonnet',
        costInPerM: 3,
        costOutPerM: 15,
      }),
      curated({
        id: 'claude-haiku-4-5',
        providerId: 'anthropic',
        displayName: 'Claude Haiku 4.5',
        family: 'claude-haiku',
        costInPerM: 0.8,
        costOutPerM: 4,
      }),
      curated({
        id: 'claude-opus-4-5',
        providerId: 'anthropic',
        displayName: 'Claude Opus 4.5',
        family: 'claude-opus',
        costInPerM: 5,
        costOutPerM: 25,
      }),
    ]);
    const acpInfo = {
      currentModelId: 'sonnet',
      currentModelLabel: 'Sonnet',
      availableModels: [
        { id: 'default', label: 'Default (recommended)' },
        { id: 'sonnet', label: 'Sonnet' },
        { id: 'sonnet[1m]', label: 'Sonnet (1M context)' },
        { id: 'haiku', label: 'Haiku' },
      ],
      canSwitch: true,
      source: 'models' as const,
      sourceDetail: 'acp-models',
    };
    render(
      <GuidModelSelector
        {...baseProps}
        isGeminiMode={false}
        agentKey='claude'
        currentAcpCachedModelInfo={acpInfo}
        selectedAcpModel='sonnet'
      />
    );

    // Sonnet (3/15) blended ≈ 12 → $$. Haiku (0.8/4) blended ≈ 3.2 → $.
    // Two rows match Sonnet (regular + 1M context); both should render $$.
    await screen.findByText('Sonnet');
    expect(screen.getAllByText('$$').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('passes the non-secret chat-start handle through to setCurrentModel (audit C4)', async () => {
    // The resolver hands back the NON-SECRET handle (platform + baseUrl +
    // account binding) - no decrypted key. The picker writes the binding into
    // `currentModel`; `apiKey` stays empty and is resolved in main at spawn.
    mockCuratedForAgent.mockResolvedValue([
      curated({ id: 'gpt-5', providerId: 'openai', displayName: 'GPT-5.5', family: 'GPT-5' }),
    ]);
    mockResolveForChatStart.mockResolvedValue({
      ok: true,
      provider: {
        id: 'openai',
        providerId: 'openai',
        name: 'OpenAI',
        platform: 'openai',
        modelId: 'gpt-5',
        baseUrl: 'https://api.openai.com/v1',
        accountId: 'default',
      },
    });
    const fireEventClick = (await import('@testing-library/react')).fireEvent.click;
    const setCurrentModel = vi.fn().mockResolvedValue(undefined);

    render(<GuidModelSelector {...baseProps} agentKey='codex' modelList={[]} setCurrentModel={setCurrentModel} />);

    const row = await screen.findByText('GPT-5.5');
    // The cold-start auto-pick fires resolveForChatStart→setCurrentModel once on
    // mount (no prior selection). Clear it so this assertion counts only the
    // explicit click being tested here.
    setCurrentModel.mockClear();
    fireEventClick(row);

    await waitFor(() => expect(setCurrentModel).toHaveBeenCalledTimes(1));
    expect(mockResolveForChatStart).toHaveBeenCalledWith({ providerId: 'openai', modelId: 'gpt-5' });
    const arg = setCurrentModel.mock.calls[0][0];
    expect(arg.platform).toBe('openai');
    // No plaintext key crosses IPC - it is resolved in main at dispatch.
    expect(arg.apiKey).toBe('');
    expect(arg.accountId).toBe('default');
    expect(arg.useModel).toBe('gpt-5');
    expect(arg.baseUrl).toBe('https://api.openai.com/v1');
  });
});
