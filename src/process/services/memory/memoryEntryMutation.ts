/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure edit/delete transforms for a single IJFW memory entry inside a shared
 * `.ijfw/memory/*.md` file (#414). No filesystem access — the caller
 * (IjfwArchiveService) reads the file, applies one of these transforms, and
 * writes the result atomically.
 *
 * Design goals:
 * - Byte-preserving for every block that is NOT the target. A file typically
 *   holds many entries (journal.md); editing or deleting one must never
 *   reformat or reorder the others.
 * - Edit is SURGICAL: only the patched frontmatter lines (summary/type/tags)
 *   and the body of the target block are rewritten; all other frontmatter keys
 *   (project, source, source_path, stored, …) are left verbatim.
 * - The target is located by summary (first 80 chars), matching how
 *   IjfwArchiveService derives entry ids and how getEntry already locates a
 *   block. An ambiguous match (two entries with the same 80-char summary in one
 *   file) refuses to mutate rather than guess.
 */

import { parseMarkdownBlocks } from './markdownFrontmatter';

export type MemoryBlockPatch = {
  summary?: string;
  type?: string;
  tags?: string[];
  body?: string;
};

export type MutationError = 'not_found' | 'ambiguous' | 'summary_collision';

export type MutationResult =
  | { ok: true; content: string; remainingBlocks: number }
  | { ok: false; error: MutationError };

/**
 * Serialize a frontmatter scalar so it round-trips through the reader's
 * `decodeScalar`. Mirrors `serializeFrontmatterValue` in wikiWriter.ts: values
 * with YAML-significant characters become JSON-style double-quoted single-line
 * scalars; plain values pass through unquoted.
 */
export function serializeScalar(value: string): string {
  if (value.length === 0) return '""';
  const needsQuoting =
    /[\n\r\t"#:[\]{}&*!|>%@`,]/.test(value) ||
    value !== value.trim() ||
    value.startsWith('-') ||
    value.startsWith('?') ||
    /^(?:true|false|yes|no|on|off|null|~)$/i.test(value) ||
    /^[+-]?(?:\d|\.\d|0x|0o)/.test(value);
  if (!needsQuoting) return value;
  return JSON.stringify(value);
}

function serializeTags(tags: string[]): string {
  return tags.length > 0 ? `[${tags.map((t) => serializeScalar(t)).join(', ')}]` : '[]';
}

/** Derive the summary the index would compute for a raw block slice. */
function summaryOfBlock(rawBlockText: string): string {
  const parsed = parseMarkdownBlocks(rawBlockText);
  const block = parsed[0];
  if (!block) return '';
  const fm = block.frontmatter;
  if (typeof fm['summary'] === 'string' && fm['summary']) return fm['summary'];
  return block.body.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled';
}

type FileShape = {
  lines: string[];
  /** Opening `---` line index of each entry block, in order. */
  starts: number[];
  /** Whether the original file ended with a trailing newline. */
  trailingNewline: boolean;
  /** Whether the original file used CRLF line endings (preserved on rewrite). */
  crlf: boolean;
};

/**
 * Split a memory file into its lines and the opening-`---` line index of every
 * entry block, replaying the same fence state machine parseMarkdownBlocks uses
 * so block boundaries line up exactly.
 */
function shapeFile(content: string): FileShape {
  // Preserve the file's original line-ending style: normalize to LF for the
  // line-oriented transforms, then re-emit with the original separator so a
  // CRLF file (Windows / git autocrlf) is not silently rewritten to LF.
  const crlf = content.includes('\r\n');
  const text = content.replace(/\r\n/g, '\n');
  const trailingNewline = text.endsWith('\n');
  const lines = text.split('\n');

  // Skip leading file-header lines (comments / H1) exactly like the parser.
  let startIdx = 0;
  while (startIdx < lines.length) {
    const l = lines[startIdx].trim();
    if (l.startsWith('<!--') || l.startsWith('#')) startIdx++;
    else break;
  }

  const starts: number[] = [];
  type State = 'between' | 'in_fm' | 'in_body';
  let state: State = 'between';
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].trim() !== '---') continue;
    if (state === 'between') {
      starts.push(i);
      state = 'in_fm';
    } else if (state === 'in_fm') {
      state = 'in_body';
    } else {
      // `---` in body = separator: next entry begins here.
      starts.push(i);
      state = 'in_fm';
    }
  }
  return { lines, starts, trailingNewline, crlf };
}

/** End line (exclusive) of block i. */
function blockEnd(shape: FileShape, i: number): number {
  return i + 1 < shape.starts.length ? shape.starts[i + 1] : shape.lines.length;
}

/** Raw text of block i (used only to derive its summary). */
function rawBlock(shape: FileShape, i: number): string {
  return shape.lines.slice(shape.starts[i], blockEnd(shape, i)).join('\n');
}

