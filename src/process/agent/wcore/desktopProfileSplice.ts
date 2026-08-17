/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-01: textual splice of the Desktop-owned
 * `[profiles.__wayland_desktop_session*]` table into the user's real global
 * `config.toml`.
 *
 * TEXTUAL SPLICE ONLY - structured round-trip (`parse` + `stringify`) is
 * FORBIDDEN here. `sanitizeProjectConfig` (index.ts) does that round trip for
 * the small, Desktop-managed WORKSPACE `.wayland-core.toml`, which is fine
 * there; it is not fine here because this file is the user's real,
 * hand-edited global config, and a round trip silently destroys comments and
 * formatting.
 */
import { parse } from 'smol-toml';
import { WCORE_DESKTOP_MCP_PROFILE } from './envBuilder';

/**
 * Thrown when the existing or resulting global `config.toml` content around
 * the reserved Desktop MCP profile table is not valid TOML. Mirrors
 * `ProfileIsolationError`'s `code` pattern (`profilePaths.ts`).
 *
 * Unlike `sanitizeProjectConfig`'s fail-closed posture for the small
 * Desktop-managed WORKSPACE file (discard unparseable user content, write
 * only the app's known-good config), this file also holds the user's real
 * providers, credentials, and memory/skills settings - discarding it would be
 * catastrophic data loss, not a benign reset. So this error propagates
 * instead, and the caller must refuse to write anything.
 */
export class DesktopProfileSpliceError extends Error {
  readonly code = 'DESKTOP_PROFILE_SPLICE_INVALID' as const;
  constructor(detail: string) {
    super(
      `Cannot safely update the reserved [profiles.${WCORE_DESKTOP_MCP_PROFILE}] table in the global Wayland ` +
        `Core config (${detail}). Fix the file by hand before Desktop can launch against it.`
    );
    this.name = 'DesktopProfileSpliceError';
  }
}

/** Any TOML table-header line, e.g. `[providers.anthropic]` or `[[a.b]] # c`. */
const TABLE_HEADER_LINE_RE = /^\[{1,2}\s*([^\]]+?)\s*\]{1,2}/;

/**
 * A `smol-toml` parse error message echoes the OFFENDING SOURCE LINE verbatim
 * after a blank line, e.g.:
 *
 *   Invalid TOML document: each key-value declaration must be followed by ...
 *
 *   1:  api_key = "sk-ant-REDACTED-EXAMPLE" oops
 *                                           ^
 *
 * This file operates on the user's REAL global `config.toml`, which holds
 * `api_key` values. Embedding the raw message would carry a live credential
 * into an Error that is surfaced, logged, and (via K-02) shown in the UI. Keep
 * only the first line - the human-readable reason - and drop the echoed source
 * block entirely. Found by the K-01 4-leg cross-audit (Gemini 3.1 Pro leg) and
 * confirmed by executing the parser against a key-bearing malformed line.
 */
function summarizeTomlError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.split('\n', 1)[0].trim();
}

/**
 * Line indices that begin INSIDE a TOML multi-line string (`"""` or `'''`).
 *
 * Without this, the line scanner below matches a table header that is merely
 * QUOTED inside a user's multi-line string and deletes real user content that
 * happens to sit between it and the next header-looking line - and because the
 * surviving text can still parse, the fail-closed guard never fires and the
 * loss is SILENT. Found by the K-01 4-leg cross-audit (Gemini 3.1 Pro leg) and
 * reproduced by execution before this guard was written.
 *
 * Exported (#1024) so `engineConfigRecovery.ts` reuses this exact scanner rather
 * than carrying a second copy: its automatic line-break repair must make the
 * same "this line is DATA, not structure" call, and two divergent copies of this
 * logic is how the silent-loss bug above comes back.
 */
export function multilineStringLineStates(source: string): boolean[] {
  const states: boolean[] = [];
  let inBasic = false; // inside """ ... """
  let inLiteral = false; // inside ''' ... '''
  let inQuoted = false; // inside a single-line "..." (basic) string
  let inApostrophe = false; // inside a single-line '...' (literal) string
  let inComment = false;

  states.push(false);
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];

    if (ch === '\n') {
      // A comment and any single-line string both end at the newline; only the
      // multi-line forms survive into the next line.
      inComment = false;
      inQuoted = false;
      inApostrophe = false;
      states.push(inBasic || inLiteral);
      continue;
    }

    if (inComment) continue;

    if (inBasic) {
      if (ch === '\\') {
        i += 1; // escape consumes the next char, incl. an escaped quote
      } else if (source.startsWith('"""', i)) {
        inBasic = false;
        i += 2;
      }
      continue;
    }
    if (inLiteral) {
      // Literal strings have NO escape processing.
      if (source.startsWith("'''", i)) {
        inLiteral = false;
        i += 2;
      }
      continue;
    }
    if (inQuoted) {
      if (ch === '\\') i += 1;
      else if (ch === '"') inQuoted = false;
      continue;
    }
    if (inApostrophe) {
      if (ch === "'") inApostrophe = false;
      continue;
    }

    if (source.startsWith('"""', i)) {
      inBasic = true;
      i += 2;
    } else if (source.startsWith("'''", i)) {
      inLiteral = true;
      i += 2;
    } else if (ch === '"') {
      inQuoted = true;
    } else if (ch === "'") {
      inApostrophe = true;
    } else if (ch === '#') {
      inComment = true;
    }
  }

  return states;
}

