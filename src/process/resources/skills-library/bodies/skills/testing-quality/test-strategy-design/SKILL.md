---
name: test-strategy-design
description: |
  Guides expert-level test strategy design implementation: architecture and best-practices decision frameworks, production-ready patterns, and concrete templates for test strategy design workflows.
  Use when the user asks about test strategy design, test strategy design configuration, or testing best practices for test projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing architecture best-practices"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Test Strategy Design

## When to Use

**Use this skill when:**
- A user is starting a new project and needs to decide which test types to invest in, at what proportions, and using which tools
- A user has an existing test suite that is slow, flaky, or providing low confidence and needs a structural overhaul
- A user asks how to balance unit, integration, end-to-end, contract, performance, or security tests for a specific architecture (microservices, monolith, event-driven, etc.)
- A user needs to define testing standards across a team or organization, including naming conventions, coverage targets, CI gating rules, and ownership boundaries
- A user is migrating from one testing approach to another (e.g., heavy end-to-end suites to a pyramid model, or from manual QA gates to shift-left automated testing)
- A user needs to define test strategy for a specific system type: REST API, GraphQL service, frontend SPA, mobile app, data pipeline, machine learning model, or embedded system
- A user asks about test coverage targets, mutation testing thresholds, or how to measure test suite quality
- A user wants to implement risk-based testing -- prioritizing test effort proportional to business risk, change frequency, and failure impact

**Do NOT use this skill when:**
- The user needs help writing a specific unit test or debugging a failing test -- use the test-writing or test-debugging skills instead
- The user needs guidance on a specific testing framework configuration (Jest, pytest, Cypress setup) -- use the framework-specific skill
- The user is asking about load testing tool selection or performance benchmarking design -- use the performance-testing skill
- The user needs accessibility testing (WCAG compliance, screen reader testing) -- use the accessibility-testing skill
- The user is asking about security penetration testing or SAST/DAST toolchain setup -- use the security-testing skill
- The user needs QA process design (bug triage workflows, release gates, defect SLAs) -- use the qa-process skill

---

## Process

### 1. Establish System Context and Risk Profile

Before recommending any test approach, characterize the system fully:

- **Identify the architecture pattern:** monolith, microservices, event-driven, serverless, data pipeline, frontend SPA, mobile, or hybrid. Each has dramatically different testing gravity centers -- microservices demand contract testing; event-driven systems require message/event verification; SPAs require real browser DOM testing.
- **Map the failure cost matrix:** For each major system component, classify failures as (a) data loss or corruption, (b) security breach, (c) revenue loss, (d) degraded UX, or (e) operational noise. High-cost failures require higher test fidelity and coverage depth.
- **Assess change velocity:** Components touched weekly need faster feedback loops (unit-heavy, sub-5-minute CI) than components touched monthly (where broader integration coverage is acceptable with slower runs).
- **Identify external dependencies:** Third-party APIs, databases, queues, auth providers, payment processors. Each external dependency is a contract that must be tested at its boundary, not through live calls in most test types.
- **Determine team size and structure:** Teams under 5 engineers should favor pragmatic pyramid approaches with minimal tooling overhead. Teams above 20 often need explicit ownership boundaries and parallelized test execution infrastructure.

### 2. Choose a Test Distribution Model

Select the distribution model that fits the architecture and risk profile -- do not default to the classic pyramid without evaluating fit:

- **Testing Pyramid (70/20/10 rule):** 70% unit, 20% integration, 10% end-to-end. Best for: backend services with clear domain logic, libraries, CLI tools, data transformation pipelines. Gives fast feedback, high isolation, easy debugging. Fails when the value is in integration behavior (e.g., database query correctness, API contract adherence).
- **Testing Trophy (Kent C. Dodds model):** Heavy emphasis on integration tests with a moderate unit layer and a small E2E layer. Best for: React/frontend applications, full-stack JavaScript, REST APIs where database and HTTP layer correctness matters more than isolated function behavior. Integration tests here mean "render a component with real state management" or "test the HTTP handler with a real database transaction."
- **Testing Honeycomb (Spotify model):** Unit tests are minimal; the bulk is integration tests at the service boundary; E2E tests cover only critical user journeys. Best for: microservices architectures where business logic is thin in individual services and value is in service collaboration.
- **Contract-First Testing:** Used alongside any of the above when multiple services consume shared APIs. Pact or OpenAPI schema validation becomes a first-class layer.
- **Risk-Based Testing:** Allocate test depth proportional to a component's risk score: `Risk Score = (Probability of Failure) × (Business Impact) × (Change Frequency)`. Score each component 1--5 on each dimension. Components scoring above 30 get full coverage; 15--30 get targeted coverage; below 15 get smoke tests only.

