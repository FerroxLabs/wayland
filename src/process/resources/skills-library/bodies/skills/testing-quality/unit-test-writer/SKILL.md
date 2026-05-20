---
name: unit-test-writer
description: |
  Unit test mastery covering test structure (Arrange-Act-Assert), naming conventions, test isolation principles, mocking strategies across frameworks (jest.mock, unittest.mock, Mockito), assertion patterns, edge case coverage, parameterized tests, and test doubles taxonomy (spy, stub, fake, dummy, mock).
  Use when the user asks about unit test writer, unit test writer best practices, or needs guidance on unit test writer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices tdd"
  category: "testing-quality"
  subcategory: "test-methodology"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Unit Test Writer

## Core Philosophy

Unit tests are the foundation of software quality. A good unit test is fast, isolated, repeatable, self-validating, and timely (FIRST). Each test should verify one logical concept, fail for exactly one reason, and serve as documentation for the code under test. Write tests that give confidence, not tests that merely increase coverage numbers.

## Test Structure: Arrange-Act-Assert (AAA)

Every unit test follows this pattern:

```python
# Python example
def test_calculate_discount_for_premium_member():
    # Arrange: Set up the test scenario
    member = Member(tier="premium", joined_date=date(2020, 1, 1))
    order = Order(items=[Item(price=100.00), Item(price=50.00)])
    calculator = DiscountCalculator()

    # Act: Execute the behavior under test
    discount = calculator.calculate(order, member)

    # Assert: Verify the expected outcome
    assert discount == 22.50  # 15% for premium members
```

```javascript
// JavaScript/Jest example
test('calculates discount for premium member', () => {
    // Arrange
    const member = new Member({ tier: 'premium', joinedDate: '2020-01-01' });
    const order = new Order({ items: [{ price: 100 }, { price: 50 }] });
    const calculator = new DiscountCalculator();

    // Act
    const discount = calculator.calculate(order, member);

    // Assert
    expect(discount).toBe(22.50);
});
```

```java
// Java/JUnit + Mockito example
@Test
void calculateDiscount_premiumMember_returns15Percent() {
    // Arrange
    Member member = new Member("premium", LocalDate.of(2020, 1, 1));
    Order order = new Order(List.of(new Item(100.00), new Item(50.00)));
    DiscountCalculator calculator = new DiscountCalculator();

    // Act
    double discount = calculator.calculate(order, member);

    // Assert
    assertEquals(22.50, discount, 0.01);
}
```

## Naming Conventions

### Pattern: `[UnitOfWork]_[StateUnderTest]_[ExpectedBehavior]`

```python
# Python
def test_withdraw_insufficient_funds_raises_overdraft_error():
def test_parse_email_invalid_format_returns_none():
def test_create_user_duplicate_email_raises_conflict():

# Or using describe/it style:
class TestWithdrawal:
    def test_raises_overdraft_when_balance_insufficient(self):
    def test_deducts_amount_from_balance(self):
    def test_records_transaction_in_history(self):
```

```javascript
// JavaScript/Jest with describe/it
describe('AccountService.withdraw', () => {
    it('should deduct amount from balance', () => { });
    it('should throw OverdraftError when balance is insufficient', () => { });
    it('should record transaction in history', () => { });
    it('should not modify balance when transaction fails', () => { });
});
```

```java
// Java
@Nested
class WhenBalanceIsSufficient {
    @Test void deductsAmountFromBalance() { }
    @Test void recordsTransactionInHistory() { }
    @Test void returnsUpdatedBalance() { }
}

@Nested
class WhenBalanceIsInsufficient {
    @Test void throwsOverdraftException() { }
    @Test void doesNotModifyBalance() { }
}
```

## Test Isolation

### Rules for Isolation

1. **No shared mutable state** between tests
2. **No dependency on test execution order**
3. **No filesystem, network, or database access** (mock external dependencies)
4. **Each test creates its own test fixtures**
5. **Tests should pass when run individually or in any order**

```python
# BAD: Shared mutable state
users_list = []

def test_add_user():
    users_list.append(User("Alice"))
    assert len(users_list) == 1

def test_add_another_user():
    users_list.append(User("Bob"))
    assert len(users_list) == 1  # FAILS because previous test modified list

# GOOD: Isolated tests
def test_add_user():
    users_list = []
    users_list.append(User("Alice"))
    assert len(users_list) == 1

def test_add_another_user():
    users_list = []
    users_list.append(User("Bob"))
    assert len(users_list) == 1
```

