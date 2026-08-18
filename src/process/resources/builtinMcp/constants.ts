/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

// Keep these constants local to avoid pulling in common/config/storage side effects
// when a built-in MCP server boots in a standalone stdio process.
export const BUILTIN_IMAGE_GEN_ID = 'builtin-image-gen';
export const BUILTIN_IMAGE_GEN_NAME = 'wayland-image-generation';
export const BUILTIN_IMAGE_GEN_LEGACY_NAMES = ['Wayland Image Generation', BUILTIN_IMAGE_GEN_ID] as const;

export const BUILTIN_SEARCH_SKILLS_ID = 'builtin-search-skills';
export const BUILTIN_SEARCH_SKILLS_NAME = 'wayland-search-skills';
export const BUILTIN_SEARCH_SKILLS_TOOL_NAME = 'wayland_search_skills';
// Second tool on the same stdio server: paginated body reader, so search can
// return lightweight metadata and bodies are fetched on demand (issue #199).
export const BUILTIN_READ_SKILL_TOOL_NAME = 'wayland_read_skill';

// Bundled @wayland MCP servers shipped with the installer (no npm publish).
// Each catalog entry's transport stores the bare filename as args[0]; the
// spawn layer rewrites it to an absolute path via `getMcpScriptPath()`.
export const BUILTIN_WAYLAND_APPLE_NAME = 'com.wayland/apple-mcp';
export const BUILTIN_WAYLAND_APPLE_FILE = 'builtin-mcp-apple.mjs';
export const BUILTIN_WAYLAND_IMAP_NAME = 'com.wayland/imap-mcp';
export const BUILTIN_WAYLAND_IMAP_FILE = 'builtin-mcp-imap.mjs';
export const BUILTIN_WAYLAND_NEWS_NAME = 'com.wayland/news-mcp';
export const BUILTIN_WAYLAND_NEWS_FILE = 'builtin-mcp-news.mjs';
export const BUILTIN_WAYLAND_CAL_COM_NAME = 'com.wayland/cal-com-mcp';
export const BUILTIN_WAYLAND_CAL_COM_FILE = 'builtin-mcp-cal-com.mjs';

export const BUILTIN_WAYLAND_MCP_FILES = [
  BUILTIN_WAYLAND_APPLE_FILE,
  BUILTIN_WAYLAND_IMAP_FILE,
  BUILTIN_WAYLAND_NEWS_FILE,
  BUILTIN_WAYLAND_CAL_COM_FILE,
] as const;

export type BuiltinWaylandMcpFile = (typeof BUILTIN_WAYLAND_MCP_FILES)[number];

/** True if `arg` is a bare filename matching a bundled @wayland MCP. */
export function isBuiltinWaylandMcpArg(arg: string | undefined | null): arg is BuiltinWaylandMcpFile {
  if (!arg) return false;
  return (BUILTIN_WAYLAND_MCP_FILES as readonly string[]).includes(arg);
}

/**
 * Catalog entry id -> the bundled script that entry installs.
 *
 * WHY PROVENANCE, NOT THE FILENAME (#1015 F2)
 * -------------------------------------------
 * A bare filename with no separator is indistinguishable from a user's own
 * relative script path by string inspection alone, so the allowlist above is not
 * sufficient authority to REPLACE `args[0]` with our own script — that would
 * execute a DIFFERENT FILE than the one the user configured. The only code path
 * that ever writes the bare-filename form is the MCP Library install
 * (`entryToServerData`), and it writes `libraryEntryId` in the same record. That
 * pair is the proof of ownership; the filename on its own is not.
 *
 * A Map, not an object literal, so a hostile `libraryEntryId` like
 * `__proto__`/`constructor` cannot reach a prototype member.
 */
