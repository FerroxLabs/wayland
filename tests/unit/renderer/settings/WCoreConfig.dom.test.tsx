/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Hoist mocks ---
const { mockNavigate, mockGetAvailableAgents, mockProviders, mockMcpServers } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetAvailableAgents: vi.fn(),
  mockProviders: { value: [] as Array<{ providerId: string }> },
  mockMcpServers: { value: [] as Array<{ name: string; enabled?: boolean }> },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// i18n: return the defaultValue (the reference English string) so assertions
// read against stable copy without depending on the loaded resource bundle.
// Interpolates {{count}}, {{names}}, {{catalog}} so the rich inherited-row
// strings resolve the way they do at runtime.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: Record<string, unknown> & { defaultValue?: string }) => {
      let dv = opts?.defaultValue ?? _key;
      if (opts) {
        for (const [k, v] of Object.entries(opts)) {
          if (k === 'defaultValue') continue;
          dv = dv.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }
      }
      return dv;
    },
  }),
}));

vi.mock('../../../../src/common', () => ({
  ipcBridge: {
    acpConversation: {
      getAvailableAgents: { invoke: () => mockGetAvailableAgents() },
    },
    // Engine config.toml read/write (Tools / Security / Memory / Runtime panes).
    wcoreConfig: {
      getSection: { invoke: () => Promise.resolve(undefined) },
      setSection: { invoke: () => Promise.resolve({ ok: true }) },
    },
    // Tool-backend key presence (Services & Keys pane).
    wcoreToolKeys: {
      list: { invoke: () => Promise.resolve([]) },
      set: { invoke: () => Promise.resolve({ ok: true }) },
      delete: { invoke: () => Promise.resolve({ ok: true }) },
    },
    // Profile fs (Profiles pane).
    wcoreProfiles: {
      list: { invoke: () => Promise.resolve([]) },
      create: { invoke: () => Promise.resolve({ ok: true }) },
      clone: { invoke: () => Promise.resolve({ ok: true }) },
      activate: { invoke: () => Promise.resolve({ ok: true }) },
      delete: { invoke: () => Promise.resolve({ ok: true }) },
    },
    // In-app engine updater (Overview pane "update available" card).
    wcoreUpdate: {
      check: { invoke: () => Promise.resolve(null) },
      install: { invoke: () => Promise.resolve({ ok: true }) },
      progress: { on: () => () => {} },
    },
  },
}));

vi.mock('../../../../src/renderer/hooks/useModelRegistry', () => ({
  useModelRegistry: () => ({ providers: mockProviders.value }),
}));

vi.mock('../../../../src/renderer/hooks/mcp/useMcpServers', () => ({
  useMcpServers: () => ({ allMcpServers: mockMcpServers.value }),
}));

// CSS module — return the class names verbatim so queries by data attr / text work.
vi.mock('../../../../src/renderer/pages/settings/WCoreConfig/WCoreConfig.module.css', () => ({ default: {} }));
vi.mock('../../../../src/renderer/pages/settings/WCoreConfig/panes/Panes.module.css', () => ({ default: {} }));

import React from 'react';
import WCoreConfig from '../../../../src/renderer/pages/settings/WCoreConfig';

