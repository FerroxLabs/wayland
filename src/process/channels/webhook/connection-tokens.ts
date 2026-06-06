/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomBytes } from 'node:crypto';
import { CIPHER_PREFIX, decryptString, encryptString, isEncryptionAvailable } from '@process/secrets';
import type { ConnectionTokenRecord } from './types';

/**
 * Encrypt a webhook secret for at-rest persistence (SEC-DATA-03 / RT-S2).
 *
 * Empty secrets and already-encrypted values are returned untouched so the
 * call is idempotent. For a non-empty plaintext secret we require OS
 * credential encryption to be available and throw otherwise - this makes the
 * snapshot fail loudly rather than silently emitting a plaintext secret into
 * the persisted (only base64-encoded) config. The caller's persist path
 * surfaces and logs the thrown error, and `serialize()` aborts atomically so
 * no partial plaintext residue is written.
 */
function encryptSecret(secret: string): string {
  if (!secret || secret.startsWith(CIPHER_PREFIX)) return secret;
  if (!isEncryptionAvailable()) {
    throw new Error(
      '[ConnectionTokenStore] RT-S2: refusing to persist a plaintext webhook secret - ' +
        'OS credential encryption is unavailable. The webhook works for this session but ' +
        'will NOT survive a restart until secure storage is available. On Linux, install/run ' +
        'a keyring (gnome-keyring / libsecret, e.g. launch via dbus-launch) to enable persistence.'
    );
  }
  return encryptString(secret);
}

/**
 * Decrypt a persisted webhook secret back to plaintext (SEC-DATA-03).
 *
 * Values without the cipher prefix are legacy plaintext (written before this
 * fix) and are returned unchanged for backward compatibility. A decrypt
 * failure (e.g. corrupted ciphertext or a missing keystore) is tolerated by
 * dropping the secret to empty so hydration of the remaining records still
 * succeeds; the affected webhook will then fail verification rather than
 * accept unverifiable events.
 */
function decryptSecret(secret: string): string {
  if (!secret || !secret.startsWith(CIPHER_PREFIX)) return secret;
  try {
    return decryptString(secret);
  } catch (err) {
    console.error('[ConnectionTokenStore] Failed to decrypt webhook secret:', err);
    return '';
  }
}

/**
 * In-memory connection-token store.
 *
 * The store mints opaque tokens and resolves them back to the
 * (platform, pluginInstance, agent) tuple the receiver needs to route a
 * webhook. Pure data-structure - persistence is layered on by the caller
 * (ChannelManager / ProcessConfig) so this class can be tested in isolation.
 */
export class ConnectionTokenStore {
  private readonly records: Map<string, ConnectionTokenRecord> = new Map();

  /**
   * Generate a fresh URL-safe token. 32 random bytes encoded base64url → 43
   * characters (44 after potential trailing `=` which base64url omits). Long
   * enough that brute-force scanning is computationally infeasible.
   */
  generateConnectionToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Register a new token for the given routing target. Returns the persisted
   * record.
   *
   * `secret` is the per-platform verifier material (LINE channelSecret, Google
   * Chat JWT audience, MS Teams appId, Synology Chat incomingToken, generic
   * webhook HMAC secret, etc.). It is stored alongside the token so the
   * receiver resolver can hand it to the verifier without touching the
   * credential store.
   */
  register(platform: string, pluginInstanceId: string, agentId: string, secret: string): ConnectionTokenRecord {
    const token = this.generateConnectionToken();
    const record: ConnectionTokenRecord = {
      token,
      platform,
      pluginInstanceId,
      agentId,
      secret,
      createdAt: Date.now(),
    };
    this.records.set(token, record);
    return record;
  }

  /**
   * Resolve a token. Returns null if the token is unknown OR has been revoked.
   * Revocation is a tombstone, not a delete - the caller can still audit which
   * tokens were issued.
   */
  resolve(token: string): ConnectionTokenRecord | null {
    const record = this.records.get(token);
    if (!record) return null;
    if (record.revokedAt !== undefined) return null;
    return record;
  }

  /**
   * Mark a token as revoked. Idempotent: revoking an already-revoked or
   * unknown token is a no-op.
   */
  revoke(token: string): void {
    const record = this.records.get(token);
    if (!record || record.revokedAt !== undefined) return;
    record.revokedAt = Date.now();
  }

  /**
   * Record a successful use. Called by the receiver after dispatching a valid
   * event so that operators can spot stale tokens.
   */
  touch(token: string): void {
    const record = this.records.get(token);
    if (!record || record.revokedAt !== undefined) return;
    record.lastUsedAt = Date.now();
  }

  /**
   * Snapshot the full record set as a plain array for persistence.
   * Returns BOTH active and revoked records so audit trails survive restarts.
   *
   * SEC-DATA-03: the `secret` field is per-platform webhook verifier material
   * (HMAC keys, MS Teams/Google-Chat verification tokens, etc.). The config
   * store this is persisted into is only base64-encoded (NOT encrypted), so we
   * encrypt the secret at the serialization boundary via Electron safeStorage
   * (Keychain / DPAPI / libsecret). In-memory records stay plaintext so
   * verifiers can use them without round-tripping the cipher.
   */
  serialize(): readonly ConnectionTokenRecord[] {
    return Array.from(this.records.values(), (record) => ({
      ...record,
      secret: encryptSecret(record.secret),
    }));
  }

  /**
   * Replace the in-memory state with persisted records. Called once on
   * ChannelManager init to survive app restarts (without this every webhook
   * URL would become invalid on relaunch).
   *
   * SEC-DATA-03: secrets are persisted encrypted (see {@link serialize}), so we
   * decrypt them back to plaintext on load. Legacy records written before this
   * fix carry plaintext secrets without the cipher prefix and are passed
   * through unchanged so existing webhook URLs keep working.
   */
  hydrate(records: readonly ConnectionTokenRecord[]): void {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.token, {
        ...record,
        secret: decryptSecret(record.secret),
      });
    }
  }
}