const BUILTIN_WAYLAND_MCP_ENTRY_FILES = new Map<string, BuiltinWaylandMcpFile>([
  [BUILTIN_WAYLAND_APPLE_NAME, BUILTIN_WAYLAND_APPLE_FILE],
  [BUILTIN_WAYLAND_IMAP_NAME, BUILTIN_WAYLAND_IMAP_FILE],
  [BUILTIN_WAYLAND_NEWS_NAME, BUILTIN_WAYLAND_NEWS_FILE],
  [BUILTIN_WAYLAND_CAL_COM_NAME, BUILTIN_WAYLAND_CAL_COM_FILE],
]);

/**
 * True only when `libraryEntryId` is the catalog entry that installs exactly
 * `arg`. Both halves must agree: a @wayland record pointed at a DIFFERENT
 * builtin's filename is not the entry it claims to be and is left alone.
 */
export function isOwnBuiltinWaylandMcpScript(
  libraryEntryId: string | undefined | null,
  arg: string | undefined | null
): boolean {
  if (!libraryEntryId || !arg) return false;
  return BUILTIN_WAYLAND_MCP_ENTRY_FILES.get(libraryEntryId) === arg;
}

/** True if `libraryEntryId` names one of the four bundled @wayland catalog entries. */
export function isBundledWaylandMcpEntryId(libraryEntryId: string | undefined | null): boolean {
  if (!libraryEntryId) return false;
  return BUILTIN_WAYLAND_MCP_ENTRY_FILES.has(libraryEntryId);
}

/**
 * True if the transport is a bundled @wayland MCP spawn (node + bare filename
 * args[0] matching one of the four built-ins).
 */
export function isBuiltinWaylandMcpTransport(transport?: {
  type?: string;
  command?: string;
  args?: string[] | null;
}): boolean {
  if (!transport || transport.type !== 'stdio' || transport.command !== 'node') return false;
  const first = (transport.args ?? [])[0];
  return isBuiltinWaylandMcpArg(first);
}

/**
 * First-party bundled stdio MCP servers emitted by `scripts/build-mcp-servers.js`.
 *
 * These differ from `BUILTIN_WAYLAND_MCP_FILES` above in HOW they are stored:
 * the four sibling @wayland servers keep a bare filename in `args[0]`, while
 * these are seeded into `mcp.config` with an ABSOLUTE path (see
 * `getBuiltinMcpScriptPath` in initStorage). Matching therefore has to look at
 * the basename, not the whole argument.
 */
export const BUILTIN_CORE_MCP_FILES = [
  'builtin-mcp-image-gen.js',
  'builtin-mcp-search-skills.js',
  'builtin-mcp-concierge-diag.js',
] as const;

export type BuiltinCoreMcpFile = (typeof BUILTIN_CORE_MCP_FILES)[number];

/**
 * True if `arg` points at one of the first-party bundled stdio servers (#1008).
 *
 * The stored argument is an absolute path, so compare the basename. Split on
 * BOTH separators rather than using `path.basename`: this module is bundled
 * into the standalone stdio servers and deliberately imports nothing, and a
 * Windows path can reach a resolver running with POSIX semantics in tests.
 */
export function isBuiltinCoreMcpArg(arg: string | undefined | null): boolean {
  if (!arg) return false;
  const base = arg.split(/[\\/]/).pop();
  return (BUILTIN_CORE_MCP_FILES as readonly string[]).includes(base ?? '');
}

export function isBuiltinImageGenName(name?: string | null): boolean {
  if (!name) return false;
  return (
    name === BUILTIN_IMAGE_GEN_NAME ||
    BUILTIN_IMAGE_GEN_LEGACY_NAMES.includes(name as (typeof BUILTIN_IMAGE_GEN_LEGACY_NAMES)[number])
  );
}

export function isBuiltinImageGenTransport(transport?: {
  type?: string;
  command?: string;
  args?: string[] | null;
}): boolean {
  if (!transport || transport.type !== 'stdio' || transport.command !== 'node') {
    return false;
  }

  return (transport.args || []).some((arg) => typeof arg === 'string' && arg.includes('builtin-mcp-image-gen.js'));
}

