/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomBytes, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { link, lstat, mkdir, open, readdir, realpath, unlink } from 'node:fs/promises';
import path from 'node:path';
import {
  createRecoveryKeyCreatedEvent,
  createSameDeviceRecoveryWrap,
  deriveAndVerifyRecoveryKeyState,
  deriveRecoveryKeyId,
  openSameDeviceRecoveryWrap,
  parseCanonicalRecoveryJson,
  type RecoveryKeyState,
} from './externalRecoveryCrypto';
import { syncDirectory as syncDirectoryDurably } from '@process/utils/durabilitySync';

export const EXTERNAL_RECOVERY_AUTHORITY_DIRECTORY = 'external-recovery-authority-v1' as const;

const EVENTS_DIRECTORY = 'events';
const VAULT_DIRECTORY = 'vault';

/**
 * Filesystem-safe vault filename for a recovery key id.
 *
 * A key id is `rk1:<43 base64url chars>` and used to become the filename
 * verbatim. A colon cannot appear in a Windows filename: NTFS reads
 * `name:stream` as an alternate data stream, so `open()` quietly created a
 * stream instead of a file and the `link()` that publishes it failed with
 * EINVAL. External recovery was therefore entirely broken on Windows, which is
 * how the CI shard found it. base64url never contains '.', so substituting the
 * single colon is unambiguous and reversible.
 *
 * No migration is needed: this authority has never shipped - it is absent from
 * main and from v0.11.16 through v0.11.18 - so no vault exists in the old shape.
 */
function vaultFileNameForKeyId(keyId: string): string {
  return `${keyId.replace(':', '.')}.json`;
}

export function vaultRelativePathForKeyId(keyId: string): string {
  return `${VAULT_DIRECTORY}/${vaultFileNameForKeyId(keyId)}`;
}
const STATE_FILE = 'key-state.json';
const WRITER_LOCK_FILE = 'writer.lock';
const MAX_AUTHORITY_FILE_BYTES = 16 * 1024 * 1024;
const EVENT_FILE_PATTERN = /^(\d{6})\.json$/;
const KEY_ID_PATTERN = /^rk1:[A-Za-z0-9_-]{43}$/;

export type ExternalRecoveryVaultBackend = {
  /** Stable platform-vault implementation identity. No plaintext or software fallback is accepted. */
  provider: string;
  wrap(input: { secret: Buffer; keyId: string }): Promise<{ vaultRef: string; wrappedSecret: Uint8Array }>;
  unwrap(input: { keyId: string; vaultRef: string; wrappedSecret: Buffer }): Promise<Uint8Array>;
};

export type ExternalRecoveryAuthorityDependencies = {
  now?: () => Date;
  randomSecret?: () => Uint8Array;
  /** Test-only crash boundary. Throwing never converts a partial publication into success. */
  afterPublication?: (stage: 'vault' | 'event' | 'state') => Promise<void> | void;
};

export type ExternalRecoveryAuthorityOptions = {
  userDataRoot: string;
  vault: ExternalRecoveryVaultBackend;
  /**
   * Complete inventory of recovery-record/history digests that already exist outside this authority.
   * A new authority is forbidden when this inventory is non-empty.
   */
  existingRecordDigests: () => Promise<readonly string[]>;
  /** Optional known Classic roots, used to prove the authority is not nested in a Classic tree. */
  classicTreeRoots?: readonly string[];
  dependencies?: ExternalRecoveryAuthorityDependencies;
};

export type LoadedExternalRecoveryAuthority = {
  authorityRoot: string;
  state: RecoveryKeyState;
  canonicalStateBytes: Buffer;
  activeSecret: Buffer;
  coveredRecordDigests: readonly string[];
  reconciledState: boolean;
};

export type ExternalRecoveryKeyUse = Readonly<{ operation: 'seal' }> | Readonly<{ operation: 'open'; keyId: string }>;

export type ExternalRecoveryKeyMaterial = Readonly<{
  keyId: string;
  status: 'active' | 'retired';
  secret: Buffer;
}>;

type LocatedEvent = {
  bytes: Buffer;
  keyId: string;
  vaultRelativePath: string;
};

type LocatedWrap = {
  bytes: Buffer;
  keyId: string;
  vaultRef: string;
};

