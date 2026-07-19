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
  captureSqliteOnline: (sourcePath: string) => Promise<{ bytes: Buffer; schemaVersion: number }>;
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
  /** Test seam used to replace an admitted ancestor immediately before publication. */
  beforePublication?: () => Promise<void>;
  /** Test seam used to replace an admitted ancestor immediately before output cleanup. */
  beforeOutputCleanup?: () => Promise<void>;
  /** Test seam used to prove nested handle-close failures preserve the primary error. */
  closeFileHandle?: (handle: FileHandle, role: RecoveryFileHandleRole) => Promise<void>;
  /** Test-only path fallback. Production callers must use descriptor-relative publication. */
  allowUnsafePathFallbackForTests?: boolean;
};

export type RecoveryFileHandleRole =
  | 'artifact-file'
  | 'artifact-parent'
  | 'captured-source'
  | 'source-descendant'
  | 'source-ancestor'
  | 'staging-root'
  | 'source-root'
  | 'destination-root';

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

export type RecoveryFilesystemSafetyMode = 'descriptor-relative' | 'unsupported';

/**
 * Linux exposes held directory descriptors through /proc. Node does not expose
 * an equivalent identity-bound child-operation primitive on Darwin or Windows,
 * so production capture fails closed there instead of trusting pathname checks.
 */
export function recoveryFilesystemSafetyModeForPlatform(platform: NodeJS.Platform): RecoveryFilesystemSafetyMode {
  return platform === 'linux' ? 'descriptor-relative' : 'unsupported';
}

const NO_FOLLOW = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
const DIRECTORY_ONLY = typeof constants.O_DIRECTORY === 'number' ? constants.O_DIRECTORY : 0;

const defaultCloseFileHandle = (handle: FileHandle): Promise<void> => handle.close();

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function throwPreservingCleanupFailures(primaryError: unknown, cleanupFailures: Error[], message: string): void {
  if (primaryError !== undefined && cleanupFailures.length > 0) {
    throw new AggregateError([asError(primaryError), ...cleanupFailures], message, { cause: primaryError });
  }
  if (primaryError !== undefined) throw primaryError;
  if (cleanupFailures.length > 0) throw new AggregateError(cleanupFailures, message);
}

async function closeRecoveryHandle(
  handle: FileHandle | undefined,
  role: RecoveryFileHandleRole,
  closeFileHandle: RecoveryPointBuilderDependencies['closeFileHandle'],
  failures: Error[]
): Promise<void> {
  if (!handle) return;
  try {
    await (closeFileHandle ?? defaultCloseFileHandle)(handle, role);
  } catch (error) {
    failures.push(new Error(`Recovery cleanup failed for ${role}.`, { cause: error }));
  }
}

type RecoverySourceAdmission = {
  requestedSourcePath: string;
  sourcePath: string;
  operationRoot: string;
  state: StateAuthorityInventory['evidence'][number]['state'];
  handle?: FileHandle;
  descriptorRelative: boolean;
  dev: number;
  ino: number;
  ancestors: RecoverySourceAncestorAdmission[];
};

type RecoverySourceAncestorAdmission = DestinationPathIdentity & { handle?: FileHandle };

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
  if (
    recoveryFilesystemSafetyModeForPlatform(process.platform) !== 'descriptor-relative' &&
    !allowUnsafePathFallbackForTests
  ) {
    throw new Error(
      `Recovery capture is unavailable on ${process.platform}: identity-bound filesystem publication is unsupported.`
    );
  }
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
  // The pathname branch below exists only for disposable tests on platforms
  // without descriptor-relative operations. Production was rejected above.
  if (process.platform === 'win32') {
    // Windows does not allow Node to open directories as FileHandles. This
    // identity-checked pathname branch is therefore test-only.
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
 * component-by-component. Production uses the held Linux parent descriptor for
 * the final create; pathname operation is limited to disposable test fixtures.
 */
async function writeRecoveryArtifact(
  staging: RecoveryStagingAdmission,
  relativePath: string,
  contents: Buffer,
  afterParentAdmission?: () => Promise<void>,
  closeFileHandle?: RecoveryPointBuilderDependencies['closeFileHandle']
): Promise<Stats> {
  const segments = assertSafeRelativeArtifactPath(relativePath);
  const fileName = segments.pop()!;
  const heldDirectories: Array<{ handle?: FileHandle; path: string; dev: number; ino: number }> = [];
  let operationDirectory = staging.operationRoot;
  let artifactHandle: FileHandle | undefined;
  let result: Stats | undefined;
  let primaryError: unknown;
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
    artifactHandle = await open(
      destinationPath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NO_FOLLOW,
      0o600
    );
    await artifactHandle.writeFile(contents);
    await artifactHandle.sync();
    const stat = await artifactHandle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || stat.size !== contents.length) {
      throw new Error(`Recovery artifact write was not a single-link regular file: ${relativePath}`);
    }
    result = stat;
  } catch (error) {
    primaryError = error;
  }
  const cleanupFailures: Error[] = [];
  await closeRecoveryHandle(artifactHandle, 'artifact-file', closeFileHandle, cleanupFailures);
  for (const directory of heldDirectories.toReversed()) {
    // Close in reverse admission order while retaining every failure.
    // oxlint-disable-next-line no-await-in-loop
    await closeRecoveryHandle(directory.handle, 'artifact-parent', closeFileHandle, cleanupFailures);
  }
  throwPreservingCleanupFailures(primaryError, cleanupFailures, 'Recovery artifact operation and cleanup failed.');
  if (!result) throw new Error(`Recovery artifact write completed without a result: ${relativePath}`);
  return result;
}

