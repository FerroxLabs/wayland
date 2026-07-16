/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFileSync } from 'node:child_process';
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { lstatSync } from 'node:fs';
import { withHeldVerifiedConstitutionFsBinary, type VerifiedConstitutionFsBinary } from './constitutionFsBinary';

const MAX_REQUEST_BYTES = 1_310_720;
const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_LIVE_READ_RESPONSE_BYTES = 384 * 1024;
const MAX_ARCHIVE_READ_RESPONSE_BYTES = 448 * 1024;
const DEFAULT_TIMEOUT_MS = 15_000;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CIPHER_PREFIX = 'enc:v1:';
const FILE_CIPHER_PREFIX = 'fenc:v1:';
const ARCHIVE_KEY_INVENTORY = Symbol('wayland.constitutionFs.archiveKeyInventory');
const archiveKeyMaterial = new WeakMap<object, readonly ArchiveAuthenticationKeyWire[]>();
const RECEIPT_KEYS = [
  'archiveName',
  'archiveSha256',
  'archivedAt',
  'contentBase64',
  'contentSha256',
  'envelopeBase64',
  'envelopeSha256',
  'expectedSha256',
  'finalPresent',
  'finalSha256',
  'guarantees',
  'journalName',
  'inventoryEntries',
  'ok',
  'operation',
  'outcome',
  'pendingTransactions',
  'pendingTransactionDetails',
  'previousSha256',
  'recoveryName',
  'reconcileDisposition',
  'replacementSha256',
  'sealKeyIds',
  'sealKeyName',
  'sourceArchiveSha256',
  'target',
  'transactionId',
  'version',
] as const;

export type ConstitutionFsTarget =
  | { kind: 'constitution'; sourceName: 'CONSTITUTION.md' | 'SOUL.md' }
  | { kind: 'specialist'; specialistId: string; sourceName: string };

export type ConstitutionFsPayload = {
  contentBase64: string;
  sha256: `sha256:${string}`;
};

type ConstitutionFsBaseRequest = {
  version: 1;
  transactionId: string;
  root: string;
};

export type ConstitutionFsMutationRequest = ConstitutionFsBaseRequest & {
  operation: 'replace' | 'delete';
  target: ConstitutionFsTarget;
  expected: { present: boolean; sha256?: `sha256:${string}` };
  replacement?: ConstitutionFsPayload;
  archiveId?: string;
  archivedAt?: number;
  archive?: ConstitutionFsPayload;
};

export type ConstitutionFsRestoreRequest = ConstitutionFsBaseRequest & {
  operation: 'restore';
  target: ConstitutionFsTarget;
  expected: { present: boolean; sha256?: `sha256:${string}` };
  sourceArchiveId: string;
  sourceArchive: ConstitutionFsPayload;
  archiveId?: string;
  archivedAt?: number;
  archive?: ConstitutionFsPayload;
};

export type ConstitutionFsReconcileFacts = {
  operation: 'replace' | 'delete' | 'restore';
  target: ConstitutionFsTarget;
  expectedPresent: boolean;
  expectedSha256?: `sha256:${string}`;
  replacementSha256?: `sha256:${string}`;
  archiveId?: string;
  archivedAt?: number;
  archiveSha256?: `sha256:${string}`;
  sourceArchiveId?: string;
  sourceArchiveSha256?: `sha256:${string}`;
  recoverySha256?: `sha256:${string}`;
};

export type ConstitutionFsPendingTransactionDetail = Readonly<{
  transactionId: string;
  reconcileFacts: ConstitutionFsReconcileFacts;
}>;

export type ConstitutionFsReconcileRequest = ConstitutionFsBaseRequest & {
  operation: 'reconcile';
  reconcileTransactionId: string;
  reconcileFacts: ConstitutionFsReconcileFacts;
};

export type ConstitutionFsTransactionRequest = ConstitutionFsMutationRequest | ConstitutionFsRestoreRequest;

export type ConstitutionFsTransactionReceipt = {
  ok: true;
  version: 1;
  transactionId: string;
  operation: 'replace' | 'delete' | 'restore' | 'reconcile';
  outcome: 'committed';
  archivedAt: number | null;
  reconcileDisposition: 'rolled_back' | 'rolled_forward' | null;
  finalPresent: boolean | null;
  finalSha256: `sha256:${string}` | null;
  previousSha256: `sha256:${string}` | null;
  replacementSha256: `sha256:${string}` | null;
  archiveName: string | null;
  recoveryName: string | null;
  journalName: string;
  target: ConstitutionFsTarget;
  expectedSha256: `sha256:${string}` | null;
  archiveSha256: `sha256:${string}` | null;
  sourceArchiveSha256: `sha256:${string}` | null;
  guarantees: RequiredGuarantees;
};

type RequiredGuarantees = {
  anchored: true;
  rootIdentityBound: true;
  reparseRejected: true;
  noReplace: true;
  durable: true;
  recoveryRetained: true;
};

export type ConstitutionFsRootAuthority = Readonly<{
  root: string;
  device: string;
  inode: string;
}>;

type ArchiveAuthenticationKeyWire = Readonly<{
  keyId: string;
  keyBase64: string;
}>;

/** Opaque, process-local material loaded only from helper-anchored sealed key envelopes. */
export type ConstitutionArchiveAuthenticationKeyInventory = Readonly<{
  keyIds: readonly string[];
  readonly [ARCHIVE_KEY_INVENTORY]: true;
}>;

/** Injected by the Electron or headless host; keeps this low-level module runtime-neutral. */
export type ConstitutionArchiveSecretBackend = Readonly<{
  encryptString(plaintext: string): string;
  decryptString(ciphertext: string): string;
}>;

export class ConstitutionFsTransactionError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ConstitutionFsTransactionError';
  }
}

