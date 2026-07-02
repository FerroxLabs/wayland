import { describe, expect, it } from 'vitest';
import { formatMessages } from '@process/team/prompts/formatHelpers';
import type { TeamAgent, MailboxMessage } from '@process/team/types';

describe('formatMessages', () => {
  it('returns placeholder when empty', () => {
    expect(formatMessages([], [])).toBe('No unread messages.');
  });

  it('labels user messages correctly', () => {
    const msgs: MailboxMessage[] = [
      { id: 'm1', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'Hello', type: 'message' },
    ];
    expect(formatMessages(msgs, [])).toContain('[From User] Hello');
  });

  it('resolves sender name from agents list', () => {
    const agents: TeamAgent[] = [{ slotId: 'slot-2', agentName: 'Researcher' } as TeamAgent];
    const msgs: MailboxMessage[] = [
      { id: 'm1', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'slot-2', content: 'Done', type: 'message' },
    ];
    expect(formatMessages(msgs, agents)).toContain('[From Researcher] Done');
  });

  it('truncates oversized mailbox messages before prompt assembly', () => {
    const msgs: MailboxMessage[] = [
      {
        id: 'm1',
        teamId: 't1',
        toAgentId: 'slot-1',
        fromAgentId: 'slot-2',
        content: 'x'.repeat(8000),
        summary: 'Long research result',
        type: 'message',
      },
    ];

    const formatted = formatMessages(msgs, []);

    expect(formatted).toContain('Summary: Long research result');
    expect(formatted).toContain('truncated');
    // Single message capped at the 6000-char per-message limit (+ label/suffix).
    expect(formatted.length).toBeLessThan(6200);
  });

  it('caps the total unread mailbox bundle included in a wake prompt', () => {
    const msgs: MailboxMessage[] = [
      { id: 'm1', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'a'.repeat(6000), type: 'message' },
      { id: 'm2', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'b'.repeat(6000), type: 'message' },
      { id: 'm3', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'c'.repeat(6000), type: 'message' },
      { id: 'm4', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'd'.repeat(6000), type: 'message' },
      { id: 'm5', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'e'.repeat(6000), type: 'message' },
      { id: 'm6', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'f'.repeat(6000), type: 'message' },
    ];

    const formatted = formatMessages(msgs, []);

    expect(formatted).toContain('[From User]');
    expect(formatted).toContain('omitted');
    // Bundle capped at the 30000-char total limit (+ truncation/omitted notes).
    expect(formatted.length).toBeLessThan(30300);
  });
});
