---
name: database-migration-patterns
description: |
  Guides expert-level database migration patterns implementation: database and automation decision frameworks, production-ready patterns, and concrete templates for database migration patterns workflows.
  Use when the user asks about database migration patterns, database migration patterns configuration, or database best practices for database projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database backend automation"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Database Migration Patterns

## When to Use

**Use this skill when:**
- User is planning schema changes to a live production database and needs a zero-downtime or minimal-downtime strategy
- User is asking how to rename columns, add NOT NULL constraints, split or merge tables, or change data types without breaking running application code
- User wants to implement a versioned migration system using tools like Flyway, Liquibase, Alembic, golang-migrate, or Active Record migrations
- User needs to coordinate a migration across multiple application instances that are deployed in a rolling-update fashion (blue-green, canary, or Kubernetes rolling deployments)
- User is debugging a failed migration that has left the database in a partially applied state
- User wants to design a backward-compatible schema evolution strategy for a microservices architecture where services share a database or communicate via shared schema contracts
- User is implementing a data backfill as part of a schema migration and needs to do it safely at scale (millions to billions of rows)
- User needs to establish a migration workflow with CI/CD integration, including dry-run validation, checksum verification, and rollback procedures

**Do NOT use this skill when:**
- User needs help with ORM query optimization or index tuning -- use the database-query-optimization skill instead
- User is asking about ETL pipelines moving data between systems -- that is a data-pipeline skill
- User wants to set up database replication, failover, or read replicas -- use the database-high-availability skill
- User needs help with database connection pooling (PgBouncer, HikariCP configuration) -- check the database-connection-management skill
- User is asking about NoSQL schema design for document stores like MongoDB or DynamoDB -- schema migration patterns differ fundamentally and warrant a dedicated skill
- User wants help with data warehouse schema design (star schema, slowly changing dimensions) -- use the data-warehouse-design skill

---

## Process

### 1. Classify the Migration Type and Risk Level

Before writing a single SQL statement, determine which category the migration falls into. Each category has different risk profiles and execution patterns.

- **Additive migrations (Low Risk):** Adding new nullable columns, new tables, new indexes CONCURRENTLY, new foreign keys with NOT VALID, new enum values (Postgres 12+). These are safe to deploy before or alongside application code changes.
- **Destructive migrations (High Risk):** Dropping columns, dropping tables, truncating data, removing enum values. These must NEVER be applied until all application instances have stopped referencing the removed object -- typically requiring a multi-phase deployment spanning multiple releases.
- **Constraint-adding migrations (Medium Risk):** Adding NOT NULL, UNIQUE, CHECK, or foreign key constraints to existing columns. Requires backfilling data first, then adding constraints in a non-locking way (e.g., `ADD CONSTRAINT ... NOT VALID` followed by `VALIDATE CONSTRAINT`).
- **Type-change migrations (High Risk):** Changing a column from VARCHAR to UUID, INTEGER to BIGINT, or TEXT to JSONB. Almost always requires the expand-contract pattern (see Step 3).
- **Data migrations / backfills (Variable Risk):** Populating new columns from existing data. Must be batched to avoid long-running transactions that cause replication lag and lock contention.

Assign a risk tier (1 = safe, 2 = caution, 3 = high-risk) at the top of every migration file as a comment. This shapes the rest of the process.

### 2. Audit the Current Schema and Application References

A migration cannot be planned in isolation -- it requires full knowledge of what currently depends on the object being changed.

- Query `information_schema.columns`, `information_schema.table_constraints`, and `pg_indexes` (or the equivalent for MySQL/SQLite) to confirm current column types, nullability, indexes, and constraints before drafting changes.
- Search application code for all references to the affected column or table name using grep, AST-based search (e.g., `semgrep`), or IDE-wide find. Include ORM model definitions, raw SQL strings, stored procedures, views, and materialized views.
- Check for database triggers that may reference the column being altered -- these are frequently forgotten and cause silent failures after a rename.
- Identify any dependent views or materialized views. In Postgres, `ALTER TABLE` that changes a column type will fail if a view depends on that column.
- For foreign key relationships, identify all child tables referencing the parent column being modified. Changing a primary key type (e.g., INTEGER to BIGINT) requires updating all foreign key columns simultaneously.
- Document findings in a pre-migration checklist that accompanies the migration PR.

### 3. Choose the Correct Migration Pattern

Select the pattern based on the migration type from Step 1:

**Pattern A -- Direct Apply (additive only):**
- Add a nullable column, a new table, or a CONCURRENTLY-built index.
- Deploy migration first, then deploy application code that uses it.
- Rollback: drop the new column or index.
- Example: `ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMPTZ;`