export type ConstitutionFsExecutor = (input: {
  binaryPath: string;
  binaryFd: number;
  executablePath: string;
  stdin: Buffer;
  timeoutMs: number;
  maxResponseBytes: number;
}) => { stdout: Buffer; status: number };

export type ConstitutionFsExecutionOptions = {
  rootAuthority: ConstitutionFsRootAuthority;
  journalAuthenticationKey?: Buffer;
  archiveAuthenticationKeys?: ConstitutionArchiveAuthenticationKeyInventory;
  timeoutMs?: number;
  executor?: ConstitutionFsExecutor;
};

type ExecutionOptions = ConstitutionFsExecutionOptions;

function createArchiveKeyInventory(
  entries: readonly ArchiveAuthenticationKeyWire[]
): ConstitutionArchiveAuthenticationKeyInventory {
  if (
    entries.length === 0 ||
    entries.length > 64 ||
    entries.some((entry) => !UUID_PATTERN.test(entry.keyId)) ||
    entries.some((entry) => {
      const key = Buffer.from(entry.keyBase64, 'base64');
      return key.byteLength !== 32 || key.toString('base64') !== entry.keyBase64;
    }) ||
    new Set(entries.map((entry) => entry.keyId)).size !== entries.length
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Archive authentication key inventory is malformed.'
    );
  }
  const stableEntries = entries
    .map((entry) => Object.freeze({ keyId: entry.keyId, keyBase64: entry.keyBase64 }))
    .toSorted((left, right) => left.keyId.localeCompare(right.keyId));
  const inventory = Object.freeze({
    keyIds: Object.freeze(stableEntries.map((entry) => entry.keyId)),
    [ARCHIVE_KEY_INVENTORY]: true as const,
  });
  archiveKeyMaterial.set(inventory, Object.freeze(stableEntries));
  return inventory;
}

export function createTestOnlyConstitutionArchiveAuthenticationKeyInventory(
  entries: readonly { keyId: string; key: Buffer }[]
): ConstitutionArchiveAuthenticationKeyInventory {
  if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Test-only archive keys are forbidden outside a test process.'
    );
  }
  return createArchiveKeyInventory(entries.map(({ keyId, key }) => ({ keyId, keyBase64: key.toString('base64') })));
}

function archiveKeyWire(
  inventory: ConstitutionArchiveAuthenticationKeyInventory | undefined
): readonly ArchiveAuthenticationKeyWire[] {
  const keys = inventory && inventory[ARCHIVE_KEY_INVENTORY] === true ? archiveKeyMaterial.get(inventory) : undefined;
  if (!keys) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Authenticated archive operation requires OS-unsealed trusted key material.'
    );
  }
  return keys;
}

function requestRequiresArchiveKeys(request: Record<string, unknown>): boolean {
  if (request.operation === 'restore' || request.operation === 'read_archive') return true;
  if (request.operation === 'replace' || request.operation === 'delete') {
    const expected = request.expected;
    return (
      !!expected &&
      typeof expected === 'object' &&
      !Array.isArray(expected) &&
      (expected as Record<string, unknown>).present === true
    );
  }
  if (request.operation === 'reconcile') {
    const facts = request.reconcileFacts;
    return (
      !!facts &&
      typeof facts === 'object' &&
      !Array.isArray(facts) &&
      (typeof (facts as Record<string, unknown>).archiveId === 'string' ||
        typeof (facts as Record<string, unknown>).sourceArchiveId === 'string')
    );
  }
  return false;
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(record).toSorted();
  const wanted = [...expected].toSorted();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function defaultExecutor(input: Parameters<ConstitutionFsExecutor>[0]): ReturnType<ConstitutionFsExecutor> {
  try {
    const stdout = execFileSync(input.executablePath, [], {
      input: input.stdin,
      timeout: input.timeoutMs,
      maxBuffer: input.maxResponseBytes,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe', input.binaryFd],
    });
    return { stdout: Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout ?? ''), status: 0 };
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { stdout?: Buffer; status?: number; signal?: NodeJS.Signals };
    if (failure.code === 'ETIMEDOUT' || failure.signal === 'SIGTERM') {
      throw new ConstitutionFsTransactionError('CONSTITUTION_FS_TIMEOUT', 'Constitution filesystem helper timed out.');
    }
    if (failure.code === 'ENOBUFS') {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_RESPONSE_OVERSIZE',
        'Constitution filesystem helper response exceeded its bound.'
      );
    }
    if (failure.stdout) return { stdout: failure.stdout, status: failure.status ?? 2 };
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_EXEC_FAILED',
      'Constitution filesystem helper could not be executed.'
    );
  }
}

function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ConstitutionFsTransactionError('CONSTITUTION_FS_MALFORMED_RESPONSE', 'Helper response is not an object.');
  }
}

function assertGuarantees(
  value: Record<string, unknown>
): asserts value is Record<string, unknown> & { guarantees: RequiredGuarantees } {
  assertRecord(value.guarantees);
  if (
    !exactKeys(value.guarantees, [
      'anchored',
      'rootIdentityBound',
      'reparseRejected',
      'noReplace',
      'durable',
      'recoveryRetained',
    ]) ||
    value.guarantees.anchored !== true ||
    value.guarantees.rootIdentityBound !== true ||
    value.guarantees.reparseRejected !== true ||
    value.guarantees.noReplace !== true ||
    value.guarantees.durable !== true ||
    value.guarantees.recoveryRetained !== true
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_GUARANTEE_REJECTED',
      'Helper response did not prove every required transaction guarantee.'
    );
  }
}

export function pinConstitutionFsRootAuthority(root: string): ConstitutionFsRootAuthority {
  let stat;
  try {
    stat = lstatSync(root, { bigint: true });
  } catch {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_UNSAFE_ROOT',
      'Constitution root cannot be captured at the trusted caller boundary.'
    );
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_UNSAFE_ROOT',
      'Constitution root is not a real directory.'
    );
  }
  return Object.freeze({ root, device: stat.dev.toString(), inode: stat.ino.toString() });
}

