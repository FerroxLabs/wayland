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
 *  - **providers** - `model_registry_providers`, one row per connected provider
 *    keyed by `ProviderId`, holding the encrypted credentials + live state.
 *  - **catalogs**  - `model_registry_catalog`, the assembled `CatalogModel[]`
 *    per provider; the curated view is derived on read by the pure `Curator`.
 *  - **overrides** - `model_registry_overrides`, per-model enable/disable flags
 *    the user set explicitly via `toggleModel`.
 *  - **creds**     - serialized to JSON and encrypted by the repository via
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
 * `connect`'s contract is key/fields/useDiscovered only - Google OAuth is out
 * of scope here. The reusable `buildAndPersistCatalog` function is exported so
 * Wave 3 can wire the Google sign-in button (`authBridge`) to provider
 * persistence + catalog assembly for an OAuth-connected `google-gemini`.
 */

import { app } from 'electron';
import { ipcBridge } from '@/common';
import type {
  IModelRegistryCatalogView,
  IModelRegistryChatStartHandle,
  IModelRegistryChatStartPayload,
  IModelRegistryConnectResult,
  IModelRegistryCreds,
  IModelRegistryDetectedKey,
  IModelRegistryProviderView,
  IModelRegistryRefreshSummary,
  IModelRegistryResolveForChatStartResult,
  IModelRegistryTestResult,
} from '@/common/adapter/ipcBridge';
import type { TProviderWithModel } from '@/common/config/storage';
import { DEFAULT_ACCOUNT_ID, resolveAccountId } from '@/common/config/account';
import { isLocalBaseUrl } from '@/common/utils/urlValidation';
import { autoRegisterOllamaInRepo } from '@process/onboarding/autoRegisterOllama';
import type { OllamaProbe, OllamaRegistryRepo } from '@process/onboarding/autoRegisterOllama';
import { getDatabase } from '@process/services/database';
import type { ConnectError, CuratedModel, ProviderId, RawModel } from '../types';
import type { CatalogSource } from '../sources/CatalogSource';
import { ApiProviderSource } from '../sources/ApiProviderSource';
import { validateProviderBaseUrl } from '../sources/validateBaseUrl';
import { ModelRefreshScheduler } from '../scheduler/ModelRefreshScheduler';
import { CliAgentSource, isEnumerableCliAgent } from '../sources/CliAgentSource';
import type { CliAgentKey } from '../sources/CliAgentSource';
import { CatalogAssembler, MODELS_DEV_PROVIDER_KEY } from '../catalog/CatalogAssembler';
import { Curator } from '../catalog/Curator';
import { ProviderCatalogStore, loadBaselineProviderCatalog } from '../catalog/providerCatalogStore';
import { PROVIDER_ENDPOINTS } from '../detection/providerEndpoints';
import type { CatalogProviderEntry } from '../catalog/catalogProvider';
import { FLUX_PROVIDER_ID, isFluxModelId } from '@/common/config/flux';
import { injectFluxVirtualModels } from '../catalog/fluxVirtualModels';
import {
  buildChatGptSubscriptionCatalog,
  buildChatGptSubscriptionCatalogLive,
  CHATGPT_SUBSCRIPTION_PROVIDER_ID,
} from '../catalog/chatgptSubscriptionModels';
import { ConnectionTester } from '../detection/ConnectionTester';
import { KeyDiscovery } from '../detection/KeyDiscovery';
import { ModelsDevClient } from '../enrichment/ModelsDevClient';
import type { ModelsDevRegistry } from '../enrichment/modelsDevSchema';
import { ProviderRepository } from '../storage/ProviderRepository';
import { runLegacyModelConfigMigration } from '../migration/legacyModelConfigMigration';
import { runOrphanProviderDedup } from '../migration/orphanProviderDedup';
import { mirrorConnectOrRekey, mirrorDisconnect } from '../legacyModelConfigBridge';
import { ProcessConfig } from '@process/utils/initStorage';
import { isEncryptionAvailable } from '@process/secrets/safeStorage';

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
 * `MODELS_DEV_PROVIDER_KEY` so the mapping cannot drift - this is just the
 * cloud-provider subset of it.
 */
const CLOUD_MODELS_DEV_KEY: Partial<Record<ProviderId, string>> = Object.fromEntries(
  [...CLOUD_PROVIDERS].map((id) => [id, MODELS_DEV_PROVIDER_KEY[id]])
) as Partial<Record<ProviderId, string>>;

/**
 * The credential fields each cloud provider must carry for a connect to be
 * accepted. A cloud connect cannot be HTTP-probed, so this is the only gate
 * against persisting a `connected` provider with empty / missing creds. The
 * check is a non-empty-string presence check - NOT a real cloud-SDK validation.
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
export class CloudRegistrySource implements CatalogSource {
  readonly kind = 'api' as const;
  readonly providerId: ProviderId;

  private readonly models: RawModel[];

  constructor(providerId: ProviderId, registry: ModelsDevRegistry) {
    this.providerId = providerId;
    // `CLOUD_MODELS_DEV_KEY` only covers cloud providers. A google-auth Gemini
    // connection routes here too (it can't be HTTP-probed), but its providerId
    // is `google-gemini` - a normal API-key provider NOT in CLOUD_PROVIDERS - so
    // the cloud-only map returns undefined and the catalog comes back EMPTY
    // ("Connected · No models"). Fall back to the full provider→models.dev key
    // map so OAuth-connected Gemini synthesizes its catalog from the registry.
    const devKey = CLOUD_MODELS_DEV_KEY[providerId] ?? MODELS_DEV_PROVIDER_KEY[providerId];
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

/** Every backend collaborator the handlers need - all injectable for tests. */
export type ModelRegistryDeps = {
  repo: ModelRegistryRepo;
  keyDiscovery: {
    scan: () => Promise<IModelRegistryDetectedKey[]>;
    readValue: (discovered: IModelRegistryDetectedKey) => string | null;
  };
  connectionTester: {
    test: (
      providerId: ProviderId,
      creds: { key: string } | { fields: Record<string, string> },
      customBaseUrl?: string
    ) => Promise<{ ok: boolean; error?: ConnectError }>;
  };
  modelsDevClient: { getRegistry: () => Promise<ModelsDevRegistry> };
  makeApiSource: (providerId: ProviderId, apiKey: string, baseUrl?: string) => CatalogSource;
  makeCliSource: (agentKey: CliAgentKey) => CatalogSource & {
    enumerable: boolean;
    underlyingProviderId: ProviderId;
  };
  /**
   * Optional refresh-orchestration deps (the global `refreshAllOnce` core).
   * Omitted by the per-handler unit tests that don't exercise refreshAll; wired
   * for real in `initModelRegistryIpc`. `now` is injectable so the
   * success-gated freshness stamp is deterministic in tests.
   */
  mirror?: (providerId: ProviderId) => Promise<void>;
  emitListChanged?: () => void;
  setLastRefreshedAt?: (value: number) => Promise<void>;
  now?: () => number;
  /**
   * Re-probe the local Ollama daemon (`/api/tags`) during a scheduled refresh.
   * `ollama-local` is keyless and loopback-only: its catalog comes from a live
   * daemon probe, NOT from `buildAndPersistCatalog` (which would assemble zero
   * models for a keyless provider and wipe the catalog). Omitted by tests that
   * don't exercise the ollama path; wired to `detect.probeOllama` in
   * `initModelRegistryIpc`. A `null`/unreachable result must leave the existing
   * catalog untouched rather than emptying it.
   */
  probeOllama?: () => Promise<OllamaProbe>;
};

/** The fixed native provider id for the local Ollama daemon. */
const OLLAMA_LOCAL_ID: ProviderId = 'ollama-local';
/** The hardcoded loopback OpenAI-compatible endpoint the local Ollama provider is pinned to. */
const OLLAMA_LOCAL_BASE_URL = 'http://127.0.0.1:11434/v1';

/**
 * True only when `baseUrl` parses and its host is a LOOPBACK literal
 * (`localhost`, `127.0.0.0/8`, `::1`) - NOT the broader private/link-local set
 * `isLoopbackOrPrivateHost` covers. The keyless `ollama-local` SSRF exemption
 * (Finding 5) is scoped to loopback so the exemption can never be hijacked onto
 * a private or link-local host (e.g. `169.254.169.254` cloud-metadata).
 */
