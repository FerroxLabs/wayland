---
name: nodejs-error-handling
description: |
  Guides expert-level Node.js error handling: Express error middleware, unhandled rejection handling, domain errors, structured logging integration, error classification, and graceful degradation.
  Use when the user asks about Node.js error handling, Express error middleware, unhandled rejections, structured logging, error propagation, graceful shutdown.
  Do NOT use when the user asks about JavaScript idioms (use `javascript-idioms`), Node.js async patterns (use `nodejs-async-patterns`), general error handling concepts (use language-specific skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript backend debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Node.js Error Handling

## When to Use

**Use this skill when the user is:**
- Designing or refactoring error handling architecture for a Node.js application or service, including Express, Fastify, Koa, or raw `http` module servers
- Debugging unhandled promise rejections, uncaught exceptions, or silent error swallowing in production or development
- Building Express (or Fastify/Koa) error middleware and needs to understand the four-argument `(err, req, res, next)` signature, ordering rules, and async pitfalls
- Setting up `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers with correct shutdown sequencing
- Integrating structured error logging (Pino, Winston, Bunyan) with error classification, correlation IDs, and severity levels
- Implementing domain-specific error classes, error codes, and typed error hierarchies for a module or package boundary
- Designing graceful shutdown logic that drains in-flight requests before terminating
- Classifying errors by recoverability (operational vs. programmer errors) and choosing appropriate propagation strategies

**Do NOT use this skill when the user is asking about:**
- General JavaScript async/await patterns, Promise chaining, or EventEmitter usage -- use `nodejs-async-patterns` instead
- JavaScript language idioms, destructuring, closures, or prototype chains -- use `javascript-idioms` instead
- General software error handling theory not specific to Node.js -- use a language-agnostic design skill
- Python, Go, Java, or other runtime error handling -- use a language-specific skill for that runtime
- Client-side browser JavaScript error handling (window.onerror, error boundaries) -- use a frontend-specific skill
- Database query error handling specifics (PostgreSQL error codes, MongoDB write concern errors) -- use the relevant database skill and reference this skill only for the Node.js integration layer

---

## Process

### 1. Classify the Error Before Writing Any Handler

Node.js errors fall into two fundamental categories defined by Joyent's original design philosophy. Every handling decision flows from this classification.

- **Operational errors** are expected failures at runtime: network timeouts, DNS resolution failures, ENOENT file-not-found, ECONNRESET, EACCES, HTTP 4xx/5xx from downstream services, invalid user input, out-of-disk-space. These are conditions a correct program must anticipate and handle gracefully.
- **Programmer errors** are bugs: calling a function with wrong argument types, reading a property on `undefined`, off-by-one array access, unresolved promises left floating. These should never be caught and silently swallowed -- they should crash the process or at minimum emit a loud alert so the bug is found and fixed.
- Apply the litmus test: "Could this happen in production even with correct code?" -- yes means operational, no means programmer error.
- Never use `try/catch` around code specifically to suppress programmer errors. A caught `TypeError: Cannot read properties of undefined` that logs "something went wrong" is the worst outcome -- the bug hides.
- Mark operational errors explicitly in custom error classes with `this.isOperational = true`. Use this flag in top-level handlers to decide whether to restart the process.
- Errors from third-party modules may not follow this convention -- check if the library exposes typed errors or error codes (e.g., Axios wraps responses in `AxiosError` with `error.response.status`).

### 2. Design a Typed Error Hierarchy

Raw `Error` objects carry only a message and a stack. Build a hierarchy that carries machine-readable context without leaking implementation details.

- Create a `BaseError` class that extends `Error` and sets `this.name`, `this.isOperational`, an `errorCode` string (e.g., `'PAYMENT_GATEWAY_TIMEOUT'`), and an HTTP `statusCode` (e.g., `503`):

```js
class BaseError extends Error {
  constructor(message, { errorCode, statusCode = 500, isOperational = true, cause } = {}) {
    super(message, { cause }); // Node 16.9+ supports native error cause
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

- `Error.captureStackTrace` removes the constructor frame from the stack trace, making it cleaner in logs. Always include it.
- The `cause` option (available natively in Node 16.9+) chains the originating error. Always preserve the original cause when wrapping.
- Derive specific error subtypes: `ValidationError extends BaseError` (statusCode 400, isOperational true), `NotFoundError` (404), `AuthenticationError` (401), `AuthorizationError` (403), `ConflictError` (409), `ServiceUnavailableError` (503), `DatabaseError` (500, isOperational may vary).
- Export these from a dedicated `errors/` directory. Application code imports named error types -- never constructs raw `new Error('...')` at boundaries.
- Include a structured `context` payload for machine-readable detail: `{ userId, resourceId, attemptedOperation }`. This populates log fields without leaking to API consumers.
- Define error codes as constants in a shared enum or object: `ERROR_CODES.USER_NOT_FOUND = 'USER_NOT_FOUND'`. This prevents magic strings and enables exact matching in tests and monitoring dashboards.

### 3. Handle Errors at the Correct Layer

Each architectural layer has a specific responsibility. Getting this wrong creates either leaky abstractions or silent swallowing.

- **Data/repository layer:** Translate database driver errors (`pg` `DatabaseError`, Mongoose `ValidationError`, ECONNREFUSED on pool exhaustion) into domain `DatabaseError` or `ValidationError` types. Never let `pg.DatabaseError` propagate above this layer. Wrap with cause: `throw new DatabaseError('User lookup failed', { cause: pgError, context: { userId } })`.
- **Service layer:** Handle business rule violations here. Throw `ConflictError` for duplicate resource creation. Do not catch errors you cannot meaningfully recover from -- let them propagate.
- **Controller/route layer:** This is the last catch point before the framework error handler. In async routes, all unhandled rejections must be caught. In Express 4.x, async route handlers do NOT automatically forward errors -- use `next(err)` explicitly or wrap handlers.
- **Framework error middleware:** This is the centralized point for translating domain errors to HTTP responses and emitting structured log entries. It never throws.
- **Process level:** `uncaughtException` and `unhandledRejection` -- last resort only. These are not substitutes for proper per-layer handling.

### 4. Wire Up Express Error Middleware Correctly

Express error handling has specific ordering and signature requirements that cause subtle bugs when violated.

- Error middleware must have exactly four parameters `(err, req, res, next)`. Express detects this by `function.length`. Arrow functions that destructure or rest-collect arguments may report incorrect length -- always use named function declarations or expressions for error middleware.
- Register error middleware AFTER all route definitions and non-error middleware. Registration order in Express is the execution order.
- Distinguish between `404 Not Found` (no route matched) and actual errors. Insert a catch-all route handler just before the error middleware:

```js
// After all routes:
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`, { errorCode: 'ROUTE_NOT_FOUND' }));
});

