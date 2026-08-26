/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1057 - the five remaining whole-row `agents` writers lose a concurrent
 * teammate status write, executed against the REAL SqliteTeamRepository.
 *
 * `TeammateManager.setStatus` persists every transition, so `teams.agents[].status`
 * is live data. `restartAgent` was moved onto the atomic `updateAgentStatuses`
 * writer in 6ce2b3121, but these callers still re-write the whole agents blob
 * from a snapshot taken earlier and each can revert a status committed in
 * between:
 *
 *   TeamSessionService.spawnAgent / renameAgent / changeAgentBackend / removeAgent
 *   TeamSession's rename + roster persistence
 *
 * The consequence is degraded, not corrupt: a stale `active` meets
 * `reconcilePersistedStatuses` on the next session load and becomes `pending`,
 * which is a wrong right-rail state for a member that is actually idle plus a
 * full role prompt re-sent on its next wake. A clobbered `failed` loses the
 * durable failure record outright.
 *
 * Every test below interleaves TWO writers against one repository:
 *   1. a caller reads the team (its snapshot),
 *   2. a teammate status write commits (asserted as a KNOWN POSITIVE so a
 *      broken probe cannot pass by writing nothing),
 *   3. the caller performs its roster change,
 *   4. the status from step 2 must still be there.
 */

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
import { SqliteTeamRepository } from '@process/team/repository/SqliteTeamRepository';
import { TeamSession } from '@process/team/TeamSession';
import { TeamSessionService } from '@process/team/TeamSessionService';
import type { IConversationService } from '@process/services/IConversationService';
import type { TeamAgent, TTeam } from '@process/team/types';
import { NodeSqliteDriver } from '../../helpers/nodeSqliteDriver';

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
        agentType: 'claude',
        agentName: 'Copy',
        conversationType: 'acp',
        status: 'active',
      },
    ],
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('whole-row agents writers preserve concurrent status writes (#1057)', () => {
  let driver: NodeSqliteDriver;
  let repo: SqliteTeamRepository;
  const services: TeamSessionService[] = [];

  beforeEach(async () => {
    vi.clearAllMocks();
    driver = new NodeSqliteDriver();
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
      createConversation: vi.fn(async () => ({ id: 'conv-new' })),
      deleteConversation: vi.fn(),
      updateConversation: vi.fn(),
      getConversation: vi.fn(async () => null),
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

  async function agentsOf(): Promise<TeamAgent[]> {
    return (await repo.findById('team-1'))!.agents;
  }

  /**
   * Open the real window.
   *
   * Every one of these writers reads the team itself (`repo.findById`) and then
   * writes later in the same call, so the losable interleaving is a status
   * committed BETWEEN those two points - not before the call. This wraps the
   * repository so the very next `findById` returns its snapshot and a teammate
   * status write commits immediately afterwards, which is precisely what
   * `TeammateManager.setStatus` does from another turn.
   */
  function commitStatusAfterNextRead(slotId: string, status: TeamAgent['status']): void {
    const read = repo.findById.bind(repo);
    let fired = false;
    vi.spyOn(repo, 'findById').mockImplementation(async (id: string) => {
      // Materialise the caller's snapshot FIRST; it is stale from here on.
      const snapshot = await read(id);
      if (!fired) {
        fired = true;
        await repo.updateAgentStatuses(id, [{ slotId, status }]);
      }
      return snapshot;
    });
  }

  /**
   * KNOWN POSITIVE for the probe: the interleaved write really did commit, so a
   * test below cannot pass because nothing was ever written.
   */
  async function expectCommitted(slotId: string, status: string): Promise<void> {
    const spy = repo.findById as unknown as { mockRestore?: () => void };
    spy.mockRestore?.();
    expect(await statusOf(slotId)).toBe(status);
  }

  it('KNOWN POSITIVE: the whole-row update path really does revert that write', async () => {
    const snapshot = (await repo.findById('team-1'))!;
    await repo.updateAgentStatuses('team-1', [{ slotId: 'slot-leader', status: 'idle' }]);
    expect(await statusOf('slot-leader')).toBe('idle');
    await repo.update('team-1', { agents: snapshot.agents, updatedAt: Date.now() });
    // Proves the interleaving used by every test below is a real window.
    expect(await statusOf('slot-leader')).toBe('active');
  });

  it('spawnAgent keeps a status committed after its snapshot', async () => {
    const svc = newService();
    commitStatusAfterNextRead('slot-leader', 'idle');

    await svc.addAgent('team-1', {
      conversationId: '',
      role: 'teammate',
      agentType: 'claude',
      agentName: 'Newcomer',
      conversationType: 'acp',
      status: 'pending',
    } as TeamAgent);

    // The spawn landed...
    expect((await agentsOf()).map((a) => a.agentName)).toContain('Newcomer');
    // ...and did not revert the concurrent status write.
    await expectCommitted('slot-leader', 'idle');
  });

  it('renameAgent keeps a status committed after its snapshot', async () => {
    const svc = newService();
    commitStatusAfterNextRead('slot-leader', 'idle');

    await svc.renameAgent('team-1', 'slot-1', 'Renamed');

    expect((await agentsOf()).find((a) => a.slotId === 'slot-1')?.agentName).toBe('Renamed');
    await expectCommitted('slot-leader', 'idle');
  });

  it('changeAgentBackend keeps a status committed after its snapshot', async () => {
    const svc = newService();
    commitStatusAfterNextRead('slot-leader', 'idle');

    await svc.changeAgentBackend({ teamId: 'team-1', slotId: 'slot-1', newBackend: 'codex' });

    expect((await agentsOf()).find((a) => a.slotId === 'slot-1')?.agentType).toBe('codex');
    expect(await statusOf('slot-1')).toBe('pending');
    await expectCommitted('slot-leader', 'idle');
  });

  it('removeAgent keeps a status committed after its snapshot', async () => {
    const svc = newService();
    commitStatusAfterNextRead('slot-leader', 'idle');

    await svc.removeAgent('team-1', 'slot-1');

    expect((await agentsOf()).map((a) => a.slotId)).toEqual(['slot-leader']);
    await expectCommitted('slot-leader', 'idle');
  });

  it('a roster writer does not revert a durable failed either', async () => {
    const svc = newService();
    commitStatusAfterNextRead('slot-leader', 'failed');

    await svc.renameAgent('team-1', 'slot-1', 'Renamed again');

    // A clobbered `failed` loses the durable failure record outright.
    await expectCommitted('slot-leader', 'failed');
  });

  it('a roster writer still preserves team columns it does not own', async () => {
    const svc = newService();
    await repo.update('team-1', { name: 'Renamed team', sessionMode: 'yolo', updatedAt: Date.now() });

    await svc.renameAgent('team-1', 'slot-1', 'Copy 2');

    const team = await repo.findById('team-1');
    expect(team?.name).toBe('Renamed team');
    expect(team?.sessionMode).toBe('yolo');
    expect(team?.agents.find((a) => a.slotId === 'slot-1')?.agentName).toBe('Copy 2');
  });

  // -------------------------------------------------------------------------
  // TeamSession's own two roster writers (rename + the onAgentRemoved callback).
  // These take their roster from the in-memory TeammateManager, which was built
  // from the team snapshot the session was constructed with - so they are the
  // same lost-update shape, just with a longer-lived snapshot.
  // -------------------------------------------------------------------------

  describe('TeamSession roster persistence', () => {
    async function newSession(): Promise<TeamSession> {
      const team = (await repo.findById('team-1'))!;
      const session = new TeamSession(team, repo, { getOrBuildTask: vi.fn(), kill: vi.fn() } as never);
      sessions.push(session);
      return session;
    }

    const sessions: TeamSession[] = [];

    afterEach(async () => {
      await Promise.all(sessions.splice(0).map((s) => s.dispose().catch(() => undefined)));
    });

    it('renameAgent keeps a status committed after the session was built', async () => {
      const session = await newSession();
      await repo.updateAgentStatuses('team-1', [{ slotId: 'slot-leader', status: 'idle' }]);
      expect(await statusOf('slot-leader')).toBe('idle');

      session.renameAgent('slot-1', 'Session rename');
      await vi.waitFor(async () => {
        expect((await agentsOf()).find((a) => a.slotId === 'slot-1')?.agentName).toBe('Session rename');
      });

      expect(await statusOf('slot-leader')).toBe('idle');
    });

    it('removeAgent keeps a status committed after the session was built', async () => {
      const session = await newSession();
      await repo.updateAgentStatuses('team-1', [{ slotId: 'slot-leader', status: 'failed' }]);
      expect(await statusOf('slot-leader')).toBe('failed');

      session.removeAgent('slot-1');
      await vi.waitFor(async () => {
        expect((await agentsOf()).map((a) => a.slotId)).toEqual(['slot-leader']);
      });

      expect(await statusOf('slot-leader')).toBe('failed');
    });
  });
});
