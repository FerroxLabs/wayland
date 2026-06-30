/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TProviderWithModel } from '@/common/config/storage';
import { isLocalBaseUrl, isOpenAIHost } from '@/common/utils/urlValidation';
import { CHATGPT_SUBSCRIPTION_PROVIDER_ID } from '@process/providers/catalog/chatgptSubscriptionModels';
import { loadBaselineProviderCatalog } from '@process/providers/catalog/providerCatalogStore';
import { PROVIDER_ENV_VARS } from '@process/providers/detection/KeyDiscovery';
import type { ProviderId } from '@process/providers/types';
import { getEnhancedEnv } from '@process/utils/shellEnv';

/**
 * The wcore providers Wayland configures natively (each carries its own auth +
 * base-url handling in {@link buildSpawnConfig}). `xai` is the engine's native
 * Grok provider (0.12.2+): it owns api.x.ai as its base URL and refreshes a Grok
 * OAuth bearer itself, so it must be spawned as `--provider xai` (not the
 * generic openai+base-url path) to get the token refresh + the grok-4.3
 * stop-param fix.
 */
type NativeWCoreProvider = 'anthropic' | 'openai' | 'bedrock' | 'vertex' | 'xai' | 'openai-chatgpt';

/**
 * The engine `--provider` value for a ChatGPT subscription connected via OAuth
 * (#243). The engine drives inference against the ChatGPT backend
 * (`chatgpt.com/backend-api`) and reads the OAuth token from `~/.codex/auth.json`
 * (written by `writeCodexAuthFile` at sign-in), so the desktop must route this
 * provider to the engine's native slug instead of collapsing it to
 * `--provider openai` (which presents the OAuth bearer to api.openai.com -> a
 * non-working spawn that errors on send). The provider owns the backend host, so
 * NO `--base-url` and NO key env var are emitted (see {@link buildSpawnConfig}).
 */
const CHATGPT_SUBSCRIPTION_ENGINE_PROVIDER = 'openai-chatgpt';

/**
 * A wcore `--provider` value. Either a {@link NativeWCoreProvider} literal or a
 * catalog provider id (a `providerCatalog.generated.json` slug). The branded
 * string keeps the union open without collapsing to bare `string`: native
 * literals still narrow in the `switch` below, while any catalog slug is
 * assignable. Mirrors `ProviderId` in `src/process/providers/types.ts`.
 *
 * COR-2/BL-2: before this, `mapProvider` could only ever return one of the four
 * native literals, so a catalog id could never reach `--provider` and every
 * catalog provider collapsed to `--provider openai --base-url <url>`. The engine
 * owns each catalog id's `base_url`/`api_path`/`env_var` in its bundled
 * `providers.toml`, so the desktop must pass the id through verbatim and set the
 * engine's expected scoped env var instead.
 */
type WCoreProvider = NativeWCoreProvider | (string & { readonly __brand?: 'catalog' });

/**
 * Lazily-built `catalogId -> envVar` map from the bundled provider catalog
 * (T0.2 {@link loadBaselineProviderCatalog}). Used to (a) detect that a provider
 * id is a real catalog id and (b) resolve the engine's expected scoped key env
 * var name (e.g. `novita-ai` -> `NOVITA_API_KEY`, `alibaba` -> `DASHSCOPE_API_KEY`).
 * Built once on first use; the bundled catalog is immutable at runtime.
 */
let catalogEnvVarByIdCache: ReadonlyMap<string, string> | null = null;
function catalogEnvVarById(): ReadonlyMap<string, string> {
  if (!catalogEnvVarByIdCache) {
    const map = new Map<string, string>();
    for (const entry of loadBaselineProviderCatalog()) {
      map.set(entry.id, entry.envVar);
    }
    catalogEnvVarByIdCache = map;
  }
  return catalogEnvVarByIdCache;
}

