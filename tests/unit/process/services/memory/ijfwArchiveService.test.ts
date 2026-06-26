/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { IjfwArchiveService } from '@process/services/memory/ijfwArchiveService';
import type { WatcherFactory } from '@process/services/memory/ijfwArchiveService';

// Stub watcher that does nothing - prevents real chokidar/fs.watch from
// running in tests.
const noopWatcherFactory: WatcherFactory = () => ({ close: () => undefined });

function makeTmpDir(): string {
  // The archive service deliberately skips any project path containing '/tmp/'
  // or 'Temp/' (ijfwArchiveService.ts:389) so a stale registry pointing at junk
  // temp dirs never populates the archive page. Fixtures therefore cannot live
  // under os.tmpdir() — NOR under process.cwd() when the checkout itself lives in
  // a temp dir (e.g. a /private/tmp git worktree), which silently dropped every
  // fixture. Root under the real homedir, which never contains '/tmp/'.
  const scratchRoot = path.join(os.homedir(), '.ijfw-test-scratch');
  fs.mkdirSync(scratchRoot, { recursive: true });
  return fs.mkdtempSync(path.join(scratchRoot, 'memory-'));
}

function writeMemoryFile(dir: string, filename: string, entries: string[]): void {
  const content = ['<!-- ijfw-schema: v1 -->', '# Knowledge Base', ...entries].join('\n');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content, 'utf8');
}

function makeEntry(opts: { type: string; summary: string; stored: string; tags: string; body: string }): string {
  return [
    '---',
    `type: ${opts.type}`,
    `summary: ${opts.summary}`,
    `stored: ${opts.stored}`,
    `tags: ${opts.tags}`,
    '---',
    opts.body,
  ].join('\n');
}

