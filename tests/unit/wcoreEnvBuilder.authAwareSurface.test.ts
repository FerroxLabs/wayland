/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildSpawnConfig } from '../../src/process/agent/wcore/envBuilder';
import type { TProviderWithModel } from '../../src/common/config/storage';

// #866 follow-up (reliable-surface preference): a catalog-only OpenAI-family model
// (e.g. gpt-5.6-sol) selected under a Claude-default agent inherits
// `platform: 'anthropic'` and is rebound off the Anthropic surface. The engine
// serves it on BOTH surfaces: `-p openai -m gpt-5.6-sol` (api.openai.com, API key)
// AND `-p openai-chatgpt -m gpt-5.6-sol` (keyless ChatGPT-OAuth, Codex backend).
//
// The Codex backend serves a gpt-5.6-* model ONLY if the ChatGPT account is
// entitled to it (verified live: gpt-5.6-sol -> 400 "not supported ... with a
// ChatGPT account", gpt-5.6-luna -> 404; terra works), whereas api.openai.com
// serves them all. So the guard PREFERS the API-key `openai` surface whenever an
// OpenAI provider key is available (threaded as `openAiApiKey`), and falls back to
// the keyless `openai-chatgpt` surface only for a sub-only user (no OpenAI key).
//
// CRITICAL: the catalog-only model's OWN `apiKey` is the ANTHROPIC key. When the
// guard routes to `openai`, OPENAI_API_KEY is injected from the SOURCED
// `openAiApiKey`, NEVER from `model.apiKey` - injecting the Anthropic key would be
// a worse regression (wrong/empty key -> engine bails "No API key found").

function makeModel(platform: string, useModel: string, extra: Partial<TProviderWithModel> = {}): TProviderWithModel {
  return {
    id: 'test-provider',
    platform,
    name: 'Test Provider',
    baseUrl: '',
    // Default apiKey is the model's OWN platform key. For a catalog-only
    // `platform: 'anthropic'` model that is the ANTHROPIC key - deliberately a
    // recognizable sentinel so a test can assert it never becomes OPENAI_API_KEY.
    apiKey: 'ANTHROPIC-KEY',
    useModel,
    ...extra,
  };
}

/** The value passed after `--provider` in the spawn args. */
function providerArg(args: string[]): string | undefined {
  const i = args.indexOf('--provider');
  return i === -1 ? undefined : args[i + 1];
}

const workspace = '/tmp/test-workspace';
const OPENAI_KEY = 'sk-openai-sourced-key';

