---
name: go-testing-patterns
description: |
  Guides expert-level Go testing: table-driven tests, testify assertions, httptest for HTTP handlers, integration test patterns, benchmarks, and fuzz testing.
  Use when the user asks about Go testing, table-driven tests, testify, httptest, benchmarks, fuzz testing, Go test organization.
  Do NOT use when the user asks about Go project setup (use `go-project-setup`), Go idioms (use `go-idioms`), general testing concepts (use `unit-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "go testing tdd"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Go Testing Patterns

## When to Use

**Use this skill when:**
- The user asks how to structure test files, test functions, or test packages in a Go project
- The user asks about table-driven tests, subtests, or parameterized testing in Go
- The user asks about the `testify` library (`assert`, `require`, `mock`, `suite`) or whether to use it over stdlib
- The user asks about testing HTTP handlers or middleware using `net/http/httptest`
- The user asks about writing benchmarks with `testing.B`, profiling benchmarks, or avoiding benchmark optimizations that skew results
- The user asks about fuzz testing with `testing.F` (Go 1.18+), seed corpus, or fuzz targets
- The user asks about integration tests, test helpers, `TestMain`, or golden files in Go
- The user asks about race condition detection, parallel tests, or coverage thresholds in Go CI

**Do NOT use this skill when:**
- The user asks about initializing a Go module, project layout, or `go.mod` configuration -- use `go-project-setup`
- The user asks about Go idioms, error handling conventions, or interface design -- use `go-idioms`
- The user asks about general unit testing theory, TDD philosophy, or test pyramid concepts without Go specifics -- use `unit-testing-patterns`
- The user asks about Go concurrency patterns without a testing focus -- use `go-concurrency`
- The user asks about CI/CD pipeline configuration that happens to run Go tests -- use `ci-cd-pipelines`
- The user asks about load testing or performance profiling in production -- use `performance-profiling`

---

## Process

### 1. Identify the Test Category and Appropriate Pattern

Classify what is being tested before writing a single line of test code. Each category has a canonical Go approach.

- **Pure functions with no side effects:** Standard table-driven tests using `t.Run` subtests. No mocking required. Focus on boundary values, zero values, and error paths.
- **Methods on structs with injected dependencies:** Interface-based fakes or `testify/mock`. Inject via constructor, never via `init()` or package-level globals.
- **HTTP handlers and middleware:** Use `net/http/httptest.NewRecorder()` for handler-level tests and `httptest.NewServer()` for full integration roundtrips including middleware chains.
- **Database-touching code:** Use a real test database (ephemeral Docker container via `ory/dockertest` or `testcontainers-go`) or a recorded query replay tool. Never use SQLite as a substitute for Postgres -- schema differences cause false confidence.
- **File system or OS interaction:** Use `t.TempDir()` (Go 1.15+) which automatically cleans up after the test. Never hardcode `/tmp/` paths.
- **CLI commands:** Use `os/exec` with a compiled binary in `TestMain`, or restructure the command logic to accept an `io.Writer` for output so it can be tested without subprocess overhead.
- **Concurrent or goroutine-based code:** Always run with `-race`. Use channels or `sync.WaitGroup` to synchronize, never `time.Sleep`.

### 2. Set Up the Test File Structure

Go test files have strict conventions that must be respected.

- Place test files in the same package as the code under test (whitebox testing: `package mypackage`) to access unexported identifiers, OR in a `_test` package (blackbox testing: `package mypackage_test`) to enforce API boundary discipline. Prefer `_test` suffix packages for exported APIs; use internal packages for unexported logic testing.
- Name the test file `{filename}_test.go`. Go tooling will not compile these files outside of `go test`.
- Use `internal/testhelpers` or a dedicated `testutil` package for shared helper functions. Export helpers from this package, not from production packages.
- Never put test helpers in `_test.go` files if they need to be shared across packages -- `_test.go` files are not importable by other packages.
- Place integration tests in a separate `integration/` directory or gate them behind a build tag: `//go:build integration`. Run them separately in CI: `go test -tags=integration ./...`.
- Use `TestMain(m *testing.M)` only when you need true global setup/teardown (starting a database container, compiling a binary, seeding shared fixtures). Call `os.Exit(m.Run())` at the end -- failing to do so causes the test binary to report success regardless of test outcomes.

### 3. Write Table-Driven Tests with Subtests

Table-driven tests are idiomatic Go. Apply this pattern consistently for any function that processes varied inputs.

- Define a slice of anonymous structs (not a map -- maps have non-deterministic iteration order) containing: `name string`, input fields, expected output fields, and `wantErr bool` or a specific error type check.
- Use `t.Run(tc.name, func(t *testing.T) { ... })` for each case. This produces output like `--- FAIL: TestParseURL/empty_host` which is grep-friendly.
- Mark subtests as parallel with `tt := tc; t.Parallel()` inside the subtest closure. Assign the loop variable to a local copy (`tt`) before calling `t.Parallel()` -- failing to do so is the classic Go loop variable capture bug that was fixed only in Go 1.22. For Go < 1.22, this copy is mandatory.
- Name test cases with snake_case or short descriptive phrases: `"empty_input"`, `"max_int_boundary"`, `"unicode_multibyte_sequence"`. Avoid `"test 1"`, `"case A"`, or numeric-only names.
- Group cases that test error conditions at the end of the table. Arrange happy-path cases first for readability.
- For functions returning `error`, always include at least one case where `wantErr: true` and verify error content -- not just `err != nil`.

```go
func TestParseAmount(t *testing.T) {
    t.Parallel()
    tests := []struct {
        name    string
        input   string
        want    int64
        wantErr bool
    }{
        {name: "valid_integer", input: "100", want: 100},
        {name: "leading_zeros", input: "007", want: 7},
        {name: "empty_string", input: "", wantErr: true},
        {name: "negative_value", input: "-5", wantErr: true},
        {name: "overflow_int64", input: "99999999999999999999", wantErr: true},
    }
    for _, tc := range tests {
        tc := tc // pre-1.22 capture fix
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel()
            got, err := ParseAmount(tc.input)
            if tc.wantErr {
                if err == nil {
                    t.Fatalf("expected error, got nil")
                }
                return
            }
            if err != nil {
                t.Fatalf("unexpected error: %v", err)
            }
            if got != tc.want {
                t.Errorf("got %d, want %d", got, tc.want)
            }
        })
    }
}
```

### 4. Choose Between stdlib Assertions and testify

The stdlib provides `t.Error`, `t.Errorf`, `t.Fatal`, and `t.Fatalf`. Testify provides `assert` and `require` packages. Make a deliberate choice per project and stick to it.

- Use **stdlib only** when the project has zero external test dependencies, when assertions are simple equality or nil checks, and when the team is comfortable with verbose error messages.
- Use **`testify/assert`** when you need rich diff output for struct comparisons, when you want to continue running the rest of a test after a failure (non-fatal assertions), or when testing teams find the `assert.Equal(t, expected, actual)` signature more readable.
- Use **`testify/require`** (same API as `assert`) when a failure means the test cannot meaningfully continue -- e.g., `require.NoError(t, err)` before using a value that `err` guards. `require` calls `t.FailNow()` which stops the current test immediately; `assert` calls `t.Fail()` which marks failure but continues execution.
- The argument order convention for testify is `(t, expected, actual)` -- putting expected first matches the error message format "expected X, got Y". Getting this backwards is a common mistake that produces confusing failure messages.
- Use **`testify/mock`** for interface mocking. Define a struct that embeds `mock.Mock`, implement the interface methods calling `m.Called(args...)`, and set up expectations with `mockObj.On("MethodName", args).Return(values)`. Always call `mockObj.AssertExpectations(t)` at the end of each test that uses a mock.
- Do NOT use `testify/suite` for new code. Suites add `SetupTest`/`TeardownTest` lifecycle hooks but obscure test structure, make parallelism awkward, and create hidden coupling between tests. Use explicit helper functions and `t.Cleanup()` instead.

### 5. Test HTTP Handlers with httptest

The `net/http/httptest` package is the canonical tool for testing Go HTTP code without a real server.

- Use `httptest.NewRecorder()` for testing a single handler function. Create the recorder, create a request with `http.NewRequest("GET", "/path", nil)`, call `handler.ServeHTTP(rec, req)`, then inspect `rec.Code`, `rec.Body.String()`, and `rec.Header()`.
- Use `httptest.NewServer(handler)` to spin up a real TCP listener on a random port. This is required when testing middleware chains, redirect behavior, connection-level behavior, or client code that needs a real URL. Call `defer ts.Close()` immediately after creating the server.
- Use `httptest.NewTLSServer(handler)` when testing TLS-specific behavior. The returned server uses a self-signed certificate; access it with `ts.Client()` which is pre-configured to trust it.
- When testing a router (e.g., `chi`, `gorilla/mux`, `stdlib ServeMux`), pass the fully assembled router to `httptest.NewRecorder()` or `httptest.NewServer()`. Do not test routes in isolation from the router -- the routing is part of the contract.
- Set request headers explicitly: `req.Header.Set("Content-Type", "application/json")`. Missing content-type headers cause handler failures that are not obvious from the test output.
- For authenticated endpoints, add an auth header or cookie to the request in the test. Create a test helper `func newAuthRequest(t *testing.T, method, path string) *http.Request` to avoid repetition.
- Parse and validate response bodies with `json.NewDecoder(rec.Body).Decode(&result)` -- do not use string matching on JSON unless testing exact serialization format.

```go
func TestCreateUserHandler(t *testing.T) {
    svc := &fakeUserService{createResult: &User{ID: "u1", Email: "a@b.com"}}
    h := NewUserHandler(svc)

    body := `{"email":"a@b.com","password":"secret123"}`
    req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    h.ServeHTTP(rec, req)

    require.Equal(t, http.StatusCreated, rec.Code)
    var resp UserResponse
    require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
    assert.Equal(t, "u1", resp.ID)
    assert.Equal(t, "a@b.com", resp.Email)
}
```

### 6. Write Benchmarks Correctly

Benchmarks in Go use `testing.B` and are invoked with `go test -bench=. -benchmem`. Common mistakes produce meaningless results.

- Name benchmark functions `BenchmarkXxx` where `Xxx` describes the operation: `BenchmarkJSONMarshal_SmallStruct`, `BenchmarkQueryUser_CacheMiss`.
- The benchmark loop must use `b.N` exactly: `for i := 0; i < b.N; i++ { ... }`. The testing framework calibrates `b.N` automatically until the benchmark runs for at least 1 second by default.
- Call `b.ResetTimer()` after expensive setup that should not be measured: allocating large data structures, connecting to test databases, or parsing large files. Do NOT call `b.ResetTimer()` inside the benchmark loop.
- Use `b.ReportAllocs()` or run with `-benchmem` to see allocation counts per operation (`allocs/op`). Reducing `allocs/op` to zero for hot paths is often more impactful than CPU time improvements.
- Prevent compiler dead-code elimination by assigning results to a package-level variable of the appropriate type: `var BenchResult SomeType`. Inside the benchmark loop: `BenchResult = result`. Without this, the compiler may optimize away the work being measured.
- Use `b.RunParallel` to benchmark concurrent workloads: this runs the benchmark body in parallel goroutines proportional to `GOMAXPROCS`. Use it to detect lock contention.
- Use `benchstat` (from `golang.org/x/perf/cmd/benchstat`) to compare benchmark runs statistically. Run each benchmark at least 5-10 times (`-count=10`) before comparing with `benchstat old.txt new.txt`.

### 7. Write Fuzz Tests (Go 1.18+)

Fuzz testing uses `testing.F` and the `go test -fuzz` flag to generate novel inputs and find panics or invariant violations.

- Name fuzz functions `FuzzXxx`. The function signature is `func FuzzXxx(f *testing.F)`.
- Provide seed corpus with `f.Add(value1, value2, ...)`. Seeds serve two purposes: they run as regular unit test cases during `go test` (without `-fuzz`), and they seed the fuzzer's input generation. Provide at least 3-5 seeds covering boundary conditions.
- The fuzz target is a closure passed to `f.Fuzz(func(t *testing.T, arg1 type1, arg2 type2) { ... })`. Keep the fuzz target simple and deterministic -- avoid network calls, sleep, or goroutines inside it.
- The fuzzer saves inputs that cause failures to `testdata/fuzz/FuzzXxx/` as files. Commit these files to the repository -- they become permanent regression tests run on every `go test` invocation.
- Check invariants inside the fuzz target, not just absence of panics. For a parser: `parsed, err := Parse(input); if err == nil { assert.Equal(t, input, parsed.String()) }` verifies a round-trip invariant.
- Run fuzzing in CI with a time limit: `go test -fuzz=FuzzParseURL -fuzztime=30s ./pkg/url/`. Do not run unlimited fuzzing in CI -- it will never terminate. Run long fuzzing sessions locally or in dedicated fuzzing infrastructure.
- Fuzz targets support only the following argument types: `string`, `[]byte`, `bool`, `byte`, `rune`, `float32`, `float64`, `int`, `int8`, `int16`, `int32`, `int64`, `uint`, `uint8`, `uint16`, `uint32`, `uint64`. To fuzz complex structs, encode them as JSON bytes and unmarshal inside the target.

### 8. Configure Coverage, Race Detection, and CI Integration

Test quality is enforced through tooling, not convention alone.

- Run `go test -race ./...` in CI unconditionally. The race detector has roughly 5-20x runtime overhead -- acceptable in CI, not for production. It detects data races that `-count=1` tests will not reveal because timing varies.
- Run `go test -cover ./...` to get per-package coverage. Run `go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out` locally to visualize uncovered lines.
- Set a coverage threshold in CI using a shell script or tool like `go-test-coverage`: reject merges below 80% statement coverage for critical packages. Do not set a single threshold for the entire codebase -- generated code, `main` packages, and test helpers skew the number.
- Exclude generated files from coverage with `//go:build ignore` or using `coverpkg` flags carefully. Use `grep` to strip generated file coverage from the profile before threshold enforcement.
- Cache test results: `go test` caches results automatically when inputs have not changed. The cache is invalidated by file changes, environment variable changes, and when `-count` is set. Use `-count=1` to force re-run in CI when you need fresh results despite the cache.
- Use `go test -timeout 60s ./...` in CI. Default timeout is 10 minutes -- too long for fast feedback. Set package-level timeouts and set the global timeout to 120s as an upper bound.
- Golden file tests store expected output in `testdata/` files. Use `flag.Bool("update", false, "update golden files")` and `if *update { os.WriteFile(goldenPath, actual, 0644) }` to regenerate them. Run `go test -run TestGolden -update` when expected output intentionally changes.

---

## Output Format

When providing Go testing guidance, structure the response as follows:

```
## Test Strategy for [Component Name]

**Test category:** [unit | integration | benchmark | fuzz]
**Package placement:** [same package (whitebox) | _test suffix (blackbox)]
**External dependencies:** [list: testify/assert, testify/require, testify/mock, httptest, etc.]

---

### Test File: [filename]_test.go

```go
package [package_name][_test]

import (
    "testing"
    // additional imports
)

// --- Helpers and Fakes ---

type fake[Dependency] struct {
    // recorded calls and configured returns
}

func (f *fake[Dependency]) [Method](args) (returns) {
    // minimal fake implementation
}

// --- Unit Tests ---

func Test[Function]_[Scenario](t *testing.T) {
    t.Parallel()

    tests := []struct {
        name    string
        // input fields
        // expected output fields
        wantErr bool
    }{
        {
            name:    "[descriptive_case_name]",
            // populate fields
        },
    }

    for _, tc := range tests {
        tc := tc
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel()
            // arrange
            // act
            // assert
        })
    }
}

