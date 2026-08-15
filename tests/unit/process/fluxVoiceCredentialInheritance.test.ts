/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * D4: choosing Flux Voice was the one action that guaranteed it could not work.
 *
 * The zero-config seed only fires for a user who has never picked an engine, so
 * picking Flux Voice deliberately skipped it and fell through to a credential
 * lookup that only reads the STT config block - which nothing ever populates,
 * because the Flux credential lives in the shared provider registry. A user with
 * Flux Router connected and 77 models working got STT_FLUX_NOT_CONFIGURED.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
  mainError: vi.fn(),
}));

const configGet = vi.fn();
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: (key: string) => configGet(key) },
}));

vi.mock('@process/connectors/providerKey', () => ({
  readConnectedProviderKey: vi.fn(async () => undefined),
  readConnectedProviderKeyResult: vi.fn(async () => ({ status: 'not-connected' })),
}));

const readConnectedFluxKey = vi.fn<() => Promise<string | undefined>>();
vi.mock('@process/connectors/fluxKey', () => ({
  readConnectedFluxKey: () => readConnectedFluxKey(),
}));

import { SpeechToTextService } from '@process/bridge/services/SpeechToTextService';

const CONSENTED = { version: 1, acceptedProviders: ['flux-voice'], updatedAt: 1 };

/** An explicit Flux Voice choice with an empty credential block - the real config shape. */
const explicitFluxConfig = {
  enabled: true,
  provider: 'flux-voice' as const,
  fluxVoice: { apiKey: '', baseUrl: '', language: '', model: 'flux-voice' },
};

const request = {
  audioBuffer: [1, 2, 3],
  fileName: 'speech-input.webm',
  mimeType: 'audio/webm',
};

describe('Flux Voice inherits the connected Flux Router credential', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configGet.mockImplementation(async (key: string) =>
      key === 'tools.voiceHostedConsent' ? CONSENTED : explicitFluxConfig
    );
  });

  it('transcribes using the registry credential instead of throwing NOT_CONFIGURED', async () => {
    readConnectedFluxKey.mockResolvedValue('sk-flux-connected');
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ text: 'hello there' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await SpeechToTextService.transcribe(request);

    expect(result.text).toBe('hello there');
    expect(result.provider).toBe('flux-voice');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/audio/transcriptions');
    // The credential actually used is the connected one. Asserted through the
    // header rather than a log line so the test fails if the wiring regresses.
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-flux-connected');
  });

  it('KNOWN NEGATIVE: with no Flux connected it still reports NOT_CONFIGURED', async () => {
    readConnectedFluxKey.mockResolvedValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(SpeechToTextService.transcribe(request)).rejects.toThrow(/STT_FLUX_NOT_CONFIGURED/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('an explicit key in the STT config still wins over the registry', async () => {
    readConnectedFluxKey.mockResolvedValue('sk-flux-connected');
    configGet.mockImplementation(async (key: string) =>
      key === 'tools.voiceHostedConsent'
        ? CONSENTED
        : { ...explicitFluxConfig, fluxVoice: { ...explicitFluxConfig.fluxVoice, apiKey: 'sk-user-typed' } }
    );
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ text: 'ok' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await SpeechToTextService.transcribe(request);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-user-typed');
    expect(readConnectedFluxKey).not.toHaveBeenCalled();
  });
});
