/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `importEnvKeysOnBoot` connects discovered keys through the model-registry IPC.
// The registry depends on Electron + the database, so it is mocked here and the
// test asserts purely on WHAT `connectModelRegistryProvider` is called with.
const connectMock = vi.fn();
const getRegistryProviderMock = vi.fn();
const deleteRegistryProviderMock = vi.fn();
const getRepoMock = vi.fn();
const mirrorDisconnectMock = vi.fn();
const configSetMock = vi.fn();

vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({
  connectModelRegistryProvider: (...args: unknown[]) => connectMock(...args),
  getModelRegistryRepository: () => getRepoMock(),
}));
vi.mock('@process/providers/legacyModelConfigBridge', () => ({
  mirrorDisconnect: (...args: unknown[]) => mirrorDisconnectMock(...args),
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { set: (...args: unknown[]) => configSetMock(...args) },
}));

import { importEnvKeysOnBoot } from '@process/utils/importEnvKeys';

const ORIGINAL_ENV = process.env;

function setEnv(vars: Record<string, string>): void {
  process.env = { ...vars };
}

beforeEach(() => {
  connectMock.mockReset().mockResolvedValue({ ok: true });
  // Default: no provider is already connected, so every discovered key imports.
  getRegistryProviderMock.mockReset().mockReturnValue(undefined);
  deleteRegistryProviderMock.mockReset();
  mirrorDisconnectMock.mockReset().mockResolvedValue(undefined);
  configSetMock.mockReset().mockResolvedValue(undefined);
  getRepoMock.mockReset().mockReturnValue({
    getRegistryProvider: getRegistryProviderMock,
    deleteRegistryProvider: deleteRegistryProviderMock,
  });
  setEnv({});
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.restoreAllMocks();
});

describe('importEnvKeysOnBoot - Flux key remap', () => {
  it('registers an sk-flux- key as flux-router (not openai), with no base URL', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-flux-abc', OPENAI_BASE_URL: 'https://api.fluxrouter.ai/v1' });

    await importEnvKeysOnBoot();

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledWith('flux-router', { key: 'sk-flux-abc' });
  });

  it('detects Flux by the fluxrouter base URL even when the key lacks the sk-flux- prefix', async () => {
    setEnv({ OPENAI_API_KEY: 'gw-key-123', OPENAI_BASE_URL: 'https://api.fluxrouter.ai/v1' });

    await importEnvKeysOnBoot();

    expect(connectMock).toHaveBeenCalledWith('flux-router', { key: 'gw-key-123' });
  });

  it('enables Flux routing after a successful Flux import so the chat default resolves', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-flux-abc', OPENAI_BASE_URL: 'https://api.fluxrouter.ai/v1' });

    await importEnvKeysOnBoot();

    expect(configSetMock).toHaveBeenCalledWith('system.routeThroughFlux', true);
  });

  it('removes a stale openai row (and its legacy mirror) when remapping to flux-router', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-flux-abc', OPENAI_BASE_URL: 'https://api.fluxrouter.ai/v1' });
    // A pre-fix boot left an `openai` row; `flux-router` is not yet connected.
    getRegistryProviderMock.mockImplementation((id: string) =>
      id === 'openai' ? { state: 'connected' } : undefined
    );

    await importEnvKeysOnBoot();

    expect(deleteRegistryProviderMock).toHaveBeenCalledWith('openai');
    expect(mirrorDisconnectMock).toHaveBeenCalledWith('openai');
    expect(connectMock).toHaveBeenCalledWith('flux-router', { key: 'sk-flux-abc' });
  });

  it('skips when flux-router is already connected (idempotent restart, routing untouched)', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-flux-abc', OPENAI_BASE_URL: 'https://api.fluxrouter.ai/v1' });
    getRegistryProviderMock.mockImplementation((id: string) =>
      id === 'flux-router' ? { state: 'connected' } : undefined
    );

    await importEnvKeysOnBoot();

    expect(connectMock).not.toHaveBeenCalled();
    expect(configSetMock).not.toHaveBeenCalled();
  });

  it('leaves a real OpenAI key as the openai provider (no Flux markers)', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-proj-realopenai' });

    await importEnvKeysOnBoot();

    expect(connectMock).toHaveBeenCalledWith('openai', { key: 'sk-proj-realopenai' });
    expect(configSetMock).not.toHaveBeenCalled();
    expect(deleteRegistryProviderMock).not.toHaveBeenCalled();
  });
});

describe('importEnvKeysOnBoot - base URL threading (issue #25)', () => {
  it('threads a non-Flux OPENAI_BASE_URL through as creds.baseUrl', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-abc', OPENAI_BASE_URL: 'https://my-gateway.example.com/v1' });

    await importEnvKeysOnBoot();

    expect(connectMock).toHaveBeenCalledWith('openai', {
      key: 'sk-abc',
      baseUrl: 'https://my-gateway.example.com/v1',
    });
  });

  it('omits baseUrl entirely when no paired *_BASE_URL var is set', async () => {
    setEnv({ ANTHROPIC_API_KEY: 'sk-ant-abc' });

    await importEnvKeysOnBoot();

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledWith('anthropic', { key: 'sk-ant-abc' });
    const creds = connectMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect('baseUrl' in creds).toBe(false);
  });

  it('imports moonshot and nvidia keys discovered from the environment (issue #25)', async () => {
    setEnv({ MOONSHOT_API_KEY: 'sk-moon', NVIDIA_API_KEY: 'nvapi-xyz' });

    await importEnvKeysOnBoot();

    const providers = connectMock.mock.calls.map((c) => c[0]).toSorted();
    expect(providers).toEqual(['moonshot', 'nvidia']);
  });

  it('ignores a blank OPENAI_BASE_URL rather than threading an empty baseUrl', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-abc', OPENAI_BASE_URL: '   ' });

    await importEnvKeysOnBoot();

    expect(connectMock).toHaveBeenCalledWith('openai', { key: 'sk-abc' });
  });

  it('skips a provider already connected and never re-imports it', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-abc' });
    getRegistryProviderMock.mockImplementation((id: string) => (id === 'openai' ? { state: 'connected' } : undefined));

    await importEnvKeysOnBoot();

    expect(connectMock).not.toHaveBeenCalled();
  });

  it('retries a provider left in error state', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-abc' });
    getRegistryProviderMock.mockImplementation((id: string) => (id === 'openai' ? { state: 'error' } : undefined));

    await importEnvKeysOnBoot();

    expect(connectMock).toHaveBeenCalledWith('openai', { key: 'sk-abc' });
  });
});
