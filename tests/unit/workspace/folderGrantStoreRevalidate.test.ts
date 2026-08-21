/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What a READ of the durable folder-grant list decides.
 *
 * THE GAP THIS FILE EXISTS TO CLOSE. The rest of the store suite reopens the
 * store against an UNCHANGED filesystem, which proves only that JSON survives a
 * round trip. The dangerous case is the one where the filesystem moved between
 * the write and the read: a safe `/Volumes/reports` renamed away and replaced
 * by a symlink into Wayland's own config tree keeps its recorded spelling, and
 * every later reader believes it. Core cannot save us there - its refusals
 * cover `/`, `$HOME`-or-an-ancestor and a credential list, but not Wayland's
 * user-data directory, which is a host-only concept.
 *
 * So EVERY test here changes the filesystem between the write and the read.
 * Nothing is asserted against a store that was merely reopened.
 *
 * Written through the real store against a real file and real directories, and
 * every "this is withheld" case carries an untouched entry in the SAME
 * workspace that must still come back live - otherwise a store that withheld
 * everything, or read nothing at all, would pass.
 */

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
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

import {
  MAX_FOLDER_GRANTS_PER_WORKSPACE,
  WorkspaceFolderGrantStore,
} from '@process/services/workspace/folderGrantStore';
import type { FolderGrantRootContext } from '@process/services/workspace/folderGrantRoots';
import type { FolderGrant, FolderGrantWithheldReason } from '@/common/workspace/folderGrants';

const WS = 'marker:ws-alpha';
const tmpRoots: string[] = [];

type Fixture = {
  store: WorkspaceFolderGrantStore;
  file: string;
  home: string;
  waylandPrivate: string;
  /** Granted, then moved / replaced / deleted by each test. */
  target: string;
  /** Granted and left completely alone. The positive control in every test. */
  untouched: string;
  context: FolderGrantRootContext;
};

let fx: Fixture;

afterAll(() => {
  for (const root of tmpRoots) {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Temp dirs are reaped by the OS.
    }
  }
});

beforeEach(() => {
  const root = mkdtempSync(path.join(realpathSync(os.tmpdir()), 'wl-grants-reval-'));
  tmpRoots.push(root);
  const home = path.join(root, 'home');
  const waylandPrivate = path.join(root, 'app-data', 'config');
  const target = path.join(home, 'Reports');
  const untouched = path.join(home, 'Reference');
  mkdirSync(target, { recursive: true });
  mkdirSync(untouched, { recursive: true });
  mkdirSync(path.join(home, '.ssh'), { recursive: true });
  mkdirSync(path.join(waylandPrivate, 'keys'), { recursive: true });
  const context: FolderGrantRootContext = { homeDir: home, waylandPrivateRoots: [waylandPrivate] };
  const file = path.join(root, 'workspace-folder-grants.json');
  userDataRef.value = path.join(root, 'app-data');
  fx = {
    store: new WorkspaceFolderGrantStore(file, async () => context),
    file,
    home,
    waylandPrivate,
    target,
    untouched,
    context,
  };
});

/** Record both fixture folders the way a user would, and return the grant ids. */
async function grantBoth(): Promise<{ target: string; untouched: string }> {
  const ids: Record<string, string> = {};
  for (const [name, root] of [
    ['target', fx.target],
    ['untouched', fx.untouched],
  ] as const) {
    const outcome = await fx.store.add({ workspaceId: WS, root, origin: 'settings' });
    // `=== false`, never `!outcome.ok`: this project has no `strictNullChecks`,
    // so a truthiness test will not narrow a boolean-literal discriminant.
    if (outcome.ok === false) throw new Error(`fixture add refused ${root}: ${outcome.refusal}`);
    ids[name] = outcome.addition.grant.grantId;
  }
  return { target: ids.target, untouched: ids.untouched };
}

/**
 * Read the workspace back through a FRESH store instance, so nothing can be
 * served out of an in-memory leftover from the write.
 */
function reopen(): WorkspaceFolderGrantStore {
  return new WorkspaceFolderGrantStore(fx.file, async () => ({ ...fx.context }));
}

/**
 * Assert one entry was withheld for `reason` while the untouched entry in the
 * same workspace is still live.
 *
 * Returned as an object rather than asserted through `x.ok && x.y`, which
 * collapses a refusal to `false` and passes on the exact failure it was written
 * to catch.
 */
async function readBack(): Promise<{
  liveIds: string[];
  withheldFor: (grantId: string) => FolderGrantWithheldReason | 'NOT WITHHELD';
  recordedIds: string[];
}> {
  const record = await reopen().list(WS);
  const onDisk: FolderGrant[] = JSON.parse(readFileSync(fx.file, 'utf8')).workspaces[WS];
  return {
    liveIds: record.grants.map((grant) => grant.grantId),
    withheldFor: (grantId) =>
      record.withheld.find((entry) => entry.grant.grantId === grantId)?.reason ?? 'NOT WITHHELD',
    recordedIds: onDisk.map((grant) => grant.grantId),
  };
}

