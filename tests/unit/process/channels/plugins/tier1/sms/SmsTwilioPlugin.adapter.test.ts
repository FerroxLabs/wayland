/**
 * @license
 * Copyright 2026 Ferrox Labs
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

    // Real inbound message - has Body, no MessageStatus/SmsStatus. Status
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

  // F4 (R7): inbound MMS NumMedia / MediaUrl{i} / MediaContentType{i} convert
  // into IUnifiedAttachment entries; Body is preserved as the caption text.
  it('drops attachments when NumMedia=0 (F4)', async () => {
    const plugin = new SmsTwilioPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload(
      {
        From: '+15551234567',
        MessageSid: 'SM_no_media',
        Body: 'plain text',
        NumMedia: '0',
      },
      {},
      'sms-twilio_default'
    );

    expect(emitted).toHaveLength(1);
    expect(emitted[0].content.type).toBe('text');
    expect(emitted[0].content.attachments).toBeUndefined();
  });

  it('maps a single image MMS to a photo attachment (F4)', async () => {
    const plugin = new SmsTwilioPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload(
      {
        From: '+15551234567',
        MessageSid: 'SM_one_image',
        NumMedia: '1',
        MediaUrl0: 'https://api.twilio.com/2010-04-01/.../Media/ME0.jpg',
        MediaContentType0: 'image/jpeg',
      },
      {},
      'sms-twilio_default'
    );

    expect(emitted).toHaveLength(1);
    const msg = emitted[0];
    expect(msg.content.type).toBe('photo');
    expect(msg.content.attachments).toHaveLength(1);
    expect(msg.content.attachments?.[0]).toEqual({
      type: 'photo',
      fileId: 'https://api.twilio.com/2010-04-01/.../Media/ME0.jpg',
      mimeType: 'image/jpeg',
    });
  });

  it('maps mixed image + pdf MMS into two attachments (F4)', async () => {
    const plugin = new SmsTwilioPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload(
      {
        From: '+15551234567',
        MessageSid: 'SM_mixed',
        NumMedia: '2',
        MediaUrl0: 'https://api.twilio.com/.../Media/ME0.jpg',
        MediaContentType0: 'image/jpeg',
        MediaUrl1: 'https://api.twilio.com/.../Media/ME1.pdf',
        MediaContentType1: 'application/pdf',
      },
      {},
      'sms-twilio_default'
    );

    expect(emitted).toHaveLength(1);
    const att = emitted[0].content.attachments;
    expect(att).toHaveLength(2);
    expect(att?.[0].type).toBe('photo');
    expect(att?.[1].type).toBe('document');
    expect(att?.[1].mimeType).toBe('application/pdf');
    // First attachment dictates the content.type promotion.
    expect(emitted[0].content.type).toBe('photo');
  });

  it('preserves Body caption alongside attachment (F4)', async () => {
    const plugin = new SmsTwilioPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload(
      {
        From: '+15551234567',
        MessageSid: 'SM_caption',
        Body: 'caption',
        NumMedia: '1',
        MediaUrl0: 'https://api.twilio.com/.../Media/MEcap.jpg',
        MediaContentType0: 'image/png',
      },
      {},
      'sms-twilio_default'
    );

    expect(emitted).toHaveLength(1);
    expect(emitted[0].content.text).toBe('caption');
    expect(emitted[0].content.attachments).toHaveLength(1);
    expect(emitted[0].content.attachments?.[0].type).toBe('photo');
  });
});
