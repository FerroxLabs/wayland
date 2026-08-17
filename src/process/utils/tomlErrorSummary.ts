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
 * Two layers:
 *  1. keep only the FIRST line - the human-readable reason - and drop the echoed
 *     source block entirely;
 *  2. run the survivor through the shared `redactSecrets` scrubber. The first
 *     line carrying no file content is a property of the current parser, not a
 *     contract, and the scrub costs nothing on a one-line string.
 *
 * Layer 1 is the defence. Layer 2 is a BACKSTOP and it is known to be
 * incomplete: `redactSecrets` masks recognisable value prefixes plus a labelled
 * assignment, and its label rule anchors a word boundary before the label, so
 * the prefixed spelling that is actually common in the wild
 * (`ANTHROPIC_API_KEY=<value>`, `my_api_key = "<value>"`) survives whenever the
 * VALUE itself carries no recognisable prefix - issue #1026, confirmed by
 * execution. Do not weaken layer 1 on the strength of layer 2, and do not read
 * a passing scrubber assertion as proof a path is safe.
 *
 * Discovered originally by the K-01 4-leg cross-audit (Gemini 3.1 Pro leg) and
 * confirmed by executing the parser against a key-bearing malformed line.
 */

import { redactSecrets } from './secretRedaction';

/** A 1-based position inside the offending TOML document. */
export type TomlErrorPosition = { line: number; column: number };

/**
 * The human-readable reason for a TOML parse failure, with the echoed source
 * block stripped and the survivor scrubbed. Safe to surface, log, and copy.
 */
export function summarizeTomlError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return redactSecrets(raw.split('\n', 1)[0].trim());
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
  const { line, column } = error as { line?: unknown; column?: unknown };
  if (typeof line !== 'number' || !Number.isFinite(line)) return null;
  if (typeof column !== 'number' || !Number.isFinite(column)) return null;
  return { line, column };
}
