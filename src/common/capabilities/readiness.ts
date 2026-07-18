import { findCapabilityPlatform, validateCapabilityManifest } from './manifest';
import {
  CAPABILITY_EVIDENCE_CONTRACT,
  type CapabilityDefinition,
  type CapabilityEvidence,
  type CapabilityReadiness,
  type CapabilityRequirements,
  type CapabilitySelectionContext,
} from './types';

const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[a-z0-9][a-z0-9._:-]{0,255}$/;
const MAX_FUTURE_SKEW_MS = 30_000;
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function exactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []) {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => key in value) && Object.keys(value).every((key) => allowed.has(key));
}
function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === 'string' && x.length > 0);
}
function validRequirements(value: unknown): value is CapabilityRequirements {
  return (
    isRecord(value) &&
    exactKeys(value, ['permission', 'network', 'cost', 'credentials']) &&
    ['none', 'ask', 'ask-or-trusted-edits', 'trusted-edits'].includes(String(value.permission)) &&
    ['none', 'optional', 'required'].includes(String(value.network)) &&
    ['none', 'metered', 'unknown'].includes(String(value.cost)) &&
    Array.isArray(value.credentials) &&
    value.credentials.every((x) => typeof x === 'string' && x.length > 0)
  );
}

export type EvidenceValidation = Readonly<{ ok: true; value: CapabilityEvidence } | { ok: false; reason: string }>;
/** Strict evidence validator; unknown fields are critical and fail closed. */
export function validateCapabilityEvidence(value: unknown): EvidenceValidation {
  const required = [
    'contract',
    'evidenceId',
    'capabilityId',
    'capabilityVersion',
    'manifestId',
    'manifestVersion',
    'fixtureDigest',
    'source',
    'sourceInstance',
    'correlationId',
    'observedAt',
    'expiresAt',
    'platform',
    'arch',
    'backend',
    'executionMode',
    'status',
    'operations',
    'formats',
    'dependencies',
    'requirements',
    'reason',
  ];
  if (!isRecord(value) || !exactKeys(value, required, ['artifact']))
    return { ok: false, reason: 'Capability evidence shape or critical fields are invalid.' };
  const ids = ['evidenceId', 'capabilityId', 'manifestId', 'source', 'sourceInstance', 'correlationId', 'backend'];
  if (
    value.contract !== CAPABILITY_EVIDENCE_CONTRACT ||
    ids.some((key) => typeof value[key] !== 'string' || !ID.test(String(value[key]))) ||
    typeof value.capabilityVersion !== 'string' ||
    typeof value.manifestVersion !== 'string' ||
    !DIGEST.test(String(value.fixtureDigest)) ||
    !Number.isFinite(value.observedAt) ||
    !Number.isFinite(value.expiresAt) ||
    Number(value.observedAt) > Number(value.expiresAt) ||
    !['darwin', 'linux', 'win32'].includes(String(value.platform)) ||
    !['arm64', 'x64'].includes(String(value.arch)) ||
    !['local-binary', 'host-service', 'remote-provider'].includes(String(value.executionMode)) ||
    !['available', 'degraded', 'unavailable'].includes(String(value.status)) ||
    !stringArray(value.operations) ||
    !stringArray(value.formats) ||
    !Array.isArray(value.dependencies) ||
    !value.dependencies.every(
      (entry) =>
        isRecord(entry) &&
        exactKeys(entry, ['id', 'status']) &&
        typeof entry.id === 'string' &&
        ID.test(entry.id) &&
        ['ready', 'unavailable'].includes(String(entry.status))
    ) ||
    !validRequirements(value.requirements) ||
    typeof value.reason !== 'string'
  )
    return { ok: false, reason: 'Capability evidence values are malformed.' };
  if (
    value.artifact !== undefined &&
    (!isRecord(value.artifact) ||
      !exactKeys(value.artifact, ['binarySha256', 'publisherProof']) ||
      !DIGEST.test(String(value.artifact.binarySha256)) ||
      !DIGEST.test(String(value.artifact.publisherProof)))
  ) {
    return { ok: false, reason: 'Capability artifact evidence is malformed.' };
  }
  return { ok: true, value: value as CapabilityEvidence };
}

const PERMISSION: CapabilityRequirements['permission'][] = ['none', 'ask', 'ask-or-trusted-edits', 'trusted-edits'];
const NETWORK: CapabilityRequirements['network'][] = ['none', 'optional', 'required'];
const COST: CapabilityRequirements['cost'][] = ['none', 'unknown', 'metered'];
function stricter<T extends string>(values: readonly T[], rank: readonly T[]): T {
  return values.reduce((a, b) => (rank.indexOf(b) > rank.indexOf(a) ? b : a));
}
function mergeRequirements(
  definition: CapabilityDefinition,
  evidence: readonly CapabilityEvidence[]
): CapabilityRequirements {
  const all = [definition.requirements, ...evidence.map((entry) => entry.requirements)];
  return Object.freeze({
    permission: stricter(
      all.map((x) => x.permission),
      PERMISSION
    ),
    network: stricter(
      all.map((x) => x.network),
      NETWORK
    ),
    cost: stricter(
      all.map((x) => x.cost),
      COST
    ),
    credentials: Object.freeze([...new Set(all.flatMap((x) => x.credentials))].toSorted()),
  });
}
function intersection(
  expected: readonly string[],
  evidence: readonly CapabilityEvidence[],
  key: 'operations' | 'formats'
) {
  return expected.filter((item) => evidence.every((entry) => entry[key].includes(item)));
}
function unavailable(id: string, reason: string): CapabilityReadiness {
  return Object.freeze({
    capabilityId: id,
    capabilityVersion: 'unknown',
    state: 'unavailable',
    canInvoke: false,
    requiresBroker: false,
    enforceability: 'enforced',
    operations: Object.freeze([]),
    formats: Object.freeze([]),
    requirements: Object.freeze({ permission: 'ask', network: 'required', cost: 'unknown', credentials: [] }),
    evidenceIds: Object.freeze([]),
    reason,
  });
}

