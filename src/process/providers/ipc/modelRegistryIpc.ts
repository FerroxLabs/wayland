/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `modelRegistry` IPC handlers (Packet 1F).
 *
 * The integration packet: wires the Wave 0 `modelRegistry` IPC contract to the
 * real backend modules built in Packets 1A–1E (models.dev client, catalog
 * sources, assembler, curator, connection tester, key discovery) plus the
 * `ProviderRepository` model-registry persistence.
 *
 * ## Persistence
 *
 *  - **providers** — `model_registry_providers`, one row per connected provider
 *    keyed by `ProviderId`, holding the encrypted credentials + live state.
 *  - **catalogs**  — `model_registry_catalog`, the assembled `CatalogModel[]`
 *    per provider; the curated view is derived on read by the pure `Curator`.
 *  - **overrides** — `model_registry_overrides`, per-model enable/disable flags
 *    the user set explicitly via `toggleModel`.
 *  - **creds**     — serialized to JSON and encrypted by the repository via
 *    OS-keychain `safeStorage`; the plaintext never leaves the main process.
 *
 * ## Handler safety
 *
 * Every handler is defensive: it catches all errors and returns the contract's
 * typed failure shape (`{ ok: false, error }`, or an empty list / catalog).
 * Key material is never logged and never sent to the renderer.
 *
 * ## Google OAuth (Wave 3)
 *
 * `connect`'s contract is key/fields/useDiscovered only — Google OAuth is out
 * of scope here. The reusable `buildAndPersistCatalog` function is exported so
 * Wave 3 can wire the Google sign-in button (`authBridge`) to provider
 * persistence + catalog assembly for an OAuth-connected `google-gemini`.
 */

import { ipcBridge } from '@/common';
import type {
  IModelRegistryCatalogView,
  IModelRegistryConnectResult,
  IModelRegistryCreds,
  IModelRegistryDetectedKey,
  IModelRegistryProviderView,
  IModelRegistryTestResult,
} from '@/common/adapter/ipcBridge';
import { getDatabase } from '@process/services/database';
import type { ConnectError, CuratedModel, ProviderConnState, ProviderId, RawModel } from '../types';
import type { CatalogSource } from '../sources/CatalogSource';
import { ApiProviderSource } from '../sources/ApiProviderSource';
import { CliAgentSource, isEnumerableCliAgent } from '../sources/CliAgentSource';
import type { CliAgentKey } from '../sources/CliAgentSource';
import { CatalogAssembler, MODELS_DEV_PROVIDER_KEY } from '../catalog/CatalogAssembler';
import { Curator } from '../catalog/Curator';
import { ConnectionTester } from '../detection/ConnectionTester';
import { KeyDiscovery } from '../detection/KeyDiscovery';
import { ModelsDevClient } from '../enrichment/ModelsDevClient';
import type { ModelsDevRegistry } from '../enrichment/modelsDevSchema';
import { ProviderRepository } from '../storage/ProviderRepository';

// ─── Provider classification ──────────────────────────────────────────────────

/**
 * Cloud providers have no `/v1/models` endpoint, so `ConnectionTester` cannot
 * HTTP-probe them. Their catalog is built directly from the models.dev registry
 * and a successful connect is "credentials saved + catalog populated".
 */
const CLOUD_PROVIDERS: ReadonlySet<ProviderId> = new Set<ProviderId>(['aws-bedrock', 'vertex', 'azure']);

/**
 * Maps a cloud `ProviderId` to its models.dev registry key. The registry IS the
 * catalog for these providers. Derived from `CatalogAssembler`'s canonical
 * `MODELS_DEV_PROVIDER_KEY` so the mapping cannot drift — this is just the
 * cloud-provider subset of it.
 */
const CLOUD_MODELS_DEV_KEY: Partial<Record<ProviderId, string>> = Object.fromEntries(
  [...CLOUD_PROVIDERS].map((id) => [id, MODELS_DEV_PROVIDER_KEY[id]])
) as Partial<Record<ProviderId, string>>;

/**
 * The credential fields each cloud provider must carry for a connect to be
 * accepted. A cloud connect cannot be HTTP-probed, so this is the only gate
 * against persisting a `connected` provider with empty / missing creds. The
 * check is a non-empty-string presence check — NOT a real cloud-SDK validation.
 */
const CLOUD_REQUIRED_FIELDS: Record<string, readonly string[]> = {
  'aws-bedrock': ['accessKeyId', 'secretAccessKey', 'region'],
  vertex: ['projectId', 'region', 'serviceAccountJson'],
  azure: ['endpoint', 'apiKey'],
};

