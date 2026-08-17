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
 * Shortest `env`/`headers` value worth masking.
 *
 * A floor is needed at all because a literal replacement is blind: an `env` of
 * `DEBUG=1` would otherwise blank every "1" in the probe's own error text, which
 * destroys the diagnostic rather than protecting anything. But the first attempt
 * set it to 8 and that was wrong in BOTH directions, proved by execution in a
 * cross-audit: `DB_PASSWORD=hunter7` and `PIN=9182` sailed straight through
 * (`redactSecrets` shares the same `{8,}` floor, so nothing caught them), while
 * whole `args` were being masked and turned the two commonest MCP failures into
 * `GET https://registry.npmjs.org/[redacted]` and `scandir '[redacted]'`.
 *
 * 4 is the compromise, and it only applies to `env` and `headers`, where a short
 * value is far likelier to be a credential than a word the diagnostic needs.
 * `args` are handled separately below and never masked whole.
 */
const MIN_DECLARED_SECRET_LENGTH = 4;

/**
 * Split a declared value at EVERY `=`, `:` or whitespace run and return each
 * suffix, longest first, plus the trimmed original.
 *
 * A credential is routinely declared WRAPPED, and one unwrap is not enough:
 * `--header` `Authorization: Bearer <secret>` is the documented `mcp-remote`
 * shape, and reaching `<secret>` from it takes two hops (past `:`, then past the
 * space after `Bearer`). A single-pass unwrap stopped at `Bearer <secret>` and
 * left the bare token unmasked whenever the server echoed only that - found by
 * execution, not review. The trim matters for the same reason: an `env` value
 * with a trailing space is legal (`validateMcpEnvEntry` only rejects <= 0x1f), and
 * the untrimmed original never matches the echoed token.
 */
function unwrapVariants(value: string): string[] {
  const variants: string[] = [];
  let rest = value.trim();
  variants.push(rest);
  // Bounded by the number of separators, so this cannot loop unexpectedly.
  for (;;) {
    const separator = rest.search(/[=:\s]/);
    if (separator === -1) break;
    rest = rest.slice(separator + 1).trim();
    if (rest.length === 0) break;
    variants.push(rest);
  }
  return variants;
}

/**
 * Every user-supplied string in `server`'s own declaration that can BE a
 * credential, longest first so an overlapping value is replaced whole rather
 * than half-substituted from the inside out.
 *
 * The three sources are deliberately NOT treated alike:
 *
 *  - `env` values and `headers` values are masked WHOLE (and unwrapped), subject
 *    only to {@link MIN_DECLARED_SECRET_LENGTH}. These are the credential slots.
 *  - `url` is included because a hosted MCP endpoint routinely carries its token
 *    IN THE URL - path-embedded is the standard shape for Zapier, Smithery and
 *    Composio - and undici's own error text echoes the URL, as does a DNS
 *    failure's `getaddrinfo`. Missing this was a live leak.
 *  - `args` contribute ONLY their unwrapped remainder past a separator, never the
 *    whole argument. This is the FF-6 line: masking whole args covered
 *    `--api-key=<v>` but also masked `@modelcontextprotocol/server-filesystem`
 *    and `/Users/alice/Documents`, which are exactly the strings the two
 *    commonest failures (wrong package, missing directory) need to stay readable.
 *
 * ACCEPTED LIMITS of literal matching, not oversights: a case-folded echo, a
 * URL-encoded echo, or a value glued to a short flag with no separator
 * (`-k<secret>`) will not match. Chasing those means pattern-matching, which is
 * the fragility this exists to avoid.
 */
function asStrings(values: unknown[]): string[] {
  return values.filter((value): value is string => typeof value === 'string');
}

function declaredSecretValues(server: IMcpServer): string[] {
  const transport = server.transport as
    | { env?: Record<string, string>; headers?: Record<string, string>; args?: string[]; url?: string }
    | undefined;
  if (!transport) return [];

  const values: string[] = [];
  // Credential slots: whole value, plus every unwrapped suffix.
  for (const value of [
    ...asStrings(Object.values(transport.env ?? {})),
    ...asStrings(Object.values(transport.headers ?? {})),
    ...asStrings([transport.url]),
  ]) {
    values.push(...unwrapVariants(value));
  }
  // Arguments: the remainder past a separator only, so paths and package names
  // survive intact.
  for (const arg of asStrings(transport.args ?? [])) {
    values.push(...unwrapVariants(arg).slice(1));
  }

  return values.filter((value) => value.length >= MIN_DECLARED_SECRET_LENGTH).toSorted((a, b) => b.length - a.length);
}