/** Sole readiness selector; producers cannot widen the conservative intersection. */
export function selectCapabilityReadiness(
  manifestValue: unknown,
  evidenceValues: readonly unknown[],
  context: CapabilitySelectionContext
): CapabilityReadiness {
  const checkedManifest = validateCapabilityManifest(manifestValue);
  if ('reason' in checkedManifest) return unavailable(context.capabilityId, checkedManifest.reason);
  const manifest = checkedManifest.value;
  const definition = manifest.capabilities.find((entry) => entry.id === context.capabilityId);
  if (!definition) return unavailable(context.capabilityId, 'Capability is not declared by the shared manifest.');
  const platform = findCapabilityPlatform(definition, context.platform, context.arch);
  if (!platform || !definition.backendSupport.includes(context.backend))
    return unavailable(context.capabilityId, 'Capability is unavailable on this target or backend.');

  const validated: CapabilityEvidence[] = [];
  for (const raw of evidenceValues) {
    const checked = validateCapabilityEvidence(raw);
    if ('reason' in checked) return unavailable(context.capabilityId, checked.reason);
    validated.push(checked.value);
  }
  const evidence = validated.filter((entry) => entry.capabilityId === definition.id);
  if (evidence.length === 0)
    return unavailable(context.capabilityId, 'No authoritative capability evidence is available.');
  for (const entry of evidence) {
    if (
      entry.capabilityVersion !== definition.version ||
      entry.manifestId !== manifest.id ||
      entry.manifestVersion !== manifest.version ||
      entry.fixtureDigest !== definition.fixtureDigest ||
      entry.correlationId !== context.correlationId ||
      entry.platform !== context.platform ||
      entry.arch !== context.arch ||
      entry.backend !== context.backend ||
      entry.executionMode !== definition.executionMode
    ) {
      return unavailable(context.capabilityId, 'Capability evidence identity, correlation, or target does not match.');
    }
    if (entry.observedAt > context.now + MAX_FUTURE_SKEW_MS || entry.expiresAt <= context.now)
      return unavailable(context.capabilityId, 'Capability evidence is stale or from the future.');
    if (entry.dependencies.some((dependency) => dependency.status !== 'ready'))
      return unavailable(context.capabilityId, 'A capability dependency is unavailable.');
    if (
      entry.status !== 'unavailable' &&
      (entry.artifact?.binarySha256 !== platform.binarySha256 ||
        !platform.publisherProofSha256 ||
        entry.artifact.publisherProof !== platform.publisherProofSha256)
    )
      return unavailable(context.capabilityId, 'Capability artifact is not bound to the target manifest digest.');
  }
  const operations = Object.freeze(intersection(definition.operations, evidence, 'operations'));
  const formats = Object.freeze(intersection(definition.formats, evidence, 'formats'));
  const requirements = mergeRequirements(definition, evidence);
  const evidenceIds = Object.freeze(evidence.map((entry) => entry.evidenceId).toSorted());
  const missingContract =
    operations.length !== definition.operations.length || formats.length !== definition.formats.length;
  const unavailableEvidence = evidence.find((entry) => entry.status === 'unavailable');
  if (unavailableEvidence || missingContract)
    return Object.freeze({
      capabilityId: definition.id,
      capabilityVersion: definition.version,
      state: 'unavailable',
      canInvoke: false,
      requiresBroker: false,
      enforceability: definition.enforceability,
      operations,
      formats,
      requirements,
      evidenceIds,
      reason: unavailableEvidence?.reason ?? 'Capability evidence does not cover the complete declared contract.',
    });
  if (definition.enforceability === 'advisory')
    return Object.freeze({
      capabilityId: definition.id,
      capabilityVersion: definition.version,
      state: 'advisory',
      canInvoke: false,
      requiresBroker: false,
      enforceability: definition.enforceability,
      operations,
      formats,
      requirements,
      evidenceIds,
      reason: 'Advisory evidence may inform the user but cannot grant invocation authority.',
    });
  if (definition.enforceability === 'brokered')
    return Object.freeze({
      capabilityId: definition.id,
      capabilityVersion: definition.version,
      state: 'brokered',
      canInvoke: false,
      requiresBroker: true,
      enforceability: definition.enforceability,
      operations,
      formats,
      requirements,
      evidenceIds,
      reason: 'Capability requires an explicit broker decision before invocation.',
    });
  const degraded = evidence.some((entry) => entry.status === 'degraded');
  return Object.freeze({
    capabilityId: definition.id,
    capabilityVersion: definition.version,
    state: degraded ? 'degraded' : 'ready',
    canInvoke: !degraded,
    requiresBroker: false,
    enforceability: definition.enforceability,
    operations,
    formats,
    requirements,
    evidenceIds,
    reason: degraded
      ? 'Capability evidence is degraded and cannot grant invocation.'
      : 'Capability evidence is current and enforced.',
  });
}
