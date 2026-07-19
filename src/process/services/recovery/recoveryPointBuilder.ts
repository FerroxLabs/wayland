/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import { constants, type Stats } from 'node:fs';
import {
  type FileHandle,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
} from 'node:fs/promises';
import path from 'node:path';
import { evaluateRecoveryDryRun, type RecoveryDryRun } from './recoveryDryRun';
import {
  RECOVERY_MANIFEST_FORMAT_VERSION,
  type AuthorityCoverage,
  type RecoveryManifest,
  type RecoveryManifestAuthority,
  type RecoveryManifestFile,
  type RecoveryManifestLogicalState,
  type StateAuthorityId,
  validateRecoveryManifest,
  verifyRecoverySnapshot,
} from './recoveryManifest';
import {
  MAX_RECOVERY_INVENTORY_ENTRIES_PER_ROOT,
  type RecoveryInventory,
  type StateAuthorityInventory,
} from './stateAuthorityInventory';

export type RecoverySnapshotLease = { release: () => Promise<void> };

export type RecoveryPointBuilderDependencies = {
  /** Produce an application-consistent SQLite image without plaintext disk staging. */
  captureSqliteOnline: (sourcePath: string) => Promise<Buffer>;
  /** Seal admitted in-memory bytes and return only the encrypted envelope. */
  sealBytes: (plaintext: Buffer) => Promise<Buffer>;
  acquireDesktopQuiescence: () => Promise<RecoverySnapshotLease>;
  acquireCoreQuiescence?: () => Promise<RecoverySnapshotLease>;
  readMutationEpoch: () => Promise<string>;
  now?: () => Date;
  createSnapshotId?: () => string;
  /** Test seam used to prove destination identity is revalidated after admission. */
  afterDestinationAdmission?: () => Promise<void>;
  /** Test seam used to prove pathname swaps cannot redirect an artifact write. */
  beforeFirstArtifactWrite?: () => Promise<void>;
  /** Test seam used to prove descendant admission is component-relative. */
  beforeSourceEntryOpen?: (relativePath: string) => Promise<void>;
  /** Test-only path fallback. Production callers must use descriptor-relative publication. */
  allowUnsafePathFallbackForTests?: boolean;
};

export type BuildRecoveryPointInputs = {
  inventory: RecoveryInventory;
  destinationRoot: string;
  reason: RecoveryManifest['reason'];
  sourceAppVersion: string;
  targetAppVersion?: string;
  desktopSchemaVersion: number;
  /** Live authority roots that must never overlap the recovery destination. */
  protectedRoots?: readonly string[];
};

export type BuiltRecoveryPoint = {
  snapshotPath: string;
  manifestPath: string;
  manifest: RecoveryManifest;
  dryRun: RecoveryDryRun;
};

export class RecoveryPointBuildBlockedError extends Error {
  constructor(readonly dryRun: RecoveryDryRun) {
    super(`Recovery point capture is blocked: ${dryRun.blockers.map(({ code }) => code).join(', ')}`);
    this.name = 'RecoveryPointBuildBlockedError';
  }
}

const COPIED_COVERAGE = new Set<AuthorityCoverage>(['copied', 'encrypted-copy']);

type DestinationPathIdentity = { path: string; dev: number; ino: number };
type RecoveryDestinationAdmission = {
  requestedRoot: string;
  root: string;
  canonicalRoot: string;
  operationRoot: string;
  handle?: FileHandle;
  pathIdentities: DestinationPathIdentity[];
  canonicalProtectedRoots: string[];
};

type RecoveryStagingAdmission = {
  path: string;
  operationRoot: string;
  handle?: FileHandle;
  dev: number;
  ino: number;
};

export type RecoveryFilesystemSafetyMode = 'descriptor-relative' | 'identity-guarded';

/**
 * Linux exposes held directory descriptors through /proc. Darwin and Windows
 * use repeated no-follow/reparse and identity checks around every component.
 * Neither platform is blanket-disabled; every unsafe observation fails closed.
 */
export function recoveryFilesystemSafetyModeForPlatform(platform: NodeJS.Platform): RecoveryFilesystemSafetyMode {
  return platform === 'linux' ? 'descriptor-relative' : 'identity-guarded';
}

const NO_FOLLOW = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
const DIRECTORY_ONLY = typeof constants.O_DIRECTORY === 'number' ? constants.O_DIRECTORY : 0;

type RecoverySourceAdmission = {
  sourcePath: string;
  operationRoot: string;
  state: StateAuthorityInventory['evidence'][number]['state'];
  handle?: FileHandle;
  descriptorRelative: boolean;
};

function pathsOverlap(left: string, right: string): boolean {
  const a = path.resolve(left);
  const b = path.resolve(right);
  const relativeAB = path.relative(a, b);
  const relativeBA = path.relative(b, a);
  return (
    a === b ||
    (relativeAB !== '' && !relativeAB.startsWith('..') && !path.isAbsolute(relativeAB)) ||
    (relativeBA !== '' && !relativeBA.startsWith('..') && !path.isAbsolute(relativeBA))
  );
}

async function canonicalizePotentialPath(candidate: string, missingSegments: string[] = []): Promise<string> {
  const cursor = path.resolve(candidate);
  try {
    await lstat(cursor);
    return path.resolve(await realpath(cursor), ...missingSegments);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const parent = path.dirname(cursor);
    if (parent === cursor) throw error;
    return canonicalizePotentialPath(parent, [path.basename(cursor), ...missingSegments]);
  }
}

/** Reject lexical and symlink-resolved aliases between output and live authority roots. */
export async function assertRecoveryDestinationDisjoint(
  destinationRoot: string,
  protectedRoots: readonly string[]
): Promise<void> {
  const canonicalDestination = await canonicalizePotentialPath(destinationRoot);
  const canonicalProtectedRoots = await Promise.all(protectedRoots.map((root) => canonicalizePotentialPath(root)));
  for (const [index, protectedRoot] of protectedRoots.entries()) {
    const canonicalProtected = canonicalProtectedRoots[index];
    if (pathsOverlap(destinationRoot, protectedRoot) || pathsOverlap(canonicalDestination, canonicalProtected)) {
      throw new Error(`Recovery destination must be disjoint from live state: ${protectedRoot}`);
    }
  }
}

