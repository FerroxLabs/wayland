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

  // v0.6.2.6 — handle accept/edit/cancel on CronProposeCard.
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
    const content = msg.content as {
      name: string;
      schedule: string;
      scheduleDescription: string;
      prompt: string;
      parseError: boolean;
      status: 'pending' | 'accepted' | 'cancelled';
      agentType?: string;
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
      // Don't change status — user may cancel out of the modal and re-engage.
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

    // action === 'accept' — only path that actually creates the cron
    if (content.parseError) {
      return { ok: false, reason: 'parse_error_cannot_accept' };
    }
    const conversation = await conversationRepo.getConversation(msg.conversation_id);
    const resolvedAgentType: AgentBackend = (() => {
      if (content.agentType) return content.agentType as AgentBackend;
      const type = conversation?.type;
      if (type === 'gemini') return 'gemini';
      if (type === 'wcore') return 'wcore' as AgentBackend;
      const extraBackend = (conversation?.extra as { backend?: string } | undefined)?.backend;
      return (extraBackend ?? 'claude') as AgentBackend;
    })();
    const job = await cronService.addJob({
      name: content.name,
      description: undefined,
      schedule: { kind: 'cron', expr: content.schedule, description: content.scheduleDescription },
      prompt: content.prompt,
      conversationId: msg.conversation_id,
      conversationTitle: conversation?.name,
      agentType: resolvedAgentType,
      createdBy: 'agent',
      executionMode: 'existing',
    });
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
