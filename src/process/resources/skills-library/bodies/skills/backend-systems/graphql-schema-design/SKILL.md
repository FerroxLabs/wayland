---
name: graphql-schema-design
description: |
  Guides expert-level graphql schema design implementation: api-design and design-patterns decision frameworks, production-ready patterns, and concrete templates for graphql schema design workflows.
  Use when the user asks about graphql schema design, graphql schema design configuration, or api-design best practices for graphql projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "api-design backend design-patterns"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# GraphQL Schema Design

## When to Use

**Use this skill when:**
- User is designing a new GraphQL API from scratch and needs schema structure guidance -- type definitions, query/mutation/subscription organization, and naming conventions
- User is migrating a REST API to GraphQL and needs to understand how to translate resource-based endpoints into a graph-based type system
- User is experiencing N+1 query problems, over-fetching, or under-fetching in an existing GraphQL schema and needs structural redesign
- User needs to model complex domain relationships -- bidirectional associations, polymorphic types, recursive structures, or union/interface hierarchies
- User is building a federated GraphQL architecture across multiple microservices and needs schema composition guidance
- User asks how to version or evolve a GraphQL schema without breaking existing clients
- User needs to design mutations with proper input types, error handling patterns, and optimistic UI support
- User is designing a schema for pagination, filtering, and sorting at scale and needs a consistent, extensible pattern

**Do NOT use this skill when:**
- User needs GraphQL resolver implementation guidance -- this skill covers schema structure, not resolver logic or DataLoader setup
- User needs GraphQL authentication/authorization middleware configuration -- check the backend-security skills
- User needs GraphQL client-side query writing or fragment composition -- this skill is server-schema design only
- User is asking about REST API design without GraphQL involvement -- check API design skills in the sibling subcategory
- User needs GraphQL subscription infrastructure setup (WebSocket servers, pub/sub brokers) -- that is an infrastructure concern beyond schema design
- User needs GraphQL performance monitoring, APM tooling, or query complexity analysis at runtime -- check observability skills
- User is asking about gRPC or OpenAPI/Swagger schema design -- separate skill domains

## Process

### 1. Identify the Domain Model and Access Patterns

Before writing a single type definition, map the domain thoroughly.

- List all core business entities and draw their relationships -- identify which are nodes in a graph (independent entities with identity) vs. value objects (embedded data without identity)
- Distinguish ownership relationships (a `Post` belongs to exactly one `User`) from association relationships (a `Post` has many `Tags` that exist independently)
- Catalog the top 10-15 read access patterns the UI actually needs -- screens, components, and dashboards drive schema shape more than the database schema does
- Catalog write operations grouped by actor, frequency, and atomicity requirements -- a single checkout mutation may span inventory, payment, and order creation
- Identify which entities are queried by ID most often vs. by collection with filtering -- entities queried by ID are candidates for the Node interface; filterable collections need pagination and filter input types
- Note cardinality: one-to-one, one-to-many, and many-to-many relationships have distinct modeling strategies in GraphQL
- Flag any data that is computed or derived (aggregates, calculated fields) -- these need special attention to avoid expensive resolver chains

### 2. Define the Type System Foundation

Establish scalar, enum, interface, and union types before building object types.

- Start with custom scalars for domain primitives: `DateTime` (ISO-8601 strings), `URL`, `EmailAddress`, `UUID`, `JSON`, `Decimal` (for currency/precise numbers) -- never use raw `String` for typed values the client will parse
- Define enums for all closed sets of values: `OrderStatus`, `UserRole`, `PaymentMethod` -- use SCREAMING_SNAKE_CASE for enum values per GraphQL spec convention
- Design interfaces for shared contracts across multiple types. The `Node` interface (`id: ID!`) is the single most important interface -- implement it on every top-level entity to enable generic caching and refetching in clients like Apollo and Relay
- Use the `Error` interface pattern to create a structured error type hierarchy: define a base `UserError` interface with `message: String!` and `code: String!`, then create domain-specific error types implementing it
- Define union types for truly polymorphic responses where types share no fields -- use `SearchResult = User | Post | Product` rather than a single `SearchResult` object with nullable fields
- Create `Connection` and `Edge` types following the Relay Cursor Connections specification -- even if not using Relay, this pattern provides a battle-tested pagination contract: `UserConnection`, `UserEdge`, `PageInfo`
- Establish `XxxInput` naming convention for all input types used in mutations -- never reuse output object types as mutation inputs because their field requirements differ

### 3. Design the Query Root

Structure the Query type to be discoverable, consistent, and client-friendly.

