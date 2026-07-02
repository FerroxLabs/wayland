/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import type { IChannelPluginStatus, IUnifiedOutgoingMessage } from '@process/channels/types';
import {
  handleHostSendMessageRequest,
  resolvePluginIdForPlatform,
  type HostSendDeps,
  type HostSendMessageRequest,
} from '@process/agent/wcore/hostSendMessage';

function status(partial: Partial<IChannelPluginStatus> & { id: string; type: string }): IChannelPluginStatus {
  return {
    name: partial.id,
    enabled: true,
    connected: true,
    status: 'running',
    activeUsers: 0,
    ...partial,
  } as IChannelPluginStatus;
}

function req(partial: Partial<HostSendMessageRequest>): HostSendMessageRequest {
  return {
    type: 'host_send_message_request',
    call_id: 'c1',
    platform: 'email',
    chat_id: 'someone@example.com',
    body: 'hello',
    ...partial,
  } as HostSendMessageRequest;
}

describe('resolvePluginIdForPlatform', () => {
  const emailImap = status({ id: 'email-imap', type: 'email-imap' });

  it('family-matches a platform token to its instance plugin (email -> email-imap)', () => {
    expect(resolvePluginIdForPlatform([emailImap], 'email')).toBe('email-imap');
  });

  it('exact-matches a default-named channel', () => {
    expect(resolvePluginIdForPlatform([status({ id: 'telegram', type: 'telegram' })], 'telegram')).toBe('telegram');
  });

  it('does not cross platforms on a bare prefix (email must not match emailfoo)', () => {
    expect(resolvePluginIdForPlatform([status({ id: 'emailfoo', type: 'emailfoo' })], 'email')).toBeNull();
  });

  it('prefers a live (connected) plugin over a merely-enabled one', () => {
    const down = status({ id: 'email-imap', type: 'email-imap', connected: false, status: 'error' });
    const up = status({ id: 'email-agentmail', type: 'email-agentmail', connected: true });
    expect(resolvePluginIdForPlatform([down, up], 'email')).toBe('email-agentmail');
  });

  it('falls back to an enabled-but-disconnected plugin when none are live', () => {
    const down = status({ id: 'email-imap', type: 'email-imap', connected: false, status: 'error' });
    expect(resolvePluginIdForPlatform([down], 'email')).toBe('email-imap');
  });

  it('with two live same-family accounts, returns the first configured (documented order-dependent)', () => {
    const imap = status({ id: 'email-imap', type: 'email-imap' });
    const agentmail = status({ id: 'email-agentmail', type: 'email-agentmail' });
    expect(resolvePluginIdForPlatform([agentmail, imap], 'email')).toBe('email-agentmail');
    expect(resolvePluginIdForPlatform([imap, agentmail], 'email')).toBe('email-imap');
  });

  it('ignores disabled plugins and returns null when nothing matches', () => {
    expect(
      resolvePluginIdForPlatform([status({ id: 'email-imap', type: 'email-imap', enabled: false })], 'email')
    ).toBeNull();
    expect(resolvePluginIdForPlatform([emailImap], 'discord')).toBeNull();
    expect(resolvePluginIdForPlatform([emailImap], '  ')).toBeNull();
  });
});

describe('handleHostSendMessageRequest', () => {
  function deps(over: Partial<HostSendDeps> = {}): HostSendDeps {
    return {
      listPluginStatuses: async () => [status({ id: 'email-imap', type: 'email-imap' })],
      sendViaPlugin: async () => 'msg-123',
      ...over,
    };
  }

  it('sends via the resolved plugin and returns the receipt', async () => {
    const sendViaPlugin = vi.fn(async () => 'msg-123');
    const out = await handleHostSendMessageRequest(req({}), deps({ sendViaPlugin }));
    expect(out).toEqual({ ok: true, message_id: 'msg-123' });
    expect(sendViaPlugin).toHaveBeenCalledWith('email-imap', 'someone@example.com', {
      type: 'text',
      text: 'hello',
    });
  });

  it('threads subject + thread_id into the outgoing message', async () => {
    let captured: IUnifiedOutgoingMessage | undefined;
    const sendViaPlugin = vi.fn(async (_id: string, _to: string, m: IUnifiedOutgoingMessage) => {
      captured = m;
      return 'id';
    });
    await handleHostSendMessageRequest(req({ subject: 'Re: hi', thread_id: 't-9' }), deps({ sendViaPlugin }));
    expect(captured).toEqual({ type: 'text', text: 'hello', subject: 'Re: hi', replyToMessageId: 't-9' });
  });

  it('fails cleanly when no recipient is supplied', async () => {
    const out = await handleHostSendMessageRequest(req({ chat_id: '' }), deps());
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/no recipient/i);
  });

  it('fails cleanly on an empty message body', async () => {
    for (const b of ['', '   ']) {
      const out = await handleHostSendMessageRequest(req({ body: b }), deps());
      expect(out.ok).toBe(false);
      expect(out.error).toMatch(/empty message body/i);
    }
  });

  it('fails cleanly when the platform is missing', async () => {
    const out = await handleHostSendMessageRequest(req({ platform: '   ' }), deps());
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/missing platform/i);
  });

  it('fails cleanly when no matching channel is configured', async () => {
    const out = await handleHostSendMessageRequest(req({ platform: 'discord' }), deps());
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/no active "discord" channel/i);
  });

  it('reports a send failure when the plugin returns no id', async () => {
    const out = await handleHostSendMessageRequest(req({}), deps({ sendViaPlugin: async () => null }));
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/send failed/i);
  });

  it('never throws — a plugin error becomes { ok:false, error }', async () => {
    const out = await handleHostSendMessageRequest(
      req({}),
      deps({
        sendViaPlugin: async () => {
          throw new Error('SMTP 535 auth failed');
        },
      })
    );
    expect(out).toEqual({ ok: false, error: 'SMTP 535 auth failed' });
  });

  it('treats a status-lookup failure as no channels (clean error, no throw)', async () => {
    const out = await handleHostSendMessageRequest(
      req({}),
      deps({
        listPluginStatuses: async () => {
          throw new Error('db down');
        },
      })
    );
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/no active "email" channel/i);
  });
});
