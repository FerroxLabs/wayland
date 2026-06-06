/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// tests/unit/process/team/repository/team-standing-promotion.test.ts
//
// Round-trip test for the v37 promote-to-Standing columns on the teams table
// (promoted_to_standing, session_count, first_active_at). Confirms create +
// read + update preserve all three fields and that defaults are applied when
// omitted.

import { afterEach, beforeEach, expect, it } from 'vitest';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { SqliteTeamRepository } from '@process/team/repository/SqliteTeamRepository';
import type { TTeam } from '@process/team/types';
import { describeNativeSqlite } from '../../../helpers/nativeSqlite';

function makeTeam(overrides: Partial<TTeam> = {}): TTeam {
  return {
    id: 'team-std-1',
    userId: 'user-1',
    name: 'Standing Promotion Team',
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

describeNativeSqlite('SqliteTeamRepository - promote-to-Standing round-trip', () => {
  let repo: SqliteTeamRepository;
  let driver: BetterSqlite3Driver;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
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

  it('persists and returns promotedToStanding + sessionCount + firstActiveAt when set', async () => {
    const firstActiveAt = 1_700_000_000_000;
    const team = makeTeam({
      promotedToStanding: true,
      sessionCount: 7,
      firstActiveAt,
    });
    await repo.create(team);
    const found = await repo.findById('team-std-1');
    expect(found).not.toBeNull();
    expect(found!.promotedToStanding).toBe(true);
    expect(found!.sessionCount).toBe(7);
    expect(found!.firstActiveAt).toBe(firstActiveAt);
  });

  it('applies safe defaults when promote-to-Standing fields are omitted at create time', async () => {
    const team = makeTeam();
    await repo.create(team);
    const found = await repo.findById('team-std-1');
    expect(found).not.toBeNull();
    expect(found!.promotedToStanding).toBe(false);
    expect(found!.sessionCount).toBe(0);
    expect(found!.firstActiveAt).toBeUndefined();
  });

  it('round-trips an update that flips promotedToStanding + bumps sessionCount', async () => {
    const team = makeTeam();
    await repo.create(team);

    const updateAt = 1_800_000_000_000;
    await repo.update('team-std-1', {
      promotedToStanding: true,
      sessionCount: 3,
      firstActiveAt: updateAt,
      updatedAt: updateAt,
    });

    const found = await repo.findById('team-std-1');
    expect(found).not.toBeNull();
    expect(found!.promotedToStanding).toBe(true);
    expect(found!.sessionCount).toBe(3);
    expect(found!.firstActiveAt).toBe(updateAt);
  });
});