### 3. Define Test Layers and Boundaries

For each layer, define precisely what it covers, what it does NOT cover, and what makes a test belong to that layer:

- **Unit tests:** Test a single function, class, or module in complete isolation. All I/O (database, network, filesystem, time, random) is replaced with deterministic fakes or stubs. Execution time per test: under 10ms. Suite execution time: under 60 seconds total for most codebases. Coverage target: 80--90% for domain logic modules; 60--70% for infrastructure/glue code.
- **Integration tests:** Test the interaction between two or more real components. The database connection is real (use a test database or ephemeral container); the HTTP client is real; but external third-party services are stubbed at the network layer (WireMock, msw, VCR cassettes). Execution time per test: under 500ms. Suite execution time: under 10 minutes.
- **Contract tests (consumer-driven):** Verify that the interface between two services matches the agreed contract. Consumer defines expectations using Pact or similar; provider verifies against those expectations in CI. Run on every PR that touches an API boundary. Execution time: under 2 minutes.
- **End-to-end tests:** Drive the application through a real browser or API client against a deployed environment with all dependencies running. Cover only the highest-value user journeys -- login, checkout, core CRUD, critical dashboards. Target 10--20 scenarios maximum. Execution time: under 15 minutes total. Flakiness tolerance: zero -- any flaky E2E test is immediately quarantined.
- **Component tests (for microservices):** A middle layer that tests a single service in isolation using containerized dependencies (real database, real cache) but with all external service calls mocked. More valuable than unit tests for thin services, more reliable than E2E.

### 4. Define Coverage Targets and Quality Gates

Coverage numbers alone are meaningless -- define them by layer and by module type:

- **Domain/business logic:** 85% line coverage minimum; 70% branch coverage minimum; mutation score above 60% (use Stryker for JS/TS, PIT for Java, mutmut for Python).
- **API handlers/controllers:** 80% line coverage; every HTTP status code path tested; every validation error path tested.
- **Infrastructure/adapters:** 70% line coverage; focus on error paths (connection failure, timeout, malformed response).
- **UI components:** 80% render coverage with React Testing Library or equivalent; all user interaction paths (click, submit, keyboard navigation) tested.
- **Utility/helper functions:** 90%+ -- these are easiest to test exhaustively and regressions here are silent and painful.
- **Generated code:** Exempt from coverage requirements -- generated code should not inflate or deflate metrics.
- **CI gate configuration:** Block PRs when coverage drops more than 2% below baseline. Do not require 100% coverage -- this incentivizes trivial tests and discourages refactoring.

### 5. Design the Test Execution Architecture

The strategy is only as good as its execution infrastructure:

- **Local developer loop:** Unit and integration tests must run in under 2 minutes locally. Provide a `make test-unit` and `make test-integration` target or equivalent. Developers must be able to run the full relevant suite before pushing.
- **Pre-commit hooks:** Run linting, type checking, and the fastest unit tests (under 30 seconds) via pre-commit or Husky. Never run slow integration tests pre-commit -- this kills developer velocity.
- **CI pipeline stages:** Structure as: (1) lint + type check (2--3 min), (2) unit tests (3--5 min), (3) integration tests with service containers (5--10 min), (4) contract tests (2 min), (5) E2E tests on deployed preview environment (10--15 min). Stages 1--3 run in parallel where possible.
- **Test parallelization:** Split test files across workers using Jest `--runInBand` disabled, pytest-xdist `-n auto`, or Go's native parallel execution. For integration tests, use isolated database schemas or transactions that roll back after each test -- never share mutable state between parallel test workers.
- **Test result reporting:** Publish JUnit XML or equivalent to CI for trend analysis. Track flakiness rate per test (any test failing more than 2% of runs on green code is flaky and must be fixed or quarantined). Use test impact analysis (Nx affected, Jest `--onlyChanged`) to run only tests affected by changed files on feature branches.
- **Environment parity:** Integration tests must run against the same database engine version (PostgreSQL 15, not SQLite) and message broker as production. Use Docker Compose or Testcontainers for ephemeral infrastructure. Never test against a shared staging database.

