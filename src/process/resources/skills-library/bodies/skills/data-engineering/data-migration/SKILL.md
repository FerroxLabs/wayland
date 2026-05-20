---
name: data-migration
description: |
  Database migration expertise covering zero-downtime migration strategies, dual-write patterns, shadow tables, data reconciliation, schema evolution, backward compatibility, rollback strategies, large table migration, and cross-database migration for safely moving data between systems without service disruption.
  Use when the user asks about data migration, data migration best practices, or needs guidance on data migration implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql guide"
  category: "data-engineering"
  subcategory: "pipelines-etl"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Data Migration Specialist

## Overview

Database migration is one of the highest-risk operations in software engineering. A failed migration can mean data loss, extended downtime, or corrupt state. This skill covers the strategies, patterns, and safety mechanisms needed to migrate databases reliably, often with zero downtime.

## Migration Strategy Decision Tree

```
Is downtime acceptable?
  YES -> How long?
    < 1 hour -> Simple dump & restore with maintenance window
    < 15 min -> Blue-green with quick switchover
    Any length -> Stop-the-world migration
  NO -> Zero-downtime migration required
    What is changing?
      Schema only -> Online schema migration (pt-osc, gh-ost, pg_repack)
      Database engine -> Dual-write + shadow read migration
      Data model -> Expand-contract pattern
      Cloud provider -> Replicate + cutover migration
```

## Zero-Downtime Migration

### The Expand-Contract Pattern

This is the safest pattern for schema changes in production systems.

```
Phase 1 - EXPAND: Add new structure alongside old
Phase 2 - MIGRATE: Backfill data, dual-write
Phase 3 - SWITCH: Point reads to new structure
Phase 4 - CONTRACT: Remove old structure

Timeline:
  Deploy 1 (Expand)    Deploy 2 (Switch)    Deploy 3 (Contract)
  |------ dual write ------|---- reads from new ----|
  |-- backfill old data ---|                        |
                            |-- verify correctness --|
                                                     |-- drop old --|
```

### Example: Splitting a Column

```sql
-- Goal: Split "full_name" into "first_name" and "last_name"

-- Phase 1: EXPAND - Add new columns (non-breaking)
ALTER TABLE customers ADD COLUMN first_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN last_name VARCHAR(100);

-- Phase 2: MIGRATE - Deploy code that writes to both old and new
-- Application code:
-- def save_customer(customer):
--     customer.full_name = f"{customer.first_name} {customer.last_name}"
--     # Writes to all three columns
--     db.save(customer)

-- Backfill existing data
# ... (condensed) ...
WHERE first_name IS NULL OR last_name IS NULL;
-- Should return 0

-- Phase 4: CONTRACT - Remove old column (after verification period)
ALTER TABLE customers DROP COLUMN full_name;
```

### Example: Changing a Column Type

```sql
-- Goal: Change "price" from INTEGER (cents) to NUMERIC(10,2) (dollars)

-- Phase 1: EXPAND
ALTER TABLE products ADD COLUMN price_decimal NUMERIC(10,2);

-- Phase 2: BACKFILL + DUAL-WRITE
UPDATE products SET price_decimal = price / 100.0 WHERE price_decimal IS NULL;

-- Deploy: application writes to both columns
-- CREATE TRIGGER for safety:
CREATE OR REPLACE FUNCTION sync_price() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.price IS DISTINCT FROM OLD.price THEN
        NEW.price_decimal := NEW.price / 100.0;
    # ... (condensed) ...
-- Phase 3: SWITCH reads to price_decimal
-- Phase 4: Drop trigger, rename column, drop old
DROP TRIGGER price_sync ON products;
ALTER TABLE products DROP COLUMN price;
ALTER TABLE products RENAME COLUMN price_decimal TO price;
```

## Dual-Write Pattern

Used when migrating between databases (e.g., MySQL to PostgreSQL, monolith to microservice).

```python
class DualWriteService:
    """Write to both old and new database during migration."""

    def __init__(self, old_db, new_db, mode='shadow'):
        self.old_db = old_db
        self.new_db = new_db
        self.mode = mode  # shadow, dual, cutover

    def write(self, entity):
        if self.mode == 'shadow':
            # Old DB is primary, async write to new DB
            result = self.old_db.save(entity)
            try:
                self.new_db.save(entity)
            # ... (condensed) ...
                              f"old={primary_result}, new={secondary}")
            except Exception as e:
                metrics.increment("shadow_read.errors")

        threading.Thread(target=compare, daemon=True).start()
```

