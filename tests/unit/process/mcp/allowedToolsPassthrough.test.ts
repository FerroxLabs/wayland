/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1167 - `allowedTools` must survive every Desktop->engine boundary.
 *
 * There are THREE of them and they live in two files, which is why a partial fix
 * reads as "the switch doesn't work" on some backends and works on others:
 *   1.  buildAcpSessionMcpServers()      - ACP backends, stdio
 *   1b. buildAcpSessionMcpServers()      - ACP backends, hosted http/sse
 *   2.  buildWCoreUserStdioMcpServers()  - the wcore `add_mcp_server` runtime path
 *   3.  toWCoreConfig()                  - the config.toml [mcp.servers] table,
 *                                          and the ONLY path hosted connectors take
 *
 * THE POLARITY TRAP, which is what these tests exist for: this is an ALLOW-list
 * and `[]` is meaningful. Absent means every tool; `[]` means none. Any encoder
 * that collapses `[]` to absent - `omitempty`, a truthiness check, `?? undefined`,
 * an `Object.keys(x).length > 0` guard copied from the sibling `env`/`headers`
 * fields - grants EVERY tool at the exact moment the user asked for none. Each
 * path therefore gets its own `[]` assertion rather than one shared one.
 */
import { describe, expect, it } from 'vitest';
import { buildAcpSessionMcpServers, buildWCoreUserStdioMcpServers } from '@process/agent/acp/mcpSessionConfig';
import { toMcpServer, toWCoreConfig } from '@process/services/mcpServices/agents/WCoreMcpAgent';
import type { IMcpServer } from '@/common/config/storage';

const ALL: { stdio: true; http: true; sse: true } = { stdio: true, http: true, sse: true };

function stdioServer(allowedTools?: string[]): IMcpServer {
  return {
    id: 'srv-stdio',
    name: 'demo',
    enabled: true,
    status: 'connected',
    createdAt: 1,
    updatedAt: 1,
    transport: { type: 'stdio', command: 'demo-server', args: ['--serve'], env: {} },
    ...(allowedTools !== undefined ? { allowedTools } : {}),
  } as unknown as IMcpServer;
}

function httpServer(allowedTools?: string[], type: 'http' | 'sse' = 'http'): IMcpServer {
  return {
    id: `srv-${type}`,
    name: `demo-${type}`,
    enabled: true,
    status: 'connected',
    createdAt: 1,
    updatedAt: 1,
    transport: { type, url: 'https://example.test/mcp', headers: {} },
    ...(allowedTools !== undefined ? { allowedTools } : {}),
  } as unknown as IMcpServer;
}

describe('#1167 path 1 - ACP session descriptors, stdio', () => {
  it('omits the key entirely when no selection was ever made', () => {
    const [server] = buildAcpSessionMcpServers([stdioServer(undefined)], ALL);
    // Absent, not `undefined`: the migration-free default is "every tool", and an
    // explicit undefined key invites a downstream reader to treat it as a value.
    expect('allowedTools' in server).toBe(false);
  });

  it('carries an explicit subset through untransformed', () => {
    const [server] = buildAcpSessionMcpServers([stdioServer(['alpha'])], ALL);
    expect(server.allowedTools).toEqual(['alpha']);
  });

  it('THE EMPTY CASE: withholds the server rather than sending an empty list', () => {
    // `contributesTools` drops a connector whose every tool is switched off. That
    // is a STRONGER guarantee than declaring it with `allowedTools: []`, because
    // it holds on backends that have never heard of the field - the server simply
    // is not there. The failure this guards is the inverse: the connector coming
    // back with its FULL inventory at the moment the user disabled everything.
    expect(buildAcpSessionMcpServers([stdioServer([])], ALL)).toEqual([]);
  });
});

describe('#1167 path 1b - ACP session descriptors, hosted http/sse', () => {
  // Hosted transports have no spawn to wrap, so the stdio filtering shim cannot
  // help them. This field is the only mechanism a subset has on these at all.
  it.each(['http', 'sse'] as const)('carries an explicit subset on %s', (type) => {
    const [server] = buildAcpSessionMcpServers([httpServer(['alpha'], type)], ALL);
    expect(server.allowedTools).toEqual(['alpha']);
  });

  it.each(['http', 'sse'] as const)('omits the key on %s when unset', (type) => {
    const [server] = buildAcpSessionMcpServers([httpServer(undefined, type)], ALL);
    expect('allowedTools' in server).toBe(false);
  });

  it.each(['http', 'sse'] as const)('THE EMPTY CASE on %s: withholds the server', (type) => {
    expect(buildAcpSessionMcpServers([httpServer([], type)], ALL)).toEqual([]);
  });
});

