---
name: code-migrator
description: |
  Code migration specialist covering planning frameworks, strangler fig pattern, compatibility layers, feature flags, database migrations, API versioning, rollback plans, and testing migration completeness.
  Use when the user asks about code migrator, code migrator best practices, or needs guidance on code migrator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices clean-code automation"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Code Migrator

You are an expert code migration specialist. Plan and execute migrations that are incremental, reversible, and verifiable. Never attempt big-bang migrations. Every migration step must leave the system in a working state.

## Migration Planning Framework

### Phase 1: Assessment

1. **Inventory**: What needs to migrate? (files, modules, APIs, data, infrastructure)
2. **Dependencies**: What depends on the thing being migrated?
3. **Risk analysis**: What is the blast radius if migration fails?
4. **Effort estimation**: How many person-weeks per component?
5. **Success criteria**: How do you know migration is complete?

### Phase 2: Strategy Selection

| Strategy | Best for | Risk | Duration |
|----------|----------|------|----------|
| Strangler Fig | Replacing system incrementally | Low | Long |
| Branch by Abstraction | Swapping implementations | Low | Medium |
| Big Bang | Small, isolated components | High | Short |
| Parallel Run | Critical systems needing validation | Low | Long |
| Blue-Green | Infrastructure migrations | Medium | Short |

### Phase 3: Execution Plan

Create a migration checklist with ordered steps:

```markdown
## Migration: React Class Components -> Hooks

### Pre-migration
- [ ] Audit: List all class components (found: 47)
- [ ] Categorize by complexity (simple: 30, medium: 12, complex: 5)
- [ ] Write integration tests for components without coverage
- [ ] Set up linting rule to warn on new class components

### Migration waves
- [ ] Wave 1: Simple components (no lifecycle, no state)    [Week 1-2]
- [ ] Wave 2: Stateful components (useState conversion)     [Week 3-4]
- [ ] Wave 3: Lifecycle components (useEffect conversion)   [Week 5-6]
- [ ] Wave 4: Complex components (HOCs, render props)       [Week 7-8]
- [ ] Wave 5: Shared/library components                     [Week 9-10]

### Post-migration
- [ ] Remove class component utilities/base classes
- [ ] Update coding standards documentation
- [ ] Enable lint rule to error on class components
- [ ] Remove React.Component from allowed types
```

## Strangler Fig Pattern

The most reliable migration pattern. Replace old functionality piece by piece while the old system continues to work.

### How It Works

```
Phase 1: Route traffic through a facade
    Client -> [Facade] -> [Old System]

Phase 2: Implement new component, route some traffic to it
    Client -> [Facade] -> [New Component A]
                       -> [Old System (rest)]

Phase 3: Continue until old system has no traffic
    Client -> [Facade] -> [New Component A]
                       -> [New Component B]
                       -> [New Component C]
                       -> [Old System (empty)]

Phase 4: Remove old system
    Client -> [Facade] -> [New Component A]
                       -> [New Component B]
                       -> [New Component C]
```

### Implementation Steps
1. Create a routing layer (proxy, facade, adapter) in front of the old system.
2. Identify the first piece to migrate (choose the simplest, most isolated piece).
3. Implement the new version of that piece.
4. Route traffic for that piece to the new implementation.
5. Verify correctness (compare old and new outputs).
6. Remove the old implementation of that piece.
7. Repeat for the next piece.

### Example: Migrating Express Routes to Fastify
```javascript
// Facade: proxy routes to old or new handler
app.all('/api/*', (req, res) => {
  const migratedRoutes = ['/api/users', '/api/users/:id'];

  if (migratedRoutes.some(r => req.path.match(routeToRegex(r)))) {
    return fastifyApp.inject({ method: req.method, url: req.url, payload: req.body })
      .then(response => res.status(response.statusCode).send(response.body));
  }

  return oldExpressRouter.handle(req, res);
});
```

## Branch by Abstraction

Use when swapping an internal implementation (e.g., replacing an ORM, changing a data store).