// --- Integration Tests (gated by build tag if needed) ---

// --- Benchmarks ---

var Bench[Result] [ResultType] // package-level sink

func Benchmark[Operation]_[Scenario](b *testing.B) {
    // setup (not measured)
    b.ResetTimer()
    b.ReportAllocs()
    for i := 0; i < b.N; i++ {
        Bench[Result] = [operation]
    }
}

// --- Fuzz Targets ---

func Fuzz[Operation](f *testing.F) {
    f.Add([seed1])
    f.Add([seed2])
    f.Fuzz(func(t *testing.T, input [type]) {
        // call function under test
        // assert invariants
    })
}
```

**Run commands:**
| Command | Purpose |
|---|---|
| `go test ./...` | All unit tests |
| `go test -race ./...` | With race detector |
| `go test -run TestX/subcase ./pkg` | Single subtest |
| `go test -bench=BenchmarkX -benchmem -count=5 ./pkg` | Benchmark with allocations |
| `go test -fuzz=FuzzX -fuzztime=60s ./pkg` | Fuzz for 60 seconds |
| `go test -cover -coverprofile=c.out ./...` | Coverage report |
| `go test -tags=integration ./...` | Integration tests |

**Coverage target:** [X]% statement coverage for this package
**Race-safe:** [yes | no -- explain why not]
```

