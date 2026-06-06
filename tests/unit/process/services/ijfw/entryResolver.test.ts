/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

vi.mock('electron-log', () => ({
  default: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// eslint-disable-next-line import/first
import { resolveEntry } from '@process/services/ijfw/entryResolver';

function mkServerDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-entry-'));
}

describe('ijfw/entryResolver', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkServerDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('resolves bin when it is a string', async () => {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ bin: './dist/server.js' }),
    );
    const entry = await resolveEntry(dir);
    expect(entry).toBe(path.join(dir, './dist/server.js'));
  });

  it('resolves bin["ijfw-mcp"] when bin is an object', async () => {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ bin: { 'ijfw-mcp': './bin/mcp.js', 'other-cli': './other.js' } }),
    );
    const entry = await resolveEntry(dir);
    expect(entry).toBe(path.join(dir, './bin/mcp.js'));
  });

  it('falls back to main when bin is absent', async () => {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ main: 'index.js' }),
    );
    const entry = await resolveEntry(dir);
    expect(entry).toBe(path.join(dir, 'index.js'));
  });

  it('falls back to src/server.js with a warning when package.json is missing', async () => {
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'server.js'), '// stub');
    const entry = await resolveEntry(dir);
    expect(entry).toBe(path.join(dir, 'src', 'server.js'));
  });

  it('falls back to src/server.js when package.json lacks bin/main', async () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'no-entry' }));
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'server.js'), '// stub');
    const entry = await resolveEntry(dir);
    expect(entry).toBe(path.join(dir, 'src', 'server.js'));
  });

  it('throws when no entry can be found anywhere', async () => {
    await expect(resolveEntry(dir)).rejects.toThrow();
  });

  it('falls back to src/server.js when package.json is malformed', async () => {
    fs.writeFileSync(path.join(dir, 'package.json'), '{ not valid json');
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'server.js'), '// stub');
    const entry = await resolveEntry(dir);
    expect(entry).toBe(path.join(dir, 'src', 'server.js'));
  });
});
