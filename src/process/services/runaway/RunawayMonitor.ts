/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Runaway-session loop detector (circuit-breaker Phase 2). Watches a single
 * conversation's tool results and trips when the session is clearly looping and
 * burning tokens for no progress:
 *
 *  - repeated_read: the SAME content comes back from a read-class tool N times
 *    in a turn. A defeated read-dedup re-injects identical file content on every
 *    re-read (the 8.5M-token field failure), so identical output repeated is the
 *    signal. Hashing the output means this works without tool arguments, which
 *    are not emitted in auto-approve mode (exactly when runaways happen).
 *  - failing_command: a shell-class tool fails N times in a row. A sandbox that
 *    blocks the network and returns empty output makes the model retry forever.
 *
 * State is per-conversation and per-turn (reset at turn start). It observes, it
 * does not act - the caller decides what to do on a trip (stop the turn, warn).
 */

export type RunawayKind = 'repeated_read' | 'failing_command';

export type RunawayTrip = {
  kind: RunawayKind;
  /** How many repeats/failures tripped it (for the user-facing message). */
  count: number;
};

/** Renderer-facing payload when the circuit-breaker stops a runaway turn. */
export type RunawayHalted = {
  conversationId: string;
  kind: RunawayKind;
  count: number;
};

export type ToolObservation = {
  /** Tool display name, e.g. "Read", "Bash". */
  name: string;
  /** Whether the tool result succeeded. */
  success: boolean;
  /** The result output text (used to detect identical re-reads). */
  outputText: string;
};

const READ_RE = /\bread\b|view_file|cat_file/i;
const SHELL_RE = /\b(bash|shell|exec|run_command|terminal)\b/i;

/** Fast non-crypto hash (djb2) of a string; collisions are harmless here. */
function hashOutput(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (h * 33) ^ text.charCodeAt(i);
  }
  // Include length so different-length outputs never collide on the rolling hash.
  return `${h >>> 0}:${text.length}`;
}

export class RunawayMonitor {
  private repeatedReadThreshold: number;
  private failingCommandThreshold: number;
  private readHashCounts = new Map<string, number>();
  private consecutiveCmdFailures = 0;
  /** Prevents the same kind re-tripping repeatedly within one turn. */
  private trippedKinds = new Set<RunawayKind>();

  constructor(opts?: { repeatedReadThreshold?: number; failingCommandThreshold?: number }) {
    this.repeatedReadThreshold = Math.max(2, opts?.repeatedReadThreshold ?? 5);
    this.failingCommandThreshold = Math.max(2, opts?.failingCommandThreshold ?? 4);
  }

  /** Clear per-turn counters. Call at the start of each user turn. */
  resetTurn(): void {
    this.readHashCounts.clear();
    this.consecutiveCmdFailures = 0;
    this.trippedKinds.clear();
  }

  /**
   * Feed one tool result. Returns a trip the first time a threshold is crossed
   * for a given kind in the current turn, otherwise null.
   */
  observe(obs: ToolObservation): RunawayTrip | null {
    const name = obs.name ?? '';

    if (SHELL_RE.test(name)) {
      if (!obs.success) {
        this.consecutiveCmdFailures += 1;
        if (this.consecutiveCmdFailures >= this.failingCommandThreshold && !this.trippedKinds.has('failing_command')) {
          this.trippedKinds.add('failing_command');
          return { kind: 'failing_command', count: this.consecutiveCmdFailures };
        }
      } else {
        this.consecutiveCmdFailures = 0;
      }
      return null;
    }

    if (READ_RE.test(name) && obs.success && obs.outputText) {
      const key = hashOutput(obs.outputText);
      const next = (this.readHashCounts.get(key) ?? 0) + 1;
      this.readHashCounts.set(key, next);
      if (next >= this.repeatedReadThreshold && !this.trippedKinds.has('repeated_read')) {
        this.trippedKinds.add('repeated_read');
        return { kind: 'repeated_read', count: next };
      }
    }

    return null;
  }
}
