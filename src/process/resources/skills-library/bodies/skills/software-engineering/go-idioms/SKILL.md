---
name: go-idioms
description: |
  Teaches expert-level Go idiomatic patterns: error returns, interface design, embedding, functional options pattern, table-driven design, and effective use of the standard library.
  Use when the user asks about Go idioms, interface design, embedding, functional options, error returns, Go best practices, standard library.
  Do NOT use when the user asks about Go project setup (use `go-project-setup`), Go concurrency (use `go-concurrency-patterns`), Go error handling (use `go-error-handling`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "go best-practices clean-code"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Go Idioms

## When to Use

**Use this skill when:**
- The user asks how to design a Go interface and is unsure how large or small it should be, whether to use embedding, or how to decide what belongs on an interface
- The user wants to implement the functional options pattern (also called "option functions" or "variadic options") for configuring a struct or constructor
- The user asks how to write idiomatic Go: proper receiver naming, zero-value usability, named return values, blank identifiers, or init functions
- The user wants to know when and how to use type embedding versus composition, and how promoted methods interact with the outer type
- The user is writing table-driven tests and wants to know the canonical Go structure, sub-test naming, and how to use `t.Run`
- The user asks about the standard library's conventions -- how `io.Reader`/`io.Writer` compose, when to use `bufio`, how `sync.Once` and `sync.Pool` are intended to be used
- The user is reviewing Go code for idiomatic quality, naming conventions (`CamelCase` vs `mixedCaps`), package naming, or comment style per `godoc`
- The user is converting code from another language (Python, Java, C#) into idiomatic Go and wants to shed OOP patterns like inheritance hierarchies or checked exceptions

**Do NOT use this skill when:**
- The user asks about Go project layout, module initialization, `go.mod` management, or build toolchain setup -- use `go-project-setup` instead
- The user asks about goroutines, channels, `select`, `sync.WaitGroup`, `sync.Mutex`, or concurrent data structures -- use `go-concurrency-patterns` instead
- The user asks about wrapping errors with `%w`, `errors.Is`, `errors.As`, sentinel errors, or custom error types -- use `go-error-handling` instead
- The user needs help with a specific Go framework (Gin, Echo, Chi) rather than core language idioms
- The user is asking about Go generics type constraints and parametric polymorphism at depth -- that is a separate specialization

---

## Process

### 1. Identify the Primary Idiomatic Pattern Category

Before writing any code, classify what the user actually needs. Go idioms fall into five categories -- choose the one that most directly addresses the question:

- **Type design**: zero-value readiness, struct field ordering (largest fields first to minimize padding), unexported fields with exported accessors only when mutation must be controlled
- **Interface design**: size (aim for 1--3 methods), placement in the consumer package not the producer package, implicit satisfaction
- **Constructor and configuration**: functional options vs. config structs vs. `New(required) + setters`
- **Control flow and data transformation**: table-driven logic, the `comma ok` idiom, `for range` with blank identifiers, `defer` for cleanup
- **Standard library integration**: choosing the right `io` abstraction, using `strings.Builder` not `bytes.Buffer` for string construction, `encoding/json` tags and `omitempty`

Determine which category applies before generating any code. A question about "how do I make my Server configurable?" is a constructor/configuration question, not an interface question.

### 2. Apply Zero-Value and Struct Design Principles

Every Go struct should be usable in its zero state wherever possible. This is a load-bearing idiom in the standard library (`sync.Mutex`, `bytes.Buffer`, `http.Client`).

- A zero-value `sync.Mutex` is unlocked and ready -- model your own types similarly
- Use pointer fields sparingly; prefer value fields and initialize lazily inside methods with `sync.Once` when needed
- Order struct fields by size to reduce alignment padding: `int64` and `*T` (8 bytes) first, then `int32` (4 bytes), then `int16`, then `int8`/`bool` last; this can reduce struct size by 30--50% for dense structs
- Unexported fields enforce invariants; exported fields signal that callers can modify them freely -- most non-trivial structs should have unexported fields
- Avoid init functions that perform I/O, register globals, or have side effects; prefer explicit construction

Example zero-value ready pattern:
```go
type RateLimiter struct {
    mu    sync.Mutex
    count int64
    limit int64
}

func (r *RateLimiter) Allow() bool {
    r.mu.Lock()
    defer r.mu.Unlock()
    if r.limit == 0 {
        return true // zero-value: unlimited
    }
    r.count++
    return r.count <= r.limit
}
```

### 3. Design Interfaces at the Right Level

Go interfaces should be defined at the point of consumption, not at the point of definition. This is the single most misunderstood Go idiom coming from Java or C#.

- Define interfaces in the package that **uses** the behavior, not the package that implements it -- this breaks circular imports and enables decoupled testing
- Keep interfaces small: `io.Reader` has 1 method, `io.ReadWriter` has 2, `http.Handler` has 1 -- these are the canonical examples
- The 1-method interface is the workhorse of Go; name it after the method with an `-er` suffix: `Reader`, `Writer`, `Closer`, `Stringer`, `Handler`
- A 3-method interface is the practical maximum before you should question whether it is a coherent abstraction
- Never pre-emptively create interfaces "for extensibility" -- let the consumer define them when a real second implementation exists
- Embed standard library interfaces to compose capability:
```go
type ReadSeekCloser interface {
    io.ReadSeeker
    io.Closer
}
```
- Accept interfaces, return concrete types -- the canonical Go API shape; callers can always wrap a concrete type in an interface themselves

Decision rule: If there is only one implementation and no test double needed, **do not create an interface**. Add it when the second real use case arrives.

### 4. Implement Functional Options for Configurable Constructors

When a constructor has more than 2--3 optional parameters, or when you anticipate adding parameters over the life of a package, use the functional options pattern. This is the modern Go idiom, preferred over config structs for library code.

The canonical structure:
```go
// server.go
type Server struct {
    host    string
    port    int
    timeout time.Duration
    maxConn int
}

type Option func(*Server)

func WithHost(h string) Option {
    return func(s *Server) { s.host = h }
}

func WithPort(p int) Option {
    return func(s *Server) { s.port = p }
}

func WithTimeout(d time.Duration) Option {
    return func(s *Server) { s.timeout = d }
}

func WithMaxConnections(n int) Option {
    return func(s *Server) { s.maxConn = n }
}

func NewServer(opts ...Option) *Server {
    s := &Server{
        host:    "localhost", // sane defaults
        port:    8080,
        timeout: 30 * time.Second,
        maxConn: 100,
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}
```

Key rules for functional options:
- Always set production-ready defaults inside `New*`, before applying options
- Return `Option` (the function type), not apply the function directly -- this allows options to be stored, composed, and conditionally applied
- Validate after applying options, not inside each option function -- keep option functions simple
- For library packages: export the Option type; for internal packages: unexported `option` type is fine
- Config struct pattern is acceptable when all fields are required or when the struct is also serialized (e.g., from a YAML config file) -- functional options are not JSON-serializable

When to prefer a config struct over functional options:
- The struct is loaded from a file or environment (use `envconfig` or `viper`)
- All fields are required and there are no sensible defaults
- The team is unfamiliar with first-class functions

### 5. Write Table-Driven Tests Using `t.Run`

Table-driven tests are the canonical Go testing idiom. Every Go developer should be able to read and write them immediately.

```go
func TestDivide(t *testing.T) {
    t.Parallel()
    tests := []struct {
        name      string
        numerator   float64
        denominator float64
        want        float64
        wantErr     bool
    }{
        {name: "positive integers", numerator: 10, denominator: 2, want: 5},
        {name: "negative denominator", numerator: 10, denominator: -2, want: -5},
        {name: "divide by zero", numerator: 10, denominator: 0, wantErr: true},
        {name: "fractional result", numerator: 7, denominator: 2, want: 3.5},
    }

    for _, tt := range tests {
        tt := tt // capture range variable (required pre-Go 1.22)
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            got, err := Divide(tt.numerator, tt.denominator)
            if (err != nil) != tt.wantErr {
                t.Fatalf("Divide() error = %v, wantErr %v", err, tt.wantErr)
            }
            if !tt.wantErr && got != tt.want {
                t.Errorf("Divide() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

Key conventions:
- Use `tt` as the loop variable name -- this is community-wide convention
- Add `tt := tt` inside the loop when using `t.Parallel()` in sub-tests (not needed in Go 1.22+, where the loop variable is scoped per iteration)
- Name test cases with human-readable lowercase descriptions, not `"test1"`, `"case2"`
- Use `t.Fatalf` when the test cannot proceed (nil pointer risk), `t.Errorf` for independent checks
- Add `t.Helper()` inside any helper function that calls `t.Error`/`t.Fatal` so line numbers point to the call site
- Keep `want` for expected values and `got` for actual values -- these names are conventional throughout the Go standard library and test packages

### 6. Use the Standard Library as the First Dependency

Go's standard library is extraordinarily complete. Reaching for third-party packages before exhausting standard library options is an anti-pattern.

Key standard library patterns and their correct usage:

**`strings` and `bytes`:**
- Use `strings.Builder` for building strings in a loop -- it avoids allocation on each concatenation unlike `+` in a loop
- Use `bytes.Buffer` when you need a `io.Writer` and `io.Reader` on the same buffer -- but `strings.Builder` only implements `io.Writer`
- `strings.Split` returns `[]string{""}` (a slice with one empty string) for an empty input -- check `len(parts) == 1 && parts[0] == ""` before iterating
- Prefer `strings.ContainsRune` over `strings.Contains` when checking for a single character

**`io` package composition:**
- `io.Copy(dst, src)` is the idiomatic way to move data between `io.Reader` and `io.Writer` -- it uses an internal 32KB buffer
- `io.LimitReader(r, n)` wraps any reader to read at most `n` bytes -- essential for untrusted input
- `io.MultiWriter(w1, w2)` fans out a write to multiple writers simultaneously
- `io.TeeReader(r, w)` reads from `r` while writing to `w` -- useful for logging or hashing alongside reading
- `io.Pipe()` creates a synchronous in-memory pipe connecting an `io.Writer` to an `io.Reader`

**`bufio`:**
- Always wrap a `net.Conn` or file in `bufio.NewReader`/`bufio.NewWriter` before performing many small reads/writes -- raw syscall overhead is significant
- Default buffer size is 4096 bytes; use `bufio.NewReaderSize(r, 65536)` for large streaming reads
- `bufio.Scanner` is the correct idiom for reading line-by-line; the default split function is `ScanLines`

**`encoding/json`:**
- Use `json:"fieldname,omitempty"` for optional fields -- `omitempty` omits zero values (0, false, nil, "", empty slice)
- Implement `json.Marshaler` and `json.Unmarshaler` interfaces for types that need custom serialization
- `json.Decoder` is preferred over `json.Unmarshal` when reading from a stream (`http.Request.Body`) -- it does not read the entire body into memory first
- Never use `interface{}` (or `any`) as a decode target when you know the schema -- use a typed struct

**`time`:**
- Always store and compare `time.Time` values in UTC: `t.UTC()`
- Use `time.Since(start)` instead of `time.Now().Sub(start)` for elapsed time
- Never use `time.Sleep` in production code that needs to be testable -- inject a clock or use a ticker

### 7. Apply Naming and Comment Conventions Rigorously

Go naming is load-bearing -- the compiler and tooling rely on capitalization for visibility, and `godoc` generates documentation directly from comments.

- **Package names**: single lowercase word, no underscores, no `util`, no `common`, no `helpers` -- name packages by what they provide, not what they contain
- **Exported names**: always `CamelCase`, never `camelCase` for exported symbols; `ID` not `Id`, `URL` not `Url`, `HTTP` not `Http` -- acronyms are all caps
- **Receiver names**: short, 1--2 characters, consistent throughout the type, typically the first letter of the type: `func (s *Server) Start()` not `func (server *Server) Start()`
- **Getter methods**: no `Get` prefix in Go -- `obj.Name()` not `obj.GetName()`; setter methods may use `SetName()` but prefer functional options for struct construction
- **Boolean variable names**: `isActive`, `hasError`, `ok` -- the `ok` pattern is idiomatic for the two-return `value, ok` idiom
- **Comment style**: exported symbols must have a comment starting with the symbol name: `// Server handles incoming HTTP connections.` -- `golint` and `staticcheck` will flag missing doc comments
- **Error variable names**: unexported sentinel errors use `errNotFound`; exported sentinel errors use `ErrNotFound` following the `io.EOF` convention

### 8. Evaluate and Apply Type Embedding Correctly

Embedding is Go's primary mechanism for code reuse. It is not inheritance -- promoted methods do not create an "is-a" relationship. Use it to express a "has-a plus delegation" relationship.

Decision criteria for embedding:
- **Embed** when the outer type genuinely wants to expose all the methods of the inner type as its own API
- **Compose with named field** when you want the inner type's functionality but do not want to expose all its methods
- **Embed interfaces** in interfaces to compose capabilities (this is idiomatic and encouraged)
- **Embed interfaces in structs** with caution -- this enables partial implementation of an interface (useful for test doubles) but causes panics at runtime if the embedded interface field is nil and an unimplemented method is called

```go
// Embedding for method promotion -- all io.ReadWriter methods become Logger methods
type Logger struct {
    io.ReadWriter // promoted: Read and Write are Logger's methods
    prefix string
}

// Named field composition -- Client has an http.Client but does not expose its methods
type Client struct {
    http   *http.Client // unexported -- callers cannot reach http.Client directly
    apiKey string
}

// Interface embedding in structs for test doubles
type PartialFS struct {
    fs.FS // embed the interface -- only implement what the test needs
}

func (p PartialFS) Open(name string) (fs.File, error) {
    // only Open is implemented; Glob, ReadDir, etc. would panic if called
    return os.Open(name)
}
```

Embedding traps to avoid:
- The outer type does not satisfy an interface "through" embedding if it shadows any embedded method with its own method of the same name -- the shadowing method wins
- Two embedded types with identically named methods cause a compile error at the call site, not at the embedding declaration
- Embedding `*sync.Mutex` (pointer) instead of `sync.Mutex` (value) means the mutex can be nil at zero value -- prefer value embedding

---

## Output Format

When answering a Go idioms question, structure the response as follows:

```
## Pattern: [Pattern Name]

### When This Pattern Applies
[1-3 sentences identifying the specific situation]

### The Idiomatic Go Approach
[Code block with complete, compilable Go code]

### Why This Is Idiomatic
- [Bullet 1: connection to Go spec, standard library, or community convention]
- [Bullet 2: what it enables (testability, composability, extensibility)]
- [Bullet 3: what alternatives exist and why this is preferred]

### Common Mistakes
| Mistake | Problem | Fix |
|---------|---------|-----|
| [Anti-pattern 1] | [Why it's wrong] | [Correct approach] |
| [Anti-pattern 2] | [Why it's wrong] | [Correct approach] |

### Trade-offs
| Factor | This Pattern | Alternative |
|--------|-------------|-------------|
| Readability | [assessment] | [assessment] |
| Performance | [assessment] | [assessment] |
| Testability | [assessment] | [assessment] |
| Binary size | [assessment] | [assessment] |

### Minimal Working Example
[Complete, runnable Go code with package declaration, imports, and main or test function]
```

For multi-pattern questions, repeat the block above for each pattern and add a summary decision matrix at the end.

---

## Rules

1. **Never define an interface in the same package that provides the only implementation.** The producer package returns a concrete type. The consumer package defines the interface it needs. This is how `net/http`, `io`, and `database/sql` all work -- breaking this rule creates circular import risks and tight coupling.

2. **Never use a pointer receiver on a type that has a zero-value usable state unless the method must mutate state.** Use value receivers for read-only methods on small structs (under ~64 bytes). Use pointer receivers consistently if any method requires mutation -- mixing receiver types on one type causes confusion and makes the type fail to satisfy interface expectations.

3. **Never write a functional option that panics or returns an error.** Option functions must be pure value-setting operations. Validation belongs in the constructor after options are applied. If an option depends on a value from another option, reorder or combine them.

4. **Always use `t.Run` for sub-tests in table-driven tests, never index into a shared results slice.** The `t.Run` approach enables individual test filtering (`go test -run TestDivide/divide_by_zero`), parallel execution, and clear failure attribution. The old pattern of indexing results provides none of these.

5. **Never use `interface{}` (or `any`) as a function parameter type when the set of accepted types is known and finite.** Define a typed interface or use a concrete union approach. Untyped `any` parameters lose compile-time type safety and force callers into type assertions that can panic.

6. **Always prefer `io.Reader` and `io.Writer` as parameter types over `*os.File`, `*bytes.Buffer`, or concrete stream types.** Functions that accept `io.Reader` can be tested with `strings.NewReader`, can read from network connections, files, or compressed streams without any change to the function signature. This is Go's most powerful composability idiom.

7. **Never shadow the `err` variable from an outer scope using `:=` in a nested block.** The shadowed `err` inside the block is a different variable. The outer `err` remains unchanged. This is a common source of silent failures where an error is set but the outer `if err != nil` check never sees it.

8. **Package names must never be `util`, `common`, `helpers`, `misc`, or `shared`.** These names communicate nothing about what the package provides. Name packages by their domain noun: `currency`, `validation`, `pagination`, `middleware`. The name appears before every exported symbol at the call site -- `validation.IsEmail(s)` is clearer than `util.IsEmail(s)`.

9. **Never add an abstraction layer (interface, wrapper type, adapter) without a second concrete use case in hand.** The Go philosophy is "a little copying is better than a little dependency." Premature abstraction in Go creates interface sprawl, harder-to-follow call stacks, and no actual benefit until the second implementation exists.

10. **Always write `defer` cleanup statements immediately after the resource acquisition that requires cleanup.** `f, err := os.Open(name); if err != nil { return err }; defer f.Close()` -- the `defer` appears on the very next line. Separating the `defer` from the acquisition by more than a few lines makes it easy to miss, omit during refactoring, or accidentally defer inside a loop (which delays all closes until function return).

---

## Edge Cases

### Embedding an Interface to Create a Test Double (Partial Mock)

When a large interface (like `fs.FS` with `Open`, `ReadDir`, `Glob`, `Stat`) needs a test double but only one or two methods are exercised in a given test, embed the interface in a struct and implement only what the test calls. This compiles and works correctly -- but any call to an unimplemented method dereferences a nil interface and panics. Document this explicitly:

```go
// testFS only implements Open; calling any other fs.FS method will panic.
type testFS struct{ fs.FS }

func (t testFS) Open(name string) (fs.File, error) {
    return os.Open(filepath.Join("testdata", name))
}
```

Guard against accidents by wrapping test doubles in a method that documents the limitation. In production code where all methods may be called, this pattern is dangerous -- use a complete implementation or `gomock`/`mockery`.

### Functional Options Validation Ordering

When one option depends on another (e.g., `WithTLSConfig` depends on `WithCert` and `WithKey` having been applied), validation inside options is tempting but wrong. Instead, apply all options first, then validate the combined state:

```go
func NewServer(opts ...Option) (*Server, error) {
    s := &Server{port: 8080, timeout: 30 * time.Second}
    for _, opt := range opts {
        opt(s)
    }
    // validate after all options applied
    if s.tlsEnabled && (s.certFile == "" || s.keyFile == "") {
        return nil, errors.New("server: TLS enabled but cert or key file not specified")
    }
    return s, nil
}
```

Note the constructor now returns `(*Server, error)` -- this is acceptable and idiomatic when initialization can fail. The functional options themselves never return errors.

### Promoted Method Conflicts with Outer Type Intent

When embedding two types that both have a method named `Close()`, the Go compiler does not error at the embedding site -- it errors only when you call `outer.Close()`. The fix is to disambiguate by calling `outer.Inner1.Close()` or `outer.Inner2.Close()` explicitly, or by defining `Close()` on the outer type that orchestrates both:

```go
type ReadWriteCloser struct {
    *bufio.Reader
    *bufio.Writer
    conn net.Conn
}

func (rwc *ReadWriteCloser) Close() error {
    if err := rwc.Writer.Flush(); err != nil {
        return err
    }
    return rwc.conn.Close()
}
```

### Table-Driven Tests with Expected Side Effects

When the function under test modifies external state (a database, a file, a counter), the table test struct must include setup and teardown hooks, not just input/output:

```go
tests := []struct {
    name    string
    setup   func(t *testing.T) *sql.DB
    input   string
    want    int
    wantErr bool
}{
    {
        name: "inserts new record",
        setup: func(t *testing.T) *sql.DB {
            db := setupTestDB(t)
            t.Cleanup(func() { db.Close() })
            return db
        },
        input:   "new-record",
        want:    1,
    },
}
```

Do not share state between table test rows -- each row must be fully isolated. Running with `t.Parallel()` inside `t.Run` amplifies any hidden shared state into data races.

### Zero-Value Unusable Type (Correct Handling)

Some types genuinely cannot have a useful zero value (a `Connection` with no network address, a `Signer` with no private key). In these cases, make the zero value obviously broken -- either by checking in every method and returning an error, or by making the struct unexported and using a constructor that validates:

```go
// unexported struct, only constructable via NewSigner
type signer struct {
    key *ecdsa.PrivateKey
}

// Signer is the exported type alias or interface -- callers cannot create a zero signer
type Signer interface {
    Sign(data []byte) ([]byte, error)
}

func NewSigner(key *ecdsa.PrivateKey) (Signer, error) {
    if key == nil {
        return nil, errors.New("signer: private key must not be nil")
    }
    return &signer{key: key}, nil
}
```

This is the correct response to the zero-value rule: when zero-value usability is genuinely impossible, prevent the zero value from existing in the caller's hands.

### `strings.Builder` vs `bytes.Buffer` for Performance

In a hot path building strings from many small pieces, the choice matters:

- `strings.Builder`: write-only, no read back, `String()` to get result -- zero copy (returns the internal slice as a string directly since Go 1.10)
- `bytes.Buffer`: read and write, `String()` allocates a copy of the internal buffer

For benchmark comparison: building a 10,000-element string with `strings.Builder` is ~35% faster than `bytes.Buffer.String()` because `Buffer.String()` calls `string(b.buf[b.off:])` which allocates. Use `strings.Builder` for pure string construction. Use `bytes.Buffer` when you need the `io.Reader` interface to re-read what you wrote.

### The `init()` Function Trap

`init()` functions run before `main()` and before the package's exported functions are called. They are order-dependent, hard to test, and create hidden global state. The idiomatic Go solution:

- Never perform I/O in `init()` -- reading config files, connecting to databases, or calling network services in `init()` makes the package impossible to import in tests without side effects
- Never register global state in `init()` (e.g., `http.Handle(...)`) in library packages -- only binaries should have `init()` with side effects
- The one acceptable use of `init()`: registering with a type-safe registry pattern (e.g., `sql.Register` in database drivers) where the registration is idempotent and pure

If existing code uses `init()` for configuration, migrate to explicit `Setup()` or `New*()` functions that callers invoke intentionally.

---

## Example

**Input:** "I want to build a configurable HTTP client wrapper for my team's internal API SDK. It needs to support custom timeouts, base URLs, authentication headers, retry counts, and optional request logging. How do I design this idiomatically in Go?"

**Output:**

## Pattern: Functional Options + Interface Boundaries for an HTTP Client SDK

### When This Pattern Applies

You have a struct (`Client`) with several optional configuration parameters, some of which have sensible defaults, and you want the public API to remain stable as you add options over time. You also want to inject behavior (logging) without hardwiring a specific logger.

### The Idiomatic Go Approach

```go
package apiclient

import (
    "context"
    "fmt"
    "io"
    "log"
    "net/http"
    "time"
)

// Logger is defined in this consumer package -- not in a logger package.
// Any type with a Printf method satisfies it (including *log.Logger).
type Logger interface {
    Printf(format string, v ...any)
}

// Client is the exported concrete type. Callers get *Client, not an interface.
type Client struct {
    baseURL    string
    httpClient *http.Client
    authHeader string
    maxRetries int
    logger     Logger
}

// Option is the functional option type.
type Option func(*Client)

// WithBaseURL sets the API base URL. Required for most usage.
func WithBaseURL(url string) Option {
    return func(c *Client) { c.baseURL = url }
}

// WithTimeout overrides the default 30-second HTTP timeout.
func WithTimeout(d time.Duration) Option {
    return func(c *Client) { c.httpClient.Timeout = d }
}

// WithAuthHeader sets a static Authorization header value.
// Example: WithAuthHeader("Bearer " + token)
func WithAuthHeader(header string) Option {
    return func(c *Client) { c.authHeader = header }
}

// WithMaxRetries sets the number of retry attempts on 5xx responses.
// Default is 0 (no retries). Maximum recommended is 3.
func WithMaxRetries(n int) Option {
    return func(c *Client) { c.maxRetries = n }
}

// WithLogger injects a logger. Pass nil to disable logging explicitly.
// Accepts *log.Logger or any type implementing Logger.
func WithLogger(l Logger) Option {
    return func(c *Client) { c.logger = l }
}

// New constructs a Client with production-ready defaults.
// Validation errors are returned, not panicked.
func New(opts ...Option) (*Client, error) {
    c := &Client{
        baseURL:    "",
        httpClient: &http.Client{Timeout: 30 * time.Second},
        maxRetries: 0,
        logger:     log.Default(), // default: stdlib logger
    }
    for _, opt := range opts {
        opt(c)
    }
    // validate after all options applied
    if c.baseURL == "" {
        return nil, fmt.Errorf("apiclient: base URL is required; use WithBaseURL")
    }
    if c.maxRetries < 0 || c.maxRetries > 5 {
        return nil, fmt.Errorf("apiclient: maxRetries must be 0-5, got %d", c.maxRetries)
    }
    return c, nil
}

// Get performs a GET request against the given path (appended to base URL).
// It retries on 5xx up to maxRetries times.
func (c *Client) Get(ctx context.Context, path string) (*http.Response, error) {
    url := c.baseURL + path
    var resp *http.Response
    var err error

    for attempt := 0; attempt <= c.maxRetries; attempt++ {
        if attempt > 0 && c.logger != nil {
            c.logger.Printf("apiclient: retrying %s (attempt %d/%d)", url, attempt, c.maxRetries)
        }

        req, reqErr := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
        if reqErr != nil {
            return nil, fmt.Errorf("apiclient: build request: %w", reqErr)
        }
        if c.authHeader != "" {
            req.Header.Set("Authorization", c.authHeader)
        }

        resp, err = c.httpClient.Do(req)
        if err != nil {
            return nil, fmt.Errorf("apiclient: execute request: %w", err)
        }
        if resp.StatusCode < 500 {
            break // success or non-retryable error
        }
        io.Copy(io.Discard, resp.Body) // drain body before retry
        resp.Body.Close()
    }
    return resp, nil
}
```

### Table-Driven Tests for the Client

```go
package apiclient_test

import (
    "context"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"
)

func TestClient_Get(t *testing.T) {
    t.Parallel()

    tests := []struct {
        name           string
        serverStatus   int
        maxRetries     int
        wantStatus     int
        wantCallCount  int
        wantErr        bool
    }{
        {
            name:          "success on first attempt",
            serverStatus:  200,
            maxRetries:    2,
            wantStatus:    200,
            wantCallCount: 1,
        },
        {
            name:          "retries on 503 and succeeds after server stabilizes",
            serverStatus:  503,
            maxRetries:    3,
            wantStatus:    503,
            wantCallCount: 4, // 1 initial + 3 retries
        },
        {
            name:          "no retries on 404",
            serverStatus:  404,
            maxRetries:    2,
            wantStatus:    404,
            wantCallCount: 1,
        },
    }

    for _, tt := range tests {
        tt := tt
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()

            callCount := 0
            srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                callCount++
                w.WriteHeader(tt.serverStatus)
            }))
            defer srv.Close()

            client, err := New(
                WithBaseURL(srv.URL),
                WithTimeout(5*time.Second),
                WithMaxRetries(tt.maxRetries),
                WithLogger(nil), // disable logging in tests
            )
            if err != nil {
                t.Fatalf("New() unexpected error: %v", err)
            }

            resp, err := client.Get(context.Background(), "/test")
            if (err != nil) != tt.wantErr {
                t.Fatalf("Get() error = %v, wantErr %v", err, tt.wantErr)
            }
            if !tt.wantErr {
                defer resp.Body.Close()
                if resp.StatusCode != tt.wantStatus {
                    t.Errorf("Get() status = %d, want %d", resp.StatusCode, tt.wantStatus)
                }
                if callCount != tt.wantCallCount {
                    t.Errorf("server called %d times, want %d", callCount, tt.wantCallCount)
                }
            }
        })
    }
}
```

### Why This Is Idiomatic

- `Logger` interface is defined in `apiclient` (the consumer), not in a logger package -- callers inject `*log.Logger`, `*zap.SugaredLogger`, or a test double without any import of this package's logger type
- `New` returns `(*Client, error)` -- validation failures surface at construction time, not as panics inside `Get`
- `WithLogger(nil)` is a valid explicit choice to disable logging -- functional options handle this gracefully without a separate `WithoutLogger()` option
- `http.NewRequestWithContext` is used instead of `http.NewRequest` -- passing `context.Context` enables timeout propagation and cancellation from the caller, which is mandatory for production HTTP clients
- `io.Copy(io.Discard, resp.Body)` before `resp.Body.Close()` on retry ensures the underlying TCP connection is returned to the pool, not abandoned -- this is a performance-critical idiom that prevents connection exhaustion

### Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Defining `Client` interface in this package | Creates circular import risk; callers cannot extend without modifying this package | Let consumers define the interface they need |
| Panic inside an Option function for invalid values | Panics in options are unrecoverable at the call site | Return `(*Client, error)` from `New`; validate there |
| Not draining `resp.Body` before `Close()` on retry | The underlying TCP connection is not reused; connection pool is exhausted under load | `io.Copy(io.Discard, resp.Body)` before `resp.Body.Close()` |
| Using `http.NewRequest` without a context | No timeout or cancellation propagation | Always use `http.NewRequestWithContext(ctx, ...)` |
| Embedding `*http.Client` in `Client` | Exposes all `*http.Client` methods on `Client`; callers can bypass retry and auth logic | Use an unexported `httpClient *http.Client` field |

### Trade-offs

| Factor | Functional Options | Config Struct |
|--------|--------------------|---------------|
| API stability | Excellent -- add new `With*` funcs without breaking callers | Good -- add new fields with zero values |
| JSON/YAML loadable | No -- functions are not serializable | Yes -- struct tags work directly |
| Discoverability | Requires reading docs or godoc | IDE autocomplete shows all fields |
| Validation location | Centralized in `New()` | Must be in `New()` or `Validate()` -- same result |
| Composability | Options can be stored in `[]Option` slices and reused | Config structs can be embedded or merged |

For a library SDK distributed to external teams, functional options are preferred because the API surface is stable across minor versions. For an internal service configuration loaded from environment variables, a config struct with `envconfig` tags is more practical.
