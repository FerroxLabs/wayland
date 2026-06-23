/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verifies that SpeechToTextService (exercised via the public transcribe path
 * with all dependencies mocked) routes provider HTTP failures through the shared
 * STT taxonomy, that Flux Voice reads its own `flux` config block (with
 * backward-compatible fallback to `openai`), and that OpenAI failures are now
 * typed by the same taxonomy.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock heavy process-side dependencies before importing the service.
vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
  mainError: vi.fn(),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(),
  },
}));

vi.mock('@process/connectors/fluxKey', () => ({
  readConnectedFluxKey: vi.fn(),
}));

vi.mock('@process/utils/fluxSttDefault', () => ({
  resolveFluxSttDefault: vi.fn().mockReturnValue(null),
}));

vi.mock('@process/services/voice/WhisperLocal', () => ({
  WhisperLocal: { transcribe: vi.fn() },
}));

import { SpeechToTextService } from '@/process/bridge/services/SpeechToTextService';
import { ProcessConfig } from '@process/utils/initStorage';

const FLUX_VOICE_CONFIG = {
  enabled: true,
  provider: 'flux-voice' as const,
  flux: {
    apiKey: 'sk-flux-test',
    baseUrl: 'https://api.fluxrouter.ai/v1',
    model: 'flux-voice',
  },
};

// Older installs seeded the Flux key under the `openai` block; it must still work.
const FLUX_LEGACY_OPENAI_CONFIG = {
  enabled: true,
  provider: 'flux-voice' as const,
  openai: {
    apiKey: 'sk-flux-legacy',
    baseUrl: 'https://api.fluxrouter.ai/v1',
    model: 'flux-voice',
  },
};

const OPENAI_CONFIG = {
  enabled: true,
  provider: 'openai' as const,
  openai: {
    apiKey: 'sk-openai-test',
    model: 'whisper-1',
  },
};

const AUDIO_REQUEST = {
  audioBuffer: new Uint8Array([1, 2, 3]),
  fileName: 'clip.webm',
  mimeType: 'audio/webm',
};

function makeResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('SpeechToTextService — Flux Voice error mapping', () => {
  beforeEach(() => {
    vi.mocked(ProcessConfig.get).mockResolvedValue(FLUX_VOICE_CONFIG);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws STT_FLUX_PREMIUM_LOCKED on 402 with premium_locked code', async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeResponse(402, { error: { code: 'premium_locked', message: 'upgrade required' } })
    );
    await expect(SpeechToTextService.transcribe(AUDIO_REQUEST)).rejects.toThrow('STT_FLUX_PREMIUM_LOCKED');
  });

  it('throws STT_QUOTA on a generic 402 (no premium_locked code)', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(402, { error: { code: 'other_code', message: 'nope' } }));
    await expect(SpeechToTextService.transcribe(AUDIO_REQUEST)).rejects.toThrow('STT_QUOTA');
  });

  it('throws STT_AUTH on 401', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(401, { error: { message: 'invalid key' } }));
    await expect(SpeechToTextService.transcribe(AUDIO_REQUEST)).rejects.toThrow('STT_AUTH');
  });

  it('throws STT_TOO_LARGE on 413', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(413, { error: { code: 'file_too_large' } }));
    await expect(SpeechToTextService.transcribe(AUDIO_REQUEST)).rejects.toThrow('STT_TOO_LARGE');
  });

  it('throws STT_RATE_LIMITED on 429', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(429, { error: { code: 'rate_limit_error' } }));
    await expect(SpeechToTextService.transcribe(AUDIO_REQUEST)).rejects.toThrow('STT_RATE_LIMITED');
  });

  it('throws STT_PROVIDER_DOWN on a 500', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(500, { error: { message: 'server error' } }));
    await expect(SpeechToTextService.transcribe(AUDIO_REQUEST)).rejects.toThrow('STT_PROVIDER_DOWN');
  });

  it('returns a result with provider flux-voice on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ text: 'hello world', language: 'en' }), { status: 200 })
    );
    const result = await SpeechToTextService.transcribe(AUDIO_REQUEST);
    expect(result.provider).toBe('flux-voice');
    expect(result.text).toBe('hello world');
    expect(result.model).toBe('flux-voice');
    expect(result.language).toBe('en');
  });

  it('sends the correct Authorization header and URL from the flux config block', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ text: 'hi' }), { status: 200 }));
    await SpeechToTextService.transcribe(AUDIO_REQUEST);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe('https://api.fluxrouter.ai/v1/audio/transcriptions');
    expect(((init?.headers ?? {}) as Record<string, string>)['Authorization']).toBe('Bearer sk-flux-test');
  });
});

describe('SpeechToTextService — Flux Voice backward compatibility', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves a Flux key stored under the legacy openai block', async () => {
    vi.mocked(ProcessConfig.get).mockResolvedValue(FLUX_LEGACY_OPENAI_CONFIG);
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ text: 'hi' }), { status: 200 }));

    const result = await SpeechToTextService.transcribe(AUDIO_REQUEST);

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(((init?.headers ?? {}) as Record<string, string>)['Authorization']).toBe('Bearer sk-flux-legacy');
    expect(result.provider).toBe('flux-voice');
  });
});

describe('SpeechToTextService — shared taxonomy across providers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('types an OpenAI 401 failure as STT_AUTH (not just STT_REQUEST_FAILED)', async () => {
    vi.mocked(ProcessConfig.get).mockResolvedValue(OPENAI_CONFIG);
    vi.mocked(fetch).mockResolvedValue(makeResponse(401, { error: { message: 'invalid key' } }));
    await expect(SpeechToTextService.transcribe(AUDIO_REQUEST)).rejects.toThrow('STT_AUTH');
  });

  it('still falls back to STT_REQUEST_FAILED for an unclassified OpenAI 400', async () => {
    vi.mocked(ProcessConfig.get).mockResolvedValue(OPENAI_CONFIG);
    vi.mocked(fetch).mockResolvedValue(makeResponse(400, { error: { message: 'bad audio' } }));
    await expect(SpeechToTextService.transcribe(AUDIO_REQUEST)).rejects.toThrow('STT_REQUEST_FAILED:bad audio');
  });
});