---

## Rules

1. **Never use `time.Sleep` in tests.** Sleeping to wait for async operations is nondeterministic and will cause flaky tests in CI. Use `sync.WaitGroup`, channels, or `require.Eventually(t, condition, 2*time.Second, 10*time.Millisecond)` from testify to poll with a timeout and interval.

2. **Always capture the loop variable before calling `t.Parallel()` in Go < 1.22.** The pattern `tc := tc` inside the `for _, tc := range tests` loop is mandatory. In Go 1.22+, loop variable semantics changed and the copy is no longer required, but it does not hurt to include it for compatibility.

3. **Never assert on `err.Error()` string values for error identity.** String comparison is brittle -- error messages change. Use `errors.Is(err, target)` for sentinel errors, `errors.As(err, &target)` for error types, or `require.ErrorContains(t, err, "substring")` only when the message is the specification.

4. **The argument order for testify is `(t, expected, actual)`, never reversed.** Getting this wrong produces failure messages like "expected 42, got 42 (expected and actual are identical)" which is disorienting. Always put the known/hardcoded value first.

5. **Never share mutable state between parallel tests.** Any variable written by one `t.Parallel()` subtest and read by another is a data race. Use `t.Cleanup()` for per-test teardown. Use `sync.Mutex` or channels if shared state is truly necessary -- and question whether it is.