### 6. Define Test Data Management Strategy

Poor test data management is the most common cause of flaky, unreliable test suites:

- **Unit tests:** All data is inline in the test file. No shared fixtures. Each test constructs exactly the data it needs to prove its assertion. Use builder patterns or factory functions (FactoryBot in Ruby, factory-boy in Python, fishery in JS) to construct test objects with sensible defaults and minimal required overrides.
- **Integration tests:** Use database seeders or fixture loaders that run before each test suite and roll back via transactions. Each test must be independent -- never rely on data created by a previous test in the same suite.
- **E2E tests:** Use API seeding endpoints or database seeds to set up known state before each scenario. Never scrape or reuse state from a previous test run. Maintain a set of dedicated test accounts (e.g., `test-buyer@example.com`, `test-admin@example.com`) with deterministic initial state.
- **Sensitive data:** Never use production data in tests. Generate realistic but fake data with Faker libraries. For regulated industries, document that test data does not contain PII.
- **Data volume:** Most integration tests should use minimal data (1--5 records) to stay fast. Performance tests use data volume calibrated to production scale. Never run performance tests against a nearly-empty database -- query plans differ significantly with small vs. large tables.

### 7. Establish Test Ownership and Maintenance Culture

A test strategy that nobody maintains is worse than no strategy:

- **Ownership model:** Every test file has a clear owner (team, squad, individual). In monorepos, use CODEOWNERS files to route review requests automatically. Flaky tests owned by the author's team, not a separate QA team.
- **Test review standards:** In code review, check that: (1) new features have tests at the appropriate layer, (2) tests assert behavior not implementation (avoid testing private methods, avoid `toHaveBeenCalledWith` when you can assert the outcome instead), (3) test descriptions are human-readable ("should reject login with invalid credentials" not "test case 3"), (4) no test has more than one logical assertion per test case (single-concept tests).
- **Flakiness budget:** Define a maximum allowed flakiness rate (recommended: 2% of CI runs). Above this threshold, the team stops and fixes flaky tests before merging new features. Flaky tests erode trust faster than any other quality issue.
- **Test debt tracking:** Add `// TODO(test): needs integration test` comments and track them in the backlog. Do not let untested paths accumulate silently.
- **Quarterly test health reviews:** Every quarter, review: coverage trends, suite execution time trends, flakiness rates, and whether the test distribution still matches the architecture. Architectures evolve; test strategies must evolve with them.

### 8. Document the Strategy as an ADR and Living Spec

The test strategy must be written down, versioned, and accessible:

- **Write a Testing Strategy ADR** (Architecture Decision Record) capturing: the distribution model chosen, the rationale, the coverage targets, the CI gate configuration, and the test data approach.
- **Create a `TESTING.md`** file at the repository root (or in `docs/`) with: how to run each test type locally, how to add a new test, what goes in each layer, and how to handle flaky tests.
- **Link from onboarding docs:** New engineers must read the test strategy in their first week. This is non-negotiable for sustaining quality culture.
- **Record deviations:** When a team deviates from the strategy (e.g., skipping integration tests for a hotfix), document why in the PR description. This prevents strategy drift from becoming invisible.

---

## Output Format

