/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

import {
  DINGTALK_MESSAGE_LIMIT,
  convertHtmlToDingTalkMarkdown,
  encodeChatId,
  extractCardAction,
  inferConversationTypeFromSpace,
  parseChatId,
  splitMessage,
  toDingTalkSendParams,
  toUnifiedIncomingMessage,
} from '@process/channels/plugins/dingtalk/DingTalkAdapter';
import type { DingTalkStreamMessage } from '@process/channels/plugins/dingtalk/DingTalkAdapter';

describe('DingTalkAdapter - chatId round-trip', () => {
  it('encodes a private message as user:<staffId>', () => {
    const data: DingTalkStreamMessage = {
      conversationType: '1',
      senderStaffId: 'staff-a',
    };
    expect(encodeChatId(data)).toBe('user:staff-a');
  });

  it('encodes a group message as group:<conversationId>', () => {
    const data: DingTalkStreamMessage = {
      conversationType: '2',
      conversationId: 'cid-123',
      senderStaffId: 'staff-a',
    };
    expect(encodeChatId(data)).toBe('group:cid-123');
  });

  it('parseChatId round-trips user: and group: prefixes', () => {
    expect(parseChatId('user:abc')).toEqual({ type: 'user', id: 'abc' });
    expect(parseChatId('group:cid')).toEqual({ type: 'group', id: 'cid' });
  });

  it('R16 M3: throws for unprefixed legacy chatIds (no silent user fallback)', () => {
    expect(() => parseChatId('unprefixed-legacy')).toThrow(
      /parseChatId: unrecognized id format: unprefixed-legacy/
    );
  });
});

describe('DingTalkAdapter - inferConversationTypeFromSpace (M4)', () => {
  it('returns 2 for IM_GROUP spaces', () => {
    expect(inferConversationTypeFromSpace('dtv1.card//IM_GROUP.cid-1')).toBe('2');
  });

  it('returns 1 for IM_ROBOT spaces', () => {
    expect(inferConversationTypeFromSpace('dtv1.card//IM_ROBOT.staff-1')).toBe('1');
  });

  it('returns 1 when openSpaceId is undefined or empty', () => {
    expect(inferConversationTypeFromSpace(undefined)).toBe('1');
    expect(inferConversationTypeFromSpace('')).toBe('1');
  });
});

describe('DingTalkAdapter - convertHtmlToDingTalkMarkdown (M6)', () => {
  it('converts double-quoted href to markdown link', () => {
    expect(convertHtmlToDingTalkMarkdown('<a href="https://x.com">x</a>')).toBe('[x](https://x.com)');
  });

  it('M6: accepts single-quoted href', () => {
    expect(convertHtmlToDingTalkMarkdown("<a href='https://x.com'>x</a>")).toBe('[x](https://x.com)');
  });

  it('M6: accepts href after extra attributes', () => {
    expect(convertHtmlToDingTalkMarkdown('<a class="cta" href="https://x.com" target="_blank">x</a>')).toBe(
      '[x](https://x.com)'
    );
  });

  it('M6: accepts href before extra attributes', () => {
    expect(convertHtmlToDingTalkMarkdown('<a href="https://x.com" rel="nofollow">x</a>')).toBe('[x](https://x.com)');
  });

  it('strips link text wrapping for unsupported schemes', () => {
    expect(convertHtmlToDingTalkMarkdown('<a href="javascript:alert(1)">bad</a>')).toBe('bad');
  });

  it('converts <b>, <i>, <code>', () => {
    expect(convertHtmlToDingTalkMarkdown('<b>x</b> <i>y</i> <code>z</code>')).toBe('**x** *y* `z`');
  });
});

describe('DingTalkAdapter - splitMessage (M7)', () => {
  it('returns single chunk when under limit', () => {
    expect(splitMessage('short', 100)).toEqual(['short']);
  });

  it('prefers newline boundary', () => {
    const text = `${'a'.repeat(40)}\n${'b'.repeat(40)}\n${'c'.repeat(40)}`;
    const chunks = splitMessage(text, 50);
    // First chunk should end on a newline boundary, not mid-token
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].endsWith('a'.repeat(40)) || chunks[0].includes('a')).toBe(true);
  });

  it('M7: hard-splits on no-whitespace input and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const blob = 'x'.repeat(120);
    const chunks = splitMessage(blob, 50);
    expect(chunks.length).toBe(3); // 50 + 50 + 20
    expect(chunks.every((c) => c.length <= 50)).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('uses DINGTALK_MESSAGE_LIMIT as default', () => {
    expect(DINGTALK_MESSAGE_LIMIT).toBe(4000);
    const text = 'a'.repeat(DINGTALK_MESSAGE_LIMIT + 100);
    const chunks = splitMessage(text);
    expect(chunks.length).toBeGreaterThan(1);
  });
});

