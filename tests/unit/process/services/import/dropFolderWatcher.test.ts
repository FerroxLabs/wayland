/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runDropFolderProcess, startDropFolderWatcher } from '@process/services/import/dropFolderWatcher';

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-dropfolder-test-'));
}

describe('runDropFolderProcess', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    tmpDirs.length = 0;
  });

  it('returns zero count for an empty drop folder', async () => {
    const dropFolder = makeTmp();
    tmpDirs.push(dropFolder);
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    const result = await runDropFolderProcess({ dropFolder, ijfwMemoryDir: memDir });
    expect(result.count).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('creates drop folder and memory dir if they do not exist', async () => {
    const baseDir = makeTmp();
    tmpDirs.push(baseDir);
    const dropFolder = path.join(baseDir, 'new-drop');
    const memDir = path.join(baseDir, 'new-memory');

    await runDropFolderProcess({ dropFolder, ijfwMemoryDir: memDir });

    expect(fs.existsSync(dropFolder)).toBe(true);
    expect(fs.existsSync(memDir)).toBe(true);
  });

  it('ingests .md files and removes originals', async () => {
    const dropFolder = makeTmp();
    tmpDirs.push(dropFolder);
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    fs.writeFileSync(
      path.join(dropFolder, 'note.md'),
      '# Dropped Note\nSome content.',
      'utf8',
    );

    const result = await runDropFolderProcess({ dropFolder, ijfwMemoryDir: memDir });

    expect(result.count).toBe(1);
    expect(result.errors).toHaveLength(0);

    // Original should be removed.
    expect(fs.existsSync(path.join(dropFolder, 'note.md'))).toBe(false);

    // A file should appear in memory dir.
    const memFiles = fs.readdirSync(memDir);
    expect(memFiles.length).toBe(1);
    expect(memFiles[0]).toMatch(/^dropped-\d+-note\.md$/);
  });

  it('ingests .txt files wrapped in frontmatter', async () => {
    const dropFolder = makeTmp();
    tmpDirs.push(dropFolder);
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    fs.writeFileSync(
      path.join(dropFolder, 'thoughts.txt'),
      'Just a plain text note.',
      'utf8',
    );

    const result = await runDropFolderProcess({ dropFolder, ijfwMemoryDir: memDir });
    expect(result.count).toBe(1);

    const memFiles = fs.readdirSync(memDir);
    const content = fs.readFileSync(path.join(memDir, memFiles[0]), 'utf8');
    expect(content).toContain('---');
    expect(content).toContain('type: observation');
    expect(content).toContain('Just a plain text note.');
  });

  it('ignores files with unsupported extensions', async () => {
    const dropFolder = makeTmp();
    tmpDirs.push(dropFolder);
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    fs.writeFileSync(path.join(dropFolder, 'image.png'), 'fake png', 'utf8');
    fs.writeFileSync(path.join(dropFolder, 'note.md'), '# Note', 'utf8');

    const result = await runDropFolderProcess({ dropFolder, ijfwMemoryDir: memDir });
    expect(result.count).toBe(1); // only .md
  });

  it('ingests .json files wrapped in frontmatter', async () => {
    const dropFolder = makeTmp();
    tmpDirs.push(dropFolder);
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    fs.writeFileSync(
      path.join(dropFolder, 'data.json'),
      JSON.stringify({ key: 'value' }),
      'utf8',
    );

    const result = await runDropFolderProcess({ dropFolder, ijfwMemoryDir: memDir });
    expect(result.count).toBe(1);
  });
});

describe('startDropFolderWatcher', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    tmpDirs.length = 0;
  });

  it('creates drop folder on start and returns a stop handle', () => {
    const dropFolder = path.join(makeTmp(), 'watch-drop');
    const memDir = makeTmp();
    tmpDirs.push(path.dirname(dropFolder));
    tmpDirs.push(memDir);

    const handle = startDropFolderWatcher({
      dropFolder,
      ijfwMemoryDir: memDir,
      onIngest: () => undefined,
      onError: () => undefined,
    });

    expect(fs.existsSync(dropFolder)).toBe(true);
    expect(typeof handle.stop).toBe('function');

    handle.stop();
  });

  it('fires onIngest when a .md file is added', async () => {
    const dropFolder = makeTmp();
    tmpDirs.push(dropFolder);
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    const ingested: string[] = [];
    const handle = startDropFolderWatcher({
      dropFolder,
      ijfwMemoryDir: memDir,
      onIngest: (filename) => ingested.push(filename),
      onError: () => undefined,
    });

    // Wait a tick for chokidar to initialise.
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Write a file into the drop folder.
    fs.writeFileSync(path.join(dropFolder, 'watch-note.md'), '# Watch Test\nBody.', 'utf8');

    // Wait for chokidar add event and async ingest.
    await new Promise((resolve) => setTimeout(resolve, 800));

    handle.stop();

    // Allow chokidar close to settle.
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(ingested).toContain('watch-note.md');
    // Original should have been consumed.
    expect(fs.existsSync(path.join(dropFolder, 'watch-note.md'))).toBe(false);
  }, 10000);
});