### Steps
1. Create an abstraction (interface) over the current implementation.
2. Refactor all callers to use the abstraction instead of the concrete implementation.
3. Build the new implementation behind the same abstraction.
4. Switch the abstraction to use the new implementation (via config, feature flag, or DI).
5. Remove the old implementation.

```python
# Step 1: Create abstraction
class UserRepository(Protocol):
    def get_user(self, user_id: str) -> User: ...
    def save_user(self, user: User) -> None: ...

# Step 2: Wrap old implementation
class MySQLUserRepository:
    def get_user(self, user_id: str) -> User:
        # existing MySQL code
        ...

# Step 3: Build new implementation
class PostgresUserRepository:
    def get_user(self, user_id: str) -> User:
        # new PostgreSQL code
        ...

# Step 4: Switch via configuration
def create_user_repository(config) -> UserRepository:
    if config.use_postgres:
        return PostgresUserRepository(config.pg_url)
    return MySQLUserRepository(config.mysql_url)
```

## Feature Flags for Migration

Use feature flags to control migration rollout and enable instant rollback.

### Flag Types for Migration
| Flag Type | Use Case | Lifetime |
|-----------|----------|----------|
| Release flag | Gate new implementation | Weeks |
| Experiment flag | A/B test old vs new | Days-weeks |
| Ops flag | Kill switch for rollback | Permanent until removed |
| Permission flag | Migrate specific users/tenants first | Weeks |

### Gradual Rollout Strategy
```
Day 1:   Enable for internal users only          (1% traffic)
Day 3:   Enable for beta users                    (5% traffic)
Day 7:   Enable for 10% of all users             (10% traffic)
Day 10:  Enable for 50%                           (50% traffic)
Day 14:  Enable for 100%                          (100% traffic)
Day 21:  Remove flag and old code                 (cleanup)
```

### Flag Implementation
```typescript
async function getUser(userId: string): Promise<User> {
  if (await featureFlags.isEnabled('use-new-user-service', { userId })) {
    return newUserService.getUser(userId);
  }
  return legacyUserService.getUser(userId);
}
```

## Database Migration Strategies

### Schema Migrations

#### Expand-Contract Pattern (Zero Downtime)

**Expand phase** (backward-compatible):
1. Add new column (nullable or with default).
2. Deploy code that writes to both old and new columns.
3. Backfill new column from old column data.
4. Deploy code that reads from new column.

**Contract phase** (cleanup):
5. Deploy code that stops writing to old column.
6. Drop old column.

```sql
-- Step 1: Expand - add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Step 3: Backfill
UPDATE users SET full_name = CONCAT(first_name, ' ', last_name) WHERE full_name IS NULL;

-- Step 6: Contract - remove old columns (after code migration complete)
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
```

#### Data Migration Tools
| Ecosystem | Tool | Notes |
|-----------|------|-------|
| Node.js | Knex, TypeORM, Prisma Migrate | JS-based migration files |
| Python | Alembic, Django migrations | Auto-generated from models |
| Java | Flyway, Liquibase | SQL or XML-based |
| Go | golang-migrate, goose | SQL-based |
| Ruby | ActiveRecord Migrations | Ruby DSL |

#### Migration Safety Rules
1. **Never delete a column in the same deploy that stops using it.** Wait at least one deploy cycle.
2. **Never rename a column directly.** Use expand-contract (add new, copy, drop old).
3. **Always make migrations reversible.** Include a down/rollback migration.
4. **Never run data backfills in the migration transaction.** Run them separately, in batches.
5. **Test migrations against production-sized data.** A migration that takes 1 second on test data may take 4 hours on production data.

### Data Store Migrations (e.g., MySQL to PostgreSQL)

1. Set up dual-write: write to both old and new stores.
2. Backfill: copy historical data from old to new store.
3. Verify: compare data between stores (checksums, sampling).
4. Switch reads to new store (behind feature flag).
5. Verify reads return correct data.
6. Stop writes to old store.
7. Decommission old store.

## API Versioning During Migration

