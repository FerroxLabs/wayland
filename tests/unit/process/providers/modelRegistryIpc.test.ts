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
 * verify real handler behavior - credential resolution, catalog assembly,
 * override application, defensive error handling - without any network, disk,
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

// The chatgpt-subscription catalog now fetches the live Codex model list. Mock
// the network layer so these tests stay hermetic: default to a non-200 so the
// live fetch fails and the catalog falls back to the static snapshot (the path
// most of these tests exercise). Individual tests override per-case.
vi.mock('@process/utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(async () => ({ ok: false, json: async () => ({}) })),
}));

import {
  createModelRegistryHandlers,
  CloudRegistrySource,
  resolveSpawnSecretsFromRepo,
} from '@process/providers/ipc/modelRegistryIpc';
import type { ModelRegistryDeps, SpawnHandle } from '@process/providers/ipc/modelRegistryIpc';
import { fetchWithRetry } from '@process/utils/fetchWithRetry';

describe('CloudRegistrySource - google-auth Gemini catalog (zero-models regression)', () => {
  // A google-auth Gemini connection routes through the cloud-synthesis path but
  // its providerId is `google-gemini` - NOT in CLOUD_PROVIDERS - so the cloud-only
  // key map missed it and the catalog came back empty ("Connected · No models").
  // The fix falls back to the full provider→models.dev key map (google-gemini → google).
  it('synthesizes Gemini models from the models.dev `google` slice for providerId google-gemini', async () => {
    const registry = {
      google: { models: { 'gemini-2.5-pro': {}, 'gemini-flash-latest': {} } },
    } as never;
    const src = new CloudRegistrySource('google-gemini' as never, registry);
    const models = await src.listModels();
    expect(models.map((m) => m.id).toSorted()).toEqual(['gemini-2.5-pro', 'gemini-flash-latest']);
  });
});
import type { CatalogModel, ProviderId } from '@process/providers/types';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import type {
  RegistryCredsResult,
  RegistryOverride,
  RegistryProvider,
} from '@process/providers/storage/ProviderRepository';
import type { DiscoveredKey } from '@process/providers/detection/KeyDiscovery';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { describeNativeSqlite } from '../../helpers/nativeSqlite';
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
   * Provider ids in `undecryptableProviders` resolve to `'undecryptable'` -
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

describe('modelRegistry IPC - detectKeys', () => {
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

describe('modelRegistry IPC - connect', () => {
  it('connects a standard provider, persists it, and builds the catalog', async () => {
    const { deps, repo, test } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { key: 'sk-test' } });

    expect(result).toEqual({ ok: true });
    expect(test).toHaveBeenCalledWith('openai', { key: 'sk-test' }, undefined);
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
    expect(repo.getRegistryProviderCreds('openai')).toEqual({ status: 'ok', creds: { key: 'sk-test' } });
    expect(repo.getRegistryCatalog('openai').map((m) => m.id)).toEqual(['gpt-4o']);
  });

  it('lands an auth-OK custom base with no /models listing as connected-but-empty, not error (#339)', async () => {
    // Cloudflare Workers AI authenticates (ConnectionTester proved it via the
    // chat fallback) but exposes no /models, so the catalog build lists nothing
    // (the /models GET throws -> sourceErrors > 0). The connect must land the
    // provider connected with a `no-models` warning instead of flipping it to
    // error/rejecting - otherwise a working endpoint can never be added.
    const { deps, repo, apiListModels } = makeFakes();
    apiListModels.mockRejectedValue(new Error('404 no /models on this gateway'));
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({
      providerId: 'openai-compatible',
      creds: { key: 'cf-token', baseUrl: 'https://api.cloudflare.com/client/v4/accounts/abc/ai/v1' },
    });

    expect(result).toEqual({ ok: true, warning: 'no-models' });
    expect(repo.getRegistryProvider('openai-compatible')?.state).toBe('connected');
    expect(repo.getRegistryCatalog('openai-compatible')).toEqual([]);
  });

  it('still rejects a CANONICAL provider whose catalog build lists nothing (no false green)', async () => {
    // The custom-base exemption must NOT leak to canonical providers: an openai
    // connect whose catalog build errors to empty is still a hard failure.
    const { deps, repo, apiListModels } = makeFakes();
    apiListModels.mockRejectedValue(new Error('listing failed'));
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { key: 'sk-test' } });

    expect(result).toEqual({ ok: false, error: 'unknown' });
    expect(repo.getRegistryProvider('openai')?.state).toBe('error');
  });

  it('threads the catalog baseUrl when a catalog provider has no hardcoded endpoint (#63)', async () => {
    const { deps, test } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    // opencode-go is a "100+ more" catalog provider (no PROVIDER_ENDPOINTS entry);
    // its endpoint must be resolved from the bundled catalog or the connection
    // test has no URL to probe and always fails "unknown".
    await h.connect({ providerId: 'opencode-go' as ProviderId, creds: { key: 'sk-test' } });

    const call = test.mock.calls.find((c) => c[0] === 'opencode-go');
    expect(call).toBeDefined();
    expect(call?.[2]).toBe('https://opencode.ai/zen/go/v1');
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
    expect(test).toHaveBeenCalledWith('anthropic', { key: 'sk-ant-resolved' }, undefined);
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
    // And the persisted provider must NOT be a false green - it is `'error'`.
    expect(repo.getRegistryProvider('openai')?.state).toBe('error');
    expect(repo.getRegistryProvider('openai')?.error).toBe('unknown');
  });

  it('rejects a cloud connect with an empty fields object', async () => {
    // Fix 3: a cloud connect skips the HTTP probe but must still validate that
    // the required credential fields are present - empty fields is rejected.
    const { deps, repo } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'aws-bedrock', creds: { fields: {} } });

    expect(result).toEqual({ ok: false, error: 'unrecognized' });
    expect(repo.getRegistryProvider('aws-bedrock')).toBeNull();
  });

  it('rejects a cloud connect missing a required field', async () => {
    // Fix 3: Bedrock needs accessKeyId + secretAccessKey + region - a payload
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
    // key for the catalog build - reject it up front rather than building empty.
    const { deps, repo } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { fields: { token: 'x' } } });

    expect(result).toEqual({ ok: false, error: 'unrecognized' });
    expect(repo.getRegistryProvider('openai')).toBeNull();
  });

  it('treats an empty catalog with a failed source as a degraded connect', async () => {
    // Fix 4: every source failing yields [] - that is NOT a successful empty
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
    // still a valid `connected` - only a degraded empty result fails.
    const { deps, repo, apiListModels } = makeFakes();
    apiListModels.mockResolvedValue([]);
    const h = createModelRegistryHandlers(deps);

    const result = await h.connect({ providerId: 'openai', creds: { key: 'sk-test' } });

    expect(result).toEqual({ ok: true });
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
  });
});

