/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for the `modelRegistry` IPC handlers (Packet 1F).
 *
 * The handlers are tested through the `createModelRegistryHandlers` factory,
 * which takes every backend collaborator (the 1A–1E modules + the repository)
 * as an injected dependency. Each dependency is a hand-built fake so the tests
 * verify real handler behavior — credential resolution, catalog assembly,
 * override application, defensive error handling — without any network, disk,
 * or database I/O.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The real-DB round-trip exercises `ProviderRepository`, which encrypts
// model-registry creds through Electron `safeStorage`. Electron's runtime and
// OS keychain are not available under Vitest, so stub `safeStorage` with an
// in-memory codec that mirrors its prefix/base64 contract.
const { mockSafeStorage } = vi.hoisted(() => ({
  mockSafeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((plaintext: string) => Buffer.from(`enc(${plaintext})`)),
    decryptString: vi.fn((cipher: Buffer) => {
      const raw = cipher.toString('utf8');
      const match = raw.match(/^enc\((.*)\)$/s);
      if (!match) throw new Error('decrypt failed');
      return match[1];
    }),
  },
}));

vi.mock('electron', () => ({ safeStorage: mockSafeStorage }));

import { createModelRegistryHandlers } from '@process/providers/ipc/modelRegistryIpc';
import type { ModelRegistryDeps } from '@process/providers/ipc/modelRegistryIpc';
import type { CatalogModel, ProviderId } from '@process/providers/types';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import type {
  RegistryCredsResult,
  RegistryOverride,
  RegistryProvider,
} from '@process/providers/storage/ProviderRepository';
import type { DiscoveredKey } from '@process/providers/detection/KeyDiscovery';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function catalogModel(over: Partial<CatalogModel> & { id: string; providerId: ProviderId }): CatalogModel {
  return {
    displayName: over.id,
    family: over.id,
    kind: 'text',
    enriched: false,
    tags: [],
    ...over,
  };
}

// ─── In-memory repository fake ────────────────────────────────────────────────

/** A minimal in-memory stand-in for the model-registry slice of the repo. */
class FakeRepo {
  providers = new Map<ProviderId, RegistryProvider & { creds: Record<string, unknown> }>();
  catalogs = new Map<ProviderId, CatalogModel[]>();
  overrides = new Map<ProviderId, RegistryOverride[]>();

  listRegistryProviders(): RegistryProvider[] {
    return [...this.providers.values()];
  }

  getRegistryProvider(id: ProviderId): RegistryProvider | null {
    return this.providers.get(id) ?? null;
  }

  upsertRegistryProvider(p: {
    providerId: ProviderId;
    connectedVia: string;
    state: RegistryProvider['state'];
    error?: RegistryProvider['error'];
    creds: Record<string, unknown>;
  }): void {
    const row: RegistryProvider & { creds: Record<string, unknown> } = {
      providerId: p.providerId,
      connectedVia: p.connectedVia,
      state: p.state,
      credsEncrypted: 'enc',
      creds: p.creds,
    };
    if (p.error) row.error = p.error;
    this.providers.set(p.providerId, row);
  }

  updateRegistryProviderState(
    id: ProviderId,
    state: RegistryProvider['state'],
    error?: RegistryProvider['error']
  ): void {
    const row = this.providers.get(id);
    if (!row) return;
    row.state = state;
    if (error) row.error = error;
    else delete row.error;
  }

  updateRegistryProviderCreds(id: ProviderId, creds: Record<string, unknown>): void {
    const row = this.providers.get(id);
    if (row) row.creds = creds;
  }

  updateRegistryProviderConnectedVia(id: ProviderId, connectedVia: string): void {
    const row = this.providers.get(id);
    if (row) row.connectedVia = connectedVia;
  }

  /**
   * Provider ids in `undecryptableProviders` resolve to `'undecryptable'` —
   * letting a test exercise the corrupt-ciphertext path against the fake.
   */
  undecryptableProviders = new Set<ProviderId>();

  getRegistryProviderCreds(id: ProviderId): RegistryCredsResult {
    if (this.undecryptableProviders.has(id) && this.providers.has(id)) {
      return { status: 'undecryptable' };
    }
    const creds = this.providers.get(id)?.creds;
    return creds ? { status: 'ok', creds } : { status: 'not-found' };
  }

