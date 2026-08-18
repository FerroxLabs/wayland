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

    // Every project-scope call shape: named-and-valid, named-and-unknown, unnamed.
    await service.quickAdd('valid', 'project', 'observation', callerProject);
    await expect(service.quickAdd('unknown', 'project', 'observation', '/nope')).rejects.toThrow();
    await expect(service.quickAdd('unnamed', 'project')).rejects.toThrow();

    // The global journal - the one loadGlobalMemoryBlock injects into EVERY
    // chat - must be untouched by all three.
    const globalJournal = path.join(fakeHome, '.ijfw', 'memory', 'journal.md');
    expect(fs.existsSync(globalJournal)).toBe(false);
  });
});
