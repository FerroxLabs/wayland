/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for the kimi leg of `fluxConnectorBridge`: the three handlers build the
 * ConnectorContext from the OpenAI-compatible Flux surface (NOT codex's
 * Responses surface), gate setup on a connected Flux key, and treat "config file
 * exists" as installed.
 *
 * `@/common/config/flux` is mocked with DISTINCT sentinel URLs per surface. In
 * production `FLUX_SURFACE.openai` and `FLUX_SURFACE.responses` happen to be the
 * same string, so a real-value assertion could not tell the two apart and the
 * surface test would be vacuous - swapping `buildContext` for `buildCodexContext`
 * would still pass. The sentinels make that mutation observable.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ConnectorContext } from '@process/connectors/types';
import type { FluxConnectorReport } from '@/common/types/fluxConnector';

const OPENAI_SURFACE = 'https://openai-surface.test/v1';
const RESPONSES_SURFACE = 'https://responses-surface.test/v1';

vi.mock('@/common/config/flux', () => ({
  FLUX_PROVIDER_ID: 'flux-router',
  FLUX_SURFACE: {
    openai: OPENAI_SURFACE,
    responses: RESPONSES_SURFACE,
    anthropic: 'https://anthropic-surface.test',
  },
}));

vi.mock('electron', () => ({
  app: { getPath: (key: string) => `/tmp/wayland-test-${key}` },
}));

const providers = new Map<string, () => Promise<unknown>>();
vi.mock('@/common', () => ({
  ipcBridge: {
    fluxConnector: {
      opencodeStatus: { provider: (h: () => Promise<unknown>) => providers.set('opencodeStatus', h) },
      setupOpencode: { provider: (h: () => Promise<unknown>) => providers.set('opencodeSetup', h) },
      removeOpencode: { provider: (h: () => Promise<unknown>) => providers.set('opencodeRemove', h) },
      codexStatus: { provider: (h: () => Promise<unknown>) => providers.set('codexStatus', h) },
      setupCodex: { provider: (h: () => Promise<unknown>) => providers.set('codexSetup', h) },
      removeCodex: { provider: (h: () => Promise<unknown>) => providers.set('codexRemove', h) },
      kimiStatus: { provider: (h: () => Promise<unknown>) => providers.set('kimiStatus', h) },
      setupKimi: { provider: (h: () => Promise<unknown>) => providers.set('kimiSetup', h) },
      removeKimi: { provider: (h: () => Promise<unknown>) => providers.set('kimiRemove', h) },
    },
  },
}));

const readConnectedFluxKey = vi.fn<() => Promise<string | undefined>>();
vi.mock('@process/connectors/fluxKey', () => ({
  readConnectedFluxKey: () => readConnectedFluxKey(),
}));

const batchCheckCliAvailability = vi.fn<(cmds: string[]) => Promise<Set<string>>>();
vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: { batchCheckCliAvailability: (cmds: string[]) => batchCheckCliAvailability(cmds) },
}));

const setupKimi = vi.fn<(ctx: ConnectorContext) => Promise<FluxConnectorReport>>();
const removeKimi = vi.fn<(ctx: ConnectorContext) => Promise<FluxConnectorReport>>();
const kimiStatus = vi.fn<(ctx: ConnectorContext) => Promise<string>>();
vi.mock('@process/connectors/kimi', () => ({
  setupKimi: (ctx: ConnectorContext) => setupKimi(ctx),
  removeKimi: (ctx: ConnectorContext) => removeKimi(ctx),
  kimiStatus: (ctx: ConnectorContext) => kimiStatus(ctx),
  resolveKimiConfigPath: () => '/tmp/kimi-code/config.toml',
}));

const existsSync = vi.fn<(p: string) => boolean>();
vi.mock('node:fs', async (importActual) => {
  const actual = await importActual<typeof import('node:fs')>();
  return { ...actual, existsSync: (p: string) => existsSync(p) };
});

