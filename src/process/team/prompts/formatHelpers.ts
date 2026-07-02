import type { TeamAgent, MailboxMessage } from '../types';

const MESSAGE_CHAR_LIMIT = 6000;
const TOTAL_CHAR_LIMIT = 30000;

function formatContentForPrompt(message: MailboxMessage, limit: number): string {
  const content = message.content ?? '';
  if (content.length <= limit) return content;

  const summary = message.summary?.trim();
  const prefix = summary ? `Summary: ${summary}\n\n` : '';
  const available = Math.max(0, limit - prefix.length);
  const excerpt = available > 0 ? content.slice(0, available) : '';
  return `${prefix}${excerpt}\n...[truncated ${content.length - excerpt.length} chars from mailbox message before prompt assembly]`;
}

function withTotalBudget(lines: string[], limit: number): string {
  const selected: string[] = [];
  let used = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const separator = selected.length > 0 ? 1 : 0;
    if (used + separator + line.length <= limit) {
      selected.push(line);
      used += separator + line.length;
      continue;
    }

    const remaining = Math.max(0, limit - used - separator);
    if (remaining > 120) {
      selected.push(`${line.slice(0, remaining)}\n...[truncated unread mailbox bundle before prompt assembly]`);
    }
    const omitted = lines.length - i - (remaining > 120 ? 1 : 0);
    if (omitted > 0) selected.push(`...[omitted ${omitted} additional mailbox message(s) due to prompt budget]`);
    break;
  }
  return selected.join('\n');
}

/** Format mailbox messages, resolving sender names from the agents list. */
export function formatMessages(messages: MailboxMessage[], agents: TeamAgent[]): string {
  if (messages.length === 0) return 'No unread messages.';
  const lines = messages.map((m) => {
    const filesNote = m.files?.length ? `\nFiles: ${m.files.join(', ')}` : '';
    const content = formatContentForPrompt(m, MESSAGE_CHAR_LIMIT);
    if (m.fromAgentId === 'user') return `[From User] ${content}${filesNote}`;
    const sender = agents.find((a) => a.slotId === m.fromAgentId);
    return `[From ${sender?.agentName ?? m.fromAgentId}] ${content}${filesNote}`;
  });
  return withTotalBudget(lines, TOTAL_CHAR_LIMIT);
}
