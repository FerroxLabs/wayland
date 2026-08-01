/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import type { Dirent } from 'node:fs';
import { lstat, mkdir, mkdtemp, open, readdir, realpath, rename, rm, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ConstitutionMutationResult, ConstitutionReadResult } from '../constitution/constitutionFsService';
import { canonicalizeRecoveryJson, parseCanonicalRecoveryJson } from './externalRecoveryCrypto';
import { syncDirectory as syncDirectoryDurably } from '@process/utils/durabilitySync';

const AUTHORITY_CONTRACT = 'wayland-constitution-classic-projection-authority/1.0' as const;
const DELTA_CONTRACT = 'wayland-constitution-classic-delta/1.0' as const;
const JOURNAL_CONTRACT = 'wayland-constitution-classic-promotion/1.0' as const;
const JOURNAL_HEAD_CONTRACT = 'wayland-constitution-classic-promotion-head/1.0' as const;
const JOURNAL_CLAIM_CONTRACT = 'wayland-constitution-classic-promotion-claim/1.0' as const;
const RESCUE_CONTRACT = 'wayland-constitution-classic-rescue/1.0' as const;
const RECONCILIATION_CONTRACT = 'wayland-constitution-classic-reconciliation/1.0' as const;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SPECIALIST_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_OBJECT_BYTES = 1024 * 1024;

export type ClassicProjectionObject = Readonly<{
  objectId: string;
  classicPath: string;
  present: true;
  size: number;
  sha256: `sha256:${string}`;
  contentBase64: string;
}>;

export type ClassicProjectionAuthorityRecord = Readonly<{
  contract: typeof AUTHORITY_CONTRACT;
  authentication: 'os-vault' | 'test-only';
  preparationId: string;
  sourceAppVersion: string;
  candidateAppVersion: string;
  producerCommit: string;
  candidateCommit: string;
  sourceSnapshotDigest: `sha256:${string}`;
  sourceRevisionAuthorityEnvelopeSha256: string | null;
  sourceRevisionAuthorityEnvelopeBase64: string | null;
  classicRoot: string;
  classicRootIdentity: Readonly<{
    canonicalDestination: string;
    device: string;
    inode: string;
  }>;
  createdAt: string;
  recoveryAuthorityRoot: string;
  objects: readonly ClassicProjectionObject[];
}>;

export type ClassicProjectionFile = Readonly<{
  restorePath: string;
  classicPath: string;
  sha256: string;
  size: number;
  contentBase64: string;
}>;

export type ClassicAuthorityEnvelopeCodec = Readonly<{
  securityClass: 'external-recovery-authority' | 'test-only';
  sealFile: (sourcePath: string, destinationPath: string) => Promise<void>;
  unsealFile: (sourcePath: string, destinationPath: string) => Promise<void>;
}>;

export type PublishedClassicProjectionAuthority = Readonly<{
  authorityEnvelopePath: string;
  authorityEnvelopeSha256: `sha256:${string}`;
  recoveryAuthorityRoot: string;
  record: ClassicProjectionAuthorityRecord;
}>;

export type ClassicConstitutionPromotionService = Readonly<{
  readConstitution: () => ConstitutionReadResult;
  writeConstitution: (content: string, expectedRevision: string, requestId: string) => ConstitutionMutationResult;
  deleteConstitution: (expectedRevision: string, requestId: string) => ConstitutionMutationResult;
  readSpecialist: (id: string) => ConstitutionReadResult;
  writeSpecialist: (
    id: string,
    content: string,
    expectedRevision: string,
    requestId: string
  ) => ConstitutionMutationResult;
  deleteSpecialist: (id: string, expectedRevision: string, requestId: string) => ConstitutionMutationResult;
}>;

export type ClassicConstitutionDeltaItem = Readonly<{
  objectId: string;
  operation: 'create' | 'replace' | 'delete';
  baselinePresent: boolean;
  baselineSha256: string | null;
  finalPresent: boolean;
  finalSha256: string | null;
  finalSize: number;
  contentBase64: string | null;
}>;

export type ClassicConstitutionDelta = Readonly<{
  contract: typeof DELTA_CONTRACT;
  projectionAuthoritySha256: `sha256:${string}`;
  sourceSnapshotDigest: `sha256:${string}`;
  items: readonly ClassicConstitutionDeltaItem[];
  digest: `sha256:${string}`;
}>;

export type ClassicPromotionItem = Readonly<{
  objectId: string;
  operation: ClassicConstitutionDeltaItem['operation'];
  requestId: string;
  requestFactsSha256: `sha256:${string}`;
  expectedRevision: string;
  contentBase64: string | null;
  state: 'pending' | 'committed' | 'conflicted';
  resultRevision: string | null;
  receiptId: string | null;
  serviceRequestFingerprint: string | null;
  conflictCode: ClassicConflictCode | null;
}>;

export type ClassicConflictCode = 'STALE_DESTINATION' | 'UNSUPPORTED_CHANGE' | 'INTEGRITY_FAILURE' | 'NATIVE_FAILURE';

export type ClassicPromotionJournal = Readonly<{
  contract: typeof JOURNAL_CONTRACT;
  promotionId: string;
  promotionFingerprint: `sha256:${string}`;
  projectionAuthorityPath: string;
  projectionAuthoritySha256: `sha256:${string}`;
  destinationAuthority: string;
  delta: ClassicConstitutionDelta;
  state: 'prepared' | 'applying' | 'partial' | 'committed' | 'conflicted' | 'rescued' | 'discarded';
  sequence: number;
  previousStateSha256: `sha256:${string}` | null;
  items: readonly ClassicPromotionItem[];
  rescueEnvelopePath: string | null;
  updatedAt: string;
}>;

type ClassicPromotionJournalHead = Readonly<{
  contract: typeof JOURNAL_HEAD_CONTRACT;
  promotionId: string;
  sequence: number;
  eventFile: string;
  eventSha256: `sha256:${string}`;
  previousHeadSha256: `sha256:${string}` | null;
}>;

type JournalWriterLock = Readonly<{
  pid: number;
  hostname: string;
  bootTimeMs: number;
  nonce: string;
}>;

type JournalPredecessorClaim = Readonly<{
  contract: typeof JOURNAL_CLAIM_CONTRACT;
  promotionId: string;
  predecessorHeadSha256: `sha256:${string}` | null;
  successorSequence: number;
  successorEventFile: string;
  successorEventSha256: `sha256:${string}`;
}>;

export type ClassicPromotionDecision =
  | Readonly<{ kind: 'promote' }>
  | Readonly<{ kind: 'keep-v2' }>
  | Readonly<{ kind: 'confirmed-discard'; confirmedObjectIds: readonly string[] }>;

export type ClassicPromotionResult = Readonly<{
  state: 'no-change' | 'partial' | 'committed' | 'conflicted' | 'rescued' | 'discarded' | 'reconciliation-required';
  promotionId: string | null;
  journalRoot: string | null;
  rescueEnvelopePath: string | null;
  delta: ClassicConstitutionDelta;
}>;

export type ClassicRecoveryInspection = Readonly<{
  projectionAuthoritySha256: `sha256:${string}`;
  recoveryAuthorityRoot: string;
  delta: ClassicConstitutionDelta;
  promotionId: string | null;
  journalRoot: string | null;
  journalHeadSha256: `sha256:${string}` | null;
  journal: ClassicPromotionJournal | null;
  rescue: Readonly<{
    rescueId: `sha256:${string}`;
    envelopeSha256: `sha256:${string}`;
    bytes: number;
    createdAt: string;
  }> | null;
}>;

type PromotionDependencies = Readonly<{
  codec?: ClassicAuthorityEnvelopeCodec;
  now?: () => Date;
  createId?: () => string;
  acquireQuiescence: () => Promise<() => Promise<void> | void>;
  afterItemDispatch?: (item: Readonly<{ objectId: string; requestId: string }>) => Promise<void> | void;
  afterJournalEventSync?: (event: Readonly<{ sequence: number; eventFile: string }>) => Promise<void> | void;
}>;

function sha256(bytes: Buffer | string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function canonicalJson(value: unknown): string {
  return canonicalizeRecoveryJson(value).toString('utf8');
}

function parseCanonicalJson<T>(bytes: Buffer): T {
  return parseCanonicalRecoveryJson(bytes) as T;
}

function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} contains missing or unknown fields.`);
  }
  return record;
}

function compareCanonicalText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function requireNonEmptyText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.normalize('NFC') !== value || value.includes('\0')) {
    throw new Error(`${label} is not canonical text.`);
  }
  return value;
}

function requireCanonicalTimestamp(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new Error(`${label} is not a canonical UTC timestamp.`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${label} is not a canonical UTC timestamp.`);
  }
  return value;
}

