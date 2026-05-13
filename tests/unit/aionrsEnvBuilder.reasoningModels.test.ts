/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildSpawnConfig, defaultMaxTokensForModel } from '../../src/process/agent/aionrs/envBuilder';
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
});

describe('buildSpawnConfig — reasoning model max_tokens fallback', () => {
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
});
