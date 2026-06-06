/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { DiscordPlugin } from '@process/channels/plugins/tier1/discord/DiscordPlugin';
import { hasPluginCredentials } from '@process/channels/types';

describe('DiscordPlugin - capabilities', () => {
  it('declares the Phase-1 capability surface verbatim', () => {
    const plugin = new DiscordPlugin();
    expect(plugin.capabilities).toEqual({
      canEdit: true,
      canStream: true,
      canReact: true,
      canTypingIndicator: true,
    });
  });

  it('identifies itself as type "discord"', () => {
    const plugin = new DiscordPlugin();
    expect(plugin.type).toBe('discord');
  });

  it('starts in the "created" status before initialize', () => {
    const plugin = new DiscordPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getBotInfo()).toBeNull();
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getClient()).toBeNull();
  });

  it('does not boot a Gateway connection on construction', () => {
    const before = process.listenerCount('uncaughtException');
    const plugin = new DiscordPlugin();
    const after = process.listenerCount('uncaughtException');
    // discord.js installs no global process listeners until login(); creating
    // the plugin must remain side-effect-free.
    expect(after).toBe(before);
    expect(plugin.status).toBe('created');
  });
});

describe('hasPluginCredentials - discord', () => {
  it('returns true when botToken is set', () => {
    expect(hasPluginCredentials('discord', { botToken: 'MTI.fake.token' })).toBe(true);
  });

  it('returns false when botToken is empty or missing', () => {
    expect(hasPluginCredentials('discord', {})).toBe(false);
    expect(hasPluginCredentials('discord', { botToken: '' })).toBe(false);
    expect(hasPluginCredentials('discord', undefined)).toBe(false);
  });

  it('does not require applicationId or publicKey (optional fields)', () => {
    expect(
      hasPluginCredentials('discord', {
        botToken: 'MTI.fake.token',
        // applicationId + publicKey deliberately omitted
      }),
    ).toBe(true);
  });

  it('accepts the full credential triplet', () => {
    expect(
      hasPluginCredentials('discord', {
        botToken: 'MTI.fake.token',
        applicationId: '1234567890',
        publicKey: 'abcdef0123456789',
      }),
    ).toBe(true);
  });
});
