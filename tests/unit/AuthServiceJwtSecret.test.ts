/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

type AuthUser = {
  id: string;
  username: string;
  password_hash: string;
  jwt_secret: string | null;
  created_at: number;
  updated_at: number;
  last_login: number | null;
};

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'system_default_user',
    username: 'admin',
    password_hash: 'hash',
    jwt_secret: null,
    created_at: 0,
    updated_at: 0,
    last_login: null,
    ...overrides,
  };
}

// Fake safeStorage boundary: ciphertext is the plaintext wrapped in the
// version-pinned prefix so the round-trip is deterministic and assertable.
// CIPHER_PREFIX is the Electron safeStorage backend; FILE_CIPHER_PREFIX is the
// headless file-key fallback (no OS keychain) — both must decrypt on read.
const CIPHER_PREFIX = 'enc:v1:';
const FILE_CIPHER_PREFIX = 'fkey:v1:';

function mockSecrets() {
  vi.doMock('@process/secrets', () => ({
    CIPHER_PREFIX,
    FILE_CIPHER_PREFIX,
    encryptString: (plaintext: string) => `${CIPHER_PREFIX}${plaintext}`,
    decryptString: (encoded: string) =>
      encoded.startsWith(FILE_CIPHER_PREFIX)
        ? encoded.slice(FILE_CIPHER_PREFIX.length)
        : encoded.slice(CIPHER_PREFIX.length),
  }));
}

