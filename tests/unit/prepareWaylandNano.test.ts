import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const prepareWaylandNano = require('../../scripts/prepareWaylandNano.js') as {
  (options?: Record<string, unknown>): unknown;
  BUNDLE_CONTRACT: string;
  BUNDLE_GENERATOR: string;
  DEFAULT_WNANO_VERSION: string;
  getAssetName(platform: string, arch: string, tag: string): string | null;
  loadExpectedProvenance(
    tag: string,
    asset: string,
    options?: { requireBinary?: boolean }
  ): { archiveSha256: string; binarySha256: string | null };
  normalizeExactReleaseTag(version: string): string;
  normalizeSha256(raw: unknown, label: string): string;
  pruneRuntimeDirectory(dir: string, allowedNames: string[]): void;
};

const originalSkip = process.env.WNANO_SKIP;
const originalLegacySkip = process.env.WAYLAND_NANO_SKIP;

afterEach(() => {
  if (originalSkip === undefined) delete process.env.WNANO_SKIP;
  else process.env.WNANO_SKIP = originalSkip;
  if (originalLegacySkip === undefined) delete process.env.WAYLAND_NANO_SKIP;
  else process.env.WAYLAND_NANO_SKIP = originalLegacySkip;
});

const SUPPORTED_TARGETS: Array<[string, string]> = [
  ['darwin', 'arm64'],
  ['darwin', 'x64'],
  ['linux', 'arm64'],
  ['linux', 'x64'],
  ['win32', 'x64'],
];

