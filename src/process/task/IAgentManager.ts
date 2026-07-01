/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// src/process/task/IAgentManager.ts

import type { IConfirmation } from '@/common/chat/chatLib';
import type { AgentType, AgentStatus } from './agentTypes';

export type AgentKillReason = 'idle_timeout' | 'team_deleted' | 'workspace_rehome';

export interface IAgentManager {
  readonly type: AgentType;
  /**
   * readonly on interface; the implementation class mutates its own this.status.
   */
  readonly status: AgentStatus | undefined;
  readonly workspace: string;
  readonly conversation_id: string;
  /** Timestamp of the last sendMessage call. Used for idle-timeout cleanup. */
  readonly lastActivityAt: number;

  sendMessage(data: unknown): Promise<void>;
  stop(): Promise<void>;
  confirm(msgId: string, callId: string, data: unknown): void;
  getConfirmations(): IConfirmation[];
  /**
   * Terminate the agent and wait for its child process to actually exit.
   * AUDIT-05 F20 / M18: WorkerTaskManager.clear() awaits Promise.allSettled
   * over every kill() so before-quit doesn't return before children die.
   */
  kill(reason?: AgentKillReason): Promise<void>;
}
