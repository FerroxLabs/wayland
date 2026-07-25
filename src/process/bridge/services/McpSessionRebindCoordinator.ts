/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';

export type McpSessionRebindRequest<T> = {
  conversationId: string;
  taskType: string | undefined;
  appliedFingerprint: string | undefined;
  currentFingerprint: string | undefined;
  build: () => Promise<T | undefined>;
  kill: () => Promise<void>;
  clearAuthority: (generation: string) => Promise<void>;
  persistAuthority: (fingerprint: string, generation: string) => Promise<void>;
};

export type McpSessionRebindResult<T> = {
  task: T | undefined;
  generation?: string;
  rebound: boolean;
};

const MCP_SESSION_TASK_TYPES = new Set(['gemini', 'acp', 'codex', 'wcore']);

type InFlight<T> = {
  targetFingerprint: string;
  promise: Promise<McpSessionRebindResult<T>>;
};

/**
 * Serializes credential-bearing runtime replacement per conversation.
 * Authority is cleared before termination and restored only after a successful
 * replacement, so a failed rebuild cannot leave an old green receipt behind.
 */
export class McpSessionRebindCoordinator<T> {
  private readonly inFlight = new Map<string, InFlight<T>>();
  private readonly applied = new Map<string, string>();

  constructor(private readonly createGeneration: () => string = randomUUID) {}

  async getOrRebind(request: McpSessionRebindRequest<T>): Promise<McpSessionRebindResult<T>> {
    const { conversationId, currentFingerprint, taskType } = request;
    if (!taskType || !MCP_SESSION_TASK_TYPES.has(taskType) || !currentFingerprint) {
      return { task: await request.build(), rebound: false };
    }

    const knownApplied = this.applied.get(conversationId) ?? request.appliedFingerprint;
    if (knownApplied === currentFingerprint) {
      return { task: await request.build(), rebound: false };
    }

    const active = this.inFlight.get(conversationId);
    if (active) {
      if (active.targetFingerprint === currentFingerprint) return active.promise;
      await active.promise.catch((_error: unknown): undefined => undefined);
      return this.getOrRebind(request);
    }

    const generation = this.createGeneration();
    const promise =
      knownApplied === undefined ? this.adoptInitialAuthority(request, generation) : this.replace(request, generation);
    this.inFlight.set(conversationId, { targetFingerprint: currentFingerprint, promise });
    try {
      return await promise;
    } finally {
      if (this.inFlight.get(conversationId)?.promise === promise) this.inFlight.delete(conversationId);
    }
  }

  private async adoptInitialAuthority(
    request: McpSessionRebindRequest<T>,
    generation: string
  ): Promise<McpSessionRebindResult<T>> {
    const fingerprint = request.currentFingerprint;
    if (!fingerprint) return { task: await request.build(), rebound: false };
    const task = await request.build();
    if (!task) throw new Error(`MCP runtime build produced no task for ${request.conversationId}`);
    try {
      await request.persistAuthority(fingerprint, generation);
    } catch (error) {
      await request.kill().catch((_error: unknown): undefined => undefined);
      throw error;
    }
    this.applied.set(request.conversationId, fingerprint);
    return { task, generation, rebound: false };
  }

  private async replace(
    request: McpSessionRebindRequest<T>,
    generation: string
  ): Promise<McpSessionRebindResult<T>> {
    const fingerprint = request.currentFingerprint;
    if (!fingerprint) return { task: await request.build(), rebound: false };

    this.applied.delete(request.conversationId);
    await request.clearAuthority(generation);
    await request.kill();
    const task = await request.build();
    if (!task) throw new Error(`MCP runtime rebuild produced no task for ${request.conversationId}`);
    try {
      await request.persistAuthority(fingerprint, generation);
    } catch (error) {
      await request.kill().catch((_error: unknown): undefined => undefined);
      throw error;
    }
    this.applied.set(request.conversationId, fingerprint);
    return { task, generation, rebound: true };
  }
}
