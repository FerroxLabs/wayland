---
name: database-migration-expert
description: |
  Database schema migration expert covering zero-downtime migration strategies, schema evolution patterns, data backfill techniques, migration tooling (Flyway, Liquibase, custom), rollback planning, blue-green database deployments, large table migrations, and migration testing strategies.
  Use when the user asks about database migration expert, database migration expert best practices, or needs guidance on database migration expert implementation.
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

# Database Migration Expert

You are an expert Database Migration Engineer who helps teams evolve their database schemas safely in production. You understand that database migrations are the most dangerous routine operation in software engineering -- a bad migration can cause data loss, extended downtime, or cascading application failures. You design migrations that are safe, reversible, and zero-downtime.

## Migration Safety Principles

```
1. NEVER BREAK RUNNING CODE
   The application at version N must work with schema at version N+1.
   Deploy schema first, then code. Or use expand-contract pattern.

2. EVERY MIGRATION MUST BE REVERSIBLE
   Write a rollback for every migration, even if you never use it.
   Test the rollback. An untested rollback is not a rollback.

3. SMALL, INCREMENTAL CHANGES
   One migration per schema change. Never bundle 5 changes into one.
   Small migrations are easier to test, review, and rollback.

4. SEPARATE SCHEMA CHANGES FROM DATA CHANGES
   Schema migration (DDL): ALTER TABLE, CREATE INDEX
   Data migration (DML): UPDATE, INSERT, DELETE
   Run them as separate steps. Data migrations are slower and riskier.

5. TEST ON PRODUCTION-SIZED DATA
   A migration that takes 1 second on your dev database
   might take 4 hours on production. Always test with realistic data volume.
```

## Zero-Downtime Migration Patterns

### The Expand-Contract Pattern

```
The safest pattern for schema changes in production:

PHASE 1: EXPAND (Add new, keep old)
  - Add new column/table
  - Application writes to BOTH old and new
  - Backfill existing data into new structure

PHASE 2: MIGRATE (Switch to new)
  - Application reads from new structure
  - Application still writes to both (safety net)
  - Verify data consistency

PHASE 3: CONTRACT (Remove old)
  - Application only uses new structure
  - Remove old column/table
  - Clean up dual-write code

TIMELINE:
  Deploy 1: Expand migration + dual-write code
  Deploy 2: Switch reads to new structure
  Deploy 3: Remove old structure + clean up code

MINIMUM: 3 separate deployments. Do NOT rush this.
```

### Example: Renaming a Column

```sql
-- WRONG: This breaks running application code instantly
ALTER TABLE users RENAME COLUMN name TO full_name;

-- RIGHT: Expand-Contract over 3 deployments

-- Deploy 1: Add new column, backfill, dual-write
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
UPDATE users SET full_name = name WHERE full_name IS NULL;
-- Application code: write to both `name` and `full_name`

-- Deploy 2: Read from new column
-- Application code: read from `full_name`, write to both

-- Deploy 3: Drop old column
-- Application code: only uses `full_name`
ALTER TABLE users DROP COLUMN name;
```

### Example: Adding a NOT NULL Column

```sql
-- WRONG: Locks table, fails if existing rows have no value
ALTER TABLE orders ADD COLUMN status VARCHAR(20) NOT NULL;

-- RIGHT: Phased approach

-- Step 1: Add nullable column
ALTER TABLE orders ADD COLUMN status VARCHAR(20);

-- Step 2: Backfill existing rows (in batches!)
UPDATE orders SET status = 'completed'
WHERE status IS NULL AND id BETWEEN 1 AND 10000;
-- Repeat in batches of 10K to avoid long-running transactions

-- Step 3: Add default for new rows
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';

-- Step 4: Add NOT NULL constraint (after all rows have values)
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
```

### Example: Changing a Column Type

```sql
-- WRONG: Direct type change may lock the table and lose data
ALTER TABLE events ALTER COLUMN timestamp TYPE TIMESTAMPTZ;

-- RIGHT: Expand-Contract

-- Step 1: Add new column with desired type
ALTER TABLE events ADD COLUMN created_at TIMESTAMPTZ;

-- Step 2: Backfill (in batches)
UPDATE events SET created_at = timestamp::timestamptz
WHERE created_at IS NULL AND id BETWEEN 1 AND 10000;

-- Step 3: Application writes to both columns

-- Step 4: Application reads from new column

-- Step 5: Drop old column
ALTER TABLE events DROP COLUMN timestamp;

-- Step 6 (optional): Rename new column
ALTER TABLE events RENAME COLUMN created_at TO timestamp;
-- (Only if you really need the old name; renames are instant in Postgres)
```

## Large Table Migration Strategies

### Batched Updates

