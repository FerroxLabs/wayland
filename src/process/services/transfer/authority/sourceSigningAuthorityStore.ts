/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, generateKeyPairSync, randomUUID, timingSafeEqual } from 'node:crypto';
import { constants } from 'node:fs';
import { link, lstat, open, realpath, unlink } from 'node:fs/promises';
import path from 'node:path';

import {
  SourceSigningAuthority,
  TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM,
  type SourceSigningAuthorityDescriptor,
} from '@process/services/transfer/publish/sourceAuthorization';
import { parseStrictJson } from '@process/services/transfer/crypto/strictJson';
import { syncDirectory as syncDirectoryDurably } from '@process/utils/durabilitySync';

export const TRANSFER_SOURCE_SIGNING_AUTHORITY_CONTRACT = 'wayland-transfer-source-signing-authority/1.0' as const;
export const TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT = 'wayland-transfer-source-signing-authority-v1' as const;

const MAX_STATE_BYTES = 16 * 1024;
const MAX_PRIVATE_KEY_BYTES = 512;
const MAX_IDENTITY_BYTES = 512;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const CANONICAL_BASE64URL = /^[A-Za-z0-9_-]+$/;

type SourceAuthorityState = Readonly<{
  contract: typeof TRANSFER_SOURCE_SIGNING_AUTHORITY_CONTRACT;
  algorithm: typeof TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM;
  slot: typeof TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT;
  vaultProvider: string;
  vaultRef: string;
  publicKeyDer: string;
  publicKeyFingerprint: `sha256:${string}`;
}>;

export type SourceSigningAuthorityVaultBackend = Readonly<{
  /** Stable OS-vault implementation identity. A software or file fallback is forbidden. */
  provider: string;
  /** Atomically create the stable slot, or return the already-existing slot without replacing it. */
  createOnce(input: {
    slot: typeof TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT;
    privateKeyPkcs8: Uint8Array;
  }): Promise<Readonly<{ disposition: 'created' | 'existing'; vaultRef: string }>>;
  /** Return the PKCS#8 key bytes held by the exact OS-vault entry. */
  read(input: { slot: typeof TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT; vaultRef: string }): Promise<Uint8Array>;
}>;

export type SourceSigningAuthorityStateBackend = Readonly<{
  /** Read the exact owner-only state bytes, or null when no state has ever been published. */
  read(): Promise<Uint8Array | null>;
  /** Atomically publish without replacing an existing state. */
  createOnce(bytes: Uint8Array): Promise<'created' | 'existing'>;
}>;

export type SourceSigningAuthorityReceipt = Readonly<{
  contract: typeof TRANSFER_SOURCE_SIGNING_AUTHORITY_CONTRACT;
  algorithm: typeof TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM;
  publicKeyFingerprint: `sha256:${string}`;
  stateSha256: `sha256:${string}`;
  continuity: 'created' | 'reloaded' | 'recovered';
}>;

export type LoadedSourceSigningAuthority = Readonly<{
  authority: SourceSigningAuthority;
  descriptor: SourceSigningAuthorityDescriptor;
  receipt: SourceSigningAuthorityReceipt;
}>;

export type LoadOrCreateSourceSigningAuthorityOptions = Readonly<{
  vault: SourceSigningAuthorityVaultBackend;
  state: SourceSigningAuthorityStateBackend;
}>;

export type SourceSigningAuthorityStoreErrorCode =
  | 'INVALID_BACKEND'
  | 'STATE_UNAVAILABLE'
  | 'STATE_INVALID'
  | 'STATE_PUBLICATION_FAILED'
  | 'VAULT_UNAVAILABLE'
  | 'VAULT_CONTRADICTION'
  | 'KEY_INVALID'
  | 'IDENTITY_MISMATCH';

/** Stable, content-free error. Backend errors and secret material are never attached as causes. */
export class SourceSigningAuthorityStoreError extends Error {
  constructor(readonly code: SourceSigningAuthorityStoreErrorCode) {
    super(`Transfer source signing authority failed closed (${code}).`);
    this.name = 'SourceSigningAuthorityStoreError';
  }
}

/**
 * Owner-only, no-clobber filesystem state backend. The state contains only public identity and an opaque vault
 * reference, but is still mode 0600 because replacement would redirect signing authority.
 */
export class FileSourceSigningAuthorityStateBackend implements SourceSigningAuthorityStateBackend {
  constructor(readonly statePath: string) {}

