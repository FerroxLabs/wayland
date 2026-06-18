/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { createNoiseFloorTracker } from '@/common/voice/noiseFloor';

describe('createNoiseFloorTracker', () => {
  it('a fresh tracker reports thresholds near initialFloor + baseMargin', () => {
    const t = createNoiseFloorTracker({ initialFloor: 0.02, baseMargin: 0.08 });
    expect(t.floor()).toBeCloseTo(0.02, 10);
    const { startThreshold, endThreshold } = t.thresholds();
    // 0.02 + 0.08 = 0.10
    expect(startThreshold).toBeCloseTo(0.1, 10);
    expect(endThreshold).toBeCloseTo(0.1 * 0.6, 10);
  });

  it('sustained higher ambient raises the floor and thus the start gate', () => {
    const t = createNoiseFloorTracker({ initialFloor: 0.02, baseMargin: 0.08, alpha: 0.05 });
    const quietStart = t.thresholds().startThreshold;
    for (let i = 0; i < 200; i++) t.observe(0.2);
    expect(t.floor()).toBeGreaterThan(0.02);
    expect(t.thresholds().startThreshold).toBeGreaterThan(quietStart);
  });

  it('positive marginBias increases start (less sensitive); negative decreases it', () => {
    const t = createNoiseFloorTracker({ initialFloor: 0.02, baseMargin: 0.08 });
    const base = t.thresholds(0).startThreshold;
    expect(t.thresholds(0.05).startThreshold).toBeGreaterThan(base);
    expect(t.thresholds(-0.01).startThreshold).toBeLessThan(base);
  });

  it('start is clamped to bounds.max', () => {
    const t = createNoiseFloorTracker({ initialFloor: 0.02, baseMargin: 0.08, bounds: { min: 0.08, max: 0.6 } });
    // huge bias pushes well past max
    const { startThreshold, endThreshold } = t.thresholds(5);
    expect(startThreshold).toBe(0.6);
    expect(endThreshold).toBeCloseTo(0.6 * 0.6, 10);
  });

  it('start is clamped to bounds.min', () => {
    const t = createNoiseFloorTracker({ initialFloor: 0, baseMargin: 0, bounds: { min: 0.08, max: 0.6 } });
    expect(t.thresholds().startThreshold).toBe(0.08);
  });

  it('end is start * endRatio', () => {
    const t = createNoiseFloorTracker({ initialFloor: 0.05, baseMargin: 0.1, endRatio: 0.5 });
    const { startThreshold, endThreshold } = t.thresholds();
    expect(endThreshold).toBeCloseTo(startThreshold * 0.5, 10);
  });

  it('reset restores the quiet baseline', () => {
    const t = createNoiseFloorTracker({ initialFloor: 0.02, baseMargin: 0.08 });
    const quietStart = t.thresholds().startThreshold;
    for (let i = 0; i < 200; i++) t.observe(0.3);
    expect(t.thresholds().startThreshold).toBeGreaterThan(quietStart);
    t.reset();
    expect(t.floor()).toBeCloseTo(0.02, 10);
    expect(t.thresholds().startThreshold).toBeCloseTo(quietStart, 10);
  });
});
