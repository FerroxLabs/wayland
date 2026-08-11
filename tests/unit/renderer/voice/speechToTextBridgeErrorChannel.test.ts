/**
 * The bridge has no error channel.
 *
 * `buildProvider(...).provider(fn)` calls `fn(data).then(emit)` with no
 * `.catch`, and the matching `invoke` is a `new Promise(resolve)` with no
 * reject and no timeout. A transcription provider that THROWS therefore
 * produces an unhandledRejection in main and an `await` in the renderer that
 * never settles - the mic sits on its spinner forever, saying nothing.
 *
 * Observed live on 2026-08-11 with `provider: 'openai'` and no key:
 *   [SpeechToText] Transcription failed  STT_OPENAI_NOT_CONFIGURED
 *   [unhandledRejection] Error: STT_OPENAI_NOT_CONFIGURED
 * and a composer stuck in `speech-input-button--processing` indefinitely.
 *
 * These tests pin the repair: failure crosses as DATA, and the renderer turns
 * it back into the thrown STT_* error every caller already maps.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transcribeMock, providerMock, invokeMock, configGetMock, transcribeLocallyMock } = vi.hoisted(() => ({
  transcribeMock: vi.fn(),
  providerMock: vi.fn(),
  invokeMock: vi.fn(),
  configGetMock: vi.fn(),
  transcribeLocallyMock: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    speechToText: { transcribe: { provider: providerMock, invoke: invokeMock } },
  },
}));

vi.mock('@process/bridge/services/SpeechToTextService', () => ({
  SpeechToTextService: { transcribe: transcribeMock },
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: configGetMock },
}));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => true,
}));

vi.mock('@/renderer/services/voice/localWhisper', () => ({
  transcribeLocally: transcribeLocallyMock,
}));

import { initSpeechToTextBridge } from '@process/bridge/speechToTextBridge';
import { transcribeAudioBlob } from '@/renderer/services/SpeechToTextService';
import { mapSpeechInputError } from '@/renderer/hooks/system/useSpeechInput';

/** The handler `initSpeechToTextBridge` registered with the bridge. */
const registeredProvider = () => {
  initSpeechToTextBridge();
  const handler = providerMock.mock.calls.at(-1)?.[0] as (r: unknown) => Promise<unknown>;
  expect(typeof handler).toBe('function');
  return handler;
};

const request = { audioBuffer: [1, 2, 3], fileName: 'speech-input.webm', mimeType: 'audio/webm' };

describe('speech-to-text bridge error channel (main side)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves a thrown provider error as data instead of rejecting', async () => {
    transcribeMock.mockRejectedValue(new Error('STT_OPENAI_NOT_CONFIGURED'));

    const outcome = await registeredProvider()(request);

    expect(outcome).toEqual({ ok: false, errorCode: 'STT_OPENAI_NOT_CONFIGURED', detail: undefined });
  });

  it('never rejects, whatever the service throws', async () => {
    transcribeMock.mockRejectedValue(new Error('kaboom'));

    // A rejection here is the whole defect: it would strand the renderer.
    const outcome = (await registeredProvider()(request)) as { ok: boolean; errorCode: string };

    expect(outcome.ok).toBe(false);
    expect(outcome.errorCode).toBe('STT_REQUEST_FAILED');
  });

  it('narrows an undeclared code to STT_REQUEST_FAILED with no detail', async () => {
    transcribeMock.mockRejectedValue(new Error('STT_SECRET_INTERNAL:/Users/someone/key.txt'));

    const outcome = (await registeredProvider()(request)) as { errorCode: string; detail?: string };

    expect(outcome.errorCode).toBe('STT_REQUEST_FAILED');
    expect(outcome.detail).toBeUndefined();
  });

  it('carries the provider message only for STT_REQUEST_FAILED', async () => {
    transcribeMock.mockRejectedValue(new Error('STT_REQUEST_FAILED:503 Service Unavailable'));

    const outcome = (await registeredProvider()(request)) as { errorCode: string; detail?: string };

    expect(outcome.errorCode).toBe('STT_REQUEST_FAILED');
    expect(outcome.detail).toBe('503 Service Unavailable');
  });

  it('passes a successful transcript through unchanged', async () => {
    const result = { text: 'hello there', model: 'whisper-1', provider: 'openai' };
    transcribeMock.mockResolvedValue(result);

    await expect(registeredProvider()(request)).resolves.toEqual({ ok: true, result });
  });
});

describe('speech-to-text bridge error channel (renderer side)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // An explicit hosted provider, so the renderer takes the IPC path rather
    // than short-circuiting to the bundled local engine.
    configGetMock.mockResolvedValue({ enabled: true, provider: 'openai' });
  });

  it('throws the STT_* error the composer already maps', async () => {
    invokeMock.mockResolvedValue({ ok: false, errorCode: 'STT_OPENAI_NOT_CONFIGURED' });

    await expect(transcribeAudioBlob(new Blob(['x'], { type: 'audio/webm' }))).rejects.toThrow(
      'STT_OPENAI_NOT_CONFIGURED'
    );
    expect(transcribeLocallyMock).not.toHaveBeenCalled();
  });

  it('reattaches the provider detail so the composer can show it', async () => {
    invokeMock.mockResolvedValue({ ok: false, errorCode: 'STT_REQUEST_FAILED', detail: '503 Service Unavailable' });

    await expect(transcribeAudioBlob(new Blob(['x'], { type: 'audio/webm' }))).rejects.toThrow(
      'STT_REQUEST_FAILED:503 Service Unavailable'
    );
  });

  it('returns the transcript on success', async () => {
    const result = { text: 'hello there', model: 'whisper-1', provider: 'openai' };
    invokeMock.mockResolvedValue({ ok: true, result });

    await expect(transcribeAudioBlob(new Blob(['x'], { type: 'audio/webm' }))).resolves.toEqual(result);
  });

  it('maps every bridged code to a user-facing reason, never a hang', () => {
    expect(mapSpeechInputError(new Error('STT_OPENAI_NOT_CONFIGURED'))).toBe('not-configured');
    expect(mapSpeechInputError(new Error('STT_HOSTED_CONSENT_REQUIRED: accept the disclosure'))).toBe('not-configured');
    expect(mapSpeechInputError(new Error('STT_RATE_LIMITED'))).toBe('rate-limited');
    expect(mapSpeechInputError(new Error('STT_REQUEST_FAILED:503'))).toBe('transcription-failed');
  });
});