describe('strict bundled wayland-nano provenance', () => {
  it('names the five supported release assets after the unprefixed version and runtime key', () => {
    for (const [platform, arch] of SUPPORTED_TARGETS) {
      expect(prepareWaylandNano.getAssetName(platform, arch, 'v0.1.0')).toBe(
        `wayland-nano-0.1.0-${platform}-${arch}.zip`
      );
    }
    // The release workflow publishes no Windows ARM64 target.
    expect(prepareWaylandNano.getAssetName('win32', 'arm64', 'v0.1.0')).toBeNull();
  });

  it('fails closed on the unfilled shasums skeleton (fill-on-release state)', () => {
    // The first FerroxLabs/wayland-nano release assets land after this
    // integration; until the manifest carries real pins every provenance
    // lookup must throw - never skip verification.
    expect(() =>
      prepareWaylandNano.loadExpectedProvenance('v0.1.0', 'wayland-nano-0.1.0-darwin-arm64.zip', {
        requireBinary: true,
      })
    ).toThrow(/No SHA-256 entries/);
  });

  it('pins independent archive and extracted-binary hashes for any future tag entries', () => {
    // Schema guard for the fill-on-release commit: once real tag entries are
    // added they must cover exactly the five supported assets, keyed by the
    // getAssetName contract, with both independent pins.
    const manifest = JSON.parse(fs.readFileSync(path.resolve('scripts/bundled-wnano-shasums.json'), 'utf8'));
    for (const tag of Object.keys(manifest).filter((key) => !key.startsWith('_'))) {
      const expectedAssets = SUPPORTED_TARGETS.map(([platform, arch]) =>
        prepareWaylandNano.getAssetName(platform, arch, tag)
      ).toSorted();
      expect(Object.keys(manifest[tag]).toSorted()).toEqual(expectedAssets);
      for (const proof of Object.values(manifest[tag]) as Array<Record<string, string>>) {
        expect(proof.archiveSha256).toMatch(/^sha256:[0-9a-f]{64}$/);
        expect(proof.binarySha256).toMatch(/^sha256:[0-9a-f]{64}$/);
        expect(proof.binarySha256).not.toBe(proof.archiveSha256);
      }
    }
  });

  it('rejects placeholder or malformed pin values', () => {
    // normalizeSha256 is the choke point every provenance lookup passes
    // through. It must fail closed on a placeholder or a near-miss digest,
    // never a loose match.
    //
    // This used to be driven through the manifest's _fillOnReleaseExample
    // skeleton, which was removed when the real v0.1.1 pins landed. The
    // invariant is unchanged and is now asserted against the guard itself,
    // which is stricter: it covers near-miss shapes the skeleton never had.
    for (const bad of [
      'sha256:PENDING-fill-from-release-shasums-asset',
      'PENDING-hash-of-extracted-verified-binary',
      'sha256:not-a-hex-digest',
      `sha256:${'a'.repeat(63)}`,
      `sha256:${'a'.repeat(65)}`,
      `sha256:${'g'.repeat(64)}`,
      '',
      undefined,
    ]) {
      expect(() => prepareWaylandNano.normalizeSha256(bad, 'test pin')).toThrow(
        /Malformed or placeholder SHA-256/
      );
    }

    // Known positive: without it the rejections above would prove nothing.
    expect(prepareWaylandNano.normalizeSha256(`sha256:${'a'.repeat(64)}`, 'test pin')).toBe('a'.repeat(64));
  });

  it('rejects skip flags when strict preparation is requested', () => {
    process.env.WNANO_SKIP = '1';
    expect(() =>
      prepareWaylandNano({
        platform: 'darwin',
        arch: 'arm64',
        version: 'v0.1.0',
        requireVerified: true,
      })
    ).toThrow(/cannot honor WNANO_SKIP/);
  });

  it('rejects a moving latest tag when strict preparation is requested', () => {
    delete process.env.WNANO_SKIP;
    delete process.env.WAYLAND_NANO_SKIP;
    expect(() =>
      prepareWaylandNano({ platform: 'darwin', arch: 'arm64', version: 'latest', requireVerified: true })
    ).toThrow(/exact pinned release tag/);
  });

  it('rejects release-tag command injection before constructing a download command', () => {
    expect(() => prepareWaylandNano.normalizeExactReleaseTag("v0.1.0'; Start-Process calc; '")).toThrow(
      /exact vMAJOR\.MINOR\.PATCH/
    );
  });

  it('accepts exact release tags, including prerelease tags', () => {
    expect(prepareWaylandNano.normalizeExactReleaseTag('0.1.0')).toBe('v0.1.0');
    expect(prepareWaylandNano.normalizeExactReleaseTag('v0.1.0-alpha.0')).toBe('v0.1.0-alpha.0');
  });

  it('prunes stale files and fallback executables from a selected runtime directory', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-wnano-prune-'));
    try {
      fs.writeFileSync(path.join(root, 'wayland-nano'), 'pinned');
      fs.writeFileSync(path.join(root, 'wnano'), 'stale-fallback');
      fs.writeFileSync(path.join(root, 'manifest.json'), 'stale-receipt');
      fs.mkdirSync(path.join(root, 'helpers'));
      fs.writeFileSync(path.join(root, 'helpers', 'runner'), 'stale-helper');

      prepareWaylandNano.pruneRuntimeDirectory(root, ['wayland-nano']);

      expect(fs.readdirSync(root)).toEqual(['wayland-nano']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('makes the package command and post-package verifier declare strict wnano target authority directly', () => {
    const build = fs.readFileSync(path.resolve('scripts/build-with-builder.js'), 'utf8');
    const builder = fs.readFileSync(path.resolve('electron-builder.yml'), 'utf8');
    const verifier = fs.readFileSync(path.resolve('scripts/verify-packaged-resources.js'), 'utf8');
    expect(build).toContain('requireVerified: true');
    expect(build).toContain('version: prepareWaylandNano.DEFAULT_WNANO_VERSION');
    expect(build).toContain('--wnano-runtime');
    expect(verifier).toContain("kind: 'wnano-bundle'");
    expect(verifier).toContain("['download', 'verified-cache'].includes(metadata.sourceType)");
    expect(verifier).toContain('actualBinarySha256 === expected.binarySha256');
    expect(builder).toContain('resources/bundled-wayland-nano');
    expect(builder).toContain("'/Contents/Resources/bundled-wayland-nano/[^/]+/wayland-nano$'");
  });

  it('keeps the bundle receipt contract bound to binary pins and publisher attestation', () => {
    const prepare = fs.readFileSync(path.resolve('scripts/prepareWaylandNano.js'), 'utf8');
    expect(prepareWaylandNano.BUNDLE_CONTRACT).toBe('wayland-nano-bundle/1.0');
    expect(prepareWaylandNano.BUNDLE_GENERATOR).toBe('prepareWaylandNano/1');
    expect(prepare).toContain('verifyPublisherAttestation({');
    expect(prepare).toContain('publisherAttestation: publisherAttestation || null');
    expect(prepare).toContain('lacks archive-bound publisher');
  });
});
