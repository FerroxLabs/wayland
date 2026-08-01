/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { link, lstat, mkdir, open, realpath, rm, unlink } from 'node:fs/promises';
import path from 'node:path';
import catalogJson from '../../../../contracts/recovery/classic-v0.11.8-release.json';

export type ClassicRecoveryPlatform = 'darwin' | 'win32' | 'linux';
export type ClassicRecoveryArch = 'arm64' | 'x64';
export type ClassicRecoveryDelivery = 'zip' | 'nsis-installer' | 'appimage';
export type ClassicRecoveryExecutableSource = 'archive-entry' | 'artifact';
export type ClassicRecoveryPublisherKind = 'macos-developer-id' | 'windows-authenticode' | 'none';
export type ClassicRecoveryPublisherGate =
  | 'macos-developer-id-and-notarization'
  | 'windows-authenticode-ferrox-labs'
  | 'github-release-digest-only';

export type ClassicRecoveryArtifactDescriptor = {
  assetId: number;
  platform: ClassicRecoveryPlatform;
  arch: ClassicRecoveryArch;
  name: string;
  size: number;
  sha256: string;
  delivery: ClassicRecoveryDelivery;
  publisherGate: ClassicRecoveryPublisherGate;
  launchableArtifact: boolean;
  executable: {
    source: ClassicRecoveryExecutableSource;
    path: string | null;
    size: number;
    sha256: string;
  };
  publisher: {
    kind: ClassicRecoveryPublisherKind;
    identity: string | null;
    teamId: string | null;
    bundleId: string | null;
  };
};

export type ClassicRecoveryReleaseCatalog = {
  contract: 'wayland-classic-recovery-release/1.0';
  repository: 'FerroxLabs/wayland';
  releaseId: number;
  tag: 'v0.11.8';
  tagCommit: string;
  version: '0.11.8';
  publishedAt: string;
  artifacts: ClassicRecoveryArtifactDescriptor[];
};

export type VerifiedClassicRecoveryReleaseArtifact = {
  contract: 'wayland-classic-recovery-artifact-verification/1.0';
  catalogSource: 'compiled-desktop-catalog';
  catalogSha256: typeof CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256;
  repository: 'FerroxLabs/wayland';
  releaseId: number;
  tag: 'v0.11.8';
  tagCommit: string;
  version: '0.11.8';
  assetId: number;
  assetName: string;
  platform: ClassicRecoveryPlatform;
  arch: ClassicRecoveryArch;
  size: number;
  sha256: string;
  delivery: ClassicRecoveryDelivery;
  publisherGate: ClassicRecoveryPublisherGate;
  launchableArtifact: boolean;
  executable: ClassicRecoveryArtifactDescriptor['executable'];
  publisher: ClassicRecoveryArtifactDescriptor['publisher'];
  authorizesClassicLaunch: false;
};

export type DownloadedClassicRecoveryReleaseArtifact = {
  artifactPath: string;
  receipt: VerifiedClassicRecoveryReleaseArtifact;
};

export type ClassicRecoveryDownloadDependencies = {
  fetch?: typeof fetch;
  timeoutMs?: number;
};