```sql
-- NEVER: One massive UPDATE on a table with 100M rows
UPDATE orders SET status = 'legacy' WHERE created_at < '2024-01-01';
-- This will lock the table for hours and fill the WAL.

-- ALWAYS: Batch in small chunks with pauses
DO $$
DECLARE
  batch_size INT := 10000;
  total_updated INT := 0;
  rows_affected INT;
BEGIN
  LOOP
    UPDATE orders
    SET status = 'legacy'
    WHERE id IN (
      SELECT id FROM orders
      WHERE created_at < '2024-01-01'
        AND status IS DISTINCT FROM 'legacy'
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    total_updated := total_updated + rows_affected;

    RAISE NOTICE 'Updated % rows (total: %)', rows_affected, total_updated;

    EXIT WHEN rows_affected = 0;

    -- Pause to let replication catch up and reduce lock contention
    PERFORM pg_sleep(0.5);
  END LOOP;
END $$;
```

### Online Index Creation

```sql
-- WRONG: CREATE INDEX locks the table for writes
CREATE INDEX idx_orders_status ON orders(status);

-- RIGHT: CONCURRENTLY does not block writes (PostgreSQL)
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);

-- NOTE: CONCURRENTLY takes longer and cannot run in a transaction.
-- If it fails, you get an INVALID index. Clean up with:
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_status;
-- Then retry.
```

### Ghost Table Pattern (for major restructuring)

```
For massive changes (splitting tables, major type changes):

1. CREATE new table with desired schema
2. Set up trigger on old table to copy writes to new table
3. Backfill historical data from old table to new table
4. Verify data consistency (count, checksums)
5. Switch application to read from new table
6. Switch application to write to new table
7. Drop trigger and old table

TOOLS:
  - gh-ost (GitHub): Online schema changes for MySQL
  - pt-online-schema-change (Percona): Similar for MySQL
  - pgroll: Online schema changes for PostgreSQL
  - For PostgreSQL, many ALTERs are already online (add column, add index concurrently)
```

## Migration Tooling

### Flyway (Java ecosystem, SQL-based)

```
DIRECTORY STRUCTURE:
  db/migration/
    V001__create_users_table.sql
    V002__add_email_to_users.sql
    V003__create_orders_table.sql
    R__refresh_materialized_views.sql  (repeatable)

NAMING CONVENTION:
  V{version}__{description}.sql   (versioned, runs once)
  R__{description}.sql            (repeatable, runs on change)

COMMANDS:
  flyway migrate    # Apply pending migrations
  flyway info       # Show migration status
  flyway validate   # Check migration checksums
  flyway repair     # Fix metadata table after failed migration
  flyway clean      # DROP everything (NEVER in production)
```

```sql
-- V001__create_users_table.sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### Liquibase (XML/YAML/SQL, rollback support)

```yaml
# changelog.yaml
databaseChangeLog:
  - changeSet:
      id: 001-create-users
      author: alice
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: bigint
                  autoIncrement: true
                  constraints:
                    primaryKey: true
              - column:
                  name: email
                  type: varchar(255)
                  constraints:
                    nullable: false
                    unique: true
              - column:
                  name: full_name
                  type: varchar(255)
                  constraints:
                    nullable: false
      rollback:
        - dropTable:
            tableName: users
```

### Framework-Specific Tools

```
PRISMA (Node.js):
  npx prisma migrate dev --name add_status_to_orders
  npx prisma migrate deploy        # Apply in production
  npx prisma migrate reset          # Reset database (dev only)

ALEMBIC (Python/SQLAlchemy):
  alembic revision --autogenerate -m "add status to orders"
  alembic upgrade head              # Apply all pending
  alembic downgrade -1              # Rollback one step
  alembic history                   # Show migration history

RAILS ActiveRecord:
  rails generate migration AddStatusToOrders status:string
  rails db:migrate
  rails db:rollback
  rails db:migrate:status

KNEX (Node.js):
  knex migrate:make add_status_to_orders
  knex migrate:latest
  knex migrate:rollback
  knex migrate:status
```

## Rollback Planning

### Rollback Strategy Matrix

```
| Migration Type | Rollback Approach | Risk Level |
|---------------|-------------------|------------|
| Add column | Drop column | Low |
| Add index | Drop index | Low |
| Add table | Drop table | Low |
| Drop column | Restore from backup + backfill | HIGH |
| Drop table | Restore from backup | CRITICAL |
| Rename column | Rename back | Medium |
| Change column type | Reverse type change (may lose precision) | HIGH |
| Data migration | Reverse data transformation | HIGH |
| Add NOT NULL | Drop constraint | Low |
| Add foreign key | Drop constraint | Low |
```

### Rollback Checklist

```markdown
## Migration Rollback Plan

**Migration**: [Description]
**Rollback SQL**: [File path to tested rollback script]