describe('AuthService primary WebUI user JWT handling', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.JWT_SECRET;
    mockSecrets();
  });

  it('decrypts an encrypted JWT secret from the primary WebUI user', async () => {
    const getPrimaryWebUIUserMock = vi.fn(async () =>
      makeUser({ username: 'alice', jwt_secret: `${CIPHER_PREFIX}db-secret` })
    );
    const updateJwtSecretMock = vi.fn();

    vi.doMock('@process/webserver/auth/repository/UserRepository', () => ({
      UserRepository: {
        getPrimaryWebUIUser: getPrimaryWebUIUserMock,
        updateJwtSecret: updateJwtSecretMock,
      },
    }));

    const { AuthService } = await import('@process/webserver/auth/service/AuthService');
    const jwtSecret = await AuthService.getJwtSecret();

    expect(jwtSecret).toBe('db-secret');
    expect(getPrimaryWebUIUserMock).toHaveBeenCalledOnce();
    // Already encrypted at rest - no re-write on read.
    expect(updateJwtSecretMock).not.toHaveBeenCalled();
  });

  it('decrypts a headless file-key-encrypted JWT secret without re-writing it (#155)', async () => {
    // On headless (bun server / Linux without libsecret) there is no OS keychain,
    // so the secret is persisted via the file-key backend with FILE_CIPHER_PREFIX.
    const getPrimaryWebUIUserMock = vi.fn(async () =>
      makeUser({ username: 'pi', jwt_secret: `${FILE_CIPHER_PREFIX}db-secret` })
    );
    const updateJwtSecretMock = vi.fn();

    vi.doMock('@process/webserver/auth/repository/UserRepository', () => ({
      UserRepository: {
        getPrimaryWebUIUser: getPrimaryWebUIUserMock,
        updateJwtSecret: updateJwtSecretMock,
      },
    }));

    const { AuthService } = await import('@process/webserver/auth/service/AuthService');
    const jwtSecret = await AuthService.getJwtSecret();

    // #155: must return the DECRYPTED secret, not the raw `fkey:...` ciphertext.
    // Returning the ciphertext made it never match the secret that signed the
    // JWT -> `invalid signature` on every WebSocket verify (headless login loop).
    expect(jwtSecret).toBe('db-secret');
    // Already encrypted at rest via the file-key backend - no spurious migration.
    expect(updateJwtSecretMock).not.toHaveBeenCalled();
  });

  it('passes through a legacy plaintext secret and re-encrypts it at rest', async () => {
    // RT-S2: the re-read (purge confirmation) returns the now-encrypted row so
    // the migration sees no plaintext residue.
    const getPrimaryWebUIUserMock = vi
      .fn()
      .mockResolvedValueOnce(makeUser({ id: 'legacy-admin', username: 'alice', jwt_secret: 'db-secret' }))
      .mockResolvedValue(makeUser({ id: 'legacy-admin', username: 'alice', jwt_secret: `${CIPHER_PREFIX}db-secret` }));
    const updateJwtSecretMock = vi.fn(async () => undefined);

    vi.doMock('@process/webserver/auth/repository/UserRepository', () => ({
      UserRepository: {
        getPrimaryWebUIUser: getPrimaryWebUIUserMock,
        updateJwtSecret: updateJwtSecretMock,
      },
    }));

    const { AuthService } = await import('@process/webserver/auth/service/AuthService');
    const jwtSecret = await AuthService.getJwtSecret();

    // Existing installs keep working: the plaintext secret still verifies.
    expect(jwtSecret).toBe('db-secret');
    // Lazy migration: the plaintext value is re-persisted as ciphertext,
    // overwriting the plaintext column (purge).
    expect(updateJwtSecretMock).toHaveBeenCalledWith('legacy-admin', `${CIPHER_PREFIX}db-secret`);
  });

  it('RT-S2: persisted JWT secret carries no plaintext residue after migration', async () => {
    // Capture what was actually written to the column and assert it is the
    // encrypted form, not the plaintext.
    let persistedColumnValue: string | null = 'db-secret';
    const getPrimaryWebUIUserMock = vi.fn(async () =>
      makeUser({ id: 'legacy-admin', username: 'alice', jwt_secret: persistedColumnValue })
    );
    const updateJwtSecretMock = vi.fn(async (_id: string, value: string) => {
      persistedColumnValue = value;
    });

    vi.doMock('@process/webserver/auth/repository/UserRepository', () => ({
      UserRepository: {
        getPrimaryWebUIUser: getPrimaryWebUIUserMock,
        updateJwtSecret: updateJwtSecretMock,
      },
    }));

    const { AuthService } = await import('@process/webserver/auth/service/AuthService');
    await AuthService.getJwtSecret();

    // The column now holds ciphertext; the plaintext is gone from the store.
    expect(persistedColumnValue).toBe(`${CIPHER_PREFIX}db-secret`);
    expect(persistedColumnValue).not.toBe('db-secret');
  });

  it('RT-S2: surfaces (logs) when the migration write fails, leaving the live in-memory secret intact', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getPrimaryWebUIUserMock = vi.fn(async () =>
      makeUser({ id: 'legacy-admin', username: 'alice', jwt_secret: 'db-secret' })
    );
    const updateJwtSecretMock = vi.fn(async () => {
      throw new Error('disk full');
    });

    vi.doMock('@process/webserver/auth/repository/UserRepository', () => ({
      UserRepository: {
        getPrimaryWebUIUser: getPrimaryWebUIUserMock,
        updateJwtSecret: updateJwtSecretMock,
      },
    }));

    const { AuthService } = await import('@process/webserver/auth/service/AuthService');
    const jwtSecret = await AuthService.getJwtSecret();

    // Failure does not break the live session...
    expect(jwtSecret).toBe('db-secret');
    // ...but it is surfaced (not swallowed) so the stuck migration is visible.
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('RT-S2'), expect.anything());
    errorSpy.mockRestore();
  });

  it('encrypts a newly generated JWT secret before persisting it', async () => {
    const getPrimaryWebUIUserMock = vi.fn(async () => makeUser({ id: 'fresh-admin', username: 'alice' }));
    const updateJwtSecretMock = vi.fn(async () => undefined);

    vi.doMock('@process/webserver/auth/repository/UserRepository', () => ({
      UserRepository: {
        getPrimaryWebUIUser: getPrimaryWebUIUserMock,
        updateJwtSecret: updateJwtSecretMock,
      },
    }));

    const { AuthService } = await import('@process/webserver/auth/service/AuthService');
    const jwtSecret = await AuthService.getJwtSecret();

    expect(updateJwtSecretMock).toHaveBeenCalledOnce();
    const [persistedId, persistedValue] = updateJwtSecretMock.mock.calls[0] as [string, string];
    expect(persistedId).toBe('fresh-admin');
    // Stored value is ciphertext; the in-memory secret is the decrypted form.
    expect(persistedValue).toBe(`${CIPHER_PREFIX}${jwtSecret}`);
  });

  it('rotates the JWT secret encrypted at rest when invalidating tokens', async () => {
    const getPrimaryWebUIUserMock = vi.fn(async () => makeUser({ id: 'legacy-admin', username: 'alice' }));
    const updateJwtSecretMock = vi.fn(async () => undefined);

    vi.doMock('@process/webserver/auth/repository/UserRepository', () => ({
      UserRepository: {
        getPrimaryWebUIUser: getPrimaryWebUIUserMock,
        updateJwtSecret: updateJwtSecretMock,
      },
    }));

    const { AuthService } = await import('@process/webserver/auth/service/AuthService');
    await AuthService.invalidateAllTokens();

    expect(getPrimaryWebUIUserMock).toHaveBeenCalledOnce();
    expect(updateJwtSecretMock).toHaveBeenCalledWith('legacy-admin', expect.stringContaining(CIPHER_PREFIX));
  });
});