export function currentClassicRecoveryTarget(): {
  platform: ClassicRecoveryPlatform;
  arch: ClassicRecoveryArch;
} {
  if (!PLATFORMS.has(process.platform as ClassicRecoveryPlatform)) {
    throw new Error(`Classic recovery has no release artifact for platform ${process.platform}.`);
  }
  if (!ARCHES.has(process.arch as ClassicRecoveryArch)) {
    throw new Error(`Classic recovery has no release artifact for architecture ${process.arch}.`);
  }
  return {
    platform: process.platform as ClassicRecoveryPlatform,
    arch: process.arch as ClassicRecoveryArch,
  };
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const TAG_COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const PLATFORMS = new Set<ClassicRecoveryPlatform>(['darwin', 'win32', 'linux']);
const ARCHES = new Set<ClassicRecoveryArch>(['arm64', 'x64']);
const DELIVERIES = new Set<ClassicRecoveryDelivery>(['zip', 'nsis-installer', 'appimage']);
const EXECUTABLE_SOURCES = new Set<ClassicRecoveryExecutableSource>(['archive-entry', 'artifact']);
const PUBLISHER_KINDS = new Set<ClassicRecoveryPublisherKind>(['macos-developer-id', 'windows-authenticode', 'none']);
const PUBLISHER_GATES = new Set<ClassicRecoveryPublisherGate>([
  'macos-developer-id-and-notarization',
  'windows-authenticode-ferrox-labs',
  'github-release-digest-only',
]);
const CLASSIC_RELEASE_DOWNLOAD_HOSTS = new Set(['github.com', 'release-assets.githubusercontent.com']);
const MAX_CLASSIC_RELEASE_REDIRECTS = 5;
export const CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256 =
  '4ce7287830468b0218c78bade7704e18db3b7a0de6ba523085f8526be026e2b5' as const;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

export function classicRecoveryCatalogSha256(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function parseArtifact(value: unknown, index: number): ClassicRecoveryArtifactDescriptor {
  const artifact = asRecord(value, `Classic recovery artifact ${index}`);
  if (!Number.isSafeInteger(artifact.assetId) || (artifact.assetId as number) <= 0) {
    throw new Error(`Classic recovery artifact ${index} has an invalid asset id.`);
  }
  if (!PLATFORMS.has(artifact.platform as ClassicRecoveryPlatform)) {
    throw new Error(`Classic recovery artifact ${index} has an unsupported platform.`);
  }
  if (!ARCHES.has(artifact.arch as ClassicRecoveryArch)) {
    throw new Error(`Classic recovery artifact ${index} has an unsupported architecture.`);
  }
  if (
    typeof artifact.name !== 'string' ||
    path.basename(artifact.name) !== artifact.name ||
    artifact.name.length === 0
  ) {
    throw new Error(`Classic recovery artifact ${index} has an unsafe asset name.`);
  }
  if (!Number.isSafeInteger(artifact.size) || (artifact.size as number) <= 0) {
    throw new Error(`Classic recovery artifact ${index} has an invalid size.`);
  }
  if (typeof artifact.sha256 !== 'string' || !SHA256_PATTERN.test(artifact.sha256)) {
    throw new Error(`Classic recovery artifact ${index} has an invalid SHA-256 digest.`);
  }
  if (!DELIVERIES.has(artifact.delivery as ClassicRecoveryDelivery)) {
    throw new Error(`Classic recovery artifact ${index} has an unsupported delivery type.`);
  }
  if (!PUBLISHER_GATES.has(artifact.publisherGate as ClassicRecoveryPublisherGate)) {
    throw new Error(`Classic recovery artifact ${index} has an unsupported publisher gate.`);
  }
  if (typeof artifact.launchableArtifact !== 'boolean') {
    throw new Error(`Classic recovery artifact ${index} has no launchability declaration.`);
  }
  const executable = asRecord(artifact.executable, `Classic recovery artifact ${index} executable`);
  if (!EXECUTABLE_SOURCES.has(executable.source as ClassicRecoveryExecutableSource)) {
    throw new Error(`Classic recovery artifact ${index} has an unsupported executable source.`);
  }
  if (
    executable.path !== null &&
    (typeof executable.path !== 'string' || executable.path.length === 0 || path.posix.isAbsolute(executable.path))
  ) {
    throw new Error(`Classic recovery artifact ${index} has an invalid executable path.`);
  }
  if (!Number.isSafeInteger(executable.size) || (executable.size as number) <= 0) {
    throw new Error(`Classic recovery artifact ${index} has an invalid executable size.`);
  }
  if (typeof executable.sha256 !== 'string' || !SHA256_PATTERN.test(executable.sha256)) {
    throw new Error(`Classic recovery artifact ${index} has an invalid executable digest.`);
  }
  const publisher = asRecord(artifact.publisher, `Classic recovery artifact ${index} publisher`);
  if (!PUBLISHER_KINDS.has(publisher.kind as ClassicRecoveryPublisherKind)) {
    throw new Error(`Classic recovery artifact ${index} has an unsupported publisher identity.`);
  }
  for (const field of ['identity', 'teamId', 'bundleId'] as const) {
    if (publisher[field] !== null && (typeof publisher[field] !== 'string' || publisher[field].length === 0)) {
      throw new Error(`Classic recovery artifact ${index} has an invalid publisher ${field}.`);
    }
  }
  return artifact as ClassicRecoveryArtifactDescriptor;
}

/** Validate the whole catalog before any entry can become a trust decision. */
export function parseClassicRecoveryReleaseCatalog(value: unknown): ClassicRecoveryReleaseCatalog {
  const catalog = asRecord(value, 'Classic recovery release catalog');
  if (catalog.contract !== 'wayland-classic-recovery-release/1.0') {
    throw new Error('Classic recovery release catalog has an unsupported contract.');
  }
  if (
    catalog.repository !== 'FerroxLabs/wayland' ||
    catalog.releaseId !== 346809341 ||
    catalog.tag !== 'v0.11.8' ||
    catalog.version !== '0.11.8' ||
    catalog.publishedAt !== '2026-06-30T12:24:04Z' ||
    typeof catalog.tagCommit !== 'string' ||
    !TAG_COMMIT_PATTERN.test(catalog.tagCommit) ||
    catalog.tagCommit !== '74b37efb1a1f624ec86b66fb3465025cb1a9fd22'
  ) {
    throw new Error('Classic recovery release catalog identity does not match the compiled v0.11.8 pin.');
  }
  if (!Array.isArray(catalog.artifacts) || catalog.artifacts.length !== 6) {
    throw new Error('Classic recovery release catalog must contain exactly six platform artifacts.');
  }
  const artifacts = catalog.artifacts.map(parseArtifact);
  const identities = new Set<string>();
  const assetIds = new Set<number>();
  const names = new Set<string>();
  for (const artifact of artifacts) {
    const identity = `${artifact.platform}/${artifact.arch}`;
    if (identities.has(identity) || assetIds.has(artifact.assetId) || names.has(artifact.name)) {
      throw new Error('Classic recovery release catalog contains a duplicate artifact identity.');
    }
    identities.add(identity);
    assetIds.add(artifact.assetId);
    names.add(artifact.name);
  }
  for (const platform of PLATFORMS) {
    for (const arch of ARCHES) {
      if (!identities.has(`${platform}/${arch}`)) {
        throw new Error(`Classic recovery release catalog is missing ${platform}/${arch}.`);
      }
    }
  }
  return { ...(catalog as Omit<ClassicRecoveryReleaseCatalog, 'artifacts'>), artifacts };
}

if (classicRecoveryCatalogSha256(catalogJson) !== CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256) {
  throw new Error('Classic recovery release catalog does not match its compiled content digest.');
}
export const CLASSIC_RECOVERY_RELEASE = parseClassicRecoveryReleaseCatalog(catalogJson);

export function classicRecoveryArtifactFor(
  platform: ClassicRecoveryPlatform,
  arch: ClassicRecoveryArch
): ClassicRecoveryArtifactDescriptor {
  const artifact = CLASSIC_RECOVERY_RELEASE.artifacts.find(
    (candidate) => candidate.platform === platform && candidate.arch === arch
  );
  if (!artifact) throw new Error(`Classic recovery has no pinned v0.11.8 artifact for ${platform}/${arch}.`);
  return { ...artifact };
}

/** Byte check only; the descriptor is not a trust root. Use the catalog-backed verifier for release identity. */
export async function verifyArtifactBytesAgainstDescriptor(
  filePath: string,
  descriptor: Pick<ClassicRecoveryArtifactDescriptor, 'size' | 'sha256'>
): Promise<{ size: number; sha256: string }> {
  const handle = await open(filePath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size !== descriptor.size) {
      throw new Error('Classic recovery release artifact size does not match its pin.');
    }
    const hash = createHash('sha256');
    for await (const chunk of handle.createReadStream({ autoClose: false })) hash.update(chunk);
    const after = await handle.stat();
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs
    ) {
      throw new Error('Classic recovery release artifact changed during verification.');
    }
    const digest = hash.digest('hex');
    if (digest !== descriptor.sha256) {
      throw new Error('Classic recovery release artifact does not match its SHA-256 pin.');
    }
    return { size: after.size, sha256: digest };
  } finally {
    await handle.close();
  }
}