function assertExactProjectionShape(value: unknown): ClassicProjectionAuthorityRecord {
  const record = exactRecord(
    value,
    [
      'contract',
      'authentication',
      'preparationId',
      'sourceAppVersion',
      'candidateAppVersion',
      'producerCommit',
      'candidateCommit',
      'sourceSnapshotDigest',
      'sourceRevisionAuthorityEnvelopeSha256',
      'sourceRevisionAuthorityEnvelopeBase64',
      'classicRoot',
      'classicRootIdentity',
      'createdAt',
      'recoveryAuthorityRoot',
      'objects',
    ],
    'Classic projection authority'
  );
  exactRecord(
    record.classicRootIdentity,
    ['canonicalDestination', 'device', 'inode'],
    'Classic projection root identity'
  );
  if (!Array.isArray(record.objects)) throw new Error('Classic projection objects must be an array.');
  for (const [index, object] of record.objects.entries()) {
    const candidate = exactRecord(
      object,
      ['objectId', 'classicPath', 'present', 'size', 'sha256', 'contentBase64'],
      `Classic projection object ${index}`
    );
    if (
      candidate.present !== true ||
      !Number.isSafeInteger(candidate.size) ||
      (candidate.size as number) < 0 ||
      (candidate.size as number) > MAX_OBJECT_BYTES ||
      typeof candidate.contentBase64 !== 'string' ||
      typeof candidate.sha256 !== 'string' ||
      !SHA256_PATTERN.test(candidate.sha256)
    ) {
      throw new Error(`Classic projection object ${index} is malformed.`);
    }
    requireNonEmptyText(candidate.objectId, `Classic projection object ${index} ID`);
    requireNonEmptyText(candidate.classicPath, `Classic projection object ${index} path`);
    decodeCanonicalBase64(candidate.contentBase64, candidate.size as number, candidate.sha256);
  }
  if (
    record.contract !== AUTHORITY_CONTRACT ||
    (record.authentication !== 'os-vault' && record.authentication !== 'test-only') ||
    typeof record.preparationId !== 'string' ||
    !/^[A-Za-z0-9._-]+$/.test(record.preparationId) ||
    typeof record.sourceSnapshotDigest !== 'string' ||
    !SHA256_PATTERN.test(record.sourceSnapshotDigest) ||
    (record.sourceRevisionAuthorityEnvelopeSha256 !== null &&
      (typeof record.sourceRevisionAuthorityEnvelopeSha256 !== 'string' ||
        !SHA256_PATTERN.test(record.sourceRevisionAuthorityEnvelopeSha256))) ||
    (record.sourceRevisionAuthorityEnvelopeBase64 !== null &&
      typeof record.sourceRevisionAuthorityEnvelopeBase64 !== 'string')
  ) {
    throw new Error('Classic projection authority fields are malformed.');
  }
  for (const [field, value] of Object.entries({
    sourceAppVersion: record.sourceAppVersion,
    candidateAppVersion: record.candidateAppVersion,
    producerCommit: record.producerCommit,
    candidateCommit: record.candidateCommit,
    classicRoot: record.classicRoot,
    recoveryAuthorityRoot: record.recoveryAuthorityRoot,
  })) {
    requireNonEmptyText(value, `Classic projection ${field}`);
  }
  requireCanonicalTimestamp(record.createdAt, 'Classic projection creation time');
  return record as unknown as ClassicProjectionAuthorityRecord;
}

function assertExactJournalShape(value: unknown): ClassicPromotionJournal {
  const journal = exactRecord(
    value,
    [
      'contract',
      'promotionId',
      'promotionFingerprint',
      'projectionAuthorityPath',
      'projectionAuthoritySha256',
      'destinationAuthority',
      'delta',
      'state',
      'sequence',
      'previousStateSha256',
      'items',
      'rescueEnvelopePath',
      'updatedAt',
    ],
    'Classic promotion journal'
  );
  const delta = exactRecord(
    journal.delta,
    ['contract', 'projectionAuthoritySha256', 'sourceSnapshotDigest', 'items', 'digest'],
    'Classic promotion delta'
  );
  if (!Array.isArray(delta.items)) throw new Error('Classic promotion delta items must be an array.');
  for (const [index, item] of delta.items.entries()) {
    const candidate = exactRecord(
      item,
      [
        'objectId',
        'operation',
        'baselinePresent',
        'baselineSha256',
        'finalPresent',
        'finalSha256',
        'finalSize',
        'contentBase64',
      ],
      `Classic promotion delta item ${index}`
    );
    if (
      (candidate.operation !== 'create' && candidate.operation !== 'replace' && candidate.operation !== 'delete') ||
      typeof candidate.baselinePresent !== 'boolean' ||
      typeof candidate.finalPresent !== 'boolean' ||
      !Number.isSafeInteger(candidate.finalSize) ||
      (candidate.finalSize as number) < 0 ||
      (candidate.finalSize as number) > MAX_OBJECT_BYTES ||
      (candidate.baselineSha256 !== null &&
        (typeof candidate.baselineSha256 !== 'string' || !SHA256_PATTERN.test(candidate.baselineSha256))) ||
      (candidate.finalSha256 !== null &&
        (typeof candidate.finalSha256 !== 'string' || !SHA256_PATTERN.test(candidate.finalSha256))) ||
      (candidate.contentBase64 !== null && typeof candidate.contentBase64 !== 'string')
    ) {
      throw new Error(`Classic promotion delta item ${index} is malformed.`);
    }
    requireNonEmptyText(candidate.objectId, `Classic promotion delta item ${index} ID`);
    const operationFactsValid =
      (candidate.operation === 'create' &&
        candidate.baselinePresent === false &&
        candidate.baselineSha256 === null &&
        candidate.finalPresent === true) ||
      (candidate.operation === 'replace' &&
        candidate.baselinePresent === true &&
        candidate.baselineSha256 !== null &&
        candidate.finalPresent === true) ||
      (candidate.operation === 'delete' &&
        candidate.baselinePresent === true &&
        candidate.baselineSha256 !== null &&
        candidate.finalPresent === false &&
        candidate.finalSha256 === null &&
        candidate.finalSize === 0 &&
        candidate.contentBase64 === null);
    if (!operationFactsValid) throw new Error(`Classic promotion delta item ${index} facts are inconsistent.`);
    if (candidate.finalPresent) {
      if (typeof candidate.finalSha256 !== 'string' || typeof candidate.contentBase64 !== 'string') {
        throw new Error(`Classic promotion delta item ${index} omits final content authority.`);
      }
      decodeCanonicalBase64(candidate.contentBase64, candidate.finalSize as number, candidate.finalSha256);
    }
  }
  if (!Array.isArray(journal.items)) throw new Error('Classic promotion journal items must be an array.');
  for (const [index, item] of journal.items.entries()) {
    const candidate = exactRecord(
      item,
      [
        'objectId',
        'operation',
        'requestId',
        'requestFactsSha256',
        'expectedRevision',
        'contentBase64',
        'state',
        'resultRevision',
        'receiptId',
        'serviceRequestFingerprint',
        'conflictCode',
      ],
      `Classic promotion journal item ${index}`
    );
    if (
      (candidate.operation !== 'create' && candidate.operation !== 'replace' && candidate.operation !== 'delete') ||
      typeof candidate.requestId !== 'string' ||
      !UUID_PATTERN.test(candidate.requestId) ||
      typeof candidate.requestFactsSha256 !== 'string' ||
      !SHA256_PATTERN.test(candidate.requestFactsSha256) ||
      typeof candidate.expectedRevision !== 'string' ||
      candidate.expectedRevision.length === 0 ||
      (candidate.contentBase64 !== null && typeof candidate.contentBase64 !== 'string') ||
      (candidate.state !== 'pending' && candidate.state !== 'committed' && candidate.state !== 'conflicted') ||
      (candidate.resultRevision !== null && typeof candidate.resultRevision !== 'string') ||
      (candidate.receiptId !== null && typeof candidate.receiptId !== 'string') ||
      (candidate.serviceRequestFingerprint !== null && typeof candidate.serviceRequestFingerprint !== 'string') ||
      (candidate.conflictCode !== null &&
        candidate.conflictCode !== 'STALE_DESTINATION' &&
        candidate.conflictCode !== 'UNSUPPORTED_CHANGE' &&
        candidate.conflictCode !== 'INTEGRITY_FAILURE' &&
        candidate.conflictCode !== 'NATIVE_FAILURE')
    ) {
      throw new Error(`Classic promotion journal item ${index} is malformed.`);
    }
    requireNonEmptyText(candidate.objectId, `Classic promotion journal item ${index} ID`);
    if (
      (candidate.state === 'pending' &&
        (candidate.resultRevision !== null ||
          candidate.receiptId !== null ||
          candidate.serviceRequestFingerprint !== null ||
          candidate.conflictCode !== null)) ||
      (candidate.state === 'committed' &&
        (typeof candidate.resultRevision !== 'string' ||
          candidate.resultRevision.length === 0 ||
          typeof candidate.receiptId !== 'string' ||
          candidate.receiptId.length === 0 ||
          typeof candidate.serviceRequestFingerprint !== 'string' ||
          candidate.serviceRequestFingerprint.length === 0 ||
          candidate.conflictCode !== null)) ||
      (candidate.state === 'conflicted' &&
        (candidate.resultRevision !== null ||
          candidate.receiptId !== null ||
          candidate.serviceRequestFingerprint !== null ||
          candidate.conflictCode === null))
    ) {
      throw new Error(`Classic promotion journal item ${index} state evidence is inconsistent.`);
    }
  }
  if (
    journal.contract !== JOURNAL_CONTRACT ||
    typeof journal.promotionId !== 'string' ||
    !UUID_PATTERN.test(journal.promotionId) ||
    typeof journal.promotionFingerprint !== 'string' ||
    !SHA256_PATTERN.test(journal.promotionFingerprint) ||
    typeof journal.projectionAuthoritySha256 !== 'string' ||
    !SHA256_PATTERN.test(journal.projectionAuthoritySha256) ||
    (journal.state !== 'prepared' &&
      journal.state !== 'applying' &&
      journal.state !== 'partial' &&
      journal.state !== 'committed' &&
      journal.state !== 'conflicted' &&
      journal.state !== 'rescued' &&
      journal.state !== 'discarded') ||
    typeof journal.sequence !== 'number' ||
    !Number.isSafeInteger(journal.sequence) ||
    journal.sequence < 0 ||
    (journal.previousStateSha256 !== null &&
      (typeof journal.previousStateSha256 !== 'string' || !SHA256_PATTERN.test(journal.previousStateSha256))) ||
    (journal.rescueEnvelopePath !== null && typeof journal.rescueEnvelopePath !== 'string') ||
    delta.contract !== DELTA_CONTRACT ||
    typeof delta.projectionAuthoritySha256 !== 'string' ||
    !SHA256_PATTERN.test(delta.projectionAuthoritySha256) ||
    typeof delta.sourceSnapshotDigest !== 'string' ||
    !SHA256_PATTERN.test(delta.sourceSnapshotDigest) ||
    typeof delta.digest !== 'string' ||
    !SHA256_PATTERN.test(delta.digest)
  ) {
    throw new Error('Classic promotion journal authority fields are malformed.');
  }
  requireNonEmptyText(journal.projectionAuthorityPath, 'Classic promotion projection path');
  requireNonEmptyText(journal.destinationAuthority, 'Classic promotion destination authority');
  requireCanonicalTimestamp(journal.updatedAt, 'Classic promotion update time');
  const { digest: _digest, ...unsignedDelta } = delta;
  if (sha256(canonicalJson(unsignedDelta)) !== delta.digest) {
    throw new Error('Classic promotion delta digest is invalid.');
  }
  if (delta.projectionAuthoritySha256 !== journal.projectionAuthoritySha256) {
    throw new Error('Classic promotion journal and delta bind different projection authorities.');
  }
  return journal as unknown as ClassicPromotionJournal;
}

