/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  buildClaudeCredentialsDoc,
  claudeCredentialsPath,
  parseClaudeCredentialsDoc,
} from '@process/onboarding/claudeCredentialsFile';
import type { AnthropicTokens } from '@process/onboarding/anthropicOAuthCore';

describe('claudeCredentialsPath', () => {
  it('honors CLAUDE_CONFIG_DIR when set', () => {
    const p = claudeCredentialsPath({ CLAUDE_CONFIG_DIR: '/custom/dir' });
    expect(p.replace(/\\/g, '/')).toBe('/custom/dir/.credentials.json');
  });

  it('falls back to ~/.claude when the override is blank', () => {
    const p = claudeCredentialsPath({ CLAUDE_CONFIG_DIR: '   ' });
    expect(p.replace(/\\/g, '/')).toMatch(/\/\.claude\/\.credentials\.json$/);
  });
});

describe('buildClaudeCredentialsDoc', () => {
  it('maps a token bundle into the claudeAiOauth shape', () => {
    const tokens: AnthropicTokens = {
      accessToken: 'sk-ant-oat01-x',
      refreshToken: 'sk-ant-ort01-y',
      expiresAt: 1_700_000_000_000,
      scope: 'user:inference user:profile',
      planType: 'max',
    };
    const doc = buildClaudeCredentialsDoc(tokens);
    expect(doc.claudeAiOauth.accessToken).toBe('sk-ant-oat01-x');
    expect(doc.claudeAiOauth.refreshToken).toBe('sk-ant-ort01-y');
    expect(doc.claudeAiOauth.expiresAt).toBe(1_700_000_000_000);
    expect(doc.claudeAiOauth.scopes).toEqual(['user:inference', 'user:profile']);
    expect(doc.claudeAiOauth.subscriptionType).toBe('max');
  });

  it('defaults scopes when the bundle has none and omits an unknown tier', () => {
    const doc = buildClaudeCredentialsDoc({ accessToken: 'a', refreshToken: 'r', planType: 'unknown' });
    expect(doc.claudeAiOauth.scopes).toEqual(['user:inference', 'user:profile']);
    expect(doc.claudeAiOauth.subscriptionType).toBeUndefined();
  });
});

describe('parseClaudeCredentialsDoc', () => {
  it('round-trips a built document back into a token bundle', () => {
    const tokens: AnthropicTokens = {
      accessToken: 'sk-ant-oat01-x',
      refreshToken: 'sk-ant-ort01-y',
      expiresAt: 1_700_000_000_000,
      scope: 'user:inference user:profile',
      planType: 'max',
    };
    const parsed = parseClaudeCredentialsDoc(buildClaudeCredentialsDoc(tokens));
    expect(parsed).toEqual(tokens);
  });

  it('returns null without a usable access token', () => {
    expect(parseClaudeCredentialsDoc({})).toBeNull();
    expect(parseClaudeCredentialsDoc({ claudeAiOauth: { accessToken: '' } })).toBeNull();
    expect(parseClaudeCredentialsDoc(null)).toBeNull();
  });

  it('parses a minimal real Claude Code credential shape', () => {
    const parsed = parseClaudeCredentialsDoc({
      claudeAiOauth: {
        accessToken: 'sk-ant-oat01-z',
        refreshToken: 'sk-ant-ort01-z',
        expiresAt: 42,
        scopes: ['user:inference'],
        subscriptionType: 'pro',
      },
    });
    expect(parsed?.accessToken).toBe('sk-ant-oat01-z');
    expect(parsed?.scope).toBe('user:inference');
    expect(parsed?.planType).toBe('pro');
    expect(parsed?.expiresAt).toBe(42);
  });
});
