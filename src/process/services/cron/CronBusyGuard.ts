/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Conversation state for tracking busy/idle status
 */
interface ConversationState {
  isProcessing: boolean;
  lastActiveAt: number;
}

/**
 * Service to track conversation busy state
 * Used by CronService to avoid sending messages to busy conversations
 */
type IdleCallback = () => void;

export class CronBusyGuard {
  private states = new Map<string, ConversationState>();
  private idleCallbacks = new Map<string, IdleCallback[]>();
  /**
   * One-shot callbacks fired when the LAST processing conversation clears, i.e.
   * the whole app goes idle. Backs update-on-quiesce (#651/#632): because team
   * wakes and cron runs all funnel through the agent managers that call
   * setProcessing(), this single registry already spans chat + cron + team.
   */
  private globalIdleCallbacks: IdleCallback[] = [];

  /**
   * Check if a conversation is currently processing a message
   */
  isProcessing(conversationId: string): boolean {
    return this.states.get(conversationId)?.isProcessing ?? false;
  }

  /**
   * Set the processing state of a conversation
   * Should be called at the start and end of message processing
   */
  setProcessing(conversationId: string, value: boolean): void {
    const state = this.states.get(conversationId) ?? { isProcessing: false, lastActiveAt: 0 };
    state.isProcessing = value;
    if (value) {
      state.lastActiveAt = Date.now();
    }
    this.states.set(conversationId, state);

    // Fire idle callbacks when processing completes
    if (!value) {
      const callbacks = this.idleCallbacks.get(conversationId);
      if (callbacks) {
        this.idleCallbacks.delete(conversationId);
        for (const cb of callbacks) cb();
      }

      // Global idle: fire the one-shot app-idle callbacks only when THIS clear
      // left nothing else processing (the last busy conversation went idle).
      if (this.globalIdleCallbacks.length > 0 && !this.isAppBusy()) {
        const globals = this.globalIdleCallbacks;
        this.globalIdleCallbacks = [];
        for (const cb of globals) cb();
      }
    }
  }

  /**
   * True if ANY tracked conversation is currently processing. The single source
   * of truth for "is the app working right now" across chat, cron, and team
   * wakes (they all route through setProcessing). (#651/#632)
   */
  isAppBusy(): boolean {
    for (const state of this.states.values()) {
      if (state.isProcessing) return true;
    }
    return false;
  }

  /**
   * Register a one-shot callback for when the WHOLE app becomes idle (no
   * conversation processing). If already idle, fires immediately — this matches
   * onceIdle's already-idle behavior and closes the busy→idle race: a caller
   * that checks isAppBusy() and then registers can never miss the transition,
   * because registration is synchronous with the check. (#651/#632)
   */
  onceAllIdle(callback: IdleCallback): void {
    if (!this.isAppBusy()) {
      callback();
      return;
    }
    this.globalIdleCallbacks.push(callback);
  }

  /**
   * Register a one-time callback for when a conversation becomes idle.
   * If already idle, fires immediately.
   */
  onceIdle(conversationId: string, callback: IdleCallback): void {
    if (!this.isProcessing(conversationId)) {
      callback();
      return;
    }
    const existing = this.idleCallbacks.get(conversationId) ?? [];
    existing.push(callback);
    this.idleCallbacks.set(conversationId, existing);
  }

  /**
   * Get the last active timestamp of a conversation
   */
  getLastActiveAt(conversationId: string): number | undefined {
    return this.states.get(conversationId)?.lastActiveAt;
  }

  /**
   * Wait for a conversation to become idle
   * Polls the state until isProcessing is false or timeout
   *
   * @param conversationId - The conversation to wait for
   * @param timeoutMs - Maximum time to wait (default 60s)
   * @throws Error if timeout is reached
   */
  async waitForIdle(conversationId: string, timeoutMs = 60000): Promise<void> {
    const start = Date.now();
    const pollInterval = 1000; // 1 second

    while (this.isProcessing(conversationId)) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timeout waiting for conversation ${conversationId} to be idle`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Get all conversation states (for debugging/monitoring)
   */
  getAllStates(): Map<string, ConversationState> {
    return new Map(this.states);
  }

  /**
   * Clean up stale states that haven't been active for a while
   * Should be called periodically to prevent memory leaks
   *
   * @param olderThanMs - Remove states older than this (default 1 hour)
   */
  cleanup(olderThanMs = 3600000): void {
    const now = Date.now();
    for (const [id, state] of this.states) {
      // Only clean up idle conversations
      if (!state.isProcessing && now - state.lastActiveAt > olderThanMs) {
        this.states.delete(id);
      }
    }
  }

  /**
   * Remove state for a specific conversation
   * Call when conversation is deleted
   */
  remove(conversationId: string): void {
    this.states.delete(conversationId);
  }

  /**
   * Clear all states (for testing)
   */
  clear(): void {
    this.states.clear();
    this.idleCallbacks.clear();
    this.globalIdleCallbacks = [];
  }
}

// Singleton instance
export const cronBusyGuard = new CronBusyGuard();
