---
name: mocking-patterns
description: |
  Guides expert-level mocking patterns implementation: tdd and design-patterns decision frameworks, production-ready patterns, and concrete templates for mocking patterns workflows.
  Use when the user asks about mocking patterns, mocking patterns configuration, or testing best practices for mocking projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing tdd design-patterns"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Mocking Patterns

## When to Use

**Use this skill when:**
- The user asks how to mock external dependencies (APIs, databases, file systems, message queues) in unit or integration tests
- The user wants to isolate a unit under test from collaborators that have side effects or non-deterministic behavior
- The user is experiencing flaky tests caused by real network calls, timing issues, or shared state
- The user needs to simulate error conditions, timeouts, or edge cases that are difficult to reproduce with real infrastructure
- The user wants to apply TDD and needs to design interfaces before implementations exist
- The user asks about the difference between mocks, stubs, spies, fakes, and dummies and when to use each
- The user's test suite is slow because it exercises real databases, services, or filesystems
- The user wants to verify that a unit interacts correctly with its collaborators -- not just that it returns the right value

**Do NOT use this skill when:**
- The user needs help writing integration or contract tests against real services -- see the integration-testing skill
- The user is asking about test data factories or fixture generation -- see the test-data-management skill
- The user wants end-to-end browser or UI automation -- see the e2e-testing skill
- The user needs help with dependency injection frameworks as an architectural pattern, not for testing isolation -- see the dependency-injection skill
- The user is asking about load or performance testing -- see the performance-testing skill
- The user wants advice on test coverage thresholds or CI pipeline configuration -- see the ci-testing-pipelines skill
- The user has a contract-testing problem involving Pact or consumer-driven contracts -- see the contract-testing skill

---

## Process

### 1. Classify What Kind of Test Double Is Actually Needed

Before writing a single line of mock code, determine which of the five test double categories applies. Using the wrong type is the single most common mocking mistake.

- **Dummy** -- an object passed to satisfy a parameter signature but never called. Use it when the parameter is required by the constructor or method signature but the code path under test never touches it. Create a `null` or empty struct -- do not wire up any behavior.
- **Stub** -- returns canned responses to specific calls. Use when the unit under test needs to read data from a collaborator. The stub does not verify it was called. A `UserRepository` stub that always returns a fixed `User` record is a stub.
- **Spy** -- a real or near-real object that records how it was called so you can assert on interactions after the fact. Use when you need to verify both the return value and the side-effect interaction. A spy email sender that accumulates sent messages is a spy.
- **Mock** -- a pre-programmed object with expectations set before the call. If the expectations are not met, the mock fails the test. Use mocks when verifying that the correct message was sent to a collaborator is the primary purpose of the test. Overuse of mocks leads to brittle, over-specified tests.
- **Fake** -- a lightweight working implementation (in-memory database, in-process message bus) that behaves like the real thing but without operational overhead. Use fakes for integration-level isolation where stubs would require too much setup.

Decision rule: default to stubs and fakes. Reach for mocks only when interaction verification is the point of the test. Avoid mocks when the return value is what matters.

### 2. Map the Dependency Graph of the Unit Under Test

Identify every collaborator the unit touches, then categorize each by cost and stability.

- Draw or mentally model the direct dependencies -- constructor-injected services, function arguments, module-level imports, global singletons, environment variables.
- Classify each dependency on two axes:
  - **Speed impact:** slow (real network, disk I/O, real database) vs. fast (in-process computation)
  - **Stability:** stable (a pure function you own) vs. volatile (third-party API, clock, random number generator, file system)
- Only mock volatile and/or slow dependencies. Never mock types you own unless you are specifically testing the interaction protocol.
- Identify seams -- points where the dependency can be replaced without restructuring the unit. Constructor injection, function arguments, and interface parameters are natural seams. Static method calls, `new` expressions inside methods, and global imports are anti-seams that require refactoring before mocking.

### 3. Refactor for Testability if Seams Are Missing

If the unit under test calls `new DatabaseConnection()` internally or imports a specific HTTP client module at the top level, you cannot mock without changing the production code.

