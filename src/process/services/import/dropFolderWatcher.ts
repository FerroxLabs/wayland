/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Drop-folder watcher - monitors ~/Documents/Wayland-Memory/ (non-recursive,
 * depth 0) for incoming .md / .txt / .json files, ingests them into the current
 * IJFW memory directory, and deletes the originals.
 *
 * Safety: chokidar is constrained to depth 0 per HANDOFF §10 chokidar safety.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import chokidar from 'chokidar';
import log from 'electron-log';
import { indexDroppedMemory } from './memoryIndexer';
import { deriveSummary, deriveTitle, stripBom } from './memoryFrontmatter';

const DEFAULT_DROP_FOLDER = path.join(os.homedir(), 'Documents', 'Wayland-Memory');

const INGEST_EXTENSIONS = new Set(['.md', '.txt', '.json']);

// Dedup window: basenames ingested within the last 30s are skipped to prevent
// double-ingest if the unlink fails and chokidar fires the 'add' event again.
const _recentlyIngested = new Map<string, number>(); // basename → timestamp
const DEDUP_WINDOW_MS = 30_000;

// Ingested-today counter: dateKey (YYYY-MM-DD) → count.
const _ingestedTodayCounts = new Map<string, number>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function incrementIngestedToday(): void {
  const key = todayKey();
  _ingestedTodayCounts.set(key, (_ingestedTodayCounts.get(key) ?? 0) + 1);
}

export function getIngestedTodayCount(): number {
  return _ingestedTodayCounts.get(todayKey()) ?? 0;
}

// Watching state: true once startDropFolderWatcher has been called and not stopped.
let _isWatching = false;

export function isDropFolderWatching(): boolean {
  return _isWatching;
}

export function getDropFolderPath(): string {
  return DEFAULT_DROP_FOLDER;
}

export type DropFolderStatus = {
  path: string;
  watching: boolean;
  ingestedToday: number;
};

export function getDropFolderStatus(): DropFolderStatus {
  return {
    path: DEFAULT_DROP_FOLDER,
    watching: _isWatching,
    ingestedToday: getIngestedTodayCount(),
  };
}

function isRecentlyIngested(basename: string): boolean {
  const ts = _recentlyIngested.get(basename);
  if (ts === undefined) return false;
  if (Date.now() - ts > DEDUP_WINDOW_MS) {
    _recentlyIngested.delete(basename);
    return false;
  }
  return true;
}

function markIngested(basename: string): void {
  _recentlyIngested.set(basename, Date.now());
  incrementIngestedToday();
}

export type DropFolderWatcherHandle = {
  stop: () => void;
};

export type DropFolderProcessResult = {
  count: number;
  errors: string[];
};

// ===== Helpers =====

function buildFrontmatter(fields: Record<string, string | string[] | number>): string {
  const lines = ['---'];
  for (const [key, val] of Object.entries(fields)) {
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map((v) => String(v)).join(', ')}]`);
    } else {
      const escaped = String(val)
        .replace(/[\r\n]+/g, ' ')
        .slice(0, 500);
      lines.push(`${key}: ${escaped}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function destFilename(timestamp: number, basename: string): string {
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `dropped-${timestamp}-${safe}`;
}

async function ingestFile(filePath: string, ijfwMemoryDir: string): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);
  // Strip a leading BOM at the source so the title heading-match, the written
  // body, and the FTS5 store content all see clean text (#256 B1).
  const rawContent = stripBom(await fs.promises.readFile(filePath, 'utf8'));
  const timestamp = Date.now();

  let fileContent: string;

  // Title + summary feed both the on-disk frontmatter (so the IJFW reader tier
  // surfaces a real title/description, not just the filename) and the FTS5
  // index call below. Prefer a leading markdown heading, else the source name.
  const summary = deriveSummary(rawContent, basename);
  const title = deriveTitle(rawContent, basename);

  if (ext === '.md') {
    // Already markdown - prepend source frontmatter if not already present.
    const hasFrontmatter = rawContent.trimStart().startsWith('---');
    if (hasFrontmatter) {
      fileContent = rawContent;
    } else {
      const frontmatter = buildFrontmatter({
        title,
        description: summary,
        type: 'observation',
        summary,
        stored: new Date(timestamp).toISOString(),
        project: 'global',
        tags: [],
        source: 'drop-folder',
        source_file: basename.replace(/[\r\n]+/g, ' '),
      });
      fileContent = `${frontmatter}\n${rawContent}\n`;
    }
  } else {
    // .txt or .json - wrap body.
    const frontmatter = buildFrontmatter({
      title,
      description: summary,
      type: 'observation',
      summary,
      stored: new Date(timestamp).toISOString(),
      project: 'global',
      tags: [],
      source: 'drop-folder',
      source_file: basename.replace(/[\r\n]+/g, ' '),
    });
    fileContent = `${frontmatter}\n${rawContent}\n`;
  }

  const destName = destFilename(timestamp, basename.replace(/\.(?:md|txt|json)$/i, '.md'));
  const destPath = path.join(ijfwMemoryDir, destName);
  await fs.promises.writeFile(destPath, fileContent, 'utf8');

  // Populate the IJFW FTS5 index so the agent can recall this memory, not just
  // see it in the Memory UI (#256). Fire-and-forget - never blocks the ingest.
  void indexDroppedMemory({ content: rawContent, summary, sourceFile: basename });

  // Only unlink after a successful write. If unlink fails, log and continue -
  // the file will be seen again on next event but the dedup window will skip it.
  try {
    await fs.promises.unlink(filePath);
  } catch (unlinkErr) {
    log.warn('[dropFolderWatcher] unlink failed after write - will dedup on next event', { filePath, unlinkErr });
  }
  markIngested(basename);
}

