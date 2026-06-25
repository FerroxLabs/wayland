/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * T3.5 - WCore dispatch for catalog provider ids (closes COR-2 / BL-2).
 *
 * A catalog provider (one of the ~100 in `providerCatalog.generated.json`, NOT
 * a native one) must reach the engine as `--provider <catalogId>` with its OWN
 * scoped API-key env var, and WITHOUT a `--base-url` - the engine resolves the
 * endpoint from its bundled `providers.toml`. Native providers must keep their
 * existing behavior unchanged.
 */

import { describe, expect, it } from 'vitest';
import { buildSpawnConfig } from '../../src/process/agent/wcore/envBuilder';
import type { TProviderWithModel } from '../../src/common/config/storage';

const OPTS = { workspace: '/tmp/ws' };

/** Read the value following `--provider`. */
function providerArg(args: string[]): string | undefined {
  const i = args.indexOf('--provider');
  return i === -1 ? undefined : args[i + 1];
}

/** Read the value following `--base-url`. */
function baseUrlArg(args: string[]): string | undefined {
  const i = args.indexOf('--base-url');
  return i === -1 ? undefined : args[i + 1];
}

/** True if a `--base-url` arg was pushed. */
function hasBaseUrl(args: string[]): boolean {
  return args.includes('--base-url');
}

/**
 * Build a catalog-provider model exactly as the legacy bridge persists it: the
 * catalog id lives ONLY in the `__waylandModelRegistryBridge: 'v2:<catalogId>'`
 * tag (the legacy `platform` collapses to 'openai-compatible' and `id` is a
 * random uuid). This mirrors `legacyModelConfigBridge.mirrorConnectOrRekey`.
 */
function makeCatalogModel(catalogId: string, key: string, useModel = 'some-model'): TProviderWithModel {
  return {
    id: 'random-uuid-1234',
    platform: 'openai-compatible',
    name: 'NovitaAI',
    baseUrl: 'https://api.novita.ai/openai',
    apiKey: key,
    useModel,
    __waylandModelRegistryBridge: `v2:${catalogId}`,
  } as TProviderWithModel;
}

function makeNativeModel(platform: string, key: string, useModel = 'some-model'): TProviderWithModel {
  return {
    id: 'native-1',
    platform,
    name: platform,
    baseUrl: '',
    apiKey: key,
    useModel,
  };
}

