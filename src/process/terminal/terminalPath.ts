/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Terminal mode — resolve a launch command to an absolute executable path
 * against a given env's PATH. Returns `null` when the command is not installed,
 * which the bridge turns into a friendly in-pane message (no spawn, no crash).
 *
 * Kept separate + injectable-env so it is unit-testable without spawning.
 */
import { accessSync, constants, statSync } from 'node:fs';
import * as path from 'node:path';

function isExecutableFile(candidate: string): boolean {
  try {
    if (!statSync(candidate).isFile()) return false;
    accessSync(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve `command` to an absolute executable path using `env`'s PATH.
 * An already-pathed command (absolute or containing a separator) is checked
 * as-is. On Windows, PATHEXT extensions are tried.
 */
export function resolveCommandPath(command: string, env: Record<string, string>): string | null {
  if (!command) return null;

  const isWin = process.platform === 'win32';
  const exts = isWin ? ['', ...(env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean)] : [''];

  // Already-pathed command: don't consult PATH.
  if (path.isAbsolute(command) || command.includes('/') || (isWin && command.includes('\\'))) {
    for (const ext of exts) {
      if (isExecutableFile(command + ext)) return command + ext;
    }
    return null;
  }

  const pathVar = env.PATH ?? env.Path ?? '';
  for (const dir of pathVar.split(path.delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const candidate = path.join(dir, command + ext);
      if (isExecutableFile(candidate)) return candidate;
    }
  }
  return null;
}
