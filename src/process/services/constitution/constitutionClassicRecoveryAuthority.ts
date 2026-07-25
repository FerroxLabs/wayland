/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
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
  parseConstitutionClassicRecoveryMutationResult,
  type ConstitutionClassicRecoveryMutationSuccess,
} from '../../../common/types/constitutionRecovery';
import {
  canonicalizeRestrictedJson,
  compareUnicodeCodeUnits,
  isPlainObject,
  requireWellFormedUnicode,
} from '../../utils/restrictedCanonicalJson';
import type { ConstitutionArchiveSecretBackend } from './constitutionFsTransaction';
import {
  constitutionRestorePrincipalBindingSha256,
  type ConstitutionRestorePrincipalBinding,
} from './constitutionArchiveRestoreAuthority';
import { syncDirectorySync } from '@process/utils/durabilitySync';

export const CONSTITUTION_CLASSIC_RECOVERY_OPERATION_CONTRACT =
  'wayland-constitution-classic-recovery-operation/1.0' as const;
const AUTHORITY_CONTRACT = 'wayland-constitution-classic-recovery-operation-authority/1.0' as const;
const FINGERPRINT_CONTRACT = 'wayland-constitution-classic-recovery-operation-fingerprint/1.0' as const;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
const RFC3339_MILLIS_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_REVISION_SCALARS = 4096;
const MAX_OBJECT_ID_SCALARS = 1024;
const MAX_ITEMS = 4096;
const MAX_OPERATIONS = 65_536;
const MAX_AUTHORITY_BYTES = 256 * 1024 * 1024;

export type ConstitutionClassicRecoveryOperationFacts = Readonly<{
  operationId: string;
  principalBinding: ConstitutionRestorePrincipalBinding;
  kind: 'decision' | 'resume';
  decision: 'promote' | 'keep-v2' | 'discard' | 'resume';
  projectionReceiptSha256: `sha256:${string}`;
  expectedRecoveryRevision: string;
  confirmedObjectIds: readonly string[];
  promotionId: string;
  expectedJournalHeadSha256: `sha256:${string}` | null;
}>;

export type ConstitutionClassicRecoveryOperationRecord = Readonly<{
  contract: typeof CONSTITUTION_CLASSIC_RECOVERY_OPERATION_CONTRACT;
  operationId: string;
  principalBinding: ConstitutionRestorePrincipalBinding;
  kind: ConstitutionClassicRecoveryOperationFacts['kind'];
  decision: ConstitutionClassicRecoveryOperationFacts['decision'];
  projectionReceiptSha256: `sha256:${string}`;
  expectedRecoveryRevision: string;
  confirmedObjectIds: readonly string[];
  promotionId: string;
  expectedJournalHeadSha256: `sha256:${string}` | null;
  processRequestFingerprint: `sha256:${string}`;
  createdAt: string;
  state: 'prepared' | 'dispatched' | 'committed' | 'rolled-back';
  result: ConstitutionClassicRecoveryMutationSuccess | null;
}>;

type AuthorityState = Readonly<{
  contract: typeof AUTHORITY_CONTRACT;
  records: readonly ConstitutionClassicRecoveryOperationRecord[];
}>;

type AuthorityDependencies = Readonly<{
  now?: () => Date;
  isProcessAlive?: (pid: number) => boolean;
  afterOperationInvocation?: () => void;
}>;

export class ConstitutionClassicRecoveryAuthorityError extends Error {
  constructor(
    readonly code:
      | 'INVALID_REQUEST'
      | 'OPERATION_NOT_FOUND'
      | 'OPERATION_ID_CONFLICT'
      | 'OPERATION_AUTHORITY_FULL'
      | 'ROLLED_BACK'
      | 'INTEGRITY_FAILURE'
      | 'AUTHORITY_BUSY',
    message: string
  ) {
    super(message);
    this.name = 'ConstitutionClassicRecoveryAuthorityError';
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
    throw new ConstitutionClassicRecoveryAuthorityError('INVALID_REQUEST', `${label} must be non-empty.`);
  }
  try {
    requireWellFormedUnicode(value, label);
  } catch {
    throw new ConstitutionClassicRecoveryAuthorityError('INVALID_REQUEST', `${label} is not well-formed Unicode.`);
  }
  if (value !== value.normalize('NFC') || Array.from(value).length > maxScalars || /\p{Cc}/u.test(value)) {
    throw new ConstitutionClassicRecoveryAuthorityError('INVALID_REQUEST', `${label} is not canonical.`);
  }
}

