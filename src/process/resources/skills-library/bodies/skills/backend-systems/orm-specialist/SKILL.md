---
name: orm-specialist
description: |
  ORM patterns and optimization expertise covering Active Record vs Data Mapper, Prisma/TypeORM/Sequelize/SQLAlchemy patterns, N+1 prevention, eager vs lazy loading, transaction management, raw query fallbacks, and migration generation.
  Use when the user asks about orm specialist, orm specialist best practices, or needs guidance on orm specialist implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design database"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# ORM Specialist

## Purpose

Select, configure, and optimize ORMs for production applications. This skill covers ORM patterns, performance pitfalls, query optimization, transaction management, and the decision framework for when to use (or bypass) an ORM.

## ORM Pattern Selection

### Active Record vs Data Mapper

```
ACTIVE RECORD:
  The model class contains both data AND database logic.
  Model.find(), model.save(), model.delete()

  ORMS: Sequelize, ActiveRecord (Ruby), Eloquent (Laravel)

  PROS:
    + Simple, intuitive API
    + Fast prototyping
    + Less boilerplate

  CONS:
    - Business logic and persistence mixed
    - Harder to test (models depend on database)
    # ... (condensed) ...

RECOMMENDATION:
  Small projects/prototypes: Active Record
  Large/enterprise projects: Data Mapper
  TypeScript projects:       Prisma (unique approach, excellent DX)
```

## Prisma Patterns

### Schema Definition

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "views"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  # ... (condensed) ...
enum Role {
  ADMIN
  EDITOR
  VIEWER
}
```

### Query Patterns

```ts
// Basic CRUD
const user = await prisma.user.create({
  data: { email: 'john@example.com', name: 'John' },
});

const user = await prisma.user.findUnique({
  where: { id: userId },
});

const user = await prisma.user.update({
  where: { id: userId },
  data: { name: 'Updated Name' },
});

# ... (condensed) ...
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
  },
});
```

### Prisma with Transactions

```ts
// Interactive transaction
const [order, inventory] = await prisma.$transaction(async (tx) => {
  // Create order
  const order = await tx.order.create({
    data: { userId, total: calculateTotal(items) },
  });

  // Create order items
  await tx.orderItem.createMany({
    data: items.map(item => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    # ... (condensed) ...
}, {
  maxWait: 5000,    // Max wait to acquire transaction
  timeout: 10000,   // Max transaction duration
  isolationLevel: 'Serializable',
});
```

## TypeORM Patterns

### Entity Definition (Data Mapper)

```ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  name: string;

  # ... (condensed) ...
  author: User;

  @Column({ name: 'author_id' })
  authorId: string;
}
```

### Repository Pattern

```ts
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['posts'],
    });
  }

  # ... (condensed) ...
      .skip((filters.page - 1) * filters.pageSize)
      .take(filters.pageSize)
      .getManyAndCount();
  }
}
```

## N+1 Prevention

### Detecting N+1

```
SYMPTOMS:
  - Multiple identical queries in logs (SELECT ... WHERE id = ?)
  - Slow endpoints that load lists with relations
  - Database CPU spikes during list queries

DETECTION TOOLS:
  - Prisma: prisma.$on('query', ...) event listener
  - TypeORM: logging: true in connection config
  - SQLAlchemy: echo=True
  - General: Query logging middleware
```

### Prevention Strategies

```ts
// Strategy 1: Eager loading (include/join)
// Load relations in the initial query
const users = await prisma.user.findMany({
  include: { posts: true, profile: true },
});
// SQL: SELECT users.*, posts.*, profiles.* FROM users
//      LEFT JOIN posts ON ...
//      LEFT JOIN profiles ON ...

// Strategy 2: Batch loading (DataLoader)
// For GraphQL: see graphql-builder skill

// Strategy 3: Explicit join with QueryBuilder
const users = await userRepo.createQueryBuilder('user')
  # ... (condensed) ...
const userIds = users.map(u => u.id);
const posts = await prisma.post.findMany({
  where: { authorId: { in: userIds } },
});
// Manually associate posts with users
```

## Eager vs Lazy Loading

```
EAGER LOADING:
  Load relations immediately with the main query.
  Use when: You know you'll need the relation.

  await prisma.user.findMany({ include: { posts: true } });

LAZY LOADING:
  Load relations on first access (triggers additional query).
  Use when: Relation is optional, may not be accessed.

  // TypeORM with lazy relations
  @ManyToOne(() => User, { lazy: true })
  author: Promise<User>;  // Returns Promise, query on await

  const post = await postRepo.findOne({ where: { id } });
  const author = await post.author;  // Query fires here

RECOMMENDATION:
  - Default to eager loading with explicit includes
  - Avoid lazy loading in loops (causes N+1)
  - Use select/include to control exactly what is loaded
  - Never load relations you don't need
```

## Transaction Management

### Transaction Patterns

```ts
// Pattern 1: Callback-based (Prisma)
await prisma.$transaction(async (tx) => {
  await tx.account.update({ where: { id: fromId }, data: { balance: { decrement: amount } } });
  await tx.account.update({ where: { id: toId }, data: { balance: { increment: amount } } });
  await tx.transfer.create({ data: { fromId, toId, amount } });
});

