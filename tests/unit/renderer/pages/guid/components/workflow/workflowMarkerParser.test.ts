/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Three-phase workflow marker parser tests.
 *
 * Implements the SPEC §8.2 edge-case matrix (one test per row) plus the
 * §8.3 compliance counter behavior. The parser handles:
 *   - Phase 1: streaming regex strip with fence-state scanner
 *   - Phase 2: per-marker validation
 *   - Phase 3: final markdown-AST authoritative pass + false-strip recovery
 *
 * Spec source:
 *   .planning/brainstorm/2026-05-25-workflow-launch-surface/SPEC.md §7-§8
 */

import { describe, expect, it } from 'vitest';
import {
  computeCompliance,
  createParserState,
  finalize,
  processChunk,
  validateMarker,
} from '@/renderer/pages/guid/components/workflow/workflowMarkerParser';

const TOTAL_STEPS = 6;

const collect = (full: string, chunkSize = 8): ReturnType<typeof finalize> => {
  let state = createParserState();
  for (let i = 0; i < full.length; i += chunkSize) {
    const r = processChunk(state, full.slice(i, i + chunkSize), TOTAL_STEPS);
    state = r.state;
  }
  return finalize(state, TOTAL_STEPS, full);
};

describe('validateMarker', () => {
  it('accepts a well-formed self-closing step marker', () => {
    const r = validateMarker('<step n="3" status="done"/>', TOTAL_STEPS);
    expect(r).toEqual({ kind: 'step', n: 3, status: 'done' });
  });

  it('accepts step marker without quotes around n + status', () => {
    const r = validateMarker('<step n=2 status=now />', TOTAL_STEPS);
    expect(r).toEqual({ kind: 'step', n: 2, status: 'now' });
  });

  it('rejects out-of-range n with reason mentioning the range', () => {
    const r = validateMarker('<step n="99" status="now"/>', TOTAL_STEPS);
    expect(r).toMatchObject({ invalid: true });
    if ('reason' in r) expect(r.reason).toMatch(/out of range/i);
  });

  it('rejects step n=0 (below 1)', () => {
    const r = validateMarker('<step n="0" status="now"/>', TOTAL_STEPS);
    expect(r).toMatchObject({ invalid: true });
  });

  it('rejects malformed status', () => {
    const r = validateMarker('<step n="3" status="bar"/>', TOTAL_STEPS);
    expect(r).toMatchObject({ invalid: true });
  });

  it('rejects unrecognized shape', () => {
    const r = validateMarker('<step random/>', TOTAL_STEPS);
    expect(r).toMatchObject({ invalid: true });
  });

  it('parses a basic ask marker (text)', () => {
    const r = validateMarker(
      '<ask type="text" placeholder="hint">Question?</ask>',
      TOTAL_STEPS,
    );
    expect(r).toMatchObject({ kind: 'ask' });
    if ('kind' in r && r.kind === 'ask') {
      expect(r.ask.type).toBe('text');
      expect(r.ask.question).toBe('Question?');
      expect(r.ask.placeholder).toBe('hint');
    }
  });

  it('parses an ask marker with choice options', () => {
    const r = validateMarker(
      '<ask type="choice" options="A,B,C">Pick one.</ask>',
      TOTAL_STEPS,
    );
    expect(r).toMatchObject({ kind: 'ask' });
    if ('kind' in r && r.kind === 'ask') {
      expect(r.ask.type).toBe('choice');
      expect(r.ask.options).toEqual(['A', 'B', 'C']);
    }
  });

  it('parses an ask marker with rating max', () => {
    const r = validateMarker('<ask type="rating" max="5">Rate?</ask>', TOTAL_STEPS);
    expect(r).toMatchObject({ kind: 'ask' });
    if ('kind' in r && r.kind === 'ask') {
      expect(r.ask.type).toBe('rating');
      expect(r.ask.max).toBe(5);
    }
  });

  it('rejects ask marker with unknown type', () => {
    const r = validateMarker('<ask type="zorp">Q?</ask>', TOTAL_STEPS);
    expect(r).toMatchObject({ invalid: true });
  });
});