describe('DingTalkAdapter - extractCardAction (L4)', () => {
  it('parses the legacy DSL category.action form', () => {
    const out = extractCardAction({ action: 'system.confirm' });
    expect(out).toEqual({ type: 'system', name: 'system.confirm', params: {} });
  });

  it('parses DSL params after colon', () => {
    const out = extractCardAction({ action: 'system.confirm:callId=abc,value=yes' });
    expect(out?.params).toMatchObject({ callId: 'abc', value: 'yes' });
  });

  it('L4: splits DSL params only on FIRST `=` so signed values survive', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.payload=stuff=more';
    const out = extractCardAction({ action: `system.confirm:token=${jwt}` });
    expect(out?.params?.token).toBe(jwt);
  });

  it('L4: accepts JSON-encoded action with arbitrary param values', () => {
    const payload = JSON.stringify({
      name: 'pairing.check',
      params: { token: 'a=b=c', other: 'x' },
    });
    const out = extractCardAction({ action: payload });
    // `pairing` prefix maps to ActionCategory 'platform' via mapToActionCategory.
    expect(out?.type).toBe('platform');
    expect(out?.name).toBe('pairing.check');
    expect(out?.params).toMatchObject({ token: 'a=b=c', other: 'x' });
  });

  it('merges sibling params from callback', () => {
    const out = extractCardAction({ action: 'system.confirm', extra: 'sibling' });
    expect(out?.params?.extra).toBe('sibling');
  });

  it('returns null when action is missing', () => {
    expect(extractCardAction({})).toBeNull();
  });
});

describe('DingTalkAdapter - toUnifiedIncomingMessage', () => {
  it('maps a text message', () => {
    const data: DingTalkStreamMessage = {
      msgId: 'm1',
      conversationType: '1',
      senderStaffId: 'staff-a',
      senderNick: 'Alice',
      msgtype: 'text',
      text: { content: 'hello' },
    };
    const out = toUnifiedIncomingMessage(data);
    expect(out?.platform).toBe('dingtalk');
    expect(out?.chatId).toBe('user:staff-a');
    expect(out?.content).toEqual({ type: 'text', text: 'hello' });
  });

  it('strips @bot mentions in group chats', () => {
    const data: DingTalkStreamMessage = {
      msgId: 'm2',
      conversationType: '2',
      conversationId: 'cid-1',
      senderStaffId: 'staff-a',
      msgtype: 'text',
      text: { content: '@Bot hello there' },
    };
    const out = toUnifiedIncomingMessage(data);
    expect(out?.content.text).toBe('hello there');
  });

  it('returns null when sender info is missing', () => {
    const data: DingTalkStreamMessage = { msgtype: 'text', text: { content: 'x' } };
    expect(toUnifiedIncomingMessage(data)).toBeNull();
  });
});

describe('DingTalkAdapter - toDingTalkSendParams', () => {
  it('emits markdown for plain text', () => {
    const out = toDingTalkSendParams({ text: 'hello' });
    expect(out.contentType).toBe('markdown');
    expect(out.rawText).toBe('hello');
  });

  it('emits actionCard when replyMarkup is present', () => {
    const out = toDingTalkSendParams({ text: 'x', replyMarkup: { title: 't', text: 'b' } });
    expect(out.contentType).toBe('actionCard');
  });

  // HIGH-4: HTML in agent output must be converted to DingTalk-flavored markdown
  // on the markdown send path (used by webhook + API fallbacks). Previously raw
  // <b>/<a> tags reached the user unrendered.
  it('HIGH-4: converts HTML to DingTalk markdown for the markdown content path', () => {
    const out = toDingTalkSendParams({ text: 'click <b>here</b>: <a href="https://x.com">x</a>' });
    expect(out.contentType).toBe('markdown');
    expect(out.rawText).toBe('click **here**: [x](https://x.com)');
    expect(out.content.text).toBe('click **here**: [x](https://x.com)');
  });

  // HIGH-5: buttons must NOT produce an actionCard with the undocumented
  // dingtalk://openAppAction deep link (which no-ops AND can't round-trip back
  // to the bot). Until a documented action scheme + callback path is wired,
  // we render the message body as markdown only.
  it('HIGH-5: buttons fall through to markdown - no dingtalk:// actionURL is generated', () => {
    const out = toDingTalkSendParams({
      text: 'pick one',
      buttons: [[{ label: 'Yes', action: 'system.confirm', params: { value: 'yes' } }]],
    });
    expect(out.contentType).toBe('markdown');
    expect(JSON.stringify(out)).not.toContain('dingtalk://');
    expect(JSON.stringify(out)).not.toContain('openAppAction');
  });
});

