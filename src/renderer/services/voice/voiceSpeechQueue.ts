/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechBridgeResult } from '@/common/types/ttsTypes';

/**
 * Bounded synthesis pipeline and gapless playback for sentence-chunked speech.
 *
 * One answer becomes several `speak` calls, and the two things that go wrong if
 * you just fire them all and play whatever comes back are both about ORDER and
 * OWNERSHIP.
 *
 * Order: `say` genuinely runs in parallel, and short sentences finish first. Ten
 * concurrent calls therefore come back shuffled, and a hosted provider bills for
 * every one of them even when the user interrupts after the first. So at most
 * two calls are outstanding, results are stored BY INDEX, and index N is never
 * scheduled before index N-1.
 *
 * Ownership: the session machine returns to `listening`, clears the turn, and
 * reopens the microphone on `playback_completed`. Emitting that per chunk means
 * the mic reopens over the assistant's own voice halfway through the answer, so
 * exactly one chunk - the last one in a sealed queue - owns it.
 *
 * And there is no cancel anywhere in the synthesis path: `voiceSynth.stop` is a
 * no-op, `speak` takes `{text}` with no abort token, and main keeps no handle on
 * the `say` child or the hosted fetch. So an interrupt needs BOTH halves. The
 * epoch stops the queue ISSUING more work and discards whatever is already out;
 * `stopAll()` stops what is already sounding. Neither alone is enough, and the
 * accepted residual is one orphaned in-flight call per interrupt.
 */

/**
 * Silence floor, as a normalized float sample. Measured on real `say` output:
 * a 2.997 s clip carried 309 ms of leading silence and a 2.395 s clip carried
 * 174 ms. Played back-to-back untrimmed that is a quarter-second of dead air at
 * every seam, which is what makes chunked playback sound like two speakers.
 */
const SILENCE_THRESHOLD = 200 / 32767;

/** How many `speak` calls may be outstanding at once. */
const MAX_IN_FLIGHT = 2;

/**
 * The slice of Web Audio this queue needs, named structurally.
 *
 * Written as its own type rather than `AudioContext` for one reason: there is no
 * Web Audio in the test environment at all, so a nominal dependency would make
 * the scheduling arithmetic untestable and it would ship unpinned. A real
 * `AudioContext` satisfies this shape.
 */
export type SpeechQueueSource = {
  buffer: AudioBuffer | null;
  onended: ((event: Event) => void) | null;
  connect(destination: AudioNode): void;
  start(when?: number, offset?: number, duration?: number): void;
  stop(when?: number): void;
};

export type SpeechQueueContext = {
  readonly state: AudioContextState;
  readonly currentTime: number;
  readonly destination: AudioNode;
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>;
  createBufferSource(): SpeechQueueSource;
};

export type VoiceSpeechQueueOptions = {
  context: SpeechQueueContext;
  speak: (text: string) => Promise<TextToSpeechBridgeResult>;
  /**
   * A chunk has just STARTED sounding. The caller emits
   * `response_segment_ready` + `playback_started` here, because
   * `activeSegmentId` is single-valued and `playback_started` is rejected with
   * `segment_mismatch` against any other segment. Returning false abandons the
   * turn - the caller's own machine refused the transition.
   */
  onSegmentStart: (index: number) => boolean;
  /** The final chunk of a sealed queue has ended. Fires at most once. */
  onCompleted: () => void;
  onFailed: (errorCode: string) => void;
};

export type VoiceSpeechQueue = {
  /** Hand one already-normalized sentence to synthesis. */
  enqueue: (text: string) => void;
  /** No more text is coming. Whatever is last now owns `playback_completed`. */
  seal: () => void;
  /** Stop every scheduled node and discard every result still in flight. */
  stopAll: () => void;
  /** Scheduling arithmetic, exposed so it can be asserted rather than inferred. */
  readonly stats: { epoch: number; cursor: number; scheduled: number };
};

/**
 * Where the speech actually is inside a synthesized clip.
 *
 * Returned as an offset/duration pair rather than a copied buffer:
 * `AudioBufferSourceNode.start(when, offset, duration)` already plays a window
 * of a buffer, so trimming is a pair of numbers, not a reallocation.
 *
 * A clip that is silent end to end is played whole. It is a synthesis oddity
 * rather than a boundary problem, and collapsing it to zero length would drop a
 * chunk out of the chain that carries the start of the next one.
 */
export const measureSpeech = (buffer: AudioBuffer): { offset: number; duration: number } => {
  let first = -1;
  let last = -1;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < samples.length; i++) {
      if (Math.abs(samples[i]) > SILENCE_THRESHOLD) {
        if (first < 0 || i < first) first = i;
        break;
      }
    }
    for (let i = samples.length - 1; i >= 0; i--) {
      if (Math.abs(samples[i]) > SILENCE_THRESHOLD) {
        if (i > last) last = i;
        break;
      }
    }
  }
  if (first < 0 || last < first) return { offset: 0, duration: buffer.duration };
  return {
    offset: first / buffer.sampleRate,
    duration: (last - first + 1) / buffer.sampleRate,
  };
};