type AdmittedSourceFile = {
  sourcePath: string;
  namedSourcePath: string;
  relativePath: string;
  handle?: FileHandle;
};

type RecoverySourceProof = { sha256: string; dev: number; ino: number };

async function assertRecoverySourceRootStable(admission: RecoverySourceAdmission): Promise<void> {
  for (const ancestor of admission.ancestors) {
    // Rebind every component that gives the source pathname its authority.
    // A stable leaf inode is insufficient if an ancestor was replaced.
    // oxlint-disable-next-line no-await-in-loop
    const currentAncestor = await lstat(ancestor.path);
    // oxlint-disable-next-line no-await-in-loop
    const observedAncestor = ancestor.handle ? await ancestor.handle.stat() : currentAncestor;
    if (
      currentAncestor.isSymbolicLink() ||
      !currentAncestor.isDirectory() ||
      !observedAncestor.isDirectory() ||
      observedAncestor.dev !== ancestor.dev ||
      observedAncestor.ino !== ancestor.ino ||
      currentAncestor.dev !== ancestor.dev ||
      currentAncestor.ino !== ancestor.ino
    ) {
      throw new Error(`Recovery source ancestor identity changed after admission: ${ancestor.path}`);
    }
  }
  const [currentResolvedPath, currentRequested] = await Promise.all([
    realpath(admission.requestedSourcePath),
    lstat(admission.requestedSourcePath),
  ]);
  if (path.resolve(currentResolvedPath) !== path.resolve(admission.sourcePath)) {
    throw new Error(`Recovery source alias identity changed after admission: ${admission.requestedSourcePath}`);
  }
  if (
    currentRequested.isSymbolicLink() ||
    currentRequested.dev !== admission.dev ||
    currentRequested.ino !== admission.ino
  ) {
    throw new Error(`Recovery source pathname identity changed after admission: ${admission.requestedSourcePath}`);
  }
  const current = await lstat(admission.sourcePath);
  const observed = admission.handle ? await admission.handle.stat() : current;
  const expectedType =
    admission.state === 'directory'
      ? observed.isDirectory() && current.isDirectory()
      : observed.isFile() && current.isFile();
  if (
    !expectedType ||
    current.isSymbolicLink() ||
    observed.dev !== admission.dev ||
    observed.ino !== admission.ino ||
    current.dev !== admission.dev ||
    current.ino !== admission.ino
  ) {
    throw new Error(`Recovery source pathname identity changed after admission: ${admission.sourcePath}`);
  }
}

async function assertRecoverySourceAdmissionsStable(admissions: Iterable<RecoverySourceAdmission>): Promise<void> {
  for (const admission of admissions) {
    // Every admission is an independent authority edge and must be checked in
    // deterministic order at each commit boundary.
    // oxlint-disable-next-line no-await-in-loop
    await assertRecoverySourceRootStable(admission);
  }
}

async function readAdmittedFileFromStart(handle: FileHandle, size: number): Promise<Buffer> {
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new Error('Recovery source size is invalid.');
  }
  const bytes = Buffer.alloc(size);
  let offset = 0;
  while (offset < size) {
    // Positional reads are mandatory because file-root admissions reuse their
    // held descriptor during the final post-capture verification pass.
    // oxlint-disable-next-line no-await-in-loop
    const { bytesRead } = await handle.read(bytes, offset, size - offset, offset);
    if (bytesRead === 0) break;
    offset += bytesRead;
  }
  if (offset !== size) {
    bytes.fill(0);
    throw new Error(`Recovery source ended early: expected ${size} bytes, read ${offset}.`);
  }
  return bytes;
}

