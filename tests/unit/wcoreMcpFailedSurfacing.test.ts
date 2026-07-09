/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #713 - the engine emits `mcp_failed` when a configured MCP server fails to
 * connect (carrying the server name and the engine's actionable remediation
 * text). WCoreAgent used to fall through to the unknown-event arm and drop it,
 * so the failure never reached the user - the server's tools just silently
 * didn't exist. It must now surface through the same info stream path sibling
 * events (plugin_registration_failed, budget_exceeded) use.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({ spawn: vi.fn() }));
vi.mock('@process/agent/wcore/binaryResolver', () => ({ resolveWCoreBinary: () => '/fake/wcore' }));
vi.mock('@process/agent/wcore/envBuilder', () => ({
  buildEngineSpawnEnv: () => ({}),
  buildSpawnConfig: () => ({ args: [], env: {}, projectConfig: undefined, resolvedMaxTokens: undefined }),
  planVaultPassphraseDelivery: () => ({ mode: 'env', env: {}, stdio: ['pipe', 'pipe', 'pipe'] }),
}));
vi.mock('@process/secrets', () => ({
  VAULT_PASSPHRASE_CHILD_FD: 3,
  resolveSpawnVaultPassphrase: () => Promise.resolve(null),
}));
vi.mock('@process/agent/wcore/profilePaths', () => ({
  resolveActiveConfigDir: () => Promise.resolve('/fake/home'),
}));
vi.mock('@process/agent/wcore/toolKeyStore', () => ({
  getToolKeyStore: () => Promise.resolve({ collectForwardedEnv: () => ({}) }),
}));
vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({
  hydrateModelForSpawn: (m: unknown) => Promise.resolve(m),
}));
vi.mock('@process/agent/acp/utils', () => ({ killChild: vi.fn().mockResolvedValue(undefined) }));

import { WCoreAgent } from '@process/agent/wcore';
import type { WCoreAgentOptions } from '@process/agent/wcore';
import type { WCoreEvent } from '@process/agent/wcore/protocol';

type StreamEvent = { type: string; data: unknown; msg_id: string };

function makeAgent(onStreamEvent: (event: StreamEvent) => void): WCoreAgent {
  const options: WCoreAgentOptions = {
    workspace: '/ws',
    model: { name: 'test', useModel: 'test-model', platform: 'openai', baseUrl: '' } as WCoreAgentOptions['model'],
    onStreamEvent,
  };
  return new WCoreAgent(options);
}

/** Drive the private event dispatcher directly (no engine process needed). */
function dispatch(agent: WCoreAgent, event: WCoreEvent | Record<string, unknown>): void {
  (agent as unknown as { handleEvent: (event: WCoreEvent) => void }).handleEvent(event as WCoreEvent);
}

describe('WCoreAgent mcp_failed surfacing (#713)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('surfaces mcp_failed as an info stream event carrying the server name and reason', () => {
    const onStreamEvent = vi.fn<(event: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);

    const reason =
      'Transport error: HTTP request failed: egress denied: POST with body to a non-allowlisted host. ' +
      'Add it under `[security] egress_allow = [..]` in your config.';
    dispatch(agent, { type: 'mcp_failed', name: 'ai.fal-fal-mcp', reason });

    expect(onStreamEvent).toHaveBeenCalledTimes(1);
    const streamed = onStreamEvent.mock.calls[0][0];
    expect(streamed.type).toBe('info');
    expect(streamed.data).toContain('ai.fal-fal-mcp');
    expect(streamed.data).toContain('failed to connect');
    // The engine's remediation text must survive verbatim - it is the fix hint.
    expect(streamed.data).toContain('egress_allow');
  });

  it('is not dropped as an unknown event type', () => {
    const onStreamEvent = vi.fn<(event: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);

    dispatch(agent, { type: 'mcp_failed', name: 'srv', reason: 'connection refused' });

    const unknownDropWarns = warnSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('unknown event type')
    );
    expect(unknownDropWarns).toHaveLength(0);
    expect(onStreamEvent).toHaveBeenCalled();
  });

  it('stamps the active turn msg_id when a turn is in flight, and empty otherwise', () => {
    const onStreamEvent = vi.fn<(event: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);

    // Session start: no active turn yet -> system-level (empty msg_id) info.
    dispatch(agent, { type: 'mcp_failed', name: 'srv', reason: 'boom' });
    expect(onStreamEvent.mock.calls[0][0].msg_id).toBe('');

    // Mid-turn failure attaches to the in-flight turn (mirrors budget_exceeded).
    dispatch(agent, { type: 'stream_start', msg_id: 'msg-42' });
    onStreamEvent.mockClear();
    dispatch(agent, { type: 'mcp_failed', name: 'srv', reason: 'boom' });
    expect(onStreamEvent.mock.calls[0][0].msg_id).toBe('msg-42');
  });

  it('control: a genuinely unknown event type still warn-drops without a stream event', () => {
    const onStreamEvent = vi.fn<(event: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);

    dispatch(agent, { type: 'not_a_real_event_type', foo: 1 });

    expect(onStreamEvent).not.toHaveBeenCalled();
    const unknownDropWarns = warnSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('unknown event type "not_a_real_event_type"')
    );
    expect(unknownDropWarns).toHaveLength(1);
  });
});