function invokeNative(
  request: Record<string, unknown>,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): { value: Record<string, unknown>; status: number } {
  const root = request.root;
  if (typeof root !== 'string') {
    throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Request root is missing.');
  }
  const authority = options.rootAuthority;
  if (!authority || authority.root !== root) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ROOT_IDENTITY_MISMATCH',
      'Request root is not bound to the pinned root authority.'
    );
  }
  const current = pinConstitutionFsRootAuthority(root);
  if (current.device !== authority.device || current.inode !== authority.inode) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ROOT_IDENTITY_MISMATCH',
      'Constitution root diverged from its initialization-time identity.'
    );
  }
  const authenticatedOperation = ['replace', 'delete', 'restore', 'reconcile', 'pending_inventory'].includes(
    String(request.operation)
  );
  const authenticatedArchiveOperation = requestRequiresArchiveKeys(request);
  const journalKey = options.journalAuthenticationKey;
  if (authenticatedOperation && (!Buffer.isBuffer(journalKey) || journalKey.byteLength !== 32)) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_INVALID_REQUEST',
      'Transaction requires a 32-byte OS-unsealed journal authentication key.'
    );
  }
  const wireRequest = {
    ...request,
    rootIdentity: { device: authority.device, inode: authority.inode },
    ...(authenticatedOperation ? { journalKeyBase64: journalKey!.toString('base64') } : {}),
    ...(authenticatedArchiveOperation
      ? { archiveAuthenticationKeys: archiveKeyWire(options.archiveAuthenticationKeys) }
      : {}),
  };
  const stdin = Buffer.from(JSON.stringify(wireRequest), 'utf8');
  if (stdin.byteLength > MAX_REQUEST_BYTES) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_REQUEST_OVERSIZE',
      'Transaction request exceeded its bound.'
    );
  }
  const responseLimit =
    request.operation === 'read_live'
      ? MAX_LIVE_READ_RESPONSE_BYTES
      : request.operation === 'read_archive'
        ? MAX_ARCHIVE_READ_RESPONSE_BYTES
        : MAX_RESPONSE_BYTES;
  const result = withHeldVerifiedConstitutionFsBinary(binary, (held) =>
    (options.executor ?? defaultExecutor)({
      binaryPath: held.binaryPath,
      binaryFd: held.fd,
      executablePath: held.executablePath,
      stdin,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxResponseBytes: responseLimit,
    })
  );
  if (result.stdout.byteLength > responseLimit) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_RESPONSE_OVERSIZE',
      'Helper response exceeded its bound.'
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(result.stdout.toString('utf8')) as unknown;
  } catch {
    throw new ConstitutionFsTransactionError('CONSTITUTION_FS_MALFORMED_RESPONSE', 'Helper response is not JSON.');
  }
  assertRecord(value);
  if (value.ok === false && typeof value.code === 'string') {
    if (
      !exactKeys(value, ['ok', 'version', 'code', 'message']) ||
      value.version !== 1 ||
      typeof value.message !== 'string'
    ) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_MALFORMED_RESPONSE',
        'Helper error response is malformed.'
      );
    }
    throw new ConstitutionFsTransactionError(value.code, value.message);
  }
  return { value, status: result.status };
}

function sameTarget(left: unknown, right: ConstitutionFsTarget): boolean {
  if (!left || typeof left !== 'object' || Array.isArray(left)) return false;
  return JSON.stringify(left) === JSON.stringify(right);
}

function matchesTarget(value: unknown): value is ConstitutionFsTarget {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const target = value as Record<string, unknown>;
  if (target.kind === 'constitution') {
    return (
      exactKeys(target, ['kind', 'sourceName']) &&
      (target.sourceName === 'CONSTITUTION.md' || target.sourceName === 'SOUL.md')
    );
  }
  return (
    target.kind === 'specialist' &&
    exactKeys(target, ['kind', 'sourceName', 'specialistId']) &&
    typeof target.specialistId === 'string' &&
    typeof target.sourceName === 'string'
  );
}

function matchesOperation(value: unknown): value is ConstitutionFsReconcileFacts['operation'] {
  return value === 'replace' || value === 'delete' || value === 'restore';
}

function restoredContentSha256(payload: ConstitutionFsPayload): `sha256:${string}` {
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(payload.contentBase64, 'base64').toString('utf8')) as unknown;
  } catch {
    throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Restore source archive is not JSON.');
  }
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof (value as Record<string, unknown>).content !== 'string'
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_INVALID_REQUEST',
      'Restore source archive has no content.'
    );
  }
  return `sha256:${createHash('sha256')
    .update((value as Record<string, string>).content, 'utf8')
    .digest('hex')}`;
}

