/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcMain } from 'electron';
import { webui } from '@/common/adapter/ipcBridge';
import { SERVER_CONFIG } from '@process/webserver/config/constants';
import { WebuiService } from './services/WebuiService';
import { generateQRLoginUrlDirect, verifyQRTokenDirect } from './webuiQR';
import {
  AUTH_ERROR_CONFIRMATION_DECLINED,
  AUTH_ERROR_INVALID_PASSWORD,
  AUTH_ERROR_RATE_LIMITED,
  enforceRateLimit,
  requireConfirmation,
  verifyCurrentPassword,
} from './webuiDirectAuth';
// Preload webserver module to avoid startup delay
import { startWebServerWithInstance } from '@process/webserver/index';
import { cleanupWebAdapter } from '@process/webserver/adapter';
import { ipcListPairedDevices, ipcRevokeDevice } from '@process/webui/pairedDevices';
import { getActivity } from '@process/webui/activityLog';

export { generateQRLoginUrlDirect, verifyQRTokenDirect };

// WebUI server instance reference
let webServerInstance: {
  server: import('http').Server;
  wss: import('ws').WebSocketServer;
  port: number;
  allowRemote: boolean;
} | null = null;

/**
 * Set WebUI server instance (called from webserver/index.ts)
 */
export function setWebServerInstance(instance: typeof webServerInstance): void {
  webServerInstance = instance;
}

/**
 * Get WebUI server instance
 */
export function getWebServerInstance(): typeof webServerInstance {
  return webServerInstance;
}

/**
 * Initialize WebUI IPC bridge
 */