/**
 * The catalog id carried by a connected catalog provider, or `undefined` if the
 * model is not a catalog provider.
 *
 * Where the id lives (the crux of T3.5): `legacyModelConfigBridge` persists a
 * connected catalog provider as an `IProvider` whose `platform` collapses to
 * `'openai-compatible'` and whose `id` is a random uuid - the ONLY surviving
 * carrier of the catalog id is the bridge tag
 * `__waylandModelRegistryBridge: 'v2:<catalogId>'` (that tag is preserved
 * through `getMergedModelProviders`'s `...v` spread, so it reaches this spawn
 * path intact). We extract `<catalogId>` from that tag first.
 *
 * Forward-compat fallback: if a future connect path stores the catalog id
 * directly in `platform`, we accept that too.
 *
 * In both cases the candidate is validated against the bundled catalog - an id
 * that is not a real catalog provider returns `undefined` so the caller falls
 * back to the legacy native/openai path (never emitting a `--provider` the
 * engine cannot resolve).
 */
function catalogIdFor(model: TProviderWithModel): string | undefined {
  const catalog = catalogEnvVarById();

  const tag = (model as unknown as Record<string, unknown>).__waylandModelRegistryBridge;
  if (typeof tag === 'string' && tag.startsWith('v2:')) {
    const tagged = tag.slice('v2:'.length);
    if (tagged && catalog.has(tagged)) return tagged;
  }

  // Forward-compat: catalog id stored directly as the platform string.
  if (model.platform && catalog.has(model.platform)) return model.platform;

  return undefined;
}

/**
 * Engine-native providers (#177). The app persists these as generic
 * `openai-compatible` rows (their real base URL lives only in the model
 * registry, stripped from the legacy bridge row), so without this they collapse
 * to `--provider openai` and the engine presents the key to api.openai.com -> a
 * false 401 (the Perplexity symptom in #177).
 *
 * The bundled wcore (0.12.2) resolves each of these slugs natively from its own
 * baked provider catalog: passing `--provider <id>` lets the engine own the
 * base URL + scoped key (e.g. Perplexity -> api.perplexity.ai with
 * PERPLEXITY_API_KEY). Every slug here is accepted by the 0.12.2 binary as a
 * `--provider` value and has a canonical key env var in {@link PROVIDER_ENV_VARS}
 * (the single, models.dev-checked source of truth - reused so the two tables
 * can never diverge, which is the exact failure class behind #177).
 *
 * Generalizes the original one-off xai arm: xai stays in the set (same routing),
 * and the engine additionally refreshes a Grok OAuth bearer when one exists,
 * ignoring XAI_API_KEY in that case.
 */
const NATIVE_ENGINE_PROVIDER_IDS = [
  'xai',
  'perplexity',
  'openrouter',
  'groq',
  'mistral',
  'cohere',
  'deepseek',
  'together',
  'fireworks',
  'cerebras',
  'nvidia',
  // minimax is an Anthropic-wire native provider in the bundled engine (0.12.5):
  // `--provider minimax` -> api.minimax.io/anthropic with MINIMAX_API_KEY. Without
  // this it falls through to `--provider openai` and breaks (#135).
  'minimax',
] as const;
const NATIVE_ENGINE_PROVIDER_SET: ReadonlySet<string> = new Set(NATIVE_ENGINE_PROVIDER_IDS);

/**
 * The engine-native provider id for a model, or `undefined`. Mirrors
 * {@link catalogIdFor}: the id survives only in the `v2:<id>` registry bridge
 * tag (the legacy `platform` collapses to `openai-compatible`); the
 * `platform === '<id>'` arm is forward-compat for a future direct-platform
 * store. Validated against {@link NATIVE_ENGINE_PROVIDER_SET} so an unrecognized
 * id never reaches `--provider`.
 */
