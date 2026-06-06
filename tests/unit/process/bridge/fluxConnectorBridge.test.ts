/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `fluxConnectorBridge`: verifies the three exported handlers build
 * the ConnectorContext correctly, gate setup on a connected Flux key, and that
 * `initFluxConnectorBridge` registers all three providers.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FLUX_SURFACE } from '@/common/config/flux';
import type { ConnectorContext } from '@process/connectors/types';
import type { FluxConnectorReport } from '@/common/types/fluxConnector';

vi.mock('electron', () => ({
  app: { getPath: (key: string) => `/tmp/wayland-test-${key}` },
}));

// Capture provider registrations so we can assert all three channels register.
const providers = new Map<string, () => Promise<unknown>>();
vi.mock('@/common', () => ({
  ipcBridge: {
    fluxConnector: {
      opencodeStatus: {
        provider: (handler: () => Promise<unknown>) => providers.set('status', handler),
      },
      setupOpencode: {
        provider: (handler: () => Promise<unknown>) => providers.set('setup', handler),
      },
      removeOpencode: {
        provider: (handler: () => Promise<unknown>) => providers.set('remove', handler),
      },
      codexStatus: {
        provider: (handler: () => Promise<unknown>) => providers.set('codexStatus', handler),
      },
      setupCodex: {
        provider: (handler: () => Promise<unknown>) => providers.set('codexSetup', handler),
      },
      removeCodex: {
        provider: (handler: () => Promise<unknown>) => providers.set('codexRemove', handler),
      },
    },
  },
}));

// Flux-key helper: toggled per test.
const readConnectedFluxKey = vi.fn<() => Promise<string | undefined>>();
vi.mock('@process/connectors/fluxKey', () => ({
  readConnectedFluxKey: () => readConnectedFluxKey(),
}));

// opencode binary PATH probe: default not on PATH.
const batchCheckCliAvailability = vi.fn<(cmds: string[]) => Promise<Set<string>>>();
vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: { batchCheckCliAvailability: (cmds: string[]) => batchCheckCliAvailability(cmds) },
}));

// Connector module: fully mocked so no real filesystem is touched.
const setupOpencode = vi.fn<(ctx: ConnectorContext) => Promise<FluxConnectorReport>>();
const removeOpencode = vi.fn<(ctx: ConnectorContext) => Promise<FluxConnectorReport>>();
const opencodeStatus = vi.fn<(ctx: ConnectorContext) => Promise<string>>();
vi.mock('@process/connectors/opencode', () => ({
  setupOpencode: (ctx: ConnectorContext) => setupOpencode(ctx),
  removeOpencode: (ctx: ConnectorContext) => removeOpencode(ctx),
  opencodeStatus: (ctx: ConnectorContext) => opencodeStatus(ctx),
  resolveOpencodeConfigPath: () => '/tmp/opencode/opencode.json',
}));

// existsSync: config-file presence check; default absent. Preserve the rest of
// node:fs (constants, etc.) since the codex connector chain reads them.
const existsSync = vi.fn<(p: string) => boolean>();
vi.mock('node:fs', async (importActual) => {
  const actual = await importActual<typeof import('node:fs')>();
  return { ...actual, existsSync: (p: string) => existsSync(p) };
});

const sampleReport: FluxConnectorReport = {
  tool: 'opencode',
  action: 'installed',
  status: 'routed',
  configPath: '/tmp/opencode/opencode.json',
  configExistedBefore: false,
  backupPath: null,
  changes: ['Added provider.flux'],
  rollbackCommand: 'remove it',
  baseURL: FLUX_SURFACE.openai,
};

describe('fluxConnectorBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    batchCheckCliAvailability.mockResolvedValue(new Set());
    existsSync.mockReturnValue(false);
  });

  it('setup returns flux-not-connected and never calls the connector when no key', async () => {
    readConnectedFluxKey.mockResolvedValue(undefined);
    const { handleSetupOpencode } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleSetupOpencode();

    expect(result).toEqual({ ok: false, reason: 'flux-not-connected' });
    expect(setupOpencode).not.toHaveBeenCalled();
  });

  it('setup returns ok+report and calls connector with the Flux surface baseURL', async () => {
    readConnectedFluxKey.mockResolvedValue('sk-flux-live');
    setupOpencode.mockResolvedValue(sampleReport);
    const { handleSetupOpencode } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleSetupOpencode();

    expect(result).toEqual({ ok: true, report: sampleReport });
    expect(setupOpencode).toHaveBeenCalledTimes(1);
    const ctx = setupOpencode.mock.calls[0][0];
    expect(ctx.baseURL).toBe(FLUX_SURFACE.openai);
    expect(ctx.fluxKey).toBe('sk-flux-live');
  });

  it('setup wraps connector errors as { ok: false, reason: "error" }', async () => {
    readConnectedFluxKey.mockResolvedValue('sk-flux-live');
    setupOpencode.mockRejectedValue(new Error('disk full'));
    const { handleSetupOpencode } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleSetupOpencode();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.reason).toBe('error');
      expect(result.message).toContain('disk full');
    }
  });

  it('status returns connector status + resolved configPath without needing a key', async () => {
    opencodeStatus.mockResolvedValue('routed');
    const { handleOpencodeStatus } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleOpencodeStatus();

    expect(result.status).toBe('routed');
    expect(result.configPath).toBe('/tmp/opencode/opencode.json');
    expect(readConnectedFluxKey).not.toHaveBeenCalled();
  });

  it('status reports installed=true when opencode is on PATH', async () => {
    opencodeStatus.mockResolvedValue('absent');
    batchCheckCliAvailability.mockResolvedValue(new Set(['opencode']));
    const { handleOpencodeStatus } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleOpencodeStatus();

    expect(result.installed).toBe(true);
  });

  it('status reports installed=true when a config file is present even without the binary', async () => {
    opencodeStatus.mockResolvedValue('routed');
    existsSync.mockReturnValue(true);
    const { handleOpencodeStatus } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleOpencodeStatus();

    expect(result.installed).toBe(true);
  });

  it('remove delegates to the connector without needing a key', async () => {
    removeOpencode.mockResolvedValue({ ...sampleReport, action: 'removed', status: 'absent' });
    const { handleRemoveOpencode } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleRemoveOpencode();

    expect(result.action).toBe('removed');
    expect(removeOpencode).toHaveBeenCalledTimes(1);
    expect(readConnectedFluxKey).not.toHaveBeenCalled();
  });

  it('initFluxConnectorBridge registers all opencode + codex providers', async () => {
    const { initFluxConnectorBridge } = await import('@process/bridge/fluxConnectorBridge');

    initFluxConnectorBridge();

    expect(providers.has('status')).toBe(true);
    expect(providers.has('setup')).toBe(true);
    expect(providers.has('remove')).toBe(true);
    expect(providers.has('codexStatus')).toBe(true);
    expect(providers.has('codexSetup')).toBe(true);
    expect(providers.has('codexRemove')).toBe(true);
  });
});
