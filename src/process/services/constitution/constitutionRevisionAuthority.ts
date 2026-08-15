import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import type { ConstitutionArchiveSecretBackend } from './constitutionFsTransaction';
import { isConstitutionSecretUnlockTimeout } from './constitutionSecretUnlockBudget';
import { syncPublicationTargetSync } from '@process/utils/durabilitySync';

type RevisionKey = {
  keyId: string;
  keyBase64: string;
  createdAt: number;
  retiredAt: number | null;
};

export type ConstitutionRevisionRotationReceipt = Readonly<{
  receiptId: string;
  previousKeyId: string;
  nextKeyId: string;
  rotatedAt: number;
}>;

type RevisionAuthorityState = {
  schemaVersion: 3;
  activeKeyId: string;
  keys: RevisionKey[];
  rotationReceipts: ConstitutionRevisionRotationReceipt[];
};

export type ConstitutionRevisionAuthorityDependencies = Readonly<{
  syncPublication?: (authorityPath: string) => void;
  isProcessAlive?: (pid: number) => boolean;
  unlinkRotationLock?: (lockPath: string) => void;
}>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_AUTHORITY_BYTES = 64 * 1024;

/**
 * The authority file exists and is structurally safe, but this installation's
 * OS secret cannot open it — the ciphertext was sealed under a different app
 * identity (safeStorage keys by identity, so a worktree dev build and the
 * installed app are different identities), or it was tampered with.
 *
 * This is the same classification `constitutionArchiveRestoreAuthority` and
 * `constitutionClassicRecoveryAuthority` apply to a failed `decryptString`
 * (both raise their own `INTEGRITY_FAILURE`). Those two carry a typed error
 * class; this module has always signalled through exact `Error.message` codes
 * (`CONSTITUTION_FS_REVISION_AUTHORITY_*`) that its caller matches on, so the
 * classification is expressed in that existing shape rather than a second one.
 *
 * It is deliberately distinct from `_INVALID` (which means the plaintext did
 * not parse/validate): only this one is recoverable by the user, via restoring
 * a Constitution archive.
 */
export const CONSTITUTION_REVISION_AUTHORITY_UNAUTHENTICATED = 'CONSTITUTION_FS_REVISION_AUTHORITY_UNAUTHENTICATED';

/** True when `error` is the decrypt-failure classification raised by this module. */
export function isConstitutionRevisionAuthorityUnauthenticated(error: unknown): boolean {
  return error instanceof Error && error.message === CONSTITUTION_REVISION_AUTHORITY_UNAUTHENTICATED;
}

/**
 * The OS secret store already spent the whole unlock budget on this exact
 * ciphertext and gave nothing back, so it is not being attempted again.
 *
 * Kept separate from `_UNAUTHENTICATED` because the two mean opposite things
 * about the bytes. `_UNAUTHENTICATED` is evidence the ring belongs to another
 * installation, which is what justifies regenerating it. This one is evidence
 * about the STORE, not the ring: the ring may be perfectly good and simply
 * unreachable right now. Regenerating on it would destroy a healthy ring and
 * tell the user something untrue about why.
 */
export const CONSTITUTION_REVISION_AUTHORITY_UNLOCK_TIMEOUT = 'CONSTITUTION_FS_REVISION_AUTHORITY_UNLOCK_TIMEOUT';

/** True when `error` is the budget-exhausted classification raised by this module. */
export function isConstitutionRevisionAuthorityUnlockTimeout(error: unknown): boolean {
  return error instanceof Error && error.message === CONSTITUTION_REVISION_AUTHORITY_UNLOCK_TIMEOUT;
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).toSorted();
  const sortedExpected = [...expected].toSorted();
  return actual.length === sortedExpected.length && actual.every((key, index) => key === sortedExpected[index]);
}

function validTimestamp(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function parseKey(value: unknown): RevisionKey {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
  }
  const record = value as Record<string, unknown>;
  const decoded = Buffer.from(typeof record.keyBase64 === 'string' ? record.keyBase64 : '', 'base64');
  const valid =
    exactKeys(record, ['keyId', 'keyBase64', 'createdAt', 'retiredAt']) &&
    typeof record.keyId === 'string' &&
    UUID_PATTERN.test(record.keyId) &&
    typeof record.keyBase64 === 'string' &&
    decoded.byteLength === 32 &&
    decoded.toString('base64') === record.keyBase64 &&
    validTimestamp(record.createdAt) &&
    (record.retiredAt === null || validTimestamp(record.retiredAt));
  decoded.fill(0);
  if (!valid) throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
  return record as RevisionKey;
}

