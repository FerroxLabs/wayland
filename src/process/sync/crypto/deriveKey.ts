/**
 * Passphrase → 32-byte symmetric key using Node's scrypt (RFC 7914).
 *
 * Parameters chosen for interactive use (encrypt on enable + each forceSync):
 *   N=131072 (2^17), r=8, p=1 → ~128 MB RAM, ~0.5 s on modern hardware.
 *   These are the same defaults used by OpenSSH's bcrypt-pbkdf replacement
 *   and are well within the OWASP-recommended floor for scrypt.
 *
 * SECURITY NOTES
 * - Salt is 32 random bytes generated per-enable; stored alongside ciphertext
 *   in plaintext (this is standard practice - salt is not secret).
 * - Key is never persisted; re-derived each time from passphrase + salt.
 * - Passphrase is never transmitted.
 * - Future upgrade path: swap for argon2id when a pure-JS implementation
 *   with a stable Electron/Bun native binding story is available.
 *   The interface (passphrase + salt → Uint8Array) is identical.
 */

import { scrypt, randomBytes } from 'node:crypto';

const SCRYPT_N = 131072; // 2^17
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 32;

export const SALT_LEN = 32;

/** Generate a fresh random salt for a new sync enable. */
export function generateSalt(): Uint8Array {
  return new Uint8Array(randomBytes(SALT_LEN));
}

/** Derive a 32-byte key from a passphrase + salt using scrypt. */
export function deriveKey(passphrase: string, salt: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    // maxmem must accommodate 128 * N * r bytes (~128 MB at our params). Node's
    // default ceiling is 32 MB, so we bump it explicitly.
    scrypt(
      passphrase,
      Buffer.from(salt),
      KEY_LEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024 },
      (err, key) => {
        if (err) reject(err);
        else resolve(new Uint8Array(key));
      }
    );
  });
}
