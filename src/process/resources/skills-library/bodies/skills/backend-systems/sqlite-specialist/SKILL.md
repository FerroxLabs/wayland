---
name: sqlite-specialist
description: |
  SQLite expertise for application development covering WAL mode configuration, concurrent access patterns, FTS5 full-text search, JSON support, virtual tables, PRAGMA optimization, backup strategies, file locking behavior, embedding patterns for desktop and mobile apps, migration strategies, and understanding size and concurrency limits.
  Use when the user asks about sqlite specialist, sqlite specialist best practices, or needs guidance on sqlite specialist implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql guide"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# SQLite Specialist

## Core Philosophy

SQLite is not a replacement for client-server databases. It is a file-format replacement. Use it when you need a structured, queryable data file embedded directly in your application. Its strength is zero-configuration, zero-administration, and remarkable reliability. SQLite powers more deployed applications than any other database engine in the world.

## When to Use SQLite

**Use SQLite for:**
- Desktop and mobile applications (local data storage)
- Embedded devices and IoT
- Configuration and application state storage
- Development and testing (in-place for PostgreSQL/MySQL)
- Small to medium websites (< 100K requests/day)
- Data analysis and processing (intermediate format)
- File archives and data exchange format

**Do NOT use SQLite for:**
- High-write concurrency (many simultaneous writers)
- Multi-server applications needing shared database access
- Very large databases (> 1 TB, though it supports up to 281 TB)
- Applications requiring fine-grained access control

## WAL Mode

Write-Ahead Logging (WAL) is the single most important configuration for production SQLite. It enables concurrent reads during writes.

```sql
-- Enable WAL mode (persistent per database file)
PRAGMA journal_mode = WAL;

-- Configure WAL behavior
PRAGMA wal_autocheckpoint = 1000;   -- Auto-checkpoint every 1000 pages (default)
PRAGMA wal_checkpoint(TRUNCATE);     -- Manual checkpoint and truncate WAL file

-- Verify WAL mode
PRAGMA journal_mode;  -- Should return "wal"
```

### WAL vs Journal Mode Comparison

| Feature | Rollback Journal (DELETE) | WAL |
|---------|--------------------------|-----|
| Concurrent reads + write | No (readers block writer) | Yes |
| Read performance | Good | Excellent |
| Write performance | Good | Better (sequential WAL writes) |
| Crash recovery | Slower | Faster |
| File count | 1 (+ journal during write) | 3 (db + WAL + WAL-index) |
| Network filesystem | Yes (with caution) | No (requires shared memory) |

### WAL Mode Best Practices

```python
import sqlite3

def create_connection(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")    # Safe with WAL
    conn.execute("PRAGMA busy_timeout = 5000")     # Wait 5s on lock
    conn.execute("PRAGMA cache_size = -64000")     # 64MB cache
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA temp_store = MEMORY")
    return conn
```

## Concurrent Access Patterns

### Single Writer, Multiple Readers

SQLite allows exactly one writer at a time. Multiple readers can proceed concurrently with WAL mode.

```python
import threading
import sqlite3
from contextlib import contextmanager

class SQLitePool:
    """Thread-safe SQLite access with connection-per-thread pattern."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._local = threading.local()
        self._write_lock = threading.Lock()

        # Initialize WAL mode
        with self._get_connection() as conn:
            conn.execute("PRAGMA journal_mode = WAL")

    def _get_connection(self) -> sqlite3.Connection:
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            conn = sqlite3.connect(self.db_path, timeout=10)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA busy_timeout = 10000")
            conn.execute("PRAGMA cache_size = -32000")
            conn.execute("PRAGMA synchronous = NORMAL")
            conn.execute("PRAGMA foreign_keys = ON")
            self._local.conn = conn
        return self._local.conn

    @contextmanager
    def read(self):
        """Read-only access (concurrent with other reads and writes)."""
        conn = self._get_connection()
        try:
            yield conn
        except Exception:
            raise

    @contextmanager
    def write(self):
        """Write access (serialized across threads)."""
        with self._write_lock:
            conn = self._get_connection()
            try:
                conn.execute("BEGIN IMMEDIATE")
                yield conn
                conn.commit()
            except Exception:
                conn.rollback()
                raise
```

### Handling SQLITE_BUSY

```python
# Option 1: busy_timeout pragma (recommended)
conn.execute("PRAGMA busy_timeout = 5000")  # Retry for up to 5 seconds

# Option 2: Custom busy handler
def busy_handler(retry_count: int) -> bool:
    if retry_count < 50:
        time.sleep(0.1)  # Wait 100ms between retries
        return True       # Keep trying
    return False          # Give up

conn.set_busy_handler(busy_handler)

# Option 3: Immediate transactions to fail fast
try:
    conn.execute("BEGIN IMMEDIATE")
    # ... do work ...
    conn.commit()
except sqlite3.OperationalError as e:
    if "database is locked" in str(e):
        # Handle contention
        pass
```

## FTS5 Full-Text Search

