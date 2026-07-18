/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { lstat, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';

import {
  FileSourceSigningAuthorityStateBackend,
  loadOrCreateSourceSigningAuthority,
  TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT,
  type LoadedSourceSigningAuthority,
  type SourceSigningAuthorityVaultBackend,
} from './sourceSigningAuthorityStore';

const PROVIDER = 'electron-safe-storage';
const VAULT_REFERENCE_PREFIX = 'electron-safe-storage:v1:';
const IDENTITY_DIRECTORY = 'transfer-source-authority-v1';
const PUBLIC_STATE_FILE = 'identity.json';
const MAX_PRIVATE_KEY_BYTES = 512;

export type ElectronSafeStorageAuthorityBackend = Readonly<{
  isEncryptionAvailable(): boolean;
  getSelectedStorageBackend?(): 'basic_text' | 'gnome_libsecret' | 'kwallet' | 'kwallet5' | 'kwallet6' | 'unknown';
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}>;

export type LoadProductionSourceSigningAuthorityDependencies = Readonly<{
  userDataRoot?: string;
  safeStorage?: ElectronSafeStorageAuthorityBackend;
  platform?: NodeJS.Platform;
}>;

/**
 * The wrapped PKCS#8 bytes live only in the owner-only identity state as an
 * opaque OS-vault reference. There is no file-key or plaintext fallback.
 */
export function createElectronSafeStorageSourceSigningAuthorityVaultBackend(
  safeStorage: ElectronSafeStorageAuthorityBackend,
  platform: NodeJS.Platform = process.platform
): SourceSigningAuthorityVaultBackend {
  const requireAvailable = (): void => {
    if (!safeStorage || !safeStorage.isEncryptionAvailable()) {
      throw new Error('Transfer source signing authority requires an available OS credential store');
    }
    if (platform === 'linux') {
      const backend = safeStorage.getSelectedStorageBackend?.();
      if (!backend || !['gnome_libsecret', 'kwallet', 'kwallet5', 'kwallet6'].includes(backend)) {
        throw new Error('Transfer source signing authority rejects the selected Linux credential backend');
      }
    }
  };
  return Object.freeze({
    provider: PROVIDER,
    async createOnce({ slot, privateKeyPkcs8 }) {
      requireAvailable();
      assertSlot(slot);
      assertPrivateKeyBytes(privateKeyPkcs8);
      const encoded = Buffer.from(privateKeyPkcs8).toString('base64url');
      const wrapped = safeStorage.encryptString(encoded);
      try {
        if (!(wrapped instanceof Buffer) || wrapped.byteLength === 0) {
          throw new Error('OS credential store returned invalid wrapped authority');
        }
        return Object.freeze({
          disposition: 'created' as const,
          vaultRef: `${VAULT_REFERENCE_PREFIX}${wrapped.toString('base64url')}`,
        });
      } finally {
        wrapped.fill(0);
      }
    },
    async read({ slot, vaultRef }) {
      requireAvailable();
      assertSlot(slot);
      if (typeof vaultRef !== 'string' || !vaultRef.startsWith(VAULT_REFERENCE_PREFIX)) {
        throw new Error('Transfer source signing authority vault reference is invalid');
      }
      const encodedCiphertext = vaultRef.slice(VAULT_REFERENCE_PREFIX.length);
      if (!/^[A-Za-z0-9_-]+$/.test(encodedCiphertext)) {
        throw new Error('Transfer source signing authority vault reference is invalid');
      }
      const wrapped = Buffer.from(encodedCiphertext, 'base64url');
      if (wrapped.byteLength === 0 || wrapped.toString('base64url') !== encodedCiphertext) {
        wrapped.fill(0);
        throw new Error('Transfer source signing authority vault reference is invalid');
      }
      let encodedPrivateKey: string;
      try {
        encodedPrivateKey = safeStorage.decryptString(wrapped);
      } finally {
        wrapped.fill(0);
      }
      if (!/^[A-Za-z0-9_-]+$/.test(encodedPrivateKey)) {
        throw new Error('OS credential store returned an invalid transfer authority');
      }
      const privateKey = Buffer.from(encodedPrivateKey, 'base64url');
      if (
        privateKey.byteLength === 0 ||
        privateKey.byteLength > MAX_PRIVATE_KEY_BYTES ||
        privateKey.toString('base64url') !== encodedPrivateKey
      ) {
        privateKey.fill(0);
        throw new Error('OS credential store returned an invalid transfer authority');
      }
      return privateKey;
    },
  });
}

/** Load the one production source identity rooted under Electron userData. */
export async function loadProductionSourceSigningAuthority(
  dependencies: LoadProductionSourceSigningAuthorityDependencies = {}
): Promise<LoadedSourceSigningAuthority> {
  const electron =
    dependencies.userDataRoot && dependencies.safeStorage
      ? undefined
      : await import('electron').catch(() => {
          throw new Error('Transfer source signing authority is unavailable outside Electron');
        });
  const userDataRoot = dependencies.userDataRoot ?? electron!.app.getPath('userData');
  const safeStorage = dependencies.safeStorage ?? electron!.safeStorage;
  const identityRoot = await ensurePrivateIdentityDirectory(userDataRoot);
  return loadOrCreateSourceSigningAuthority({
    vault: createElectronSafeStorageSourceSigningAuthorityVaultBackend(safeStorage, dependencies.platform),
    state: new FileSourceSigningAuthorityStateBackend(path.join(identityRoot, PUBLIC_STATE_FILE)),
  });
}

function assertSlot(slot: string): void {
  if (slot !== TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT) {
    throw new Error('Transfer source signing authority slot is invalid');
  }
}

function assertPrivateKeyBytes(bytes: Uint8Array): void {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > MAX_PRIVATE_KEY_BYTES) {
    throw new Error('Transfer source signing authority key is invalid');
  }
}

async function ensurePrivateIdentityDirectory(userDataRoot: string): Promise<string> {
  if (typeof userDataRoot !== 'string' || userDataRoot.length === 0 || userDataRoot.includes('\0')) {
    throw new Error('Transfer source signing authority root is invalid');
  }
  const realUserDataRoot = await realpath(userDataRoot);
  const parent = await lstat(realUserDataRoot);
  if (!parent.isDirectory() || parent.isSymbolicLink()) {
    throw new Error('Transfer source signing authority root is unsafe');
  }
  const identityRoot = path.join(realUserDataRoot, IDENTITY_DIRECTORY);
  try {
    await mkdir(identityRoot, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  const identity = await lstat(identityRoot);
  if (
    !identity.isDirectory() ||
    identity.isSymbolicLink() ||
    (process.platform !== 'win32' && (Number(identity.mode) & 0o077) !== 0)
  ) {
    throw new Error('Transfer source signing authority directory is unsafe');
  }
  return realpath(identityRoot);
}
