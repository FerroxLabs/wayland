/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { bootstrapProjectKnowledge } from '@process/services/projectKnowledge/bootstrap';
import {
  addProjectReference,
  listProjectReference,
  loadProjectKnowledgeBlock,
  readProjectKnowledge,
  removeProjectReference,
  saveProjectReferenceUploads,
  writeProjectKnowledge,
} from '@process/services/projectKnowledge/knowledge';

let ws: string;

beforeEach(async () => {
  ws = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-knowledge-'));
});
afterEach(async () => {
  await fs.rm(ws, { recursive: true, force: true });
});

describe('project knowledge', () => {
  it('round-trips a knowledge document', async () => {
    await writeProjectKnowledge(ws, 'context', 'ACME ships daily.');
    const k = await readProjectKnowledge(ws);
    expect(k.context).toBe('ACME ships daily.');
    expect(k.rules).toBe('');
    expect(k.decisions).toBe('');
  });

  it('injects NOTHING for a freshly bootstrapped, unedited project (no description)', async () => {
    // bootstrap seeds heading + instructional blockquotes only - no real content.
    await bootstrapProjectKnowledge(ws, 'My Project');
    const block = await loadProjectKnowledgeBlock(ws);
    expect(block).toBe('');
  });

  it('injects a project description (real content) but not the seeded boilerplate', async () => {
    await bootstrapProjectKnowledge(ws, 'My Project', 'The ACME launch funnel.');
    const block = await loadProjectKnowledgeBlock(ws);
    expect(block).toContain('The ACME launch funnel.');
    expect(block).not.toContain('Edit this file'); // instructional blockquote stripped
  });

  it('injects only the substantive content the user added', async () => {
    await bootstrapProjectKnowledge(ws, 'My Project');
    await writeProjectKnowledge(ws, 'context', '# My Project\n\n> seeded note\n\nUse tabs, never spaces.');
    await writeProjectKnowledge(ws, 'rules', '> optional\n\nAlways write a failing test first.');
    const block = await loadProjectKnowledgeBlock(ws);
    expect(block).toContain('[Project Knowledge');
    expect(block).toContain('Use tabs, never spaces.');
    expect(block).toContain('Always write a failing test first.');
    // boilerplate stripped
    expect(block).not.toContain('seeded note');
    expect(block).not.toContain('# My Project');
    expect(block).not.toContain('> optional');
    // empty doc produces no section
    expect(block).not.toContain('Project decisions');
  });

  it('returns empty block when the project has no workspace', async () => {
    expect(await loadProjectKnowledgeBlock('')).toBe('');
    expect(await readProjectKnowledge('')).toEqual({ context: '', rules: '', decisions: '' });
  });

  it('adds, lists and removes reference files (collision-safe)', async () => {
    const a = path.join(ws, 'a.txt');
    await fs.writeFile(a, 'alpha');
    const after1 = await addProjectReference(ws, [a]);
    expect(after1.map((f) => f.name)).toEqual(['a.txt']);

    // dropping the same basename again must not overwrite - it de-dupes the name.
    const after2 = await addProjectReference(ws, [a]);
    expect(after2).toHaveLength(2);
    expect(after2.some((f) => /^a-1\.txt$/.test(f.name))).toBe(true);

    const listed = await listProjectReference(ws);
    expect(listed).toHaveLength(2);

    const afterRemove = await removeProjectReference(ws, 'a.txt');
    expect(afterRemove.map((f) => f.name)).toEqual(['a-1.txt']);
  });

  it('guards reference removal against path traversal (cannot escape the dir)', async () => {
    // A sentinel one level above reference/ must survive a traversal attempt -
    // basename() collapses '../sentinel.txt' to 'sentinel.txt', which only ever
    // resolves inside .wayland/reference/, so the real sentinel is untouched.
    const sentinel = path.join(ws, 'sentinel.txt');
    await fs.writeFile(sentinel, 'do-not-delete');
    await removeProjectReference(ws, '../sentinel.txt');
    await expect(fs.access(sentinel)).resolves.toBeUndefined();
  });

  // #55 - browser/WebUI upload path: bytes arrive over HTTP, not a host path.
  it('writes uploaded reference bytes and lists them (collision-safe)', async () => {
    const after1 = await saveProjectReferenceUploads(ws, [{ name: 'spec.md', data: Buffer.from('hello') }]);
    expect(after1.map((f) => f.name)).toEqual(['spec.md']);

    // same basename again de-dupes rather than overwriting.
    const after2 = await saveProjectReferenceUploads(ws, [{ name: 'spec.md', data: Buffer.from('world') }]);
    expect(after2).toHaveLength(2);
    expect(after2.some((f) => /^spec-1\.md$/.test(f.name))).toBe(true);
  });

  it('contains an uploaded filename to the reference dir (no traversal)', async () => {
    // A traversal name must land as a basename inside reference/, never escape it.
    const sentinel = path.join(ws, 'sentinel.txt');
    await fs.writeFile(sentinel, 'do-not-touch');
    await saveProjectReferenceUploads(ws, [{ name: '../../sentinel.txt', data: Buffer.from('evil') }]);
    // original sentinel above the dir is untouched...
    expect(await fs.readFile(sentinel, 'utf8')).toBe('do-not-touch');
    // ...and the upload landed as a basename inside reference/.
    const listed = await listProjectReference(ws);
    expect(listed.map((f) => f.name)).toContain('sentinel.txt');
  });

  it('skips an oversized upload (over 25 MB) but keeps the rest', async () => {
    const big = Buffer.alloc(26 * 1024 * 1024); // 26 MB > 25 MB cap
    const result = await saveProjectReferenceUploads(ws, [
      { name: 'huge.bin', data: big },
      { name: 'ok.txt', data: Buffer.from('fine') },
    ]);
    expect(result.map((f) => f.name)).toEqual(['ok.txt']);
  });
});
