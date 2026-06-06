/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { WebhookPlugin } from '@process/channels/plugins/tier1/webhook/WebhookPlugin';

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 'webhook_default',
    type: 'webhook' as const,
    name: 'Webhook',
    enabled: true,
    credentials: {
      outboundUrl: 'https://example.com/hook',
      ...overrides,
    },
    status: 'created' as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('WebhookPlugin lifecycle', () => {
  it('starts in created status', () => {
    const plugin = new WebhookPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.type).toBe('webhook');
  });

  it('transitions created -> initializing -> ready on initialize', async () => {
    const plugin = new WebhookPlugin();
    await plugin.initialize(makeConfig());
    expect(plugin.status).toBe('ready');
  });

  it('transitions ready -> starting -> running on start', async () => {
    const plugin = new WebhookPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    expect(plugin.status).toBe('running');
  });

  it('transitions running -> stopping -> stopped on stop', async () => {
    const plugin = new WebhookPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    await plugin.stop();
    expect(plugin.status).toBe('stopped');
  });

  it('flips to error when outboundUrl is missing', async () => {
    const plugin = new WebhookPlugin();
    await expect(
      plugin.initialize({
        ...makeConfig(),
        credentials: {},
      })
    ).rejects.toThrow(/outboundUrl is required/i);
    expect(plugin.status).toBe('error');
  });

  it('flips to error when outboundUrl is not a valid URL', async () => {
    const plugin = new WebhookPlugin();
    await expect(
      plugin.initialize(makeConfig({ outboundUrl: 'not-a-url' }))
    ).rejects.toThrow(/not a valid URL/i);
    expect(plugin.status).toBe('error');
  });

  it('getBotInfo returns null before initialize, object after', async () => {
    const plugin = new WebhookPlugin();
    expect(plugin.getBotInfo()).toBeNull();
    await plugin.initialize(makeConfig());
    const info = plugin.getBotInfo();
    expect(info).not.toBeNull();
    expect(info?.username).toBe('https://example.com/hook');
  });

  it('getActiveUserCount is always 0', async () => {
    const plugin = new WebhookPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    expect(plugin.getActiveUserCount()).toBe(0);
  });
});