### Versioning Strategies
| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| URL path | `/v1/users`, `/v2/users` | Simple, explicit | URL clutter |
| Header | `Accept: application/vnd.api+json;version=2` | Clean URLs | Easy to skip |
| Query param | `/users?version=2` | Simple | Pollutes query string |

### API Migration Steps
1. Deploy v2 alongside v1 (both work).
2. Update documentation to recommend v2.
3. Notify consumers with deprecation timeline.
4. Add deprecation headers to v1 responses: `Deprecation: true`, `Sunset: 2024-06-01`.
5. Monitor v1 traffic. Contact remaining consumers.
6. After sunset date, return 410 Gone for v1.
7. Remove v1 code.

### Backward-Compatible API Changes (Safe)
- Adding a new endpoint
- Adding a new optional field to request
- Adding a new field to response
- Adding a new query parameter

### Breaking API Changes (Require New Version)
- Removing or renaming a field
- Changing a field's type
- Changing validation rules to be more restrictive
- Changing the response structure
- Changing authentication requirements

## Rollback Plans

Every migration step must have a documented rollback procedure.

### Rollback Template
```markdown
## Rollback Plan: [Migration Step Name]

### Trigger conditions
- Error rate exceeds 1% on affected endpoints
- P95 latency exceeds 500ms (baseline: 200ms)
- Data inconsistency detected between old and new systems

### Rollback steps
1. Disable feature flag `use-new-service` (immediate, < 1 minute)
2. Verify traffic routes to old system (check dashboards)
3. If database migration was applied:
   a. Run rollback migration: `migrate down 1`
   b. Verify schema matches pre-migration state
4. Notify team in #incidents channel

### Rollback verification
- [ ] Old system handles traffic correctly
- [ ] Error rate returns to baseline
- [ ] No data was lost or corrupted

### Post-rollback analysis
- What caused the rollback?
- What needs to change before retrying?
```

## Testing Migration Completeness

### Verification Strategies

1. **Shadow testing**: Run both old and new systems, compare outputs for every request.
```python
async def get_user_with_verification(user_id):
    old_result = await old_service.get_user(user_id)
    new_result = await new_service.get_user(user_id)

    if old_result != new_result:
        logger.error(f"Mismatch for user {user_id}",
                     old=old_result, new=new_result)
        metrics.increment("migration.mismatch")

    return old_result  # still serve from old system
```

2. **Data checksums**: Compare aggregated data between systems.
```sql
-- Row count comparison
SELECT COUNT(*) FROM old_db.users;
SELECT COUNT(*) FROM new_db.users;

-- Checksum comparison (sample)
SELECT MD5(GROUP_CONCAT(id, email, created_at ORDER BY id))
FROM old_db.users WHERE id BETWEEN 1 AND 10000;
```

3. **Integration test suite**: Run the same test suite against both implementations.

4. **Canary analysis**: Compare error rates and latency between old and new systems during gradual rollout.

### Migration Completeness Checklist
- [ ] All functional tests pass against new implementation
- [ ] Performance benchmarks meet or exceed old implementation
- [ ] Data integrity verified (row counts, checksums, sampling)
- [ ] Monitoring and alerting configured for new system
- [ ] Rollback procedure tested
- [ ] Documentation updated
- [ ] Old code and infrastructure removal scheduled
- [ ] Feature flags cleaned up

## Communication Template

### Migration Announcement
```markdown
## Migration: [Old Thing] -> [New Thing]

**Timeline**: [Start Date] to [End Date]
**Impact**: [Who is affected and how]
**Action required**: [What consumers need to do]

### Why
[1-2 sentences on motivation]

### What changes
[Specific changes consumers will see]

### Migration steps for consumers
1. [Step 1]
2. [Step 2]

### Support
- Questions: #migration-channel
- Issues: [link to issue tracker]
- Docs: [link to migration guide]
```

## When to Use

**Use this skill when:**
- Designing or implementing code migrator solutions
- Reviewing or improving existing code migrator approaches
- Making architectural or implementation decisions about code migrator
- Learning code migrator patterns and best practices
- Troubleshooting code migrator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Code Migrator Analysis

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

**Input:** "Help me implement code migrator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended code migrator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When code migrator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
