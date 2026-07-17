export const CONSTITUTION_ARCHIVE_RECOVERY_DTO_CONTRACT = 'wayland-constitution-archive-recovery-dto/1.0' as const;

export type ConstitutionArchiveRecoverySummary = Readonly<{
  archiveId: string;
  archivedAt: string;
  targetKind: 'constitution' | 'specialist';
  specialistId: string | null;
  sourceName: string;
  bytes: number;
  targetRevision: string;
}>;

export type ConstitutionArchiveInventorySuccess = Readonly<{
  success: true;
  data: Readonly<{
    contract: typeof CONSTITUTION_ARCHIVE_RECOVERY_DTO_CONTRACT;
    archives: readonly ConstitutionArchiveRecoverySummary[];
  }>;
}>;

export type ConstitutionArchiveRestoreRequest = Readonly<{
  operationId: string;
  archiveId: string;
  expectedArchiveRevision: string;
  password: string;
  expectedRevision: string;
}>;

export type ConstitutionArchiveRestoreSuccess = Readonly<{
  success: true;
  data: Readonly<{
    status: 'committed';
    operationId: string;
    revision: string;
    receiptId: string;
  }>;
}>;

export type ConstitutionArchiveRecoveryErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'LOCKED_OUT'
  | 'INVALID_REQUEST'
  | 'OPERATION_NOT_FOUND'
  | 'OPERATION_ABANDONED'
  | 'OPERATION_AUTHORITY_FULL'
  | 'ROLLED_BACK'
  | 'ARCHIVE_NOT_FOUND'
  | 'ARCHIVE_RETIRED'
  | 'STALE_ARCHIVE_REVISION'
  | 'STALE_TARGET_REVISION'
  | 'ARCHIVE_TARGET_MISMATCH'
  | 'CONFLICT'
  | 'INTEGRITY_FAILURE'
  | 'UNSAFE_FILESYSTEM'
  | 'NATIVE_FAILURE';

export type ConstitutionArchiveRestoreFailure = Readonly<{
  success: false;
  error: Readonly<{
    code: ConstitutionArchiveRecoveryErrorCode;
    message: string;
    retryable: boolean;
    operationId: string | null;
  }>;
}>;

export type ConstitutionArchiveRestoreResult = ConstitutionArchiveRestoreSuccess | ConstitutionArchiveRestoreFailure;
export type ConstitutionArchiveInventoryResult =
  | ConstitutionArchiveInventorySuccess
  | ConstitutionArchiveRestoreFailure;

export const CONSTITUTION_CLASSIC_RECOVERY_DTO_CONTRACT = 'wayland-constitution-classic-recovery-dto/1.0' as const;

export type ConstitutionClassicRecoveryState =
  | 'no-change'
  | 'awaiting-decision'
  | 'applying'
  | 'partial'
  | 'committed'
  | 'conflicted'
  | 'rescued'
  | 'discarded';

export type ConstitutionClassicRecoveryAction = 'promote' | 'keep-v2' | 'discard' | 'resume';
export type ConstitutionClassicRecoveryOperation = 'create' | 'replace' | 'delete';
export type ConstitutionClassicRecoveryItemState = 'pending' | 'committed' | 'conflicted';
export type ConstitutionClassicRecoveryConflictCode =
  | 'STALE_DESTINATION'
  | 'UNSUPPORTED_CHANGE'
  | 'INTEGRITY_FAILURE'
  | 'NATIVE_FAILURE';

export type ConstitutionClassicRecoveryItem = Readonly<{
  objectId: string;
  operation: ConstitutionClassicRecoveryOperation;
  state: ConstitutionClassicRecoveryItemState;
  resultRevision: string | null;
  receiptId: string | null;
  conflictCode: ConstitutionClassicRecoveryConflictCode | null;
}>;

export type ConstitutionClassicRecoveryRescue = Readonly<{
  rescueId: `sha256:${string}`;
  sha256: `sha256:${string}`;
  bytes: number;
  createdAt: string;
}>;

