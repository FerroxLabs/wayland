import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const prepareWaylandCore = require('../../scripts/prepareWaylandCore.js') as {
  (options?: Record<string, unknown>): unknown;
  BUNDLE_CONTRACT: string;
  BUNDLE_GENERATOR: string;
  DEFAULT_WCORE_VERSION: string;
  getAssetName(platform: string, arch: string, tag: string): string;
  loadExpectedProvenance(
    tag: string,
    asset: string,
    options?: { requireBinary?: boolean }
  ): { archiveSha256: string; binarySha256: string | null };
  normalizeExactReleaseTag(version: string): string;
  pruneRuntimeDirectory(dir: string, allowedNames: string[]): void;
};

const originalSkip = process.env.WCORE_SKIP;
const originalLegacySkip = process.env.WAYLAND_CORE_SKIP;

afterEach(() => {
  if (originalSkip === undefined) delete process.env.WCORE_SKIP;
  else process.env.WCORE_SKIP = originalSkip;
  if (originalLegacySkip === undefined) delete process.env.WAYLAND_CORE_SKIP;
  else process.env.WAYLAND_CORE_SKIP = originalLegacySkip;
});

describe('strict bundled wayland-core provenance', () => {
  it('pins independent archive and extracted-binary hashes for all six current release targets', () => {
    const manifest = JSON.parse(fs.readFileSync(path.resolve('scripts/bundled-wcore-shasums.json'), 'utf8'));
    const current = manifest[prepareWaylandCore.DEFAULT_WCORE_VERSION];
    expect(Object.keys(current)).toHaveLength(6);
    for (const proof of Object.values(current) as Array<Record<string, string>>) {
      expect(proof.archiveSha256).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(proof.binarySha256).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(proof.binarySha256).not.toBe(proof.archiveSha256);
    }
  });

  it('resolves both independent pins for every supported package target', () => {
    for (const platform of ['darwin', 'linux', 'win32']) {
      for (const arch of ['arm64', 'x64']) {
        const asset = prepareWaylandCore.getAssetName(platform, arch, prepareWaylandCore.DEFAULT_WCORE_VERSION);
        const proof = prepareWaylandCore.loadExpectedProvenance(prepareWaylandCore.DEFAULT_WCORE_VERSION, asset, {
          requireBinary: true,
        });
        expect(proof.archiveSha256).toMatch(/^[0-9a-f]{64}$/);
        expect(proof.binarySha256).toMatch(/^[0-9a-f]{64}$/);
      }
    }
  });

  it('rejects an archive-only historical pin as authority for a strict package', () => {
    const asset = prepareWaylandCore.getAssetName('darwin', 'arm64', 'v0.12.24');
    expect(() => prepareWaylandCore.loadExpectedProvenance('v0.12.24', asset, { requireBinary: true })).toThrow(
      /independently pinned extracted-binary/
    );
  });

  it('rejects skip flags when strict preparation is requested', () => {
    process.env.WCORE_SKIP = '1';
    expect(() =>
      prepareWaylandCore({
        platform: 'darwin',
        arch: 'arm64',
        version: prepareWaylandCore.DEFAULT_WCORE_VERSION,
        requireVerified: true,
      })
    ).toThrow(/cannot honor WCORE_SKIP/);
  });

  it('rejects a moving latest tag when strict preparation is requested', () => {
    delete process.env.WCORE_SKIP;
    delete process.env.WAYLAND_CORE_SKIP;
    expect(() =>
      prepareWaylandCore({ platform: 'darwin', arch: 'arm64', version: 'latest', requireVerified: true })
    ).toThrow(/exact pinned release tag/);
  });

  it('rejects release-tag command injection before constructing a download command', () => {
    expect(() => prepareWaylandCore.normalizeExactReleaseTag("v0.12.25'; Start-Process calc; '")).toThrow(
      /exact vMAJOR\.MINOR\.PATCH/
    );
  });

  it('prunes stale files and fallback executables from a selected runtime directory', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-wcore-prune-'));
    try {
      fs.writeFileSync(path.join(root, 'wayland-core'), 'pinned');
      fs.writeFileSync(path.join(root, 'wcore'), 'stale-fallback');
      fs.writeFileSync(path.join(root, 'manifest.json'), 'stale-receipt');
      fs.mkdirSync(path.join(root, 'helpers'));
      fs.writeFileSync(path.join(root, 'helpers', 'runner'), 'stale-helper');

      prepareWaylandCore.pruneRuntimeDirectory(root, ['wayland-core']);

      expect(fs.readdirSync(root)).toEqual(['wayland-core']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects cross-contaminating multi-target package invocations before building', () => {
    for (const args of [
      ['arm64', '--all'],
      ['arm64', '--mac', '--linux'],
      ['arm64', 'x64', '--mac'],
      ['arm64', '--mac', '--windows'],
      ['arm64', '--mac', '--linux=AppImage'],
      ['arm64', '--mac', '--x64=true'],
      ['arm64', '--mac', 'dmg:x64'],
      ['arm64', '--mac', '--universal'],
    ]) {
      const result = spawnSync(process.execPath, ['scripts/build-with-builder.js', ...args], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(
        /(One exact (platform|architecture)|Non-canonical (platform|architecture)|Unsupported package architecture)/
      );
    }
  });

  it('makes the package command and post-package verifier declare strict target authority directly', () => {
    const build = fs.readFileSync(path.resolve('scripts/build-with-builder.js'), 'utf8');
    const builder = fs.readFileSync(path.resolve('electron-builder.yml'), 'utf8');
    const verifier = fs.readFileSync(path.resolve('scripts/verify-packaged-resources.js'), 'utf8');
    expect(build).toContain('requireVerified: true');
    expect(build).toContain('version: prepareWaylandCore.DEFAULT_WCORE_VERSION');
    expect(build).toContain('--wcore-runtime');
    expect(verifier).toContain("kind: 'wcore-bundle'");
    expect(verifier).toContain("['download', 'verified-cache'].includes(metadata.sourceType)");
    expect(verifier).toContain('actualBinarySha256 === expected.binarySha256');
    expect(builder).toContain("'/Contents/Resources/bundled-wayland-core/[^/]+/wayland-core$'");
  });

  it('keeps the bundle receipt contract and future bump tooling bound to binary pins', () => {
    const bump = fs.readFileSync(path.resolve('scripts/stage-wcore-bump.mjs'), 'utf8');
    expect(prepareWaylandCore.BUNDLE_CONTRACT).toBe('wayland-core-bundle/1.0');
    expect(prepareWaylandCore.BUNDLE_GENERATOR).toBe('prepareWaylandCore/2');
    expect(bump).toContain('binarySha256');
    expect(bump).toContain('archive digest drift');
    expect(bump).toContain('did not contain wayland-core executable');
  });
});
