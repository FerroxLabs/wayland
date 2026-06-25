/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File-backed secrets fallback for non-Electron (headless / server) runtimes.
 *
 * Electron `safeStorage` binds the encryption key to the OS keychain
 * (macOS Keychain / Windows DPAPI / Linux libsecret). On a headless server
 * none of those exist, so `safeStorage.isEncryptionAvailable()` is `false` and
 * `safeStorage.encryptString` refuses to run. Without a fallback the model
 * registry can never persist provider credentials, so the Models page stays
 * empty even when valid keys are present (issue #25).
 *
 * This module provides that fallback. It is used ONLY when Electron
 * `safeStorage` is unavailable; the Electron keychain path remains preferred
 * and unchanged.
 *
 * SECURITY TRADEOFF (read before auditing):
 *   The encryption key is derived from a 32-byte random secret stored in a
 *   0600 file inside the data directory. This is strictly WEAKER than an OS
 *   keychain: anyone who can read the data directory (root, a backup daemon,
 *   or the app's own UID) can read the secret and therefore decrypt the
 *   ciphertext. It does NOT protect against a local attacker who already has
 *   read access to the data dir. It DOES protect against:
 *     - other local UNIX users (file is 0600, dir is 0700),
 *     - leaking the SQLite file alone (the key is not in the DB),
 *     - off-host backups of just the DB.
 *   This is acceptable for the intended deployment: a single-tenant container
 *   living behind Tailscale where the data dir is owner-only. It is the same
 *   security posture as the rest of the 0600 config blobs on disk.
 */

import {
  chmodSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeSync,
  closeSync,
  unlinkSync,
} from 'node:fs';
import path from 'node:path';
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';
import { getPlatformServices } from '@/common/platform';

/**
 * Scheme prefix for file-key-backed ciphertext. Distinct from the safeStorage
 * `enc:v1:` prefix so the two blob formats can never be confused: a value
 * written by one backend is rejected (not silently mis-decrypted) by the other.
 */
export const FILE_CIPHER_PREFIX = 'fenc:v1:' as const;

/** Name of the per-install secret key file inside the data directory. */
const SECRET_KEY_FILE = '.secret-key';

/** Length of the raw per-install secret, in bytes. */
const SECRET_LEN = 32;

/** AES-256-GCM key length, in bytes. */
const KEY_LEN = 32;

/** GCM IV length, in bytes (96-bit IV is the GCM standard / NIST recommendation). */
const IV_LEN = 12;

/** GCM authentication tag length, in bytes. */
const TAG_LEN = 16;

/**
 * Fixed application salt + info for HKDF. These are NOT secret - HKDF's security
 * comes from the secret IKM (the random key file), not from these strings. They
 * are fixed so the same secret always derives the same key, and namespaced so
 * the derived key is domain-separated from any other future HKDF use.
 */
const HKDF_SALT = Buffer.from('wayland.secrets.fileKeyStore.salt.v1', 'utf8');
const HKDF_INFO = Buffer.from('wayland.secrets.fileKeyStore.aes-256-gcm.v1', 'utf8');

/**
 * Cached derived key for the lifetime of the process. The secret never changes
 * once created, so deriving once avoids re-reading the file on every call.
 */
let cachedKey: Buffer | null = null;

/** Resolve the absolute path of the secret key file in the data directory. */
function secretKeyPath(): string {
  return path.join(getPlatformServices().paths.getDataDir(), SECRET_KEY_FILE);
}

/**
 * Load the per-install secret, creating it on first use.
 *
 * Creation is atomic: the file is opened with `wx` (O_CREAT | O_EXCL) so two
 * concurrent boots cannot both write a fresh secret and clobber each other -
 * the loser of the race gets EEXIST and re-reads the winner's file. The file is
 * created 0600 and the containing data dir 0700 so no other local user can read
 * the secret. The secret bytes are NEVER logged.
 */
function loadOrCreateSecret(): Buffer {
  const dataDir = getPlatformServices().paths.getDataDir();
  const keyFile = secretKeyPath();

  // Ensure the data dir exists and is owner-only. mkdir mode is masked by the
  // process umask, so chmod explicitly to guarantee 0700 even under a loose umask.
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  }
  try {
    chmodSync(dataDir, 0o700);
  } catch {
    // Best-effort on platforms / filesystems that ignore POSIX modes (Windows).
  }

  // Fast path: secret already exists.
  if (existsSync(keyFile)) {
    const existing = readFileSync(keyFile);
    if (existing.length === SECRET_LEN) return existing;
    // A truncated / corrupt secret is unrecoverable - existing ciphertext can
    // never be decrypted with a different key anyway. Fail loudly rather than
    // silently minting a new secret that would orphan all stored credentials.
    throw new Error(
      `[secrets/fileKeyStore] Secret key file is corrupt (expected ${SECRET_LEN} bytes, got ${existing.length}). ` +
        'Refusing to overwrite it. Remove it manually only if you accept that all stored credentials become undecryptable.'
    );
  }

  // Create atomically. `wx` = O_CREAT | O_EXCL: fails with EEXIST if another
  // process created it first, in which case we re-read theirs.
  const secret = randomBytes(SECRET_LEN);
  let fd: number | null = null;
  try {
    fd = openSync(keyFile, 'wx', 0o600);
    writeSync(fd, secret);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      // Lost the race - read the secret the winner just wrote.
      const winner = readFileSync(keyFile);
      if (winner.length === SECRET_LEN) return winner;
      throw new Error('[secrets/fileKeyStore] Concurrent secret-key creation produced a corrupt file.');
    }
    throw err;
  } finally {
    if (fd !== null) closeSync(fd);
  }
  // openSync mode is masked by umask; chmod explicitly so the file is 0600
  // regardless of the process umask.
  try {
    chmodSync(keyFile, 0o600);
  } catch {
    // Best-effort on filesystems that ignore POSIX modes.
  }
  return secret;
}

