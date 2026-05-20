---
name: go-api-patterns
description: |
  Guides expert-level Go HTTP API development: handler patterns, middleware chains, graceful shutdown, OpenAPI generation, request validation, and standard library HTTP server patterns.
  Use when the user asks about Go API, HTTP handlers, middleware, graceful shutdown, OpenAPI, Go web server, request validation.
  Do NOT use when the user asks about Go idioms (use `go-idioms`), Go error handling (use `go-error-handling`), REST API design concepts (use `rest-api-design`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "go backend api-design"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Go API Patterns

## When to Use

**Use this skill when the user asks about:**
- Structuring HTTP handlers in Go using `net/http`, `chi`, `gorilla/mux`, or `httprouter`
- Building middleware chains for authentication, logging, rate limiting, or request tracing
- Implementing graceful shutdown with `context.Context` and `os.Signal` coordination
- Generating or consuming OpenAPI 3.x specifications from Go code (using `swaggo/swag`, `ogen`, or `oapi-codegen`)
- Validating HTTP request bodies, query parameters, and path variables in Go
- Structuring a Go HTTP server with proper `http.Server` configuration (timeouts, TLS, connection limits)
- Organizing a Go web service project layout -- handler files, routing, dependency injection, server wiring

**Do NOT use this skill when:**
- The user asks about Go language idioms unrelated to HTTP (use `go-idioms` -- covers interfaces, embedding, goroutine patterns)
- The user asks about Go error wrapping, sentinel errors, or `errors.As`/`errors.Is` mechanics (use `go-error-handling`)
- The user asks about REST API design principles like resource modeling, HATEOAS, or HTTP status code semantics (use `rest-api-design`)
- The user is asking about gRPC or Protocol Buffers in Go (those deserve dedicated treatment beyond this skill's scope)
- The user needs database query patterns, ORM configuration, or migration tooling (use a database-specific skill)
- The user is asking about WebSocket or Server-Sent Events real-time streaming (these require distinct patterns not covered here)

---

## Process

### 1. Assess API Requirements and Choose a Router Strategy

Before writing any handler code, establish the structural constraints that drive all subsequent decisions.

- **Identify the traffic volume target.** Under 1,000 req/s: `net/http` ServeMux is sufficient. 1,000--50,000 req/s: `chi` adds negligible overhead and provides middleware composition. Above 50,000 req/s with complex routing: `httprouter` (no middleware composition built-in) or `fasthttp` (breaks `net/http` compatibility).
- **Decide whether you need path parameter extraction.** Go 1.22+ `net/http` ServeMux supports `{name}` and `{name...}` wildcards natively -- use the standard library when path parameters are simple. Use `chi` when you need named parameters, subrouters, and middleware scoped to route groups.
- **Determine if the API is internal or public-facing.** Internal services can use simpler error formats. Public APIs must return consistent, documented error envelopes and must not leak stack traces or internal paths.
- **Establish the dependency injection model.** Prefer a `Handler` struct (or closure) that receives dependencies at construction time over package-level globals. This enables test injection without monkey-patching.
- **Record the Go version.** Go 1.22 changed ServeMux behavior and added `http.MethodGet` pattern prefixing. Go 1.21 added `log/slog`. Know which version is pinned in `go.mod` before advising patterns.

### 2. Define the Server Configuration

`http.Server` has dangerous zero-value defaults. Always configure all timeout fields explicitly.

- Set `ReadTimeout` to 5s--30s depending on whether the endpoint accepts large request bodies. `ReadTimeout` covers the entire request read including body. For file upload endpoints, set `ReadHeaderTimeout` to 10s and leave `ReadTimeout` at 0 (unlimited body read), controlled instead by `http.MaxBytesReader`.
- Set `WriteTimeout` to at least `ReadTimeout + processing_budget + response_write_time`. For most JSON APIs: 30s. For streaming responses: 0 with explicit per-handler deadlines via `context.WithTimeout`.
- Set `IdleTimeout` to 120s for keep-alive connections. This prevents connections from holding goroutines indefinitely.
- Set `MaxHeaderBytes` explicitly -- default is 1MB which is usually fine, but document the choice.
- Always pass a non-nil `ErrorLog` pointing to your structured logger so TLS and connection errors surface in your log pipeline.
- Bind to `0.0.0.0:PORT` in containers. Bind to `127.0.0.1:PORT` when behind a local reverse proxy.
- Set `TLSConfig` with `MinVersion: tls.VersionTLS12` and a curated `CipherSuites` list when terminating TLS in the Go process (versus at a load balancer).

```go
srv := &http.Server{
    Addr:              ":8080",
    Handler:           router,
    ReadHeaderTimeout: 10 * time.Second,
    ReadTimeout:       30 * time.Second,
    WriteTimeout:      45 * time.Second,
    IdleTimeout:       120 * time.Second,
    MaxHeaderBytes:    1 << 20, // 1 MB
    ErrorLog:          slog.NewLogLogger(logger.Handler(), slog.LevelError),
}
```

### 3. Implement the Handler Pattern

Every handler in a production Go API should follow a consistent structural pattern.

- **Use a method on a struct** for handlers that require dependencies (database, cache, external clients). This keeps construction explicit and enables testing without global state.
- **Decode, validate, then process** -- never intermix decoding with business logic. Decode JSON with `json.NewDecoder(r.Body).Decode(&req)`. Limit body size with `http.MaxBytesReader(w, r.Body, maxBytes)` before decoding.
- **Return structured errors immediately** using a central `respondError` function. Never write a partial response and then fail -- this corrupts JSON output.
- **Set `Content-Type` before calling `w.WriteHeader`**. Headers cannot be set after `WriteHeader` is called.
- **Always drain and close `r.Body`** to free the connection for reuse: `defer io.Copy(io.Discard, r.Body)` after `defer r.Body.Close()`.
- **Use `http.StatusOK` (200) via `json.NewEncoder(w).Encode(resp)` for success** -- `Encode` writes the body; the status defaults to 200 if `WriteHeader` was not explicitly called.
- Use a typed `envelope` response wrapper: `{"data": ..., "meta": {...}}` for consistency across all endpoints.

```go
type UserHandler struct {
    users UserService
    log   *slog.Logger
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id") // Go 1.22+
    if id == "" {
        respondError(w, http.StatusBadRequest, "missing user id")
        return
    }
    user, err := h.users.ByID(r.Context(), id)
    if err != nil {
        h.log.ErrorContext(r.Context(), "fetch user", "err", err, "id", id)
        respondError(w, http.StatusInternalServerError, "internal error")
        return
    }
    respondJSON(w, http.StatusOK, envelope{"data": user})
}
```

### 4. Build the Middleware Chain

Middleware in Go is a function that accepts an `http.Handler` and returns an `http.Handler`. Compose them from outermost to innermost.

- **Request ID middleware** must be first. Generate a UUID or use `crypto/rand` to produce a 16-byte random ID encoded as hex. Store in context with a typed key (never a plain string key). Set as `X-Request-ID` response header immediately.
- **Structured logging middleware** wraps a `responseWriter` decorator that captures the status code written by the inner handler. Log method, path, status, duration, and request ID after the inner handler returns.
- **Recovery middleware** catches panics with `recover()`, logs the stack trace using `debug.Stack()`, and writes a 500 response. Place this as the second-outermost middleware (just inside request ID).
- **Authentication middleware** extracts and validates JWT tokens (verify signature, expiry, issuer, audience). Store validated claims in context. Return 401 with `WWW-Authenticate: Bearer realm="api"` on failure -- never 403 at this stage.
- **Authorization middleware** is route-specific -- applied only to subrouters or individual routes that require specific roles. Returns 403 when the authenticated identity lacks permission.
- **Rate limiting middleware** uses token bucket or sliding window algorithms. A simple in-process implementation uses `golang.org/x/time/rate` per IP or per user ID extracted from context. For distributed rate limiting, use Redis with Lua scripts.
- **CORS middleware** must handle `OPTIONS` preflight before authentication middleware runs. Pre-flight requests do not carry credentials.

Middleware execution order matters critically:

```
Request → [CORS] → [RequestID] → [Recovery] → [Logger] → [Auth] → [RateLimit] → Handler
Response ← [CORS] ← [RequestID] ← [Recovery] ← [Logger] ← [Auth] ← [RateLimit] ← Handler
```

### 5. Implement Request Validation

Go has no built-in struct validation. Choose the right approach for the project's complexity.

- **For simple APIs:** hand-write validation functions that return a typed `ValidationError` containing a map of field names to error messages. This is zero-dependency and transparent.
- **For complex APIs with many input types:** use `go-playground/validator` v10 with struct tags (`validate:"required,min=1,max=100,email"`). Register custom validators for domain-specific rules (e.g., valid UUID format, country code).
- **Validate path parameters** explicitly -- `r.PathValue("id")` returns a string; validate UUID format with `uuid.Parse()` from `google/uuid` before passing to the service layer.
- **Validate query parameters** using a typed extraction function: parse with `r.URL.Query().Get("page")`, convert to int with `strconv.Atoi`, validate range (page >= 1, page <= 10000), and default to page=1 on missing value.
- **Return 422 Unprocessable Entity** (not 400) when the request body is syntactically valid JSON but semantically invalid (field values out of range, missing required business logic fields). Return 400 for malformed JSON or wrong Content-Type.
- **Never trust `Content-Length`** for body size enforcement -- always use `http.MaxBytesReader`. A 5MB default limit is appropriate for JSON APIs; endpoints accepting file data need explicit higher limits.

```go
func decodeAndValidate[T any](r *http.Request, maxBytes int64) (T, error) {
    var req T
    r.Body = http.MaxBytesReader(nil, r.Body, maxBytes)
    dec := json.NewDecoder(r.Body)
    dec.DisallowUnknownFields()
    if err := dec.Decode(&req); err != nil {
        return req, &DecodeError{Err: err}
    }
    if err := validate.Struct(req); err != nil {
        return req, &ValidationError{Err: err}
    }
    return req, nil
}
```

### 6. Implement Graceful Shutdown

Graceful shutdown ensures in-flight requests complete before the process exits. This is non-negotiable for zero-downtime deployments.

- **Listen for OS signals** using `signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)`. When the signal fires, the context is cancelled. Do not use `signal.Notify` with a buffered channel unless you understand the backpressure semantics.
- **Call `srv.Shutdown(ctx)` with a deadline** -- pass a context with a timeout of 15--30s. `Shutdown` stops accepting new connections, waits for active requests to complete, then returns. The timeout prevents indefinitely hanging on a stuck handler.
- **Wait for background goroutines** using a `sync.WaitGroup` or `errgroup.Group`. Add each background worker (metrics scraper, cache warmer, queue consumer) to the group before starting it. Drain these after the HTTP server shuts down, not before.
- **Close database connection pools** after HTTP server shutdown completes. This ordering ensures handlers finish before losing DB access.
- **Log shutdown progress** with structured fields: start of shutdown, number of active connections at shutdown time (if accessible), and confirmation when shutdown completes.
- **Return a non-zero exit code** on shutdown errors via `os.Exit(1)`. Do not swallow `srv.Shutdown` errors.

```go
func run(ctx context.Context, srv *http.Server) error {
    shutdownCtx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    errCh := make(chan error, 1)
    go func() {
        if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            errCh <- err
        }
        close(errCh)
    }()

    select {
    case err := <-errCh:
        return err
    case <-shutdownCtx.Done():
        stop() // restore default signal behavior
        timeoutCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        return srv.Shutdown(timeoutCtx)
    }
}
```

### 7. Generate and Serve OpenAPI Documentation

OpenAPI documentation should be generated from code, not maintained separately, to prevent drift.

- **Code-first with `swaggo/swag`:** Add structured comments above handlers using `@Summary`, `@Param`, `@Success`, `@Failure` tags. Run `swag init` to generate `docs/swagger.json`. Serve via `swaggerfiles` and `gin-swagger` or the equivalent for your router. Works well for teams already writing extensive doc comments.
- **Spec-first with `oapi-codegen`:** Write the OpenAPI 3.x YAML spec, then generate Go server stubs, request/response types, and a strict handler interface. Implement the interface. The compiler enforces that all operations are handled. This is the preferred approach for API-first development.
- **Spec-first with `ogen`:** Similar to `oapi-codegen` but generates more idiomatic Go code with typed error handling and context propagation built into generated interfaces.
- **Serve the spec itself** at `/openapi.json` or `/openapi.yaml` using `http.ServeFile` or embedding with `//go:embed docs/openapi.yaml`. Serve the Swagger UI or Redoc as static assets on `/docs`.
- **Validate the spec during CI** using `spectral lint` or `vacuum lint`. Enforce that all paths have summaries, all responses have schemas, and all parameters have descriptions. Never ship an undocumented field.
- **Version the spec** by embedding the version in the server info object and serving `/v1/openapi.json`. Do not break this URL between minor versions.

### 8. Wire Dependencies and Project Layout

A consistent project layout prevents structural debt as the API grows.

- **Recommended layout for a medium API (5--20 handlers):**

```
myapi/
├── cmd/
│   └── api/
│       └── main.go          -- wires everything, calls run()
├── internal/
│   ├── handler/             -- HTTP handler structs, one file per resource
│   │   ├── user.go
│   │   └── product.go
│   ├── middleware/          -- middleware functions
│   │   ├── auth.go
│   │   ├── logger.go
│   │   └── recovery.go
│   ├── service/             -- business logic, no HTTP awareness
│   │   └── user.go
│   ├── store/               -- database layer, interfaces + implementations
│   │   └── user.go
│   ├── server/              -- http.Server construction and routing
│   │   └── server.go
│   └── validator/           -- shared validation helpers
│       └── validator.go
├── docs/
│   └── openapi.yaml
└── go.mod
```

- **Use `internal/` to prevent external packages from importing implementation details.** This is enforced by the Go toolchain.
- **Wire dependencies in `main.go` explicitly** -- construct the database pool, pass it to the store, pass the store to the service, pass the service to the handler. Do not use a DI framework for applications with fewer than 30 dependencies. Use `google/wire` or `uber-go/fx` only when manual wiring becomes impractical.
- **Read configuration from environment variables** using a typed config struct and `os.Getenv`. Use `joho/godotenv` only for local development. Never use it in production code paths.

---

## Output Format

When responding to a Go API patterns question, structure the response as follows:

```
## Assessment

**Router:** [stdlib ServeMux / chi / httprouter] -- [one-sentence rationale]
**Go version:** [version from go.mod or inferred]
**Key constraints:** [list 2-4 constraints driving decisions]

## Server Configuration

```go
// Full http.Server struct with all timeout fields set and annotated
```

## Handler Pattern

```go
// Handler struct with dependencies
// One fully implemented handler method showing the decode -> validate -> process -> respond flow
```

## Middleware Chain

| Position | Middleware       | Scope           | Key Behavior                          |
|----------|-----------------|-----------------|---------------------------------------|
| 1        | CORS            | Global          | Handle OPTIONS before auth            |
| 2        | RequestID       | Global          | Generate, store in ctx, set header    |
| 3        | Recovery        | Global          | Catch panics, log stack, return 500   |
| 4        | StructuredLog   | Global          | Log after handler returns             |
| 5        | Authentication  | Protected routes| Validate JWT, store claims in ctx     |
| 6        | Authorization   | Specific routes | Check role from ctx claims            |
| 7        | RateLimit       | Per-IP or user  | Token bucket, 429 on exceeded         |

## Request Validation

```go
// Validation approach: hand-written or validator struct tags
// Example for the specific input type in the user's question
```

## Graceful Shutdown

```go
// signal.NotifyContext pattern
// srv.Shutdown with timeout
// Background goroutine wait
```

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "human-readable message",
    "fields": {
      "email": "must be a valid email address",
      "age": "must be between 0 and 150"
    }
  }
}
```

## Project Layout

```
[directory tree appropriate to the project size]
```

## Key Decisions

| Decision         | Choice Made       | Alternative Considered | Reason                          |
|-----------------|-------------------|------------------------|----------------------------------|
| Router          | chi               | stdlib ServeMux        | Named params + subrouter middleware |
| Validation      | validator v10     | hand-written           | 15+ input types with complex rules |
| OpenAPI         | oapi-codegen      | swaggo/swag            | API-first, compiler-enforced coverage |
```

---

## Rules

1. **Never leave `http.Server` timeout fields at zero.** A zero `ReadTimeout` means a slow client can hold a goroutine and file descriptor forever. Set all four timeouts (`ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout`) explicitly with documented rationale.

2. **Never use `http.DefaultServeMux` in production services.** It is a package-level global that third-party packages can register routes onto silently. Always construct a new `chi.NewRouter()`, `http.NewServeMux()`, or equivalent explicitly.

3. **Never write to `http.ResponseWriter` after the handler returns.** Goroutine-spawned writes to `w` after the handler exits cause data races and corrupt responses. All writes must complete before the handler function returns.

4. **Always use typed context keys, never plain strings.** `context.WithValue(ctx, "userID", id)` creates a key that any package can accidentally collide with. Define `type contextKey string; const userIDKey contextKey = "user_id"` and use that type.

5. **Never mix 4xx and 5xx semantics.** Return 400 for client-caused malformed input, 422 for semantically invalid input, 401 for missing/invalid authentication, 403 for insufficient authorization, 404 for missing resources, 429 for rate limiting, 500 for unexpected server errors. Do not return 400 when you mean 422, or 500 when you mean 404.

6. **Always call `http.MaxBytesReader` before decoding a request body.** Without it, a malicious client can send a multi-gigabyte body that exhausts server memory. The limit must be set before `json.NewDecoder` reads the first byte.

7. **Never log request bodies in production middleware.** Request bodies may contain passwords, PII, or secrets. Logging is safe only for trace-level debugging behind a feature flag. Always log the request ID, method, path, status code, and duration instead.

8. **Always handle `http.ErrServerClosed` specially in the `ListenAndServe` goroutine.** `Shutdown` causes `ListenAndServe` to return `http.ErrServerClosed`. Treat this as a normal exit, not an error. Any other error from `ListenAndServe` indicates a startup failure and must propagate.

9. **Never use `panic` in handlers for control flow.** Some frameworks use `panic` + recovery for HTTP error propagation. In standard Go HTTP servers, `panic` in a handler is caught by the recovery middleware but terminates the handler goroutine immediately, skipping all deferred cleanup. Use explicit error returns and `respondError` instead.

10. **Always use `json.Decoder.DisallowUnknownFields()` for strict request parsing.** This rejects requests with extra fields, which catches typos in field names that would otherwise be silently ignored. For responses, omit it -- forward compatibility requires tolerating unknown fields from upstream services.

---

## Edge Cases

### Go 1.21 vs 1.22 ServeMux Differences

Go 1.22 introduced method-qualified patterns (`GET /users/{id}`) and wildcard segments (`{name...}`) to the standard library ServeMux. Code using these patterns will not compile under Go 1.21. When advising on stdlib routing, always check the Go version in `go.mod`. If the project is on Go 1.21 or earlier, recommend `chi` v5 (which has compatible patterns) rather than back-porting workarounds. If migrating from 1.21 to 1.22, audit existing ServeMux registrations -- the new mux is stricter about pattern conflicts and will panic at startup on ambiguous patterns.

### Concurrent Map Writes in Per-Route Rate Limiting

Using `golang.org/x/time/rate.Limiter` per client requires a map from client identifier to `*rate.Limiter`. Accessing this map from concurrent request goroutines requires synchronization. A common mistake is protecting only map reads with a `sync.RWMutex` but performing double-checked locking incorrectly -- the read lock must be released before acquiring the write lock, and the existence check must be repeated after acquiring the write lock. Alternatively, use `sync.Map` for this access pattern, which trades some performance for safe concurrent access without explicit lock management.

### Context Cancellation in Long-Running Handlers

When a client disconnects mid-request, `r.Context()` is cancelled. Handlers that pass this context to database queries will correctly propagate cancellation -- `pgx`, `database/sql`, and most HTTP client calls respect context cancellation. However, handlers must check `ctx.Err()` after each cancellable operation and return early. A handler that ignores context cancellation continues consuming resources (DB connections, CPU) for a client that is no longer listening. Additionally, `WriteTimeout` fires independently of context cancellation -- a handler that exceeds `WriteTimeout` will have its connection forcibly closed by the server regardless of what the handler is doing.

### TLS Termination vs. Pass-Through

When TLS is terminated at a load balancer (AWS ALB, nginx, Cloudflare), the Go server receives plaintext. In this case, do not configure `TLSConfig` on `http.Server` -- use `ListenAndServe` not `ListenAndServeTLS`. However, enforce HTTPS at the application level by inspecting the `X-Forwarded-Proto` header (set by the load balancer) and redirecting HTTP to HTTPS if `X-Forwarded-Proto` is `http`. Validate that this header is present only when the request comes from a trusted proxy (validate by IP or by routing topology). A client directly reaching the Go server can spoof `X-Forwarded-Proto: https` -- trust the header only from known proxy IP ranges.

### Handler Panic During JSON Encoding

A panic inside `json.NewEncoder(w).Encode(resp)` is rare but possible when encoding a custom type with a panicking `MarshalJSON` method, or when the response writer's underlying connection drops mid-write. Recovery middleware catches this panic, but at that point `WriteHeader` has already been called (headers sent), so the recovery middleware cannot write a 500 response -- the status code is already committed. To defend against this: validate that response structs are JSON-serializable in unit tests using `json.Marshal` on representative values. Log the panic in recovery middleware with the partial write flag noted.

### Middleware Short-Circuiting and Header Leakage

Authentication middleware that returns 401 before calling `next.ServeHTTP` must ensure it does not inadvertently set headers intended for authenticated responses. A common bug: logging middleware wraps `next.ServeHTTP` to capture the status code, but if `auth` middleware returns 401 and sets headers, the logging middleware still calls `next` -- depending on the composition order. Review every middleware that conditionally short-circuits to ensure it calls `return` after writing its error response and does not call `next.ServeHTTP`. In `chi`, use `r.WithContext` to thread updated context values -- never mutate the request directly.

### Large API Surface with Many Handlers -- Initialization Order

APIs with 50+ endpoints often experience `init()` ordering issues when using package-level route registration patterns (similar to how `database/sql` drivers register themselves). Avoid this entirely: never use `init()` for route registration. Wire all routes explicitly in `server.go` or equivalent, constructing handlers in dependency order in `main`. This makes the full routing table visible in one place and eliminates subtle startup-order bugs.

### Testing Handlers with `httptest`

Handlers should be tested using `net/http/httptest.NewRecorder()` and `httptest.NewRequest()`. Common mistakes include not setting `Content-Type: application/json` on the test request (causing JSON decoders to fail), not calling `r.Body = io.NopCloser(bytes.NewReader(body))` correctly, and asserting on response bodies before checking the status code (which makes failures harder to diagnose). Always assert status code first, then Content-Type header, then unmarshal and assert the response body. For middleware testing, test each middleware in isolation with a trivial `http.HandlerFunc` as the inner handler -- do not test middleware only through end-to-end tests.

---

## Example

**Input:** "I'm building a REST API in Go for a user management service. It needs JWT authentication, request validation, graceful shutdown, and I want to generate OpenAPI docs. We're using Go 1.22 and the team is comfortable with chi. We have about 8 endpoints across users and roles resources."

---

**Output:**

## Assessment

**Router:** `chi` v5 -- subrouter grouping for `/users` and `/roles` with auth middleware scoped to protected routes
**Go version:** 1.22 (native `r.PathValue()` available, method-qualified patterns supported)
**Key constraints:** JWT auth must be middleware-scoped to protected subrouters; OpenAPI spec must stay in sync with implementation; validation needed for all write operations

---

## Server Configuration

```go
// internal/server/server.go
package server

import (
    "context"
    "errors"
    "log/slog"
    "net/http"
    "os/signal"
    "syscall"
    "time"
)

func New(handler http.Handler, log *slog.Logger) *http.Server {
    return &http.Server{
        Addr:              ":8080",
        Handler:           handler,
        ReadHeaderTimeout: 10 * time.Second,  // protect against Slowloris
        ReadTimeout:       30 * time.Second,  // adequate for JSON bodies up to 5MB
        WriteTimeout:      45 * time.Second,  // read + 15s processing budget
        IdleTimeout:       120 * time.Second, // keep-alive connection lifetime
        MaxHeaderBytes:    1 << 20,           // 1 MB header limit
        ErrorLog:          slog.NewLogLogger(log.Handler(), slog.LevelError),
    }
}

func Run(ctx context.Context, srv *http.Server, log *slog.Logger) error {
    shutdownCtx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    errCh := make(chan error, 1)
    go func() {
        log.Info("server starting", "addr", srv.Addr)
        if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            errCh <- err
        }
        close(errCh)
    }()

    select {
    case err := <-errCh:
        return fmt.Errorf("server failed to start: %w", err)
    case <-shutdownCtx.Done():
        stop() // restore default SIGINT behavior so second signal kills the process

        log.Info("shutdown initiated, draining connections")
        timeoutCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()

        if err := srv.Shutdown(timeoutCtx); err != nil {
            return fmt.Errorf("graceful shutdown failed: %w", err)
        }
        log.Info("server stopped cleanly")
        return nil
    }
}
```

---

## Handler Pattern

```go
// internal/handler/user.go
package handler

import (
    "encoding/json"
    "log/slog"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/google/uuid"

    "myapi/internal/service"
    "myapi/internal/validator"
)

type UserHandler struct {
    users  service.UserService
    log    *slog.Logger
}

func NewUserHandler(users service.UserService, log *slog.Logger) *UserHandler {
    return &UserHandler{users: users, log: log}
}

// CreateUser handles POST /users
// Validates input, delegates to service, returns 201 with created user.
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    // 1. Limit body size before any reading
    r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB max

    // 2. Decode
    var req CreateUserRequest
    dec := json.NewDecoder(r.Body)
    dec.DisallowUnknownFields()
    if err := dec.Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "INVALID_JSON", err.Error(), nil)
        return
    }
    defer r.Body.Close()

    // 3. Validate
    if errs := validator.Validate(req); len(errs) > 0 {
        respondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR",
            "request validation failed", errs)
        return
    }

    // 4. Process
    user, err := h.users.Create(r.Context(), service.CreateUserInput{
        Email: req.Email,
        Name:  req.Name,
        Role:  req.Role,
    })
    if err != nil {
        h.log.ErrorContext(r.Context(), "create user failed", "err", err)
        respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR",
            "failed to create user", nil)
        return
    }

    // 5. Respond
    respondJSON(w, http.StatusCreated, envelope{"data": user})
}