export type ConstitutionClassicRecoveryMetadataSuccess = Readonly<{
  success: true;
  data: Readonly<{
    contract: typeof CONSTITUTION_CLASSIC_RECOVERY_DTO_CONTRACT;
    recoveryRevision: string;
    projectionReceiptSha256: `sha256:${string}`;
    promotionId: string | null;
    journalHeadSha256: `sha256:${string}` | null;
    state: ConstitutionClassicRecoveryState;
    items: readonly ConstitutionClassicRecoveryItem[];
    rescue: ConstitutionClassicRecoveryRescue | null;
    allowedActions: readonly ConstitutionClassicRecoveryAction[];
    discardChallenge: string | null;
  }>;
}>;

export type ConstitutionClassicRecoveryDecision =
  | Readonly<{ kind: 'promote' }>
  | Readonly<{ kind: 'keep-v2' }>
  | Readonly<{
      kind: 'discard';
      confirmedObjectIds: readonly string[];
      confirmationText: string;
    }>;

export type ConstitutionClassicRecoveryDecisionRequest = Readonly<{
  operationId: string;
  projectionReceiptSha256: `sha256:${string}`;
  expectedRecoveryRevision: string;
  password: string;
  decision: ConstitutionClassicRecoveryDecision;
}>;

export type ConstitutionClassicRecoveryResumeRequest = Readonly<{
  operationId: string;
  promotionId: string;
  projectionReceiptSha256: `sha256:${string}`;
  expectedRecoveryRevision: string;
  expectedJournalHeadSha256: `sha256:${string}`;
  password: string;
}>;

export type ConstitutionClassicRecoveryMutationSuccess = Readonly<{
  success: true;
  data: Readonly<{
    status: ConstitutionClassicRecoveryState;
    operationId: string;
    recoveryRevision: string;
    promotionId: string | null;
    journalHeadSha256: `sha256:${string}` | null;
    receiptId: string;
    items: readonly ConstitutionClassicRecoveryItem[];
    rescue: ConstitutionClassicRecoveryRescue | null;
  }>;
}>;

export type ConstitutionClassicRecoveryErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'LOCKED_OUT'
  | 'INVALID_REQUEST'
  | 'STALE_RECOVERY_REVISION'
  | 'STALE_JOURNAL_HEAD'
  | 'CONFLICT'
  | 'OPERATION_NOT_FOUND'
  | 'OPERATION_ID_CONFLICT'
  | 'ROLLED_BACK'
  | 'RECOVERY_KEY_UNAVAILABLE'
  | 'OPERATION_AUTHORITY_FULL'
  | 'INTEGRITY_FAILURE'
  | 'UNSUPPORTED_CHANGE'
  | 'NATIVE_FAILURE';

export type ConstitutionClassicRecoveryFailure = Readonly<{
  success: false;
  error: Readonly<{
    code: ConstitutionClassicRecoveryErrorCode;
    message: string;
    retryable: boolean;
    operationId: string | null;
  }>;
}>;

export type ConstitutionClassicRecoveryMetadataResult =
  | ConstitutionClassicRecoveryMetadataSuccess
  | ConstitutionClassicRecoveryFailure;
