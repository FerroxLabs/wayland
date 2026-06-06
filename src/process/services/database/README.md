# Wayland Database System

This document describes Wayland's database system, which uses **better-sqlite3** (main process) as its persistent storage backend.

## Architecture Overview

```
┌─────────────────────────────────────┐
│         Main Process                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   better-sqlite3            │   │
│  │   - Account system          │   │
│  │   - Chat history persistence│   │
│  │   - Config (db_version)     │   │
│  └─────────────────────────────┘   │
│              ↕ IPC                  │
└─────────────────────────────────────┘
              ↕ IPC
┌─────────────────────────────────────┐
│       Renderer Process              │
│                                     │
│  - IPC Bridge queries main DB       │
│  - React State manages UI state     │
│  - localStorage stores temp data   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         File System                 │
│                                     │
│  - Image files (message.resultDisplay) │
│  - Large file attachments           │
│  - Database file (wayland.db)       │
└─────────────────────────────────────┘
```

## Design Highlights

### ✅ Reuses Existing Type System

The database layer fully reuses existing business type definitions:

- `TChatConversation` - conversation type
- `TMessage` - message type

### ✅ Automatic Migration

On first launch, the system automatically migrates file-stored data into the database - no manual steps required.

### ✅ Image Storage

- Image files are stored on the file system
- Referenced via the `message.resultDisplay` field
- Image metadata is not stored in the database

### ✅ High Performance

- better-sqlite3's synchronous API avoids mutex contention
- WAL mode improves concurrent read/write performance
- Well-designed indexes
- Transaction support

## Usage

### Main Process

```typescript
import { getDatabase } from '@/process/database/export';

// Get database instance
const db = getDatabase();

// Create a conversation
const conversation: TChatConversation = {
  id: 'conv_123',
  name: 'My Conversation',
  type: 'gemini',
  extra: { workspace: '/path/to/workspace' },
  model: {
    /* provider info */
  },
  createTime: Date.now(),
  modifyTime: Date.now(),
};

const result = db.createConversation(conversation);
if (result.success) {
  console.log('Conversation created');
}

// Insert a message
const message: TMessage = {
  id: 'msg_123',
  conversation_id: 'conv_123',
  type: 'text',
  content: { content: 'Hello world' },
  position: 'right',
  createdAt: Date.now(),
};

db.insertMessage(message);

// Query messages for a conversation (paginated)
const messages = db.getConversationMessages('conv_123', 0, 50);
console.log(messages.data); // TMessage[]
```

### Renderer Process

```typescript
import { ipcBridge } from '@/common';

// Query messages via IPC
const messages = await ipcBridge.database.getConversationMessages({
  conversation_id: 'conv_123',
  page: 0,
  pageSize: 100,
});

// Drafts use React state
const [draft, setDraft] = useState('');

// UI state uses localStorage
localStorage.setItem('sidebar_collapsed', 'true');
const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
```

## Database File Location

- **Database file**: `{userData}/config/wayland.db`
- **Image files**: `{userData}/data/images/`

Where `{userData}` is:

- macOS: `~/Library/Application Support/Wayland/`
- Windows: `%APPDATA%/Wayland/`
- Linux: `~/.config/Wayland/`

## Migration Management

### Check Migration Status

```typescript
import { getMigrationStatus } from '@/process/database/export';

const status = await getMigrationStatus();
console.log(status);
// {
//   completed: true,
//   date: 1738012345678,
//   version: 1,
//   stats: { conversations: 10, messages: 532, ... }
// }
```

### Trigger Migration Manually

```typescript
import { migrateFileStorageToDatabase } from '@/process/database/export';

const result = await migrateFileStorageToDatabase();
if (result.success) {
  console.log('Migration completed:', result.stats);
} else {
  console.error('Migration errors:', result.errors);
}
```

### Roll Back Migration (for testing)

```typescript
import { rollbackMigration } from '@/process/database/export';

await rollbackMigration();
// Clears the migration marker so migration can be re-run
```

## Backup and Restore

### Export Data

