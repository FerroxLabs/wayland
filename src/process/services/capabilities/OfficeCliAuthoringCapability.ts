/** OfficeCLI capability evidence producer. It never decides readiness. */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  CAPABILITY_EVIDENCE_CONTRACT,
  OFFICECLI_CAPABILITY,
  WAYLAND_CAPABILITY_MANIFEST,
  findCapabilityPlatform,
  type CapabilityEvidence,
  type CapabilityPlatform,
} from '@/common/capabilities';
import { getBundledOfficeCliDir } from '@process/utils/shellEnv';

export const OFFICECLI_PINNED_AUTHORING_VERSION = OFFICECLI_CAPABILITY.version;
export const REQUIRED_OFFICECLI_AUTHORING_COMMANDS = [
  'create',
  'open',
  'close',
  'add',
  'set',
  'query',
  'validate',
  'view',
] as const;
const EVIDENCE_TTL_MS = 5 * 60_000;
const DARWIN_TEAM_ID = '52JQX2HUSC';
const DARWIN_ENTITLEMENTS = ['com.apple.security.cs.allow-jit'];
const OFFICECLI_MANIFEST_REQUIRED_KEYS = [
  'contract',
  'version',
  'platform',
  'arch',
  'asset',
  'binary',
  'sha256',
  'source',
  'publisherSignatureProof',
  'contractProof',
  'smokeProof',
] as const;
const OFFICECLI_MANIFEST_OPTIONAL_KEYS = ['reportedVersion', 'libc'] as const;

type OfficeCliManifest = {
  contract: string;
  version: string;
  reportedVersion?: string;
  platform: string;
  arch: string;
  libc?: string;
  asset: string;
  binary: string;
  sha256: string;
  source: string;
  publisherSignatureProof: unknown;
  contractProof: unknown;
  smokeProof: unknown;
};

