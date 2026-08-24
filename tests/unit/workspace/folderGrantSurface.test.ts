/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The live revoke, and the registry it reaches through.
 *
 * A removal that only edits the durable file leaves every engine already
 * running still reading the folder, because Core holds grants in session memory
 * and nothing re-reads the list mid-session. That is the failure this module
 * exists to prevent, so the tests below are about WHICH sessions get the
 * command and whether a revoke that did not land is allowed to report success.
 *
 * They exercise the production functions, never a local re-implementation: a
 * guard proved against a copy can be unwired from the caller while the whole
 * suite stays green.
 */

import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearLivePathGrantSessionsForTest,
  listLivePathGrantSessions,
  registerLivePathGrantSession,
} from '@process/agent/wcore/pathGrantSessions';
import {
  resolveFolderGrantWorkspaces,
  revokeFolderGrantInLiveSessions,
} from '@process/services/workspace/folderGrantSurface';
import { buildWorkspaceMarker, writeWorkspaceMarker } from '@process/services/workspaceIdentity';

/**
 * The canonical form of `p` as the OPERATING SYSTEM reports it.
 *
 * NOT `fs.realpathSync`, which is a JS reimplementation: on Windows it expands
 * neither an 8.3 short name nor the on-disk case, so a fixture built with it
 * disagrees with every root the store returns - the store canonicalises with
 * `fs/promises.realpath`, which is the same OS call this one makes. On a GitHub
 * Windows runner `os.tmpdir()` is `C:\\Users\\RUNNER~1\\AppData\\Local\\Temp`.
 */
const canonical = (p: string): string => realpathSync.native(p);

const WORKSPACE = '/Users/x/Documents/Wayland/Projects/Ledger';
const OTHER_WORKSPACE = '/Users/x/Documents/Wayland/Projects/Payroll';

/** A receipt object stands for "Core acknowledged"; null is the host failing to send. */
const RECEIPT = { readable_roots: [] };

const session = (workspace: string, revokePath = vi.fn(async () => RECEIPT as unknown)) => ({
  workspace,
  revokePath,
});

afterEach(() => {
  clearLivePathGrantSessionsForTest();
});

describe('revokeFolderGrantInLiveSessions', () => {
  it('revokes in the matching workspace and leaves every other session alone', async () => {
    const mine = session(WORKSPACE);
    const theirs = session(OTHER_WORKSPACE);

    const outcome = await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [mine, theirs]);

    expect(mine.revokePath).toHaveBeenCalledWith('g-1');
    // Not merely "revoked === 1": a rule that revoked EVERYWHERE would also
    // report 1 if it happened to see one session. The other session is the
    // assertion that matters.
    expect(theirs.revokePath).not.toHaveBeenCalled();
    expect(outcome).toEqual({ revoked: 1, failed: 0 });
  });

  it('matches a workspace path that differs only by a trailing separator', async () => {
    const mine = session(`${WORKSPACE}/`);
    const outcome = await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [mine]);
    expect(outcome).toEqual({ revoked: 1, failed: 0 });
  });

  it('counts a revoke the engine never acknowledged as FAILED, not as revoked', async () => {
    // `revokePath` resolves null when the host could not get the command out.
    // Counting that as a success is exactly the lie this whole surface exists
    // to avoid: the user would be told the folder is no longer readable.
    const dead = session(
      WORKSPACE,
      vi.fn(async () => null as unknown)
    );
    const live = session(WORKSPACE);

    const outcome = await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [dead, live]);

    expect(outcome).toEqual({ revoked: 1, failed: 1 });
  });

  it('counts a revoke that THREW as failed and still revokes the other sessions', async () => {
    // The live shape today: `revoke_path` is absent from the pinned
    // host-command schema, so the outbound contract validator throws
    // synchronously before anything reaches stdin
    // (FerroxLabs/wayland-core#314). One wedged session must not swallow the
    // others, and must not be reported as done.
    const throwing = {
      workspace: WORKSPACE,
      revokePath: vi.fn(() => {
        throw new Error('command not in the negotiated contract');
      }),
    };
    const healthy = session(WORKSPACE);

    const outcome = await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [throwing, healthy]);

    expect(outcome).toEqual({ revoked: 1, failed: 1 });
    expect(healthy.revokePath).toHaveBeenCalledWith('g-1');
  });

  it('revokes nothing when the workspace id resolved to no folder', async () => {
    const mine = session(WORKSPACE);
    expect(await revokeFolderGrantInLiveSessions(null, 'g-1', [mine])).toEqual({ revoked: 0, failed: 0 });
    expect(mine.revokePath).not.toHaveBeenCalled();
    // Positive control: the same session IS reachable when the folder resolves.
    expect(await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [mine])).toEqual({ revoked: 1, failed: 0 });
  });

  it('reads the LIVE registry when no session list is supplied', async () => {
    // Pins the default argument to the real registry. With it defaulted to an
    // empty array instead, every removal would silently revoke nothing.
    const mine = session(WORKSPACE);
    registerLivePathGrantSession(mine);
    expect(await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1')).toEqual({ revoked: 1, failed: 0 });
  });
});