6. **Always call `mockObj.AssertExpectations(t)` at the end of tests using `testify/mock`.** Without this call, mocks with uncalled `On()` expectations will silently pass. Register it immediately after creating the mock: `t.Cleanup(func() { mockObj.AssertExpectations(t) })`.

7. **Never use `init()` to register test dependencies or global state.** `init()` runs in every test binary, creates hidden coupling, and makes test isolation impossible. Use `TestMain` for one-time global setup, and explicit constructors for per-test dependency injection.

8. **Benchmark result variables must be package-level sinks.** Assigning benchmark results to a local variable allows the compiler to eliminate the computation as dead code, producing artificially fast benchmarks. Always use a package-level `var BenchResult T` as the sink.

9. **Fuzz seed corpus must cover error-producing inputs, not just valid inputs.** The fuzzer explores from seeds. If all seeds are valid inputs, the fuzzer starts from a valid state and may never discover parsing edge cases. Include empty strings, maximum-length inputs, control characters, and known-bad inputs as seeds.

10. **Integration tests must be gated by a build tag or an environment variable check, never by file naming alone.** Use `//go:build integration` at the top of integration test files, or check `os.Getenv("RUN_INTEGRATION_TESTS") == "1"` in `TestMain` and call `os.Exit(0)` to skip cleanly. Running integration tests on every `go test ./...` invocation slows local development and creates flaky CI.

