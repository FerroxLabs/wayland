/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The one push moment in the product must be actionable.
 *
 * `showNotification` declared `conversationId?` in its parameter type and never
 * destructured it, so every field a caller supplied to make the banner mean
 * something was dropped on the floor between the type and the OS. What reached
 * the user was a banner reading "Task done" that did nothing when clicked.
 *
 * These tests assert the payload the platform layer actually receives, and that
 * activating the banner reaches the SAME `openArtifact` a click in the UI does -
 * not a second, laxer path to a file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  send: vi.fn(),
  openArtifact: vi.fn(),
  buildEffects: vi.fn(),
  configGet: vi.fn(),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ notification: { send: h.send }, paths: { isPackaged: () => false } }),
}));

vi.mock('@/common', () => ({ ipcBridge: { notification: { show: { provider: vi.fn() } } } }));

vi.mock('@process/utils/initStorage', () => ({ ProcessConfig: { get: h.configGet } }));

vi.mock('@process/services/artifacts/artifactActions', () => ({ openArtifact: h.openArtifact }));

vi.mock('@process/bridge/artifactBridge', () => ({ buildArtifactHostEffects: h.buildEffects }));

const EFFECTS = { marker: 'the-real-host-effects' };

describe('showNotification - the banner names and opens the deliverable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.configGet.mockResolvedValue(true);
    h.buildEffects.mockReturnValue(EFFECTS);
    h.openArtifact.mockResolvedValue({ ok: true });
  });

  it('registers a click handler that opens the announced artifact', async () => {
    const { showNotification } = await import('@process/bridge/notificationBridge');

    await showNotification({
      title: 'Morning Market Brief',
      body: 'brief.html is ready',
      conversationId: 'conv-7',
      artifactId: 'artifact-7',
    });

    expect(h.send).toHaveBeenCalledTimes(1);
    const payload = h.send.mock.calls[0][0];
    expect(payload.title).toBe('Morning Market Brief');
    expect(payload.body).toBe('brief.html is ready');
    expect(typeof payload.onClick).toBe('function');

    // Activating the banner must reach openArtifact through the shared effects.
    await payload.onClick();
    expect(h.openArtifact).toHaveBeenCalledWith('artifact-7', EFFECTS);
  });

  it('does not offer a click handler when there is no deliverable to open', async () => {
    const { showNotification } = await import('@process/bridge/notificationBridge');

    await showNotification({ title: 'Task complete', body: 'Task done', conversationId: 'conv-7' });

    expect(h.send.mock.calls[0][0].onClick).toBeUndefined();
  });

  it('reports a RESOLVED refusal instead of announcing a dead click as success', async () => {
    h.openArtifact.mockResolvedValue({ ok: false, error: 'path not allowed' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { showNotification } = await import('@process/bridge/notificationBridge');

    await showNotification({ title: 't', body: 'b', artifactId: 'artifact-9' });
    await h.send.mock.calls[0][0].onClick();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('path not allowed'));
    warn.mockRestore();
  });
});
