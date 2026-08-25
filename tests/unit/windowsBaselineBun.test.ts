/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1017 - a win32-x64 machine WITHOUT AVX2 must get a bundled Bun.
 *
 * `shellEnv.getBundledBunDir()` already asks for `<platform>-x64-baseline` on any
 * x64 host whose CPU lacks AVX2 - the probe is not platform-gated. The staging
 * side was: `needsBaselineVariant` listed linux and darwin only, so no
 * `win32-x64-baseline` runtime was ever produced. `getBundledBunDir()` therefore
 * returned null on those machines and `resolveJsRuntime()` fell back to
 * `node.exe`, which ENOENTs on a box with no Node on PATH - the "Enabled but
 * exposes 0 tools" shape of #1008 on a different platform.
 *
 * Staging that directory is three coupled edits, all pinned here plus one in
 * `windowsSignExclusions.test.ts`:
 *   1. prepareBundledBun stages it,
 *   2. verify-packaged-resources REQUIRES it (its directory set is exact, so a
 *      newly staged dir that the gate does not expect fails the build), and
 *   3. electron-builder does not Authenticode-sign it (signing rewrites the
 *      bytes and breaks the pinned digest - asserted in windowsSignExclusions).
 *
 * Pure/fixture-driven, so it pins the behaviour on every host, not just win32.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import prepareBundledBun = require('../../scripts/prepareBundledBun.js');
import verifyPackagedResources = require('../../scripts/verify-packaged-resources.js');
import bundledBunShasums from '../../scripts/bundled-bun-shasums.json';
import bundledBunBinaries from '../../scripts/bundled-bun-binaries.json';

const BUN_VERSION = '1.3.14';

const helpers = prepareBundledBun as unknown as {
  needsBaselineVariant: (platform: string, arch: string) => boolean;
  getPlatformAsset: (platform: string, arch: string, variant?: string) => string | null;
};

const gate = verifyPackagedResources as unknown as {
  verifyBunBundle: (
    bundleDir: string,
    targetPlatform: string,
    targetArch: string,
    authority?: Record<string, unknown>
  ) => boolean;
};

/** Smallest byte sequence `inspectExecutable` reads as a win32-x64 PE image. */
function peExecutableBytes(): Buffer {
  const bytes = Buffer.alloc(256);
  bytes.write('MZ', 0, 'ascii');
  const peOffset = 0x80;
  bytes.writeUInt32LE(peOffset, 0x3c);
  bytes.write('PE\0\0', peOffset, 'ascii');
  bytes.writeUInt16LE(0x8664, peOffset + 4); // IMAGE_FILE_MACHINE_AMD64
  return bytes;
}

const PE_BYTES = peExecutableBytes();
const PE_BINARY = {
  size: PE_BYTES.length,
  sha256: crypto.createHash('sha256').update(PE_BYTES).digest('hex'),
};

/** Binary authority whose win32-x64 entries match the fixture bytes above. */
const TEST_BUN_AUTHORITY = {
  contract: 'wayland-bundled-bun-binaries/1.0',
  [BUN_VERSION]: {
    'bun-windows-x64.zip': PE_BINARY,
    'bun-windows-x64-baseline.zip': PE_BINARY,
  },
};

function stageWin32Runtime(bundleDir: string, variant: 'default' | 'baseline'): void {
  const baseline = variant === 'baseline';
  const runtimeDir = path.join(bundleDir, `win32-x64${baseline ? '-baseline' : ''}`);
  const asset = `bun-windows-x64${baseline ? '-baseline' : ''}.zip`;
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(path.join(runtimeDir, 'bun.exe'), PE_BYTES);
  fs.writeFileSync(
    path.join(runtimeDir, 'manifest.json'),
    JSON.stringify({
      platform: 'win32',
      arch: 'x64',
      variant,
      version: BUN_VERSION,
      sourceType: 'download',
      source: {
        asset,
        url: `https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/${asset}`,
        sha256: String(
          (bundledBunShasums as Record<string, Record<string, string>>)[BUN_VERSION][asset]
        ).replace(/^sha256:/, ''),
      },
      binary: { name: 'bun.exe', ...PE_BINARY },
      files: ['bun.exe'],
      skipped: false,
    })
  );
}

describe('#1017 win32-x64 baseline Bun', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  it('stages an AVX2-free baseline variant for win32-x64 (not only linux/darwin)', () => {
    expect(helpers.needsBaselineVariant('win32', 'x64')).toBe(true);
    // Bun publishes no win32-arm64 build at all, and arm64 has no AVX2 concept.
    expect(helpers.needsBaselineVariant('win32', 'arm64')).toBe(false);
    // The pre-existing targets must keep staging theirs.
    expect(helpers.needsBaselineVariant('linux', 'x64')).toBe(true);
    expect(helpers.needsBaselineVariant('darwin', 'x64')).toBe(true);
  });

  it('resolves the win32-x64 baseline to a real published, digest-pinned asset', () => {
    const asset = helpers.getPlatformAsset('win32', 'x64', 'baseline');
    expect(asset).toBe('bun-windows-x64-baseline.zip');
    const shas = (bundledBunShasums as Record<string, Record<string, string>>)[BUN_VERSION];
    const binaries = (bundledBunBinaries as Record<string, Record<string, { sha256: string }>>)[BUN_VERSION];
    expect(shas[asset!]).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(binaries[asset!]?.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('makes the packaged-resource gate REQUIRE the win32-x64 baseline runtime', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-win-bun-'));
    roots.push(root);

    // Known positive for the fixture itself: the default-only layout is exactly
    // what the gate accepted before #1017, so if this staging helper were broken
    // the "both" case below could not pass either.
    const defaultOnly = path.join(root, 'default-only');
    stageWin32Runtime(defaultOnly, 'default');
    expect(gate.verifyBunBundle(defaultOnly, 'win32', 'x64', TEST_BUN_AUTHORITY)).toBe(false);

    const both = path.join(root, 'both');
    stageWin32Runtime(both, 'default');
    stageWin32Runtime(both, 'baseline');
    expect(gate.verifyBunBundle(both, 'win32', 'x64', TEST_BUN_AUTHORITY)).toBe(true);
  });
});
