---
name: graphql-implementation
description: |
  Guides expert-level graphql implementation implementation: api-design and frameworks decision frameworks, production-ready patterns, and concrete templates for graphql implementation workflows.
  Use when the user asks about graphql implementation, graphql implementation configuration, or api-design best practices for graphql projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "api-design frameworks optimization"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# GraphQL Implementation

## When to Use

**Use this skill when:**
- User is building a new API and wants to decide whether GraphQL is the right choice over REST or gRPC, and needs a structured decision framework
- User already has a GraphQL schema and needs guidance on resolver design, N+1 problem prevention, DataLoader integration, or query complexity limiting
- User needs to implement production-grade GraphQL including authentication, authorization at the field level, rate limiting, persisted queries, and error handling
- User is building a federated GraphQL architecture using Apollo Federation or schema stitching and needs help with subgraph design, entity resolution, or gateway configuration
- User needs to optimize GraphQL performance -- query depth limiting, cost analysis, response caching with cache-control hints, APQ (Automatic Persisted Queries), or CDN-compatible GET requests
- User is migrating an existing REST API to GraphQL and needs a strangler fig strategy with minimal disruption
- User needs to implement real-time features with GraphQL Subscriptions over WebSockets or Server-Sent Events
- User asks about schema design best practices -- nullable vs non-null fields, pagination patterns (Relay cursor spec vs offset), union types vs interface types, input type design
- User needs to set up GraphQL tooling including schema linting with graphql-inspector, code generation with GraphQL Code Generator, or IDE integrations

**Do NOT use this skill when:**
- User needs REST API design guidance -- use the REST API design skill instead
- User needs gRPC or Protocol Buffers guidance -- use the gRPC implementation skill
- User is asking about database schema design without a GraphQL layer -- use the database schema design skill
- User needs frontend-only GraphQL client configuration (Apollo Client, urql, React Query) without a server-side concern -- use the frontend GraphQL client skill
- User needs OAuth2 / JWT authentication design independent of GraphQL -- use the authentication and authorization skill
- User is asking about WebSocket infrastructure in general, not specifically for GraphQL Subscriptions -- use the real-time systems skill
- User needs API gateway configuration (rate limiting, TLS termination) at the infrastructure level -- use the API gateway skill

---

## Process

### 1. Assess Requirements and Decide Whether GraphQL Is Appropriate

Before writing a single line of GraphQL schema, validate that GraphQL solves the actual problem.

- **Client needs:** GraphQL is the right choice when multiple clients (web, mobile, third-party) need different shapes of the same underlying data. If all clients are internal and require identical payloads, REST is simpler.
- **Relationship density:** GraphQL shines when the data model has many inter-entity relationships (e.g., users → posts → comments → authors → followers). A flat, resource-oriented model does not benefit much.
- **Mutation complexity:** If write operations are simple CRUD, REST is sufficient. If mutations need to return rich, relationship-traversing responses, GraphQL is better.
- **Team capability:** GraphQL has a steeper learning curve than REST. A team unfamiliar with resolvers, schema definition language (SDL), and the N+1 problem will ship broken implementations. Budget 2--3 weeks of ramp-up for a six-person team.
- **Tooling maturity:** Identify your runtime (Node.js with Apollo Server or graphql-yoga, Python with Strawberry or Ariadne, Go with gqlgen, Rust with async-graphql, Java with DGS). Each has different DataLoader support and federation readiness. Choose before designing the schema.
- **Public vs internal API:** Public APIs benefit from SDL-first design because it produces self-documenting contracts. Internal APIs can use code-first approaches (e.g., TypeGraphQL, Pothos, gqlgen struct tags) where the schema is derived from application types.

---

### 2. Design the Schema

Schema design is the most consequential decision in a GraphQL project. Changes to the schema are breaking changes for clients.

- **SDL-first vs code-first:** SDL-first (writing `.graphql` files) gives schema portability and easy federation. Code-first (deriving SDL from annotated classes or structs) reduces duplication for strongly-typed backend languages. For federated graphs, prefer SDL-first because the federation spec requires SDL introspection.
- **Nullable by default, non-null by deliberate choice:** In GraphQL, all fields are nullable unless marked `!`. Only mark fields non-null when you can guarantee they will never be absent -- partial failure resolution relies on nullable fields to allow partial responses rather than nullifying entire subtrees.
- **Pagination:** Use Relay cursor-based pagination for any collection that may exceed 100 items. The Relay spec defines `Connection`, `Edge`, and `PageInfo` types. Offset pagination (`skip`/`limit`) is acceptable for admin UIs where users navigate by page number, but breaks under concurrent inserts.
- **Input types:** Always use dedicated input types for mutations -- never reuse output types as inputs. Input types should represent the minimum required data. Separate create and update input types because update inputs typically have all-optional fields.
- **Error design:** Avoid putting errors only in the HTTP layer. Use union return types (`union CreateUserResult = User | ValidationError | DuplicateEmailError`) so clients can exhaustively handle error states in generated TypeScript types.
- **Naming conventions:** Use camelCase for field names, PascalCase for type names, SCREAMING_SNAKE_CASE for enum values. Verb-first for mutations (`createUser`, `deletePost`, `updateProfile`). Query names should be noun-first (`user`, `users`, `searchPosts`).
- **Avoid "God" types:** A `User` type with 60 fields is a sign that the type conflates multiple concerns. Split into `UserProfile`, `UserSettings`, `UserBillingInfo` connected through relationships.
- **Versioning:** GraphQL does not version endpoints. Deprecate fields with the `@deprecated(reason: "Use newField instead")` directive. Monitor deprecated field usage via field-level tracing before removal. Never remove a field in under 90 days after deprecating it.