---

## Edge Cases

**Go version below 1.18 (no fuzz testing available)**
Fuzz testing with `testing.F` requires Go 1.18+. For older codebases, implement property-based testing using `pgregory.net/rapid` or `leanovate/gopter`. These libraries generate random inputs using strategies similar to Haskell's QuickCheck. If upgrading Go is blocked, migrate fuzz targets to `rapid.Check` patterns and add a comment marking them as candidates for migration to native fuzz once Go is upgraded.

**Testing code that calls `os.Exit` or `log.Fatal`**
Functions that call `os.Exit` cannot be tested normally -- they terminate the test process. The standard Go pattern is the "subprocess test": create a test function `TestFoo_exits(t *testing.T)` that checks `os.Getenv("BE_CRASHER") == "1"` and calls the real function. The main test body re-runs itself as a subprocess with the environment variable set and asserts on the subprocess exit code. This is verbose but correct. A simpler alternative is to refactor the code under test to accept an `exit func(int)` parameter (defaulting to `os.Exit`) that can be replaced in tests.

**Testing code that reads from `os.Stdin` or writes to `os.Stdout`**
Replace direct `os.Stdin`/`os.Stdout` references with `io.Reader`/`io.Writer` parameters in the function signature. In tests, use `strings.NewReader("input data")` and `bytes.Buffer` or `strings.Builder` as the writer. This also makes the code more useful as a library. If the function cannot be refactored, use `os.Pipe()` to create a fake stdin/stdout pair: `r, w, _ := os.Pipe(); os.Stdin = r` then write to `w` from the test goroutine.