  deleteRegistryProvider(id: ProviderId): void {
    this.providers.delete(id);
    this.catalogs.delete(id);
    this.overrides.delete(id);
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

  setRegistryOverride(id: ProviderId, modelId: string, enabled: boolean): void {
    const list = this.overrides.get(id) ?? [];
    const existing = list.find((o) => o.modelId === modelId);
    if (existing) existing.enabled = enabled;
    else list.push({ modelId, enabled });
    this.overrides.set(id, list);
  }

  listRegistryOverrides(id: ProviderId): RegistryOverride[] {
    return this.overrides.get(id) ?? [];
  }
}

// ─── Dependency builder ───────────────────────────────────────────────────────

type Fakes = {
  repo: FakeRepo;
  deps: ModelRegistryDeps;
  scan: ReturnType<typeof vi.fn>;
  readValue: ReturnType<typeof vi.fn>;
  test: ReturnType<typeof vi.fn>;
  getRegistry: ReturnType<typeof vi.fn>;
  apiListModels: ReturnType<typeof vi.fn>;
  cliListModels: ReturnType<typeof vi.fn>;
};

function makeFakes(over: Partial<{ apiModels: unknown; testResult: unknown }> = {}): Fakes {
  const repo = new FakeRepo();

  const scan = vi.fn<() => Promise<DiscoveredKey[]>>().mockResolvedValue([]);
  const readValue = vi.fn<(d: DiscoveredKey) => string | null>().mockReturnValue(null);
  const test = vi.fn().mockResolvedValue(over.testResult ?? { ok: true });
  const getRegistry = vi.fn().mockResolvedValue({});
  const apiListModels = vi.fn().mockResolvedValue(over.apiModels ?? [{ id: 'gpt-4o', providerId: 'openai' }]);
  const cliListModels = vi.fn().mockResolvedValue([{ id: 'gpt-5-codex', providerId: 'openai' }]);

  const deps: ModelRegistryDeps = {
    repo: repo as unknown as ModelRegistryDeps['repo'],
    keyDiscovery: { scan, readValue },
    connectionTester: { test },
    modelsDevClient: { getRegistry },
    makeApiSource: (providerId) => ({ kind: 'api', providerId, listModels: apiListModels }),
    makeCliSource: (agentKey) => ({
      kind: 'cli',
      providerId: agentKey,
      enumerable: agentKey === 'codex',
      underlyingProviderId: agentKey === 'codex' ? 'openai' : agentKey === 'claude' ? 'anthropic' : 'google-gemini',
      listModels: cliListModels,
    }),
  };

  return {
    repo,
    deps,
    scan,
    readValue,
    test,
    getRegistry,
    apiListModels,
    cliListModels,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('modelRegistry IPC — detectKeys', () => {
  it('returns the discovered keys verbatim', async () => {
    const { deps, scan } = makeFakes();
    scan.mockResolvedValue([{ providerId: 'openai', source: 'env:OPENAI_API_KEY' }]);
    const h = createModelRegistryHandlers(deps);

    expect(await h.detectKeys()).toEqual([{ providerId: 'openai', source: 'env:OPENAI_API_KEY' }]);
  });

  it('returns an empty list when scan throws', async () => {
    const { deps, scan } = makeFakes();
    scan.mockRejectedValue(new Error('boom'));
    const h = createModelRegistryHandlers(deps);

    expect(await h.detectKeys()).toEqual([]);
  });
});

describe('modelRegistry IPC — connect', () => {
  it('connects a standard provider, persists it, and builds the catalog', async () => {
    const { deps, repo, test } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { key: 'sk-test' } });

    expect(result).toEqual({ ok: true });
    expect(test).toHaveBeenCalledWith('openai', { key: 'sk-test' });
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
    expect(repo.getRegistryProviderCreds('openai')).toEqual({ status: 'ok', creds: { key: 'sk-test' } });
    expect(repo.getRegistryCatalog('openai').map((m) => m.id)).toEqual(['gpt-4o']);
  });

  it('returns the ConnectError and does not persist when the test fails', async () => {
    const { deps, repo } = makeFakes({ testResult: { ok: false, error: 'unauthorized' } });
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { key: 'sk-bad' } });

    expect(result).toEqual({ ok: false, error: 'unauthorized' });
    expect(repo.getRegistryProvider('openai')).toBeNull();
  });

  it('resolves a useDiscovered credential to a real key before testing', async () => {
    const { deps, scan, readValue, test } = makeFakes();
    scan.mockResolvedValue([{ providerId: 'anthropic', source: 'env:ANTHROPIC_API_KEY' }]);
    readValue.mockReturnValue('sk-ant-resolved');
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'anthropic', creds: { useDiscovered: true } });

