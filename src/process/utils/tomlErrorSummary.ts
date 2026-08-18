/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared summarizer for `smol-toml` parse errors (GHSA-2g2m-r86j-jg6h).
 *
 * A `smol-toml` parse error message echoes the OFFENDING SOURCE LINE and its
 * neighbours verbatim after a blank line, e.g.:
 *
 *   Invalid TOML document: each key-value declaration must be followed by ...
 *
 *   2:  api_key = "sk-ant-REDACTED-EXAMPLE"
 *   3:  base_url = "https://api.anthropic.com" oops
 *                                             ^
 *
 * The TOML files this app parses on the user's behalf - above all the engine's
 * global `config.toml` - hold real `api_key` values, so the raw message IS a
 * live credential inside an Error that gets logged, surfaced in the UI, and (on
 * the Doctor panel, which has a "Copy report" button and exists to be shared
 * with support) copied out by the user.
 *
 * This logic lived as a private `summarizeTomlError` inside
 * `@process/agent/wcore/desktopProfileSplice`, while `doctor/registry.ts`
 * passed `error.message` through untouched: two components reaching opposite
 * conclusions about the same data, and the one on the copy-to-support surface
 * was the one that leaked. It is one helper now, and both call it.
 *
 * Three layers:
 *  1. keep only the FIRST line - the human-readable reason - and drop the echoed
 *     source block entirely;
 *  2. cap the survivor's LENGTH, because a first line is not a short line;
 *  3. run it through the shared `redactSecrets` scrubber. The first line carrying
 *     no file content is a property of the current parser, not a contract, and
 *     the scrub costs nothing on a bounded string.
 *
 * Layer 1 is the defence. Layer 3 is a BACKSTOP and it is known to be
 * incomplete: `redactSecrets` masks recognisable value prefixes plus a labelled
 * assignment, and its label rule anchors a word boundary before the label, so
 * the prefixed spelling that is actually common in the wild
 * (`ANTHROPIC_API_KEY=<value>`, `my_api_key = "<value>"`) survives whenever the
 * VALUE itself carries no recognisable prefix - issue #1026, confirmed by
 * execution. Do not weaken layer 1 on the strength of layer 3, and do not read
 * a passing scrubber assertion as proof a path is safe.
 *
 * WHAT THIS HELPER IS FOR, and what it is not. It is for `smol-toml` parse
 * errors, whose first line is a fixed English reason [verified across ten real
 * corrupt files: the reason ran 36 to 87 characters and the file's own content
 * never reached line 1]. It is NOT a general-purpose sanitiser, and routing an
 * arbitrary error through it fails open. `probeEngineConfig` used to route a
 * `ProfileIsolationError` here, and that error interpolates the profile name on
 * its FIRST line, so layer 1 was inert and layer 2 could not see a bare value -
 * the profile name went straight into the report. That branch returns a constant
 * now. Before adding a caller, check that its first line cannot carry user text.
 *
 * Discovered originally by the K-01 4-leg cross-audit (Gemini 3.1 Pro leg) and
 * confirmed by executing the parser against a key-bearing malformed line.
 */

import { redactSecrets } from './secretRedaction';

/** A 1-based position inside the offending TOML document. */
export type TomlErrorPosition = { line: number; column: number };

/**
 * Every character a line can END on, not just `\n`.
 *
 * `split('\n', 1)` was not enough, and both gaps were reached by execution. A
 * message whose lines end in a bare `\r` (classic-Mac line endings still occur in
 * hand-edited files, and any producer can emit one) kept its whole body in
 * "line 1", and so did one separated by U+2028 LINE SEPARATOR or U+2029 PARAGRAPH
 * SEPARATOR - both of which JavaScript treats as line terminators, so text
 * downstream renders them as breaks while `split('\n')` never saw them.
 */
const LINE_TERMINATOR = /\r\n|\r|\n|\u2028|\u2029/;

/**
 * Hard cap on the surfaced reason.
 *
 * Layer 1 keeps only the first line, but a first line is not a SHORT line: a
 * single-line 500,000-character message returned all 500,032 characters, straight
 * into a report the UI renders and offers to copy [executed]. 200 is a measured
 * bound, not a guess: across ten real corrupt TOML files the smol-toml reason line
 * ran 36 to 87 characters, the longest being "only letter, numbers, dashes and
 * underscores are allowed in keys" at 87, so this leaves better than twice the
 * headroom of anything the parser actually produces.
 */
const MAX_SUMMARY_LENGTH = 200;

/**
 * The human-readable reason for a TOML parse failure, with the echoed source
 * block stripped, the survivor scrubbed, and the result length-capped. Safe to
 * surface, log, and copy.
 *
 * ORDER IS LOAD-BEARING: scrub, THEN cap. Capping first truncates a credential
 * that straddles the boundary, and a truncated credential can fail to match its
 * own pattern - so the cap would hand out the surviving fragment instead of a
 * mask. Scrubbing the whole line first means the pattern sees the value intact.
 */
export function summarizeTomlError(error: unknown): string {
  try {
    const raw = error instanceof Error ? error.message : String(error);
    const firstLine = raw.split(LINE_TERMINATOR, 1)[0].trim();
    return redactSecrets(firstLine).slice(0, MAX_SUMMARY_LENGTH);
  } catch {
    // `error.message` is a GETTER, and `String(error)` runs `toString`; either can
    // throw on a hostile or badly-built Error. Unguarded, that throw propagated out
    // of `probeEngineConfig`'s own catch and falsified its documented "Never throws"
    // contract [executed]. Nothing leaked today only because the runner's
    // `safeErrorMessage` happened to be downstream - i.e. the contract was held up
    // by a coincidence rather than by this function. Same guard, and the same
    // reasoning, as `safeErrorMessage` in `doctor/runner.ts`.
    return '(the parse error could not be read)';
  }
}

/**
 * The failure's position as NUMBERS, so a caller can stay actionable ("fix line
 * 3, column 40") without echoing the line's text.
 *
 * `smol-toml`'s `TomlError` carries `line`, `column` and `codeblock` as own
 * properties [verified by execution against the installed smol-toml]. Only the
 * two numbers are read here; `codeblock` is the echoed source itself and must
 * never be surfaced. Read structurally rather than via an `instanceof
 * TomlError` check so this module stays free of a `smol-toml` import - it is
 * pulled in by error paths that must not drag the parser along.
 */
export function tomlErrorPosition(error: unknown): TomlErrorPosition | null {
  if (typeof error !== 'object' || error === null) return null;
  try {
    // The DESTRUCTURE is the exposure, not the type tests below it: `line` and
    // `column` are read as properties, so a throwing getter throws here [executed].
    // Position is a nice-to-have - the caller drops it when it is absent - so
    // failing to `null` is strictly better than propagating.
    const { line, column } = error as { line?: unknown; column?: unknown };
    if (typeof line !== 'number' || !Number.isFinite(line)) return null;
    if (typeof column !== 'number' || !Number.isFinite(column)) return null;
    return { line, column };
  } catch {
    return null;
  }
}
