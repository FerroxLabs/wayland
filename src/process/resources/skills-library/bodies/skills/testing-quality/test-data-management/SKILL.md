---
name: test-data-management
description: |
  Guides expert-level test data management implementation: automation and database decision frameworks, production-ready patterns, and concrete templates for test data management workflows.
  Use when the user asks about test data management, test data management configuration, or testing best practices for test projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing automation database"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Test Data Management

## When to Use

**Use this skill when:**
- User asks how to generate, seed, or manage test data for unit, integration, or end-to-end tests
- User wants to avoid brittle tests caused by hardcoded IDs, stale fixture files, or shared mutable state between tests
- User needs to decide between factory-based generation, fixture files, anonymized production snapshots, or synthetic data synthesis for a specific project
- User is dealing with referential integrity problems when setting up relational database test state (foreign keys, cascades, join tables)
- User wants to implement database isolation strategies so parallel test runs do not corrupt each other's state
- User is building a CI/CD pipeline and needs test data that is fast to create, deterministic, and teardown-safe
- User needs to handle PII or sensitive data from production in a test environment without violating GDPR, HIPAA, or SOC 2 requirements
- User wants to implement contract or consumer-driven test data sharing across microservices
- User asks about test data versioning, migration alignment, or keeping fixtures in sync with schema changes

**Do NOT use this skill when:**
- User needs help writing assertions or choosing a test framework -- see the test-writing or test-framework-selection skills
- User is asking about performance/load test data volume generation at scale (tens of millions of rows) -- that requires load-testing-specific tooling guidance
- User wants to mock HTTP APIs or external service responses -- see the service-mocking or API-contract-testing skills
- User needs help with production database migrations -- see the database-migration skill
- User is asking about observability or test reporting -- see the test-reporting skill
- User wants general CI/CD pipeline configuration unrelated to data setup -- see the CI/CD pipeline skill

---

## Process

### 1. Audit the Current Test Data Situation

Before recommending any pattern, understand what the team is dealing with now.

- Ask: Are tests currently sharing a single persistent database instance, using per-test transactions, or spinning up ephemeral databases per run?
- Identify whether test failures are correlated -- if test A passes alone but fails when run after test B, the team has shared mutable state and test ordering bugs, which is the #1 test data smell.
- Identify the data model complexity: count the number of tables with foreign key dependencies, the presence of polymorphic associations, and whether there are any circular references.
- Ask about schema change frequency. Teams running migrations weekly or more need data builders that are schema-aware, not static JSON fixture files that silently break.
- Ask about test suite runtime. If the full suite runs in under 2 minutes, transactional rollback isolation is likely sufficient. If it runs over 10 minutes, the team may benefit from parallel execution with schema-per-tenant or database-per-worker isolation.
- Identify the technology stack: the right approach for a Django project differs from a Node.js + Prisma project, a Spring Boot + Hibernate project, or a Go project with sqlx.

### 2. Choose an Isolation Strategy

Isolation strategy determines how one test's data changes cannot affect another test's data. Choose based on runtime constraints and database features.

- **Transactional rollback isolation** (recommended for most single-threaded suites): Begin a transaction before each test, run all database operations within it, roll back unconditionally at teardown. Requires the database driver to expose transaction wrapping to test hooks. Works in PostgreSQL, MySQL 5.7+, SQL Server. Does NOT work when the code under test issues its own COMMIT, uses DDL statements inside transactions, or calls stored procedures that auto-commit. Average overhead per test: 0.5--2ms.
- **Schema-per-worker isolation** (recommended for parallel test execution): Each worker process gets a dedicated schema (PostgreSQL) or database (MySQL). After all tests in a worker finish, truncate all tables or drop and recreate the schema. Tools like `jest-environment-database` and pytest-xdist with fixture scoping support this. Schema isolation supports parallelism without coordination overhead. Setup cost per worker: 50--500ms depending on migration complexity.
- **Snapshot/restore isolation** (recommended for integration tests with heavy seed data): Create a known-good database snapshot after applying all migrations and reference data. Before each test class or module, restore from snapshot. PostgreSQL supports this with `pg_dump`/`pg_restore` on small datasets (under 50MB: under 2 seconds). Docker volume snapshots work for any engine. Best for tests that require large amounts of reference data that is expensive to rebuild from factories.
- **In-memory database substitution** (fast but limited fidelity): SQLite in-memory for tests, PostgreSQL in production. Acceptable for pure unit tests of data access logic but dangerous for integration tests -- SQLite does not enforce foreign keys by default, does not support window functions, lateral joins, or many PostgreSQL-specific features. If your production code uses any database-specific SQL, this strategy will produce false confidence.
- **Container-per-run isolation** (recommended for CI environments): Use Docker Compose or Testcontainers to spin up a fresh database instance per test run or per worker. Testcontainers is available for Java, Go, .NET, Node.js, Python, and Rust. A fresh PostgreSQL 15 container starts in 3--8 seconds on a modern CI runner. This eliminates all shared state at the cost of startup time.

