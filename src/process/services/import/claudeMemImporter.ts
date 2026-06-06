/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Import service for claude-mem SQLite database.
 * Reads ~/.claude-mem/claude-mem.db and maps observation/session/prompt rows
 * to MemoryEntry markdown files written into the target IJFW memory directory.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import BetterSqlite3 from 'better-sqlite3';
import type Database from 'better-sqlite3';
import log from 'electron-log';

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
 * Import observations from ~/.claude-mem/claude-mem.db into `ijfwMemoryDir`.
 *
 * Returns early (no throw) if the database file is absent or unreadable.
 */
export async function runClaudeMemImport(opts?: { ijfwMemoryDir?: string }): Promise<ClaudeMemImportResult> {
  const dbPath = path.join(os.homedir(), '.claude-mem', 'claude-mem.db');
  const memDir = opts?.ijfwMemoryDir ?? path.join(os.homedir(), '.ijfw', 'memory');

  const result: ClaudeMemImportResult = { imported: 0, skipped: 0, errors: [] };

  // Check database exists.
  try {
    await fs.promises.access(dbPath);
  } catch {
    result.errors.push(`~/.claude-mem/claude-mem.db not found`);
    return result;
  }

  // Ensure target directory exists.
  try {
    await fs.promises.mkdir(memDir, { recursive: true });
  } catch (err) {
    result.errors.push(`Failed to create memory dir: ${String(err)}`);
    return result;
  }

  let db: Database.Database;
  try {
    db = new BetterSqlite3(dbPath, { readonly: true });
  } catch (err) {
    result.errors.push(`Failed to open claude-mem.db: ${String(err)}`);
    return result;
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

  return result;
}