function nativeEngineProviderId(model: TProviderWithModel): string | undefined {
  const tag = (model as unknown as Record<string, unknown>).__waylandModelRegistryBridge;
  if (typeof tag === 'string' && tag.startsWith('v2:')) {
    const id = tag.slice('v2:'.length);
    if (NATIVE_ENGINE_PROVIDER_SET.has(id)) return id;
  }
  if (model.platform && NATIVE_ENGINE_PROVIDER_SET.has(model.platform)) return model.platform;
  return undefined;
}

/**
 * The scoped key env var for an engine-native provider value (e.g.
 * `perplexity` -> `PERPLEXITY_API_KEY`), or `undefined` if `provider` is not a
 * native engine provider. Sourced from {@link PROVIDER_ENV_VARS}.
 */
function nativeEngineEnvVar(provider: WCoreProvider): string | undefined {
  if (!NATIVE_ENGINE_PROVIDER_SET.has(provider)) return undefined;
  return PROVIDER_ENV_VARS[provider as ProviderId]?.[0];
}

/**
 * True if the model is a ChatGPT subscription connected via OAuth (#243).
 * Detected by the registry bridge tag `v2:chatgpt-subscription` written by
 * `legacyModelConfigBridge.mirrorConnectOrRekey` (the legacy `platform`
 * collapses to `openai-compatible`, so the tag is the only surviving carrier of
 * the provider id - mirrors {@link catalogIdFor} / {@link nativeEngineProviderId}).
 */
function isChatGptSubscription(model: TProviderWithModel): boolean {
  const tag = (model as unknown as Record<string, unknown>).__waylandModelRegistryBridge;
  return tag === `v2:${CHATGPT_SUBSCRIPTION_PROVIDER_ID}`;
}

/**
 * Map provider name to wcore provider name.
 *
 * Platform values: 'custom' | 'new-api' | 'gemini' | 'gemini-vertex-ai' | 'anthropic' | 'bedrock'
 */
function mapProvider(model: TProviderWithModel): WCoreProvider {
  // ChatGPT subscription (OAuth): route to the engine's native slug so it drives
  // the ChatGPT backend + reads the token from ~/.codex/auth.json, instead of
  // collapsing to `--provider openai` against api.openai.com (#243).
  if (isChatGptSubscription(model)) return CHATGPT_SUBSCRIPTION_ENGINE_PROVIDER;

  // Catalog provider (one of the ~100): pass the catalog id through verbatim so
  // the engine resolves base_url/api_path/env_var from its own providers.toml.
  // Takes precedence over the native platform mapping below.
  const catalogId = catalogIdFor(model);
  if (catalogId) return catalogId;

  // Engine-native providers (xai, perplexity, openrouter, groq, ...): route to
  // the engine's native slug so it owns the base URL + scoped key, instead of
  // the generic openai+base-url path that 401s against api.openai.com (#177).
  // xai additionally gets the engine's Grok OAuth refresh + grok-4.3 stop fix.
  const nativeId = nativeEngineProviderId(model);
  if (nativeId) return nativeId;

  // ChatGPT subscription: route to the engine's native `openai-chatgpt` provider
  // (platform set by CHAT_START_PLATFORM). The engine reads the OAuth token from
  // its own store (~/.codex/auth.json, written by the desktop on sign-in), so we
  // pass NO key env var and NO --base-url - it owns the ChatGPT backend (#243).
  if (model.platform === 'openai-chatgpt') return 'openai-chatgpt';

  // Special handling for new-api: respect per-model protocol setting
  if (model.platform === 'new-api' && model.useModel && model.modelProtocols) {
    const protocol = model.modelProtocols[model.useModel];
    if (protocol === 'anthropic') return 'anthropic';
  }

  const mapping: Record<string, WCoreProvider> = {
    anthropic: 'anthropic',
    bedrock: 'bedrock',
    'gemini-vertex-ai': 'vertex',
    // Gemini uses OpenAI-compatible endpoint
    gemini: 'openai',
    // custom / new-api default to OpenAI-compatible protocol
    custom: 'openai',
    'new-api': 'openai',
  };
  return mapping[model.platform] ?? 'openai';
}