function canonicalBase64(bytes: Buffer): string {
  return bytes.length === 0 ? '' : bytes.toString('base64');
}

function decodeCanonicalBase64(value: string, expectedSize: number, expectedSha256: string): Buffer {
  if (value !== '' && (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value))) {
    throw new Error('Classic Constitution payload is not canonical base64.');
  }
  const bytes = Buffer.from(value, 'base64');
  if (canonicalBase64(bytes) !== value || bytes.length !== expectedSize || sha256(bytes) !== expectedSha256) {
    throw new Error('Classic Constitution payload does not match its bound size or digest.');
  }
  return bytes;
}

function objectIdentityForRestorePath(restorePath: string): { objectId: string; classicPath: string } {
  if (restorePath === 'constitution/files/CONSTITUTION.md') {
    return { objectId: 'constitution:CONSTITUTION.md', classicPath: 'classic-home/.wayland/CONSTITUTION.md' };
  }
  if (restorePath === 'constitution/files/SOUL.md') {
    return { objectId: 'constitution:CONSTITUTION.md', classicPath: 'classic-home/.wayland/SOUL.md' };
  }
  const match = /^constitution\/files\/specialists\/([^/]+)\.md$/.exec(restorePath);
  if (!match) throw new Error(`Unsupported Classic Constitution projection object: ${restorePath}`);
  const id = match[1]!.normalize('NFC');
  if (id !== match[1] || !SPECIALIST_PATTERN.test(id)) {
    throw new Error(`Invalid Classic specialist identity: ${restorePath}`);
  }
  return { objectId: `specialist:${id}`, classicPath: `classic-home/.wayland/specialists/${id}.md` };
}

function relativePathForObjectId(objectId: string): string {
  if (objectId === 'constitution:CONSTITUTION.md') return 'CONSTITUTION.md';
  const match = /^specialist:([A-Za-z0-9_-]+)$/.exec(objectId);
  if (!match) throw new Error(`Unsupported Classic Constitution object identity: ${objectId}`);
  return `specialists/${match[1]}.md`;
}

function classicPathMatchesObjectId(objectId: string, classicPath: string): boolean {
  const relative = classicPath.replace(/^classic-home\/\.wayland\//, '');
  if (objectId === 'constitution:CONSTITUTION.md') {
    return relative === 'CONSTITUTION.md' || relative === 'SOUL.md';
  }
  return relativePathForObjectId(objectId) === relative;
}

function validateObjectCollisions(objectIds: readonly string[]): void {
  const exact = new Set<string>();
  const folded = new Set<string>();
  for (const objectId of objectIds) {
    if (exact.has(objectId)) throw new Error(`Duplicate Classic Constitution object identity: ${objectId}`);
    const foldedId = objectId.toLowerCase();
    if (folded.has(foldedId)) throw new Error(`Case-colliding Classic Constitution object identity: ${objectId}`);
    exact.add(objectId);
    folded.add(foldedId);
  }
}

/**
 * Commit the directory entry a rename/link created.
 *
 * Delegates to the shared platform rule. The previous local copy opened
 * `path.join(directory, '.')` on Windows, which fails with EPERM exactly like
 * the plain directory does, so this flow threw there instead of degrading.
 */
async function syncDirectory(directory: string): Promise<void> {
  await syncDirectoryDurably(directory);
}

async function writeExclusiveDurable(filePath: string, bytes: Buffer | string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const handle = await open(filePath, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(path.dirname(filePath));
}

async function regularFileBytes(filePath: string, maximum = MAX_OBJECT_BYTES): Promise<Buffer> {
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const handle = await open(filePath, constants.O_RDONLY | noFollow);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > maximum) throw new Error(`Unsafe or oversized Classic file: ${filePath}`);
    const bytes = await handle.readFile();
    if (bytes.length !== stat.size) throw new Error(`Classic file changed during read: ${filePath}`);
    return bytes;
  } finally {
    await handle.close();
  }
}

function requireCodec(
  codec: ClassicAuthorityEnvelopeCodec | undefined,
  operation: string
): ClassicAuthorityEnvelopeCodec {
  if (!codec) {
    throw new Error(`${operation} requires an explicit external-recovery authority codec.`);
  }
  return codec;
}

function requireCodecForAuthentication(
  codec: ClassicAuthorityEnvelopeCodec,
  authentication: ClassicProjectionAuthorityRecord['authentication']
): void {
  if (authentication === 'os-vault' && codec.securityClass !== 'external-recovery-authority') {
    throw new Error('Production Classic recovery forbids plaintext, test-only, and legacy safeStorage codecs.');
  }
  if (authentication === 'test-only' && codec.securityClass !== 'test-only') {
    throw new Error('Test-only Classic recovery requires an explicitly test-only codec.');
  }
  if (authentication === 'test-only' && process.env.NODE_ENV !== 'test') {
    throw new Error('Test-only Classic recovery records are forbidden outside the test runtime.');
  }
}