function isLoopbackBaseUrl(baseUrl: string): boolean {
  if (typeof baseUrl !== 'string' || baseUrl.trim().length === 0) return false;
  let host: string;
  try {
    host = new URL(baseUrl.trim()).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  if (host === 'localhost' || host === '::1') return true;
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  if (!parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255)) return false;
  return Number(parts[0]) === 127; // 127.0.0.0/8
}

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
  resolveForChatStart: (p: {
    providerId: ProviderId;
    modelId: string;
    accountId?: string;
  }) => Promise<IModelRegistryResolveForChatStartResult>;
  /**
   * Re-fetch + re-assemble + persist EVERY connected provider's catalog in one
   * pass: models.dev registry fetched once, providers refreshed serially with an
   * SSRF-validated baseUrl gate, the legacy `model.config` mirror awaited per
   * provider, `lastRefreshedAt` advanced only on ≥1 success, and `listChanged`
   * emitted once. Returns the genuinely-new model ids for the toast.
   */
  refreshAllOnce: () => Promise<IModelRegistryRefreshSummary>;
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
   * resolved against `KeyDiscovery` main-side - the renderer never sees the
   * value. Returns `null` when a discovered key cannot be located.
   *
   * Wave 3 Fix 6: `useGoogleAuth` resolves to a `{ useGoogleAuth: true }` creds
   * shape - the dispatcher (`gemini-with-google-auth` arm) reads OAuth tokens
   * from the main-process auth store, not from the registry creds row.
   */
  async function resolveCreds(
    providerId: ProviderId,
    creds: IModelRegistryCreds
  ): Promise<{ key: string; baseUrl?: string } | { fields: Record<string, string> } | { useGoogleAuth: true } | null> {
    if ('key' in creds) {
      // Ship-gate Fix B2: thread an optional `baseUrl` through so the connect
      // view for `openai-compatible` (and any other custom-endpoint provider)
      // can set its endpoint at connect time. A non-string / empty value is
      // dropped here so the persistence layer only ever sees real URLs.
      const out: { key: string; baseUrl?: string } = { key: creds.key };
      if (typeof creds.baseUrl === 'string' && creds.baseUrl.trim().length > 0) {
        out.baseUrl = creds.baseUrl.trim();
      } else if (!PROVIDER_ENDPOINTS[providerId]) {
        // Providers from the "100+ more" catalog (e.g. opencode-go) carry their
        // endpoint in the bundled catalog, not in PROVIDER_ENDPOINTS. The connect
        // view picks them key-only with no baseUrl, so resolve the catalog
        // endpoint here - otherwise the connection test has no endpoint to probe
        // and always fails "unknown", and inference would have no base URL. (#63)
        try {
          const entry = (await getProviderCatalog()).find((e) => e.id === providerId);
          if (entry?.baseUrl) out.baseUrl = entry.baseUrl;
        } catch {
          /* non-fatal: fall through with no baseUrl */
        }
      }
      return out;
    }
    if ('fields' in creds) return { fields: creds.fields };
    if ('useGoogleAuth' in creds) {
      // Only valid for the Gemini provider - every other provider rejects this.
      if (providerId !== 'google-gemini') return null;
      return { useGoogleAuth: true };
    }
    // `useDiscovered` - find the discovered key for this provider, read it.
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
   * connect / refresh / rekey - and callable externally for Wave 3's
   * Google-OAuth `google-gemini` wiring.
   *
   *  - Cloud provider → the models.dev registry IS the catalog: a
   *    `CloudRegistrySource` synthesizes its `RawModel[]`.
   *  - Standard API-key provider → an `ApiProviderSource` over the live key.
   *
   * **Precondition:** a `model_registry_providers` row for `providerId` MUST
   * already exist - `model_registry_catalog` rows FK-reference it. This function
   * guards that precondition explicitly and returns `{ ok:false }` (rather than
   * letting an opaque `SQLITE_CONSTRAINT_FOREIGNKEY` surface) when the row is
   * missing. An external caller (e.g. Wave 3 Google-OAuth) must `upsert` the
   * provider row before invoking this.
   *
   * Returns `{ ok, models, sourceErrors }` - `ok:false` when ANY step failed,
   * including the missing-row guard and the `replaceRegistryCatalog` DB write.
   * `models` is the count of catalog models persisted; `sourceErrors` counts
   * catalog sources whose `listModels()` rejected, so the caller can tell a
   * degraded empty catalog (`models:0` with `sourceErrors>0`) apart from a
   * provider that genuinely exposes zero models. Never throws: the whole body
   * is wrapped so callers can branch on the result instead of guessing.
   */
  async function buildAndPersistCatalog(
    providerId: ProviderId,
    creds: { key: string } | { fields: Record<string, string> } | { useGoogleAuth: true },
    prefetchedRegistry?: ModelsDevRegistry
  ): Promise<{ ok: boolean; models: number; sourceErrors: number }> {
    try {
      // FK precondition: catalog rows reference the provider row. Guard it
      // explicitly so a missing row is a clear failure, not a swallowed
      // SQLITE_CONSTRAINT_FOREIGNKEY with no diagnostic.
      if (!repo.getRegistryProvider(providerId)) {
        return { ok: false, models: 0, sourceErrors: 0 };
      }

      // The ChatGPT subscription can't be listed via `api.openai.com/v1/models`
      // (the subscription token is locked out of it), but the Codex backend DOES
      // expose the account's live model list at `codex/models?client_version=...`
      // (same source the Codex CLI / Hermes / OpenClaw use). Fetch it live so the
      // catalog always reflects OpenAI's current models; fall back to a static
      // snapshot only when the fetch fails. The generic API source below would
      // fetch zero models and wipe the catalog, so this provider stays special.
      if (providerId === CHATGPT_SUBSCRIPTION_PROVIDER_ID) {
        const accessToken = 'key' in creds ? creds.key : '';
        const models = await buildChatGptSubscriptionCatalogLive(accessToken);
        repo.replaceRegistryCatalog(providerId, models);
        return { ok: true, models: models.length, sourceErrors: 0 };
      }

      // `refreshAllOnce` fetches the models.dev registry once for the whole
      // sweep and threads it in, so N providers don't each re-fetch (and can't
      // assemble against different registry versions mid-sweep). Single-provider
      // callers (connect / refresh / rekey) pass nothing and fetch their own.
      const registry =
        prefetchedRegistry ?? (await modelsDevClient.getRegistry().catch(() => ({}) as ModelsDevRegistry));

      const isGoogleAuth = 'useGoogleAuth' in creds && creds.useGoogleAuth === true;

      let sources: CatalogSource[];
      let usedLiveApiSource = false;
      if (CLOUD_PROVIDERS.has(providerId) || isGoogleAuth) {
        // Cloud + google-auth-Gemini - synthesize the catalog from the
        // models.dev registry slice. The OAuth-authenticated SDK reads model
        // ids the same way models.dev exposes them.
        sources = [new CloudRegistrySource(providerId, registry)];
      } else if ('key' in creds && creds.key) {
        // Fix 10 - preserve the user's saved custom baseUrl through refresh.
        // Otherwise `openai-compatible` and other custom-endpoint providers
        // silently re-target the canonical default on every refresh.
        const stored = repo.getRegistryProviderCreds(providerId);
        const customBaseUrl =
          stored.status === 'ok' && typeof stored.creds.baseUrl === 'string'
            ? (stored.creds.baseUrl as string)
            : undefined;
        sources = [deps.makeApiSource(providerId, creds.key, customBaseUrl)];
        usedLiveApiSource = true;
      } else {
        sources = [];
      }

      const { models: liveModels, sourceErrors } = await assembler.assemble(sources, registry);
      let models = liveModels;

      // models.dev fallback: a live `/v1/models` source that enumerated NOTHING
      // is the signature of an OAuth/subscription bearer that authenticates for
      // inference but cannot list models - xAI "Sign in with X" is the case in
      // point, and it is exactly why google-auth Gemini already routes through
      // CloudRegistrySource above. Rather than persist an empty catalog (dead
      // provider, dead toggle), synthesize from the models.dev registry slice.
      // That keeps the catalog CURRENT with no hardcoded id list - models.dev is
      // re-fetched on every refresh - and yields [] for providers models.dev
      // does not track, so a genuinely-empty custom endpoint still stays empty.
      // API-KEY connections are unaffected: their live listing is non-empty, so
      // the fallback never runs and the user's real account models win.
      if (usedLiveApiSource && models.length === 0) {
        const fallback = await assembler.assemble([new CloudRegistrySource(providerId, registry)], registry);
        if (fallback.models.length > 0) models = fallback.models;
      }

      const finalModels = providerId === FLUX_PROVIDER_ID ? injectFluxVirtualModels(models) : models;
      repo.replaceRegistryCatalog(providerId, finalModels);
      return { ok: true, models: finalModels.length, sourceErrors };
    } catch {
      return { ok: false, models: 0, sourceErrors: 0 };
    }
  }

  /**
   * Refresh the keyless `ollama-local` provider by RE-PROBING the local daemon
   * (`/api/tags`) and re-running the idempotent autoRegister catalog write -
   * NOT `buildAndPersistCatalog`, which would assemble zero models for a keyless
   * provider and wipe the catalog (Finding 1).
   *
   * Returns:
   *  - `'ok'`        - the daemon answered; catalog refreshed from the live list.
   *  - `'unreachable'` - no `probeOllama` dep, or the daemon is down/empty; the
   *                      EXISTING catalog is left untouched (never replaced []).
   *  - `'failed'`    - the autoRegister write itself errored.
   *
   * `autoRegisterOllamaInRepo` preserves a user-changed `state` (e.g. disabled)
   * and only refreshes the catalog for an already-registered provider.
   */
  async function refreshOllamaLocal(): Promise<'ok' | 'unreachable' | 'failed'> {
    if (!deps.probeOllama) return 'unreachable';
    let probe: OllamaProbe;
    try {
      probe = await deps.probeOllama();
    } catch {
      return 'unreachable';
    }
    // A down daemon (`running:false`) must NOT empty the catalog - leave the
    // last-known models in place so a transient daemon restart doesn't blank the
    // picker. autoRegister would `skip` a non-running probe anyway, but we guard
    // explicitly so the refresh reports `unreachable` rather than a false `ok`.
    if (!probe.running) return 'unreachable';
    const outcome = autoRegisterOllamaInRepo(repo as unknown as OllamaRegistryRepo, probe);
    return outcome.action === 'skipped' ? 'failed' : 'ok';
  }

  /**
   * Best-effort recovery for a provider row whose stored creds are
   * `undecryptable`. The most common cause is a safeStorage key rotation
   * (dev-mode launches in particular get a fresh keychain on every boot),
   * which leaves the row's ciphertext intact but unreadable.
   *
   * Scans `KeyDiscovery` for an env key that targets this provider; if found,
   * overwrites the unreadable ciphertext with the discovered key and flips
   * state back to `connected`. Returns `true` only when both the read and
   * the rewrite succeeded - the caller can then re-read creds and proceed.
   *
   * Cloud providers are skipped: their creds are multi-field structures the
   * KeyDiscovery flat-string path cannot rebuild - those legitimately need a
   * manual re-key.
   */
  async function tryRecoverFromDiscoveredKey(providerId: ProviderId): Promise<boolean> {
    if (CLOUD_PROVIDERS.has(providerId)) return false;
    try {
      const found = await keyDiscovery.scan();
      const match = found.find((d) => d.providerId === providerId);
      if (!match) return false;
      const value = keyDiscovery.readValue(match);
      if (!value) return false;
      repo.updateRegistryProviderCreds(providerId, { key: value });
      repo.updateRegistryProviderState(providerId, 'connected');
      // Refresh the legacy v2 bridge so legacy consumers see the recovered
      // key on the same boot (matches what `connect`/`rekey`/`refresh`
      // wrappers do via `mirrorConnectOrRekey` in `initModelRegistryIpc`).
      if (_repo) void mirrorConnectOrRekey(_repo, providerId);
      return true;
    } catch {
      return false;
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
    if ('useGoogleAuth' in creds) return 'google-auth';
    if ('useDiscovered' in creds) return 'auto-discovered';
    if (CLOUD_PROVIDERS.has(providerId)) return 'cloud-credentials';
    if ('fields' in creds) return 'cloud-credentials';
    return 'api-key';
  }

  /**
   * Connect (or re-key) a provider: resolve creds, test (skipped for cloud),
   * persist creds + provider state, build + persist the catalog. Shared by
   * `connect` and `rekey` - `isRekey` controls the persistence path.
   *
   * Rekey safety: a rekey does NOT overwrite the stored creds until the new
   * key's catalog build has succeeded. If the build fails the provider is left
   * with its PREVIOUS working credentials - a failed rekey never strands a
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
    const isGoogleAuth = 'useGoogleAuth' in resolved;
    // #100: a key that authenticates but has no usable credit yet (e.g. a brand
    // new OpenRouter key) should still be addable. When set, the fresh-connect
    // path persists the provider connected-but-switched-off with a warning
    // instead of rejecting it.
    let noCredit = false;

    if (isGoogleAuth) {
      // Google-auth Gemini - no HTTP probe (OAuth is verified by the auth
      // module that produced the token), but we still want to build the
      // catalog from models.dev so the picker has models to choose from.
      // `buildAndPersistCatalog` reads cloud providers from the registry; for
      // google-auth Gemini we likewise treat models.dev as the source.
    } else if (isCloud) {
      if (!('fields' in resolved) || !hasRequiredCloudFields(providerId, resolved.fields)) {
        return { ok: false, error: 'unrecognized' };
      }
    } else {
      // A non-cloud provider connected with `{ fields }` carries no usable API
      // key for the catalog build - reject it up front so connect and rekey
      // stay consistent (a `{ fields }` connect would otherwise pass the test
      // but build an empty catalog).
      if ('fields' in resolved) return { ok: false, error: 'unrecognized' };
      const result = await connectionTester.test(providerId, resolved as { key: string }, resolved.baseUrl);
      if (!result.ok) {
        // A no-credit key still authenticates, and providers with a public model
        // listing (OpenRouter) still build a full catalog. On a FRESH connect,
        // accept it as connected-but-off with a warning (#100) instead of
        // rejecting. A rekey keeps the strict behavior - never silently swap a
        // working key for an unusable one. Every other failure is a hard reject.
        if (isRekey || result.error !== 'no-credit') return { ok: false, error: result.error ?? 'unknown' };
        noCredit = true;
      }
    }

    // Ship-gate Fix B2: persist an explicit `baseUrl` alongside the api key
    // when the caller supplied one (e.g. `openai-compatible` Browse connect).
    // The catalog build + chat-start dispatch both honor `creds.baseUrl`, so
    // without persisting it here a user-set custom endpoint would be lost on
    // the very next refresh.
    const credsRecord: Record<string, unknown> = isGoogleAuth
      ? { useGoogleAuth: true }
      : 'key' in resolved
        ? resolved.baseUrl
          ? { key: resolved.key, baseUrl: resolved.baseUrl }
          : { key: resolved.key }
        : { fields: (resolved as { fields: Record<string, string> }).fields };

    if (isRekey) {
      // A rekey must not destroy a working key on a catalog-build failure.
      // Capture the prior creds + state, write the new creds, build - and
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
      // The rekey succeeded - refresh `connected_via` so a provider first
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
    // the row would be a false green - flip it to `'error'` so `list()` shows
    // it honestly (the UI renders that as "Action needed - Fix"). An empty
    // catalog where at least one source errored is also a degraded connect.
    const built = await buildAndPersistCatalog(providerId, resolved);
    if (!built.ok || (built.models === 0 && built.sourceErrors > 0)) {
      repo.updateRegistryProviderState(providerId, 'error', 'unknown');
      return { ok: false, error: 'unknown' };
    }

    if (noCredit) {
      // Connected, but the key has no usable credit yet. Land the provider
      // switched off - disable every catalogued model so the row reads Connected
      // + off - and return a warning so the panel can say "add credit, then turn
      // it on" (#100). Flipping the provider switch on later re-enables the
      // curated defaults; the disable overrides survive catalog refreshes.
      for (const model of repo.getRegistryCatalog(providerId)) {
        repo.setRegistryOverride(providerId, model.id, false);
      }
      return { ok: true, warning: 'no-credit' };
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
        let stored = repo.getRegistryProviderCreds(providerId);
        // `undecryptable` - typically the runtime safeStorage key rotated
        // (common in dev mode across launches). Before stamping an error,
        // try to silently re-import from an env key the OS still has - if
        // that succeeds the row is back to `connected` with fresh ciphertext.
        if (stored.status === 'undecryptable') {
          const recovered = await tryRecoverFromDiscoveredKey(providerId);
          if (recovered) {
            stored = repo.getRegistryProviderCreds(providerId);
          } else {
            repo.updateRegistryProviderState(providerId, 'error', 'unrecognized');
            return { ok: false, error: 'unrecognized' };
          }
        }
        // `not-found` - no row to test.
        if (stored.status !== 'ok') return { ok: false, error: 'unrecognized' };

        if (
          CLOUD_PROVIDERS.has(providerId) ||
          providerId === CHATGPT_SUBSCRIPTION_PROVIDER_ID ||
          stored.creds.useGoogleAuth === true
        ) {
          // Cloud + google-auth + chatgpt-subscription - none can be HTTP-probed
          // via the standard `/v1/models` path (the ChatGPT backend has no model
          // listing and its token is rejected by api.openai.com). A stored
          // credential is the strongest available signal; treat it as connected.
          repo.updateRegistryProviderState(providerId, 'connected');
          return { ok: true };
        }

        const creds = toTestCreds(stored.creds);
        // `useGoogleAuth` already handled above; `ConnectionTester.test` accepts
        // the two remaining variants.
        const result = await connectionTester.test(
          providerId,
          creds as { key: string } | { fields: Record<string, string> },
          typeof stored.creds.baseUrl === 'string' ? stored.creds.baseUrl : undefined
        );
        // A no-credit key is still authenticated - keep the provider Connected
        // (it sits switched-off via disabled models), consistent with connect (#100).
        const established = result.ok || result.error === 'no-credit';
        repo.updateRegistryProviderState(providerId, established ? 'connected' : 'error', established ? undefined : result.error);
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
        let stored = repo.getRegistryProviderCreds(providerId);
        // `undecryptable` - typically the runtime safeStorage key rotated
        // (common in dev mode across launches). Before stamping an error,
        // try to silently re-import from an env key the OS still has so the
        // post-upgrade refresh sweep doesn't blast every connected provider
        // into `error/unrecognized` on a stale-keychain boot.
        if (stored.status === 'undecryptable') {
          const recovered = await tryRecoverFromDiscoveredKey(providerId);
          if (recovered) {
            stored = repo.getRegistryProviderCreds(providerId);
          } else {
            repo.updateRegistryProviderState(providerId, 'error', 'unrecognized');
            return { ok: false };
          }
        }
        // `not-found` - nothing to refresh.
        if (stored.status !== 'ok') return { ok: false };

        // The keyless `ollama-local` provider's catalog is the live `/api/tags`
        // daemon listing, NOT a `buildAndPersistCatalog` assembly: assembling
        // against an empty key builds zero models and WIPES the catalog every
        // tick (Finding 1). `refreshAllOnce` guards this; the per-provider
        // Refresh button must too, or each click empties the catalog (#314).
        // Re-probe the daemon instead - an unreachable daemon leaves the
        // existing catalog untouched (never replaced with []). The exemption is
        // scoped to a loopback baseUrl (Finding 5) so a row whose stored host is
        // not loopback is treated like any other custom provider and the
        // keyless allowance can never be hijacked onto a remote host.
        const storedBaseUrl = stored.creds.baseUrl;
        if (
          providerId === OLLAMA_LOCAL_ID &&
          isLoopbackBaseUrl(typeof storedBaseUrl === 'string' ? storedBaseUrl : '')
        ) {
          const outcome = await refreshOllamaLocal();
          return { ok: outcome === 'ok' };
        }

        const creds = toTestCreds(stored.creds);
        const built = await buildAndPersistCatalog(providerId, creds);
        return { ok: built.ok };
      } catch {
        return { ok: false };
      }
    },

    async refreshAllOnce(): Promise<IModelRegistryRefreshSummary> {
      const succeeded: string[] = [];
      const failed: string[] = [];
      const added: IModelRegistryRefreshSummary['added'] = [];

      // Registry fetched ONCE for the whole sweep (audit HIGH): N providers
      // must not each re-fetch models.dev, nor assemble against different
      // registry versions mid-sweep.
      const registry = await modelsDevClient.getRegistry().catch(() => ({}) as ModelsDevRegistry);

      const providers = repo.listRegistryProviders();
      for (let i = 0; i < providers.length; i++) {
        const { providerId } = providers[i];
        // Yield between providers so a large sweep doesn't starve the main loop
        // with back-to-back synchronous assemble + sqlite writes.
        if (i > 0) await new Promise<void>((resolve) => setImmediate(resolve));

        try {
          const stored = repo.getRegistryProviderCreds(providerId);
          if (stored.status !== 'ok') {
            failed.push(providerId);
            continue;
          }
          const storedBaseUrl = stored.creds.baseUrl;

          // The native `ollama-local` provider is keyless: its catalog is the
          // live `/api/tags` daemon listing, NOT a `buildAndPersistCatalog`
          // assembly (which would see an empty key, build zero models, and WIPE
          // the catalog on every refresh tick - Finding 1). Re-probe the daemon
          // and re-run the autoRegister refresh path instead. An unreachable
          // daemon leaves the existing catalog untouched (never replaced with
          // []). The id exemption is ALSO scoped to a loopback baseUrl (Finding
          // 5): a row whose stored host is not loopback is treated like any
          // other custom provider (validated below), so the keyless+SSRF-exempt
          // allowance can never be hijacked onto a remote host.
          if (
            providerId === OLLAMA_LOCAL_ID &&
            isLoopbackBaseUrl(typeof storedBaseUrl === 'string' ? storedBaseUrl : '')
          ) {
            const ollamaBefore = new Set(repo.getRegistryCatalog(providerId).map((m) => m.id));
            const outcome = await refreshOllamaLocal();
            if (outcome !== 'ok') {
              failed.push(providerId);
              continue;
            }
            if (deps.mirror) await deps.mirror(providerId).catch(() => {});
            for (const model of repo.getRegistryCatalog(providerId)) {
              if (!ollamaBefore.has(model.id)) {
                added.push({ providerId, modelId: model.id, displayName: model.displayName || model.id });
              }
            }
            succeeded.push(providerId);
            continue;
          }

          // SSRF gate: a stored custom baseUrl is fired unattended on a timer
          // with the key in the header - validate before every scheduled fetch.
          if (
            typeof storedBaseUrl === 'string' &&
            storedBaseUrl.trim().length > 0 &&
            !validateProviderBaseUrl(storedBaseUrl).ok
          ) {
            failed.push(providerId);
            continue;
          }

          const before = new Set(repo.getRegistryCatalog(providerId).map((m) => m.id));
          const creds = toTestCreds(stored.creds);
          const built = await buildAndPersistCatalog(providerId, creds, registry);
          if (!built.ok) {
            failed.push(providerId);
            continue;
          }
          // Await the legacy `model.config` mirror so the toast / picker
          // invalidation never precedes the mirror write.
          if (deps.mirror) await deps.mirror(providerId).catch(() => {});

          for (const model of repo.getRegistryCatalog(providerId)) {
            if (!before.has(model.id)) {
              added.push({ providerId, modelId: model.id, displayName: model.displayName || model.id });
            }
          }
          succeeded.push(providerId);
        } catch {
          failed.push(providerId);
        }
      }

      // Advance the freshness stamp ONLY when ≥1 provider refreshed - else
      // "updated Xh ago" would lie after a total failure (audit MED).
      let lastRefreshedAt: number | null = null;
      if (succeeded.length > 0) {
        lastRefreshedAt = (deps.now ?? Date.now)();
        if (deps.setLastRefreshedAt) await deps.setLastRefreshedAt(lastRefreshedAt);
      }

      deps.emitListChanged?.();

      return { ok: succeeded.length > 0, succeeded, failed, added, lastRefreshedAt };
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

    async resolveForChatStart({ providerId, modelId, accountId }): Promise<IModelRegistryResolveForChatStartResult> {
      try {
        const provider = repo.getRegistryProvider(providerId);
        if (!provider) return { ok: false, error: 'not-connected' };
        const stored = repo.getRegistryProviderCreds(providerId);
        if (stored.status === 'undecryptable') return { ok: false, error: 'undecryptable' };
        if (stored.status !== 'ok') return { ok: false, error: 'not-connected' };

        // Build (and validate) the full chat-start payload, then return ONLY
        // the non-secret handle to the renderer (audit C4). The decrypted
        // `apiKey` / `bedrockConfig` / `cloudFields` are deliberately dropped
        // here - they never cross IPC. The main-process spawn path re-resolves
        // them from this handle at dispatch (`resolveModelSecretsForSpawn`).
        //
        // We still build the full payload so the validation outcomes below
        // (Fix 9: discriminate `undecryptable` from `unsupported`) match what
        // the spawn-time resolution will see, giving the picker an accurate
        // re-key vs unsupported prompt before the conversation is created.
        const result = buildChatStartPayload(providerId, modelId, stored.creds);
        if (result.kind === 'unsupported') return { ok: false, error: 'unsupported' };
        if (result.kind === 'undecryptable') return { ok: false, error: 'undecryptable' };
        const p = result.payload;
        const handle: IModelRegistryChatStartHandle = {
          id: p.id,
          providerId: p.providerId,
          name: p.name,
          platform: p.platform,
          modelId: p.modelId,
          baseUrl: p.baseUrl,
          accountId: resolveAccountId({ accountId }),
          ...(p.modelProtocols ? { modelProtocols: p.modelProtocols } : {}),
        };
        return { ok: true, provider: handle };
      } catch {
        return { ok: false, error: 'unknown' };
      }
    },

    async curatedForAgent({ agentKey }): Promise<CuratedModel[]> {
      try {
        // `gemini` is included here because its backend is AionCLI, a
        // multi-provider fork that can run any connected provider (not just
        // Google) - so it unions every provider exactly like wcore. Vendor
        // locked CLIs (claude, codex) stay scoped in the branch below.
        if (agentKey === 'wcore' || agentKey === 'gemini') {
          // wcore proxies every connected provider - union their curated text
          // models. The Curator already drops non-text kinds. Dedup by
          // `(providerId, id)`: a model id can legitimately appear under
          // multiple providers, but the SAME provider must not contribute a
          // duplicate id. The first connected provider that supplies a given
          // `(providerId, id)` wins - `listRegistryProviders` is ordered by
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
            // Enumerable CLI (Codex) - build straight from its CLI source.
            const source = deps.makeCliSource(cliKey);
            const registry = await modelsDevClient.getRegistry().catch(() => ({}) as ModelsDevRegistry);
            const { models } = await assembler.assemble([source], registry);
            return curator.curate(models);
          }
          // Non-enumerable CLI (e.g. Claude Code). When the underlying provider
          // is connected with its own API key, use the persisted, override-aware
          // catalog. When it is NOT connected - the common case for a CLI-login
          // user (a Claude Pro/Max subscription, no Anthropic API key) - the
          // picker used to come back EMPTY (#125). Synthesize the underlying
          // provider's model families straight from the models.dev registry (the
          // same keyless path cloud providers use), so Claude shows real models.
          const underlying = CLI_UNDERLYING_PROVIDER[cliKey];
          if (repo.getRegistryProvider(underlying)) {
            return applyOverrides(underlying, curator.curate(repo.getRegistryCatalog(underlying)));
          }
          const registry = await modelsDevClient.getRegistry().catch(() => ({}) as ModelsDevRegistry);
          const { models } = await assembler.assemble([new CloudRegistrySource(underlying, registry)], registry);
          return curator.curate(models);
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
 * that provider needs, each a non-empty string. A non-empty-presence check -
 * NOT a real cloud-SDK credential validation. A provider with no entry in
 * `CLOUD_REQUIRED_FIELDS` only needs a non-empty `fields` object.
 */
function hasRequiredCloudFields(providerId: ProviderId, fields: Record<string, string>): boolean {
  const required = CLOUD_REQUIRED_FIELDS[providerId];
  if (!required) return Object.keys(fields).length > 0;
  return required.every((name) => typeof fields[name] === 'string' && fields[name].trim().length > 0);
}

/**
 * Coerce a stored creds record into the shape `buildAndPersistCatalog` /
 * `ConnectionTester` expect. Recognizes the three persisted variants:
 * api-key (`{ key }`), cloud (`{ fields }`), and google-auth Gemini
 * (`{ useGoogleAuth: true }`).
 */
function toTestCreds(
  stored: Record<string, unknown>
): { key: string } | { fields: Record<string, string> } | { useGoogleAuth: true } {
  if (stored.useGoogleAuth === true) return { useGoogleAuth: true };
  if (typeof stored.key === 'string') return { key: stored.key };
  if (stored.fields && typeof stored.fields === 'object' && !Array.isArray(stored.fields)) {
    return { fields: stored.fields as Record<string, string> };
  }
  return { fields: {} };
}

// ─── Chat-start mapping ───────────────────────────────────────────────────────

/**
 * Map a new-registry `ProviderId` to the legacy `IProvider.platform` string
 * the main-process dispatch (`wcore/envBuilder.ts` `mapProvider()`,
 * `GeminiAgentManager`, ACP managers) recognizes. Mirrors what the deleted
 * Wave 3A `legacyModelConfigBridge` did - kept here so chat-start can keep
 * speaking the dispatcher's protocol without revising every consumer.
 */
const CHAT_START_PLATFORM: Partial<Record<ProviderId, string>> = {
  anthropic: 'anthropic',
  openai: 'openai',
  'google-gemini': 'gemini',
  'aws-bedrock': 'bedrock',
  vertex: 'gemini-vertex-ai',
  // The OpenAI-compatible long tail - all dispatched as the `openai` protocol
  // via their stored `baseUrl`. `mapProvider()` falls through to OpenAI for an
  // unknown platform string, so a plain `openai-compatible` label is honest
  // and reaches the right protocol.
  openrouter: 'openai-compatible',
  groq: 'openai-compatible',
  xai: 'openai-compatible',
  mistral: 'openai-compatible',
  cohere: 'openai-compatible',
  perplexity: 'openai-compatible',
  together: 'openai-compatible',
  fireworks: 'openai-compatible',
  cerebras: 'openai-compatible',
  replicate: 'openai-compatible',
  huggingface: 'openai-compatible',
  nvidia: 'openai-compatible',
  anyscale: 'openai-compatible',
  deepseek: 'openai-compatible',
  moonshot: 'openai-compatible',
  qwen: 'openai-compatible',
  baichuan: 'openai-compatible',
  lingyiwanwu: 'openai-compatible',
  'zhipu-glm': 'openai-compatible',
  minimax: 'openai-compatible',
  sakana: 'openai-compatible',
  stability: 'openai-compatible',
  deepgram: 'openai-compatible',
  assemblyai: 'openai-compatible',
  elevenlabs: 'openai-compatible',
  'flux-router': 'openai-compatible',
  'openai-compatible': 'openai-compatible',
  // Local Ollama daemon - dispatched as the OpenAI-compatible protocol against
  // its hardcoded loopback `/v1` endpoint, with no API key (keyless local).
  'ollama-local': 'openai-compatible',
  // Ollama Cloud - OpenAI-compatible against ollama.com with the user's key.
  // Without this entry chat-start returned `unsupported` and inference fell
  // back to api.openai.com (401). See #36.
  'ollama-cloud': 'openai-compatible',
  // ChatGPT subscription (OAuth) - dispatched as `openai-compatible` so the
  // legacy bridge's `v2:chatgpt-subscription` tag propagates onto the chat-start
  // model (via the `platformFor === 'openai-compatible'` legacy-match in
  // GuidModelSelector), where envBuilder re-routes it to the native
  // `--provider openai-chatgpt` (the engine owns chatgpt.com/backend-api and
  // reads the OAuth token from ~/.codex/auth.json). Without this entry
  // buildChatStartPayload returned `unsupported`, so resolveForChatStart failed
  // and the picker bounced the user to Settings - the model could never be
  // selected and the #243 engine routing was never reached (live-E2E gap).
  'chatgpt-subscription': 'openai-compatible',
  // Azure intentionally absent - the legacy dispatch has no Azure arm; a
  // future Azure chat-start will need its own dispatcher work.
};

/** Canonical base URL per provider. A user-saved custom URL overrides this. */
const CHAT_START_BASE_URL: Partial<Record<ProviderId, string>> = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com/v1',
  'google-gemini': 'https://generativelanguage.googleapis.com',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  xai: 'https://api.x.ai/v1',
  mistral: 'https://api.mistral.ai/v1',
  cohere: 'https://api.cohere.com/v1',
  perplexity: 'https://api.perplexity.ai',
  together: 'https://api.together.xyz/v1',
  fireworks: 'https://api.fireworks.ai/inference/v1',
  cerebras: 'https://api.cerebras.ai/v1',
  replicate: 'https://api.replicate.com/v1',
  huggingface: 'https://huggingface.co',
  nvidia: 'https://integrate.api.nvidia.com/v1',
  anyscale: 'https://api.endpoints.anyscale.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  // Moonshot/Kimi global platform. `.ai` is the international endpoint; the
  // mainland-China `.cn` host rejects international keys (and vice versa).
  moonshot: 'https://api.moonshot.ai/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  baichuan: 'https://api.baichuan-ai.com/v1',
  lingyiwanwu: 'https://api.lingyiwanwu.com/v1',
  'zhipu-glm': 'https://open.bigmodel.cn/api/paas/v4',
  // International MiniMax platform (`.io`); the mainland-China `api.minimax.chat`
  // host 401s international keys (and vice versa) - same split as Moonshot above.
  // Inference MUST use the same host the key was validated against (the probe in
  // providerEndpoints.ts also uses `.io`), or a key that connects fine then 401s
  // on the first message (#135).
  minimax: 'https://api.minimax.io/v1',
  sakana: 'https://api.sakana.ai/v1',
  stability: 'https://api.stability.ai/v1',
  deepgram: 'https://api.deepgram.com/v1',
  assemblyai: 'https://api.assemblyai.com/v2',
  elevenlabs: 'https://api.elevenlabs.io/v1',
  'flux-router': 'https://api.fluxrouter.ai/v1',
  // Hardcoded local Ollama OpenAI-compatible endpoint. Never user-overridable -
  // the keyless allowance is anchored to this fixed loopback host.
  'ollama-local': 'http://127.0.0.1:11434/v1',
  // Ollama Cloud OpenAI-compatible root (mirrors the pinned models probe in
  // providerEndpoints.ts). See #36.
  'ollama-cloud': 'https://ollama.com/v1',
};

/** Short human label per provider - shown in the home-picker button text. */
const CHAT_START_NAME: Partial<Record<ProviderId, string>> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  'google-gemini': 'Google Gemini',
  'aws-bedrock': 'AWS Bedrock',
  vertex: 'Google Vertex',
  'chatgpt-subscription': 'ChatGPT',
  openrouter: 'OpenRouter',
  groq: 'Groq',
  xai: 'xAI',
  mistral: 'Mistral',
  cohere: 'Cohere',
  perplexity: 'Perplexity',
  together: 'Together AI',
  fireworks: 'Fireworks AI',
  cerebras: 'Cerebras',
  replicate: 'Replicate',
  huggingface: 'Hugging Face',
  nvidia: 'NVIDIA',
  anyscale: 'Anyscale',
  deepseek: 'DeepSeek',
  moonshot: 'Moonshot',
  qwen: 'Qwen',
  baichuan: 'Baichuan',
  lingyiwanwu: 'Lingyi Wanwu',
  'zhipu-glm': 'Zhipu GLM',
  minimax: 'MiniMax',
  sakana: 'Sakana AI',
  stability: 'Stability AI',
  deepgram: 'Deepgram',
  assemblyai: 'AssemblyAI',
  elevenlabs: 'ElevenLabs',
  'flux-router': 'Flux Router',
  'openai-compatible': 'OpenAI Compatible',
  'ollama-local': 'Ollama (Local)',
  'ollama-cloud': 'Ollama (Cloud)',
};