- Apply **dependency injection** to expose the seam: pass the collaborator as a constructor parameter or function argument.
- Use the **Extract and Override** pattern in object-oriented code: extract the dependency creation into a protected virtual factory method, then override it in a test subclass.
- In functional languages or modules, use **parameter injection** or **higher-order functions** -- accept the effectful function as an argument rather than calling it directly.
- In languages with module systems (JavaScript/TypeScript), prefer constructor or argument injection over module-level import mocking because module mock patching is fragile, execution-order dependent, and creates implicit global state in the test runner.
- Rule of thumb: if you need more than three lines of setup to make a collaborator replaceable, the production code has a testability problem, not the test.

### 4. Choose the Right Tool for the Language and Framework

Match your mocking approach to the actual toolchain.

- **JavaScript/TypeScript:** Jest's `jest.fn()`, `jest.spyOn()`, and `jest.mock()` for module-level mocks. Prefer manual mocks in `__mocks__` directories for stable shared fakes. Use `msw` (Mock Service Worker) for HTTP boundary mocking at the network level instead of mocking `fetch` or `axios` directly.
- **Python:** `unittest.mock.MagicMock`, `unittest.mock.patch` as a decorator or context manager, and `pytest-mock`'s `mocker` fixture. Prefer `patch.object` over `patch` with string paths when possible -- string paths break silently on refactors. Use `responses` or `httpretty` for HTTP-level stubbing.
- **Java:** Mockito for most cases. Use `@Mock` with `MockitoExtension` (JUnit 5) rather than `MockitoAnnotations.initMocks()`. Use `@Captor` for argument capture instead of manual `ArgumentCaptor` instantiation. Avoid PowerMock except as a last resort -- its use signals a design problem.
- **Go:** Prefer interface-based hand-rolled fakes. Go's structural typing makes interface injection straightforward. Use `testify/mock` for explicit expectation-based mocking when needed. Avoid `go-mock` code generation unless the interface has more than six methods.
- **C#/.NET:** Moq or NSubstitute. NSubstitute has a more readable API for stubs; Moq is better when strict verification is required. Use `HttpMessageHandler` substitution for HTTP client mocking rather than wrapping `HttpClient` in a custom interface.
- **Rust:** Use trait objects with test-specific implementations. The `mockall` crate generates mock implementations for traits. For async, use `mockall`'s `async_trait` integration.

### 5. Write the Test Double Implementation

Apply these precise construction rules.

- **For stubs:** set up only the return values that the specific test scenario exercises. Do not pre-configure every possible method on every stub -- this over-specification makes tests fragile to unrelated changes.
- **For mocks with expectations:** set expectations before calling the unit under test, not after. Verify expectations explicitly if the framework does not auto-verify at test teardown.
- **Return realistic data, not placeholder data.** A stub that returns `userId: 1` and `email: "test@example.com"` is acceptable. A stub that returns `userId: 0` and `email: ""` will pass tests but hide bugs where the production code has special-case behavior for zero values or empty strings.
- **Simulate failure modes explicitly.** Create separate test cases where stubs throw exceptions, return error responses, or return `null`/`nil`/`None`. Do not only test the happy path with mocks.
- **Use builder patterns for complex fake data.** If constructing a realistic response object requires ten fields, create a `UserBuilder` or `ResponseBuilder` that provides sensible defaults and allows overriding specific fields per test.
- **Limit the scope of mocks.** In Jest, call `jest.clearAllMocks()` in `beforeEach` (not `afterAll`). In Python, prefer `patch` as a context manager so the patch is automatically reversed. In Mockito, annotate the test class with `@ExtendWith(MockitoExtension.class)` so mocks are torn down after each test.

### 6. Assert the Right Things

The assertion strategy determines whether the test actually provides value.

- **Stub-based tests:** assert on the output of the unit under test -- the return value, the emitted event, the state change. Do not assert that the stub was called unless the call itself is the behavior being specified.
- **Mock-based tests:** assert on the interaction protocol -- which method was called, with which arguments, how many times. Use argument matchers carefully: prefer exact argument matching over wildcard matchers when the argument value is meaningful.
- **Spy-based tests:** assert on both return value and interaction. Keep spy-based tests short -- if a single test needs to assert three interaction points, consider splitting into three focused tests.
- **Avoid asserting on implementation details.** If a test breaks every time a private method is renamed or a loop is replaced with a map operation, the test is coupled to implementation, not behavior.
- **Use `verify(mock, times(1)).method(args)` patterns for Mockito** rather than `verify(mock).method(args)` -- the explicit `times(1)` makes the intention clear and catches accidental double-invocation bugs.
- **Check that unexpected interactions did not occur.** In Mockito, call `verifyNoMoreInteractions(mock)` when you want to ensure no extra calls were made. In Jest, check `expect(mockFn).toHaveBeenCalledTimes(1)` rather than just `toHaveBeenCalled()`.