// Error middleware last:
app.use(errorHandler);
```

- The central `errorHandler` function follows this pattern:

```js
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    // Delegate to Express default handler which closes the connection
    return next(err);
  }

  const statusCode = err.statusCode ?? 500;
  const isOperational = err.isOperational ?? false;

  // Structured log -- logger is Pino/Winston instance on req.log or app.locals
  req.log.error({
    err,                        // Pino serializes err.message + err.stack automatically
    errorCode: err.errorCode,
    statusCode,
    requestId: req.id,          // Set by express-request-id or similar
    userId: req.user?.id,
  }, 'Request error');

  // For non-operational (programmer) errors, initiate graceful shutdown
  if (!isOperational) {
    triggerGracefulShutdown(err);
  }

  res.status(statusCode).json({
    error: {
      code: err.errorCode ?? 'INTERNAL_ERROR',
      message: isOperational ? err.message : 'An unexpected error occurred',
      requestId: req.id,
    },
  });
}
```

- For async route handlers in Express 4.x, create a `asyncHandler` wrapper:

```js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage:
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json(user);
}));
```

- Express 5.x (currently in release candidate as of Node.js LTS compatibility) natively handles async route errors -- `next` is called automatically on rejected promises. If using Express 5, the `asyncHandler` wrapper is unnecessary but harmless.
- Never call `next(err)` after `res.json()` or `res.send()` -- this causes "Cannot set headers after they are sent" errors. The `if (res.headersSent)` guard in the error middleware is the safety net, but always structure routes to avoid this.

### 5. Implement Process-Level Handlers with Correct Shutdown Sequencing

Process-level handlers are safety nets, not primary error handling. But they must be implemented correctly or they create worse problems than they solve.

- Set up `unhandledRejection` and `uncaughtException` before any other application code runs -- in the very first lines of your entry point:

```js
process.on('unhandledRejection', (reason, promise) => {
  // reason is the rejection value -- may not be an Error instance
  logger.fatal({
    err: reason instanceof Error ? reason : new Error(String(reason)),
    promise,
  }, 'Unhandled promise rejection -- initiating shutdown');
  triggerGracefulShutdown(reason);
});

