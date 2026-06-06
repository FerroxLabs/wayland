---
name: error-handler
description: |
  Error handling architecture covering error hierarchy design, error codes vs exceptions, retry strategies, graceful degradation, error logging, user-facing messages, and error boundary patterns.
  Use when the user asks about error handler, error handler best practices, or needs guidance on error handler implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices debugging guide"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Error Handler

You are an expert in error handling architecture. Design error handling systems that are predictable, debuggable, and user-friendly. Errors are a feature, not an afterthought. Every error path must be intentional.

## Error Handling Principles

1. **Fail fast**: Detect errors as early as possible, as close to the source as possible.
2. **Fail loudly**: Log errors with sufficient context to diagnose without reproduction.
3. **Fail gracefully**: Never crash the entire system for a single request failure.
4. **Fail informatively**: Give users actionable messages, give developers diagnostic data.
5. **Handle or propagate, never swallow**: Every error is either handled or explicitly re-thrown.

## Error Hierarchy Design

### Designing an Error Class Hierarchy

```
ApplicationError (base)
  |
  +-- ValidationError
  |     +-- InvalidInputError
  |     +-- MissingFieldError
  |     +-- OutOfRangeError
  |
  +-- AuthenticationError
  |     +-- InvalidCredentialsError
  |     +-- TokenExpiredError
  |
  +-- AuthorizationError
  |     +-- InsufficientPermissionsError
  |
  +-- NotFoundError
  |     +-- UserNotFoundError
  |     +-- ResourceNotFoundError
  |
  +-- ConflictError
  |     +-- DuplicateEntryError
  |     +-- OptimisticLockError
  |
  +-- ExternalServiceError
  |     +-- TimeoutError
  |     +-- ServiceUnavailableError
  |
  +-- InternalError
        +-- DatabaseError
        +-- ConfigurationError
```

### Implementation Pattern (TypeScript)
```typescript
class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational: boolean = true,
    context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, true, context);
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(
      `${resource} not found: ${id}`,
      "NOT_FOUND",
      404,
      true,
      { resource, id }
    );
  }
}
```

### Implementation Pattern (Python)
```python
class ApplicationError(Exception):
    def __init__(self, message, code, status_code=500, is_operational=True, context=None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.is_operational = is_operational
        self.context = context or {}

class ValidationError(ApplicationError):
    def __init__(self, message, field=None):
        super().__init__(message, "VALIDATION_ERROR", 400, context={"field": field})

class NotFoundError(ApplicationError):
    def __init__(self, resource, resource_id):
        super().__init__(
            f"{resource} not found: {resource_id}",
            "NOT_FOUND", 404,
            context={"resource": resource, "id": resource_id}
        )
```

## Error Codes vs Exceptions

### When to Use Exceptions
- Language idiom supports it (Python, Java, JavaScript, C#).
- The error is truly exceptional (not a normal control flow path).
- The error needs to propagate up multiple call stack frames.
- You need a stack trace for debugging.

### When to Use Error Codes / Result Types
- Language idiom prefers it (Go, Rust, C).
- Performance is critical (exceptions are expensive in some runtimes).
- The "error" is an expected outcome (e.g., item not found in a search).
- You want exhaustive error handling enforced by the compiler.

### Go Error Pattern
```go
func GetUser(id string) (*User, error) {
    user, err := db.FindUser(id)
    if err != nil {
        return nil, fmt.Errorf("GetUser(%s): %w", id, err)
    }
    if user == nil {
        return nil, ErrNotFound
    }
    return user, nil
}
```

### Rust Result Pattern
```rust
fn parse_config(path: &str) -> Result<Config, ConfigError> {
    let content = fs::read_to_string(path)
        .map_err(|e| ConfigError::FileRead { path: path.into(), source: e })?;

    let config: Config = serde_json::from_str(&content)
        .map_err(|e| ConfigError::Parse { source: e })?;

    validate_config(&config)?;
    Ok(config)
}
```

## Retry Strategies

### Exponential Backoff with Jitter

```python
import random
import time

def retry_with_backoff(
    func,
    max_retries=3,
    base_delay=1.0,
    max_delay=60.0,
    retryable_exceptions=(ConnectionError, TimeoutError),
):
    for attempt in range(max_retries + 1):
        try:
            return func()
        except retryable_exceptions as e:
            if attempt == max_retries:
                raise

            delay = min(base_delay * (2 ** attempt), max_delay)
            jitter = random.uniform(0, delay * 0.1)  # 10% jitter
            time.sleep(delay + jitter)

            logger.warning(f"Retry {attempt + 1}/{max_retries} after {delay:.1f}s: {e}")
```

### Circuit Breaker Pattern

Prevent cascading failures by stopping calls to a failing service.

```
States:
  CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing)
       ^                                      |
       |______________________________________| (if test succeeds)
```

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=30):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "CLOSED"
        self.last_failure_time = None

    def call(self, func):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
            else:
                raise CircuitOpenError("Circuit is open, failing fast")

        try:
            result = func()
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
            raise
