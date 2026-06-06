/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TProviderWithModel } from '@/common/config/storage';
import { isOpenAIHost } from '@/common/utils/urlValidation';

type WCoreProvider = 'anthropic' | 'openai' | 'bedrock' | 'vertex';

/**
 * Map provider name to wcore provider name.
 *
 * Platform values: 'custom' | 'new-api' | 'gemini' | 'gemini-vertex-ai' | 'anthropic' | 'bedrock'
 */
function mapProvider(model: TProviderWithModel): WCoreProvider {
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
  return /(-pro|-preview|-thinking|-reasoning)\b/i.test(modelName)
    ? REASONING_MODEL_DEFAULT_MAX_TOKENS
    : undefined;
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
  switch (provider) {
    case 'anthropic':
      if (model.apiKey) env.ANTHROPIC_API_KEY = model.apiKey;
      if (model.baseUrl) args.push('--base-url', stripTrailingV1(model.baseUrl));
      break;

    case 'openai': {
      if (model.apiKey) env.OPENAI_API_KEY = model.apiKey;
      const baseUrl = resolveOpenAIBaseUrl(model);
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