export function isBuiltinSearchSkillsName(name?: string | null): boolean {
  if (!name) return false;
  return name === BUILTIN_SEARCH_SKILLS_NAME;
}

export function isBuiltinSearchSkillsTransport(transport?: {
  type?: string;
  command?: string;
  args?: string[] | null;
}): boolean {
  if (!transport || transport.type !== 'stdio' || transport.command !== 'node') {
    return false;
  }

  return (transport.args || []).some((arg) => typeof arg === 'string' && arg.includes('builtin-mcp-search-skills.js'));
}

export const BUILTIN_CONCIERGE_DIAG_ID = 'concierge-diag';
export const BUILTIN_CONCIERGE_DIAG_NAME = 'wayland-concierge-diag';
export const BUILTIN_CONCIERGE_DIAG_TOOL_NAME = 'wayland_concierge_diag';

// ── Bundled Playwright MCP (browser capability, #465) ────────────────────────
// Unlike the @wayland builtins above (local node scripts), this is the upstream
// npm package `@playwright/mcp` run through the bundled bun (npx->bun). It is
// seeded default-ON so the agent has browser tools out of the box; chromium is
// fetched on first use into a managed dir via PLAYWRIGHT_BROWSERS_PATH.
// `name` mirrors the catalog entry's sanitized name so a manual install dedupes.
export const BUILTIN_PLAYWRIGHT_ID = 'builtin-playwright-mcp';
export const BUILTIN_PLAYWRIGHT_NAME = 'com.microsoft-playwright-mcp';
/** Catalog entry id (src/renderer/mcp-catalog/entries/com.microsoft-playwright-mcp.json). */
export const BUILTIN_PLAYWRIGHT_LIBRARY_ENTRY_ID = 'com.microsoft/playwright-mcp';
/** Pinned to the catalog entry's version so the server and the install use the same package. */
export const BUILTIN_PLAYWRIGHT_VERSION = '0.0.75';
export const BUILTIN_PLAYWRIGHT_PACKAGE = `@playwright/mcp@${BUILTIN_PLAYWRIGHT_VERSION}`;
/**
 * SSRF guardrail (#465, Sean ack): origins the bundled browser must never request
 * — IPv4 link-local (169.254.0.0/16, via wildcard) plus the cloud instance-
 * metadata endpoints that ride it (AWS/Azure/GCP/Oracle/DO `169.254.169.254`,
 * GCP `metadata.google.internal`, Alibaba `100.100.100.200`). Passed to
 * @playwright/mcp via `--blocked-origins` (semicolon-separated). Verified live:
 * a nav to 169.254.169.254 returns net::ERR_BLOCKED_BY_CLIENT. NOTE: Playwright
 * documents this as a guardrail, not a hard boundary (it does not affect
 * redirects) — defense-in-depth, the network layer stays the real boundary.
 */
export const BUILTIN_PLAYWRIGHT_BLOCKED_ORIGINS = [
  'http://169.254.169.254',
  'https://169.254.169.254',
  'http://169.254.*',
  'https://169.254.*',
  'http://metadata.google.internal',
  'https://metadata.google.internal',
  'http://100.100.100.200',
  'https://100.100.100.200',
].join(';');

export function isBuiltinConciergeDiagName(name?: string | null): boolean {
  if (!name) return false;
  return name === BUILTIN_CONCIERGE_DIAG_NAME;
}

export function isBuiltinConciergeDiagTransport(transport?: {
  type?: string;
  command?: string;
  args?: string[] | null;
}): boolean {
  if (!transport || transport.type !== 'stdio' || transport.command !== 'node') {
    return false;
  }

  return (transport.args || []).some((arg) => typeof arg === 'string' && arg.includes('builtin-mcp-concierge-diag.js'));
}
