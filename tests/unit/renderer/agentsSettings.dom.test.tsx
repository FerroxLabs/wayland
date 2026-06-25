/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Agents settings page (Packet 2D) - behavior contract.
 *
 * Covers the spec §4.7 surface:
 *  - detected agents render as cards / tiles from `acp.get-available-agents`
 *  - every agent states, in a plain sentence, what models it runs
 *    ("runs any model you connect", "Runs Claude models", "Runs GPT models")
 *  - there is NO "family" jargon and no padlock metaphor anywhere on the page
 *  - the remote agents section renders
 *  - the Flux Router card renders live connection status plus the
 *    route-through-Flux toggle (connected) or a Connect CTA (not connected)
 *  - a sub-detector load error surfaces its own warning
 *
 * `ipcBridge` is mocked; the file name uses the `.dom.test.tsx` suffix so it
 * runs in the jsdom Vitest project (the `node` project only matches `.test.ts`).
 * The page uses only declarative Arco components (Avatar / Spin / Alert /
 * Typography), so the real `@arco-design/web-react` is kept unmocked.
 */

import { act, render as rtlRender, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks - i18n returns the *real* en-US strings so the assertions can verify
// the actual plain-language copy (not just key presence).
// ---------------------------------------------------------------------------

import enSettings from '../../../src/renderer/services/i18n/locales/en-US/settings.json';

function lookup(path: string): string | undefined {
  const parts = path.replace(/^settings\./, '').split('.');
  let node: unknown = enSettings;
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      let out = lookup(key);
      if (out === undefined) {
        // Mirror i18next's `defaultValue` fallback.
        if (opts && typeof opts.defaultValue === 'string') return opts.defaultValue;
        return key;
      }
      // Interpolate `{{count}}` etc. so the section labels read clean.
      if (opts && typeof opts === 'object') {
        for (const [k, v] of Object.entries(opts)) {
          if (k === 'defaultValue') continue;
          out = out!.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
        }
      }
      return out;
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => React.createElement('span', null, i18nKey),
}));

// `acp.get-available-agents` / `acp.get-load-errors` IPC surface, plus the
// `system-settings:*-route-through-flux` pair the Flux Router card reads/writes.
const mockGetAvailableAgents = vi.fn();
const mockGetLoadErrors = vi.fn();
const mockGetRouteThroughFlux = vi.fn();
const mockSetRouteThroughFlux = vi.fn();

vi.mock('../../../src/common', () => ({
  ipcBridge: {
    acpConversation: {
      getAvailableAgents: { invoke: (...a: unknown[]) => mockGetAvailableAgents(...a) },
      getLoadErrors: { invoke: (...a: unknown[]) => mockGetLoadErrors(...a) },
    },
    systemSettings: {
      getRouteThroughFlux: { invoke: (...a: unknown[]) => mockGetRouteThroughFlux(...a) },
      setRouteThroughFlux: { invoke: (...a: unknown[]) => mockSetRouteThroughFlux(...a) },
    },
  },
}));

// The Flux Router card reads the connected-provider list from the model
// registry (same source of truth as the Models page hero) and navigates to the
// Models page from its not-connected CTA. Mock both so the card can drive its
// connected / not-connected branches from a single `mockProviders` fixture.
let mockProviders: Array<{ providerId: string }> = [];
let mockLoading = false;
const mockReload = vi.fn(async () => undefined);
const mockNavigate = vi.fn();

vi.mock('../../../src/renderer/hooks/useModelRegistry', () => ({
  useModelRegistry: () => ({ providers: mockProviders, loading: mockLoading, reload: mockReload }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// The per-agent "show in toolbar" toggle reads / writes the persisted hidden
// set through ConfigStorage('agents.hidden'). Back it with an in-memory store
// so the toggle can be driven end-to-end without the IPC bridge.
let mockHiddenStore: string[] = [];
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) => (key === 'agents.hidden' ? mockHiddenStore : undefined)),
    set: vi.fn(async (key: string, value: unknown) => {
      if (key === 'agents.hidden') mockHiddenStore = value as string[];
    }),
  },
}));

