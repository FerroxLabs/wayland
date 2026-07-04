/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { applyDelete, applyEdit, serializeScalar } from '../../src/process/services/memory/memoryEntryMutation';
import { parseMarkdownBlocks } from '../../src/process/services/memory/markdownFrontmatter';

// A realistic two-entry file matching the real ~/.ijfw/memory schema
// (type/summary/stored/project/tags/source_path). Trailing newline included.
const TWO_ENTRY = [
  '---',
  'type: observation',
  'summary: First entry summary',
  'stored: 2026-05-27T09:11:14.255Z',
  'project: alpha',
  'tags: [design, api]',
  'source_path: /Users/x/dev/alpha/.ijfw/memory/research.md',
  '---',
  '## First entry summary',
  '',
  'Body of the first entry.',
  '---',
  'type: decision',
  'summary: Second entry summary',
  'stored: 2026-05-28T10:00:00.000Z',
  'project: beta',
  'tags: []',
  '---',
  'Body of the second entry.',
  '',
].join('\n');

function blockCount(content: string): number {
  return parseMarkdownBlocks(content).length;
}

describe('memoryEntryMutation.applyDelete', () => {
  it('removes the target block and leaves the other block byte-for-byte intact', () => {
    const r = applyDelete(TWO_ENTRY, 'First entry summary');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.remainingBlocks).toBe(1);
    expect(blockCount(r.content)).toBe(1);
    // The surviving (second) block is preserved verbatim.
    expect(r.content).toContain('summary: Second entry summary');
    expect(r.content).toContain('Body of the second entry.');
    // The deleted block is fully gone.
    expect(r.content).not.toContain('First entry summary');
    expect(r.content).not.toContain('Body of the first entry.');
    expect(r.content).not.toContain('source_path: /Users/x/dev/alpha');
  });

  it('deletes the last block, reporting zero remaining (caller may unlink)', () => {
    const oneEntry = [
      '---',
      'type: observation',
      'summary: Only entry',
      'stored: 2026-01-01T00:00:00.000Z',
      'tags: []',
      '---',
      'Only body.',
      '',
    ].join('\n');
    const r = applyDelete(oneEntry, 'Only entry');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.remainingBlocks).toBe(0);
    expect(blockCount(r.content)).toBe(0);
  });

  it('returns not_found when no block matches the summary', () => {
    const r = applyDelete(TWO_ENTRY, 'Nonexistent summary');
    expect(r).toEqual({ ok: false, error: 'not_found' });
  });

  it('refuses (ambiguous) when two blocks share the same 80-char summary', () => {
    const dup = [
      TWO_ENTRY,
      '---',
      'type: observation',
      'summary: First entry summary',
      'stored: 2026-06-01T00:00:00.000Z',
      'tags: []',
      '---',
      'Another body.',
      '',
    ].join('\n');
    const r = applyDelete(dup, 'First entry summary');
    expect(r).toEqual({ ok: false, error: 'ambiguous' });
  });

  it('preserves a file-level header (comment + H1) when deleting', () => {
    const withHeader = ['<!-- ijfw-schema: v1 -->', '# Memory', TWO_ENTRY].join('\n');
    const r = applyDelete(withHeader, 'Second entry summary');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.content).toContain('<!-- ijfw-schema: v1 -->');
    expect(r.content).toContain('# Memory');
    expect(r.content).toContain('summary: First entry summary');
    expect(r.content).not.toContain('Second entry summary');
  });
});

