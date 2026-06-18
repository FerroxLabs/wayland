// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createVoiceCapture } from '@/renderer/utils/voiceCapture';

const trackStop = vi.fn();
let getUserMediaArg: unknown = null;

class FakeAnalyser {
  fftSize = 0;
  frequencyBinCount = 512;
  getByteTimeDomainData(buf: Uint8Array) {
    // Fill with a non-zero waveform so RMS > 0.
    for (let i = 0; i < buf.length; i += 1) {
      buf[i] = i % 2 === 0 ? 200 : 56;
    }
  }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  closed = false;
  analyser = new FakeAnalyser();
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  createAnalyser() {
    return this.analyser;
  }
  createMediaStreamSource() {
    return { connect: vi.fn() };
  }
  close() {
    this.closed = true;
    return Promise.resolve();
  }
}

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = vi.fn(() => true);
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() {
    FakeMediaRecorder.instances.push(this);
  }
  start() {
    this.state = 'recording';
    this.ondataavailable?.({ data: new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' }) });
  }
  stop() {
    this.state = 'inactive';
    this.onstop?.();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  trackStop.mockClear();
  getUserMediaArg = null;
  FakeAudioContext.instances = [];
  FakeMediaRecorder.instances = [];

  const fakeStream = { getTracks: () => [{ stop: trackStop }] };
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn(async (arg: unknown) => {
        getUserMediaArg = arg;
        return fakeStream;
      }),
    },
  });
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('createVoiceCapture', () => {
  it('requests getUserMedia with echo cancellation constraints', async () => {
    const capture = createVoiceCapture();
    await capture.startListening(() => {});
    expect(getUserMediaArg).toMatchObject({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    expect(capture.isListening()).toBe(true);
  });

  it('delivers RMS frames on the frame loop', async () => {
    const capture = createVoiceCapture();
    const onFrame = vi.fn();
    await capture.startListening(onFrame, 50);
    vi.advanceTimersByTime(160);
    expect(onFrame).toHaveBeenCalled();
    expect(onFrame.mock.calls[0][0]).toBeGreaterThan(0);
  });

  it('beginUtterance then endUtterance resolves a Blob', async () => {
    const capture = createVoiceCapture();
    await capture.startListening(() => {});
    capture.beginUtterance();
    const blob = await capture.endUtterance();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/webm');
  });

  it('stop() stops the track and closes the audio context', async () => {
    const capture = createVoiceCapture();
    await capture.startListening(() => {});
    capture.stop();
    expect(trackStop).toHaveBeenCalled();
    expect(FakeAudioContext.instances[0].closed).toBe(true);
    expect(capture.isListening()).toBe(false);
  });

  it('startListening rejects when getUserMedia fails', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('denied')
    );
    const capture = createVoiceCapture();
    await expect(capture.startListening(() => {})).rejects.toThrow('denied');
  });
});
