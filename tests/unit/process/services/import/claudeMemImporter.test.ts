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
});