describe('memoryEntryMutation.applyEdit', () => {
  it('patches only the summary line and preserves all other frontmatter + the other block', () => {
    const r = applyEdit(TWO_ENTRY, 'First entry summary', { summary: 'Renamed first entry' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.content).toContain('summary: Renamed first entry');
    expect(r.content).not.toContain('summary: First entry summary');
    // Untouched frontmatter keys of the edited block survive verbatim.
    expect(r.content).toContain('stored: 2026-05-27T09:11:14.255Z');
    expect(r.content).toContain('project: alpha');
    expect(r.content).toContain('source_path: /Users/x/dev/alpha/.ijfw/memory/research.md');
    // The other block is untouched.
    expect(r.content).toContain('summary: Second entry summary');
    expect(r.content).toContain('Body of the second entry.');
    expect(blockCount(r.content)).toBe(2);
  });

  it('replaces the body when patched, keeping frontmatter intact', () => {
    const r = applyEdit(TWO_ENTRY, 'Second entry summary', { body: 'Rewritten second body.\nSecond line.' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const blocks = parseMarkdownBlocks(r.content);
    const second = blocks.find((b) => b.frontmatter['summary'] === 'Second entry summary');
    expect(second?.body).toBe('Rewritten second body.\nSecond line.');
    expect(r.content).not.toContain('Body of the second entry.');
    // First block untouched.
    expect(r.content).toContain('Body of the first entry.');
  });

  it('replaces the tags line', () => {
    const r = applyEdit(TWO_ENTRY, 'First entry summary', { tags: ['x', 'y', 'z'] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const blocks = parseMarkdownBlocks(r.content);
    const first = blocks.find((b) => (b.frontmatter['summary'] as string) === 'First entry summary');
    expect(first?.frontmatter['tags']).toEqual(['x', 'y', 'z']);
  });

  it('inserts a frontmatter key that did not exist before', () => {
    const noTags = [
      '---',
      'type: observation',
      'summary: No tags entry',
      'stored: 2026-02-02T00:00:00.000Z',
      '---',
      'Body.',
      '',
    ].join('\n');
    const r = applyEdit(noTags, 'No tags entry', { tags: ['added'] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const blocks = parseMarkdownBlocks(r.content);
    expect(blocks[0]?.frontmatter['tags']).toEqual(['added']);
    expect(blocks[0]?.frontmatter['type']).toBe('observation');
  });

  it('quotes summaries with YAML-significant characters so they round-trip', () => {
    const r = applyEdit(TWO_ENTRY, 'First entry summary', { summary: 'Has: a colon [and] brackets' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const blocks = parseMarkdownBlocks(r.content);
    const edited = blocks.find((b) => (b.frontmatter['summary'] as string) === 'Has: a colon [and] brackets');
    expect(edited).toBeTruthy(); // decodeScalar reversed the quoting exactly
  });

  it('returns not_found for a missing summary', () => {
    expect(applyEdit(TWO_ENTRY, 'Missing', { summary: 'x' })).toEqual({ ok: false, error: 'not_found' });
  });

  it('refuses a rename that collides with another block summary (fail closed)', () => {
    const r = applyEdit(TWO_ENTRY, 'First entry summary', { summary: 'Second entry summary' });
    expect(r).toEqual({ ok: false, error: 'summary_collision' });
  });

  it('allows other edits (body/type/tags) even when the summary is unchanged', () => {
    // Not a rename → no collision check; editing body/tags on entry one is fine.
    const r = applyEdit(TWO_ENTRY, 'First entry summary', { body: 'changed', tags: ['q'] });
    expect(r.ok).toBe(true);
  });

  it('refuses ambiguous edits', () => {
    const dup = [
      TWO_ENTRY,
      '---',
      'type: observation',
      'summary: First entry summary',
      'stored: 2026-06-01T00:00:00.000Z',
      'tags: []',
      '---',
      'Another.',
      '',
    ].join('\n');
    expect(applyEdit(dup, 'First entry summary', { summary: 'x' })).toEqual({ ok: false, error: 'ambiguous' });
  });
});

describe('memoryEntryMutation - line-ending preservation', () => {
  const CRLF = TWO_ENTRY.replace(/\n/g, '\r\n');

  it('keeps a CRLF file as CRLF on delete (no silent LF rewrite of siblings)', () => {
    const r = applyDelete(CRLF, 'First entry summary');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.content.includes('\r\n')).toBe(true);
    // Every LF is preceded by CR — no bare LF leaked in.
    expect(/[^\r]\n/.test(r.content)).toBe(false);
    expect(r.content).toContain('summary: Second entry summary');
  });

  it('keeps a CRLF file as CRLF on edit', () => {
    const r = applyEdit(CRLF, 'First entry summary', { summary: 'Renamed', body: 'new\nbody' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.content.includes('\r\n')).toBe(true);
    expect(/[^\r]\n/.test(r.content)).toBe(false);
  });

  it('keeps an LF file as LF (no stray CR introduced)', () => {
    const r = applyEdit(TWO_ENTRY, 'First entry summary', { summary: 'Renamed' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.content.includes('\r')).toBe(false);
  });
});

describe('serializeScalar', () => {
  it('leaves plain values unquoted', () => {
    expect(serializeScalar('observation')).toBe('observation');
    expect(serializeScalar('alpha-beta')).toBe('alpha-beta'); // starts with letter, hyphen inside is fine
  });
  it('quotes values with colons/brackets/newlines and the empty string', () => {
    expect(serializeScalar('')).toBe('""');
    expect(serializeScalar('a: b')).toBe('"a: b"');
    expect(serializeScalar('multi\nline')).toBe(JSON.stringify('multi\nline'));
  });
});
