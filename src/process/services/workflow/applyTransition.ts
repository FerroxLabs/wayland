/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure monotonic source-tagged step transition resolver.
 *
 * See SPEC §11.1 (`.planning/brainstorm/2026-05-25-workflow-launch-surface/SPEC.md`).
 *
 * Three sources may race for the same step:
 *   - `parent` - markers emitted in the parent agent's streaming response
 *   - `worker` - markers emitted by an autonomous-run worker
 *   - `user`   - direct UI jumps (rail click, "Run autonomously" etc.)
 *
 * This function is pure: no DB, no IPC, no logging. Callers are responsible for
 * persisting the new status (on accept) and emitting the telemetry event (on reject).
 */

import type {
  StepStatus,
  StepTransition,
  StepTransitionSource,
} from '@/common/types/workflowTypes';

export type TransitionResult =
  | { accepted: true; newStatus: StepStatus; logged: false }
  | {
      accepted: false;
      reason: 'regress' | 'dedup' | 'precedence_loss';
      logged: true;
      telemetryEvent: string;
    };

const VALID_SOURCES: ReadonlySet<StepTransitionSource> = new Set<StepTransitionSource>([
  'parent',
  'worker',
  'user',
]);

// Higher number = higher precedence. user > worker > parent per SPEC §11.1.
const SOURCE_RANK: Record<StepTransitionSource, number> = {
  parent: 0,
  worker: 1,
  user: 2,
};

// Two transitions count as simultaneous when their timestamps are within this
// window (inclusive). 1000ms per SPEC §11.1.
const RACE_WINDOW_MS = 1000;

function assertValidSource(source: StepTransitionSource): void {
  if (!VALID_SOURCES.has(source)) {
    throw new Error(`applyTransition: invalid transition source: ${String(source)}`);
  }
}

export function applyTransition(
  currentStatus: StepStatus,
  incoming: StepTransition,
  competingTransitions: StepTransition[] = [],
): TransitionResult {
  assertValidSource(incoming.source);
  for (const competitor of competingTransitions) {
    assertValidSource(competitor.source);
  }

  // 1. Same-timestamp race resolution (window: +/- RACE_WINDOW_MS).
  //    If any competitor outranks `incoming` AND is within the window, incoming loses.
  const incomingRank = SOURCE_RANK[incoming.source];
  for (const competitor of competingTransitions) {
    const dt = Math.abs(competitor.timestamp - incoming.timestamp);
    if (dt > RACE_WINDOW_MS) continue;
    if (SOURCE_RANK[competitor.source] > incomingRank) {
      return {
        accepted: false,
        reason: 'precedence_loss',
        logged: true,
        telemetryEvent: 'workflow.step_transition',
      };
    }
  }

  // 2. Monotonic rule matrix.

  // `skipped` is always allowed regardless of current state.
  if (incoming.status === 'skipped') {
    return { accepted: true, newStatus: 'skipped', logged: false };
  }

  switch (currentStatus) {
    case 'todo':
      // todo → now | done | errored - all forward, accept.
      return { accepted: true, newStatus: incoming.status, logged: false };

    case 'now':
      if (incoming.status === 'done' || incoming.status === 'errored') {
        return { accepted: true, newStatus: incoming.status, logged: false };
      }
      if (incoming.status === 'now') {
        // Per SPEC §11.1: "now → now (different source) accept; second source displaces first."
        // We treat any competitor with the same source and the same `now` status as evidence
        // that this transition has already been recorded - dedup it. Otherwise accept as
        // a displacement (or as an idempotent no-op when no competitor exists).
        const sameSourceNowCompetitor = competingTransitions.find(
          (c) => c.source === incoming.source && c.status === 'now',
        );
        if (sameSourceNowCompetitor !== undefined) {
          return {
            accepted: false,
            reason: 'dedup',
            logged: true,
            telemetryEvent: 'workflow.regress_attempt',
          };
        }
        return { accepted: true, newStatus: 'now', logged: false };
      }
      // now → todo is a regress (shouldn't happen, but guard).
      return {
        accepted: false,
        reason: 'regress',
        logged: true,
        telemetryEvent: 'workflow.regress_attempt',
      };

    case 'done':
      if (incoming.status === 'errored') {
        // Re-classification on retry.
        return { accepted: true, newStatus: 'errored', logged: false };
      }
      if (incoming.status === 'done') {
        return {
          accepted: false,
          reason: 'dedup',
          logged: true,
          telemetryEvent: 'workflow.regress_attempt',
        };
      }
      // done → now or done → todo - regress, reject.
      return {
        accepted: false,
        reason: 'regress',
        logged: true,
        telemetryEvent: 'workflow.regress_attempt',
      };

    case 'errored':
      // errored → now | done | errored - all forward, accept.
      // (skipped already handled above.)
      return { accepted: true, newStatus: incoming.status, logged: false };

    case 'skipped':
      // Once skipped, stay skipped (incoming.status === 'skipped' already handled).
      // Any other incoming on a skipped step is a regress.
      return {
        accepted: false,
        reason: 'regress',
        logged: true,
        telemetryEvent: 'workflow.regress_attempt',
      };

    default: {
      // Exhaustiveness guard.
      const _exhaustive: never = currentStatus;
      throw new Error(`applyTransition: unhandled current status ${String(_exhaustive)}`);
    }
  }
}

