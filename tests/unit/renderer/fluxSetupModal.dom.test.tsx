/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * FluxSetupModal - behavior contract for the opencode Flux setup surface.
 *
 * The modal reads opencode's routing status over the Flux connector bridge and
 * renders an honest setup flow: state what will change, confirm, then show the
 * report (changes list, backup path, rollback command) plus how to undo.
 *
 * `ipcBridge.fluxConnector` is mocked. i18n returns the real en-US strings so
 * the assertions verify the actual plain-language copy. The modal uses only
 * declarative Arco components, so the real `@arco-design/web-react` is kept
 * unmocked. The `.dom.test.tsx` suffix runs it in the jsdom Vitest project.
 */

import { act, render as rtlRender, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Keep every Arco component real (the test asserts on real DOM), but stub
// `Message` - its transient toast renders via the legacy ReactDOM.render path,
// which throws under jsdom and surfaces as an unhandled rejection.
vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
  return { ...actual, Message: { success: vi.fn(), error: vi.fn() } };
});

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
        if (opts && typeof opts.defaultValue === 'string') return opts.defaultValue;
        return key;
      }
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

const mockOpencodeStatus = vi.fn();
const mockSetupOpencode = vi.fn();
const mockRemoveOpencode = vi.fn();
const mockCodexStatus = vi.fn();
const mockSetupCodex = vi.fn();
const mockRemoveCodex = vi.fn();

vi.mock('../../../src/common', () => ({
  ipcBridge: {
    fluxConnector: {
      opencodeStatus: { invoke: (...a: unknown[]) => mockOpencodeStatus(...a) },
      setupOpencode: { invoke: (...a: unknown[]) => mockSetupOpencode(...a) },
      removeOpencode: { invoke: (...a: unknown[]) => mockRemoveOpencode(...a) },
      codexStatus: { invoke: (...a: unknown[]) => mockCodexStatus(...a) },
      setupCodex: { invoke: (...a: unknown[]) => mockSetupCodex(...a) },
      removeCodex: { invoke: (...a: unknown[]) => mockRemoveCodex(...a) },
    },
  },
}));

import FluxSetupModal from '../../../src/renderer/pages/settings/AgentSettings/FluxSetupModal';

const CONFIG_PATH = '/home/u/.config/opencode/opencode.json';

const SETUP_REPORT = {
  tool: 'opencode',
  action: 'installed' as const,
  status: 'routed' as const,
  configPath: CONFIG_PATH,
  configExistedBefore: true,
  backupPath: '/home/u/.config/opencode/opencode.json.wayland-backup',
  changes: ['Added provider.flux pointing at https://api.fluxrouter.ai/v1'],
  rollbackCommand: 'mv /home/u/.config/opencode/opencode.json.wayland-backup /home/u/.config/opencode/opencode.json',
  baseURL: 'https://api.fluxrouter.ai/v1',
};

const REMOVE_REPORT = {
  ...SETUP_REPORT,
  action: 'removed' as const,
  status: 'unconfigured' as const,
  changes: ['Removed provider.flux from opencode config'],
};

const CODEX_CONFIG_PATH = '/home/u/.codex/config.toml';

const CODEX_SETUP_REPORT = {
  tool: 'codex',
  action: 'installed' as const,
  status: 'routed' as const,
  configPath: CODEX_CONFIG_PATH,
  configExistedBefore: true,
  backupPath: '/home/u/.codex/config.toml.wayland-backup',
  changes: ['Pointed model_provider at https://api.fluxrouter.ai/v1'],
  rollbackCommand: 'mv /home/u/.codex/config.toml.wayland-backup /home/u/.codex/config.toml',
  baseURL: 'https://api.fluxrouter.ai/v1',
};

const CODEX_REMOVE_REPORT = {
  ...CODEX_SETUP_REPORT,
  action: 'removed' as const,
  status: 'unconfigured' as const,
  changes: ['Removed the Flux model_provider from codex config'],
};

