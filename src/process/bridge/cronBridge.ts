/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { cronService } from '@process/services/cron/cronServiceSingleton';
import { writeRawCronSkillFile, hasCronSkillFile } from '@process/services/cron/cronSkillFile';
import { getDatabase } from '@process/services/database';
import type { TMessage } from '@/common/chat/chatLib';
import type { AgentBackend } from '@/common/types/acpTypes';
import { SqliteConversationRepository } from '@process/services/database/SqliteConversationRepository';

const conversationRepo = new SqliteConversationRepository();

/**
 * Initialize cron IPC bridge handlers
 */
export function initCronBridge(): void {
  // Query handlers
  ipcBridge.cron.listJobs.provider(async () => {
    return cronService.listJobs();
  });

  ipcBridge.cron.listJobsByConversation.provider(async ({ conversationId }) => {
    return cronService.listJobsByConversation(conversationId);
  });

  ipcBridge.cron.getJob.provider(async ({ jobId }) => {
    return cronService.getJob(jobId);
  });

  // CRUD handlers
  ipcBridge.cron.addJob.provider(async (params) => {
    return cronService.addJob(params);
  });

  ipcBridge.cron.updateJob.provider(async ({ jobId, updates }) => {
    return cronService.updateJob(jobId, updates);
  });

  ipcBridge.cron.removeJob.provider(async ({ jobId }) => {
    await cronService.removeJob(jobId);
  });

  ipcBridge.cron.runNow.provider(async ({ jobId }) => {
    // Create conversation (if needed) and return immediately.
    // Message sending runs in background; frontend navigates to the conversation.
    const conversationId = await cronService.runNow(jobId);
    return { conversationId };
  });

  // Skill management
  ipcBridge.cron.saveSkill.provider(async ({ jobId, content }) => {
    await writeRawCronSkillFile(jobId, content);
  });

  ipcBridge.cron.hasSkill.provider(async ({ jobId }) => {
    return hasCronSkillFile(jobId);
  });

  // v0.6.2.6 - handle accept/edit/cancel on CronProposeCard.
  // v0.6.2.6.1 cross-audit fixes (Codex C-S-01/02/03/04, C-R-02, Gemini G-R-01/02):
  //   - Authorization: verify msg.conversation_id matches IPC conversationId
  //     before any action (closes cross-conversation enumeration/hijack)
  //   - Atomic status transition: mark 'processing' BEFORE addJob so a
  //     parallel call sees non-pending and short-circuits (race fix)
  //   - Validate agentType against the AgentBackend enum (no eval-js injection)
  //   - Re-validate cron expression at accept time (defense-in-depth)
  //   - Check conversation exists before addJob (no orphan creation on
  //     delete-during-proposal)
  //   - Recover gracefully from "already exists" error post app-crash:
  //     fetch the existing job + sync card to accepted state
  //   - Prompt length cap
  ipcBridge.cron.confirmProposal.provider(async ({ conversationId, msgId, action }) => {
    const db = await getDatabase();
    const lookup = db.getMessageByMsgId(conversationId, msgId, 'cron_propose');
    if (!lookup.success || !lookup.data) {
      return { ok: false, reason: 'message_not_found' };
    }
    const msg = lookup.data as TMessage;
    if (msg.type !== 'cron_propose') {
      return { ok: false, reason: 'wrong_message_type' };
    }
    // Authorization: even though getMessageByMsgId already scopes by
    // conversationId, double-check the stored row's conversation_id matches
    // what the renderer claimed. Belt-and-suspenders against any DB layer
    // that might return cross-scope hits, and explicit at the trust boundary.
    if (msg.conversation_id !== conversationId) {
      return { ok: false, reason: 'unauthorized' };
    }
    const content = msg.content as {
      name: string;
      schedule: string;
      scheduleDescription: string;
      prompt: string;
      parseError: boolean;
      status: 'pending' | 'processing' | 'accepted' | 'cancelled';
      agentType?: string;
      cronJobId?: string;
    };
    if (content.status !== 'pending') {
      return { ok: false, reason: 'already_resolved' };
    }

    if (action === 'cancel') {
      const updated: TMessage = { ...msg, content: { ...content, status: 'cancelled' } };
      db.updateMessage(msg.id, updated);
      ipcBridge.conversation.responseStream.emit({
        type: 'cron_propose',
        conversation_id: msg.conversation_id,
        msg_id: msg.msg_id || msg.id,
        data: updated.content,
      });
      return { ok: true };
    }

    if (action === 'edit') {
      // Don't change status - user may cancel out of the modal and re-engage.
      const conversation = await conversationRepo.getConversation(msg.conversation_id);
      return {
        ok: true,
        editPayload: {
          conversationId: msg.conversation_id,
          conversationTitle: conversation?.name,
          agentType: content.agentType,
          initialName: content.name,
          initialPrompt: content.prompt,
          initialSchedule: content.schedule,
          initialScheduleDescription: content.scheduleDescription,
        },
      };
    }

    // action === 'accept' - only path that actually creates the cron
    if (content.parseError) {
      return { ok: false, reason: 'parse_error_cannot_accept' };
    }
    // Prompt length validation (C-S-05) - protect addJob + DB from runaway payloads
    if (!content.prompt || content.prompt.length > 100_000) {
      return { ok: false, reason: 'prompt_invalid_length' };
    }
    // Re-validate cron expression (C-S-04 defense-in-depth)
    try {
      const { Cron } = await import('croner');
      new Cron(content.schedule, { paused: true });
    } catch {
      return { ok: false, reason: 'cron_expr_validation_failed' };
    }
    // Atomically transition to 'processing' so a parallel accept call
    // (rapid double-click race per G-R-01) sees non-pending and short-circuits
    // at the status guard above.
    const processingMsg: TMessage = {
      ...msg,
      content: { ...content, status: 'processing' },
    };
    db.updateMessage(msg.id, processingMsg);

    const conversation = await conversationRepo.getConversation(msg.conversation_id);
    if (!conversation) {
      // Conversation deleted between propose and accept (C-R-02) - revert
      // status so a recreated source chat could re-engage; surface error.
      db.updateMessage(msg.id, msg);
      return { ok: false, reason: 'conversation_deleted' };
    }

    // Validate agentType against the AgentBackend enum (C-S-02). The accepted
    // backends list must stay in sync with `AgentBackend` in acpTypes.
    const VALID_BACKENDS: ReadonlyArray<string> = ['claude', 'codex', 'gemini', 'wcore', 'qwen', 'kimi'];
    const resolvedAgentType: AgentBackend = (() => {
      if (content.agentType && VALID_BACKENDS.includes(content.agentType)) {
        return content.agentType as AgentBackend;
      }
      const type = conversation?.type;
      if (type === 'gemini') return 'gemini';
      if (type === 'wcore') return 'wcore' as AgentBackend;
      const extraBackend = (conversation?.extra as { backend?: string } | undefined)?.backend;
      return (extraBackend && VALID_BACKENDS.includes(extraBackend) ? extraBackend : 'claude') as AgentBackend;
    })();

    let job: Awaited<ReturnType<typeof cronService.addJob>>;
    try {
      job = await cronService.addJob({
        name: content.name,
        description: undefined,
        schedule: { kind: 'cron', expr: content.schedule, description: content.scheduleDescription },
        prompt: content.prompt,
        conversationId: msg.conversation_id,
        conversationTitle: conversation.name,
        agentType: resolvedAgentType,
        createdBy: 'agent',
        executionMode: 'existing',
      });
    } catch (err) {
      // App-crash recovery (G-R-02) - if a previous accept run created the
      // job then crashed before updating the card to 'accepted', this retry
      // sees "already exists" from the one-cron-per-conversation guard. Find
      // the existing job and treat as successful accept.
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('alreadyExists') || errMsg.toLowerCase().includes('already exists')) {
        const existingJobs = await cronService.listJobsByConversation(msg.conversation_id);
        if (existingJobs.length > 0) {
          const existing = existingJobs[0];
          const synced: TMessage = {
            ...msg,
            content: { ...content, status: 'accepted', cronJobId: existing.id },
          };
          db.updateMessage(msg.id, synced);
          ipcBridge.conversation.responseStream.emit({
            type: 'cron_propose',
            conversation_id: msg.conversation_id,
            msg_id: msg.msg_id || msg.id,
            data: synced.content,
          });
          return { ok: true, jobId: existing.id };
        }
      }
      // Revert status so user can retry once the underlying issue resolves
      db.updateMessage(msg.id, msg);
      throw err;
    }

    const updated: TMessage = { ...msg, content: { ...content, status: 'accepted', cronJobId: job.id } };
    db.updateMessage(msg.id, updated);
    ipcBridge.conversation.responseStream.emit({
      type: 'cron_propose',
      conversation_id: msg.conversation_id,
      msg_id: msg.msg_id || msg.id,
      data: updated.content,
    });
    return { ok: true, jobId: job.id };
  });
}
