/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// #980 regression, executed against the REAL SqliteTeamRepository.
//
// TeammateManager.setStatus persists on every transition, which makes
// `teams.agents[].status` live data. restartAgent used to snapshot the team,
// then write the WHOLE `agents` blob back from that snapshot - so any status
// another writer committed in between was silently reverted. The stale value
// then met reconcilePersistedStatuses on the next session load, which turns a
// stale `active` into `pending`: a wrong right-rail dot for a member that is
// actually idle, plus a full role prompt re-sent on its next wake. A clobbered
// `failed` loses the durable failure record outright.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockIpcBridge = vi.hoisted(() => ({
  team: {
    agentStatusChanged: { emit: vi.fn() },
    agentSpawned: { emit: vi.fn() },
    agentRemoved: { emit: vi.fn() },
    agentRenamed: { emit: vi.fn() },
    listChanged: { emit: vi.fn() },
    mcpStatus: { emit: vi.fn() },
  },
}));

vi.mock('@/common', () => ({ ipcBridge: mockIpcBridge }));
vi.mock('electron', () => ({ app: { getPath: vi.fn(() => '/tmp') } }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => null) },
  getAssistantsDir: () => '/assistants',
}));

import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { SqliteTeamRepository } from '@process/team/repository/SqliteTeamRepository';
import { TeamSessionService } from '@process/team/TeamSessionService';
import type { IConversationService } from '@process/services/IConversationService';
import type { TTeam } from '@process/team/types';
import { describeNativeSqlite } from '../../helpers/nativeSqlite';

function makeTeam(): TTeam {
  return {
    id: 'team-1',
    userId: 'user-1',
    name: 'Team',
    workspace: '/tmp/ws',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-leader',
    agents: [
      {
        slotId: 'slot-leader',
        conversationId: 'conv-leader',
        role: 'leader',
        agentType: 'gemini',
        agentName: 'Lead',
        conversationType: 'gemini',
        status: 'active',
      },
      {
        slotId: 'slot-1',
        conversationId: 'conv-1',
        role: 'teammate',
        agentType: 'gemini',
        agentName: 'Copy',
        conversationType: 'gemini',
        status: 'failed',
      },
    ],
    createdAt: 1,
    updatedAt: 1,
  };
}

describeNativeSqlite('TeamSessionService.restartAgent does not clobber live statuses (#980)', () => {
  let driver: BetterSqlite3Driver;
  let repo: SqliteTeamRepository;
  const services: TeamSessionService[] = [];

  beforeEach(async () => {
    vi.clearAllMocks();
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    driver
      .prepare(`INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .run('user-1', 'testuser', 'hash', 1000, 1000);
    repo = new SqliteTeamRepository(driver);
    await repo.create(makeTeam());
  });

  afterEach(async () => {
    await Promise.all(services.splice(0).map((svc) => svc.stopAllSessions()));
    driver.close();
  });

  function newService(): TeamSessionService {
    const conversationService = {
      createConversation: vi.fn(),
      deleteConversation: vi.fn(),
      updateConversation: vi.fn(),
      getConversation: vi.fn(),
      createWithMigration: vi.fn(),
      listAllConversations: vi.fn(),
    } as unknown as IConversationService;
    const svc = new TeamSessionService(repo, { getOrBuildTask: vi.fn(), kill: vi.fn() } as never, conversationService);
    services.push(svc);
    return svc;
  }

  async function statusOf(slotId: string): Promise<string | undefined> {
    const team = await repo.findById('team-1');
    return team?.agents.find((a) => a.slotId === slotId)?.status;
  }

  /**
   * Install a live session whose killAgentProcess commits a status write, which
   * is exactly where the real one lands: restartAgent calls killAgentProcess
   * BETWEEN its own findById snapshot and its persist, and killAgentProcess
   * drives setStatus('pending') -> an un-awaited updateAgentStatuses. That is
   * the interleaving a whole-row write from the snapshot reverts.
   */
  function installSessionWritingStatusDuringKill(
    svc: TeamSessionService,
    slotId: string,
    status: 'idle' | 'failed'
  ): { writes: Promise<unknown>[] } {
    const writes: Promise<unknown>[] = [];
    const fakeSession = {
      isWakeActive: vi.fn().mockReturnValue(false),
      killAgentProcess: vi.fn(() => {
        writes.push(repo.updateAgentStatuses('team-1', [{ slotId, status }]));
      }),
    };
    (svc as unknown as { sessions: Map<string, unknown> }).sessions.set('team-1', fakeSession);
    return { writes };
  }

  it('preserves a status committed between its snapshot and its write', async () => {
    const svc = newService();
    const { writes } = installSessionWritingStatusDuringKill(svc, 'slot-leader', 'idle');

    await svc.restartAgent('team-1', 'slot-1');
    await Promise.all(writes);

    // KNOWN POSITIVE for the probe itself: the restart did happen.
    expect(await statusOf('slot-1')).toBe('pending');
    // The concurrent write survives. `active` here would be the clobber.
    expect(await statusOf('slot-leader')).toBe('idle');
  });

  it('preserves a durable failed committed in that same window', async () => {
    const svc = newService();
    const { writes } = installSessionWritingStatusDuringKill(svc, 'slot-leader', 'failed');

    await svc.restartAgent('team-1', 'slot-1');
    await Promise.all(writes);

    expect(await statusOf('slot-leader')).toBe('failed');
  });

  it('KNOWN POSITIVE: the whole-row path really does revert that write', async () => {
    // Same interleaving, driven straight at the repository, proving the window
    // is real and the assertions above are not passing by accident.
    const snapshot = (await repo.findById('team-1'))!;
    await repo.updateAgentStatuses('team-1', [{ slotId: 'slot-leader', status: 'idle' }]);
    expect(await statusOf('slot-leader')).toBe('idle');

    await repo.update('team-1', {
      agents: snapshot.agents.map((a) => (a.slotId === 'slot-1' ? { ...a, status: 'pending' as const } : a)),
      updatedAt: Date.now(),
    });

    expect(await statusOf('slot-leader')).toBe('active');
  });

  it('still preserves fields it does not own, such as a concurrent rename', async () => {
    const svc = newService();
    await repo.update('team-1', { name: 'Renamed', updatedAt: Date.now() });

    await svc.restartAgent('team-1', 'slot-1');

    const team = await repo.findById('team-1');
    expect(team?.name).toBe('Renamed');
    expect(await statusOf('slot-1')).toBe('pending');
  });
});