describe('modelRegistry IPC - testConnection', () => {
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
    expect(test).toHaveBeenCalledWith('openai', { key: 'sk-stored' }, undefined);
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
  });

  it('marks the provider in error state on a hard-failed test', async () => {
    const { deps, repo } = makeFakes({ testResult: { ok: false, error: 'invalid-key' } });
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-stored' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.testConnection({ providerId: 'openai' });

    expect(result).toEqual({ ok: false, error: 'invalid-key' });
    expect(repo.getRegistryProvider('openai')?.state).toBe('error');
  });

  it('keeps the provider connected on a no-credit test result (#100)', async () => {
    // A no-credit key still authenticates - it must NOT flip the provider to
    // error (it sits connected-but-switched-off), consistent with connect (#100).
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
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
  });

  it('returns unrecognized when the provider is not connected', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    expect(await h.testConnection({ providerId: 'openai' })).toEqual({ ok: false, error: 'unrecognized' });
  });

  it('sets the provider to error state when its stored creds are undecryptable', async () => {
    // Fix 8: `undecryptable` is distinct from `not-found` - the row exists but
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

describe('modelRegistry IPC - list', () => {
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

describe('modelRegistry IPC - getCatalog', () => {
  it('returns the catalog + curated view and applies a toggle override', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    // Two models in one family - the Curator enables both (flagship + previous).
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
    expect(previous?.enabled).toBe(true); // untouched - stays curated-enabled
  });

  it('returns empty views for an unknown provider', async () => {
    const { deps } = makeFakes();
    const h = createModelRegistryHandlers(deps);
    expect(await h.getCatalog({ providerId: 'openai' })).toEqual({ catalog: [], curated: [] });
  });
});

describe('modelRegistry IPC - curatedForAgent', () => {
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

  it('claude stays vendor-locked: never unions sibling providers', async () => {
    const { deps } = twoProviderRepo();
    const h = createModelRegistryHandlers(deps);
    // anthropic is not connected and the (mock) models.dev registry is empty, so
    // claude returns nothing here - and critically must NOT union openai /
    // flux-router. The populated-registry fallback is covered below (#125).
    expect(await h.curatedForAgent({ agentKey: 'claude' })).toEqual([]);
  });

  it('claude (#125): synthesizes the anthropic family from models.dev when no API key is connected', async () => {
    const { deps, getRegistry } = twoProviderRepo();
    // A Claude Pro/Max CLI user has no Anthropic API key, so anthropic is not a
    // connected provider. The picker must still show models, sourced from the
    // models.dev registry - and only anthropic models, never openai/flux.
    getRegistry.mockResolvedValue({
      anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        env: [],
        models: {
          'claude-opus-4-8': { id: 'claude-opus-4-8', name: 'Claude Opus 4.8' },
        },
      },
    });
    const h = createModelRegistryHandlers(deps);
    const curated = await h.curatedForAgent({ agentKey: 'claude' });
    expect(curated.map((m) => m.id)).toContain('claude-opus-4-8');
    expect(curated.every((m) => m.providerId === 'anthropic')).toBe(true);
  });
});

describe('modelRegistry IPC - toggleModel', () => {
  it('persists the override', async () => {
    const { deps, repo } = makeFakes();
    const h = createModelRegistryHandlers(deps);

    const result = await h.toggleModel({ providerId: 'openai', modelId: 'gpt-4o', enabled: false });

    expect(result).toEqual({ ok: true });
    expect(repo.listRegistryOverrides('openai')).toEqual([{ modelId: 'gpt-4o', enabled: false }]);
  });
});

describe('modelRegistry IPC - refresh', () => {
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

  it('on refresh, falls back to the current static snapshot when the live fetch fails (never wipes, never the generic API source)', async () => {
    // The ChatGPT subscription token can't be listed via `/v1/models`, so the
    // generic API source is never used. The catalog now fetches the live Codex
    // model list; when that fetch fails (here: the mocked non-200), it falls back
    // to the CURRENT static snapshot rather than wiping to []. The dead pre-5.3
    // slugs must never come back.
    const { deps, repo, apiListModels } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'chatgpt-subscription',
      connectedVia: 'ChatGPT subscription',
      state: 'connected',
      creds: { key: 'access-token', baseUrl: 'https://chatgpt.com/backend-api' },
    });
    repo.replaceRegistryCatalog('chatgpt-subscription', [
      catalogModel({ id: 'gpt-5.5', providerId: 'chatgpt-subscription' }),
    ]);
    apiListModels.mockResolvedValue([]);
    const h = createModelRegistryHandlers(deps);

    const result = await h.refresh({ providerId: 'chatgpt-subscription' });

    expect(result).toEqual({ ok: true });
    const ids = repo.getRegistryCatalog('chatgpt-subscription').map((m) => m.id);
    expect(ids.length).toBeGreaterThan(0); // not wiped
    expect(ids).toContain('gpt-5.5'); // current static fallback
    expect(ids).not.toContain('gpt-5.2'); // dead slug never returns
    // chatgpt-subscription never routes through the generic /v1/models source.
    expect(apiListModels).not.toHaveBeenCalled();
  });

  it('on refresh, persists the LIVE Codex model list when the endpoint responds', async () => {
    const { deps, repo, apiListModels } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'chatgpt-subscription',
      connectedVia: 'ChatGPT subscription',
      state: 'connected',
      creds: { key: 'access-token', baseUrl: 'https://chatgpt.com/backend-api' },
    });
    vi.mocked(fetchWithRetry).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [
          { slug: 'gpt-5.5', display_name: 'GPT-5.5', visibility: 'list' },
          { slug: 'gpt-5.4-mini', display_name: 'GPT-5.4-Mini', visibility: 'list' },
        ],
      }),
    } as unknown as Response);
    const h = createModelRegistryHandlers(deps);

    const result = await h.refresh({ providerId: 'chatgpt-subscription' });

    expect(result).toEqual({ ok: true });
    const ids = repo.getRegistryCatalog('chatgpt-subscription').map((m) => m.id);
    expect(ids).toEqual(['gpt-5.5', 'gpt-5.4-mini']);
    expect(apiListModels).not.toHaveBeenCalled();
  });

  it('falls back to the models.dev slice when an OAuth bearer (xai) lists no models', async () => {
    // Regression: "Sign in with X" gives a bearer that works for inference but
    // returns nothing from `/v1/models`, so xai's catalog was persisted empty
    // and its provider toggle went dead. Synthesize the CURRENT catalog from the
    // models.dev registry instead (no hardcoded grok ids - this self-updates).
    const { deps, repo, apiListModels, getRegistry } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'xai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'oauth-bearer' },
    });
    // The live listing returns nothing (the OAuth-bearer limitation)...
    apiListModels.mockResolvedValue([]);
    // ...but models.dev tracks the current grok line.
    getRegistry.mockResolvedValue({ xai: { models: { 'grok-4': {}, 'grok-3': {} } } });
    const h = createModelRegistryHandlers(deps);

    const result = await h.refresh({ providerId: 'xai' });

    expect(result).toEqual({ ok: true });
    const ids = repo
      .getRegistryCatalog('xai')
      .map((m) => m.id)
      .toSorted();
    expect(ids).toContain('grok-4');
    expect(ids).toContain('grok-3');
  });

  it('does NOT use the models.dev fallback when the live listing is non-empty (api key wins)', async () => {
    // An API-key xai with a working `/v1/models` keeps its real account models;
    // the fallback must not overwrite them with the broader registry slice.
    const { deps, repo, apiListModels, getRegistry } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'xai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'real-api-key' },
    });
    apiListModels.mockResolvedValue([{ id: 'grok-4-fast', providerId: 'xai' }]);
    getRegistry.mockResolvedValue({ xai: { models: { 'grok-4': {}, 'grok-3': {} } } });
    const h = createModelRegistryHandlers(deps);

    const result = await h.refresh({ providerId: 'xai' });

    expect(result).toEqual({ ok: true });
    expect(repo.getRegistryCatalog('xai').map((m) => m.id)).toEqual(['grok-4-fast']);
  });
});