// Pattern 2: QueryRunner (TypeORM)
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.save(entity1);
  # ... (condensed) ...
  @Transactional()
  async transfer(fromId: string, toId: string, amount: number) {
    // All queries here are in the same transaction
  }
}
```

### Transaction Isolation Levels

```
READ UNCOMMITTED:
  Can read uncommitted changes from other transactions.
  Almost never used.

READ COMMITTED (default for most DBs):
  Only reads committed data.
  Same query in same transaction may return different results.

REPEATABLE READ:
  Reads are consistent within a transaction.
  Phantom reads possible (new rows can appear).

SERIALIZABLE:
  Full isolation, transactions appear sequential.
  Highest consistency, lowest throughput.

RECOMMENDATION:
  Default: READ COMMITTED (good balance)
  Financial: SERIALIZABLE or REPEATABLE READ with explicit locks
  Analytics: READ COMMITTED (stale data is OK)
```

## Raw Query Fallbacks

```ts
// Prisma: Raw queries for complex SQL
const results = await prisma.$queryRaw<UserStats[]>`
  SELECT
    u.id,
    u.name,
    COUNT(p.id) as post_count,
    AVG(p.view_count) as avg_views
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id
  WHERE u.created_at > ${startDate}
  GROUP BY u.id, u.name
  HAVING COUNT(p.id) > ${minPosts}
  ORDER BY avg_views DESC
  LIMIT ${limit}
# ... (condensed) ...
   WHERE u.role = $1
   GROUP BY u.id
   ORDER BY post_count DESC`,
  [role]
);
```

### When to Use Raw SQL

```
USE RAW SQL when:
  - Complex aggregations (GROUP BY, HAVING, window functions)
  - Bulk updates/deletes (UPDATE ... WHERE ... not easily expressed)
  - Performance-critical queries (ORM adds overhead)
  - Database-specific features (JSONB operators, full-text search)
  - Complex JOINs with conditions
  - CTEs (WITH ... AS ...)
  - UPSERT with complex conflict handling

STAY WITH ORM when:
  - Simple CRUD operations
  - Basic filtering and pagination
  - Relation loading (includes/joins)
  - Type-safe query building
  - Migration management
```

## Migration Management

### Migration Best Practices

```ts
// Prisma migrations
// Generate migration from schema changes
// npx prisma migrate dev --name add_user_avatar

// Migration file: prisma/migrations/20250115_add_user_avatar/migration.sql
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;

// TypeORM migration generation
// npx typeorm migration:generate src/migrations/AddUserAvatar

// Generated migration
export class AddUserAvatar1705309200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" varchar`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
  }
}
```

### Migration Safety Rules

```
1. NEVER edit applied migrations
2. ALWAYS test against production-sized data
3. CREATE indexes CONCURRENTLY (PostgreSQL)
4. ADD columns as nullable first, then backfill, then add NOT NULL
5. SEPARATE schema and data migrations
6. INCLUDE down migration when possible
7. USE transaction for multi-statement migrations
8. TIME migrations against production data volume

DANGEROUS OPERATIONS:
  - DROP COLUMN (data loss)
  - ALTER COLUMN type (may lock table)
  - ADD NOT NULL without default (fails if existing rows have NULL)
  - CREATE INDEX (locks table -- use CONCURRENTLY)
  - RENAME COLUMN/TABLE (breaks code referencing old name)
```

## Connection Management

```ts
// Prisma connection configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: ENV_CONFIG_VALUE,
    },
  },
  log: ENV_CONFIG_VALUE === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// Connection pool settings via DATABASE_URL
// postgresql://user:pass@host:5432/db?
# ... (condensed) ...

// Singleton pattern for Prisma in serverless
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (ENV_CONFIG_VALUE !== 'production') globalForPrisma.prisma = prisma;
```

## ORM Architecture Checklist

- [ ] ORM pattern selected (Active Record vs Data Mapper)
- [ ] Schema/model definitions match database conventions (naming, types)
- [ ] N+1 queries detected and prevented (eager loading, DataLoader)
- [ ] Relations explicitly loaded (no implicit lazy loading in loops)
- [ ] Transactions used for multi-step mutations
- [ ] Appropriate isolation level set for transaction type
- [ ] Raw SQL used for complex queries beyond ORM capabilities
- [ ] Connection pool sized appropriately (2 * CPU cores + 1)
- [ ] Migrations are forward-only and zero-downtime compatible
- [ ] Query logging enabled in development for performance analysis
- [ ] Select/include used to avoid over-fetching columns
- [ ] Indexes defined for all filterable/sortable columns
- [ ] Soft deletes considered for audit-sensitive data
- [ ] Graceful shutdown disconnects database connections

## When to Use

**Use this skill when:**
- Designing or implementing orm specialist solutions
- Reviewing or improving existing orm specialist approaches
- Making architectural or implementation decisions about orm specialist
- Learning orm specialist patterns and best practices
- Troubleshooting orm specialist-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Orm Specialist Analysis

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

**Input:** "Help me implement orm specialist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended orm specialist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When orm specialist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
