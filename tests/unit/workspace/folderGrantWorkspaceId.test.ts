/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 — the key a workspace's folder grants are filed under.
 *
 * The property that matters is not "a marker wins". It is that the two id
 * spaces are DISJOINT. The marker file sits inside the workspace, which the
 * agent can write, so an agent that could author a marker whose id was another
 * workspace's key would make its own session inherit that workspace's grant
 * list. Prefixes make that unreachable by construction rather than by
 * validation, which is why the fixture below writes exactly that forgery.
 */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildWorkspaceMarker, writeWorkspaceMarker } from '@process/services/workspaceIdentity';
import { resolveFolderGrantWorkspaceId } from '@process/services/workspace/folderGrantWorkspaceId';

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wfa-grant-id-'));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('resolveFolderGrantWorkspaceId', () => {
  it('uses the marker id when the workspace carries one', async () => {
    const marker = buildWorkspaceMarker({ ownerKind: 'task', ownerId: 'job-1', displayName: 'Reports' });
    await writeWorkspaceMarker(tmp, marker);

    expect(await resolveFolderGrantWorkspaceId(tmp)).toBe(`marker:${marker.workspaceId}`);
  });

  it('survives a rename, which is the whole reason the marker is preferred', async () => {
    const marker = buildWorkspaceMarker({ ownerKind: 'task', ownerId: 'job-1', displayName: 'Reports' });
    await writeWorkspaceMarker(tmp, marker);
    const before = await resolveFolderGrantWorkspaceId(tmp);

    const renamed = path.join(path.dirname(tmp), `${path.basename(tmp)}-renamed`);
    await fs.rename(tmp, renamed);
    try {
      expect(await resolveFolderGrantWorkspaceId(renamed)).toBe(before);
    } finally {
      await fs.rename(renamed, tmp);
    }
  });

  it('falls back to the resolved path when there is no marker', async () => {
    // Most workspaces are in this branch: the marker is written only where
    // Wayland ALLOCATES the folder, and a workspace the user picked in a file
    // dialog never has one. Refusing here would make "remember this folder" a
    // button that does nothing for the majority of chats.
    expect(await resolveFolderGrantWorkspaceId(tmp)).toBe(`path:${path.resolve(tmp)}`);
  });

  it('keeps the marker space and the path space disjoint under a forged marker', async () => {
    // A marker is a file INSIDE the workspace, so the agent can write it. This
    // one claims another workspace's path key verbatim.
    const victim = `path:${path.resolve(tmp)}`;
    const forged = { ...buildWorkspaceMarker({ ownerKind: 'task', ownerId: null, displayName: 'x' }), workspaceId: victim };
    await writeWorkspaceMarker(tmp, forged as never);

    const resolved = await resolveFolderGrantWorkspaceId(tmp);
    // The prefix is re-applied, so the forgery cannot land in the path space.
    expect(resolved).toBe(`marker:${victim}`);
    expect(resolved).not.toBe(victim);

    // CONTROL: an unmarked directory really does produce the bare path key, so
    // the inequality above is two distinct spaces and not a value nothing uses.
    const other = await fs.mkdtemp(path.join(os.tmpdir(), 'wfa-grant-id-'));
    try {
      expect(await resolveFolderGrantWorkspaceId(other)).toBe(`path:${path.resolve(other)}`);
    } finally {
      await fs.rm(other, { recursive: true, force: true });
    }
  });

  it('refuses to invent a key for an absent or relative workspace path', async () => {
    for (const bad of ['', undefined as never, null as never, 'relative/dir', './x']) {
      expect(await resolveFolderGrantWorkspaceId(bad)).toBeNull();
    }
    // CONTROL: a real absolute path in the same call still resolves, so the
    // nulls above are the guard and not a function that returns null always.
    expect(await resolveFolderGrantWorkspaceId(tmp)).toBeTruthy();
  });

  it('resolves a non-existent absolute directory rather than throwing', async () => {
    // The workspace may have been deleted between the card and the click. A
    // throw here would surface as an unhandled rejection on a fire-and-forget
    // persist; a key is fine, because the store still vets the ROOT.
    const gone = path.join(tmp, 'no-such-dir');
    expect(await resolveFolderGrantWorkspaceId(gone)).toBe(`path:${gone}`);
  });
});
