/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// src/process/task/agentTypes.ts

export type AgentType = 'gemini' | 'acp' | 'openclaw-gateway' | 'remote';
export type AgentStatus = 'pending' | 'running' | 'finished';

export const CHANNEL_CONVERSATIONAL_POLICY = 'channel-conversational' as const;
export type AgentExecutionPolicy = typeof CHANNEL_CONVERSATIONAL_POLICY;

export interface BuildConversationOptions {
  /**
   * Process-owned execution policy applied at construction time. Channel
   * callers use the conversational policy to create a tool-free Gemini worker;
   * it is never read from persisted conversation extras or prompt text.
   */
  executionPolicy?: AgentExecutionPolicy;
  /** Cancels an in-flight task build before it can publish a worker lease. */
  launchSignal?: AbortSignal;
  /** Force yolo mode (auto-approve all tool calls) */
  yoloMode?: boolean;
  /** Skip task cache - create a new isolated instance */
  skipCache?: boolean;
  /**
   * #1045: ms a HELD tool call may wait before it is denied, for UNATTENDED
   * (scheduled) runs. Absent for every interactive spawn, which is what keeps an
   * attended prompt indefinite. Computed by `resolveUnattendedHoldMs` so it is
   * always strictly under the time to that conversation's next scheduled run.
   */
  unattendedHoldDeadlineMs?: number;
}