describe('mapProvider - reliable-surface preference for catalog-only OpenAI-family models', () => {
  // The reported catalog-only models plus representative siblings. Each inherits
  // `platform: 'anthropic'` (the stale-default bug) and is rebound off Anthropic.
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
    // ── key available: the API-key `openai` surface WINS (the core fix) ──────
    it(`${model}: key + sub -> openai (key WINS over sub), OPENAI_API_KEY injected from the sourced key`, () => {
      const { args, env, missingRequiredApiKey } = buildSpawnConfig(makeModel('anthropic', model), {
        workspace,
        chatGptSubscriptionAvailable: true,
        openAiApiKey: OPENAI_KEY,
      });
      expect(providerArg(args)).toBe('openai');
      expect(env.OPENAI_API_KEY).toBe(OPENAI_KEY);
      // The Anthropic key is never presented, and no --base-url (engine default
      // api.openai.com is the reliable surface).
      expect(env.OPENAI_API_KEY).not.toBe('ANTHROPIC-KEY');
      expect(env.ANTHROPIC_API_KEY).toBeUndefined();
      expect(args).not.toContain('--base-url');
      expect(missingRequiredApiKey).toBe(false);
    });

    it(`${model}: key + no sub -> openai, OPENAI_API_KEY injected from the sourced key`, () => {
      const { args, env, missingRequiredApiKey } = buildSpawnConfig(makeModel('anthropic', model), {
        workspace,
        chatGptSubscriptionAvailable: false,
        openAiApiKey: OPENAI_KEY,
      });
      expect(providerArg(args)).toBe('openai');
      expect(env.OPENAI_API_KEY).toBe(OPENAI_KEY);
      expect(env.ANTHROPIC_API_KEY).toBeUndefined();
      expect(missingRequiredApiKey).toBe(false);
    });

    // ── no key: fall back to the keyless OAuth surface (if a sub is connected) ──
    it(`${model}: no key + sub -> openai-chatgpt (keyless), NO OPENAI_API_KEY, not missing`, () => {
      const { args, env, missingRequiredApiKey } = buildSpawnConfig(makeModel('anthropic', model), {
        workspace,
        chatGptSubscriptionAvailable: true,
      });
      expect(providerArg(args)).toBe('openai-chatgpt');
      expect(env.OPENAI_API_KEY).toBeUndefined();
      expect(env.ANTHROPIC_API_KEY).toBeUndefined();
      expect(args).not.toContain('--base-url');
      expect(missingRequiredApiKey).toBe(false);
    });

    // ── neither signal: key surface, but flagged missing-key for recovery ──────
    it(`${model}: no key + no sub -> openai, NO key injected, flagged missing (recovery card)`, () => {
      const { args, env, missingRequiredApiKey, requiredKeyEnvVar } = buildSpawnConfig(makeModel('anthropic', model), {
        workspace,
      });
      expect(providerArg(args)).toBe('openai');
      expect(env.OPENAI_API_KEY).toBeUndefined();
      expect(env.ANTHROPIC_API_KEY).toBeUndefined();
      expect(missingRequiredApiKey).toBe(true);
      expect(requiredKeyEnvVar).toBe('OPENAI_API_KEY');
    });
  }

  it('the sourced OpenAI key, not the model Anthropic key, is what reaches OPENAI_API_KEY', () => {
    // model.apiKey is a distinct sentinel; only the threaded openAiApiKey may win.
    const { env } = buildSpawnConfig(makeModel('anthropic', 'gpt-5.6-sol', { apiKey: 'ANTHROPIC-KEY-XYZ' }), {
      workspace,
      chatGptSubscriptionAvailable: true,
      openAiApiKey: OPENAI_KEY,
    });
    expect(env.OPENAI_API_KEY).toBe(OPENAI_KEY);
    expect(env.OPENAI_API_KEY).not.toBe('ANTHROPIC-KEY-XYZ');
  });

  it('a whitespace-only openAiApiKey is treated as NO key (falls back to keyless when a sub is connected)', () => {
    const { args, env, missingRequiredApiKey } = buildSpawnConfig(makeModel('anthropic', 'gpt-5.6-sol'), {
      workspace,
      chatGptSubscriptionAvailable: true,
      openAiApiKey: '   ',
    });
    expect(providerArg(args)).toBe('openai-chatgpt');
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(missingRequiredApiKey).toBe(false);
  });

  it('defaults to the openai API-key surface (missing-key) when all auth options are omitted (back-compat)', () => {
    const { args, missingRequiredApiKey } = buildSpawnConfig(makeModel('anthropic', 'gpt-5.6-sol'), { workspace });
    expect(providerArg(args)).toBe('openai');
    expect(missingRequiredApiKey).toBe(true);
  });

  it('a genuine claude-* model stays on anthropic regardless of the auth signals (guard must NOT fire)', () => {
    for (const claude of ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4', 'claude-3-opus']) {
      const { args, env } = buildSpawnConfig(makeModel('anthropic', claude), {
        workspace,
        chatGptSubscriptionAvailable: true,
        openAiApiKey: OPENAI_KEY,
      });
      expect(providerArg(args)).toBe('anthropic');
      // The model's own key (the Anthropic key) is injected as ANTHROPIC_API_KEY,
      // and the sourced OpenAI key is ignored on the anthropic path.
      expect(env.ANTHROPIC_API_KEY).toBe('ANTHROPIC-KEY');
      expect(env.OPENAI_API_KEY).toBeUndefined();
    }
  });

  it('a normal openai-platform gpt model is unaffected by the auth signals (control)', () => {
    // platform 'openai' never maps to 'anthropic', so the guard never fires - an
    // explicitly configured OpenAI API-key provider keeps using its OWN model.apiKey.
    for (const sub of [true, false]) {
      const { args, env } = buildSpawnConfig(makeModel('openai', 'gpt-5.6-sol', { apiKey: 'sk-real-openai' }), {
        workspace,
        chatGptSubscriptionAvailable: sub,
        openAiApiKey: OPENAI_KEY,
      });
      expect(providerArg(args)).toBe('openai');
      expect(env.OPENAI_API_KEY).toBe('sk-real-openai');
    }
  });
});
