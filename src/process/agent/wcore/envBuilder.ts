/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TProviderWithModel } from '@/common/config/storage';
import { isLocalBaseUrl, isOpenAIHost } from '@/common/utils/urlValidation';
import { loadBaselineProviderCatalog } from '@process/providers/catalog/providerCatalogStore';
import { getEnhancedEnv } from '@process/utils/shellEnv';

/**
 * The four wcore providers Wayland configures natively (each carries its own
 * auth + base-url handling in {@link buildSpawnConfig}).
 */
type NativeWCoreProvider = 'anthropic' | 'openai' | 'bedrock' | 'vertex';

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
 * Map provider name to wcore provider name.
 *
 * Platform values: 'custom' | 'new-api' | 'gemini' | 'gemini-vertex-ai' | 'anthropic' | 'bedrock'
 */
function mapProvider(model: TProviderWithModel): WCoreProvider {
  // Catalog provider (one of the ~100): pass the catalog id through verbatim so
  // the engine resolves base_url/api_path/env_var from its own providers.toml.
  // Takes precedence over the native platform mapping below.
  const catalogId = catalogIdFor(model);
  if (catalogId) return catalogId;

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
 * wayland-core currently refuses to start an OpenAI-protocol session without a
 * non-empty key, even when the target is a local keyless daemon like Ollama.
 * For loopback/private base URLs only, inject a harmless sentinel so the engine
 * can bootstrap; the local backend ignores the bearer token.
 */
const LOCAL_OPENAI_COMPAT_API_KEY = 'local';

/**
 * Default `--max-tokens` budget for reasoning-tier models when the caller
 * does not specify one.
 *
 * Why this exists: wcore has no model-aware default for
 * `max_tokens`. Reasoning models (Gemini Pro/Preview, future
 * `*-thinking`/`*-reasoning` variants) burn ~50-60 hidden "thinking" tokens
 * before emitting any visible output. With wcore's low built-in default,
 * thinking consumes the entire budget, the API returns
 * `finish_reason: length`, and the user sees an empty response. Flash
 * variants are non-reasoning and work cleanly at low budgets, so we leave
 * them alone - bumping their budget would just waste tokens.
 *
 * Detection is intentionally name-pattern based:
 *   - Suffix match (`-pro` / `-preview` / `-thinking` / `-reasoning`) catches
 *     Gemini Pro, Preview, and any future explicit reasoning variant.
 *   - Anchored match (`^o\d+(-mini)?$`) catches OpenAI's bare o-series
 *     reasoning models (`o1`, `o3`, `o3-mini`, `o4`, `o4-mini`). Their names
 *     lack a reasoning-indicating suffix, so the suffix regex misses them.
 *     Listed in `src/renderer/utils/model/modelContextLimits.ts`, so they
 *     are reachable through any OpenAI-protocol provider in Wayland.
 *
 * `-flash` variants short-circuit first - they are non-reasoning and work
 * cleanly at low budgets; bumping them would just waste tokens. Callers that
 * pass an explicit `maxTokens` always win - this is only a fallback.
 */
const REASONING_MODEL_DEFAULT_MAX_TOKENS = 32768;

export function defaultMaxTokensForModel(modelName: string): number | undefined {
  if (!modelName) return undefined;
  if (/-flash/i.test(modelName)) return undefined;
  // TODO(reasoning-detector): only catches o-prefixed reasoning models (o1/o3/o4-mini etc.).
  // When OpenAI ships a non-o-prefixed reasoning model (e.g. gpt-5-reasoning), revisit
  // this matcher - see .blackboard/audits/hard-coded-values.md HC-5.
  if (/^o\d+(-mini)?$/i.test(modelName)) return REASONING_MODEL_DEFAULT_MAX_TOKENS;
  return /(-pro|-preview|-thinking|-reasoning)\b/i.test(modelName) ? REASONING_MODEL_DEFAULT_MAX_TOKENS : undefined;
}

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
   * The max_tokens value actually passed to wcore (or undefined if no `--max-tokens`
   * arg was added). Callers persist this so WCoreManager's truncation heuristic
   * can compare `output_tokens` against the real budget - including the silent
   * reasoning-model default from `defaultMaxTokensForModel`, which would otherwise
   * be invisible to anything above the wrapper.
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

  const resolvedMaxTokens = options.maxTokens ?? defaultMaxTokensForModel(model.useModel);
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

  switch (provider) {
    case 'anthropic':
      if (model.apiKey) env.ANTHROPIC_API_KEY = model.apiKey;
      if (model.baseUrl) args.push('--base-url', stripTrailingV1(model.baseUrl));
      break;

    case 'openai': {
      const baseUrl = resolveOpenAIBaseUrl(model);
      if (model.apiKey) {
        env.OPENAI_API_KEY = model.apiKey;
      } else if (isLocalBaseUrl(baseUrl)) {
        env.OPENAI_API_KEY = LOCAL_OPENAI_COMPAT_API_KEY;
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