describe('modelRegistry IPC - disconnect', () => {
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

describe('modelRegistry IPC - rekey', () => {
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
    expect(test).toHaveBeenCalledWith('openai', { key: 'sk-new' }, undefined);
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
    // The test passes (the new key is "valid") but the catalog persist throws -
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
    // The previous working key survives - the provider is not stranded.
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

    // The new key proved out - the rekey succeeds and the new key is stored.
    expect(result).toEqual({ ok: true });
    expect(repo.getRegistryProvider('openai')?.state).toBe('connected');
  });
});

describe('modelRegistry IPC - resolveForChatStart', () => {
  it('returns the non-secret chat-start handle for a connected api-key provider', async () => {
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
      expect(result.provider.baseUrl).toBe('https://api.openai.com/v1');
      // Defaults to the single-account row when no accountId is passed (audit C2/C5).
      expect(result.provider.accountId).toBe('default');
    }
  });

  // Audit C4: the decrypted key must NEVER cross IPC to the renderer. The handler
  // returns only a non-secret handle - no apiKey / bedrockConfig / cloudFields.
  it('never returns decrypted secrets to the renderer (audit C4)', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-secret-must-not-leak' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'openai', modelId: 'gpt-4o' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const serialized = JSON.stringify(result.provider);
      expect(serialized).not.toContain('sk-secret-must-not-leak');
      expect('apiKey' in result.provider).toBe(false);
      expect('bedrockConfig' in result.provider).toBe(false);
      expect('cloudFields' in result.provider).toBe(false);
    }
  });

  it('echoes an explicit accountId back on the handle', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-resolve' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'openai', modelId: 'gpt-4o', accountId: 'acct_beta' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.provider.accountId).toBe('acct_beta');
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

  it('returns the bedrock platform handle without leaking the cloud creds (audit C4)', async () => {
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
      // The bedrock creds (incl. the secret access key) are resolved in main at
      // spawn, never returned to the renderer.
      expect('bedrockConfig' in result.provider).toBe(false);
      expect(JSON.stringify(result.provider)).not.toContain('AKIA');
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

  // Wave 3 Fix 8 - Vertex `resolveForChatStart` returns its cloudFields.
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
      // cloudFields (the vertex service-account creds) are resolved in main at
      // spawn, never returned to the renderer (audit C4).
      expect('cloudFields' in result.provider).toBe(false);
      expect(JSON.stringify(result.provider)).not.toContain('serviceAccountJson');
    }
  });

  // Wave 3 Fix 6 - profile-auth Bedrock returns the right bedrockConfig shape.
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
      // Profile-auth bedrock still routes to the bedrock platform, but the creds
      // are resolved at spawn - the handle carries no bedrockConfig (audit C4).
      expect(result.provider.platform).toBe('bedrock');
      expect('bedrockConfig' in result.provider).toBe(false);
    }
  });

  // Wave 3 Fix 9 - a connected api-key row with an empty key is undecryptable,
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

  // Wave 3 Fix 5 - modelProtocols round-trips from stored creds to payload.
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

  // Wave 3 Fix 6 - google-auth Gemini returns the legacy platform string.
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
      // OAuth tokens live in the main-process auth store; the handle has no key field.
      expect('apiKey' in result.provider).toBe(false);
    }
  });
});