**Pattern B -- Expand-Contract (for column renames, type changes, table splits):**
- Phase 1 (Expand): Add the new column/table alongside the old one. Deploy application code that writes to BOTH old and new simultaneously. Duration: one full release cycle.
- Phase 2 (Backfill): Populate the new column from the old using batched UPDATE statements (see Step 5).
- Phase 3 (Cut over): Deploy application code that reads exclusively from the new column/table.
- Phase 4 (Contract): Drop the old column/table after all application instances have been updated and no errors have been observed for a defined window (typically 24-72 hours in production).
- This pattern requires 3-4 separate deployments. Build this timeline into the project plan.

**Pattern C -- Online Schema Change (for large table structural changes):**
- For tables over 1 GB or with high write throughput, use tooling like `pt-online-schema-change` (MySQL), `gh-ost` (GitHub Online Schema Change, MySQL), or `pg_repack` (Postgres) to avoid exclusive table locks.
- These tools create a shadow table, apply the structural change, sync data via triggers, then perform an atomic rename swap.
- Validate that replication lag stays under acceptable thresholds (typically < 30 seconds) during the online schema change.
- Test OSC tooling in a staging environment with production-scale data (or a realistic subset -- at minimum 10% of production row count).

**Pattern D -- Constraint addition without full table lock:**
- For NOT NULL: backfill nulls first, then use a check constraint `ADD CONSTRAINT col_not_null CHECK (col IS NOT NULL) NOT VALID`, then `VALIDATE CONSTRAINT`. In Postgres 12+, you can then convert to a true NOT NULL using `SET NOT NULL` which uses the validated constraint to skip a full table scan.
- For UNIQUE: create a `UNIQUE INDEX CONCURRENTLY` first, then `ADD CONSTRAINT ... USING INDEX` to convert it to a constraint atomically.
- For foreign keys: use `ADD CONSTRAINT ... NOT VALID` to add without scanning existing rows, then `VALIDATE CONSTRAINT` in a separate transaction to validate existing data with a lower lock level.

### 4. Write the Migration File

Structure every migration file consistently. Use the following conventions regardless of the migration framework:

- **File naming:** Use a timestamp prefix for ordering, not sequential integers (sequential integers cause merge conflicts on teams). Format: `YYYYMMDDHHMMSS_short_description.sql` (e.g., `20240315143022_add_shipped_at_to_orders.sql`).
- **Header comment block:** Include: author, date, risk tier, estimated execution time on production data volume, lock type acquired, rollback procedure, and dependencies on other migrations or application releases.
- **Idempotency:** Every migration should be safe to run twice. Use `IF NOT EXISTS`, `IF EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN duplicate_column THEN NULL; END $$`, or framework-provided skip-if-already-applied mechanisms.
- **Explicit transaction boundaries:** Wrap DDL in explicit `BEGIN` / `COMMIT` blocks. Postgres supports transactional DDL -- use it. MySQL does NOT support transactional DDL for most schema operations; plan accordingly with compensating scripts.
- **Separate DDL from DML:** Never run a data migration (UPDATE/INSERT) in the same transaction as a structural change (ALTER TABLE). The DDL acquires locks; the DML can run for minutes. Keeping them separate limits the lock window to the DDL-only transaction.
- **Set statement timeouts:** At the top of every migration, set `SET lock_timeout = '5s'` and `SET statement_timeout = '30s'` for DDL operations. This prevents a migration from waiting indefinitely for a lock and blocking all subsequent connections. If it times out, it fails fast and the operator retries -- far better than a silent queue of waiting connections.

### 5. Design and Execute Backfill Operations

Data backfills for large tables require a batching strategy to avoid long-running transactions, excessive replication lag, and out-of-memory conditions.

- **Batch by primary key range:** Issue UPDATE statements that operate on a range of IDs rather than the whole table. A typical batch size is 1,000 to 10,000 rows per transaction, adjusted based on row size and write throughput.
- **Example batch loop (pseudo-SQL):**
  ```
  min_id = SELECT MIN(id) FROM orders WHERE new_column IS NULL;
  max_id = SELECT MAX(id) FROM orders;
  batch_size = 5000;
  current = min_id;
  WHILE current <= max_id:
    UPDATE orders SET new_column = derive(old_column)
    WHERE id >= current AND id < current + batch_size
    AND new_column IS NULL;
    COMMIT;
    SLEEP 100ms;  -- allow replication to catch up
    current = current + batch_size;
  ```
- **Monitor replication lag:** During a backfill on a replicated database, poll `pg_stat_replication` (Postgres) or `SHOW SLAVE STATUS` (MySQL) every 30 seconds. If replication lag exceeds 30 seconds, pause the backfill loop and resume when lag drops below 5 seconds.
- **Use a progress tracking table:** Insert a row into a `migration_progress` table at each batch boundary with timestamp, last processed ID, and row count. This makes it trivial to resume a failed backfill without reprocessing already-updated rows.
- **Run backfills as application jobs, not migration scripts:** For tables over 10 million rows, run the backfill as a background job deployed with the application rather than as part of the migration framework's execution sequence. This decouples the backfill from the deployment pipeline and allows finer-grained control and cancellation.
- **Verify completion:** After the backfill loop, execute `SELECT COUNT(*) FROM orders WHERE new_column IS NULL` and assert it returns 0 before proceeding to the constraint-addition phase.