export type ConstitutionClassicRecoveryMutationResult =
  | ConstitutionClassicRecoveryMutationSuccess
  | ConstitutionClassicRecoveryFailure;

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const RFC3339_MILLIS_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_REVISION_SCALARS = 4096;
const MAX_SOURCE_NAME_SCALARS = 255;
const MAX_SPECIALIST_ID_SCALARS = 255;
const MAX_ARCHIVES = 4096;
const MAX_ARCHIVE_BYTES = 256 * 1024;
const MAX_ERROR_MESSAGE_SCALARS = 1024;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
const MAX_CLASSIC_ITEMS = 4096;
const MAX_CLASSIC_OBJECT_ID_SCALARS = 1024;
const MAX_CLASSIC_RESCUE_BYTES = 16 * 1024 * 1024;
const MAX_CLASSIC_CHALLENGE_SCALARS = 1024;
const MAX_PASSWORD_BYTES = 16 * 1024;
const ARCHIVE_ERROR_CODES = new Set<ConstitutionArchiveRecoveryErrorCode>([
  'AUTH_REQUIRED',
  'AUTH_FAILED',
  'LOCKED_OUT',
  'INVALID_REQUEST',
  'OPERATION_NOT_FOUND',
  'OPERATION_ABANDONED',
  'OPERATION_AUTHORITY_FULL',
  'ROLLED_BACK',
  'ARCHIVE_NOT_FOUND',
  'ARCHIVE_RETIRED',
  'STALE_ARCHIVE_REVISION',
  'STALE_TARGET_REVISION',
  'ARCHIVE_TARGET_MISMATCH',
  'CONFLICT',
  'INTEGRITY_FAILURE',
  'UNSAFE_FILESYSTEM',
  'NATIVE_FAILURE',
]);
const CLASSIC_ERROR_CODES = new Set<ConstitutionClassicRecoveryErrorCode>([
  'AUTH_REQUIRED',
  'AUTH_FAILED',
  'LOCKED_OUT',
  'INVALID_REQUEST',
  'STALE_RECOVERY_REVISION',
  'STALE_JOURNAL_HEAD',
  'CONFLICT',
  'OPERATION_NOT_FOUND',
  'OPERATION_ID_CONFLICT',
  'ROLLED_BACK',
  'RECOVERY_KEY_UNAVAILABLE',
  'OPERATION_AUTHORITY_FULL',
  'INTEGRITY_FAILURE',
  'UNSUPPORTED_CHANGE',
  'NATIVE_FAILURE',
]);
const CLASSIC_STATE_ACTIONS: Readonly<
  Record<ConstitutionClassicRecoveryState, readonly ConstitutionClassicRecoveryAction[]>
> = {
  'no-change': [],
  'awaiting-decision': ['promote', 'keep-v2', 'discard'],
  applying: [],
  partial: ['keep-v2', 'resume'],
  committed: [],
  conflicted: ['keep-v2'],
  rescued: [],
  discarded: [],
};

function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).toSorted();
  const expected = [...keys].toSorted();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isWellFormedUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function boundedNfcString(value: unknown, maxScalars: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    isWellFormedUnicode(value) &&
    value === value.normalize('NFC') &&
    Array.from(value).length <= maxScalars &&
    !/\p{Cc}/u.test(value)
  );
}

export function parseConstitutionArchiveRestoreRequest(value: unknown): ConstitutionArchiveRestoreRequest | null {
  if (
    !exactObject(value, ['operationId', 'archiveId', 'expectedArchiveRevision', 'password', 'expectedRevision']) ||
    !UUID_V4_PATTERN.test(String(value.operationId)) ||
    !UUID_V4_PATTERN.test(String(value.archiveId)) ||
    !boundedNfcString(value.expectedArchiveRevision, MAX_REVISION_SCALARS) ||
    typeof value.password !== 'string' ||
    value.password.length === 0 ||
    new TextEncoder().encode(value.password).byteLength > 16 * 1024 ||
    !boundedNfcString(value.expectedRevision, MAX_REVISION_SCALARS)
  ) {
    return null;
  }
  return value as ConstitutionArchiveRestoreRequest;
}

export function validateConstitutionArchiveRecoverySummary(
  value: unknown
): value is ConstitutionArchiveRecoverySummary {
  if (
    !exactObject(value, [
      'archiveId',
      'archivedAt',
      'targetKind',
      'specialistId',
      'sourceName',
      'bytes',
      'targetRevision',
    ]) ||
    !UUID_V4_PATTERN.test(String(value.archiveId)) ||
    typeof value.archivedAt !== 'string' ||
    !RFC3339_MILLIS_PATTERN.test(value.archivedAt) ||
    (value.targetKind !== 'constitution' && value.targetKind !== 'specialist') ||
    !boundedNfcString(value.sourceName, MAX_SOURCE_NAME_SCALARS) ||
    !Number.isSafeInteger(value.bytes) ||
    Number(value.bytes) < 0 ||
    Number(value.bytes) > MAX_ARCHIVE_BYTES ||
    !boundedNfcString(value.targetRevision, MAX_REVISION_SCALARS)
  ) {
    return false;
  }
  return value.targetKind === 'constitution'
    ? value.specialistId === null
    : boundedNfcString(value.specialistId, MAX_SPECIALIST_ID_SCALARS);
}