describe('modelRegistry IPC - curatedForAgent', () => {
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
    // (providerId, id) and survives - two entries total.
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

describe('modelRegistry IPC - curatedForAgent ACP backends (#374)', () => {
  it('synthesizes xAI models for the grok backend before first connection (cut blocker)', async () => {
    // Grok Build is vendor-locked (grok.com) and not connected as an API
    // provider, so the home picker used to dead-end on the "available after
    // first connection" tooltip. It must instead synthesize xAI's catalog.
    const { deps, getRegistry } = makeFakes();
    getRegistry.mockResolvedValue({
      xai: { models: { 'grok-4': { name: 'Grok 4' }, 'grok-3-mini': { name: 'Grok 3 Mini' } } },
    });
    const h = createModelRegistryHandlers(deps);

    const ids = (await h.curatedForAgent({ agentKey: 'grok' })).map((m) => m.id).toSorted();

    expect(ids).toEqual(['grok-3-mini', 'grok-4']);
  });

  it('prefers the connected xAI catalog for grok when the provider is connected', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'xai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('xai', [catalogModel({ id: 'grok-4', providerId: 'xai' })]);
    const h = createModelRegistryHandlers(deps);

    const curated = await h.curatedForAgent({ agentKey: 'grok' });

    expect(curated.map((m) => m.id)).toEqual(['grok-4']);
  });

  it('falls back to openai synthesis for codex when the CLI enumerates nothing (Flux-only fix)', async () => {
    // Fresh profile: codex CLI not installed -> enumeration is empty. The picker
    // must still surface GPT models from models.dev instead of Flux-only.
    const { deps, cliListModels, getRegistry } = makeFakes();
    cliListModels.mockResolvedValue([]);
    getRegistry.mockResolvedValue({ openai: { models: { 'gpt-5.5-codex': { name: 'GPT-5.5 Codex' } } } });
    const h = createModelRegistryHandlers(deps);

    const ids = (await h.curatedForAgent({ agentKey: 'codex' })).map((m) => m.id);

    expect(ids).toEqual(['gpt-5.5-codex']);
  });

  it('keeps the live CLI enumeration for codex when it is non-empty (no synthesis override)', async () => {
    const { deps, cliListModels, getRegistry } = makeFakes();
    cliListModels.mockResolvedValue([{ id: 'gpt-5-codex', providerId: 'openai' }]);
    // If synthesis wrongly ran it would surface this id instead - it must NOT.
    getRegistry.mockResolvedValue({ openai: { models: { 'should-not-appear': {} } } });
    const h = createModelRegistryHandlers(deps);

    const ids = (await h.curatedForAgent({ agentKey: 'codex' })).map((m) => m.id);

    expect(ids).toEqual(['gpt-5-codex']);
  });

  it('synthesizes moonshot models for the kimi backend', async () => {
    const { deps, getRegistry } = makeFakes();
    getRegistry.mockResolvedValue({ moonshotai: { models: { 'kimi-k2': { name: 'Kimi K2' } } } });
    const h = createModelRegistryHandlers(deps);

    const ids = (await h.curatedForAgent({ agentKey: 'kimi' })).map((m) => m.id);

    expect(ids).toEqual(['kimi-k2']);
  });

  it('returns [] for a multi-provider ACP backend with no single underlying provider (goose)', async () => {
    // goose/opencode/droid/… run any connected provider, so there is no single
    // catalog to synthesize - the picker offers Flux Auto (when routable) rather
    // than a misleading vendor catalog.
    const { deps, getRegistry } = makeFakes();
    getRegistry.mockResolvedValue({ xai: { models: { 'grok-4': {} } } });
    const h = createModelRegistryHandlers(deps);

    expect(await h.curatedForAgent({ agentKey: 'goose' })).toEqual([]);
  });
});

describe('modelRegistry IPC - curatedForAgent codex via ChatGPT subscription (#374 reopen)', () => {
  it('uses the connected chatgpt-subscription catalog for codex (not the empty openai synth)', async () => {
    // The #377 gap: a ChatGPT-subscription user has no `openai` provider, so
    // synthesizing `openai` returned empty and the picker fell to Flux-only.
    const { deps, repo, cliListModels } = makeFakes();
    cliListModels.mockResolvedValue([]); // no codex CLI installed
    repo.upsertRegistryProvider({
      providerId: 'chatgpt-subscription',
      connectedVia: 'oauth',
      state: 'connected',
      creds: { key: 'tok' },
    });
    repo.replaceRegistryCatalog('chatgpt-subscription', [
      catalogModel({ id: 'gpt-5.5', providerId: 'chatgpt-subscription' }),
      catalogModel({ id: 'gpt-5.4', providerId: 'chatgpt-subscription' }),
    ]);
    const h = createModelRegistryHandlers(deps);

    const ids = (await h.curatedForAgent({ agentKey: 'codex' })).map((m) => m.id).toSorted();

    expect(ids).toEqual(['gpt-5.4', 'gpt-5.5']);
  });

  it('prefers the chatgpt-subscription catalog over codex CLI enumeration', async () => {
    const { deps, repo, cliListModels } = makeFakes();
    cliListModels.mockResolvedValue([{ id: 'gpt-5-codex', providerId: 'openai' }]); // CLI present
    repo.upsertRegistryProvider({
      providerId: 'chatgpt-subscription',
      connectedVia: 'oauth',
      state: 'connected',
      creds: { key: 'tok' },
    });
    repo.replaceRegistryCatalog('chatgpt-subscription', [
      catalogModel({ id: 'gpt-5.5', providerId: 'chatgpt-subscription' }),
    ]);
    const h = createModelRegistryHandlers(deps);

    const ids = (await h.curatedForAgent({ agentKey: 'codex' })).map((m) => m.id);

    expect(ids).toEqual(['gpt-5.5']);
  });

  it('falls through to CLI enumeration when chatgpt-subscription is connected but its catalog is empty', async () => {
    const { deps, repo, cliListModels } = makeFakes();
    cliListModels.mockResolvedValue([{ id: 'gpt-5-codex', providerId: 'openai' }]);
    repo.upsertRegistryProvider({
      providerId: 'chatgpt-subscription',
      connectedVia: 'oauth',
      state: 'connected',
      creds: { key: 'tok' },
    });
    repo.replaceRegistryCatalog('chatgpt-subscription', []); // connected but no models persisted
    const h = createModelRegistryHandlers(deps);

    const ids = (await h.curatedForAgent({ agentKey: 'codex' })).map((m) => m.id);

    expect(ids).toEqual(['gpt-5-codex']);
  });

  it('still serves the openai API-key catalog for codex when no subscription is connected (#377 path intact)', async () => {
    const { deps, repo, cliListModels } = makeFakes();
    cliListModels.mockResolvedValue([]); // no CLI
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk' },
    });
    repo.replaceRegistryCatalog('openai', [catalogModel({ id: 'gpt-4o', providerId: 'openai' })]);
    const h = createModelRegistryHandlers(deps);

    const ids = (await h.curatedForAgent({ agentKey: 'codex' })).map((m) => m.id);

    expect(ids).toEqual(['gpt-4o']);
  });

  it('leaves claude unaffected by the codex OAuth-provider preference (empty OAuth list)', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'anthropic',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'k' },
    });
    repo.replaceRegistryCatalog('anthropic', [catalogModel({ id: 'claude-3-5', providerId: 'anthropic' })]);
    const h = createModelRegistryHandlers(deps);

    expect((await h.curatedForAgent({ agentKey: 'claude' })).map((m) => m.id)).toEqual(['claude-3-5']);
  });
});

