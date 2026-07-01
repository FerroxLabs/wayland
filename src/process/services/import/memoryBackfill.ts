/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #256 - one-time backfill of pre-existing memories into the IJFW FTS5 index.
 *
 * Store-on-drop (`memoryIndexer.indexDroppedMemory`) only exists from this
 * version on, so any memory already sitting in ~/.ijfw/memory - dropped or
 * imported before the upgrade - was written to disk (and shows in the Memory UI)
 * but was never indexed into the FTS5 store free-text recall reads. Those
 * entries can never be recalled and do NOT self-heal. On first run after upgrade
 * we sweep the memory dir once and index each entry.
 *
 * Guarded by a version marker so it runs exactly once: `ijfw_memory_store` is an
 * INSERT, so re-running would duplicate entries. The marker lives one level above
 * the memory dir so neither the Memory UI archive scanner nor the drop watcher
 * ever sees it.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import log from 'electron-log';
import { deriveSummary, stripFrontmatter } from './memoryFrontmatter';
import { indexDroppedMemory } from './memoryIndexer';

const MARKER_BASENAME = '.memory-fts5-backfill-v1';

/** Once-only marker path, kept beside (not inside) the memory dir. */
export function backfillMarkerPath(ijfwMemoryDir: string): string {
  return path.join(path.dirname(ijfwMemoryDir), MARKER_BASENAME);
}

export type BackfillResult = {
  /** Number of memories handed to the FTS5 store this run. */
  indexed: number;
  /** True when the marker already existed and the sweep was skipped. */
  skipped: boolean;
  errors: string[];
};

/**
 * Index every top-level .md memory currently in `ijfwMemoryDir` into the IJFW
 * FTS5 store, exactly once per install. Best-effort: a failure on any single
 * file (or the whole sweep) is logged and swallowed - it must never break app
 * startup, and the on-disk memories remain untouched.
 */
export async function backfillMemoryIndex(opts: {
  ijfwMemoryDir: string;
  markerPath?: string;
}): Promise<BackfillResult> {
  const { ijfwMemoryDir } = opts;
  const markerPath = opts.markerPath ?? backfillMarkerPath(ijfwMemoryDir);
  const result: BackfillResult = { indexed: 0, skipped: false, errors: [] };

  // Already swept once - never run again (store is an INSERT; re-running dupes).
  // If the marker can't be stat'd, fail safe by skipping to avoid duplicate risk.
  try {
    if (fs.existsSync(markerPath)) {
      result.skipped = true;
      return result;
    }
  } catch {
    result.skipped = true;
    return result;
  }

  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(ijfwMemoryDir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      // No memory dir yet (fresh install) - nothing to strand. Lay the marker so
      // we don't re-scan on every boot, then stop.
      await writeMarker(markerPath, result);
      return result;
    }
    // Transient failure (EACCES / EBUSY / EMFILE / home volume syncing). Do NOT
    // write the marker - retry the sweep on the next boot rather than burning the
    // once-only guard and permanently stranding every pre-existing memory.
    log.warn('[memoryBackfill] readdir failed, will retry next boot', { ijfwMemoryDir, err });
    result.errors.push(`readdir: ${String(err)}`);
    return result;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith('.md')) continue;

    const filePath = path.join(ijfwMemoryDir, entry.name);
    try {
      const raw = await fs.promises.readFile(filePath, 'utf8');
      // Index the body only. The persisted file carries synthetic frontmatter
      // (title/description/type/...); the live drop paths store the pre-frontmatter
      // body, so strip it here too - otherwise backfilled entries would be polluted
      // with YAML and burn the store's content cap on metadata. stripFrontmatter
      // also strips a BOM and normalizes newlines.
      const body = stripFrontmatter(raw);
      if (!body.trim()) continue;
      const summary = deriveSummary(raw, entry.name);
      await indexDroppedMemory({
        content: body,
        summary,
        sourceFile: entry.name,
        tags: ['dropped', 'backfill'],
      });
      result.indexed++;
    } catch (err) {
      log.warn('[memoryBackfill] failed to index existing memory', { file: entry.name, err });
      result.errors.push(`${entry.name}: ${String(err)}`);
    }
  }

  await writeMarker(markerPath, result);
  log.info('[memoryBackfill] one-time FTS5 backfill complete', {
    indexed: result.indexed,
    errorCount: result.errors.length,
  });
  return result;
}

/** Persist the once-only marker. A marker-write failure is recorded but never thrown. */
async function writeMarker(markerPath: string, result: BackfillResult): Promise<void> {
  try {
    await fs.promises.mkdir(path.dirname(markerPath), { recursive: true });
    await fs.promises.writeFile(
      markerPath,
      JSON.stringify({ version: 1, indexed: result.indexed, at: new Date().toISOString() }),
      'utf8'
    );
  } catch (err) {
    log.warn('[memoryBackfill] failed to write backfill marker', { markerPath, err });
    result.errors.push(`marker: ${String(err)}`);
  }
}
