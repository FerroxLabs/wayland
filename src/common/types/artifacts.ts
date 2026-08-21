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
/**
 * The three states a listed deliverable's file can be in.
 *
 * `empty` is called out separately from `ready` because a zero-byte deliverable
 * is the shape a failed run leaves behind, and showing it as ready sends the
 * user to open a blank file and conclude the app lost their work.
 */
export type ArtifactDiskStatus = 'ready' | 'empty' | 'missing';

/**
 * What `artifacts.list` answers with.
 *
 * An envelope rather than a bare array so a partially-unreadable ledger can be
 * SAID rather than silently shortened. A list that renders what parsed and
 * warns about the rest is honest; one that renders what parsed and says nothing
 * tells a user whose file is missing that it was never there.
 */
export interface ArtifactListing {
  artifacts: ArtifactSummary[];
  /** Ledger lines that could not be parsed or failed validation. */
  unreadableEntries: number;
}

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
  /**
   * What the filesystem says about `canonicalPath` at ENUMERATION time.
   *
   * A listing that dropped an artifact whose file had gone would answer the
   * user's "where did my report go?" with silence, so a row is never removed -
   * it is labelled. Advisory and already stale by the time it renders: every
   * action re-verifies, and this is only what to SAY on the row.
   *
   * Absent on surfaces that do not stat (the series view), which read as
   * "not established" rather than as `ready`.
   */
  diskStatus?: ArtifactDiskStatus;
  /**
   * Host-resolved absolute paths that are STABLE COPIES of `canonicalPath`,
   * present only on the newest run of a series.
   *
   * A publication mirrors the newest run's deliverables to the series root so a
   * reader has a path that does not move (`artifacts/market/brief.html`), and
   * that shallow, undated copy is the one a person actually clicks in the
   * workspace tree. Without it listed here the preview matches nothing and the
   * most discoverable file in the whole layout is the one with no Open, no
   * Reveal and no history. Display/matching only: every action still travels by
   * `artifactId` and the host still acts on `canonicalPath`, which is the same
   * bytes.
   */
  aliasPaths?: string[];
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
