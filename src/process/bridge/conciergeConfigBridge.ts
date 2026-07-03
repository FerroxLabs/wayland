/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Concierge Phase 2b apply bridge (MAIN process).
 *
 * Handles Accept/Edit/Cancel on a ConciergeConfigCard (rendered when the agent
 * emits a [CONCIERGE_PROPOSE] block). Mirrors the battle-tested cron
 * propose/confirm/apply flow (`cronBridge.ts`) for its security guards:
 *   - Authorization: the stored message's conversation_id must equal the IPC
 *     conversationId (closes cross-conversation enumeration/hijack).
 *   - Status guard: only a `pending` proposal is actionable.
 *   - Atomic `processing` transition BEFORE the side effect, so a double-click
 *     race sees non-pending and short-circuits; reverted to `error` on failure.
 *   - Pre-accept validation returns a machine reason with NO state change.
 *
 * HARD INVARIANT: no write path runs unless `action === 'accept'` AND the
 * proposal was `pending`. Secrets (provider API keys) arrive only via the
 * in-process `secret` param, are used once, and are never logged or stored.
 */

import { ipcBridge } from '@/common';
import { getDatabase } from '@process/services/database';
import { ProcessConfig } from '@process/utils/initStorage';
import { connectModelRegistryProvider } from '@process/providers/ipc/modelRegistryIpc';
import type { ProviderId } from '@process/providers/types';
import { writeAssistantRules } from './fsBridge';
import { uuid } from '@/common/utils';
import type { TMessage } from '@/common/chat/chatLib';
import type { IMcpServer } from '@/common/config/storage';
import {
  type IConciergeConfigContent,
  type ConciergeConfirmResult,
  CONCIERGE_RULES_MAX_CHARS,
} from '@/common/chat/conciergeConfig';

/**
 * Self-hosted / "bring your own endpoint" providers: these have NO fixed
 * canonical endpoint, so a base URL is REQUIRED to reach them and a
 * model-proposed value is the legitimate way to set it. Every other provider
 * (`openai`, `anthropic`, ... and the models.dev catalog ids) resolves to a
 * fixed endpoint, so a MODEL-controlled base URL there is a key-exfiltration
 * vector: a prompt-injected propose of `provider: openai, base_url: https://evil.com`
 * would send the user's real OpenAI key to the attacker. For fixed-endpoint
 * providers we honor ONLY a base URL the USER explicitly typed into the card.
 */
const SELF_HOSTED_PROVIDER_IDS: ReadonlySet<ProviderId> = new Set<ProviderId>(['openai-compatible', 'ollama-local']);

/**
 * Apply a confirmed proposal via the real MAIN-process write paths. Returns a
 * human-readable result summary, or throws on failure (the caller reverts the
 * card to an error state). `secret` is provided only for provider_connect.
 */
async function applyProposal(
  content: IConciergeConfigContent,
  secret?: { apiKey?: string; baseUrl?: string }
): Promise<string> {
  switch (content.kind) {
    case 'provider_connect': {
      const apiKey = secret?.apiKey;
      // Defensive: the caller pre-checks this, so reaching here without a key is
      // a programming error rather than a user-facing path.
      if (!apiKey) throw new Error('missing api key');
      // Trust the model-proposed base URL ONLY for self-hosted/custom providers
      // (no fixed endpoint). For known fixed-endpoint providers, ignore
      // content.baseUrl entirely and honor only a USER-typed override.
      const providerId = content.providerId as ProviderId;
      const baseUrl = SELF_HOSTED_PROVIDER_IDS.has(providerId) ? (secret?.baseUrl ?? content.baseUrl) : secret?.baseUrl;
      const result = await connectModelRegistryProvider(providerId, {
        key: apiKey,
        baseUrl,
      });
      if (!result.ok) {
        throw new Error(
          result.error ? `Could not connect ${content.label}: ${result.error}` : `Could not connect ${content.label}`
        );
      }
      return result.warning ? `Connected ${content.label} (note: ${result.warning}).` : `Connected ${content.label}.`;
    }
    case 'set_default_model': {
      if (content.engine === 'wcore') {
        await ProcessConfig.set('wcore.defaultModel', { id: content.modelId, useModel: content.useModel });
      } else {
        await ProcessConfig.set('gemini.defaultModel', { id: content.modelId, useModel: content.useModel });
      }
      return `Set ${content.engine} default model to ${content.label}.`;
    }
    case 'add_mcp': {
      const existing = (await ProcessConfig.get('mcp.config').catch(() => [] as IMcpServer[])) ?? [];
      const list = Array.isArray(existing) ? (existing as IMcpServer[]) : [];
      const now = Date.now();
      const server: IMcpServer = {
        id: uuid(),
        name: content.name,
        enabled: true,
        transport: {
          type: 'stdio',
          command: content.command,
          args: content.args,
          ...(content.env ? { env: content.env } : {}),
        },
        createdAt: now,
        updatedAt: now,
        originalJson: JSON.stringify(
          {
            [content.name]: {
              command: content.command,
              args: content.args,
              ...(content.env ? { env: content.env } : {}),
            },
          },
          null,
          2
        ),
        source: 'custom',
      };
      await ProcessConfig.set('mcp.config', [...list, server]);
      return `Added MCP server "${content.name}".`;
    }
    case 'edit_assistant': {
      const ok = await writeAssistantRules(content.assistantId, content.rules, 'en-US');
      if (!ok) throw new Error(`Could not update ${content.label} instructions`);
      return `Updated ${content.label} instructions.`;
    }
    case 'file_bug_report': {
      // Non-mutating (#464): the renderer card runs the capture → clipboard → open
      // flow (ipcBridge.application.captureBugReport) on accept. MAIN just records
      // the acceptance so the card transitions and the action is auditable. The open
      // result is not observable here (shell.openExternal does not report back), so
      // the summary is action-oriented rather than asserting the browser opened.
      return 'Bug report prepared — finish and submit it in your browser.';
    }
  }
}