- Use singular/plural naming rigorously: `user(id: ID!): User` for single-entity lookup, `users(filter: UserFilterInput, pagination: PaginationInput): UserConnection!` for collection queries
- Never return nullable connections -- a collection query that finds zero results should return an empty connection, not null. Use `UserConnection!` not `UserConnection`
- Group related fields semantically and document them with triple-quoted SDL descriptions -- these appear in GraphQL Playground, GraphiQL, and schema documentation tools
- Implement the Node interface lookup at the root: `node(id: ID!): Node` enables clients to refetch any entity by global ID without knowing its type in advance
- Avoid deeply nested required arguments -- a query like `organizationUsersByRole(orgId: ID!, role: UserRole!, status: UserStatus)` should use a single filter input type
- Design filter input types to be additive: `UserFilterInput { id: ID, email: String, role: UserRole, status: UserStatus, createdAfter: DateTime }` -- all fields optional, combined with AND semantics by default
- Add `orderBy: [UserOrderByInput!]` as a separate argument from filtering -- this keeps filtering and sorting concerns independent and allows multiple sort keys
- Consider search vs. filter: full-text search (`query: String`) is a different pattern from structured filtering and should be a separate field or argument

### 4. Design Mutations

Mutations require the most careful design because they represent state changes with side effects.

- Follow the single-responsibility principle strictly: one mutation per logical operation. `createUser`, `updateUser`, `deleteUser` are separate mutations -- never a generic `mutateUser` operation
- Use namespaced mutation naming for large schemas: `userCreate`, `userUpdate`, `userDelete` groups all user mutations alphabetically in tooling. Alternatively use the `Mutation.user: UserMutations` nested object pattern (note: this breaks introspection-based tooling in some clients -- document the tradeoff)
- Every mutation takes exactly one input object argument: `createUser(input: CreateUserInput!): CreateUserPayload!` -- this is the most future-proof signature because new fields can be added to the input without changing the mutation signature
- Every mutation returns a payload type, never a raw object type: `CreateUserPayload { user: User, errors: [UserError!]! }` -- the payload wrapper allows adding fields like `clientMutationId` (Relay), warnings, and side-effect data without a breaking change
- Always include an `errors` field in the mutation payload -- use the union/interface error pattern so clients can distinguish between `ValidationError`, `AuthorizationError`, `NotFoundError`, and `ConflictError` with typed fields
- Design optimistic UI support: ensure the returned payload contains all fields the UI needs to update local state without a separate refetch -- if creating a post, return the full `Post` type with resolved author, category, and tag data
- Mark destructive mutations with a `DeleteXxxPayload { deletedId: ID!, success: Boolean! }` pattern -- returning the deleted ID enables cache eviction in Apollo Client and similar
- Use `upsert` mutations sparingly and only when the create-vs-update distinction is genuinely irrelevant to the caller -- document the idempotency semantics explicitly

### 5. Model Relationships and Connections

Graph relationships are the core value proposition of GraphQL -- design them carefully.

- Default to returning full nested objects rather than foreign key IDs -- `post { author { id name avatarUrl } }` is the GraphQL idiom; returning `authorId: ID!` defeats the purpose and forces the client to make additional queries
- For large one-to-many relationships (more than ~20 items), always paginate using cursor-based connections. Offset pagination (`skip`/`limit`) has correctness issues with real-time data and does not scale -- prefer opaque cursor strings
- The Relay Cursor Connection spec fields: `edges { node cursor } pageInfo { hasNextPage hasPreviousPage startCursor endCursor }` -- implement all four `pageInfo` fields even if bidirectional pagination is not immediately needed
- For many-to-many relationships with edge data (a `User` enrolled in a `Course` with an `enrolledAt` date and `progress` percentage), model the join as an explicit `Enrollment` type with its own connection
- Avoid circular reference problems by designing which side "owns" the traversal -- `User.posts` is fine; adding `Post.author.posts` in a single query should be handled by query depth limiting in the server, not prevented in schema design
- Use `@deprecated(reason: "Use newFieldName instead")` directive on old fields rather than removing them -- GraphQL's deprecation mechanism is the proper version evolution tool
- For highly connected data (social graphs, org hierarchies), add `depth` and `limit` arguments to recursive fields: `user { followers(depth: 2, limit: 100) { ... } }` to prevent unbounded traversal

### 6. Apply Naming Conventions and Documentation

Consistent naming is not cosmetic -- it determines how discoverable and maintainable the schema is.

