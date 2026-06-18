/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type NoiseFloorTracker = {
  /** Feed an RMS frame BELIEVED to be non-speech (caller gates this on !isSpeaking). */
  observe(rms: number): void;
  floor(): number;
  /** Recommended gates given a sensitivity margin bias (larger bias = less sensitive). */
  thresholds(marginBias?: number): { startThreshold: number; endThreshold: number };
  reset(): void;
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/**
 * Tracks the ambient noise floor as an EMA over RMS frames believed to be
 * non-speech, and derives adaptive start/end gates from it. A higher ambient
 * floor raises the gates so quiet rooms stay sensitive while noisy rooms do not
 * false-trigger.
 */
export const createNoiseFloorTracker = (opts?: {
  initialFloor?: number;
  alpha?: number;
  baseMargin?: number;
  endRatio?: number;
  bounds?: { min: number; max: number };
}): NoiseFloorTracker => {
  const initialFloor = opts?.initialFloor ?? 0.02;
  const alpha = opts?.alpha ?? 0.05;
  const baseMargin = opts?.baseMargin ?? 0.08;
  const endRatio = opts?.endRatio ?? 0.6;
  const bounds = opts?.bounds ?? { min: 0.08, max: 0.6 };

  let floorEma = initialFloor;

  return {
    observe(rms) {
      floorEma = floorEma * (1 - alpha) + rms * alpha;
    },
    floor() {
      return floorEma;
    },
    thresholds(marginBias = 0) {
      const start = clamp(floorEma + baseMargin + marginBias, bounds.min, bounds.max);
      return { startThreshold: start, endThreshold: start * endRatio };
    },
    reset() {
      floorEma = initialFloor;
    },
  };
};
