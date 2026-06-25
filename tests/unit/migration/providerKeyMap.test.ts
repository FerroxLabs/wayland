/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  providerFromHermesEnv,
  providerFromOpenClawName,
  providerFromKeyShape,
  redactKey,
} from '../../../src/process/services/import/migration/providerKeyMap';

describe('migration provider mapping', () => {
  it('maps Hermes env var names to Wayland provider ids', () => {
    expect(providerFromHermesEnv('ANTHROPIC_API_KEY')).toBe('anthropic');
    expect(providerFromHermesEnv('openrouter_api_key')).toBe('openrouter'); // case-insensitive
    expect(providerFromHermesEnv('GOOGLE_API_KEY')).toBe('google-gemini');
    expect(providerFromHermesEnv('GEMINI_API_KEY')).toBe('google-gemini');
    expect(providerFromHermesEnv('HF_API_KEY')).toBe('huggingface');
  });

  it('does not map channel/tool tokens as providers', () => {
    expect(providerFromHermesEnv('SLACK_BOT_TOKEN')).toBeNull();
    expect(providerFromHermesEnv('TELEGRAM_BOT_TOKEN')).toBeNull();
    expect(providerFromHermesEnv('PATH')).toBeNull();
  });

  it('maps OpenClaw provider slugs, normalizing google -> google-gemini', () => {
    expect(providerFromOpenClawName('anthropic')).toBe('anthropic');
    expect(providerFromOpenClawName('google')).toBe('google-gemini');
    expect(providerFromOpenClawName('Gemini')).toBe('google-gemini');
    expect(providerFromOpenClawName('grok')).toBe('xai');
    expect(providerFromOpenClawName('nonsense')).toBeNull();
  });

  it('recognizes a provider from the key prefix as a fallback', () => {
    expect(providerFromKeyShape('sk-ant-api03-xxxx')).toBe('anthropic');
    expect(providerFromKeyShape('AIzaSyAbc')).toBe('google-gemini');
    expect(providerFromKeyShape('gsk_xxx')).toBe('groq');
  });

  it('returns null for an ambiguous bare sk- key rather than guessing', () => {
    expect(providerFromKeyShape('sk-abcdef1234567890')).toBeNull();
    expect(providerFromKeyShape('')).toBeNull();
  });

  it('redacts a key to a short non-reversible descriptor', () => {
    expect(redactKey('sk-ant-api03-abcdef1a2b')).toBe('sk-ant…1a2b');
    expect(redactKey('short')).toBe('••••');
  });
});
