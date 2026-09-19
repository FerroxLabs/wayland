import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

const UPSTREAM = Buffer.from('fuigo-win32-upstream-bytes');
const UPSTREAM_SHA = crypto.createHash('sha256').update(UPSTREAM).digest('hex');
const ARCHIVE_SHA = crypto.createHash('sha256').update('archive').digest('hex');
const AUTHENTICODE = Buffer.from('+authenticode-certificate-table');

// vi.mock cannot reach these: the staging scripts are CommonJS and reach their
// dependencies through node's own require cache, not the vite module graph. The
// cache entries are patched instead - before the scripts are required, because
// both destructure their dependencies at require time - and restored afterwards.
/* eslint-disable @typescript-eslint/no-require-imports */
const distribution = require('../../src/process/agent/fuigo/distribution.cjs');
const signer = require('../../scripts/signWindowsStagedBinary');
const authority = require('../../scripts/fuigo/authority.json');

const originals = {
  download: distribution.download,
  decode: distribution.decode,
  sign: signer.signWindowsStagedBinary,
  pin: authority.platforms['win32-x64'],
};

let signImpl: (binaryPath: string) => boolean = () => true;
distribution.download = async () => Buffer.from('archive');
distribution.decode = () => ({
  name: 'fuigo.exe',
  binary: UPSTREAM,
  binarySha256: UPSTREAM_SHA,
  archiveSha256: ARCHIVE_SHA,
  notices: [],
});
signer.signWindowsStagedBinary = (binaryPath: string) => signImpl(binaryPath);
authority.platforms['win32-x64'] = {
  url: 'https://registry.npmjs.org/@fuigo/win32-x64/-/win32-x64-test.tgz',
  integrity: 'sha512-fixture',
  archiveSha256: ARCHIVE_SHA,
  binarySha256: UPSTREAM_SHA,
};

const prepareFuigo = require('../../scripts/fuigo/prepare.cjs');
/* eslint-enable @typescript-eslint/no-require-imports */

afterAll(() => {
  distribution.download = originals.download;
  distribution.decode = originals.decode;
  signer.signWindowsStagedBinary = originals.sign;
  authority.platforms['win32-x64'] = originals.pin;
});

let projectRoot = '';

beforeEach(() => {
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-fuigo-stage-'));
  // The real signer rewrites the file in place; the pin stays what it was.
  signImpl = (binaryPath: string) => {
    fs.appendFileSync(binaryPath, AUTHENTICODE);
    return true;
  };
});

afterEach(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

function stagedBinary(): string {
  return path.join(projectRoot, 'resources/bundled-fuigo/win32-x64/fuigo.exe');
}

describe('fuigo win32 staging', () => {
  it('records the digest of the SIGNED file, not the upstream bytes', async () => {
    const receipt = await prepareFuigo({ platform: 'win32', arch: 'x64', projectRoot });
    const shipped = crypto.createHash('sha256').update(fs.readFileSync(stagedBinary())).digest('hex');
    // If stagedSha256 were taken before signing, the packaged gate would compare
    // the shipped bytes against a digest of bytes that no longer exist and every
    // signed Windows build would fail the resource check.
    expect(receipt.stagedSha256).toBe(shipped);
    expect(receipt.stagedSha256).not.toBe(UPSTREAM_SHA);
    // Upstream identity is still the pinned digest of what we downloaded.
    expect(receipt.binarySha256).toBe(UPSTREAM_SHA);
  });

  it('signs before the receipt is written', async () => {
    let bundleExistedAtSignTime = true;
    signImpl = (binaryPath: string) => {
      bundleExistedAtSignTime = fs.existsSync(path.join(path.dirname(binaryPath), 'bundle.json'));
      fs.appendFileSync(binaryPath, AUTHENTICODE);
      return true;
    };
    await prepareFuigo({ platform: 'win32', arch: 'x64', projectRoot });
    expect(bundleExistedAtSignTime).toBe(false);
  });

  it('records the upstream digest when the build has no signing credential', async () => {
    signImpl = () => false;
    const receipt = await prepareFuigo({ platform: 'win32', arch: 'x64', projectRoot });
    // Local, fork and PR builds stage unsigned and stay verifiable.
    expect(receipt.stagedSha256).toBe(UPSTREAM_SHA);
  });

  it('fails closed, and stages nothing usable, when signing was required and threw', async () => {
    signImpl = () => {
      throw new Error('[sign-windows] refusing to stage Fuigo win32-x64 unsigned');
    };
    await expect(prepareFuigo({ platform: 'win32', arch: 'x64', projectRoot })).rejects.toThrow(/refusing to stage/);
    // No receipt, so the packaged gate cannot be satisfied by a half-staged run.
    expect(fs.existsSync(path.join(projectRoot, 'resources/bundled-fuigo/win32-x64/bundle.json'))).toBe(false);
  });
});
