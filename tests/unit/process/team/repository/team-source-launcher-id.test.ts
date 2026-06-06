/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// tests/unit/process/team/repository/team-source-launcher-id.test.ts
//
// Round-trip test for the v36 source_launcher_id column on the teams table.
// Confirms create + read preserve the new field both when set and when omitted.

import { afterEach, beforeEach, expect, it } from 'vitest';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { SqliteTeamRepository } from '@process/team/repository/SqliteTeamRepository';
import type { TTeam } from '@process/team/types';
import { describeNativeSqlite } from '../../../helpers/nativeSqlite';

function makeTeam(overrides: Partial<TTeam> = {}): TTeam {
  return {
    id: 'team-src-1',
    userId: 'user-1',
    name: 'Source Launcher Team',
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

describeNativeSqlite('SqliteTeamRepository - sourceLauncherId round-trip', () => {
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

  it('persists and returns sourceLauncherId when set', async () => {
    const team = makeTeam({ sourceLauncherId: 'ext-launch-team-xyz' });
    await repo.create(team);
    const found = await repo.findById('team-src-1');
    expect(found).not.toBeNull();
    expect(found!.sourceLauncherId).toBe('ext-launch-team-xyz');
  });

  it('leaves sourceLauncherId undefined when omitted at create time', async () => {
    const team = makeTeam();
    await repo.create(team);
    const found = await repo.findById('team-src-1');
    expect(found).not.toBeNull();
    expect(found!.sourceLauncherId).toBeUndefined();
  });
});