process.on('uncaughtException', (err, origin) => {
  // origin is 'uncaughtException' or 'unhandledRejection' (Node 12+)
  logger.fatal({ err, origin }, 'Uncaught exception -- initiating shutdown');
  triggerGracefulShutdown(err);
});
```

- **Critical:** After an `uncaughtException`, the process is in an undefined state. The Node.js documentation explicitly warns that continuing after `uncaughtException` can cause memory leaks, file descriptor leaks, and unpredictable behavior. Always exit. Calling `triggerGracefulShutdown` is appropriate -- but ensure the shutdown itself cannot throw.
- In Node.js 15+, an unhandled rejection causes process exit by default with exit code 1. In Node.js 14 and earlier, it only emits a deprecation warning. Ensure your version-aware handler matches the runtime behavior.
- Use `--unhandled-rejections=throw` flag (available since Node 12.0) in Node.js 14 and earlier to opt into the Node.js 15+ behavior explicitly.
- The `graceful shutdown` function:

```js
let isShuttingDown = false;

async function triggerGracefulShutdown(err) {
  if (isShuttingDown) return; // Prevent re-entrant shutdown
  isShuttingDown = true;

  logger.info('Graceful shutdown initiated');

  // Stop accepting new connections
  server.close(async () => {
    try {
      await Promise.all([
        db.pool.end(),         // Close database pool
        redisClient.quit(),    // Close Redis connection
        // ... other resource cleanup
      ]);
      logger.info('Graceful shutdown complete');
      process.exit(err ? 1 : 0);
    } catch (cleanupErr) {
      logger.error({ err: cleanupErr }, 'Error during cleanup -- forcing exit');
      process.exit(1);
    }
  });

  // Force exit if graceful shutdown takes too long (10 seconds is a common threshold)
  setTimeout(() => {
    logger.error('Graceful shutdown timeout -- forcing exit');
    process.exit(1);
  }, 10_000).unref(); // .unref() prevents the timer from keeping the process alive
}
```

- Wire shutdown to `SIGTERM` and `SIGINT` (for Ctrl-C in development and container orchestrator termination in production):

```js
process.on('SIGTERM', () => triggerGracefulShutdown(null));
process.on('SIGINT', () => triggerGracefulShutdown(null));
```

- Kubernetes sends `SIGTERM` and then `SIGKILL` after a configurable grace period (default 30 seconds). Your shutdown timeout should be shorter than the pod's `terminationGracePeriodSeconds`.

### 6. Integrate Structured Logging with Error Context

Errors are only actionable if log records contain enough context to diagnose and reproduce.

- Use Pino as the preferred logger -- it is 5-8x faster than Winston for high-throughput services due to its JSON serialization strategy and avoidance of synchronous string formatting. For teams that need Winston's transport ecosystem, it remains a valid choice.
- Configure Pino's built-in `err` serializer, which automatically captures `message`, `stack`, `type`, and any enumerable properties on the error object:

```js
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});
```

- Always log errors with `logger.error({ err }, 'Descriptive message')` -- not `logger.error(err.message)`. The structured form preserves the full error object in the JSON payload.
- Attach a `requestId` (also called `correlationId` or `traceId`) to every log record in the request lifecycle. Use `express-request-id` or set `req.id = crypto.randomUUID()` in a first-middleware. Create a child logger per request: `req.log = logger.child({ requestId: req.id, userId: req.user?.id })`.
- Severity mapping for errors: `warn` for recoverable operational errors (rate limiting, cache miss with fallback), `error` for operational errors that failed a request, `fatal` for programmer errors or process-threatening conditions.
- Never log sensitive data in error context: passwords, credit card numbers, session tokens, full PII. Redact these fields at the logger configuration level using Pino's `redact` option: `redact: ['req.headers.authorization', 'req.body.password']`.
- In distributed systems, propagate the trace ID through downstream HTTP calls using headers (`X-Request-ID`, `X-Trace-ID`, or OpenTelemetry `traceparent`). This connects log records across services.

### 7. Design API Error Response Contracts

The shape of error responses must be consistent and agreed upon with API consumers. Inconsistency is a primary source of client-side bugs.

- Adopt a consistent error response body schema. The following schema is production-proven and compatible with most API client expectations:

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "No user exists with the specified identifier",
    "requestId": "a3f9c12b-8d4e-4f2a-b1c7-0e9d5a2f8b3c",
    "details": [
      { "field": "userId", "issue": "Resource does not exist" }
    ]
  }
}
```

