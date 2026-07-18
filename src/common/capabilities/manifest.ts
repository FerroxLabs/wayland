import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import {
  CAPABILITY_MANIFEST_CONTRACT,
  type CapabilityDefinition,
  type CapabilityManifest,
  type CapabilityPlatform,
  type CapabilityRequirements,
} from './types';

const DIGEST = /^sha256:[0-9a-f]{64}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const IDENTIFIER = /^[a-z0-9][a-z0-9._-]{0,127}$/;

const OFFICECLI_PLATFORMS = [
  [
    'darwin',
    'arm64',
    'officecli-mac-arm64',
    'sha256:b8582853cc464fa0bdb2fabc2803821472c9449c38b365a7be79fcb53d6356e7',
    'sha256:70187627656cb6a140ff05ea86682548ca47de196e8aa379152e29eb003b44ff',
  ],
  [
    'darwin',
    'x64',
    'officecli-mac-x64',
    'sha256:f0073b16a5181837d0b0df3e264a338066b02f4ac16f4758538873fbc32bf9b2',
    'sha256:70187627656cb6a140ff05ea86682548ca47de196e8aa379152e29eb003b44ff',
  ],
  [
    'linux',
    'arm64',
    'officecli-linux-arm64',
    'sha256:25bda0d225932159b14ea6ade532c8dbecd2136f1b5c672c003b45bd75afbbb2',
  ],
  ['linux', 'x64', 'officecli-linux-x64', 'sha256:2ca3d81be529fd103a7af95a2039b051a08af9d1b5c2c96e85e88731008c402c'],
  [
    'win32',
    'arm64',
    'officecli-win-arm64.exe',
    'sha256:94e5ebb1900974681430197035476e2e6c6e905e2e45c2c71ed7de0a3ba87131',
  ],
  ['win32', 'x64', 'officecli-win-x64.exe', 'sha256:0ba8550bb236a2a23982311a747b22f318d7bd18c1c06a402d96f7642c85fb6a'],
].map(([platform, arch, artifact, binarySha256, publisherProofSha256]) =>
  Object.assign({ platform, arch, artifact, binarySha256 }, publisherProofSha256 ? { publisherProofSha256 } : undefined)
) as CapabilityPlatform[];

const OFFICECLI_FIXTURE = {
  id: 'office.native-authoring',
  version: '1.0.136',
  operations: ['create', 'mutate', 'query', 'validate', 'view'],
  formats: ['docx', 'xlsx', 'pptx'],
  dependencies: [],
  hostAvailability: 'target-bundled',
  backendSupport: ['acp', 'gemini', 'wcore'],
  executionMode: 'local-binary',
  requirements: { permission: 'ask-or-trusted-edits', network: 'none', cost: 'none', credentials: [] },
  platforms: OFFICECLI_PLATFORMS,
  degradedBehavior: 'unavailable-no-fallback',
  enforceability: 'enforced',
} as const satisfies Omit<CapabilityDefinition, 'fixtureDigest'>;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .toSorted(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function capabilityFixtureDigest(definition: Omit<CapabilityDefinition, 'fixtureDigest'>): `sha256:${string}` {
  return `sha256:${bytesToHex(sha256(new TextEncoder().encode(canonical(definition))))}`;
}

export const OFFICECLI_CAPABILITY_ID = OFFICECLI_FIXTURE.id;
export const OFFICECLI_CAPABILITY = Object.freeze({
  ...OFFICECLI_FIXTURE,
  fixtureDigest: capabilityFixtureDigest(OFFICECLI_FIXTURE),
}) satisfies CapabilityDefinition;
export const WAYLAND_CAPABILITY_MANIFEST = Object.freeze({
  contract: CAPABILITY_MANIFEST_CONTRACT,
  id: 'wayland.shared-capabilities',
  version: '1.0.0',
  capabilities: Object.freeze([OFFICECLI_CAPABILITY]),
}) satisfies CapabilityManifest;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function exactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = []
): boolean {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => key in value) && Object.keys(value).every((key) => allowed.has(key));
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0);
}
function validRequirements(value: unknown): value is CapabilityRequirements {
  return (
    isRecord(value) &&
    exactKeys(value, ['permission', 'network', 'cost', 'credentials']) &&
    ['none', 'ask', 'ask-or-trusted-edits', 'trusted-edits'].includes(String(value.permission)) &&
    ['none', 'optional', 'required'].includes(String(value.network)) &&
    ['none', 'metered', 'unknown'].includes(String(value.cost)) &&
    Array.isArray(value.credentials) &&
    value.credentials.every((entry) => typeof entry === 'string' && entry.length > 0)
  );
}
function validPlatform(value: unknown): value is CapabilityPlatform {
  return (
    isRecord(value) &&
    exactKeys(value, ['platform', 'arch', 'artifact', 'binarySha256'], ['publisherProofSha256']) &&
    ['darwin', 'linux', 'win32'].includes(String(value.platform)) &&
    ['arm64', 'x64'].includes(String(value.arch)) &&
    typeof value.artifact === 'string' &&
    DIGEST.test(String(value.binarySha256)) &&
    (value.publisherProofSha256 === undefined || DIGEST.test(String(value.publisherProofSha256)))
  );
}