/**
 * Verify one published release asset against the catalog compiled into this
 * Desktop build. This proves release-asset identity only. It deliberately does
 * not authorize a Classic launch: archive extraction and executable provenance
 * remain separate fail-closed gates.
 */
export async function verifyClassicRecoveryReleaseArtifact(input: {
  artifactPath: string;
  platform: ClassicRecoveryPlatform;
  arch: ClassicRecoveryArch;
}): Promise<VerifiedClassicRecoveryReleaseArtifact> {
  const descriptor = classicRecoveryArtifactFor(input.platform, input.arch);
  const candidate = path.resolve(input.artifactPath);
  const candidateStat = await lstat(candidate);
  if (!candidateStat.isFile() || candidateStat.isSymbolicLink()) {
    throw new Error('Classic recovery release artifact must be a regular non-symbolic-link file.');
  }
  const canonical = await realpath(candidate);
  const verifiedBytes = await verifyArtifactBytesAgainstDescriptor(canonical, descriptor);
  return {
    contract: 'wayland-classic-recovery-artifact-verification/1.0',
    catalogSource: 'compiled-desktop-catalog',
    catalogSha256: CLASSIC_RECOVERY_RELEASE_CATALOG_SHA256,
    repository: CLASSIC_RECOVERY_RELEASE.repository,
    releaseId: CLASSIC_RECOVERY_RELEASE.releaseId,
    tag: CLASSIC_RECOVERY_RELEASE.tag,
    tagCommit: CLASSIC_RECOVERY_RELEASE.tagCommit,
    version: CLASSIC_RECOVERY_RELEASE.version,
    assetId: descriptor.assetId,
    assetName: descriptor.name,
    platform: descriptor.platform,
    arch: descriptor.arch,
    size: verifiedBytes.size,
    sha256: verifiedBytes.sha256,
    delivery: descriptor.delivery,
    publisherGate: descriptor.publisherGate,
    launchableArtifact: descriptor.launchableArtifact,
    executable: { ...descriptor.executable },
    publisher: { ...descriptor.publisher },
    authorizesClassicLaunch: false,
  };
}