- Types: PascalCase (`UserProfile`, `OrderLineItem`) -- never abbreviate unless the abbreviation is universal in the domain (`SKU`, `URL`, `ID` are fine; `Usr` and `Ord` are not)
- Fields: camelCase (`firstName`, `createdAt`, `isActive`) -- Boolean fields should use `is`, `has`, or `can` prefix: `isVerified`, `hasChildren`, `canEdit`
- Input types: `[Verb][Noun]Input` for mutations (`CreateOrderInput`, `UpdateUserProfileInput`), `[Noun]FilterInput` for queries (`ProductFilterInput`)
- Payload types: `[Verb][Noun]Payload` (`CreateOrderPayload`, `UpdateUserPayload`)
- Enum values: SCREAMING_SNAKE_CASE (`PENDING_REVIEW`, `OUT_OF_STOCK`)
- Connection types: `[Noun]Connection` and `[Noun]Edge` (`ProductConnection`, `ProductEdge`)
- Write SDL descriptions for every type, every field with non-obvious semantics, and every argument. Use the triple-quote format: `"""Returns the 10 most recent orders. Use the connection args for pagination beyond 10."""`
- Document nullability intent: if a field is nullable because it is genuinely optional vs. because it might fail to load vs. because it is computed async, note this in the description

### 7. Validate Schema Design Decisions

Before finalizing, run the schema through a validation checklist.

- Check for N+1 risk: any field that requires a database query per parent object is an N+1 risk. Identify these fields and ensure they are addressed in the resolver layer with DataLoader batching -- the schema design should not be changed to hide this, but the field should be documented
- Verify all mutations have error payloads and all queries have non-nullable connection returns
- Run the schema through a linter -- `graphql-schema-linter` enforces naming conventions, deprecation requirements, and description coverage automatically
- Check query depth -- define a maximum allowed query depth (typically 7-10 levels) and verify no legitimate client query requires more than this
- Simulate the top 5 client queries against the schema using a tool like `graphql-inspector` -- verify the field paths are intuitive and require no unnecessary traversal
- Validate that no input type has required fields that should be optional, and no output type has non-null fields that could realistically be absent
- Check for breaking changes before any schema deployment using `graphql-inspector diff` -- adding fields and types is non-breaking; removing fields, changing argument types, and changing nullability from nullable to non-null are all breaking

### 8. Document Schema Evolution Strategy

Schema design is not a one-time event -- establish the governance model upfront.

- Commit to semantic versioning via schema changelog, not URL versioning (`/graphql/v2`) -- GraphQL evolves gracefully through deprecation and field addition
- Establish a deprecation policy: deprecated fields must remain in the schema for a minimum of 30-90 days (set based on your release cadence and client deployment speed)
- Use the `@deprecated` directive immediately when introducing a replacement: `oldField: String @deprecated(reason: "Use newField which returns a typed object")` -- never remove first, deprecate first
- Set up `graphql-inspector` in CI to automatically block pull requests that introduce breaking changes to the public schema
- Maintain a schema changelog (SCHEMA_CHANGELOG.md) alongside the code with entries for every added type, added field, deprecated field, and reason for deprecation
- Consider schema contracts for large teams: use a schema registry (Apollo Schema Registry or open-source Hive) to track schema versions, validate composition in federated setups, and enforce review gates

## Output Format

```
## GraphQL Schema Design Review

### Domain Model Summary
- Core entities: [list with brief description]
- Key relationships: [entity → entity with cardinality]
- Primary access patterns: [top 5 queries driving design]
- Write operations: [top 5 mutations driving design]

### Schema Design Decisions

| Decision | Choice | Rationale | Trade-offs |
|----------|--------|-----------|------------|
| Pagination style | Cursor (Relay spec) / Offset | [reason] | [trade-off] |
| Error handling | Payload union / errors array | [reason] | [trade-off] |
| Nullability policy | Strict non-null / permissive | [reason] | [trade-off] |
| ID strategy | Global ID (Node) / local ID | [reason] | [trade-off] |
| Naming convention | Standard camelCase/PascalCase | [reason] | [trade-off] |

### Schema Structure

#### Custom Scalars
[List with justification for each non-standard scalar]

#### Interfaces
[List with the contract each interface enforces]

#### Type Definitions (SDL)

[Full SDL for all types, organized as:]
-- Scalars and Enums
-- Interfaces
-- Core object types (most important entities first)
-- Connection types
-- Input types (query filters, mutation inputs)
-- Payload types (mutation returns)
-- Query root
-- Mutation root

#### Relationship Map
[Diagram or table showing type → type traversal paths]

### Validation Results

| Check | Status | Notes |
|-------|--------|-------|
| Naming conventions | ✅ / ⚠️ / ❌ | [details] |
| All mutations have payload types | ✅ / ⚠️ / ❌ | [details] |
| All collections paginated | ✅ / ⚠️ / ❌ | [details] |
| N+1 risks documented | ✅ / ⚠️ / ❌ | [details] |
| Breaking change check | ✅ / ⚠️ / ❌ | [details] |
| Description coverage | ✅ / ⚠️ / ❌ | [details] |

### Evolution Notes
- Fields marked for deprecation: [list]
- Planned additions: [list]
- Breaking changes required (with migration plan): [list]
```