function parseTransactionReceipt(
  result: { value: Record<string, unknown>; status: number },
  request: ConstitutionFsTransactionRequest | ConstitutionFsReconcileRequest
): ConstitutionFsTransactionReceipt {
  const { value, status } = result;
  assertGuarantees(value);
  const expectedTarget = request.operation === 'reconcile' ? request.reconcileFacts.target : request.target;
  const expectedSha256 =
    request.operation === 'reconcile' ? request.reconcileFacts.expectedSha256 : request.expected.sha256;
  const expectedPresent =
    request.operation === 'reconcile' ? request.reconcileFacts.expectedPresent : request.expected.present;
  const effectiveOperation = request.operation === 'reconcile' ? request.reconcileFacts.operation : request.operation;
  const subjectTransactionId =
    request.operation === 'reconcile' ? request.reconcileTransactionId : request.transactionId;
  const replacementSha256 =
    request.operation === 'reconcile'
      ? request.reconcileFacts.replacementSha256
      : request.operation === 'replace'
        ? request.replacement?.sha256
        : request.operation === 'restore'
          ? restoredContentSha256(request.sourceArchive)
          : undefined;
  const archiveId = request.operation === 'reconcile' ? request.reconcileFacts.archiveId : request.archiveId;
  const archivedAt = request.operation === 'reconcile' ? request.reconcileFacts.archivedAt : request.archivedAt;
  const archiveSha256 =
    request.operation === 'reconcile' ? request.reconcileFacts.archiveSha256 : request.archive?.sha256;
  const sourceArchiveSha256 =
    request.operation === 'reconcile'
      ? request.reconcileFacts.sourceArchiveSha256
      : request.operation === 'restore'
        ? request.sourceArchive.sha256
        : undefined;
  const expectedPreviousSha256 = expectedPresent ? (expectedSha256 ?? null) : null;
  const expectedArchiveName = expectedPresent ? `${archiveId}.json` : null;
  const expectedRecoveryName = expectedPresent ? `${subjectTransactionId}.displaced` : null;
  const reconcileDisposition =
    request.operation === 'reconcile' &&
    (value.reconcileDisposition === 'rolled_back' || value.reconcileDisposition === 'rolled_forward')
      ? value.reconcileDisposition
      : null;
  const archiveRealityValid =
    request.operation === 'reconcile'
      ? reconcileDisposition === 'rolled_forward'
        ? value.archiveName === expectedArchiveName &&
          value.archivedAt === (expectedPresent ? (archivedAt ?? null) : null) &&
          value.archiveSha256 === (archiveSha256 ?? null)
        : archiveId === undefined
          ? value.archiveName === null && value.archivedAt === null && value.archiveSha256 === null
          : (value.archiveName === null && value.archivedAt === null && value.archiveSha256 === null) ||
            (value.archiveName === `${archiveId}.json` &&
              value.archivedAt === archivedAt &&
              value.archiveSha256 === archiveSha256)
      : value.archiveName === expectedArchiveName &&
        value.archivedAt === (expectedPresent ? (archivedAt ?? null) : null) &&
        value.archiveSha256 === (archiveSha256 ?? null);
  const recoveryRealityValid =
    request.operation === 'reconcile'
      ? reconcileDisposition === 'rolled_forward'
        ? value.recoveryName === expectedRecoveryName
        : expectedRecoveryName === null
          ? value.recoveryName === null
          : value.recoveryName === null || value.recoveryName === expectedRecoveryName
      : value.recoveryName === expectedRecoveryName;
  const expectedFinalSha256 =
    request.operation === 'reconcile'
      ? reconcileDisposition === 'rolled_forward'
        ? effectiveOperation === 'delete'
          ? null
          : (replacementSha256 ?? null)
        : reconcileDisposition === 'rolled_back'
          ? expectedPreviousSha256
          : undefined
      : null;
  if (
    !exactKeys(value, RECEIPT_KEYS) ||
    status !== 0 ||
    value.ok !== true ||
    value.version !== 1 ||
    value.transactionId !== request.transactionId ||
    value.operation !== request.operation ||
    value.outcome !== 'committed' ||
    (request.operation === 'reconcile'
      ? reconcileDisposition === null ||
        expectedFinalSha256 === undefined ||
        value.finalPresent !== (expectedFinalSha256 !== null) ||
        value.finalSha256 !== expectedFinalSha256
      : value.reconcileDisposition !== null || value.finalPresent !== null || value.finalSha256 !== null) ||
    !sameTarget(value.target, expectedTarget) ||
    value.expectedSha256 !== (expectedSha256 ?? null) ||
    value.previousSha256 !== expectedPreviousSha256 ||
    value.replacementSha256 !== (replacementSha256 ?? null) ||
    !archiveRealityValid ||
    !recoveryRealityValid ||
    value.journalName !== `${subjectTransactionId}.jsonl` ||
    value.sourceArchiveSha256 !== (sourceArchiveSha256 ?? null) ||
    (effectiveOperation === 'delete' && value.replacementSha256 !== null) ||
    value.sealKeyIds !== null ||
    value.sealKeyName !== null ||
    value.envelopeBase64 !== null ||
    value.envelopeSha256 !== null ||
    value.pendingTransactions !== null ||
    value.pendingTransactionDetails !== null ||
    value.contentBase64 !== null ||
    value.contentSha256 !== null ||
    value.inventoryEntries !== null
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_GUARANTEE_REJECTED',
      'Helper response is not exactly bound to the requested transaction.'
    );
  }
  return value as unknown as ConstitutionFsTransactionReceipt;
}

/** Executes one bounded, verified native transaction. There is no JavaScript filesystem fallback. */
export function runConstitutionFsTransaction(
  request: ConstitutionFsTransactionRequest,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): ConstitutionFsTransactionReceipt {
  return parseTransactionReceipt(invokeNative(request as unknown as Record<string, unknown>, binary, options), request);
}

export function reconcileConstitutionFsTransaction(
  request: ConstitutionFsReconcileRequest,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): ConstitutionFsTransactionReceipt {
  return parseTransactionReceipt(invokeNative(request as unknown as Record<string, unknown>, binary, options), request);
}

