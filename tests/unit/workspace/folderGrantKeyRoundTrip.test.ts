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
 * - "the key is the workspace identity marker" - was wrong, because a chat
 * whose workspace the user picked in a file dialog has no marker and never will.
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
// Points the REAL `scanWorkspaceDirectory` at a fixture tree, so the marker
// half of the round trip runs through production code rather than a stand-in.
vi.mock('@process/services/projectWorkspace', () => ({
  defaultWorkspaceBaseDir: async () => workspaceBaseRef.value,
}));

import { WorkspaceFolderGrantStore } from '@process/services/workspace/folderGrantStore';
import { resolveFolderGrantWorkspaceId } from '@process/services/workspace/folderGrantWorkspaceId';
import { resolveFolderGrantWorkspaces } from '@process/services/workspace/folderGrantSurface';
import { buildWorkspaceMarker, writeWorkspaceMarker } from '@process/services/workspaceIdentity';
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
  markedWorkspace = path.join(workspaceBaseRef.value, 'Projects', 'Ledger');
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
  it('finds a grant filed against an ALLOCATED (marked) workspace', async () => {
    const key = await fileGrantFromConsent(markedWorkspace);
    expect(key.startsWith('marker:')).toBe(true);

    const located = await locateFromSettings();

    expect(located.get(key)).toEqual({ dir: markedWorkspace, displayName: 'Ledger' });
  });

  it('finds a grant filed against a USER-PICKED (unmarked) workspace', async () => {
    // The case the marker-only premise made dead: most chats.
    const key = await fileGrantFromConsent(unmarkedWorkspace);
    expect(key.startsWith('path:')).toBe(true);

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

describe('the two key namespaces are disjoint by construction', () => {
  /**
   * THE reason the prefix exists. The marker file lives INSIDE the workspace,
   * which the agent can write. Without prefixes, an agent could author a marker
   * whose id is literally another workspace's path key and inherit that
   * workspace's entire grant list.
   */
  it('a forged marker naming another workspace path cannot reach that workspace grants', async () => {
    const victimKey = await fileGrantFromConsent(unmarkedWorkspace);
    expect(victimKey).toBe(`path:${unmarkedWorkspace}`);

    // The attack: a workspace whose marker claims the victim's key as its id.
    const attacker = path.join(workspaceBaseRef.value, 'Projects', 'Attacker');
    mkdirSync(attacker, { recursive: true });
    await writeWorkspaceMarker(attacker, {
      schemaVersion: 1,
      workspaceId: victimKey,
      ownerKind: 'project',
      ownerId: null,
      displayName: 'Attacker',
      createdAtMs: 1_700_000_000_000,
    });

    const attackerKey = await resolveFolderGrantWorkspaceId(attacker);

    expect(attackerKey).toBe(`marker:${victimKey}`);
    expect(attackerKey).not.toBe(victimKey);
    // The victim's grants are filed under the victim's key alone.
    expect((await store.list(attackerKey!)).grants).toEqual([]);
    expect((await store.list(victimKey)).grants).toHaveLength(1);
  });
});