const sampleReport: FluxConnectorReport = {
  tool: 'kimi',
  action: 'installed',
  status: 'routed',
  configPath: '/tmp/kimi-code/config.toml',
  configExistedBefore: false,
  backupPath: null,
  changes: ['Added providers."flux-router"'],
  rollbackCommand: 'remove it',
  baseURL: OPENAI_SURFACE,
};

describe('fluxConnectorBridge (kimi)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    batchCheckCliAvailability.mockResolvedValue(new Set());
    existsSync.mockReturnValue(false);
  });

  it('setup returns flux-not-connected and never calls the connector when no key', async () => {
    readConnectedFluxKey.mockResolvedValue(undefined);
    const { handleSetupKimi } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleSetupKimi();

    expect(result).toEqual({ ok: false, reason: 'flux-not-connected' });
    expect(setupKimi).not.toHaveBeenCalled();
  });

  it('setup points kimi at the OpenAI-compatible surface, not codex Responses', async () => {
    readConnectedFluxKey.mockResolvedValue('sk-flux-live');
    setupKimi.mockResolvedValue(sampleReport);
    const { handleSetupKimi } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleSetupKimi();

    expect(result).toEqual({ ok: true, report: sampleReport });
    expect(setupKimi).toHaveBeenCalledTimes(1);
    const ctx = setupKimi.mock.calls[0][0];
    expect(ctx.baseURL).toBe(OPENAI_SURFACE);
    expect(ctx.baseURL).not.toBe(RESPONSES_SURFACE);
    expect(ctx.fluxKey).toBe('sk-flux-live');
  });

  it('setup wraps connector errors as { ok: false, reason: "error" }', async () => {
    readConnectedFluxKey.mockResolvedValue('sk-flux-live');
    setupKimi.mockRejectedValue(new Error('disk full'));
    const { handleSetupKimi } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleSetupKimi();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.reason).toBe('error');
      expect(result.message).toContain('disk full');
    }
  });

  it('status returns connector status + resolved configPath on the OpenAI surface without a key', async () => {
    kimiStatus.mockResolvedValue('routed');
    const { handleKimiStatus } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleKimiStatus();

    expect(result.status).toBe('routed');
    expect(result.configPath).toBe('/tmp/kimi-code/config.toml');
    expect(kimiStatus.mock.calls[0][0].baseURL).toBe(OPENAI_SURFACE);
    expect(readConnectedFluxKey).not.toHaveBeenCalled();
  });

  it('status reports installed=true when kimi is on PATH', async () => {
    kimiStatus.mockResolvedValue('absent');
    batchCheckCliAvailability.mockResolvedValue(new Set(['kimi']));
    const { handleKimiStatus } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleKimiStatus();

    expect(result.installed).toBe(true);
    expect(batchCheckCliAvailability).toHaveBeenCalledWith(['kimi']);
  });

  it('status reports installed=true when a config file is present even without the binary', async () => {
    kimiStatus.mockResolvedValue('routed');
    existsSync.mockReturnValue(true);
    const { handleKimiStatus } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleKimiStatus();

    expect(result.installed).toBe(true);
  });

  it('remove delegates to the connector on the OpenAI surface without needing a key', async () => {
    removeKimi.mockResolvedValue({ ...sampleReport, action: 'removed', status: 'absent' });
    const { handleRemoveKimi } = await import('@process/bridge/fluxConnectorBridge');

    const result = await handleRemoveKimi();

    expect(result.action).toBe('removed');
    expect(removeKimi).toHaveBeenCalledTimes(1);
    expect(removeKimi.mock.calls[0][0].baseURL).toBe(OPENAI_SURFACE);
    expect(readConnectedFluxKey).not.toHaveBeenCalled();
  });

  it('initFluxConnectorBridge registers the three kimi providers', async () => {
    const { initFluxConnectorBridge, handleKimiStatus, handleSetupKimi, handleRemoveKimi } =
      await import('@process/bridge/fluxConnectorBridge');

    initFluxConnectorBridge();

    expect(providers.get('kimiStatus')).toBe(handleKimiStatus);
    expect(providers.get('kimiSetup')).toBe(handleSetupKimi);
    expect(providers.get('kimiRemove')).toBe(handleRemoveKimi);
  });
});