describe('WCoreConfig - Wayland Core configuration surface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProviders.value = [];
    mockMcpServers.value = [];
    mockGetAvailableAgents.mockResolvedValue({
      success: true,
      data: [{ backend: 'wcore', name: 'Wayland Core', cliPath: '/usr/local/bin/wcore' }],
    });
  });

  it('renders the seven engine rail sections (no Constitution — engine has none)', () => {
    render(<WCoreConfig />);
    const rail = screen.getByLabelText('Wayland Core');
    for (const label of [
      'Overview',
      'Services & Keys',
      'Tools',
      'Memory',
      'Security & Permissions',
      'Profiles',
      'Runtime',
    ]) {
      expect(rail.textContent).toContain(label);
    }
    // Constitution is a Desktop concept and must NOT appear in the Core rail.
    expect(rail.querySelector('[data-wcore-rail-id="constitution"]')).toBeNull();
  });

  it('defaults to the Overview pane with the inherited-from-Desktop card', () => {
    render(<WCoreConfig />);
    expect(screen.getByText('Allocated by Wayland Desktop')).toBeTruthy();
    expect(screen.getByText('Models (override)')).toBeTruthy();
    expect(screen.getAllByText('Manage in Desktop Settings').length).toBeGreaterThan(0);
  });

  it('renders the three engine status stat cards', () => {
    render(<WCoreConfig />);
    // "Engine" also appears as the rail group label, so assert the unique
    // stat-card meta strings instead of the ambiguous labels.
    expect(screen.getByText('Running')).toBeTruthy();
    expect(screen.getByText('embedded · spawned in-process')).toBeTruthy();
    expect(screen.getByText('wayland-core · pinned')).toBeTruthy();
    expect(screen.getByText('Active Profile')).toBeTruthy();
    expect(screen.getByText('~/.wayland/profiles/default')).toBeTruthy();
  });

  it('renders the smart-defaults "configured in the engine" strip', () => {
    render(<WCoreConfig />);
    expect(screen.getByText('Configured in the engine')).toBeTruthy();
    expect(screen.getByText('smart defaults active')).toBeTruthy();
    expect(screen.getByText('DuckDuckGo')).toBeTruthy();
  });

  it('falls back to the catalog-only model line when no providers are connected', () => {
    mockProviders.value = [];
    render(<WCoreConfig />);
    expect(screen.getByText('104 provider catalog · Allocated by Desktop · this session')).toBeTruthy();
  });

  it('shows real connected provider names + the catalog headline', () => {
    mockProviders.value = [{ providerId: 'anthropic' }, { providerId: 'openai' }];
    render(<WCoreConfig />);
    expect(screen.getByText('Anthropic, OpenAI + 104 catalog · Allocated by Desktop · this session')).toBeTruthy();
  });

  it('shows the honest MCP row (the Desktop MCP library is NOT inherited)', () => {
    mockMcpServers.value = [
      { name: 'filesystem', enabled: true },
      { name: 'playwright', enabled: true },
    ];
    render(<WCoreConfig />);
    // The embedded engine does not receive the user's Desktop MCP library — only
    // Wayland's own operational MCPs — so the row must not claim the Desktop servers.
    expect(screen.getByText('Wayland operational MCPs · your Desktop MCP library is separate')).toBeTruthy();
  });

  it('deep-links to the Desktop models settings from the inherited row', () => {
    render(<WCoreConfig />);
    const manageLinks = screen.getAllByText('Manage in Desktop Settings');
    fireEvent.click(manageLinks[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/settings/models', { replace: true });
  });

  it('switches to the Tools pane when a rail item is selected', () => {
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="tools"]')!);
    expect(
      screen.getByText(
        'Every tool is always available to the engine. These switches set whether a tool auto-runs or asks for approval first - they do not turn tools off. Script and RepoMap are the only real on/off gates. Tools that need a credential link straight to where you set it.'
      )
    ).toBeTruthy();
  });

  it('navigates back to Desktop settings via the back link', () => {
    render(<WCoreConfig />);
    fireEvent.click(screen.getByText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings', { replace: true });
  });

  it('shows the engine chip with the pinned version when running', async () => {
    render(<WCoreConfig />);
    await waitFor(() => expect(screen.getByText('engine running · v0.11.0')).toBeTruthy());
  });

  it('shows engine stopped when the wcore backend is absent', async () => {
    mockGetAvailableAgents.mockResolvedValue({ success: true, data: [] });
    render(<WCoreConfig />);
    await waitFor(() => expect(screen.getByText('engine stopped')).toBeTruthy());
  });
});
