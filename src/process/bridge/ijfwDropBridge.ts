/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW drop-tab IPC bridge — file-safety logic lives in main, never in
 * renderer. Closes SEC-013.
 *
 * Providers:
 *   - dropList: enumerate files currently queued in `~/.ijfw/dump`
 *   - dropIngest({path}): copy the user-supplied path into dump dir after
 *     lstat / size / extension / count / containment checks
 *   - dropQuarantine({name}): move named file to `<dump>/.quarantine` with
 *     a timestamp prefix
 *
 * Wave 5 renderer (drop-tab UI) calls these providers — it does NOT touch
 * the filesystem directly.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import log from 'electron-log';
import { ipcBridge } from '@/common';
import type { IjfwErrorReason } from '@/common/types/ijfw';

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_QUEUE_COUNT = 20;
const ALLOWED_EXTENSIONS = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.csv']);

// Checkpoint B B3: the dot-prefix is load-bearing — IJFW MCP server reads
// files from `~/.ijfw/dump`, not `~/ijfw/dump`. The previous spelling landed
// drops in the wrong location and IJFW never saw them.
function dumpDir(): string {
  return path.join(os.homedir(), '.ijfw', 'dump');
}

function quarantineDir(): string {
  return path.join(dumpDir(), '.quarantine');
}

async function ensureDir(p: string): Promise<void> {
  await fs.promises.mkdir(p, { recursive: true });
}

type IngestFailure = { ok: false; error: string; errorReason: IjfwErrorReason };
type IngestSuccess = { ok: true; name: string };

function fail(reason: string, errorReason: IjfwErrorReason = 'validation_failed'): IngestFailure {
  return { ok: false, error: reason, errorReason };
}

/**
 * Active project containment — Wave 2 uses cwd + home dir as the trust roots.
 * Wave 6 will extend this with the recent-workspaces store. The check uses
 * `path.relative` so a resolved path under one of the roots is accepted.
 */
function isUnderTrustedRoot(absPath: string): boolean {
  const home = os.homedir();
  const projectRoot = process.cwd();
  for (const root of [home, projectRoot]) {
    const rel = path.relative(root, absPath);
    if (rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)) return true;
  }
  return false;
}

async function listImpl(): Promise<{ files: Array<{ name: string; size: number; mtimeMs: number }> }> {
  try {
    await ensureDir(dumpDir());
    const entries = await fs.promises.readdir(dumpDir());
    const files: Array<{ name: string; size: number; mtimeMs: number }> = [];
    for (const name of entries) {
      if (name.startsWith('.')) continue; // skip .quarantine and dot-files
      const stat = await fs.promises
        .lstat(path.join(dumpDir(), name))
        .catch((): fs.Stats | null => null);
      if (!stat || !stat.isFile()) continue;
      files.push({ name, size: stat.size, mtimeMs: stat.mtimeMs });
    }
    files.sort((a, b) => a.name.localeCompare(b.name));
    return { files };
  } catch (err) {
    log.warn('[ijfw-drop] list failed', { err });
    return { files: [] };
  }
}

async function ingestImpl(srcPath: string): Promise<IngestSuccess | IngestFailure> {
  if (typeof srcPath !== 'string' || srcPath.length === 0) {
    return fail('empty path');
  }
  const resolved = path.resolve(srcPath);
  if (!isUnderTrustedRoot(resolved)) {
    return fail('path outside trusted roots');
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.lstat(resolved);
  } catch (err) {
    return fail(`stat failed: ${(err as Error).message}`);
  }
  if (stat.isSymbolicLink()) return fail('symlinks are not allowed');
  if (!stat.isFile()) return fail('not a regular file');
  if (stat.size > MAX_FILE_BYTES) {
    return fail(`file exceeds size cap (${stat.size} > ${MAX_FILE_BYTES})`);
  }

  const ext = path.extname(resolved).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return fail(`extension not allowed: ${ext}`);
  }

  await ensureDir(dumpDir());
  const existing = await fs.promises.readdir(dumpDir());
  const queueCount = existing.filter((n) => !n.startsWith('.')).length;
  if (queueCount >= MAX_QUEUE_COUNT) {
    return fail(`queue at capacity (${MAX_QUEUE_COUNT})`);
  }

  const baseName = path.basename(resolved);
  const destPath = path.join(dumpDir(), baseName);
  try {
    await fs.promises.copyFile(resolved, destPath, fs.constants.COPYFILE_FICLONE);
  } catch (err) {
    log.warn('[ijfw-drop] copy failed', { err });
    return fail(`copy failed: ${(err as Error).message}`);
  }
  return { ok: true, name: baseName };
}

async function quarantineImpl(name: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof name !== 'string' || name.length === 0) {
    return { ok: false, error: 'empty name' };
  }
  if (name.includes('/') || name.includes('\\') || name.startsWith('.')) {
    return { ok: false, error: 'invalid name (no separators or dot-prefix)' };
  }
  const src = path.join(dumpDir(), name);
  try {
    const stat = await fs.promises.lstat(src);
    if (!stat.isFile()) return { ok: false, error: 'not a regular file' };
  } catch {
    return { ok: false, error: 'file not found' };
  }
  await ensureDir(quarantineDir());
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(quarantineDir(), `${stamp}.${name}`);
  try {
    await fs.promises.rename(src, dest);
  } catch (err) {
    log.warn('[ijfw-drop] quarantine rename failed', { err });
    return { ok: false, error: (err as Error).message };
  }
  return { ok: true };
}

export function initIjfwDropBridge(): void {
  ipcBridge.ijfw.dropList.provider(async () => listImpl());
  ipcBridge.ijfw.dropIngest.provider(async ({ path: p }) => ingestImpl(p));
  ipcBridge.ijfw.dropQuarantine.provider(async ({ name }) => quarantineImpl(name));
}