const GEMINI_OPENAI_COMPAT_PATH = '/v1beta/openai';

/**
 * Dummy bearer token injected for a KEYLESS, LOCAL OpenAI-compatible backend
 * (the local Ollama daemon being the canonical case, #268).
 *
 * Why this is load-bearing: the engine's `resolve_api_key` HARD-REQUIRES a key
 * for the `openai` provider - with no `--api-key`, no `OPENAI_API_KEY`, and no
 * OAuth it `bail!`s "No API key found", `bootstrap.build()` returns Err, and the
 * spawned wcore exits 1 BEFORE emitting `ready`. The desktop then surfaces only
 * "wcore exited with code 1 during init" (`index.ts`). The working CLI path uses
 * `--profile ollama`, whose example config carries `api_key = "ollama"`, so the
 * engine never reaches that bail - which is exactly why the CLI succeeds while
 * the keyless desktop spawn fails on the same daemon.
 *
 * The local daemon ignores the Authorization header, so the value is irrelevant
 * to the request; it only needs to be non-empty to clear the engine's key gate.
 * Matches `LOCAL_KEYLESS_PLACEHOLDER` in `modelBridge.ts` (the legacy spawn path
 * already injects the identical value for the same reason).
 */
const LOCAL_KEYLESS_PLACEHOLDER = 'ollama';

/**
 * `--max-tokens` policy (#456): the desktop does NOT name-guess a budget.
 *
 * The bundled engine (pin `v0.12.16`) sizes `max_tokens` per-model up front
 * itself (`size_output_cap` in wcore-agent): when the desktop omits
 * `--max-tokens` the engine substitutes a generous default (64000) and clamps
 * it to the model's REAL output ceiling - a known model to its documented limit
 * (`wcore-config::limits::model_output_ceiling`: e.g. sonnet-4 -> 64000,
 * opus-4 -> 32000, gpt-4o -> 16384), and an unknown / router-aliased model
 * (`flux-auto`, `flux-pinned-*`, OpenRouter ids, bare `o`-series) to a
 * conservative 8192 floor that grows to 32768 on a reasoning turn
 * (`UNKNOWN_REASONING_CAP`, engine #426 - this replaces the desktop's old
 * `REASONING_MODEL_DEFAULT_MAX_TOKENS` floor, applied server-side only when the
 * turn actually carries a thinking budget / `reasoning_effort`).
 *
 * So the desktop OMITS `--max-tokens` unless the caller passes an explicit
 * value, and lets the engine apply the model-aware budget. A fixed desktop
 * number could only LOWER a known model's real ceiling; omitting is always
 * >= pushing. Truncation detection is unaffected: the engine emits
 * `finish_reason:'length'` definitively (see `WCoreManager.detectTruncation`).
 *
 * NOTE: raising the budget for engine-UNKNOWN models above 8192/32768 (e.g.
 * resolving `flux-pinned-*` / OpenRouter ids from models.dev) is engine-gated -
 * `size_output_cap` hard-clamps unknown models, so a desktop-pushed value is
 * clamped right back. That path needs an engine change (Core), not a desktop
 * one.
 */

/**
 * Resolve base URL for OpenAI-compatible providers.
 * For Gemini, ensure the URL includes the `/v1beta/openai` path suffix.
 */
