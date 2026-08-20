/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What the renderer is allowed to know about a deliverable.
 *
 * `canonicalPath` travels main -> renderer ONLY. It is here so the controls can
 * SHOW the user exactly what is about to open - a filename a model chose is
 * attacker-influenced text, and "Open brief.html" over a file that is really
 * `report.command` is the misrepresentation the host chrome exists to prevent.
 * It never travels back: every action is addressed by `artifactId`, and the
 * host re-resolves the path from the ledger each time.
 */
export interface ArtifactSummary {
  artifactId: string;
  taskId: string;
  runId: string;
  /** Skill-declared label. UNTRUSTED text - render it, never act on it. */
  title?: string;
  /** Base name of the recorded path, for compact display. Also untrusted text. */
  fileName: string;
  /** Host-resolved absolute target. Display only. */
  canonicalPath: string;
  sizeBytes: number;
  runAt: string;
  /** Skill/workflow name as declared. A LABEL, not an authenticated identity. */
  declaredBy: string;
}

/** Outcome of Save a copy. `savedTo` is absent when the user cancelled. */
export interface ArtifactSaveResult {
  ok: boolean;
  error?: string;
  savedTo?: string;
}

/**
 * How one run of a recurring task ended.
 *
 * `no-output` and `failed` are deliberately distinct. A run that completed and
 * recorded nothing is a task whose prompt or inputs need attention; a run that
 * never completed is a task that broke. Collapsing them - which is what
 * "yesterday is still the newest, with nothing to say why" did - hides both.
 */
export type ArtifactRunStatus = 'published' | 'no-output' | 'failed';

/** One run of the series a deliverable belongs to. */
export interface ArtifactSeriesRun {
  runId: string;
  status: ArtifactRunStatus;
  /** ISO timestamp of the run. Publication time, or settle time when it failed. */
  at: string;
  /** The `YYYY-MM-DD` drawer the run was filed in. Absent when it never published. */
  date?: string;
  /**
   * This run's verified deliverables. Empty for a run that produced none.
   * Addressed by `artifactId` exactly like the newest run: an earlier run is an
   * artifact, not a path.
   */
  artifacts: ArtifactSummary[];
  /** Why it did not publish. Host-authored, sanitised, display only. */
  message?: string;
  /** True on the run the requested artifact belongs to. */
  current?: boolean;
}

/**
 * The run history behind one deliverable, resolved host-side from the ledger.
 * `runs` is newest first and capped; `totalRuns` is the true count so the card
 * never implies the cap is the whole history.
 */
export interface ArtifactSeriesView {
  taskId: string;
  /** The series folder name. Display only. */
  series: string;
  runs: ArtifactSeriesRun[];
  totalRuns: number;
}

/**
 * The application the OS would open a deliverable with.
 *
 * `null` means "this could not be established honestly" - an unresolvable type,
 * a platform with no cheap answer (Windows), a helper that is not installed -
 * and the button falls back to the plain "Open" it has always said. A guess
 * would be worse than the fallback: a label naming the wrong app is a promise
 * the click will not keep.
 */
export interface ArtifactOpenTarget {
  applicationName: string | null;
}