describe('processChunk + finalize - SPEC §8.2 matrix', () => {
  it('row 1: valid marker outside fence → stripped + recorded', () => {
    const r = collect('<step n="3" status="done"/>\nNext line.');
    expect(r.finalOutput).not.toMatch(/<step/);
    expect(r.state.emittedMarkers).toHaveLength(1);
    expect(r.state.emittedMarkers[0]).toEqual({ kind: 'step', n: 3, status: 'done' });
    expect(r.finalOutput).toMatch(/Next line\./);
  });

  it('row 2: marker inside ``` fence → NOT stripped, visible to user', () => {
    const input = 'Example:\n```\n<step n="3" status="done"/>\n```\nDone.';
    const r = collect(input);
    expect(r.finalOutput).toMatch(/<step n="3" status="done"\/>/);
    expect(r.state.emittedMarkers).toHaveLength(0);
  });

  it('row 2b: marker inside `inline` code → NOT stripped', () => {
    const input = 'Like `<step n="3" status="now"/>` for example.';
    const r = collect(input);
    expect(r.finalOutput).toMatch(/`<step n="3" status="now"\/>`/);
    expect(r.state.emittedMarkers).toHaveLength(0);
  });

  it('row 3: HTML-escaped marker → Phase 1 leaves it; Phase 3 AST decodes + strips', () => {
    const input = '&lt;step n="2" status="now"/&gt;\nbody';
    const r = collect(input);
    // Phase 3 should reconcile against decoded form and record it
    expect(r.state.emittedMarkers.some((m) => m.kind === 'step' && m.n === 2)).toBe(true);
    // Telemetry flag for html-escape detection
    expect(
      r.state.invalidMarkers.some((im) => /html.escaped/i.test(im.reason)) ||
        r.state.emittedMarkers.some((m) => m.kind === 'step' && m.n === 2),
    ).toBe(true);
    // The decoded marker should be stripped from the final output
    expect(r.finalOutput).not.toMatch(/&lt;step n="2"/);
    expect(r.finalOutput).not.toMatch(/<step n="2"/);
  });

  it('row 4: malformed marker → NOT stripped, recorded as invalid', () => {
    const input = '<step n=foo status=bar/>\nbody';
    const r = collect(input);
    expect(r.finalOutput).toMatch(/<step n=foo status=bar\/>/);
    expect(r.state.invalidMarkers.length).toBeGreaterThan(0);
  });

  it('row 5: out-of-range n (n=99, total=6) → NOT stripped, recorded as invalid', () => {
    const input = '<step n="99" status="now"/>\nbody';
    const r = collect(input);
    expect(r.finalOutput).toMatch(/<step n="99" status="now"\/>/);
    expect(r.state.invalidMarkers.length).toBeGreaterThan(0);
    expect(r.state.invalidMarkers[0].reason).toMatch(/out of range/i);
  });

  it('row 6: chunk-boundary partial tag held in pendingTagFragment until resolved', () => {
    let state = createParserState();
    // First chunk: half a tag
    let r = processChunk(state, '<step n="3" ', TOTAL_STEPS);
    state = r.state;
    expect(state.pendingTagFragment.length).toBeGreaterThan(0);
    expect(r.emittedMarkers).toHaveLength(0);
    // Second chunk: completes the tag
    r = processChunk(state, 'status="now"/>', TOTAL_STEPS);
    state = r.state;
    const fin = finalize(state, TOTAL_STEPS, '<step n="3" status="now"/>');
    expect(fin.state.emittedMarkers).toEqual([{ kind: 'step', n: 3, status: 'now' }]);
    expect(fin.finalOutput).not.toMatch(/<step/);
  });

  it('row 7: two markers in a row → each validated independently', () => {
    const input = '<step n="1" status="done"/><step n="2" status="now"/>\nbody';
    const r = collect(input);
    expect(r.state.emittedMarkers).toHaveLength(2);
    expect(r.state.emittedMarkers[0]).toEqual({ kind: 'step', n: 1, status: 'done' });
    expect(r.state.emittedMarkers[1]).toEqual({ kind: 'step', n: 2, status: 'now' });
    expect(r.finalOutput).not.toMatch(/<step/);
  });

  it('row 9: marker in a table cell → stripped + recorded', () => {
    const input = '| a | b |\n|---|---|\n| <step n="2" status="done"/> | x |\n';
    const r = collect(input);
    expect(r.state.emittedMarkers).toEqual([{ kind: 'step', n: 2, status: 'done' }]);
    expect(r.finalOutput).not.toMatch(/<step/);
  });

  it('streams character-by-character without losing markers', () => {
    const input = '<step n="4" status="done"/>\nhello\n<step n="5" status="now"/>';
    let state = createParserState();
    for (const ch of input) {
      const r = processChunk(state, ch, TOTAL_STEPS);
      state = r.state;
    }
    const fin = finalize(state, TOTAL_STEPS, input);
    expect(fin.state.emittedMarkers).toEqual([
      { kind: 'step', n: 4, status: 'done' },
      { kind: 'step', n: 5, status: 'now' },
    ]);
    expect(fin.finalOutput).not.toMatch(/<step/);
    expect(fin.finalOutput).toMatch(/hello/);
  });

  it('ask marker outside fence is parsed and stripped', () => {
    const input = '<ask type="number" placeholder="USD">What budget?</ask>\nrest';
    const r = collect(input);
    expect(r.state.emittedMarkers).toHaveLength(1);
    const m = r.state.emittedMarkers[0];
    expect(m.kind).toBe('ask');
    expect(r.finalOutput).not.toMatch(/<ask/);
  });

  it('ask marker inside fence is NOT stripped', () => {
    const input = '```\n<ask type="text">hi?</ask>\n```\n';
    const r = collect(input);
    expect(r.finalOutput).toMatch(/<ask type="text">hi\?<\/ask>/);
    expect(r.state.emittedMarkers).toHaveLength(0);
  });

  it('emits renderedDelta progressively (no markers leaked between chunks)', () => {
    let state = createParserState();
    const deltas: string[] = [];
    const chunks = ['<step n="1" status="now"/>', 'Hello ', 'world.'];
    for (const c of chunks) {
      const r = processChunk(state, c, TOTAL_STEPS);
      state = r.state;
      deltas.push(r.renderedDelta);
    }
    const fin = finalize(state, TOTAL_STEPS, chunks.join(''));
    expect(deltas.join('')).not.toMatch(/<step/);
    expect(fin.finalOutput).toMatch(/Hello world\./);
  });
});

describe('computeCompliance - SPEC §8.3', () => {
  it('returns auto mode when valid_markers/messages >= 30%', () => {
    const state = createParserState();
    state.emittedMarkers.push({ kind: 'step', n: 1, status: 'done' });
    state.emittedMarkers.push({ kind: 'step', n: 2, status: 'now' });
    const r = computeCompliance(state, 5);
    expect(r.mode).toBe('auto');
    expect(r.ratio).toBeCloseTo(0.4, 2);
  });

  it('returns manual mode when ratio < 30% after 3+ messages', () => {
    const state = createParserState();
    const r = computeCompliance(state, 4);
    expect(r.mode).toBe('manual');
    expect(r.ratio).toBe(0);
  });

  it('stays in auto mode with fewer than 3 messages even when ratio is low', () => {
    const state = createParserState();
    const r = computeCompliance(state, 2);
    expect(r.mode).toBe('auto');
  });
});
