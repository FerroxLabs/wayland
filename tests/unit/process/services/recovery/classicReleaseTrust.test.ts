/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CLASSIC_RECOVERY_RELEASE,
  CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256,
  classicRecoveryCatalogSha256,
  classicRecoveryArtifactFor,
  downloadArtifactBytesAgainstDescriptor,
  downloadClassicRecoveryReleaseArtifact,
  parseClassicRecoveryReleaseCatalog,
  verifyArtifactBytesAgainstDescriptor,
  verifyClassicRecoveryReleaseArtifact,
} from '@process/services/recovery/classicReleaseTrust';

const roots: string[] = [];
const sha256 = (value: Buffer | string): string => createHash('sha256').update(value).digest('hex');

function temporaryRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-classic-release-trust-'));
  roots.push(root);
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('Classic v0.11.8 compiled release catalog', () => {
  it('pins one exact artifact for every supported platform and architecture', () => {
    expect(CLASSIC_RECOVERY_RELEASE).toMatchObject({
      contract: 'wayland-classic-recovery-release/1.0',
      repository: 'FerroxLabs/wayland',
      releaseId: 346809341,
      tag: 'v0.11.8',
      tagCommit: '74b37efb1a1f624ec86b66fb3465025cb1a9fd22',
      version: '0.11.8',
      publishedAt: '2026-06-30T12:24:04Z',
    });
    expect(CLASSIC_RECOVERY_RELEASE.artifacts).toHaveLength(6);
    expect(classicRecoveryCatalogSha256(CLASSIC_RECOVERY_RELEASE)).toBe(CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256);
    expect(CLASSIC_RECOVERY_RELEASE.artifacts.map(({ platform, arch }) => `${platform}/${arch}`).toSorted()).toEqual([
      'darwin/arm64',
      'darwin/x64',
      'linux/arm64',
      'linux/x64',
      'win32/arm64',
      'win32/x64',
    ]);
    expect(classicRecoveryArtifactFor('darwin', 'arm64')).toMatchObject({
      assetId: 462135783,
      name: 'Wayland-0.11.8-mac-arm64.zip',
      sha256: '0df4e95a6dc3e3c36fb35e2c4a580e7c2de22f101aa4ad258149b5306881b9c8',
      launchableArtifact: false,
      executable: {
        size: 53312,
        sha256: '43b0d619c8e0e8ff9739a00d4203fe91316ab7fabdd80d496043d0f05f8e75ab',
      },
      publisher: { kind: 'macos-developer-id', teamId: 'PX6SP9GPWJ' },
    });
    expect(classicRecoveryArtifactFor('linux', 'x64')).toMatchObject({
      assetId: 462135787,
      name: 'Wayland-0.11.8-linux-x86_64.AppImage',
      sha256: '1c4289969fdefdb37ae5df564e9861c1e61ed8425b5b1c3a009c92fd37082159',
      launchableArtifact: true,
      publisherGate: 'github-release-digest-only',
      executable: {
        source: 'artifact',
        sha256: '1c4289969fdefdb37ae5df564e9861c1e61ed8425b5b1c3a009c92fd37082159',
      },
      publisher: { kind: 'none', identity: null },
    });
  });

  it('rejects catalog identity drift, missing targets, and duplicate identities', () => {
    const drifted = structuredClone(CLASSIC_RECOVERY_RELEASE) as unknown as Record<string, unknown>;
    drifted.releaseId = 1;
    expect(() => parseClassicRecoveryReleaseCatalog(drifted)).toThrow('identity does not match');

    const missing = structuredClone(CLASSIC_RECOVERY_RELEASE) as unknown as { artifacts: unknown[] };
    missing.artifacts.pop();
    expect(() => parseClassicRecoveryReleaseCatalog(missing)).toThrow('exactly six');

    const duplicate = structuredClone(CLASSIC_RECOVERY_RELEASE) as unknown as {
      artifacts: Array<Record<string, unknown>>;
    };
    duplicate.artifacts[5].platform = duplicate.artifacts[4].platform;
    duplicate.artifacts[5].arch = duplicate.artifacts[4].arch;
    expect(() => parseClassicRecoveryReleaseCatalog(duplicate)).toThrow('duplicate artifact identity');
  });
});

