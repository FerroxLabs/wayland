/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for the #755 stdio-MCP cwd defaulting applied by loadCliConfig.
 * Servers spawned by aioncli-core inside the forked agent worker must never
 * inherit the worker's cwd (app.asar.unpacked in packaged builds).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveSafeSpawnCwdMock = vi.fn<() => string>();

vi.mock('@process/utils/safeSpawnCwd', () => ({
  resolveSafeSpawnCwd: () => resolveSafeSpawnCwdMock(),
}));

import { defaultStdioMcpCwds } from '@process/agent/gemini/cli/mcpServerCwd';

const WORKSPACE = '/Users/me/dev/myproject';

beforeEach(() => {
  resolveSafeSpawnCwdMock.mockReset();
  resolveSafeSpawnCwdMock.mockReturnValue('/Users/me/Library/Application Support/Wayland');
});

describe('defaultStdioMcpCwds (#755)', () => {
  it('assigns the workspace to a stdio server that has no cwd', () => {
    const servers = {
      'ijfw-memory': { command: 'node', args: ['server.js'] } as { command: string; args: string[]; cwd?: string },
    };
    defaultStdioMcpCwds(servers, WORKSPACE);
    expect(servers['ijfw-memory'].cwd).toBe(WORKSPACE);
    expect(resolveSafeSpawnCwdMock).not.toHaveBeenCalled();
  });

  it('leaves an explicitly configured cwd untouched', () => {
    const servers = {
      pinned: { command: 'node', args: [], cwd: '/opt/my-server' },
    };
    defaultStdioMcpCwds(servers, WORKSPACE);
    expect(servers.pinned.cwd).toBe('/opt/my-server');
  });

  it('skips url-based (non-stdio) server configs', () => {
    const sse: { url: string; cwd?: string } = { url: 'https://mcp.example.com/sse' };
    const http: { httpUrl: string; cwd?: string } = { httpUrl: 'https://mcp.example.com/mcp' };
    const servers = { sse, http };
    defaultStdioMcpCwds(servers, WORKSPACE);
    expect(sse.cwd).toBeUndefined();
    expect(http.cwd).toBeUndefined();
  });

  it('falls back to resolveSafeSpawnCwd() when the workspace is falsy', () => {
    const servers = {
      'ijfw-memory': { command: 'node', args: [] } as { command: string; args: string[]; cwd?: string },
    };
    defaultStdioMcpCwds(servers, undefined);
    expect(servers['ijfw-memory'].cwd).toBe('/Users/me/Library/Application Support/Wayland');
    expect(resolveSafeSpawnCwdMock).toHaveBeenCalledTimes(1);

    const emptyWorkspace = {
      other: { command: 'bun', args: [] } as { command: string; args: string[]; cwd?: string },
    };
    defaultStdioMcpCwds(emptyWorkspace, '');
    expect(emptyWorkspace.other.cwd).toBe('/Users/me/Library/Application Support/Wayland');
  });

  it('treats an empty-string cwd as missing and defaults it', () => {
    const servers = {
      blank: { command: 'node', args: [], cwd: '' },
    };
    defaultStdioMcpCwds(servers, WORKSPACE);
    expect(servers.blank.cwd).toBe(WORKSPACE);
  });

  it('handles a mixed record, ignoring null/undefined and non-object entries', () => {
    const servers: Record<string, unknown> = {
      stdio: { command: 'node', args: [] },
      sse: { url: 'https://mcp.example.com/sse' },
      nullish: null,
      weird: 'not-a-config',
    };
    const result = defaultStdioMcpCwds(servers, WORKSPACE);
    expect(result).toBe(servers); // mutates in place, returns same record
    expect((servers.stdio as { cwd?: string }).cwd).toBe(WORKSPACE);
    expect((servers.sse as { cwd?: string }).cwd).toBeUndefined();
  });
});
