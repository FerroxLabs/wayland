import { createHash } from 'node:crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import prepareBundledBun = require('../../scripts/prepareBundledBun.js');

function getRequiredRuntimeFileName(): string {
  return process.platform === 'win32' ? 'bun.exe' : 'bun';
}

describe('prepareBundledBun cache authority', () => {
  const roots: string[] = [];
  const helpers = prepareBundledBun as unknown as {
    isCachedRuntimeValid: (
      root: string,
      platform: string,
      arch: string,
      version: string,
      variant: string,
      authority: Record<string, unknown>
    ) => boolean;
    resolveBundledBunTarget: (options?: { platform?: string; arch?: string }) => { platform: string; arch: string };
  };

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  it('accepts an exactly pinned cache and rejects same-size binary tampering', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-bun-cache-'));
    roots.push(root);
    const binaryName = getRequiredRuntimeFileName();
    const bytes = Buffer.from('authoritative-bun');
    const binary = {
      name: binaryName,
      size: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
    const authority = {
      asset: 'bun-test.zip',
      url: 'https://example.test/bun-test.zip',
      archiveSha256: 'a'.repeat(64),
      binary,
    };
    fs.writeFileSync(path.join(root, binaryName), bytes);
    fs.writeFileSync(
      path.join(root, 'runtime-meta.json'),
      JSON.stringify({
        platform: process.platform,
        arch: process.arch,
        version: 'test',
        variant: 'default',
        sourceType: 'download',
        source: { asset: authority.asset, url: authority.url, sha256: authority.archiveSha256 },
        binary,
      })
    );

    expect(helpers.isCachedRuntimeValid(root, process.platform, process.arch, 'test', 'default', authority)).toBe(true);
    const tampered = Buffer.from(bytes);
    tampered[0] ^= 1;
    fs.writeFileSync(path.join(root, binaryName), tampered);
    expect(helpers.isCachedRuntimeValid(root, process.platform, process.arch, 'test', 'default', authority)).toBe(
      false
    );
  });

  it('uses an explicit cross-package platform and architecture instead of the build host', () => {
    expect(helpers.resolveBundledBunTarget({ platform: 'win32', arch: 'x64' })).toEqual({
      platform: 'win32',
      arch: 'x64',
    });
    expect(helpers.resolveBundledBunTarget({ platform: 'linux', arch: 'arm64' })).toEqual({
      platform: 'linux',
      arch: 'arm64',
    });
  });
});

// #438: the AVX2-free baseline bun must be staged for macOS Intel, not only
// linux-x64 — otherwise non-AVX2 Intel Macs get no usable bun and every
// npx-based local MCP server dies with -32000. Pure-logic, no download.
describe('needsBaselineVariant (#438 — darwin-x64 baseline staging)', () => {
  const needsBaselineVariant = (
    prepareBundledBun as unknown as {
      needsBaselineVariant: (platform: string, arch: string) => boolean;
    }
  ).needsBaselineVariant;
  const getPlatformAsset = (
    prepareBundledBun as unknown as {
      getPlatformAsset: (platform: string, arch: string, variant?: string) => string | null;
    }
  ).getPlatformAsset;

  it('stages a baseline variant for x64 on both linux and macOS (darwin), but never for arm64', () => {
    expect(needsBaselineVariant('linux', 'x64')).toBe(true);
    expect(needsBaselineVariant('darwin', 'x64')).toBe(true);
    expect(needsBaselineVariant('darwin', 'arm64')).toBe(false);
    expect(needsBaselineVariant('linux', 'arm64')).toBe(false);
  });

  it('resolves the darwin-x64 baseline to a real published asset name', () => {
    expect(getPlatformAsset('darwin', 'x64', 'baseline')).toBe('bun-darwin-x64-baseline.zip');
    expect(getPlatformAsset('darwin', 'x64')).toBe('bun-darwin-x64.zip');
  });
});