function isWithin(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function requireCanonicalIdentity(value: string, label: string): string {
  const hasControlCharacter =
    typeof value === 'string' &&
    [...value].some((character) => {
      const codePoint = character.codePointAt(0)!;
      return codePoint <= 0x1f || codePoint === 0x7f;
    });
  if (typeof value !== 'string' || value.length === 0 || value !== value.normalize('NFC') || hasControlCharacter) {
    throw new Error(`${label} is not canonical.`);
  }
  return value;
}

function requireDigestInventory(values: readonly string[]): string[] {
  if (!Array.isArray(values)) throw new Error('External recovery record inventory is invalid.');
  const normalized = [...values];
  for (const digest of normalized) {
    if (!/^sha256:[a-f0-9]{64}$/.test(digest))
      throw new Error('External recovery record inventory contains an invalid digest.');
  }
  normalized.sort();
  if (normalized.some((digest, index) => index > 0 && normalized[index - 1] === digest)) {
    throw new Error('External recovery record inventory contains a duplicate digest.');
  }
  return normalized;
}

export function resolveExternalRecoveryAuthorityRoot(userDataRoot: string): string {
  const resolvedUserData = path.resolve(userDataRoot);
  return path.join(resolvedUserData, 'constitution', EXTERNAL_RECOVERY_AUTHORITY_DIRECTORY);
}

function assertDisjointFromClassic(authorityRoot: string, classicRoots: readonly string[]): void {
  for (const classicRoot of classicRoots) {
    const resolvedClassic = path.resolve(classicRoot);
    if (isWithin(resolvedClassic, authorityRoot) || isWithin(authorityRoot, resolvedClassic)) {
      throw new Error('External recovery authority must be disjoint from every Classic tree.');
    }
  }
}

async function requireRealDirectory(directory: string, label: string): Promise<string> {
  const stat = await lstat(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} is not a real directory.`);
  return realpath(directory);
}

async function ensureRealDirectory(directory: string, parent: string, label: string): Promise<void> {
  const canonicalParent = await requireRealDirectory(parent, `${label} parent`);
  const suppliedParent = await realpath(path.dirname(path.resolve(directory)));
  if (suppliedParent !== canonicalParent) throw new Error(`${label} parent identity changed.`);
  try {
    const stat = await lstat(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} is not a real directory.`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    await mkdir(directory, { mode: 0o700 });
    await syncDirectory(parent);
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

async function readRegularNoFollow(filePath: string): Promise<Buffer> {
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  let handle;
  try {
    handle = await open(filePath, constants.O_RDONLY | noFollow);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ELOOP')
      throw new Error(`External recovery authority file is a symlink: ${filePath}`, { cause: error });
    throw error;
  }
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > MAX_AUTHORITY_FILE_BYTES) {
      throw new Error(`External recovery authority file is unsafe or oversized: ${filePath}`);
    }
    const bytes = await handle.readFile();
    const after = await handle.stat();
    if (
      bytes.length !== before.size ||
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size
    ) {
      throw new Error(`External recovery authority file changed during read: ${filePath}`);
    }
    return bytes;
  } finally {
    await handle.close();
  }
}

async function publishNoClobber(filePath: string, bytes: Uint8Array): Promise<void> {
  const directory = path.dirname(filePath);
  await requireRealDirectory(directory, 'External recovery publication directory');
  const temporaryPath = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`);
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const handle = await open(temporaryPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600);
  let published = false;
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    await link(temporaryPath, filePath);
    published = true;
    await syncDirectory(directory);
  } finally {
    await handle.close().catch((): undefined => undefined);
    await unlink(temporaryPath).catch((): undefined => undefined);
    if (published) await syncDirectory(directory);
  }
}

async function acquireWriterLock(authorityRoot: string): Promise<() => Promise<void>> {
  const lockPath = path.join(authorityRoot, WRITER_LOCK_FILE);
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const lockToken = `${process.pid}:${randomUUID()}\n`;
  let handle;
  try {
    handle = await open(lockPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error('External recovery authority writer is already active.', { cause: error });
    }
    throw error;
  }
  try {
    await handle.writeFile(lockToken, 'utf8');
    await handle.sync();
    const identity = await handle.stat();
    await handle.close();
    await syncDirectory(authorityRoot);
    return async () => {
      const current = await lstat(lockPath);
      if (
        current.isSymbolicLink() ||
        !current.isFile() ||
        current.dev !== identity.dev ||
        current.ino !== identity.ino
      ) {
        throw new Error('External recovery authority writer lock identity changed; refusing to remove it.');
      }
      const bytes = await readRegularNoFollow(lockPath);
      if (bytes.toString('utf8') !== lockToken) {
        throw new Error('External recovery authority writer lock ownership changed; refusing to remove it.');
      }
      await unlink(lockPath);
      await syncDirectory(authorityRoot);
    };
  } catch (error) {
    await handle.close().catch((): undefined => undefined);
    await unlink(lockPath).catch((): undefined => undefined);
    throw error;
  }
}

function objectRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} is invalid.`);
  return value as Record<string, unknown>;
}