```markdown
## Test Strategy Design: [Project/Service Name]

### System Context
- **Architecture:** [monolith | microservices | event-driven | serverless | SPA | data pipeline]
- **Team Size:** [N engineers]
- **Deployment Target:** [cloud/on-prem/edge]
- **Primary Language/Framework:** [e.g., Node.js/Express, Python/FastAPI, Java/Spring Boot]
- **Key External Dependencies:** [list of databases, queues, third-party APIs]
- **Risk Profile:** [High / Medium / Low] -- [brief justification]

---

### Test Distribution Model
**Recommended Model:** [Pyramid | Trophy | Honeycomb | Contract-First | Risk-Based]
**Rationale:** [2--3 sentences explaining why this model fits the architecture and risk profile]

| Test Layer         | Target % of Test Suite | Execution Target | Coverage Target        |
|--------------------|------------------------|------------------|------------------------|
| Unit               | [X]%                   | < [N] seconds    | [N]% lines, [N]% branch|
| Integration        | [X]%                   | < [N] minutes    | [N]% API paths         |
| Contract           | [X]%                   | < 2 minutes      | All service boundaries |
| End-to-End         | [X]%                   | < 15 minutes     | [N] critical journeys  |
| Component/Service  | [X]%                   | < [N] minutes    | [as applicable]        |

---

### Test Layer Definitions

**Unit Tests**
- Scope: [what is tested in isolation]
- Tooling: [framework, assertion library, mock library]
- Mocking boundary: [what is always faked vs. always real]
- File naming convention: `[convention]`
- Location: `[path pattern]`

**Integration Tests**
- Scope: [what real components are wired together]
- Tooling: [framework + container approach]
- Database: [real engine, ephemeral via Testcontainers / Docker Compose]
- External services: [stubbed via WireMock / msw / VCR]
- File naming convention: `[convention]`
- Location: `[path pattern]`

**Contract Tests**
- Scope: [which service pairs have contracts]
- Tooling: [Pact / OpenAPI schema validation / other]
- Broker: [Pact Broker URL / CI artifact]
- Consumer teams: [list]
- Provider teams: [list]

**End-to-End Tests**
- Scope: [critical user journeys covered]
- Tooling: [Playwright / Cypress / Selenium + framework]
- Environment: [preview / staging / production-like]
- Test data approach: [seed via API / database seed script]
- Flakiness tolerance: zero -- quarantine on first failure

---

### Quality Gates

| Gate                        | Threshold                          | Action on Failure       |
|-----------------------------|------------------------------------|-------------------------|
| Line coverage (domain)      | >= [N]%                            | Block PR merge          |
| Line coverage (overall)     | No drop > 2% from baseline         | Block PR merge          |
| Mutation score              | >= [N]%                            | Warning / Block         |
| Unit test suite time        | < [N] seconds                      | Alert team              |
| Integration test suite time | < [N] minutes                      | Alert team              |
| E2E suite time              | < 15 minutes                       | Alert team              |
| Flakiness rate              | < 2% of CI runs per test           | Quarantine test         |

---

### CI Pipeline Structure

```
Stage 1 (parallel): lint | type-check | format-check        [target: < 3 min]
Stage 2:            unit tests                               [target: < 5 min]
Stage 3:            integration tests (with containers)      [target: < 10 min]
Stage 4:            contract tests                           [target: < 2 min]
Stage 5:            E2E tests (on deployed preview env)      [target: < 15 min]
```

---

### Test Data Strategy

| Layer       | Data Source           | Isolation Approach          | Sensitive Data Handling |
|-------------|-----------------------|-----------------------------|-------------------------|
| Unit        | Inline / factories    | N/A (no I/O)                | N/A                     |
| Integration | Seeds + rollback      | Transaction rollback per test| Faker-generated only    |
| E2E         | API seed / DB seed    | Dedicated test accounts     | Faker-generated only    |

---

### Tooling Decisions

| Tool Category       | Selected Tool         | Rationale                          |
|---------------------|-----------------------|------------------------------------|
| Unit test runner    | [tool]                | [why]                              |
| Integration runner  | [tool]                | [why]                              |
| Mocking/stubbing    | [tool]                | [why]                              |
| Contract testing    | [tool]                | [why]                              |
| E2E framework       | [tool]                | [why]                              |
| Coverage reporting  | [tool]                | [why]                              |
| Mutation testing    | [tool]                | [why]                              |
| Container runner    | [Testcontainers/Docker Compose] | [why]             |

---

### Ownership and Maintenance

- **Test file ownership:** [CODEOWNERS / team assignment approach]
- **Flaky test policy:** [quarantine process, SLA to fix]
- **Coverage regression policy:** [PR blocking rule]
- **Quarterly review cadence:** [who reviews, what metrics]
- **Onboarding:** [`TESTING.md` location, link in onboarding checklist]

---

### Open Risks and Gaps

| Risk / Gap                  | Severity | Mitigation Plan             | Owner   |
|-----------------------------|----------|-----------------------------|---------|
| [e.g., No contract tests]   | High     | [Implement Pact by Q3]      | [Team]  |
| [e.g., E2E suite > 20 min]  | Medium   | [Parallelize across 3 workers]| [Team] |
```

