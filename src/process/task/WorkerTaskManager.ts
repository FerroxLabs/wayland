/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import type { IAgentFactory } from './IAgentFactory';
import type { AgentKillReason, IAgentManager } from './IAgentManager';
import type { IWorkerTaskManager } from './IWorkerTaskManager';
import type { BuildConversationOptions, AgentType } from './agentTypes';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';
import type { TChatConversation } from '@/common/config/storage';
import { cronBusyGuard } from '@process/services/cron/CronBusyGuard';
import { ProcessConfig } from '@process/utils/initStorage';
import { enforceProjectWorkspace } from '@process/services/projectWorkspace';

/** Default idle timeout: 5 minutes. Overridden by user config 'acp.agentIdleTimeout' (in minutes). */
const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
/** How often to scan for idle CLI-backed agents. */
const AGENT_IDLE_CHECK_INTERVAL_MS = 1 * 60 * 1000;

export class WorkerTaskManager implements IWorkerTaskManager {
  private taskList: Array<{
    id: string;
    authorityId: string;
    workspace?: string;
    task: IAgentManager;
    lifecycle: 'running' | 'terminating';
    termination?: Promise<void>;
  }> = [];
  private readonly conversationShutdowns = new Set<string>();
  private readonly conversationShutdownOperations = new Set<string>();
  private nextAuthorityId = 0;
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
    this.idleCheckTimer = setInterval(() => {
      void this.killIdleCliAgents();
    }, AGENT_IDLE_CHECK_INTERVAL_MS);
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