/**
 * True when the document declares `profiles` as a VALUE (an inline table or
 * any other non-table form) at the top level, e.g. `profiles = { work = ... }`.
 *
 * TOML forbids extending an inline table with a bracketed sub-table, so
 * appending `[profiles.__wayland_desktop_session]` to such a document can never
 * parse. Detected explicitly so the user gets an actionable message instead of
 * a bare "resulting content is not valid TOML", which would read as a Wayland
 * bug rather than a one-line fix in their own config. Found by the K-01 4-leg
 * cross-audit (Gemini 3.1 Pro leg) and confirmed by execution.
 */
function declaresProfilesAsValue(source: string, multilineStates: readonly boolean[]): boolean {
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (multilineStates[i]) continue;
    if (/^\s*(profiles|"profiles"|'profiles')\s*=/.test(lines[i])) return true;
  }
  return false;
}

/**
 * True when a trimmed line opens the reserved Desktop MCP profile table -
 * exactly `profiles.__wayland_desktop_session`, or a dotted continuation
 * table under it (`profiles.__wayland_desktop_session.foo`). Whitespace
 * around dots is normalized so `profiles . __wayland_desktop_session` also
 * matches, matching the tolerant dotted-key handling `sanitizeProjectConfig`
 * already relies on for the equivalent `providers.*` sweep.
 */
function isReservedProfileHeader(trimmedLine: string): boolean {
  const match = TABLE_HEADER_LINE_RE.exec(trimmedLine);
  if (!match) return false;
  // Normalize whitespace around dots AND strip per-segment quoting, so the
  // quoted spelling `["profiles" . '__wayland_desktop_session']` is recognized
  // as the same table as the bare form Desktop itself writes. Without this the
  // splice leaves a stale reserved table behind, then appends a second one and
  // fails the output parse - a fail-closed brick rather than data loss, but an
  // avoidable one. Raised by the K-01 cross-audit (Kimi K3 and internal legs).
  const dotted = match[1]
    .split('.')
    .map((segment) =>
      segment
        .trim()
        .replace(/^"([\s\S]*)"$/, '$1')
        .replace(/^'([\s\S]*)'$/, '$1')
    )
    .join('.');
  const reserved = `profiles.${WCORE_DESKTOP_MCP_PROFILE}`;
  return dotted === reserved || dotted.startsWith(`${reserved}.`);
}

function isTableHeaderLine(trimmedLine: string): boolean {
  return TABLE_HEADER_LINE_RE.test(trimmedLine);
}

/**
 * Textually remove every occurrence of the reserved
 * `[profiles.__wayland_desktop_session*]` table(s) from `source`, then append
 * `fragment` using the same base/blank-line joining convention
 * `appendDesktopMcpProfile` already uses.
 */
function removeReservedProfileTables(source: string, multilineStates: readonly boolean[]): string {
  const lines = source.split('\n');
  const kept: string[] = [];
  let removing = false;

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    // A line that begins inside a multi-line string is DATA, never structure.
    // Treat it as opaque: it can neither open nor close a removal block.
    // Without this, quoted text that merely looks like a table header silently
    // deletes real user content (see `multilineStringLineStates`).
    if (multilineStates[i]) {
      if (!removing) kept.push(rawLine);
      continue;
    }
    const trimmed = rawLine.trim();
    if (removing) {
      if (isTableHeaderLine(trimmed)) {
        // A new header ends the removed block; this line is NOT part of it,
        // so fall through to the normal per-line handling below.
        removing = false;
      } else {
        continue;
      }
    }
    if (isReservedProfileHeader(trimmed)) {
      // Drop the header line itself and start consuming its body.
      removing = true;
      continue;
    }
    kept.push(rawLine);
  }

  return kept.join('\n');
}

/**
 * Splice the reserved `[profiles.__wayland_desktop_session*]` table out of
 * `existing` and append `fragment` in its place, validating both the input
 * and the output parse as TOML.
 *
 * @param existing the current global `config.toml` bytes, or `null` if the
 *   file does not exist yet.
 * @param fragment the Desktop-owned profile fragment, built via
 *   `appendDesktopMcpProfile(null, serverNames)`.
 * @throws {DesktopProfileSpliceError} if `existing` is non-empty and not
 *   valid TOML, or if the spliced result somehow fails to parse (defensive -
 *   should be unreachable given validated input plus an app-generated
 *   fragment).
 */
export function spliceDesktopMcpProfile(existing: string | null, fragment: string): string {
  const source = existing ?? '';

  // Parse FIRST, for validation only - the parsed object is never used for
  // output. An unparseable non-empty `existing` means the user's real config
  // is in a state we cannot safely touch.
  try {
    parse(source);
  } catch (error) {
    throw new DesktopProfileSpliceError(`existing content is not valid TOML: ${summarizeTomlError(error)}`);
  }

  const multilineStates = multilineStringLineStates(source);

  // TOML forbids extending an inline table with a bracketed sub-table, so this
  // document can never accept `[profiles.__wayland_desktop_session]`. Say that
  // plainly instead of letting the generic output-parse failure below report it
  // as an opaque "resulting content is not valid TOML".
  if (declaresProfilesAsValue(source, multilineStates)) {
    throw new DesktopProfileSpliceError(
      'the global config declares "profiles" as an inline value (for example `profiles = { ... }`), and TOML ' +
        'does not allow adding a [profiles.<name>] section to it. Rewrite that entry as [profiles.<name>] ' +
        'sections and Desktop can manage its own profile alongside yours'
    );
  }

  const withoutReserved = removeReservedProfileTables(source, multilineStates);
  const trimmedExisting = withoutReserved.trim();
  const spliced = trimmedExisting ? `${trimmedExisting}\n\n${fragment}` : fragment;

  try {
    parse(spliced);
  } catch (error) {
    throw new DesktopProfileSpliceError(`resulting content is not valid TOML: ${summarizeTomlError(error)}`);
  }

  return spliced;
}