## Rules

1. **NEVER remove a field without first deprecating it for at least 30 days.** Field removal is a breaking change for all clients even if no client currently uses the field -- unknown clients, generated SDKs, and cached queries all depend on introspection stability. Use `@deprecated(reason: "...")` and remove only after confirming zero usage via query analytics.

2. **NEVER change a field from nullable to non-null without treating it as a breaking change.** Making a field non-null (`String` → `String!`) breaks any client that handles null values for that field. The reverse (non-null to nullable) is safe. When in doubt, start nullable and tighten later only after all clients are verified.

3. **ALWAYS put the `errors` field on every mutation payload.** A mutation that returns `createUser: User!` has no mechanism to communicate domain errors (email already taken, validation failure) without throwing GraphQL errors, which forces clients to parse error extensions. The `errors: [UserError!]!` field on a payload type is the correct pattern.

4. **NEVER use generic types as mutation inputs.** Reusing output types as input types (`createUser(user: User)`) breaks immediately when the output type adds computed fields, relations, or server-generated fields like `id` and `createdAt`. Always create dedicated `CreateUserInput`, `UpdateUserInput` types with exactly the fields the client should provide.

5. **ALWAYS paginate collections that could exceed 20-30 items in production.** A field returning `[Post!]!` with no pagination argument will eventually return thousands of objects, causing memory and latency problems on both server and client. The only exception is truly bounded collections (a user's 2FA recovery codes, a product's fixed set of images with a hard cap of 10).

6. **NEVER design around a specific client's current data shape.** Schema design based on "this is what the React component tree looks like today" creates a brittle, client-coupled schema that cannot serve mobile apps, partner integrations, or internal tooling. Design around the domain model; let clients compose what they need.

7. **ALWAYS implement the Node interface on top-level entities.** The `node(id: ID!): Node` root query with global IDs (base64-encoded `TypeName:localId`) is not just a Relay pattern -- it enables any client to efficiently refetch stale data, powers cache normalization in Apollo Client, and provides a universal entity lookup mechanism.

8. **NEVER put business logic in the schema design itself.** Schema defines structure and contracts, not computation rules. Avoid temptations like adding authorization flags directly as scalar fields (`canUserEdit: Boolean!` computed per-viewer) unless this is a deliberate, documented design choice -- these fields are expensive (one resolver call per object in a list) and couple the schema to viewer-specific state.

9. **ALWAYS distinguish between null-because-absent and null-because-failed.** A nullable field `thumbnailUrl: String` could mean "this product has no thumbnail" (intentional) or "the CDN URL resolver failed" (error). Use the `@semanticNonNull` pattern in documentation, or model the error case explicitly with a union type. Clients cannot distinguish these cases without schema-level clarity.

10. **NEVER add a field to the schema until you have a resolver implementation plan.** Underfetching is a client problem; an unresolvable field is a server contract violation. If a field is added to the schema but the resolver returns null due to unimplemented logic, clients build against a broken contract. Coordinate schema additions with resolver work, or gate new fields behind a feature flag in schema stitching.

## Edge Cases

### Migrating a REST API to GraphQL Incrementally

When wrapping existing REST endpoints in a GraphQL schema, resist the urge to mirror the REST resource structure 1:1. REST resources are organized around CRUD operations on individual entities; GraphQL schemas should be organized around how clients actually traverse the data graph. A REST endpoint `GET /users/{id}/orders?status=COMPLETED` becomes `user(id: ID!) { orders(filter: { status: COMPLETED }) { ... } }` -- the nesting reflects ownership, not endpoint hierarchy. Use schema stitching or a thin gateway layer so the GraphQL schema can evolve independently of the underlying REST endpoints. Start with read-only query types wrapping existing GET endpoints, then introduce mutations only once the query layer is stable.

### Polymorphic Types: Interface vs. Union

The choice between `interface` and `union` is often confused. Use an `interface` when the polymorphic types share a meaningful common contract that clients will query against -- `SearchResult` types that are all `Node` implementors with `id` and `title` fields should be an interface, because clients can write a fragment that applies to all of them. Use a `union` when the types are genuinely heterogeneous with no shared fields -- `PaymentMethod = CreditCard | BankTransfer | CryptoCurrency` should be a union because there is no meaningful shared contract. The practical test: if you find yourself adding shared fields to a union type, convert it to an interface. Inline fragments (`... on CreditCard { cardNumber lastFour }`) work identically on both.

### Multi-Tenancy and Viewer-Scoped Data

