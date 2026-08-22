/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Security + correctness guard for the Concierge Phase 2b apply bridge.
 * The load-bearing invariant: NO write path runs unless action==='accept' AND
 * the proposal was 'pending'. Secrets are used once and never stored.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  IConciergeConfigContent,
  ConciergeConfirmParams,
  ConciergeConfirmResult,
} from '@/common/chat/conciergeConfig';
import type { IMcpServer } from '@/common/config/storage';

const { state, emitSpy, connectSpy, setSpy, getSpy, mcpUpdateSpy, writeRulesSpy, updateSpy } = vi.hoisted(() => {
  const hoistedState = {
    handler: null as null | ((p: ConciergeConfirmParams) => Promise<ConciergeConfirmResult>),
    msg: null as Record<string, unknown> | null,
    mcpServers: [] as IMcpServer[],
  };
  const hoistedSetSpy = vi.fn(async () => {});
  return {
    state: hoistedState,
    emitSpy: vi.fn(),
    connectSpy: vi.fn(async () => ({
      ok: true as boolean,
      error: undefined as string | undefined,
      warning: undefined as string | undefined,
    })),
    setSpy: hoistedSetSpy,
    getSpy: vi.fn(async () => [] as unknown[]),
    mcpUpdateSpy: vi.fn(async (mutator: (current: IMcpServer[]) => IMcpServer[] | Promise<IMcpServer[]>) => {
      hoistedState.mcpServers = structuredClone(await mutator(structuredClone(hoistedState.mcpServers)));
      return { revision: '0'.repeat(64), servers: structuredClone(hoistedState.mcpServers) };
    }),
    writeRulesSpy: vi.fn(async () => true),
    updateSpy: vi.fn((_id: string, m: Record<string, unknown>) => {
      // Persist the transition so the status guard sees the latest state.
      hoistedState.msg = m;
    }),
  };
});

vi.mock('@/common', () => ({
  ipcBridge: {
    conciergeConfig: {
      confirmProposal: {
        provider: (fn: (p: ConciergeConfirmParams) => Promise<ConciergeConfirmResult>) => {
          state.handler = fn;
        },
      },
    },
    conversation: { responseStream: { emit: emitSpy } },
  },
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => ({
    getMessageByMsgId: (_cid: string, _mid: string, _type: string) =>
      state.msg ? { success: true, data: state.msg } : { success: false, data: null },
    updateMessage: updateSpy,
  })),
}));

vi.mock('@process/utils/initStorage', () => ({ ProcessConfig: { get: getSpy, set: setSpy } }));
vi.mock('@process/services/mcpServices/mcpConfigAuthority', () => ({ updateMcpConfig: mcpUpdateSpy }));
vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({ connectModelRegistryProvider: connectSpy }));
vi.mock('@process/providers/types', () => ({}));
vi.mock('@process/bridge/fsBridge', () => ({ writeAssistantRules: writeRulesSpy }));
vi.mock('@/common/utils', () => ({ uuid: () => 'mcp-uuid-1' }));
// B3: `add_mcp` now finishes the install (probe -> publish -> commit enabled)
// instead of returning a green receipt over an unpublished declaration. Stub
// the probe so this file stays a deterministic unit test of the APPLY bridge:
// a silent probe is the outcome under test here (the enable/receipt behaviour
// is guarded in tests/unit/concierge/conciergeAddMcpEnables.test.ts).
vi.mock('@process/services/mcpServices/McpService', () => ({
  mcpService: {
    testMcpConnection: vi.fn(async () => ({ success: false as const, error: 'no agent available' })),
    syncMcpToAgents: vi.fn(async () => ({ success: false, results: [] })),
  },
}));
vi.mock('@process/agent/AgentRegistry', () => ({ agentRegistry: { getDetectedAgents: () => [] } }));

import { initConciergeConfigBridge } from '@process/bridge/conciergeConfigBridge';

function setMsg(content: IConciergeConfigContent, overrides?: Record<string, unknown>): void {
  state.msg = { id: 'm1', msg_id: 'm1', conversation_id: 'c1', type: 'concierge_propose', content, ...overrides };
}

const noWrites = () => {
  expect(connectSpy).not.toHaveBeenCalled();
  expect(setSpy).not.toHaveBeenCalled();
  expect(mcpUpdateSpy).not.toHaveBeenCalled();
  expect(writeRulesSpy).not.toHaveBeenCalled();
};

