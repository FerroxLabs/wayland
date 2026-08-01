/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Closed state-authority adapter ledger for backend-owned session state.
 *
 * This seals which execution-engine backends bind an explicit, producer-owned
 * session/handle authority to exact capture / resume / degraded behavior. It
 * extends the storage-authority inventory (plan 01-06) without weakening #896:
 * Core remains producer-quiescence dependent, so it cannot enter the cohort
 * until the producer-owned quiescence successor is accepted.
 *
 * Three representative adapters are sealed here:
 *   - `acp.session`    — resumable through a persisted, wrapper-pinned handle.
 *   - `core.session`   — producer-quiescence dependent; deferred to #896.
 *   - `gemini.session` — non-resumable; truthfully degraded to read-only.
 *
 * Desktop SQLite and Office/artifact workspaces stay separately inventoried
 * storage authorities: they are never backend session adapters and can never
 * substitute for one.
 *
 * Everything here is fail-closed. The compiled ledger is hashed with a stable
 * canonical digest and pinned; any byte drift, unknown/duplicate adapter,
 * missing field, ledger/runtime skew, or silent widening of a non-resumable
 * backend into an eligible one throws at module load rather than degrading into
 * a plausible-but-wrong "green". An unproven or non-resumable backend is
 * mechanically excluded from cohort eligibility, never normalized into success.
 */

import { createHash } from 'node:crypto';
import { ACP_SESSION_AUTHORITY } from '@process/task/AcpAgentManager';
import { GEMINI_SESSION_AUTHORITY } from '@process/task/GeminiAgentManager';
import ledgerJson from '../../../../../contracts/recovery/state-authority-ledger.json';

export const STATE_AUTHORITY_LEDGER_CONTRACT = 'wayland-state-authority-ledger/1.0' as const;

/** Compiled content digest of the sealed ledger. Drift fails closed at load. */
export const STATE_AUTHORITY_LEDGER_DIGEST =
  'dcebba4e439615fac5713a04dd4dd010cbfc2e7a1ae8daa5f9b71bd4c46ea397' as const;

const ADAPTER_IDS = ['acp.session', 'core.session', 'gemini.session'] as const;
const PRODUCERS = ['acp-backend', 'gemini-cli', 'wayland-core'] as const;
const RESUMABILITY = ['backend-session-replay', 'producer-quiesced', 'non-resumable'] as const;
const EPOCH_SOURCES = ['backend-session-updated-at', 'producer-quiescence-lease', 'none'] as const;
const QUIESCENCE = ['backend-owned', 'producer-owned-blocked', 'not-applicable'] as const;
const RESTORE_OWNERS = ['acp-backend', 'wayland-core', 'none'] as const;
const VALIDATION_RECEIPTS = ['acp-wrapper-version-pin', 'core-quiescence-lease', 'none'] as const;
const SECRET_DISPOSITIONS = ['reference-only', 'external-producer', 'excluded'] as const;
const FAILURE_BEHAVIORS = ['fail-closed', 'degraded-read-only'] as const;
const STORAGE_AUTHORITY_IDS = ['desktop.sqlite', 'office.artifact-workspace'] as const;

export type AdapterId = (typeof ADAPTER_IDS)[number];
export type Producer = (typeof PRODUCERS)[number];
export type Resumability = (typeof RESUMABILITY)[number];
export type EpochSource = (typeof EPOCH_SOURCES)[number];
export type Quiescence = (typeof QUIESCENCE)[number];
export type RestoreOwner = (typeof RESTORE_OWNERS)[number];
export type ValidationReceipt = (typeof VALIDATION_RECEIPTS)[number];
export type SecretDisposition = (typeof SECRET_DISPOSITIONS)[number];
export type FailureBehavior = (typeof FAILURE_BEHAVIORS)[number];
export type StorageAuthorityId = (typeof STORAGE_AUTHORITY_IDS)[number];

export type StateAuthorityAdapter = Readonly<{
  id: AdapterId;
  producer: Producer;
  sessionHandle: Readonly<{ source: string; identity: string }>;
  resumability: Resumability;
  mutationEpoch: Readonly<{ source: EpochSource; bound: boolean }>;
  quiescence: Quiescence;
  restoreOwner: RestoreOwner;
  validationReceipt: ValidationReceipt;
  secretDisposition: SecretDisposition;
  failureBehavior: FailureBehavior;
  proven: boolean;
  cohortEligible: boolean;
  deferredBlocker?: string;
  note: string;
}>;

