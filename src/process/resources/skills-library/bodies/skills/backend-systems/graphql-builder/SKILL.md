---
name: graphql-builder
description: |
  GraphQL schema design expertise covering schema-first vs code-first, resolver patterns, DataLoader for N+1 prevention, subscriptions, federation, authentication, Relay cursor pagination, error handling, and schema evolution.
  Use when the user asks about graphql builder, graphql builder best practices, or needs guidance on graphql builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design frameworks"
  category: "backend-systems"
  subcategory: "api-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# GraphQL Builder

## Purpose

Design and implement GraphQL APIs that are performant, type-safe, and evolvable. This skill covers schema design principles, resolver patterns, performance optimization (especially N+1 prevention), real-time subscriptions, and federation for microservice architectures.

## Schema-First vs Code-First

### Schema-First (SDL)

```graphql
# schema.graphql
type Query {
  user(id: ID!): User
  users(filter: UserFilter, first: Int, after: String): UserConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(input: UpdateUserInput!): UpdateUserPayload!
  deleteUser(id: ID!): DeleteUserPayload!
}

type User {
  id: ID!
  # ... (condensed) ...

type UserError {
  field: String!
  message: String!
}
```

```
SCHEMA-FIRST PROS:
  + Schema is the single source of truth
  + Non-developers can read and review
  + Schema can be designed before implementation
  + Better for collaboration (frontend and backend design together)

SCHEMA-FIRST CONS:
  - Resolver types must be kept in sync manually
  - Code generation step required for type safety
  - Schema file can become very large

TOOLS: Apollo Server, GraphQL Yoga, graphql-codegen
```

### Code-First

```ts
// Using Pothos (TypeScript code-first)
import SchemaBuilder from '@pothos/core';
import RelayPlugin from '@pothos/plugin-relay';
import PrismaPlugin from '@pothos/plugin-prisma';

const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: GraphQLContext;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
  };
}>({
  plugins: [RelayPlugin, PrismaPlugin],
  prisma: { client: prisma },
# ... (condensed) ...
    args: { id: t.arg.id({ required: true }) },
    resolve: (query, root, args) =>
      prisma.user.findUnique({ ...query, where: { id: args.id } }),
  })
);
```

```
CODE-FIRST PROS:
  + Full type safety (TypeScript types = schema types)
  + Resolvers co-located with schema definition
  + IDE autocompletion for schema definition
  + No code generation step

CODE-FIRST CONS:
  - Schema less readable for non-developers
  - Harder to review schema changes in PRs
  - Library lock-in

TOOLS: Pothos, TypeGraphQL, Nexus
```

### Decision

```
SCHEMA-FIRST: When frontend/backend teams design API together,
              or when schema review is important.
CODE-FIRST:   When backend team owns API, wants maximum type safety,
              and co-located resolver logic is preferred.
```

## Resolver Patterns

### Resolver Chain

```ts
// Resolvers follow the type hierarchy
const resolvers = {
  Query: {
    user: (parent, args, context) => context.db.users.findById(args.id),
  },
  User: {
    // Field resolver (called for each User in the result)
    posts: (user, args, context) => context.db.posts.findByAuthor(user.id),
    // Computed field
    fullName: (user) => `${user.firstName} ${user.lastName}`,
    // Resolved from parent (default resolver handles this if field name matches)
    email: (user) => user.email,
  },
};

// Resolver signature: (parent, args, context, info)
// parent:  The resolved value of the parent type
// args:    Arguments passed to the field
// context: Shared per-request context (db, auth, dataloaders)
// info:    Query AST information (advanced optimization)
```

### Context Setup

```ts
// Per-request context (created for each GraphQL request)
interface GraphQLContext {
  db: PrismaClient;
  user: User | null;
  loaders: DataLoaders;
  requestId: string;
}

function createContext(req: Request): GraphQLContext {
  const user = authenticateRequest(req);
  return {
    db: prisma,
    user,
    loaders: createDataLoaders(prisma),
    requestId: crypto.randomUUID(),
  };
}
```

## DataLoader (N+1 Prevention)

### The N+1 Problem

```graphql
# This query causes N+1:
query {
  users(first: 10) {       # 1 query: SELECT * FROM users LIMIT 10
    id
    name
    department {            # N queries: SELECT * FROM departments WHERE id = ?
      name                  #   (one per user)
    }
  }
}
# Total: 1 + 10 = 11 queries
```

### DataLoader Solution

```ts
import DataLoader from 'dataloader';

function createDataLoaders(db: PrismaClient) {
  return {
    department: new DataLoader<string, Department>(async (ids) => {
      // Batch: single query for all IDs
      const departments = await db.departments.findMany({
        where: { id: { in: [...ids] } },
      });
      // Return in same order as requested IDs
      const map = new Map(departments.map(d => [d.id, d]));
      return ids.map(id => map.get(id) ?? new Error(`Department ${id} not found`));
    }),

    # ... (condensed) ...
      context.loaders.userPosts.load(user.id),
  },
};

// Result: 1 query for users + 1 batch query for departments = 2 queries total
```

### DataLoader Rules

