/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { convertLatexDelimiters } from '@/renderer/utils/chat/latexDelimiters';

describe('convertLatexDelimiters', () => {
  describe('block math \\[...\\]', () => {
    it('should convert \\[...\\] to $$...$$', () => {
      expect(convertLatexDelimiters('\\[E = mc^2\\]')).toBe('$$E = mc^2$$');
    });

    it('should handle multiline block math', () => {
      const input = '\\[\n\\frac{a}{b} + c\n\\]';
      const expected = '$$\n\\frac{a}{b} + c\n$$';
      expect(convertLatexDelimiters(input)).toBe(expected);
    });

    it('should handle multiple block math expressions', () => {
      const input = '\\[x^2\\] and \\[y^2\\]';
      const expected = '$$x^2$$ and $$y^2$$';
      expect(convertLatexDelimiters(input)).toBe(expected);
    });
  });

  describe('inline math \\(...\\)', () => {
    it('should convert \\(...\\) to $...$', () => {
      expect(convertLatexDelimiters('The value \\(x + y\\) is positive')).toBe('The value $x + y$ is positive');
    });

    it('should handle multiple inline math expressions', () => {
      const input = 'Given \\(a\\) and \\(b\\)';
      const expected = 'Given $a$ and $b$';
      expect(convertLatexDelimiters(input)).toBe(expected);
    });
  });

  describe('mixed math types', () => {
    it('should handle both block and inline math', () => {
      const input = 'Inline \\(x\\) and block:\n\\[x^2 + y^2 = z^2\\]';
      const expected = 'Inline $x$ and block:\n$$x^2 + y^2 = z^2$$';
      expect(convertLatexDelimiters(input)).toBe(expected);
    });
  });

  describe('code block preservation', () => {
    it('should not convert inside fenced code blocks', () => {
      const input = '```\n\\[E = mc^2\\]\n```';
      expect(convertLatexDelimiters(input)).toBe(input);
    });

    it('should not convert inside tilde-fenced code blocks', () => {
      const input = '~~~\n\\[E = mc^2\\]\n~~~';
      expect(convertLatexDelimiters(input)).toBe(input);
    });

    it('should not convert inside inline code', () => {
      const input = 'Use `\\[x\\]` for display math';
      expect(convertLatexDelimiters(input)).toBe(input);
    });

    it('should convert outside code but preserve inside code', () => {
      const input = '\\[a + b\\]\n```\n\\[c + d\\]\n```\n\\[e + f\\]';
      const expected = '$$a + b$$\n```\n\\[c + d\\]\n```\n$$e + f$$';
      expect(convertLatexDelimiters(input)).toBe(expected);
    });
  });

  describe('existing dollar delimiters', () => {
    it('should not affect existing $...$ syntax', () => {
      const input = '$x + y$ and $$a + b$$';
      expect(convertLatexDelimiters(input)).toBe(input);
    });
  });

  describe('currency is not parsed as math', () => {
    it('should escape a single dollar amount so it stays literal text', () => {
      expect(convertLatexDelimiters('the $2k cohort')).toBe('the \\$2k cohort');
    });

    it('should escape multiple amounts so remark-math cannot pair them into a math span', () => {
      // Regression: "$2k cohort and the $25-50k tier" was rendered as italic KaTeX
      // with the spaces collapsed and the dollar signs eaten.
      expect(convertLatexDelimiters('the $2k cohort and the $25-50k tier')).toBe(
        'the \\$2k cohort and the \\$25-50k tier'
      );
    });

    it('should handle suffixes and plus signs ($10k, $50k+, $5-10k)', () => {
      expect(convertLatexDelimiters('$10k whales at $50k+ or $5-10k')).toBe('\\$10k whales at \\$50k+ or \\$5-10k');
    });

    it('should not double-escape already-escaped currency', () => {
      expect(convertLatexDelimiters('costs \\$5 today')).toBe('costs \\$5 today');
    });

    it('should leave $$ display math starting with a digit intact', () => {
      expect(convertLatexDelimiters('$$3x^2 + 1$$')).toBe('$$3x^2 + 1$$');
    });

    it('should still convert \\(...\\) inline math that starts with a digit', () => {
      expect(convertLatexDelimiters('\\(3x + 1\\)')).toBe('$3x + 1$');
    });

    it('should not escape currency inside code', () => {
      expect(convertLatexDelimiters('run `echo $5` now')).toBe('run `echo $5` now');
    });
  });

  describe('no math content', () => {
    it('should return plain text unchanged', () => {
      const input = 'Hello, this is just normal text.';
      expect(convertLatexDelimiters(input)).toBe(input);
    });

    it('should handle empty string', () => {
      expect(convertLatexDelimiters('')).toBe('');
    });
  });
});
