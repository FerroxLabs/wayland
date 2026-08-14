/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import type { TMessage } from '@/common/chat/chatLib';
import { ipcBridge } from '@/common';
import type { AgentBackend } from '@/common/types/acpTypes';
import { uuid } from '@/common/utils';
import { cronService } from '@process/services/cron/cronServiceSingleton';
import { detectCronCommands, hasCronCommands, stripCronCommands, type CronCommand } from './CronCommandDetector';
import { detectConciergeProposals, hasConciergeProposals, stripConciergeProposals } from './ConciergeProposeDetector';
import type { ConciergeProposal } from '@/common/chat/conciergeConfig';
import { addMessage, flushConversationMessages } from '@process/utils/message';
import { hasThinkTags, stripThinkTags } from './ThinkTagDetector';

/**
 * Result of processing an agent response
 */
export interface ProcessResult {
  /** Original message - save to database */
  message: TMessage;
  /** Cleaned message with cron commands stripped - emit to UI */
  displayMessage?: TMessage;
  /** System response messages to append after agent response */
  systemResponses: string[];
}

/**
 * Process agent response before emitting to UI
 *
 * This middleware:
 * 1. Strips think tags from messages (e.g., <think>...</think>)
 * 2. Detects cron commands in completed messages
 * 3. Executes detected commands (create/list/delete jobs)
 * 4. Returns cleaned message for UI display
 *
 * @param conversationId - The conversation ID
 * @param agentType - The agent type (gemini, claude, codex, etc.)
 * @param message - The message to process
 * @returns ProcessResult with original message, display message, and system responses
 */
export async function processAgentResponse(
  conversationId: string,
  agentType: AgentBackend,
  message: TMessage
): Promise<ProcessResult> {
  const systemResponses: string[] = [];

  // Only process completed messages
  // Skip if message is still streaming or pending
  if (message.status !== 'finish') {
    return { message, systemResponses };
  }

  // Extract text content from message
  const textContent = extractTextContent(message);
  if (!textContent) {
    return { message, systemResponses };
  }

  let displayContent = textContent;
  let needsDisplayMessage = false;

  // Strip think tags first (internal reasoning tags from models like MiniMax, DeepSeek, etc.)
  if (hasThinkTags(displayContent)) {
    displayContent = stripThinkTags(displayContent);
    needsDisplayMessage = true;
  }

  // Detect cron commands
  const cronCommands = detectCronCommands(displayContent);
  if (cronCommands.length > 0) {
    // Handle detected commands
    const responses = await handleCronCommands(conversationId, agentType, cronCommands);
    systemResponses.push(...responses);

    // Strip cron commands from display
    displayContent = stripCronCommands(displayContent);
    needsDisplayMessage = true;
  }

  // Concierge Phase 2b - detect [CONCIERGE_PROPOSE] config-change blocks and
  // render an inline confirmation card (concierge_propose message). No config
  // is mutated here; the change applies only when the user accepts the card
  // (conciergeConfigBridge.confirmProposal).
  if (hasConciergeProposals(displayContent)) {
    const conciergeProposals = detectConciergeProposals(displayContent);
    if (conciergeProposals.length > 0) {
      await handleConciergeProposals(conversationId, agentType, conciergeProposals);
    }
    // Always strip the raw block - even when it was malformed and produced no
    // card - so the [CONCIERGE_PROPOSE] tag never leaks verbatim into chat.
    displayContent = stripConciergeProposals(displayContent);
    needsDisplayMessage = true;
  }

  // Return cleaned message if any processing was done
  if (needsDisplayMessage) {
    const displayMessage = createDisplayMessage(message, displayContent);
    return {
      message, // Original for database
      displayMessage, // Cleaned for UI
      systemResponses,
    };
  }

  return { message, systemResponses };
}

/**
 * Extract text content from a TMessage for cron command detection
 * Exported for use by AgentManagers
 *
 * @param message - The message to extract text from
 * @returns The text content or empty string if not found
 */
export function extractTextFromMessage(message: TMessage): string {
  if (!message.content) {
    return '';
  }

  // Handle direct string content
  if (typeof message.content === 'string') {
    return message.content;
  }

  // Handle object content with 'content' property (most common case)
  if (typeof message.content === 'object' && 'content' in message.content) {
    const contentObj = message.content as { content?: string };
    return contentObj.content ?? '';
  }

  return '';
}