---

## Rules

1. **Never use line coverage as the sole quality metric.** Line coverage measures whether code was executed, not whether it was correctly verified. Always pair coverage targets with mutation testing scores and branch coverage. A test that calls a function but makes no assertion can achieve 100% line coverage and catch nothing.

2. **Never test implementation details.** Tests that assert private method calls, internal state, or framework internals break on every refactor and provide no regression protection. Always test observable behavior: return values, side effects, state changes visible through the public interface.

3. **Never share mutable state between tests.** Any test that depends on the order of execution is a flaky test waiting to be discovered in CI. Each test must set up and tear down its own state. Use `beforeEach`/`afterEach` for setup; use transaction rollbacks for database tests; use fresh container instances or schema isolation for long-running suites.

4. **Never stub what you own; always stub what you do not own.** Internal collaborators (your own classes and modules) should be wired together in integration tests. External dependencies (third-party APIs, payment processors, email providers) should be stubbed at the network boundary in all tests except dedicated contract/end-to-end tests.

5. **Never run E2E tests against a shared staging database.** Shared state in staging causes non-deterministic test outcomes, data pollution, and cascading failures. Always use isolated test accounts, ephemeral environments, or snapshot/restore mechanisms. A flaky E2E suite caused by state contamination is one of the hardest debugging problems in software testing.

6. **Never set a blanket 100% coverage target.** It forces engineers to write trivial tests for getters, constructors, and generated code. It discourages deleting dead code. It teaches coverage theater instead of meaningful testing. Set graduated targets by module type as specified in the coverage section.

7. **Never allow a flaky test to persist beyond two CI cycles without quarantine.** A single consistently-flaky test trains engineers to ignore CI failures, which is the path to broken builds becoming normalized. The moment a test is identified as flaky: (a) quarantine it by moving it to a known-flaky suite that does not block merges, (b) file a bug with the highest priority, (c) fix within one sprint.

8. **Always calibrate the test pyramid to the architecture, not to convention.** A microservice with no domain logic (a thin API gateway or a CRUD adapter) should have almost no unit tests and heavy component/integration tests. Applying a 70% unit test target to such a service produces tests that mock everything and verify nothing real.

9. **Always test error paths at every layer.** The happy path is tested by definition (the feature works or it would not have shipped). The error paths -- connection timeouts, malformed input, authorization failures, downstream service degradation -- are what catch regressions that cause incidents. Every integration test suite should have at least as many error-path tests as happy-path tests.

10. **Always define the test boundary before writing the first test.** "What is real and what is fake in this test?" is the most important question to answer before writing any test code. Undefined boundaries produce inconsistent test suites where some tests mock the database and others do not, making coverage metrics meaningless and execution times unpredictable.

---

## Edge Cases

### Legacy Codebase With No Tests (or Less Than 20% Coverage)
Do not attempt to retroactively achieve the target coverage through a "testing sprint." This approach produces low-quality tests written without context and rarely provides value. Instead: (1) freeze coverage at current baseline and add the CI gate preventing further drops, (2) require tests for all new code from day one, (3) add characterization tests (Golden Master tests) to critical untested paths before touching them for refactoring, (4) use mutation testing on the existing test suite to identify which tests provide zero protection -- delete them and rewrite with intent, (5) expect 6--12 months to reach a healthy coverage level through organic growth.

### Microservices With Many Teams (10+ Services)
Contract testing becomes mandatory, not optional. Without it, integration failures discovered only in E2E or production tests generate expensive debugging cycles across team boundaries. Establish a Pact Broker (self-hosted or cloud) as shared infrastructure. Define a contract versioning policy: consumers must not break provider contracts without a coordinated release. Add contract verification to every provider's CI pipeline -- a failed contract check blocks the provider's deployment. Assign a platform team to own the broker and the contract testing standards.