### 7. Organize Mock Infrastructure for Maintainability

Mocking code accumulates into technical debt faster than almost any other test code.

- **Create a shared fakes library** for collaborators used across many test files: `src/test/fakes/FakeUserRepository.ts`, `tests/fakes/fake_email_service.py`. Do not duplicate stub setup in every test file.
- **Use a mother pattern (Object Mother)** for building test doubles that return realistic domain objects: a `UserMother.activeUser()` factory returns a fully populated user stub result, `UserMother.suspendedUser()` returns the suspended variant.
- **Version fake implementations alongside the real interface.** When the real `PaymentGateway` interface adds a method, the `FakePaymentGateway` must be updated at the same time. Enforced by the compiler in typed languages; enforced by convention in dynamic languages.
- **Document which behaviors fakes do not implement.** A `FakeEmailService` that tracks sent messages but does not validate email format should have a comment stating this. Tests relying on validation must use a real validator or a different fake.
- **Separate mock setup from test logic.** A test method should read: arrange (set up fakes), act (call the unit), assert (check output). If the arrange section exceeds 10 lines, extract to a `setUp` method or a private helper.
- **Apply the Rule of Three for abstraction:** if the same stub setup appears in three or more tests, extract it into a shared helper or factory. Before that threshold, inline setup is clearer.

### 8. Review and Refactor the Test Suite

Apply these quality gates after implementing mocking patterns.

- Run the test suite with the mocks removed or replaced with real implementations in at least one integration test to confirm the mocked behavior matches the real behavior. This is the "sanity test" -- if the stub returns something the real system never returns, the tests are testing a fiction.
- Check the ratio of mock expectations to assertions. A test with five mock expectations and one assertion is usually over-specified. The mock expectations themselves should be minimal; the assertion is where the test value lives.
- Time the test suite before and after introducing mocks. Unit tests with mocks should run in under 10 ms per test. If they take longer, something real is still being called.
- Flag any test that mocks a type you own. Mocking your own domain types (not infrastructure adapters) is a signal that the design has coupling problems that mocking is hiding rather than solving.
- Enforce a policy: no `sleep()` or `time.sleep()` calls in unit tests. If a test needs to wait, it is calling something real or the production code has implicit timing dependencies that should be made explicit.

---

## Output Format

When responding to a user about mocking patterns, structure the response as follows:

```
## Test Double Classification

| Collaborator | Type | Rationale | Tool/Approach |
|---|---|---|---|
| [dependency name] | Stub / Fake / Mock / Spy | [why this type] | [specific tool] |

## Testability Assessment

**Seams available:** [list injection points already in place]
**Refactoring needed:** [list any changes required to enable mocking]

## Implementation

### Fake / Stub Definition
[complete, runnable code for the test double]

### Test with Mock
[complete, runnable test case using the double]

### Assertion Strategy
[what is verified and why]

## Common Mistakes to Avoid for This Scenario
[3-5 specific pitfalls relevant to the user's context]

## Maintenance Notes
[how to keep this mock infrastructure healthy over time]
```

---

## Rules

1. **Never mock what you do not own unless you wrap it first.** Third-party libraries should be wrapped in an adapter interface that you own. Mock the adapter, not the library. This prevents library upgrades from breaking dozens of test files simultaneously.

2. **Never use `jest.mock()` at the module level for a dependency that changes behavior between tests.** Module-level mocks in Jest are hoisted and shared across the entire test file. Use `jest.spyOn` with per-test setup and `jest.restoreAllMocks()` in `afterEach` when behavior needs to vary.

3. **Never stub the system under test.** The object being tested must be the real implementation. Stubbing or partial-mocking the unit under test (using `spy` on the class being tested) almost always means the design has a single-responsibility violation.

4. **Always inject dependencies at the constructor or function level, not at the class level via property mutation.** Property injection (`myService.dependency = mockDep`) creates invisible state that other tests can accidentally inherit.

5. **Never configure a stub to return a value that the real implementation cannot return.** If the real `getUserById()` always returns a `User` or throws, a stub that returns `null` creates a test that verifies handling of an impossible condition.

