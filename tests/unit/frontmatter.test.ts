/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  joinFrontmatter,
  splitFrontmatter,
} from '@/renderer/pages/conversation/Preview/components/editors/frontmatter';

describe('splitFrontmatter', () => {
  it('returns body untouched when no frontmatter present', () => {
    const md = '# Heading\n\nBody text.';
    const result = splitFrontmatter(md);
    expect(result.raw).toBeNull();
    expect(result.body).toBe(md);
  });

  it('extracts a YAML frontmatter block (Jekyll/Hugo/Obsidian style)', () => {
    const md = '---\ntitle: My Post\ndate: 2026-05-16\n---\n# Heading\n\nBody.';
    const result = splitFrontmatter(md);
    expect(result.raw).toBe('---\ntitle: My Post\ndate: 2026-05-16\n---\n');
    expect(result.body).toBe('# Heading\n\nBody.');
  });

  it('extracts a TOML frontmatter block (Hugo +++)', () => {
    const md = '+++\ntitle = "x"\n+++\nBody.';
    const result = splitFrontmatter(md);
    expect(result.raw).toBe('+++\ntitle = "x"\n+++\n');
    expect(result.body).toBe('Body.');
  });

  it('does not mix delimiters (--- opening, +++ closing)', () => {
    const md = '---\ntitle: x\n+++\nBody.';
    const result = splitFrontmatter(md);
    expect(result.raw).toBeNull();
    expect(result.body).toBe(md);
  });

  // Matches gray-matter (the parser Jekyll/Hugo use): truly empty
  // `---\n---\n` is not recognized as frontmatter. Real-world "empty"
  // blocks always have at least one content line - see test below.
  it('handles frontmatter with a single blank content line', () => {
    const md = '---\n\n---\nBody.';
    const result = splitFrontmatter(md);
    expect(result.raw).toBe('---\n\n---\n');
    expect(result.body).toBe('Body.');
  });

  it('tolerates CRLF line endings', () => {
    const md = '---\r\ntitle: x\r\n---\r\n# Body';
    const result = splitFrontmatter(md);
    expect(result.raw).toBe('---\r\ntitle: x\r\n---\r\n');
    expect(result.body).toBe('# Body');
  });

  it('strips a leading UTF-8 BOM', () => {
    const md = '﻿---\ntitle: x\n---\nBody.';
    const result = splitFrontmatter(md);
    expect(result.raw).toBe('﻿---\ntitle: x\n---\n');
    expect(result.body).toBe('Body.');
  });

  it('matches frontmatter at end of file with no trailing newline', () => {
    const md = '---\ntitle: x\n---';
    const result = splitFrontmatter(md);
    expect(result.raw).toBe('---\ntitle: x\n---');
    expect(result.body).toBe('');
  });

  it('does not match --- that appears after leading text (thematic break)', () => {
    const md = '# Heading\n\n---\nNot frontmatter.';
    const result = splitFrontmatter(md);
    expect(result.raw).toBeNull();
    expect(result.body).toBe(md);
  });

  it('handles empty input', () => {
    const result = splitFrontmatter('');
    expect(result.raw).toBeNull();
    expect(result.body).toBe('');
  });
});

describe('joinFrontmatter', () => {
  it('returns body verbatim when raw is null', () => {
    expect(joinFrontmatter(null, '# Body')).toBe('# Body');
  });

  it('returns body verbatim when raw is empty string', () => {
    expect(joinFrontmatter('', '# Body')).toBe('# Body');
  });

  it('concatenates raw block with body', () => {
    const raw = '---\ntitle: x\n---\n';
    const body = '# Body';
    expect(joinFrontmatter(raw, body)).toBe(raw + body);
  });

  it('round-trips: split then join reconstructs the original source', () => {
    const samples = [
      '---\ntitle: x\n---\n# Body\n\nText.',
      '+++\nkey = "v"\n+++\n# Body',
      '# No frontmatter\n\nBody.',
      '﻿---\nbom: true\n---\nBody.',
      '---\r\ntitle: crlf\r\n---\r\nBody.',
    ];
    for (const md of samples) {
      const { raw, body } = splitFrontmatter(md);
      expect(joinFrontmatter(raw, body)).toBe(md);
    }
  });
});
