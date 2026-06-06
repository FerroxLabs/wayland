---
name: integration-tester
description: |
  Integration test design expertise covering test boundary identification, database testing with Testcontainers, API testing strategies, message queue testing, external service mocking with WireMock, test data management, cleanup strategies, CI pipeline integration, and test environment configuration.
  Use when the user asks about integration tester, integration tester best practices, or needs guidance on integration tester implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices guide"
  category: "testing-quality"
  subcategory: "test-methodology"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Integration Tester

## Core Philosophy

Integration tests verify that components work correctly together. They fill the gap between unit tests (fast, isolated, narrow scope) and end-to-end tests (slow, broad scope). The key is identifying the right boundaries to test -- too narrow and you are writing unit tests; too broad and you are writing fragile E2E tests.

## Test Boundary Identification

### What to Integration Test

```
Component A --> [Integration Boundary] --> Component B

Test these boundaries:
1. Application code  <-->  Database (SQL, queries, transactions)
2. Application code  <-->  External API (HTTP clients, REST/GraphQL)
3. Application code  <-->  Message Queue (Kafka, RabbitMQ, SQS)
4. Application code  <-->  Cache (Redis, Memcached)
5. Application code  <-->  File System (S3, local FS)
6. Service A         <-->  Service B (inter-service communication)
7. API endpoint      <-->  Full request/response cycle
```

### Integration Test Decision Matrix

```
Is the interaction with an external system?
  YES -> Integration test with real/containerized dependency
  NO  -> Is it pure business logic?
    YES -> Unit test
    NO  -> Is it multi-component within same process?
      YES -> Integration test (in-process)
      NO  -> Consider E2E test
```

## Database Testing with Testcontainers

### Python

```python
import pytest
from testcontainers.postgres import PostgresContainer
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture(scope="session")
def postgres_container():
    """Start a PostgreSQL container for the test session."""
    with PostgresContainer("postgres:16") as postgres:
        yield postgres

@pytest.fixture(scope="session")
def db_engine(postgres_container):
    engine = create_engine(postgres_container.get_connection_url())
    # Run migrations
    Base.metadata.create_all(engine)
    return engine

# ... (condensed) ...
    assert found is not None
    assert found.name == "Alice"
    assert found.id == user.id

def test_find_user_by_email_returns_none_when_not_found(db_session):
    repo = UserRepository(db_session)
    assert repo.find_by_email("nonexistent@example.com") is None
```

### Java

```java
@Testcontainers
@SpringBootTest
class UserRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    # ... (condensed) ...

        Optional<User> found = userRepository.findByEmail("alice@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Alice");
        assertThat(found.get().getId()).isEqualTo(saved.getId());
    }
}
```

### JavaScript/TypeScript

```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';

describe('UserRepository', () => {
    let container: StartedPostgreSqlContainer;
    let pool: Pool;
    let repo: UserRepository;

    beforeAll(async () => {
        container = await new PostgreSqlContainer('postgres:16').start();
        pool = new Pool({ connectionString: container.getConnectionUri() });
        await runMigrations(pool);
        repo = new UserRepository(pool);
    }, 60000);

    afterAll(async () => {
        await pool.end();
        await container.stop();
    # ... (condensed) ...
        const found = await repo.findByEmail('alice@example.com');

        expect(found).toBeDefined();
        expect(found!.name).toBe('Alice');
        expect(found!.id).toBe(user.id);
    });
});
```

## API Testing

### HTTP API Integration Tests

```python
# Python with FastAPI / pytest
import pytest
from httpx import AsyncClient, ASGITransport
from myapp.main import app
from myapp.dependencies import get_db

@pytest.fixture
async def client(db_session):
    """Create test client with superseded database dependency."""
    app.dependency_overrides[get_db] = lambda: db_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="[reference URL]") as client:
        yield client

    app.dependency_overrides.clear()

async def test_create_user_returns_201(client):
    # ... (condensed) ...
    # First page
    response = await client.get("/api/users?page=1&per_page=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 10
    assert data["total"] == 25
    assert data["page"] == 1
```

### Testing Authentication and Authorization

```python
@pytest.fixture
def auth_headers():
    """Generate valid JWT token for testing."""
    token = create_test_token(user_id=1, role="admin")
    return {"Authorization": f"Bearer {token}"}

async def test_admin_endpoint_requires_authentication(client):
    response = await client.get("/api/admin/users")
    assert response.status_code == 401

async def test_admin_endpoint_requires_admin_role(client):
    user_token = create_test_token(user_id=2, role="user")
    response = await client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403

async def test_admin_can_list_all_users(client, auth_headers):
    response = await client.get("/api/admin/users", headers=auth_headers)
    assert response.status_code == 200
```

## Message Queue Testing

### Kafka with Testcontainers

```python
from testcontainers.kafka import KafkaContainer

@pytest.fixture(scope="session")
def kafka_container():
    with KafkaContainer("confluentinc/cp-kafka:7.5.0") as kafka:
        yield kafka

@pytest.fixture
def kafka_producer(kafka_container):
    from confluent_kafka import Producer
    return Producer({"bootstrap.servers": kafka_container.get_bootstrap_server()})

@pytest.fixture
def kafka_consumer(kafka_container):
    from confluent_kafka import Consumer
    return Consumer({
        "bootstrap.servers": kafka_container.get_bootstrap_server(),
        "group.id": "test-group",
        # ... (condensed) ...
    msg = kafka_consumer.poll(timeout=10.0)
    assert msg is not None
    assert msg.error() is None

    event = json.loads(msg.value())
    assert event["type"] == "order.created"
    assert event["data"]["item"] == "Widget"
```