## Test Doubles Taxonomy

### Dummy

Objects passed around but never actually used. Fill parameter lists.

```python
def test_log_message_format():
    dummy_logger = object()  # Never called, just satisfies constructor
    service = NotificationService(logger=dummy_logger)
    message = service.format_message("Hello", recipient="alice@example.com")
    assert "Hello" in message
```

### Stub

Objects with pre-programmed return values. No assertion on how they were called.

```python
def test_get_user_returns_cached_value():
    # Stub: returns pre-programmed value
    cache_stub = Mock()
    cache_stub.get.return_value = {"id": 1, "name": "Alice"}

    service = UserService(cache=cache_stub)
    user = service.get_user(1)

    assert user["name"] == "Alice"
```

### Mock

Objects with pre-programmed expectations that verify they were called correctly.

```python
def test_send_notification_calls_email_service():
    # Mock: verifies interaction
    email_mock = Mock()
    service = NotificationService(email_client=email_mock)

    service.send_welcome("alice@example.com", "Alice")

    email_mock.send.assert_called_once_with(
        to="alice@example.com",
        subject="Welcome, Alice!",
        body=ANY
    )
```

### Spy

Wraps a real object and records calls while delegating to the real implementation.

```python
def test_event_bus_records_published_events():
    real_bus = EventBus()
    spy_bus = Mock(wraps=real_bus)  # Delegates to real implementation

    service = OrderService(event_bus=spy_bus)
    service.create_order(order_data)

    spy_bus.publish.assert_called_once()  # Verify it was called
    # The real EventBus.publish() was also executed
```

### Fake

Working implementations with shortcuts unsuitable for production.

## Mocking Strategies

### Python: unittest.mock

```python
from unittest.mock import Mock, patch, MagicMock, PropertyMock, call

# Patching a module-level function
@patch('myapp.services.requests.send')
def test_fetch_user_data(mock_get):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"name": "Alice"}

    result = fetch_user_data("user_123")

    assert result["name"] == "Alice"
    mock_get.assert_called_once_with("[reference URL]")

# Patching as context manager
def test_error_handling():
    with patch('myapp.services.requests.send') as mock_get:
        mock_get.side_effect = ConnectionError("Network down")
        with pytest.raises(ServiceUnavailableError):
            fetch_user_data("user_123")
# ... (condensed) ...
mock_service.process("data")
mock_service.stop()
mock_service.assert_has_calls([
    call.start(),
    call.process("data"),
    call.stop()
])
```

### JavaScript: Jest Mocks

```javascript
// Mock a module
jest.mock('./emailClient');
const { sendEmail } = require('./emailClient');

test('sends welcome email on registration', async () => {
    sendEmail.mockResolvedValue({ id: 'msg_123' });

    await registerUser({ email: 'alice@example.com', name: 'Alice' });

    expect(sendEmail).toHaveBeenCalledWith({
        to: 'alice@example.com',
        subject: expect.stringContaining('Welcome'),
        body: expect.any(String)
    });
});

// Spy on existing method
test('logs error when email fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    # ... (condensed) ...

    debounced('query');
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledWith('query');
});
```

### Java: Mockito

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private PaymentGateway paymentGateway;
    @Mock private InventoryService inventoryService;
    @Mock private EmailClient emailClient;
    @InjectMocks private OrderService orderService;

    @Test
    void processOrder_successfulPayment_sendsConfirmation() {
        // Arrange
        Order order = new Order("item_1", 2, 29.99);
        when(inventoryService.checkStock("item_1")).thenReturn(10);
        when(paymentGateway.charge(anyDouble())).thenReturn(new PaymentResult(true, "txn_123"));

        // Act
        orderService.processOrder(order);

        // Assert
        # ... (condensed) ...

        assertThrows(OutOfStockException.class, () -> orderService.processOrder(order));

        verify(paymentGateway, never()).charge(anyDouble());
        verify(emailClient, never()).sendConfirmation(any(), any());
    }
}
```

## Edge Case Coverage

### Systematic Edge Case Checklist

```
For numeric inputs:
  [ ] Zero
  [ ] Negative numbers
  [ ] Maximum value (Integer.MAX_VALUE, Number.MAX_SAFE_INTEGER)
  [ ] Minimum value
  [ ] Floating point precision (0.1 + 0.2)
  [ ] NaN, Infinity