### Greenfield Project Under Extreme Time Pressure
The instinct is to skip tests entirely. The correct decision is to invest 20% of the timeline in testing with a strict prioritization: (1) integration tests for external API boundaries (these catch the most expensive runtime failures), (2) unit tests for domain logic with business rules (these catch the most logic regressions during rapid feature iteration), (3) a single smoke E2E test covering the critical user journey. Defer: unit tests for CRUD adapters, full E2E coverage, mutation testing. Set a calendar reminder to revisit in 6 weeks -- greenfield pressure becomes technical debt faster than any other project type.

### Highly Asynchronous / Event-Driven Systems
Standard synchronous test patterns do not apply. Events published to a queue cannot be asserted with a simple return value check. Strategies: (1) use in-process event buses for unit tests (publish an event, assert the handler ran synchronously), (2) use Testcontainers with a real Kafka or RabbitMQ instance for integration tests with polling assertions and timeouts (assert that within 5 seconds, the consumer processed the event), (3) never use `Thread.sleep()` or arbitrary waits -- use polling with exponential backoff up to a timeout, (4) test idempotency explicitly -- publish the same event twice and assert the system produces the same outcome, (5) test out-of-order delivery if the system is expected to handle it.

### Machine Learning / Data Pipeline Systems
Traditional coverage metrics are largely irrelevant for data transformation pipelines and ML inference code. Instead: (1) define property-based tests (using Hypothesis for Python or fast-check for JavaScript) that verify output invariants hold across thousands of generated inputs (e.g., "the output score is always between 0 and 1," "no null values appear in the output dataset"), (2) implement data quality assertions using Great Expectations or dbt tests on pipeline outputs, (3) use snapshot tests for model output on a fixed validation dataset -- assert that the output does not change unexpectedly after a code change, (4) define a regression threshold: if model accuracy on the held-out test set drops more than 0.5%, block the deployment.

### Frontend Single-Page Applications With Complex State
Avoid shallow rendering tests that test the React/Vue/Angular framework itself rather than your application. Use integration-level component tests (React Testing Library, Vue Test Utils in composition mode) that render full component trees with real state management (Redux, Zustand, Pinia) wired in, interact via user events (click, type, submit), and assert DOM outcomes. Reserve unit tests for pure utility functions and reducers. Use Storybook as a visual regression test mechanism combined with Chromatic or Percy for automated visual diffing. Cover routing, authentication guards, and data fetching error states explicitly -- these are the most commonly regressed paths in SPAs.

### Regulated Industry (Finance, Healthcare, Government)
Test strategy decisions must be documented with audit trails. Required additions: (1) each test must have a traceable ID linking to the requirement or user story it validates (often enforced via test tagging: `@requirement:REQ-1042`), (2) test execution reports must be immutable and stored for the required retention period (often 7 years in finance, HIPAA in healthcare), (3) test environment configuration must be version-controlled and reproducible -- auditors may require demonstrating that the same tests ran in the same environment, (4) all test data generation must be documented to contain no real PII, (5) coverage and passing rates must be formally signed off by a QA lead before production deployment, not just a green CI badge.

---

## Example

**Input:** "We're building a Node.js/TypeScript e-commerce API with about 8 backend engineers. The system has a PostgreSQL database, a Redis cache, a Stripe payment integration, a SendGrid email integration, and an internal inventory microservice we own. We're deploying to AWS. What test strategy should we use?"

**Output:**

## Test Strategy Design: E-Commerce Node.js API

### System Context
- **Architecture:** Microservice (API gateway + business logic service + internal inventory service)
- **Team Size:** 8 engineers
- **Deployment Target:** AWS (ECS or Lambda, RDS PostgreSQL, ElastiCache Redis)
- **Primary Language/Framework:** Node.js / TypeScript / Express (or Fastify)
- **Key External Dependencies:** PostgreSQL 15, Redis 7, Stripe API, SendGrid API, internal Inventory Service (gRPC or REST)
- **Risk Profile:** High -- payment processing and order data loss have direct revenue and legal impact

---

### Test Distribution Model
**Recommended Model:** Testing Trophy (with Contract layer)

**Rationale:** The system's value is concentrated in the interaction between HTTP handlers, domain logic, PostgreSQL transactions, and the Stripe integration -- not in isolated functions. Integration tests at the HTTP handler level with a real database provide the highest confidence-to-cost ratio. A contract layer is mandatory because the inventory service is internally owned and evolves independently.