describe('modelRegistry IPC - defensive behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('connect never throws - a thrown collaborator yields a typed failure', async () => {
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

// `better-sqlite3` is a native module - describeNativeSqlite runs this when the
// ABI matches (CI / after `npm rebuild better-sqlite3`), skips it locally on the
// Electron-ABI dev build, and fails loudly in CI if the module ever goes missing.
describeNativeSqlite('ProviderRepository - registry credential encryption round-trip', () => {
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

    // The provider row still exists - the result must distinguish this from
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

  it('is idempotent - a second call with the cursor at CATALOG_DATA_VERSION is a no-op', async () => {
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
    // The cursor still advanced - a single provider's failure is acceptable.
    expect(cursor).toBe(mod.CATALOG_DATA_VERSION);
  });
});

describe('runStartupMigration - safeStorage gating (Fix A1)', () => {
  it('returns early (without touching the repo) when safeStorage is unavailable', async () => {
    // The mockSafeStorage hoist defaults to `isEncryptionAvailable: true`. Flip
    // it false to simulate a pre-`app.whenReady()` boot OR a host whose OS
    // keychain backend is absent (the two cases the gate guards against).
    mockSafeStorage.isEncryptionAvailable.mockReturnValueOnce(false);

    // A repo whose every method throws - proves the migration never reached
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

describe('connect - baseUrl persistence (Fix B2)', () => {
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

function spawnHandle(over: Partial<SpawnHandle> = {}): SpawnHandle {
  return { providerId: 'ollama-local', modelId: 'llama3:latest', ...over };
}

describe('resolveSpawnSecretsFromRepo - keyless local provider (Ollama)', () => {
  it('resolves a payload (empty apiKey + local baseUrl) for ollama-local with no key', () => {
    const repo = new FakeRepo();
    repo.upsertRegistryProvider({
      providerId: 'ollama-local',
      connectedVia: 'auto-local',
      state: 'connected',
      creds: { key: '', baseUrl: 'http://127.0.0.1:11434/v1' },
    });

    const secrets = resolveSpawnSecretsFromRepo(repo as never, spawnHandle());
    // Finding 2: a keyless local provider carries NO credential - represented as
    // `apiKey: undefined`, NOT `''`, so the spawn merge can never inherit a
    // stale legacy key.
    expect(secrets).toEqual({ apiKey: undefined, baseUrl: 'http://127.0.0.1:11434/v1' });
  });

  it('resolves a payload for a custom localhost openai-compatible provider with no key', () => {
    const repo = new FakeRepo();
    repo.upsertRegistryProvider({
      providerId: 'openai-compatible',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: '', baseUrl: 'http://localhost:1234/v1' },
    });

    const secrets = resolveSpawnSecretsFromRepo(repo as never, spawnHandle({ providerId: 'openai-compatible' }));
    // Finding 2: keyless local resolves to `apiKey: undefined` (no credential).
    expect(secrets).toEqual({ apiKey: undefined, baseUrl: 'http://localhost:1234/v1' });
  });

  it('returns null (undecryptable) for a CLOUD provider with an empty key - no regression', () => {
    const repo = new FakeRepo();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: '' },
    });

    // openai resolves to the cloud base url; an empty key there stays
    // undecryptable, so the spawn resolver returns null.
    expect(resolveSpawnSecretsFromRepo(repo as never, spawnHandle({ providerId: 'openai' }))).toBeNull();
  });

  it('returns the real key for a cloud provider that HAS a key', () => {
    const repo = new FakeRepo();
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-real' },
    });

    const secrets = resolveSpawnSecretsFromRepo(repo as never, spawnHandle({ providerId: 'openai' }));
    expect(secrets?.apiKey).toBe('sk-real');
    expect(secrets?.baseUrl).toBe('https://api.openai.com/v1');
  });
});

describe('modelRegistry IPC - refreshAllOnce SSRF gate (ollama-local exemption)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('refreshes ollama-local (loopback exempt, re-probed) but skips a random localhost custom provider', async () => {
    // In production the SSRF gate rejects ALL loopback http base urls. The
    // ollama-local exemption (id + loopback baseUrl) is the ONLY thing that lets
    // the native local provider through, and it refreshes via a live daemon
    // re-probe - NOT buildAndPersistCatalog (Finding 1). A random localhost
    // custom provider stays skipped (SSRF closed).
    process.env.NODE_ENV = 'production';

    const { deps, repo } = makeFakes();
    const probeOllama = vi.fn().mockResolvedValue({ running: true, models: ['llama3:latest'] });
    deps.probeOllama = probeOllama;

    // The native local provider - its hardcoded loopback base url must NOT be
    // skipped by the local-host SSRF gate (exempt by id + loopback).
    repo.upsertRegistryProvider({
      providerId: 'ollama-local',
      connectedVia: 'auto-local',
      state: 'connected',
      creds: { key: '', baseUrl: 'http://127.0.0.1:11434/v1' },
    });

    // A user's arbitrary localhost custom provider - still skipped (SSRF closed).
    repo.upsertRegistryProvider({
      providerId: 'openai-compatible',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-x', baseUrl: 'http://127.0.0.1:9999/v1' },
    });

    const h = createModelRegistryHandlers(deps);
    const summary = await h.refreshAllOnce();

    expect(probeOllama).toHaveBeenCalledTimes(1);
    expect(summary.succeeded).toContain('ollama-local');
    // Catalog refreshed from the live probe (not wiped to empty).
    expect(repo.getRegistryCatalog('ollama-local').map((m) => m.id)).toEqual(['llama3:latest']);
    expect(summary.failed).toContain('openai-compatible');
    expect(summary.succeeded).not.toContain('openai-compatible');
  });

  it('does NOT exempt ollama-local when its stored baseUrl is non-loopback (Finding 5)', async () => {
    process.env.NODE_ENV = 'production';
    const { deps, repo } = makeFakes();
    const probeOllama = vi.fn().mockResolvedValue({ running: true, models: ['x'] });
    deps.probeOllama = probeOllama;

    // A row claiming to be ollama-local but pointing off-loopback (link-local
    // cloud-metadata) must NOT get the keyless re-probe exemption.
    repo.upsertRegistryProvider({
      providerId: 'ollama-local',
      connectedVia: 'auto-local',
      state: 'connected',
      creds: { key: '', baseUrl: 'http://169.254.169.254/v1' },
    });

    const h = createModelRegistryHandlers(deps);
    const summary = await h.refreshAllOnce();

    expect(probeOllama).not.toHaveBeenCalled();
    expect(summary.failed).toContain('ollama-local');
    expect(summary.succeeded).not.toContain('ollama-local');
  });
});

