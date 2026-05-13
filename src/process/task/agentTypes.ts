/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// src/process/task/agentTypes.ts

// 'wcore' and 'aionrs' both target the wayland-core engine (dual-write/read
// policy — see Task E in BLACKBOARD). NEW conversations persist as 'wcore';
// existing rows remain readable as 'aionrs'.
export type AgentType = 'gemini' | 'acp' | 'openclaw-gateway' | 'nanobot' | 'remote' | 'aionrs' | 'wcore';
export type AgentStatus = 'pending' | 'running' | 'finished';

export interface BuildConversationOptions {
  /** Force yolo mode (auto-approve all tool calls) */
  yoloMode?: boolean;
  /** Skip task cache — create a new isolated instance */
  skipCache?: boolean;
}
