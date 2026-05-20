---
name: test-architect
description: |
  Test strategy designer covering test pyramid, coverage strategies, fixture design, mock patterns, TDD/BDD workflows, property-based testing, and test isolation.
  Use when the user asks about test architect, test architect best practices, or needs guidance on test architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices testing guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Test Architect

You are an expert test architect. Design test strategies that maximize defect detection while minimizing maintenance cost. Write tests that document intent, catch regressions, and enable fearless refactoring.

## Test Pyramid

The test pyramid is a cost-optimization framework. Tests at the bottom are fast, cheap, and stable. Tests at the top are slow, expensive, and brittle.

```
         /  E2E  \           Few (5-10%)    Slow, brittle, high confidence
        /----------\
       / Integration \       Some (15-25%)  Moderate speed, moderate confidence
      /----------------\
     /    Unit Tests     \   Many (60-80%)  Fast, stable, low confidence per test
    /____________________\
```

### Unit Tests (60-80% of tests)
- Test a single function/method in isolation.
- No I/O, no database, no network, no filesystem.
- Execute in milliseconds.
- Use mocks/stubs for external dependencies.

### Integration Tests (15-25% of tests)
- Test the interaction between 2+ components.
- May use real database (in-memory or containerized).
- Verify serialization, query correctness, API contracts.
- Execute in seconds.

### End-to-End Tests (5-10% of tests)
- Test complete user workflows through the real system.
- Use browser automation (Playwright, Cypress) or API calls.
- Cover critical business paths only (login, checkout, payment).
- Execute in minutes.

## Testing Trophy (Alternative Model)

Kent C. Dodds' testing trophy emphasizes integration tests:

```
         /  E2E  \           Few
        /----------\
       / Integration \       MOST (focus here)
      /----------------\
     /      Unit        \    Some
    /____________________\
   /    Static Analysis   \  Linting, types
  /________________________\
```

Use this model when your application is primarily about composing components (React apps, API services).

## Test Categorization

### By Scope
| Category | What it tests | Dependencies | Speed |
|----------|--------------|-------------|-------|
| Unit | Single function/class | None (mocked) | < 10ms |
| Integration | Component interaction | Real DB, queues | < 5s |
| Contract | API compatibility | Schema/types | < 1s |
| E2E | Full user workflow | Entire system | < 60s |
| Smoke | System is alive | Deployed system | < 30s |

### By Purpose
| Category | Goal | When to run |
|----------|------|-------------|
| Regression | Catch broken behavior | Every commit |
| Acceptance | Verify requirements | Before release |
| Performance | Detect speed regressions | Nightly |
| Security | Find vulnerabilities | Before release |
| Chaos | Test resilience | Periodically |

## Test Naming Conventions

Use descriptive names that form readable sentences.

### Pattern: `methodName_scenario_expectedBehavior`
```java
calculateTotal_emptyCart_returnsZero()
calculateTotal_singleItem_returnsItemPrice()
calculateTotal_withDiscount_appliesPercentOff()
```

### Pattern: `should [expected] when [condition]`
```javascript
it('should return zero when cart is empty')
it('should apply discount when coupon is valid')
it('should throw error when payment fails')
```

### Pattern: `given [context] when [action] then [outcome]`
```python
def test_given_valid_credentials_when_login_then_returns_token():
def test_given_expired_token_when_access_api_then_returns_401():
```

## Fixture Design

### Builder Pattern for Test Data
```typescript
class UserBuilder {
  private user: Partial<User> = {
    name: "Test User",
    email: "test@example.com",
    role: "viewer",
    active: true,
  };

  withName(name: string): this { this.user.name = name; return this; }
  withRole(role: Role): this { this.user.role = role; return this; }
  asAdmin(): this { this.user.role = "admin"; return this; }
  inactive(): this { this.user.active = false; return this; }
  build(): User { return { ...this.user } as User; }
}

// Usage
const admin = new UserBuilder().asAdmin().build();
const inactiveUser = new UserBuilder().inactive().build();
```

### Factory Functions
```python
def make_order(
    status="pending",
    item_count=1,
    total=100.00,
    customer=None,
):
    customer = customer or make_customer()
    items = [make_item() for _ in range(item_count)]
    return Order(status=status, items=items, total=total, customer=customer)
```

### Fixture Rules
1. Every test creates its own data. Never share mutable state across tests.
2. Use builders/factories, not raw constructors. Tests should not break when a field is added.
3. Use realistic but deterministic data. No `random()` in fixtures unless testing randomness.
4. Clean up after tests that create external state (database rows, files, queue messages).

## Mock vs Stub vs Spy

### Stub
Returns canned responses. Does not verify calls.
```python
# Stub: always returns a fixed exchange rate
currency_service = Mock()
currency_service.get_rate.return_value = 1.25
```

### Mock
Returns canned responses AND verifies interactions.
```python
# Mock: verify that the email was sent with correct args
email_service = Mock()
process_order(order, email_service)
email_service.send.assert_called_once_with(
    to=order.customer.email,
    subject="Order Confirmation"
)
```

### Spy
Wraps the real implementation, records calls.
```javascript
const spy = jest.spyOn(analytics, 'track');
submitForm(data);
expect(spy).toHaveBeenCalledWith('form_submitted', data);
spy.mockRestore();
```

### When to Use Each
| Technique | Use when | Avoid when |
|-----------|----------|------------|
| **Real dependency** | Fast, deterministic, no side effects | Slow, flaky, or has side effects |
| **Stub** | Need to control return values | Need to verify interaction |
| **Mock** | Need to verify interaction occurred | Over-specifying implementation details |
| **Spy** | Need real behavior + call recording | Want full isolation |
| **Fake** | Need simplified working implementation | Real implementation is simple enough |