describe('modelRegistry IPC - per-provider refresh (ollama-local guard, #314)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('re-probes the daemon instead of wiping the catalog when Refresh is clicked for loopback ollama-local (#314)', async () => {
    // The per-provider Refresh button used buildAndPersistCatalog for every
    // provider; for keyless ollama-local that assembles zero models and empties
    // the catalog (Finding 1) - the daemon is up but the picker drops to 0. The
    // guard must route a loopback ollama-local row to a live daemon re-probe
    // instead, the same exemption refreshAllOnce already has.
    process.env.NODE_ENV = 'production';

    const { deps, repo } = makeFakes();
    const probeOllama = vi.fn().mockResolvedValue({ running: true, models: ['llama3.2:3b'] });
    deps.probeOllama = probeOllama;

    repo.upsertRegistryProvider({
      providerId: 'ollama-local',
      connectedVia: 'auto-local',
      state: 'connected',
      creds: { key: '', baseUrl: 'http://127.0.0.1:11434/v1' },
    });
    // A previously-populated catalog that the buggy path would wipe to [].
    repo.replaceRegistryCatalog('ollama-local', [catalogModel({ id: 'llama3.2:3b', providerId: 'ollama-local' })]);

    const h = createModelRegistryHandlers(deps);
    const result = await h.refresh({ providerId: 'ollama-local' });

    expect(result).toEqual({ ok: true });
    // Routed to the live re-probe, NOT buildAndPersistCatalog.
    expect(probeOllama).toHaveBeenCalledTimes(1);
    // Catalog refreshed from the daemon listing - never emptied.
    expect(repo.getRegistryCatalog('ollama-local').map((m) => m.id)).toEqual(['llama3.2:3b']);
  });

  it('leaves the existing catalog untouched when the daemon is unreachable (never wipes to [])', async () => {
    process.env.NODE_ENV = 'production';
    const { deps, repo } = makeFakes();
    const probeOllama = vi.fn().mockResolvedValue({ running: false, models: [] });
    deps.probeOllama = probeOllama;

    repo.upsertRegistryProvider({
      providerId: 'ollama-local',
      connectedVia: 'auto-local',
      state: 'connected',
      creds: { key: '', baseUrl: 'http://127.0.0.1:11434/v1' },
    });
    repo.replaceRegistryCatalog('ollama-local', [catalogModel({ id: 'llama3.2:3b', providerId: 'ollama-local' })]);

    const h = createModelRegistryHandlers(deps);
    const result = await h.refresh({ providerId: 'ollama-local' });

    // A transient daemon-down reports not-ok but must keep the last-known models
    // - the picker survives an Ollama restart instead of blanking.
    expect(result).toEqual({ ok: false });
    expect(repo.getRegistryCatalog('ollama-local').map((m) => m.id)).toEqual(['llama3.2:3b']);
    expect(probeOllama).toHaveBeenCalledTimes(1);
  });

  it('does NOT take the keyless re-probe path for a non-loopback ollama-local row (Finding 5)', async () => {
    process.env.NODE_ENV = 'production';
    const { deps, repo } = makeFakes();
    const probeOllama = vi.fn().mockResolvedValue({ running: true, models: ['x'] });
    deps.probeOllama = probeOllama;

    // A row claiming to be ollama-local but pointing off-loopback (link-local
    // cloud-metadata) must NOT get the keyless re-probe exemption.
    repo.upsertRegistryProvider({
      providerId: 'ollama-local',
      connectedVia: 'auto-local',
      state: 'connected',
      creds: { key: '', baseUrl: 'http://169.254.169.254/v1' },
    });

    const h = createModelRegistryHandlers(deps);
    await h.refresh({ providerId: 'ollama-local' });

    // Off-loopback is treated like any other provider - no keyless exemption.
    expect(probeOllama).not.toHaveBeenCalled();
  });
});

