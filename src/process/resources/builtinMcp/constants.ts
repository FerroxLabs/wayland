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
