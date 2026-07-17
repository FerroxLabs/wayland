/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// @ts-expect-error - the publishable installer helper is plain ESM.
import {
  publishEngineAtomically,
  resolveTrustedRedirect,
  selectWcoreAsset,
  validateWcoreDownloadUrl,
  verifyAndExtractEngine,
} from '../../../installer/scripts/wcore-security.mjs';

type TarEntry = {
  name: string;
  type?: string;
  content?: Buffer;
  linkName?: string;
};

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
const POSTINSTALL_SOURCE = readFileSync(join(ROOT, 'installer', 'scripts', 'postinstall.mjs'), 'utf8');
const STAGE_WCORE_SOURCE = readFileSync(join(ROOT, 'scripts', 'stage-wcore-bump.mjs'), 'utf8');
const INSTALLER_PACKAGE = JSON.parse(readFileSync(join(ROOT, 'installer', 'package.json'), 'utf8')) as {
  files: string[];
};
const INSTALLER_MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'installer', 'scripts', 'wcore-shasums.json'), 'utf8')
) as InstallerManifest;
const ROOT_MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'scripts', 'bundled-wcore-shasums.json'), 'utf8')
) as RootManifest;

function writeString(field: Buffer, value: string): void {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length > field.length) throw new Error(`tar test field too long: ${value}`);
  bytes.copy(field);
}

function writeOctal(field: Buffer, value: number): void {
  const encoded = value.toString(8).padStart(field.length - 1, '0') + '\0';
  writeString(field, encoded);
}

function tarHeader(entry: TarEntry): Buffer {
  const header = Buffer.alloc(512);
  const content = entry.content ?? Buffer.alloc(0);
  writeString(header.subarray(0, 100), entry.name);
  writeOctal(header.subarray(100, 108), entry.type === '5' ? 0o755 : 0o644);
  writeOctal(header.subarray(108, 116), 0);
  writeOctal(header.subarray(116, 124), 0);
  writeOctal(header.subarray(124, 136), content.length);
  writeOctal(header.subarray(136, 148), 0);
  header.fill(0x20, 148, 156);
  header[156] = (entry.type ?? '0').charCodeAt(0);
  if (entry.linkName) writeString(header.subarray(157, 257), entry.linkName);
  writeString(header.subarray(257, 263), 'ustar\0');
  writeString(header.subarray(263, 265), '00');
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  writeString(header.subarray(148, 156), `${checksum.toString(8).padStart(6, '0')}\0 `);
  return header;
}

