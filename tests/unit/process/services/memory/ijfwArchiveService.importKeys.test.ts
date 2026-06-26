/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * S14 regression: importers (drag-drop / Obsidian / claude-mem) write `created:`
 * for the date and `scope: global` for global membership, but the reader only
 * read `stored:` and only mapped a `global` *tag*. Consequences: imported
 * entries got storedAt=Date.now() on every reindex (wrong dates/deltas/streak),
 * and scope:global entries never appeared under the Global filter.
 *
 * S13 regression: the GitHub #137 homedir-scan fix (scan ~/.ijfw/memory) had
 * zero unit coverage of buildIndex/scan placing a homedir-scope file into the
 * index even when a registry is present. This guards it from regressing.
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { IjfwArchiveService } from '@process/services/memory/ijfwArchiveService';
import type { WatcherFactory } from '@process/services/memory/ijfwArchiveService';

const noopWatcherFactory: WatcherFactory = () => ({ close: () => undefined });

// The archive service skips any project path containing '/tmp/' or 'Temp/', so
// fixtures cannot live under os.tmpdir() — NOR under process.cwd() when the
// checkout itself lives in a temp dir (e.g. a /private/tmp git worktree). Root
// under the real homedir, which never contains '/tmp/'.
function makeTmpDir(): string {
  const scratchRoot = path.join(os.homedir(), '.ijfw-test-scratch');
  fs.mkdirSync(scratchRoot, { recursive: true });
  return fs.mkdtempSync(path.join(scratchRoot, 'import-keys-'));
}

function writeFile(dir: string, filename: string, content: string): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content, 'utf8');
}

/** Build a frontmatter block using the IMPORTER key shape (created/scope). */
function importedEntry(opts: {
  type: string;
  summary: string;
  created?: string;
  scope?: string;
  body: string;
}): string {
  const lines = ['---', `type: ${opts.type}`, `summary: ${opts.summary}`];
  if (opts.created) lines.push(`created: ${opts.created}`);
  if (opts.scope) lines.push(`scope: ${opts.scope}`);
  lines.push('---', opts.body, '');
  return lines.join('\n');
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe('IjfwArchiveService import-key compatibility (S13, S14)', () => {
  let tmpRoot: string;
  let service: IjfwArchiveService;

  afterEach(() => {
    if (service) service.dispose();
    if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('S14: reads `created:` (not just `stored:`) for the entry date', async () => {
    tmpRoot = makeTmpDir();
    const fakeHome = path.join(tmpRoot, 'home');
    const homeMemDir = path.join(fakeHome, '.ijfw', 'memory');
    const createdIso = '2026-03-15T08:00:00.000Z';
    writeFile(
      homeMemDir,
      'dropped-1-note.md',
      importedEntry({
        type: 'observation',
        summary: 'Imported note with a created date',
        created: createdIso,
        scope: 'project',
        body: 'Body of an imported note.',
      })
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;
    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const { entries } = await service.listEntries({ limit: 10 });
      const entry = entries.find((e) => e.summary === 'Imported note with a created date');
      expect(entry).toBeDefined();
      // Before the fix storedAt fell back to Date.now(); now it reflects `created`.
      expect(entry!.storedAt).toBe(Date.parse(createdIso));
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('S14: scope:global (empty tags) entries appear under the Global filter', async () => {
    tmpRoot = makeTmpDir();
    const fakeHome = path.join(tmpRoot, 'home');
    const homeMemDir = path.join(fakeHome, '.ijfw', 'memory');
    writeFile(
      homeMemDir,
      'dropped-2-global.md',
      importedEntry({
        type: 'observation',
        summary: 'A global-scoped imported memory',
        created: '2026-04-01T10:00:00.000Z',
        scope: 'global',
        body: 'This entry has no tags, only scope: global.',
      })
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;
    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const { entries, total } = await service.listEntries({ project: 'global' });
      // Before the fix the Global filter kept only tags.includes('global'); a
      // scope:global file with empty tags was excluded.
      expect(total).toBe(1);
      expect(entries[0].summary).toBe('A global-scoped imported memory');
      expect(entries[0].tags).toContain('global');
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });

  it('S13: buildIndex indexes a homedir-scope file (~/.ijfw/memory) even with a registry present (#137)', async () => {
    tmpRoot = makeTmpDir();
    const fakeHome = path.join(tmpRoot, 'home');

    // A real per-project entry registered in registry.md...
    const projectRoot = path.join(tmpRoot, 'proj');
    const projectMemDir = path.join(projectRoot, '.ijfw', 'memory');
    writeFile(
      projectMemDir,
      'knowledge.md',
      importedEntry({
        type: 'decision',
        summary: 'A per-project decision',
        created: '2026-05-01T10:00:00.000Z',
        body: 'Project body.',
      })
    );
    const ijfwHomeDir = path.join(fakeHome, '.ijfw');
    fs.mkdirSync(ijfwHomeDir, { recursive: true });
    fs.writeFileSync(
      path.join(ijfwHomeDir, 'registry.md'),
      `${projectRoot} | abc123 | ${new Date().toISOString()}\n`,
      'utf8'
    );

    // ...plus a global home-brain entry that lives ONLY at ~/.ijfw/memory.
    writeFile(
      path.join(fakeHome, '.ijfw', 'memory'),
      'home-brain.md',
      importedEntry({
        type: 'observation',
        summary: 'Home-brain memory at the homedir scope',
        created: '2026-05-10T09:00:00.000Z',
        body: 'Written by an in-app importer to ~/.ijfw/memory.',
      })
    );

    const origHome = process.env.HOME;
    const origUserProfile = process.env.USERPROFILE;
    process.env.HOME = fakeHome;
    process.env.USERPROFILE = fakeHome;
    try {
      service = new IjfwArchiveService(noopWatcherFactory);
      const { entries } = await service.listEntries({ limit: 50 });
      const summaries = entries.map((e) => e.summary);
      // The homedir scan must be injected as a scanned project IN ADDITION to
      // the registry project, so both entries are indexed.
      expect(summaries).toContain('Home-brain memory at the homedir scope');
      expect(summaries).toContain('A per-project decision');
    } finally {
      restoreEnv('HOME', origHome);
      restoreEnv('USERPROFILE', origUserProfile);
    }
  });
});
