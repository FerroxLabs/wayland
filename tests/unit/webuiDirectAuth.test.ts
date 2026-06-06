/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock electron BEFORE importing webuiDirectAuth so the dialog/BrowserWindow
// references are routed through the mock instead of the real Electron runtime.
const showMessageBoxMock = vi.fn();

vi.mock('electron', () => ({
  BrowserWindow: {
    getFocusedWindow: () => null,
    getAllWindows: () => [],
  },
  dialog: {
    showMessageBox: (...args: unknown[]) => showMessageBoxMock(...args),
  },
}));

const verifyPasswordMock = vi.fn();
const getPrimaryWebUIUserMock = vi.fn();

vi.mock('@process/webserver/auth/service/AuthService', () => ({
  AuthService: {
    verifyPassword: (...args: unknown[]) => verifyPasswordMock(...args),
  },
}));

vi.mock('@process/webserver/auth/repository/UserRepository', () => ({
  UserRepository: {
    getPrimaryWebUIUser: (...args: unknown[]) => getPrimaryWebUIUserMock(...args),
  },
}));

describe('webuiDirectAuth', () => {
  beforeEach(async () => {
    const { _resetRateLimitForTests } = await import('@process/bridge/webuiDirectAuth');
    _resetRateLimitForTests();
    showMessageBoxMock.mockReset();
    verifyPasswordMock.mockReset();
    getPrimaryWebUIUserMock.mockReset();
  });

  describe('enforceRateLimit', () => {
    it('allows up to 5 requests per minute per key', async () => {
      const { enforceRateLimit } = await import('@process/bridge/webuiDirectAuth');
      for (let i = 0; i < 5; i++) {
        expect(enforceRateLimit('test-key')).toBe(true);
      }
      expect(enforceRateLimit('test-key')).toBe(false);
    });

    it('uses independent buckets per key', async () => {
      const { enforceRateLimit } = await import('@process/bridge/webuiDirectAuth');
      for (let i = 0; i < 5; i++) {
        enforceRateLimit('key-a');
      }
      expect(enforceRateLimit('key-a')).toBe(false);
      expect(enforceRateLimit('key-b')).toBe(true);
    });

    it('admits a new request once an older entry falls outside the window', async () => {
      const { enforceRateLimit } = await import('@process/bridge/webuiDirectAuth');
      const realNow = Date.now;
      let now = 1_000_000;
      Date.now = () => now;
      try {
        for (let i = 0; i < 5; i++) {
          expect(enforceRateLimit('window-key')).toBe(true);
        }
        expect(enforceRateLimit('window-key')).toBe(false);
        // Advance past the 60s window
        now += 61_000;
        expect(enforceRateLimit('window-key')).toBe(true);
      } finally {
        Date.now = realNow;
      }
    });
  });

  describe('requireConfirmation', () => {
    it('returns true when the user clicks the confirm button (response 0)', async () => {
      showMessageBoxMock.mockResolvedValueOnce({ response: 0 });
      const { requireConfirmation } = await import('@process/bridge/webuiDirectAuth');
      const ok = await requireConfirmation({
        title: 'T',
        message: 'M',
        confirmLabel: 'Confirm',
      });
      expect(ok).toBe(true);
      expect(showMessageBoxMock).toHaveBeenCalledTimes(1);
    });

    it('returns false when the user cancels (response 1)', async () => {
      showMessageBoxMock.mockResolvedValueOnce({ response: 1 });
      const { requireConfirmation } = await import('@process/bridge/webuiDirectAuth');
      const ok = await requireConfirmation({
        title: 'T',
        message: 'M',
        confirmLabel: 'Confirm',
      });
      expect(ok).toBe(false);
    });

    it('defaults the cancel button as the safe default', async () => {
      showMessageBoxMock.mockResolvedValueOnce({ response: 1 });
      const { requireConfirmation } = await import('@process/bridge/webuiDirectAuth');
      await requireConfirmation({
        title: 'T',
        message: 'M',
        detail: 'D',
        confirmLabel: 'OK',
      });
      const callArgs = showMessageBoxMock.mock.calls[0][0];
      expect(callArgs.defaultId).toBe(1);
      expect(callArgs.cancelId).toBe(1);
      expect(callArgs.buttons[0]).toBe('OK');
      expect(callArgs.buttons[1]).toBe('Cancel');
    });
  });

  describe('verifyCurrentPassword', () => {
    it('returns false when the input is empty', async () => {
      const { verifyCurrentPassword } = await import('@process/bridge/webuiDirectAuth');
      expect(await verifyCurrentPassword('')).toBe(false);
      // Underlying repository must not be consulted for empty input
      expect(getPrimaryWebUIUserMock).not.toHaveBeenCalled();
    });

    it('returns false when no admin user exists', async () => {
      getPrimaryWebUIUserMock.mockResolvedValueOnce(null);
      const { verifyCurrentPassword } = await import('@process/bridge/webuiDirectAuth');
      expect(await verifyCurrentPassword('anything')).toBe(false);
      expect(verifyPasswordMock).not.toHaveBeenCalled();
    });

    it('returns false when the admin has no password_hash', async () => {
      getPrimaryWebUIUserMock.mockResolvedValueOnce({ id: '1', password_hash: '' });
      const { verifyCurrentPassword } = await import('@process/bridge/webuiDirectAuth');
      expect(await verifyCurrentPassword('anything')).toBe(false);
      expect(verifyPasswordMock).not.toHaveBeenCalled();
    });

    it('delegates to AuthService.verifyPassword when an admin exists', async () => {
      getPrimaryWebUIUserMock.mockResolvedValueOnce({ id: '1', password_hash: 'hash' });
      verifyPasswordMock.mockResolvedValueOnce(true);
      const { verifyCurrentPassword } = await import('@process/bridge/webuiDirectAuth');
      expect(await verifyCurrentPassword('plain')).toBe(true);
      expect(verifyPasswordMock).toHaveBeenCalledWith('plain', 'hash');
    });

    it('propagates a negative bcrypt comparison', async () => {
      getPrimaryWebUIUserMock.mockResolvedValueOnce({ id: '1', password_hash: 'hash' });
      verifyPasswordMock.mockResolvedValueOnce(false);
      const { verifyCurrentPassword } = await import('@process/bridge/webuiDirectAuth');
      expect(await verifyCurrentPassword('wrong')).toBe(false);
    });
  });
});