export type StorageAuthority = Readonly<{
  id: StorageAuthorityId;
  owner: 'desktop';
  kind: 'storage';
  substitutesBackendAdapter: false;
  note: string;
}>;

export type StateAuthorityLedger = Readonly<{
  contract: typeof STATE_AUTHORITY_LEDGER_CONTRACT;
  schemaVersion: 1;
  adapters: readonly StateAuthorityAdapter[];
  storageAuthorities: readonly StorageAuthority[];
}>;

/**
 * Authoritative runtime facts sourced from the production managers. The ledger
 * must stay in lockstep with these; a backend cannot claim in the ledger a
 * resumability its live manager does not implement. Core has no Desktop-owned
 * resumability to import — it is producer-quiescence dependent and blocked by
 * #896 — so its runtime fact is stated here and marked unproven.
 */
export const CORE_SESSION_AUTHORITY = {
  producer: 'wayland-core',
  handleSource: 'core.conversation-id',
  resumability: 'producer-quiesced',
  proven: false,
} as const;

export const RUNTIME_ADAPTER_FACTS: Readonly<
  Record<AdapterId, { producer: string; handleSource: string; resumability: string; proven: boolean }>
> = {
  'acp.session': ACP_SESSION_AUTHORITY,
  'core.session': CORE_SESSION_AUTHORITY,
  'gemini.session': GEMINI_SESSION_AUTHORITY,
};

/** Stable canonical serialization: sort object keys by codepoint, recurse. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .toSorted(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

/** Hash of the stable canonical serialization. */
export function stateAuthorityLedgerDigest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  const record = asRecord(value, label);
  const actual = Object.keys(record).toSorted();
  const expected = [...keys].toSorted();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} contains missing or unknown fields.`);
  }
  return record;
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.normalize('NFC') !== value || value.includes('\0')) {
    throw new Error(`${label} is not canonical text.`);
  }
  return value;
}

function requireMember<T extends string>(value: unknown, members: readonly T[], label: string): T {
  if (typeof value !== 'string' || !members.includes(value as T)) {
    throw new Error(`${label} is not a permitted value.`);
  }
  return value as T;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean.`);
  return value;
}

function requireSortedUniqueIds(ids: readonly string[], label: string): void {
  for (let index = 1; index < ids.length; index += 1) {
    const previous = ids[index - 1]!;
    const current = ids[index]!;
    if (current === previous) throw new Error(`${label} contains a duplicate identity: ${current}`);
    if (current < previous) throw new Error(`${label} is not in stable ascending order at: ${current}`);
  }
}

