/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure path logic for per-project persistent workspaces (#455). A project's
 * workspace is a real, user-visible directory (default: ~/Documents/Wayland/<name>);
 * the rules here turn a free-form project name into a filesystem-safe,
 * collision-free folder. Kept free of electron/fs so the effectful allocator
 * (see projectWorkspace.ts) can inject `exists`.
 */
import path from 'path';

/** Filesystem-safe cap for a project folder name. */
const MAX_NAME_LEN = 80;

/**
 * Turn a project name into a safe folder name:
 * - path separators become spaces (a name can never escape the base dir),
 * - control chars and Windows-reserved chars (`<>:"|?*`) are dropped,
 * - whitespace is collapsed and trimmed,
 * - leading/trailing dots and spaces are stripped (Windows rejects them),
 * - length is capped,
 * - falls back to `Project` when nothing usable remains.
 */
export function sanitizeProjectFolderName(name: string): string {
  const cleaned = (name ?? '')
    .normalize('NFC')
    .replace(/[/\\]+/g, ' ') // path separators -> space
    .replace(/\p{Cc}/gu, '') // control characters
    .replace(/[<>:"|?*]+/g, '') // Windows-reserved characters
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, '') // no leading/trailing dot or space
    .slice(0, MAX_NAME_LEN)
    .replace(/[.\s]+$/, ''); // re-strip a trailing dot/space the cap may expose (Windows-invalid)
  return cleaned || 'Project';
}

/**
 * Resolve a collision-free absolute workspace path under `baseDir` for a project.
 * `exists` is injected (production passes `fs.existsSync`) so this stays pure and
 * unit-testable. Returns `baseDir/<name>`, or `baseDir/<name> (2)`, `(3)`... when
 * the preferred path is already taken (two same-named projects stay distinct).
 */
export function resolveProjectWorkspacePath(
  baseDir: string,
  projectName: string,
  exists: (p: string) => boolean
): string {
  const safe = sanitizeProjectFolderName(projectName);
  let candidate = path.join(baseDir, safe);
  let n = 2;
  while (exists(candidate)) {
    candidate = path.join(baseDir, `${safe} (${n})`);
    n++;
  }
  return candidate;
}