In multi-tenant SaaS applications, some data is global (product catalog, public user profiles) and some is viewer-scoped (the current user's orders, their organization's settings). Avoid adding `currentUser: User` fields directly on other types (`order { currentUserCanApprove: Boolean! }`) because this couples the schema to the authenticated context and makes the schema unusable for batch processing, admin tools, or unauthenticated access. Instead, put viewer-specific capabilities on a dedicated `viewer: Viewer` root query type that contains the authenticated user's context. The `Viewer` type holds `orders`, `permissions`, `organization` -- all scoped to the authenticated session -- while global types remain free of viewer context.

### Schema Federation Across Microservices

In Apollo Federation or schema stitching architectures, each subgraph owns a slice of the overall schema. The key design rules are: every entity that is referenced across subgraph boundaries must implement `@key` with a stable, queryable field (almost always the primary `id`); subgraphs should extend types only to add fields they own the data for; and no subgraph should extend a type just to add computed fields that belong in the consuming application layer. The main failure mode in federated schemas is ownership ambiguity -- two teams both adding fields to the `User` type without coordination causes type conflicts at composition time. Establish a schema ownership registry (a simple table in a wiki is sufficient for teams under 20) that maps each type and field to an owning team.

### Recursive and Hierarchical Data Structures

Organizational hierarchies, category trees, comment threads, and file systems are common recursive structures. Do not model these with unbounded recursive types (`Category { children: [Category!]! }`). Instead, add depth control arguments (`children(depth: Int = 1): [Category!]!`) and document the maximum supported depth. For very deep or very large trees (org charts with 10,000 nodes), consider a flattened list representation at the schema level (`organization { allDepartments: [Department!]! }` with `parentId` on each `Department`) and let the client reconstruct the tree -- this approach is more efficient for large datasets and avoids the query complexity explosion of deeply nested traversals.

### Schema Design for Real-Time Subscriptions

Subscriptions share the type system with queries and mutations, but their design requirements differ. A subscription payload should contain the minimum data needed to update the client's local state -- it should not be a full entity dump. Design subscription types to include the event type (`UserUpdatedEvent { eventType: UserEventType!, user: User!, changedFields: [String!]! }`), not just the current state. This allows clients to apply optimistic updates correctly and distinguish create/update/delete events. Never model a subscription to return a connection type -- subscriptions push individual events, not paginated collections. For filtered subscriptions (`onOrderUpdated(orderId: ID!)`), document the filter semantics precisely and limit the number of filterable dimensions to prevent server-side subscription fan-out.

### Large Schema Governance (50+ Types)

When a schema grows beyond 50 types, tooling and process become as important as design patterns. Split the SDL across multiple files organized by domain (user, product, order, payment) and merge them at build time. Use `graphql-schema-linter` with a configuration file that enforces description coverage (at least 80% of public fields documented), naming conventions, and deprecation format. Establish a schema review process: every PR that adds or modifies schema definitions requires review by the schema owner (typically a platform or API team member) in addition to code review. Track field usage with GraphQL observability tools to identify candidates for deprecation -- fields with zero usage over 90 days should be deprecated proactively.

## Example

**Input:** "We're building an e-commerce platform with a team of 8 engineers. We have Products with variants (size/color), a Cart and Checkout flow, Orders with line items, and User accounts with addresses. We need to support both a web storefront and a mobile app as clients. What should our GraphQL schema look like?"

**Output:**

## GraphQL Schema Design Review -- E-Commerce Platform

### Domain Model Summary
- **Core entities:** User, Product, ProductVariant, Cart, CartItem, Order, OrderLineItem, Address, Category
- **Key relationships:**
  - User → [Address] (one-to-many, user owns addresses)
  - User → [Order] (one-to-many, user owns orders)
  - User → Cart (one-to-one, user has one active cart)
  - Product → [ProductVariant] (one-to-many, bounded -- max ~50 variants per product)
  - Product → [Category] (many-to-many via ProductCategoryEdge)
  - Cart → [CartItem] (one-to-many, CartItem references ProductVariant)
  - Order → [OrderLineItem] (one-to-many, immutable snapshot of purchase)
- **Primary access patterns:**
  1. Product listing with filtering by category, price range, availability (paginated)
  2. Product detail page with all variants, images, and descriptions
  3. Cart retrieval with current prices and availability status
  4. Order history for authenticated user (paginated, filterable by status)
  5. Checkout flow: validate cart → create order → process payment
- **Write operations:**
  1. Add/update/remove cart items
  2. Create order from cart (checkout)
  3. Update user profile and addresses
  4. Apply discount codes to cart
  5. Cancel order (status transition)

### Schema Design Decisions

