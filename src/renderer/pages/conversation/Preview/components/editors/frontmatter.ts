/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Frontmatter splitter for the TipTap markdown editor.
 *
 * Why this exists: `tiptap-markdown` does not understand YAML/TOML
 * frontmatter blocks and silently drops them when the editor loads.
 * Round-tripping a Jekyll/Hugo/Obsidian `.md` through the WYSIWYG
 * editor would erase user-authored frontmatter on auto-save.
 *
 * The editor stores the raw block at mount, feeds only the body to
 * ProseMirror, and re-prepends the raw block when serializing back
 * to disk. Frontmatter content is preserved byte-for-byte.
 */

export type FrontmatterSplit = {
  /** Raw frontmatter block including delimiters and trailing newline, or null. */
  raw: string | null;
  /** Markdown body after the frontmatter. Equal to input when no frontmatter. */
  body: string;
};

// ^(BOM)? (---|+++) \n  <content>  \n (---|+++) \n?
// Backreference \2 ensures opening and closing delimiters match.
const FRONTMATTER_REGEX = /^(﻿)?(---|\+\+\+)\r?\n([\s\S]*?)\r?\n\2(?:\r?\n|$)/;

/**
 * Splits a markdown source into an optional frontmatter block and a body.
 * Recognizes Jekyll/Hugo/Obsidian-style YAML (`---`) and Hugo TOML (`+++`),
 * with optional UTF-8 BOM. Empty frontmatter (`---\n---\n`) is supported.
 */
export function splitFrontmatter(source: string): FrontmatterSplit {
  if (typeof source !== 'string' || source.length === 0) {
    return { raw: null, body: source ?? '' };
  }
  const match = source.match(FRONTMATTER_REGEX);
  if (!match) {
    return { raw: null, body: source };
  }
  return {
    raw: match[0],
    body: source.slice(match[0].length),
  };
}

/** Re-joins a previously split frontmatter block with an edited body. */
export function joinFrontmatter(raw: string | null, body: string): string {
  if (!raw) return body;
  return raw + body;
}
