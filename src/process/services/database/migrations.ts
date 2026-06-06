/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ISqliteDriver } from './drivers/ISqliteDriver';

/**
 * Migration script definition
 */
export interface IMigration {
  version: number; // Target version after this migration
  name: string; // Migration name for logging
  up: (db: ISqliteDriver) => void; // Upgrade script
  down: (db: ISqliteDriver) => void; // Downgrade script (for rollback)
}

/**
 * Migration v0 -> v1: Initial schema
 * This is handled by initSchema() in schema.ts
 */
const migration_v1: IMigration = {
  version: 1,
  name: 'Initial schema',
  up: (_db) => {
    // Already handled by initSchema()
    console.log('[Migration v1] Initial schema created by initSchema()');
  },
  down: (db) => {
    // Drop all tables (only core tables now)
    db.exec('DROP TABLE IF EXISTS messages');
    db.exec('DROP TABLE IF EXISTS conversations');
    db.exec('DROP TABLE IF EXISTS users');
    console.log('[Migration v1] Rolled back: All tables dropped');
  },
};

/**
 * Migration v1 -> v2: Add indexes for better performance
 * Example of a schema change migration
 */
const migration_v2: IMigration = {
  version: 2,
  name: 'Add performance indexes',
  up: (db) => {
    // Add composite index for conversation messages lookup
    db.exec('CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc ON messages(conversation_id, created_at DESC)');
    // Add index for message search by type
    db.exec('CREATE INDEX IF NOT EXISTS idx_messages_type_created ON messages(type, created_at DESC)');
    // Add index for user conversations lookup
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_type ON conversations(user_id, type)');
    console.log('[Migration v2] Added performance indexes');
  },
  down: (db) => {
    db.exec('DROP INDEX IF EXISTS idx_messages_conv_created_desc');
    db.exec('DROP INDEX IF EXISTS idx_messages_type_created');
    db.exec('DROP INDEX IF EXISTS idx_conversations_user_type');
    console.log('[Migration v2] Rolled back: Removed performance indexes');
  },
};

/**
 * Migration v2 -> v3: Add full-text search support [REMOVED]
 *
 * Note: FTS functionality has been removed as it's not currently needed.
 * Will be re-implemented when search functionality is added to the UI.
 */
const migration_v3: IMigration = {
  version: 3,
  name: 'Add full-text search (skipped)',
  up: (_db) => {
    // FTS removed - will be re-added when search functionality is implemented
    console.log('[Migration v3] FTS support skipped (removed, will be added back later)');
  },
  down: (db) => {
    // Clean up FTS table if it exists from older versions
    db.exec('DROP TABLE IF EXISTS messages_fts');
    console.log('[Migration v3] Rolled back: Removed full-text search');
  },
};

/**
 * Migration v3 -> v4: Removed (user_preferences table no longer needed)
 */
const migration_v4: IMigration = {
  version: 4,
  name: 'Removed user_preferences table',
  up: (_db) => {
    // user_preferences table removed from schema
    console.log('[Migration v4] Skipped (user_preferences table removed)');
  },
  down: (_db) => {
    console.log('[Migration v4] Rolled back: No-op (user_preferences table removed)');
  },
};

/**
 * Migration v4 -> v5: Remove FTS table
 * Cleanup for FTS removal - ensures all databases have consistent schema
 */
const migration_v5: IMigration = {
  version: 5,
  name: 'Remove FTS table',
  up: (db) => {
    // Remove FTS table created by old v3 migration
    db.exec('DROP TABLE IF EXISTS messages_fts');
    console.log('[Migration v5] Removed FTS table (cleanup for FTS removal)');
  },
  down: (_db) => {
    // If rolling back, we don't recreate FTS table (it's deprecated)
    console.log('[Migration v5] Rolled back: FTS table remains removed (deprecated feature)');
  },
};

/**
 * Migration v5 -> v6: Add jwt_secret column to users table
 * Store JWT secret per user for better security and management
 */
const migration_v6: IMigration = {
  version: 6,
  name: 'Add jwt_secret to users table',
  up: (db) => {
    // Check if jwt_secret column already exists
    const tableInfo = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
    const hasJwtSecret = tableInfo.some((col) => col.name === 'jwt_secret');

    if (!hasJwtSecret) {
      // Add jwt_secret column to users table
      db.exec('ALTER TABLE users ADD COLUMN jwt_secret TEXT');
      console.log('[Migration v6] Added jwt_secret column to users table');
    } else {
      console.log('[Migration v6] jwt_secret column already exists, skipping');
    }
  },
  down: (db) => {
    // SQLite doesn't support DROP COLUMN directly, need to recreate table
    db.exec(
      'CREATE TABLE users_backup AS SELECT id, username, email, password_hash, avatar_path, created_at, updated_at, last_login FROM users'
    );
    db.exec('DROP TABLE users');
    db.exec('ALTER TABLE users_backup RENAME TO users');
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    console.log('[Migration v6] Rolled back: Removed jwt_secret column from users table');
  },
};

/**
 * Migration v6 -> v7: Add Personal Assistant tables
 * Supports remote interaction through messaging platforms (Telegram, Slack, Discord)
 */
