/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Import service for Claude memories. Pulls from BOTH known locations and
 * merges the results into the target IJFW memory directory:
 *   1. The third-party claude-mem plugin's SQLite database
 *      (~/.claude-mem/claude-mem.db), mapping observation rows to markdown.
 *   2. Native Claude Code project memory
 *      (~/.claude/projects/<project>/memory/*.md), which is already markdown
 *      with frontmatter. Many users have (2) but no (1) - see #165, where the
 *      importer only checked the SQLite path and reported "not found".
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import BetterSqlite3 from 'better-sqlite3';
import type Database from 'better-sqlite3';
import log from 'electron-log';
import { parseMarkdownBlocks } from '../memory/markdownFrontmatter';

export type ClaudeMemImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

/** Row from the `observation` table. All fields may be null. */
type ObservationRow = {
  id: string | number;
  title: string | null;
  body: string | null;
  project: string | null;
  created_at: string | number | null;
  tags: string | null;
};

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

function createdAtMs(raw: string | number | null): number {
  if (raw == null) return Date.now();
  if (typeof raw === 'number') {
    // SQLite stores epoch seconds or epoch ms - normalise to ms.
    return raw > 1_000_000_000_000 ? raw : raw * 1000;
  }
  const parsed = Date.parse(String(raw));
  return isNaN(parsed) ? Date.now() : parsed;
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map(String);
  } catch {
    // Not JSON - try comma-separated.
  }
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Import Claude memories from both known locations into `ijfwMemoryDir`:
 * the claude-mem SQLite database AND native Claude Code project memory.
 * Never throws - missing sources are reported via the result, not exceptions.
 */
export async function runClaudeMemImport(opts?: { ijfwMemoryDir?: string }): Promise<ClaudeMemImportResult> {
  const dbPath = path.join(os.homedir(), '.claude-mem', 'claude-mem.db');
  const memDir = opts?.ijfwMemoryDir ?? path.join(os.homedir(), '.ijfw', 'memory');

  const result: ClaudeMemImportResult = { imported: 0, skipped: 0, errors: [] };

  // Ensure target directory exists (shared by both sources).
  try {
    await fs.promises.mkdir(memDir, { recursive: true });
  } catch (err) {
    result.errors.push(`Failed to create memory dir: ${String(err)}`);
    return result;
  }

  const dbPresent = await importFromClaudeMemDb(dbPath, memDir, result);
  const projectsPresent = await importFromClaudeProjects(memDir, result);

  if (!dbPresent && !projectsPresent && result.imported === 0) {
    result.errors.push('No Claude memory found: ~/.claude-mem/claude-mem.db not found and no ~/.claude/projects/*/memory');
  }

  return result;
}

/**
 * Import observation rows from the claude-mem SQLite database into `memDir`.
 * Returns true when the database file exists (regardless of rows imported),
 * false when it is absent, so the caller can tell whether the source was found.
 */
async function importFromClaudeMemDb(
  dbPath: string,
  memDir: string,
  result: ClaudeMemImportResult
): Promise<boolean> {
  try {
    await fs.promises.access(dbPath);
  } catch {
    return false;
  }

  let db: Database.Database;
  try {
    db = new BetterSqlite3(dbPath, { readonly: true });
  } catch (err) {
    result.errors.push(`Failed to open claude-mem.db: ${String(err)}`);
    return true;
  }

  try {
    let rows: ObservationRow[] = [];
    try {
      rows = db.prepare('SELECT id, title, body, project, created_at, tags FROM observation').all() as ObservationRow[];
    } catch (err) {
      // Table may not exist yet - not fatal.
      log.warn('[claudeMemImporter] observation table missing or unreadable', { err });
    }

    for (const row of rows) {
      try {
        const rawId = String(row.id ?? '');
        if (!rawId) {
          result.errors.push('Row missing id - skipped');
          continue;
        }
        // Sanitize to prevent path traversal via malformed row IDs.
        const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);

        const destFile = path.join(memDir, `observation-${id}.md`);
        // Guard: assert the resolved path stays within memDir.
        const resolvedMemDir = path.resolve(memDir);
        const resolvedDest = path.resolve(destFile);
        if (!resolvedDest.startsWith(resolvedMemDir + path.sep)) {
          result.errors.push(`Row id=${row.id}: sanitized path escapes memDir - skipped`);
          continue;
        }

        // Dedupe: if file already exists, skip.
        try {
          await fs.promises.access(destFile);
          result.skipped++;
          continue;
        } catch {
          // File does not exist - proceed to write.
        }

        const body = row.body ?? '';
        const summary = row.title ? row.title.slice(0, 280) : body.slice(0, 280).replace(/\n/g, ' ');

        const tags = parseTags(row.tags);
        const storedAt = createdAtMs(row.created_at);
        const project = row.project ?? 'global';

        const frontmatter = buildFrontmatter({
          type: 'observation',
          summary: summary.replace(/[\r\n]+/g, ' ').slice(0, 200),
          stored: new Date(storedAt).toISOString(),
          project,
          tags,
          source: 'claude-mem',
        });

        const fileContent = `${frontmatter}\n${body}\n`;
        await fs.promises.writeFile(destFile, fileContent, 'utf8');
        result.imported++;
      } catch (err) {
        result.errors.push(`Row id=${row.id}: ${String(err)}`);
      }
    }
  } finally {
    try {
      db.close();
    } catch {
      // ignore close errors
    }
  }

  return true;
}