### 3. Choose a Data Creation Strategy

Data creation strategy determines how test-specific records are produced. These strategies compose -- most mature test suites use more than one.

- **Object Factories / Builder Pattern**: A factory defines defaults for every field of a domain object and allows selective overrides per test. This is the preferred strategy for unit and integration tests. Key principle: a factory should be able to create a valid object with zero arguments. Libraries: factory_boy (Python), FactoryBot (Ruby), Fishery or `@anatine/zod-mock` (TypeScript/JavaScript), go-factory (Go), java-faker + custom builders (Java). Factories must stay in sync with schema changes -- enforce this by having factory field definitions validated against the ORM model at test suite startup.
- **Fixture files** (JSON, YAML, SQL): Static files defining a known dataset. Appropriate for reference data that changes rarely (country codes, status enums, permission sets). Inappropriate as the primary mechanism for test-specific data because they are hard to maintain, create hidden coupling between tests, and do not express which fields are relevant to a given test. Never load fixture files in individual unit tests -- reserve them for shared reference data loaded once per suite.
- **Anonymized production snapshots**: A scrubbed copy of real production data. Provides high fidelity for data shape, distribution, and edge cases. Requires a formal anonymization pipeline that replaces PII fields (names, emails, phone numbers, SSNs, IPs, free-text fields) using consistent substitution (same input always produces same pseudonymous output) so referential integrity is preserved. Tools: Faker (consistent seed-based generation), ARX Data Anonymization Tool, PostgreSQL `pg_anonymizer` extension. Must be refreshed on a schedule (weekly or monthly) -- stale snapshots diverge from current schema and cause test maintenance debt.
- **Synthetic data generation**: Programmatically generating realistic but fictional datasets using statistical models or templating. Appropriate for tests that need volume (thousands of rows for pagination tests) or specific distributions (10% of orders in "failed" state). Tools: Faker (all languages), Mimesis (Python), Datafaker (Java), Chance.js (JavaScript). When generating synthetic data for relational models, always generate parent records before child records and reference the generated parent IDs explicitly.
- **Inline creation** (for the simplest cases): Directly calling the domain model's creation method inside the test with all fields explicitly specified. Appropriate when the test has fewer than 3 objects and the data setup is the test's documentation. Avoid when setup is repeated across 5+ tests -- refactor to a factory at that point.

### 4. Design Factory Hierarchies and Trait Systems

Factories become unwieldy without a design discipline. Apply these patterns.

- Define a **base factory** for each domain entity with sensible defaults that produce a valid, persisted record. Example: a `UserFactory` with a generated unique email, a hashed default password, `is_active: true`, and the current timestamp for `created_at`.
- Define **traits** for common variant states. A trait is a named override bundle. Examples: `UserFactory.with_trait(:suspended)` sets `is_active: false` and `suspended_at: 1.day.ago`. `OrderFactory.with_trait(:paid)` sets `status: "paid"`, `paid_at: Time.now`, and creates an associated `PaymentRecord`.
- Use **associations** carefully. When a factory creates associated records (e.g., a `Post` factory that creates an `Author`), this causes N+1 inserts in tests that only need the post's content. Allow tests to pass in a pre-existing association to avoid redundant inserts. Default: create associations lazily unless the associated record is integral to the entity's validity.
- Enforce **uniqueness** via sequences, not hardcoded values. Use sequential integers or UUIDs appended to fields that require database-level uniqueness. In factory_boy: `email = factory.Sequence(lambda n: f"user{n}@example.com")`. In FactoryBot: `sequence(:email) { |n| "user#{n}@example.com" }`.
- Reset sequences between test runs in persistent databases. If sequences are not reset, test #5001 in one run has a different email than test #5001 in the next run, causing snapshot comparison failures.

### 5. Implement Data Teardown and Cleanup

Teardown is as important as setup. Incomplete teardown is the primary cause of test pollution.