function render(ui: React.ReactElement) {
  return rtlRender(ui);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('FluxSetupModal (opencode)', () => {
  it('unconfigured: shows Set up, runs setupOpencode, renders the report and flips to routed', async () => {
    mockOpencodeStatus
      .mockResolvedValueOnce({ status: 'unconfigured', configPath: CONFIG_PATH, installed: true })
      .mockResolvedValueOnce({ status: 'routed', configPath: CONFIG_PATH, installed: true });
    mockSetupOpencode.mockResolvedValue({ ok: true, report: SETUP_REPORT });

    render(<FluxSetupModal visible onClose={() => undefined} backend='opencode' />);

    const action = await screen.findByTestId('flux-setup-action');
    await act(async () => {
      action.click();
    });

    await waitFor(() => expect(mockSetupOpencode).toHaveBeenCalledTimes(1));

    // The report panel renders the changes, backup path, and rollback command.
    await waitFor(() => expect(screen.getByTestId('flux-setup-report')).toBeTruthy());
    expect(screen.getByText('Added provider.flux pointing at https://api.fluxrouter.ai/v1')).toBeTruthy();
    expect(screen.getByTestId('flux-setup-backup').textContent).toContain('wayland-backup');
    expect(screen.getByTestId('flux-setup-rollback').textContent).toContain('mv ');

    // The state flips to routed (the Remove button appears).
    await waitFor(() => expect(screen.getByText('Remove Flux from opencode')).toBeTruthy());
    expect(screen.getByTestId('flux-setup-routed')).toBeTruthy();
  });

  it('setup returning flux-not-connected shows the connect-first notice and no success report', async () => {
    mockOpencodeStatus.mockResolvedValue({ status: 'unconfigured', configPath: CONFIG_PATH, installed: true });
    mockSetupOpencode.mockResolvedValue({ ok: false, reason: 'flux-not-connected' });

    render(<FluxSetupModal visible onClose={() => undefined} backend='opencode' />);

    const action = await screen.findByTestId('flux-setup-action');
    await act(async () => {
      action.click();
    });

    await waitFor(() => expect(screen.getByTestId('flux-setup-not-connected')).toBeTruthy());
    expect(screen.queryByTestId('flux-setup-report')).toBeNull();
    // Still unconfigured: the Set up action remains, no Remove button appeared.
    expect(screen.queryByText('Remove Flux from opencode')).toBeNull();
  });

  it('routed: shows Remove and runs removeOpencode', async () => {
    mockOpencodeStatus
      .mockResolvedValueOnce({ status: 'routed', configPath: CONFIG_PATH, installed: true })
      .mockResolvedValueOnce({ status: 'unconfigured', configPath: CONFIG_PATH, installed: true });
    mockRemoveOpencode.mockResolvedValue(REMOVE_REPORT);

    render(<FluxSetupModal visible onClose={() => undefined} backend='opencode' />);

    const remove = await screen.findByText('Remove Flux from opencode');
    await act(async () => {
      (remove.closest('button') as HTMLButtonElement).click();
    });

    await waitFor(() => expect(mockRemoveOpencode).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('Removed provider.flux from opencode config')).toBeTruthy());
  });
});

describe('FluxSetupModal (codex)', () => {
  it('unconfigured: shows Set up, runs setupCodex, renders the report and flips to routed', async () => {
    mockCodexStatus
      .mockResolvedValueOnce({ status: 'unconfigured', configPath: CODEX_CONFIG_PATH, installed: true })
      .mockResolvedValueOnce({ status: 'routed', configPath: CODEX_CONFIG_PATH, installed: true });
    mockSetupCodex.mockResolvedValue({ ok: true, report: CODEX_SETUP_REPORT });

    render(<FluxSetupModal visible onClose={() => undefined} backend='codex' />);

    // The copy names codex (the same modal, parametrized by backend).
    await waitFor(() => expect(screen.getByText('Set up codex for Flux')).toBeTruthy());

    const action = await screen.findByTestId('flux-setup-action');
    await act(async () => {
      action.click();
    });

    await waitFor(() => expect(mockSetupCodex).toHaveBeenCalledTimes(1));
    // opencode connector must not be touched for a codex modal.
    expect(mockSetupOpencode).not.toHaveBeenCalled();

    await waitFor(() => expect(screen.getByTestId('flux-setup-report')).toBeTruthy());
    expect(screen.getByText('Pointed model_provider at https://api.fluxrouter.ai/v1')).toBeTruthy();
    expect(screen.getByTestId('flux-setup-backup').textContent).toContain('config.toml');
    expect(screen.getByTestId('flux-setup-rollback').textContent).toContain('config.toml');

    await waitFor(() => expect(screen.getByText('Remove Flux from codex')).toBeTruthy());
    expect(screen.getByTestId('flux-setup-routed')).toBeTruthy();
  });

  it('setup returning flux-not-connected shows the connect-first notice and no success report', async () => {
    mockCodexStatus.mockResolvedValue({ status: 'unconfigured', configPath: CODEX_CONFIG_PATH, installed: true });
    mockSetupCodex.mockResolvedValue({ ok: false, reason: 'flux-not-connected' });

    render(<FluxSetupModal visible onClose={() => undefined} backend='codex' />);

    const action = await screen.findByTestId('flux-setup-action');
    await act(async () => {
      action.click();
    });

    await waitFor(() => expect(screen.getByTestId('flux-setup-not-connected')).toBeTruthy());
    expect(screen.queryByTestId('flux-setup-report')).toBeNull();
    expect(screen.queryByText('Remove Flux from codex')).toBeNull();
  });

  it('routed: shows Remove and runs removeCodex', async () => {
    mockCodexStatus
      .mockResolvedValueOnce({ status: 'routed', configPath: CODEX_CONFIG_PATH, installed: true })
      .mockResolvedValueOnce({ status: 'unconfigured', configPath: CODEX_CONFIG_PATH, installed: true });
    mockRemoveCodex.mockResolvedValue(CODEX_REMOVE_REPORT);

    render(<FluxSetupModal visible onClose={() => undefined} backend='codex' />);

    const remove = await screen.findByText('Remove Flux from codex');
    await act(async () => {
      (remove.closest('button') as HTMLButtonElement).click();
    });

    await waitFor(() => expect(mockRemoveCodex).toHaveBeenCalledTimes(1));
    expect(mockRemoveOpencode).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('Removed the Flux model_provider from codex config')).toBeTruthy());
  });
});
