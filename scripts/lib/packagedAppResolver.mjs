/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The one place that answers "which packaged app is this run about?".
 *
 * #1034: every caller used to carry its own copy of that answer, and the copies
 * disagreed. `packaged-cockpit-smoke.mjs` resolved `out-preview ?? out`, so a
 * missing preview package was silently smoked against the STABLE app and
 * reported PASS - a gate that neither fails nor tests what its name says, the
 * same shape as the SKIPPED required check that satisfied branch protection in
 * #1119. `packaged-launch.mjs` looked only in `out/` for a hardcoded `Wayland` /
 * `wayland`, which cannot find the preview launcher at all.
 *
 * Two rules follow, and both are asserted in tests/unit/scripts/packagedAppResolver.test.ts:
 *
 *  1. A requested track resolves ONLY that track's output directory. Absent
 *     means throw and name the directory; it never substitutes the other track.
 *  2. The launcher basename is derived from the shipped release identity, not
 *     from a candidate list. electron-builder writes `executableName` verbatim
 *     and both configs set it to the product name, so the preview launcher is
 *     `Wayland Preview` - with the space - on Linux and macOS alike.
 *
 * This file is plain ESM on purpose: scripts run under bare `node`, with no
 * build step, so it cannot import src/common/releaseTrack.ts. That leaves two
 * derivations of one launcher name, which is exactly how Build Matrix ended up
 * with an app called "Wayland Preview" and a gate looking for "wayland-preview".
 * `packagedAppResolver.test.ts` binds this one to the runtime's
 * `getPackagedExecutableName` for all six track/platform pairs so they cannot
 * drift apart unnoticed.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Mirrors `parseReleaseTrack` in src/common/releaseTrack.ts. */
export function parseReleaseTrack(value) {
  if (value === undefined || value === null || value === '' || value === 'stable') return 'stable';
  if (value === 'preview') return 'preview';
  throw new Error(`Unsupported Wayland release track: ${String(value)}`);
}

/** The electron-builder `directories.output` for a track (scripts/build-with-builder.js). */
export function outDirNameForTrack(track) {
  return parseReleaseTrack(track) === 'preview' ? 'out-preview' : 'out';
}

/** Mirrors `getPackagedReleaseIdentity(track).appName` in src/common/releaseTrack.ts. */
export function packagedAppName(track) {
  return parseReleaseTrack(track) === 'preview' ? 'Wayland Preview' : 'Wayland';
}

/** Mirrors `getPackagedExecutableName` in src/common/releaseTrack.ts. */
export function packagedExecutableName(track, platform) {
  const appName = packagedAppName(track);
  return platform === 'win32' ? `${appName}.exe` : appName;
}

/** The per-platform unpacked directories electron-builder may write into. */
function unpackedDirNames(platform) {
  if (platform === 'darwin') return ['mac-arm64', 'mac-x64', 'mac', 'mac-universal'];
  if (platform === 'win32') return ['win-unpacked', 'win-x64-unpacked', 'win-arm64-unpacked'];
  return ['linux-unpacked', 'linux-x64-unpacked', 'linux-arm64-unpacked'];
}

/**
 * Locate the launcher for `track` inside one electron-builder output root.
 * Returns `{ executablePath, cwd }`, or null when this root holds no such build.
 *
 * The executable basename is required to match the track exactly. A stable
 * launcher sitting in out-preview/ is a packaging defect, not a fallback.
 */
export function resolvePackagedApp(outRoot, options = {}) {
  const platform = options.platform ?? process.platform;
  const track = parseReleaseTrack(options.track ?? 'stable');
  if (!fs.existsSync(outRoot)) return null;
  const executableName = packagedExecutableName(track, platform);

  for (const dirName of unpackedDirNames(platform)) {
    const dir = path.join(outRoot, dirName);
    if (!fs.existsSync(dir)) continue;

    if (platform === 'darwin') {
      // Take the bundle whose MacOS/ holds THIS track's launcher, rather than
      // the first *.app found: a tree that packaged both tracks into one root
      // would otherwise hand back whichever readdir happened to list first.
      const bundles = fs.readdirSync(dir).filter((entry) => entry.endsWith('.app'));
      for (const bundle of bundles) {
        const executablePath = path.join(dir, bundle, 'Contents', 'MacOS', executableName);
        if (fs.existsSync(executablePath)) return { executablePath, cwd: dir };
      }
      continue;
    }

    const executablePath = path.join(dir, executableName);
    if (fs.existsSync(executablePath)) return { executablePath, cwd: dir };
  }

  return null;
}

/**
 * Resolve the packaged app for a requested track, or throw naming the directory
 * that should have held it. This is the entry point callers want: it is the
 * function that refuses to substitute one track for the other.
 *
 * `outDir` overrides WHERE to look but never WHICH launcher to accept, so
 * pointing a preview run at a stable output directory still fails.
 */
export function resolveTrackedPackagedApp(options) {
  const { projectRoot } = options;
  const platform = options.platform ?? process.platform;
  const track = parseReleaseTrack(options.track);
  const outRoot = options.outDir
    ? path.resolve(projectRoot, options.outDir)
    : path.join(projectRoot, outDirNameForTrack(track));

  const found = resolvePackagedApp(outRoot, { platform, track });
  if (!found) {
    throw new Error(
      `no packaged ${track} build under ${outRoot} ` +
        `(expected the launcher "${packagedExecutableName(track, platform)}" in ` +
        `${unpackedDirNames(platform)[0]}/). Build that track first, e.g.\n` +
        `        WAYLAND_RELEASE_TRACK=${track} node scripts/build-with-builder.js arm64 --mac --arm64 --pack-only`
    );
  }
  return { ...found, track, outRoot };
}
