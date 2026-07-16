/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { constants, createReadStream } from 'node:fs';
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  readdir,
  rename,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  CLASSIC_RECOVERY_RELEASE,
  CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256,
  classicRecoveryArtifactFor,
  currentClassicRecoveryTarget,
  downloadClassicRecoveryReleaseArtifact,
  verifyArtifactBytesAgainstDescriptor,
  verifyClassicRecoveryReleaseArtifact,
  type ClassicRecoveryArch,
  type ClassicRecoveryArtifactDescriptor,
  type ClassicRecoveryPlatform,
  type VerifiedClassicRecoveryReleaseArtifact,
} from './classicReleaseTrust';
import { materializeIsolatedRecovery, type IsolatedRecoveryReceipt } from './isolatedRecovery';
import { unsealRecoveryFile } from './recoverySealing';
import { transformDesktopState53To52 } from './recoveryStateTransformer';
import { validateRestoredDatabase } from './restoredDatabaseValidation';

const CLASSIC_VERSION = '0.11.8';
const SOURCE_SCHEMA = 53;
const TARGET_SCHEMA = 52;
const MATERIALIZED_RECEIPT_NAME = 'isolated-recovery-receipt.json';
const LAUNCH_RECEIPT_NAME = 'classic-recovery-launch-receipt.json';
const BINARY_PREPARATION_RECEIPT_NAME = 'classic-binary-preparation-receipt.json';
const BUNDLED_WINDOWS_EXTRACTORS = {
  arm64: { size: 1089024, sha256: '81f67048b7366870e5d49f00a8c570570c6a0dd11c05df7a09a8c52870cc83bd' },
  x64: { size: 1231360, sha256: 'b0cfdeaf429f5cc53f85123dd8f5a5feb92c19d31aa34df257edf9a26be05f95' },
} as const;
const RUNTIME_ROOTS = new Set([
  'analytics.json',
  'cdp.config.json',
  'flux-connectors.json',
  'flux-connector-backups',
  'nicknames.json',
  'sync-state.json',
  'webhook-audit.log',
  'webhook-audit.log.1',
  'webui-activity.json',
  'webui.config.json',
]);

type MaterializedFile = IsolatedRecoveryReceipt['files'][number];

export type ProductionClassicBinaryTrustReceipt = {
  contract: 'wayland-classic-binary-trust/1.0';
  source: 'compiled-desktop-catalog';
  catalogSha256: typeof CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256;
  repository: 'FerroxLabs/wayland';
  releaseId: number;
  tag: 'v0.11.8';
  tagCommit: string;
  catalogArtifact: {
    assetId: number;
    assetName: string;
    assetSize: number;
    assetSha256: string;
    delivery: ClassicRecoveryArtifactDescriptor['delivery'];
  };
  executable: {
    catalogPath: string | null;
    size: number;
    sha256: string;
  };
  publisher: {
    gate: ClassicRecoveryArtifactDescriptor['publisherGate'];
    kind: ClassicRecoveryArtifactDescriptor['publisher']['kind'];
    verification: 'verified' | 'digest-only';
    expectedIdentity: string | null;
    observedIdentity: string | null;
    teamId: string | null;
    bundleId: string | null;
    notarization: 'stapled' | null;
    limitation: 'publisher-signature-unavailable' | null;
  };
  authorizesClassicBinaryLaunch: true;
};

/** Dependency-injected fixture evidence can never be represented as production trust. */
export type TestOnlyClassicBinaryTrustReceipt = {
  contract: 'wayland-classic-binary-trust-test-only/1.0';
  source: 'test-only';
  fixtureId: string;
  authorizesClassicBinaryLaunch: false;
};

export type ClassicBinaryTrustReceipt = ProductionClassicBinaryTrustReceipt | TestOnlyClassicBinaryTrustReceipt;

export type ClassicRecoveryExtractionPlan = {
  kind: 'ditto-zip' | 'seven-zip-nsis' | 'direct-appimage';
  binaryPath: string;
  command: string | null;
  args: string[];
};

export type PreparedClassicReleaseBinary = {
  contract: 'wayland-classic-binary-preparation/1.0';
  runtimeRoot: string;
  binaryPath: string;
  binarySha256: string;
  asset: VerifiedClassicRecoveryReleaseArtifact;
  binaryTrust: ProductionClassicBinaryTrustReceipt;
  receiptPath: string;
  authorizesClassicRecoveryLaunch: false;
};

export type ClassicRecoveryLaunchReceipt = {
  formatVersion: 1;
  recovery: 'classic-v0.11.8';
  preparedAt: string;
  liveStateTouched: false;
  snapshotId: string;
  source: {
    appVersion: string;
    desktopSchemaVersion: 53;
    materializedReceiptSha256: string;
  };
  classic: {
    appVersion: '0.11.8';
    binarySha256: string;
    desktopSchemaVersion: 52;
    binaryTrust: ClassicBinaryTrustReceipt;
  };
  isolation: {
    desktopUserData: 'desktop-user-data';
    home: 'classic-home';
    coreDefault: 'classic-core/default';
    coreNamedProfiles: 'classic-home/.wayland/profiles';
    autoUpdateDisabled: true;
    pendingUpdateRestored: false;
    externalReferencesCopied: false;
  };
  configSafety: {
    externalCacheOverrideRemoved: true;
    firstRunDefaultsSuppressed: true;
    modelAutoRefreshDisabled: true;
    webhookTokensCleared: true;
  };
  databaseSafety: {
    cronJobsDisabled: number;
    channelPluginsDisabled: number;
    workflowSessionsParked: number;
  };
};

export type PreparedClassicRecovery = {
  destinationRoot: string;
  desktopUserDataRoot: string;
  homeRoot: string;
  coreDefaultRoot: string;
  receiptPath: string;
  receipt: ClassicRecoveryLaunchReceipt;
  binaryPath: string;
  binarySha256: string;
  args: string[];
  envOverrides: Record<string, string>;
};