export function inventoryPendingConstitutionFsTransactionDetails(
  root: string,
  transactionId: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): ConstitutionFsPendingTransactionDetail[] {
  const request = { version: 1, transactionId, root, operation: 'pending_inventory' };
  const { value, status } = invokeNative(request, binary, options);
  assertGuarantees(value);
  if (
    !exactKeys(value, RECEIPT_KEYS) ||
    status !== 0 ||
    value.ok !== true ||
    value.version !== 1 ||
    value.transactionId !== transactionId ||
    value.operation !== 'pending_inventory' ||
    value.outcome !== 'committed' ||
    value.reconcileDisposition !== null ||
    value.finalPresent !== null ||
    value.finalSha256 !== null ||
    value.previousSha256 !== null ||
    value.replacementSha256 !== null ||
    value.archiveName !== null ||
    value.archivedAt !== null ||
    value.recoveryName !== null ||
    value.journalName !== null ||
    value.sealKeyIds !== null ||
    value.sealKeyName !== null ||
    value.envelopeBase64 !== null ||
    value.envelopeSha256 !== null ||
    value.target !== null ||
    value.expectedSha256 !== null ||
    value.archiveSha256 !== null ||
    value.sourceArchiveSha256 !== null ||
    value.contentBase64 !== null ||
    value.contentSha256 !== null ||
    value.inventoryEntries !== null ||
    !Array.isArray(value.pendingTransactions) ||
    !value.pendingTransactions.every((id) => typeof id === 'string' && UUID_PATTERN.test(id)) ||
    new Set(value.pendingTransactions).size !== value.pendingTransactions.length ||
    value.pendingTransactions.some((id, index, all) => index > 0 && String(all[index - 1]) >= String(id)) ||
    !Array.isArray(value.pendingTransactionDetails) ||
    value.pendingTransactionDetails.length !== value.pendingTransactions.length
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_GUARANTEE_REJECTED',
      'Pending inventory response is malformed.'
    );
  }
  const details = value.pendingTransactionDetails.map((candidate, index) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_GUARANTEE_REJECTED',
        'Pending transaction detail is malformed.'
      );
    }
    const detail = candidate as Record<string, unknown>;
    const facts = detail.reconcileFacts as Record<string, unknown> | undefined;
    const operation = facts?.operation;
    const expectedPresent = facts?.expectedPresent;
    const expectedSha256 = facts?.expectedSha256;
    const replacementSha256 = facts?.replacementSha256;
    const archiveId = facts?.archiveId;
    const archivedAt = facts?.archivedAt;
    const archiveSha256 = facts?.archiveSha256;
    const sourceArchiveId = facts?.sourceArchiveId;
    const sourceArchiveSha256 = facts?.sourceArchiveSha256;
    const recoverySha256 = facts?.recoverySha256;
    const optionalDigest = (value: unknown) =>
      value == null || (typeof value === 'string' && DIGEST_PATTERN.test(value));
    const optionalUuid = (value: unknown) => value == null || (typeof value === 'string' && UUID_PATTERN.test(value));
    if (
      !exactKeys(detail, ['reconcileFacts', 'transactionId']) ||
      detail.transactionId !== value.pendingTransactions[index] ||
      !facts ||
      !exactKeys(facts, [
        'archiveId',
        'archiveSha256',
        'archivedAt',
        'expectedPresent',
        'expectedSha256',
        'operation',
        'recoverySha256',
        'replacementSha256',
        'sourceArchiveId',
        'sourceArchiveSha256',
        'target',
      ]) ||
      !matchesTarget(facts.target) ||
      !matchesOperation(operation) ||
      typeof expectedPresent !== 'boolean' ||
      !optionalDigest(expectedSha256) ||
      !optionalDigest(replacementSha256) ||
      !optionalUuid(archiveId) ||
      (archivedAt != null && (!Number.isSafeInteger(archivedAt) || Number(archivedAt) < 0)) ||
      !optionalDigest(archiveSha256) ||
      !optionalUuid(sourceArchiveId) ||
      !optionalDigest(sourceArchiveSha256) ||
      !optionalDigest(recoverySha256) ||
      expectedPresent !== (expectedSha256 != null) ||
      expectedPresent !== (recoverySha256 != null) ||
      expectedSha256 !== recoverySha256 ||
      expectedPresent !== (archiveId != null && archiveSha256 != null && archivedAt != null) ||
      (sourceArchiveId != null) !== (sourceArchiveSha256 != null) ||
      (operation === 'replace' && (replacementSha256 == null || sourceArchiveId != null)) ||
      (operation === 'delete' && (replacementSha256 != null || sourceArchiveId != null)) ||
      (operation === 'restore' && (replacementSha256 == null || sourceArchiveId == null))
    ) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_GUARANTEE_REJECTED',
        'Pending transaction detail is not exactly bound to authenticated recovery facts.'
      );
    }
    return {
      transactionId: detail.transactionId as string,
      reconcileFacts: {
        operation,
        target: facts.target as ConstitutionFsTarget,
        expectedPresent,
        ...(expectedSha256 == null ? {} : { expectedSha256: expectedSha256 as `sha256:${string}` }),
        ...(replacementSha256 == null ? {} : { replacementSha256: replacementSha256 as `sha256:${string}` }),
        ...(archiveId == null ? {} : { archiveId: archiveId as string }),
        ...(archivedAt == null ? {} : { archivedAt: archivedAt as number }),
        ...(archiveSha256 == null ? {} : { archiveSha256: archiveSha256 as `sha256:${string}` }),
        ...(sourceArchiveId == null ? {} : { sourceArchiveId: sourceArchiveId as string }),
        ...(sourceArchiveSha256 == null ? {} : { sourceArchiveSha256: sourceArchiveSha256 as `sha256:${string}` }),
        ...(recoverySha256 == null ? {} : { recoverySha256: recoverySha256 as `sha256:${string}` }),
      },
    };
  });
  return details;
}

export function inventoryPendingConstitutionFsTransactions(
  root: string,
  transactionId: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): string[] {
  return inventoryPendingConstitutionFsTransactionDetails(root, transactionId, binary, options).map(
    (detail) => detail.transactionId
  );
}

