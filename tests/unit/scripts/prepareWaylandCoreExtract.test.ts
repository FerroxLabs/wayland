/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1058 - `prepareWaylandCore.extractArchive` picked its zip extractor by the
 * TARGET platform instead of the HOST.
 *
 * A win32 TARGET selected the PowerShell `Expand-Archive` branch even when the
 * build HOST was macOS or Linux, where powershell does not exist:
 *
 *   Release build cannot prepare a verified wayland-core for win32-arm64
 *   (tag v0.13.0): spawnSync powershell ENOENT
 *
 * Four lines above, `downloadFile` keys on `process.platform` - the HOST - for the
 * same concern. Same file, opposite predicate; the download was right.
 *
 * Two legs, so this holds on every host:
 *   - the pure chooser is pinned for all four target/host combinations, including
 *     the ones the running host cannot execute;
 *   - a real .zip is really extracted with a win32 TARGET, which is the leg that
 *     ENOENTs today on darwin and linux.
 *
 * The archive SHA-256 is verified BEFORE extraction (verifyPublisherAttestation
 * then extractArchive in downloadAndExtract), so choosing the extractor by host
 * does not weaken the supply-chain guard.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import prepareWaylandCore = require('../../../scripts/prepareWaylandCore.js');

const wcore = prepareWaylandCore as unknown as {
  extractArchive: (archivePath: string, outputDir: string, targetPlatform: string, hostPlatform?: string) => void;
  __extractorFor: (targetPlatform: string, hostPlatform: string, archivePath: string) => string;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A one-entry, STORED (uncompressed) zip. No external tool needed to build it. */
function writeStoredZip(target: string, entryName: string, contents: Buffer): void {
  const name = Buffer.from(entryName, 'ascii');
  const crc = crc32(contents);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0, 6); // flags
  local.writeUInt16LE(0, 8); // method: stored
  local.writeUInt32LE(0, 10); // mod time + date
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(contents.length, 18);
  local.writeUInt32LE(contents.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4); // version made by
  central.writeUInt16LE(20, 6); // version needed
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt32LE(0, 12);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(contents.length, 20);
  central.writeUInt32LE(contents.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt16LE(0, 30); // extra
  central.writeUInt16LE(0, 32); // comment
  central.writeUInt16LE(0, 34); // disk
  central.writeUInt16LE(0, 36); // internal attrs
  central.writeUInt32LE(((0o100644 << 16) >>> 0) as number, 38); // external attrs (unix mode, high 16 bits)
  central.writeUInt32LE(0, 42); // local header offset

  const centralSize = central.length + name.length;
  const centralOffset = local.length + name.length + contents.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.writeFileSync(target, Buffer.concat([local, name, contents, central, name, eocd]));
}

describe('#1058 prepareWaylandCore.extractArchive picks its extractor by HOST', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  it('uses PowerShell only when the HOST is Windows, whatever the target is', () => {
    const zip = 'wayland-core-v0.13.0-x86_64-pc-windows-msvc.zip';
    const tgz = 'wayland-core-v0.13.0-aarch64-apple-darwin.tar.gz';
    // win32 TARGET, POSIX HOST: the case that ENOENTs today.
    expect(wcore.__extractorFor('win32', 'darwin', zip)).toBe('unzip');
    expect(wcore.__extractorFor('win32', 'linux', zip)).toBe('unzip');
    // win32 TARGET on a win32 HOST keeps using PowerShell (CI's real shape).
    expect(wcore.__extractorFor('win32', 'win32', zip)).toBe('powershell');
    // The target still decides that the archive IS a zip; a tarball never is.
    expect(wcore.__extractorFor('darwin', 'darwin', tgz)).toBe('tar');
    expect(wcore.__extractorFor('linux', 'win32', tgz)).toBe('tar');
  });

  it('really extracts a win32-target zip on this host', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-wcore-extract-'));
    roots.push(root);
    const zipPath = path.join(root, 'wayland-core-v0.13.0-x86_64-pc-windows-msvc.zip');
    const outDir = path.join(root, 'extracted');
    const payload = Buffer.from('wayland-core windows payload');
    writeStoredZip(zipPath, 'wayland-core.exe', payload);

    // KNOWN POSITIVE for the fixture: the same zip extracts under the HOST's own
    // target, so a failure on the win32 target below is the extractor choice and
    // not a malformed archive.
    const controlDir = path.join(root, 'control');
    wcore.extractArchive(zipPath, controlDir, process.platform);
    expect(fs.readFileSync(path.join(controlDir, 'wayland-core.exe'))).toEqual(payload);

    wcore.extractArchive(zipPath, outDir, 'win32');
    expect(fs.readFileSync(path.join(outDir, 'wayland-core.exe'))).toEqual(payload);
  });
});