// SettingsPageShell is page chrome (breadcrumb, mobile nav, router hooks) -
// stub it to a plain wrapper so the test focuses on the Agents page itself.
vi.mock('../../../src/renderer/pages/settings/components/SettingsPageShell', () => ({
  default: ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) =>
    React.createElement(
      'div',
      { 'data-testid': 'settings-shell' },
      React.createElement('h1', null, title),
      React.createElement('p', null, subtitle),
      children
    ),
}));

// RemoteAgents is the heavy remote-agent CRUD surface (its own modals, SWR,
// IPC). The Agents page only places it under a section header - stub it so
// this test verifies the section renders without exercising remote CRUD.
vi.mock('../../../src/renderer/pages/settings/AgentSettings/RemoteAgents', () => ({
  default: () => React.createElement('div', { 'data-testid': 'remote-agents' }, 'remote agents section'),
}));

// Logo / extension-asset resolution is renderer-utility noise for this test.
vi.mock('../../../src/renderer/utils/model/agentLogo', () => ({
  resolveAgentLogo: () => null,
}));
vi.mock('../../../src/renderer/utils/platform', () => ({
  resolveExtensionAssetUrl: () => undefined,
  // FluxRouterCard (rendered by AgentsSettings) now calls isElectronDesktop();
  // a factory mock replaces the whole module, so this export must be present or
  // the card throws on render. The suite asserts the desktop card behaviour.
  isElectronDesktop: () => true,
}));

// Import after the mocks are registered.
import AgentsSettings from '../../../src/renderer/pages/settings/AgentSettings';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const AGENTS = [
  { backend: 'wcore', name: 'Wayland Core' },
  { backend: 'claude', name: 'Claude Code' },
  { backend: 'codex', name: 'Codex' },
  { backend: 'gemini', name: 'Gemini CLI' },
  { backend: 'qwen', name: 'Qwen Code' },
  // `vibe` is the one non-obvious backend → scope mapping: it maps to the
  // `mistral` scope key ("Runs Mistral models"), not a same-named key.
  { backend: 'vibe', name: 'Vibe CLI' },
];

function agentsOk(data: unknown) {
  return { success: true, data };
}

/**
 * Render with a fresh SWR cache so each test sees its own mocked IPC data -
 * SWR's module-global cache would otherwise leak fixtures between tests.
 */
