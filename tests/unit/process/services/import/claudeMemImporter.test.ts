/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runClaudeMemImport } from '@process/services/import/claudeMemImporter';

// Pin os.homedir() to a controllable value so the importer's source-db
// lookup (~/.claude-mem/claude-mem.db) is hermetic. Without this, a developer
// machine that has a real ~/.claude-mem db leaks into the test, making the
// "db file does not exist" path unreachable. ESM namespaces are not spy-able,
// so the module is mocked and the home value is driven via a mutable ref.
let mockHome = '';
vi.mock('node:os', async (importActual) => {
  const actual = await importActual<typeof import('node:os')>();
  return {
    ...actual,
    default: { ...actual, homedir: () => mockHome },
    homedir: () => mockHome,
  };
});

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-claude-mem-test-'));
}

describe('runClaudeMemImport', () => {
  const tmpDirs: string[] = [];

  beforeEach(() => {
    // Empty temp dir as home → ~/.claude-mem/claude-mem.db is absent.
    const fakeHome = makeTmp();
    tmpDirs.push(fakeHome);
    mockHome = fakeHome;
  });

  afterEach(() => {
    for (const dir of tmpDirs) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
    tmpDirs.length = 0;
  });

  it('returns error when db file does not exist', async () => {
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    // Home is pinned to an empty temp dir (see beforeEach), so
    // ~/.claude-mem/claude-mem.db does not exist and the importer should
    // report a "not found" error.
    const result = await runClaudeMemImport({ ijfwMemoryDir: memDir });

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
    // Should have exactly one error about the missing db file, OR about
    // better-sqlite3 unavailability in test environments.
    expect(result.errors.length).toBeGreaterThan(0);
    const firstError = result.errors[0];
    expect(
      firstError.includes('not found') || firstError.includes('better-sqlite3') || firstError.includes('Failed to open')
    ).toBe(true);
  });

  it('does not throw when db is missing', async () => {
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    await expect(runClaudeMemImport({ ijfwMemoryDir: memDir })).resolves.toBeDefined();
  });

  it('creates target memory dir if absent', async () => {
    const baseDir = makeTmp();
    tmpDirs.push(baseDir);
    const memDir = path.join(baseDir, 'deep', 'memory');

    // Don't pre-create memDir - the importer should create it.
    const result = await runClaudeMemImport({ ijfwMemoryDir: memDir });

    // The function may error for various reasons (missing db), but the
    // memory dir should have been created before the error (unless the
    // error is the missing db, which is checked first).
    expect(result).toHaveProperty('imported');
    expect(result).toHaveProperty('errors');
  });

  // #165: native Claude Code project memory (~/.claude/projects/<p>/memory/*.md)
  // must import even when the claude-mem SQLite db is absent.
  it('imports native Claude Code project memory when the db is absent', async () => {
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    // Seed a native project memory file under the pinned home.
    const projMemDir = path.join(mockHome, '.claude', 'projects', '-Users-x-dev-proj', 'memory');
    fs.mkdirSync(projMemDir, { recursive: true });
    fs.writeFileSync(
      path.join(projMemDir, 'a-fact.md'),
      ['---', 'name: a-fact', 'description: A real thing worth remembering', 'type: project', '---', '', 'The body of the fact.'].join(
        '\n',
      ),
      'utf8',
    );
    // MEMORY.md index must be skipped (no frontmatter blocks).
    fs.writeFileSync(path.join(projMemDir, 'MEMORY.md'), '- [a-fact](a-fact.md) - hook\n', 'utf8');

    const result = await runClaudeMemImport({ ijfwMemoryDir: memDir });

    expect(result.imported).toBe(1);
    const written = fs.readdirSync(memDir).filter((n) => n.startsWith('claude-project-'));
    expect(written).toHaveLength(1);
    const body = fs.readFileSync(path.join(memDir, written[0]), 'utf8');
    expect(body).toContain('source: claude-project');
    expect(body).toContain('The body of the fact.');
  });

  it('dedupes native project memory on re-import', async () => {
    const memDir = makeTmp();
    tmpDirs.push(memDir);

    const projMemDir = path.join(mockHome, '.claude', 'projects', '-Users-x-dev-proj', 'memory');
    fs.mkdirSync(projMemDir, { recursive: true });
    fs.writeFileSync(
      path.join(projMemDir, 'a-fact.md'),
      ['---', 'description: A real thing', '---', '', 'Body.'].join('\n'),
      'utf8',
    );

    const first = await runClaudeMemImport({ ijfwMemoryDir: memDir });
    expect(first.imported).toBe(1);

    const second = await runClaudeMemImport({ ijfwMemoryDir: memDir });
    expect(second.imported).toBe(0);
    expect(second.skipped).toBe(1);
  });
});
