/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Migration v59 - Fuigo cutover. A Core (`wcore`) conversation must reopen as
 * an ACP conversation on the bundled Fuigo engine with its persona intact, and
 * a scheduled job that named the Core engine must run on Fuigo.
 *
 * Runs on `node:sqlite` so it executes on every box, not only where the
 * better-sqlite3 addon happens to match the Node ABI (a skipped test cannot
 * fail).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { ALL_MIGRATIONS, runMigrations } from '@process/services/database/migrations';
import { NodeSqliteDriver } from '../../../helpers/nodeSqliteDriver';

const NOW = 1_760_000_000_000;

function insertConversation(driver: NodeSqliteDriver, id: string, type: string, extra: unknown): void {
  driver
    .prepare(
      'INSERT INTO conversations (id, user_id, name, type, extra, model, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      id,
      'default',
      id,
      type,
      typeof extra === 'string' ? extra : JSON.stringify(extra),
      null,
      'finished',
      NOW,
      NOW
    );
}

function insertCronJob(driver: NodeSqliteDriver, id: string, agentType: string, agentConfig: unknown): void {
  driver
    .prepare(
      `INSERT INTO cron_jobs (id, name, enabled, schedule_kind, schedule_value, schedule_description, payload_message,
         agent_config, conversation_id, agent_type, created_by)
       VALUES (?, ?, 1, 'every', '86400000', 'every day', 'run', ?, 'conv-cron', ?, 'user')`
    )
    .run(id, id, agentConfig === null ? null : JSON.stringify(agentConfig), agentType);
}

const readConversation = (driver: NodeSqliteDriver, id: string) => {
  const row = driver.prepare('SELECT type, extra FROM conversations WHERE id = ?').get(id) as {
    type: string;
    extra: string;
  };
  return { type: row.type, extra: JSON.parse(row.extra) as Record<string, unknown> };
};

const readCronJob = (driver: NodeSqliteDriver, id: string) => {
  const row = driver.prepare('SELECT agent_type, agent_config FROM cron_jobs WHERE id = ?').get(id) as {
    agent_type: string;
    agent_config: string | null;
  };
  return { agentType: row.agent_type, agentConfig: row.agent_config ? JSON.parse(row.agent_config) : null };
};