/**
 * Build the chat-start payload for a curated model resolution.
 *
 * Returns one of three outcomes (Fix 9):
 *  - `{ kind: 'payload', payload }` - fully resolved.
 *  - `{ kind: 'unsupported' }` - no dispatcher arm for this provider.
 *  - `{ kind: 'undecryptable' }` - the provider row says it's connected, but
 *    the stored creds carry no usable key (corrupted ciphertext or a
 *    malformed record). The renderer routes this to a re-key prompt rather
 *    than the generic Open-Models redirect.
 */
type ChatStartBuildResult =
  | { kind: 'payload'; payload: IModelRegistryChatStartPayload }
  | { kind: 'unsupported' }
  | { kind: 'undecryptable' };

function buildChatStartPayload(
  providerId: ProviderId,
  modelId: string,
  creds: Record<string, unknown>
): ChatStartBuildResult {
  // Google-auth Gemini: a `useGoogleAuth: true` cred resolves to the legacy
  // `gemini-with-google-auth` platform string (Fix 6). No api-key check.
  const isGoogleAuthGemini = providerId === 'google-gemini' && creds.useGoogleAuth === true;

  const platform = isGoogleAuthGemini ? 'gemini-with-google-auth' : CHAT_START_PLATFORM[providerId];
  if (!platform) return { kind: 'unsupported' };

  const payload: IModelRegistryChatStartPayload = {
    id: providerId,
    providerId,
    name: CHAT_START_NAME[providerId] ?? providerId,
    platform,
    modelId,
    baseUrl: '',
    apiKey: '',
  };

  // Surface per-model protocol overrides (Fix 5).
  if (creds.protocols && typeof creds.protocols === 'object' && !Array.isArray(creds.protocols)) {
    payload.modelProtocols = creds.protocols as Record<string, string>;
  }

  // ── Google-auth Gemini ─────────────────────────────────────────────────
  if (isGoogleAuthGemini) {
    // No credential material in the payload - the dispatcher reads the OAuth
    // tokens from the main-process auth store.
    return { kind: 'payload', payload };
  }

  // ── ChatGPT subscription ───────────────────────────────────────────────
  if (providerId === 'chatgpt-subscription') {
    // Keyless, like Google-auth Gemini: no credential in the payload. The engine
    // reads the ChatGPT OAuth token from its own store (~/.codex/auth.json,
    // written by the desktop on sign-in) via `--provider openai-chatgpt`, so the
    // empty-key branch below (-> undecryptable) must NOT apply here (#243).
    return { kind: 'payload', payload };
  }

  // ── AWS Bedrock ────────────────────────────────────────────────────────
  if (providerId === 'aws-bedrock') {
    const fields = creds.fields;
    if (typeof fields === 'object' && fields !== null && !Array.isArray(fields)) {
      const f = fields as Record<string, unknown>;
      const region = typeof f.region === 'string' ? f.region : '';
      const bedrockAuth = creds.bedrockAuth === 'profile' ? 'profile' : 'access-key';

      if (bedrockAuth === 'profile') {
        const profile = typeof f.awsProfile === 'string' ? f.awsProfile : '';
        if (profile && region) {
          payload.bedrockConfig = { authMethod: 'profile', region, profile };
        }
      } else {
        const accessKeyId = typeof f.accessKeyId === 'string' ? f.accessKeyId : '';
        const secretAccessKey = typeof f.secretAccessKey === 'string' ? f.secretAccessKey : '';
        if (accessKeyId && secretAccessKey && region) {
          payload.bedrockConfig = { authMethod: 'accessKey', accessKeyId, secretAccessKey, region };
        }
      }
    }
    return { kind: 'payload', payload };
  }

  // ── Vertex / Azure - pass cloudFields through (Fix 8) ──────────────────
  if (providerId === 'vertex' || providerId === 'azure') {
    const fields = creds.fields;
    if (typeof fields === 'object' && fields !== null && !Array.isArray(fields)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields as Record<string, unknown>)) {
        if (typeof v === 'string') out[k] = v;
      }
      if (Object.keys(out).length > 0) payload.cloudFields = out;
    }
    return { kind: 'payload', payload };
  }

  // ── Standard API-key provider ──────────────────────────────────────────
  const apiKey = typeof creds.key === 'string' ? (creds.key as string) : '';
  const customBaseUrl = typeof creds.baseUrl === 'string' ? (creds.baseUrl as string) : '';
  const resolvedBaseUrl = customBaseUrl || CHAT_START_BASE_URL[providerId] || '';

  if (!apiKey) {
    // Keyless local backends (Ollama / LM Studio / llama.cpp) accept no API
    // key. Permit an empty key ONLY when the resolved base URL host is local -
    // a cloud provider with no key is still an `undecryptable` corrupt record
    // (the original Fix 9 behavior, unchanged for cloud).
    if (isLocalBaseUrl(resolvedBaseUrl)) {
      payload.apiKey = '';
      payload.baseUrl = resolvedBaseUrl;
      return { kind: 'payload', payload };
    }
    // The provider row is `connected` but the creds carry no key - a
    // corrupted record, not an unsupported provider (Fix 9).
    return { kind: 'undecryptable' };
  }

  payload.apiKey = apiKey;
  payload.baseUrl = resolvedBaseUrl;
  return { kind: 'payload', payload };
}

