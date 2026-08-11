/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { speakProvider, stopProvider, synthesize, getConfig } = vi.hoisted(() => ({
  speakProvider: vi.fn(),
  stopProvider: vi.fn(),
  synthesize: vi.fn(),
  getConfig: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    voiceSynth: {
      speak: { provider: speakProvider },
      stop: { provider: stopProvider },
    },
  },
}));

vi.mock('@process/services/voice/TextToSpeechService', () => ({
  synthesize,
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: getConfig,
  },
}));

import { initVoiceSynthBridge } from '@process/bridge/voiceSynthBridge';

type SpeakCallback = (input: { text: string }) => Promise<unknown>;
let speakCallback: SpeakCallback | null;

describe('voiceSynthBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    speakCallback = null;
    speakProvider.mockImplementation((callback: SpeakCallback) => {
      speakCallback = callback;
    });
    getConfig.mockResolvedValue({
      enabled: true,
      provider: 'system-native',
      voice: 'default',
      speed: 1,
      autoReadResponses: false,
    });
  });

  /**
   * The bridge is the only place that knows `process.platform`, so it is the
   * only place that can turn "no provider stored" into the provider this OS
   * actually owns. Dropping the argument here is silent: the suite stays green
   * and Windows quietly resolves to macOS `say`, which throws.
   */
  it('resolves an unset provider to the synthesizer this platform actually has', async () => {
    const original = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    try {
      getConfig.mockResolvedValue({ enabled: true, voice: 'default', speed: 1, autoReadResponses: false });
      synthesize.mockResolvedValue({ data: new Uint8Array([1]), mimeType: 'audio/wav' });
      initVoiceSynthBridge();

      await speakCallback!({ text: 'Hello' });

      expect(synthesize).toHaveBeenCalledWith('Hello', expect.objectContaining({ provider: 'windows-native' }));
    } finally {
      Object.defineProperty(process, 'platform', { value: original, configurable: true });
    }
  });

  it('returns synthesized audio as an explicit success value', async () => {
    synthesize.mockResolvedValue({
      data: new Uint8Array([1, 2, 3]),
      mimeType: 'audio/wav',
    });
    initVoiceSynthBridge();

    await expect(speakCallback!({ text: 'Hello' })).resolves.toEqual({
      ok: true,
      data: [1, 2, 3],
      mimeType: 'audio/wav',
    });
  });

  /**
   * The detail is asserted alongside the code, not waved through.
   *
   * A narrowed code on its own can only ever produce "Voice test failed:
   * TTS_SYNTHESIS_FAILED", which is the same dead end for the user as saying
   * nothing at all. The service writes a human sentence after the code and the
   * bridge has to carry it, so both halves are pinned here - including for the
   * catch-all, which is the case that needs it most.
   */
  it.each([
    [
      'TTS_WINDOWS_NATIVE_UNAVAILABLE: no audio produced',
      'TTS_WINDOWS_NATIVE_UNAVAILABLE',
      'no audio produced',
    ],
    ['TTS_SYSTEM_NATIVE_UNAVAILABLE: wrong platform', 'TTS_SYSTEM_NATIVE_UNAVAILABLE', 'wrong platform'],
    ['TTS_OPENAI_NOT_CONFIGURED: connect OpenAI', 'TTS_OPENAI_NOT_CONFIGURED', 'connect OpenAI'],
    ['TTS_OPENAI_CREDENTIAL_UNREADABLE: cannot be decrypted', 'TTS_OPENAI_CREDENTIAL_UNREADABLE', 'cannot be decrypted'],
    ['TTS_CREDENTIAL_STORE_UNAVAILABLE: db locked', 'TTS_CREDENTIAL_STORE_UNAVAILABLE', 'db locked'],
    ['TTS_OPENAI_AUTH_ERROR: invalid credential', 'TTS_OPENAI_AUTH_ERROR', 'invalid credential'],
    ['TTS_OPENAI_RATE_LIMITED: try later', 'TTS_OPENAI_RATE_LIMITED', 'try later'],
    ['TTS_OPENAI_REQUEST_FAILED: upstream unavailable', 'TTS_OPENAI_REQUEST_FAILED', 'upstream unavailable'],
    ['unexpected binary failure', 'TTS_SYNTHESIS_FAILED', 'unexpected binary failure'],
  ])('settles provider failure %s without leaving IPC pending', async (message, errorCode, detail) => {
    synthesize.mockRejectedValue(new Error(message));
    initVoiceSynthBridge();

    await expect(speakCallback!({ text: 'Hello' })).resolves.toEqual({
      ok: false,
      errorCode,
      detail,
    });
  });

  // VOC-03: hosted TTS ('openai') must not run without recorded consent.
  const openaiConfig = { enabled: true, provider: 'openai', voice: 'marin', speed: 1, autoReadResponses: false };
  const keyAwareConfig = (consent: unknown) => (key: string) =>
    Promise.resolve(key === 'tools.voiceHostedConsent' ? consent : openaiConfig);

  it('fails closed for hosted TTS when consent is absent and never synthesizes', async () => {
    getConfig.mockImplementation(keyAwareConfig(null));
    initVoiceSynthBridge();

    await expect(speakCallback!({ text: 'Hello' })).resolves.toEqual({
      ok: false,
      errorCode: 'TTS_HOSTED_CONSENT_REQUIRED',
    });
    expect(synthesize).not.toHaveBeenCalled();
  });

  it('allows hosted TTS once consent is recorded for openai', async () => {
    getConfig.mockImplementation(keyAwareConfig({ version: 1, acceptedProviders: ['openai'], updatedAt: 1 }));
    synthesize.mockResolvedValue({ data: new Uint8Array([9]), mimeType: 'audio/wav' });
    initVoiceSynthBridge();

    await expect(speakCallback!({ text: 'Hello' })).resolves.toEqual({
      ok: true,
      data: [9],
      mimeType: 'audio/wav',
    });
    expect(synthesize).toHaveBeenCalledTimes(1);
  });
});
