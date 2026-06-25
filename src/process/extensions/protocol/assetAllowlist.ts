/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Allowlist enforcement for the `wayland-asset://` protocol.
 *
 * Without containment, the renderer (which can render untrusted LLM output)
 * could fetch arbitrary files via wayland-asset://asset//etc/passwd, SSH keys,
 * dotfiles, etc. This module defines the set of directories from which the
 * protocol may serve files and rejects any request that resolves outside
 * those roots (including symlink-escape attempts).
 *
 * Allowed roots match the producer sites of `toAssetUrl(...)`:
 *   - Every extension scan source (env / user / appData / bundled-in-asar),
 *     iterated from `getExtensionScanSources` so this list can never drift
 *     from where extensions are actually loaded.
 *   - The bundled hub resources directory (`<resources>/hub`).
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  EXTENSION_MANIFEST_FILE,
  getExtensionScanSources,
  getHubResourcesDir,
  getVoiceModelsDir,
} from '../constants';
import { isPathWithinDirectory } from '../sandbox/pathSafety';

/**
 * Compute the set of directory roots from which `wayland-asset://` may
 * serve files. Directories are resolved to absolute paths and deduplicated.
 *
 * NOTE: We do not cache the result - env-configured extension dirs
 * (`WAYLAND_EXTENSIONS_PATH`) can change between calls in tests, and the
 * computation is cheap.
 */
export function buildAssetAllowlist(): string[] {
  const roots: string[] = [];
  const seen = new Set<string>();

  const push = (dir: string | null | undefined) => {
    if (!dir) return;
    const resolved = path.resolve(dir);
    if (seen.has(resolved)) return;
    seen.add(resolved);
    roots.push(resolved);
  };

  // Iterate the same scan sources ExtensionLoader uses (env / user / appData /
  // bundled-in-asar) so the serving allowlist can never drift from where
  // extensions are actually loaded from. `push` resolves + dedupes; the
  // bundled source dir may be '' (no app path), which `push` skips.
  for (const { dir } of getExtensionScanSources()) push(dir);
  push(getHubResourcesDir());
  // Bundled voice STT model - the renderer's transformers.js worker fetches
  // the Whisper-tiny ONNX files through wayland-asset://.
  push(getVoiceModelsDir());

  // Expand: when an extension dir contains symlinked children (the dev-mount
  // pattern: `ln -s /path/to/repo ~/.wayland-dev/extensions/my-ext`), the
  // requested asset URL canonicalises to the symlink TARGET, which sits
  // outside the scan root after realpath resolution. Walk each scan root
  // and add the canonical target of any symlink whose target is a real
  // extension (contains an aion-extension.json). The manifest gate keeps
  // this narrow - random symlinks pointing at arbitrary dirs stay rejected.
  const scanRoots = [...roots];
  for (const root of scanRoots) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue; // root doesn't exist or unreadable
    }
    for (const entry of entries) {
      if (!entry.isSymbolicLink()) continue;
      try {
        const target = fs.realpathSync.native(path.join(root, entry.name));
        const targetStat = fs.statSync(target);
        if (!targetStat.isDirectory()) continue;
        // Only widen the allowlist when the symlinked target is itself a
        // valid extension. Prevents using symlinks-into-extensions-dir as a
        // generic escape hatch into arbitrary directories.
        if (!fs.existsSync(path.join(target, EXTENSION_MANIFEST_FILE))) continue;
        push(target);
      } catch {
        // broken symlink - ignore
      }
    }
  }

  return roots;
}

/**
 * Resolve `requestedPath` against the allowlist.
 *
 * Returns the absolute path when it is contained within at least one
 * allowed root, or `null` when the path is outside the allowlist (which
 * the caller must treat as a hard reject - 403/404 - and never serve).
 *
 * Containment is checked via `isPathWithinDirectory`, which canonicalises
 * symlinks before comparing, so symlink-escape attempts also return null.
 */
export function resolveAllowedAssetPath(requestedPath: string): string | null {
  if (!requestedPath) return null;
  const absolute = path.resolve(requestedPath);
  const allowlist = buildAssetAllowlist();
  for (const root of allowlist) {
    if (isPathWithinDirectory(absolute, root)) {
      return absolute;
    }
  }
  return null;
}
