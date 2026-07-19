/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatabase, type WaylandUIDatabase } from '@process/services/database';

type CleanupDatabase = Pick<
  WaylandUIDatabase,
  | 'getConversationChannelCleanupIntent'
  | 'getConversationChannelCleanupIntents'
  | 'recordConversationChannelCleanupAttempt'
  | 'retireConversationChannelCleanupIntent'
>;

type RetryHandle = ReturnType<typeof setTimeout>;

export type ConversationChannelCleanupDependencies = {
  getDatabase?: () => Promise<CleanupDatabase>;
  clearSessionById: (sessionId: string) => Promise<boolean>;
  clearContext: (sessionId: string) => Promise<void>;
  schedule?: (callback: () => void, delayMs: number) => RetryHandle;
  cancel?: (handle: RetryHandle) => void;
  retryDelayMs?: number;
};

const REPLAY_KEY = '__pending_cleanup_replay__';

/**
 * Replays post-commit channel cleanup from durable session identities.
 *
 * Every operation is idempotent: context clear may repeat, absent sessions are
 * already complete, and the intent is retired only after every step succeeds.
 */
export class ConversationChannelCleanupCoordinator {
  private readonly database: () => Promise<CleanupDatabase>;
  private readonly schedule: (callback: () => void, delayMs: number) => RetryHandle;
  private readonly cancel: (handle: RetryHandle) => void;
  private readonly retryDelayMs: number;
  private readonly retries = new Map<string, RetryHandle>();

  constructor(private readonly deps: ConversationChannelCleanupDependencies) {
    this.database = deps.getDatabase ?? getDatabase;
    this.schedule =
      deps.schedule ??
      ((callback, delayMs) => {
        const handle = setTimeout(callback, delayMs);
        handle.unref?.();
        return handle;
      });
    this.cancel = deps.cancel ?? clearTimeout;
    this.retryDelayMs = deps.retryDelayMs ?? 1000;
  }

  /** Replay every committed intent discovered during ChannelManager startup. */
  async start(): Promise<void> {
    try {
      const db = await this.database();
      const result = db.getConversationChannelCleanupIntents();
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'channel cleanup intents unavailable');
      }
      this.cancelRetry(REPLAY_KEY);
      for (const intent of result.data) {
        try {
          // oxlint-disable-next-line no-await-in-loop -- cleanup order and bounded retry are intentional
          await this.cleanupConversation(intent.conversationId);
        } catch (error) {
          console.warn(`[ConversationChannelCleanup] Cleanup remains pending for ${intent.conversationId}:`, error);
        }
      }
    } catch (error) {
      this.scheduleRetry(REPLAY_KEY, () => this.start());
      throw error;
    }
  }

  /** Attempt one durable intent and retire it only after complete cleanup. */
  async cleanupConversation(conversationId: string): Promise<boolean> {
    try {
      const db = await this.database();
      const intentResult = db.getConversationChannelCleanupIntent(conversationId);
      if (!intentResult.success) {
        throw new Error(intentResult.error ?? 'channel cleanup intent unavailable');
      }
      const intent = intentResult.data;
      if (!intent) {
        this.cancelRetry(conversationId);
        return false;
      }

      const attempt = db.recordConversationChannelCleanupAttempt(conversationId);
      if (!attempt.success || attempt.data !== true) {
        throw new Error(attempt.error ?? 'channel cleanup attempt could not be recorded');
      }

      for (const sessionId of intent.sessionIds) {
        // External context clear runs first. A crash before local session removal
        // simply replays this idempotent operation from the retained intent.
        // oxlint-disable-next-line no-await-in-loop -- each durable identity must complete before retirement
        await this.deps.clearContext(sessionId);
        // oxlint-disable-next-line no-await-in-loop -- preserve deterministic cleanup and retry order
        await this.deps.clearSessionById(sessionId);
      }

      const retired = db.retireConversationChannelCleanupIntent(conversationId);
      if (!retired.success) {
        throw new Error(retired.error ?? 'channel cleanup intent retirement failed');
      }
      this.cancelRetry(conversationId);
      return true;
    } catch (error) {
      this.scheduleRetry(conversationId, () => this.cleanupConversation(conversationId));
      throw error;
    }
  }

  stop(): void {
    for (const handle of this.retries.values()) this.cancel(handle);
    this.retries.clear();
  }

  private scheduleRetry(key: string, operation: () => Promise<unknown>): void {
    if (this.retries.has(key)) return;
    const handle = this.schedule(() => {
      this.retries.delete(key);
      void operation().catch((error) => {
        console.warn(`[ConversationChannelCleanup] Retry remains pending for ${key}:`, error);
      });
    }, this.retryDelayMs);
    this.retries.set(key, handle);
  }

  private cancelRetry(key: string): void {
    const handle = this.retries.get(key);
    if (handle) this.cancel(handle);
    this.retries.delete(key);
  }
}
