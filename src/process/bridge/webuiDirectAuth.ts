/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Authentication and rate-limiting helpers for the `webui-direct-*` IPC family.
 *
 * Threat model: a compromised renderer (e.g. via XSS in renderer dependencies)
 * can call `ipcRenderer.invoke('webui-direct-*', ...)` directly. The original
 * handlers required no authentication and offered no rate limit, so an attacker
 * could silently rotate the admin password, force a reset, or exfiltrate the
 * initial password from the status payload.
 *
 * This module provides:
 *   - `enforceRateLimit`: in-memory sliding window (5 requests / 60s per key).
 *   - `requireConfirmation`: native main-process confirmation dialog
 *     (`dialog.showMessageBox`) - the renderer cannot fake this.
 *   - `verifyCurrentPassword`: bcrypt-compare against the stored admin hash.
 *
 * The dialog gate is the load-bearing protection: even if the renderer is
 * compromised, the destructive action cannot complete without a real user
 * clicking "Confirm" in a main-process dialog.
 */

import { BrowserWindow, dialog } from 'electron';
import { AuthService } from '@process/webserver/auth/service/AuthService';
import { UserRepository } from '@process/webserver/auth/repository/UserRepository';

/** Rate limit window in milliseconds. */
const RATE_LIMIT_WINDOW_MS = 60_000;
/** Maximum attempts per window per key. */
const RATE_LIMIT_MAX = 5;

const rateLimitBuckets = new Map<string, number[]>();

/**
 * Enforce a sliding-window rate limit. Returns `true` if the request is
 * allowed, `false` if it exceeds the limit. Buckets are keyed by channel
 * (one bucket per IPC channel - there is no per-renderer identity available
 * for IPC, so this is a global per-channel limit).
 */
export function enforceRateLimit(key: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const existing = rateLimitBuckets.get(key) ?? [];
  // Drop entries outside the window
  const recent = existing.filter((ts) => ts > cutoff);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  rateLimitBuckets.set(key, recent);
  return true;
}

/**
 * Reset all rate-limit buckets. Intended for tests only.
 */
export function _resetRateLimitForTests(): void {
  rateLimitBuckets.clear();
}

/**
 * Show a native confirmation dialog. Returns `true` only if the user
 * explicitly clicked the confirm button. A compromised renderer cannot
 * spoof this.
 */
export async function requireConfirmation(opts: {
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
}): Promise<boolean> {
  const parentWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const buttons = [opts.confirmLabel, 'Cancel'];
  const result = parentWindow
    ? await dialog.showMessageBox(parentWindow, {
        type: 'warning',
        title: opts.title,
        message: opts.message,
        detail: opts.detail,
        buttons,
        defaultId: 1, // Cancel
        cancelId: 1,
      })
    : await dialog.showMessageBox({
        type: 'warning',
        title: opts.title,
        message: opts.message,
        detail: opts.detail,
        buttons,
        defaultId: 1,
        cancelId: 1,
      });
  return result.response === 0;
}

/**
 * Verify a plaintext password against the stored admin hash.
 * Returns `true` on match.
 */
export async function verifyCurrentPassword(currentPassword: string): Promise<boolean> {
  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    return false;
  }
  const adminUser = await UserRepository.getPrimaryWebUIUser();
  if (!adminUser || !adminUser.password_hash) {
    return false;
  }
  return AuthService.verifyPassword(currentPassword, adminUser.password_hash);
}

/**
 * Standard error responses used by direct IPC handlers.
 */
export const AUTH_ERROR_RATE_LIMITED = 'RATE_LIMITED';
export const AUTH_ERROR_CONFIRMATION_DECLINED = 'CONFIRMATION_DECLINED';
export const AUTH_ERROR_INVALID_PASSWORD = 'INVALID_CURRENT_PASSWORD';
