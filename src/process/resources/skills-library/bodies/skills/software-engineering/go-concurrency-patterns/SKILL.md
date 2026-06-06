---
name: go-concurrency-patterns
description: |
  Guides expert-level Go concurrency: goroutines, channels, select statements, context cancellation, sync primitives, and race condition detection. Covers when to use each concurrency primitive.
  Use when the user asks about Go concurrency, goroutines, channels, select, context, sync primitives, race detection, Go parallelism.
  Do NOT use when the user asks about Go idioms (use `go-idioms`), Go performance (use `go-performance`), Go error handling (use `go-error-handling`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "go backend optimization"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Go Concurrency Patterns

## When to Use

**Use this skill when:**
- The user asks how to coordinate multiple goroutines -- fan-out, fan-in, pipelines, worker pools, or scatter-gather patterns
- The user asks about channel direction, buffering strategy, or closing semantics in Go
- The user asks about `select` statements, including priority selection, non-blocking operations, or timeout handling
- The user asks about `context.Context` propagation, cancellation trees, or deadline management across goroutine boundaries
- The user asks about `sync` package primitives: `Mutex`, `RWMutex`, `WaitGroup`, `Once`, `Cond`, `Map`, or atomic operations via `sync/atomic`
- The user asks how to detect or fix data races in Go code, including use of `-race` detector or memory model semantics
- The user asks about goroutine lifecycle management -- leaks, supervision, graceful shutdown
- The user asks about `errgroup`, `semaphore`, or `singleflight` from `golang.org/x/sync`
- The user is debugging a deadlock, livelock, or starvation scenario in a Go program
- The user asks about channel vs. mutex trade-offs for a specific coordination problem

**Do NOT use this skill when:**
- The user asks about Go naming conventions, receiver types, or interface design -- use `go-idioms`
- The user asks about Go application profiling, pprof, escape analysis, or memory allocation tuning -- use `go-performance`
- The user asks about `errors.Is`, `errors.As`, sentinel errors, or wrapping error chains -- use `go-error-handling`
- The user asks about Go module management, `go.mod`, versioning, or dependency resolution -- use `go-modules`
- The user is asking about a general concurrency concept not tied to Go's specific runtime model (e.g., OS threads, POSIX pthreads)
- The user wants a general code review of a Go file that does not involve concurrency primitives

## Process

### Step 1: Classify the Concurrency Problem

Before choosing any primitive, identify which fundamental category the problem belongs to. Applying the wrong pattern to the right category is the root cause of most Go concurrency bugs.

- **Coordination** -- multiple goroutines must synchronize at a point (completion, phase barrier, initialization). Primary tools: `sync.WaitGroup`, `sync.Once`, `sync.Cond`, `errgroup.Group`.
- **Communication** -- goroutines pass data between stages. Primary tools: channels (buffered or unbuffered), pipelines, `context` for cancellation propagation alongside data.
- **Shared state protection** -- multiple goroutines read or write the same memory. Primary tools: `sync.Mutex`, `sync.RWMutex`, `sync/atomic`. Prefer atomics for single scalar values; prefer mutexes for protecting invariants across multiple fields.
- **Resource limiting** -- cap concurrent operations to prevent resource exhaustion. Primary tools: buffered channel as semaphore, `golang.org/x/sync/semaphore` for weighted acquisition.
- **Fan-out / fan-in** -- distribute work across N goroutines and collect results. Primary tools: worker pool with input channel + result channel, or `errgroup` with closure capture.
- **Rate limiting and backpressure** -- control throughput to downstream systems. Primary tools: `time.Ticker`, `rate.Limiter` from `golang.org/x/time/rate`, bounded input channels.
- **Duplicate suppression** -- deduplicate concurrent requests for the same key. Primary tool: `golang.org/x/sync/singleflight`.

Explicitly state which category applies before recommending any code. Many problems belong to two categories simultaneously (e.g., fan-out with shared state collection requires both a worker pattern and protected aggregation).

### Step 2: Apply the Channel vs. Mutex Decision Framework

This is the most common decision point in Go concurrency. Follow this explicit framework rather than defaulting to one approach:

- Use **channels** when:
  - Ownership of data transfers from one goroutine to another (producer hands off, consumer takes over -- no aliasing)
  - You need to signal events (closed channel as broadcast, single send as one-shot signal)
  - You are building a pipeline where stages operate independently
  - You need `select` to multiplex across multiple sources
  - Goroutine lifecycle is coupled to data flow (a goroutine exists to process items from a channel)

- Use **mutexes** when:
  - Multiple goroutines share a long-lived data structure that is not naturally owned by any single goroutine (e.g., a cache, connection pool, or metrics map)
  - The critical section involves multiple fields that must be updated atomically as a group
  - You need `RWMutex` because reads far outnumber writes (rule of thumb: >10:1 read/write ratio benefits from `RWMutex`)
  - Passing ownership through channels would require copying large structures at high frequency

- Use **atomics** (`sync/atomic`) when:
  - The shared state is a single scalar: counter, flag, pointer
  - You need lock-free reads with occasional writes for performance-critical hot paths
  - Implementing `sync.Once`-style behavior manually (rare -- prefer `sync.Once`)
  - Note: `atomic` provides sequential consistency only for the specific variable; you still need a mutex to protect invariants spanning multiple variables

### Step 3: Design the Goroutine Lifecycle

Every goroutine launched must have a defined owner, a defined shutdown mechanism, and a way to report errors. Goroutine leaks are the most common production Go concurrency bug.

- Every goroutine must be reachable from a `context.Context` cancellation or a channel close -- if neither applies, the design is incomplete
- For goroutines that must run until program exit, pass a top-level context derived from `signal.NotifyContext` so OS signals cancel them
- For goroutines that process a bounded workload, the done signal is the input channel being closed -- the goroutine ranges over the channel and exits when it is drained
- For goroutines that perform background polling, use `select` with a `ctx.Done()` case on every blocking operation, including `time.After` (prefer `time.NewTimer` and reset to avoid timer leaks before Go 1.23)
- Never launch a goroutine in library code without giving the caller a way to stop it -- this makes the library un-testable and leak-prone
- Use `errgroup.Group` from `golang.org/x/sync/errgroup` as the default goroutine supervisor for structured concurrency: it propagates the first non-nil error and cancels a derived context automatically
- Document goroutine count expectations: a worker pool of N workers should start exactly N goroutines -- use a `WaitGroup` or `errgroup` to verify they all exit

### Step 4: Design Channel Topology and Buffering

Channel design errors -- wrong buffer size, missing close, wrong direction -- produce subtle bugs. Apply these rules:

- **Unbuffered channels** are synchronization points: the send and receive happen simultaneously. Use them when you need a handoff to be acknowledged before proceeding, or as a semaphore (start N goroutines each blocking on a receive).
- **Buffered channels** decouple sender and receiver up to the buffer capacity. Use buffer size 1 when you need to avoid blocking on a single pending item (common in done/signal channels). Use buffer size N equal to the number of producers or consumers when you know their count.
- Do not guess buffer sizes for performance -- profile first. An arbitrary buffer of 100 is not better than 1 unless you have measured the contention.
- The goroutine that **produces** values into a channel is responsible for closing it -- not the consumer, not a third party. A close from the consumer side causes a panic on the next send.
- Use directional channel types in function signatures: `chan<- T` for producers, `<-chan T` for consumers. This communicates intent and catches misuse at compile time.
- Never close a channel from the consumer side or from a goroutine that does not own the channel. Use a `sync.Once` to guard a close that multiple goroutines might attempt.
- Detect channel leaks: a goroutine blocked forever on a send to a full buffered channel, or on a receive from an empty channel that is never closed, is a leak. Both show up as goroutines in `SIGQUIT` stack dumps and in `runtime/pprof` goroutine profiles.

### Step 5: Implement Context Propagation Correctly

`context.Context` is Go's standard mechanism for cancellation, deadlines, and request-scoped values. Misuse is rampant.

- Accept `context.Context` as the first parameter of every function that does I/O, starts goroutines, or calls external services. No exceptions.
- Never store a context in a struct field for long-lived objects -- pass it as a parameter per operation. The correct pattern is `func (s *Service) Fetch(ctx context.Context, id string) (*Item, error)`.
- Derive contexts with narrower deadlines for sub-operations: if a top-level request has a 5-second deadline, a database call within it should derive a context with `context.WithTimeout(ctx, 2*time.Second)` and the derived cancel must be deferred immediately: `ctx, cancel := context.WithTimeout(ctx, 2*time.Second); defer cancel()`.
- Always call the cancel function returned by `WithCancel`, `WithTimeout`, and `WithDeadline` -- even if the context expires naturally. Failing to call cancel leaks the context's goroutine (the timer goroutine) until the parent is cancelled.
- Do not use `context.WithValue` for optional parameters, dependency injection, or configuration. Use it only for request-scoped metadata that crosses API boundaries: request IDs, authentication tokens, tracing spans. Define typed keys (never string keys) to avoid collisions: `type contextKey struct{}; var requestIDKey = contextKey{}`.
- Check `ctx.Err()` or `<-ctx.Done()` at every blocking point inside long-running goroutines. A goroutine that does CPU work for 10 seconds without checking context cancellation will block graceful shutdown for 10 seconds.
- Propagate context into third-party clients: `http.NewRequestWithContext`, `sql.DB.QueryContext`, `redis.Client.Get(ctx, key)`. If a library does not accept a context, use a wrapper goroutine with a done channel to enforce the timeout externally.

### Step 6: Write Concurrent Code that Passes the Race Detector

The Go race detector (`-race`) instruments memory accesses at runtime and reports data races with full stack traces. It has roughly 5-10x CPU overhead and 5-20x memory overhead -- use it in tests and staging, not production. Enable it with:

```
go test -race ./...
go run -race main.go
```

- Run all unit and integration tests with `-race` as part of CI. This is not optional -- it is the only reliable way to find races before production.
- Understand what the race detector catches: concurrent unsynchronized reads/writes to the same memory location. It does NOT catch deadlocks, logical races, or ordering violations that happen to pass on the test hardware.
- Common races the detector will catch:
  - Closure over loop variable: `for i, v := range items { go func() { process(i, v) }() }` -- `i` and `v` are captured by reference, not value. Fix: `go func(i int, v Item) { process(i, v) }(i, v)` or in Go 1.22+, loop variables are scoped per iteration.
  - Map written from one goroutine and read from another without a mutex (Go maps are not goroutine-safe).
  - Slice header mutation: a goroutine appending to a slice while another reads it.
  - Accessing fields of a struct concurrently without a mutex even if different goroutines access different fields -- the race detector operates at the word level, but struct fields sharing a cache line can still cause issues under the memory model.
- Races the detector will NOT catch: logical ordering bugs where two goroutines both read a value, both compute an update, and one update is lost (lost update). This requires higher-level design: use `sync/atomic.CompareAndSwap` or a mutex-protected critical section.

### Step 7: Test Concurrent Code Systematically

Testing concurrent code requires deliberate effort beyond writing a test that happens to call concurrent code.

- **Race detector tests**: Every test involving goroutines must run with `-race`. Add this to your Makefile or CI as a separate step if your standard test run does not include it.
- **Leak tests**: Use `go.uber.org/goleak` to detect goroutine leaks in tests. Call `defer goleak.VerifyNone(t)` at the start of tests that launch goroutines. This catches leaked goroutines even when tests pass.
- **Deterministic tests for pipelines**: Inject a fake clock or a synchronization barrier to force deterministic ordering. The `sync` package's `Cond` can be used to synchronize test goroutines at known checkpoints.
- **Load tests for worker pools**: Test with GOMAXPROCS values greater than 1 (`runtime.GOMAXPROCS(runtime.NumCPU())`). Many races only appear with true parallelism.
- **Cancellation path tests**: Explicitly test what happens when the context is cancelled mid-operation. Create a context, start the operation, cancel the context after a short time, verify the operation returns `ctx.Err()` (either `context.Canceled` or `context.DeadlineExceeded`) within a reasonable timeout.
- **Deadlock detection**: Go's runtime detects total deadlock (all goroutines are blocked) and panics with `all goroutines are asleep -- deadlock!`. But partial deadlocks (some goroutines blocked, others running) go undetected. Use `pprof` goroutine profiles to inspect blocked goroutines: `http.ListenAndServe("localhost:6060", nil)` with `import _ "net/http/pprof"`, then `go tool pprof http://localhost:6060/debug/pprof/goroutine`.
- **Table-driven concurrency tests**: For worker pool and pipeline code, use table-driven tests that vary: input size (0, 1, N, N+1 where N is worker count), cancellation timing (before start, mid-flight, after completion), and error injection (no errors, single error, all errors).

### Step 8: Apply the Right High-Level Pattern

Armed with the above analysis, select from these concrete patterns. Each has a canonical implementation in Go:

- **Worker Pool**: N goroutines reading from a shared input channel. Use when work items are homogeneous and you need bounded concurrency. Size N = `runtime.NumCPU()` for CPU-bound work; N = 10 to 100 for I/O-bound work depending on latency and connection limits.
- **Pipeline**: Goroutines chained via channels, each stage transforming data. Use when processing is naturally decomposable into sequential stages that can run concurrently.
- **Fan-out / Fan-in**: One input channel fanned out to N workers, results fanned back in to one output channel. Combine with `sync.WaitGroup` to know when all workers have finished so you can close the output channel.
- **Done channel broadcast**: Close a `done` channel to signal all listeners simultaneously. More scalable than sending N signals to N goroutines. Used as the pre-`context` pattern; today, use `ctx.Done()` instead.
- **Semaphore**: Use a buffered channel of `struct{}` with capacity N, acquiring by sending and releasing by receiving. Or use `golang.org/x/sync/semaphore` for weighted acquisition (e.g., limit total bytes in flight rather than operation count).
- **`singleflight`**: Deduplicate concurrent calls for the same key. The first caller executes the function; subsequent callers with the same key block and share the result. Ideal for thundering-herd suppression on cache misses.
- **`errgroup`**: Structured concurrency with automatic context cancellation on first error. Preferred over raw `WaitGroup` for any group of goroutines that must all succeed.

## Output Format

When responding to a Go concurrency question, structure the response as follows:

```
## Concurrency Classification

**Problem category:** [Coordination | Communication | Shared state | Resource limiting | Fan-out/in | Rate limiting | Duplicate suppression]
**Primary primitive:** [channel | mutex | atomic | WaitGroup | errgroup | semaphore | singleflight]
**Key constraints identified:** [list specific constraints from the user's problem]

---

## Recommended Pattern: [Pattern Name]

### Why This Pattern

[2-4 sentences explaining why this pattern fits the specific constraints better than alternatives.
Reference the specific trade-offs: e.g., "A mutex is preferred over a channel here because
ownership does not transfer -- multiple goroutines need concurrent read access to the same cache."]

### Implementation

[Complete, runnable Go code. Not a snippet -- a complete example with package declaration,
imports, error handling, and context propagation. Include comments on non-obvious lines.]

```go
package main

import (
    // real imports only
)

// [Complete implementation]
```

### Key Design Decisions

| Decision | Choice Made | Alternative | Reason |
|----------|-------------|-------------|--------|
| [e.g., Buffer size] | [e.g., Unbuffered] | [e.g., Buffered 1] | [e.g., Backpressure required] |
| [e.g., Error aggregation] | [e.g., errgroup] | [e.g., WaitGroup + error channel] | [e.g., Automatic cancellation] |

### Goroutine Lifecycle

- **Start condition:** [when goroutines are created]
- **Stop condition:** [what causes them to exit]
- **Owner:** [which goroutine is responsible for cleanup/close]
- **Leak prevention:** [specific mechanism used]

### Testing This Pattern

[Specific test strategy for this pattern: race detector usage, goleak setup, cancellation test, load test parameters.]

---

## Common Pitfalls to Avoid

- [Specific pitfall #1 for this exact pattern]
- [Specific pitfall #2]
- [Specific pitfall #3]
```

## Rules

1. **Never launch a goroutine without defining its exit condition.** Every goroutine must either range over a channel (exits on close), select on `ctx.Done()` (exits on cancellation), or return after completing a bounded task. State the exit condition explicitly in code comments.

2. **Never close a channel from the receiver side.** The producer owns the channel and is the only entity permitted to close it. If multiple producers write to the same channel, use a `sync.Once` wrapping the close to prevent double-close panics.

3. **Never use `time.Sleep` as a synchronization mechanism.** `time.Sleep` in concurrent code is a symptom of a missing synchronization primitive. Replace it with channels, `WaitGroup`, or `Cond`. The one legitimate use is retry backoff, which should use a timer with context cancellation, not bare sleep.

4. **Always defer the cancel function from `WithCancel`, `WithTimeout`, and `WithDeadline`.** The pattern is always: `ctx, cancel := context.WithTimeout(parent, d); defer cancel()`. Missing the defer leaks a goroutine for the duration of the parent context.

5. **Never share a `sync.Mutex` by value.** Copying a mutex copies its internal state, breaking synchronization silently. Always pass and store `*sync.Mutex` (pointer), or embed it in a struct and pass pointers to the struct.

6. **Never range over a channel that might never be closed.** A `for v := range ch` blocks forever if `ch` is never closed. Ensure the producer closes the channel when done, or use a `select` with `ctx.Done()` inside a manual `for` loop.

7. **Never use `sync.Map` as a default map.** `sync.Map` is optimized for two specific access patterns: keys written once and read many times, or keys that are disjoint between goroutines. For a general-purpose concurrent map, use a `struct` containing a `map[K]V` protected by a `sync.RWMutex` -- this is more readable and typically faster.

8. **Always size worker pools based on the workload type.** For CPU-bound work, set N = `runtime.NumCPU()` or `runtime.GOMAXPROCS(0)`. For I/O-bound work, profile to find the optimal N -- it is often between 10 and 100, depending on downstream latency and connection pool limits. Never hardcode 1000 goroutines for I/O work without a semaphore -- this causes connection pool exhaustion.

9. **Never write to a map concurrently without synchronization.** Go maps have no built-in concurrency safety. A concurrent write with any other operation (read or write) is a data race. The runtime will panic in map operations if it detects internal state corruption, but the race detector will catch it first.

10. **Always propagate context through the full call chain.** A context created at the HTTP handler or main goroutine level must reach every downstream operation: database queries, HTTP client calls, gRPC calls, and goroutines spawned within the request. A context that is created but not passed to sub-calls is effectively useless for cancellation and deadline propagation.

## Edge Cases

### Goroutine Leaks in Long-Running Servers

In a server that handles millions of requests, a goroutine leak of one goroutine per request accumulates to memory exhaustion over hours. The common cause is a goroutine blocked on a channel send where the receiver has already returned (due to a timeout or panic). Fix: always use `select` with `ctx.Done()` when sending to a channel that might not be read:

```go
select {
case resultCh <- result:
case <-ctx.Done():
    return ctx.Err()
}
```

Additionally, use `goleak.VerifyNone(t)` in tests and expose `/debug/pprof/goroutine` in staging with alerting when goroutine count exceeds a threshold (typical production services should have a stable goroutine count -- a leak will appear as a monotonically increasing metric).

### The `for range` Loop Variable Capture Bug (Pre-Go 1.22)

In Go versions before 1.22, the loop variable in `for i, v := range slice` is a single variable reused each iteration. Goroutines launched in the loop body that close over `i` or `v` will all see the last value. Fix for pre-1.22 code: shadow the variable inside the loop body before launching the goroutine:

```go
for i, v := range items {
    i, v := i, v // shadow: creates new variable per iteration
    go func() {
        process(i, v)
    }()
}
```

In Go 1.22+, loop variables are scoped per iteration by default, making the shadow unnecessary. When reviewing code, check the `go` directive in `go.mod` to determine which behavior applies.

### Deadlock from Circular Channel Dependencies

A deadlock occurs when goroutine A sends on channel X waiting for goroutine B to receive, while goroutine B sends on channel Y waiting for goroutine A to receive. Neither can proceed. The Go runtime detects this only if ALL goroutines are blocked. To prevent:
- Draw the goroutine topology as a directed graph. Cycles in this graph indicate potential deadlock.
- Always introduce context cancellation with a timeout at the outermost level: if a pipeline does not complete within its deadline, the timeout fires and cancels all goroutines.
- Use select with `default` or `ctx.Done()` on every blocking send/receive in pipeline stages where a deadlock cycle could form.

### `errgroup` vs. `WaitGroup` for Error Aggregation

`errgroup.Group` cancels the shared context on the first error, which means remaining goroutines receive a cancellation signal and should return early. This is correct for the "fail-fast" pattern. However, if you need to collect ALL errors from N concurrent operations (not just the first), `errgroup` is the wrong tool. Use a `WaitGroup` and a thread-safe error accumulator:

```go
var mu sync.Mutex
var errs []error
var wg sync.WaitGroup
for _, item := range items {
    wg.Add(1)
    go func(item Item) {
        defer wg.Done()
        if err := process(item); err != nil {
            mu.Lock()
            errs = append(errs, err)
            mu.Unlock()
        }
    }(item)
}
wg.Wait()
return errors.Join(errs...) // Go 1.20+
```

### Thundering Herd After Cache Expiry

When a cached value expires, multiple concurrent requests for the same key simultaneously miss the cache, trigger N identical expensive backend calls, and all write the result back. Use `singleflight.Group` to collapse concurrent identical calls:

```go
var g singleflight.Group

func fetchUser(ctx context.Context, id string) (*User, error) {
    v, err, _ := g.Do(id, func() (interface{}, error) {
        return db.QueryUser(ctx, id)
    })
    if err != nil {
        return nil, err
    }
    return v.(*User), nil
}
```

Note: `singleflight` shares the result of a single in-flight call with all callers blocked on the same key. The third return value is a bool indicating whether the result was shared. If the backend call fails, ALL callers sharing the call receive the error -- there is no retry for the waiters. For some use cases, you want to suppress the error for waiters and let them try independently; in that case, use the `Forget` method to remove the key on error so the next caller retries.

### Context Values vs. Parameters for Request Metadata

Teams frequently debate whether to put authentication tokens, request IDs, or user IDs in context values vs. explicit parameters. The rule: context values are for cross-cutting operational concerns (trace IDs, request IDs for logging correlation), NOT for business logic inputs. An authentication token that determines what data a user can access is a business input -- pass it explicitly. A trace ID used only by middleware to correlate log lines is cross-cutting -- context is appropriate. Mixing the two creates functions whose behavior changes based on invisible context state, which is difficult to test and reason about.

### High-Concurrency `sync.RWMutex` Degradation

`sync.RWMutex` performs well when reads are far more frequent than writes. Under extremely high concurrent read load, a write attempting to acquire the lock must wait for ALL current readers to release. If new readers continuously arrive, the writer can starve. Additionally, `RLock` and `RUnlock` themselves have non-trivial overhead at very high concurrency due to cache line contention on the lock state. At >100,000 concurrent readers (extreme cases), consider sharding the data structure: partition the data into N shards each with its own `RWMutex`, and route operations by key hash. This reduces contention by a factor of N.

## Example

**Input:** "I have a Go HTTP server that needs to call 3 external APIs concurrently for each request, aggregate the results, and respect the request's timeout. One API failure should not fail the entire request -- I want partial results. How do I implement this?"

**Output:**

---

## Concurrency Classification

**Problem category:** Fan-out / Fan-in with partial failure tolerance
**Primary primitive:** `errgroup` is insufficient here (it fails fast); use a `WaitGroup` with a result struct carrying both value and error per call
**Key constraints identified:** 3 concurrent calls, partial failure acceptable, must respect incoming request context deadline

---

## Recommended Pattern: Fan-Out with Per-Result Error Encapsulation

### Why This Pattern

Since partial failure is acceptable, the "fail-fast" cancellation behavior of `errgroup` is incorrect -- cancelling the context on the first API error would abort the two remaining calls. Instead, launch each call in its own goroutine, collect results through a typed result channel, and let the caller decide what to do with the individual errors. The request context is passed directly to each call so that the request's deadline (from the HTTP server's `context.WithTimeout` or from the client) still governs all three calls: if the request is cancelled, all three API calls will return `ctx.Err()` and the goroutines will exit cleanly.

