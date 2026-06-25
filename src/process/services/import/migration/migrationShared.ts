/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared types + pure parsers for the tool migration importer, used by both the
 * Hermes and OpenClaw source scanners. Kept free of fs/Electron so the parsing
 * is unit-tested directly.
 */

import type { ProviderId } from '@process/providers/types';

/** A provider key found in a source tool, pre-resolved to a Wayland provider. */
export type RawProviderKey = { providerId: ProviderId; value: string; sourceLabel: string };

/** An MCP server entry found in a source tool's config (raw config object). */
export type RawMcpServer = { name: string; config: Record<string, unknown> };

/** Snapshot of what Wayland already has, so a scan can mark items new vs exists. */
export type ExistingState = {
  connectedProviderIds: Set<string>;
  /** Lower-cased MCP server names already present. */
  mcpServerNames: Set<string>;
  hasDefaultModel: boolean;
};

/**
 * Parse a `.env`-style file into a flat map. Handles `KEY=value`, `export KEY=`,
 * surrounding single/double quotes, inline `#` comments on unquoted values, and
 * blank/comment lines. Last value wins on duplicate keys.
 */
export function parseEnvText(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const withoutExport = line.startsWith('export ') ? line.slice(7).trim() : line;
    const eq = withoutExport.indexOf('=');
    if (eq <= 0) continue;
    const key = withoutExport.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = withoutExport.slice(eq + 1).trim();
    const quoted = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted) {
      value = value.slice(1, -1);
    } else {
      const hash = value.indexOf(' #');
      if (hash !== -1) value = value.slice(0, hash).trim();
    }
    out[key] = value;
  }
  return out;
}

/**
 * A short, non-sensitive descriptor of an MCP server config for the preview,
 * e.g. `stdio: npx -y @modelcontextprotocol/server-filesystem` or `http: https://…`.
 * Never echoes header/env values (which can carry tokens).
 */
export function mcpDetail(config: Record<string, unknown>): string {
  const url = config.url;
  if (typeof url === 'string' && url) {
    try {
      const u = new URL(url);
      return `${(config.transport as string) || 'http'}: ${u.protocol}//${u.host}`;
    } catch {
      return 'remote endpoint';
    }
  }
  const command = config.command;
  if (typeof command === 'string' && command) {
    const args = Array.isArray(config.args) ? config.args.filter((a) => typeof a === 'string').slice(0, 3) : [];
    return `stdio: ${[command, ...args].join(' ')}`.slice(0, 80);
  }
  return 'server';
}