function locateEvent(bytes: Buffer, expectedSequence: number): LocatedEvent {
  const value = objectRecord(parseCanonicalRecoveryJson(bytes), 'External recovery event');
  if (
    value.sequence !== expectedSequence ||
    typeof value.newKeyId !== 'string' ||
    !KEY_ID_PATTERN.test(value.newKeyId)
  ) {
    throw new Error('External recovery event identity is invalid.');
  }
  const expectedVaultPath = vaultRelativePathForKeyId(value.newKeyId);
  if (value.newVaultRef !== expectedVaultPath)
    throw new Error('External recovery event vault reference is unsafe or noncanonical.');
  return { bytes, keyId: value.newKeyId, vaultRelativePath: expectedVaultPath };
}

function locateWrap(bytes: Buffer, expectedKeyId: string): LocatedWrap {
  const value = objectRecord(parseCanonicalRecoveryJson(bytes), 'External recovery vault wrap');
  if (value.keyId !== expectedKeyId || typeof value.vaultRef !== 'string') {
    throw new Error('External recovery vault wrap identity is invalid.');
  }
  return {
    bytes,
    keyId: expectedKeyId,
    vaultRef: requireCanonicalIdentity(value.vaultRef, 'External recovery OS vault reference'),
  };
}

async function eventFiles(authorityRoot: string): Promise<string[]> {
  const eventsRoot = path.join(authorityRoot, EVENTS_DIRECTORY);
  await requireRealDirectory(eventsRoot, 'External recovery events directory');
  const entries = await readdir(eventsRoot, { withFileTypes: true });
  const names: string[] = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink() || !entry.isFile() || !EVENT_FILE_PATTERN.test(entry.name)) {
      throw new Error(`External recovery events directory contains an unsafe entry: ${entry.name}`);
    }
    names.push(entry.name);
  }
  names.sort();
  for (let sequence = 0; sequence < names.length; sequence += 1) {
    if (names[sequence] !== `${sequence.toString().padStart(6, '0')}.json`) {
      throw new Error('External recovery event chain has a missing, duplicate, or noncanonical filename.');
    }
  }
  return names;
}

async function assertAuthorityRootLayout(authorityRoot: string): Promise<void> {
  const entries = await readdir(authorityRoot, { withFileTypes: true });
  const permitted = new Set([EVENTS_DIRECTORY, VAULT_DIRECTORY, STATE_FILE, WRITER_LOCK_FILE]);
  for (const entry of entries) {
    if (!permitted.has(entry.name) || entry.isSymbolicLink()) {
      throw new Error(`External recovery authority contains an unsafe entry: ${entry.name}`);
    }
    if (
      ((entry.name === EVENTS_DIRECTORY || entry.name === VAULT_DIRECTORY) && !entry.isDirectory()) ||
      ((entry.name === STATE_FILE || entry.name === WRITER_LOCK_FILE) && !entry.isFile())
    ) {
      throw new Error(`External recovery authority entry has the wrong type: ${entry.name}`);
    }
  }
}

async function assertVaultInventory(authorityRoot: string, events: readonly LocatedEvent[]): Promise<void> {
  const expected = new Set(events.map((event) => vaultFileNameForKeyId(event.keyId)));
  const entries = await readdir(path.join(authorityRoot, VAULT_DIRECTORY), { withFileTypes: true });
  if (entries.length !== expected.size)
    throw new Error('External recovery vault inventory is incomplete or contradictory.');
  for (const entry of entries) {
    if (entry.isSymbolicLink() || !entry.isFile() || !expected.delete(entry.name)) {
      throw new Error(`External recovery vault inventory contains an unsafe entry: ${entry.name}`);
    }
  }
  if (expected.size !== 0) throw new Error('External recovery vault inventory is missing a required wrap.');
}