describe('a read re-decides every recorded root against the filesystem as it is NOW', () => {
  it('withholds a grant whose folder was RENAMED away, and keeps it on disk', async () => {
    const ids = await grantBoth();
    renameSync(fx.target, path.join(fx.home, 'Reports-moved'));

    const read = await readBack();

    expect(read.withheldFor(ids.target)).toBe('not_an_absolute_directory');
    // Positive control: the entry nothing happened to is still live, so the
    // withholding above is this folder and not a read that returned nothing.
    expect(read.liveIds).toEqual([ids.untouched]);
    // MECHANISM: withheld is not deleted. A read must never silently destroy a
    // decision the user made - it reports it and leaves the removal to them.
    expect(read.recordedIds.toSorted()).toEqual([ids.target, ids.untouched].toSorted());
  });

  it('withholds a grant whose folder was replaced by a symlink into Wayland private storage', async () => {
    const ids = await grantBoth();
    // The attack from the audit: the folder the user consented to is renamed
    // away and a link to a protected tree takes its place. The recorded string
    // is unchanged and still reads as the folder they agreed to.
    rmSync(fx.target, { recursive: true, force: true });
    symlinkSync(fx.waylandPrivate, fx.target, 'dir');

    const read = await readBack();

    expect(read.withheldFor(ids.target)).toBe('wayland_private');
    expect(read.liveIds).toEqual([ids.untouched]);
    expect(read.recordedIds).toHaveLength(2);
  });

  it('withholds a grant whose folder was replaced by a symlink into a credential store', async () => {
    const ids = await grantBoth();
    rmSync(fx.target, { recursive: true, force: true });
    symlinkSync(path.join(fx.home, '.ssh'), fx.target, 'dir');

    const read = await readBack();

    expect(read.withheldFor(ids.target)).toBe('credential_store');
    expect(read.liveIds).toEqual([ids.untouched]);
  });

  /**
   * The sharpest case, and the one a refusal-only check would miss entirely.
   * The replacement target is a folder the classifier is perfectly happy with -
   * it is simply NOT the folder the user consented to. Consent attaches to a
   * directory, not to a spelling.
   */
  it('withholds a grant whose folder now points at a DIFFERENT but permitted folder', async () => {
    const ids = await grantBoth();
    const elsewhere = path.join(fx.home, 'Somewhere-else');
    mkdirSync(elsewhere, { recursive: true });
    rmSync(fx.target, { recursive: true, force: true });
    symlinkSync(elsewhere, fx.target, 'dir');

    const read = await readBack();

    expect(read.withheldFor(ids.target)).toBe('root_changed');
    expect(read.liveIds).toEqual([ids.untouched]);
    // Positive control on the CLASSIFIER, not just on this read: the folder the
    // link now points at really is grantable, so `root_changed` is about
    // identity and not about the target being refused.
    const direct = await fx.store.add({ workspaceId: WS, root: elsewhere, origin: 'settings' });
    expect(direct.ok === false ? `REFUSED ${direct.refusal}` : direct.addition.grant.root).toBe(elsewhere);
  });

  it('withholds a grant whose folder was DELETED outright', async () => {
    const ids = await grantBoth();
    rmSync(fx.target, { recursive: true, force: true });

    const read = await readBack();

    expect(read.withheldFor(ids.target)).toBe('not_an_absolute_directory');
    expect(read.liveIds).toEqual([ids.untouched]);
  });

  it('withholds a grant whose folder became a FILE', async () => {
    const ids = await grantBoth();
    // Nested one level deeper than `home` on purpose: the classifier replaces a
    // file with its containing directory, and a file directly under `home`
    // would then be refused as `home_directory` by a check that fires BEFORE
    // the identity comparison this test is about.
    const nested = path.join(fx.home, 'Docs', 'Ledger');
    mkdirSync(nested, { recursive: true });
    const added = await fx.store.add({ workspaceId: WS, root: nested, origin: 'settings' });
    if (added.ok === false) throw new Error(`fixture add refused: ${added.refusal}`);
    rmSync(nested, { recursive: true, force: true });
    writeFileSync(nested, 'not a folder any more');

    const record = await reopen().list(WS);

    // The classifier ACCEPTS `home/Docs`, so nothing refused this entry. What
    // withholds it is that `home/Docs` is not the folder the user consented to.
    expect(record.withheld.map((entry) => [entry.grant.grantId, entry.reason])).toEqual([
      [added.addition.grant.grantId, 'root_changed'],
    ]);
    expect(record.grants.map((grant) => grant.grantId).toSorted()).toEqual([ids.target, ids.untouched].toSorted());
  });

  /**
   * A read never writes, so "a read does not delete" is true by construction.
   * The rewrite an ADD performs is where a withheld entry could actually be
   * lost - it rebuilds the whole bucket - and losing it there would be exactly
   * the silent deletion the withholding design exists to avoid.
   */
  it('keeps withheld entries on disk through the rewrite an ADD performs', async () => {
    const ids = await grantBoth();
    rmSync(fx.target, { recursive: true, force: true });
    symlinkSync(fx.waylandPrivate, fx.target, 'dir');
    const third = path.join(fx.home, 'Third');
    mkdirSync(third, { recursive: true });

    const outcome = await reopen().add({ workspaceId: WS, root: third, origin: 'settings' });

    expect(outcome.ok === false ? `REFUSED ${outcome.refusal}` : outcome.addition.created).toBe(true);
    const onDisk: FolderGrant[] = JSON.parse(readFileSync(fx.file, 'utf8')).workspaces[WS];
    // MECHANISM: the withheld entry is still recorded, by its id, alongside the
    // live one and the new one. It is the user's to remove, not this write's.
    expect(onDisk.map((grant) => grant.grantId)).toContain(ids.target);
    expect(onDisk).toHaveLength(3);
    // Positive control: it is still withheld on the way back out, so the entry
    // that survived is the withheld one and not one that quietly went live.
    const record = await reopen().list(WS);
    expect(record.withheld.map((entry) => entry.grant.grantId)).toEqual([ids.target]);
    expect(record.grants.map((grant) => grant.grantId).toSorted()).toEqual(
      [ids.untouched, outcome.ok === true ? outcome.addition.grant.grantId : 'MISSING'].toSorted()
    );
  });
});

