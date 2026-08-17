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
  listArchivedProjectReferences,
  listProjectReference,
  loadProjectKnowledgeBlock,
  readProjectKnowledge,
  removeProjectReference,
  restoreProjectReference,
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

  it('adds, lists, archives, and restores reference files (collision-safe)', async () => {
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

    const archived = await listArchivedProjectReferences(ws);
    expect(archived).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        name: 'a.txt',
        size: 5,
        archivedAt: expect.any(Number),
      }),
    ]);

    // Restore returns the archived original without disturbing the surviving
    // collision-safe copy.
    const afterRestore = await restoreProjectReference(ws, archived[0].id);
    expect(afterRestore.map((f) => f.name).toSorted()).toEqual(['a-1.txt', 'a.txt']);
    expect(await listArchivedProjectReferences(ws)).toEqual([]);
  });

  it('guards reference removal against path traversal (cannot escape the dir)', async () => {
    // A sentinel one level above reference/ must survive a traversal attempt -
    // basename() collapses '../sentinel.txt' to 'sentinel.txt', which only ever
    // resolves inside .wayland/reference/, so the real sentinel is untouched.
    const sentinel = path.join(ws, 'sentinel.txt');
    await fs.writeFile(sentinel, 'do-not-delete');
    await expect(removeProjectReference(ws, '../sentinel.txt')).rejects.toThrow();
    await expect(fs.access(sentinel)).resolves.toBeUndefined();
  });

  it('rejects archived-reference traversal and keeps the archived bytes recoverable', async () => {
    await saveProjectReferenceUploads(ws, [{ name: 'source.txt', data: Buffer.from('recover me') }]);
    await removeProjectReference(ws, 'source.txt');

    await expect(restoreProjectReference(ws, '../outside')).rejects.toThrow('Invalid archived reference identifier');
    expect((await listArchivedProjectReferences(ws)).map((entry) => entry.name)).toEqual(['source.txt']);
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

/**
 * The composed block is copied into BOTH `presetRules` and `presetContext` and
 * re-read at EVERY agent spawn, so its size is what bounds main-thread block
 * time, the per-spawn SQLite row rewrite, and the `getConversations` IPC reply
 * (the bridge silently drops a reply over 50MB and hangs the renderer). The
 * documents themselves are uncapped files, so the cap has to live at the
 * collection site.
 */
describe('project knowledge injection is size-capped at the collection site', () => {
  const TRUNCATED = '…(truncated)';
  const OMITTED = '…(omitted - exceeds the injection budget)';

  it('passes a normal document through untouched', async () => {
    const body = 'ACME ships daily.\n\n'.repeat(200); // ~3.8k chars, well inside the caps
    await writeProjectKnowledge(ws, 'context', body);
    const block = await loadProjectKnowledgeBlock(ws);
    expect(block).toContain(body.trim());
    expect(block).not.toContain(TRUNCATED);
  });

  it('bounds a single oversized document and says so in the prompt', async () => {
    await writeProjectKnowledge(ws, 'context', 'A'.repeat(500_000));
    const block = await loadProjectKnowledgeBlock(ws);
    // Bounded, not merely "smaller than the input".
    expect(block.length).toBeLessThan(40_000);
    // The agent is told it received a partial document rather than being quietly
    // handed a head and left to assume it is the whole thing.
    expect(block).toContain(TRUNCATED);
    // Still a well-formed, refreshable block.
    expect(block.startsWith('[Project Knowledge - shared context for every chat in this project]')).toBe(true);
    expect(block.endsWith('[/Project Knowledge]')).toBe(true);
  });

  it('bounds the whole block when every document is oversized', async () => {
    await writeProjectKnowledge(ws, 'context', 'A'.repeat(500_000));
    await writeProjectKnowledge(ws, 'rules', 'B'.repeat(500_000));
    await writeProjectKnowledge(ws, 'decisions', 'C'.repeat(500_000));
    const block = await loadProjectKnowledgeBlock(ws);
    expect(block.length).toBeLessThan(70_000);
    expect(block).toContain(TRUNCATED);
    expect(block.endsWith('[/Project Knowledge]')).toBe(true);
  });

  it('truncates deterministically, so a refresh stays idempotent', async () => {
    await writeProjectKnowledge(ws, 'context', 'A'.repeat(500_000));
    expect(await loadProjectKnowledgeBlock(ws)).toBe(await loadProjectKnowledgeBlock(ws));
  });

  /**
   * The dropped-document path, which the per-document caps above do NOT cover.
   * `Object.keys(KNOWLEDGE_FILE)` is a fixed order (context, rules, decisions),
   * so a document squeezed out by the whole-block budget is ALWAYS decisions.md
   * - and it used to go out before its heading was pushed, leaving nothing in
   * the prompt at all. The only signal was a `console.warn` the model cannot
   * see, which is strictly worse than a document marked partial. 32,000 chars
   * each is the measured threshold: at 31,900 each, decisions still made it in.
   */
  it('reserves a floor per document, so the last one is never dropped in silence', async () => {
    await writeProjectKnowledge(ws, 'context', 'A'.repeat(32_000));
    await writeProjectKnowledge(ws, 'rules', 'B'.repeat(32_000));
    await writeProjectKnowledge(ws, 'decisions', 'C'.repeat(32_000));
    const block = await loadProjectKnowledgeBlock(ws);
    // Present as a heading AND carrying real content, not a heading over nothing.
    expect(block).toContain('## Project decisions');
    expect(block).toContain('CCC');
    expect(block.split('## Project decisions')[1].length).toBeGreaterThan(3_000);
    // Every document that was cut says so, and the block is still bounded.
    expect(block).toContain(TRUNCATED);
    expect(block.length).toBeLessThan(70_000);
  });

  it('announces no truncation and no omission when nothing was cut', async () => {
    await writeProjectKnowledge(ws, 'context', 'ACME ships daily.');
    await writeProjectKnowledge(ws, 'rules', 'Two-space indent.');
    await writeProjectKnowledge(ws, 'decisions', 'Staging moved to OIDC; the old key is dead.');
    const block = await loadProjectKnowledgeBlock(ws);
    expect(block).toContain('Staging moved to OIDC; the old key is dead.');
    expect(block).not.toContain(TRUNCATED);
    expect(block).not.toContain(OMITTED);
  });

  it('gives a document the user never edited no heading and no omission marker', async () => {
    await writeProjectKnowledge(ws, 'context', 'A'.repeat(500_000));
    const block = await loadProjectKnowledgeBlock(ws);
    expect(block).toContain(TRUNCATED);
    expect(block).not.toContain('## Project rules');
    expect(block).not.toContain('## Project decisions');
    expect(block).not.toContain(OMITTED);
  });
});
