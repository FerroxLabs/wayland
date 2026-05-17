/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import type { IUnifiedIncomingMessage } from '@process/channels/types';

vi.mock('twilio', () => ({
  default: () => ({ messages: { create: vi.fn() } }),
}));

import { SmsTwilioPlugin } from '@process/channels/plugins/tier1/sms/SmsTwilioPlugin';

describe('SmsTwilioPlugin.handleWebhookPayload', () => {
  it('converts a verified Twilio form payload into IUnifiedIncomingMessage', async () => {
    const plugin = new SmsTwilioPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    const payload = {
      From: '+15551234567',
      To: '+15557654321',
      Body: 'hello from the field',
      MessageSid: 'SM0123456789abcdef0123456789abcdef',
      AccountSid: 'AC00000000000000000000000000000000',
      NumMedia: '0',
    };

    await plugin.handleWebhookPayload(payload, { 'x-twilio-signature': 'sig' }, 'sms-twilio_default');

    expect(emitted).toHaveLength(1);
    const msg = emitted[0];
    expect(msg.id).toBe('SM0123456789abcdef0123456789abcdef');
    expect(msg.platform).toBe('sms-twilio');
    // SMS conversation key = remote phone number (no group concept).
    expect(msg.chatId).toBe('+15551234567');
    expect(msg.user.id).toBe('+15551234567');
    expect(msg.user.displayName).toBe('+15551234567');
    expect(msg.content.type).toBe('text');
    expect(msg.content.text).toBe('hello from the field');
    // Active-user tracking flips on first inbound from a sender.
    expect(plugin.getActiveUserCount()).toBe(1);
  });

  it('drops payloads missing required From/MessageSid fields without throwing', async () => {
    const plugin = new SmsTwilioPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload({ Body: 'orphan' }, {}, 'sms-twilio_default');
    await plugin.handleWebhookPayload({ From: '+15551234567' }, {}, 'sms-twilio_default');
    await plugin.handleWebhookPayload({ MessageSid: 'SM1' }, {}, 'sms-twilio_default');

    expect(emitted).toHaveLength(0);
    expect(plugin.getActiveUserCount()).toBe(0);
  });

  it('preserves the original Twilio fields under message.raw for downstream debugging', async () => {
    const plugin = new SmsTwilioPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    const payload = {
      From: '+15551234567',
      To: '+15557654321',
      Body: 'preserve me',
      MessageSid: 'SM_preserve',
      MessageStatus: 'received',
    };

    await plugin.handleWebhookPayload(payload, {}, 'sms-twilio_default');
    const raw = emitted[0].raw as Record<string, string>;
    expect(raw.MessageStatus).toBe('received');
    expect(raw.From).toBe('+15551234567');
  });
});