6. **Always reset mocks between tests.** In Jest use `jest.clearAllMocks()` in `beforeEach`. In Mockito use `@ExtendWith(MockitoExtension.class)`. In Python use `patch` as a context manager. Shared mock state between tests causes order-dependent failures that take hours to diagnose.

7. **Never use argument wildcards (`any()`, `anyString()`) when the argument value is meaningful to the contract being tested.** If the email address passed to `sendEmail()` matters, assert on the exact email address. Wildcards hide incorrect argument values.

8. **Keep the arrange section of a test under 15 lines.** If more setup is required, the unit under test has too many dependencies or the fake infrastructure is missing shared builders. Extract builders before expanding test setup.

9. **Never write a test that only mocks -- ensure at least one substantive assertion exists.** A test where every assertion is a mock expectation and none assert on the return value or state change provides almost no value -- it only verifies that calls happened, not that they produced correct results.

10. **Always run the test suite in random order at least once per sprint.** Order-dependent failures (caused by shared mock state leaking between tests) only surface when execution order changes. Pytest supports `--randomly-seed=random`, Jest supports `--randomize`.

---

## Edge Cases

### Mocking async code and Promises

When the code under test is async, stubs must return Promises or awaitables, not plain values. In JavaScript, `jest.fn().mockResolvedValue(data)` creates a stub that returns a resolved Promise. `jest.fn().mockRejectedValue(new Error('timeout'))` simulates a rejection. Do not use `Promise.resolve()` inline in test setup -- it obscures intent. In Python with `asyncio`, use `AsyncMock` from `unittest.mock` (available since Python 3.8) instead of `MagicMock` -- `MagicMock` does not return awaitables, and tests will pass spuriously if the `await` is missing. In Go, async is handled via goroutines and channels; use a fake that writes to a buffered channel and assert the channel contents.

### Mocking time and clocks

Never allow production code to call `Date.now()`, `datetime.now()`, `time.time()`, or `System.currentTimeMillis()` directly inside business logic. These are hidden dependencies on a global clock. Inject a clock abstraction: a `Clock` interface with a `now()` method. In tests, inject a `FakeClock` that returns a fixed timestamp. For JavaScript without a clock interface, Jest's `jest.useFakeTimers()` intercepts the global `Date` and timer functions -- always call `jest.useRealTimers()` in `afterEach` to prevent timer state from leaking. In Python, `freezegun.freeze_time('2024-01-15')` is the standard approach for patching datetime globally.

### Testing code that spawns goroutines, threads, or background workers

Test doubles used across goroutines or threads must be thread-safe. In Go, a fake that writes to a slice without a mutex will cause race conditions detectable by running tests with `-race`. Use a mutex-protected fake or a channel-based fake for concurrent scenarios. In Java, use `CountDownLatch` to synchronize test assertions with asynchronous completion rather than `Thread.sleep()`. In Python, `ThreadPoolExecutor` tests should use `concurrent.futures.wait()` with a timeout rather than sleeping.

### Legacy code with no injection seams (untestable code)

When working with legacy code that uses `new` expressions or static factory calls directly inside methods, the options in priority order are: (1) refactor to inject the dependency via a parameter -- the safest change; (2) use the Extract and Override pattern in OO code -- create a protected factory method that can be overridden in a test subclass; (3) use language-level bytecode manipulation tools (PowerMock for Java, `unittest.mock.patch` for Python static methods) as a last resort, and always tag these tests with a `@Legacy` or `# legacy-seam` comment so the team knows to remove the hack when the code is properly refactored. Never treat PowerMock or module-level patching as the permanent solution.

### Mocking HTTP boundaries -- the MSW/WireMock approach

Do not mock `fetch`, `axios`, `requests.get`, or `HttpClient` directly. These are library internals, not your abstractions. Instead:
- In JavaScript/TypeScript: use `msw` (Mock Service Worker) to intercept HTTP at the network level. Define handlers that match URL patterns and return controlled responses. This works identically in Node.js tests and browser tests.
- In Java: use WireMock as an embedded HTTP server in tests. Use `@WireMockTest` annotation and define stubs via `stubFor(get(urlEqualTo("/api/user/1")).willReturn(aResponse().withBody(json).withStatus(200)))`.
- In Python: use the `responses` library with `@responses.activate` decorator. Add responses with `responses.add(responses.GET, 'http://api.example.com/user/1', json=user_data, status=200)`.
- This approach tests the actual HTTP client configuration (headers, serialization, timeouts) rather than mocking it away.

### Fakes that need to support multiple test scenarios

