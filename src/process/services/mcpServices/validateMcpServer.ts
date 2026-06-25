/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import { canonicalMcpServerName } from '@/common/mcp';

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
  return name.replace(/[^A-Za-z0-9_.-]/g, '-');
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
 * Cloud-metadata / internal-discovery hostnames that must never be reachable
 * via a renderer-supplied MCP URL. Covers AWS / GCP / Azure metadata services.
 * Compared case-insensitively against the parsed URL hostname.
 *
 * Mirrors (deliberately, not imported) the metadata-only blocklist used by the
 * modelBridge base_url SSRF guard so the two stay consistent without coupling.
 */
const BLOCKED_METADATA_HOSTNAMES = new Set(['metadata.google.internal', 'metadata.goog', 'metadata']);

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
 * Strip IPv6 zone id and surrounding brackets so the address can be inspected.
 * `[fe80::1%25eth0]` -> `fe80::1`.
 */
function normalizeIpv6Host(hostname: string): string {
  let host = hostname;
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }
  const zoneIdx = host.indexOf('%');
  if (zoneIdx !== -1) {
    host = host.slice(0, zoneIdx);
  }
  return host.toLowerCase();
}

/**
 * Return true if a bare IPv4 dotted-quad is in the blocked link-local /
 * metadata range `169.254.0.0/16` (incl. `169.254.169.254`). Loopback,
 * RFC1918/LAN and public addresses are intentionally NOT blocked so local MCP
 * servers keep working.
 */
function isBlockedIpv4(addr: string): boolean {
  return /^169\.254\.\d{1,3}\.\d{1,3}$/.test(addr);
}

/**
 * Decode an IPv4 address embedded in an IPv4-mapped / NAT64 IPv6 literal, if
 * present. Node's URL parser normalizes the dotted-quad tail to hex
 * (`[::ffff:169.254.169.254]` -> `::ffff:a9fe:a9fe`), so we accept both forms.
 *
 * @returns the embedded IPv4 dotted-quad, the `'mapped'` marker if a mapping
 *   prefix was present but the tail couldn't be decoded, or `null` otherwise.
 */
function decodeEmbeddedIpv4(ipv6: string): string | 'mapped' | null {
  let tail: string | null = null;
  if (ipv6.startsWith('::ffff:')) {
    tail = ipv6.slice('::ffff:'.length);
  } else if (ipv6.startsWith('64:ff9b:1::')) {
    tail = ipv6.slice('64:ff9b:1::'.length);
  } else if (ipv6.startsWith('64:ff9b::')) {
    tail = ipv6.slice('64:ff9b::'.length);
  } else {
    return null;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(tail)) {
    return tail;
  }
  const hextets = tail.split(':');
  if (hextets.length === 2 && hextets.every((h) => /^[0-9a-f]{1,4}$/.test(h))) {
    const hi = parseInt(hextets[0], 16);
    const lo = parseInt(hextets[1], 16);
    return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
  }
  return 'mapped';
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
  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_METADATA_HOSTNAMES.has(hostname)) {
    throw new Error(
      `Invalid MCP server URL for "${serverName}": host "${url.hostname}" is a blocked metadata endpoint`
    );
  }

  if (isBlockedIpv4(hostname)) {
    throw new Error(
      `Invalid MCP server URL for "${serverName}": host "${url.hostname}" is in the blocked link-local metadata range`
    );
  }

  const ipv6 = normalizeIpv6Host(url.hostname);
  if (ipv6.includes(':')) {
    const firstHextet = ipv6.split(':')[0];
    if (/^fe[89ab][0-9a-f]$/.test(firstHextet)) {
      throw new Error(
        `Invalid MCP server URL for "${serverName}": host "${url.hostname}" is an IPv6 link-local address`
      );
    }
    if (ipv6 === 'fd00:ec2::254') {
      throw new Error(
        `Invalid MCP server URL for "${serverName}": host "${url.hostname}" is an IPv6 metadata endpoint`
      );
    }
    const embedded = decodeEmbeddedIpv4(ipv6);
    if (embedded !== null) {
      if (embedded !== 'mapped' && isBlockedIpv4(embedded)) {
        throw new Error(
          `Invalid MCP server URL for "${serverName}": host "${url.hostname}" maps to blocked metadata address ${embedded}`
        );
      }
      throw new Error(
        `Invalid MCP server URL for "${serverName}": host "${url.hostname}" is an IPv4-mapped/translated IPv6 address`
      );
    }
  }
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
