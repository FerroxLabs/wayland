---
name: python-error-handling
description: |
  Guides expert-level Python error handling: exception hierarchy design, custom exception classes, contextlib patterns, structured logging integration, error propagation strategies, and recovery patterns. Covers designing error handling that makes debugging faster.
  Use when the user asks about Python exception handling, designing custom exceptions, error propagation, logging strategy, or structuring error recovery in Python applications.
  Do NOT use when the user asks about Python project setup (use `python-project-setup`), async-specific error handling (use `python-async-patterns`), or language-agnostic error patterns (check framework-specific skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "python best-practices debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Python Error Handling

## When to Use

**Use this skill when:**
- User asks how to design a custom exception hierarchy for a Python library, package, or application layer
- User wants to translate exceptions across architectural boundaries (repository → service → API handler)
- User asks about exception chaining, `__cause__`, `__context__`, or `__suppress_context__` behavior
- User wants to integrate exception handling with `structlog`, `logging`, or OpenTelemetry spans
- User asks about retry patterns, exponential backoff, jitter, or circuit breaker logic in Python
- User wants to use `contextlib` for resource cleanup, error suppression, or scope-based error handling
- User asks why their stack traces are missing context, duplicated in logs, or swallowed silently
- User is designing error responses for a REST or GraphQL API and needs consistent error contracts
- User asks about `ExceptionGroup` and `except*` syntax introduced in Python 3.11

**Do NOT use this skill when:**
- User wants to scaffold a new Python project structure → use `python-project-setup`
- User is asking specifically about `asyncio.TaskGroup`, `async with`, or `async for` error semantics → use `python-async-patterns`
- User wants general Python idioms unrelated to error handling → use `python-idioms`
- User wants to write tests that assert exception raising, exception messages, or error paths → use `python-testing-patterns`
- User is asking about performance profiling, slow code, or memory errors → use `python-performance`
- User is asking about language-agnostic error handling patterns across multiple languages → check framework-specific skills

---

## Process

### 1. Identify the Architectural Layer and Error Domain

The single most important question before writing any exception class is: who is the consumer of this error? The answer determines the shape, granularity, and attributes of the exception.

- **Library code** (distributed as a package): Define a base exception in `exceptions.py` at the package root. Never let `requests.ConnectionError`, `sqlalchemy.exc.OperationalError`, or any third-party exception escape the library boundary -- catch and re-raise as your own type. Consumers should never need to import from your dependencies.
- **Application service layer** (business logic): Catch infrastructure exceptions (database errors, HTTP client errors, filesystem errors) and translate them to domain exceptions. `DatabaseUnavailableError` is meaningful to the service; `psycopg2.OperationalError` is not.
- **API handler layer** (Flask, FastAPI, Django): This is the terminal handling point. Catch domain exceptions, map to HTTP status codes, return structured JSON error responses, and log with full context. Never let `PaymentDeclinedError` propagate to the framework's default 500 handler.
- **CLI or script**: Use a top-level try/except around `main()`, log the exception, exit with a non-zero code. Do not print raw stack traces to stderr in production CLIs.
- **Worker / queue consumer**: Per-message error handling -- catch at the message processing boundary, decide whether to retry, dead-letter, or skip, then continue to the next message. The worker loop itself must not die from a single message failure.

Identify which layer you are in before choosing the exception type or propagation strategy.

### 2. Design the Exception Hierarchy

The hierarchy is a contract. Design it with the same care as a public API.

- **Create exactly one base exception per package or subsystem.** `class PaymentError(Exception)` for the payments package. Do not inherit from `RuntimeError`, `ValueError`, or other built-ins at the base level -- this creates confusing `isinstance` checks for callers.
- **Subclass by error category, never by error message.** `PaymentDeclinedError` and `PaymentGatewayTimeoutError` are valid categories. `PaymentDeclinedWithInsufficientFundsError` and `PaymentDeclinedWithExpiredCardError` are messages, not categories -- encode these as attributes.
- **Add structured attributes to every custom exception.** At minimum: `error_code` (a stable string constant callers can match on), and `context` (a `dict[str, object]` of machine-readable details). Do not put all context in the message string -- message strings break programmatic handling.
- **Use built-in exceptions correctly:**
  - `ValueError`: invalid value for a valid type (negative amount, empty string where non-empty required)
  - `TypeError`: wrong type entirely (str where int expected) -- usually raised by Python itself, rarely by application code
  - `KeyError`, `IndexError`, `AttributeError`: almost never catch these in application code; they indicate programming errors
  - `RuntimeError`: invariant violations, state machine violations, impossible conditions that indicate a bug
  - `NotImplementedError`: abstract method bodies only
- **Limit hierarchy depth to three levels.** `BaseError` → `CategoryError` → `SpecificError`. Deeper hierarchies are never worth the complexity.
- **Add a `retriable` boolean property** to your base exception if your system uses retries. Return `True` from gateway timeouts, `False` from validation errors. This prevents retry logic from needing to hard-code exception type lists.

### 3. Choose the Exception Propagation Strategy

For each exception site, apply this decision tree:

- **Can the current function recover completely and fulfill its contract?** → Recover, do not raise. Example: a cache miss falls back to the database silently.
- **Can the current function recover partially but needs to signal degraded behavior?** → Consider returning a result type (a `dataclass` with `success: bool` and `error: str | None`) rather than raising. Use this pattern sparingly -- it increases callsite complexity.
- **Does the exception need additional context before propagating?** → Use `raise DomainError("context message", context={"key": val}) from original_exc`. Always use `from` -- never use bare `raise NewError()` after catching another exception.
- **Is the exception from a third-party library that should not escape the boundary?** → Catch in a narrow adapter, translate, chain with `from`.
- **Is the error genuinely fatal and unrecoverable?** → Let it propagate unmodified to the top-level handler. Do not wrap `MemoryError`, `SystemExit`, or `KeyboardInterrupt`.
- **Is the operation optional and its failure inconsequential?** → Use `contextlib.suppress(SpecificError)` with a comment explaining why suppression is intentional.

Never use exception propagation as a substitute for return values in hot paths. Raising and catching exceptions has measurable overhead -- approximately 1-5 microseconds per raise/catch on CPython 3.11. In loops processing millions of items, use `if/else` for expected conditions.

### 4. Implement Exception Chaining Correctly

Exception chaining is the most commonly misused feature in Python error handling. Get it right:

- **`raise B from A`**: Sets `B.__cause__ = A` and `B.__suppress_context__ = True`. The traceback shows "The above exception was the direct cause of the following exception." Use this when you are deliberately translating an exception -- you know about `A` and are choosing to raise `B` instead.
- **`raise B` inside an `except A` block (implicit chaining)**: Sets `B.__context__ = A` and `B.__suppress_context__ = False`. The traceback shows "During handling of the above exception, another exception occurred." This happens by accident when you raise a new exception without `from`. Almost always unintentional in library code.
- **`raise B from None`**: Suppresses the context entirely. Use only when the original exception is an implementation detail that would be confusing or misleading to the caller (e.g., a `KeyError` during dict lookup that has no bearing on the semantic error).
- **Never lose the original exception.** If you find yourself catching an exception and raising a new one without `from`, the original exception and its traceback will still appear in the `__context__`, but it looks accidental. Make the chain explicit.
- **Accessing chain context in handlers**: `exc.__cause__` for explicit chain, `exc.__context__` for implicit chain. Structured logging should capture both.

### 5. Integrate with Structured Logging

Logging and exception handling are inseparable. Bad logging makes debugging in production impossible.

- **Log at the handling point, not the raising point.** Exceptions contain their own traceback -- no need to log before raising. The handler is the only place with enough context to log meaningfully. Logging at raise sites creates duplicate entries.
- **Use `logger.exception("message")` in every `except` block that handles (not re-raises).** This automatically calls `sys.exc_info()` to attach the current exception's traceback. `logger.error("message")` does not include the traceback.
- **Always include correlation context.** At minimum: `request_id`, `user_id` (or `correlation_id`), and the operation name. Use `logging.LoggerAdapter` or `structlog.contextvars.bind_contextvars()` to attach these once per request rather than at every log call.
- **Log structured fields, not interpolated strings.** Bad: `logger.error(f"Payment failed for user {user_id}: {e}")`. Good: `logger.error("payment_failed", extra={"user_id": user_id, "error_code": e.error_code, "amount": amount})`. Structured fields are queryable in Datadog, Splunk, and CloudWatch Logs Insights; interpolated strings are not.
- **Choose log level deliberately:**
  - `DEBUG`: expected conditions during development, decision branches, internal state
  - `INFO`: significant state transitions, successful completions of major operations
  - `WARNING`: recoverable errors, degraded mode, retried operations, deprecated usage
  - `ERROR`: unrecoverable errors that affect a single operation but the system continues
  - `CRITICAL`: conditions that affect the entire system's ability to operate
- **Never log sensitive data in exceptions.** Payment card numbers, passwords, session tokens, and PII must never appear in exception messages, context dicts, or log fields. Mask before logging: `card_last4 = card_number[-4:]`.
- **Configure a top-level exception handler** using `sys.excepthook` (for scripts) or `threading.excepthook` (for threads) to catch and log unhandled exceptions before Python prints the raw traceback.

### 6. Apply `contextlib` Patterns Correctly

`contextlib` provides the cleanest Python idioms for scope-based error handling. Use these before reaching for try/except:

- **`contextlib.suppress(*exceptions)`**: Replaces `try: ... except SomeError: pass`. Always add a comment -- suppression without explanation looks like a bug. Use it for optional operations: `with suppress(FileNotFoundError): config_path.unlink()`. Never suppress broad exceptions.
- **`contextlib.contextmanager`**: Write context managers as generators instead of classes. Use for resource cleanup patterns where `finally` needs custom logic. The `yield` is the body of the `with` block; wrap it in try/except/finally to handle errors during the block.
- **`contextlib.ExitStack`**: When you need to register a variable number of context managers, or when you conditionally add cleanup steps. Critical pattern for dynamic resource acquisition: open 0-N files, add them to the stack, and all are cleaned up on any error. `ExitStack.callback()` registers arbitrary cleanup functions without needing a context manager.
- **`contextlib.AbstractContextManager` and `contextlib.AbstractAsyncContextManager`**: Inherit from these when writing class-based context managers to get the `__enter__`/`__exit__` defaults and proper `isinstance` support.
- **Pattern for partial failure cleanup:**

```python
# ExitStack for conditional resource registration
from contextlib import ExitStack

def process_files(paths: list[Path]) -> None:
    with ExitStack() as stack:
        handles = [stack.enter_context(p.open()) for p in paths]
        # If any open() raises, previously opened files are closed
        do_work(handles)
```

### 7. Implement Retry and Circuit Breaker Patterns

Retry logic belongs at the boundary layer between your application and unreliable external dependencies.

- **Exponential backoff formula**: `delay = base_delay * (2 ** attempt) + random.uniform(0, jitter)`. Start with `base_delay=0.1` seconds, `max_delay=30` seconds, `max_attempts=5`, and `jitter=1.0` second. The jitter prevents thundering herd when many clients retry simultaneously after a service restart.
- **Only retry on retriable errors.** Network timeouts, 429 Too Many Requests, 503 Service Unavailable -- retriable. 400 Bad Request, 401 Unauthorized, 404 Not Found -- not retriable. Hard-coding these lists is fragile; use the `retriable` property on your exception classes instead.
- **Use `tenacity`** (the standard Python retry library) for production retry logic rather than writing your own. Key parameters: `wait=wait_exponential(multiplier=0.1, max=30)`, `stop=stop_after_attempt(5)`, `retry=retry_if_exception_type(RetriableError)`, `reraise=True`.
- **Circuit breaker state machine**: Three states -- CLOSED (normal), OPEN (failing, reject all calls immediately), HALF-OPEN (probe with one call). Transition CLOSED → OPEN after N consecutive failures within a time window (e.g., 5 failures in 60 seconds). Transition OPEN → HALF-OPEN after a reset timeout (e.g., 30 seconds). Transition HALF-OPEN → CLOSED on success, HALF-OPEN → OPEN on failure.
- **Log every retry attempt** at WARNING level with the attempt number, delay, and exception. Log the final failure at ERROR level. Log recovery (after retries succeed) at INFO level.
- **Implement a retry budget** for batch processors. If more than 20% of items in a batch fail, stop processing and raise a bulk error rather than retrying indefinitely.

### 8. Design API Error Response Contracts

The external error contract is as important as the exception hierarchy. Treat it as a public API.

- **Standardize on a single error response schema** across all endpoints. RFC 7807 (Problem Details for HTTP APIs) is the recommended standard for REST APIs:
  ```
  {"type": "errors/payment/declined", "title": "Payment Declined", "status": 402, "detail": "Card ending in 4242 was declined", "instance": "/payments/txn_abc123"}
  ```
- **Never include stack traces, file paths, SQL query strings, or internal identifiers** in API responses. These are security vulnerabilities and violate encapsulation.
- **Always include a `request_id`** (or `trace_id`) in the error response body AND as a response header (`X-Request-ID`). This allows the caller to correlate their error with your server logs.
- **Map exception types to status codes in a central registry** -- never in individual handlers. Use a dict of `{ExceptionType: HTTPStatus}` and a single error handler function that all routes funnel through.
- **Distinguish between client errors (4xx) and server errors (5xx) in error responses.** 4xx errors should have actionable `detail` messages the client can act on. 5xx errors should give minimal detail ("an internal error occurred") and rely on server-side logging.

---

## Output Format

When helping a user design error handling, produce the following artifacts in order:

### Artifact 1: Exception Hierarchy Module

```python
# src/{package}/exceptions.py
"""
Exception hierarchy for {package}.

All exceptions raised by this package inherit from {Package}Error.
Callers should catch {Package}Error to handle all errors, or specific
subclasses for targeted handling.
"""
from __future__ import annotations


class {Package}Error(Exception):
    """Base exception for all {package} operations.

    Attributes:
        error_code: A stable, machine-readable string identifying the error type.
            Format: {PACKAGE}_{CATEGORY}_{SPECIFIC} (e.g., PAYMENT_GATEWAY_TIMEOUT).
        context: Structured key-value data describing the error context.
            Suitable for structured logging and programmatic handling.
        retriable: Whether the operation that raised this error can be retried.
    """

    error_code: str = "{PACKAGE}_ERROR"
    retriable: bool = False

    def __init__(
        self,
        message: str,
        *,
        error_code: str | None = None,
        context: dict[str, object] | None = None,
    ) -> None:
        super().__init__(message)
        if error_code is not None:
            self.error_code = error_code
        self.context = context or {}

    def __repr__(self) -> str:
        return (
            f"{type(self).__name__}("
            f"error_code={self.error_code!r}, "
            f"context={self.context!r})"
        )


class {Package}ValidationError({Package}Error):
    """Raised when input data fails validation.

    This is a client error -- the caller provided invalid data.
    Maps to HTTP 400 Bad Request.
    """

    error_code = "{PACKAGE}_VALIDATION"
    retriable = False

    def __init__(self, field: str, reason: str) -> None:
        super().__init__(
            f"Validation failed for field '{field}': {reason}",
            context={"field": field, "reason": reason},
        )
        self.field = field
        self.reason = reason


class {Package}NotFoundError({Package}Error):
    """Raised when a requested resource does not exist.

    Maps to HTTP 404 Not Found.
    """

    error_code = "{PACKAGE}_NOT_FOUND"
    retriable = False

    def __init__(self, resource_type: str, identifier: str | int) -> None:
        super().__init__(
            f"{resource_type} not found: {identifier!r}",
            context={"resource_type": resource_type, "identifier": str(identifier)},
        )


class {Package}ConflictError({Package}Error):
    """Raised when an operation conflicts with existing state.

    Maps to HTTP 409 Conflict.
    """

    error_code = "{PACKAGE}_CONFLICT"
    retriable = False


class {Package}DependencyError({Package}Error):
    """Raised when an external dependency fails.

    This is an infrastructure error -- a downstream service or I/O operation failed.
    Maps to HTTP 502 Bad Gateway or 503 Service Unavailable.
    """

    error_code = "{PACKAGE}_DEPENDENCY"
    retriable = True

    def __init__(
        self,
        dependency_name: str,
        reason: str,
        *,
        retriable: bool = True,
    ) -> None:
        super().__init__(
            f"Dependency '{dependency_name}' failed: {reason}",
            context={"dependency": dependency_name, "reason": reason},
        )
        self.retriable = retriable
```

### Artifact 2: Boundary Adapter Pattern

```python
# Adapter that isolates a third-party dependency and translates exceptions
import logging
from contextlib import contextmanager
from typing import Generator

logger = logging.getLogger(__name__)


@contextmanager
def _translate_{dependency}_errors(
    operation: str,
    **log_context: object,
) -> Generator[None, None, None]:
    """Context manager that catches {dependency} errors and raises domain exceptions."""
    try:
        yield
    except {Dependency}.TimeoutError as exc:
        logger.warning(
            "{dependency}_timeout",
            extra={"operation": operation, **log_context},
        )
        raise {Package}DependencyError(
            "{dependency}",
            f"Timeout during {operation}",
            retriable=True,
        ) from exc
    except {Dependency}.AuthError as exc:
        logger.error(
            "{dependency}_auth_failed",
            extra={"operation": operation, **log_context},
        )
        raise {Package}DependencyError(
            "{dependency}",
            f"Authentication failed during {operation}",
            retriable=False,
        ) from exc
```

### Artifact 3: API Error Handler Registry

```python
# src/{package}/api/error_handlers.py
import logging
import uuid
from http import HTTPStatus
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

# RFC 7807 Problem Details response schema
@dataclass
class ProblemDetail:
    type: str                          # URI reference identifying the problem type
    title: str                         # Short human-readable summary
    status: int                        # HTTP status code
    detail: str                        # Human-readable explanation for this occurrence
    instance: str                      # URI reference to this specific occurrence
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    extensions: dict[str, Any] = field(default_factory=dict)


# Central exception-to-status mapping
EXCEPTION_STATUS_MAP: dict[type[Exception], HTTPStatus] = {
    {Package}ValidationError:  HTTPStatus.BAD_REQUEST,           # 400
    {Package}NotFoundError:    HTTPStatus.NOT_FOUND,             # 404
    {Package}ConflictError:    HTTPStatus.CONFLICT,              # 409
    {Package}DependencyError:  HTTPStatus.BAD_GATEWAY,           # 502
}

# User-facing titles (never expose internal error_code here)
EXCEPTION_TITLE_MAP: dict[type[Exception], str] = {
    {Package}ValidationError:  "Invalid Request",
    {Package}NotFoundError:    "Resource Not Found",
    {Package}ConflictError:    "Conflict",
    {Package}DependencyError:  "Service Temporarily Unavailable",
}
```

### Artifact 4: Retry Decorator

```python
# src/{package}/retry.py
import logging
import random
import time
from collections.abc import Callable
from functools import wraps
from typing import TypeVar

from .exceptions import {Package}Error

logger = logging.getLogger(__name__)
F = TypeVar("F", bound=Callable)


def with_retry(
    *,
    max_attempts: int = 5,
    base_delay: float = 0.1,   # seconds
    max_delay: float = 30.0,   # seconds
    jitter: float = 1.0,       # seconds of random jitter
) -> Callable[[F], F]:
    """Decorator: retry a function on retriable {Package}Errors.

    Uses exponential backoff with full jitter:
        delay = min(base_delay * 2^attempt, max_delay) + uniform(0, jitter)
    """
    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exc: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except {Package}Error as exc:
                    if not exc.retriable:
                        raise
                    last_exc = exc
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    delay += random.uniform(0, jitter)
                    logger.warning(
                        "retry_attempt",
                        extra={
                            "function": func.__qualname__,
                            "attempt": attempt + 1,
                            "max_attempts": max_attempts,
                            "delay_seconds": round(delay, 3),
                            "error_code": exc.error_code,
                        },
                    )
                    time.sleep(delay)
            raise last_exc  # type: ignore[misc]
        return wrapper  # type: ignore[return-value]
    return decorator
```

---

## Rules

1. **Never use bare `except:` or `except Exception:` as a terminal handler.** The only legitimate uses of `except Exception` are: (a) at the absolute top-level handler of a process to log and exit cleanly, and (b) in an adapter that must catch everything from an unsafe third-party call. In both cases, re-raise or translate -- never silently swallow.

2. **Always use `raise NewError(...) from original_exc` when translating exceptions.** Bare `raise NewError(...)` inside an `except` block creates implicit chaining (`__context__`) that looks accidental. Explicit `from` chains create `__cause__`, which is surfaced clearly in tracebacks and tells the reader the translation was intentional.

3. **Never put business logic inside `except` blocks.** An `except` block should do exactly three things: (1) optionally log, (2) optionally translate the exception, (3) re-raise or return. If you find yourself computing values, making decisions, or calling other services inside `except`, extract that logic into a separate function.

4. **Always define `error_code` as a class-level attribute, not an instance parameter.** Class-level `error_code = "PAYMENT_DECLINED"` means you can match on it without instantiating the exception. Instance-level overrides are allowed but should be rare. Never generate error codes dynamically -- they must be stable across code versions because monitoring alerts depend on them.

5. **Never use exceptions for expected control flow in performance-sensitive code.** Raising and catching an exception on CPython 3.11 costs approximately 1-5 microseconds in the happy case (no match) and 5-20 microseconds when caught. In a loop iterating over 10,000 items per second, exception-based flow control adds 50-200 ms of overhead. Use `if/else` for expected conditions; reserve exceptions for genuinely exceptional paths.

6. **Always include the original exception as `__cause__` when wrapping.** If you wrap a `psycopg2.OperationalError` in a `DatabaseUnavailableError`, the DBA debugging a production incident needs to see the original PostgreSQL error code and message. Losing `__cause__` makes RCA impossible from logs alone.

7. **Never expose internal error details in API responses.** This includes: stack traces, file paths, SQL query strings, internal variable names, database row IDs, and third-party error codes. These are both security vulnerabilities (information disclosure) and contract violations (internal implementation details). Log them server-side; return only `error_code`, `message`, and `request_id` to the client.

8. **Always log at the handling point with `logger.exception()`, never at the raise point.** `logger.exception()` calls `sys.exc_info()` internally to capture the active exception and attach its traceback to the log record. `logger.error()` does not. Logging at the raise site before re-raising creates duplicate log entries with incomplete context -- the handler has request IDs, user IDs, and operation context that the raise site does not.

9. **Never catch `BaseException` subclasses that are not `Exception`.** `KeyboardInterrupt`, `SystemExit`, and `GeneratorExit` inherit from `BaseException` directly. Catching them with `except BaseException` or `except (KeyboardInterrupt, SystemExit)` in application code prevents clean process shutdown. The only legitimate place to catch these is a top-level process supervisor that needs to perform final cleanup before exiting.

10. **Always test the unhappy path as rigorously as the happy path.** Every custom exception class must have at least one test that: (a) asserts it is raised under the correct conditions, (b) asserts the `error_code` and `context` attributes have the expected values, (c) asserts `__cause__` is set correctly when exception chaining is used. Exception hierarchies that are not tested will drift, and `isinstance` checks in handlers will silently fail to match.

---

## Edge Cases

### Third-Party Libraries That Raise Generic `Exception` or `BaseException`

Some poorly designed libraries raise `Exception("something went wrong")` with no subclassing. This is unfortunately common in older HTTP clients, database drivers, and XML parsing libraries.

**Handling strategy:**
1. Wrap every call to the library in an adapter method -- never call library functions directly from service code.
2. In the adapter, catch the broad `Exception`, inspect `str(exc)` or `exc.args[0]` to classify the error, and raise a specific domain exception.
3. Document the library version and the behavior in a comment, because this adapter will need updating when the library improves its exceptions.
4. File a bug report with the library maintainers.

```python
try:
    result = bad_library.do_thing(params)
except Exception as exc:  # bad_library raises bare Exception -- see issue #1234
    msg = str(exc).lower()
    if "timeout" in msg:
        raise MyTimeoutError("operation timed out") from exc
    if "auth" in msg or "unauthorized" in msg:
        raise MyAuthError("authentication failed") from exc
    raise MyDependencyError("bad_library", str(exc)) from exc
```

### `ExceptionGroup` and `except*` in Python 3.11+

`ExceptionGroup` is raised by `asyncio.TaskGroup` when multiple concurrent tasks fail simultaneously. It is also useful for validation that collects all errors before raising (rather than failing fast on the first).

**Key behaviors:**
- `except* ValidationError as eg:` catches all `ValidationError` instances from the group and binds them to `eg.exceptions` (a tuple).
- You can have multiple `except*` clauses; each runs if any exception in the group matches its type.
- If an `except*` clause re-raises, it re-raises only the matched subgroup.
- Non-matched exceptions propagate as a new `ExceptionGroup`.
- `ExceptionGroup` does not yet have full support in all logging libraries -- `logger.exception()` may not fully unpack nested groups. Use `traceback.print_exception()` or `logging.handlers` that support Python 3.11+ for full group tracebacks.
- For pre-3.11 compatibility, use the `exceptiongroup` backport package.

### Silent Exception Swallowing in `__del__` and `__exit__`

Python silently discards exceptions raised in `__del__` methods -- they are printed to `sys.stderr` but not propagated. Exceptions raised in `__exit__` when another exception is active are also silently suppressed unless `__exit__` re-raises them explicitly.

**Rules:**
- Never raise exceptions in `__del__`. Use `contextlib.contextmanager` or explicit `close()` methods instead.
- In `__exit__(self, exc_type, exc_val, exc_tb)`: if `exc_type is not None`, you are handling an active exception. If your cleanup raises, Python discards both and raises only your new exception -- the original is lost. Log the cleanup failure at WARNING level; do not raise during cleanup.
- Return `False` (or `None`) from `__exit__` to propagate the original exception. Return `True` only to suppress it -- this is almost never correct outside of `contextlib.suppress`.

### Exceptions in Long-Running Batch Processors

A batch processor that dies on the first error wastes all work done before the failure. A batch processor that silently ignores all errors produces incorrect output. Design explicit failure bookkeeping:

```python
@dataclass
class BatchResult:
    processed: int = 0
    failed: int = 0
    errors: list[tuple[str, str]] = field(default_factory=list)  # (item_id, error_code)

    @property
    def failure_rate(self) -> float:
        total = self.processed + self.failed
        return self.failed / total if total > 0 else 0.0
```

Set a failure rate threshold (e.g., 20%). If `result.failure_rate > 0.20`, raise a bulk error to halt further processing -- continued processing at high failure rates wastes resources and may corrupt downstream state. Log each individual failure at WARNING level with item context; log the bulk abort at ERROR level with aggregate statistics.

### Exception Hierarchy Versioning in Public Libraries

Changing exception hierarchies in a library is a breaking change. Adding a new subclass is non-breaking (existing `isinstance(e, BaseError)` checks still work). Removing an exception class, changing its `__init__` signature, or moving it in the hierarchy all break callers.

**Rules for library maintainers:**
- Treat exception classes as public API -- document them, version them, and deprecate before removing.
- To deprecate: add a `DeprecationWarning` in `__init__`, keep the class for two major versions, then remove.
- To add a new subclass under an existing class: safe at any time -- existing handlers that catch the parent class continue to work.
- To change what exception is raised for a given condition: always a major version bump, because callers have `except SpecificError` statements that will stop matching.

### Thread-Safety in Exception Context Variables

`structlog.contextvars` and `logging.LoggerAdapter` extra dicts are thread-local when used correctly, but a common mistake is sharing a mutable context dict across threads:

```python
# WRONG: shared mutable dict will mix context from different threads
shared_context = {"app": "myapp"}
logger = logging.LoggerAdapter(logging.getLogger(__name__), shared_context)

# CORRECT: use thread-local or contextvars-based context binding
import structlog
structlog.contextvars.bind_contextvars(request_id=request_id, user_id=user_id)
```

In async code, `contextvars.ContextVar` is task-local -- each `asyncio.Task` gets its own copy via `Context.run()`. This is correct behavior for request-scoped logging context. However, if you spawn threads from async code (using `loop.run_in_executor()`), the `contextvars` context is copied at thread creation time and not shared back. Pass explicit context arguments to thread pool functions.

---

## Example

**Input:** "I am building a payment processing microservice in Python. It needs to: validate order data, call an external Stripe-like gateway, save records to PostgreSQL, and return structured JSON errors to a FastAPI frontend. I want retry logic on gateway failures and consistent error logging. How do I design the complete error handling?"

**Output:**

```python
# src/payments/exceptions.py
"""
Payment service exception hierarchy.

All exceptions raised by this package inherit from PaymentError.
error_code values are stable across releases and used by monitoring alerts.
"""
from __future__ import annotations


class PaymentError(Exception):
    """Base exception for all payment service operations."""

    error_code: str = "PAYMENT_ERROR"
    retriable: bool = False

    def __init__(
        self,
        message: str,
        *,
        error_code: str | None = None,
        context: dict[str, object] | None = None,
    ) -> None:
        super().__init__(message)
        if error_code is not None:
            self.error_code = error_code
        self.context = context or {}

    def __repr__(self) -> str:
        return (
            f"{type(self).__name__}("
            f"error_code={self.error_code!r}, "
            f"context={self.context!r})"
        )


class PaymentValidationError(PaymentError):
    """Input data failed validation. Client error -- do not retry."""

    error_code = "PAYMENT_VALIDATION"
    retriable = False

    def __init__(self, field: str, reason: str) -> None:
        super().__init__(
            f"Invalid field '{field}': {reason}",
            context={"field": field, "reason": reason},
        )
        self.field = field
        self.reason = reason


class PaymentDeclinedError(PaymentError):
    """Gateway declined the payment. Not an infrastructure failure."""

    error_code = "PAYMENT_DECLINED"
    retriable = False

    def __init__(self, decline_code: str, decline_message: str) -> None:
        super().__init__(
            f"Payment declined ({decline_code}): {decline_message}",
            context={
                "decline_code": decline_code,
                # decline_message may contain card details -- sanitize
                "decline_message": decline_message[:100],
            },
        )
        self.decline_code = decline_code


class PaymentGatewayError(PaymentError):
    """Gateway returned an unexpected error or timed out. May be retriable."""

    error_code = "PAYMENT_GATEWAY"
    retriable = True

    def __init__(
        self,
        gateway_status: int,
        gateway_message: str,
        *,
        retriable: bool = True,
    ) -> None:
        super().__init__(
            f"Gateway error (HTTP {gateway_status}): {gateway_message}",
            context={
                "gateway_status": gateway_status,
                "gateway_message": gateway_message[:200],
            },
        )
        self.gateway_status = gateway_status
        self.retriable = retriable


class PaymentPersistenceError(PaymentError):
    """Database operation failed. Always retriable for transient failures."""

    error_code = "PAYMENT_PERSISTENCE"
    retriable = True


class PaymentNotFoundError(PaymentError):
    """Requested payment record does not exist."""

    error_code = "PAYMENT_NOT_FOUND"
    retriable = False

    def __init__(self, payment_id: str) -> None:
        super().__init__(
            f"Payment not found: {payment_id}",
            context={"payment_id": payment_id},
        )


# src/payments/gateway_adapter.py
"""
Adapter that isolates the external payment gateway dependency.
All gateway exceptions are translated to domain exceptions here.
No gateway exception type escapes this module.
"""
import logging
from contextlib import contextmanager
from typing import Any, Generator

import httpx  # example HTTP client

from .exceptions import PaymentDeclinedError, PaymentGatewayError

logger = logging.getLogger(__name__)

# Gateway decline codes that map to business logic, not infrastructure failures
_DECLINE_CODES = {"card_declined", "insufficient_funds", "expired_card", "do_not_honor"}


@contextmanager
def _translate_gateway_errors(
    operation: str, **log_context: object
) -> Generator[None, None, None]:
    """Translates all gateway HTTP and network errors to domain exceptions."""
    try:
        yield
    except httpx.TimeoutException as exc:
        logger.warning(
            "gateway_timeout",
            extra={"operation": operation, **log_context},
        )
        raise PaymentGatewayError(
            504, f"Gateway timeout during {operation}", retriable=True
        ) from exc
    except httpx.NetworkError as exc:
        logger.warning(
            "gateway_network_error",
            extra={"operation": operation, "error": str(exc), **log_context},
        )
        raise PaymentGatewayError(
            0, f"Network error during {operation}", retriable=True
        ) from exc
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        body: dict[str, Any] = {}
        try:
            body = exc.response.json()
        except Exception:
            pass

        gateway_code = body.get("error", {}).get("code", "unknown")
        gateway_message = body.get("error", {}).get("message", "no message")

        if status == 402 or gateway_code in _DECLINE_CODES:
            # 402 = payment declined -- this is a business outcome, not a failure
            logger.info(
                "payment_declined_by_gateway",
                extra={
                    "decline_code": gateway_code,
                    "operation": operation,
                    **log_context,
                },
            )
            raise PaymentDeclinedError(gateway_code, gateway_message) from exc

        retriable = status in (429, 500, 502, 503, 504)
        logger.error(
            "gateway_http_error",
            extra={
                "status": status,
                "gateway_code": gateway_code,
                "operation": operation,
                **log_context,
            },
        )
        raise PaymentGatewayError(
            status, gateway_message, retriable=retriable
        ) from exc


class GatewayAdapter:
    def __init__(self, base_url: str, api_key: str, timeout: float = 10.0) -> None:
        self._client = httpx.Client(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=timeout,
        )

    def charge(
        self, *, amount_cents: int, currency: str, payment_method_id: str
    ) -> dict[str, Any]:
        with _translate_gateway_errors(
            "charge", amount_cents=amount_cents, currency=currency
        ):
            response = self._client.post(
                "/v1/payment_intents",
                json={
                    "amount": amount_cents,
                    "currency": currency,
                    "payment_method": payment_method_id,
                    "confirm": True,
                },
            )
            response.raise_for_status()
            return response.json()


# src/payments/retry.py
import logging
import random
import time
from collections.abc import Callable
from functools import wraps
from typing import TypeVar

from .exceptions import PaymentError

logger = logging.getLogger(__name__)
F = TypeVar("F", bound=Callable)


def with_retry(
    *,
    max_attempts: int = 5,
    base_delay: float = 0.1,
    max_delay: float = 30.0,
    jitter: float = 1.0,
) -> Callable[[F], F]:
    """Retry on retriable PaymentErrors with exponential backoff + full jitter.

    delay formula: min(base_delay * 2^attempt, max_delay) + uniform(0, jitter)
    """
    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exc: PaymentError | None = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except PaymentError as exc:
                    if not exc.retriable:
                        raise  # Non-retriable -- propagate immediately
                    last_exc = exc
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    delay += random.uniform(0, jitter)
                    logger.warning(
                        "payment_retry",
                        extra={
                            "function": func.__qualname__,
                            "attempt": attempt + 1,
                            "max_attempts": max_attempts,
                            "delay_seconds": round(delay, 3),
                            "error_code": exc.error_code,
                        },
                    )
                    time.sleep(delay)
            # All attempts exhausted -- re-raise the last exception
            raise last_exc  # type: ignore[misc]
        return wrapper  # type: ignore[return-value]
    return decorator


# src/payments/service.py
"""
Payment service: orchestrates validation, gateway calls, and persistence.
This is the boundary where infrastructure exceptions are caught and domain
exceptions are propagated upward.
"""
import logging
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

import psycopg2

from .exceptions import (
    PaymentError,
    PaymentGatewayError,
    PaymentPersistenceError,
    PaymentValidationError,
)
from .gateway_adapter import GatewayAdapter
from .retry import with_retry

logger = logging.getLogger(__name__)

_SUPPORTED_CURRENCIES = {"USD", "EUR", "GBP", "CAD", "AUD"}
_MAX_AMOUNT = Decimal("999999.99")
_MIN_AMOUNT = Decimal("0.50")


@dataclass
class PaymentResult:
    transaction_id: str
    status: str
    amount_cents: int
    currency: str


class PaymentService:
    def __init__(self, gateway: GatewayAdapter, db_conn) -> None:
        self._gateway = gateway
        self._db = db_conn

    def process_payment(
        self,
        *,
        order_id: str,
        amount_str: str,
        currency: str,
        payment_method_id: str,
    ) -> PaymentResult:
        """Process a payment end-to-end with validation, gateway call, and persistence.

        Raises:
            PaymentValidationError: Input data is invalid.
            PaymentDeclinedError: Gateway declined the payment.
            PaymentGatewayError: Gateway experienced a technical failure.
            PaymentPersistenceError: Database write failed.
        """
        # 1. Validate inputs
        amount = self._validate_amount(amount_str)
        self._validate_currency(currency)

        amount_cents = int(amount * 100)

        # 2. Call gateway (with retry via decorator on _charge_with_retry)
        gateway_result = self._charge_with_retry(
            amount_cents=amount_cents,
            currency=currency,
            payment_method_id=payment_method_id,
            order_id=order_id,
        )

        # 3. Persist record
        transaction_id = gateway_result["id"]
        self._save_payment_record(
            order_id=order_id,
            transaction_id=transaction_id,
            amount_cents=amount_cents,
            currency=currency,
        )

        logger.info(
            "payment_processed",
            extra={
                "order_id": order_id,
                "transaction_id": transaction_id,
                "amount_cents": amount_cents,
                "currency": currency,
            },
        )

        return PaymentResult(
            transaction_id=transaction_id,
            status=gateway_result["status"],
            amount_cents=amount_cents,
            currency=currency,
        )

    @with_retry(max_attempts=5, base_delay=0.1, max_delay=30.0, jitter=1.0)
    def _charge_with_retry(
        self, *, amount_cents: int, currency: str, payment_method_id: str, order_id: str
    ) -> dict:
        return self._gateway.charge(
            amount_cents=amount_cents,
            currency=currency,
            payment_method_id=payment_method_id,
        )

    def _save_payment_record(
        self,
        *,
        order_id: str,
        transaction_id: str,
        amount_cents: int,
        currency: str,
    ) -> None:
        try:
            with self._db.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO payments (order_id, transaction_id, amount_cents, currency)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (order_id, transaction_id, amount_cents, currency),
                )
            self._db.commit()
        except psycopg2.IntegrityError as exc:
            self._db.rollback()
            logger.error(
                "payment_duplicate_record",
                extra={"order_id": order_id, "transaction_id": transaction_id},
            )
            # IntegrityError = duplicate key -- this is a conflict, not a transient failure
            from .exceptions import PaymentError
            raise PaymentError(
                f"Payment record already exists for order {order_id}",
                error_code="PAYMENT_DUPLICATE",
                context={"order_id": order_id, "transaction_id": transaction_id},
            ) from exc
        except psycopg2.OperationalError as exc:
            self._db.rollback()
            logger.exception(
                "payment_db_write_failed",
                extra={"order_id": order_id, "transaction_id": transaction_id},
            )
            raise PaymentPersistenceError(
                f"Failed to persist payment record for order {order_id}",
                context={"order_id": order_id},
            ) from exc

    @staticmethod
    def _validate_amount(amount_str: str) -> Decimal:
        try:
            amount = Decimal(amount_str)
        except InvalidOperation:
            raise PaymentValidationError("amount", f"not a valid decimal: {amount_str!r}")
        if amount < _MIN_AMOUNT:
            raise PaymentValidationError(
                "amount", f"must be >= {_MIN_AMOUNT} (got {amount})"
            )
        if amount > _MAX_AMOUNT:
            raise PaymentValidationError(
                "amount", f"must be <= {_MAX_AMOUNT} (got {amount})"
            )
        return amount

    @staticmethod
    def _validate_currency(currency: str) -> None:
        if currency not in _SUPPORTED_CURRENCIES:
            raise PaymentValidationError(
                "currency",
                f"must be one of {sorted(_SUPPORTED_
