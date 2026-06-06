---
name: go-error-handling
description: |
  Guides expert-level Go error handling: error wrapping with %w, sentinel errors vs custom error types, errors.Is and errors.As patterns, error groups, and structured error propagation.
  Use when the user asks about Go error handling, error wrapping, sentinel errors, errors.Is, errors.As, custom error types, error propagation.
  Do NOT use when the user asks about Go idioms (use `go-idioms`), Go concurrency (use `go-concurrency-patterns`), Go performance (use `go-performance`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "go best-practices debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Go Error Handling

## When to Use

**Use this skill when the user asks about:**
- How to wrap errors with `fmt.Errorf` and the `%w` verb, or when to use `errors.New` vs `fmt.Errorf`
- How to implement sentinel errors (package-level `var Err... = errors.New(...)`) and when they are appropriate
- How to define custom error types (structs implementing the `error` interface) and when they outperform sentinels
- How `errors.Is` and `errors.As` work, how they traverse the error chain, and how to implement custom `Is`/`As` methods
- How to propagate errors across package boundaries without leaking implementation details
- How to annotate errors with contextual information (operation, input, caller) without losing the underlying cause
- How to handle multiple concurrent errors using `errgroup` or manual aggregation

**Do NOT use this skill when:**
- The user asks about general Go idioms like named return values, blank identifiers, or defer patterns -- use `go-idioms`
- The user asks about error handling in goroutines, channel-based error signaling, or `context.Context` cancellation -- use `go-concurrency-patterns`
- The user asks about reducing allocations in the error path or benchmarking error construction overhead -- use `go-performance`
- The user asks about panic/recover as a control flow mechanism -- that falls under `go-idioms` for the recovery pattern and `go-concurrency-patterns` for goroutine panics
- The user is asking about Go module versioning or package structure decisions rather than error semantics

---

## Process

### 1. Identify the Layer and Role of the Code

Determine whether the code under discussion is library/package code, application-level orchestration, or a service boundary (HTTP, gRPC, CLI). This single decision drives every subsequent choice.

- **Library/package code** must never expose internal dependency errors directly. A caller using your `storage` package should not need to import `database/sql` to handle your errors. Wrap with context; expose only your own error types.
- **Application orchestration code** (connecting packages together) should translate errors between layers at each crossing. An error from the database layer becomes a domain error before it reaches the HTTP handler.
- **Service boundary code** (HTTP handlers, gRPC interceptors, CLI `main`) is the correct place to log the full error chain and convert to a user-facing representation (status code, exit code, JSON body).
- **Test code** uses `errors.Is` and `errors.As` assertions rather than string matching. Never use `err.Error() == "some string"` in tests.
- Confirm with the user which layer they are working in before prescribing a pattern. Most confusion about Go error handling comes from applying library patterns inside application code or vice versa.

### 2. Choose the Right Error Representation

Apply this decision tree before writing a single line of code:

- **Use `errors.New("...")`** when the error is a fixed condition that callers identify by identity (sentinel), such as `io.EOF`, `sql.ErrNoRows`. The string is documentation, not a data carrier.
- **Use `fmt.Errorf("operation %s failed: %w", op, err)`** when you need to add context to an existing error without creating a new named type. The `%w` verb makes the wrapped error available to `errors.Is` and `errors.As`.
- **Use a custom struct type** when callers need to extract structured data from the error -- for example, an HTTP status code, a field name that failed validation, or a retry-after duration. If the data matters to the caller's control flow, a struct is mandatory.
- **Use an interface type** when multiple concrete error types share behavior that callers check -- for example, a `Temporary() bool` method for transient network errors.
- Never mix representations arbitrarily. A single package should establish one pattern and apply it consistently across all exported errors.
- The threshold rule: if a caller needs to branch on an error condition more than once anywhere in the codebase, that condition deserves a named sentinel or type -- not a string comparison.

### 3. Define Sentinels and Custom Types Correctly

Sentinel errors live at the package level and are unexported when only used internally, exported when callers must check them:

```go
// Exported sentinel -- callers use errors.Is(err, ErrNotFound)
var ErrNotFound = errors.New("not found")

// Unexported sentinel -- only used inside the package
var errInvalidChecksum = errors.New("invalid checksum")
```

Custom error types must implement `error` via a pointer receiver when the struct is mutated after construction, and a value receiver when the struct is immutable:

```go
// ValidationError carries field-level context for callers using errors.As
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on field %q: %s", e.Field, e.Message)
}
```

- Include an `Op` (operation) string field in domain errors to capture the call site without relying on stack traces.
- Include an `Err` field of type `error` and implement `Unwrap() error` to preserve the chain for `errors.Is`/`errors.As` traversal.
- Never embed `error` as an anonymous field. Define it explicitly as `Err error` and expose it via `Unwrap()`.
- Do not add a `Code int` field that maps to HTTP status codes in a domain package. HTTP concerns belong in the transport layer; map errors to codes there.

### 4. Wrap Errors with Consistent Annotation

Every error that crosses a function boundary in non-trivial code should carry the name of the operation that produced it:

```go
func (r *UserRepository) FindByID(ctx context.Context, id int64) (*User, error) {
    const op = "UserRepository.FindByID"
    row := r.db.QueryRowContext(ctx, "SELECT id, email FROM users WHERE id = $1", id)
    var u User
    if err := row.Scan(&u.ID, &u.Email); err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, fmt.Errorf("%s: %w", op, ErrNotFound)
        }
        return nil, fmt.Errorf("%s: %w", op, err)
    }
    return &u, nil
}
```

- The `op` constant pattern (a string of the form `"TypeName.MethodName"`) produces a human-readable call chain in the final `err.Error()` string without requiring a stack trace library.
- Use `%w` (not `%v`) when the wrapped error identity must be preserved for `errors.Is`/`errors.As`. Use `%v` only when you deliberately want to break the chain (rare; document why).
- Do not wrap an error multiple times with the same context. One annotation per function boundary is the rule.
- At the service boundary, call `err.Error()` once for logging and discard the chain. Never log the chain at every layer -- that produces duplicate log lines.

### 5. Implement errors.Is and errors.As Correctly

`errors.Is(err, target)` traverses the chain by calling `Unwrap()` at each step and comparing with `==`. It works automatically for sentinels. For custom types that represent "the same condition" regardless of field values, implement a custom `Is` method:

```go
// Two NotFoundErrors are "the same" regardless of which resource was missing
func (e *NotFoundError) Is(target error) bool {
    _, ok := target.(*NotFoundError)
    return ok
}
```

`errors.As(err, &target)` traverses the chain and assigns the first error in the chain that is assignable to the target pointer type:

```go
var valErr *ValidationError
if errors.As(err, &valErr) {
    // valErr.Field is now populated
    http.Error(w, valErr.Message, http.StatusUnprocessableEntity)
}
```

- Always pass a pointer to a pointer (`&valErr`) to `errors.As`, never a pointer to an interface.
- `errors.As` will match on type, not value. If you need value-level matching, implement `Is`.
- Do not use type assertions (`err.(*ValidationError)`) in application code. They bypass the chain and break when errors are wrapped. Use `errors.As` exclusively.
- `errors.Unwrap` only handles single-error chains. For multi-error types (joining errors), the type must implement `Unwrap() []error` (available since Go 1.20).

### 6. Handle Multi-Error Scenarios with errgroup and errors.Join

When launching concurrent operations where all errors should be collected:

```go
import "golang.org/x/sync/errgroup"

func processItems(ctx context.Context, items []Item) error {
    g, ctx := errgroup.WithContext(ctx)
    for _, item := range items {
        item := item // capture loop variable (pre-Go 1.22)
        g.Go(func() error {
            return processOne(ctx, item)
        })
    }
    return g.Wait() // returns the first non-nil error; cancels ctx
}
```

For accumulating all errors (not just the first):

```go
// Go 1.20+: errors.Join returns a multi-error that errors.Is/As traverses
func validateAll(fields []Field) error {
    var errs []error
    for _, f := range fields {
        if err := validate(f); err != nil {
            errs = append(errs, err)
        }
    }
    return errors.Join(errs...) // nil if errs is empty
}
```

- `errgroup.WithContext` cancels the derived context when any goroutine returns a non-nil error. Design your goroutines to respect `ctx.Done()`.
- `errors.Join` returns nil when all inputs are nil -- no nil-guard needed.
- For cases where you need all errors but also need to preserve type information across the multi-error, implement a custom aggregate type with `Unwrap() []error`.
- Do not use `errgroup` when the order of results matters or when partial success has meaning. Use explicit channel-based collection in those cases.

### 7. Handle Errors at Service and API Boundaries

At the HTTP handler layer, translate domain errors to status codes using a dedicated mapper:

```go
func errorToStatusCode(err error) int {
    switch {
    case errors.Is(err, ErrNotFound):
        return http.StatusNotFound
    case errors.Is(err, ErrUnauthorized):
        return http.StatusUnauthorized
    case errors.Is(err, ErrConflict):
        return http.StatusConflict
    default:
        var valErr *ValidationError
        if errors.As(err, &valErr) {
            return http.StatusUnprocessableEntity
        }
        return http.StatusInternalServerError
    }
}
```

- Log the full error chain at the boundary (handler or middleware), never inside service or repository layers.
- Include a `request_id` or `trace_id` in both the log entry and the error response body so support staff can correlate.
- Never expose `err.Error()` in a production HTTP response body. It leaks implementation details and internal paths.
- At gRPC boundaries, use `status.Error(codes.NotFound, "resource not found")` and map domain errors to gRPC status codes in a server interceptor rather than in each handler.
- CLI tools should print `fmt.Fprintf(os.Stderr, "error: %v\n", err)` and exit with a non-zero code. Use `os.Exit(1)` for unrecoverable errors and `os.Exit(2)` for usage errors.

### 8. Validate the Error Strategy with Tests

Every exported error condition must have a test that uses `errors.Is` or `errors.As` rather than string matching:

```go
func TestFindByID_NotFound(t *testing.T) {
    repo := newTestRepo(t)
    _, err := repo.FindByID(context.Background(), 99999)
    if !errors.Is(err, ErrNotFound) {
        t.Fatalf("expected ErrNotFound, got %v", err)
    }
}

func TestFindByID_ValidationError(t *testing.T) {
    repo := newTestRepo(t)
    _, err := repo.FindByID(context.Background(), -1)
    var valErr *ValidationError
    if !errors.As(err, &valErr) {
        t.Fatalf("expected *ValidationError, got %v", err)
    }
    if valErr.Field != "id" {
        t.Errorf("expected field 'id', got %q", valErr.Field)
    }
}
```

- Test both the positive path and the wrapped path: if `FindByID` wraps `ErrNotFound`, then `errors.Is` must still return true through the wrapper.
- Use `github.com/google/go-cmp/cmp` for comparing error field values when struct equality matters.
- Add a test that verifies the `op` chain in `err.Error()` contains the expected function names, to guard against accidental chain breaks.

---

## Output Format

When responding to a user question about Go error handling, structure the answer as follows:

```
## Error Handling Analysis: [Specific Scenario]

### Layer and Context
[Which layer this code lives in, what boundary it crosses, what callers need]

### Error Type Decision
| Situation | Representation | Rationale |
|-----------|---------------|-----------|
| [condition] | sentinel / custom type / wrapped fmt.Errorf | [why] |

### Error Type Definitions
```go
// All sentinel vars and custom types for this scenario
```

### Propagation Pattern
```go
// Annotated function showing the wrapping pattern at each boundary
```

### Caller Handling Pattern
```go
// How callers use errors.Is / errors.As to branch on this error
```

### Service Boundary Mapping (if applicable)
```go
// Error-to-status-code mapper or gRPC status mapping
```

### Testing Pattern
```go
// Test cases verifying errors.Is / errors.As behavior through the chain
```

### Key Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]
```

---

## Rules

1. **Never use `err.Error()` for control flow.** String comparison against error messages is fragile -- any rewording breaks it silently. Always use `errors.Is` for sentinel comparison and `errors.As` for type-based branching.

2. **Use `%w` for wrapping, `%v` to discard the chain.** `fmt.Errorf("context: %v", err)` permanently severs the chain. Use it only when you explicitly want to prevent callers from inspecting the underlying cause (for example, to avoid leaking a third-party library's error types).

3. **One annotation per function boundary, not per line.** Wrapping the same error twice in the same function adds noise. Collect context once at the function's exit point using a named return and `defer` if needed.

4. **Library packages must never log errors.** Logging is the responsibility of the caller at the boundary. A library that logs produces duplicate log lines and couples itself to a logging implementation. Return errors; never swallow them.

5. **Sentinel errors must be unexported unless callers must check them.** Exporting a sentinel creates a public API contract. If the error is only checked internally, keep it unexported. Reducing the exported surface makes future refactoring safer.

6. **Do not use `panic` for expected error conditions.** `panic` is for invariant violations (nil pointer where impossible, index out of bounds in provably correct code). Network timeouts, missing rows, invalid input -- these are all expected and must be returned as errors.

7. **Implement `Unwrap() error` on every custom error type that wraps another error.** Without `Unwrap`, `errors.Is` and `errors.As` cannot traverse the chain through your type. This is the most common cause of `errors.Is` returning false unexpectedly.

8. **Do not create an error hierarchy deeper than two levels.** A `base error` -> `domain error` -> `sub-domain error` chain is difficult to maintain and rarely provides value over a flat set of typed errors. Prefer composition via the `Err error` field over inheritance.

9. **Validate error handling in CI with `errcheck`.** The `errcheck` linter (or `staticcheck SA9003`) flags unchecked errors. Run it in CI. Unchecked errors are the primary source of silent data corruption and undefined behavior in Go.

10. **Always handle `context.Canceled` and `context.DeadlineExceeded` explicitly at boundaries.** These errors arrive from `ctx.Err()` or wrapped by library calls. Treat them as expected termination conditions, not failures. Log at `DEBUG` level, not `ERROR`, and return an appropriate user-facing message (408 Request Timeout, not 500).

---

## Edge Cases

### Wrapping Third-Party Library Errors

When a dependency uses its own sentinel errors (e.g., `pgx.ErrNoRows`, `redis.Nil`), do not re-export those sentinels or let them leak through your package boundary. Map them to your own domain sentinels at the repository layer:

```go
if errors.Is(err, pgx.ErrNoRows) {
    return nil, fmt.Errorf("%s: %w", op, ErrNotFound)
}
```

This decouples your domain from the persistence library. If you later swap `pgx` for the standard `database/sql`, callers do not change. The tradeoff is that the original pgx error information is lost below the sentinel -- log it before wrapping if the original error carries useful diagnostic data (e.g., a pgx `PgError` with a `Code` field).

### Circular Unwrap Chains

A custom `Unwrap` that returns itself or creates a cycle will cause `errors.Is` to loop until the stack overflows. This cannot happen with `fmt.Errorf("%w", err)` (Go's implementation guards against cycles), but it can happen with handwritten `Unwrap` methods that return fields incorrectly. Always return a different (inner) error from `Unwrap`, never `e` itself. Audit custom `Unwrap` implementations during code review.

### Pre-Go 1.20 Multi-Error Support

`errors.Join` and `Unwrap() []error` were introduced in Go 1.20. If the project's `go.mod` specifies an older minimum version, implement a custom aggregate type:

```go
type MultiError struct {
    Errors []error
}

func (m *MultiError) Error() string {
    msgs := make([]string, len(m.Errors))
    for i, e := range m.Errors {
        msgs[i] = e.Error()
    }
    return strings.Join(msgs, "; ")
}

func (m *MultiError) Unwrap() []error {
    return m.Errors
}
```

Note: `Unwrap() []error` is only traversed by `errors.Is`/`errors.As` in Go 1.20+. On older versions, callers must type-assert to `*MultiError` and iterate `Errors` manually.

### errors.Is Failing Unexpectedly Across Package Boundaries

If two packages both define `var ErrNotFound = errors.New("not found")`, they are distinct values. `errors.Is(err, pkgA.ErrNotFound)` will never match an error wrapping `pkgB.ErrNotFound`. This is intentional -- sentinel identity is pointer equality. The fix is a single authoritative definition in a shared domain package, imported by both. Never duplicate sentinels. If you cannot change the producing package, use `errors.As` with a custom `Is` method on your type to match by semantic meaning rather than pointer identity.

### Errors in defer Cleanup

When a function defers cleanup that can itself fail (closing a file, rolling back a transaction), the cleanup error must not silently overwrite the primary error:

```go
func writeAndClose(path string, data []byte) (err error) {
    f, err := os.Create(path)
    if err != nil {
        return fmt.Errorf("writeAndClose: create: %w", err)
    }
    defer func() {
        if cerr := f.Close(); cerr != nil && err == nil {
            err = fmt.Errorf("writeAndClose: close: %w", cerr)
        }
    }()
    if _, err = f.Write(data); err != nil {
        return fmt.Errorf("writeAndClose: write: %w", err)
    }
    return nil
}
```

The named return `err` allows the deferred close to inspect the primary error. If the primary error already exists, the close error is logged (or appended via `errors.Join`) rather than overwriting. Never silently discard cleanup errors in deferred functions.

### Handling Errors from goroutines in non-errgroup Code

When goroutines cannot use `errgroup` (e.g., long-lived background workers), errors must be sent on a dedicated channel. Never have a goroutine log and continue when an error should terminate the worker:

```go
errCh := make(chan error, 1) // buffered to avoid goroutine leak
go func() {
    if err := worker.Run(ctx); err != nil && !errors.Is(err, context.Canceled) {
        errCh <- fmt.Errorf("worker: %w", err)
    }
    close(errCh)
}()
// In the supervisor:
if err := <-errCh; err != nil {
    log.Error("worker failed", "error", err)
}
```

Buffer the error channel by at least 1 to prevent goroutine leaks if the supervisor exits before reading. Always filter out `context.Canceled` -- it is expected shutdown behavior, not a failure.

### Sentinel vs. Custom Type for HTTP Client Errors

When wrapping HTTP client errors, a common mistake is using a sentinel for "request failed" when the HTTP status code is needed by the caller:

```go
// Wrong -- callers cannot extract the status code
var ErrRequestFailed = errors.New("request failed")

// Correct -- callers use errors.As to retrieve HTTPError.StatusCode
type HTTPError struct {
    StatusCode int
    Body       string
}
func (e *HTTPError) Error() string {
    return fmt.Sprintf("HTTP %d: %s", e.StatusCode, e.Body)
}
```

Use sentinels for binary conditions (found/not found, authorized/not authorized). Use custom types whenever the caller needs numeric codes, field names, retry hints, or any structured data to make a control-flow decision.

---

## Example

**Input:** "I have a `UserService` that calls a `UserRepository` for database access and an HTTP handler that calls the service. I need to handle: user not found, duplicate email, and validation errors (bad email format). What's the complete error handling setup?"

**Output:**

---

## Error Handling Analysis: UserService Three-Layer Stack

### Layer and Context

- `UserRepository` -- database layer, wraps `database/sql` errors, must not expose SQL internals
- `UserService` -- domain layer, orchestrates business rules, translates repository errors to domain errors
- `UserHandler` -- HTTP transport layer, maps domain errors to status codes and JSON responses

### Error Type Decision

| Situation | Representation | Rationale |
|-----------|---------------|-----------|
| User not found | `var ErrUserNotFound = errors.New(...)` | Binary condition; callers branch on presence/absence, need no data |
| Duplicate email | `var ErrEmailConflict = errors.New(...)` | Binary condition; the conflicting email is already known to the caller |
| Validation failure | `*ValidationError` with `Field` and `Message` | Callers need to know which field failed and why to produce a useful response |

### Error Type Definitions

```go
// package domain

import "errors"

// Sentinel errors -- exported for use by service and transport layers
var (
    ErrUserNotFound = errors.New("user not found")
    ErrEmailConflict = errors.New("email already in use")
)

// ValidationError carries field-level context extracted by the HTTP handler
type ValidationError struct {
    Field   string
    Message string
    Err     error // underlying cause, if any
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on field %q: %s", e.Field, e.Message)
}

// Unwrap allows errors.Is / errors.As to traverse through ValidationError
func (e *ValidationError) Unwrap() error {
    return e.Err
}
```

### Propagation Pattern

```go
// package repository

const driverDuplicateKeyCode = "23505" // PostgreSQL unique violation

func (r *UserRepository) Create(ctx context.Context, u *domain.User) error {
    const op = "UserRepository.Create"
    _, err := r.db.ExecContext(ctx,
        "INSERT INTO users (email, name) VALUES ($1, $2)", u.Email, u.Name)
    if err != nil {
        var pgErr *pgconn.PgError
        if errors.As(err, &pgErr) && pgErr.Code == driverDuplicateKeyCode {
            // Translate driver-specific error to domain sentinel
            return fmt.Errorf("%s: %w", op, domain.ErrEmailConflict)
        }
        return fmt.Errorf("%s: %w", op, err)
    }
    return nil
}

func (r *UserRepository) FindByID(ctx context.Context, id int64) (*domain.User, error) {
    const op = "UserRepository.FindByID"
    row := r.db.QueryRowContext(ctx, "SELECT id, email, name FROM users WHERE id = $1", id)
    var u domain.User
    if err := row.Scan(&u.ID, &u.Email, &u.Name); err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, fmt.Errorf("%s: %w", op, domain.ErrUserNotFound)
        }
        return nil, fmt.Errorf("%s: %w", op, err)
    }
    return &u, nil
}
```

```go
// package service

func (s *UserService) RegisterUser(ctx context.Context, email, name string) (*domain.User, error) {
    const op = "UserService.RegisterUser"

    // Validate input -- produce a typed error with field context
    if !isValidEmail(email) {
        return nil, &domain.ValidationError{
            Field:   "email",
            Message: "must be a valid email address",
        }
    }
    if strings.TrimSpace(name) == "" {
        return nil, &domain.ValidationError{
            Field:   "name",
            Message: "must not be blank",
        }
    }

    u := &domain.User{Email: email, Name: name}
    if err := s.repo.Create(ctx, u); err != nil {
        // ErrEmailConflict propagates as-is -- already a domain error
        // Unexpected errors get op annotation
        if errors.Is(err, domain.ErrEmailConflict) {
            return nil, err // already annotated by repository
        }
        return nil, fmt.Errorf("%s: %w", op, err)
    }
    return u, nil
}
```

### Caller Handling Pattern

```go
// package transport (HTTP handler)

func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
    var req RegisterRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid request body", "")
        return
    }

    user, err := h.service.RegisterUser(r.Context(), req.Email, req.Name)
    if err != nil {
        h.handleServiceError(w, r, err)
        return
    }
    writeJSON(w, http.StatusCreated, user)
}

func (h *UserHandler) handleServiceError(w http.ResponseWriter, r *http.Request, err error) {
    // Log the full chain at the boundary -- only here, not inside the service or repo
    h.logger.Error("register user failed",
        "error", err,
        "request_id", requestIDFromContext(r.Context()),
    )

    switch {
    case errors.Is(err, domain.ErrEmailConflict):
        writeError(w, http.StatusConflict, "email already registered", "")
    case errors.Is(err, domain.ErrUserNotFound):
        // Should not occur in Register, but handle defensively
        writeError(w, http.StatusNotFound, "user not found", "")
    default:
        var valErr *domain.ValidationError
        if errors.As(err, &valErr) {
            writeError(w, http.StatusUnprocessableEntity,
                valErr.Message,
                valErr.Field,
            )
            return
        }
        // Unknown error -- do not expose internals
        writeError(w, http.StatusInternalServerError, "an unexpected error occurred", "")
    }
}
```

### Service Boundary Mapping

```go
// writeError writes a structured JSON error response
type ErrorResponse struct {
    Error   string `json:"error"`
    Field   string `json:"field,omitempty"`
    TraceID string `json:"trace_id,omitempty"`
}

func writeError(w http.ResponseWriter, status int, message, field string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(ErrorResponse{
        Error: message,
        Field: field,
    })
}
```

### Testing Pattern

```go
// package service_test

func TestRegisterUser_DuplicateEmail(t *testing.T) {
    repo := &fakeUserRepo{createErr: domain.ErrEmailConflict}
    svc := NewUserService(repo)

    _, err := svc.RegisterUser(context.Background(), "alice@example.com", "Alice")
    if !errors.Is(err, domain.ErrEmailConflict) {
        t.Fatalf("expected ErrEmailConflict, got %v", err)
    }
}

func TestRegisterUser_InvalidEmail(t *testing.T) {
    svc := NewUserService(&fakeUserRepo{})

    _, err := svc.RegisterUser(context.Background(), "not-an-email", "Alice")

    var valErr *domain.ValidationError
    if !errors.As(err, &valErr) {
        t.Fatalf("expected *ValidationError, got %v", err)
    }
    if valErr.Field != "email" {
        t.Errorf("expected field 'email', got %q", valErr.Field)
    }
}

func TestRegisterUser_RepoError_WrapsCorrectly(t *testing.T) {
    underlying := errors.New("connection reset by peer")
    repo := &fakeUserRepo{createErr: underlying}
    svc := NewUserService(repo)

    _, err := svc.RegisterUser(context.Background(), "alice@example.com", "Alice")

    // errors.Is traverses the wrapped chain -- the op annotation must not break it
    if !errors.Is(err, underlying) {
        t.Fatalf("expected chain to contain underlying error, got %v", err)
    }
    // The error message should carry the op chain
    if !strings.Contains(err.Error(), "UserService.RegisterUser") {
        t.Errorf("expected op in error message, got %q", err.Error())
    }
}
```

### Key Decisions

- `ErrEmailConflict` is a sentinel because the HTTP handler branches on it with no additional data needed -- the conflicting email is already in the request.
- `ValidationError` is a struct because the HTTP handler needs `Field` to produce a machine-readable response that frontend clients can use to highlight the specific form field.
- The repository translates `pgconn.PgError` with code `23505` to `ErrEmailConflict` at the data layer boundary, so neither the service nor the handler needs to import `pgconn`.
- Logging happens exclusively in `handleServiceError`. The repository and service return errors without logging, preventing duplicate log entries.
- All `errors.As` calls use a pointer to a typed pointer (`&valErr` where `valErr` is `*domain.ValidationError`), not a pointer to an interface.
- The test for repo error wrapping verifies that `%w` is used (not `%v`) by asserting `errors.Is(err, underlying)` is true through two layers of wrapping.
