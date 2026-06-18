/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type SpeakableTextOpts = {
  displayName?: string;
  spokenName?: string;
  /** Hard cap on spoken characters (~2 min of speech). Default 1200. */
  maxChars?: number;
};

const DEFAULT_MAX_CHARS = 1200;

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Convert assistant markdown into prose suitable for TTS: code blocks, tables,
 * and URLs are dropped; inline markdown is unwrapped to its visible text; the
 * user's name is replaced by its phonetic respelling. Returns '' when nothing
 * speakable remains. Engine-agnostic (no SSML) - pure text.
 */
export const toSpeakableText = (markdown: string, opts: SpeakableTextOpts): string => {
  let text = markdown;

  // 1. Remove fenced code blocks (``` ... ``` and ~~~ ... ~~~).
  text = text.replace(/```[\s\S]*?```/g, ' ').replace(/~~~[\s\S]*?~~~/g, ' ');

  // 2. Remove markdown table rows (lines that are pipe-delimited).
  text = text
    .split('\n')
    .filter((line) => !/^\s*\|.*\|\s*$/.test(line))
    .join('\n');

  // 3. Links [text](url) -> text; images ![alt](url) -> dropped.
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 4. Bare URLs -> dropped.
  text = text.replace(/\bhttps?:\/\/\S+/g, ' ');

  // 5. Inline code `x` -> x; emphasis/bold/strikethrough markers removed.
  text = text.replace(/`([^`]*)`/g, '$1');
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/~~(.*?)~~/g, '$1');

  // 6. Heading hashes and blockquote/list markers at line starts.
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  text = text.replace(/^\s{0,3}>\s?/gm, '');
  text = text.replace(/^\s{0,3}[-*+]\s+/gm, '');

  // 7. Name substitution (word-boundary, case-insensitive) - only when both present.
  if (opts.displayName && opts.spokenName) {
    const re = new RegExp(`\\b${escapeRegExp(opts.displayName)}\\b`, 'gi');
    text = text.replace(re, opts.spokenName);
  }

  // 8. Collapse whitespace.
  text = text.replace(/\s+/g, ' ').trim();

  // 9. Cap length on a word boundary.
  const max = opts.maxChars ?? DEFAULT_MAX_CHARS;
  if (text.length > max) {
    const slice = text.slice(0, max);
    const lastSpace = slice.lastIndexOf(' ');
    text = (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim();
  }

  return text;
};
