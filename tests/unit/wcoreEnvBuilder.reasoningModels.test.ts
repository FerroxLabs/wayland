/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildSpawnConfig, defaultMaxTokensForModel } from '../../src/process/agent/wcore/envBuilder';
import type { TProviderWithModel } from '../../src/common/config/storage';

function makeModel(platform: string, useModel: string): TProviderWithModel {
  return {
    id: 'test-provider',
    platform,
    name: 'Test Provider',
    baseUrl: '',
    apiKey: 'test-key',
    useModel,
  };
}

function maxTokensArg(args: string[]): string | undefined {
  const i = args.indexOf('--max-tokens');
  return i === -1 ? undefined : args[i + 1];
}

describe('defaultMaxTokensForModel', () => {
  it('returns 32768 for Gemini Pro Preview reasoning models', () => {
    expect(defaultMaxTokensForModel('gemini-3.1-pro-preview')).toBe(32768);
  });

  it('returns 32768 for Gemini 2.5 Pro', () => {
    expect(defaultMaxTokensForModel('gemini-2.5-pro')).toBe(32768);
  });

  it('returns undefined for Gemini Flash (non-reasoning)', () => {
    expect(defaultMaxTokensForModel('gemini-2.5-flash')).toBeUndefined();
  });

  it('returns undefined for Anthropic Claude models (no thinking-token issue)', () => {
    expect(defaultMaxTokensForModel('claude-sonnet-4-6')).toBeUndefined();
  });

  it('matches case-insensitively', () => {
    expect(defaultMaxTokensForModel('Gemini-3.1-Pro-Preview')).toBe(32768);
  });

  it('returns 32768 for OpenAI o-series reasoning models (o1, o3, o3-mini, o4, o4-mini)', () => {
    expect(defaultMaxTokensForModel('o1')).toBe(32768);
    expect(defaultMaxTokensForModel('o3')).toBe(32768);
    expect(defaultMaxTokensForModel('o3-mini')).toBe(32768);
    expect(defaultMaxTokensForModel('o4')).toBe(32768);
    expect(defaultMaxTokensForModel('o4-mini')).toBe(32768);
  });

  it('matches o-series case-insensitively (O1, O3-Mini)', () => {
    expect(defaultMaxTokensForModel('O1')).toBe(32768);
    expect(defaultMaxTokensForModel('O3-Mini')).toBe(32768);
  });

  it('returns undefined for non-reasoning models with similar prefixes (gpt-4o, gpt-4o-mini)', () => {
    expect(defaultMaxTokensForModel('gpt-4o')).toBeUndefined();
    expect(defaultMaxTokensForModel('gpt-4o-mini')).toBeUndefined();
  });

  it('still routes o1-preview through the suffix pattern (already-covered case)', () => {
    expect(defaultMaxTokensForModel('o1-preview')).toBe(32768);
  });

  it('returns 32768 for the reasoning-capable Flux tiers (flux-auto, flux-reasoning) - #422', () => {
    expect(defaultMaxTokensForModel('flux-auto')).toBe(32768);
    expect(defaultMaxTokensForModel('flux-reasoning')).toBe(32768);
  });

  it('matches Flux tiers case-insensitively (Flux-Auto)', () => {
    expect(defaultMaxTokensForModel('Flux-Auto')).toBe(32768);
  });

  it('returns undefined for the non-reasoning Flux tiers (flux-fast, flux-standard)', () => {
    expect(defaultMaxTokensForModel('flux-fast')).toBeUndefined();
    expect(defaultMaxTokensForModel('flux-standard')).toBeUndefined();
  });
});