**Parallel tests with shared database state**
When running integration tests against a real database in parallel, each parallel test must operate in an isolated schema or transaction. The cleanest pattern is to create a fresh database schema per test using `t.Cleanup(func() { db.Exec("DROP SCHEMA test_xxx CASCADE") })`. An alternative is to wrap each test in a transaction and roll it back: `tx := db.Begin(); t.Cleanup(func() { tx.Rollback() })`. Pass `tx` (not the global `db`) to the code under test. This approach prevents parallel tests from interfering but requires that the code accept an interface rather than a concrete `*sql.DB`.

**Testing code with randomness or time-dependent behavior**
Never call `time.Now()` or `rand.Int()` directly inside testable functions. Instead, inject a `clock` interface with a `Now() time.Time` method (or use `github.com/jonboulle/clockwork`) and a `rand.Source` that can be seeded deterministically. In tests, pass a fixed `time.Time` value and a `rand.NewSource(42)`. This makes time-dependent tests fully deterministic without mocking the standard library, which is not possible without patching.

**Large test fixtures and golden files getting out of sync**
Golden files in `testdata/` drift from actual output as the system evolves, causing failures that are fixed by blindly running `-update` without reviewing diffs. Enforce a `git diff --exit-code testdata/` step in CI after running with `-update` -- the update should produce no changes if golden files are current. Additionally, keep golden files small and focused. If a golden file exceeds 50 lines, the test is asserting too much. Break it into multiple focused assertions or tests.

**Mocking interfaces you do not own (e.g., `http.ResponseWriter`, `sql.DB`)**
The stdlib `http.ResponseWriter` is an interface you can implement directly -- `httptest.ResponseRecorder` does exactly this. For `*sql.DB`, which is a concrete struct, the approach is different: define your own `DBQuerier` interface containing only the methods your code uses, have production code accept `DBQuerier`, and write a fake `DBQuerier` in tests. Never mock `*sql.DB` directly. Libraries like `DATA-DOG/go-sqlmock` provide a mock `database/sql` driver, but they are complex and often over-specify behavior. Prefer a hand-written fake interface.

**Race detector finding races only in tests, not production code**
Sometimes the race detector flags races in test helper code -- goroutines launched in `TestMain`, shared counters in fake implementations, or parallel test setup that writes to a shared map. These are real races even if they only appear in test code. Fix them: protect shared state in fakes with a `sync.Mutex`, use `t.Cleanup` instead of goroutines for teardown, and never write to a map from multiple goroutines without synchronization, even in tests.