async function digestAdmittedSourceFile(
  sourcePath: string,
  namedSourcePath: string,
  sourceHandle?: FileHandle,
  closeFileHandle?: RecoveryPointBuilderDependencies['closeFileHandle']
): Promise<RecoverySourceProof> {
  const openedHandle = sourceHandle ?? (await open(sourcePath, constants.O_RDONLY | NO_FOLLOW));
  let sourceBytes: Buffer | undefined;
  let proof: RecoverySourceProof | undefined;
  let primaryError: unknown;
  try {
    const before = await openedHandle.stat();
    const current = await lstat(namedSourcePath);
    if (
      !before.isFile() ||
      current.isSymbolicLink() ||
      !current.isFile() ||
      before.dev !== current.dev ||
      before.ino !== current.ino ||
      before.nlink !== 1
    ) {
      throw new Error(`Recovery source identity changed before verification: ${sourcePath}`);
    }
    sourceBytes = await readAdmittedFileFromStart(openedHandle, before.size);
    const after = await openedHandle.stat();
    const currentAfter = await lstat(namedSourcePath);
    if (
      sourceBytes.length !== before.size ||
      after.dev !== before.dev ||
      after.ino !== before.ino ||
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      currentAfter.isSymbolicLink() ||
      !currentAfter.isFile() ||
      currentAfter.dev !== after.dev ||
      currentAfter.ino !== after.ino
    ) {
      throw new Error(`Recovery source changed while it was verified: ${sourcePath}`);
    }
    proof = {
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
      dev: after.dev,
      ino: after.ino,
    };
  } catch (error) {
    primaryError = error;
  } finally {
    sourceBytes?.fill(0);
  }
  const cleanupFailures: Error[] = [];
  if (!sourceHandle) {
    await closeRecoveryHandle(openedHandle, 'captured-source', closeFileHandle, cleanupFailures);
  }
  throwPreservingCleanupFailures(primaryError, cleanupFailures, 'Recovery source verification and cleanup failed.');
  if (!proof) throw new Error(`Recovery source verification completed without a digest: ${sourcePath}`);
  return proof;
}

async function visitAdmittedSourceFiles(
  admission: RecoverySourceAdmission,
  visitor: (file: AdmittedSourceFile) => Promise<void>,
  beforeSourceEntryOpen?: (relativePath: string) => Promise<void>,
  closeFileHandle?: RecoveryPointBuilderDependencies['closeFileHandle']
): Promise<void> {
  if (admission.state === 'file') {
    await visitor({
      sourcePath: admission.operationRoot,
      namedSourcePath: admission.sourcePath,
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
    const namedDirectory = path.join(admission.sourcePath, relativeRoot);
    const directoryIdentity = directoryHandle ? await directoryHandle.stat() : await lstat(operationDirectory);
    const currentDirectory = await lstat(namedDirectory);
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
      const namedCandidate = path.join(admission.sourcePath, relativePath);
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
      let primaryError: unknown;
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
          lstat(namedCandidate),
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
          await visitor({
            sourcePath: candidate,
            namedSourcePath: namedCandidate,
            relativePath,
            handle: childHandle,
          });
        } else {
          throw new Error(`Recovery source has an unsupported entry: ${relativePath}`);
        }
      } catch (error) {
        primaryError = error;
      }
      const cleanupFailures: Error[] = [];
      // oxlint-disable-next-line no-await-in-loop
      await closeRecoveryHandle(childHandle, 'source-descendant', closeFileHandle, cleanupFailures);
      throwPreservingCleanupFailures(
        primaryError,
        cleanupFailures,
        `Recovery source traversal and cleanup failed for ${relativePath}.`
      );
    }
  };
  await visitDirectory(admission.handle, '');
}