- The `code` field is machine-readable and stable across versions. The `message` field is human-readable and may change. Client code should branch on `code`, not `message`.
- The `details` array carries field-level validation errors, modeled after Google's API error design guide. This is particularly useful for 400 responses with multiple invalid fields.
- Map status codes with precision:
  - 400 -- malformed request body, type coercion failure, missing required field
  - 401 -- authentication required or token expired (include `WWW-Authenticate` header)
  - 403 -- authenticated but lacks permission (do not reveal whether the resource exists)
  - 404 -- resource not found OR route not found
  - 409 -- conflict (duplicate email, optimistic lock version mismatch)
  - 422 -- request is syntactically valid but semantically invalid (business rule violation)
  - 429 -- rate limit exceeded (include `Retry-After` header in seconds)
  - 500 -- programmer error or unclassified failure (never expose internals)
  - 502/503/504 -- upstream dependency failure (safe to retry with backoff)
- For validation libraries: Zod's `ZodError` can be converted to the `details` array format; Joi's `ValidationError` has a `details` array with `path` and `message` per field. Build adapters in the error middleware to normalize these into your schema.

### 8. Validate and Test the Error Handling System

Error handling code is frequently untested because errors are hard to trigger deliberately. This gap causes production surprises.

- Test the `errorHandler` middleware directly: create a mock `err`, `req`, `res`, `next` and call it. Assert on `res.status()` and `res.json()` call arguments.
- Test that async route handlers propagate to error middleware: use Supertest to make a request, mock the service to throw a specific error type, and assert on the HTTP response code and body `error.code`.
- Test the custom error classes: instantiate each, assert on `isOperational`, `statusCode`, `errorCode`, `stack` presence, and `cause` chaining.
- Test `unhandledRejection` and `uncaughtException` handlers using `process.emit('unhandledRejection', new Error('test'))` in a sandboxed test context. Assert that the shutdown function is called without actually calling `process.exit` (mock it).
- Use fault injection to verify integration: in development, instrument a middleware that randomly throws or rejects based on an environment variable (`CHAOS_ERROR_RATE=0.01`). This stress-tests error paths before production exposes them.
- Monitor error rates in production by exposing a `/metrics` endpoint (Prometheus format) with counters per `errorCode`. A sudden spike in `DATABASE_CONNECTION_FAILED` errors is immediately actionable; a spike in generic 500s is not.

---

## Output Format

When helping a user with Node.js error handling, produce output organized as follows:

