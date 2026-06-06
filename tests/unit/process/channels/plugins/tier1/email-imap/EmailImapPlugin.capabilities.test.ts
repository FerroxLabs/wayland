/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { EmailImapPlugin } from '@process/channels/plugins/tier1/email-imap/EmailImapPlugin';
import { hasPluginCredentials } from '@process/channels/types';

describe('EmailImapPlugin capabilities and status', () => {
  it('exposes the email-imap type and pure-buffered capabilities', () => {
    const plugin = new EmailImapPlugin();
    expect(plugin.type).toBe('email-imap');
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: false,
      canTypingIndicator: false,
    });
  });

  it('starts in the created status with no active users and no bot info', () => {
    const plugin = new EmailImapPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('rejects editMessage with a clear error since email cannot be edited in place', async () => {
    const plugin = new EmailImapPlugin();
    await expect(plugin.editMessage()).rejects.toThrow(/does not support editing/i);
  });

  it('rejects handleWebhookPayload because IMAP is pull/IDLE-driven, not webhook-driven', async () => {
    const plugin = new EmailImapPlugin();
    await expect(plugin.handleWebhookPayload()).rejects.toThrow(/pull\/IDLE/i);
  });
});

describe('hasPluginCredentials for email-imap', () => {
  it('returns false when credentials are missing', () => {
    expect(hasPluginCredentials('email-imap', undefined)).toBe(false);
    expect(hasPluginCredentials('email-imap', {})).toBe(false);
  });

  it('returns false when one of imapHost / imapUser / imapPassword is missing', () => {
    expect(
      hasPluginCredentials('email-imap', { imapUser: 'a@b', imapPassword: 'pw' })
    ).toBe(false);
    expect(
      hasPluginCredentials('email-imap', { imapHost: 'imap.example.com', imapPassword: 'pw' })
    ).toBe(false);
    expect(
      hasPluginCredentials('email-imap', { imapHost: 'imap.example.com', imapUser: 'a@b' })
    ).toBe(false);
  });

  it('returns true when host + user + password are all set', () => {
    expect(
      hasPluginCredentials('email-imap', {
        imapHost: 'imap.example.com',
        imapUser: 'a@b',
        imapPassword: 'pw',
      })
    ).toBe(true);
  });
});

describe('EmailImapPlugin.testConnection (static)', () => {
  it('returns success=false when the token is not valid JSON', async () => {
    const result = await EmailImapPlugin.testConnection('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/expected JSON/i);
  });

  it('returns success=false when imapHost is missing in the JSON payload', async () => {
    const result = await EmailImapPlugin.testConnection(
      JSON.stringify({ imapUser: 'a@b', imapPassword: 'pw' })
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/host is required/i);
  });

  it('returns success=false when imapUser is missing in the JSON payload', async () => {
    const result = await EmailImapPlugin.testConnection(
      JSON.stringify({ imapHost: 'imap.example.com', imapPassword: 'pw' })
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/user is required/i);
  });
});