describe('a read refuses to certify what the production writer never wrote', () => {
  /**
   * Directly pins `parseGrant`. A mutation loosening it to accept any
   * object-shaped record survived the whole store suite before this, because
   * that suite only ever reloaded records the production writer produced.
   */
  it('drops a hand-edited record whose access is not read, while a well-formed one stays live', async () => {
    const ids = await grantBoth();
    const raw = JSON.parse(readFileSync(fx.file, 'utf8'));
    raw.workspaces[WS] = raw.workspaces[WS].map((grant: FolderGrant) =>
      grant.grantId === ids.target ? { ...grant, access: 'write' } : grant
    );
    writeFileSync(fx.file, JSON.stringify(raw));

    const record = await reopen().list(WS);

    // The tampered field is the ONLY thing that changed - the folder is still
    // there and still grantable - so nothing cheaper than the shape check can
    // account for this.
    expect(record.grants.map((grant) => grant.grantId)).toEqual([ids.untouched]);
    expect(record.withheld).toEqual([]);
  });

  it('drops a hand-edited record with an unknown origin, while a well-formed one stays live', async () => {
    const ids = await grantBoth();
    const raw = JSON.parse(readFileSync(fx.file, 'utf8'));
    raw.workspaces[WS] = raw.workspaces[WS].map((grant: FolderGrant) =>
      grant.grantId === ids.target ? { ...grant, origin: 'somewhere_else' } : grant
    );
    writeFileSync(fx.file, JSON.stringify(raw));

    const record = await reopen().list(WS);

    expect(record.grants.map((grant) => grant.grantId)).toEqual([ids.untouched]);
  });

  /**
   * A list that grew past Core's `MAX_SESSION_READ_GRANTS` would mean entries
   * that silently stop taking effect on replay while still being listed as if
   * they did. `add` caps at write time; only a hand-edited file can get here.
   */
  it('withholds the entries a hand-edited file pushed past the engine cap', async () => {
    const roots: string[] = [];
    for (let i = 0; i < MAX_FOLDER_GRANTS_PER_WORKSPACE + 3; i += 1) {
      const dir = path.join(fx.home, 'many', `folder-${i}`);
      mkdirSync(dir, { recursive: true });
      roots.push(dir);
    }
    const grants = roots.map((root, index) => ({
      grantId: `g-${index}`,
      root,
      access: 'read',
      grantedAtMs: 1_700_000_000_000 + index,
      origin: 'settings',
    }));
    writeFileSync(fx.file, JSON.stringify({ schemaVersion: 1, workspaces: { [WS]: grants } }));

    const record = await reopen().list(WS);

    expect(record.grants).toHaveLength(MAX_FOLDER_GRANTS_PER_WORKSPACE);
    // MECHANISM: it is the LAST three that are held back, in the order the
    // engine would have stopped accepting them, and they are named rather than
    // dropped.
    expect(record.withheld.map((entry) => entry.grant.grantId)).toEqual(['g-64', 'g-65', 'g-66']);
    expect(record.withheld.map((entry) => entry.reason)).toEqual([
      'grant_cap_reached',
      'grant_cap_reached',
      'grant_cap_reached',
    ]);
  });

  /**
   * The reachable case where containment decided against RAW records and
   * containment decided against RE-VALIDATED ones differ. An entry past the cap
   * is recorded, still names a perfectly good folder, and would be offered as
   * "you are already covered by this" - handing the caller a certified grant
   * for a root the engine is never going to accept.
   */
  it('never offers an entry the read would not certify as the grant that already covers a request', async () => {
    const roots: string[] = [];
    for (let i = 0; i <= MAX_FOLDER_GRANTS_PER_WORKSPACE; i += 1) {
      const dir = path.join(fx.home, 'many', `folder-${i}`);
      mkdirSync(dir, { recursive: true });
      roots.push(dir);
    }
    writeFileSync(
      fx.file,
      JSON.stringify({
        schemaVersion: 1,
        workspaces: {
          [WS]: roots.map((root, index) => ({
            grantId: `g-${index}`,
            root,
            access: 'read',
            grantedAtMs: 1_700_000_000_000 + index,
            origin: 'settings',
          })),
        },
      })
    );
    const overflow = roots[MAX_FOLDER_GRANTS_PER_WORKSPACE];
    const insideOverflow = path.join(overflow, 'inside');
    mkdirSync(insideOverflow, { recursive: true });

    const outcome = await reopen().add({ workspaceId: WS, root: insideOverflow, origin: 'settings' });

    expect(outcome.ok === false ? outcome.refusal : `COVERED BY ${outcome.addition.grant.grantId}`).toBe(
      'grant_cap_reached'
    );

    // Positive control, and the ordering Core uses: a folder inside an entry
    // that IS live is still a successful no-op against a full list, because
    // coverage is checked before the cap.
    const insideLive = path.join(roots[0], 'inside');
    mkdirSync(insideLive, { recursive: true });
    const redundant = await reopen().add({ workspaceId: WS, root: insideLive, origin: 'settings' });
    expect(redundant.ok === false ? `REFUSED ${redundant.refusal}` : redundant.addition.grant.grantId).toBe('g-0');
  });

  it('withholds everything when Wayland own storage cannot be enumerated', async () => {
    const ids = await grantBoth();
    const broken = new WorkspaceFolderGrantStore(fx.file, async () => {
      throw new Error('profile isolation');
    });

    const record = await broken.list(WS);

    // Fails CLOSED, the same direction `add` fails: without Wayland's own
    // storage roots we cannot show an entry is not part of it.
    expect(record.grants).toEqual([]);
    expect(record.withheld.map((entry) => entry.reason)).toEqual(['wayland_private', 'wayland_private']);
    // Positive control: through a working resolver the same file reads live, so
    // the withholding above is the resolver and not the fixture.
    expect((await reopen().list(WS)).grants.map((grant) => grant.grantId).toSorted()).toEqual(
      [ids.target, ids.untouched].toSorted()
    );
  });
});