function makeTarGz(entries: TarEntry[]): Buffer {
  const blocks: Buffer[] = [];
  for (const entry of entries) {
    const content = entry.content ?? Buffer.alloc(0);
    blocks.push(tarHeader(entry), content);
    const padding = (512 - (content.length % 512)) % 512;
    if (padding) blocks.push(Buffer.alloc(padding));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('headless installer wayland-core supply chain', () => {
  it('packages checksums that match the authoritative release manifest', () => {
    const authoritative = ROOT_MANIFEST[INSTALLER_MANIFEST.version];
    expect(authoritative).toBeTruthy();

    for (const asset of Object.values(INSTALLER_MANIFEST.assets)) {
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(`sha256:${asset.sha256}`).toBe(authoritative[asset.filename]);
    }
  });

  it('ships the security helper and checksum manifest in the npm package', () => {
    expect(INSTALLER_PACKAGE.files).toContain('scripts/wcore-security.mjs');
    expect(INSTALLER_PACKAGE.files).toContain('scripts/wcore-shasums.json');
  });

  it('selects only pinned supported platform assets', () => {
    expect(selectWcoreAsset('linux', 'x64', INSTALLER_MANIFEST)).toEqual(INSTALLER_MANIFEST.assets['linux-x64']);
    expect(selectWcoreAsset('darwin', 'arm64', INSTALLER_MANIFEST)).toEqual(INSTALLER_MANIFEST.assets['darwin-arm64']);
    expect(() => selectWcoreAsset('win32', 'x64', INSTALLER_MANIFEST)).toThrow(/unsupported platform/i);
  });

  it('fails closed when a pinned asset checksum is missing or malformed', () => {
    const missing = { ...INSTALLER_MANIFEST, assets: {} };
    expect(() => selectWcoreAsset('linux', 'x64', missing)).toThrow(/checksum|asset/i);

    const malformed = {
      ...INSTALLER_MANIFEST,
      assets: {
        ...INSTALLER_MANIFEST.assets,
        'linux-x64': { ...INSTALLER_MANIFEST.assets['linux-x64'], sha256: 'pending' },
      },
    };
    expect(() => selectWcoreAsset('linux', 'x64', malformed)).toThrow(/checksum/i);
  });

  it('allows only HTTPS GitHub release download and redirect hosts', () => {
    expect(() =>
      validateWcoreDownloadUrl(
        'https://github.com/FerroxLabs/wayland-core/releases/download/v0.12.24/wayland-core.tar.gz'
      )
    ).not.toThrow();
    expect(() =>
      validateWcoreDownloadUrl(
        'https://release-assets.githubusercontent.com/github-production-release-asset/file',
        true
      )
    ).not.toThrow();

    expect(() => validateWcoreDownloadUrl('http://github.com/FerroxLabs/wayland-core/releases/file')).toThrow(/HTTPS/i);
    expect(() => validateWcoreDownloadUrl('https://github.com.evil.example/FerroxLabs/wayland-core/file')).toThrow(
      /host/i
    );
    expect(() => validateWcoreDownloadUrl('https://user:pass@github.com/FerroxLabs/wayland-core/file')).toThrow(
      /credentials/i
    );
    expect(() => validateWcoreDownloadUrl('https://github.com:444/FerroxLabs/wayland-core/file')).toThrow(/port/i);
  });

  it('validates relative redirects before following them', () => {
    expect(
      resolveTrustedRedirect(
        'https://github.com/FerroxLabs/wayland-core/releases/download/v0.12.24/asset.tar.gz',
        '/FerroxLabs/wayland-core/releases/download/v0.12.24/next.tar.gz'
      ).href
    ).toBe('https://github.com/FerroxLabs/wayland-core/releases/download/v0.12.24/next.tar.gz');
    expect(() =>
      resolveTrustedRedirect(
        'https://github.com/FerroxLabs/wayland-core/releases/download/v0.12.24/asset.tar.gz',
        'https://attacker.example/asset.tar.gz'
      )
    ).toThrow(/host/i);
  });

  it('verifies SHA-256 before returning the regular engine file', () => {
    const archive = makeTarGz([
      { name: 'bundle/', type: '5' },
      { name: 'bundle/wayland-core', content: Buffer.from('verified-engine') },
    ]);

    expect(verifyAndExtractEngine(archive, sha256(archive))).toEqual(Buffer.from('verified-engine'));
    expect(() => verifyAndExtractEngine(archive, '0'.repeat(64))).toThrow(/checksum mismatch/i);
  });

  it('rejects archive paths that escape the extraction root', () => {
    const archive = makeTarGz([
      { name: '../outside', content: Buffer.from('attack') },
      { name: 'bundle/wayland-core', content: Buffer.from('engine') },
    ]);

    expect(() => verifyAndExtractEngine(archive, sha256(archive))).toThrow(/unsafe archive path/i);
  });

  it('rejects Windows-style traversal paths', () => {
    const archive = makeTarGz([
      { name: 'bundle\\..\\outside', content: Buffer.from('attack') },
      { name: 'bundle/wayland-core', content: Buffer.from('engine') },
    ]);

    expect(() => verifyAndExtractEngine(archive, sha256(archive))).toThrow(/unsafe archive path/i);
  });

  it('rejects symbolic links before accepting an engine', () => {
    const archive = makeTarGz([
      { name: 'bundle/link', type: '2', linkName: '../../outside' },
      { name: 'bundle/wayland-core', content: Buffer.from('engine') },
    ]);

    expect(() => verifyAndExtractEngine(archive, sha256(archive))).toThrow(/symbolic link/i);
  });

  it('rejects hard links before accepting an engine', () => {
    const archive = makeTarGz([
      { name: 'bundle/link', type: '1', linkName: '../../outside' },
      { name: 'bundle/wayland-core', content: Buffer.from('engine') },
    ]);

    expect(() => verifyAndExtractEngine(archive, sha256(archive))).toThrow(/hard link/i);
  });

  it('requires exactly one regular engine file', () => {
    const missing = makeTarGz([{ name: 'bundle/readme.txt', content: Buffer.from('readme') }]);
    expect(() => verifyAndExtractEngine(missing, sha256(missing))).toThrow(/engine binary not found/i);

    const duplicate = makeTarGz([
      { name: 'a/wayland-core', content: Buffer.from('one') },
      { name: 'b/aionrs', content: Buffer.from('two') },
    ]);
    expect(() => verifyAndExtractEngine(duplicate, sha256(duplicate))).toThrow(/multiple engine binaries/i);
  });

  it('does not delegate extraction to the system tar command', () => {
    expect(POSTINSTALL_SOURCE).not.toContain("spawnSync('tar'");
    expect(POSTINSTALL_SOURCE).toContain('verifyAndExtractEngine');
  });

  it('publishes the verified engine atomically without exposing a predictable partial file', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-wcore-publish-'));
    const destDir = join(root, 'bundled-wayland-core', 'linux-x64');
    const destBin = join(destDir, 'wayland-core');
    mkdirSync(destDir, { recursive: true });
    writeFileSync(destBin, 'working-engine');

    try {
      publishEngineAtomically(Buffer.from('replacement-engine'), destBin);

      expect(readFileSync(destBin, 'utf8')).toBe('replacement-engine');
      expect(readdirSync(destDir)).toEqual(['wayland-core']);
      if (process.platform !== 'win32') {
        expect(statSync(destBin).mode & 0o777).toBe(0o755);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('preserves a working engine when replacement validation fails', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-wcore-preserve-'));
    const destDir = join(root, 'bundled-wayland-core', 'linux-x64');
    const destBin = join(destDir, 'wayland-core');
    mkdirSync(destDir, { recursive: true });
    writeFileSync(destBin, 'working-engine');

    try {
      expect(() => publishEngineAtomically(Buffer.alloc(0), destBin)).toThrow(/non-empty buffer/i);
      expect(readFileSync(destBin, 'utf8')).toBe('working-engine');
      expect(readdirSync(destDir)).toEqual(['wayland-core']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('preserves an existing destination and cleans staging when publish fails late', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-wcore-late-failure-'));
    const destBin = join(root, 'wayland-core');
    const marker = join(destBin, 'working-engine');
    mkdirSync(destBin);
    writeFileSync(marker, 'working-engine');

    try {
      expect(() => publishEngineAtomically(Buffer.from('replacement-engine'), destBin)).toThrow();
      expect(readFileSync(marker, 'utf8')).toBe('working-engine');
      expect(readdirSync(root)).toEqual(['wayland-core']);
      expect(readdirSync(destBin)).toEqual(['working-engine']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('never deletes the live engine from the non-fatal postinstall failure path', () => {
    expect(POSTINSTALL_SOURCE).toContain('publishEngineAtomically');
    expect(POSTINSTALL_SOURCE).not.toContain('rmSync(destBin');
    expect(POSTINSTALL_SOURCE).not.toContain('const partialBin = `${destBin}.part`');
  });

  it('validates a stable semantic version before using a staged WCore release tag', () => {
    expect(STAGE_WCORE_SOURCE).toContain('^v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$');
    expect(STAGE_WCORE_SOURCE.indexOf('Invalid stable wayland-core release tag')).toBeLessThan(
      STAGE_WCORE_SOURCE.indexOf("['release', 'download'")
    );
  });
});