describe('the live-session registry', () => {
  it('publishes a session and withdraws it again through the returned handle', async () => {
    const mine = session(WORKSPACE);
    const unpublish = registerLivePathGrantSession(mine);
    expect(listLivePathGrantSessions()).toContain(mine);

    unpublish();

    expect(listLivePathGrantSessions()).not.toContain(mine);
    // A withdrawn session must not still be revoked through.
    expect(await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1')).toEqual({ revoked: 0, failed: 0 });
    expect(mine.revokePath).not.toHaveBeenCalled();
  });

  it('returns a snapshot, so registering during a fan-out cannot disturb it', () => {
    const first = session(WORKSPACE);
    registerLivePathGrantSession(first);
    const snapshot = listLivePathGrantSessions();
    registerLivePathGrantSession(session(WORKSPACE));
    expect(snapshot).toHaveLength(1);
    expect(listLivePathGrantSessions()).toHaveLength(2);
  });
});

describe('resolveFolderGrantWorkspaces - reading the folder back out of the key', () => {
  const tmpDirs: string[] = [];

  afterAll(() => {
    for (const dir of tmpDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Temp dirs are reaped by the OS.
      }
    }
  });

  const tmpDir = (): string => {
    const dir = mkdtempSync(path.join(canonical(os.tmpdir()), 'wl-grant-key-rel-'));
    tmpDirs.push(dir);
    return dir;
  };

  it('refuses a RELATIVE key rather than resolving it against the process cwd', async () => {
    // Only a hand-edited grants file can produce one. Resolving it against
    // whatever directory the app happens to be running in would attach a
    // stranger's folder to a workspace row and offer it for revoke.
    const absolute = tmpDir();

    // NOT `path.relative(process.cwd(), absolute)`. On Windows the cwd and the
    // temp dir routinely sit on different drives - `D:\\a\\wayland\\wayland` and
    // `C:\\Users\\...\\Temp` on CI - and `path.relative` cannot express that as a
    // relative path, so it returns the ABSOLUTE target and the fixture stops
    // being a relative key at all.
    //
    // Anchoring the cwd to the folder's own parent makes the relative form the
    // basename on every platform, and makes it STRONGER: this relative key
    // really does name this folder when resolved against the cwd, so a
    // resolver that leaned on the cwd would find it and this test would go red.
    // The cross-drive form could only ever have refused for the wrong reason.
    // Safe to chdir: vitest 4 defaults to the isolated `forks` pool, so this
    // file owns its process, and tests within a file run serially.
    const previousCwd = process.cwd();
    process.chdir(path.dirname(absolute));
    let located: Awaited<ReturnType<typeof resolveFolderGrantWorkspaces>>;
    try {
      const relative = path.basename(absolute);
      expect(path.isAbsolute(relative)).toBe(false);
      // The fixture is honest: from here, the relative key DOES name the folder.
      expect(canonical(path.resolve(relative))).toBe(canonical(absolute));

      located = await resolveFolderGrantWorkspaces([`path:${relative}`]);
    } finally {
      process.chdir(previousCwd);
    }
    expect(located.size).toBe(0);

    // Positive control: the SAME folder, named absolutely, does resolve - so
    // the refusal above is the absoluteness check and not a dead resolver.
    const ok = await resolveFolderGrantWorkspaces([`path:${absolute}`]);
    expect(ok.get(`path:${absolute}`)?.dir).toBe(absolute);
  });

  it('locates nothing for a folder that is not there', async () => {
    const gone = path.join(tmpDir(), 'deleted');
    expect((await resolveFolderGrantWorkspaces([`path:${gone}`])).size).toBe(0);
  });

  it('locates nothing when the path names a FILE rather than a folder', async () => {
    const dir = tmpDir();
    const file = path.join(dir, 'note.txt');
    writeFileSync(file, 'x');
    expect((await resolveFolderGrantWorkspaces([`path:${file}`])).size).toBe(0);
    // Positive control: its parent directory resolves.
    expect((await resolveFolderGrantWorkspaces([`path:${dir}`])).get(`path:${dir}`)?.dir).toBe(dir);
  });

  it('locates nothing for a legacy marker: key, which no longer names anything', async () => {
    // Keys of that shape can still sit in a grants file written before the key
    // became the path. They must resolve to no folder - the entry stays listed
    // and revokable, but it may never be attached to a directory by guesswork.
    const dir = tmpDir();
    const legacy = 'marker:11111111-2222-3333-4444-555555555555';
    expect((await resolveFolderGrantWorkspaces([legacy])).size).toBe(0);
    // Positive control in the SAME call: a real key alongside it still resolves.
    const mixed = await resolveFolderGrantWorkspaces([legacy, `path:${dir}`]);
    expect(mixed.has(legacy)).toBe(false);
    expect(mixed.get(`path:${dir}`)?.dir).toBe(dir);
  });

  it('names a workspace from its identity marker, and falls back to the folder name', async () => {
    // The marker is a LABEL here and only a label - it cannot select a bucket,
    // because the key was already computed from the path. The fixture folder is
    // named unlike the marker so the display name can only come from the file.
    const dir = tmpDir();
    await writeWorkspaceMarker(
      dir,
      buildWorkspaceMarker({ ownerKind: 'project', ownerId: 'p-1', displayName: 'Quarterly Ledger' })
    );
    expect((await resolveFolderGrantWorkspaces([`path:${dir}`])).get(`path:${dir}`)).toEqual({
      dir,
      displayName: 'Quarterly Ledger',
    });

    // CONTROL: with the marker gone the SAME folder falls back to its basename,
    // so the name above came from the file and not from the path.
    rmSync(path.join(dir, '.wayland-workspace.json'));
    expect((await resolveFolderGrantWorkspaces([`path:${dir}`])).get(`path:${dir}`)).toEqual({
      dir,
      displayName: path.basename(dir),
    });
  });
});
