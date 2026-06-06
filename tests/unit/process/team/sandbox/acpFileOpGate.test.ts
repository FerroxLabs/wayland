/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4 audit CRIT-1 (2026-05-19) - Tests for the ACP file-op sandbox gate.
 *
 * Covers the gate that wraps `AcpConnection.handleReadOperation` /
 * `handleWriteOperation` for imported (sandboxed) teams. Non-team and
 * non-imported conversations MUST pass through to the legacy fallback
 * with zero behavior change; imported teams MUST run capability checks
 * and route via `withOpenInsideWorkspace` (path traversal, absolute
 * paths, symlinks, `.env`, and `node_modules/.bin|.cache` all reject).
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamSandboxedError } from '@process/team/importExport/errors';
import { gateAcpFileOp, type AcpFileOpResult } from '@process/team/sandbox/acpFileOpGate';
import {
  __resetAcpTeamContextRegistryForTests,
  registerTeamConversation,
} from '@process/team/sandbox/acpTeamContextRegistry';
import type { TTeam } from '@process/team/types';

let workspaceDir: string;
let scratchRoot: string;

const buildTeam = (overrides: Partial<TTeam> = {}): TTeam => ({
  id: 'team-1',
  userId: 'user-1',
  name: 'Imported Pack',
  workspace: workspaceDir,
  workspaceMode: 'shared',
  leaderAgentId: 'slot-1',
  agents: [],
  importedFrom: 'pack.json',
  isSandboxed: true,
  importCapabilityGrants: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  ...overrides,
});

beforeEach(async () => {
  scratchRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-w4-acpgate-'));
  workspaceDir = path.join(scratchRoot, 'workspace');
  await fs.mkdir(workspaceDir, { recursive: true });
  __resetAcpTeamContextRegistryForTests();
});

afterEach(async () => {
  await fs.rm(scratchRoot, { recursive: true, force: true });
  __resetAcpTeamContextRegistryForTests();
  vi.restoreAllMocks();
});

const expectSandboxed = async (p: Promise<unknown>): Promise<TeamSandboxedError> => {
  let caught: unknown;
  try {
    await p;
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(TeamSandboxedError);
  return caught as TeamSandboxedError;
};

describe('gateAcpFileOp - non-team / non-imported pass-through', () => {
  it('non-team conversation: invokes fallback unchanged', async () => {
    const fallback = vi.fn().mockResolvedValue({ kind: 'read', content: 'hi' } as AcpFileOpResult);
    const out = await gateAcpFileOp('conv-x', 'read', { path: '/etc/passwd' }, fallback);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ kind: 'read', content: 'hi' });
  });

  it('non-imported team conversation: invokes fallback unchanged', async () => {
    const fallback = vi.fn().mockResolvedValue({ kind: 'write', result: null } as AcpFileOpResult);
    const team = buildTeam({ importedFrom: undefined });
    registerTeamConversation('conv-x', {
      teamId: team.id,
      isImported: false,
      getTeam: async () => team,
    });
    const out = await gateAcpFileOp('conv-x', 'write', { path: 'whatever', content: 'x' }, fallback);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ kind: 'write', result: null });
  });
});

describe('gateAcpFileOp - imported team capability gate', () => {
  it('throws TeamSandboxedError on read when canReadFiles is not granted', async () => {
    const team = buildTeam(); // empty grants map
    registerTeamConversation('conv-1', {
      teamId: team.id,
      isImported: true,
      getTeam: async () => team,
    });
    const fallback = vi.fn();
    await expectSandboxed(gateAcpFileOp('conv-1', 'read', { path: 'a.txt' }, fallback));
    expect(fallback).not.toHaveBeenCalled();
  });

  it('throws TeamSandboxedError on write when canWriteFiles is not granted', async () => {
    const team = buildTeam({
      importCapabilityGrants: {
        canReadFiles: { granted_at: 1, by_user: true },
      },
    });
    registerTeamConversation('conv-1', {
      teamId: team.id,
      isImported: true,
      getTeam: async () => team,
    });
    const fallback = vi.fn();
    await expectSandboxed(
      gateAcpFileOp('conv-1', 'write', { path: 'a.txt', content: 'x' }, fallback)
    );
    expect(fallback).not.toHaveBeenCalled();
  });

  it('throws when team has no workspace configured even if cap granted', async () => {
    const team = buildTeam({
      workspace: '',
      importCapabilityGrants: { canReadFiles: { granted_at: 1, by_user: true } },
    });
    registerTeamConversation('conv-1', {
      teamId: team.id,
      isImported: true,
      getTeam: async () => team,
    });
    await expectSandboxed(gateAcpFileOp('conv-1', 'read', { path: 'a.txt' }, vi.fn()));
  });
});