// GetUser handles GET /users/{id}
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    rawID := r.PathValue("id") // Go 1.22 stdlib; chi.URLParam(r, "id") for chi routing
    userID, err := uuid.Parse(rawID)
    if err != nil {
        respondError(w, http.StatusBadRequest, "INVALID_ID",
            "user id must be a valid UUID", nil)
        return
    }

    user, err := h.users.ByID(r.Context(), userID)
    if err != nil {
        if errors.Is(err, service.ErrNotFound) {
            respondError(w, http.StatusNotFound, "NOT_FOUND",
                "user not found", nil)
            return
        }
        h.log.ErrorContext(r.Context(), "get user failed", "err", err, "user_id", userID)
        respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR",
            "failed to retrieve user", nil)
        return
    }

    respondJSON(w, http.StatusOK, envelope{"data": user})
}

// -- shared response helpers --

type envelope map[string]any

func respondJSON(w http.ResponseWriter, status int, body any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    _ = json.NewEncoder(w).Encode(body)
}

func respondError(w http.ResponseWriter, status int, code, message string,
    fields map[string]string) {
    body := envelope{
        "error": map[string]any{
            "code":    code,
            "message": message,
            "fields":  fields,
        },
    }
    respondJSON(w, status, body)
}
```

---

## Middleware Chain

| Position | Middleware       | Scope             | Key Behavior                                          |
|----------|-----------------|-------------------|-------------------------------------------------------|
| 1        | CORS            | Global            | Handle OPTIONS preflights before auth runs            |
| 2        | RequestID       | Global            | `crypto/rand` 16-byte hex ID in ctx + response header|
| 3        | Recovery        | Global            | Catch panics, log `debug.Stack()`, return 500         |
| 4        | StructuredLog   | Global            | Log after handler: method, path, status, duration, ID |
| 5        | Authentication  | `/users`, `/roles`| Validate JWT (sig + exp + iss + aud), store claims    |
| 6        | RequireRole     | `DELETE /users/*` | Read claims from ctx, check role field, return 403    |
| 7        | RateLimit       | Global            | 100 req/min per IP, token bucket via x/time/rate      |

```go
// internal/server/routes.go
func BuildRouter(userH *handler.UserHandler, roleH *handler.RoleHandler,
    auth *middleware.AuthMiddleware, log *slog.Logger) http.Handler {

    r := chi.NewRouter()

    // Global middleware -- applied to all routes
    r.Use(middleware.CORS(allowedOrigins))
    r.Use(middleware.RequestID)
    r.Use(middleware.Recovery(log))
    r.Use(middleware.StructuredLogger(log))
    r.Use(middleware.RateLimit(100, time.Minute))

    // Public routes
    r.Get("/health", handleHealth)
    r.Get("/openapi.yaml", serveOpenAPISpec)

    // Protected routes -- auth middleware scoped to this subrouter only
    r.Group(func(r chi.Router) {
        r.Use(auth.Authenticate)

        r.Route("/users", func(r chi.Router) {
            r.Get("/", userH.ListUsers)
            r.Post("/", userH.CreateUser)
            r.Get("/{id}", userH.GetUser)
            r.Patch("/{id}", userH.UpdateUser)
            r.Delete("/{id}", middleware.RequireRole("admin")(userH.DeleteUser))
        })

        r.Route("/roles", func(r chi.Router) {
            r.Get("/", roleH.ListRoles)
            r.Get("/{id}", roleH.GetRole)
        })
    })

    return r
}
```

---

## Request Validation

```go
// internal/validator/validator.go
package validator

import (
    "sync"
    "github.com/go-playground/validator/v10"
)

var (
    once     sync.Once
    instance *validator.Validate
)

func getInstance() *validator.Validate {
    once.Do(func() {
        instance = validator.New(validator.WithRequiredStructEnabled())
        // Register field name from JSON tag for error messages
        instance.RegisterTagNameFunc(func(f reflect.StructField) string {
            name := strings.SplitN(f.Tag.Get("json"), ",", 2)[0]
            if name == "-" { return "" }
            return name
        })
    })
    return instance
}

// Validate runs struct validation and returns a field -> message map.
// Returns nil if validation passes.
func Validate(v any) map[string]string {
    errs := getInstance().Struct(v)
    if errs == nil {
        return nil
    }
    result := make(map[string]string)
    for _, e := range errs.(validator.ValidationErrors) {
        result[e.Field()] = humanize(e)
    }
    return result
}

func humanize(e validator.FieldError) string {
    switch e.Tag() {
    case "required":
        return "this field is required"
    case "email":
        return "must be a valid email address"
    case "min":
        return fmt.Sprintf("must be at least %s characters", e.Param())
    case "max":
        return fmt.Sprintf("must be at most %s characters", e.Param())
    default:
        return fmt.Sprintf("failed validation: %s", e.Tag())
    }
}

// CreateUserRequest is the decoded + validated request body for POST /users
type CreateUserRequest struct {
    Email string `json:"email" validate:"required,email,max=254"`
    Name  string `json:"name"  validate:"required,min=1,max=100"`
    Role  string `json:"role"  validate:"required,oneof=admin editor viewer"`
}
```

---

## Error Response Format

All error responses use a consistent envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "request validation failed",
    "fields": {
      "email": "must be a valid email address",
      "role": "must be one of: admin, editor, viewer"
    }
  }
}
```

| HTTP Status | Code String        | When to Use                                          |
|-------------|--------------------|------------------------------------------------------|
| 400         | `INVALID_JSON`     | Malformed JSON, wrong Content-Type                   |
| 401         | `UNAUTHORIZED`     | Missing or invalid JWT                               |
| 403         | `FORBIDDEN`        | Valid JWT but insufficient role                      |
| 404         | `NOT_FOUND`        | Resource does not exist                              |
| 409         | `CONFLICT`         | Duplicate email, unique constraint violation         |
| 422         | `VALIDATION_ERROR` | Valid JSON but invalid field values                  |
| 429         | `RATE_LIMITED`     | Token bucket exceeded, include `Retry-After` header  |
| 500         | `INTERNAL_ERROR`   | Unexpected server error, do not leak internal detail |

---

## OpenAPI Generation

Using `oapi-codegen` (spec-first):

```yaml
# docs/openapi.yaml (excerpt)
openapi: "3.0.3"
info:
  title: User Management API
  version: "1.0.0"
paths:
  /users:
    post:
      summary: Create a user
      operationId: createUser
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        "201":
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserEnvelope'
        "422":
          $ref: '#/components/responses/ValidationError'
        "401":
          $ref: '#/components/responses/Unauthorized'
```

Generate with:
```bash
oapi-codegen -generate types,chi-server,spec -package api docs/openapi.yaml > internal/api/api.gen.go
```

This produces a `StrictServerInterface` that your handler struct must implement -- the compiler enforces full coverage of all documented operations.

---

## Project Layout

```
userapi/
├── cmd/
│   └── api/
│       └── main.go              -- construct deps, call server.Run()
├── internal/
│   ├── api/
│   │   └── api.gen.go           -- oapi-codegen generated types + interface
│   ├── handler/
│   │   ├── user.go              -- UserHandler struct + methods
│   │   ├── role.go              -- RoleHandler struct + methods
│   │   └── helpers.go           -- respondJSON, respondError, envelope
│   ├── middleware/
│   │   ├── auth.go              -- JWT validation, claims -> context
│   │   ├── cors.go              -- CORS preflight and headers
│   │   ├── logger.go            -- structured request/response logging
│   │   ├── ratelimit.go         -- per-IP token bucket
│   │   ├── recovery.go          -- panic -> 500, log stack trace
│   │   └── requestid.go         -- UUID generation, context storage
│   ├── server/
│   │   ├── routes.go            -- BuildRouter, all route registrations
│   │   └── server.go            -- New(), Run() with graceful shutdown
│   ├── service/
│   │   ├── user.go              -- UserService interface + implementation
│   │   └── errors.go            -- ErrNotFound, ErrConflict sentinels
│   ├── store/
│   │   ├── user.go              -- UserStore interface + pgx implementation
│   │   └── migrations/          -- SQL migration files
│   └── validator/
│       └── validator.go         -- singleton validator, Validate(), humanize()
├── docs/
│   └── openapi.yaml             -- source of truth for API contract
├── go.mod
└── go.sum
```

---

## Key Decisions

| Decision       | Choice Made         | Alternative Considered    | Reason                                                     |
|---------------|---------------------|---------------------------|-------------------------------------------------------------|
| Router        | `chi` v5            | stdlib ServeMux (Go 1.22) | Subrouter-scoped middleware for auth is cleaner in chi      |
| Validation    | `validator` v10     | Hand-written              | 8 input types with nested rules; struct tags scale better   |
| OpenAPI       | `oapi-codegen`      | `swaggo/swag`             | Spec-first, compiler-enforced coverage, no comment drift    |
| Error format  | Typed code + fields | Plain string messages     | Machine-readable for clients, localizable, testable         |
| Config        | `os.Getenv`         | `spf13/viper`             | 12 config values; viper overhead not justified at this scale|
| DI            | Manual constructor  | `uber-go/fx`              | 6 dependencies; fx overhead and indirection not warranted   |
| Logging       | `log/slog`          | `uber-go/zap`             | Go 1.21+ stdlib slog is sufficient; zero external dependency|
