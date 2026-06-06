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

  return (transport.args || []).some(
    (arg) => typeof arg === 'string' && arg.includes('builtin-mcp-search-skills.js')
  );
}