export type PrepareClassicRecoveryInputs = {
  materializedRoot: string;
  destinationRoot: string;
  liveUserDataRoot: string;
  classicBinaryPath: string;
  classicBinarySha256: string;
};

export type PrepareClassicRecoverySnapshotInputs = Omit<PrepareClassicRecoveryInputs, 'materializedRoot'> & {
  snapshotRoot: string;
};

export type ClassicRecoveryLauncherDependencies = {
  verifyClassicBinaryTrust?: (binaryPath: string, binarySha256: string) => Promise<ClassicBinaryTrustReceipt>;
  materializeSnapshot?: (snapshotRoot: string, destinationRoot: string) => Promise<void>;
  now?: () => Date;
  createPreparationId?: () => string;
};

export type LaunchClassicRecoveryDependencies = ClassicRecoveryLauncherDependencies & {
  spawnClassic?: (
    binaryPath: string,
    args: string[],
    options: { env: NodeJS.ProcessEnv; detached: boolean; stdio: 'ignore' }
  ) => ChildProcess;
};

export type LaunchPinnedClassicRecoverySnapshotInputs = {
  snapshotRoot: string;
  destinationRoot: string;
  liveUserDataRoot: string;
};

export type LaunchPinnedClassicRecoverySnapshotDependencies = LaunchClassicRecoveryDependencies & {
  downloadReleaseArtifact?: typeof downloadClassicRecoveryReleaseArtifact;
  prepareReleaseBinary?: typeof prepareClassicBinaryFromReleaseArtifact;
  prepareRecoverySnapshot?: typeof prepareClassicRecoverySnapshot;
  spawnPreparedRecovery?: typeof spawnPreparedClassicRecovery;
};

export type LaunchedPinnedClassicRecoverySnapshot = {
  binary: PreparedClassicReleaseBinary;
  recovery: PreparedClassicRecovery;
};