export type CapabilityValidation = Readonly<{ ok: true; value: CapabilityManifest } | { ok: false; reason: string }>;

/** Validate identity, unknown critical fields and every fixture digest. */
export function validateCapabilityManifest(value: unknown): CapabilityValidation {
  if (!isRecord(value) || !exactKeys(value, ['contract', 'id', 'version', 'capabilities'])) {
    return { ok: false, reason: 'Capability manifest shape or critical fields are invalid.' };
  }
  if (
    value.contract !== CAPABILITY_MANIFEST_CONTRACT ||
    typeof value.id !== 'string' ||
    !IDENTIFIER.test(value.id) ||
    typeof value.version !== 'string' ||
    !VERSION.test(value.version) ||
    !Array.isArray(value.capabilities) ||
    value.capabilities.length === 0
  )
    return { ok: false, reason: 'Capability manifest identity or version is invalid.' };

  const keys = [
    'id',
    'version',
    'operations',
    'formats',
    'dependencies',
    'hostAvailability',
    'backendSupport',
    'executionMode',
    'requirements',
    'platforms',
    'fixtureDigest',
    'degradedBehavior',
    'enforceability',
  ];
  const seen = new Set<string>();
  for (const raw of value.capabilities) {
    if (!isRecord(raw) || !exactKeys(raw, keys))
      return { ok: false, reason: 'Capability definition shape or critical fields are invalid.' };
    if (
      typeof raw.id !== 'string' ||
      !IDENTIFIER.test(raw.id) ||
      typeof raw.version !== 'string' ||
      !VERSION.test(raw.version) ||
      !strings(raw.operations) ||
      !strings(raw.formats) ||
      !Array.isArray(raw.dependencies) ||
      !raw.dependencies.every((x) => typeof x === 'string') ||
      !strings(raw.backendSupport) ||
      !['target-bundled', 'host-provided', 'remote'].includes(String(raw.hostAvailability)) ||
      !['local-binary', 'host-service', 'remote-provider'].includes(String(raw.executionMode)) ||
      !validRequirements(raw.requirements) ||
      !Array.isArray(raw.platforms) ||
      raw.platforms.length === 0 ||
      !raw.platforms.every(validPlatform) ||
      !DIGEST.test(String(raw.fixtureDigest)) ||
      !['unavailable-no-fallback', 'read-only', 'explicit-broker-consent'].includes(String(raw.degradedBehavior)) ||
      !['enforced', 'brokered', 'advisory'].includes(String(raw.enforceability))
    )
      return { ok: false, reason: `Capability definition ${String(raw.id)} is malformed.` };
    if (seen.has(raw.id)) return { ok: false, reason: `Duplicate capability id: ${raw.id}.` };
    seen.add(raw.id);
    const { fixtureDigest, ...fixture } = raw;
    if (capabilityFixtureDigest(fixture as Omit<CapabilityDefinition, 'fixtureDigest'>) !== fixtureDigest) {
      return { ok: false, reason: `Capability fixture digest mismatch: ${raw.id}.` };
    }
  }
  return { ok: true, value: value as CapabilityManifest };
}

export function findCapabilityPlatform(definition: CapabilityDefinition, platform: string, arch: string) {
  return definition.platforms.find((entry) => entry.platform === platform && entry.arch === arch);
}
