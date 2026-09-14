/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Desktop provider rows → Fuigo `[model.byok/…]` entries. Fuigo under Desktop
 * authenticates with the Flux key alone, so before this every Fuigo chat was
 * Flux-only; a user's own provider had nothing to attach to. The key must never
 * reach the TOML on disk, and a keyless local server must never be handed the
 * Flux key.
 */
import { describe, expect, it } from 'vitest';
import type { IProvider } from '@/common/config/storage';
import { LOCAL_KEYLESS_PLACEHOLDER } from '@/common/utils/keylessLocalCredential';
import {
  GEMINI_OPENAI_BASE_URL,
  fuigoAzureByokProvider,
  fuigoByokProvidersFromRows,
  fuigoByokSpawnPlan,
} from '@process/agent/fuigo/byok';
import { FUIGO_MANAGED_CONFIG, buildFuigoManagedConfig } from '@process/agent/fuigo/launch';

const row = (over: Partial<IProvider> & Record<string, unknown>): IProvider =>
  ({
    id: 'row-1',
    platform: 'openai',
    name: 'OpenAI',
    baseUrl: '',
    apiKey: 'sk-openai-secret',
    model: ['gpt-4o'],
    ...over,
  }) as IProvider;

const OPENAI = row({ __waylandModelRegistryBridge: 'v2:openai' });
const ANTHROPIC = row({
  id: 'row-2',
  platform: 'anthropic',
  name: 'Anthropic',
  baseUrl: 'https://api.anthropic.com',
  apiKey: 'sk-ant-secret',
  model: ['claude-sonnet-4-5', 'claude-haiku-4-5'],
  __waylandModelRegistryBridge: 'v2:anthropic',
});
const FLUX = row({
  id: 'row-flux',
  platform: 'openai-compatible',
  name: 'FluxRouter',
  baseUrl: '',
  apiKey: 'sk-flux',
  model: ['flux-auto', 'flux-fast'],
  __waylandModelRegistryBridge: 'v2:flux-router',
});
/** What the registry mirror writes for a connected local Ollama: no key, no base URL. */
const OLLAMA = row({
  id: 'row-ollama',
  platform: 'openai-compatible',
  name: 'Ollama Local',
  baseUrl: '',
  apiKey: '',
  model: ['qwen3:8b'],
  __waylandModelRegistryBridge: 'v2:ollama-local',
});
const GEMINI = row({
  id: 'row-gemini',
  platform: 'gemini',
  name: 'Google Gemini',
  baseUrl: '',
  apiKey: 'gemini-secret',
  model: ['gemini-2.5-flash'],
  __waylandModelRegistryBridge: 'v2:google-gemini',
});
const NEW_API = row({
  id: 'row-newapi',
  platform: 'new-api',
  name: 'My Gateway',
  baseUrl: 'https://gw.example/v1/',
  apiKey: 'newapi-secret',
  model: ['gpt-4o', 'claude-sonnet-4-5', 'gemini-2.5-pro'],
  modelProtocols: { 'claude-sonnet-4-5': 'anthropic', 'gemini-2.5-pro': 'gemini' },
});

