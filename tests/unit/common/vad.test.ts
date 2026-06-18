/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { createVadEndpointer } from '@/common/voice/vad';

const feed = (ep: ReturnType<typeof createVadEndpointer>, levels: number[]) => {
  const events: string[] = [];
  for (const lvl of levels) {
    const e = ep.push(lvl);
    if (e) events.push(e);
  }
  return events;
};

describe('createVadEndpointer', () => {
  it('emits speech-start when level crosses the threshold', () => {
    const ep = createVadEndpointer({ frameMs: 50, startThreshold: 0.2, endThreshold: 0.12, silenceMs: 200 });
    expect(feed(ep, [0.01, 0.02, 0.3])).toEqual(['speech-start']);
  });

  it('emits speech-end only after the silence gap elapses below endThreshold', () => {
    const ep = createVadEndpointer({ frameMs: 50, startThreshold: 0.2, endThreshold: 0.12, silenceMs: 200 });
    // start, then 4 quiet frames (4*50=200ms) -> end on the 4th
    const events = feed(ep, [0.3, 0.3, 0.05, 0.05, 0.05, 0.05]);
    expect(events).toEqual(['speech-start', 'speech-end']);
  });

  it('does not end if a brief dip is shorter than silenceMs', () => {
    const ep = createVadEndpointer({ frameMs: 50, startThreshold: 0.2, endThreshold: 0.12, silenceMs: 200 });
    // start, 2 quiet (100ms < 200ms), then loud again -> no end
    expect(feed(ep, [0.3, 0.05, 0.05, 0.3, 0.3])).toEqual(['speech-start']);
  });

  it('uses hysteresis: a level between end and start thresholds while speaking is still speech', () => {
    const ep = createVadEndpointer({ frameMs: 50, startThreshold: 0.2, endThreshold: 0.12, silenceMs: 100 });
    // start at 0.3, then 0.15 (between 0.12 and 0.2) counts as voiced -> no end
    expect(feed(ep, [0.3, 0.15, 0.15, 0.15])).toEqual(['speech-start']);
  });

  it('setSilenceMs adjusts the end gap live', () => {
    const ep = createVadEndpointer({ frameMs: 50, startThreshold: 0.2, endThreshold: 0.12, silenceMs: 100 });
    feed(ep, [0.3]); // speaking
    ep.setSilenceMs(200);
    // 3 quiet frames = 150ms < 200ms -> no end yet
    expect(feed(ep, [0.05, 0.05, 0.05])).toEqual([]);
    // one more (200ms) -> end
    expect(feed(ep, [0.05])).toEqual(['speech-end']);
  });

  it('setThresholds raises the start gate live so a previously-triggering level no longer starts speech', () => {
    const ep = createVadEndpointer({ frameMs: 50, startThreshold: 0.2, endThreshold: 0.12, silenceMs: 100 });
    ep.setThresholds(0.4, 0.3);
    // 0.3 is below the new 0.4 start gate -> no speech-start
    expect(feed(ep, [0.3, 0.3])).toEqual([]);
    expect(ep.isSpeaking()).toBe(false);
    // 0.45 exceeds the new start gate -> speech-start
    expect(feed(ep, [0.45])).toEqual(['speech-start']);
    expect(ep.isSpeaking()).toBe(true);
  });

  it('setThresholds raising endThreshold makes a previously-voiced level count as silence', () => {
    const ep = createVadEndpointer({ frameMs: 50, startThreshold: 0.2, endThreshold: 0.12, silenceMs: 100 });
    feed(ep, [0.3]); // speaking
    // With end at 0.3, a 0.15 frame is now below end -> silence accrues and ends the turn
    ep.setThresholds(0.4, 0.3);
    // 2 frames at 0.15 = 100ms >= silenceMs -> speech-end
    expect(feed(ep, [0.15, 0.15])).toEqual(['speech-end']);
    expect(ep.isSpeaking()).toBe(false);
  });

  it('reset returns to idle', () => {
    const ep = createVadEndpointer({ frameMs: 50, startThreshold: 0.2, endThreshold: 0.12, silenceMs: 100 });
    feed(ep, [0.3]);
    ep.reset();
    expect(feed(ep, [0.05, 0.05])).toEqual([]);
  });
});
