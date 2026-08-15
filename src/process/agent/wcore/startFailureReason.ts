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
  if (!stderrDetail) return `wcore Desktop contract rejected ready: ${fallbackDetail}`;
  return `wcore refused to start: ${stderrDetail}${profileStripHedge(stderrDetail)}`;
}
