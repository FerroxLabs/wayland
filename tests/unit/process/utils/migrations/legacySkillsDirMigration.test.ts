/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The upgrade has to fix the skill the user ALREADY made (#1190).
 *
 * Skills the Skill builder wrote before this release are sitting in
 * `~/.wayland/skills`, the data root, while every reader scans `getSkillsDir()`
 * under the config root. `SkillLibrary.registerSource` is an in-memory array,
 * so after the next launch nothing in the process knows those skills exist.
 *
 * The migration copies them across. What it must NOT do is the interesting
 * part: never move or delete (a downgrade has to still find them), never
 * overwrite a name already installed, never follow a symlink out of the tree,
 * and never promote `.quarantine` - which lives in that very root and holds
 * bodies SkillGuard blocked.
 */

import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  // Built without `path`/`os`: vi.hoisted runs before the file's own imports.
  root: `${process.env.TMPDIR ?? '/tmp'}/wayland-legacy-skills-${process.pid}`,
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => undefined), set: vi.fn(async () => {}) },
  getSkillsDir: vi.fn(() => `${h.root}/config/skills`),
  getBuiltinSkillsCopyDir: vi.fn(() => `${h.root}/config/builtin-skills`),
  getAutoSkillsDir: vi.fn(() => `${h.root}/config/builtin-skills/_builtin`),
  getAssistantsDir: vi.fn(() => `${h.root}/config/assistants`),
}));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: () => ({ getSkills: () => [] }) },
}));

import {
  LEGACY_SKILLS_DIR_MIGRATION_KEY,
  runLegacySkillsDirMigration,
  type LegacySkillsDirMigrationStore,
} from '@process/utils/migrations/legacySkillsDirMigration';

const LEGACY = path.join(h.root, 'data', 'skills');
const INSTALLED = path.join(h.root, 'config', 'skills');

const WITH_FRONTMATTER = (name: string, body = 'Sort the files.\n') =>
  `---\nname: ${name}\ndescription: does a thing\n---\n\n# ${name}\n\n${body}`;

/** What the builder used to write: markdown, no frontmatter at all. */
const NO_FRONTMATTER = '# my-skill\n\n## Instructions\n\nSort the files.\n';

const writeSkillAt = (root: string, dirName: string, body: string, extra: Record<string, string> = {}) => {
  const dir = path.join(root, dirName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), body, 'utf-8');
  for (const [rel, content] of Object.entries(extra)) {
    const target = path.join(dir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf-8');
  }
  return dir;
};

const makeStore = (): LegacySkillsDirMigrationStore & { values: Record<string, unknown> } => {
  const values: Record<string, unknown> = {};
  return {
    values,
    get: (async (key: string) => values[key]) as LegacySkillsDirMigrationStore['get'],
    set: (async (key: string, value: unknown) => {
      values[key] = value;
    }) as LegacySkillsDirMigrationStore['set'],
  };
};

const logs: string[] = [];
const run = (store: LegacySkillsDirMigrationStore, legacyRoot = LEGACY) =>
  runLegacySkillsDirMigration(store, {
    legacyRoot,
    skillsDir: INSTALLED,
    log: (m) => logs.push(m),
  });

const read = (p: string) => fs.readFileSync(p, 'utf-8');

beforeEach(() => {
  fs.rmSync(h.root, { recursive: true, force: true });
  fs.mkdirSync(LEGACY, { recursive: true });
  fs.mkdirSync(INSTALLED, { recursive: true });
  logs.length = 0;
});

afterEach(() => {
  fs.rmSync(h.root, { recursive: true, force: true });
});