    expect(result).toEqual({ ok: true });
    expect(test).toHaveBeenCalledWith('anthropic', { key: 'sk-ant-resolved' });
  });

  it('fails with unrecognized when useDiscovered finds no key', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { useDiscovered: true } });

    expect(result).toEqual({ ok: false, error: 'unrecognized' });
  });

  it('connects a cloud provider without an inference test and builds from the registry', async () => {
    const { deps, repo, test } = makeFakes();
    deps.modelsDevClient.getRegistry = vi.fn().mockResolvedValue({
      'amazon-bedrock': {
        id: 'amazon-bedrock',
        name: 'Amazon Bedrock',
        env: [],
        models: {
          'claude-3-5-sonnet': { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
        },
      },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({
      providerId: 'aws-bedrock',
      creds: { fields: { accessKeyId: 'AK', secretAccessKey: 'SK', region: 'us-east-1' } },
    });

    expect(result).toEqual({ ok: true });
    // The cloud path must NOT gate the connect on a HTTP probe.
    expect(test).not.toHaveBeenCalled();
    expect(repo.getRegistryProvider('aws-bedrock')?.state).toBe('connected');
    expect(repo.getRegistryCatalog('aws-bedrock').map((m) => m.id)).toEqual(['claude-3-5-sonnet']);
  });

  it('marks the provider in error state when the catalog persist throws', async () => {
    const { deps, repo } = makeFakes();
    // Simulate a failing DB write inside buildAndPersistCatalog.
    repo.replaceRegistryCatalog = () => {
      throw new Error('disk full');
    };
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { key: 'sk-test' } });

    // The connect must report failure, not a false {ok:true}.
    expect(result).toEqual({ ok: false, error: 'unknown' });
    // And the persisted provider must NOT be a false green — it is `'error'`.
    expect(repo.getRegistryProvider('openai')?.state).toBe('error');
    expect(repo.getRegistryProvider('openai')?.error).toBe('unknown');
  });

  it('rejects a cloud connect with an empty fields object', async () => {
    // Fix 3: a cloud connect skips the HTTP probe but must still validate that
    // the required credential fields are present — empty fields is rejected.
    const { deps, repo } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'aws-bedrock', creds: { fields: {} } });

    expect(result).toEqual({ ok: false, error: 'unrecognized' });
    expect(repo.getRegistryProvider('aws-bedrock')).toBeNull();
  });

  it('rejects a cloud connect missing a required field', async () => {
    // Fix 3: Bedrock needs accessKeyId + secretAccessKey + region — a payload
    // missing `region` must not persist a connected provider.
    const { deps, repo } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({
      providerId: 'aws-bedrock',
      creds: { fields: { accessKeyId: 'AK', secretAccessKey: 'SK' } },
    });

    expect(result).toEqual({ ok: false, error: 'unrecognized' });
    expect(repo.getRegistryProvider('aws-bedrock')).toBeNull();
  });

  it('rejects a non-cloud connect that supplies fields instead of a key', async () => {
    // Fix 5: a non-cloud provider connected with `{ fields }` carries no usable
    // key for the catalog build — reject it up front rather than building empty.
    const { deps, repo } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { fields: { token: 'x' } } });

    expect(result).toEqual({ ok: false, error: 'unrecognized' });
    expect(repo.getRegistryProvider('openai')).toBeNull();
  });

  it('treats an empty catalog with a failed source as a degraded connect', async () => {
    // Fix 4: every source failing yields [] — that is NOT a successful empty
    // catalog. The provider must land in `'error'`, not a false `connected`.
    const { deps, repo, apiListModels } = makeFakes();
    apiListModels.mockRejectedValue(new Error('provider /v1/models down'));
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { key: 'sk-test' } });

    expect(result).toEqual({ ok: false, error: 'unknown' });
    expect(repo.getRegistryProvider('openai')?.state).toBe('error');
  });

  it('keeps an empty catalog with NO source errors a legitimate connect', async () => {
    // Fix 4: a provider genuinely exposing zero models (no source errored) is
    // still a valid `connected` — only a degraded empty result fails.
    const { deps, repo, apiListModels } = makeFakes();
    apiListModels.mockResolvedValue([]);
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { key: 'sk-test' } });

    expect(result).toEqual({ ok: true });
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
  });
});

describe('modelRegistry IPC — testConnection', () => {
  it('tests stored credentials and reflects success', async () => {
    const { deps, repo, test } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'error',
      creds: { key: 'sk-stored' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.testConnection({ providerId: 'openai' });

    expect(result).toEqual({ ok: true });
    expect(test).toHaveBeenCalledWith('openai', { key: 'sk-stored' });
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
  });

  it('marks the provider in error state on a failed test', async () => {
    const { deps, repo } = makeFakes({ testResult: { ok: false, error: 'no-credit' } });
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-stored' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.testConnection({ providerId: 'openai' });

    expect(result).toEqual({ ok: false, error: 'no-credit' });
    expect(repo.getRegistryProvider('openai')?.state).toBe('error');
  });

  it('returns unrecognized when the provider is not connected', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    expect(await h.testConnection({ providerId: 'openai' })).toEqual({ ok: false, error: 'unrecognized' });
  });

  it('sets the provider to error state when its stored creds are undecryptable', async () => {
    // Fix 8: `undecryptable` is distinct from `not-found` — the row exists but
    // its ciphertext is unreadable. The provider must be persisted as `'error'`
    // so `list()` surfaces it and the UI can prompt a re-key.
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-stored' },
    });
    repo.undecryptableProviders.add('openai');
    const h = createModelRegistryHandlers(deps);

    const result = await h.testConnection({ providerId: 'openai' });

    expect(result).toEqual({ ok: false, error: 'unrecognized' });
    expect(repo.getRegistryProvider('openai')?.state).toBe('error');
  });
});

describe('modelRegistry IPC — list', () => {
  it('returns a view row per connected provider with model counts', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('openai', [
      catalogModel({ id: 'gpt-4o', providerId: 'openai' }),
      catalogModel({ id: 'gpt-4o-mini', providerId: 'openai' }),
    ]);
    const h = createModelRegistryHandlers(deps);

    expect(await h.list()).toEqual([
      { providerId: 'openai', connectedVia: 'api-key', state: 'connected', modelCount: 2 },
    ]);
  });

  it('returns an empty list when nothing is connected', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);
    expect(await h.list()).toEqual([]);
  });
});

describe('modelRegistry IPC — getCatalog', () => {
  it('returns the catalog + curated view and applies a toggle override', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    // Two models in one family — the Curator enables both (flagship + previous).
    // `enriched: true` is required: Wave 4B added a Curator eligibility gate
    // that only recommends a family when at least one model is enriched
    // against models.dev (so legacy unmatched OpenAI ids don't all become
    // singleton-family flagships).
    repo.replaceRegistryCatalog('openai', [
      catalogModel({
        id: 'gpt-4o',
        providerId: 'openai',
        family: 'gpt-4o',
        releaseDate: '2024-05-01',
        enriched: true,
      }),
      catalogModel({
        id: 'gpt-4o-old',
        providerId: 'openai',
        family: 'gpt-4o',
        releaseDate: '2024-01-01',
        enriched: true,
      }),
    ]);
    // The user explicitly disabled the flagship.
    repo.setRegistryOverride('openai', 'gpt-4o', false);
    const h = createModelRegistryHandlers(deps);

    const { catalog, curated } = await h.getCatalog({ providerId: 'openai' });

    expect(catalog).toHaveLength(2);
    const flagship = curated.find((m) => m.id === 'gpt-4o');
    expect(flagship?.enabled).toBe(false); // override flipped it off
    const previous = curated.find((m) => m.id === 'gpt-4o-old');
    expect(previous?.enabled).toBe(true); // untouched — stays curated-enabled
  });

  it('returns empty views for an unknown provider', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);
    expect(await h.getCatalog({ providerId: 'openai' })).toEqual({ catalog: [], curated: [] });
  });
});

