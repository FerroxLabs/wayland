/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import { ipcBridge } from '@/common';
import type { AgentBackend } from '@/common/types/acpTypes';
import { uuid } from '@/common/utils';
import { cronService } from '@process/services/cron/cronServiceSingleton';
import { detectCronCommands, stripCronCommands, type CronCommand } from './CronCommandDetector';
import { addMessage } from '@process/utils/message';
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
  } catch {
    // Silently handle errors
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
