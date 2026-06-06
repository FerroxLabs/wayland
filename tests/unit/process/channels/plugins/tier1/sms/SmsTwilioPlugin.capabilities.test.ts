/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';

// Twilio SDK is imported eagerly by SmsTwilioPlugin even though these tests do
// not exercise outbound sending. Stub it so the import does not pull in the
// real REST client (it tries to read env vars at module-load time in some
// versions).
vi.mock('twilio', () => ({
  default: () => ({ messages: { create: vi.fn() } }),
}));

import { SmsTwilioPlugin } from '@process/channels/plugins/tier1/sms/SmsTwilioPlugin';

describe('SmsTwilioPlugin capabilities', () => {
  it('declares pure buffered mode - no edit, no stream, no react, no typing', () => {
    const plugin = new SmsTwilioPlugin();
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: false,
      canTypingIndicator: false,
    });
  });

  it('reports type "sms-twilio"', () => {
    expect(new SmsTwilioPlugin().type).toBe('sms-twilio');
  });

  it('starts with zero active users and no bot info before init', () => {
    const plugin = new SmsTwilioPlugin();
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('inherits BasePlugin no-op editMessage (SMS cannot edit prior messages)', async () => {
    const plugin = new SmsTwilioPlugin();
    // Default no-op resolves silently - proves the plugin relies on the
    // BasePlugin default for non-edit-capable platforms.
    await expect(plugin.editMessage('+15550001234', 'SM123', { type: 'text', text: 'x' })).resolves.toBeUndefined();
  });
});