// This suite stages a fake ~/.ijfw memory tree on disk and asserts parsed
// output. The fixtures and path expectations assume posix separators / homedir
// semantics, so the journal/registry reads ENOENT on win32. Prod resolves these
// paths via path.join(os.homedir(), '.ijfw', 'memory') and creates files with
// mkdir-recursive + appendFile (verified missing-file-safe), so this is a test-
// fixture limitation. The service resolves home via os.homedir(), which reads
// $HOME on posix but $USERPROFILE on win32 - the tests below set BOTH, so the
// fixture home is discovered on either platform and this block runs unskipped.
function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
describe('IjfwArchiveService', () => {
  let tmpRoot: string;
  let projectRoot: string;
  let memDir: string;
  let service: IjfwArchiveService;

  beforeEach(() => {
    tmpRoot = makeTmpDir();
    projectRoot = path.join(tmpRoot, 'test-project');
    memDir = path.join(projectRoot, '.ijfw', 'memory');

    // Write a fake registry.md pointing to our test project.
    const ijfwDir = path.join(tmpRoot, '.ijfw-home');
    fs.mkdirSync(ijfwDir, { recursive: true });
    // We can't easily mock os.homedir, so we'll pass the project root directly
    // by writing the fixture files into a path the service will discover.
    // For this test we override the discovery by injecting the files and using
    // a custom init strategy - see note below.

    // Write fixture knowledge.md
    writeMemoryFile(memDir, 'knowledge.md', [
      makeEntry({
        type: 'decision',
        summary: 'Use TypeScript strict mode',
        stored: '2026-05-01T10:00:00.000Z',
        tags: '[typescript, architecture]',
        body: 'Always use strict mode.\n\n**Why:** Catches bugs at compile time.\n\n**How to apply:** Set strict:true in tsconfig.',
      }),
      makeEntry({
        type: 'pattern',
        summary: 'File-per-backend pattern for parallel dispatch',
        stored: '2026-05-15T08:00:00.000Z',
        tags: '[architecture, pattern]',
        body: 'One backend = one file. Eliminates merge conflicts.',
      }),
      makeEntry({
        type: 'observation',
        summary: 'npm audit shows 3 moderate vulns',
        stored: '2026-05-20T12:00:00.000Z',
        tags: '[security]',
        body: 'Run npm audit --fix.',
      }),
    ]);
  });

  afterEach(() => {
    if (service) service.dispose();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('parses fixture files and returns a non-zero total from getStats', async () => {
    // Directly wire the service with a known project - bypasses registry lookup
    // by pointing the service at the project that has .ijfw/memory/.
    // We create a minimal registry.md at a well-known temp path.
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    const now = new Date().toISOString();
    fs.writeFileSync(path.join(ijfwHomeDir, 'registry.md'), `${projectRoot} | abc123 | ${now}\n`, 'utf8');

    // Temporarily override HOME to point to our fake home.
    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const stats = await service.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.projects).toBeGreaterThan(0);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('listEntries returns entries filtered by type', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    const now = new Date().toISOString();
    fs.writeFileSync(path.join(ijfwHomeDir, 'registry.md'), `${projectRoot} | abc123 | ${now}\n`, 'utf8');

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const result = await service.listEntries({ types: ['decision'] });
      expect(result.total).toBeGreaterThan(0);
      expect(result.entries.every((e) => e.type === 'decision')).toBe(true);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('renders global home-brain memories (~/.ijfw/memory) with no registry and no ~/dev (GitHub #137)', async () => {
    // Reproduces #137: UI importers (Obsidian, claude-mem, drag-drop) and
    // quickAdd('global') write to ~/.ijfw/memory, but buildIndex only scanned
    // per-project dirs from registry.md / ~/dev. On a fresh install (no registry,
    // no ~/dev) the memory tab rendered empty despite files on disk.
    const fakeHome = path.join(tmpRoot, 'fresh-home');
    // NOTE: deliberately NO registry.md and NO <fakeHome>/dev — mirrors a
    // non-developer Windows/macOS user who only ran the in-app importer.
    const homeMemDir = path.join(fakeHome, '.ijfw', 'memory');
    writeMemoryFile(homeMemDir, 'obsidian-deadbeef.md', [
      makeEntry({
        type: 'observation',
        summary: 'Imported note from my Obsidian vault',
        stored: '2026-06-10T09:00:00.000Z',
        tags: '[obsidian]',
        body: 'This came from an Obsidian import and must appear in the memory tab.',
      }),
    ]);

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const result = await service.listEntries({});
      expect(result.total).toBeGreaterThan(0);
      expect(result.entries.some((e) => e.summary === 'Imported note from my Obsidian vault')).toBe(true);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('getEntry returns null for unknown id', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${projectRoot} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const entry = await service.getEntry('nonexistent-id-000');
      expect(entry).toBeNull();
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('getEntry returns body text for a known entry', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${projectRoot} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      await service.getStats(); // ensure index is built
      const list = await service.listEntries({ limit: 10 });
      expect(list.entries.length).toBeGreaterThan(0);
      const first = list.entries[0];
      const full = await service.getEntry(first.id);
      expect(full).not.toBeNull();
      expect(typeof full!.body).toBe('string');
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('getProjects returns at least one project', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${projectRoot} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const projects = await service.getProjects();
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].basename).toBe('test-project');
      expect(projects[0].count).toBeGreaterThan(0);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('getTags returns tags with counts', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${projectRoot} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const tags = await service.getTags();
      expect(tags.length).toBeGreaterThan(0);
      expect(typeof tags[0].tag).toBe('string');
      expect(typeof tags[0].count).toBe('number');
      // 'architecture' should appear (tagged on 2 entries)
      const archTag = tags.find((t) => t.tag === 'architecture');
      expect(archTag).toBeDefined();
      expect(archTag!.count).toBeGreaterThanOrEqual(2);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  // ----- B1: quickAdd path resolution -----

  it('B1: quickAdd global scope resolves to os.homedir()/.ijfw/memory', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;
    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      await service.quickAdd('test observation', 'global');
      const expectedDir = path.join(fakeHome, '.ijfw', 'memory');
      expect(fs.existsSync(expectedDir)).toBe(true);
      const journalPath = path.join(expectedDir, 'journal.md');
      expect(fs.existsSync(journalPath)).toBe(true);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('B1: quickAdd project scope resolves inside project root, not double-.ijfw', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${projectRoot} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );
    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;
    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      await service.init();
      await service.quickAdd('project obs', 'project');
      // Must not create a double-.ijfw path
      const wrongPath = path.join(projectRoot, '.ijfw', '.ijfw', 'memory');
      expect(fs.existsSync(wrongPath)).toBe(false);
      // Correct path
      const rightPath = path.join(projectRoot, '.ijfw', 'memory', 'journal.md');
      expect(fs.existsSync(rightPath)).toBe(true);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  // ----- B2: YAML frontmatter injection prevention -----

  it('B2: quickAdd strips newlines from content in summary field (injection prevention)', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;
    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const malicious = 'legit summary\nstored: 2000-01-01\ntags: [hacked]';
      await service.quickAdd(malicious, 'global');
      const journalPath = path.join(fakeHome, '.ijfw', 'memory', 'journal.md');
      const content = fs.readFileSync(journalPath, 'utf8');
      // The stored: line from the malicious content must NOT appear as a bare frontmatter key
      // (it may appear once inside the body block, but the frontmatter summary line must be single-line)
      const lines = content.split('\n');
      const summaryLine = lines.find((l) => l.startsWith('summary:'));
      expect(summaryLine).toBeDefined();
      // summaryLine itself must not contain a newline (it is a single line)
      expect(summaryLine).not.toContain('\n');
      // The 2000-01-01 date must not appear in the stored: frontmatter field
      const storedLine = lines.find((l) => l.startsWith('stored:'));
      expect(storedLine).toBeDefined();
      expect(storedLine).not.toContain('2000-01-01');
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  // ----- Change B: typeCounts and streak -----

  it('B-typeCounts: getStats returns typeCounts with correct per-type counts', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${projectRoot} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const stats = await service.getStats();
      // Fixture has 1 decision, 1 pattern, 1 observation (see beforeEach)
      expect(stats.typeCounts).toBeDefined();
      expect(stats.typeCounts.decision).toBe(1);
      expect(stats.typeCounts.pattern).toBe(1);
      expect(stats.typeCounts.observation).toBe(1);
      // All six keys must be present (zero-filled for missing types)
      expect(typeof stats.typeCounts.session).toBe('number');
      expect(typeof stats.typeCounts.wiki).toBe('number');
      expect(typeof stats.typeCounts.preference).toBe('number');
      expect(stats.typeCounts.session).toBe(0);
      expect(stats.typeCounts.wiki).toBe(0);
      expect(stats.typeCounts.preference).toBe(0);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('B-streak-sessions: streak.sessions equals distinct active day count', async () => {
    // Fixture entries span 3 distinct days: 2026-05-01, 2026-05-15, 2026-05-20
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${projectRoot} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const stats = await service.getStats();
      expect(stats.streak.sessions).toBe(3);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('B-streak-longestDays: computes longest consecutive run (3 consecutive then gap then 2)', async () => {
    // Write a fresh project with entries on specific days to test consecutive logic:
    // Days: 2026-05-01, 2026-05-02, 2026-05-03 (run of 3), then 2026-05-10, 2026-05-11 (run of 2)
    const streakProject = path.join(tmpRoot, 'streak-project');
    const streakMemDir = path.join(streakProject, '.ijfw', 'memory');
    writeMemoryFile(streakMemDir, 'knowledge.md', [
      makeEntry({ type: 'decision', summary: 'Day 1', stored: '2026-05-01T10:00:00.000Z', tags: '[]', body: 'Body.' }),
      makeEntry({ type: 'pattern', summary: 'Day 2', stored: '2026-05-02T10:00:00.000Z', tags: '[]', body: 'Body.' }),
      makeEntry({
        type: 'observation',
        summary: 'Day 3',
        stored: '2026-05-03T10:00:00.000Z',
        tags: '[]',
        body: 'Body.',
      }),
      makeEntry({ type: 'decision', summary: 'Day 10', stored: '2026-05-10T10:00:00.000Z', tags: '[]', body: 'Body.' }),
      makeEntry({ type: 'pattern', summary: 'Day 11', stored: '2026-05-11T10:00:00.000Z', tags: '[]', body: 'Body.' }),
    ]);

    const fakeHome = path.join(tmpRoot, 'fake-home-streak');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${streakProject} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const stats = await service.getStats();
      expect(stats.streak.longestDays).toBe(3);
      expect(stats.streak.sessions).toBe(5);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('B-streak-empty: empty index returns zero streak', async () => {
    // Project exists but has no memory entries
    const emptyProject = path.join(tmpRoot, 'empty-project');
    const emptyMemDir = path.join(emptyProject, '.ijfw', 'memory');
    fs.mkdirSync(emptyMemDir, { recursive: true });
    // Write an empty knowledge.md (no frontmatter blocks)
    fs.writeFileSync(path.join(emptyMemDir, 'knowledge.md'), '# Empty\n', 'utf8');

    const fakeHome = path.join(tmpRoot, 'fake-home-empty');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${emptyProject} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const stats = await service.getStats();
      expect(stats.streak).toEqual({ sessions: 0, longestDays: 0, lastActiveDayMs: 0 });
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('indexStats reflects parsed entry count', async () => {
    const fakeHome = path.join(tmpRoot, 'fake-home');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${projectRoot} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      await service.getStats();
      const stats = service.indexStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.projects).toBeGreaterThan(0);
      expect(stats.lastIndexedAt).toBeGreaterThan(0);
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  // ----- GitHub #110: archive/wiki UI showed "your memory is empty" because the
  // reader only read a hardcoded filename allowlist. Real IJFW installs write
  // durable memory to arbitrarily-named files (devscan-<hash>.md) and nested
  // dirs (global/preferences.md), which were silently dropped. The reader now
  // scans every *.md under .ijfw/memory (one subdir level deep). -----

  it('#110: parses arbitrarily-named memory files (not just the legacy allowlist)', async () => {
    // A project whose ONLY memory file is a dev-scan file with a hash name —
    // exactly the shape that produced the empty archive on real installs.
    const scanProject = path.join(tmpRoot, 'scan-project');
    const scanMemDir = path.join(scanProject, '.ijfw', 'memory');
    writeMemoryFile(scanMemDir, 'devscan-041ff6242733.md', [
      makeEntry({
        type: 'observation',
        summary: 'Dev-scan recovered this entry',
        stored: '2026-05-27T09:11:14.255Z',
        tags: '[devscan]',
        body: 'This file is not in the legacy MEMORY_FILES allowlist.',
      }),
    ]);

    const fakeHome = path.join(tmpRoot, 'fake-home-scan');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${scanProject} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const { entries, total } = await service.listEntries({ limit: 10 });
      expect(total).toBe(1);
      expect(entries[0].summary).toBe('Dev-scan recovered this entry');
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('#110: parses memory files nested one subdir deep (e.g. global/)', async () => {
    const nestedProject = path.join(tmpRoot, 'nested-project');
    const nestedMemDir = path.join(nestedProject, '.ijfw', 'memory');
    // Root-level flat file with no frontmatter (like project-journal.md) must be
    // tolerated and yield zero entries, not break the scan.
    fs.mkdirSync(nestedMemDir, { recursive: true });
    fs.writeFileSync(
      path.join(nestedMemDir, 'project-journal.md'),
      '# IJFW Project Journal\n- [2026-05-13T06:21:59Z] session-end: #1\n',
      'utf8'
    );
    // Real durable entry nested under global/.
    writeMemoryFile(path.join(nestedMemDir, 'global'), 'preferences.md', [
      makeEntry({
        type: 'preference',
        summary: 'Nested global preference is read',
        stored: '2026-05-20T12:00:00.000Z',
        tags: '[global]',
        body: 'Lives under global/, one subdir deep.',
      }),
    ]);

    const fakeHome = path.join(tmpRoot, 'fake-home-nested');
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${nestedProject} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;

    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const { entries, total } = await service.listEntries({ limit: 10 });
      expect(total).toBe(1);
      expect(entries[0].summary).toBe('Nested global preference is read');
      expect(entries[0].type).toBe('preference');
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });
});
