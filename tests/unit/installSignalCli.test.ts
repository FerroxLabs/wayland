import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { assertAllowedDownloadUrl, installSignalCli, pickAsset } from '../../scripts/install-signal-cli.mjs';

const roots: string[] = [];
const archiveBytes = Buffer.from('pinned-test-archive');
const binaryBytes = Buffer.alloc(64);
binaryBytes.set([0x7f, 0x45, 0x4c, 0x46], 0);
binaryBytes[5] = 1;
binaryBytes.writeUInt16LE(62, 18);
const digest = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');
const authority = {
  releaseTag: 'v9.9.9',
  releaseId: 99,
  platform: 'linux',
  arch: 'x64',
  assetId: 100,
  asset: 'signal-cli-9.9.9-Linux-native.tar.gz',
  url: 'https://github.com/AsamK/signal-cli/releases/download/v9.9.9/signal-cli-9.9.9-Linux-native.tar.gz',
  archiveSha256: digest(archiveBytes),
  binarySha256: digest(binaryBytes),
};

function payload(overrides: Record<string, unknown> = {}) {
  return {
    id: authority.releaseId,
    tag_name: authority.releaseTag,
    assets: [
      {
        id: authority.assetId,
        name: authority.asset,
        browser_download_url: authority.url,
        digest: `sha256:${authority.archiveSha256}`,
      },
    ],
    ...overrides,
  };
}

async function fixtureRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-signal-test-'));
  roots.push(root);
  return root;
}