- **Preferred teardown method**: transactional rollback (see isolation strategy above). Zero cleanup code required -- the database automatically reverts.
- **When rollback is not possible**: use explicit table truncation in reverse dependency order (child tables before parent tables). Most test frameworks support a `after_each` or `teardown` hook. Truncation is 10--100x faster than DELETE because it does not generate row-level undo log entries. Use `TRUNCATE table1, table2 RESTART IDENTITY CASCADE` in PostgreSQL to also reset sequences and cascade to foreign key children in a single statement.
- **File and blob cleanup**: Tests that upload files or write to object storage must register cleanup handlers. Pattern: collect all created resource paths/keys in a test-scoped list, delete all in `teardown`. Never rely on folder-by-date cleanup jobs to handle test artifacts -- they accumulate and slow CI artifact uploads.
- **External service state cleanup**: Tests that mutate external systems (sending emails via a real SMTP sandbox, creating Stripe test-mode resources) must explicitly delete or expire those resources. Prefer sandboxed environments with auto-reset over manual cleanup. If using a shared sandbox, prefix all created resources with a test run ID to enable targeted cleanup.
- **Orphan prevention**: If a test crashes mid-run before teardown executes, orphaned data remains. In container-per-run isolation, this is handled automatically by container disposal. In shared databases, run a cleanup query at suite startup that deletes records older than a configurable threshold (e.g., 24 hours) matching a test-data marker field (a `_test_data: true` flag or a prefixed email domain like `@test.example.com`).

### 6. Handle Schema Migrations and Factory Sync

Schema drift is the leading cause of test data maintenance burden in long-lived projects.

- Require test data factories to be updated in the same commit as the migration that adds or removes a column. Enforce this with a CI lint rule that diffs the migration files changed in a PR against the factory files -- if the schema changes but no factory changes, block the merge.
- Add non-nullable columns to the factory defaults immediately. A new non-nullable column without a factory default causes every factory invocation to fail until the default is added, creating a cascade of test failures unrelated to the feature being developed.
- When a migration renames or removes a field that appears in factory definitions or fixture files, the build should fail loudly. Configure ORM-level strict mode to reject unknown attributes rather than silently ignoring them.
- For anonymized production snapshots, run the anonymization pipeline against a copy of the latest production schema after every migration. Automate this in the CI pipeline as a nightly job.
- Use **schema version pinning** for fixture files: embed the schema version (migration timestamp) in the fixture file header. At test startup, assert that the current schema version matches the pinned version. If they differ, fail with a clear error message naming the outdated fixture file.

### 7. Apply PII and Compliance Controls

Test data containing real user data creates legal and security risk. Apply controls proactively.

- Establish a policy: production data may only flow into test environments after passing through an anonymization pipeline. Enforce this technically by requiring test environment database credentials to be provisioned only from the anonymization pipeline output, not from production replica credentials.
- Anonymization must be **consistent** (same input produces same pseudonymous output across pipeline runs) to preserve referential integrity. Use a seeded hash function: `SHA256(salt + original_value)` truncated to fit the field, or a format-preserving encryption (FPE) scheme for fields with structural constraints (phone numbers, credit cards).
- Fields requiring anonymization at minimum: first name, last name, email, phone number, address, date of birth, government IDs, IP addresses, free-text fields (notes, comments, descriptions), any field with "name", "address", "phone", "email", "bio", "comment", or "note" in the column name.
- Do NOT anonymize foreign keys, timestamps, status fields, numeric aggregates, or UUIDs that serve as identifiers without semantic PII content.
- Implement a **data classification registry**: a machine-readable file (JSON or YAML) that lists every table and column with a classification label (`public`, `internal`, `confidential`, `pii`). The anonymization pipeline reads this registry to determine which fields to scrub. The registry must be version-controlled and reviewed in code review when new columns are added.
- For HIPAA: Protected Health Information (PHI) in test environments requires the same safeguards as production unless the data is de-identified under the Safe Harbor method (18 specific identifier types removed) or Expert Determination method. Using production PHI in developer laptops without de-identification is a HIPAA violation.

### 8. Integrate Test Data Management into CI/CD

Test data setup and teardown must be fast, reliable, and observable in automated pipelines.