function assertAllowedClassicReleaseUrl(candidate: URL, expectedInitialPath?: string): void {
  if (candidate.protocol !== 'https:' || !CLASSIC_RELEASE_DOWNLOAD_HOSTS.has(candidate.hostname)) {
    throw new Error('Classic recovery release download escaped the HTTPS GitHub release allowlist.');
  }
  if (expectedInitialPath && (candidate.hostname !== 'github.com' || candidate.pathname !== expectedInitialPath)) {
    throw new Error('Classic recovery release download does not match the compiled release path.');
  }
}

/**
 * Stream exact bytes to an exclusive file without trusting Content-Length.
 * This helper is exported for deterministic transport tests; callers must use
 * the catalog-backed wrapper below to establish release identity.
 */
export async function downloadArtifactBytesAgainstDescriptor(input: {
  url: string;
  destinationPath: string;
  descriptor: Pick<ClassicRecoveryArtifactDescriptor, 'size' | 'sha256'>;
  fetch?: typeof fetch;
  timeoutMs?: number;
  expectedInitialPath?: string;
}): Promise<{ size: number; sha256: string }> {
  const fetcher = input.fetch ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 120_000);
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let published = false;
  try {
    let current = new URL(input.url);
    assertAllowedClassicReleaseUrl(current, input.expectedInitialPath);
    let response: Response | undefined;
    for (let redirect = 0; redirect <= MAX_CLASSIC_RELEASE_REDIRECTS; redirect += 1) {
      response = await fetcher(current, { redirect: 'manual', signal: controller.signal });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      if (redirect === MAX_CLASSIC_RELEASE_REDIRECTS) {
        throw new Error('Classic recovery release download exceeded its redirect limit.');
      }
      const location = response.headers.get('location');
      if (!location) throw new Error('Classic recovery release redirect has no destination.');
      await response.body?.cancel();
      current = new URL(location, current);
      assertAllowedClassicReleaseUrl(current);
    }
    if (!response || response.status !== 200 || !response.body) {
      throw new Error(`Classic recovery release download failed with HTTP ${response?.status ?? 'unknown'}.`);
    }
    const declaredLength = response.headers.get('content-length');
    if (declaredLength !== null && Number(declaredLength) !== input.descriptor.size) {
      throw new Error('Classic recovery release download Content-Length does not match its compiled pin.');
    }
    handle = await open(input.destinationPath, 'wx', 0o600);
    const hash = createHash('sha256');
    const reader = response.body.getReader();
    let size = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > input.descriptor.size) {
        await reader.cancel();
        throw new Error('Classic recovery release download exceeded its compiled size pin.');
      }
      hash.update(chunk.value);
      await handle.write(chunk.value);
    }
    await handle.sync();
    await handle.close();
    handle = undefined;
    const sha256 = hash.digest('hex');
    if (size !== input.descriptor.size || sha256 !== input.descriptor.sha256) {
      throw new Error('Classic recovery release download does not match its compiled byte identity.');
    }
    published = true;
    return { size, sha256 };
  } finally {
    clearTimeout(timeout);
    await handle?.close().catch((): undefined => undefined);
    if (!published) await rm(input.destinationPath, { force: true }).catch((): undefined => undefined);
  }
}

