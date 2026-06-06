/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wiki writer - promotes a memory entry to a project's .ijfw/wiki/ directory.
 * Supports frontmatter, wiki-index.md, global routing, 24h undo queue,
 * and a persistent promoted-set sidecar (.promoted.json).
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { MemoryEntry } from '@/common/types/memory';

// ===== Public types =====

type PromoteResult = { ok: true; wikiPath: string } | { ok: false; error: string };

type UndoResult = { ok: true } | { ok: false; error: string };

type PromotedSidecar = {
  ids: string[];
  promotedAt: Record<string, number>;
};

type UndoQueueEntry = {
  promotedAt: number;
  wikiPath: string;
  wikiDir: string;
  originalEntry: MemoryEntry;
};

const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

// ===== Module-level state =====

/** In-memory undo queue: id → undo entry. */
const undoQueue = new Map<string, UndoQueueEntry>();

/** Per-wikiDir sidecar cache: wikiDir → sidecar data. */
const sidecarCache = new Map<string, PromotedSidecar>();

/**
 * Per-wikiDir promotion mutex. Serialises concurrent promoteEntry calls for
 * the same directory so the sidecar array never gets duplicate entries.
 */
const promotionLocks = new Map<string, Promise<unknown>>();

// ===== Helpers =====

/**
 * Atomic write: write to a temp file then rename into place.
 * Prevents partial reads if the process crashes mid-write.
 */
async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.promises.writeFile(tmp, contents, 'utf-8');
  await fs.promises.rename(tmp, filePath);
}