function assertReadOnlyReceipt(
  value: Record<string, unknown>,
  status: number,
  transactionId: string,
  operation: 'read_live' | 'live_inventory' | 'archive_inventory' | 'read_archive'
): void {
  assertGuarantees(value);
  if (
    !exactKeys(value, RECEIPT_KEYS) ||
    status !== 0 ||
    value.ok !== true ||
    value.version !== 1 ||
    value.transactionId !== transactionId ||
    value.operation !== operation ||
    value.outcome !== 'committed' ||
    value.reconcileDisposition !== null ||
    value.finalPresent !== null ||
    value.finalSha256 !== null ||
    value.previousSha256 !== null ||
    value.replacementSha256 !== null ||
    value.archiveName !== null ||
    value.archivedAt !== null ||
    value.recoveryName !== null ||
    value.journalName !== null ||
    value.sealKeyIds !== null ||
    value.sealKeyName !== null ||
    value.envelopeBase64 !== null ||
    value.envelopeSha256 !== null ||
    value.expectedSha256 !== null ||
    value.archiveSha256 !== null ||
    value.sourceArchiveSha256 !== null ||
    value.pendingTransactions !== null ||
    value.pendingTransactionDetails !== null
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_GUARANTEE_REJECTED',
      'Read-only helper response is not exact.'
    );
  }
}

export function readConstitutionFsTarget(
  root: string,
  transactionId: string,
  target: ConstitutionFsTarget,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): { content: Buffer; sha256: `sha256:${string}` } {
  const request = { version: 1, transactionId, root, operation: 'read_live', target };
  const { value, status } = invokeNative(request, binary, options);
  assertReadOnlyReceipt(value, status, transactionId, 'read_live');
  if (
    !sameTarget(value.target, target) ||
    typeof value.contentBase64 !== 'string' ||
    typeof value.contentSha256 !== 'string' ||
    !DIGEST_PATTERN.test(value.contentSha256) ||
    value.inventoryEntries !== null
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_GUARANTEE_REJECTED',
      'Live-read response is not bound to the requested target.'
    );
  }
  const content = Buffer.from(value.contentBase64, 'base64');
  if (content.toString('base64') !== value.contentBase64) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_MALFORMED_RESPONSE',
      'Live-read content is not canonical base64.'
    );
  }
  const digest = `sha256:${createHash('sha256').update(content).digest('hex')}` as const;
  if (digest !== value.contentSha256) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_DIGEST_MISMATCH',
      'Live-read digest does not match its bytes.'
    );
  }
  return { content, sha256: digest };
}

function inventoryReadOnly(
  root: string,
  transactionId: string,
  operation: 'live_inventory' | 'archive_inventory',
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): string[] {
  const { value, status } = invokeNative({ version: 1, transactionId, root, operation }, binary, options);
  assertReadOnlyReceipt(value, status, transactionId, operation);
  if (
    value.target !== null ||
    value.contentBase64 !== null ||
    value.contentSha256 !== null ||
    !Array.isArray(value.inventoryEntries) ||
    !value.inventoryEntries.every((entry) => typeof entry === 'string') ||
    new Set(value.inventoryEntries).size !== value.inventoryEntries.length ||
    value.inventoryEntries.some((entry, index, all) => index > 0 && String(all[index - 1]) >= String(entry))
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_GUARANTEE_REJECTED',
      'Read-only inventory response is malformed.'
    );
  }
  return value.inventoryEntries;
}

export function inventoryConstitutionFsLiveTargets(
  root: string,
  transactionId: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): string[] {
  return inventoryReadOnly(root, transactionId, 'live_inventory', binary, options);
}

export function inventoryConstitutionFsArchives(
  root: string,
  transactionId: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): string[] {
  return inventoryReadOnly(root, transactionId, 'archive_inventory', binary, options);
}

export function readConstitutionFsArchive(
  root: string,
  transactionId: string,
  archiveId: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): { record: Buffer; sha256: `sha256:${string}`; target: ConstitutionFsTarget } {
  if (!UUID_PATTERN.test(archiveId)) {
    throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Archive identity is invalid.');
  }
  const { value, status } = invokeNative(
    { version: 1, transactionId, root, operation: 'read_archive', archiveId },
    binary,
    options
  );
  assertReadOnlyReceipt(value, status, transactionId, 'read_archive');
  if (
    !value.target ||
    typeof value.target !== 'object' ||
    Array.isArray(value.target) ||
    typeof value.contentBase64 !== 'string' ||
    typeof value.contentSha256 !== 'string' ||
    !DIGEST_PATTERN.test(value.contentSha256) ||
    value.inventoryEntries !== null
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_GUARANTEE_REJECTED',
      'Archive-read response is malformed.'
    );
  }
  const record = Buffer.from(value.contentBase64, 'base64');
  if (record.toString('base64') !== value.contentBase64) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_MALFORMED_RESPONSE',
      'Archive record is not canonical base64.'
    );
  }
  const sha256 = `sha256:${createHash('sha256').update(record).digest('hex')}` as const;
  if (sha256 !== value.contentSha256) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_DIGEST_MISMATCH',
      'Archive record digest does not match its bytes.'
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(record.toString('utf8')) as unknown;
  } catch {
    throw new ConstitutionFsTransactionError('CONSTITUTION_FS_MALFORMED_RESPONSE', 'Archive record is not JSON.');
  }
  assertRecord(parsed);
  if (parsed.archiveId !== archiveId || JSON.stringify(parsed.target) !== JSON.stringify(value.target)) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_GUARANTEE_REJECTED',
      'Archive summary does not match its record.'
    );
  }
  return { record, sha256, target: value.target as ConstitutionFsTarget };
}

export type ConstitutionSealKeyReadResult = {
  keyId: string;
  envelope: Buffer;
  sha256: `sha256:${string}`;
};

