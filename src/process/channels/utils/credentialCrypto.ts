/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Channel credential at-rest encryption.
 *
 * BEFORE Wave 3 of the channels expansion phase this file used base64 encoding
 * with a `b64:` / `plain:` / `enc:` prefix soup. Base64 is encoding, not
 * encryption - anyone with read access to the SQLite file could recover every
 * Slack/Twilio/AgentMail bot token. This module now routes every write through
 * Electron `safeStorage` (Keychain on macOS, DPAPI on Windows, libsecret on
 * Linux) via `@process/secrets`.
 *
 * Read path supports the legacy prefixes ONLY as a one-shot bridge so the
 * `migrateCredentialsToSafeStorage_v1` startup migration can re-encrypt
 * existing rows. Once `system.credentialsCryptoMigrated_v1` flips to `true`
 * there will be no `b64:` / `plain:` values in storage and the legacy bridge
 * is dormant. A future release will delete it outright.
 *
 * Sensitive vs non-sensitive fields are classified by
 * `@process/secrets/fieldClassification`. Non-sensitive fields (chatId,
 * accountId, etc.) pass through untouched so we don't double-encrypt
 * non-secret identifiers.
 */

import {
  CIPHER_PREFIX,
  encryptString as secretsEncryptString,
  decryptString as secretsDecryptString,
  isEncryptionAvailable as secretsIsEncryptionAvailable,
  isSensitiveField,
} from '@process/secrets';

const LEGACY_B64_PREFIX = 'b64:';
const LEGACY_PLAIN_PREFIX = 'plain:';
const LEGACY_ENC_PREFIX = 'enc:';

// Arrays-of-primitives are passed through unchanged (encrypt/decrypt only
// touch string-typed sensitive fields). Widened for IRC channels[], Nostr
// relays[], iMessage allowedHandles[] - audit fix CRIT4 2026-05-18.
type CredentialRecord = Record<string, string | number | boolean | readonly string[] | readonly number[] | undefined>;

/**
 * Returns `true` when the host OS exposes a working secret-store backend.
 * Re-exported from `@process/secrets` for legacy callers that imported it
 * from this file before the safeStorage migration.
 */
export function isEncryptionAvailable(): boolean {
  return secretsIsEncryptionAvailable();
}

/**
 * Encrypts a string for at-rest storage using Electron `safeStorage`.
 * Output always carries the `enc:v1:` prefix.
 *
 * @throws Error when OS-level encryption is unavailable. Callers must surface
 *   the error - silently falling back to plaintext would re-introduce the
 *   security bug this module fixes.
 */
export function encryptString(plaintext: string): string {
  if (!plaintext) return '';
  return secretsEncryptString(plaintext);
}

/**
 * Decrypts a value previously written by this module.
 *
 * Supports four shapes for one-shot migration:
 *   1. `enc:v1:<base64>` - current safeStorage ciphertext.
 *   2. `b64:<base64>`    - legacy base64 obfuscation (Wave-2 and earlier).
 *   3. `plain:<text>`    - legacy plaintext fallback when base64 threw.
 *   4. `enc:<base64>`    - legacy safeStorage ciphertext without the `v1`
 *      version bump (older Aion builds). Best-effort base64 decode.
 *   5. No prefix         - pre-historic raw value; return as-is.
 *
 * The legacy bridge is **read-only**. Migration code is responsible for
 * re-encrypting the recovered plaintext through {@link encryptString}.
 */
export function decryptString(encoded: string): string {
  if (!encoded) return '';

  if (encoded.startsWith(CIPHER_PREFIX)) {
    return secretsDecryptString(encoded);
  }

  if (encoded.startsWith(LEGACY_B64_PREFIX)) {
    try {
      return Buffer.from(encoded.slice(LEGACY_B64_PREFIX.length), 'base64').toString('utf-8');
    } catch (error) {
      console.error('[credentialCrypto] Legacy b64 decode failed:', error);
      return '';
    }
  }

  if (encoded.startsWith(LEGACY_PLAIN_PREFIX)) {
    return encoded.slice(LEGACY_PLAIN_PREFIX.length);
  }

  if (encoded.startsWith(LEGACY_ENC_PREFIX)) {
    // Old "safeStorage but not version-prefixed" format. Aion never actually
    // shipped safeStorage in our fork, so in practice this is base64 too.
    console.warn('[credentialCrypto] Found legacy enc: format, attempting base64 decode');
    try {
      return Buffer.from(encoded.slice(LEGACY_ENC_PREFIX.length), 'base64').toString('utf-8');
    } catch (error) {
      console.error('[credentialCrypto] Legacy enc: decode failed:', error);
      return '';
    }
  }

  console.warn('[credentialCrypto] Found legacy unprefixed value, returning as-is');
  return encoded;
}

/**
 * Encrypts every sensitive field in `credentials`. Non-sensitive fields and
 * non-string values pass through unchanged.
 *
 * Sensitivity is determined by `isSensitiveField` from
 * `@process/secrets/fieldClassification` - adding a new sensitive field name
 * there automatically opts every plugin into encryption without touching this
 * module.
 */
export function encryptCredentials(credentials: CredentialRecord | undefined): CredentialRecord | undefined {
  if (!credentials) return undefined;

  const out: CredentialRecord = {};
  for (const [key, value] of Object.entries(credentials)) {
    if (typeof value === 'string' && value && isSensitiveField(key)) {
      out[key] = encryptString(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Decrypts every sensitive field in `credentials`. Mirrors
 * {@link encryptCredentials} - only sensitive string fields are routed
 * through {@link decryptString}; everything else passes through.
 */
export function decryptCredentials(credentials: CredentialRecord | undefined): CredentialRecord | undefined {
  if (!credentials) return undefined;

  const out: CredentialRecord = {};
  for (const [key, value] of Object.entries(credentials)) {
    if (typeof value === 'string' && value && isSensitiveField(key)) {
      out[key] = decryptString(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}
