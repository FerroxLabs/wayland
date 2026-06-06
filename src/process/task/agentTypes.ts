/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// src/process/task/agentTypes.ts

// 'wcore' targets the Wayland-Core Rust engine.
export type AgentType = 'gemini' | 'acp' | 'openclaw-gateway' | 'nanobot' | 'remote' | 'wcore';
export type AgentStatus = 'pending' | 'running' | 'finished';

export interface BuildConversationOptions {
  /** Force yolo mode (auto-approve all tool calls) */
  yoloMode?: boolean;
  /** Skip task cache - create a new isolated instance */
  skipCache?: boolean;
}
