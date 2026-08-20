/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * P2-0 / P2-1 - durable workspace allocation.
 *
 * Real filesystem (only electron `app.getPath` is stubbed to a tmpdir), because
 * every claim here is a claim about what is on disk: the identity marker is
 * written AT ALLOCATION, and new allocations nest under `Wayland/Tasks/<name>`
 * or `Wayland/Projects/<name>` so a Task and a Project can never collide into
 * the same `(2)` suffix namespace.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

let tmpBase: string;

vi.mock('electron', () => ({
  app: { getPath: () => tmpBase },
}));

import { allocateProjectWorkspace } from '@process/services/projectWorkspace';
import { readWorkspaceMarker } from '@process/services/workspaceIdentity';

beforeAll(async () => {
  tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-p21-'));
});
afterAll(async () => {
  await fs.rm(tmpBase, { recursive: true, force: true });
});

describe('P2-0 identity marker is written at allocation time', () => {
  it('stamps a project allocation with a project-owned marker', async () => {
    const ws = await allocateProjectWorkspace('Marked Project', { ownerKind: 'project', ownerId: 'proj-1' });
    const marker = await readWorkspaceMarker(ws);
    expect(marker).not.toBe(null);
    expect(marker!.ownerKind).toBe('project');
    expect(marker!.ownerId).toBe('proj-1');
    expect(marker!.displayName).toBe('Marked Project');
    expect(marker!.workspaceId).toMatch(/[0-9a-f-]{36}/);
  });

  it('stamps a task allocation with a task-owned marker', async () => {
    const ws = await allocateProjectWorkspace('Marked Task', { ownerKind: 'task', ownerId: 'job-1' });
    const marker = await readWorkspaceMarker(ws);
    expect(marker!.ownerKind).toBe('task');
    expect(marker!.ownerId).toBe('job-1');
  });

  it('defaults to a project marker when no owner is given (legacy call shape)', async () => {
    const ws = await allocateProjectWorkspace('Legacy Shape');
    const marker = await readWorkspaceMarker(ws);
    expect(marker!.ownerKind).toBe('project');
    expect(marker!.ownerId).toBe(null);
  });
});

describe('P2-1 nested durable allocation', () => {
  it('nests a NEW project allocation under Wayland/Projects', async () => {
    const ws = await allocateProjectWorkspace('Alpha', { ownerKind: 'project', ownerId: 'p-alpha' });
    expect(ws).toBe(path.join(tmpBase, 'Wayland', 'Projects', 'Alpha'));
  });

  it('nests a NEW task allocation under Wayland/Tasks', async () => {
    const ws = await allocateProjectWorkspace('Morning Brief', { ownerKind: 'task', ownerId: 'job-mb' });
    expect(ws).toBe(path.join(tmpBase, 'Wayland', 'Tasks', 'Morning Brief'));
  });

  it('a Task and a Project of the SAME name do not collide - no (2) suffix, no shared namespace', async () => {
    const task = await allocateProjectWorkspace('Overlap', { ownerKind: 'task', ownerId: 'job-o' });
    const project = await allocateProjectWorkspace('Overlap', { ownerKind: 'project', ownerId: 'p-o' });
    expect(task).toBe(path.join(tmpBase, 'Wayland', 'Tasks', 'Overlap'));
    expect(project).toBe(path.join(tmpBase, 'Wayland', 'Projects', 'Overlap'));
  });

  it('two tasks called "Morning Brief" get distinct dirs with distinct identities', async () => {
    const a = await allocateProjectWorkspace('Same Task', { ownerKind: 'task', ownerId: 'job-a' });
    const b = await allocateProjectWorkspace('Same Task', { ownerKind: 'task', ownerId: 'job-b' });
    expect(a).not.toBe(b);
    expect(b.endsWith('Same Task (2)')).toBe(true);
    const [ma, mb] = [await readWorkspaceMarker(a), await readWorkspaceMarker(b)];
    expect(ma!.workspaceId).not.toBe(mb!.workspaceId);
    // The DISPLAY name is the same; only the folder disambiguates.
    expect(ma!.displayName).toBe('Same Task');
    expect(mb!.displayName).toBe('Same Task');
  });

  it('a rename after allocation does NOT move the folder - the marker id stays identity', async () => {
    const ws = await allocateProjectWorkspace('Before Rename', { ownerKind: 'task', ownerId: 'job-r' });
    const before = await readWorkspaceMarker(ws);
    // Renaming the task allocates nothing and moves nothing; the same call for the
    // same owner would produce a NEW folder, which is exactly why callers must
    // persist the allocated path and never re-derive it from the display name.
    const again = await allocateProjectWorkspace('After Rename', { ownerKind: 'task', ownerId: 'job-r' });
    expect(again).not.toBe(ws);
    expect((await readWorkspaceMarker(ws))!.workspaceId).toBe(before!.workspaceId);
  });

  it('concurrent same-name task allocations still get distinct dirs', async () => {
    const [a, b, c] = await Promise.all([
      allocateProjectWorkspace('Clash', { ownerKind: 'task', ownerId: 'j1' }),
      allocateProjectWorkspace('Clash?', { ownerKind: 'task', ownerId: 'j2' }),
      allocateProjectWorkspace('Clash:', { ownerKind: 'task', ownerId: 'j3' }),
    ]);
    expect(new Set([a, b, c]).size, `must be 3 distinct dirs, got ${[a, b, c].join(', ')}`).toBe(3);
  });
});
