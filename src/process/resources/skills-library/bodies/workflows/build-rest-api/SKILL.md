---
name: build-rest-api
description: |
  Orchestrates the process of designing, building, testing, and documenting a REST API from specification through production-ready documentation, chaining five software-development skills into a structured backend workflow.
  Use when the user needs to build a REST API from scratch with design-first methodology, database integration, test coverage, and documentation.
  Do NOT use for GraphQL APIs, internal scripts, frontend-only projects, or API gateway configuration without a custom backend.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "api-design backend database testing documentation step-by-step"
  category: "software-development"
  depends: "rest-api-design rest-api-implementation database-migration-patterns integration-testing-patterns api-versioning"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Build a REST API

**Estimated time:** 3-10 days (depending on endpoint count, database complexity, and test coverage depth)

This workflow chains five atomic skills into the complete process of building a production-quality REST API. Each step produces artifacts that feed directly into the next, creating a traceable path from API specification to versioned, documented, and tested endpoints. The workflow assumes you are building a custom backend service that exposes HTTP endpoints for consumption by frontends, mobile apps, or third-party integrators.

## When to Use

- User needs to build a REST API backend from design through documentation
- User wants a structured process that ensures API design precedes implementation
- User is creating a new service that other applications will consume via HTTP
- User needs to add a well-designed API layer to an existing application
- Do NOT use when: the user needs a GraphQL API (different design paradigm), is configuring an API gateway without custom backend logic, needs only a webhook receiver, or is building a CLI tool

## Prerequisites

Before starting this workflow, ensure:

1. **Business requirements are defined:** You know what resources the API exposes, who the consumers are (web frontend, mobile app, third-party), and the core operations each consumer needs
2. **Technology stack is selected:** You have chosen a backend language and framework (Node.js with Express, Python with FastAPI, Go with Gin, Ruby on Rails, Java with Spring, etc.)
3. **Database is chosen:** You know which database engine you will use (PostgreSQL, MySQL, MongoDB, etc.) and have access to a development instance
4. **Development environment is ready:** Local development setup is complete with the chosen language, framework, and database running locally or in containers

## Steps

**Step 1: Design the API Specification** (uses: rest-api-design)

Define the complete API contract before writing any implementation code. This design-first approach prevents the common failure mode of building endpoints ad-hoc and discovering inconsistencies during integration. The specification becomes the single source of truth for every subsequent step.

- Input: Business requirements, resource list, consumer needs, authentication requirements
- Output: API specification document with: resource definitions, endpoint paths (using RESTful naming conventions), HTTP methods per endpoint, request and response schemas with data types, status codes per operation, pagination strategy, filtering and sorting parameters, error response format
- Key focus: Consistency across the entire API surface. Every resource follows the same naming pattern, every list endpoint uses the same pagination format, every error response has the same structure. Define the envelope format (direct response vs. wrapped with metadata) once and apply it everywhere. Document query parameters for filtering, sorting, and field selection at this stage -- not during implementation.
- Quality gate: The specification is complete when an implementer can build any endpoint without asking a design question. If any request format, response field, or error code requires a judgment call during implementation, the specification has a gap.

**Step 2: Implement the API Endpoints** (uses: rest-api-implementation)

Translate the API specification from Step 1 into working code. Each endpoint is implemented to match the specification exactly -- same paths, same request validation, same response shapes, same status codes. Deviations from the specification are bugs, not features.

- Input: API specification from Step 1, chosen framework, database connection configuration
- Output: Working API server with all endpoints implemented, request validation middleware, response serialization, error handling middleware, database queries for each resource operation
- Key focus: Implement validation for every request body and query parameter defined in the specification. Return 400 with a descriptive error when validation fails -- never let invalid data reach the database layer. Implement correct HTTP status codes: 201 for creation, 204 for deletion, 404 when a resource does not exist, 409 for conflict (duplicate unique constraint). Handle database errors gracefully -- a database connection failure returns 503, not 500 with a stack trace.

**Step 3: Design and Apply Database Migrations** (uses: database-migration-patterns)