/**
 * Extract text content from a message (internal use)
 * Returns null for empty content to distinguish from empty string
 */
function extractTextContent(message: TMessage): string | null {
  const text = extractTextFromMessage(message);
  return text || null;
}

/**
 * Create a display message with modified content
 * Only modifies messages with { content: string } structure
 */
function createDisplayMessage(original: TMessage, newContent: string): TMessage {
  const content = original.content;

  // Only handle the common case: content is { content: string }
  if (typeof content === 'object' && content !== null && 'content' in content) {
    const contentObj = content as { content: string };
    if (typeof contentObj.content === 'string') {
      // Use type assertion to avoid complex union type issues
      const newContentObj = { ...content, content: newContent };
      return {
        ...original,
        content: newContentObj,
      } as TMessage;
    }
  }

  // For other content types, return original unchanged
  return original;
}

/**
 * Process cron commands in a message and emit system responses
 * This is a high-level helper that combines detection, processing, and emitting
 *
 * Usage in AgentManagers:
 * ```typescript
 * if (tMessage.status === 'finish' && hasCronCommands(extractTextFromMessage(tMessage))) {
 *   await processCronInMessage(conversationId, agentType, tMessage, (msg) => {
 *     ipcBridge.xxxConversation.responseStream.emit({ type: 'system', ... });
 *   });
 * }
 * ```
 *
 * @param conversationId - The conversation ID
 * @param agentType - The agent type
 * @param message - The completed message to check for cron commands
 * @param emitSystemResponse - Callback to emit system response messages
 */
export async function processCronInMessage(
  conversationId: string,
  agentType: AgentBackend,
  message: TMessage,
  emitSystemResponse: (response: string) => void
): Promise<void> {
  try {
    const result = await processAgentResponse(conversationId, agentType, message);

    // Emit system responses through the provided callback
    for (const sysMsg of result.systemResponses) {
      emitSystemResponse(sysMsg);
    }

    // Leak fix: the manager already streamed + persisted the RAW turn text, so a
    // [CONCIERGE_PROPOSE] or [CRON_PROPOSE] block leaks verbatim into the chat
    // bubble (above the confirmation card). processAgentResponse built a stripped
    // displayMessage that was previously discarded; persist it over the raw row
    // so the saved + reloaded message shows only the friendly prose. The card
    // still renders from the separate propose message created above.
    //
    // Cron was left out when this was first written for Concierge, so every
    // scheduling turn showed the user the raw [CRON_PROPOSE] markup. Both block
    // types take the same path now.
    const turnText = extractTextFromMessage(message);
    if (hasConciergeProposals(turnText) || hasCronCommands(turnText)) {
      await persistStrippedTurnText(conversationId, message, result.displayMessage);
    }
  } catch {
    // Silently handle errors
  }
}

/**
 * Overwrite the persisted assistant text row with the cleaned (block-stripped)
 * content. This is a REPLACE, not an append: the message queue (addOrUpdateMessage)
 * only ever appends streaming text deltas by msg_id, so writing the cleaned full
 * text through it would double the content. We go straight to the DB's
 * getMessageByMsgId + updateMessage replace path (the same primitive the streaming
 * buffer uses) to swap the stored content in place.
 *
 * Drains the conversation's write queue before reading, so the raw turn text is
 * genuinely on disk and no queued delta lands afterwards to re-dirty the row.
 * This used to rely on processAgentResponse having forced a synchronous flush
 * via addMessage — but that only happens on the concierge 'propose' path, so
 * every cron branch read a row that was still sitting in the debounce queue.
 *
 * The DB write alone is not enough. The renderer has ALREADY drawn the raw markup
 * from the stream, and nothing re-reads the row until the conversation is
 * reloaded — so for the person actually watching the turn land, the block stayed
 * on screen. The `replaceContent` broadcast below swaps the live bubble too;
 * without it this fix only works for people who scroll away and come back.
 *
 * Best-effort: a failed cleanup must never break the agent turn.
 */
