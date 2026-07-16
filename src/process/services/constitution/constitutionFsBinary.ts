/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PACKAGED_CONSTITUTION_FS_AUTHORITY } from './constitutionFsAuthority.generated';

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const SUPPORTED_PLATFORMS = new Set<NodeJS.Platform>(['darwin', 'linux']);
const TRUSTED_AUTHORITY = Symbol('wayland.constitutionFs.trustedAuthority');
type PackagedConstitutionFsAuthority =
  | Readonly<{ supported: false; platform: string; arch: string; protocolVersion: 1 }>
  | Readonly<{
      supported: true;
      schemaVersion: 1;
      protocolVersion: 1;
      platform: NodeJS.Platform;
      arch: NodeJS.Architecture;
      fileName: string;
      sha256: `sha256:${string}`;
      size: number;
    }>;

export class ConstitutionFsBinaryError extends Error {
  constructor(
    readonly code:
      | 'CONSTITUTION_FS_BINARY_MISSING'
      | 'CONSTITUTION_FS_BINARY_UNVERIFIED'
      | 'CONSTITUTION_FS_MANIFEST_INVALID'
      | 'CONSTITUTION_FS_UNSAFE_PLATFORM',
    message: string
  ) {
    super(message);
    this.name = 'ConstitutionFsBinaryError';
  }
}

export type VerifiedConstitutionFsBinary = {
  binaryPath: string;
  manifestPath: string;
  sha256: `sha256:${string}`;
  size: number;
  platform: NodeJS.Platform;
  arch: NodeJS.Architecture;
  protocolVersion: 1;
  authority: TrustedConstitutionFsBinaryAuthority;
};

export type TrustedConstitutionFsBinaryAuthority = {
  sha256: `sha256:${string}`;
  size: number;
  platform: NodeJS.Platform;
  arch: NodeJS.Architecture;
  fileName: string;
  installRoot: string;
  packaged: boolean;
  readonly [TRUSTED_AUTHORITY]: true;
};

export function createTestOnlyConstitutionFsBinaryAuthority(
  input: Omit<TrustedConstitutionFsBinaryAuthority, typeof TRUSTED_AUTHORITY>
): TrustedConstitutionFsBinaryAuthority {
  if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_BINARY_UNVERIFIED',
      'Test-only helper authority is forbidden outside a test process.'
    );
  }
  return Object.freeze({ ...input, [TRUSTED_AUTHORITY]: true as const });
}

/** Resolves the exact helper whose independently generated authority is compiled inside the ASAR. */
export function verifyPackagedConstitutionFsBinary(
  resourcesPath = process.resourcesPath
): VerifiedConstitutionFsBinary {
  const embedded = PACKAGED_CONSTITUTION_FS_AUTHORITY as PackagedConstitutionFsAuthority;
  if (!embedded.supported || embedded.platform !== process.platform || embedded.arch !== process.arch) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_UNSAFE_PLATFORM',
      `No packaged Constitution filesystem authority exists for ${process.platform}-${process.arch}.`
    );
  }
  const installRoot = path.resolve(resourcesPath, 'bundled-constitution-fs', `${embedded.platform}-${embedded.arch}`);
  const authority: TrustedConstitutionFsBinaryAuthority = Object.freeze({
    sha256: embedded.sha256,
    size: embedded.size,
    platform: embedded.platform,
    arch: embedded.arch,
    fileName: embedded.fileName,
    installRoot,
    packaged: true,
    [TRUSTED_AUTHORITY]: true as const,
  });
  return verifyConstitutionFsBinary({
    binaryPath: path.join(installRoot, embedded.fileName),
    manifestPath: path.join(installRoot, 'manifest.json'),
    authority,
  });
}

export type HeldConstitutionFsBinary = VerifiedConstitutionFsBinary & {
  fd: number;
  executablePath: string;
};

type BinaryManifest = {
  schemaVersion: 1;
  protocolVersion: 1;
  platform: NodeJS.Platform;
  arch: NodeJS.Architecture;
  binary: {
    fileName: string;
    sha256: `sha256:${string}`;
    size: number;
  };
};

function assertExactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).toSorted();
  const wanted = expected.toSorted();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new ConstitutionFsBinaryError('CONSTITUTION_FS_MANIFEST_INVALID', `${label} contains unexpected fields.`);
  }
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ConstitutionFsBinaryError('CONSTITUTION_FS_MANIFEST_INVALID', `${label} is not an object.`);
  }
}

