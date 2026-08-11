/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TextToSpeechBridgeResult } from '@/common/types/ttsTypes';
import {
  createVoiceSpeechQueue,
  measureSpeech,
  type SpeechQueueContext,
  type SpeechQueueSource,
} from '@/renderer/services/voice/voiceSpeechQueue';

/**
 * WHAT THIS SUITE CAN AND CANNOT TELL YOU.
 *
 * There is no Web Audio in the test environment - `typeof AudioContext` is
 * `undefined` in jsdom and the node project has no DOM at all - and the one
 * in-repo precedent for `decodeAudioData` (`localWhisper.ts`) has no test file.
 * So everything below is asserted against a fake written by the same hand that
 * wrote the implementation, which is exactly the shape of the bug this packet
 * exists to fix: a suite that stays green while the app is silent.
 *
 * The fake is therefore written to be adversarial rather than convenient:
 *  - `start(when, offset, duration)` SCHEDULES against an audio clock that only
 *    moves when a test moves it. Nothing plays because a promise resolved.
 *  - `onended` fires when that clock reaches `when + duration`, in chronological
 *    order across sources, and a handler may schedule more work while the clock
 *    is being advanced.
 *  - `stop()` cancels a pending `onended`.
 *  - `speak` never resolves on its own. Every result is released by name, which
 *    is how index 2 is made to land before index 1.
 *
 * One deliberate divergence from the real API, called out so it is not mistaken
 * for coverage: a real `AudioBufferSourceNode` DOES fire `onended` after
 * `stop()`. The fake suppressing it is the friendlier behaviour, so the epoch
 * guard on the ended handler is not proven here. That guard is why the
 * production code detaches `onended` inside `stopAll` as well.
 *
 * What is genuinely pinned: ordering, the in-flight bound, cursor arithmetic,
 * one-and-only-one completion, and that both halves of an interrupt do
 * something. H3 - packaged app, real speakers, one long answer - is the gate.
 */

// ---------------------------------------------------------------------------
// The fake
// ---------------------------------------------------------------------------

type StartCall = { when: number; offset: number; duration: number };

class FakeSource implements SpeechQueueSource {
  buffer: AudioBuffer | null = null;
  onended: ((event: Event) => void) | null = null;
  readonly startCalls: StartCall[] = [];
  stopCalls = 0;
  connected = false;
  /** Audio-clock time at which `onended` becomes due, or null when it cannot. */
  endsAt: number | null = null;

  connect() {
    this.connected = true;
  }

  start(when = 0, offset = 0, duration = 0) {
    this.startCalls.push({ when, offset, duration });
    this.endsAt = when + duration;
  }

  stop() {
    this.stopCalls += 1;
    this.endsAt = null;
  }
}

class FakeAudioContext implements SpeechQueueContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {} as AudioNode;
  readonly sources: FakeSource[] = [];
  /** Swapped per test to make decoding reject. */
  decode: (index: number) => Promise<AudioBuffer> = async (index) => buffers[index];

  createBufferSource(): SpeechQueueSource {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer> {
    return this.decode(new Uint8Array(data)[0]);
  }

  /** Move the audio clock, firing every `onended` that falls due, in order. */
  advance(seconds: number) {
    const target = this.currentTime + seconds;
    for (;;) {
      const due = this.sources
        .filter((source) => source.endsAt !== null && source.endsAt <= target)
        .sort((a, b) => (a.endsAt ?? 0) - (b.endsAt ?? 0))[0];
      if (!due) break;
      this.currentTime = due.endsAt ?? target;
      const handler = due.onended;
      due.endsAt = null;
      handler?.({} as Event);
    }
    this.currentTime = target;
  }
}

const SAMPLE_RATE = 8000;

/**
 * A clip with real leading and trailing silence, the way `say` produces them.
 * `body` samples sit at 0.5, everything else at 0 - well under and well over
 * the 200/32767 floor respectively.
 */
const makeBuffer = (lead: number, body: number, trail: number): AudioBuffer => {
  const samples = new Float32Array(lead + body + trail);
  samples.fill(0.5, lead, lead + body);
  return {
    numberOfChannels: 1,
    sampleRate: SAMPLE_RATE,
    length: samples.length,
    duration: samples.length / SAMPLE_RATE,
    getChannelData: () => samples,
  } as unknown as AudioBuffer;
};

/** Trimmed durations: 0.2 s, 0.3 s, 0.1 s, 0.4 s, 0.5 s. */
const buffers: AudioBuffer[] = [
  makeBuffer(800, 1600, 400),
  makeBuffer(400, 2400, 800),
  makeBuffer(0, 800, 1600),
  makeBuffer(1200, 3200, 0),
  makeBuffer(160, 4000, 160),
];
const TRIMMED = [0.2, 0.3, 0.1, 0.4, 0.5];