```sql
-- Create FTS5 virtual table
CREATE VIRTUAL TABLE articles_fts USING fts5(
    title,
    body,
    tags,
    content='articles',          -- External content table
    content_rowid='id',
    tokenize='porter unicode61'  -- Porter stemming + Unicode support
);

-- Populate from existing table
INSERT INTO articles_fts(articles_fts) VALUES('rebuild');

-- Keep in sync with triggers
CREATE TRIGGER articles_ai AFTER INSERT ON articles BEGIN
    INSERT INTO articles_fts(rowid, title, body, tags)
    VALUES (new.id, new.title, new.body, new.tags);
END;

CREATE TRIGGER articles_ad AFTER DELETE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, title, body, tags)
    VALUES ('delete', old.id, old.title, old.body, old.tags);
END;

CREATE TRIGGER articles_au AFTER UPDATE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, title, body, tags)
    VALUES ('delete', old.id, old.title, old.body, old.tags);
    INSERT INTO articles_fts(rowid, title, body, tags)
    VALUES (new.id, new.title, new.body, new.tags);
END;

-- Search queries
SELECT a.*, rank
FROM articles_fts fts
JOIN articles a ON a.id = fts.rowid
WHERE articles_fts MATCH 'sqlite AND (performance OR optimization)'
ORDER BY rank;

-- Phrase search
SELECT * FROM articles_fts WHERE articles_fts MATCH '"full text search"';

-- Column-specific search
SELECT * FROM articles_fts WHERE articles_fts MATCH 'title:sqlite body:performance';

-- Highlight and snippet
SELECT highlight(articles_fts, 1, '<b>', '</b>') AS highlighted_body,
       snippet(articles_fts, 1, '<b>', '</b>', '...', 20) AS snippet
FROM articles_fts WHERE articles_fts MATCH 'sqlite';
```

## JSON Support

```sql
-- SQLite JSON functions (built-in since 3.38.0)
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    data JSON NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Extract values
SELECT json_extract(data, '$.type') AS event_type,
       json_extract(data, '$.user.name') AS user_name,
       data ->> '$.page' AS page
FROM events;

-- Modify JSON
UPDATE events SET data = json_set(data, '$.processed', true) WHERE id = 1;
UPDATE events SET data = json_remove(data, '$.user.name') WHERE id = 1;

-- Index JSON fields with expression index
CREATE INDEX idx_event_type ON events (json_extract(data, '$.type'));

-- Iterate JSON arrays
SELECT value FROM events, json_each(json_extract(data, '$.tags'))
WHERE json_extract(data, '$.tags') IS NOT NULL;
```

## Virtual Tables

```sql
-- CSV virtual table (read CSV files directly)
CREATE VIRTUAL TABLE csv_data USING csv(
    filename='/path/to/data.csv',
    columns=5,
    header=YES
);

-- Generate series
SELECT value FROM generate_series(1, 100);

-- dbstat virtual table (analyze database file)
SELECT SUM(unused) AS wasted_bytes,
       SUM(pgsize) AS total_bytes,
       ROUND(100.0 * SUM(unused) / SUM(pgsize), 2) AS waste_pct
FROM dbstat;
```

## PRAGMA Optimization

### Essential PRAGMAs

```sql
-- Performance PRAGMAs (set on every connection)
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;           -- 64MB page cache
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456;         -- 256MB memory-mapped I/O
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;

-- Optimization PRAGMAs (run periodically)
PRAGMA optimize;                      -- Re-analyze tables (run on close)
PRAGMA integrity_check;               -- Full integrity check
PRAGMA wal_checkpoint(TRUNCATE);      -- Checkpoint and reclaim WAL space
```

## Backup Strategies

```python
import sqlite3

def online_backup(source_path: str, backup_path: str):
    """Hot backup using SQLite backup API."""
    source = sqlite3.connect(source_path)
    dest = sqlite3.connect(backup_path)
    with dest:
        source.backup(dest, pages=100, progress=backup_progress)
    dest.close()
    source.close()

def vacuum_backup(source_path: str, backup_path: str):
    """Creates optimized copy via VACUUM INTO."""
    conn = sqlite3.connect(source_path)
    conn.execute(f"VACUUM INTO '{backup_path}'")
    conn.close()
```

## Embedding Patterns

### Desktop Application (Node.js with better-sqlite3)

```javascript
const Database = require('better-sqlite3');
const db = new Database('app.db');

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Prepared statements (reusable, fast)
const insert = db.prepare('INSERT INTO notes (title, body) VALUES (@title, @body)');
const getById = db.prepare('SELECT * FROM notes WHERE id = ?');

// Transaction helper
const insertMany = db.transaction((notes) => {
    for (const note of notes) insert.run(note);
});
```

## Migration Strategies

```python
MIGRATIONS = [
    (1, "Create users table", """
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );
    """),
    (2, "Add settings column", """
        ALTER TABLE users ADD COLUMN settings JSON DEFAULT '{}';
    """),
]

def migrate(conn: sqlite3.Connection):
    conn.execute(
        "CREATE TABLE IF NOT EXISTS _migrations "
        "(version INTEGER PRIMARY KEY, applied_at TEXT)"
    )
    current = conn.execute(
        "SELECT COALESCE(MAX(version), 0) FROM _migrations"
    ).fetchone()[0]

    for version, description, sql in MIGRATIONS:
        if version > current:
            print(f"Applying migration {version}: {description}")
            conn.executescript(sql)
            conn.execute(
                "INSERT INTO _migrations (version, applied_at) "
                "VALUES (?, datetime('now'))",
                (version,),
            )
            conn.commit()
```

## Size Limits and Performance Tips

| Limit | Value |
|-------|-------|
| Maximum database size | 281 TB |
| Maximum row size | 1 GB |
| Maximum columns per table | 2000 |
| Maximum tables in a JOIN | 64 |
| Maximum attached databases | 10 |

1. **Use transactions for batch operations**: 1000 INSERTs in a transaction is ~100x faster than individual
2. **Use prepared statements**: Avoids re-parsing SQL on each execution
3. **Create indexes after bulk inserts**: Faster than maintaining indexes during bulk load
4. **Use INTEGER PRIMARY KEY**: Alias for internal rowid (fastest lookups)
5. **Run PRAGMA optimize on connection close**: Updates internal statistics

## Output Format

```markdown
# Sqlite Specialist Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement sqlite specialist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended sqlite specialist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When sqlite specialist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