/**
 * Mask any value the user themselves put in this server's declaration wherever
 * it appears in the probe's output.
 *
 * This is the STRUCTURAL half of the mcp fix, and it is why this sink does not
 * wait on #1026: a literal string replacement pattern-matches nothing, so no
 * credential SHAPE can slip past it. A stdio server that dies with
 * `AZURE_OPENAI_API_KEY=<value>` on stderr has that stderr appended to the
 * user-facing error as `Server output: ...` (`McpProtocol.ts`), and the value is
 * masked because it came out of `transport.env`, not because it looked like
 * anything.
 *
 * `split`/`join` rather than a built regex: the values are arbitrary user text
 * and a missed escape would be a silent no-match, i.e. a silent leak.
 *
 * Sound only because the STORED declaration is what actually gets spawned for
 * these fields: `normalizeMcpServerForSpawn` rewrites the filesystem server's
 * directory arguments and nothing else, and in particular does not expand
 * `${TOKEN}` in a url or header.
 */
function redactDeclaredValues(text: string, server: IMcpServer): string {
  let out = text;
  for (const value of declaredSecretValues(server)) {
    out = out.split(value).join('[redacted]');
  }
  return out;
}

/**
 * Identify a server in a Doctor detail by its APP-GENERATED id, never by the
 * user-authored `server.name`.
 *
 * `name` is free-form user text: the MCP Library's Add Custom flow takes it
 * verbatim, and a JSON import takes whatever the file says. So a credential
 * pasted into that field becomes a line in a report the Doctor panel offers to
 * copy (GHSA-2g2m-r86j-jg6h). No scrubber closes that - a bare credential in a
 * name carries no label, no assignment and no recognisable prefix, so it matches
 * no rule at all [verified by execution: `redactSecrets` returns a bare 32-hex
 * name untouched]. It is the same defect, and the same fix, as the conversation
 * name in `doctor/workspaceInventory.ts`.
 *
 * All FOUR branches label through here (errored, needsAuth, toolless, timedOut).
 * Three of them previously rendered `name` raw, which meant the fix on one branch
 * would have been worth nothing.
 *
 * `id` is app-generated at every creation path: both `handleAddMcpServer` and the
 * library install in `useMcpServerCRUD` mint `mcp_<randomUUID>`, and the type they
 * accept is `Omit<IMcpServer, 'id' | ...>` so an imported declaration cannot carry
 * its own [verified: `newMcpServerId` is the only assignment of this field].
 */
function doctorServerLabel(server: IMcpServer): string {
  return server.id;
}

/** Sentinel a per-server timeout resolves to, distinct from a real probe error. */
const TIMED_OUT = Symbol('mcp-probe-timeout');

/**
 * Run one server's probe bounded by `timeoutMs`; resolves the timeout sentinel if
 * it hangs, and converts a THROWN probe into an ordinary failed result.
 *
 * That catch is security-load-bearing, not tidiness. `testMcpConnection` calls
 * `validateMcpServer` synchronously before it ever spawns anything, and that
 * validator throws `Invalid MCP server URL for "<name>": <url>` carrying the RAW
 * url. Without a catch the rejection escaped `Promise.all`, escaped
 * `checkMcpServers` entirely, and surfaced through the runner's catch-all - which
 * runs `redactSecrets` but knows nothing about this server's declaration. So the
 * whole declaration-masking fix was BYPASSED for exactly the servers most likely
 * to be malformed: stored declarations from older installs and JSON imports that
 * predate validation. Proved end to end through `runDoctor`.
 *
 * It also stops one malformed server collapsing every other server's detail into
 * a single thrown-error line.
 */
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
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
      timedOut.push(doctorServerLabel(server));
    } else if (result.success) {
      okCount += 1;
      // `tools` absent and `tools: []` are NOT the same thing, and conflating
      // them would invent a failure. Absent means this probe did not report a
      // tool list at all; only an explicitly empty list means "connected and
      // published nothing".
      if (Array.isArray(result.tools)) {
        if (result.tools.length === 0) toolless.push(doctorServerLabel(server));
        else toolCount += result.tools.length;
      }
    } else if (result.needsAuth) {
      needAuth.push(doctorServerLabel(server));
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
      // declaration.
      //
      // RESIDUAL, stated rather than papered over: the OAuth bearer
      // `McpService.attachOAuthToken` injects at probe time is NOT in the stored
      // declaration this check reads [verified], so literal masking cannot see
      // it, and `redactSecrets` only catches it when the echo carries the literal
      // `Bearer ` prefix. `"invalid token: Bearer <opaque>"` is masked;
      // `"invalid token: <opaque>"` is NOT. Closing that needs the probe-time
      // authed server threaded back to here, which is a change to the
      // `testConnection` contract rather than to this check.
      errored.push(
        `${doctorServerLabel(server)}${
          result.error ? ` (${redactSecrets(redactDeclaredValues(result.error, server))})` : ''
        }`
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
