import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { decryptString, encryptString } from '@process/secrets/safeStorage';
import { verifyPackagedConstitutionFsBinary, type VerifiedConstitutionFsBinary } from './constitutionFsBinary';
import { ConstitutionKeyStore } from './constitutionKeyStore';
import {
  ConstitutionFsTransactionError,
  createAndSealConstitutionArchiveAuthenticationKey,
  createAuthenticatedConstitutionArchive,
  ensureConstitutionArchiveAuthenticationKey,
  inventoryConstitutionFsArchives,
  inventoryConstitutionFsLiveTargets,
  inventoryPendingConstitutionFsTransactionDetails,
  loadConstitutionArchiveAuthenticationKeys,
  pinConstitutionFsRootAuthority,
  readConstitutionFsArchive,
  readConstitutionFsTarget,
  reconcileConstitutionFsTransaction,
  runConstitutionFsTransaction,
  type ConstitutionArchiveAuthenticationKeyInventory,
  type ConstitutionArchiveSecretBackend,
  type ConstitutionFsExecutionOptions,
  type ConstitutionFsTarget,
  type ConstitutionFsTransactionReceipt,
} from './constitutionFsTransaction';

const MAX_WRITE_BYTES = 256 * 1024;
const SPECIALIST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ConstitutionRevision = string & { readonly __constitutionRevision: unique symbol };
export type ConstitutionReadResult =
  | { status: 'absent'; revision: ConstitutionRevision }
  | { status: 'present'; content: string; revision: ConstitutionRevision };
export type ConstitutionMutationResult = {
  status: 'committed';
  revision: ConstitutionRevision;
  transactionId: string;
  receiptId: string;
};
export type ConstitutionArchiveMetadata = {
  archiveId: string;
  archivedAt: number;
  targetKind: ConstitutionFsTarget['kind'];
  specialistId?: string;
  sourceName: string;
  bytes: number;
};

export class ConstitutionFsService {
  private rootAuthority: ReturnType<typeof pinConstitutionFsRootAuthority> | null;
  private keyStore: ConstitutionKeyStore | null;
  private archiveKeys: ConstitutionArchiveAuthenticationKeyInventory | null = null;
  private activeArchiveKeyId: string | null = null;
  private mutationStateReady = false;
  private readonly revisionKey = randomBytes(32);
  private readonly committedRequests = new Map<string, { fingerprint: string; result: ConstitutionMutationResult }>();

  constructor(
    private readonly root: string,
    private readonly binary: VerifiedConstitutionFsBinary,
    private readonly secretBackend: ConstitutionArchiveSecretBackend,
    keyStore?: ConstitutionKeyStore
  ) {
    this.rootAuthority = existsSync(root) ? pinConstitutionFsRootAuthority(root) : null;
    this.keyStore = keyStore ?? null;
  }

  static createProduction(resourcesPath = process.resourcesPath): ConstitutionFsService {
    const root = path.join(os.homedir(), '.wayland');
    return new ConstitutionFsService(root, verifyPackagedConstitutionFsBinary(resourcesPath), {
      encryptString,
      decryptString,
    });
  }