Create the database schema that supports the API resources defined in Step 1 and implemented in Step 2. Migrations are versioned, reversible scripts that evolve the database schema alongside the application code. This step ensures the database structure matches the API contract.

- Input: Resource definitions from Step 1, data relationships identified during Step 2 implementation, performance requirements (which queries need to be fast)
- Output: Migration files that create tables, indexes, constraints, and seed data; a migration strategy document specifying the order of application, rollback procedures, and data seeding approach for development and staging environments
- Key focus: Every foreign key relationship must have a corresponding index. Every column that appears in a WHERE clause in Step 2's queries must be indexed. Define NOT NULL constraints for required fields identified in the API specification. Use database-level constraints (unique, check, foreign key) as a safety net below application-level validation. Write reversible migrations -- every UP migration has a corresponding DOWN migration that cleanly undoes it.

**Step 4: Write Integration Tests** (uses: integration-testing-patterns)

Test the API endpoints against a real (or realistic) database to verify that the implementation matches the specification. Integration tests exercise the full request-response cycle: HTTP request goes in, database is queried or modified, HTTP response comes out. These tests catch the bugs that unit tests miss -- serialization errors, database constraint violations, middleware ordering issues.

- Input: API specification from Step 1 (expected behavior), implemented endpoints from Step 2, database schema from Step 3, test database instance
- Output: Integration test suite covering: happy-path tests for every endpoint (correct input produces correct output), validation tests (invalid input returns the documented error), edge case tests (empty collections, maximum pagination, boundary values), authentication and authorization tests (protected endpoints reject unauthenticated requests)
- Key focus: Test the API as a consumer would use it -- send HTTP requests and verify HTTP responses. Do not test internal implementation details. Each test should be independent: create its own test data, run the request, verify the response, and clean up. Use a test database that is reset between test runs (transaction rollback or database recreation). Target at least one happy-path test and one error test per endpoint.
- Coverage target: Every endpoint has at minimum a success test, a validation failure test, and an authorization test. List endpoints additionally test pagination boundaries (first page, last page, empty result set) and filter combinations.

**Step 5: Version and Document the API** (uses: api-versioning)

Create documentation that enables consumers to integrate with the API without reading the source code, and establish a versioning strategy that allows the API to evolve without breaking existing consumers. This step synthesizes all prior outputs into the consumer-facing deliverable.

- Input: API specification from Step 1, implementation details from Step 2 (any deviations from spec), test examples from Step 4 (realistic request/response pairs)
- Output: API documentation with: endpoint reference (path, method, parameters, request body, response body, status codes), authentication guide, pagination guide, error handling guide, rate limiting information, versioning policy, example requests and responses for every endpoint, changelog
- Key focus: Use the integration test request/response pairs from Step 4 as documentation examples -- they are guaranteed to be accurate because they are tested. Document the versioning strategy: URL path versioning (recommended for most APIs), header versioning, or query parameter versioning. Define the deprecation policy: how much notice consumers get before an endpoint is removed, how deprecated endpoints are marked in responses (Deprecation header), and how long deprecated endpoints remain functional.

## Decision Points

- **Before Step 1:** If the consumer needs **real-time data** (live updates, streaming), consider whether REST is the right choice. REST with polling works for update frequencies of 30 seconds or longer. For sub-second updates, add a WebSocket or Server-Sent Events layer alongside the REST API (REST for CRUD, WebSocket for live updates).

- **At Step 1:** If the API has **more than 20 resources** or deeply nested relationships, evaluate whether a single monolithic API is the right scope. If resources naturally cluster into bounded contexts with minimal cross-references, consider splitting into separate services at the design stage. If resources are heavily interconnected, keep the monolith and design clear module boundaries within the single API.

- **At Step 2:** If the chosen framework does not have built-in **request validation** (e.g., raw Express.js without middleware), add a validation library before implementing endpoints. Unvalidated inputs are the most common source of API bugs and security vulnerabilities.

