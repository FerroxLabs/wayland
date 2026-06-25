/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IConversationService, CreateConversationParams, MigrateConversationParams } from './IConversationService';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';
import type { TChatConversation } from '@/common/config/storage';
import { uuid } from '@/common/utils';
import { cronService } from './cron/cronServiceSingleton';
import { SqliteProjectRepository } from '@process/services/database/SqliteProjectRepository';
import { loadProjectKnowledgeBlock, loadGlobalMemoryBlock } from '@process/services/projectKnowledge/knowledge';
import { enforceProjectWorkspace } from '@process/services/projectWorkspace';
import {
  createGeminiAgent,
  createAcpAgent,
  createOpenClawAgent,
  createNanobotAgent,
  createRemoteAgent,
  createWCoreAgent,
} from '@process/utils/initAgent';

/**
 * Concrete implementation of IConversationService.
 * Delegates persistence to an injected IConversationRepository.
 */
export class ConversationServiceImpl implements IConversationService {
  constructor(private readonly repo: IConversationRepository) {}

  async getConversation(id: string): Promise<TChatConversation | undefined> {
    return this.repo.getConversation(id);
  }

  async listAllConversations(): Promise<TChatConversation[]> {
    return this.repo.listAllConversations();
  }

  async getConversationsByCronJob(cronJobId: string): Promise<TChatConversation[]> {
    return this.repo.getConversationsByCronJob(cronJobId);
  }

  async deleteConversation(id: string): Promise<void> {
    await this.repo.deleteConversation(id);
  }

  async updateConversation(id: string, updates: Partial<TChatConversation>, mergeExtra?: boolean): Promise<void> {
    let finalUpdates = updates;
    if (mergeExtra && updates.extra) {
      const existing = await this.repo.getConversation(id);
      if (existing) {
        finalUpdates = {
          ...updates,
          extra: { ...existing.extra, ...updates.extra },
        } as Partial<TChatConversation>;
      }
    }
    await this.repo.updateConversation(id, finalUpdates);
  }

  async createWithMigration(params: MigrateConversationParams): Promise<TChatConversation> {
    const { conversation, sourceConversationId, migrateCron } = params;
    const conv: TChatConversation = {
      ...conversation,
      createTime: conversation.createTime ?? Date.now(),
      modifyTime: conversation.modifyTime ?? Date.now(),
    };
    await this.repo.createConversation(conv);

    if (sourceConversationId) {
      // Copy all messages from source conversation
      const pageSize = 10000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: messages, hasMore: more } = await this.repo.getMessages(sourceConversationId, page, pageSize);
        for (const msg of messages) {
          await this.repo.insertMessage({
            ...msg,
            id: uuid(),
            conversation_id: conv.id,
          });
        }
        hasMore = more;
        page++;
      }

      // Migrate or delete cron jobs associated with source conversation
      try {
        const jobs = await cronService.listJobsByConversation(sourceConversationId);
        if (migrateCron) {
          for (const job of jobs) {
            await cronService.updateJob(job.id, {
              metadata: {
                ...job.metadata,
                conversationId: conv.id,
                conversationTitle: conv.name,
              },
            });
          }
        } else {
          for (const job of jobs) {
            await cronService.removeJob(job.id);
          }
        }
      } catch (err) {
        console.error('[ConversationServiceImpl] Failed to handle cron jobs during migration:', err);
      }

