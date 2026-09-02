/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-02 - honest wcore start-failure surfacing (DIA-01, DIA-02).
 *
 * Deliberately its own file, NOT an extension of the sibling
 * `execFailureReason.ts`. That file's head comment carries an explicit
 * Sean-locked boundary: "This is NOT an error taxonomy/catalog... Provider /
 * model API errors... must not pass through here." This module's classifier
 * is narrowly scoped to the one 0.12.26 profile-strip shape DIA-02 names, not
 * a general taxonomy - but growing that specific locked file was judged the
 * wrong place to test that boundary. A new, obviously narrow, single-purpose
 * file keeps the diff (and the concurrency-risk footprint against K-01)
 * smaller too.
 *
 * Leaf pure module: no `fs`, no `child_process`, no import of `index.ts`.
 * Callers are responsible for redacting/stripping ANSI from `detail` before
 * it reaches these functions - none of them do their own redaction.
 */
import { WCORE_DESKTOP_MCP_PROFILE } from './envBuilder';

/**
 * `stripped-config` - the bail names Desktop's OWN reserved launch profile,
 * the one it just wrote moments before spawn (the 0.12.26 workspace-trust
 * strip shape).
 * `profile-resolution` - the bail names some OTHER profile (an ordinary
 * missing/misconfigured profile, unrelated to the strip).
 * `generic` - the detail does not match the "Profile not found" bail shape at
 * all.
 */
export type StartFailureClass = 'stripped-config' | 'profile-resolution' | 'generic';

// Matches Core's `Profile 'X' not found in config` bail, case-insensitive,
// tolerant of either quote style, capturing the profile name.
const PROFILE_NOT_FOUND_PATTERN = /profile\s+['"]([^'"]+)['"]\s+not found in config/i;

/**
 * Lines the engine prints as INFORMATION, never as a cause of failure.
 *
 * Core emits `notice: provider 'openai' is using the credential from
 * OPENAI_API_KEY ...` on every start where that env var exists - it is a remark
 * about a provider the user may not even be using. When a start fails for an
 * unrelated reason (a journal that cannot be replayed, say), that notice is
 * often the ONLY text in the stderr tail, so it got surfaced as the cause and
 * the user was told their OpenAI key broke a chat running on Flux.
 *
 * Measured on a customer-shaped run: the real failure was
 * `invalid journal state transition: ... state digest mismatch` followed by
 * `Desktop contract failed closed { code: 'ready_required' }`, and the message
 * shown named an unrelated credential.
 */
const INFORMATIONAL_LINE = /^\s*notice\s*:/i;

/**
 * Drop informational lines so a real cause is never displaced by a remark.
 * Returns '' when nothing but notices remain - callers then keep their own
 * wording rather than blaming a notice.
 */
export function stripInformationalLines(detail: string): string {
  return detail
    .split('\n')
    .filter((line) => line.trim() && !INFORMATIONAL_LINE.test(line))
    .join('\n')
    .trim();
}

/** Classify a (already redacted) start-failure detail string. */
export function classifyStartFailureDetail(detail: string): StartFailureClass {
  const match = PROFILE_NOT_FOUND_PATTERN.exec(detail);
  if (!match) return 'generic';
  return match[1] === WCORE_DESKTOP_MCP_PROFILE ? 'stripped-config' : 'profile-resolution';
}

/**
 * A short parenthetical hedge for a `stripped-config` detail, worded as an
 * inference - never a certainty, since Core has not confirmed the strip;
 * Desktop is only reasoning from "this is the profile I just wrote, moments
 * ago, and it's the only profile name that is ever passed". Returns '' for
 * every other classification.
 */
export function profileStripHedge(detail: string): string {
  if (classifyStartFailureDetail(detail) !== 'stripped-config') return '';
  return (
    ' (likely cause: this workspace was not trusted by Wayland Core, so the launch profile ' +
    'Desktop just wrote was stripped before the engine read it back - inferred from the ' +
    'profile name, not confirmed by the engine)'
  );
}