function installOptions(runtimeRoot: string, overrides: Record<string, unknown> = {}) {
  return {
    platform: 'linux',
    arch: 'x64',
    runtimeRoot,
    authority,
    fetchImpl: async () => ({ ok: true, json: async () => payload() }),
    downloadFileImpl: async (_url: string, destination: string) => fs.writeFile(destination, archiveBytes),
    extractArchiveImpl: async (_archive: string, destination: string) => {
      await fs.mkdir(destination, { recursive: true });
      await fs.writeFile(path.join(destination, 'signal-cli'), binaryBytes, { mode: 0o755 });
    },
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('pinned Signal CLI installation', () => {
  it('pins the only proven upstream native release and both trusted digests', async () => {
    const pinned = JSON.parse(await fs.readFile(path.resolve('scripts/signal-cli-pinned-release.json'), 'utf8'));
    expect(pinned).toEqual({
      releaseTag: 'v0.14.6',
      releaseId: 352964308,
      platform: 'linux',
      arch: 'x64',
      assetId: 475170652,
      asset: 'signal-cli-0.14.6-Linux-native.tar.gz',
      url: 'https://github.com/AsamK/signal-cli/releases/download/v0.14.6/signal-cli-0.14.6-Linux-native.tar.gz',
      archiveSha256: 'c78639c2d3c14cd004872a99ecf129bd7d7c26ee7d9844d50c2b0afdafefea68',
      binarySha256: '0f9850154f51a0ef0ffcb7a52a38c8aa794ec92a4ab6f76210e726c544c01798',
    });
    const readme = await fs.readFile(path.resolve('src/process/channels/signal-cli-runtime/README.md'), 'utf8');
    expect(readme).toContain('install-signal-cli.mjs --platform linux --arch x64');
    expect(readme).toContain('exactly signal-cli **v0.14.6**');
    expect(readme).toContain('only for Linux x64');
    expect(readme).not.toContain('latest signal-cli release');
    expect(readme).not.toContain('falls back');
  });

  it('accepts the exact Linux-native asset without requiring an architecture token in its filename', () => {
    const exact = payload().assets[0];
    expect(pickAsset([exact], 'linux', 'x64', authority)).toEqual(exact);
    expect(pickAsset([exact], 'linux', 'arm64', authority)).toBeUndefined();
    expect(pickAsset([exact], 'darwin', 'x64', authority)).toBeUndefined();
  });

  it('rejects generic, client, schema, wrong-ID, and ambiguous assets', () => {
    const exact = payload().assets[0];
    const alternatives = [
      { ...exact, id: 200, name: 'signal-cli-9.9.9.tar.gz' },
      { ...exact, id: 201, name: 'signal-cli-9.9.9-Linux-client.tar.gz' },
      { ...exact, id: 202, name: 'signal-cli-9.9.9-json-schemas.tar.gz' },
    ];
    expect(pickAsset(alternatives, 'linux', 'x64', authority)).toBeUndefined();
    expect(pickAsset([{ ...exact, id: 101 }], 'linux', 'x64', authority)).toBeUndefined();
    expect(pickAsset([exact, exact], 'linux', 'x64', authority)).toBeUndefined();
  });

  it('permits only HTTPS GitHub release and asset hosts', () => {
    expect(assertAllowedDownloadUrl(authority.url)).toBe(authority.url);
    expect(
      assertAllowedDownloadUrl('https://release-assets.githubusercontent.com/github-production-release-asset/file')
    ).toContain('release-assets.githubusercontent.com');
    expect(() => assertAllowedDownloadUrl('http://github.com/AsamK/signal-cli')).toThrow(/Untrusted/);
    expect(() => assertAllowedDownloadUrl('https://attacker.example/signal-cli')).toThrow(/Untrusted/);
  });

  it('cleans and returns unavailable for unsupported targets without network access', async () => {
    const root = await fixtureRoot();
    await fs.mkdir(path.join(root, 'bin'), { recursive: true });
    await fs.writeFile(path.join(root, 'bin', 'stale'), 'stale');
    await fs.writeFile(path.join(root, 'README.md'), 'Signal runtime licensing and provenance');
    let fetched = false;
    const result = await installSignalCli(
      installOptions(root, {
        platform: 'darwin',
        arch: 'arm64',
        fetchImpl: async () => {
          fetched = true;
          throw new Error('must not fetch');
        },
      })
    );
    expect(result).toMatchObject({ available: false, platform: 'darwin', arch: 'arm64' });
    expect(fetched).toBe(false);
    expect(await fs.readdir(root)).toEqual(['README.md']);
  });

  it('publishes only the verified binary and provenance manifest', async () => {
    const root = await fixtureRoot();
    await fs.mkdir(path.join(root, 'bin'), { recursive: true });
    await fs.writeFile(path.join(root, 'bin', 'stale'), 'stale');
    await fs.writeFile(path.join(root, 'README.md'), 'Signal runtime licensing and provenance');

    const manifest = await installSignalCli(installOptions(root));
    expect((await fs.readdir(root)).toSorted()).toEqual(['README.md', 'bin']);
    expect((await fs.readdir(path.join(root, 'bin'))).toSorted()).toEqual(['manifest.json', 'signal-cli']);
    expect(Object.keys(manifest).toSorted()).toEqual([
      'arch',
      'binary',
      'contract',
      'platform',
      'releaseTag',
      'source',
      'verified',
      'versionOutput',
      'versionVerified',
    ]);
    expect(Object.keys(manifest.source).toSorted()).toEqual([
      'archiveSha256',
      'asset',
      'assetDigest',
      'assetId',
      'owner',
      'releaseId',
      'repository',
      'url',
    ]);
    expect(Object.keys(manifest.binary).toSorted()).toEqual(['name', 'sha256']);
    expect(manifest).toMatchObject({
      releaseTag: authority.releaseTag,
      verified: true,
      source: {
        owner: 'AsamK',
        repository: 'signal-cli',
        releaseId: authority.releaseId,
        assetId: authority.assetId,
        assetDigest: `sha256:${authority.archiveSha256}`,
      },
      binary: { sha256: `sha256:${authority.binarySha256}` },
    });
  });

  it.each([
    ['release identity mismatch', { fetchImpl: async () => ({ ok: true, json: async () => payload({ id: 98 }) }) }],
    [
      'archive digest mismatch',
      {
        fetchImpl: async () => ({
          ok: true,
          json: async () => payload({ assets: [{ ...payload().assets[0], digest: `sha256:${'0'.repeat(64)}` }] }),
        }),
      },
    ],
    ['binary digest mismatch', { authority: { ...authority, binarySha256: '0'.repeat(64) } }],
    [
      'unexpected archive layout',
      {
        extractArchiveImpl: async (_archive: string, destination: string) => {
          await fs.mkdir(destination, { recursive: true });
          await fs.writeFile(path.join(destination, 'signal-cli'), binaryBytes);
          await fs.writeFile(path.join(destination, 'extra'), 'debris');
        },
      },
    ],
  ])('cleans every stale or partial runtime after %s', async (_label, overrides) => {
    const root = await fixtureRoot();
    await fs.mkdir(path.join(root, 'bin'), { recursive: true });
    await fs.writeFile(path.join(root, 'bin', 'stale'), 'stale');
    await fs.mkdir(path.join(root, 'tmp-old'));

    await expect(installSignalCli(installOptions(root, overrides))).rejects.toThrow();
    expect(await fs.readdir(root)).toEqual([]);
  });
});