type ClassicSpawner = NonNullable<LaunchClassicRecoveryDependencies['spawnClassic']>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateClassicBinaryTrustReceipt(value: unknown, binarySha256: string): ClassicBinaryTrustReceipt {
  if (!isRecord(value)) throw new Error('Classic Wayland binary trust verifier returned no receipt.');
  if (value.contract === 'wayland-classic-binary-trust-test-only/1.0') {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Classic Wayland test-only binary trust is forbidden outside the test runtime.');
    }
    if (
      value.source !== 'test-only' ||
      typeof value.fixtureId !== 'string' ||
      value.fixtureId.length === 0 ||
      value.authorizesClassicBinaryLaunch !== false
    ) {
      throw new Error('Classic Wayland test-only binary trust receipt is malformed.');
    }
    return value as TestOnlyClassicBinaryTrustReceipt;
  }
  if (value.contract !== 'wayland-classic-binary-trust/1.0') {
    throw new Error('Classic Wayland binary trust verifier returned an unsupported receipt.');
  }
  const target = currentClassicTarget();
  const descriptor = classicRecoveryArtifactFor(target.platform, target.arch);
  const artifact = isRecord(value.catalogArtifact) ? value.catalogArtifact : {};
  const executable = isRecord(value.executable) ? value.executable : {};
  const publisher = isRecord(value.publisher) ? value.publisher : {};
  if (
    value.source !== 'compiled-desktop-catalog' ||
    value.catalogSha256 !== CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256 ||
    value.repository !== CLASSIC_RECOVERY_RELEASE.repository ||
    value.releaseId !== CLASSIC_RECOVERY_RELEASE.releaseId ||
    value.tag !== CLASSIC_RECOVERY_RELEASE.tag ||
    value.tagCommit !== CLASSIC_RECOVERY_RELEASE.tagCommit ||
    artifact.assetId !== descriptor.assetId ||
    artifact.assetName !== descriptor.name ||
    artifact.assetSize !== descriptor.size ||
    artifact.assetSha256 !== descriptor.sha256 ||
    artifact.delivery !== descriptor.delivery ||
    executable.catalogPath !== descriptor.executable.path ||
    executable.size !== descriptor.executable.size ||
    executable.sha256 !== descriptor.executable.sha256 ||
    executable.sha256 !== binarySha256 ||
    publisher.gate !== descriptor.publisherGate ||
    publisher.kind !== descriptor.publisher.kind ||
    publisher.expectedIdentity !== descriptor.publisher.identity ||
    publisher.teamId !== descriptor.publisher.teamId ||
    publisher.bundleId !== descriptor.publisher.bundleId ||
    value.authorizesClassicBinaryLaunch !== true
  ) {
    throw new Error('Classic Wayland binary trust receipt does not match the compiled release identity.');
  }
  if (
    (target.platform === 'linux' &&
      (publisher.verification !== 'digest-only' ||
        publisher.observedIdentity !== null ||
        publisher.notarization !== null ||
        publisher.limitation !== 'publisher-signature-unavailable')) ||
    (target.platform === 'darwin' &&
      (publisher.verification !== 'verified' ||
        publisher.observedIdentity !== descriptor.publisher.identity ||
        publisher.notarization !== 'stapled' ||
        publisher.limitation !== null)) ||
    (target.platform === 'win32' &&
      (publisher.verification !== 'verified' ||
        typeof publisher.observedIdentity !== 'string' ||
        !windowsSubjectHasExactCommonName(publisher.observedIdentity, descriptor.publisher.identity) ||
        publisher.notarization !== null ||
        publisher.limitation !== null))
  ) {
    throw new Error('Classic Wayland binary publisher receipt does not satisfy the platform trust gate.');
  }
  return value as ProductionClassicBinaryTrustReceipt;
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function assertRegularFile(filePath: string, label: string): Promise<void> {
  const stat = await lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular file: ${filePath}`);
}

async function assertAbsent(candidate: string, label: string): Promise<void> {
  try {
    await lstat(candidate);
    throw new Error(`${label} already exists: ${candidate}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

async function assertPathSegmentsNotSymlinks(candidatePath: string): Promise<void> {
  const resolved = path.resolve(candidatePath);
  const parsed = path.parse(resolved);
  let current = parsed.root;
  for (const segment of resolved.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error(`Classic recovery path contains a symbolic link: ${current}`);
  }
}

function isSameOrWithin(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function canonicalRestorePath(value: string): string {
  if (!value || value.includes('\\') || path.posix.isAbsolute(value)) {
    throw new Error(`Invalid materialized recovery path: ${value}`);
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`Non-canonical materialized recovery path: ${value}`);
  }
  return normalized;
}

async function listFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const visit = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const candidate = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Materialized recovery contains a symbolic link: ${candidate}`);
      if (entry.isDirectory()) await visit(candidate);
      else if (entry.isFile()) files.push(path.relative(root, candidate).split(path.sep).join('/'));
      else throw new Error(`Materialized recovery contains an unsupported entry: ${candidate}`);
    }
  };
  await visit(root);
  return files;
}

function parseMaterializedReceipt(value: unknown): IsolatedRecoveryReceipt {
  if (!isRecord(value)) throw new Error('Materialized recovery receipt must be an object.');
  if (value.formatVersion !== 1 || value.liveStateTouched !== false) {
    throw new Error('Materialized recovery receipt has an unsupported format or touched live state.');
  }
  if (typeof value.snapshotId !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(value.snapshotId)) {
    throw new Error('Materialized recovery receipt has an unsafe snapshot id.');
  }
  if (typeof value.sourceAppVersion !== 'string' || value.sourceAppVersion.length === 0) {
    throw new Error('Materialized recovery receipt has no source app version.');
  }
  if (value.desktopSchemaVersion !== SOURCE_SCHEMA || !isRecord(value.database)) {
    throw new Error(`Classic recovery requires a materialized schema ${SOURCE_SCHEMA} snapshot.`);
  }
  if (value.database.schemaVersion !== SOURCE_SCHEMA || value.database.integrity !== 'ok') {
    throw new Error('Materialized recovery database receipt is not valid.');
  }
  if (!Array.isArray(value.files)) throw new Error('Materialized recovery receipt has no file inventory.');
  return value as IsolatedRecoveryReceipt;
}

async function verifyMaterializedRecovery(materializedRoot: string): Promise<{
  receipt: IsolatedRecoveryReceipt;
  receiptSha256: string;
}> {
  await assertPathSegmentsNotSymlinks(materializedRoot);
  const receiptPath = path.join(materializedRoot, MATERIALIZED_RECEIPT_NAME);
  await assertRegularFile(receiptPath, 'Materialized recovery receipt');
  const receipt = parseMaterializedReceipt(JSON.parse(await readFile(receiptPath, 'utf8')) as unknown);
  const expectedFiles = new Set<string>([MATERIALIZED_RECEIPT_NAME]);

  for (const rawFile of receipt.files) {
    if (!isRecord(rawFile)) throw new Error('Materialized recovery file receipt must be an object.');
    if (
      typeof rawFile.restorePath !== 'string' ||
      typeof rawFile.authority !== 'string' ||
      !Number.isSafeInteger(rawFile.size) ||
      (rawFile.size as number) < 0 ||
      typeof rawFile.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(rawFile.sha256)
    ) {
      throw new Error('Materialized recovery file receipt is malformed.');
    }
    const restorePath = canonicalRestorePath(rawFile.restorePath);
    if (expectedFiles.has(restorePath)) throw new Error(`Duplicate materialized recovery path: ${restorePath}`);
    expectedFiles.add(restorePath);
    const filePath = path.join(materializedRoot, ...restorePath.split('/'));
    await assertRegularFile(filePath, 'Materialized recovery file');
    const stat = await lstat(filePath);
    if (stat.size !== rawFile.size || (await sha256File(filePath)) !== rawFile.sha256) {
      throw new Error(`Materialized recovery file does not match its receipt: ${restorePath}`);
    }
  }

  const actualFiles = await listFiles(materializedRoot);
  if (actualFiles.length !== expectedFiles.size || actualFiles.some((file) => !expectedFiles.has(file))) {
    throw new Error('Materialized recovery contains files outside its receipt.');
  }
  if (!receipt.files.some((file) => file.restorePath === 'desktop/database/wayland.db')) {
    throw new Error('Materialized recovery has no authoritative Desktop database.');
  }
  return { receipt, receiptSha256: await sha256File(receiptPath) };
}

function decodeWaylandConfig(raw: string): Record<string, unknown> {
  try {
    const decoded = decodeURIComponent(Buffer.from(raw, 'base64').toString('utf8'));
    const value: unknown = JSON.parse(decoded);
    if (!isRecord(value)) throw new Error('not an object');
    return value;
  } catch (error) {
    throw new Error('Classic recovery refuses an unreadable wayland-config.txt.', { cause: error });
  }
}

function encodeWaylandConfig(value: Record<string, unknown>): string {
  return Buffer.from(encodeURIComponent(JSON.stringify(value)), 'utf8').toString('base64');
}

async function hardenClassicConfig(configRoot: string): Promise<void> {
  // .wayland-env may redirect cacheDir back to a live external tree before
  // the app opens the isolated config. Never restore that override.
  await rm(path.join(configRoot, '.wayland-env'), { force: true });
  const configPath = path.join(configRoot, 'wayland-config.txt');
  let config: Record<string, unknown> = {};
  try {
    await assertRegularFile(configPath, 'Classic recovery config');
    config = decodeWaylandConfig(await readFile(configPath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  config['system.firstRunDefaultsApplied'] = true;
  config['system.closeToTray'] = false;
  config['models.autoRefresh'] = false;
  config['ambient.enabled'] = false;
  config['webhook.connectionTokens'] = [];
  await mkdir(configRoot, { recursive: true });
  await writeFile(configPath, encodeWaylandConfig(config), { flag: 'w', mode: 0o600 });
  if (process.platform !== 'win32') await chmod(configPath, 0o600);
}

async function copyReceiptFile(source: string, destination: string): Promise<void> {
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination, constants.COPYFILE_EXCL);
  if (process.platform !== 'win32') await chmod(destination, 0o600);
}

function targetForMaterializedFile(
  file: MaterializedFile,
  roots: { desktopUserData: string; home: string; coreDefault: string }
): string | null {
  const restorePath = canonicalRestorePath(file.restorePath);
  const relativeAfter = (prefix: string): string => restorePath.slice(prefix.length);
  switch (file.authority) {
    case 'desktop.database':
      return null; // Replaced by the schema-52 transformer.
    case 'desktop.config': {
      const prefix = 'desktop/config/';
      if (!restorePath.startsWith(prefix)) throw new Error(`Config restore path escaped its authority: ${restorePath}`);
      const relative = relativeAfter(prefix);
      if (relative === '.wayland-env') return null;
      return path.join(roots.desktopUserData, 'config', ...relative.split('/'));
    }
    case 'desktop.runtime-files': {
      const prefix = 'desktop/runtime/';
      if (!restorePath.startsWith(prefix))
        throw new Error(`Runtime restore path escaped its authority: ${restorePath}`);
      const relative = relativeAfter(prefix);
      const top = relative.split('/')[0];
      if (!RUNTIME_ROOTS.has(top)) throw new Error(`Unsupported Classic runtime authority: ${restorePath}`);
      return path.join(roots.desktopUserData, ...relative.split('/'));
    }
    case 'core.default-profile': {
      const prefix = 'core/default/';
      if (!restorePath.startsWith(prefix)) throw new Error(`Core default path escaped its authority: ${restorePath}`);
      return path.join(roots.coreDefault, ...relativeAfter(prefix).split('/'));
    }
    case 'core.named-profiles': {
      const prefix = 'core/profiles/';
      if (!restorePath.startsWith(prefix)) throw new Error(`Core profile path escaped its authority: ${restorePath}`);
      return path.join(roots.home, '.wayland', 'profiles', ...relativeAfter(prefix).split('/'));
    }
    case 'credentials.key-material':
      if (restorePath !== 'desktop/credentials/.secret-key') {
        throw new Error(`Unsupported credential recovery path: ${restorePath}`);
      }
      return path.join(roots.desktopUserData, '.secret-key');
    case 'updater.state':
      return null; // A pending update must never cross the rollback boundary.
    default:
      throw new Error(`Unsupported materialized recovery authority: ${file.authority}`);
  }
}

function execFileOutput(
  command: string,
  args: string[],
  options: { timeoutMs?: number; label?: string } = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { timeout: options.timeoutMs ?? 15_000, windowsHide: true, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error)
          reject(new Error(`${options.label ?? 'Classic publisher verification'} failed: ${stderr || error.message}`));
        else resolve({ stdout, stderr });
      }
    );
  });
}

function currentClassicTarget(): { platform: ClassicRecoveryPlatform; arch: ClassicRecoveryArch } {
  return currentClassicRecoveryTarget();
}

function macBundleRoot(binaryPath: string, descriptor: ClassicRecoveryArtifactDescriptor): string {
  if (descriptor.executable.path !== 'Wayland.app/Contents/MacOS/Wayland') {
    throw new Error('Classic macOS executable catalog path is unsupported.');
  }
  const suffix = descriptor.executable.path.split('/').join(path.sep);
  const suffixWithSeparator = `${path.sep}${suffix}`;
  if (!binaryPath.endsWith(suffixWithSeparator)) {
    throw new Error('Classic macOS binary is not at the pinned path inside Wayland.app.');
  }
  return path.join(binaryPath.slice(0, -suffixWithSeparator.length), 'Wayland.app');
}

async function verifyMacPublisher(
  binaryPath: string,
  descriptor: ClassicRecoveryArtifactDescriptor
): Promise<ProductionClassicBinaryTrustReceipt['publisher']> {
  const bundleRoot = macBundleRoot(binaryPath, descriptor);
  await execFileOutput('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', bundleRoot]);
  const details = await execFileOutput('/usr/bin/codesign', ['-dv', '--verbose=4', bundleRoot]);
  const output = `${details.stdout}\n${details.stderr}`;
  const publisher = parseMacClassicPublisherEvidence(output, descriptor);
  await execFileOutput('/usr/bin/xcrun', ['stapler', 'validate', bundleRoot]);
  return publisher;
}

export function parseMacClassicPublisherEvidence(
  output: string,
  descriptor: ClassicRecoveryArtifactDescriptor
): ProductionClassicBinaryTrustReceipt['publisher'] {
  const lines = new Set(output.split(/\r?\n/u).map((line) => line.trim()));
  if (
    descriptor.publisher.kind !== 'macos-developer-id' ||
    !descriptor.publisher.identity ||
    !descriptor.publisher.teamId ||
    !descriptor.publisher.bundleId ||
    !lines.has(`Authority=${descriptor.publisher.identity}`) ||
    !lines.has(`TeamIdentifier=${descriptor.publisher.teamId}`) ||
    !lines.has(`Identifier=${descriptor.publisher.bundleId}`) ||
    !lines.has('Notarization Ticket=stapled')
  ) {
    throw new Error('Classic macOS bundle does not match the pinned publisher identity and notarization policy.');
  }
  return {
    gate: descriptor.publisherGate,
    kind: descriptor.publisher.kind,
    verification: 'verified',
    expectedIdentity: descriptor.publisher.identity,
    observedIdentity: descriptor.publisher.identity,
    teamId: descriptor.publisher.teamId,
    bundleId: descriptor.publisher.bundleId,
    notarization: 'stapled',
    limitation: null,
  };
}

async function verifyWindowsPublisher(
  binaryPath: string,
  descriptor: ClassicRecoveryArtifactDescriptor
): Promise<ProductionClassicBinaryTrustReceipt['publisher']> {
  if (descriptor.publisher.kind !== 'windows-authenticode' || !descriptor.publisher.identity) {
    throw new Error('Classic Windows executable has no pinned Authenticode publisher.');
  }
  const script = [
    '$signature = Get-AuthenticodeSignature -LiteralPath $args[0]',
    '$subject = if ($signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { "" }',
    '[pscustomobject]@{ Status = [string]$signature.Status; Subject = $subject } | ConvertTo-Json -Compress',
  ].join('; ');
  const result = await execFileOutput('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    script,
    binaryPath,
  ]);
  return parseWindowsClassicPublisherEvidence(result.stdout, descriptor);
}

export function parseWindowsClassicPublisherEvidence(
  output: string,
  descriptor: ClassicRecoveryArtifactDescriptor
): ProductionClassicBinaryTrustReceipt['publisher'] {
  let parsed: { Status?: unknown; Subject?: unknown };
  try {
    parsed = JSON.parse(output) as { Status?: unknown; Subject?: unknown };
  } catch (error) {
    throw new Error('Classic Windows Authenticode verifier returned malformed evidence.', { cause: error });
  }
  const expectedCommonName = descriptor.publisher.identity;
  if (
    descriptor.publisher.kind !== 'windows-authenticode' ||
    !expectedCommonName ||
    parsed.Status !== 'Valid' ||
    typeof parsed.Subject !== 'string' ||
    !windowsSubjectHasExactCommonName(parsed.Subject, expectedCommonName)
  ) {
    throw new Error('Classic Windows executable does not have valid Ferrox Labs Authenticode provenance.');
  }
  return {
    gate: descriptor.publisherGate,
    kind: descriptor.publisher.kind,
    verification: 'verified',
    expectedIdentity: expectedCommonName,
    observedIdentity: parsed.Subject,
    teamId: descriptor.publisher.teamId,
    bundleId: descriptor.publisher.bundleId,
    notarization: null,
    limitation: null,
  };
}

function windowsSubjectHasExactCommonName(subject: string, expectedCommonName: string | null): boolean {
  if (!expectedCommonName) return false;
  const commonNames = [...subject.matchAll(/(?:^|,\s*)CN\s*=\s*([^,]+)(?=,|$)/gu)].map((match) => match[1].trim());
  return commonNames.length === 1 && commonNames[0] === expectedCommonName;
}

export async function verifyClassicBinaryTrustDefault(
  binaryPath: string,
  binarySha256: string
): Promise<ProductionClassicBinaryTrustReceipt> {
  const target = currentClassicTarget();
  const descriptor = classicRecoveryArtifactFor(target.platform, target.arch);
  if (binarySha256 !== descriptor.executable.sha256) {
    throw new Error('Classic Wayland binary does not match the compiled v0.11.8 executable pin.');
  }
  await verifyArtifactBytesAgainstDescriptor(binaryPath, descriptor.executable);
  let publisher: ProductionClassicBinaryTrustReceipt['publisher'];
  if (target.platform === 'darwin') publisher = await verifyMacPublisher(binaryPath, descriptor);
  else if (target.platform === 'win32') publisher = await verifyWindowsPublisher(binaryPath, descriptor);
  else {
    if (descriptor.publisher.kind !== 'none' || descriptor.publisherGate !== 'github-release-digest-only') {
      throw new Error('Classic Linux executable has an inconsistent checksum-only publisher policy.');
    }
    publisher = {
      gate: descriptor.publisherGate,
      kind: descriptor.publisher.kind,
      verification: 'digest-only',
      expectedIdentity: null,
      observedIdentity: null,
      teamId: null,
      bundleId: null,
      notarization: null,
      limitation: 'publisher-signature-unavailable',
    };
  }
  return {
    contract: 'wayland-classic-binary-trust/1.0',
    source: 'compiled-desktop-catalog',
    catalogSha256: CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256,
    repository: CLASSIC_RECOVERY_RELEASE.repository,
    releaseId: CLASSIC_RECOVERY_RELEASE.releaseId,
    tag: CLASSIC_RECOVERY_RELEASE.tag,
    tagCommit: CLASSIC_RECOVERY_RELEASE.tagCommit,
    catalogArtifact: {
      assetId: descriptor.assetId,
      assetName: descriptor.name,
      assetSize: descriptor.size,
      assetSha256: descriptor.sha256,
      delivery: descriptor.delivery,
    },
    executable: {
      catalogPath: descriptor.executable.path,
      size: descriptor.executable.size,
      sha256: descriptor.executable.sha256,
    },
    publisher,
    authorizesClassicBinaryLaunch: true,
  };
}

export function classicRecoveryExtractionPlanFor(input: {
  artifactPath: string;
  runtimeRoot: string;
  platform: ClassicRecoveryPlatform;
  arch: ClassicRecoveryArch;
  windowsExtractorPath?: string;
}): ClassicRecoveryExtractionPlan {
  const descriptor = classicRecoveryArtifactFor(input.platform, input.arch);
  const targetPath = input.platform === 'win32' ? path.win32 : path.posix;
  const binaryPath = targetPath.join(input.runtimeRoot, ...(descriptor.executable.path ?? descriptor.name).split('/'));
  if (input.platform === 'darwin') {
    return {
      kind: 'ditto-zip',
      binaryPath,
      command: '/usr/bin/ditto',
      args: ['-x', '-k', input.artifactPath, input.runtimeRoot],
    };
  }
  if (input.platform === 'win32') {
    if (!input.windowsExtractorPath) throw new Error('Classic Windows recovery has no verified NSIS extractor.');
    return {
      kind: 'seven-zip-nsis',
      binaryPath,
      command: input.windowsExtractorPath,
      args: ['x', '-y', '-bd', '-bso0', '-bsp0', `-o${input.runtimeRoot}`, input.artifactPath],
    };
  }
  return { kind: 'direct-appimage', binaryPath, command: null, args: [] };
}

async function verifiedBundledWindowsExtractor(arch: ClassicRecoveryArch): Promise<string> {
  const descriptor = BUNDLED_WINDOWS_EXTRACTORS[arch];
  const candidate = path.join(process.resourcesPath, 'classic-recovery-tools', 'win', arch, '7za.exe');
  await assertRegularFile(candidate, 'Bundled Classic recovery extractor');
  const canonical = await realpath(candidate);
  await verifyArtifactBytesAgainstDescriptor(canonical, descriptor);
  return canonical;
}

/** Extract and publisher-verify one exact release asset in a private unique runtime. */
export async function prepareClassicBinaryFromReleaseArtifact(input: {
  artifactPath: string;
  destinationParent: string;
}): Promise<PreparedClassicReleaseBinary> {
  const target = currentClassicTarget();
  const assetPath = await realpath(path.resolve(input.artifactPath));
  const asset = await verifyClassicRecoveryReleaseArtifact({ artifactPath: assetPath, ...target });
  const parentInput = path.resolve(input.destinationParent);
  await mkdir(parentInput, { recursive: true, mode: 0o700 });
  const parent = await realpath(parentInput);
  await assertPathSegmentsNotSymlinks(parent);
  const runtimeRoot = await mkdtemp(path.join(parent, '.wayland-classic-v0.11.8-'));
  let complete = false;
  try {
    const windowsExtractorPath =
      target.platform === 'win32' ? await verifiedBundledWindowsExtractor(target.arch) : undefined;
    const plan = classicRecoveryExtractionPlanFor({
      artifactPath: assetPath,
      runtimeRoot,
      ...target,
      windowsExtractorPath,
    });
    if (plan.command) {
      await execFileOutput(plan.command, plan.args, {
        timeoutMs: 120_000,
        label: 'Classic recovery release extraction',
      });
    } else {
      await copyFile(assetPath, plan.binaryPath, constants.COPYFILE_EXCL);
      if (process.platform !== 'win32') await chmod(plan.binaryPath, 0o700);
    }
    await assertRegularFile(plan.binaryPath, 'Extracted Classic Wayland binary');
    const binaryPath = await realpath(plan.binaryPath);
    const binarySha256 = await sha256File(binaryPath);
    const binaryTrust = await verifyClassicBinaryTrustDefault(binaryPath, binarySha256);
    const receipt: PreparedClassicReleaseBinary = {
      contract: 'wayland-classic-binary-preparation/1.0',
      runtimeRoot,
      binaryPath,
      binarySha256,
      asset,
      binaryTrust,
      receiptPath: path.join(runtimeRoot, BINARY_PREPARATION_RECEIPT_NAME),
      authorizesClassicRecoveryLaunch: false,
    };
    await writeFile(receipt.receiptPath, JSON.stringify(receipt, null, 2), { flag: 'wx', mode: 0o600 });
    complete = true;
    return receipt;
  } finally {
    if (!complete) await rm(runtimeRoot, { recursive: true, force: true });
  }
}

function assertSameClassicBinaryTrustReceipt(
  expected: ClassicBinaryTrustReceipt,
  observed: ClassicBinaryTrustReceipt
): void {
  if (JSON.stringify(observed) !== JSON.stringify(expected)) {
    throw new Error('Classic Wayland binary trust identity changed between recovery gates.');
  }
}

/**
 * Prepare a complete, side-effect-neutralized Classic v0.11.8 state tree.
 * The materialized input and live userData are read-only; the final tree is
 * published by one rename only after every hash, schema, and isolation check.
 */
export async function prepareClassicRecovery(
  inputs: PrepareClassicRecoveryInputs,
  dependencies: ClassicRecoveryLauncherDependencies = {}
): Promise<PreparedClassicRecovery> {
  const materializedRoot = await realpath(path.resolve(inputs.materializedRoot));
  const liveUserDataRoot = await realpath(path.resolve(inputs.liveUserDataRoot));
  await assertPathSegmentsNotSymlinks(materializedRoot);
  await assertPathSegmentsNotSymlinks(liveUserDataRoot);

  const binaryInput = path.resolve(inputs.classicBinaryPath);
  await assertRegularFile(binaryInput, 'Classic Wayland binary');
  const binaryPath = await realpath(binaryInput);
  await assertPathSegmentsNotSymlinks(path.dirname(binaryPath));
  if (!/^[a-f0-9]{64}$/.test(inputs.classicBinarySha256)) {
    throw new Error('Classic Wayland binary pin must be a lowercase 64-character SHA-256 digest.');
  }
  const binarySha256 = await sha256File(binaryPath);
  if (binarySha256 !== inputs.classicBinarySha256) {
    throw new Error('Classic Wayland binary does not match its required SHA-256 pin.');
  }
  const verifyBinaryTrust = dependencies.verifyClassicBinaryTrust ?? verifyClassicBinaryTrustDefault;
  const binaryTrust = validateClassicBinaryTrustReceipt(
    await verifyBinaryTrust(binaryPath, binarySha256),
    binarySha256
  );

  const requestedDestination = path.resolve(inputs.destinationRoot);
  await assertAbsent(requestedDestination, 'Classic recovery destination');
  const requestedParent = path.dirname(requestedDestination);
  await mkdir(requestedParent, { recursive: true });
  const parent = await realpath(requestedParent);
  await assertPathSegmentsNotSymlinks(parent);
  const destinationRoot = path.join(parent, path.basename(requestedDestination));
  if (isSameOrWithin(destinationRoot, liveUserDataRoot) || isSameOrWithin(liveUserDataRoot, destinationRoot)) {
    throw new Error('Classic recovery destination must be disjoint from live Wayland userData.');
  }
  if (isSameOrWithin(destinationRoot, materializedRoot) || isSameOrWithin(materializedRoot, destinationRoot)) {
    throw new Error('Classic recovery destination must be disjoint from the materialized snapshot.');
  }

  const verified = await verifyMaterializedRecovery(materializedRoot);
  const preparationId =
    (dependencies.createPreparationId?.() ?? randomUUID()).replace(/[^a-zA-Z0-9._-]+/g, '-') || 'classic';
  const lockPath = path.join(parent, `.${path.basename(destinationRoot)}.classic-recovery.lock`);
  const lock = await open(lockPath, 'wx', 0o600);
  let stagingRoot: string | undefined;

  try {
    stagingRoot = await mkdtemp(path.join(parent, `.${preparationId}.classic-recovery-`));
    await lock.writeFile(JSON.stringify({ destinationRoot, pid: process.pid, createdAt: new Date().toISOString() }));
    const desktopUserData = path.join(stagingRoot, 'desktop-user-data');
    const home = path.join(stagingRoot, 'classic-home');
    const coreDefault = path.join(stagingRoot, 'classic-core', 'default');
    const sourceDatabase = path.join(materializedRoot, 'desktop', 'database', 'wayland.db');
    const transformed = await transformDesktopState53To52(sourceDatabase, desktopUserData, {
      now: dependencies.now,
      createTransformId: () => preparationId,
    });

    const roots = { desktopUserData, home, coreDefault };
    for (const file of verified.receipt.files) {
      const target = targetForMaterializedFile(file, roots);
      if (!target) continue;
      const source = path.join(materializedRoot, ...canonicalRestorePath(file.restorePath).split('/'));
      await copyReceiptFile(source, target);
    }
    await mkdir(coreDefault, { recursive: true });
    await mkdir(path.join(home, '.wayland', 'profiles'), { recursive: true });
    await hardenClassicConfig(path.join(desktopUserData, 'config'));
    await assertAbsent(path.join(desktopUserData, 'pending-update.json'), 'Classic pending update state');
    await validateRestoredDatabase(transformed.databasePath, TARGET_SCHEMA);

    const binarySha256BeforePublish = await sha256File(binaryPath);
    if (binarySha256BeforePublish !== binarySha256) {
      throw new Error('Classic Wayland binary changed while recovery state was prepared.');
    }
    const binaryTrustBeforePublish = validateClassicBinaryTrustReceipt(
      await verifyBinaryTrust(binaryPath, binarySha256),
      binarySha256
    );
    assertSameClassicBinaryTrustReceipt(binaryTrust, binaryTrustBeforePublish);
    const receipt: ClassicRecoveryLaunchReceipt = {
      formatVersion: 1,
      recovery: 'classic-v0.11.8',
      preparedAt: (dependencies.now?.() ?? new Date()).toISOString(),
      liveStateTouched: false,
      snapshotId: verified.receipt.snapshotId,
      source: {
        appVersion: verified.receipt.sourceAppVersion,
        desktopSchemaVersion: SOURCE_SCHEMA,
        materializedReceiptSha256: verified.receiptSha256,
      },
      classic: {
        appVersion: CLASSIC_VERSION,
        binarySha256,
        desktopSchemaVersion: TARGET_SCHEMA,
        binaryTrust,
      },
      isolation: {
        desktopUserData: 'desktop-user-data',
        home: 'classic-home',
        coreDefault: 'classic-core/default',
        coreNamedProfiles: 'classic-home/.wayland/profiles',
        autoUpdateDisabled: true,
        pendingUpdateRestored: false,
        externalReferencesCopied: false,
      },
      configSafety: {
        externalCacheOverrideRemoved: true,
        firstRunDefaultsSuppressed: true,
        modelAutoRefreshDisabled: true,
        webhookTokensCleared: true,
      },
      databaseSafety: transformed.receipt.safety,
    };
    await writeFile(path.join(stagingRoot, LAUNCH_RECEIPT_NAME), JSON.stringify(receipt, null, 2), {
      flag: 'wx',
      mode: 0o600,
    });
    await assertAbsent(destinationRoot, 'Classic recovery destination');
    await rename(stagingRoot, destinationRoot);

    const finalDesktopUserData = path.join(destinationRoot, 'desktop-user-data');
    const finalHome = path.join(destinationRoot, 'classic-home');
    const finalCoreDefault = path.join(destinationRoot, 'classic-core', 'default');
    return {
      destinationRoot,
      desktopUserDataRoot: finalDesktopUserData,
      homeRoot: finalHome,
      coreDefaultRoot: finalCoreDefault,
      receiptPath: path.join(destinationRoot, LAUNCH_RECEIPT_NAME),
      receipt,
      binaryPath,
      binarySha256,
      args: [`--user-data-dir=${finalDesktopUserData}`],
      envOverrides: {
        WAYLAND_DISABLE_AUTO_UPDATE: '1',
        WAYLAND_HOME: finalCoreDefault,
        HOME: finalHome,
        ...(process.platform === 'win32' ? { USERPROFILE: finalHome } : {}),
      },
    };
  } finally {
    await lock.close().catch((): undefined => undefined);
    await unlink(lockPath).catch((): undefined => undefined);
    if (stagingRoot) await rm(stagingRoot, { recursive: true, force: true });
  }
}

/** Materialize, validate, transform, and prepare one recovery snapshot without exposing a plaintext handoff step. */
export async function prepareClassicRecoverySnapshot(
  inputs: PrepareClassicRecoverySnapshotInputs,
  dependencies: ClassicRecoveryLauncherDependencies = {}
): Promise<PreparedClassicRecovery> {
  const requestedDestination = path.resolve(inputs.destinationRoot);
  const requestedParent = path.dirname(requestedDestination);
  await mkdir(requestedParent, { recursive: true });
  const parent = await realpath(requestedParent);
  await assertPathSegmentsNotSymlinks(parent);
  const transientRoot = await mkdtemp(path.join(parent, '.wayland-classic-materialized-'));
  const materializedRoot = path.join(transientRoot, 'materialized');
  try {
    if (dependencies.materializeSnapshot) {
      await dependencies.materializeSnapshot(inputs.snapshotRoot, materializedRoot);
    } else {
      await materializeIsolatedRecovery(inputs.snapshotRoot, materializedRoot, {
        unsealFile: unsealRecoveryFile,
        validateDesktopDatabase: validateRestoredDatabase,
      });
    }
    return await prepareClassicRecovery(
      {
        materializedRoot,
        destinationRoot: inputs.destinationRoot,
        liveUserDataRoot: inputs.liveUserDataRoot,
        classicBinaryPath: inputs.classicBinaryPath,
        classicBinarySha256: inputs.classicBinarySha256,
      },
      dependencies
    );
  } finally {
    await rm(transientRoot, { recursive: true, force: true });
  }
}

/** Spawn a previously verified plan. Callers may release their global app lock immediately before this handoff. */
export async function spawnPreparedClassicRecovery(
  prepared: PreparedClassicRecovery,
  spawnClassic: ClassicSpawner = spawn,
  verifyBinaryTrust: NonNullable<
    ClassicRecoveryLauncherDependencies['verifyClassicBinaryTrust']
  > = verifyClassicBinaryTrustDefault
): Promise<ChildProcess> {
  await assertRegularFile(prepared.binaryPath, 'Prepared Classic Wayland binary');
  if ((await sha256File(prepared.binaryPath)) !== prepared.binarySha256) {
    throw new Error('Classic Wayland binary changed after recovery preparation; launch refused.');
  }
  const binaryTrustBeforeSpawn = validateClassicBinaryTrustReceipt(
    await verifyBinaryTrust(prepared.binaryPath, prepared.binarySha256),
    prepared.binarySha256
  );
  assertSameClassicBinaryTrustReceipt(prepared.receipt.classic.binaryTrust, binaryTrustBeforeSpawn);
  const child = spawnClassic(prepared.binaryPath, prepared.args, {
    env: { ...process.env, ...prepared.envOverrides },
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return child;
}

/**
 * Download the exact compiled v0.11.8 release, extract and publisher-verify its
 * executable, materialize the sealed snapshot, and launch Classic in one
 * fail-closed action. The transient release archive is always removed. A
 * verified executable runtime is retained only once a complete recovery tree
 * exists, so a failed child spawn remains diagnosable and retryable.
 */
export async function launchPinnedClassicRecoverySnapshot(
  inputs: LaunchPinnedClassicRecoverySnapshotInputs,
  dependencies: LaunchPinnedClassicRecoverySnapshotDependencies = {}
): Promise<LaunchedPinnedClassicRecoverySnapshot> {
  const liveUserDataRoot = await realpath(path.resolve(inputs.liveUserDataRoot));
  await assertPathSegmentsNotSymlinks(liveUserDataRoot);

  const requestedDestination = path.resolve(inputs.destinationRoot);
  const requestedParent = path.dirname(requestedDestination);
  const parent = await realpath(requestedParent);
  await assertPathSegmentsNotSymlinks(parent);
  const destinationRoot = path.join(parent, path.basename(requestedDestination));
  if (isSameOrWithin(destinationRoot, liveUserDataRoot) || isSameOrWithin(liveUserDataRoot, destinationRoot)) {
    throw new Error('Classic recovery destination must be disjoint from live Wayland userData.');
  }
  await assertAbsent(destinationRoot, 'Classic recovery destination');

  const acquisitionRoot = await mkdtemp(path.join(parent, '.wayland-classic-release-'));
  let binary: PreparedClassicReleaseBinary | undefined;
  let recovery: PreparedClassicRecovery | undefined;
  try {
    const target = currentClassicRecoveryTarget();
    const downloadReleaseArtifact = dependencies.downloadReleaseArtifact ?? downloadClassicRecoveryReleaseArtifact;
    const downloaded = await downloadReleaseArtifact({ destinationDirectory: acquisitionRoot, ...target });
    const prepareReleaseBinary = dependencies.prepareReleaseBinary ?? prepareClassicBinaryFromReleaseArtifact;
    binary = await prepareReleaseBinary({
      artifactPath: downloaded.artifactPath,
      destinationParent: parent,
    });

    const prepareRecoverySnapshot = dependencies.prepareRecoverySnapshot ?? prepareClassicRecoverySnapshot;
    recovery = await prepareRecoverySnapshot(
      {
        snapshotRoot: inputs.snapshotRoot,
        destinationRoot,
        liveUserDataRoot,
        classicBinaryPath: binary.binaryPath,
        classicBinarySha256: binary.binarySha256,
      },
      dependencies
    );
    const spawnPreparedRecovery = dependencies.spawnPreparedRecovery ?? spawnPreparedClassicRecovery;
    await spawnPreparedRecovery(
      recovery,
      dependencies.spawnClassic,
      dependencies.verifyClassicBinaryTrust ?? verifyClassicBinaryTrustDefault
    );
    return { binary, recovery };
  } finally {
    await rm(acquisitionRoot, { recursive: true, force: true });
    if (binary && !recovery) {
      await rm(binary.runtimeRoot, { recursive: true, force: true });
    }
  }
}

/** Prepare then spawn exact Classic v0.11.8 against only the isolated tree. */
export async function launchClassicRecovery(
  inputs: PrepareClassicRecoveryInputs,
  dependencies: LaunchClassicRecoveryDependencies = {}
): Promise<PreparedClassicRecovery> {
  const prepared = await prepareClassicRecovery(inputs, dependencies);
  await spawnPreparedClassicRecovery(
    prepared,
    dependencies.spawnClassic,
    dependencies.verifyClassicBinaryTrust ?? verifyClassicBinaryTrustDefault
  );
  return prepared;
}
