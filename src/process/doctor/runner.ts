/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Doctor runner — executes a list of checks and aggregates a {@link DoctorReport}.
 *
 * Every check is wrapped so a thrown error (or a check that hangs forever)
 * cannot abort the whole battery: a throw becomes a `fail` result, and each
 * check is bounded by a per-check timeout. Checks run concurrently — they are
 * independent and mostly I/O-bound (network probes, fs stats), so a serial run
 * would needlessly multiply the wall-clock time.
 *
 * This is also the only funnel EVERY result passes through, so it is where the two
 * whole-surface guarantees live: nothing here can throw (see `safeErrorMessage`),
 * and no user-facing field leaves unbounded (see `bounded`).
 */

import { redactSecrets } from '@process/utils/secretRedaction';
import type { DoctorCheck, DoctorCheckResult, DoctorReport, DoctorStatus } from './types';

/** Per-check wall-clock budget. A check that exceeds this resolves to `fail`. */
const CHECK_TIMEOUT_MS = 30_000;

/** Rank used to compute the worst (overall) status across results. */
const STATUS_RANK: Record<DoctorStatus, number> = { pass: 0, warn: 1, fail: 2 };

/** Resolve `'pass' | 'warn' | 'fail'` for the worst of two statuses. */
function worse(a: DoctorStatus, b: DoctorStatus): DoctorStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

/**
 * Cap on any single user-facing field in a result.
 *
 * Every check's `detail` used to be unbounded, and one of them provably is: a
 * 2,000,000-character probe error came back as a 2,000,052-character detail
 * [executed], which the UI then renders and offers to copy. Bounding it HERE
 * rather than per check is the point - this is the one funnel every result passes
 * through, so no future check has to remember.
 *
 * 4,000 is chosen against the largest legitimate detail this surface produces: the
 * MCP check enumerates one line per failing server, and a twenty-server failure at
 * roughly 150 characters each is about 3,000. Nothing that fits inside real
 * diagnostics is trimmed.
 */
const MAX_FIELD_LENGTH = 4_000;

/** Appended when a field is trimmed, so the user is not misled by a clean cut. */
const TRUNCATION_NOTE = ' [truncated]';

/**
 * Bound one field, tolerating a non-string.
 *
 * TypeScript forbids an outcome without a `detail`, and so did it forbid the
 * hostile-getter case `safeErrorMessage` guards five lines below - the contract is
 * either true at runtime or it is not. An outcome missing `detail` made this read
 * `undefined.length`, the TypeError escaped `runOne` (its `try` at the bottom has a
 * `finally` and no `catch`, so `bounded` runs OUTSIDE the per-check guard) and
 * `runDoctor` REJECTED with `Cannot read properties of undefined (reading
 * 'length')` [executed]. Pre-delta the same input was harmless, so bounding every
 * field is what introduced the exposure and this is where it belongs.
 */
function boundedField(text: unknown): string {
  if (typeof text !== 'string') return '';
  if (text.length <= MAX_FIELD_LENGTH) return text;
  return `${text.slice(0, MAX_FIELD_LENGTH - TRUNCATION_NOTE.length)}${TRUNCATION_NOTE}`;
}

/** Bound both user-facing fields of a result. Applied to EVERY outcome, uniformly. */
function bounded(result: DoctorCheckResult): DoctorCheckResult {
  return {
    ...result,
    detail: boundedField(result.detail),
    ...(result.remediation === undefined ? {} : { remediation: boundedField(result.remediation) }),
  };
}

/**
 * A thrown value's message, scrubbed, without ever throwing itself.
 *
 * `runDoctor` documents that it never throws, and reading `error.message` was the
 * hole in that: an `Error` subclass whose `message` getter throws makes the
 * extraction throw, the rejection escapes `runOne` and `Promise.all`, `runDoctor`
 * rejects, and the SECONDARY error's text reaches `doctorBridge` having passed
 * through no scrubber at all [executed]. Reachability is exotic - it takes a
 * hostile or badly-built Error - but the cost of closing it is one catch, and the
 * contract is either true or it is not.
 */
function safeErrorMessage(error: unknown): string {
  try {
    return redactSecrets(error instanceof Error ? error.message : String(error));
  } catch {
    return '(the error could not be read)';
  }
}

/**
 * Run one check with a hard timeout and a throw-guard. Resolves a result for
 * EVERY outcome — a thrown error or a timeout becomes a `fail` so the battery
 * always completes.
 */
async function runOne(check: DoctorCheck, timeoutMs: number): Promise<DoctorCheckResult> {
  const started = Date.now();
  const base = { id: check.id, titleKey: check.titleKey, category: check.category };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<DoctorCheckResult>((resolve) => {
    timer = setTimeout(() => {
      resolve({
        ...base,
        status: 'fail',
        detail: `Check timed out after ${Math.round(timeoutMs / 1000)}s.`,
        remediation: 'The subsystem did not respond. Re-run, and check the relevant service or network.',
        durationMs: Date.now() - started,
      });
    }, timeoutMs);
  });

  const run = (async (): Promise<DoctorCheckResult> => {
    try {
      const outcome = await check.run();
      return { ...base, ...outcome, durationMs: Date.now() - started };
    } catch (error) {
      // The catch-all for EVERY check, so it is also the last place an
      // unanticipated credential-bearing error message could reach a Doctor
      // report (which has a "Copy report" button). Scrub unconditionally -
      // nothing here knows which check threw or what it was reading
      // (GHSA-2g2m-r86j-jg6h). A backstop, not a guarantee: `redactSecrets`
      // misses the prefixed label form (#1026), so a check that can name a
      // credential-bearing source must still sanitise at its own producer.
      const message = safeErrorMessage(error);
      return {
        ...base,
        status: 'fail',
        detail: `Check threw an error: ${message}`,
        remediation: 'This is unexpected — re-run, and report it if it persists.',
        durationMs: Date.now() - started,
      };
    }
  })();

  try {
    return bounded(await Promise.race([run, timeout]));
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Run all `checks` concurrently and aggregate a {@link DoctorReport}. Result
 * order matches the input `checks` order (stable for the UI), independent of
 * which check finished first.
 */
export async function runDoctor(checks: DoctorCheck[], timeoutMs: number = CHECK_TIMEOUT_MS): Promise<DoctorReport> {
  const results = await Promise.all(checks.map((check) => runOne(check, timeoutMs)));

  const counts = { pass: 0, warn: 0, fail: 0 };
  let overall: DoctorStatus = 'pass';
  for (const result of results) {
    counts[result.status] += 1;
    overall = worse(overall, result.status);
  }

  return { ranAt: new Date().toISOString(), overall, counts, results };
}