      // Integrity check: only delete source if message counts match
      const sourceMsgs = await this.repo.getMessages(sourceConversationId, 0, 1);
      const newMsgs = await this.repo.getMessages(conv.id, 0, 1);
      if (sourceMsgs.total === newMsgs.total) {
        await this.repo.deleteConversation(sourceConversationId);
      } else {
        console.error('[ConversationServiceImpl] Migration integrity check failed: message counts do not match.', {
          source: sourceMsgs.total,
          new: newMsgs.total,
        });
      }
    }

    return conv;
  }

  /**
   * Resolve the project's `.wayland/` knowledge AND the user's global Wayland
   * Memory store and append both to this conversation's system-rules channel, in
   * place on `params.extra`.
   *
   * Project knowledge is per-project: a no-op when the chat is not in a project,
   * the project has no workspace, or the docs are still empty boilerplate.
   *
   * Global memory (`~/.ijfw/memory/*.md`) rides the SAME seam but is injected
   * into EVERY chat, project or not (GitHub #256): drop-folder ingestion writes
   * dropped files to the global store, and without this the chat agent never saw
   * that memory and answered "not found". Both blocks are clearly attributed and
   * read from disjoint dirs, so they never double-inject the same content.
   *
   * Failures are logged and swallowed so chat creation is never blocked by IO.
   */
  private async injectProjectKnowledge(params: CreateConversationParams): Promise<void> {
    const extra = params.extra as Record<string, unknown> | undefined;
    if (!extra) return;
    const blocks: string[] = [];
    try {
      const projectId = extra.projectId as string | undefined;
      if (projectId) {
        const project = await new SqliteProjectRepository().getProject(projectId);
        const workspace = project?.workspace;
        if (workspace) {
          const block = await loadProjectKnowledgeBlock(workspace);
          if (block) blocks.push(block);
        }
      }
    } catch (err) {
      console.error('[ConversationServiceImpl] project knowledge injection failed:', err);
    }
    try {
      const memoryBlock = await loadGlobalMemoryBlock();
      if (memoryBlock) blocks.push(memoryBlock);
    } catch (err) {
      console.error('[ConversationServiceImpl] global memory injection failed:', err);
    }
    if (blocks.length === 0) return;
    const merge = (existing: unknown): string =>
      [existing as string | undefined, ...blocks].filter(Boolean).join('\n\n---\n\n');
    // gemini + wcore read presetRules; acp reads presetContext. Set both so the
    // active backend picks it up; the others harmlessly ignore the unused field.
    extra.presetRules = merge(extra.presetRules);
    extra.presetContext = merge(extra.presetContext);
  }

  /**
   * #30 NO-DRIFT: a chat created inside a project (extra.projectId) is pinned to
   * its project workspace before the agent factory runs, so it never drifts to a
   * throwaway `*-temp-*` dir. Delegates to the shared enforcer (also run at spawn
   * time for resumed/migrated rows). A user-chosen custom workspace is never
   * overwritten; if the project has no workspace the temp fallback still applies.
   */
  private async reconcileProjectWorkspace(params: CreateConversationParams): Promise<void> {
    await enforceProjectWorkspace(params.extra as Record<string, unknown> | undefined);
  }

  async createConversation(params: CreateConversationParams): Promise<TChatConversation> {
    let conversation: TChatConversation;

    // Resolve the project workspace before the factory runs, so a project chat
    // never drifts to a temporary workspace (#30).
    await this.reconcileProjectWorkspace(params);

    // Project knowledge auto-injection. When a chat is created inside a project
    // (extra.projectId), append that project's substantive .wayland/ knowledge to
    // THIS conversation's system-rules channel. Per-conversation, never global,
    // so it can never leak into non-project chats. Covers gemini + wcore
    // (presetRules) and acp/Claude Code/Codex/Qwen (presetContext); backends with
    // no system-rules channel (openclaw/nanobot/remote) are a documented follow-up.
    await this.injectProjectKnowledge(params);

    switch (params.type) {
      case 'gemini': {
        conversation = await createGeminiAgent(
          params.model,
          params.extra.workspace,
          params.extra.defaultFiles as string[] | undefined,
          params.extra.webSearchEngine,
          params.extra.customWorkspace,
          params.extra.contextFileName,
          params.extra.presetRules,
          params.extra.enabledSkills as string[] | undefined,
          params.extra.presetAssistantId,
          params.extra.sessionMode,
          params.extra.isHealthCheck,
          params.extra.extraSkillPaths as string[] | undefined,
          params.extra.excludeBuiltinSkills as string[] | undefined
        );
        break;
      }
      case 'acp': {
        conversation = await createAcpAgent(params as any);
        break;
      }
      case 'openclaw-gateway': {
        conversation = await createOpenClawAgent(params as any);
        break;
      }
      case 'nanobot': {
        conversation = await createNanobotAgent(params as any);
        break;
      }
      case 'remote': {
        conversation = await createRemoteAgent(params as any);
        break;
      }
      case 'wcore': {
        conversation = await createWCoreAgent(params as any);
        break;
      }
      default: {
        throw new Error(`Invalid conversation type: ${(params as any).type}`);
      }
    }

    // Apply optional overrides without mutating the object returned by agent factories
    const overrides: Partial<TChatConversation> = {};
    if (params.id) overrides.id = params.id;
    if (params.name) overrides.name = params.name;
    if (params.source) overrides.source = params.source;
    if (params.channelChatId) overrides.channelChatId = params.channelChatId;
    // Merge extra fields from params that the factory didn't consume (e.g. cronJobId).
    // Factory-produced values take precedence; only novel keys from params.extra are added.
    if (params.extra && conversation.extra) {
      const factoryExtra = conversation.extra as Record<string, unknown>;
      for (const [key, value] of Object.entries(params.extra)) {
        if (value !== undefined && !(key in factoryExtra)) {
          factoryExtra[key] = value;
        }
      }
    }

    // The spread preserves the discriminant field (type) from `conversation`;
    // the assertion is safe because `overrides` only contains non-discriminant fields.
    const finalConversation = {
      ...conversation,
      ...overrides,
    } as TChatConversation;

    await this.repo.createConversation(finalConversation);
    return finalConversation;
  }
}