| Test Layer         | Target % of Test Suite | Execution Target | Coverage Target                     |
|--------------------|------------------------|------------------|-------------------------------------|
| Unit               | 20%                    | < 45 seconds     | 90% lines on domain/business logic  |
| Integration        | 55%                    | < 8 minutes      | All HTTP routes, all DB operations  |
| Contract           | 10%                    | < 2 minutes      | Inventory service boundary          |
| End-to-End         | 15%                    | < 12 minutes     | 8 critical user journeys            |

---

### Test Layer Definitions

**Unit Tests**
- **Scope:** Order total calculation logic, discount/promo engine, tax calculation rules, input validation schemas (Zod), business rule functions (e.g., `canFulfillOrder`, `applyRefundPolicy`)
- **Tooling:** Vitest (faster than Jest for TypeScript), `@vitest/coverage-v8` for coverage
- **Mocking boundary:** All I/O is mocked (no database, no Redis, no HTTP calls in unit tests). Use `vi.fn()` for collaborators.
- **File naming:** `*.unit.test.ts` co-located with source
- **Location:** `src/**/*.unit.test.ts`

**Integration Tests**
- **Scope:** HTTP route handlers tested end-to-end through Express routing middleware, request validation, business logic, database writes, and response serialization. Redis cache behavior. Email triggered after order creation. All error paths (404, 422, 500).
- **Tooling:** Vitest + Supertest for HTTP layer; Testcontainers (`@testcontainers/postgresql`, `@testcontainers/redis`) for ephemeral real infrastructure
- **Database:** PostgreSQL 15 via Testcontainers -- same version as production. Each test wraps in a transaction that rolls back in `afterEach`.
- **External services:** Stripe stubbed via WireMock or `nock`. SendGrid stubbed via `nock`. Inventory service stubbed via WireMock.
- **File naming:** `*.integration.test.ts`
- **Location:** `src/**/*.integration.test.ts` or `tests/integration/`

**Contract Tests**
- **Scope:** This API (consumer) and the Inventory Service (provider)
- **Tooling:** Pact (PactJS v12)
- **Broker:** Self-hosted Pact Broker on AWS ECS, or PactFlow SaaS
- **Consumer team:** E-commerce API team owns consumer contracts
- **Provider team:** Inventory Service team verifies contracts on every PR
- **Contract:** `GET /inventory/{sku}` response shape, `POST /inventory/reserve` request/response shape and error codes

**End-to-End Tests**
- **Scope (8 critical journeys):**
  1. Guest user adds product to cart, checks out with Stripe test card, receives confirmation email
  2. Registered user login, cart persistence, checkout
  3. Out-of-stock product is correctly blocked at checkout
  4. Stripe payment failure returns user to checkout with error message
  5. Admin creates a new product and it appears in the catalog
  6. Admin applies a discount code; price is reduced correctly
  7. Order refund flow
  8. User account password reset
- **Tooling:** Playwright with TypeScript; run against a preview environment deployed to AWS ECS with real PostgreSQL and Redis but Stripe in test mode
- **Test data:** API seeding endpoint (`POST /test/seed`) available only when `NODE_ENV=test`. Dedicated Stripe test customer IDs. Dedicated test email domain intercepted by Mailhog in the preview environment.
- **Flakiness tolerance:** Zero. Any E2E test failing 2 consecutive CI runs is quarantined within 24 hours.

---

### Quality Gates

| Gate                         | Threshold                         | Action on Failure             |
|------------------------------|-----------------------------------|-------------------------------|
| Line coverage (domain logic) | >= 88%                            | Block PR merge                |
| Line coverage (overall)      | No drop > 2% from baseline        | Block PR merge                |
| Mutation score (domain)      | >= 65%                            | Warning -- must address in sprint|
| Unit test suite time         | < 45 seconds                      | Alert in Slack #eng-quality   |
| Integration test suite time  | < 8 minutes                       | Alert in Slack #eng-quality   |
| E2E suite time               | < 12 minutes                      | Alert in Slack #eng-quality   |
| Flakiness rate per test      | < 2% of CI runs                   | Quarantine and P1 bug filed   |
| Contract verification        | 100% pass                         | Block provider deployment     |