describe('buildSpawnConfig - reasoning model max_tokens fallback', () => {
  const workspace = '/tmp/test-workspace';

  it('injects default --max-tokens 32768 for gemini-3.1-pro-preview', () => {
    const { args } = buildSpawnConfig(makeModel('gemini', 'gemini-3.1-pro-preview'), { workspace });
    expect(maxTokensArg(args)).toBe('32768');
  });

  it('injects default --max-tokens 32768 for gemini-2.5-pro', () => {
    const { args } = buildSpawnConfig(makeModel('gemini', 'gemini-2.5-pro'), { workspace });
    expect(maxTokensArg(args)).toBe('32768');
  });

  it('does NOT inject --max-tokens for gemini-2.5-flash', () => {
    const { args } = buildSpawnConfig(makeModel('gemini', 'gemini-2.5-flash'), { workspace });
    expect(maxTokensArg(args)).toBeUndefined();
  });

  it('does NOT inject --max-tokens for Anthropic claude-sonnet-4-6', () => {
    const { args } = buildSpawnConfig(makeModel('anthropic', 'claude-sonnet-4-6'), { workspace });
    expect(maxTokensArg(args)).toBeUndefined();
  });

  it('explicit options.maxTokens=8000 overrides the default for reasoning models', () => {
    const { args } = buildSpawnConfig(makeModel('gemini', 'gemini-3.1-pro-preview'), {
      workspace,
      maxTokens: 8000,
    });
    expect(maxTokensArg(args)).toBe('8000');
  });

  it('explicit options.maxTokens=8000 is preserved for non-reasoning models', () => {
    const { args } = buildSpawnConfig(makeModel('gemini', 'gemini-2.5-flash'), {
      workspace,
      maxTokens: 8000,
    });
    expect(maxTokensArg(args)).toBe('8000');
  });

  it('matches reasoning-model pattern case-insensitively (Gemini-3.1-Pro-Preview)', () => {
    const { args } = buildSpawnConfig(makeModel('gemini', 'Gemini-3.1-Pro-Preview'), { workspace });
    expect(maxTokensArg(args)).toBe('32768');
  });

  it('injects default --max-tokens 32768 for flux-auto (#422)', () => {
    const { args } = buildSpawnConfig(makeModel('flux-router', 'flux-auto'), { workspace });
    expect(maxTokensArg(args)).toBe('32768');
  });

  it('does NOT inject --max-tokens for flux-fast', () => {
    const { args } = buildSpawnConfig(makeModel('flux-router', 'flux-fast'), { workspace });
    expect(maxTokensArg(args)).toBeUndefined();
  });
});

describe('buildSpawnConfig - resolvedMaxTokens return value', () => {
  const workspace = '/tmp/test-workspace';

  it('returns resolvedMaxTokens=32768 for a reasoning model when caller omits maxTokens', () => {
    const { resolvedMaxTokens } = buildSpawnConfig(makeModel('gemini', 'gemini-2.5-pro'), { workspace });
    expect(resolvedMaxTokens).toBe(32768);
  });

  it('returns resolvedMaxTokens matching the caller value when explicitly set', () => {
    const { resolvedMaxTokens } = buildSpawnConfig(makeModel('gemini', 'gemini-2.5-pro'), {
      workspace,
      maxTokens: 12345,
    });
    expect(resolvedMaxTokens).toBe(12345);
  });

  it('returns resolvedMaxTokens=undefined for a non-reasoning model with no explicit maxTokens', () => {
    const { resolvedMaxTokens } = buildSpawnConfig(makeModel('gemini', 'gemini-2.5-flash'), { workspace });
    expect(resolvedMaxTokens).toBeUndefined();
  });
});

describe('buildSpawnConfig - raw-engine (power-user) mode', () => {
  const workspace = '/tmp/test-workspace';

  it('emits ONLY the session-protocol args - no Desktop overrides leak in', () => {
    const { args } = buildSpawnConfig(makeModel('anthropic', 'claude-opus-4-8'), {
      workspace,
      rawEngine: true,
      sessionId: 'sess-1',
      // Everything below must be ignored in raw mode:
      maxTokens: 9000,
      maxTurns: 50,
      systemPrompt: 'you are wayland',
      autoApprove: true,
    });
    expect(args).toEqual(['--json-stream', '--session-id', 'sess-1']);
    // Explicitly assert each override flag is absent.
    for (const flag of [
      '--provider',
      '--model',
      '--max-tokens',
      '--max-turns',
      '--system-prompt',
      '--auto-approve',
      '--base-url',
    ]) {
      expect(args).not.toContain(flag);
    }
  });

  it('forwards NO provider auth env and writes no project config in raw mode', () => {
    const { env, projectConfig, resolvedMaxTokens } = buildSpawnConfig(makeModel('anthropic', 'claude-opus-4-8'), {
      workspace,
      rawEngine: true,
      sessionId: 'sess-1',
    });
    expect(env).toEqual({});
    expect(projectConfig).toBe('');
    expect(resolvedMaxTokens).toBeUndefined();
  });

  it('passes --resume (not --session-id) when resuming in raw mode', () => {
    const { args } = buildSpawnConfig(makeModel('openai', 'gpt-5.1'), {
      workspace,
      rawEngine: true,
      resume: 'conv-42',
      sessionId: 'sess-ignored',
    });
    expect(args).toEqual(['--json-stream', '--resume', 'conv-42']);
  });

  it('non-raw spawn still emits the provider/model override (control)', () => {
    const { args, env } = buildSpawnConfig(makeModel('anthropic', 'claude-opus-4-8'), {
      workspace,
      sessionId: 'sess-1',
    });
    expect(args).toContain('--provider');
    expect(args).toContain('anthropic');
    expect(args).toContain('--model');
    expect(env.ANTHROPIC_API_KEY).toBe('test-key');
  });
});
