/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdownBlocks } from '@process/services/memory/markdownFrontmatter';

describe('parseMarkdownBlocks', () => {
  it('returns empty array for empty input', () => {
    expect(parseMarkdownBlocks('')).toEqual([]);
  });

  it('returns empty array for file-level headers only', () => {
    const content = `<!-- ijfw-schema: v1 -->\n# Knowledge Base\n`;
    expect(parseMarkdownBlocks(content)).toEqual([]);
  });

  it('parses a single entry', () => {
    const content = [
      '---',
      'type: decision',
      'summary: Use X for Y',
      'stored: 2026-05-15T06:36:52.422Z',
      'tags: [design, workflow]',
      '---',
      'Body text here.',
      '',
      '**Why:** Because reasons.',
    ].join('\n');

    const blocks = parseMarkdownBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].frontmatter['type']).toBe('decision');
    expect(blocks[0].frontmatter['summary']).toBe('Use X for Y');
    expect(blocks[0].frontmatter['stored']).toBe('2026-05-15T06:36:52.422Z');
    expect(blocks[0].frontmatter['tags']).toEqual(['design', 'workflow']);
    expect(blocks[0].body).toContain('Body text here.');
    expect(blocks[0].body).toContain('**Why:**');
  });

  it('parses multiple entries separated by ---', () => {
    const content = [
      '---',
      'type: decision',
      'summary: First entry',
      'stored: 2026-05-01T00:00:00.000Z',
      'tags: [a]',
      '---',
      'First body.',
      '---',
      'type: pattern',
      'summary: Second entry',
      'stored: 2026-05-02T00:00:00.000Z',
      'tags: [b, c]',
      '---',
      'Second body.',
    ].join('\n');

    const blocks = parseMarkdownBlocks(content);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].frontmatter['summary']).toBe('First entry');
    expect(blocks[0].frontmatter['tags']).toEqual(['a']);
    expect(blocks[0].body).toBe('First body.');
    expect(blocks[1].frontmatter['summary']).toBe('Second entry');
    expect(blocks[1].frontmatter['tags']).toEqual(['b', 'c']);
    expect(blocks[1].body).toBe('Second body.');
  });

  it('skips file header comment and H1', () => {
    const content = [
      '<!-- ijfw-schema: v1 -->',
      '# Knowledge Base',
      '---',
      'type: observation',
      'summary: A thing',
      'stored: 2026-05-10T10:00:00.000Z',
      'tags: []',
      '---',
      'Observation body.',
    ].join('\n');

    const blocks = parseMarkdownBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].frontmatter['type']).toBe('observation');
  });

  it('returns empty frontmatter when block has no key: value pairs', () => {
    const content = ['---', '---', 'Just body text.'].join('\n');

    const blocks = parseMarkdownBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].frontmatter).toEqual({});
    expect(blocks[0].body).toBe('Just body text.');
  });

  it('parses tags with spaces in the array', () => {
    const content = [
      '---',
      'type: pattern',
      'summary: Tag test',
      'stored: 2026-05-01T00:00:00.000Z',
      'tags: [ alpha, beta , gamma ]',
      '---',
      'body',
    ].join('\n');

    const blocks = parseMarkdownBlocks(content);
    expect(blocks[0].frontmatter['tags']).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('parses a single-value tags field (no brackets)', () => {
    const content = [
      '---',
      'type: decision',
      'summary: Single tag',
      'stored: 2026-05-01T00:00:00.000Z',
      'tags: design',
      '---',
      'body',
    ].join('\n');

    const blocks = parseMarkdownBlocks(content);
    expect(blocks[0].frontmatter['tags']).toEqual(['design']);
  });

  it('handles CRLF line endings', () => {
    const content =
      '---\r\ntype: decision\r\nsummary: CRLF test\r\nstored: 2026-05-01T00:00:00.000Z\r\ntags: []\r\n---\r\nbody text\r\n';
    const blocks = parseMarkdownBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].frontmatter['type']).toBe('decision');
  });

  it('decodes a JSON-quoted scalar back to its original (with embedded newline/---)', () => {
    const original = 'line1\n---\ninjected: pwned';
    const encoded = JSON.stringify(original); // single-line "line1\n---\ninjected: pwned"
    const content = ['---', 'type: decision', `summary: ${encoded}`, 'tags: []', '---', 'body'].join('\n');

    const blocks = parseMarkdownBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].frontmatter['summary']).toBe(original);
    expect(blocks[0].frontmatter['injected']).toBeUndefined();
  });

  it('decodes JSON-quoted tag elements and ignores commas inside them', () => {
    const tagA = JSON.stringify('alpha, with comma');
    const content = ['---', 'type: pattern', `tags: [${tagA}, beta]`, '---', 'body'].join('\n');

    const blocks = parseMarkdownBlocks(content);
    expect(blocks[0].frontmatter['tags']).toEqual(['alpha, with comma', 'beta']);
  });
});
