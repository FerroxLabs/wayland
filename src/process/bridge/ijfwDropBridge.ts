/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW drop-tab IPC bridge - file-safety logic lives in main, never in
 * renderer. Closes SEC-013.
 *
 * Providers:
 *   - dropList: enumerate files currently queued in `~/.ijfw/dump`
 *   - dropIngest({path}): copy the user-supplied path into dump dir after
 *     lstat / size / extension / count / containment checks
 *   - dropQuarantine({name}): move named file to `<dump>/.quarantine` with
 *     a timestamp prefix
 *
 * Wave 5 renderer (drop-tab UI) calls these providers - it does NOT touch
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

// Checkpoint B B3: the dot-prefix is load-bearing - IJFW MCP server reads
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
 * Active project containment - Checkpoint B H2: narrowed to `process.cwd()`
 * only for v0.6.3. The previous policy accepted any file under `$HOME` which
 * exposed SSH keys, ~/.aws/credentials, browser cookie stores, etc.
 *
 * Gemini B3: when cwd is `/` (macOS GUI Dock launch), `path.relative('/', X)`
 * returns a non-`..` non-absolute path for ANY file on disk (e.g. for
 * `/etc/passwd` it returns `etc/passwd`). Treating cwd-`/` as the trusted
 * root let the renderer drop SSH keys / ~/.aws/credentials / browser cookies
 * into the IJFW dump pipeline. Refuse the call entirely when cwd is unsafe.
 *
 * TODO v0.6.4: extend to the recent-workspaces store so users can drop files
 * from any of their tracked projects, not just the current one.
 */
const UNSAFE_ROOT_PREFIXES: readonly string[] = [
  '/',
  '/etc',
  '/var',
  '/usr',
  '/bin',
  '/sbin',
  '/opt',
  '/private',
  '/System',
  '/Library',
  '/Applications',
  '/tmp',
  '/dev',
  '/proc',
  '/sys',
];

/**
 * Windows system-root prefixes. XP-DROP-WIN-01: the POSIX list above never
 * matches a Windows path, so a GUI-launched app with cwd under
 * `C:\Windows\System32` or `C:\Program Files` would otherwise be treated as a
 * trusted drop root. These are derived from the standard Windows env vars
 * (with a hardcoded fallback) and matched as path PREFIXES, not exact strings,
 * so any subdirectory of a system root is also refused.
 */
function windowsUnsafeRootPrefixes(): string[] {
  const sysDrive = process.env.SystemDrive ?? 'C:';
  const prefixes = [
    process.env.SystemRoot ?? `${sysDrive}\\Windows`,
    process.env.ProgramFiles ?? `${sysDrive}\\Program Files`,
    process.env['ProgramFiles(x86)'] ?? `${sysDrive}\\Program Files (x86)`,
    process.env.ProgramData ?? `${sysDrive}\\ProgramData`,
  ];
  return prefixes.map((p) => p.toLowerCase());
}

/**
 * True when `cwd` sits at or beneath any unsafe system root. Uses a normalized
 * prefix check (via `path.relative`) so subdirectories of a system root are
 * refused too - exact-equality alone let `C:\Windows\System32` slip through on
 * Windows (XP-DROP-WIN-01).
 */
function isUnsafeRoot(cwd: string): boolean {
  if (process.platform === 'win32') {
    const norm = cwd.toLowerCase();
    return windowsUnsafeRootPrefixes().some((root) => {
      const rel = path.relative(root, norm);
      return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
    });
  }
  return UNSAFE_ROOT_PREFIXES.some((root) => cwd === root);
}

function trustedRootCandidates(): string[] {
  const cwd = process.cwd();
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  const roots: string[] = [];
  // cwd is only a candidate when it's NOT one of the unsafe roots and NOT the
  // bare HOME directory (which is too broad - would whitelist ~/.aws etc.).
  if (cwd && cwd !== home) {
    if (!isUnsafeRoot(cwd) && cwd !== path.parse(cwd).root) {
      roots.push(cwd);
    }
  }
  return roots;
}

function isUnderTrustedRoot(absPath: string): boolean {
  const roots = trustedRootCandidates();
  if (roots.length === 0) return false;
  for (const root of roots) {
    const rel = path.relative(root, absPath);
    if (rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)) {
      return true;
    }
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
      const stat = await fs.promises.lstat(path.join(dumpDir(), name)).catch((): fs.Stats | null => null);
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
  // Gemini B3: refuse drops entirely when no safe trusted root exists. This
  // happens when the app is GUI-launched and cwd is `/` (or another system
  // path). Returning `unavailable` lets the renderer surface "Drop unavailable
  // - open Wayland from a project directory" instead of accidentally
  // accepting `/etc/passwd` because `path.relative('/', X)` doesn't start
  // with `..`.
  if (trustedRootCandidates().length === 0) {
    return fail('no trusted project root available', 'unavailable');
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