---

### 3. Implement Resolvers with Correct Execution Semantics

Resolvers are functions that fulfill each field in a query. Naive resolver implementation is the primary source of GraphQL performance problems.

- **Resolver signature:** Every resolver receives four arguments: `parent` (the resolved parent object), `args` (the field arguments from the query), `context` (request-scoped shared state -- inject DB connections, auth user, DataLoaders here), and `info` (AST metadata about the current field and query).
- **The N+1 problem:** When resolving a list of 100 posts, and each post has an `author` field backed by a DB query, the naive implementation issues 101 queries (1 for posts + 100 for authors). This is the N+1 problem and will kill performance under any real load.
- **DataLoader:** DataLoader solves N+1 by batching. Create a DataLoader per entity type per request (instantiate in context factory, not globally -- DataLoader caches within a request scope, not across requests). The batch function receives an array of keys and must return an array of values in the same order. For PostgreSQL: `SELECT * FROM users WHERE id = ANY($1)` with the batched ID array.
- **DataLoader instantiation:** Create new DataLoader instances in the context factory function, not at module level. Module-level DataLoaders leak data between requests.
- **Resolver delegation:** Avoid putting business logic directly in resolvers. Resolvers should be thin -- they call a service layer and return the result. This makes the service layer unit-testable without GraphQL overhead.
- **Context design:** The context object should carry: authenticated user (after JWT/session verification in middleware), per-request DataLoader instances, database connection pool reference, logger instance with request-ID correlation.
- **Field-level authorization:** Implement authorization inside resolvers or via schema directives (`@auth`, `@hasRole`). Never authorize only at the query/mutation root -- a user might bypass root-level auth by accessing a nested entity. Libraries like `graphql-shield` provide a rule-based permission layer applied per field or type.

---

### 4. Protect the Server Against Malicious and Expensive Queries

A GraphQL endpoint that accepts arbitrary queries from the public internet is a denial-of-service target.

- **Query depth limiting:** Reject queries deeper than a threshold (typically 10--15 levels). Libraries: `graphql-depth-limit`. A depth of 10 is sufficient for most real-world queries. Introspection queries go 7 levels deep, so do not set the limit below 7 in development.
- **Query complexity analysis:** Assign a complexity score to each field (default 1, list fields get multiplier of `n` where `n` is the `first`/`limit` argument). Reject queries with total complexity above a threshold (start at 1000, tune from real query data). Libraries: `graphql-query-complexity`.
- **Field count limiting:** Reject queries that request more than a threshold number of unique fields (e.g., 200). This prevents projection attacks.
- **Disable introspection in production:** Introspection leaks your entire schema to attackers. Disable it via `introspection: false` in server config for production environments. Provide schema documentation through developer portals instead.
- **Persisted queries (APQ / trusted documents):** In production with known clients, only allow pre-registered query hashes. Apollo's Automatic Persisted Queries (APQ) are a migration path -- clients send a hash first, fall back to full query on cache miss, and eventually you can block un-persisted queries entirely once all clients are migrated.
- **Rate limiting:** Apply rate limiting at the resolver level using token bucket or sliding window algorithms. Do not rely solely on HTTP rate limiting -- one HTTP request can contain multiple operations via query batching. GraphQL Shield or a custom plugin can apply per-user, per-field, or per-operation rate limits.
- **Timeout:** Set an absolute execution timeout (500ms--2000ms for web applications). Apollo Server supports `requestTimeout`. Anything exceeding the timeout should return a partial response with an error extension.

---

### 5. Implement Caching Strategy

GraphQL's flexible queries make HTTP-layer caching difficult, but not impossible.

- **HTTP GET for queries:** Queries sent as HTTP GET requests with the query string encoded can be cached by CDNs and browsers. Apollo Client supports this via `useGETForQueries`. Mutations must always use POST.
- **Cache-control hints with `@cacheControl` directive:** Apollo Server supports the `@cacheControl` directive at the type and field level. Set `maxAge` in seconds per field. The server computes the minimum `maxAge` across all resolved fields and sets the `Cache-Control` response header accordingly. Example: `@cacheControl(maxAge: 60)` on a Product type means product queries can be CDN-cached for 60 seconds.
- **Response cache plugin:** Apollo Server's `responseCachePlugin` caches full query responses in Redis by query hash + variables + authenticated scope. Use `sessionId` callback to scope private data to users. Cache TTL should match the underlying data freshness requirements.
- **DataLoader as L1 cache:** DataLoader deduplicates within a single request. For frequently-read reference data (e.g., countries, currencies, categories), add a short-TTL (5--60 seconds) shared cache layer above DataLoader.
- **Persisted query cache:** APQ hashes are stored in a shared cache (Redis). This reduces request size on repeat queries.
- **Avoid caching mutations:** Never cache mutation results. Cache the query that fetches the same data instead, and invalidate it on write.

