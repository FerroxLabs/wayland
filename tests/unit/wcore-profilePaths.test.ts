/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { link, lstat, mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// profilePaths derives the profiles root from os.homedir(); point homedir at a
// scratch dir so the tests never touch the real ~/.wayland.
let home: string;
vi.mock('node:os', async (orig) => {
  const actual = await orig<typeof import('node:os')>();
  return { ...actual, homedir: () => home };
});

import {
  DEFAULT_PROFILE,
  acquireRuntimeLaunchAuthority,
  getActiveProfile,
  hasProfileLaunchLease,
  nativeConfigDir,
  ProfileIsolationError,
  profilesRoot,
  resolveActiveConfigDir,
  resolveActiveConfigPath,
  resolveProfileDir,
  standaloneConfigDir,
} from '@process/agent/wcore/profilePaths';

const ORIGINAL_ENV = { ...process.env };

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), 'wcore-home-'));
  delete process.env.WAYLAND_HOME;
  delete process.env.XDG_DATA_HOME;
  delete process.env.XDG_CONFIG_HOME;
  delete process.env.WAYLAND_PROFILES_ROOT;
  // MUST also be re-rooted. profilePaths.platformConfigBase() reads %APPDATA%
  // on win32 and never consults homedir(), so the mocked homedir above did not
  // isolate anything on the Windows runner: every profile, and the `active`
  // marker, were created in the runner's REAL %APPDATA%\wayland-core-profiles.
  // That root is shared by every test and every parallel test file, which is
  // where the Windows-only EEXIST mkdir/symlink, EISDIR, and "resolved a named
  // profile when no marker was set" failures came from. Same class of bug as the
  // XDG_CONFIG_HOME leak on ubuntu; darwin ignores this var, which is why macOS
  // never showed it.
  process.env.APPDATA = join(home, 'AppData', 'Roaming');
});

afterEach(async () => {
  process.env = { ...ORIGINAL_ENV };
  await rm(home, { recursive: true, force: true }).catch(() => {});
});

/** Write the active-profile marker directly (bypassing the IPC store). */
async function setActive(name: string): Promise<void> {
  const root = profilesRoot();
  await mkdir(root, { recursive: true });
  await writeFile(join(root, 'active'), `${name}\n`, 'utf-8');
}

describe('nativeConfigDir - mirrors engine wayland_config_dir precedence', () => {
  it('honors WAYLAND_HOME as the literal config dir', () => {
    process.env.WAYLAND_HOME = '/tmp/wh';
    expect(nativeConfigDir()).toBe('/tmp/wh');
  });

  it('falls back to XDG_DATA_HOME/wayland-core', () => {
    process.env.XDG_DATA_HOME = '/tmp/xdg';
    expect(nativeConfigDir()).toBe(join('/tmp/xdg', 'wayland-core'));
  });
});

describe('standaloneConfigDir - mirrors the filtered raw child environment', () => {
  it('ignores parent-only Desktop overrides that are not forwarded to Core', () => {
    process.env.WAYLAND_HOME = '/parent/managed-profile';
    process.env.XDG_DATA_HOME = '/parent/managed-data';
    process.env.XDG_CONFIG_HOME = '/parent/config';

    const dir = standaloneConfigDir();
    expect(dir).not.toContain('/parent/managed-profile');
    expect(dir).not.toContain('/parent/managed-data');
    if (process.platform !== 'win32') expect(dir).not.toContain('/parent/config');
    expect(dir.endsWith('wayland-core')).toBe(true);
  });
});

describe('runtime launch authority snapshot', () => {
  it('lets an explicitly raw launch bypass a corrupt managed-profile pointer', async () => {
    await setActive('missing-profile');

    const snapshot = await acquireRuntimeLaunchAuthority(async () => true);

    expect(snapshot.raw).toBe(true);
    expect(snapshot.identity).toBeNull();
    await snapshot.release();
  });

  it('resolves and leases the managed identity in the same authority transaction', async () => {
    const work = await resolveProfileDir('work');
    await mkdir(work, { recursive: true });
    await setActive('work');

    const snapshot = await acquireRuntimeLaunchAuthority(async () => false);

    expect(snapshot.raw).toBe(false);
    if (snapshot.raw) throw new Error('expected managed launch snapshot');
    expect(snapshot.identity).toEqual({ profile: 'work', dir: work });
    expect(hasProfileLaunchLease(work)).toBe(true);
    await snapshot.release();
    expect(hasProfileLaunchLease(work)).toBe(false);
  });
});