---

## Example

**Input:** "I need to write tests for a `PricingService` that calculates order totals. It depends on a `ProductRepository` interface to look up product prices and applies a discount if the order total exceeds $100. I also want a benchmark. How do I structure this in Go?"

---

**Output:**

### Test Strategy for PricingService

**Test category:** unit tests (table-driven), benchmark
**Package placement:** `package pricing_test` (blackbox -- testing exported API)
**External dependencies:** `testify/assert`, `testify/require`, `testify/mock`

---

**File: `pricing_test.go`**

```go
package pricing_test

import (
    "errors"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/stretchr/testify/require"

    "github.com/example/shop/pricing"
)

// --- Fake / Mock for ProductRepository ---

// fakeProductRepo is a hand-written fake that gives us full control
// without the overhead of testify/mock for simple cases.
type fakeProductRepo struct {
    prices map[string]float64
    err    error
}

func (f *fakeProductRepo) GetPrice(productID string) (float64, error) {
    if f.err != nil {
        return 0, f.err
    }
    price, ok := f.prices[productID]
    if !ok {
        return 0, pricing.ErrProductNotFound
    }
    return price, nil
}

// mockProductRepo uses testify/mock for tests that need call verification.
type mockProductRepo struct {
    mock.Mock
}

func (m *mockProductRepo) GetPrice(productID string) (float64, error) {
    args := m.Called(productID)
    return args.Get(0).(float64), args.Error(1)
}

// --- Unit Tests: CalculateTotal ---

func TestPricingService_CalculateTotal(t *testing.T) {
    t.Parallel()

    tests := []struct {
        name       string
        prices     map[string]float64
        orderItems map[string]int // productID -> quantity
        wantTotal  float64
        wantErr    bool
        errTarget  error
    }{
        {
            name:       "single_item_no_discount",
            prices:     map[string]float64{"prod-1": 30.00},
            orderItems: map[string]int{"prod-1": 2},
            wantTotal:  60.00, // 2 * 30.00, under $100 threshold
        },
        {
            name:       "multiple_items_no_discount",
            prices:     map[string]float64{"prod-1": 20.00, "prod-2": 15.00},
            orderItems: map[string]int{"prod-1": 3, "prod-2": 1},
            wantTotal:  75.00, // 60 + 15 = 75, under threshold
        },
        {
            name:       "discount_applied_at_exactly_100",
            prices:     map[string]float64{"prod-1": 50.00},
            orderItems: map[string]int{"prod-1": 2},
            wantTotal:  95.00, // 100 * 0.95 = 95.00 (5% discount)
        },
        {
            name:       "discount_applied_above_100",
            prices:     map[string]float64{"prod-1": 40.00, "prod-2": 35.00},
            orderItems: map[string]int{"prod-1": 2, "prod-2": 1},
            wantTotal:  109.25, // 115 * 0.95 = 109.25
        },
        {
            name:       "zero_quantity_item_excluded",
            prices:     map[string]float64{"prod-1": 50.00, "prod-2": 20.00},
            orderItems: map[string]int{"prod-1": 0, "prod-2": 3},
            wantTotal:  60.00, // only prod-2 counted
        },
        {
            name:       "unknown_product_returns_error",
            prices:     map[string]float64{},
            orderItems: map[string]int{"ghost-prod": 1},
            wantErr:    true,
            errTarget:  pricing.ErrProductNotFound,
        },
        {
            name: "repository_error_propagates",
            prices:     nil, // unused -- err is set
            orderItems: map[string]int{"prod-1": 1},
            wantErr:    true,
        },
        {
            name:       "empty_order_returns_zero",
            prices:     map[string]float64{},
            orderItems: map[string]int{},
            wantTotal:  0.00,
        },
    }

    for _, tc := range tests {
        tc := tc // pre-1.22 loop variable capture
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel()

            repo := &fakeProductRepo{prices: tc.prices}
            // Override with a repo-level error for the propagation test.
            if tc.name == "repository_error_propagates" {
                repo.err = errors.New("connection refused")
            }

            svc := pricing.NewPricingService(repo)
            got, err := svc.CalculateTotal(tc.orderItems)

            if tc.wantErr {
                require.Error(t, err)
                if tc.errTarget != nil {
                    assert.True(t, errors.Is(err, tc.errTarget),
                        "expected error %v, got %v", tc.errTarget, err)
                }
                return
            }

            require.NoError(t, err)
            assert.InDelta(t, tc.wantTotal, got, 0.001,
                "total mismatch: got %.2f, want %.2f", got, tc.wantTotal)
        })
    }
}

// --- Interaction Test: verify repository is called exactly once per product ---

func TestPricingService_CalculateTotal_CallsRepoOncePerProduct(t *testing.T) {
    t.Parallel()

    repo := &mockProductRepo{}
    repo.On("GetPrice", "prod-1").Return(20.00, nil)
    repo.On("GetPrice", "prod-2").Return(15.00, nil)
    t.Cleanup(func() { repo.AssertExpectations(t) })

    svc := pricing.NewPricingService(repo)
    _, err := svc.CalculateTotal(map[string]int{"prod-1": 3, "prod-2": 2})
    require.NoError(t, err)

    // AssertExpectations in Cleanup verifies each method was called exactly
    // the number of times specified. No extra assertions needed here.
}

// --- Benchmarks ---

// BenchTotal is the package-level sink to prevent dead-code elimination.
var BenchTotal float64

func BenchmarkPricingService_CalculateTotal_SmallOrder(b *testing.B) {
    repo := &fakeProductRepo{
        prices: map[string]float64{
            "prod-1": 19.99,
            "prod-2": 34.50,
        },
    }
    svc := pricing.NewPricingService(repo)
    order := map[string]int{"prod-1": 2, "prod-2": 1}

    b.ResetTimer()
    b.ReportAllocs()
    for i := 0; i < b.N; i++ {
        total, _ := svc.CalculateTotal(order)
        BenchTotal = total
    }
}

func BenchmarkPricingService_CalculateTotal_LargeOrder(b *testing.B) {
    const productCount = 100
    prices := make(map[string]float64, productCount)
    order := make(map[string]int, productCount)
    for i := 0; i < productCount; i++ {
        id := fmt.Sprintf("prod-%d", i)
        prices[id] = float64(i+1) * 1.25
        order[id] = 2
    }

    repo := &fakeProductRepo{prices: prices}
    svc := pricing.NewPricingService(repo)

    b.ResetTimer()
    b.ReportAllocs()
    for i := 0; i < b.N; i++ {
        total, _ := svc.CalculateTotal(order)
        BenchTotal = total
    }
}
```