function parseReceipt(value: unknown): ConstitutionRevisionRotationReceipt | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
  }
  const record = value as Record<string, unknown>;
  if (
    !exactKeys(record, ['receiptId', 'previousKeyId', 'nextKeyId', 'rotatedAt']) ||
    typeof record.receiptId !== 'string' ||
    !UUID_PATTERN.test(record.receiptId) ||
    typeof record.previousKeyId !== 'string' ||
    !UUID_PATTERN.test(record.previousKeyId) ||
    typeof record.nextKeyId !== 'string' ||
    !UUID_PATTERN.test(record.nextKeyId) ||
    !validTimestamp(record.rotatedAt)
  ) {
    throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
  }
  return record as ConstitutionRevisionRotationReceipt;
}

function parseAuthority(raw: string): RevisionAuthorityState {
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
  }
  const record = value as Record<string, unknown>;
  if (
    !exactKeys(record, ['schemaVersion', 'activeKeyId', 'keys', 'rotationReceipts']) ||
    record.schemaVersion !== 3 ||
    typeof record.activeKeyId !== 'string' ||
    !UUID_PATTERN.test(record.activeKeyId) ||
    !Array.isArray(record.keys) ||
    record.keys.length < 1 ||
    record.keys.length > 8 ||
    !Array.isArray(record.rotationReceipts) ||
    record.rotationReceipts.length !== record.keys.length - 1
  ) {
    throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
  }
  const keys = record.keys.map(parseKey);
  const ids = new Set(keys.map((key) => key.keyId));
  const active = keys.find((key) => key.keyId === record.activeKeyId);
  const receipts = record.rotationReceipts.map((receiptValue) => parseReceipt(receiptValue));
  if (
    ids.size !== keys.length ||
    !active ||
    active.retiredAt !== null ||
    keys.some((key) => key.keyId !== record.activeKeyId && key.retiredAt === null) ||
    receipts.some((receipt) => !receipt) ||
    new Set(receipts.map((receipt) => receipt!.receiptId)).size !== receipts.length ||
    receipts.some((receipt, index) => {
      const previous = keys[index];
      const next = keys[index + 1];
      return (
        !receipt ||
        !previous ||
        !next ||
        receipt.previousKeyId !== previous.keyId ||
        receipt.nextKeyId !== next.keyId ||
        receipt.rotatedAt !== previous.retiredAt ||
        receipt.rotatedAt !== next.createdAt
      );
    }) ||
    (receipts.length > 0 && receipts.at(-1)?.nextKeyId !== record.activeKeyId)
  ) {
    throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
  }
  return {
    schemaVersion: 3,
    activeKeyId: record.activeKeyId,
    keys,
    rotationReceipts: receipts as ConstitutionRevisionRotationReceipt[],
  };
}

function assertSafeParent(authorityPath: string): void {
  const resolvedParent = path.resolve(path.dirname(authorityPath));
  const parsed = path.parse(resolvedParent);
  let current = parsed.root;
  for (const [index, segment] of resolvedParent.slice(parsed.root.length).split(path.sep).filter(Boolean).entries()) {
    current = path.join(current, segment);
    if (!existsSync(current)) break;
    const stat = lstatSync(current);
    // macOS exposes /tmp and /var as root-owned platform aliases. Canonicalize
    // only that first root segment; any lower symlink remains attacker-shaped.
    if (
      stat.isSymbolicLink() &&
      index === 0 &&
      process.platform === 'darwin' &&
      (segment === 'tmp' || segment === 'var')
    ) {
      current = realpathSync(current);
      continue;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_UNSAFE_PARENT');
    }
  }
}