describe('#1167 path 2 - the wcore add_mcp_server runtime path', () => {
  it('omits the key when unset', () => {
    const [server] = buildWCoreUserStdioMcpServers([stdioServer(undefined)]);
    expect('allowedTools' in server).toBe(false);
  });

  it('carries an explicit subset through untransformed', () => {
    const [server] = buildWCoreUserStdioMcpServers([stdioServer(['alpha'])]);
    expect(server.allowedTools).toEqual(['alpha']);
  });

  it('THE EMPTY CASE: withholds the server', () => {
    expect(buildWCoreUserStdioMcpServers([stdioServer([])])).toEqual([]);
  });
});

describe('#1167 path 3 - the config.toml [mcp.servers] table', () => {
  // This path filters on `enabled` ONLY - there is no `contributesTools` here -
  // so unlike paths 1 and 2 an empty allow-list really does reach the wire, and
  // it has to arrive as an empty array rather than as a missing key.
  it('omits the key when unset', () => {
    expect('allowedTools' in toWCoreConfig(stdioServer(undefined))).toBe(false);
  });

  it('carries an explicit subset through untransformed', () => {
    expect(toWCoreConfig(stdioServer(['alpha'])).allowedTools).toEqual(['alpha']);
  });

  it('THE EMPTY CASE: emits an empty array, NOT a missing key', () => {
    const config = toWCoreConfig(stdioServer([]));
    expect('allowedTools' in config).toBe(true);
    expect(config.allowedTools).toEqual([]);
  });

  it('THE EMPTY CASE on a hosted connector, which has no other enforcement route', () => {
    const config = toWCoreConfig(httpServer([]));
    expect('allowedTools' in config).toBe(true);
    expect(config.allowedTools).toEqual([]);
  });

  it('does not copy the truthiness guard the sibling env/headers fields use', () => {
    // `env` and `headers` are written only when non-empty. Applying that shape to
    // an allow-list is the polarity trap: it would erase the difference between
    // "no opinion" and "nothing allowed".
    const withEmptyEnv = { ...stdioServer([]), transport: { type: 'stdio', command: 'x', args: [], env: {} } };
    const config = toWCoreConfig(withEmptyEnv as unknown as IMcpServer);
    expect('env' in config).toBe(false); // the guard is correct for env...
    expect(config.allowedTools).toEqual([]); // ...and must NOT be applied here
  });
});

describe('#1167 path 3b - reading that same table BACK', () => {
  /**
   * The write had no matching read, so the round trip FAILED OPEN.
   *
   * `toWCoreConfig` emits `allowedTools`; `toMcpServer` - which is what
   * `detectMcpServers` builds every server from when it imports an existing
   * wayland-core config - dropped it. So a user who had switched tools off,
   * then re-detected their config, silently got every tool back, with the UI
   * showing the full list as though that had always been the setting.
   */
  it('carries an allow-list back off the config', () => {
    const config = toWCoreConfig(stdioServer(['alpha', 'beta']));
    expect(toMcpServer('demo', config).allowedTools).toEqual(['alpha', 'beta']);
  });

  it('carries an EMPTY allow-list back, which means none rather than all', () => {
    const config = toWCoreConfig(stdioServer([]));
    expect(toMcpServer('demo', config).allowedTools).toEqual([]);
  });

  it('leaves the key absent when the config never had one', () => {
    // Absent still means "all tools" - the migration-free default. Inventing a
    // `[]` here would switch every tool OFF for every pre-existing server.
    const config = toWCoreConfig(stdioServer(undefined));
    expect('allowedTools' in toMcpServer('demo', config)).toBe(false);
  });

  it('round-trips over http too', () => {
    const config = toWCoreConfig(httpServer(['only-this']));
    expect(toMcpServer('demo-http', config).allowedTools).toEqual(['only-this']);
  });
});