```
## Error Handling Architecture: [Context Summary]

### Error Classification
| Error Type         | Class Name              | statusCode | isOperational | errorCode Example          |
|--------------------|-------------------------|------------|---------------|----------------------------|
| Validation failure | ValidationError         | 400        | true          | INVALID_EMAIL_FORMAT       |
| Auth required      | AuthenticationError     | 401        | true          | TOKEN_EXPIRED              |
| Permission denied  | AuthorizationError      | 403        | true          | INSUFFICIENT_PERMISSIONS   |
| Resource missing   | NotFoundError           | 404        | true          | USER_NOT_FOUND             |
| Business conflict  | ConflictError           | 409        | true          | EMAIL_ALREADY_REGISTERED   |
| Upstream failure   | ServiceUnavailableError | 503        | true          | PAYMENT_GATEWAY_TIMEOUT    |
| Programmer error   | (native Error)          | 500        | false         | (none -- crash and fix)    |

### Error Class Definitions
[Concrete TypeScript or JavaScript code for BaseError and all relevant subtypes]

### Express Middleware Stack Order
[Numbered list of middleware in registration order, with notes on what each handles]

### Central Error Handler Implementation
[Complete errorHandler function code]

### Process-Level Handler Setup
[process.on('unhandledRejection') and process.on('uncaughtException') with shutdown logic]

### Graceful Shutdown Function
[Complete triggerGracefulShutdown implementation]

### Structured Log Integration
[Logger setup and per-request child logger pattern]

### API Error Response Schema
[JSON schema and example response body]

### Testing Checklist
- [ ] BaseError and subclass unit tests (isOperational, statusCode, errorCode, cause)
- [ ] errorHandler middleware unit test (mocked req/res/next)
- [ ] Async route error propagation integration test (Supertest)
- [ ] unhandledRejection handler test (sandboxed process.emit)
- [ ] Shutdown sequencing test (mock process.exit)
- [ ] 404 catch-all route test
- [ ] Sensitive field redaction test (assert logs contain no password field)
```

---

## Rules

1. **Never swallow errors silently.** An empty `catch (err) {}` block is always wrong. At minimum, `throw err` to re-propagate. Silently swallowed errors create ghost failures that appear as data corruption or inconsistency rather than errors, which are orders of magnitude harder to diagnose.

2. **Never use `uncaughtException` as a general-purpose error handler.** It exists solely to log and initiate shutdown. Recovering application state after an uncaught exception is undefined behavior -- process memory may be corrupted, file descriptors may be leaked, and ongoing transactions may be in unknown states.

3. **Always use `Error.captureStackTrace(this, this.constructor)` in custom error constructors.** Without it, the stack trace includes frames from within the error constructor itself, adding noise and obscuring the actual call site.

4. **Always preserve the original error as `cause` when wrapping.** Throwing `new DatabaseError('Failed')` and discarding the original `pgError` destroys the ability to diagnose root causes. Use `new DatabaseError('Failed', { cause: pgError })`.

5. **Never let database-layer error types (pg `DatabaseError`, Mongoose `MongoServerError`) escape their layer.** These expose implementation details (table names, constraint names, driver-specific codes) to layers that should not know about them. Map them to domain error types at the repository boundary.

6. **Always guard against `res.headersSent` in Express error middleware.** If a route handler partially writes a response before throwing, the error middleware must delegate to `next(err)` rather than attempt to write another response. Failing to check this causes "ERR_HTTP_HEADERS_SENT" crashes.

7. **Always set a shutdown timeout and call `.unref()` on it.** A shutdown that waits indefinitely for in-flight requests will block container orchestration (Kubernetes will SIGKILL after `terminationGracePeriodSeconds`, but this is configurable and often misconfigured). Setting a hard timeout -- typically 5-15 seconds -- ensures deterministic shutdown. `.unref()` prevents the timer itself from keeping the process alive if everything else exits cleanly first.

8. **Never log the full error object with `logger.error(err.message)` as a string.** This discards the stack, error code, and context fields. Always log `{ err }` as a structured field so the logger's serializer captures all properties.

9. **Always test error handler registration order.** A common mistake is registering the 404 catch-all or error middleware before some routes, causing those routes to be unreachable. Add an integration test that hits a known route and asserts it does not return 404.

10. **Never expose internal error details in production API responses.** Stack traces, SQL queries, file paths, and internal service names in API responses are security vulnerabilities (information disclosure). The `isOperational` flag gates message exposure: operational errors may expose their user-facing message; programmer errors return a generic message regardless of environment. Debug details belong only in server-side logs.

---

## Edge Cases

### Middleware That Calls `next()` After Sending a Response

This occurs when a developer calls `res.json()` and then returns to later logic (or a callback) that also calls `next()`. The result is either a duplicate response attempt or ERR_HTTP_HEADERS_SENT. Handle by treating every response-writing operation as a function exit: use `return res.json(...)` always, never bare `res.json(...)`. In the error handler, the `if (res.headersSent) return next(err)` guard is the last line of defense but should not be relied upon as the primary mechanism.