export function validateConstitutionArchiveInventory(
  archives: readonly ConstitutionArchiveRecoverySummary[]
): readonly ConstitutionArchiveRecoverySummary[] {
  if (archives.length > MAX_ARCHIVES || !archives.every(validateConstitutionArchiveRecoverySummary)) {
    throw new Error('CONSTITUTION_ARCHIVE_INVENTORY_INVALID');
  }
  const ids = new Set<string>();
  for (let index = 0; index < archives.length; index += 1) {
    const current = archives[index]!;
    if (ids.has(current.archiveId)) throw new Error('CONSTITUTION_ARCHIVE_INVENTORY_INVALID');
    ids.add(current.archiveId);
    const previous = archives[index - 1];
    if (
      previous &&
      (previous.archivedAt < current.archivedAt ||
        (previous.archivedAt === current.archivedAt && previous.archiveId > current.archiveId))
    ) {
      throw new Error('CONSTITUTION_ARCHIVE_INVENTORY_INVALID');
    }
  }
  return archives;
}

export function constitutionArchiveRestoreFailure(
  code: ConstitutionArchiveRecoveryErrorCode,
  message: string,
  operationId: string | null
): ConstitutionArchiveRestoreFailure {
  return {
    success: false,
    error: {
      code,
      message,
      retryable: code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'LOCKED_OUT',
      operationId,
    },
  };
}

export function syntacticallyValidConstitutionRestoreOperationId(value: unknown): string | null {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value) ? value : null;
}

function validateArchiveFailure(value: unknown): value is ConstitutionArchiveRestoreFailure {
  if (!exactObject(value, ['success', 'error']) || value.success !== false) return false;
  const error = value.error;
  if (
    !exactObject(error, ['code', 'message', 'retryable', 'operationId']) ||
    typeof error.code !== 'string' ||
    !ARCHIVE_ERROR_CODES.has(error.code as ConstitutionArchiveRecoveryErrorCode) ||
    !boundedNfcString(error.message, MAX_ERROR_MESSAGE_SCALARS) ||
    typeof error.retryable !== 'boolean' ||
    (error.operationId !== null && (typeof error.operationId !== 'string' || !UUID_V4_PATTERN.test(error.operationId)))
  ) {
    return false;
  }
  const retryable = error.code === 'AUTH_REQUIRED' || error.code === 'AUTH_FAILED' || error.code === 'LOCKED_OUT';
  return error.retryable === retryable;
}

export function parseConstitutionArchiveInventoryResult(value: unknown): ConstitutionArchiveInventoryResult | null {
  if (validateArchiveFailure(value)) return value;
  if (!exactObject(value, ['success', 'data']) || value.success !== true) return null;
  const data = value.data;
  if (
    !exactObject(data, ['contract', 'archives']) ||
    data.contract !== CONSTITUTION_ARCHIVE_RECOVERY_DTO_CONTRACT ||
    !Array.isArray(data.archives)
  ) {
    return null;
  }
  try {
    validateConstitutionArchiveInventory(data.archives as ConstitutionArchiveRecoverySummary[]);
  } catch {
    return null;
  }
  return value as ConstitutionArchiveInventorySuccess;
}

export function parseConstitutionArchiveRestoreResult(value: unknown): ConstitutionArchiveRestoreResult | null {
  if (validateArchiveFailure(value)) return value;
  if (!exactObject(value, ['success', 'data']) || value.success !== true) return null;
  const data = value.data;
  if (
    !exactObject(data, ['status', 'operationId', 'revision', 'receiptId']) ||
    data.status !== 'committed' ||
    typeof data.operationId !== 'string' ||
    !UUID_V4_PATTERN.test(data.operationId) ||
    !boundedNfcString(data.revision, MAX_REVISION_SCALARS) ||
    !boundedNfcString(data.receiptId, MAX_REVISION_SCALARS)
  ) {
    return null;
  }
  return value as ConstitutionArchiveRestoreSuccess;
}

function canonicalStringList(values: readonly string[]): boolean {
  const seen = new Set<string>();
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]!;
    if (!boundedNfcString(value, MAX_CLASSIC_OBJECT_ID_SCALARS) || seen.has(value)) return false;
    if (index > 0 && values[index - 1]! >= value) return false;
    seen.add(value);
  }
  return true;
}

