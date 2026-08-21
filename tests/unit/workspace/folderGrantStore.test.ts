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

import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { execSync } from 'node:child_process';
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

/**
 * The canonical form of `p` as the OPERATING SYSTEM reports it.
 *
 * NOT `fs.realpathSync`, which is a JS reimplementation: on Windows it neither
 * expands an 8.3 short name nor corrects the on-disk case. The store
 * canonicalises with `fs/promises.realpath`, the native binding, which does
 * both - so a fixture built with the JS version disagrees with every root the
 * store returns. Both forms were live on CI at once: `os.tmpdir()` is
 * `C:\\Users\\RUNNER~1\\AppData\\Local\\Temp` on a GitHub Windows runner.
 *
 * `realpathSync.native` and `fs/promises.realpath` are the same OS call, so
 * this is the filesystem's own answer and not a copy of the code under test.
 */
const canonical = (p: string): string => realpathSync.native(p);

const tmpRoots: string[] = [];
const WS = 'marker:ws-alpha';

function tmpRoot(): string {
  const root = mkdtempSync(path.join(canonical(os.tmpdir()), 'wl-grants-'));
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
    expect(accepted(ok).grant.root).toBe(canonical(fx.allowed));
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

  /**
   * The credential-store list is `$HOME`-RELATIVE. Core's `SECRET_DIR_SEGMENTS`
   * are not - `is_secret_path_static` matches `/.ssh/` anywhere in the path,
   * and `grantable_read_root_shape` applies it to the folder it is about to
   * grant (`v0.13.4:crates/wcore-tools/src/workspace_policy.rs`).
   *
   * So a copy of `.ssh` outside `$HOME` was ACCEPTED here and REFUSED by the
   * engine. No authority leaked - Core fails closed - but it produced the exact
   * failure this mirror exists to prevent: an entry in Settings that quietly
   * holds nothing, for a folder the card said had been opened.
   */
  it('refuses a credential directory that lives OUTSIDE the home directory', async () => {
    const outside = path.join(fx.home, '..', 'opt', 'deploy', '.ssh', 'keys');
    mkdirSync(outside, { recursive: true });
    expect(await refusalOf(outside)).toBe('credential_store');

    // Positive control in the same tree: a sibling under the same non-home
    // parent IS grantable, so the refusal is the `.ssh` segment and not the
    // location. Without this the assertion above would pass on a fixture that
    // never reached the check.
    const sibling = path.join(fx.home, '..', 'opt', 'deploy', 'config');
    mkdirSync(sibling, { recursive: true });
    expect(accepted(await addAllowed(sibling)).grant.root).toBe(canonical(sibling));
  });

  it('refuses a folder whose own name is a secret shape, and grants its sibling', async () => {
    const cases = ['certs.pem', 'signing.KEY', 'id_rsa', 'service-account-prod.json', 'terraform.tfstate'];
    for (const name of cases) {
      const dir = path.join(fx.allowed, name);
      mkdirSync(dir, { recursive: true });
      expect([name, await refusalOf(dir)]).toEqual([name, 'credential_store']);
    }
    // Positive control, and the boundary Core draws: `monkey.json` is NOT a
    // secret shape, so a folder named that is grantable.
    const benign = path.join(fx.allowed, 'monkey.json');
    mkdirSync(benign, { recursive: true });
    expect(accepted(await addAllowed(benign)).grant.root).toBe(canonical(benign));
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
    expect(accepted(outcome).grant.root).toBe(canonical(fx.allowed));
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

/**
 * Aliases `realpath` does NOT collapse.
 *
 * Every refusal above compares PATHNAMES, and a pathname is not an identity.
 * On macOS the Data-volume firmlink gives a second real spelling of any path
 * under `/` - `realpath` returns each unchanged and reveals nothing - so the
 * home, credential-store and Wayland-private refusals were all bypassable by
 * spelling on the platform Wayland ships to. The Linux (`mount --bind`) and
 * Windows (`mountvol`) shapes are the same defect through a different door.
 *
 * These are darwin-only because a bind mount needs root and Windows volume
 * mount points need a spare volume, while the firmlink is present on every Mac
 * since 10.15 and needs no privileges at all.
 */
/**
 * Two directories on the same device whose inode numbers are DISTINCT but
 * collapse to the same double, or null when this machine has no such pair.
 *
 * Searched rather than hard-coded: which directories collide depends on the
 * volume, not on the OS version.
 */
function findLossyInodePair(): [string, string] | null {
  if (process.platform !== 'darwin') return null;
  const seen = new Map<string, { dir: string; ino: bigint }>();
  for (const base of ['/System/Volumes', '/System/Applications', '/System/Library']) {
    let names: string[];
    try {
      names = readdirSync(base);
    } catch {
      continue;
    }
    for (const name of names) {
      const dir = path.join(base, name);
      let stat: ReturnType<typeof statSync>;
      try {
        stat = statSync(dir, { bigint: true }) as never;
      } catch {
        continue;
      }
      const big = stat as unknown as { dev: bigint; ino: bigint; isDirectory(): boolean };
      if (!big.isDirectory()) continue;
      const asDouble = `${big.dev}:${Number(big.ino)}`;
      const prior = seen.get(asDouble);
      if (prior && prior.ino !== big.ino) return [prior.dir, dir];
      if (!prior) seen.set(asDouble, { dir, ino: big.ino });
    }
  }
  return null;
}

const lossyInodePair = findLossyInodePair();

describe('WorkspaceFolderGrantStore.add - aliases realpath does not collapse', () => {
  /** Every path under `/` has a second real spelling beneath this. */
  const DATA_VOLUME = '/System/Volumes/Data';
  const onMac = process.platform === 'darwin' ? it : it.skip;

  /** The alias is only evidence if it really is the same directory, unresolved. */
  const assertIsAnUncollapsedAlias = (alias: string, real: string): void => {
    const aliasStat = statSync(alias, { bigint: true });
    const realStat = statSync(real, { bigint: true });
    expect(`${aliasStat.dev}:${aliasStat.ino}`).toBe(`${realStat.dev}:${realStat.ino}`);
    expect(realpathSync.native(alias)).not.toBe(real);
  };

  onMac('refuses the home directory reached through a firmlink alias', async () => {
    const alias = DATA_VOLUME + fx.home;
    assertIsAnUncollapsedAlias(alias, fx.home);

    expect(await refusalOf(alias)).toBe('home_directory');

    // Positive control AND the mechanism: the SAME alias prefix over a folder
    // that is not protected is still accepted, and is stored under the aliased
    // spelling. So the refusal above is the identity of the target directory,
    // not a blanket ban on the prefix.
    const permitted = DATA_VOLUME + fx.allowed;
    expect(accepted(await fx.store.add({ workspaceId: WS, root: permitted, origin: 'settings' })).grant.root).toBe(
      permitted
    );
  });

  onMac('refuses a credential store, and a folder inside one, reached through a firmlink alias', async () => {
    const store = path.join(fx.home, '.ssh');
    assertIsAnUncollapsedAlias(DATA_VOLUME + store, store);
    expect(await refusalOf(DATA_VOLUME + store)).toBe('credential_store');

    // The ancestor direction: the alias itself is not a credential store, but
    // it lives under one.
    const inside = path.join(store, 'keys');
    mkdirSync(inside, { recursive: true });
    expect(await refusalOf(DATA_VOLUME + inside)).toBe('credential_store');

    expect((await addAllowed()).ok).toBe(true);
  });

  /**
   * Identity has to be read EXACTLY, or it over-refuses.
   *
   * APFS inode numbers routinely exceed `Number.MAX_SAFE_INTEGER` - the ones
   * under `/System` sit around 1.15e18, where the gap between adjacent doubles
   * is 256 - so sibling directories created moments apart round to the same
   * double. A default `fs.stat` would report two DISTINCT directories as the
   * same one and refuse a folder the user is entitled to grant.
   *
   * The pair is discovered at run time rather than hard-coded, because which
   * directories collide is a property of the machine, not of macOS.
   */
  (lossyInodePair ? onMac : it.skip)(
    'keeps two directories distinct when their inode numbers round to the same double',
    async () => {
      const [first, second] = lossyInodePair!;
      // Precondition: really distinct, and really indistinguishable as doubles.
      expect(statSync(first, { bigint: true }).ino === statSync(second, { bigint: true }).ino).toBe(false);
      expect(Number(statSync(first, { bigint: true }).ino)).toBe(Number(statSync(second, { bigint: true }).ino));

      const store = new WorkspaceFolderGrantStore(fx.file, async () => ({
        homeDir: fx.home,
        waylandPrivateRoots: [first],
      }));

      // `second` is a different directory, so it stays grantable.
      const outcome = await store.add({ workspaceId: WS, root: second, origin: 'settings' });
      expect(outcome.ok === false ? `REFUSED ${outcome.refusal}` : outcome.addition.grant.root).toBe(second);

      // Positive control: `first` really is off limits through this store, so
      // the acceptance above is the precision of the compare and not a store
      // that would have accepted anything.
      const refused = await store.add({ workspaceId: WS, root: first, origin: 'settings' });
      expect(refused.ok === false ? refused.refusal : 'UNEXPECTEDLY ACCEPTED').toBe('wayland_private');
    }
  );

  onMac("refuses Wayland's own storage in both directions through a firmlink alias", async () => {
    assertIsAnUncollapsedAlias(DATA_VOLUME + fx.waylandPrivate, fx.waylandPrivate);
    expect(await refusalOf(DATA_VOLUME + fx.waylandPrivate)).toBe('wayland_private');
    expect(await refusalOf(DATA_VOLUME + path.join(fx.waylandPrivate, 'nested'))).toBe('wayland_private');
    // The contains direction: an alias of the folder that HOLDS Wayland's
    // config discloses it just as completely.
    expect(await refusalOf(DATA_VOLUME + path.dirname(fx.waylandPrivate))).toBe('wayland_private');

    expect((await addAllowed()).ok).toBe(true);
  });
});

/**
 * Windows 8.3 short names.
 *
 * `fs/promises.realpath` calls the native binding and expands them;
 * `fs.realpathSync` is a JS reimplementation and does NOT, which is how a short
 * name has slipped past a path check in this repo before. Nothing pinned which
 * one the classifier uses, so the correct behaviour was unguarded.
 *
 * Only meaningful on Windows, and only when the volume still generates 8.3
 * names - `fsutil 8dot3name` can turn that off per volume. When it is off the
 * test asserts the weaker thing that is still true rather than failing for a
 * reason that has nothing to do with the code.
 */
describe('WorkspaceFolderGrantStore.add - Windows short names', () => {
  const onWindows = process.platform === 'win32' ? it : it.skip;

  onWindows('expands an 8.3 short name before the root is stored', async () => {
    const long = path.join(fx.home, 'Quarterly Reports Archive');
    mkdirSync(long, { recursive: true });
    // `execSync`, NOT `execFileSync('cmd', [...])`. Node escapes an argv entry
    // containing a double quote the MSVCRT way (backslash-escaped), and cmd.exe
    // does not read backslash escapes - so the argv form reaches cmd as
    // `F:\\"F:\\...\\Quarterly Reports Archive\\"` and echoes that back. A `"` is
    // illegal in a Windows filename, so the store refused it as
    // `not_an_absolute_directory` and this test failed for a reason that had
    // nothing to do with short names. `execSync` hands cmd.exe the string it
    // already expects. Verified on a real Windows host, both forms side by side.
    const short = execSync(`for %I in ("${long}") do @echo %~sI`, { encoding: 'utf8' }).trim();

    const outcome = await fx.store.add({ workspaceId: WS, root: short, origin: 'settings' });

    // Either way the stored root is the LONG canonical form. When the volume
    // still makes short names this is the real regression pin; when it does not
    // (`short === long`) it degrades to the ordinary canonicalisation check
    // rather than to a false pass on an untested path.
    expect(accepted(outcome).grant.root).toBe(long);
    expect(short.length > 0).toBe(true);
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
    expect(remaining.map((g) => g.root)).toEqual([canonical(fx.allowed)]);
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
    expect(grants[0].root).toBe(canonical(fx.allowed));
    expect(grants[0].access).toBe('read');
  });

  it('never leaks a grant from one workspace into another', async () => {
    const grantId = accepted(await addAllowed()).grant.grantId;

    expect((await fx.store.list('marker:ws-beta')).grants).toEqual([]);
    // MECHANISM: the other workspace cannot even reach the entry by its id.
    expect(await fx.store.remove('marker:ws-beta', grantId)).toBeNull();
    expect((await fx.store.list(WS)).grants).toHaveLength(1);

    // Positive control: the OWNING workspace can remove it, so the null above
    // is scoping and not a broken id.
    expect((await fx.store.remove(WS, grantId))?.grantId).toBe(grantId);
    expect((await fx.store.list(WS)).grants).toEqual([]);
  });

  /**
   * The prefixes were until now only a call-site convention: every writer
   * happened to use them and NOTHING checked. That is the whole load-bearing
   * property - `marker:` and `path:` are disjoint so a marker file the agent
   * can write cannot name another workspace's path key - and a convention
   * nothing enforces is not a boundary.
   */
  it('refuses to record a grant under any key outside the two derived namespaces', async () => {
    for (const key of ['', 'ws-alpha', 'marker:', 'path:', 'path:relative/dir', 'marker:ok\0extra', 'Marker:x']) {
      await expect(fx.store.add({ workspaceId: key, root: fx.allowed, origin: 'settings' })).rejects.toThrow(
        /workspace id/
      );
    }
    // Positive control, one per namespace: the same root under a key the
    // production derivation actually produces IS recorded, so the rejections
    // above are the key contract and not the fixture.
    expect(accepted(await addAllowed()).created).toBe(true);
    const byPath = await fx.store.add({
      workspaceId: `path:${fx.allowed}`,
      root: fx.allowed,
      origin: 'settings',
    });
    expect(accepted(byPath).created).toBe(true);
  });

  /**
   * The `__proto__` case moved to the LOAD path when `add` became strict about
   * keys: `__proto__` is not a key `add` will now accept, so the only way one
   * reaches the store is a hand-edited file - which is exactly the case
   * `Object.create(null)` was written for.
   */
  it('cannot have its prototype polluted by a hand-edited workspace key', async () => {
    accepted(await addAllowed());
    // Spliced into the TEXT, not assigned as a property: `raw.__proto__ = x` on
    // a JSON.parse'd object reassigns the prototype and `JSON.stringify` then
    // emits nothing, so the doctored fixture would never reach the store and
    // this test would pass having proved nothing.
    const original = readFileSync(fx.file, 'utf8');
    const doctored = original.replace(
      '"workspaces": {',
      `"workspaces": {\n    "__proto__": [{"grantId":"g-proto","root":${JSON.stringify(fx.allowed)},"access":"read","grantedAtMs":1,"origin":"settings"}],`
    );
    expect(doctored).not.toBe(original);
    writeFileSync(fx.file, doctored);

    const all = await fx.store.listAll();

    // MECHANISM: the bucket landed as an ORDINARY OWN PROPERTY of a
    // null-prototype object, not as a reassigned prototype.
    expect(({} as Record<string, unknown>).grants).toBeUndefined();
    expect((await fx.store.list('marker:ws-unrelated')).grants).toEqual([]);
    // And it is reported, not trusted: a key nothing derives is never live.
    const polluted = all.find((entry) => entry.workspaceId === '__proto__');
    expect(polluted?.grants).toEqual([]);
    expect(polluted?.withheld.map((entry) => entry.reason)).toEqual(['unrecognised_workspace_key']);
    // Positive control: the legitimately keyed workspace in the same file is
    // still live, so the withholding above is the key and not a dead read.
    expect(all.find((entry) => entry.workspaceId === WS)?.grants).toHaveLength(1);
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
      expect(context.waylandPrivateRoots).toContain(canonical(path.join(profiles, 'work')));
    } finally {
      delete process.env.WAYLAND_PROFILES_ROOT;
    }
  });
});
