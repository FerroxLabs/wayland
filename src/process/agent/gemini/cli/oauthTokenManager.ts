/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OAuth Token Manager - Preventive Token Refresh Management
 *
 * Solves the issue of stream disconnection due to Token expiration in OAuth mode.
 *
 * Key Features:
 * 1. Token Validity Monitoring
 * 2. Preventive Refresh (refresh before expiration)
 * 3. Refresh State Tracking
 * 4. Token Synchronization during concurrent requests
 */

import { AuthType } from '@office-ai/aioncli-core';

// Token State
export enum TokenState {
  VALID = 'valid',
  EXPIRING_SOON = 'expiring_soon', // Expiring soon (within pre-refresh window)
  EXPIRED = 'expired',
  REFRESHING = 'refreshing',
  REFRESH_FAILED = 'refresh_failed',
  UNKNOWN = 'unknown',
}

// Token Information
export interface TokenInfo {
  accessToken?: string;
  expiryTime?: number; // Unix timestamp in ms
  refreshToken?: string;
  state: TokenState;
  lastRefreshTime?: number;
  lastRefreshError?: string;
}

// Token Management Configuration
export interface TokenManagerConfig {
  /**
   * Pre-refresh window (ms) - How long before expiration to start refreshing
   */
  preRefreshWindowMs: number;
  /**
   * Refresh timeout (ms)
   */
  refreshTimeoutMs: number;
  /**
   * Maximum refresh retries
   */
  maxRefreshRetries: number;
  /**
   * Refresh retry interval (ms)
   */
  refreshRetryIntervalMs: number;
}

// Default Configuration
export const DEFAULT_TOKEN_MANAGER_CONFIG: TokenManagerConfig = {
  preRefreshWindowMs: 5 * 60 * 1000, // 5 minutes
  refreshTimeoutMs: 30 * 1000, // 30 seconds
  maxRefreshRetries: 3,
  refreshRetryIntervalMs: 2000, // 2 seconds
};

// Token Events
export type TokenEvent =
  | { type: 'token_expiring_soon'; expiryTime: number; remainingMs: number }
  | { type: 'token_refresh_started' }
  | { type: 'token_refresh_success'; newExpiryTime: number }
  | { type: 'token_refresh_failed'; error: string; retriesRemaining: number }
  | { type: 'token_expired' };

/**
 * OAuth Token Manager
 */
export class OAuthTokenManager {
  private config: TokenManagerConfig;
  private tokenInfo: TokenInfo = { state: TokenState.UNKNOWN };
  private refreshPromise: Promise<boolean> | null = null;
  private checkTimer: NodeJS.Timeout | null = null;
  private onTokenEvent?: (event: TokenEvent) => void;
  private refreshCallback?: () => Promise<boolean>;
  private authType: AuthType;

  constructor(
    authType: AuthType,
    config: Partial<TokenManagerConfig> = {},
    onTokenEvent?: (event: TokenEvent) => void
  ) {
    this.authType = authType;
    this.config = { ...DEFAULT_TOKEN_MANAGER_CONFIG, ...config };
    this.onTokenEvent = onTokenEvent;
  }

  /**
   * Set refresh callback function
   */
  setRefreshCallback(callback: () => Promise<boolean>): void {
    this.refreshCallback = callback;
  }

  /**
   * Update Token Information
   */
  updateTokenInfo(accessToken?: string, expiryTime?: number, refreshToken?: string): void {
    this.tokenInfo = {
      ...this.tokenInfo,
      accessToken,
      expiryTime,
      refreshToken,
      state: this.calculateTokenState(expiryTime),
    };
  }

  /**
   * Start auto-check
   */
  startAutoCheck(intervalMs: number = 30000): void {
    this.stopAutoCheck();
    this.checkTimer = setInterval(() => {
      this.checkAndRefreshIfNeeded();
    }, intervalMs);
  }

  /**
   * Stop auto-check
   */
  stopAutoCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Get current Token state
   */
  getTokenState(): TokenState {
    return this.tokenInfo.state;
  }

  /**
   * Get remaining valid time for Token (ms)
   */
  getRemainingValidTime(): number {
    if (!this.tokenInfo.expiryTime) {
      return -1;
    }
    return Math.max(0, this.tokenInfo.expiryTime - Date.now());
  }

  /**
   * Check if Token is expiring soon
   */
  isTokenExpiringSoon(): boolean {
    const remaining = this.getRemainingValidTime();
    return remaining >= 0 && remaining < this.config.preRefreshWindowMs;
  }

