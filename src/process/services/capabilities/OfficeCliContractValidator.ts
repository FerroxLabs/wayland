import { createHash } from 'node:crypto';
import { OFFICECLI_CAPABILITY, findCapabilityPlatform, type CapabilityPlatform } from '@/common/capabilities';
import officeCliContract from '../../../../contracts/officecli/v1/contract.json';
import executableLedger from '../../../../scripts/supply-chain/third-party-executables.json';

export const OFFICECLI_PINNED_AUTHORING_VERSION = OFFICECLI_CAPABILITY.version;
export const REQUIRED_OFFICECLI_AUTHORING_COMMANDS = officeCliContract.requiredCommands;

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
  'contractSha256',
  'capabilityFixtureDigest',
  'skillProof',
  'ledgerProof',
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
  contractSha256: string;
  capabilityFixtureDigest: string;
  skillProof: unknown;
  ledgerProof: unknown;
  publisherSignatureProof: unknown;
  contractProof: unknown;
  smokeProof: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.entries(value)
      .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function digestOfficeCliEvidence(value: Buffer | string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function exactStringArray(value: unknown, expected: readonly string[]): boolean {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === 'string') &&
    new Set(value).size === value.length &&
    canonical([...value].toSorted()) === canonical([...expected].toSorted())
  );
}

function exactKeys(value: Record<string, unknown>, required: readonly string[]): boolean {
  return required.every((key) => key in value) && Object.keys(value).every((key) => required.includes(key));
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
    exactKeys(proof, ['contract', 'teamIdentifier', 'hardenedRuntime', 'secureTimestamp', 'entitlements']) &&
    proof.contract === 'apple-developer-id/1.0' &&
    proof.teamIdentifier === DARWIN_TEAM_ID &&
    proof.hardenedRuntime === true &&
    proof.secureTimestamp === true &&
    Array.isArray(proof.entitlements) &&
    canonical([...proof.entitlements].toSorted()) === canonical(DARWIN_ENTITLEMENTS)
  );
}

export const OFFICECLI_CONTRACT_SHA256 = digestOfficeCliEvidence(canonical(officeCliContract));
export const OFFICECLI_SKILL_PROOF = {
  contract: 'wayland-officecli-skills/1.0',
  skills: officeCliContract.requiredSkills
    .map((skill) => ({ id: skill.id, path: skill.path, sha256: skill.sha256 }))
    .toSorted((left, right) => left.id.localeCompare(right.id)),
};
const OFFICECLI_LEDGER_ENTRY = executableLedger.entries.find((entry) => entry.id === 'officecli');
export const OFFICECLI_LEDGER_PROOF = {
  contract: executableLedger.contract,
  ledgerSha256: digestOfficeCliEvidence(canonical(executableLedger)),
  entrySha256: digestOfficeCliEvidence(canonical(OFFICECLI_LEDGER_ENTRY)),
  hostedFallbackAvailable: false,
};

export function validOfficeCliSkillProof(value: unknown): boolean {
  return (
    isRecord(value) &&
    exactKeys(value, ['contract', 'skills']) &&
    value.contract === OFFICECLI_SKILL_PROOF.contract &&
    canonical(value.skills) === canonical(OFFICECLI_SKILL_PROOF.skills)
  );
}

function validLedgerProof(value: unknown): boolean {
  return (
    OFFICECLI_LEDGER_ENTRY?.version === `v${OFFICECLI_CAPABILITY.version}` &&
    OFFICECLI_LEDGER_ENTRY.hostedFallback.available === false &&
    OFFICECLI_LEDGER_ENTRY.hostedFallback.owner === null &&
    OFFICECLI_LEDGER_ENTRY.hostedFallback.endpoint === null &&
    OFFICECLI_LEDGER_ENTRY.networkCostConsent.networkAccess === false &&
    OFFICECLI_LEDGER_ENTRY.networkCostConsent.mayIncurCost === false &&
    OFFICECLI_LEDGER_ENTRY.networkCostConsent.required === false &&
    isRecord(value) &&
    exactKeys(value, ['contract', 'ledgerSha256', 'entrySha256', 'hostedFallbackAvailable']) &&
    canonical(value) === canonical(OFFICECLI_LEDGER_PROOF)
  );
}