export async function publishClassicProjectionAuthority(input: {
  recoveryAuthorityParent: string;
  preparationId: string;
  classicRoot: string;
  classicRootIdentitySource?: string;
  sourceAppVersion: string;
  candidateAppVersion: string;
  producerCommit: string;
  candidateCommit: string;
  sourceSnapshotDigest: `sha256:${string}`;
  sourceRevisionAuthorityEnvelopeSha256: string | null;
  sourceRevisionAuthorityEnvelope: Buffer | null;
  projectedFiles: readonly ClassicProjectionFile[];
  createdAt: string;
  authentication: 'os-vault' | 'test-only';
  codec?: ClassicAuthorityEnvelopeCodec;
}): Promise<PublishedClassicProjectionAuthority> {
  const codec = requireCodec(input.codec, 'Classic projection publication');
  requireCodecForAuthentication(codec, input.authentication);
  if (!/^[A-Za-z0-9._-]+$/.test(input.preparationId)) throw new Error('Unsafe Classic projection preparation id.');
  const objects = input.projectedFiles
    .map((file): ClassicProjectionObject => {
      const identity = objectIdentityForRestorePath(file.restorePath);
      if (identity.classicPath !== file.classicPath || !SHA256_PATTERN.test(file.sha256)) {
        throw new Error(`Classic projection path or digest is not canonical: ${file.restorePath}`);
      }
      decodeCanonicalBase64(file.contentBase64, file.size, file.sha256);
      return {
        objectId: identity.objectId,
        classicPath: identity.classicPath,
        present: true,
        size: file.size,
        sha256: file.sha256 as `sha256:${string}`,
        contentBase64: file.contentBase64,
      };
    })
    .sort((left, right) => compareCanonicalText(left.objectId, right.objectId));
  validateObjectCollisions(objects.map(({ objectId }) => objectId));
  const requestedClassicRoot = path.resolve(input.classicRoot);
  const classicRoot = path.join(
    await realpath(path.dirname(requestedClassicRoot)),
    path.basename(requestedClassicRoot)
  );
  const rootIdentitySource = path.resolve(input.classicRootIdentitySource ?? requestedClassicRoot);
  const rootIdentityStat = await lstat(rootIdentitySource, { bigint: true });
  if (!rootIdentityStat.isDirectory() || rootIdentityStat.isSymbolicLink()) {
    throw new Error('Classic projection root identity source is not a real directory.');
  }
  const recoveryAuthorityRoot = path.join(path.resolve(input.recoveryAuthorityParent), input.preparationId);
  const record: ClassicProjectionAuthorityRecord = {
    contract: AUTHORITY_CONTRACT,
    authentication: input.authentication,
    preparationId: input.preparationId,
    sourceAppVersion: input.sourceAppVersion,
    candidateAppVersion: input.candidateAppVersion,
    producerCommit: input.producerCommit,
    candidateCommit: input.candidateCommit,
    sourceSnapshotDigest: input.sourceSnapshotDigest,
    sourceRevisionAuthorityEnvelopeSha256: input.sourceRevisionAuthorityEnvelopeSha256,
    sourceRevisionAuthorityEnvelopeBase64: input.sourceRevisionAuthorityEnvelope
      ? canonicalBase64(input.sourceRevisionAuthorityEnvelope)
      : null,
    classicRoot,
    classicRootIdentity: {
      canonicalDestination: classicRoot,
      device: rootIdentityStat.dev.toString(10),
      inode: rootIdentityStat.ino.toString(10),
    },
    createdAt: input.createdAt,
    recoveryAuthorityRoot,
    objects,
  };
  const plaintext = Buffer.from(canonicalJson(record), 'utf8');
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-projection-authority-'));
  const plaintextPath = path.join(staging, 'projection.json');
  const authorityEnvelopePath = path.join(recoveryAuthorityRoot, 'projection-authority.sealed');
  try {
    await writeExclusiveDurable(plaintextPath, plaintext);
    await mkdir(input.recoveryAuthorityParent, { recursive: true, mode: 0o700 });
    await mkdir(recoveryAuthorityRoot, { recursive: false, mode: 0o700 });
    await codec.sealFile(plaintextPath, authorityEnvelopePath);
    await syncDirectory(recoveryAuthorityRoot);
    return {
      authorityEnvelopePath,
      authorityEnvelopeSha256: sha256(await regularFileBytes(authorityEnvelopePath, 4 * MAX_OBJECT_BYTES)),
      recoveryAuthorityRoot,
      record,
    };
  } catch (error) {
    await rm(recoveryAuthorityRoot, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function decodeProjectionAuthority(
  authorityEnvelopePath: string,
  codec: ClassicAuthorityEnvelopeCodec
): Promise<{ record: ClassicProjectionAuthorityRecord; envelopeSha256: `sha256:${string}` }> {
  const envelopeSha256 = sha256(await regularFileBytes(authorityEnvelopePath, 4 * MAX_OBJECT_BYTES));
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-projection-read-'));
  const plaintextPath = path.join(staging, 'projection.json');
  try {
    await codec.unsealFile(authorityEnvelopePath, plaintextPath);
    const record = assertExactProjectionShape(
      parseCanonicalJson<unknown>(await regularFileBytes(plaintextPath, 4 * MAX_OBJECT_BYTES))
    );
    if (
      record.contract !== AUTHORITY_CONTRACT ||
      !SHA256_PATTERN.test(record.sourceSnapshotDigest) ||
      !Array.isArray(record.objects) ||
      !record.classicRootIdentity ||
      record.classicRootIdentity.canonicalDestination !== record.classicRoot ||
      !/^\d+$/.test(record.classicRootIdentity.device) ||
      !/^\d+$/.test(record.classicRootIdentity.inode) ||
      path.resolve(record.recoveryAuthorityRoot, 'projection-authority.sealed') !== path.resolve(authorityEnvelopePath)
    ) {
      throw new Error('Classic projection authority has unsupported or mismatched identity.');
    }
    validateObjectCollisions(record.objects.map(({ objectId }) => objectId));
    for (const object of record.objects) {
      if (!classicPathMatchesObjectId(object.objectId, object.classicPath)) {
        throw new Error(`Classic projection authority contains a non-derived path: ${object.objectId}`);
      }
      decodeCanonicalBase64(object.contentBase64, object.size, object.sha256);
    }
    if (record.sourceRevisionAuthorityEnvelopeBase64) {
      const bytes = Buffer.from(record.sourceRevisionAuthorityEnvelopeBase64, 'base64');
      if (
        canonicalBase64(bytes) !== record.sourceRevisionAuthorityEnvelopeBase64 ||
        sha256(bytes) !== record.sourceRevisionAuthorityEnvelopeSha256
      ) {
        throw new Error('Preserved v2 revision authority envelope failed authentication.');
      }
    } else if (record.sourceRevisionAuthorityEnvelopeSha256 !== null) {
      throw new Error('Classic projection authority omitted its preserved v2 envelope bytes.');
    }
    return { record, envelopeSha256 };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function scanClassicObjects(record: ClassicProjectionAuthorityRecord): Promise<Map<string, Buffer>> {
  const root = path.join(record.classicRoot, 'classic-home', '.wayland');
  const observed = new Map<string, Buffer>();
  let primary: Buffer | null = null;
  let primaryName: 'CONSTITUTION.md' | 'SOUL.md' | null = null;
  for (const sourceName of ['CONSTITUTION.md', 'SOUL.md'] as const) {
    const candidate = path.join(root, sourceName);
    try {
      const bytes = await regularFileBytes(candidate);
      if (primary !== null) {
        throw new Error(`Classic projection contains simultaneous primary files: ${primaryName} and ${sourceName}`);
      }
      primary = bytes;
      primaryName = sourceName;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  if (primary !== null) observed.set('constitution:CONSTITUTION.md', primary);
  const specialistsRoot = path.join(root, 'specialists');
  try {
    const entries = await readdir(specialistsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        throw new Error(`Unsupported Classic specialist filesystem entry: ${entry.name}`);
      }
      const rawId = entry.name.slice(0, -3);
      const id = rawId.normalize('NFC');
      if (id !== rawId || !SPECIALIST_PATTERN.test(id)) throw new Error(`Invalid Classic specialist id: ${rawId}`);
      observed.set(`specialist:${id}`, await regularFileBytes(path.join(specialistsRoot, entry.name)));
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  validateObjectCollisions([...observed.keys()]);
  return observed;
}

function buildDelta(
  authoritySha256: `sha256:${string}`,
  record: ClassicProjectionAuthorityRecord,
  final: Map<string, Buffer>
): ClassicConstitutionDelta {
  const baseline = new Map(record.objects.map((object) => [object.objectId, object]));
  const identities = [...new Set([...baseline.keys(), ...final.keys()])].sort(compareCanonicalText);
  validateObjectCollisions(identities);
  const items: ClassicConstitutionDeltaItem[] = [];
  for (const objectId of identities) {
    const before = baseline.get(objectId);
    const after = final.get(objectId);
    const afterDigest = after ? sha256(after) : null;
    if (before && afterDigest === before.sha256) continue;
    items.push({
      objectId,
      operation: before ? (after ? 'replace' : 'delete') : 'create',
      baselinePresent: Boolean(before),
      baselineSha256: before?.sha256 ?? null,
      finalPresent: Boolean(after),
      finalSha256: afterDigest,
      finalSize: after?.length ?? 0,
      contentBase64: after ? canonicalBase64(after) : null,
    });
  }
  const canonical = {
    contract: DELTA_CONTRACT,
    projectionAuthoritySha256: authoritySha256,
    sourceSnapshotDigest: record.sourceSnapshotDigest,
    items,
  };
  return { ...canonical, digest: sha256(canonicalJson(canonical)) };
}

function readLive(service: ClassicConstitutionPromotionService, objectId: string): ConstitutionReadResult {
  if (objectId === 'constitution:CONSTITUTION.md') return service.readConstitution();
  return service.readSpecialist(objectId.slice('specialist:'.length));
}

function liveMatchesBaseline(read: ConstitutionReadResult, item: ClassicConstitutionDeltaItem): boolean {
  if (!item.baselinePresent) return read.status === 'absent';
  return read.status === 'present' && sha256(Buffer.from(read.content, 'utf8')) === item.baselineSha256;
}

function journalHeadPath(journalRoot: string): string {
  return path.join(journalRoot, 'HEAD.sealed');
}

function bootTimeMs(): number {
  return Date.now() - os.uptime() * 1000;
}

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function acquireJournalWriterLock(journalRoot: string): Promise<JournalWriterLock> {
  const lockPath = path.join(journalRoot, 'writer.lock');
  const candidate: JournalWriterLock = {
    pid: process.pid,
    hostname: os.hostname(),
    bootTimeMs: bootTimeMs(),
    nonce: randomUUID(),
  };
  try {
    await writeExclusiveDurable(lockPath, canonicalJson(candidate));
    return candidate;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  let existing: JournalWriterLock;
  try {
    existing = exactRecord(
      parseCanonicalJson<unknown>(await regularFileBytes(lockPath, 16 * 1024)),
      ['pid', 'hostname', 'bootTimeMs', 'nonce'],
      'Classic promotion writer lock'
    ) as unknown as JournalWriterLock;
  } catch (error) {
    throw new Error('Classic promotion journal writer lock is malformed; refusing concurrent recovery.', {
      cause: error,
    });
  }
  if (existing.hostname !== os.hostname()) {
    throw new Error('Classic promotion journal writer lock belongs to another host; refusing stale-lock recovery.');
  }
  const sameBoot = Math.abs(existing.bootTimeMs - bootTimeMs()) < 5_000;
  if (sameBoot && processIsAlive(existing.pid)) {
    throw new Error(`Classic promotion journal already has an active writer (${existing.pid}).`);
  }
  await unlink(lockPath);
  await syncDirectory(journalRoot);
  return acquireJournalWriterLock(journalRoot);
}

async function releaseJournalWriterLock(journalRoot: string, lock: JournalWriterLock): Promise<void> {
  const lockPath = path.join(journalRoot, 'writer.lock');
  const current = exactRecord(
    parseCanonicalJson<unknown>(await regularFileBytes(lockPath, 16 * 1024)),
    ['pid', 'hostname', 'bootTimeMs', 'nonce'],
    'Classic promotion writer lock'
  ) as unknown as JournalWriterLock;
  if (current.nonce !== lock.nonce) {
    throw new Error('Classic promotion journal writer lock ownership changed before release.');
  }
  await unlink(lockPath);
  await syncDirectory(journalRoot);
}

async function readJournalHead(
  journalRoot: string,
  codec: ClassicAuthorityEnvelopeCodec
): Promise<{ head: ClassicPromotionJournalHead; sha256: `sha256:${string}` } | null> {
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-promotion-head-read-'));
  const plaintextPath = path.join(staging, 'head.json');
  try {
    await codec.unsealFile(journalHeadPath(journalRoot), plaintextPath);
    const bytes = await regularFileBytes(plaintextPath, 64 * 1024);
    const head = exactRecord(
      parseCanonicalJson<unknown>(bytes),
      ['contract', 'promotionId', 'sequence', 'eventFile', 'eventSha256', 'previousHeadSha256'],
      'Classic promotion journal head'
    ) as unknown as ClassicPromotionJournalHead;
    if (
      head.contract !== JOURNAL_HEAD_CONTRACT ||
      !UUID_PATTERN.test(head.promotionId) ||
      !Number.isSafeInteger(head.sequence) ||
      head.sequence < 0 ||
      !/^\d{6}-[a-f0-9]{64}\.sealed$/.test(head.eventFile) ||
      !SHA256_PATTERN.test(head.eventSha256) ||
      (head.previousHeadSha256 !== null && !SHA256_PATTERN.test(head.previousHeadSha256))
    ) {
      throw new Error('Classic promotion journal head is malformed.');
    }
    return { head, sha256: sha256(bytes) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

function predecessorClaimPath(journalRoot: string, predecessorHeadSha256: `sha256:${string}` | null): string {
  return path.join(journalRoot, `.claim-${predecessorHeadSha256?.slice('sha256:'.length) ?? 'genesis'}.sealed`);
}

async function ensurePredecessorClaim(
  journalRoot: string,
  claim: JournalPredecessorClaim,
  codec: ClassicAuthorityEnvelopeCodec
): Promise<void> {
  const claimPath = predecessorClaimPath(journalRoot, claim.predecessorHeadSha256);
  const serialized = canonicalJson(claim);
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-promotion-claim-'));
  const sourcePath = path.join(staging, 'claim.json');
  try {
    await writeExclusiveDurable(sourcePath, serialized);
    await ensureSealedJournalEvent({
      sourcePath,
      eventPath: claimPath,
      eventSha256: sha256(serialized),
      codec,
    });
    await syncDirectory(journalRoot);
  } catch (error) {
    throw new Error('Classic promotion predecessor already has a competing successor claim.', { cause: error });
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function ensureSealedJournalEvent(input: {
  sourcePath: string;
  eventPath: string;
  eventSha256: `sha256:${string}`;
  codec: ClassicAuthorityEnvelopeCodec;
}): Promise<void> {
  try {
    await input.codec.sealFile(input.sourcePath, input.eventPath);
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-promotion-event-reuse-'));
  const plaintextPath = path.join(staging, 'event.json');
  try {
    await input.codec.unsealFile(input.eventPath, plaintextPath);
    if (sha256(await regularFileBytes(plaintextPath, 16 * MAX_OBJECT_BYTES)) !== input.eventSha256) {
      throw new Error('Classic promotion predecessor claim points to a conflicting existing event.');
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function readPredecessorClaim(
  journalRoot: string,
  predecessorHeadSha256: `sha256:${string}` | null,
  codec: ClassicAuthorityEnvelopeCodec
): Promise<JournalPredecessorClaim> {
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-promotion-claim-read-'));
  const plaintextPath = path.join(staging, 'claim.json');
  let claim: JournalPredecessorClaim;
  try {
    await codec.unsealFile(predecessorClaimPath(journalRoot, predecessorHeadSha256), plaintextPath);
    claim = exactRecord(
      parseCanonicalJson<unknown>(await regularFileBytes(plaintextPath, 64 * 1024)),
      [
        'contract',
        'promotionId',
        'predecessorHeadSha256',
        'successorSequence',
        'successorEventFile',
        'successorEventSha256',
      ],
      'Classic promotion predecessor claim'
    ) as unknown as JournalPredecessorClaim;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  if (
    claim.contract !== JOURNAL_CLAIM_CONTRACT ||
    !UUID_PATTERN.test(claim.promotionId) ||
    claim.predecessorHeadSha256 !== predecessorHeadSha256 ||
    !Number.isSafeInteger(claim.successorSequence) ||
    claim.successorSequence < 0 ||
    !/^\d{6}-[a-f0-9]{64}\.sealed$/.test(claim.successorEventFile) ||
    !SHA256_PATTERN.test(claim.successorEventSha256)
  ) {
    throw new Error('Classic promotion predecessor claim is malformed.');
  }
  return claim;
}

async function decodeJournalEvent(
  journalRoot: string,
  eventFile: string,
  codec: ClassicAuthorityEnvelopeCodec
): Promise<{ journal: ClassicPromotionJournal; sha256: `sha256:${string}` }> {
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-promotion-event-read-'));
  const destination = path.join(staging, 'event.json');
  try {
    await codec.unsealFile(path.join(journalRoot, eventFile), destination);
    const bytes = await regularFileBytes(destination, 8 * MAX_OBJECT_BYTES);
    return { journal: assertExactJournalShape(parseCanonicalJson<unknown>(bytes)), sha256: sha256(bytes) };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function writeJournalState(
  journalRoot: string,
  journal: ClassicPromotionJournal,
  codec: ClassicAuthorityEnvelopeCodec,
  afterEventSync?: PromotionDependencies['afterJournalEventSync']
): Promise<void> {
  const plaintext = Buffer.from(canonicalJson(journal), 'utf8');
  const eventSha256 = sha256(plaintext);
  const digest = eventSha256.slice('sha256:'.length);
  const prefix = String(journal.sequence).padStart(6, '0');
  const eventFile = `${prefix}-${digest}.sealed`;
  const before = await readJournalHead(journalRoot, codec);
  if (
    (journal.sequence === 0 && before !== null) ||
    (journal.sequence > 0 &&
      (before === null ||
        before.head.promotionId !== journal.promotionId ||
        before.head.sequence !== journal.sequence - 1))
  ) {
    throw new Error('Classic promotion journal head is stale or has a competing predecessor.');
  }
  const claim: JournalPredecessorClaim = {
    contract: JOURNAL_CLAIM_CONTRACT,
    promotionId: journal.promotionId,
    predecessorHeadSha256: before?.sha256 ?? null,
    successorSequence: journal.sequence,
    successorEventFile: eventFile,
    successorEventSha256: eventSha256,
  };
  await ensurePredecessorClaim(journalRoot, claim, codec);
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-promotion-journal-'));
  const source = path.join(staging, 'state.json');
  const headSource = path.join(staging, 'head.json');
  const pendingHeadPath = path.join(journalRoot, `.HEAD.${randomUUID()}.sealed`);
  try {
    await writeExclusiveDurable(source, plaintext);
    await ensureSealedJournalEvent({
      sourcePath: source,
      eventPath: path.join(journalRoot, eventFile),
      eventSha256,
      codec,
    });
    await syncDirectory(journalRoot);
    await afterEventSync?.({ sequence: journal.sequence, eventFile });
    const observed = await readJournalHead(journalRoot, codec);
    if ((observed?.sha256 ?? null) !== (before?.sha256 ?? null)) {
      throw new Error('Classic promotion journal head changed before successor publication.');
    }
    const head: ClassicPromotionJournalHead = {
      contract: JOURNAL_HEAD_CONTRACT,
      promotionId: journal.promotionId,
      sequence: journal.sequence,
      eventFile,
      eventSha256,
      previousHeadSha256: before?.sha256 ?? null,
    };
    await writeExclusiveDurable(headSource, canonicalJson(head));
    await codec.sealFile(headSource, pendingHeadPath);
    await syncDirectory(journalRoot);
    const preCas = await readJournalHead(journalRoot, codec);
    if ((preCas?.sha256 ?? null) !== (before?.sha256 ?? null)) {
      throw new Error('Classic promotion journal head lost its predecessor CAS.');
    }
    await rename(pendingHeadPath, journalHeadPath(journalRoot));
    await syncDirectory(journalRoot);
  } finally {
    await rm(pendingHeadPath, { force: true });
    await rm(staging, { recursive: true, force: true });
  }
}

async function readJournalStates(
  journalRoot: string,
  codec: ClassicAuthorityEnvelopeCodec,
  options: Readonly<{ repairClaimedOrphan?: boolean }> = {}
): Promise<ClassicPromotionJournal[]> {
  const directoryNames = await readdir(journalRoot);
  const unknown = directoryNames.filter(
    (name) =>
      !/^\d{6}-[a-f0-9]{64}\.sealed$/.test(name) &&
      !/^\.claim-(?:genesis|[a-f0-9]{64})\.sealed$/.test(name) &&
      name !== 'HEAD.sealed' &&
      name !== 'writer.lock' &&
      name !== 'reconciliation'
  );
  if (unknown.length > 0) {
    throw new Error(`Classic promotion journal contains torn or unknown state: ${unknown.sort().join(', ')}`);
  }
  const names = directoryNames.filter((name) => /^\d{6}-[a-f0-9]{64}\.sealed$/.test(name)).sort();
  if (names.length === 0) throw new Error('Classic promotion journal has no authenticated state.');
  const headResult = await readJournalHead(journalRoot, codec);
  const committedEventCount = headResult ? headResult.head.sequence + 1 : 0;
  if (names.length === committedEventCount + 1) {
    const claim = await readPredecessorClaim(journalRoot, headResult?.sha256 ?? null, codec);
    const orphanEventFile = names.at(-1)!;
    if (
      claim.successorSequence !== committedEventCount ||
      claim.successorEventFile !== orphanEventFile ||
      claim.successorEventSha256 !== `sha256:${orphanEventFile.slice(7, -'.sealed'.length)}`
    ) {
      throw new Error('Classic promotion journal orphan does not match its exclusive predecessor claim.');
    }
    const orphan = await decodeJournalEvent(journalRoot, orphanEventFile, codec);
    if (
      orphan.sha256 !== claim.successorEventSha256 ||
      orphan.journal.promotionId !== claim.promotionId ||
      orphan.journal.sequence !== claim.successorSequence
    ) {
      throw new Error('Classic promotion claimed orphan event failed authentication.');
    }
    if (options.repairClaimedOrphan === false) {
      throw new Error('Classic promotion journal requires explicit reconciliation before metadata inventory.');
    }
    await writeJournalState(journalRoot, orphan.journal, codec);
    return readJournalStates(journalRoot, codec);
  }
  if (!headResult) throw new Error('Classic promotion journal is missing its authenticated head.');
  const { head } = headResult;
  if (head.sequence !== names.length - 1 || head.eventFile !== names.at(-1)) {
    throw new Error('Classic promotion journal contains an orphan tail or stale head.');
  }
  const states: ClassicPromotionJournal[] = [];
  let previous: `sha256:${string}` | null = null;
  for (const [index, name] of names.entries()) {
    const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-promotion-read-'));
    const destination = path.join(staging, 'state.json');
    try {
      await codec.unsealFile(path.join(journalRoot, name), destination);
      const bytes = await regularFileBytes(destination, 8 * MAX_OBJECT_BYTES);
      const digest = sha256(bytes);
      if (name !== `${String(index).padStart(6, '0')}-${digest.slice('sha256:'.length)}.sealed`) {
        throw new Error('Classic promotion journal state digest or sequence is invalid.');
      }
      const state = assertExactJournalShape(parseCanonicalJson<unknown>(bytes));
      if (state.contract !== JOURNAL_CONTRACT || state.sequence !== index || state.previousStateSha256 !== previous) {
        throw new Error('Classic promotion journal chain is invalid.');
      }
      if (state.promotionId !== head.promotionId) {
        throw new Error('Classic promotion journal event belongs to a different promotion.');
      }
      if (index === names.length - 1 && digest !== head.eventSha256) {
        throw new Error('Classic promotion journal head does not authenticate its terminal event.');
      }
      states.push(state);
      previous = digest;
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }
  return states;
}

async function assertClassicRootIdentity(record: ClassicProjectionAuthorityRecord): Promise<void> {
  const classicReal = await realpath(record.classicRoot);
  if (classicReal !== record.classicRoot) throw new Error('Classic root identity changed before recovery inspection.');
  const classicStat = await lstat(classicReal, { bigint: true });
  if (
    !classicStat.isDirectory() ||
    classicStat.isSymbolicLink() ||
    classicStat.dev.toString(10) !== record.classicRootIdentity.device ||
    classicStat.ino.toString(10) !== record.classicRootIdentity.inode
  ) {
    throw new Error('Classic root filesystem identity changed before recovery inspection.');
  }
}

async function discoverSinglePromotionRoot(recoveryAuthorityRoot: string): Promise<string | null> {
  const promotionsRoot = path.join(recoveryAuthorityRoot, 'promotions');
  let entries: Dirent[];
  try {
    entries = await readdir(promotionsRoot, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  if (entries.some((entry) => !entry.isDirectory() || entry.isSymbolicLink() || !UUID_PATTERN.test(entry.name))) {
    throw new Error('Classic promotion authority contains an unsupported filesystem entry.');
  }
  if (entries.length > 1) {
    throw new Error('Classic promotion authority contains multiple recovery decisions.');
  }
  return entries.length === 0 ? null : path.join(promotionsRoot, entries[0]!.name);
}

export async function resolveClassicPromotionJournalRoot(input: {
  authorityEnvelopePath: string;
  codec: ClassicAuthorityEnvelopeCodec;
  promotionId: string;
}): Promise<string> {
  if (!UUID_PATTERN.test(input.promotionId)) throw new Error('Classic promotion id is not a UUID.');
  const codec = requireCodec(input.codec, 'Classic promotion journal resolution');
  const { record } = await decodeProjectionAuthority(input.authorityEnvelopePath, codec);
  requireCodecForAuthentication(codec, record.authentication);
  await assertClassicRootIdentity(record);
  const discoveredRoot = await discoverSinglePromotionRoot(record.recoveryAuthorityRoot);
  const expected = path.join(record.recoveryAuthorityRoot, 'promotions', input.promotionId);
  if (discoveredRoot !== expected) {
    throw new Error('Classic recovery operation does not match the authenticated promotion authority.');
  }
  return expected;
}

export async function inspectClassicConstitutionRecovery(input: {
  authorityEnvelopePath: string;
  codec: ClassicAuthorityEnvelopeCodec;
  promotionId?: string;
}): Promise<ClassicRecoveryInspection> {
  const codec = requireCodec(input.codec, 'Classic recovery inspection');
  const { record, envelopeSha256 } = await decodeProjectionAuthority(input.authorityEnvelopePath, codec);
  requireCodecForAuthentication(codec, record.authentication);
  await assertClassicRootIdentity(record);
  const delta = buildDelta(envelopeSha256, record, await scanClassicObjects(record));
  const discoveredRoot = await discoverSinglePromotionRoot(record.recoveryAuthorityRoot);
  const journalRoot = input.promotionId
    ? path.join(record.recoveryAuthorityRoot, 'promotions', input.promotionId)
    : discoveredRoot;
  if (input.promotionId && !UUID_PATTERN.test(input.promotionId)) {
    throw new Error('Classic promotion id is not a UUID.');
  }
  if (input.promotionId && discoveredRoot !== journalRoot) {
    throw new Error('Classic recovery operation does not match the authenticated promotion authority.');
  }
  if (!journalRoot) {
    return {
      projectionAuthoritySha256: envelopeSha256,
      recoveryAuthorityRoot: record.recoveryAuthorityRoot,
      delta,
      promotionId: null,
      journalRoot: null,
      journalHeadSha256: null,
      journal: null,
      rescue: null,
    };
  }
  const states = await readJournalStates(journalRoot, codec, { repairClaimedOrphan: false });
  const journal = states.at(-1)!;
  const head = await readJournalHead(journalRoot, codec);
  if (!head || head.head.promotionId !== journal.promotionId || head.head.sequence !== journal.sequence) {
    throw new Error('Classic promotion journal head does not match its authenticated state.');
  }
  let rescue: ClassicRecoveryInspection['rescue'] = null;
  if (journal.rescueEnvelopePath) {
    const resolved = path.resolve(journal.rescueEnvelopePath);
    const expectedRoot = path.resolve(record.recoveryAuthorityRoot, 'rescue');
    if (path.dirname(resolved) !== expectedRoot || !/^[a-f0-9]{64}\.sealed$/.test(path.basename(resolved))) {
      throw new Error('Classic rescue authority path is not derived from its authenticated record.');
    }
    const envelopeBytes = await regularFileBytes(resolved, 16 * MAX_OBJECT_BYTES);
    const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-rescue-inspection-'));
    const plaintextPath = path.join(staging, 'rescue.json');
    try {
      await codec.unsealFile(resolved, plaintextPath);
      const plaintext = await regularFileBytes(plaintextPath, 16 * MAX_OBJECT_BYTES);
      const rescueId = sha256(plaintext);
      if (path.basename(resolved) !== `${rescueId.slice('sha256:'.length)}.sealed`) {
        throw new Error('Classic rescue content address does not match its authenticated plaintext.');
      }
      const bundle = exactRecord(
        parseCanonicalJson<unknown>(plaintext),
        [
          'contract',
          'promotionId',
          'projectionAuthoritySha256',
          'destinationAuthority',
          'createdAt',
          'retention',
          'preservedRevisionAuthorityEnvelopeBase64',
          'projectionObjects',
          'delta',
          'journal',
        ],
        'Classic rescue bundle'
      );
      if (
        bundle.contract !== RESCUE_CONTRACT ||
        bundle.promotionId !== journal.promotionId ||
        bundle.projectionAuthoritySha256 !== journal.projectionAuthoritySha256
      ) {
        throw new Error('Classic rescue bundle does not bind the active promotion.');
      }
      const retention = exactRecord(bundle.retention, ['automaticGc', 'disposition'], 'Classic rescue retention');
      if (retention.automaticGc !== false || retention.disposition !== 'indefinite-local-preservation') {
        throw new Error('Classic rescue retention contract is invalid.');
      }
      const createdAt = requireCanonicalTimestamp(bundle.createdAt, 'Classic rescue creation time');
      rescue = {
        rescueId,
        envelopeSha256: sha256(envelopeBytes),
        bytes: envelopeBytes.length,
        createdAt,
      };
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }
  return {
    projectionAuthoritySha256: envelopeSha256,
    recoveryAuthorityRoot: record.recoveryAuthorityRoot,
    delta,
    promotionId: journal.promotionId,
    journalRoot,
    journalHeadSha256: head.sha256,
    journal,
    rescue,
  };
}

function nextJournalState(
  current: ClassicPromotionJournal,
  update: Omit<Partial<ClassicPromotionJournal>, 'sequence' | 'previousStateSha256'>,
  now: Date
): ClassicPromotionJournal {
  return {
    ...current,
    ...update,
    sequence: current.sequence + 1,
    previousStateSha256: sha256(canonicalJson(current)),
    updatedAt: now.toISOString(),
  };
}

async function sealRescueBundle(
  current: ClassicPromotionJournal,
  record: ClassicProjectionAuthorityRecord,
  codec: ClassicAuthorityEnvelopeCodec
): Promise<string> {
  const rescueRoot = path.join(record.recoveryAuthorityRoot, 'rescue');
  await mkdir(rescueRoot, { recursive: true, mode: 0o700 });
  const bundle = {
    contract: RESCUE_CONTRACT,
    promotionId: current.promotionId,
    projectionAuthoritySha256: current.projectionAuthoritySha256,
    destinationAuthority: current.destinationAuthority,
    createdAt: current.updatedAt,
    retention: { automaticGc: false, disposition: 'indefinite-local-preservation' },
    preservedRevisionAuthorityEnvelopeBase64: record.sourceRevisionAuthorityEnvelopeBase64,
    projectionObjects: record.objects,
    delta: current.delta,
    journal: current,
  };
  const bytes = Buffer.from(canonicalJson(bundle), 'utf8');
  const destination = path.join(rescueRoot, `${sha256(bytes).slice('sha256:'.length)}.sealed`);
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-rescue-'));
  const source = path.join(staging, 'rescue.json');
  try {
    await writeExclusiveDurable(source, bytes);
    await ensureSealedJournalEvent({
      sourcePath: source,
      eventPath: destination,
      eventSha256: sha256(bytes),
      codec,
    });
    await syncDirectory(rescueRoot);
    return destination;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function publishJournalReconciliation(input: {
  journalRoot: string;
  codec: ClassicAuthorityEnvelopeCodec;
  cause: unknown;
}): Promise<ClassicPromotionResult> {
  const eventFiles = (await readdir(input.journalRoot))
    .filter((name) => /^\d{6}-[a-f0-9]{64}\.sealed$/.test(name))
    .sort();
  if (eventFiles.length === 0) throw input.cause;
  const terminal = await decodeJournalEvent(input.journalRoot, eventFiles.at(-1)!, input.codec);
  if (
    terminal.journal.contract !== JOURNAL_CONTRACT ||
    !UUID_PATTERN.test(terminal.journal.promotionId) ||
    terminal.journal.sequence !== eventFiles.length - 1
  ) {
    throw input.cause;
  }
  const { record, envelopeSha256 } = await decodeProjectionAuthority(
    terminal.journal.projectionAuthorityPath,
    input.codec
  );
  if (envelopeSha256 !== terminal.journal.projectionAuthoritySha256) throw input.cause;
  const rescueEnvelopePath = await sealRescueBundle(terminal.journal, record, input.codec);
  const reconciliation = {
    contract: RECONCILIATION_CONTRACT,
    promotionId: terminal.journal.promotionId,
    terminalEventSha256: terminal.sha256,
    projectionAuthoritySha256: terminal.journal.projectionAuthoritySha256,
    rescueEnvelopePath,
    disposition: 'no-further-destination-cas',
    reason: input.cause instanceof Error ? input.cause.message : String(input.cause),
  };
  const bytes = Buffer.from(canonicalJson(reconciliation), 'utf8');
  const reconciliationRoot = path.join(input.journalRoot, 'reconciliation');
  await mkdir(reconciliationRoot, { recursive: true, mode: 0o700 });
  const destination = path.join(reconciliationRoot, `${sha256(bytes).slice('sha256:'.length)}.sealed`);
  const staging = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-reconciliation-'));
  const sourcePath = path.join(staging, 'reconciliation.json');
  try {
    await writeExclusiveDurable(sourcePath, bytes);
    await ensureSealedJournalEvent({
      sourcePath,
      eventPath: destination,
      eventSha256: sha256(bytes),
      codec: input.codec,
    });
    await syncDirectory(reconciliationRoot);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return {
    state: 'reconciliation-required',
    promotionId: terminal.journal.promotionId,
    journalRoot: input.journalRoot,
    rescueEnvelopePath,
    delta: terminal.journal.delta,
  };
}

async function createPromotionJournalRoot(recoveryAuthorityRoot: string, promotionId: string): Promise<string> {
  const promotionsRoot = path.join(recoveryAuthorityRoot, 'promotions');
  await mkdir(promotionsRoot, { recursive: true, mode: 0o700 });
  const journalRoot = path.join(promotionsRoot, promotionId);
  try {
    await mkdir(journalRoot, { recursive: false, mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const entries = await readdir(journalRoot);
    if (entries.length !== 0) {
      throw new Error('Classic promotion identity already owns authenticated or incomplete journal state.');
    }
  }
  await syncDirectory(promotionsRoot);
  return journalRoot;
}

function applyItem(
  service: ClassicConstitutionPromotionService,
  item: ClassicPromotionItem
): ConstitutionMutationResult {
  const content = item.contentBase64 === null ? null : Buffer.from(item.contentBase64, 'base64').toString('utf8');
  if (item.objectId === 'constitution:CONSTITUTION.md') {
    return content === null
      ? service.deleteConstitution(item.expectedRevision, item.requestId)
      : service.writeConstitution(content, item.expectedRevision, item.requestId);
  }
  const id = item.objectId.slice('specialist:'.length);
  return content === null
    ? service.deleteSpecialist(id, item.expectedRevision, item.requestId)
    : service.writeSpecialist(id, content, item.expectedRevision, item.requestId);
}

function stableConflictCode(error: unknown): ClassicConflictCode {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : '';
  if (code === 'CONSTITUTION_FS_CONFLICT') return 'STALE_DESTINATION';
  if (code.includes('UNSUPPORTED')) return 'UNSUPPORTED_CHANGE';
  if (
    code.includes('MALFORMED') ||
    code.includes('INTEGRITY') ||
    code.includes('AUTH') ||
    code.includes('KEY') ||
    code.includes('REVISION_AUTHORITY')
  ) {
    return 'INTEGRITY_FAILURE';
  }
  return 'NATIVE_FAILURE';
}

function terminalPromotionState(current: ClassicPromotionJournal): 'partial' | 'committed' | 'conflicted' {
  const committed = current.items.some((item) => item.state === 'committed');
  const conflicted = current.items.some((item) => item.state === 'conflicted');
  if (conflicted) return committed ? 'partial' : 'conflicted';
  return 'committed';
}

async function executePromotion(
  journalRoot: string,
  service: ClassicConstitutionPromotionService,
  record: ClassicProjectionAuthorityRecord,
  dependencies: PromotionDependencies
): Promise<ClassicPromotionResult> {
  const codec = requireCodec(dependencies.codec, 'Classic promotion execution');
  const writerLock = await acquireJournalWriterLock(journalRoot);
  let release: () => Promise<void> | void;
  try {
    release = await dependencies.acquireQuiescence();
  } catch (error) {
    await releaseJournalWriterLock(journalRoot, writerLock);
    throw error;
  }
  try {
    let states = await readJournalStates(journalRoot, codec);
    let current = states.at(-1)!;
    if (
      current.state === 'committed' ||
      current.state === 'rescued' ||
      current.state === 'discarded' ||
      ((current.state === 'conflicted' || current.state === 'partial') &&
        !current.items.some((item) => item.state === 'pending'))
    ) {
      return {
        state: current.state,
        promotionId: current.promotionId,
        journalRoot,
        rescueEnvelopePath: current.rescueEnvelopePath,
        delta: current.delta,
      };
    }
    if (current.state === 'prepared') {
      const rescueEnvelopePath = await sealRescueBundle(current, record, codec);
      current = nextJournalState(
        current,
        { state: 'applying', rescueEnvelopePath },
        dependencies.now?.() ?? new Date()
      );
      await writeJournalState(journalRoot, current, codec, dependencies.afterJournalEventSync);
    }
    for (const candidate of current.items) {
      if (candidate.state !== 'pending') continue;
      let result: ConstitutionMutationResult;
      try {
        // The persisted request UUID/facts are dispatched before any fresh
        // live read. ConstitutionFsService performs authenticated committed
        // lookup first, so response-loss restart replays the exact receipt.
        result = applyItem(service, candidate);
      } catch (error) {
        const items = current.items.map((item) =>
          item.objectId === candidate.objectId
            ? { ...item, state: 'conflicted' as const, conflictCode: stableConflictCode(error) }
            : item
        );
        const state = items.some((item) => item.state === 'committed') ? 'partial' : 'conflicted';
        const conflicted = nextJournalState(current, { state, items }, dependencies.now?.() ?? new Date());
        const rescueEnvelopePath = conflicted.rescueEnvelopePath ?? (await sealRescueBundle(conflicted, record, codec));
        current = { ...conflicted, rescueEnvelopePath };
        await writeJournalState(journalRoot, current, codec, dependencies.afterJournalEventSync);
        return {
          state,
          promotionId: current.promotionId,
          journalRoot,
          rescueEnvelopePath,
          delta: current.delta,
        };
      }
      await dependencies.afterItemDispatch?.({ objectId: candidate.objectId, requestId: candidate.requestId });
      const items = current.items.map((item) =>
        item.objectId === candidate.objectId
          ? {
              ...item,
              state: 'committed' as const,
              resultRevision: result.revision,
              receiptId: result.receiptId,
              serviceRequestFingerprint: result.requestFingerprint,
            }
          : item
      );
      current = nextJournalState(current, { items }, dependencies.now?.() ?? new Date());
      await writeJournalState(journalRoot, current, codec, dependencies.afterJournalEventSync);
    }
    const terminalState = terminalPromotionState(current);
    current = nextJournalState(current, { state: terminalState }, dependencies.now?.() ?? new Date());
    await writeJournalState(journalRoot, current, codec, dependencies.afterJournalEventSync);
    states = await readJournalStates(journalRoot, codec);
    current = states.at(-1)!;
    return {
      state: terminalState,
      promotionId: current.promotionId,
      journalRoot,
      rescueEnvelopePath: current.rescueEnvelopePath,
      delta: current.delta,
    };
  } finally {
    try {
      await release();
    } finally {
      await releaseJournalWriterLock(journalRoot, writerLock);
    }
  }
}

export async function promoteClassicConstitutionChanges(input: {
  authorityEnvelopePath: string;
  destinationAuthority: string;
  service: ClassicConstitutionPromotionService;
  decision: ClassicPromotionDecision;
  dependencies: PromotionDependencies;
}): Promise<ClassicPromotionResult> {
  const codec = requireCodec(input.dependencies.codec, 'Classic promotion');
  const { record, envelopeSha256 } = await decodeProjectionAuthority(input.authorityEnvelopePath, codec);
  requireCodecForAuthentication(codec, record.authentication);
  const classicReal = await realpath(record.classicRoot);
  if (classicReal !== record.classicRoot) throw new Error('Classic root identity changed before promotion.');
  const classicStat = await lstat(classicReal, { bigint: true });
  if (
    !classicStat.isDirectory() ||
    classicStat.isSymbolicLink() ||
    classicStat.dev.toString(10) !== record.classicRootIdentity.device ||
    classicStat.ino.toString(10) !== record.classicRootIdentity.inode
  ) {
    throw new Error('Classic root filesystem identity changed before promotion.');
  }
  const delta = buildDelta(envelopeSha256, record, await scanClassicObjects(record));
  if (delta.items.length === 0) {
    return { state: 'no-change', promotionId: null, journalRoot: null, rescueEnvelopePath: null, delta };
  }
  const now = input.dependencies.now?.() ?? new Date();
  if (input.decision.kind !== 'promote') {
    if (input.decision.kind === 'confirmed-discard') {
      const confirmed = [...input.decision.confirmedObjectIds].sort();
      const actual = delta.items.map(({ objectId }) => objectId).sort();
      if (canonicalJson(confirmed) !== canonicalJson(actual)) {
        throw new Error('Classic discard confirmation does not name the exact affected objects.');
      }
    }
    const promotionId = input.dependencies.createId?.() ?? randomUUID();
    if (!UUID_PATTERN.test(promotionId)) throw new Error('Classic promotion id is not a UUID.');
    const journalRoot = await createPromotionJournalRoot(record.recoveryAuthorityRoot, promotionId);
    const terminalState: 'discarded' | 'rescued' =
      input.decision.kind === 'confirmed-discard' ? 'discarded' : 'rescued';
    const base: ClassicPromotionJournal = {
      contract: JOURNAL_CONTRACT,
      promotionId,
      promotionFingerprint: sha256(
        canonicalJson({ promotionId, delta, destinationAuthority: input.destinationAuthority })
      ),
      projectionAuthorityPath: input.authorityEnvelopePath,
      projectionAuthoritySha256: envelopeSha256,
      destinationAuthority: input.destinationAuthority,
      delta,
      state: terminalState,
      sequence: 0,
      previousStateSha256: null,
      items: [],
      rescueEnvelopePath: null,
      updatedAt: now.toISOString(),
    };
    const rescueEnvelopePath = await sealRescueBundle(base, record, codec);
    const terminal = { ...base, rescueEnvelopePath };
    await writeJournalState(journalRoot, terminal, codec, input.dependencies.afterJournalEventSync);
    return {
      state: terminalState,
      promotionId,
      journalRoot,
      rescueEnvelopePath,
      delta,
    };
  }

  const reads = new Map<string, ConstitutionReadResult>();
  for (const item of delta.items) {
    const read = readLive(input.service, item.objectId);
    if (!liveMatchesBaseline(read, item)) {
      const promotionId = input.dependencies.createId?.() ?? randomUUID();
      if (!UUID_PATTERN.test(promotionId)) throw new Error('Classic promotion id is not a UUID.');
      const journalRoot = await createPromotionJournalRoot(record.recoveryAuthorityRoot, promotionId);
      const conflicted: ClassicPromotionJournal = {
        contract: JOURNAL_CONTRACT,
        promotionId,
        promotionFingerprint: sha256(
          canonicalJson({ promotionId, delta, destinationAuthority: input.destinationAuthority })
        ),
        projectionAuthorityPath: input.authorityEnvelopePath,
        projectionAuthoritySha256: envelopeSha256,
        destinationAuthority: input.destinationAuthority,
        delta,
        state: 'conflicted',
        sequence: 0,
        previousStateSha256: null,
        items: [],
        rescueEnvelopePath: null,
        updatedAt: now.toISOString(),
      };
      const rescueEnvelopePath = await sealRescueBundle(conflicted, record, codec);
      await writeJournalState(
        journalRoot,
        { ...conflicted, rescueEnvelopePath },
        codec,
        input.dependencies.afterJournalEventSync
      );
      return { state: 'conflicted', promotionId, journalRoot, rescueEnvelopePath, delta };
    }
    reads.set(item.objectId, read);
  }

  const promotionId = input.dependencies.createId?.() ?? randomUUID();
  if (!UUID_PATTERN.test(promotionId)) throw new Error('Classic promotion id is not a UUID.');
  const items = delta.items.map((item): ClassicPromotionItem => {
    const requestId = randomUUID();
    const expectedRevision = reads.get(item.objectId)!.revision;
    return {
      objectId: item.objectId,
      operation: item.operation,
      requestId,
      requestFactsSha256: sha256(
        canonicalJson({
          projectionAuthoritySha256: envelopeSha256,
          deltaDigest: delta.digest,
          promotionId,
          objectId: item.objectId,
          operation: item.operation,
          expectedRevision,
          finalSha256: item.finalSha256,
        })
      ),
      expectedRevision,
      contentBase64: item.contentBase64,
      state: 'pending',
      resultRevision: null,
      receiptId: null,
      serviceRequestFingerprint: null,
      conflictCode: null,
    };
  });
  const promotionFingerprint = sha256(
    canonicalJson({
      promotionId,
      projectionAuthoritySha256: envelopeSha256,
      deltaDigest: delta.digest,
      destinationAuthority: input.destinationAuthority,
      items: items.map(({ objectId, requestId, requestFactsSha256, expectedRevision }) => ({
        objectId,
        requestId,
        requestFactsSha256,
        expectedRevision,
      })),
    })
  );
  const journalRoot = await createPromotionJournalRoot(record.recoveryAuthorityRoot, promotionId);
  const prepared: ClassicPromotionJournal = {
    contract: JOURNAL_CONTRACT,
    promotionId,
    promotionFingerprint,
    projectionAuthorityPath: input.authorityEnvelopePath,
    projectionAuthoritySha256: envelopeSha256,
    destinationAuthority: input.destinationAuthority,
    delta,
    state: 'prepared',
    sequence: 0,
    previousStateSha256: null,
    items,
    rescueEnvelopePath: null,
    updatedAt: now.toISOString(),
  };
  await writeJournalState(journalRoot, prepared, codec, input.dependencies.afterJournalEventSync);
  return executePromotion(journalRoot, input.service, record, input.dependencies);
}

export async function resumeClassicConstitutionPromotion(input: {
  journalRoot: string;
  service: ClassicConstitutionPromotionService;
  dependencies: PromotionDependencies;
}): Promise<ClassicPromotionResult> {
  const codec = requireCodec(input.dependencies.codec, 'Classic promotion resume');
  let states: ClassicPromotionJournal[];
  try {
    states = await readJournalStates(input.journalRoot, codec);
  } catch (error) {
    return publishJournalReconciliation({ journalRoot: input.journalRoot, codec, cause: error });
  }
  const current = states.at(-1)!;
  const { record, envelopeSha256 } = await decodeProjectionAuthority(current.projectionAuthorityPath, codec);
  requireCodecForAuthentication(codec, record.authentication);
  if (envelopeSha256 !== current.projectionAuthoritySha256) {
    throw new Error('Classic projection authority changed since promotion preparation.');
  }
  return executePromotion(input.journalRoot, input.service, record, input.dependencies);
}

export async function preserveClassicConstitutionPromotion(input: {
  journalRoot: string;
  dependencies: Pick<PromotionDependencies, 'codec' | 'now' | 'afterJournalEventSync'>;
}): Promise<ClassicPromotionResult> {
  const codec = requireCodec(input.dependencies.codec, 'Classic promotion preservation');
  const writerLock = await acquireJournalWriterLock(input.journalRoot);
  try {
    const states = await readJournalStates(input.journalRoot, codec);
    const current = states.at(-1)!;
    if (current.state === 'rescued') {
      return {
        state: 'rescued',
        promotionId: current.promotionId,
        journalRoot: input.journalRoot,
        rescueEnvelopePath: current.rescueEnvelopePath,
        delta: current.delta,
      };
    }
    if (current.state !== 'partial' && current.state !== 'conflicted') {
      throw new Error('Classic promotion can be preserved only after a partial or conflicted promotion.');
    }
    const { record, envelopeSha256 } = await decodeProjectionAuthority(current.projectionAuthorityPath, codec);
    requireCodecForAuthentication(codec, record.authentication);
    if (envelopeSha256 !== current.projectionAuthoritySha256) {
      throw new Error('Classic projection authority changed before preservation.');
    }
    const rescueEnvelopePath = current.rescueEnvelopePath ?? (await sealRescueBundle(current, record, codec));
    const rescued = nextJournalState(
      current,
      { state: 'rescued', rescueEnvelopePath },
      input.dependencies.now?.() ?? new Date()
    );
    await writeJournalState(input.journalRoot, rescued, codec, input.dependencies.afterJournalEventSync);
    return {
      state: 'rescued',
      promotionId: rescued.promotionId,
      journalRoot: input.journalRoot,
      rescueEnvelopePath,
      delta: rescued.delta,
    };
  } finally {
    await releaseJournalWriterLock(input.journalRoot, writerLock);
  }
}