/** The CLI agent keys, mirrored from `CliAgentSource`. */
const CLI_AGENT_KEYS: ReadonlySet<string> = new Set<CliAgentKey>(['claude', 'codex', 'gemini']);

/** The provider each CLI agent runs (used for the non-enumerable fallback). */
const CLI_UNDERLYING_PROVIDER: Record<CliAgentKey, ProviderId> = {
  claude: 'anthropic',
  codex: 'openai',
  gemini: 'google-gemini',
};

// ─── Injectable dependencies ──────────────────────────────────────────────────

/** A catalog source built from a connected cloud provider's registry slice. */
class CloudRegistrySource implements CatalogSource {
  readonly kind = 'api' as const;
  readonly providerId: ProviderId;

  private readonly models: RawModel[];

  constructor(providerId: ProviderId, registry: ModelsDevRegistry) {
    this.providerId = providerId;
    const devKey = CLOUD_MODELS_DEV_KEY[providerId];
    const entry = devKey ? registry[devKey] : undefined;
    this.models = entry ? Object.keys(entry.models).map((id) => ({ id, providerId })) : [];
  }

  async listModels(): Promise<RawModel[]> {
    return this.models;
  }
}

/**
 * The slice of `ProviderRepository` the handlers depend on. Declared as a
 * structural type so tests can supply an in-memory fake.
 */
export type ModelRegistryRepo = Pick<
  ProviderRepository,
  | 'listRegistryProviders'
  | 'getRegistryProvider'
  | 'upsertRegistryProvider'
  | 'updateRegistryProviderState'
  | 'updateRegistryProviderCreds'
  | 'updateRegistryProviderConnectedVia'
  | 'getRegistryProviderCreds'
  | 'deleteRegistryProvider'
  | 'replaceRegistryCatalog'
  | 'getRegistryCatalog'
  | 'countRegistryCatalog'
  | 'setRegistryOverride'
  | 'listRegistryOverrides'
>;

/** Every backend collaborator the handlers need — all injectable for tests. */
export type ModelRegistryDeps = {
  repo: ModelRegistryRepo;
  keyDiscovery: {
    scan: () => Promise<IModelRegistryDetectedKey[]>;
    readValue: (discovered: IModelRegistryDetectedKey) => string | null;
  };
  connectionTester: {
    test: (
      providerId: ProviderId,
      creds: { key: string } | { fields: Record<string, string> }
    ) => Promise<{ ok: boolean; error?: ConnectError }>;
  };
  modelsDevClient: { getRegistry: () => Promise<ModelsDevRegistry> };
  makeApiSource: (providerId: ProviderId, apiKey: string) => CatalogSource;
  makeCliSource: (agentKey: CliAgentKey) => CatalogSource & {
    enumerable: boolean;
    underlyingProviderId: ProviderId;
  };
};

/** The 10 `modelRegistry` handler functions, keyed by contract method name. */
export type ModelRegistryHandlers = {
  detectKeys: () => Promise<IModelRegistryDetectedKey[]>;
  connect: (p: { providerId: ProviderId; creds: IModelRegistryCreds }) => Promise<IModelRegistryConnectResult>;
  testConnection: (p: { providerId: ProviderId }) => Promise<IModelRegistryTestResult>;
  list: () => Promise<IModelRegistryProviderView[]>;
  getCatalog: (p: { providerId: ProviderId }) => Promise<IModelRegistryCatalogView>;
  toggleModel: (p: { providerId: ProviderId; modelId: string; enabled: boolean }) => Promise<{ ok: boolean }>;
  refresh: (p: { providerId: ProviderId }) => Promise<{ ok: boolean }>;
  disconnect: (p: { providerId: ProviderId }) => Promise<{ ok: boolean }>;
  rekey: (p: { providerId: ProviderId; creds: IModelRegistryCreds }) => Promise<IModelRegistryConnectResult>;
  curatedForAgent: (p: { agentKey: string }) => Promise<CuratedModel[]>;
};

// ─── Handler factory ──────────────────────────────────────────────────────────

/**
 * Build the `modelRegistry` handler functions over the injected dependencies.
 * Exported so unit tests exercise the real handler logic without the IPC layer.
 */
