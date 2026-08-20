/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Which connectors "Send to..." is allowed to offer.
 *
 * The registry is the one the user already filled in - Settings -> Channels,
 * stored as channel plugins and channel users. There is deliberately NO second
 * list of destinations anywhere in this feature: a parallel registry is how a
 * recipient the user revoked in Settings stays reachable from a card.
 *
 * Three filters, and each one removes a dead click or a hole:
 *   - ENABLED. A configured-then-disabled connector is not a destination.
 *   - FILE-CAPABLE. A connector that cannot carry an attachment must not be
 *     offered one. This is the difference between a working button and the
 *     dead click the round was told not to add.
 *   - HAS SOMEONE TO SEND TO. Authorized users only, so the reachable set is
 *     exactly the set the user approved on that channel.
 */

import { describe, expect, it } from 'vitest';

import {
  FILE_CAPABLE_CHANNEL_TYPES,
  buildSendTargets,
} from '@process/services/artifacts/artifactSendConnectors';
import type { IChannelPluginConfig, IChannelUser } from '@process/channels/types';

const plugin = (over: Partial<IChannelPluginConfig> = {}): IChannelPluginConfig =>
  ({
    id: 'plugin-email-1',
    type: 'email-imap',
    name: 'Email (me@example.com)',
    enabled: true,
    status: 'running',
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }) as IChannelPluginConfig;

const user = (over: Partial<IChannelUser> = {}): IChannelUser =>
  ({
    id: 'u1',
    platformUserId: 'team@example.com',
    platformType: 'email-imap',
    displayName: 'The Team',
    authorizedAt: 0,
    ...over,
  }) as IChannelUser;

describe('buildSendTargets', () => {
  it('offers an enabled, file-capable connector with an authorized recipient', () => {
    expect(buildSendTargets([plugin()], [user()])).toEqual([
      {
        targetId: 'plugin-email-1',
        channel: 'email-imap',
        label: 'Email (me@example.com)',
        destinations: [{ destinationId: 'team@example.com', label: 'The Team' }],
      },
    ]);
  });

  it('drops a connector the user has DISABLED', () => {
    expect(buildSendTargets([plugin({ enabled: false })], [user()])).toEqual([]);
  });

  it('drops a connector that cannot carry a file', () => {
    // Telegram is configured and authorized here; it is excluded because
    // nothing in this round taught it to accept an attachment. Offering it
    // would be a button that cannot work.
    const telegram = plugin({ id: 'plugin-tg', type: 'telegram', name: 'Telegram' });
    const tgUser = user({ id: 'u2', platformType: 'telegram', platformUserId: '12345' });
    expect(buildSendTargets([telegram], [tgUser])).toEqual([]);
    expect(FILE_CAPABLE_CHANNEL_TYPES.has('telegram')).toBe(false);
  });

  it('drops a connector with no authorized recipient', () => {
    expect(buildSendTargets([plugin()], [])).toEqual([]);
  });

  it('never offers a recipient from a DIFFERENT channel', () => {
    // A Telegram user id is not an email address, and pairing them would send
    // the artifact to an address the user never authorized on this connector.
    const foreign = user({ id: 'u3', platformType: 'telegram', platformUserId: '12345' });
    expect(buildSendTargets([plugin()], [foreign])).toEqual([]);
  });

  it('falls back to the address when the user has no display name', () => {
    const targets = buildSendTargets([plugin()], [user({ displayName: undefined })]);
    expect(targets[0].destinations).toEqual([{ destinationId: 'team@example.com', label: 'team@example.com' }]);
  });

  it('lists one entry per address, however many rows carry it', () => {
    const targets = buildSendTargets(
      [plugin()],
      [user(), user({ id: 'u2', displayName: 'The Team (again)' })]
    );
    expect(targets[0].destinations).toEqual([{ destinationId: 'team@example.com', label: 'The Team' }]);
  });

  it('drops a row with no usable address instead of offering an empty one', () => {
    expect(buildSendTargets([plugin()], [user({ platformUserId: '   ' })])).toEqual([]);
  });

  it('returns nothing when nothing is configured', () => {
    expect(buildSendTargets([], [])).toEqual([]);
  });
});
