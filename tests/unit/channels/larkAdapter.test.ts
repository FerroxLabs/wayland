/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import {
  convertHtmlToLarkMarkdown,
  extractCardAction,
  getLarkChatType,
  LARK_MESSAGE_LIMIT,
  LARK_SUPPORTED_MESSAGE_TYPES,
  splitMessage,
  toLarkSendParams,
  toUnifiedIncomingMessage,
} from '@process/channels/plugins/lark/LarkAdapter';

describe('LarkAdapter - toUnifiedIncomingMessage (inbound)', () => {
  const baseMessageEvent = (overrides: Record<string, unknown> = {}) => ({
    event: {
      message: {
        message_id: 'om_test_1',
        chat_id: 'oc_chat_1',
        chat_type: 'p2p',
        message_type: 'text',
        content: JSON.stringify({ text: 'hello' }),
        create_time: '1700000000000',
        ...overrides,
      },
      sender: {
        sender_id: { user_id: 'u_alice', open_id: 'ou_alice' },
      },
    },
  });

  it('maps a text message with sender + chatId', () => {
    const out = toUnifiedIncomingMessage(baseMessageEvent());
    expect(out).not.toBeNull();
    expect(out?.platform).toBe('lark');
    expect(out?.chatId).toBe('oc_chat_1');
    expect(out?.content.type).toBe('text');
    expect(out?.content.text).toBe('hello');
    expect(out?.user.id).toBe('u_alice');
  });

  it('extracts parent_id into replyToMessageId (thread context, MED #9)', () => {
    const out = toUnifiedIncomingMessage(baseMessageEvent({ parent_id: 'om_parent_42' }));
    expect(out?.replyToMessageId).toBe('om_parent_42');
  });

  it('falls back to root_id when parent_id is absent', () => {
    const out = toUnifiedIncomingMessage(baseMessageEvent({ root_id: 'om_root_99' }));
    expect(out?.replyToMessageId).toBe('om_root_99');
  });

  it('omits replyToMessageId when neither parent_id nor root_id present', () => {
    const out = toUnifiedIncomingMessage(baseMessageEvent());
    expect(out?.replyToMessageId).toBeUndefined();
  });

  it('renders unsupported message types as human-readable placeholder, not raw JSON (MED #8)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = toUnifiedIncomingMessage(
      baseMessageEvent({ message_type: 'post', content: JSON.stringify({ title: 'x' }) })
    );
    expect(out?.content.text).toBe('[unsupported message type: post]');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('maps image messages to a photo attachment', () => {
    const out = toUnifiedIncomingMessage(
      baseMessageEvent({ message_type: 'image', content: JSON.stringify({ image_key: 'img_abc' }) })
    );
    expect(out?.content.type).toBe('photo');
    expect(out?.content.attachments?.[0].fileId).toBe('img_abc');
  });

  it('returns null when message and sender are both missing', () => {
    expect(toUnifiedIncomingMessage({ event: {} })).toBeNull();
  });
});

describe('LarkAdapter - getLarkChatType (LOW #13)', () => {
  it('returns "p2p" for direct chats', () => {
    expect(getLarkChatType({ event: { message: { chat_type: 'p2p' } } })).toBe('p2p');
  });

  it('returns "group" for group chats', () => {
    expect(getLarkChatType({ event: { message: { chat_type: 'group' } } })).toBe('group');
  });

  it('returns undefined when chat_type is absent or unrecognised', () => {
    expect(getLarkChatType({ event: { message: {} } })).toBeUndefined();
    expect(getLarkChatType({ event: { message: { chat_type: 'weird' } } })).toBeUndefined();
  });
});

