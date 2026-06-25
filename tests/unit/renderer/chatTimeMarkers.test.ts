/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  computeChatTimeMarkers,
  splitGap,
} from '../../../src/renderer/pages/conversation/Messages/utils/chatTimeMarkers';

const T = (iso: string) => new Date(iso).getTime();

describe('computeChatTimeMarkers (#59)', () => {
  it('marks the first dated row as a day change', () => {
    const m = computeChatTimeMarkers([T('2026-06-21T09:00:00')]);
    expect(m[0]).toEqual({ ts: T('2026-06-21T09:00:00'), dayChange: true, gapMs: 0 });
  });

  it('marks a new calendar day with a day-change marker', () => {
    const m = computeChatTimeMarkers([T('2026-06-21T23:50:00'), T('2026-06-22T00:05:00')]);
    expect(m[1]?.dayChange).toBe(true);
  });

  it('stays quiet for small same-day gaps', () => {
    const m = computeChatTimeMarkers([T('2026-06-21T09:00:00'), T('2026-06-21T09:03:00')]);
    expect(m[1]).toBeNull();
  });

  it('emits a gap marker for a meaningful same-day gap', () => {
    const m = computeChatTimeMarkers([T('2026-06-21T09:00:00'), T('2026-06-21T09:40:00')]);
    expect(m[1]).toEqual({ ts: T('2026-06-21T09:40:00'), dayChange: false, gapMs: 40 * 60000 });
  });

  it('skips undefined (summary) rows without resetting the running clock', () => {
    const m = computeChatTimeMarkers([T('2026-06-21T09:00:00'), undefined, T('2026-06-21T09:05:00')]);
    expect(m[1]).toBeNull(); // the summary row
    expect(m[2]).toBeNull(); // 5min after 09:00 (clock not advanced by the summary) -> below threshold
  });

  it('respects a custom gap threshold', () => {
    const m = computeChatTimeMarkers([T('2026-06-21T09:00:00'), T('2026-06-21T09:02:00')], {
      gapThresholdMs: 60_000,
    });
    expect(m[1]?.gapMs).toBe(2 * 60000);
  });
});

describe('splitGap', () => {
  it('splits minutes only', () => expect(splitGap(12 * 60000)).toEqual({ hours: 0, minutes: 12 }));
  it('splits hours + minutes', () => expect(splitGap(68 * 60000)).toEqual({ hours: 1, minutes: 8 }));
  it('splits whole hours', () => expect(splitGap(120 * 60000)).toEqual({ hours: 2, minutes: 0 }));
});
