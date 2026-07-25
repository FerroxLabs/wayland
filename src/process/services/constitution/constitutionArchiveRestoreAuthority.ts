import { randomUUID, createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {
  canonicalizeRestrictedJson,
  compareUnicodeCodeUnits,
  isPlainObject,
  requireWellFormedUnicode,
} from '../../utils/restrictedCanonicalJson';
import type { ConstitutionArchiveSecretBackend, ConstitutionFsTarget } from './constitutionFsTransaction';
import { createConstitutionRequestFingerprint } from './constitutionRequestFingerprint';
import { syncDirectorySync } from '@process/utils/durabilitySync';

export const CONSTITUTION_ARCHIVE_RESTORE_OPERATION_CONTRACT =
  'wayland-constitution-archive-restore-operation/1.0' as const;
export const CONSTITUTION_ARCHIVE_RESTORE_TOMBSTONE_CONTRACT =
  'wayland-constitution-archive-restore-operation-tombstone/1.0' as const;

const AUTHORITY_CONTRACT = 'wayland-constitution-archive-restore-operation-authority/1.0' as const;
const PROCESS_FINGERPRINT_CONTRACT = 'wayland-constitution-archive-restore-process-fingerprint/1.0' as const;
const PRINCIPAL_BINDING_CONTRACT = 'wayland-constitution-principal-binding/1.0' as const;
const HOSTED_SUBJECT_CONTRACT = 'wayland-hosted-principal-subject/1.0' as const;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
const RFC3339_MILLIS_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_REVISION_SCALARS = 4096;
const MAX_SUBJECT_SCALARS = 1024;
const MAX_OPERATIONS = 65_536;
const MAX_AUTHORITY_BYTES = 128 * 1024 * 1024;
const PREPARED_EXPIRY_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

export type ConstitutionRestorePrincipalBinding =
  | Readonly<{ kind: 'hosted-user'; subjectSha256: `sha256:${string}` }>
  | Readonly<{ kind: 'desktop-installation'; installationId: string }>;

export type ConstitutionArchiveRestoreOperationState =
  | 'prepared'
  | 'dispatched'
  | 'committed'
  | 'rolled-back'
  | 'abandoned';

export type ConstitutionArchiveRestoreOperationRecord = Readonly<{
  contract: typeof CONSTITUTION_ARCHIVE_RESTORE_OPERATION_CONTRACT;
  operationId: string;
  principalBinding: ConstitutionRestorePrincipalBinding;
  archiveId: string;
  expectedArchiveRevision: string;
  expectedRevision: string;
  target: ConstitutionFsTarget;
  contentSha256: `sha256:${string}`;
  processRequestFingerprint: `sha256:${string}`;
  nativeRequestFingerprint: `sha256:${string}`;
  nativeRequestId: string;
  createdAt: string;
  state: ConstitutionArchiveRestoreOperationState;
}>;

export type ConstitutionArchiveRestoreOperationTombstone = Readonly<{
  contract: typeof CONSTITUTION_ARCHIVE_RESTORE_TOMBSTONE_CONTRACT;
  operationId: string;
  principalBindingSha256: `sha256:${string}`;
  processRequestFingerprint: `sha256:${string}`;
  createdAt: string;
  terminalizedAt: string;
  outcome: 'abandoned';
}>;

export type ConstitutionArchiveRestoreOperationFacts = Readonly<{
  operationId: string;
  principalBinding: ConstitutionRestorePrincipalBinding;
  archiveId: string;
  expectedArchiveRevision: string;
  expectedRevision: string;
  target: ConstitutionFsTarget;
  contentSha256: `sha256:${string}`;
}>;

export type ConstitutionArchiveRestoreAbandonmentReason =
  | Readonly<{ kind: 'explicit-cancellation' }>
  | Readonly<{ kind: 'expired-prepared' }>;

export type ConstitutionArchiveRestoreNativeLookupIdentity = Readonly<{
  requestId: string;
  requestFingerprint: `sha256:${string}`;
}>;

export type ConstitutionArchiveRestoreNativeLookupResult =
  | Readonly<{ outcome: 'not_found' | 'rolled_back' }>
  | Readonly<{ outcome: 'committed'; result: unknown }>;

type AuthorityState = {
  contract: typeof AUTHORITY_CONTRACT;
  desktopInstallationId: string | null;
  records: ConstitutionArchiveRestoreOperationRecord[];
  tombstones: ConstitutionArchiveRestoreOperationTombstone[];
};

type AuthorityDependencies = Readonly<{
  now?: () => Date;
  isProcessAlive?: (pid: number) => boolean;
  afterNativeInvocation?: () => void;
}>;

export class ConstitutionArchiveRestoreAuthorityError extends Error {
  constructor(
    readonly code:
      | 'INVALID_REQUEST'
      | 'OPERATION_NOT_FOUND'
      | 'OPERATION_ABANDONED'
      | 'OPERATION_AUTHORITY_FULL'
      | 'CONFLICT'
      | 'INTEGRITY_FAILURE'
      | 'AUTHORITY_BUSY',
    message: string
  ) {
    super(message);
    this.name = 'ConstitutionArchiveRestoreAuthorityError';
  }
}

function exactDataObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!isPlainObject(value) || Object.getOwnPropertySymbols(value).length !== 0) return false;
  const actual = Object.getOwnPropertyNames(value).toSorted(compareUnicodeCodeUnits);
  const expected = [...keys].toSorted(compareUnicodeCodeUnits);
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) return false;
  return actual.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor?.enumerable === true && 'value' in descriptor;
  });
}

