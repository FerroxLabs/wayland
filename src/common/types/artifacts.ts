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

/**
 * One place a deliverable can be sent, on a connector the user configured.
 *
 * `destinationId` is the connector's own address for that recipient (for
 * email-imap, the mail address the user already authorized). It travels
 * main -> renderer so the menu can be drawn, and comes back as an ID that is
 * re-looked-up in the LIVE connector list - never used as an address the
 * renderer supplied. That is the same rule `canonicalPath` follows for paths.
 */
export interface ArtifactSendDestination {
  destinationId: string;
  /** Display name, or the address itself when the user never gave one. */
  label: string;
}

/** A configured connector, with the recipients it is already authorized for. */
export interface ArtifactSendTarget {
  /** The configured channel plugin's id. */
  targetId: string;
  /** Plugin type, e.g. `email-imap`. Chooses the icon and the verb. */
  channel: string;
  /** The account a send would leave FROM, e.g. the configured inbox address. */
  label: string;
  /** Never empty: a connector with nobody to send to is not offered at all. */
  destinations: ArtifactSendDestination[];
}

/**
 * Why a send did not happen. Codes, not sentences, because the renderer owns
 * the wording in twelve locales and a message from main cannot be translated.
 */
export type ArtifactSendErrorCode =
  | 'invalid_request'
  | 'unknown_artifact'
  | 'unknown_target'
  | 'unknown_destination'
  | 'too_large'
  | 'send_failed';

/**
 * Outcome of Send to...
 *
 * `sentTo` is absent when the user DECLINED, exactly as `savedTo` is absent
 * when they cancelled the save dialog. Declining is `ok` - it is not a failure,
 * and it must not raise an error toast.
 */
export interface ArtifactSendResult {
  ok: boolean;
  /** Recipient label, present only on a completed send. */
  sentTo?: string;
  errorCode?: ArtifactSendErrorCode;
  /** Connector-authored detail for `send_failed`. Display only, never parsed. */
  message?: string;
}
