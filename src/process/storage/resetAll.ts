import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@office-ai/platform';

const WIPE_DIRS = ['conversations', 'attachments', 'cache', 'config'];

/** Log the contents that will be wiped before deleting, so the user can audit after re-launch. */
function logWipeManifest(userData: string, logsDir: string): void {
  const manifest: Record<string, string[]> = {};

  for (const dir of WIPE_DIRS) {
    const full = path.join(userData, dir);
    if (!fs.existsSync(full)) continue;
    const files: string[] = [];
    const walk = (d: string) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, entry.name);
        if (entry.isDirectory()) walk(p);
        else files.push(p.replace(userData + path.sep, ''));
      }
    };
    walk(full);
    manifest[dir] = files;
  }

  const logPath = path.join(logsDir, 'pre-reset-manifest.json');
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify({ wipedAt: new Date().toISOString(), files: manifest }, null, 2));
    logger.info(`[resetAll] Wipe manifest written to ${logPath}`);
  } catch (err) {
    logger.warn('[resetAll] Could not write wipe manifest', err);
  }
}

/** Remove a directory recursively, ignoring individual file errors. */
function rmDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;
  fs.rmSync(dirPath, { recursive: true, force: true });
}

/**
 * Full data wipe.
 *
 * Callers MUST enforce double-confirm in the renderer before invoking.
 * This function logs a manifest first, then deletes after a 3-second delay
 * so the renderer has time to display the countdown.
 */
export async function resetAll(userData: string, logsDir: string): Promise<void> {
  logWipeManifest(userData, logsDir);

  // 3-second safety delay
  await new Promise<void>((resolve) => setTimeout(resolve, 3000));

  for (const dir of WIPE_DIRS) {
    rmDir(path.join(userData, dir));
  }

  // Also wipe the sqlite database if present
  const dbPath = path.join(userData, 'wayland.db');
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }

  logger.info('[resetAll] Data wipe complete');
}