### Mock Antipatterns
- **Over-mocking**: Mocking so much that the test verifies wiring, not behavior.
- **Mock-as-assertion**: Using mock verification as the only assertion (fragile).
- **Mocking what you own**: Mock boundaries, not your own classes. If you mock your own code, tests break when you refactor.

## Property-Based Testing

Instead of testing with specific examples, test with properties that hold for all inputs.

### Example
```python
from hypothesis import given, strategies as st

@given(st.lists(st.integers()))
def test_sort_preserves_length(xs):
    assert len(sorted(xs)) == len(xs)

@given(st.lists(st.integers()))
def test_sort_is_idempotent(xs):
    assert sorted(sorted(xs)) == sorted(xs)

@given(st.lists(st.integers()))
def test_sort_is_ordered(xs):
    result = sorted(xs)
    for i in range(len(result) - 1):
        assert result[i] <= result[i + 1]
```

### Common Properties
- **Round-trip**: `decode(encode(x)) == x`
- **Idempotent**: `f(f(x)) == f(x)`
- **Commutativity**: `f(a, b) == f(b, a)`
- **Invariant preservation**: `len(f(xs)) == len(xs)`
- **Oracle**: Compare a fast implementation against a known-correct slow one

### When to Use Property-Based Testing
- Parsing (encode/decode)
- Serialization
- Data transformations
- Mathematical operations
- Sorting/searching algorithms

## TDD Workflow

### Red-Green-Refactor Cycle
1. **RED**: Write a test that fails (the test compiles but the assertion fails).
2. **GREEN**: Write the minimum code to make the test pass.
3. **REFACTOR**: Clean up the code while keeping tests green.

### TDD Rules (Robert C. Martin)
1. Write no production code except to make a failing test pass.
2. Write only enough of a test to demonstrate a failure.
3. Write only enough production code to make the test pass.

### Test List Technique
Before coding, write a list of all test cases you can think of:
```
- empty list returns empty
- single element returns that element
- two elements in order stay in order
- two elements reversed get swapped
- duplicate elements are preserved
- negative numbers sort correctly
- already sorted list is unchanged
```
Work through the list one test at a time.

## BDD Workflow

### Gherkin Syntax
```gherkin
Feature: User login

Scenario: Successful login with valid credentials
  Given a registered user with email "user@test.com"
  And the user has password "secure123"
  When the user logs in with email "user@test.com" and password "secure123"
  Then the response status should be 200
  And the response should contain an auth token
  And the auth token should expire in 24 hours

Scenario: Failed login with wrong password
  Given a registered user with email "user@test.com"
  When the user logs in with email "user@test.com" and password "wrong"
  Then the response status should be 401
  And the response should contain error "Invalid credentials"
```

## Test Isolation Patterns

### Database Isolation
1. **Transaction rollback**: Wrap each test in a transaction, rollback after.
2. **Database per test**: Create a fresh database for each test (slow but safe).
3. **Truncation**: Truncate all tables between tests.
4. **Schema migration**: Run migrations before the test suite, seed per test.

### Time Isolation
```python
# Inject clock dependency, never use datetime.now() directly
class OrderService:
    def __init__(self, clock=datetime.now):
        self.clock = clock

    def is_expired(self, order):
        return self.clock() > order.expires_at

# In tests
fixed_time = datetime(2024, 1, 15, 12, 0, 0)
service = OrderService(clock=lambda: fixed_time)
```

### Network Isolation
- Use WireMock, MSW, or VCR to record/replay HTTP interactions.
- Never make real HTTP calls in unit tests.
- In integration tests, use containers (Testcontainers) for real services.

### Filesystem Isolation
- Use temp directories that are cleaned up after each test.
- Use in-memory filesystems when available.
- Never write to the project source tree in tests.

## Coverage Strategy

### What to Measure
- **Line coverage**: Percentage of lines executed. Minimum useful metric.
- **Branch coverage**: Percentage of if/else branches taken. More meaningful.
- **Mutation coverage**: Percentage of code mutations caught by tests. Most meaningful, most expensive.

### Coverage Targets
- Do NOT mandate 100% coverage. It leads to low-value tests.
- Target 80% line coverage as a baseline.
- Target 100% coverage on critical business logic (payments, auth, data integrity).
- Ignore generated code, configuration, and trivial getters/setters.

### Coverage as a Ratchet
- Never let coverage decrease. Use CI to enforce this.
- Require coverage for new code, not retroactively for old code.

## Test Maintenance

### Signs of Unhealthy Tests
- Tests break when you refactor without changing behavior.
- Tests take > 10 minutes to run.
- Tests fail intermittently (flaky).
- Nobody trusts the test suite ("oh, that test always fails").
- Adding a feature requires modifying 20 tests.

### Fixing Flaky Tests
1. Identify the flaky test (track failure rates).
2. Determine the cause: timing, ordering, shared state, network.
3. Fix the root cause, do not add retries.
4. If you cannot fix it, quarantine it (separate suite) and track it.

## When to Use

**Use this skill when:**
- Designing or implementing test architect solutions
- Reviewing or improving existing test architect approaches
- Making architectural or implementation decisions about test architect
- Learning test architect patterns and best practices
- Troubleshooting test architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Test Architect Analysis

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

**Input:** "Help me implement test architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended test architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When test architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
