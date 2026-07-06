/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IChannelPluginConfig } from '@process/channels/types';

// enablePlugin rewrites the DB status to 'created' before re-invoking startPlugin
// for an already-connected channel. #548 part (a): when the plugin is already
// running, startPlugin must re-affirm 'running' in the DB (and re-emit) rather
// than bare-return, otherwise the Settings card shows "Not connected" for a live
// channel. This test pins that re-affirmation at the DB seam.

const { mockUpdateChannelPluginStatus, mockGetChannelPlugin, mockGetDatabase, mockEmit } = vi.hoisted(() => {
  const mockUpdateChannelPluginStatus = vi.fn();
  const mockGetChannelPlugin = vi.fn();
  const db = {
    updateChannelPluginStatus: mockUpdateChannelPluginStatus,
    getChannelPlugin: mockGetChannelPlugin,
  };
  return {
    mockUpdateChannelPluginStatus,
    mockGetChannelPlugin,
    mockGetDatabase: vi.fn(async () => db),
    mockEmit: vi.fn(),
  };
});

vi.mock('@process/services/database', () => ({
  getDatabase: mockGetDatabase,
}));

// PluginManager emits status through the channel bridge; stub the emit sink.
vi.mock('@/common/adapter/ipcBridge', () => ({
  channel: {
    pluginStatusChanged: { emit: mockEmit },
  },
}));

import { PluginManager } from '@process/channels/gateway/PluginManager';

// Minimal already-registered plugin: only the methods buildPluginStatus touches.
// `status` is parameterized so we can cover both the healthy re-affirm and the
// errored-channel regression guard.
function makePlugin(status: 'running' | 'error' = 'running') {
  return {
    status,
    error: status === 'error' ? 'boom' : undefined,
    getBotInfo: vi.fn(() => undefined),
    getActiveUserCount: vi.fn(() => 0),
    getQrCode: vi.fn(() => undefined),
    getConnectionState: vi.fn(() => undefined),
  };
}
const makeRunningPlugin = () => makePlugin('running');

const config: IChannelPluginConfig = {
  id: 'email-imap',
  type: 'email-imap',
  name: 'Email (IMAP/SMTP)',
  enabled: true,
  status: 'created',
  createdAt: 1000,
  updatedAt: 2000,
};

describe('PluginManager.startPlugin already-running re-affirmation (#548)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // emitStatusChange re-reads the plugin config to build the status payload.
    mockGetChannelPlugin.mockReturnValue({ success: true, data: { ...config, status: 'running' } });
  });

  it("re-affirms 'running' in the DB when the plugin is already active", async () => {
    const pm = new PluginManager({} as never);
    // Inject an already-running plugin into the private registry so startPlugin
    // takes the already-running branch instead of constructing a new plugin.
    (pm as unknown as { plugins: Map<string, unknown> }).plugins.set('email-imap', makeRunningPlugin());

    await pm.startPlugin(config);

    expect(mockUpdateChannelPluginStatus).toHaveBeenCalledTimes(1);
    const [id, status, ts] = mockUpdateChannelPluginStatus.mock.calls[0];
    expect(id).toBe('email-imap');
    expect(status).toBe('running');
    expect(typeof ts).toBe('number');
  });

  it('persists the plugin ACTUAL status (does NOT force running) for an errored channel', async () => {
    // Regression guard (cross-audit): a channel that went to 'error' at runtime
    // (e.g. WhatsApp logged-out) is still in this.plugins. Re-saving it must NOT
    // force-write 'running' - that would falsely light the card green.
    const pm = new PluginManager({} as never);
    (pm as unknown as { plugins: Map<string, unknown> }).plugins.set('email-imap', makePlugin('error'));

    await pm.startPlugin(config);

    expect(mockUpdateChannelPluginStatus).toHaveBeenCalledTimes(1);
    const [id, status, ts] = mockUpdateChannelPluginStatus.mock.calls[0];
    expect(id).toBe('email-imap');
    expect(status).toBe('error');
    // no lastConnected timestamp when not running
    expect(ts).toBeUndefined();
  });

  it('re-emits the status change so the Settings card reconciles', async () => {
    const pm = new PluginManager({} as never);
    (pm as unknown as { plugins: Map<string, unknown> }).plugins.set('email-imap', makeRunningPlugin());

    await pm.startPlugin(config);
    // emitStatusChange is fire-and-forget (async); let its microtask settle.
    await Promise.resolve();
    await Promise.resolve();

    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({ pluginId: 'email-imap', status: expect.objectContaining({ status: 'running' }) })
    );
  });
});