| Decision | Choice | Rationale | Trade-offs |
|----------|--------|-----------|------------|
| Pagination style | Cursor (Relay spec) | Product and order lists can be large; real-time inventory changes make offset pagination unreliable | Slightly more complex client code vs. offset |
| Error handling | Payload type with `errors: [UserError!]!` | Checkout and cart operations have rich domain errors (out of stock, invalid coupon) needing typed responses | Clients must check both `errors` and the entity field |
| Nullability policy | Strict non-null on reliable data; nullable on computed/external-dependent fields | Reduces client null-checking burden on core fields | Server must guarantee non-null fields -- requires careful resolver implementation |
| ID strategy | Global ID implementing Node interface | Both web and mobile clients use Apollo Client; global IDs enable cache normalization without configuration | Base64 encoding adds minor overhead; local IDs exposed via separate `legacyId` field for REST migration |
| Naming convention | Standard GraphQL conventions: camelCase fields, PascalCase types, SCREAMING_SNAKE_CASE enums | Consistent with client SDK generation tools and GraphQL community norms | No trade-off for new projects |

### Schema Structure

#### Custom Scalars

- `DateTime` -- ISO-8601 timestamp strings (`2024-03-15T10:30:00Z`); used on all `createdAt`, `updatedAt`, `expiresAt` fields
- `Decimal` -- Arbitrary-precision decimal as string (`"19.99"`); used for all monetary amounts to avoid floating-point errors
- `URL` -- Validated URL string; used for `imageUrl`, `thumbnailUrl` fields
- `JSON` -- Arbitrary JSON object; used for `ProductVariant.attributes` to handle the open-ended nature of variant attributes (size charts, material specs)

#### Interfaces

- `Node` -- `id: ID!`; implemented by User, Product, ProductVariant, Cart, Order, Address, Category -- enables `node(id: ID!)` root lookup and Apollo Client cache normalization
- `UserError` -- `message: String!, code: String!`; base for all domain errors returned in mutation payloads

#### Type Definitions (SDL)

