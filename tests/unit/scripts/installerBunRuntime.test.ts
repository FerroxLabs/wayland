/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';

import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error - the publishable installer helper is plain ESM.
import {
  detectLinuxLibc,
  downloadPinnedBunArchive,
  extractArchive,
  inspectArchive,
  installPinnedBun,
  selectBunAsset,
  validateArchiveEntryModes,
  validateArchiveEntryNames,
  validateBunRedirectUrl,
  validateBunReleaseUrl,
} from '../../../installer/scripts/bun-runtime.mjs';

type InstallerAsset = {
  filename: string;
  sha256: string;
};

type InstallerManifest = {
  version: string;
  assets: Record<string, InstallerAsset>;
};

type RootManifest = Record<string, Record<string, string>>;

const ROOT = join(__dirname, '..', '..', '..');
const CLI_SOURCE = readFileSync(join(ROOT, 'installer', 'bin', 'wayland.mjs'), 'utf8');
const PREPARE_SOURCE = readFileSync(join(ROOT, 'scripts', 'prepareBundledBun.js'), 'utf8');
const INSTALLER_MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'installer', 'scripts', 'bun-runtime-manifest.json'), 'utf8')
) as InstallerManifest;
const ROOT_MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'scripts', 'bundled-bun-shasums.json'), 'utf8')
) as RootManifest;
const OFFICIAL_MUSL_ASSETS = {
  'linux-arm64-musl': {
    filename: 'bun-linux-aarch64-musl.zip',
    sha256: 'b98e0ad3625c5c00d1d5b5ff55605c7adddbfae151861e68ade57b2d3b8703bb',
  },
  'linux-x64-musl': {
    filename: 'bun-linux-x64-musl-baseline.zip',
    sha256: '56a7d6806cf155536c0178f0ea5fbd098e684fa509ebdb4fc0a7e19fb65382dc',
  },
} satisfies Record<string, InstallerAsset>;

const temporaryRoots: string[] = [];

function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryRoots.push(directory);
  return directory;
}

async function createRuntimeZip(
  root = 'bun-linux-x64-baseline',
  executable = '#!/bin/sh\necho 1.3.14\n'
): Promise<Buffer> {
  const zip = new JSZip();
  zip.folder(root);
  zip.file(`${root}/bun`, executable, {
    unixPermissions: 0o100755,
  });
  return zip.generateAsync({
    type: 'nodebuffer',
    platform: 'UNIX',
    compression: 'DEFLATE',
  });
}

type FakeResponse = {
  status: number;
  headers?: Record<string, string>;
  body?: Buffer;
};

function fakeHttpsGet(responses: FakeResponse[]) {
  return vi.fn(
    (
      _url: URL,
      _options: Record<string, unknown>,
      callback: (response: PassThrough & { statusCode: number; headers: Record<string, string> }) => void
    ) => {
      const request = new EventEmitter() as EventEmitter & {
        setTimeout: (timeout: number, handler: () => void) => void;
        destroy: (error: Error) => void;
      };
      request.setTimeout = vi.fn();
      request.destroy = (error: Error) => request.emit('error', error);

      const next = responses.shift();
      if (!next) throw new Error('fake response queue exhausted');
      queueMicrotask(() => {
        const response = Object.assign(new PassThrough(), {
          statusCode: next.status,
          headers: next.headers ?? {},
        });
        callback(response);
        response.end(next.body);
      });
      return request;
    }
  );
}

