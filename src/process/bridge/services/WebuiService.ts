/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IWebUIStatus } from '@/common/adapter/ipcBridge';
import { AuthService } from '@process/webserver/auth/service/AuthService';
import { UserRepository } from '@process/webserver/auth/repository/UserRepository';
import { AUTH_CONFIG, SERVER_CONFIG } from '@process/webserver/config/constants';
import { getLanIP } from '../lanAddress';

/**
 * WebUI Service Layer - Encapsulates all WebUI-related business logic
 */
export class WebuiService {
  private static webServerFunctionsLoaded = false;
  private static _getInitialAdminPassword: (() => string | null) | null = null;
  private static _clearInitialAdminPassword: (() => void) | null = null;

  /**
   * Load webserver functions (avoid circular dependency)
   */
  private static async loadWebServerFunctions(): Promise<void> {
    if (this.webServerFunctionsLoaded) return;

    const webServer = await import('@process/webserver/index');
    this._getInitialAdminPassword = webServer.getInitialAdminPassword;
    this._clearInitialAdminPassword = webServer.clearInitialAdminPassword;
    this.webServerFunctionsLoaded = true;
  }

  /**
   * Get initial admin password
   */
  private static getInitialAdminPassword(): string | null {
    return this._getInitialAdminPassword?.() ?? null;
  }

  /**
   * Clear initial admin password
   */
  private static clearInitialAdminPassword(): void {
    this._clearInitialAdminPassword?.();
  }

  /**
   * Get LAN IP address.
   *
   * Delegates to the shared scorer in lanAddress.ts, which prefers the physical
   * Wi-Fi/Ethernet NIC over virtual adapters (Hyper-V, VMware, WSL, VPN) so the
   * QR-login URL points at an address the scanning phone can actually reach
   * (GitHub #105).
   */
  static getLanIP(): string | null {
    return getLanIP();
  }

  /**
   * Unified async error handling wrapper
   */
  static async handleAsync<T>(
    handler: () => Promise<{ success: boolean; data?: T; msg?: string }>,
    context = 'Operation'
  ): Promise<{ success: boolean; data?: T; msg?: string }> {
    try {
      return await handler();
    } catch (error) {
      console.error(`[WebUI Service] ${context} error:`, error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : `${context} failed`,
      };
    }
  }

  /**
   * Get admin user (with auto-loading)
   */
  static async getAdminUser() {
    await this.loadWebServerFunctions();
    const adminUser = await UserRepository.getPrimaryWebUIUser();
    if (!adminUser) {
      throw new Error('WebUI user not found');
    }
    return adminUser;
  }

  /**
   * Get WebUI status
   */
  static async getStatus(
    webServerInstance: {
      server: import('http').Server;
      wss: import('ws').WebSocketServer;
      port: number;
      allowRemote: boolean;
    } | null
  ): Promise<IWebUIStatus> {
    await this.loadWebServerFunctions();

    const adminUser = await UserRepository.getPrimaryWebUIUser();
    const running = webServerInstance !== null;
    const port = webServerInstance?.port ?? SERVER_CONFIG.DEFAULT_PORT;
    const allowRemote = webServerInstance?.allowRemote ?? false;

    const localUrl = `http://localhost:${port}`;
    const lanIP = this.getLanIP();
    const networkUrl = allowRemote && lanIP ? `http://${lanIP}:${port}` : undefined;

    return {
      running,
      port,
      allowRemote,
      localUrl,
      networkUrl,
      lanIP: lanIP ?? undefined,
      adminUsername: adminUser?.username ?? AUTH_CONFIG.DEFAULT_USER.USERNAME,
      initialPassword: this.getInitialAdminPassword() ?? undefined,
    };
  }

  /**
   * Change password (no current password verification required)
   */
  static async changePassword(newPassword: string): Promise<void> {
    const adminUser = await this.getAdminUser();

    // Validate new password strength
    const passwordValidation = AuthService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('; '));
    }

    // Update password (encrypted storage)
    const newPasswordHash = await AuthService.hashPassword(newPassword);
    await UserRepository.updatePassword(adminUser.id, newPasswordHash);

    // Invalidate all existing tokens
    await AuthService.invalidateAllTokens();

    // Clear initial password (user has changed password)
    this.clearInitialAdminPassword();
  }

  static async changeUsername(newUsername: string): Promise<string> {
    const adminUser = await this.getAdminUser();
    const normalizedUsername = newUsername.trim();

    const usernameValidation = AuthService.validateUsername(normalizedUsername);
    if (!usernameValidation.isValid) {
      throw new Error(usernameValidation.errors.join('; '));
    }

    const existingUser = await UserRepository.findByUsername(normalizedUsername);
    if (existingUser && existingUser.id !== adminUser.id) {
      throw new Error('Username already exists');
    }

    if (normalizedUsername === adminUser.username) {
      return adminUser.username;
    }

    await UserRepository.updateUsername(adminUser.id, normalizedUsername);
    await AuthService.invalidateAllTokens();

    return normalizedUsername;
  }

  /**
   * Reset password (generate new random password)
   */
  static async resetPassword(): Promise<string> {
    const adminUser = await this.getAdminUser();

    // Generate new random password
    const newPassword = AuthService.generateRandomPassword();
    const newPasswordHash = await AuthService.hashPassword(newPassword);

    // Update password
    await UserRepository.updatePassword(adminUser.id, newPasswordHash);

    // Invalidate all existing tokens
    await AuthService.invalidateAllTokens();

    // Clear old initial password
    this.clearInitialAdminPassword();

    return newPassword;
  }
}