function sealKeyRequest(
  root: string,
  transactionId: string,
  operation: 'seal_key_inventory' | 'seal_key_read' | 'seal_key_create',
  keyId?: string,
  envelope?: Buffer
): Record<string, unknown> {
  const request: Record<string, unknown> = { version: 1, transactionId, root, operation };
  if (keyId) request.sealKeyId = keyId;
  if (envelope) {
    request.envelope = {
      contentBase64: envelope.toString('base64'),
      sha256: `sha256:${createHash('sha256').update(envelope).digest('hex')}`,
    };
  }
  return request;
}

function parseSealReceipt(
  result: { value: Record<string, unknown>; status: number },
  transactionId: string,
  operation: 'seal_key_inventory' | 'seal_key_read' | 'seal_key_create'
): Record<string, unknown> {
  const { value, status } = result;
  assertGuarantees(value);
  if (
    !exactKeys(value, RECEIPT_KEYS) ||
    status !== 0 ||
    value.ok !== true ||
    value.version !== 1 ||
    value.transactionId !== transactionId ||
    value.operation !== operation ||
    value.outcome !== 'committed' ||
    value.reconcileDisposition !== null ||
    value.finalPresent !== null ||
    value.finalSha256 !== null ||
    value.previousSha256 !== null ||
    value.replacementSha256 !== null ||
    value.archiveName !== null ||
    value.archivedAt !== null ||
    value.recoveryName !== null ||
    value.journalName !== null ||
    value.target !== null ||
    value.expectedSha256 !== null ||
    value.archiveSha256 !== null ||
    value.sourceArchiveSha256 !== null ||
    value.pendingTransactions !== null ||
    value.pendingTransactionDetails !== null ||
    value.contentBase64 !== null ||
    value.contentSha256 !== null ||
    value.inventoryEntries !== null
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_GUARANTEE_REJECTED',
      'Seal-key response did not prove an exact committed anchored operation.'
    );
  }
  return value;
}

export function inventoryConstitutionSealKeys(
  root: string,
  transactionId: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): string[] {
  const value = parseSealReceipt(
    invokeNative(sealKeyRequest(root, transactionId, 'seal_key_inventory'), binary, options),
    transactionId,
    'seal_key_inventory'
  );
  if (
    !Array.isArray(value.sealKeyIds) ||
    !value.sealKeyIds.every((id) => typeof id === 'string' && UUID_PATTERN.test(id)) ||
    new Set(value.sealKeyIds).size !== value.sealKeyIds.length ||
    value.sealKeyIds.some((id, index, all) => index > 0 && String(all[index - 1]) >= String(id)) ||
    value.sealKeyName !== null ||
    value.envelopeBase64 !== null ||
    value.envelopeSha256 !== null
  ) {
    throw new ConstitutionFsTransactionError('CONSTITUTION_FS_MALFORMED_RESPONSE', 'Seal-key inventory is malformed.');
  }
  return value.sealKeyIds;
}

export function readConstitutionSealKey(
  root: string,
  transactionId: string,
  keyId: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): ConstitutionSealKeyReadResult {
  const value = parseSealReceipt(
    invokeNative(sealKeyRequest(root, transactionId, 'seal_key_read', keyId), binary, options),
    transactionId,
    'seal_key_read'
  );
  if (
    !Array.isArray(value.sealKeyIds) ||
    value.sealKeyIds.length !== 1 ||
    value.sealKeyIds[0] !== keyId ||
    value.sealKeyName !== `${keyId}.json` ||
    typeof value.envelopeBase64 !== 'string' ||
    typeof value.envelopeSha256 !== 'string' ||
    !DIGEST_PATTERN.test(value.envelopeSha256)
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_MALFORMED_RESPONSE',
      'Seal-key read response is malformed.'
    );
  }
  const envelope = Buffer.from(value.envelopeBase64, 'base64');
  if (envelope.toString('base64') !== value.envelopeBase64) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_MALFORMED_RESPONSE',
      'Seal-key read response is not canonical base64.'
    );
  }
  const digest = `sha256:${createHash('sha256').update(envelope).digest('hex')}` as const;
  if (digest !== value.envelopeSha256) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_DIGEST_MISMATCH',
      'Seal-key envelope digest does not match its bytes.'
    );
  }
  return { keyId, envelope, sha256: digest };
}

export function createConstitutionSealKey(
  root: string,
  transactionId: string,
  keyId: string,
  envelope: Buffer,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions
): void {
  const value = parseSealReceipt(
    invokeNative(sealKeyRequest(root, transactionId, 'seal_key_create', keyId, envelope), binary, options),
    transactionId,
    'seal_key_create'
  );
  const digest = `sha256:${createHash('sha256').update(envelope).digest('hex')}`;
  if (
    !Array.isArray(value.sealKeyIds) ||
    value.sealKeyIds.length !== 1 ||
    value.sealKeyIds[0] !== keyId ||
    value.sealKeyName !== `${keyId}.json` ||
    value.envelopeSha256 !== digest ||
    value.envelopeBase64 !== null
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_MALFORMED_RESPONSE',
      'Seal-key create response names or binds the wrong key.'
    );
  }
}

