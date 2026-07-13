/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildSpawnConfig } from '../../src/process/agent/wcore/envBuilder';
import type { TProviderWithModel } from '../../src/common/config/storage';

// #865 follow-up: the OpenAI-family-off-Anthropic guard hard-returned `openai`,
// which needs an OPENAI_API_KEY. A customer with a ChatGPT subscription (OAuth)
// but NO OpenAI API key would then hit "No API key found". The engine serves
// these models on BOTH surfaces: `-p openai -m gpt-5.6-sol` (API key) AND
// `-p openai-chatgpt -m gpt-5.6-sol` (keyless ChatGPT-OAuth, token from
// ~/.codex/auth.json). The guard's fallback is now auth-aware: prefer the keyless
// `openai-chatgpt` surface when a ChatGPT subscription is connected, else fall
// back to the API-key `openai` surface (unchanged behavior for key users).

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

describe('mapProvider - auth-aware OpenAI-family fallback (ChatGPT subscription)', () => {
  const workspace = '/tmp/test-workspace';

  // The reported catalog-only models plus representative siblings. Each would
  // otherwise inherit `platform: 'anthropic'` (the stale-default bug).
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
    it(`routes ${model} to openai-chatgpt (keyless) when a ChatGPT subscription is connected`, () => {
      const { args, env, missingRequiredApiKey } = buildSpawnConfig(makeModel('anthropic', model), {
        workspace,
        chatGptSubscriptionAvailable: true,
      });
      expect(providerArg(args)).toBe('openai-chatgpt');
      // Keyless: no key env var, no --base-url, and NOT flagged as missing-key.
      expect(env.OPENAI_API_KEY).toBeUndefined();
      expect(env.ANTHROPIC_API_KEY).toBeUndefined();
      expect(args).not.toContain('--base-url');
      expect(missingRequiredApiKey).toBe(false);
    });

    it(`routes ${model} to openai (API key) when NO ChatGPT subscription is connected`, () => {
      const { args, env } = buildSpawnConfig(makeModel('anthropic', model), {
        workspace,
        chatGptSubscriptionAvailable: false,
      });
      expect(providerArg(args)).toBe('openai');
      expect(env.OPENAI_API_KEY).toBe('test-key');
      expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    });
  }

  it('prefers the keyless openai-chatgpt surface even when an API key is ALSO configured (Sean: has both)', () => {
    // Model carries a real apiKey AND the sub is connected -> keyless wins, and
    // the key is NOT presented (no per-token cost; the #555 rationale).
    const { args, env, missingRequiredApiKey } = buildSpawnConfig(
      makeModel('anthropic', 'gpt-5.6-sol', { apiKey: 'sk-real-openai-key' }),
      { workspace, chatGptSubscriptionAvailable: true }
    );
    expect(providerArg(args)).toBe('openai-chatgpt');
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(missingRequiredApiKey).toBe(false);
  });

  it('sub-only user (no OpenAI API key) is NOT dead-ended: routes keyless, missingRequiredApiKey=false (cplagz)', () => {
    const { args, env, missingRequiredApiKey } = buildSpawnConfig(
      makeModel('anthropic', 'gpt-5.6-sol', { apiKey: '' }),
      { workspace, chatGptSubscriptionAvailable: true }
    );
    expect(providerArg(args)).toBe('openai-chatgpt');
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(missingRequiredApiKey).toBe(false);
  });

  it('defaults to the openai API-key surface when the flag is omitted (back-compat)', () => {
    const { args } = buildSpawnConfig(makeModel('anthropic', 'gpt-5.6-sol'), { workspace });
    expect(providerArg(args)).toBe('openai');
  });

  it('a genuine claude-* model stays on anthropic even when a ChatGPT subscription is connected', () => {
    for (const claude of ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4', 'claude-3-opus']) {
      const { args, env } = buildSpawnConfig(makeModel('anthropic', claude), {
        workspace,
        chatGptSubscriptionAvailable: true,
      });
      expect(providerArg(args)).toBe('anthropic');
      expect(env.ANTHROPIC_API_KEY).toBe('test-key');
    }
  });

  it('a normal openai-platform gpt model is unaffected by the sub flag (control)', () => {
    // platform 'openai' never maps to 'anthropic', so the guard never fires -
    // an explicitly configured OpenAI API-key provider stays on `openai`.
    for (const sub of [true, false]) {
      const { args, env } = buildSpawnConfig(makeModel('openai', 'gpt-5.6-sol'), {
        workspace,
        chatGptSubscriptionAvailable: sub,
      });
      expect(providerArg(args)).toBe('openai');
      expect(env.OPENAI_API_KEY).toBe('test-key');
    }
  });
});