// ─── Main-process spawn-time secret resolution (audit C4/C5/C6) ──────────────────

/**
 * Decrypted creds a backend spawn needs, resolved in main from a binding handle.
 *
 * `apiKey` is `undefined` for an intentionally keyless local provider (Ollama /
 * LM Studio / llama.cpp - Finding 2). `undefined` means "this provider carries
 * NO credential": the merge must NOT fall back to a stale `model.apiKey`, and
 * the envBuilder simply omits `OPENAI_API_KEY` (a local daemon needs none). An
 * empty string is never used to signal keyless - it is indistinguishable from a
 * cloud provider whose key failed to resolve.
 */
export type SpawnSecrets = {
  apiKey: string | undefined;
  baseUrl: string;
  bedrockConfig?: IModelRegistryChatStartPayload['bedrockConfig'];
};

/** A binding handle: the non-secret `(provider, account, model)` identity. */
export type SpawnHandle = { providerId: string; accountId?: string; modelId: string };

/** The slice of `ProviderRepository` the spawn-time resolver reads. */
type SpawnSecretRepo = Pick<ProviderRepository, 'getRegistryProvider' | 'getRegistryProviderCreds'>;

/**
 * Pure, repo-injected core of {@link resolveModelSecretsForSpawn} (exported for
 * tests). Returns `null` when the provider is not connected / its creds are
 * unreadable / it has no dispatcher arm. `accountId` is threaded for Phase 1b
 * (when the repo gains an account dimension); in Phase 1a only the implicit
 * `'default'` account exists, so the lookup is account-agnostic for now.
 */
