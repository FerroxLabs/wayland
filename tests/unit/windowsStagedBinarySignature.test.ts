import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  verifyFuigoBundle,
  verifyStagedBinaryIntegrity,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('../../scripts/verify-packaged-resources');

const UPSTREAM_BYTES = 'fuigo-upstream';
const SIGNED_BYTES = 'fuigo-upstream+authenticode';
const sha = (value: string): string => crypto.createHash('sha256').update(value).digest('hex');
const UPSTREAM_SHA = sha(UPSTREAM_BYTES);
const SIGNED_SHA = sha(SIGNED_BYTES);

const PIN = {
  version: '1.0.19',
  platforms: {
    'win32-x64': {
      integrity: 'sha512-fixture',
      binarySha256: UPSTREAM_SHA,
      archiveSha256: 'fixture-archive',
    },
    'darwin-arm64': {
      integrity: 'sha512-fixture',
      binarySha256: UPSTREAM_SHA,
      archiveSha256: 'fixture-archive',
    },
  },
};

const roots: string[] = [];

function stageBundle(
  runtime: 'win32-x64' | 'darwin-arm64',
  { signed = false, receipt = {} }: { signed?: boolean; receipt?: Record<string, unknown> } = {}
): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-staged-'));
  roots.push(root);
  const dir = path.join(root, runtime);
  fs.mkdirSync(dir, { recursive: true });
  const name = runtime.startsWith('win32') ? 'fuigo.exe' : 'fuigo';
  fs.writeFileSync(path.join(dir, name), signed ? SIGNED_BYTES : UPSTREAM_BYTES);
  fs.writeFileSync(
    path.join(dir, 'bundle.json'),
    JSON.stringify({
      contract: 'fuigo-bundle/1.0',
      version: PIN.version,
      runtime,
      packageIntegrity: 'sha512-fixture',
      archiveSha256: 'fixture-archive',
      binarySha256: UPSTREAM_SHA,
      stagedSha256: signed ? SIGNED_SHA : UPSTREAM_SHA,
      binary: name,
      ...receipt,
    })
  );
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

const ours = vi.fn(() => true);
const theirs = vi.fn(() => false);

describe('win32 staged-binary signature gate', () => {
  it('accepts a binary we signed at staging time, whose bytes no longer equal the upstream pin', () => {
    // This is the whole point: signing rewrites the file, so the pre-#914 rule
    // stagedSha256 === binarySha256 FORBADE shipping a signed binary.
    const root = stageBundle('win32-x64', { signed: true });
    expect(
      verifyFuigoBundle(root, 'win32', 'x64', PIN, {
        windowsSignedCheck: ours,
        requireWindowsSignature: true,
      })
    ).toBe(true);
  });

  it('rejects a signature that is not ours', () => {
    const root = stageBundle('win32-x64', { signed: true });
    for (const requireWindowsSignature of [true, false]) {
      expect(
        verifyFuigoBundle(root, 'win32', 'x64', PIN, { windowsSignedCheck: theirs, requireWindowsSignature })
      ).toBe(false);
    }
  });

  it('rejects an unsigned binary on a build that signed everything else', () => {
    // A release build with a Trusted Signing credential must not fall back to
    // raw upstream bytes: Smart App Control would block them on first launch.
    const root = stageBundle('win32-x64');
    expect(
      verifyFuigoBundle(root, 'win32', 'x64', PIN, { windowsSignedCheck: theirs, requireWindowsSignature: true })
    ).toBe(false);
  });

  it('accepts an unsigned binary on a build that had no credential', () => {
    // Local, fork and PR builds stay buildable exactly as before.
    const root = stageBundle('win32-x64');
    expect(
      verifyFuigoBundle(root, 'win32', 'x64', PIN, { windowsSignedCheck: theirs, requireWindowsSignature: false })
    ).toBe(true);
  });

  it('rejects an upstream identity mismatch in every signing combination', () => {
    // The signature proves the publisher, never which binary was signed:
    // Authenticode has no field for the upstream digest the way the darwin
    // signing identifier does. Upstream identity is proven here instead, and it
    // has to hold no matter what the signature says.
    for (const signed of [true, false]) {
      for (const windowsSignedCheck of [ours, theirs]) {
        for (const requireWindowsSignature of [true, false]) {
          const root = stageBundle('win32-x64', { signed, receipt: { binarySha256: sha('some-other-release') } });
          expect(verifyFuigoBundle(root, 'win32', 'x64', PIN, { windowsSignedCheck, requireWindowsSignature })).toBe(
            false
          );
        }
      }
    }
  });

  it('rejects packaged bytes that do not match the digest the staging step recorded', () => {
    const root = stageBundle('win32-x64', { signed: true });
    fs.appendFileSync(path.join(root, 'win32-x64', 'fuigo.exe'), 'tampered-after-signing');
    expect(
      verifyFuigoBundle(root, 'win32', 'x64', PIN, { windowsSignedCheck: ours, requireWindowsSignature: true })
    ).toBe(false);
  });

  it('rejects a receipt with no staged digest at all', () => {
    const root = stageBundle('win32-x64', { signed: true, receipt: { stagedSha256: undefined } });
    expect(
      verifyFuigoBundle(root, 'win32', 'x64', PIN, { windowsSignedCheck: ours, requireWindowsSignature: true })
    ).toBe(false);
  });

  it('leaves the darwin rules exactly as they were', () => {
    const unsigned = stageBundle('darwin-arm64');
    expect(verifyFuigoBundle(unsigned, 'darwin', 'arm64', PIN, { darwinSignedCheck: theirs })).toBe(true);
    expect(
      verifyFuigoBundle(unsigned, 'darwin', 'arm64', PIN, { darwinSignedCheck: theirs, requireDarwinSignature: true })
    ).toBe(false);
    const signed = stageBundle('darwin-arm64', { signed: true });
    expect(
      verifyFuigoBundle(signed, 'darwin', 'arm64', PIN, { darwinSignedCheck: ours, requireDarwinSignature: true })
    ).toBe(true);
    expect(verifyFuigoBundle(signed, 'darwin', 'arm64', PIN, { darwinSignedCheck: theirs })).toBe(false);
  });

  it('binds the darwin check to the pinned upstream digest, not merely to our certificate', () => {
    const identifiers: unknown[] = [];
    const capture = vi.fn((_binaryPath: string, identifier: unknown) => {
      identifiers.push(identifier);
      return true;
    });
    const signed = stageBundle('darwin-arm64', { signed: true });
    verifyFuigoBundle(signed, 'darwin', 'arm64', PIN, { darwinSignedCheck: capture, requireDarwinSignature: true });
    expect(identifiers).toEqual([`fuigo.${UPSTREAM_SHA}`]);
  });

  it('never consults a signature on a platform where we stage upstream untouched', () => {
    // linux ships the upstream bytes and nothing signs them; the rule there is
    // still plain byte equality with the pin.
    const signedCheck = vi.fn(() => true);
    expect(
      verifyStagedBinaryIntegrity({
        binaryPath: path.join(stageBundle('win32-x64', { signed: true }), 'win32-x64', 'fuigo.exe'),
        upstreamSha256: UPSTREAM_SHA,
        stagedSha256: SIGNED_SHA,
        signedCheck: null,
      })
    ).toBe(false);
    expect(signedCheck).not.toHaveBeenCalled();
  });
});
