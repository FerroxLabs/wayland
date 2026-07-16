/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import { canonicalMcpServerName, configSafeMcpServerName } from '@/common/mcp';
import { classifyMcpHttpUrl } from '@/common/mcp/mcpUrlSafety';

/**
 * MCP server names that are interpolated into per-CLI agent commands must be a
 * conservative identifier so they can never break out of an argv element or be
 * abused by a CLI that re-parses the name.
 */
const SAFE_MCP_NAME = /^[A-Za-z0-9_.-]+$/;

/**
 * Coerce an arbitrary MCP server name into the conservative identifier that
 * {@link validateMcpServer} (and every per-CLI agent config writer) requires.
 *
 * Catalog ids carry characters the agent CLIs reject - notably the reverse-DNS
 * slash in `com.slack/slack-mcp`. The renderer install flow sanitizes at
 * add-time, but a server can reach the sync path with an unsanitized name (older
 * installs, JSON import, one-click). Applying the SAME transform at the sync /
 * remove chokepoint guarantees the agent-config key is always valid and that
 * sync and remove derive the identical key, so a server can be cleanly removed.
 *
 * Any character outside `[A-Za-z0-9_.-]` becomes `-`. Result always satisfies
 * SAFE_MCP_NAME for any non-empty input.
 */
export function sanitizeMcpServerName(name: string): string {
  return configSafeMcpServerName(name);
}

/**
 * Stricter still: a name safe for CLI agents that reject the dot the app's own
 * {@link SAFE_MCP_NAME} tolerates. Claude Code ("Names can only contain letters,
 * numbers, hyphens, and underscores") and Codex ("use letters, numbers, '-',
 * '_'") both reject dotted names, so a catalog id like
 * `com.upstash/context7-mcp` (sanitized to `com.upstash-context7-mcp`) fails
 * `claude mcp add` / `codex mcp add` with exit 1. Collapse every char outside
 * `[A-Za-z0-9_-]` (dots included) to `-`. Apply at the claude/codex add AND
 * remove chokepoints so both derive the identical key and a server can be
 * cleanly removed. Result always matches `^[A-Za-z0-9_-]+$` for non-empty input.
 */
export function cliSafeMcpServerName(name: string): string {
  // Same transform as the renderer-shared canonical form (single source of
  // truth in @/common/mcp), so the install-status UI and the agent config
  // writers can never disagree on a server's identity.
  return canonicalMcpServerName(name);
}

/**
 * Environment variable KEYS that ride into per-CLI agent argv (e.g. as
 * `-e KEY=VALUE` / `--env KEY=VALUE`) must be a POSIX-style identifier so they
 * cannot smuggle a leading `-` (option) or argv-breaking characters into the
 * spawned command line (RT-B2-01 / RT-B2-03, argument-injection).
 */
const SAFE_ENV_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Return true if the string contains any C0 control char (0x00-0x1f), DEL
 * (0x7f), or a C1 control char (0x80-0x9f). Implemented via char codes rather
 * than a control-char regex literal so the source carries no raw control bytes.
 */
function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      return true;
    }
  }
  return false;
}

/**
 * SSRF guard for a renderer-supplied MCP URL.
 *
 * Deliberately a NARROW deny-list, NOT a private-network blanket block: local
 * MCP servers over http (`http://localhost:3000`, `http://127.0.0.1:...`,
 * `http://192.168.x.x`, hostnames) are legitimate and MUST keep working. We
 * reject only the cloud-metadata SSRF targets: IPv4 link-local `169.254.0.0/16`
 * (incl. `169.254.169.254`), IPv6 link-local `fe80::/10`, the EC2 IMDSv6
 * address `fd00:ec2::254`, IPv4-mapped / NAT64 forms that translate to those,
 * and the metadata discovery hostnames.
 *
 * Scheme validation (http/https only) is performed by the caller.
 *
 * @throws {Error} when the URL host is a blocked metadata / link-local target.
 */