```typescript
import { exportDatabaseToJSON } from '@/process/database/export';

const data = await exportDatabaseToJSON();
await fs.writeFile('backup.json', JSON.stringify(data, null, 2));
```

### Import Data

```typescript
import { importDatabaseFromJSON } from '@/process/database/export';

const data = JSON.parse(await fs.readFile('backup.json', 'utf-8'));
await importDatabaseFromJSON(data);
```

### Database File Backup

Copy the `wayland.db` and `wayland.db-wal` files directly.

## API Reference

### WaylandUIDatabase Main Methods

#### Conversation Operations

- `createConversation(conversation, userId?)` - Create a conversation
- `getConversation(conversationId)` - Get a conversation
- `getUserConversations(userId?, page?, pageSize?)` - Get all conversations for a user (paginated)
- `updateConversation(conversationId, updates)` - Update a conversation
- `deleteConversation(conversationId)` - Delete a conversation

#### Message Operations

- `insertMessage(message)` - Insert a single message
- `insertMessages(messages)` - Batch insert messages
- `getConversationMessages(conversationId, page?, pageSize?)` - Get messages for a conversation (paginated)
- `deleteConversationMessages(conversationId)` - Delete all messages in a conversation

#### Config Operations

- `setConfig(key, value)` - Set a config value (primarily used for database version tracking)
- `getConfig<T>(key)` - Get a config value
- `getAllConfigs()` - Get all config values
- `deleteConfig(key)` - Delete a config value

#### Utility Methods

- `getStats()` - Get database statistics (returns: users, conversations, messages)
- `vacuum()` - Vacuum the database to reclaim space

### IPC Bridge Methods

- `database.getConversationMessages({ conversation_id, page?, pageSize? })` - Query messages (supports pagination)

## Performance Recommendations

1. **Batch message inserts**: Use `insertMessages()` instead of looping `insertMessage()`
2. **Paginated queries**: Use pagination parameters for large datasets
3. **Regular vacuuming**: Call `db.vacuum()` periodically to clean up the database
4. **WAL mode**: The database runs in WAL mode, supporting concurrent reads and writes
5. **Image deduplication**: The system deduplicates images by hash automatically - no extra handling needed

## Troubleshooting

### Database Lock Errors

If you see a "database is locked" error:

1. Ensure only one instance of the app is running
2. Check whether another process is accessing the database file
3. Restart the app

### Migration Failures

If a migration fails:

1. Check the error log to identify the specific cause
2. Use `rollbackMigration()` to roll back
3. Fix the data issue and re-run the migration

### Native Module Issues

If better-sqlite3 fails to load:

1. Run `npm rebuild better-sqlite3`
2. Confirm the Electron version is compatible with the dependency
3. Check the Electron Forge configuration

## Database Schema Versioning and Migration

### Version Management

The database schema is versioned; the current version is **v4**. Each version bump has a corresponding migration script.

```typescript
import { getDatabase } from '@/process/database/export';

const db = getDatabase();

// View migration history
const history = db.getMigrationHistory();
console.log(history);
// [
//   { version: 1, name: 'Initial schema', timestamp: 1738012345678 },
//   { version: 2, name: 'Add performance indexes', timestamp: 1738012345679 },
//   ...
// ]

// Check whether a specific migration has been applied
const isV2Applied = db.isMigrationApplied(2);
```

### Migration Scripts

Migration scripts are defined in `migrations.ts`. Each migration includes:

- **version**: Target version number
- **name**: Migration name
- **up()**: Upgrade script
- **down()**: Downgrade script (used for rollback)

#### Current Migration List

- **v1**: Initial schema (users, conversations, messages, config)
- **v2**: Add performance indexes (composite indexes to optimize queries)
- **v3**: ~~Add full-text search support~~ (skipped - FTS table not created)
- **v4**: Add user preferences table
- **v5**: Drop FTS table (clean up v3 remnants to ensure consistent schema)

### How to Add a New Migration

1. **Edit migrations.ts**