---

### 6. Set Up Error Handling and Observability

Production GraphQL requires more nuanced error handling than REST because a single response can contain both data and errors simultaneously.

- **Error format:** GraphQL errors appear in the `errors` array of the response alongside `data`. An error has `message`, `locations`, `path`, and `extensions`. Put error codes, user-facing messages, and correlation IDs in `extensions`.
- **Error masking:** Never expose internal error details (stack traces, SQL errors, internal service names) in the `message` field of production errors. Catch and transform errors in resolver wrappers or in the server's `formatError` hook. Return a generic message with a correlation ID to the client; log the full error server-side.
- **Error classification:** Distinguish between user errors (validation failures, not found -- safe to show to the client), application errors (business rule violations -- show code + message), and system errors (DB timeouts, downstream failures -- mask with correlation ID).
- **Tracing:** Apollo Studio, GraphQL Yoga's envelop ecosystem, or OpenTelemetry provide field-level tracing showing resolver execution time, cache hit rate, and error rate per field. Field-level tracing data is critical for identifying slow resolvers and deprecated field usage.
- **Structured logging:** Log every operation with: operation name, operation type (query/mutation/subscription), query hash (not full query text -- query text can contain PII), user ID, duration, error count, and cache status.
- **Health checks:** Expose a `/__health` endpoint separate from `/graphql`. The health check should verify database connectivity, cache availability, and downstream service reachability. Do not use GraphQL introspection as a health check -- it does not test resolver execution.

---

### 7. Configure Subscriptions (When Real-Time Is Required)

Subscriptions are stateful, long-lived connections that require different infrastructure from query/mutation.

- **Transport options:** Use `graphql-ws` protocol (over WebSocket) for modern clients -- it supersedes the deprecated `subscriptions-transport-ws`. For environments where WebSockets are blocked (some corporate proxies), use Server-Sent Events (SSE) via the `graphql-sse` library.
- **Pub/Sub backend:** Subscriptions require a pub/sub broker. For single-instance deployments, in-memory pub/sub works. For horizontally-scaled deployments, use Redis pub/sub (`graphql-redis-subscriptions`) or a message broker (Kafka, RabbitMQ) so events published on one server instance reach clients connected to other instances.
- **Event filtering:** Filter subscription events at the source, not in resolvers. If a user subscribes to `commentAdded(postId: "123")`, filter at the pub/sub level so only comments for that post are delivered to that subscriber. Delivering all events and filtering in resolvers wastes bandwidth and CPU.
- **Connection lifecycle:** Implement `onConnect` to authenticate the WebSocket connection (validate JWT from connection params -- the WebSocket handshake does not carry Authorization headers in most clients). Implement `onDisconnect` to clean up per-connection resources. Set a connection timeout (30 seconds idle) to reclaim resources from abandoned connections.
- **Backpressure:** If a client cannot consume events fast enough, apply backpressure. Drop events or buffer them with a maximum queue size of 100--500 events. Do not allow unbounded event queues -- they cause out-of-memory crashes under load.

---

### 8. Implement Federation for Multi-Team Schemas

At scale, a single monolithic schema becomes a bottleneck. Apollo Federation and similar approaches allow multiple teams to own subgraphs that compose into a unified supergraph.

- **Entity definition:** In Apollo Federation v2, define entities using the `@key` directive. The `@key` field must uniquely identify the entity across subgraphs (`@key(fields: "id")`). Reference resolvers (`__resolveReference`) reconstruct the entity from its key fields.
- **Ownership boundaries:** Each entity is owned by exactly one subgraph (the "source of truth"). Other subgraphs may extend the entity to add fields they own. Avoid circular entity references between subgraphs.
- **Rover CLI:** Use Rover (Apollo's schema management CLI) to validate subgraph schemas against the supergraph composition rules before deploying. `rover subgraph check` prevents breaking composition changes.
- **Schema registry:** Register schemas with Apollo GraphOS (or a self-hosted equivalent) for every deployment. This enables schema change history, contract testing, and operation safety checks.
- **Gateway configuration:** Apollo Router (Rust-based, replaces Apollo Gateway) handles query planning -- splitting the incoming query into subgraph fetches, parallelizing independent fetches, and stitching results. Configure Router with explicit entity cache TTLs and traffic shaping (per-subgraph timeouts and retry budgets).
- **Subscription support in federation:** Apollo Router supports federated subscriptions via the `@source` directive. Event-driven subscriptions in federation require each subgraph to publish events to a shared broker that the Router subscribes to.

---

## Output Format

When helping a user with GraphQL implementation, provide output in the following structure:

```markdown
## GraphQL Implementation Plan

### Schema Design Summary
| Decision Point       | Choice                          | Rationale                                      |
|----------------------|---------------------------------|------------------------------------------------|
| Schema style         | SDL-first / Code-first          | [reason based on team language and tooling]    |
| Pagination           | Relay cursor / Offset           | [reason based on data size and mutation rate]  |
| Error strategy       | Union types / extensions-only   | [reason based on client code-gen usage]        |
| Federation           | Federated / Monolithic          | [reason based on team count and autonomy needs]|
| Subscriptions        | graphql-ws + Redis / None       | [reason based on real-time requirements]       |

### Schema Definition (SDL)

```graphql
# Core types with pagination, error unions, and directives
type Query {
  user(id: ID!): UserResult!
  users(first: Int = 20, after: String, filter: UserFilterInput): UserConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserResult!
}

# Relay-compliant connection
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
  startCursor: String
  endCursor: String
}