describe('modelRegistry IPC - resolveForChatStart (#243 ChatGPT subscription)', () => {
  it('resolves a connected ChatGPT subscription to platform openai-compatible with no key, no bounce (#243)', async () => {
    const { deps, repo } = makeFakes();
    repo.upsertRegistryProvider({
      providerId: 'chatgpt-subscription',
      connectedVia: 'oauth',
      state: 'connected',
      creds: {}, // keyless: the OAuth token lives in the engine's own ~/.codex/auth.json
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'chatgpt-subscription', modelId: 'gpt-5.2-codex' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Dispatched as `openai-compatible` (the legacy chat-start platform) so the
      // `v2:chatgpt-subscription` bridge tag survives and envBuilder re-routes to
      // the native `--provider openai-chatgpt`. The chatgpt identity is carried by
      // `providerId` below, not the platform field (see CHAT_START_PLATFORM, #243).
      expect(result.provider.platform).toBe('openai-compatible');
      expect(result.provider.providerId).toBe('chatgpt-subscription');
      expect(result.provider.name).toBe('ChatGPT');
      expect(result.provider.baseUrl).toBe('');
    }
  });

  it('still returns unsupported for a connected provider with no chat-start arm (negative control)', async () => {
    const { deps, repo } = makeFakes();
    // azure is intentionally absent from CHAT_START_PLATFORM - it must still bounce.
    repo.upsertRegistryProvider({
      providerId: 'azure',
      connectedVia: 'apiKey',
      state: 'connected',
      creds: { key: 'sk-azure' },
    });
    const h = createModelRegistryHandlers(deps);

    const result = await h.resolveForChatStart({ providerId: 'azure', modelId: 'gpt-4o' });
    expect(result).toEqual({ ok: false, error: 'unsupported' });
  });
});
