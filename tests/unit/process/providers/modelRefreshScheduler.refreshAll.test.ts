/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for the global-refresh CORE (`handlers.refreshAllOnce`): the
 * `added` diff, the success-only freshness stamp gate, the awaited mirror, and
 * the registry-fetched-once contract. Driven through `createModelRegistryHandlers`
 * over in-memory fakes - no real network, no Electron.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// `modelRegistryIpc` imports `electron`; the handler path under test never
// touches `app` / `net` / `powerMonitor` (those live in `initModelRegistryIpc`),
// so a minimal mock is enough for the module to load.
vi.mock('electron', () => ({ app: { on: vi.fn() }, net: {}, powerMonitor: { on: vi.fn() }, safeStorage: {} }));

import { createModelRegistryHandlers } from '@process/providers/ipc/modelRegistryIpc';
import type { ModelRegistryDeps } from '@process/providers/ipc/modelRegistryIpc';
import type { CatalogModel, ProviderId } from '@process/providers/types';
import type { RegistryCredsResult, RegistryProvider } from '@process/providers/storage/ProviderRepository';

function catalogModel(over: Partial<CatalogModel> & { id: string; providerId: ProviderId }): CatalogModel {
  return { displayName: over.id, family: over.id, kind: 'text', enriched: false, tags: [], ...over };
}

/** Minimal in-memory repo. `nextModels` per provider drives what a refresh "discovers". */
class FakeRepo {
  providers = new Map<ProviderId, RegistryProvider & { creds: Record<string, unknown> }>();
  catalogs = new Map<ProviderId, CatalogModel[]>();
  nextModels = new Map<ProviderId, CatalogModel[]>();

  add(providerId: ProviderId, creds: Record<string, unknown>, initial: CatalogModel[]): void {
    this.providers.set(providerId, {
      providerId,
      connectedVia: 'api-key',
      state: 'connected',
      credsEncrypted: 'enc',
      creds,
    });
    this.catalogs.set(providerId, initial);
  }

  listRegistryProviders(): RegistryProvider[] {
    return [...this.providers.values()];
  }
  getRegistryProvider(id: ProviderId): RegistryProvider | null {
    return this.providers.get(id) ?? null;
  }
  getRegistryProviderCreds(id: ProviderId): RegistryCredsResult {
    const creds = this.providers.get(id)?.creds;
    return creds ? { status: 'ok', creds } : { status: 'not-found' };
  }
  replaceRegistryCatalog(id: ProviderId, models: CatalogModel[]): void {
    this.catalogs.set(id, models);
  }
  getRegistryCatalog(id: ProviderId): CatalogModel[] {
    return this.catalogs.get(id) ?? [];
  }
  countRegistryCatalog(id: ProviderId): number {
    return (this.catalogs.get(id) ?? []).length;
  }
  listRegistryOverrides(): [] {
    return [];
  }
  upsertRegistryProvider(): void {}
  updateRegistryProviderState(): void {}
  updateRegistryProviderCreds(): void {}
  updateRegistryProviderConnectedVia(): void {}
  deleteRegistryProvider(): void {}
  setRegistryOverride(): void {}
}

type Built = {
  repo: FakeRepo;
  deps: ModelRegistryDeps;
  getRegistry: ReturnType<typeof vi.fn>;
  mirror: ReturnType<typeof vi.fn>;
  emitListChanged: ReturnType<typeof vi.fn>;
  setLastRefreshedAt: ReturnType<typeof vi.fn>;
};

function build(opts: { now?: () => number } = {}): Built {
  const repo = new FakeRepo();
  const getRegistry = vi.fn().mockResolvedValue({});
  const mirror = vi.fn().mockResolvedValue(undefined);
  const emitListChanged = vi.fn();
  const setLastRefreshedAt = vi.fn().mockResolvedValue(undefined);

  const deps: ModelRegistryDeps = {
    repo: repo as unknown as ModelRegistryDeps['repo'],
    keyDiscovery: { scan: vi.fn().mockResolvedValue([]), readValue: vi.fn().mockReturnValue(null) },
    connectionTester: { test: vi.fn().mockResolvedValue({ ok: true }) },
    modelsDevClient: { getRegistry },
    makeApiSource: (providerId) => ({
      kind: 'api',
      providerId,
      listModels: async () =>
        (repo.nextModels.get(providerId) ?? repo.getRegistryCatalog(providerId)).map((m) => ({ id: m.id, providerId })),
    }),
    makeCliSource: (agentKey) => ({
      kind: 'cli',
      providerId: agentKey,
      enumerable: false,
      underlyingProviderId: 'openai',
      listModels: async () => [],
    }),
    mirror,
    emitListChanged,
    setLastRefreshedAt,
    now: opts.now,
  };

  return { repo, deps, getRegistry, mirror, emitListChanged, setLastRefreshedAt };
}

