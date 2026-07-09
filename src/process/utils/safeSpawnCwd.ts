/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Safe working-directory selection for child processes (#755).
 *
 * Forked workers run with cwd = app.asar.unpacked so their WASM modules
 * resolve (ForkTask). Any child THEY spawn inherits that cwd unless one is
 * passed explicitly - and a child that treats a writable cwd as a project
 * root (ijfw's safeProjectDir() migration did exactly this) then writes
 * inside the signed .app bundle. That breaks the codesign seal, after which
 * hardened-runtime macOS refuses to exec ANY of the app's children (#738).
 *
 * Invariant: nothing the app launches may be handed a path under
 * `*.app/Contents` (or any app.asar) as its working directory.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getPlatformServices } from '@/common/platform';

/**
 * True when `p` points inside a packaged application bundle - i.e. under a
 * macOS `*.app/Contents` tree or any `app.asar` / `app.asar.unpacked`
 * directory (macOS, Windows and Linux packagings alike). Such paths are
 * sealed by code signing and must never be used as a child's cwd.
 */
export function isBundleInternalPath(p: string): boolean {
  if (!p) return false;
  const segments = path.normalize(p).split(/[\\/]+/);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    // app.asar and app.asar.unpacked (any platform's resources dir).
    if (seg === 'app.asar' || seg === 'app.asar.unpacked') return true;
    // <Name>.app/Contents (macOS bundle interior).
    if (seg.endsWith('.app') && segments[i + 1] === 'Contents') return true;
  }
  return false;
}

/**
 * Resolve a working directory that is safe to hand to a spawned child:
 * guaranteed to exist and guaranteed NOT to live inside the signed bundle.
 *
 * Preference order matches how other services pick writable dirs:
 *   1. userData (`paths.getDataDir()` - DATA_DIR is propagated into
 *      utility-process workers by ElectronPlatformServices.fork, so this
 *      resolves in both the main process and forked workers),
 *   2. the user's home directory,
 *   3. the OS temp dir (always exists; last resort).
 */
export function resolveSafeSpawnCwd(): string {
  const candidates: Array<() => string> = [() => getPlatformServices().paths.getDataDir(), () => os.homedir()];
  for (const candidate of candidates) {
    try {
      const dir = candidate();
      if (dir && !isBundleInternalPath(dir) && fs.existsSync(dir)) return dir;
    } catch {
      // Platform services unavailable in this context - try the next candidate.
    }
  }
  return os.tmpdir();
}
