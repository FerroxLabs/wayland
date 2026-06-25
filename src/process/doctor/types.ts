/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Doctor — the app health-check / diagnostic surface (issue #35).
 *
 * A "Doctor" runs a battery of independent checks across the app's subsystems
 * (providers, models, the Wayland Core engine, MCP servers, ACP backends,
 * workspaces, config integrity) and reports a per-check verdict with a
 * human-readable detail and, on a non-pass, an actionable remediation string.
 *
 * The check registry is intentionally pure-ish and individually testable: each
 * check is a self-contained `{ id, titleKey, category, run() }` record whose
 * `run()` resolves a typed result and NEVER throws — the runner additionally
 * guards every check so one thrown error cannot abort the battery.
 *
 * Adding a check is a single registry entry (see `registry.ts`).
 */

/** The verdict of a single diagnostic check. */
export type DoctorStatus = 'pass' | 'warn' | 'fail';

/**
 * Subsystem a check belongs to. Used purely to group checks in the UI; adding a
 * category is a string-union edit plus an i18n label.
 */
export type DoctorCategory =
  | 'providers'
  | 'models'
  | 'engine'
  | 'mcp'
  | 'backends'
  | 'workspace'
  | 'config';

/** The outcome a check's `run()` resolves. */
export type DoctorCheckOutcome = {
  status: DoctorStatus;
  /** One-line human-readable summary of what was found. */
  detail: string;
  /**
   * Actionable next step when `status` is `warn`/`fail`. Omitted on `pass`.
   * Plain text (the UI renders it verbatim); name the route/config/state to fix.
   */
  remediation?: string;
};

/**
 * A single registered diagnostic check. Pure-ish and individually testable: it
 * captures its own dependencies and exposes one async `run()`.
 */
export type DoctorCheck = {
  /** Stable machine-readable id, e.g. `providers.connectivity`. */
  id: string;
  /** i18n key for the check's display title. */
  titleKey: string;
  category: DoctorCategory;
  /**
   * Run the check. Should resolve a verdict for every reachable outcome and
   * avoid throwing; the runner still wraps it so a throw becomes a `fail`.
   */
  run: () => Promise<DoctorCheckOutcome>;
};

/** A check's outcome plus its identity — what the runner returns per check. */
export type DoctorCheckResult = DoctorCheckOutcome & {
  id: string;
  titleKey: string;
  category: DoctorCategory;
  /** Wall-clock duration of `run()` in milliseconds. */
  durationMs: number;
};

/** The aggregated result of a full Doctor run. */
export type DoctorReport = {
  /** ISO-8601 timestamp the run completed. */
  ranAt: string;
  /** Worst status across all checks (`fail` > `warn` > `pass`). */
  overall: DoctorStatus;
  counts: { pass: number; warn: number; fail: number };
  results: DoctorCheckResult[];
};