async function admitRecoveryDestination(
  destinationRoot: string,
  protectedRoots: readonly string[],
  allowUnsafePathFallbackForTests = false
): Promise<RecoveryDestinationAdmission> {
  const requestedRoot = path.resolve(destinationRoot);
  await assertRecoveryDestinationDisjoint(requestedRoot, protectedRoots);
  // Resolve trusted platform aliases (macOS /var -> /private/var) before the
  // no-follow walk. User-controlled aliases remain observable because every
  // existing segment in the resolved path is subsequently admitted by inode.
  const root = await canonicalizePotentialPath(requestedRoot);
  const parsedRoot = path.parse(root).root;
  const segments = path.relative(parsedRoot, root).split(path.sep).filter(Boolean);
  const pathIdentities: DestinationPathIdentity[] = [];
  let cursor = parsedRoot;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    let stat: Awaited<ReturnType<typeof lstat>>;
    try {
      // Sequential no-follow admission is required for every path component.
      // oxlint-disable-next-line no-await-in-loop
      stat = await lstat(cursor);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      // mkdir without recursive mode prevents silently following a newly swapped parent.
      // oxlint-disable-next-line no-await-in-loop
      await mkdir(cursor, { mode: 0o700 });
      // oxlint-disable-next-line no-await-in-loop
      stat = await lstat(cursor);
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`Recovery destination path must contain only real directories: ${cursor}`);
    }
    pathIdentities.push({ path: cursor, dev: stat.dev, ino: stat.ino });
  }
  const canonicalRoot = await realpath(root);
  const canonicalProtectedRoots = await Promise.all(
    protectedRoots.map((candidate) => canonicalizePotentialPath(candidate))
  );
  for (const [index, canonicalProtectedRoot] of canonicalProtectedRoots.entries()) {
    if (pathsOverlap(canonicalRoot, canonicalProtectedRoot)) {
      throw new Error(`Recovery destination must be disjoint from live state: ${protectedRoots[index]}`);
    }
  }
  // Kept only for compatibility with older test dependency builders. It no
  // longer weakens production behavior on Darwin or Windows.
  void allowUnsafePathFallbackForTests;
  if (process.platform === 'win32') {
    // Windows does not allow Node to open directories as FileHandles. Preserve
    // the admitted reparse-safe path identity and revalidate it around every
    // component operation instead of blanket-rejecting the platform.
    return {
      requestedRoot,
      root,
      canonicalRoot,
      operationRoot: canonicalRoot,
      pathIdentities,
      canonicalProtectedRoots,
    };
  }

  const directoryFlags = constants.O_RDONLY | DIRECTORY_ONLY | NO_FOLLOW;
  const handle = await open(root, directoryFlags);
  try {
    const handleStat = await handle.stat();
    const rootIdentity = pathIdentities.at(-1);
    if (
      !handleStat.isDirectory() ||
      !rootIdentity ||
      handleStat.dev !== rootIdentity.dev ||
      handleStat.ino !== rootIdentity.ino
    ) {
      throw new Error('Recovery destination handle does not match the admitted directory.');
    }
    const operationRoot =
      recoveryFilesystemSafetyModeForPlatform(process.platform) === 'descriptor-relative'
        ? `/proc/self/fd/${handle.fd}`
        : canonicalRoot;
    if (process.platform === 'linux') {
      const operationStat = await lstat(await realpath(operationRoot));
      if (operationStat.dev !== handleStat.dev || operationStat.ino !== handleStat.ino) {
        throw new Error('Recovery destination descriptor did not resolve to the admitted directory.');
      }
    }
    return { requestedRoot, root, canonicalRoot, operationRoot, handle, pathIdentities, canonicalProtectedRoots };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function assertRecoveryDestinationStable(admission: RecoveryDestinationAdmission): Promise<void> {
  for (const identity of admission.pathIdentities) {
    let stat: Awaited<ReturnType<typeof lstat>>;
    try {
      // Sequential identity checks make any swapped ancestor fail closed.
      // oxlint-disable-next-line no-await-in-loop
      stat = await lstat(identity.path);
    } catch {
      throw new Error(`Recovery destination identity changed after admission: ${identity.path}`);
    }
    if (stat.isSymbolicLink() || !stat.isDirectory() || stat.dev !== identity.dev || stat.ino !== identity.ino) {
      throw new Error(`Recovery destination identity changed after admission: ${identity.path}`);
    }
  }
  const currentCanonicalRoot = await realpath(admission.requestedRoot);
  if (currentCanonicalRoot !== admission.canonicalRoot) {
    throw new Error('Recovery destination canonical identity changed after admission.');
  }
  for (const protectedRoot of admission.canonicalProtectedRoots) {
    if (pathsOverlap(currentCanonicalRoot, protectedRoot)) {
      throw new Error(`Recovery destination became unsafe after admission: ${protectedRoot}`);
    }
  }
}

function safeSegment(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return sanitized || 'state';
}

function sourceRoot(authority: StateAuthorityInventory): string {
  if (authority.evidence.length === 0) return `<${authority.id}>`;
  if (authority.evidence.length === 1) return authority.evidence[0].path;
  return path.dirname(authority.evidence[0].path);
}

async function assertRegularFile(filePath: string, label: string): Promise<Stats> {
  const stat = await lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular file: ${filePath}`);
  return stat;
}

function assertSafeRelativeArtifactPath(relativePath: string): string[] {
  if (path.isAbsolute(relativePath)) throw new Error('Recovery artifact path must be relative.');
  const segments = relativePath.split('/');
  if (
    segments.length === 0 ||
    segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..' || segment.includes('\\'))
  ) {
    throw new Error(`Recovery artifact path is unsafe: ${relativePath}`);
  }
  return segments;
}

async function admitRecoveryStaging(stagingPath: string): Promise<RecoveryStagingAdmission> {
  const expected = await lstat(stagingPath);
  if (expected.isSymbolicLink() || !expected.isDirectory()) {
    throw new Error('Recovery staging root must be a real directory.');
  }
  if (process.platform === 'win32') {
    return {
      path: stagingPath,
      operationRoot: stagingPath,
      dev: expected.dev,
      ino: expected.ino,
    };
  }
  const handle = await open(stagingPath, constants.O_RDONLY | DIRECTORY_ONLY | NO_FOLLOW);
  try {
    const observed = await handle.stat();
    const current = await lstat(stagingPath);
    if (
      !observed.isDirectory() ||
      current.isSymbolicLink() ||
      observed.dev !== expected.dev ||
      observed.ino !== expected.ino ||
      current.dev !== observed.dev ||
      current.ino !== observed.ino
    ) {
      throw new Error('Recovery staging identity changed during admission.');
    }
    return {
      path: stagingPath,
      operationRoot:
        recoveryFilesystemSafetyModeForPlatform(process.platform) === 'descriptor-relative'
          ? `/proc/self/fd/${handle.fd}`
          : stagingPath,
      handle,
      dev: observed.dev,
      ino: observed.ino,
    };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function assertRecoveryStagingStable(admission: RecoveryStagingAdmission): Promise<void> {
  const current = await lstat(admission.path);
  const observed = admission.handle ? await admission.handle.stat() : current;
  if (
    !observed.isDirectory() ||
    current.isSymbolicLink() ||
    current.dev !== admission.dev ||
    current.ino !== admission.ino ||
    observed.dev !== admission.dev ||
    observed.ino !== admission.ino
  ) {
    throw new Error('Recovery staging identity changed after admission.');
  }
}

/**
 * Create one file through a parent directory that has been opened and checked
 * component-by-component. Linux uses the held parent descriptor for the final
 * create. Darwin/Windows re-check the held identity immediately around the
 * exclusive no-follow/reparse-sensitive create and fail closed on drift.
 */
async function writeRecoveryArtifact(
  staging: RecoveryStagingAdmission,
  relativePath: string,
  contents: Buffer,
  afterParentAdmission?: () => Promise<void>
): Promise<Stats> {
  const segments = assertSafeRelativeArtifactPath(relativePath);
  const fileName = segments.pop()!;
  const heldDirectories: Array<{ handle?: FileHandle; path: string; dev: number; ino: number }> = [];
  let operationDirectory = staging.operationRoot;
  try {
    for (const segment of segments) {
      const candidate = path.join(operationDirectory, segment);
      try {
        // Component-relative on Linux because operationDirectory is a held
        // /proc descriptor; non-recursive creation never follows a new leaf.
        // oxlint-disable-next-line no-await-in-loop
        await mkdir(candidate, { mode: 0o700 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      }
      // oxlint-disable-next-line no-await-in-loop
      const expected = await lstat(candidate);
      if (expected.isSymbolicLink() || !expected.isDirectory()) {
        throw new Error(`Recovery artifact parent is unsafe: ${relativePath}`);
      }
      // oxlint-disable-next-line no-await-in-loop
      const handle =
        process.platform === 'win32'
          ? undefined
          : // oxlint-disable-next-line no-await-in-loop
            await open(candidate, constants.O_RDONLY | DIRECTORY_ONLY | NO_FOLLOW);
      // oxlint-disable-next-line no-await-in-loop
      const observed = handle ? await handle.stat() : await lstat(candidate);
      // oxlint-disable-next-line no-await-in-loop
      const current = await lstat(candidate);
      if (
        !observed.isDirectory() ||
        current.isSymbolicLink() ||
        observed.dev !== expected.dev ||
        observed.ino !== expected.ino ||
        current.dev !== observed.dev ||
        current.ino !== observed.ino
      ) {
        // oxlint-disable-next-line no-await-in-loop
        await handle?.close();
        throw new Error(`Recovery artifact parent identity changed: ${relativePath}`);
      }
      heldDirectories.push({ handle, path: candidate, dev: observed.dev, ino: observed.ino });
      operationDirectory =
        recoveryFilesystemSafetyModeForPlatform(process.platform) === 'descriptor-relative'
          ? `/proc/self/fd/${handle!.fd}`
          : candidate;
    }

    await afterParentAdmission?.();
    await assertRecoveryStagingStable(staging);
    for (const directory of heldDirectories) {
      // Sequential checks preserve the exact component chain on platforms
      // without /proc descriptor paths.
      // oxlint-disable-next-line no-await-in-loop
      const [observed, current] = await Promise.all([
        directory.handle ? directory.handle.stat() : lstat(directory.path),
        lstat(directory.path),
      ]);
      if (
        !observed.isDirectory() ||
        current.isSymbolicLink() ||
        observed.dev !== directory.dev ||
        observed.ino !== directory.ino ||
        current.dev !== directory.dev ||
        current.ino !== directory.ino
      ) {
        throw new Error(`Recovery artifact parent identity changed: ${relativePath}`);
      }
    }

    const destinationPath = path.join(operationDirectory, fileName);
    const handle = await open(
      destinationPath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NO_FOLLOW,
      0o600
    );
    try {
      await handle.writeFile(contents);
      await handle.sync();
      const stat = await handle.stat();
      if (!stat.isFile() || stat.nlink !== 1 || stat.size !== contents.length) {
        throw new Error(`Recovery artifact write was not a single-link regular file: ${relativePath}`);
      }
      return stat;
    } finally {
      await handle.close();
    }
  } finally {
    await Promise.allSettled(heldDirectories.flatMap(({ handle }) => (handle ? [handle.close()] : [])));
  }
}

type AdmittedSourceFile = {
  sourcePath: string;
  relativePath: string;
  handle?: FileHandle;
};

async function visitAdmittedSourceFiles(
  admission: RecoverySourceAdmission,
  visitor: (file: AdmittedSourceFile) => Promise<void>,
  beforeSourceEntryOpen?: (relativePath: string) => Promise<void>
): Promise<void> {
  if (admission.state === 'file') {
    await visitor({
      sourcePath: admission.operationRoot,
      relativePath: path.basename(admission.sourcePath),
      handle: admission.handle,
    });
    return;
  }

  let remaining = MAX_RECOVERY_INVENTORY_ENTRIES_PER_ROOT;
  const visitDirectory = async (directoryHandle: FileHandle | undefined, relativeRoot: string): Promise<void> => {
    const operationDirectory =
      admission.descriptorRelative && directoryHandle
        ? `/proc/self/fd/${directoryHandle.fd}`
        : path.join(admission.operationRoot, relativeRoot);
    const directoryIdentity = directoryHandle ? await directoryHandle.stat() : await lstat(operationDirectory);
    const currentDirectory = await lstat(operationDirectory);
    if (
      currentDirectory.isSymbolicLink() ||
      !currentDirectory.isDirectory() ||
      currentDirectory.dev !== directoryIdentity.dev ||
      currentDirectory.ino !== directoryIdentity.ino
    ) {
      throw new Error(`Recovery source directory identity changed during traversal: ${relativeRoot || '.'}`);
    }
    const entries = await readdir(operationDirectory, { withFileTypes: true });
    entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
    for (const entry of entries) {
      if (remaining <= 0) throw new Error('Recovery source traversal exceeded its bounded inventory.');
      remaining -= 1;
      const relativePath = path.join(relativeRoot, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Recovery source contains a symlink: ${relativePath}`);
      const candidate = path.join(operationDirectory, entry.name);
      // Pin the component identity before the test seam and descriptor-relative open.
      // oxlint-disable-next-line no-await-in-loop
      const expected = await lstat(candidate);
      if (expected.isSymbolicLink()) throw new Error(`Recovery source contains a symlink: ${relativePath}`);
      // This hook is test-only and runs before the component-relative open.
      // oxlint-disable-next-line no-await-in-loop
      await beforeSourceEntryOpen?.(relativePath);
      const directoryFlag = entry.isDirectory() ? DIRECTORY_ONLY : 0;
      const nonBlockingFlag = typeof constants.O_NONBLOCK === 'number' ? constants.O_NONBLOCK : 0;
      let childHandle: FileHandle | undefined;
      try {
        // Each child is opened relative to its already-admitted parent descriptor.
        // O_NOFOLLOW protects the final component; parent components are pinned handles.
        // oxlint-disable-next-line no-await-in-loop
        childHandle =
          process.platform === 'win32' && entry.isDirectory()
            ? undefined
            : // oxlint-disable-next-line no-await-in-loop
              await open(candidate, constants.O_RDONLY | NO_FOLLOW | directoryFlag | nonBlockingFlag);
      } catch (error) {
        throw new Error(`Recovery source entry could not be admitted safely: ${relativePath}`, { cause: error });
      }
      try {
        // oxlint-disable-next-line no-await-in-loop
        const [observed, current] = await Promise.all([
          childHandle ? childHandle.stat() : lstat(candidate),
          lstat(candidate),
        ]);
        if (
          current.isSymbolicLink() ||
          observed.dev !== expected.dev ||
          observed.ino !== expected.ino ||
          observed.dev !== current.dev ||
          observed.ino !== current.ino ||
          (observed.isDirectory() && !current.isDirectory()) ||
          (observed.isFile() && !current.isFile())
        ) {
          throw new Error(`Recovery source identity changed during descendant admission: ${relativePath}`);
        }
        if (observed.isDirectory()) {
          // oxlint-disable-next-line no-await-in-loop
          await visitDirectory(childHandle, relativePath);
        } else if (observed.isFile()) {
          // oxlint-disable-next-line no-await-in-loop
          await visitor({ sourcePath: candidate, relativePath, handle: childHandle });
        } else {
          throw new Error(`Recovery source has an unsupported entry: ${relativePath}`);
        }
      } finally {
        // oxlint-disable-next-line no-await-in-loop
        await childHandle?.close();
      }
    }
  };
  await visitDirectory(admission.handle, '');
}