  private async killIdleCliAgents(): Promise<void> {
    const timeoutMs = await this.getIdleTimeoutMs();
    const now = Date.now();
    const idleTasks = this.taskList.filter(
      (item) =>
        (item.task.type === 'acp' || item.task.type === 'wcore') &&
        item.task.status === 'finished' &&
        !cronBusyGuard.isProcessing(item.id) &&
        now - item.task.lastActivityAt > timeoutMs
    );
    const results = await Promise.allSettled(idleTasks.map((item) => this.kill(item.id, 'idle_timeout')));
    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        console.warn(`[WorkerTaskManager] failed to stop idle conversation ${idleTasks[index].id}:`, result.reason);
      }
    }
  }

  getTask(id: string): IAgentManager | undefined {
    return this.taskList.find((item) => item.id === id && item.lifecycle === 'running')?.task;
  }

  async getOrBuildTask(id: string, options?: BuildConversationOptions): Promise<IAgentManager> {
    this.assertConversationOpen(id);
    if (!options?.skipCache) {
      const existing = this.getTask(id);
      if (existing) return existing;
    }

    const conversation = await this.repo.getConversation(id);
    if (conversation) {
      // #30 NO-DRIFT: a project chat must spawn in its project workspace. Correct
      // any row that drifted off it (pre-0.9.7 chats stuck in a temp dir, rows
      // brought in via the file->DB migration that bypasses create-time
      // reconcile) before the agent factory reads extra.workspace, and persist
      // the correction so the fix sticks across restarts.
      const corrected = await enforceProjectWorkspace(conversation.extra as Record<string, unknown> | undefined);
      if (corrected) {
        try {
          await this.repo.updateConversation(conversation.id, { extra: conversation.extra });
        } catch (err) {
          console.error('[WorkerTaskManager] failed to persist #30 workspace correction:', err);
        }
      }
      // The repository lookup and project reconciliation both yield. Re-check
      // the terminal gate immediately before the synchronous factory seam so a
      // concurrent conversation removal cannot spawn an untracked successor.
      this.assertConversationOpen(id);
      return this._buildAndCache(conversation, options);
    }

    throw new Error(`Conversation not found: ${id}`);
  }

  private _buildAndCache(conversation: TChatConversation, options?: BuildConversationOptions): IAgentManager {
    const task = this.factory.create(conversation, options);
    this.addTask(conversation.id, task);
    return task;
  }

  addTask(id: string, task: IAgentManager): void {
    if (this.conversationShutdowns.has(id)) {
      // Callers that already constructed a task before observing the gate must
      // not orphan it. Publish a terminating lease so the removal barrier sees
      // and awaits the refused successor, then fail the caller closed.
      this.nextAuthorityId += 1;
      const refusedLease = {
        id,
        authorityId: `active-process-${this.nextAuthorityId}`,
        workspace: task.workspace,
        task,
        lifecycle: 'running' as const,
      };
      this.taskList.push(refusedLease);
      void this.beginTermination(refusedLease).catch(() => {
        // A failed shutdown intentionally remains authoritative in taskList.
      });
      throw new Error(`Conversation is shutting down: ${id}`);
    }
    const existing = this.taskList.find((item) => item.id === id && item.lifecycle === 'running');
    if (existing) {
      // Kill the old process before replacing to prevent orphaned child processes.
      // Without this, getOrBuildTask(skipCache: true) leaves the old agent running.
      // kill() is async (AUDIT-05 F20 / M18) but addTask itself is sync - the
      // old agent's exit doesn't block creating the replacement.
      void this.beginTermination(existing).catch(() => {
        // The failed terminating lease stays authoritative in taskList.
      });
    }
    this.nextAuthorityId += 1;
    this.taskList.push({
      id,
      authorityId: `active-process-${this.nextAuthorityId}`,
      workspace: task.workspace,
      task,
      lifecycle: 'running',
    });
  }

  kill(id: string, reason?: AgentKillReason): Promise<void> {
    // A replacement can coexist with one or more older same-ID leases that
    // are still terminating. Conversation removal is safe only after every
    // lease owned by that durable conversation has actually stopped.
    const leases = this.taskList.filter((item) => item.id === id);
    if (leases.length === 0) return Promise.resolve();
    return Promise.all(
      leases.map((lease) => this.beginTermination(lease, lease.lifecycle === 'running' ? reason : undefined))
    ).then((): void => undefined);
  }

  async withConversationShutdown<TPrepared, TResult>(
    id: string,
    prepare: () => Promise<TPrepared>,
    commit: (prepared: TPrepared) => TResult
  ): Promise<TResult> {
    if (this.conversationShutdownOperations.has(id)) {
      throw new Error(`Conversation is already shutting down: ${id}`);
    }
    this.conversationShutdowns.add(id);
    this.conversationShutdownOperations.add(id);
    let durableOperationCompleted = false;
    try {
      await this.drainConversationTasks(id);
      const prepared = await prepare();
      // Preparation can yield long enough for a caller that already constructed
      // a task to hit addTask. Drain every refused successor before the durable
      // reference is removed. The commit is deliberately synchronous so no new
      // task can interleave between this fixed point and persistence deletion.
      return await this.drainConversationTasksAndCommit(id, () => {
        const result = commit(prepared);
        durableOperationCompleted = true;
        return result;
      });
    } finally {
      this.conversationShutdownOperations.delete(id);
      // Failed persistence leaves the conversation usable for a safe retry.
      // A failed process exit keeps the identity-bound lease and terminal gate,
      // but releases operation ownership so a later verified shutdown may retry.
      // Successful deletion permanently tombstones this process-local ID. An
      // in-flight repository read may still hold the deleted row and must not
      // publish a stale successor after the durable operation returns.
      if (!durableOperationCompleted && !this.taskList.some((lease) => lease.id === id)) {
        this.conversationShutdowns.delete(id);
      }
    }
  }

  private async drainConversationTasks(id: string): Promise<void> {
    while (true) {
      if (!this.taskList.some((lease) => lease.id === id)) {
        // Let refusal work already queued by the callback publish its lease
        // before declaring the fixed point. The tombstone remains installed.
        // oxlint-disable-next-line no-await-in-loop -- fixed-point barrier requires one microtask observation
        await Promise.resolve();
        if (!this.taskList.some((lease) => lease.id === id)) return;
      }
      // oxlint-disable-next-line no-await-in-loop -- each pass discovers successors raced into the prior pass
      await this.kill(id);
    }
  }

  private async drainConversationTasksAndCommit<TResult>(id: string, commit: () => TResult): Promise<TResult> {
    while (true) {
      if (!this.taskList.some((lease) => lease.id === id)) {
        // Observe refusal work already queued by preparation, then commit in
        // this same continuation. Returning to the caller before commit would
        // create a microtask gap where a stale successor could publish a lease.
        // oxlint-disable-next-line no-await-in-loop -- fixed-point barrier requires one microtask observation
        await Promise.resolve();
        if (!this.taskList.some((lease) => lease.id === id)) return commit();
      }
      // oxlint-disable-next-line no-await-in-loop -- each pass discovers successors raced into the prior pass
      await this.kill(id);
    }
  }

  private assertConversationOpen(id: string): void {
    if (this.conversationShutdowns.has(id)) {
      throw new Error(`Conversation is shutting down: ${id}`);
    }
  }

  private beginTermination(lease: (typeof this.taskList)[number], reason?: AgentKillReason): Promise<void> {
    if (lease.termination) return lease.termination;
    lease.lifecycle = 'terminating';
    try {
      // Invoke kill synchronously so replacement preserves the established
      // contract that shutdown begins before the successor is published.
      let termination!: Promise<void>;
      termination = Promise.resolve(lease.task.kill(reason)).then(
        () => {
          const index = this.taskList.indexOf(lease);
          if (index >= 0) this.taskList.splice(index, 1);
        },
        (error) => {
          // Retain the exact authority lease, workspace, and terminal gate, but
          // release only this failed attempt so a later identity-bound probe can
          // obtain real exit proof. Successors remain refused throughout.
          if (lease.termination === termination) lease.termination = undefined;
          throw error;
        }
      );
      lease.termination = termination;
    } catch (error) {
      lease.termination = undefined;
      return Promise.reject(error);
    }
    return lease.termination;
  }

  async clear(): Promise<void> {
    clearInterval(this.idleCheckTimer);
    this.idleCheckTimer = undefined;
    // Detach the shared exit handler so repeated singleton resets / tests don't
    // leak listeners on the global `process` emitter.
    process.off('exit', this.shutdownHandler);
    const tasks = [...this.taskList];
    // AUDIT-05 F20 / M18: kill() now returns a Promise that resolves when the
    // child has actually exited (or after each agent's internal hard timeout).
    // Use allSettled (not all) so one stuck child doesn't block the others, and
    // await all of them so before-quit doesn't return before children die.
    if (tasks.length > 0) {
      await Promise.allSettled(tasks.map((item) => this.beginTermination(item)));
    }
  }

  listTasks(): Array<{ id: string; type: AgentType }> {
    return this.taskList.map((t) => ({ id: t.id, type: t.task.type }));
  }

  listWorkspaceAuthorities(): Array<{ id: string; workspace?: string }> {
    return this.taskList.map((lease) => ({ id: lease.authorityId, workspace: lease.workspace }));
  }
}
