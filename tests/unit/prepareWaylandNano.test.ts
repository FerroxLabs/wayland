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
      expect(() => prepareWaylandNano.normalizeSha256(bad, 'test pin')).toThrow(/Malformed or placeholder SHA-256/);
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
    // The shipped bytes are pinned to the digest recorded when the binary was
    // staged, and the staged bytes are either the pinned upstream bytes or a
    // macOS Developer ID signed derivative of them - never merely 'signed'.
    expect(verifier).toContain('actualBinarySha256 === manifestStagedSha256');
    expect(verifier).toContain('manifestStagedSha256 === expected.binarySha256 ||');
    // On darwin the fallback is not merely "signed by us": the signature's
    // identifier must embed the pinned upstream digest, so a different or
    // older binary we also signed cannot be substituted.
    expect(verifier).toContain('darwinSigningIdentifier(binaryName, expected.binarySha256)');
    expect(builder).toContain('resources/bundled-wayland-nano');
    expect(builder).toContain("'/Contents/Resources/bundled-wayland-nano/[^/]+/wayland-nano$'");
  });

  /**
   * THE THREE-FILE LOCKSTEP (#914).
   *
   * Re-pinning the bundled nano is not one edit, it is three that must agree:
   * DEFAULT_WNANO_VERSION in scripts/prepareWaylandNano.js, the tag block in
   * scripts/bundled-wnano-shasums.json, and the release entry in
   * scripts/supply-chain/publisher-attestations.json. A PARTIAL re-pin is worse
   * than none: prepare resolves the new tag, then either fails closed at download
   * time on a missing manifest entry, or - if only the attestation is stale -
   * ships bytes whose publisher provenance points at a different release.
   *
   * These assertions read the PINNED tag rather than a hardcoded one, so they
   * keep holding across future bumps instead of needing an edit each time.
   */
  it('pins a tag that carries complete provenance for every supported asset', () => {
    const tag = prepareWaylandNano.DEFAULT_WNANO_VERSION;
    const shasums = JSON.parse(fs.readFileSync(path.resolve('scripts/bundled-wnano-shasums.json'), 'utf8')) as Record<
      string,
      Record<string, { archiveSha256?: string; binarySha256?: string }>
    >;

    expect(Object.keys(shasums), `${tag} has no block in bundled-wnano-shasums.json`).toContain(tag);

    // Every runtime the bundle supports, resolved through getAssetName so a new
    // platform cannot be added without this test noticing it is unpinned.
    const runtimes: Array<[string, string]> = [
      ['darwin', 'arm64'],
      ['darwin', 'x64'],
      ['linux', 'arm64'],
      ['linux', 'x64'],
      ['win32', 'x64'],
    ];
    for (const [platform, arch] of runtimes) {
      const asset = prepareWaylandNano.getAssetName(platform, arch, tag);
      expect(asset, `${platform}-${arch} resolves to no asset name at ${tag}`).toBeTruthy();
      const pinned = prepareWaylandNano.loadExpectedProvenance(tag, asset as string, {
        requireBinary: true,
      });
      expect(pinned.archiveSha256, `${asset} archive pin`).toMatch(/^[0-9a-f]{64}$/);
      expect(pinned.binarySha256, `${asset} binary pin`).toMatch(/^[0-9a-f]{64}$/);
      // The archive and the executable inside it are different bytes. A copied
      // digest means someone filled the manifest by hand from one value.
      expect(pinned.binarySha256, `${asset} archive and binary pins are identical`).not.toBe(pinned.archiveSha256);
    }
  });

  it('carries an active publisher attestation for the pinned tag', () => {
    const tag = prepareWaylandNano.DEFAULT_WNANO_VERSION;
    const attestations = JSON.parse(
      fs.readFileSync(path.resolve('scripts/supply-chain/publisher-attestations.json'), 'utf8')
    ) as { policies: Array<Record<string, string>> };

    const entry = attestations.policies.find(
      (policy) => policy.repository === 'FerroxLabs/wayland-nano' && policy.releaseTag === tag
    );
    expect(entry, `no publisher attestation for wayland-nano ${tag}`).toBeTruthy();
    expect(entry?.status).toBe('active');
    expect(entry?.sourceRef).toBe(`refs/tags/${tag}`);
    // A tag-object sha is not a commit sha. The attestation must name the commit
    // the annotated tag resolves to, which is what the provenance predicate binds.
    expect(entry?.sourceDigest, `${tag} sourceDigest`).toMatch(/^[0-9a-f]{40}$/);
    expect(entry?.signerWorkflow).toContain('FerroxLabs/wayland-nano/.github/workflows/');
  });

  /**
   * Upstream signs the Windows nano binary itself as of wayland-nano v0.2.0
   * ("ci: Authenticode-sign the Windows nano binary before it is digested").
   * Authenticode signing REWRITES the file, so if electron-builder re-signed it
   * during packaging the shipped bytes would no longer match binarySha256 and the
   * packaged-resource check would fail closed. The negative signExts patterns are
   * therefore load-bearing for the pin, not an oversight - exactly as they already
   * are for wayland-core, which is signed by its own release workflow too.
   */
  it('leaves the upstream-signed windows binaries out of electron-builder signing', () => {
    const builder = fs.readFileSync(path.resolve('electron-builder.yml'), 'utf8');
    for (const excluded of [
      String.raw`'!\bundled-wayland-nano\win32-x64\wayland-nano.exe'`,
      String.raw`'!\bundled-wayland-nano\win32-arm64\wayland-nano.exe'`,
      String.raw`'!\bundled-wayland-core\win32-x64\wayland-core.exe'`,
    ]) {
      expect(builder, `signExts no longer excludes ${excluded}`).toContain(excluded);
    }
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
