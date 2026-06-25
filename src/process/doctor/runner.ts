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
 */

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
      const message = error instanceof Error ? error.message : String(error);
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
    return await Promise.race([run, timeout]);
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