describe('Classic release artifact byte verification', () => {
  it('accepts only exact regular-file bytes and returns the observed identity', async () => {
    const root = temporaryRoot();
    const artifact = path.join(root, 'asset.bin');
    const bytes = Buffer.from('exact-classic-release-asset');
    fs.writeFileSync(artifact, bytes);

    await expect(
      verifyArtifactBytesAgainstDescriptor(artifact, { size: bytes.length, sha256: sha256(bytes) })
    ).resolves.toEqual({ size: bytes.length, sha256: sha256(bytes) });
    await expect(
      verifyArtifactBytesAgainstDescriptor(artifact, { size: bytes.length + 1, sha256: sha256(bytes) })
    ).rejects.toThrow('size does not match');
    await expect(
      verifyArtifactBytesAgainstDescriptor(artifact, { size: bytes.length, sha256: sha256('wrong') })
    ).rejects.toThrow('does not match its SHA-256 pin');
  });

  it('refuses symbolic links before applying a compiled release decision', async () => {
    const root = temporaryRoot();
    const target = path.join(root, 'target');
    const alias = path.join(root, 'alias');
    fs.writeFileSync(target, 'not-the-real-large-asset');
    fs.symlinkSync(target, alias);
    await expect(
      verifyClassicRecoveryReleaseArtifact({ artifactPath: alias, platform: 'darwin', arch: 'arm64' })
    ).rejects.toThrow('regular non-symbolic-link file');
  });
});

describe('Classic release artifact download transport', () => {
  it('streams exact allowlisted bytes to an exclusive destination', async () => {
    const root = temporaryRoot();
    const destinationPath = path.join(root, 'asset.partial');
    const bytes = Buffer.from('exact-downloaded-release-asset');
    const fetcher = async (): Promise<Response> =>
      new Response(bytes, { status: 200, headers: { 'content-length': String(bytes.length) } });

    await expect(
      downloadArtifactBytesAgainstDescriptor({
        url: 'https://github.com/FerroxLabs/wayland/releases/download/v0.11.8/test.bin',
        destinationPath,
        descriptor: { size: bytes.length, sha256: sha256(bytes) },
        fetch: fetcher as typeof fetch,
        expectedInitialPath: '/FerroxLabs/wayland/releases/download/v0.11.8/test.bin',
      })
    ).resolves.toEqual({ size: bytes.length, sha256: sha256(bytes) });
    expect(fs.readFileSync(destinationPath)).toEqual(bytes);
  });

  it('requests only the compiled platform asset and leaves no artifact after transport mismatch', async () => {
    const root = temporaryRoot();
    const requests: string[] = [];
    const fetcher = async (input: string | URL | Request): Promise<Response> => {
      requests.push(String(input));
      return new Response('wrong', { status: 200, headers: { 'content-length': '5' } });
    };

    await expect(
      downloadClassicRecoveryReleaseArtifact(
        { destinationDirectory: root, platform: 'darwin', arch: 'arm64' },
        { fetch: fetcher as typeof fetch }
      )
    ).rejects.toThrow('Content-Length does not match its compiled pin');
    expect(requests).toEqual([
      'https://github.com/FerroxLabs/wayland/releases/download/v0.11.8/Wayland-0.11.8-mac-arm64.zip',
    ]);
    expect(fs.readdirSync(root)).toEqual([]);
  });

  it('removes partial bytes after oversized, mismatched, or hostile redirect responses', async () => {
    const root = temporaryRoot();
    const destinationPath = path.join(root, 'asset.partial');
    const descriptor = { size: 4, sha256: sha256('good') };
    const oversized = async (): Promise<Response> => new Response('oversized', { status: 200 });

    await expect(
      downloadArtifactBytesAgainstDescriptor({
        url: 'https://github.com/FerroxLabs/wayland/releases/download/v0.11.8/test.bin',
        destinationPath,
        descriptor,
        fetch: oversized as typeof fetch,
      })
    ).rejects.toThrow('exceeded its compiled size pin');
    expect(fs.existsSync(destinationPath)).toBe(false);

    const hostileRedirect = async (): Promise<Response> =>
      new Response(null, { status: 302, headers: { location: 'https://example.com/stolen.bin' } });
    await expect(
      downloadArtifactBytesAgainstDescriptor({
        url: 'https://github.com/FerroxLabs/wayland/releases/download/v0.11.8/test.bin',
        destinationPath,
        descriptor,
        fetch: hostileRedirect as typeof fetch,
      })
    ).rejects.toThrow('escaped the HTTPS GitHub release allowlist');
    expect(fs.existsSync(destinationPath)).toBe(false);
  });
});