  async read(): Promise<Uint8Array | null> {
    const resolved = path.resolve(this.statePath);
    await requireRealParent(resolved);
    // Inspect the entry itself before opening it. O_NOFOLLOW is the POSIX guard,
    // but `fs.constants.O_NOFOLLOW` is undefined on Windows and collapses to 0,
    // so open() follows a link there and every check made through the handle
    // inspects the *target*: fstat structurally cannot report a symlink, so a
    // state file swapped for a link to attacker-chosen content read clean and
    // signing authority was silently redirected.
    //
    // assertSafeStateStat, not isSymbolicLink: it also rejects a non-regular
    // file, and open(O_RDONLY) on a FIFO blocks until a writer appears. That
    // check already existed but only ran *after* the open, which a FIFO prevents
    // from ever being reached - it hangs read() indefinitely and pins a libuv
    // threadpool thread, so the process cannot be torn down.
    let entry;
    try {
      entry = await lstat(resolved);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    assertSafeStateStat(entry);
    const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
    let handle;
    try {
      handle = await open(resolved, constants.O_RDONLY | noFollow);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    try {
      const before = await handle.stat();
      assertSafeStateStat(before);
      // Bind the opened descriptor to the entry lstat admitted, and re-lstat the
      // path afterwards. Two handle.stat() calls cannot do this: a descriptor's
      // dev/ino are invariant by construction, so before/after always agree even
      // when open() resolved something else entirely. Without these comparisons
      // the pre-open check is defeated by winning a race rather than by a static
      // swap. Mirrors readProjectConfigNoFollow in projectConfigTransaction.ts,
      // which is the same routine for the same reason.
      if (before.dev !== entry.dev || before.ino !== entry.ino) {
        throw new Error('state file is unsafe');
      }
      const bytes = await handle.readFile();
      const after = await handle.stat();
      assertSafeStateStat(after);
      const post = await lstat(resolved);
      if (
        bytes.byteLength !== before.size ||
        before.dev !== after.dev ||
        before.ino !== after.ino ||
        before.size !== after.size ||
        post.dev !== before.dev ||
        post.ino !== before.ino
      ) {
        throw new Error('state changed during read');
      }
      return bytes;
    } finally {
      await handle.close();
    }
  }

  async createOnce(bytes: Uint8Array): Promise<'created' | 'existing'> {
    if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > MAX_STATE_BYTES) {
      throw new Error('invalid state publication');
    }
    const resolved = path.resolve(this.statePath);
    const directory = path.dirname(resolved);
    await requireRealParent(resolved);
    const temporary = path.join(directory, `.${path.basename(resolved)}.${process.pid}.${randomUUID()}.tmp`);
    const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
    const handle = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600);
    let published = false;
    try {
      await handle.writeFile(bytes);
      await handle.sync();
      await handle.close();
      try {
        await link(temporary, resolved);
        published = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') return 'existing';
        throw error;
      }
      await syncDirectory(directory);
      const stateStat = await lstat(resolved);
      assertSafeStateStat(stateStat);
      return 'created';
    } finally {
      await handle.close().catch((): undefined => undefined);
      await unlink(temporary).catch((): undefined => undefined);
      if (published) await syncDirectory(directory);
    }
  }
}