### Errors Inside Error Middleware

If the central error handler itself throws (e.g., the logger is not initialized, or the `errorCode` lookup fails), Express will invoke its own built-in error handler, which returns a plain text response and may expose a stack trace in development. Protect against this by wrapping the entire error handler body in a try/catch and using a fallback response:

```js
function errorHandler(err, req, res, next) {
  try {
    // ... all normal error handling logic
  } catch (handlerErr) {
    // Absolute fallback -- logger may be unavailable
    console.error('Error in error handler:', handlerErr);
    if (!res.headersSent) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
    }
  }
}
```

### Async Errors in Non-Route Middleware

Express 4.x only automatically propagates errors to the error handler when `next(err)` is called. In middleware that runs outside of the route dispatch cycle (e.g., a background job, a WebSocket handler, a `setInterval` callback), there is no `next` to call. These errors must use `process.on('uncaughtException')` as a catch point, which means they trigger shutdown. To avoid this, wrap every background operation's top-level function in a try/catch that logs and makes a recovery decision explicitly.

### Rate-Limiting and Retry-After Headers

`429 Too Many Requests` responses require a `Retry-After` header to be useful to clients. When throwing a rate limit error, include the retry delay in seconds as part of the error's context: `new RateLimitError('Rate limit exceeded', { retryAfterSeconds: 60 })`. The error middleware should read this value and set the header: `res.set('Retry-After', String(err.retryAfterSeconds ?? 60))`. Without this header, clients implementing automatic retry logic will hammer the service immediately again.

### Validation Errors with Multiple Field Failures

Throwing and catching one `ValidationError` per field produces poor user experience -- the user fixes one error, resubmits, and discovers the next. Accumulate all validation failures before throwing. If using Zod, call `schema.safeParse(data)` and collect `error.issues`. If using Joi, pass `{ abortEarly: false }` to `schema.validate()`. The error middleware then maps the array of issues to the `details[]` field in the response body. Test that the error response for a multi-field invalid body contains all failures in a single response.

### Errors in Database Transactions

When an error occurs inside a database transaction, the error must be re-thrown after rolling back -- not swallowed after rollback. A common pattern:

```js
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... operations
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err; // Re-throw -- do not swallow after rollback
} finally {
  client.release();
}
```

Failing to re-throw after rollback causes the calling service to believe the operation succeeded, creating data consistency bugs that are extremely difficult to trace.

### TypeScript Projects: Narrowing `unknown` in Catch Blocks

In TypeScript with `useUnknownInCatchVariables: true` (the default in strict mode since TypeScript 4.4), caught errors are typed as `unknown`, not `Error`. Code that does `catch (err) { logger.error(err.message) }` fails to compile. Always narrow before accessing error properties:

```ts
function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(String(value));
}

try {
  // ...
} catch (rawErr) {
  const err = toError(rawErr);
  logger.error({ err }, 'Operation failed');
  throw err;
}
```

For custom error type guards: `function isValidationError(err: unknown): err is ValidationError { return err instanceof ValidationError; }`. Use these in middleware to extract typed properties safely.

### Worker Threads and Cluster Mode

In Node.js `worker_threads`, unhandled errors inside a worker do not propagate to the main thread automatically -- the worker emits an `'error'` event on the `Worker` instance. The main thread must listen: `worker.on('error', (err) => { ... })`. In `cluster` mode, unhandled exceptions in a worker process cause that worker to exit, and the master process receives a `'exit'` event -- implement auto-restart logic there, not inside the worker. Never use `process.on('uncaughtException')` in a worker as a substitute for proper error propagation to the master.

---

## Example

**Input:** "I'm building an Express REST API in TypeScript for a fintech application. We've had silent failures in production where database errors aren't reaching the error handler, and our error responses are inconsistent -- sometimes plain text, sometimes JSON. We need to fix this properly."

**Output:**

## Error Handling Architecture: Fintech Express REST API

This diagnosis is common and has a known root cause: async route handlers in Express 4.x do not automatically propagate rejected promises to the error handler. Combined with inconsistent response formatting, the fix requires three coordinated changes.

---

### Root Cause Diagnosis