### Migration Mode Progression

```
Week 1-2: shadow mode
  - Write old (primary) + new (async)
  - Read old only
  - Monitor mismatch rate

Week 3: dual mode
  - Write both (synchronous)
  - Read old
  - Mismatch rate should be ~0%

Week 4: cutover mode
  - Write new (primary) + old (async)
  - Read new
  - Monitor for issues

Week 5+: decommission
  - Remove old DB writes
  - Archive old DB
```

## Data Reconciliation

```python
import hashlib
from typing import Dict, List, Tuple

class DataReconciler:
    """Compare data between source and target databases."""

    def __init__(self, source_engine, target_engine):
        self.source = source_engine
        self.target = target_engine

    def reconcile_counts(self, table_pairs: List[Tuple[str, str]]) -> List[dict]:
        """Compare row counts between source and target tables.

        Note: Table/column names are interpolated via f-strings because SQL
        # ... (condensed) ...
                'target': float(t_val) if t_val else None,
                'pct_difference': round(pct_diff, 4),
                'match': pct_diff < 0.01,  # Within 0.01%
            }
        return results
```

## Schema Evolution

### Backward and Forward Compatibility Rules

```
BACKWARD COMPATIBLE (safe to deploy new code first):
  + Add nullable column
  + Add column with default value
  + Widen column type (INT -> BIGINT, VARCHAR(50) -> VARCHAR(100))
  + Add new table
  + Add index

NOT BACKWARD COMPATIBLE (requires expand-contract):
  - Remove column
  - Rename column
  - Narrow column type
  - Add NOT NULL constraint to existing column
  - Change column type (INT -> VARCHAR)

FORWARD COMPATIBLE (safe to deploy old code with new schema):
  + Remove column (if old code does not reference it)
  + Add nullable column (old code ignores it)
```

### Migration File Organization

```
migrations/
  V001__create_users_table.sql
  V002__add_email_to_users.sql
  V003__create_orders_table.sql
  V004__add_index_orders_user_id.sql
  V005__split_name_columns_expand.sql      # Phase 1: Add columns
  V006__split_name_columns_backfill.sql    # Phase 2: Populate data
  V007__split_name_columns_contract.sql    # Phase 4: Remove old column
```

### Flyway / Liquibase Pattern

```sql
-- V005__split_name_columns_expand.sql
-- Expand phase: add new columns

ALTER TABLE customers ADD COLUMN first_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN last_name VARCHAR(100);

-- Add trigger for dual-write during transition
CREATE OR REPLACE FUNCTION sync_name_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.full_name IS NOT NULL AND (NEW.first_name IS NULL OR TG_OP = 'INSERT') THEN
        NEW.first_name := SPLIT_PART(NEW.full_name, ' ', 1);
        NEW.last_name := SUBSTRING(NEW.full_name FROM POSITION(' ' IN NEW.full_name) + 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_names
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION sync_name_columns();
```

## Rollback Strategies

### Schema Rollback

```sql
-- Every migration should have a corresponding rollback script
-- V005__split_name_columns_expand.sql -> V005__rollback.sql

-- V005__rollback.sql
DROP TRIGGER IF EXISTS trg_sync_names ON customers;
DROP FUNCTION IF EXISTS sync_name_columns();
ALTER TABLE customers DROP COLUMN IF EXISTS first_name;
ALTER TABLE customers DROP COLUMN IF EXISTS last_name;
```

### Data Rollback

```python
class MigrationWithRollback:
    """Migration with automatic rollback on failure."""

    def __init__(self, source_engine, target_engine):
        self.source = source_engine
        self.target = target_engine
        self.rollback_log = []

    def migrate_with_snapshot(self, table, migration_fn):
        """Take snapshot before migration for safe rollback.

        Note: Table names are interpolated via f-strings below because SQL
        parameters cannot be used for identifiers. Validate that table names
        are never derived from user input.
        # ... (condensed) ...
    def rollback(self, table, snapshot_table):
        """Restore table from snapshot."""
        with self.target.begin() as conn:
            conn.execute(f"DROP TABLE IF EXISTS {table}")
            conn.execute(f"ALTER TABLE {snapshot_table} RENAME TO {table}")
```

