/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A grant filed by the CONSENT path must be found by the SETTINGS path.
 *
 * These are two lanes computing the same workspace key from opposite ends, and
 * the failure mode is silent: the consent card files a grant, Settings shows an
 * empty list, and nothing is red anywhere. The premise both lanes started from
 * - "the key is the workspace identity marker" - was wrong twice over. It was
 * wrong on reach, because a chat whose workspace the user picked in a file
 * dialog has no marker and never will; and it was wrong on safety, because the
 * marker is a file inside the workspace the agent can write, which made it an
 * authority selector. The key is the resolved PATH now, for every workspace.
 *
 * So this file NEVER hands the same literal key to both sides. It derives the
 * key from a real directory with `resolveFolderGrantWorkspaceId` (what the
 * consent path calls), files a grant under it through the real store, and then
 * asks the Settings resolver to find that folder again from nothing but the
 * persisted key. Passing the same string to both halves would be green while
 * the product is broken.
 */

import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const userDataRef = vi.hoisted(() => ({ value: '' }));
const workspaceBaseRef = vi.hoisted(() => ({ value: '' }));

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => userDataRef.value },
}));
vi.mock('@process/utils', () => ({
  getConfigPath: () => path.join(userDataRef.value, 'config'),
  getDataPath: () => path.join(userDataRef.value, 'wayland'),
}));

import { WorkspaceFolderGrantStore } from '@process/services/workspace/folderGrantStore';
import { resolveFolderGrantWorkspaceId } from '@process/services/workspace/folderGrantWorkspaceId';
import { resolveFolderGrantWorkspaces } from '@process/services/workspace/folderGrantSurface';
import { buildWorkspaceMarker, readWorkspaceMarker, writeWorkspaceMarker } from '@process/services/workspaceIdentity';
import type { FolderGrantRootContext } from '@process/services/workspace/folderGrantRoots';

const roots: string[] = [];
let store: WorkspaceFolderGrantStore;
let markedWorkspace: string;
let unmarkedWorkspace: string;
let grantable: string;

afterAll(() => {
  for (const root of roots) {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Temp dirs are reaped by the OS.
    }
  }
});

beforeEach(async () => {
  const root = mkdtempSync(path.join(realpathSync(os.tmpdir()), 'wl-grant-key-'));
  roots.push(root);
  const home = path.join(root, 'home');
  grantable = path.join(home, 'Reference');
  mkdirSync(grantable, { recursive: true });

  // A workspace Wayland ALLOCATED: nested under the managed base, marked.
  workspaceBaseRef.value = path.join(root, 'Documents', 'Wayland');
  // Folder name deliberately UNLIKE the marker's display name, so "displayName
  // is 'Ledger'" can only be true if the marker file was actually read.
  markedWorkspace = path.join(workspaceBaseRef.value, 'Projects', 'ws-8f21c4');
  mkdirSync(markedWorkspace, { recursive: true });
  await writeWorkspaceMarker(
    markedWorkspace,
    buildWorkspaceMarker({ ownerKind: 'project', ownerId: 'p-1', displayName: 'Ledger' })
  );

  // A workspace the USER picked in a file dialog: no marker, and never will have one.
  unmarkedWorkspace = path.join(home, 'Code', 'my-app');
  mkdirSync(unmarkedWorkspace, { recursive: true });

  userDataRef.value = path.join(root, 'app-data');
  const context: FolderGrantRootContext = {
    homeDir: home,
    waylandPrivateRoots: [path.join(root, 'app-data', 'config')],
  };
  store = new WorkspaceFolderGrantStore(path.join(root, 'workspace-folder-grants.json'), async () => context);
});

/** File a grant exactly the way the consent path does: derive the key, then add. */
async function fileGrantFromConsent(workspaceDir: string): Promise<string> {
  const workspaceId = await resolveFolderGrantWorkspaceId(workspaceDir);
  if (!workspaceId) throw new Error(`no honest key for ${workspaceDir}`);
  const outcome = await store.add({ workspaceId, root: grantable, origin: 'consent_card' });
  // `=== false`, never `!outcome.ok`: without strictNullChecks a truthiness
  // test does not narrow a boolean-literal discriminant.
  if (outcome.ok === false) throw new Error(`fixture add refused: ${outcome.refusal}`);
  return workspaceId;
}

/** Read the list back exactly the way the Settings provider does. */
async function locateFromSettings(): Promise<Map<string, { dir: string; displayName: string }>> {
  const records = await store.listAll();
  return resolveFolderGrantWorkspaces(records.map((record) => record.workspaceId));
}

