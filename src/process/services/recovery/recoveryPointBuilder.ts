/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import { constants, createReadStream, type Stats } from 'node:fs';
import {
  copyFile,
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
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
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
import type { RecoveryInventory, StateAuthorityInventory } from './stateAuthorityInventory';

export type RecoverySnapshotLease = { release: () => Promise<void> };

export type RecoveryPointBuilderDependencies = {
  /** Produce an application-consistent SQLite backup at destinationPath. */
  captureSqliteOnline: (sourcePath: string, destinationPath: string) => Promise<void>;
  /** Seal one file into destinationPath. The output must be a regular file. */
  sealFile: (sourcePath: string, destinationPath: string) => Promise<void>;
  acquireDesktopQuiescence: () => Promise<RecoverySnapshotLease>;
  acquireCoreQuiescence?: () => Promise<RecoverySnapshotLease>;
  readMutationEpoch: () => Promise<string>;
  now?: () => Date;
  createSnapshotId?: () => string;
  /** Test seam used to prove destination identity is revalidated after admission. */
  afterDestinationAdmission?: () => Promise<void>;
  /** Test seam used to prove pathname swaps cannot redirect an artifact write. */
  beforeFirstArtifactWrite?: () => Promise<void>;
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
  handle: FileHandle;
  pathIdentities: DestinationPathIdentity[];
  canonicalProtectedRoots: string[];
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
  protectedRoots: readonly string[]
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
  const canonicalProtectedRoots = await Promise.all(protectedRoots.map((candidate) => canonicalizePotentialPath(candidate)));
  for (const [index, canonicalProtectedRoot] of canonicalProtectedRoots.entries()) {
    if (pathsOverlap(canonicalRoot, canonicalProtectedRoot)) {
      throw new Error(`Recovery destination must be disjoint from live state: ${protectedRoots[index]}`);
    }
  }
  if (process.platform !== 'darwin' && process.platform !== 'linux') {
    throw new Error('Recovery destination publication requires descriptor-relative filesystem support.');
  }
  const directoryFlags = constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW;
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
    const operationRoot = process.platform === 'linux' ? `/proc/self/fd/${handle.fd}` : canonicalRoot;
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

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function assertRegularFile(filePath: string, label: string): Promise<Stats> {
  const stat = await lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular file: ${filePath}`);
  return stat;
}

async function listContainedFiles(root: string): Promise<string[]> {
  const stat = await lstat(root);
  if (stat.isSymbolicLink()) throw new Error(`Recovery source cannot be a symlink: ${root}`);
  if (stat.isFile()) return [root];
  if (!stat.isDirectory()) throw new Error(`Recovery source has an unsupported type: ${root}`);

  const files: string[] = [];
  const visit = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
    for (const entry of entries) {
      const candidate = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Recovery source contains a symlink: ${candidate}`);
      // oxlint-disable-next-line no-await-in-loop
      if (entry.isDirectory()) await visit(candidate);
      else if (entry.isFile()) files.push(candidate);
      else throw new Error(`Recovery source has an unsupported entry: ${candidate}`);
    }
  };
  await visit(root);
  return files;
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
  stagingRoot: string;
  sealFile: RecoveryPointBuilderDependencies['sealFile'];
  capturedSnapshotPaths: Set<string>;
  ordinal: number;
  assertDestinationStable: () => Promise<void>;
  beforeArtifactWrite?: () => Promise<void>;
}): Promise<RecoveryManifestFile> {
  const {
    authority,
    sourcePath,
    relativePath,
    stagingRoot,
    sealFile,
    capturedSnapshotPaths,
    ordinal,
    assertDestinationStable,
    beforeArtifactWrite,
  } = options;
  const sourceStat = await assertRegularFile(sourcePath, 'Recovery source');
  const encrypted = authority.sensitive;
  const suffix = encrypted ? '.sealed' : '';
  const snapshotPath =
    path.posix.join('state', safeSegment(authority.id), ...relativePath.split(path.sep).map(safeSegment)) + suffix;
  if (capturedSnapshotPaths.has(snapshotPath)) {
    throw new Error(`Recovery sources collide at snapshot path: ${snapshotPath}`);
  }
  capturedSnapshotPaths.add(snapshotPath);
  const destinationPath = path.join(stagingRoot, ...snapshotPath.split('/'));
  await assertDestinationStable();
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await assertDestinationStable();
  await beforeArtifactWrite?.();
  await assertDestinationStable();
  if (encrypted) await sealFile(sourcePath, destinationPath);
  else await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL);
  await assertDestinationStable();
  const snapshotStat = await assertRegularFile(destinationPath, 'Recovery artifact');

  return {
    id: `${safeSegment(authority.id)}-${ordinal}`,
    authority: authority.id,
    logicalRole: options.logicalRole ?? relativePath.replaceAll(path.sep, '/'),
    sourcePath: options.manifestSourcePath ?? sourcePath,
    snapshotPath,
    restorePath: options.restorePath,
    size: snapshotStat.size,
    mtimeMs: sourceStat.mtimeMs,
    sha256: await sha256File(destinationPath),
    sensitive: authority.sensitive,
    copyPolicy: encrypted ? 'encrypted-copy' : 'copied',
    state: 'complete',
  };
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
  const destinationAdmission = await admitRecoveryDestination(inputs.destinationRoot, inputs.protectedRoots ?? []);
  const destinationRoot = destinationAdmission.operationRoot;
  const finalRoot = path.join(destinationRoot, snapshotId);
  const publicFinalRoot = path.join(destinationAdmission.requestedRoot, snapshotId);
  let stagingRoot: string | undefined;
  let transientRoot: string | undefined;
  let published = false;
  const authorityFiles = new Map<StateAuthorityId, RecoveryManifestFile[]>();
  const capturedSnapshotPaths = new Set<string>();
  let desktopLease: RecoverySnapshotLease | undefined;
  let coreLease: RecoverySnapshotLease | undefined;
  let mutationStart = '';
  let mutationEnd = '';
  let artifactWriteHook = dependencies.beforeFirstArtifactWrite;

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
    await assertRecoveryDestinationStable(destinationAdmission);
    transientRoot = await mkdtemp(path.join(os.tmpdir(), `wayland-recovery-${snapshotId}-`));
    desktopLease = await dependencies.acquireDesktopQuiescence();
    if (corePresent) coreLease = await dependencies.acquireCoreQuiescence!();
    mutationStart = await dependencies.readMutationEpoch();

    for (const authorityPlan of dryRun.authorities) {
      if (!COPIED_COVERAGE.has(authorityPlan.coverage)) continue;
      const authority = inputs.inventory.authorities.find(({ id }) => id === authorityPlan.id);
      if (!authority) throw new Error(`Recovery authority disappeared: ${authorityPlan.id}`);
      const captured: RecoveryManifestFile[] = [];

      if (authority.id === 'desktop.database') {
        const databaseSource = authority.evidence[0]?.path;
        if (!databaseSource) throw new Error('Desktop database source is missing.');
        const transientDatabase = path.join(transientRoot, 'wayland.db');
        // Authorities are captured serially under one mutation epoch.
        // oxlint-disable-next-line no-await-in-loop
        await dependencies.captureSqliteOnline(databaseSource, transientDatabase);
        // oxlint-disable-next-line no-await-in-loop
        await assertRegularFile(transientDatabase, 'SQLite online backup');
        captured.push(
          // oxlint-disable-next-line no-await-in-loop
          await addCapturedFile({
            authority,
            sourcePath: transientDatabase,
            manifestSourcePath: databaseSource,
            relativePath: 'wayland.db',
            restorePath: 'desktop/database/wayland.db',
            logicalRole: 'desktop SQLite online backup',
            stagingRoot,
            sealFile: dependencies.sealFile,
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
          })
        );
      } else {
        let ordinal = 0;
        for (const [evidenceIndex, evidence] of authority.evidence.entries()) {
          if (evidence.state === 'absent') continue;
          // oxlint-disable-next-line no-await-in-loop
          const files = await listContainedFiles(evidence.path);
          for (const filePath of files) {
            if (!authorityOwnsFile(authority.id, evidence.path, evidence.state, filePath)) continue;
            captured.push(
              // oxlint-disable-next-line no-await-in-loop
              await addCapturedFile({
                authority,
                sourcePath: filePath,
                relativePath: `${evidenceIndex}-${relativeSourcePath(evidence.path, filePath)}`,
                restorePath: recoveryRestorePath(
                  authority.id,
                  evidence.path,
                  evidence.state,
                  filePath,
                  evidence.authorityRelativePath
                ),
                stagingRoot,
                sealFile: dependencies.sealFile,
                capturedSnapshotPaths,
                ordinal: ordinal++,
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
          }
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
        ? { referenceIds: inputs.inventory.externalWorkspaces.map(({ projectId }) => projectId) }
        : authority.id === 'external.agent-configs'
          ? { referenceIds: inputs.inventory.externalAgentConfigs.map(({ backendId }) => backendId) }
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
    const manifestPath = path.join(stagingRoot, 'manifest.json');
    await assertRecoveryDestinationStable(destinationAdmission);
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600, flag: 'wx' });
    await assertRecoveryDestinationStable(destinationAdmission);
    const verification = await verifyRecoverySnapshot(await readManifest(manifestPath), stagingRoot);
    if (!verification.valid) {
      throw new Error(
        `Built recovery point failed verification: ${verification.errors.map(({ code }) => code).join(', ')}`
      );
    }

    await assertRecoveryDestinationStable(destinationAdmission);
    await rename(stagingRoot, finalRoot);
    try {
      await assertRecoveryDestinationStable(destinationAdmission);
    } catch (error) {
      await rm(finalRoot, { recursive: true, force: true });
      throw error;
    }
    published = true;
    return {
      snapshotPath: publicFinalRoot,
      manifestPath: path.join(publicFinalRoot, 'manifest.json'),
      manifest,
      dryRun,
    };
  } finally {
    if (coreLease) await coreLease.release();
    if (desktopLease) await desktopLease.release();
    if (transientRoot) await rm(transientRoot, { recursive: true, force: true });
    if (stagingRoot) await rm(stagingRoot, { recursive: true, force: true });
    if (!published) await rm(finalRoot, { recursive: true, force: true });
    await destinationAdmission.handle.close();
  }
}