describe('resolveActiveConfigDir - the default<->named fork', () => {
  it('default profile resolves to the NATIVE config dir (backward compatible)', async () => {
    // No marker => default. Native dir derives from platform config base, not
    // the profiles root, so it must NOT be under wayland-core-profiles.
    const dir = await resolveActiveConfigDir();
    expect(dir).not.toContain('wayland-core-profiles');
    expect(await getActiveProfile()).toBe(DEFAULT_PROFILE);
  });

  it('an explicit "default" pointer resolves Core\'s valid named default profile, not the native home', async () => {
    const namedDefault = await resolveProfileDir('default');
    await mkdir(namedDefault, { recursive: true });
    await setActive('default');
    const dir = await resolveActiveConfigDir();
    expect(dir).toBe(namedDefault);
    expect(dir).not.toBe(nativeConfigDir());
  });

  it('a named profile resolves to its isolated dir under the profiles root', async () => {
    await mkdir(await resolveProfileDir('client-work'), { recursive: true });
    await setActive('client-work');
    const dir = await resolveActiveConfigDir();
    // resolveProfileDir realpaths the root (so /var -> /private/var on macOS);
    // compare against that same realpath'd source of truth, and assert the
    // profile-name segment is present.
    expect(dir).toBe(await resolveProfileDir('client-work'));
    expect(dir.endsWith(join('wayland-core-profiles', 'client-work'))).toBe(true);
    expect((await lstat(dir)).isDirectory()).toBe(true);
    expect((await lstat(dir)).isSymbolicLink()).toBe(false);
  });

  it('resolveActiveConfigPath points at the active profile config.toml', async () => {
    await mkdir(await resolveProfileDir('research'), { recursive: true });
    await setActive('research');
    const path = await resolveActiveConfigPath();
    expect(path).toBe(join(await resolveProfileDir('research'), 'config.toml'));
    expect(path.endsWith(join('wayland-core-profiles', 'research', 'config.toml'))).toBe(true);
  });

  it('a corrupt/invalid marker fails closed instead of selecting the default profile', async () => {
    await setActive('../../etc');
    await expect(resolveActiveConfigDir()).rejects.toBeInstanceOf(ProfileIsolationError);
  });

  it('rejects a named-profile symlink instead of reading or writing through it', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'wcore-outside-'));
    const sentinel = join(outside, 'sentinel.txt');
    await writeFile(sentinel, 'unchanged', 'utf-8');
    await mkdir(profilesRoot(), { recursive: true });
    await symlink(outside, join(profilesRoot(), 'client-work'), 'dir');
    await setActive('client-work');

    await expect(resolveProfileDir('client-work')).rejects.toThrow(/real directory/);
    await expect(resolveActiveConfigDir()).rejects.toMatchObject({
      code: 'PROFILE_ISOLATION',
      profile: 'client-work',
    });
    await expect(resolveActiveConfigPath()).rejects.toMatchObject({ code: 'PROFILE_ISOLATION' });
    await expect(readFile(sentinel, 'utf-8')).resolves.toBe('unchanged');
    await expect(readFile(join(outside, 'config.toml'), 'utf-8')).rejects.toMatchObject({ code: 'ENOENT' });

    await rm(outside, { recursive: true, force: true });
  });

  it('rejects an existing non-directory profile entry', async () => {
    await mkdir(profilesRoot(), { recursive: true });
    await writeFile(join(profilesRoot(), 'client-work'), 'not a directory', 'utf-8');
    await setActive('client-work');

    await expect(resolveActiveConfigDir()).rejects.toMatchObject({
      code: 'PROFILE_ISOLATION',
      profile: 'client-work',
    });
  });

  it('fails closed when an active named profile directory is missing instead of recreating it blank', async () => {
    await setActive('missing-profile');
    await expect(resolveActiveConfigDir()).rejects.toMatchObject({
      code: 'PROFILE_ISOLATION',
      profile: 'missing-profile',
    });
    await expect(lstat(join(profilesRoot(), 'missing-profile'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.each(['config.toml', 'memory.db', join('skills', 'writer')])(
    'rejects a nested %s link before returning an active named profile to config or launch callers',
    async (relative) => {
      const outside = await mkdtemp(join(tmpdir(), 'wcore-nested-outside-'));
      const profile = await resolveProfileDir('work');
      await mkdir(join(profile, 'skills'), { recursive: true });
      const linkPath = join(profile, relative);
      await mkdir(join(linkPath, '..'), { recursive: true });
      await symlink(outside, linkPath, 'dir');
      await setActive('work');

      await expect(resolveActiveConfigDir()).rejects.toMatchObject({ code: 'PROFILE_ISOLATION', profile: 'work' });
      await expect(resolveActiveConfigPath()).rejects.toMatchObject({ code: 'PROFILE_ISOLATION', profile: 'work' });

      await unlink(linkPath);
      await rm(outside, { recursive: true, force: true });
    }
  );

  it('rejects a hard-linked config file that aliases data outside the profile', async () => {
    const outside = join(home, 'outside-config.toml');
    await writeFile(outside, '[default]\nmodel = "outside"\n', 'utf-8');
    const profile = await resolveProfileDir('work');
    await mkdir(profile, { recursive: true });
    await link(outside, join(profile, 'config.toml'));
    await setActive('work');

    await expect(resolveActiveConfigDir()).rejects.toMatchObject({ code: 'PROFILE_ISOLATION', profile: 'work' });
  });
});

/**
 * #278: the profile boundary must fail CLOSED.
 *
 * The load-bearing invariant is the ASYMMETRY: resolveActiveConfigDir() can throw
 * ONLY on its named-profile branch. That is what makes "refuse to continue" a safe
 * posture — it can never brick a `default`-profile user (i.e. every user today,
 * since no profile UI ships yet), and it fires exactly where a silent fallback to
 * the native dir would have bled one profile's data into another's.
 *
 * Marker and path validation share Core's canonical validator, so malformed or
 * reserved identities are rejected at the pointer boundary and can never reach
 * the config/spawn resolver as a different identity.
 */
describe('#278: the profile boundary fails closed, never silently to the default dir', () => {
  it('INVARIANT: `default` is throw-free with no marker at all', async () => {
    await expect(resolveActiveConfigDir()).resolves.toBe(nativeConfigDir());
  });

  it('a garbage marker is classifiable and never falls through to default', async () => {
    await setActive('../../etc');
    await expect(resolveActiveConfigDir()).rejects.toMatchObject({ code: 'PROFILE_ISOLATION' });
  });

  it('a reserved named profile marker THROWS before it can resolve to the default dir', async () => {
    await setActive('CON');
    const err = await resolveActiveConfigDir().then(
      (dir) => ({ dir }),
      (e: unknown) => ({ err: e })
    );
    expect(err).not.toHaveProperty('dir'); // must NOT have quietly returned nativeConfigDir()
    expect(err).toHaveProperty('err');
    const thrown = (err as { err: unknown }).err;
    expect(thrown).toBeInstanceOf(ProfileIsolationError);
    expect((thrown as ProfileIsolationError).profile).toBe('CON');
  });

  it('the failure is classifiable and can never be mistaken for a missing file (ENOENT)', async () => {
    // WCoreMcpAgent.readConfig() treats ENOENT as "no config yet" and returns {}.
    // A raw fs error escaping this resolver would silently downgrade "this profile
    // is broken" into "this profile is empty" — and then write to the wrong file.
    await setActive('NUL');
    const thrown = await resolveActiveConfigDir().then(
      () => null,
      (e: unknown) => e
    );
    expect((thrown as ProfileIsolationError).code).toBe('PROFILE_ISOLATION');
    expect((thrown as NodeJS.ErrnoException).code).not.toBe('ENOENT');
  });
});
