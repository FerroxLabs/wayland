/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// src/process/task/agentTypes.ts

import type { ResumeSeedOptions } from '@process/task/resumeSeed';

// 'wcore' targets the Wayland-Core Rust engine.
export type AgentType = 'gemini' | 'acp' | 'openclaw-gateway' | 'nanobot' | 'remote' | 'wcore';
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
  /**
   * #723 per-step context reset: when present, the wcore spawn seeds only this
   * bounded carry-forward (the immediately-prior deliverable) instead of the
   * default resume seed. Threaded verbatim as `WCoreManagerData.workflowResetSeed`
   * into `WCoreManager.start()`. Absent => seeding is byte-identical to today.
   * The field name is identical at every hop (INVARIANT, see workflowAdvanceReset.ts).
   */
  workflowResetSeed?: ResumeSeedOptions;
}