describe('Migration v59 - Fuigo cutover', () => {
  let driver: NodeSqliteDriver;

  beforeEach(() => {
    driver = new NodeSqliteDriver(':memory:');
    initSchema(driver);
    // Build the schema at the v58 shape, seed pre-cutover rows, THEN apply v59.
    runMigrations(driver, 0, 58);
    driver
      .prepare(
        "INSERT OR IGNORE INTO users (id, username, password_hash, created_at, updated_at) VALUES ('default', 'default', '', ?, ?)"
      )
      .run(NOW, NOW);
  });

  afterEach(() => driver.close());

  it('bumps CURRENT_DB_VERSION to 59 or higher and registers v59', () => {
    expect(CURRENT_DB_VERSION).toBeGreaterThanOrEqual(59);
    expect(ALL_MIGRATIONS.find((m) => m.version === 59)).toBeDefined();
  });

  it('rewrites a wcore conversation to acp + fuigo and carries presetRules onto presetContext', () => {
    insertConversation(driver, 'core-1', 'wcore', {
      workspace: '/ws',
      customWorkspace: true,
      presetRules: 'You are Concierge.',
      presetAssistantId: 'concierge',
      sessionMode: 'auto_edit',
    });
    runMigrations(driver, 58, 59);

    const after = readConversation(driver, 'core-1');
    expect(after.type).toBe('acp');
    expect(after.extra).toMatchObject({
      workspace: '/ws',
      customWorkspace: true,
      backend: 'fuigo',
      presetRules: 'You are Concierge.',
      presetContext: 'You are Concierge.',
      presetAssistantId: 'concierge',
      sessionMode: 'acceptEdits',
    });
  });

  it("maps Core's session modes onto Fuigo's vocabulary and leaves a native Fuigo chat alone", () => {
    insertConversation(driver, 'core-yolo', 'wcore', { workspace: '/ws', sessionMode: 'yolo' });
    insertConversation(driver, 'core-force', 'wcore', { workspace: '/ws', sessionMode: 'force' });
    insertConversation(driver, 'core-default', 'wcore', { workspace: '/ws', sessionMode: 'default' });
    insertConversation(driver, 'core-nomode', 'wcore', { workspace: '/ws' });
    insertConversation(driver, 'fuigo-plan', 'acp', { workspace: '/ws', backend: 'fuigo', sessionMode: 'plan' });
    insertConversation(driver, 'claude-yolo', 'acp', { workspace: '/ws', backend: 'claude', sessionMode: 'yolo' });
    runMigrations(driver, 58, 59);

    expect(readConversation(driver, 'core-yolo').extra.sessionMode).toBe('bypassPermissions');
    expect(readConversation(driver, 'core-force').extra.sessionMode).toBe('bypassPermissions');
    expect(readConversation(driver, 'core-default').extra.sessionMode).toBe('default');
    expect(readConversation(driver, 'core-nomode').extra).not.toHaveProperty('sessionMode');
    expect(readConversation(driver, 'fuigo-plan').extra.sessionMode).toBe('plan');
    expect(readConversation(driver, 'claude-yolo').extra.sessionMode).toBe('yolo');
  });

  it('does not overwrite an existing presetContext, and adds no presetContext when there were no rules', () => {
    insertConversation(driver, 'core-2', 'wcore', { workspace: '/ws', presetRules: 'OLD', presetContext: 'KEEP' });
    insertConversation(driver, 'core-3', 'wcore', { workspace: '/ws' });
    runMigrations(driver, 58, 59);

    expect(readConversation(driver, 'core-2').extra).toMatchObject({ backend: 'fuigo', presetContext: 'KEEP' });
    const bare = readConversation(driver, 'core-3');
    expect(bare.type).toBe('acp');
    expect(bare.extra.backend).toBe('fuigo');
    expect(bare.extra).not.toHaveProperty('presetContext');
  });

  it('leaves every non-wcore conversation untouched', () => {
    insertConversation(driver, 'claude-1', 'acp', { workspace: '/ws', backend: 'claude' });
    insertConversation(driver, 'gem-1', 'gemini', { workspace: '/ws', presetRules: 'G' });
    runMigrations(driver, 58, 59);

    expect(readConversation(driver, 'claude-1')).toEqual({
      type: 'acp',
      extra: { workspace: '/ws', backend: 'claude' },
    });
    expect(readConversation(driver, 'gem-1')).toEqual({
      type: 'gemini',
      extra: { workspace: '/ws', presetRules: 'G' },
    });
  });

  it('moves a Core scheduled job onto fuigo (agent_type and agent_config.backend)', () => {
    insertCronJob(driver, 'job-core', 'wcore', { backend: 'fuigo', name: 'Fuigo', mode: 'auto_edit' });
    insertCronJob(driver, 'job-claude', 'claude', { backend: 'claude', name: 'Claude' });
    insertCronJob(driver, 'job-noconfig', 'wcore', null);
    runMigrations(driver, 58, 59);

    expect(readCronJob(driver, 'job-core')).toEqual({
      agentType: 'fuigo',
      agentConfig: { backend: 'fuigo', name: 'Fuigo', mode: 'acceptEdits' },
    });
    expect(readCronJob(driver, 'job-claude')).toEqual({
      agentType: 'claude',
      agentConfig: { backend: 'claude', name: 'Claude' },
    });
    expect(readCronJob(driver, 'job-noconfig')).toEqual({ agentType: 'fuigo', agentConfig: null });
  });

  it("maps a Core routine's Autopilot mode onto bypassPermissions so it still runs unattended", () => {
    insertCronJob(driver, 'job-yolo', 'wcore', { backend: 'wcore', mode: 'yolo' });
    insertCronJob(driver, 'job-force', 'wcore', { backend: 'wcore', mode: 'force' });
    insertCronJob(driver, 'job-default', 'wcore', { backend: 'wcore', mode: 'default' });
    insertCronJob(driver, 'job-claude-yolo', 'claude', { backend: 'claude', mode: 'yolo' });
    runMigrations(driver, 58, 59);

    expect(readCronJob(driver, 'job-yolo').agentConfig).toEqual({ backend: 'fuigo', mode: 'bypassPermissions' });
    expect(readCronJob(driver, 'job-force').agentConfig).toEqual({ backend: 'fuigo', mode: 'bypassPermissions' });
    expect(readCronJob(driver, 'job-default').agentConfig).toEqual({ backend: 'fuigo', mode: 'default' });
    expect(readCronJob(driver, 'job-claude-yolo').agentConfig).toEqual({ backend: 'claude', mode: 'yolo' });
  });

  it('is idempotent - a second run changes nothing', () => {
    insertConversation(driver, 'core-1', 'wcore', { workspace: '/ws', presetRules: 'R' });
    insertCronJob(driver, 'job-core', 'wcore', { backend: 'fuigo' });
    runMigrations(driver, 58, 59);
    const once = { conv: readConversation(driver, 'core-1'), job: readCronJob(driver, 'job-core') };

    const v59 = ALL_MIGRATIONS.find((m) => m.version === 59)!;
    expect(() => v59.up(driver)).not.toThrow();
    expect({ conv: readConversation(driver, 'core-1'), job: readCronJob(driver, 'job-core') }).toEqual(once);
  });
});
