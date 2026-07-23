import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// VOC-03: `sttConfigMock` serves the STT config; the consent key is served from
// a dedicated `hostedConsentMock` (granted by default in beforeEach) so the
// transcription tests keep controlling only the STT config.
const { sttConfigMock, hostedConsentMock } = vi.hoisted(() => ({
  sttConfigMock: vi.fn(),
  hostedConsentMock: vi.fn(),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: (key: string, ...rest: unknown[]) =>
      key === 'tools.voiceHostedConsent' ? hostedConsentMock() : sttConfigMock(key, ...rest),
  },
}));

vi.mock('@process/utils/mainLogger', () => ({
  mainError: vi.fn(),
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));

vi.mock('@process/connectors/providerKey', () => ({
  readConnectedProviderKey: vi.fn(),
}));

vi.mock('@process/connectors/fluxKey', () => ({
  readConnectedFluxKey: vi.fn(async () => undefined),
}));

import { SpeechToTextService, speechToTextRegistry } from '@process/bridge/services/SpeechToTextService';
import { mainError, mainLog, mainWarn } from '@process/utils/mainLogger';
import { readConnectedProviderKey } from '@process/connectors/providerKey';
import { readConnectedFluxKey } from '@process/connectors/fluxKey';

describe('SpeechToTextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean per-test default: no connected keys unless a test opts in. Set after
    // clearAllMocks (which clears call history but keeps implementations) so a
    // per-test override never leaks into the next test.
    vi.mocked(readConnectedProviderKey).mockResolvedValue(undefined);
    vi.mocked(readConnectedFluxKey).mockResolvedValue(undefined);
    // VOC-03: consent granted for every hosted provider by default; the
    // fail-closed test overrides it.
    hostedConsentMock.mockResolvedValue({
      version: 1,
      acceptedProviders: ['openai', 'deepgram', 'flux-voice'],
      updatedAt: 1,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects requests when speech-to-text is disabled', async () => {
    sttConfigMock.mockResolvedValue(undefined);

    await expect(
      SpeechToTextService.transcribe({
        audioBuffer: new Uint8Array([1, 2, 3]),
        fileName: 'sample.webm',
        mimeType: 'audio/webm',
      })
    ).rejects.toThrow('STT_DISABLED');

    expect(mainWarn).toHaveBeenCalledWith(
      '[SpeechToText]',
      'Speech-to-text request rejected because feature is disabled'
    );
    expect(mainError).toHaveBeenCalledWith(
      '[SpeechToText]',
      'Transcription failed',
      expect.objectContaining({
        errorCode: 'STT_DISABLED',
      })
    );
  });

  it('fails closed without sending audio when hosted-voice consent is absent', async () => {
    sttConfigMock.mockResolvedValue({
      enabled: true,
      provider: 'openai',
      openai: { apiKey: 'openai-key', model: 'whisper-1' },
    });
    hostedConsentMock.mockResolvedValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      SpeechToTextService.transcribe({
        audioBuffer: new Uint8Array([1, 2, 3]),
        fileName: 'sample.webm',
        mimeType: 'audio/webm',
      })
    ).rejects.toThrow('STT_HOSTED_CONSENT_REQUIRED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends OpenAI transcription requests with multipart form data', async () => {
    sttConfigMock.mockResolvedValue({
      enabled: true,
      provider: 'openai',
      openai: {
        apiKey: 'openai-key',
        baseUrl: 'https://example.com/v1',
        model: 'whisper-1',
      },
    });

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ language: 'en', text: ' hello world ' })));
    vi.stubGlobal('fetch', fetchMock);

    const result = await SpeechToTextService.transcribe({
      audioBuffer: new Uint8Array([1, 2, 3]),
      fileName: 'sample.webm',
      languageHint: 'en',
      mimeType: 'audio/webm',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/audio/transcriptions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer openai-key',
        }),
      })
    );

    const [, request] = fetchMock.mock.calls[0] as [string, { body: FormData }];
    expect(request.body).toBeInstanceOf(FormData);
    expect(request.body.get('model')).toBe('whisper-1');
    expect(request.body.get('language')).toBe('en');
    expect(result).toEqual({
      language: 'en',
      model: 'whisper-1',
      provider: 'openai',
      text: 'hello world',
    });
    expect(mainLog).toHaveBeenCalledWith(
      '[SpeechToText]',
      'Transcription completed',
      expect.objectContaining({
        model: 'whisper-1',
        provider: 'openai',
        textLength: 'hello world'.length,
      })
    );
  });

  it('accepts desktop IPC audio payloads serialized as plain objects', async () => {
    sttConfigMock.mockResolvedValue({
      enabled: true,
      provider: 'openai',
      openai: {
        apiKey: 'openai-key',
        baseUrl: 'https://example.com/v1',
        model: 'whisper-1',
      },
    });

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ language: 'zh', text: ' ok ' })));
    vi.stubGlobal('fetch', fetchMock);

    const result = await SpeechToTextService.transcribe({
      audioBuffer: { 0: 1, 1: 2, 2: 3 },
      fileName: 'sample.webm',
      languageHint: 'zh-CN',
      mimeType: 'audio/webm;codecs=opus',
    });

    expect(result).toEqual({
      language: 'zh',
      model: 'whisper-1',
      provider: 'openai',
      text: 'ok',
    });
    expect(mainLog).toHaveBeenCalledWith(
      '[SpeechToText]',
      'Transcription requested',
      expect.objectContaining({
        audioBytes: 3,
        mimeType: 'audio/webm;codecs=opus',
      })
    );
  });

  it('sends Deepgram transcription requests with query options', async () => {
    sttConfigMock.mockResolvedValue({
      enabled: true,
      provider: 'deepgram',
      deepgram: {
        apiKey: 'deepgram-key',
        baseUrl: 'https://api.deepgram.com/v1/listen',
        detectLanguage: true,
        model: 'nova-2',
        punctuate: true,
        smartFormat: true,
      },
    });

    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            results: {
              channels: [
                {
                  alternatives: [{ transcript: ' deepgram text ' }],
                  detected_language: 'en',
                },
              ],
            },
          })
        )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await SpeechToTextService.transcribe({
      audioBuffer: new Uint8Array([9, 8, 7]),
      fileName: 'sample.webm',
      mimeType: 'audio/webm',
    });

    const [url, request] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(url).toContain('model=nova-2');
    expect(url).toContain('detect_language=true');
    expect(request.headers.Authorization).toBe('Token deepgram-key');
    expect(request.headers['Content-Type']).toBe('audio/webm');
    expect(result).toEqual({
      language: 'en',
      model: 'nova-2',
      provider: 'deepgram',
      text: 'deepgram text',
    });
    expect(mainLog).toHaveBeenCalledWith(
      '[SpeechToText]',
      'Resolved speech-to-text provider',
      expect.objectContaining({
        provider: 'deepgram',
      })
    );
  });

  it('falls back to the connected OpenAI provider key when no STT-specific key is set', async () => {
    // OpenAI Whisper selected, but no key entered in the Voice panel (it defers
    // to the shared Providers store). The connected OpenAI provider supplies it.
    sttConfigMock.mockResolvedValue({
      enabled: true,
      provider: 'openai',
    });
    vi.mocked(readConnectedProviderKey).mockResolvedValue('shared-openai-key');

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ language: 'en', text: 'hi' })));
    vi.stubGlobal('fetch', fetchMock);

    const result = await SpeechToTextService.transcribe({
      audioBuffer: new Uint8Array([1, 2, 3]),
      fileName: 'sample.webm',
      mimeType: 'audio/webm',
    });

    expect(readConnectedProviderKey).toHaveBeenCalledWith('openai');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/transcriptions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer shared-openai-key' }),
      })
    );
    expect(result).toEqual({
      language: 'en',
      model: 'whisper-1',
      provider: 'openai',
      text: 'hi',
    });
  });

  it('resolves the OpenAI key before the Flux zero-config seed (no silent reroute)', async () => {
    // OpenAI Whisper selected, no explicit STT key, and BOTH the connected
    // OpenAI provider AND Flux have a key. Correct ordering resolves OpenAI
    // first, so the request must hit the OpenAI endpoint with the OpenAI key -
    // NOT be rerouted to Flux Voice. If the Flux seed ran first this fetch
    // assertion fails (it would call the Flux endpoint with the Flux key).
    sttConfigMock.mockResolvedValue({
      enabled: true,
      provider: 'openai',
    });
    vi.mocked(readConnectedProviderKey).mockResolvedValue('shared-openai-key');
    vi.mocked(readConnectedFluxKey).mockResolvedValue('flux-key');

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ language: 'en', text: 'hi' })));
    vi.stubGlobal('fetch', fetchMock);

    const result = await SpeechToTextService.transcribe({
      audioBuffer: new Uint8Array([1, 2, 3]),
      fileName: 'sample.webm',
      mimeType: 'audio/webm',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(url).toBe('https://api.openai.com/v1/audio/transcriptions');
    expect(request.headers.Authorization).toBe('Bearer shared-openai-key');
    expect(result.provider).toBe('openai');
  });

  it('prefers an explicit STT OpenAI key over the shared provider key', async () => {
    sttConfigMock.mockResolvedValue({
      enabled: true,
      provider: 'openai',
      openai: { apiKey: 'explicit-key', model: 'whisper-1' },
    });
    vi.mocked(readConnectedProviderKey).mockResolvedValue('shared-openai-key');

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ language: 'en', text: 'hi' })));
    vi.stubGlobal('fetch', fetchMock);

    await SpeechToTextService.transcribe({
      audioBuffer: new Uint8Array([1, 2, 3]),
      fileName: 'sample.webm',
      mimeType: 'audio/webm',
    });

    // Explicit key wins and the shared store is never consulted.
    expect(readConnectedProviderKey).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/transcriptions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer explicit-key' }),
      })
    );
  });

  it('rejects when OpenAI is selected with neither an STT key nor a connected provider', async () => {
    sttConfigMock.mockResolvedValue({
      enabled: true,
      provider: 'openai',
    });
    vi.mocked(readConnectedProviderKey).mockResolvedValue(undefined);

    await expect(
      SpeechToTextService.transcribe({
        audioBuffer: new Uint8Array([1, 2, 3]),
        fileName: 'sample.webm',
        mimeType: 'audio/webm',
      })
    ).rejects.toThrow('STT_OPENAI_NOT_CONFIGURED');
  });

  // VOC-04: adapter registry replaces the nested provider ternary.
  describe('speechToTextRegistry (VOC-04)', () => {
    it('registers every supported provider as an adapter', () => {
      expect(new Set(speechToTextRegistry.providers())).toEqual(
        new Set(['flux-voice', 'openai', 'deepgram', 'whisper-local'])
      );
    });

    it('marks whisper-local on-device and hosted providers off-device', () => {
      expect(speechToTextRegistry.resolve('whisper-local').onDevice).toBe(true);
      expect(speechToTextRegistry.resolve('openai').onDevice).toBe(false);
      expect(speechToTextRegistry.resolve('deepgram').onDevice).toBe(false);
      expect(speechToTextRegistry.resolve('flux-voice').onDevice).toBe(false);
    });

    it('fails closed for an unregistered provider', () => {
      expect(() =>
        speechToTextRegistry.resolve('made-up' as Parameters<typeof speechToTextRegistry.resolve>[0])
      ).toThrow('no voice adapter registered');
    });
  });

  // VOC-04: every completed turn returns one authoritative VoiceReceipt derived
  // from the observed audio-in / transcript-out boundary.
  describe('transcribeTurn (VOC-04 VoiceReceipt)', () => {
    it('emits a receipt derived from the observed boundary for a hosted turn', async () => {
      sttConfigMock.mockResolvedValue({
        enabled: true,
        provider: 'openai',
        openai: { apiKey: 'openai-key', model: 'whisper-1' },
      });
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ language: 'en', text: ' hello world ' })));
      vi.stubGlobal('fetch', fetchMock);

      const { result, receipt } = await SpeechToTextService.transcribeTurn({
        audioBuffer: new Uint8Array([1, 2, 3]),
        fileName: 'sample.webm',
        mimeType: 'audio/webm',
      });

      expect(result.text).toBe('hello world');
      expect(receipt.modality).toBe('stt');
      expect(receipt.provider).toBe('openai');
      expect(receipt.model).toBe('whisper-1');
      expect(receipt.terminalState).toBe('completed');
      expect(receipt.authority).toBe('desktop');
      // Observed usage: 3 audio bytes in, 'hello world' characters out.
      expect(receipt.usage.audioInputBytes).toBe(3);
      expect(receipt.usage.transcriptCharacterCount).toBe('hello world'.length);
      // Hosted provider → no fabricated cost.
      expect(receipt.cost.status).toBe('unavailable');
      expect(receipt.content.requestBytes).toBe(3);
      expect(receipt.content.requestDigest).toMatch(/^[0-9a-f]{64}$/);
      expect(receipt.timing.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('projects transcribe() to the receipt result so the IPC contract is unchanged', async () => {
      sttConfigMock.mockResolvedValue({
        enabled: true,
        provider: 'openai',
        openai: { apiKey: 'openai-key', model: 'whisper-1' },
      });
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ language: 'en', text: 'hi' }))));

      const result = await SpeechToTextService.transcribe({
        audioBuffer: new Uint8Array([1, 2, 3]),
        fileName: 'sample.webm',
        mimeType: 'audio/webm',
      });

      expect(result).toEqual({ language: 'en', model: 'whisper-1', provider: 'openai', text: 'hi' });
    });
  });
});