**Problem 1: Silent database errors**
Express 4.x route handlers `(req, res) => {}` do not wrap async functions. A rejected promise from an `async` handler is an unhandled rejection -- it never reaches the error middleware.

**Problem 2: Inconsistent response format**
Without a central error handler, different routes format errors differently -- some call `res.status(500).send('Error')`, others call `res.json({ message: err.message })`. The fix centralizes all error formatting in one place.

---

### Step 1: Error Class Hierarchy

```ts
// src/errors/BaseError.ts
export class BaseError extends Error {
  public readonly errorCode: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      errorCode: string;
      statusCode?: number;
      isOperational?: boolean;
      context?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.errorCode = options.errorCode;
    this.statusCode = options.statusCode ?? 500;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;
    Error.captureStackTrace(this, this.constructor);
  }
}

// src/errors/index.ts
export class ValidationError extends BaseError {
  constructor(message: string, context?: { fields: Array<{ field: string; issue: string }> }) {
    super(message, { errorCode: 'VALIDATION_ERROR', statusCode: 400, context });
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id '${id}' was not found`, {
      errorCode: `${resource.toUpperCase()}_NOT_FOUND`,
      statusCode: 404,
      context: { resource, id },
    });
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, errorCode: string) {
    super(message, { errorCode, statusCode: 409 });
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, cause: unknown) {
    super(message, {
      errorCode: 'DATABASE_ERROR',
      statusCode: 500,
      isOperational: true, // Treat as operational for shutdown purposes, but don't expose message
      cause,
    });
  }
}

