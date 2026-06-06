/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatabase } from '@process/services/database/export';

/**
 * Token family row stored in the `token_family` table.
 *
 * A family is created at login and embedded in every JWT for that session.
 * On logout / password-change the family is revoked, which forces any
 * still-live token belonging to the family to fail refresh.
 */
export type TokenFamilyRow = {
  id: string;
  user_id: string;
  created_at: number;
  revoked_at: number | null;
};

/**
 * Repository over the `token_family` SQLite table.
 *
 * Kept narrow on purpose: only the operations the H5 sliding-window refresh
 * flow needs. Anything broader belongs in WaylandUIDatabase.
 */
export const TokenFamilyRepository = {
  /**
   * Record a new token family for a user. Called once per login.
   */
  async create(familyId: string, userId: string): Promise<void> {
    const db = await getDatabase();
    const driver = db.getDriver();
    const now = Date.now();
    driver
      .prepare('INSERT OR IGNORE INTO token_family (id, user_id, created_at, revoked_at) VALUES (?, ?, ?, NULL)')
      .run(familyId, userId, now);
  },

  /**
   * Look up a family by id. Returns null when the row does not exist.
   */
  async find(familyId: string): Promise<TokenFamilyRow | null> {
    const db = await getDatabase();
    const driver = db.getDriver();
    const row = driver.prepare('SELECT id, user_id, created_at, revoked_at FROM token_family WHERE id = ?').get(
      familyId
    ) as TokenFamilyRow | undefined;
    return row ?? null;
  },

  /**
   * Returns true when the family is revoked (or unknown - fail closed).
   * Unknown families fail closed so a token whose family was deleted
   * (manual cleanup, fresh DB after restore) cannot continue refreshing.
   */
  async isRevoked(familyId: string): Promise<boolean> {
    const row = await this.find(familyId);
    if (!row) {
      return true;
    }
    return row.revoked_at !== null;
  },

  /**
   * Mark a single family revoked. Idempotent: re-revoking is a no-op.
   * Called on logout.
   */
  async revoke(familyId: string): Promise<void> {
    const db = await getDatabase();
    const driver = db.getDriver();
    const now = Date.now();
    driver
      .prepare('UPDATE token_family SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL')
      .run(now, familyId);
  },

  /**
   * Mark every family for a user revoked. Called on password change so
   * stolen tokens from any device are forced through re-login.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    const db = await getDatabase();
    const driver = db.getDriver();
    const now = Date.now();
    driver
      .prepare('UPDATE token_family SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL')
      .run(now, userId);
  },
};
