/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { applyTransition } from '@process/services/workflow/applyTransition';
import type {
  StepStatus,
  StepTransition,
  StepTransitionSource,
} from '@/common/types/workflowTypes';

// Helper to build a transition with sensible defaults.
function makeTx(
  status: StepStatus,
  source: StepTransitionSource = 'parent',
  timestamp = 1_000,
  dispatch_id: string | null = null,
): StepTransition {
  return {
    step_n: 1,
    status,
    source,
    dispatch_id,
    timestamp,
  };
}

describe('applyTransition - monotonic rule matrix (SPEC §11.1)', () => {
  // Matrix row: todo → now
  it('accepts todo → now', () => {
    const result = applyTransition('todo', makeTx('now', 'parent'));
    expect(result).toEqual({ accepted: true, newStatus: 'now', logged: false });
  });

  // Matrix row: todo → done (skip-ahead)
  it('accepts todo → done (skip-ahead)', () => {
    const result = applyTransition('todo', makeTx('done', 'parent'));
    expect(result).toEqual({ accepted: true, newStatus: 'done', logged: false });
  });

  // Matrix row: now → done
  it('accepts now → done', () => {
    const result = applyTransition('now', makeTx('done', 'parent'));
    expect(result).toEqual({ accepted: true, newStatus: 'done', logged: false });
  });

  // Matrix row: now → now (different source) displaces
  it('accepts now → now when source differs (second source displaces first)', () => {
    const result = applyTransition('now', makeTx('now', 'user'));
    expect(result).toEqual({ accepted: true, newStatus: 'now', logged: false });
  });

  // Matrix row: done → now REJECTED (regress)
  it('rejects done → now with telemetry workflow.regress_attempt (reason regress)', () => {
    const result = applyTransition('done', makeTx('now', 'parent'));
    expect(result).toEqual({
      accepted: false,
      reason: 'regress',
      logged: true,
      telemetryEvent: 'workflow.regress_attempt',
    });
  });

  // Matrix row: done → done DEDUP
  it('dedups done → done with telemetry workflow.regress_attempt (reason dedup)', () => {
    const result = applyTransition('done', makeTx('done', 'parent'));
    expect(result).toEqual({
      accepted: false,
      reason: 'dedup',
      logged: true,
      telemetryEvent: 'workflow.regress_attempt',
    });
  });

  // Matrix row: done → errored (re-classification)
  it('accepts done → errored (re-classification on retry)', () => {
    const result = applyTransition('done', makeTx('errored', 'worker'));
    expect(result).toEqual({ accepted: true, newStatus: 'errored', logged: false });
  });

  // Matrix row: errored → now (retry)
  it('accepts errored → now (retry)', () => {
    const result = applyTransition('errored', makeTx('now', 'user'));
    expect(result).toEqual({ accepted: true, newStatus: 'now', logged: false });
  });

  // Matrix row: errored → done
  it('accepts errored → done', () => {
    const result = applyTransition('errored', makeTx('done', 'worker'));
    expect(result).toEqual({ accepted: true, newStatus: 'done', logged: false });
  });

  // Matrix row: errored → skipped
  it('accepts errored → skipped', () => {
    const result = applyTransition('errored', makeTx('skipped', 'user'));
    expect(result).toEqual({ accepted: true, newStatus: 'skipped', logged: false });
  });

  // Matrix row: * → skipped is always allowed
  it('accepts any → skipped (skipping is always allowed) - from todo', () => {
    expect(applyTransition('todo', makeTx('skipped', 'user'))).toEqual({
      accepted: true,
      newStatus: 'skipped',
      logged: false,
    });
  });

  it('accepts any → skipped (skipping is always allowed) - from now', () => {
    expect(applyTransition('now', makeTx('skipped', 'user'))).toEqual({
      accepted: true,
      newStatus: 'skipped',
      logged: false,
    });
  });

  it('accepts any → skipped (skipping is always allowed) - from done', () => {
    expect(applyTransition('done', makeTx('skipped', 'user'))).toEqual({
      accepted: true,
      newStatus: 'skipped',
      logged: false,
    });
  });
});