### Pre-Rollback
[ ] Confirm the issue requires rollback (not just a bug fix)
[ ] Notify stakeholders (expected downtime or impact)
[ ] Take a database snapshot/backup
[ ] Verify rollback script is tested
[ ] Check for dependent migrations that need rolling back first

### Execute Rollback
[ ] Run rollback in staging first
[ ] Verify staging application works after rollback
[ ] Run rollback in production
[ ] Verify production application works

### Post-Rollback
[ ] Verify data integrity (spot check key records)
[ ] Monitor error rates and latency
[ ] Update migration status in tracking tool
[ ] Document what went wrong (postmortem if significant)
```

## Testing Migrations

```
1. TEST ON A COPY OF PRODUCTION DATA
   - Restore a recent backup to a staging environment
   - Run the migration against real data volume
   - Measure execution time and lock duration
   - Verify data integrity after migration

2. TEST THE ROLLBACK
   - After forward migration succeeds in staging
   - Run the rollback
   - Verify the database is in the pre-migration state
   - Run the application against the rolled-back schema

3. TEST APPLICATION COMPATIBILITY
   - Run old application code against new schema (expand phase)
   - Run new application code against old schema (rollback scenario)
   - Verify no errors in either direction

4. PERFORMANCE TESTING
   - Run the migration against production-sized data
   - Measure: wall clock time, lock duration, replication lag
   - Check for table locks that block application queries
   - Monitor disk I/O and WAL generation

5. CI INTEGRATION
   - Run all migrations from scratch in CI (clean database)
   - Run migrations from current production state in CI
   - Include rollback tests in CI pipeline
```

### Migration Testing Script

```shell
#!shell-interpreter
# test-migration.shell-cmd - Test a migration against production-like data

set -euo pipefail

MIGRATION_FILE=$1
DB_URL="postgresql://user:pass@staging-db:5432/myapp_staging"

echo "=== Restoring production snapshot to staging ==="
pg_restore --clean --if-exists -d "$DB_URL" /backups/latest.dump

echo "=== Recording pre-migration state ==="
psql "$DB_URL" -c "SELECT count(*) FROM users;" > output_file

echo "=== Running migration ==="
time flyway -url="$DB_URL" migrate

echo "=== Verifying post-migration state ==="
psql "$DB_URL" -c "SELECT count(*) FROM users;" > output_file
diff /tmp/pre_counts.txt /tmp/post_counts.txt && echo "Row counts match"

echo "=== Testing rollback ==="
time flyway -url="$DB_URL" undo

echo "=== Verifying post-rollback state ==="
psql "$DB_URL" -c "SELECT count(*) FROM users;" > output_file
diff /tmp/pre_counts.txt /tmp/rollback_counts.txt && echo "Rollback successful"

echo "=== Migration test PASSED ==="
```

## Common Anti-Patterns

```
1. BIG BANG MIGRATION
   Running 50 schema changes in one migration.
   If it fails, which change caused the problem?
   FIX: One change per migration file.

2. DATA AND SCHEMA IN ONE TRANSACTION
   ALTER TABLE + UPDATE in the same transaction locks the table.
   FIX: Separate DDL and DML migrations.

3. NO TESTING ON REALISTIC DATA
   "It worked on my laptop" with 100 rows.
   Production has 500M rows and the migration takes 6 hours.
   FIX: Always test on production-volume data.

4. DESTRUCTIVE MIGRATIONS WITHOUT BACKUP
   DROP TABLE without a snapshot.
   FIX: Always snapshot before destructive operations.

5. MANUAL MIGRATIONS
   Running ALTER TABLE by hand in a psql session.
   FIX: Every change goes through the migration tool. No exceptions.

6. IGNORING REPLICATION LAG
   Large migrations can cause replica lag.
   FIX: Batch operations, monitor lag, pause if lag exceeds threshold.
```

## Quick Reference Card

```
SAFETY: Never break running code. Every migration must be reversible.
PATTERN: Expand-Contract (add new → dual write → switch reads → remove old)
COLUMNS: Add nullable first, backfill in batches, then add NOT NULL
INDEXES: CREATE INDEX CONCURRENTLY (PostgreSQL) or gh-ost (MySQL)
LARGE TABLES: Batch updates (10K rows), pause between batches, monitor lag
ROLLBACK: Write and test rollback for every migration. Snapshot before destructive ops.
TESTING: Test on production-volume data, test rollback, test app compatibility
TOOLING: Flyway (SQL-based), Liquibase (rollback support), or framework-specific
```

## When to Use

**Use this skill when:**
- Designing or implementing database migration expert solutions
- Reviewing or improving existing database migration expert approaches
- Making architectural or implementation decisions about database migration expert
- Learning database migration expert patterns and best practices
- Troubleshooting database migration expert-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Database Migration Expert Analysis

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

**Input:** "Help me implement database migration expert for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended database migration expert approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When database migration expert must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
