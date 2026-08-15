import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { decryptString, encryptString } from '@process/secrets/safeStorage';
import {
  ConstitutionFsBinaryError,
  verifyPackagedConstitutionFsBinary,
  type VerifiedConstitutionFsBinary,
} from './constitutionFsBinary';
import { ConstitutionKeyStore } from './constitutionKeyStore';
import {
  ConstitutionRevisionAuthority,
  constitutionRevisionDurabilitySyncPath,
  isConstitutionRevisionAuthorityUnauthenticated,
  isConstitutionRevisionAuthorityUnlockTimeout,
  type ConstitutionRevisionRotationReceipt,
} from './constitutionRevisionAuthority';
import {
  ConstitutionFsTransactionError,
  createAndSealConstitutionArchiveAuthenticationKey,
  createAuthenticatedConstitutionArchive,
  ensureConstitutionArchiveAuthenticationKey,
  inventoryConstitutionFsArchives,
  inventoryConstitutionFsLiveTargets,
  inventoryPendingConstitutionFsTransactionDetails,
  loadConstitutionArchiveAuthenticationKeys,
  lookupCommittedConstitutionFsMigration,
  lookupCommittedConstitutionFsTransaction,
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
import {
  createConstitutionRequestFingerprint,
  sameConstitutionFingerprintTarget,
} from './constitutionRequestFingerprint';
import {
  CONSTITUTION_SECRET_UNLOCK_TIMEOUT,
  withConstitutionSecretUnlockBudget,
} from './constitutionSecretUnlockBudget';
import { compareUnicodeCodeUnits } from '../../utils/restrictedCanonicalJson';
import { syncPublicationTargetSync } from '@process/utils/durabilitySync';

/**
 * The unreadable revision key ring is kept, never destroyed. `.locked-` names
 * the reason and the timestamp keeps repeat reclaims from colliding, so a
 * profile that was unlocked, re-sealed and unlocked again keeps every generation
 * side by side for a support bundle or a manual restore.
 */
export function constitutionLockedAuthorityArchivePath(authorityPath: string, at: Date): string {
  const stamp = at
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  const base = `${authorityPath}.locked-${stamp}`;
  if (!existsSync(base)) return base;
  for (let attempt = 2; attempt < 1000; attempt += 1) {
    const candidate = `${base}-${attempt}`;
    if (!existsSync(candidate)) return candidate;
  }
  return `${base}-${randomUUID()}`;
}

/** Recorded when an unreadable revision key ring was reclaimed on this run. */
export type ConstitutionRevisionAuthorityReclaim = Readonly<{
  /** Where the original, still-encrypted ring was preserved. */
  archivedPath: string;
  reclaimedAt: number;
}>;

const MAX_WRITE_BYTES = 256 * 1024;
const SPECIALIST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEGACY_REVISION_MIGRATION_SCHEMA = 1;

type LegacyRevisionMigrationMarker = {
  schemaVersion: 1;
  state: 'intent' | 'complete';
  legacyJournalKeySha256: `sha256:${string}`;
  authorityKeyId: string | null;
};

function durableSyncPublished(filePath: string): void {
  syncPublicationTargetSync(constitutionRevisionDurabilitySyncPath(filePath));
}

function writeDurableMigrationMarker(filePath: string, marker: LegacyRevisionMigrationMarker, replace: boolean): void {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.${randomUUID()}.tmp`;
  const fd = openSync(temporary, 'wx', 0o600);
  try {
    writeFileSync(fd, JSON.stringify(marker), 'utf8');
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    if (replace) renameSync(temporary, filePath);
    else {
      linkSync(temporary, filePath);
      unlinkSync(temporary);
    }
    durableSyncPublished(filePath);
  } catch (error) {
    try {
      unlinkSync(temporary);
    } catch {
      /* preserve original failure */
    }
    throw error;
  }
}

function readLegacyRevisionMigrationMarker(filePath: string): LegacyRevisionMigrationMarker | null {
  if (!existsSync(filePath)) return null;
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  } catch {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE',
      'Legacy revision migration marker is unreadable.'
    );
  }
  const marker = value as Partial<LegacyRevisionMigrationMarker>;
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).toSorted().join(',') !== 'authorityKeyId,legacyJournalKeySha256,schemaVersion,state' ||
    marker.schemaVersion !== LEGACY_REVISION_MIGRATION_SCHEMA ||
    (marker.state !== 'intent' && marker.state !== 'complete') ||
    typeof marker.legacyJournalKeySha256 !== 'string' ||
    !/^sha256:[a-f0-9]{64}$/.test(marker.legacyJournalKeySha256) ||
    (marker.authorityKeyId !== null &&
      (typeof marker.authorityKeyId !== 'string' || !UUID_PATTERN.test(marker.authorityKeyId))) ||
    (marker.state === 'intent' && marker.authorityKeyId !== null) ||
    (marker.state === 'complete' && marker.authorityKeyId === null)
  ) {
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE',
      'Legacy revision migration marker is invalid.'
    );
  }
  return marker as LegacyRevisionMigrationMarker;
}

export type ConstitutionRevision = string & { readonly __constitutionRevision: unique symbol };
export type ConstitutionReadResult =
  | { status: 'absent'; revision: ConstitutionRevision }
  | { status: 'present'; content: string; revision: ConstitutionRevision };
export type ConstitutionMutationResult = {
  status: 'committed';
  revision: ConstitutionRevision;
  transactionId: string;
  receiptId: string;
  requestFingerprint: `sha256:${string}`;
};
export type ConstitutionArchiveMetadata = {
  archiveId: string;
  archivedAt: number;
  targetKind: ConstitutionFsTarget['kind'];
  specialistId?: string;
  sourceName: string;
  bytes: number;
  targetRevision: ConstitutionRevision;
};
export type ConstitutionPreparedArchiveRestore = Readonly<{
  archiveId: string;
  target: ConstitutionFsTarget;
  contentSha256: `sha256:${string}`;
  archiveRevision: ConstitutionRevision;
}>;
export type ConstitutionRestoreLookupResult =
  | Readonly<{ outcome: 'committed'; result: ConstitutionMutationResult }>
  | Readonly<{ outcome: 'not_found' | 'rolled_back' }>;
export type ConstitutionFsCapability =
  | { supported: true }
  | { supported: false; code: 'CONSTITUTION_FS_UNSAFE_PLATFORM'; reason: string };

type ConstitutionFsProductionOptions = {
  root?: string;
  revisionAuthorityPath?: string;
  verifyPackagedBinary?: (resourcesPath: string) => VerifiedConstitutionFsBinary;
  secretBackend?: ConstitutionArchiveSecretBackend;
};

export class ConstitutionFsService {
  private rootAuthority: ReturnType<typeof pinConstitutionFsRootAuthority> | null;
  private keyStore: ConstitutionKeyStore | null;
  private archiveKeys: ConstitutionArchiveAuthenticationKeyInventory | null = null;
  private activeArchiveKeyId: string | null = null;
  private mutationStateReady = false;
  private revisionAuthority: ConstitutionRevisionAuthority | null = null;
  private revisionAuthorityReclaim: ConstitutionRevisionAuthorityReclaim | null = null;
  private revisionAuthorityReclaimAttempted = false;

  constructor(
    private readonly root: string,
    private readonly binaryState: VerifiedConstitutionFsBinary | ConstitutionFsBinaryError,
    private readonly secretBackend: ConstitutionArchiveSecretBackend,
    keyStore: ConstitutionKeyStore | undefined,
    private readonly revisionAuthorityPath: string | null,
    private readonly afterLegacyMigration?: () => void,
    private readonly afterRevisionAuthorityPublication?: () => void
  ) {
    this.rootAuthority =
      binaryState instanceof ConstitutionFsBinaryError
        ? null
        : existsSync(root)
          ? pinConstitutionFsRootAuthority(root)
          : null;
    this.keyStore = keyStore ?? null;
  }

  static createProduction(
    resourcesPath = process.resourcesPath,
    options: ConstitutionFsProductionOptions = {}
  ): ConstitutionFsService {
    const configuredRoot = options.root ?? path.join(os.homedir(), '.wayland');
    // The configured root is routinely a symlink into platform app-data
    // (e.g. ~/.wayland -> ~/Library/Application Support/Wayland/wayland). The
    // device/inode identity pin uses lstat and rejects symlinks outright, which
    // would throw here and crash bootstrap on every install using that layout.
    // Canonicalize an existing root so the pin binds the real directory; any
    // post-pin swap still trips the identity-mismatch guard, so the anti-redirect
    // guarantee is preserved. A not-yet-created root is left as-is and created
    // lazily on first write.
    const root = existsSync(configuredRoot) ? realpathSync.native(configuredRoot) : configuredRoot;
    // Bound the OS secret store on the Constitution path. See
    // constitutionSecretUnlockBudget for exactly what this can and cannot stop.
    const secretBackend =
      options.secretBackend ??
      withConstitutionSecretUnlockBudget(
        { encryptString, decryptString },
        {
          onBudgetExceeded: (elapsedMs) =>
            console.warn(
              `[constitution] OS secret store took ${elapsedMs}ms to answer an unlock; further Constitution unlocks fail fast instead of blocking each turn.`
            ),
        }
      );
    try {
      const binary = (options.verifyPackagedBinary ?? verifyPackagedConstitutionFsBinary)(resourcesPath);
      if (!options.revisionAuthorityPath) {
        throw new ConstitutionFsTransactionError(
          'CONSTITUTION_FS_INVALID_REQUEST',
          'Production Constitution revision authority requires an explicit app userData path.'
        );
      }
      return new ConstitutionFsService(root, binary, secretBackend, undefined, options.revisionAuthorityPath);
    } catch (error) {
      if (error instanceof ConstitutionFsBinaryError && error.code === 'CONSTITUTION_FS_UNSAFE_PLATFORM') {
        return new ConstitutionFsService(root, error, secretBackend, undefined, null);
      }
      throw error;
    }
  }

  capability(): ConstitutionFsCapability {
    return this.binaryState instanceof ConstitutionFsBinaryError
      ? { supported: false, code: 'CONSTITUTION_FS_UNSAFE_PLATFORM', reason: this.binaryState.message }
      : { supported: true };
  }

  private get binary(): VerifiedConstitutionFsBinary {
    if (this.binaryState instanceof ConstitutionFsBinaryError) {
      throw new ConstitutionFsTransactionError(this.binaryState.code, this.binaryState.message);
    }
    return this.binaryState;
  }

  private ensureRoot(create: boolean): ReturnType<typeof pinConstitutionFsRootAuthority> | null {
    // Capability is checked before observing or creating any user state. An
    // unsupported packaged authority degrades Constitution only; it must not
    // crash app startup, mint a fake backend, or touch ~/.wayland.
    void this.binary;
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
    if (!this.keyStore && existsSync(path.join(this.root, '.constitution-keys.enc'))) {
      this.keyStore = new ConstitutionKeyStore(this.root, this.secretBackend);
    }
    // A pre-v2 root with no authenticated transaction history can be inspected
    // without minting key state. The helper still receives a correctly-sized
    // key and will reject any forged/partial journal that appears.
    const journalAuthenticationKey = this.keyStore?.journalKey() ?? Buffer.alloc(32);
    return {
      rootAuthority,
      journalAuthenticationKey,
      ...(this.archiveKeys ? { archiveAuthenticationKeys: this.archiveKeys } : {}),
    };
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
    const revisionAuthority = this.ensureRevisionAuthorityForMutation();
    this.ensureRoot(true);
    this.keyStore ??= new ConstitutionKeyStore(this.root, this.secretBackend);
    this.persistRevisionAuthorityBindingMarker(revisionAuthority);
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

  private hasAuthenticatedTransactionState(): boolean {
    return (
      existsSync(path.join(this.root, '.constitution-keys.enc')) ||
      existsSync(path.join(this.root, 'archives', 'constitution-history', 'transaction-ledger.jsonl')) ||
      existsSync(path.join(this.root, 'archives', 'constitution-history', 'transactions'))
    );
  }

  /**
   * Bind (or re-bind) the legacy migration marker to a revision authority.
   *
   * The marker has two halves and they fail closed for different reasons. The
   * journal-key digest proves the marker belongs to THIS profile's
   * authenticated transaction state, and is never relaxed by any caller: a
   * grafted or swapped profile still quarantines. The authority key id names
   * the ring lineage, and a `reclaimed` caller is allowed to move it, because
   * that caller has just preserved the ring it named and minted a verified
   * replacement in its place. Without that distinction the reclaim is inert on
   * exactly the profiles that have a Constitution, which is every profile that
   * hits the defect.
   */
  private persistRevisionAuthorityBindingMarker(
    authority: ConstitutionRevisionAuthority,
    intent: 'bind' | 'reclaimed' = 'bind'
  ): void {
    if (!this.revisionAuthorityPath || !this.keyStore) return;
    const markerPath = `${this.revisionAuthorityPath}.legacy-v1-migration.json`;
    const existing = readLegacyRevisionMigrationMarker(markerPath);
    const journalKey = this.keyStore.journalKey();
    const legacyJournalKeySha256 = `sha256:${createHash('sha256').update(journalKey).digest('hex')}` as const;
    journalKey.fill(0);
    if (
      existing &&
      (existing.legacyJournalKeySha256 !== legacyJournalKeySha256 ||
        (existing.state === 'complete' &&
          existing.authorityKeyId !== authority.lineageKeyId() &&
          intent !== 'reclaimed'))
    ) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE',
        'Revision authority binding disagrees with authenticated transaction state or its authority key.'
      );
    }
    if (existing?.state === 'complete' && existing.authorityKeyId === authority.lineageKeyId()) return;
    writeDurableMigrationMarker(
      markerPath,
      {
        schemaVersion: 1,
        state: 'complete',
        legacyJournalKeySha256,
        authorityKeyId: authority.lineageKeyId(),
      },
      Boolean(existing)
    );
  }

  private migrateLegacyRevisionAuthority(): ConstitutionRevisionAuthority {
    if (!this.revisionAuthorityPath) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_INVALID_REQUEST',
        'Constitution revision authority requires an explicit app userData path.'
      );
    }
    const markerPath = `${this.revisionAuthorityPath}.legacy-v1-migration.json`;
    let marker = readLegacyRevisionMigrationMarker(markerPath);
    if (marker?.state === 'complete') {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE',
        'Revision authority was removed after legacy state migration; Constitution state is quarantined.'
      );
    }
    // Authenticate the old key store, archive key inventory, ledger, journals,
    // and pending recovery facts before minting any v2 revision authority.
    this.ensureArchiveReadState();
    this.reconcilePendingTransactions();
    inventoryConstitutionFsLiveTargets(this.root, randomUUID(), this.binary, this.readOptions());
    const journalKey = this.keyStore!.journalKey();
    const legacyJournalKeySha256 = `sha256:${createHash('sha256').update(journalKey).digest('hex')}` as const;
    journalKey.fill(0);
    if (marker && marker.legacyJournalKeySha256 !== legacyJournalKeySha256) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE',
        'Legacy revision migration intent does not match authenticated transaction state.'
      );
    }
    if (!marker) {
      try {
        writeDurableMigrationMarker(
          markerPath,
          { schemaVersion: 1, state: 'intent', legacyJournalKeySha256, authorityKeyId: null },
          false
        );
        marker = readLegacyRevisionMigrationMarker(markerPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        marker = readLegacyRevisionMigrationMarker(markerPath);
      }
      if (!marker || marker.legacyJournalKeySha256 !== legacyJournalKeySha256) {
        throw new ConstitutionFsTransactionError(
          'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE',
          'Concurrent legacy revision migration intent disagrees with authenticated transaction state.'
        );
      }
    }
    const authority = ConstitutionRevisionAuthority.loadOrCreate(this.revisionAuthorityPath, this.secretBackend);
    this.afterRevisionAuthorityPublication?.();
    writeDurableMigrationMarker(
      markerPath,
      {
        schemaVersion: 1,
        state: 'complete',
        legacyJournalKeySha256,
        authorityKeyId: authority.lineageKeyId(),
      },
      true
    );
    return authority;
  }

  /**
   * Single classification point for a revision authority this installation
   * cannot unlock. Every load path below (cached re-verify, first load, legacy
   * migration, create) reads the same encrypted file through the same backend,
   * so the decrypt-failure classification is mapped once here into the typed
   * code the rest of the process (and the chat surface) can branch on, instead
   * of the raw crypto error escaping to the user.
   */
  private revisionAuthorityForRead(): ConstitutionRevisionAuthority | null {
    try {
      return this.loadRevisionAuthorityForRead();
    } catch (error) {
      if (isConstitutionRevisionAuthorityUnlockTimeout(error)) {
        // The store spent the whole budget on this blob and gave nothing back.
        // That says nothing about who sealed it, so the ring is left exactly
        // where it is and the user is told the truth instead of being told
        // their ring came from another installation.
        this.revisionAuthorityReclaim = null;
        throw new ConstitutionFsTransactionError(
          CONSTITUTION_SECRET_UNLOCK_TIMEOUT,
          'The system keychain on this machine did not answer in time when Wayland tried to unlock the Constitution key ring, so Wayland stopped waiting rather than leaving this chat hanging. Nothing was changed. Try again, and restart Wayland if it keeps happening.'
        );
      }
      if (!isConstitutionRevisionAuthorityUnauthenticated(error)) throw error;
      // The authority is a key ring, not the Constitution: its keys only sign
      // and check the short-lived `rev:v2:` compare-and-swap tokens a read hands
      // back on the next write. It holds no user content, and the Constitution
      // itself ships bundled and is not sealed with it. Losing it therefore
      // costs at most an in-flight token (which fails closed as a CONFLICT), so
      // an unreadable ring must not be allowed to kill every turn forever.
      const reclaimed = this.reclaimUnreadableRevisionAuthority();
      if (reclaimed) return reclaimed;
      // A reclaim earlier in this same read did not, in the end, rescue it.
      // Reporting "we fixed it and carried on" for a turn that died would be
      // worse than saying nothing.
      this.revisionAuthorityReclaim = null;
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_REVISION_AUTHORITY_UNAUTHENTICATED',
        'The Constitution revision authority on this machine could not be unlocked. It was encrypted by a different installation of this app, so its contents cannot be read here. Open Settings > Constitution to restore from a recovery archive.'
      );
    }
  }

  /**
   * Reclaim a revision authority this installation cannot unlock.
   *
   * The unreadable ciphertext is the user's data and is never deleted or
   * overwritten: it is renamed aside to a timestamped `.locked-` sidecar first,
   * and only then is a fresh ring minted in its place. The replacement is not
   * accepted until this installation has read it back off disk, and the legacy
   * migration binding is not moved to the new lineage until after that proof.
   *
   * If any step fails, the sidecar is renamed back over whatever half-built
   * replacement exists, so the ring is at its canonical path with its original
   * bytes, no sidecar is left behind, the migration binding is untouched, and
   * the caller reports the original unlock failure - recovery through Settings
   * remains the outcome for the cases that genuinely need it.
   *
   * Returns null when nothing was reclaimed.
   */
  private reclaimUnreadableRevisionAuthority(): ConstitutionRevisionAuthority | null {
    // Once per service, never in a loop. A ring this installation just minted
    // and still cannot unlock means the OS secret store itself is unusable, not
    // that the ring was foreign; minting another would churn the profile and
    // hide a real fault. Stop and let the recovery flow answer instead.
    if (this.revisionAuthorityReclaimAttempted) return null;
    this.revisionAuthorityReclaimAttempted = true;
    const authorityPath = this.revisionAuthorityPath;
    if (!authorityPath || !existsSync(authorityPath)) return null;
    const archivedPath = constitutionLockedAuthorityArchivePath(authorityPath, new Date());
    try {
      renameSync(authorityPath, archivedPath);
    } catch {
      // Could not even preserve it; leave the profile untouched and report.
      return null;
    }
    this.revisionAuthority = null;
    try {
      const authority = this.mintReclaimedRevisionAuthority(authorityPath);
      console.warn(
        `[constitution] The Constitution revision key ring on this machine could not be unlocked (it was sealed by a different installation of this app). A new ring was created so work can continue; the unreadable one was kept at ${archivedPath}.`
      );
      this.revisionAuthorityReclaim = { archivedPath, reclaimedAt: Date.now() };
      return authority;
    } catch {
      this.revisionAuthority = null;
      try {
        renameSync(archivedPath, authorityPath);
      } catch {
        // The sidecar still holds every original byte; never delete it.
      }
      return null;
    }
  }

  /**
   * Mint the replacement ring for a reclaim, with the same authentication
   * discipline a first load applies to legacy state.
   *
   * Deliberately NOT routed through `loadRevisionAuthorityForRead`. That path
   * cannot tell "the ring was preserved a moment ago by this reclaim" from "the
   * ring is gone", so on any profile that has ever written a Constitution it
   * sees a `complete` migration marker with the authority absent and refuses -
   * which made the whole reclaim inert on precisely the profiles that have the
   * defect. Here the intent is explicit: authenticate the legacy state, mint,
   * prove the new ring opens, and only then move the binding to it.
   */
  private mintReclaimedRevisionAuthority(authorityPath: string): ConstitutionRevisionAuthority {
    const marker = readLegacyRevisionMigrationMarker(`${authorityPath}.legacy-v1-migration.json`);
    const authenticated = this.hasAuthenticatedTransactionState();
    if (marker && !authenticated) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE',
        'Revision authority binding exists without its authenticated Constitution state.'
      );
    }
    if (authenticated) {
      // Authenticate the key store, archive key inventory, ledger, journals and
      // live targets BEFORE a new lineage exists to be bound to them.
      this.ensureArchiveReadState();
      this.reconcilePendingTransactions();
      inventoryConstitutionFsLiveTargets(this.root, randomUUID(), this.binary, this.readOptions());
    }
    const authority = ConstitutionRevisionAuthority.loadOrCreate(authorityPath, this.secretBackend);
    // Prove this installation can OPEN what it just sealed. A secret store that
    // seals fine and reads nothing is not a foreign ring, and accepting the
    // mint there would leave the user's ring displaced by a replacement nobody
    // can read while the read fails anyway.
    authority.assertPersisted();
    if (authenticated) this.persistRevisionAuthorityBindingMarker(authority, 'reclaimed');
    this.revisionAuthority = authority;
    return authority;
  }

  /**
   * Take the pending "the key ring was reclaimed" fact, if there is one.
   *
   * One-shot on purpose: the surface above turns it into a single non-blocking
   * in-thread notice on the turn that reclaimed it, not a banner that repeats
   * on every subsequent turn.
   */
  consumeRevisionAuthorityReclaim(): ConstitutionRevisionAuthorityReclaim | null {
    const reclaim = this.revisionAuthorityReclaim;
    this.revisionAuthorityReclaim = null;
    return reclaim;
  }

  private loadRevisionAuthorityForRead(): ConstitutionRevisionAuthority | null {
    if (this.revisionAuthority) {
      try {
        this.revisionAuthority.assertPersisted();
      } catch (error) {
        // An unlock failure is its own recoverable classification; do not
        // relabel it as a removed/replaced authority.
        if (isConstitutionRevisionAuthorityUnauthenticated(error)) throw error;
        throw new ConstitutionFsTransactionError(
          'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE',
          `Revision authority was removed, replaced, or corrupted while Constitution state is active: ${
            error instanceof Error ? error.message : 'unknown authority failure'
          }`
        );
      }
      return this.revisionAuthority;
    }
    if (!this.revisionAuthorityPath) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_INVALID_REQUEST',
        'Constitution revision authority requires an explicit app userData path.'
      );
    }
    const loaded = ConstitutionRevisionAuthority.load(this.revisionAuthorityPath, this.secretBackend);
    if (loaded) {
      const markerPath = `${this.revisionAuthorityPath}.legacy-v1-migration.json`;
      const marker = readLegacyRevisionMigrationMarker(markerPath);
      if (this.hasAuthenticatedTransactionState() || marker) {
        if (!this.hasAuthenticatedTransactionState()) {
          throw new ConstitutionFsTransactionError(
            'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE',
            'Revision authority binding exists without its authenticated Constitution state.'
          );
        }
        // A process may crash after publishing the authority but before
        // completing the durable binding marker. Re-authenticate the exact
        // legacy state and complete (or verify) that binding on restart.
        this.ensureArchiveReadState();
        this.reconcilePendingTransactions();
        inventoryConstitutionFsLiveTargets(this.root, randomUUID(), this.binary, this.readOptions());
        this.persistRevisionAuthorityBindingMarker(loaded);
      }
      this.revisionAuthority = loaded;
      return loaded;
    }
    if (this.hasAuthenticatedTransactionState()) {
      this.revisionAuthority = this.migrateLegacyRevisionAuthority();
      return this.revisionAuthority;
    }
    this.revisionAuthority = ConstitutionRevisionAuthority.loadOrCreate(this.revisionAuthorityPath, this.secretBackend);
    return this.revisionAuthority;
  }

  private ensureRevisionAuthorityForMutation(): ConstitutionRevisionAuthority {
    return this.revisionAuthorityForRead()!;
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
    const storedActive = this.keyStore.activeArchiveKeyId();
    if (!storedActive) {
      // Bootstrap is a durable multi-publication sequence: the encrypted
      // journal key can exist before the first sealed archive key and its
      // active-key pointer. Resume that exact sequence instead of treating a
      // crash between those publications as permanent corruption. The native
      // ensure operation authenticates/reuses an already sealed key when the
      // crash happened after seal publication.
      const ensured = ensureConstitutionArchiveAuthenticationKey(
        this.root,
        this.binary,
        this.baseMutationOptions(),
        this.secretBackend
      );
      this.archiveKeys = loadConstitutionArchiveAuthenticationKeys(
        this.root,
        this.binary,
        this.baseMutationOptions(),
        this.secretBackend
      );
      if (!this.archiveKeys.keyIds.includes(ensured.keyId)) {
        throw new ConstitutionFsTransactionError(
          'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
          'Resumed bootstrap archive key is absent from the helper-anchored key inventory.'
        );
      }
      this.keyStore.setActiveArchiveKeyId(ensured.keyId);
      this.activeArchiveKeyId = ensured.keyId;
      return;
    }
    this.archiveKeys = loadConstitutionArchiveAuthenticationKeys(
      this.root,
      this.binary,
      this.baseMutationOptions(),
      this.secretBackend
    );
    if (!this.archiveKeys.keyIds.includes(storedActive)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE',
        'Persisted active archive key is absent from the helper-anchored key inventory.'
      );
    }
    this.activeArchiveKeyId = storedActive;
  }

  private revision(target: ConstitutionFsTarget, present: boolean, sha256?: string): ConstitutionRevision {
    const authority = this.revisionAuthorityForRead()!;
    // The authority this key id came from is handed straight on. Re-resolving
    // it would re-read the file, and a reclaim landing between the two reads
    // would look this key id up in a ring that never had it and throw a raw
    // authority error at the user.
    return this.revisionWithKey(target, present, sha256, authority.keyId(), authority);
  }

  private revisionWithKey(
    target: ConstitutionFsTarget,
    present: boolean,
    sha256: string | undefined,
    keyId: string,
    resolved?: ConstitutionRevisionAuthority
  ): ConstitutionRevision {
    const authority = resolved ?? this.revisionAuthorityForRead()!;
    const key = authority.key(keyId);
    try {
      return `rev:v2:${keyId}:${createHmac('sha256', key)
        .update(JSON.stringify({ keyId, target, present, sha256: sha256 ?? null }), 'utf8')
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
    if (this.expectedRevisionMatches(target, current, expected)) return;
    throw new ConstitutionFsTransactionError(
      'CONSTITUTION_FS_CONFLICT',
      'Constitution target changed since it was read.'
    );
  }

  private expectedRevisionMatches(
    target: ConstitutionFsTarget,
    current: ConstitutionReadResult,
    expected: string
  ): boolean {
    const sha256 = current.status === 'present' ? this.sha256(current.content) : undefined;
    return this.expectedDigestRevisionMatches(target, current.status === 'present', sha256, current.revision, expected);
  }

  private expectedDigestRevisionMatches(
    target: ConstitutionFsTarget,
    present: boolean,
    sha256: string | undefined,
    activeRevision: string,
    expected: string
  ): boolean {
    const actual = Buffer.from(activeRevision);
    const candidate = Buffer.from(expected);
    if (actual.byteLength === candidate.byteLength && timingSafeEqual(actual, candidate)) return true;
    const priorKeyId = /^rev:v2:([0-9a-f-]{36}):[A-Za-z0-9_-]+$/i.exec(expected)?.[1];
    if (!priorKeyId) return false;
    const authority = this.revisionAuthorityForRead()!;
    if (authority.keyIds().includes(priorKeyId)) {
      const remapped = Buffer.from(this.revisionWithKey(target, present, sha256, priorKeyId, authority));
      if (remapped.byteLength === candidate.byteLength && timingSafeEqual(remapped, candidate)) return true;
    }
    return false;
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
          version: 2,
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

  private reconcileBeforeRead(): void {
    if (!this.hasAuthenticatedTransactionState()) return;
    this.ensureArchiveReadState();
    this.reconcilePendingTransactions();
  }

  readTarget(target: ConstitutionFsTarget): ConstitutionReadResult {
    if (!this.ensureRoot(false)) return { status: 'absent', revision: this.revision(target, false) };
    this.reconcileBeforeRead();
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
    requestId: string,
    fingerprintExpectedRevision: string = expectedRevision
  ): ConstitutionMutationResult {
    this.validateMutationRequest(content, requestId);
    const fingerprint = createConstitutionRequestFingerprint({
      intent: content === null ? 'delete' : 'replace',
      target,
      contentSha256: content === null ? null : this.sha256(content),
      expectedRevision: fingerprintExpectedRevision,
      archiveIdentity: null,
    });
    const replay = this.lookupMutationReplay(target, requestId, fingerprint);
    if (replay) return replay;
    const current = this.readTarget(target);
    this.assertExpectedRevision(target, current, expectedRevision);
    this.ensureRevisionAuthorityForMutation();
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
        version: 2,
        transactionId,
        root: this.root,
        operation: content === null ? 'delete' : 'replace',
        requestFingerprint: fingerprint,
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
    const result = this.mutationResult(target, receipt, fingerprint, requestId);
    return result;
  }

  private validateMutationRequest(content: string | null, requestId: string): void {
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
  }

  private lookupMutationReplay(
    target: ConstitutionFsTarget,
    requestId: string,
    fingerprint: `sha256:${string}`
  ): ConstitutionMutationResult | null {
    if (!this.hasAuthenticatedTransactionState()) return null;
    this.ensureMutationState();
    const replay = lookupCommittedConstitutionFsTransaction(
      this.root,
      randomUUID(),
      requestId,
      fingerprint,
      this.binary,
      this.mutationOptions()
    );
    if (replay.operation !== 'committed_lookup') {
      if (!sameConstitutionFingerprintTarget(replay.target, target) || replay.requestFingerprint !== fingerprint) {
        throw new ConstitutionFsTransactionError(
          'CONSTITUTION_FS_CONFLICT',
          'Authenticated replay receipt is bound to different mutation facts.'
        );
      }
      return this.mutationResult(target, replay, fingerprint, requestId);
    }
    if (replay.outcome === 'rolled_back') {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Mutation request was definitively rolled back and requires a fresh request id.'
      );
    }
    return null;
  }

  private sha256(content: string): `sha256:${string}` {
    return `sha256:${createHash('sha256').update(content, 'utf8').digest('hex')}`;
  }

  private mutationResult(
    target: ConstitutionFsTarget,
    receipt: ConstitutionFsTransactionReceipt,
    requestFingerprint: `sha256:${string}`,
    expectedTransactionId: string
  ): ConstitutionMutationResult {
    if (
      receipt.transactionId !== expectedTransactionId ||
      receipt.requestFingerprint !== requestFingerprint ||
      !sameConstitutionFingerprintTarget(receipt.target, target)
    ) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_MALFORMED_RESPONSE',
        'Native mutation receipt does not authenticate the original request.'
      );
    }
    const next = this.readTarget(target);
    return {
      status: 'committed',
      revision: next.revision,
      transactionId: receipt.transactionId,
      receiptId: receipt.journalName,
      requestFingerprint,
    };
  }

  writeConstitution(content: string, expectedRevision: string, requestId: string): ConstitutionMutationResult {
    const canonical = { kind: 'constitution', sourceName: 'CONSTITUTION.md' } as const;
    this.validateMutationRequest(content, requestId);
    const finalFingerprint = createConstitutionRequestFingerprint({
      intent: 'replace',
      target: canonical,
      contentSha256: this.sha256(content),
      expectedRevision,
      archiveIdentity: null,
    });
    const finalReplay = this.lookupMutationReplay(canonical, requestId, finalFingerprint);
    if (finalReplay) return finalReplay;
    const migrationTransactionId = this.derivedUuid(requestId, 'migrate-legacy');
    if (this.hasAuthenticatedTransactionState()) {
      this.ensureMutationState();
      const boundMigrationReplay = lookupCommittedConstitutionFsMigration(
        this.root,
        randomUUID(),
        migrationTransactionId,
        finalFingerprint,
        this.binary,
        this.mutationOptions()
      );
      if (boundMigrationReplay.operation === 'migrate_legacy') {
        const migrated = this.readTarget(canonical);
        if (migrated.status !== 'present' || this.sha256(migrated.content) !== boundMigrationReplay.replacementSha256) {
          throw new ConstitutionFsTransactionError(
            'CONSTITUTION_FS_MALFORMED_RESPONSE',
            'Authenticated legacy migration receipt disagrees with the canonical target.'
          );
        }
        return this.mutate(canonical, content, migrated.revision, requestId, expectedRevision);
      }
      if (boundMigrationReplay.outcome === 'rolled_back') {
        throw new ConstitutionFsTransactionError(
          'CONSTITUTION_FS_CONFLICT',
          'Legacy migration was definitively rolled back and requires a fresh request id.'
        );
      }
    }
    const canonicalRead = this.readTarget(canonical);
    if (
      canonicalRead.status === 'present' &&
      this.expectedRevisionMatches(canonical, canonicalRead, expectedRevision)
    ) {
      return this.mutate(canonical, content, expectedRevision, requestId);
    }
    const legacy = { kind: 'constitution', sourceName: 'SOUL.md' } as const;
    const legacyRead = this.readTarget(legacy);
    if (legacyRead.status === 'absent') {
      if (canonicalRead.status === 'absent') {
        return this.mutate(canonical, content, canonicalRead.revision, requestId, expectedRevision);
      }
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Canonical Constitution changed since it was read.'
      );
    }
    this.assertExpectedRevision(legacy, legacyRead, expectedRevision);
    const sourceSha256 = this.sha256(legacyRead.content);
    const migrationFingerprint = createConstitutionRequestFingerprint({
      intent: 'migrate_legacy',
      target: canonical,
      contentSha256: sourceSha256,
      expectedRevision,
      archiveIdentity: null,
    });
    this.ensureRevisionAuthorityForMutation();
    this.ensureMutationState();
    const migrationReplay = lookupCommittedConstitutionFsTransaction(
      this.root,
      randomUUID(),
      migrationTransactionId,
      migrationFingerprint,
      this.binary,
      this.mutationOptions()
    );
    if (migrationReplay.operation === 'committed_lookup') {
      if (migrationReplay.outcome === 'rolled_back') {
        throw new ConstitutionFsTransactionError(
          'CONSTITUTION_FS_CONFLICT',
          'Legacy migration was definitively rolled back and requires a fresh request id.'
        );
      }
      if (canonicalRead.status !== 'absent') {
        throw new ConstitutionFsTransactionError(
          'CONSTITUTION_FS_CONFLICT',
          'Canonical Constitution appeared without an authenticated migration receipt.'
        );
      }
      runConstitutionFsTransaction(
        {
          version: 2,
          transactionId: migrationTransactionId,
          root: this.root,
          operation: 'migrate_legacy',
          requestFingerprint: migrationFingerprint,
          target: canonical,
          expected: { present: false },
          replacement: {
            contentBase64: Buffer.from(legacyRead.content).toString('base64'),
            sha256: sourceSha256,
          },
          migrationSource: {
            target: legacy,
            sha256: sourceSha256,
            parentRequestFingerprint: finalFingerprint,
          },
        },
        this.binary,
        this.mutationOptions()
      );
      this.afterLegacyMigration?.();
    } else if (
      migrationReplay.operation !== 'migrate_legacy' ||
      migrationReplay.transactionId !== migrationTransactionId ||
      migrationReplay.requestFingerprint !== migrationFingerprint ||
      !sameConstitutionFingerprintTarget(migrationReplay.target, canonical)
    ) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Authenticated legacy migration receipt is bound to different facts.'
      );
    }
    const migrated = this.readTarget(canonical);
    if (migrated.status !== 'present' || migrated.content !== legacyRead.content) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_MALFORMED_RESPONSE',
        'Native legacy migration did not publish the observed SOUL bytes.'
      );
    }
    return this.mutate(canonical, content, migrated.revision, requestId, expectedRevision);
  }

  deleteConstitution(expectedRevision: string, requestId: string): ConstitutionMutationResult {
    const canonical = { kind: 'constitution', sourceName: 'CONSTITUTION.md' } as const;
    return this.mutate(canonical, null, expectedRevision, requestId);
  }

  private derivedUuid(requestId: string, purpose: string): string {
    const bytes = createHash('sha256').update(`${purpose}:${requestId}`, 'utf8').digest().subarray(0, 16);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  writeSpecialist(
    id: string,
    content: string,
    expectedRevision: string,
    requestId: string
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

  deleteSpecialist(id: string, expectedRevision: string, requestId: string): ConstitutionMutationResult {
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

  rotateRevisionAuthority(): ConstitutionRevisionRotationReceipt {
    return this.ensureRevisionAuthorityForMutation().rotate();
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
      !sameConstitutionFingerprintTarget(record.target, target) ||
      typeof record.contentDigest !== 'string' ||
      !record.contentDigest.startsWith('hmac-sha256:') ||
      typeof record.content !== 'string'
    ) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_MALFORMED_RESPONSE',
        'Authenticated archive metadata is malformed.'
      );
    }
    const contentSha256 = this.sha256(record.content);
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
        targetRevision: this.revision(target, true, contentSha256),
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
      .toSorted(
        (left, right) => right.archivedAt - left.archivedAt || compareUnicodeCodeUnits(left.archiveId, right.archiveId)
      );
  }

  prepareArchiveRestore(archiveId: string): ConstitutionPreparedArchiveRestore {
    if (!UUID_PATTERN.test(archiveId)) {
      throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Restore archive id must be a UUID.');
    }
    const active = inventoryConstitutionFsArchives(this.root, randomUUID(), this.binary, this.readOptions());
    if (!active.includes(`active:${archiveId}`)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Archive is not active and cannot be restored.'
      );
    }
    const source = this.readArchiveRecord(archiveId);
    const contentSha256 = this.sha256(source.content);
    return {
      archiveId,
      target: source.target,
      contentSha256,
      archiveRevision: source.metadata.targetRevision,
    };
  }

  archiveRestorePreviewMatches(prepared: ConstitutionPreparedArchiveRestore, expectedArchiveRevision: string): boolean {
    return this.expectedDigestRevisionMatches(
      prepared.target,
      true,
      prepared.contentSha256,
      prepared.archiveRevision,
      expectedArchiveRevision
    );
  }

  lookupArchiveRestore(requestId: string, requestFingerprint: `sha256:${string}`): ConstitutionRestoreLookupResult {
    if (!UUID_PATTERN.test(requestId) || !/^sha256:[a-f0-9]{64}$/.test(requestFingerprint)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_INVALID_REQUEST',
        'Restore lookup identity is malformed.'
      );
    }
    this.ensureMutationState();
    const replay = lookupCommittedConstitutionFsTransaction(
      this.root,
      randomUUID(),
      requestId,
      requestFingerprint,
      this.binary,
      this.mutationOptions()
    );
    if (replay.operation === 'committed_lookup') return { outcome: replay.outcome };
    if (replay.operation !== 'restore' || replay.requestFingerprint !== requestFingerprint) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Authenticated restore receipt is bound to different facts.'
      );
    }
    return {
      outcome: 'committed',
      result: this.mutationResult(replay.target, replay, requestFingerprint, requestId),
    };
  }

  restorePreparedArchive(
    prepared: ConstitutionPreparedArchiveRestore,
    expectedRevision: string,
    requestId: string,
    requestFingerprint: `sha256:${string}`
  ): ConstitutionMutationResult {
    if (!UUID_PATTERN.test(requestId) || !UUID_PATTERN.test(prepared.archiveId)) {
      throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Restore identity must be a UUID.');
    }
    const canonicalFingerprint = createConstitutionRequestFingerprint({
      intent: 'restore',
      target: prepared.target,
      contentSha256: prepared.contentSha256,
      expectedRevision,
      archiveIdentity: prepared.archiveId,
    });
    if (requestFingerprint !== canonicalFingerprint) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Restore request fingerprint is not bound to the prepared facts.'
      );
    }
    const replay = this.lookupArchiveRestore(requestId, requestFingerprint);
    if (replay.outcome === 'committed') return replay.result;
    if (replay.outcome === 'rolled_back') {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Restore request was definitively rolled back and requires a fresh request id.'
      );
    }

    // Only a definitive authenticated not_found result permits archive and
    // destination reads. This preserves response-loss replay after Native has
    // committed and retired the source archive.
    const active = inventoryConstitutionFsArchives(this.root, randomUUID(), this.binary, this.readOptions());
    if (!active.includes(`active:${prepared.archiveId}`)) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Archive is not active and cannot be restored.'
      );
    }
    const source = this.readArchiveRecord(prepared.archiveId);
    if (
      !sameConstitutionFingerprintTarget(source.target, prepared.target) ||
      this.sha256(source.content) !== prepared.contentSha256
    ) {
      throw new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_CONFLICT',
        'Authenticated archive facts changed after restore preparation.'
      );
    }
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
        version: 2,
        transactionId: requestId,
        root: this.root,
        operation: 'restore',
        requestFingerprint,
        target: source.target,
        expected,
        sourceArchiveId: prepared.archiveId,
        sourceArchive: source.payload,
        ...(displaced ? { archiveId: displacedArchiveId, archivedAt, archive: displaced } : {}),
      },
      this.binary,
      this.mutationOptions()
    );
    return this.mutationResult(source.target, receipt, requestFingerprint, requestId);
  }

  restoreArchive(archiveId: string, expectedRevision: string, requestId: string): ConstitutionMutationResult {
    if (!UUID_PATTERN.test(requestId)) {
      throw new ConstitutionFsTransactionError('CONSTITUTION_FS_INVALID_REQUEST', 'Restore request id must be a UUID.');
    }
    const prepared = this.prepareArchiveRestore(archiveId);
    const requestFingerprint = createConstitutionRequestFingerprint({
      intent: 'restore',
      target: prepared.target,
      contentSha256: prepared.contentSha256,
      expectedRevision,
      archiveIdentity: archiveId,
    });
    return this.restorePreparedArchive(prepared, expectedRevision, requestId, requestFingerprint);
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
