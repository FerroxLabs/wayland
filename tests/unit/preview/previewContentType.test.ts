/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The mapping was MOVED out of the workspace tree so the deliverable card's run
 * history can preview an earlier run with the same viewer the tree would use.
 * Moved code is where drift hides, so every branch the original had is pinned
 * here by name, including the fall-through the original reached two ways.
 */

import { describe, expect, it } from 'vitest';

import {
  previewContentTypeForFileName,
  previewExtensionOf,
  previewIsEditable,
} from '@/renderer/pages/conversation/Preview/previewContentType';

describe('which internal viewer opens a file', () => {
  it.each([
    ['brief.md', 'markdown'],
    ['NOTES.MARKDOWN', 'markdown'],
    ['change.diff', 'diff'],
    ['fix.patch', 'diff'],
    ['report.pdf', 'pdf'],
    ['deck.pptx', 'ppt'],
    ['deck.odp', 'ppt'],
    ['letter.docx', 'word'],
    ['letter.odt', 'word'],
    ['books.xlsx', 'excel'],
    ['rows.csv', 'excel'],
    ['brief.html', 'html'],
    ['brief.htm', 'html'],
    ['chart.PNG', 'image'],
    ['icon.svg', 'image'],
    ['scan.tiff', 'image'],
  ])('opens %s in the %s viewer', (name, expected) => {
    expect(previewContentTypeForFileName(name)).toBe(expected);
  });

  it('reads anything it does not recognise as text rather than refusing it', () => {
    // A skill can invent an extension; the deliverable still has to open.
    expect(previewContentTypeForFileName('brief.zzunknown')).toBe('code');
    expect(previewContentTypeForFileName('Makefile')).toBe('code');
    expect(previewContentTypeForFileName('script.ts')).toBe('code');
  });

  it('treats a leading dot as the whole name, not an extension', () => {
    // `.gitignore` is a file called gitignore, not a `gitignore` file. Reading
    // the tail after the dot would make `.md` a markdown document.
    expect(previewExtensionOf('.gitignore')).toBe('');
    expect(previewExtensionOf('.md')).toBe('');
    expect(previewContentTypeForFileName('.md')).toBe('code');
  });

  it('takes the extension from the file name, not from a directory in the path', () => {
    expect(previewExtensionOf('/tmp/reports.md/brief')).toBe('');
    expect(previewContentTypeForFileName('/tmp/reports.md/brief')).toBe('code');
  });

  it('keeps the rendered viewers read-only', () => {
    // A markdown or image tab shows the RENDERED document, so an edit box over
    // it would be editing something the user is not looking at.
    expect(previewIsEditable('markdown')).toBe(false);
    expect(previewIsEditable('image')).toBe(false);
    expect(previewIsEditable('code')).toBe(true);
    expect(previewIsEditable('html')).toBe(true);
  });
});
