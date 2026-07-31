/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

import { channel as channelBridge } from '@/common/adapter/ipcBridge';
import { getDatabase } from '@process/services/database';
import * as crypto from 'crypto';
import type { IChannelPairingRequest, IChannelUser, PluginType } from '../types';

/**
 * Pairing code configuration
 */
const PAIRING_CONFIG = {
  CODE_LENGTH: 6,
  CODE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  CLEANUP_INTERVAL_MS: 60 * 1000, // 1 minute
};

/**
 * PairingService - Manages user authorization through pairing codes
 *
 * Flow:
 * 1. User sends /start to bot
 * 2. Bot generates 6-digit pairing code
 * 3. User enters code in Wayland Settings (or code is auto-displayed)
 * 4. Local user approves/rejects the pairing
 * 5. Bot notifies remote user of result
 */
export class PairingService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Generate a new pairing code for a user
   */
  async generatePairingCode(
    platformUserId: string,
    platformType: PluginType,
    displayName?: string
  ): Promise<{ code: string; expiresAt: number }> {
    const db = await getDatabase();

    // Check for existing pending request
    const existingResult = db.getPendingPairingRequests();
    if (existingResult.success && existingResult.data) {
      const existing = existingResult.data.find(
        (r) => r.platformUserId === platformUserId && r.platformType === platformType && r.status === 'pending'
      );

      // Return existing code if not expired
      if (existing && existing.expiresAt > Date.now()) {
        return {
          code: existing.code,
          expiresAt: existing.expiresAt,
        };
      }
    }

    // Generate unique code
    const code = await this.generateUniqueCode();
    const now = Date.now();
    const expiresAt = now + PAIRING_CONFIG.CODE_EXPIRY_MS;

    // Create pairing request
    const request: IChannelPairingRequest = {
      code,
      platformUserId,
      platformType,
      displayName,
      requestedAt: now,
      expiresAt,
      status: 'pending',
    };

    const createResult = db.createPairingRequest(request);
    if (!createResult.success) {
      throw new Error(createResult.error || 'Failed to create pairing request');
    }

    // Emit event for Settings UI
    channelBridge.pairingRequested.emit(request);
    await this.emitPendingChanged();

    return { code, expiresAt };
  }

  /**
   * Refresh pairing code for a user (generate new one)
   */
  async refreshPairingCode(
    platformUserId: string,
    platformType: PluginType,
    displayName?: string
  ): Promise<{ code: string; expiresAt: number }> {
    const db = await getDatabase();

    // Expire any existing pending codes
    const existingResult = db.getPendingPairingRequests();
    if (existingResult.success && existingResult.data) {
      for (const request of existingResult.data) {
        if (
          request.platformUserId === platformUserId &&
          request.platformType === platformType &&
          request.status === 'pending'
        ) {
          db.updatePairingRequestStatus(request.code, 'expired');
        }
      }
    }

    // Generate new code
    return this.generatePairingCode(platformUserId, platformType, displayName);
  }

  /**
   * Check if a user is already authorized
   */
  async isUserAuthorized(platformUserId: string, platformType: PluginType): Promise<boolean> {
    const db = await getDatabase();
    const result = db.getChannelUserByPlatform(platformUserId, platformType);
    return result.success && result.data !== null;
  }

  /**
   * Get pairing request by code
   */
  async getPairingRequest(code: string): Promise<IChannelPairingRequest | null> {
    const db = await getDatabase();
    const result = db.getPairingRequestByCode(code);
    return result.success ? (result.data ?? null) : null;
  }

  /**
   * Get pending pairing request for a user
   */
  async getPendingRequestForUser(
    platformUserId: string,
    platformType: PluginType
  ): Promise<IChannelPairingRequest | null> {
    const db = await getDatabase();
    const result = db.getPendingPairingRequests();

    if (!result.success || !result.data) {
      return null;
    }

    return (
      result.data.find(
        (r) =>
          r.platformUserId === platformUserId &&
          r.platformType === platformType &&
          r.status === 'pending' &&
          r.expiresAt > Date.now()
      ) ?? null
    );
  }

  /**
   * Approve a pairing request
   */
  async approvePairing(code: string): Promise<{ success: boolean; user?: IChannelUser; error?: string }> {
    const db = await getDatabase();

    // Get the pairing request
    const request = await this.getPairingRequest(code);
    if (!request) {
      return { success: false, error: 'Pairing request not found' };
    }

    // Check if expired
    if (request.expiresAt < Date.now()) {
      db.updatePairingRequestStatus(code, 'expired');
      return { success: false, error: 'Pairing code has expired' };
    }

    // Check if already processed
    if (request.status !== 'pending') {
      return {
        success: false,
        error: `Pairing request already ${request.status}`,
      };
    }

    // Check if user already exists
    const existingUser = db.getChannelUserByPlatform(request.platformUserId, request.platformType);
    if (existingUser.success && existingUser.data) {
      db.updatePairingRequestStatus(code, 'approved');
      await this.emitPendingChanged();
      return { success: true, user: existingUser.data };
    }

    // Create authorized user
    const userId = `assistant_user_${Date.now()}_${crypto.randomBytes(4).toString('hex').slice(0, 6)}`;
    const user: IChannelUser = {
      id: userId,
      platformUserId: request.platformUserId,
      platformType: request.platformType,
      displayName: request.displayName,
      authorizedAt: Date.now(),
    };

    const createResult = db.createChannelUser(user);
    if (!createResult.success) {
      return { success: false, error: createResult.error };
    }

    // Update pairing request status
    db.updatePairingRequestStatus(code, 'approved');

    // Emit user authorized event
    channelBridge.userAuthorized.emit(user);
    await this.emitPendingChanged();

    return { success: true, user };
  }

  /**
   * Authorize a channel "owner" with no pairing code. Used for trusted
   * self-conversations - e.g. on a linked-device WhatsApp account the operator
   * messages their own number, so requiring them to approve a pairing request
   * with themselves is pointless friction. Idempotent: returns the existing
   * authorized user if one is already on record.
   *
   * SECURITY CONTRACT: this bypasses human approval and trusts `platformUserId`
   * entirely, so the CALLER MUST guarantee that `platformUserId` is the
   * operator's OWN identity, established from the authenticated channel session
   * (e.g. the linked device's own JID) and NOT from any attacker-influenceable
   * inbound field. Passing a sender-supplied id here is a full authorization
   * bypass. Current sole caller: ActionExecutor, gated on message.isOwner, which
   * WhatsAppPlugin sets only when the chat matches the session's own JID/LID.
   */
  async authorizeOwner(
    platformUserId: string,
    platformType: PluginType,
    displayName: string
  ): Promise<IChannelUser | null> {
    const db = await getDatabase();
    const existing = db.getChannelUserByPlatform(platformUserId, platformType);
    if (existing.success && existing.data) return existing.data;

    const user: IChannelUser = {
      id: `assistant_user_${Date.now()}_${crypto.randomBytes(4).toString('hex').slice(0, 6)}`,
      platformUserId,
      platformType,
      displayName,
      authorizedAt: Date.now(),
    };
    const createResult = db.createChannelUser(user);
    if (!createResult.success) return null;
    channelBridge.userAuthorized.emit(user);
    return user;
  }

  /**
   * Reject a pairing request
   */
  async rejectPairing(code: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();

    // Get the pairing request
    const request = await this.getPairingRequest(code);
    if (!request) {
      return { success: false, error: 'Pairing request not found' };
    }

    // Only a still-pending request can be rejected. Mirrors approvePairing's
    // guard so an already-approved or expired code cannot be flipped to
    // 'rejected' (which would be misleading - reject does NOT revoke an already
    // authorized user; that is a separate, deliberate action).
    if (request.status !== 'pending') {
      return { success: false, error: `Pairing request already ${request.status}` };
    }

    // Update status
    db.updatePairingRequestStatus(code, 'rejected');
    await this.emitPendingChanged();

    return { success: true };
  }

  /**
   * Get all pending pairing requests
   */
  async getPendingRequests(): Promise<IChannelPairingRequest[]> {
    const db = await getDatabase();
    const result = db.getPendingPairingRequests();

    if (!result.success || !result.data) {
      return [];
    }

    return result.data.filter((r) => r.status === 'pending' && r.expiresAt > Date.now());
  }

  /**
   * Cleanup expired pairing codes
   */
  async cleanupExpired(): Promise<number> {
    const db = await getDatabase();
    const result = db.cleanupExpiredPairingRequests();
    const cleaned = result.success ? (result.data ?? 0) : 0;
    if (cleaned > 0) {
      await this.emitPendingChanged();
    }
    return cleaned;
  }

  /**
   * Stop the cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Push the refreshed pending pairing list to the renderer. Called after every
   * state transition (create / approve / reject / expire) so the Settings UI
   * stays live without polling. Best-effort: a failed read still resolves with
   * an empty list rather than throwing into the caller's mutation path.
   */
  private async emitPendingChanged(): Promise<void> {
    try {
      const pending = await this.getPendingRequests();
      channelBridge.pairingRequestsChanged.emit(pending);
    } catch (error) {
      console.error('[PairingService] emitPendingChanged error:', error);
    }
  }

  /**
   * Generate a unique 6-digit pairing code
   */
  private async generateUniqueCode(): Promise<string> {
    const db = await getDatabase();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = this.generateRandomCode();

      // Check if code exists
      const existing = db.getPairingRequestByCode(code);
      if (!existing.success || !existing.data) {
        return code;
      }

      // If code exists but expired, we can reuse it
      if (existing.data.status !== 'pending' || existing.data.expiresAt < Date.now()) {
        return code;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique pairing code');
  }

  /**
   * Generate a random 6-digit code
   */
  private generateRandomCode(): string {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < PAIRING_CONFIG.CODE_LENGTH; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Start the cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      const cleaned = await this.cleanupExpired();
      if (cleaned > 0) {
        console.log(`[PairingService] Cleaned up ${cleaned} expired pairing requests`);
      }
    }, PAIRING_CONFIG.CLEANUP_INTERVAL_MS);
  }
}

// Export singleton getter for convenience
let pairingServiceInstance: PairingService | null = null;

export function getPairingService(): PairingService {
  if (!pairingServiceInstance) {
    pairingServiceInstance = new PairingService();
  }
  return pairingServiceInstance;
}
