import { describe, it, expect } from 'vitest';
import { extractCronPromptFromUserMessages, __test } from '../../../src/renderer/utils/cron/extractCronPromptFromUserMessages';
import type { TMessage } from '../../../src/common/chat/chatLib';

const { MIN_USER_MSG_LENGTH, ACK_PATTERN } = __test;

function userText(text: string, overrides: Partial<TMessage> = {}): TMessage {
  return {
    id: `m_${Math.random().toString(36).slice(2, 8)}`,
    msg_id: `m_${Math.random().toString(36).slice(2, 8)}`,
    conversation_id: 'conv-1',
    type: 'text',
    position: 'right',
    content: { content: text },
    createdAt: Date.now(),
    status: 'finish',
    ...overrides,
  } as unknown as TMessage;
}

function assistantText(text: string): TMessage {
  return userText(text, { position: 'left' });
}

describe('extractCronPromptFromUserMessages', () => {
  it('returns empty string for empty input', () => {
    expect(extractCronPromptFromUserMessages([])).toBe('');
  });

  it('drops user messages under MIN_USER_MSG_LENGTH chars', () => {
    expect(extractCronPromptFromUserMessages([userText('yo'), userText('hey there')])).toBe('');
  });

  it('keeps long user messages', () => {
    const long = 'Go find the latest AI news that is relevant for the last 48 hours';
    expect(long.length).toBeGreaterThanOrEqual(MIN_USER_MSG_LENGTH);
    expect(extractCronPromptFromUserMessages([userText(long)])).toBe(long);
  });

  it('drops single-word acknowledgements regardless of length boost via padding', () => {
    // Use ack words long enough to clear MIN_USER_MSG_LENGTH (padded)
    expect(extractCronPromptFromUserMessages([userText('thanks                                       ')])).toBe('');
    expect(extractCronPromptFromUserMessages([userText('great!                                       ')])).toBe('');
    expect(extractCronPromptFromUserMessages([userText('OK!                                          ')])).toBe('');
  });

  it('drops multi-word acknowledgements (locked v0.6.2.6 tightening)', () => {
    expect(extractCronPromptFromUserMessages([userText('thanks so much                               ')])).toBe('');
    expect(extractCronPromptFromUserMessages([userText('OK done                                      ')])).toBe('');
    expect(extractCronPromptFromUserMessages([userText('yeah cool thanks                             ')])).toBe('');
    expect(extractCronPromptFromUserMessages([userText('do another iteration                         ')])).toBe('');
  });

  it('keeps substantive messages that start with an ack word', () => {
    const keep = 'Thanks for the help - also check Twitter trending for the same window';
    expect(keep.length).toBeGreaterThan(MIN_USER_MSG_LENGTH);
    expect(ACK_PATTERN.test(keep)).toBe(false); // sanity: not a whole-message ack
    expect(extractCronPromptFromUserMessages([userText(keep)])).toBe(keep);
  });

  it('skips non-user roles (assistant messages on position=left)', () => {
    const userMsg = 'Go find the latest AI news that is relevant for the last 48 hours';
    const assistantMsg = 'I found these stories - here is what I see across the major outlets';
    const result = extractCronPromptFromUserMessages([userText(userMsg), assistantText(assistantMsg)]);
    expect(result).toBe(userMsg);
  });

  it('joins multiple surviving user messages with \\n\\n preserving order', () => {
    const a = 'Go find the latest AI news that is relevant for the last 48 hours';
    const b = 'Make the GitHub section a bit longer with five repos instead of three';
    const result = extractCronPromptFromUserMessages([
      userText(a),
      userText('thanks                                       '),
      userText(b),
    ]);
    expect(result).toBe(`${a}\n\n${b}`);
  });

  it('drops hidden messages even if they meet length + non-ack criteria', () => {
    const hidden = 'This is a hidden system-injected message that should never appear in the cron prompt';
    expect(extractCronPromptFromUserMessages([userText(hidden, { hidden: true })])).toBe('');
  });

  it('drops messages with cronMeta (cron-triggered prompts - circular re-use)', () => {
    const msg: TMessage = {
      ...userText('A long cron-triggered prompt that should not feed back into the next cron'),
      content: {
        content: 'A long cron-triggered prompt that should not feed back into the next cron',
        cronMeta: { source: 'cron', cronJobId: 'cron_x', cronJobName: 'x', triggeredAt: 1 },
      },
    } as TMessage;
    expect(extractCronPromptFromUserMessages([msg])).toBe('');
  });

  it('drops teammateMessage entries', () => {
    const msg: TMessage = {
      ...userText('A long teammate-routed message that should not be treated as user input here'),
      content: {
        content: 'A long teammate-routed message that should not be treated as user input here',
        teammateMessage: true,
      },
    } as TMessage;
    expect(extractCronPromptFromUserMessages([msg])).toBe('');
  });

  it('skips non-text message types entirely', () => {
    const longText = 'Go find the latest AI news that is relevant for the last 48 hours';
    const toolCall: TMessage = {
      id: 't1',
      conversation_id: 'conv-1',
      type: 'tool_call' as const,
      position: 'right',
      content: { callId: 'tool_x' },
      createdAt: Date.now(),
    } as unknown as TMessage;
    expect(extractCronPromptFromUserMessages([userText(longText), toolCall])).toBe(longText);
  });
});