```typescript
const migration_v5: IMigration = {
  version: 5,
  name: 'Add user sessions table',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_user_sessions_token
        ON user_sessions(token);
    `);
    console.log('[Migration v5] Added user sessions table');
  },
  down: (db) => {
    db.exec(`DROP TABLE IF EXISTS user_sessions;`);
    console.log('[Migration v5] Rolled back: Removed user sessions table');
  },
};

// Add to migration list
export const ALL_MIGRATIONS: IMigration[] = [
  migration_v1,
  migration_v2,
  migration_v3,
  migration_v4,
  migration_v5, // new
];
```

2. **Update the version number in schema.ts**

```typescript
export const CURRENT_DB_VERSION = 5; // changed from 4 to 5
```

3. **Restart the app**

On startup, the app automatically detects the version change and runs the migration:

```
[Database] Migrating from version 4 to 5
[Migrations] Running 1 migrations from v4 to v5
[Migrations] Running migration v5: Add user sessions table
[Migration v5] Added user sessions table
[Migrations] ✓ Migration v5 completed
[Migrations] All migrations completed successfully
```

### Migration Features

#### ✅ Transaction Protection

All migrations execute within a single transaction. If any migration fails, all changes are rolled back:

```typescript
// migrations.ts
const runAll = db.transaction(() => {
  for (const migration of migrations) {
    migration.up(db); // if an exception is thrown, the entire transaction rolls back
  }
});
```

#### ✅ Migration History

Each successful migration is recorded in the `configs` table:

```sql
SELECT * FROM configs WHERE key LIKE 'migration_v%';
-- migration_v1: {"version":1,"name":"Initial schema","timestamp":1738012345678}
-- migration_v2: {"version":2,"name":"Add performance indexes","timestamp":1738012345679}
```

#### ✅ Idempotency

All migrations use `IF NOT EXISTS` to ensure they can be safely re-run.

### Roll Back Migrations (for testing)

```typescript
import { rollbackMigrations } from '@/process/database/export';

// ⚠️ WARNING: This will cause data loss!
const db = getDatabase();
rollbackMigrations(db.db, 4, 2); // roll back from v4 to v2

// After rollback, manually update the version number
setDatabaseVersion(db.db, 2);
```

### Migration Best Practices

1. **Backward compatibility**: Prefer `ALTER TABLE ADD COLUMN` over dropping columns
2. **Data transformation**: Handle data format changes inside the migration
3. **Index optimization**: Adding indexes does not affect existing data
4. **Test rollback**: Ensure the `down()` method restores state correctly
5. **Small steps**: One migration should do one thing

### Common Migration Operations

#### Add a New Table

```typescript
up: (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS new_table (
      id TEXT PRIMARY KEY,
      ...
    );
  `);
};
```

#### Add a Column

```typescript
up: (db) => {
  db.exec(`
    ALTER TABLE users ADD COLUMN phone TEXT;
  `);
};
```

#### Add an Index

```typescript
up: (db) => {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  `);
};
```

#### Data Migration

```typescript
up: (db) => {
  // Add the new column first
  db.exec(`ALTER TABLE users ADD COLUMN full_name TEXT;`);

  // Then migrate the data
  db.exec(`
    UPDATE users
    SET full_name = COALESCE(first_name || ' ' || last_name, username)
    WHERE full_name IS NULL;
  `);
};
```

## Future Plans

- [x] Database schema versioning and migration system
- [ ] Multi-account support
- [ ] Data encryption
- [ ] Cloud sync
- [ ] Additional query APIs (search, filtering, etc.)
- [ ] Performance monitoring and optimization
- [ ] Data analytics and statistics

## Tech Stack

- **better-sqlite3** v12.4.1 - Main process SQLite database
- **Electron IPC Bridge** - Renderer-to-main-process communication
- **Electron Forge** - Automatic native module handling

## Contributing

To add new database functionality:

1. Add the table schema in `schema.ts`
2. Define types in `types.ts` (reuse existing business types where possible)
3. Add CRUD methods in `index.ts`
4. Update this README

---

**Last updated**: 2025-01-27