# Output type
type User @cacheControl(maxAge: 60) {
  id: ID!
  email: String!
  displayName: String!
  role: UserRole!
  createdAt: DateTime!
  posts(first: Int = 10, after: String): PostConnection!
}

enum UserRole {
  ADMIN
  EDITOR
  VIEWER
}

# Error union pattern
union CreateUserResult = User | ValidationError | DuplicateEmailError

type ValidationError {
  field: String!
  message: String!
  code: String!
}

type DuplicateEmailError {
  email: String!
  message: String!
}

# Input types
input CreateUserInput {
  email: String!
  displayName: String!
  role: UserRole! = VIEWER
  password: String!
}

input UpdateUserInput {
  displayName: String
  role: UserRole
}

input UserFilterInput {
  role: UserRole
  searchTerm: String
  createdAfter: DateTime
}
```

### Resolver Implementation (Node.js / TypeScript)

```typescript
// context.ts -- request-scoped context factory
import DataLoader from 'dataloader';
import { db } from './db';

export async function createContext({ req }: { req: Request }) {
  const user = await verifyJWT(req.headers.authorization);
  return {
    user,
    loaders: {
      // New DataLoader per request -- never reuse across requests
      userById: new DataLoader<string, User | null>(async (ids) => {
        const users = await db.query(
          'SELECT * FROM users WHERE id = ANY($1)',
          [[...ids]]
        );
        const userMap = new Map(users.map((u) => [u.id, u]));
        // Return in same order as input keys -- DataLoader contract
        return ids.map((id) => userMap.get(id) ?? null);
      }),
      postsByUserId: new DataLoader<string, Post[]>(async (userIds) => {
        const posts = await db.query(
          'SELECT * FROM posts WHERE author_id = ANY($1)',
          [[...userIds]]
        );
        const grouped = new Map<string, Post[]>();
        for (const post of posts) {
          const list = grouped.get(post.authorId) ?? [];
          list.push(post);
          grouped.set(post.authorId, list);
        }
        return userIds.map((id) => grouped.get(id) ?? []);
      }),
    },
  };
}

// resolvers.ts
export const resolvers = {
  Query: {
    user: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      // Authorization check
      if (!ctx.user) throw new GraphQLError('Unauthenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      return ctx.loaders.userById.load(id);
    },
    users: async (_: unknown, args: UsersArgs, ctx: Context) => {
      return UserService.listUsers(args, ctx.user);
    },
  },
  Mutation: {
    createUser: async (_: unknown, { input }: { input: CreateUserInput }, ctx: Context) => {
      if (!ctx.user || ctx.user.role !== 'ADMIN') {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
      }
      try {
        const user = await UserService.createUser(input);
        return user; // TypeScript type narrowing resolves to User in union
      } catch (err) {
        if (err instanceof DuplicateEmailError) {
          return { __typename: 'DuplicateEmailError', email: input.email, message: err.message };
        }
        if (err instanceof ValidationError) {
          return { __typename: 'ValidationError', ...err };
        }
        // System error -- mask and log
        ctx.logger.error({ err, correlationId: ctx.correlationId }, 'createUser failed');
        throw new GraphQLError('Internal server error', {
          extensions: { code: 'INTERNAL_ERROR', correlationId: ctx.correlationId }
        });
      }
    },
  },
  User: {
    // This resolver uses DataLoader -- no N+1
    posts: (parent: User, args: PostsArgs, ctx: Context) => {
      return ctx.loaders.postsByUserId.load(parent.id);
    },
  },
  CreateUserResult: {
    // __resolveType allows Apollo to distinguish union members
    __resolveType(obj: unknown) {
      if ('posts' in (obj as object)) return 'User';
      if ('field' in (obj as object)) return 'ValidationError';
      return 'DuplicateEmailError';
    },
  },
};
```

### Security Configuration

```typescript
// server.ts -- production Apollo Server setup
import { ApolloServer } from '@apollo/server';
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-query-complexity';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  plugins: [
    ApolloServerPluginCacheControl({ defaultMaxAge: 0 }),
    responseCachePlugin(),
    ApolloServerPluginUsageReporting(), // sends to Apollo Studio
  ],
  validationRules: [
    depthLimit(12),
    createComplexityLimitRule(1000, {
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,
    }),
  ],
  formatError: (formattedError, error) => {
    // Never leak internals in production
    if (process.env.NODE_ENV === 'production') {
      const code = formattedError.extensions?.code;
      if (!['UNAUTHENTICATED', 'FORBIDDEN', 'BAD_USER_INPUT', 'NOT_FOUND'].includes(code)) {
        return {
          message: 'Internal server error',
          extensions: {
            code: 'INTERNAL_ERROR',
            correlationId: formattedError.extensions?.correlationId,
          },
        };
      }
    }
    return formattedError;
  },
});
```

### DataLoader Performance Checklist
| Issue                         | Symptom                              | Fix                                        |
|-------------------------------|--------------------------------------|--------------------------------------------|
| N+1 queries                   | 100+ DB queries per request          | Add DataLoader for every batched entity    |
| Cross-request DataLoader leak | Stale data, wrong user sees data     | Instantiate DataLoader in context factory  |
| Unordered batch results       | Wrong data returned                  | Sort batch results to match input key order|
| Unbounded DataLoader cache    | Memory growth in long-lived contexts | Set `cache: false` or limit cache size     |
| Missing batch key             | DataLoader throws on missing entry   | Return null for missing keys, not skip     |

### Operation Safety Checklist
- [ ] Introspection disabled in production
- [ ] Query depth limit <= 12
- [ ] Query complexity limit configured (start at 1000)
- [ ] Persisted queries enforced for production clients
- [ ] All resolvers have authorization checks
- [ ] `formatError` masks internal errors
- [ ] DataLoader instantiated per-request in context factory
- [ ] Subscriptions use `graphql-ws` (not deprecated `subscriptions-transport-ws`)
- [ ] Redis pub/sub configured if running multiple instances
- [ ] Deprecated fields logged via field-level tracing before removal
```