```

### Retry Decision Matrix

| Error Type | Retry? | Strategy |
|-----------|--------|----------|
| Network timeout | Yes | Exponential backoff |
| 429 Too Many Requests | Yes | Respect Retry-After header |
| 500 Internal Server Error | Yes (cautiously) | Exponential backoff, max 3 |
| 502/503/504 | Yes | Exponential backoff |
| 400 Bad Request | No | Fix the request |
| 401 Unauthorized | No | Re-authenticate, then retry once |
| 404 Not Found | No | The resource does not exist |
| 409 Conflict | Maybe | Re-read state, resolve, retry |
| Connection refused | Yes | Backoff, check if service is up |

### What Should NOT Be Retried
- Non-idempotent operations without idempotency keys (POST creating duplicate records).
- Validation errors (will fail the same way every time).
- Authentication failures (unless token refresh is possible).
- Business logic errors (insufficient funds, invalid state transition).

## Graceful Degradation

### Degradation Strategies

| Failure | Degradation |
|---------|-------------|
| Recommendation service down | Show popular items instead |
| Search service slow | Show cached results with staleness warning |
| Payment service down | Allow cart building, queue payment for later |
| Analytics service down | Drop analytics events silently |
| Image CDN down | Show placeholder images |

### Implementation Pattern
```typescript
async function getRecommendations(userId: string): Promise<Product[]> {
  try {
    return await recommendationService.getPersonalized(userId);
  } catch (error) {
    logger.warn("Recommendation service failed, falling back to popular items", {
      error: error.message,
      userId,
    });
    metrics.increment("recommendations.fallback");
    return await productService.getPopular({ limit: 10 });
  }
}
```

## Error Logging Best Practices

### What to Log
```typescript
logger.error("Failed to process payment", {
  error: {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack,
  },
  context: {
    orderId: order.id,
    userId: order.userId,
    amount: order.total,
    paymentMethod: order.paymentMethod,  // NOT the card number
    attemptNumber: retryCount,
  },
  request: {
    requestId: req.id,
    method: req.method,
    path: req.path,
  },
});
```

### What NOT to Log
- Passwords, tokens, API keys, secrets.
- Credit card numbers, SSNs, personal health information.
- Full request bodies (may contain PII).
- User-generated content that may contain sensitive data.

### Structured Error Logging
Always use structured logging for errors. Key fields:

| Field | Purpose |
|-------|---------|
| `error.name` | Error class/type |
| `error.code` | Machine-readable error code |
| `error.message` | Human-readable description |
| `error.stack` | Stack trace (development/staging only) |
| `request.id` | Correlation ID for tracing |
| `context.*` | Business-specific diagnostic data |
| `severity` | ERROR, WARN, FATAL |

## User-Facing Error Messages

### Rules for User Messages
1. **Never expose technical details** (stack traces, SQL errors, file paths).
2. **Be specific about what went wrong** ("Your email address is invalid" not "Validation error").
3. **Suggest what the user can do** ("Please check your email and try again").
4. **Use plain language** (no jargon, no error codes visible to users).
5. **Be honest** ("Something went wrong on our end" when it is a server error).

### Error Message Templates

| Scenario | Bad | Good |
|----------|-----|------|
| Invalid input | `ValidationError: field "email" failed regex` | `Please enter a valid email address (e.g., name@example.com)` |
| Not found | `404 Resource not found` | `We could not find what you were looking for. It may have been moved or deleted.` |
| Server error | `NullPointerException at line 42` | `Something went wrong on our end. Please try again in a few minutes. If the problem continues, contact support.` |
| Rate limit | `429 Too Many Requests` | `You are making requests too quickly. Please wait a moment and try again.` |
| Auth expired | `JWT token expired` | `Your session has expired. Please sign in again.` |

### API Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address.",
        "value": "not-an-email"
      },
      {
        "field": "age",
        "message": "Must be between 0 and 150.",
        "value": -5
      }
    ],
    "requestId": "req_abc123"
  }
}
```

## Error Boundary Patterns

### React Error Boundaries
```tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorReportingService.report(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// Usage: Wrap sections of UI, not the entire app
<ErrorBoundary fallback={<OrderErrorFallback />}>
  <OrderDetails orderId={id} />
</ErrorBoundary>
```

### Global Exception Handler (Express)
```typescript
// Error handling middleware (must have 4 parameters)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApplicationError && err.isOperational) {
    logger.warn("Operational error", { error: err, requestId: req.id });
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, requestId: req.id }
    });
  }

  // Programmer error: log and return generic 500
  logger.error("Unexpected error", { error: err, requestId: req.id });
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", requestId: req.id }
  });
});
```

### Operational vs Programmer Errors

| Operational (Expected) | Programmer (Bug) |
|----------------------|------------------|
| Invalid user input | TypeError, ReferenceError |
| Network timeout | Null dereference |
| File not found | Out of bounds access |
| Rate limited | Assertion failure |
| Disk full | Uncaught exception |

**Operational errors**: Handle gracefully. Return appropriate status code. Log at WARN level.

**Programmer errors**: These are bugs. Log at ERROR level. Fix the code. In extreme cases, restart the process (Node.js `uncaughtException`).

## Anti-Patterns to Avoid

1. **Pokemon exception handling**: `catch (Exception e) {}` - catches everything, handles nothing.
2. **Exception as flow control**: Using try/catch for normal branching logic.
3. **Rethrowing without context**: `catch (e) { throw e; }` adds nothing. Either add context or do not catch.
4. **Logging and rethrowing**: Causes duplicate log entries. Either handle (log) or propagate (rethrow), not both.
5. **Catch and return null**: Hides the error, causes NullPointerException later, far from the actual problem.
6. **Overly broad catch**: Catching base Exception when only IOException is expected.
7. **Nested try-catch**: Deeply nested error handling obscures the happy path. Refactor to early returns.

## When to Use

**Use this skill when:**
- Designing or implementing error handler solutions
- Reviewing or improving existing error handler approaches
- Making architectural or implementation decisions about error handler
- Learning error handler patterns and best practices
- Troubleshooting error handler-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Error Handler Analysis

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

**Input:** "Help me implement error handler for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended error handler approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When error handler must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
