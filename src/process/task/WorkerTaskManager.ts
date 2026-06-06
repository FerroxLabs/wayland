/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IAgentFactory } from './IAgentFactory';
import type { AgentKillReason, IAgentManager } from './IAgentManager';
import type { IWorkerTaskManager } from './IWorkerTaskManager';
import type { BuildConversationOptions, AgentType } from './agentTypes';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';
import type { TChatConversation } from '@/common/config/storage';
import { cronBusyGuard } from '@process/services/cron/CronBusyGuard';
import { ProcessConfig } from '@process/utils/initStorage';

/** Default idle timeout: 5 minutes. Overridden by user config 'acp.agentIdleTimeout' (in minutes). */
const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
/** How often to scan for idle CLI-backed agents. */
const AGENT_IDLE_CHECK_INTERVAL_MS = 1 * 60 * 1000;

export class WorkerTaskManager implements IWorkerTaskManager {
  private taskList: Array<{ id: string; task: IAgentManager }> = [];
  private idleCheckTimer: ReturnType<typeof setInterval> | undefined;
  // NOTE(M14/AUDIT-05 F5): single shared `process.on('exit', ...)` handler
  // installed here instead of one-per-ForkTask. Iterates taskList on shutdown
  // and calls kill() on every live agent, so concurrent forks no longer trip
  // Node's 11-listener default cap.
  private readonly shutdownHandler: () => void;

  constructor(
    private readonly factory: IAgentFactory,
    private readonly repo: IConversationRepository
  ) {
    this.idleCheckTimer = setInterval(() => this.killIdleCliAgents(), AGENT_IDLE_CHECK_INTERVAL_MS);
    this.shutdownHandler = () => {
      // `process.on('exit', ...)` is synchronous - Node will not wait on
      // returned promises here. Fire-and-forget; the actual graceful await
      // happens earlier via before-quit → clear() (AUDIT-05 F20 / M18).
      for (const item of this.taskList) {
        try {
          void item.task.kill();
        } catch {
          // best-effort during process exit
        }
      }
    };
    process.on('exit', this.shutdownHandler);
  }

  private async getIdleTimeoutMs(): Promise<number> {
    try {
      const minutes = await ProcessConfig.get('acp.agentIdleTimeout');
      if (minutes && minutes > 0) return minutes * 60 * 1000;
    } catch {
      // Fallback to default
    }
    return DEFAULT_IDLE_TIMEOUT_MS;
  }

  private killIdleCliAgents(): void {
    void this.getIdleTimeoutMs().then((timeoutMs) => {
      const now = Date.now();
      const idleTasks = this.taskList.filter(
        (item) =>
          (item.task.type === 'acp' || item.task.type === 'wcore') &&
          item.task.status === 'finished' &&
          !cronBusyGuard.isProcessing(item.id) &&
          now - item.task.lastActivityAt > timeoutMs
      );
      for (const item of idleTasks) {
        this.kill(item.id, 'idle_timeout');
      }
    });
  }

  getTask(id: string): IAgentManager | undefined {
    return this.taskList.find((item) => item.id === id)?.task;
  }

  async getOrBuildTask(id: string, options?: BuildConversationOptions): Promise<IAgentManager> {
    if (!options?.skipCache) {
      const existing = this.getTask(id);
      if (existing) return existing;
    }

    const conversation = await this.repo.getConversation(id);
    if (conversation) return this._buildAndCache(conversation, options);

    throw new Error(`Conversation not found: ${id}`);
  }

  private _buildAndCache(conversation: TChatConversation, options?: BuildConversationOptions): IAgentManager {
    const task = this.factory.create(conversation, options);
    this.addTask(conversation.id, task);
    return task;
  }

  addTask(id: string, task: IAgentManager): void {
    const existing = this.taskList.find((item) => item.id === id);
    if (existing) {
      // Kill the old process before replacing to prevent orphaned child processes.
      // Without this, getOrBuildTask(skipCache: true) leaves the old agent running.
      // kill() is async (AUDIT-05 F20 / M18) but addTask itself is sync - the
      // old agent's exit doesn't block creating the replacement.
      void existing.task.kill();
      existing.task = task;
    } else {
      this.taskList.push({ id, task });
    }
  }

  kill(id: string, reason?: AgentKillReason): void {
    const index = this.taskList.findIndex((item) => item.id === id);
    if (index === -1) return;
    // kill() is async (AUDIT-05 F20 / M18); fire-and-forget here. Callers that
    // need to wait for the child to die (e.g. before-quit) go through clear().
    void this.taskList[index]?.task.kill(reason);
    this.taskList.splice(index, 1);
  }

  async clear(): Promise<void> {
    clearInterval(this.idleCheckTimer);
    this.idleCheckTimer = undefined;
    // Detach the shared exit handler so repeated singleton resets / tests don't
    // leak listeners on the global `process` emitter.
    process.off('exit', this.shutdownHandler);
    const tasks = [...this.taskList];
    this.taskList = [];
    // AUDIT-05 F20 / M18: kill() now returns a Promise that resolves when the
    // child has actually exited (or after each agent's internal hard timeout).
    // Use allSettled (not all) so one stuck child doesn't block the others, and
    // await all of them so before-quit doesn't return before children die.
    if (tasks.length > 0) {
      await Promise.allSettled(
        tasks.map((item) => {
          try {
            return item.task.kill();
          } catch (err) {
            return Promise.reject(err);
          }
        })
      );
    }
  }

  listTasks(): Array<{ id: string; type: AgentType }> {
    return this.taskList.map((t) => ({ id: t.id, type: t.task.type }));
  }
}
