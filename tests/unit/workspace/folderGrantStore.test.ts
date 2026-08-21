/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The durable per-workspace folder-grant list.
 *
 * Every refusal here is exercised through `store.add()` - the production call
 * site - and never through the classifier directly, because a guard that is
 * only proven against the predicate can be unwired from the store while the
 * whole suite stays green.
 *
 * Every "X is refused" case carries a positive control in the same test: an
 * add that MUST succeed. Without it the refusal assertion can pass because the
 * fixture never reached the code at all.
 */

import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const userDataRef = vi.hoisted(() => ({ value: '' }));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => userDataRef.value },
}));
// Without this the store's lazy singleton would resolve the developer's real
// ~/.wayland-config and the suite would write a grant list into it.
vi.mock('@process/utils', () => ({
  getConfigPath: () => path.join(userDataRef.value, 'config'),
  getDataPath: () => path.join(userDataRef.value, 'wayland'),
}));

import {
  MAX_FOLDER_GRANTS_PER_WORKSPACE,
  WorkspaceFolderGrantStore,
  defaultFolderGrantRootContext,
  type FolderGrantAddResult,
  type FolderGrantAddition,
} from '../../../src/process/services/workspace/folderGrantStore';
import type { FolderGrantRootContext } from '../../../src/process/services/workspace/folderGrantRoots';

const tmpRoots: string[] = [];
const WS = 'ws-alpha';

function tmpRoot(): string {
  const root = mkdtempSync(path.join(realpathSync(os.tmpdir()), 'wl-grants-'));
  tmpRoots.push(root);
  return root;
}

afterAll(() => {
  for (const root of tmpRoots) {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Temp dirs are reaped by the OS.
    }
  }
});

type Fixture = {
  store: WorkspaceFolderGrantStore;
  file: string;
  home: string;
  waylandPrivate: string;
  allowed: string;
  context: FolderGrantRootContext;
};

let fx: Fixture;

beforeEach(() => {
  const root = tmpRoot();
  const home = path.join(root, 'home');
  const waylandPrivate = path.join(root, 'app-data', 'config');
  const allowed = path.join(home, 'Projects');
  mkdirSync(allowed, { recursive: true });
  mkdirSync(path.join(home, '.ssh'), { recursive: true });
  mkdirSync(path.join(home, '.config', 'gh'), { recursive: true });
  mkdirSync(path.join(waylandPrivate, 'nested'), { recursive: true });
  const context: FolderGrantRootContext = { homeDir: home, waylandPrivateRoots: [waylandPrivate] };
  const file = path.join(root, 'workspace-folder-grants.json');
  fx = {
    store: new WorkspaceFolderGrantStore(file, async () => context),
    file,
    home,
    waylandPrivate,
    allowed,
    context,
  };
});

const addAllowed = (root?: string) => fx.store.add({ workspaceId: WS, root: root ?? fx.allowed, origin: 'settings' });

/**
 * Unwrap an accepted add.
 *
 * Written as a helper because the tempting `outcome.ok && outcome.addition.x`
 * idiom silently collapses a REFUSAL to `false`, which makes every
 * `.toBe(false)` assertion pass on the exact failure it was written to catch.
 * A mutation that refused where it should have accepted survived that idiom.
 */
function accepted(outcome: FolderGrantAddResult): FolderGrantAddition {
  if (!outcome.ok) throw new Error(`expected the add to be accepted, got refusal: ${outcome.refusal}`);
  return outcome.addition;
}

const refusalOf = async (root: string): Promise<string> => {
  const outcome = await fx.store.add({ workspaceId: WS, root, origin: 'settings' });
  return outcome.ok ? `UNEXPECTEDLY ACCEPTED ${root}` : outcome.refusal;
};

