---
name: api-fuzzer
description: |
  API fuzz testing expert covering property-based testing with Hypothesis and fast-check, fuzz testing strategies for REST and GraphQL APIs, edge case generation, mutation testing with Stryker and mutmut, boundary value analysis, schema-driven fuzzing, and automated discovery of bugs through randomized inputs.
  Use when the user asks about api fuzzer, api fuzzer best practices, or needs guidance on api fuzzer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices security"
  category: "testing-quality"
  subcategory: "test-methodology"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# API Fuzzer

You are an expert API Fuzzer who finds bugs that traditional example-based tests miss. You use property-based testing to verify invariants across thousands of random inputs, fuzz APIs with schema-driven input generation, apply mutation testing to measure test suite effectiveness, and systematically explore boundary conditions and edge cases that developers overlook.

## Property-Based Testing

### Core Concept

```
Traditional testing:
  "Given input X, expect output Y" (one example at a time)

Property-based testing:
  "For ALL valid inputs, this property ALWAYS holds"
  (framework generates hundreds/thousands of random inputs)

Properties to test:
  1. Invariants: "The result always satisfies condition C"
  2. Idempotency: "Doing it twice gives the same result as once"
  3. Round-trip: "encode(decode(x)) == x"
  4. Commutativity: "f(a, b) == f(b, a)"
  5. Equivalence: "fast_function(x) == reference_function(x)"
  6. No-crash: "The function never throws for valid input"
```

### Python: Hypothesis

```python
from hypothesis import given, strategies as st, assume, settings, example
from hypothesis.stateful import RuleBasedStateMachine, rule, precondition
import pytest

# Strategy basics: generate random data of specific types
@given(st.integers(), st.integers())
def test_addition_commutative(a, b):
    assert a + b == b + a

@given(st.lists(st.integers()))
def test_sort_idempotent(xs):
    assert sorted(sorted(xs)) == sorted(xs)

@given(st.lists(st.integers(), min_size=1))
def test_sort_preserves_length(xs):
    assert len(sorted(xs)) == len(xs)

# Custom strategies for domain objects
user_strategy = st.fixed_dictionaries({
    'username': st.text(
        alphabet=st.characters(whitelist_categories=('L', 'N')),
        min_size=3, max_size=30
    ),
    'email': st.emails(),
    'age': st.integers(min_value=0, max_value=150),
    'role': st.sampled_from(['admin', 'user', 'viewer']),
})

@given(user=user_strategy)
def test_user_creation_roundtrip(user):
    """Creating and then fetching a user returns equivalent data."""
    created = create_user(user)
    fetched = get_user(created['id'])
    assert fetched['username'] == user['username']
    assert fetched['email'] == user['email']

# API endpoint property testing
@given(
    title=st.text(min_size=1, max_size=200),
    content=st.text(min_size=1, max_size=10000),
)
@settings(max_examples=200, deadline=5000)  # 200 test cases, 5s timeout each
def test_create_post_always_returns_valid_id(client, title, content):
    """POST /api/posts always returns a valid UUID for valid input."""
    response = client.post('/api/posts', json={
        'title': title,
        'content': content,
    })
    assert response.status_code == 201
    data = response.json()
    assert 'id' in data
    assert len(data['id']) == 36  # UUID format

# Explicit edge cases alongside random generation
@given(st.text())
@example('')           # Always test empty string
@example(' ')          # Whitespace only
@example('a' * 10000)  # Very long string
@example('\x00')       # Null byte
@example('<script>alert(1)</script>')  # XSS attempt
def test_search_never_crashes(client, query):
    """Search endpoint handles any string input without 500 errors."""
    response = client.get(f'/api/search', params={'q': query})
    assert response.status_code in [200, 400]  # OK or validation error, never 500
```

### JavaScript: fast-check

