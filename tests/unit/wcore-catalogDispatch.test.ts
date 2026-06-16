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

  it('injects a harmless sentinel key for keyless local openai-compatible backends', () => {
    const model = makeNativeModel('openai-compatible', '');
    model.baseUrl = 'http://127.0.0.1:11434/v1';
    const { args, env } = buildSpawnConfig(model, OPTS);

    expect(providerArg(args)).toBe('openai');
    expect(env.OPENAI_API_KEY).toBe('local');
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