function validPassword(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    isWellFormedUnicode(value) &&
    new TextEncoder().encode(value).byteLength <= MAX_PASSWORD_BYTES
  );
}

function validateClassicRecoveryItem(value: unknown): value is ConstitutionClassicRecoveryItem {
  if (
    !exactObject(value, ['objectId', 'operation', 'state', 'resultRevision', 'receiptId', 'conflictCode']) ||
    !boundedNfcString(value.objectId, MAX_CLASSIC_OBJECT_ID_SCALARS) ||
    (value.operation !== 'create' && value.operation !== 'replace' && value.operation !== 'delete') ||
    (value.state !== 'pending' && value.state !== 'committed' && value.state !== 'conflicted')
  ) {
    return false;
  }
  if (value.state === 'pending') {
    return value.resultRevision === null && value.receiptId === null && value.conflictCode === null;
  }
  if (value.state === 'committed') {
    return (
      boundedNfcString(value.resultRevision, MAX_REVISION_SCALARS) &&
      boundedNfcString(value.receiptId, MAX_REVISION_SCALARS) &&
      value.conflictCode === null
    );
  }
  return (
    value.resultRevision === null &&
    value.receiptId === null &&
    (value.conflictCode === 'STALE_DESTINATION' ||
      value.conflictCode === 'UNSUPPORTED_CHANGE' ||
      value.conflictCode === 'INTEGRITY_FAILURE' ||
      value.conflictCode === 'NATIVE_FAILURE')
  );
}

function validateClassicRecoveryItems(value: unknown): value is readonly ConstitutionClassicRecoveryItem[] {
  if (!Array.isArray(value) || value.length > MAX_CLASSIC_ITEMS || !value.every(validateClassicRecoveryItem)) {
    return false;
  }
  return canonicalStringList(value.map((item) => item.objectId));
}

function validateClassicRecoveryRescue(value: unknown): value is ConstitutionClassicRecoveryRescue {
  return (
    exactObject(value, ['rescueId', 'sha256', 'bytes', 'createdAt']) &&
    typeof value.rescueId === 'string' &&
    SHA256_PATTERN.test(value.rescueId) &&
    typeof value.sha256 === 'string' &&
    SHA256_PATTERN.test(value.sha256) &&
    Number.isSafeInteger(value.bytes) &&
    Number(value.bytes) >= 1 &&
    Number(value.bytes) <= MAX_CLASSIC_RESCUE_BYTES &&
    typeof value.createdAt === 'string' &&
    RFC3339_MILLIS_PATTERN.test(value.createdAt)
  );
}

function validClassicStateShape(input: {
  state: ConstitutionClassicRecoveryState;
  items: readonly ConstitutionClassicRecoveryItem[];
  rescue: ConstitutionClassicRecoveryRescue | null;
  promotionId: string | null;
  journalHeadSha256: string | null;
}): boolean {
  const prepared = input.state !== 'no-change' && input.state !== 'awaiting-decision';
  if (
    prepared !== (input.promotionId !== null) ||
    prepared !== (input.journalHeadSha256 !== null) ||
    (input.promotionId !== null && !UUID_V4_PATTERN.test(input.promotionId)) ||
    (input.journalHeadSha256 !== null && !SHA256_PATTERN.test(input.journalHeadSha256))
  ) {
    return false;
  }

  if (input.state === 'no-change') {
    return input.items.length === 0 && input.rescue === null;
  }
  if (input.items.length === 0) return false;
  if (input.state === 'awaiting-decision') {
    return input.rescue === null && input.items.every((item) => item.state === 'pending');
  }
  if (input.state === 'applying') {
    return input.rescue !== null && input.items.every((item) => item.state !== 'conflicted');
  }
  if (input.state === 'partial') {
    return (
      input.rescue !== null &&
      input.items.some((item) => item.state === 'committed') &&
      input.items.some((item) => item.state !== 'committed')
    );
  }
  if (input.state === 'committed') {
    return input.rescue === null && input.items.every((item) => item.state === 'committed');
  }
  if (input.state === 'conflicted') {
    return input.rescue !== null && input.items.some((item) => item.state === 'conflicted');
  }
  if (input.state === 'rescued') return input.rescue !== null;
  return input.rescue === null && input.items.every((item) => item.state !== 'committed');
}

