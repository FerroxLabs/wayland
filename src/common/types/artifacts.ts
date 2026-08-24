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
  /**
   * True when the ledger held more rows than the listing cap and the oldest
   * were dropped.
   *
   * The page's own promise is that a row is never removed - it is labelled -
   * and a silent cap contradicts that for row 501. A surface that cannot SAY
   * the list is short tells a user whose deliverable fell off the end that it
   * was never there.
   */
  truncated: boolean;
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

/**
 * The outcome of re-registering a deliverable the user has since edited.
 *
 * A failure carries the REASON rather than a boolean: "the file is now a
 * symbolic link" and "the file is gone" ask the user for different things, and
 * collapsing them into "could not refresh" makes both unactionable.
 */
export interface ArtifactRefreshResult {
  ok: boolean;
  /** Present only on a refusal, and it names WHICH refusal. */
  error?: string;
  /** The re-verified record, carrying the SAME artifact id it had before. */
  artifact?: ArtifactSummary;
}

/**
 * The exact wording the host produces when verification refuses because the
 * bytes on disk no longer match the ledger.
 *
 * -------------------------------------------------------------------------
 * THIS IS A RENDERER-SIDE COMPARISON CONSTANT. IT IS NOT THE HOST'S SOURCE.
 * -------------------------------------------------------------------------
 * `artifactTarget.ts` still holds the two literals it throws, and its own test
 * still pins them; nothing here changes what the host says. This exists so a
 * surface that receives `{ ok: false, error }` can recognise THAT refusal and
 * show a sentence a person can act on ("you edited this file - update it?")
 * instead of interpolating a host string into a toast.
 *
 * If the host wording ever changes, the surfaces silently fall back to their
 * generic failure text - which is exactly today's behaviour, so a drift here
 * costs a nicer message, never a missed refusal.
 */
export const ARTIFACT_CHANGED_ERROR = 'artifact has changed since it was recorded';

/**
 * Why the sweep refused to record a file a run claimed it produced.
 *
 * Lives HERE rather than beside the registrar because the renderer has to
 * translate it. It was a host-private vocabulary right up until the card began
 * rendering `1 escapes-workspace` to a non-technical person at the exact moment
 * their report did not arrive.
 */
export type ArtifactRejectionReason =
  | 'not-an-object'
  | 'not-a-string'
  | 'empty'
  | 'absolute'
  | 'home-relative'
  | 'traversal'
  | 'unsafe-form'
  | 'escapes-workspace'
  | 'symlink'
  | 'not-regular-file'
  | 'missing'
  | 'too-large'
  | 'too-many'
  | 'unreadable';

/**
 * The five things a person can actually be told, and act on.
 *
 * Thirteen reasons is a debugging vocabulary: `home-relative` and
 * `escapes-workspace` are the same sentence to a user ("it tried to save
 * somewhere outside this chat's folder") and differ only in which line of the
 * validator caught it. Five buckets is also 5x12 locale strings instead of
 * 13x12 for a line most people read once.
 */
export type ArtifactRejectionBucket = 'outside-folder' | 'not-a-file' | 'too-big' | 'too-many' | 'unreadable';

/**
 * The mapping, written as an exhaustive table ON PURPOSE.
 *
 * `satisfies Record<ArtifactRejectionReason, ...>` is the guard: adding a
 * fourteenth reason to the union fails to COMPILE here rather than reaching a
 * user as a raw kebab-case slug, which is the failure this whole bucket exists
 * to end.
 */
const REJECTION_BUCKETS = {
  // Where it tried to write.
  'escapes-workspace': 'outside-folder',
  absolute: 'outside-folder',
  'home-relative': 'outside-folder',
  traversal: 'outside-folder',
  // What it turned out to be.
  'not-regular-file': 'not-a-file',
  symlink: 'not-a-file',
  missing: 'not-a-file',
  // Caps.
  'too-large': 'too-big',
  'too-many': 'too-many',
  // Everything a person cannot distinguish or act on: a malformed claim reads
  // the same as an unreadable file from the outside.
  unreadable: 'unreadable',
  'not-an-object': 'unreadable',
  'not-a-string': 'unreadable',
  empty: 'unreadable',
  'unsafe-form': 'unreadable',
} satisfies Record<ArtifactRejectionReason, ArtifactRejectionBucket>;

/** Fold a host rejection reason into the bucket a surface can translate. */
export function rejectionBucketFor(reason: ArtifactRejectionReason): ArtifactRejectionBucket {
  return REJECTION_BUCKETS[reason];
}

/**
 * What the host could not confirm about a file the assistant SAID it saved.
 *
 * A CLOSED UNION, exactly as `ArtifactRejectionReason` is, and for the same
 * reason: a bare `string` here is what let `1 escapes-workspace` reach a user's
 * screen. A third verdict added later must fail to COMPILE at the renderer
 * rather than render as a raw slug under someone's missing report.
 *
 *  - `absent`    - nothing of that name anywhere under the workspace. This is B5.
 *  - `elsewhere` - the file is real, but outside the namespace this chat
 *                  collects from, so the user is told WHERE it actually is.
 *
 * There is deliberately no `supported` member: a confirmed file produces no
 * entry at all, so a verdict existing here always means something to say.
 */
export type UnsupportedClaimVerdict = 'absent' | 'elsewhere';

/** One file the assistant named that the host could not vouch for. */
export interface UnsupportedSavedFileClaim {
  /** The basename the model used, which is the name the user will recognise. */
  fileName: string;
  verdict: UnsupportedClaimVerdict;
  /** Workspace-relative, and present only when the verdict is `elsewhere`. */
  actualPath?: string;
}

/**
 * Why a deliverable has no preview.
 *
 * Distinct values because they say different things to the user, and because
 * `binary` and `too-large` are the two the host REFUSED to read rather than
 * failed to: collapsing them into "unavailable" would make a deliberate refusal
 * look like a broken file.
 */
export type ArtifactPreviewRefusal = 'too-large' | 'binary' | 'unsupported-type' | 'changed' | 'unavailable';

/**
 * A few bytes of a deliverable, for the card and the rail.
 *
 * The bytes are VERIFIED before they get here - same resolution, same ancestor
 * symlink walk, same digest check, same confinement gate as Open, Reveal and
 * Save a copy. Preview is the FIFTH action on an artifact, not a shortcut past
 * the other four.
 *
 * `text` is plain text, already truncated host-side, and the renderer must put
 * it in a `<pre>` and nothing else. `image` is a data URL for an `<img>`. There
 * is deliberately no `html` arm: an HTML deliverable previews as its SOURCE.
 */
export type ArtifactPreview =
  | { kind: 'text'; text: string; truncated: boolean }
  | { kind: 'image'; dataUrl: string }
  | { kind: 'none'; reason: ArtifactPreviewRefusal };

/**
 * Outcome of removing a deliverable from the list.
 *
 * REMOVES THE ROW, NOT THE FILE. See `forgetArtifact`.
 */
export interface ArtifactForgetResult {
  ok: boolean;
  error?: string;
}

/**
 * One byte formatter, shared, because there were four private copies and they
 * disagreed.
 *
 * Deliberately not locale-aware: a size is a technical aside on a quiet meta
 * line, and `Intl.NumberFormat` per row per render buys a decimal separator
 * nobody is reading. Caps at MB because the registrar refuses anything over
 * 64 MB, so GB is unreachable by construction.
 */
export function formatArtifactSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
