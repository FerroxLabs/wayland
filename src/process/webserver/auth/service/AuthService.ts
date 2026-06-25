/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';
import { CIPHER_PREFIX, decryptString, encryptString, FILE_CIPHER_PREFIX } from '@process/secrets';
import type { AuthUser } from '../repository/UserRepository';
import { UserRepository } from '../repository/UserRepository';
import { TokenFamilyRepository } from '../repository/TokenFamilyRepository';
import { TokenBlacklistRepository } from '../repository/TokenBlacklistRepository';
import { AUTH_CONFIG } from '../../config/constants';
import { withBcryptSlot } from './bcryptSemaphore';

// Re-export so callers (route handlers) can identify a saturation rejection
// without importing the semaphore module directly.
export { BcryptBusyError } from './bcryptSemaphore';

interface TokenPayload {
  userId: string;
  username: string;
  tokenId: string;
  // Optional because legacy pre-H5 tokens have no family claim. The
  // refresh path (H5) treats absent family as a hard reject; passive
  // verification still accepts them so existing sessions keep working
  // until they naturally expire.
  family?: string;
  iat?: number;
  exp?: number;
}

type RawTokenPayload = Omit<TokenPayload, 'userId'> & {
  userId: string | number;
};

/**
 * H5 refresh-token sliding window bounds.
 *
 * MAX_IAT_AGE_MS - a token cannot be refreshed once it is older than 7 days
 *   from its original issue time (the absolute ceiling of a single session).
 * MAX_EXP_GRACE_MS - once a token has been expired for more than 1 hour, the
 *   sliding window is closed and the user must re-login.
 */
const REFRESH_MAX_IAT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_MAX_EXP_GRACE_MS = 60 * 60 * 1000;

interface UserCredentials {
  username: string;
  password: string;
  createdAt: number;
}

const hashPasswordAsync = (password: string, saltRounds: number): Promise<string> =>
  withBcryptSlot(
    () =>
      new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, (error, hash) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(hash);
        });
      })
  );

const comparePasswordAsync = (password: string, hash: string): Promise<boolean> =>
  withBcryptSlot(
    () =>
      new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (error, same) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(same);
        });
      })
  );

const DUMMY_BCRYPT_PASSWORD = 'wayland-auth-dummy-password';
const DUMMY_BCRYPT_HASH = '$2a$12$s5cKddFA1hp06nhAubmZa.eT3/xT9Bmve36cul7fZ6ch2mz9EITDu';

/**
 * Authentication Service - handles password hashing, token issuance, and validation
 */