describe('fuigoByokProvidersFromRows', () => {
  it('yields nothing for no rows', () => {
    expect(fuigoByokProvidersFromRows([])).toEqual([]);
    expect(buildFuigoManagedConfig([])).toBe(FUIGO_MANAGED_CONFIG);
  });

  it('maps one OpenAI row to chat_completions entries keyed by a provider env var', () => {
    const [p] = fuigoByokProvidersFromRows([OPENAI]);
    expect(p).toMatchObject({ envKey: 'WAYLAND_BYOK_OPENAI_API_KEY', apiKey: 'sk-openai-secret' });
    expect(p.entries).toEqual([
      {
        id: 'byok/openai/gpt-4o',
        name: 'gpt-4o · OpenAI',
        model: 'gpt-4o',
        baseUrl: 'https://api.openai.com/v1',
        apiBackend: 'chat_completions',
        envKey: 'WAYLAND_BYOK_OPENAI_API_KEY',
      },
    ]);
  });

  it('maps an Anthropic row to the messages surface with a /v1 base', () => {
    const [p] = fuigoByokProvidersFromRows([ANTHROPIC]);
    expect(p.envKey).toBe('WAYLAND_BYOK_ANTHROPIC_API_KEY');
    expect(p.entries.map((e) => e.id)).toEqual(['byok/anthropic/claude-sonnet-4-5', 'byok/anthropic/claude-haiku-4-5']);
    expect(p.entries[0]).toMatchObject({ apiBackend: 'messages', baseUrl: 'https://api.anthropic.com/v1' });
  });

  it('keeps two providers apart and excludes the Flux row', () => {
    const providers = fuigoByokProvidersFromRows([FLUX, OPENAI, ANTHROPIC]);
    expect(providers.map((p) => p.envKey)).toEqual(['WAYLAND_BYOK_OPENAI_API_KEY', 'WAYLAND_BYOK_ANTHROPIC_API_KEY']);
    const ids = providers.flatMap((p) => p.entries.map((e) => e.id));
    expect(ids).not.toContainEqual(expect.stringContaining('flux'));
    expect(ids).toHaveLength(3);
  });

  it('skips disabled rows, keyless cloud rows and every credential Fuigo cannot present', () => {
    const rows = [
      row({ enabled: false }),
      row({ id: 'r-nokey', apiKey: '   ' }),
      row({
        id: 'r-nokey-custom',
        platform: 'custom',
        name: 'Remote',
        baseUrl: 'https://api.remote.example/v1',
        apiKey: '',
      }),
      row({ id: 'r-gauth', platform: 'gemini-with-google-auth', name: 'Gemini Google' }),
      row({ id: 'r-vertex', platform: 'gemini-vertex-ai', name: 'Vertex' }),
      row({ id: 'r-bed', platform: 'bedrock', name: 'Bedrock' }),
      row({
        id: 'r-chatgpt',
        platform: 'openai-compatible',
        name: 'ChatGPT',
        baseUrl: 'https://x/v1',
        __waylandModelRegistryBridge: 'v2:chatgpt-subscription',
      }),
      row({
        id: 'r-azure',
        platform: 'openai-compatible',
        name: 'Azure',
        baseUrl: 'https://x/v1',
        __waylandModelRegistryBridge: 'v2:azure',
      }),
      row({ id: 'r-compat-nourl', platform: 'openai-compatible', name: 'No URL', baseUrl: '' }),
      row({ id: 'r-nomodels', model: [] }),
    ];
    expect(fuigoByokProvidersFromRows(rows)).toEqual([]);
  });

  it.each(['replicate', 'stability', 'deepgram', 'assemblyai', 'elevenlabs'])(
    'skips the %s registry row: it has no Chat Completions surface',
    (id) => {
      const mirrored = row({ platform: 'openai-compatible', name: id, __waylandModelRegistryBridge: `v2:${id}` });
      expect(fuigoByokProvidersFromRows([mirrored])).toEqual([]);
    }
  );

  it('honours per-model disables and drops duplicate model ids', () => {
    const [p] = fuigoByokProvidersFromRows([
      row({ model: ['gpt-4o', 'gpt-4o', 'o3-mini'], modelEnabled: { 'o3-mini': false } }),
    ]);
    expect(p.entries.map((e) => e.model)).toEqual(['gpt-4o']);
  });

  it('fills a registry-mirrored OpenAI-compatible row with its canonical chat base', () => {
    const [groq, hand] = fuigoByokProvidersFromRows([
      row({
        id: 'r-groq',
        platform: 'openai-compatible',
        name: 'Groq',
        baseUrl: '',
        model: ['llama-3.3-70b'],
        __waylandModelRegistryBridge: 'v2:groq',
      }),
      row({ id: 'r-hand', platform: 'openai-compatible', name: 'Hand added', baseUrl: '', model: ['x'] }),
    ]);
    expect(groq.entries[0]).toMatchObject({ id: 'byok/groq/llama-3.3-70b', baseUrl: 'https://api.groq.com/openai/v1' });
    expect(hand).toBeUndefined();
  });

  it('accepts a custom OpenAI-compatible endpoint and strips the trailing slash', () => {
    const [p] = fuigoByokProvidersFromRows([
      row({
        platform: 'openai-compatible',
        name: 'Groq Cloud',
        baseUrl: 'https://api.groq.com/openai/v1/',
        model: ['llama-3.3-70b'],
        contextLimit: 131072,
      }),
    ]);
    expect(p.envKey).toBe('WAYLAND_BYOK_GROQ_CLOUD_API_KEY');
    expect(p.entries[0]).toMatchObject({
      id: 'byok/groq-cloud/llama-3.3-70b',
      baseUrl: 'https://api.groq.com/openai/v1',
      contextWindow: 131072,
    });
  });
});

