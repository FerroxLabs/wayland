/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildSpawnConfig } from '../../src/process/agent/wcore/envBuilder';
import type { TProviderWithModel } from '../../src/common/config/storage';

// #456 — The desktop no longer name-guesses a max_tokens floor. The bundled
// engine (pin v0.12.16) sizes `max_tokens` per-model up front itself
// (`size_output_cap`): a known model is clamped to its real output ceiling, and
// an unknown / router-aliased model gets a conservative floor (8192) that grows
// to 32768 on a reasoning turn (`UNKNOWN_REASONING_CAP`, engine #426). So the
// desktop OMITS `--max-tokens` unless the caller passes an explicit value, and
// lets the engine apply the model-aware budget. Pushing a fixed number could
// only LOWER a known model's real ceiling; omitting is always >= pushing.

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

describe('buildSpawnConfig - max_tokens is omitted unless explicitly set (#456)', () => {
  const workspace = '/tmp/test-workspace';

  // Models that the OLD name-regex would have force-capped at 32768. The engine
  // now sizes all of these itself, so the desktop must emit NO `--max-tokens`.
  const omitCases: Array<[string, string]> = [
    ['gemini', 'gemini-3.1-pro-preview'],
    ['gemini', 'gemini-2.5-pro'],
    ['gemini', 'gemini-2.5-flash'],
    ['gemini', 'Gemini-3.1-Pro-Preview'],
    ['anthropic', 'claude-sonnet-4-6'],
    ['anthropic', 'claude-opus-4-8'],
    ['openai', 'o1'],
    ['openai', 'o3-mini'],
    ['openai', 'gpt-4o'],
    ['openai', 'gpt-5.1'],
    ['flux-router', 'flux-auto'],
    ['flux-router', 'flux-reasoning'],
    ['flux-router', 'flux-fast'],
    ['openai', 'some-openrouter/model-id'],
  ];

  for (const [platform, model] of omitCases) {
    it(`does NOT inject --max-tokens for ${model} (engine sizes it)`, () => {
      const { args, resolvedMaxTokens } = buildSpawnConfig(makeModel(platform, model), { workspace });
      expect(maxTokensArg(args)).toBeUndefined();
      expect(resolvedMaxTokens).toBeUndefined();
    });
  }

  it('passes an explicit caller maxTokens through for a reasoning model', () => {
    const { args, resolvedMaxTokens } = buildSpawnConfig(makeModel('gemini', 'gemini-3.1-pro-preview'), {
      workspace,
      maxTokens: 8000,
    });
    expect(maxTokensArg(args)).toBe('8000');
    expect(resolvedMaxTokens).toBe(8000);
  });

  it('passes an explicit caller maxTokens through for a non-reasoning model', () => {
    const { args, resolvedMaxTokens } = buildSpawnConfig(makeModel('gemini', 'gemini-2.5-flash'), {
      workspace,
      maxTokens: 12345,
    });
    expect(maxTokensArg(args)).toBe('12345');
    expect(resolvedMaxTokens).toBe(12345);
  });

  it('passes an explicit caller maxTokens through for flux-auto', () => {
    const { args, resolvedMaxTokens } = buildSpawnConfig(makeModel('flux-router', 'flux-auto'), {
      workspace,
      maxTokens: 16384,
    });
    expect(maxTokensArg(args)).toBe('16384');
    expect(resolvedMaxTokens).toBe(16384);
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