async function unwrapLocatedEvent(
  authorityRoot: string,
  event: LocatedEvent,
  options: ExternalRecoveryAuthorityOptions
): Promise<Buffer> {
  const wrapBytes = await readRegularNoFollow(path.join(authorityRoot, event.vaultRelativePath));
  const wrap = locateWrap(wrapBytes, event.keyId);
  return openSameDeviceRecoveryWrap(wrap.bytes, {
    provider: requireCanonicalIdentity(options.vault.provider, 'External recovery vault provider'),
    vaultRef: wrap.vaultRef,
    unwrap: async (wrappedSecret) => {
      const rawVaultResult = await options.vault.unwrap({
        keyId: wrap.keyId,
        vaultRef: wrap.vaultRef,
        wrappedSecret,
      });
      const vaultResult = Buffer.from(rawVaultResult);
      try {
        return Buffer.from(vaultResult);
      } finally {
        vaultResult.fill(0);
        rawVaultResult.fill(0);
      }
    },
  });
}

async function loadUnderLock(
  authorityRoot: string,
  options: ExternalRecoveryAuthorityOptions
): Promise<LoadedExternalRecoveryAuthority> {
  await assertAuthorityRootLayout(authorityRoot);
  const names = await eventFiles(authorityRoot);
  if (names.length === 0) throw new Error('External recovery authority event chain is missing.');

  const locatedEvents: LocatedEvent[] = [];
  const secrets = new Map<string, Buffer>();
  try {
    for (let sequence = 0; sequence < names.length; sequence += 1) {
      // Intentionally ordered: the authenticated event sequence is authority state, not parallel work.
      // oxlint-disable-next-line no-await-in-loop
      const bytes = await readRegularNoFollow(path.join(authorityRoot, EVENTS_DIRECTORY, names[sequence]));
      locatedEvents.push(locateEvent(bytes, sequence));
    }
    await assertVaultInventory(authorityRoot, locatedEvents);
    for (const event of locatedEvents) {
      // Intentionally ordered so every successfully unwrapped secret is registered and zeroized if a later key fails.
      // oxlint-disable-next-line no-await-in-loop
      const secret = await unwrapLocatedEvent(authorityRoot, event, options);
      secrets.set(event.keyId, secret);
    }

    const statePath = path.join(authorityRoot, STATE_FILE);
    let claimedState: Buffer | undefined;
    try {
      claimedState = await readRegularNoFollow(statePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const derived = deriveAndVerifyRecoveryKeyState(
      locatedEvents.map((event) => event.bytes),
      secrets,
      claimedState
    );
    let reconciledState = false;
    if (!claimedState) {
      await publishNoClobber(statePath, derived.canonicalBytes);
      await options.dependencies?.afterPublication?.('state');
      reconciledState = true;
    }
    const active = secrets.get(derived.state.activeKeyId);
    if (!active) throw new Error('External recovery authority active key is unavailable.');
    return {
      authorityRoot,
      state: derived.state,
      canonicalStateBytes: derived.canonicalBytes,
      activeSecret: Buffer.from(active),
      coveredRecordDigests: derived.coveredRecordDigests,
      reconciledState,
    };
  } finally {
    for (const secret of secrets.values()) secret.fill(0);
  }
}

async function createUnderLock(
  authorityRoot: string,
  options: ExternalRecoveryAuthorityOptions,
  recordDigests: readonly string[]
): Promise<LoadedExternalRecoveryAuthority> {
  if (recordDigests.length !== 0) {
    throw new Error('Refusing to create external recovery authority over existing records or history.');
  }
  const secret = Buffer.from(options.dependencies?.randomSecret?.() ?? randomBytes(32));
  if (secret.length !== 32) {
    secret.fill(0);
    throw new Error('External recovery authority generator must return exactly 32 bytes.');
  }
  try {
    const keyId = deriveRecoveryKeyId(secret);
    const createdAt = (options.dependencies?.now?.() ?? new Date()).toISOString();
    const vaultSecret = Buffer.from(secret);
    let wrapped: { vaultRef: string; wrappedSecret: Uint8Array };
    try {
      wrapped = await options.vault.wrap({ secret: vaultSecret, keyId });
    } finally {
      vaultSecret.fill(0);
    }
    const vaultRef = requireCanonicalIdentity(wrapped.vaultRef, 'External recovery OS vault reference');
    const vaultRelativePath = vaultRelativePathForKeyId(keyId);
    const wrapBytes = createSameDeviceRecoveryWrap({
      secret,
      createdAt,
      vaultProvider: requireCanonicalIdentity(options.vault.provider, 'External recovery vault provider'),
      vaultRef,
      wrappedSecret: wrapped.wrappedSecret,
    });
    await publishNoClobber(path.join(authorityRoot, vaultRelativePath), wrapBytes);
    await options.dependencies?.afterPublication?.('vault');

    const genesis = createRecoveryKeyCreatedEvent({
      secret,
      newVaultRef: vaultRelativePath,
      createdAt,
      coveredRecordDigests: [],
    });
    await publishNoClobber(path.join(authorityRoot, EVENTS_DIRECTORY, '000000.json'), genesis.canonicalBytes);
    await options.dependencies?.afterPublication?.('event');

    const derived = deriveAndVerifyRecoveryKeyState([genesis.canonicalBytes], new Map([[keyId, secret]]));
    await publishNoClobber(path.join(authorityRoot, STATE_FILE), derived.canonicalBytes);
    await options.dependencies?.afterPublication?.('state');
    return {
      authorityRoot,
      state: derived.state,
      canonicalStateBytes: derived.canonicalBytes,
      activeSecret: Buffer.from(secret),
      coveredRecordDigests: derived.coveredRecordDigests,
      reconciledState: false,
    };
  } finally {
    secret.fill(0);
  }
}

async function prepareAuthorityRoot(userDataRoot: string, authorityRoot: string): Promise<void> {
  const resolvedUserData = path.resolve(userDataRoot);
  await requireRealDirectory(resolvedUserData, 'Wayland userData root');
  const constitutionRoot = path.dirname(authorityRoot);
  await ensureRealDirectory(constitutionRoot, resolvedUserData, 'Wayland Constitution directory');
  await ensureRealDirectory(authorityRoot, constitutionRoot, 'External recovery authority directory');
  await ensureRealDirectory(
    path.join(authorityRoot, EVENTS_DIRECTORY),
    authorityRoot,
    'External recovery events directory'
  );
  await ensureRealDirectory(
    path.join(authorityRoot, VAULT_DIRECTORY),
    authorityRoot,
    'External recovery vault directory'
  );
}

async function requireExistingAuthorityRoot(userDataRoot: string, authorityRoot: string): Promise<void> {
  const resolvedUserData = path.resolve(userDataRoot);
  await requireRealDirectory(resolvedUserData, 'Wayland userData root');
  await requireRealDirectory(path.dirname(authorityRoot), 'Wayland Constitution directory');
  await requireRealDirectory(authorityRoot, 'External recovery authority directory');
  await requireRealDirectory(path.join(authorityRoot, EVENTS_DIRECTORY), 'External recovery events directory');
  await requireRealDirectory(path.join(authorityRoot, VAULT_DIRECTORY), 'External recovery vault directory');
}

/**
 * Load and verify the external authority, creating it only when no authority and no recovery records/history exist.
 * Every mutating path is serialized by a fail-closed exclusive writer lock.
 */
export async function loadOrCreateExternalRecoveryAuthority(
  options: ExternalRecoveryAuthorityOptions
): Promise<LoadedExternalRecoveryAuthority> {
  requireCanonicalIdentity(options.vault.provider, 'External recovery vault provider');
  const authorityRoot = resolveExternalRecoveryAuthorityRoot(options.userDataRoot);
  assertDisjointFromClassic(authorityRoot, options.classicTreeRoots ?? []);

  let authorityRootExists = true;
  try {
    await requireRealDirectory(authorityRoot, 'External recovery authority directory');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    authorityRootExists = false;
  }
  if (!authorityRootExists) {
    const initialRecords = requireDigestInventory(await options.existingRecordDigests());
    if (initialRecords.length !== 0) {
      throw new Error('Refusing to create external recovery authority over existing records or history.');
    }
  }

  await prepareAuthorityRoot(options.userDataRoot, authorityRoot);
  const release = await acquireWriterLock(authorityRoot);
  try {
    await assertAuthorityRootLayout(authorityRoot);
    const names = await eventFiles(authorityRoot);
    if (names.length !== 0) return await loadUnderLock(authorityRoot, options);

    const statePath = path.join(authorityRoot, STATE_FILE);
    const vaultEntries = await readdir(path.join(authorityRoot, VAULT_DIRECTORY));
    let stateExists = false;
    try {
      await lstat(statePath);
      stateExists = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (stateExists || vaultEntries.length !== 0) {
      throw new Error('External recovery authority is partial or contradictory; refusing replacement.');
    }

    const records = requireDigestInventory(await options.existingRecordDigests());
    return await createUnderLock(authorityRoot, options, records);
  } finally {
    await release();
  }
}

/** Load an existing authority. This never creates a new key, but may recreate a missing derived state file. */
export async function loadExternalRecoveryAuthority(
  options: ExternalRecoveryAuthorityOptions
): Promise<LoadedExternalRecoveryAuthority> {
  requireCanonicalIdentity(options.vault.provider, 'External recovery vault provider');
  const authorityRoot = resolveExternalRecoveryAuthorityRoot(options.userDataRoot);
  assertDisjointFromClassic(authorityRoot, options.classicTreeRoots ?? []);
  await requireExistingAuthorityRoot(options.userDataRoot, authorityRoot);
  const release = await acquireWriterLock(authorityRoot);
  try {
    return await loadUnderLock(authorityRoot, options);
  } finally {
    await release();
  }
}

/**
 * Run one record operation with the authenticated active key or the exact retained key named by an envelope.
 * The callback receives a short-lived copy which is zeroized before this function returns or throws.
 */
export async function withExternalRecoveryAuthorityKey<T>(
  options: ExternalRecoveryAuthorityOptions,
  use: ExternalRecoveryKeyUse,
  operation: (material: ExternalRecoveryKeyMaterial) => Promise<T> | T
): Promise<T> {
  requireCanonicalIdentity(options.vault.provider, 'External recovery vault provider');
  const authorityRoot = resolveExternalRecoveryAuthorityRoot(options.userDataRoot);
  assertDisjointFromClassic(authorityRoot, options.classicTreeRoots ?? []);
  await requireExistingAuthorityRoot(options.userDataRoot, authorityRoot);
  const release = await acquireWriterLock(authorityRoot);
  let loaded: LoadedExternalRecoveryAuthority | undefined;
  let selectedSecret: Buffer | undefined;
  try {
    loaded = await loadUnderLock(authorityRoot, options);
    const requestedKeyId = use.operation === 'seal' ? loaded.state.activeKeyId : use.keyId;
    if (!KEY_ID_PATTERN.test(requestedKeyId)) {
      throw new Error('External recovery record names a malformed key ID.');
    }
    const key = loaded.state.keys.find(({ keyId }) => keyId === requestedKeyId);
    if (!key) throw new Error('External recovery record names an unknown authority key.');
    if (use.operation === 'seal' && (key.status !== 'active' || requestedKeyId !== loaded.state.activeKeyId)) {
      throw new Error('External recovery sealing requires the authenticated active key.');
    }
    if (requestedKeyId === loaded.state.activeKeyId) {
      selectedSecret = Buffer.from(loaded.activeSecret);
    } else {
      const names = await eventFiles(authorityRoot);
      const events: LocatedEvent[] = [];
      for (let sequence = 0; sequence < names.length; sequence += 1) {
        // Ordered because event sequence is authenticated authority state.
        // oxlint-disable-next-line no-await-in-loop
        const bytes = await readRegularNoFollow(path.join(authorityRoot, EVENTS_DIRECTORY, names[sequence]));
        events.push(locateEvent(bytes, sequence));
      }
      const event = events.find(({ keyId }) => keyId === requestedKeyId);
      if (!event) throw new Error('External recovery retained key has no authenticated authority event.');
      selectedSecret = await unwrapLocatedEvent(authorityRoot, event, options);
    }
    return await operation({ keyId: requestedKeyId, status: key.status, secret: selectedSecret });
  } finally {
    selectedSecret?.fill(0);
    loaded?.activeSecret.fill(0);
    await release();
  }
}