### 6. Integrate with CI/CD and Migration Framework

Migration tooling should be a first-class citizen of the CI/CD pipeline:

- **Flyway:** Use `flyway validate` in CI to detect checksum drift (a migration file that was modified after being applied). Configure `baselineOnMigrate=false` in all non-local environments. Store migration scripts in `src/main/resources/db/migration` with `V` prefix for versioned and `R` prefix for repeatable scripts.
- **Liquibase:** Use changelogs in XML, YAML, or SQL format. Use `liquibase updateSQL` to generate a dry-run SQL preview in CI without applying changes. Use contexts (e.g., `--contexts=prod`) to conditionally apply environment-specific migrations.
- **Alembic (Python/SQLAlchemy):** Generate migrations with `alembic revision --autogenerate` as a starting point, but ALWAYS review the generated output -- autogenerate misses many cases including column type changes, enum additions, and partial indexes. Use `alembic upgrade head` in the deployment step and `alembic downgrade -1` for rollback.
- **Active Record Migrations (Ruby on Rails):** Use `rails db:migrate:status` to inspect pending and applied migrations in CI. For zero-downtime, use the `strong_migrations` gem which enforces safe migration patterns and raises exceptions on dangerous operations like adding a NOT NULL column without a default.
- **CI validation gates:** Run `migrate --dry-run` on every PR. If the migration tool does not support dry-run, execute the migration against a shadow database restored from production backup (or a recent snapshot) in the CI pipeline. Assert that the schema after migration matches an expected schema snapshot.
- **Lock down migration files post-merge:** Enforce via CI that no committed migration file is ever modified. Any correction must be a new migration file. This is non-negotiable for Flyway (checksum validation) and critical for auditability in all frameworks.

### 7. Execute, Monitor, and Roll Back in Production

Production migration execution requires an operational runbook, not just code:

- **Pre-migration checklist:** Confirm a verified database backup exists and is restorable. Confirm staging migration was successful. Confirm application instances can tolerate the intermediate state (both old and new schema present). Notify on-call team of the maintenance window, even if it is expected to be zero-downtime.
- **Execution timing:** Run migrations during the lowest-traffic period if they require any lock. For Postgres CONCURRENTLY operations and for most additive migrations, this is less critical -- but for anything acquiring an exclusive lock, target off-peak hours (typically 2-6 AM in the database's primary timezone or the time when p95 connection count is lowest based on monitoring data).
- **Lock monitoring during execution:** In a separate terminal/session, poll `pg_stat_activity` for blocked queries. If more than 5 queries are blocked waiting for the migration lock and the DDL has been running for more than 10 seconds, consider killing the migration with `pg_cancel_backend()` and investigating.
- **Rollback strategy by type:**
  - Additive migrations: `DROP COLUMN IF EXISTS`, `DROP TABLE IF EXISTS`, `DROP INDEX IF EXISTS`. These are fast.
  - Expand-contract migrations: Roll back the application code to the previous release (which still writes to the old column). The new column can remain in place -- it is unused and harmless.
  - Constraint additions: `ALTER TABLE DROP CONSTRAINT` is fast for NOT VALID constraints, slower for validated constraints on large tables.
  - Data migrations: Rollback requires a compensating migration (reverse transformation) or a restore from backup. For destructive or irreversible data changes, a backup restore is the only safe path -- which is why backups must be verified BEFORE execution.
- **Post-migration validation:** Immediately after applying, run automated smoke tests that exercise the changed schema through the application API. Assert row counts in critical tables match pre-migration baselines (±acceptable variance for new inserts). Alert if any query error rates spike in the 15 minutes following migration.

### 8. Document and Archive

Every migration that reaches production becomes part of the permanent history of the system. Treat it accordingly.

- Store migration files in version control alongside application code -- never in a separate repository that can get out of sync.
- Write a post-migration summary in the PR or ticket: actual execution time, lock duration, rows affected, any deviations from the plan, and any follow-up actions required.
- For expand-contract migrations, create a follow-up ticket for the contract phase immediately after the expand phase completes. Set a due date. Unfinished expand phases accumulate as dead schema weight and confuse future developers.
- Update the team's internal schema documentation (wiki, Notion, ERD) to reflect the new state. A schema that lives only in the database is undiscoverable to new engineers.
- If the migration introduced a non-standard pattern or a deviation from the team's conventions, write an Architecture Decision Record (ADR) explaining the context, options considered, and the chosen approach.

---

## Output Format

When helping a user with a database migration, produce output in the following structure:

```
## Migration Plan: [brief description]

### Classification
- Migration Type: [Additive | Destructive | Type Change | Constraint Addition | Backfill | Expand-Contract]
- Risk Tier: [1 (Safe) | 2 (Caution) | 3 (High Risk)]
- Estimated Lock Duration: [e.g., < 1 second, 5-30 seconds, minutes -- table scan required]
- Estimated Execution Time: [e.g., < 5 seconds, 30 minutes backfill at 5k rows/batch]
- Deployment Phases Required: [1 | 2 | 3 | 4]

### Pre-Migration Checklist
- [ ] Backup verified and restorable
- [ ] Staging migration applied successfully
- [ ] All application references to affected objects identified
- [ ] Dependent views/triggers/stored procedures reviewed
- [ ] Replication lag baseline measured: [current value]
- [ ] On-call team notified

### Migration Files

#### Phase [N]: [Description]
**File:** `YYYYMMDDHHMMSS_description.sql`
**Deploy before or after app release:** [before | after | with]

```sql
-- Migration: [description]
-- Author: [team]
-- Date: [date]
-- Risk: Tier [1|2|3]
-- Lock Type: [ACCESS SHARE | ROW EXCLUSIVE | ACCESS EXCLUSIVE]
-- Estimated execution time on production: [X seconds/minutes]
-- Rollback: [rollback SQL or procedure]
-- Dependencies: [prior migrations or app release versions]

SET lock_timeout = '5s';
SET statement_timeout = '30s';

BEGIN;

-- [migration SQL here]

COMMIT;
```

#### Backfill Script (if applicable)
**Run as:** [migration framework | background job | manual]
**Batch size:** [N rows]
**Monitor:** [what to watch]

```sql
-- Backfill: [description]
-- Batch over IDs, sleep between batches
DO $$
DECLARE
  batch_start BIGINT;
  batch_end BIGINT;
  max_id BIGINT;
BEGIN
  -- [batched backfill logic]
END $$;
```

### Rollback Procedure
1. [Step 1 with exact SQL or command]
2. [Step 2]
3. [Verification query to confirm rollback succeeded]

### Post-Migration Validation
```sql
-- Run immediately after migration applies
-- [Verification queries asserting expected schema state]
-- [Row count assertions]
-- [Constraint verification]
```

### Follow-Up Actions
- [ ] [Contract phase ticket created with due date]
- [ ] [Schema documentation updated]
- [ ] [ADR written if non-standard pattern used]
```

---

## Rules

1. **NEVER modify an already-applied migration file.** Once a migration has been executed in any environment beyond local development, it is immutable. Flyway enforces this with checksums; enforce it manually for other tools. Corrections go in a new, forward-only migration.

2. **NEVER add a NOT NULL column with no default in a single ALTER TABLE on a table with existing rows.** In Postgres before version 11, this causes a full table rewrite. In Postgres 11+, it is safe ONLY if the default is a constant (not a function call). Always verify Postgres version before choosing this shortcut. MySQL always rewrites the table for structural changes regardless of version.

3. **NEVER run an unbatched UPDATE or DELETE against a table with more than 100,000 rows in a single transaction.** The transaction log growth, lock duration, and replication lag risk are unacceptable. Batch all DML in the 1,000-10,000 row range.

4. **NEVER apply a destructive migration (DROP COLUMN, DROP TABLE) in the same release that removes the application code referencing it.** Always allow at least one full release cycle where the application has stopped using the object before dropping it. Rolling deployments mean old application instances may still be running when the migration applies.

5. **NEVER skip the `lock_timeout` setting on DDL statements in production.** Without a lock timeout, a long-running query holding a conflicting lock will cause the DDL to queue indefinitely, which in turn causes ALL subsequent connections needing a table lock to queue behind it -- creating a connection pile-up that can take down the application.

6. **NEVER create an index without `CONCURRENTLY` on a table larger than 10,000 rows in a live production database.** Non-concurrent index creation acquires an exclusive lock for the duration of the index build, which can take seconds to hours on large tables.

7. **ALWAYS test migrations against a database restored from a recent production backup before executing in production.** Staging environments with synthetic data are insufficient for validating execution time, lock behavior, and constraint violations. Use production-restore pipelines in CI or pre-production environments.

8. **ALWAYS validate foreign key constraints with `NOT VALID` first on tables with existing data, then validate separately.** Adding a plain `REFERENCES` constraint on a large table with existing rows triggers a full table scan under a lock. `NOT VALID` skips the scan; `VALIDATE CONSTRAINT` performs the scan later with a weaker lock level (ShareUpdateExclusiveLock in Postgres).

9. **NEVER allow the application to handle two schema states (expand phase) for more than 30 days.** Dual-write code is complexity debt. Expand-contract phases must have explicit completion timelines enforced by follow-up tickets. Abandoned expand phases are one of the most common causes of schema confusion in long-running systems.

10. **ALWAYS confirm that enum type changes are safe for your database version before applying.** In Postgres, adding a new value to an ENUM type is non-transactional (it cannot be rolled back within a transaction). In Postgres < 12, adding an enum value requires a catalog rewrite. In all versions, renaming an enum value or removing a value is not natively supported -- it requires creating a new type, migrating columns, and dropping the old type, which is a full expand-contract operation.

---

## Edge Cases

### Large Table with Active Write Traffic (> 50 million rows, > 1,000 writes/second)

Standard `ALTER TABLE` operations will cause unacceptable lock wait times. Use online schema change tooling:
- **MySQL:** Prefer `gh-ost` over `pt-online-schema-change` for tables with triggers, because `pt-osc` does not handle triggers well. `gh-ost` uses binary log streaming instead of triggers. Monitor `gh-ost`'s `--max-lag-millis` parameter and set it to 1500ms maximum -- it will throttle automatically if replication lag exceeds this threshold.
- **Postgres:** Use `pg_repack` for table restructuring, or rely on the expand-contract pattern to avoid structural changes to the hot table entirely. For index rebuilds, `REINDEX CONCURRENTLY` (Postgres 12+) is available as a lower-impact alternative to `DROP INDEX CONCURRENTLY` followed by `CREATE INDEX CONCURRENTLY`.
- Always run OSC tools in `--test-on-replica` mode first to validate behavior without risk to the primary.
- Budget 2-4x the estimated execution time for overhead from trigger/binlog sync mechanisms.

### Polyglot or Multi-Tenant Schema (schema-per-tenant or database-per-tenant)

When migrations must be applied across hundreds or thousands of schemas/databases:
- Never apply migrations serially to all tenants in a single synchronous deployment. A failure partway through leaves tenants on different schema versions, which breaks your schema-version assumptions.
- Use a background job or migration service that applies migrations tenant-by-tenant with retry logic and records per-tenant migration status in a central catalog table.
- Design application code to tolerate both the pre-migration and post-migration schema simultaneously for the duration of the tenant rollout window. This is effectively always running in expand-contract mode.
- Establish a maximum rollout window (e.g., all tenants must be migrated within 4 hours of deployment) and alert if any tenant remains unmigrated after that window.
- For schema-per-tenant Postgres setups, use `search_path` carefully -- ensure your migration tool is configured to set the correct schema search path for each tenant before applying.

### Circular Dependency Between Application Deployment and Migration

Sometimes the migration requires application code to exist (to populate data) and the application code requires the migration to exist (to start up). This is a genuine chicken-and-egg problem:
- Break the cycle by separating schema creation from data population. The migration creates the schema (table, column) without data. The application code writes data on startup or via a post-deploy hook. The constraint requiring data (NOT NULL, CHECK) is applied in a subsequent migration after the application has populated the column.
- If the application startup fails without the data (e.g., it seeds required configuration rows), create a one-time seeder script that is idempotent and runs as part of the deployment pipeline after the migration but before traffic is routed to new instances.
- Document this dependency explicitly in the migration file comment and the deployment runbook.

### Failed Migration Leaving Schema in Partial State

When a migration fails midway and the database is not fully transactional for DDL (MySQL, or Postgres migrations that span multiple transactions):
- First, do not panic and do not attempt to manually patch the schema without a plan.
- Run a schema diff between the current database state and the last known good migration version using `mysqldiff`, `migra` (Postgres), or a snapshot comparison tool.
- If the failure occurred mid-transaction on Postgres (which supports transactional DDL), the transaction was automatically rolled back -- verify with `SELECT * FROM your_migration_tracking_table`. The database should be in the pre-migration state.
- If the failure occurred in a non-transactional context (MySQL DDL, or a multi-transaction migration), identify exactly which statements succeeded and write a compensating migration that either completes or reverses the partial change.
- Before applying the compensating migration, restore to a pre-migration backup if the partial state is causing application errors. Fix in the restored backup, then re-execute the corrected migration. Never attempt to fix a broken production schema by typing raw SQL without going through the migration framework -- the migration framework's version tracking will lose synchronization.

### Zero-Downtime Requirement with Blue-Green Deployments

Blue-green deployments swap all traffic from the old version (blue) to the new version (green) simultaneously. Unlike rolling deployments, there is a brief moment where only one version is active. This changes the migration timing constraints:
- The migration must be applied while the blue environment is still receiving traffic, meaning the blue application version must be compatible with both pre-migration and post-migration schema.
- If the blue application cannot handle the new schema (e.g., a new NOT NULL column that the blue code does not populate), add a database-level default for the column temporarily, then remove the default in a later migration after green is fully promoted and blue is decommissioned.
- After the cutover to green, allow a validation window (15-30 minutes) before decommissioning blue. Keep the blue environment connectable (but without traffic) so you can revert by switching the load balancer back without a schema rollback.
- Never apply a destructive migration (DROP COLUMN) until the blue environment is fully decommissioned and cannot be rolled back to.

### Migrations in Microservices with Shared Database (Anti-Pattern Remediation)

When multiple services share a single database schema and need to migrate it:
- Establish a single "schema owner" service that is the only service allowed to apply migrations to the shared schema. Other services must coordinate through this owner.
- Alternatively, partition the database so each service owns distinct tables, with cross-service access happening via APIs rather than direct database joins. Migrate toward this state using the expand-contract pattern: add new service-owned tables, migrate logic to use the API layer, then drop the shared tables from the non-owning services' access.
- If shared database access cannot be removed in the near term, implement a migration lock: before any service applies a migration, it acquires a distributed lock (via Redis, a dedicated `migration_locks` table, or a coordination service) to prevent concurrent migration attempts from different services.
- Track which service applied which migration in the migration history table by adding a `service_name` column. This is critical for debugging when a migration conflict occurs.

### Enum Value Removal or Rename (Postgres)

Postgres does not support removing or renaming values from an ENUM type natively. This is one of the most dangerous schema changes in Postgres:
- Removing an enum value requires: (1) Convert the column from ENUM to VARCHAR or TEXT. (2) Drop the old ENUM type. (3) Create a new ENUM type with the desired values. (4) Convert the column back using a CAST or USING clause. Each step requires verifying that no rows contain the value being removed.
- Before starting, query `SELECT DISTINCT column_name FROM table WHERE column_name = 'value_to_remove'` and confirm the count is 0. If not, migrate those rows to a valid value first.
- The entire sequence is a Tier 3 (High Risk) operation requiring the expand-contract pattern: add the new type, migrate data, drop the old type -- spread across multiple releases.
- As a long-term strategy, consider replacing Postgres ENUM types with a VARCHAR column plus a CHECK constraint or a foreign key to a lookup table. Both alternatives support modification without this complexity.

---

## Example

**User Input:** "We have a `users` table with 80 million rows. We need to rename the column `username` to `display_name` and change its type from VARCHAR(50) to VARCHAR(100). We use Postgres 14, Flyway, and deploy via Kubernetes rolling updates with 3 replicas. We cannot have more than 30 seconds of downtime."

---

**Output:**

## Migration Plan: Rename users.username to display_name and widen VARCHAR(50) to VARCHAR(100)

### Classification
- Migration Type: Expand-Contract (column rename + type change)
- Risk Tier: 3 (High Risk -- rename requires dual-write across multiple releases)
- Estimated Lock Duration: < 1 second per DDL statement (no full table rewrite required -- see notes)
- Estimated Execution Time: Phase 1 DDL < 2 seconds; Phase 2 Backfill ~27 hours at 5k rows/batch with 100ms sleep; Phase 3 DDL < 1 second; Phase 4 DDL < 1 second
- Deployment Phases Required: 4 (spread across minimum 3 release cycles)
- Notes on VARCHAR widening: In Postgres, widening VARCHAR does NOT rewrite the table -- it is a catalog-only change and acquires only a brief ACCESS EXCLUSIVE lock (typically < 100ms). The rename, however, requires the expand-contract approach because running application code references `username` by name in ORM models, queries, and API serializers.

### Pre-Migration Checklist
- [ ] Backup verified and restorable (verify `pg_restore` on staging from latest production snapshot)
- [ ] Staging migration applied successfully against production-size data restore
- [ ] All application references to `username` column identified (ORM model, GraphQL resolvers, REST serializers, analytics queries, audit log writers, search indexer)
- [ ] Dependent views identified: run `SELECT viewname FROM pg_views WHERE definition LIKE '%username%'` -- found: `user_search_view` (must be updated in Phase 1)
- [ ] No triggers reference `username` -- confirmed via `SELECT tgname FROM pg_trigger JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid WHERE relname = 'users'`
- [ ] Replication lag baseline measured: 0.2 seconds
- [ ] Flyway checksum enforcement confirmed active
- [ ] On-call team notified; migration window: Tuesday 2 AM UTC

---

### Phase 1: Expand -- Add display_name Column

**File:** `20240319020000_expand_add_display_name_to_users.sql`
**Deploy:** BEFORE application Release 1 (app still reads/writes only `username`)

```sql
-- Migration: Add display_name column to users table (Phase 1 of 4 -- Expand)
-- Author: platform-team
-- Date: 2024-03-19
-- Risk: Tier 3 -- part of expand-contract for username -> display_name rename
-- Lock Type: ACCESS EXCLUSIVE (brief, catalog-only change for VARCHAR widening)
-- Estimated execution time on production: < 2 seconds
-- Rollback: DROP COLUMN IF EXISTS display_name; -- safe, application does not use it yet
-- Dependencies: None -- apply before Release 1

SET lock_timeout = '5s';
SET statement_timeout = '30s';

BEGIN;

-- Add the new column as nullable (no default needed -- backfill handles population)
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- Also widen the existing column in the same transaction while we hold the lock
-- (VARCHAR widening is catalog-only in Postgres -- no table rewrite)
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(100);

-- Update the dependent view to include both columns during transition
CREATE OR REPLACE VIEW user_search_view AS
  SELECT
    id,
    username,         -- keep for backward compatibility
    display_name,     -- new column (may be NULL during backfill)
    email,
    created_at
  FROM users;

COMMIT;
```

**Post-Phase-1 Validation:**
```sql
-- Confirm column exists and types are correct
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('username', 'display_name');
-- Expected: both present, both VARCHAR(100), display_name nullable

-- Confirm view was updated
SELECT viewname, definition FROM pg_views WHERE viewname = 'user_search_view';
```

---

### Phase 2: Application Release 1 -- Dual Write

**Deploy Release 1 after Phase 1 migration is confirmed applied.**

Application code changes required in Release 1:
- On every write to `users` (INSERT or UPDATE), write the same value to both `username` and `display_name`.
- On reads, continue reading from `username` (display_name may be NULL during backfill).
- Example ORM change (ActiveRecord pseudocode):
  ```ruby
  before_save :sync_display_name
  def sync_display_name
    self.display_name = self.username if display_name.blank?
  end
  ```
- This dual-write ensures all new writes populate `display_name`, while the backfill script handles existing rows.

---

### Phase 2b: Backfill display_name from username

**Run as:** Background job deployed with Release 1 -- NOT as a Flyway migration (too slow for migration framework sequence)
**Batch size:** 5,000 rows per transaction
**Total estimated time:** 80,000,000 rows / 5,000 per batch = 16,000 batches * ~6 seconds per batch (UPDATE + sleep) ≈ 27 hours
**Monitor:** Poll replication lag every 30 seconds; pause if lag > 30s

```sql
-- Backfill Script: Populate users.display_name from users.username
-- Run as a background job with retry capability
-- Track progress in migration_progress table

CREATE TABLE IF NOT EXISTS migration_progress (
  migration_name TEXT PRIMARY KEY,
  last_processed_id BIGINT NOT NULL DEFAULT 0,
  rows_processed BIGINT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO migration_progress (migration_name, last_processed_id)
VALUES ('backfill_display_name', 0)
ON CONFLICT (migration_name) DO NOTHING;

DO $$
DECLARE
  batch_size    INT     := 5000;
  current_id    BIGINT;
  next_id       BIGINT;
  max_id        BIGINT;
  rows_updated  INT;
BEGIN
  SELECT last_processed_id INTO current_id
  FROM migration_progress WHERE migration_name = 'backfill_display_name';

  SELECT MAX(id) INTO max_id FROM users;

  WHILE current_id < max_id LOOP
    next_id := current_id + batch_size;

    UPDATE users
    SET display_name = username,
        updated_at   = NOW()  -- only if your schema tracks this
    WHERE id > current_id
      AND id <= next_id
      AND display_name IS NULL;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    UPDATE migration_progress
    SET last_processed_id = next_id,
        rows_processed    = rows_processed + rows_updated,
        updated_at        = NOW()
    WHERE migration_name = 'backfill_display_name';

    COMMIT;

    -- Allow replica to catch up
    PERFORM pg_sleep(0.1);  -- 100ms sleep between batches

    current_id := next_id;
  END LOOP;
END $$;
```

**Backfill Completion Verification:**
```sql
-- Must return 0 before proceeding to Phase 3
SELECT COUNT(*) FROM users WHERE display_name IS NULL;

-- Confirm progress table shows expected row count
SELECT * FROM migration_progress WHERE migration_name = 'backfill_display_name';
```

---

### Phase 3: Application Release 2 -- Read from display_name

**Deploy Release 2 AFTER backfill completion is verified (display_name IS NULL count = 0).**

- Application reads switch from `username` to `display_name`.
- Writes continue to update both columns (belt-and-suspenders for rolling deployment safety -- old pods may still be running during the rollout).
- Add `NOT NULL` constraint to `display_name` in the accompanying migration:

**File:** `20240322040000_add_not_null_constraint_display_name.sql`
**Deploy:** WITH Application Release 2

```sql
-- Migration: Add NOT NULL constraint to display_name (Phase 3 of 4)
-- Author: platform-team
-- Date: 2024-03-22
-- Risk: Tier 2 -- constraint addition using NOT VALID + VALIDATE pattern
-- Lock Type: ShareUpdateExclusiveLock during VALIDATE (does not block reads or writes)
-- Estimated execution time: NOT VALID instant; VALIDATE ~10 minutes for 80M rows
-- Rollback: ALTER TABLE users ALTER COLUMN display_name DROP NOT NULL;
-- Dependencies: Backfill must be complete (display_name IS NULL = 0 rows)

SET lock_timeout = '5s';

BEGIN;
-- Step A: Add check constraint without scanning existing rows
ALTER TABLE users
  ADD CONSTRAINT users_display_name_not_null
  CHECK (display_name IS NOT NULL) NOT VALID;
COMMIT;

-- Step B: Validate in a separate transaction (uses ShareUpdateExclusiveLock)
-- This scans all rows but does NOT block reads or normal writes
BEGIN;
ALTER TABLE users VALIDATE CONSTRAINT users_display_name_not_null;
COMMIT;

-- Step C: In Postgres 12+, convert to true NOT NULL using the validated constraint
-- This is a catalog-only change (no table scan, < 100ms lock)
BEGIN;
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;
ALTER TABLE users DROP CONSTRAINT users_display_name_not_null;
COMMIT;
```

---

### Phase 4: Contract -- Drop username Column

**File:** `20240329020000_contract_drop_username_from_users.sql`
**Deploy:** AFTER Application Release 3 removes all remaining references to `username`
**Minimum wait:** 72 hours after Release 2 is fully rolled out and stable (all pods on new version, zero error-rate increase)

```sql
-- Migration: Drop username column from users (Phase 4 of 4 -- Contract)
-- Author: platform-team
-- Date: 2024-03-29
-- Risk: Tier 3 -- destructive, irreversible without backup restore
-- Lock Type: ACCESS EXCLUSIVE (brief, catalog-only column drop)
-- Estimated execution time: < 1 second
-- Rollback: RESTORE FROM BACKUP -- this operation cannot be reversed in-place
-- Pre-condition: Confirm no application code references users.username
-- Pre-condition: Confirm Release 3 has been running for >= 72 hours with no errors
-- Dependencies: Application Release 3 fully deployed and verified

SET lock_timeout = '5s';
SET statement_timeout = '10s';

BEGIN;

-- Final guard: fail loudly if any rows still have a display_name mismatch
-- (should be impossible if backfill and dual-write worked correctly)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users
    WHERE display_name IS DISTINCT FROM username
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Data mismatch detected: display_name and username differ. Aborting drop.';
  END IF;
END $$;

-- Drop the old column
ALTER TABLE users DROP COLUMN IF EXISTS username;

-- Update the search view to remove the deprecated column
CREATE OR REPLACE VIEW user_search_view AS
  SELECT
    id,
    display_name,
    email,
    created_at
  FROM users;

COMMIT;
```

**Post-Phase-4 Validation:**
```sql
-- Confirm username column is gone
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'username';
-- Expected: 0 rows

-- Confirm display_name is present, NOT NULL, VARCHAR(100)
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'display_name';
-- Expected: 1 row, character_maximum_length=100, is_nullable=NO

-- Confirm view is healthy
SELECT COUNT(*) FROM user_search_view LIMIT 1;
```

---

### Rollback Procedures by Phase

| Phase | Rollback Method | Estimated Time |
|-------|----------------|----------------|
| Phase 1 (Expand DDL) | `ALTER TABLE users DROP COLUMN display_name;` | < 1 second |
| Phase 2 (Dual Write App) | Redeploy Release 0 (app only) | 5-10 minutes (Kubernetes rollback) |
| Phase 2b (Backfill) | Stop background job; display_name remains partially populated but app still reads username | Instant |
| Phase 3 (NOT NULL + Read Switch) | `ALTER TABLE users ALTER COLUMN display_name DROP NOT NULL;` then redeploy Release 1 | < 1 second DDL + 5-10 min app rollback |
| Phase 4 (Drop username) | **BACKUP RESTORE ONLY** -- no in-place recovery | 30-120 minutes depending on backup size |

---

### Follow-Up Actions
- [ ] Follow-up ticket created: "Contract Phase -- Drop username column" (due: 2024-03-29, 72 hours after Release 2 stability confirmed)
- [ ] `migration_progress` table cleaned up after backfill: `DELETE FROM migration_progress WHERE migration_name = 'backfill_display_name';`
- [ ] Internal ERD updated to reflect `display_name` column
- [ ] API documentation updated (if `username` was exposed in any public API response)
- [ ] Search indexer re-indexed off `display_name` field name
- [ ] ADR written: "Why we used expand-contract for users.username rename" filed in `/docs/adrs/`