/** Lets the queue's own `await`s run to completion. */
const settle = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

type PendingSpeak = { text: string; ok: (result: TextToSpeechBridgeResult) => void };

let context: FakeAudioContext;
let pending: PendingSpeak[];
let speak: ReturnType<typeof vi.fn>;
let inFlight: number;
let maxInFlight: number;
let started: number[];
let completions: number;
let failures: string[];
let segmentStartAccepts: boolean;

const buildQueue = () =>
  createVoiceSpeechQueue({
    context,
    speak: speak as unknown as (text: string) => Promise<TextToSpeechBridgeResult>,
    onSegmentStart: (index) => {
      started.push(index);
      return segmentStartAccepts;
    },
    onCompleted: () => {
      completions += 1;
    },
    onFailed: (errorCode) => {
      failures.push(errorCode);
    },
  });

/** Release the result for the Nth `speak` call. Order is entirely the caller's. */
const resolveSpeak = async (call: number, index = call) => {
  pending[call].ok({ ok: true, data: [index], mimeType: 'audio/wav' });
  await settle();
};

beforeEach(() => {
  context = new FakeAudioContext();
  pending = [];
  inFlight = 0;
  maxInFlight = 0;
  started = [];
  completions = 0;
  failures = [];
  segmentStartAccepts = true;
  speak = vi.fn((_text: string) => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    return new Promise<TextToSpeechBridgeResult>((resolve) => {
      pending.push({
        text: _text,
        ok: (result) => {
          inFlight -= 1;
          resolve(result);
        },
      });
    });
  });
});