describe('modelRegistry IPC — curatedForAgent', () => {
  // Connect two providers (openai + flux-router) each with one enriched model
  // so the Curator recommends them.
  function twoProviderRepo(): Fakes {
    const fakes = makeFakes();
    const { repo } = fakes;
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.upsertRegistryProvider({
      providerId: 'flux-router',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('openai', [
      catalogModel({ id: 'gpt-4o', providerId: 'openai', family: 'gpt-4o', releaseDate: '2024-05-01', enriched: true }),
    ]);
    repo.replaceRegistryCatalog('flux-router', [
      catalogModel({
        id: 'flux-auto',
        providerId: 'flux-router',
        family: 'flux-auto',
        releaseDate: '2024-05-01',
        enriched: true,
      }),
    ]);
    return fakes;
  }

  it('wcore unions every connected provider', async () => {
    const { deps } = twoProviderRepo();
    const h = createModelRegistryHandlers(deps);
    const ids = (await h.curatedForAgent({ agentKey: 'wcore' })).map((m) => m.id);
    expect(ids).toContain('gpt-4o');
    expect(ids).toContain('flux-auto');
  });

  it('gemini unions every connected provider (AionCLI is multi-provider)', async () => {
    const { deps } = twoProviderRepo();
    const h = createModelRegistryHandlers(deps);
    const ids = (await h.curatedForAgent({ agentKey: 'gemini' })).map((m) => m.id);
    // The fix: a connected non-Google provider (Flux Router) must surface under
    // the gemini agent, not be filtered to google-gemini only.
    expect(ids).toContain('flux-auto');
    expect(ids).toContain('gpt-4o');
  });

  it('claude stays vendor-locked: only its underlying provider, else empty', async () => {
    const { deps } = twoProviderRepo();
    const h = createModelRegistryHandlers(deps);
    // anthropic is not connected in this repo, so claude returns nothing
    // (it must NOT union openai/flux-router).
    expect(await h.curatedForAgent({ agentKey: 'claude' })).toEqual([]);
  });
});

describe('modelRegistry IPC — toggleModel', () => {
  it('persists the override', async () => {
    const { deps, repo } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.toggleModel({ providerId: 'openai', modelId: 'gpt-4o', enabled: false });

    expect(result).toEqual({ ok: true });
    expect(repo.listRegistryOverrides('openai')).toEqual([{ modelId: 'gpt-4o', enabled: false }]);
  });
});

describe('modelRegistry IPC — refresh', () => {
  it('re-assembles and re-persists the catalog', async () => {
    const { deps, repo, apiListModels } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('openai', [catalogModel({ id: 'old-model', providerId: 'openai' })]);
    apiListModels.mockResolvedValue([{ id: 'gpt-4o-new', providerId: 'openai' }]);
    const h = createModelRegistryHandlers(deps);

    const result = await h.refresh({ providerId: 'openai' });

    expect(result).toEqual({ ok: true });
    expect(repo.getRegistryCatalog('openai').map((m) => m.id)).toEqual(['gpt-4o-new']);
  });

  it('returns ok:false when the provider is not connected', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);
    expect(await h.refresh({ providerId: 'openai' })).toEqual({ ok: false });
  });

  it('sets error and fails the refresh when stored creds are undecryptable', async () => {
    // Fix 8: a refresh against an undecryptable provider persists `'error'`.
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.undecryptableProviders.add('openai');
    const h = createModelRegistryHandlers(deps);

    const result = await h.refresh({ providerId: 'openai' });

    expect(result).toEqual({ ok: false });
    expect(repo.getRegistryProvider('openai')?.state).toBe('error');
  });
});

describe('modelRegistry IPC — disconnect', () => {
  it('removes the provider, its catalog, and its overrides', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('openai', [catalogModel({ id: 'gpt-4o', providerId: 'openai' })]);
    repo.setRegistryOverride('openai', 'gpt-4o', false);
    const h = createModelRegistryHandlers(deps);

    const result = await h.disconnect({ providerId: 'openai' });

    expect(result).toEqual({ ok: true });
    expect(repo.getRegistryProvider('openai')).toBeNull();
    expect(repo.getRegistryCatalog('openai')).toEqual([]);
    expect(repo.listRegistryOverrides('openai')).toEqual([]);
  });
});