describe('local OpenAI-compatible servers (Ollama, LM Studio, llama.cpp)', () => {
  it('maps the keyless Ollama mirror row to its loopback base with the placeholder key', () => {
    expect(fuigoByokProvidersFromRows([OLLAMA])).toEqual([
      {
        envKey: 'WAYLAND_BYOK_OLLAMA_LOCAL_API_KEY',
        apiKey: LOCAL_KEYLESS_PLACEHOLDER,
        entries: [
          {
            id: 'byok/ollama-local/qwen3:8b',
            name: 'qwen3:8b · Ollama Local',
            model: 'qwen3:8b',
            baseUrl: 'http://127.0.0.1:11434/v1',
            apiBackend: 'chat_completions',
            envKey: 'WAYLAND_BYOK_OLLAMA_LOCAL_API_KEY',
          },
        ],
      },
    ]);
  });

  it('maps a hand-added keyless LM Studio row on localhost', () => {
    const [p] = fuigoByokProvidersFromRows([
      row({
        platform: 'custom',
        name: 'LM Studio',
        baseUrl: 'http://localhost:1234/v1/',
        apiKey: '',
        model: ['qwen2.5-7b'],
      }),
    ]);
    expect(p).toMatchObject({ envKey: 'WAYLAND_BYOK_LM_STUDIO_API_KEY', apiKey: LOCAL_KEYLESS_PLACEHOLDER });
    expect(p.entries[0]).toMatchObject({ id: 'byok/lm-studio/qwen2.5-7b', baseUrl: 'http://localhost:1234/v1' });
  });

  it('keeps a real key on a local server that has one', () => {
    const [p] = fuigoByokProvidersFromRows([
      row({ platform: 'custom', name: 'vLLM', baseUrl: 'http://127.0.0.1:8000/v1', apiKey: 'vllm-token' }),
    ]);
    expect(p.apiKey).toBe('vllm-token');
  });
});

describe('hosted OpenAI-compatible providers', () => {
  it.each([
    ['openrouter', 'https://openrouter.ai/api/v1'],
    ['deepseek', 'https://api.deepseek.com/v1'],
    ['groq', 'https://api.groq.com/openai/v1'],
    ['together', 'https://api.together.xyz/v1'],
    ['mistral', 'https://api.mistral.ai/v1'],
    ['xai', 'https://api.x.ai/v1'],
    ['ollama-cloud', 'https://ollama.com/v1'],
    ['cohere', 'https://api.cohere.ai/compatibility/v1'],
    ['huggingface', 'https://router.huggingface.co/v1'],
  ])('maps the registry %s row to %s', (id, baseUrl) => {
    const [p] = fuigoByokProvidersFromRows([
      row({
        platform: 'openai-compatible',
        name: id,
        baseUrl: '',
        model: ['m-1'],
        __waylandModelRegistryBridge: `v2:${id}`,
      }),
    ]);
    expect(p.entries).toEqual([
      expect.objectContaining({ id: `byok/${id}/m-1`, baseUrl, apiBackend: 'chat_completions', envKey: p.envKey }),
    ]);
    expect(p.apiKey).toBe('sk-openai-secret');
  });

  it('maps a hand-added OpenRouter row (legacy `custom` platform)', () => {
    const [p] = fuigoByokProvidersFromRows([
      row({
        platform: 'custom',
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: 'or-secret',
        model: ['anthropic/claude-sonnet-4.5'],
      }),
    ]);
    expect(p).toMatchObject({ envKey: 'WAYLAND_BYOK_OPENROUTER_API_KEY', apiKey: 'or-secret' });
    expect(p.entries[0]).toMatchObject({
      id: 'byok/openrouter/anthropic/claude-sonnet-4.5',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiBackend: 'chat_completions',
    });
  });
});

