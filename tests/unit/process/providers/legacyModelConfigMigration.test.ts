/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the one-time legacy `model.config` → `model_registry_*` migration
 * (Packet 3B). The migration is driven through fakes for `LegacyConfigStore`
 * and `MigrationRepo` - no `ProcessConfig`, no SQLite, no Electron runtime.
 */

import { describe, expect, it, vi } from 'vitest';
import type { IProvider } from '@/common/config/storage';
import type { CatalogModel, ProviderId } from '@process/providers/types';
import {
  MIGRATION_FLAG_KEY,
  runLegacyModelConfigMigration,
  type LegacyConfigStore,
  type MigrationRepo,
} from '@process/providers/migration/legacyModelConfigMigration';

// ─── Fakes ────────────────────────────────────────────────────────────────────

/**
 * In-memory `model.config` + flag store. Two slots: the legacy `model.config`
 * array and the migration flag. Any other key throws - the migration must not
 * touch keys it does not declare.
 */
function makeStore(
  initialRows: IProvider[] = [],
  initialFlag: boolean | undefined = undefined
): LegacyConfigStore & {
  current(): IProvider[];
  flag(): boolean | undefined;
} {
  let rows: IProvider[] = [...initialRows];
  let flag: boolean | undefined = initialFlag;
  return {
    current: () => rows,
    flag: () => flag,
    async get(key) {
      if (key === 'model.config') return rows;
      if (key === MIGRATION_FLAG_KEY) return flag;
      throw new Error(`unexpected key ${String(key)}`);
    },
    async set(key, value) {
      if (key === 'model.config') {
        rows = value as IProvider[];
        return;
      }
      if (key === MIGRATION_FLAG_KEY) {
        flag = value as boolean;
        return;
      }
      throw new Error(`unexpected key ${String(key)}`);
    },
  };
}

/** In-memory `MigrationRepo` mirroring the real `ProviderRepository` slice. */
function makeRepo(): MigrationRepo & {
  providers: Map<ProviderId, Record<string, unknown>>;
  catalogs: Map<ProviderId, CatalogModel[]>;
  overrides: Map<ProviderId, Array<{ modelId: string; enabled: boolean }>>;
} {
  const providers = new Map<ProviderId, Record<string, unknown>>();
  const catalogs = new Map<ProviderId, CatalogModel[]>();
  const overrides = new Map<ProviderId, Array<{ modelId: string; enabled: boolean }>>();
  return {
    providers,
    catalogs,
    overrides,
    getRegistryProvider(providerId) {
      return providers.get(providerId) ?? null;
    },
    upsertRegistryProvider(p) {
      providers.set(p.providerId, {
        providerId: p.providerId,
        connectedVia: p.connectedVia,
        state: p.state,
        error: p.error,
        creds: p.creds,
      });
    },
    replaceRegistryCatalog(providerId, models) {
      catalogs.set(providerId, models);
    },
    // Wave 3 - exposes the methods the cross-audit Fixes 3/4/14 need.
    countRegistryCatalog(providerId) {
      return catalogs.get(providerId)?.length ?? 0;
    },
    setRegistryOverride(providerId, modelId, enabled) {
      const list = overrides.get(providerId) ?? [];
      const idx = list.findIndex((o) => o.modelId === modelId);
      if (idx >= 0) list[idx] = { modelId, enabled };
      else list.push({ modelId, enabled });
      overrides.set(providerId, list);
    },
    // No real DB to wrap - run the fn synchronously. In-memory writes are
    // either both done or both not (no halfway state).
    transaction(fn) {
      fn();
    },
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function legacyRow(over: Partial<IProvider> & { platform: string }): IProvider {
  return {
    id: over.id ?? `legacy-${over.platform}`,
    name: over.name ?? over.platform,
    baseUrl: over.baseUrl ?? '',
    apiKey: over.apiKey ?? '',
    model: over.model ?? [],
    ...over,
  };
}

/** Bridge-tagged row - written by the deleted Wave 3A bridge mirror. */
function bridgeMirroredRow(platform: string, apiKey: string, models: string[]): IProvider {
  return {
    ...legacyRow({ platform, apiKey, model: models }),
    __waylandModelRegistryBridge: 'v1',
  } as IProvider;
}

// ─── Idempotency ──────────────────────────────────────────────────────────────

describe('runLegacyModelConfigMigration - idempotency', () => {
  it('does nothing when the flag is already set', async () => {
    const store = makeStore([legacyRow({ platform: 'openai', apiKey: 'sk-x', model: ['gpt-4o'] })], true);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.ran).toBe(false);
    expect(result.migrated).toBe(0);
    expect(repo.providers.size).toBe(0);
  });

  it('sets the flag on a first successful run, even with zero rows', async () => {
    const store = makeStore();
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.ran).toBe(true);
    expect(result.migrated).toBe(0);
    expect(store.flag()).toBe(true);
  });

  it('a second run is a no-op (only the first run migrates)', async () => {
    const store = makeStore([legacyRow({ platform: 'anthropic', apiKey: 'sk-ant-1', model: ['claude-3-5'] })]);
    const repo = makeRepo();

    await runLegacyModelConfigMigration({ store, repo });
    expect(repo.providers.size).toBe(1);

    // Simulate a user adding a different provider through the new flow after
    // the first run. Drop the registry row from our stub so we can detect any
    // re-migration overwriting it - there must be none.
    repo.providers.clear();
    repo.catalogs.clear();

    const second = await runLegacyModelConfigMigration({ store, repo });
    expect(second.ran).toBe(false);
    expect(repo.providers.size).toBe(0);
  });
});