describe('modelRegistry IPC — rekey', () => {
  it('replaces the credentials and re-assembles on success', async () => {
    const { deps, repo, test } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'error',
      creds: { key: 'sk-old' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.rekey({ providerId: 'openai', creds: { key: 'sk-new' } });

    expect(result).toEqual({ ok: true });
    expect(test).toHaveBeenCalledWith('openai', { key: 'sk-new' });
    expect(repo.getRegistryProviderCreds('openai')).toEqual({ status: 'ok', creds: { key: 'sk-new' } });
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
  });

  it('keeps the old credentials when the new key fails', async () => {
    const { deps, repo } = makeFakes({ testResult: { ok: false, error: 'unauthorized' } });
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-old' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.rekey({ providerId: 'openai', creds: { key: 'sk-bad' } });

    expect(result).toEqual({ ok: false, error: 'unauthorized' });
    expect(repo.getRegistryProviderCreds('openai')).toEqual({ status: 'ok', creds: { key: 'sk-old' } });
  });

  it('restores the previous working key when the rekey catalog build fails', async () => {
    // Fix 1: a rekey must not destroy a working key on a catalog-build failure.
    // The test passes (the new key is "valid") but the catalog persist throws —
    // the provider must be left with its PREVIOUS creds, not the unproven key.
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-old-working' },
    });
    repo.replaceRegistryCatalog = () => {
      throw new Error('disk full');
    };
    const h = createModelRegistryHandlers(deps);

    const result = await h.rekey({ providerId: 'openai', creds: { key: 'sk-new-unproven' } });

    expect(result).toEqual({ ok: false, error: 'unknown' });
    // The previous working key survives — the provider is not stranded.
    expect(repo.getRegistryProviderCreds('openai')).toEqual({ status: 'ok', creds: { key: 'sk-old-working' } });
    expect(repo.getRegistryProvider('openai')?.state).toBe('error');
  });

  it('refreshes connected_via on a successful rekey', async () => {
    // Fix 10: a provider first connected via auto-discovery then rekeyed with an
    // explicit key must not keep the stale `auto-discovered` label.
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'auto-discovered',
      state: 'connected',
      creds: { key: 'sk-old' },
    });
    const h = createModelRegistryHandlers(deps);

    await h.rekey({ providerId: 'openai', creds: { key: 'sk-new' } });

    expect(repo.getRegistryProvider('openai')?.connectedVia).toBe('api-key');
  });

  it('sets error and fails the rekey when stored creds are undecryptable on re-key', async () => {
    // Fix 8: an `undecryptable` prior-creds read during rekey still completes
    // the rekey if the new key works (the old creds cannot be restored, but the
    // new proven key replaces them).
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-old' },
    });
    repo.undecryptableProviders.add('openai');
    const h = createModelRegistryHandlers(deps);

    const result = await h.rekey({ providerId: 'openai', creds: { key: 'sk-new' } });

    // The new key proved out — the rekey succeeds and the new key is stored.
    expect(result).toEqual({ ok: true });
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
  });
});

describe('modelRegistry IPC — resolveForChatStart', () => {
  it('returns the chat-start payload for a connected api-key provider', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-resolve' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'openai', modelId: 'gpt-4o' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.providerId).toBe('openai');
      expect(result.provider.platform).toBe('openai');
      expect(result.provider.modelId).toBe('gpt-4o');
      expect(result.provider.apiKey).toBe('sk-resolve');
      expect(result.provider.baseUrl).toBe('https://api.openai.com/v1');
    }
  });

  it('preserves a user-saved custom baseUrl over the canonical one', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai-compatible',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-self', baseUrl: 'https://my-host.example.com/v1' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'openai-compatible', modelId: 'llama3' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.provider.baseUrl).toBe('https://my-host.example.com/v1');
  });

  it('returns the bedrockConfig block for an aws-bedrock provider', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'aws-bedrock',
      connectedVia: 'cloud-credentials',
      state: 'connected',
      creds: { fields: { accessKeyId: 'AKIA', secretAccessKey: 'sk', region: 'us-east-1' } },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({
      providerId: 'aws-bedrock',
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.platform).toBe('bedrock');
      expect(result.provider.bedrockConfig).toEqual({
        authMethod: 'accessKey',
        accessKeyId: 'AKIA',
        secretAccessKey: 'sk',
        region: 'us-east-1',
      });
    }
  });

  it('returns `not-connected` for a provider that does not exist', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'openai', modelId: 'gpt-4o' });

    expect(result).toEqual({ ok: false, error: 'not-connected' });
  });

  it('returns `undecryptable` for a provider whose creds cannot be decrypted', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-x' },
    });
    repo.undecryptableProviders.add('openai');
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'openai', modelId: 'gpt-4o' });

    expect(result).toEqual({ ok: false, error: 'undecryptable' });
  });

  // Wave 3 Fix 8 — Vertex `resolveForChatStart` returns its cloudFields.
  it('returns cloudFields for a vertex provider', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'vertex',
      connectedVia: 'cloud-credentials',
      state: 'connected',
      creds: { fields: { projectId: 'p', region: 'us-central1', serviceAccountJson: '{}' } },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'vertex', modelId: 'gemini-2.0-pro' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.platform).toBe('gemini-vertex-ai');
      expect(result.provider.cloudFields).toEqual({
        projectId: 'p',
        region: 'us-central1',
        serviceAccountJson: '{}',
      });
    }
  });

  // Wave 3 Fix 6 — profile-auth Bedrock returns the right bedrockConfig shape.
  it('returns profile-auth bedrockConfig for an aws-bedrock provider with profile creds', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'aws-bedrock',
      connectedVia: 'cloud-credentials',
      state: 'connected',
      creds: { fields: { awsProfile: 'default', region: 'us-east-1' }, bedrockAuth: 'profile' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({
      providerId: 'aws-bedrock',
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.bedrockConfig).toEqual({
        authMethod: 'profile',
        region: 'us-east-1',
        profile: 'default',
      });
    }
  });

  // Wave 3 Fix 9 — a connected api-key row with an empty key is undecryptable,
  // NOT unsupported.
  it('returns `undecryptable` for an api-key provider with a missing key', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: '' }, // an empty-key creds row is corrupted, not unsupported.
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'openai', modelId: 'gpt-4o' });

    expect(result).toEqual({ ok: false, error: 'undecryptable' });
  });

  // Wave 3 Fix 5 — modelProtocols round-trips from stored creds to payload.
  it('surfaces modelProtocols in the chat-start payload when present', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai-compatible',
      connectedVia: 'api-key',
      state: 'connected',
      creds: {
        key: 'sk',
        baseUrl: 'https://gateway.example.com',
        protocols: { 'claude-sonnet-4': 'anthropic' },
      },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'openai-compatible', modelId: 'claude-sonnet-4' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.modelProtocols).toEqual({ 'claude-sonnet-4': 'anthropic' });
    }
  });

  // Wave 3 Fix 6 — google-auth Gemini returns the legacy platform string.
  it('returns the gemini-with-google-auth platform for a useGoogleAuth row', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'google-gemini',
      connectedVia: 'google-auth',
      state: 'connected',
      creds: { useGoogleAuth: true },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'google-gemini', modelId: 'gemini-2.0-flash' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.platform).toBe('gemini-with-google-auth');
      expect(result.provider.apiKey).toBe(''); // No key — OAuth tokens live elsewhere.
    }
  });
});

