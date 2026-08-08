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
  const dotted = match[1].replace(/\s*\.\s*/g, '.');
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
function removeReservedProfileTables(source: string): string {
  const lines = source.split('\n');
  const kept: string[] = [];
  let removing = false;

  for (const rawLine of lines) {
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
    throw new DesktopProfileSpliceError(
      `existing content is not valid TOML: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const withoutReserved = removeReservedProfileTables(source);
  const trimmedExisting = withoutReserved.trim();
  const spliced = trimmedExisting ? `${trimmedExisting}\n\n${fragment}` : fragment;

  try {
    parse(spliced);
  } catch (error) {
    throw new DesktopProfileSpliceError(
      `resulting content is not valid TOML: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return spliced;
}