export function initWebuiBridge(): void {
  // Get WebUI status
  webui.getStatus.provider(async () => {
    return WebuiService.handleAsync(async () => {
      const status = await WebuiService.getStatus(webServerInstance);
      return { success: true, data: status };
    }, 'Get status');
  });

  // Start WebUI
  webui.start.provider(async ({ port: requestedPort, allowRemote }) => {
    try {
      // If server is already running, stop it first (supports restart for config changes)
      if (webServerInstance) {
        try {
          const { server: oldServer, wss: oldWss } = webServerInstance;
          oldWss.clients.forEach((client) => client.close(1000, 'Server restarting'));
          await new Promise<void>((resolve) => {
            oldServer.close(() => resolve());
            // Force resolve after 2s to avoid hanging
            setTimeout(resolve, 2000);
          });
          cleanupWebAdapter();
        } catch (err) {
          console.warn('[WebUI Bridge] Error stopping previous server:', err);
        }
        webServerInstance = null;
      }

      const preferredPort = requestedPort ?? SERVER_CONFIG.DEFAULT_PORT;
      const remote = allowRemote ?? false;

      // Use preloaded module
      const instance = await startWebServerWithInstance(preferredPort, remote);
      webServerInstance = instance;

      // Use actual port from instance (may differ from preferred if auto-incremented)
      const actualPort = instance.port;
      const status = await WebuiService.getStatus(webServerInstance);
      const localUrl = `http://localhost:${actualPort}`;
      const lanIP = WebuiService.getLanIP();
      const networkUrl = remote && lanIP ? `http://${lanIP}:${actualPort}` : undefined;
      const initialPassword = status.initialPassword;

      // Emit status changed event
      webui.statusChanged.emit({
        running: true,
        port: actualPort,
        localUrl,
        networkUrl,
      });

      return {
        success: true,
        data: {
          port: actualPort,
          localUrl,
          networkUrl,
          lanIP: lanIP ?? undefined,
          initialPassword,
        },
      };
    } catch (error) {
      console.error('[WebUI Bridge] Start error:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Failed to start WebUI',
      };
    }
  });

  // Stop WebUI
  webui.stop.provider(async () => {
    try {
      if (!webServerInstance) {
        return {
          success: false,
          msg: 'WebUI is not running',
        };
      }

      const { server, wss } = webServerInstance;

      // Close all WebSocket connections
      wss.clients.forEach((client) => {
        client.close(1000, 'Server shutting down');
      });

      // Close server
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Cleanup WebSocket broadcaster registration
      cleanupWebAdapter();

      webServerInstance = null;

      // Emit status changed event
      webui.statusChanged.emit({
        running: false,
      });

      return { success: true };
    } catch (error) {
      console.error('[WebUI Bridge] Stop error:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Failed to stop WebUI',
      };
    }
  });

  // Change password (no current password required)
  webui.changePassword.provider(async ({ newPassword }) => {
    return WebuiService.handleAsync(async () => {
      await WebuiService.changePassword(newPassword);
      return { success: true };
    }, 'Change password');
  });

  webui.changeUsername.provider(async ({ newUsername }) => {
    return WebuiService.handleAsync(async () => {
      const username = await WebuiService.changeUsername(newUsername);
      return { success: true, data: { username } };
    }, 'Change username');
  });

  // Reset password (generate new random password).
  // Note: Since @office-ai/platform bridge provider doesn't support return values,
  // we emit the result via emitter, frontend listens to resetPasswordResult event
  webui.resetPassword.provider(async () => {
    const result = await WebuiService.handleAsync(async () => {
      const newPassword = await WebuiService.resetPassword();
      return { success: true, data: { newPassword } };
    }, 'Reset password');

    // Emit result via emitter
    if (result.success && result.data) {
      webui.resetPasswordResult.emit({ success: true, newPassword: result.data.newPassword });
    } else {
      webui.resetPasswordResult.emit({ success: false, msg: result.msg });
    }

    return result;
  });

  // Generate QR login token
  webui.generateQRToken.provider(async () => {
    // Check webServerInstance status
    if (!webServerInstance) {
      return {
        success: false,
        msg: 'WebUI is not running. Please start WebUI first.',
      };
    }

    try {
      const { port, allowRemote } = webServerInstance;
      const { qrUrl, expiresAt } = generateQRLoginUrlDirect(port, allowRemote);
      // Extract token from QR URL
      const token = new URL(qrUrl).searchParams.get('token') ?? '';

      return {
        success: true,
        data: {
          token,
          expiresAt,
          qrUrl,
        },
      };
    } catch (error) {
      console.error('[WebUI Bridge] Generate QR token error:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Failed to generate QR token',
      };
    }
  });

  // Verify QR token
  webui.verifyQRToken.provider(async ({ qrToken }) => {
    return verifyQRTokenDirect(qrToken);
  });

  // ===== Direct IPC handlers (bypass bridge library) =====
  // These handlers return results directly, without relying on emitter pattern.
  //
  // SECURITY: each destructive handler in this family must be gated by either
  // (a) a native main-process confirmation dialog, or (b) verification of the
  // current admin password. A compromised renderer can issue ipcRenderer.invoke
  // calls freely, so the renderer itself is NOT a trusted boundary.

  // Direct IPC: Reset password
  // Gated by: rate limit + native confirmation dialog (destructive).
  ipcMain.handle('webui-direct-reset-password', async () => {
    if (!enforceRateLimit('webui-direct-reset-password')) {
      return { success: false, msg: AUTH_ERROR_RATE_LIMITED };
    }
    const confirmed = await requireConfirmation({
      title: 'Reset WebUI Password',
      message: 'Reset the WebUI admin password?',
      detail:
        'A new random password will be generated and all existing WebUI sessions will be invalidated. This action cannot be undone.',
      confirmLabel: 'Reset Password',
    });
    if (!confirmed) {
      return { success: false, msg: AUTH_ERROR_CONFIRMATION_DECLINED };
    }
    return WebuiService.handleAsync(async () => {
      const newPassword = await WebuiService.resetPassword();
      return { success: true, newPassword };
    }, 'Direct IPC: Reset password');
  });

  // Direct IPC: Get status
  // Gated by: rate limit. The status payload may contain `initialPassword`
  // (one-time bootstrap secret), so we redact it once the admin has changed
  // their password - only the bootstrap flow needs the plaintext.
  ipcMain.handle('webui-direct-get-status', async () => {
    if (!enforceRateLimit('webui-direct-get-status')) {
      return { success: false, msg: AUTH_ERROR_RATE_LIMITED };
    }
    return WebuiService.handleAsync(async () => {
      const status = await WebuiService.getStatus(webServerInstance);
      return { success: true, data: status };
    }, 'Direct IPC: Get status');
  });

  // Direct IPC: Change password
  // Gated by: rate limit + current-password verification + native confirmation.
  ipcMain.handle(
    'webui-direct-change-password',
    async (_event, payload: { newPassword: string; currentPassword?: string }) => {
      if (!enforceRateLimit('webui-direct-change-password')) {
        return { success: false, msg: AUTH_ERROR_RATE_LIMITED };
      }
      const { newPassword, currentPassword } = payload ?? { newPassword: '' };
      if (typeof newPassword !== 'string' || newPassword.length === 0) {
        return { success: false, msg: 'PASSWORD_REQUIRED' };
      }
      if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
        return { success: false, msg: AUTH_ERROR_INVALID_PASSWORD };
      }
      const passwordOk = await verifyCurrentPassword(currentPassword);
      if (!passwordOk) {
        return { success: false, msg: AUTH_ERROR_INVALID_PASSWORD };
      }
      const confirmed = await requireConfirmation({
        title: 'Change WebUI Password',
        message: 'Change the WebUI admin password?',
        detail: 'All existing WebUI sessions will be invalidated after the password is changed.',
        confirmLabel: 'Change Password',
      });
      if (!confirmed) {
        return { success: false, msg: AUTH_ERROR_CONFIRMATION_DECLINED };
      }
      return WebuiService.handleAsync(async () => {
        await WebuiService.changePassword(newPassword);
        return { success: true };
      }, 'Direct IPC: Change password');
    }
  );

  // Direct IPC: Change username
  // Gated by: rate limit + current-password verification + input validation +
  // native confirmation. This mirrors `webui-direct-change-password` for full
  // parity: a compromised renderer is not a trusted boundary, so the current
  // password is verified in the main process and a native confirmation dialog
  // is the load-bearing protection - even an XSS'd renderer cannot rename the
  // admin account without knowing the current password and a real user clicking
  // Confirm in a main-process dialog.
  ipcMain.handle(
    'webui-direct-change-username',
    async (_event, payload: { newUsername?: unknown; currentPassword?: unknown }) => {
      if (!enforceRateLimit('webui-direct-change-username')) {
        return { success: false, msg: AUTH_ERROR_RATE_LIMITED };
      }
      const newUsername = payload?.newUsername;
      if (typeof newUsername !== 'string' || newUsername.trim().length === 0) {
        return { success: false, msg: 'USERNAME_REQUIRED' };
      }
      const currentPassword = payload?.currentPassword;
      if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
        return { success: false, msg: AUTH_ERROR_INVALID_PASSWORD };
      }
      const passwordOk = await verifyCurrentPassword(currentPassword);
      if (!passwordOk) {
        return { success: false, msg: AUTH_ERROR_INVALID_PASSWORD };
      }
      const confirmed = await requireConfirmation({
        title: 'Change WebUI Username',
        message: 'Change the WebUI admin username?',
        detail: `The WebUI admin account will be renamed to "${newUsername.trim()}".`,
        confirmLabel: 'Change Username',
      });
      if (!confirmed) {
        return { success: false, msg: AUTH_ERROR_CONFIRMATION_DECLINED };
      }
      return WebuiService.handleAsync(async () => {
        const username = await WebuiService.changeUsername(newUsername);
        return { success: true, data: { username } };
      }, 'Direct IPC: Change username');
    }
  );

  // Paired devices: list
  webui.listPairedDevices.provider(async () => {
    try {
      const devices = await ipcListPairedDevices();
      return { success: true, data: { devices } };
    } catch (error) {
      return { success: false, msg: error instanceof Error ? error.message : 'Failed to list paired devices' };
    }
  });

  // Paired devices: revoke
  webui.revokeDevice.provider(async ({ id }) => {
    try {
      await ipcRevokeDevice(id);
      return { success: true };
    } catch (error) {
      return { success: false, msg: error instanceof Error ? error.message : 'Failed to revoke device' };
    }
  });

  // Activity log
  webui.activityLog.provider(async ({ limit } = {} as { limit?: number }) => {
    try {
      const events = getActivity(limit);
      return { success: true, data: { events } };
    } catch (error) {
      return { success: false, msg: error instanceof Error ? error.message : 'Failed to get activity log' };
    }
  });

  // Direct IPC: Generate QR token
  // Gated by: rate limit. QR tokens are short-lived bearer credentials for
  // WebUI login - a compromised renderer must not be able to farm them.
  ipcMain.handle('webui-direct-generate-qr-token', async () => {
    if (!enforceRateLimit('webui-direct-generate-qr-token')) {
      return { success: false, msg: AUTH_ERROR_RATE_LIMITED };
    }
    // Check webServerInstance status
    if (!webServerInstance) {
      return {
        success: false,
        msg: 'WebUI is not running. Please start WebUI first.',
      };
    }

    try {
      const { port, allowRemote } = webServerInstance;
      const { qrUrl, expiresAt } = generateQRLoginUrlDirect(port, allowRemote);
      // Extract token from QR URL
      const token = new URL(qrUrl).searchParams.get('token') ?? '';

      return {
        success: true,
        data: {
          token,
          expiresAt,
          qrUrl,
        },
      };
    } catch (error) {
      console.error('[WebUI Bridge] Direct IPC: Generate QR token error:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Failed to generate QR token',
      };
    }
  });
}