describe('a plain legacy skills directory', () => {
  it('copies a stranded skill into the directory the engine reads', async () => {
    writeSkillAt(LEGACY, 'project-materials-organizer', WITH_FRONTMATTER('Project Materials Organizer'), {
      'reference/notes.md': 'notes',
    });
    const store = makeStore();

    const result = await run(store);

    expect(result.copied).toEqual(['project-materials-organizer']);
    expect(read(path.join(INSTALLED, 'project-materials-organizer', 'SKILL.md'))).toContain(
      'name: Project Materials Organizer'
    );
    expect(read(path.join(INSTALLED, 'project-materials-organizer', 'reference', 'notes.md'))).toBe('notes');
    expect(store.values[LEGACY_SKILLS_DIR_MIGRATION_KEY]).toBe(true);
  });

  it('LEAVES THE LEGACY COPY IN PLACE - a downgrade must still find it', async () => {
    const legacyDir = writeSkillAt(LEGACY, 'project-materials-organizer', WITH_FRONTMATTER('PMO'));

    await run(makeStore());

    expect(fs.existsSync(path.join(legacyDir, 'SKILL.md'))).toBe(true);
    expect(read(path.join(legacyDir, 'SKILL.md'))).toBe(WITH_FRONTMATTER('PMO'));
  });

  it('also sweeps the older importer subfolder', async () => {
    writeSkillAt(path.join(LEGACY, 'imported'), 'tide-morning-brief', WITH_FRONTMATTER('tide-morning-brief'));

    const result = await run(makeStore());

    expect(result.copied).toEqual(['tide-morning-brief']);
    expect(fs.existsSync(path.join(INSTALLED, 'tide-morning-brief', 'SKILL.md'))).toBe(true);
    // The container folder is never itself installed as a skill.
    expect(fs.existsSync(path.join(INSTALLED, 'imported'))).toBe(false);
  });

  it('skips a folder with no SKILL.md at its root', async () => {
    fs.mkdirSync(path.join(LEGACY, 'not-a-skill'), { recursive: true });

    const result = await run(makeStore());

    expect(result.copied).toEqual([]);
    expect(result.skipped).toContainEqual({ name: 'not-a-skill', reason: 'no SKILL.md at its root' });
  });

  it('does nothing and still records the flag when the legacy root is absent', async () => {
    fs.rmSync(LEGACY, { recursive: true, force: true });
    const store = makeStore();

    const result = await run(store);

    expect(result).toEqual({ copied: [], skipped: [] });
    expect(store.values[LEGACY_SKILLS_DIR_MIGRATION_KEY]).toBe(true);
  });
});

describe('a SYMLINKED legacy root', () => {
  it('migrates through the symlink instead of being skipped', async () => {
    // The real shape on macOS: ~/.wayland is a link to Application Support.
    const realData = path.join(h.root, 'application-support');
    const realSkills = path.join(realData, 'skills');
    writeSkillAt(realSkills, 'linked-skill', WITH_FRONTMATTER('Linked Skill'));

    const linkedHome = path.join(h.root, 'home-dot-wayland');
    fs.symlinkSync(realData, linkedHome, 'dir');

    const result = await run(makeStore(), path.join(linkedHome, 'skills'));

    expect(result.copied).toEqual(['linked-skill']);
    expect(read(path.join(INSTALLED, 'linked-skill', 'SKILL.md'))).toContain('name: Linked Skill');
    // And the original is untouched behind the link.
    expect(fs.existsSync(path.join(realSkills, 'linked-skill', 'SKILL.md'))).toBe(true);
  });

  it('refuses an entry whose symlink points out of the legacy tree', async () => {
    const outside = path.join(h.root, 'outside');
    writeSkillAt(outside, 'evil', WITH_FRONTMATTER('Evil'));
    fs.symlinkSync(path.join(outside, 'evil'), path.join(LEGACY, 'evil'), 'dir');

    const result = await run(makeStore());

    expect(result.copied).toEqual([]);
    expect(result.skipped).toContainEqual({
      name: 'evil',
      reason: 'symlink pointing outside the legacy skills tree',
    });
    expect(fs.existsSync(path.join(INSTALLED, 'evil'))).toBe(false);
  });

  it('does not recreate a symlink found inside a skill folder', async () => {
    const outside = path.join(h.root, 'outside');
    fs.mkdirSync(outside, { recursive: true });
    fs.writeFileSync(path.join(outside, 'secret.txt'), 'secret', 'utf-8');
    const dir = writeSkillAt(LEGACY, 'linky', WITH_FRONTMATTER('Linky'));
    fs.symlinkSync(path.join(outside, 'secret.txt'), path.join(dir, 'secret.txt'), 'file');

    const result = await run(makeStore());

    expect(result.copied).toEqual(['linky']);
    expect(fs.existsSync(path.join(INSTALLED, 'linky', 'secret.txt'))).toBe(false);
    expect(result.skipped).toContainEqual({ name: 'linky/secret.txt', reason: 'symlink inside the skill folder' });
  });

  it('does nothing when the legacy root and the skills dir are the same tree', async () => {
    const store = makeStore();

    const result = await runLegacySkillsDirMigration(store, {
      legacyRoot: INSTALLED,
      skillsDir: INSTALLED,
      log: (m) => logs.push(m),
    });

    expect(result).toEqual({ copied: [], skipped: [] });
    expect(store.values[LEGACY_SKILLS_DIR_MIGRATION_KEY]).toBe(true);
  });
});