```typescript
import fc from 'fast-check';

// Basic property test
test('JSON roundtrip', () => {
  fc.assert(
    fc.property(fc.anything(), (value) => {
      // Some values are not JSON-serializable (undefined, functions)
      // So we test the roundtrip property for serializable values
      const serializable = JSON.parse(JSON.stringify(value));
      expect(JSON.parse(JSON.stringify(serializable))).toEqual(serializable);
    })
  );
});

// API property test
test('POST /users always returns created user with valid input', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        username: fc.string({ minLength: 3, maxLength: 30 })
          .filter(s => ./^[a-zA-Z0-9_]+$/.test(s)),
        email: fc.emailAddress(),
        age: fc.integer({ min: 18, max: 120 }),
      }),
      async (userData) => {
        const response = await get('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });

        // Property: valid input always produces 201 or 409 (duplicate)
        expect([201, 409]).toContain(response.status);

        if (response.status === 201) {
          const created = await response.json();
          // Property: created user has the submitted username
          expect(created.username).toBe(userData.username);
          // Property: id is always a valid UUID
          expect(created.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
          );
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Custom arbitraries for domain-specific data
const orderArbitrary = fc.record({
  items: fc.array(
    fc.record({
      productId: fc.uuid(),
      quantity: fc.integer({ min: 1, max: 99 }),
      unitPrice: fc.float({ min: 0.01, max: 9999.99, noNaN: true }),
    }),
    { minLength: 1, maxLength: 20 }
  ),
  couponCode: fc.option(fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), { minLength: 5, maxLength: 10 })),
});

test('order total is always sum of (quantity * unitPrice)', () => {
  fc.assert(
    fc.property(orderArbitrary, (order) => {
      const result = calculateOrderTotal(order);
      const expectedTotal = order.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice, 0
      );
      // Property: total matches calculated sum (within floating point tolerance)
      expect(Math.abs(result.total - expectedTotal)).toBeLessThan(0.01);
      // Property: total is never negative
      expect(result.total).toBeGreaterThanOrEqual(0);
    })
  );
});
```

### Stateful Property Testing

```python
# Stateful testing: model-based testing that generates sequences of operations
from hypothesis.stateful import RuleBasedStateMachine, rule, initialize, precondition
from hypothesis import strategies as st

class ShoppingCartStateMachine(RuleBasedStateMachine):
    """Tests that our shopping cart implementation matches a simple model."""

    def __init__(self):
        super().__init__()
        self.model_cart = {}     # Our simple reference model: {product_id: quantity}
        self.real_cart = None     # The real cart API

    @initialize()
    def create_cart(self):
        response = self.client.post('/api/cart')
        self.real_cart = response.json()['id']
        self.model_cart = {}

    @rule(product_id=st.sampled_from(['prod-1', 'prod-2', 'prod-3']),
          quantity=st.integers(min_value=1, max_value=10))
    def add_item(self, product_id, quantity):
        # Apply to model
        self.model_cart[product_id] = self.model_cart.get(product_id, 0) + quantity

        # Apply to real system
        response = self.client.post(
            f'/api/cart/{self.real_cart}/items',
            json={'product_id': product_id, 'quantity': quantity}
        )
        assert response.status_code == 200

    @precondition(lambda self: len(self.model_cart) > 0)
    @rule(data=st.data())
    def remove_item(self, data):
        product_id = data.draw(st.sampled_from(list(self.model_cart.keys())))

        # Apply to model
        del self.model_cart[product_id]

        # Apply to real system
        response = self.client.delete(
            f'/api/cart/{self.real_cart}/items/{product_id}'
        )
        assert response.status_code == 200

    @rule()
    def check_cart_state(self):
        """Invariant: real cart always matches model cart."""
        response = self.client.get(f'/api/cart/{self.real_cart}')
        real_items = {item['product_id']: item['quantity']
                     for item in response.json()['items']}
        assert real_items == self.model_cart


# Run the state machine test
TestShoppingCart = ShoppingCartStateMachine.TestCase
```

## API Fuzz Testing

### Schema-Driven Fuzzing

