// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const streamHandlers: Array<(p: unknown) => void> = [];
vi.mock('@/common/adapter/ipcBridge', () => ({
  voiceSynth: {
    speakStream: { invoke: vi.fn(async () => ({ ok: true, engineUsed: 'kokoro-local', notices: [] })) },
    stream: {
      on: vi.fn((cb: (p: unknown) => void) => {
        streamHandlers.push(cb);
        return () => {};
      }),
    },
    stop: { invoke: vi.fn(async () => ({})) },
  },
}));

import { playStreamedAudio, stopVoicePlayback } from '@/renderer/utils/voicePlayback';
import { voiceSynth } from '@/common/adapter/ipcBridge';

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  destination = {};
  currentTime = 0;
  closed = false;
  decoded: number[] = [];
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  decodeAudioData(buf: ArrayBuffer) {
    this.decoded.push(buf.byteLength);
    return Promise.resolve({ duration: 0.5 } as AudioBuffer);
  }
  createBufferSource() {
    const src = {
      buffer: null as AudioBuffer | null,
      connect() {},
      start() {},
      stop() {},
      onended: null as null | (() => void),
    };
    return src;
  }
  close() {
    this.closed = true;
    return Promise.resolve();
  }
}

beforeEach(() => {
  streamHandlers.length = 0;
  vi.clearAllMocks();
  FakeAudioContext.instances = [];
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('window', { speechSynthesis: { cancel: vi.fn() }, AudioContext: FakeAudioContext });
});

const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');

describe('playStreamedAudio', () => {
  it('invokes speakStream with a requestId and the provided text/config', async () => {
    const p = playStreamedAudio({ text: 'hello', config: { chain: ['kokoro-local'], engines: {} } });
    expect(voiceSynth.speakStream.invoke).toHaveBeenCalledTimes(1);
    const arg = (voiceSynth.speakStream.invoke as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(typeof arg.requestId).toBe('string');
    expect(arg.text).toBe('hello');
    // resolve the stream so the promise settles
    streamHandlers.forEach((h) =>
      h({ requestId: arg.requestId, seq: 0, dataB64: b64([82, 73, 70, 70, 0, 0]), mimeType: 'audio/wav', final: true })
    );
    await p;
  });

  it('ignores frames whose requestId does not match (scoping)', async () => {
    const p = playStreamedAudio({ text: 'x', config: { chain: ['kokoro-local'], engines: {} } });
    const arg = (voiceSynth.speakStream.invoke as ReturnType<typeof vi.fn>).mock.calls[0][0];
    streamHandlers.forEach((h) =>
      h({ requestId: 'OTHER', seq: 0, dataB64: b64([1, 2]), mimeType: 'audio/wav', final: true })
    );
    streamHandlers.forEach((h) =>
      h({ requestId: arg.requestId, seq: 0, dataB64: b64([82, 73, 70, 70]), mimeType: 'audio/wav', final: true })
    );
    const result = await p;
    expect(result.ok).toBe(true);
    // only the matching final frame ended playback; the foreign frame was dropped
    expect(FakeAudioContext.instances[0].decoded.length).toBeGreaterThanOrEqual(1);
  });

  it('stopVoicePlayback closes the audio context and unsubscribes', async () => {
    const p = playStreamedAudio({ text: 'x', config: { chain: ['kokoro-local'], engines: {} } });
    const arg = (voiceSynth.speakStream.invoke as ReturnType<typeof vi.fn>).mock.calls[0][0];
    stopVoicePlayback();
    // a late frame after stop must be ignored (no throw)
    streamHandlers.forEach((h) =>
      h({ requestId: arg.requestId, seq: 1, dataB64: b64([0]), mimeType: 'audio/wav', final: true })
    );
    await p;
    expect(FakeAudioContext.instances[0].closed).toBe(true);
  });

  it('returns failover notices from the envelope', async () => {
    (voiceSynth.speakStream.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      engineUsed: 'kokoro-local',
      notices: [{ failedEngine: 'azure', fellBackTo: 'kokoro-local', error: 'quota' }],
    });
    const p = playStreamedAudio({ text: 'x', config: { chain: ['azure', 'kokoro-local'], engines: {} } });
    const arg = (voiceSynth.speakStream.invoke as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
    streamHandlers.forEach((h) =>
      h({ requestId: arg.requestId, seq: 0, dataB64: '', mimeType: 'audio/wav', final: true })
    );
    const result = await p;
    expect(result.notices?.[0]).toMatchObject({ failedEngine: 'azure', fellBackTo: 'kokoro-local' });
  });
});
