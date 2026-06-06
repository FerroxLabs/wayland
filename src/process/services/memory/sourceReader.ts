/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * sourceReader - read a windowed slice of a source file (markdown / text)
 * for display in the Memory Archive RightDrawer.
 *
 * Security: path must end in .md / .txt / .markdown and must resolve under
 * the user's home directory. Anything else returns {ok: false}.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const ALLOWED_EXTENSIONS = new Set(['.md', '.txt', '.markdown']);
const MAX_BYTES = 500 * 1024; // 500 KB

export type SourceContextOk = {
  ok: true;
  before: string;
  anchor: string;
  after: string;
  totalLines: number;
  language?: string;
};

export type SourceContextErr = {
  ok: false;
  error: string;
};

export type SourceContextResult = SourceContextOk | SourceContextErr;

/**
 * Read a windowed slice of a source file centred on `line`.
 *
 * @param path     Absolute or ~-relative path to the file.
 * @param line     1-based line number of the cited anchor line. 0 treated as 1.
 * @param contextLines  Number of lines to return before and after the anchor.
 */
export async function readSourceContext({
  path: filePath,
  line,
  contextLines = 50,
}: {
  path: string;
  line: number;
  contextLines?: number;
}): Promise<SourceContextResult> {
  // Expand ~ prefix
  const resolved = filePath.startsWith('~')
    ? path.join(os.homedir(), filePath.slice(1))
    : path.resolve(filePath);

  // Extension check
  const ext = path.extname(resolved).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: `File type not allowed: ${ext}` };
  }

  // Must be under home dir
  const home = os.homedir();
  if (!resolved.startsWith(home + path.sep) && resolved !== home) {
    return { ok: false, error: 'Path is outside the user home directory' };
  }

  // Existence check
  try {
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) {
      return { ok: false, error: 'Path is not a file' };
    }
  } catch {
    return { ok: false, error: 'File not found' };
  }

  // Read (capped at MAX_BYTES to avoid huge memory use)
  let raw: string;
  try {
    const stat = fs.statSync(resolved);
    if (stat.size > MAX_BYTES) {
      // Read only a chunk centred on the requested line.
      // We can't know exact byte offset without scanning, so we read MAX_BYTES
      // starting from offset 0 for simplicity - acceptable for source context.
      const buf = Buffer.alloc(MAX_BYTES);
      const fd = fs.openSync(resolved, 'r');
      try {
        fs.readSync(fd, buf, 0, MAX_BYTES, 0);
      } finally {
        fs.closeSync(fd);
      }
      raw = buf.toString('utf8');
    } else {
      raw = fs.readFileSync(resolved, 'utf8');
    }
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  const allLines = raw.split('\n');
  const totalLines = allLines.length;

  // Normalise line to 1-based; treat 0 as whole-file
  const anchorLine = Math.max(1, line);

  if (line <= 1 && anchorLine === 1) {
    // Special case: line=0 or line=1 → return whole file as anchor
    if (line <= 0) {
      return {
        ok: true,
        before: '',
        anchor: raw,
        after: '',
        totalLines,
      };
    }
  }

  // Clamp to actual file length
  const anchorIdx = Math.min(anchorLine, totalLines) - 1; // 0-based

  const beforeStart = Math.max(0, anchorIdx - contextLines);
  const afterEnd = Math.min(totalLines - 1, anchorIdx + contextLines);

  const before = allLines.slice(beforeStart, anchorIdx).join('\n');
  const anchor = allLines[anchorIdx] ?? '';
  const after = allLines.slice(anchorIdx + 1, afterEnd + 1).join('\n');

  return {
    ok: true,
    before,
    anchor,
    after,
    totalLines,
    language: 'markdown',
  };
}