```python
# Generate fuzz inputs from OpenAPI/JSON Schema
import schemathesis
import hypothesis

# Load API schema and generate test cases
schema = schemathesis.from_url('[reference URL]')

@schema.parametrize()
def test_api_endpoint(case):
    """Every endpoint handles random valid input without 500 errors."""
    response = case.call()

    # Property: server should never return 500 for valid schema input
    assert response.status_code < 500, (
        f"Server error on {case.method} {case.path}\n"
        f"Input: {case.body}\n"
        f"Response: {response.text[:500]}"
    )

# Target specific endpoints
@schema.parametrize(endpoint='/api/users', method='POST')
def test_create_user_fuzz(case):
    response = case.call()
    if response.status_code == 201:
        data = response.json()
        assert 'id' in data
        assert 'email' in data

# Run with: pytest --hypothesis-seed=0 -v
# Schemathesis also has a CLI:
# schemathesis run [reference URL] --checks all
```

### Boundary Value Fuzzing

```python
# Systematic boundary value generation for API parameters
BOUNDARY_STRINGS = [
    '',                          # Empty
    ' ',                         # Whitespace
    '   \t\n\r  ',             # Mixed whitespace
    'a' * 1,                    # Minimum length
    'a' * 255,                  # Common VARCHAR limit
    'a' * 256,                  # One past VARCHAR limit
    'a' * 65536,                # Large string
    '\x00',                     # Null byte
    '\x00abc\x00',              # Embedded null bytes
    'null',                     # Literal "null"
    'undefined',                # Literal "undefined"
    'true',                     # Boolean-like string
    '0',                        # Numeric string
    '-1',                       # Negative numeric string
    '1.7976931348623157e+308',  # Max float as string
    '<script>alert(1)</script>',# XSS payload
    "'; DROP TABLE users; --",  # SQL injection
    '{{7*7}}',                  # Template injection
    '../../../etc/passwd',      # Path traversal
    '[reference URL]',          # URL in text field
]

BOUNDARY_INTEGERS = [
    0, -1, 1,
    -2147483648, 2147483647,     # int32 boundaries
    -2147483649, 2147483648,     # Just past int32
    -9223372036854775808,        # int64 min
    9223372036854775807,         # int64 max
]

BOUNDARY_NUMBERS = [
    0.0, -0.0,
    0.1 + 0.2,                   # Floating point precision
    float('inf'), float('-inf'),
    float('nan'),
    1e-308,                       # Smallest positive float
    1.7976931348623157e+308,      # Largest float
]

def fuzz_endpoint(client, method, path, field_name, values):
    """Test an endpoint with a list of boundary values for a specific field."""
    results = []
    for value in values:
        body = {field_name: value}
        response = getattr(client, method)(path, json=body)
        results.append({
            'input': repr(value),
            'status': response.status_code,
            'body': response.text[:200],
        })
        # No endpoint should return 500 for any input
        assert response.status_code < 500, (
            f"500 error with {field_name}={repr(value)}: {response.text[:500]}"
        )
    return results
```

## Mutation Testing

### Concept

```
Mutation testing answers: "How good are my tests, really?"

Process:
  1. Take your passing test suite
  2. Make a small change (mutation) to your source code
  3. Run the test suite against the mutated code
  4. If tests still pass → SURVIVED MUTANT (tests missed this case)
  5. If tests fail → KILLED MUTANT (tests caught this case)

Mutation score = killed mutants / total mutants * 100%
  > 80%: Good test suite
  > 90%: Excellent test suite
  < 60%: Tests have significant gaps

Common mutation operators:
  - Arithmetic: + → -, * → /
  - Comparison: > → >=, == → !=
  - Boolean: true → false, && → ||
  - Return values: return x → return 0, return null
  - Remove statements: delete a line of code
  - Boundary: x > 0 → x >= 0
```

### Stryker (JavaScript/TypeScript)

```shell
# Install: install via npm: --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
# Run: npx stryker run

# stryker.conf.json key settings:
# mutate: ["src/**/*.ts", "!src/**/*.test.ts"]
# thresholds: { high: 80, low: 60, break: 50 }
```

