import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import prepareBundledBun = require('../../scripts/prepareBundledBun.js');

function getRequiredRuntimeFileName(): string {
  return process.platform === 'win32' ? 'bun.exe' : 'bun';
}

describe('prepareBundledBun', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const runtimeKey = `${process.platform}-${process.arch}`;
  const targetDir = path.join(projectRoot, 'resources', 'bundled-bun', runtimeKey);
  const baselineTargetDir = path.join(projectRoot, 'resources', 'bundled-bun', `${runtimeKey}-baseline`);

  const originalCacheDir = process.env.WAYLAND_BUN_CACHE_DIR;
  const originalVersion = process.env.WAYLAND_BUN_VERSION;

  let tempRoot: string | null = null;
  let targetBackupDir: string | null = null;
  let baselineBackupDir: string | null = null;
  let targetExisted = false;
  let baselineExisted = false;

  afterEach(() => {
    process.env.WAYLAND_BUN_CACHE_DIR = originalCacheDir;
    process.env.WAYLAND_BUN_VERSION = originalVersion;

    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    if (fs.existsSync(baselineTargetDir)) {
      fs.rmSync(baselineTargetDir, { recursive: true, force: true });
    }

    if (targetExisted && targetBackupDir && fs.existsSync(targetBackupDir)) {
      fs.mkdirSync(path.dirname(targetDir), { recursive: true });
      fs.cpSync(targetBackupDir, targetDir, { recursive: true });
    }
    if (baselineExisted && baselineBackupDir && fs.existsSync(baselineBackupDir)) {
      fs.mkdirSync(path.dirname(baselineTargetDir), { recursive: true });
      fs.cpSync(baselineBackupDir, baselineTargetDir, { recursive: true });
    }

    if (targetBackupDir && fs.existsSync(targetBackupDir)) {
      fs.rmSync(targetBackupDir, { recursive: true, force: true });
    }
    if (baselineBackupDir && fs.existsSync(baselineBackupDir)) {
      fs.rmSync(baselineBackupDir, { recursive: true, force: true });
    }

    if (tempRoot && fs.existsSync(tempRoot)) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }

    tempRoot = null;
    targetBackupDir = null;
    baselineBackupDir = null;
    targetExisted = false;
    baselineExisted = false;
  });

  function setupCacheAndBackup(version: string) {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-bun-test-'));

    targetExisted = fs.existsSync(targetDir);
    if (targetExisted) {
      targetBackupDir = path.join(tempRoot, 'target-backup');
      fs.cpSync(targetDir, targetBackupDir, { recursive: true });
    }
    baselineExisted = fs.existsSync(baselineTargetDir);
    if (baselineExisted) {
      baselineBackupDir = path.join(tempRoot, 'baseline-backup');
      fs.cpSync(baselineTargetDir, baselineBackupDir, { recursive: true });
    }

    const cacheRoot = path.join(tempRoot, 'cache-root');
    const runtimeFileName = getRequiredRuntimeFileName();

    function seedCache(dirKey: string, variant: string) {
      const cacheDir = path.join(cacheRoot, version, dirKey);
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(path.join(cacheDir, runtimeFileName), 'fake-bun-binary', 'utf8');
      fs.writeFileSync(
        path.join(cacheDir, 'runtime-meta.json'),
        JSON.stringify({
          platform: process.platform,
          arch: process.arch,
          version,
          variant,
          sourceType: 'download',
          source: { url: `https://example.com/bun-${variant}.zip`, asset: `bun-test-${variant}.zip` },
          updatedAt: new Date().toISOString(),
        }),
        'utf8'
      );
    }

    seedCache(runtimeKey, 'default');
    if (process.platform === 'linux' && process.arch === 'x64') {
      seedCache(`${runtimeKey}-baseline`, 'baseline');
    }

    process.env.WAYLAND_BUN_CACHE_DIR = cacheRoot;
    process.env.WAYLAND_BUN_VERSION = version;
    return { cacheRoot, runtimeFileName };
  }

  it('copies bundled bun from cache when cache metadata is valid', () => {
    const version = 'test-cache-version';
    const { runtimeFileName } = setupCacheAndBackup(version);

    const result = prepareBundledBun();

    expect(result.prepared).toBe(true);
    expect(result.sourceType).toBe('cache');

    const targetRuntimePath = path.join(targetDir, runtimeFileName);
    const manifestPath = path.join(targetDir, 'manifest.json');

    expect(fs.existsSync(targetRuntimePath)).toBe(true);
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      sourceType: string;
      variant?: string;
      skipped?: boolean;
      files: string[];
      cacheDir: string;
      cacheMeta?: { sourceType: string };
    };

    expect(manifest.sourceType).toBe('cache');
    expect(manifest.skipped).not.toBe(true);
    expect(manifest.files).toContain(runtimeFileName);
    expect(manifest.cacheMeta?.sourceType).toBe('download');
  });

  it('prepares baseline variant for x64 platforms', () => {
    if (process.platform !== 'linux' || process.arch !== 'x64') return;

    const version = 'test-baseline-version';
    const { runtimeFileName } = setupCacheAndBackup(version);

    prepareBundledBun();

    const baselineManifestPath = path.join(baselineTargetDir, 'manifest.json');
    expect(fs.existsSync(baselineManifestPath)).toBe(true);
    expect(fs.existsSync(path.join(baselineTargetDir, runtimeFileName))).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(baselineManifestPath, 'utf8')) as {
      variant: string;
      skipped?: boolean;
      files: string[];
    };

    expect(manifest.variant).toBe('baseline');
    expect(manifest.skipped).not.toBe(true);
    expect(manifest.files).toContain(runtimeFileName);
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
