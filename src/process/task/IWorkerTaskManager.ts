/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// src/process/task/IWorkerTaskManager.ts

import type { AgentKillReason, IAgentManager } from './IAgentManager';
import type { BuildConversationOptions, AgentType } from './agentTypes';

export interface IWorkerTaskManager {
  getTask(id: string): IAgentManager | undefined;
  getOrBuildTask(id: string, options?: BuildConversationOptions): Promise<IAgentManager>;
  addTask(id: string, task: IAgentManager): void;
  /** Hide from reuse immediately, but retain an active lease until the underlying agent has exited. */
  kill(id: string, reason?: AgentKillReason): Promise<void>;
  clear(): Promise<void>;
  listTasks(): Array<{ id: string; type: AgentType }>;
  /** Process-owned lease identities and their creation-time workspaces for retention authority. */
  listWorkspaceAuthorities(): Array<{ id: string; workspace?: string }>;
}
