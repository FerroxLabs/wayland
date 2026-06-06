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
 * returns `false`. In that case `encryptString` THROWS rather than silently
 * falling back to plaintext storage. Callers must surface the error and
 * remediate (install `libsecret-1-0` / `gnome-keyring`, or refuse to persist
 * credentials).
 *
 * Ciphertext is opaque base64 and is prefixed with {@link CIPHER_PREFIX} so
 * stored values can be distinguished from legacy `b64:` / `plain:` formats
 * during migration.
 */

import { safeStorage } from 'electron';

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
 * Encrypts a UTF-8 plaintext string using Electron `safeStorage` and returns
 * a prefixed base64-encoded ciphertext.
 *
 * @throws Error when encryption is unavailable on the host. The error message
 *   includes remediation guidance for Linux users.
 */
export function encryptString(plaintext: string): EncryptedString {
  if (!isEncryptionAvailable()) {
    throw new Error(
      '[secrets/safeStorage] OS credential encryption is not available. ' +
        'On Linux, install libsecret (e.g. `apt install libsecret-1-0 gnome-keyring`) ' +
        'and ensure a secret service is running. On headless servers, run a session ' +
        'with `dbus-launch` or refuse to persist credentials. Refusing to fall back ' +
        'to plaintext.'
    );
  }

  const cipherBuffer = safeStorage.encryptString(plaintext);
  return `${CIPHER_PREFIX}${cipherBuffer.toString('base64')}`;
}

/**
 * Decrypts a value produced by {@link encryptString}.
 *
 * @throws Error when the input does not carry the {@link CIPHER_PREFIX} or
 *   when the underlying `safeStorage.decryptString` rejects the payload.
 */
export function decryptString(encoded: EncryptedString): string {
  if (!encoded.startsWith(CIPHER_PREFIX)) {
    throw new Error(
      `[secrets/safeStorage] Refusing to decrypt value without "${CIPHER_PREFIX}" prefix. ` +
        'Legacy `b64:` / `plain:` values must be migrated explicitly.'
    );
  }

  const cipherBase64 = encoded.slice(CIPHER_PREFIX.length);
  const cipherBuffer = Buffer.from(cipherBase64, 'base64');
  return safeStorage.decryptString(cipherBuffer);
}