async function persistStrippedTurnText(
  conversationId: string,
  original: TMessage,
  displayMessage: TMessage | undefined
): Promise<void> {
  if (!displayMessage) return;
  const msgId = original.msg_id || original.id;
  if (!msgId) return;
  const cleaned = extractTextFromMessage(displayMessage);
  if (typeof cleaned !== 'string') return;

  try {
    // Drain the write queue FIRST. Streaming deltas sit behind a 2000 ms
    // debounce, and this function reads the row directly rather than through
    // that queue, so it was racing them in both directions:
    //
    //   - The row may not be on disk yet. The docstring above assumed an
    //     addMessage had already forced a synchronous flush, but that only
    //     happens on the concierge 'propose' path - the [CRON_LIST] /
    //     [CRON_CREATE] / [CRON_UPDATE] branches and a zero-proposal
    //     [CONCIERGE_PROPOSE] enqueue nothing. With no row, the position guard
    //     below correctly refuses, we return silently, and ~2s later the queue
    //     writes the RAW text - so the markup this function exists to remove
    //     stayed on screen and in the database permanently.
    //
    //   - Or the row holds only a PREFIX (an earlier debounce fired mid-turn).
    //     We would replace it with the cleaned full text, then the queued tail
    //     deltas would flush and APPEND to that, duplicating the tail prose and
    //     resurrecting the closing marker.
    //
    // Draining first makes the docstring's assumption true instead of assumed.
    await flushConversationMessages(conversationId);

    const { getDatabase } = await import('@process/services/database/export');
    const db = await getDatabase();
    const existing = db.getMessageByMsgId(conversationId, msgId, 'text');
    if (!existing.success || !existing.data) return;
    const row = existing.data;

    // Only ever overwrite the ASSISTANT's row.
    //
    // A msg_id names the TURN, not a message: WCore stamps the same one on the
    // user's right-side prompt AND the left-side reply. getMessageByMsgId filters
    // on conversation + msg_id + type and takes the newest, with no `position`
    // clause — so if the assistant row is not on disk at this instant, the only
    // matching text row is the USER'S PROMPT, and we would replace what they
    // typed with the model's answer. That is unrecoverable, and this repo has
    // shipped exactly that bug once before (the wcore reply overwriting the user's
    // message). Cheap guard, permanent damage if it is missing.
    if (row.position !== 'left') return;

    const updated = {
      ...row,
      content: { ...(row.content as Record<string, unknown>), content: cleaned },
    } as TMessage;
    const written = db.updateMessage(row.id, updated);

    // Do not tell the renderer the text is clean if the row still holds the raw
    // markup: the bubble would look fixed until reload, then leak again.
    if (written && written.success === false) return;

    ipcBridge.conversation.responseStream.emit({
      type: 'content_replace',
      conversation_id: conversationId,
      msg_id: msgId,
      data: { content: cleaned },
    });
  } catch {
    // best-effort
  }
}

/**
 * Concierge Phase 2b - turn detected [CONCIERGE_PROPOSE] blocks into inline
 * confirmation cards (concierge_propose messages). NO config is mutated here:
 * the card is the consent surface, and the change applies only when the user
 * accepts (conciergeConfigBridge.confirmProposal). The proposal carries no
 * secret (provider keys are entered in the card), so it is safe to persist +
 * broadcast.
 */
async function handleConciergeProposals(
  conversationId: string,
  agentType: AgentBackend,
  proposals: ConciergeProposal[]
): Promise<void> {
  for (const proposal of proposals) {
    try {
      const proposalMsgId = uuid();
      const proposalContent = { ...proposal, status: 'pending' as const, agentType };
      const proposalMessage: TMessage = {
        id: proposalMsgId,
        msg_id: proposalMsgId,
        conversation_id: conversationId,
        type: 'concierge_propose',
        position: 'left',
        content: proposalContent,
        createdAt: Date.now(),
        status: 'finish',
      };
      await addMessage(conversationId, proposalMessage);
      ipcBridge.conversation.responseStream.emit({
        type: 'concierge_propose',
        conversation_id: conversationId,
        msg_id: proposalMsgId,
        data: proposalContent,
      });
    } catch {
      // Best-effort: a failed card creation must not break the agent turn.
    }
  }
}

/**
 * Handle detected cron commands
 */