function parseAdapter(value: unknown, label: string): StateAuthorityAdapter {
  const record = asRecord(value, label);
  const hasDeferredBlocker = 'deferredBlocker' in record;
  const keys = [
    'id',
    'producer',
    'sessionHandle',
    'resumability',
    'mutationEpoch',
    'quiescence',
    'restoreOwner',
    'validationReceipt',
    'secretDisposition',
    'failureBehavior',
    'proven',
    'cohortEligible',
    'note',
    ...(hasDeferredBlocker ? ['deferredBlocker'] : []),
  ];
  exactRecord(record, keys, label);

  const id = requireMember(record.id, ADAPTER_IDS, `${label}.id`);
  const producer = requireMember(record.producer, PRODUCERS, `${label}.producer`);
  const handle = exactRecord(record.sessionHandle, ['source', 'identity'], `${label}.sessionHandle`);
  const resumability = requireMember(record.resumability, RESUMABILITY, `${label}.resumability`);
  const epoch = exactRecord(record.mutationEpoch, ['source', 'bound'], `${label}.mutationEpoch`);
  const quiescence = requireMember(record.quiescence, QUIESCENCE, `${label}.quiescence`);
  const restoreOwner = requireMember(record.restoreOwner, RESTORE_OWNERS, `${label}.restoreOwner`);
  const validationReceipt = requireMember(record.validationReceipt, VALIDATION_RECEIPTS, `${label}.validationReceipt`);
  const secretDisposition = requireMember(record.secretDisposition, SECRET_DISPOSITIONS, `${label}.secretDisposition`);
  const failureBehavior = requireMember(record.failureBehavior, FAILURE_BEHAVIORS, `${label}.failureBehavior`);
  const proven = requireBoolean(record.proven, `${label}.proven`);
  const cohortEligible = requireBoolean(record.cohortEligible, `${label}.cohortEligible`);

  const adapter: StateAuthorityAdapter = {
    id,
    producer,
    sessionHandle: {
      source: requireText(handle.source, `${label}.sessionHandle.source`),
      identity: requireText(handle.identity, `${label}.sessionHandle.identity`),
    },
    resumability,
    mutationEpoch: {
      source: requireMember(epoch.source, EPOCH_SOURCES, `${label}.mutationEpoch.source`),
      bound: requireBoolean(epoch.bound, `${label}.mutationEpoch.bound`),
    },
    quiescence,
    restoreOwner,
    validationReceipt,
    secretDisposition,
    failureBehavior,
    proven,
    cohortEligible,
    ...(hasDeferredBlocker ? { deferredBlocker: requireText(record.deferredBlocker, `${label}.deferredBlocker`) } : {}),
    note: requireText(record.note, `${label}.note`),
  };

  // Cohort eligibility can never be self-asserted or widened: it is exactly the
  // conjunction of proven resumability. A non-resumable or unproven backend that
  // claims eligibility is a silent widening and fails closed.
  const derivedEligible = proven && resumability !== 'non-resumable';
  if (cohortEligible !== derivedEligible) {
    throw new Error(`${label}.cohortEligible must equal proven && resumable (derived ${String(derivedEligible)}).`);
  }
  // A non-resumable backend must degrade to read-only; a resumable/quiesced one
  // must fail closed. Failure behavior can never contradict resumability.
  const expectedFailure: FailureBehavior = resumability === 'non-resumable' ? 'degraded-read-only' : 'fail-closed';
  if (failureBehavior !== expectedFailure) {
    throw new Error(`${label}.failureBehavior must be ${expectedFailure} for ${resumability} resumability.`);
  }
  // A deferred blocker is only meaningful for an unproven, not-yet-eligible
  // backend; an eligible adapter cannot carry an outstanding blocker.
  if (hasDeferredBlocker && cohortEligible) {
    throw new Error(`${label} cannot be cohort eligible while a blocker is deferred.`);
  }
  if (adapter.restoreOwner === 'none' && resumability !== 'non-resumable') {
    throw new Error(`${label} must name a restore owner unless it is non-resumable.`);
  }
  return adapter;
}

function parseStorageAuthority(value: unknown, label: string): StorageAuthority {
  const record = exactRecord(value, ['id', 'owner', 'kind', 'substitutesBackendAdapter', 'note'], label);
  const id = requireMember(record.id, STORAGE_AUTHORITY_IDS, `${label}.id`);
  if (record.owner !== 'desktop') throw new Error(`${label}.owner must be desktop.`);
  if (record.kind !== 'storage') throw new Error(`${label}.kind must be storage.`);
  // A storage authority can never stand in for a backend session adapter.
  if (record.substitutesBackendAdapter !== false) {
    throw new Error(`${label} may not substitute for a backend adapter.`);
  }
  return {
    id,
    owner: 'desktop',
    kind: 'storage',
    substitutesBackendAdapter: false,
    note: requireText(record.note, `${label}.note`),
  };
}

/** Validate the whole ledger before any field becomes a source of truth. */
export function parseStateAuthorityLedger(value: unknown): StateAuthorityLedger {
  const record = exactRecord(value, ['contract', 'schemaVersion', 'adapters', 'storageAuthorities'], 'ledger');
  if (record.contract !== STATE_AUTHORITY_LEDGER_CONTRACT) throw new Error('ledger has an unsupported contract.');
  if (record.schemaVersion !== 1) throw new Error('ledger has an unsupported schema version.');

  if (!Array.isArray(record.adapters) || record.adapters.length !== ADAPTER_IDS.length) {
    throw new Error('ledger.adapters must exhaustively cover every declared adapter.');
  }
  const adapters = record.adapters.map((entry, index) => parseAdapter(entry, `ledger.adapters[${index}]`));
  const adapterIds = adapters.map((adapter) => adapter.id);
  requireSortedUniqueIds(adapterIds, 'ledger.adapters');
  for (const declared of ADAPTER_IDS) {
    if (!adapterIds.includes(declared)) throw new Error(`ledger.adapters omits ${declared}.`);
  }

  if (!Array.isArray(record.storageAuthorities) || record.storageAuthorities.length !== STORAGE_AUTHORITY_IDS.length) {
    throw new Error('ledger.storageAuthorities must exhaustively cover every declared storage authority.');
  }
  const storageAuthorities = record.storageAuthorities.map((entry, index) =>
    parseStorageAuthority(entry, `ledger.storageAuthorities[${index}]`)
  );
  const storageIds = storageAuthorities.map((storage) => storage.id);
  requireSortedUniqueIds(storageIds, 'ledger.storageAuthorities');
  for (const declared of STORAGE_AUTHORITY_IDS) {
    if (!storageIds.includes(declared)) throw new Error(`ledger.storageAuthorities omits ${declared}.`);
  }

  const ledger: StateAuthorityLedger = {
    contract: STATE_AUTHORITY_LEDGER_CONTRACT,
    schemaVersion: 1,
    adapters,
    storageAuthorities,
  };
  assertLedgerRuntimeLockstep(ledger);
  return ledger;
}

