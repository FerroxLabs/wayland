/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #998 - a STRICT SUBSET of a connector's tools must actually reach the engine.
 *
 * The per-tool switches are honoured on the legacy codex and gemini backends by
 * a client-side allowlist. They are INERT on the two backends that matter now,
 * ACP and Wayland Core, because the host-to-engine wire carries no per-tool
 * field: `add_mcp_server` carries exactly name/transport/command/args/env/url/
 * headers/allow_local, and a search of the whole contract corpus for
 * allowed_tools / enabled_tools / tool_allowlist returns nothing. The engine
 * connects to the MCP server ITSELF and therefore sees every tool it exposes.
 *
 * The all-off case is already solved by withholding the connector outright. A
 * strict subset cannot be expressed that way.
 *
 * So Desktop interposes: the engine is handed a descriptor pointing at OUR
 * shim, and the shim connects to the real server and re-exports only the
 * allowed subset. This turns the subset from UI state the engine is asked to
 * respect into a process boundary it cannot cross - it never holds the real
 * server's descriptor. That is fail-closed by construction.
 *
 * These tests cover the message layer, which is where every correctness
 * requirement lives. The relay is deliberately a pipe with two exceptions:
 * `tools/list` results are filtered, disallowed `tools/call` requests are
 * refused without ever reaching upstream, and everything else - notifications,
 * progress, cancellation, resources, prompts - passes through untouched and in
 * order.
 */

import { describe, expect, it } from 'vitest';

import { createToolFilter } from '../../../../src/process/resources/builtinMcp/toolFilterShim';
import { createLineReader, parseShimArgv } from '../../../../src/process/resources/builtinMcp/toolFilterShimEntry';

type Msg = Record<string, unknown>;

/** Drive a filter with recorded sinks so each direction can be asserted. */
function harness(allowed: string[]) {
  const toEngine: Msg[] = [];
  const toUpstream: Msg[] = [];
  const filter = createToolFilter({
    allowed,
    sendToEngine: (m) => toEngine.push(m as Msg),
    sendToUpstream: (m) => toUpstream.push(m as Msg),
  });
  return { filter, toEngine, toUpstream };
}

const listResult = (id: number, names: string[]): Msg => ({
  jsonrpc: '2.0',
  id,
  result: { tools: names.map((name) => ({ name, description: `${name} does a thing` })) },
});