/** Download and atomically publish only the exact release asset compiled into Desktop. */
export async function downloadClassicRecoveryReleaseArtifact(
  input: {
    destinationDirectory: string;
    platform: ClassicRecoveryPlatform;
    arch: ClassicRecoveryArch;
  },
  dependencies: ClassicRecoveryDownloadDependencies = {}
): Promise<DownloadedClassicRecoveryReleaseArtifact> {
  const descriptor = classicRecoveryArtifactFor(input.platform, input.arch);
  const destinationDirectory = path.resolve(input.destinationDirectory);
  await mkdir(destinationDirectory, { recursive: true, mode: 0o700 });
  const canonicalDirectory = await realpath(destinationDirectory);
  const destinationPath = path.join(canonicalDirectory, descriptor.name);
  try {
    await lstat(destinationPath);
    throw new Error(`Classic recovery release asset destination already exists: ${destinationPath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const partialPath = path.join(canonicalDirectory, `.${descriptor.name}.${process.pid}.partial`);
  const expectedInitialPath = `/FerroxLabs/wayland/releases/download/${CLASSIC_RECOVERY_RELEASE.tag}/${descriptor.name}`;
  await downloadArtifactBytesAgainstDescriptor({
    url: `https://github.com${expectedInitialPath}`,
    destinationPath: partialPath,
    descriptor,
    fetch: dependencies.fetch,
    timeoutMs: dependencies.timeoutMs,
    expectedInitialPath,
  });
  try {
    await link(partialPath, destinationPath);
    await unlink(partialPath);
    const receipt = await verifyClassicRecoveryReleaseArtifact({
      artifactPath: destinationPath,
      platform: input.platform,
      arch: input.arch,
    });
    return { artifactPath: destinationPath, receipt };
  } catch (error) {
    await rm(partialPath, { force: true }).catch((): undefined => undefined);
    await rm(destinationPath, { force: true }).catch((): undefined => undefined);
    throw error;
  }
}
