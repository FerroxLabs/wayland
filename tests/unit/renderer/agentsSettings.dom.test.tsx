/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Agents settings page (Packet 2D) — behavior contract.
 *
 * Covers the spec §4.7 surface:
 *  - detected agents render as cards / tiles from `acp.get-available-agents`
 *  - every agent states, in a plain sentence, what models it runs
 *    ("runs any model you connect", "Runs Claude models", "Runs GPT models")
 *  - there is NO "family" jargon and no padlock metaphor anywhere on the page
 *  - the remote agents section renders
 *  - the Flux Router roadmap teaser renders as a "coming soon" item
 *  - a sub-detector load error surfaces its own warning
 *
 * `ipcBridge` is mocked; the file name uses the `.dom.test.tsx` suffix so it
 * runs in the jsdom Vitest project (the `node` project only matches `.test.ts`).
 * The page uses only declarative Arco components (Avatar / Spin / Alert /
 * Typography), so the real `@arco-design/web-react` is kept unmocked.
 */

import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — i18n returns the *real* en-US strings so the assertions can verify
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

// `acp.get-available-agents` / `acp.get-load-errors` IPC surface.
const mockGetAvailableAgents = vi.fn();
const mockGetLoadErrors = vi.fn();

vi.mock('../../../src/common', () => ({
  ipcBridge: {
    acpConversation: {
      getAvailableAgents: { invoke: (...a: unknown[]) => mockGetAvailableAgents(...a) },
      getLoadErrors: { invoke: (...a: unknown[]) => mockGetLoadErrors(...a) },
    },
  },
}));

// SettingsPageShell is page chrome (breadcrumb, mobile nav, router hooks) —
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
// IPC). The Agents page only places it under a section header — stub it so
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
 * Render with a fresh SWR cache so each test sees its own mocked IPC data —
 * SWR's module-global cache would otherwise leak fixtures between tests.
 */
function render(ui: React.ReactElement) {
  return rtlRender(React.createElement(SWRConfig, { value: { provider: () => new Map(), dedupingInterval: 0 } }, ui));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAvailableAgents.mockResolvedValue(agentsOk(AGENTS));
  mockGetLoadErrors.mockResolvedValue({ success: true, data: [] });
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

  it('renders the Flux Router roadmap teaser as a coming-soon item', async () => {
    render(<AgentsSettings />);
    await waitFor(() => expect(screen.getByText('Wayland Core')).toBeTruthy());

    expect(screen.getByText('On the roadmap')).toBeTruthy();
    const teaser = screen.getByTestId('flux-teaser');
    expect(teaser).toBeTruthy();
    expect(teaser.textContent).toContain('Flux Router');
    expect(teaser.textContent).toContain('Coming');
    // It is a roadmap teaser, not an active feature — not a clickable control.
    expect(teaser.querySelector('button')).toBeNull();
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

    // The wcore hero card must always render — the engine is always-available
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
    // The SWR fetcher swallows `success: false` into an empty array — the
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
});