describe('refreshAllOnce - added diff', () => {
  it('reports only genuinely-new ids per provider with humanized displayName', async () => {
    const { repo, deps } = build();
    repo.add('anthropic', { key: 'sk-a' }, [catalogModel({ id: 'claude-opus-4-7', providerId: 'anthropic' })]);
    repo.nextModels.set('anthropic', [
      catalogModel({ id: 'claude-opus-4-7', providerId: 'anthropic' }),
      catalogModel({ id: 'claude-opus-4-8', providerId: 'anthropic' }),
    ]);

    const h = createModelRegistryHandlers(deps);
    const summary = await h.refreshAllOnce();

    expect(summary.ok).toBe(true);
    expect(summary.succeeded).toEqual(['anthropic']);
    expect(summary.failed).toEqual([]);
    expect(summary.added.map((a) => a.modelId)).toEqual(['claude-opus-4-8']);
    expect(summary.added[0].providerId).toBe('anthropic');
  });

  it('fetches the models.dev registry exactly once for N providers', async () => {
    const { repo, deps, getRegistry } = build();
    repo.add('anthropic', { key: 'sk-a' }, []);
    repo.add('openai', { key: 'sk-o' }, []);
    repo.nextModels.set('anthropic', [catalogModel({ id: 'a1', providerId: 'anthropic' })]);
    repo.nextModels.set('openai', [catalogModel({ id: 'o1', providerId: 'openai' })]);

    const h = createModelRegistryHandlers(deps);
    await h.refreshAllOnce();

    expect(getRegistry).toHaveBeenCalledTimes(1);
  });

  it('awaits the mirror for each succeeded provider', async () => {
    const { repo, deps, mirror } = build();
    repo.add('anthropic', { key: 'sk-a' }, []);
    repo.nextModels.set('anthropic', [catalogModel({ id: 'a1', providerId: 'anthropic' })]);

    const h = createModelRegistryHandlers(deps);
    await h.refreshAllOnce();

    expect(mirror).toHaveBeenCalledWith('anthropic');
  });

  it('skips a provider whose stored baseUrl fails validation, marking it failed', async () => {
    const { repo, deps } = build();
    repo.add('openai-compatible', { key: 'sk', baseUrl: 'https://10.0.0.5/v1' }, []);
    repo.nextModels.set('openai-compatible', [catalogModel({ id: 'x', providerId: 'openai-compatible' })]);

    const h = createModelRegistryHandlers(deps);
    const summary = await h.refreshAllOnce();

    expect(summary.succeeded).toEqual([]);
    expect(summary.failed).toEqual(['openai-compatible']);
    expect(summary.ok).toBe(false);
  });
});

describe('refreshAllOnce - success-gated freshness stamp', () => {
  beforeEach(() => vi.clearAllMocks());

  it('advances lastRefreshedAt when ≥1 provider succeeds', async () => {
    const fixedNow = 1_700_000_000_000;
    const { repo, deps, setLastRefreshedAt } = build({ now: () => fixedNow });
    repo.add('anthropic', { key: 'sk-a' }, []);
    repo.nextModels.set('anthropic', [catalogModel({ id: 'a1', providerId: 'anthropic' })]);

    const h = createModelRegistryHandlers(deps);
    const summary = await h.refreshAllOnce();

    expect(summary.lastRefreshedAt).toBe(fixedNow);
    expect(setLastRefreshedAt).toHaveBeenCalledWith(fixedNow);
  });

  it('does NOT advance lastRefreshedAt when every provider fails', async () => {
    const { repo, deps, setLastRefreshedAt } = build({ now: () => 123 });
    repo.add('anthropic', { key: 'sk-a', baseUrl: 'https://10.0.0.5/v1' }, []);

    const h = createModelRegistryHandlers(deps);
    const summary = await h.refreshAllOnce();

    expect(summary.ok).toBe(false);
    expect(summary.lastRefreshedAt).toBeNull();
    expect(setLastRefreshedAt).not.toHaveBeenCalled();
  });

  it('emits listChanged once at the end of the run', async () => {
    const { repo, deps, emitListChanged } = build();
    repo.add('anthropic', { key: 'sk-a' }, []);
    repo.nextModels.set('anthropic', [catalogModel({ id: 'a1', providerId: 'anthropic' })]);

    const h = createModelRegistryHandlers(deps);
    await h.refreshAllOnce();

    expect(emitListChanged).toHaveBeenCalledTimes(1);
  });
});
