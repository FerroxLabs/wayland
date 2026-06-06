/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { AUTH_CONFIG } from '@process/webserver/config/constants';
import { getDatabase } from '@process/services/database/export';
import type { IUser, IQueryResult } from '@process/services/database/types';

/**
 * Authentication user type containing only essential auth fields
 */
export type AuthUser = Pick<
  IUser,
  'id' | 'username' | 'password_hash' | 'jwt_secret' | 'created_at' | 'updated_at' | 'last_login'
>;

/**
 * Unwrap database query result, throw error on failure
 * @param result - Query result
 * @param errorMessage - Error message
 * @returns Unwrapped data
 */
function unwrap<T>(result: IQueryResult<T>, errorMessage: string): T {
  if (!result.success || typeof result.data === 'undefined' || result.data === null) {
    throw new Error(result.error || errorMessage);
  }
  return result.data;
}

/**
 * Map database user record to auth user object
 * @param row - Database user record
 * @returns Auth user object
 */
function mapUser(row: IUser): AuthUser {
  return {
    id: row.id,
    username: row.username,
    password_hash: row.password_hash,
    jwt_secret: row.jwt_secret ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login: row.last_login ?? null,
  };
}

function hasPassword(user: AuthUser | null): boolean {
  return !!user?.password_hash?.trim();
}

/**
 * User Repository - Provides user data access interface
 */
export const UserRepository = {
  /**
   * Check if any users exist in the system
   * @returns Whether users exist
   */
  async hasUsers(): Promise<boolean> {
    const db = await getDatabase();
    const result = db.hasUsers();
    if (!result.success) {
      throw new Error(result.error || 'Failed to check users');
    }
    // Database layer already ignores placeholder rows without passwords
    return Boolean(result.data);
  },

  async getSystemUser(): Promise<AuthUser | null> {
    const db = await getDatabase();
    const system = db.getSystemUser();
    if (!system) {
      return null;
    }
    return mapUser(system);
  },

  async getPrimaryWebUIUser(): Promise<AuthUser | null> {
    const systemUser = await this.getSystemUser();
    if (hasPassword(systemUser)) {
      return systemUser;
    }

    const defaultAdmin = await this.findByUsername(AUTH_CONFIG.DEFAULT_USER.USERNAME);
    if (hasPassword(defaultAdmin)) {
      return defaultAdmin;
    }

    if (systemUser && systemUser.username !== systemUser.id) {
      return systemUser;
    }

    return null;
  },

  async setSystemUserCredentials(username: string, passwordHash: string): Promise<void> {
    const db = await getDatabase();
    db.setSystemUserCredentials(username, passwordHash);
  },

  /**
   * Create a new user
   * @param username - Username
   * @param passwordHash - Password hash
   * @returns Created user
   */
  async createUser(username: string, passwordHash: string): Promise<AuthUser> {
    const db = await getDatabase();
    const result = db.createUser(username, undefined, passwordHash);
    const user = unwrap(result, 'Failed to create user');
    return mapUser(user);
  },

  /**
   * Find user by username
   * @param username - Username
   * @returns User object or null
   */
  async findByUsername(username: string): Promise<AuthUser | null> {
    const db = await getDatabase();
    const result = db.getUserByUsername(username);
    if (!result.success || !result.data) {
      return null;
    }
    return mapUser(result.data);
  },

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User object or null
   */
  async findById(id: string): Promise<AuthUser | null> {
    const db = await getDatabase();
    const result = db.getUser(id);
    if (!result.success || !result.data) {
      return null;
    }
    return mapUser(result.data);
  },

  /**
   * Get list of all users
   * @returns Array of users
   */
  async listUsers(): Promise<AuthUser[]> {
    const db = await getDatabase();
    const result = db.getAllUsers();
    if (!result.success || !result.data) {
      return [];
    }
    return result.data.map(mapUser);
  },

  /**
   * Count total number of users
   * @returns Number of users
   */
  async countUsers(): Promise<number> {
    const db = await getDatabase();
    const result = db.getUserCount();
    if (!result.success) {
      throw new Error(result.error || 'Failed to count users');
    }
    return result.data ?? 0;
  },

  /**
   * Update user password
   * @param userId - User ID
   * @param passwordHash - New password hash
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const db = await getDatabase();
    const result = db.updateUserPassword(userId, passwordHash);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update user password');
    }
  },

  async updateUsername(userId: string, username: string): Promise<void> {
    const db = await getDatabase();
    const result = db.updateUserUsername(userId, username);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update username');
    }
  },

  /**
   * Update user's last login time
   * @param userId - User ID
   */
  async updateLastLogin(userId: string): Promise<void> {
    const db = await getDatabase();
    const result = db.updateUserLastLogin(userId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update last login');
    }
  },

  /**
   * Update user's JWT secret
   * @param userId - User ID
   * @param jwtSecret - JWT secret string
   */
  async updateJwtSecret(userId: string, jwtSecret: string): Promise<void> {
    const db = await getDatabase();
    const result = db.updateUserJwtSecret(userId, jwtSecret);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update JWT secret');
    }
  },
};