- **At Step 3:** If you are adding an API to an **existing database**, skip the migration creation portion and focus on documenting the current schema. Create migrations only for new tables, columns, or indexes that the API requires. Never modify existing columns used by other applications without coordinating with those application owners.

- **After Step 4:** If integration tests reveal **API contract inconsistencies** (the implementation behaves differently from the specification), return to Step 1 and update the specification. The specification is the source of truth. Either fix the implementation to match the specification, or update the specification to reflect a deliberate design change. Never leave the specification and implementation out of sync.

## Failure Handling

- **Step 1 specification is too vague to implement:** If during Step 2 you find yourself making design decisions that should have been in the specification (response field names, error codes, pagination format), stop implementing and return to Step 1. Add the missing details to the specification. The specification is insufficiently detailed if an implementer must guess at any request or response format.

- **Step 2 implementation diverges from specification:** If you discover during implementation that a specified design is impractical (e.g., the specified endpoint structure creates an N+1 query problem), update the specification first, then change the implementation. Document why the specification was changed. Do not silently deviate.

- **Step 3 migration fails on staging or production:** If a migration that works locally fails on staging (different data, different database version, concurrent access), do not force-apply it. Diagnose the difference between environments, fix the migration script, and re-test locally before retrying. Common causes: migration assumes empty tables (staging has data), migration uses database-version-specific syntax, migration takes a lock that conflicts with running queries.

- **Step 4 tests fail intermittently:** Intermittent test failures (flaky tests) are almost always caused by: test data leaking between tests (shared database state), time-dependent assertions (comparing timestamps without tolerance), or external service dependencies (tests hitting real third-party APIs). Fix the root cause -- do not ignore or retry flaky tests.

- **User wants to change API scope mid-workflow:** If new requirements emerge during implementation, do not add endpoints ad-hoc. Return to Step 1, update the specification with the new requirements, then proceed through Steps 2-5 for the new endpoints. The specification must always reflect the current API surface.

## Edge Cases

- **API with file uploads:** If endpoints accept file uploads (images, documents, CSV imports), the API specification in Step 1 must define maximum file size, accepted MIME types, and whether upload is direct (multipart form data to the API) or indirect (pre-signed URL to object storage). File upload endpoints need different timeout and body size limits than standard JSON endpoints.

- **API consumed by multiple client types with different needs:** If the same API serves a web frontend (needs nested objects for fewer requests) and a mobile app (needs flat objects for bandwidth efficiency), design a single representation and use sparse fieldsets (fields query parameter) or separate mobile-specific endpoints. Do not create two complete API surfaces for different clients.

- **Backward-incompatible schema change after launch:** If Step 3 migration needs to rename or remove a column that existing API consumers depend on, use a multi-phase migration: (1) add new column, (2) backfill data, (3) update API to use new column, (4) remove old column in a subsequent release. Never remove a column in the same release that changes the API response format.

- **API with long-running operations:** If any operation takes more than 10 seconds (report generation, bulk import, data export), do not make the client wait. Return 202 Accepted with a status URL, process the operation asynchronously, and let the client poll the status URL for completion. Define the status response format in Step 1.

- **Zero-downtime API versioning:** When introducing a breaking change (removed field, changed response structure), maintain the old version alongside the new version for a defined deprecation period. Document the overlap duration, migration guide for consumers, and sunset timeline in Step 5.

- **API with rate limiting and abuse prevention:** If the API is public-facing or serves third-party integrators, add rate limiting configuration in Step 2 implementation. Define limits per authentication level (unauthenticated: 10 requests per minute, authenticated: 100 per minute, premium: 1,000 per minute). Return 429 Too Many Requests with a Retry-After header. Document rate limits in Step 5 so consumers can build backoff logic. Consider adding request quotas (daily or monthly limits) for API key-based access.

- **API with webhook delivery:** If the API needs to notify external systems of events (order created, payment processed, user signed up), design the webhook system in Step 1 (event types, payload format, retry policy), implement a delivery queue in Step 2 (background worker with exponential backoff, maximum 5 retries over 24 hours), and document the webhook payload format and verification signature in Step 5. Webhook endpoints should be idempotent -- consumers may receive the same event multiple times due to retries.

