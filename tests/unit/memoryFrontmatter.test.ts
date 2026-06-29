/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #256 B1 - the shared title/description derivation used by BOTH memory ingest
 * paths (drop folder + drag-drop). These assert the Windows failure modes the
 * live verify hit: a leading UTF-8 BOM must not steal the title, and CRLF /
 * lone-CR line endings must not mash the heading into the description.
 */
import { describe, expect, it } from 'vitest';
import {
  cleanText,
  deriveSummary,
  deriveTitle,
  normalizeNewlines,
  stripBom,
  stripFrontmatter,
} from '@process/services/import/memoryFrontmatter';

const BOM = '﻿';

describe('memoryFrontmatter shared helpers (#256 B1)', () => {
  describe('stripBom / normalizeNewlines / cleanText', () => {
    it('removes only a single leading BOM', () => {
      expect(stripBom(`${BOM}# Title`)).toBe('# Title');
      expect(stripBom('# Title')).toBe('# Title');
      // A non-leading BOM is left untouched (we only strip the editor prefix).
      expect(stripBom(`# Ti${BOM}tle`)).toBe(`# Ti${BOM}tle`);
    });

    it('normalizes CRLF and lone-CR to LF', () => {
      expect(normalizeNewlines('a\r\nb\rc\nd')).toBe('a\nb\nc\nd');
    });

    it('cleanText strips BOM and normalizes newlines together (idempotent)', () => {
      const once = cleanText(`${BOM}a\r\nb`);
      expect(once).toBe('a\nb');
      expect(cleanText(once)).toBe('a\nb');
    });
  });

  describe('deriveTitle', () => {
    it('uses the markdown heading when present', () => {
      expect(deriveTitle('# Nebula Test Memory\n\nbody', 'note.md')).toBe('Nebula Test Memory');
    });

    it('falls back to the filename (sans extension) when there is no heading', () => {
      expect(deriveTitle('just a plain note, no heading', 'nebula-note.md')).toBe('nebula-note');
    });

    it('REGRESSION: a leading BOM does not steal the title to the filename fallback', () => {
      // This is the exact live-verify failure: BOM sat before `#`, the `^#`
      // heading match failed, and the title silently became "nebula-note".
      expect(deriveTitle(`${BOM}# Nebula Test Memory\n\nbody`, 'nebula-note.md')).toBe('Nebula Test Memory');
    });

    it('REGRESSION: CRLF and lone-CR endings still yield a clean heading title', () => {
      expect(deriveTitle(`${BOM}# Nebula Test Memory\r\n\r\nbody`, 'nebula-note.md')).toBe('Nebula Test Memory');
      expect(deriveTitle(`${BOM}# Nebula Test Memory\rbody`, 'nebula-note.md')).toBe('Nebula Test Memory');
    });
  });

  describe('deriveSummary', () => {
    it('prefers the first real body line over the heading (distinct from title)', () => {
      const summary = deriveSummary('# Heading\n\nThe codename is NEBULA-2287.', 'note.md');
      expect(summary).toBe('The codename is NEBULA-2287.');
    });

    it('REGRESSION: BOM + CRLF does not mash the heading into the description', () => {
      const summary = deriveSummary(`${BOM}# Heading\r\n\r\nThe codename is NEBULA-2287.\r\n`, 'note.md');
      expect(summary).toBe('The codename is NEBULA-2287.');
      expect(summary).not.toContain('Heading');
      expect(summary).not.toContain(BOM);
      expect(summary).not.toContain('\r');
    });

    it('REGRESSION: lone-CR (old-Mac) endings split lines instead of mashing them', () => {
      // With CR-only endings a naive split("\n") leaves "Heading\rBody" as one
      // line and mashes them; normalization fixes it.
      const summary = deriveSummary(`${BOM}# Heading\rThe codename is NEBULA-2287.`, 'note.md');
      expect(summary).toBe('The codename is NEBULA-2287.');
    });

    it('falls back to the heading text, then the filename, when there is no body', () => {
      expect(deriveSummary('# Only A Heading', 'note.md')).toBe('Only A Heading');
      expect(deriveSummary('', 'fallback-name.md')).toBe('fallback-name.md');
    });
  });

  describe('stripFrontmatter', () => {
    it('removes a leading YAML block (even behind a BOM) so derivation reads the body', () => {
      const raw = `${BOM}---\ntitle: x\n---\n# Real Heading\n\nbody`;
      expect(stripFrontmatter(raw)).toBe('# Real Heading\n\nbody');
      expect(deriveTitle(raw, 'note.md')).toBe('Real Heading');
    });
  });
});