/** Initialize the Concierge config IPC bridge handler. */
export function initConciergeConfigBridge(): void {
  ipcBridge.conciergeConfig.confirmProposal.provider(
    async ({ conversationId, msgId, action, secret }): Promise<ConciergeConfirmResult> => {
      const db = await getDatabase();
      const lookup = db.getMessageByMsgId(conversationId, msgId, 'concierge_propose');
      if (!lookup.success || !lookup.data) {
        return { ok: false, reason: 'message_not_found' };
      }
      const msg = lookup.data as TMessage;
      if (msg.type !== 'concierge_propose') {
        return { ok: false, reason: 'wrong_message_type' };
      }
      // Authorization at the trust boundary (belt-and-suspenders with the scoped lookup).
      if (msg.conversation_id !== conversationId) {
        return { ok: false, reason: 'unauthorized' };
      }
      const content = msg.content as IConciergeConfigContent;
      if (content.status !== 'pending') {
        return { ok: false, reason: 'already_resolved' };
      }

      const emit = (data: IConciergeConfigContent): void => {
        ipcBridge.conversation.responseStream.emit({
          type: 'concierge_propose',
          conversation_id: msg.conversation_id,
          msg_id: msg.msg_id || msg.id,
          data,
        });
      };

      if (action === 'cancel') {
        const updated: TMessage = { ...msg, content: { ...content, status: 'cancelled' } };
        db.updateMessage(msg.id, updated);
        emit(updated.content as IConciergeConfigContent);
        return { ok: true };
      }

      // action === 'accept' - the ONLY path that mutates config.
      // Pre-accept validation: return a reason WITHOUT any state change or write.
      if (content.kind === 'provider_connect' && !secret?.apiKey) {
        return { ok: false, reason: 'secret_required' };
      }
      if (content.kind === 'edit_assistant' && content.rules.length > CONCIERGE_RULES_MAX_CHARS) {
        return { ok: false, reason: 'rules_too_long' };
      }
      if (content.kind === 'add_mcp') {
        const existing = (await ProcessConfig.get('mcp.config').catch(() => [] as IMcpServer[])) ?? [];
        const list = Array.isArray(existing) ? (existing as IMcpServer[]) : [];
        if (list.some((s) => s?.name === content.name)) {
          return { ok: false, reason: 'mcp_name_exists' };
        }
      }

      // Atomic transition to 'processing' so a parallel accept short-circuits at
      // the status guard above (rapid double-click race).
      const processing: TMessage = { ...msg, content: { ...content, status: 'processing' } };
      db.updateMessage(msg.id, processing);
      emit(processing.content as IConciergeConfigContent);

      try {
        const summary = await applyProposal(content, secret);
        const accepted: TMessage = { ...msg, content: { ...content, status: 'accepted', resultSummary: summary } };
        db.updateMessage(msg.id, accepted);
        emit(accepted.content as IConciergeConfigContent);
        return { ok: true, summary };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Revert to 'pending' (mirror cronBridge) so the card's buttons return and
        // the user can retry - the most common failure (a wrong provider key) is
        // recoverable in-place. The renderer surfaces the error as a toast.
        db.updateMessage(msg.id, msg);
        emit(content);
        return { ok: false, reason: message };
      }
    }
  );
}