describe('WorkspaceFolderGrantStore.add - refusals', () => {
  it('refuses the filesystem root while a real folder is still grantable', async () => {
    expect(await refusalOf('/')).toBe('root_of_filesystem');
    // Positive control: the refusal above is a decision, not a dead path.
    const ok = await addAllowed();
    expect(ok.ok).toBe(true);
  });

  it('refuses a Windows drive root on every host', async () => {
    expect(await refusalOf('C:\\')).toBe('root_of_filesystem');
    expect(await refusalOf('D:/')).toBe('root_of_filesystem');
    expect((await addAllowed()).ok).toBe(true);
  });

  it('refuses a symlink that launders the filesystem root', async () => {
    const launder = path.join(fx.home, 'looks-harmless');
    symlinkSync('/', launder, 'dir');
    expect(await refusalOf(launder)).toBe('root_of_filesystem');

    // Positive control AND the mechanism: an ordinary symlink is accepted and
    // is stored CANONICALISED, which is what makes the check above meaningful.
    const benign = path.join(fx.home, 'shortcut');
    symlinkSync(fx.allowed, benign, 'dir');
    const ok = await fx.store.add({ workspaceId: WS, root: benign, origin: 'settings' });
    expect(accepted(ok).grant.root).toBe(realpathSync(fx.allowed));
  });

  it('refuses the home directory and anything containing it', async () => {
    expect(await refusalOf(fx.home)).toBe('home_directory');
    expect(await refusalOf(path.dirname(fx.home))).toBe('home_directory');
    expect((await addAllowed()).ok).toBe(true);
  });

  it("refuses Wayland's own storage in both directions", async () => {
    expect(await refusalOf(fx.waylandPrivate)).toBe('wayland_private');
    expect(await refusalOf(path.join(fx.waylandPrivate, 'nested'))).toBe('wayland_private');
    expect(await refusalOf(path.dirname(fx.waylandPrivate))).toBe('wayland_private');
    expect((await addAllowed()).ok).toBe(true);
  });

  it('refuses a credential store and any folder that contains one', async () => {
    expect(await refusalOf(path.join(fx.home, '.ssh'))).toBe('credential_store');
    // `~/.config` holds `~/.config/gh`: the store-is-under-dir direction.
    expect(await refusalOf(path.join(fx.home, '.config'))).toBe('credential_store');
    expect((await addAllowed()).ok).toBe(true);
  });

  it('refuses anything that is not an absolute path to a real directory', async () => {
    expect(await refusalOf('Projects')).toBe('not_an_absolute_directory');
    expect(await refusalOf(path.join(fx.home, 'no-such-folder'))).toBe('not_an_absolute_directory');
    expect(await refusalOf('')).toBe('not_an_absolute_directory');
    expect((await addAllowed()).ok).toBe(true);
  });

  it('stores the containing directory when the root names a file', async () => {
    const file = path.join(fx.allowed, 'notes.txt');
    writeFileSync(file, 'x');
    const outcome = await fx.store.add({ workspaceId: WS, root: file, origin: 'consent_card' });
    expect(accepted(outcome).grant.root).toBe(realpathSync(fx.allowed));
  });

  it("fails closed when Wayland's private roots cannot be resolved", async () => {
    const broken = new WorkspaceFolderGrantStore(fx.file, async () => {
      throw new Error('profile isolation');
    });
    const refused = await broken.add({ workspaceId: WS, root: fx.allowed, origin: 'settings' });
    expect(refused.ok ? 'ACCEPTED' : refused.refusal).toBe('wayland_private');
    // Positive control: the same root through a working resolver is accepted,
    // so the refusal above is the resolver failing, not the fixture.
    expect((await addAllowed()).ok).toBe(true);
  });
});

describe('WorkspaceFolderGrantStore.add - containment and the cap', () => {
  it('returns the covering grant unchanged when the folder is already covered', async () => {
    const first = accepted(await addAllowed());
    const nested = path.join(fx.allowed, 'sub', 'deeper');
    mkdirSync(nested, { recursive: true });

    const second = accepted(await fx.store.add({ workspaceId: WS, root: nested, origin: 'settings' }));
    expect(second.created).toBe(false);
    // MECHANISM: the revoke handle must be the ORIGINAL id. A store that
    // recorded a fresh entry would also leave `grants.length` looking plausible
    // if it replaced the old one, so the id is what is asserted.
    expect(second.grant.grantId).toBe(first.grant.grantId);
    expect((await fx.store.list(WS)).grants).toHaveLength(1);
  });

  it('supersedes the entries a newly granted parent covers', async () => {
    const a = path.join(fx.allowed, 'a');
    const b = path.join(fx.allowed, 'b');
    mkdirSync(a, { recursive: true });
    mkdirSync(b, { recursive: true });
    const first = accepted(await fx.store.add({ workspaceId: WS, root: a, origin: 'settings' }));
    const second = accepted(await fx.store.add({ workspaceId: WS, root: b, origin: 'settings' }));

    const parent = accepted(await addAllowed());
    expect(parent.created).toBe(true);
    expect(parent.superseded.map((g) => g.grantId).toSorted()).toEqual(
      [first.grant.grantId, second.grant.grantId].toSorted()
    );
    const remaining = (await fx.store.list(WS)).grants;
    expect(remaining.map((g) => g.root)).toEqual([realpathSync(fx.allowed)]);
  });

  it('refuses the grant past the cap but still accepts a covered re-grant', async () => {
    const roots: string[] = [];
    for (let i = 0; i < MAX_FOLDER_GRANTS_PER_WORKSPACE; i += 1) {
      const dir = path.join(fx.home, 'many', `folder-${i}`);
      mkdirSync(dir, { recursive: true });
      roots.push(dir);
      accepted(await fx.store.add({ workspaceId: WS, root: dir, origin: 'settings' }));
    }
    expect((await fx.store.list(WS)).grants).toHaveLength(MAX_FOLDER_GRANTS_PER_WORKSPACE);

    const overflow = path.join(fx.home, 'many', 'one-too-many');
    mkdirSync(overflow, { recursive: true });
    expect(await refusalOf(overflow)).toBe('grant_cap_reached');

    // MECHANISM: Core checks coverage BEFORE the cap, so a redundant re-grant
    // must still succeed against a full list. A store that checked the cap
    // first would refuse this one too.
    const covered = path.join(roots[0], 'inside');
    mkdirSync(covered, { recursive: true });
    const stillOk = accepted(await fx.store.add({ workspaceId: WS, root: covered, origin: 'settings' }));
    expect(stillOk.created).toBe(false);
  });
});

