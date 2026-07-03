/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Import IPC bridge - registers the memory.import.* namespace handlers.
 * Delegates to the four W1a import services.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import log from 'electron-log';
import { z } from 'zod';
import { ipcBridge } from '@/common';
import { getIjfwArchiveService } from '@process/services/memory/ijfwArchiveService';
import { runClaudeMemImport } from '@process/services/import/claudeMemImporter';
import { detectVaults, runObsidianImport } from '@process/services/import/obsidianImporter';
import { runDevScanImport, scanForMemoryDirs } from '@process/services/import/devScanImporter';
import {
  runDropFolderProcess,
  startDropFolderWatcher,
  getDropFolderStatus,
} from '@process/services/import/dropFolderWatcher';
import type { DropFolderWatcherHandle } from '@process/services/import/dropFolderWatcher';
import { indexDroppedMemory } from '@process/services/import/memoryIndexer';
import { backfillMemoryIndex } from '@process/services/import/memoryBackfill';
import { deriveSummary, deriveTitle, stripBom } from '@process/services/import/memoryFrontmatter';

// ── Schemas ──────────────────────────────────────────────────────────────────

const obsidianVaultSchema = z.object({ vaultPath: z.string().min(1).max(2048) });

const ingestFileItemSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string().max(500_000),
  scope: z.enum(['project', 'global']).optional(),
});

const ingestFilesSchema = z.object({
  files: z.array(ingestFileItemSchema).min(1).max(50),
});

// name/content are required by ingestFileItemSchema (`.min(1)`); they are typed
// optional here only to match zod's inferred element type at the call site.
type DragDropFile = { name?: string; content?: string; scope?: 'project' | 'global' };

/**
 * Assemble the persisted .md (frontmatter + body) and store payload for one
 * drag-dropped memory. Pure + exported so the BOM / CRLF derivation that the
 * drag-drop path got wrong (#256 B1) is unit-testable without the IPC harness.
 * Derivation runs through the shared `memoryFrontmatter` helpers so this path
 * and the drop-folder watcher cannot diverge again.
 */
export function buildDragDropMemoryFile(
  file: DragDropFile,
  timestamp: number
): { destName: string; fileContent: string; summary: string; title: string; indexedContent: string } {
  const name = file.name ?? 'memory.md';
  // Strip a leading BOM up front so the written body, the dedup hash, the
  // derived title/description, and the FTS5 store content all see clean text.
  // Without this a Windows-authored file (BOM before the first `#`) lost its
  // title to the filename fallback and stored mangled metadata.
  const cleaned = stripBom(file.content ?? '');
  const hash = crypto.createHash('sha1').update(cleaned).digest('hex').slice(0, 8);
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.(?:md|txt|json)$/i, '.md');
  const destName = `dropped-${timestamp}-${safeName}`;
  const scope = file.scope ?? 'global';
  const summary = deriveSummary(cleaned, name);
  const title = deriveTitle(cleaned, name);
  const hasFrontmatter = cleaned.trimStart().startsWith('---');

  let fileContent: string;
  if (hasFrontmatter) {
    fileContent = cleaned;
  } else {
    // title + description let the IJFW reader tier surface a real label/desc
    // instead of falling back to the generated filename.
    const frontmatter = [
      '---',
      `id: ${hash}`,
      `title: ${title}`,
      `description: ${summary}`,
      `type: observation`,
      `created: ${timestamp}`,
      `source: drag-drop`,
      `scope: ${scope}`,
      `summary: ${summary}`,
      '---',
      '',
    ].join('\n');
    fileContent = `${frontmatter}${cleaned}\n`;
  }

  return { destName, fileContent, summary, title, indexedContent: cleaned };
}

// ── Drop folder watcher handle (singleton) ───────────────────────────────────

let _dropWatcherHandle: DropFolderWatcherHandle | null = null;