function parseManifest(raw: string): BinaryManifest {
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_MANIFEST_INVALID',
      'Constitution filesystem manifest is not JSON.'
    );
  }
  assertRecord(value, 'Constitution filesystem manifest');
  assertExactKeys(
    value,
    ['schemaVersion', 'protocolVersion', 'platform', 'arch', 'binary'],
    'Constitution filesystem manifest'
  );
  assertRecord(value.binary, 'Constitution filesystem binary descriptor');
  assertExactKeys(value.binary, ['fileName', 'sha256', 'size'], 'Constitution filesystem binary descriptor');
  if (
    value.schemaVersion !== 1 ||
    value.protocolVersion !== 1 ||
    typeof value.platform !== 'string' ||
    typeof value.arch !== 'string' ||
    typeof value.binary.fileName !== 'string' ||
    path.basename(value.binary.fileName) !== value.binary.fileName ||
    typeof value.binary.sha256 !== 'string' ||
    !SHA256_PATTERN.test(value.binary.sha256) ||
    typeof value.binary.size !== 'number' ||
    !Number.isSafeInteger(value.binary.size) ||
    value.binary.size <= 0
  ) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_MANIFEST_INVALID',
      'Constitution filesystem manifest values are invalid.'
    );
  }
  return value as unknown as BinaryManifest;
}

function readRegularNoSymlink(
  filePath: string,
  missingCode: 'CONSTITUTION_FS_BINARY_MISSING' | 'CONSTITUTION_FS_MANIFEST_INVALID'
): Buffer {
  let stat;
  try {
    stat = lstatSync(filePath);
  } catch {
    throw new ConstitutionFsBinaryError(missingCode, `Required Constitution filesystem file is missing: ${filePath}`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_BINARY_UNVERIFIED',
      `Constitution filesystem file is not a regular non-symlink: ${filePath}`
    );
  }
  return readFileSync(filePath);
}

/** Verifies the native helper and its adjacent build manifest without a fallback path. */
export function verifyConstitutionFsBinary(input: {
  binaryPath: string;
  manifestPath: string;
  authority: TrustedConstitutionFsBinaryAuthority;
  platform?: NodeJS.Platform;
  arch?: NodeJS.Architecture;
}): VerifiedConstitutionFsBinary {
  const platform = input.platform ?? process.platform;
  const arch = input.arch ?? process.arch;
  const authority = input.authority;
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_UNSAFE_PLATFORM',
      `No proven handle-relative Constitution filesystem backend is available for ${platform}.`
    );
  }
  const installRoot = path.resolve(authority.installRoot);
  const expectedBinaryPath = path.resolve(installRoot, authority.fileName);
  if (
    authority.platform !== platform ||
    authority.arch !== arch ||
    !SHA256_PATTERN.test(authority.sha256) ||
    !Number.isSafeInteger(authority.size) ||
    authority.size <= 0 ||
    path.basename(authority.fileName) !== authority.fileName ||
    path.resolve(input.binaryPath) !== expectedBinaryPath ||
    path.dirname(path.resolve(input.manifestPath)) !== installRoot ||
    authority[TRUSTED_AUTHORITY] !== true
  ) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_BINARY_UNVERIFIED',
      'Constitution filesystem helper is not bound to a trusted packaged authority.'
    );
  }
  const manifestBytes = readRegularNoSymlink(input.manifestPath, 'CONSTITUTION_FS_MANIFEST_INVALID');
  const manifest = parseManifest(manifestBytes.toString('utf8'));
  if (manifest.platform !== platform || manifest.arch !== arch) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_BINARY_UNVERIFIED',
      'Constitution filesystem manifest platform does not match this process.'
    );
  }
  if (
    manifest.binary.sha256 !== authority.sha256 ||
    manifest.binary.size !== authority.size ||
    manifest.binary.fileName !== authority.fileName
  ) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_BINARY_UNVERIFIED',
      'Adjacent manifest disagrees with trusted embedded authority.'
    );
  }
  if (path.resolve(path.dirname(input.manifestPath), manifest.binary.fileName) !== path.resolve(input.binaryPath)) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_BINARY_UNVERIFIED',
      'Constitution filesystem manifest does not name the selected binary.'
    );
  }
  const binary = readRegularNoSymlink(input.binaryPath, 'CONSTITUTION_FS_BINARY_MISSING');
  const digest = `sha256:${createHash('sha256').update(binary).digest('hex')}` as const;
  if (binary.byteLength !== manifest.binary.size || digest !== manifest.binary.sha256) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_BINARY_UNVERIFIED',
      'Constitution filesystem binary bytes do not match the manifest.'
    );
  }
  return {
    binaryPath: path.resolve(input.binaryPath),
    manifestPath: path.resolve(input.manifestPath),
    sha256: digest,
    size: binary.byteLength,
    platform,
    arch,
    protocolVersion: 1,
    authority: { ...authority, installRoot },
  };
}

/**
 * Reopens, hashes, and executes the same held inode. The callback must pass fd
 * as child descriptor 3; this closes the pathname verification-to-exec race.
 */