function validateClassicFailure(value: unknown): value is ConstitutionClassicRecoveryFailure {
  if (!exactObject(value, ['success', 'error']) || value.success !== false) return false;
  const error = value.error;
  if (
    !exactObject(error, ['code', 'message', 'retryable', 'operationId']) ||
    typeof error.code !== 'string' ||
    !CLASSIC_ERROR_CODES.has(error.code as ConstitutionClassicRecoveryErrorCode) ||
    !boundedNfcString(error.message, MAX_ERROR_MESSAGE_SCALARS) ||
    typeof error.retryable !== 'boolean' ||
    (error.operationId !== null && (typeof error.operationId !== 'string' || !UUID_V4_PATTERN.test(error.operationId)))
  ) {
    return false;
  }
  const retryable = error.code === 'AUTH_REQUIRED' || error.code === 'AUTH_FAILED' || error.code === 'LOCKED_OUT';
  return error.retryable === retryable;
}

export function constitutionClassicRecoveryFailure(
  code: ConstitutionClassicRecoveryErrorCode,
  message: string,
  operationId: string | null
): ConstitutionClassicRecoveryFailure {
  return {
    success: false,
    error: {
      code,
      message,
      retryable: code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'LOCKED_OUT',
      operationId,
    },
  };
}

function parseClassicDecision(value: unknown): ConstitutionClassicRecoveryDecision | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const kind = (value as Record<string, unknown>).kind;
  if (kind === 'promote' || kind === 'keep-v2') {
    return exactObject(value, ['kind']) ? (value as ConstitutionClassicRecoveryDecision) : null;
  }
  if (
    kind !== 'discard' ||
    !exactObject(value, ['kind', 'confirmedObjectIds', 'confirmationText']) ||
    !Array.isArray(value.confirmedObjectIds) ||
    value.confirmedObjectIds.length === 0 ||
    value.confirmedObjectIds.length > MAX_CLASSIC_ITEMS ||
    !canonicalStringList(value.confirmedObjectIds as string[]) ||
    !boundedNfcString(value.confirmationText, MAX_CLASSIC_CHALLENGE_SCALARS)
  ) {
    return null;
  }
  return value as ConstitutionClassicRecoveryDecision;
}

export function parseConstitutionClassicRecoveryDecisionRequest(
  value: unknown
): ConstitutionClassicRecoveryDecisionRequest | null {
  if (
    !exactObject(value, [
      'operationId',
      'projectionReceiptSha256',
      'expectedRecoveryRevision',
      'password',
      'decision',
    ]) ||
    !UUID_V4_PATTERN.test(String(value.operationId)) ||
    typeof value.projectionReceiptSha256 !== 'string' ||
    !SHA256_PATTERN.test(value.projectionReceiptSha256) ||
    !boundedNfcString(value.expectedRecoveryRevision, MAX_REVISION_SCALARS) ||
    !validPassword(value.password) ||
    parseClassicDecision(value.decision) === null
  ) {
    return null;
  }
  return value as ConstitutionClassicRecoveryDecisionRequest;
}

export function parseConstitutionClassicRecoveryResumeRequest(
  value: unknown
): ConstitutionClassicRecoveryResumeRequest | null {
  if (
    !exactObject(value, [
      'operationId',
      'promotionId',
      'projectionReceiptSha256',
      'expectedRecoveryRevision',
      'expectedJournalHeadSha256',
      'password',
    ]) ||
    !UUID_V4_PATTERN.test(String(value.operationId)) ||
    !UUID_V4_PATTERN.test(String(value.promotionId)) ||
    typeof value.projectionReceiptSha256 !== 'string' ||
    !SHA256_PATTERN.test(value.projectionReceiptSha256) ||
    !boundedNfcString(value.expectedRecoveryRevision, MAX_REVISION_SCALARS) ||
    typeof value.expectedJournalHeadSha256 !== 'string' ||
    !SHA256_PATTERN.test(value.expectedJournalHeadSha256) ||
    !validPassword(value.password)
  ) {
    return null;
  }
  return value as ConstitutionClassicRecoveryResumeRequest;
}