/** Resolve the current project's .ijfw/memory directory. */
function resolveMemoryDir(): string {
  try {
    const svc = getIjfwArchiveService();
    // The archive service exposes projects[0].path as the most recently active project.
    // Access via the index held in the closure - safe because we're in main process.
    const indexStats = svc.indexStats();
    if (indexStats.projects > 0) {
      // Derive via quickAdd's same pattern: first project from internal index.
      // We don't have a direct accessor, so fall back to homedir global path.
    }
  } catch {
    // service not yet initialised - fall back
  }
  return path.join(os.homedir(), '.ijfw', 'memory');
}

export function initImportBridge(): void {
  // ── claude-mem importer ──────────────────────────────────────────────────
  ipcBridge.memory.import.claudeMem.provider(async () => {
    try {
      const memDir = resolveMemoryDir();
      const { imported, skipped, errors } = await runClaudeMemImport({ ijfwMemoryDir: memDir });
      log.info('[import] claudeMem done', { imported, skipped, errorCount: errors.length });
      return { count: imported, errors };
    } catch (err) {
      log.error('[import] claudeMem threw', { err });
      return { count: 0, errors: [String(err)] };
    }
  });

  // ── obsidian vault detection ─────────────────────────────────────────────
  // #553: scans ~/Documents for vaults so the Import drawer's Obsidian card can
  // populate its list. Previously unexposed, which left the Import button a
  // no-op (no vault could ever be selected).
  ipcBridge.memory.import.obsidianDetectVaults.provider(async () => {
    try {
      const vaults = await detectVaults();
      log.info('[import] obsidianDetectVaults done', { count: vaults.length });
      return vaults;
    } catch (err) {
      log.error('[import] obsidianDetectVaults threw', { err });
      return [];
    }
  });

  // ── obsidian vault importer ──────────────────────────────────────────────
  ipcBridge.memory.import.obsidianVault.provider(async (args) => {
    const parsed = obsidianVaultSchema.safeParse(args);
    if (!parsed.success) {
      log.warn('[import] obsidianVault invalid args', { args });
      return { count: 0, errors: ['invalid args'] };
    }
    try {
      // Expand tilde and resolve to absolute path in main process
      let vaultPath = parsed.data.vaultPath;
      // Expand a leading `~`, matching both `~/` (POSIX) and `~\` (Windows)
      // and joining via path.join so separators stay platform-correct.
      if (vaultPath === '~') {
        vaultPath = os.homedir();
      } else if (vaultPath.startsWith('~/') || vaultPath.startsWith('~' + path.sep)) {
        vaultPath = path.join(os.homedir(), vaultPath.slice(2));
      }
      vaultPath = path.resolve(vaultPath);
      // Restrict to home dir subtree
      const homeDir = os.homedir();
      if (!vaultPath.startsWith(homeDir + path.sep) && vaultPath !== homeDir) {
        log.warn('[import] obsidianVault path outside homedir', { vaultPath });
        return { count: 0, errors: ['vault path must be within home directory'] };
      }
      const memDir = resolveMemoryDir();
      const { imported, skipped, errors } = await runObsidianImport(vaultPath, { ijfwMemoryDir: memDir });
      log.info('[import] obsidianVault done', { vaultPath, imported, skipped, errorCount: errors.length });
      return { count: imported, errors };
    } catch (err) {
      log.error('[import] obsidianVault threw', { err });
      return { count: 0, errors: [String(err)] };
    }
  });

  // ── dev dir scanner + importer ───────────────────────────────────────────
  ipcBridge.memory.import.scanDevDir.provider(async () => {
    try {
      const memDir = resolveMemoryDir();
      const candidates = await scanForMemoryDirs();
      // Import all candidates not already in the registry.
      const newCandidatePaths = candidates.filter((c) => !c.alreadyInRegistry).map((c) => c.path);

      if (newCandidatePaths.length === 0) {
        log.info('[import] scanDevDir - no new candidates');
        return { count: 0, projectsFound: candidates.length, errors: [] };
      }

      const { imported, skipped, projectsFound, errors } = await runDevScanImport(newCandidatePaths, {
        ijfwMemoryDir: memDir,
      });
      log.info('[import] scanDevDir done', { imported, skipped, projectsFound, errorCount: errors.length });
      return { count: imported, projectsFound, errors };
    } catch (err) {
      log.error('[import] scanDevDir threw', { err });
      return { count: 0, projectsFound: 0, errors: [String(err)] };
    }
  });

  // ── drop folder one-shot processor ──────────────────────────────────────
  ipcBridge.memory.import.processDropFolder.provider(async () => {
    // Lazy-start the live watcher if it hasn't been started yet (Fix 7).
    startDropWatcherIfNeeded();
    try {
      const memDir = resolveMemoryDir();
      const { count, errors } = await runDropFolderProcess({ ijfwMemoryDir: memDir });
      log.info('[import] processDropFolder done', { count, errorCount: errors.length });
      return { count, errors };
    } catch (err) {
      log.error('[import] processDropFolder threw', { err });
      return { count: 0, errors: [String(err)] };
    }
  });

  // ── drop folder status getter ─────────────────────────────────────────────
  ipcBridge.memory.import.getDropFolderStatus.provider(async () => getDropFolderStatus());

  // ── drag-drop ingest ─────────────────────────────────────────────────────
  ipcBridge.memory.ingestFiles.provider(async (args) => {
    const parsed = ingestFilesSchema.safeParse(args);
    if (!parsed.success) {
      log.warn('[import] ingestFiles invalid args', { args });
      return { ok: false, ingested: 0, errors: ['invalid args'] };
    }

    const memDir = resolveMemoryDir();
    try {
      await fs.promises.mkdir(memDir, { recursive: true });
    } catch (err) {
      log.error('[import] ingestFiles mkdir failed', { err });
      return { ok: false, ingested: 0, errors: [`Failed to create memory dir: ${String(err)}`] };
    }

    let ingested = 0;
    const errors: string[] = [];

    for (const file of parsed.data.files) {
      // Reject path traversal attempts in the name.
      if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        errors.push(`${file.name}: rejected - invalid name`);
        continue;
      }

      const { destName, fileContent, summary, indexedContent } = buildDragDropMemoryFile(file, Date.now());
      const destPath = path.join(memDir, destName);

      try {
        await fs.promises.writeFile(destPath, fileContent, 'utf8');
        ingested++;
        log.info('[import] ingestFiles wrote', { destName });
        // Index into the IJFW FTS5 store so the agent can recall it, not just
        // see it in the Memory UI (#256). Fire-and-forget.
        void indexDroppedMemory({ content: indexedContent, summary, sourceFile: file.name });
      } catch (err) {
        log.warn('[import] ingestFiles write failed', { destName, err });
        errors.push(`${file.name}: ${String(err)}`);
      }
    }

    return { ok: true, ingested, errors };
  });

  // Auto-start the live drop folder watcher at bridge init (no-deferment #10).
  startDropWatcherIfNeeded();

  // One-time backfill: index memories that predate store-on-drop so they become
  // recallable without the user having to re-drop them (#256). Fire-and-forget -
  // guarded by a marker so it runs once, and best-effort so it never blocks init.
  void backfillMemoryIndex({ ijfwMemoryDir: resolveMemoryDir() }).catch((err: unknown) => {
    log.warn('[import] memory backfill failed', { err });
  });
}

/**
 * Start the drop folder watcher exactly once. Subsequent calls are no-ops.
 */
function startDropWatcherIfNeeded(): void {
  if (_dropWatcherHandle !== null) return;
  try {
    const memDir = resolveMemoryDir();
    _dropWatcherHandle = startDropFolderWatcher({
      ijfwMemoryDir: memDir,
      onIngest: (filename) => {
        log.info('[import] dropFolder auto-ingested', { filename });
      },
      onError: (err) => {
        log.warn('[import] dropFolder watcher error', { err });
      },
    });
    log.info('[import] drop folder watcher started');
  } catch (err) {
    log.warn('[import] failed to start drop folder watcher', { err });
  }
}
