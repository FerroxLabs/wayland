/**
 * QR login helpers - no Electron imports.
 * Shared between webuiBridge.ts (Electron mode) and webserver/index.ts (standalone mode).
 *
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { AuthService } from '@process/webserver/auth/service/AuthService';
import { UserRepository } from '@process/webserver/auth/repository/UserRepository';
import { WebuiService } from './services/WebuiService';

// QR Token store (in-memory, short-lived).
// Added allowLocalOnly flag to restrict local mode to local network only
const qrTokenStore = new Map<string, { expiresAt: number; used: boolean; allowLocalOnly: boolean }>();

// QR Token validity: 5 minutes
const QR_TOKEN_EXPIRY = 5 * 60 * 1000;

/**
 * Clean up expired QR tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of qrTokenStore.entries()) {
    if (data.expiresAt < now || data.used) {
      qrTokenStore.delete(token);
    }
  }
}

/**
 * Check if IP is localhost or local network address
 */
function isLocalIP(ip: string): boolean {
  if (!ip) return false;
  // Handle IPv6 localhost format
  const cleanIP = ip.replace(/^::ffff:/, '');

  // localhost
  if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || cleanIP === '::1') {
    return true;
  }

  // Private network addresses
  // 10.0.0.0/8
  if (cleanIP.startsWith('10.')) return true;
  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIP)) return true;
  // 192.168.0.0/16
  if (cleanIP.startsWith('192.168.')) return true;
  // Link-local
  if (cleanIP.startsWith('169.254.')) return true;

  return false;
}

/**
 * Generate QR login URL directly (for server-side use on startup)
 */
export function generateQRLoginUrlDirect(port: number, allowRemote: boolean): { qrUrl: string; expiresAt: number } {
  // Clean up expired tokens
  cleanupExpiredTokens();

  // Generate random token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + QR_TOKEN_EXPIRY;

  // Store token
  const allowLocalOnly = !allowRemote;
  qrTokenStore.set(token, { expiresAt, used: false, allowLocalOnly });

  // Build QR URL
  const lanIP = WebuiService.getLanIP();
  const baseUrl = allowRemote && lanIP ? `http://${lanIP}:${port}` : `http://localhost:${port}`;
  const qrUrl = `${baseUrl}/qr-login?token=${token}`;

  return { qrUrl, expiresAt };
}

/**
 * Verify QR token directly (for authRoutes, no IPC needed)
 *
 * @param qrToken - QR token string
 * @param clientIP - Client IP address (for local network restriction)
 */
export async function verifyQRTokenDirect(
  qrToken: string,
  clientIP?: string
): Promise<{
  success: boolean;
  data?: { sessionToken: string; username: string };
  msg?: string;
}> {
  try {
    // Check if token exists
    const tokenData = qrTokenStore.get(qrToken);
    if (!tokenData) {
      return {
        success: false,
        msg: 'Invalid or expired QR token',
      };
    }

    // Check if expired
    if (Date.now() > tokenData.expiresAt) {
      qrTokenStore.delete(qrToken);
      return {
        success: false,
        msg: 'QR token has expired',
      };
    }

    // Check if already used
    if (tokenData.used) {
      qrTokenStore.delete(qrToken);
      return {
        success: false,
        msg: 'QR token has already been used',
      };
    }

    // P0 Security fix: Check local network restriction
    if (tokenData.allowLocalOnly) {
      // RT-B3-05: Fail closed EXPLICITLY when clientIP cannot be determined.
      // Do not rely on isLocalIP('') === false - if IP extraction is missing or
      // breaks (misconfigured proxy, unexpected IPC path), reject the request
      // rather than proceeding to token issuance.
      const trimmedIP = typeof clientIP === 'string' ? clientIP.trim() : '';
      if (!trimmedIP) {
        console.warn('[WebUI QR] QR token rejected: missing client IP for local-only token');
        return {
          success: false,
          msg: 'QR login requires a verifiable local network address',
        };
      }

      // M2: do NOT bypass the gate; non-local IPs are rejected.
      if (!isLocalIP(trimmedIP)) {
        console.warn(`[WebUI QR] QR token rejected: non-local IP ${trimmedIP} attempted to use local-only token`);
        return {
          success: false,
          msg: 'QR login is only allowed from local network',
        };
      }
    }

    // Mark as used
    tokenData.used = true;

    // Get admin user
    const adminUser = await UserRepository.getPrimaryWebUIUser();
    if (!adminUser) {
      return {
        success: false,
        msg: 'WebUI user not found',
      };
    }

    // Generate session token
    const sessionToken = await AuthService.generateToken(adminUser);

    // Update last login time
    await UserRepository.updateLastLogin(adminUser.id);

    // Delete used QR token
    qrTokenStore.delete(qrToken);

    return {
      success: true,
      data: {
        sessionToken,
        username: adminUser.username,
      },
    };
  } catch (error) {
    console.error('[WebUI QR] Verify QR token error:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to verify QR token',
    };
  }
}