export function withHeldVerifiedConstitutionFsBinary<T>(
  binary: VerifiedConstitutionFsBinary,
  callback: (held: HeldConstitutionFsBinary) => T
): T {
  if (!SUPPORTED_PLATFORMS.has(binary.platform) || binary.platform !== process.platform) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_UNSAFE_PLATFORM',
      `No held-descriptor Constitution filesystem execution is available for ${binary.platform}.`
    );
  }
  const reverified = verifyConstitutionFsBinary({
    binaryPath: binary.binaryPath,
    manifestPath: binary.manifestPath,
    authority: binary.authority,
    platform: binary.platform,
    arch: binary.arch,
  });
  if (
    reverified.sha256 !== binary.sha256 ||
    reverified.size !== binary.size ||
    reverified.binaryPath !== binary.binaryPath ||
    reverified.manifestPath !== binary.manifestPath ||
    reverified.platform !== binary.platform ||
    reverified.arch !== binary.arch
  ) {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_BINARY_UNVERIFIED',
      'Helper identity changed after initial verification.'
    );
  }
  let sourceFd: number;
  try {
    sourceFd = openSync(reverified.binaryPath, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch {
    throw new ConstitutionFsBinaryError(
      'CONSTITUTION_FS_BINARY_UNVERIFIED',
      'Verified helper could not be opened without following links.'
    );
  }
  try {
    const stat = fstatSync(sourceFd);
    if (!stat.isFile() || stat.nlink !== 1) {
      throw new ConstitutionFsBinaryError(
        'CONSTITUTION_FS_BINARY_UNVERIFIED',
        'Held helper is not a single-link regular file.'
      );
    }
    const bytes = readFileSync(sourceFd);
    const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
    if (stat.size !== reverified.size || bytes.byteLength !== reverified.size || digest !== reverified.sha256) {
      throw new ConstitutionFsBinaryError(
        'CONSTITUTION_FS_BINARY_UNVERIFIED',
        'Held helper bytes changed before execution.'
      );
    }
    const privateDirectory = mkdtempSync(path.join(os.tmpdir(), 'wayland-constitution-fs-exec-'));
    const snapshotPath = path.join(privateDirectory, 'helper');
    let snapshotFd: number | undefined;
    try {
      writeFileSync(snapshotPath, bytes, { flag: 'wx', mode: 0o500 });
      chmodSync(snapshotPath, 0o500);
      snapshotFd = openSync(snapshotPath, constants.O_RDONLY | constants.O_NOFOLLOW);
      fsyncSync(snapshotFd);
      const snapshotStat = fstatSync(snapshotFd);
      const snapshot = readFileSync(snapshotFd);
      const snapshotDigest = `sha256:${createHash('sha256').update(snapshot).digest('hex')}` as const;
      if (!snapshotStat.isFile() || snapshotStat.size !== reverified.size || snapshotDigest !== reverified.sha256) {
        throw new ConstitutionFsBinaryError(
          'CONSTITUTION_FS_BINARY_UNVERIFIED',
          'Sealed execution snapshot does not match the verified helper.'
        );
      }
      // Linux can execute the already-unlinked inode through the inherited
      // descriptor. Darwin cannot reliably execute an unlinked image through
      // /dev/fd, so retain the immutable snapshot inside the caller-private
      // 0700 directory until the synchronous child has exited.
      if (process.platform === 'linux') {
        unlinkSync(snapshotPath);
        rmdirSync(privateDirectory);
      }
      return callback({
        ...reverified,
        fd: snapshotFd,
        executablePath: process.platform === 'linux' ? '/proc/self/fd/3' : snapshotPath,
      });
    } finally {
      if (snapshotFd !== undefined) closeSync(snapshotFd);
      try {
        unlinkSync(snapshotPath);
      } catch {
        /* Already unlinked before execution. */
      }
      try {
        rmdirSync(privateDirectory);
      } catch {
        /* Preserve the execution error. */
      }
    }
  } finally {
    closeSync(sourceFd);
  }
}

/** Resolves only the packaged helper location; development callers must pass explicit verified paths. */
export function resolvePackagedConstitutionFsBinary(
  authority: TrustedConstitutionFsBinaryAuthority,
  resourcesPath = process.resourcesPath
): VerifiedConstitutionFsBinary {
  if (!resourcesPath) {
    throw new ConstitutionFsBinaryError('CONSTITUTION_FS_BINARY_MISSING', 'Electron resources path is unavailable.');
  }
  const directory = path.join(resourcesPath, 'constitution-fs', `${process.platform}-${process.arch}`);
  const fileName = process.platform === 'win32' ? 'wayland-constitution-fs.exe' : 'wayland-constitution-fs';
  return verifyConstitutionFsBinary({
    binaryPath: path.join(directory, fileName),
    manifestPath: path.join(directory, 'manifest.json'),
    authority,
  });
}