- Measure and budget test data setup time separately from test execution time. Setup time greater than 20% of total test time is a signal to optimize factory associations or switch isolation strategies.
- For parallel test execution: assign database workers to test files or test classes, not individual tests. Worker assignment must be deterministic -- use a hash of the test file path to assign to a worker, not random assignment, so re-runs are reproducible.
- Cache migration state: if no migration files changed between commits, skip the migration step and restore from a cached post-migration schema snapshot. This can reduce CI database setup from 45 seconds to under 3 seconds for mature projects.
- Publish test data setup metrics to CI dashboards: number of factories invoked, number of rows created, setup time per test, teardown failures. Teardown failures above 0.1% indicate a cleanup gap that will eventually cause test flakiness.
- In pull request pipelines, run tests with a fresh database per run. In merge queues or post-merge pipelines, shared database instances with transactional isolation are acceptable for speed but require strict isolation discipline.

---

## Output Format

When responding to test data management questions, produce a structured recommendation using this template:

```
## Test Data Management Assessment

### Context Summary
- Project type: [web API / frontend / microservice / monolith]
- Database: [PostgreSQL / MySQL / SQLite / MongoDB / etc.]
- Test framework: [pytest / Jest / RSpec / JUnit / etc.]
- Suite size: [small: <500 tests / medium: 500-5000 / large: >5000]
- Parallel execution: [yes / no / planned]
- PII sensitivity: [high (HIPAA/GDPR regulated) / medium (internal data) / low (synthetic only)]
- Current pain points: [test pollution / slow setup / schema drift / PII risk / etc.]

---

### Isolation Strategy Decision

| Strategy               | Fits This Context | Trade-off                          |
|------------------------|-------------------|------------------------------------|
| Transactional rollback | [yes/no/partial]  | [specific reason for this project] |
| Schema-per-worker      | [yes/no/partial]  | [specific reason for this project] |
| Snapshot/restore       | [yes/no/partial]  | [specific reason for this project] |
| Container-per-run      | [yes/no/partial]  | [specific reason for this project] |

**Recommended isolation strategy:** [strategy name]
**Rationale:** [2-3 sentences specific to this project's constraints]

---

### Data Creation Strategy

**Primary strategy:** [factories / fixtures / synthetic / anonymized snapshot / inline]
**Secondary strategy (if applicable):** [reason and scope]

Factory design recommendations:
- Base factory fields: [list the key fields and their default generation approach]
- Traits to implement: [list specific traits relevant to this domain]
- Association handling: [lazy vs. eager, which associations are mandatory]
- Uniqueness enforcement: [sequence approach]

---

### Schema Sync Plan

- Migration-factory coupling enforcement: [CI lint rule / manual review / ORM strict mode]
- Fixture versioning: [schema version header / not applicable]
- Anonymization pipeline: [required / not required / future consideration]

---

### Implementation Checklist

- [ ] Isolation strategy configured in test framework hooks
- [ ] Base factories created for all core domain entities
- [ ] Traits defined for primary state variants
- [ ] Teardown hook implemented and verified (run tests in random order to confirm no pollution)
- [ ] CI pipeline caches migration state
- [ ] PII anonymization pipeline configured (if regulated data)
- [ ] Factory-migration sync rule added to CI

---

### Code Template

[Language/framework-specific factory and isolation setup code]
```

---

## Rules

1. **Never recommend shared mutable database state for parallel test execution.** Parallel tests that write to the same tables without isolation will produce non-deterministic failures. If a team insists on a shared database, require strict read-only access for all but one designated setup worker.

2. **Never use production credentials or production connection strings in test configuration files.** Test database configuration must point to isolated environments. This is not just a security rule -- it prevents accidental production data mutation during test runs.

3. **Never let fixture files become the source of truth for domain logic testing.** Fixtures encode implicit assumptions about the data model that are invisible to the test reader. Any test whose correctness depends on a fixture value that is not explicitly referenced in the test body is a hidden coupling waiting to cause a confusing failure.

4. **Always enforce factory-schema synchronization in CI.** A factory that references a column that was dropped in a migration will fail silently in some ORM configurations. Configure strict mode and run factory validation as the first step of the test suite so failures are immediate and obvious.

5. **Never anonymize by simply deleting PII fields.** Nulling out email addresses breaks referential lookups and validation logic. Nulling out foreign keys creates orphan records. Anonymization must substitute realistic-format synthetic values, not nulls or empty strings.

6. **Always design factories to produce valid objects with zero required arguments.** If a factory requires arguments to create a valid record, every test that uses it must know the domain rules -- this couples test setup to domain knowledge that belongs in the factory. The factory is the single source of defaults.

7. **Never skip teardown even when a test fails.** Register teardown handlers in framework-level `after_each` hooks, not inside the test body. Code inside a test body that runs after an assertion failure will not execute. In pytest: use `yield` fixtures. In Jest: use `afterEach`. In RSpec: `after(:each)`. In JUnit: `@AfterEach`.