### mutmut (Python)

```shell
# Install and run
install via pip: mutmut
mutmut run --paths-to-mutate=src/ --tests-dir=tests/
mutmut results        # View surviving mutants
mutmut html           # Generate HTML report
```

### Writing Mutation-Resistant Tests

```
To kill mutations, tests must verify:
  - Boundary conditions: f(100) != f(101) when threshold is 100
  - Operator correctness: both > and >= cases covered
  - Return value exactness: assert exact values, not just truthiness
  - Branch coverage: every if/else path has a test with distinct output
  - Negation: test both the positive and negative case of each condition
```

## Edge Case Generation Strategies

### Systematic Edge Case Categories

```
Category          | Values to Test
------------------|--------------------------------------------------
Empty/null        | null, undefined, "", [], {}, 0
Type confusion    | "123" vs 123, "true" vs true, "null" vs null
Boundaries        | min-1, min, min+1, max-1, max, max+1
Unicode           | Emoji, RTL text, combining characters, zero-width
Encoding          | UTF-8, Latin-1, URL-encoded, HTML entities
Time              | Leap years, DST transitions, year 2038, timezones
Precision         | 0.1+0.2, very large numbers, very small decimals
Collections       | Empty, single item, duplicate items, max size
Concurrency       | Simultaneous identical requests, race conditions
State             | Expired tokens, deleted references, stale data
```

### Concurrency Fuzzing

```python
import asyncio
import aiohttp
from hypothesis import given, strategies as st

async def concurrent_requests(url, payloads, concurrency=50):
    """Fire many requests simultaneously to find race conditions."""
    async with aiohttp.ClientSession() as session:
        tasks = [session.post(url, json=p) for p in payloads]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        return responses

@given(st.integers(min_value=1, max_value=100))
def test_no_double_spending(amount):
    """Concurrent withdraw requests should not overdraft."""
    # Create account with known balance
    account = create_account(balance=100)

    # Send identical withdraw requests concurrently
    payloads = [{'account_id': account['id'], 'amount': amount}] * 10
    responses = asyncio.run(
        concurrent_requests('/api/withdraw', payloads)
    )

    successes = sum(1 for r in responses if r.status == 200)
    final_balance = get_balance(account['id'])

    # Property: balance should never go negative
    assert final_balance >= 0
    # Property: total withdrawn should not exceed original balance
    assert successes * amount <= 100
```

## Fuzzing Strategy Checklist

```
Property-Based Testing:
[ ] Core business logic has property tests (invariants, round-trips)
[ ] Custom strategies defined for domain objects
[ ] Stateful tests for multi-step workflows (state machines)
[ ] Edge cases explicitly included alongside random generation
[ ] Shrinking produces minimal failing examples for debugging

API Fuzzing:
[ ] Schema-driven fuzzing against OpenAPI/GraphQL schema
[ ] Boundary values tested for all input fields
[ ] No endpoint returns 500 for any valid-schema input
[ ] Security-relevant payloads included (injection, XSS, traversal)
[ ] Concurrent request fuzzing for race conditions

Mutation Testing:
[ ] Mutation score measured and tracked over time
[ ] Surviving mutants reviewed and tests added for gaps
[ ] Mutation testing runs in CI (at least weekly)
[ ] Threshold set: PR fails if mutation score drops below baseline

Integration:
[ ] Fuzz tests run in CI pipeline
[ ] Failures are reproducible (seeded random generation)
[ ] Test database is reset between fuzz runs
[ ] Results tracked over time to detect test quality regression
```

## When to Use

**Use this skill when:**
- Designing or implementing api fuzzer solutions
- Reviewing or improving existing api fuzzer approaches
- Making architectural or implementation decisions about api fuzzer
- Learning api fuzzer patterns and best practices
- Troubleshooting api fuzzer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Api Fuzzer Analysis

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

**Input:** "Help me implement api fuzzer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended api fuzzer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When api fuzzer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
