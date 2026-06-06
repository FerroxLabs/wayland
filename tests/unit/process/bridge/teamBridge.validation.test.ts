/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W5 audit HIGH-1 (2026-05-19) - bridge-layer boundary validation tests.
 *
 * For each new W4 IPC provider (importPreview, importAccept, export,
 * suggestRoster, restartAgent, promoteToStanding, demoteFromStanding) we
 * assert two things:
 *
 *   1. A valid payload reaches the service layer.
 *   2. A malformed payload (wrong type / missing field / extra field via
 *      strict / oversize string) is rejected at the boundary, returns the
 *      `__bridgeError` sentinel, and never reaches the mocked service.
 *
 * We capture the provider callback registered by `initTeamBridge` and call
 * it directly so the test bypasses Electron IPC plumbing entirely.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const providerCallbacks = new Map<string, (...args: unknown[]) => unknown>();

function mockProvider(name: string) {
  return {
    provider: vi.fn((cb: (...args: unknown[]) => unknown) => {
      providerCallbacks.set(name, cb);
    }),
    emit: vi.fn(),
  };
}

vi.mock('@/common', () => ({
  ipcBridge: {
    team: {
      create: mockProvider('team.create'),
      list: mockProvider('team.list'),
      get: mockProvider('team.get'),
      remove: mockProvider('team.remove'),
      addAgent: mockProvider('team.addAgent'),
      removeAgent: mockProvider('team.removeAgent'),
      restartAgent: mockProvider('team.restartAgent'),
      sendMessage: mockProvider('team.sendMessage'),
      sendMessageToAgent: mockProvider('team.sendMessageToAgent'),
      stop: mockProvider('team.stop'),
      ensureSession: mockProvider('team.ensureSession'),
      renameAgent: mockProvider('team.renameAgent'),
      changeAgentBackend: mockProvider('team.changeAgentBackend'),
      renameTeam: mockProvider('team.renameTeam'),
      setSessionMode: mockProvider('team.setSessionMode'),
      updateWorkspace: mockProvider('team.updateWorkspace'),
      promoteToStanding: mockProvider('team.promoteToStanding'),
      demoteFromStanding: mockProvider('team.demoteFromStanding'),
      listEvents: mockProvider('team.listEvents'),
      suggestRoster: mockProvider('team.suggestRoster'),
      export: mockProvider('team.export'),
      importPreview: mockProvider('team.importPreview'),
      importAccept: mockProvider('team.importAccept'),
      agentStatusChanged: { emit: vi.fn() },
      agentSpawned: { emit: vi.fn() },
      agentRemoved: { emit: vi.fn() },
      agentRenamed: { emit: vi.fn() },
      listChanged: { emit: vi.fn() },
      mcpStatus: { emit: vi.fn() },
    },
  },
}));

vi.mock('@process/extensions/ExtensionRegistry', () => ({
  ExtensionRegistry: {
    getInstance: () => ({ getAssistants: () => [] }),
  },
}));

vi.mock('@process/team/suggestRoster', () => ({
  suggestRoster: vi.fn(async () => ({ slots: [], reasoning: 'mock' })),
}));

// Import after mocks
const { initTeamBridge } = await import('@/process/bridge/teamBridge');
const { suggestRoster } = await import('@process/team/suggestRoster');

type ProviderCallback = (params: unknown) => Promise<unknown>;

// Build a service stub whose every method is a vi.fn() so individual tests
// can assert .toHaveBeenCalled() / .not.toHaveBeenCalled() per endpoint.
function makeService() {
  return {
    createTeam: vi.fn(async () => ({ id: 't' })),
    listTeams: vi.fn(async () => []),
    getTeam: vi.fn(async () => null),
    deleteTeam: vi.fn(async () => undefined),
    addAgent: vi.fn(async () => ({})),
    removeAgent: vi.fn(async () => undefined),
    restartAgent: vi.fn(async () => undefined),
    renameAgent: vi.fn(async () => undefined),
    renameTeam: vi.fn(async () => undefined),
    setSessionMode: vi.fn(async () => undefined),
    updateWorkspace: vi.fn(async () => undefined),
    promoteTeamToStanding: vi.fn(async () => undefined),
    demoteTeamFromStanding: vi.fn(async () => undefined),
    stopSession: vi.fn(async () => undefined),
    getOrStartSession: vi.fn(async () => ({
      sendMessage: vi.fn(),
      sendMessageToAgent: vi.fn(),
    })),
    listEvents: vi.fn(async () => []),
    exportTeam: vi.fn(async () => '{}'),
    previewTeamImport: vi.fn(async () => ({
      parsed: {} as never,
      specialistsAvailable: true,
      missingSpecialists: [],
    })),
    acceptTeamImport: vi.fn(async () => ({ id: 't' })),
    stopAllSessions: vi.fn(async () => undefined),
  };
}