export class ServiceUnavailableError extends BaseError {
  public readonly retryAfterSeconds: number;
  constructor(message: string, errorCode: string, retryAfterSeconds = 30) {
    super(message, { errorCode, statusCode: 503 });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
```

---

### Step 2: asyncHandler Wrapper (Fix for Silent Failures)

```ts
// src/middleware/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

Apply to every async route handler:

```ts
// Before (broken -- errors silently lost):
router.get('/accounts/:id', async (req, res) => {
  const account = await accountService.findById(req.params.id);
  res.json(account);
});

// After (fixed -- errors reach error middleware):
router.get('/accounts/:id', asyncHandler(async (req, res) => {
  const account = await accountService.findById(req.params.id);
  res.json(account);
}));
```

---

### Step 3: Repository Layer Error Translation

```ts
// src/repositories/AccountRepository.ts
import { DatabaseError } from '../errors';

export class AccountRepository {
  async findById(id: string): Promise<Account> {
    try {
      const result = await db.query('SELECT * FROM accounts WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        throw new NotFoundError('Account', id); // Domain error, not DB error
      }
      return result.rows[0];
    } catch (err) {
      if (err instanceof NotFoundError) throw err; // Pass domain errors through
      throw new DatabaseError('Failed to retrieve account', err); // Wrap DB errors
    }
  }
}
```

---

### Step 4: Central Error Handler

```ts
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { BaseError, ServiceUnavailableError, ValidationError } from '../errors';

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  try {
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Array<{ field: string; issue: string }> | undefined;

    if (err instanceof BaseError) {
      statusCode = err.statusCode;
      errorCode = err.errorCode;
      // Only expose message for operational errors -- programmer errors get generic message
      message = err.isOperational ? err.message : 'An unexpected error occurred';

      if (err instanceof ValidationError && err.context?.fields) {
        details = err.context.fields as Array<{ field: string; issue: string }>;
      }

      if (err instanceof ServiceUnavailableError) {
        res.set('Retry-After', String(err.retryAfterSeconds));
      }
    }

    // Structured log with full error context
    const logPayload = {
      err,
      errorCode,
      statusCode,
      requestId: req.id,
      userId: (req as any).user?.id,
      path: req.path,
      method: req.method,
    };

    if (statusCode >= 500) {
      req.log.error(logPayload, 'Request failed with server error');
    } else {
      req.log.warn(logPayload, 'Request failed with client error');
    }

    // Initiate shutdown for programmer errors (non-operational)
    const isOperational = err instanceof BaseError ? err.isOperational : false;
    if (!isOperational) {
      setImmediate(() => triggerGracefulShutdown(err instanceof Error ? err : new Error(String(err))));
    }

    const body: ErrorResponseBody = {
      error: { code: errorCode, message, requestId: req.id, ...(details ? { details } : {}) },
    };

    res.status(statusCode).json(body);
  } catch (handlerErr) {
    console.error('Critical: error in error handler', handlerErr);
    if (!res.headersSent) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId: req.id } });
    }
  }
}
```

---

### Step 5: App Registration Order

```ts
// src/app.ts
import express from 'express';
import pino from 'pino-http';
import { randomUUID } from 'crypto';
import { accountRouter } from './routes/accounts';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './errors';

export const app = express();

// 1. Request ID -- must be first
app.use((req, _res, next) => { (req as any).id = randomUUID(); next(); });

// 2. Structured request logger (Pino) -- before routes so req.log is available everywhere
app.use(pino({ logger }));

// 3. Body parsing
app.use(express.json());

// 4. All routes
app.use('/api/v1/accounts', accountRouter);

// 5. 404 catch-all -- after all routes, before error handler
app.use((req, _res, next) => {
  next(new NotFoundError('Route', `${req.method} ${req.path}`));
});

// 6. Error handler -- must be last, must have 4 parameters
app.use(errorHandler);
```

---

### Step 6: Process-Level Setup in Entry Point

```ts
// src/server.ts
import { app } from './app';
import { logger } from './logger';
import { db } from './db';

const server = app.listen(process.env.PORT ?? 3000, () => {
  logger.info({ port: process.env.PORT ?? 3000 }, 'Server started');
});

let isShuttingDown = false;

async function triggerGracefulShutdown(err: Error | null): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info('Graceful shutdown initiated');

  server.close(async () => {
    try {
      await db.pool.end();
      logger.info('Graceful shutdown complete');
      process.exit(err ? 1 : 0);
    } catch (cleanupErr) {
      logger.error({ err: cleanupErr }, 'Cleanup error during shutdown');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Shutdown timeout (10s) exceeded -- forcing exit');
    process.exit(1);
  }, 10_000).unref();
}

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.fatal({ err }, 'Unhandled promise rejection');
  triggerGracefulShutdown(err);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  triggerGracefulShutdown(err);
});

process.on('SIGTERM', () => triggerGracefulShutdown(null));
process.on('SIGINT', () => triggerGracefulShutdown(null));
```

---

### Error Classification Summary

| Error Type              | Class                   | statusCode | isOperational | Expose Message to Client |
|-------------------------|-------------------------|------------|---------------|--------------------------|
| Missing required field  | ValidationError         | 400        | true          | Yes                      |
| JWT expired             | AuthenticationError     | 401        | true          | Yes                      |
| Wrong account owner     | AuthorizationError      | 403        | true          | Yes (generic)            |
| Account not found       | NotFoundError           | 404        | true          | Yes                      |
| Duplicate account       | ConflictError           | 409        | true          | Yes                      |
| pg driver crash         | DatabaseError           | 500        | true          | No (generic)             |
| TypeError: undefined    | (native Error)          | 500        | false         | No -- triggers shutdown  |
| Payment gateway down    | ServiceUnavailableError | 503        | true          | Yes + Retry-After header |

---

### Testing Checklist

- [ ] `ValidationError` carries `statusCode: 400`, `isOperational: true`, and `context.fields`
- [ ] `DatabaseError` wraps the pg error as `cause` and does not expose SQL in `message`
- [ ] `asyncHandler` -- mock an async function that rejects, assert `next` is called with the error
- [ ] `errorHandler` -- inject `ValidationError`, assert `res.status(400)` and `res.json.error.code === 'VALIDATION_ERROR'`
- [ ] `errorHandler` -- inject non-operational `TypeError`, assert response message is generic and shutdown is triggered
- [ ] `errorHandler` -- inject with `res.headersSent = true`, assert `next(err)` is called, no second response written
- [ ] `ServiceUnavailableError` response includes `Retry-After` header
- [ ] 404 catch-all -- request unknown route, assert `404` and `error.code === 'ROUTE_NOT_FOUND'`
- [ ] Pino redact -- assert log records do not contain `req.body.pin` or `req.headers.authorization` values
