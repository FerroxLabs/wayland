/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getAppPath: () => process.cwd(), on: vi.fn() } }));

vi.mock('@office-ai/platform', () => ({
  bridge: {
    buildProvider: vi.fn(() => {
      const handlerMap = new Map<string, Function>();
      return {
        provider: vi.fn((handler: Function) => {
          handlerMap.set('handler', handler);
          return vi.fn();
        }),
        invoke: vi.fn(),
        _getHandler: () => handlerMap.get('handler'),
      };
    }),
    buildEmitter: vi.fn(() => ({
      emit: vi.fn(),
      on: vi.fn(),
    })),
  },
  storage: {
    buildStorage: () => ({
      getSync: () => undefined,
      setSync: () => {},
      get: () => Promise.resolve(undefined),
      set: () => Promise.resolve(),
    }),
  },
}));

vi.mock('electron-log', () => ({
  default: {
    transports: { file: { level: 'info' } },
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

/**
 * Retrieve the handler registered on a (mocked) provider object. The
 * buildProvider wrapper in bridgeAllowlist interposes on `provider`, so the
 * handler must be read via the mock's `_getHandler` registry rather than
 * `vi.mocked(...).mock.calls`.
 */
const getHandler = (providerObj: unknown): Function => {
  const handler = (providerObj as { _getHandler?: () => Function | undefined })._getHandler?.();
  if (!handler) throw new Error('handler not registered');
  return handler;
};

describe('voiceSynthBridge', () => {
  it('speak returns a chain-aware whole-clip envelope', async () => {
    vi.resetModules();
    const { initVoiceSynthBridge } = await import('@process/bridge/voiceSynthBridge');
    const { ipcBridge } = await import('@/common');
    const { registerTtsEngine, _resetRegistryForTest } = await import('@process/services/voice/engine/registry');
    // initVoiceSynthBridge registers the REAL engines (whose 'kokoro-local'
    // would replace a pre-registered fake), so init first, wipe, then fake.
    initVoiceSynthBridge();
    _resetRegistryForTest();
    registerTtsEngine({
      id: 'kokoro-local',
      local: true,
      streaming: false,
      available: async () => ({ ok: true }),
      voices: async () => [],
      synthesize: async (_t, _o, onChunk) => {
        onChunk({ data: new Uint8Array([9, 9]), mimeType: 'audio/wav', seq: 0, final: true });
      },
    });
    const handler = getHandler(ipcBridge.voiceSynth.speak);
    const result = await handler({ text: 'hi', config: { chain: ['kokoro-local'], engines: {} } });
    expect(result.ok).toBe(true);
    expect(result.engineUsed).toBe('kokoro-local');
    expect(result.data).toEqual([9, 9]);
  });

  it('speak-stream emits base64 frames scoped by requestId and resolves after final', async () => {
    vi.resetModules();
    const { initVoiceSynthBridge } = await import('@process/bridge/voiceSynthBridge');
    const { ipcBridge } = await import('@/common');
    const { registerTtsEngine, _resetRegistryForTest } = await import('@process/services/voice/engine/registry');
    initVoiceSynthBridge();
    _resetRegistryForTest();
    registerTtsEngine({
      id: 'kokoro-local',
      local: true,
      streaming: true,
      available: async () => ({ ok: true }),
      voices: async () => [],
      synthesize: async (_t, _o, onChunk) => {
        onChunk({ data: new Uint8Array([1, 2]), mimeType: 'audio/wav', seq: 0, final: false });
        onChunk({ data: new Uint8Array([3]), mimeType: 'audio/wav', seq: 1, final: true });
      },
    });
    const handler = getHandler(ipcBridge.voiceSynth.speakStream);
    const emitMock = vi.mocked(ipcBridge.voiceSynth.stream.emit).mock;
    const result = await handler({ requestId: 'r1', text: 'hi', config: { chain: ['kokoro-local'], engines: {} } });
    expect(result.ok).toBe(true);
    expect(emitMock.calls).toHaveLength(2);
    expect(emitMock.calls[0][0]).toMatchObject({ requestId: 'r1', seq: 0, final: false });
    expect(emitMock.calls[1][0]).toMatchObject({ requestId: 'r1', seq: 1, final: true });
    expect(Buffer.from(emitMock.calls[1][0].dataB64, 'base64')).toEqual(Buffer.from([3]));
  });

  it('speak returns ok:false envelope when the chain is exhausted (never throws)', async () => {
    vi.resetModules();
    const { initVoiceSynthBridge } = await import('@process/bridge/voiceSynthBridge');
    const { ipcBridge } = await import('@/common');
    const { _resetRegistryForTest } = await import('@process/services/voice/engine/registry');
    // Empty the registry AFTER init so the chain id below is unknown. (Relying
    // on real engines to fail would not work: system-native is always ok=true
    // and returns empty audio off-darwin.)
    initVoiceSynthBridge();
    _resetRegistryForTest();
    const handler = getHandler(ipcBridge.voiceSynth.speak);
    const result = await handler({ text: 'hi', config: { chain: ['nonexistent-engine'] as never, engines: {} } });
    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe('string');
  });

  it('registers a warmup provider that returns the chain warm envelope', async () => {
    vi.resetModules();
    const { initVoiceSynthBridge } = await import('@process/bridge/voiceSynthBridge');
    const { ipcBridge } = await import('@/common');
    const { registerTtsEngine, _resetRegistryForTest } = await import('@process/services/voice/engine/registry');
    initVoiceSynthBridge();
    _resetRegistryForTest();
    const warmup = vi.fn(async () => {});
    registerTtsEngine({
      id: 'kokoro-local',
      local: true,
      streaming: true,
      available: async () => ({ ok: true }),
      voices: async () => [],
      synthesize: async () => {},
      warmup,
    });
    const handler = getHandler(ipcBridge.voiceSynth.warmup);
    const result = await handler({ config: { chain: ['kokoro-local'], engines: {} } });
    expect(result).toEqual({ warmed: 'kokoro-local' });
    expect(warmup).toHaveBeenCalledTimes(1);
  });

  it('mergeAudioParts rebuilds a single WAV from multi-sentence chunks', async () => {
    vi.resetModules();
    const { mergeAudioParts } = await import('@process/bridge/voiceSynthBridge');
    const { pcmToWav } = await import('@process/services/voice/engine/tts/kokoroWorker');
    const a = pcmToWav(new Uint8Array([1, 2, 3, 4]), 24000);
    const b = pcmToWav(new Uint8Array([5, 6]), 24000);
    const merged = mergeAudioParts([a, b], 'audio/wav');
    // One header (44 bytes) + 6 bytes of joined PCM - not two stacked WAVs.
    expect(merged.length).toBe(44 + 6);
    expect(Array.from(merged.slice(0, 4))).toEqual([82, 73, 70, 70]); // RIFF
    expect(Array.from(merged.slice(44))).toEqual([1, 2, 3, 4, 5, 6]);
    expect(Buffer.from(merged.slice(24, 28)).readUInt32LE(0)).toBe(24000);
    // single part passes through untouched
    expect(mergeAudioParts([a], 'audio/wav')).toBe(a);
  });
});
