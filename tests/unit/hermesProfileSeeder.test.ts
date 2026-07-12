/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { AcpBackendConfig } from '@/common/types/acpTypes';
import {
  HERMES_PROFILE_ID_PREFIX,
  SAFE_PROFILE_NAME,
  buildProfileAssistant,
  discoverHermesProfiles,
  reconcileProfileAssistants,
  seedHermesProfileAssistants,
} from '@process/services/skills/hermesProfileSeeder';

describe('buildProfileAssistant (#66)', () => {
  it('carries the full spawn contract so env reaches the spawn', () => {
    const a = buildProfileAssistant('marketing');
    expect(a.id).toBe('hermes-profile-marketing');
    expect(a.name).toBe('Hermes (marketing)');
    // defaultCliPath + acpArgs are REQUIRED: without defaultCliPath,
    // resolveCustomAgentCliConfig early-returns and drops env.
    expect(a.defaultCliPath).toBe('hermes');
    expect(a.acpArgs).toEqual(['acp']);
    expect(a.env).toEqual({ HERMES_PROFILE: 'marketing' });
    // Classification that makes it a selectable specialist in both pickers.
    expect(a.kind).toBe('specialist');
    expect(a.isBuiltin).toBe(false);
    expect(a.isPreset).toBe(true);
    // presetAgentType stays 'hermes' (direct-write bypasses the import sanitizer).
    expect(a.presetAgentType).toBe('hermes');
  });

  it('env carries ONLY HERMES_PROFILE (no security-env clobber surface)', () => {
    expect(Object.keys(buildProfileAssistant('x').env ?? {})).toEqual(['HERMES_PROFILE']);
  });
});

describe('SAFE_PROFILE_NAME (#66)', () => {
  it('accepts ordinary profile names', () => {
    for (const n of ['marketing', 'Team Alpha', 'dev-2', 'a.b_c', 'A1']) {
      expect(SAFE_PROFILE_NAME.test(n)).toBe(true);
    }
  });
  it('rejects traversal / separators / dotfiles / empty / overlong', () => {
    for (const n of ['..', '.', '.hidden', 'a/b', 'a\\b', '', ' leading', '/etc', 'x'.repeat(65)]) {
      expect(SAFE_PROFILE_NAME.test(n)).toBe(false);
    }
  });
});

describe('reconcileProfileAssistants (#66)', () => {
  const other: AcpBackendConfig[] = [
    { id: 'builtin-cowork', name: 'Cowork', kind: 'specialist', isBuiltin: true },
    { id: 'custom-mine', name: 'Mine', kind: 'specialist', isBuiltin: false },
    { id: 'ext-foo', name: 'Ext', kind: 'specialist', isBuiltin: false },
  ];

  it('adds a row for a new profile and reports changed', () => {
    const { next, changed } = reconcileProfileAssistants([], ['alpha']);
    expect(changed).toBe(true);
    expect(next.map((a) => a.id)).toEqual(['hermes-profile-alpha']);
  });

  it('never touches builtin/custom/ext rows', () => {
    const { next } = reconcileProfileAssistants(other, ['alpha']);
    expect(next.filter((a) => a.id !== 'hermes-profile-alpha')).toEqual(other);
  });

  it('prunes a profile row whose dir was deleted', () => {
    const existing = [...other, buildProfileAssistant('gone'), buildProfileAssistant('stay')];
    const { next, changed } = reconcileProfileAssistants(existing, ['stay']);
    expect(changed).toBe(true);
    expect(next.some((a) => a.id === 'hermes-profile-gone')).toBe(false);
    expect(next.some((a) => a.id === 'hermes-profile-stay')).toBe(true);
  });

  it('preserves the user-controlled enabled flag on re-seed', () => {
    const existing = [{ ...buildProfileAssistant('alpha'), enabled: false }];
    const { next } = reconcileProfileAssistants(existing, ['alpha']);
    expect(next[0].enabled).toBe(false);
  });

  it('refreshes drifted spawn fields (defaultCliPath/env) on re-seed', () => {
    const stale = { ...buildProfileAssistant('alpha'), defaultCliPath: undefined, env: {} };
    const { next, changed } = reconcileProfileAssistants([stale], ['alpha']);
    expect(changed).toBe(true);
    expect(next[0].defaultCliPath).toBe('hermes');
    expect(next[0].env).toEqual({ HERMES_PROFILE: 'alpha' });
  });

  it('is a no-op (changed=false) when already in sync', () => {
    const existing = [buildProfileAssistant('alpha')];
    const { changed } = reconcileProfileAssistants(existing, ['alpha']);
    expect(changed).toBe(false);
  });
});