describe('gateAcpFileOp - imported team workspace sandbox', () => {
  const grantedTeam = (caps: Partial<Record<string, true>>): TTeam => {
    const grants: Record<string, { granted_at: number; by_user: boolean }> = {};
    for (const k of Object.keys(caps)) grants[k] = { granted_at: 1, by_user: true };
    return buildTeam({ importCapabilityGrants: grants });
  };

  it('grants canReadFiles + reads inside workspace', async () => {
    const team = grantedTeam({ canReadFiles: true });
    registerTeamConversation('conv-1', {
      teamId: team.id,
      isImported: true,
      getTeam: async () => team,
    });
    await fs.writeFile(path.join(workspaceDir, 'hello.txt'), 'world', 'utf-8');
    const out = await gateAcpFileOp('conv-1', 'read', { path: 'hello.txt' }, vi.fn());
    expect(out).toEqual({ kind: 'read', content: 'world' });
  });

  it('rejects ../../etc/passwd traversal even when canReadFiles granted', async () => {
    const team = grantedTeam({ canReadFiles: true });
    registerTeamConversation('conv-1', {
      teamId: team.id,
      isImported: true,
      getTeam: async () => team,
    });
    await expectSandboxed(
      gateAcpFileOp('conv-1', 'read', { path: '../../etc/passwd' }, vi.fn())
    );
  });

  it('rejects absolute paths like /etc/passwd even when canReadFiles granted', async () => {
    const team = grantedTeam({ canReadFiles: true });
    registerTeamConversation('conv-1', {
      teamId: team.id,
      isImported: true,
      getTeam: async () => team,
    });
    await expectSandboxed(
      gateAcpFileOp('conv-1', 'read', { path: '/etc/passwd' }, vi.fn())
    );
  });

  it('rejects .env (denylist) even when canReadFiles granted', async () => {
    const team = grantedTeam({ canReadFiles: true });
    registerTeamConversation('conv-1', {
      teamId: team.id,
      isImported: true,
      getTeam: async () => team,
    });
    await fs.writeFile(path.join(workspaceDir, '.env'), 'SECRET=1', 'utf-8');
    await expectSandboxed(gateAcpFileOp('conv-1', 'read', { path: '.env' }, vi.fn()));
  });

  it('grants canWriteFiles + writes file inside workspace', async () => {
    const team = grantedTeam({ canWriteFiles: true });
    registerTeamConversation('conv-1', {
      teamId: team.id,
      isImported: true,
      getTeam: async () => team,
    });
    const out = await gateAcpFileOp(
      'conv-1',
      'write',
      { path: 'out.txt', content: 'hello' },
      vi.fn()
    );
    expect(out).toEqual({ kind: 'write', result: null });
    const written = await fs.readFile(path.join(workspaceDir, 'out.txt'), 'utf-8');
    expect(written).toBe('hello');
  });

  it('rejects write into node_modules/.bin/* even when canWriteFiles granted', async () => {
    const team = grantedTeam({ canWriteFiles: true });
    registerTeamConversation('conv-1', {
      teamId: team.id,
      isImported: true,
      getTeam: async () => team,
    });
    // Parent must exist for writes; create the protected directory so we
    // reach the denylist check, not the parent-existence check.
    await fs.mkdir(path.join(workspaceDir, 'node_modules', '.bin'), { recursive: true });
    await expectSandboxed(
      gateAcpFileOp(
        'conv-1',
        'write',
        { path: 'node_modules/.bin/evil', content: '#!/bin/sh\n' },
        vi.fn()
      )
    );
  });
});
