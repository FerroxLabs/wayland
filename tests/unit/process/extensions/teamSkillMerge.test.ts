/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Unit tests for the team-skill load (2026-05-21, step #3 of the
// four-source split). Confirms (a) every well-shaped entry surfaces on
// `SkillLibrary.list({ source: 'team' })`, (b) malformed entries are
// dropped silently, (c) the `metadata.category` is derived from the slug
// prefix, (d) entries use absolute `path` values that `loadBody` can read
// directly, (e) missing bundles no-op cleanly, (f) the call is idempotent.
//
// `loadTeamSkills` accepts an `opts.bundleRoot` test affordance so we can
// stage a fixture without needing to mock `os.homedir`.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { readFile as fsReadFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import {
  loadTeamSkills,
  __resetTeamSkillMergeForTests,
} from '@process/extensions/data/bundle-vendored/teamSkillMerge';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';

function makeBundle(entries: unknown): string {
  const root = mkdtempSync(path.join(tmpdir(), 'team-skill-fixture-'));
  mkdirSync(path.join(root, 'contributes'), { recursive: true });
  writeFileSync(
    path.join(root, 'contributes', 'skills.json'),
    JSON.stringify(entries),
    'utf-8',
  );
  return root;
}

describe('loadTeamSkills', () => {
  let bundleRoot: string | null = null;

  beforeEach(() => {
    __resetTeamSkillMergeForTests();
    SkillLibrary.resetInstance();
  });

  afterEach(() => {
    if (bundleRoot) {
      rmSync(bundleRoot, { recursive: true, force: true });
      bundleRoot = null;
    }
  });

  it('registers every valid entry on the SkillLibrary as source=team', async () => {
    bundleRoot = makeBundle([
      {
        name: 'research-jtbd-interviews',
        description: 'Run switch interviews to extract the four Forces of Progress.',
        file: 'skills/research/jtbd-interviews.md',
      },
      {
        name: 'beacon-channel-strategy',
        description: 'Pick the channel mix using See/Think/Do/Care.',
        file: 'skills/beacon/channel-strategy.md',
      },
    ]);
    // Stage the body files so `loadBody` can read them.
    mkdirSync(path.join(bundleRoot, 'skills', 'research'), { recursive: true });
    writeFileSync(path.join(bundleRoot, 'skills', 'research', 'jtbd-interviews.md'), '# jtbd body', 'utf-8');

    loadTeamSkills({ bundleRoot });

    const lib = SkillLibrary.getInstance({
      resourceDir: '/nonexistent',
      readFile: async () => '[]',
    });
    const teamEntries = (await lib.list({ source: 'team' })).filter((e) => e.type === 'skill');

    expect(teamEntries).toHaveLength(2);
    expect(teamEntries.map((e) => e.name).sort()).toEqual([
      'beacon-channel-strategy',
      'research-jtbd-interviews',
    ]);
    expect(teamEntries[0].sourceLabel).toBe('Wayland Teams');
    expect(teamEntries[0].metadata.tags).toEqual([]);
  });

  it('derives metadata.category from the slug prefix so the filter rail can sub-group', async () => {
    bundleRoot = makeBundle([
      { name: 'research-a', description: 'a', file: 'a.md' },
      { name: 'beacon-b', description: 'b', file: 'b.md' },
      { name: 'mira-c', description: 'c', file: 'c.md' },
      { name: 'flat', description: 'd', file: 'd.md' },
    ]);

    loadTeamSkills({ bundleRoot });

    const lib = SkillLibrary.getInstance({ resourceDir: '/nonexistent', readFile: async () => '[]' });
    const entries = await lib.list({ source: 'team' });
    const byName = new Map(entries.map((e) => [e.name, e.metadata.category]));
    expect(byName.get('research-a')).toBe('research');
    expect(byName.get('beacon-b')).toBe('beacon');
    expect(byName.get('mira-c')).toBe('mira');
    // The flat (no-hyphen) entry falls back to the catch-all bucket.
    expect(byName.get('flat')).toBe('team');
  });

  it('produces absolute `path` values rooted at the bundle so loadBody resolves correctly', async () => {
    bundleRoot = makeBundle([
      { name: 'sales-discovery-call', description: 'd', file: 'skills/sales/discovery-call.md' },
    ]);
    mkdirSync(path.join(bundleRoot, 'skills', 'sales'), { recursive: true });
    writeFileSync(
      path.join(bundleRoot, 'skills', 'sales', 'discovery-call.md'),
      '# discovery call',
      'utf-8',
    );

    loadTeamSkills({ bundleRoot });

    // Smart mock: serve an empty index for the fake resourceDir, but
    // delegate to the real filesystem for the absolute body path on disk.
    const lib = SkillLibrary.getInstance({
      resourceDir: '/nonexistent',
      readFile: async (p) => {
        if (p === path.join('/nonexistent', 'index.json')) return '[]';
        return fsReadFile(p, 'utf-8');
      },
    });
    const entries = await lib.list({ source: 'team' });
    expect(entries[0].path).toBe(path.join(bundleRoot, 'skills', 'sales', 'discovery-call.md'));
    // loadBody must reach the file via the absolute path, NOT via resourceDir.
    const body = await lib.loadBody('sales-discovery-call');
    expect(body).toBe('# discovery call');
  });

  it('drops malformed entries silently (missing name, description, or file)', async () => {
    bundleRoot = makeBundle([
      { name: 'valid-x', description: 'ok', file: 'x.md' },
      { name: '', description: 'empty name', file: 'y.md' },
      { description: 'missing name', file: 'y.md' },
      { name: 'no-desc', file: 'z.md' },
      { name: 'no-file', description: 'no file' },
      'not-an-object',
      null,
    ]);

    loadTeamSkills({ bundleRoot });

    const lib = SkillLibrary.getInstance({ resourceDir: '/nonexistent', readFile: async () => '[]' });
    const entries = await lib.list({ source: 'team' });
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('valid-x');
  });

  it('no-ops when the bundle does not exist', async () => {
    loadTeamSkills({ bundleRoot: '/var/empty/does/not/exist' });

    const lib = SkillLibrary.getInstance({ resourceDir: '/nonexistent', readFile: async () => '[]' });
    const entries = await lib.list({ source: 'team' });
    expect(entries).toHaveLength(0);
  });

  it('is idempotent - a second call does not re-register', async () => {
    bundleRoot = makeBundle([{ name: 'a-b', description: 'd', file: 'a.md' }]);

    loadTeamSkills({ bundleRoot });
    loadTeamSkills({ bundleRoot }); // second call should be a no-op via the loaded latch

    const lib = SkillLibrary.getInstance({ resourceDir: '/nonexistent', readFile: async () => '[]' });
    const entries = await lib.list({ source: 'team' });
    expect(entries).toHaveLength(1);
  });

  it('skips duplicate slugs within the manifest (first wins)', async () => {
    bundleRoot = makeBundle([
      { name: 'dup', description: 'first', file: 'first.md' },
      { name: 'dup', description: 'second', file: 'second.md' },
    ]);

    loadTeamSkills({ bundleRoot });

    const lib = SkillLibrary.getInstance({ resourceDir: '/nonexistent', readFile: async () => '[]' });
    const entries = await lib.list({ source: 'team' });
    expect(entries).toHaveLength(1);
    expect(entries[0].description).toBe('first');
  });
});
