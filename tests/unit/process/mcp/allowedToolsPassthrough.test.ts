/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1167/#998 - tool selections must survive every enforceable Desktop boundary.
 *
 * The boundary that remains since the Fuigo cutover:
 *   1.  buildAcpSessionMcpServers()      - ACP stdio, via the filter shim
 *   1b. buildAcpSessionMcpServers()      - hosted subsets are refused because
 *                                          standard ACP has no selection field
 *
 * THE POLARITY TRAP, which is what these tests exist for: this is an ALLOW-list
 * and `[]` is meaningful. Absent means every tool; `[]` means none. Any encoder
 * that collapses `[]` to absent - `omitempty`, a truthiness check, `?? undefined`,
 * an `Object.keys(x).length > 0` guard copied from the sibling `env`/`headers`
 * fields - grants EVERY tool at the exact moment the user asked for none. Each
 * path therefore gets its own `[]` assertion rather than one shared one.
 */
import { describe, expect, it } from 'vitest';
import { UnsupportedHostedAcpToolSelectionError, buildAcpSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';
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

  it('carries a strict subset only inside the stdio filter boundary', () => {
    const [server] = buildAcpSessionMcpServers([stdioServer(['alpha'])], ALL);
    expect('allowedTools' in server).toBe(false);
    expect(JSON.stringify(server)).toContain('builtin-mcp-tool-filter');
    expect(JSON.stringify(server)).toContain('alpha');
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
  it.each(['http', 'sse'] as const)('refuses an unenforceable explicit subset on %s', (type) => {
    expect(() => buildAcpSessionMcpServers([httpServer(['alpha'], type)], ALL)).toThrow(
      UnsupportedHostedAcpToolSelectionError
    );
  });

  it.each(['http', 'sse'] as const)('omits the key on %s when unset', (type) => {
    const [server] = buildAcpSessionMcpServers([httpServer(undefined, type)], ALL);
    expect('allowedTools' in server).toBe(false);
  });

  it.each(['http', 'sse'] as const)('THE EMPTY CASE on %s: withholds the server', (type) => {
    expect(buildAcpSessionMcpServers([httpServer([], type)], ALL)).toEqual([]);
  });
});