```
1. Create NEW DataLoader instances per request (not global)
   DataLoader caches per request -- reusing across requests leaks data.

2. Return values in the SAME ORDER as input keys
   DataLoader maps results by position, not by key.

3. Return Error instances for individual failures
   Don't throw -- return new Error() for the specific key.

4. Use batch function for all 1:1 and 1:N relationships
   1:1 (user -> department): Return single item per key
   1:N (user -> posts):      Return array per key
```

## Pagination (Relay Cursor)

### Relay Connection Spec

```graphql
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  # ... (condensed) ...
    last: Int
    before: String
    filter: UserFilter
  ): UserConnection!
}
```

### Implementation

```ts
async function resolveUserConnection(args: ConnectionArgs, db: PrismaClient) {
  const { first, after, filter } = args;
  const take = Math.min(first ?? 20, 100); // Cap at 100

  const where: Prisma.UserWhereInput = {};
  if (filter?.role) where.role = filter.role;
  if (filter?.search) where.name = { contains: filter.search, mode: 'insensitive' };

  // Decode cursor
  const cursor = after ? decodeCursor(after) : undefined;

  const users = await db.users.findMany({
    where: {
      ...where,
      # ... (condensed) ...
}

function decodeCursor(cursor: string): { id: string } {
  return JSON.parse(BufferCreate(cursor, 'base64url').toString());
}
```

## Subscriptions

```ts
// Schema
const typeDefs = `
  type Subscription {
    messageAdded(roomId: ID!): Message!
    userStatusChanged(userId: ID!): UserStatus!
  }
`;

// Resolver with pub/sub
import { PubSub, withFilter } from 'graphql-subscriptions';

const pubsub = new PubSub(); // Use RedisPubSub for production

const resolvers = {
  # ... (condensed) ...
      await pubsub.publish('MESSAGE_ADDED', { messageAdded: message });
      return message;
    },
  },
};
```

## Federation (Microservices)

```graphql
# User Service schema
type User @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}

type Query {
  user(id: ID!): User
  users: [User!]!
}

# Order Service schema
type Order @key(fields: "id") {
  # ... (condensed) ...
  Order: {
    user: (order) => ({ __typename: 'User', id: order.userId }),
    // Gateway resolves the full User from User Service
  },
};
```

```
FEDERATION ARCHITECTURE:
  Client -> [GraphQL Gateway (Apollo Router)] -> User Service
                                               -> Order Service
                                               -> Product Service

GATEWAY:
  - Composes schemas from all services
  - Routes queries to appropriate services
  - Joins data across services
  - Handles query planning and optimization
```

## Authentication in GraphQL

```ts
// Context-level auth (recommended)
function createContext(req: Request): GraphQLContext {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token ? verifyToken(token) : null;
  return { user, db: prisma, loaders: createLoaders() };
}

// Field-level authorization with directive
const typeDefs = `
  directive @auth(requires: Role = VIEWER) on FIELD_DEFINITION

  type Query {
    publicData: String
    users: [User!]! @auth(requires: ADMIN)
    # ... (condensed) ...
          return fieldConfig;
        },
      }),
  };
}
```

## Error Handling

```ts
// Structured errors in mutations
type CreateUserPayload {
  user: User
  errors: [MutationError!]!
}

interface MutationError {
  message: String!
  path: [String!]
}

type ValidationError implements MutationError {
  message: String!
  path: [String!]
  # ... (condensed) ...
        throw error; // Unexpected errors still throw
      }
    },
  },
};
```

## Schema Evolution

```
BACKWARD COMPATIBLE CHANGES (safe):
  + Add new type
  + Add new field (nullable or with default)
  + Add new enum value
  + Add new argument (optional with default)
  + Add new query/mutation
  + Deprecate field (add @deprecated)

BREAKING CHANGES (require versioning or migration):
  - Remove type
  - Remove field
  - Remove enum value
  - Change field type
  - Make nullable field non-nullable
  # ... (condensed) ...
    fullName: String!
  }

SCHEMA CHANGE DETECTION:
  Use graphql-inspector or Apollo Studio to detect breaking changes in CI.
```

## GraphQL Architecture Checklist

- [ ] Schema design approach selected (schema-first or code-first)
- [ ] DataLoader used for all N+1-prone relationships
- [ ] DataLoaders created per-request (not shared globally)
- [ ] Relay cursor pagination for all list fields
- [ ] Query depth and complexity limits configured
- [ ] Authentication at context level, authorization per field
- [ ] Mutations return payload types with error arrays
- [ ] Subscriptions use Redis PubSub for multi-server support
- [ ] Federation configured for microservice architecture
- [ ] Schema changes checked for backward compatibility in CI
- [ ] Persisted queries enabled for production (security + performance)
- [ ] Query cost analysis prevents abuse (nested queries, circular refs)
- [ ] Deprecated fields tracked and cleaned up on schedule
- [ ] Monitoring covers resolver latency, error rates, query patterns

## When to Use

**Use this skill when:**
- Designing or implementing graphql builder solutions
- Reviewing or improving existing graphql builder approaches
- Making architectural or implementation decisions about graphql builder
- Learning graphql builder patterns and best practices
- Troubleshooting graphql builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Graphql Builder Analysis

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

**Input:** "Help me implement graphql builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended graphql builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When graphql builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
