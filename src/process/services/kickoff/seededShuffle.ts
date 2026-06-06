/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { KickoffTimeBucket } from './types';

/**
 * Deterministic seeded shuffle for the kickoff cold-start cascade. Same
 * seed → same order, so a fresh launch on the same calendar day surfaces
 * the same primary suggestion (intentional curation feel). Different
 * install-UUIDs produce different orderings (verified by tests in
 * SuggestionEngine.test.ts).
 *
 * Uses a 32-bit FNV-1a hash to derive a uint32 seed from the input string,
 * then mulberry32 as the PRNG. Both are public-domain primitives; chosen
 * for: zero external dependency, deterministic across platforms,
 * negligible cost relative to the IPC round-trip that produced the call.
 */

export function hashSeed(input: string): number {
  // FNV-1a 32-bit hash.
  // Math.imul required: 32-bit-wrapped multiply. Replacing with `a * b` or
  // `(a * b) | 0` changes the hash distribution and would silently re-shuffle
  // every existing user on the next launch.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    // Math.imul required - see hashSeed comment.
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    // Destructuring swap - bounds are guaranteed by the loop but this avoids
    // a `noUncheckedIndexedAccess` upgrade tripping over the cast form.
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Compute the calendar-date bucket for a millisecond timestamp in the
 * caller's local timezone (or in the supplied offset for test repro).
 *
 * DST note: on transition days, the hour around the change may shift the
 * date bucket by one if the timestamp straddles the jump - intentional and
 * acceptable for v1 (the seed just rotates a few hours earlier/later twice
 * a year). If precise calendar alignment matters in v2, switch to
 * `Intl.DateTimeFormat` with explicit timezone resolution.
 */
export function dateKey(now: number, tzOffsetMinutes?: number): string {
  const offset = tzOffsetMinutes ?? -new Date(now).getTimezoneOffset();
  const local = new Date(now + offset * 60_000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * v0.4.7.1 (A-M-3) - added `'late-night'` bucket for hours 0-5. Without it,
 * a user opening the app at 1 AM got a "morning" cold-start card written for
 * a morning audience ("Want me to surface the decision you've been
 * carrying?"). Late-night entries can now be authored with
 * `timeBucket: 'late-night'`; if the library lacks any, Level 3 falls
 * through to no-bucket cold-starts and eventually Level 4 beginner-touch.
 */
export function timeBucketFor(now: number): KickoffTimeBucket {
  const hour = new Date(now).getHours();
  if (hour < 6) return 'late-night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