function sha256Canonical(value: unknown): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(canonicalizeRestrictedJson(value)).digest('hex')}`;
}

function samePrincipal(left: ConstitutionRestorePrincipalBinding, right: ConstitutionRestorePrincipalBinding): boolean {
  return constitutionRestorePrincipalBindingSha256(left) === constitutionRestorePrincipalBindingSha256(right);
}

function validateFacts(facts: ConstitutionClassicRecoveryOperationFacts): void {
  if (!UUID_V4_PATTERN.test(facts.operationId) || !UUID_V4_PATTERN.test(facts.promotionId)) {
    throw new ConstitutionClassicRecoveryAuthorityError('INVALID_REQUEST', 'Classic recovery identity is malformed.');
  }
  constitutionRestorePrincipalBindingSha256(facts.principalBinding);
  if (!SHA256_PATTERN.test(facts.projectionReceiptSha256)) {
    throw new ConstitutionClassicRecoveryAuthorityError(
      'INVALID_REQUEST',
      'Classic projection receipt digest is malformed.'
    );
  }
  assertBoundedNfc(facts.expectedRecoveryRevision, 'Expected recovery revision', MAX_REVISION_SCALARS);
  if (
    (facts.kind === 'resume') !== (facts.decision === 'resume') ||
    (facts.kind === 'resume') !== (facts.expectedJournalHeadSha256 !== null) ||
    (facts.expectedJournalHeadSha256 !== null && !SHA256_PATTERN.test(facts.expectedJournalHeadSha256))
  ) {
    throw new ConstitutionClassicRecoveryAuthorityError(
      'INVALID_REQUEST',
      'Classic recovery operation facts conflict.'
    );
  }
  if ((facts.decision === 'discard') !== facts.confirmedObjectIds.length > 0) {
    throw new ConstitutionClassicRecoveryAuthorityError('INVALID_REQUEST', 'Classic discard evidence is malformed.');
  }
  if (facts.confirmedObjectIds.length > MAX_ITEMS) {
    throw new ConstitutionClassicRecoveryAuthorityError(
      'INVALID_REQUEST',
      'Classic recovery object list is too large.'
    );
  }
  for (let index = 0; index < facts.confirmedObjectIds.length; index += 1) {
    const objectId = facts.confirmedObjectIds[index]!;
    assertBoundedNfc(objectId, 'Classic recovery object ID', MAX_OBJECT_ID_SCALARS);
    if (index > 0 && facts.confirmedObjectIds[index - 1]! >= objectId) {
      throw new ConstitutionClassicRecoveryAuthorityError(
        'INVALID_REQUEST',
        'Classic recovery object IDs are not canonical.'
      );
    }
  }
}

export function createConstitutionClassicRecoveryProcessFingerprint(
  facts: Omit<ConstitutionClassicRecoveryOperationFacts, 'operationId'>
): `sha256:${string}` {
  validateFacts({ ...facts, operationId: '00000000-0000-4000-8000-000000000000' });
  return sha256Canonical({
    contract: FINGERPRINT_CONTRACT,
    principalBindingSha256: constitutionRestorePrincipalBindingSha256(facts.principalBinding),
    kind: facts.kind,
    decision: facts.decision,
    projectionReceiptSha256: facts.projectionReceiptSha256,
    expectedRecoveryRevision: facts.expectedRecoveryRevision,
    confirmedObjectIds: facts.confirmedObjectIds,
    promotionId: facts.promotionId,
    expectedJournalHeadSha256: facts.expectedJournalHeadSha256,
  });
}

function createRecord(
  facts: ConstitutionClassicRecoveryOperationFacts,
  createdAt: string
): ConstitutionClassicRecoveryOperationRecord {
  validateFacts(facts);
  return {
    contract: CONSTITUTION_CLASSIC_RECOVERY_OPERATION_CONTRACT,
    ...facts,
    processRequestFingerprint: createConstitutionClassicRecoveryProcessFingerprint(facts),
    createdAt,
    state: 'prepared',
    result: null,
  };
}

function validateRecord(value: unknown): ConstitutionClassicRecoveryOperationRecord {
  if (
    !exactDataObject(value, [
      'contract',
      'operationId',
      'principalBinding',
      'kind',
      'decision',
      'projectionReceiptSha256',
      'expectedRecoveryRevision',
      'confirmedObjectIds',
      'promotionId',
      'expectedJournalHeadSha256',
      'processRequestFingerprint',
      'createdAt',
      'state',
      'result',
    ]) ||
    value.contract !== CONSTITUTION_CLASSIC_RECOVERY_OPERATION_CONTRACT ||
    !Array.isArray(value.confirmedObjectIds) ||
    typeof value.createdAt !== 'string' ||
    !RFC3339_MILLIS_PATTERN.test(value.createdAt) ||
    (value.state !== 'prepared' &&
      value.state !== 'dispatched' &&
      value.state !== 'committed' &&
      value.state !== 'rolled-back')
  ) {
    throw new ConstitutionClassicRecoveryAuthorityError('INTEGRITY_FAILURE', 'Classic recovery record is malformed.');
  }
  const record = value as ConstitutionClassicRecoveryOperationRecord;
  validateFacts(record);
  const expected = createRecord(record, record.createdAt);
  if (record.processRequestFingerprint !== expected.processRequestFingerprint) {
    throw new ConstitutionClassicRecoveryAuthorityError(
      'INTEGRITY_FAILURE',
      'Classic recovery operation binding is invalid.'
    );
  }
  if (record.state === 'committed') {
    const parsed = parseConstitutionClassicRecoveryMutationResult(record.result);
    if (!parsed?.success || parsed.data.operationId !== record.operationId) {
      throw new ConstitutionClassicRecoveryAuthorityError(
        'INTEGRITY_FAILURE',
        'Classic recovery committed result is invalid.'
      );
    }
  } else if (record.result !== null) {
    throw new ConstitutionClassicRecoveryAuthorityError(
      'INTEGRITY_FAILURE',
      'Classic recovery non-committed record contains a result.'
    );
  }
  return record;
}

function validateState(value: unknown): AuthorityState {
  if (
    !exactDataObject(value, ['contract', 'records']) ||
    value.contract !== AUTHORITY_CONTRACT ||
    !Array.isArray(value.records) ||
    value.records.length > MAX_OPERATIONS
  ) {
    throw new ConstitutionClassicRecoveryAuthorityError(
      'INTEGRITY_FAILURE',
      'Classic recovery authority is malformed.'
    );
  }
  const records = value.records.map(validateRecord);
  if (new Set(records.map((record) => record.operationId)).size !== records.length) {
    throw new ConstitutionClassicRecoveryAuthorityError(
      'INTEGRITY_FAILURE',
      'Classic recovery authority contains duplicate IDs.'
    );
  }
  return { contract: AUTHORITY_CONTRACT, records };
}

/**
 * Commit the directory entry created by the rename. A no-op on Windows, which
 * cannot fsync a directory handle at all; the temp file was already flushed
 * before the rename, and NTFS journals the rename itself.
 */
function fsyncDirectory(directory: string): void {
  syncDirectorySync(directory);
}

export class ConstitutionClassicRecoveryOperationAuthority {
  private readonly now: () => Date;
  private readonly isProcessAlive: (pid: number) => boolean;
  private readonly afterOperationInvocation: () => void;

  constructor(
    private readonly authorityPath: string,
    private readonly backend: ConstitutionArchiveSecretBackend,
    dependencies: AuthorityDependencies = {}
  ) {
    this.now = dependencies.now ?? (() => new Date());
    this.afterOperationInvocation = dependencies.afterOperationInvocation ?? (() => {});
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
      throw new ConstitutionClassicRecoveryAuthorityError('INTEGRITY_FAILURE', 'Authority clock is invalid.');
    }
    return value;
  }

  private readState(): AuthorityState {
    if (!existsSync(this.authorityPath)) return { contract: AUTHORITY_CONTRACT, records: [] };
    const stat = lstatSync(this.authorityPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > MAX_AUTHORITY_BYTES) {
      throw new ConstitutionClassicRecoveryAuthorityError('INTEGRITY_FAILURE', 'Classic recovery authority is unsafe.');
    }
    try {
      const plaintext = this.backend.decryptString(readFileSync(this.authorityPath, 'utf8'));
      if (Buffer.byteLength(plaintext, 'utf8') > MAX_AUTHORITY_BYTES) throw new Error('oversized');
      return validateState(JSON.parse(plaintext) as unknown);
    } catch (error) {
      if (error instanceof ConstitutionClassicRecoveryAuthorityError) throw error;
      throw new ConstitutionClassicRecoveryAuthorityError(
        'INTEGRITY_FAILURE',
        'Classic recovery authority cannot be authenticated.'
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

  private acquireLock(): Readonly<{ fd: number; path: string }> {
    const directory = path.dirname(this.authorityPath);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const lockPath = `${this.authorityPath}.lock`;
    const openLock = (): number => {
      try {
        return openSync(lockPath, 'wx', 0o600);
      } catch {
        let lock: unknown;
        try {
          lock = JSON.parse(readFileSync(lockPath, 'utf8')) as unknown;
        } catch {
          throw new ConstitutionClassicRecoveryAuthorityError(
            'AUTHORITY_BUSY',
            'Classic recovery authority is locked.'
          );
        }
        if (!exactDataObject(lock, ['pid', 'nonce']) || !Number.isSafeInteger(lock.pid) || Number(lock.pid) <= 0) {
          throw new ConstitutionClassicRecoveryAuthorityError(
            'AUTHORITY_BUSY',
            'Classic recovery authority lock is malformed.'
          );
        }
        if (this.isProcessAlive(Number(lock.pid))) {
          throw new ConstitutionClassicRecoveryAuthorityError(
            'AUTHORITY_BUSY',
            'Classic recovery authority is locked.'
          );
        }
        unlinkSync(lockPath);
        fsyncDirectory(directory);
        return openSync(lockPath, 'wx', 0o600);
      }
    };
    const fd = openLock();
    writeFileSync(fd, JSON.stringify({ pid: process.pid, nonce: randomUUID() }), 'utf8');
    fsyncSync(fd);
    fsyncDirectory(directory);
    return { fd, path: lockPath };
  }

  private releaseLock(lock: Readonly<{ fd: number; path: string }>): void {
    closeSync(lock.fd);
    unlinkSync(lock.path);
    fsyncDirectory(path.dirname(lock.path));
  }

  private withLock<T>(operation: (state: AuthorityState) => T): T {
    const lock = this.acquireLock();
    try {
      return operation(this.readState());
    } finally {
      this.releaseLock(lock);
    }
  }

  lookup(
    operationId: string,
    principalBinding: ConstitutionRestorePrincipalBinding
  ): ConstitutionClassicRecoveryOperationRecord | null {
    if (!UUID_V4_PATTERN.test(operationId)) {
      throw new ConstitutionClassicRecoveryAuthorityError(
        'INVALID_REQUEST',
        'Classic recovery operation ID is malformed.'
      );
    }
    constitutionRestorePrincipalBindingSha256(principalBinding);
    return this.withLock((state) => {
      const record = state.records.find((entry) => entry.operationId === operationId);
      if (!record) return null;
      if (!samePrincipal(record.principalBinding, principalBinding)) {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'OPERATION_NOT_FOUND',
          'Classic recovery operation was not found.'
        );
      }
      if (record.state === 'rolled-back') {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'ROLLED_BACK',
          'Classic recovery operation was rolled back.'
        );
      }
      return record;
    });
  }

  reserve(facts: ConstitutionClassicRecoveryOperationFacts): ConstitutionClassicRecoveryOperationRecord {
    const candidate = createRecord(facts, this.timestamp());
    return this.withLock((state) => {
      const existing = state.records.find((entry) => entry.operationId === facts.operationId);
      if (existing) {
        if (!samePrincipal(existing.principalBinding, facts.principalBinding)) {
          throw new ConstitutionClassicRecoveryAuthorityError(
            'OPERATION_NOT_FOUND',
            'Classic recovery operation was not found.'
          );
        }
        if (existing.processRequestFingerprint !== candidate.processRequestFingerprint) {
          throw new ConstitutionClassicRecoveryAuthorityError(
            'OPERATION_ID_CONFLICT',
            'Classic recovery operation is bound to different facts.'
          );
        }
        return existing;
      }
      if (state.records.length >= MAX_OPERATIONS) {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'OPERATION_AUTHORITY_FULL',
          'Classic recovery operation authority is full.'
        );
      }
      const next = { contract: AUTHORITY_CONTRACT, records: [...state.records, candidate] } as const;
      this.writeState(next);
      return candidate;
    });
  }

  async dispatch(
    operationId: string,
    principalBinding: ConstitutionRestorePrincipalBinding,
    invoke: (record: ConstitutionClassicRecoveryOperationRecord) => Promise<ConstitutionClassicRecoveryMutationSuccess>
  ): Promise<ConstitutionClassicRecoveryMutationSuccess> {
    const lock = this.acquireLock();
    try {
      const state = this.readState();
      const index = state.records.findIndex((entry) => entry.operationId === operationId);
      if (index < 0 || !samePrincipal(state.records[index]!.principalBinding, principalBinding)) {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'OPERATION_NOT_FOUND',
          'Classic recovery operation was not found.'
        );
      }
      const current = state.records[index]!;
      if (current.state === 'committed') return current.result!;
      if (current.state === 'rolled-back') {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'ROLLED_BACK',
          'Classic recovery operation was rolled back.'
        );
      }
      const marked = current.state === 'prepared' ? { ...current, state: 'dispatched' as const } : current;
      if (current.state === 'prepared') {
        const records = [...state.records];
        records[index] = marked;
        this.writeState({ contract: AUTHORITY_CONTRACT, records });
      }
      const result = await invoke(marked);
      if (result.data.operationId !== operationId) {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'INTEGRITY_FAILURE',
          'Classic recovery result identity does not match its operation.'
        );
      }
      if (!parseConstitutionClassicRecoveryMutationResult(result)?.success) {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'INTEGRITY_FAILURE',
          'Classic recovery result is malformed.'
        );
      }
      this.afterOperationInvocation();
      const latest = this.readState();
      const latestIndex = latest.records.findIndex((entry) => entry.operationId === operationId);
      if (latestIndex < 0 || latest.records[latestIndex]!.state !== 'dispatched') {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'INTEGRITY_FAILURE',
          'Classic recovery operation authority changed during dispatch.'
        );
      }
      const records = [...latest.records];
      records[latestIndex] = { ...latest.records[latestIndex]!, state: 'committed', result };
      this.writeState({ contract: AUTHORITY_CONTRACT, records });
      return result;
    } finally {
      this.releaseLock(lock);
    }
  }

  commitReconciled(
    operationId: string,
    principalBinding: ConstitutionRestorePrincipalBinding,
    result: ConstitutionClassicRecoveryMutationSuccess
  ): ConstitutionClassicRecoveryMutationSuccess {
    return this.withLock((state) => {
      const index = state.records.findIndex((entry) => entry.operationId === operationId);
      if (index < 0 || !samePrincipal(state.records[index]!.principalBinding, principalBinding)) {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'OPERATION_NOT_FOUND',
          'Classic recovery operation was not found.'
        );
      }
      const record = state.records[index]!;
      if (record.state === 'committed') return record.result!;
      if (record.state !== 'dispatched' || result.data.operationId !== operationId) {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'INTEGRITY_FAILURE',
          'Classic recovery reconciliation conflicts with process authority.'
        );
      }
      if (!parseConstitutionClassicRecoveryMutationResult(result)?.success) {
        throw new ConstitutionClassicRecoveryAuthorityError(
          'INTEGRITY_FAILURE',
          'Classic recovery reconciled result is malformed.'
        );
      }
      const records = [...state.records];
      records[index] = { ...record, state: 'committed', result };
      this.writeState({ contract: AUTHORITY_CONTRACT, records });
      return result;
    });
  }
}
