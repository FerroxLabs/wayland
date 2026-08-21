/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 - the key a workspace's folder grants are filed under.
 *
 * The property is that NOTHING THE AGENT CAN WRITE selects the bucket. The
 * previous key consulted `.wayland-workspace.json`, a file inside the workspace
 * the agent has write access to, and an external audit found two ways to abuse
 * that. Both are reproduced below as named attacks, driven through the real
 * production function against a real marker written by the real writer - a
 * hand-built string would prove nothing about what the app actually reads.
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
  it('keys an unmarked workspace on its resolved path', async () => {
    expect(await resolveFolderGrantWorkspaceId(tmp)).toBe(`path:${path.resolve(tmp)}`);
  });

  it('keys a MARKED workspace on the same path, ignoring the marker entirely', async () => {
    // The marker is written by the real writer, so this is the exact file the
    // old key read. A marked workspace and an unmarked one at the same path
    // must produce the same key, or the marker is still selecting something.
    const before = await resolveFolderGrantWorkspaceId(tmp);
    await writeWorkspaceMarker(
      tmp,
      buildWorkspaceMarker({ ownerKind: 'task', ownerId: 'job-1', displayName: 'Reports' })
    );

    const after = await resolveFolderGrantWorkspaceId(tmp);

    expect(after).toBe(`path:${path.resolve(tmp)}`);
    expect(after).toBe(before);
    // CONTROL: the marker really is on disk and really is readable, so the
    // equality above is the key ignoring it and not a write that never landed.
    const written = JSON.parse(await fs.readFile(path.join(tmp, '.wayland-workspace.json'), 'utf8')) as {
      workspaceId: string;
    };
    expect(written.workspaceId).toMatch(/[0-9a-f-]{36}/);
    expect(after).not.toContain(written.workspaceId);
  });

  /**
   * ATTACK A - FORGED MARKER ID.
   *
   * The agent learns another workspace's marker id (a copied folder, a backup,
   * an earlier session, the prompt) and writes it into its own marker file.
   * Under the old key that made its session resolve to the victim's bucket and
   * inherit every grant in it.
   */
  it('ATTACK A: a workspace whose marker carries the VICTIM id does not get the victim key', async () => {
    const victim = await fs.mkdtemp(path.join(os.tmpdir(), 'wfa-grant-id-victim-'));
    try {
      const victimMarker = buildWorkspaceMarker({ ownerKind: 'project', ownerId: 'p-1', displayName: 'Victim' });
      await writeWorkspaceMarker(victim, victimMarker);
      const victimKey = await resolveFolderGrantWorkspaceId(victim);

      // The attack: the attacker's own marker claims the victim's workspace id.
      await writeWorkspaceMarker(tmp, { ...victimMarker, displayName: 'Attacker' });
      const attackerKey = await resolveFolderGrantWorkspaceId(tmp);

      expect(attackerKey).not.toBe(victimKey);
      expect(attackerKey).toBe(`path:${path.resolve(tmp)}`);
      // Not merely "the two differ" - two different WRONG keys would satisfy
      // that. Each names its own folder and neither names the other's.
      expect(victimKey).toBe(`path:${path.resolve(victim)}`);
      expect(attackerKey).not.toContain(path.resolve(victim));
    } finally {
      await fs.rm(victim, { recursive: true, force: true });
    }
  });

  /**
   * ATTACK B - DELETED MARKER, NO ID NEEDED.
   *
   * An unmarked workspace at a pathname accumulates grants. A marked workspace
   * later occupies the same pathname. Under the old key the agent deleted its
   * own marker, resolution fell back to the path, and it inherited the earlier
   * workspace's grants. The fall-BACK is what made this reachable, so the fix
   * is that there is no second branch to fall back from.
   */
  it('ATTACK B: deleting the marker changes nothing, so there is no bucket to fall back into', async () => {
    const unmarkedKey = await resolveFolderGrantWorkspaceId(tmp);

    await writeWorkspaceMarker(
      tmp,
      buildWorkspaceMarker({ ownerKind: 'project', ownerId: 'p-2', displayName: 'Replacement' })
    );
    const markedKey = await resolveFolderGrantWorkspaceId(tmp);

    await fs.rm(path.join(tmp, '.wayland-workspace.json'));
    const afterDeletionKey = await resolveFolderGrantWorkspaceId(tmp);

    // The three states of the marker file - absent, present, deleted again -
    // all name the same bucket, so removing it wins the agent nothing.
    expect(markedKey).toBe(unmarkedKey);
    expect(afterDeletionKey).toBe(unmarkedKey);
    // CONTROL: a DIFFERENT folder really does get a different key, so the
    // equalities above are not a function that returns one constant.
    const other = await fs.mkdtemp(path.join(os.tmpdir(), 'wfa-grant-id-other-'));
    try {
      expect(await resolveFolderGrantWorkspaceId(other)).not.toBe(unmarkedKey);
    } finally {
      await fs.rm(other, { recursive: true, force: true });
    }
  });

  it('refuses to invent a key for an absent or relative workspace path', async () => {
    const bad = ['', undefined as never, null as never, 'relative/dir', './x'];
    expect(await Promise.all(bad.map((value) => resolveFolderGrantWorkspaceId(value)))).toEqual(bad.map(() => null));
    // CONTROL: a real absolute path in the same call still resolves, so the
    // nulls above are the guard and not a function that returns null always.
    expect(await resolveFolderGrantWorkspaceId(tmp)).toBeTruthy();
  });

  it('resolves a non-existent absolute directory rather than throwing', async () => {
    // The workspace may have been deleted between the card and the click. A
    // throw here would surface as an unhandled rejection on a fire-and-forget
    // persist; a key is fine, because the root is vetted separately.
    const gone = path.join(tmp, 'no-such-dir');
    expect(await resolveFolderGrantWorkspaceId(gone)).toBe(`path:${gone}`);
  });

  it('normalises a path with a trailing separator and a dot segment to one key', async () => {
    // Two spellings of one folder must not become two buckets: the second would
    // silently hold no grants and the user would be asked again forever.
    const resolved = `path:${path.resolve(tmp)}`;
    expect(await resolveFolderGrantWorkspaceId(`${tmp}${path.sep}`)).toBe(resolved);
    expect(await resolveFolderGrantWorkspaceId(path.join(tmp, '.'))).toBe(resolved);
  });
});
