/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Obsidian vault importer.
 * Detects vaults under ~/Documents/ (max depth 4) by presence of .obsidian/
 * and imports all .md files as MemoryEntry observation records.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import log from 'electron-log';

export type VaultInfo = {
  path: string;
  name: string;
  mdFileCount: number;
};

export type ObsidianImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

// ===== Vault detection =====

async function countMdFiles(dir: string, excludeDir: string): Promise<number> {
  let count = 0;
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && path.join(dir, entry.name) === excludeDir) continue;
      if (!entry.isDirectory() && entry.name.endsWith('.md')) {
        count++;
      }
    }
  } catch {
    // unreadable - return 0
  }
  return count;
}

async function scanForObsidianDirs(
  dir: string,
  currentDepth: number,
  maxDepth: number,
  results: VaultInfo[]
): Promise<void> {
  if (currentDepth > maxDepth) return;

  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const hasObsidian = entries.some((e) => e.isDirectory() && e.name === '.obsidian');
  if (hasObsidian) {
    const obsidianPath = path.join(dir, '.obsidian');
    const mdCount = await countMdFiles(dir, obsidianPath);
    results.push({
      path: dir,
      name: path.basename(dir),
      mdFileCount: mdCount,
    });
    // Don't recurse into vault - vaults don't nest.
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Skip hidden directories (except we already handle .obsidian above).
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    // Skip symlinks - don't follow them out of the scanned tree.
    try {
      const lstat = await fs.promises.lstat(fullPath);
      if (lstat.isSymbolicLink()) continue;
    } catch {
      continue;
    }
    await scanForObsidianDirs(fullPath, currentDepth + 1, maxDepth, results);
  }
}

/**
 * Scan ~/Documents/ (max depth 4) for Obsidian vaults.
 */
export async function detectVaults(): Promise<VaultInfo[]> {
  const docsDir = path.join(os.homedir(), 'Documents');
  const results: VaultInfo[] = [];
  try {
    await fs.promises.access(docsDir);
  } catch {
    return results;
  }
  await scanForObsidianDirs(docsDir, 0, 4, results);
  return results;
}

// ===== Importer =====

function entryId(relativePath: string): string {
  return crypto.createHash('sha256').update(relativePath).digest('hex').slice(0, 16);
}