function assertBoundedNfc(value: unknown, label: string, maxScalars: number): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', `${label} must be non-empty.`);
  }
  try {
    requireWellFormedUnicode(value, label);
  } catch {
    throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', `${label} is not well-formed Unicode.`);
  }
  if (value !== value.normalize('NFC') || Array.from(value).length > maxScalars || /\p{Cc}/u.test(value)) {
    throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', `${label} is not canonical.`);
  }
}

function sha256Canonical(value: unknown): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(canonicalizeRestrictedJson(value)).digest('hex')}`;
}

function assertPrincipalBinding(value: unknown): asserts value is ConstitutionRestorePrincipalBinding {
  if (!isPlainObject(value)) {
    throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', 'Principal binding is malformed.');
  }
  if (value.kind === 'hosted-user') {
    if (!exactDataObject(value, ['kind', 'subjectSha256']) || !SHA256_PATTERN.test(String(value.subjectSha256))) {
      throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', 'Hosted principal binding is malformed.');
    }
    return;
  }
  if (
    value.kind !== 'desktop-installation' ||
    !exactDataObject(value, ['kind', 'installationId']) ||
    !UUID_V4_PATTERN.test(String(value.installationId))
  ) {
    throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', 'Desktop principal binding is malformed.');
  }
}

export function createHostedRestorePrincipalBinding(
  deploymentNamespace: string,
  subject: string
): ConstitutionRestorePrincipalBinding {
  assertBoundedNfc(deploymentNamespace, 'Deployment namespace', MAX_SUBJECT_SCALARS);
  assertBoundedNfc(subject, 'Authenticated subject', MAX_SUBJECT_SCALARS);
  return {
    kind: 'hosted-user',
    subjectSha256: sha256Canonical({ contract: HOSTED_SUBJECT_CONTRACT, deploymentNamespace, subject }),
  };
}

export function constitutionRestorePrincipalBindingSha256(
  principalBinding: ConstitutionRestorePrincipalBinding
): `sha256:${string}` {
  assertPrincipalBinding(principalBinding);
  return sha256Canonical({ contract: PRINCIPAL_BINDING_CONTRACT, principalBinding });
}

export function createConstitutionArchiveRestoreProcessFingerprint(
  facts: Omit<ConstitutionArchiveRestoreOperationFacts, 'operationId'>
): `sha256:${string}` {
  assertRestoreFacts({ ...facts, operationId: '00000000-0000-4000-8000-000000000000' });
  return sha256Canonical({
    contract: PROCESS_FINGERPRINT_CONTRACT,
    principalBindingSha256: constitutionRestorePrincipalBindingSha256(facts.principalBinding),
    archiveId: facts.archiveId,
    expectedArchiveRevision: facts.expectedArchiveRevision,
    expectedRevision: facts.expectedRevision,
    target: facts.target,
    contentSha256: facts.contentSha256,
  });
}

function assertRestoreFacts(facts: ConstitutionArchiveRestoreOperationFacts): void {
  if (!UUID_V4_PATTERN.test(facts.operationId) || !UUID_V4_PATTERN.test(facts.archiveId)) {
    throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', 'Restore operation identity is malformed.');
  }
  assertPrincipalBinding(facts.principalBinding);
  assertBoundedNfc(facts.expectedArchiveRevision, 'Expected archive revision', MAX_REVISION_SCALARS);
  assertBoundedNfc(facts.expectedRevision, 'Expected target revision', MAX_REVISION_SCALARS);
  if (!SHA256_PATTERN.test(facts.contentSha256)) {
    throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', 'Restore content digest is malformed.');
  }
  // Reuse the Stage A canonical target validator without inventing a second
  // target grammar.
  createConstitutionRequestFingerprint({
    intent: 'restore',
    target: facts.target,
    contentSha256: facts.contentSha256,
    expectedRevision: facts.expectedRevision,
    archiveIdentity: facts.archiveId,
  });
}

function createRecord(
  facts: ConstitutionArchiveRestoreOperationFacts,
  createdAt: string
): ConstitutionArchiveRestoreOperationRecord {
  assertRestoreFacts(facts);
  const processRequestFingerprint = createConstitutionArchiveRestoreProcessFingerprint(facts);
  const nativeRequestFingerprint = createConstitutionRequestFingerprint({
    intent: 'restore',
    target: facts.target,
    contentSha256: facts.contentSha256,
    expectedRevision: facts.expectedRevision,
    archiveIdentity: facts.archiveId,
  });
  return {
    contract: CONSTITUTION_ARCHIVE_RESTORE_OPERATION_CONTRACT,
    operationId: facts.operationId,
    principalBinding: facts.principalBinding,
    archiveId: facts.archiveId,
    expectedArchiveRevision: facts.expectedArchiveRevision,
    expectedRevision: facts.expectedRevision,
    target: facts.target,
    contentSha256: facts.contentSha256,
    processRequestFingerprint,
    nativeRequestFingerprint,
    nativeRequestId: facts.operationId,
    createdAt,
    state: 'prepared',
  };
}

function samePrincipal(left: ConstitutionRestorePrincipalBinding, right: ConstitutionRestorePrincipalBinding): boolean {
  return constitutionRestorePrincipalBindingSha256(left) === constitutionRestorePrincipalBindingSha256(right);
}

function validateRecord(value: unknown): ConstitutionArchiveRestoreOperationRecord {
  if (
    !exactDataObject(value, [
      'contract',
      'operationId',
      'principalBinding',
      'archiveId',
      'expectedArchiveRevision',
      'expectedRevision',
      'target',
      'contentSha256',
      'processRequestFingerprint',
      'nativeRequestFingerprint',
      'nativeRequestId',
      'createdAt',
      'state',
    ]) ||
    value.contract !== CONSTITUTION_ARCHIVE_RESTORE_OPERATION_CONTRACT ||
    typeof value.createdAt !== 'string' ||
    !RFC3339_MILLIS_PATTERN.test(value.createdAt) ||
    !['prepared', 'dispatched', 'committed', 'rolled-back', 'abandoned'].includes(String(value.state))
  ) {
    throw new ConstitutionArchiveRestoreAuthorityError('INTEGRITY_FAILURE', 'Restore operation record is malformed.');
  }
  const record = value as ConstitutionArchiveRestoreOperationRecord;
  assertRestoreFacts(record);
  const expected = createRecord(record, record.createdAt);
  if (
    record.nativeRequestId !== record.operationId ||
    record.processRequestFingerprint !== expected.processRequestFingerprint ||
    record.nativeRequestFingerprint !== expected.nativeRequestFingerprint
  ) {
    throw new ConstitutionArchiveRestoreAuthorityError('INTEGRITY_FAILURE', 'Restore operation binding is invalid.');
  }
  return record;
}

function validateTombstone(value: unknown): ConstitutionArchiveRestoreOperationTombstone {
  if (
    !exactDataObject(value, [
      'contract',
      'operationId',
      'principalBindingSha256',
      'processRequestFingerprint',
      'createdAt',
      'terminalizedAt',
      'outcome',
    ]) ||
    value.contract !== CONSTITUTION_ARCHIVE_RESTORE_TOMBSTONE_CONTRACT ||
    !UUID_V4_PATTERN.test(String(value.operationId)) ||
    !SHA256_PATTERN.test(String(value.principalBindingSha256)) ||
    !SHA256_PATTERN.test(String(value.processRequestFingerprint)) ||
    typeof value.createdAt !== 'string' ||
    !RFC3339_MILLIS_PATTERN.test(value.createdAt) ||
    typeof value.terminalizedAt !== 'string' ||
    !RFC3339_MILLIS_PATTERN.test(value.terminalizedAt) ||
    value.outcome !== 'abandoned'
  ) {
    throw new ConstitutionArchiveRestoreAuthorityError('INTEGRITY_FAILURE', 'Restore tombstone is malformed.');
  }
  if (Date.parse(String(value.terminalizedAt)) < Date.parse(String(value.createdAt))) {
    throw new ConstitutionArchiveRestoreAuthorityError('INTEGRITY_FAILURE', 'Restore tombstone chronology is invalid.');
  }
  return value as ConstitutionArchiveRestoreOperationTombstone;
}

function assertAbandonmentReason(value: unknown): asserts value is ConstitutionArchiveRestoreAbandonmentReason {
  if (
    !exactDataObject(value, ['kind']) ||
    (value.kind !== 'explicit-cancellation' && value.kind !== 'expired-prepared')
  ) {
    throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', 'Abandonment reason is malformed.');
  }
}

function emptyState(): AuthorityState {
  return { contract: AUTHORITY_CONTRACT, desktopInstallationId: null, records: [], tombstones: [] };
}

function validateState(value: unknown): AuthorityState {
  if (
    !exactDataObject(value, ['contract', 'desktopInstallationId', 'records', 'tombstones']) ||
    value.contract !== AUTHORITY_CONTRACT ||
    (value.desktopInstallationId !== null && !UUID_V4_PATTERN.test(String(value.desktopInstallationId))) ||
    !Array.isArray(value.records) ||
    !Array.isArray(value.tombstones) ||
    value.records.length + value.tombstones.length > MAX_OPERATIONS
  ) {
    throw new ConstitutionArchiveRestoreAuthorityError('INTEGRITY_FAILURE', 'Restore authority state is malformed.');
  }
  const records = value.records.map(validateRecord);
  const tombstones = value.tombstones.map(validateTombstone);
  const ids = [...records.map((record) => record.operationId), ...tombstones.map((entry) => entry.operationId)];
  if (new Set(ids).size !== ids.length) {
    throw new ConstitutionArchiveRestoreAuthorityError(
      'INTEGRITY_FAILURE',
      'Restore authority contains duplicate IDs.'
    );
  }
  return {
    contract: AUTHORITY_CONTRACT,
    desktopInstallationId: value.desktopInstallationId as string | null,
    records,
    tombstones,
  };
}

/**
 * Commit the directory entry created by the rename. A no-op on Windows, which
 * cannot fsync a directory handle at all; the temp file was already flushed
 * before the rename, and NTFS journals the rename itself.
 */
function fsyncDirectory(directory: string): void {
  syncDirectorySync(directory);
}

export class ConstitutionArchiveRestoreOperationAuthority {
  private readonly now: () => Date;
  private readonly isProcessAlive: (pid: number) => boolean;
  private readonly afterNativeInvocation: () => void;

  constructor(
    private readonly authorityPath: string,
    private readonly backend: ConstitutionArchiveSecretBackend,
    dependencies: AuthorityDependencies = {}
  ) {
    this.now = dependencies.now ?? (() => new Date());
    this.afterNativeInvocation = dependencies.afterNativeInvocation ?? (() => {});
    this.isProcessAlive =
      dependencies.isProcessAlive ??
      ((pid) => {
        try {
          process.kill(pid, 0);
          return true;
        } catch {
          return false;
        }
      });
  }

  private timestamp(): string {
    const value = this.now().toISOString();
    if (!RFC3339_MILLIS_PATTERN.test(value)) {
      throw new ConstitutionArchiveRestoreAuthorityError('INTEGRITY_FAILURE', 'Authority clock is invalid.');
    }
    return value;
  }

  private readState(): AuthorityState {
    if (!existsSync(this.authorityPath)) return emptyState();
    const stat = lstatSync(this.authorityPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > MAX_AUTHORITY_BYTES) {
      throw new ConstitutionArchiveRestoreAuthorityError('INTEGRITY_FAILURE', 'Restore authority file is unsafe.');
    }
    try {
      const plaintext = this.backend.decryptString(readFileSync(this.authorityPath, 'utf8'));
      if (Buffer.byteLength(plaintext, 'utf8') > MAX_AUTHORITY_BYTES) throw new Error('oversized');
      return validateState(JSON.parse(plaintext) as unknown);
    } catch (error) {
      if (error instanceof ConstitutionArchiveRestoreAuthorityError) throw error;
      throw new ConstitutionArchiveRestoreAuthorityError(
        'INTEGRITY_FAILURE',
        'Restore authority cannot be authenticated.'
      );
    }
  }

  private writeState(state: AuthorityState): void {
    validateState(state);
    const directory = path.dirname(this.authorityPath);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const temporary = `${this.authorityPath}.${randomUUID()}.tmp`;
    const encrypted = this.backend.encryptString(JSON.stringify(state));
    const fd = openSync(temporary, 'wx', 0o600);
    try {
      writeFileSync(fd, encrypted, 'utf8');
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    try {
      renameSync(temporary, this.authorityPath);
      fsyncDirectory(directory);
    } catch (error) {
      try {
        unlinkSync(temporary);
      } catch {
        // Preserve the publication failure.
      }
      throw error;
    }
  }

  private withLock<T>(operation: (state: AuthorityState) => T): T {
    const directory = path.dirname(this.authorityPath);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const lockPath = `${this.authorityPath}.lock`;
    const acquire = (): number => {
      try {
        return openSync(lockPath, 'wx', 0o600);
      } catch {
        let lock: unknown;
        try {
          lock = JSON.parse(readFileSync(lockPath, 'utf8')) as unknown;
        } catch {
          throw new ConstitutionArchiveRestoreAuthorityError('AUTHORITY_BUSY', 'Restore authority is locked.');
        }
        if (!exactDataObject(lock, ['pid', 'nonce']) || !Number.isSafeInteger(lock.pid) || Number(lock.pid) <= 0) {
          throw new ConstitutionArchiveRestoreAuthorityError('AUTHORITY_BUSY', 'Restore authority lock is malformed.');
        }
        if (this.isProcessAlive(Number(lock.pid))) {
          throw new ConstitutionArchiveRestoreAuthorityError('AUTHORITY_BUSY', 'Restore authority is locked.');
        }
        unlinkSync(lockPath);
        fsyncDirectory(directory);
        return openSync(lockPath, 'wx', 0o600);
      }
    };
    const fd = acquire();
    try {
      writeFileSync(fd, JSON.stringify({ pid: process.pid, nonce: randomUUID() }), 'utf8');
      fsyncSync(fd);
      fsyncDirectory(directory);
      return operation(this.readState());
    } finally {
      closeSync(fd);
      unlinkSync(lockPath);
      fsyncDirectory(directory);
    }
  }

  desktopPrincipalBinding(): Extract<ConstitutionRestorePrincipalBinding, { kind: 'desktop-installation' }> {
    return this.withLock((state) => {
      if (!state.desktopInstallationId) {
        state.desktopInstallationId = randomUUID();
        this.writeState(state);
      }
      return { kind: 'desktop-installation', installationId: state.desktopInstallationId };
    });
  }

  lookup(
    operationId: string,
    principalBinding: ConstitutionRestorePrincipalBinding
  ): ConstitutionArchiveRestoreOperationRecord | null {
    if (!UUID_V4_PATTERN.test(operationId)) {
      throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', 'Restore operation ID is malformed.');
    }
    assertPrincipalBinding(principalBinding);
    return this.withLock((state) => {
      const record = state.records.find((entry) => entry.operationId === operationId);
      if (record) {
        if (!samePrincipal(record.principalBinding, principalBinding)) {
          throw new ConstitutionArchiveRestoreAuthorityError('OPERATION_NOT_FOUND', 'Restore operation was not found.');
        }
        return record;
      }
      const tombstone = state.tombstones.find((entry) => entry.operationId === operationId);
      if (!tombstone) return null;
      if (tombstone.principalBindingSha256 !== constitutionRestorePrincipalBindingSha256(principalBinding)) {
        throw new ConstitutionArchiveRestoreAuthorityError('OPERATION_NOT_FOUND', 'Restore operation was not found.');
      }
      throw new ConstitutionArchiveRestoreAuthorityError('OPERATION_ABANDONED', 'Restore operation was abandoned.');
    });
  }

  reserve(facts: ConstitutionArchiveRestoreOperationFacts): ConstitutionArchiveRestoreOperationRecord {
    const candidate = createRecord(facts, this.timestamp());
    return this.withLock((state) => {
      const existing = state.records.find((entry) => entry.operationId === facts.operationId);
      if (existing) {
        if (!samePrincipal(existing.principalBinding, facts.principalBinding)) {
          throw new ConstitutionArchiveRestoreAuthorityError('OPERATION_NOT_FOUND', 'Restore operation was not found.');
        }
        if (existing.processRequestFingerprint !== candidate.processRequestFingerprint) {
          throw new ConstitutionArchiveRestoreAuthorityError(
            'CONFLICT',
            'Restore operation is bound to different facts.'
          );
        }
        return existing;
      }
      const tombstone = state.tombstones.find((entry) => entry.operationId === facts.operationId);
      if (tombstone) {
        if (tombstone.principalBindingSha256 !== constitutionRestorePrincipalBindingSha256(facts.principalBinding)) {
          throw new ConstitutionArchiveRestoreAuthorityError('OPERATION_NOT_FOUND', 'Restore operation was not found.');
        }
        throw new ConstitutionArchiveRestoreAuthorityError('OPERATION_ABANDONED', 'Restore operation was abandoned.');
      }
      if (state.records.length + state.tombstones.length >= MAX_OPERATIONS) {
        throw new ConstitutionArchiveRestoreAuthorityError(
          'OPERATION_AUTHORITY_FULL',
          'Restore operation authority is full.'
        );
      }
      state.records.push(candidate);
      this.writeState(state);
      return candidate;
    });
  }

  dispatch<T>(
    operationId: string,
    principalBinding: ConstitutionRestorePrincipalBinding,
    invokeNative: (record: ConstitutionArchiveRestoreOperationRecord) => {
      outcome: 'committed' | 'rolled-back';
      value: T;
    }
  ): T {
    return this.withLock((state) => {
      const index = state.records.findIndex((entry) => entry.operationId === operationId);
      if (index < 0 || !samePrincipal(state.records[index]!.principalBinding, principalBinding)) {
        throw new ConstitutionArchiveRestoreAuthorityError('OPERATION_NOT_FOUND', 'Restore operation was not found.');
      }
      const current = state.records[index]!;
      if (current.state === 'committed' || current.state === 'rolled-back' || current.state === 'abandoned') {
        throw new ConstitutionArchiveRestoreAuthorityError('CONFLICT', 'Restore operation is already terminal.');
      }
      if (current.state === 'prepared') {
        state.records[index] = { ...current, state: 'dispatched' };
        this.writeState(state);
      }
      // The cross-process writer claim remains held from durable dispatch marker
      // through the Native invocation. No cancellation or compaction can claim
      // that this operation was never dispatched in the intervening window.
      const marked = state.records[index]!;
      const result = invokeNative(marked);
      this.afterNativeInvocation();
      state.records[index] = { ...marked, state: result.outcome };
      this.writeState(state);
      return result.value;
    });
  }

  reconcileNativeOutcome(
    operationId: string,
    principalBinding: ConstitutionRestorePrincipalBinding,
    outcome: 'committed' | 'rolled-back'
  ): ConstitutionArchiveRestoreOperationRecord {
    return this.withLock((state) => {
      const index = state.records.findIndex((entry) => entry.operationId === operationId);
      if (index < 0 || !samePrincipal(state.records[index]!.principalBinding, principalBinding)) {
        throw new ConstitutionArchiveRestoreAuthorityError('OPERATION_NOT_FOUND', 'Restore operation was not found.');
      }
      const record = state.records[index]!;
      if (record.state === 'prepared') {
        throw new ConstitutionArchiveRestoreAuthorityError(
          'INTEGRITY_FAILURE',
          'Native reported a terminal restore that process authority never dispatched.'
        );
      }
      if (record.state === 'abandoned' || (record.state !== 'dispatched' && record.state !== outcome)) {
        throw new ConstitutionArchiveRestoreAuthorityError(
          'INTEGRITY_FAILURE',
          'Native restore outcome conflicts with process authority.'
        );
      }
      if (record.state === outcome) return record;
      const terminal = { ...record, state: outcome } as ConstitutionArchiveRestoreOperationRecord;
      state.records[index] = terminal;
      this.writeState(state);
      return terminal;
    });
  }

  abandonPrepared(
    operationId: string,
    principalBinding: ConstitutionRestorePrincipalBinding,
    reason: ConstitutionArchiveRestoreAbandonmentReason,
    lookupNative: (
      identity: ConstitutionArchiveRestoreNativeLookupIdentity
    ) => ConstitutionArchiveRestoreNativeLookupResult
  ): ConstitutionArchiveRestoreOperationTombstone {
    if (!UUID_V4_PATTERN.test(operationId)) {
      throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', 'Restore operation ID is malformed.');
    }
    assertPrincipalBinding(principalBinding);
    assertAbandonmentReason(reason);
    if (typeof lookupNative !== 'function') {
      throw new ConstitutionArchiveRestoreAuthorityError('INVALID_REQUEST', 'Native restore lookup is required.');
    }
    return this.withLock((state) => {
      const index = state.records.findIndex((entry) => entry.operationId === operationId);
      if (index < 0 || !samePrincipal(state.records[index]!.principalBinding, principalBinding)) {
        throw new ConstitutionArchiveRestoreAuthorityError('OPERATION_NOT_FOUND', 'Restore operation was not found.');
      }
      const record = state.records[index]!;
      if (record.state !== 'prepared') {
        throw new ConstitutionArchiveRestoreAuthorityError(
          'CONFLICT',
          'Only a never-dispatched operation can be abandoned.'
        );
      }

      const terminalizedAt = this.timestamp();
      const elapsedMilliseconds = Date.parse(terminalizedAt) - Date.parse(record.createdAt);
      if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0) {
        throw new ConstitutionArchiveRestoreAuthorityError(
          'INTEGRITY_FAILURE',
          'Restore authority clock precedes operation creation.'
        );
      }
      if (reason.kind === 'expired-prepared' && elapsedMilliseconds < PREPARED_EXPIRY_MILLISECONDS) {
        throw new ConstitutionArchiveRestoreAuthorityError(
          'CONFLICT',
          'Prepared restore has not reached the abandonment expiry.'
        );
      }

      // Native lookup is deliberately performed while this authority's writer
      // lock is held. Dispatch uses the same lock and must publish `dispatched`
      // before invocation, so a prepared head plus exact Native `not_found`
      // proves this operation was never queued or invoked. A caller-provided
      // observation made before acquiring the lock would be stale evidence.
      const nativeResult: unknown = lookupNative({
        requestId: record.nativeRequestId,
        requestFingerprint: record.nativeRequestFingerprint,
      });
      if (!exactDataObject(nativeResult, ['outcome'])) {
        if (exactDataObject(nativeResult, ['outcome', 'result']) && nativeResult.outcome === 'committed') {
          throw new ConstitutionArchiveRestoreAuthorityError(
            'INTEGRITY_FAILURE',
            'Native committed a restore whose process authority is still prepared.'
          );
        }
        throw new ConstitutionArchiveRestoreAuthorityError(
          'INTEGRITY_FAILURE',
          'Native restore lookup result is malformed.'
        );
      }
      if (nativeResult.outcome !== 'not_found') {
        throw new ConstitutionArchiveRestoreAuthorityError(
          'INTEGRITY_FAILURE',
          'Native restore outcome conflicts with prepared abandonment.'
        );
      }

      const tombstone: ConstitutionArchiveRestoreOperationTombstone = {
        contract: CONSTITUTION_ARCHIVE_RESTORE_TOMBSTONE_CONTRACT,
        operationId,
        principalBindingSha256: constitutionRestorePrincipalBindingSha256(principalBinding),
        processRequestFingerprint: record.processRequestFingerprint,
        createdAt: record.createdAt,
        terminalizedAt,
        outcome: 'abandoned',
      };
      state.records.splice(index, 1);
      state.tombstones.push(tombstone);
      this.writeState(state);
      return tombstone;
    });
  }
}
