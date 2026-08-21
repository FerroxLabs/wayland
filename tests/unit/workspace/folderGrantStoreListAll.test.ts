/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `listAll` - what the Settings surface reads.
 *
 * The store's `list(workspaceId)` answers "what may THIS workspace reach",
 * which is the wrong question for an audit surface: it can only show entries
 * for workspaces the caller already thought to ask about. The one entry a user
 * most needs to find is the one belonging to a workspace they have forgotten.
 *
 * Driven through the real store against a real file, never a stub, because a
 * projection proved against a fake reader can be unwired from the reader.
 */

import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const userDataRef = vi.hoisted(() => ({ value: '' }));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => userDataRef.value },
}));
vi.mock('@process/utils', () => ({
  getConfigPath: () => path.join(userDataRef.value, 'config'),
  getDataPath: () => path.join(userDataRef.value, 'wayland'),
}));

import { WorkspaceFolderGrantStore } from '@process/services/workspace/folderGrantStore';
import type { FolderGrantRootContext } from '@process/services/workspace/folderGrantRoots';

const roots: string[] = [];
let store: WorkspaceFolderGrantStore;
let allowedA: string;
let allowedB: string;

afterAll(() => {
  for (const root of roots) {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Temp dirs are reaped by the OS.
    }
  }
});

beforeEach(() => {
  const root = mkdtempSync(path.join(realpathSync(os.tmpdir()), 'wl-grants-listall-'));
  roots.push(root);
  const home = path.join(root, 'home');
  allowedA = path.join(home, 'Reference');
  allowedB = path.join(home, 'Archive');
  mkdirSync(allowedA, { recursive: true });
  mkdirSync(allowedB, { recursive: true });
  const context: FolderGrantRootContext = {
    homeDir: home,
    waylandPrivateRoots: [path.join(root, 'app-data', 'config')],
  };
  store = new WorkspaceFolderGrantStore(path.join(root, 'workspace-folder-grants.json'), async () => context);
});

describe('WorkspaceFolderGrantStore.listAll', () => {
  it('reports every workspace holding a grant, keyed by id', async () => {
    const a = await store.add({ workspaceId: 'marker:ws-a', root: allowedA, origin: 'consent_card' });
    const b = await store.add({ workspaceId: 'marker:ws-b', root: allowedB, origin: 'settings' });
    // Positive control: both adds were accepted, so an empty result below would
    // be a real defect rather than a fixture that never reached the store.
    expect(a.ok && b.ok).toBe(true);

    const all = await store.listAll();

    expect(all.map((entry) => entry.workspaceId).sort()).toEqual(['marker:ws-a', 'marker:ws-b']);
    expect(all.find((entry) => entry.workspaceId === 'marker:ws-a')!.grants[0]).toMatchObject({
      root: allowedA,
      origin: 'consent_card',
      access: 'read',
    });
  });

  it('omits a workspace whose last grant was removed, rather than showing an empty row', async () => {
    const added = await store.add({ workspaceId: 'marker:ws-a', root: allowedA, origin: 'settings' });
    // `=== false`, never `!added.ok`: without strictNullChecks a truthiness
    // test will not narrow a boolean-literal discriminant.
    if (added.ok === false) throw new Error(`fixture add refused: ${added.refusal}`);
    await store.add({ workspaceId: 'marker:ws-b', root: allowedB, origin: 'settings' });

    await store.remove('marker:ws-a', added.addition.grant.grantId);

    const all = await store.listAll();
    expect(all.map((entry) => entry.workspaceId)).toEqual(['marker:ws-b']);
  });

  it('is empty before anyone has consented to anything', async () => {
    expect(await store.listAll()).toEqual([]);
  });
});
