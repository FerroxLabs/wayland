/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildSpawnConfig, isOpenAIFamilyModelId } from '../../src/process/agent/wcore/envBuilder';
import type { TProviderWithModel } from '../../src/common/config/storage';

// A brand-new OpenAI model (gpt-5.6-sol / -luna / -terra) exists only in the
// models.dev catalog cache and is NOT owned by any configured OpenAI provider,
// so on selection it inherits the agent's current/default `platform`. For a
// Claude-default agent that platform is `'anthropic'`, which used to route the
// model to `--provider anthropic` -> the reported
// `400 invalid_request_error: "The 'gpt-5.6-sol' model does not exist"` with an
// Anthropic-shaped error envelope. The native Anthropic surface only serves
// `claude-*`; an OpenAI-family id must resolve to an OpenAI-compatible surface.

function makeModel(platform: string, useModel: string, extra: Partial<TProviderWithModel> = {}): TProviderWithModel {
  return {
    id: 'test-provider',
    platform,
    name: 'Test Provider',
    baseUrl: '',
    apiKey: 'test-key',
    useModel,
    ...extra,
  };
}

/** The value passed after `--provider` in the spawn args. */
function providerArg(args: string[]): string | undefined {
  const i = args.indexOf('--provider');
  return i === -1 ? undefined : args[i + 1];
}

describe('mapProvider - OpenAI-family models never route to the Anthropic surface', () => {
  const workspace = '/tmp/test-workspace';

  // The exact reported models plus representative siblings. Even when the
  // incoming platform is 'anthropic' (the stale-default bug), the spawn must
  // resolve to an OpenAI-compatible surface, never `anthropic`.
  const openaiFamily = [
    'gpt-5.6-sol',
    'gpt-5.6-luna',
    'gpt-5.6-terra',
    'gpt-4o',
    'gpt-5.1',
    'o3-mini',
    'chatgpt-4o-latest',
  ];

  for (const model of openaiFamily) {
    it(`routes ${model} to openai (NOT anthropic) even when platform='anthropic'`, () => {
      const { args } = buildSpawnConfig(makeModel('anthropic', model), { workspace });
      expect(providerArg(args)).toBe('openai');
      expect(args).not.toContain('anthropic');
    });
  }

  it('never leaks the model Anthropic key as OPENAI_API_KEY when no OpenAI key is sourced', () => {
    // The catalog-only model's OWN apiKey is the ANTHROPIC key (makeModel default
    // 'test-key'). With no OpenAI key sourced it must NOT be injected as
    // OPENAI_API_KEY (that would be the doomed wrong-key spawn); instead the spawn
    // is flagged missing-key so the caller shows the credential-recovery card.
    const { args, env, missingRequiredApiKey } = buildSpawnConfig(makeModel('anthropic', 'gpt-5.6-sol'), { workspace });
    expect(providerArg(args)).toBe('openai');
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(missingRequiredApiKey).toBe(true);
  });

  it('injects the SEPARATELY-SOURCED OpenAI key (not the model Anthropic key) when one is available', () => {
    const { args, env, missingRequiredApiKey } = buildSpawnConfig(
      makeModel('anthropic', 'gpt-5.6-sol', { apiKey: 'sk-ant-model-key' }),
      { workspace, openAiApiKey: 'sk-openai-sourced' }
    );
    expect(providerArg(args)).toBe('openai');
    expect(env.OPENAI_API_KEY).toBe('sk-openai-sourced');
    expect(env.OPENAI_API_KEY).not.toBe('sk-ant-model-key');
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(missingRequiredApiKey).toBe(false);
    expect(args).not.toContain('--base-url');
  });

  it('leaves a genuine anthropic model on the anthropic surface', () => {
    const { args, env } = buildSpawnConfig(makeModel('anthropic', 'claude-opus-4-8'), { workspace });
    expect(providerArg(args)).toBe('anthropic');
    expect(env.ANTHROPIC_API_KEY).toBe('test-key');
  });

  it('leaves other anthropic model ids (sonnet/haiku) on the anthropic surface', () => {
    for (const claude of ['claude-sonnet-4-6', 'claude-haiku-4', 'claude-3-opus']) {
      const { args } = buildSpawnConfig(makeModel('anthropic', claude), { workspace });
      expect(providerArg(args)).toBe('anthropic');
    }
  });

  it('a normal openai-platform gpt model is unaffected (control)', () => {
    const { args } = buildSpawnConfig(makeModel('openai', 'gpt-5.6-sol'), { workspace });
    expect(providerArg(args)).toBe('openai');
  });
});

describe('isOpenAIFamilyModelId', () => {
  it('matches the reported gpt-5.6 catalog models', () => {
    expect(isOpenAIFamilyModelId('gpt-5.6-sol')).toBe(true);
    expect(isOpenAIFamilyModelId('gpt-5.6-luna')).toBe(true);
    expect(isOpenAIFamilyModelId('gpt-5.6-terra')).toBe(true);
  });

  it('matches gpt / o-series / chatgpt families', () => {
    expect(isOpenAIFamilyModelId('gpt-4o')).toBe(true);
    expect(isOpenAIFamilyModelId('o1')).toBe(true);
    expect(isOpenAIFamilyModelId('o3-mini')).toBe(true);
    expect(isOpenAIFamilyModelId('chatgpt-4o-latest')).toBe(true);
    expect(isOpenAIFamilyModelId('GPT-5.6-Sol')).toBe(true); // case-insensitive
  });

  it('does NOT match Anthropic claude ids', () => {
    expect(isOpenAIFamilyModelId('claude-opus-4-8')).toBe(false);
    expect(isOpenAIFamilyModelId('claude-sonnet-4-6')).toBe(false);
    expect(isOpenAIFamilyModelId('claude-haiku-4')).toBe(false);
    expect(isOpenAIFamilyModelId('claude-3-opus')).toBe(false);
  });

  it('does NOT match unrelated ids or empty input', () => {
    expect(isOpenAIFamilyModelId('gemini-2.5-pro')).toBe(false);
    expect(isOpenAIFamilyModelId('grok-4')).toBe(false);
    expect(isOpenAIFamilyModelId(undefined)).toBe(false);
    expect(isOpenAIFamilyModelId('')).toBe(false);
  });
});