/**
 * Reject any ledger claim that drifts from the live production managers. The
 * ledger and runtime must move together: a backend cannot record a producer,
 * handle source, resumability, or proof in the ledger that its manager does not
 * actually implement.
 */
export function assertLedgerRuntimeLockstep(ledger: StateAuthorityLedger): void {
  for (const adapter of ledger.adapters) {
    const runtime = RUNTIME_ADAPTER_FACTS[adapter.id];
    if (!runtime) throw new Error(`No runtime fact is bound for adapter ${adapter.id}.`);
    if (
      adapter.producer !== runtime.producer ||
      adapter.sessionHandle.source !== runtime.handleSource ||
      adapter.resumability !== runtime.resumability ||
      adapter.proven !== runtime.proven
    ) {
      throw new Error(`ledger adapter ${adapter.id} is out of lockstep with its runtime manager fact.`);
    }
  }
}

const ADAPTER_BY_ID = new Map<AdapterId, StateAuthorityAdapter>();

export function getAdapter(id: AdapterId): StateAuthorityAdapter {
  const adapter = ADAPTER_BY_ID.get(id);
  if (!adapter) throw new Error(`Unknown state-authority adapter: ${id}`);
  return adapter;
}

/**
 * The mechanically-derived set of adapters that may enter M0A / cohort claims.
 * Non-resumable and unproven backends are excluded here, not at the call site,
 * so an ineligible backend can never be talked into the cohort.
 */
