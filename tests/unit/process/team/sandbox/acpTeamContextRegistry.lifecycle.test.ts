/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W5 audit HIGH-2 (2026-05-19) - ACP team-context registry lifecycle.
 *
 * Verifies that every TeammateManager path that takes an agent out of
 * service drops its ACP team-context registration so a restart / removal
 * / dispose cannot leak the prior team's gate-routing context.
 *
 * Covered paths:
 *   - addAgent → registry populated for the new conversationId.
 *   - killAgentProcess(slotId) → registry entry cleared.
 *   - removeAgent(slotId) → registry entry cleared.
 *   - dispose() → all owned conversationIds cleared.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist mocks before any imports
// ---------------------------------------------------------------------------
const mockIpcBridge = vi.hoisted(() => ({
  team: {
    agentSpawned: { emit: vi.fn() },
    agentStatusChanged: { emit: vi.fn() },
    agentRemoved: { emit: vi.fn() },
    agentRenamed: { emit: vi.fn() },
  },
  acpConversation: { responseStream: { emit: vi.fn() } },
  conversation: { responseStream: { emit: vi.fn() } },
}));

vi.mock('@/common', () => ({ ipcBridge: mockIpcBridge }));
vi.mock('electron', () => ({ app: { getPath: vi.fn(() => '/tmp') } }));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: { getDetectedAgents: vi.fn(() => []) },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => null) },
}));

import { TeammateManager } from '@process/team/TeammateManager';
import { teamEventBus } from '@process/team/teamEventBus';
import type { TeamAgent, TTeam } from '@process/team/types';
import type { Mailbox } from '@process/team/Mailbox';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import {
  __resetAcpTeamContextRegistryForTests,
  getTeamContextForConversation,
} from '@process/team/sandbox/acpTeamContextRegistry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeAgent = (overrides: Partial<TeamAgent> = {}): TeamAgent => ({
  slotId: 'slot-leader',
  conversationId: 'conv-leader',
  role: 'leader',
  agentType: 'acp',
  agentName: 'Leader',
  conversationType: 'acp',
  status: 'idle',
  ...overrides,
});

const makeMailbox = (): Mailbox =>
  ({
    write: vi.fn(),
    readUnread: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue([]),
  }) as unknown as Mailbox;

const makeWorkerTaskManager = (): IWorkerTaskManager =>
  ({
    getOrBuildTask: vi.fn().mockResolvedValue({ sendMessage: vi.fn() }),
    kill: vi.fn(),
  }) as unknown as IWorkerTaskManager;

const makeTeamSnapshot =
  (team: TTeam): (() => Promise<TTeam>) =>
  async () =>
    team;

const buildImportedTeam = (agents: TeamAgent[]): TTeam => ({
  id: 'team-imp',
  userId: 'user-1',
  name: 'Imported Pack',
  workspace: '/tmp/ws',
  workspaceMode: 'shared',
  leaderAgentId: agents[0]?.slotId ?? 'slot-leader',
  agents,
  importedFrom: 'pack.json',
  isSandboxed: true,
  importCapabilityGrants: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
});

const buildImportedManager = (initial: TeamAgent[]) => {
  const team = buildImportedTeam(initial);
  const mgr = new TeammateManager({
    teamId: team.id,
    agents: initial,
    mailbox: makeMailbox(),
    workerTaskManager: makeWorkerTaskManager(),
    isImported: true,
    isSandboxed: true,
    getTeamSnapshot: makeTeamSnapshot(team),
  });
  return { mgr, team };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TeammateManager - ACP team-context registry lifecycle (W5 HIGH-2)', () => {
  beforeEach(() => {
    __resetAcpTeamContextRegistryForTests();
    vi.clearAllMocks();
  });

  afterEach(() => {
    __resetAcpTeamContextRegistryForTests();
    teamEventBus.removeAllListeners();
  });

  it('constructor registers each initial imported-team agent', () => {
    const leader = makeAgent({ slotId: 'slot-leader', conversationId: 'conv-1' });
    const mate = makeAgent({
      slotId: 'slot-mate',
      conversationId: 'conv-2',
      role: 'teammate',
      agentName: 'Mate',
    });
    const { mgr } = buildImportedManager([leader, mate]);
    expect(getTeamContextForConversation('conv-1')).toBeDefined();
    expect(getTeamContextForConversation('conv-2')).toBeDefined();
    mgr.dispose();
  });

  it('addAgent registers the new conversationId; killAgentProcess clears it', () => {
    const leader = makeAgent({ slotId: 'slot-leader', conversationId: 'conv-leader' });
    const { mgr } = buildImportedManager([leader]);
    expect(getTeamContextForConversation('conv-leader')).toBeDefined();

    const mate = makeAgent({
      slotId: 'slot-mate',
      conversationId: 'conv-mate',
      role: 'teammate',
      agentName: 'Mate',
    });
    mgr.addAgent(mate);
    expect(getTeamContextForConversation('conv-mate')).toBeDefined();

    mgr.killAgentProcess('slot-mate');
    expect(getTeamContextForConversation('conv-mate')).toBeUndefined();
    // Leader untouched.
    expect(getTeamContextForConversation('conv-leader')).toBeDefined();

    mgr.dispose();
  });

  it('removeAgent clears the conversationId from the registry', () => {
    const leader = makeAgent({ slotId: 'slot-leader', conversationId: 'conv-leader' });
    const mate = makeAgent({
      slotId: 'slot-mate',
      conversationId: 'conv-mate',
      role: 'teammate',
      agentName: 'Mate',
    });
    const { mgr } = buildImportedManager([leader, mate]);
    expect(getTeamContextForConversation('conv-mate')).toBeDefined();

    mgr.removeAgent('slot-mate');
    expect(getTeamContextForConversation('conv-mate')).toBeUndefined();
    // Leader untouched.
    expect(getTeamContextForConversation('conv-leader')).toBeDefined();

    mgr.dispose();
  });

  it('dispose clears EVERY previously registered conversationId for the team', () => {
    const leader = makeAgent({ slotId: 'slot-leader', conversationId: 'conv-a' });
    const mate1 = makeAgent({
      slotId: 'slot-1',
      conversationId: 'conv-b',
      role: 'teammate',
      agentName: 'B',
    });
    const mate2 = makeAgent({
      slotId: 'slot-2',
      conversationId: 'conv-c',
      role: 'teammate',
      agentName: 'C',
    });
    const { mgr } = buildImportedManager([leader, mate1, mate2]);
    expect(getTeamContextForConversation('conv-a')).toBeDefined();
    expect(getTeamContextForConversation('conv-b')).toBeDefined();
    expect(getTeamContextForConversation('conv-c')).toBeDefined();

    mgr.dispose();

    expect(getTeamContextForConversation('conv-a')).toBeUndefined();
    expect(getTeamContextForConversation('conv-b')).toBeUndefined();
    expect(getTeamContextForConversation('conv-c')).toBeUndefined();
  });

  it('non-imported team: killAgentProcess is a no-op on the registry (and never registered)', () => {
    const leader = makeAgent({ slotId: 'slot-leader', conversationId: 'conv-x' });
    // Build a manager WITHOUT isImported/getTeamSnapshot - registration is a no-op.
    const mgr = new TeammateManager({
      teamId: 'team-plain',
      agents: [leader],
      mailbox: makeMailbox(),
      workerTaskManager: makeWorkerTaskManager(),
    });
    expect(getTeamContextForConversation('conv-x')).toBeUndefined();
    mgr.killAgentProcess('slot-leader');
    expect(getTeamContextForConversation('conv-x')).toBeUndefined();
    mgr.dispose();
  });
});
