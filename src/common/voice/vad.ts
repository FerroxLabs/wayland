/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type VadEvent = 'speech-start' | 'speech-end';

export type VadConfig = {
  /** Frame cadence in ms (how often push() is called). */
  frameMs: number;
  /** RMS (0..1) above which idle->speaking. */
  startThreshold: number;
  /** RMS below which a speaking frame counts as silence (hysteresis: < startThreshold). */
  endThreshold: number;
  /** Continuous silence required to end the turn. */
  silenceMs: number;
};

export type VadEndpointer = {
  /** Feed one normalized RMS frame; returns an event if a transition occurred. */
  push(level: number): VadEvent | null;
  /** Adjust the end-of-turn silence gap live (voice-command threshold tuning). */
  setSilenceMs(ms: number): void;
  /** Adjust the start/end energy gates live (adaptive noise-gate tuning). */
  setThresholds(startThreshold: number, endThreshold: number): void;
  reset(): void;
  isSpeaking(): boolean;
};

/**
 * Energy-based VAD endpointer with hysteresis. Idle until a frame exceeds
 * startThreshold (speech-start); while speaking, a frame below endThreshold
 * counts toward silence, and once accumulated silence reaches silenceMs it
 * emits speech-end and returns to idle. A voiced frame resets the silence run.
 */
export const createVadEndpointer = (config: VadConfig): VadEndpointer => {
  let speaking = false;
  let silenceAccumMs = 0;
  let silenceMs = config.silenceMs;
  let startThreshold = config.startThreshold;
  let endThreshold = config.endThreshold;

  return {
    push(level) {
      if (!speaking) {
        if (level >= startThreshold) {
          speaking = true;
          silenceAccumMs = 0;
          return 'speech-start';
        }
        return null;
      }
      // speaking
      if (level < endThreshold) {
        silenceAccumMs += config.frameMs;
        if (silenceAccumMs >= silenceMs) {
          speaking = false;
          silenceAccumMs = 0;
          return 'speech-end';
        }
      } else {
        silenceAccumMs = 0; // voiced (or between thresholds) -> reset silence run
      }
      return null;
    },
    setSilenceMs(ms) {
      silenceMs = ms;
    },
    setThresholds(start, end) {
      startThreshold = start;
      endThreshold = end;
    },
    reset() {
      speaking = false;
      silenceAccumMs = 0;
    },
    isSpeaking() {
      return speaking;
    },
  };
};
