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
  /**
   * Own the terminal lifecycle gate for one conversation while its durable
   * reference is removed. Preparation may yield, so every successor raced into
   * that callback is drained before the synchronous durable commit executes.
   */
  withConversationShutdown<TPrepared, TResult>(
    id: string,
    prepare: () => Promise<TPrepared>,
    commit: (prepared: TPrepared) => TResult
  ): Promise<TResult>;
  clear(): Promise<void>;
  listTasks(): Array<{ id: string; type: AgentType }>;
  /** Process-owned lease identities and their creation-time workspaces for retention authority. */
  listWorkspaceAuthorities(): Array<{ id: string; workspace?: string }>;
}
