/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { getPackagedExecutableName } from '@/common/releaseTrack';

/**
 * #1034 - the one place that answers "which packaged app is this run about?".
 *
 * Every caller used to carry its own copy of that answer, and each copy was
 * wrong in a different way: the cockpit smoke fell back from `out-preview` to
 * `out` (certifying stable while claiming preview), and `packaged-launch.mjs`
 * only ever tried the candidate names `wayland` and `Wayland`, which cannot
 * find the preview launcher now that electron-builder writes `Wayland Preview`
 * verbatim - with the space. Both now resolve through this module.
 *
 * `tests/e2e/fixtures.ts` still carries a fourth copy, deliberately left alone:
 * it reads `out/` and nothing else, so it cannot substitute one track for the
 * other - the defect there is the missing preview capability, not a false pass -
 * and it sits outside both this suite and `tsc --noEmit`'s include, so a change
 * to it could not be verified here. Tracked on #1034.
 *
 * Platform is injected rather than read from `process.platform`, so the mac,
 * Windows and Linux layouts are all asserted on every shard instead of only on
 * the shard that happens to run there.
 */
const require_ = createRequire(__filename);
const RESOLVER = require_.resolve('../../../scripts/lib/packagedAppResolver.mjs');

type Resolver = {
  outDirNameForTrack: (track: string) => string;
  packagedExecutableName: (track: string, platform: string) => string;
  parseReleaseTrack: (value: unknown) => string;
  resolvePackagedApp: (
    outRoot: string,
    options?: { platform?: string; track?: string | null }
  ) => { executablePath: string; cwd: string } | null;
  resolveTrackedPackagedApp: (options: {
    projectRoot: string;
    track?: string | null;
    outDir?: string | null;
    platform?: string;
  }) => { executablePath: string; cwd: string; track: string; outRoot: string };
};

const load = async (): Promise<Resolver> => (await import(RESOLVER)) as unknown as Resolver;

const roots: string[] = [];
afterEach(() => {
  while (roots.length) fs.rmSync(roots.pop()!, { recursive: true, force: true });
});

function makeRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-resolver-'));
  roots.push(root);
  return root;
}

function plant(root: string, outDirName: string, platform: string, product: string): string {
  let dir: string;
  let file: string;
  if (platform === 'darwin') {
    dir = path.join(root, outDirName, 'mac-arm64', `${product}.app`, 'Contents', 'MacOS');
    file = product;
  } else if (platform === 'win32') {
    dir = path.join(root, outDirName, 'win-unpacked');
    file = `${product}.exe`;
  } else {
    dir = path.join(root, outDirName, 'linux-unpacked');
    file = product;
  }
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, file);
  fs.writeFileSync(target, '');
  return target;
}

describe('#1034 packaged app resolver', () => {
  it.each([
    ['stable', 'out'],
    ['preview', 'out-preview'],
  ])('maps the %s track to %s', async (track, expected) => {
    const { outDirNameForTrack } = await load();
    expect(outDirNameForTrack(track)).toBe(expected);
  });

  // Two independent derivations of one launcher name is exactly how Build
  // Matrix ended up with an app called "Wayland Preview" and a gate looking for
  // "wayland-preview". Bind this one to the runtime's.
  it.each([
    ['stable', 'darwin'],
    ['stable', 'win32'],
    ['stable', 'linux'],
    ['preview', 'darwin'],
    ['preview', 'win32'],
    ['preview', 'linux'],
  ] as const)('derives the %s %s launcher name from the shipped release identity', async (track, platform) => {
    const { packagedExecutableName } = await load();
    expect(packagedExecutableName(track, platform)).toBe(getPackagedExecutableName(track, platform));
  });

  it.each(['darwin', 'win32', 'linux'])('finds the preview launcher with its space on %s', async (platform) => {
    const { resolvePackagedApp } = await load();
    const root = makeRoot();
    const planted = plant(root, 'out-preview', platform, 'Wayland Preview');
    const found = resolvePackagedApp(path.join(root, 'out-preview'), { platform, track: 'preview' });
    expect(found?.executablePath).toBe(planted);
  });

  it.each(['darwin', 'win32', 'linux'])('finds the stable launcher on %s', async (platform) => {
    const { resolvePackagedApp } = await load();
    const root = makeRoot();
    const planted = plant(root, 'out', platform, 'Wayland');
    const found = resolvePackagedApp(path.join(root, 'out'), { platform, track: 'stable' });
    expect(found?.executablePath).toBe(planted);
  });

  it('never substitutes the stable build for a requested preview build', async () => {
    const { resolveTrackedPackagedApp } = await load();
    const root = makeRoot();
    plant(root, 'out', 'linux', 'Wayland');
    expect(() => resolveTrackedPackagedApp({ projectRoot: root, track: 'preview', platform: 'linux' })).toThrow(
      /out-preview/
    );
  });

  it('resolves the requested preview build when it is present', async () => {
    const { resolveTrackedPackagedApp } = await load();
    const root = makeRoot();
    plant(root, 'out', 'linux', 'Wayland');
    const planted = plant(root, 'out-preview', 'linux', 'Wayland Preview');
    const resolved = resolveTrackedPackagedApp({ projectRoot: root, track: 'preview', platform: 'linux' });
    expect(resolved.executablePath).toBe(planted);
    expect(resolved.track).toBe('preview');
  });

  it('rejects a track that is neither stable nor preview', async () => {
    const { parseReleaseTrack } = await load();
    expect(() => parseReleaseTrack('nightly')).toThrow(/nightly/);
  });
});