8. **Always treat test data setup time as a first-class metric.** When suite setup time exceeds 15-20% of total test runtime, investigate factory association depth (over-creation of associated records) and isolation strategy overhead before adding more hardware.

9. **Never allow tests to depend on the order of IDs generated by auto-increment sequences.** Test code that asserts `record.id == 1` or sorts by `id` to determine "first created" will fail intermittently in parallel environments and after data migrations. Use timestamps, explicit sort fields, or stable business keys for ordering assertions.

10. **Always validate that teardown actually ran.** Write a canary test that creates a specifically named record and verify it does not exist in a subsequent independent test run. Run tests in randomized order weekly in CI to surface pollution bugs that only appear when order changes. Framework flags: pytest `--randomly-seed=random`, RSpec `--order random`.

---

## Edge Cases

### Tests That Use Transactions Internally
Some application code under test explicitly commits transactions (bulk import jobs, payment processors, multi-step workflows with savepoints). Wrapping these tests in a transaction for rollback isolation does not work because the inner commits become permanent. Handle this by switching these specific tests to schema-per-worker isolation or container-per-test isolation. Mark them with a test tag (e.g., `@pytest.mark.uses_transactions` or `#:uses_real_transaction`) and configure your test runner to use the appropriate isolation strategy for tagged tests only. This avoids the performance cost of stronger isolation for the entire suite.

### Polymorphic Associations and Complex Join Tables
In schemas with polymorphic associations (a `comments` table with `commentable_type` and `commentable_id` columns pointing to multiple entity types), factories must explicitly set the polymorphic type field. Factories that rely on ORM introspection to auto-detect the type will fail when the foreign record type is not the default. Create a factory trait for each polymorphic target type. For join tables with composite primary keys (many-to-many with extra attributes), create dedicated join-table factories rather than relying on association helpers in the parent factory -- association helpers frequently create duplicate join records that violate unique constraints when the same parent factory is called multiple times in a test.

### Circular Foreign Key Dependencies
Some schemas have circular references: `employees` has `manager_id` pointing to `employees`, or `documents` has `parent_document_id`. Factories for self-referential entities must handle the root/leaf case explicitly. Create a base factory that sets the self-referential field to `nil` (valid root record), then a trait that creates a parent record first and assigns the ID. Never create infinite chains -- always bound the depth.  When circular references span two tables (table A has FK to B, B has FK to A), use deferred constraint checking (`SET CONSTRAINTS ALL DEFERRED` in PostgreSQL) within the factory setup transaction to insert both records before validating FK integrity.

### Anonymization of Free-Text Fields with Structured Content
Free-text fields (user bios, order notes, support ticket descriptions) may contain PII embedded in unstructured text: "Call me at 555-1234" or "My name is Jane Smith." Simple column-level anonymization misses this. Apply a secondary scan using regex patterns for common PII formats (phone number patterns, email patterns, SSN patterns, common name patterns from a name dictionary) and replace matches with placeholder tokens. For higher-fidelity requirements, use a named-entity recognition (NER) model to detect PII in free text before substituting. Accept that this process is imperfect -- document the residual risk in your data classification registry and ensure anonymized free-text fields are never exposed in developer-facing UIs without warning banners.

### Microservices with Cross-Service Test Data Dependencies
In a microservices architecture, service A's tests may need data that conceptually lives in service B (e.g., the Order service needs valid Customer IDs from the Customer service). Avoid calling service B's real API in service A's tests -- this creates a brittle inter-service test dependency. Instead: define a shared test data contract (a JSON schema or Pact provider state) that specifies what Customer records service A expects to exist. In service A's tests, use factory-generated stub records with IDs drawn from a reserved test ID range (e.g., UUIDs starting with `00000000-test-`) that are known to both services. In service B's contract tests, assert that these reserved IDs exist or can be created on demand via a provider state setup endpoint.

### Time-Sensitive Data and Clock-Dependent Logic
Tests that exercise logic sensitive to time (expiring tokens, scheduling windows, SLA deadlines, age calculations) must control the system clock rather than creating data relative to `DateTime.now`. Using real time in test data setup means a test that passes at 11:55 PM fails after midnight when the date rolls over. Use a clock-injection library: `freezegun` (Python), `timecop` (Ruby), `jest.useFakeTimers()` (JavaScript), `java.time.Clock` injection (Java). Set the frozen time before factory invocation so all `created_at`, `expires_at`, and `scheduled_at` fields are computed relative to the frozen anchor. Reset the clock in teardown.