describe('voiceSpeechQueue', () => {
  describe('bounded, ordered synthesis', () => {
    /**
     * The whole point, in one test.
     *
     * `say` runs genuinely in parallel and short sentences come back first, so
     * the queue is fed its results in the wrong order on purpose: index 2 lands
     * before index 1. If results were scheduled as they arrive, the answer
     * plays 0, 2, 1.
     */
    it('plays 0, 1, 2 when index 2 resolves before index 1', async () => {
      const queue = buildQueue();
      queue.enqueue('First sentence here.');
      queue.enqueue('Second sentence here.');
      queue.enqueue('Third sentence here.');
      await settle();

      // Only two calls may be outstanding, so index 2 has not even been asked
      // for yet. This is what makes a barge-in cost one wasted call, not three.
      expect(speak).toHaveBeenCalledTimes(2);

      await resolveSpeak(0);
      expect(speak).toHaveBeenCalledTimes(3);

      // Out of order: the third call comes back before the second.
      await resolveSpeak(2);
      expect(context.sources).toHaveLength(1);
      expect(context.sources[0].buffer).toBe(buffers[0]);

      await resolveSpeak(1);
      queue.seal();

      expect(context.sources.map((source) => buffers.indexOf(source.buffer))).toEqual([0, 1, 2]);
      expect(maxInFlight).toBe(2);
    });

    /**
     * Gapless means the next clip starts exactly where the previous one stops,
     * measured on the TRIMMED length - `say` puts 174-309 ms of silence at the
     * head of every clip, and untrimmed that silence is the seam.
     */
    it('schedules each chunk at the previous cursor and never moves it backwards', async () => {
      const queue = buildQueue();
      queue.enqueue('First sentence here.');
      queue.enqueue('Second sentence here.');
      queue.enqueue('Third sentence here.');
      await settle();
      await resolveSpeak(0);
      await resolveSpeak(2);
      await resolveSpeak(1);
      queue.seal();

      const whens = context.sources.map((source) => source.startCalls[0].when);
      expect(whens).toEqual([0, TRIMMED[0], TRIMMED[0] + TRIMMED[1]]);
      expect(whens).toEqual([...whens].sort((a, b) => a - b));
      expect(queue.stats.cursor).toBeCloseTo(TRIMMED[0] + TRIMMED[1] + TRIMMED[2], 10);

      // And the trim itself: each source plays a window that starts after the
      // leading silence and stops before the trailing silence.
      expect(context.sources.map((source) => source.startCalls[0].duration)).toEqual(TRIMMED.slice(0, 3));
      expect(context.sources[0].startCalls[0].offset).toBeCloseTo(800 / SAMPLE_RATE, 10);
    });

    /**
     * `playback_completed` returns the machine to `listening`, clears the turn,
     * and emits `start_capture`. Per chunk, that reopens the microphone over
     * the assistant's own voice halfway through the answer.
     */
    it('completes exactly once, from the final chunk', async () => {
      const queue = buildQueue();
      queue.enqueue('First sentence here.');
      queue.enqueue('Second sentence here.');
      queue.enqueue('Third sentence here.');
      await settle();
      await resolveSpeak(0);
      await resolveSpeak(2);
      await resolveSpeak(1);
      queue.seal();

      context.advance(TRIMMED[0]);
      expect(completions).toBe(0);
      context.advance(TRIMMED[1]);
      expect(completions).toBe(0);
      context.advance(TRIMMED[2]);
      expect(completions).toBe(1);

      // Nothing left to end, and nothing that could complete a second time.
      context.advance(10);
      expect(completions).toBe(1);
    });

    /**
     * `activeSegmentId` is single-valued and `playback_started` is rejected
     * with `segment_mismatch` against anything else, so the segment events have
     * to be emitted when a chunk STARTS, not when it is scheduled - two chunks
     * are scheduled ahead at any instant.
     */
    it('announces each chunk at the moment it starts sounding', async () => {
      const queue = buildQueue();
      queue.enqueue('First sentence here.');
      queue.enqueue('Second sentence here.');
      queue.enqueue('Third sentence here.');
      await settle();
      await resolveSpeak(0);
      await resolveSpeak(2);
      await resolveSpeak(1);
      queue.seal();

      // All three are scheduled; only the first is sounding.
      expect(context.sources).toHaveLength(3);
      expect(started).toEqual([0]);

      context.advance(TRIMMED[0]);
      expect(started).toEqual([0, 1]);
      context.advance(TRIMMED[1]);
      expect(started).toEqual([0, 1, 2]);
    });

    it('seals a queue whose chunks have all already been heard', async () => {
      // The control for `seal`: the stream can finish after the audio does, and
      // the turn still has to end.
      const queue = buildQueue();
      queue.enqueue('Only sentence here.');
      await settle();
      await resolveSpeak(0);
      context.advance(TRIMMED[0]);
      expect(completions).toBe(0);

      queue.seal();
      expect(completions).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // The interrupt: two halves, both required
  // -------------------------------------------------------------------------

  /**
   * There is no cancel anywhere in the synthesis path. `voiceSynth.stop` is an
   * explicit no-op, `speak` takes `{text}` with no abort token, and main keeps
   * no handle on the `say` child or the hosted fetch. So the epoch stops the
   * queue ISSUING and discards what is already out, and `stopAll` stops what is
   * already sounding. Believing either one is a cancel is the third named way
   * this goes wrong.
   */
  describe('barge-in', () => {
    const runToInterrupt = async () => {
      const queue = buildQueue();
      for (let i = 0; i < 5; i++) queue.enqueue(`Sentence number ${i} here.`);
      await settle();
      // Two scheduled and sounding, two in flight, one never asked for.
      await resolveSpeak(0);
      await resolveSpeak(1);
      expect(context.sources).toHaveLength(2);
      expect(speak).toHaveBeenCalledTimes(4);
      return queue;
    };

    it('stops every scheduled source', async () => {
      const queue = await runToInterrupt();
      queue.stopAll();

      expect(context.sources).toHaveLength(2);
      expect(context.sources.map((source) => source.stopCalls)).toEqual([1, 1]);
    });

    it('issues no further speak calls', async () => {
      const queue = await runToInterrupt();
      queue.stopAll();

      // Index 4 was never asked for and never will be. On a hosted provider
      // that is the difference between one wasted request and five.
      await resolveSpeak(2);
      await resolveSpeak(3);
      expect(speak).toHaveBeenCalledTimes(4);
    });

    it('discards a result that lands after the interrupt', async () => {
      const queue = await runToInterrupt();
      queue.stopAll();
      const scheduledBefore = context.sources.length;

      // The orphan the absence of a cancel guarantees: index 2 was already in
      // flight when the user interrupted, and its audio must never be heard.
      await resolveSpeak(2);

      expect(context.sources).toHaveLength(scheduledBefore);
      expect(started).toEqual([0]);
      expect(completions).toBe(0);
    });

    it('bumps the epoch', async () => {
      const queue = await runToInterrupt();
      expect(queue.stats.epoch).toBe(0);
      queue.stopAll();
      expect(queue.stats.epoch).toBe(1);
    });

    it('accepts nothing more once stopped', async () => {
      const queue = await runToInterrupt();
      queue.stopAll();
      // Drain the two orphans first, so a queue that had forgotten it was
      // stopped would have free slots and take the new text.
      await resolveSpeak(2);
      await resolveSpeak(3);
      queue.enqueue('Something said after the interrupt.');
      await settle();

      expect(speak).toHaveBeenCalledTimes(4);
      expect(context.sources).toHaveLength(2);
    });

    /**
     * The control for all of the above: without the interrupt, the same script
     * schedules everything and completes normally. If this went red the
     * assertions above would be passing for the wrong reason.
     */
    it('control: the same script plays through when nothing interrupts', async () => {
      const queue = buildQueue();
      for (let i = 0; i < 5; i++) queue.enqueue(`Sentence number ${i} here.`);
      await settle();
      for (let call = 0; call < 5; call++) await resolveSpeak(call);
      queue.seal();

      expect(speak).toHaveBeenCalledTimes(5);
      expect(context.sources).toHaveLength(5);
      expect(context.sources.every((source) => source.stopCalls === 0)).toBe(true);
      context.advance(TRIMMED.reduce((total, value) => total + value, 0));
      expect(started).toEqual([0, 1, 2, 3, 4]);
      expect(completions).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // V21's negative controls
  // -------------------------------------------------------------------------

  describe('the audio clock', () => {
    /**
     * A suspended context accepts every schedule and sounds nothing: no error,
     * no `onended`, no `playback_completed`, and the session never re-arms.
     * Symptom for symptom, the bug this packet exists to remove.
     */
    it('refuses a suspended context by name, before spending a synthesis call', async () => {
      context.state = 'suspended';
      const queue = buildQueue();
      queue.enqueue('First sentence here.');
      await settle();

      expect(failures).toEqual(['TTS_AUDIO_CONTEXT_BLOCKED']);
      expect(speak).not.toHaveBeenCalled();
      expect(context.sources).toHaveLength(0);
      expect(started).toEqual([]);
    });

    it('control: the identical text plays on a running context', async () => {
      const queue = buildQueue();
      queue.enqueue('First sentence here.');
      await settle();
      await resolveSpeak(0);

      expect(failures).toEqual([]);
      expect(speak).toHaveBeenCalledTimes(1);
      expect(context.sources).toHaveLength(1);
    });

    /** A decode that rejects must be an error, not silence. */
    it('fails by name when decoding rejects', async () => {
      context.decode = async () => {
        throw new Error('EncodingError');
      };
      const queue = buildQueue();
      queue.enqueue('First sentence here.');
      await settle();
      await resolveSpeak(0);

      expect(failures).toEqual(['TTS_PLAYBACK_FAILED']);
      expect(context.sources).toHaveLength(0);
      expect(completions).toBe(0);
    });

    it('fails by name when synthesis returns no audio', async () => {
      const queue = buildQueue();
      queue.enqueue('First sentence here.');
      await settle();
      pending[0].ok({ ok: true, data: [], mimeType: 'audio/wav' });
      await settle();

      expect(failures).toEqual(['TTS_EMPTY_AUDIO']);
      expect(context.sources).toHaveLength(0);
    });

    it('abandons the turn when the caller refuses the segment transition', async () => {
      segmentStartAccepts = false;
      const queue = buildQueue();
      queue.enqueue('First sentence here.');
      queue.enqueue('Second sentence here.');
      await settle();
      await resolveSpeak(0);
      await resolveSpeak(1);
      queue.seal();

      expect(started).toEqual([0]);
      expect(context.sources[0].stopCalls).toBe(1);
      expect(completions).toBe(0);
    });
  });

  describe('measureSpeech', () => {
    it('trims leading and trailing silence at the measured floor', () => {
      expect(measureSpeech(buffers[0])).toEqual({ offset: 800 / SAMPLE_RATE, duration: 0.2 });
    });

    it('keeps a sample just above the floor', () => {
      // The control for the threshold: 201/32767 is speech, 199/32767 is not.
      const samples = new Float32Array(4);
      samples[2] = 201 / 32767;
      const loud = {
        numberOfChannels: 1,
        sampleRate: 4,
        length: 4,
        duration: 1,
        getChannelData: () => samples,
      } as unknown as AudioBuffer;
      expect(measureSpeech(loud)).toEqual({ offset: 0.5, duration: 0.25 });

      const quiet = new Float32Array(4);
      quiet[2] = 199 / 32767;
      const silent = {
        numberOfChannels: 1,
        sampleRate: 4,
        length: 4,
        duration: 1,
        getChannelData: () => quiet,
      } as unknown as AudioBuffer;
      expect(measureSpeech(silent)).toEqual({ offset: 0, duration: 1 });
    });
  });
});