## External Service Mocking with WireMock

### Python

```python
from testcontainers.core.container import DockerContainer

@pytest.fixture(scope="session")
def wiremock():
    container = (
        DockerContainer("wiremock/wiremock:3.3.1")
        .with_exposed_ports(8080)
    )
    container.start()
    host = container.get_container_host_ip()
    port = container.get_exposed_port(8080)
    base_url = f"[reference URL]"

    yield base_url

    container.stop()

def setup_payment_stub(wiremock_url, status="success"):
    # ... (condensed) ...
        db=db_session
    )

    result = service.process_order(order_data)

    assert result.status == "confirmed"
    assert result.payment_id == "txn_test_123"
```

### Java with WireMock

```java
@WireMockTest(httpPort = 8089)
class PaymentClientIntegrationTest {

    @Test
    void processPayment_success() {
        stubFor(post(urlPathEqualTo("/api/payments"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"status": "success", "transaction_id": "txn_123"}
                """)));

        PaymentClient client = new PaymentClient("[reference URL]");
        PaymentResult result = client.processPayment(new PaymentRequest(99.99, "USD"));

        assertThat(result.getStatus()).isEqualTo("success");
        assertThat(result.getTransactionId()).isEqualTo("txn_123");
# ... (condensed) ...
                .withFixedDelay(5000)));

        PaymentClient client = new PaymentClient("[reference URL]");
        assertThrows(PaymentTimeoutException.class,
            () -> client.processPayment(new PaymentRequest(99.99, "USD")));
    }
}
```

## Test Data Management

### Factory Pattern

```python
# factories.py
from datetime import datetime, timezone
import factory

class UserFactory(factory.Factory):
    class Meta:
        model = User

    name = factory.Faker("name")
    email = factory.LazyAttribute(lambda o: f"{o.name.lower().replace(' ', '.')}@test.com")
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    is_active = True

class OrderFactory(factory.Factory):
    class Meta:
        model = Order

    user = factory.SubFactory(UserFactory)
    total = factory.Faker("pydecimal", left_digits=3, right_digits=2, positive=True)
    status = "pending"

# Usage in tests
def test_process_order():
    user = UserFactory(tier="premium")
    order = OrderFactory(user=user, total=150.00)
    # ...
```

## Cleanup Strategies

```python
# Strategy 1: Transaction rollback (fastest)
@pytest.fixture
def db_session(db_engine):
    conn = db_engine.connect()
    txn = conn.begin()
    session = Session(bind=conn)
    yield session
    session.close()
    txn.rollback()
    conn.close()

# Strategy 2: Truncate tables between tests
@pytest.fixture(autouse=True)
def clean_tables(db_session):
    yield
    for table in reversed(Base.metadata.sorted_tables):
        db_session.execute(table.delete())
    db_session.commit()
# ... (condensed) ...
@pytest.fixture
def fresh_db(template_db):
    # Fast: create DB from template instead of running migrations
    with template_db.connect() as conn:
        conn.execute(text("DROP DATABASE IF EXISTS test_run"))
        conn.execute(text("CREATE DATABASE test_run TEMPLATE testdb_template"))
    yield create_engine("postgresql://localhost/test_run")
```

## CI Integration

### GitHub Actions Example

```yaml
name: Integration Tests
on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          # ... (condensed) ...
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: install via pip: -r requirements-test.txt
      - run: pytest tests/integration/ -v --timeout=60
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
```

### Test Environment Configuration

```python
# conftest.py
import os

@pytest.fixture(scope="session")
def test_config():
    """Load test configuration from environment or defaults."""
    return {
        "database_url": os.getenv("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb"),
        "redis_url": os.getenv("REDIS_URL", "redis://localhost:6379"),
        "wiremock_url": os.getenv("WIREMOCK_URL", "[reference URL]"),
        "use_testcontainers": os.getenv("USE_TESTCONTAINERS", "true").lower() == "true",
    }
```

## Best Practices

1. **Use Testcontainers over mocked databases**: Real databases catch real bugs
2. **Isolate tests with transactions**: Roll back after each test for speed
3. **Test failure modes**: Timeouts, connection errors, malformed responses
4. **Keep integration tests focused**: Test one integration boundary per test
5. **Use fixtures and factories**: Avoid duplicating test data setup
6. **Tag integration tests separately**: Run fast unit tests first in CI
7. **Set timeouts**: Integration tests should fail fast, not hang
8. **Test idempotency**: Ensure retries produce the same result

## When to Use

**Use this skill when:**
- Designing or implementing integration tester solutions
- Reviewing or improving existing integration tester approaches
- Making architectural or implementation decisions about integration tester
- Learning integration tester patterns and best practices
- Troubleshooting integration tester-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Integration Tester Analysis

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

**Input:** "Help me implement integration tester for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended integration tester approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When integration tester must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
