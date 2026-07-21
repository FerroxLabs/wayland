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
      provider: 'kokoro-local',
      voice: 'default',
      speed: 1,
      autoReadResponses: false,
    });
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

  it.each([
    ['TTS_KOKORO_LOCAL_UNAVAILABLE: missing model', 'TTS_KOKORO_LOCAL_UNAVAILABLE'],
    ['TTS_SYSTEM_NATIVE_UNAVAILABLE: wrong platform', 'TTS_SYSTEM_NATIVE_UNAVAILABLE'],
    ['TTS_OPENAI_NOT_CONFIGURED: connect OpenAI', 'TTS_OPENAI_NOT_CONFIGURED'],
    ['TTS_OPENAI_AUTH_ERROR: invalid credential', 'TTS_OPENAI_AUTH_ERROR'],
    ['TTS_OPENAI_RATE_LIMITED: try later', 'TTS_OPENAI_RATE_LIMITED'],
    ['TTS_OPENAI_REQUEST_FAILED: upstream unavailable', 'TTS_OPENAI_REQUEST_FAILED'],
    ['unexpected binary failure', 'TTS_SYNTHESIS_FAILED'],
  ])('settles provider failure %s without leaving IPC pending', async (message, errorCode) => {
    synthesize.mockRejectedValue(new Error(message));
    initVoiceSynthBridge();

    await expect(speakCallback!({ text: 'Hello' })).resolves.toEqual({
      ok: false,
      errorCode,
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
    getConfig.mockImplementation(
      keyAwareConfig({ version: 1, acceptedProviders: ['openai'], updatedAt: 1 })
    );
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