## Large Table Migration

### Online DDL Techniques

```shell
# gh-ost (GitHub Online Schema Tester) for MySQL
gh-ost \
    --host=primary-db \
    --database=production \
    --table=orders \
    --alter="ADD COLUMN shipping_status VARCHAR(20) DEFAULT 'pending'" \
    --allow-on-master \
    --chunk-size=1000 \
    --max-load="Threads_running=25" \
    --critical-load="Threads_running=50" \
    --exact-rowcount \
    --concurrent-rowcount \
    --default-retries=120 \
    --postpone-cut-over-flag-file=/tmp/gh-ost.postpone \
    --execute

# How gh-ost works:
# 1. Creates ghost table with new schema
# 2. Copies rows from original to ghost in chunks
# 3. Applies binary log events for ongoing changes
# 4. Atomically swaps tables when caught up
```

```sql
-- PostgreSQL: pg_repack for table reorganization
-- Does not require ACCESS EXCLUSIVE lock for the full duration

-- Install extension
CREATE EXTENSION pg_repack;

-- Repack a table (remove bloat, apply new storage parameters)
-- Run from command line:
-- pg_repack --table orders --no-superuser-check -d production
```

### Chunked Data Migration

```python
def migrate_large_table(source_engine, target_engine, table,
                        key_column, chunk_size=10000):
    """
    Migrate large table in chunks with progress tracking and resumability.

    Note: Table/column names are interpolated via f-strings because SQL
    parameters cannot be used for identifiers. Ensure these values are
    never derived from user input.
    """
    # Get total count and max key for progress tracking
    total = pd.read_sql(f"SELECT COUNT(*) AS c FROM {table}", source_engine).iloc[0]['c']

    # Get resume point
    last_key = get_checkpoint(table)
    # ... (condensed) ...
        migrated += len(chunk)
        progress = migrated / total * 100
        print(f"Progress: {migrated}/{total} ({progress:.1f}%)")

    return migrated
```

## Cross-Database Migration

### Type Mapping

```python
# MySQL to PostgreSQL type mapping
MYSQL_TO_PG_TYPES = {
    'TINYINT':    'SMALLINT',
    'SMALLINT':   'SMALLINT',
    'MEDIUMINT':  'INTEGER',
    'INT':        'INTEGER',
    'BIGINT':     'BIGINT',
    'FLOAT':      'REAL',
    'DOUBLE':     'DOUBLE PRECISION',
    'DECIMAL':    'NUMERIC',
    'CHAR':       'CHAR',
    'VARCHAR':    'VARCHAR',
    'TINYTEXT':   'TEXT',
    'TEXT':       'TEXT',
    # ... (condensed) ...
    'UNIQUEIDENTIFIER': 'UUID',
    'VARBINARY':      'BYTEA',
    'IMAGE':          'BYTEA',
    'XML':            'XML',
}
```

## Migration Checklist

### Pre-Migration

- [ ] Full backup of source database verified and tested
- [ ] Target environment provisioned and tested
- [ ] Schema migration scripts reviewed and tested on staging
- [ ] Data migration scripts tested with production-like data volume
- [ ] Rollback plan documented and tested
- [ ] Application compatibility verified (old code + new schema)
- [ ] Monitoring and alerting configured for migration metrics
- [ ] Communication plan sent to stakeholders
- [ ] Maintenance window scheduled (if applicable)

### During Migration

- [ ] Monitoring dashboards open and watched
- [ ] Progress tracking active
- [ ] Error rates within acceptable thresholds
- [ ] Data reconciliation checks passing
- [ ] Application health checks passing

### Post-Migration

- [ ] Row count reconciliation across all tables
- [ ] Checksum verification for critical tables
- [ ] Aggregate value comparison (sums, counts)
- [ ] Application functional tests passing
- [ ] Performance benchmarks within acceptable range
- [ ] Monitoring confirms normal operation for 24+ hours
- [ ] Old infrastructure decommissioning scheduled
- [ ] Documentation updated
- [ ] Runbook updated with lessons learned

## When to Use

**Use this skill when:**
- Designing or implementing data migration solutions
- Reviewing or improving existing data migration approaches
- Making architectural or implementation decisions about data migration
- Learning data migration patterns and best practices
- Troubleshooting data migration-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Data Migration Analysis

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

**Input:** "Help me implement data migration for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended data migration approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When data migration must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