/** Derive (and cache) the AES-256 key from the per-install secret via HKDF-SHA256. */
function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = loadOrCreateSecret();
  // hkdfSync returns an ArrayBuffer; wrap it in a Buffer for the cipher API.
  const derived = hkdfSync('sha256', secret, HKDF_SALT, HKDF_INFO, KEY_LEN);
  cachedKey = Buffer.from(derived);
  return cachedKey;
}

/**
 * Encrypt `plaintext` with AES-256-GCM using a fresh random 12-byte IV.
 *
 * Output: `FILE_CIPHER_PREFIX` + base64( iv | authTag | ciphertext ).
 * A new IV per call means encrypting the same plaintext twice yields different
 * ciphertext (no IV reuse, which would break GCM's confidentiality guarantees).
 */
export function fileEncryptString(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes
  const packed = Buffer.concat([iv, authTag, ciphertext]);
  return `${FILE_CIPHER_PREFIX}${packed.toString('base64')}`;
}

/**
 * Decrypt a value produced by {@link fileEncryptString}.
 *
 * Verifies the GCM authentication tag: any tamper with the IV, tag, or
 * ciphertext - or a wrong key (different secret file) - makes `decipher.final()`
 * throw, so this never returns mangled plaintext.
 *
 * @throws Error when the prefix is missing, the blob is too short, or the GCM
 *   tag fails to verify.
 */
export function fileDecryptString(encoded: string): string {
  if (!encoded.startsWith(FILE_CIPHER_PREFIX)) {
    throw new Error(`[secrets/fileKeyStore] Refusing to decrypt value without "${FILE_CIPHER_PREFIX}" prefix.`);
  }
  const packed = Buffer.from(encoded.slice(FILE_CIPHER_PREFIX.length), 'base64');
  if (packed.length < IV_LEN + TAG_LEN) {
    throw new Error('[secrets/fileKeyStore] Ciphertext is too short to contain an IV and auth tag.');
  }
  const iv = packed.subarray(0, IV_LEN);
  const authTag = packed.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = packed.subarray(IV_LEN + TAG_LEN);

  const key = getKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  // decipher.final() throws if the tag does not verify (tamper / wrong key).
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Test-only: reset the in-memory derived-key cache and delete the on-disk secret
 * so a test can exercise first-use creation deterministically. Never called by
 * production code.
 */
export function _resetFileKeyStoreForTests(): void {
  cachedKey = null;
  const keyFile = secretKeyPath();
  if (existsSync(keyFile)) unlinkSync(keyFile);
}
