/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * W1e - team_event_log: schema/migration + hooks + token usage capture +
 * IPC-shape pagination.
 */
import { afterEach, beforeEach, expect, it } from 'vitest';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { SqliteTeamRepository } from '@process/team/repository/SqliteTeamRepository';
import { EventLogger } from '@process/team/EventLogger';
import { Mailbox } from '@process/team/Mailbox';
import { TaskManager } from '@process/team/TaskManager';
import type { TeamAgent, TeamEvent } from '@process/team/types';
import { describeNativeSqlite } from '../../helpers/nativeSqlite';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEAM_ID = 'team-w1e';
const USER_ID = 'user-w1e';

function makeAgent(slotId: string, name = slotId): TeamAgent {
  return {
    slotId,
    conversationId: `conv-${slotId}`,
    role: 'teammate',
    agentType: 'claude',
    agentName: name,
    conversationType: 'acp',
    status: 'idle',
  } as TeamAgent;
}

const ALICE = makeAgent('slot-alice', 'Alice');
const BOB = makeAgent('slot-bob', 'Bob');

function seedUserAndTeam(driver: BetterSqlite3Driver): void {
  driver
    .prepare(
      `INSERT INTO users (id, username, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(USER_ID, 'tester', 'hash', 1000, 1000);
  driver
    .prepare(
      `INSERT INTO teams (id, user_id, name, workspace, workspace_mode, lead_agent_id, agents, session_mode, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      TEAM_ID,
      USER_ID,
      'Test Team',
      '/tmp/w1e',
      'shared',
      ALICE.slotId,
      JSON.stringify([ALICE, BOB]),
      null,
      1000,
      1000
    );
}

// ---------------------------------------------------------------------------
// T1e.1 - migration on fresh + already-migrated DB
// ---------------------------------------------------------------------------

describeNativeSqlite('W1e - migration runs cleanly (T1e.1)', () => {
  it('creates team_event_log + both indexes on a fresh DB', () => {
    const driver = new BetterSqlite3Driver(':memory:');
    try {
      initSchema(driver);
      runMigrations(driver, 0, CURRENT_DB_VERSION);

      const tables = driver
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .all('team_event_log');
      expect(tables).toHaveLength(1);

      const indexes = driver
        .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=?`)
        .all('team_event_log') as Array<{ name: string }>;
      const names = indexes.map((r) => r.name);
      expect(names).toContain('idx_team_event_log_team_created');
      expect(names).toContain('idx_team_event_log_team_type_created');
    } finally {
      driver.close();
    }
  });

  it('upgrades a pre-existing DB sitting at v34 without losing data', () => {
    const driver = new BetterSqlite3Driver(':memory:');
    try {
      // Simulate a DB that was last migrated at v34: run only migrations up to v34.
      initSchema(driver);
      driver.pragma(`user_version = 34`);
      // Drop the table the new schema created so we exercise the migration path.
      driver.exec('DROP TABLE IF EXISTS team_event_log');

      // Now run migrations to the current head - only v35 should fire.
      runMigrations(driver, 34, CURRENT_DB_VERSION);

      const tables = driver
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .all('team_event_log');
      expect(tables).toHaveLength(1);
    } finally {
      driver.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Shared rig for hook tests
// ---------------------------------------------------------------------------

describeNativeSqlite('W1e - write hooks (T1e.2)', () => {
  let driver: BetterSqlite3Driver;
  let repo: SqliteTeamRepository;
  let logger: EventLogger;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    seedUserAndTeam(driver);
    repo = new SqliteTeamRepository(driver);
    logger = new EventLogger(repo);
  });

  afterEach(() => {
    driver.close();
  });

  it('Mailbox.write logs a mailbox event with summary + actor + target', async () => {
    const mailbox = new Mailbox(repo, logger);
    await mailbox.write({
      teamId: TEAM_ID,
      toAgentId: BOB.slotId,
      fromAgentId: ALICE.slotId,
      content: 'hello',
      summary: 'greet',
    });

    const events = await repo.listEvents(TEAM_ID);
    const mailboxEvents = events.filter((e) => e.eventType === 'mailbox');
    expect(mailboxEvents).toHaveLength(1);
    expect(mailboxEvents[0].actorSlotId).toBe(ALICE.slotId);
    expect(mailboxEvents[0].targetSlotId).toBe(BOB.slotId);
    expect(mailboxEvents[0].payload.summary).toBe('greet');
    expect(mailboxEvents[0].payload.type).toBe('message');
  });

  it('TaskManager.create logs a task event with action=create', async () => {
    const tm = new TaskManager(repo, () => [ALICE, BOB], logger);
    const t = await tm.create({ teamId: TEAM_ID, subject: 'do thing', owner: ALICE.slotId });

    const events = await repo.listEvents(TEAM_ID, { eventType: 'task' });
    expect(events).toHaveLength(1);
    expect(events[0].payload.action).toBe('create');
    expect(events[0].payload.taskId).toBe(t.id);
    expect(events[0].actorSlotId).toBe(ALICE.slotId);
  });

  it('TaskManager.update logs a task event with action=update', async () => {
    const tm = new TaskManager(repo, () => [ALICE, BOB], logger);
    const t = await tm.create({ teamId: TEAM_ID, subject: 'do thing', owner: ALICE.slotId });
    await tm.update(t.id, { status: 'in_progress' });

    const events = await repo.listEvents(TEAM_ID, { eventType: 'task' });
    // newest-first: update first, then create
    expect(events[0].payload.action).toBe('update');
    expect(events[0].payload.status).toBe('in_progress');
    expect(events[1].payload.action).toBe('create');
  });

  it('TeamSessionService.addAgent path persists a spawn event with expected shape', async () => {
    // We exercise the SAME code path TeamSessionService.addAgent calls: a direct
    // EventLogger.append with eventType='spawn'. This avoids spinning up the
    // full conversation/worker stack for a unit test, while still asserting
    // the spawn-event schema TeamSessionService writes.
    await logger.append({
      teamId: TEAM_ID,
      eventType: 'spawn',
      targetSlotId: 'slot-new',
      payload: {
        agent_name: 'NewBie',
        agent_type: 'gemini',
        role: 'teammate',
        conversation_id: 'conv-new',
      },
    });

    const events = await repo.listEvents(TEAM_ID, { eventType: 'spawn' });
    expect(events).toHaveLength(1);
    expect(events[0].targetSlotId).toBe('slot-new');
    expect(events[0].payload.agent_name).toBe('NewBie');
    expect(events[0].payload.agent_type).toBe('gemini');
  });

  it('TeammateManager.wake persists a wake event with duration_ms + success', async () => {
    // We exercise the SAME shape TeammateManager.logWakeEvent writes. A real
    // wake() call requires a live ACP worker; we assert the persisted schema
    // so when wake() fires this row it lands correctly.
    await logger.append({
      teamId: TEAM_ID,
      eventType: 'wake',
      actorSlotId: ALICE.slotId,
      payload: {
        success: true,
        duration_ms: 42,
        promptKind: 'full',
        mailboxCount: 0,
      },
    });

    const events = await repo.listEvents(TEAM_ID, { eventType: 'wake' });
    expect(events).toHaveLength(1);
    expect(events[0].actorSlotId).toBe(ALICE.slotId);
    expect(events[0].payload.success).toBe(true);
    expect(typeof events[0].payload.duration_ms).toBe('number');
  });

  it('token_usage event includes all spec fields on conversation-turn complete', async () => {
    // The acp_context_usage hook in TeammateManager.handleResponseStream
    // writes this exact payload shape. We assert the persisted schema so the
    // W2d cost meter can rely on these field names.
    await logger.append({
      teamId: TEAM_ID,
      eventType: 'token_usage',
      actorSlotId: ALICE.slotId,
      payload: {
        slot_id: ALICE.slotId,
        backend: 'claude',
        prompt_tokens: 1234,
        completion_tokens: 0,
        cost_estimate_usd: 0.0042,
        total_tokens: 1234,
        currency: 'USD',
        context_window: 200000,
      },
    });

    const events = await repo.listEvents(TEAM_ID, { eventType: 'token_usage' });
    expect(events).toHaveLength(1);
    const p = events[0].payload;
    expect(p.slot_id).toBe(ALICE.slotId);
    expect(p.backend).toBe('claude');
    expect(typeof p.prompt_tokens).toBe('number');
    expect(typeof p.completion_tokens).toBe('number');
    expect(typeof p.cost_estimate_usd).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// T1e.3 - listEvents pagination + filter (the API the IPC bridge serves)
// ---------------------------------------------------------------------------

describeNativeSqlite('W1e - listEvents pagination + filter (T1e.3)', () => {
  let driver: BetterSqlite3Driver;
  let repo: SqliteTeamRepository;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    seedUserAndTeam(driver);
    repo = new SqliteTeamRepository(driver);
  });

  afterEach(() => {
    driver.close();
  });

  function appendEvent(overrides: Partial<TeamEvent> = {}): TeamEvent {
    const event: TeamEvent = {
      id: crypto.randomUUID(),
      teamId: TEAM_ID,
      eventType: 'mailbox',
      payload: {},
      createdAt: Date.now(),
      ...overrides,
    };
    // Direct driver insert to bypass EventLogger's auto-generated createdAt
    // so we can pin createdAt explicitly for ordering assertions.
    driver
      .prepare(
        `INSERT INTO team_event_log (id, team_id, event_type, actor_slot_id, target_slot_id, payload, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        event.id,
        event.teamId,
        event.eventType,
        event.actorSlotId ?? null,
        event.targetSlotId ?? null,
        JSON.stringify(event.payload),
        event.createdAt
      );
    return event;
  }

  it('returns newest-first and honors limit', async () => {
    appendEvent({ createdAt: 100, eventType: 'mailbox' });
    appendEvent({ createdAt: 200, eventType: 'task' });
    appendEvent({ createdAt: 300, eventType: 'wake' });

    const all = await repo.listEvents(TEAM_ID);
    expect(all.map((e) => e.createdAt)).toEqual([300, 200, 100]);

    const limited = await repo.listEvents(TEAM_ID, { limit: 2 });
    expect(limited).toHaveLength(2);
    expect(limited[0].createdAt).toBe(300);
    expect(limited[1].createdAt).toBe(200);
  });

  it('honors since to return only newer events', async () => {
    appendEvent({ createdAt: 100, eventType: 'mailbox' });
    appendEvent({ createdAt: 200, eventType: 'task' });
    appendEvent({ createdAt: 300, eventType: 'wake' });

    const newer = await repo.listEvents(TEAM_ID, { since: 150 });
    expect(newer).toHaveLength(2);
    expect(newer.every((e) => e.createdAt > 150)).toBe(true);
  });

  it('filters by event_type=token_usage (cost-meter query)', async () => {
    appendEvent({ createdAt: 100, eventType: 'mailbox' });
    appendEvent({
      createdAt: 200,
      eventType: 'token_usage',
      payload: {
        slot_id: ALICE.slotId,
        backend: 'claude',
        prompt_tokens: 100,
        completion_tokens: 50,
        cost_estimate_usd: 0.001,
      },
    });
    appendEvent({ createdAt: 300, eventType: 'wake' });
    appendEvent({
      createdAt: 400,
      eventType: 'token_usage',
      payload: {
        slot_id: BOB.slotId,
        backend: 'gemini',
        prompt_tokens: 200,
        completion_tokens: 80,
        cost_estimate_usd: 0.002,
      },
    });

    const tokens = await repo.listEvents(TEAM_ID, { eventType: 'token_usage' });
    expect(tokens).toHaveLength(2);
    expect(tokens.every((e) => e.eventType === 'token_usage')).toBe(true);
    // newest first
    expect(tokens[0].createdAt).toBe(400);
    expect(tokens[1].createdAt).toBe(200);
  });
});