// HIGH-1: webhook URL allowlist + HMAC signing live on DingTalkPlugin (static + private).
describe('DingTalkPlugin - webhook URL validation + signing (HIGH-1)', () => {
  it('isValidDingTalkWebhook accepts the official robot/send endpoint', async () => {
    const { DingTalkPlugin } = await import('@process/channels/plugins/dingtalk/DingTalkPlugin');
    expect(
      DingTalkPlugin.isValidDingTalkWebhook('https://oapi.dingtalk.com/robot/send?access_token=abc')
    ).toBe(true);
  });

  it('isValidDingTalkWebhook rejects non-https URLs', async () => {
    const { DingTalkPlugin } = await import('@process/channels/plugins/dingtalk/DingTalkPlugin');
    expect(DingTalkPlugin.isValidDingTalkWebhook('http://oapi.dingtalk.com/robot/send')).toBe(false);
  });

  it('isValidDingTalkWebhook rejects non-DingTalk hosts (spoof protection)', async () => {
    const { DingTalkPlugin } = await import('@process/channels/plugins/dingtalk/DingTalkPlugin');
    expect(DingTalkPlugin.isValidDingTalkWebhook('https://evil.example.com/robot/send')).toBe(false);
  });

  it('isValidDingTalkWebhook rejects wrong path', async () => {
    const { DingTalkPlugin } = await import('@process/channels/plugins/dingtalk/DingTalkPlugin');
    expect(DingTalkPlugin.isValidDingTalkWebhook('https://oapi.dingtalk.com/other/path')).toBe(false);
  });

  it('isValidDingTalkWebhook rejects malformed input', async () => {
    const { DingTalkPlugin } = await import('@process/channels/plugins/dingtalk/DingTalkPlugin');
    expect(DingTalkPlugin.isValidDingTalkWebhook('not-a-url')).toBe(false);
    expect(DingTalkPlugin.isValidDingTalkWebhook('')).toBe(false);
  });

  it('signWebhookUrl appends &timestamp=&sign= when secret is configured', async () => {
    const { DingTalkPlugin } = await import('@process/channels/plugins/dingtalk/DingTalkPlugin');
    const plugin = new DingTalkPlugin();
    (plugin as unknown as { webhookSecret: string }).webhookSecret = 'topsecret';
    const signed = (plugin as unknown as { signWebhookUrl: (u: string) => string }).signWebhookUrl(
      'https://oapi.dingtalk.com/robot/send?access_token=abc'
    );
    expect(signed).toMatch(/&timestamp=\d+&sign=[A-Za-z0-9%+/=]+$/);
  });

  it('signWebhookUrl returns URL unmodified when no secret is configured', async () => {
    const { DingTalkPlugin } = await import('@process/channels/plugins/dingtalk/DingTalkPlugin');
    const plugin = new DingTalkPlugin();
    const url = 'https://oapi.dingtalk.com/robot/send?access_token=abc';
    const signed = (plugin as unknown as { signWebhookUrl: (u: string) => string }).signWebhookUrl(url);
    expect(signed).toBe(url);
  });
});

// Lifecycle smoke
describe('DingTalkPlugin - lifecycle smoke', () => {
  it('constructs without throwing and exposes the expected type+capabilities', async () => {
    const { DingTalkPlugin } = await import('@process/channels/plugins/dingtalk/DingTalkPlugin');
    const plugin = new DingTalkPlugin();
    expect(plugin.type).toBe('dingtalk');
    expect(plugin.capabilities).toMatchObject({ canEdit: true, canStream: true });
  });
});
