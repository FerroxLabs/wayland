/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// #348: getCandidateTools is the Lane 2 -> Lane 3 (#344) boundary. It turns the
// persisted MCP servers into the candidate pool Lane 3 ranks + caps. These tests
// pin the contract: only enabled+connected servers contribute, allowedTools
// scopes the pool (undefined = all, [] = none), and each candidate carries its
// owning serverId + a never-undefined description.

import { describe, it, expect } from 'vitest';

import { getCandidateTools } from '@process/services/mcpServices/getCandidateTools';
import type { IMcpServer } from '@/common/config/storage';

function server(overrides: Partial<IMcpServer>): IMcpServer {
  return {
    id: 's1',
    name: 'svc',
    enabled: true,
    status: 'connected',
    transport: { type: 'stdio', command: 'x', args: [] },
    tools: [{ name: 'a' }, { name: 'b', description: 'B' }],
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  } as IMcpServer;
}

describe('getCandidateTools (#348)', () => {
  it('includes all of a server tools when allowedTools is undefined (default = all)', () => {
    const out = getCandidateTools([server({})]);
    expect(out.map((t) => t.name)).toEqual(['a', 'b']);
    // Missing description is normalized to '' (contract: description is string).
    expect(out[0]).toEqual({ serverId: 's1', name: 'a', description: '' });
    expect(out[1].description).toBe('B');
  });

  it('filters to the allowedTools set when present', () => {
    const out = getCandidateTools([server({ allowedTools: ['b'] })]);
    expect(out.map((t) => t.name)).toEqual(['b']);
  });

  it('emits nothing for a server with allowedTools: [] (user disabled all)', () => {
    expect(getCandidateTools([server({ allowedTools: [] })])).toEqual([]);
  });

  it('skips servers that are not enabled (not installed to agents)', () => {
    expect(getCandidateTools([server({ enabled: false })])).toEqual([]);
  });

  it('skips servers that are not connected', () => {
    expect(getCandidateTools([server({ status: 'error' })])).toEqual([]);
    expect(getCandidateTools([server({ status: undefined })])).toEqual([]);
  });

  it('tags each candidate with its owning serverId across multiple servers', () => {
    const out = getCandidateTools([
      server({ id: 's1', tools: [{ name: 'a' }] }),
      server({ id: 's2', tools: [{ name: 'c', description: 'C' }] }),
    ]);
    expect(out).toEqual([
      { serverId: 's1', name: 'a', description: '' },
      { serverId: 's2', name: 'c', description: 'C' },
    ]);
  });

  it('handles a connected server with no tools array', () => {
    expect(getCandidateTools([server({ tools: undefined })])).toEqual([]);
  });
});
