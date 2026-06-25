/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * S16 regression: a model change must propagate to EXISTING conversations on
 * every wired channel, not just the five built-ins. Before the fix,
 * syncChannelSettings only ran updateChannelConversationModel when
 * isBuiltinChannelPlatform(platform) was true (telegram/lark/dingtalk/weixin/
 * wecom); for Slack/Discord/WhatsApp/Signal/Matrix/... it took the else-branch
 * and logged "Skip ... for extension platform", leaving existing threads on the
 * old model.
 *
 * This test drives syncChannelSettings for a non-builtin platform ('slack') with
 * a gemini backend + model and asserts the DB batch-update is invoked for that
 * platform. Pre-fix this assertion fails (the update is skipped).
 *
 * The plugin-heavy ChannelManager constructor is bypassed via
 * Object.create(prototype): we exercise only syncChannelSettings with injected
 * private fields, keeping the test focused on the routing decision under test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateChannelConversationModel = vi.fn(() => ({ success: true, data: 3 }));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => ({ updateChannelConversationModel })),
}));

const fakeModel = { id: 'gemini-pro', useModel: 'gemini-2.5-pro' };
vi.mock('../actions/SystemActions', () => ({
  getChannelDefaultModel: vi.fn(async () => fakeModel),
}));
// Also satisfy the resolved absolute import path used by ChannelManager.
vi.mock('@process/channels/actions/SystemActions', () => ({
  getChannelDefaultModel: vi.fn(async () => fakeModel),
}));

import { ChannelManager } from '@process/channels/core/ChannelManager';

beforeEach(() => {
  vi.clearAllMocks();
});

/** Build a ChannelManager without running its plugin-registering constructor. */
function makeManager(): ChannelManager {
  const mgr = Object.create(ChannelManager.prototype) as ChannelManager;
  // Inject the private fields syncChannelSettings touches.
  (mgr as unknown as { initialized: boolean }).initialized = true;
  (mgr as unknown as { sessionManager: { clearAllSessions: () => Promise<number> } }).sessionManager = {
    clearAllSessions: vi.fn(async () => 0),
  };
  return mgr;
}

describe('ChannelManager.syncChannelSettings model propagation (S16)', () => {
  it('updates existing conversations for a NON-builtin channel (slack)', async () => {
    const mgr = makeManager();

    const result = await mgr.syncChannelSettings('slack', { backend: 'gemini' }, fakeModel);

    expect(result.success).toBe(true);
    // The batch update ran for slack - existing slack threads get the new model.
    expect(updateChannelConversationModel).toHaveBeenCalledTimes(1);
    expect(updateChannelConversationModel).toHaveBeenCalledWith('slack', 'gemini', fakeModel);
  });

  it('still updates existing conversations for a built-in channel (telegram)', async () => {
    const mgr = makeManager();

    await mgr.syncChannelSettings('telegram', { backend: 'gemini' }, fakeModel);

    expect(updateChannelConversationModel).toHaveBeenCalledWith('telegram', 'gemini', fakeModel);
  });
});