/**
 * Locate the single block whose summary matches `summary` (first 80 chars).
 * Returns the block index, -1 for none, -2 for ambiguous (>1 match).
 */
function locate(shape: FileShape, summary: string): number {
  const key = summary.slice(0, 80);
  let found = -1;
  for (let i = 0; i < shape.starts.length; i++) {
    if (summaryOfBlock(rawBlock(shape, i)).slice(0, 80) === key) {
      if (found !== -1) return -2; // ambiguous
      found = i;
    }
  }
  return found;
}

function joinFile(lines: string[], trailingNewline: boolean, crlf: boolean): string {
  const nl = crlf ? '\r\n' : '\n';
  let out = lines.join(nl);
  // Preserve the original trailing-newline state; `lines` from split of a
  // trailing-newline file ends in '' so join already yields the newline. Guard
  // the no-trailing-newline case where we must not add one.
  if (!trailingNewline) out = out.replace(/(\r?\n)+$/, '');
  return out;
}

/**
 * Delete the entry identified by `summary`. Returns the new file content and
 * how many entry blocks remain (0 means the caller may unlink the file).
 */
export function applyDelete(content: string, summary: string): MutationResult {
  const shape = shapeFile(content);
  const idx = locate(shape, summary);
  if (idx === -1) return { ok: false, error: 'not_found' };
  if (idx === -2) return { ok: false, error: 'ambiguous' };

  const start = shape.starts[idx];
  const end = blockEnd(shape, idx);
  const kept = [...shape.lines.slice(0, start), ...shape.lines.slice(end)];
  return {
    ok: true,
    content: joinFile(kept, shape.trailingNewline, shape.crlf),
    remainingBlocks: shape.starts.length - 1,
  };
}

/**
 * Surgically edit the entry identified by `summary`. Only the patched
 * frontmatter keys (summary/type/tags) and body are rewritten; every other
 * frontmatter key and every other block is preserved verbatim.
 *
 * NOTE: changing the summary changes the entry's derived id — the caller must
 * re-resolve the entry afterwards. `matchSummary` is the CURRENT summary used to
 * locate the block; `patch.summary` (if set) is the new value written.
 */
export function applyEdit(content: string, matchSummary: string, patch: MemoryBlockPatch): MutationResult {
  const shape = shapeFile(content);
  const idx = locate(shape, matchSummary);
  if (idx === -1) return { ok: false, error: 'not_found' };
  if (idx === -2) return { ok: false, error: 'ambiguous' };

  // Refuse a rename that would collide with ANOTHER block's summary (first 80
  // chars) in the same file. The id, getEntry's body read, and every future
  // edit/delete all locate blocks by summary, so a duplicate summary would make
  // this and the sibling entry mutually ambiguous. Fail closed instead.
  if (patch.summary !== undefined) {
    const newKey = patch.summary.slice(0, 80);
    for (let i = 0; i < shape.starts.length; i++) {
      if (i === idx) continue;
      if (summaryOfBlock(rawBlock(shape, i)).slice(0, 80) === newKey) {
        return { ok: false, error: 'summary_collision' };
      }
    }
  }

  const start = shape.starts[idx];
  const end = blockEnd(shape, idx);

  // Frontmatter region: start+1 .. fmEnd (the closing `---`).
  let fmEnd = -1;
  for (let i = start + 1; i < end; i++) {
    if (shape.lines[i].trim() === '---') {
      fmEnd = i;
      break;
    }
  }
  if (fmEnd === -1) return { ok: false, error: 'not_found' }; // malformed block, refuse

  const fmLines = shape.lines.slice(start + 1, fmEnd);

  const upsert = (key: string, serialized: string): void => {
    const at = fmLines.findIndex((l) => l.slice(0, l.indexOf(':') === -1 ? 0 : l.indexOf(':')).trim() === key);
    const line = `${key}: ${serialized}`;
    if (at === -1) fmLines.push(line);
    else fmLines[at] = line;
  };

  if (patch.summary !== undefined) upsert('summary', serializeScalar(patch.summary));
  if (patch.type !== undefined) upsert('type', serializeScalar(patch.type));
  if (patch.tags !== undefined) upsert('tags', serializeTags(patch.tags));

  // Body region: fmEnd+1 .. end. Replace when a new body is supplied.
  const bodyLines =
    patch.body !== undefined ? patch.body.replace(/\r\n/g, '\n').split('\n') : shape.lines.slice(fmEnd + 1, end);

  const rebuilt = [
    ...shape.lines.slice(0, start),
    shape.lines[start], // opening ---
    ...fmLines,
    shape.lines[fmEnd], // closing ---
    ...bodyLines,
    ...shape.lines.slice(end),
  ];
  return {
    ok: true,
    content: joinFile(rebuilt, shape.trailingNewline, shape.crlf),
    remainingBlocks: shape.starts.length,
  };
}