export async function loadOrCreateSourceSigningAuthority(
  options: LoadOrCreateSourceSigningAuthorityOptions
): Promise<LoadedSourceSigningAuthority> {
  const provider = canonicalIdentity(options.vault?.provider, 'provider');
  if (!options.state || typeof options.state.read !== 'function' || typeof options.state.createOnce !== 'function') {
    throw new SourceSigningAuthorityStoreError('INVALID_BACKEND');
  }
  if (!options.vault || typeof options.vault.createOnce !== 'function' || typeof options.vault.read !== 'function') {
    throw new SourceSigningAuthorityStoreError('INVALID_BACKEND');
  }

  const initialStateBytes = await readState(options.state);
  if (initialStateBytes) {
    return loadFromState(initialStateBytes, options.vault, provider, 'reloaded');
  }

  const generated = generateKeyPairSync('ed25519').privateKey.export({ format: 'der', type: 'pkcs8' }) as Buffer;
  let vaultResult: Readonly<{ disposition: 'created' | 'existing'; vaultRef: string }>;
  try {
    const supplied = Buffer.from(generated);
    try {
      vaultResult = await options.vault.createOnce({
        slot: TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT,
        privateKeyPkcs8: supplied,
      });
    } finally {
      supplied.fill(0);
    }
  } catch {
    generated.fill(0);
    throw new SourceSigningAuthorityStoreError('VAULT_UNAVAILABLE');
  }

  let vaultRef: string;
  try {
    if (vaultResult.disposition !== 'created' && vaultResult.disposition !== 'existing') {
      throw new Error('invalid disposition');
    }
    vaultRef = canonicalIdentity(vaultResult.vaultRef, 'vault reference');
  } catch {
    generated.fill(0);
    throw new SourceSigningAuthorityStoreError('VAULT_CONTRADICTION');
  }

  const loadedKey = await readVaultKey(options.vault, vaultRef);
  try {
    if (vaultResult.disposition === 'created' && !equalBytes(generated, loadedKey)) {
      throw new SourceSigningAuthorityStoreError('VAULT_CONTRADICTION');
    }
    const authority = authorityFromPkcs8(loadedKey);
    const state = stateForAuthority(authority.descriptor(), provider, vaultRef);
    const canonicalState = encodeState(state);
    try {
      await options.state.createOnce(canonicalState);
    } catch {
      throw new SourceSigningAuthorityStoreError('STATE_PUBLICATION_FAILED');
    }
    const persisted = await readState(options.state);
    if (!persisted) throw new SourceSigningAuthorityStoreError('STATE_PUBLICATION_FAILED');
    const continuity = vaultResult.disposition === 'created' ? 'created' : 'recovered';
    return await loadFromState(persisted, options.vault, provider, continuity, state);
  } finally {
    generated.fill(0);
    loadedKey.fill(0);
  }
}

async function loadFromState(
  stateBytes: Uint8Array,
  vault: SourceSigningAuthorityVaultBackend,
  provider: string,
  continuity: SourceSigningAuthorityReceipt['continuity'],
  expectedState?: SourceAuthorityState
): Promise<LoadedSourceSigningAuthority> {
  const state = parseState(stateBytes);
  if (state.vaultProvider !== provider) throw new SourceSigningAuthorityStoreError('IDENTITY_MISMATCH');
  if (expectedState && !equalBytes(encodeState(expectedState), encodeState(state))) {
    throw new SourceSigningAuthorityStoreError('IDENTITY_MISMATCH');
  }
  const privateKey = await readVaultKey(vault, state.vaultRef);
  try {
    const authority = authorityFromPkcs8(privateKey, state.publicKeyDer);
    const descriptor = authority.descriptor();
    if (
      descriptor.algorithm !== state.algorithm ||
      descriptor.publicKeyDer !== state.publicKeyDer ||
      descriptor.publicKeyFingerprint !== state.publicKeyFingerprint
    ) {
      throw new SourceSigningAuthorityStoreError('IDENTITY_MISMATCH');
    }
    return Object.freeze({
      authority,
      descriptor,
      receipt: Object.freeze({
        contract: TRANSFER_SOURCE_SIGNING_AUTHORITY_CONTRACT,
        algorithm: TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM,
        publicKeyFingerprint: descriptor.publicKeyFingerprint,
        stateSha256: digest(stateBytes),
        continuity,
      }),
    });
  } finally {
    privateKey.fill(0);
  }
}

async function readState(state: SourceSigningAuthorityStateBackend): Promise<Uint8Array | null> {
  try {
    const bytes = await state.read();
    if (bytes === null) return null;
    if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > MAX_STATE_BYTES) {
      throw new Error('invalid state');
    }
    return Uint8Array.from(bytes);
  } catch (error) {
    if (error instanceof SourceSigningAuthorityStoreError) throw error;
    throw new SourceSigningAuthorityStoreError('STATE_UNAVAILABLE');
  }
}

async function readVaultKey(vault: SourceSigningAuthorityVaultBackend, vaultRef: string): Promise<Buffer> {
  let raw: Uint8Array | undefined;
  try {
    raw = await vault.read({ slot: TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT, vaultRef });
    if (!(raw instanceof Uint8Array) || raw.byteLength === 0 || raw.byteLength > MAX_PRIVATE_KEY_BYTES) {
      throw new Error('invalid key');
    }
    return Buffer.from(raw);
  } catch {
    throw new SourceSigningAuthorityStoreError('VAULT_UNAVAILABLE');
  } finally {
    raw?.fill(0);
  }
}

function authorityFromPkcs8(privateKey: Uint8Array, expectedPublicKeyDer?: string): SourceSigningAuthority {
  const encoded = Buffer.from(privateKey).toString('base64url');
  try {
    return SourceSigningAuthority.fromPkcs8(encoded, expectedPublicKeyDer);
  } catch {
    throw new SourceSigningAuthorityStoreError('KEY_INVALID');
  }
}