export function parseConstitutionClassicRecoveryMetadataResult(
  value: unknown
): ConstitutionClassicRecoveryMetadataResult | null {
  if (validateClassicFailure(value)) return value;
  if (!exactObject(value, ['success', 'data']) || value.success !== true) return null;
  const data = value.data;
  if (
    !exactObject(data, [
      'contract',
      'recoveryRevision',
      'projectionReceiptSha256',
      'promotionId',
      'journalHeadSha256',
      'state',
      'items',
      'rescue',
      'allowedActions',
      'discardChallenge',
    ]) ||
    data.contract !== CONSTITUTION_CLASSIC_RECOVERY_DTO_CONTRACT ||
    !boundedNfcString(data.recoveryRevision, MAX_REVISION_SCALARS) ||
    typeof data.projectionReceiptSha256 !== 'string' ||
    !SHA256_PATTERN.test(data.projectionReceiptSha256) ||
    typeof data.state !== 'string' ||
    !(data.state in CLASSIC_STATE_ACTIONS) ||
    (data.promotionId !== null && typeof data.promotionId !== 'string') ||
    (data.journalHeadSha256 !== null && typeof data.journalHeadSha256 !== 'string') ||
    !validateClassicRecoveryItems(data.items) ||
    (data.rescue !== null && !validateClassicRecoveryRescue(data.rescue)) ||
    !Array.isArray(data.allowedActions)
  ) {
    return null;
  }
  const state = data.state as ConstitutionClassicRecoveryState;
  const rescue = data.rescue as ConstitutionClassicRecoveryRescue | null;
  const expectedActions = CLASSIC_STATE_ACTIONS[state];
  if (
    data.allowedActions.length !== expectedActions.length ||
    data.allowedActions.some((action, index) => action !== expectedActions[index]) ||
    !validClassicStateShape({
      state,
      items: data.items,
      rescue,
      promotionId: typeof data.promotionId === 'string' ? data.promotionId : null,
      journalHeadSha256: typeof data.journalHeadSha256 === 'string' ? data.journalHeadSha256 : null,
    }) ||
    (state === 'awaiting-decision'
      ? !boundedNfcString(data.discardChallenge, MAX_CLASSIC_CHALLENGE_SCALARS)
      : data.discardChallenge !== null)
  ) {
    return null;
  }
  return value as ConstitutionClassicRecoveryMetadataSuccess;
}

export function parseConstitutionClassicRecoveryMutationResult(
  value: unknown
): ConstitutionClassicRecoveryMutationResult | null {
  if (validateClassicFailure(value)) return value;
  if (!exactObject(value, ['success', 'data']) || value.success !== true) return null;
  const data = value.data;
  if (
    !exactObject(data, [
      'status',
      'operationId',
      'recoveryRevision',
      'promotionId',
      'journalHeadSha256',
      'receiptId',
      'items',
      'rescue',
    ]) ||
    typeof data.status !== 'string' ||
    !(data.status in CLASSIC_STATE_ACTIONS) ||
    !UUID_V4_PATTERN.test(String(data.operationId)) ||
    !boundedNfcString(data.recoveryRevision, MAX_REVISION_SCALARS) ||
    !boundedNfcString(data.receiptId, MAX_REVISION_SCALARS) ||
    (data.promotionId !== null && typeof data.promotionId !== 'string') ||
    (data.journalHeadSha256 !== null && typeof data.journalHeadSha256 !== 'string') ||
    !validateClassicRecoveryItems(data.items) ||
    (data.rescue !== null && !validateClassicRecoveryRescue(data.rescue))
  ) {
    return null;
  }
  const status = data.status as ConstitutionClassicRecoveryState;
  const rescue = data.rescue as ConstitutionClassicRecoveryRescue | null;
  if (
    !validClassicStateShape({
      state: status,
      items: data.items,
      rescue,
      promotionId: typeof data.promotionId === 'string' ? data.promotionId : null,
      journalHeadSha256: typeof data.journalHeadSha256 === 'string' ? data.journalHeadSha256 : null,
    })
  ) {
    return null;
  }
  return value as ConstitutionClassicRecoveryMutationSuccess;
}
