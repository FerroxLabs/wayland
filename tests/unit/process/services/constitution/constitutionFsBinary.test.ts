import { createHash } from 'node:crypto';
import { chmodSync, fstatSync, mkdtempSync, readFileSync, readSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ConstitutionFsBinaryError,
  createTestOnlyConstitutionFsBinaryAuthority,
  verifyConstitutionFsBinary,
  withHeldVerifiedConstitutionFsBinary,
} from '@process/services/constitution/constitutionFsBinary';

function fixture(bytes = Buffer.from('#!/bin/sh\nexit 0\n')) {
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-fs-binary-'));
  const binaryPath = path.join(installRoot, 'wayland-constitution-fs');
  const manifestPath = path.join(installRoot, 'manifest.json');
  const sha256 = `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
  writeFileSync(binaryPath, bytes);
  chmodSync(binaryPath, 0o700);
  writeFileSync(manifestPath, JSON.stringify({
    schemaVersion: 1,
    protocolVersion: 1,
    platform: process.platform,
    arch: process.arch,
    binary: { fileName: path.basename(binaryPath), sha256, size: bytes.byteLength },
  }));
  const authority = createTestOnlyConstitutionFsBinaryAuthority({
    sha256,
    size: bytes.byteLength,
    platform: process.platform,
    arch: process.arch,
    fileName: path.basename(binaryPath),
    installRoot,
    packaged: false,
  });
  return { binaryPath, manifestPath, authority };
}

describe('Constitution filesystem binary verification', () => {
  it('accepts only the exact helper bound to independent authority', () => {
    const input = fixture();
    const verified = verifyConstitutionFsBinary(input);
    expect(verified.protocolVersion).toBe(1);
    expect(verified.binaryPath).toBe(path.resolve(input.binaryPath));
  });

  it('rejects changed bytes and a self-consistent attacker manifest', () => {
    const input = fixture();
    const changed = Buffer.from('#!/bin/sh\nexit 7\n');
    writeFileSync(input.binaryPath, changed);
    const manifest = JSON.parse(readFileSync(input.manifestPath, 'utf8')) as { binary: { sha256: string; size: number } };
    manifest.binary.sha256 = `sha256:${createHash('sha256').update(changed).digest('hex')}`;
    manifest.binary.size = changed.byteLength;
    writeFileSync(input.manifestPath, JSON.stringify(manifest));
    expect(() => verifyConstitutionFsBinary(input)).toThrowError(expect.objectContaining<Partial<ConstitutionFsBinaryError>>({ code: 'CONSTITUTION_FS_BINARY_UNVERIFIED' }));
  });

  it('rejects symlinks and the wrong installation root', () => {
    const input = fixture();
    const link = path.join(input.authority.installRoot, 'linked-helper');
    symlinkSync(input.binaryPath, link);
    expect(() => verifyConstitutionFsBinary({ ...input, binaryPath: link })).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_BINARY_UNVERIFIED' }));
    expect(() => verifyConstitutionFsBinary({ ...input, binaryPath: path.join(os.tmpdir(), input.authority.fileName) })).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_BINARY_UNVERIFIED' }));
  });

  it('fails closed on unsupported platforms', () => {
    const input = fixture();
    expect(() => verifyConstitutionFsBinary({ ...input, platform: 'win32' })).toThrowError(expect.objectContaining<Partial<ConstitutionFsBinaryError>>({ code: 'CONSTITUTION_FS_UNSAFE_PLATFORM' }));
  });

  it('executes from a sealed verified snapshot immune to source-inode mutation', () => {
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