describe('the revalidating read is the only way roots leave the store', () => {
  /**
   * The point of Finding 3 was not only that reads were unchecked, but that a
   * future replay could quietly add its own unchecked reader. The type system
   * carries half of that (`LiveFolderGrant` is unmintable outside the store);
   * this carries the other half - there is no second accessor to reach for.
   *
   * `listAll` and `list` re-validate. `add` returns a root it just classified.
   * `remove` returns a revoke handle. A new public method that hands out roots
   * without re-checking them turns this red on the day it is added.
   */
  it('exposes no accessor besides the four that re-check or do not hand out authority', () => {
    const surface = Object.getOwnPropertyNames(WorkspaceFolderGrantStore.prototype)
      .filter((name) => name !== 'constructor')
      .filter((name) => !name.startsWith('_'))
      .toSorted();

    expect(surface).toEqual([
      'add',
      'contextOrNull',
      'list',
      'listAll',
      'load',
      'recheck',
      'remove',
      'revalidate',
      'stillLive',
      'transact',
    ]);
  });

  it('reports a workspace whose entries were ALL withheld, rather than hiding the row', async () => {
    await grantBoth();
    rmSync(fx.target, { recursive: true, force: true });
    rmSync(fx.untouched, { recursive: true, force: true });

    const all = await reopen().listAll();

    // The entry a user can no longer account for is the one they most need to
    // see. A row that vanished would leave standing record with nothing to
    // point at.
    expect(all).toHaveLength(1);
    expect(all[0].grants).toEqual([]);
    expect(all[0].withheld).toHaveLength(2);
  });
});