function stateForAuthority(
  descriptor: SourceSigningAuthorityDescriptor,
  vaultProvider: string,
  vaultRef: string
): SourceAuthorityState {
  return Object.freeze({
    contract: TRANSFER_SOURCE_SIGNING_AUTHORITY_CONTRACT,
    algorithm: TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM,
    slot: TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT,
    vaultProvider,
    vaultRef,
    publicKeyDer: descriptor.publicKeyDer,
    publicKeyFingerprint: descriptor.publicKeyFingerprint,
  });
}

function parseState(bytes: Uint8Array): SourceAuthorityState {
  let text: string;
  let value: unknown;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    value = parseStrictJson(text);
  } catch {
    throw new SourceSigningAuthorityStoreError('STATE_INVALID');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SourceSigningAuthorityStoreError('STATE_INVALID');
  }
  const record = value as Record<string, unknown>;
  const expectedFields = [
    'algorithm',
    'contract',
    'publicKeyDer',
    'publicKeyFingerprint',
    'slot',
    'vaultProvider',
    'vaultRef',
  ];
  if (JSON.stringify(Object.keys(record).toSorted()) !== JSON.stringify(expectedFields)) {
    throw new SourceSigningAuthorityStoreError('STATE_INVALID');
  }
  try {
    if (
      record.contract !== TRANSFER_SOURCE_SIGNING_AUTHORITY_CONTRACT ||
      record.algorithm !== TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM ||
      record.slot !== TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT ||
      typeof record.publicKeyDer !== 'string' ||
      record.publicKeyDer.length === 0 ||
      record.publicKeyDer.length > MAX_IDENTITY_BYTES ||
      !CANONICAL_BASE64URL.test(record.publicKeyDer) ||
      Buffer.from(record.publicKeyDer, 'base64url').toString('base64url') !== record.publicKeyDer ||
      typeof record.publicKeyFingerprint !== 'string' ||
      !SHA256.test(record.publicKeyFingerprint)
    ) {
      throw new Error('invalid fields');
    }
    const parsed: SourceAuthorityState = {
      contract: TRANSFER_SOURCE_SIGNING_AUTHORITY_CONTRACT,
      algorithm: TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM,
      slot: TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT,
      vaultProvider: canonicalIdentity(record.vaultProvider, 'provider'),
      vaultRef: canonicalIdentity(record.vaultRef, 'vault reference'),
      publicKeyDer: record.publicKeyDer,
      publicKeyFingerprint: record.publicKeyFingerprint as `sha256:${string}`,
    };
    if (new TextDecoder().decode(encodeState(parsed)) !== text) throw new Error('noncanonical state');
    return Object.freeze(parsed);
  } catch {
    throw new SourceSigningAuthorityStoreError('STATE_INVALID');
  }
}

function encodeState(state: SourceAuthorityState): Uint8Array {
  return new TextEncoder().encode(
    JSON.stringify({
      algorithm: state.algorithm,
      contract: state.contract,
      publicKeyDer: state.publicKeyDer,
      publicKeyFingerprint: state.publicKeyFingerprint,
      slot: state.slot,
      vaultProvider: state.vaultProvider,
      vaultRef: state.vaultRef,
    })
  );
}

function canonicalIdentity(value: unknown, _label: string): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_IDENTITY_BYTES ||
    value !== value.normalize('NFC') ||
    [...value].some((character) => {
      const codePoint = character.codePointAt(0)!;
      return codePoint <= 0x1f || codePoint === 0x7f;
    })
  ) {
    throw new SourceSigningAuthorityStoreError('INVALID_BACKEND');
  }
  return value;
}

function digest(bytes: Uint8Array): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
}

async function requireRealParent(filePath: string): Promise<void> {
  const parent = path.dirname(filePath);
  const stat = await lstat(parent);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('state parent is unsafe');
  await realpath(parent);
}

function assertSafeStateStat(stat: Awaited<ReturnType<typeof lstat>>): void {
  if (stat.isSymbolicLink() || !stat.isFile() || stat.size <= 0 || stat.size > MAX_STATE_BYTES) {
    throw new Error('state file is unsafe');
  }
  if (process.platform !== 'win32' && (Number(stat.mode) & 0o777) !== 0o600) {
    throw new Error('state file permissions are unsafe');
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
