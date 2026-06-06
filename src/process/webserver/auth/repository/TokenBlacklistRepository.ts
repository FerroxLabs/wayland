/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatabase } from '@process/services/database/export';

/**
 * Token blacklist row stored in the `token_blacklist` table.
 *
 * Persists revoked tokens (logout) so a process restart cannot resurrect a
 * stolen JWT. Rows are pruned once `expires_at` is in the past - at that
 * point the JWT itself has expired and no longer needs explicit blacklisting.
 */
export type TokenBlacklistRow = {
  token_hash: string;
  expires_at: number;
};

/**
 * Repository over the `token_blacklist` SQLite table.
 *
 * Narrow on purpose - only the operations AuthService's blacklist flow uses.
 */
export const TokenBlacklistRepository = {
  /**
   * Insert a revoked token hash. Idempotent - re-revoking is a no-op.
   */
  async add(tokenHash: string, expiresAt: number): Promise<void> {
    const db = await getDatabase();
    const driver = db.getDriver();
    driver
      .prepare('INSERT OR REPLACE INTO token_blacklist (token_hash, expires_at) VALUES (?, ?)')
      .run(tokenHash, expiresAt);
  },

  /**
   * Load all still-active rows (expires_at > now). Used on AuthService init
   * to rehydrate the in-memory Map after a restart.
   */
  async loadActive(now: number): Promise<TokenBlacklistRow[]> {
    const db = await getDatabase();
    const driver = db.getDriver();
    const rows = driver
      .prepare('SELECT token_hash, expires_at FROM token_blacklist WHERE expires_at > ?')
      .all(now) as TokenBlacklistRow[];
    return rows;
  },

  /**
   * Delete every row whose token has already expired. Called on startup and
   * periodically by the cleanup timer.
   */
  async pruneExpired(now: number): Promise<number> {
    const db = await getDatabase();
    const driver = db.getDriver();
    const result = driver.prepare('DELETE FROM token_blacklist WHERE expires_at <= ?').run(now);
    return Number(result.changes ?? 0);
  },
};
