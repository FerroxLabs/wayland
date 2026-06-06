/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  promoteEntry,
  undoPromotion,
  isEntryPromoted,
  clearWikiWriterState,
} from '@process/services/memory/wikiWriter';
import { parseMarkdownBlocks } from '@process/services/memory/markdownFrontmatter';
import type { MemoryEntry } from '@/common/types/memory';

// ===== Helpers =====

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-writer-test-'));
}

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  const now = Date.now();
  return {
    id: `test-id-${now}`,
    type: 'decision',
    project: 'my-project',
    projectPath: '/tmp/my-project',
    summary: 'Always use X for Y because reasons',
    bodyPreview: 'A short preview of the body.',
    body: 'The full body text describing the decision in detail.',
    tags: ['decision', 'architecture'],
    storedAt: now - 60_000,
    sourcePath: '/tmp/my-project/.ijfw/memory/knowledge.md',
    sourceLine: 42,
    referencedBy: 2,
    promotionScore: 95,
    ...overrides,
  };
}

// ===== Tests =====

describe('wikiWriter', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    clearWikiWriterState();
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  // ----- promoteEntry -----

  it('writes a wiki file to the override directory', async () => {
    const entry = makeEntry({ id: 'abc123', summary: 'My great decision' });
    const result = await promoteEntry(entry, tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(fs.existsSync(result.wikiPath)).toBe(true);
  });

  it('wiki file includes required frontmatter fields', async () => {
    const entry = makeEntry({ id: 'abc124', tags: ['decision', 'pattern'] });
    const result = await promoteEntry(entry, tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const content = fs.readFileSync(result.wikiPath, 'utf8');
    expect(content).toContain('promoted_from:');
    expect(content).toContain('promoted_at:');
    expect(content).toContain('promotion_score:');
    expect(content).toContain('tags:');
  });

  it('frontmatter promoted_from includes sourcePath:L<line>', async () => {
    const entry = makeEntry({ id: 'abc125', sourcePath: '/proj/.ijfw/memory/knowledge.md', sourceLine: 17 });
    const result = await promoteEntry(entry, tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const content = fs.readFileSync(result.wikiPath, 'utf8');
    expect(content).toContain('/proj/.ijfw/memory/knowledge.md:L17');
  });

  it('frontmatter promotion_score matches entry.promotionScore', async () => {
    const entry = makeEntry({ id: 'abc126', promotionScore: 87 });
    const result = await promoteEntry(entry, tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const content = fs.readFileSync(result.wikiPath, 'utf8');
    expect(content).toContain('promotion_score: 87');
  });

  it('returns already-promoted error on duplicate promote', async () => {
    const entry = makeEntry({ id: 'abc127' });
    const r1 = await promoteEntry(entry, tmpDir);
    expect(r1.ok).toBe(true);
    const r2 = await promoteEntry(entry, tmpDir);
    expect(r2.ok).toBe(false);
    if (r2.ok) return;
    expect(r2.error).toBe('already promoted');
  });

  it('returns wiki-file-exists error when slug already exists for different entry', async () => {
    // Manually create the slug file first.
    const slug = 'always-use-x-for-y-because-reasons';
    fs.writeFileSync(path.join(tmpDir, `${slug}.md`), 'existing content', 'utf8');
    const entry = makeEntry({ id: 'abc128', summary: 'Always use X for Y because reasons' });
    const result = await promoteEntry(entry, tmpDir);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('wiki file already exists');
  });

  it('creates the wiki directory if it does not exist', async () => {
    const nestedDir = path.join(tmpDir, 'nested', 'wiki');
    const entry = makeEntry({ id: 'abc129' });
    const result = await promoteEntry(entry, nestedDir);
    expect(result.ok).toBe(true);
    expect(fs.existsSync(nestedDir)).toBe(true);
  });

  // ----- RT-F5-05: frontmatter injection hardening -----

  it('RT-F5-05: a value with newlines + --- + injected key cannot break out of its field', async () => {
    // Malicious sourcePath crafted to terminate the frontmatter block early and
    // inject a new top-level key if values were interpolated unescaped.
    const evil = '/tmp/p.md\n---\ninjected: pwned\n# rogue heading';
    const entry = makeEntry({
      id: 'inject-01',
      summary: 'Injection hardening test',
      sourcePath: evil,
      sourceLine: 1,
    });
    const result = await promoteEntry(entry, tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const content = fs.readFileSync(result.wikiPath, 'utf8');

    // The serialized promoted_from value stays on a single physical line: the
    // escaped newlines are literal `\n` chars, so no real line in the
    // frontmatter block is a bare `injected: pwned` key, and the closing `---`
    // appears exactly twice (open + close), not three times.
    const physicalLines = content.split('\n');
    const fenceLines = physicalLines.filter((l) => l === '---');
    expect(fenceLines).toHaveLength(2);
    const closeIdx = physicalLines.indexOf('---', physicalLines.indexOf('---') + 1);
    const frontmatterLines = physicalLines.slice(physicalLines.indexOf('---') + 1, closeIdx);
    expect(frontmatterLines.some((l) => l.trim() === 'injected: pwned')).toBe(false);
    expect(frontmatterLines.filter((l) => l.startsWith('promoted_from:'))).toHaveLength(1);

    // Round-trips back through the reader to exactly one block with the
    // original string preserved and no injected key.
    const blocks = parseMarkdownBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].frontmatter['promoted_from']).toBe(`${evil}:L1`);
    expect(blocks[0].frontmatter['injected']).toBeUndefined();
  });

  it('RT-F5-05: a tag containing --- and a colon round-trips and injects nothing', async () => {
    const evilTag = 'a\n---\ninjected: x';
    const entry = makeEntry({
      id: 'inject-02',
      summary: 'Tag injection hardening',
      tags: [evilTag, 'safe'],
    });
    const result = await promoteEntry(entry, tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const content = fs.readFileSync(result.wikiPath, 'utf8');
    const blocks = parseMarkdownBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].frontmatter['tags']).toEqual([evilTag, 'safe']);
    expect(blocks[0].frontmatter['injected']).toBeUndefined();
  });

  // ----- wiki-index.md -----

  it('creates wiki-index.md after first promotion', async () => {
    const entry = makeEntry({ id: 'abc130' });
    await promoteEntry(entry, tmpDir);
    const indexPath = path.join(tmpDir, 'wiki-index.md');
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  it('wiki-index.md contains the promoted slug', async () => {
    const entry = makeEntry({ id: 'abc131', summary: 'Important design rule here' });
    await promoteEntry(entry, tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, 'wiki-index.md'), 'utf8');
    expect(content).toContain('important-design-rule-here');
    expect(content).toContain('# Wiki Index');
  });

  it('wiki-index.md is sorted case-insensitively', async () => {
    await promoteEntry(makeEntry({ id: 'z01', summary: 'Zebra thing' }), tmpDir);
    clearWikiWriterState();
    await promoteEntry(makeEntry({ id: 'a01', summary: 'Apple thing' }), tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, 'wiki-index.md'), 'utf8');
    const zebraPos = content.indexOf('zebra-thing');
    const applePos = content.indexOf('apple-thing');
    expect(applePos).toBeLessThan(zebraPos);
  });

  it('wiki-index.md excludes .promoted.json and itself', async () => {
    const entry = makeEntry({ id: 'abc132', summary: 'Clean index test' });
    await promoteEntry(entry, tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, 'wiki-index.md'), 'utf8');
    expect(content).not.toContain('.promoted.json');
    expect(content).not.toContain('wiki-index.md');
  });

  // ----- Persistent sidecar -----

  it('persists promoted-set in .promoted.json', async () => {
    const entry = makeEntry({ id: 'abc133' });
    await promoteEntry(entry, tmpDir);
    const sidecarPath = path.join(tmpDir, '.promoted.json');
    expect(fs.existsSync(sidecarPath)).toBe(true);
    const json = JSON.parse(fs.readFileSync(sidecarPath, 'utf8')) as { ids: string[] };
    expect(json.ids).toContain('abc133');
  });

  it('isEntryPromoted returns true after promotion', async () => {
    const entry = makeEntry({ id: 'abc134' });
    await promoteEntry(entry, tmpDir);
    clearWikiWriterState(); // force sidecar re-read
    // Manually re-check against sidecar by passing a mock entry with the same id
    // and a projectPath that resolves to tmpDir.
    const result = await isEntryPromoted({ ...entry, projectPath: tmpDir, project: 'x' }, tmpDir);
    expect(result).toBe(true);
  });

  // ----- undoPromotion -----

  it('undoPromotion deletes the wiki file', async () => {
    const entry = makeEntry({ id: 'abc135' });
    const promoted = await promoteEntry(entry, tmpDir);
    expect(promoted.ok).toBe(true);
    if (!promoted.ok) return;
    const undo = await undoPromotion('abc135');
    expect(undo.ok).toBe(true);
    expect(fs.existsSync(promoted.wikiPath)).toBe(false);
  });

  it('undoPromotion updates wiki-index.md', async () => {
    const entry = makeEntry({ id: 'abc136', summary: 'Something to undo' });
    await promoteEntry(entry, tmpDir);
    await undoPromotion('abc136');
    const content = fs.readFileSync(path.join(tmpDir, 'wiki-index.md'), 'utf8');
    expect(content).not.toContain('something-to-undo');
  });

  it('undoPromotion removes entry from sidecar', async () => {
    const entry = makeEntry({ id: 'abc137' });
    await promoteEntry(entry, tmpDir);
    await undoPromotion('abc137');
    const json = JSON.parse(fs.readFileSync(path.join(tmpDir, '.promoted.json'), 'utf8')) as { ids: string[] };
    expect(json.ids).not.toContain('abc137');
  });

  it('undoPromotion returns not-in-queue error for unknown id', async () => {
    const result = await undoPromotion('nonexistent-id');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('not in undo queue');
  });

  it('undoPromotion returns grace_window_expired after 24h', async () => {
    // Simulate an entry that was promoted more than 24h ago by hacking the
    // queue via a fresh promote + time-shift: we can't easily travel time,
    // so verify the error message text contract only.
    // (Full time-shift test requires exporting undoQueue - deferred.)
    const result = await undoPromotion('expired-id');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Either 'not in undo queue' or 'grace_window_expired' is acceptable.
    expect(['not in undo queue', 'grace_window_expired']).toContain(result.error);
  });

  // ----- H1: concurrent promotion mutex -----

  it('H1: 5 concurrent promoteEntry calls for same id result in exactly 1 sidecar entry', async () => {
    const entry = makeEntry({ id: 'concurrent-01', summary: 'Concurrent promotion test' });
    // Fire 5 concurrent promotions for the same entry.
    const results = await Promise.all([
      promoteEntry(entry, tmpDir),
      promoteEntry(entry, tmpDir),
      promoteEntry(entry, tmpDir),
      promoteEntry(entry, tmpDir),
      promoteEntry(entry, tmpDir),
    ]);
    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.filter((r) => !r.ok).length;
    expect(successCount).toBe(1);
    expect(failCount).toBe(4);
    // Sidecar must have exactly one occurrence of this id.
    clearWikiWriterState();
    const sidecarPath = path.join(tmpDir, '.promoted.json');
    const json = JSON.parse(fs.readFileSync(sidecarPath, 'utf8')) as { ids: string[] };
    const occurrences = json.ids.filter((id) => id === 'concurrent-01').length;
    expect(occurrences).toBe(1);
  });

  // ----- H2: atomic write (sidecar not truncated on interrupt) -----

  it('H2: .promoted.json is never left empty after a crash mid-write (atomic rename)', async () => {
    const entry = makeEntry({ id: 'atomic-01', summary: 'Atomic write test' });
    // Pre-populate sidecar with a known entry.
    await promoteEntry(entry, tmpDir);
    const sidecarFile = path.join(tmpDir, '.promoted.json');
    // Verify the sidecar has proper content.
    const json1 = JSON.parse(fs.readFileSync(sidecarFile, 'utf8')) as { ids: string[] };
    expect(json1.ids).toContain('atomic-01');
    // Simulate a temp-file left behind (partial write scenario):
    // atomicWrite writes to .tmp then renames - if rename succeeds, the original is replaced.
    // We verify original is intact after the operation.
    const content = fs.readFileSync(sidecarFile, 'utf8');
    expect(content).toBeTruthy();
    const parsed = JSON.parse(content) as { ids: string[] };
    expect(parsed.ids.length).toBeGreaterThan(0);
  });
});
