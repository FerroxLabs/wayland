/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';
import { deleteConversationWithChannelCleanupIntent } from './conversationChannelCleanupIntent';

const migrationV55 = ALL_MIGRATIONS.find((migration) => migration.version === 55) as IMigration;

function initialize(driver: BunSqliteDriver): void {
  driver.pragma('foreign_keys = ON');
  driver.exec(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    source TEXT
  )`);
  driver.exec(`CREATE TABLE IF NOT EXISTS assistant_sessions (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
  )`);
  migrationV55.up(driver);
}

function readIntent(driver: BunSqliteDriver, conversationId: string) {
  return driver
    .prepare('SELECT * FROM conversation_channel_cleanup_intents WHERE conversation_id = ?')
    .get(conversationId) as
    | {
        conversation_id: string;
        source: string | null;
        session_ids_json: string;
        attempt_count: number;
      }
    | undefined;
}

describe('conversation channel cleanup intent native SQLite proof', () => {
  const temporaryDirectories: string[] = [];
  const openDrivers: BunSqliteDriver[] = [];

  afterEach(() => {
    for (const driver of openDrivers.splice(0)) driver.close();
    for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
  });

  function open(databasePath = ':memory:'): BunSqliteDriver {
    const driver = new BunSqliteDriver(databasePath);
    openDrivers.push(driver);
    initialize(driver);
    return driver;
  }

  it('retains the atomic intent and captured session identity across process restart', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-channel-cleanup-'));
    temporaryDirectories.push(directory);
    const databasePath = path.join(directory, 'wayland.db');
    const beforeCrash = open(databasePath);
    beforeCrash.prepare('INSERT INTO conversations (id, source) VALUES (?, ?)').run('conv-restart', 'telegram');
    beforeCrash
      .prepare('INSERT INTO assistant_sessions (id, conversation_id) VALUES (?, ?)')
      .run('session-channel', 'conv-restart');

    expect(deleteConversationWithChannelCleanupIntent(beforeCrash, 'conv-restart', 1000)).toBe(true);
    beforeCrash.close();
    openDrivers.splice(openDrivers.indexOf(beforeCrash), 1);

    const afterRestart = open(databasePath);
    expect(afterRestart.prepare('SELECT id FROM conversations WHERE id = ?').get('conv-restart')).toBeNull();
    expect(readIntent(afterRestart, 'conv-restart')).toMatchObject({
      conversation_id: 'conv-restart',
      source: 'telegram',
      session_ids_json: '["session-channel"]',
      attempt_count: 0,
    });
  });

  it('binds eligibility to commit-time source and rolls intent back with a rejected delete', () => {
    const driver = open();
    driver.prepare('INSERT INTO conversations (id, source) VALUES (?, ?)').run('conv-source-race', 'wayland');
    expect(driver.prepare('SELECT source FROM conversations WHERE id = ?').get('conv-source-race')).toEqual({
      source: 'wayland',
    });
    driver.prepare('UPDATE conversations SET source = ? WHERE id = ?').run('telegram', 'conv-source-race');

    expect(deleteConversationWithChannelCleanupIntent(driver, 'conv-source-race', 1000)).toBe(true);
    expect(readIntent(driver, 'conv-source-race')).toMatchObject({ source: 'telegram' });

    driver.prepare('INSERT INTO conversations (id, source) VALUES (?, ?)').run('conv-rollback', 'telegram');
    driver.exec(`CREATE TRIGGER reject_conversation_delete
      BEFORE DELETE ON conversations WHEN OLD.id = 'conv-rollback'
      BEGIN
        SELECT RAISE(ABORT, 'delete rejected');
      END`);
    expect(() => deleteConversationWithChannelCleanupIntent(driver, 'conv-rollback', 1000)).toThrow('delete rejected');
    expect(driver.prepare('SELECT id FROM conversations WHERE id = ?').get('conv-rollback')).toEqual({
      id: 'conv-rollback',
    });
    expect(readIntent(driver, 'conv-rollback')).toBeNull();
  });
});