export function resolveSpawnSecretsFromRepo(repo: SpawnSecretRepo, handle: SpawnHandle): SpawnSecrets | null {
  const providerId = handle.providerId as ProviderId;
  if (!repo.getRegistryProvider(providerId)) return null;
  const stored = repo.getRegistryProviderCreds(providerId);
  if (stored.status !== 'ok') return null;
  const result = buildChatStartPayload(providerId, handle.modelId, stored.creds);
  if (result.kind !== 'payload') return null;
  const p = result.payload;
  // A keyless local provider (empty key resolved against a loopback base URL)
  // carries NO credential. Represent that as `undefined` - NOT `''` - so the
  // merge below never falls back to a stale legacy `model.apiKey` (Finding 2).
  const apiKey = p.apiKey === '' && isLocalBaseUrl(p.baseUrl) ? undefined : p.apiKey;
  return {
    apiKey,
    baseUrl: p.baseUrl,
    ...(p.bedrockConfig ? { bedrockConfig: p.bedrockConfig } : {}),
  };
}

/**
 * Resolve the decrypted spawn secrets for a binding handle, in the MAIN process
 * at dispatch time (audit C4/C5). Resolution runs fresh on every call, so a
 * re-keyed provider is picked up on the next turn (late resolution).
 */
export async function resolveModelSecretsForSpawn(handle: SpawnHandle): Promise<SpawnSecrets | null> {
  try {
    const repo = _repo ?? new ProviderRepository((await getDatabase()).getDriver());
    return resolveSpawnSecretsFromRepo(repo, handle);
  } catch {
    return null;
  }
}

/**
 * Pure merge of resolved secrets onto a model binding (exported for tests). A
 * `null` resolution leaves the model unchanged - so a legacy `model.config` row
 * that is not in the registry keeps its own `apiKey` (back-compat).
 */
