/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP server Doctor check.
 *
 * Each enabled MCP server is reached with the SAME `testMcpConnection` probe the
 * MCP Library "Test" button uses. A server that errors on startup is a real
 * break (its tools never reach the agent), so it FAILs; a server flagged as
 * needing auth WARNs (it is configured but not yet logged in). Disabled servers
 * are skipped — they are not installed to any agent.
 */

import type { IMcpServer } from '@/common/config/storage';
import type { DoctorCheckOutcome } from '../types';

/** The MCP connection test result shape (subset of `McpConnectionTestResult`). */
export type McpTestResult = {
  success: boolean;
  error?: string;
  needsAuth?: boolean;
  tools?: Array<{ name: string }>;
};

/** Dependencies for the MCP check — the server list and the connection probe. */
export type McpCheckDeps = {
  listServers: () => Promise<IMcpServer[]>;
  testConnection: (server: IMcpServer) => Promise<McpTestResult>;
  /**
   * Per-server probe budget in ms. A single server's `testConnection` can hang
   * (it spawns a CLI / opens a socket); without a per-server bound one hung
   * server would consume the whole-check timeout and collapse the result into a
   * single server-less "timed out after 30s" with no clue which server hung
   * (#273). Bounding each probe lets a hung server be named and the others still
   * report their real status. Defaults to 10s.
   */
  perServerTimeoutMs?: number;
};

/** Default per-server probe budget. Three servers at 10s each stay under the runner's 30s. */
const DEFAULT_PER_SERVER_TIMEOUT_MS = 10_000;

/** Sentinel a per-server timeout resolves to, distinct from a real probe error. */
const TIMED_OUT = Symbol('mcp-probe-timeout');

/** Run one server's probe bounded by `timeoutMs`; resolves the timeout sentinel if it hangs. */
async function probeWithTimeout(
  testConnection: (server: IMcpServer) => Promise<McpTestResult>,
  server: IMcpServer,
  timeoutMs: number
): Promise<McpTestResult | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
  });
  try {
    return await Promise.race([testConnection(server), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * MCP servers — every ENABLED server can be reached and loads its tools. FAIL on
 * a server that errors or times out; WARN on a server that needs auth
 * (configured but not logged in). Each server is probed under its own timeout so
 * a single hung server is named rather than collapsing the whole check into one
 * generic timeout (#273). PASS when all enabled servers connect (or none are
 * enabled).
 */
export async function checkMcpServers(deps: McpCheckDeps): Promise<DoctorCheckOutcome> {
  const all = await deps.listServers();
  const enabled = all.filter((server) => server.enabled);
  if (enabled.length === 0) {
    return { status: 'pass', detail: 'No MCP servers are enabled.' };
  }

  const perServerTimeoutMs = deps.perServerTimeoutMs ?? DEFAULT_PER_SERVER_TIMEOUT_MS;
  const errored: string[] = [];
  const timedOut: string[] = [];
  const needAuth: string[] = [];
  let okCount = 0;

  // Probe sequentially: connection tests can spawn CLIs / open sockets, and a
  // burst of parallel spawns is a worse failure mode than a slightly slower run.
  // Each probe is individually bounded so one hung server cannot starve the rest.
  for (const server of enabled) {
    const result = await probeWithTimeout(deps.testConnection, server, perServerTimeoutMs);
    if (result === TIMED_OUT) {
      timedOut.push(server.name);
    } else if (result.success) {
      okCount += 1;
    } else if (result.needsAuth) {
      needAuth.push(server.name);
    } else {
      errored.push(`${server.name}${result.error ? ` (${result.error})` : ''}`);
    }
  }

  // A timeout and a hard error are both "this server did not load" — report them
  // together as a FAIL, but keep the per-server detail (name + reason) so the
  // user knows exactly which server to fix.
  const broken = [
    ...errored,
    ...timedOut.map((name) => `${name} (timed out after ${Math.round(perServerTimeoutMs / 1000)}s)`),
  ];
  if (broken.length > 0) {
    return {
      status: 'fail',
      detail: `${broken.length} of ${enabled.length} enabled MCP server(s) failed to load: ${broken.join(', ')}.`,
      remediation: 'Fix or disable the failing server(s) in Settings → MCP Library → Installed.',
    };
  }
  if (needAuth.length > 0) {
    return {
      status: 'warn',
      detail: `${okCount} MCP server(s) OK; ${needAuth.length} need authentication: ${needAuth.join(', ')}.`,
      remediation: 'Log in to the server(s) from Settings → MCP Library → Installed.',
    };
  }
  return { status: 'pass', detail: `${okCount} enabled MCP server(s) connected.` };
}