describe('the consent key and the settings lookup are the same key space', () => {
  it('finds a grant filed against an ALLOCATED (marked) workspace, and names it from the marker', async () => {
    const key = await fileGrantFromConsent(markedWorkspace);
    // Path-keyed like every other workspace. The marker no longer selects the
    // bucket; it is read back only as a LABEL, which is what `displayName`
    // below proves - 'Ledger' is a name only the marker file carries.
    expect(key).toBe(`path:${markedWorkspace}`);

    const located = await locateFromSettings();

    expect(located.get(key)).toEqual({ dir: markedWorkspace, displayName: 'Ledger' });
    expect(located.get(key)?.displayName).not.toBe(path.basename(markedWorkspace));
  });

  it('finds a grant filed against a USER-PICKED (unmarked) workspace', async () => {
    // The case the marker-only premise made dead: most chats.
    const key = await fileGrantFromConsent(unmarkedWorkspace);
    expect(key).toBe(`path:${unmarkedWorkspace}`);

    const located = await locateFromSettings();

    expect(located.get(key)).toEqual({ dir: unmarkedWorkspace, displayName: 'my-app' });
  });

  it('finds both at once, so neither half is served by the other half falling through', async () => {
    const markedKey = await fileGrantFromConsent(markedWorkspace);
    const unmarkedKey = await fileGrantFromConsent(unmarkedWorkspace);
    expect(markedKey).not.toEqual(unmarkedKey);

    const located = await locateFromSettings();

    expect(located.get(markedKey)?.dir).toBe(markedWorkspace);
    expect(located.get(unmarkedKey)?.dir).toBe(unmarkedWorkspace);
  });

  it('lists a grant whose workspace folder is gone, and locates nothing for it', async () => {
    const key = await fileGrantFromConsent(unmarkedWorkspace);
    rmSync(unmarkedWorkspace, { recursive: true, force: true });

    // Still recorded - that is the entry a user most needs to be able to revoke.
    expect((await store.listAll()).map((record) => record.workspaceId)).toContain(key);
    // But never located, so nothing is shown at a path that is no longer there.
    expect((await locateFromSettings()).has(key)).toBe(false);
  });
});

describe('nothing the agent can write selects the bucket', () => {
  /**
   * ATTACK A, end to end through the store this time. The marker file lives
   * INSIDE the workspace, which the agent can write. Under the old key an agent
   * that authored a marker carrying another workspace's id inherited that
   * workspace's entire grant list.
   */
  it('ATTACK A: a forged marker id does not reach the victim workspace grants', async () => {
    const victimKey = await fileGrantFromConsent(markedWorkspace);
    expect((await store.list(victimKey)).grants).toHaveLength(1);
    const victimMarker = await readWorkspaceMarker(markedWorkspace);
    expect(victimMarker?.workspaceId).toBeTruthy();

    // The attack: a second workspace whose marker claims the victim's id.
    const attacker = path.join(workspaceBaseRef.value, 'Projects', 'Attacker');
    mkdirSync(attacker, { recursive: true });
    await writeWorkspaceMarker(attacker, { ...victimMarker!, displayName: 'Attacker' });

    const attackerKey = await resolveFolderGrantWorkspaceId(attacker);

    expect(attackerKey).toBe(`path:${attacker}`);
    expect(attackerKey).not.toBe(victimKey);
    // The bucket it actually reads is empty, and the victim's is untouched.
    expect((await store.list(attackerKey!)).grants).toEqual([]);
    expect((await store.list(victimKey)).grants).toHaveLength(1);
  });

  /**
   * ATTACK B, end to end. No id is needed: an unmarked workspace accumulates
   * grants at a pathname, a MARKED workspace later occupies the same pathname,
   * and the agent deletes its own marker to fall back into the old bucket.
   * There is no fall-back branch any more, so the marker's presence is not a
   * lever at all - which the store list proves in both directions.
   */
  it('ATTACK B: deleting the marker neither gains nor loses a bucket', async () => {
    const key = await fileGrantFromConsent(unmarkedWorkspace);
    expect((await store.list(key)).grants).toHaveLength(1);

    // The replacement workspace at the SAME pathname, this time marked.
    await writeWorkspaceMarker(
      unmarkedWorkspace,
      buildWorkspaceMarker({ ownerKind: 'project', ownerId: 'p-2', displayName: 'Replacement' })
    );
    const markedKey = await resolveFolderGrantWorkspaceId(unmarkedWorkspace);
    expect(markedKey).toBe(key);

    // The attack: drop the marker to fall back onto the path key.
    rmSync(path.join(unmarkedWorkspace, '.wayland-workspace.json'));
    const afterDeletion = await resolveFolderGrantWorkspaceId(unmarkedWorkspace);

    expect(afterDeletion).toBe(key);
    // CONTROL: a workspace at a DIFFERENT pathname really does read a different
    // (empty) bucket, so the equalities above are not one constant key.
    const elsewhere = await resolveFolderGrantWorkspaceId(markedWorkspace);
    expect(elsewhere).not.toBe(key);
    expect((await store.list(elsewhere!)).grants).toEqual([]);
  });
});
