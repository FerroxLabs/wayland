import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(),
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

import { ProcessConfig } from '@process/utils/initStorage';
import { SpeechToTextService } from '@process/bridge/services/SpeechToTextService';
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects requests when speech-to-text is disabled', async () => {
    vi.mocked(ProcessConfig.get).mockResolvedValue(undefined);

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

  it('sends OpenAI transcription requests with multipart form data', async () => {
    vi.mocked(ProcessConfig.get).mockResolvedValue({
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
    vi.mocked(ProcessConfig.get).mockResolvedValue({
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
    vi.mocked(ProcessConfig.get).mockResolvedValue({
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
    vi.mocked(ProcessConfig.get).mockResolvedValue({
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
    vi.mocked(ProcessConfig.get).mockResolvedValue({
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
    vi.mocked(ProcessConfig.get).mockResolvedValue({
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
    vi.mocked(ProcessConfig.get).mockResolvedValue({
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
});