export type OfficeCliClassification = Readonly<
  | { available: true; binarySha256: `sha256:${string}`; publisherProof: `sha256:${string}` }
  | { available: false; reason: string }
>;

/** The single pure authority decision shared by PATH and runtime evidence. */
export function classifyBundledOfficeCli(
  raw: unknown,
  actualBinarySha256: `sha256:${string}`,
  platform: CapabilityPlatform['platform'],
  arch: CapabilityPlatform['arch']
): OfficeCliClassification {
  const target = findCapabilityPlatform(OFFICECLI_CAPABILITY, platform, arch);
  if (!target) return { available: false, reason: 'OfficeCLI is not declared for this target.' };
  if (!isRecord(raw) || !hasExactManifestShape(raw)) {
    return { available: false, reason: 'OfficeCLI manifest is malformed.' };
  }
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
    actualBinarySha256 !== target.binarySha256 ||
    manifest.contractSha256 !== OFFICECLI_CONTRACT_SHA256 ||
    manifest.capabilityFixtureDigest !== OFFICECLI_CAPABILITY.fixtureDigest
  ) {
    return { available: false, reason: 'OfficeCLI manifest identity, target, or checksum does not match.' };
  }
  const exactReleaseUrl = `https://github.com/iOfficeAI/OfficeCLI/releases/download/${manifest.version}/${manifest.asset}`;
  if (manifest.source !== 'verified-cache' && manifest.source !== exactReleaseUrl) {
    return { available: false, reason: 'OfficeCLI source provenance is unsupported.' };
  }
  if (!validPublisherProof(platform, manifest.publisherSignatureProof)) {
    return { available: false, reason: 'OfficeCLI publisher proof is unavailable or invalid for this target.' };
  }
  if (
    !isRecord(manifest.contractProof) ||
    !exactKeys(manifest.contractProof, ['contract', 'release']) ||
    manifest.contractProof.contract !== 'wayland-officecli-authoring/1.0' ||
    manifest.contractProof.release !== manifest.version
  ) {
    return { available: false, reason: 'OfficeCLI authoring contract proof is invalid.' };
  }
  if (
    !isRecord(manifest.smokeProof) ||
    !exactKeys(manifest.smokeProof, ['formats', 'operations', 'specialistPacks', 'specialistPrimitives']) ||
    !exactStringArray(manifest.smokeProof.formats, OFFICECLI_CAPABILITY.formats) ||
    !exactStringArray(manifest.smokeProof.operations, OFFICECLI_CAPABILITY.operations) ||
    !exactStringArray(manifest.smokeProof.specialistPacks, [
      'officecli-financial-model',
      'officecli-data-dashboard',
      'officecli-word-form',
      'officecli-pitch-deck',
    ]) ||
    !exactStringArray(manifest.smokeProof.specialistPrimitives, [
      'formula-evaluation',
      'named-range',
      'data-validation',
      'conditional-formatting',
      'xlsx-chart',
      'structured-content-control',
      'legacy-form-field',
      'document-protection',
      'connected-shapes',
      'speaker-notes',
      'pptx-embedded-chart',
    ])
  ) {
    return { available: false, reason: 'OfficeCLI smoke proof does not cover the declared contract.' };
  }
  if (!validOfficeCliSkillProof(manifest.skillProof) || !validLedgerProof(manifest.ledgerProof)) {
    return { available: false, reason: 'OfficeCLI skills or executable ledger proof is invalid.' };
  }
  if (manifest.reportedVersion !== undefined && manifest.reportedVersion !== OFFICECLI_CAPABILITY.version) {
    return { available: false, reason: 'OfficeCLI reported version disagrees with the pinned contract.' };
  }
  return {
    available: true,
    binarySha256: actualBinarySha256,
    publisherProof: digestOfficeCliEvidence(canonical(manifest.publisherSignatureProof)),
  };
}