// ─── Standard providers ───────────────────────────────────────────────────────

describe('runLegacyModelConfigMigration - standard providers', () => {
  it('migrates a clean openai legacy row into the registry', async () => {
    const store = makeStore([legacyRow({ platform: 'openai', apiKey: 'sk-real', model: ['gpt-4o', 'gpt-4o-mini'] })]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.migrated).toBe(1);
    const row = repo.providers.get('openai');
    expect(row).toBeDefined();
    expect(row?.state).toBe('connected');
    expect(row?.connectedVia).toBe('api-key');
    expect(row?.creds).toEqual({ key: 'sk-real' });

    const catalog = repo.catalogs.get('openai');
    expect(catalog?.map((m) => m.id)).toEqual(['gpt-4o', 'gpt-4o-mini']);
    expect(catalog?.[0].enriched).toBe(false);
    expect(catalog?.[0].kind).toBe('text');
    expect(catalog?.[0].providerId).toBe('openai');
  });

  it('preserves a user-set custom baseUrl on api-key providers', async () => {
    // A `custom` legacy platform with a fingerprint that doesn't match a known
    // host falls through to `openai-compatible` and keeps the user's baseUrl.
    const store = makeStore([
      legacyRow({
        platform: 'custom',
        baseUrl: 'https://my-self-hosted.example.com/v1',
        apiKey: 'sk-self',
        model: ['llama3'],
      }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.migrated).toBe(1);
    const row = repo.providers.get('openai-compatible');
    expect(row?.creds).toEqual({ key: 'sk-self', baseUrl: 'https://my-self-hosted.example.com/v1' });
  });

  it('fingerprints openai-compatible baseUrls to a real ProviderId when known', async () => {
    const store = makeStore([
      legacyRow({
        platform: 'openai-compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: 'sk-or',
        model: ['anthropic/claude-3-5-sonnet'],
      }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.migrated).toBe(1);
    expect(repo.providers.has('openrouter')).toBe(true);
    expect(repo.providers.get('openrouter')?.creds).toEqual({
      key: 'sk-or',
      baseUrl: 'https://openrouter.ai/api/v1',
    });
  });

  it('translates the legacy `gemini-with-google-auth` platform to google-gemini with useGoogleAuth creds', async () => {
    // Wave 3 Fix 6 - google-auth Gemini lands as `{ useGoogleAuth: true }`,
    // NOT as an api-key row. The token lives in the main-process auth store.
    const store = makeStore([
      legacyRow({
        platform: 'gemini-with-google-auth',
        apiKey: '',
        model: ['gemini-2.0-flash'],
      }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.migrated).toBe(1);
    const row = repo.providers.get('google-gemini');
    expect(row?.connectedVia).toBe('google-auth');
    expect(row?.creds).toEqual({ useGoogleAuth: true });
  });

  it('treats a `gemini` row with no apiKey as google-auth', async () => {
    // A subtle variant - legacy `platform: 'gemini'` rows with an empty key
    // were created when a user signed in via OAuth on an older build.
    const store = makeStore([legacyRow({ platform: 'gemini', apiKey: '', model: ['gemini-2.0-flash'] })]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.migrated).toBe(1);
    expect(repo.providers.get('google-gemini')?.creds).toEqual({ useGoogleAuth: true });
  });
});

// ─── Bridge mirrors are skipped ───────────────────────────────────────────────

describe('runLegacyModelConfigMigration - bridge-tagged rows', () => {
  it('skips a row that was written by the Wave 3A bridge mirror', async () => {
    const store = makeStore([bridgeMirroredRow('openai', 'sk-bridge', ['gpt-4o'])]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedBridge).toBe(1);
    expect(result.migrated).toBe(0);
    expect(repo.providers.size).toBe(0);
  });

  it('migrates an untagged row alongside a bridge-tagged one', async () => {
    const store = makeStore([
      bridgeMirroredRow('openai', 'sk-bridge', ['gpt-4o']),
      legacyRow({ platform: 'anthropic', apiKey: 'sk-ant', model: ['claude-3-5'] }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedBridge).toBe(1);
    expect(result.migrated).toBe(1);
    expect(repo.providers.has('anthropic')).toBe(true);
    expect(repo.providers.has('openai')).toBe(false);
  });
});

// ─── Existing registry row wins ───────────────────────────────────────────────

describe('runLegacyModelConfigMigration - existing registry rows', () => {
  it('skips a legacy row whose provider already exists in the registry', async () => {
    const store = makeStore([legacyRow({ platform: 'openai', apiKey: 'sk-legacy', model: ['gpt-4o'] })]);
    const repo = makeRepo();
    // Simulate the user having already connected openai through the new flow,
    // with a real catalog populated. The migration must not overwrite it.
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-new' },
    });
    repo.replaceRegistryCatalog('openai', [
      {
        id: 'gpt-4o',
        providerId: 'openai',
        displayName: 'GPT-4o',
        family: 'gpt-4o',
        kind: 'text',
        enriched: true,
        tags: [],
      },
    ]);

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedExisting).toBe(1);
    expect(repo.providers.get('openai')?.creds).toEqual({ key: 'sk-new' });
  });
});

// ─── Unsupported / incomplete rows ────────────────────────────────────────────

describe('runLegacyModelConfigMigration - unsupported rows', () => {
  it('skips a row with an unknown platform and logs a warning', async () => {
    const warn = vi.fn();
    const store = makeStore([legacyRow({ platform: 'made-up-platform', apiKey: 'sk-x', model: [] })]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({
      store,
      repo,
      logger: (level, m) => {
        if (level === 'warn') warn(m);
      },
    });

    expect(result.skippedUnsupported).toBe(1);
    expect(result.migrated).toBe(0);
    expect(warn).toHaveBeenCalled();
  });

  it('skips a non-cloud row with an empty apiKey', async () => {
    const store = makeStore([legacyRow({ platform: 'openai', apiKey: '', model: ['gpt-4o'] })]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedUnsupported).toBe(1);
    expect(repo.providers.size).toBe(0);
  });

  it('one bad row does not stop the others', async () => {
    const store = makeStore([
      legacyRow({ platform: 'made-up', apiKey: 'sk', model: [] }),
      legacyRow({ platform: 'openai', apiKey: 'sk-ok', model: ['gpt-4o'] }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedUnsupported).toBe(1);
    expect(result.migrated).toBe(1);
    expect(repo.providers.has('openai')).toBe(true);
  });
});

// ─── Cloud providers ──────────────────────────────────────────────────────────

describe('runLegacyModelConfigMigration - cloud providers', () => {
  it('migrates a bedrock row whose accessKey-auth carries every required field', async () => {
    const store = makeStore([
      legacyRow({
        platform: 'bedrock',
        model: ['anthropic.claude-3-5-sonnet-20241022-v2:0'],
        bedrockConfig: {
          authMethod: 'accessKey',
          region: 'us-east-1',
          accessKeyId: 'AKIA',
          secretAccessKey: 'secret',
        },
      }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.migrated).toBe(1);
    const row = repo.providers.get('aws-bedrock');
    expect(row?.connectedVia).toBe('cloud-credentials');
    expect(row?.creds).toEqual({
      // Wave 3 Fix 6: the migration now stamps a `bedrockAuth` discriminator
      // so the chat-start dispatcher can pick the right env arm.
      bedrockAuth: 'access-key',
      fields: { accessKeyId: 'AKIA', secretAccessKey: 'secret', region: 'us-east-1' },
    });
  });

  // Wave 3 Fix 6 - profile-auth Bedrock is migrated (previously dropped).
  it('migrates a bedrock row using profile auth into the registry', async () => {
    const store = makeStore([
      legacyRow({
        platform: 'bedrock',
        model: [],
        bedrockConfig: { authMethod: 'profile', region: 'us-east-1', profile: 'default' },
      }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.migrated).toBe(1);
    expect(result.skippedIncompleteCloud).toBe(0);
    const row = repo.providers.get('aws-bedrock');
    expect(row?.creds).toEqual({
      bedrockAuth: 'profile',
      fields: { awsProfile: 'default', region: 'us-east-1' },
    });
  });

  it('skips a profile-auth bedrock row missing the profile name', async () => {
    const store = makeStore([
      legacyRow({
        platform: 'bedrock',
        model: [],
        bedrockConfig: { authMethod: 'profile', region: 'us-east-1' },
      }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedIncompleteCloud).toBe(1);
    expect(repo.providers.size).toBe(0);
  });

  it('skips a bedrock row missing a required field', async () => {
    const store = makeStore([
      legacyRow({
        platform: 'bedrock',
        model: [],
        bedrockConfig: {
          authMethod: 'accessKey',
          region: '', // empty region triggers the skip
          accessKeyId: 'AKIA',
          secretAccessKey: 'secret',
        },
      }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedIncompleteCloud).toBe(1);
    expect(repo.providers.size).toBe(0);
  });
});

// ─── Resilience ───────────────────────────────────────────────────────────────

describe('runLegacyModelConfigMigration - resilience', () => {
  it('handles a missing model.config gracefully (no rows = no crash)', async () => {
    const store: LegacyConfigStore = {
      async get(key) {
        if (key === MIGRATION_FLAG_KEY) return undefined;
        if (key === 'model.config') return undefined;
        throw new Error('unexpected');
      },
      async set() {},
    };
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.ran).toBe(true);
    expect(result.migrated).toBe(0);
  });

  it('still sets the flag when reading model.config throws', async () => {
    let flagSet: unknown = undefined;
    const store: LegacyConfigStore = {
      async get(key) {
        if (key === MIGRATION_FLAG_KEY) return undefined;
        throw new Error('unreadable model.config');
      },
      async set(key, value) {
        if (key === MIGRATION_FLAG_KEY) flagSet = value;
      },
    };
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.ran).toBe(true);
    expect(flagSet).toBe(true);
  });
});

// ─── Cross-audit Wave 3 fixes ────────────────────────────────────────────────

describe('runLegacyModelConfigMigration - grouping (Fix 1)', () => {
  it('unions the model arrays of two rows that resolve to the same ProviderId', async () => {
    const store = makeStore([
      legacyRow({ platform: 'openai', apiKey: 'sk-team-a', model: ['gpt-4o', 'gpt-4o-mini'] }),
      legacyRow({ platform: 'openai', apiKey: 'sk-team-b', model: ['gpt-4o', 'o1'] }),
    ]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    // One provider migrated; the second row's apiKey is lost (last-write-wins).
    expect(result.migrated).toBe(1);
    expect(result.secondaryKeysLost).toBe(1);
    // Both rows' models appear in the final catalog, no duplicates.
    const catalog = repo.catalogs.get('openai');
    expect(catalog?.map((m) => m.id).sort()).toEqual(['gpt-4o', 'gpt-4o-mini', 'o1']);
  });

  it('picks the most-recent-by-updatedAt row as the primary creds source', async () => {
    const olderRow = {
      ...legacyRow({ platform: 'openai', apiKey: 'sk-old', model: ['gpt-4o'] }),
      updatedAt: 1000,
    } as IProvider;
    const newerRow = {
      ...legacyRow({ platform: 'openai', apiKey: 'sk-new', model: ['gpt-4o'] }),
      updatedAt: 2000,
    } as IProvider;

    // Order in the store is irrelevant - the timestamp picks the primary.
    const store = makeStore([newerRow, olderRow]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.migrated).toBe(1);
    expect(repo.providers.get('openai')?.creds).toEqual({ key: 'sk-new' });
  });
});

describe('runLegacyModelConfigMigration - flag policy (Fix 2)', () => {
  it('does NOT set the completion flag when every group fails recoverably', async () => {
    // `upsertRegistryProvider` throws on every call - every group fails.
    const repo = makeRepo();
    repo.upsertRegistryProvider = () => {
      throw new Error('transient safeStorage failure');
    };

    let flagSet = false;
    const store: LegacyConfigStore = {
      async get(key) {
        if (key === MIGRATION_FLAG_KEY) return undefined;
        if (key === 'model.config') return [legacyRow({ platform: 'openai', apiKey: 'sk', model: ['gpt-4o'] })];
        return undefined;
      },
      async set(key, value) {
        if (key === MIGRATION_FLAG_KEY) flagSet = value === true;
      },
    };

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.failedRecoverable).toBe(1);
    expect(result.migrated).toBe(0);
    expect(flagSet).toBe(false);
  });
});

describe('runLegacyModelConfigMigration - overrides (Fix 4 + Fix 14)', () => {
  it('writes false overrides for `modelEnabled: false` entries', async () => {
    const store = makeStore([
      {
        ...legacyRow({ platform: 'openai', apiKey: 'sk', model: ['gpt-4o', 'gpt-4o-mini', 'o1'] }),
        modelEnabled: { 'gpt-4o-mini': false },
      } as IProvider,
    ]);
    const repo = makeRepo();

    await runLegacyModelConfigMigration({ store, repo });

    const overrides = repo.overrides.get('openai') ?? [];
    const disabledEntry = overrides.find((o) => o.modelId === 'gpt-4o-mini');
    expect(disabledEntry?.enabled).toBe(false);
    // Other models get visibility overrides set to true (Fix 14).
    const visibilityEntry = overrides.find((o) => o.modelId === 'gpt-4o');
    expect(visibilityEntry?.enabled).toBe(true);
  });
});

describe('runLegacyModelConfigMigration - modelProtocols (Fix 5)', () => {
  it('persists the modelProtocols map alongside creds for new-api gateways', async () => {
    const store = makeStore([
      {
        ...legacyRow({
          platform: 'new-api',
          baseUrl: 'https://my-gateway.example.com',
          apiKey: 'sk-x',
          model: ['gpt-4o', 'claude-sonnet-4'],
        }),
        modelProtocols: { 'claude-sonnet-4': 'anthropic' },
      } as IProvider,
    ]);
    const repo = makeRepo();

    await runLegacyModelConfigMigration({ store, repo });

    const row = repo.providers.get('openai-compatible');
    expect(row?.creds).toMatchObject({
      key: 'sk-x',
      baseUrl: 'https://my-gateway.example.com',
      protocols: { 'claude-sonnet-4': 'anthropic' },
    });
  });
});

describe('runLegacyModelConfigMigration - atomic write repair (Fix 3)', () => {
  it('re-imports the legacy catalog when an existing provider has an empty catalog', async () => {
    const repo = makeRepo();
    // Pre-seed an EXISTING provider row with NO catalog (simulating a prior
    // partial run that crashed between upsert and replaceCatalog).
    repo.upsertRegistryProvider({
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      creds: { key: 'sk-existing' },
    });
    expect(repo.catalogs.size).toBe(0);

    const store = makeStore([legacyRow({ platform: 'openai', apiKey: 'sk-legacy', model: ['gpt-4o'] })]);

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.migrated).toBe(1);
    // Existing creds preserved - the user's new flow wins.
    expect(repo.providers.get('openai')?.creds).toEqual({ key: 'sk-existing' });
    // But the catalog is now repaired from the legacy row's models.
    expect(repo.catalogs.get('openai')?.map((m) => m.id)).toEqual(['gpt-4o']);
  });
});

describe('runLegacyModelConfigMigration - bridge v2 tag', () => {
  it('also skips a row tagged with the v2 bridge value', async () => {
    const row = {
      ...legacyRow({ platform: 'openai', apiKey: 'sk', model: ['gpt-4o'] }),
      __waylandModelRegistryBridge: 'v2',
    } as IProvider;
    const store = makeStore([row]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedBridge).toBe(1);
    expect(result.migrated).toBe(0);
  });

  it('skips a row tagged with the per-provider v2:<providerId> bridge value (Fix C4)', async () => {
    const row = {
      ...legacyRow({ platform: 'openai-compatible', apiKey: 'sk', model: ['m-1'] }),
      __waylandModelRegistryBridge: 'v2:openrouter',
    } as IProvider;
    const store = makeStore([row]);
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedBridge).toBe(1);
    expect(result.migrated).toBe(0);
  });
});

describe('runLegacyModelConfigMigration - incomplete-cloud flag (Fix C2)', () => {
  it('does NOT set the incomplete-cloud flag in the store (the flag was unused)', async () => {
    // A Vertex row carries no usable creds in the legacy shape, so the
    // migration skips it as incomplete-cloud. Prior to Fix C2 the migration
    // wrote `migration.legacyModelConfigIncompleteCloud=true` - that flag has
    // been removed since no renderer consumed it.
    const row = legacyRow({ platform: 'gemini-vertex-ai', apiKey: '' });
    const writes: Array<[string, unknown]> = [];
    const store: LegacyConfigStore = {
      async get(key) {
        if (key === 'model.config') return [row];
        if (key === MIGRATION_FLAG_KEY) return undefined;
        return undefined;
      },
      async set(key, value) {
        writes.push([key, value]);
      },
    };
    const repo = makeRepo();

    const result = await runLegacyModelConfigMigration({ store, repo });

    expect(result.skippedIncompleteCloud).toBe(1);
    // Only the completion flag write is expected - no incomplete-cloud key.
    const incompleteCloudWrites = writes.filter(([k]) => k === 'migration.legacyModelConfigIncompleteCloud');
    expect(incompleteCloudWrites).toEqual([]);
  });
});