async function handleCronCommands(
  conversationId: string,
  agentType: AgentBackend,
  commands: CronCommand[]
): Promise<string[]> {
  const responses: string[] = [];

  for (const cmd of commands) {
    try {
      switch (cmd.kind) {
        case 'create': {
          // v0.6.2.6.1 (Gemini G-S-01 fix) - block agent-emitted CREATE
          // because it bypasses the [CRON_PROPOSE] confirmation card.
          // CREATE is retained in the detector for legacy/skill-driven
          // programmatic paths (Standing Company rituals etc.) but
          // agent-side emission should always route through PROPOSE so
          // the user sees + approves. Tell the user what happened so they
          // can re-prompt the agent.
          responses.push(
            `⚠️ The agent tried to create a scheduled task directly. For your safety, use the proposal flow: ask the agent to "schedule this with a confirmation card" so you can review before it's created.`
          );
          break;
        }

        case 'propose': {
          // v0.6.2.6 - agent proposes a cron via [CRON_PROPOSE]; we render
          // an inline confirmation card in the chat. The user must click
          // Yes/Edit/Cancel before any cron row is created. No DB write
          // to cron_jobs here - that only happens in cronBridge.confirmProposal
          // when the user accepts.
          let parseError = false;
          try {
            // v0.6.2.6.1 (Gemini G-S-03 fix) - validate cron syntax AND
            // enforce a 5-minute minimum interval so an agent (or
            // hallucinated proposal) can't propose `* * * * *` and burn
            // tokens / hit rate limits. Manual /scheduled + New Task path
            // is unaffected because it doesn't flow through here.
            const { Cron } = await import('croner');
            const parsed = new Cron(cmd.schedule, { paused: true });
            const now = new Date();
            const next1 = parsed.nextRun(now);
            const next2 = next1 ? parsed.nextRun(next1) : null;
            if (next1 && next2) {
              const intervalMs = next2.getTime() - next1.getTime();
              if (intervalMs < 5 * 60 * 1000) {
                // Reject high-frequency proposals - surface as parseError so
                // the card disables Yes button + user can Edit to fix manually
                parseError = true;
              }
            }
          } catch {
            parseError = true;
          }
          const proposalMsgId = uuid();
          const proposalContent = {
            name: cmd.name,
            schedule: cmd.schedule,
            scheduleDescription: cmd.scheduleDescription,
            prompt: cmd.prompt,
            parseError,
            status: 'pending' as const,
            agentType,
          };
          const proposalMessage: TMessage = {
            id: proposalMsgId,
            msg_id: proposalMsgId,
            conversation_id: conversationId,
            type: 'cron_propose',
            position: 'left',
            content: proposalContent,
            createdAt: Date.now(),
            status: 'finish',
          };
          await addMessage(conversationId, proposalMessage);
          ipcBridge.conversation.responseStream.emit({
            type: 'cron_propose',
            conversation_id: conversationId,
            msg_id: proposalMsgId,
            data: proposalContent,
          });
          // Don't push a user-visible "responses" line - the card itself
          // is the response surface and clutter-free is the goal.
          break;
        }

        case 'list': {
          const jobs = await cronService.listJobsByConversation(conversationId);
          if (jobs.length === 0) {
            responses.push('📋 No scheduled tasks in this conversation.');
          } else {
            const jobList = jobs
              .map((j) => {
                const scheduleStr = j.schedule.kind === 'cron' ? j.schedule.expr : j.schedule.kind;
                const status = j.enabled ? '✓' : '✗';
                return `- [${status}] ${j.name} (${scheduleStr}) - ID: ${j.id}`;
              })
              .join('\n');
            responses.push(`📋 Scheduled tasks:\n${jobList}`);
          }
          break;
        }

        case 'update': {
          const existingJob = await cronService.getJob(cmd.jobId);
          if (!existingJob) {
            responses.push(`❌ Task not found: ${cmd.jobId}`);
            break;
          }
          // v0.6.2.6.1 (Gemini G-S-02 fix) - reject cross-conversation
          // updates. An agent in conversation B seeing a job ID from
          // conversation A's CRON_LIST output should NOT be able to
          // update Project A's task. If the job's source conversation
          // doesn't match this one, refuse.
          if (existingJob.metadata.conversationId && existingJob.metadata.conversationId !== conversationId) {
            responses.push(
              `❌ Can't update task "${existingJob.name}" - it belongs to a different conversation. Switch to that chat to make changes.`
            );
            break;
          }
          const updated = await cronService.updateJob(cmd.jobId, {
            name: cmd.name,
            schedule: { kind: 'cron', expr: cmd.schedule, description: cmd.scheduleDescription },
            target: {
              ...existingJob.target,
              payload: { kind: 'message', text: cmd.message },
            },
          });
          ipcBridge.cron.onJobUpdated.emit(updated);
          responses.push(`✅ Scheduled task updated: "${updated.name}" (ID: ${updated.id})`);
          break;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      responses.push(`❌ Error: ${errorMsg}`);
    }
  }

  return responses;
}
