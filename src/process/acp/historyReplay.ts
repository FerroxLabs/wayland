/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * History replay - self-healing for ACP wrapper bumps.
 *
 * When a wrapper version (e.g. `@agentclientprotocol/claude-agent-acp`) changes
 * between sessions, the old `acpSessionId` may still be accepted by `loadSession`
 * but the agent's restored context is corrupt and tool calls stall. To recover
 * transparently, we discard the stale session, create a fresh one, and prepend
 * a textual summary of the prior conversation so the agent can pick up where it
 * left off without the user noticing.
 *
 * This module is read-only: it builds the prepended text block from the
 * persisted messages table; the actual prompt-prepending happens in
 * AcpAgentV2.sendMessage.
 */

import type { TMessage } from '@/common/chat/chatLib';
import { SqliteConversationRepository } from '@process/services/database/SqliteConversationRepository';

/** Maximum total chars in a replay block before we drop middle turns. */
const REPLAY_BUDGET_CHARS = 6000;
/** Per-line cap for any tool call / tool result / raw content snippet. */
const PER_LINE_CHAR_CAP = 500;
/** Default number of trailing messages to consider for replay. */
const DEFAULT_LIMIT = 20;

const repo = new SqliteConversationRepository();

/**
 * Build a textual replay block for `conversationId`, formatted as a sequence of
 * turn lines wrapped in `[BEGIN CONVERSATION HISTORY]` / `[END CONVERSATION HISTORY]`
 * sentinels. Returns `null` when there is nothing meaningful to replay.
 */
export async function buildHistoryReplayContext(
  conversationId: string,
  limitN: number = DEFAULT_LIMIT
): Promise<string | null> {
  const recent = await fetchRecentMessages(conversationId, limitN);
  if (recent.length === 0) return null;

  const lines = recent.map(formatMessage).filter((s): s is string => Boolean(s));
  if (lines.length === 0) return null;

  const trimmed = fitToBudget(lines);
  return wrapReplayBlock(trimmed);
}

async function fetchRecentMessages(conversationId: string, limitN: number): Promise<TMessage[]> {
  // page=0 + DESC = the last `limitN` messages in reverse chronological order;
  // reverse client-side to get chronological for the replay narrative.
  const result = await repo.getMessages(conversationId, 0, limitN, 'DESC');
  return [...result.data].toReversed();
}

function formatMessage(msg: TMessage): string | null {
  switch (msg.type) {
    case 'text': {
      const content = clip(msg.content.content, PER_LINE_CHAR_CAP);
      if (!content) return null;
      const role = msg.position === 'right' ? 'user' : 'assistant';
      return `[${role}]: ${content}`;
    }

    case 'thinking': {
      const subject = msg.content.subject ?? msg.content.content.split('\n')[0] ?? '';
      const head = clip(subject.trim(), 200);
      return head ? `[assistant thought: ${head}]` : null;
    }

    case 'acp_tool_call': {
      const update = msg.content?.update;
      if (!update) return null;
      const title = update.title ?? 'unknown';
      const rawInput = update.rawInput ? clip(JSON.stringify(update.rawInput), 200) : '';
      const status = update.status ?? 'completed';
      return `[assistant called tool "${title}" (${status})${rawInput ? `, args: ${rawInput}` : ''}]`;
    }

    case 'codex_tool_call': {
      const c = msg.content;
      const title = c?.title ?? c?.kind ?? 'tool';
      const status = c?.status ?? 'completed';
      return `[assistant called tool "${title}" (${status})]`;
    }

    case 'tool_call': {
      const args = clip(JSON.stringify(msg.content.args ?? {}), 200);
      return `[assistant called tool "${msg.content.name}"${args === '{}' ? '' : `, args: ${args}`}]`;
    }

    case 'plan': {
      const entries = msg.content?.entries ?? [];
      if (entries.length === 0) return null;
      const head = entries
        .slice(0, 5)
        .map((e) => `${e.status}:${clip(e.content, 80)}`)
        .join('; ');
      return `[plan: ${head}${entries.length > 5 ? ` (+${entries.length - 5} more)` : ''}]`;
    }

    case 'tips': {
      const content = clip(msg.content.content, 200);
      return content ? `[${msg.content.type}: ${content}]` : null;
    }

    case 'cron_trigger':
      return `[cron triggered: ${msg.content.cronJobName}]`;

    // Noisy / non-narrative - omit from replay.
    case 'tool_group':
    case 'agent_status':
    case 'available_commands':
    case 'acp_permission':
    case 'codex_permission':
    case 'skill_suggest':
      return null;

    default:
      return null;
  }
}

/**
 * If the joined line block exceeds the budget, keep the first line (often sets
 * up the conversation goal) and as many trailing lines as fit. This preserves
 * the bookends - recent context matters most, but the opening turn often
 * carries the task framing.
 */
function fitToBudget(lines: string[]): string[] {
  const joined = lines.join('\n');
  if (joined.length <= REPLAY_BUDGET_CHARS) return lines;

  // Hard fallback: keep the most recent lines that fit within the budget.
  const tail: string[] = [];
  let used = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const len = lines[i].length + 1; // +1 for newline
    if (used + len > REPLAY_BUDGET_CHARS) break;
    tail.unshift(lines[i]);
    used += len;
  }

  // Try to also include the very first line if it fits, since opening turns
  // often establish task framing.
  if (lines.length > 0 && tail[0] !== lines[0]) {
    const firstLen = lines[0].length + 1;
    if (used + firstLen <= REPLAY_BUDGET_CHARS) {
      return [lines[0], '[... earlier turns omitted ...]', ...tail];
    }
    return ['[... earlier turns omitted ...]', ...tail];
  }

  return tail;
}

function wrapReplayBlock(lines: string[]): string {
  return [
    '[BEGIN CONVERSATION HISTORY - restored from local database after wrapper bump]',
    ...lines,
    '[END CONVERSATION HISTORY]',
    '',
  ].join('\n');
}

function clip(value: string | undefined | null, max: number): string {
  if (!value) return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max - 1).trimEnd() + '…';
}