export function resolveCohortEligibleAdapters(): readonly AdapterId[] {
  return STATE_AUTHORITY_LEDGER.adapters
    .filter((adapter) => adapter.cohortEligible)
    .map((adapter) => adapter.id)
    .toSorted((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

export function isCohortEligible(id: AdapterId): boolean {
  return getAdapter(id).cohortEligible;
}

/** Throw unless the adapter is mechanically eligible for the cohort. */
export function assertCohortEligible(id: AdapterId): void {
  const adapter = getAdapter(id);
  if (!adapter.cohortEligible) {
    const reason = adapter.deferredBlocker
      ? `deferred to ${adapter.deferredBlocker}`
      : `${adapter.resumability} / ${adapter.failureBehavior}`;
    throw new Error(`Adapter ${id} is excluded from the cohort (${reason}).`);
  }
}

export type BackendCaptureRequest = {
  adapterId: string;
  producer: string;
  handleSource: string;
  captureMethod: string;
  assertedBy: string;
  epoch: { start: string; end: string } | null;
  quiescedAt: string | null;
  lastMutationAt: string | null;
  leaseExpiresAt?: string | null;
  rootComplete: boolean;
  nowMs: number;
};

export type BackendCaptureDisposition =
  | Readonly<{ admitted: true; adapterId: AdapterId }>
  | Readonly<{ admitted: false; adapterId: AdapterId | null; code: string; reason: string; degraded: boolean }>;

function reject(
  adapterId: AdapterId | null,
  code: string,
  reason: string,
  degraded = false
): BackendCaptureDisposition {
  return { admitted: false, adapterId, code, reason, degraded };
}

/**
 * Attack the closed adapter ledger with an untrusted capture claim. Every named
 * hostile vector fails closed; only a fully authenticated request against a
 * cohort-eligible adapter is admitted. A non-resumable adapter is refused as
 * degraded; an unproven, deferred adapter is refused with its blocker.
 */
export function evaluateBackendCaptureRequest(request: BackendCaptureRequest): BackendCaptureDisposition {
  if (!ADAPTER_IDS.includes(request.adapterId as AdapterId)) {
    return reject(null, 'UNKNOWN_PRODUCER', `Unknown adapter: ${String(request.adapterId)}`);
  }
  const adapter = getAdapter(request.adapterId as AdapterId);

  // Identity: producer must be a known producer and the adapter's exact owner.
  if (!PRODUCERS.includes(request.producer as Producer)) {
    return reject(adapter.id, 'UNKNOWN_PRODUCER', `Unknown producer: ${String(request.producer)}`);
  }
  if (request.producer !== adapter.producer) {
    return reject(adapter.id, 'WRONG_OWNER', `Producer ${request.producer} does not own ${adapter.id}.`);
  }
  if (request.handleSource !== adapter.sessionHandle.source) {
    return reject(adapter.id, 'WRONG_HANDLE', `Handle ${request.handleSource} is not ${adapter.id}'s handle.`);
  }

  // A backend session can never be captured by a generic filesystem copy — that
  // would forge resumable state out of on-disk bytes the producer does not bless.
  if (request.captureMethod === 'filesystem-copy') {
    return reject(
      adapter.id,
      'GENERIC_FILESYSTEM_COPY',
      'A generic filesystem copy cannot capture backend session state.'
    );
  }

  // Self-assertion: the receipt must come from the producer, not the adapter
  // vouching for itself.
  if (request.assertedBy === adapter.id || request.assertedBy !== adapter.producer) {
    return reject(
      adapter.id,
      'ADAPTER_SELF_ASSERTION',
      'A validation receipt must be asserted by the producer, not the adapter.'
    );
  }

  // Mutation epoch: present, single, and unexpired.
  if (!request.epoch || !request.epoch.start || !request.epoch.end) {
    return reject(adapter.id, 'ABSENT_EPOCH', 'A bound mutation epoch is required.');
  }
  if (request.epoch.start !== request.epoch.end) {
    return reject(adapter.id, 'MIXED_EPOCH', 'State changed across the capture epoch.');
  }
  if (request.leaseExpiresAt) {
    const expiresMs = Date.parse(request.leaseExpiresAt);
    if (!Number.isFinite(expiresMs) || expiresMs <= request.nowMs) {
      return reject(adapter.id, 'EXPIRED_EPOCH', 'The capture epoch lease is absent or expired.');
    }
  }
  if (request.quiescedAt && request.lastMutationAt) {
    const quiescedMs = Date.parse(request.quiescedAt);
    const mutatedMs = Date.parse(request.lastMutationAt);
    if (Number.isFinite(quiescedMs) && Number.isFinite(mutatedMs) && mutatedMs > quiescedMs) {
      return reject(adapter.id, 'MUTATION_AFTER_QUIESCENCE', 'State mutated after the quiescence point.');
    }
  }

  // Completeness: a partial authority root cannot be admitted.
  if (!request.rootComplete) {
    return reject(adapter.id, 'PARTIAL_ROOT', 'A partial authority root cannot be captured.');
  }

  // Eligibility gate: only a proven, resumable adapter enters the cohort.
  if (adapter.resumability === 'non-resumable') {
    return reject(adapter.id, 'NON_RESUMABLE_EXCLUDED', 'A non-resumable backend is excluded from the cohort.', true);
  }
  if (!adapter.cohortEligible) {
    const blocker = adapter.deferredBlocker ?? 'an unaccepted producer contract';
    return reject(adapter.id, 'DEFERRED_BLOCKER', `Capture is deferred to ${blocker}.`);
  }
  return { admitted: true, adapterId: adapter.id };
}

// ── Fail-closed compiled seal ────────────────────────────────────────────────

const compiledLedgerDigest = stateAuthorityLedgerDigest(ledgerJson);
if (compiledLedgerDigest !== STATE_AUTHORITY_LEDGER_DIGEST) {
  throw new Error('State-authority ledger does not match its compiled content digest.');
}

/** The sealed, validated backend state-authority adapter ledger. */
export const STATE_AUTHORITY_LEDGER: StateAuthorityLedger = parseStateAuthorityLedger(ledgerJson);

for (const adapter of STATE_AUTHORITY_LEDGER.adapters) ADAPTER_BY_ID.set(adapter.id, adapter);
