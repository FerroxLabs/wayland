/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const processConfigGetMock = vi.fn();

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: (...args: unknown[]) => processConfigGetMock(...args) },
}));

vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
  mainError: vi.fn(),
}));

// Capture the FormData sent to fetch so we can assert on the language field
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { SpeechToTextService } = await import('@/process/bridge/services/SpeechToTextService');

const baseConfig = {
  enabled: true,
  provider: 'openai' as const,
  openai: { apiKey: 'sk-test' },
};

const baseRequest = {
  audioBuffer: new Uint8Array([0x00, 0x01]),
  fileName: 'audio.webm',
  mimeType: 'audio/webm',
};

const errorResponse = (status: number) => ({
  ok: false,
  status,
  statusText: 'Error',
  json: () => Promise.resolve({}),
});

describe('SpeechToTextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OpenAI language normalization (ELECTRON-G3)', () => {
    it('converts BCP 47 languageHint to ISO 639-1 before sending to OpenAI', async () => {
      processConfigGetMock.mockResolvedValue(baseConfig);
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'hello', language: 'en' }),
      });

      await SpeechToTextService.transcribe({
        ...baseRequest,
        languageHint: 'en-us',
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const formData = init.body as FormData;
      expect(formData.get('language')).toBe('en');
    });

    it('converts BCP 47 config language to ISO 639-1', async () => {
      processConfigGetMock.mockResolvedValue({
        ...baseConfig,
        openai: { ...baseConfig.openai, language: 'zh-CN' },
      });
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: '你好', language: 'zh' }),
      });

      await SpeechToTextService.transcribe(baseRequest);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const formData = init.body as FormData;
      expect(formData.get('language')).toBe('zh');
    });

    it('passes plain ISO 639-1 codes unchanged', async () => {
      processConfigGetMock.mockResolvedValue(baseConfig);
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'hello', language: 'en' }),
      });

      await SpeechToTextService.transcribe({
        ...baseRequest,
        languageHint: 'en',
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const formData = init.body as FormData;
      expect(formData.get('language')).toBe('en');
    });

    it('omits language field when no hint or config language is set', async () => {
      processConfigGetMock.mockResolvedValue(baseConfig);
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'hello' }),
      });

      await SpeechToTextService.transcribe(baseRequest);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const formData = init.body as FormData;
      expect(formData.get('language')).toBeNull();
    });

    it('throws STT_REQUEST_FAILED on non-ok response', async () => {
      processConfigGetMock.mockResolvedValue(baseConfig);
      fetchMock.mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: () =>
          Promise.resolve({
            error: { message: "Invalid language 'en-us'" },
          }),
      });

      await expect(
        SpeechToTextService.transcribe({
          ...baseRequest,
          languageHint: 'en',
        })
      ).rejects.toThrow('STT_REQUEST_FAILED');
    });
  });

  describe('typed error mapping (#277)', () => {
    it('maps OpenAI 401 to STT_REQUEST_FAILED (not the Flux-branded auth code)', async () => {
      processConfigGetMock.mockResolvedValue(baseConfig);
      fetchMock.mockResolvedValue(errorResponse(401));

      await expect(SpeechToTextService.transcribe(baseRequest)).rejects.toThrow('STT_REQUEST_FAILED');
    });

    it('maps OpenAI 429 to STT_RATE_LIMITED', async () => {
      processConfigGetMock.mockResolvedValue(baseConfig);
      fetchMock.mockResolvedValue(errorResponse(429));

      await expect(SpeechToTextService.transcribe(baseRequest)).rejects.toThrow('STT_RATE_LIMITED');
    });

    it('maps Deepgram 401 to STT_REQUEST_FAILED (not the Flux-branded auth code)', async () => {
      processConfigGetMock.mockResolvedValue({
        enabled: true,
        provider: 'deepgram' as const,
        deepgram: { apiKey: 'dg-test', model: 'nova-2' },
      });
      fetchMock.mockResolvedValue(errorResponse(401));

      await expect(SpeechToTextService.transcribe(baseRequest)).rejects.toThrow('STT_REQUEST_FAILED');
    });

    it('maps Flux Voice 401 to STT_FLUX_AUTH_ERROR', async () => {
      processConfigGetMock.mockResolvedValue({
        enabled: true,
        provider: 'flux-voice' as const,
        fluxVoice: { apiKey: 'flux-key', baseUrl: 'https://api.fluxrouter.ai/v1', model: 'flux-voice' },
      });
      fetchMock.mockResolvedValue(errorResponse(401));

      await expect(SpeechToTextService.transcribe(baseRequest)).rejects.toThrow('STT_FLUX_AUTH_ERROR');
    });

    it('maps Deepgram 429 to STT_RATE_LIMITED', async () => {
      processConfigGetMock.mockResolvedValue({
        enabled: true,
        provider: 'deepgram' as const,
        deepgram: { apiKey: 'dg-test', model: 'nova-2' },
      });
      fetchMock.mockResolvedValue(errorResponse(429));

      await expect(SpeechToTextService.transcribe(baseRequest)).rejects.toThrow('STT_RATE_LIMITED');
    });
  });

  describe('Flux Voice config fallback (#277)', () => {
    it('reads legacy Flux creds stored under openai when fluxVoice block is absent', async () => {
      // Legacy persisted config: Flux creds live under `openai` (pre-fluxVoice block).
      processConfigGetMock.mockResolvedValue({
        enabled: true,
        provider: 'flux-voice' as const,
        openai: { apiKey: 'flux-legacy-key', baseUrl: 'https://api.fluxrouter.ai/v1', model: 'flux-voice' },
      });
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'hi', language: 'en' }),
      });

      const result = await SpeechToTextService.transcribe(baseRequest);

      expect(result.provider).toBe('flux-voice');
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.fluxrouter.ai/v1/audio/transcriptions');
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer flux-legacy-key');
    });

    it('prefers the dedicated fluxVoice block over openai', async () => {
      processConfigGetMock.mockResolvedValue({
        enabled: true,
        provider: 'flux-voice' as const,
        openai: { apiKey: 'whisper-key', model: 'whisper-1' },
        fluxVoice: { apiKey: 'flux-key', baseUrl: 'https://api.fluxrouter.ai/v1', model: 'flux-voice' },
      });
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'hi', language: 'en' }),
      });

      await SpeechToTextService.transcribe(baseRequest);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer flux-key');
    });
  });
});