describe('a name collision', () => {
  it('leaves BOTH alone and keeps the installed copy', async () => {
    writeSkillAt(LEGACY, 'shared-name', WITH_FRONTMATTER('Shared Name', 'OLD BODY\n'));
    writeSkillAt(INSTALLED, 'shared-name', WITH_FRONTMATTER('Shared Name', 'NEW BODY\n'));

    const result = await run(makeStore());

    expect(result.copied).toEqual([]);
    expect(result.skipped).toContainEqual({
      name: 'shared-name',
      reason: 'a skill of that name is already installed',
    });
    expect(read(path.join(INSTALLED, 'shared-name', 'SKILL.md'))).toContain('NEW BODY');
    expect(read(path.join(LEGACY, 'shared-name', 'SKILL.md'))).toContain('OLD BODY');
  });

  it('logs the collision so support can see why a skill did not appear', async () => {
    writeSkillAt(LEGACY, 'shared-name', WITH_FRONTMATTER('Shared Name'));
    writeSkillAt(INSTALLED, 'shared-name', WITH_FRONTMATTER('Shared Name'));

    await run(makeStore());

    expect(logs.some((l) => l.includes('shared-name') && l.includes('already installed'))).toBe(true);
  });
});

describe('a stranded skill written without frontmatter', () => {
  it('is repaired the way skills.save now composes it', async () => {
    writeSkillAt(LEGACY, 'project-materials-organizer', NO_FRONTMATTER);

    const result = await run(makeStore());

    expect(result.copied).toEqual(['project-materials-organizer']);
    const written = read(path.join(INSTALLED, 'project-materials-organizer', 'SKILL.md'));
    expect(written.startsWith('---\n')).toBe(true);
    expect(written).toContain('name: project-materials-organizer');
    expect(written).toContain('## Instructions');
    // It cannot know whether this was a skill or a workflow, so it does not say.
    expect(written).not.toContain('type:');
  });

  it('repairs a frontmatter block that carries no name, which the readers also refuse', async () => {
    writeSkillAt(LEGACY, 'nameless-block', '---\ndescription: only a description\n---\n\n# body\n');

    await run(makeStore());

    const written = read(path.join(INSTALLED, 'nameless-block', 'SKILL.md'));
    expect(written.startsWith('---\nname: nameless-block\n')).toBe(true);
    // The user's own bytes survive underneath rather than being edited.
    expect(written).toContain('description: only a description');
    expect(written).toContain('# body');
  });

  it('does not rewrite a body that already declares its own name', async () => {
    const body = WITH_FRONTMATTER('Hand Written');
    writeSkillAt(LEGACY, 'hand-written', body);

    await run(makeStore());

    expect(read(path.join(INSTALLED, 'hand-written', 'SKILL.md'))).toBe(body);
  });
});

describe('quarantined content', () => {
  it('is never promoted into the live skills directory', async () => {
    // SkillQuarantine.QUARANTINE_DIR is ~/.wayland/skills/.quarantine - blocked
    // bodies live in the very root this migration sweeps.
    writeSkillAt(path.join(LEGACY, '.quarantine'), 'nasty', WITH_FRONTMATTER('Nasty'));

    const result = await run(makeStore());

    expect(result.copied).toEqual([]);
    expect(fs.existsSync(path.join(INSTALLED, '.quarantine'))).toBe(false);
    expect(fs.existsSync(path.join(INSTALLED, 'nasty'))).toBe(false);
    expect(result.skipped).toContainEqual({
      name: '.quarantine',
      reason: 'dot-directory (quarantine and other internals)',
    });
  });
});

describe('running it twice', () => {
  it('is a no-op on the second run, with no filesystem work at all', async () => {
    writeSkillAt(LEGACY, 'once', WITH_FRONTMATTER('Once'));
    const store = makeStore();

    expect((await run(store)).copied).toEqual(['once']);
    const firstWrite = fs.statSync(path.join(INSTALLED, 'once', 'SKILL.md')).mtimeMs;

    // A second skill appears in the legacy tree AFTER the flag is set; the gate
    // means it is not even looked for.
    writeSkillAt(LEGACY, 'twice', WITH_FRONTMATTER('Twice'));

    const second = await run(store);

    expect(second).toEqual({ copied: [], skipped: [] });
    expect(fs.existsSync(path.join(INSTALLED, 'twice'))).toBe(false);
    expect(fs.statSync(path.join(INSTALLED, 'once', 'SKILL.md')).mtimeMs).toBe(firstWrite);
  });

  it('still copies nothing if the flag is cleared - the skip rule carries it', async () => {
    writeSkillAt(LEGACY, 'once', WITH_FRONTMATTER('Once'));
    const store = makeStore();

    await run(store);
    const firstWrite = fs.statSync(path.join(INSTALLED, 'once', 'SKILL.md')).mtimeMs;
    delete store.values[LEGACY_SKILLS_DIR_MIGRATION_KEY];

    const second = await run(store);

    expect(second.copied).toEqual([]);
    expect(second.skipped).toContainEqual({ name: 'once', reason: 'a skill of that name is already installed' });
    expect(fs.statSync(path.join(INSTALLED, 'once', 'SKILL.md')).mtimeMs).toBe(firstWrite);
  });
});