// ===== Live watcher =====

/**
 * Start watching the drop folder. Returns a handle to stop the watcher.
 * Creates the drop folder if absent.
 */
export function startDropFolderWatcher(opts: {
  ijfwMemoryDir: string;
  dropFolder?: string;
  onIngest: (filename: string) => void;
  onError: (err: string) => void;
}): DropFolderWatcherHandle {
  const dropFolder = opts.dropFolder ?? DEFAULT_DROP_FOLDER;
  const { ijfwMemoryDir, onIngest, onError } = opts;

  // Create drop folder synchronously so chokidar can start watching immediately.
  try {
    fs.mkdirSync(dropFolder, { recursive: true, mode: 0o755 });
    fs.mkdirSync(ijfwMemoryDir, { recursive: true });
  } catch (err) {
    onError(`Failed to create directories: ${String(err)}`);
  }

  // Build the chokidar watcher with POLLING, not the fsevents native backend.
  // On macOS, chokidar's fsevents handler can async-reject deep inside
  // `_addToFsEvents` (observed live: "Cannot read properties of undefined
  // (reading 'SinceNow')") when the bundled native binding is incompatible with
  // the Electron ABI. Because that rejection is internal to chokidar it is NOT
  // routed to the watcher's 'error' event, so it escapes as an unhandledRejection
  // that crashes the app at startup on affected machines (#447). The drop folder
  // is a single shallow (depth 0) directory, so polling sidesteps the fsevents
  // path entirely at negligible cost. The try/catch + 'error' handler below stay
  // as defense-in-depth for any remaining synchronous/emitted failure.
  const baseOpts = {
    depth: 0,
    ignoreInitial: true,
    persistent: true,
    followSymlinks: false,
    usePolling: true,
    interval: 250,
  } as const;
  let watcher: ReturnType<typeof chokidar.watch>;
  try {
    watcher = chokidar.watch(dropFolder, baseOpts);
  } catch (err) {
    log.warn('[dropFolderWatcher] watch init failed - watcher disabled', { err });
    onError(`Failed to start drop-folder watcher: ${String(err)}`);
    _isWatching = false;
    return { stop: () => {} };
  }

  _isWatching = true;

  watcher.on('add', (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!INGEST_EXTENSIONS.has(ext)) return;

    const basename = path.basename(filePath);
    if (isRecentlyIngested(basename)) {
      log.info('[dropFolderWatcher] skipping recently ingested file (dedup)', { filePath });
      return;
    }

    ingestFile(filePath, ijfwMemoryDir)
      .then(() => {
        log.info('[dropFolderWatcher] ingested', { filePath });
        onIngest(basename);
      })
      .catch((err: unknown) => {
        log.warn('[dropFolderWatcher] ingest failed', { filePath, err });
        onError(`Failed to ingest ${basename}: ${String(err)}`);
      });
  });

  watcher.on('error', (err: unknown) => {
    log.warn('[dropFolderWatcher] watcher error', { err });
    onError(`Watcher error: ${String(err)}`);
  });

  return {
    stop: () => {
      _isWatching = false;
      watcher.close().catch((err: unknown) => {
        log.warn('[dropFolderWatcher] close error', { err });
      });
    },
  };
}

// ===== One-shot processor =====

/**
 * Process all files currently in the drop folder (one-shot, no watching).
 * Creates the drop folder if absent.
 */
export async function runDropFolderProcess(opts?: {
  dropFolder?: string;
  ijfwMemoryDir?: string;
}): Promise<DropFolderProcessResult> {
  const dropFolder = opts?.dropFolder ?? DEFAULT_DROP_FOLDER;
  const ijfwMemoryDir = opts?.ijfwMemoryDir ?? path.join(os.homedir(), '.ijfw', 'memory');
  const result: DropFolderProcessResult = { count: 0, errors: [] };

  try {
    await fs.promises.mkdir(dropFolder, { recursive: true, mode: 0o755 });
    await fs.promises.mkdir(ijfwMemoryDir, { recursive: true });
  } catch (err) {
    result.errors.push(`Failed to create directories: ${String(err)}`);
    return result;
  }

  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dropFolder, { withFileTypes: true });
  } catch (err) {
    result.errors.push(`Cannot read drop folder: ${String(err)}`);
    return result;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!INGEST_EXTENSIONS.has(ext)) continue;

    const filePath = path.join(dropFolder, entry.name);
    try {
      await ingestFile(filePath, ijfwMemoryDir);
      result.count++;
    } catch (err) {
      log.warn('[dropFolderWatcher] one-shot ingest failed', { filePath, err });
      result.errors.push(`${entry.name}: ${String(err)}`);
    }
  }

  return result;
}