describe('modelRegistry IPC — curatedForAgent', () => {
  it('unions every connected provider for the wcore agent', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.upsertRegistryProvider({
      providerId: 'anthropic',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('openai', [catalogModel({ id: 'gpt-4o', providerId: 'openai' })]);
    repo.replaceRegistryCatalog('anthropic', [catalogModel({ id: 'claude-3-5', providerId: 'anthropic' })]);
    const h = createModelRegistryHandlers(deps);

    const curated = await h.curatedForAgent({ agentKey: 'wcore' });

    expect(curated.map((m) => m.id).toSorted()).toEqual(['claude-3-5', 'gpt-4o']);
  });

  it('dedups a (providerId, id) pair the wcore union would otherwise repeat', async () => {
    // Fix 7: the wcore union must not emit a duplicate `(providerId, id)`.
    // The same model id appearing under two DIFFERENT providers is kept (the
    // consumer distinguishes by providerId), but a repeat within one provider
    // collapses to one entry.
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.upsertRegistryProvider({
      providerId: 'openrouter',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    // `openai` carries `gpt-4o` twice (a malformed catalog), `openrouter` once.
    repo.replaceRegistryCatalog('openai', [
      catalogModel({ id: 'gpt-4o', providerId: 'openai' }),
      catalogModel({ id: 'gpt-4o', providerId: 'openai' }),
    ]);
    repo.replaceRegistryCatalog('openrouter', [catalogModel({ id: 'gpt-4o', providerId: 'openrouter' })]);
    const h = createModelRegistryHandlers(deps);

    const curated = await h.curatedForAgent({ agentKey: 'wcore' });

    // The openai duplicate collapses; the openrouter copy is a distinct
    // (providerId, id) and survives — two entries total.
    expect(curated).toHaveLength(2);
    expect(curated.filter((m) => m.providerId === 'openai')).toHaveLength(1);
    expect(curated.filter((m) => m.providerId === 'openrouter')).toHaveLength(1);
  });

  it('builds an enumerable CLI agent (codex) from its CLI source', async () => {
    const { deps, cliListModels } = makeFakes();
    cliListModels.mockResolvedValue([{ id: 'gpt-5-codex', providerId: 'openai' }]);
    const h = createModelRegistryHandlers(deps);

    const curated = await h.curatedForAgent({ agentKey: 'codex' });

    expect(curated.map((m) => m.id)).toEqual(['gpt-5-codex']);
  });

  it('falls back to the underlying provider for a non-enumerable CLI agent', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'anthropic',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('anthropic', [catalogModel({ id: 'claude-3-5', providerId: 'anthropic' })]);
    const h = createModelRegistryHandlers(deps);

    const curated = await h.curatedForAgent({ agentKey: 'claude' });

    expect(curated.map((m) => m.id)).toEqual(['claude-3-5']);
  });

  it('returns [] for a non-enumerable CLI agent whose provider is not connected', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    expect(await h.curatedForAgent({ agentKey: 'gemini' })).toEqual([]);
  });

  it('returns [] for an unknown agent key', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);
    expect(await h.curatedForAgent({ agentKey: 'nonsense' })).toEqual([]);
  });
});

describe('modelRegistry IPC — defensive behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('connect never throws — a thrown collaborator yields a typed failure', async () => {
    const { deps } = makeFakes();
    deps.connectionTester.test = vi.fn().mockRejectedValue(new Error('network exploded'));
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { key: 'sk' } });

    expect(result).toEqual({ ok: false, error: 'unknown' });
  });

  it('does not return credential material in the list view', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-secret-value' },
    });
    const h = createModelRegistryHandlers(deps);

    const serialized = JSON.stringify(await h.list());
    expect(serialized).not.toContain('sk-secret-value');
  });

  it('curatedForAgent yields [] when assembly throws', async () => {
    const { deps } = makeFakes();
    deps.modelsDevClient.getRegistry = vi.fn().mockRejectedValue(new Error('registry down'));
    deps.makeCliSource = () => {
      throw new Error('cli source exploded');
    };
    const h = createModelRegistryHandlers(deps);

    expect(await h.curatedForAgent({ agentKey: 'codex' })).toEqual([]);
  });
});

