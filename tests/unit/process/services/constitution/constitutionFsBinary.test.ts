import { createHash } from 'node:crypto';
import { chmodSync, fstatSync, mkdtempSync, readFileSync, readSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  type ConstitutionFsBinaryError,
  createTestOnlyConstitutionFsBinaryAuthority,
  verifyConstitutionFsBinary,
  withHeldVerifiedConstitutionFsBinary,
} from '@process/services/constitution/constitutionFsBinary';

/**
 * The Constitution filesystem is deliberately unsupported on win32: there is no
 * proven handle-relative primitive there, so verification and held-descriptor
 * execution fail closed with CONSTITUTION_FS_UNSAFE_PLATFORM by design. Same
 * gate as constitutionFsService.test.ts:260.
 */
const heldExecutionSupported = process.platform === 'darwin' || process.platform === 'linux';
/**
 * verifyConstitutionFsBinary takes platform as an explicit parameter, so the
 * platform-independent manifest, digest, and authority-binding assertions below
 * name a supported platform and keep running on win32 instead of being skipped.
 * On darwin and linux this is the real process platform, so those runners still
 * exercise the production default.
 */
const boundPlatform: NodeJS.Platform = heldExecutionSupported ? process.platform : 'linux';

function fixture(bytes = Buffer.from('#!/bin/sh\nexit 0\n')) {
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-fs-binary-'));
  const binaryPath = path.join(installRoot, 'wayland-constitution-fs');
  const manifestPath = path.join(installRoot, 'manifest.json');
  const sha256 = `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
  writeFileSync(binaryPath, bytes);
  chmodSync(binaryPath, 0o700);
  writeFileSync(
    manifestPath,
    JSON.stringify({
      schemaVersion: 1,
      protocolVersion: 2,
      platform: boundPlatform,
      arch: process.arch,
      binary: { fileName: path.basename(binaryPath), sha256, size: bytes.byteLength },
    })
  );
  const authority = createTestOnlyConstitutionFsBinaryAuthority({
    sha256,
    size: bytes.byteLength,
    platform: boundPlatform,
    arch: process.arch,
    fileName: path.basename(binaryPath),
    installRoot,
    packaged: false,
  });
  return { binaryPath, manifestPath, authority, platform: boundPlatform };
}

describe('Constitution filesystem binary verification', () => {
  it('accepts only the exact helper bound to independent authority', () => {
    const input = fixture();
    const verified = verifyConstitutionFsBinary(input);
    expect(verified.protocolVersion).toBe(2);
    expect(verified.binaryPath).toBe(path.resolve(input.binaryPath));
  });

  it('rejects a structurally valid protocol-v1 manifest', () => {
    const input = fixture();
    const manifest = JSON.parse(readFileSync(input.manifestPath, 'utf8')) as { protocolVersion: number };
    manifest.protocolVersion = 1;
    writeFileSync(input.manifestPath, JSON.stringify(manifest));
    expect(() => verifyConstitutionFsBinary(input)).toThrowError(
      expect.objectContaining<Partial<ConstitutionFsBinaryError>>({ code: 'CONSTITUTION_FS_MANIFEST_INVALID' })
    );
  });

  it('rejects changed bytes and a self-consistent attacker manifest', () => {
    const input = fixture();
    const changed = Buffer.from('#!/bin/sh\nexit 7\n');
    writeFileSync(input.binaryPath, changed);
    const manifest = JSON.parse(readFileSync(input.manifestPath, 'utf8')) as {
      binary: { sha256: string; size: number };
    };
    manifest.binary.sha256 = `sha256:${createHash('sha256').update(changed).digest('hex')}`;
    manifest.binary.size = changed.byteLength;
    writeFileSync(input.manifestPath, JSON.stringify(manifest));
    expect(() => verifyConstitutionFsBinary(input)).toThrowError(
      expect.objectContaining<Partial<ConstitutionFsBinaryError>>({ code: 'CONSTITUTION_FS_BINARY_UNVERIFIED' })
    );
  });

  // Creating a symlink is an unprivileged POSIX primitive but a privileged one on
  // win32, so only the symlink half is gated, matching
  // constitutionRevisionAuthority.test.ts:150.
  it.runIf(process.platform !== 'win32')('rejects symlinks', () => {
    const input = fixture();
    const link = path.join(input.authority.installRoot, 'linked-helper');
    symlinkSync(input.binaryPath, link);
    expect(() => verifyConstitutionFsBinary({ ...input, binaryPath: link })).toThrowError(
      expect.objectContaining({ code: 'CONSTITUTION_FS_BINARY_UNVERIFIED' })
    );
  });

  it('rejects the wrong installation root', () => {
    const input = fixture();
    expect(() =>
      verifyConstitutionFsBinary({ ...input, binaryPath: path.join(os.tmpdir(), input.authority.fileName) })
    ).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_BINARY_UNVERIFIED' }));
  });

  it('fails closed on unsupported platforms', () => {
    const input = fixture();
    expect(() => verifyConstitutionFsBinary({ ...input, platform: 'win32' })).toThrowError(
      expect.objectContaining<Partial<ConstitutionFsBinaryError>>({ code: 'CONSTITUTION_FS_UNSAFE_PLATFORM' })
    );
  });

  // The win32 fail-closed contract asserted against the real running platform,
  // not just the injected string above: an unsupported host must never bind a
  // helper, which is what the renderer's CONSTITUTION_FS_UNSAFE_PLATFORM branch
  // depends on.
  it.runIf(process.platform === 'win32')('fails closed for the running platform on win32', () => {
    const input = fixture();
    expect(() =>
      verifyConstitutionFsBinary({
        binaryPath: input.binaryPath,
        manifestPath: input.manifestPath,
        authority: input.authority,
      })
    ).toThrowError(
      expect.objectContaining<Partial<ConstitutionFsBinaryError>>({ code: 'CONSTITUTION_FS_UNSAFE_PLATFORM' })
    );
  });

  it('refuses held-descriptor execution for a helper bound to an unsupported platform', () => {
    const input = fixture();
    const verified = verifyConstitutionFsBinary(input);
    expect(() =>
      withHeldVerifiedConstitutionFsBinary({ ...verified, platform: 'win32' }, () => 'unreachable')
    ).toThrowError(
      expect.objectContaining<Partial<ConstitutionFsBinaryError>>({ code: 'CONSTITUTION_FS_UNSAFE_PLATFORM' })
    );
  });

  it.runIf(heldExecutionSupported)('executes from a sealed verified snapshot immune to source-inode mutation', () => {
    const input = fixture();
    const original = readFileSync(input.binaryPath);
    const verified = verifyConstitutionFsBinary(input);
    withHeldVerifiedConstitutionFsBinary(verified, ({ fd }) => {
      writeFileSync(input.binaryPath, Buffer.alloc(original.byteLength, 0x41));
      expect(fstatSync(fd).nlink).toBe(process.platform === 'linux' ? 0 : 1);
      const heldBytes = Buffer.alloc(original.byteLength);
      expect(readSync(fd, heldBytes, 0, heldBytes.byteLength, 0)).toBe(original.byteLength);
      expect(heldBytes).toEqual(original);
    });
  });
});