describe('Gemini', () => {
  it("maps a Gemini API-key row to Google's OpenAI-compatible surface", () => {
    const [p] = fuigoByokProvidersFromRows([GEMINI]);
    expect(p).toMatchObject({ envKey: 'WAYLAND_BYOK_GOOGLE_GEMINI_API_KEY', apiKey: 'gemini-secret' });
    expect(p.entries).toEqual([
      expect.objectContaining({
        id: 'byok/google-gemini/gemini-2.5-flash',
        baseUrl: GEMINI_OPENAI_BASE_URL,
        apiBackend: 'chat_completions',
      }),
    ]);
    expect(GEMINI_OPENAI_BASE_URL).toBe('https://generativelanguage.googleapis.com/v1beta/openai');
  });

  it("accepts Google's own host as the saved base and refuses a native-protocol proxy", () => {
    const [google] = fuigoByokProvidersFromRows([
      row({ platform: 'gemini', name: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com' }),
    ]);
    expect(google.entries[0].baseUrl).toBe(GEMINI_OPENAI_BASE_URL);
    expect(
      fuigoByokProvidersFromRows([row({ platform: 'gemini', name: 'Gemini', baseUrl: 'https://gemini-proxy.example' })])
    ).toEqual([]);
  });
});

describe('New API gateway', () => {
  it('routes each model by its protocol and drops the Gemini-protocol ones', () => {
    const [p] = fuigoByokProvidersFromRows([NEW_API]);
    expect(p.envKey).toBe('WAYLAND_BYOK_MY_GATEWAY_API_KEY');
    expect(p.entries.map(({ id, baseUrl, apiBackend }) => ({ id, baseUrl, apiBackend }))).toEqual([
      { id: 'byok/my-gateway/gpt-4o', baseUrl: 'https://gw.example/v1', apiBackend: 'chat_completions' },
      { id: 'byok/my-gateway/claude-sonnet-4-5', baseUrl: 'https://gw.example/v1', apiBackend: 'messages' },
    ]);
  });
});

describe('fuigoAzureByokProvider', () => {
  it('maps an Azure resource to its v1 surface with the key in both auth headers', () => {
    const p = fuigoAzureByokProvider({
      endpoint: 'https://my-res.openai.azure.com/openai/deployments/gpt-4o?api-version=2024-10-21',
      apiKey: 'azure-secret',
      models: ['gpt-4o', 'gpt-4o', 'o4-mini'],
    });
    expect(p).toEqual({
      envKey: 'WAYLAND_BYOK_AZURE_API_KEY',
      apiKey: 'azure-secret',
      entries: ['gpt-4o', 'o4-mini'].map((model) => ({
        id: `byok/azure/${model}`,
        name: `${model} · Azure OpenAI`,
        model,
        baseUrl: 'https://my-res.openai.azure.com/openai/v1',
        apiBackend: 'chat_completions',
        envKey: 'WAYLAND_BYOK_AZURE_API_KEY',
        envHttpHeaders: { 'api-key': 'WAYLAND_BYOK_AZURE_API_KEY' },
      })),
    });
  });

  it('refuses a non-https endpoint, an unparseable one, an empty key and an empty catalog', () => {
    const ok = { endpoint: 'https://my-res.openai.azure.com', apiKey: 'k', models: ['gpt-4o'] };
    expect(fuigoAzureByokProvider(ok)).toBeDefined();
    expect(fuigoAzureByokProvider({ ...ok, endpoint: 'http://my-res.openai.azure.com' })).toBeUndefined();
    expect(fuigoAzureByokProvider({ ...ok, endpoint: 'my-res' })).toBeUndefined();
    expect(fuigoAzureByokProvider({ ...ok, apiKey: ' ' })).toBeUndefined();
    expect(fuigoAzureByokProvider({ ...ok, models: [] })).toBeUndefined();
  });
});

describe('buildFuigoManagedConfig', () => {
  it('writes one [model.<id>] block per entry, with env_key and never the key', () => {
    const providers = fuigoByokProvidersFromRows([OPENAI, ANTHROPIC]);
    const toml = buildFuigoManagedConfig(providers.flatMap((p) => p.entries));
    expect(toml.startsWith(FUIGO_MANAGED_CONFIG)).toBe(true);
    expect(toml).toContain(
      '[model."byok/openai/gpt-4o"]\nmodel = "gpt-4o"\nname = "gpt-4o · OpenAI"\nbase_url = "https://api.openai.com/v1"\napi_backend = "chat_completions"\nenv_key = "WAYLAND_BYOK_OPENAI_API_KEY"\n'
    );
    expect(toml).toContain('[model."byok/anthropic/claude-sonnet-4-5"]');
    expect(toml).toContain(
      'api_backend = "messages"\nenv_key = "WAYLAND_BYOK_ANTHROPIC_API_KEY"\nauth_scheme = "x_api_key"\nextra_headers = { "anthropic-version" = "2023-06-01" }\n'
    );
    expect(toml.match(/^\[model\./gm)).toHaveLength(3);
    expect(toml).not.toContain('sk-openai-secret');
    expect(toml).not.toContain('sk-ant-secret');
    expect(toml).not.toMatch(/^api_key\s*=/m);
    expect(toml).not.toContain('[models]');
  });

  it('writes Azure api-key as an env header, never a value', () => {
    const azure = fuigoAzureByokProvider({
      endpoint: 'https://r.openai.azure.com',
      apiKey: 'azure-secret',
      models: ['gpt-4o'],
    });
    const toml = buildFuigoManagedConfig(azure!.entries);
    expect(toml).toContain(
      'env_key = "WAYLAND_BYOK_AZURE_API_KEY"\nenv_http_headers = { "api-key" = "WAYLAND_BYOK_AZURE_API_KEY" }\n'
    );
    expect(toml).not.toContain('azure-secret');
  });

  it('puts no key of any provider type on disk, and every entry names its own env_key', () => {
    const secrets = ['sk-openai-secret', 'sk-ant-secret', 'gemini-secret', 'newapi-secret', 'azure-secret', 'sk-flux'];
    const providers = [
      ...fuigoByokProvidersFromRows([FLUX, OPENAI, ANTHROPIC, OLLAMA, GEMINI, NEW_API]),
      fuigoAzureByokProvider({ endpoint: 'https://r.openai.azure.com', apiKey: 'azure-secret', models: ['gpt-4o'] })!,
    ];
    const toml = buildFuigoManagedConfig(
      providers.flatMap((p) => p.entries),
      { defaultModel: 'byok/ollama-local/qwen3:8b' }
    );
    for (const secret of secrets) expect(toml).not.toContain(secret);
    expect(toml).not.toMatch(/^api_key\s*=/m);
    const blocks = toml.split(/^\[model\./m).slice(1);
    expect(blocks).toHaveLength(8);
    for (const block of blocks) expect(block).toMatch(/^env_key = "WAYLAND_BYOK_[A-Z0-9_]+_API_KEY"$/m);
  });

  it('writes [models] default only when one is named', () => {
    expect(buildFuigoManagedConfig([], { defaultModel: 'byok/ollama-local/qwen3:8b' })).toBe(
      `${FUIGO_MANAGED_CONFIG}\n[models]\ndefault = "byok/ollama-local/qwen3:8b"\n`
    );
  });

  it('escapes TOML string content', () => {
    const toml = buildFuigoManagedConfig([
      {
        id: 'byok/x/a"b\\c',
        name: 'tab\there',
        model: 'a"b\\c',
        baseUrl: 'https://h/v1',
        apiBackend: 'chat_completions',
        envKey: 'K',
      },
    ]);
    expect(toml).toContain('[model."byok/x/a\\"b\\\\c"]');
    expect(toml).toContain('name = "tab\\u0009here"');
  });
});

describe('fuigoByokSpawnPlan', () => {
  const FLUX_KEY = 'sk-flux-belongs-to-flux-only';

  it('hands the local provider the placeholder in its own env var, never the Flux key', () => {
    const providers = fuigoByokProvidersFromRows([{ ...FLUX, apiKey: FLUX_KEY } as IProvider, OLLAMA, OPENAI]);
    const plan = fuigoByokSpawnPlan(providers, { fluxKey: true });
    expect(plan.env).toEqual({
      WAYLAND_BYOK_OLLAMA_LOCAL_API_KEY: LOCAL_KEYLESS_PLACEHOLDER,
      WAYLAND_BYOK_OPENAI_API_KEY: 'sk-openai-secret',
    });
    expect(Object.values(plan.env)).not.toContain(FLUX_KEY);
    // Fuigo falls back to FUIGO_API_KEY only when a model's env_key does not
    // resolve; the local entry names a var this very env sets.
    const local = plan.config.split(/^\[model\./m).find((b) => b.startsWith('"byok/ollama-local/'));
    expect(local).toContain('base_url = "http://127.0.0.1:11434/v1"\n');
    expect(local).toContain('env_key = "WAYLAND_BYOK_OLLAMA_LOCAL_API_KEY"\n');
    expect(plan.config).not.toContain(FLUX_KEY);
    expect(plan.config).not.toContain('[models]');
  });

  it('makes the first BYOK model the default when there is no Flux key', () => {
    const plan = fuigoByokSpawnPlan(fuigoByokProvidersFromRows([OLLAMA, OPENAI]), { fluxKey: false });
    expect(plan.config).toContain('\n[models]\ndefault = "byok/ollama-local/qwen3:8b"\n');
    expect(fuigoByokSpawnPlan([], { fluxKey: false }).config).toBe(FUIGO_MANAGED_CONFIG);
  });
});
