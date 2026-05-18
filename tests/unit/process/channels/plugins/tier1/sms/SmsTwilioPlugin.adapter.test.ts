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

    // Real inbound message — has Body, no MessageStatus/SmsStatus. Status
    // fields only appear on delivery-callback POSTs (see F2 below).
    const payload = {
      From: '+15551234567',
      To: '+15557654321',
      Body: 'preserve me',
      MessageSid: 'SM_preserve',
      AccountSid: 'AC00000000000000000000000000000000',
    };

    await plugin.handleWebhookPayload(payload, {}, 'sms-twilio_default');
    expect(emitted).toHaveLength(1);
    const raw = emitted[0].raw as Record<string, string>;
    expect(raw.AccountSid).toBe('AC00000000000000000000000000000000');
    expect(raw.From).toBe('+15551234567');
  });

  // F2 fix: status callbacks must NOT be re-emitted as fake inbound messages.
  it('drops MessageStatus delivery callbacks (F2)', async () => {
    const plugin = new SmsTwilioPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload(
      {
        From: '+14155550123',
        To: '+15551234567',
        MessageSid: 'SM_status_delivered',
        MessageStatus: 'delivered',
      },
      {},
      'sms-twilio_default'
    );
    await plugin.handleWebhookPayload(
      {
        From: '+14155550123',
        MessageSid: 'SM_status_failed',
        SmsStatus: 'failed',
      },
      {},
      'sms-twilio_default'
    );

    expect(emitted).toHaveLength(0);
    expect(plugin.getActiveUserCount()).toBe(0);
  });

  // F3 fix: A2P 10DLC opt-out keywords must NOT be forwarded to the agent.
  it.each(['STOP', 'stop', 'StopAll', 'UNSUBSCRIBE', 'cancel', 'END', 'quit'])(
    'intercepts opt-out keyword "%s" (F3)',
    async (keyword) => {
      const plugin = new SmsTwilioPlugin();
      const emitted: IUnifiedIncomingMessage[] = [];
      plugin.onMessage(async (msg) => {
        emitted.push(msg);
      });
      await plugin.handleWebhookPayload(
        {
          From: '+15551234567',
          MessageSid: 'SM_optout',
          Body: keyword,
        },
        {},
        'sms-twilio_default'
      );
      expect(emitted).toHaveLength(0);
    }
  );

  it.each(['START', 'unstop', 'HELP', 'info'])(
    'intercepts opt-in / help keyword "%s" (F3)',
    async (keyword) => {
      const plugin = new SmsTwilioPlugin();
      const emitted: IUnifiedIncomingMessage[] = [];
      plugin.onMessage(async (msg) => {
        emitted.push(msg);
      });
      await plugin.handleWebhookPayload(
        {
          From: '+15551234567',
          MessageSid: 'SM_optin',
          Body: keyword,
        },
        {},
        'sms-twilio_default'
      );
      expect(emitted).toHaveLength(0);
    }
  );

  // F4: inbound MMS emits the message with text but logs a warning that media
  // ingestion is not yet wired.
  it('emits MMS payload text but warns about dropped media (F4)', async () => {
    const plugin = new SmsTwilioPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload(
      {
        From: '+15551234567',
        To: '+15557654321',
        Body: 'see photo',
        MessageSid: 'SM_mms',
        NumMedia: '2',
        MediaUrl0: 'https://api.twilio.com/...m0.jpg',
        MediaUrl1: 'https://api.twilio.com/...m1.jpg',
      },
      {},
      'sms-twilio_default'
    );

    expect(emitted).toHaveLength(1);
    expect(emitted[0].content.text).toBe('see photo');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Inbound MMS contains 2 media item(s)')
    );
    warn.mockRestore();
  });
});