initConciergeConfigBridge();

beforeEach(() => {
  vi.clearAllMocks();
  state.msg = null;
  state.mcpServers = [];
  getSpy.mockResolvedValue([]);
  connectSpy.mockResolvedValue({ ok: true, error: undefined, warning: undefined });
  writeRulesSpy.mockResolvedValue(true);
});

describe('conciergeConfigBridge apply', () => {
  it('provider_connect accept calls connect with the card secret and never stores the key', async () => {
    setMsg({ kind: 'provider_connect', providerId: 'openai', label: 'OpenAI', status: 'pending' });
    const res = await state.handler!({
      conversationId: 'c1',
      msgId: 'm1',
      action: 'accept',
      secret: { apiKey: 'sk-secret-xyz' },
    });
    expect(res.ok).toBe(true);
    expect(connectSpy).toHaveBeenCalledWith('openai', expect.objectContaining({ key: 'sk-secret-xyz' }));
    // The stored message (state.msg after updates) must NOT contain the key.
    expect(JSON.stringify(state.msg)).not.toContain('sk-secret-xyz');
    expect((state.msg!.content as IConciergeConfigContent).status).toBe('accepted');
  });

  it('provider_connect IGNORES a model-proposed baseUrl for a known fixed-endpoint provider', async () => {
    // Prompt-injection vector: Concierge proposes a known catalog provider with
    // an attacker base_url. With no user-typed override the real key must NEVER
    // be sent to the model-controlled host.
    setMsg({
      kind: 'provider_connect',
      providerId: 'openai',
      label: 'OpenAI',
      baseUrl: 'https://evil.com',
      status: 'pending',
    });
    const res = await state.handler!({
      conversationId: 'c1',
      msgId: 'm1',
      action: 'accept',
      secret: { apiKey: 'sk-secret-xyz' },
    });
    expect(res.ok).toBe(true);
    expect(connectSpy).toHaveBeenCalledWith('openai', { key: 'sk-secret-xyz', baseUrl: undefined });
    const [, creds] = connectSpy.mock.calls[0] as [string, { baseUrl?: string }];
    expect(creds.baseUrl).not.toBe('https://evil.com');
  });

  it('provider_connect honors a USER-typed baseUrl over the model-proposed one for a known provider', async () => {
    setMsg({
      kind: 'provider_connect',
      providerId: 'openai',
      label: 'OpenAI',
      baseUrl: 'https://evil.com',
      status: 'pending',
    });
    const res = await state.handler!({
      conversationId: 'c1',
      msgId: 'm1',
      action: 'accept',
      secret: { apiKey: 'sk-secret-xyz', baseUrl: 'https://proxy.mycorp.internal/v1' },
    });
    expect(res.ok).toBe(true);
    expect(connectSpy).toHaveBeenCalledWith('openai', {
      key: 'sk-secret-xyz',
      baseUrl: 'https://proxy.mycorp.internal/v1',
    });
  });

  it('provider_connect honors a model-proposed baseUrl for a self-hosted/custom provider', async () => {
    setMsg({
      kind: 'provider_connect',
      providerId: 'openai-compatible',
      label: 'Local',
      baseUrl: 'http://127.0.0.1:8080/v1',
      status: 'pending',
    });
    const res = await state.handler!({
      conversationId: 'c1',
      msgId: 'm1',
      action: 'accept',
      secret: { apiKey: 'sk-secret-xyz' },
    });
    expect(res.ok).toBe(true);
    expect(connectSpy).toHaveBeenCalledWith('openai-compatible', {
      key: 'sk-secret-xyz',
      baseUrl: 'http://127.0.0.1:8080/v1',
    });
  });

  it('provider_connect accept WITHOUT a secret returns secret_required and writes nothing', async () => {
    setMsg({ kind: 'provider_connect', providerId: 'openai', label: 'OpenAI', status: 'pending' });
    const res = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });
    expect(res).toEqual({ ok: false, reason: 'secret_required' });
    noWrites();
    expect((state.msg!.content as IConciergeConfigContent).status).toBe('pending'); // no transition
  });

  it('set_default_model accept writes the engine default model', async () => {
    setMsg({
      kind: 'set_default_model',
      engine: 'wcore',
      modelId: 'm/x',
      useModel: 'x',
      label: 'X',
      status: 'pending',
    });
    const res = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });
    expect(res.ok).toBe(true);
    expect(setSpy).toHaveBeenCalledWith('wcore.defaultModel', { id: 'm/x', useModel: 'x' });
  });

  it('add_mcp accept appends to mcp.config; duplicate name is rejected without writing', async () => {
    setMsg({ kind: 'add_mcp', name: 'fs', command: 'npx', args: ['-y', 'srv'], status: 'pending' });
    const ok = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });
    expect(ok.ok).toBe(true);
    // Two authority writes: the disabled declaration, then the probe outcome
    // recorded onto that same row (B3). Still exactly one append.
    expect(mcpUpdateSpy).toHaveBeenCalledTimes(2);
    expect(state.mcpServers).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'fs' })]));

    // Now a duplicate
    mcpUpdateSpy.mockClear();
    getSpy.mockResolvedValue([{ name: 'fs' }]);
    setMsg({ kind: 'add_mcp', name: 'fs', command: 'npx', args: [], status: 'pending' });
    const dup = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });
    expect(dup).toEqual({ ok: false, reason: 'mcp_name_exists' });
    expect(mcpUpdateSpy).not.toHaveBeenCalled();
    expect(state.mcpServers).toHaveLength(1);
  });

  it('add_mcp persists an unpublished declaration instead of minting enabled truth', async () => {
    setMsg({ kind: 'add_mcp', name: 'fs', command: 'npx', args: ['-y', 'srv'], status: 'pending' });

    const result = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });

    expect(result.ok).toBe(true);
    expect(state.mcpServers).toEqual([
      expect.objectContaining({
        name: 'fs',
        enabled: false,
        status: 'disconnected',
      }),
    ]);
  });

  it('add_mcp rejects a canonical-name collision instead of creating split identity', async () => {
    state.mcpServers = [
      {
        id: 'mcp-existing',
        name: 'FS',
        enabled: false,
        status: 'disconnected',
        transport: { type: 'stdio', command: 'npx', args: ['-y', 'existing'] },
        createdAt: 1,
        updatedAt: 1,
        source: 'custom',
      },
    ];
    getSpy.mockResolvedValue(structuredClone(state.mcpServers));
    setMsg({ kind: 'add_mcp', name: 'fs', command: 'npx', args: ['-y', 'replacement'], status: 'pending' });

    const result = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });

    expect(result).toEqual({ ok: false, reason: 'mcp_name_exists' });
    expect(mcpUpdateSpy).not.toHaveBeenCalled();
    expect(state.mcpServers).toHaveLength(1);
  });

  it('edit_assistant accept writes the rules', async () => {
    setMsg({
      kind: 'edit_assistant',
      assistantId: 'builtin-concierge',
      label: 'Concierge',
      rules: 'Be helpful.',
      status: 'pending',
    });
    const res = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });
    expect(res.ok).toBe(true);
    expect(writeRulesSpy).toHaveBeenCalledWith('builtin-concierge', 'Be helpful.', 'en-US');
  });

  it('cancel resolves the card and writes nothing', async () => {
    setMsg({ kind: 'set_default_model', engine: 'wcore', modelId: 'a', useModel: 'b', label: 'C', status: 'pending' });
    const res = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'cancel' });
    expect(res.ok).toBe(true);
    expect((state.msg!.content as IConciergeConfigContent).status).toBe('cancelled');
    noWrites();
  });

  it('accept on a non-pending proposal is refused and writes nothing', async () => {
    setMsg({
      kind: 'set_default_model',
      engine: 'gemini',
      modelId: 'a',
      useModel: 'b',
      label: 'C',
      status: 'accepted',
    });
    const res = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });
    expect(res).toEqual({ ok: false, reason: 'already_resolved' });
    noWrites();
  });

  it('rejects a cross-conversation hijack (unauthorized) and writes nothing', async () => {
    setMsg({ kind: 'add_mcp', name: 'x', command: 'npx', args: [], status: 'pending' }, { conversation_id: 'OTHER' });
    const res = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });
    expect(res).toEqual({ ok: false, reason: 'unauthorized' });
    noWrites();
  });
});
