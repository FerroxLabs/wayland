/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Per-row time-marker decisions for project chat transcripts (#59). Kept pure
 * (no React, no locale formatting) so the day/gap logic is unit-tested in
 * isolation; the component layers Intl date/time + i18n gap labels on top.
 */
export type ChatTimeMarker = { ts: number; dayChange: boolean; gapMs: number };

/** Minimum same-day gap before a row earns a "time + elapsed" marker. */
const DEFAULT_GAP_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

const isSameLocalDay = (a: number, b: number): boolean => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

/**
 * Walk a chronological list of message timestamps and decide which rows get a
 * marker. A row earns one when the calendar day changes (rendered as date +
 * time) or when a meaningful gap has elapsed since the previous dated row
 * (rendered as time + `+gap`). Every other row returns `null` so the transcript
 * stays quiet.
 *
 * @param timestamps row timestamps in render order; `undefined` for rows that
 *   carry no timestamp (e.g. grouped summary rows) - those never get a marker
 *   and do not reset the running clock.
 */
export const computeChatTimeMarkers = (
  timestamps: ReadonlyArray<number | undefined>,
  opts?: { gapThresholdMs?: number }
): Array<ChatTimeMarker | null> => {
  const threshold = opts?.gapThresholdMs ?? DEFAULT_GAP_THRESHOLD_MS;
  const out: Array<ChatTimeMarker | null> = [];
  let prev: number | undefined;
  for (const ts of timestamps) {
    if (ts == null) {
      out.push(null);
      continue;
    }
    if (prev == null || !isSameLocalDay(prev, ts)) {
      out.push({ ts, dayChange: true, gapMs: 0 });
    } else {
      const gapMs = ts - prev;
      out.push(gapMs >= threshold ? { ts, dayChange: false, gapMs } : null);
    }
    prev = ts;
  }
  return out;
};

/** Split an elapsed gap into whole hours + minutes for compact display ("+1h 8m"). */
export const splitGap = (gapMs: number): { hours: number; minutes: number } => {
  const totalMinutes = Math.floor(gapMs / 60000);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
};
