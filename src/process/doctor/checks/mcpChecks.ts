/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP server Doctor check.
 *
 * Each enabled MCP server is reached with the SAME `testMcpConnection` probe the
 * MCP Library "Test" button uses. This proves standalone reachability only; it
 * cannot prove that an active agent session registered or exposed the tools. A
 * server that errors on startup is a real break, so it FAILs; a server flagged
 * as needing auth WARNs. A successful probe also WARNs until session-level
 * receipts exist, preventing Doctor from repeating the Library's false-ready
 * claim. Disabled servers are skipped — they are not installed to any agent.
 *
 * Reachability alone was never the whole question: a server that answers the
 * handshake and publishes an EMPTY tool list is useless to an agent and used to
 * look identical to a healthy one here. The probe already returns the tool list;
 * this check now reads it, names the servers publishing nothing, and reports the
 * total tool count on the way through.
 */

import { redactSecrets } from '@process/utils/secretRedaction';
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

/**
 * Shortest declared value worth masking. Below this a value is not a credential
 * and blanket-replacing it would shred the diagnostic - an `env` of
 * `NODE_ENV=production` or `PORT=3000` would blank the words "production" and
 * "3000" out of the probe's own error text. Matches the `{8,}` floors
 * `redactSecrets` already uses.
 */
const MIN_DECLARED_SECRET_LENGTH = 8;

/**
 * The user-supplied configuration values in `server`'s own declaration that can
 * BE a credential: a stdio server's `env` values and `args`, and an
 * http/sse/streamable_http server's `headers` values - each both whole and
 * unwrapped past a leading `--flag=` / `Bearer ` style prefix.
 *
 * Longest first, so a value that happens to contain another is replaced whole
 * rather than being half-substituted from the inside out.
 */
function declaredSecretValues(server: IMcpServer): string[] {
  const transport = server.transport as
    | { env?: Record<string, string>; headers?: Record<string, string>; args?: string[] }
    | undefined;
  if (!transport) return [];
  const declared = [
    ...Object.values(transport.env ?? {}),
    ...Object.values(transport.headers ?? {}),
    ...(transport.args ?? []),
  ].filter((value): value is string => typeof value === 'string');

  const values: string[] = [];
  for (const value of declared) {
    values.push(value);
    // Also the right-hand side of a `--flag=value` / `Key: value` style token.
    // A credential is routinely declared WRAPPED - `--api-key=<secret>` in `args`,
    // `Bearer <secret>` in a header - and the server then echoes the bare secret
    // on its own ("invalid key: <secret>"). Matching only the whole declared
    // token would miss that, which a canary caught here rather than in
    // production. Longest-first ordering below still replaces the wrapped form
    // whole when the wrapped form is what was echoed.
    const separator = value.search(/[=:\s]/);
    if (separator !== -1) values.push(value.slice(separator + 1).trim());
  }

  return values.filter((value) => value.length >= MIN_DECLARED_SECRET_LENGTH).toSorted((a, b) => b.length - a.length);
}

/**
 * Mask any value the user themselves put in this server's declaration wherever
 * it appears in the probe's output.
 *
 * This is the STRUCTURAL half of the mcp fix, and it is why this sink is not
 * left waiting on #1026: a literal string replacement pattern-matches nothing,
 * so it is immune to every shape a credential can take. A stdio server that dies
 * with `AZURE_OPENAI_API_KEY=<value>` on stderr has that stderr appended to the
 * user-facing error as `Server output: ...` (`McpProtocol.ts`), and the value is
 * masked here because it came out of `transport.env`, not because it looked like
 * anything.
 *
 * `split`/`join` rather than a built regex: the values are arbitrary user text
 * and a missed escape would be a silent no-match, i.e. a silent leak.
 *
 * It does NOT cover the OAuth bearer `McpService.attachOAuthToken` injects at
 * probe time - that token is never in the stored declaration this check reads.
 * `redactSecrets`' `Bearer` rule is what covers that one, which is why both run.
 */
