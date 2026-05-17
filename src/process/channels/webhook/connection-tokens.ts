/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomBytes } from 'node:crypto';
import type { ConnectionTokenRecord } from './types';

/**
 * In-memory connection-token store.
 *
 * The store mints opaque tokens and resolves them back to the
 * (platform, pluginInstance, agent) tuple the receiver needs to route a
 * webhook. Pure data-structure — persistence is layered on by the caller
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
   */
  register(platform: string, pluginInstanceId: string, agentId: string): ConnectionTokenRecord {
    const token = this.generateConnectionToken();
    const record: ConnectionTokenRecord = {
      token,
      platform,
      pluginInstanceId,
      agentId,
      createdAt: Date.now(),
    };
    this.records.set(token, record);
    return record;
  }

  /**
   * Resolve a token. Returns null if the token is unknown OR has been revoked.
   * Revocation is a tombstone, not a delete — the caller can still audit which
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
   */
  serialize(): readonly ConnectionTokenRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Replace the in-memory state with persisted records. Called once on
   * ChannelManager init to survive app restarts (without this every webhook
   * URL would become invalid on relaunch).
   */
  hydrate(records: readonly ConnectionTokenRecord[]): void {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.token, record);
    }
  }
}