function recoverySourceAncestorPaths(sourcePath: string): string[] {
  const resolvedSource = path.resolve(sourcePath);
  const filesystemRoot = path.parse(resolvedSource).root;
  const paths: string[] = [];
  let cursor = path.dirname(resolvedSource);
  while (true) {
    paths.push(cursor);
    if (cursor === filesystemRoot) break;
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return paths.toReversed();
}

async function admitRecoverySourceAncestorChain(
  sourcePath: string,
  closeFileHandle?: RecoveryPointBuilderDependencies['closeFileHandle']
): Promise<RecoverySourceAncestorAdmission[]> {
  const ancestors: RecoverySourceAncestorAdmission[] = [];
  let primaryError: unknown;
  try {
    for (const ancestorPath of recoverySourceAncestorPaths(sourcePath)) {
      const parent = ancestors.at(-1);
      const operationPath =
        recoveryFilesystemSafetyModeForPlatform(process.platform) === 'descriptor-relative' && parent?.handle
          ? path.join(`/proc/self/fd/${parent.handle.fd}`, path.basename(ancestorPath))
          : ancestorPath;
      let handle: FileHandle | undefined;
      try {
        // oxlint-disable-next-line no-await-in-loop
        const expected = await lstat(operationPath);
        if (expected.isSymbolicLink() || !expected.isDirectory()) {
          throw new Error(`Recovery source ancestor is unsafe: ${ancestorPath}`);
        }
        // Windows directory handles are unavailable and production capture is
        // already rejected there. The pathname-only branch remains test-only.
        // oxlint-disable-next-line no-await-in-loop
        handle =
          process.platform === 'win32'
            ? undefined
            : // oxlint-disable-next-line no-await-in-loop
              await open(operationPath, constants.O_RDONLY | DIRECTORY_ONLY | NO_FOLLOW);
        // oxlint-disable-next-line no-await-in-loop
        const observed = handle ? await handle.stat() : expected;
        // oxlint-disable-next-line no-await-in-loop
        const current = await lstat(ancestorPath);
        if (
          current.isSymbolicLink() ||
          !current.isDirectory() ||
          !observed.isDirectory() ||
          observed.dev !== expected.dev ||
          observed.ino !== expected.ino ||
          current.dev !== observed.dev ||
          current.ino !== observed.ino
        ) {
          throw new Error(`Recovery source ancestor identity changed during admission: ${ancestorPath}`);
        }
        ancestors.push({ path: ancestorPath, handle, dev: observed.dev, ino: observed.ino });
      } catch (error) {
        const currentCleanupFailures: Error[] = [];
        // oxlint-disable-next-line no-await-in-loop
        await closeRecoveryHandle(handle, 'source-ancestor', closeFileHandle, currentCleanupFailures);
        throwPreservingCleanupFailures(
          error,
          currentCleanupFailures,
          `Recovery source ancestor admission failed for ${ancestorPath}.`
        );
      }
    }
  } catch (error) {
    primaryError = error;
  }
  if (primaryError !== undefined) {
    const cleanupFailures: Error[] = [];
    for (const ancestor of ancestors.toReversed()) {
      // oxlint-disable-next-line no-await-in-loop
      await closeRecoveryHandle(ancestor.handle, 'source-ancestor', closeFileHandle, cleanupFailures);
    }
    throwPreservingCleanupFailures(
      primaryError,
      cleanupFailures,
      'Recovery source ancestor admission and cleanup failed.'
    );
  }
  return ancestors;
}

async function admitRecoverySource(
  evidence: StateAuthorityInventory['evidence'][number],
  allowUnsafePathFallbackForTests: boolean,
  closeFileHandle?: RecoveryPointBuilderDependencies['closeFileHandle']
): Promise<RecoverySourceAdmission> {
  if (evidence.state !== 'file' && evidence.state !== 'directory') {
    throw new Error(`Recovery source cannot be admitted from state ${evidence.state}: ${evidence.path}`);
  }
  void allowUnsafePathFallbackForTests;
  const lexicalSource = await lstat(evidence.path);
  if (lexicalSource.isSymbolicLink()) {
    throw new Error(`Recovery source cannot be a symlink: ${evidence.path}`);
  }
  const lexicalTypeMatches = evidence.state === 'directory' ? lexicalSource.isDirectory() : lexicalSource.isFile();
  if (!lexicalTypeMatches) {
    throw new Error(`Recovery source type does not match inventory: ${evidence.path}`);
  }
  // Resolve platform-owned aliases such as macOS /var -> /private/var once,
  // then admit and operate against the complete canonical ancestor chain.
  const canonicalSourcePath = await realpath(evidence.path);
  const ancestors = await admitRecoverySourceAncestorChain(canonicalSourcePath, closeFileHandle);
  const closeAncestorsOnFailure = async (primaryError: unknown): Promise<never> => {
    const cleanupFailures: Error[] = [];
    for (const ancestor of ancestors.toReversed()) {
      // oxlint-disable-next-line no-await-in-loop
      await closeRecoveryHandle(ancestor.handle, 'source-ancestor', closeFileHandle, cleanupFailures);
    }
    throwPreservingCleanupFailures(primaryError, cleanupFailures, 'Recovery source admission and cleanup failed.');
    throw primaryError;
  };
  const closeLeafAndAncestorsOnFailure = async (handle: FileHandle, primaryError: unknown): Promise<never> => {
    const leafCleanupFailures: Error[] = [];
    await closeRecoveryHandle(handle, 'source-root', closeFileHandle, leafCleanupFailures);
    const errorWithLeafCleanup =
      leafCleanupFailures.length > 0
        ? new AggregateError([asError(primaryError), ...leafCleanupFailures], 'Recovery source admission failed.', {
            cause: primaryError,
          })
        : primaryError;
    return closeAncestorsOnFailure(errorWithLeafCleanup);
  };
  const deepestAncestor = ancestors.at(-1);
  const operationPath =
    recoveryFilesystemSafetyModeForPlatform(process.platform) === 'descriptor-relative' && deepestAncestor?.handle
      ? path.join(`/proc/self/fd/${deepestAncestor.handle.fd}`, path.basename(canonicalSourcePath))
      : canonicalSourcePath;
  if (recoveryFilesystemSafetyModeForPlatform(process.platform) !== 'descriptor-relative') {
    let expected: Awaited<ReturnType<typeof lstat>>;
    try {
      expected = await lstat(operationPath);
    } catch (error) {
      return closeAncestorsOnFailure(error);
    }
    if (expected.isSymbolicLink()) {
      return closeAncestorsOnFailure(new Error(`Recovery source cannot be a symlink: ${evidence.path}`));
    }
    if (expected.dev !== lexicalSource.dev || expected.ino !== lexicalSource.ino) {
      return closeAncestorsOnFailure(
        new Error(`Recovery source identity changed while its canonical path was admitted: ${evidence.path}`)
      );
    }
    const expectedType = evidence.state === 'directory' ? expected.isDirectory() : expected.isFile();
    if (!expectedType) {
      return closeAncestorsOnFailure(new Error(`Recovery source type does not match inventory: ${evidence.path}`));
    }
    if (process.platform === 'win32') {
      return {
        requestedSourcePath: evidence.path,
        sourcePath: canonicalSourcePath,
        operationRoot: canonicalSourcePath,
        state: evidence.state,
        descriptorRelative: false,
        dev: expected.dev,
        ino: expected.ino,
        ancestors,
      };
    }
    const flags = constants.O_RDONLY | NO_FOLLOW | (evidence.state === 'directory' ? DIRECTORY_ONLY : 0);
    let handle: FileHandle;
    try {
      handle = await open(operationPath, flags);
    } catch (error) {
      return closeAncestorsOnFailure(error);
    }
    try {
      const observed = await handle.stat();
      const current = await lstat(canonicalSourcePath);
      const observedType = evidence.state === 'directory' ? observed.isDirectory() : observed.isFile();
      if (
        !observedType ||
        current.isSymbolicLink() ||
        observed.dev !== expected.dev ||
        observed.ino !== expected.ino ||
        current.dev !== observed.dev ||
        current.ino !== observed.ino
      ) {
        throw new Error(`Recovery source identity changed during admission: ${evidence.path}`);
      }
      return {
        requestedSourcePath: evidence.path,
        sourcePath: canonicalSourcePath,
        operationRoot: canonicalSourcePath,
        state: evidence.state,
        handle,
        descriptorRelative: false,
        dev: observed.dev,
        ino: observed.ino,
        ancestors,
      };
    } catch (error) {
      return closeLeafAndAncestorsOnFailure(handle, error);
    }
  }

  let expected: Awaited<ReturnType<typeof lstat>>;
  try {
    expected = await lstat(operationPath);
  } catch (error) {
    return closeAncestorsOnFailure(error);
  }
  if (expected.dev !== lexicalSource.dev || expected.ino !== lexicalSource.ino) {
    return closeAncestorsOnFailure(
      new Error(`Recovery source identity changed while its canonical path was admitted: ${evidence.path}`)
    );
  }
  const flags = constants.O_RDONLY | NO_FOLLOW | (evidence.state === 'directory' ? DIRECTORY_ONLY : 0);
  let handle: FileHandle;
  try {
    handle = await open(operationPath, flags);
  } catch (error) {
    return closeAncestorsOnFailure(error);
  }
  try {
    const observed = await handle.stat();
    const current = await lstat(canonicalSourcePath);
    const expectedType = evidence.state === 'directory' ? observed.isDirectory() : observed.isFile();
    if (
      !expectedType ||
      current.isSymbolicLink() ||
      observed.dev !== expected.dev ||
      observed.ino !== expected.ino ||
      current.dev !== observed.dev ||
      current.ino !== observed.ino
    ) {
      throw new Error(`Recovery source identity changed during admission: ${evidence.path}`);
    }
    return {
      requestedSourcePath: evidence.path,
      sourcePath: canonicalSourcePath,
      operationRoot: `/proc/self/fd/${handle.fd}`,
      state: evidence.state,
      handle,
      descriptorRelative: true,
      dev: observed.dev,
      ino: observed.ino,
      ancestors,
    };
  } catch (error) {
    return closeLeafAndAncestorsOnFailure(handle, error);
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
  namedSourcePath?: string;
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
  closeFileHandle?: RecoveryPointBuilderDependencies['closeFileHandle'];
}): Promise<{ manifestFile: RecoveryManifestFile; sourceProof: RecoverySourceProof }> {
  const {
    authority,
    sourcePath,
    namedSourcePath = sourcePath,
    relativePath,
    staging,
    sealBytes,
    capturedSnapshotPaths,
    ordinal,
    assertDestinationStable,
    beforeArtifactWrite,
    sourceHandle,
    capturedBytes,
    closeFileHandle,
  } = options;
  const sourceStat = sourceHandle ? await sourceHandle.stat() : await assertRegularFile(sourcePath, 'Recovery source');
  const openedSourceHandle = capturedBytes
    ? undefined
    : (sourceHandle ?? (await open(sourcePath, constants.O_RDONLY | NO_FOLLOW)));
  let sourceBytes: Buffer | undefined;
  let result: { manifestFile: RecoveryManifestFile; sourceProof: RecoverySourceProof } | undefined;
  let primaryError: unknown;
  try {
    if (capturedBytes) {
      sourceBytes = capturedBytes;
    } else {
      if (!openedSourceHandle) throw new Error(`Recovery source handle disappeared: ${sourcePath}`);
      const handleStat = await openedSourceHandle.stat();
      const currentStat = await lstat(namedSourcePath);
      if (
        !handleStat.isFile() ||
        currentStat.isSymbolicLink() ||
        !currentStat.isFile() ||
        handleStat.dev !== sourceStat.dev ||
        handleStat.ino !== sourceStat.ino ||
        currentStat.dev !== handleStat.dev ||
        currentStat.ino !== handleStat.ino
      ) {
        throw new Error(`Recovery source identity changed before capture: ${sourcePath}`);
      }
      sourceBytes = await readAdmittedFileFromStart(openedSourceHandle, handleStat.size);
      const afterReadStat = await openedSourceHandle.stat();
      const currentAfterRead = await lstat(namedSourcePath);
      if (
        sourceBytes.length !== handleStat.size ||
        afterReadStat.dev !== handleStat.dev ||
        afterReadStat.ino !== handleStat.ino ||
        afterReadStat.size !== handleStat.size ||
        afterReadStat.mtimeMs !== handleStat.mtimeMs ||
        currentAfterRead.isSymbolicLink() ||
        !currentAfterRead.isFile() ||
        currentAfterRead.dev !== afterReadStat.dev ||
        currentAfterRead.ino !== afterReadStat.ino
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
    const snapshotStat = await writeRecoveryArtifact(
      staging,
      snapshotPath,
      artifactBytes,
      async () => {
        await assertDestinationStable();
        await beforeArtifactWrite?.();
        await assertDestinationStable();
      },
      closeFileHandle
    );
    await assertDestinationStable();
    if (openedSourceHandle) {
      const [observed, current] = await Promise.all([openedSourceHandle.stat(), lstat(namedSourcePath)]);
      if (
        !observed.isFile() ||
        current.isSymbolicLink() ||
        !current.isFile() ||
        current.dev !== observed.dev ||
        current.ino !== observed.ino
      ) {
        throw new Error(`Recovery source pathname identity changed during capture: ${namedSourcePath}`);
      }
    }

    result = {
      sourceProof: {
        sha256: createHash('sha256').update(sourceBytes).digest('hex'),
        dev: sourceStat.dev,
        ino: sourceStat.ino,
      },
      manifestFile: {
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
      },
    };
  } catch (error) {
    primaryError = error;
  } finally {
    if (authority.sensitive) sourceBytes?.fill(0);
  }
  const cleanupFailures: Error[] = [];
  if (openedSourceHandle && !sourceHandle) {
    await closeRecoveryHandle(openedSourceHandle, 'captured-source', closeFileHandle, cleanupFailures);
  }
  throwPreservingCleanupFailures(primaryError, cleanupFailures, 'Recovery source capture and cleanup failed.');
  if (!result) throw new Error(`Recovery source capture completed without a result: ${sourcePath}`);
  return result;
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
  const capturedSourceProofs = new Map<string, RecoverySourceProof>();
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
      if (!COPIED_COVERAGE.has(authorityPlan.coverage)) continue;
      const authority = inputs.inventory.authorities.find(({ id }) => id === authorityPlan.id);
      if (!authority) throw new Error(`Recovery authority disappeared: ${authorityPlan.id}`);
      for (const [evidenceIndex, evidence] of authority.evidence.entries()) {
        if (evidence.state === 'absent') continue;
        // Pin every copied authority root before the mutation epoch begins.
        // oxlint-disable-next-line no-await-in-loop
        const admission = await admitRecoverySource(
          evidence,
          Boolean(dependencies.allowUnsafePathFallbackForTests),
          dependencies.closeFileHandle
        );
        sourceAdmissions.set(`${authority.id}\0${evidenceIndex}`, admission);
      }
    }
    mutationStart = await dependencies.readMutationEpoch();
    // The epoch callback may itself observe or trigger namespace changes.
    // Rebind every held root to its authoritative pathname afterwards.
    await assertRecoverySourceAdmissionsStable(sourceAdmissions.values());

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
        const databaseCapture = await dependencies.captureSqliteOnline(databaseSource);
        const databaseBytes = databaseCapture.bytes;
        if (!Buffer.isBuffer(databaseBytes) || databaseBytes.length === 0) {
          throw new Error('SQLite online snapshot did not return a non-empty in-memory image.');
        }
        if (databaseCapture.schemaVersion !== inputs.desktopSchemaVersion) {
          databaseBytes.fill(0);
          throw new Error(
            `SQLite schema changed during recovery capture (${inputs.desktopSchemaVersion} -> ${databaseCapture.schemaVersion}).`
          );
        }
        // oxlint-disable-next-line no-await-in-loop -- authorities are captured under one ordered mutation epoch.
        const databaseFile = await addCapturedFile({
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
          closeFileHandle: dependencies.closeFileHandle,
        });
        captured.push(databaseFile.manifestFile);
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
            async ({ sourcePath, namedSourcePath, relativePath, handle }) => {
              const manifestFilePath =
                evidence.state === 'file' ? evidence.path : path.join(evidence.path, relativePath);
              if (!authorityOwnsFile(authority.id, evidence.path, evidence.state, manifestFilePath)) return;
              const capturedFile = await addCapturedFile({
                authority,
                sourcePath,
                namedSourcePath,
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
                closeFileHandle: dependencies.closeFileHandle,
              });
              captured.push(capturedFile.manifestFile);
              capturedSourceProofs.set(
                `${authority.id}\0${evidenceIndex}\0${relativePath.split(path.sep).join('/')}`,
                capturedFile.sourceProof
              );
            },
            dependencies.beforeSourceEntryOpen,
            dependencies.closeFileHandle
          );
        }
      }
      authorityFiles.set(authority.id, captured);
    }

    mutationEnd = await dependencies.readMutationEpoch();
    if (mutationStart !== mutationEnd) {
      throw new Error(`State changed during recovery capture (${mutationStart} -> ${mutationEnd}).`);
    }
    // Bind roots again after the final epoch read, before any output can be published.
    await assertRecoverySourceAdmissionsStable(sourceAdmissions.values());

    const verifiedSourceProofs = new Map<string, RecoverySourceProof>();
    for (const authorityPlan of dryRun.authorities) {
      if (!COPIED_COVERAGE.has(authorityPlan.coverage) || authorityPlan.id === 'desktop.database') continue;
      const authority = inputs.inventory.authorities.find(({ id }) => id === authorityPlan.id);
      if (!authority) throw new Error(`Recovery authority disappeared during source verification: ${authorityPlan.id}`);
      for (const [evidenceIndex, evidence] of authority.evidence.entries()) {
        if (evidence.state === 'absent') continue;
        const admission = sourceAdmissions.get(`${authority.id}\0${evidenceIndex}`);
        if (!admission) throw new Error(`Recovery source admission disappeared: ${authority.id}/${evidenceIndex}`);
        // Revisit the admitted identity after capture. This binds the bytes to
        // the capture itself and defeats equal-epoch ABA replacements.
        // oxlint-disable-next-line no-await-in-loop
        await visitAdmittedSourceFiles(
          admission,
          async ({ sourcePath, namedSourcePath, relativePath, handle }) => {
            const manifestFilePath = evidence.state === 'file' ? evidence.path : path.join(evidence.path, relativePath);
            if (!authorityOwnsFile(authority.id, evidence.path, evidence.state, manifestFilePath)) return;
            const key = `${authority.id}\0${evidenceIndex}\0${relativePath.split(path.sep).join('/')}`;
            if (verifiedSourceProofs.has(key)) throw new Error(`Recovery source verification duplicated ${key}.`);
            verifiedSourceProofs.set(
              key,
              await digestAdmittedSourceFile(sourcePath, namedSourcePath, handle, dependencies.closeFileHandle)
            );
          },
          undefined,
          dependencies.closeFileHandle
        );
      }
    }
    if (verifiedSourceProofs.size !== capturedSourceProofs.size) {
      throw new Error('Recovery source set changed after capture.');
    }
    for (const [key, capturedProof] of capturedSourceProofs) {
      const verifiedProof = verifiedSourceProofs.get(key);
      if (!verifiedProof || verifiedProof.sha256 !== capturedProof.sha256) {
        throw new Error(`Recovery source bytes changed after capture: ${key.split('\0').join('/')}`);
      }
      if (verifiedProof.dev !== capturedProof.dev || verifiedProof.ino !== capturedProof.ino) {
        throw new Error(`Recovery source identity changed after capture: ${key.split('\0').join('/')}`);
      }
    }
    // Verification itself is asynchronous and can overlap a namespace swap.
    // Rebind the complete authority ancestry after the pass while quiescence is
    // still held; a pre-verification check is not publication authority.
    await assertRecoverySourceAdmissionsStable(sourceAdmissions.values());

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
    await writeRecoveryArtifact(
      stagingAdmission,
      'manifest.json',
      Buffer.from(JSON.stringify(manifest, null, 2)),
      undefined,
      dependencies.closeFileHandle
    );
    await assertRecoveryDestinationStable(destinationAdmission);
    const verification = await verifyRecoverySnapshot(await readManifest(manifestPath), stagingAdmission.operationRoot);
    if (!verification.valid) {
      throw new Error(
        `Built recovery point failed verification: ${verification.errors.map(({ code }) => code).join(', ')}`
      );
    }

    await assertRecoveryDestinationStable(destinationAdmission);
    if (stagingAdmission.handle) {
      const stagingCloseFailures: Error[] = [];
      await closeRecoveryHandle(
        stagingAdmission.handle,
        'staging-root',
        dependencies.closeFileHandle,
        stagingCloseFailures
      );
      throwPreservingCleanupFailures(undefined, stagingCloseFailures, 'Recovery staging cleanup failed.');
    }
    stagingAdmission = undefined;
    await dependencies.beforePublication?.();
    // The publication seam is attacker-controlled in hostile tests and an
    // asynchronous boundary in production. Check on both sides of the atomic
    // rename so the committed snapshot is bound to the admitted source roots.
    await assertRecoverySourceAdmissionsStable(sourceAdmissions.values());
    await rename(stagingRoot, finalRoot);
    try {
      await assertRecoveryDestinationStable(destinationAdmission);
      await assertRecoverySourceAdmissionsStable(sourceAdmissions.values());
    } catch (error) {
      const cleanupErrors: Error[] = [];
      try {
        await rm(finalRoot, { recursive: true, force: true });
      } catch (cleanupError) {
        cleanupErrors.push(
          new Error('Recovery cleanup failed for identity-invalid published output.', { cause: cleanupError })
        );
      }
      throwPreservingCleanupFailures(error, cleanupErrors, 'Recovery publication identity check and cleanup failed.');
    }
    if (coreLease) await coreLease.release();
    coreLease = undefined;
    await desktopLease.release();
    desktopLease = undefined;
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
    await cleanup(
      'staging handle',
      stagingAdmission?.handle
        ? () => (dependencies.closeFileHandle ?? defaultCloseFileHandle)(stagingAdmission!.handle!, 'staging-root')
        : undefined
    );
    const sourceHandles: Array<{ handle: FileHandle; role: 'source-root' | 'source-ancestor' }> = [];
    for (const admission of sourceAdmissions.values()) {
      if (admission.handle) sourceHandles.push({ handle: admission.handle, role: 'source-root' });
      for (const ancestor of admission.ancestors.toReversed()) {
        if (ancestor.handle) sourceHandles.push({ handle: ancestor.handle, role: 'source-ancestor' });
      }
    }
    const sourceHandleResults = await Promise.allSettled(
      sourceHandles.map(({ handle, role }) => (dependencies.closeFileHandle ?? defaultCloseFileHandle)(handle, role))
    );
    for (const result of sourceHandleResults) {
      if (result.status === 'rejected') {
        cleanupFailures.push(
          new Error('Recovery cleanup failed for an admitted source handle.', { cause: result.reason })
        );
      }
    }
    await cleanup('pre-output-cleanup hook', primaryError !== undefined ? dependencies.beforeOutputCleanup : undefined);
    await cleanup('staging output', stagingRoot ? () => rm(stagingRoot, { recursive: true, force: true }) : undefined);
    await cleanup(
      'unpublished final output',
      !published ? () => rm(finalRoot, { recursive: true, force: true }) : undefined
    );
    await cleanup(
      'destination handle',
      destinationAdmission.handle
        ? () =>
            (dependencies.closeFileHandle ?? defaultCloseFileHandle)(destinationAdmission.handle!, 'destination-root')
        : undefined
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
