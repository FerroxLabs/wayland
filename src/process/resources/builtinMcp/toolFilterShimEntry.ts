/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #998 - the executable half of the per-tool filtering shim.
 *
 * Spawned in the real MCP server's place. Invoked as:
 *
 *   node builtin-mcp-tool-filter.js --allow alpha --allow beta -- <command> [args...]
 *
 * The engine talks to THIS process over stdio; this process talks to the real
 * server over its own stdio. Everything relays untouched except the two
 * exceptions {@link createToolFilter} owns.
 *
 * Bundled by `scripts/build-mcp-servers.js` into a self-contained CJS file, so
 * it imports nothing outside node builtins and its one sibling module - a
 * packaged build runs it from `app.asar.unpacked` where there is no ASAR
 * require() patching.
 *
 * FAILURE POSTURE. Upstream death kills this process with the upstream's own
 * exit code, so the engine sees "the server is gone" - exactly what it would
 * see on a direct connection, and what its reconnect logic keys on. A shim that
 * outlived its server and answered errors forever would be strictly worse,
 * because the engine would never retry. A malformed argv is a startup failure,
 * not a pass-through: refusing to start cannot leak tools, while starting
 * unfiltered would.
 */

import { spawn } from 'node:child_process';

import { createToolFilter, type JsonRpcMessage } from './toolFilterShim';

export type ShimArgv = { allowed: string[]; command: string; args: string[] };

/**
 * Parse `--allow <tool> [--allow <tool> ...] -- cmd args...`.
 *
 * One tool per flag, NOT a delimited list. A comma-joined list would be a
 * fail-OPEN bug: MCP does not forbid a comma in a tool name, and a tool called
 * `a,b` would split into two entries, admitting `a` and `b` when neither was
 * ever allowed. There is no delimiter here to corrupt.
 *
 * The `--` separator is load-bearing: everything after it is the upstream argv
 * and is never re-interpreted. Spawning uses an argv array with no shell, so a
 * server command containing shell metacharacters is inert.
 *
 * Returns null when the shape is wrong. The caller must then FAIL, never fall
 * back to running unfiltered.
 */
export function parseShimArgv(argv: readonly string[]): ShimArgv | null {
  const sep = argv.indexOf('--');
  if (sep === -1) return null;
  const head = argv.slice(0, sep);
  const tail = argv.slice(sep + 1);
  if (tail.length === 0) return null;

  const allowed: string[] = [];
  for (let i = 0; i < head.length; i += 1) {
    if (head[i] !== '--allow') continue;
    const name = head[i + 1];
    // A trailing `--allow` with no value is a malformed invocation, not an
    // empty entry to skip over.
    if (name === undefined) return null;
    if (name.length > 0) allowed.push(name);
    i += 1;
  }
  // An empty allowlist is a caller bug - the app withholds the connector
  // entirely in that case, so the shim should never be spawned for it.
  if (allowed.length === 0) return null;

  return { allowed, command: tail[0], args: tail.slice(1) };
}

/**
 * Split a stdio stream into newline-delimited JSON messages.
 *
 * MCP stdio framing is one JSON value per line. A line that does not parse is
 * dropped rather than relayed: forwarding a half-frame would corrupt the peer's
 * parser, and there is nothing useful to pass on.
 */
export function createLineReader(onMessage: (message: JsonRpcMessage) => void): (chunk: Buffer | string) => void {
  let buffer = '';
  return (chunk) => {
    buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    let index = buffer.indexOf('\n');
    while (index !== -1) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (line.length > 0) {
        try {
          const parsed: unknown = JSON.parse(line);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            onMessage(parsed as JsonRpcMessage);
          }
        } catch {
          // Not a frame we can act on; dropping beats corrupting the peer.
        }
      }
      index = buffer.indexOf('\n');
    }
  };
}

/* c8 ignore start - process wiring is covered by the packaged smoke, not unit tests */
export function main(argv: readonly string[] = process.argv.slice(2)): void {
  const parsed = parseShimArgv(argv);
  if (!parsed) {
    process.stderr.write(
      '[wayland-tool-filter] usage: --allow <tool> [--allow <tool> ...] -- <command> [args...]\n' +
        '[wayland-tool-filter] refusing to start; running unfiltered would expose tools the user switched off\n'
    );
    process.exit(2);
    return;
  }

  const child = spawn(parsed.command, parsed.args, { stdio: ['pipe', 'pipe', 'inherit'], shell: false });

  const write = (stream: NodeJS.WritableStream) => (message: JsonRpcMessage) => {
    stream.write(`${JSON.stringify(message)}\n`);
  };
  const filter = createToolFilter({
    allowed: parsed.allowed,
    sendToEngine: write(process.stdout),
    sendToUpstream: write(child.stdin),
  });

  process.stdin.on('data', createLineReader(filter.fromEngine));
  child.stdout.on('data', createLineReader(filter.fromUpstream));

  // Upstream death is propagated, never swallowed.
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
  child.on('error', (err) => {
    process.stderr.write(`[wayland-tool-filter] upstream failed to start: ${err.message}\n`);
    process.exit(1);
  });
  process.stdin.on('end', () => child.stdin.end());
}

if (require.main === module) main();
/* c8 ignore stop */