export type OfficeCliProbeContext = Readonly<{
  correlationId: string;
  backend: string;
  now?: number;
  platform?: CapabilityPlatform['platform'];
  arch?: CapabilityPlatform['arch'];
  bundledDir?: string | null;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isRecord(value))
    return `{${Object.entries(value)
      .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
function digest(value: Buffer | string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}
function exactStringArray(value: unknown, expected: readonly string[]) {
  return Array.isArray(value) && expected.every((entry) => value.includes(entry));
}
function hasExactManifestShape(value: Record<string, unknown>): boolean {
  const allowed = new Set<string>([...OFFICECLI_MANIFEST_REQUIRED_KEYS, ...OFFICECLI_MANIFEST_OPTIONAL_KEYS]);
  return (
    OFFICECLI_MANIFEST_REQUIRED_KEYS.every((key) => key in value) && Object.keys(value).every((key) => allowed.has(key))
  );
}
function validPublisherProof(platform: string, proof: unknown): boolean {
  if (platform !== 'darwin' || !isRecord(proof)) return false;
  return (
    proof.contract === 'apple-developer-id/1.0' &&
    proof.teamIdentifier === DARWIN_TEAM_ID &&
    proof.hardenedRuntime === true &&
    proof.secureTimestamp === true &&
    Array.isArray(proof.entitlements) &&
    canonical([...proof.entitlements].toSorted()) === canonical(DARWIN_ENTITLEMENTS)
  );
}

export type OfficeCliClassification = Readonly<
  | { available: true; binarySha256: `sha256:${string}`; publisherProof: `sha256:${string}` }
  | { available: false; reason: string }
>;

/** Pure target-exact classifier used by both the IO producer and hostile tests. */
export function classifyBundledOfficeCli(
  raw: unknown,
  actualBinarySha256: `sha256:${string}`,
  platform: CapabilityPlatform['platform'],
  arch: CapabilityPlatform['arch']
): OfficeCliClassification {
  const target = findCapabilityPlatform(OFFICECLI_CAPABILITY, platform, arch);
  if (!target) return { available: false, reason: 'OfficeCLI is not declared for this target.' };
  if (!isRecord(raw) || !hasExactManifestShape(raw))
    return { available: false, reason: 'OfficeCLI manifest is malformed.' };
  const manifest = raw as OfficeCliManifest;
  const binary = platform === 'win32' ? 'officecli.exe' : 'officecli';
  if (
    manifest.contract !== 'iofficeai-officecli-native' ||
    manifest.version !== `v${OFFICECLI_CAPABILITY.version}` ||
    manifest.platform !== platform ||
    manifest.arch !== arch ||
    manifest.asset !== target.artifact ||
    manifest.binary !== binary ||
    manifest.sha256 !== target.binarySha256 ||
    actualBinarySha256 !== target.binarySha256
  ) {
    return { available: false, reason: 'OfficeCLI manifest identity, target, or checksum does not match.' };
  }
  if (!validPublisherProof(platform, manifest.publisherSignatureProof)) {
    return { available: false, reason: 'OfficeCLI publisher proof is unavailable or invalid for this target.' };
  }
  if (
    !isRecord(manifest.contractProof) ||
    manifest.contractProof.contract !== 'wayland-officecli-authoring/1.0' ||
    manifest.contractProof.release !== manifest.version
  ) {
    return { available: false, reason: 'OfficeCLI authoring contract proof is invalid.' };
  }
  if (
    !isRecord(manifest.smokeProof) ||
    !exactStringArray(manifest.smokeProof.formats, OFFICECLI_CAPABILITY.formats) ||
    !exactStringArray(manifest.smokeProof.operations, OFFICECLI_CAPABILITY.operations)
  ) {
    return { available: false, reason: 'OfficeCLI smoke proof does not cover the declared contract.' };
  }
  return {
    available: true,
    binarySha256: actualBinarySha256,
    publisherProof: digest(canonical(manifest.publisherSignatureProof)),
  };
}

function evidenceBase(
  context: Required<Pick<OfficeCliProbeContext, 'correlationId' | 'backend'>>,
  now: number,
  platform: CapabilityPlatform['platform'],
  arch: CapabilityPlatform['arch']
) {
  return {
    contract: CAPABILITY_EVIDENCE_CONTRACT,
    capabilityId: OFFICECLI_CAPABILITY.id,
    capabilityVersion: OFFICECLI_CAPABILITY.version,
    manifestId: WAYLAND_CAPABILITY_MANIFEST.id,
    manifestVersion: WAYLAND_CAPABILITY_MANIFEST.version,
    fixtureDigest: OFFICECLI_CAPABILITY.fixtureDigest,
    source: 'officecli-bundle',
    correlationId: context.correlationId,
    observedAt: now,
    expiresAt: now + EVIDENCE_TTL_MS,
    platform,
    arch,
    backend: context.backend,
    executionMode: OFFICECLI_CAPABILITY.executionMode,
    dependencies: [],
    requirements: OFFICECLI_CAPABILITY.requirements,
  } as const;
}

/** Read only the canonical bundled target. PATH executables are never consulted. */
export async function probeOfficeCliAuthoringEvidence(context: OfficeCliProbeContext): Promise<CapabilityEvidence> {
  const now = context.now ?? Date.now();
  const platform = context.platform ?? (process.platform as CapabilityPlatform['platform']);
  const arch = context.arch ?? (process.arch as CapabilityPlatform['arch']);
  const base = evidenceBase(context, now, platform, arch);
  const bundledDir = context.bundledDir === undefined ? getBundledOfficeCliDir() : context.bundledDir;
  if (!bundledDir)
    return {
      ...base,
      evidenceId: `officecli-missing:${platform}:${arch}`,
      sourceInstance: `officecli-missing:${platform}:${arch}`,
      status: 'unavailable',
      operations: [],
      formats: [],
      reason: 'The target-exact bundled OfficeCLI runtime is unavailable.',
    };
  try {
    const binaryName = platform === 'win32' ? 'officecli.exe' : 'officecli';
    const [manifestBytes, binaryBytes] = await Promise.all([
      readFile(path.join(bundledDir, 'manifest.json')),
      readFile(path.join(bundledDir, binaryName)),
    ]);
    const binarySha256 = digest(binaryBytes);
    const result = classifyBundledOfficeCli(JSON.parse(manifestBytes.toString('utf8')), binarySha256, platform, arch);
    if ('reason' in result)
      return {
        ...base,
        evidenceId: `officecli-invalid:${platform}:${arch}`,
        sourceInstance: `officecli-invalid:${platform}:${arch}`,
        status: 'unavailable',
        operations: [],
        formats: [],
        reason: result.reason,
      };
    return {
      ...base,
      evidenceId: `officecli:${binarySha256.slice(7)}`,
      sourceInstance: `officecli:${binarySha256.slice(7)}`,
      status: 'available',
      operations: OFFICECLI_CAPABILITY.operations,
      formats: OFFICECLI_CAPABILITY.formats,
      artifact: { binarySha256, publisherProof: result.publisherProof },
      reason: 'Target-exact OfficeCLI bundle evidence is valid.',
    };
  } catch {
    return {
      ...base,
      evidenceId: `officecli-invalid:${platform}:${arch}`,
      sourceInstance: `officecli-invalid:${platform}:${arch}`,
      status: 'unavailable',
      operations: [],
      formats: [],
      reason: 'The target-exact OfficeCLI bundle could not be validated.',
    };
  }
}