  /**
   * Check if Token has expired
   */
  isTokenExpired(): boolean {
    return this.getRemainingValidTime() === 0;
  }

  /**
   * Check and refresh Token if needed
   * Returns true if Token is valid and usable
   */
  async checkAndRefreshIfNeeded(): Promise<boolean> {
    // Only manage Token for OAuth mode
    if (this.authType !== AuthType.LOGIN_WITH_GOOGLE) {
      return true;
    }

    const state = this.calculateTokenState(this.tokenInfo.expiryTime);
    this.tokenInfo.state = state;

    switch (state) {
      case TokenState.VALID:
        return true;

      case TokenState.EXPIRING_SOON:
        this.onTokenEvent?.({
          type: 'token_expiring_soon',
          expiryTime: this.tokenInfo.expiryTime!,
          remainingMs: this.getRemainingValidTime(),
        });
        // Preventive refresh, but do not block current operation
        this.triggerRefresh().catch(() => {});
        return true;

      case TokenState.EXPIRED:
        this.onTokenEvent?.({ type: 'token_expired' });
        // Must refresh successfully to continue
        return await this.triggerRefresh();

      case TokenState.REFRESHING:
        // Wait for ongoing refresh to complete
        if (this.refreshPromise) {
          return await this.refreshPromise;
        }
        return false;

      default:
        return true; // Unknown state, try to continue
    }
  }

  /**
   * Force refresh Token
   */
  async forceRefresh(): Promise<boolean> {
    return await this.triggerRefresh();
  }

  /**
   * Trigger Token refresh
   */
  private async triggerRefresh(): Promise<boolean> {
    // Return existing Promise if already refreshing
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshCallback) {
      console.warn('[OAuthTokenManager] No refresh callback set');
      return false;
    }

    this.tokenInfo.state = TokenState.REFRESHING;
    this.onTokenEvent?.({ type: 'token_refresh_started' });

    this.refreshPromise = this.executeRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Execute refresh logic (with retries)
   */
  private async executeRefresh(): Promise<boolean> {
    let lastError: string = 'Unknown error';

    for (let attempt = 0; attempt < this.config.maxRefreshRetries; attempt++) {
      try {
        const success = await Promise.race([
          this.refreshCallback!(),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error('Refresh timeout')), this.config.refreshTimeoutMs)
          ),
        ]);

        if (success) {
          this.tokenInfo.state = TokenState.VALID;
          this.tokenInfo.lastRefreshTime = Date.now();
          this.tokenInfo.lastRefreshError = undefined;

          this.onTokenEvent?.({
            type: 'token_refresh_success',
            newExpiryTime: this.tokenInfo.expiryTime || Date.now() + 3600000,
          });

          return true;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        const retriesRemaining = this.config.maxRefreshRetries - attempt - 1;

        this.onTokenEvent?.({
          type: 'token_refresh_failed',
          error: lastError,
          retriesRemaining,
        });

        if (retriesRemaining > 0) {
          await this.delay(this.config.refreshRetryIntervalMs);
        }
      }
    }

    this.tokenInfo.state = TokenState.REFRESH_FAILED;
    this.tokenInfo.lastRefreshError = lastError;

    return false;
  }

  /**
   * Calculate Token state
   */
  private calculateTokenState(expiryTime?: number): TokenState {
    if (this.tokenInfo.state === TokenState.REFRESHING) {
      return TokenState.REFRESHING;
    }

    if (!expiryTime) {
      return TokenState.UNKNOWN;
    }

    const remaining = expiryTime - Date.now();

    if (remaining <= 0) {
      return TokenState.EXPIRED;
    }

    if (remaining < this.config.preRefreshWindowMs) {
      return TokenState.EXPIRING_SOON;
    }

    return TokenState.VALID;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stopAutoCheck();
    this.refreshPromise = null;
  }
}

// Global Token Manager Instance (Lazy loaded)
let globalTokenManager: OAuthTokenManager | null = null;

/**
 * Get Global Token Manager
 */
export function getGlobalTokenManager(authType: AuthType): OAuthTokenManager {
  if (!globalTokenManager || globalTokenManager['authType'] !== authType) {
    globalTokenManager = new OAuthTokenManager(authType);
  }
  return globalTokenManager;
}

/**
 * Reset Global Token Manager
 */
export function resetGlobalTokenManager(): void {
  if (globalTokenManager) {
    globalTokenManager.dispose();
    globalTokenManager = null;
  }
}