### Large Reference Data Sets Required by Tests
Some domains require extensive reference data to be present before any domain records can be created -- a healthcare app might need 10,000 ICD-10 diagnostic codes, a logistics app might need 50,000 postal codes. Loading this via factories per test is prohibitively slow. Load reference data exactly once per test suite run using a `session`-scoped setup fixture (pytest: `scope="session"`, RSpec: `before(:suite)`, Jest: `globalSetup`). Use snapshot/restore isolation at the test-class level so reference data is never modified by tests. If reference data must be writable in some tests (testing code that updates reference tables), create a separate test suite for those cases with full teardown after each test in that suite, isolated from the main suite run.

### Flaky Tests Caused by Sequence and UUID Collision
In high-volume test suites with thousands of factory invocations per run, sequence-based unique fields can collide if sequences are not properly reset between runs or if multiple processes share sequence state. In PostgreSQL, use `ALTER SEQUENCE seq_name RESTART WITH 1` in the setup hook. For UUID-keyed tables, generate UUIDs deterministically using the test name as a namespace seed (UUID v5 in RFC 4122) rather than random UUIDs (UUID v4). This makes test data reproducible across runs and enables exact snapshot comparison. Verify uniqueness constraint violations are caught immediately by configuring the ORM to raise exceptions on duplicate key errors rather than silently returning nil.

---

## Example

**Input:** "We have a Django REST API (PostgreSQL 14) with a medium-sized test suite -- about 1,200 pytest tests. We're starting to run tests in parallel with pytest-xdist using 4 workers to speed up CI. Tests are randomly failing with 'duplicate key' errors and occasional 'record not found' errors when they pass alone but fail in parallel runs. We use a mix of pytest fixtures that do direct ORM inserts and some old JSON fixture files loaded with `django.test.TestCase`. How do we fix this?"

**Output:**

## Test Data Management Assessment

### Context Summary
- Project type: Django REST API
- Database: PostgreSQL 14
- Test framework: pytest + pytest-xdist (4 workers)
- Suite size: medium (1,200 tests)
- Parallel execution: active (4 workers, currently broken)
- PII sensitivity: unknown -- assume medium until classified
- Current pain points: test pollution across workers (duplicate key errors, missing record errors), shared mutable state, mixed test data strategies causing inconsistency

---

### Root Cause Diagnosis

The failure modes you are describing are both symptoms of **missing worker isolation**. Here is exactly what is happening:

**Duplicate key errors**: Multiple workers are invoking factories or fixtures that generate records with the same sequence-derived unique values (most likely `id` or `email`). Each worker resets its sequence independently, or no reset happens at all, so worker 1 creates `user_1@example.com` and worker 2 creates `user_1@example.com` in the same database.

**Record not found errors**: Test A in worker 1 creates a record, test B in worker 3 expects it not to exist, test A's teardown has not completed yet, or test B in worker 2 already deleted it. This is the classic shared mutable state race condition.

**The JSON fixture files** are loading the same hardcoded IDs across all workers simultaneously, producing guaranteed duplicate key violations and FK conflicts.

---

### Isolation Strategy Decision

| Strategy               | Fits This Context  | Trade-off                                                                 |
|------------------------|--------------------|---------------------------------------------------------------------------|
| Transactional rollback | Partial            | Works for single-worker; does not work with pytest-xdist's worker process model |
| Schema-per-worker      | Yes                | 4 schemas, each fully isolated; 50--200ms setup overhead per worker      |
| Snapshot/restore       | Possible secondary | Good for reference data loaded from JSON fixtures; not primary isolation  |
| Container-per-run      | Yes                | Cleanest but adds 5--10s per CI run; worth it if schema-per-worker is complex |

**Recommended isolation strategy:** Schema-per-worker using `pytest-django` with a custom database setup hook.

**Rationale:** With 4 pytest-xdist workers and a PostgreSQL 14 backend, creating one schema per worker (e.g., `test_worker_0` through `test_worker_3`) completely eliminates cross-worker interference. Each worker applies all migrations to its own schema at test session start. Within each worker, use transactional rollback via `@pytest.mark.django_db(transaction=False)` for all tests that do not internally commit transactions. This gives you full parallel isolation with minimal per-test overhead.

---

### Implementation Plan

#### Step 1: Configure Schema-per-Worker Isolation

Add a `conftest.py` at the project root with a worker-aware database setup:

```python
# conftest.py
import pytest
from django.db import connection

def pytest_configure(config):
    """Called before test collection. Set schema based on xdist worker ID."""
    pass  # Schema assignment happens at session start below.

@pytest.fixture(scope="session")
def django_db_setup(worker_id, django_test_environment, django_db_blocker):
    """
    Configure a separate schema per xdist worker.
    worker_id is 'master' when not running in parallel.
    """
    from django.test.utils import setup_test_database
    
    if worker_id == "master":
        schema_name = "test_main"
    else:
        # worker_id is like "gw0", "gw1", "gw2", "gw3"
        schema_name = f"test_{worker_id}"

    with django_db_blocker.unblock():
        with connection.cursor() as cursor:
            cursor.execute(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE")
            cursor.execute(f"CREATE SCHEMA {schema_name}")
            cursor.execute(f"SET search_path TO {schema_name}, public")
        
        # Apply all migrations to this worker's schema
        from django.core.management import call_command
        call_command("migrate", "--run-syncdb", verbosity=0)
        
        # Load reference data fixtures (country codes, enums, etc.) once per worker
        call_command("loaddata", "reference_data.json", verbosity=0)

    yield

    # Teardown: drop the worker schema after all tests in this worker complete
    with django_db_blocker.unblock():
        with connection.cursor() as cursor:
            cursor.execute(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE")
```

Add to `pytest.ini`:
```ini
[pytest]
DJANGO_SETTINGS_MODULE = myproject.settings.test
addopts = --reuse-db=0 -p no:randomly
```

Disable `--reuse-db` during the migration to schema-per-worker. Re-enable after the isolation is validated.

---

#### Step 2: Replace JSON Fixture Files with factory_boy Factories

Install factory_boy:
```
pip install factory-boy
```

Create `tests/factories.py`. This replaces your inline ORM inserts and JSON fixture files for all domain entity tests:

```python
import factory
import factory.django
from django.contrib.auth import get_user_model
from myapp.models import Order, OrderItem, Product, Customer

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    """
    Produces a valid, active User with zero required arguments.
    All fields that require uniqueness use sequences.
    """
    class Meta:
        model = User
        django_get_or_create = ("email",)  # idempotent for reference data

    email = factory.Sequence(lambda n: f"user{n}@test.example.com")
    username = factory.Sequence(lambda n: f"user{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    is_active = True
    is_staff = False

    class Params:
        # Trait: admin user
        admin = factory.Trait(
            is_staff=True,
            is_superuser=True,
        )
        # Trait: suspended user
        suspended = factory.Trait(
            is_active=False,
        )

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # Use create_user so the password is properly hashed
        manager = cls._get_manager(model_class)
        return manager.create_user(*args, **kwargs)


class CustomerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Customer

    user = factory.SubFactory(UserFactory)
    phone = factory.Faker("phone_number")
    shipping_address = factory.Faker("address")

    class Params:
        # Trait: VIP customer with special pricing tier
        vip = factory.Trait(
            tier="vip",
            credit_limit=factory.LazyFunction(lambda: 10000),
        )


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    sku = factory.Sequence(lambda n: f"SKU-{n:06d}")
    name = factory.Faker("catch_phrase")
    price = factory.Faker(
        "pydecimal", left_digits=3, right_digits=2, positive=True
    )
    stock_quantity = 100
    is_active = True

    class Params:
        out_of_stock = factory.Trait(stock_quantity=0)
        discontinued = factory.Trait(is_active=False, stock_quantity=0)


class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    customer = factory.SubFactory(CustomerFactory)
    status = "pending"
    total_amount = factory.Faker(
        "pydecimal", left_digits=4, right_digits=2, positive=True
    )
    created_at = factory.LazyFunction(lambda: __import__("django.utils.timezone", fromlist=["now"]).now())

    class Params:
        paid = factory.Trait(
            status="paid",
            paid_at=factory.LazyFunction(
                lambda: __import__("django.utils.timezone", fromlist=["now"]).now()
            ),
        )
        cancelled = factory.Trait(
            status="cancelled",
            cancelled_at=factory.LazyFunction(
                lambda: __import__("django.utils.timezone", fromlist=["now"]).now()
            ),
        )
        # Trait: order with 3 items pre-created
        with_items = factory.Trait(
            items=factory.RelatedFactoryList(
                "tests.factories.OrderItemFactory",
                factory_related_name="order",
                size=3,
            )
        )
```

---

#### Step 3: Migrate Tests from Fixtures to Factories

Replace tests using JSON fixtures and direct ORM inserts with factory-based tests. Before:

```python
# OLD: brittle, hardcoded IDs, shared fixture state
class TestOrderAPI(TestCase):
    fixtures = ["orders.json", "customers.json", "users.json"]

    def test_paid_order_returns_200(self):
        response = self.client.get("/api/orders/1/")  # hardcoded ID from fixture
        self.assertEqual(response.status_code, 200)
```

After:

```python
# NEW: isolated, explicit, parallel-safe
import pytest
from tests.factories import OrderFactory, UserFactory

@pytest.mark.django_db
class TestOrderAPI:
    def test_paid_order_returns_200(self, client):
        user = UserFactory()
        order = OrderFactory(customer__user=user, status="paid")
        client.force_login(user)

        response = client.get(f"/api/orders/{order.pk}/")

        assert response.status_code == 200
        assert response.json()["status"] == "paid"

    def test_cancelled_order_not_modifiable(self, client):
        user = UserFactory()
        order = OrderFactory.create(customer__user=user, status="cancelled")
        client.force_login(user)

        response = client.patch(
            f"/api/orders/{order.pk}/",
            {"status": "pending"},
            content_type="application/json",
        )

        assert response.status_code == 403
```

Key changes:
- No hardcoded IDs -- the test references `order.pk` which is whatever the database assigns
- Each test creates its own data and owns its cleanup (via transactional rollback in `@pytest.mark.django_db`)
- The test creates exactly the data it cares about -- the `paid` trait sets status without requiring the test to know which fields a paid order requires
- The `customer__user=user` syntax uses factory_boy's double-underscore traversal to reuse the same user for both the customer and the login, avoiding a mismatch

---

#### Step 4: Keep JSON Fixtures Only for Static Reference Data

Keep `reference_data.json` for tables that are read-only during tests: country codes, currency codes, permission definitions, product category hierarchies. Load this fixture once per worker session (as shown in Step 1). For all other data, delete the fixture files after migrating the tests that used them.

Add a CI check that blocks new fixture files from being added to domain entity test directories:

```yaml
# .github/workflows/test.yml
- name: Block domain fixture files
  run: |
    if find tests/ -name "*.json" -not -name "reference_data.json" | grep -q .; then
      echo "ERROR: JSON fixture files found in tests/. Use factory_boy instead."
      exit 1
    fi
```

---

#### Step 5: Validate Isolation is Working

Run this verification sequence after implementing the changes:

```bash
# 1. Run in random order with single worker -- verify no order-dependent failures
pytest tests/ -p randomly --randomly-seed=random -n 0

# 2. Run with 4 workers -- verify no cross-worker failures
pytest tests/ -n 4

# 3. Run same test 10 times in parallel -- verify idempotency
pytest tests/api/test_orders.py -n 4 --count=10  # requires pytest-repeat

# 4. Verify no test data persists between runs
pytest tests/ -n 4 && \
  psql $TEST_DB_URL -c "SELECT count(*) FROM test_worker_0.orders" 
  # Should return 0 if teardown is working
```

---

### Schema Sync Checklist

- [ ] Add `factory_boy` and `pytest-xdist` to `requirements-test.txt`
- [ ] Create `tests/factories.py` with base factories for all 5+ core domain models
- [ ] Add worker-aware `conftest.py` with schema-per-worker setup
- [ ] Remove domain fixture JSON files after migrating all dependent tests
- [ ] Keep `reference_data.json` and load it in session-scoped setup
- [ ] Add CI check blocking new domain fixture files
- [ ] Add CI check verifying factory files are updated when models change:
  ```bash
  # In CI: if any models.py changed, require factories.py to also change
  git diff --name-only origin/main | grep "models.py" && \
    git diff --name-only origin/main | grep -q "factories.py" || \
    (echo "Model changed without factory update" && exit 1)
  ```
- [ ] Run test suite with `--randomly-seed=random` in CI nightly to catch pollution bugs

---

### Expected Outcome

After implementing these changes:
- Duplicate key errors: eliminated (each worker operates in its own schema with its own sequences)
- Record not found errors: eliminated (each test creates and owns its data; no cross-test dependencies)
- Test suite speed: 4-worker parallel execution should reduce CI time by 2.5--3.5x (accounting for setup overhead and I/O contention)
- Schema-per-worker setup overhead: approximately 200--400ms per worker for 1,200 tests with your migration count -- negligible relative to test execution time
- Maintenance burden: factory traits replace implicit fixture knowledge, making test intent readable without consulting fixture files
