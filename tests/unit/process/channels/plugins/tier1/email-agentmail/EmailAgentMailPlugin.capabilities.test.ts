/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { EmailAgentMailPlugin } from '@process/channels/plugins/tier1/email-agentmail/EmailAgentMailPlugin';
import { hasPluginCredentials } from '@process/channels/types';

describe('EmailAgentMailPlugin capabilities and status', () => {
  it('exposes the email-agentmail type and pure-buffered capabilities', () => {
    const plugin = new EmailAgentMailPlugin();
    expect(plugin.type).toBe('email-agentmail');
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: false,
      canTypingIndicator: false,
    });
  });

  it('starts in the created status with no active users and no bot info', () => {
    const plugin = new EmailAgentMailPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('rejects editMessage with a clear error since email cannot be edited in place', async () => {
    const plugin = new EmailAgentMailPlugin();
    await expect(plugin.editMessage()).rejects.toThrow(/does not support editing/i);
  });
});

describe('hasPluginCredentials for email-agentmail', () => {
  it('returns false when credentials are missing', () => {
    expect(hasPluginCredentials('email-agentmail', undefined)).toBe(false);
    expect(hasPluginCredentials('email-agentmail', {})).toBe(false);
  });

  it('returns false when only one of apiKey / inboxAddress is set', () => {
    expect(hasPluginCredentials('email-agentmail', { apiKey: 'am_xxx' })).toBe(false);
    expect(
      hasPluginCredentials('email-agentmail', { inboxAddress: 'agent@workspace.agentmail.to' })
    ).toBe(false);
  });

  it('returns true when both apiKey and inboxAddress are set', () => {
    expect(
      hasPluginCredentials('email-agentmail', {
        apiKey: 'am_xxx',
        inboxAddress: 'agent@workspace.agentmail.to',
      })
    ).toBe(true);
  });
});