describe('buildSpawnConfig - catalog provider dispatch (T3.5)', () => {
  it('routes a catalog provider as --provider <catalogId> with the scoped env var and NO --base-url', () => {
    const { args, env } = buildSpawnConfig(makeCatalogModel('novita-ai', 'sk-x'), OPTS);

    expect(providerArg(args)).toBe('novita-ai');
    expect(hasBaseUrl(args)).toBe(false);
    // Scoped var from the catalog (NovitaAI -> NOVITA_API_KEY), NOT OPENAI_API_KEY.
    expect(env.NOVITA_API_KEY).toBe('sk-x');
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it('uses the catalog-declared env var name even when it differs from the id', () => {
    // alibaba's catalog env var is DASHSCOPE_API_KEY, not ALIBABA_API_KEY.
    const { args, env } = buildSpawnConfig(makeCatalogModel('alibaba', 'sk-ali'), OPTS);

    expect(providerArg(args)).toBe('alibaba');
    expect(hasBaseUrl(args)).toBe(false);
    expect(env.DASHSCOPE_API_KEY).toBe('sk-ali');
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it('keeps native anthropic behavior unchanged (regression guard)', () => {
    const { args, env } = buildSpawnConfig(makeNativeModel('anthropic', 'sk-ant'), OPTS);

    expect(providerArg(args)).toBe('anthropic');
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant');
    expect(env.NOVITA_API_KEY).toBeUndefined();
  });

  it('keeps native openai behavior unchanged: --provider openai + OPENAI_API_KEY', () => {
    const model = makeNativeModel('openai', 'sk-oai');
    model.baseUrl = 'https://api.openai.com/v1';
    const { args, env } = buildSpawnConfig(model, OPTS);

    expect(providerArg(args)).toBe('openai');
    expect(env.OPENAI_API_KEY).toBe('sk-oai');
    expect(hasBaseUrl(args)).toBe(true);
  });

  it('does not leak a prior catalog scoped key when switching to a keyless native provider (RES-4 ghost key)', () => {
    // First spawn: catalog provider sets NOVITA_API_KEY.
    const first = buildSpawnConfig(makeCatalogModel('novita-ai', 'sk-x'), OPTS);
    expect(first.env.NOVITA_API_KEY).toBe('sk-x');

    // Second spawn: a native vertex provider (no api key). Its env must be a
    // fresh object with NO scoped catalog key carried over.
    const second = buildSpawnConfig(makeNativeModel('gemini-vertex-ai', ''), OPTS);
    expect(second.env.NOVITA_API_KEY).toBeUndefined();
    expect(providerArg(second.args)).toBe('vertex');
  });

  it('falls back safely for an unknown / uncatalogued non-native id (no crash, no catalog routing)', () => {
    // A bridge tag pointing at an id that is NOT in the catalog: route as the
    // legacy openai-compatible provider (current behavior) rather than emitting
    // a bogus --provider the engine cannot resolve.
    const model = makeCatalogModel('totally-made-up-provider', 'sk-y');
    const { args, env } = buildSpawnConfig(model, OPTS);

    expect(providerArg(args)).toBe('openai');
    // The key falls back to OPENAI_API_KEY (legacy openai-compatible path).
    expect(env.OPENAI_API_KEY).toBe('sk-y');
    // No bogus scoped var was invented.
    expect(env.TOTALLY_MADE_UP_PROVIDER_API_KEY).toBeUndefined();
  });

  it('routes xAI / Grok to the native --provider xai with XAI_API_KEY and NO --base-url', () => {
    // xAI is persisted like a generic openai-compatible provider (api.x.ai); its
    // identity survives only in the `v2:xai` bridge tag. It must reach the engine
    // as `--provider xai` (native Grok provider, 0.12.2+) so the OAuth refresh +
    // grok-4.3 stop-param fix apply - NOT the openai+base-url path.
    const model: TProviderWithModel = {
      id: 'random-uuid-xai',
      platform: 'openai-compatible',
      name: 'xAI',
      baseUrl: 'https://api.x.ai/v1',
      apiKey: 'xai-secret',
      useModel: 'grok-4.3',
      __waylandModelRegistryBridge: 'v2:xai',
    } as TProviderWithModel;
    const { args, env } = buildSpawnConfig(model, OPTS);

    expect(providerArg(args)).toBe('xai');
    // The engine owns api.x.ai as its default base URL - we must NOT pass one.
    expect(hasBaseUrl(args)).toBe(false);
    // Scoped XAI_API_KEY (engine ignores it when an OAuth credential is present).
    expect(env.XAI_API_KEY).toBe('xai-secret');
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it('routes xAI whose platform was stored directly as xai (forward-compat)', () => {
    const { args, env } = buildSpawnConfig(makeNativeModel('xai', 'xai-key', 'grok-4.3'), OPTS);

    expect(providerArg(args)).toBe('xai');
    expect(hasBaseUrl(args)).toBe(false);
    expect(env.XAI_API_KEY).toBe('xai-key');
  });

  it('routes ChatGPT subscription to --provider openai-chatgpt with NO key and NO --base-url (#243)', () => {
    // chatgpt-subscription resolves (CHAT_START_PLATFORM) to platform
    // 'openai-chatgpt' and carries no api key - the engine reads the OAuth token
    // from ~/.codex/auth.json itself. Must route to the native slug, never inject
    // OPENAI_API_KEY, and never pass a --base-url (the engine owns the backend).
    const { args, env } = buildSpawnConfig(makeNativeModel('openai-chatgpt', '', 'gpt-5.2-codex'), OPTS);

    expect(providerArg(args)).toBe('openai-chatgpt');
    expect(hasBaseUrl(args)).toBe(false);
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it('routes a catalog provider whose platform was stored directly as the catalog id (forward-compat)', () => {
    // Forward-compat: if a future connect path stores the catalog id directly in
    // `platform` (no bridge tag), it must still route as a catalog provider.
    const model: TProviderWithModel = {
      id: 'p1',
      platform: 'novita-ai',
      name: 'NovitaAI',
      baseUrl: 'https://api.novita.ai/openai',
      apiKey: 'sk-z',
      useModel: 'm',
    };
    const { args, env } = buildSpawnConfig(model, OPTS);

    expect(providerArg(args)).toBe('novita-ai');
    expect(hasBaseUrl(args)).toBe(false);
    expect(env.NOVITA_API_KEY).toBe('sk-z');
  });
});

/**
 * #177 - Generalized engine-native provider routing. The app persists these as
 * generic `openai-compatible` rows (real base URL stripped from the legacy
 * bridge row), so the identity survives only in the `v2:<id>` tag. Each must
 * reach the engine as `--provider <id>` with its scoped key env var and NO
 * `--base-url`, so the engine routes to the provider's real host instead of
 * collapsing to api.openai.com (the false 401 in #177). Mirrors the xai tests.
 */
describe('buildSpawnConfig - engine-native provider routing (#177)', () => {
  // [providerId, scoped env var] - mirrors PROVIDER_ENV_VARS (the source of truth).
  const NATIVE: ReadonlyArray<readonly [string, string]> = [
    ['perplexity', 'PERPLEXITY_API_KEY'],
    ['openrouter', 'OPENROUTER_API_KEY'],
    ['groq', 'GROQ_API_KEY'],
    ['mistral', 'MISTRAL_API_KEY'],
    ['cohere', 'COHERE_API_KEY'],
    ['deepseek', 'DEEPSEEK_API_KEY'],
    ['together', 'TOGETHER_API_KEY'],
    ['fireworks', 'FIREWORKS_API_KEY'],
    ['cerebras', 'CEREBRAS_API_KEY'],
    ['nvidia', 'NVIDIA_API_KEY'],
    ['minimax', 'MINIMAX_API_KEY'],
  ];

  it.each(NATIVE)(
    'routes %s via the v2 bridge tag as --provider %s with the scoped key, NO --base-url',
    (id, envVar) => {
      // Persisted exactly as the legacy bridge stores it: platform collapses to
      // 'openai-compatible', a non-empty (but wrong-for-engine) base URL is
      // present, and the only identity carrier is the `v2:<id>` tag.
      const model: TProviderWithModel = {
        id: 'native-uuid',
        platform: 'openai-compatible',
        name: id,
        baseUrl: 'https://example.invalid/v1',
        apiKey: `${id}-secret`,
        useModel: 'some-model',
        __waylandModelRegistryBridge: `v2:${id}`,
      } as TProviderWithModel;
      const { args, env } = buildSpawnConfig(model, OPTS);

      expect(providerArg(args)).toBe(id);
      expect(hasBaseUrl(args)).toBe(false);
      expect(env[envVar]).toBe(`${id}-secret`);
      // Must NOT leak to the shared OpenAI key (the #177 root cause).
      expect(env.OPENAI_API_KEY).toBeUndefined();
    }
  );

  it.each(NATIVE)('routes %s stored directly as the platform (forward-compat) as --provider %s', (id, envVar) => {
    const { args, env } = buildSpawnConfig(makeNativeModel(id, `${id}-key`), OPTS);

    expect(providerArg(args)).toBe(id);
    expect(hasBaseUrl(args)).toBe(false);
    expect(env[envVar]).toBe(`${id}-key`);
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it('reproduces #177: a Perplexity pplx- key no longer routes to --provider openai', () => {
    const model: TProviderWithModel = {
      id: 'pplx-uuid',
      platform: 'openai-compatible',
      name: 'Perplexity',
      baseUrl: '',
      apiKey: 'pplx-realkey',
      useModel: 'sonar-pro',
      __waylandModelRegistryBridge: 'v2:perplexity',
    } as TProviderWithModel;
    const { args, env } = buildSpawnConfig(model, OPTS);

    expect(providerArg(args)).toBe('perplexity');
    expect(env.PERPLEXITY_API_KEY).toBe('pplx-realkey');
    // The bug: key landed in OPENAI_API_KEY -> api.openai.com -> 401. Never again.
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(hasBaseUrl(args)).toBe(false);
  });
});

/**
 * #268 - Keyless LOCAL Ollama init. The auto-registered local Ollama provider is
 * keyless by design (`autoRegisterOllama`: `creds.key = ''`, base URL
 * `http://127.0.0.1:11434/v1`) and `ollama-local` is NOT a catalog/native id, so
 * it routes through the generic `--provider openai` arm. Without a key the engine
 * `bail!`s "No API key found" at init and the spawn exits 1 BEFORE `ready` -
 * which the desktop surfaces as "wcore exited with code 1 during init". The CLI
 * works only because `--profile ollama` carries `api_key = "ollama"`.
 *
 * The fix injects the same dummy placeholder for a keyless LOCAL endpoint, while
 * leaving keyed and keyless-CLOUD endpoints unchanged.
 */
describe('buildSpawnConfig - keyless local Ollama (#268)', () => {
  /** The model exactly as the legacy bridge mirrors an auto-registered local Ollama. */
  function makeLocalOllamaModel(useModel = 'hermes3:8b'): TProviderWithModel {
    return {
      id: 'ollama-local-uuid',
      platform: 'openai-compatible',
      name: 'Ollama Local',
      baseUrl: 'http://127.0.0.1:11434/v1',
      apiKey: '',
      useModel,
      __waylandModelRegistryBridge: 'v2:ollama-local',
    } as TProviderWithModel;
  }

  it('injects a placeholder OPENAI_API_KEY so the engine does not bail at init', () => {
    const { env } = buildSpawnConfig(makeLocalOllamaModel(), OPTS);
    // Non-empty key clears the engine's resolve_api_key gate. The local daemon
    // ignores the Authorization header, so the exact value is irrelevant.
    expect(env.OPENAI_API_KEY).toBe('ollama');
  });

  it('treats a whitespace-only key as keyless and injects the placeholder (modelBridge parity)', () => {
    const model = makeLocalOllamaModel();
    model.apiKey = '   ';
    const { env } = buildSpawnConfig(model, OPTS);
    // modelBridge trims the key before the placeholder fallback; envBuilder must
    // match, or a whitespace-only key would be sent as a bearer and skip the
    // keyless fix - re-triggering the #268 init bail.
    expect(env.OPENAI_API_KEY).toBe('ollama');
  });

  it('produces the SAME effective endpoint as the working `--profile ollama` CLI path', () => {
    const { args } = buildSpawnConfig(makeLocalOllamaModel(), OPTS);
    // mapProvider -> openai; stripTrailingV1 strips the persisted `/v1`, and the
    // engine re-appends its default `/v1/chat/completions`. The CLI profile uses
    // `base_url = "http://localhost:11434"` -> identical effective endpoint
    // (`.../v1/chat/completions`), just a different loopback spelling.
    expect(providerArg(args)).toBe('openai');
    expect(baseUrlArg(args)).toBe('http://127.0.0.1:11434');
    expect(args).toContain('--model');
    expect(args[args.indexOf('--model') + 1]).toBe('hermes3:8b');
  });

  it('does NOT inject a placeholder for a keyless CLOUD openai endpoint (regression guard)', () => {
    const model = makeNativeModel('openai', '');
    model.baseUrl = 'https://api.openai.com/v1';
    const { env } = buildSpawnConfig(model, OPTS);
    // A missing key against a cloud host is a genuine misconfig - leave it to
    // fail rather than silently masking it with a dummy bearer.
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it('keeps a KEYED openai provider unchanged - the real key wins (regression guard)', () => {
    const model = makeNativeModel('openai', 'sk-real');
    model.baseUrl = 'http://127.0.0.1:11434/v1';
    const { env } = buildSpawnConfig(model, OPTS);
    // Even on a local host, a user-supplied key must never be replaced.
    expect(env.OPENAI_API_KEY).toBe('sk-real');
  });
});

/**
 * #243 - ChatGPT subscription (OAuth) routing. The mirror persists a connected
 * subscription as a generic `openai-compatible` row (the ChatGPT backend base
 * URL on the legacy row, the OAuth access token as `apiKey`), so its identity
 * survives only in the `v2:chatgpt-subscription` tag. It must reach the engine
 * as the native `--provider openai-chatgpt` with NO `--base-url` (engine owns
 * the ChatGPT backend host) and NO key env var (the engine reads the token from
 * `~/.codex/auth.json`, bridged at sign-in) - NOT the openai+base-url path that
 * presents the OAuth bearer to api.openai.com and errors on send (the
 * "not connected / kicked back to Settings" symptom).
 */
describe('buildSpawnConfig - ChatGPT subscription routing (#243)', () => {
  it('routes a chatgpt-subscription via the v2 tag as --provider openai-chatgpt, NO --base-url, NO key env', () => {
    const model: TProviderWithModel = {
      id: 'chatgpt-uuid',
      platform: 'openai-compatible',
      name: 'ChatGPT subscription',
      baseUrl: 'https://chatgpt.com/backend-api',
      apiKey: 'oauth-access-token',
      useModel: 'gpt-5.2',
      __waylandModelRegistryBridge: 'v2:chatgpt-subscription',
    } as TProviderWithModel;
    const { args, env } = buildSpawnConfig(model, OPTS);

    // The fix: native engine slug, no longer collapses to `--provider openai`.
    expect(providerArg(args)).toBe('openai-chatgpt');
    // The engine owns chatgpt.com/backend-api - we must NOT pass a base URL.
    expect(hasBaseUrl(args)).toBe(false);
    // The OAuth bearer must NOT be presented to api.openai.com via OPENAI_API_KEY;
    // the engine reads it from ~/.codex/auth.json instead.
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });
});