export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static jwtSecret: string | null = null;
  private static readonly TOKEN_EXPIRY = AUTH_CONFIG.TOKEN.SESSION_EXPIRY;

  /**
   * Token blacklist - stores hashes of revoked tokens.
   *
   * The in-memory `Map` is the hot path (synchronous lookup on every
   * verifyToken call). The `token_blacklist` SQLite table is the durable
   * backing store so a process restart cannot resurrect a stolen JWT.
   *
   * On startup `hydrateBlacklist()` reloads still-active rows into the map.
   * Key: SHA-256 hash of the token; Value: expiry timestamp (epoch ms).
   */
  private static tokenBlacklist: Map<string, number> = new Map();
  private static readonly BLACKLIST_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private static blacklistCleanupTimer: ReturnType<typeof setInterval> | null = null;
  private static blacklistHydratePromise: Promise<void> | null = null;

  /**
   * Load persisted blacklist rows into memory. Safe to call multiple times -
   * subsequent calls return the same promise. Called eagerly at boot and
   * lazily on the first blacklist check so verifyToken stays sync-fast.
   */
  public static hydrateBlacklist(): Promise<void> {
    if (!this.blacklistHydratePromise) {
      this.blacklistHydratePromise = (async () => {
        try {
          const now = Date.now();
          // Drop already-expired rows up front so we never load them.
          await TokenBlacklistRepository.pruneExpired(now);
          const rows = await TokenBlacklistRepository.loadActive(now);
          for (const row of rows) {
            this.tokenBlacklist.set(row.token_hash, row.expires_at);
          }
          if (rows.length > 0) {
            this.startBlacklistCleanup();
          }
        } catch (error) {
          // Fail soft - without a hydrated blacklist verifyToken still works
          // against the in-memory map populated by subsequent revokes.
          console.error('[AuthService] Failed to hydrate token blacklist:', error);
        }
      })();
    }
    return this.blacklistHydratePromise;
  }

  /**
   * Add token to blacklist (called on logout).
   *
   * The in-memory map is updated synchronously so an immediately-following
   * verifyToken call sees the revocation. The database write is fire-and-
   * forget; on storage failure the in-memory entry still protects this
   * process for the token's remaining lifetime.
   */
  public static blacklistToken(token: string): void {
    // Use the token hash as key to avoid storing the raw token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Parse token to get expiry
    let expiry: number;
    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      expiry = decoded?.exp ? decoded.exp * 1000 : Date.now() + AUTH_CONFIG.TOKEN.COOKIE_MAX_AGE;
    } catch {
      // Even if parsing fails, add to blacklist (using default expiry)
      expiry = Date.now() + AUTH_CONFIG.TOKEN.COOKIE_MAX_AGE;
    }

    this.tokenBlacklist.set(tokenHash, expiry);
    this.startBlacklistCleanup();

    // Persist so the revocation survives restart. Best-effort - the
    // in-memory entry above already protects this process.
    void TokenBlacklistRepository.add(tokenHash, expiry).catch((error) => {
      console.error('[AuthService] Failed to persist blacklisted token:', error);
    });
  }

  /**
   * Check if token is blacklisted
   */
  public static isTokenBlacklisted(token: string): boolean {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = this.tokenBlacklist.get(tokenHash);

    if (!expiry) {
      return false;
    }

    // If expired, remove from blacklist
    if (Date.now() > expiry) {
      this.tokenBlacklist.delete(tokenHash);
      return false;
    }

    return true;
  }

  /**
   * Start blacklist cleanup timer
   */
  private static startBlacklistCleanup(): void {
    if (this.blacklistCleanupTimer) {
      return;
    }

    this.blacklistCleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [hash, expiry] of this.tokenBlacklist.entries()) {
        if (now > expiry) {
          this.tokenBlacklist.delete(hash);
        }
      }
      // Drop the same rows from the persistent store so the table doesn't
      // grow unbounded across restarts.
      void TokenBlacklistRepository.pruneExpired(now).catch((error) => {
        console.error('[AuthService] Failed to prune token_blacklist:', error);
      });
    }, this.BLACKLIST_CLEANUP_INTERVAL);

    // Allow the process to exit normally
    this.blacklistCleanupTimer.unref();
  }

  /**
   * Generate a high-entropy random secret key
   */
  private static generateSecretKey(): string {
    // Always rely on randomness for unpredictability
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Encrypt a JWT secret for at-rest storage in `users.jwt_secret` using
   * OS-keychain-backed safeStorage (macOS Keychain / Windows DPAPI / Linux
   * libsecret). The plaintext signing secret must never touch the SQLite file.
   *
   * Throws when safeStorage is unavailable on the host - callers must treat
   * that as "cannot persist" and fall back to an in-memory secret rather than
   * writing plaintext (fail closed at rest).
   */
  private static encryptJwtSecret(plaintext: string): string {
    return encryptString(plaintext);
  }

  /**
   * Decrypt a stored `users.jwt_secret` value with passthrough migration for
   * existing installs.
   *
   * - Values carrying {@link CIPHER_PREFIX} are decrypted via safeStorage.
   * - Legacy plaintext secrets (written before this column was encrypted) are
   *   returned as-is so existing sessions keep verifying. They are upgraded to
   *   ciphertext lazily by {@link getJwtSecret}.
   */
  private static decryptJwtSecret(stored: string): string {
    if (AuthService.isEncryptedAtRest(stored)) {
      return decryptString(stored);
    }
    return stored;
  }

  /**
   * Whether a stored `users.jwt_secret` value is already ciphertext from EITHER
   * secrets backend: `safeStorage` ({@link CIPHER_PREFIX}) OR the headless
   * file-key fallback ({@link FILE_CIPHER_PREFIX}, used when no OS keychain is
   * available — bun server, Linux without libsecret). #155: gating only on
   * CIPHER_PREFIX made a headless-written secret look like legacy plaintext, so
   * it was returned as raw ciphertext and never matched the secret that signed
   * the JWT → `invalid signature` on every WebSocket verify.
   */
  private static isEncryptedAtRest(stored: string): boolean {
    return stored.startsWith(CIPHER_PREFIX) || stored.startsWith(FILE_CIPHER_PREFIX);
  }

  /**
   * Overwrite a legacy plaintext `users.jwt_secret` with its safeStorage
   * ciphertext and verify no plaintext residue survives the write (RT-S2).
   *
   * The encrypted value replaces the plaintext in the same column, so a
   * successful write removes the plaintext. We then re-read the row and assert
   * the persisted value carries {@link CIPHER_PREFIX}; if it does not (write
   * dropped, partially applied, or the row was concurrently rewritten in the
   * clear) we surface the failure instead of silently leaving plaintext at
   * rest. The in-memory secret is already live, so verification failure does
   * not break the current process - it only flags that the at-rest purge did
   * not take.
   */
  private static async purgePlaintextJwtSecret(userId: string, plaintextSecret: string): Promise<void> {
    try {
      await UserRepository.updateJwtSecret(userId, this.encryptJwtSecret(plaintextSecret));

      // Confirm the overwrite landed as ciphertext - no plaintext residue.
      const reread = await UserRepository.getPrimaryWebUIUser();
      const persisted = reread?.jwt_secret ?? null;
      if (!persisted || !AuthService.isEncryptedAtRest(persisted)) {
        throw new Error('post-migration JWT secret is not encrypted at rest');
      }
    } catch (migrationError) {
      // Fail loud: plaintext may still be on disk. Surfacing this lets an
      // operator (or the security E2E gate) catch a stuck migration rather
      // than trusting a swallowed best-effort write.
      console.error(
        '[AuthService] RT-S2: failed to purge legacy plaintext JWT secret at rest - plaintext may persist:',
        migrationError
      );
    }
  }

  /**
   * Load or create the JWT secret and cache it in memory
   *
   * JWT secret is stored in the admin user's row in users table
   */
  public static async getJwtSecret(): Promise<string> {
    if (this.jwtSecret) {
      return this.jwtSecret;
    }

    // Prefer env var for deploy-time override
    if (process.env.JWT_SECRET) {
      this.jwtSecret = process.env.JWT_SECRET;
      return this.jwtSecret;
    }

    try {
      // Read jwt_secret from admin user in database
      const systemUser = await UserRepository.getPrimaryWebUIUser();
      if (systemUser && systemUser.jwt_secret) {
        const stored = systemUser.jwt_secret;
        this.jwtSecret = this.decryptJwtSecret(stored);

        // Lazy migration (RT-S2): an existing plaintext secret keeps working
        // but is re-persisted as ciphertext so the SQLite file no longer holds
        // it in the clear. The UPDATE overwrites the same `users.jwt_secret`
        // column, so a successful write IS the purge - there is no separate
        // plaintext copy left behind. The risk is a write that fails (or
        // partially encrypts) silently leaving plaintext at rest, so we
        // confirm the persisted value is ciphertext before treating the
        // migration as done.
        if (!AuthService.isEncryptedAtRest(stored)) {
          await this.purgePlaintextJwtSecret(systemUser.id, this.jwtSecret);
        }

        return this.jwtSecret;
      }

      // Generate new secret and save to admin user
      if (systemUser) {
        const newSecret = this.generateSecretKey();
        await UserRepository.updateJwtSecret(systemUser.id, this.encryptJwtSecret(newSecret));
        this.jwtSecret = newSecret;
        return this.jwtSecret;
      }

      // Fallback: if admin user does not exist (should not happen)
      console.warn('[AuthService] System WebUI user not found, using temporary secret');
      this.jwtSecret = this.generateSecretKey();
      return this.jwtSecret;
    } catch (error) {
      console.error('Failed to get/save JWT secret:', error);
      this.jwtSecret = this.generateSecretKey();
      return this.jwtSecret;
    }
  }

  /**
   * Rotate the JWT secret to invalidate all existing tokens
   */
  public static async invalidateAllTokens(): Promise<void> {
    try {
      const systemUser = await UserRepository.getPrimaryWebUIUser();
      if (!systemUser) {
        console.warn('[AuthService] System WebUI user not found, cannot invalidate tokens');
        return;
      }

      const newSecret = this.generateSecretKey();
      await UserRepository.updateJwtSecret(systemUser.id, this.encryptJwtSecret(newSecret));
      this.jwtSecret = newSecret;
    } catch (error) {
      console.error('Failed to invalidate tokens:', error);
    }
  }

  /**
   * Hash password using bcrypt
   */
  public static hashPassword(password: string): Promise<string> {
    return hashPasswordAsync(password, this.SALT_ROUNDS);
  }

  /**
   * Verify whether the password matches the stored hash
   */
  public static verifyPassword(password: string, hash: string): Promise<boolean> {
    return comparePasswordAsync(password, hash);
  }

  /**
   * Generate standard WebUI session token.
   *
   * When `familyId` is omitted a new family is created and recorded in the
   * `token_family` table - this is the login path. When `familyId` is
   * passed, the new token reuses the existing family so refresh stays
   * inside the bounded sliding window (H5).
   */
  public static async generateToken(user: Pick<AuthUser, 'id' | 'username'>, familyId?: string): Promise<string> {
    const family = familyId ?? crypto.randomUUID();
    if (!familyId) {
      // First-issue path - record the family so revoke is meaningful.
      try {
        await TokenFamilyRepository.create(family, user.id);
      } catch (error) {
        // The repository depends on the SQLite layer; if it is unavailable
        // (e.g. during early bootstrap before getDatabase() can resolve) we
        // still want login to succeed - the refresh path treats an unknown
        // family as revoked (fail closed), forcing re-login next time.
        console.error('[AuthService] Failed to record token family:', error);
      }
    }

    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      tokenId: crypto.randomUUID(),
      family,
    };

    return jwt.sign(payload, await this.getJwtSecret(), {
      expiresIn: this.TOKEN_EXPIRY,
      issuer: 'wayland',
      audience: 'wayland-webui',
    });
  }

  /**
   * Read the family id off a token without verifying it. Returns null when
   * the token is malformed or carries no family claim (legacy pre-H5 tokens).
   *
   * Routes use this to revoke the family on logout / password-change.
   */
  public static decodeFamily(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as { family?: unknown } | null;
      if (decoded && typeof decoded.family === 'string' && decoded.family.length > 0) {
        return decoded.family;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Revoke a single token family. Idempotent.
   * Called from the logout route.
   */
  public static async revokeFamily(familyId: string): Promise<void> {
    try {
      await TokenFamilyRepository.revoke(familyId);
    } catch (error) {
      console.error('[AuthService] Failed to revoke token family:', error);
    }
  }

  /**
   * Revoke every token family belonging to a user. Called on password
   * change so any stolen token loses refresh capability on every device.
   */
  public static async revokeAllFamiliesForUser(userId: string): Promise<void> {
    try {
      await TokenFamilyRepository.revokeAllForUser(userId);
    } catch (error) {
      console.error('[AuthService] Failed to revoke all token families for user:', error);
    }
  }

  /**
   * Normalize database user id into a consistent string
   *
   * Note: In new architecture, all user IDs are already strings (e.g., "auth_1234567890_abc").
   * This function simply ensures the ID is a string type.
   */
  private static normalizeUserId(rawId: string | number): string {
    return String(rawId);
  }

  /**
   * Verify standard WebUI session token validity
   */
  public static async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      // Check blacklist first
      if (this.isTokenBlacklisted(token)) {
        return null;
      }

      const decoded = jwt.verify(token, await this.getJwtSecret(), {
        issuer: 'wayland',
        audience: 'wayland-webui',
      }) as RawTokenPayload;

      return {
        ...decoded,
        userId: this.normalizeUserId(decoded.userId),
      };
    } catch (error) {
      if (
        error instanceof jwt.TokenExpiredError ||
        error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.NotBeforeError
      ) {
        return null;
      }
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Verify WebSocket token
   *
   * Reuses the Web login token (audience: wayland-webui).
   *
   * @param token - JWT token string
   * @returns Token payload if valid, null otherwise
   */
  public static async verifyWebSocketToken(token: string): Promise<TokenPayload | null> {
    try {
      // Check blacklist first
      if (this.isTokenBlacklisted(token)) {
        return null;
      }

      const decoded = jwt.verify(token, await this.getJwtSecret(), {
        issuer: 'wayland',
        audience: 'wayland-webui', // Use the same audience as Web login
      }) as RawTokenPayload;

      return {
        ...decoded,
        userId: this.normalizeUserId(decoded.userId),
      };
    } catch (error) {
      // TokenExpiredError is expected when sessions naturally expire (24h TTL).
      // Only log unexpected verification failures at error level.
      if (error instanceof jwt.TokenExpiredError) {
        return null;
      }
      console.error('WebSocket token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh a session token under a bounded sliding window (H5).
   *
   * Rules:
   *   1. Signature must verify (against current JWT secret + iss/aud).
   *   2. `iat` must not be older than REFRESH_MAX_IAT_AGE_MS (7 days) -
   *      the absolute lifetime of any single session, regardless of how
   *      many refreshes it accumulated.
   *   3. `exp` must not be older than REFRESH_MAX_EXP_GRACE_MS (1 hour)
   *      past now - once the sliding window has closed the user must
   *      re-login.
   *   4. The token's `family` must exist and not be revoked. Unknown
   *      families fail closed (treated as revoked).
   *
   * On success: the previous token is blacklisted and a new token is
   * issued reusing the same family id.
   */
  public static async refreshToken(token: string): Promise<string | null> {
    if (this.isTokenBlacklisted(token)) {
      return null;
    }

    let decoded: RawTokenPayload;

    try {
      decoded = jwt.verify(token, await this.getJwtSecret(), {
        issuer: 'wayland',
        audience: 'wayland-webui',
        ignoreExpiration: true,
      }) as RawTokenPayload;
    } catch (error) {
      if (
        error instanceof jwt.TokenExpiredError ||
        error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.NotBeforeError
      ) {
        return null;
      }

      console.error('Token refresh verification failed:', error);
      return null;
    }

    // H5 bound 1: token-too-old (iat). A token issued more than 7 days
    // ago cannot be refreshed - force re-login.
    const nowSec = Math.floor(Date.now() / 1000);
    const iat = typeof decoded.iat === 'number' ? decoded.iat : null;
    if (iat === null) {
      // No iat claim → cannot reason about age, fail closed.
      return null;
    }
    if (iat < nowSec - REFRESH_MAX_IAT_AGE_MS / 1000) {
      return null;
    }

    // H5 bound 2: sliding window closed (exp). A token expired more than
    // 1 hour ago can no longer be refreshed.
    const exp = typeof decoded.exp === 'number' ? decoded.exp : null;
    if (exp === null) {
      return null;
    }
    if (exp < nowSec - REFRESH_MAX_EXP_GRACE_MS / 1000) {
      return null;
    }

    // H5 bound 3: family revocation. Tokens issued before the family
    // claim was introduced (legacy) carry no `family` and cannot be
    // refreshed - they must re-login to acquire one.
    const family = typeof decoded.family === 'string' ? decoded.family : null;
    if (!family) {
      return null;
    }
    try {
      if (await TokenFamilyRepository.isRevoked(family)) {
        return null;
      }
    } catch (error) {
      // Fail closed on storage errors - better to force re-login than
      // accept a token whose revocation state cannot be verified.
      console.error('[AuthService] Failed to read token family on refresh:', error);
      return null;
    }

    this.blacklistToken(token);

    // Reissue inside the same family so subsequent refreshes stay
    // bounded by the original iat ceiling.
    return this.generateToken(
      {
        id: this.normalizeUserId(decoded.userId),
        username: decoded.username,
      },
      family
    );
  }

  /**
   * Generate a random password with required complexity
   */
  public static generateRandomPassword(): string {
    const baseLength = 12;
    const lengthVariance = 5;
    const passwordLength = baseLength + crypto.randomInt(0, lengthVariance);

    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    const allChars = lowercase + uppercase + digits + special;

    const ensureCategory = (chars: string) => chars[crypto.randomInt(0, chars.length)];

    const passwordChars: string[] = [
      ensureCategory(lowercase),
      ensureCategory(uppercase),
      ensureCategory(digits),
      ensureCategory(special),
    ];

    const remainingLength = Math.max(passwordLength - passwordChars.length, 0);
    for (let i = 0; i < remainingLength; i++) {
      const index = crypto.randomInt(0, allChars.length);
      passwordChars.push(allChars[index]);
    }

    // Shuffle to avoid predictable category order
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    return passwordChars.join('');
  }

  /**
   * Generate random credentials for initial bootstrap
   */
  public static generateUserCredentials(): UserCredentials {
    // Username length fixed to 6-8 chars for memorability
    const usernameLength = crypto.randomInt(6, 9); // 6-8 chars
    const usernameChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let username = '';
    for (let i = 0; i < usernameLength; i++) {
      username += usernameChars[crypto.randomInt(0, usernameChars.length)];
    }

    return {
      username,
      password: this.generateRandomPassword(),
      createdAt: Date.now(),
    };
  }

  /**
   * Validate password strength (simplified for local WebUI)
   */
  public static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Only require minimum length
    if (password.length < 8) {
      errors.push('PASSWORD_TOO_SHORT');
    }

    if (password.length > 128) {
      errors.push('PASSWORD_TOO_LONG');
    }

    // Block obvious weak passwords
    const weakPasswords = ['password', '12345678', '123456789', 'qwertyui', 'abcdefgh'];
    if (weakPasswords.includes(password.toLowerCase())) {
      errors.push('PASSWORD_TOO_COMMON');
    }

    // Require zxcvbn score >= 3 ("safely unguessable: moderate protection
    // from offline slow-hash scenario"). Only evaluate when the password
    // passes the length gates - zxcvbn on absurdly long inputs is slow.
    if (password.length >= 8 && password.length <= 128) {
      // Password is too predictable; try a longer passphrase or add more
      // character variety.
      const score = zxcvbn(password).score;
      if (score < 3) {
        errors.push('PASSWORD_TOO_PREDICTABLE');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate username format requirements
   */
  public static validateUsername(username: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (username.length > 32) {
      errors.push('Username must be less than 32 characters long');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }

    if (/^[_-]|[_-]$/.test(username)) {
      errors.push('Username cannot start or end with hyphen or underscore');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate a high-entropy session identifier
   */
  public static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Perform constant-time comparison to mitigate timing attacks
   */
  public static async constantTimeVerify(provided: string, expected: string, hashProvided = false): Promise<boolean> {
    // Ensure constant-time comparison routine
    const start = process.hrtime.bigint();

    if (!hashProvided) {
      // The plaintext-comparison branch is unsupported: it had no production
      // callers and its padEnd-then-timingSafeEqual approach was latently
      // false-accepting (padding two unequal-length inputs to a common length
      // can make distinct values compare equal). Every real caller passes
      // hashProvided=true (bcrypt). Reject loudly instead of comparing wrong.
      throw new Error('constantTimeVerify: plaintext comparison (hashProvided=false) is unsupported');
    }

    const result = await comparePasswordAsync(provided, expected);

    // Add minimum delay to prevent timing attacks
    const elapsed = process.hrtime.bigint() - start;
    const minDelay = BigInt(50_000_000); // 50ms in nanoseconds
    if (elapsed < minDelay) {
      const delayMs = Number((minDelay - elapsed) / BigInt(1_000_000));
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return result;
  }

  /**
   * Perform a real bcrypt verification for missing users to avoid username-enumeration timing differences
   */
  public static async constantTimeVerifyMissingUser(): Promise<boolean> {
    return this.constantTimeVerify(DUMMY_BCRYPT_PASSWORD, DUMMY_BCRYPT_HASH, true);
  }
}

export default AuthService;