function readAuthorityFile(authorityPath: string, backend: ConstitutionArchiveSecretBackend): RevisionAuthorityState {
  const stat = lstatSync(authorityPath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_AUTHORITY_BYTES) {
    throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
  }
  const ciphertext = readFileSync(authorityPath, 'utf8');
  let plaintext: string;
  try {
    plaintext = backend.decryptString(ciphertext);
  } catch (error) {
    // The store refusing to answer inside its budget is not evidence about who
    // sealed these bytes, so it must not be laundered into the classification
    // that authorizes regenerating them.
    if (isConstitutionSecretUnlockTimeout(error)) {
      throw new Error(CONSTITUTION_REVISION_AUTHORITY_UNLOCK_TIMEOUT, { cause: error });
    }
    // Never let the raw crypto failure escape. It is thrown on every read of a
    // foreign-identity authority, and unclassified it travels the whole
    // readAuthorityFile -> load -> readConstitution -> composePrompt ->
    // WCoreManager.start chain to land in the user's chat as a bare
    // "Error while decrypting the ciphertext provided to safeStorage" with no
    // remedy attached.
    throw new Error(CONSTITUTION_REVISION_AUTHORITY_UNAUTHENTICATED, { cause: error });
  }
  return parseAuthority(plaintext);
}

function writeTemporary(authorityPath: string, encrypted: string): string {
  assertSafeParent(authorityPath);
  const temporary = `${authorityPath}.${randomUUID()}.tmp`;
  const fd = openSync(temporary, 'wx', 0o600);
  try {
    writeFileSync(fd, encrypted, 'utf8');
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  return temporary;
}

export function constitutionRevisionDurabilitySyncPath(
  publishedPath: string,
  platform: NodeJS.Platform = process.platform
): string {
  // Windows cannot open directories through Node. Flushing the published file
  // is the established durable-publication fallback there; POSIX flushes the
  // containing directory so the rename/link metadata is committed.
  return platform === 'win32' ? publishedPath : path.dirname(publishedPath);
}

function fsyncParent(authorityPath: string): void {
  syncPublicationTargetSync(constitutionRevisionDurabilitySyncPath(authorityPath));
}

type RotationLockRecord = Readonly<{
  schemaVersion: 1;
  operation: 'rotate';
  pid: number;
  createdAt: number;
  lineageKeyId: string;
  previousKeyId: string;
  receiptId: string;
}>;

type RotationLock = Readonly<{
  fd: number | null;
  lockPath: string;
  receiptId: string;
  recoveredReceipt: ConstitutionRevisionRotationReceipt | null;
}>;

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
}

function readRotationLock(lockPath: string): RotationLockRecord | null {
  try {
    const stat = lstatSync(lockPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4096) return null;
    const value = JSON.parse(readFileSync(lockPath, 'utf8')) as Partial<RotationLockRecord>;
    if (
      !exactKeys(value, [
        'schemaVersion',
        'operation',
        'pid',
        'createdAt',
        'lineageKeyId',
        'previousKeyId',
        'receiptId',
      ]) ||
      value.schemaVersion !== 1 ||
      value.operation !== 'rotate' ||
      !Number.isSafeInteger(value.pid) ||
      Number(value.pid) <= 0 ||
      !validTimestamp(value.createdAt) ||
      typeof value.lineageKeyId !== 'string' ||
      !UUID_PATTERN.test(value.lineageKeyId) ||
      typeof value.previousKeyId !== 'string' ||
      !UUID_PATTERN.test(value.previousKeyId) ||
      typeof value.receiptId !== 'string' ||
      !UUID_PATTERN.test(value.receiptId)
    ) {
      return null;
    }
    return value as RotationLockRecord;
  } catch {
    return null;
  }
}