export function createModelRegistryHandlers(deps: ModelRegistryDeps): ModelRegistryHandlers {
  const { repo, keyDiscovery, connectionTester, modelsDevClient } = deps;
  const assembler = new CatalogAssembler();
  const curator = new Curator();

  /**
   * Resolve a renderer-supplied creds payload into the concrete creds shape the
   * `ConnectionTester` and persistence expect. A `useDiscovered` payload is
   * resolved against `KeyDiscovery` main-side — the renderer never sees the
   * value. Returns `null` when a discovered key cannot be located.
   */
  async function resolveCreds(
    providerId: ProviderId,
    creds: IModelRegistryCreds
  ): Promise<{ key: string } | { fields: Record<string, string> } | null> {
    if ('key' in creds) return { key: creds.key };
    if ('fields' in creds) return { fields: creds.fields };
    // `useDiscovered` — find the discovered key for this provider, read it.
    try {
      const found = await keyDiscovery.scan();
      const match = found.find((d) => d.providerId === providerId);
      if (!match) return null;
      const value = keyDiscovery.readValue(match);
      return value ? { key: value } : null;
    } catch {
      return null;
    }
  }

  /**
   * Build the catalog for a connected provider and persist it. Reusable across
   * connect / refresh / rekey — and callable externally for Wave 3's
   * Google-OAuth `google-gemini` wiring.
   *
   *  - Cloud provider → the models.dev registry IS the catalog: a
   *    `CloudRegistrySource` synthesizes its `RawModel[]`.
   *  - Standard API-key provider → an `ApiProviderSource` over the live key.
   *
   * **Precondition:** a `model_registry_providers` row for `providerId` MUST
   * already exist — `model_registry_catalog` rows FK-reference it. This function
   * guards that precondition explicitly and returns `{ ok:false }` (rather than
   * letting an opaque `SQLITE_CONSTRAINT_FOREIGNKEY` surface) when the row is
   * missing. An external caller (e.g. Wave 3 Google-OAuth) must `upsert` the
   * provider row before invoking this.
   *
   * Returns `{ ok, models, sourceErrors }` — `ok:false` when ANY step failed,
   * including the missing-row guard and the `replaceRegistryCatalog` DB write.
   * `models` is the count of catalog models persisted; `sourceErrors` counts
   * catalog sources whose `listModels()` rejected, so the caller can tell a
   * degraded empty catalog (`models:0` with `sourceErrors>0`) apart from a
   * provider that genuinely exposes zero models. Never throws: the whole body
   * is wrapped so callers can branch on the result instead of guessing.
   */
  async function buildAndPersistCatalog(
    providerId: ProviderId,
    creds: { key: string } | { fields: Record<string, string> }
  ): Promise<{ ok: boolean; models: number; sourceErrors: number }> {
    try {
      // FK precondition: catalog rows reference the provider row. Guard it
      // explicitly so a missing row is a clear failure, not a swallowed
      // SQLITE_CONSTRAINT_FOREIGNKEY with no diagnostic.
      if (!repo.getRegistryProvider(providerId)) {
        return { ok: false, models: 0, sourceErrors: 0 };
      }

      const registry = await modelsDevClient.getRegistry().catch(() => ({}) as ModelsDevRegistry);

      let sources: CatalogSource[];
      if (CLOUD_PROVIDERS.has(providerId)) {
        sources = [new CloudRegistrySource(providerId, registry)];
      } else {
        const apiKey = 'key' in creds ? creds.key : '';
        sources = apiKey ? [deps.makeApiSource(providerId, apiKey)] : [];
      }

      const { models, sourceErrors } = await assembler.assemble(sources, registry);
      repo.replaceRegistryCatalog(providerId, models);
      return { ok: true, models: models.length, sourceErrors };
    } catch {
      return { ok: false, models: 0, sourceErrors: 0 };
    }
  }

  /** Apply the user's per-model overrides on top of the curated view. */
  function applyOverrides(providerId: ProviderId, curated: CuratedModel[]): CuratedModel[] {
    const overrides = repo.listRegistryOverrides(providerId);
    if (overrides.length === 0) return curated;
    const byId = new Map(overrides.map((o) => [o.modelId, o.enabled]));
    return curated.map((model) => {
      const override = byId.get(model.id);
      return override === undefined ? model : { ...model, enabled: override };
    });
  }

  /**
   * A short human label for how a provider was connected. `useDiscovered` is
   * checked before the cloud branch: an auto-discovered key is the most
   * specific signal regardless of provider kind, so it must win.
   */
  function connectedViaLabel(creds: IModelRegistryCreds, providerId: ProviderId): string {
    if ('useDiscovered' in creds) return 'auto-discovered';
    if (CLOUD_PROVIDERS.has(providerId)) return 'cloud-credentials';
    if ('fields' in creds) return 'cloud-credentials';
    return 'api-key';
  }

  /**
   * Connect (or re-key) a provider: resolve creds, test (skipped for cloud),
   * persist creds + provider state, build + persist the catalog. Shared by
   * `connect` and `rekey` — `isRekey` controls the persistence path.
   *
   * Rekey safety: a rekey does NOT overwrite the stored creds until the new
   * key's catalog build has succeeded. If the build fails the provider is left
   * with its PREVIOUS working credentials — a failed rekey never strands a
   * provider on an unproven key.
   */
  async function connectOrRekey(
    providerId: ProviderId,
    creds: IModelRegistryCreds,
    isRekey: boolean
  ): Promise<IModelRegistryConnectResult> {
    const resolved = await resolveCreds(providerId, creds);
    if (!resolved) return { ok: false, error: 'unrecognized' };

    const isCloud = CLOUD_PROVIDERS.has(providerId);

    if (isCloud) {
      // Cloud providers cannot be HTTP-probed — but a connect must still carry
      // the credential fields that provider needs. An empty / partial `fields`
      // payload is rejected rather than persisted as a false green.
      if (!('fields' in resolved) || !hasRequiredCloudFields(providerId, resolved.fields)) {
        return { ok: false, error: 'unrecognized' };
      }
    } else {
      // A non-cloud provider connected with `{ fields }` carries no usable API
      // key for the catalog build — reject it up front so connect and rekey
      // stay consistent (a `{ fields }` connect would otherwise pass the test
      // but build an empty catalog).
      if ('fields' in resolved) return { ok: false, error: 'unrecognized' };
      const result = await connectionTester.test(providerId, resolved);
      if (!result.ok) return { ok: false, error: result.error ?? 'unknown' };
    }

    const credsRecord: Record<string, unknown> =
      'key' in resolved ? { key: resolved.key } : { fields: resolved.fields };

    if (isRekey) {
      // A rekey must not destroy a working key on a catalog-build failure.
      // Capture the prior creds + state, write the new creds, build — and
      // restore the prior creds if the build fails.
      const priorCreds = repo.getRegistryProviderCreds(providerId);

      repo.updateRegistryProviderCreds(providerId, credsRecord);
      repo.updateRegistryProviderState(providerId, 'connected');

      const built = await buildAndPersistCatalog(providerId, resolved);
      if (!built.ok || (built.models === 0 && built.sourceErrors > 0)) {
        // The new key did not produce a usable catalog. Restore the previous
        // working credentials so the provider is not stranded on the unproven
        // key, and leave it in `'error'` so `list()` surfaces it.
        if (priorCreds.status === 'ok') {
          repo.updateRegistryProviderCreds(providerId, priorCreds.creds);
        }
        repo.updateRegistryProviderState(providerId, 'error', 'unknown');
        return { ok: false, error: 'unknown' };
      }
      // The rekey succeeded — refresh `connected_via` so a provider first
      // connected via auto-discovery then rekeyed with an explicit key (or
      // vice versa) does not keep a stale label.
      repo.updateRegistryProviderConnectedVia(providerId, connectedViaLabel(creds, providerId));
      return { ok: true };
    }

    repo.upsertRegistryProvider({
      providerId,
      connectedVia: connectedViaLabel(creds, providerId),
      state: 'connected',
      creds: credsRecord,
    });

    // The provider row is now `connected`. If the catalog build/persist fails
    // the row would be a false green — flip it to `'error'` so `list()` shows
    // it honestly (the UI renders that as "Action needed — Fix"). An empty
    // catalog where at least one source errored is also a degraded connect.
    const built = await buildAndPersistCatalog(providerId, resolved);
    if (!built.ok || (built.models === 0 && built.sourceErrors > 0)) {
      repo.updateRegistryProviderState(providerId, 'error', 'unknown');
      return { ok: false, error: 'unknown' };
    }

    return { ok: true };
  }

  return {
    async detectKeys(): Promise<IModelRegistryDetectedKey[]> {
      try {
        return await keyDiscovery.scan();
      } catch {
        return [];
      }
    },

    async connect({ providerId, creds }): Promise<IModelRegistryConnectResult> {
      try {
        return await connectOrRekey(providerId, creds, false);
      } catch {
        return { ok: false, error: 'unknown' };
      }
    },

    async testConnection({ providerId }): Promise<IModelRegistryTestResult> {
      try {
        const stored = repo.getRegistryProviderCreds(providerId);
        // `undecryptable` (a provider row exists but its ciphertext is
        // unreadable) is distinct from `not-found` (no row at all): persist the
        // provider's state as `'error'` so `list()` surfaces it and the UI can
        // prompt a re-key, then report the failure.
        if (stored.status === 'undecryptable') {
          repo.updateRegistryProviderState(providerId, 'error', 'unrecognized');
          return { ok: false, error: 'unrecognized' };
        }
        // `not-found` — no row to test.
        if (stored.status !== 'ok') return { ok: false, error: 'unrecognized' };

        if (CLOUD_PROVIDERS.has(providerId)) {
          // Cloud providers cannot be HTTP-probed — a stored credential is the
          // strongest available signal; treat it as connected.
          repo.updateRegistryProviderState(providerId, 'connected');
          return { ok: true };
        }

        const creds = toTestCreds(stored.creds);
        const result = await connectionTester.test(providerId, creds);
        const state: ProviderConnState = result.ok ? 'connected' : 'error';
        repo.updateRegistryProviderState(providerId, state, result.ok ? undefined : result.error);
        return result.ok ? { ok: true } : { ok: false, error: result.error ?? 'unknown' };
      } catch {
        return { ok: false, error: 'unknown' };
      }
    },

    async list(): Promise<IModelRegistryProviderView[]> {
      try {
        return repo.listRegistryProviders().map((p) => {
          const view: IModelRegistryProviderView = {
            providerId: p.providerId,
            connectedVia: p.connectedVia,
            state: p.state,
            modelCount: repo.countRegistryCatalog(p.providerId),
          };
          if (p.error) view.error = p.error;
          return view;
        });
      } catch {
        return [];
      }
    },

    async getCatalog({ providerId }): Promise<IModelRegistryCatalogView> {
      try {
        const catalog = repo.getRegistryCatalog(providerId);
        const curated = applyOverrides(providerId, curator.curate(catalog));
        return { catalog, curated };
      } catch {
        return { catalog: [], curated: [] };
      }
    },

    async toggleModel({ providerId, modelId, enabled }): Promise<{ ok: boolean }> {
      try {
        repo.setRegistryOverride(providerId, modelId, enabled);
        return { ok: true };
      } catch {
        return { ok: false };
      }
    },

    async refresh({ providerId }): Promise<{ ok: boolean }> {
      try {
        const stored = repo.getRegistryProviderCreds(providerId);
        // `undecryptable` — the row exists but its creds cannot be read.
        // Persist `'error'` so the UI can prompt a re-key, then fail.
        if (stored.status === 'undecryptable') {
          repo.updateRegistryProviderState(providerId, 'error', 'unrecognized');
          return { ok: false };
        }
        // `not-found` — nothing to refresh.
        if (stored.status !== 'ok') return { ok: false };
        const built = await buildAndPersistCatalog(providerId, toTestCreds(stored.creds));
        return { ok: built.ok };
      } catch {
        return { ok: false };
      }
    },

    async disconnect({ providerId }): Promise<{ ok: boolean }> {
      try {
        repo.deleteRegistryProvider(providerId);
        return { ok: true };
      } catch {
        return { ok: false };
      }
    },

    async rekey({ providerId, creds }): Promise<IModelRegistryConnectResult> {
      try {
        if (!repo.getRegistryProvider(providerId)) return { ok: false, error: 'unrecognized' };
        return await connectOrRekey(providerId, creds, true);
      } catch {
        return { ok: false, error: 'unknown' };
      }
    },

    async curatedForAgent({ agentKey }): Promise<CuratedModel[]> {
      try {
        if (agentKey === 'wcore') {
          // wcore proxies every connected provider — union their curated text
          // models. The Curator already drops non-text kinds. Dedup by
          // `(providerId, id)`: a model id can legitimately appear under
          // multiple providers, but the SAME provider must not contribute a
          // duplicate id. The first connected provider that supplies a given
          // `(providerId, id)` wins — `listRegistryProviders` is ordered by
          // `created_at`, so the result is deterministic.
          const all: CuratedModel[] = [];
          const seen = new Set<string>();
          for (const provider of repo.listRegistryProviders()) {
            const curated = applyOverrides(
              provider.providerId,
              curator.curate(repo.getRegistryCatalog(provider.providerId))
            );
            for (const model of curated) {
              const dedupKey = `${model.providerId} ${model.id}`;
              if (seen.has(dedupKey)) continue;
              seen.add(dedupKey);
              all.push(model);
            }
          }
          return all;
        }

        if (CLI_AGENT_KEYS.has(agentKey)) {
          const cliKey = agentKey as CliAgentKey;
          if (isEnumerableCliAgent(cliKey)) {
            // Enumerable CLI (Codex) — build straight from its CLI source.
            const source = deps.makeCliSource(cliKey);
            const registry = await modelsDevClient.getRegistry().catch(() => ({}) as ModelsDevRegistry);
            const { models } = await assembler.assemble([source], registry);
            return curator.curate(models);
          }
          // Non-enumerable CLI — fall back to the underlying provider's curated
          // set when that provider is connected, else nothing.
          const underlying = CLI_UNDERLYING_PROVIDER[cliKey];
          if (!repo.getRegistryProvider(underlying)) return [];
          return applyOverrides(underlying, curator.curate(repo.getRegistryCatalog(underlying)));
        }

        return [];
      } catch {
        return [];
      }
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * True when a cloud provider's `fields` payload carries every credential field
 * that provider needs, each a non-empty string. A non-empty-presence check —
 * NOT a real cloud-SDK credential validation. A provider with no entry in
 * `CLOUD_REQUIRED_FIELDS` only needs a non-empty `fields` object.
 */
function hasRequiredCloudFields(providerId: ProviderId, fields: Record<string, string>): boolean {
  const required = CLOUD_REQUIRED_FIELDS[providerId];
  if (!required) return Object.keys(fields).length > 0;
  return required.every((name) => typeof fields[name] === 'string' && fields[name].trim().length > 0);
}

/** Coerce a stored creds record into the `ConnectionTester` creds shape. */
function toTestCreds(stored: Record<string, unknown>): { key: string } | { fields: Record<string, string> } {
  if (typeof stored.key === 'string') return { key: stored.key };
  if (stored.fields && typeof stored.fields === 'object' && !Array.isArray(stored.fields)) {
    return { fields: stored.fields as Record<string, string> };
  }
  return { fields: {} };
}

// ─── IPC registration ─────────────────────────────────────────────────────────

let _repo: ProviderRepository | null = null;

/**
 * Build the production dependency set wired to the real 1A–1E modules and the
 * SQLite-backed `ProviderRepository`.
 */
async function buildProductionDeps(): Promise<ModelRegistryDeps> {
  const db = await getDatabase();
  _repo = new ProviderRepository(db.getDriver());
  const keyDiscovery = new KeyDiscovery();
  const connectionTester = new ConnectionTester();
  const modelsDevClient = new ModelsDevClient();

  return {
    repo: _repo,
    keyDiscovery: {
      scan: () => keyDiscovery.scan(),
      readValue: (d) => keyDiscovery.readValue(d),
    },
    connectionTester: {
      test: (providerId, creds) => connectionTester.test(providerId, creds),
    },
    modelsDevClient: {
      getRegistry: () => modelsDevClient.getRegistry(),
    },
    makeApiSource: (providerId, apiKey) => new ApiProviderSource(providerId, apiKey),
    makeCliSource: (agentKey) => new CliAgentSource(agentKey),
  };
}

/**
 * Register the `modelRegistry` IPC handlers on the bridge. Registered alongside
 * the legacy `providersIpc` in the main-process IPC setup; the two namespaces
 * use distinct channel strings and never collide.
 */
export async function initModelRegistryIpc(): Promise<void> {
  const deps = await buildProductionDeps();
  const h = createModelRegistryHandlers(deps);

  ipcBridge.modelRegistry.detectKeys.provider(() => h.detectKeys());
  ipcBridge.modelRegistry.connect.provider((payload) => h.connect(payload));
  ipcBridge.modelRegistry.testConnection.provider((payload) => h.testConnection(payload));
  ipcBridge.modelRegistry.list.provider(() => h.list());
  ipcBridge.modelRegistry.getCatalog.provider((payload) => h.getCatalog(payload));
  ipcBridge.modelRegistry.toggleModel.provider((payload) => h.toggleModel(payload));
  ipcBridge.modelRegistry.refresh.provider((payload) => h.refresh(payload));
  ipcBridge.modelRegistry.disconnect.provider((payload) => h.disconnect(payload));
  ipcBridge.modelRegistry.rekey.provider((payload) => h.rekey(payload));
  ipcBridge.modelRegistry.curatedForAgent.provider((payload) => h.curatedForAgent(payload));
}

/** The model-registry repository instance, available after `initModelRegistryIpc`. */
export function getModelRegistryRepository(): ProviderRepository | null {
  return _repo;
}
