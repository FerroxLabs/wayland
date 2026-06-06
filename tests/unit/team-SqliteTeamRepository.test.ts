// tests/unit/team-SqliteTeamRepository.test.ts
import { it, expect, beforeEach, afterEach } from 'vitest';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { SqliteTeamRepository } from '@process/team/repository/SqliteTeamRepository';
import { LEASE_TTL_MS } from '@process/team/types';
import type { MailboxMessage, TeamTask, TTeam } from '@process/team/types';
import { describeNativeSqlite } from './helpers/nativeSqlite';

function makeTeam(overrides: Partial<TTeam> = {}): TTeam {
  return {
    id: 'team-1',
    userId: 'user-1',
    name: 'Test Team',
    workspace: '/tmp/workspace',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-1',
    agents: [
      {
        slotId: 'slot-1',
        conversationId: 'conv-1',
        role: 'leader',
        agentType: 'acp',
        agentName: 'Claude',
        conversationType: 'acp',
        status: 'idle',
      },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describeNativeSqlite('SqliteTeamRepository', () => {
  let repo: SqliteTeamRepository;
  let driver: BetterSqlite3Driver;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    // Insert a test user to satisfy the FOREIGN KEY constraint on teams.user_id
    driver
      .prepare(
        `INSERT INTO users (id, username, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run('user-1', 'testuser', 'hash', 1000, 1000);
    repo = new SqliteTeamRepository(driver);
  });

  afterEach(() => {
    driver.close();
  });

  it('creates and retrieves a team', async () => {
    const team = makeTeam();
    await repo.create(team);
    const found = await repo.findById('team-1');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Test Team');
    expect(found!.agents).toHaveLength(1);
    expect(found!.agents[0].role).toBe('leader');
  });

  it('lists teams by userId', async () => {
    await repo.create(makeTeam({ id: 'team-1' }));
    await repo.create(makeTeam({ id: 'team-2', name: 'Team 2' }));
    const list = await repo.findAll('user-1');
    expect(list).toHaveLength(2);
  });

  it('updates a team', async () => {
    await repo.create(makeTeam());
    const updated = await repo.update('team-1', { name: 'Renamed', updatedAt: 2000 });
    expect(updated.name).toBe('Renamed');
    const found = await repo.findById('team-1');
    expect(found!.name).toBe('Renamed');
  });

  it('round-trips verificationPolicy on create and update', async () => {
    // Unset on create resolves to undefined (the gate then defaults to advisory).
    await repo.create(makeTeam());
    expect((await repo.findById('team-1'))!.verificationPolicy).toBeUndefined();

    // `blocking` persists so it survives a reload (the STAGE 2 contract).
    await repo.update('team-1', { verificationPolicy: 'blocking', updatedAt: 2000 });
    expect((await repo.findById('team-1'))!.verificationPolicy).toBe('blocking');

    // `off` round-trips too (a no-op gate passthrough).
    await repo.create(makeTeam({ id: 'team-off', verificationPolicy: 'off' }));
    expect((await repo.findById('team-off'))!.verificationPolicy).toBe('off');
  });

  it('deletes a team', async () => {
    await repo.create(makeTeam());
    await repo.delete('team-1');
    const found = await repo.findById('team-1');
    expect(found).toBeNull();
  });

  it('returns null for missing team', async () => {
    const found = await repo.findById('nonexistent');
    expect(found).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Mailbox: readUnreadAndMark (atomic read + mark)
  // ---------------------------------------------------------------------------

  describe('readUnreadAndMark', () => {
    const msg = (id: string, read = false): MailboxMessage => ({
      id,
      teamId: 'team-1',
      toAgentId: 'agent-a',
      fromAgentId: 'agent-b',
      type: 'chat',
      content: `msg-${id}`,
      read,
      createdAt: Date.now(),
    });

    beforeEach(async () => {
      await repo.create(makeTeam());
    });

    it('returns unread messages and marks them read in one transaction', async () => {
      await repo.writeMessage(msg('m1'));
      await repo.writeMessage(msg('m2'));
      await repo.writeMessage(msg('m3', true)); // already read

      const result = await repo.readUnreadAndMark('team-1', 'agent-a');
      expect(result).toHaveLength(2);
      expect(result.map((m) => m.id).toSorted()).toEqual(['m1', 'm2']);

      // Second call should return nothing - already marked
      const second = await repo.readUnreadAndMark('team-1', 'agent-a');
      expect(second).toHaveLength(0);
    });

    it('returns empty array when no unread messages exist', async () => {
      const result = await repo.readUnreadAndMark('team-1', 'agent-a');
      expect(result).toHaveLength(0);
    });

    it('round-trips files through JSON serialization', async () => {
      const files = ['/tmp/workspace/image.png', '/tmp/workspace/doc.pdf'];
      await repo.writeMessage({ ...msg('m-files'), files });

      const result = await repo.readUnreadAndMark('team-1', 'agent-a');
      expect(result).toHaveLength(1);
      expect(result[0].files).toEqual(files);
    });

    it('returns undefined files when message has no files', async () => {
      await repo.writeMessage(msg('m-no-files'));

      const result = await repo.readUnreadAndMark('team-1', 'agent-a');
      expect(result).toHaveLength(1);
      expect(result[0].files).toBeUndefined();
    });

    it('handles empty files array', async () => {
      await repo.writeMessage({ ...msg('m-empty-files'), files: [] });

      const result = await repo.readUnreadAndMark('team-1', 'agent-a');
      expect(result).toHaveLength(1);
      // Empty array serializes to '[]', deserializes back to []
      expect(result[0].files).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Tasks: appendToBlocks (atomic)
  // ---------------------------------------------------------------------------

  describe('appendToBlocks', () => {
    const makeTask = (id: string, overrides: Partial<TeamTask> = {}): TeamTask => ({
      id,
      teamId: 'team-1',
      subject: `Task ${id}`,
      status: 'open',
      blockedBy: [],
      blocks: [],
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    });

    beforeEach(async () => {
      await repo.create(makeTeam());
    });

    it('appends a block id to the task blocks array', async () => {
      await repo.createTask(makeTask('t1'));
      await repo.appendToBlocks('t1', 't2');

      const task = await repo.findTaskById('t1');
      expect(task!.blocks).toEqual(['t2']);
    });

    it('does not duplicate an existing block id', async () => {
      await repo.createTask(makeTask('t1', { blocks: ['t2'] }));
      await repo.appendToBlocks('t1', 't2');

      const task = await repo.findTaskById('t1');
      expect(task!.blocks).toEqual(['t2']);
    });

    it('is a no-op for nonexistent task', async () => {
      await expect(repo.appendToBlocks('nonexistent', 't2')).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Tasks: removeFromBlockedBy (atomic)
  // ---------------------------------------------------------------------------

  describe('removeFromBlockedBy', () => {
    const makeTask = (id: string, overrides: Partial<TeamTask> = {}): TeamTask => ({
      id,
      teamId: 'team-1',
      subject: `Task ${id}`,
      status: 'open',
      blockedBy: [],
      blocks: [],
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    });

    beforeEach(async () => {
      await repo.create(makeTeam());
    });

    it('removes a blocker id from blockedBy array', async () => {
      await repo.createTask(makeTask('t1', { blockedBy: ['t0', 't2'] }));
      const updated = await repo.removeFromBlockedBy('t1', 't0');

      expect(updated.blockedBy).toEqual(['t2']);
    });

    it('returns task unchanged when blocker id is not present', async () => {
      await repo.createTask(makeTask('t1', { blockedBy: ['t0'] }));
      const updated = await repo.removeFromBlockedBy('t1', 'nonexistent');

      expect(updated.blockedBy).toEqual(['t0']);
    });

    it('throws for nonexistent task', async () => {
      await expect(repo.removeFromBlockedBy('nonexistent', 't0')).rejects.toThrow('Task "nonexistent" not found');
    });
  });

  // ---------------------------------------------------------------------------
  // P2/P3 durable execution: guarded, atomic lease reclaim (REAL SQL, not mocks)
  // ---------------------------------------------------------------------------
  describe('durable execution - markZombie / reclaimZombie / findStaleVerifyingTasks', () => {
    const NOW = 1_000_000;
    const leasedTask = (id: string, overrides: Partial<TeamTask> = {}): TeamTask => ({
      id,
      teamId: 'team-1',
      subject: `Task ${id}`,
      status: 'in_progress',
      owner: 'slot-1',
      blockedBy: [],
      blocks: [],
      metadata: {},
      createdAt: NOW - 10_000,
      updatedAt: NOW - 10_000,
      leaseOwner: 'slot-1',
      leaseExpiresAt: NOW - 5_000, // lapsed
      lastHeartbeat: NOW - 5_000,
      retryBudget: 3,
      retriesUsed: 0,
      ...overrides,
    });

    beforeEach(async () => {
      await repo.create(makeTeam());
    });

    it('markZombie flips a lapsed-lease in_progress task exactly once (idempotent CAS)', async () => {
      await repo.createTask(leasedTask('z1'));
      expect(await repo.markZombie('z1', NOW)).toBe(true);
      expect((await repo.findTaskById('z1'))!.status).toBe('zombie');
      // Second call no longer matches the WHERE guard - no duplicate flip.
      expect(await repo.markZombie('z1', NOW)).toBe(false);
    });

    it('markZombie does NOT touch a non-lapsed lease or a non-in_progress task', async () => {
      await repo.createTask(leasedTask('fresh', { leaseExpiresAt: NOW + 60_000 }));
      await repo.createTask(leasedTask('pending', { status: 'pending' }));
      expect(await repo.markZombie('fresh', NOW)).toBe(false);
      expect(await repo.markZombie('pending', NOW)).toBe(false);
      expect((await repo.findTaskById('fresh'))!.status).toBe('in_progress');
      expect((await repo.findTaskById('pending'))!.status).toBe('pending');
    });

    it('reclaimZombie re-queues to pending, increments persisted retriesUsed once, clears the lease', async () => {
      await repo.createTask(leasedTask('z2', { retriesUsed: 1, retryBudget: 3 }));
      await repo.markZombie('z2', NOW);

      expect(await repo.reclaimZombie('z2', NOW)).toBe('requeued');
      const after = (await repo.findTaskById('z2'))!;
      expect(after.status).toBe('pending');
      expect(after.retriesUsed).toBe(2); // read+incremented from the PERSISTED row
      expect(after.owner).toBeUndefined();
      expect(after.leaseOwner).toBeUndefined();
      expect(after.leaseExpiresAt).toBeUndefined();

      // A second reclaim cannot double-increment - the row is no longer zombie.
      expect(await repo.reclaimZombie('z2', NOW)).toBe('skipped');
      expect((await repo.findTaskById('z2'))!.retriesUsed).toBe(2);
    });

    it('reclaimZombie terminates to a VISIBLE failed state (not deleted) once the budget is spent', async () => {
      await repo.createTask(leasedTask('z3', { retriesUsed: 3, retryBudget: 3 }));
      await repo.markZombie('z3', NOW);

      expect(await repo.reclaimZombie('z3', NOW)).toBe('exhausted');
      const after = (await repo.findTaskById('z3'))!;
      expect(after.status).toBe('failed'); // visible in Mission Control, NOT a hidden 'deleted' tombstone
      expect(after.metadata.failed).toBe(true);
      expect(after.metadata.failureReason).toBe('lease exhausted');
      expect(after.leaseExpiresAt).toBeUndefined();
    });

    it('reclaimZombie is a no-op on a task that is not zombie', async () => {
      await repo.createTask(leasedTask('z4', { status: 'in_progress' }));
      expect(await repo.reclaimZombie('z4', NOW)).toBe('skipped');
    });

    it('renewLease updates the lease ONLY while still owned + in_progress (guarded)', async () => {
      await repo.createTask(leasedTask('rl', { owner: 'slot-1', leaseExpiresAt: NOW - 1 }));
      expect(await repo.renewLease('rl', 'slot-1', NOW + 100_000, NOW)).toBe(true);
      expect((await repo.findTaskById('rl'))!.leaseExpiresAt).toBe(NOW + 100_000);

      // Wrong owner -> no-op (cannot steal another slot's lease).
      expect(await repo.renewLease('rl', 'slot-other', NOW + 200_000, NOW)).toBe(false);
      // Not in_progress -> no-op (cannot resurrect a zombie via a lease write).
      await repo.markZombie('rl', NOW + 100_001);
      expect(await repo.renewLease('rl', 'slot-1', NOW + 300_000, NOW)).toBe(false);
      expect((await repo.findTaskById('rl'))!.status).toBe('zombie');
    });

    it('recoverVerifyingTask completes-through a verifying task, guarded by status', async () => {
      await repo.createTask(leasedTask('rv', { status: 'verifying', leaseExpiresAt: undefined }));
      expect(await repo.recoverVerifyingTask('rv', { verification: { note: 'recovered' } }, NOW)).toBe(true);
      const after = (await repo.findTaskById('rv'))!;
      expect(after.status).toBe('completed');
      expect((after.metadata.verification as { note: string }).note).toBe('recovered');
      // Second call no-ops (no longer verifying).
      expect(await repo.recoverVerifyingTask('rv', { verification: { note: 'again' } }, NOW)).toBe(false);
    });

    it('findStaleLeasedTasks reclaims a legacy NULL-lease in_progress row untouched for a full TTL', async () => {
      await repo.createTask(leasedTask('legacy', { leaseOwner: undefined, leaseExpiresAt: undefined, lastHeartbeat: undefined, updatedAt: NOW - LEASE_TTL_MS - 1 }));
      const stale = await repo.findStaleLeasedTasks(NOW);
      expect(stale.map((t) => t.id)).toContain('legacy');
      // ...but a recently-touched NULL-lease row is left alone.
      await repo.createTask(leasedTask('fresh-null', { leaseOwner: undefined, leaseExpiresAt: undefined, lastHeartbeat: undefined, updatedAt: NOW - 1_000 }));
      const stale2 = await repo.findStaleLeasedTasks(NOW);
      expect(stale2.map((t) => t.id)).not.toContain('fresh-null');
      expect(await repo.markZombie('legacy', NOW)).toBe(true); // legacy row is zombifiable
    });

    it('findStaleVerifyingTasks returns only verifying tasks older than the stale window', async () => {
      await repo.createTask(leasedTask('old', { status: 'verifying', leaseExpiresAt: undefined, updatedAt: NOW - 600_000 }));
      await repo.createTask(leasedTask('new', { status: 'verifying', leaseExpiresAt: undefined, updatedAt: NOW - 1_000 }));
      await repo.createTask(leasedTask('run', { status: 'in_progress', updatedAt: NOW - 600_000 }));

      const stale = await repo.findStaleVerifyingTasks(NOW, 300_000);
      expect(stale.map((t) => t.id)).toEqual(['old']);
    });
  });
});
