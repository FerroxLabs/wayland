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
        content: 'x'.repeat(100),
        summary: 'Long research result',
        type: 'message',
      },
    ];

    const formatted = formatMessages(msgs, [], { messageCharLimit: 40, totalCharLimit: 500 });

    expect(formatted).toContain('Summary: Long research result');
    expect(formatted).toContain('truncated');
    expect(formatted.length).toBeLessThan(140);
  });

  it('caps the total unread mailbox bundle included in a wake prompt', () => {
    const msgs: MailboxMessage[] = [
      { id: 'm1', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'a'.repeat(80), type: 'message' },
      { id: 'm2', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'b'.repeat(80), type: 'message' },
      { id: 'm3', teamId: 't1', toAgentId: 'slot-1', fromAgentId: 'user', content: 'c'.repeat(80), type: 'message' },
    ];

    const formatted = formatMessages(msgs, [], { messageCharLimit: 100, totalCharLimit: 130 });

    expect(formatted).toContain('[From User]');
    expect(formatted).toContain('omitted');
    expect(formatted.length).toBeLessThan(240);
  });
});
