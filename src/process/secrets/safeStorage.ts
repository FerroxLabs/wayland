/**
 * Electron safeStorage wrapper.
 *
 * Provides OS-level credential encryption backed by:
 * - macOS: Keychain
 * - Windows: DPAPI
 * - Linux: libsecret (gnome-keyring, KWallet, or compatible secret service)
 *
 * On Linux distributions without libsecret/gnome-keyring (typical headless
 * servers and minimal container images), `safeStorage.isEncryptionAvailable()`
 * returns `false`. In the standalone (non-Electron) server runtime the
 * `electron` module - and thus `safeStorage` - is undefined entirely.
 *
 * In both of those cases we fall back to the file-key backend
 * ({@link ./fileKeyStore}): an AES-256-GCM scheme whose key is derived from a
 * 0600 per-install secret in the data directory. This is strictly weaker than
 * an OS keychain (see the security note in fileKeyStore.ts) but is what lets a
 * headless server persist provider credentials at all (issue #25). The Electron
 * keychain path remains preferred and is used whenever it is available; we never
 * silently write plaintext.
 *
 * Ciphertext is opaque base64 and is prefixed with {@link CIPHER_PREFIX}
 * (safeStorage) or {@link FILE_CIPHER_PREFIX} (file backend) so the two formats
 * - and the legacy `b64:` / `plain:` formats - are always distinguishable.
 */

import { safeStorage } from 'electron';
import { fileDecryptString, fileEncryptString, FILE_CIPHER_PREFIX } from './fileKeyStore';

/** Opaque ciphertext string returned by {@link encryptString}. */
export type EncryptedString = string;

/** Format identifier prepended to every ciphertext value. */
export const CIPHER_PREFIX = 'enc:v1:' as const;

/**
 * Returns `true` when the host OS exposes a working secret-store backend.
 *
 * On Linux this requires libsecret and a running secret service
 * (gnome-keyring, KWallet, etc.). Headless servers without these will
 * return `false`.
 */
export function isEncryptionAvailable(): boolean {
  // In a non-Electron runtime (the standalone bun web server) the `electron`
  // module - and thus `safeStorage` - is undefined. Degrade gracefully to
  // "unavailable" instead of throwing a TypeError on property access, so
  // callers that merely probe availability (onboarding detection, config
  // reads) keep working headless. encryptString still refuses to persist
  // secrets without a real backend, so this never silently writes plaintext.
  return typeof safeStorage?.isEncryptionAvailable === 'function' && safeStorage.isEncryptionAvailable();
}

/**
 * Encrypts a UTF-8 plaintext string and returns a prefixed base64 ciphertext.
 *
 * Prefers Electron `safeStorage` (OS keychain). When that is unavailable
 * (headless server, or Linux without libsecret) it falls back to the file-key
 * backend so credentials can still be persisted. Never writes plaintext.
 */
export function encryptString(plaintext: string): EncryptedString {
  if (isEncryptionAvailable()) {
    const cipherBuffer = safeStorage.encryptString(plaintext);
    return `${CIPHER_PREFIX}${cipherBuffer.toString('base64')}`;
  }
  // No OS keychain - use the file-key backend instead of refusing to persist.
  return fileEncryptString(plaintext);
}

/**
 * Decrypts a value produced by {@link encryptString}.
 *
 * Routes by scheme prefix: {@link FILE_CIPHER_PREFIX} values go to the file-key
 * backend, {@link CIPHER_PREFIX} values go to Electron `safeStorage`. This means
 * a blob written by either backend decrypts correctly regardless of which
 * backend is currently preferred - e.g. a value the file backend wrote stays
 * readable, and a keychain-written value still decrypts via safeStorage.
 *
 * @throws Error when the input carries neither known prefix, or when the
 *   underlying backend rejects the payload (bad tag, wrong key, corruption).
 */
export function decryptString(encoded: EncryptedString): string {
  if (encoded.startsWith(FILE_CIPHER_PREFIX)) {
    return fileDecryptString(encoded);
  }

  if (!encoded.startsWith(CIPHER_PREFIX)) {
    throw new Error(
      `[secrets/safeStorage] Refusing to decrypt value without "${CIPHER_PREFIX}" or "${FILE_CIPHER_PREFIX}" prefix. ` +
        'Legacy `b64:` / `plain:` values must be migrated explicitly.'
    );
  }

  const cipherBase64 = encoded.slice(CIPHER_PREFIX.length);
  const cipherBuffer = Buffer.from(cipherBase64, 'base64');
  return safeStorage.decryptString(cipherBuffer);
}