/**
 * DIA-01 fix for the `failDesktopContract` site specifically. `stderrDetail`
 * is expected pre-redacted/pre-ANSI-stripped by the caller (the same
 * composition the exit/timeout sites already use).
 *
 * When there genuinely is no engine-side stderr, the original abstract
 * wording is returned unchanged - losing that detail would be a regression,
 * not an improvement. When stderr IS available, the abstract phrase is fully
 * replaced by the engine's own reason (plus the stripped-config hedge, when
 * it applies). This is the ONLY site that replaces the abstract phrase; the
 * other two stderr-surfacing sites in `startWithProjectConfigLease` only ever
 * APPEND `profileStripHedge`'s suffix to their existing, already-correct
 * wording.
 */
export function describeContractRejection(stderrDetail: string, fallbackDetail: string): string {
  const meaningful = stripInformationalLines(stderrDetail);
  if (!meaningful) return `wcore Desktop contract rejected ready: ${fallbackDetail}`;
  return `wcore refused to start: ${meaningful}${profileStripHedge(meaningful)}`;
}

/**
 * The engine's OWN refusal of a `--trust-workspace` request, as printed on
 * stderr before it bails.
 *
 * WHY THIS EXISTS. `wcore-cli/src/main.rs` runs `trust_store.grant(...)?`
 * BEFORE it resolves config or opens a session, so a refused grant is
 * `anyhow::bail` — the process exits and Desktop's contract never sees `ready`.
 * Once Desktop started passing the flag (60212ffaf) that turned a chat which
 * would merely have run UNTRUSTED into a chat that cannot start at all: the
 * user gets "Agent failed to start: …" and every subsequent turn is refused.
 * Any user whose enabled skills carry a large payload trips it — measured on a
 * packaged build with a 52MB vendored connector inside a skill:
 *   `Error: executable repository surface exceeds the fingerprint limits`
 *
 * WHY MATCHING THE ENGINE'S TEXT IS RIGHT, AND A PRE-CHECK IS NOT. Core's
 * limits (`MAX_EXECUTABLE_FILES`, `MAX_EXECUTABLE_FILE_BYTES`,
 * `MAX_EXECUTABLE_TOTAL_BYTES`) are Core's policy, and its fingerprint walk has
 * its own scope rules (executable project ancestors, symlink handling). Copying
 * either into Desktop would drift the moment Core changes them, and would still
 * have to guess at the walk. Reacting to the refusal Core actually printed
 * cannot drift.
 *
 * WHY THESE EXACT SHAPES. This is the complete `Display` set of Core's
 * `WorkspaceTrustError` (`crates/wcore-config/src/workspace_trust.rs`), which
 * is the ONLY error type `grant`/`revoke` can return. The neighbouring
 * subsystems that fingerprint executable trees deliberately word themselves
 * differently — migrate quarantine says "imported executable surface exceeds
 * the quarantine limits", content import says "imported surface exceeds the
 * import limits" — so none of them can be mistaken for a trust refusal.
 *
 * WHY THE LINE ANCHOR MATTERS. The same error text is ALSO reachable as a
 * non-fatal `tracing::warn!("workspace trust resolution failed closed")` from
 * `config.rs`, where trust resolution fails closed to untrusted and the engine
 * starts normally. A tracing line is prefixed with a timestamp and level, so
 * anchoring to the start of a line (optionally after anyhow's `Error: `) keeps
 * a benign warning from being read as a refusal.
 */
const WORKSPACE_TRUST_REFUSAL =
  /^[ \t]*(?:error[: ]\s*)?(?:workspace trust (?:i\/o failed|store is invalid|store schema \d+ is not supported)|workspace root is not a directory|executable repository (?:content contains a symlink|file exceeds \d+ bytes|surface exceeds the fingerprint limits))\b/im;

/**
 * Whether an (already redacted, ANSI-stripped) engine stderr tail carries a
 * refusal of the workspace-trust grant. Callers must additionally know that
 * THIS spawn actually passed `--trust-workspace`; this function only reads the
 * engine's words.
 */
export function isWorkspaceTrustRefusal(stderrDetail: string): boolean {
  return WORKSPACE_TRUST_REFUSAL.test(stderrDetail);
}