- **Migrating from a legacy API:** If replacing an existing API with a new implementation, run both versions in parallel during a migration window. Step 1 should document which legacy endpoints are replaced, which are unchanged, and which are new. Step 5's versioning strategy must include a migration guide that maps old endpoints to new endpoints with request/response translation examples.

- **API with soft-delete requirements:** If business rules require that deleted resources remain queryable (audit trails, regulatory compliance, undo functionality), design the soft-delete pattern in Step 1 (deleted_at timestamp column, query filters that exclude soft-deleted records by default), implement it in Step 2 (DELETE endpoint sets deleted_at instead of removing the row, GET endpoints filter by deleted_at IS NULL unless include_deleted=true query parameter is provided), add the deleted_at index in Step 3, and test both deletion and recovery in Step 4.

- **API serving both internal and external consumers:** If the same API serves internal microservices and external third-party developers, separate the authentication in Step 1 (internal: service-to-service mTLS or shared secret, external: API key or OAuth). Rate limits, logging verbosity, and error detail levels should differ between internal and external consumers. Internal consumers receive detailed error messages for debugging; external consumers receive sanitized errors that do not leak implementation details.

- **High-write API with eventual consistency needs:** If the API handles high write volumes (event ingestion, logging, IoT telemetry), the synchronous request-response pattern may not scale. Design an async write path in Step 1 (accept the write, return 202 Accepted, process asynchronously), implement the queue-based pattern in Step 2, and ensure Step 4 tests verify that the async processing completes within the documented SLA.

- **API with multi-tenancy requirements:** If the API serves multiple organizations whose data must be isolated, decide the tenancy model in Step 1: shared database with tenant_id on every table (simplest, best for most cases), schema-per-tenant (moderate isolation, PostgreSQL supports this well), or database-per-tenant (maximum isolation, highest operational cost). In Step 2, add tenant-scoping middleware that injects tenant_id into every database query. In Step 3, create migrations that add tenant_id columns with NOT NULL constraints and composite indexes. In Step 4, write cross-tenant isolation tests that verify one tenant's request never returns another tenant's data.

- **API requiring idempotency for mutation endpoints:** If consumers may retry requests (network timeouts, load balancer retries), mutation endpoints (POST, PUT, PATCH) should support idempotency keys. Design the idempotency pattern in Step 1 (Idempotency-Key header, stored results for duplicate detection), implement a response cache keyed by the idempotency key in Step 2, and test duplicate request handling in Step 4 (same key returns same response without re-executing the operation).

- **API with search and full-text query requirements:** If the API needs search functionality beyond simple column filters (product search, document search, fuzzy matching), evaluate whether the primary database supports adequate full-text search (PostgreSQL's tsvector, MySQL's FULLTEXT) or whether a dedicated search engine (Elasticsearch, Meilisearch, Typesense) is needed. Design the search endpoint in Step 1 with query syntax, faceting, and result highlighting. If using a separate search engine, Step 3 must include the indexing pipeline that keeps the search index synchronized with the primary database. Step 4 tests should verify search relevance with representative queries, not just that the endpoint returns results.

## Expected Outcome

When this workflow is complete, the user will have:

1. A complete API specification that serves as the single source of truth for all endpoints, request/response formats, and error handling
2. A working API server with all endpoints implemented, validated against the specification, with consistent error handling and correct HTTP status codes
3. A versioned database schema with reversible migrations, proper indexes, and constraints that enforce data integrity below the application layer
4. An integration test suite that exercises every endpoint through the full HTTP request-response cycle, catching serialization, validation, and authorization bugs
5. Consumer-facing API documentation with endpoint reference, authentication guide, pagination guide, versioning policy, and verified request/response examples taken directly from passing tests
6. A versioning strategy and deprecation policy that allows the API to evolve without breaking existing consumers
7. Confidence that any developer can integrate with the API using only the documentation, without needing to read the source code or ask the backend team questions

## Output Format

The workflow produces these artifacts at each step, with later steps referencing earlier outputs:

```
project-root/
  docs/
    api-specification.md     # Step 1: Complete API contract
    migration-strategy.md    # Step 3: Database migration approach
    api-reference/           # Step 5: Consumer-facing documentation
      endpoints.md           # Endpoint reference with examples
      authentication.md      # Auth guide
      versioning.md          # Versioning policy and changelog
  src/
    routes/                  # Step 2: Route handlers per resource
    middleware/               # Step 2: Validation, auth, error handling
    models/                  # Step 2: Database models
    migrations/              # Step 3: Versioned migration files
  tests/
    integration/             # Step 4: Integration test suites per resource
    fixtures/                # Step 4: Test data factories
  package.json / pyproject.toml / go.mod  # Dependencies
```

## Example

**Scenario:** "Build a REST API for a task management application with users, projects, and tasks."

**Input:** Requirements: user registration and authentication, project CRUD scoped to authenticated users, task CRUD within projects with status tracking (todo, in-progress, done), task assignment to team members. Technology: Python with FastAPI, PostgreSQL database. Consumers: React web frontend and future React Native mobile app.

**Output:** Production-ready REST API with 12 endpoints, integration test suite, versioned database schema, and consumer-facing documentation.

**Step 1 (rest-api-design):**
Design the API specification. Resources: users (registration + login), projects (CRUD scoped to authenticated user), tasks (CRUD within project, with status transitions: todo, in-progress, done, assignee field). Endpoints: POST /v1/users (register), POST /v1/sessions (login), GET/POST /v1/projects, GET/PATCH/DELETE /v1/projects/:id, GET/POST /v1/projects/:id/tasks, GET/PATCH/DELETE /v1/tasks/:id. Pagination: cursor-based with 20 items per page default, max 100. Error format: JSON with error_code (string), message (human-readable), details (array of field-level errors). Authentication: Bearer token in Authorization header, 401 for missing or expired token.

**Step 2 (rest-api-implementation):**
Implement all endpoints with Pydantic request validation. POST /v1/projects validates: name (required, 1-100 characters), description (optional, max 500 characters). GET /v1/projects/:id/tasks supports query parameters: status (enum filter), assignee_id (UUID filter), sort (created_at or due_date), order (asc or desc). All database queries use parameterized statements via SQLAlchemy. Error handling middleware catches ValidationError (400), AuthenticationError (401), NotFoundError (404), and DatabaseError (503) with consistent JSON responses.

**Step 3 (database-migration-patterns):**
Create migrations: users table (id UUID, email unique, password_hash, name, created_at, updated_at), projects table (id UUID, name, description, owner_id FK users, created_at, updated_at), tasks table (id UUID, title, description, status enum, project_id FK projects, assignee_id FK users nullable, due_date nullable, created_at, updated_at). Indexes: tasks by project_id, tasks by assignee_id, tasks by (project_id, status), users by email. Seed script creates a test user and sample project for development environments.

**Step 4 (integration-testing-patterns):**
Write tests using httpx test client against a test database: create user and verify 201 response with user object (no password_hash in response). Create project, then GET /v1/projects and verify the project appears in the list. Create task within project, PATCH task status from todo to in-progress, verify status change persists on subsequent GET. Attempt to GET another user's project and verify 404 (not 403, to avoid leaking resource existence). POST task with invalid status value "cancelled" and verify 400 with field-level error detail pointing to the status field. Total: 35 integration tests covering all 12 endpoints.

**Step 5 (api-versioning):**
Generate API documentation from the specification with verified test examples as request/response samples. URL-based versioning at /v1/ prefix. Deprecation policy: 6-month notice with Sunset header on deprecated endpoints. Documentation includes: quick start guide (register, log in, create a project, create a task in 4 API calls), authentication section with token refresh flow, pagination section with cursor examples, and endpoint reference with request/response examples copied directly from passing integration tests.

**Result:** A production-ready task management API with 12 endpoints, 35 integration tests, versioned database schema with 3 migration files, and consumer documentation that a frontend developer can follow to integrate without backend team support.
