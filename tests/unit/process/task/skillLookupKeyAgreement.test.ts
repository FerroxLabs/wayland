/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ONE key has to work in BOTH skill lookups (#1190).
 *
 * `enableSkillForAssistant` names the hazard outright:
 *
 *   "MATCHED BY DIRECTORY NAME, which is the subtle part. `AcpSkillManager.
 *    discoverSkills` matches on the directory a skill lives in, while
 *    `consumePendingSessionSkills` matches on the SkillLibrary index name.
 *    Those two are not always the same string"
 *
 * And they are routinely not: `fs.listAvailableSkills` - the list the Settings
 * skill picker ticks against - returns each skill's FRONTMATTER `name:`, so a
 * skill in `project-materials-organizer/` whose SKILL.md says
 * `name: Project Materials Organizer` gets THAT string written into
 * `enabledSkills`. `consumePendingSessionSkills` resolves it (SkillLibrary is
 * keyed the same way); `discoverSkills` compared it to folder names only and
 * reported "Discovered 0 optional skills".
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  skillsDir: `${process.env.TMPDIR ?? '/tmp'}/wayland-key-agreement-${process.pid}`,
  emptyDir: `${process.env.TMPDIR ?? '/tmp'}/wayland-key-agreement-empty-${process.pid}`,
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => undefined), set: vi.fn(async () => {}) },
  getSkillsDir: vi.fn(() => h.skillsDir),
  getBuiltinSkillsCopyDir: vi.fn(() => h.emptyDir),
  getAutoSkillsDir: vi.fn(() => h.emptyDir),
  getAssistantsDir: vi.fn(() => h.emptyDir),
}));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: () => ({ getSkills: () => [] }) },
}));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));

import { AcpSkillManager } from '@process/task/AcpSkillManager';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

/** The string Settings and the library both use: the skill's own `name:`. */
const INDEX_NAME = 'Project Materials Organizer';
/** The string the folder on disk uses. Deliberately different. */
const DIR_NAME = 'project-materials-organizer';

const writeSkill = (dirName: string, frontmatterName: string, description = 'Sorts project materials') => {
  const dir = path.join(h.skillsDir, dirName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'SKILL.md'),
    `---\nname: ${frontmatterName}\ndescription: ${description}\n---\n\n# ${frontmatterName}\n\nSort the files.\n`,
    'utf-8'
  );
  return path.join(dir, 'SKILL.md');
};

/** A library keyed the way SkillLibrary really is - by the entry's own name. */
const libraryWith = (entries: SkillIndexEntry[]) => {
  SkillLibrary.resetInstance();
  const lib = SkillLibrary.getInstance({
    resourceDir: path.join(os.tmpdir(), 'no-such-library'),
    readFile: async (p: string) => {
      if (p.endsWith('index.json')) return '[]';
      return fs.readFileSync(p, 'utf-8');
    },
  });
  lib.registerSource(entries);
  return lib;
};

const discovered = async (enabledSkills: string[]) => {
  const manager = new AcpSkillManager(h.skillsDir);
  await manager.discoverSkills(enabledSkills);
  return manager.getSkillsIndex().map((s) => s.name);
};

beforeEach(() => {
  fs.rmSync(h.skillsDir, { recursive: true, force: true });
  fs.mkdirSync(h.skillsDir, { recursive: true });
  fs.mkdirSync(h.emptyDir, { recursive: true });
});

afterEach(() => {
  SkillLibrary.resetInstance();
});

describe('a skill whose directory name differs from its index name', () => {
  it('resolves through BOTH lookup paths on the same key', async () => {
    const skillFile = writeSkill(DIR_NAME, INDEX_NAME);
    const lib = libraryWith([
      {
        name: INDEX_NAME,
        description: 'Sorts project materials',
        type: 'skill',
        source: 'user',
        metadata: { tags: [] },
        path: skillFile,
      },
    ]);

    // consumePendingSessionSkills' lookup: SkillLibrary index name.
    expect(await lib.get(INDEX_NAME)).not.toBeNull();
    expect(await lib.loadBody(INDEX_NAME)).toContain('Sort the files.');

    // discoverSkills' lookup: the SAME string, against a different folder.
    expect(await discovered([INDEX_NAME])).toContain(INDEX_NAME);
  });

  it('still resolves under the directory name, which is what an import writes', async () => {
    writeSkill(DIR_NAME, INDEX_NAME);

    expect(await discovered([DIR_NAME])).toContain(INDEX_NAME);
  });
});

describe('the second pass stays narrow', () => {
  it('loads nothing the user did not enable', async () => {
    writeSkill(DIR_NAME, INDEX_NAME);
    writeSkill('other-skill', 'Some Other Skill');

    expect(await discovered([INDEX_NAME])).toEqual([INDEX_NAME]);
  });

  it('a directory match wins over another folder that merely calls itself that', async () => {
    // `weather` the FOLDER, and `forecast/` whose SKILL.md says `name: weather`.
    writeSkill('weather', 'Weather By Folder');
    writeSkill('forecast', 'weather');

    expect(await discovered(['weather'])).toEqual(['Weather By Folder']);
  });

  it('a nameless SKILL.md is still skipped', async () => {
    const dir = path.join(h.skillsDir, 'no-frontmatter');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), '# no frontmatter here\n', 'utf-8');

    expect(await discovered(['no-frontmatter'])).toEqual([]);
  });
});
