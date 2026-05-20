---
name: rust-async-patterns
description: |
  Guides advanced Rust async programming: Tokio vs async-std decision, async trait patterns, spawning strategies, blocking in async contexts, and structured concurrency with JoinSet.
  Use when the user asks about Rust async, Tokio, async-std, async traits, spawning, blocking in async, JoinSet, futures.
  Do NOT use when the user asks about Rust ownership (use `rust-ownership-patterns`), Rust performance (use `rust-performance`), Rust error handling (use `rust-error-handling`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "rust backend optimization"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Rust Async Patterns

## When to Use

**Use this skill when the user:**
- Asks which async runtime to choose for a Rust project (Tokio vs async-std vs smol) and needs a decision framework based on ecosystem maturity, feature set, and compatibility
- Wants to implement async traits in Rust and encounters the "async fn in trait" limitation or needs to understand when to use `async-trait` crate vs native `async fn in trait` (stabilized in Rust 1.75+)
- Needs to spawn tasks and must decide between `tokio::spawn`, `tokio::task::spawn_local`, `JoinSet`, `FuturesUnordered`, or `join!` based on lifetime, ownership, and cancellation requirements
- Is calling blocking code (database drivers using std I/O, CPU-intensive computation, FFI with blocking syscalls) from within an async context and risks starving the executor
- Wants structured concurrency -- bounding task lifetimes, collecting results from concurrent subtasks, or implementing fan-out/fan-in patterns using `JoinSet` or `FuturesUnordered`
- Is debugging async issues: dropped futures, missed `.await` calls, accidental blocking on the async thread pool, or tasks leaking after cancellation
- Needs to design async streams, implement custom `Future` by hand, or use `Pin<Box<dyn Future>>` for dynamic dispatch of futures
- Asks about channels in async contexts: `tokio::sync::mpsc`, `broadcast`, `oneshot`, `watch`, or how to choose between them

**Do NOT use this skill when:**
- The user asks about Rust ownership, lifetimes, or borrow checker issues in async code -- reach for `rust-ownership-patterns` (note: lifetime issues in async closures are ownership topics, not async patterns)
- The user asks about general Rust performance optimization, SIMD, memory layout, or allocation strategies -- use `rust-performance`
- The user asks about `Result`, `?` operator, `thiserror`/`anyhow` crate selection, or error propagation strategy -- use `rust-error-handling`
- The user needs synchronous Rust concurrency (Rayon for CPU parallelism, `std::thread`, `Arc<Mutex<T>>`) without any async involvement
- The user is writing embedded Rust (`no_std`) where standard async runtimes are unavailable -- specialized embedded async (embassy) is a separate concern

---

## Process

### 1. Classify the Async Use Case

Before writing any code, determine which async problem category applies:

- **I/O concurrency** -- multiple network calls, file reads, or database queries that can overlap. The dominant case. Answer: `tokio::spawn` or `join!` depending on whether tasks are independent or coordinated.
- **CPU-bound work inside async** -- image encoding, cryptography, serialization of large payloads. Answer: `tokio::task::spawn_blocking` or a dedicated thread pool. Never run CPU work >~1ms directly on the async executor.
- **Structured fan-out** -- launch N tasks, collect all results or short-circuit on first error. Answer: `JoinSet` for ownership-clean collection, `FuturesUnordered` when you want stream-style polling.
- **Long-running background tasks** -- health check loops, metric flushers, connection pool maintainers. Answer: `tokio::spawn` at application startup with `AbortHandle` stored for clean shutdown.
- **Async streams/producers** -- generating values asynchronously over time. Answer: `tokio_stream`, `async-stream` crate, or manual `Stream` impl.
- **Single-threaded async** (e.g., browser WASM, `LocalSet`) -- futures that contain `Rc<T>` or aren't `Send`. Answer: `tokio::task::LocalSet` + `spawn_local`.

Identify which category applies before touching runtime selection. Multiple categories can coexist in one application.

### 2. Select the Runtime

Apply this decision framework:

- **Default choice: Tokio** -- Largest ecosystem, best documentation, most production deployments. Required by Axum, Tonic (gRPC), Hyper, Reqwest, SQLx, and virtually every production async library. Use `tokio = { version = "1", features = ["full"] }` in development; narrow features to `rt-multi-thread`, `net`, `time`, `sync` in production crates to reduce compile time.
- **async-std** -- Mirrors the `std` API surface, easier migration from sync code. Fewer third-party crates are compatible. Choose only if your team has a strong preference for the `std`-mirror API or you need `surf` (HTTP client built on async-std). Avoid mixing async-std with Tokio-native types -- `tokio::net::TcpStream` and `async_std::net::TcpStream` are not interchangeable.
- **smol** -- Minimal runtime (~500 lines of core logic), suitable for small tools or when binary size is critical. Lacks `tokio::time`, `tokio::signal`, and ecosystem parity. Not recommended for services.
- **No runtime / library authors** -- If writing a library, do NOT pull in a runtime as a hard dependency. Expose `async fn` that work with any runtime. Use `futures::io::{AsyncRead, AsyncWrite}` traits for I/O abstraction. Only add a dev-dependency on Tokio for tests.

Single-binary services should commit to one runtime. Mixing Tokio and async-std in the same binary causes incompatible waker implementations and subtle bugs.

### 3. Design the Executor Configuration

Configure the runtime intentionally, not with defaults:

- **Multi-threaded scheduler** (default `#[tokio::main]`): Uses all CPU cores. Suitable for services with concurrent I/O. Worker threads default to `num_cpus::get()`. Override with `worker_threads(4)` when you want predictable resource usage in containers.
  ```rust
  #[tokio::main(flavor = "multi_thread", worker_threads = 4)]
  async fn main() { ... }
  ```
- **Current-thread scheduler** (`flavor = "current_thread"`): Single-threaded, no `Send` requirement on spawned tasks. Use for CLI tools, test harnesses, or WASM. Much lower overhead when concurrency is low.
- **Blocking thread pool**: Tokio maintains a separate thread pool (default max 512 threads, configurable via `TOKIO_BLOCKING_THREADS` env var or `Builder::max_blocking_threads`) for `spawn_blocking`. This is distinct from the async worker pool. Size it based on blocking operation concurrency, not CPU count.
- **Runtime builder for tests and libraries**:
  ```rust
  let rt = tokio::runtime::Builder::new_multi_thread()
      .worker_threads(2)
      .enable_all()
      .build()
      .unwrap();
  rt.block_on(async { ... });
  ```

### 4. Implement Async Traits Correctly

Async traits are the most common source of confusion. Know which approach to use:

- **Rust 1.75+ native async fn in traits** (stable): Supported natively but generates Return Position Impl Trait (RPIT), meaning the concrete future type is opaque and the trait is not object-safe by default. Use when you do not need `dyn Trait`.
  ```rust
  trait Fetcher {
      async fn fetch(&self, url: &str) -> Result<Bytes, Error>;
  }
  ```
- **`async-trait` crate** (pre-1.75 or when you need `dyn Trait`): Rewrites async fn to return `Pin<Box<dyn Future + Send + 'async_trait>>`. Has a per-call heap allocation cost. Acceptable for application code, potentially problematic in hot loops.
  ```rust
  #[async_trait]
  trait Repository: Send + Sync {
      async fn find_by_id(&self, id: Uuid) -> Result<Entity, DbError>;
  }
  ```
- **Manual `Pin<Box<dyn Future>>` return**: For library code where you want zero `async-trait` dependency and full control. Verbose but allocation-transparent.
- **`Send` bounds on async trait objects**: When using `async-trait` with `tokio::spawn`, you must add `#[async_trait]` and ensure the trait bound is `Send`. Use `#[async_trait(?Send)]` only for `LocalSet`-confined code.
- **Avoid async fn in traits for hot path code**: Each `async-trait` call allocates a `Box`. For a method called 100k times/second, that is 100k allocations. Profile with `cargo flamegraph` -- if `alloc` appears in async trait paths, consider refactoring to explicit future types.

### 5. Choose the Right Spawning Strategy

Spawning is the primary concurrency mechanism. Each primitive has distinct semantics:

- **`tokio::spawn(future)`** -- Detaches a task. The future must be `'static + Send`. Returns `JoinHandle<T>`. If the handle is dropped, the task continues running (fire-and-forget). If you drop the handle and later need to cancel, you've lost the handle. Store `JoinHandle` or use `AbortHandle` for lifecycle control.
- **`join!(f1, f2, f3)`** -- Runs futures concurrently on the SAME task, no spawning overhead. None of the futures need to be `'static`. If one future completes, the others continue until all complete. Cancellation of the parent cancels all. Use for 2-8 known futures with shared lifetime.
- **`try_join!(f1, f2)`** -- Like `join!` but short-circuits on first `Err`. Returns `Err` immediately and drops remaining futures. Use for dependent setup steps where any failure should abort all.
- **`JoinSet`** -- Owned collection of spawned tasks. `JoinSet::spawn()` requires `'static + Send`. Call `.join_next().await` to receive results in completion order. On `JoinSet::drop()`, all contained tasks are aborted. This makes `JoinSet` the primary tool for bounded structured concurrency.
  ```rust
  let mut set: JoinSet<Result<Response, Error>> = JoinSet::new();
  for url in urls {
      set.spawn(fetch(client.clone(), url));
  }
  while let Some(result) = set.join_next().await {
      match result {
          Ok(Ok(resp)) => process(resp),
          Ok(Err(e)) => tracing::warn!("fetch failed: {e}"),
          Err(join_err) => tracing::error!("task panicked: {join_err}"),
      }
  }
  ```
- **`FuturesUnordered`** -- Stream of futures polled as they're ready. Does NOT spawn tasks -- futures share the calling task's thread. Lower overhead than `JoinSet` when futures don't block or when `'static` is unavailable. Risk: a long-running future in the set can starve others because it monopolizes the task.
- **`buffer_unordered(n)` on streams** -- When processing a `Stream` of work with bounded concurrency. `stream.buffer_unordered(16)` runs up to 16 futures simultaneously. Use for database batch processing or HTTP request fans.

### 6. Handle Blocking Code in Async Contexts

This is the most common source of async performance bugs in Rust services:

- **Rule of thumb**: Any operation that might take >100 microseconds without yielding to the executor should be offloaded. Network I/O is handled by the runtime -- the concern is CPU work and blocking syscalls.
- **`tokio::task::spawn_blocking(|| { ... })`** -- Runs closure on the blocking thread pool. Returns `JoinHandle`. Use for: synchronous file I/O (`std::fs`), CPU-intensive work (compression, hashing large buffers), legacy synchronous library calls, anything using `std::sync::Mutex` with potential contention.
  ```rust
  let hash = tokio::task::spawn_blocking(move || {
      bcrypt::hash(password, bcrypt::DEFAULT_COST)
  }).await??; // double ? for JoinHandle and inner Result
  ```
- **`tokio::task::block_in_place(|| { ... })`** -- Blocks the current worker thread in place rather than moving work to the blocking pool. Tells Tokio to move other tasks to other worker threads. Available only in multi-thread flavor. Slightly lower overhead than `spawn_blocking` for short synchronous sections. Do NOT use in current-thread flavor -- it panics.
- **Detecting accidental blocking**: Use `tokio-console` (runtime debugging tool using `console-subscriber`) to observe task scheduling. Tasks that hold the executor for >10ms will appear as long polls. Enable with:
  ```toml
  console-subscriber = "0.2"
  ```
  and `console_subscriber::init()` at startup. Connect with `tokio-console` CLI.
- **Never use `std::sync::Mutex` in ways that block across await points**: If you lock a `std::sync::Mutex` and then `.await`, you hold the lock across a yield point, potentially causing deadlocks or starvation. Either use `tokio::sync::Mutex` (which is async-aware) or restructure to release the lock before awaiting.

### 7. Implement Cancellation and Shutdown

Async cancellation is implicit in Rust: dropping a future cancels it. This requires care:

- **Cancellation safety**: A future is "cancellation-safe" if dropping it mid-execution leaves no observable side effects. `tokio::sync::mpsc::Receiver::recv()` is cancellation-safe. `AsyncWriteExt::write_all()` is NOT -- a partial write may have occurred. Document cancellation safety for every public async fn in library code.
- **`tokio::select!` for cancellation**:
  ```rust
  tokio::select! {
      result = do_work() => handle(result),
      _ = shutdown_signal() => {
          // cleanup
          return;
      }
  }
  ```
  `select!` drops all non-winning futures immediately. Ensure the losing branches are cancellation-safe or use `biased;` to control poll order.
- **Graceful shutdown pattern**: Use a `CancellationToken` from `tokio-util` for propagating shutdown signals through task hierarchies:
  ```rust
  let token = CancellationToken::new();
  let child_token = token.child_token();
  tokio::spawn(async move {
      tokio::select! {
          _ = child_token.cancelled() => {}
          _ = worker_loop() => {}
      }
  });
  // Later, to shut down:
  token.cancel();
  ```
- **Timeout pattern**: Wrap any potentially stalling future:
  ```rust
  tokio::time::timeout(Duration::from_secs(30), fetch_data())
      .await
      .map_err(|_| Error::Timeout)?
  ```
- **Join with abort on error**: When using `JoinSet` and you want all tasks cancelled if any one fails, call `set.abort_all()` after detecting the first error, then drain remaining with `join_next()`.

### 8. Test Async Code

Testing async requires specific patterns:

- **`#[tokio::test]`** -- Macro that wraps each test in a current-thread Tokio runtime. Fast, isolated. Default for unit tests.
- **`#[tokio::test(flavor = "multi_thread")]`** -- Use when testing behavior that depends on concurrent execution or when the code under test requires multiple worker threads (e.g., `spawn_blocking` calls).
- **`tokio::time::pause()` for time-dependent tests**: Pauses Tokio's mock clock. `tokio::time::advance(Duration::from_secs(60))` moves time forward without sleeping. Essential for testing timeouts and retry backoff logic without slow tests.
  ```rust
  #[tokio::test]
  async fn test_timeout_behavior() {
      tokio::time::pause();
      let task = tokio::spawn(async {
          tokio::time::sleep(Duration::from_secs(10)).await;
          "done"
      });
      tokio::time::advance(Duration::from_secs(11)).await;
      assert_eq!(task.await.unwrap(), "done");
  }
  ```
- **Use `tokio::sync::Notify` or `tokio::sync::Barrier` in tests** to synchronize concurrent test tasks at specific points, replacing fragile `sleep`-based synchronization.
- **`loom`** for deterministic concurrency testing: The `loom` crate permutes thread scheduling to find data races and deadlocks. Use for low-level async primitives and custom synchronization code. Not needed for application-level tests.

---

## Output Format

When advising on async patterns, structure the response as:

```
## Async Pattern Recommendation

### Use Case Classification
[One of: I/O Concurrency | CPU Offload | Structured Fan-out | Background Task | Async Stream | Single-threaded]

### Runtime Decision
| Factor | Assessment | Decision |
|--------|------------|----------|
| Ecosystem fit | [e.g., uses SQLx, Axum, Hyper] | Tokio required |
| Concurrency model | [multi-thread / current-thread] | [flavor choice] |
| `Send` requirement | [tasks cross threads: yes/no] | [impact on design] |
| Library or binary | [library: no runtime dep / binary: embed runtime] | [approach] |

### Spawning Strategy
| Scenario | Primitive | Reason |
|----------|-----------|--------|
| [scenario] | [join! / JoinSet / spawn / FuturesUnordered] | [specific trade-off] |

### Implementation

#### Core Pattern
```rust
// [Concrete, compilable code specific to user's use case]
// Include: runtime setup, task spawning, error handling, cancellation
```

#### Blocking Integration (if applicable)
```rust
// spawn_blocking / block_in_place pattern with explanation
```

#### Shutdown Handling
```rust
// CancellationToken or select! shutdown pattern
```

### Trade-offs and Risks
- [Specific risk #1 and mitigation]
- [Specific risk #2 and mitigation]
- [Performance characteristic to watch]

### Testing Strategy
```rust
// #[tokio::test] example with time::pause() or mock if relevant
```
```

---

## Rules

1. **Never block the async executor thread.** Any synchronous operation exceeding ~100 microseconds that does not yield (CPU loops, `std::fs`, synchronous database calls, `std::sync::Mutex` with contention) must be wrapped in `spawn_blocking`. One blocked worker thread on a 4-thread runtime reduces throughput by 25%.

2. **Never mix Tokio and async-std in the same binary.** Their waker implementations are incompatible. A future created by async-std woken via a Tokio waker results in tasks never being polled again (silent hang, not a crash).

3. **Never drop a `JoinHandle` if you need cancellation.** A dropped `JoinHandle` detaches the task -- it keeps running forever (or until the runtime shuts down). Always store handles, use `JoinSet`, or explicitly call `.abort()`. Leaked tasks are a common source of memory growth in long-running services.

4. **Always propagate the `Send` bound from tasks to their contained futures.** If you see `future cannot be sent between threads safely`, trace which type in the future is `!Send` -- it is usually a `Rc<T>`, a raw pointer, or a `std::sync::MutexGuard` held across an await. Fix at the source, not by wrapping in `Mutex`.

5. **Prefer `try_join!` over sequential awaits for independent async operations.** Sequential `let a = f1().await?; let b = f2().await?;` adds latency equal to the sum of all operations. `try_join!(f1(), f2())` runs them concurrently and takes max latency. In a handler making 3 independent DB queries, this can reduce latency by 2x-3x.

6. **Do not use `async-trait` in hot paths without profiling.** Each invocation boxes the returned future (heap allocation). For a service handling 50k req/s through a trait object, that is 50k extra allocations per second. Profile with `cargo flamegraph` or `perf` before accepting this overhead in critical paths.

7. **Never hold `tokio::sync::Mutex` across an expensive await.** While `tokio::sync::Mutex` is correct to hold across awaits (unlike `std::sync::Mutex`), holding it while awaiting a slow I/O operation serializes all contenders on that lock. Restructure to minimize lock hold time -- fetch data outside the lock, then lock only for the write.

8. **Always use `tokio::time::timeout` on any external I/O.** No network call or external service is guaranteed to respond. Without a timeout, a single slow dependency can exhaust your connection pool or hang tasks indefinitely. Production default: 30 seconds for most service calls; 5 seconds for health-critical paths.

9. **Document cancellation safety for every public async fn in shared libraries.** This is not obvious from the signature. Use `/// # Cancellation Safety` doc sections. Users of your API need to know if they can safely use the function as a branch in `tokio::select!`.

10. **Use `tracing::instrument` on async fn, not `log::debug!` for observability.** The `#[instrument]` attribute from the `tracing` crate creates spans that automatically track async task lifetimes, parent-child span relationships, and can be exported to OpenTelemetry. Plain log statements lose context across task spawns. In production async Rust, `tracing` is the standard.

---

## Edge Cases

### Async in Libraries vs. Binaries
Library crates must not embed a runtime. A library that calls `tokio::runtime::Runtime::new()` internally forces its runtime onto the user and conflicts with any existing runtime. Instead, expose plain `async fn` and let the binary decide the runtime. If the library needs to provide a synchronous API wrapping async internals, document this explicitly and provide an optional `blocking` feature flag that uses `Runtime::block_on` -- activated only when users opt in.

### `!Send` Futures and the `LocalSet`
When a future contains `Rc<T>`, raw pointers, or any `!Send` type, it cannot be spawned with `tokio::spawn`. Solutions:
- Use `tokio::task::LocalSet` with `spawn_local` -- runs on a single thread, no `Send` requirement
- Restructure to eliminate `!Send` types (prefer `Arc<T>` over `Rc<T>` in async code)
- Use `current_thread` runtime flavor for single-threaded programs where `Send` is unnecessary

Be aware that `LocalSet` tasks cannot migrate between threads, so if you need parallelism, you must eliminate the `!Send` constraint.

### Recursive Async Functions
Rust cannot compute the size of a recursive async function's future at compile time. The compiler error reads "has infinite size". Fix with boxing:
```rust
fn fetch_tree(id: NodeId) -> Pin<Box<dyn Future<Output = Result<Tree, Error>> + Send>> {
    Box::pin(async move {
        let node = db.get(id).await?;
        let children = futures::future::try_join_all(
            node.child_ids.into_iter().map(|id| fetch_tree(id))
        ).await?;
        Ok(Tree { node, children })
    })
}
```
Do not use `#[async_recursion]` in library code without flagging the boxing overhead to callers.

### Spawning from Synchronous Code
When you have a synchronous function that needs to kick off async work (common in callback-based APIs or plugin systems), you need `Handle::current()`:
```rust
fn on_event_sync(event: Event) {
    let handle = tokio::runtime::Handle::current();
    handle.spawn(async move { process_event(event).await });
}
```
This requires the synchronous function to be called from within a Tokio runtime context. If you cannot guarantee a runtime is active, use `Handle::try_current()` and handle the `NoRuntimeFound` error. Never call `Runtime::block_on` from within an async context -- this panics ("cannot start a runtime from within a runtime").

### Backpressure and Channel Sizing
Unbounded channels (`tokio::sync::mpsc::unbounded_channel()`) can grow without limit when producers outpace consumers, leading to OOM. Prefer bounded channels with explicit capacity:
- `mpsc::channel(256)` -- 256-item buffer; senders apply backpressure when full (`.send().await` blocks)
- Capacity sizing: buffer = (consumer latency in ms) × (message rate per ms). For a 10ms consumer at 5k msg/s, buffer = 50 items. Double this for burst headroom.
- Use `try_send` instead of `send().await` when the sender should drop messages rather than back-pressure (e.g., metrics, logging) -- this avoids making the caller async unnecessarily.
- `broadcast::channel(capacity)` requires power-of-two capacity and drops oldest messages when the buffer is full. This is appropriate for cache invalidation events but not for durability-required work items.

### Panic Handling in Spawned Tasks
A panic in `tokio::spawn`-ed task does not propagate to the spawner. The `JoinHandle` returns `Err(JoinError)` where `join_error.is_panic()` returns true. If you do not `.await` the handle, the panic is silently swallowed (a warning is logged but execution continues). Always `.await` `JoinHandle`s or use `set.join_next().await` with `JoinSet`. For critical background tasks, install a panic hook that triggers graceful shutdown:
```rust
std::panic::set_hook(Box::new(|info| {
    tracing::error!("task panicked: {info}");
    // trigger shutdown_token.cancel() here
}));
```

### Connection Pool Exhaustion Under Load
When using `JoinSet` or `buffer_unordered` to make database or HTTP calls, unbounded fan-out exhausts connection pools. Symptom: first requests succeed, then requests begin timing out waiting for a connection. Fix:
- Use `Semaphore` to cap concurrency:
  ```rust
  let sem = Arc::new(Semaphore::new(20)); // max 20 concurrent DB calls
  let mut set = JoinSet::new();
  for item in items {
      let permit = sem.clone().acquire_owned().await.unwrap();
      set.spawn(async move {
          let _permit = permit; // dropped when task completes
          db.query(item).await
      });
  }
  ```
- Alternatively, `stream.buffer_unordered(20)` naturally limits concurrency to 20.
- Match the semaphore bound to your connection pool `max_connections` setting minus overhead for health checks and migrations.

---

## Example

**Input:** "I have a Rust web service using Axum. I need to handle HTTP requests that fan out to 3 downstream services (user-service, inventory-service, pricing-service), all called concurrently. Sometimes the calls are slow, so I need timeouts. I also have a CPU-intensive pricing calculation that must run after fetching prices. How do I structure this?"

**Output:**

### Async Pattern Recommendation

#### Use Case Classification
I/O Concurrency (concurrent fan-out to 3 services) + CPU Offload (pricing calculation)

#### Runtime Decision
| Factor | Assessment | Decision |
|--------|------------|----------|
| Ecosystem fit | Axum requires Tokio | Tokio (`rt-multi-thread`) |
| Concurrency model | HTTP handlers run on multiple threads | `multi_thread` flavor (Axum default) |
| `Send` requirement | All futures cross thread boundaries in Axum | All futures must be `Send` |
| Library or binary | Binary service | Embed runtime via `#[tokio::main]` |

#### Spawning Strategy
| Scenario | Primitive | Reason |
|----------|-----------|--------|
| 3 independent downstream calls | `try_join!` with `timeout` | Concurrent, fails fast on any error, bounded latency |
| CPU-intensive pricing calc | `spawn_blocking` | Prevents blocking executor workers |
| Axum handler structure | Plain `async fn` | Axum manages its own spawning per request |

#### Implementation

##### Core Pattern

```rust
use axum::{extract::State, Json};
use std::{sync::Arc, time::Duration};
use tokio::time::timeout;

#[derive(Clone)]
struct AppState {
    http: reqwest::Client,
    user_service_url: String,
    inventory_service_url: String,
    pricing_service_url: String,
}

#[derive(serde::Serialize)]
struct ProductResponse {
    user: UserData,
    inventory: InventoryData,
    final_price: f64,
}

// Each downstream call is a plain async fn with an explicit timeout.
// The timeout wrapper makes cancellation behavior explicit and visible.
async fn fetch_user(
    client: &reqwest::Client,
    url: &str,
    user_id: u64,
) -> Result<UserData, ServiceError> {
    timeout(
        Duration::from_secs(5),
        client
            .get(format!("{url}/users/{user_id}"))
            .send()
            .await
            .map_err(ServiceError::Http)?
            .json::<UserData>()
            .await
            .map_err(ServiceError::Deserialize)?,
    )
    .await
    .map_err(|_| ServiceError::Timeout("user-service"))?
}

async fn fetch_inventory(
    client: &reqwest::Client,
    url: &str,
    product_id: u64,
) -> Result<InventoryData, ServiceError> {
    timeout(
        Duration::from_secs(5),
        async {
            client
                .get(format!("{url}/inventory/{product_id}"))
                .send()
                .await
                .map_err(ServiceError::Http)?
                .json::<InventoryData>()
                .await
                .map_err(ServiceError::Deserialize)
        },
    )
    .await
    .map_err(|_| ServiceError::Timeout("inventory-service"))?
}

async fn fetch_pricing(
    client: &reqwest::Client,
    url: &str,
    product_id: u64,
) -> Result<PricingData, ServiceError> {
    timeout(
        Duration::from_secs(5),
        async {
            client
                .get(format!("{url}/pricing/{product_id}"))
                .send()
                .await
                .map_err(ServiceError::Http)?
                .json::<PricingData>()
                .await
                .map_err(ServiceError::Deserialize)
        },
    )
    .await
    .map_err(|_| ServiceError::Timeout("pricing-service"))?
}

// The Axum handler: fan out all 3 calls concurrently with try_join!,
// then offload CPU work to the blocking pool.
pub async fn get_product(
    State(state): State<Arc<AppState>>,
    axum::extract::Path((user_id, product_id)): axum::extract::Path<(u64, u64)>,
) -> Result<Json<ProductResponse>, AppError> {
    // try_join! fires all three futures simultaneously.
    // If any fails, the other two are dropped (cancelled) immediately.
    // Total latency = max(user_latency, inventory_latency, pricing_latency)
    // rather than the sum. Typical improvement: 2x-3x over sequential awaits.
    let (user, inventory, pricing) = tokio::try_join!(
        fetch_user(&state.http, &state.user_service_url, user_id),
        fetch_inventory(&state.http, &state.inventory_service_url, product_id),
        fetch_pricing(&state.http, &state.pricing_service_url, product_id),
    )
    .map_err(AppError::from)?;

    // CPU-intensive pricing calculation -- must NOT run on the async executor.
    // bcrypt, complex discount rules, tax matrix lookups: anything >~1ms of CPU.
    // spawn_blocking moves this to the blocking thread pool (separate from async workers).
    let final_price = tokio::task::spawn_blocking(move || {
        calculate_final_price(pricing, &inventory)
        // This closure may take 5-20ms of CPU without any yield points.
        // On the blocking pool, this is fine. On the async executor, it would
        // stall other requests sharing that worker thread.
    })
    .await
    // First ? unwraps JoinError (panic in blocking task)
    // Second ? propagates the inner Result from calculate_final_price
    .map_err(|e| AppError::Internal(format!("blocking task panicked: {e}")))??;

    Ok(Json(ProductResponse {
        user,
        inventory,
        final_price,
    }))
}

// CPU-bound function -- no async, runs on blocking thread pool
fn calculate_final_price(pricing: PricingData, inventory: &InventoryData) -> Result<f64, AppError> {
    // Expensive computation: tax rules, discount matrix, availability premium
    let base = pricing.base_price;
    let availability_factor = if inventory.quantity < 10 { 1.15 } else { 1.0 };
    let tax = apply_tax_matrix(base, &pricing.tax_region)?;
    Ok((base * availability_factor) + tax)
}
```

##### Shutdown Handling

```rust
use tokio_util::sync::CancellationToken;

#[tokio::main]
async fn main() {
    let shutdown_token = CancellationToken::new();
    let token_for_signal = shutdown_token.clone();

    // Listen for SIGTERM / Ctrl-C and cancel the token
    tokio::spawn(async move {
        tokio::signal::ctrl_c().await.expect("failed to install Ctrl-C handler");
        tracing::info!("shutdown signal received");
        token_for_signal.cancel();
    });

    let app = build_router(state);

    // Axum's graceful shutdown integration
    axum::Server::bind(&"0.0.0.0:8080".parse().unwrap())
        .serve(app.into_make_service())
        .with_graceful_shutdown(async move {
            shutdown_token.cancelled().await;
        })
        .await
        .unwrap();
}
```

##### Testing Strategy

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time;

    // Test that timeout behavior triggers correctly without real network delay.
    // time::pause() freezes Tokio's clock; time::advance() moves it forward.
    #[tokio::test]
    async fn test_fetch_user_timeout() {
        time::pause();

        // Simulate a server that never responds
        let client = reqwest::Client::new();
        let task = tokio::spawn(fetch_user(&client, "http://192.0.2.0", 1));

        // Advance time past the 5-second timeout threshold
        time::advance(Duration::from_secs(6)).await;

        let result = task.await.unwrap();
        assert!(matches!(result, Err(ServiceError::Timeout("user-service"))));
    }

    // Test that try_join! cancels remaining futures when one fails.
    // This test verifies your error propagation without real HTTP calls.
    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn test_fan_out_fails_fast() {
        let results: Vec<Result<i32, &str>> = vec![Ok(1), Err("service down"), Ok(3)];
        let futures: Vec<_> = results
            .into_iter()
            .map(|r| async move { r })
            .collect();

        let result = tokio::try_join!(futures[0], futures[1], futures[2]);
        // try_join! returns the first Err immediately
        assert_eq!(result, Err("service down"));
    }
}
```

#### Trade-offs and Risks

- **`try_join!` cancels slow calls on first failure**: If `user-service` fails after 1ms but `pricing-service` was mid-request at 4s, that 4s call is cancelled. This is usually correct but means partial work is silently discarded. If downstream services charge per request (metered APIs), you may want to let all calls complete and collect errors instead -- use `join_all` from `futures` crate and collect `Result`s.
- **`spawn_blocking` thread pool exhaustion**: The default maximum is 512 blocking threads. If `calculate_final_price` takes 50ms and you receive 600 concurrent requests, all 512 blocking threads are occupied and new `spawn_blocking` calls queue. Size the pool with `Builder::max_blocking_threads` to match your expected CPU parallelism, not request concurrency.
- **`reqwest::Client` must be cloned, not shared by reference**: `reqwest::Client` is internally `Arc`-wrapped and cheap to clone. The `State(state): State<Arc<AppState>>` pattern correctly shares the client across handlers.
- **Timeout nesting**: The outer handler could itself have a deadline (from an API gateway). If an upstream caller enforces a 10-second total deadline, your 5-second per-service timeouts provide no protection against a slow combination of calls. Consider adding an outer `timeout` wrapping the entire `try_join!` block at the handler level (e.g., 8 seconds total), giving you 2 seconds of buffer for overhead.
