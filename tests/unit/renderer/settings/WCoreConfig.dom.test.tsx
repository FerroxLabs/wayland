/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Hoist mocks ---
const {
  mockNavigate,
  mockGetAvailableAgents,
  mockProviders,
  mockMcpServers,
  mockGetWcoreSection,
  mockSetWcoreSection,
  mockPatchWcoreField,
  mockGetBrowserPolicy,
  mockSetBrowserPolicy,
  mockWcoreProfiles,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetAvailableAgents: vi.fn(),
  mockProviders: { value: [] as Array<{ providerId: string }> },
  mockMcpServers: { value: [] as Array<{ name: string; enabled?: boolean }> },
  mockGetWcoreSection: vi.fn(() => Promise.resolve(undefined)),
  mockSetWcoreSection: vi.fn(() => Promise.resolve({ ok: true })),
  mockPatchWcoreField: vi.fn(() => Promise.resolve({ ok: true })),
  mockGetBrowserPolicy: vi.fn(() => Promise.resolve({ defaultAction: 'deny', allowedOrigins: [], deniedOrigins: [] })),
  mockSetBrowserPolicy: vi.fn(() => Promise.resolve({ ok: true })),
  mockWcoreProfiles: vi.fn(),
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
      getSection: { invoke: async (params: unknown) => ({ ok: true, value: await mockGetWcoreSection(params) }) },
      setSection: { invoke: (params: unknown) => mockSetWcoreSection(params) },
      patchField: { invoke: (params: unknown) => mockPatchWcoreField(params) },
      getBrowserPolicy: {
        invoke: async () => ({ ok: true, policy: await mockGetBrowserPolicy() }),
      },
      setBrowserPolicy: { invoke: ({ policy }: { policy: unknown }) => mockSetBrowserPolicy(policy) },
      getEffectiveRuntime: {
        invoke: () =>
          Promise.resolve({
            ok: true,
            runtime: {
              mode: 'desktop-managed',
              profile: 'default',
              profileApplied: true,
              waylandHomeInjected: true,
              desktopModelOverrideApplied: true,
              desktopPromptOverlayApplied: true,
              selectedConnectorsAuthority: 'desktop',
              teamBridgePolicy: 'host-preserved',
              toolCredentialPolicy: 'allowlisted-host-forwarding',
              hostProtocolAuthority: 'desktop',
              engineConfigDir: '/Users/test/.wayland/profiles/default',
              engineConfigPath: '/Users/test/.wayland/profiles/default/config.toml',
              desktopConfigDir: '/Users/test/Library/Application Support/Wayland/config',
              desktopConfigPath: '/Users/test/Library/Application Support/Wayland/config/wayland-config.txt',
            },
          }),
      },
      setRawEngineMode: { invoke: () => Promise.resolve({ ok: true }) },
      getOutputBudget: { invoke: () => Promise.resolve({ ok: true, value: { mode: 'auto' } }) },
      setOutputBudget: { invoke: () => Promise.resolve({ ok: true }) },
      openEffectiveRuntimeFolder: { invoke: () => Promise.resolve({ ok: true }) },
    },
    // Tool-backend key presence (Services & Keys pane).
    wcoreToolKeys: {
      list: { invoke: () => Promise.resolve([]) },
      set: { invoke: () => Promise.resolve({ ok: true }) },
      delete: { invoke: () => Promise.resolve({ ok: true }) },
    },
    // Profile fs (Profiles pane).
    wcoreProfiles: {
      list: { invoke: () => mockWcoreProfiles() },
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
    mockGetWcoreSection.mockResolvedValue(undefined);
    mockSetWcoreSection.mockResolvedValue({ ok: true });
    mockPatchWcoreField.mockResolvedValue({ ok: true });
    mockGetBrowserPolicy.mockResolvedValue({ defaultAction: 'deny', allowedOrigins: [], deniedOrigins: [] });
    mockSetBrowserPolicy.mockResolvedValue({ ok: true });
    mockWcoreProfiles.mockResolvedValue({
      ok: true,
      profiles: [
        {
          kind: 'native',
          name: 'Default',
          active: true,
          dir: '/Users/test/Library/Application Support/wayland-core',
        },
      ],
    });
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

  it('renders the three engine status stat cards with the producer-resolved active profile path', async () => {
    render(<WCoreConfig />);
    // "Engine" also appears as the rail group label, so assert the unique
    // stat-card meta strings instead of the ambiguous labels.
    expect(screen.getByText('Running')).toBeTruthy();
    expect(screen.getByText('embedded · spawned in-process')).toBeTruthy();
    expect(screen.getByText('wayland-core · pinned')).toBeTruthy();
    expect(screen.getByText('Active Profile')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('/Users/test/Library/Application Support/wayland-core')).toBeTruthy();
    });
    expect(screen.queryByText('~/.wayland/profiles/default')).toBeNull();
    expect(screen.queryByText('~/.wayland-core/config.toml')).toBeNull();
  });

  it('fails closed instead of fabricating an active Core profile path', async () => {
    mockWcoreProfiles.mockResolvedValue({
      ok: true,
      profiles: [{ kind: 'native', name: 'Default', active: true }],
    });
    render(<WCoreConfig />);
    await waitFor(() => expect(screen.getByText('Path unavailable')).toBeTruthy());
    expect(screen.queryByText('~/.wayland/profiles/default')).toBeNull();
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
        'Approval defaults for a curated set of stable Core tools. A switch controls auto-run versus ask-first; it does not prove that a credential-gated, MCP, plugin, voice, or version-specific tool is registered in this session. Script and RepoMap are explicit registration gates.'
      )
    ).toBeTruthy();
  });

  it('links only credentials this UI can configure and explains external setup without a dead-end button', async () => {
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="tools"]')!);

    const supported = await screen.findByRole('button', {
      name: 'Configure image_generate in Services & Keys',
    });
    expect(
      screen.getByLabelText('Requires DATABASE_URL, POSTGRES_URL, or PG_CONN_STRING in the Core launch environment.')
    ).not.toHaveAttribute('role', 'button');
    expect(screen.getAllByText('external setup').length).toBeGreaterThan(0);

    fireEvent.click(supported);
    expect(
      screen.getByText(
        "The engine's tool backends: web search, vision, voice and image. Wayland ships working out of the box; plug in a key to unlock higher limits and better quality."
      )
    ).toBeTruthy();
  });

  it('does not fabricate tool approval or gate truth while authoritative reads are pending', async () => {
    let release!: (value: undefined) => void;
    mockGetWcoreSection.mockReturnValue(new Promise<undefined>((resolve) => (release = resolve)));
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="tools"]')!);

    expect(screen.getByRole('status')).toHaveTextContent('Reading authoritative tool settings…');
    expect(screen.queryByRole('switch', { name: 'Auto-run Read without asking' })).toBeNull();
    expect(screen.queryByText('Ask first: tools below marked “Auto-runs”')).toBeNull();

    release(undefined);
    expect(await screen.findByRole('switch', { name: 'Auto-run Read without asking' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('awaits an atomic tool patch, keeps the last proven state visible, then re-reads authority', async () => {
    let allowList = ['Read'];
    let release!: (value: { ok: true }) => void;
    mockGetWcoreSection.mockImplementation(async (params: unknown) => {
      const section = (params as { section: string }).section;
      if (section === 'tools') return { allow_list: allowList };
      return undefined;
    });
    mockPatchWcoreField.mockImplementationOnce(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          release = (value) => {
            allowList = [];
            resolve(value);
          };
        })
    );
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="tools"]')!);
    const readSwitch = await screen.findByRole('switch', { name: 'Auto-run Read without asking' });

    fireEvent.click(readSwitch);
    expect(readSwitch).toHaveAttribute('aria-checked', 'true');
    expect(readSwitch).toHaveAttribute('aria-disabled', 'true');
    expect(mockPatchWcoreField).toHaveBeenCalledWith({
      patch: { section: 'tools', field: 'allow_list', value: [] },
    });

    release({ ok: true });
    await waitFor(() => expect(readSwitch).toHaveAttribute('aria-checked', 'false'));
  });

  it('renders Force as an effective override while leaving registration gates independent', async () => {
    mockGetWcoreSection.mockImplementation(async (params: unknown) => {
      const section = (params as { section: string }).section;
      if (section === 'tools') return { allow_list: [] };
      if (section === 'builtin_tools') return { script: { enabled: false }, repomap: { enabled: true } };
      if (section === 'default') return { approval_mode: 'force' };
      return undefined;
    });
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="tools"]')!);

    const read = await screen.findByRole('switch', { name: 'Auto-run Read without asking' });
    expect(read).toHaveAttribute('aria-checked', 'true');
    expect(read).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getAllByText('Auto-runs · Force').length).toBeGreaterThan(0);
    expect(screen.getByText('8 tools · 6/6 auto-run')).toBeTruthy();
    expect(screen.getByText(/every registered non-gate tool auto-runs/)).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Enable Script' })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByRole('switch', { name: 'Enable Script' })).toHaveAttribute('aria-checked', 'false');
  });

  it('renders Auto-edit as an exact Write/Edit override and preserves other per-tool settings', async () => {
    mockGetWcoreSection.mockImplementation(async (params: unknown) => {
      const section = (params as { section: string }).section;
      if (section === 'tools') return { allow_list: [] };
      if (section === 'default') return { approval_mode: 'auto-edit' };
      return undefined;
    });
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="tools"]')!);

    const write = await screen.findByRole('switch', { name: 'Auto-run Write without asking' });
    const edit = screen.getByRole('switch', { name: 'Auto-run Edit without asking' });
    const read = screen.getByRole('switch', { name: 'Auto-run Read without asking' });
    expect(write).toHaveAttribute('aria-checked', 'true');
    expect(write).toHaveAttribute('aria-disabled', 'true');
    expect(edit).toHaveAttribute('aria-checked', 'true');
    expect(edit).toHaveAttribute('aria-disabled', 'true');
    expect(read).toHaveAttribute('aria-checked', 'false');
    expect(read).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getAllByText('Auto-runs · Auto-edit')).toHaveLength(2);
    expect(screen.getByText('8 tools · 2/6 auto-run')).toBeTruthy();
    expect(screen.getByText(/built-in Write and Edit tools auto-run/)).toBeTruthy();
  });

  it('fails closed for unreadable Tools and Memory config instead of showing engine defaults', async () => {
    mockGetWcoreSection.mockRejectedValue(new Error('config parse failed'));
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="tools"]')!);
    expect(await screen.findByText(/Tool settings are unknown/)).toBeTruthy();
    expect(screen.queryByRole('switch', { name: 'Auto-run Read without asking' })).toBeNull();

    fireEvent.click(container.querySelector('[data-wcore-rail-id="memory"]')!);
    expect(await screen.findByText(/Memory settings are unknown/)).toBeTruthy();
    expect(screen.queryByRole('switch', { name: 'Long-term memory' })).toBeNull();
    expect(mockPatchWcoreField).not.toHaveBeenCalled();
  });

  it('renders only the real bundled Core memory field and re-reads it after an atomic patch', async () => {
    let enabled = true;
    mockGetWcoreSection.mockImplementation(async (params: unknown) => {
      const section = (params as { section: string }).section;
      if (section !== 'memory') return undefined;
      return {
        enabled,
        dream_cycle_throttle_secs: 300,
        decay_interval_secs: 86_400,
        embedder: { kind: 'local' },
      };
    });
    mockPatchWcoreField.mockImplementation(async () => {
      enabled = false;
      return { ok: true };
    });
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="memory"]')!);

    const memorySwitch = await screen.findByRole('switch', { name: 'Long-term memory' });
    expect(memorySwitch).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText('Provider')).toBeNull();
    expect(screen.queryByText('Recall budget')).toBeNull();
    expect(screen.queryByText('Auto-consolidate')).toBeNull();

    fireEvent.click(memorySwitch);
    expect(mockPatchWcoreField).toHaveBeenCalledWith({
      patch: { section: 'memory', field: 'enabled', value: false },
    });
    await waitFor(() => expect(memorySwitch).toHaveAttribute('aria-checked', 'false'));
  });

  it('edits the supported Core Browser policy without exposing unsupported security controls', async () => {
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="security"]')!);

    expect(screen.getByText('Managed in Tools')).toBeTruthy();
    expect(screen.getByText('Environment passthrough is unavailable here')).toBeTruthy();
    expect(screen.getByText('Core egress protection remains enabled')).toBeTruthy();
    expect(screen.getByText('Private and local Browser targets are blocked')).toBeTruthy();
    expect(
      screen.getByText(/There is currently no supported Wayland setting that allows localhost Browser access/)
    ).toBeTruthy();
    expect(screen.queryByText('Ask every time')).toBeNull();
    expect(screen.queryByText('Turn off firewall')).toBeNull();
    expect(mockSetWcoreSection).not.toHaveBeenCalled();

    const allowed = await screen.findByRole('textbox', { name: 'Allowed origins' });
    fireEvent.change(allowed, { target: { value: 'Example.com\n*.docs.example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Browser policy' }));
    await waitFor(() =>
      expect(mockSetBrowserPolicy).toHaveBeenCalledWith({
        defaultAction: 'deny',
        allowedOrigins: ['example.com', '*.docs.example.com'],
        deniedOrigins: [],
      })
    );
  });

  it('explains the Raw engine boundary without claiming host integration is removed', async () => {
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="runtime"]')!);

    expect(
      screen.getByText(
        'Let Core choose its config, model, prompt, and MCP servers. Wayland still provides its private protocol, permissions, team bridge, and allowlisted host integration.'
      )
    ).toBeTruthy();
    expect(await screen.findByText('/Users/test/.wayland/profiles/default/config.toml')).toBeTruthy();
  });

  it('keeps invalid active-profile state explicit and offers a deliberate recovery activation', async () => {
    mockWcoreProfiles.mockResolvedValue({
      ok: true,
      profiles: [
        {
          kind: 'native',
          name: 'Default',
          active: false,
          dir: '/Users/test/Library/Application Support/wayland-core',
        },
        { kind: 'named', name: 'work', active: false, dir: '/Users/test/.config/wayland-core-profiles/work' },
      ],
    });
    const { container } = render(<WCoreConfig />);
    fireEvent.click(container.querySelector('[data-wcore-rail-id="profiles"]')!);

    expect(
      await screen.findByText(
        'The active-profile marker is invalid or unreadable. Nothing was activated automatically. Choose Activate on Default or another healthy profile to repair it.'
      )
    ).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Activate' })).toHaveLength(2);
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('navigates back to Desktop settings via the back link', () => {
    render(<WCoreConfig />);
    fireEvent.click(screen.getByText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings', { replace: true });
  });

  it('shows the engine chip with the pinned version when running', async () => {
    render(<WCoreConfig />);
    await waitFor(() => expect(screen.getByText(/^engine running · v\d/)).toBeTruthy());
  });

  it('shows engine stopped when the wcore backend is absent', async () => {
    mockGetAvailableAgents.mockResolvedValue({ success: true, data: [] });
    render(<WCoreConfig />);
    await waitFor(() => expect(screen.getByText('engine stopped')).toBeTruthy());
  });
});
