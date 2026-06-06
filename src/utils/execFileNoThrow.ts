/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * execFileNoThrow - safe subprocess helper for security-sensitive invocations.
 *
 * ALL osascript calls in this codebase MUST go through this helper.
 * Uses execFile from node:child_process (NOT exec) so no shell is spawned and
 * metacharacter injection in arguments is impossible.
 */

import { execFile } from 'node:child_process';

export type ExecFileResult = {
  /** stdout as a trimmed UTF-8 string */
  stdout: string;
  /** stderr as a trimmed UTF-8 string */
  stderr: string;
  /** exit code; null means the process was killed by a signal */
  exitCode: number | null;
};

/**
 * Run `file` with `args` via execFile and return stdout/stderr regardless of
 * the exit code. Never throws - callers check `exitCode`.
 *
 * @param file      Executable name or absolute path (no shell expansion).
 * @param args      Arguments array (no shell metacharacter interpretation).
 * @param opts      Optional timeout in milliseconds (default: 30 000).
 */
export function execFileNoThrow(
  file: string,
  args: string[],
  opts: { timeoutMs?: number } = {},
): Promise<ExecFileResult> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  return new Promise((resolve) => {
    execFile(
      file,
      args,
      { encoding: 'utf8', timeout: timeoutMs, windowsHide: true },
      (error, stdout, stderr) => {
        resolve({
          stdout: (stdout ?? '').trim(),
          stderr: (stderr ?? '').trim(),
          exitCode: error?.code != null ? (error.code as number) : (error ? 1 : 0),
        });
      },
    );
  });
}
