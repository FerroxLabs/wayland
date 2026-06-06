/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { scanForMemoryDirs, runDevScanImport } from '@process/services/import/devScanImporter';

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-devscan-test-'));
}

function makeProjectWithMemory(
  baseDir: string,
  projectName: string,
  files: Record<string, string>,
): string {
  const projectPath = path.join(baseDir, projectName);
  const memDir = path.join(projectPath, '.ijfw', 'memory');
  fs.mkdirSync(memDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(memDir, name), content, 'utf8');
  }
  return projectPath;
}

const SAMPLE_MEMORY = [
  '---',
  'type: decision',
  'summary: Use strict TypeScript',
  'stored: 2026-05-01T10:00:00.000Z',
  'tags: [typescript]',
  '---',
  'Always use strict mode.',
].join('\n');

describe('scanForMemoryDirs', () => {
  // This function scans ~/dev/ which we can't control in tests.
  // Just verify it doesn't throw and returns an array.
  it('returns an array without throwing', async () => {
    const result = await scanForMemoryDirs();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('runDevScanImport', () => {
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

  it('returns error for paths with no .ijfw/memory', async () => {
    const memDir = makeTmp();
    tmpDirs.push(memDir);
    const fakeProject = makeTmp();
    tmpDirs.push(fakeProject);

    const result = await runDevScanImport([fakeProject], { ijfwMemoryDir: memDir });
    expect(result.projectsFound).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('imports memory entries from a project', async () => {
    const sourceBase = makeTmp();
    tmpDirs.push(sourceBase);
    const targetMemDir = makeTmp();
    tmpDirs.push(targetMemDir);

    const projectPath = makeProjectWithMemory(sourceBase, 'my-project', {
      'knowledge.md': SAMPLE_MEMORY,
    });

    const result = await runDevScanImport([projectPath], { ijfwMemoryDir: targetMemDir });

    expect(result.errors).toHaveLength(0);
    expect(result.projectsFound).toBe(1);
    expect(result.imported).toBeGreaterThan(0);

    const files = fs.readdirSync(targetMemDir);
    expect(files.some((f) => f.startsWith('devscan-'))).toBe(true);
  });

  it('deduplicates on second run', async () => {
    const sourceBase = makeTmp();
    tmpDirs.push(sourceBase);
    const targetMemDir = makeTmp();
    tmpDirs.push(targetMemDir);

    const projectPath = makeProjectWithMemory(sourceBase, 'my-project', {
      'knowledge.md': SAMPLE_MEMORY,
    });

    const first = await runDevScanImport([projectPath], { ijfwMemoryDir: targetMemDir });
    expect(first.imported).toBeGreaterThan(0);

    const second = await runDevScanImport([projectPath], { ijfwMemoryDir: targetMemDir });
    expect(second.imported).toBe(0);
    expect(second.skipped).toBeGreaterThan(0);
  });

  it('handles multiple memory files in one project', async () => {
    const sourceBase = makeTmp();
    tmpDirs.push(sourceBase);
    const targetMemDir = makeTmp();
    tmpDirs.push(targetMemDir);

    const projectPath = makeProjectWithMemory(sourceBase, 'multi-file-project', {
      'knowledge.md': SAMPLE_MEMORY,
      'journal.md': [
        '---',
        'type: observation',
        'summary: Journal entry',
        'stored: 2026-05-02T10:00:00.000Z',
        'tags: []',
        '---',
        'Recorded something important.',
      ].join('\n'),
    });

    const result = await runDevScanImport([projectPath], { ijfwMemoryDir: targetMemDir });
    expect(result.imported).toBeGreaterThanOrEqual(2);
  });

  it('returns empty result for empty paths array', async () => {
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    const result = await runDevScanImport([], { ijfwMemoryDir: memDir });
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.projectsFound).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