---

### CI Pipeline Structure

```
Stage 1 (parallel): ESLint | tsc --noEmit | Prettier check       [target: < 2 min]
Stage 2:            Unit tests (Vitest)                           [target: < 1 min]
Stage 3:            Integration tests (Testcontainers)            [target: < 8 min]
Stage 4:            Contract tests (Pact)                         [target: < 2 min]
Stage 5:            Deploy to preview env (AWS ECS)               [target: < 5 min]
Stage 6:            E2E tests (Playwright vs. preview env)        [target: < 12 min]
```

Stages 1--4 run on every PR. Stage 5--6 run on PRs to `main` and on the `main` branch after merge.

---

### Test Data Strategy

| Layer       | Data Source                       | Isolation Approach                  | Sensitive Data  |
|-------------|-----------------------------------|-------------------------------------|-----------------|
| Unit        | Inline literals + factory helpers | N/A                                 | N/A             |
| Integration | `createTestOrder()` factory + DB transaction rollback | `afterEach` rolls back transaction | Faker.js only   |
| Contract    | Pact-defined fixed payloads       | N/A (no DB)                         | N/A             |
| E2E         | `POST /test/seed` API endpoint    | Dedicated test Stripe customer; isolated DB schema per run | Faker.js + Stripe test tokens |

---

### Tooling Decisions

| Tool Category       | Selected Tool                       | Rationale                                              |
|---------------------|-------------------------------------|--------------------------------------------------------|
| Unit + Integration runner | Vitest                        | Native TypeScript, 3x faster than Jest, compatible API |
| HTTP testing        | Supertest                           | Industry standard for Express/Fastify HTTP layer tests |
| Mocking/stubbing    | Vitest `vi.fn()` + nock             | nock intercepts HTTP at node level -- no code changes  |
| Contract testing    | PactJS v12                          | Mature, widely adopted, supports async messaging       |
| E2E framework       | Playwright                          | Faster and more reliable than Cypress for CI; multi-browser|
| Container runner    | Testcontainers for Node.js          | Programmatic, no Docker Compose file management needed |
| Coverage            | `@vitest/coverage-v8`               | V8 native, accurate branch coverage for TypeScript     |
| Mutation testing    | Stryker Mutator (JS/TS)             | Best mutation testing toolchain for the TypeScript ecosystem|

---

### Ownership and Maintenance

- **Test file ownership:** CODEOWNERS in repo root assigns `src/orders/` to `@team/orders`, `src/payments/` to `@team/payments`, etc. Test files are co-located with source and inherit the same ownership.
- **Flaky test policy:** First occurrence -- add `@flaky` tag and quarantine to non-blocking suite within 24 hours. Fix within the current sprint. If not fixed in one sprint, delete the test and file a story to rewrite from scratch.
- **Coverage regression:** Automated comment on PR if coverage drops more than 1% from baseline. Merge block at 2% drop. No exceptions without a documented reason in the PR description.
- **Quarterly review:** Engineering lead reviews: (a) suite execution time trend, (b) flakiness rate per test file, (c) mutation score trend, (d) whether E2E journey coverage still matches critical paths. Output: a brief `TEST-HEALTH-[YYYY-Q#].md` document committed to the repo.
- **Onboarding:** `docs/TESTING.md` linked from `README.md` and the onboarding Notion page. All new engineers run `make test-all` locally on day 1.

---

### Open Risks and Gaps

| Risk / Gap                                          | Severity | Mitigation Plan                                              | Owner          |
|-----------------------------------------------------|----------|--------------------------------------------------------------|----------------|
| No mutation testing yet -- coverage may be overstated | High   | Introduce Stryker in sprint 4, set 65% target in sprint 5   | Tech Lead      |
| E2E email verification relies on Mailhog -- not production-like | Medium | Acceptable for now; revisit if email rendering bugs increase | QA Lead   |
| Inventory service contract not yet formalized       | High     | Schedule contract design session with Inventory team this sprint | API Team Lead |
| Stripe webhook handling not covered by integration tests | High  | Add integration tests for webhook handler in sprint 3        | Payments Team  |
