/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const JWT_SECRET = 'db-secret';

function mockUserRepository(): void {
  vi.doMock('@process/webserver/auth/repository/UserRepository', () => ({
    UserRepository: {
      getPrimaryWebUIUser: vi.fn(async () => ({
        id: 'system-user',
        username: 'admin',
        password_hash: 'hash',
        jwt_secret: JWT_SECRET,
        created_at: 0,
        updated_at: 0,
        last_login: null,
      })),
      updateJwtSecret: vi.fn(),
    },
  }));
}

type FamilyStore = Map<string, { userId: string; revoked: boolean }>;

function mockTokenFamilyRepository(store: FamilyStore) {
  const create = vi.fn(async (familyId: string, userId: string) => {
    if (!store.has(familyId)) {
      store.set(familyId, { userId, revoked: false });
    }
  });
  const isRevoked = vi.fn(async (familyId: string) => {
    const row = store.get(familyId);
    if (!row) return true; // unknown families fail closed
    return row.revoked;
  });
  const revoke = vi.fn(async (familyId: string) => {
    const row = store.get(familyId);
    if (row) row.revoked = true;
  });
  const revokeAllForUser = vi.fn(async (userId: string) => {
    for (const row of store.values()) {
      if (row.userId === userId) row.revoked = true;
    }
  });
  const find = vi.fn(async (familyId: string) => {
    const row = store.get(familyId);
    return row ? { id: familyId, user_id: row.userId, created_at: 0, revoked_at: row.revoked ? 1 : null } : null;
  });

  vi.doMock('@process/webserver/auth/repository/TokenFamilyRepository', () => ({
    TokenFamilyRepository: { create, isRevoked, revoke, revokeAllForUser, find },
  }));

  return { create, isRevoked, revoke, revokeAllForUser, find };
}