---

**Run commands for this service:**

| Command | Purpose |
|---|---|
| `go test ./pricing/...` | All unit tests |
| `go test -race ./pricing/...` | With race detector |
| `go test -run TestPricingService_CalculateTotal/discount_applied ./pricing` | Single subtest |
| `go test -bench=BenchmarkPricingService -benchmem -count=10 ./pricing` | Benchmarks with allocation data |
| `go test -cover -coverprofile=pricing.out ./pricing/... && go tool cover -func=pricing.out` | Coverage by function |

**Expected coverage target:** 90%+ statement coverage for `pricing` package (it contains the core business logic; coverage gaps here represent untested business rules).

**Race-safe:** Yes -- the fake and mock implementations are used only within individual subtests. No shared mutable state crosses subtest boundaries.

---

**Sample benchmark output to expect:**

```
BenchmarkPricingService_CalculateTotal_SmallOrder-8    2847193   421.3 ns/op   96 B/op   3 allocs/op
BenchmarkPricingService_CalculateTotal_LargeOrder-8      28471  42130 ns/op  9600 B/op  300 allocs/op
```

If `allocs/op` scales linearly with `productCount` (3 allocs per product), the next optimization target is to pre-allocate the result accumulator or reuse a pool. Use `benchstat` with `-count=10` to confirm regressions before and after any optimization change.