describe('LarkAdapter - toLarkSendParams (outbound)', () => {
  it('falls back to text when replyMarkup is not a valid card shape (LOW #21)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = toLarkSendParams({ type: 'text', text: 'fallback please', replyMarkup: { not: 'a card' } });
    expect(out.contentType).toBe('text');
    expect(out.rawText).toBe('fallback please');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('accepts a valid interactive-card replyMarkup', () => {
    const card = { config: { wide_screen_mode: true }, elements: [{ tag: 'markdown', content: 'hi' }] };
    const out = toLarkSendParams({ type: 'text', text: '', replyMarkup: card });
    expect(out.contentType).toBe('interactive');
    expect(out.content).toBe(card);
  });

  it('builds an interactive card when buttons are present', () => {
    const out = toLarkSendParams({
      type: 'buttons',
      text: 'Pick one',
      buttons: [[{ label: 'OK', action: 'session.new' }]],
    });
    expect(out.contentType).toBe('interactive');
    const card = out.content as { elements: Array<{ tag: string }> };
    expect(card.elements.some((e) => e.tag === 'action')).toBe(true);
  });
});

describe('LarkAdapter - extractCardAction', () => {
  it('parses category.name action with merged params', () => {
    const out = extractCardAction({ value: { action: 'pairing.approve', token: 'tk_1' } });
    expect(out).toEqual({ type: 'platform', name: 'pairing.approve', params: { token: 'tk_1' } });
  });

  it('returns null when action.value is missing', () => {
    expect(extractCardAction({})).toBeNull();
  });
});

describe('LarkAdapter - convertHtmlToLarkMarkdown (XSS hardening)', () => {
  it('strips javascript: links keeping inner text', () => {
    expect(convertHtmlToLarkMarkdown('<a href="javascript:alert(1)">click</a>')).toBe('click');
  });

  it('strips all <script> tags even when nested for smuggling', () => {
    // The exact textual remnant is implementation-defined; the contract is "no <script> survives".
    const out = convertHtmlToLarkMarkdown('<scr<script>ipt>alert(1)</scr</script>ipt>');
    expect(out.toLowerCase()).not.toContain('<script');
    expect(out).toContain('alert(1)');
  });

  it('does NOT re-introduce tags via entity decode', () => {
    expect(convertHtmlToLarkMarkdown('&lt;script&gt;')).toBe('&lt;script&gt;');
  });

  it('converts allowed bold + code markup', () => {
    expect(convertHtmlToLarkMarkdown('<b>hi</b> <code>x</code>')).toBe('**hi** `x`');
  });
});

describe('LarkAdapter - splitMessage', () => {
  it('returns single chunk when under the limit', () => {
    expect(splitMessage('short', 50)).toEqual(['short']);
  });

  it('splits long input into chunks under the limit', () => {
    const text = 'a'.repeat(LARK_MESSAGE_LIMIT * 2 + 7);
    const chunks = splitMessage(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(LARK_MESSAGE_LIMIT);
  });
});

describe('LarkAdapter - exported constants', () => {
  it('exposes the supported message-type list (MED #8 contract)', () => {
    expect(LARK_SUPPORTED_MESSAGE_TYPES).toEqual(['text', 'image', 'file', 'audio']);
  });
});

describe('LarkAdapter - displayName plumbing (R9 HIGH #2)', () => {
  const messageEvent = (overrides: Record<string, unknown> = {}) => ({
    event: {
      message: {
        message_id: 'om_test_1',
        chat_id: 'oc_chat_1',
        chat_type: 'p2p',
        message_type: 'text',
        content: JSON.stringify({ text: 'hi' }),
        create_time: '1700000000000',
        ...overrides,
      },
      sender: {
        sender_id: { user_id: 'u_alice_abcdef', open_id: 'ou_alice_xyz123' },
      },
    },
  });

  const cardActionEvent = () => ({
    event: {
      token: 'tk_card_1',
      open_chat_id: 'oc_chat_card',
      operator: { user_id: 'u_bob_qrstuv', open_id: 'ou_bob_wxyz45' },
      action: { value: { action: 'session.new' } },
    },
  });

  it('uses the plugin-resolved displayName instead of the User XXXXX fallback', () => {
    const out = toUnifiedIncomingMessage(messageEvent(), undefined, { displayName: 'Alice Wong' });
    expect(out?.user.displayName).toBe('Alice Wong');
    expect(out?.user.displayName).not.toMatch(/^User /);
  });

  it('falls back to "User <slice>" when no displayName is supplied but userId is present (regression)', () => {
    const out = toUnifiedIncomingMessage(messageEvent());
    expect(out?.user.displayName).toBe('User abcdef');
  });

  it('uses displayName on card-action events too', () => {
    const out = toUnifiedIncomingMessage(cardActionEvent(), { type: 'system', name: 'session.new' }, {
      displayName: 'Bob Lin',
    });
    expect(out?.user.displayName).toBe('Bob Lin');
  });

  it('renders "Unknown User" when neither displayName nor userId is present on a card action', () => {
    const out = toUnifiedIncomingMessage(
      { event: { token: 'tk_x', open_chat_id: 'oc_x', operator: {} } },
      { type: 'system', name: 'session.new' }
    );
    expect(out?.user.displayName).toBe('Unknown User');
    expect(out?.user.id).toBe('');
  });
});