---

## Rules

1. **NEVER instantiate DataLoader at module scope.** DataLoader caches keys within its lifetime. A module-scoped DataLoader persists across requests, causing user A to receive user B's cached data. Always create DataLoader instances inside the context factory function, which runs once per request.

2. **NEVER mark fields non-null (`!`) speculatively.** Non-null fields that fail resolution null out the entire parent type and propagate upward, potentially nullifying the root query. Only mark a field non-null if the field's data source guarantees presence -- foreign key violations and empty results will never occur.

3. **NEVER disable introspection in development but ALWAYS disable it in production.** Introspection reveals the entire schema structure, all field names, all enum values, and all directives to anyone who can reach the endpoint. In production, provide schema documentation via developer portals with access control.

4. **NEVER resolve list fields without DataLoader.** Any resolver that returns a list of objects that have nested resolver fields will trigger N+1 database queries. For every one-to-many or many-to-many relationship, a DataLoader must exist for the batch-loading path before the schema is deployed to production.

5. **NEVER put authorization logic only at the root query/mutation level.** Entity types can be reached through multiple paths in a GraphQL query. A field-level authorization check in the `User` resolver does not protect `Post.author` if that resolver returns a raw user object. Apply authorization rules to every resolver that accesses protected data.

6. **ALWAYS use separate input types for create and update mutations.** Create inputs should have required fields enforced with `!`. Update inputs should have all fields optional. Reusing the same input type creates ambiguity about which fields are required on update and prevents proper validation.

7. **ALWAYS implement `__resolveType` for every union and interface type.** Without `__resolveType`, Apollo Server cannot distinguish which concrete type to serialize. This causes silent failures where the client receives null instead of the expected object.

8. **NEVER remove a deprecated field in under 90 days** from the time the `@deprecated` directive was added. Use field-level tracing data to verify zero usage before removal. Removing fields breaks clients that have not migrated, and GraphQL's lack of versioning means there is no graceful degradation path.

9. **ALWAYS set an explicit execution timeout.** Without a timeout, a slow database query or downstream API call stalls the resolver indefinitely, holding a connection pool slot and a WebSocket connection. Set a 2000ms timeout for web-facing APIs and a 10000ms timeout for internal/admin APIs.

10. **NEVER allow public mutation access to the subscription pub/sub channel.** If your subscription resolves a `messageAdded` event, the trigger must come from authenticated mutation resolvers on the server, not from client-side pub/sub publish calls. Exposing a publish endpoint allows clients to inject arbitrary events for other users' subscriptions.

---

## Edge Cases

### Large List Queries Without Pagination Arguments
A client queries `users` without providing `first` or `after` arguments. Without a default and maximum cap, this query fetches all users from the database, potentially returning millions of rows.

**Handling:** Set a `default` and `max` on all list arguments in resolver code (not just in the schema). In the resolver, apply `Math.min(args.first ?? 20, 100)` to cap at 100 regardless of what the client sends. Return a `totalCount` field in the Connection type so clients know how many pages exist without fetching all data. Log any request that hits the maximum cap -- repeated max-cap queries indicate a client that needs pagination implemented.

---

### Circular Schema References Causing Infinite Query Depth
Your schema has `User.posts -> Post.author -> User.posts -> ...`, creating an infinitely nestable structure.

**Handling:** This is expected and valid in GraphQL -- it models real relationships. Defend against it at the execution layer, not the schema layer. A query depth limit of 10--12 prevents clients from traversing more than 5--6 relationship hops. A query complexity score with a list-factor multiplier penalizes deeply nested list queries. Never try to remove circular references from the schema itself -- doing so makes the schema non-representative of the actual data model.

---

### Federation Subgraph Returns Missing Entity Reference
A gateway query asks subgraph B to resolve fields on a `User` entity owned by subgraph A. Subgraph B's `__resolveReference` fetches the user by ID, but the user has been deleted or the ID is invalid.