function extractH1(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function parseFrontmatterTags(content: string): string[] {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  const fm = match[1];
  // Match `tags: [a, b]` or `tags:\n  - a\n  - b`
  const inlineMatch = fm.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  const blockLines = fm.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
  if (blockLines) {
    return blockLines[1]
      .split('\n')
      .map((l) => l.replace(/^\s+-\s+/, '').trim())
      .filter((t) => t.length > 0);
  }
  return [];
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
}

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

/**
 * True when `child` resolves to `root` itself or a path nested beneath it.
 * Separator-aware via `path.relative` so it does not false-match a sibling
 * directory that shares a name prefix (e.g. `/vault` vs `/vault-evil`).
 */
function isInsideRoot(root: string, child: string): boolean {
  const rel = path.relative(root, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Read a vault `.md` file while closing the TOCTOU window between the walk-time
 * symlink check and this read. An attacker who controls the vault dir can swap a
 * regular `.md` for a symlink in the race window; a naive `readFile` would
 * follow it out of the vault (e.g. to `~/.ssh/id_rsa`).
 *
 * Defenses, applied at read time against the live filesystem:
 *  1. Open with `O_NOFOLLOW` (where supported) so a symlink swapped in for the
 *     final component is refused atomically at `open()` (ELOOP), no follow.
 *  2. Re-resolve `fs.realpath` and assert the result is still inside the vault
 *     root - this also catches a symlinked *intermediate* directory component
 *     that `O_NOFOLLOW` (final-component only) would miss.
 *  3. `fstat` the opened descriptor and require a regular file, so a fifo/device
 *     swapped in is refused.
 *
 * Returns the file content, or `null` (with a warning) if any guard trips.
 */
export async function readConfinedVaultFile(filePath: string, vaultRoot: string): Promise<string | null> {
  // O_NOFOLLOW is POSIX-only; it is `undefined` on Windows. When absent we omit
  // it and rely on the realpath + fstat guards below, which are cross-platform.
  const noFollow = fs.constants.O_NOFOLLOW ?? 0;

  // Canonicalize the vault root for the comparison so platforms whose tmp/home
  // dirs are themselves symlinks (e.g. macOS `/var` -> `/private/var`) do not
  // false-reject legitimate in-vault files. If the root cannot be resolved
  // (does not exist), fall back to its lexical form.
  let canonicalRoot = vaultRoot;
  try {
    canonicalRoot = await fs.promises.realpath(vaultRoot);
  } catch {
    // keep the lexical root
  }

  let fd: fs.promises.FileHandle | undefined;
  try {
    fd = await fs.promises.open(filePath, fs.constants.O_RDONLY | noFollow);

    // Re-resolve the real path now (after open) and confirm it is still inside
    // the vault root. Catches a symlinked intermediate directory component.
    const real = await fs.promises.realpath(filePath);
    if (!isInsideRoot(canonicalRoot, real)) {
      log.warn('[obsidianImporter] skipping file that resolves outside vault root', {
        filePath,
        real,
        vaultRoot,
      });
      return null;
    }

    const st = await fd.stat();
    if (!st.isFile()) {
      log.warn('[obsidianImporter] skipping non-regular vault entry', { filePath });
      return null;
    }

    return await fd.readFile('utf8');
  } catch (err) {
    // ELOOP here means a symlink was swapped in for the final component and
    // O_NOFOLLOW refused to follow it - the TOCTOU attack, blocked.
    log.warn('[obsidianImporter] refused to read vault file', { filePath, err });
    return null;
  } finally {
    await fd?.close().catch(() => {});
  }
}

async function walkMdFiles(dir: string, skip: string[]): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      // Skip symlinks - don't follow them out of the vault tree.
      try {
        const lstat = await fs.promises.lstat(fullPath);
        if (lstat.isSymbolicLink()) continue;
      } catch {
        continue;
      }
      if (entry.isDirectory()) {
        if (skip.includes(fullPath) || entry.name.startsWith('.')) continue;
        const sub = await walkMdFiles(fullPath, skip);
        files.push(...sub);
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch {
    // unreadable
  }
  return files;
}

/**
 * Import all .md files from an Obsidian vault into `ijfwMemoryDir`.
 */
export async function runObsidianImport(
  rawVaultPath: string,
  opts?: { ijfwMemoryDir?: string }
): Promise<ObsidianImportResult> {
  // Expand tilde in main process (renderer must not pass unexpanded paths).
  let vaultPath = rawVaultPath;
  // Expand a leading `~`, matching both `~/` (POSIX) and `~\` (Windows) and
  // joining via path.join so separators stay platform-correct.
  if (vaultPath === '~') {
    vaultPath = os.homedir();
  } else if (vaultPath.startsWith('~/') || vaultPath.startsWith('~' + path.sep)) {
    vaultPath = path.join(os.homedir(), vaultPath.slice(2));
  }
  vaultPath = path.resolve(vaultPath);

  const memDir = opts?.ijfwMemoryDir ?? path.join(os.homedir(), '.ijfw', 'memory');
  const result: ObsidianImportResult = { imported: 0, skipped: 0, errors: [] };

  try {
    await fs.promises.access(vaultPath);
  } catch {
    result.errors.push(`Vault not found: ${vaultPath}`);
    return result;
  }

  try {
    await fs.promises.mkdir(memDir, { recursive: true });
  } catch (err) {
    result.errors.push(`Failed to create memory dir: ${String(err)}`);
    return result;
  }

  const vaultName = path.basename(vaultPath);
  const skipDirs = [path.join(vaultPath, '.obsidian'), path.join(vaultPath, '.trash')];

  let mdFiles: string[];
  try {
    mdFiles = await walkMdFiles(vaultPath, skipDirs);
  } catch (err) {
    result.errors.push(`Failed to walk vault: ${String(err)}`);
    return result;
  }

  for (const filePath of mdFiles) {
    try {
      const relativePath = path.relative(vaultPath, filePath);
      const id = entryId(relativePath);

      const destFile = path.join(memDir, `obsidian-${id}.md`);

      // Dedupe: if file already exists, skip.
      try {
        await fs.promises.access(destFile);
        result.skipped++;
        continue;
      } catch {
        // File does not exist - proceed.
      }

      // Re-validate the file against the vault root at read time to close the
      // TOCTOU window between the walk-time lstat and this read (RT-B5-01).
      const rawContent = await readConfinedVaultFile(filePath, vaultPath);
      if (rawContent === null) {
        result.skipped++;
        continue;
      }
      const tags = parseFrontmatterTags(rawContent);
      const bodyOnly = stripFrontmatter(rawContent);
      const h1 = extractH1(bodyOnly);
      const summary = h1 ?? bodyOnly.slice(0, 280).replace(/\n/g, ' ');

      const stat = await fs.promises.stat(filePath);
      const storedAt = stat.mtimeMs;

      const frontmatter = buildFrontmatter({
        type: 'observation',
        summary: summary.replace(/[\r\n]+/g, ' ').slice(0, 200),
        stored: new Date(storedAt).toISOString(),
        project: vaultName,
        tags,
        source: 'obsidian',
        source_path: relativePath.replace(/[\r\n]+/g, ' '),
      });

      const fileContent = `${frontmatter}\n${rawContent}\n`;
      await fs.promises.writeFile(destFile, fileContent, 'utf8');
      result.imported++;
    } catch (err) {
      log.warn('[obsidianImporter] failed to import file', { filePath, err });
      result.errors.push(`${filePath}: ${String(err)}`);
    }
  }

  return result;
}
