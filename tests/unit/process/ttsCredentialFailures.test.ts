/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * D2: "Test voice does nothing on OpenAI Speech."
 *
 * The machine that reported it has an OpenAI credential written under a
 * different app identity, so `safeStorage` cannot open it. The provider
 * repository already distinguishes that (`status: 'undecryptable'`) but the
 * credential reader collapsed every non-ok outcome into `undefined`, so the
 * user was told "connect OpenAI in Models and Providers" - about a provider
 * that IS connected, with advice that cannot fix anything.
 *
 * These lock the three outcomes apart and prove the bridge can never answer a
 * failure with silence.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
  mainError: vi.fn(),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ network: { fetch: vi.fn() } }),
}));

import { synthesizeOpenAI, type OpenAITtsRuntime } from '@process/services/voice/TextToSpeechService';
import { TEXT_TO_SPEECH_ERROR_CODES } from '@/common/types/ttsTypes';
import type { ConnectedProviderKeyResult } from '@process/connectors/providerKey';

const runtimeFor = (result: ConnectedProviderKeyResult, fetchImpl?: OpenAITtsRuntime['fetch']): OpenAITtsRuntime => ({
  resolveApiKey: async () => (result.status === 'ok' ? result.key : undefined),
  resolveApiKeyResult: async () => result,
  fetch: fetchImpl ?? (async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 })),
});

const config = {
  enabled: true,
  provider: 'openai' as const,
  voice: 'marin',
  speed: 1,
  autoReadResponses: false,
  model: 'gpt-4o-mini-tts',
};

describe('OpenAI TTS credential failures name their cause', () => {
  it('KNOWN POSITIVE: a readable credential synthesizes', async () => {
    const audio = await synthesizeOpenAI('hi', config, runtimeFor({ status: 'ok', key: 'sk-live' }));
    expect(audio.data.byteLength).toBe(3);
    expect(audio.mimeType).toBe('audio/mpeg');
  });

  it('an undecryptable credential is NOT reported as "not configured"', async () => {
    const error = await synthesizeOpenAI('hi', config, runtimeFor({ status: 'undecryptable' })).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as { code: string }).code).toBe('TTS_OPENAI_CREDENTIAL_UNREADABLE');
    // The distinction is the entire point: the old code produced this instead.
    expect((error as { code: string }).code).not.toBe('TTS_OPENAI_NOT_CONFIGURED');
    // And it must tell the user what to actually do.
    expect((error as Error).message).toMatch(/cannot be decrypted/i);
  });

  it('a genuinely absent provider still says "not configured"', async () => {
    const error = await synthesizeOpenAI('hi', config, runtimeFor({ status: 'not-connected' })).catch((e) => e);
    expect((error as { code: string }).code).toBe('TTS_OPENAI_NOT_CONFIGURED');
  });

  it('an unreadable credential store is its own cause, not a missing provider', async () => {
    const error = await synthesizeOpenAI('hi', config, runtimeFor({ status: 'error', message: 'db locked' })).catch(
      (e) => e
    );
    expect((error as { code: string }).code).toBe('TTS_CREDENTIAL_STORE_UNAVAILABLE');
    expect((error as Error).message).toMatch(/db locked/);
  });

  it('every code it can throw is in the declared wire vocabulary', async () => {
    for (const result of [
      { status: 'undecryptable' },
      { status: 'not-connected' },
      { status: 'error', message: 'x' },
    ] as ConnectedProviderKeyResult[]) {
      const error = await synthesizeOpenAI('hi', config, runtimeFor(result)).catch((e) => e);
      expect(TEXT_TO_SPEECH_ERROR_CODES).toContain((error as { code: string }).code);
    }
  });

  it('a legacy runtime with only resolveApiKey still works (no silent break)', async () => {
    const legacy: OpenAITtsRuntime = {
      resolveApiKey: async () => 'sk-legacy',
      fetch: async () => new Response(new Uint8Array([9]), { status: 200 }),
    };
    const audio = await synthesizeOpenAI('hi', config, legacy);
    expect(audio.data.byteLength).toBe(1);

    const noKey: OpenAITtsRuntime = { resolveApiKey: async () => undefined, fetch: legacy.fetch };
    const error = await synthesizeOpenAI('hi', config, noKey).catch((e) => e);
    expect((error as { code: string }).code).toBe('TTS_OPENAI_NOT_CONFIGURED');
  });
});