export function mergeSpawnSecrets<T extends TProviderWithModel>(model: T, secrets: SpawnSecrets | null): T {
  // `secrets === null` = no registry resolution at all (a legacy `model.config`
  // row that isn't in the registry); keep the model's own creds untouched.
  if (!secrets) return model;
  // A non-null resolution is authoritative. `secrets.apiKey === undefined` is
  // the explicit "intentionally keyless local provider" signal (Finding 2): the
  // resolved provider carries NO credential, so the merge must clear the key
  // (empty) rather than inherit a stale legacy `model.apiKey`. A resolved STRING
  // key (cloud / custom provider) is used verbatim.
  const apiKey = secrets.apiKey ?? '';
  return {
    ...model,
    apiKey,
    baseUrl: secrets.baseUrl || model.baseUrl,
    ...(secrets.bedrockConfig ? { bedrockConfig: secrets.bedrockConfig } : {}),
  };
}

/**
 * Hydrate a conversation's model binding with its decrypted spawn secrets, in
 * main, just before spawning the backend (audit C4/C5/C6). The persisted
 * conversation blob and the renderer carry only the NON-SECRET handle - the key
 * is resolved here and lives only in the returned object, never persisted and
 * never sent to the renderer. Resolution is per-call, so two concurrent chats
 * each get their own key with no shared global state in this path.
 */
/**
 * Extract the canonical registry providerId from the `v2:<id>` bridge tag a
 * legacy-mirrored binding carries. After `legacyModelConfigBridge` collapses
 * `platform` to `openai-compatible` and assigns a random-uuid `id`, this tag is
 * the ONLY surviving carrier of the real provider id.
 */
function bridgeProviderId(model: TProviderWithModel): string | undefined {
  const tag = (model as unknown as Record<string, unknown>).__waylandModelRegistryBridge;
  if (typeof tag === 'string' && tag.startsWith('v2:')) {
    const id = tag.slice('v2:'.length);
    if (id) return id;
  }
  return undefined;
}

export async function hydrateModelForSpawn<T extends TProviderWithModel>(model: T): Promise<T> {
  // A legacy-mirrored binding (Flux, Sakana, OpenRouter, ...) collapses `platform`
  // to `openai-compatible` and stores a random-uuid `id`; the canonical registry
  // providerId survives ONLY in the `v2:<id>` bridge tag. Resolving by `model.id`
  // misses the registry, so the provider's base URL is never applied and the engine
  // falls back to api.openai.com with a valid non-OpenAI key -> 401. Resolve by the
  // bridge tag first (this generalizes the prior Flux-only special-case).
  const bridgeId = bridgeProviderId(model);
  const providerId = isFluxModelId(model.useModel) ? FLUX_PROVIDER_ID : (bridgeId ?? model.id);
  const secrets = await resolveModelSecretsForSpawn({
    providerId,
    accountId: model.accountId ?? DEFAULT_ACCOUNT_ID,
    modelId: model.useModel,
  });
  const merged = mergeSpawnSecrets(model, secrets);
  // Safety net: if no base URL resolved but the bridge tag names a provider with a
  // known canonical base URL, apply it so an openai-compatible key is never shipped
  // to api.openai.com (covers a binding whose registry row is absent/legacy).
  if (!merged.baseUrl && bridgeId) {
    const canonicalBaseUrl = CHAT_START_BASE_URL[bridgeId as ProviderId];
    if (canonicalBaseUrl) return { ...merged, baseUrl: canonicalBaseUrl };
  }
  return merged;
}

// ─── IPC registration ─────────────────────────────────────────────────────────

let _repo: ProviderRepository | null = null;
/**
 * The production `ModelRegistryHandlers` instance, captured at `initModelRegistryIpc`
 * time so the post-upgrade catalog refresh can call `refresh()` with the real
 * `modelsDevClient` + `makeApiSource` deps. `null` before init.
 */
let _handlers: ModelRegistryHandlers | null = null;

/** The auto-refresh scheduler singleton, created at `initModelRegistryIpc` time. */
let _scheduler: ModelRefreshScheduler | null = null;

/**
 * The Provider Catalog store singleton (T3.3): the ~100 connectable catalog
 * PROVIDERS (distinct from the per-provider model registry above). Created at
 * `initModelRegistryIpc` time over the production `ModelsDevClient` for additive
 * metadata enrichment; the bundled vendored catalog is always the routing
 * authority + fail-safe floor.
 */
let _providerCatalogStore: ProviderCatalogStore | null = null;

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
      test: (providerId, creds, customBaseUrl?: string) => connectionTester.test(providerId, creds, customBaseUrl),
    },
    modelsDevClient: {
      getRegistry: () => modelsDevClient.getRegistry(),
    },
    makeApiSource: (providerId, apiKey, baseUrl) => new ApiProviderSource(providerId, apiKey, baseUrl),
    makeCliSource: (agentKey) => new CliAgentSource(agentKey),
    // Refresh-orchestration collaborators for `refreshAllOnce`: the legacy
    // `model.config` mirror (awaited so the toast can't precede it), the live
    // picker-invalidation emitter, and the success-only freshness stamp.
    mirror: (providerId) => (_repo ? mirrorConnectOrRekey(_repo, providerId) : Promise.resolve()),
    emitListChanged: () => ipcBridge.modelRegistry.listChanged.emit(),
    setLastRefreshedAt: (value) => setLastRefreshedAt(value),
    // Keyless `ollama-local` refreshes from a live daemon probe, never from
    // `buildAndPersistCatalog` (Finding 1). A down/unreachable daemon resolves
    // to `{ running:false }`, which the refresh path treats as "leave the
    // existing catalog untouched" rather than wiping it.
    probeOllama: () => probeOllamaDaemon(),
  };
}

/**
 * Probe the local Ollama daemon's `/api/tags`. Returns `{ running, models }`;
 * a down daemon, non-2xx, malformed body, or timeout resolves to
 * `{ running:false, models:[] }`. Never throws. Mirror of `detect.probeOllama`
 * but kept here to avoid a `detect -> modelRegistryIpc` import cycle.
 */