afterEach(() => {
  for (const directory of temporaryRoots.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('headless installer Bun runtime supply chain', () => {
  it('does not execute a remote install script through a shell', () => {
    expect(CLI_SOURCE).not.toMatch(/curl\b[\s\S]*\|\s*(?:ba)?sh\b/);
    expect(CLI_SOURCE).not.toContain("spawnSync('bash', ['-c'");
    expect(CLI_SOURCE).toContain('installPinnedBun');
  });

  it('keeps every packaged runtime checksum aligned with the authoritative Bun manifest', () => {
    const pin = PREPARE_SOURCE.match(/const PINNED_BUN_VERSION = '([^']+)';/)?.[1];
    expect(pin).toBe(INSTALLER_MANIFEST.version);
    const authoritative = {
      ...ROOT_MANIFEST[INSTALLER_MANIFEST.version],
      ...Object.fromEntries(
        Object.values(OFFICIAL_MUSL_ASSETS).map((asset) => [asset.filename, `sha256:${asset.sha256}`])
      ),
    };
    expect(authoritative).toBeTruthy();

    for (const asset of Object.values(INSTALLER_MANIFEST.assets)) {
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(`sha256:${asset.sha256}`).toBe(authoritative[asset.filename]);
    }
    for (const [runtimeKey, asset] of Object.entries(OFFICIAL_MUSL_ASSETS)) {
      expect(INSTALLER_MANIFEST.assets[runtimeKey]).toEqual(asset);
    }
  });

  it('detects Linux libc from Node reports and ignores missing reports off Linux', () => {
    expect(detectLinuxLibc('darwin', undefined)).toBeNull();
    expect(detectLinuxLibc('linux', { header: { glibcVersionRuntime: '2.39' } })).toBe('glibc');
    expect(
      detectLinuxLibc('linux', {
        header: {},
        sharedObjects: ['/lib/ld-musl-x86_64.so.1'],
      })
    ).toBe('musl');
    expect(() => detectLinuxLibc('linux', null)).toThrow(/detect.*libc/i);
    expect(() => detectLinuxLibc('linux', { header: {} })).toThrow(/detect.*libc/i);
    expect(() =>
      detectLinuxLibc('linux', {
        header: {},
        sharedObjects: ['/lib/ld-uclibc.so.0'],
      })
    ).toThrow(/detect.*libc/i);
    expect(() =>
      detectLinuxLibc('linux', {
        header: {},
        sharedObjects: '/lib/ld-musl-x86_64.so.1',
      })
    ).toThrow(/detect.*libc/i);
    expect(() =>
      detectLinuxLibc('linux', {
        header: {},
        sharedObjects: [null],
      })
    ).toThrow(/detect.*libc/i);
    expect(() =>
      detectLinuxLibc('linux', {
        sharedObjects: ['/lib/ld-musl-x86_64.so.1'],
      })
    ).toThrow(/detect.*libc/i);
    expect(() => detectLinuxLibc('linux', { header: { glibcVersionRuntime: '' } })).toThrow(/detect.*libc/i);
    expect(() => detectLinuxLibc('linux', { header: { glibcVersionRuntime: 239 } })).toThrow(/detect.*libc/i);
  });

  it('selects only pinned supported platform assets', () => {
    expect(selectBunAsset('linux', 'x64', INSTALLER_MANIFEST, 'glibc')).toEqual(INSTALLER_MANIFEST.assets['linux-x64']);
    expect(selectBunAsset('linux', 'x64', INSTALLER_MANIFEST)).toEqual(INSTALLER_MANIFEST.assets['linux-x64']);
    expect(selectBunAsset('linux', 'arm64', INSTALLER_MANIFEST, 'glibc')).toEqual(
      INSTALLER_MANIFEST.assets['linux-arm64']
    );
    expect(selectBunAsset('linux', 'x64', INSTALLER_MANIFEST, 'musl')).toEqual(
      INSTALLER_MANIFEST.assets['linux-x64-musl']
    );
    expect(selectBunAsset('linux', 'arm64', INSTALLER_MANIFEST, 'musl')).toEqual(
      INSTALLER_MANIFEST.assets['linux-arm64-musl']
    );
    expect(selectBunAsset('darwin', 'arm64', INSTALLER_MANIFEST)).toEqual(INSTALLER_MANIFEST.assets['darwin-arm64']);
    expect(selectBunAsset('darwin', 'x64', INSTALLER_MANIFEST)).toEqual(INSTALLER_MANIFEST.assets['darwin-x64']);
    expect(() => selectBunAsset('win32', 'x64', INSTALLER_MANIFEST)).toThrow(/unsupported platform/i);
    expect(() => selectBunAsset('linux', 'x64', INSTALLER_MANIFEST, 'uclibc')).toThrow(/libc/i);

    const swapped = structuredClone(INSTALLER_MANIFEST);
    [swapped.assets['linux-x64'], swapped.assets['darwin-x64']] = [
      swapped.assets['darwin-x64'],
      swapped.assets['linux-x64'],
    ];
    expect(() => selectBunAsset('linux', 'x64', swapped)).toThrow(/canonical asset/i);
  });

  it('allows only HTTPS GitHub release download and redirect hosts', () => {
    expect(() =>
      validateBunReleaseUrl(
        'https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64.zip',
        '1.3.14',
        'bun-linux-x64.zip'
      )
    ).not.toThrow();
    expect(() =>
      validateBunRedirectUrl('https://release-assets.githubusercontent.com/github-production-release-asset/file')
    ).not.toThrow();

    expect(() =>
      validateBunReleaseUrl('http://github.com/oven-sh/bun/releases/file.zip', '1.3.14', 'bun-linux-x64.zip')
    ).toThrow(/HTTPS/i);
    expect(() =>
      validateBunReleaseUrl('https://github.com.evil.example/file.zip', '1.3.14', 'bun-linux-x64.zip')
    ).toThrow(/host/i);
    expect(() => validateBunReleaseUrl('https://user:pass@github.com/file.zip', '1.3.14', 'bun-linux-x64.zip')).toThrow(
      /credentials/i
    );
    expect(() => validateBunReleaseUrl('https://github.com:444/file.zip', '1.3.14', 'bun-linux-x64.zip')).toThrow(
      /port/i
    );
    expect(() =>
      validateBunReleaseUrl('https://github.com/other/repo/releases/file.zip', '1.3.14', 'bun-linux-x64.zip')
    ).toThrow(/canonical/i);
    expect(() => validateBunRedirectUrl('https://objects.githubusercontent.com/file.zip')).toThrow(/redirect host/i);
  });

  it('rejects zip-slip names and entries outside the one expected runtime directory', () => {
    const root = 'bun-linux-x64-baseline';
    expect(() => validateArchiveEntryNames([`${root}/`, `${root}/bun`], root)).not.toThrow();

    for (const malicious of [
      '../outside',
      `${root}/../../outside`,
      '/absolute/path',
      'C:/absolute/path',
      `${root}\\..\\outside`,
      `sibling/bun`,
    ]) {
      expect(() => validateArchiveEntryNames([`${root}/bun`, malicious], root)).toThrow();
    }
  });

  it('rejects symlinks and requires metadata for every archive entry', () => {
    const names = ['bun-linux-x64-baseline/', 'bun-linux-x64-baseline/bun'];
    const safeMetadata = [
      'drwxr-xr-x  3.0 unx        0 bx stor 24-Jan-01 00:00 bun-linux-x64-baseline/',
      '-rwxr-xr-x  3.0 unx 99999999 bx defN 24-Jan-01 00:00 bun-linux-x64-baseline/bun',
    ].join('\n');
    expect(() => validateArchiveEntryModes(safeMetadata, names)).not.toThrow();

    const symlinkMetadata = safeMetadata.replace('-rwxr-xr-x  3.0', 'lrwxrwxrwx  3.0');
    expect(() => validateArchiveEntryModes(symlinkMetadata, names)).toThrow(/symlink/i);
    expect(() => validateArchiveEntryModes(safeMetadata.split('\n')[0], names)).toThrow(/metadata/i);

    const oversizedMetadata = safeMetadata.replace('99999999', '400000000');
    expect(() => validateArchiveEntryModes(oversizedMetadata, names)).toThrow(/expanded size/i);
  });

  it('follows one trusted redirect and rejects untrusted, truncated, or oversized downloads', async () => {
    const directory = temporaryDirectory('wayland-bun-download-');
    const destination = join(directory, 'bun.zip');
    const body = Buffer.from('trusted archive');
    const getImpl = fakeHttpsGet([
      {
        status: 302,
        headers: {
          location: 'https://release-assets.githubusercontent.com/github-production-release-asset/file',
        },
      },
      {
        status: 200,
        headers: { 'content-length': String(body.length) },
        body,
      },
    ]);

    await downloadPinnedBunArchive({
      version: '1.3.14',
      filename: 'bun-linux-x64-baseline.zip',
      destination,
      getImpl,
    });
    expect(readFileSync(destination)).toEqual(body);
    expect(getImpl).toHaveBeenCalledTimes(2);

    const untrustedDestination = join(directory, 'untrusted.zip');
    const untrustedGet = fakeHttpsGet([{ status: 302, headers: { location: 'https://evil.example/bun.zip' } }]);
    await expect(
      downloadPinnedBunArchive({
        version: '1.3.14',
        filename: 'bun-linux-x64-baseline.zip',
        destination: untrustedDestination,
        getImpl: untrustedGet,
      })
    ).rejects.toThrow(/redirect host/i);
    expect(untrustedGet).toHaveBeenCalledTimes(1);

    const truncatedDestination = join(directory, 'truncated.zip');
    await expect(
      downloadPinnedBunArchive({
        version: '1.3.14',
        filename: 'bun-linux-x64-baseline.zip',
        destination: truncatedDestination,
        getImpl: fakeHttpsGet([{ status: 200, headers: { 'content-length': '8' }, body: Buffer.from('short') }]),
      })
    ).rejects.toThrow(/truncated/i);

    const oversizedDestination = join(directory, 'oversized.zip');
    await expect(
      downloadPinnedBunArchive({
        version: '1.3.14',
        filename: 'bun-linux-x64-baseline.zip',
        destination: oversizedDestination,
        maxArchiveBytes: 2,
        getImpl: fakeHttpsGet([{ status: 200, headers: { 'content-length': '3' }, body: Buffer.from('big') }]),
      })
    ).rejects.toThrow(/size/i);
  });

  it('inspects and extracts a real zip fixture with bounded regular entries', async () => {
    const directory = temporaryDirectory('wayland-bun-zip-');
    const archive = join(directory, 'bun-linux-x64-baseline.zip');
    const extraction = join(directory, 'out');
    writeFileSync(archive, await createRuntimeZip());

    inspectArchive(archive, 'bun-linux-x64-baseline');
    extractArchive(archive, extraction, 'bun-linux-x64-baseline');
    expect(readFileSync(join(extraction, 'bun-linux-x64-baseline', 'bun'), 'utf8')).toContain('1.3.14');
  });

  it('checks the archive hash before inspection or extraction', async () => {
    const root = temporaryDirectory('wayland-bun-mismatch-');
    const homeDirectory = join(root, 'home');
    const archive = await createRuntimeZip();
    const inspect = vi.fn();
    const extract = vi.fn();

    await expect(
      installPinnedBun(
        {
          platform: 'linux',
          arch: 'x64',
          libc: 'glibc',
          homeDirectory,
          temporaryDirectory: join(root, 'tmp'),
          manifest: {
            ...INSTALLER_MANIFEST,
            assets: {
              ...INSTALLER_MANIFEST.assets,
              'linux-x64': {
                ...INSTALLER_MANIFEST.assets['linux-x64'],
                sha256: '0'.repeat(64),
              },
            },
          },
        },
        {
          downloadPinnedBunArchive: async ({ destination }: { destination: string }) => {
            mkdirSync(join(root, 'tmp'), { recursive: true });
            writeFileSync(destination, archive);
          },
          inspectArchive: inspect,
          extractArchive: extract,
        }
      )
    ).rejects.toThrow(/checksum mismatch/i);
    expect(inspect).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });

  it('installs from a verified fixture through exclusive staging and cleans every temporary path', async () => {
    const root = temporaryDirectory('wayland-bun-install-');
    const homeDirectory = join(root, 'home');
    const temporaryParent = join(root, 'tmp');
    mkdirSync(temporaryParent);
    const archive = await createRuntimeZip();
    const sha256 = (await import('node:crypto')).createHash('sha256').update(archive).digest('hex');
    const verify = vi.fn();

    const destination = await installPinnedBun(
      {
        platform: 'linux',
        arch: 'x64',
        libc: 'glibc',
        homeDirectory,
        temporaryDirectory: temporaryParent,
        manifest: {
          ...INSTALLER_MANIFEST,
          assets: {
            ...INSTALLER_MANIFEST.assets,
            'linux-x64': {
              ...INSTALLER_MANIFEST.assets['linux-x64'],
              sha256,
            },
          },
        },
      },
      {
        downloadPinnedBunArchive: async ({ destination: archivePath }: { destination: string }) => {
          writeFileSync(archivePath, archive);
        },
        verifyPinnedBunBinary: verify,
      }
    );

    expect(readFileSync(destination, 'utf8')).toContain('1.3.14');
    expect(verify).toHaveBeenCalledTimes(1);
    expect(readdirSync(join(homeDirectory, '.bun', 'bin'))).toEqual(['bun']);
    expect(readdirSync(temporaryParent)).toEqual([]);
  });

  it('fails before publishing on version-check errors and preserves a prior destination', async () => {
    const root = temporaryDirectory('wayland-bun-atomic-');
    const homeDirectory = join(root, 'home');
    const temporaryParent = join(root, 'tmp');
    const binDirectory = join(homeDirectory, '.bun', 'bin');
    mkdirSync(temporaryParent);
    mkdirSync(binDirectory, { recursive: true });
    const destination = join(binDirectory, 'bun');
    writeFileSync(destination, 'prior runtime');
    const archive = await createRuntimeZip();
    const sha256 = (await import('node:crypto')).createHash('sha256').update(archive).digest('hex');
    const manifest = {
      ...INSTALLER_MANIFEST,
      assets: {
        ...INSTALLER_MANIFEST.assets,
        'linux-x64': {
          ...INSTALLER_MANIFEST.assets['linux-x64'],
          sha256,
        },
      },
    };
    const download = async ({ destination: archivePath }: { destination: string }) => {
      writeFileSync(archivePath, archive);
    };

    await expect(
      installPinnedBun(
        { platform: 'linux', arch: 'x64', libc: 'glibc', homeDirectory, temporaryDirectory: temporaryParent, manifest },
        {
          downloadPinnedBunArchive: download,
          verifyPinnedBunBinary: () => {
            throw new Error('pinned version check failed');
          },
        }
      )
    ).rejects.toThrow(/version check/i);
    expect(readFileSync(destination, 'utf8')).toBe('prior runtime');

    await expect(
      installPinnedBun(
        { platform: 'linux', arch: 'x64', libc: 'glibc', homeDirectory, temporaryDirectory: temporaryParent, manifest },
        {
          downloadPinnedBunArchive: download,
          verifyPinnedBunBinary: vi.fn(),
        }
      )
    ).rejects.toThrow();
    expect(readFileSync(destination, 'utf8')).toBe('prior runtime');
    expect(readdirSync(binDirectory)).toEqual(['bun']);
    expect(readdirSync(temporaryParent)).toEqual([]);
    expect(existsSync(destination)).toBe(true);
  });

  it('refuses a symlinked Bun install directory', async () => {
    const root = temporaryDirectory('wayland-bun-symlink-');
    const homeDirectory = join(root, 'home');
    const redirectedDirectory = join(root, 'redirected');
    const temporaryParent = join(root, 'tmp');
    mkdirSync(homeDirectory);
    mkdirSync(redirectedDirectory);
    mkdirSync(temporaryParent);
    symlinkSync(redirectedDirectory, join(homeDirectory, '.bun'), 'junction');

    const archive = await createRuntimeZip();
    const sha256 = (await import('node:crypto')).createHash('sha256').update(archive).digest('hex');
    const manifest = {
      ...INSTALLER_MANIFEST,
      assets: {
        ...INSTALLER_MANIFEST.assets,
        'linux-x64': {
          ...INSTALLER_MANIFEST.assets['linux-x64'],
          sha256,
        },
      },
    };

    await expect(
      installPinnedBun(
        { platform: 'linux', arch: 'x64', libc: 'glibc', homeDirectory, temporaryDirectory: temporaryParent, manifest },
        {
          downloadPinnedBunArchive: async ({ destination }: { destination: string }) => {
            writeFileSync(destination, archive);
          },
          verifyPinnedBunBinary: vi.fn(),
        }
      )
    ).rejects.toThrow(/symlink|regular directory/i);
    expect(existsSync(join(redirectedDirectory, 'bin', 'bun'))).toBe(false);
  });
});