function unsealArchiveAuthenticationKey(envelope: Buffer, secretBackend: ConstitutionArchiveSecretBackend): Buffer {
  let parsed: unknown;
  try {
    parsed = JSON.parse(envelope.toString('utf8')) as unknown;
  } catch {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Archive key envelope is not JSON.'
    );
  }
  assertRecord(parsed);
  if (
    !exactKeys(parsed, ['formatVersion', 'cipher', 'ciphertext']) ||
    parsed.formatVersion !== 1 ||
    typeof parsed.cipher !== 'string' ||
    typeof parsed.ciphertext !== 'string'
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Archive key envelope schema is invalid.'
    );
  }
  let encrypted: string;
  if (parsed.cipher === 'electron-safe-storage') {
    const ciphertext = Buffer.from(parsed.ciphertext, 'base64');
    if (ciphertext.byteLength === 0 || ciphertext.toString('base64') !== parsed.ciphertext) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
        'Archive key envelope ciphertext is not canonical.'
      );
    }
    encrypted = `${CIPHER_PREFIX}${parsed.ciphertext}`;
  } else if (parsed.cipher === 'wayland-file-key-store' && parsed.ciphertext.startsWith(FILE_CIPHER_PREFIX)) {
    encrypted = parsed.ciphertext;
  } else {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Archive key envelope cipher is not trusted.'
    );
  }
  let plaintext: string;
  try {
    plaintext = secretBackend.decryptString(encrypted);
  } catch {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Archive key could not be unsealed by the configured secret backend.'
    );
  }
  const key = Buffer.from(plaintext, 'base64');
  if (key.byteLength !== 32 || key.toString('base64') !== plaintext) {
    key.fill(0);
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Unsealed archive key material is malformed.'
    );
  }
  return key;
}

/** Loads every helper-anchored key envelope and unseals it through the production secret backend. */
export function loadConstitutionArchiveAuthenticationKeys(
  root: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions,
  secretBackend: ConstitutionArchiveSecretBackend
): ConstitutionArchiveAuthenticationKeyInventory {
  const keyIds = inventoryConstitutionSealKeys(root, randomUUID(), binary, options);
  if (keyIds.length === 0) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'No sealed archive authentication keys exist.'
    );
  }
  const entries = keyIds.map((keyId) => {
    const sealed = readConstitutionSealKey(root, randomUUID(), keyId, binary, options);
    const key = unsealArchiveAuthenticationKey(sealed.envelope, secretBackend);
    const keyBase64 = key.toString('base64');
    key.fill(0);
    return { keyId, keyBase64 };
  });
  return createArchiveKeyInventory(entries);
}

/** Creates one production-sealed archive key; reload the inventory before using it. */
export function createAndSealConstitutionArchiveAuthenticationKey(
  root: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions,
  secretBackend: ConstitutionArchiveSecretBackend
): string {
  const existing = inventoryConstitutionSealKeys(root, randomUUID(), binary, options);
  if (existing.length >= 64) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_LIMIT',
      'Archive key history reached its retained-key cap; rotation is blocked until an explicit migration retires old history.'
    );
  }
  const keyId = randomUUID();
  const key = randomBytes(32);
  let encrypted: string;
  try {
    encrypted = secretBackend.encryptString(key.toString('base64'));
  } finally {
    key.fill(0);
  }
  let envelope: Record<string, unknown>;
  if (encrypted.startsWith(CIPHER_PREFIX)) {
    envelope = { formatVersion: 1, cipher: 'electron-safe-storage', ciphertext: encrypted.slice(CIPHER_PREFIX.length) };
  } else if (encrypted.startsWith(FILE_CIPHER_PREFIX)) {
    envelope = { formatVersion: 1, cipher: 'wayland-file-key-store', ciphertext: encrypted };
  } else {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Secret backend returned an unsupported archive key envelope.'
    );
  }
  createConstitutionSealKey(
    root,
    randomUUID(),
    keyId,
    Buffer.from(`${JSON.stringify(envelope)}\n`, 'utf8'),
    binary,
    options
  );
  return keyId;
}

/** Ensures first-use bootstrap without rotating or deleting any history-referenced key. */
export function ensureConstitutionArchiveAuthenticationKey(
  root: string,
  binary: VerifiedConstitutionFsBinary,
  options: ExecutionOptions,
  secretBackend: ConstitutionArchiveSecretBackend
): { keyId: string; created: boolean } {
  const existing = inventoryConstitutionSealKeys(root, randomUUID(), binary, options);
  if (existing.length > 0) return { keyId: existing[0]!, created: false };
  return {
    keyId: createAndSealConstitutionArchiveAuthenticationKey(root, binary, options, secretBackend),
    created: true,
  };
}

export function createAuthenticatedConstitutionArchive(
  input: {
    archiveId: string;
    archivedAt: number;
    target: ConstitutionFsTarget;
    content: string;
    keyId: string;
  },
  inventory: ConstitutionArchiveAuthenticationKeyInventory
): ConstitutionFsPayload {
  if (
    !UUID_PATTERN.test(input.archiveId) ||
    !UUID_PATTERN.test(input.keyId) ||
    !Number.isSafeInteger(input.archivedAt) ||
    input.archivedAt < 0 ||
    Buffer.byteLength(input.content, 'utf8') > 256 * 1024
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_INVALID_REQUEST',
      'Authenticated archive metadata is invalid.'
    );
  }
  const entry = archiveKeyWire(inventory).find((candidate) => candidate.keyId === input.keyId);
  if (!entry) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
      'Selected archive key is not in the trusted inventory.'
    );
  }
  const unsigned = {
    kind: 'wayland-constitution-history',
    version: 3,
    archiveId: input.archiveId,
    archivedAt: input.archivedAt,
    target: input.target,
    content: input.content,
  } as const;
  const key = Buffer.from(entry.keyBase64, 'base64');
  const mac = createHmac('sha256', key).update(JSON.stringify(unsigned), 'utf8').digest('hex');
  key.fill(0);
  const record = Buffer.from(
    JSON.stringify({
      kind: unsigned.kind,
      version: unsigned.version,
      archiveId: unsigned.archiveId,
      archivedAt: unsigned.archivedAt,
      target: unsigned.target,
      contentDigest: `hmac-sha256:${input.keyId}:${mac}`,
      content: unsigned.content,
    }),
    'utf8'
  );
  return {
    contentBase64: record.toString('base64'),
    sha256: `sha256:${createHash('sha256').update(record).digest('hex')}`,
  };
}