async function probeOllamaDaemon(): Promise<OllamaProbe> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${OLLAMA_LOCAL_BASE_URL.replace(/\/v1$/, '')}/api/tags`, { signal: controller.signal });
    if (!res.ok) return { running: false, models: [] };
    const body = (await res.json()) as unknown;
    if (!body || typeof body !== 'object') return { running: false, models: [] };
    const raw = (body as { models?: unknown }).models;
    if (!Array.isArray(raw)) return { running: true, models: [] };
    const models = raw
      .map((m) => (m && typeof m === 'object' ? (m as { name?: unknown }).name : undefined))
      .filter((n): n is string => typeof n === 'string' && n.length > 0);
    return { running: true, models };
  } catch {
    return { running: false, models: [] };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One-time legacy-config → model-registry migration (Packet 3B). Runs once,
 * guarded by a `ProcessConfig` flag. On any subsequent boot the migration
 * is a no-op. Failures are caught and logged inside the migration - they
 * never block IPC registration.
 *
 * Wave-3 cross-audit: the migration writes per-row provider + catalog inside
 * a single SQLite transaction (Fix 3) and also writes per-model visibility
 * overrides (Fix 4 / Fix 14). We wire the production repo's `transaction`,
 * `countRegistryCatalog`, and `setRegistryOverride` methods through to the
 * structural `MigrationRepo` slice.
 *
 * Wave-4 ship-gate Fix A1: this function MUST only be called after
 * `app.whenReady()` resolves AND `safeStorage.isEncryptionAvailable()` is
 * true. The migration writes encrypted creds through `safeStorage.encryptString`,
 * which throws when `app` is not yet ready or when the OS keychain backend is
 * absent. A pre-`whenReady` call would fail every row, the migration would
 * (correctly) NOT mark itself complete, and every subsequent boot would retry
 * and fail identically - stranding upgrading users with an empty registry.
 * This function returns early (without setting the completion flag) when
 * `safeStorage` is unavailable so the next boot can retry once the backend is
 * ready.
 */
async function runStartupMigration(repo: ProviderRepository): Promise<void> {
  if (!isEncryptionAvailable()) {
    console.warn(
      '[modelRegistry] Skipping legacy-config migration - safeStorage is not yet available (' +
        'app not ready or OS keychain unavailable). Will retry on next boot.'
    );
    return;
  }
  await runLegacyModelConfigMigration({
    store: {
      get: (key) => ProcessConfig.get(key as never) as Promise<unknown>,
      set: async (key, value) => {
        // `ProcessConfig.set` is typed against the full `IConfigStorageRefer`
        // refer; the migration's narrow union of keys is a strict subset.
        await ProcessConfig.set(key as never, value as never);
      },
    },
    repo: {
      getRegistryProvider: (providerId) => repo.getRegistryProvider(providerId),
      upsertRegistryProvider: (params) => repo.upsertRegistryProvider(params),
      replaceRegistryCatalog: (providerId, models) => repo.replaceRegistryCatalog(providerId, models),
      countRegistryCatalog: (providerId) => repo.countRegistryCatalog(providerId),
      setRegistryOverride: (providerId, modelId, enabled) => repo.setRegistryOverride(providerId, modelId, enabled),
      transaction: (fn) => repo.transaction(fn),
    },
  });
}

/**
 * Register the `modelRegistry` IPC handlers on the bridge. Registered alongside
 * the legacy `providersIpc` in the main-process IPC setup; the two namespaces
 * use distinct channel strings and never collide.
 *
 * Wave-4 ship-gate Fixes A1 + B1:
 *  - Handler registration is SYNCHRONOUS once `buildProductionDeps()` resolves
 *    (it only opens the DB - it does NOT touch `safeStorage`). The renderer's
 *    home picker may call `curatedForAgent` before the migration runs and
 *    still gets a real (possibly empty) response, never a missing-channel
 *    error.
 *  - The one-time legacy-config migration is deferred to `app.whenReady()`
 *    because it calls `safeStorage.encryptString`, which requires Electron's
 *    `app` to be ready AND a working OS keychain backend. A pre-`whenReady`
 *    migration would fail every row, leaving the upgrade stuck across boots.
 */
export async function initModelRegistryIpc(): Promise<void> {
  const deps = await buildProductionDeps();
  const h = createModelRegistryHandlers(deps);
  // Capture the production handlers so the post-upgrade catalog refresh
  // (`runPostUpgradeCatalogRefresh`) can reuse `refresh()` - it needs the
  // real `modelsDevClient` + `makeApiSource` deps, not just `repo`.
  _handlers = h;

  ipcBridge.modelRegistry.detectKeys.provider(() => h.detectKeys());
  // Wave 3 Fix 13 - wrap connect/rekey/disconnect with a v2 write-through
  // bridge into `model.config` so legacy consumers
  // (WCoreModelSelector / GeminiModelSelector / AcpModelSelector /
  // EditModeModal / AddPlatformModal) still see new connections until they
  // are refactored. The bridge is a no-op for cloud + CLI-only providers.
  ipcBridge.modelRegistry.connect.provider((payload) =>
    connectModelRegistryProvider(payload.providerId, payload.creds)
  );
  ipcBridge.modelRegistry.testConnection.provider((payload) => h.testConnection(payload));
  ipcBridge.modelRegistry.list.provider(() => h.list());
  ipcBridge.modelRegistry.getCatalog.provider((payload) => h.getCatalog(payload));
  ipcBridge.modelRegistry.toggleModel.provider((payload) => h.toggleModel(payload));
  ipcBridge.modelRegistry.refresh.provider(async (payload) => {
    const result = await h.refresh(payload);
    if (result.ok && _repo) void mirrorConnectOrRekey(_repo, payload.providerId);
    // Live-update any open picker / the Models page after a manual refresh.
    if (result.ok) ipcBridge.modelRegistry.listChanged.emit();
    return result;
  });
  ipcBridge.modelRegistry.disconnect.provider(async (payload) => {
    const result = await h.disconnect(payload);
    if (result.ok) void mirrorDisconnect(payload.providerId);
    return result;
  });
  ipcBridge.modelRegistry.rekey.provider(async (payload) => {
    const result = await h.rekey(payload);
    if (result.ok && _repo) void mirrorConnectOrRekey(_repo, payload.providerId);
    // Same as connect: revalidate open pickers so a re-keyed provider's models
    // refresh immediately instead of waiting for a reload.
    ipcBridge.modelRegistry.listChanged.emit();
    return result;
  });
  ipcBridge.modelRegistry.curatedForAgent.provider((payload) => h.curatedForAgent(payload));
  ipcBridge.modelRegistry.resolveForChatStart.provider((payload) => h.resolveForChatStart(payload));

  // ── Provider catalog (T3.3): the ~100 connectable catalog PROVIDERS ─────────
  // A separate concept from the per-provider model registry above. The vendored
  // bundled catalog is the routing authority + fail-safe floor; models.dev only
  // contributes additive per-provider model metadata (never endpoint URLs). The
  // handler kicks off a best-effort enrichment refresh and is defensive: any
  // error returns the bundled baseline rather than throwing.
  _providerCatalogStore = new ProviderCatalogStore({
    registrySource: { getRegistry: () => new ModelsDevClient().getRegistry() },
  });
  void _providerCatalogStore.refresh().catch(() => {});
  ipcBridge.modelRegistry.getProviderCatalog.provider(() => getProviderCatalog());

  // ── Automatic refresh: scheduler + the global "Refresh models" surface ──────
  _scheduler = new ModelRefreshScheduler({
    runRefresh: () => h.refreshAllOnce(),
    getLastRefreshedAt,
    getAutoRefresh,
  });
  ipcBridge.modelRegistry.refreshAll.provider((payload) => _scheduler!.refreshAll(payload?.reason ?? 'manual'));
  ipcBridge.modelRegistry.getRefreshState.provider(() => Promise.resolve(_scheduler!.getState()));
  ipcBridge.modelRegistry.getAutoRefresh.provider(() => getAutoRefresh());
  ipcBridge.modelRegistry.setAutoRefresh.provider(async ({ value }) => {
    await setAutoRefresh(value);
    // Apply immediately: arming starts the poll + launch-if-stale; disabling
    // stops the interval (the manual button still works regardless).
    if (value) void _scheduler!.start();
    else _scheduler!.stop();
    return { ok: true };
  });

  // Wave-4 ship-gate Fix A1 - defer the one-time legacy-config migration to
  // `app.whenReady()`. `safeStorage.encryptString` (which the migration uses
  // via the repo's `upsertRegistryProvider`) throws when `app` is not ready,
  // so running the migration synchronously here strands every legacy row
  // across boots. `app.whenReady()` resolves immediately when `app.isReady()`
  // is already true, so this is also correct on subsequent inits.
  scheduleStartupMigration();
}

/** True after the deferred migration has executed (or been scheduled to run only once). */
let _migrationScheduled = false;

/**
 * Catalog data-version baked into this build. Bumped whenever
 *  - the Curator's eligibility logic changes (excludes more / fewer ids), or
 *  - `CatalogModel` gains a derived field (e.g. `tags`).
 *
 * On boot, if the persisted `migration.modelRegistryCatalogDataVersion` is
 * less than this constant, every connected provider's catalog is refreshed
 * once and the cursor is bumped. See `runPostUpgradeCatalogRefresh`.
 *
 * Version history:
 *  - 0 (implicit) - pre-polish-pass; old catalog rows have no `tags` and were
 *    curated with the old "every unmatched id is a singleton family" rule.
 *  - 1            - polish pass adds usage tags + smarter Curator (legacy
 *    exclusion + recency floor + dedup). One-time refresh re-derives both.
 */
export const CATALOG_DATA_VERSION = 1;

/**
 * Schedule the one-time legacy-config migration to run once `app.whenReady()`
 * resolves. Wave-4 ship-gate Fix A1. Idempotent - multiple calls schedule only
 * one run. Errors inside the migration are logged but never propagate.
 *
 * After the legacy migration succeeds, also runs the post-upgrade catalog
 * refresh (`runPostUpgradeCatalogRefresh`) so the cursor migration sees a
 * fully-populated set of providers - both legacy-migrated and pre-existing.
 */
function scheduleStartupMigration(): void {
  if (_migrationScheduled) return;
  _migrationScheduled = true;
  // In the standalone (non-Electron) server runtime the `electron` module is
  // undefined, so `app` is undefined and `app.whenReady()` would throw. There
  // is no `whenReady` gate to wait on there - storage is already initialized
  // before the registry IPC is wired - so resolve immediately. The Electron
  // path keeps deferring to `app.whenReady()` exactly as before.
  const ready: Promise<unknown> =
    typeof app?.whenReady === 'function' ? app.whenReady() : Promise.resolve();
  ready
    .then(async () => {
      if (!_repo) return;
      try {
        await runStartupMigration(_repo);
      } catch (error) {
        // The migration is itself defensive - this catch is the belt-and-braces
        // outer guard so a thrown migration cannot crash the main process.
        console.warn('[modelRegistry] Legacy-config migration failed:', error);
      }
      // Remove orphaned pre-registry duplicate rows (the "Two Geminis" the
      // legacy->registry migration leaves behind). Runs after the legacy
      // migration so any freshly-mirrored bridge rows are visible, and uses
      // `ProcessConfig` directly - it only edits `model.config`, no creds.
      try {
        await runOrphanProviderDedup({
          get: (key) => ProcessConfig.get(key as never) as Promise<unknown>,
          set: async (key, value) => {
            await ProcessConfig.set(key as never, value as never);
          },
        });
      } catch (error) {
        console.warn('[modelRegistry] Orphan-provider dedup failed:', error);
      }
      let postUpgradeSwept = false;
      try {
        // The post-upgrade refresh is independent of the legacy migration -
        // it runs whether or not the legacy step did any work. A failure of
        // one provider's refresh does not block the others.
        postUpgradeSwept = await runPostUpgradeCatalogRefresh();
      } catch (error) {
        console.warn('[modelRegistry] Post-upgrade catalog refresh failed:', error);
      }
      // If the post-upgrade sweep just refreshed every provider, stamp the
      // freshness clock so the auto-refresh scheduler's launch-if-stale check
      // sees a fresh catalog and does NOT immediately re-fetch them all (audit
      // MED: coordinate with the pre-existing boot sweep). Then start the
      // scheduler - it self-arms only when auto-refresh is enabled.
      if (postUpgradeSwept) await setLastRefreshedAt(Date.now()).catch(() => {});
      if (_scheduler) void _scheduler.start();
    })
    .catch((error) => {
      console.warn('[modelRegistry] app.whenReady() rejected before migration could run:', error);
    });
}

/**
 * One-time catalog refresh after a build that changes how catalogs are
 * derived. Iterates every connected provider in the registry and calls
 * `refresh()` (the existing IPC path) so their persisted `CatalogModel[]`
 * rows are re-assembled with the new Curator + assembler logic (legacy
 * exclusion, recency floor, dedup, `tags`).
 *
 * Idempotent - gated by the persisted `migration.modelRegistryCatalogDataVersion`
 * cursor. If the cursor is already at or above `CATALOG_DATA_VERSION`, returns
 * immediately. After every provider is refreshed (whether or not each call
 * succeeded), the cursor is bumped so the next boot skips this work entirely.
 *
 * Defensive - a single provider's refresh throwing does NOT abort the others
 * and does NOT prevent the cursor from advancing. Stale data on one provider
 * is better than a stuck migration that re-attempts on every boot.
 *
 * Exported (via the test wrapper below) so unit tests can assert the cursor
 * behavior without spinning up the Electron `app` lifecycle.
 */
async function runPostUpgradeCatalogRefresh(): Promise<boolean> {
  if (!_repo || !_handlers) return false;
  // Whether this boot's cursor is behind - i.e. the sweep will actually
  // re-refresh every provider (vs. a no-op on an already-migrated boot). The
  // caller stamps the freshness clock only when this is true.
  const cursor = await ProcessConfig.get('migration.modelRegistryCatalogDataVersion');
  const willSweep = !(typeof cursor === 'number' && cursor >= CATALOG_DATA_VERSION);
  await _runPostUpgradeCatalogRefresh(_repo, _handlers, {
    get: async () => {
      const v = await ProcessConfig.get('migration.modelRegistryCatalogDataVersion');
      return typeof v === 'number' ? v : undefined;
    },
    set: async (v) => {
      await ProcessConfig.set('migration.modelRegistryCatalogDataVersion', v);
    },
  });
  return willSweep;
}

// ─── Auto-refresh persistence (W0 seam) ─────────────────────────────────────────
// Typed get/set wrappers over `ProcessConfig` for the three `models.*` keys the
// scheduler (W1) + Models settings (W2) read and write. Same pattern as the
// `migration.modelRegistryCatalogDataVersion` cursor above.

/** Last *successful* global-refresh timestamp (epoch ms), or `null` before any. */
export async function getLastRefreshedAt(): Promise<number | null> {
  const v = await ProcessConfig.get('models.lastRefreshedAt');
  return typeof v === 'number' ? v : null;
}

/** Persist the success-only freshness timestamp (epoch ms). */
export async function setLastRefreshedAt(value: number): Promise<void> {
  await ProcessConfig.set('models.lastRefreshedAt', value);
}

/** Model ids already surfaced in a "new models" toast (empty before any). */
export async function getAnnouncedModelIds(): Promise<string[]> {
  const v = await ProcessConfig.get('models.announcedModelIds');
  return Array.isArray(v) ? v : [];
}

/** Persist the de-dup set of already-announced model ids. */
export async function setAnnouncedModelIds(value: string[]): Promise<void> {
  await ProcessConfig.set('models.announcedModelIds', value);
}

/** Whether automatic background refresh is enabled. Defaults to `true`. */
export async function getAutoRefresh(): Promise<boolean> {
  const v = await ProcessConfig.get('models.autoRefresh');
  return typeof v === 'boolean' ? v : true;
}

/** Persist the auto-refresh master switch. */
export async function setAutoRefresh(value: boolean): Promise<void> {
  await ProcessConfig.set('models.autoRefresh', value);
}

/**
 * The cursor-aware refresh loop, factored out so tests can drive it with a
 * fake handlers + cursor store. Pure logic - no module-level state, no IPC,
 * no `app.whenReady()`.
 *
 * Iterates every registered provider, calling `handlers.refresh` for each.
 * A single provider's failure is logged but does NOT abort the sweep and
 * does NOT prevent the cursor advance. After the sweep, sets the cursor to
 * `CATALOG_DATA_VERSION`.
 */
export async function _runPostUpgradeCatalogRefresh(
  repo: Pick<ProviderRepository, 'listRegistryProviders'>,
  handlers: Pick<ModelRegistryHandlers, 'refresh'>,
  cursor: {
    get: () => Promise<number | undefined>;
    set: (value: number) => Promise<void>;
  }
): Promise<void> {
  const persisted = (await cursor.get().catch((): number | undefined => undefined)) ?? 0;
  const allProviders = repo.listRegistryProviders();

  // Two reasons to sweep on this boot:
  //  1. Cursor below CATALOG_DATA_VERSION - one-time post-upgrade rebuild.
  //  2. Any provider sits in `error/unrecognized` - typically the runtime
  //     safeStorage key rotated since last boot (dev-mode), leaving every
  //     decrypt failing and the row stamped error on the prior sweep. Re-
  //     running refresh now lets `tryRecoverFromDiscoveredKey` silently
  //     re-import from an env key the OS still exposes, so the user doesn't
  //     have to click Fix on every connected provider.
  const needsUpgrade = persisted < CATALOG_DATA_VERSION;
  const staleErrored = allProviders.filter((p) => p.state === 'error' && p.error === 'unrecognized');
  if (!needsUpgrade && staleErrored.length === 0) return;

  const providers = needsUpgrade ? allProviders : staleErrored;
  for (const provider of providers) {
    try {
      await handlers.refresh({ providerId: provider.providerId });
    } catch (error) {
      // One provider's failure must never block the rest of the refresh
      // sweep or the cursor bump.
      console.warn(`[modelRegistry] Post-upgrade refresh failed for provider ${provider.providerId}:`, error);
    }
  }

  // Only advance the cursor on a real upgrade pass. A stale-error sweep is
  // recovery work that doesn't reflect a data-version change - leaving the
  // cursor where it was keeps the version bookkeeping honest.
  if (needsUpgrade) {
    try {
      await cursor.set(CATALOG_DATA_VERSION);
    } catch (error) {
      // Failing to persist the cursor means the next boot will re-run the
      // refresh - that's wasteful but never wrong. Log and move on.
      console.warn('[modelRegistry] Failed to persist catalog data-version cursor:', error);
    }
  }
}

/** The model-registry repository instance, available after `initModelRegistryIpc`. */
export function getModelRegistryRepository(): ProviderRepository | null {
  return _repo;
}

/**
 * Resolve the provider catalog for the `modelRegistry.getProviderCatalog` IPC
 * contract: the ~100 connectable catalog providers, sorted by `displayName`,
 * with `baseUrl` / `apiPath` / `envVar` always from the vendored bundled
 * catalog (the routing authority). Additive models.dev metadata may decorate
 * entries but the returned array satisfies the frozen `CatalogProviderEntry[]`
 * shape (extra metadata keys are structurally compatible).
 *
 * Defensive: if the store is missing (pre-init) or anything throws, falls back
 * to the bundled baseline floor and NEVER throws.
 */
export async function getProviderCatalog(): Promise<CatalogProviderEntry[]> {
  try {
    return _providerCatalogStore ? _providerCatalogStore.getCatalog() : loadBaselineProviderCatalog();
  } catch {
    try {
      return loadBaselineProviderCatalog();
    } catch {
      return [];
    }
  }
}

/**
 * Connect (or re-key) a provider through the production model-registry handlers
 * - the SAME path the `modelRegistry.connect` IPC handler runs: it tests the
 * credentials, persists them to the OS keychain via `safeStorage`, builds and
 * stores the catalog, mirrors into the legacy `model.config`, and revalidates
 * any open model picker by emitting `listChanged`.
 *
 * Exposed so main-process flows that mint credentials themselves (e.g. the Flux
 * one-click OAuth onboarding) can reuse the exact connect+persist+mirror logic
 * instead of duplicating it. Returns `{ ok: false, error: 'unknown' }` if called
 * before `initModelRegistryIpc` has captured the production handlers.
 *
 * @param providerId The registry provider to connect (e.g. `'flux-router'`).
 * @param creds The credentials to persist (bare key, fields, or discovery flag).
 */
export async function connectModelRegistryProvider(
  providerId: ProviderId,
  creds: IModelRegistryCreds
): Promise<IModelRegistryConnectResult> {
  if (!_handlers) {
    console.error('[modelRegistry] connectModelRegistryProvider called before IPC init');
    return { ok: false, error: 'unknown' };
  }
  // Detect a FIRST-TIME Flux connection before the upsert so a later rekey - or a
  // reconnect after the user turned routing off (#160) - never silently re-enables
  // routing. Connecting Flux Router at all IS the intent to route through it.
  // Gate on "no CONNECTED row", not "no row at all": the connect handler upserts
  // an `error`-state row when the first attempt fails (transient catalog/network
  // blip), so keying off mere existence would treat the successful RETRY as
  // non-fresh and never enable routing - dropping the user back on a tiny local
  // model. This mirrors the headless importEnvKeys guard (skip only when already
  // connected); the #160 promise holds because a connected row is still skipped.
  const priorFlux = providerId === FLUX_PROVIDER_ID ? _repo?.getRegistryProvider(providerId) : undefined;
  const isFreshFluxConnect = providerId === FLUX_PROVIDER_ID && !!_repo && priorFlux?.state !== 'connected';
  const result = await _handlers.connect({ providerId, creds });
  if (result.ok && _repo) void mirrorConnectOrRekey(_repo, providerId);
  // Enable Flux routing once on first connect so the home/chat default resolves
  // flux-auto instead of a tiny local model (e.g. Ollama smollm2:135m) that
  // happens to sort first in the safe-default fallback. Mirrors the headless
  // env-import path (importEnvKeys); the fresh-connect guard preserves a user's
  // later decision to turn routing off.
  if (result.ok && isFreshFluxConnect) {
    try {
      await ProcessConfig.set('system.routeThroughFlux', true);
    } catch (routeError) {
      console.warn('[modelRegistry] Failed to enable Flux routing on first connect:', routeError);
    }
  }
  // Live-update any open picker / the Models page after a connect, the same way
  // the manual refresh handler does. On failure the provider's `error` state
  // must surface too, so emit always.
  ipcBridge.modelRegistry.listChanged.emit();
  return result;
}

/**
 * Read the NON-SECRET registry view for a single provider (state + model count
 * + connectedVia), or `null` when the provider is not in the registry.
 *
 * Exposed for the remote secret-write routes (remote-secure-config W1): after a
 * write-only connect they return `{ state, modelCount }` as status only - never
 * the key. Reuses the same `list()` projection the read-only Models page uses,
 * so the status is sourced from exactly one place. Returns `null` if called
 * before `initModelRegistryIpc` has captured the production handlers.
 */
export async function getModelRegistryProviderView(
  providerId: ProviderId
): Promise<IModelRegistryProviderView | null> {
  if (!_handlers) return null;
  const list = await _handlers.list();
  return list.find((p) => p.providerId === providerId) ?? null;
}

/**
 * Register a ChatGPT subscription connected via OAuth (`chatgpt-subscription`).
 *
 * This provider CANNOT go through `connectModelRegistryProvider`: a ChatGPT
 * subscription access token is rejected by `api.openai.com`, and the ChatGPT
 * backend (`chatgpt.com/backend-api`) exposes no `/v1/models` listing - so the
 * standard HTTP-probe + models.dev catalog build would both fail. Like the
 * cloud / google-auth providers, connection is verified by the OAuth module that
 * minted the token, so we skip the probe and seed a STATIC catalog of the model
 * ids the Responses path accepts.
 *
 * The access token is stored on the registry row as `creds.key` and the ChatGPT
 * backend base as `creds.baseUrl` so the legacy bridge writes an
 * `openai-compatible` row pointing at the backend. The custom Responses headers
 * + body translation are NOT wired here - see the inference seam documented in
 * `chatgptOAuth.ts` (registerChatGptSubscription).
 *
 * Returns `{ ok: false, error: 'unknown' }` if called before the registry repo
 * is initialized.
 */
export function connectChatGptSubscriptionProvider(params: {
  accessToken: string;
  baseUrl: string;
}): IModelRegistryConnectResult {
  if (!_repo) {
    console.error('[modelRegistry] connectChatGptSubscriptionProvider called before IPC init');
    return { ok: false, error: 'unknown' };
  }
  try {
    _repo.upsertRegistryProvider({
      providerId: CHATGPT_SUBSCRIPTION_PROVIDER_ID,
      connectedVia: 'ChatGPT subscription',
      state: 'connected',
      creds: { key: params.accessToken, baseUrl: params.baseUrl },
    });
    // Write a static placeholder immediately so the picker is never empty during
    // the live fetch, then upgrade to the account's real model list in the
    // background (connect must stay sync for the IPC contract).
    _repo.replaceRegistryCatalog(CHATGPT_SUBSCRIPTION_PROVIDER_ID, buildChatGptSubscriptionCatalog());
    void mirrorConnectOrRekey(_repo, CHATGPT_SUBSCRIPTION_PROVIDER_ID);
    ipcBridge.modelRegistry.listChanged.emit();
    void buildChatGptSubscriptionCatalogLive(params.accessToken).then((models) => {
      try {
        _repo?.replaceRegistryCatalog(CHATGPT_SUBSCRIPTION_PROVIDER_ID, models);
        ipcBridge.modelRegistry.listChanged.emit();
      } catch {
        // Keep the static placeholder if the live upgrade can't be persisted.
      }
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

/**
 * Test-only: invoke the migration directly, bypassing the `app.whenReady()`
 * gate. The production path is `scheduleStartupMigration()`. Exposed so unit
 * tests can assert the defer-when-safeStorage-unavailable behavior without
 * spinning up Electron's `app` lifecycle.
 */
export async function _runStartupMigrationForTests(repo: ProviderRepository): Promise<void> {
  await runStartupMigration(repo);
}