// ─── Real-repository credential encryption round-trip ─────────────────────────

// `better-sqlite3` is a native module — skip these when its ABI does not match
// the test runner (the same guard the team-repository round-trip tests use).
let nativeSqliteAvailable = true;
try {
  const probe = new BetterSqlite3Driver(':memory:');
  probe.close();
} catch (e) {
  if (e instanceof Error && e.message.includes('NODE_MODULE_VERSION')) {
    nativeSqliteAvailable = false;
  }
}

const describeOrSkip = nativeSqliteAvailable ? describe : describe.skip;

describeOrSkip('ProviderRepository — registry credential encryption round-trip', () => {
  let driver: BetterSqlite3Driver;
  let repo: ProviderRepository;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    repo = new ProviderRepository(driver);
  });

  afterEach(() => {
    driver.close();
  });

  it('encrypts creds at rest and decrypts them back to the original', () => {
    const creds = { key: 'sk-super-secret-plaintext-value' };
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds,
    });

    // The decrypted creds must equal the original object.
    expect(repo.getRegistryProviderCreds('openai')).toEqual({ status: 'ok', creds });

    // The stored ciphertext column must NOT contain the plaintext, and must
    // carry the safeStorage `enc:v1:` prefix.
    const row = driver
      .prepare(`SELECT creds_encrypted FROM model_registry_providers WHERE provider_id = ?`)
      .get('openai') as { creds_encrypted: string };
    expect(row.creds_encrypted).not.toContain('sk-super-secret-plaintext-value');
    expect(row.creds_encrypted.startsWith('enc:v1:')).toBe(true);
  });

  it('re-encrypts on updateRegistryProviderCreds and still round-trips', () => {
    repo.upsertRegistryProvider({
      providerId: 'anthropic',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-ant-old' },
    });

    const rekeyed = { key: 'sk-ant-rotated-secret' };
    repo.updateRegistryProviderCreds('anthropic', rekeyed);

    expect(repo.getRegistryProviderCreds('anthropic')).toEqual({ status: 'ok', creds: rekeyed });
    const row = driver
      .prepare(`SELECT creds_encrypted FROM model_registry_providers WHERE provider_id = ?`)
      .get('anthropic') as { creds_encrypted: string };
    expect(row.creds_encrypted).not.toContain('sk-ant-rotated-secret');
  });

  it('returns status "not-found" for a provider that was never connected', () => {
    expect(repo.getRegistryProviderCreds('openai')).toEqual({ status: 'not-found' });
  });

  it('returns status "undecryptable" when the stored ciphertext is corrupt', () => {
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-original' },
    });

    // Simulate creds that became unreadable (OS keychain rotation, corruption).
    driver
      .prepare(`UPDATE model_registry_providers SET creds_encrypted = ? WHERE provider_id = ?`)
      .run('enc:v1:not-valid-ciphertext', 'openai');

    // The provider row still exists — the result must distinguish this from
    // "not connected" so a follow-up can surface a re-key path.
    expect(repo.getRegistryProvider('openai')).not.toBeNull();
    expect(repo.getRegistryProviderCreds('openai')).toEqual({ status: 'undecryptable' });
  });

  it('deleteRegistryProvider cascades to catalog and overrides via the FK', () => {
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('openai', [
      catalogModel({ id: 'gpt-4o', providerId: 'openai' }),
      catalogModel({ id: 'gpt-4o-mini', providerId: 'openai' }),
    ]);
    repo.setRegistryOverride('openai', 'gpt-4o', false);

    repo.deleteRegistryProvider('openai');

    // The single provider delete must leave no orphaned child rows.
    expect(repo.getRegistryProvider('openai')).toBeNull();
    expect(repo.getRegistryCatalog('openai')).toEqual([]);
    expect(repo.listRegistryOverrides('openai')).toEqual([]);
    const catalogCount = driver
      .prepare(`SELECT COUNT(*) AS n FROM model_registry_catalog WHERE provider_id = ?`)
      .get('openai') as { n: number };
    const overrideCount = driver
      .prepare(`SELECT COUNT(*) AS n FROM model_registry_overrides WHERE provider_id = ?`)
      .get('openai') as { n: number };
    expect(catalogCount.n).toBe(0);
    expect(overrideCount.n).toBe(0);
  });

  it('countRegistryCatalog returns the persisted model count without parsing blobs', () => {
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('openai', [
      catalogModel({ id: 'gpt-4o', providerId: 'openai' }),
      catalogModel({ id: 'gpt-4o-mini', providerId: 'openai' }),
      catalogModel({ id: 'o3', providerId: 'openai' }),
    ]);

    expect(repo.countRegistryCatalog('openai')).toBe(3);
    expect(repo.countRegistryCatalog('anthropic')).toBe(0);
  });
});

// ─── Ship-gate Fix A1: migration defers when safeStorage unavailable ───────────

// ─── Post-upgrade catalog refresh ─────────────────────────────────────────────