describe('WorkspaceFolderGrantStore - persistence and isolation', () => {
  it('keeps grant ids stable across store instances', async () => {
    const created = accepted(await addAllowed());
    const reopened = new WorkspaceFolderGrantStore(fx.file, async () => fx.context);
    const grants = (await reopened.list(WS)).grants;
    expect(grants).toHaveLength(1);
    expect(grants[0].grantId).toBe(created.grant.grantId);
    expect(grants[0].root).toBe(realpathSync(fx.allowed));
    expect(grants[0].access).toBe('read');
  });

  it('never leaks a grant from one workspace into another', async () => {
    const grantId = accepted(await addAllowed()).grant.grantId;

    expect((await fx.store.list('ws-beta')).grants).toEqual([]);
    // MECHANISM: the other workspace cannot even reach the entry by its id.
    expect(await fx.store.remove('ws-beta', grantId)).toBeNull();
    expect((await fx.store.list(WS)).grants).toHaveLength(1);

    // Positive control: the OWNING workspace can remove it, so the null above
    // is scoping and not a broken id.
    expect((await fx.store.remove(WS, grantId))?.grantId).toBe(grantId);
    expect((await fx.store.list(WS)).grants).toEqual([]);
  });

  it('refuses to record a grant with no workspace id', async () => {
    await expect(fx.store.add({ workspaceId: '', root: fx.allowed, origin: 'settings' })).rejects.toThrow(
      /workspace id/
    );
    // Positive control: the same root under a real id is recorded, so the
    // rejection above is the missing key and not the fixture.
    expect(accepted(await addAllowed()).created).toBe(true);
  });

  it('cannot have its prototype polluted by a workspace id', async () => {
    accepted(await fx.store.add({ workspaceId: '__proto__', root: fx.allowed, origin: 'settings' }));
    expect((await fx.store.list('__proto__')).grants).toHaveLength(1);
    expect((await fx.store.list('ws-unrelated')).grants).toEqual([]);
    expect(({} as Record<string, unknown>).grants).toBeUndefined();
  });
});

describe('defaultFolderGrantRootContext', () => {
  it("names Wayland's user-data and the engine config dir as private", async () => {
    const root = tmpRoot();
    userDataRef.value = root;
    // A NAMED profile, so the ACTIVE config dir is a value no other entry in
    // the list can supply. `$WAYLAND_HOME` alone would not discriminate:
    // `nativeConfigDir()` returns it too, so dropping `resolveActiveConfigDir`
    // would have left the assertion green.
    const profiles = path.join(root, 'profiles');
    mkdirSync(path.join(profiles, 'work'), { recursive: true });
    writeFileSync(path.join(profiles, 'active'), 'work');
    process.env.WAYLAND_PROFILES_ROOT = profiles;

    try {
      const context = await defaultFolderGrantRootContext();
      expect(context.homeDir).toBe(os.homedir());
      expect(context.waylandPrivateRoots).toContain(root);
      expect(context.waylandPrivateRoots).toContain(path.join(root, 'config'));
      expect(context.waylandPrivateRoots).toContain(realpathSync(path.join(profiles, 'work')));
    } finally {
      delete process.env.WAYLAND_PROFILES_ROOT;
    }
  });
});