### Implementation

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "sync"
    "time"
)

// APIResult holds the response from one external API call,
// along with the source name and any error encountered.
type APIResult struct {
    Source string
    Data   json.RawMessage
    Err    error
}

// AggregatedResponse is the final response assembled from partial results.
type AggregatedResponse struct {
    Results map[string]json.RawMessage `json:"results"`
    Errors  map[string]string          `json:"errors,omitempty"`
}

// fetchProfile, fetchRecommendations, fetchInventory are the three external calls.
// Each accepts a context so the request deadline propagates.
func fetchProfile(ctx context.Context, userID string) (json.RawMessage, error) {
    req, err := http.NewRequestWithContext(ctx, http.MethodGet,
        fmt.Sprintf("https://profile-service/users/%s", userID), nil)
    if err != nil {
        return nil, err
    }
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("profile service: %w", err)
    }
    defer resp.Body.Close()
    var body json.RawMessage
    if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
        return nil, fmt.Errorf("profile decode: %w", err)
    }
    return body, nil
}

// fetchRecommendations and fetchInventory follow the same pattern -- omitted for brevity.
// In a real implementation, each would call its respective service.

// callAPI is a generic wrapper that executes one API call and sends the result
// to the results channel. It never blocks on the send: if the channel is full
// or the context is cancelled, it exits immediately.
func callAPI(
    ctx context.Context,
    source string,
    fn func(context.Context) (json.RawMessage, error),
    results chan<- APIResult,
    wg *sync.WaitGroup,
) {
    defer wg.Done()

    data, err := fn(ctx)

    select {
    case results <- APIResult{Source: source, Data: data, Err: err}:
        // result delivered
    case <-ctx.Done():
        // request was cancelled before we could deliver; exit silently.
        // The result is dropped, which is acceptable -- the aggregator
        // loop will exit when the WaitGroup completes.
    }
}