function render(ui: React.ReactElement) {
  return rtlRender(React.createElement(SWRConfig, { value: { provider: () => new Map(), dedupingInterval: 0 } }, ui));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAvailableAgents.mockResolvedValue(agentsOk(AGENTS));
  mockGetLoadErrors.mockResolvedValue({ success: true, data: [] });
  mockGetRouteThroughFlux.mockResolvedValue(false);
  mockSetRouteThroughFlux.mockResolvedValue(undefined);
  // Default fixture: Flux is connected so the card renders its toggle. The
  // not-connected test resets this to an empty list. `loading` starts resolved
  // (false) so the card renders its real surface instead of the loading Spin.
  mockProviders = [{ providerId: 'flux-router' }];
  mockLoading = false;
  mockHiddenStore = [];
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AgentsSettings (Packet 2D)', () => {
  it('renders a card for each featured agent', async () => {
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    // Wayland Core / Claude Code / Codex are featured cards.
    expect(screen.getAllByTestId('agent-card')).toHaveLength(3);
    expect(screen.getByText('Claude Code')).toBeTruthy();
    expect(screen.getByText('Codex')).toBeTruthy();

    // Gemini / Qwen / Vibe fall into the compact "More detected" tile grid.
    expect(screen.getAllByTestId('agent-tile')).toHaveLength(3);
    expect(screen.getByText('Gemini CLI')).toBeTruthy();
  });

  it('states in plain language what models each agent runs', async () => {
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    // The exact plain-language scope sentences (spec §4.7).
    expect(screen.getByText('Runs any model you connect')).toBeTruthy();
    expect(screen.getByText('Runs Claude models')).toBeTruthy();
    expect(screen.getByText('Runs GPT models')).toBeTruthy();
    expect(screen.getByText('Runs Gemini models')).toBeTruthy();
    expect(screen.getByText('Runs Qwen models')).toBeTruthy();
  });

  it('shows the Flux status chip per backend from the registry classification', async () => {
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    // `wcore`, `claude`, `gemini`, `qwen` are classified `env` -> "Flux ready"
    // chips (several render, so assert on the count, not a single match).
    expect(screen.getAllByText('Flux ready').length).toBeGreaterThanOrEqual(2);
    // `vibe` is classified `vendor` -> "Native only" chip.
    expect(screen.getByText('Native only')).toBeTruthy();
    // `codex` is classified `setup` -> "Flux setup" chip.
    expect(screen.getByText('Flux setup')).toBeTruthy();
  });

  it('renders no Flux chip for a backend with no fluxCompat classification', async () => {
    // `codebuddy` carries no fluxCompat, so its card must not show any chip.
    // (The always-present Wayland Core hero is `env`, so scope the assertion to
    // the codebuddy card rather than the whole page.)
    mockGetAvailableAgents.mockResolvedValue(agentsOk([{ backend: 'codebuddy', name: 'CodeBuddy' }]));
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('CodeBuddy')).toBeTruthy());

    const card = screen.getByText('CodeBuddy').closest('[data-testid="agent-tile"]');
    expect(card).toBeTruthy();
    expect(card!.textContent).not.toContain('Flux ready');
    expect(card!.textContent).not.toContain('Flux setup');
    expect(card!.textContent).not.toContain('Native only');
  });

  it('maps the `vibe` backend to the Mistral scope copy', async () => {
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    // `vibe` is the one non-obvious backend → scope mapping: it resolves to
    // the `mistral` scope key, not a `vibe`-named one (agentScopes.ts).
    expect(screen.getByText('Vibe CLI')).toBeTruthy();
    expect(screen.getByText('Runs Mistral models')).toBeTruthy();
  });

  it('uses no "family" jargon and no padlock metaphor', async () => {
    const { container } = render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    // The redesign explicitly bans "family" jargon and the locked/restricted
    // padlock metaphor for model scope (spec §2, §4.7).
    expect(container.textContent || '').not.toMatch(/family/i);
    expect(container.textContent || '').not.toMatch(/padlock|locked/i);
    expect(container.querySelector('[aria-label*="lock" i]')).toBeNull();
  });

  it('renders the remote agents section', async () => {
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    expect(screen.getByText('Remote agents')).toBeTruthy();
    expect(screen.getByTestId('remote-agents')).toBeTruthy();
  });

  it('renders the Flux Router card with a working route-through toggle when connected', async () => {
    mockGetRouteThroughFlux.mockResolvedValue(true);
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    const card = await screen.findByTestId('flux-router-card');
    expect(card.textContent).toContain('Flux Router');
    // Live status reflects the connected registry provider - no "Coming" copy.
    expect(card.textContent).toContain('Connected');
    expect(card.textContent).not.toContain('Coming');
    expect(card.textContent).toContain('Route all agents through Flux');

    // The toggle reflects the persisted flag (loaded as `true`) and persists a
    // change through the system-settings bridge.
    const toggle = await screen.findByTestId('flux-route-toggle');
    await waitFor(() => expect(toggle.getAttribute('aria-checked')).toBe('true'));

    await act(async () => {
      toggle.click();
    });
    await waitFor(() => expect(mockSetRouteThroughFlux).toHaveBeenCalledWith({ enabled: false }));
    // The toggle's DOM must reflect the new value, guarding against a regression
    // that drops the `setRouteEnabled(enabled)` state update after a successful
    // persist.
    await waitFor(() => expect(toggle.getAttribute('aria-checked')).toBe('false'));
  });

  it('shows a Connect affordance and no toggle when Flux is not connected', async () => {
    mockProviders = [];
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    const card = await screen.findByTestId('flux-router-card');
    expect(card.textContent).toContain('Not connected');
    // No active toggle until Flux is connected.
    expect(screen.queryByTestId('flux-route-toggle')).toBeNull();

    // The not-connected CTA directs the user to the Models page to connect.
    expect(card.textContent).toContain('Connect Flux on the Models page');
    const cta = card.querySelector('button');
    expect(cta).toBeTruthy();
    await act(async () => {
      cta!.click();
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/settings/models'));
  });

  it('surfaces a sub-detector load error in its own warning', async () => {
    mockGetLoadErrors.mockResolvedValue({ success: true, data: ['Remote agent store unavailable'] });
    render(<AgentsSettings />);

    await waitFor(() => expect(screen.getByText('Some agents failed to load')).toBeTruthy());
    expect(screen.getByText('Remote agent store unavailable')).toBeTruthy();
  });

  it('shows the empty note and the always-available Wayland Core hero when no agents are detected', async () => {
    mockGetAvailableAgents.mockResolvedValue(agentsOk([]));
    render(<AgentsSettings />);

    // The wcore hero card must always render - the engine is always-available
    // once a model is connected, so the page never goes wcore-less.
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());
    const cards = screen.getAllByTestId('agent-card');
    expect(cards).toHaveLength(1);

    // The empty note still renders alongside the always-available hero.
    expect(
      screen.getByText('No agents detected yet. Wayland Core is always available once a model is connected.')
    ).toBeTruthy();
  });

  it('still renders the Wayland Core hero when the agents IPC call fails', async () => {
    // The SWR fetcher swallows `success: false` into an empty array - the
    // page must still render the wcore hero (always-available) plus the
    // empty-state note.
    mockGetAvailableAgents.mockResolvedValue({ success: false });
    render(<AgentsSettings />);

    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());
    expect(screen.getAllByTestId('agent-card')).toHaveLength(1);
    expect(
      screen.getByText('No agents detected yet. Wayland Core is always available once a model is connected.')
    ).toBeTruthy();
  });

  it('renders a "show in toolbar" toggle for each detected agent, on by default', async () => {
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    // A featured agent (Codex) and a tile agent (Gemini) both expose a toggle.
    const codexToggle = await screen.findByTestId('agent-toolbar-toggle-codex');
    const geminiToggle = await screen.findByTestId('agent-toolbar-toggle-gemini');
    // Default (empty hidden set) means every agent is shown -> checked.
    expect(codexToggle.getAttribute('aria-checked')).toBe('true');
    expect(geminiToggle.getAttribute('aria-checked')).toBe('true');
  });

  it('persists hiding a detected agent through ConfigStorage', async () => {
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    await act(async () => {
      (await screen.findByTestId('agent-toolbar-toggle-codex')).click();
    });

    // Toggling off persists the agent key into the hidden set and reflects in
    // the toggle's DOM (reactive via the shared SWR cache).
    await waitFor(() => expect(mockHiddenStore).toContain('codex'));
    await waitFor(() =>
      expect(screen.getByTestId('agent-toolbar-toggle-codex').getAttribute('aria-checked')).toBe('false')
    );

    // Toggling back on removes it from the hidden set.
    await act(async () => {
      screen.getByTestId('agent-toolbar-toggle-codex').click();
    });
    await waitFor(() => expect(mockHiddenStore).not.toContain('codex'));
  });

  it('locks the Wayland Core toggle on so the toolbar keeps at least one agent', async () => {
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    const wcoreToggle = await screen.findByTestId('agent-toolbar-toggle-wcore');
    expect(wcoreToggle.getAttribute('aria-checked')).toBe('true');
    // A disabled Switch ignores clicks - the store never records wcore as hidden.
    expect(wcoreToggle.getAttribute('disabled')).not.toBeNull();
    await act(async () => {
      wcoreToggle.click();
    });
    expect(mockHiddenStore).not.toContain('wcore');
  });

  it('reflects a pre-hidden agent as toggled off', async () => {
    mockHiddenStore = ['gemini'];
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    const geminiToggle = await screen.findByTestId('agent-toolbar-toggle-gemini');
    await waitFor(() => expect(geminiToggle.getAttribute('aria-checked')).toBe('false'));
    // A hidden agent stays detected and listed on the page.
    expect(screen.getByText('Gemini CLI')).toBeTruthy();
  });
});