/**
 * Import native Claude Code project memory into `memDir`. Claude Code stores
 * per-project memories at ~/.claude/projects/<project>/memory/*.md as markdown
 * with frontmatter (the same shape IJFW uses), plus a human-facing MEMORY.md
 * index that is skipped. Each frontmatter block becomes one deduped entry.
 * Returns true when the ~/.claude/projects directory exists.
 */
async function importFromClaudeProjects(memDir: string, result: ClaudeMemImportResult): Promise<boolean> {
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');

  let projectEntries: fs.Dirent[];
  try {
    projectEntries = await fs.promises.readdir(projectsDir, { withFileTypes: true });
  } catch {
    return false;
  }

  for (const projectEntry of projectEntries) {
    if (!projectEntry.isDirectory()) continue;
    const projectName = projectEntry.name;
    const sourceMemDir = path.join(projectsDir, projectName, 'memory');

    let mdFiles: string[];
    try {
      const entries = await fs.promises.readdir(sourceMemDir);
      // MEMORY.md is the human index (no frontmatter blocks) - skip it.
      mdFiles = entries.filter((n) => n.endsWith('.md') && n !== 'MEMORY.md');
    } catch {
      // No memory/ dir for this project - skip.
      continue;
    }

    for (const mdFile of mdFiles) {
      const filePath = path.join(sourceMemDir, mdFile);
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const blocks = parseMarkdownBlocks(content);

        for (const block of blocks) {
          const fm = block.frontmatter;
          const summaryRaw = typeof fm['summary'] === 'string' ? fm['summary'] : '';
          const descRaw = typeof fm['description'] === 'string' ? fm['description'] : '';
          const summary = summaryRaw || descRaw || block.body.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled';

          // Stable id from source + summary so re-imports dedupe.
          const idSource = `${projectName}:${mdFile}:${summary.slice(0, 80)}`;
          const id = crypto.createHash('sha1').update(idSource).digest('hex').slice(0, 12);
          const destFile = path.join(memDir, `claude-project-${id}.md`);

          // Dedupe: if file already exists, skip.
          try {
            await fs.promises.access(destFile);
            result.skipped++;
            continue;
          } catch {
            // File does not exist - proceed to write.
          }

          const rawTags = fm['tags'];
          const tags: string[] = Array.isArray(rawTags) ? rawTags : typeof rawTags === 'string' && rawTags ? [rawTags] : [];
          const typeRaw = typeof fm['type'] === 'string' ? fm['type'] : 'observation';

          const frontmatter = buildFrontmatter({
            type: typeRaw,
            summary: summary.replace(/[\r\n]+/g, ' ').slice(0, 200),
            stored: new Date().toISOString(),
            project: projectName,
            tags,
            source: 'claude-project',
          });

          await fs.promises.writeFile(destFile, `${frontmatter}\n${block.body}\n`, 'utf8');
          result.imported++;
        }
      } catch (err) {
        log.warn('[claudeMemImporter] failed to import project memory file', { filePath, err });
        result.errors.push(`${filePath}: ${String(err)}`);
      }
    }
  }

  return true;
}