/** Slugify a summary for use as a filename. */
function toSlug(summary: string): string {
  return summary
    .slice(0, 60)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolve the wiki directory for an entry.
 * If project === 'global' OR sourcePath starts under ~/.ijfw/, use the global wiki.
 */
function resolveWikiDir(entry: MemoryEntry, wikiRootOverride?: string): string {
  if (wikiRootOverride) return wikiRootOverride;
  const home = os.homedir();
  const globalMemDir = path.join(home, '.ijfw', 'memory');
  if (
    entry.project === 'global' ||
    entry.sourcePath.startsWith(path.join(home, '.ijfw', path.sep)) ||
    entry.sourcePath.startsWith(globalMemDir)
  ) {
    return path.join(home, '.ijfw', 'wiki', 'global');
  }
  return path.join(entry.projectPath, '.ijfw', 'wiki');
}

/** Path to the per-directory .promoted.json sidecar. */
function sidecarPath(wikiDir: string): string {
  return path.join(wikiDir, '.promoted.json');
}

/** Load the promoted sidecar from disk (or return empty). */
async function loadSidecar(wikiDir: string): Promise<PromotedSidecar> {
  const cached = sidecarCache.get(wikiDir);
  if (cached) return cached;
  const p = sidecarPath(wikiDir);
  try {
    const raw = await fs.promises.readFile(p, 'utf8');
    const parsed = JSON.parse(raw) as PromotedSidecar;
    const sidecar: PromotedSidecar = {
      ids: Array.isArray(parsed.ids) ? parsed.ids : [],
      promotedAt: parsed.promotedAt && typeof parsed.promotedAt === 'object' ? parsed.promotedAt : {},
    };
    sidecarCache.set(wikiDir, sidecar);
    return sidecar;
  } catch {
    const empty: PromotedSidecar = { ids: [], promotedAt: {} };
    sidecarCache.set(wikiDir, empty);
    return empty;
  }
}

/** Persist the sidecar to disk atomically. */
async function saveSidecar(wikiDir: string, sidecar: PromotedSidecar): Promise<void> {
  sidecarCache.set(wikiDir, sidecar);
  const p = sidecarPath(wikiDir);
  await atomicWrite(p, JSON.stringify(sidecar, null, 2));
}

/**
 * True if the entry ID is in the persisted promoted set for a given wikiDir.
 * Falls back to an async load so callers that don't need it can skip.
 */
export async function isPromoted(id: string, wikiDir: string): Promise<boolean> {
  const sidecar = await loadSidecar(wikiDir);
  return sidecar.ids.includes(id);
}

/**
 * Serialize a frontmatter scalar so it can never break out of its field.
 *
 * Plain values that are safe as bare YAML (no YAML-significant characters, not
 * ambiguous with a YAML type/keyword) are emitted as-is so files stay readable.
 * Anything else - newlines, `---`, `:`, `#`, quotes, leading/trailing spaces,
 * bracket/brace/flow indicators, or values that look like booleans/null/numbers
 * - is emitted as a single-line JSON-style double-quoted string. JSON escaping
 * turns newlines into `\n`, so a value containing `\n---\ninjected: x` stays on
 * one line and round-trips back to the original via decodeScalar in the reader.
 */
function serializeFrontmatterValue(value: string): string {
  // Empty string must be quoted (bare empty value is null in YAML).
  if (value.length === 0) return '""';

  const needsQuoting =
    /[\n\r\t"#:[\]{}&*!|>%@`,]/.test(value) ||
    value !== value.trim() ||
    value.startsWith('-') ||
    value.startsWith('?') ||
    /^(?:true|false|yes|no|on|off|null|~)$/i.test(value) ||
    /^[+-]?(?:\d|\.\d|0x|0o)/.test(value);

  if (!needsQuoting) return value;
  // JSON.stringify on a string yields a valid single-line double-quoted scalar
  // with newlines/quotes/backslashes escaped - decodeScalar reverses it exactly.
  return JSON.stringify(value);
}

/** Build wiki file content with required frontmatter. */
function formatWikiContent(entry: MemoryEntry, promotedAt: string): string {
  const tagsLine = entry.tags.length > 0 ? `[${entry.tags.map((t) => serializeFrontmatterValue(t)).join(', ')}]` : '[]';
  const lines: string[] = [
    '---',
    `promoted_from: ${serializeFrontmatterValue(`${entry.sourcePath}:L${entry.sourceLine}`)}`,
    `promoted_at: ${serializeFrontmatterValue(promotedAt)}`,
    `promotion_score: ${entry.promotionScore}`,
    `tags: ${tagsLine}`,
    '---',
    '',
    `# ${entry.summary}`,
    '',
    `*Stored: ${new Date(entry.storedAt).toISOString().slice(0, 10)} · Project: ${entry.project}*`,
    '',
  ];
  if (entry.body) {
    lines.push(entry.body);
  } else {
    lines.push(entry.bodyPreview);
  }
  return lines.join('\n');
}

/**
 * Extract the first non-empty, non-frontmatter line from a wiki file as its
 * summary (for wiki-index.md generation).
 */
function extractFirstSummary(content: string): string {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let frontmatterClosed = false;
  for (const line of lines) {
    if (!frontmatterClosed) {
      if (line.trim() === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
          continue;
        } else {
          frontmatterClosed = true;
          continue;
        }
      }
      if (inFrontmatter) continue;
    }
    const stripped = line
      .replace(/^#+\s*/, '')
      .replace(/^\*+/, '')
      .trim();
    if (stripped.length > 0) return stripped.slice(0, 120);
  }
  return '';
}

/** Rewrite wiki-index.md by scanning *.md files in wikiDir (excluding wiki-index.md). */
async function rebuildWikiIndex(wikiDir: string): Promise<void> {
  let entries: string[];
  try {
    entries = await fs.promises.readdir(wikiDir);
  } catch {
    return;
  }

  const slugFiles = entries
    .filter((f) => f.endsWith('.md') && f !== 'wiki-index.md' && !f.startsWith('.'))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const lines: string[] = ['# Wiki Index', '<!-- auto-generated by Wayland v0.6.4 -->', ''];

  for (const file of slugFiles) {
    const slug = file.replace(/\.md$/, '');
    let summary = '';
    try {
      const content = await fs.promises.readFile(path.join(wikiDir, file), 'utf8');
      summary = extractFirstSummary(content);
    } catch {
      // skip unreadable files
    }
    lines.push(`- [${slug}](${file})${summary ? ` - ${summary}` : ''}`);
  }

  const indexPath = path.join(wikiDir, 'wiki-index.md');
  await atomicWrite(indexPath, lines.join('\n') + '\n');
}

// ===== Public API =====

/**
 * Promote a memory entry to the wiki directory.
 *
 * @param entry            - The full entry.
 * @param wikiRootOverride - Optional directory override (used in tests).
 */
export async function promoteEntry(entry: MemoryEntry, wikiRootOverride?: string): Promise<PromoteResult> {
  const wikiDir = resolveWikiDir(entry, wikiRootOverride);

  // Serialise all promotions for the same wikiDir to prevent concurrent
  // reads of the same sidecar, duplicate ids, and last-write-wins stomps.
  const prev = promotionLocks.get(wikiDir) ?? Promise.resolve();
  const result = prev.then(async (): Promise<PromoteResult> => {
    // Check persisted set first (re-read after acquiring the lock).
    const sidecar = await loadSidecar(wikiDir);
    if (sidecar.ids.includes(entry.id)) {
      return { ok: false, error: 'already promoted' };
    }

    try {
      await fs.promises.mkdir(wikiDir, { recursive: true });
    } catch (err) {
      return { ok: false, error: `mkdir failed: ${(err as Error).message}` };
    }

    const slug = toSlug(entry.summary) || entry.id;
    const wikiPath = path.join(wikiDir, `${slug}.md`);

    // Refuse to overwrite an existing wiki file.
    try {
      await fs.promises.access(wikiPath);
      return { ok: false, error: `wiki file already exists: ${wikiPath}` };
    } catch {
      // File does not exist - proceed.
    }

    const now = new Date().toISOString();
    const content = formatWikiContent(entry, now);
    try {
      await atomicWrite(wikiPath, content);
    } catch (err) {
      return { ok: false, error: `write failed: ${(err as Error).message}` };
    }

    // Update sidecar atomically.
    const nowMs = Date.now();
    sidecar.ids.push(entry.id);
    sidecar.promotedAt[entry.id] = nowMs;
    await saveSidecar(wikiDir, sidecar);

    // Add to undo queue.
    undoQueue.set(entry.id, {
      promotedAt: nowMs,
      wikiPath,
      wikiDir,
      originalEntry: entry,
    });

    // Rebuild wiki-index.md.
    await rebuildWikiIndex(wikiDir);

    return { ok: true, wikiPath };
  });

  // Store the settled promise so subsequent calls chain on it.
  promotionLocks.set(
    wikiDir,
    result.catch((): undefined => undefined)
  );

  return result;
}

/**
 * Undo a recent promotion. Only valid within 24h of promotion.
 * Deletes the wiki file, updates index, removes from queue and sidecar.
 */
export async function undoPromotion(id: string): Promise<UndoResult> {
  const queueEntry = undoQueue.get(id);
  if (!queueEntry) {
    return { ok: false, error: 'not in undo queue' };
  }

  const ageMs = Date.now() - queueEntry.promotedAt;
  if (ageMs > UNDO_WINDOW_MS) {
    undoQueue.delete(id);
    return { ok: false, error: 'grace_window_expired' };
  }

  // Delete the wiki file.
  try {
    await fs.promises.unlink(queueEntry.wikiPath);
  } catch (err) {
    return { ok: false, error: `delete failed: ${(err as Error).message}` };
  }

  // Update sidecar.
  const sidecar = await loadSidecar(queueEntry.wikiDir);
  sidecar.ids = sidecar.ids.filter((i) => i !== id);
  delete sidecar.promotedAt[id];
  await saveSidecar(queueEntry.wikiDir, sidecar);

  // Remove from undo queue.
  undoQueue.delete(id);

  // Rebuild wiki-index.
  await rebuildWikiIndex(queueEntry.wikiDir);

  return { ok: true };
}

/**
 * Check whether an entry ID has been promoted (checks persisted sidecar).
 * Variant that takes the entry directly, for use from the sweep.
 */
export async function isEntryPromoted(entry: MemoryEntry, wikiRootOverride?: string): Promise<boolean> {
  const wikiDir = resolveWikiDir(entry, wikiRootOverride);
  return isPromoted(entry.id, wikiDir);
}

/** Clear all in-memory state (used in tests). */
export function clearWikiWriterState(): void {
  undoQueue.clear();
  sidecarCache.clear();
  promotionLocks.clear();
}
