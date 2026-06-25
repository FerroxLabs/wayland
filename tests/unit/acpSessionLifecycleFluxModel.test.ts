/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Guards the #66/#67 fix: when a chat is routed through Flux (model id
 * `flux-auto`), the model is carried by the spawn env (ANTHROPIC_MODEL=flux-auto),
 * NOT by an in-place session/set_model call. SessionLifecycle.reassertConfig()
 * runs right after session creation and replays the desired model; it must skip
 * the bridge set_model for a Flux id, otherwise the claude binary rejects it with
 * JSON-RPC -32601 ("session/set_model" method/model not supported).
 */

import { describe, expect, it, vi } from 'vitest';
import { SessionLifecycle, type LifecycleHost } from '../../src/process/acp/session/SessionLifecycle';
import { ConfigTracker } from '../../src/process/acp/session/ConfigTracker';

function makeLifecycle(desiredModelId: string) {
  const configTracker = new ConfigTracker({ model: desiredModelId });

  const host = {
    agentConfig: { agentBackend: 'claude' },
    configTracker,
    callbacks: { onModelUpdate: vi.fn(), onModeUpdate: vi.fn() },
  } as unknown as LifecycleHost;

  const clientFactory = { create: vi.fn() } as never;
  const lifecycle = new SessionLifecycle(host, clientFactory, { maxStartRetries: 0, maxResumeRetries: 0 });

  const setModel = vi.fn().mockResolvedValue(undefined);
  const setMode = vi.fn().mockResolvedValue(undefined);
  const setConfigOption = vi.fn().mockResolvedValue(undefined);

  // Inject the connected client + session id that doStart() would normally set.
  (lifecycle as unknown as { _client: unknown })._client = { setModel, setMode, setConfigOption };
  (lifecycle as unknown as { _sessionId: string })._sessionId = 'sess-1';

  return { lifecycle, setModel, configTracker };
}

describe('SessionLifecycle.reassertConfig() - Flux model guard', () => {
  it('does NOT call client.setModel for a Flux model id (env-carried routing)', async () => {
    const { lifecycle, setModel } = makeLifecycle('flux-auto');

    await lifecycle.reassertConfig();

    expect(setModel).not.toHaveBeenCalled();
  });

  it('still calls client.setModel for a native model id', async () => {
    const { lifecycle, setModel } = makeLifecycle('opus');

    await lifecycle.reassertConfig();

    expect(setModel).toHaveBeenCalledOnce();
    expect(setModel).toHaveBeenCalledWith('sess-1', 'opus');
  });
});
