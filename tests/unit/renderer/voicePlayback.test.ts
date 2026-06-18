// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { playAudioClip, stopVoicePlayback } from '@/renderer/utils/voicePlayback';

class FakeAudio {
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  paused = false;
  static instances: FakeAudio[] = [];
  constructor(public src: string) { FakeAudio.instances.push(this); }
  play() { return Promise.resolve(); }
  pause() { this.paused = true; }
}

beforeEach(() => {
  FakeAudio.instances = [];
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
  vi.stubGlobal('window', { speechSynthesis: { cancel: vi.fn() } });
});

describe('voicePlayback', () => {
  it('resolves ok when playback ends', async () => {
    const p = playAudioClip(new Uint8Array([1]), 'audio/wav');
    FakeAudio.instances[0].onended?.();
    expect(await p).toEqual({ ok: true });
  });

  it('starting a new clip pauses the previous one (single utterance)', async () => {
    const p1 = playAudioClip(new Uint8Array([1]), 'audio/wav');
    const p2 = playAudioClip(new Uint8Array([2]), 'audio/wav');
    expect(FakeAudio.instances[0].paused).toBe(true);
    FakeAudio.instances[1].onended?.();
    await p2;
    void p1; // first promise resolves via its own handlers when revoked - not asserted
  });

  it('stopVoicePlayback pauses and is idempotent', () => {
    void playAudioClip(new Uint8Array([1]), 'audio/wav');
    stopVoicePlayback();
    stopVoicePlayback();
    expect(FakeAudio.instances[0].paused).toBe(true);
  });
});
