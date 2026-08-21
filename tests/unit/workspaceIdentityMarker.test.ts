/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * P2-0 - workspace identity marker.
 *
 * A durable workspace is a folder in the user's Documents. The user can move it,
 * delete it, or drop a completely different folder at the same path. A pathname
 * is therefore NOT identity. `.wayland-workspace.json`, written at allocation
 * time, is: it carries a stable id, the owner kind, a display name and a schema
 * version, so a later run can ask "is this folder still mine" and get an answer
 * that survives a rename and refuses an impostor.
 *
 * Real filesystem throughout - the whole point is what is on disk.
 */
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  WORKSPACE_MARKER_FILE,
  buildWorkspaceMarker,
  checkWorkspaceIdentity,
  parseWorkspaceMarker,
  readWorkspaceMarker,
  writeWorkspaceMarker,
} from '@process/services/workspaceIdentity';

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-p20-'));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('workspace identity marker (P2-0)', () => {
  it('writes a readable marker carrying id, owner kind, display name and schema version', async () => {
    const marker = buildWorkspaceMarker({ ownerKind: 'task', ownerId: 'job-1', displayName: 'Morning Brief' });
    await writeWorkspaceMarker(dir, marker);

    const raw = JSON.parse(await fs.readFile(path.join(dir, WORKSPACE_MARKER_FILE), 'utf8'));
    expect(raw.schemaVersion).toBe(1);
    expect(raw.ownerKind).toBe('task');
    expect(raw.ownerId).toBe('job-1');
    expect(raw.displayName).toBe('Morning Brief');
    expect(typeof raw.workspaceId).toBe('string');

    expect(await readWorkspaceMarker(dir)).toEqual(marker);
  });

  it('mints a distinct id per workspace', () => {
    const a = buildWorkspaceMarker({ ownerKind: 'task', ownerId: null, displayName: 'X' });
    const b = buildWorkspaceMarker({ ownerKind: 'task', ownerId: null, displayName: 'X' });
    expect(a.workspaceId).not.toBe(b.workspaceId);
  });

  it('returns null rather than throwing for an absent, unreadable or malformed marker', async () => {
    expect(await readWorkspaceMarker(dir)).toBe(null);
    await fs.writeFile(path.join(dir, WORKSPACE_MARKER_FILE), 'not json', 'utf8');
    expect(await readWorkspaceMarker(dir)).toBe(null);
    await fs.writeFile(path.join(dir, WORKSPACE_MARKER_FILE), '{"schemaVersion":99}', 'utf8');
    expect(await readWorkspaceMarker(dir)).toBe(null);
    expect(await readWorkspaceMarker(path.join(dir, 'nope'))).toBe(null);
  });

  it('rejects a marker whose fields are the wrong shape', () => {
    const good = buildWorkspaceMarker({ ownerKind: 'project', ownerId: 'p1', displayName: 'Alpha' });
    expect(parseWorkspaceMarker({ ...good })).toEqual(good);
    expect(parseWorkspaceMarker({ ...good, ownerKind: 'wat' })).toBe(null);
    expect(parseWorkspaceMarker({ ...good, workspaceId: '' })).toBe(null);
    expect(parseWorkspaceMarker({ ...good, schemaVersion: 2 })).toBe(null);
    expect(parseWorkspaceMarker(null)).toBe(null);
  });

  it('survives a rename of the folder - the id is identity, the folder name is display', async () => {
    const marker = buildWorkspaceMarker({ ownerKind: 'task', ownerId: 'job-1', displayName: 'Morning Brief' });
    await writeWorkspaceMarker(dir, marker);
    const moved = `${dir}-renamed`;
    await fs.rename(dir, moved);
    try {
      const check = await checkWorkspaceIdentity(moved, marker.workspaceId);
      expect(check.status).toBe('ok');
      expect(check.marker?.workspaceId).toBe(marker.workspaceId);
    } finally {
      await fs.rm(moved, { recursive: true, force: true });
    }
  });
});

describe('checkWorkspaceIdentity (P2-10 preflight)', () => {
  it('reports missing when the directory is gone', async () => {
    const gone = path.join(dir, 'deleted');
    expect((await checkWorkspaceIdentity(gone, 'ws-1')).status).toBe('missing');
    expect((await checkWorkspaceIdentity(gone, null)).status).toBe('missing');
  });

  it('reports missing when the path is a file, not a directory', async () => {
    const file = path.join(dir, 'a-file');
    await fs.writeFile(file, 'x', 'utf8');
    expect((await checkWorkspaceIdentity(file, null)).status).toBe('missing');
  });

  it('reports mismatch when a DIFFERENT workspace now sits at the path', async () => {
    const other = buildWorkspaceMarker({ ownerKind: 'task', ownerId: 'job-2', displayName: 'Other' });
    await writeWorkspaceMarker(dir, other);
    const check = await checkWorkspaceIdentity(dir, 'some-other-id');
    expect(check.status).toBe('mismatch');
  });

  it('reports unmarked when we expected our marker and the folder was replaced', async () => {
    expect((await checkWorkspaceIdentity(dir, 'ws-1')).status).toBe('unmarked');
  });

  it('accepts an unmarked folder when nothing was expected (legacy + user-picked workspaces)', async () => {
    expect((await checkWorkspaceIdentity(dir, null)).status).toBe('ok');
  });
});
