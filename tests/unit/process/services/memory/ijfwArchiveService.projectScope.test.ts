/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * GitHub #924 - cross-project memory writes.
 *
 * `quickAdd(content, 'project')` used to resolve its destination from
 * `index.projects[0]`, i.e. the most recently active IJFW project ANYWHERE on
 * the machine, with no relation to the project the user was actually working
 * in. Saving a project-scoped memory while in project B therefore appended it
 * to project A's `.ijfw/memory/journal.md`, where any later session opened in
 * project A would read it back as that project's own context.
 *
 * These tests stage two projects with different activity timestamps and assert
 * the entry lands in the project the CALLER named, never in the most-recent one.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { IjfwArchiveService } from '@process/services/memory/ijfwArchiveService';
import type { WatcherFactory } from '@process/services/memory/ijfwArchiveService';

const noopWatcherFactory: WatcherFactory = () => ({ close: () => undefined });

/**
 * The service skips any project path containing '/tmp/' or 'Temp/', so fixtures
 * must not live under os.tmpdir(). Root under the real homedir (mirrors the
 * sibling suite).
 */
function makeTmpDir(): string {
  const scratchRoot = path.join(os.homedir(), '.ijfw-test-scratch');
  fs.mkdirSync(scratchRoot, { recursive: true });
  return fs.mkdtempSync(path.join(scratchRoot, 'scope-'));
}

function writeProject(root: string, stored: string): void {
  const memDir = path.join(root, '.ijfw', 'memory');
  fs.mkdirSync(memDir, { recursive: true });
  fs.writeFileSync(
    path.join(memDir, 'knowledge.md'),
    [
      '<!-- ijfw-schema: v1 -->',
      '# Knowledge Base',
      '---',
      'type: observation',
      `summary: seed entry for ${path.basename(root)}`,
      `stored: ${stored}`,
      'tags: []',
      '---',
      'seed body',
    ].join('\n'),
    'utf8'
  );
}

/**
 * Populate ~/.ijfw/memory - the machine-wide store `loadGlobalMemoryBlock`
 * injects into every chat in every project.
 */