const isBridgeError = (v: unknown): v is { __bridgeError: true; message: string } =>
  typeof v === 'object' && v !== null && (v as { __bridgeError?: boolean }).__bridgeError === true;

describe('teamBridge - W5 HIGH-1 IPC boundary validation', () => {
  let service: ReturnType<typeof makeService>;

  beforeEach(() => {
    providerCallbacks.clear();
    service = makeService();
    vi.clearAllMocks();
    initTeamBridge(service as never);
  });

  // -------------------- restartAgent --------------------

  describe('restartAgent', () => {
    const cb = (): ProviderCallback => providerCallbacks.get('team.restartAgent') as ProviderCallback;

    it('passes a valid payload through to the service', async () => {
      const out = await cb()({ teamId: 'team-1', slotId: 'slot-a' });
      expect(out).toBeUndefined();
      expect(service.restartAgent).toHaveBeenCalledWith('team-1', 'slot-a');
    });

    it('rejects missing slotId at the boundary', async () => {
      const out = await cb()({ teamId: 'team-1' });
      expect(isBridgeError(out)).toBe(true);
      expect(service.restartAgent).not.toHaveBeenCalled();
    });

    it('rejects extra fields via strict()', async () => {
      const out = await cb()({ teamId: 'team-1', slotId: 'slot-a', sneaky: true });
      expect(isBridgeError(out)).toBe(true);
      expect(service.restartAgent).not.toHaveBeenCalled();
    });

    it('rejects oversize teamId', async () => {
      const out = await cb()({ teamId: 'x'.repeat(65), slotId: 'slot-a' });
      expect(isBridgeError(out)).toBe(true);
      expect(service.restartAgent).not.toHaveBeenCalled();
    });
  });

  // -------------------- promoteToStanding --------------------

  describe('promoteToStanding', () => {
    const cb = (): ProviderCallback => providerCallbacks.get('team.promoteToStanding') as ProviderCallback;

    it('passes a valid teamId through', async () => {
      await cb()({ teamId: 'team-1' });
      expect(service.promoteTeamToStanding).toHaveBeenCalledWith('team-1');
    });

    it('rejects wrong-type teamId', async () => {
      const out = await cb()({ teamId: 42 });
      expect(isBridgeError(out)).toBe(true);
      expect(service.promoteTeamToStanding).not.toHaveBeenCalled();
    });

    it('rejects missing teamId', async () => {
      const out = await cb()({});
      expect(isBridgeError(out)).toBe(true);
      expect(service.promoteTeamToStanding).not.toHaveBeenCalled();
    });
  });

  // -------------------- demoteFromStanding --------------------

  describe('demoteFromStanding', () => {
    const cb = (): ProviderCallback => providerCallbacks.get('team.demoteFromStanding') as ProviderCallback;

    it('passes a valid teamId through', async () => {
      await cb()({ teamId: 'team-1' });
      expect(service.demoteTeamFromStanding).toHaveBeenCalledWith('team-1');
    });

    it('rejects extra fields via strict()', async () => {
      const out = await cb()({ teamId: 'team-1', extra: 1 });
      expect(isBridgeError(out)).toBe(true);
      expect(service.demoteTeamFromStanding).not.toHaveBeenCalled();
    });
  });

  // -------------------- export --------------------

  describe('export', () => {
    const cb = (): ProviderCallback => providerCallbacks.get('team.export') as ProviderCallback;

    it('passes a valid teamId through', async () => {
      const out = await cb()({ teamId: 'team-1' });
      expect(out).toBe('{}');
      expect(service.exportTeam).toHaveBeenCalled();
    });

    it('rejects empty teamId', async () => {
      const out = await cb()({ teamId: '' });
      expect(isBridgeError(out)).toBe(true);
      expect(service.exportTeam).not.toHaveBeenCalled();
    });
  });

  // -------------------- suggestRoster --------------------

  describe('suggestRoster', () => {
    const cb = (): ProviderCallback => providerCallbacks.get('team.suggestRoster') as ProviderCallback;

    it('passes a valid payload through', async () => {
      await cb()({
        goalText: 'build an affiliate site',
        specialists: [{ id: 'a' }, { id: 'b' }],
        detectedBackends: ['gemini', 'claude'],
        targetSize: 4,
      });
      expect(suggestRoster).toHaveBeenCalledTimes(1);
    });

    it('rejects when specialists array exceeds 200', async () => {
      const out = await cb()({
        goalText: 'x',
        specialists: Array.from({ length: 201 }, () => ({ id: 'x' })),
        detectedBackends: [],
      });
      expect(isBridgeError(out)).toBe(true);
      expect(suggestRoster).not.toHaveBeenCalled();
    });

    it('rejects when targetSize is out of bounds', async () => {
      const out = await cb()({
        goalText: 'x',
        specialists: [],
        detectedBackends: [],
        targetSize: 99,
      });
      expect(isBridgeError(out)).toBe(true);
      expect(suggestRoster).not.toHaveBeenCalled();
    });

    it('rejects oversize goalText', async () => {
      const out = await cb()({
        goalText: 'x'.repeat(8193),
        specialists: [],
        detectedBackends: [],
      });
      expect(isBridgeError(out)).toBe(true);
      expect(suggestRoster).not.toHaveBeenCalled();
    });
  });

  // -------------------- importPreview --------------------

  describe('importPreview', () => {
    const cb = (): ProviderCallback => providerCallbacks.get('team.importPreview') as ProviderCallback;

    it('passes a valid jsonText through to the service', async () => {
      await cb()({ jsonText: '{"a":1}' });
      expect(service.previewTeamImport).toHaveBeenCalled();
    });

    it('rejects jsonText that exceeds the 1MiB bridge cap', async () => {
      const out = await cb()({ jsonText: 'x'.repeat(1024 * 1024 + 1) });
      expect(isBridgeError(out)).toBe(true);
      expect(service.previewTeamImport).not.toHaveBeenCalled();
    });

    it('rejects wrong-type jsonText', async () => {
      const out = await cb()({ jsonText: 123 });
      expect(isBridgeError(out)).toBe(true);
      expect(service.previewTeamImport).not.toHaveBeenCalled();
    });

    it('rejects extra fields via strict()', async () => {
      const out = await cb()({ jsonText: '{}', extra: 'x' });
      expect(isBridgeError(out)).toBe(true);
      expect(service.previewTeamImport).not.toHaveBeenCalled();
    });
  });

  // -------------------- importAccept --------------------

  describe('importAccept', () => {
    const cb = (): ProviderCallback => providerCallbacks.get('team.importAccept') as ProviderCallback;
    const validParsed = {
      version: 'v1',
      id: 'team-1',
      name: 'X',
      leader: { id: 'leader' },
      teammates: [],
      capabilities: {
        canReadFiles: false,
        canWriteFiles: false,
        canSpawnAgents: false,
        canNetworkRequest: false,
        canCrossTeamMessage: false,
      },
    };

    it('passes a valid payload through to the service', async () => {
      await cb()({
        userId: 'user-1',
        parsed: validParsed,
        capabilityGrants: {},
        source: 'pack.json',
      });
      expect(service.acceptTeamImport).toHaveBeenCalledTimes(1);
    });

    it('rejects when userId is missing', async () => {
      const out = await cb()({
        parsed: validParsed,
        capabilityGrants: {},
        source: 'pack.json',
      });
      expect(isBridgeError(out)).toBe(true);
      expect(service.acceptTeamImport).not.toHaveBeenCalled();
    });

    it('rejects when capabilityGrants is not a Record<string,boolean>', async () => {
      const out = await cb()({
        userId: 'user-1',
        parsed: validParsed,
        capabilityGrants: { canReadFiles: 'yes' },
        source: 'pack.json',
      });
      expect(isBridgeError(out)).toBe(true);
      expect(service.acceptTeamImport).not.toHaveBeenCalled();
    });

    it('rejects extra fields via strict()', async () => {
      const out = await cb()({
        userId: 'user-1',
        parsed: validParsed,
        capabilityGrants: {},
        source: 'pack.json',
        sneaky: true,
      });
      expect(isBridgeError(out)).toBe(true);
      expect(service.acceptTeamImport).not.toHaveBeenCalled();
    });

    it('rejects oversize source', async () => {
      const out = await cb()({
        userId: 'user-1',
        parsed: validParsed,
        capabilityGrants: {},
        source: 'x'.repeat(257),
      });
      expect(isBridgeError(out)).toBe(true);
      expect(service.acceptTeamImport).not.toHaveBeenCalled();
    });
  });
});