A `FakeRepository` that must return different data in different tests should use a configurable seeding approach, not conditional logic based on input values. Seed the fake in the test's arrange phase: `fakeUserRepo.seed([user1, user2])` rather than `if (id == 1) return user1`. Conditional logic inside fakes becomes unmaintainable once more than three branches exist. The seed approach also makes test intent explicit -- the test declares exactly what data exists, rather than hiding it in the fake's internal logic.

### Circular mock dependencies

If stubbing collaborator A requires an instance of collaborator B, and stubbing B requires an instance of A, the production design has a circular dependency. Do not paper over this with partial mocks or complex stub wiring. Fix the design: introduce a third abstraction that both A and B depend on, or break the cycle by extracting the shared data into a value object that neither A nor B needs to produce via the other.

---

## Example

**Input:** "I have a Python `OrderProcessor` class that charges a customer's credit card and sends a confirmation email. Both the payment gateway and email service are external. My tests are hitting the real Stripe API and real SMTP server. How do I mock these properly?"

---

**Step 1 -- Classify the test doubles needed:**

| Collaborator | Type | Rationale |
|---|---|---|
| `PaymentGateway` (Stripe) | Stub + Fake | Returns charge result; no interaction verification needed for happy-path test; use Fake for failure scenarios |
| `EmailService` (SMTP) | Spy | Must verify that the correct email was sent with correct content |

---

**Step 2 -- Assess testability:**

The current code probably looks like this (untestable):

```python
# BEFORE -- not testable
import stripe
import smtplib

class OrderProcessor:
    def process(self, order):
        charge = stripe.Charge.create(amount=order.total, currency="usd")
        if charge.status == "succeeded":
            smtp = smtplib.SMTP("mail.example.com")
            smtp.sendmail("orders@example.com", order.customer_email, "Confirmed")
        return charge.status
```

The `stripe` module is called directly, and `smtplib.SMTP` is instantiated internally. There are no seams.

---

**Step 3 -- Refactor to inject dependencies:**

```python
# production interfaces (define these in your codebase)
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

@dataclass
class ChargeResult:
    status: str  # "succeeded" | "failed" | "pending"
    charge_id: str
    error_message: Optional[str] = None

@dataclass
class EmailMessage:
    to: str
    subject: str
    body: str

class PaymentGateway(ABC):
    @abstractmethod
    def charge(self, amount_cents: int, currency: str, customer_token: str) -> ChargeResult:
        ...

class EmailService(ABC):
    @abstractmethod
    def send(self, message: EmailMessage) -> None:
        ...

# refactored production code -- now testable
class OrderProcessor:
    def __init__(self, payment_gateway: PaymentGateway, email_service: EmailService):
        self._payment = payment_gateway
        self._email = email_service

    def process(self, order: "Order") -> ChargeResult:
        result = self._payment.charge(
            amount_cents=order.total_cents,
            currency="usd",
            customer_token=order.customer_token,
        )
        if result.status == "succeeded":
            self._email.send(EmailMessage(
                to=order.customer_email,
                subject="Order Confirmed",
                body=f"Your order {order.order_id} has been confirmed.",
            ))
        return result
```

---

**Step 4 -- Build the fakes:**

```python
# tests/fakes/fake_payment_gateway.py
from app.interfaces import PaymentGateway, ChargeResult

class FakePaymentGateway(PaymentGateway):
    """In-memory payment gateway for testing.
    
    NOTE: does not validate card numbers or tokens.
    NOTE: does not simulate network latency.
    """

    def __init__(self, result: ChargeResult):
        self._result = result
        self.charges_made: list[dict] = []

    def charge(self, amount_cents: int, currency: str, customer_token: str) -> ChargeResult:
        self.charges_made.append({
            "amount_cents": amount_cents,
            "currency": currency,
            "customer_token": customer_token,
        })
        return self._result


# tests/fakes/fake_email_service.py
from app.interfaces import EmailService, EmailMessage

class FakeEmailService(EmailService):
    """In-memory email spy for testing.
    
    Records all sent messages for assertion.
    """

    def __init__(self):
        self.sent_messages: list[EmailMessage] = []

    def send(self, message: EmailMessage) -> None:
        self.sent_messages.append(message)
```

---

**Step 5 -- Write the tests:**

