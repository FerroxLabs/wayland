/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * A local Ollama server answers an unauthenticated request perfectly happily -
 * verified by execution against a real one: POST /v1/chat/completions with NO
 * Authorization header returned a completion from gemma3:4b. But every
 * OpenAI-compatible consumer we hand a provider to rejects an absent key BEFORE
 * it opens a socket: the OpenAI SDK constructor throws on an empty string, and
 * the fork Gemini core throws `OpenAI API key is required`.
 *
 * So a genuinely keyless local provider needs a placeholder to get past the
 * gate. `modelBridge` already did this when probing and listing models, which
 * is exactly why Ollama looked connected in Settings and then died on the first
 * turn - the agent spawn path had no such fallback and passed nothing.
 *
 * The gate must fail CLOSED. A placeholder leaking to a cloud host would send a
 * bogus credential off the machine and turn a clear "no key configured" into an
 * opaque 401 from someone else's server.
 */
import { describe, expect, it } from 'vitest';
import { LOCAL_KEYLESS_PLACEHOLDER, resolveOpenAiCompatibleApiKey } from '@/common/utils/keylessLocalCredential';

describe('resolveOpenAiCompatibleApiKey', () => {
  it('unlocks keyless for a loopback base url', () => {
    // The exact shape a Wayland-registered Ollama provider carries.
    expect(resolveOpenAiCompatibleApiKey(undefined, 'http://127.0.0.1:11434/v1')).toBe(LOCAL_KEYLESS_PLACEHOLDER);
    expect(resolveOpenAiCompatibleApiKey('', 'http://localhost:11434/v1')).toBe(LOCAL_KEYLESS_PLACEHOLDER);
  });

  it('unlocks keyless for other local runtimes on their own ports', () => {
    expect(resolveOpenAiCompatibleApiKey(undefined, 'http://localhost:1234/v1')).toBe(LOCAL_KEYLESS_PLACEHOLDER);
    expect(resolveOpenAiCompatibleApiKey(undefined, 'http://192.168.1.50:8080/v1')).toBe(LOCAL_KEYLESS_PLACEHOLDER);
  });

  it('never invents a credential for a remote host', () => {
    // The security half. A placeholder here would leave the machine.
    expect(resolveOpenAiCompatibleApiKey(undefined, 'https://api.openai.com/v1')).toBe('');
    expect(resolveOpenAiCompatibleApiKey('', 'https://api.fluxrouter.ai/v1')).toBe('');
  });

  it('fails closed on a base url it cannot judge', () => {
    // No host to trust is not the same as a trusted host.
    expect(resolveOpenAiCompatibleApiKey(undefined, undefined)).toBe('');
    expect(resolveOpenAiCompatibleApiKey(undefined, '')).toBe('');
    expect(resolveOpenAiCompatibleApiKey(undefined, 'not a url')).toBe('');
  });

  it('a real key always wins, local or not', () => {
    // Someone running a keyed proxy on loopback must keep their own key.
    expect(resolveOpenAiCompatibleApiKey('sk-real', 'http://127.0.0.1:11434/v1')).toBe('sk-real');
    expect(resolveOpenAiCompatibleApiKey('sk-real', 'https://api.openai.com/v1')).toBe('sk-real');
  });

  it('returns a string, never undefined', () => {
    // Callers treat "no credential" as one falsy shape; two would be a bug farm.
    expect(typeof resolveOpenAiCompatibleApiKey(undefined, undefined)).toBe('string');
    expect(typeof resolveOpenAiCompatibleApiKey(null, null)).toBe('string');
  });
});
