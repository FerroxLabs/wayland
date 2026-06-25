/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AcpSession } from '@process/acp/session/AcpSession';
import type { AcpClient, ClientFactory } from '@process/acp/infra/IAcpClient';
import type { AgentConfig, SessionCallbacks } from '@process/acp/types';

function createMockCallbacks(): SessionCallbacks {
  return {
    onMessage: vi.fn(),
    onSessionId: vi.fn(),
    onStatusChange: vi.fn(),
    onConfigUpdate: vi.fn(),
    onModelUpdate: vi.fn(),
    onModeUpdate: vi.fn(),
    onContextUsage: vi.fn(),
    onPermissionRequest: vi.fn(),
    onSignal: vi.fn(),
  };
}

// opencode-style agent: advertises build/plan modes (no `default` agent).
function createOpencodeClient(): AcpClient {
  return {
    start: vi.fn().mockResolvedValue({ protocolVersion: '0.1', capabilities: {} }),
    createSession: vi.fn().mockResolvedValue({
      sessionId: 'sess-oc',
      modes: {
        currentModeId: 'build',
        availableModes: [
          { id: 'build', name: 'Build' },
          { id: 'plan', name: 'Plan' },
        ],
      },
      models: { currentModelId: undefined, availableModels: [] },
      configOptions: [],
    }),
    loadSession: vi.fn().mockResolvedValue({ sessionId: 'sess-oc' }),
    prompt: vi.fn().mockResolvedValue({ stopReason: 'end_turn' }),
    cancel: vi.fn().mockResolvedValue(undefined),
    setModel: vi.fn().mockResolvedValue(undefined),
    setMode: vi.fn().mockResolvedValue(undefined),
    setConfigOption: vi.fn().mockResolvedValue(undefined),
    closeSession: vi.fn().mockResolvedValue(undefined),
    extMethod: vi.fn().mockResolvedValue({}),
    authenticate: vi.fn().mockResolvedValue({}),
    lifecycleSnapshot: { pid: null, running: false, lastExit: null },
    onDisconnect: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

const opencodeConfig: AgentConfig = {
  agentBackend: 'opencode',
  agentSource: 'extension',
  agentId: 'extension:opencode',
  cwd: '/tmp',
  command: '/usr/bin/opencode',
  args: ['acp'],
};

describe('AcpSession mode resolution for opencode (#298)', () => {
  let callbacks: SessionCallbacks;
  let client: AcpClient;
  let clientFactory: ClientFactory;

  beforeEach(() => {
    callbacks = createMockCallbacks();
    client = createOpencodeClient();
    clientFactory = { create: vi.fn(() => client) };
  });

  it('re-asserts the agent primary mode (build), never the generic "default"', async () => {
    // Wayland seeds the desired mode from its generic default ("default"),
    // exactly as AcpAgentManager does (sessionMode = currentMode = 'default').
    const session = new AcpSession(opencodeConfig, clientFactory, callbacks, {
      initialDesired: { mode: 'default' },
    });

    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    const setModeCalls = (client.setMode as ReturnType<typeof vi.fn>).mock.calls;
    // The agent must never receive "default" — opencode rejects it as
    // "Agent not found: default".
    for (const [, modeId] of setModeCalls) {
      expect(modeId).not.toBe('default');
    }
    // It should have re-asserted using the advertised primary mode.
    expect(setModeCalls.some(([, modeId]) => modeId === 'build')).toBe(true);
  });

  it('user mode switch validates against advertised modes', async () => {
    const session = new AcpSession(opencodeConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    (client.setMode as ReturnType<typeof vi.fn>).mockClear();

    // A stale/unsupported mode id resolves to the advertised primary mode.
    session.setMode('default');
    await vi.waitFor(() => expect((client.setMode as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0));
    const [, modeId] = (client.setMode as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(modeId).toBe('build');

    // A real advertised mode passes through unchanged.
    (client.setMode as ReturnType<typeof vi.fn>).mockClear();
    session.setMode('plan');
    await vi.waitFor(() => expect((client.setMode as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0));
    expect((client.setMode as ReturnType<typeof vi.fn>).mock.calls[0][1]).toBe('plan');
  });
});