async function admitRecoverySource(
  evidence: StateAuthorityInventory['evidence'][number],
  allowUnsafePathFallbackForTests: boolean
): Promise<RecoverySourceAdmission> {
  if (evidence.state !== 'file' && evidence.state !== 'directory') {
    throw new Error(`Recovery source cannot be admitted from state ${evidence.state}: ${evidence.path}`);
  }
  void allowUnsafePathFallbackForTests;
  if (recoveryFilesystemSafetyModeForPlatform(process.platform) !== 'descriptor-relative') {
    const expected = await lstat(evidence.path);
    if (expected.isSymbolicLink()) throw new Error(`Recovery source cannot be a symlink: ${evidence.path}`);
    const expectedType = evidence.state === 'directory' ? expected.isDirectory() : expected.isFile();
    if (!expectedType) {
      throw new Error(`Recovery source type does not match inventory: ${evidence.path}`);
    }
    if (process.platform === 'win32') {
      return {
        sourcePath: evidence.path,
        operationRoot: evidence.path,
        state: evidence.state,
        descriptorRelative: false,
      };
    }
    const flags = constants.O_RDONLY | NO_FOLLOW | (evidence.state === 'directory' ? DIRECTORY_ONLY : 0);
    const handle = await open(evidence.path, flags);
    const observed = await handle.stat();
    const current = await lstat(evidence.path);
    const observedType = evidence.state === 'directory' ? observed.isDirectory() : observed.isFile();
    if (
      !observedType ||
      current.isSymbolicLink() ||
      observed.dev !== expected.dev ||
      observed.ino !== expected.ino ||
      current.dev !== observed.dev ||
      current.ino !== observed.ino
    ) {
      await handle.close();
      throw new Error(`Recovery source identity changed during admission: ${evidence.path}`);
    }
    return {
      sourcePath: evidence.path,
      operationRoot: evidence.path,
      state: evidence.state,
      handle,
      descriptorRelative: false,
    };
  }

  const expected = await lstat(evidence.path);
  const flags = constants.O_RDONLY | NO_FOLLOW | (evidence.state === 'directory' ? DIRECTORY_ONLY : 0);
  const handle = await open(evidence.path, flags);
  try {
    const observed = await handle.stat();
    const expectedType = evidence.state === 'directory' ? observed.isDirectory() : observed.isFile();
    if (!expectedType || observed.dev !== expected.dev || observed.ino !== expected.ino) {
      throw new Error(`Recovery source identity changed during admission: ${evidence.path}`);
    }
    return {
      sourcePath: evidence.path,
      operationRoot: `/proc/self/fd/${handle.fd}`,
      state: evidence.state,
      handle,
      descriptorRelative: true,
    };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

function relativeSourcePath(root: string, filePath: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(filePath);
  if (resolvedRoot === resolvedFile) return path.basename(filePath);
  const relative = path.relative(resolvedRoot, resolvedFile);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Recovery source escaped its authority root: ${filePath}`);
  }
  return relative;
}

function recoveryRestorePath(
  authorityId: StateAuthorityId,
  evidencePath: string,
  evidenceState: StateAuthorityInventory['evidence'][number]['state'],
  filePath: string,
  authorityRelativePath?: string
): string {
  const observedRelative =
    evidenceState === 'file' ? path.basename(evidencePath) : relativeSourcePath(evidencePath, filePath);
  const relative =
    (authorityId === 'constitution.filesystem' ||
      authorityId === 'desktop.runtime-files' ||
      authorityId === 'credentials.key-material') &&
    authorityRelativePath
      ? evidenceState === 'file'
        ? authorityRelativePath
        : path.posix.join(authorityRelativePath, ...observedRelative.split(path.sep))
      : observedRelative;
  const segments = relative.split(path.sep);
  switch (authorityId) {
    case 'desktop.database':
      return 'desktop/database/wayland.db';
    case 'desktop.config':
      return path.posix.join('desktop/config', ...segments);
    case 'desktop.runtime-files':
      return path.posix.join(
        'desktop/runtime',
        ...(authorityRelativePath
          ? segments
          : evidenceState === 'file'
            ? segments
            : [path.basename(evidencePath), ...segments])
      );
    case 'constitution.filesystem':
      return path.posix.join('constitution/files', ...segments);
    case 'constitution.revision-authority':
      if (
        path.basename(filePath) !== 'revision-authority.enc' &&
        path.basename(filePath) !== 'revision-authority.enc.legacy-v1-migration.json'
      ) {
        throw new Error(`Unexpected Constitution revision authority path: ${filePath}`);
      }
      return path.posix.join('desktop/constitution', path.basename(filePath));
    case 'core.default-profile':
      return path.posix.join('core/default', ...segments);
    case 'core.named-profiles':
      return path.posix.join('core/profiles', ...segments);
    case 'credentials.key-material':
      return path.posix.join(
        'desktop/credentials',
        ...(authorityRelativePath
          ? segments
          : evidenceState === 'file'
            ? segments
            : [path.basename(evidencePath), ...segments])
      );
    case 'updater.state':
      return path.posix.join('desktop/updater', ...segments);
    default:
      throw new Error(`Authority cannot own recovery files: ${authorityId}`);
  }
}

function authorityOwnsFile(
  authorityId: StateAuthorityId,
  evidencePath: string,
  evidenceState: StateAuthorityInventory['evidence'][number]['state'],
  filePath: string
): boolean {
  if (authorityId !== 'constitution.filesystem' || evidenceState !== 'directory') return true;
  const relative = relativeSourcePath(evidencePath, filePath).split(path.sep).join('/');
  // ~/.wayland/profiles is producer-owned Core state and is captured through
  // core.named-profiles. The Constitution authority owns every other path in
  // ~/.wayland, but must never duplicate or race that nested producer tree.
  return relative !== 'profiles' && !relative.startsWith('profiles/');
}

async function addCapturedFile(options: {
  authority: StateAuthorityInventory;
  sourcePath: string;
  manifestSourcePath?: string;
  relativePath: string;
  restorePath: string;
  logicalRole?: string;
  staging: RecoveryStagingAdmission;
  sealBytes: RecoveryPointBuilderDependencies['sealBytes'];
  capturedSnapshotPaths: Set<string>;
  ordinal: number;
  assertDestinationStable: () => Promise<void>;
  beforeArtifactWrite?: () => Promise<void>;
  sourceHandle?: FileHandle;
  capturedBytes?: Buffer;
}): Promise<RecoveryManifestFile> {
  const {
    authority,
    sourcePath,
    relativePath,
    staging,
    sealBytes,
    capturedSnapshotPaths,
    ordinal,
    assertDestinationStable,
    beforeArtifactWrite,
    sourceHandle,
    capturedBytes,
  } = options;
  const sourceStat = sourceHandle ? await sourceHandle.stat() : await assertRegularFile(sourcePath, 'Recovery source');
  const openedSourceHandle = capturedBytes
    ? undefined
    : (sourceHandle ?? (await open(sourcePath, constants.O_RDONLY | NO_FOLLOW)));
  let sourceBytes: Buffer | undefined;
  try {
    if (capturedBytes) {
      sourceBytes = capturedBytes;
    } else {
      if (!openedSourceHandle) throw new Error(`Recovery source handle disappeared: ${sourcePath}`);
      const handleStat = await openedSourceHandle.stat();
      const currentStat = sourceHandle ? handleStat : await lstat(sourcePath);
      if (
        !handleStat.isFile() ||
        handleStat.dev !== sourceStat.dev ||
        handleStat.ino !== sourceStat.ino ||
        currentStat.dev !== handleStat.dev ||
        currentStat.ino !== handleStat.ino
      ) {
        throw new Error(`Recovery source identity changed before capture: ${sourcePath}`);
      }
      sourceBytes = await openedSourceHandle.readFile();
      const afterReadStat = await openedSourceHandle.stat();
      if (
        sourceBytes.length !== handleStat.size ||
        afterReadStat.dev !== handleStat.dev ||
        afterReadStat.ino !== handleStat.ino ||
        afterReadStat.size !== handleStat.size ||
        afterReadStat.mtimeMs !== handleStat.mtimeMs
      ) {
        throw new Error(`Recovery source changed while it was read: ${sourcePath}`);
      }
    }

    const encrypted = authority.sensitive;
    const suffix = encrypted ? '.sealed' : '';
    const snapshotPath =
      path.posix.join('state', safeSegment(authority.id), ...relativePath.split(path.sep).map(safeSegment)) + suffix;
    if (capturedSnapshotPaths.has(snapshotPath)) {
      throw new Error(`Recovery sources collide at snapshot path: ${snapshotPath}`);
    }
    capturedSnapshotPaths.add(snapshotPath);
    await assertDestinationStable();
    const artifactBytes = encrypted ? await sealBytes(sourceBytes) : Buffer.from(sourceBytes);
    const snapshotStat = await writeRecoveryArtifact(staging, snapshotPath, artifactBytes, async () => {
      await assertDestinationStable();
      await beforeArtifactWrite?.();
      await assertDestinationStable();
    });
    await assertDestinationStable();

    return {
      id: `${safeSegment(authority.id)}-${ordinal}`,
      authority: authority.id,
      logicalRole: options.logicalRole ?? relativePath.replaceAll(path.sep, '/'),
      sourcePath: options.manifestSourcePath ?? sourcePath,
      snapshotPath,
      restorePath: options.restorePath,
      size: snapshotStat.size,
      mtimeMs: sourceStat.mtimeMs,
      sha256: createHash('sha256').update(artifactBytes).digest('hex'),
      sensitive: authority.sensitive,
      copyPolicy: encrypted ? 'encrypted-copy' : 'copied',
      state: 'complete',
    };
  } finally {
    if (authority.sensitive) sourceBytes?.fill(0);
    if (openedSourceHandle && !sourceHandle) await openedSourceHandle.close();
  }
}

function logicalStatus(
  logicalStateId: RecoveryManifestLogicalState['id'],
  authorityIds: StateAuthorityId[],
  coverage: Map<StateAuthorityId, AuthorityCoverage>
): RecoveryManifestLogicalState['status'] {
  const values = new Set(authorityIds.map((id) => coverage.get(id) ?? 'missing'));
  if (values.has('missing')) return 'missing';
  if (values.has('reference-only')) return 'reference-only';
  if (values.has('excluded')) return 'excluded';
  if (
    [...values].every((value) => value === 'absent') &&
    (logicalStateId === 'core.engine-state' ||
      logicalStateId === 'external.backend-handles' ||
      logicalStateId === 'external.workspaces')
  ) {
    return 'excluded';
  }
  return 'accounted';
}

async function readManifest(manifestPath: string): Promise<RecoveryManifest> {
  return JSON.parse(await readFile(manifestPath, 'utf8')) as RecoveryManifest;
}

/**
 * Build an all-or-nothing recovery point. Capture happens in a private staging
 * directory and is published by one rename only after manifest and file proof
 * pass. Live state is read but never renamed, deleted, or repaired.
 */
export async function buildRecoveryPoint(
  inputs: BuildRecoveryPointInputs,
  dependencies: RecoveryPointBuilderDependencies
): Promise<BuiltRecoveryPoint> {
  const corePresent = (['core.default-profile', 'core.named-profiles'] as const).some((id) => {
    const state = inputs.inventory.authorities.find((authority) => authority.id === id)?.state;
    return state !== undefined && state !== 'absent';
  });
  const dryRun = evaluateRecoveryDryRun(inputs.inventory, {
    sqliteOnlineBackup: true,
    desktopQuiescence: true,
    coreQuiescence: !corePresent || Boolean(dependencies.acquireCoreQuiescence),
    mutationEpoch: true,
    sealedSensitiveCopies: true,
  });
  if (!dryRun.readyToCapture) throw new RecoveryPointBuildBlockedError(dryRun);

  const snapshotId = safeSegment(dependencies.createSnapshotId?.() ?? randomUUID());
  const destinationAdmission = await admitRecoveryDestination(
    inputs.destinationRoot,
    inputs.protectedRoots ?? [],
    dependencies.allowUnsafePathFallbackForTests
  );
  const destinationRoot = destinationAdmission.operationRoot;
  const finalRoot = path.join(destinationRoot, snapshotId);
  const publicFinalRoot = path.join(destinationAdmission.requestedRoot, snapshotId);
  let stagingRoot: string | undefined;
  let stagingAdmission: RecoveryStagingAdmission | undefined;
  let published = false;
  let builtResult: BuiltRecoveryPoint | undefined;
  const authorityFiles = new Map<StateAuthorityId, RecoveryManifestFile[]>();
  const capturedSnapshotPaths = new Set<string>();
  const sourceAdmissions = new Map<string, RecoverySourceAdmission>();
  let desktopLease: RecoverySnapshotLease | undefined;
  let coreLease: RecoverySnapshotLease | undefined;
  let mutationStart = '';
  let mutationEnd = '';
  let artifactWriteHook = dependencies.beforeFirstArtifactWrite;
  let primaryError: unknown;
  const cleanupFailures: Error[] = [];

  try {
    await dependencies.afterDestinationAdmission?.();
    await assertRecoveryDestinationStable(destinationAdmission);
    try {
      await lstat(finalRoot);
      throw new Error(`Recovery point already exists: ${publicFinalRoot}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    stagingRoot = await mkdtemp(path.join(destinationRoot, `.${snapshotId}.incomplete-`));
    stagingAdmission = await admitRecoveryStaging(stagingRoot);
    await assertRecoveryDestinationStable(destinationAdmission);
    desktopLease = await dependencies.acquireDesktopQuiescence();
    if (corePresent) coreLease = await dependencies.acquireCoreQuiescence!();
    for (const authorityPlan of dryRun.authorities) {
      if (!COPIED_COVERAGE.has(authorityPlan.coverage) || authorityPlan.id === 'desktop.database') continue;
      const authority = inputs.inventory.authorities.find(({ id }) => id === authorityPlan.id);
      if (!authority) throw new Error(`Recovery authority disappeared: ${authorityPlan.id}`);
      for (const [evidenceIndex, evidence] of authority.evidence.entries()) {
        if (evidence.state === 'absent') continue;
        // Pin every copied authority root before the mutation epoch begins.
        // oxlint-disable-next-line no-await-in-loop
        const admission = await admitRecoverySource(evidence, Boolean(dependencies.allowUnsafePathFallbackForTests));
        sourceAdmissions.set(`${authority.id}\0${evidenceIndex}`, admission);
      }
    }
    mutationStart = await dependencies.readMutationEpoch();

    for (const authorityPlan of dryRun.authorities) {
      if (!COPIED_COVERAGE.has(authorityPlan.coverage)) continue;
      const authority = inputs.inventory.authorities.find(({ id }) => id === authorityPlan.id);
      if (!authority) throw new Error(`Recovery authority disappeared: ${authorityPlan.id}`);
      const captured: RecoveryManifestFile[] = [];

      if (authority.id === 'desktop.database') {
        const databaseSource = authority.evidence[0]?.path;
        if (!databaseSource) throw new Error('Desktop database source is missing.');
        // Authorities are captured serially under one mutation epoch.
        // oxlint-disable-next-line no-await-in-loop
        const databaseBytes = await dependencies.captureSqliteOnline(databaseSource);
        if (!Buffer.isBuffer(databaseBytes) || databaseBytes.length === 0) {
          throw new Error('SQLite online snapshot did not return a non-empty in-memory image.');
        }
        captured.push(
          // oxlint-disable-next-line no-await-in-loop
          await addCapturedFile({
            authority,
            sourcePath: databaseSource,
            manifestSourcePath: databaseSource,
            relativePath: 'wayland.db',
            restorePath: 'desktop/database/wayland.db',
            logicalRole: 'desktop SQLite online backup',
            staging: stagingAdmission,
            sealBytes: dependencies.sealBytes,
            capturedSnapshotPaths,
            ordinal: 0,
            assertDestinationStable: () => assertRecoveryDestinationStable(destinationAdmission),
            beforeArtifactWrite: artifactWriteHook
              ? async () => {
                  const hook = artifactWriteHook;
                  artifactWriteHook = undefined;
                  await hook?.();
                }
              : undefined,
            capturedBytes: databaseBytes,
          })
        );
      } else {
        let ordinal = 0;
        for (const [evidenceIndex, evidence] of authority.evidence.entries()) {
          if (evidence.state === 'absent') continue;
          const admission = sourceAdmissions.get(`${authority.id}\0${evidenceIndex}`);
          if (!admission) throw new Error(`Recovery source admission disappeared: ${authority.id}/${evidenceIndex}`);
          // Descriptor-relative traversal opens and consumes each descendant while its parent handle is pinned.
          // oxlint-disable-next-line no-await-in-loop
          await visitAdmittedSourceFiles(
            admission,
            async ({ sourcePath, relativePath, handle }) => {
              const manifestFilePath =
                evidence.state === 'file' ? evidence.path : path.join(evidence.path, relativePath);
              if (!authorityOwnsFile(authority.id, evidence.path, evidence.state, manifestFilePath)) return;
              captured.push(
                await addCapturedFile({
                  authority,
                  sourcePath,
                  manifestSourcePath: manifestFilePath,
                  relativePath: `${evidenceIndex}-${relativePath}`,
                  restorePath: recoveryRestorePath(
                    authority.id,
                    evidence.path,
                    evidence.state,
                    manifestFilePath,
                    evidence.authorityRelativePath
                  ),
                  staging: stagingAdmission,
                  sealBytes: dependencies.sealBytes,
                  capturedSnapshotPaths,
                  ordinal: ordinal++,
                  sourceHandle: handle,
                  assertDestinationStable: () => assertRecoveryDestinationStable(destinationAdmission),
                  beforeArtifactWrite: artifactWriteHook
                    ? async () => {
                        const hook = artifactWriteHook;
                        artifactWriteHook = undefined;
                        await hook?.();
                      }
                    : undefined,
                })
              );
            },
            dependencies.beforeSourceEntryOpen
          );
        }
      }
      authorityFiles.set(authority.id, captured);
    }

    mutationEnd = await dependencies.readMutationEpoch();
    if (mutationStart !== mutationEnd) {
      throw new Error(`State changed during recovery capture (${mutationStart} -> ${mutationEnd}).`);
    }

    if (coreLease) await coreLease.release();
    coreLease = undefined;
    await desktopLease.release();
    desktopLease = undefined;

    const coverage = new Map(dryRun.authorities.map(({ id, coverage: value }) => [id, value]));
    const files = [...authorityFiles.values()].flat();
    const authorities: RecoveryManifestAuthority[] = inputs.inventory.authorities.map((authority) => ({
      id: authority.id,
      sourceRoot: sourceRoot(authority),
      coverage: coverage.get(authority.id) ?? 'missing',
      consistency: authority.requiredConsistency,
      requiredForRestore: authority.requiredForRestore,
      sensitive: authority.sensitive,
      fileIds: (authorityFiles.get(authority.id) ?? []).map(({ id }) => id),
      ...(authority.id === 'external.workspaces'
        ? {
            referenceIds: inputs.inventory.externalWorkspaces.map(({ projectId }) => projectId),
            referenceBindings: inputs.inventory.externalWorkspaces.map(
              ({ projectId: id, path: referencePath, state }) => ({
                id,
                path: referencePath,
                state,
              })
            ),
          }
        : authority.id === 'external.agent-configs'
          ? {
              referenceIds: inputs.inventory.externalAgentConfigs.map(({ backendId }) => backendId),
              referenceBindings: inputs.inventory.externalAgentConfigs.map(
                ({ backendId: id, path: referencePath, state }) => ({
                  id,
                  path: referencePath,
                  state,
                })
              ),
            }
          : {}),
      ...(authority.credentialBinding ? { credentialBinding: authority.credentialBinding } : {}),
      ...(COPIED_COVERAGE.has(coverage.get(authority.id) ?? 'missing') &&
      (authorityFiles.get(authority.id) ?? []).length === 0
        ? { empty: true as const }
        : {}),
      note: authority.note,
    }));
    const logicalState: RecoveryManifestLogicalState[] = inputs.inventory.logicalState.map((entry) => ({
      id: entry.id,
      status: logicalStatus(entry.id, entry.authorityIds, coverage),
      authorityIds: entry.authorityIds,
      note: entry.note,
    }));
    const manifest: RecoveryManifest = {
      formatVersion: RECOVERY_MANIFEST_FORMAT_VERSION,
      snapshotId,
      state: 'complete',
      createdAt: (dependencies.now?.() ?? new Date()).toISOString(),
      reason: inputs.reason,
      sourceAppVersion: inputs.sourceAppVersion,
      sourceReleaseTrack: inputs.inventory.sourceReleaseTrack,
      ...(inputs.targetAppVersion ? { targetAppVersion: inputs.targetAppVersion } : {}),
      desktopSchemaVersion: inputs.desktopSchemaVersion,
      platform: process.platform,
      arch: process.arch,
      mutationEpoch: { start: mutationStart, end: mutationEnd },
      authorities,
      logicalState,
      files,
      externalWorkspaces: inputs.inventory.externalWorkspaces.map(({ projectId, path: workspacePath, state }) => ({
        projectId,
        path: workspacePath,
        state,
        copyPolicy: 'reference-only',
      })),
      externalAgentConfigs: inputs.inventory.externalAgentConfigs.map(({ backendId, path: configPath, state }) => ({
        backendId,
        path: configPath,
        state,
        copyPolicy: 'reference-only',
      })),
    };

    const validation = validateRecoveryManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Built recovery manifest is invalid: ${validation.errors.map(({ code }) => code).join(', ')}`);
    }
    const manifestPath = path.join(stagingAdmission.operationRoot, 'manifest.json');
    await assertRecoveryDestinationStable(destinationAdmission);
    await writeRecoveryArtifact(stagingAdmission, 'manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
    await assertRecoveryDestinationStable(destinationAdmission);
    const verification = await verifyRecoverySnapshot(await readManifest(manifestPath), stagingAdmission.operationRoot);
    if (!verification.valid) {
      throw new Error(
        `Built recovery point failed verification: ${verification.errors.map(({ code }) => code).join(', ')}`
      );
    }

    await assertRecoveryDestinationStable(destinationAdmission);
    await stagingAdmission.handle?.close();
    stagingAdmission = undefined;
    await rename(stagingRoot, finalRoot);
    try {
      await assertRecoveryDestinationStable(destinationAdmission);
    } catch (error) {
      await rm(finalRoot, { recursive: true, force: true });
      throw error;
    }
    published = true;
    builtResult = {
      snapshotPath: publicFinalRoot,
      manifestPath: path.join(publicFinalRoot, 'manifest.json'),
      manifest,
      dryRun,
    };
  } catch (error) {
    primaryError = error;
  } finally {
    const cleanup = async (label: string, action: (() => Promise<void>) | undefined): Promise<void> => {
      if (!action) return;
      try {
        await action();
      } catch (error) {
        cleanupFailures.push(new Error(`Recovery cleanup failed for ${label}.`, { cause: error }));
      }
    };
    await cleanup('Core quiescence lease', coreLease ? () => coreLease.release() : undefined);
    await cleanup('Desktop quiescence lease', desktopLease ? () => desktopLease.release() : undefined);
    await cleanup('staging handle', stagingAdmission?.handle ? () => stagingAdmission.handle!.close() : undefined);
    const sourceHandles = [...sourceAdmissions.values()]
      .map(({ handle }) => handle)
      .filter((handle): handle is FileHandle => handle !== undefined);
    const sourceHandleResults = await Promise.allSettled(sourceHandles.map((handle) => handle.close()));
    for (const result of sourceHandleResults) {
      if (result.status === 'rejected') {
        cleanupFailures.push(
          new Error('Recovery cleanup failed for an admitted source handle.', { cause: result.reason })
        );
      }
    }
    await cleanup('staging output', stagingRoot ? () => rm(stagingRoot, { recursive: true, force: true }) : undefined);
    await cleanup(
      'unpublished final output',
      !published ? () => rm(finalRoot, { recursive: true, force: true }) : undefined
    );
    await cleanup(
      'destination handle',
      destinationAdmission.handle ? () => destinationAdmission.handle!.close() : undefined
    );
  }
  if (primaryError !== undefined && cleanupFailures.length > 0) {
    throw new AggregateError(
      [primaryError instanceof Error ? primaryError : new Error(String(primaryError)), ...cleanupFailures],
      'Recovery point capture failed and cleanup did not complete.',
      { cause: primaryError }
    );
  }
  if (primaryError !== undefined) throw primaryError;
  if (cleanupFailures.length > 0) {
    throw new AggregateError(cleanupFailures, 'Recovery point cleanup did not complete.');
  }
  if (!builtResult) throw new Error('Recovery point build completed without a result.');
  return builtResult;
}