For strings:
  [ ] Empty string ""
  [ ] Null / None / undefined
  [ ] Whitespace only "   "
  [ ] Very long string (exceeds typical limits)
  [ ] Unicode characters, emoji
  [ ] Special characters (<, >, &, quotes)
  [ ] SQL/HTML injection strings

For collections:
  [ ] Empty collection []
  # ... (condensed) ...
For dates/times:
  [ ] Leap year (Feb 29)
  [ ] End of year (Dec 31)
  [ ] Daylight saving time transitions
  [ ] Timezone boundaries
  [ ] Epoch (Jan 1, 1970)
  [ ] Far future dates
```

## Parameterized Tests

```python
# Python: pytest.mark.parametrize
@pytest.mark.parametrize("input_email,expected_valid", [
    ("alice@example.com", True),
    ("bob@test.co.uk", True),
    ("user+tag@domain.com", True),
    ("", False),
    ("no-at-sign.com", False),
    ("@no-local.com", False),
    ("spaces in@email.com", False),
    ("no-tld@domain", False),
])
def test_email_validation(input_email, expected_valid):
    assert validate_email(input_email) == expected_valid
```

```javascript
// JavaScript: Jest each
describe.each([
    { input: 'alice@example.com', expected: true },
    { input: 'bob@test.co.uk', expected: true },
    { input: '', expected: false },
    { input: 'no-at-sign.com', expected: false },
])('validateEmail($input)', ({ input, expected }) => {
    it(`returns ${expected}`, () => {
        expect(validateEmail(input)).toBe(expected);
    });
});

// Table syntax
test.each`
    a    | b    | expected
    ${1} | ${2} | ${3}
    ${3} | ${4} | ${7}
    ${0} | ${0} | ${0}
`('add($a, $b) returns $expected', ({ a, b, expected }) => {
    expect(add(a, b)).toBe(expected);
});
```

```java
// Java: JUnit @ParameterizedTest
@ParameterizedTest
@CsvSource({
    "alice@example.com, true",
    "bob@test.co.uk, true",
    "'', false",
    "no-at-sign.com, false",
})
void validateEmail(String input, boolean expected) {
    assertEquals(expected, EmailValidator.isValid(input));
}

@ParameterizedTest
@MethodSource("discountTestCases")
void calculateDiscount(String tier, double orderTotal, double expectedDiscount) {
    assertEquals(expectedDiscount, calculator.calculate(tier, orderTotal), 0.01);
}

static Stream<Arguments> discountTestCases() {
    return Stream.of(
        Arguments.of("bronze", 100.0, 5.0),
        Arguments.of("silver", 100.0, 10.0),
        Arguments.of("gold", 100.0, 15.0),
        Arguments.of("gold", 0.0, 0.0)
    );
}
```

## Assertion Best Practices

```python
# Be specific in assertions
assert result == expected                  # Good: exact match
assert result is not None                  # Good: existence check
assert "error" in result.message.lower()   # Good: partial match
assert len(results) == 3                   # Good: collection size
assert all(r.status == "active" for r in results)  # Good: collection predicate

# Bad: assert result (truthy check -- gives no useful failure message)

# Use pytest.approx for floating point
assert 0.1 + 0.2 == pytest.approx(0.3)

# Assert exceptions with context
with pytest.raises(ValueError, match="Invalid email format"):
    validate_email("not-an-email")

# Custom assertion messages
assert user.is_active, f"Expected user {user.id} to be active after registration"
```

## Test Organization

```
tests/
  unit/
    test_user_service.py        # Mirrors src/services/user_service.py
    test_order_calculator.py
    test_email_validator.py
  integration/
    test_user_repository.py
    test_payment_gateway.py
  fixtures/
    conftest.py                 # Shared fixtures
    factories.py                # Test data factories
```

### Fixture Management

```python
# conftest.py - shared fixtures
@pytest.fixture
def sample_user():
    return User(id=1, name="Alice", email="alice@example.com", tier="premium")

@pytest.fixture
def order_calculator():
    return OrderCalculator(tax_rate=0.08, currency="USD")

@pytest.fixture(autouse=True)
def reset_singletons():
    """Reset singleton state between tests."""
    yield
    ConfigManager._instance = None
```

## When to Use

**Use this skill when:**
- Designing or implementing unit test writer solutions
- Reviewing or improving existing unit test writer approaches
- Making architectural or implementation decisions about unit test writer
- Learning unit test writer patterns and best practices
- Troubleshooting unit test writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Unit Test Writer Analysis

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

**Input:** "Help me implement unit test writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended unit test writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When unit test writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
