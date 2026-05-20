/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stream Resilience Module - OAuth Stream Resilience Handling
 *
 * Solves the issue of Gemini stream disconnection in OAuth mode.
 *
 * Key Features:
 * 1. SSE Reconnection Mechanism
 * 2. Heartbeat Detection
 * 3. Timeout Handling
 * 4. Connection State Monitoring
 */

import type { ServerGeminiStreamEvent } from '@office-ai/aioncli-core';

// Stream Connection Configuration
export interface StreamResilienceConfig {
  /**
   * Maximum retries
   */
  maxRetries: number;
  /**
   * Initial retry delay (ms)
   */
  initialRetryDelayMs: number;
  /**
   * Maximum retry delay (ms)
   */
  maxRetryDelayMs: number;
  /**
   * Heartbeat timeout (ms) - Connection considered disconnected if no data within this time
   */
  heartbeatTimeoutMs: number;
  /**
   * Single request timeout (ms)
   */
  requestTimeoutMs: number;
  /**
   * Enable auto-reconnect
   */
  enableAutoReconnect: boolean;
}

// Default Configuration
export const DEFAULT_STREAM_RESILIENCE_CONFIG: StreamResilienceConfig = {
  maxRetries: 3,
  initialRetryDelayMs: 1000,
  maxRetryDelayMs: 10000,
  heartbeatTimeoutMs: 90000, // 90 seconds without data considered disconnected
  requestTimeoutMs: 120000, // 2 minutes request timeout
  enableAutoReconnect: true,
};

// Stream State
export enum StreamConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
}

// Connection Event Types
export type StreamConnectionEvent =
  | { type: 'state_change'; state: StreamConnectionState; reason?: string }
  | { type: 'heartbeat_timeout'; lastEventTime: number }
  | { type: 'retry_attempt'; attempt: number; maxRetries: number; delayMs: number }
  | { type: 'reconnect_success'; attempt: number }
  | { type: 'reconnect_failed'; error: Error };

// Stream Monitor
export class StreamMonitor {
  private lastEventTime: number = Date.now();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private state: StreamConnectionState = StreamConnectionState.DISCONNECTED;
  private config: StreamResilienceConfig;
  private onConnectionEvent?: (event: StreamConnectionEvent) => void;

  constructor(
    config: Partial<StreamResilienceConfig> = {},
    onConnectionEvent?: (event: StreamConnectionEvent) => void
  ) {
    this.config = { ...DEFAULT_STREAM_RESILIENCE_CONFIG, ...config };
    this.onConnectionEvent = onConnectionEvent;
  }

  /**
   * Start monitoring stream connection
   */
  start(): void {
    this.setState(StreamConnectionState.CONNECTING);
    this.lastEventTime = Date.now();
    this.startHeartbeatCheck();
  }

  /**
   * Record received event and update heartbeat time
   */
  recordEvent(): void {
    this.lastEventTime = Date.now();
    if (this.state === StreamConnectionState.CONNECTING || this.state === StreamConnectionState.RECONNECTING) {
      this.setState(StreamConnectionState.CONNECTED);
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.stopHeartbeatCheck();
    this.setState(StreamConnectionState.DISCONNECTED);
  }

  /**
   * Mark connection as failed
   */
  markFailed(reason?: string): void {
    this.stopHeartbeatCheck();
    this.setState(StreamConnectionState.FAILED, reason);
  }

  /**
   * Mark as reconnecting
   */
  markReconnecting(): void {
    this.setState(StreamConnectionState.RECONNECTING);
  }

  /**
   * Get current state
   */
  getState(): StreamConnectionState {
    return this.state;
  }

  /**
   * Get last event time
   */
  getLastEventTime(): number {
    return this.lastEventTime;
  }

  /**
   * Check if heartbeat timed out
   */
  isHeartbeatTimeout(): boolean {
    return Date.now() - this.lastEventTime > this.config.heartbeatTimeoutMs;
  }

  private setState(state: StreamConnectionState, reason?: string): void {
    if (this.state !== state) {
      this.state = state;
      this.onConnectionEvent?.({ type: 'state_change', state, reason });
    }
  }

  private startHeartbeatCheck(): void {
    this.stopHeartbeatCheck();
    this.heartbeatTimer = setInterval(() => {
      if (this.isHeartbeatTimeout()) {
        this.onConnectionEvent?.({
          type: 'heartbeat_timeout',
          lastEventTime: this.lastEventTime,
        });
        // Do not stop automatically, let upper layer decide how to handle
      }
    }, 5000); // Check every 5 seconds
  }

  private stopHeartbeatCheck(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

/**
 * Stream Wrapper with Resilience
 * Wraps original stream, adding heartbeat detection and timeout handling
 */
export async function* wrapStreamWithResilience<T extends ServerGeminiStreamEvent>(
  stream: AsyncIterable<T>,
  config: Partial<StreamResilienceConfig> = {},
  onConnectionEvent?: (event: StreamConnectionEvent) => void
): AsyncGenerator<T, void, unknown> {
  const fullConfig = { ...DEFAULT_STREAM_RESILIENCE_CONFIG, ...config };
  const monitor = new StreamMonitor(fullConfig, onConnectionEvent);

  monitor.start();

  try {
    for await (const event of stream) {
      monitor.recordEvent();
      yield event;
    }
  } catch (error) {
    monitor.markFailed(error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    monitor.stop();
  }
}

/**
 * Delay function
 */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    });
  });
}

/**
 * Calculate Exponential Backoff Delay
 */
export function calculateBackoffDelay(attempt: number, config: StreamResilienceConfig): number {
  const baseDelay = config.initialRetryDelayMs * Math.pow(2, attempt);
  const jitter = baseDelay * 0.3 * (Math.random() * 2 - 1);
  return Math.min(config.maxRetryDelayMs, Math.max(0, baseDelay + jitter));
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Network related errors
    if (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('econnreset') ||
      message.includes('socket hang up')
    ) {
      return true;
    }
    // HTTP Status Code related
    if (message.includes('429') || message.includes('503') || message.includes('502') || message.includes('504')) {
      return true;
    }
  }
  return false;
}

/**
 * Tool Call Guard
 * Prevents tool calls from being cancelled during execution
 */
export class ToolCallGuard {
  private protectedCallIds: Set<string> = new Set();
  private completedCallIds: Set<string> = new Set();

  /**
   * Protect a tool call from being cancelled
   */
  protect(callId: string): void {
    this.protectedCallIds.add(callId);
  }

  /**
   * Check if a tool call is protected
   */
  isProtected(callId: string): boolean {
    return this.protectedCallIds.has(callId);
  }

  /**
   * Mark a tool call as completed
   */
  complete(callId: string): void {
    this.protectedCallIds.delete(callId);
    this.completedCallIds.add(callId);
  }

  /**
   * Check if a tool call is completed
   */
  isCompleted(callId: string): boolean {
    return this.completedCallIds.has(callId);
  }

  /**
   * Remove protection
   */
  unprotect(callId: string): void {
    this.protectedCallIds.delete(callId);
  }

  /**
   * Clear all states
   */
  clear(): void {
    this.protectedCallIds.clear();
    this.completedCallIds.clear();
  }

  /**
   * Get all protected call IDs
   */
  getProtectedCallIds(): string[] {
    return Array.from(this.protectedCallIds);
  }
}

// Global Tool Call Guard Instance
export const globalToolCallGuard = new ToolCallGuard();