**Handling:** `__resolveReference` must return `null` for unknown entities, not throw an error. When `__resolveReference` returns null, the gateway marks that entity path as null (leveraging GraphQL's partial response semantics). If the entity field is marked non-null in the supergraph, the null propagates upward. For this reason, entity references in federated schemas should generally be nullable unless the owning subgraph can guarantee consistency.

---

### Subscription Memory Leak on Client Disconnect
A client subscribes to `orderUpdated`, then disconnects without sending an unsubscribe message (e.g., browser tab closed, network drop). The server-side async iterator continues consuming events from Redis, holding memory and a pub/sub subscription.

**Handling:** Use the `onDisconnect` lifecycle hook in `graphql-ws` to call `asyncIterator.return()` on active subscription iterators for that client. Set a server-side connection timeout (30 seconds without a `ping` frame) to force cleanup of abandoned connections. Monitor the count of active subscription connections in your metrics -- a monotonically increasing count indicates a cleanup failure.

---

### Code Generator Type Drift After Schema Change
A developer updates the SDL schema but does not regenerate TypeScript types from GraphQL Code Generator. The application compiles but runtime resolver implementations reference fields that no longer exist or have changed types.

**Handling:** Add `graphql-codegen` to the CI pipeline as a required step before type-checking. Use `graphql-codegen --check` to fail the build if generated files differ from what would be generated from the current schema. Add a pre-commit hook with Husky that regenerates types on `*.graphql` file changes. Configure Code Generator to produce strict resolver types (`useIndexSignature: false`, `strictScalars: true`) so type drift causes compilation errors rather than silent runtime failures.

---

### Authentication in Subscription WebSocket Connections
HTTP Authorization headers are not available during the WebSocket upgrade handshake in most browser implementations. Clients using Apollo Client's `graphql-ws` link cannot pass the JWT the same way they do for queries.

**Handling:** Authenticate subscriptions via `connectionParams` in the WebSocket connection payload (sent as the first message after the WebSocket handshake, not in HTTP headers). In the `graphql-ws` server's `onConnect` handler, extract and verify the token from `connectionParams.Authorization`. Store the authenticated user on the per-connection context. Never fall back to unauthenticated subscription access -- reject the connection in `onConnect` by throwing an error if authentication fails.

---

### High-Frequency Subscription Events Flooding Clients
An order management system publishes `inventoryChanged` events 500 times per second during a flash sale. Clients subscribing to all inventory changes receive overwhelming event volumes that saturate their WebSocket connections and crash mobile clients.

**Handling:** Implement server-side debouncing or throttling in the async iterator. For debounced subscriptions, buffer events for 100--500ms and emit only the final value for each entity key within the window. For throttled subscriptions, emit at most one event per entity per 1000ms regardless of publish frequency. Expose the throttle/debounce interval as a subscription argument (`inventoryChanged(throttleMs: 1000)`) so clients can tune their update frequency. At the infrastructure level, cap the maximum events per second per subscription connection at the WebSocket server layer.

---

### Schema Design Conflict Between Teams in a Federated Graph
Two subgraph teams independently create a `Product` type. One defines `Product.price` as `Float`, the other as a custom `Money` scalar. Federation composition fails because of conflicting type definitions for the same entity.

**Handling:** Establish a "platform team" that owns the supergraph schema contract. Require all cross-subgraph entity fields to be registered in a shared schema contract document before implementation. Use `rover subgraph check` in each team's CI pipeline against the schema registry to detect conflicts before deployment. For the immediate conflict, audit both implementations: if `Money` provides precision guarantees that `Float` does not, migrate both subgraphs to `Money`. If both definitions are in production, the only safe path is a coordinated migration -- add a new non-conflicting field name (`priceAmount: Money`), deprecate the old field, migrate clients, then remove.

---

## Example

**Input:** "We're building a multi-tenant SaaS application with a React frontend and a Node.js backend. We have three resource types: Organizations, Users (who belong to organizations), and Projects (which belong to organizations and have members). We need a GraphQL API with real-time project status updates. The API will be private -- only our frontend app and mobile app will use it. We're deploying to Kubernetes with horizontal scaling. What should our GraphQL implementation look like?"

---

**Output:**

## GraphQL Implementation Plan -- Multi-Tenant SaaS

### Schema Design Summary

| Decision Point   | Choice                           | Rationale                                                                       |
|------------------|----------------------------------|---------------------------------------------------------------------------------|
| Schema style     | Code-first (Pothos or TypeGraphQL) | TypeScript-first team, types derived from domain models reduce duplication      |
| Pagination       | Relay cursor pagination          | Projects lists may grow large; concurrent project creation breaks offset pages  |
| Error strategy   | Union return types               | React frontend uses generated TypeScript -- exhaustive union handling is safe    |
| Federation       | Monolithic (single subgraph)     | Team of 6, 3 resource types -- federation overhead not justified yet            |
| Subscriptions    | `graphql-ws` + Redis pub/sub     | Kubernetes multi-instance deployment requires cross-pod event delivery          |
| Caching          | Apollo response cache + Redis    | Project status queries are read-heavy; 30-second TTL appropriate for status     |
| Auth             | JWT in context + Shield rules    | Multi-tenant: every resolver must verify org membership, not just authentication|
| Persisted queries| APQ enforced for production      | Known clients (web + mobile) only -- block ad-hoc queries in production         |

---

### Schema (SDL)

```graphql
scalar DateTime
scalar JSON

type Query {
  me: User
  organization(id: ID!): Organization
  project(id: ID!): Project
  projects(
    organizationId: ID!
    first: Int = 20
    after: String
    status: ProjectStatus
  ): ProjectConnection!
}

type Mutation {
  createProject(input: CreateProjectInput!): CreateProjectResult!
  updateProjectStatus(id: ID!, status: ProjectStatus!): UpdateProjectStatusResult!
  addProjectMember(projectId: ID!, userId: ID!): AddProjectMemberResult!
}

type Subscription {
  projectStatusChanged(organizationId: ID!): ProjectStatusEvent!
}

# ---- Organizations ----
type Organization @cacheControl(maxAge: 300) {
  id: ID!
  name: String!
  slug: String!
  createdAt: DateTime!
  members(first: Int = 50, after: String): UserConnection!
  projects(first: Int = 20, after: String, status: ProjectStatus): ProjectConnection!
}

# ---- Users ----
type User @cacheControl(maxAge: 60) {
  id: ID!
  email: String!
  displayName: String!
  avatarUrl: String
  organizationId: ID!
  organization: Organization!
  projectMemberships(first: Int = 20, after: String): ProjectMemberConnection!
  createdAt: DateTime!
}

# ---- Projects ----
type Project @cacheControl(maxAge: 30) {
  id: ID!
  name: String!
  description: String
  status: ProjectStatus!
  organizationId: ID!
  organization: Organization!
  members(first: Int = 50, after: String): ProjectMemberConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  ARCHIVED
}

type ProjectMember {
  user: User!
  project: Project!
  role: ProjectMemberRole!
  joinedAt: DateTime!
}

enum ProjectMemberRole {
  OWNER
  EDITOR
  VIEWER
}

# ---- Connections (Relay spec) ----
type ProjectConnection {
  edges: [ProjectEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProjectEdge {
  node: Project!
  cursor: String!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type ProjectMemberConnection {
  edges: [ProjectMemberEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProjectMemberEdge {
  node: ProjectMember!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# ---- Error unions ----
union CreateProjectResult = Project | ValidationError | OrganizationNotFoundError | ForbiddenError
union UpdateProjectStatusResult = Project | NotFoundError | ForbiddenError
union AddProjectMemberResult = ProjectMember | NotFoundError | ForbiddenError | AlreadyMemberError

type ValidationError { field: String!; message: String!; code: String! }
type OrganizationNotFoundError { organizationId: ID!; message: String! }
type NotFoundError { id: ID!; typeName: String!; message: String! }
type ForbiddenError { message: String!; requiredRole: String }
type AlreadyMemberError { userId: ID!; projectId: ID!; message: String! }

# ---- Subscription events ----
type ProjectStatusEvent {
  project: Project!
  previousStatus: ProjectStatus!
  newStatus: ProjectStatus!
  changedAt: DateTime!
}

# ---- Inputs ----
input CreateProjectInput {
  organizationId: ID!
  name: String!
  description: String
  initialStatus: ProjectStatus! = PLANNING
}
```

---

### Context Factory

```typescript
// src/graphql/context.ts
import DataLoader from 'dataloader';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { db } from '../db/pool';
import { verifyJWT } from '../auth/jwt';

export const pubsub = new RedisPubSub({
  connection: { host: process.env.REDIS_HOST, port: 6379 },
});

export async function createContext({ req }: { req: Request }) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token ? await verifyJWT(token) : null;

  return {
    user,                        // null if unauthenticated
    correlationId: req.headers['x-correlation-id'] ?? crypto.randomUUID(),
    pubsub,
    loaders: {
      organizationById: new DataLoader<string, Organization | null>(async (ids) => {
        const rows = await db.query('SELECT * FROM organizations WHERE id = ANY($1)', [[...ids]]);
        const map = new Map(rows.map((r) => [r.id, r]));
        return ids.map((id) => map.get(id) ?? null);
      }),
      userById: new DataLoader<string, User | null>(async (ids) => {
        const rows = await db.query('SELECT * FROM users WHERE id = ANY($1)', [[...ids]]);
        const map = new Map(rows.map((r) => [r.id, r]));
        return ids.map((id) => map.get(id) ?? null);
      }),
      projectById: new DataLoader<string, Project | null>(async (ids) => {
        const rows = await db.query('SELECT * FROM projects WHERE id = ANY($1)', [[...ids]]);
        const map = new Map(rows.map((r) => [r.id, r]));
        return ids.map((id) => map.get(id) ?? null);
      }),
      membersByProjectId: new DataLoader<string, ProjectMember[]>(async (projectIds) => {
        const rows = await db.query(
          `SELECT pm.*, u.* FROM project_members pm
           JOIN users u ON pm.user_id = u.id
           WHERE pm.project_id = ANY($1)`,
          [[...projectIds]]
        );
        const grouped = new Map<string, ProjectMember[]>();
        for (const row of rows) {
          const list = grouped.get(row.projectId) ?? [];
          list.push(row);
          grouped.set(row.projectId, list);
        }
        return projectIds.map((id) => grouped.get(id) ?? []);
      }),
    },
  };
}
```

---

### Authorization Shield Rules

```typescript
// src/graphql/permissions.ts
import { shield, rule, and } from 'graphql-shield';

const isAuthenticated = rule({ cache: 'contextual' })(
  (_, __, ctx) => ctx.user !== null || new Error('Unauthenticated')
);

const isOrgMember = rule({ cache: 'strict' })(
  async (parent, args, ctx) => {
    const orgId = args.organizationId ?? parent?.organizationId;
    if (!orgId) return new Error('Cannot determine organization');
    const member = await ctx.loaders.orgMemberByUserId.load(`${ctx.user.id}:${orgId}`);
    return member !== null || new Error('Not a member of this organization');
  }
);

const isProjectOwner = rule({ cache: 'strict' })(
  async (parent, args, ctx) => {
    const projectId = args.id ?? parent?.id;
    const membership = await ctx.loaders.projectMemberByUserAndProject
      .load(`${ctx.user.id}:${projectId}`);
    return membership?.role === 'OWNER' || new Error('Project owner role required');
  }
);

export const permissions = shield({
  Query: {
    me: isAuthenticated,
    organization: and(isAuthenticated, isOrgMember),
    project: and(isAuthenticated, isOrgMember),
    projects: and(isAuthenticated, isOrgMember),
  },
  Mutation: {
    createProject: and(isAuthenticated, isOrgMember),
    updateProjectStatus: and(isAuthenticated, isProjectOwner),
    addProjectMember: and(isAuthenticated, isProjectOwner),
  },
  Subscription: {
    projectStatusChanged: and(isAuthenticated, isOrgMember),
  },
});
```

---

### Server Configuration

```typescript
// src/graphql/server.ts
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-query-complexity';
import { responseCachePlugin } from '@apollo/server-plugin-response-cache';

const schema = applyMiddleware(
  makeExecutableSchema({ typeDefs, resolvers }),
  permissions
);

const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
  validationRules: [
    depthLimit(10),
    createComplexityLimitRule(800, {
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,
      introspectionListFactor: 2,
    }),
  ],
  plugins: [
    ApolloServerPluginCacheControl({ defaultMaxAge: 0 }),
    responseCachePlugin({
      // Scope project data to organization -- different orgs get different caches
      sessionId: (requestContext) =>
        requestContext.contextValue.user?.organizationId ?? null,
    }),
  ],
  formatError: (formattedError) => {
    const safeCode = formattedError.extensions?.code;
    const safeCodes = ['UNAUTHENTICATED', 'FORBIDDEN', 'BAD_USER_INPUT', 'NOT_FOUND'];
    if (process.env.NODE_ENV === 'production' && !safeCodes.includes(safeCode)) {
      return {
        message: 'Internal server error',
        extensions: { code: 'INTERNAL_ERROR', correlationId: formattedError.extensions?.correlationId },
      };
    }
    return formattedError;
  },
});
```

---

### Subscription Resolver

```typescript
// src/graphql/resolvers/subscription.ts
const PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED';

export const subscriptionResolvers = {
  Subscription: {
    projectStatusChanged: {
      subscribe: async (_, { organizationId }, ctx) => {
        // Auth already handled by Shield, but validate org membership again as defense-in-depth
        const channel = `${PROJECT_STATUS_CHANGED}:${organizationId}`;
        return ctx.pubsub.asyncIterator([channel]);
      },
      resolve: (payload: ProjectStatusChangedPayload) => payload,
    },
  },
};

// In the updateProjectStatus mutation, after successful DB update:
export async function publishProjectStatusChange(
  pubsub: RedisPubSub,
  project: Project,
  previousStatus: ProjectStatus
) {
  await pubsub.publish(`${PROJECT_STATUS_CHANGED}:${project.organizationId}`, {
    projectStatusChanged: {
      project,
      previousStatus,
      newStatus: project.status,
      changedAt: new Date().toISOString(),
    },
  });
}
```

---

### DataLoader Performance Verification

After deploying to staging, run this diagnostic query and check the PostgreSQL slow query log:

```graphql
query ProjectDashboard {
  projects(organizationId: "org_123", first: 20) {
    edges {
      node {
        id
        name
        status
        members(first: 10) {
          edges {
            node {
              user {
                id
                displayName
                avatarUrl
              }
              role
            }
          }
        }
        organization {
          id
          name
        }
      }
    }
  }
}
```

**Expected query count with DataLoaders working correctly:** 4 queries total
- 1 query for projects list
- 1 batched query for all project members (20 project IDs in one `ANY($1)`)
- 1 batched query for all users referenced by members
- 1 batched query for organization (all 20 projects share the same `organizationId`, DataLoader deduplicates to 1 key)

**If you see 40+ queries:** DataLoaders are not wired correctly. Check that `membersByProjectId` and `userById` loaders are being called from resolvers, not bypassed with direct DB calls.

---

### Operation Safety Checklist

| Check | Status | Notes |
|---|---|---|
| Introspection disabled in production | Required | Set `