function redactDeclaredValues(text: string, server: IMcpServer): string {
  let out = text;
  for (const value of declaredSecretValues(server)) {
    out = out.split(value).join('[redacted]');
  }
  return out;
}

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
 * generic timeout (#273). WARN when all standalone probes succeed because this
 * check has no active-session publication or ToolSearch receipt. PASS only when
 * none are enabled.
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
  /** Connected, but published an empty tool list. See the toolless branch below. */
  const toolless: string[] = [];
  let okCount = 0;
  let toolCount = 0;

  // Probe every server CONCURRENTLY, each under its own timeout. A sequential
  // run sums the per-server budgets: with the dozen-plus servers this check
  // exists to diagnose (#273), several hung probes at `perServerTimeoutMs` each
  // would blow past the runner's 30s whole-check budget and collapse right back
  // into the opaque "timed out after 30s" with no per-server detail. Bounding the
  // total to ~one per-server timeout regardless of count is the only way to keep
  // the partial diagnostics the user actually needs. Result order matches
  // `enabled` so the report is stable.
  const results = await Promise.all(
    enabled.map((server) => probeWithTimeout(deps.testConnection, server, perServerTimeoutMs))
  );
  for (let i = 0; i < enabled.length; i += 1) {
    const server = enabled[i];
    const result = results[i];
    if (result === TIMED_OUT) {
      timedOut.push(server.name);
    } else if (result.success) {
      okCount += 1;
      // `tools` absent and `tools: []` are NOT the same thing, and conflating
      // them would invent a failure. Absent means this probe did not report a
      // tool list at all; only an explicitly empty list means "connected and
      // published nothing".
      if (Array.isArray(result.tools)) {
        if (result.tools.length === 0) toolless.push(server.name);
        else toolCount += result.tools.length;
      }
    } else if (result.needsAuth) {
      needAuth.push(server.name);
    } else {
      // `result.error` is FREE-FORM text from the probe: an HTTP response body,
      // or a spawned server's stderr. The declaration being probed carries the
      // server's `env` (API keys) and `headers` (an `Authorization:` value, plus
      // the OAuth bearer `McpService.attachOAuthToken` adds), so a 401 body or an
      // stderr echo can hand a credential straight into a Doctor report that
      // exists to be copied to support - the same class of exposure as
      // GHSA-2g2m-r86j-jg6h.
      //
      // TWO layers, because the probe TEXT has no structure but the DECLARATION
      // does. `redactDeclaredValues` masks the user's own configured values by
      // literal match, which needs no pattern and so is immune to #1026;
      // `redactSecrets` then catches credentials that were never in the
      // declaration - notably the injected OAuth bearer, and anything the server
      // volunteers about a third party.
      errored.push(
        `${server.name}${result.error ? ` (${redactSecrets(redactDeclaredValues(result.error, server))})` : ''}`
      );
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
  // Connected and serving nothing. This used to be invisible: the success branch
  // counted the server and threw `result.tools` away, so a connector that
  // answered the handshake and published an empty tool list was indistinguishable
  // from a healthy one. That is not hypothetical - tvcontrol 2.2.1 shipped a
  // `bin` pointing at the CLI router, so `npx @ferroxlabs/tvcontrol` answered an
  // MCP `initialize` with "Usage: tv <command>", and a later zod-4 `z.record`
  // fault took its whole tool list out while the connection stayed green. A
  // server with no tools cannot do anything an agent can call, so name it.
  // Accumulated, NOT early-returned. Returning on the first condition loses the
  // others, and these co-occur in the ordinary case rather than the exotic one:
  // most of the catalog authenticates, so "one server needs a login" is the
  // steady state. An early return on `toolless` swallowed the login requirement
  // entirely AND told the user to reinstall a server that only needed signing in.
  const notes: string[] = [];
  const fixes: string[] = [];
  if (toolless.length > 0) {
    notes.push(
      `${toolless.length} of ${enabled.length} enabled MCP server(s) connected but published no tools: ${toolless.join(', ')}.`
    );
    fixes.push('Update or reinstall the server(s) with no tools — a server publishing none cannot be used.');
  }
  if (needAuth.length > 0) {
    notes.push(`${needAuth.length} need authentication: ${needAuth.join(', ')}.`);
    fixes.push('Log in to the server(s) that need it.');
  }
  if (notes.length > 0) {
    return {
      status: 'warn',
      detail: `${okCount} MCP server(s) OK. ${notes.join(' ')}`,
      remediation: `${fixes.join(' ')} Both from Settings → MCP Library → Installed.`,
    };
  }
  return {
    status: 'warn',
    detail: `${okCount} enabled MCP server(s) reachable in a standalone probe${
      toolCount > 0 ? `, publishing ${toolCount} tool(s)` : ''
    }; active-chat tools are not verified.`,
    remediation: 'Start a fresh chat with the connector selected, then verify its tools in that chat.',
  };
}
