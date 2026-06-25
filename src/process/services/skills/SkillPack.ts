/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SkillPack - a packed body store for the vendored skill / workflow libraries.
 *
 * WHY (#309): the skills-library and bundled-workflows ship ~2,100 + ~70 loose
 * `SKILL.md` files as on-disk resources. Antivirus content heuristics (e.g.
 * Norton `MD:HttpRequest-inf`) scan each loose markdown file and can quarantine
 * it as a false positive - every loose body is an independent dice-roll against
 * that signature. This module replaces the loose `bodies/` tree with a SINGLE
 * opaque body blob (`skill-bodies.bin`) plus a small offset index
 * (`skill-bodies.offsets.json`), so no individually-scannable `.md` ships.
 *
 * DESIGN CONSTRAINTS:
 *  - Plain UTF-8 concatenation. NO base64, NO gzip, NO encryption: compression /
 *    encoding raise Shannon entropy toward the ~7 bits/byte packer-detection
 *    threshold and base64 reads as classic string-obfuscation, which would trip
 *    a DIFFERENT AV heuristic. Plain text sits ~4.5-5.5 bits/byte, safely below.
 *  - Neutral blob extension (`.bin`) so the markdown/document classifier (the
 *    `MD:` heuristic family) never fires on it.
 *  - The reader runs inside the plain-node `wayland_search_skills` stdio
 *    subprocess (which cannot read inside `app.asar`), so the pack ships as an
 *    UNPACKED resource dir and is read via ordinary `fs`. Only `path` + `fs` are
 *    imported here - no Electron / `@/common` deps - to keep that bundle lean.
 *  - Byte-exact round-trip: a body read from the pack is byte-identical to the
 *    original file decoded as UTF-8, so skill search returns identical results.
 */

import path from 'path';
import { promises as fs, existsSync } from 'fs';

/** Opaque body blob. Neutral extension so the AV markdown classifier won't fire. */
export const PACK_BLOB_NAME = 'skill-bodies.bin';
/** Small JSON offset index: relPath -> [byteOffset, byteLength] into the blob. */
export const PACK_OFFSETS_NAME = 'skill-bodies.offsets.json';

export type PackOffsets = {
  version: 1;
  /**
   * Maps each body's relative path (exactly as stored in `index.json`'s `path`
   * field) to its `[byteOffset, byteLength]` window in the blob. Keyed by the
   * SAME string the reader looks up, so no path normalization is needed at read
   * time.
   */
  entries: Record<string, [number, number]>;
};

export type BuildPackResult = {
  blobPath: string;
  offsetsPath: string;
  /** Number of bodies packed. */
  count: number;
  /** Total blob size in bytes. */
  bytes: number;
  /** Index paths whose body file could not be found on disk (skipped). */
  missing: string[];
};

type IndexEntryLike = { name?: string; path?: string };

/**
 * Resolve the on-disk body file for an index `path`, mirroring
 * `SkillLibrary.loadBody`'s literal-then-`bodies/` fallback so the pack contains
 * exactly the bytes the loose reader would have served.
 */
function resolveBodyFile(srcDir: string, relPath: string): string | null {
  const literal = path.join(srcDir, relPath);
  if (existsSync(literal)) return literal;
  const underBodies = path.join(srcDir, 'bodies', relPath);
  if (existsSync(underBodies)) return underBodies;
  return null;
}

/**
 * Build a pack (blob + offset index) for every vendored entry in
 * `<srcDir>/index.json` whose body resolves on disk. Writes `skill-bodies.bin`
 * and `skill-bodies.offsets.json` into `outDir`.
 *
 * Entries with an absolute `path` (externally-rooted: team / imported /
 * cli-discovered) are skipped - those are registered at runtime and never live
 * in the shipped library. Duplicate paths are written once.
 */
export async function buildSkillPack(srcDir: string, outDir: string): Promise<BuildPackResult> {
  const indexRaw = await fs.readFile(path.join(srcDir, 'index.json'), 'utf-8');
  const entries = JSON.parse(indexRaw) as IndexEntryLike[];
  if (!Array.isArray(entries)) {
    throw new Error(`SkillPack: ${path.join(srcDir, 'index.json')} is not an array`);
  }

  const offsets: PackOffsets = { version: 1, entries: {} };
  const chunks: Buffer[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();
  let offset = 0;

  for (const e of entries) {
    const relPath = e.path;
    // External (absolute) entries aren't part of the vendored library.
    if (!relPath || path.isAbsolute(relPath)) continue;
    if (seen.has(relPath)) continue;
    seen.add(relPath);

    const file = resolveBodyFile(srcDir, relPath);
    if (!file) {
      missing.push(relPath);
      continue;
    }
    // Raw bytes so the UTF-8 decode on read is byte-identical to readFile(p, 'utf-8').
    // Sequential by design: bodies concatenate in deterministic order with a
    // running offset, so this loop must not be parallelized.
    // eslint-disable-next-line no-await-in-loop
    const buf = await fs.readFile(file);
    offsets.entries[relPath] = [offset, buf.length];
    chunks.push(buf);
    offset += buf.length;
  }

  const blob = Buffer.concat(chunks);
  await fs.mkdir(outDir, { recursive: true });
  const blobPath = path.join(outDir, PACK_BLOB_NAME);
  const offsetsPath = path.join(outDir, PACK_OFFSETS_NAME);
  await fs.writeFile(blobPath, blob);
  // Compact JSON - this index is a lookup table, not meant to be hand-read.
  await fs.writeFile(offsetsPath, JSON.stringify(offsets));

  return {
    blobPath,
    offsetsPath,
    count: Object.keys(offsets.entries).length,
    bytes: blob.length,
    missing,
  };
}

/** Range reader seam - overridable in tests; defaults to a seek-read via `fs`. */
export type ReadRangeFn = (blobPath: string, offset: number, length: number) => Promise<string>;

const fsReadRange: ReadRangeFn = async (blobPath, offset, length) => {
  if (length === 0) return '';
  const fh = await fs.open(blobPath, 'r');
  try {
    const buf = Buffer.allocUnsafe(length);
    await fh.read(buf, 0, length, offset);
    return buf.toString('utf-8');
  } finally {
    await fh.close();
  }
};

export interface SkillPackReader {
  /** True when `relPath` has a packed body. */
  has(relPath: string): boolean;
  /** Read a body by its index path; null when not present in the pack. */
  read(relPath: string): Promise<string | null>;
}

/**
 * Open the pack in `dir` if both the blob and the offset index are present.
 * Returns `null` when no pack exists (dev tree / legacy loose layout), so
 * callers transparently fall back to reading loose `bodies/` files.
 *
 * The offset index is loaded once at open; bodies are seek-read on demand (never
 * cached) so the subprocess keeps the same lazy memory profile as the loose
 * reader. Returns `null` rather than throwing on a malformed/partial pack so a
 * corrupt artifact degrades to the loose fallback instead of breaking search.
 */
export async function openSkillPack(dir: string, opts?: { readRange?: ReadRangeFn }): Promise<SkillPackReader | null> {
  const blobPath = path.join(dir, PACK_BLOB_NAME);
  const offsetsPath = path.join(dir, PACK_OFFSETS_NAME);
  if (!existsSync(blobPath) || !existsSync(offsetsPath)) return null;

  let offsets: PackOffsets;
  try {
    offsets = JSON.parse(await fs.readFile(offsetsPath, 'utf-8')) as PackOffsets;
  } catch {
    return null;
  }
  if (!offsets || typeof offsets !== 'object' || !offsets.entries) return null;

  const readRange = opts?.readRange ?? fsReadRange;
  return {
    has: (relPath: string) => Object.prototype.hasOwnProperty.call(offsets.entries, relPath),
    read: async (relPath: string) => {
      const range = offsets.entries[relPath];
      if (!range) return null;
      const [offset, length] = range;
      return readRange(blobPath, offset, length);
    },
  };
}