export const createVoiceSpeechQueue = ({
  context,
  speak,
  onSegmentStart,
  onCompleted,
  onFailed,
}: VoiceSpeechQueueOptions): VoiceSpeechQueue => {
  /** Bumped by `stopAll`. Anything carrying an older epoch is discarded. */
  let epoch = 0;
  const texts: string[] = [];
  const decoded: (AudioBuffer | null)[] = [];
  const sources: SpeechQueueSource[] = [];

  let issued = 0;
  let inFlight = 0;
  let scheduled = 0;
  let announced = 0;
  let ended = 0;
  /** AudioContext time at which the last scheduled chunk stops. */
  let cursor = 0;
  let sealed = false;
  let completed = false;
  let abandoned = false;

  const stale = (at: number): boolean => at !== epoch || abandoned;

  const stopScheduled = () => {
    for (const source of sources) {
      // Real `stop()` still fires `onended`; the epoch guard on the handler is
      // what makes that harmless. Detaching is belt and braces.
      source.onended = null;
      try {
        source.stop();
      } catch {
        // A node that was never started, or was already stopped, throws. There
        // is nothing to recover: it is not making sound either way.
      }
    }
    sources.length = 0;
  };

  const fail = (errorCode: string) => {
    if (abandoned) return;
    abandoned = true;
    stopScheduled();
    onFailed(errorCode);
  };

  /**
   * Chunk N starts the instant chunk N-1 ends, so that is when its
   * `response_segment_ready` is due. When the pipeline has fallen behind and
   * N-1 ended before N was scheduled, N starts at its own scheduling moment
   * instead - which is what `announced <= ended` allows.
   */
  const announce = () => {
    while (!abandoned && announced < scheduled && announced <= ended) {
      const index = announced;
      announced += 1;
      if (!onSegmentStart(index)) {
        abandoned = true;
        stopScheduled();
        return;
      }
    }
  };

  const maybeComplete = () => {
    if (completed || abandoned || !sealed) return;
    if (ended < texts.length) return;
    completed = true;
    onCompleted();
  };

  const handleEnded = (at: number, index: number) => {
    if (stale(at)) return;
    if (index + 1 > ended) ended = index + 1;
    announce();
    maybeComplete();
  };

  const drain = () => {
    while (!abandoned && decoded[scheduled]) {
      // A clock that is not advancing accepts every schedule and sounds
      // nothing, which is silence with no error - the exact failure this whole
      // packet exists to remove. Never schedule against one.
      if (context.state !== 'running') {
        fail('TTS_AUDIO_CONTEXT_BLOCKED');
        return;
      }
      const index = scheduled;
      scheduled += 1;
      const buffer = decoded[index];
      const { offset, duration } = measureSpeech(buffer);
      const at = epoch;
      const when = Math.max(cursor, context.currentTime);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.onended = () => handleEnded(at, index);
      source.start(when, offset, duration);
      sources.push(source);
      cursor = when + duration;
      announce();
    }
  };

  const pump = () => {
    while (!abandoned && inFlight < MAX_IN_FLIGHT && issued < texts.length) {
      const index = issued;
      issued += 1;
      const at = epoch;
      inFlight += 1;
      void (async () => {
        try {
          const result = await speak(texts[index]);
          // Nothing below this line may touch shared state on a stale epoch:
          // the interrupt already happened and this result is the orphan the
          // absence of a cancel guarantees.
          if (stale(at)) return;
          if (result.ok === false) {
            fail(result.errorCode);
            return;
          }
          if (result.data.length === 0) {
            fail('TTS_EMPTY_AUDIO');
            return;
          }
          const bytes = Uint8Array.from(result.data);
          const buffer = await context.decodeAudioData(bytes.buffer as ArrayBuffer);
          if (stale(at)) return;
          decoded[index] = buffer;
          drain();
        } catch {
          if (stale(at)) return;
          fail('TTS_PLAYBACK_FAILED');
        } finally {
          if (!stale(at)) {
            inFlight -= 1;
            pump();
          }
        }
      })();
    }
  };

  return {
    enqueue: (text: string) => {
      if (abandoned || sealed) return;
      // Refuse before spending a synthesis call, not after: on a hosted
      // provider that call is billed whether or not anything can play it.
      if (context.state !== 'running') {
        fail('TTS_AUDIO_CONTEXT_BLOCKED');
        return;
      }
      texts.push(text);
      decoded.push(null);
      pump();
    },
    seal: () => {
      if (sealed) return;
      sealed = true;
      // The stream can finish after everything enqueued has already been heard.
      maybeComplete();
    },
    stopAll: () => {
      epoch += 1;
      abandoned = true;
      stopScheduled();
      inFlight = 0;
      cursor = 0;
    },
    get stats() {
      return { epoch, cursor, scheduled };
    },
  };
};