const migration_v7: IMigration = {
  version: 7,
  name: 'Add Personal Assistant tables',
  up: (db) => {
    // Assistant plugins configuration
    db.exec(`CREATE TABLE IF NOT EXISTS assistant_plugins (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('telegram', 'slack', 'discord')),
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 0,
        config TEXT NOT NULL,
        status TEXT CHECK(status IN ('created', 'initializing', 'ready', 'starting', 'running', 'stopping', 'stopped', 'error')),
        last_connected INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_type ON assistant_plugins(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_enabled ON assistant_plugins(enabled)');

    // Authorized users whitelist
    db.exec(`CREATE TABLE IF NOT EXISTS assistant_users (
        id TEXT PRIMARY KEY,
        platform_user_id TEXT NOT NULL,
        platform_type TEXT NOT NULL,
        display_name TEXT,
        authorized_at INTEGER NOT NULL,
        last_active INTEGER,
        session_id TEXT,
        UNIQUE(platform_user_id, platform_type)
      )`);
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_assistant_users_platform ON assistant_users(platform_type, platform_user_id)'
    );

    // User sessions
    db.exec(`CREATE TABLE IF NOT EXISTS assistant_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        agent_type TEXT NOT NULL CHECK(agent_type IN ('gemini', 'acp', 'codex')),
        conversation_id TEXT,
        workspace TEXT,
        created_at INTEGER NOT NULL,
        last_activity INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES assistant_users(id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
      )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_sessions_user ON assistant_sessions(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_sessions_conversation ON assistant_sessions(conversation_id)');

    // Pending pairing requests
    db.exec(`CREATE TABLE IF NOT EXISTS assistant_pairing_codes (
        code TEXT PRIMARY KEY,
        platform_user_id TEXT NOT NULL,
        platform_type TEXT NOT NULL,
        display_name TEXT,
        requested_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'expired'))
      )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_pairing_expires ON assistant_pairing_codes(expires_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_pairing_status ON assistant_pairing_codes(status)');

    console.log('[Migration v7] Added Personal Assistant tables');
  },
  down: (db) => {
    db.exec('DROP TABLE IF EXISTS assistant_pairing_codes');
    db.exec('DROP TABLE IF EXISTS assistant_sessions');
    db.exec('DROP TABLE IF EXISTS assistant_users');
    db.exec('DROP TABLE IF EXISTS assistant_plugins');
    console.log('[Migration v7] Rolled back: Removed Personal Assistant tables');
  },
};

/**
 * Migration v7 -> v8: Add source column to conversations table
 */
const migration_v8: IMigration = {
  version: 8,
  name: 'Add source column to conversations',
  up: (db) => {
    // Add source column to conversations table
    db.exec(`ALTER TABLE conversations ADD COLUMN source TEXT CHECK(source IN ('wayland', 'telegram'))`);

    // Create index for efficient source-based queries
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');

    console.log('[Migration v8] Added source column to conversations table');
  },
  down: (db) => {
    // SQLite doesn't support DROP COLUMN directly, need to recreate table
    // For simplicity, just drop the indexes (column will remain)
    db.exec('DROP INDEX IF EXISTS idx_conversations_source');
    db.exec('DROP INDEX IF EXISTS idx_conversations_source_updated');
    console.log('[Migration v8] Rolled back: Removed source indexes');
  },
};

/**
 * Migration v8 -> v9: Add cron_jobs table for scheduled tasks
 */
const migration_v9: IMigration = {
  version: 9,
  name: 'Add cron_jobs table',
  up: (db) => {
    db.exec(`CREATE TABLE IF NOT EXISTS cron_jobs (
        -- Basic info
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,

        -- Schedule
        schedule_kind TEXT NOT NULL,       -- 'at' | 'every' | 'cron'
        schedule_value TEXT NOT NULL,      -- timestamp | ms | cron expr
        schedule_tz TEXT,                  -- timezone (optional)
        schedule_description TEXT NOT NULL, -- human-readable description

        -- Target
        payload_message TEXT NOT NULL,

        -- Metadata (for management)
        conversation_id TEXT NOT NULL,     -- Which conversation created this
        conversation_title TEXT,           -- For display in UI
        agent_type TEXT NOT NULL,          -- 'gemini' | 'claude' | 'codex' | etc.
        created_by TEXT NOT NULL,          -- 'user' | 'agent'
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),

        -- Runtime state
        next_run_at INTEGER,
        last_run_at INTEGER,
        last_status TEXT,                  -- 'ok' | 'error' | 'skipped'
        last_error TEXT,                   -- Error message if failed
        run_count INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3
      )`);
    // Index for querying jobs by conversation (frontend management)
    db.exec('CREATE INDEX IF NOT EXISTS idx_cron_jobs_conversation ON cron_jobs(conversation_id)');
    // Index for scheduler to find next jobs to run
    db.exec('CREATE INDEX IF NOT EXISTS idx_cron_jobs_next_run ON cron_jobs(next_run_at) WHERE enabled = 1');
    // Index for querying by agent type (if needed)
    db.exec('CREATE INDEX IF NOT EXISTS idx_cron_jobs_agent_type ON cron_jobs(agent_type)');
    console.log('[Migration v9] Added cron_jobs table');
  },
  down: (db) => {
    db.exec('DROP INDEX IF EXISTS idx_cron_jobs_agent_type');
    db.exec('DROP INDEX IF EXISTS idx_cron_jobs_next_run');
    db.exec('DROP INDEX IF EXISTS idx_cron_jobs_conversation');
    db.exec('DROP TABLE IF EXISTS cron_jobs');
    console.log('[Migration v9] Rolled back: Removed cron_jobs table');
  },
};

/**
 * Migration v9 -> v10: Add 'lark' to assistant_plugins type constraint
 */
const migration_v10: IMigration = {
  version: 10,
  name: 'Add lark to assistant_plugins type constraint',
  up: (db) => {
    // SQLite doesn't support ALTER TABLE to modify CHECK constraints
    // We need to recreate the table with the new constraint
    db.exec(`CREATE TABLE IF NOT EXISTS assistant_plugins_new (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('telegram', 'slack', 'discord', 'lark')),
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 0,
        config TEXT NOT NULL,
        status TEXT CHECK(status IN ('created', 'initializing', 'ready', 'starting', 'running', 'stopping', 'stopped', 'error')),
        last_connected INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`);
    db.exec('INSERT OR IGNORE INTO assistant_plugins_new SELECT * FROM assistant_plugins');
    db.exec('DROP TABLE IF EXISTS assistant_plugins');
    db.exec('ALTER TABLE assistant_plugins_new RENAME TO assistant_plugins');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_type ON assistant_plugins(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_enabled ON assistant_plugins(enabled)');

    console.log('[Migration v10] Added lark to assistant_plugins type constraint');
  },
  down: (db) => {
    // Rollback: recreate table without lark type (data with lark type will be lost)
    db.exec(`CREATE TABLE IF NOT EXISTS assistant_plugins_old (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('telegram', 'slack', 'discord')),
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 0,
        config TEXT NOT NULL,
        status TEXT CHECK(status IN ('created', 'initializing', 'ready', 'starting', 'running', 'stopping', 'stopped', 'error')),
        last_connected INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`);
    db.exec(`INSERT OR IGNORE INTO assistant_plugins_old SELECT * FROM assistant_plugins WHERE type != 'lark'`);
    db.exec('DROP TABLE IF EXISTS assistant_plugins');
    db.exec('ALTER TABLE assistant_plugins_old RENAME TO assistant_plugins');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_type ON assistant_plugins(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_enabled ON assistant_plugins(enabled)');
    console.log('[Migration v10] Rolled back: Removed lark from assistant_plugins type constraint');
  },
};

/**
 * Migration v10 -> v11: Add 'openclaw-gateway' to conversations type constraint
 */
const migration_v11: IMigration = {
  version: 11,
  name: 'Add openclaw-gateway to conversations type constraint',
  up: (db) => {
    // SQLite doesn't support ALTER TABLE to modify CHECK constraints.
    // We recreate the table with the new constraint.
    // NOTE: The migration runner disables foreign_keys before the transaction,
    // so DROP TABLE will NOT trigger ON DELETE CASCADE on the messages table.

    // Clean up any invalid source values before copying
    db.exec(
      `UPDATE conversations SET source = NULL WHERE source IS NOT NULL AND source NOT IN ('wayland', 'telegram')`
    );

    db.exec(`CREATE TABLE IF NOT EXISTS conversations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT CHECK(source IS NULL OR source IN ('wayland', 'telegram')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_new (id, user_id, name, type, extra, model, status, source, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_new RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');

    console.log('[Migration v11] Added openclaw-gateway to conversations type constraint');
  },
  down: (db) => {
    // Rollback: recreate table without openclaw-gateway type
    // (data with openclaw-gateway type will be lost)
    // NOTE: foreign_keys is disabled by the migration runner before the transaction.
    db.exec(`CREATE TABLE IF NOT EXISTS conversations_rollback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT CHECK(source IS NULL OR source IN ('wayland', 'telegram')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_rollback (id, user_id, name, type, extra, model, status, source, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, created_at, updated_at FROM conversations WHERE type != 'openclaw-gateway'`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_rollback RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');

    console.log('[Migration v11] Rolled back: Removed openclaw-gateway from conversations type constraint');
  },
};

/**
 * Migration v11 -> v12: Add 'lark' to conversations source CHECK constraint
 */
const migration_v12: IMigration = {
  version: 12,
  name: 'Add lark to conversations source constraint',
  up: (db) => {
    // SQLite doesn't support ALTER TABLE to modify CHECK constraints.
    // We recreate the table with the updated constraint that includes 'lark'.
    // NOTE: The migration runner disables foreign_keys before the transaction,
    // so DROP TABLE will NOT trigger ON DELETE CASCADE on the messages table.

    // Clean up any invalid source values before copying
    db.exec(
      `UPDATE conversations SET source = NULL WHERE source IS NOT NULL AND source NOT IN ('wayland', 'telegram', 'lark')`
    );

    db.exec(`CREATE TABLE IF NOT EXISTS conversations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT CHECK(source IS NULL OR source IN ('wayland', 'telegram', 'lark')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_new (id, user_id, name, type, extra, model, status, source, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_new RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');

    console.log('[Migration v12] Added lark to conversations source constraint');
  },
  down: (db) => {
    // Rollback: recreate table without 'lark' in source constraint
    // NOTE: foreign_keys is disabled by the migration runner before the transaction.

    // Clean up lark source values before copying to table with stricter constraint
    db.exec(`UPDATE conversations SET source = NULL WHERE source = 'lark'`);

    db.exec(`CREATE TABLE IF NOT EXISTS conversations_rollback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT CHECK(source IS NULL OR source IN ('wayland', 'telegram')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_rollback (id, user_id, name, type, extra, model, status, source, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_rollback RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');

    console.log('[Migration v12] Rolled back: Removed lark from conversations source constraint');
  },
};

/**
 * Migration v12 -> v13: Add 'nanobot' to conversations type CHECK constraint
 */
const migration_v13: IMigration = {
  version: 13,
  name: 'Add nanobot to conversations type constraint',
  up: (db) => {
    // SQLite doesn't support ALTER TABLE to modify CHECK constraints.
    // We recreate the table with the updated constraint that includes 'nanobot'.
    // NOTE: The migration runner disables foreign_keys before the transaction,
    // so DROP TABLE will NOT trigger ON DELETE CASCADE on the messages table.

    db.exec(`CREATE TABLE IF NOT EXISTS conversations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway', 'nanobot')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT CHECK(source IS NULL OR source IN ('wayland', 'telegram', 'lark')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_new (id, user_id, name, type, extra, model, status, source, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_new RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');

    console.log('[Migration v13] Added nanobot to conversations type constraint');
  },
  down: (db) => {
    // Rollback: recreate table without 'nanobot' in type constraint
    // NOTE: foreign_keys is disabled by the migration runner before the transaction.

    // Remove nanobot conversations before copying to table with stricter constraint
    db.exec(`DELETE FROM conversations WHERE type = 'nanobot'`);

    db.exec(`CREATE TABLE IF NOT EXISTS conversations_rollback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT CHECK(source IS NULL OR source IN ('wayland', 'telegram', 'lark')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_rollback (id, user_id, name, type, extra, model, status, source, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_rollback RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');

    console.log('[Migration v13] Rolled back: Removed nanobot from conversations type constraint');
  },
};

/**
 * Migration v13 -> v14: Add 'dingtalk' to assistant_plugins type and conversations source CHECK constraints
 */
const migration_v14: IMigration = {
  version: 14,
  name: 'Add dingtalk to assistant_plugins type and conversations source constraints',
  up: (db) => {
    // 1. Recreate assistant_plugins with 'dingtalk' in type constraint
    db.exec(`CREATE TABLE IF NOT EXISTS assistant_plugins_new (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('telegram', 'slack', 'discord', 'lark', 'dingtalk')),
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 0,
        config TEXT NOT NULL,
        status TEXT CHECK(status IN ('created', 'initializing', 'ready', 'starting', 'running', 'stopping', 'stopped', 'error')),
        last_connected INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`);
    db.exec('INSERT OR IGNORE INTO assistant_plugins_new SELECT * FROM assistant_plugins');
    db.exec('DROP TABLE IF EXISTS assistant_plugins');
    db.exec('ALTER TABLE assistant_plugins_new RENAME TO assistant_plugins');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_type ON assistant_plugins(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_enabled ON assistant_plugins(enabled)');

    // 2. Recreate conversations with 'dingtalk' in source constraint
    // NOTE: The migration runner disables foreign_keys before the transaction,
    // so DROP TABLE will NOT trigger ON DELETE CASCADE on the messages table.
    db.exec(
      `UPDATE conversations SET source = NULL WHERE source IS NOT NULL AND source NOT IN ('wayland', 'telegram', 'lark', 'dingtalk')`
    );

    db.exec(`CREATE TABLE IF NOT EXISTS conversations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway', 'nanobot')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT CHECK(source IS NULL OR source IN ('wayland', 'telegram', 'lark', 'dingtalk')),
        channel_chat_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_new (id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, NULL, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_new RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_conversations_source_chat ON conversations(source, channel_chat_id, updated_at DESC)'
    );

    // 3. Add chat_id to assistant_sessions for per-chat session isolation
    const sessTableInfo = db.prepare('PRAGMA table_info(assistant_sessions)').all() as Array<{ name: string }>;
    if (!sessTableInfo.some((col) => col.name === 'chat_id')) {
      db.exec('ALTER TABLE assistant_sessions ADD COLUMN chat_id TEXT');
    }

    console.log('[Migration v14] Added dingtalk support and channel_chat_id for per-chat isolation');
  },
  down: (db) => {
    // Rollback assistant_plugins: remove 'dingtalk'
    db.exec(`DELETE FROM assistant_plugins WHERE type = 'dingtalk'`);

    db.exec(`CREATE TABLE IF NOT EXISTS assistant_plugins_old (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('telegram', 'slack', 'discord', 'lark')),
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 0,
        config TEXT NOT NULL,
        status TEXT CHECK(status IN ('created', 'initializing', 'ready', 'starting', 'running', 'stopping', 'stopped', 'error')),
        last_connected INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`);
    db.exec(`INSERT OR IGNORE INTO assistant_plugins_old SELECT * FROM assistant_plugins WHERE type != 'dingtalk'`);
    db.exec('DROP TABLE IF EXISTS assistant_plugins');
    db.exec('ALTER TABLE assistant_plugins_old RENAME TO assistant_plugins');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_type ON assistant_plugins(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_enabled ON assistant_plugins(enabled)');

    // Rollback conversations: remove 'dingtalk' from source
    db.exec(`UPDATE conversations SET source = NULL WHERE source = 'dingtalk'`);

    db.exec(`CREATE TABLE IF NOT EXISTS conversations_rollback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway', 'nanobot')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT CHECK(source IS NULL OR source IN ('wayland', 'telegram', 'lark')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_rollback (id, user_id, name, type, extra, model, status, source, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_rollback RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');

    console.log('[Migration v14] Rolled back: Removed dingtalk and channel_chat_id');
  },
};

/**
 * All migrations in order
 */
/**
 * Migration v14 -> v15: Remove strict CHECK constraints on type/source
 * to allow extension-contributed channel plugins.
 */
const migration_v15: IMigration = {
  version: 15,
  name: 'Remove strict constraints for extension channels',
  up: (db) => {
    // 1. Recreate assistant_plugins without strict type constraint
    db.exec(`CREATE TABLE IF NOT EXISTS assistant_plugins_new (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- Removed CHECK constraint
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 0,
        config TEXT NOT NULL,
        status TEXT CHECK(status IN ('created', 'initializing', 'ready', 'starting', 'running', 'stopping', 'stopped', 'error')),
        last_connected INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`);
    db.exec('INSERT OR IGNORE INTO assistant_plugins_new SELECT * FROM assistant_plugins');
    db.exec('DROP TABLE IF EXISTS assistant_plugins');
    db.exec('ALTER TABLE assistant_plugins_new RENAME TO assistant_plugins');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_type ON assistant_plugins(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_plugins_enabled ON assistant_plugins(enabled)');

    // 2. Recreate conversations without strict source constraint
    db.exec(`CREATE TABLE IF NOT EXISTS conversations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway', 'nanobot')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT, -- Removed CHECK constraint
        channel_chat_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_new (id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_new RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_conversations_source_chat ON conversations(source, channel_chat_id, updated_at DESC)'
    );

    console.log('[Migration v15] Removed strict constraints for extension channels');
  },
  down: (_db) => {
    // Cannot safely rollback if there are custom types/sources in the database.
    // For now, we just log a warning and do nothing, or we could delete them.
    console.warn('[Migration v15] Rollback skipped to prevent data loss of extension channels.');
  },
};

/**
 * Migration v15 -> v16: Add remote_agents table + 'remote' to conversations type
 */
const migration_v16: IMigration = {
  version: 16,
  name: 'Add remote_agents table and remote conversation type',
  up: (db) => {
    // 1. Create remote_agents table
    db.exec(`CREATE TABLE IF NOT EXISTS remote_agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        protocol TEXT NOT NULL DEFAULT 'openclaw',
        url TEXT NOT NULL,
        auth_type TEXT NOT NULL DEFAULT 'bearer',
        auth_token TEXT,
        avatar TEXT,
        description TEXT,
        status TEXT DEFAULT 'unknown',
        last_connected_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_remote_agents_protocol ON remote_agents(protocol)');

    // 2. Recreate conversations with 'remote' added to type CHECK
    db.exec(`CREATE TABLE IF NOT EXISTS conversations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway', 'nanobot', 'remote')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT,
        channel_chat_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_new (id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_new RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_conversations_source_chat ON conversations(source, channel_chat_id, updated_at DESC)'
    );

    console.log('[Migration v16] Added remote_agents table and remote conversation type');
  },
  down: (db) => {
    db.exec('DROP INDEX IF EXISTS idx_remote_agents_protocol');
    db.exec('DROP TABLE IF EXISTS remote_agents');
    console.log('[Migration v16] Rolled back: Removed remote_agents table');
  },
};

/**
 * Migration v16 -> v17: Add device identity columns to remote_agents
 */
const migration_v17: IMigration = {
  version: 17,
  name: 'Add device identity columns to remote_agents',
  up: (db) => {
    const columns = new Set((db.pragma('table_info(remote_agents)') as Array<{ name: string }>).map((c) => c.name));
    if (!columns.has('device_id')) {
      db.exec('ALTER TABLE remote_agents ADD COLUMN device_id TEXT');
    }
    if (!columns.has('device_public_key')) {
      db.exec('ALTER TABLE remote_agents ADD COLUMN device_public_key TEXT');
    }
    if (!columns.has('device_private_key')) {
      db.exec('ALTER TABLE remote_agents ADD COLUMN device_private_key TEXT');
    }
    if (!columns.has('device_token')) {
      db.exec('ALTER TABLE remote_agents ADD COLUMN device_token TEXT');
    }
    console.log('[Migration v17] Added device identity columns to remote_agents');
  },
  down: (_db) => {
    // SQLite does not support DROP COLUMN before 3.35.0; skip rollback to prevent data loss.
    console.warn('[Migration v17] Rollback skipped: cannot drop columns safely.');
  },
};

/**
 * Migration v17 -> v18: Add allow_insecure column to remote_agents
 */
const migration_v18: IMigration = {
  version: 18,
  name: 'Add allow_insecure column to remote_agents',
  up: (db) => {
    const columns = new Set((db.pragma('table_info(remote_agents)') as Array<{ name: string }>).map((c) => c.name));
    if (!columns.has('allow_insecure')) {
      db.exec('ALTER TABLE remote_agents ADD COLUMN allow_insecure INTEGER DEFAULT 0');
    }
    console.log('[Migration v18] Added allow_insecure column to remote_agents');
  },
  down: (_db) => {
    // SQLite does not support DROP COLUMN before 3.35.0; skip rollback to prevent data loss.
    console.warn('[Migration v18] Rollback skipped: cannot drop columns safely.');
  },
};

/**
 * Migration v18 -> v19: Add teams table for Team mode
 *
 * NOTE: This migration intentionally omits `lead_agent_id`. That column was
 * added in v20 via ALTER TABLE. Users who upgrade directly to v20+ get the
 * column via the v20 migration; the omission here is a known historical gap,
 * not a bug. Do NOT add `lead_agent_id` here - it would conflict with v20.
 */
const migration_v19: IMigration = {
  version: 19,
  name: 'Add teams table',
  up: (db) => {
    db.exec(`CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      workspace TEXT NOT NULL,
      workspace_mode TEXT NOT NULL DEFAULT 'shared',
      agents TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_teams_updated_at ON teams(updated_at)');
  },
  down: (db) => {
    db.exec('DROP INDEX IF EXISTS idx_teams_updated_at');
    db.exec('DROP INDEX IF EXISTS idx_teams_user_id');
    db.exec('DROP TABLE IF EXISTS teams');
  },
};

const migration_v20: IMigration = {
  version: 20,
  name: 'Add lead_agent_id to teams, create mailbox and team_tasks tables',
  up: (db) => {
    // Ensure teams table exists (v19 should have created it, but guard against
    // dev databases where v19 ran without the teams migration content)
    db.exec(`CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      workspace TEXT NOT NULL,
      workspace_mode TEXT NOT NULL DEFAULT 'shared',
      agents TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_teams_updated_at ON teams(updated_at)');

    // Add lead_agent_id column (ignore if already exists from a prior v19 run)
    try {
      db.exec(`ALTER TABLE teams ADD COLUMN lead_agent_id TEXT NOT NULL DEFAULT ''`);
    } catch {
      // Column already exists - safe to ignore
    }
    db.exec(`CREATE TABLE IF NOT EXISTS mailbox (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      to_agent_id TEXT NOT NULL,
      from_agent_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'message',
      content TEXT NOT NULL,
      summary TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_mailbox_to ON mailbox(team_id, to_agent_id, read)');
    db.exec(`CREATE TABLE IF NOT EXISTS team_tasks (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      owner TEXT,
      blocked_by TEXT NOT NULL DEFAULT '[]',
      blocks TEXT NOT NULL DEFAULT '[]',
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_team ON team_tasks(team_id, status)');
  },
  down: (db) => {
    // SQLite does not support DROP COLUMN; leave lead_agent_id in place
    db.exec('DROP INDEX IF EXISTS idx_tasks_team');
    db.exec('DROP TABLE IF EXISTS team_tasks');
    db.exec('DROP INDEX IF EXISTS idx_mailbox_to');
    db.exec('DROP TABLE IF EXISTS mailbox');
  },
};

/**
 * Migration v20 -> v21: Add 'aionrs' to conversations type CHECK constraint
 */
const migration_v21: IMigration = {
  version: 21,
  name: "Add 'aionrs' to conversations type CHECK",
  up: (db) => {
    db.exec(`CREATE TABLE IF NOT EXISTS conversations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway', 'nanobot', 'remote', 'aionrs')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT,
        channel_chat_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_new (id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_new RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_conversations_source_chat ON conversations(source, channel_chat_id, updated_at DESC)'
    );
    console.log("[Migration v21] Added 'aionrs' to conversations type CHECK");
  },
  down: (db) => {
    // Remove aionrs conversations before copying to table with stricter constraint
    db.exec(`DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE type = 'aionrs')`);
    db.exec(`DELETE FROM conversations WHERE type = 'aionrs'`);

    db.exec(`CREATE TABLE IF NOT EXISTS conversations_rollback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gemini', 'acp', 'codex', 'openclaw-gateway', 'nanobot', 'remote')),
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT,
        channel_chat_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_rollback (id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_rollback RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_conversations_source_chat ON conversations(source, channel_chat_id, updated_at DESC)'
    );

    console.log("[Migration v21] Rolled back: Removed 'aionrs' from conversations type CHECK");
  },
};

/**
 * Migration v21 -> v22: Remove CHECK constraint on conversations.type,
 * add cron job columns, hidden messages, and cronJobId index.
 *
 * The CHECK(type IN (...)) constraint forced a heavy table-rebuild migration
 * every time a new agent type was added (v10, v11, v14, v15, v16, v21 all did this).
 * By removing the constraint, new agent types only need TypeScript-level changes
 * (TChatConversation union + rowToConversation branch) - no database migration.
 */
const migration_v22: IMigration = {
  version: 22,
  name: 'Remove type CHECK, add cron columns, hidden messages',
  up: (db) => {
    // 1. Remove CHECK constraint on conversations.type
    db.exec(`CREATE TABLE IF NOT EXISTS conversations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        extra TEXT NOT NULL,
        model TEXT,
        status TEXT CHECK(status IN ('pending', 'running', 'finished')),
        source TEXT,
        channel_chat_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
    db.exec(`INSERT INTO conversations_new (id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at)
      SELECT id, user_id, name, type, extra, model, status, source, channel_chat_id, created_at, updated_at FROM conversations`);
    db.exec('DROP TABLE conversations');
    db.exec('ALTER TABLE conversations_new RENAME TO conversations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_source_updated ON conversations(source, updated_at DESC)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_conversations_source_chat ON conversations(source, channel_chat_id, updated_at DESC)'
    );
    db.exec(
      `CREATE INDEX IF NOT EXISTS idx_conversations_cron_job_id ON conversations(json_extract(extra, '$.cronJobId'))`
    );

    // 2. Add cron job columns (execution_mode, agent_config)
    const cronColumns = new Set((db.pragma('table_info(cron_jobs)') as Array<{ name: string }>).map((c) => c.name));
    if (!cronColumns.has('execution_mode')) {
      db.exec(`ALTER TABLE cron_jobs ADD COLUMN execution_mode TEXT DEFAULT 'existing'`);
    }
    if (!cronColumns.has('agent_config')) {
      db.exec(`ALTER TABLE cron_jobs ADD COLUMN agent_config TEXT`);
    }
    // Fix legacy jobs: empty conversation_id means they were created before execution_mode existed
    db.exec(
      `UPDATE cron_jobs SET execution_mode = 'new_conversation' WHERE conversation_id = '' OR conversation_id IS NULL`
    );

    // 3. Add hidden column to messages
    const msgColumns = new Set((db.pragma('table_info(messages)') as Array<{ name: string }>).map((c) => c.name));
    if (!msgColumns.has('hidden')) {
      db.exec(`ALTER TABLE messages ADD COLUMN hidden INTEGER DEFAULT 0`);
    }

    console.log('[Migration v22] Removed type CHECK, added cron columns, hidden messages');
  },
  down: (_db) => {
    // Cannot safely rollback - re-adding CHECK would reject unknown types already in the table.
    console.warn('[Migration v22] Rollback skipped: re-adding CHECK constraint could reject existing data.');
  },
};

/**
 * Migration v22 -> v23: Add session_mode column to teams table
 * Persists the team-level session permission mode so newly spawned agents
 * inherit the correct mode without falling back to the leader agent's extra.
 */
const migration_v23: IMigration = {
  version: 23,
  name: 'Add session_mode to teams table',
  up: (db) => {
    const columns = new Set((db.pragma('table_info(teams)') as Array<{ name: string }>).map((c) => c.name));
    if (!columns.has('session_mode')) {
      db.exec('ALTER TABLE teams ADD COLUMN session_mode TEXT');
    }
    console.log('[Migration v23] Added session_mode column to teams table');
  },
  down: (_db) => {
    // SQLite does not support DROP COLUMN before 3.35.0; skip rollback to prevent data loss.
    console.warn('[Migration v23] Rollback skipped: cannot drop columns safely.');
  },
};

/**
 * Migration v23 -> v24: Add description to cron_jobs table
 */
const migration_v24: IMigration = {
  version: 24,
  name: 'Add description to cron_jobs table',
  up: (db) => {
    const cronColumns = new Set((db.pragma('table_info(cron_jobs)') as Array<{ name: string }>).map((c) => c.name));
    if (!cronColumns.has('description')) {
      db.exec('ALTER TABLE cron_jobs ADD COLUMN description TEXT');
    }
    console.log('[Migration v24] Added description column to cron_jobs table');
  },
  down: (_db) => {
    // SQLite does not support DROP COLUMN before 3.35.0; skip rollback to prevent data loss.
    console.warn('[Migration v24] Rollback skipped: cannot drop columns safely.');
  },
};

/**
 * Migration v24 -> v25: Add files column to mailbox table
 * Stores JSON-serialized file paths so team mode can forward attachments to agents.
 */
const migration_v25: IMigration = {
  version: 25,
  name: 'Add files column to mailbox table',
  up: (db) => {
    const columns = new Set((db.pragma('table_info(mailbox)') as Array<{ name: string }>).map((c) => c.name));
    if (!columns.has('files')) {
      db.exec('ALTER TABLE mailbox ADD COLUMN files TEXT');
      console.log('[Migration v25] Added files column to mailbox table');
    } else {
      console.log('[Migration v25] files column already exists, skipping');
    }
  },
  down: (_db) => {
    // SQLite does not support DROP COLUMN before 3.35.0; skip rollback to prevent data loss.
    console.warn('[Migration v25] Rollback skipped: cannot drop columns safely.');
  },
};

/**
 * Migration v25 -> v26: Add acp_session table for ACP session persistence
 * Stores session state for suspend/resume across app restarts.
 */
const migration_v26: IMigration = {
  version: 26,
  name: 'Add acp_session table',
  up: (db) => {
    db.exec(`CREATE TABLE IF NOT EXISTS acp_session (
      conversation_id TEXT PRIMARY KEY,
      agent_backend TEXT NOT NULL,
      agent_source TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      session_id TEXT,
      session_status TEXT NOT NULL DEFAULT 'idle',
      session_config TEXT NOT NULL DEFAULT '{}',
      last_active_at INTEGER,
      suspended_at INTEGER
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_acp_session_status ON acp_session(session_status)');
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_acp_session_suspended ON acp_session(session_status, suspended_at) WHERE session_status = 'suspended'"
    );
    db.exec('CREATE INDEX IF NOT EXISTS idx_acp_session_agent_id ON acp_session(agent_id)');
    console.log('[Migration v26] Added acp_session table');
  },
  down: (db) => {
    db.exec('DROP INDEX IF EXISTS idx_acp_session_suspended');
    db.exec('DROP INDEX IF EXISTS idx_acp_session_status');
    db.exec('DROP INDEX IF EXISTS idx_acp_session_agent_id');
    db.exec('DROP TABLE IF EXISTS acp_session');
    console.log('[Migration v26] Rolled back: Removed acp_session table');
  },
};

/**
 * Migration v26 -> v27: documentation-only entry for the conversations.type
 * column accepting 'wcore' alongside the prior legacy backend identifier.
 *
 * No schema change. v22 already removed the `CHECK(type IN ...)` constraint
 * from `conversations.type`, so the column accepts any string and no
 * schema-level work is required to allow 'wcore'.
 *
 * Historical note: this migration originally documented a dual-write/dual-read
 * policy that briefly accepted the prior legacy backend identifier alongside
 * 'wcore'. That alias was subsequently removed - there were no production
 * users to migrate. New writes and readers only use 'wcore'. The migration
 * name and console.log strings below are preserved as historical record.
 */
const migration_v27: IMigration = {
  version: 27,
  name: "Accept 'wcore' alongside 'aionrs' on conversations.type (no schema change)",
  up: (_db) => {
    console.log(
      "[Migration v27] 'wcore'/'aionrs' dual-write/read policy documented (no schema change since v22 removed type CHECK)"
    );
  },
  down: (_db) => {
    console.log('[Migration v27] Rolled back (no schema change)');
  },
};

/**
 * Migration v27 -> v28: Add token_family table (H5 - bounded refresh sliding window)
 *
 * Tracks JWT refresh-token families so the /api/auth/refresh endpoint can no
 * longer be used to extend a stolen token indefinitely. A family is created
 * at login and revoked on logout and password change.
 */
const migration_v28: IMigration = {
  version: 28,
  name: 'Add token_family table',
  up: (db) => {
    const ddl = [
      'CREATE TABLE IF NOT EXISTS token_family (',
      '  id TEXT PRIMARY KEY,',
      '  user_id TEXT NOT NULL,',
      '  created_at INTEGER NOT NULL,',
      '  revoked_at INTEGER',
      ')',
    ].join('\n');
    const idxDdl = 'CREATE INDEX IF NOT EXISTS idx_token_family_user_id ON token_family(user_id)';
    const run = (sql: string) => db.exec(sql);
    run(ddl);
    run(idxDdl);
    console.log('[Migration v28] Added token_family table');
  },
  down: (db) => {
    const run = (sql: string) => db.exec(sql);
    run('DROP INDEX IF EXISTS idx_token_family_user_id');
    run('DROP TABLE IF EXISTS token_family');
    console.log('[Migration v28] Rolled back: Removed token_family table');
  },
};

/**
 * Migration v28 -> v29: Add token_blacklist table
 *
 * Persists revoked-token hashes so logout survives a process restart. Each
 * row stores the SHA-256 of the JWT and its exp timestamp so the cleanup
 * timer can drop entries once the underlying token would have expired
 * anyway.
 */
const migration_v29: IMigration = {
  version: 29,
  name: 'Add token_blacklist table',
  up: (db) => {
    const ddl = [
      'CREATE TABLE IF NOT EXISTS token_blacklist (',
      '  token_hash TEXT PRIMARY KEY,',
      '  expires_at INTEGER NOT NULL',
      ')',
    ].join('\n');
    const idxDdl = 'CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at)';
    db.exec(ddl);
    db.exec(idxDdl);
    console.log('[Migration v29] Added token_blacklist table');
  },
  down: (db) => {
    db.exec('DROP INDEX IF EXISTS idx_token_blacklist_expires_at');
    db.exec('DROP TABLE IF EXISTS token_blacklist');
    console.log('[Migration v29] Rolled back: Removed token_blacklist table');
  },
};

/**
 * Migration v29 -> v30: Self-heal legacy 'aionrs' rows to 'wcore'.
 *
 * The 2026-05-15 brand ripout (commits 5eada223a..446d8605e) collapsed
 * all functional 'aionrs' identifiers in the source to 'wcore'. Production
 * had no users to migrate so the source-level change shipped without a
 * data migration. But dev databases predating the ripout still hold rows
 * with type='aionrs' (conversations) or agent_type='aionrs' (cron_jobs),
 * which the post-ripout code can no longer route - manifests as
 * conversations that display as shells but whose response streams stall
 * with no observable error.
 *
 * This migration auto-heals those rows on next launch:
 *   - conversations.type:                  'aionrs' -> 'wcore'
 *   - conversations.extra.backend (JSON):  'aionrs' -> 'wcore'
 *   - cron_jobs.agent_type:                'aionrs' -> 'wcore'
 *   - cron_jobs.agent_config.backend:      'aionrs' -> 'wcore'
 *
 * Idempotent: each WHERE clause filters on the legacy value, so re-runs
 * on already-migrated DBs change zero rows.
 *
 * No down(): rolling back would produce rows the runtime can't read.
 * To truly revert, downgrade past the ripout commit chain instead.
 */
const migration_v30: IMigration = {
  version: 30,
  name: "Self-heal legacy 'aionrs' rows to 'wcore' (auto-heal pre-ripout dev DBs)",
  up: (db) => {
    const r1 = db.prepare("UPDATE conversations SET type='wcore' WHERE type='aionrs'").run();
    const r2 = db
      .prepare(
        "UPDATE conversations SET extra = json_set(extra, '$.backend', 'wcore') " +
          "WHERE extra IS NOT NULL AND json_extract(extra, '$.backend') = 'aionrs'"
      )
      .run();
    const r3 = db.prepare("UPDATE cron_jobs SET agent_type='wcore' WHERE agent_type='aionrs'").run();
    const r4 = db
      .prepare(
        "UPDATE cron_jobs SET agent_config = json_set(agent_config, '$.backend', 'wcore') " +
          "WHERE agent_config IS NOT NULL AND json_extract(agent_config, '$.backend') = 'aionrs'"
      )
      .run();
    console.log(
      `[Migration v30] Self-heal: conversations.type=${r1.changes}, conversations.extra.backend=${r2.changes}, ` +
        `cron_jobs.agent_type=${r3.changes}, cron_jobs.agent_config.backend=${r4.changes}`
    );
  },
  down: (_db) => {
    // Intentionally no rollback - the legacy 'aionrs' identifier was removed
    // from the runtime in the 2026-05-15 ripout. Re-introducing 'aionrs'
    // rows would produce data the post-ripout code can no longer read.
    console.log("[Migration v30] No rollback - legacy 'aionrs' identifier removed from runtime");
  },
};

/**
 * Migration v30 -> v31: Clear stale ACP session state from conversations.
 *
 * Conversations store their last ACP session id (acpSessionId, plus a few
 * supporting fields) in `extra` so reopening the conversation can resume
 * the session. When the ACP wrapper version changes (e.g. the
 * 2026-05-15 @agentclientprotocol/claude-agent-acp 0.29.2 → 0.33.1 bump),
 * the stored session ids reference sessions from the old wrapper. The new
 * wrapper accepts the loadSession call and returns a config, but the
 * resumed session has inconsistent state - manifests as prompts that
 * stall on the first tool call (the renderer displays the tool card with
 * empty `{}` input forever, then Wayland's timeout fires).
 *
 * This migration is a one-time reset of the stored ACP session pointers
 * across all conversations. Next interaction creates a fresh session
 * against the current wrapper. Message history (the messages table) is
 * untouched - only the live-session bookkeeping is cleared.
 *
 * Fields cleared from conversations.extra:
 *   - acpSessionId               (the stale session uuid)
 *   - acpSessionConversationId   (self-reference, no longer useful)
 *   - acpSessionUpdatedAt        (timestamp of stale session)
 *   - cachedConfigOptions        (cached wrapper config; may miss new options like 'effort' from 0.33.1)
 *
 * Also truncates the in-DB acp_session bookkeeping table (it caches live
 * session state; clearing forces a fresh row on next interaction).
 *
 * Idempotent: row counts are reported. Re-running this migration on a
 * DB that's already been cleared changes zero rows.
 *
 * No down(): the cleared state was already stale; there's nothing
 * meaningful to roll back to.
 */
const migration_v31: IMigration = {
  version: 31,
  name: 'Clear stale ACP session state (one-time reset after wrapper version change)',
  up: (db) => {
    const r1 = db
      .prepare(
        "UPDATE conversations SET extra = json_remove(extra, '$.acpSessionId', '$.acpSessionConversationId', '$.acpSessionUpdatedAt', '$.cachedConfigOptions') " +
          "WHERE extra IS NOT NULL AND json_extract(extra, '$.acpSessionId') IS NOT NULL"
      )
      .run();
    const r2 = db.prepare('DELETE FROM acp_session').run();
    console.log(
      `[Migration v31] Cleared stale ACP session state: ${r1.changes} conversations.extra rewritten, ${r2.changes} acp_session rows deleted`
    );
  },
  down: (_db) => {
    // No rollback - the cleared session state was stale by definition.
    console.log('[Migration v31] No rollback - cleared state was already stale');
  },
};

/**
 * Migration v32 - purge transient Gemini retry-noise tips from the messages
 * table.
 *
 * Background: before commit d0f2fad1d (2026-05-16), Wayland was forwarding
 * `@office-ai/aioncli-core`'s internal `Retry` / `InvalidStream` events to
 * the renderer as `type: 'error'` stream events. The renderer rendered them
 * as red banner "tips" AND persisted them to the messages table, so every
 * subsequent reopen of an affected conversation re-rendered the same
 * scary-looking history. The library was actually recovering successfully
 * via its `streamWithRetries` + "Please continue." mechanism - these
 * weren't real failures.
 *
 * The forwarding bug is fixed going forward; this migration cleans the
 * persisted history accumulated by users running the broken code, so any
 * conversation that was poisoned by old retry chatter renders cleanly
 * after the upgrade.
 *
 * Idempotent: re-running DELETE-by-content is harmless once rows are gone.
 *
 * No down(): the deleted rows were never useful information.
 */
const migration_v32: IMigration = {
  version: 32,
  name: 'Purge persisted Gemini retry-noise tips messages',
  up: (db) => {
    const r = db
      .prepare(
        'DELETE FROM messages ' +
          "WHERE type = 'tips' " +
          "AND (content LIKE '%Invalid response stream detected%' " +
          "OR content LIKE '%Request is being retried after a temporary failure%')"
      )
      .run();
    console.log(`[Migration v32] Purged Gemini retry-noise tips: ${r.changes} rows removed`);
  },
  down: (_db) => {
    console.log('[Migration v32] No rollback - deleted rows were never useful information');
  },
};

/**
 * Migration v32 -> v33: Add provider_catalogs, provider_models, default_models tables.
 *
 * provider_catalogs  - one row per connected provider (encrypted key + metadata).
 * provider_models    - one row per model discovered in a provider's /v1/models response.
 * default_models     - user-selected default per capability scope (chat/coding/vision/image/audio).
 */
const migration_v33: IMigration = {
  version: 33,
  name: 'Add provider_catalogs, provider_models, default_models tables',
  up: (db) => {
    db.exec(`CREATE TABLE IF NOT EXISTS provider_catalogs (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      display_name TEXT,
      api_key_encrypted TEXT NOT NULL,
      additional_fields TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'connected',
      last_refreshed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_provider_catalogs_provider_id ON provider_catalogs(provider_id)');

    db.exec(`CREATE TABLE IF NOT EXISTS provider_models (
      id TEXT PRIMARY KEY,
      catalog_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      tier TEXT NOT NULL,
      capabilities TEXT NOT NULL DEFAULT '[]',
      enabled INTEGER NOT NULL DEFAULT 1,
      deprecated INTEGER NOT NULL DEFAULT 0,
      deprecated_at INTEGER,
      context_window INTEGER,
      pricing TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (catalog_id) REFERENCES provider_catalogs(id) ON DELETE CASCADE
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_provider_models_catalog_id ON provider_models(catalog_id)');
    db.exec(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_models_catalog_model ON provider_models(catalog_id, model_id)'
    );

    db.exec(`CREATE TABLE IF NOT EXISTS default_models (
      scope TEXT PRIMARY KEY,
      catalog_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`);

    console.log('[Migration v33] Added provider_catalogs, provider_models, default_models tables');
  },
  down: (db) => {
    db.exec('DROP TABLE IF EXISTS default_models');
    db.exec('DROP INDEX IF EXISTS idx_provider_models_catalog_model');
    db.exec('DROP INDEX IF EXISTS idx_provider_models_catalog_id');
    db.exec('DROP TABLE IF EXISTS provider_models');
    db.exec('DROP INDEX IF EXISTS idx_provider_catalogs_provider_id');
    db.exec('DROP TABLE IF EXISTS provider_catalogs');
    console.log('[Migration v33] Rolled back: Removed provider tables');
  },
};

const migration_v34: IMigration = {
  version: 34,
  name: 'Add webui_paired_devices table',
  up: (db) => {
    db.exec(`CREATE TABLE IF NOT EXISTS webui_paired_devices (
      id TEXT PRIMARY KEY,
      device_name TEXT NOT NULL DEFAULT 'Unknown Device',
      ua TEXT NOT NULL DEFAULT '',
      ip_first_seen TEXT NOT NULL DEFAULT '',
      last_seen_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`);
    console.log('[Migration v34] Added webui_paired_devices table');
  },
  down: (db) => {
    db.exec('DROP TABLE IF EXISTS webui_paired_devices');
    console.log('[Migration v34] Rolled back: Removed webui_paired_devices table');
  },
};

/**
 * Migration v34 -> v35: Add team_event_log table (W1e).
 *
 * Append-only event log for every team mutation (mailbox write, task
 * create/update, agent spawn, wake, token usage). Foundation for the W2c
 * Activity tab and the W2d cost meter.
 *
 * Two indexes are created to serve the two known consumer queries:
 *   - `(team_id, created_at)`              - Activity tab newest-first scan
 *   - `(team_id, event_type, created_at)`  - cost meter token_usage filter
 */
const migration_v35: IMigration = {
  version: 35,
  name: 'Add team_event_log table',
  up: (db) => {
    db.exec(`CREATE TABLE IF NOT EXISTS team_event_log (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor_slot_id TEXT,
      target_slot_id TEXT,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_team_event_log_team_created ON team_event_log(team_id, created_at)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_team_event_log_team_type_created ON team_event_log(team_id, event_type, created_at)'
    );
    console.log('[Migration v35] Added team_event_log table');
  },
  down: (db) => {
    db.exec('DROP INDEX IF EXISTS idx_team_event_log_team_type_created');
    db.exec('DROP INDEX IF EXISTS idx_team_event_log_team_created');
    db.exec('DROP TABLE IF EXISTS team_event_log');
    console.log('[Migration v35] Rolled back: Removed team_event_log table');
  },
};

/**
 * Migration v35 -> v36: Add source_launcher_id to teams table.
 *
 * Persists the bundle launcher id a team was spawned from so the renderer
 * can resolve rituals / Standing badge after a rename. Nullable for teams
 * created before v36 and for the build-my-own path.
 */
const migration_v36: IMigration = {
  version: 36,
  name: 'Add source_launcher_id to teams table',
  up: (db) => {
    const columns = new Set((db.pragma('table_info(teams)') as Array<{ name: string }>).map((c) => c.name));
    if (!columns.has('source_launcher_id')) {
      db.exec('ALTER TABLE teams ADD COLUMN source_launcher_id TEXT');
    }
    console.log('[Migration v36] Added source_launcher_id column to teams table');
  },
  down: (_db) => {
    // SQLite does not support DROP COLUMN before 3.35.0; skip rollback to prevent data loss.
    console.warn('[Migration v36] Rollback skipped: cannot drop columns safely.');
  },
};

const migration_v37: IMigration = {
  version: 37,
  name: 'Add promote-to-Standing tracking columns to teams table',
  up: (db) => {
    const cols = new Set((db.pragma('table_info(teams)') as Array<{ name: string }>).map((c) => c.name));
    if (!cols.has('promoted_to_standing')) {
      db.exec('ALTER TABLE teams ADD COLUMN promoted_to_standing INTEGER NOT NULL DEFAULT 0');
    }
    if (!cols.has('session_count')) {
      db.exec('ALTER TABLE teams ADD COLUMN session_count INTEGER NOT NULL DEFAULT 0');
    }
    if (!cols.has('first_active_at')) {
      db.exec('ALTER TABLE teams ADD COLUMN first_active_at INTEGER');
    }
    console.log('[Migration v37] Added promote-to-Standing tracking columns to teams table');
  },
  down: (_db) => {
    // SQLite cannot DROP COLUMN cleanly without table rebuild; tracking-only columns are safe to leave.
    console.log('[Migration v37] No-op rollback (columns are tracking-only)');
  },
};

/**
 * Migration v37 -> v38: Origin tracking + sandbox flag for imported teams.
 *
 * W4a (D7 #5) - every imported team carries a permanent provenance trail
 * (filename or URL the JSON came from, timestamp, signature status) plus
 * the per-capability grant map the user accepted at import time. The
 * `is_sandboxed` flag drives the W4b runtime enforcement matrix: when
 * true, every workspace FS op + cross-team mailbox write is gated by the
 * matching capability grant. Existing teams default to `is_sandboxed=0`
 * (they pre-date the sandbox model and were created directly by the user).
 */
const migration_v38: IMigration = {
  version: 38,
  name: 'Add origin tracking + sandbox flag to teams table',
  up: (db) => {
    const cols = new Set((db.pragma('table_info(teams)') as Array<{ name: string }>).map((c) => c.name));
    if (!cols.has('imported_from')) {
      db.exec('ALTER TABLE teams ADD COLUMN imported_from TEXT');
    }
    if (!cols.has('imported_at')) {
      db.exec('ALTER TABLE teams ADD COLUMN imported_at INTEGER');
    }
    if (!cols.has('imported_signature_status')) {
      db.exec('ALTER TABLE teams ADD COLUMN imported_signature_status TEXT');
    }
    if (!cols.has('import_capability_grants')) {
      db.exec('ALTER TABLE teams ADD COLUMN import_capability_grants TEXT');
    }
    if (!cols.has('is_sandboxed')) {
      db.exec('ALTER TABLE teams ADD COLUMN is_sandboxed INTEGER NOT NULL DEFAULT 0');
    }
    console.log('[Migration v38] Added import-origin + sandbox-flag columns to teams table');
  },
  down: (_db) => {
    // SQLite cannot DROP COLUMN cleanly without table rebuild; provenance columns are safe to leave.
    console.log('[Migration v38] No-op rollback (columns are origin-tracking only)');
  },
};

/**
 * Migration v38 -> v39: Add the model-registry tables for the two-tier model store.
 *
 * The Models & Providers redesign (Wave 1) stores connected providers, their
 * enriched catalogs, and per-model enable/disable overrides separately from the
 * legacy `provider_catalogs` / `provider_models` tables (those are removed in a
 * later wave). Distinct table names avoid any collision while both schemas
 * coexist.
 *
 * model_registry_providers - one row per connected provider, keyed by the
 *   `ProviderId`. Holds the encrypted credentials, connect method, live state.
 * model_registry_catalog   - one row per (provider, model). Stores the full
 *   enriched `CatalogModel` as JSON; the curated view is derived on read.
 * model_registry_overrides - one row per (provider, model) the user has
 *   explicitly toggled; absence means "use the curated default".
 */
const migration_v39: IMigration = {
  version: 39,
  name: 'Add model_registry tables for the two-tier model store',
  up: (db) => {
    db.exec(`CREATE TABLE IF NOT EXISTS model_registry_providers (
      provider_id TEXT PRIMARY KEY,
      connected_via TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'connected',
      error TEXT,
      creds_encrypted TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS model_registry_catalog (
      provider_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      model_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (provider_id, model_id),
      FOREIGN KEY (provider_id) REFERENCES model_registry_providers(provider_id) ON DELETE CASCADE
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS model_registry_overrides (
      provider_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (provider_id, model_id),
      FOREIGN KEY (provider_id) REFERENCES model_registry_providers(provider_id) ON DELETE CASCADE
    )`);

    console.log('[Migration v39] Added model_registry_providers, model_registry_catalog, model_registry_overrides');
  },
  down: (db) => {
    db.exec('DROP TABLE IF EXISTS model_registry_overrides');
    db.exec('DROP TABLE IF EXISTS model_registry_catalog');
    db.exec('DROP TABLE IF EXISTS model_registry_providers');
    console.log('[Migration v39] Rolled back: Removed model_registry tables');
  },
};

/**
 * Migration v39 -> v40: Add usage_events table for telemetry-driven predictive widget
 *
 * Logs anchor-card clicks, GUID interactions, and dashboard activity so the
 * Launchpad predictive widget can rank recently-used assistants by frecency.
 * Append-only event log; analytics services read via timestamp range queries.
 */
const migration_v40: IMigration = {
  version: 40,
  name: 'Add usage_events table for telemetry-driven predictive widget',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id            TEXT PRIMARY KEY,
        timestamp_ms  INTEGER NOT NULL,
        event_type    TEXT NOT NULL,
        anchor_id     TEXT,
        assistant_id  TEXT,
        cli_backend   TEXT,
        metadata_json TEXT
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events (timestamp_ms DESC)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_usage_events_type_timestamp ON usage_events (event_type, timestamp_ms DESC)'
    );
    console.log('[Migration v40] Added usage_events table');
  },
  down: (_db) => {
    // Leave the telemetry table in place on rollback - historical event data
    // shouldn't be destroyed by a schema downgrade.
    console.log('[Migration v40] No-op rollback (telemetry table left in place)');
  },
};

/**
 * Migration v40 -> v41: Add workflow_sessions table for Workflow Launch Surface
 *
 * Persists per-workflow chat session state so the right-rail workflow chrome
 * can resume across windows, restarts, and process crashes. One row per active
 * workflow run; `conversation_id` is a loose FK to conversations (no FOREIGN
 * KEY clause - cross-audit Gemini §8 defended this so workflow rows survive
 * conversation deletes for audit/resume). Status enum + monotonic-step CHECKs
 * are enforced at the DB layer per SPEC §4.1 / §7.
 */
const migration_v41: IMigration = {
  version: 41,
  name: 'Add workflow_sessions table for Workflow Launch Surface',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_sessions (
        id              TEXT PRIMARY KEY,
        workflow_name   TEXT NOT NULL,
        workflow_title  TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        current_step    INTEGER NOT NULL DEFAULT 1,
        total_steps     INTEGER NOT NULL,
        steps_json      TEXT NOT NULL,
        skills_json     TEXT NOT NULL,
        asks_json       TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'active',
        palette         TEXT NOT NULL,
        category        TEXT NOT NULL,
        created_at      INTEGER NOT NULL,
        updated_at      INTEGER NOT NULL,
        completed_at    INTEGER,
        CHECK (status IN ('active', 'complete', 'errored', 'ended')),
        CHECK (current_step >= 0),
        CHECK (total_steps >= 0),
        CHECK (current_step <= total_steps + 1)
      )
    `);
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_workflow_sessions_workflow_name_active ON workflow_sessions (workflow_name, status, updated_at DESC)'
    );
    db.exec('CREATE INDEX IF NOT EXISTS idx_workflow_sessions_conversation ON workflow_sessions (conversation_id)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_workflow_sessions_active_recency ON workflow_sessions (status, updated_at DESC)'
    );
    console.log('[Migration v41] Added workflow_sessions table');
  },
  down: (db) => {
    db.exec('DROP TABLE IF EXISTS workflow_sessions');
    console.log('[Migration v41] Rolled back: dropped workflow_sessions table');
  },
};

/**
 * Migration v41 -> v42: Add begin_sent_at column to workflow_sessions
 *
 * The Workflow Launch Surface auto-sends a hidden "begin {workflow_name}"
 * message on first launch of a fresh session. Without a persisted flag,
 * any remount of WorkflowSurface (Strict Mode double-mount, navigation
 * back-and-forth, refresh) re-fires begin, producing a "Session failed to
 * start" retry loop. This column gates the auto-send to fire exactly once
 * per session lifetime. Default NULL = begin has not yet fired.
 */
const migration_v42: IMigration = {
  version: 42,
  name: 'Add begin_sent_at column to workflow_sessions',
  up: (db) => {
    // SQLite cannot ADD COLUMN inside a CHECK constraint table, but a plain
    // nullable INTEGER add is supported on existing rows (NULL backfill).
    // SQLite has no ADD COLUMN IF NOT EXISTS, so guard on table_info to keep
    // up() idempotent - matching every other migration's IF NOT EXISTS guards
    // and surviving a re-run from version 0 (crash recovery / re-entrancy).
    const columns = db.pragma('table_info(workflow_sessions)') as Array<{ name: string }>;
    const hasBeginSentAt = columns.some((c) => c.name === 'begin_sent_at');
    if (!hasBeginSentAt) {
      db.exec(`ALTER TABLE workflow_sessions ADD COLUMN begin_sent_at INTEGER`);
      console.log('[Migration v42] Added begin_sent_at column to workflow_sessions');
    }
  },
  down: (db) => {
    // SQLite has no DROP COLUMN before 3.35. Use the table-recreate idiom.
    db.exec(`
      CREATE TABLE workflow_sessions_v41 (
        id              TEXT PRIMARY KEY,
        workflow_name   TEXT NOT NULL,
        workflow_title  TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        current_step    INTEGER NOT NULL DEFAULT 1,
        total_steps     INTEGER NOT NULL,
        steps_json      TEXT NOT NULL,
        skills_json     TEXT NOT NULL,
        asks_json       TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'active',
        palette         TEXT NOT NULL,
        category        TEXT NOT NULL,
        created_at      INTEGER NOT NULL,
        updated_at      INTEGER NOT NULL,
        completed_at    INTEGER,
        CHECK (status IN ('active', 'complete', 'errored', 'ended')),
        CHECK (current_step >= 0),
        CHECK (total_steps >= 0),
        CHECK (current_step <= total_steps + 1)
      )
    `);
    db.exec(`
      INSERT INTO workflow_sessions_v41
      SELECT id, workflow_name, workflow_title, conversation_id, current_step,
             total_steps, steps_json, skills_json, asks_json, status, palette,
             category, created_at, updated_at, completed_at
      FROM workflow_sessions
    `);
    db.exec('DROP TABLE workflow_sessions');
    db.exec('ALTER TABLE workflow_sessions_v41 RENAME TO workflow_sessions');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_workflow_sessions_workflow_name_active ON workflow_sessions (workflow_name, status, updated_at DESC)'
    );
    db.exec('CREATE INDEX IF NOT EXISTS idx_workflow_sessions_conversation ON workflow_sessions (conversation_id)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_workflow_sessions_active_recency ON workflow_sessions (status, updated_at DESC)'
    );
    console.log('[Migration v42] Rolled back: removed begin_sent_at column');
  },
};

/**
 * Migration v42 -> v43: Add projects table (umbrella scoping for conversations)
 *
 * A Project owns conversations as an umbrella: a workspace dir + optional
 * `.wayland/` knowledge + a name. Conversations are linked via `extra.projectId`
 * (json_extract), NOT a dedicated column - mirroring the proven cronJobId /
 * presetAssistantId pattern - so this migration only needs to create the
 * project entity table. Deliberately omits Foundry's per-project execution
 * lock (`active_conversation_id`) so multiple chats run concurrently.
 */
const migration_v43: IMigration = {
  version: 43,
  name: 'Add projects table for umbrella scoping',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        name        TEXT NOT NULL,
        description TEXT,
        workspace   TEXT,
        icon        TEXT,
        icon_color  TEXT,
        pinned      INTEGER NOT NULL DEFAULT 0,
        pinned_at   INTEGER,
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_projects_pinned ON projects(pinned, pinned_at DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC)');
    console.log('[Migration v43] Added projects table');
  },
  down: (db) => {
    db.exec('DROP TABLE IF EXISTS projects');
    console.log('[Migration v43] Rolled back: dropped projects table');
  },
};

/**
 * Migration v43 -> v44: Drop the legacy provider_catalogs / provider_models /
 * default_models tables (the pre-registry model store).
 *
 * `provider_catalogs.api_key_encrypted` held API keys "encrypted" with a key
 * derived from a constant baked into the shipped binary (the legacy
 * `encryptKey` helper) - anyone who could read the SQLite file could decrypt
 * them with no per-install entropy (SEC-DATA-01). The Models & Providers
 * redesign (migration v39) moved every live read/write onto the
 * `model_registry_*` tables, which use OS-keychain `safeStorage`; the legacy
 * tables and their hardcoded-key helpers are now dead code (zero callers).
 *
 * Dropping the tables removes the residual weak-key ciphertext from any DB that
 * was written before the cut-over, so stale at-rest secrets do not linger after
 * upgrade. The legacy-config migration (`legacyModelConfigMigration`) reads its
 * source from the on-disk `model.json`, not these tables, so this drop does not
 * affect the one-time import path.
 *
 * Every DROP is guarded with `IF EXISTS` so up() is idempotent and survives a
 * re-run from version 0 (crash recovery / re-entrancy) on a fresh DB that never
 * created the legacy tables.
 */
const migration_v44: IMigration = {
  version: 44,
  name: 'Drop legacy provider_catalogs / provider_models / default_models tables',
  up: (db) => {
    db.exec('DROP TABLE IF EXISTS default_models');
    db.exec('DROP INDEX IF EXISTS idx_provider_models_catalog_model');
    db.exec('DROP INDEX IF EXISTS idx_provider_models_catalog_id');
    db.exec('DROP TABLE IF EXISTS provider_models');
    db.exec('DROP INDEX IF EXISTS idx_provider_catalogs_provider_id');
    db.exec('DROP TABLE IF EXISTS provider_catalogs');
    console.log('[Migration v44] Dropped legacy provider_catalogs / provider_models / default_models tables');
  },
  down: (db) => {
    // Recreate the legacy schema verbatim (matching migration_v33) so a
    // rollback restores the table shape. The rows are gone - the weak-key
    // ciphertext they held was the point of the drop and is not regenerated.
    db.exec(`CREATE TABLE IF NOT EXISTS provider_catalogs (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      display_name TEXT,
      api_key_encrypted TEXT NOT NULL,
      additional_fields TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'connected',
      last_refreshed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_provider_catalogs_provider_id ON provider_catalogs(provider_id)');

    db.exec(`CREATE TABLE IF NOT EXISTS provider_models (
      id TEXT PRIMARY KEY,
      catalog_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      tier TEXT NOT NULL,
      capabilities TEXT NOT NULL DEFAULT '[]',
      enabled INTEGER NOT NULL DEFAULT 1,
      deprecated INTEGER NOT NULL DEFAULT 0,
      deprecated_at INTEGER,
      context_window INTEGER,
      pricing TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (catalog_id) REFERENCES provider_catalogs(id) ON DELETE CASCADE
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_provider_models_catalog_id ON provider_models(catalog_id)');
    db.exec(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_models_catalog_model ON provider_models(catalog_id, model_id)'
    );

    db.exec(`CREATE TABLE IF NOT EXISTS default_models (
      scope TEXT PRIMARY KEY,
      catalog_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`);
    console.log('[Migration v44] Rolled back: recreated legacy provider tables (empty)');
  },
};

/**
 * Migration v44 -> v45: Add durable-execution + verification columns to team_tasks.
 *
 * P2 (durable execution) needs a per-task lease so a Watchdog can detect a zombie
 * (an in_progress task whose owner died) and reclaim it: `lease_owner`,
 * `lease_expires_at`, `last_heartbeat`, plus a bounded retry budget
 * (`retry_budget` / `retries_used`). P3 (verification gate) adds the `'verifying'`
 * and `'zombie'` statuses - but `team_tasks.status` is plain TEXT with NO CHECK
 * constraint (see migration_v20), so the new statuses need only the TypeScript
 * union widened; no DB change is required for them.
 *
 * SQLite has no `ADD COLUMN IF NOT EXISTS`, so each add is guarded on
 * `table_info` to keep up() idempotent and survive a re-run from version 0
 * (crash recovery / re-entrancy) - matching the v14/v17/v42 guards.
 */
const migration_v45: IMigration = {
  version: 45,
  name: 'Add lease/heartbeat/retry columns to team_tasks for durable execution',
  up: (db) => {
    const columns = new Set(
      (db.pragma('table_info(team_tasks)') as Array<{ name: string }>).map((c) => c.name)
    );
    if (!columns.has('lease_owner')) {
      db.exec('ALTER TABLE team_tasks ADD COLUMN lease_owner TEXT');
    }
    if (!columns.has('lease_expires_at')) {
      db.exec('ALTER TABLE team_tasks ADD COLUMN lease_expires_at INTEGER');
    }
    if (!columns.has('last_heartbeat')) {
      db.exec('ALTER TABLE team_tasks ADD COLUMN last_heartbeat INTEGER');
    }
    if (!columns.has('retry_budget')) {
      db.exec('ALTER TABLE team_tasks ADD COLUMN retry_budget INTEGER NOT NULL DEFAULT 3');
    }
    if (!columns.has('retries_used')) {
      db.exec('ALTER TABLE team_tasks ADD COLUMN retries_used INTEGER NOT NULL DEFAULT 0');
    }
    console.log('[Migration v45] Added lease/heartbeat/retry columns to team_tasks');
  },
  down: (_db) => {
    // SQLite has no DROP COLUMN before 3.35; team_tasks carries a FK to teams,
    // so a table-recreate rollback is risky. Skip to prevent data loss, matching
    // the v17/v18 column-add rollbacks.
    console.warn('[Migration v45] Rollback skipped: cannot drop columns safely.');
  },
};

/**
 * Migration v45 -> v46: Per-team verification gate policy.
 *
 * P3 - the VerificationGate honours a per-team policy (`off | advisory |
 * blocking`). `advisory` (the default when the column is NULL) records the
 * cross-audit verdict without blocking; `blocking` sends a failed task back to
 * `in_progress`; `off` skips the gate. Stored as a nullable TEXT column so
 * existing teams resolve to the `advisory` default in rowToTeam. Opt in to
 * `blocking` per team only for ship/critical work - cross-audit spends tokens.
 */
const migration_v46: IMigration = {
  version: 46,
  name: 'Add verification_policy column to teams',
  up: (db) => {
    const cols = new Set((db.pragma('table_info(teams)') as Array<{ name: string }>).map((c) => c.name));
    if (!cols.has('verification_policy')) {
      db.exec('ALTER TABLE teams ADD COLUMN verification_policy TEXT');
    }
    console.log('[Migration v46] Added verification_policy column to teams');
  },
  down: (_db) => {
    // SQLite cannot DROP COLUMN cleanly without a table rebuild; the column is
    // a nullable policy flag and safe to leave. Matches the v38 column-add rollback.
    console.log('[Migration v46] No-op rollback (verification_policy is a policy flag only)');
  },
};

/**
 * All migrations in order
 */
// prettier-ignore
export const ALL_MIGRATIONS: IMigration[] = [
  migration_v1, migration_v2, migration_v3, migration_v4, migration_v5, migration_v6,
  migration_v7, migration_v8, migration_v9, migration_v10, migration_v11, migration_v12,
  migration_v13, migration_v14, migration_v15, migration_v16, migration_v17, migration_v18,
  migration_v19, migration_v20, migration_v21, migration_v22, migration_v23, migration_v24,
  migration_v25, migration_v26, migration_v27, migration_v28, migration_v29, migration_v30,
  migration_v31, migration_v32, migration_v33, migration_v34, migration_v35, migration_v36,
  migration_v37, migration_v38, migration_v39, migration_v40, migration_v41, migration_v42,
  migration_v43, migration_v44, migration_v45, migration_v46,
];

/**
 * Get migrations needed to upgrade from one version to another
 */
export function getMigrationsToRun(fromVersion: number, toVersion: number): IMigration[] {
  return ALL_MIGRATIONS.filter((m) => m.version > fromVersion && m.version <= toVersion).toSorted(
    (a, b) => a.version - b.version
  );
}

/**
 * Get migrations needed to downgrade from one version to another
 */
export function getMigrationsToRollback(fromVersion: number, toVersion: number): IMigration[] {
  return ALL_MIGRATIONS.filter((m) => m.version > toVersion && m.version <= fromVersion).toSorted(
    (a, b) => b.version - a.version
  );
}

/**
 * Run migrations in a transaction
 */
export function runMigrations(db: ISqliteDriver, fromVersion: number, toVersion: number): void {
  if (fromVersion === toVersion) {
    console.log('[Migrations] Already at target version');
    return;
  }

  if (fromVersion > toVersion) {
    throw new Error(`[Migrations] Downgrade not supported in production. Use rollbackMigration() for testing only.`);
  }

  const migrations = getMigrationsToRun(fromVersion, toVersion);

  if (migrations.length === 0) {
    console.log(`[Migrations] No migrations needed from v${fromVersion} to v${toVersion}`);
    return;
  }

  console.log(`[Migrations] Running ${migrations.length} migrations from v${fromVersion} to v${toVersion}`);

  // Disable foreign keys BEFORE the transaction to allow table recreation
  // (DROP TABLE + CREATE TABLE). PRAGMA foreign_keys cannot be changed inside
  // a transaction - it is silently ignored.
  // See: https://www.sqlite.org/lang_altertable.html#otheralter
  db.pragma('foreign_keys = OFF');

  // Run all migrations in a single transaction
  const runAll = db.transaction(() => {
    for (const migration of migrations) {
      try {
        console.log(`[Migrations] Running migration v${migration.version}: ${migration.name}`);
        migration.up(db);

        console.log(`[Migrations] ✓ Migration v${migration.version} completed`);
      } catch (error) {
        console.error(`[Migrations] ✗ Migration v${migration.version} failed:`, error);
        throw error; // Transaction will rollback
      }
    }

    // Verify foreign key integrity after all migrations
    const fkViolations = db.pragma('foreign_key_check') as unknown[];
    if (fkViolations.length > 0) {
      console.error('[Migrations] Foreign key violations detected:', fkViolations);
      throw new Error(`[Migrations] Foreign key check failed: ${fkViolations.length} violation(s)`);
    }
  });

  try {
    runAll();
    console.log(`[Migrations] All migrations completed successfully`);
  } catch (error) {
    console.error('[Migrations] Migration failed, all changes rolled back:', error);
    throw error;
  } finally {
    // Re-enable foreign keys regardless of success or failure
    db.pragma('foreign_keys = ON');
  }
}

/**
 * Rollback migrations (for testing/emergency use)
 * WARNING: This can cause data loss!
 */
export function rollbackMigrations(db: ISqliteDriver, fromVersion: number, toVersion: number): void {
  if (fromVersion <= toVersion) {
    throw new Error('[Migrations] Cannot rollback to a higher or equal version');
  }

  const migrations = getMigrationsToRollback(fromVersion, toVersion);

  if (migrations.length === 0) {
    console.log(`[Migrations] No rollback needed from v${fromVersion} to v${toVersion}`);
    return;
  }

  console.log(`[Migrations] Rolling back ${migrations.length} migrations from v${fromVersion} to v${toVersion}`);
  console.warn('[Migrations] WARNING: This may cause data loss!');

  // Disable foreign keys BEFORE the transaction (same reason as runMigrations)
  db.pragma('foreign_keys = OFF');

  // Run all rollbacks in a single transaction
  const rollbackAll = db.transaction(() => {
    for (const migration of migrations) {
      try {
        console.log(`[Migrations] Rolling back migration v${migration.version}: ${migration.name}`);
        migration.down(db);

        console.log(`[Migrations] ✓ Rollback v${migration.version} completed`);
      } catch (error) {
        console.error(`[Migrations] ✗ Rollback v${migration.version} failed:`, error);
        throw error; // Transaction will rollback
      }
    }

    // Verify foreign key integrity after rollback
    const fkViolations = db.pragma('foreign_key_check') as unknown[];
    if (fkViolations.length > 0) {
      console.error('[Migrations] Foreign key violations detected after rollback:', fkViolations);
      throw new Error(`[Migrations] Foreign key check failed: ${fkViolations.length} violation(s)`);
    }
  });

  try {
    rollbackAll();
    console.log(`[Migrations] All rollbacks completed successfully`);
  } catch (error) {
    console.error('[Migrations] Rollback failed:', error);
    throw error;
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

/**
 * Get migration history
 * Now simplified - just returns the current version
 */
export function getMigrationHistory(db: ISqliteDriver): Array<{ version: number; name: string; timestamp: number }> {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  // Return a simple array with just the current version
  return [
    {
      version: currentVersion,
      name: `Current schema version`,
      timestamp: Date.now(),
    },
  ];
}

/**
 * Check if a specific migration has been applied
 * Now simplified - checks if current version >= target version
 */
export function isMigrationApplied(db: ISqliteDriver, version: number): boolean {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;
  return currentVersion >= version;
}