// AggregateHandler demonstrates the full pattern in an HTTP handler.
func AggregateHandler(w http.ResponseWriter, r *http.Request) {
    // The request context already carries the client's deadline.
    // We add an additional 2-second budget as a safety cap for this
    // specific aggregation operation -- belt-and-suspenders.
    ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
    defer cancel() // ALWAYS defer; prevents timer goroutine leak.

    userID := r.URL.Query().Get("user_id")

    // results is buffered to exactly 3 -- the number of goroutines.
    // This ensures no goroutine blocks on send even if the aggregator
    // exits early (e.g., context cancelled).
    results := make(chan APIResult, 3)
    var wg sync.WaitGroup

    // Define the three calls as closures that close over userID.
    calls := []struct {
        name string
        fn   func(context.Context) (json.RawMessage, error)
    }{
        {
            name: "profile",
            fn:   func(ctx context.Context) (json.RawMessage, error) { return fetchProfile(ctx, userID) },
        },
        // fetchRecommendations and fetchInventory would be added here
        // following the same pattern.
    }

    wg.Add(len(calls))
    for _, call := range calls {
        call := call // pre-1.22 loop variable capture fix
        go callAPI(ctx, call.name, call.fn, results, &wg)
    }

    // Close the results channel once all workers have exited.
    // This goroutine is the "closer" goroutine -- it owns the close.
    // It is the only goroutine that may close results.
    go func() {
        wg.Wait()
        close(results)
    }()

    // Aggregate results from the channel until it is closed.
    response := AggregatedResponse{
        Results: make(map[string]json.RawMessage),
        Errors:  make(map[string]string),
    }
    for result := range results {
        if result.Err != nil {
            response.Errors[result.Source] = result.Err.Error()
        } else {
            response.Results[result.Source] = result.Data
        }
    }

    // If no successful results were obtained AND the context was
    // cancelled, treat it as a request timeout.
    if len(response.Results) == 0 && ctx.Err() != nil {
        http.Error(w, "all upstream calls timed out", http.StatusGatewayTimeout)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}
```

### Key Design Decisions

| Decision | Choice Made | Alternative | Reason |
|----------|-------------|-------------|--------|
| Error handling | Per-result error in `APIResult` struct | `errgroup` with fail-fast | Partial results required; errgroup cancels on first error |
| Channel buffer size | 3 (equal to goroutine count) | Unbuffered | Prevents goroutine leak if aggregator exits before reading all results |
| Context source | `r.Context()` with additional timeout | Fresh `context.WithTimeout` | Inherits client deadline; additional cap prevents runaway backend calls |
| Channel close ownership | Dedicated closer goroutine after `wg.Wait()` | Close in individual goroutines | Only one entity closes the channel; prevents double-close panic |
| Loop variable capture | `call := call` shadow | Closure over outer variable | Pre-1.22 safety; harmless in 1.22+ |
| Send path | `select` with `ctx.Done()` | Bare send `results <- result` | Prevents goroutine leak if context is cancelled mid-send |

### Goroutine Lifecycle

- **Start condition:** Goroutines start when the HTTP handler is invoked, one per API call plus one closer goroutine
- **Stop condition:** API goroutines exit after receiving a response or when `ctx` is cancelled (propagated through `http.NewRequestWithContext`); closer goroutine exits after `wg.Wait()` returns
- **Owner:** The handler goroutine owns the `ctx` cancel; the closer goroutine owns the channel close
- **Leak prevention:** Buffered channel of size N prevents send-block; `select` with `ctx.Done()` on every send; `defer cancel()` on context

### Testing This Pattern

```go
func TestAggregateHandler_PartialFailure(t *testing.T) {
    defer goleak.VerifyNone(t) // catches any leaked goroutines after test

    // Use httptest.NewRecorder and a crafted request with a cancellable context
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    req := httptest.NewRequest(http.MethodGet, "/?user_id=42", nil).WithContext(ctx)
    rec := httptest.NewRecorder()

    AggregateHandler(rec, req)

    var resp AggregatedResponse
    require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
    // With real service stubs: assert partial results, assert error keys
}

func TestAggregateHandler_ContextCancellation(t *testing.T) {
    defer goleak.VerifyNone(t)

    ctx, cancel := context.WithCancel(context.Background())
    cancel() // cancel immediately to test early-exit path

    req := httptest.NewRequest(http.MethodGet, "/?user_id=42", nil).WithContext(ctx)
    rec := httptest.NewRecorder()

    AggregateHandler(rec, req)
    assert.Equal(t, http.StatusGatewayTimeout, rec.Code)
}
```

Run all tests with: `go test -race -count=1 ./...`

---

## Common Pitfalls to Avoid

- **Unbuffered results channel**: If the channel is unbuffered and the aggregator exits early (panic, early return), all worker goroutines block forever on their send -- a permanent goroutine leak in a long-running server.
- **Closing the channel inside a worker goroutine**: If you close `results` from inside one of the API-call goroutines instead of the dedicated closer goroutine, a second goroutine attempting to send will panic with "send on closed channel".
- **Using `errgroup.WithContext` and ignoring its cancel semantics**: If you use `errgroup` here "for convenience" and set `errors.Is(err, context.Canceled)` as acceptable, you will still abort the two remaining calls when the first fails -- defeating the partial-results requirement entirely.
