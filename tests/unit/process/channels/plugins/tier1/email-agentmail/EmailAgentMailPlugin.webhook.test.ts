/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { EmailAgentMailPlugin } from '@process/channels/plugins/tier1/email-agentmail/EmailAgentMailPlugin';
import { verifyAgentMailSignature } from '@process/channels/webhook/verifiers/agentmail';
import type { IUnifiedIncomingMessage } from '@process/channels/types';

async function initPlugin(): Promise<EmailAgentMailPlugin> {
  const plugin = new EmailAgentMailPlugin();
  await plugin.initialize({
    id: 'email-agentmail_default',
    type: 'email-agentmail',
    name: 'AgentMail',
    enabled: true,
    credentials: { apiKey: 'am_test', inboxAddress: 'agent@workspace.agentmail.to' },
    status: 'created',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return plugin;
}

describe('EmailAgentMailPlugin.handleWebhookPayload', () => {
  it('emits a unified message for a complete AgentMail payload and tracks the sender as active', async () => {
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload(
      {
        event: 'message.received',
        message: {
          message_id: '<inbound1@mail.example.com>',
          from: 'alice@example.com',
          subject: 'Hello',
          text: 'Body content',
        },
      },
      { 'x-agentmail-signature': 'sig' },
      'email-agentmail_default'
    );

    expect(emitted).toHaveLength(1);
    expect(emitted[0].platform).toBe('email-agentmail');
    expect(emitted[0].chatId).toBe('alice@example.com');
    expect(emitted[0].content.text).toBe('Body content');
    expect(plugin.getActiveUserCount()).toBe(1);
  });

  it('drops payloads missing required fields without throwing', async () => {
    const plugin = await initPlugin();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload({}, {}, 'email-agentmail_default');
    await plugin.handleWebhookPayload({ message: {} }, {}, 'email-agentmail_default');
    await plugin.handleWebhookPayload(
      { message: { from: 'alice@example.com' } },
      {},
      'email-agentmail_default'
    );

    expect(emitted).toHaveLength(0);
    expect(plugin.getActiveUserCount()).toBe(0);
    warn.mockRestore();
  });
});

describe('verifyAgentMailSignature', () => {
  const secret = 'whsec_test_value';
  const body = JSON.stringify({ message: { id: 'm1', from: 'a@b.com' } });
  const validHex = createHmac('sha256', secret).update(body).digest('hex');

  it('accepts a valid HMAC-SHA256 hex signature', () => {
    expect(verifyAgentMailSignature(body, validHex, secret)).toBe(true);
  });

  it('accepts the same signature when prefixed with sha256=', () => {
    expect(verifyAgentMailSignature(body, `sha256=${validHex}`, secret)).toBe(true);
  });

  it('rejects a wrong secret', () => {
    expect(verifyAgentMailSignature(body, validHex, 'wrong-secret')).toBe(false);
  });

  it('rejects a tampered body', () => {
    expect(verifyAgentMailSignature(body + 'x', validHex, secret)).toBe(false);
  });

  it('rejects non-hex content without throwing', () => {
    expect(verifyAgentMailSignature(body, 'not-a-hex-string!!', secret)).toBe(false);
    expect(verifyAgentMailSignature(body, '', secret)).toBe(false);
  });
});