function resolveOpenAIBaseUrl(model: TProviderWithModel): string {
  if (model.platform === 'gemini') {
    const raw = (model.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
    return raw.endsWith(GEMINI_OPENAI_COMPAT_PATH) ? raw : `${raw}${GEMINI_OPENAI_COMPAT_PATH}`;
  }
  return model.baseUrl || '';
}

/**
 * Strip trailing `/v1` (with optional trailing slash) from a base URL.
 * wcore appends `/v1/chat/completions` internally, so passing a URL
 * that already ends with `/v1` would produce a double `/v1/v1/…` path.
 */
function stripTrailingV1(url: string): string {
  return url.replace(/\/v1\/?$/, '');
}

/**
 * Build CLI args and env vars for spawning wcore.
 */
export function buildSpawnConfig(
  model: TProviderWithModel,
  options: {
    workspace: string;
    maxTokens?: number;
    maxTurns?: number;
    systemPrompt?: string;
    autoApprove?: boolean;
    sessionId?: string;
    resume?: string;
    /**
     * Raw-engine (power-user) mode. When true, the engine runs on its OWN
     * `config.toml` unmodified: NO `--provider`/`--model`/auth env, no
     * `--max-tokens`, no `--system-prompt`, no `--auto-approve`. Only the
     * Desktop↔engine session-protocol args (`--json-stream` + `--session-id`/
     * `--resume`) are passed, so a wcore conversation behaves exactly like the
     * standalone CLI would for that session id. The `model` argument is ignored.
     */
    rawEngine?: boolean;
  }
): {
  args: string[];
  env: Record<string, string>;
  projectConfig: string;
  /**
   * The max_tokens value actually passed to wcore via `--max-tokens`, or
   * `undefined` when none was added (#456: that is now the common case - the
   * desktop only passes a value when the caller set one explicitly, otherwise
   * the engine sizes the budget per-model itself). Callers persist this so
   * WCoreManager's legacy truncation heuristic can compare `output_tokens`
   * against the budget on old engines; on the shipping engine the definitive
   * signal is the emitted `finish_reason:'length'`, which is budget-independent.
   */
  resolvedMaxTokens: number | undefined;
} {
  // Raw-engine mode: pass ONLY the session-protocol args and let the engine
  // resolve provider/model/auth/tokens/security from its own config.toml. No
  // Desktop overrides leak in (mirrors what `WCoreManager` skips on the prompt
  // side). The `model` argument is intentionally unused here.
  if (options.rawEngine) {
    const args = ['--json-stream'];
    if (options.resume) {
      args.push('--resume', options.resume);
    } else if (options.sessionId) {
      args.push('--session-id', options.sessionId);
    }
    return { args, env: {}, projectConfig: '', resolvedMaxTokens: undefined };
  }

  const provider = mapProvider(model);
  const env: Record<string, string> = {};
  const args: string[] = ['--json-stream', '--provider', provider, '--model', model.useModel];

  // #456: omit `--max-tokens` unless the caller explicitly set one; the engine
  // sizes per-model itself (see the policy note above `buildSpawnConfig`).
  const resolvedMaxTokens = options.maxTokens;
  if (resolvedMaxTokens) {
    args.push('--max-tokens', String(resolvedMaxTokens));
  }
  if (options.maxTurns) {
    args.push('--max-turns', String(options.maxTurns));
  }
  if (options.systemPrompt) {
    args.push('--system-prompt', options.systemPrompt);
  }
  if (options.autoApprove) {
    args.push('--auto-approve');
  }

  // --resume and --session-id are mutually exclusive
  if (options.resume) {
    args.push('--resume', options.resume);
  } else if (options.sessionId) {
    args.push('--session-id', options.sessionId);
  }

  // Set auth credentials and base URL via CLI args and env vars.
  // wcore reads: --api-key / API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY
  //              --base-url / BASE_URL (NOT OPENAI_BASE_URL)
  // wcore appends `/v1/chat/completions` to base_url, so URLs that already
  // end with `/v1` (e.g. DashScope) must be stripped to avoid double `/v1`.
  const catalogId = catalogIdFor(model);
  if (catalogId) {
    // Catalog provider: set ONLY the engine's expected scoped key env var (e.g.
    // NOVITA_API_KEY) and let the engine resolve base_url/api_path from its own
    // providers.toml. Deliberately NO `--base-url` (RES-4: a shared/derived URL
    // here would override the engine's authority) and NO shared OPENAI_API_KEY
    // (ghost-key: a catalog provider must use its OWN scoped var).
    const envVar = catalogEnvVarById().get(catalogId);
    if (envVar && model.apiKey) env[envVar] = model.apiKey;
    const projectConfig = buildProjectConfig(model, provider);
    return { args, env, projectConfig, resolvedMaxTokens };
  }

  // Engine-native providers (#177): the app persists these as openai-compatible
  // but the bundled engine resolves <id> -> base_url + scoped key from its own
  // baked catalog. Set ONLY the scoped env var (e.g. PERPLEXITY_API_KEY) and pass
  // NO --base-url, so the engine routes to the provider's real host instead of
  // api.openai.com. Mirrors the catalog block above.
  const nativeEnvVar = nativeEngineEnvVar(provider);
  if (nativeEnvVar !== undefined) {
    if (model.apiKey) env[nativeEnvVar] = model.apiKey;
    const projectConfig = buildProjectConfig(model, provider);
    return { args, env, projectConfig, resolvedMaxTokens };
  }

  // ChatGPT subscription (#243): the engine owns the ChatGPT backend host and
  // reads the OAuth token from ~/.codex/auth.json (bridged by writeCodexAuthFile
  // at sign-in), so pass NEITHER a --base-url NOR a key env var - just the native
  // `--provider openai-chatgpt`. Setting OPENAI_API_KEY here would present the
  // OAuth bearer to api.openai.com (the rejected path); the base URL must stay
  // engine-owned, not the openai-compatible backend URL on the legacy row.
  if (provider === CHATGPT_SUBSCRIPTION_ENGINE_PROVIDER) {
    const projectConfig = buildProjectConfig(model, provider);
    return { args, env, projectConfig, resolvedMaxTokens };
  }

  switch (provider) {
    case 'anthropic':
      if (model.apiKey) env.ANTHROPIC_API_KEY = model.apiKey;
      if (model.baseUrl) args.push('--base-url', stripTrailingV1(model.baseUrl));
      break;

    case 'openai': {
      const baseUrl = resolveOpenAIBaseUrl(model);
      // Keyless LOCAL backend (local Ollama, #268): the engine still demands a
      // key for `--provider openai` or it bails at init, so inject the dummy
      // placeholder (the local daemon ignores Authorization). A keyless CLOUD
      // endpoint is a genuine misconfig and is left to fail as before.
      const trimmedKey = model.apiKey?.trim();
      if (trimmedKey) {
        env.OPENAI_API_KEY = trimmedKey;
      } else if (isLocalBaseUrl(baseUrl)) {
        env.OPENAI_API_KEY = LOCAL_KEYLESS_PLACEHOLDER;
      }
      if (baseUrl) args.push('--base-url', stripTrailingV1(baseUrl));
      break;
    }

    case 'bedrock': {
      const bc = (model as TProviderWithModel & { bedrockConfig?: any }).bedrockConfig;
      if (bc) {
        if (bc.region) env.AWS_REGION = bc.region;
        if (bc.authMethod === 'accessKey') {
          if (bc.accessKeyId) env.AWS_ACCESS_KEY_ID = bc.accessKeyId;
          if (bc.secretAccessKey) env.AWS_SECRET_ACCESS_KEY = bc.secretAccessKey;
        } else if (bc.authMethod === 'profile' && bc.profile) {
          env.AWS_PROFILE = bc.profile;
        }
      }
      break;
    }

    case 'vertex':
      // Vertex uses service account or ADC - no explicit env vars needed
      break;
  }

  // Generate project config for compat overrides (e.g., max_tokens_field)
  const projectConfig = buildProjectConfig(model, provider);

  return { args, env, projectConfig, resolvedMaxTokens };
}

/**
 * Build `.wcore.toml` project config content for provider compat overrides.
 * Returns non-empty string only when overrides are needed.
 *
 * - Gemini's OpenAI-compatible endpoint already includes version in the base URL
 *   (`/v1beta/openai`), so we override api_path to `/chat/completions` to avoid
 *   the default `/v1/chat/completions` which would produce a 404.
 * - OpenAI official API requires `max_completion_tokens` instead of `max_tokens`
 *   for newer models (gpt-5.x, o-series, etc.).
 */
function buildProjectConfig(model: TProviderWithModel, provider: WCoreProvider): string {
  if (provider !== 'openai') return '';

  // Collect compat overrides as key-value pairs
  const overrides: string[] = [];

  // Gemini uses /v1beta/openai as base URL - skip the default /v1 prefix
  if (model.platform === 'gemini') {
    overrides.push('api_path = "/chat/completions"');
  }

  // OpenAI official API needs max_completion_tokens for newer models.
  // Only apply when the host is actually OpenAI (not Gemini or other providers).
  const baseUrl = model.baseUrl || '';
  if (baseUrl && isOpenAIHost(baseUrl)) {
    overrides.push('max_tokens_field = "max_completion_tokens"');
  }

  if (overrides.length === 0) return '';
  return ['[providers.openai.compat]', ...overrides, ''].join('\n');
}

/**
 * Env var NAMES the wcore engine is allowed to inherit from `process.env`
 * (SEC-1). Everything not on this list is dropped, so channel tokens, the
 * vault, and unrelated provider/secret material no longer leak into the engine
 * for its whole lifetime.
 *
 * Matching is case-insensitive (see {@link buildEngineSpawnEnv}) so a single
 * entry covers both `HTTP_PROXY`/`http_proxy` and Windows' mixed-case
 * `SystemRoot`/`ProgramFiles(x86)`.
 *
 * Bias is deliberately fail-safe toward NOT breaking auth/connectivity: when in
 * doubt a var is kept rather than dropped. Categories:
 *  - Runtime/home/temp: locate binaries and per-user config (PATH is the
 *    bundled+merged value from `getEnhancedEnv`, not raw `process.env.PATH`).
 *  - Windows system: omitting these breaks process spawning / DLL resolution.
 *  - Locale/terminal/identity: correct text handling; some libs require a user.
 *  - Proxy + TLS/CA certs: required to reach (and validate) provider API hosts.
 *  - Provider auth: the engine may read these directly when the user exported
 *    them in their shell rather than configuring a model in-app. The model's
 *    own creds are ALSO injected explicitly (and unconditionally) in
 *    `buildEngineSpawnEnv`, so this list only covers the shell-exported path.
 *    These names all carry a secret marker, so the engine sandbox still strips
 *    them from the agent's bash-tool context.
 */
const ENGINE_ENV_ALLOWLIST: readonly string[] = [
  // ── Runtime / home / temp ──────────────────────────────────────────────
  'PATH',
  'HOME',
  'HOMEDRIVE',
  'HOMEPATH',
  'USERPROFILE',
  'TMPDIR',
  'TMP',
  'TEMP',
  'PWD',
  // ── Linux dynamic linker ───────────────────────────────────────────────
  // Shared-library search path. Required on ARM64 Ubuntu 24.04 (Noble) when
  // the engine needs OpenSSL 1.1 from a non-system prefix. Without it the
  // dynamic linker can't find the .so and the engine fails on startup (#233).
  'LD_LIBRARY_PATH',
  // ── Wayland engine config (non-secret) ─────────────────────────────────
  // The user's bash-tool shell selection. Set in the environment (never by the
  // app), so a GUI-launched engine only receives it when it survives this
  // filter; CLI/headless already inherit the full env. Without it the engine
  // falls back to its default shell (#197). Reaches `full` via process.env or
  // the login-shell capture (see SHELL_INHERITED_ENV_VARS in shellEnv.ts).
  'WAYLAND_BASH_SHELL',
  // ── Windows system (load-bearing for spawning + DLL resolution) ─────────
  'SYSTEMROOT',
  'SYSTEMDRIVE',
  'WINDIR',
  'COMSPEC',
  'PATHEXT',
  'ProgramFiles',
  'ProgramFiles(x86)',
  'ProgramData',
  'CommonProgramFiles',
  'APPDATA',
  'LOCALAPPDATA',
  'NUMBER_OF_PROCESSORS',
  'PROCESSOR_ARCHITECTURE',
  'PROCESSOR_ARCHITEW6432',
  // ── Locale / terminal / identity ───────────────────────────────────────
  'LANG',
  'LANGUAGE',
  'LC_ALL',
  'LC_CTYPE',
  'LC_MESSAGES',
  'TZ',
  'TERM',
  'USER',
  'LOGNAME',
  'USERNAME',
  // ── Proxy (corporate egress to provider APIs) ──────────────────────────
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
  'ALL_PROXY',
  // ── TLS / CA certs (HTTPS to provider APIs must validate) ──────────────
  'NODE_EXTRA_CA_CERTS',
  'SSL_CERT_FILE',
  'SSL_CERT_DIR',
  'REQUESTS_CA_BUNDLE',
  'CURL_CA_BUNDLE',
  'NODE_TLS_REJECT_UNAUTHORIZED',
  // ── Provider auth (shell-exported path; see JSDoc) ─────────────────────
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'AWS_REGION',
  'AWS_DEFAULT_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'AWS_PROFILE',
  'AWS_SHARED_CREDENTIALS_FILE',
  'AWS_CONFIG_FILE',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_CLOUD_PROJECT',
];

/**
 * Build the environment for the wcore engine spawn (SEC-1).
 *
 * Replaces the previous `getEnhancedEnv(env)` call, which spread ALL of
 * `process.env` into the engine. We still run `getEnhancedEnv` to get its
 * correct PATH/cert/shell handling, then filter the result down to
 * {@link ENGINE_ENV_ALLOWLIST}, and finally layer on:
 *  1. `providerEnv` - the model's chosen auth creds from `buildSpawnConfig`.
 *     Re-applied unconditionally so tightening the allowlist can never break
 *     provider auth.
 *  2. `toolKeys` - forwarded tool-backend keys (`ENV_NAME → value`), already
 *     resolved from the encrypted store. Their names carry a sandbox secret
 *     marker so the engine keeps them out of the agent's tool context (SEC-5).
 *  3. `waylandHome` - the active profile's config dir (Design B). Forces the
 *     engine's `wayland_config_dir()` to that dir, so the spawn reads the
 *     active profile's OWN config.toml + memory.db + skills. Set explicitly for
 *     every profile (default -> native dir; named -> `~/.wayland/profiles/<n>`)
 *     so the live config file the panes edit and the file the engine reads can
 *     never diverge. Layered last so a stray `process.env.WAYLAND_HOME` can't
 *     override the resolved profile dir.
 */
export function buildEngineSpawnEnv(opts: {
  providerEnv: Record<string, string>;
  toolKeys?: Record<string, string>;
  waylandHome?: string;
}): Record<string, string> {
  const full = getEnhancedEnv(opts.providerEnv);
  const allowed = new Set(ENGINE_ENV_ALLOWLIST.map((name) => name.toUpperCase()));

  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(full)) {
    if (typeof value === 'string' && allowed.has(name.toUpperCase())) {
      out[name] = value;
    }
  }

  // Provider auth creds are load-bearing - always present regardless of the
  // allowlist (the allowlist governs only what is pulled from process.env).
  for (const [name, value] of Object.entries(opts.providerEnv)) {
    out[name] = value;
  }

  // Forwarded tool-backend keys.
  for (const [name, value] of Object.entries(opts.toolKeys ?? {})) {
    out[name] = value;
  }

  // Active-profile config root (Design B). Authoritative - set last.
  if (opts.waylandHome) {
    out.WAYLAND_HOME = opts.waylandHome;
  }

  return out;
}
