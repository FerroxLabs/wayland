/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { resolveBundledWorkflowsDir } from '@process/services/cron/BuiltinRoutinesSeeder';

/**
 * Packaged-layout regression for the routine seeder's resource resolution.
 *
 * `routines.json` ships through electron-builder `extraResources`, i.e. BESIDE
 * `app.asar` at `<Resources>/bundled-workflows/routines.json` — never inside the
 * asar and never under `app.asar.unpacked`. The seeder's original candidate list
 * was anchored only on `__filename`, walking two levels up from `out/main`, so in
 * a real install every candidate missed and the loop fell through to
 * `<Resources>/app.asar.unpacked/resources/bundled-workflows` — the exact path in
 * the win-arm64 smoke log:
 *
 *   [BuiltinRoutines] No routines found at
 *     ...\app.asar.unpacked\resources\bundled-workflows\routines.json; skipping seed
 *
 * Result: ZERO routines seeded in any packaged build, including the
 * `weekday-morning-report` demo routine. The dev layout always worked, so the
 * existing seeder suite (which reads the source tree) could never catch it —
 * these tests deliberately simulate the packaged layouts instead.
 */

const tmpRoots: string[] = [];

function tmpRoot(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'wl-routines-paths-'));
  tmpRoots.push(dir);
  return dir;
}

/** Create `<dir>/routines.json` (and its parents) so `existsSync` sees a real hit. */
function plantRoutines(dir: string): string {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'routines.json'), '[]', 'utf-8');
  return dir;
}

afterAll(() => {
  // Best-effort: these are small fixtures under the OS temp dir.
  for (const root of tmpRoots) {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Ignore cleanup failures; temp dirs are reaped by the OS.
    }
  }
});

describe('resolveBundledWorkflowsDir - packaged layouts', () => {
  it('finds extraResources from the packaged main process (resourcesPath available)', () => {
    const resources = tmpRoot();
    const real = plantRoutines(path.join(resources, 'bundled-workflows'));
    // The main bundle lives INSIDE app.asar: <Resources>/app.asar/out/main.
    const bundleDir = path.join(resources, 'app.asar', 'out', 'main');

    expect(resolveBundledWorkflowsDir(bundleDir, resources)).toBe(real);
  });

  it('finds extraResources from a packaged subprocess (resourcesPath undefined)', () => {
    const resources = tmpRoot();
    const real = plantRoutines(path.join(resources, 'bundled-workflows'));
    const bundleDir = path.join(resources, 'app.asar', 'out', 'main');

    expect(resolveBundledWorkflowsDir(bundleDir, undefined)).toBe(real);
  });

  it('never falls back to the app.asar.unpacked/resources path that shipped empty', () => {
    const resources = tmpRoot();
    plantRoutines(path.join(resources, 'bundled-workflows'));
    const bundleDir = path.join(resources, 'app.asar', 'out', 'main');
    const shippedBugPath = path.join(resources, 'app.asar.unpacked', 'resources', 'bundled-workflows');

    expect(resolveBundledWorkflowsDir(bundleDir, resources)).not.toBe(shippedBugPath);
    expect(resolveBundledWorkflowsDir(bundleDir, undefined)).not.toBe(shippedBugPath);
  });

  it('collapses the electron-vite chunks subdir before resolving', () => {
    const resources = tmpRoot();
    const real = plantRoutines(path.join(resources, 'bundled-workflows'));
    const bundleDir = path.join(resources, 'app.asar', 'out', 'main', 'chunks');

    expect(resolveBundledWorkflowsDir(bundleDir, undefined)).toBe(real);
  });

  it('still resolves the dev source tree, even when resourcesPath points elsewhere', () => {
    // Dev: `process.resourcesPath` is Electron's OWN Resources dir, which has no
    // bundled-workflows — the probe must fall through it to the source tree.
    const root = tmpRoot();
    const real = plantRoutines(path.join(root, 'repo', 'src', 'process', 'resources', 'bundled-workflows'));
    const bundleDir = path.join(root, 'repo', 'out', 'main');
    const electronResources = path.join(root, 'electron-dist', 'Resources');
    mkdirSync(electronResources, { recursive: true });

    expect(resolveBundledWorkflowsDir(bundleDir, electronResources)).toBe(real);
  });

  it('still resolves the legacy standalone layout beside the bundle', () => {
    const root = tmpRoot();
    const real = plantRoutines(path.join(root, 'payload', 'src', 'process', 'resources', 'bundled-workflows'));
    const bundleDir = path.join(root, 'payload', 'dist-server');

    expect(resolveBundledWorkflowsDir(bundleDir, undefined)).toBe(real);
  });
});
