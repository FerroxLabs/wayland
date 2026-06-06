/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { AuthService } from '@process/webserver/auth/service/AuthService';

describe('AuthService constant-time verification helpers', () => {
  it('returns false for the dedicated missing-user bcrypt verification path', async () => {
    await expect(AuthService.constantTimeVerifyMissingUser()).resolves.toBe(false);
  });

  it('returns true when the provided password matches a valid bcrypt hash', async () => {
    const password = 'MyStr0ng!Pass';
    const hash = await AuthService.hashPassword(password);

    await expect(AuthService.constantTimeVerify(password, hash, true)).resolves.toBe(true);
  });

  it('returns false when the provided password does not match the bcrypt hash', async () => {
    const hash = await AuthService.hashPassword('MyStr0ng!Pass');

    await expect(AuthService.constantTimeVerify('wrong-password', hash, true)).resolves.toBe(false);
  });

  it('rejects the unsupported plaintext-comparison branch (hashProvided=false)', async () => {
    // The padEnd plaintext branch was dead and latently false-accepting; it is
    // now neutralized to throw instead of comparing wrong.
    await expect(AuthService.constantTimeVerify('abc', 'abc', false)).rejects.toThrow(/unsupported/);
    // Default arg is false, so an accidental two-arg call also rejects rather
    // than silently using the broken path.
    await expect(AuthService.constantTimeVerify('abc', 'abc')).rejects.toThrow(/unsupported/);
  });
});
