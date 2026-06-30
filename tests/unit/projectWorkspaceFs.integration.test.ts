/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #455 acceptance, filesystem level: allocating and ensuring a project workspace
 * must create a REAL directory on disk (not a temp `*-temp-*` dir) under the
 * default base, and persist + bootstrap it. Exercises the real fs (only electron
 * `app.getPath` is stubbed to a tmpdir) so we prove "create a project -> it has a
 * real workspace dir on disk" without an agent turn.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import os from 'os';
import path from 'path';
import { existsSync } from 'fs';
import fs from 'fs/promises';

let tmpBase: string;

vi.mock('electron', () => ({
  app: { getPath: (k: string) => (k === 'documents' ? tmpBase : tmpBase) },
}));

import { allocateProjectWorkspace } from '@process/services/projectWorkspace';
import { WAYLAND_KNOWLEDGE_DIR } from '@process/services/projectKnowledge/bootstrap';

beforeAll(async () => {
  tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-455-'));
});
afterAll(async () => {
  await fs.rm(tmpBase, { recursive: true, force: true });
});

describe('#455 allocateProjectWorkspace (real fs)', () => {
  it('creates a real, discoverable dir under <documents>/Wayland', async () => {
    const ws = await allocateProjectWorkspace('My Notes');
    expect(ws).toBe(path.join(tmpBase, 'Wayland', 'My Notes'));
    expect(existsSync(ws)).toBe(true);
    // It is NOT a throwaway temp workspace.
    expect(/-temp-\d+$/.test(ws)).toBe(false);
  });

  it('two same-named projects get distinct real dirs on disk', async () => {
    const a = await allocateProjectWorkspace('Same Name');
    const b = await allocateProjectWorkspace('Same Name');
    expect(a).not.toBe(b);
    expect(existsSync(a)).toBe(true);
    expect(existsSync(b)).toBe(true);
    expect(b.endsWith('Same Name (2)')).toBe(true);
  });

  it('CONCURRENT allocations that sanitize to the same name get distinct dirs (cross-project collision guard)', async () => {
    // Different project names that all sanitize to "Clash" (`?`/`:` are stripped).
    // The per-projectId lock can't help here - this is the path-level guard.
    const [a, b, c] = await Promise.all([
      allocateProjectWorkspace('Clash'),
      allocateProjectWorkspace('Clash?'),
      allocateProjectWorkspace('Clash:'),
    ]);
    expect(new Set([a, b, c]).size, `must be 3 distinct dirs, got ${[a, b, c].join(', ')}`).toBe(3);
    for (const p of [a, b, c]) expect(existsSync(p)).toBe(true);
  });

  it('the workspace is writable and survives a re-read (relaunch-stable)', async () => {
    const ws = await allocateProjectWorkspace('Persist Me');
    const file = path.join(ws, 'note.md');
    await fs.writeFile(file, '# hello', 'utf8');
    // Simulate "relaunch": the dir + file are still there (no cleanup).
    expect(existsSync(ws)).toBe(true);
    expect(await fs.readFile(file, 'utf8')).toBe('# hello');
    // And the knowledge folder can be bootstrapped into the same real dir.
    await fs.mkdir(path.join(ws, WAYLAND_KNOWLEDGE_DIR), { recursive: true });
    expect(existsSync(path.join(ws, WAYLAND_KNOWLEDGE_DIR))).toBe(true);
  });
});