function acquireRotationLock(
  authorityPath: string,
  state: RevisionAuthorityState,
  dependencies: ConstitutionRevisionAuthorityDependencies
): RotationLock {
  const lockPath = `${authorityPath}.rotation.lock`;
  assertSafeParent(lockPath);
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const receiptId = randomUUID();
    let fd: number;
    try {
      fd = openSync(lockPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const stale = readRotationLock(lockPath);
      if (!stale || (dependencies.isProcessAlive ?? processIsAlive)(stale.pid)) {
        throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_ROTATION_BUSY', { cause: error });
      }
      if (stale.lineageKeyId !== state.keys[0]!.keyId) {
        throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_ROTATION_LOCK_INVALID', { cause: error });
      }
      const tombstone = `${lockPath}.${randomUUID()}.stale`;
      try {
        renameSync(lockPath, tombstone);
        fsyncParent(authorityPath);
        unlinkSync(tombstone);
        fsyncParent(authorityPath);
      } catch (reclaimError) {
        if ((reclaimError as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_ROTATION_LOCK_INVALID', { cause: reclaimError });
      }
      const recoveredReceipt = state.rotationReceipts.find(({ receiptId: id }) => id === stale.receiptId) ?? null;
      if (recoveredReceipt) {
        return { fd: null, lockPath, receiptId: stale.receiptId, recoveredReceipt };
      }
      continue;
    }
    try {
      const record: RotationLockRecord = {
        schemaVersion: 1,
        operation: 'rotate',
        pid: process.pid,
        createdAt: Date.now(),
        lineageKeyId: state.keys[0]!.keyId,
        previousKeyId: state.activeKeyId,
        receiptId,
      };
      writeFileSync(fd, JSON.stringify(record), 'utf8');
      fsyncSync(fd);
      fsyncParent(authorityPath);
      return { fd, lockPath, receiptId, recoveredReceipt: null };
    } catch (error) {
      closeSync(fd);
      try {
        unlinkSync(lockPath);
      } catch {
        /* preserve original failure */
      }
      throw error;
    }
  }
  throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_ROTATION_BUSY');
}

function releaseRotationLock(
  authorityPath: string,
  lock: RotationLock,
  dependencies: ConstitutionRevisionAuthorityDependencies
): void {
  if (lock.fd === null) return;
  closeSync(lock.fd);
  (dependencies.unlinkRotationLock ?? unlinkSync)(lock.lockPath);
  fsyncParent(authorityPath);
}

/** OS-secret-backed revision authority stored outside the mutable Wayland root. */
export class ConstitutionRevisionAuthority {
  private constructor(
    private readonly authorityPath: string,
    private readonly backend: ConstitutionArchiveSecretBackend,
    private state: RevisionAuthorityState,
    private readonly dependencies: ConstitutionRevisionAuthorityDependencies = {}
  ) {}

  static load(
    authorityPath: string,
    backend: ConstitutionArchiveSecretBackend,
    dependencies: ConstitutionRevisionAuthorityDependencies = {}
  ): ConstitutionRevisionAuthority | null {
    if (!existsSync(authorityPath)) return null;
    return new ConstitutionRevisionAuthority(
      authorityPath,
      backend,
      readAuthorityFile(authorityPath, backend),
      dependencies
    );
  }

  static loadOrCreate(
    authorityPath: string,
    backend: ConstitutionArchiveSecretBackend,
    dependencies: ConstitutionRevisionAuthorityDependencies = {}
  ): ConstitutionRevisionAuthority {
    const existing = ConstitutionRevisionAuthority.load(authorityPath, backend, dependencies);
    if (existing) return existing;

    assertSafeParent(authorityPath);
    mkdirSync(path.dirname(authorityPath), { recursive: true, mode: 0o700 });
    assertSafeParent(authorityPath);
    const key = randomBytes(32);
    const keyId = randomUUID();
    const state: RevisionAuthorityState = {
      schemaVersion: 3,
      activeKeyId: keyId,
      keys: [{ keyId, keyBase64: key.toString('base64'), createdAt: Date.now(), retiredAt: null }],
      rotationReceipts: [],
    };
    key.fill(0);
    const temporary = writeTemporary(authorityPath, backend.encryptString(JSON.stringify(state)));
    let published = false;
    try {
      // link(2) is the no-replace publication point. A check-then-rename would
      // let a concurrent creator's authority be silently overwritten.
      linkSync(temporary, authorityPath);
      published = true;
      unlinkSync(temporary);
      (dependencies.syncPublication ?? fsyncParent)(authorityPath);
    } catch (error) {
      try {
        unlinkSync(temporary);
      } catch {
        /* preserve original failure */
      }
      if (!published && (error as NodeJS.ErrnoException).code === 'EEXIST') {
        const winner = ConstitutionRevisionAuthority.load(authorityPath, backend, dependencies);
        if (winner) return winner;
        throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_RACE', { cause: error });
      }
      if (published) {
        // Publication and durability are separate gates. Never reinterpret our
        // own post-link sync failure as a concurrent winner and return success.
        throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_PUBLICATION_NOT_DURABLE', { cause: error });
      }
      throw error;
    }
    return new ConstitutionRevisionAuthority(authorityPath, backend, state, dependencies);
  }

  keyId(): string {
    return this.state.activeKeyId;
  }

  /** Stable identity for the authority lineage; unlike activeKeyId it survives rotation. */
  lineageKeyId(): string {
    return this.state.keys[0]!.keyId;
  }

  keyIds(): readonly string[] {
    return this.state.keys.map(({ keyId }) => keyId);
  }

  keyDigest(): `sha256:${string}` {
    const key = this.key();
    try {
      return `sha256:${createHash('sha256').update(key).digest('hex')}`;
    } finally {
      key.fill(0);
    }
  }

  key(keyId = this.state.activeKeyId): Buffer {
    const record = this.state.keys.find((candidate) => candidate.keyId === keyId);
    if (!record) throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
    return Buffer.from(record.keyBase64, 'base64');
  }

  lastRotationReceipt(): ConstitutionRevisionRotationReceipt | null {
    return this.state.rotationReceipts.at(-1) ?? null;
  }

  rotationReceipts(): readonly ConstitutionRevisionRotationReceipt[] {
    return this.state.rotationReceipts.map((receipt) => ({ ...receipt }));
  }

  /** Prove the process-cached authority is still the exact durable authority. */
  assertPersisted(): void {
    if (!existsSync(this.authorityPath)) {
      throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_MISSING');
    }
    const persisted = readAuthorityFile(this.authorityPath, this.backend);
    if (JSON.stringify(persisted) !== JSON.stringify(this.state)) {
      throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_REPLACED');
    }
  }

  rotate(): ConstitutionRevisionRotationReceipt {
    const lock = acquireRotationLock(this.authorityPath, this.state, this.dependencies);
    if (lock.recoveredReceipt) return lock.recoveredReceipt;
    let committedReceipt: ConstitutionRevisionRotationReceipt | null = null;
    let primaryError: unknown;
    try {
      // The exact persisted-state comparison is inside the interprocess lock;
      // no second rotator can pass the check and erase this publication.
      this.assertPersisted();
      if (this.state.keys.length >= 8) {
        throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_RETENTION_REQUIRED');
      }
      const previousKeyId = this.state.activeKeyId;
      const rotatedAt = Date.now();
      const nextKey = randomBytes(32);
      const nextKeyId = randomUUID();
      const receipt: ConstitutionRevisionRotationReceipt = {
        receiptId: lock.receiptId,
        previousKeyId,
        nextKeyId,
        rotatedAt,
      };
      const next: RevisionAuthorityState = {
        schemaVersion: 3,
        activeKeyId: nextKeyId,
        keys: [
          ...this.state.keys.map((key) =>
            key.keyId === previousKeyId && key.retiredAt === null ? { ...key, retiredAt: rotatedAt } : key
          ),
          { keyId: nextKeyId, keyBase64: nextKey.toString('base64'), createdAt: rotatedAt, retiredAt: null },
        ],
        rotationReceipts: [...this.state.rotationReceipts, receipt],
      };
      nextKey.fill(0);
      const temporary = writeTemporary(this.authorityPath, this.backend.encryptString(JSON.stringify(next)));
      try {
        renameSync(temporary, this.authorityPath);
        fsyncParent(this.authorityPath);
      } catch (error) {
        try {
          unlinkSync(temporary);
        } catch {
          /* preserve original failure */
        }
        throw error;
      }
      const published = readAuthorityFile(this.authorityPath, this.backend);
      if (JSON.stringify(published) !== JSON.stringify(next)) {
        throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_REPLACED');
      }
      this.state = next;
      committedReceipt = receipt;
    } catch (error) {
      primaryError = error;
    }
    let releaseError: unknown;
    try {
      releaseRotationLock(this.authorityPath, lock, this.dependencies);
    } catch (error) {
      // Once the authority and receipt are durably published, lock cleanup
      // cannot turn success into an ambiguous retry that rotates twice. The
      // stale owner record remains recoverable after this process exits.
      releaseError = error;
    }
    if (primaryError) throw primaryError;
    if (!committedReceipt && releaseError) throw releaseError;
    if (!committedReceipt) throw new Error('CONSTITUTION_FS_REVISION_AUTHORITY_ROTATION_FAILED');
    return committedReceipt;
  }
}
