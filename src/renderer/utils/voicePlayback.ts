/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { voiceSynth } from '@/common/adapter/ipcBridge';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';

/** The one place audio plays. Single active utterance app-wide; starting a new
 * playback stops the previous one. stop() is idempotent. */
type StreamSession = {
  kind: 'stream';
  requestId: string;
  ctx: AudioContext;
  off: () => void;
  stopped: boolean;
};
type ClipSession = { kind: 'clip'; audio: HTMLAudioElement; url: string };
let activeSession: StreamSession | ClipSession | null = null;

let requestCounter = 0;
const nextRequestId = (): string => `tts_${Date.now()}_${++requestCounter}`;

/** True while an utterance is currently playing (stream or clip). Used by the
 * open-voice controller to decide barge-in without reaching into module state. */
export const isVoicePlaybackActive = (): boolean => activeSession !== null;

export const stopVoicePlayback = (): void => {
  if (activeSession) {
    if (activeSession.kind === 'clip') {
      activeSession.audio.pause();
      URL.revokeObjectURL(activeSession.url);
    } else {
      activeSession.stopped = true;
      activeSession.off();
      void activeSession.ctx.close().catch(() => {});
    }
    activeSession = null;
  }
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
};

export type PlaybackResult = { ok: boolean; error?: string };

export const playAudioClip = (data: Uint8Array, mimeType: string): Promise<PlaybackResult> => {
  stopVoicePlayback();
  const blob = new Blob([data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const session: ClipSession = { kind: 'clip', audio, url };
  activeSession = session;
  return new Promise((resolve) => {
    const finish = (result: PlaybackResult) => {
      if (activeSession === session) {
        URL.revokeObjectURL(url);
        activeSession = null;
      }
      resolve(result);
    };
    audio.onended = () => finish({ ok: true });
    audio.onerror = () => finish({ ok: false, error: 'Audio playback failed' });
    audio.play().catch((err) => finish({ ok: false, error: err instanceof Error ? err.message : String(err) }));
  });
};

export type StreamPlaybackResult = {
  ok: boolean;
  error?: string;
  engineUsed?: string;
  notices?: { failedEngine: string; fellBackTo: string; error: string }[];
};

/**
 * Synthesize `text` through the streaming voiceSynth chain and play it back
 * gaplessly via Web Audio. Honors the single-utterance contract (starting a
 * new playback stops the previous one) and stopVoicePlayback(). Frames are
 * scoped by requestId so other windows/WebUI clients are ignored.
 */
export const playStreamedAudio = (args: {
  text: string;
  config: Partial<TextToSpeechConfig>;
}): Promise<StreamPlaybackResult> => {
  stopVoicePlayback();
  const requestId = nextRequestId();
  const ctx = new (window.AudioContext ?? AudioContext)();
  let nextStartTime = 0;
  let queueTail: Promise<void> = Promise.resolve();
  let pendingSources = 0;
  let finalReceived = false;
  let resolveDone: (() => void) | null = null;
  const allPlayed = new Promise<void>((res) => {
    resolveDone = res;
  });

  const session: StreamSession = { kind: 'stream', requestId, ctx, off: () => {}, stopped: false };
  activeSession = session;

  const maybeFinish = () => {
    if (finalReceived && pendingSources === 0) resolveDone?.();
  };

  const off = voiceSynth.stream.on((payload) => {
    const frame = payload as { requestId: string; seq: number; dataB64: string; mimeType: string; final: boolean };
    if (!frame || frame.requestId !== requestId || session.stopped) return;
    if (frame.final && !frame.dataB64) {
      finalReceived = true;
      maybeFinish();
      return;
    }
    // decode + schedule this frame after the previous one (gapless)
    queueTail = queueTail.then(async () => {
      if (session.stopped) return;
      const bytes = Uint8Array.from(atob(frame.dataB64), (c) => c.charCodeAt(0));
      let buffer: AudioBuffer;
      try {
        buffer = await ctx.decodeAudioData(
          bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        );
      } catch {
        return; // skip an undecodable frame rather than abort the utterance
      }
      if (session.stopped) return;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      const startAt = Math.max(ctx.currentTime, nextStartTime);
      pendingSources += 1;
      src.onended = () => {
        pendingSources -= 1;
        maybeFinish();
      };
      src.start(startAt);
      nextStartTime = startAt + buffer.duration;
    });
    if (frame.final) {
      finalReceived = true;
      void queueTail.then(maybeFinish);
    }
  });
  session.off = off;

  return (async () => {
    let envelope: StreamPlaybackResult;
    try {
      envelope = await voiceSynth.speakStream.invoke({ requestId, text: args.text, config: args.config });
    } catch (err) {
      session.stopped = true;
      off();
      void ctx.close().catch(() => {});
      if (activeSession === session) activeSession = null;
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    if (!envelope.ok) {
      session.stopped = true;
      off();
      void ctx.close().catch(() => {});
      if (activeSession === session) activeSession = null;
      return envelope;
    }
    finalReceived = true;
    maybeFinish();
    await allPlayed;
    off();
    void ctx.close().catch(() => {});
    if (activeSession === session) activeSession = null;
    return envelope;
  })();
};
