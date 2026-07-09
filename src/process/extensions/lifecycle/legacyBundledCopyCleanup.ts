/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'fs';
import fs from 'fs/promises';
import * as path from 'path';
import { getPlatformServices } from '@/common/platform';
import { EXTENSION_MANIFEST_FILE, getAppDataExtensionsDir, getBundledExtensionsDir } from '../constants';

/**
 * One-time cleanup (#718): builds before #275 copied the bundled business-pack
 * extensions out to <userData>/extensions (the 'appdata' scan source) on every
 * launch. #275 switched to reading them in place from the asar via the
 * 'bundled' scan source but left the old copies on disk, so every launch the
 * loader found the stale copy first (writable sources win dedup), then
 * re-offered the entire asar set and logged one "Skipping duplicate extension"
 * warning per pack — and the stale copy kept shadowing the shipped pack, so
 * bundled updates never took effect for affected users.
 *
 * Removes ONLY real directories whose name matches a current bundled pack and
 * that carry an extension manifest (the exact shape initBundledExtensions()
 * used to write). Symlinks and unrelated user-installed extensions in the same
 * dir are left untouched.
 *
 * @returns true when nothing is left to clean (safe to persist the migration
 *          flag), false when a removal failed and the cleanup should retry on
 *          the next launch.
 */
export async function cleanupLegacyBundledExtensionCopies(): Promise<boolean> {
  // The pre-#275 copy-out was packaged-only; dev has nothing to clean and dev
  // extension setups stay untouched.
  if (!getPlatformServices().paths.isPackaged()) return true;

  const bundledRoot = getBundledExtensionsDir();
  const legacyRoot = getAppDataExtensionsDir();
  if (!bundledRoot || !existsSync(bundledRoot) || !existsSync(legacyRoot)) return true;

  let clean = true;
  try {
    const packs = await fs.readdir(bundledRoot, { withFileTypes: true });
    for (const pack of packs) {
      if (!pack.isDirectory()) continue;
      if (!existsSync(path.join(bundledRoot, pack.name, EXTENSION_MANIFEST_FILE))) continue;

      const staleCopy = path.join(legacyRoot, pack.name);
      if (!existsSync(path.join(staleCopy, EXTENSION_MANIFEST_FILE))) continue;
      const stat = await fs.lstat(staleCopy).catch((): undefined => undefined);
      if (!stat?.isDirectory()) continue; // skip symlinks and stray files

      try {
        await fs.rm(staleCopy, { recursive: true, force: true });
        console.log(`[Extensions] Removed stale pre-#275 bundled extension copy: ${staleCopy}`);
      } catch (error) {
        clean = false;
        console.warn(
          `[Extensions] Failed to remove stale bundled extension copy ${staleCopy}:`,
          error instanceof Error ? error.message : error
        );
      }
    }
  } catch (error) {
    clean = false;
    console.warn(
      '[Extensions] Failed to clean up legacy bundled extension copies:',
      error instanceof Error ? error.message : error
    );
  }
  return clean;
}