  private ensureRoot(create: boolean): ReturnType<typeof pinConstitutionFsRootAuthority> | null {
    if (!existsSync(this.root)) {
      if (!create) return null;
      mkdirSync(this.root, { recursive: true, mode: 0o700 });
    }
    const current = pinConstitutionFsRootAuthority(this.root);
    if (
      this.rootAuthority &&
      (this.rootAuthority.device !== current.device || this.rootAuthority.inode !== current.inode)
    ) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_ROOT_IDENTITY_MISMATCH',
        'Wayland root identity changed after it was pinned.'
      );
    }
    this.rootAuthority ??= current;
    return this.rootAuthority;
  }

  private readOptions(): ConstitutionFsExecutionOptions {
    const rootAuthority = this.ensureRoot(false);
    if (!rootAuthority)
      throw new ConstitutionFsTransactionError('CONSTITUTION_FS_NOT_FOUND', 'Wayland root is absent.');
    return { rootAuthority, ...(this.archiveKeys ? { archiveAuthenticationKeys: this.archiveKeys } : {}) };
  }

  private baseMutationOptions(): ConstitutionFsExecutionOptions {
    const rootAuthority = this.ensureRoot(true)!;
    const journalAuthenticationKey = this.keyStore?.journalKey();
    if (!journalAuthenticationKey) {
      throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Mutation key state is unavailable.');
    }
    return { rootAuthority, journalAuthenticationKey };
  }

  private mutationOptions(): ConstitutionFsExecutionOptions {
    if (!this.archiveKeys) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
        'Mutation archive key state is unavailable.'
      );
    }
    return { ...this.baseMutationOptions(), archiveAuthenticationKeys: this.archiveKeys };
  }

  private ensureMutationState(): void {
    if (this.mutationStateReady) return;
    this.ensureRoot(true);
    this.keyStore ??= new ConstitutionKeyStore(this.root, this.secretBackend);
    const base = this.baseMutationOptions();
    const ensured = ensureConstitutionArchiveAuthenticationKey(this.root, this.binary, base, this.secretBackend);
    this.archiveKeys = loadConstitutionArchiveAuthenticationKeys(this.root, this.binary, base, this.secretBackend);
    const storedActive = this.keyStore.activeArchiveKeyId();
    this.activeArchiveKeyId = storedActive ?? ensured.keyId;
    if (!this.archiveKeys.keyIds.includes(this.activeArchiveKeyId)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
        'Persisted active archive key is absent from the helper-anchored key inventory.'
      );
    }
    if (!storedActive) this.keyStore.setActiveArchiveKeyId(this.activeArchiveKeyId);
    this.mutationStateReady = true;
    this.reconcilePendingTransactions();
  }

  private ensureArchiveReadState(): void {
    if (this.archiveKeys) return;
    if (!this.ensureRoot(false) || !existsSync(path.join(this.root, '.constitution-keys.enc'))) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
        'Archive authentication state is unavailable.'
      );
    }
    this.keyStore ??= new ConstitutionKeyStore(this.root, this.secretBackend);
    this.archiveKeys = loadConstitutionArchiveAuthenticationKeys(
      this.root,
      this.binary,
      this.baseMutationOptions(),
      this.secretBackend
    );
    const active = this.keyStore.activeArchiveKeyId();
    if (!active || !this.archiveKeys.keyIds.includes(active)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
        'Persisted active archive key is absent from the helper-anchored key inventory.'
      );
    }
    this.activeArchiveKeyId = active;
  }

  private revision(target: ConstitutionFsTarget, present: boolean, sha256?: string): ConstitutionRevision {
    const key = Buffer.from(this.revisionKey);
    try {
      return `rev:v1:${createHmac('sha256', key)
        .update(JSON.stringify({ target, present, sha256: sha256 ?? null }), 'utf8')
        .digest('base64url')}` as ConstitutionRevision;
    } finally {
      key.fill(0);
    }
  }

  private assertExpectedRevision(
    target: ConstitutionFsTarget,
    current: ConstitutionReadResult,
    expected: string | null
  ): void {
    if (typeof expected !== 'string') {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'A backend-issued expected revision is required.'
      );
    }
    const actual = Buffer.from(current.revision);
    const candidate = Buffer.from(expected);
    if (actual.byteLength !== candidate.byteLength || !timingSafeEqual(actual, candidate)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Constitution target changed since it was read.'
      );
    }
  }

  private reconcilePendingTransactions(): void {
    for (const pending of inventoryPendingConstitutionFsTransactionDetails(
      this.root,
      randomUUID(),
      this.binary,
      this.mutationOptions()
    )) {
      reconcileConstitutionFsTransaction(
        {
          version: 1,
          transactionId: randomUUID(),
          root: this.root,
          operation: 'reconcile',
          reconcileTransactionId: pending.transactionId,
          reconcileFacts: pending.reconcileFacts,
        },
        this.binary,
        this.mutationOptions()
      );
    }
  }

  readTarget(target: ConstitutionFsTarget): ConstitutionReadResult {
    if (!this.ensureRoot(false)) return { status: 'absent', revision: this.revision(target, false) };
    try {
      const result = readConstitutionFsTarget(this.root, randomUUID(), target, this.binary, this.readOptions());
      return {
        status: 'present',
        content: result.content.toString('utf8'),
        revision: this.revision(target, true, result.sha256),
      };
    } catch (error) {
      if (error instanceof ConstitutionFsTransactionError && error.code === 'CONSTITUTION_FS_NOT_FOUND') {
        return { status: 'absent', revision: this.revision(target, false) };
      }
      throw error;
    }
  }

  readConstitution(): ConstitutionReadResult {
    const canonical: ConstitutionFsTarget = { kind: 'constitution', sourceName: 'CONSTITUTION.md' };
    const result = this.readTarget(canonical);
    return result.status === 'present' ? result : this.readTarget({ kind: 'constitution', sourceName: 'SOUL.md' });
  }

  readWithOverlay(assistantId?: string): {
    constitution: ConstitutionReadResult;
    overlay: ConstitutionReadResult | null;
  } {
    const constitution = this.readConstitution();
    if (!assistantId || !SPECIALIST_ID_PATTERN.test(assistantId)) return { constitution, overlay: null };
    return { constitution, overlay: this.readSpecialist(assistantId) };
  }

  readSpecialist(id: string): ConstitutionReadResult {
    if (!SPECIALIST_ID_PATTERN.test(id))
      throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Invalid specialist id.');
    return this.readTarget({ kind: 'specialist', specialistId: id, sourceName: `${id}.md` });
  }

  listSpecialists(): { id: string; bytes: number; revision: ConstitutionRevision }[] {
    if (!this.ensureRoot(false)) return [];
    return inventoryConstitutionFsLiveTargets(this.root, randomUUID(), this.binary, this.readOptions())
      .filter((entry) => entry.startsWith('specialist:'))
      .map((entry) => entry.slice('specialist:'.length))
      .map((id) => {
        const read = this.readSpecialist(id);
        if (read.status !== 'present') {
          throw new ConstitutionFsTransactionError(
            'CONSTITUTION_FS_CONFLICT',
            'Specialist inventory changed during read.'
          );
        }
        return { id, bytes: Buffer.byteLength(read.content, 'utf8'), revision: read.revision };
      });
  }

  private mutate(
    target: ConstitutionFsTarget,
    content: string | null,
    expectedRevision: string,
    requestId = randomUUID()
  ): ConstitutionMutationResult {
    if (content !== null && Buffer.byteLength(content, 'utf8') > MAX_WRITE_BYTES) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_INVALID_REQUEST',
        'Constitution content exceeds its bound.'
      );
    }
    if (!UUID_PATTERN.test(requestId)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_INVALID_REQUEST',
        'Mutation request id must be a UUID.'
      );
    }
    const fingerprint = this.sha256(JSON.stringify({ target, content, expectedRevision }));
    const replay = this.committedRequests.get(requestId);
    if (replay) {
      if (replay.fingerprint !== fingerprint) {
        throw new ConstitutionFsTransactionError(
          'CONSTITUTION_FS_CONFLICT',
          'Mutation request id was reused for different content.'
        );
      }
      return replay.result;
    }
    const current = this.readTarget(target);
    this.assertExpectedRevision(target, current, expectedRevision);
    this.ensureMutationState();
    const transactionId = requestId;
    const expected =
      current.status === 'present'
        ? { present: true as const, sha256: this.sha256(current.content) }
        : { present: false as const };
    const archiveId = current.status === 'present' ? randomUUID() : undefined;
    const archivedAt = current.status === 'present' ? Date.now() : undefined;
    const archive =
      current.status === 'present'
        ? createAuthenticatedConstitutionArchive(
            {
              archiveId: archiveId!,
              archivedAt: archivedAt!,
              target,
              content: current.content,
              keyId: this.activeArchiveKeyId!,
            },
            this.archiveKeys!
          )
        : undefined;
    const receipt = runConstitutionFsTransaction(
      {
        version: 1,
        transactionId,
        root: this.root,
        operation: content === null ? 'delete' : 'replace',
        target,
        expected,
        ...(content === null
          ? {}
          : { replacement: { contentBase64: Buffer.from(content).toString('base64'), sha256: this.sha256(content) } }),
        ...(archive ? { archiveId, archivedAt, archive } : {}),
      },
      this.binary,
      this.mutationOptions()
    );
    const result = this.mutationResult(target, receipt);
    this.committedRequests.set(requestId, { fingerprint, result });
    if (this.committedRequests.size > 256) this.committedRequests.delete(this.committedRequests.keys().next().value!);
    return result;
  }

  private sha256(content: string): `sha256:${string}` {
    return `sha256:${createHash('sha256').update(content, 'utf8').digest('hex')}`;
  }

  private mutationResult(
    target: ConstitutionFsTarget,
    receipt: ConstitutionFsTransactionReceipt
  ): ConstitutionMutationResult {
    const next = this.readTarget(target);
    return {
      status: 'committed',
      revision: next.revision,
      transactionId: receipt.transactionId,
      receiptId: receipt.journalName,
    };
  }

  writeConstitution(content: string, expectedRevision: string, requestId?: string): ConstitutionMutationResult {
    const canonical = { kind: 'constitution', sourceName: 'CONSTITUTION.md' } as const;
    if (requestId && this.committedRequests.has(requestId)) {
      return this.mutate(canonical, content, this.revision(canonical, false), requestId);
    }
    const canonicalRead = this.readTarget(canonical);
    if (canonicalRead.status === 'present' && canonicalRead.revision === expectedRevision) {
      return this.mutate(canonical, content, expectedRevision, requestId);
    }
    const legacy = { kind: 'constitution', sourceName: 'SOUL.md' } as const;
    const legacyRead = this.readTarget(legacy);
    this.assertExpectedRevision(legacy, legacyRead, expectedRevision);
    if (canonicalRead.status !== 'absent') {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Canonical Constitution appeared during legacy migration.'
      );
    }
    // Retain SOUL.md after the canonical CAS commit. Deleting it in a second
    // transaction could fail after the canonical write had already committed,
    // making the API report failure for a successful mutation. Canonical reads
    // take precedence, so retention is safe and migration remains atomic.
    return this.mutate(canonical, content, canonicalRead.revision, requestId);
  }

  writeSpecialist(
    id: string,
    content: string,
    expectedRevision: string,
    requestId?: string
  ): ConstitutionMutationResult {
    if (!SPECIALIST_ID_PATTERN.test(id))
      throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Invalid specialist id.');
    return this.mutate(
      { kind: 'specialist', specialistId: id, sourceName: `${id}.md` },
      content,
      expectedRevision,
      requestId
    );
  }

  deleteSpecialist(id: string, expectedRevision: string, requestId?: string): ConstitutionMutationResult {
    if (!SPECIALIST_ID_PATTERN.test(id))
      throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Invalid specialist id.');
    return this.mutate(
      { kind: 'specialist', specialistId: id, sourceName: `${id}.md` },
      null,
      expectedRevision,
      requestId
    );
  }

  rotateArchiveKey(): string {
    this.ensureMutationState();
    const keyId = createAndSealConstitutionArchiveAuthenticationKey(
      this.root,
      this.binary,
      this.mutationOptions(),
      this.secretBackend
    );
    this.archiveKeys = loadConstitutionArchiveAuthenticationKeys(
      this.root,
      this.binary,
      this.baseMutationOptions(),
      this.secretBackend
    );
    this.keyStore!.setActiveArchiveKeyId(keyId);
    this.activeArchiveKeyId = keyId;
    return keyId;
  }

  private readArchiveRecord(archiveId: string): {
    payload: { contentBase64: string; sha256: `sha256:${string}` };
    metadata: ConstitutionArchiveMetadata;
    content: string;
    target: ConstitutionFsTarget;
  } {
    this.ensureArchiveReadState();
    const authenticated = readConstitutionFsArchive(
      this.root,
      randomUUID(),
      archiveId,
      this.binary,
      this.readOptions()
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(authenticated.record.toString('utf8')) as unknown;
    } catch {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_MALFORMED_RESPONSE',
        'Authenticated archive record is not JSON.'
      );
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_MALFORMED_RESPONSE',
        'Authenticated archive record is malformed.'
      );
    }
    const record = parsed as Record<string, unknown>;
    const target = authenticated.target;
    if (
      record.kind !== 'wayland-constitution-history' ||
      record.version !== 3 ||
      record.archiveId !== archiveId ||
      !Number.isSafeInteger(record.archivedAt) ||
      Number(record.archivedAt) < 0 ||
      JSON.stringify(record.target) !== JSON.stringify(target) ||
      typeof record.contentDigest !== 'string' ||
      !record.contentDigest.startsWith('hmac-sha256:') ||
      typeof record.content !== 'string'
    ) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_MALFORMED_RESPONSE',
        'Authenticated archive metadata is malformed.'
      );
    }
    return {
      payload: { contentBase64: authenticated.record.toString('base64'), sha256: authenticated.sha256 },
      content: record.content,
      target,
      metadata: {
        archiveId,
        archivedAt: Number(record.archivedAt),
        targetKind: target.kind,
        ...(target.kind === 'specialist' ? { specialistId: target.specialistId } : {}),
        sourceName: target.sourceName,
        bytes: Buffer.byteLength(record.content, 'utf8'),
      },
    };
  }

  listArchives(): ConstitutionArchiveMetadata[] {
    if (!this.ensureRoot(false)) return [];
    const active = inventoryConstitutionFsArchives(this.root, randomUUID(), this.binary, this.readOptions()).filter(
      (entry) => entry.startsWith('active:')
    );
    if (active.length === 0) return [];
    this.ensureArchiveReadState();
    return active
      .map((entry) => this.readArchiveRecord(entry.slice('active:'.length)).metadata)
      .toSorted((left, right) => right.archivedAt - left.archivedAt || left.archiveId.localeCompare(right.archiveId));
  }

  restoreArchive(archiveId: string, expectedRevision: string, requestId = randomUUID()): ConstitutionMutationResult {
    this.ensureMutationState();
    const active = inventoryConstitutionFsArchives(this.root, randomUUID(), this.binary, this.readOptions());
    if (!active.includes(`active:${archiveId}`)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Archive is not active and cannot be restored.'
      );
    }
    const source = this.readArchiveRecord(archiveId);
    const current = this.readTarget(source.target);
    this.assertExpectedRevision(source.target, current, expectedRevision);
    const expected =
      current.status === 'present'
        ? { present: true as const, sha256: this.sha256(current.content) }
        : { present: false as const };
    const displacedArchiveId = current.status === 'present' ? randomUUID() : undefined;
    const archivedAt = current.status === 'present' ? Date.now() : undefined;
    const displaced =
      current.status === 'present'
        ? createAuthenticatedConstitutionArchive(
            {
              archiveId: displacedArchiveId!,
              archivedAt: archivedAt!,
              target: source.target,
              content: current.content,
              keyId: this.activeArchiveKeyId!,
            },
            this.archiveKeys!
          )
        : undefined;
    const receipt = runConstitutionFsTransaction(
      {
        version: 1,
        transactionId: requestId,
        root: this.root,
        operation: 'restore',
        target: source.target,
        expected,
        sourceArchiveId: archiveId,
        sourceArchive: source.payload,
        ...(displaced ? { archiveId: displacedArchiveId, archivedAt, archive: displaced } : {}),
      },
      this.binary,
      this.mutationOptions()
    );
    return this.mutationResult(source.target, receipt);
  }
}

let constitutionFsService: ConstitutionFsService | null = null;
export function setConstitutionFsService(service: ConstitutionFsService): void {
  if (constitutionFsService && constitutionFsService !== service)
    throw new Error('ConstitutionFsService already initialized.');
  constitutionFsService = service;
}
export function getConstitutionFsService(): ConstitutionFsService {
  if (!constitutionFsService) throw new Error('ConstitutionFsService is not initialized.');
  return constitutionFsService;
}
