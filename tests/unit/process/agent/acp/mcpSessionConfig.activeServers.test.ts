/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #348 — per-conversation MCP scoping at the ACP injection chokepoint. A chat's
 * `activeMcpServers` selection filters which user servers are injected; builtins
 * always pass; `undefined` = all (unchanged behaviour), `[]` = only builtins.
 */

import { describe, it, expect } from 'vitest';
import { isServerActiveForSession, buildAcpSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';
import type { IMcpServer } from '@/common/config/storage';

const caps = { stdio: true, http: true, sse: true };

const server = (over: Partial<IMcpServer>): IMcpServer =>
  ({
    id: 'srv',
    name: 'srv',
    enabled: true,
    status: 'connected',
    transport: { type: 'stdio', command: 'x', args: [] },
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }) as IMcpServer;

describe('isServerActiveForSession (#348)', () => {
  it('passes a builtin regardless of the selection', () => {
    expect(isServerActiveForSession(server({ builtin: true }), [])).toBe(true);
    expect(isServerActiveForSession(server({ builtin: true }), ['other'])).toBe(true);
  });

  it('passes any user server when no selection is set (undefined = all)', () => {
    expect(isServerActiveForSession(server({ id: 'a' }), undefined)).toBe(true);
  });

  it('passes a user server only when the selection includes it', () => {
    expect(isServerActiveForSession(server({ id: 'a' }), ['a', 'b'])).toBe(true);
    expect(isServerActiveForSession(server({ id: 'c' }), ['a', 'b'])).toBe(false);
  });

  it('scopes out every user server on an empty selection', () => {
    expect(isServerActiveForSession(server({ id: 'a' }), [])).toBe(false);
  });
});

describe('buildAcpSessionMcpServers active-server filter (#348)', () => {
  const builtin = server({ id: 'img', name: 'image-gen', builtin: true, status: undefined });
  const userA = server({ id: 'a', name: 'alpha' });
  const userB = server({ id: 'b', name: 'beta' });

  it('injects all enabled servers when no selection is given (back-compat)', () => {
    const out = buildAcpSessionMcpServers([builtin, userA, userB], caps);
    expect(out.map((s) => s.name).sort()).toEqual(['alpha', 'beta', 'image-gen']);
  });

  it('injects only selected user servers plus builtins', () => {
    const out = buildAcpSessionMcpServers([builtin, userA, userB], caps, ['a']);
    expect(out.map((s) => s.name).sort()).toEqual(['alpha', 'image-gen']);
  });

  it('injects only builtins when the selection is empty', () => {
    const out = buildAcpSessionMcpServers([builtin, userA, userB], caps, []);
    expect(out.map((s) => s.name)).toEqual(['image-gen']);
  });
});