describe('applyTransition - same-timestamp race resolution', () => {
  // Within +/- 1000ms counts as simultaneous; precedence user > worker > parent.

  it('user vs worker at same timestamp - user wins; worker call rejects with precedence_loss', () => {
    // Worker is the incoming; user is the competitor; user > worker, so worker loses.
    const incoming = makeTx('now', 'worker', 1_000);
    const competing = [makeTx('now', 'user', 1_000)];
    const result = applyTransition('todo', incoming, competing);
    expect(result).toEqual({
      accepted: false,
      reason: 'precedence_loss',
      logged: true,
      telemetryEvent: 'workflow.step_transition',
    });
  });

  it('user vs worker at same timestamp - user call wins (no precedence loss)', () => {
    const incoming = makeTx('now', 'user', 1_000);
    const competing = [makeTx('now', 'worker', 1_000)];
    const result = applyTransition('todo', incoming, competing);
    expect(result).toEqual({ accepted: true, newStatus: 'now', logged: false });
  });

  it('worker vs parent at same timestamp - worker wins; parent call rejects', () => {
    const incoming = makeTx('now', 'parent', 1_000);
    const competing = [makeTx('now', 'worker', 1_000)];
    const result = applyTransition('todo', incoming, competing);
    expect(result).toEqual({
      accepted: false,
      reason: 'precedence_loss',
      logged: true,
      telemetryEvent: 'workflow.step_transition',
    });
  });

  it('worker vs parent at same timestamp - worker call wins', () => {
    const incoming = makeTx('now', 'worker', 1_000);
    const competing = [makeTx('now', 'parent', 1_000)];
    const result = applyTransition('todo', incoming, competing);
    expect(result).toEqual({ accepted: true, newStatus: 'now', logged: false });
  });

  it('parent vs parent at same timestamp - tie: earlier timestamp wins; later call dedups via matrix', () => {
    // Two parent emissions at the same epoch. Both have equal precedence, so the rule matrix governs.
    // First one applies normally; the second arrives when status is already 'now' from the first.
    // Caller invokes applyTransition twice; we model the SECOND invocation here.
    const first = makeTx('now', 'parent', 1_000);
    const second = makeTx('now', 'parent', 1_000);
    // First call: applied (no competitors that outrank parent).
    const firstResult = applyTransition('todo', first, [second]);
    expect(firstResult).toEqual({ accepted: true, newStatus: 'now', logged: false });
    // Second call: arrives with status already 'now', same source - matrix rule "now → now (same source)"
    // is not in the accept matrix; treat as dedup of an identical state.
    const secondResult = applyTransition('now', second, [first]);
    expect(secondResult.accepted).toBe(false);
  });
});

describe('applyTransition - edge cases', () => {
  it('treats timestamps > 1000ms apart as NOT simultaneous; normal matrix applies', () => {
    // Worker at t=1000; competing user transition at t=2501 (1501ms later) - outside the race window.
    const incoming = makeTx('now', 'worker', 1_000);
    const competing = [makeTx('now', 'user', 2_501)];
    const result = applyTransition('todo', incoming, competing);
    // Worker is no longer racing user → normal rule (todo → now) applies, accepted.
    expect(result).toEqual({ accepted: true, newStatus: 'now', logged: false });
  });

  it('treats timestamps exactly 1000ms apart as simultaneous (boundary inclusive)', () => {
    const incoming = makeTx('now', 'worker', 1_000);
    const competing = [makeTx('now', 'user', 2_000)];
    const result = applyTransition('todo', incoming, competing);
    expect(result).toEqual({
      accepted: false,
      reason: 'precedence_loss',
      logged: true,
      telemetryEvent: 'workflow.step_transition',
    });
  });

  it('throws when incoming.source is not in {parent, worker, user}', () => {
    const bad = {
      step_n: 1,
      status: 'now' as StepStatus,
      source: 'cron' as unknown as StepTransitionSource,
      dispatch_id: null,
      timestamp: 1_000,
    };
    expect(() => applyTransition('todo', bad)).toThrow(/invalid transition source/i);
  });

  it('throws when a competing transition has an invalid source', () => {
    const incoming = makeTx('now', 'user', 1_000);
    const competing = [
      {
        step_n: 1,
        status: 'now' as StepStatus,
        source: 'ghost' as unknown as StepTransitionSource,
        dispatch_id: null,
        timestamp: 1_000,
      },
    ];
    expect(() => applyTransition('todo', incoming, competing)).toThrow(
      /invalid transition source/i,
    );
  });
});