```python
# tests/test_order_processor.py
import pytest
from dataclasses import dataclass
from app.order_processor import OrderProcessor
from app.interfaces import ChargeResult
from tests.fakes.fake_payment_gateway import FakePaymentGateway
from tests.fakes.fake_email_service import FakeEmailService

@dataclass
class Order:
    order_id: str
    total_cents: int
    currency: str
    customer_token: str
    customer_email: str


class TestOrderProcessorSuccessfulCharge:
    def setup_method(self):
        self.successful_charge = ChargeResult(
            status="succeeded",
            charge_id="ch_test_abc123",
        )
        self.payment = FakePaymentGateway(result=self.successful_charge)
        self.email = FakeEmailService()
        self.processor = OrderProcessor(
            payment_gateway=self.payment,
            email_service=self.email,
        )
        self.order = Order(
            order_id="ord_789",
            total_cents=4999,
            currency="usd",
            customer_token="tok_visa",
            customer_email="customer@example.com",
        )

    def test_returns_succeeded_status(self):
        result = self.processor.process(self.order)
        assert result.status == "succeeded"

    def test_charges_correct_amount(self):
        self.processor.process(self.order)
        assert len(self.payment.charges_made) == 1
        assert self.payment.charges_made[0]["amount_cents"] == 4999
        assert self.payment.charges_made[0]["currency"] == "usd"

    def test_sends_confirmation_email_to_customer(self):
        self.processor.process(self.order)
        assert len(self.email.sent_messages) == 1
        sent = self.email.sent_messages[0]
        assert sent.to == "customer@example.com"
        assert "ord_789" in sent.body

    def test_sends_exactly_one_email_on_success(self):
        self.processor.process(self.order)
        assert len(self.email.sent_messages) == 1


class TestOrderProcessorFailedCharge:
    def setup_method(self):
        self.failed_charge = ChargeResult(
            status="failed",
            charge_id="",
            error_message="insufficient_funds",
        )
        self.payment = FakePaymentGateway(result=self.failed_charge)
        self.email = FakeEmailService()
        self.processor = OrderProcessor(
            payment_gateway=self.payment,
            email_service=self.email,
        )
        self.order = Order(
            order_id="ord_790",
            total_cents=4999,
            currency="usd",
            customer_token="tok_declined",
            customer_email="customer@example.com",
        )

    def test_returns_failed_status(self):
        result = self.processor.process(self.order)
        assert result.status == "failed"

    def test_does_not_send_email_on_failed_charge(self):
        # Critical: no confirmation email should go out if payment failed
        self.processor.process(self.order)
        assert len(self.email.sent_messages) == 0


class TestOrderProcessorPaymentGatewayException:
    def test_propagates_gateway_exception(self):
        """If the payment gateway raises, the processor should not suppress it."""

        class ExplodingGateway(FakePaymentGateway.__bases__[0]):
            def charge(self, amount_cents, currency, customer_token):
                raise ConnectionError("Gateway unreachable")

        email = FakeEmailService()
        processor = OrderProcessor(
            payment_gateway=ExplodingGateway(result=None),
            email_service=email,
        )
        order = Order("ord_791", 4999, "usd", "tok_x", "x@example.com")

        with pytest.raises(ConnectionError, match="Gateway unreachable"):
            processor.process(order)

        assert len(email.sent_messages) == 0
```

---

**Assertion strategy summary:**

- The happy-path tests assert on return value AND interaction (amount charged, email sent). Both matter.
- The failure tests assert on what did NOT happen -- no email sent. This is as important as asserting what did happen.
- The exception test asserts that the exception propagates cleanly and that no email was sent in the error path.
- No test uses wildcard matchers. Every assertion targets a specific value.
- Each test class resets the fakes in `setup_method` -- no shared state between tests.

---

**Maintenance notes:**

- When `PaymentGateway.charge()` adds a new parameter (e.g., `idempotency_key`), the Python type checker will flag `FakePaymentGateway` as incomplete. Fix the fake alongside the real implementation -- never let fakes fall behind the interface.
- If more than five test classes use `FakePaymentGateway`, create a `PaymentGatewayMother` class with factory methods: `PaymentGatewayMother.always_succeeds()`, `PaymentGatewayMother.always_declines()`, `PaymentGatewayMother.returns_pending()`.
- Add a single integration test (marked `@pytest.mark.integration`) that calls the real Stripe test API with a test API key to confirm the adapter wrapping Stripe correctly translates responses into `ChargeResult`. This is the safety net confirming the fake mirrors reality.