```graphql
# ─── Scalars ────────────────────────────────────────────────────────────
scalar DateTime
scalar Decimal
scalar URL
scalar JSON

# ─── Enums ──────────────────────────────────────────────────────────────
enum OrderStatus {
  PENDING
  PAYMENT_PROCESSING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum CartItemStatus {
  AVAILABLE
  LOW_STOCK    # fewer than 5 units remaining
  OUT_OF_STOCK
  PRICE_CHANGED  # price changed since item was added
}

enum AddressType {
  SHIPPING
  BILLING
}

enum SortDirection {
  ASC
  DESC
}

enum ProductSortField {
  PRICE
  NAME
  CREATED_AT
  POPULARITY
}

# ─── Interfaces ──────────────────────────────────────────────────────────
interface Node {
  id: ID!
}

interface UserError {
  message: String!
  code: String!
}

# ─── Error Types ─────────────────────────────────────────────────────────
type ValidationError implements UserError {
  message: String!
  code: String!
  field: String!          # which input field caused the error
}

type NotFoundError implements UserError {
  message: String!
  code: String!
  entityType: String!
}

type OutOfStockError implements UserError {
  message: String!
  code: String!
  productVariant: ProductVariant!
  requestedQuantity: Int!
  availableQuantity: Int!
}

type InvalidCouponError implements UserError {
  message: String!
  code: String!
  couponCode: String!
}

# ─── Core Types ──────────────────────────────────────────────────────────
"""
A registered user account. Guests interact with Cart without a User.
"""
type User implements Node {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  """Computed display name combining firstName and lastName."""
  displayName: String!
  isEmailVerified: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  addresses(type: AddressType): [Address!]!
  defaultShippingAddress: Address
  orders(
    filter: OrderFilterInput
    first: Int
    after: String
    last: Int
    before: String
  ): OrderConnection!
}

type Address implements Node {
  id: ID!
  type: AddressType!
  firstName: String!
  lastName: String!
  line1: String!
  line2: String
  city: String!
  stateOrProvince: String!
  postalCode: String!
  country: String!   # ISO 3166-1 alpha-2
  isDefault: Boolean!
}

"""
A product in the catalog. All purchasable items are ProductVariants;
Product holds shared content and metadata.
"""
type Product implements Node {
  id: ID!
  name: String!
  slug: String!
  description: String!
  """Short description for listing cards, max 160 characters."""
  shortDescription: String!
  thumbnailUrl: URL
  imageUrls: [URL!]!
  categories: [Category!]!
  variants: [ProductVariant!]!
  """
  Returns the lowest price across all available variants.
  Null if all variants are out of stock.
  """
  minPrice: Decimal
  maxPrice: Decimal
  isAvailable: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

"""
A specific purchasable configuration of a Product (e.g., size=L, color=Red).
"""
type ProductVariant implements Node {
  id: ID!
  product: Product!
  sku: String!
  """
  Open-ended attribute map. Keys depend on product type: 
  e.g., {"size": "L", "color": "Red"} or {"material": "Cotton", "fit": "Slim"}.
  """
  attributes: JSON!
  """Human-readable variant label, e.g., 'Large / Red'."""
  label: String!
  price: Decimal!
  compareAtPrice: Decimal   # original price for sale display
  inventoryQuantity: Int!
  isAvailable: Boolean!
  imageUrl: URL
}

type Category implements Node {
  id: ID!
  name: String!
  slug: String!
  description: String
  parentCategory: Category
  """Direct children only. Use depth argument for subtree traversal."""
  childCategories(depth: Int = 1): [Category!]!
  products(
    filter: ProductFilterInput
    orderBy: ProductOrderByInput
    first: Int
    after: String
  ): ProductConnection!
}

"""
The current user's shopping cart. 
Anonymous carts are identified by a cartToken stored client-side.
"""
type Cart implements Node {
  id: ID!
  items: [CartItem!]!
  subtotal: Decimal!
  discountAmount: Decimal!
  estimatedTax: Decimal!
  estimatedTotal: Decimal!
  appliedCouponCode: String
  """
  Any items with status OUT_OF_STOCK or PRICE_CHANGED require 
  user acknowledgment before checkout can proceed.
  """
  hasIssues: Boolean!
  updatedAt: DateTime!
}

type CartItem implements Node {
  id: ID!
  productVariant: ProductVariant!
  quantity: Int!
  unitPrice: Decimal!        # price at time of adding to cart
  currentPrice: Decimal!     # current live price
  lineTotal: Decimal!        # quantity × currentPrice
  status: CartItemStatus!
}

"""
A completed or in-progress purchase. Line items are immutable snapshots.
"""
type Order implements Node {
  id: ID!
  orderNumber: String!       # human-readable, e.g., "ORD-20240315-4821"
  status: OrderStatus!
  lineItems: [OrderLineItem!]!
  shippingAddress: Address!
  billingAddress: Address!
  subtotal: Decimal!
  discountAmount: Decimal!
  taxAmount: Decimal!
  shippingAmount: Decimal!
  total: Decimal!
  appliedCouponCode: String
  """Null until order ships."""
  trackingNumber: String
  """Null until order ships."""
  estimatedDeliveryAt: DateTime
  placedAt: DateTime!
  updatedAt: DateTime!
}

"""
Immutable snapshot of a ProductVariant at purchase time.
Preserves price and product name even if the variant is later modified.
"""
type OrderLineItem implements Node {
  id: ID!
  """
  References the live ProductVariant. May be null if variant was deleted.
  Always use the snapshot fields (snapshotName, snapshotPrice) for display.
  """
  productVariant: ProductVariant
  snapshotName: String!      # "Blue Widget - Large / Red"
  snapshotSku: String!
  snapshotPrice: Decimal!
  quantity: Int!
  lineTotal: Decimal!
}

# ─── Connection Types (Relay Cursor spec) ───────────────────────────────
type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProductEdge {
  node: Product!
  cursor: String!
}

type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type OrderEdge {
  node: Order!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# ─── Input Types ─────────────────────────────────────────────────────────
input ProductFilterInput {
  categoryId: ID
  minPrice: Decimal
  maxPrice: Decimal
  isAvailable: Boolean
  searchQuery: String
}

input ProductOrderByInput {
  field: ProductSortField!
  direction: SortDirection!
}

input OrderFilterInput {
  status: OrderStatus
  placedAfter: DateTime
  placedBefore: DateTime
}

input AddCartItemInput {
  productVariantId: ID!
  quantity: Int!
}

input UpdateCartItemInput {
  cartItemId: ID!
  quantity: Int!   # set to 0 to remove
}

input ApplyCouponInput {
  cartId: ID!
  couponCode: String!
}

input CheckoutInput {
  cartId: ID!
  shippingAddressId: ID!
  billingAddressId: ID!
  """
  Client must confirm awareness of cart issues (out of stock, price changes)
  by setting this to true if Cart.hasIssues is true.
  """
  acknowledgeIssues: Boolean
}

input CreateAddressInput {
  type: AddressType!
  firstName: String!
  lastName: String!
  line1: String!
  line2: String
  city: String!
  stateOrProvince: String!
  postalCode: String!
  country: String!
  isDefault: Boolean
}

input UpdateUserProfileInput {
  firstName: String
  lastName: String
  email: String
}

# ─── Payload Types ───────────────────────────────────────────────────────
type AddCartItemPayload {
  cart: Cart
  cartItem: CartItem
  errors: [UserError!]!
}

type UpdateCartItemPayload {
  cart: Cart
  errors: [UserError!]!
}

type ApplyCouponPayload {
  cart: Cart
  errors: [UserError!]!
}

type CheckoutPayload {
  order: Order
  errors: [UserError!]!
}

type CreateAddressPayload {
  address: Address
  errors: [UserError!]!
}

type UpdateUserProfilePayload {
  user: User
  errors: [UserError!]!
}

type CancelOrderPayload {
  order: Order
  errors: [UserError!]!
}

# ─── Viewer Type (authenticated context) ─────────────────────────────────
"""
The authenticated user's session context. 
Use viewer-scoped queries instead of passing userId arguments.
"""
type Viewer {
  user: User!
  cart: Cart!
}

# ─── Query Root ──────────────────────────────────────────────────────────
type Query {
  """Fetch any entity by its global Node ID."""
  node(id: ID!): Node

  """The authenticated user's session. Returns null for unauthenticated requests."""
  viewer: Viewer

  product(id: ID!): Product
  productBySlug(slug: String!): Product

  products(
    filter: ProductFilterInput
    orderBy: ProductOrderByInput
    first: Int = 20
    after: String
  ): ProductConnection!

  category(id: ID!): Category
  categoryBySlug(slug: String!): Category

  """Top-level categories only. Use Category.childCategories for subtrees."""
  rootCategories: [Category!]!

  """
  Look up a cart by its opaque token. Used for anonymous/guest carts.
  Authenticated users should use viewer { cart } instead.
  """
  cart(token: String!): Cart
}

# ─── Mutation Root ────────────────────────────────────────────────────────
type Mutation {
  addCartItem(input: AddCartItemInput!): AddCartItemPayload!
  updateCartItem(input: UpdateCartItemInput!): UpdateCartItemPayload!
  applyCoupon(input: ApplyCouponInput!): ApplyCouponPayload!
  checkout(input: CheckoutInput!): CheckoutPayload!
  cancelOrder(orderId: ID!): CancelOrderPayload!

  createAddress(input: CreateAddressInput!): CreateAddressPayload!
  updateUserProfile(input: UpdateUserProfileInput!): UpdateUserProfilePayload!
}
```

