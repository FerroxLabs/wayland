/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared title/description derivation for ingested memories.
 *
 * Two ingest paths feed the memory store: the Drop folder watcher
 * (`dropFolderWatcher.ingestFile`) and the drag-drop IPC
 * (`importBridge.ingestFiles`). They previously each reimplemented title/summary
 * derivation inline, and the drag-drop path never stripped a leading UTF-8 BOM.
 * On a Windows-authored file (BOM + CRLF, or lone-CR line endings) that path
 * produced `title = <filename fallback>` and a mashed description, while the
 * drop-folder path produced clean output for the same bytes (#256 B1).
 *
 * Both paths now derive through these helpers so identical input yields
 * identical metadata regardless of entry point, and the two implementations
 * cannot drift again. Every function tolerates a BOM and CRLF / lone-CR endings.
 */

const FIELD_MAX = 200;

/** Strip a single leading UTF-8 BOM (U+FEFF), which Windows editors prepend. */
export function stripBom(raw: string): string {
  return raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
}

/** Normalize CRLF and lone-CR line endings to LF. */
export function normalizeNewlines(raw: string): string {
  return raw.replace(/\r\n?/g, '\n');
}

/** Strip a leading BOM and normalize newlines in one pass. Idempotent. */
export function cleanText(raw: string): string {
  return normalizeNewlines(stripBom(raw));
}

/** Strip a leading YAML frontmatter block (if any) so derivation reads the real body. */
export function stripFrontmatter(raw: string): string {
  return cleanText(raw).replace(/^\s*---\n[\s\S]*?\n---\n?/, '');
}

/**
 * Human title: a leading markdown heading if present, else the source filename
 * (sans extension). Falls back to the filename when no heading is found.
 */
export function deriveTitle(raw: string, basename: string): string {
  const heading = stripFrontmatter(raw).match(/^#\s+(.+)$/m);
  const title = heading ? heading[1].trim() : basename.replace(/\.(?:md|txt|json)$/i, '');
  return title
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, FIELD_MAX);
}

/**
 * One-line description. Prefers the first real body line over a leading markdown
 * heading, so the description stays distinct from the title; falls back to the
 * heading text and finally the filename.
 */
export function deriveSummary(raw: string, basename: string): string {
  const lines = stripFrontmatter(raw)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const firstBodyLine = lines.find((l) => !l.startsWith('#'));
  const firstHeading = lines[0]?.replace(/^#+\s*/, '');
  const cleaned = (firstBodyLine || firstHeading || basename).replace(/[\r\n]+/g, ' ').trim();
  return (cleaned || basename).slice(0, FIELD_MAX);
}