describe('AuthService refreshToken (H5 - bounded sliding window)', () => {
  let familyStore: FamilyStore;

  beforeEach(() => {
    vi.resetModules();
    familyStore = new Map();
    mockUserRepository();
    mockTokenFamilyRepository(familyStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes a slightly-expired token within the 1h sliding window and the 7d iat ceiling', async () => {
    const { AuthService } = await import('@process/webserver/auth/service/AuthService');

    // Pre-seed a family so the legacy expired token below has a valid family.
    familyStore.set('family-a', { userId: 'user-1', revoked: false });

    const nowSec = Math.floor(Date.now() / 1000);
    const expiredToken = jwt.sign(
      {
        userId: 'user-1',
        username: 'alice',
        family: 'family-a',
        // iat 10 minutes ago, exp 10 seconds ago - well inside both bounds.
        iat: nowSec - 600,
        exp: nowSec - 10,
      },
      JWT_SECRET,
      {
        audience: 'wayland-webui',
        issuer: 'wayland',
      }
    );

    const refreshedToken = await AuthService.refreshToken(expiredToken);

    expect(refreshedToken).toEqual(expect.any(String));
    expect(refreshedToken).not.toBe(expiredToken);
    await expect(AuthService.verifyToken(refreshedToken!)).resolves.toMatchObject({
      userId: 'user-1',
      username: 'alice',
      family: 'family-a',
    });
  });

  it('rejects refresh when the token iat is older than 7 days', async () => {
    const { AuthService } = await import('@process/webserver/auth/service/AuthService');

    familyStore.set('family-old', { userId: 'user-1', revoked: false });

    const nowSec = Math.floor(Date.now() / 1000);
    const eightDaysAgo = nowSec - 8 * 24 * 60 * 60;
    const ancientToken = jwt.sign(
      {
        userId: 'user-1',
        username: 'alice',
        family: 'family-old',
        iat: eightDaysAgo,
        exp: nowSec - 10, // technically inside the exp grace, but iat kills it
      },
      JWT_SECRET,
      {
        audience: 'wayland-webui',
        issuer: 'wayland',
      }
    );

    await expect(AuthService.refreshToken(ancientToken)).resolves.toBeNull();
  });

  it('rejects refresh when the token expired more than the 1h grace window ago', async () => {
    const { AuthService } = await import('@process/webserver/auth/service/AuthService');

    familyStore.set('family-stale', { userId: 'user-1', revoked: false });

    const nowSec = Math.floor(Date.now() / 1000);
    const staleToken = jwt.sign(
      {
        userId: 'user-1',
        username: 'alice',
        family: 'family-stale',
        iat: nowSec - 7200, // 2h ago - well within 7d iat ceiling
        exp: nowSec - 7200, // expired 2h ago - past the 1h grace
      },
      JWT_SECRET,
      {
        audience: 'wayland-webui',
        issuer: 'wayland',
      }
    );

    await expect(AuthService.refreshToken(staleToken)).resolves.toBeNull();
  });

  it('rejects refresh when the family has been revoked', async () => {
    const { AuthService } = await import('@process/webserver/auth/service/AuthService');

    familyStore.set('family-revoked', { userId: 'user-1', revoked: true });

    const nowSec = Math.floor(Date.now() / 1000);
    const tokenWithRevokedFamily = jwt.sign(
      {
        userId: 'user-1',
        username: 'alice',
        family: 'family-revoked',
        iat: nowSec - 600,
        exp: nowSec - 10,
      },
      JWT_SECRET,
      {
        audience: 'wayland-webui',
        issuer: 'wayland',
      }
    );

    await expect(AuthService.refreshToken(tokenWithRevokedFamily)).resolves.toBeNull();
  });

  it('rejects refresh when the token carries no family claim (legacy)', async () => {
    const { AuthService } = await import('@process/webserver/auth/service/AuthService');

    const nowSec = Math.floor(Date.now() / 1000);
    const legacyToken = jwt.sign(
      {
        userId: 'user-1',
        username: 'alice',
        iat: nowSec - 600,
        exp: nowSec - 10,
      },
      JWT_SECRET,
      {
        audience: 'wayland-webui',
        issuer: 'wayland',
      }
    );

    await expect(AuthService.refreshToken(legacyToken)).resolves.toBeNull();
  });

  it('rotates to a distinct token within the same family and blacklists the previous session', async () => {
    const { AuthService } = await import('@process/webserver/auth/service/AuthService');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-18T19:10:00.000Z'));

    const originalToken = await AuthService.generateToken({
      id: 'user-1',
      username: 'alice',
    });

    // Advance time inside the sliding window: 5 minutes after exp.
    vi.setSystemTime(new Date('2026-04-19T19:15:00.000Z'));

    const refreshedToken = await AuthService.refreshToken(originalToken);

    expect(refreshedToken).toEqual(expect.any(String));
    expect(refreshedToken).not.toBe(originalToken);
    await expect(AuthService.verifyToken(originalToken)).resolves.toBeNull();

    const refreshedPayload = await AuthService.verifyToken(refreshedToken!);
    expect(refreshedPayload).toMatchObject({
      userId: 'user-1',
      username: 'alice',
    });

    // Same family id - bounded sliding window preserved across refresh.
    const originalFamily = AuthService.decodeFamily(originalToken);
    expect(originalFamily).toBeTruthy();
    expect(refreshedPayload?.family).toBe(originalFamily);
  });

  it('revokes the family on logout via AuthService.revokeFamily', async () => {
    const { AuthService } = await import('@process/webserver/auth/service/AuthService');

    const token = await AuthService.generateToken({ id: 'user-1', username: 'alice' });
    const family = AuthService.decodeFamily(token);
    expect(family).toBeTruthy();

    await AuthService.revokeFamily(family!);
    expect(familyStore.get(family!)?.revoked).toBe(true);

    // Refresh on the now-revoked family must fail even with a fresh token.
    await expect(AuthService.refreshToken(token)).resolves.toBeNull();
  });
});
