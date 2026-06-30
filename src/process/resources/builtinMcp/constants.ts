/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
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
