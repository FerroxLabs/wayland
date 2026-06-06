/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { SlackPlugin } from '@process/channels/plugins/tier1/slack/SlackPlugin';
import { hasPluginCredentials } from '@process/channels/types';

describe('SlackPlugin - capabilities', () => {
  it('declares the Phase-1 capability surface verbatim', () => {
    const plugin = new SlackPlugin();
    expect(plugin.capabilities).toEqual({
      canEdit: true,
      canStream: true,
      canReact: true,
      canTypingIndicator: false,
    });
  });

  it('identifies itself as type "slack"', () => {
    const plugin = new SlackPlugin();
    expect(plugin.type).toBe('slack');
  });

  it('starts in the "created" status before initialize', () => {
    const plugin = new SlackPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getBotInfo()).toBeNull();
    expect(plugin.getActiveUserCount()).toBe(0);
  });

  it('constructing the plugin does not open a Slack connection', () => {
    const before = process.listenerCount('uncaughtException');
    const plugin = new SlackPlugin();
    const after = process.listenerCount('uncaughtException');
    // Bolt + the Web client must remain inert until onInitialize runs.
    expect(after).toBe(before);
    expect(plugin.status).toBe('created');
  });
});

describe('hasPluginCredentials - slack', () => {
  it('returns true when botToken is set', () => {
    expect(hasPluginCredentials('slack', { botToken: 'xoxb-fake' })).toBe(true);
  });

  it('returns false when botToken is empty or missing', () => {
    expect(hasPluginCredentials('slack', {})).toBe(false);
    expect(hasPluginCredentials('slack', { botToken: '' })).toBe(false);
    expect(hasPluginCredentials('slack', undefined)).toBe(false);
  });

  it('does not require appToken / signingSecret at the credential-check level', () => {
    // Transport-specific requirements are enforced inside SlackPlugin.onInitialize.
    expect(
      hasPluginCredentials('slack', {
        botToken: 'xoxb-fake',
        // appToken / signingSecret omitted on purpose
      }),
    ).toBe(true);
  });
});
