/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * #1034 - the preview cockpit smoke must never certify the stable build.
 *
 * `scripts/packaged-cockpit-smoke.mjs` resolved its target as
 * `out-preview` ?? `out`. When a preview package was missing the run silently
 * smoked the STABLE app and reported PASS, so a broken preview build could be
 * certified by a run that never touched it. That is the same shape as #1119,
 * where a SKIPPED required check satisfied branch protection: a gate that does
 * not fail, and does not test what its name says.
 *
 * These are behavioural, not structural: the real script is executed as a
 * subprocess against a fixture project root, so the assertion is what the gate
 * DOES, not what its source looks like.
 */
const SCRIPT = path.resolve(__dirname, '../../../scripts/packaged-cockpit-smoke.mjs');
const roots: string[] = [];

afterEach(() => {
  while (roots.length) fs.rmSync(roots.pop()!, { recursive: true, force: true });
});

function makeRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-smoke-track-'));
  roots.push(root);
  return root;
}

/**
 * Lay down a launchable stand-in for a packaged build of `track` under
 * `<root>/<outDirName>`, using the same directory layout electron-builder
 * produces on this platform and the executable name it writes verbatim.
 *
 * The stub exits immediately, so if the script ever launches it the CDP wait
 * expires quickly and names itself in the output - which is exactly how the
 * silent fallback becomes visible.
 */
function plantPackagedApp(root: string, outDirName: string, track: 'stable' | 'preview'): void {
  const product = track === 'preview' ? 'Wayland Preview' : 'Wayland';
  let dir: string;
  let file: string;
  if (process.platform === 'darwin') {
    dir = path.join(root, outDirName, 'mac-arm64', `${product}.app`, 'Contents', 'MacOS');
    file = product;
  } else if (process.platform === 'win32') {
    dir = path.join(root, outDirName, 'win-unpacked');
    file = `${product}.exe`;
  } else {
    dir = path.join(root, outDirName, 'linux-unpacked');
    file = product;
  }
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, file);
  // A no-op launcher. On win32 a .exe stub cannot be spawned, but every
  // assertion below is about the app NEVER being launched, so it is only ever
  // resolved - not executed - once the fix is in.
  fs.writeFileSync(target, process.platform === 'win32' ? '' : '#!/bin/sh\nexit 0\n');
  fs.chmodSync(target, 0o755);
}

function runSmoke(root: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: root,
    encoding: 'utf-8',
    env: { ...process.env, ...env },
    timeout: 90_000,
  });
  return { ...result, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

describe('#1034 packaged cockpit smoke release track', () => {
  it('fails and names out-preview when the preview track is requested and no preview build exists', () => {
    const root = makeRoot();
    plantPackagedApp(root, 'out', 'stable');

    const { status, output } = runSmoke(root, [
      '--release-track',
      'preview',
      '--no-chat',
      '--no-surfaces',
      '--timeout',
      '1500',
    ]);

    expect(status).not.toBe(0);
    expect(output).toContain('out-preview');
    // The whole point: it must not have reached the stable app at all.
    expect(output).not.toContain('CDP endpoint never came up');
  }, 120_000);

  it('fails and names out-preview when WAYLAND_RELEASE_TRACK=preview and only the stable build exists', () => {
    const root = makeRoot();
    plantPackagedApp(root, 'out', 'stable');

    const { status, output } = runSmoke(root, ['--no-chat', '--no-surfaces', '--timeout', '1500'], {
      WAYLAND_RELEASE_TRACK: 'preview',
    });

    expect(status).not.toBe(0);
    expect(output).toContain('out-preview');
    expect(output).not.toContain('CDP endpoint never came up');
  }, 120_000);

  it('rejects an unknown release track instead of quietly treating it as stable', () => {
    const root = makeRoot();
    plantPackagedApp(root, 'out', 'stable');

    const { status, output } = runSmoke(root, ['--release-track', 'nightly', '--no-chat', '--timeout', '1500']);

    expect(status).not.toBe(0);
    expect(output).toContain('nightly');
    expect(output).not.toContain('CDP endpoint never came up');
  }, 120_000);
});
