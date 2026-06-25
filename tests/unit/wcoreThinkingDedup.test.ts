/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { dedupeThinkingDelta } from '@process/task/WCoreManager';

// Simulate emitThinkingMessage's accumulation: feed each streamed chunk through
// dedupeThinkingDelta and append the returned delta, the way WCoreManager does.
function accumulate(chunks: string[]): string {
  let acc = '';
  for (const c of chunks) acc += dedupeThinkingDelta(acc, c);
  return acc;
}

describe('dedupeThinkingDelta (wcore cumulative-restate reasoning)', () => {
  it('collapses cumulative restates instead of doubling them (live: "LetLet me…")', () => {
    // The wcore engine streamed these three cumulative restates for one thought.
    const chunks = ['Let', 'Let me ask a few more critical', 'Let me ask a few more critical questions.'];
    expect(accumulate(chunks)).toBe('Let me ask a few more critical questions.');
  });

  it('handles a non-monotonic shorter restate (live: trailing "…AIThe user wants…w")', () => {
    const full = 'The user wants to brainstorm a giveaway web app that serves as a searchable library of AI';
    const shorterRestate = 'The user wants to brainstorm a giveaway w'; // a prefix of `full`
    // Order seen live: short → full → shorter-again. None should double.
    expect(accumulate(['The user', full, shorterRestate])).toBe(full);
  });

  it('returns the net-new tail for a pure cumulative extension', () => {
    expect(dedupeThinkingDelta('The user', 'The user wants to brainstorm')).toBe(' wants to brainstorm');
  });

  it('drops a chunk already fully contained in the accumulated text', () => {
    expect(dedupeThinkingDelta('The user wants to brainstorm', 'user wants')).toBe('');
  });

  it('does NOT fuzzy-dedup a coincidental mid-string overlap (avoids eating a boundary char)', () => {
    // Prefix/containment only. A non-prefix, non-contained chunk is appended whole
    // so "give me " + "3" never becomes "give me3".
    expect(dedupeThinkingDelta('abcdef', 'defghi')).toBe('defghi');
    expect(dedupeThinkingDelta('give me ', '3 punchy names')).toBe('3 punchy names');
  });

  it('passes through a genuine incremental delta unchanged', () => {
    expect(dedupeThinkingDelta('Hello ', 'world')).toBe('world');
    expect(accumulate(['Hello ', 'world'])).toBe('Hello world');
  });

  it('ignores empty chunks', () => {
    expect(dedupeThinkingDelta('anything', '')).toBe('');
  });

  it('does not double when the very first chunk is the full thought', () => {
    expect(accumulate(['The whole thought at once.'])).toBe('The whole thought at once.');
  });

  it('does not double on a DIVERGENT cumulative restate (live: "…what make money" then a restate)', () => {
    // The engine streamed the thought incrementally, then re-emitted the whole
    // thought once — but the restate diverged ("what make money" -> "what to make
    // money"), which an exact-prefix check missed and doubled.
    const chunks = [
      'The user wants a giveaway app.',
      ' The core problem: what make money',
      // full restate from the start, diverged + longer:
      'The user wants a giveaway app. The core problem: what to make money with AI now',
    ];
    const out = accumulate(chunks);
    // The thought's opening must appear exactly once — no doubling.
    expect(out.split('The user wants a giveaway app').length - 1).toBe(1);
  });

  it('treats a short incremental continuation as a delta, not a restate', () => {
    // Low common prefix with prev -> appended whole (not misread as a restate).
    expect(dedupeThinkingDelta('The user wants to build', ' a giveaway app')).toBe(' a giveaway app');
  });
});