describe('createToolFilter - #998 strict per-tool subset', () => {
  it('filters tools/list down to the allowed subset', () => {
    const h = harness(['alpha', 'gamma']);
    h.filter.fromEngine({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    h.filter.fromUpstream(listResult(1, ['alpha', 'beta', 'gamma', 'delta']));

    const result = h.toEngine.at(-1)?.result as { tools: { name: string }[] };
    expect(result.tools.map((t) => t.name)).toEqual(['alpha', 'gamma']);
  });

  it('does not invent a tool the server never offered', () => {
    const h = harness(['alpha', 'never-existed']);
    h.filter.fromEngine({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    h.filter.fromUpstream(listResult(1, ['alpha', 'beta']));

    const result = h.toEngine.at(-1)?.result as { tools: { name: string }[] };
    expect(result.tools.map((t) => t.name)).toEqual(['alpha']);
  });

  it('refuses a disallowed tools/call WITHOUT forwarding it upstream', () => {
    const h = harness(['alpha']);
    h.filter.fromEngine({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'beta', arguments: {} } });

    // The real server never sees it - that is the enforcement boundary.
    expect(h.toUpstream).toEqual([]);
    const reply = h.toEngine.at(-1) as Msg;
    expect(reply.id).toBe(7);
    expect(reply.error).toBeDefined();
    expect(JSON.stringify(reply.error)).toContain('beta');
  });

  it('forwards an allowed tools/call untouched', () => {
    const h = harness(['alpha']);
    const call = { jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'alpha', arguments: { x: 1 } } };
    h.filter.fromEngine(call);

    expect(h.toUpstream).toEqual([call]);
    expect(h.toEngine).toEqual([]);
  });

  it('passes initialize through in BOTH directions with serverInfo verbatim', () => {
    const h = harness(['alpha']);
    const init = { jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2026-03-26' } };
    h.filter.fromEngine(init);
    expect(h.toUpstream).toEqual([init]);

    // Identity is load-bearing: engines namespace tools as `server__tool`, so a
    // substituted name would break model memory across sessions.
    const initResult = {
      jsonrpc: '2.0',
      id: 0,
      result: { protocolVersion: '2026-03-26', serverInfo: { name: 'real-server', version: '4.2.0' } },
    };
    h.filter.fromUpstream(initResult);
    expect(h.toEngine.at(-1)).toEqual(initResult);
  });

  it('relays notifications, progress and cancellation untouched in order', () => {
    const h = harness(['alpha']);
    const progress = { jsonrpc: '2.0', method: 'notifications/progress', params: { progressToken: 1, progress: 50 } };
    const logged = { jsonrpc: '2.0', method: 'notifications/message', params: { level: 'info', data: 'hi' } };
    h.filter.fromUpstream(progress);
    h.filter.fromUpstream(logged);
    expect(h.toEngine).toEqual([progress, logged]);

    // Cancellation is blind-forwarded: upstream ignores an unknown id, and a
    // ledger would only be needed if a real server were shown to mind.
    const cancel = { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 7 } };
    h.filter.fromEngine(cancel);
    expect(h.toUpstream.at(-1)).toEqual(cancel);
  });

  it('leaves a non-tools/list result alone even when it carries a tools key', () => {
    const h = harness(['alpha']);
    // A resources/list reply that happens to carry a `tools` field must not be
    // rewritten - only replies to requests WE saw as tools/list are filtered.
    h.filter.fromEngine({ jsonrpc: '2.0', id: 3, method: 'resources/list' });
    const reply = { jsonrpc: '2.0', id: 3, result: { tools: [{ name: 'beta' }], resources: [] } };
    h.filter.fromUpstream(reply);
    expect(h.toEngine.at(-1)).toEqual(reply);
  });

  it('filters a tools/list result that arrives with tools omitted', () => {
    const h = harness(['alpha']);
    h.filter.fromEngine({ jsonrpc: '2.0', id: 4, method: 'tools/list' });
    const reply = { jsonrpc: '2.0', id: 4, result: {} };
    h.filter.fromUpstream(reply);
    // No tools key means nothing to filter; it must pass rather than throw.
    expect(h.toEngine.at(-1)).toEqual(reply);
  });

  it('an error reply to tools/list passes through unchanged', () => {
    const h = harness(['alpha']);
    h.filter.fromEngine({ jsonrpc: '2.0', id: 5, method: 'tools/list' });
    const reply = { jsonrpc: '2.0', id: 5, error: { code: -32603, message: 'upstream exploded' } };
    h.filter.fromUpstream(reply);
    expect(h.toEngine.at(-1)).toEqual(reply);
  });

  it('stops tracking a request id once its reply has been seen', () => {
    const h = harness(['alpha']);
    h.filter.fromEngine({ jsonrpc: '2.0', id: 6, method: 'tools/list' });
    h.filter.fromUpstream(listResult(6, ['alpha', 'beta']));
    // A later, unrelated reply reusing id 6 must NOT be filtered as a tool list.
    const later = { jsonrpc: '2.0', id: 6, result: { tools: [{ name: 'beta' }] } };
    h.filter.fromUpstream(later);
    expect(h.toEngine.at(-1)).toEqual(later);
  });

  it('an empty allowlist filters everything out rather than passing everything', () => {
    // The app withholds the connector entirely in this case, so the shim should
    // never see it - but if it does, it must fail CLOSED, not open.
    const h = harness([]);
    h.filter.fromEngine({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    h.filter.fromUpstream(listResult(1, ['alpha', 'beta']));
    const result = h.toEngine.at(-1)?.result as { tools: { name: string }[] };
    expect(result.tools).toEqual([]);
  });
});

/**
 * Argv and framing. Both are places where a lenient implementation would fail
 * OPEN - a shim that starts without a usable allowlist, or that forwards a
 * half-parsed line, exposes tools the user switched off.
 */
describe('parseShimArgv - #998', () => {
  it('parses repeated --allow flags and the upstream argv after the separator', () => {
    const parsed = parseShimArgv(['--allow', 'alpha', '--allow', 'beta', '--', 'npx', '-y', 'some-server']);
    expect(parsed).toEqual({ allowed: ['alpha', 'beta'], command: 'npx', args: ['-y', 'some-server'] });
  });

  it('treats a tool name containing a comma as ONE tool, never two', () => {
    // A comma-joined allowlist would be fail-OPEN here: `a,b` would split into
    // two entries and admit `a` and `b`, neither of which was ever allowed.
    const parsed = parseShimArgv(['--allow', 'weird,name', '--', 'server']);
    expect(parsed?.allowed).toEqual(['weird,name']);
  });

  it('refuses a trailing --allow with no value rather than ignoring it', () => {
    expect(parseShimArgv(['--allow', 'alpha', '--allow', '--', 'server'])).toBeNull();
  });

  it('refuses when the separator is missing', () => {
    expect(parseShimArgv(['--allow', 'alpha', 'server'])).toBeNull();
  });

  it('refuses when no upstream command follows the separator', () => {
    expect(parseShimArgv(['--allow', 'alpha', '--'])).toBeNull();
  });

  it('refuses when the allowlist is absent - never starts unfiltered', () => {
    expect(parseShimArgv(['--', 'server'])).toBeNull();
  });

  it('refuses an empty allowlist rather than treating it as allow-all', () => {
    expect(parseShimArgv(['--allow', '', '--', 'server'])).toBeNull();
  });

  it('does not re-interpret upstream args that look like its own flags', () => {
    const parsed = parseShimArgv(['--allow', 'alpha', '--', 'server', '--allow', 'evil']);
    expect(parsed?.args).toEqual(['--allow', 'evil']);
    expect(parsed?.allowed).toEqual(['alpha']);
  });
});

describe('createLineReader - #998 stdio framing', () => {
  it('emits one message per newline-delimited frame', () => {
    const seen: Record<string, unknown>[] = [];
    const read = createLineReader((m) => seen.push(m));
    read('{"jsonrpc":"2.0","id":1}\n{"jsonrpc":"2.0","id":2}\n');
    expect(seen.map((m) => m.id)).toEqual([1, 2]);
  });

  it('reassembles a frame split across chunks', () => {
    const seen: Record<string, unknown>[] = [];
    const read = createLineReader((m) => seen.push(m));
    read('{"jsonrpc":"2.0",');
    read('"id":7}\n');
    expect(seen.map((m) => m.id)).toEqual([7]);
  });

  it('drops an unparseable line instead of relaying a half frame', () => {
    const seen: Record<string, unknown>[] = [];
    const read = createLineReader((m) => seen.push(m));
    read('not json at all\n{"jsonrpc":"2.0","id":3}\n');
    expect(seen.map((m) => m.id)).toEqual([3]);
  });

  it('ignores a bare JSON array or scalar - only objects are messages', () => {
    const seen: Record<string, unknown>[] = [];
    const read = createLineReader((m) => seen.push(m));
    read('[1,2,3]\n"hello"\n{"id":4}\n');
    expect(seen.map((m) => m.id)).toEqual([4]);
  });
});