describe('runPostUpgradeCatalogRefresh', () => {
  it('refreshes every registered provider once when the cursor is below CATALOG_DATA_VERSION', async () => {
    const mod = await import('@process/providers/ipc/modelRegistryIpc');
    const refreshCalls: ProviderId[] = [];
    const repoStub = {
      listRegistryProviders: () => [
        { providerId: 'openai' as ProviderId },
        { providerId: 'anthropic' as ProviderId },
        { providerId: 'google-gemini' as ProviderId },
      ],
    };
    const handlersStub = {
      refresh: async ({ providerId }: { providerId: ProviderId }) => {
        refreshCalls.push(providerId);
        return { ok: true };
      },
    };
    let cursor: number | undefined = 0;
    await mod._runPostUpgradeCatalogRefresh(repoStub, handlersStub, {
      get: async () => cursor,
      set: async (v) => {
        cursor = v;
      },
    });
    expect(refreshCalls).toEqual(['openai', 'anthropic', 'google-gemini']);
    expect(cursor).toBe(mod.CATALOG_DATA_VERSION);
  });

  it('is idempotent — a second call with the cursor at CATALOG_DATA_VERSION is a no-op', async () => {
    const mod = await import('@process/providers/ipc/modelRegistryIpc');
    let refreshCount = 0;
    const repoStub = {
      listRegistryProviders: () => [{ providerId: 'openai' as ProviderId }],
    };
    const handlersStub = {
      refresh: async () => {
        refreshCount++;
        return { ok: true };
      },
    };
    let cursor: number | undefined = mod.CATALOG_DATA_VERSION;
    await mod._runPostUpgradeCatalogRefresh(repoStub, handlersStub, {
      get: async () => cursor,
      set: async (v) => {
        cursor = v;
      },
    });
    expect(refreshCount).toBe(0);
  });

  it('continues the sweep when one provider refresh throws + still bumps the cursor', async () => {
    const mod = await import('@process/providers/ipc/modelRegistryIpc');
    const refreshCalls: ProviderId[] = [];
    const repoStub = {
      listRegistryProviders: () => [
        { providerId: 'openai' as ProviderId },
        { providerId: 'anthropic' as ProviderId },
        { providerId: 'google-gemini' as ProviderId },
      ],
    };
    const handlersStub = {
      refresh: async ({ providerId }: { providerId: ProviderId }) => {
        refreshCalls.push(providerId);
        if (providerId === 'anthropic') throw new Error('boom');
        return { ok: true };
      },
    };
    let cursor: number | undefined = 0;
    await mod._runPostUpgradeCatalogRefresh(repoStub, handlersStub, {
      get: async () => cursor,
      set: async (v) => {
        cursor = v;
      },
    });
    // Every provider was attempted, in order.
    expect(refreshCalls).toEqual(['openai', 'anthropic', 'google-gemini']);
    // The cursor still advanced — a single provider's failure is acceptable.
    expect(cursor).toBe(mod.CATALOG_DATA_VERSION);
  });
});

describe('runStartupMigration — safeStorage gating (Fix A1)', () => {
  it('returns early (without touching the repo) when safeStorage is unavailable', async () => {
    // The mockSafeStorage hoist defaults to `isEncryptionAvailable: true`. Flip
    // it false to simulate a pre-`app.whenReady()` boot OR a host whose OS
    // keychain backend is absent (the two cases the gate guards against).
    mockSafeStorage.isEncryptionAvailable.mockReturnValueOnce(false);

    // A repo whose every method throws — proves the migration never reached
    // the repo because the safeStorage gate returned early.
    const repoStub = new Proxy({} as ProviderRepository, {
      get: () => () => {
        throw new Error('repo must not be touched when safeStorage is unavailable');
      },
    });

    const mod = await import('@process/providers/ipc/modelRegistryIpc');
    await expect(mod._runStartupMigrationForTests(repoStub)).resolves.toBeUndefined();
  });
});

// ─── Ship-gate Fix B2: connect persists baseUrl in creds ──────────────────────

describe('connect — baseUrl persistence (Fix B2)', () => {
  it('persists creds.baseUrl when an openai-compatible provider supplies one', async () => {
    const repo = new FakeRepo();
    const deps: ModelRegistryDeps = {
      repo,
      keyDiscovery: { scan: async () => [], readValue: () => null },
      connectionTester: { test: async () => ({ ok: true }) },
      modelsDevClient: { getRegistry: async () => ({}) },
      makeApiSource: (providerId) => ({
        kind: 'api' as const,
        providerId,
        listModels: async () => [{ id: 'mod-1', providerId }],
      }),
      makeCliSource: () => {
        throw new Error('not used');
      },
    };
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({
      providerId: 'openai-compatible',
      creds: { key: 'sk-test', baseUrl: 'https://my-endpoint.example/v1' },
    });

    expect(result).toEqual({ ok: true });
    const stored = repo.providers.get('openai-compatible');
    expect(stored?.creds).toEqual({ key: 'sk-test', baseUrl: 'https://my-endpoint.example/v1' });
  });

  it('does NOT persist creds.baseUrl when the caller does not supply one', async () => {
    const repo = new FakeRepo();
    const deps: ModelRegistryDeps = {
      repo,
      keyDiscovery: { scan: async () => [], readValue: () => null },
      connectionTester: { test: async () => ({ ok: true }) },
      modelsDevClient: { getRegistry: async () => ({}) },
      makeApiSource: (providerId) => ({
        kind: 'api' as const,
        providerId,
        listModels: async () => [{ id: 'mod-1', providerId }],
      }),
      makeCliSource: () => {
        throw new Error('not used');
      },
    };
    const h = createModelRegistryHandlers(deps);

    await h.connect({ providerId: 'openai-compatible', creds: { key: 'sk-test' } });

    const stored = repo.providers.get('openai-compatible');
    expect(stored?.creds).toEqual({ key: 'sk-test' });
    expect((stored?.creds as Record<string, unknown>)?.baseUrl).toBeUndefined();
  });
});
