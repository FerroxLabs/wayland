/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { toSpeakableText } from '@/common/voice/speakableText';

describe('toSpeakableText', () => {
  it('drops fenced code blocks entirely', () => {
    const out = toSpeakableText('Here is code:\n```js\nconst x = 1;\n```\nDone.', {});
    expect(out).not.toContain('const x');
    expect(out).toContain('Here is code');
    expect(out).toContain('Done.');
  });

  it('strips inline markdown emphasis and inline code', () => {
    expect(toSpeakableText('This is **bold** and `code` and _italic_.', {})).toBe(
      'This is bold and code and italic.',
    );
  });

  it('replaces links with their visible text', () => {
    expect(toSpeakableText('See [the docs](https://example.com/x) now.', {})).toBe('See the docs now.');
  });

  it('drops bare URLs', () => {
    expect(toSpeakableText('Visit https://example.com/page for more.', {})).toBe('Visit for more.');
  });

  it('drops markdown table rows', () => {
    const out = toSpeakableText('Summary:\n| a | b |\n| - | - |\n| 1 | 2 |\nEnd.', {});
    expect(out).toContain('Summary');
    expect(out).toContain('End.');
    expect(out).not.toContain('|');
  });

  it('substitutes displayName with spokenName (word-boundary, case-insensitive)', () => {
    expect(toSpeakableText('Hi Siobhan, welcome.', { displayName: 'Siobhan', spokenName: 'shiv-AWN' })).toBe(
      'Hi shiv-AWN, welcome.',
    );
  });

  it('does not substitute when spokenName is empty', () => {
    expect(toSpeakableText('Hi Siobhan.', { displayName: 'Siobhan', spokenName: '' })).toBe('Hi Siobhan.');
  });

  it('caps very long text at the char limit on a word boundary', () => {
    const long = 'word '.repeat(2000).trim();
    const out = toSpeakableText(long, { maxChars: 100 });
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out.endsWith('word')).toBe(true);
  });

  it('returns empty string for code-only content', () => {
    expect(toSpeakableText('```\nonly code\n```', {})).toBe('');
  });
});
