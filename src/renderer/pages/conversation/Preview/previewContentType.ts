/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WHICH INTERNAL VIEWER OPENS A FILE.
 *
 * Preview is the internal viewer; Open hands the file to the external tool. So
 * this decides what Preview does, and it now has two callers - the workspace
 * tree, and the deliverable card's run history, which previews an earlier run
 * in place rather than launching it. A second copy of this mapping is how the
 * two surfaces start disagreeing about what a `.md` is.
 *
 * The extension list is the workspace tree's, moved rather than rewritten, with
 * one dead branch dropped: it enumerated forty "code" extensions and then fell
 * through to `code` for everything else anyway, so the list decided nothing.
 * Anything unrecognised is read as text, which is the honest default for a
 * deliverable a skill invented an extension for.
 */

import type { PreviewContentType } from '@/common/types/preview';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tif', 'tiff', 'avif']);

const BY_EXTENSION = new Map<string, PreviewContentType>([
  ['md', 'markdown'],
  ['markdown', 'markdown'],
  ['diff', 'diff'],
  ['patch', 'diff'],
  ['pdf', 'pdf'],
  ['ppt', 'ppt'],
  ['pptx', 'ppt'],
  ['odp', 'ppt'],
  ['doc', 'word'],
  ['docx', 'word'],
  ['odt', 'word'],
  ['xls', 'excel'],
  ['xlsx', 'excel'],
  ['ods', 'excel'],
  ['csv', 'excel'],
  ['html', 'html'],
  ['htm', 'html'],
]);

/** The extension the viewer keys on. Lower-cased, no dot; '' when there is none. */
export function previewExtensionOf(fileName: string): string {
  const base = fileName.toLowerCase().split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  // A leading dot is the whole name (`.gitignore`), not an extension.
  return dot > 0 ? base.slice(dot + 1) : '';
}

/** Which internal viewer renders this file. */
export function previewContentTypeForFileName(fileName: string): PreviewContentType {
  const ext = previewExtensionOf(fileName);
  return BY_EXTENSION.get(ext) ?? (IMAGE_EXTENSIONS.has(ext) ? 'image' : 'code');
}

/**
 * Whether the internal viewer offers editing.
 *
 * Rendered types are read-only: a markdown or image tab is showing the RENDERED
 * document, so an edit box over it would be editing something the user is not
 * looking at.
 */
export function previewIsEditable(contentType: PreviewContentType): boolean {
  return contentType !== 'markdown' && contentType !== 'image';
}