#### Relationship Map

| From | Field | To | Cardinality | Paginated |
|------|-------|----|-------------|-----------|
| User | addresses | Address | 1→many | No (bounded by address book size ~10) |
| User | orders | OrderConnection | 1→many | Yes (cursor) |
| Viewer | cart | Cart | 1→1 | No |
| Product | variants | [ProductVariant] | 1→many | No (bounded ~50) |
| Product | categories | [Category] | many→many | No (bounded ~5 per product) |
| Category | products | ProductConnection | many→many | Yes (cursor) |
| Category | childCategories | [Category] | 1→many | No (depth argument limits scope) |
| Cart | items | [CartItem] | 1→many | No (bounded by cart max ~100 items) |
| CartItem | productVariant | ProductVariant | many→1 | No |
| Order | lineItems | [OrderLineItem] | 1→many | No (bounded at checkout time) |
| OrderLineItem | productVariant | ProductVariant | many→1 | No (nullable -- variant may be deleted) |

### Validation Results

| Check | Status | Notes |
|-------|--------|-------|
| Naming conventions | ✅ | All types PascalCase, fields camelCase, enums SCREAMING_SNAKE_CASE |
| All mutations have payload types | ✅ | All 7 mutations return `XxxPayload` with `errors: [UserError!]!` |
| All large collections paginated | ✅ | `products`, `category.products`, `user.orders` use cursor connections |
| Bounded collections not paginated | ✅ | `cart.items`, `order.lineItems`, `product.variants` are bounded by domain |
| N+1 risks documented | ⚠️ | `CartItem.productVariant`, `OrderLineItem.productVariant`, `Product.categories` all require DataLoader batching in resolvers |
| Node interface coverage | ✅ | User, Product, ProductVariant, Cart, CartItem, Order, OrderLineItem, Address, Category all implement Node |
| Breaking change baseline | ✅ | Initial schema -- establish as v0 baseline in schema registry before first deploy |
| Description coverage | ✅ | All types described; non-obvious fields have inline documentation |

### Evolution Notes
- **Planned additions (non-breaking):** `Product.reviews: ReviewConnection`, `Order.refunds: [Refund!]!`, `User.wishlist: ProductConnection!`
- **Known N+1 risks requiring DataLoader:** `CartItem.productVariant` (batched by variantId), `Product.categories` (batched by productId), `OrderLineItem.productVariant` (batched by variantId)
- **Future consideration:** When adding a loyalty/rewards system, add `User.rewardPoints: Int!` and `CheckoutInput.rewardPointsToApply: Int` -- the payload pattern means no breaking changes to the checkout mutation signature
- **Guest checkout:** The `cart(token: String!)` query supports anonymous carts now; when adding guest checkout (order without User), add `guestEmail: String` to `CheckoutInput` and make `Order.user: User` nullable -- this will be a **nullable-ization** (non-null → nullable), which is a safe non-breaking change