function assertSafeMcpUrl(serverName: string, url: URL): void {
  const result = classifyMcpHttpUrl(url.toString());
  if (result.safe === false) throw new Error(`Invalid MCP server URL for "${serverName}": ${result.detail}`);
}

/**
 * Validate a single MCP environment-variable pair before it is pushed into a
 * per-CLI agent's argv as `-e KEY=VALUE` / `--env KEY=VALUE` (RT-B2-01 /
 * RT-B2-03). Because spawn runs with `shell:false`, this is argument-injection
 * rather than shell-injection - but a value such as `--output-dir=/evil` still
 * rides into argv as its own option, so it is rejected here.
 *
 * Rejects:
 *  - keys that are not POSIX identifiers (`^[A-Za-z_][A-Za-z0-9_]*$`);
 *  - values that begin with `-` (would be parsed as a CLI option);
 *  - values containing control characters (newline, NUL, etc.) that can break
 *    the argv element or the downstream CLI config file.
 *
 * @throws {Error} when the key or value is unsafe.
 */
export function validateMcpEnvEntry(serverName: string, key: string, value: string): void {
  // SAFE_ENV_KEY already excludes whitespace, control chars and any leading
  // `-`, so the key needs no separate control-char check.
  if (!SAFE_ENV_KEY.test(key)) {
    throw new Error(`Invalid MCP env key for "${serverName}": "${key}" must match ^[A-Za-z_][A-Za-z0-9_]*$`);
  }
  if (value.startsWith('-')) {
    throw new Error(
      `Invalid MCP env value for "${serverName}" key "${key}": values may not begin with "-" (argument injection)`
    );
  }
  if (hasControlChar(value)) {
    throw new Error(`Invalid MCP env value for "${serverName}" key "${key}": value contains control characters`);
  }
}

/**
 * Validate every entry in an MCP env record. No-op for `undefined` / empty.
 *
 * @throws {Error} on the first unsafe entry.
 */
export function validateMcpEnv(serverName: string, env: Record<string, string> | undefined): void {
  if (!env) {
    return;
  }
  for (const [key, value] of Object.entries(env)) {
    validateMcpEnvEntry(serverName, key, String(value ?? ''));
  }
}

/**
 * Validate an MCP server before it is synced to any per-CLI agent.
 *
 * This is the single pre-sync guard for the command-injection surface
 * (SEC-MCP-01): even though every agent now uses argv arrays (`shell:false`),
 * a malformed name or non-http(s) URL is rejected up front as defense in depth
 * and to keep CLI behaviour predictable across Claude/Gemini/Qwen/Codex/etc.
 *
 * Additionally guards:
 *  - stdio `env` keys/values against argument-injection (RT-B2-01 / RT-B2-03);
 *  - remote transport URLs against cloud-metadata SSRF (RT-B2-05). Local MCP
 *    URLs (localhost / 127.0.0.1 / LAN) are intentionally still allowed.
 *
 * @param server The MCP server to validate.
 * @throws {Error} If the name, env, or remote transport URL is unsafe.
 */
export function validateMcpServer(server: IMcpServer): void {
  if (!SAFE_MCP_NAME.test(server.name)) {
    throw new Error(`Invalid MCP server name "${server.name}": only letters, digits, '_', '.', and '-' are allowed`);
  }

  const { transport } = server;

  if (transport.type === 'stdio') {
    validateMcpEnv(server.name, transport.env);
  }

  if (transport.type === 'sse' || transport.type === 'http' || transport.type === 'streamable_http') {
    let parsed: URL;
    try {
      parsed = new URL(transport.url);
    } catch {
      throw new Error(`Invalid MCP server URL for "${server.name}": ${transport.url}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(
        `Invalid MCP server URL for "${server.name}": only http(s) URLs are allowed, got ${parsed.protocol}`
      );
    }
    assertSafeMcpUrl(server.name, parsed);
  }
}