function writeGlobalStore(home: string, stored: string): void {
  const memDir = path.join(home, '.ijfw', 'memory');
  fs.mkdirSync(memDir, { recursive: true });
  fs.writeFileSync(
    path.join(memDir, 'knowledge.md'),
    [
      '<!-- ijfw-schema: v1 -->',
      '# Knowledge Base',
      '---',
      'type: observation',
      'summary: seed entry for the global store',
      `stored: ${stored}`,
      'tags: []',
      '---',
      'seed body',
    ].join('\n'),
    'utf8'
  );
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe('IjfwArchiveService.quickAdd project scoping (#924)', () => {
  let tmpRoot: string;
  let fakeHome: string;
  let recentProject: string;
  let callerProject: string;
  let service: IjfwArchiveService;
  let origHome: string | undefined;
  let origUserProfile: string | undefined;

  beforeEach(() => {
    tmpRoot = makeTmpDir();
    fakeHome = path.join(tmpRoot, 'fake-home');
    recentProject = path.join(tmpRoot, 'project-alpha');
    callerProject = path.join(tmpRoot, 'project-beta');

    // Alpha is the most recently active project on the machine; beta is the one
    // the user is actually working in.
    writeProject(recentProject, '2026-06-01T10:00:00.000Z');
    writeProject(callerProject, '2026-01-01T10:00:00.000Z');

    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    // The GLOBAL store, present and populated - the state left behind by
    // quickAdd('global'), a drag-drop ingest or an importer run. #137 injects
    // os.homedir() into the index as an ordinary project candidate, so without
    // this the access() check in buildIndex drops it and no assertion below can
    // see whether a project-scoped write could reach it. Stored LATER than both
    // projects, so the home store sorts to index.projects[0] - which is both the
    // no-arg resolution order and what the composer seeds its destination from.
    writeGlobalStore(fakeHome, '2026-09-01T10:00:00.000Z');
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${recentProject} | aaa | 2026-06-01T10:00:00.000Z\n${callerProject} | bbb | 2026-01-01T10:00:00.000Z\n`,
      'utf8'
    );

    origHome = process.env.HOME;
    origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;
  });

  afterEach(() => {
    if (service) service.dispose();
    restoreEnv('HOME', origHome);
    restoreEnv('USERPROFILE', origUserProfile);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  const journalOf = (root: string): string => path.join(root, '.ijfw', 'memory', 'journal.md');

  it('writes a project-scoped entry into the named project, not the most recent one', async () => {
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    await service.quickAdd('beta-only secret note', 'project', 'observation', callerProject);

    expect(fs.existsSync(journalOf(callerProject))).toBe(true);
    expect(fs.readFileSync(journalOf(callerProject), 'utf8')).toContain('beta-only secret note');
  });

  it('never leaks a project-scoped entry into a different project', async () => {
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    await service.quickAdd('beta-only secret note', 'project', 'observation', callerProject);

    const alphaJournal = journalOf(recentProject);
    const alphaContent = fs.existsSync(alphaJournal) ? fs.readFileSync(alphaJournal, 'utf8') : '';
    expect(alphaContent).not.toContain('beta-only secret note');
  });

  it('refuses an unknown project path instead of redirecting the note anywhere', async () => {
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    await expect(
      service.quickAdd('unscoped note', 'project', 'observation', path.join(tmpRoot, 'never-registered'))
    ).rejects.toThrow('unresolved_project_scope');

    // Not into another project, and NOT into the global store either - the
    // global block is injected into every chat, so redirecting there would
    // widen the note's reach far beyond the one project the user asked for.
    const globalJournal = path.join(fakeHome, '.ijfw', 'memory', 'journal.md');
    expect(fs.existsSync(globalJournal)).toBe(false);
    for (const root of [recentProject, callerProject]) {
      const j = journalOf(root);
      expect(fs.existsSync(j) ? fs.readFileSync(j, 'utf8') : '').not.toContain('unscoped note');
    }
  });
  it('refuses to guess a project when the caller names none and several exist', async () => {
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    await expect(service.quickAdd('ambiguous note', 'project')).rejects.toThrow('unresolved_project_scope');

    const globalJournal = path.join(fakeHome, '.ijfw', 'memory', 'journal.md');
    expect(fs.existsSync(globalJournal)).toBe(false);
    for (const root of [recentProject, callerProject]) {
      const j = journalOf(root);
      expect(fs.existsSync(j) ? fs.readFileSync(j, 'utf8') : '').not.toContain('ambiguous note');
    }
  });

  it('a project-scoped save can never land in the global store (#924 F1)', async () => {
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    // Control: the global store IS indexed, so the assertions below exercise a
    // reachable destination rather than one buildIndex silently dropped.
    const indexed = await service.getProjects();
    expect(indexed.map((p) => p.path)).toContain(path.resolve(fakeHome));

    // Every project-scope call shape: named-and-valid, named-and-unknown,
    // unnamed, and - the F1 case - named AS the home dir, which #137 puts in the
    // very list this PR turned into the write-destination allowlist.
    await service.quickAdd('valid', 'project', 'observation', callerProject);
    await expect(service.quickAdd('unknown', 'project', 'observation', '/nope')).rejects.toThrow();
    await expect(service.quickAdd('unnamed', 'project')).rejects.toThrow();
    await expect(service.quickAdd('home-named', 'project', 'observation', fakeHome)).rejects.toThrow();

    // The global journal - the one loadGlobalMemoryBlock injects into EVERY
    // chat - must be untouched by all four.
    const globalJournal = path.join(fakeHome, '.ijfw', 'memory', 'journal.md');
    expect(fs.existsSync(globalJournal)).toBe(false);
  });

  it('refuses a sibling directory that merely has an indexed root as a string prefix', async () => {
    // Containment is exact-root by design. A prefix test (`startsWith`) would
    // accept `<root>-evil`, which is a DIFFERENT project, and the write would
    // land there under the name of the one the user chose.
    const evil = `${callerProject}-evil`;
    writeProject(evil, '2026-02-01T10:00:00.000Z');
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    await expect(service.quickAdd('prefix note', 'project', 'observation', evil)).rejects.toThrow(
      'unresolved_project_scope'
    );
    expect(fs.existsSync(journalOf(callerProject))).toBe(false);
    fs.rmSync(evil, { recursive: true, force: true });
  });

  it('does not offer the global store as a project destination (#924 F1)', async () => {
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    // The global store is indexed and MOST RECENT, so it is projects[0] - the
    // entry the composer seeds "Saving to:" from. It must be flagged so the
    // picker can drop it, while staying in the list the Memory tab browses.
    const projects = await service.getProjects();
    expect(projects[0].path).toBe(path.resolve(fakeHome));
    expect(projects[0].isGlobalStore).toBe(true);
    expect(projects.filter((p) => p.isGlobalStore === true)).toHaveLength(1);
    for (const p of projects.filter((x) => x.path !== path.resolve(fakeHome))) {
      expect(p.isGlobalStore).not.toBe(true);
    }
  });

  it('still writes a deliberate global-scoped save to the global store', async () => {
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    // Over-fix guard: excluding the home dir from the PROJECT allowlist must not
    // break the explicit 'global' scope, which is the only supported way in.
    await service.quickAdd('deliberate global note', 'global');

    const globalJournal = path.join(fakeHome, '.ijfw', 'memory', 'journal.md');
    expect(fs.readFileSync(globalJournal, 'utf8')).toContain('deliberate global note');
  });
});

/**
 * A fresh install that imported memories but has no IJFW project: the ONLY
 * indexed root is the global store. `roots.length === 1` then resolved the
 * no-argument project save straight into the machine-wide brain, and no picker
 * ever rendered to show it (the composer shows one only when projects.length > 1).
 */
describe('IjfwArchiveService.quickAdd with only the global store indexed (#924 F1)', () => {
  let tmpRoot: string;
  let fakeHome: string;
  let service: IjfwArchiveService;
  let origHome: string | undefined;
  let origUserProfile: string | undefined;

  beforeEach(() => {
    tmpRoot = makeTmpDir();
    fakeHome = path.join(tmpRoot, 'fake-home');
    // No registry.md and no ~/dev, so the registry read and the fallback scan
    // both come back empty and the home dir is the only candidate left.
    writeGlobalStore(fakeHome, '2026-09-01T10:00:00.000Z');

    origHome = process.env.HOME;
    origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;
  });

  afterEach(() => {
    if (service) service.dispose();
    restoreEnv('HOME', origHome);
    restoreEnv('USERPROFILE', origUserProfile);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('refuses an unnamed project save instead of falling through to the global store', async () => {
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    // Control: the global store really is the single indexed root.
    const projects = await service.getProjects();
    expect(projects.map((p) => p.path)).toEqual([path.resolve(fakeHome)]);

    await expect(service.quickAdd('lonely note', 'project')).rejects.toThrow('unresolved_project_scope');

    const globalJournal = path.join(fakeHome, '.ijfw', 'memory', 'journal.md');
    expect(fs.existsSync(globalJournal)).toBe(false);
  });
});

/**
 * Exactly one real project, plus the global store. The no-argument save is
 * unambiguous and must still work - the global-store exclusion has to be applied
 * BEFORE the "single indexed root" test, or it would either count the global
 * store as a second candidate (refusing a save that is not ambiguous) or resolve
 * the lone root to the global store itself.
 */
describe('IjfwArchiveService.quickAdd with one project and the global store (#924)', () => {
  let tmpRoot: string;
  let fakeHome: string;
  let onlyProject: string;
  let service: IjfwArchiveService;
  let origHome: string | undefined;
  let origUserProfile: string | undefined;

  beforeEach(() => {
    tmpRoot = makeTmpDir();
    fakeHome = path.join(tmpRoot, 'fake-home');
    onlyProject = path.join(tmpRoot, 'project-solo');
    writeProject(onlyProject, '2026-01-01T10:00:00.000Z');
    writeGlobalStore(fakeHome, '2026-09-01T10:00:00.000Z');
    fs.writeFileSync(
      path.join(fakeHome, '.ijfw', 'registry.md'),
      `${onlyProject} | ccc | 2026-01-01T10:00:00.000Z\n`,
      'utf8'
    );

    origHome = process.env.HOME;
    origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;
  });

  afterEach(() => {
    if (service) service.dispose();
    restoreEnv('HOME', origHome);
    restoreEnv('USERPROFILE', origUserProfile);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('resolves an unnamed project save to the single real project, never the global store', async () => {
    service = new IjfwArchiveService(noopWatcherFactory);
    await service.init();

    // Control: the global store is indexed AND sorts first, so this is the
    // ordering that used to decide the destination.
    const projects = await service.getProjects();
    expect(projects[0].path).toBe(path.resolve(fakeHome));
    expect(projects).toHaveLength(2);

    await service.quickAdd('solo note', 'project');

    expect(fs.readFileSync(path.join(onlyProject, '.ijfw', 'memory', 'journal.md'), 'utf8')).toContain('solo note');
    expect(fs.existsSync(path.join(fakeHome, '.ijfw', 'memory', 'journal.md'))).toBe(false);
  });
});
