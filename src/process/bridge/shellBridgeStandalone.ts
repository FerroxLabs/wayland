/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shell Bridge - Standalone (no-Electron) Mode
 *
 * Implements shell operations using Node.js child_process instead of Electron
 * shell APIs. Works for both local standalone and headless server deployments.
 */

import { ipcBridge } from '@/common';
import { isAllowedExternalUrl } from '@/common/utils/urlValidation';
import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import path from 'node:path';

const isWindows = process.platform === 'win32';

// cmd.exe's `start` builtin re-parses its tail, so these metacharacters would be
// interpreted by the shell even though execFile did not spawn one. Reject any
// path containing them on Windows before handing it to `cmd /c start` (mirrors
// the metachar rejection in shellBridge.ts). `%` is included to block
// environment-variable expansion (%VAR%).
const WINDOWS_FORBIDDEN_PATH_CHARS = /[&|<>"^%]/;

function runOpen(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const [cmd, ...rest] = isWindows
      ? ['cmd', '/c', 'start', '', ...args]
      : process.platform === 'darwin'
        ? ['open', ...args]
        : ['xdg-open', ...args];
    execFile(cmd, rest, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/**
 * Open a filesystem path via the OS default handler.
 *
 * On Windows, `cmd /c start` re-parses cmd metacharacters from the path tail, so
 * the path is validated to be an existing filesystem entry and rejected if it
 * contains `& | < > " ^ %` before invoking cmd (SEC-SHELL-03). POSIX uses
 * `open`/`xdg-open` via execFile (no shell), so no metachar parsing occurs.
 */
function openPathSafely(targetPath: string): Promise<void> {
  if (isWindows) {
    if (WINDOWS_FORBIDDEN_PATH_CHARS.test(targetPath)) {
      console.warn(`[shellBridge] Rejected path with forbidden characters: ${targetPath}`);
      return Promise.resolve();
    }
    if (!fs.existsSync(targetPath)) {
      console.warn(`[shellBridge] Rejected path that does not exist: ${targetPath}`);
      return Promise.resolve();
    }
  }
  return runOpen([targetPath]);
}

export function initShellBridgeStandalone(): void {
  ipcBridge.shell.openFile.provider((filePath) => openPathSafely(filePath));

  ipcBridge.shell.showItemInFolder.provider((filePath) => openPathSafely(path.dirname(filePath)));

  ipcBridge.shell.openExternal.provider((url) => {
    // Allowlist schemes (https:/http:/mailto: and the app's own wayland: deep-link
    // scheme); reject file:/smb:/ms-*/vbscript:/custom handlers so model-rendered
    // markdown links cannot drive the OS into opening local files or leaking creds.
    if (!isAllowedExternalUrl(url)) {
      console.warn(`[shellBridge] Rejected openExternal for disallowed scheme: ${url}`);
      return Promise.resolve();
    }
    // On Windows, `cmd /c start` re-parses metacharacters from the URL tail too;
    // reject them before invoking cmd (the allowlisted schemes never legitimately
    // contain these characters).
    if (isWindows && WINDOWS_FORBIDDEN_PATH_CHARS.test(url)) {
      console.warn(`[shellBridge] Rejected URL with forbidden characters: ${url}`);
      return Promise.resolve();
    }
    return runOpen([url]);
  });
}