describe('discoverHermesProfiles (#66)', () => {
  let root: string;
  let profilesDir: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'hermes-seed-'));
    profilesDir = path.join(root, 'profiles');
    await mkdir(profilesDir, { recursive: true });
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function makeProfile(name: string, withSoul = true) {
    const dir = path.join(profilesDir, name);
    await mkdir(dir, { recursive: true });
    if (withSoul) await writeFile(path.join(dir, 'SOUL.md'), '# persona', 'utf-8');
  }

  it('returns [] when the profiles dir is missing (hermes-not-installed fast path)', async () => {
    expect(await discoverHermesProfiles(path.join(root, 'nope'))).toEqual([]);
  });

  it('finds a valid profile (dir + SOUL.md), sorted', async () => {
    await makeProfile('zeta');
    await makeProfile('alpha');
    expect(await discoverHermesProfiles(profilesDir)).toEqual(['alpha', 'zeta']);
  });

  it('skips a dir with no SOUL.md', async () => {
    await makeProfile('nosoul', false);
    expect(await discoverHermesProfiles(profilesDir)).toEqual([]);
  });

  it('skips an unsafe-named dir', async () => {
    await mkdir(path.join(profilesDir, '.hidden'), { recursive: true });
    await writeFile(path.join(profilesDir, '.hidden', 'SOUL.md'), 'x', 'utf-8');
    expect(await discoverHermesProfiles(profilesDir)).toEqual([]);
  });

  it('skips a plain file (only dirs/symlinks count)', async () => {
    await writeFile(path.join(profilesDir, 'afile'), 'x', 'utf-8');
    expect(await discoverHermesProfiles(profilesDir)).toEqual([]);
  });

  it('rejects a symlink that escapes the profiles root', async () => {
    // profiles/evil -> <root>/outside (a dir OUTSIDE profilesDir) with a SOUL.md.
    const outside = path.join(root, 'outside');
    await mkdir(outside, { recursive: true });
    await writeFile(path.join(outside, 'SOUL.md'), 'x', 'utf-8');
    await symlink(outside, path.join(profilesDir, 'evil'), 'dir');
    expect(await discoverHermesProfiles(profilesDir)).toEqual([]);
  });

  it('allows an internal symlink that stays under the root', async () => {
    await makeProfile('real');
    await symlink(path.join(profilesDir, 'real'), path.join(profilesDir, 'link'), 'dir');
    // Both the real dir and the internal-pointing symlink resolve under root.
    expect(await discoverHermesProfiles(profilesDir)).toEqual(['link', 'real']);
  });
});

describe('seedHermesProfileAssistants (#66)', () => {
  it('writes only when the reconcile changed the list', async () => {
    let store: AcpBackendConfig[] = [];
    let writes = 0;
    const io = {
      getAssistants: async () => store,
      setAssistants: async (next: AcpBackendConfig[]) => {
        store = next;
        writes++;
      },
      discover: async () => ['alpha'],
    };
    const first = await seedHermesProfileAssistants(io);
    expect(first).toEqual({ changed: true, count: 1 });
    expect(writes).toBe(1);
    expect(store.map((a) => a.id)).toContain(`${HERMES_PROFILE_ID_PREFIX}alpha`);

    // Second identical run must be a no-op write.
    const second = await seedHermesProfileAssistants(io);
    expect(second.changed).toBe(false);
    expect(writes).toBe(1);
  });
});
