/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Desktop provider rows → Fuigo `[model.byok/…]` entries. Fuigo under Desktop
 * authenticates with the Flux key alone, so before this every Fuigo chat was
 * Flux-only; a user's Anthropic / OpenAI / OpenAI-compatible key had nothing
 * to attach to. The key must never reach the TOML on disk.
 */
import { describe, expect, it } from 'vitest';
import type { IProvider } from '@/common/config/storage';
import { fuigoByokProvidersFromRows } from '@process/agent/fuigo/byok';
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

  it('skips disabled rows, keyless rows, unsupported platforms and non-key registry providers', () => {
    const rows = [
      row({ enabled: false }),
      row({ id: 'r-nokey', apiKey: '   ' }),
      row({ id: 'r-gem', platform: 'gemini', name: 'Gemini' }),
      row({ id: 'r-bed', platform: 'bedrock', name: 'Bedrock' }),
      row({
        id: 'r-chatgpt',
        platform: 'openai-compatible',
        name: 'ChatGPT',
        baseUrl: 'https://x/v1',
        __waylandModelRegistryBridge: 'v2:chatgpt-subscription',
      }),
      row({ id: 'r-compat-nourl', platform: 'openai-compatible', name: 'No URL', baseUrl: '' }),
      row({ id: 'r-nomodels', model: [] }),
    ];
    expect(fuigoByokProvidersFromRows(rows)).toEqual([]);
  });

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
