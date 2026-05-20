---
name: java-concurrency-patterns
description: |
  Guides expert-level Java concurrency: virtual threads decision tree, CompletableFuture composition, ExecutorService selection, reactive patterns with Reactor, and structured concurrency.
  Use when the user asks about Java concurrency, virtual threads, CompletableFuture, ExecutorService, Project Loom, Reactor, structured concurrency.
  Do NOT use when the user asks about Java modern idioms (use `java-modern-idioms`), Java performance (use `java-performance`), Java Spring (use `java-spring-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "java backend optimization"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Java Concurrency Patterns

## When to Use

**Use this skill when:**
- The user is choosing between platform threads, virtual threads (Project Loom), CompletableFuture chains, or reactive streams (Project Reactor) for a new feature
- The user is implementing an ExecutorService and needs to choose between fixed, cached, work-stealing, or virtual-thread-backed pools
- The user is designing a pipeline that coordinates multiple async operations -- fan-out, fan-in, scatter-gather, or sequential chains
- The user asks about structured concurrency APIs (StructuredTaskScope in JDK 21+) for task lifetime management
- The user is debugging liveness issues -- deadlock, livelock, thread starvation, or pinning of virtual threads on synchronized blocks
- The user needs to compose CompletableFuture stages with error handling, timeouts, or fallback logic
- The user is deciding whether to adopt Project Reactor (Mono/Flux) vs. async callbacks vs. blocking-with-virtual-threads
- The user needs concurrent data structure selection -- ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue variants, Disruptor

**Do NOT use this skill when:**
- The user asks about Java records, sealed classes, pattern matching, or text blocks -- use `java-modern-idioms`
- The user is profiling JVM memory, GC tuning, JIT compilation, or measuring throughput with JMH -- use `java-performance`
- The user is wiring Spring beans, configuring Spring WebFlux, or using Spring's @Async and TaskExecutor -- use `java-spring-patterns`
- The user's question is about Kotlin coroutines or Scala futures -- this skill covers Java only
- The user wants distributed concurrency (Akka cluster, distributed locks via Redis/Zookeeper) -- those are architectural patterns beyond JVM thread management

---

## Process

### Step 1 -- Classify the Workload Type

Before selecting any API, determine what the code actually does during concurrency.

- **I/O-bound blocking work** (JDBC, REST calls, file I/O, gRPC): thread-per-request cost is dominated by blocking wait time; virtual threads are the natural fit because they park cheaply and resume without OS thread consumption
- **CPU-bound parallel computation** (matrix math, cryptography, image processing, compression): parallelism is limited by core count; use ForkJoinPool with work-stealing, or parallel streams with a custom pool to avoid contaminating the common pool
- **Event-driven streaming** (Kafka consumer pipelines, WebSocket message processing, SSE): reactive Flux/Mono or virtual threads with a structured scope; choose reactive when backpressure is a first-class concern
- **Mixed I/O + CPU** (fetch data, transform it, store result): split the pipeline -- use virtual threads for I/O legs and submit CPU legs to a bounded ForkJoinPool
- **Short-lived fire-and-forget tasks** (metrics emission, async notifications): CompletableFuture.runAsync() with a virtual-thread executor or a cached pool; avoid creating new Thread() directly
- Confirm the classification by answering: "Does this task spend more wall-clock time waiting for external resources than computing?" If yes → I/O-bound path. If no → CPU-bound path.

---

### Step 2 -- Apply the Virtual Thread Decision Tree

Virtual threads (JDK 21 GA) change the cost model for thread-per-request servers fundamentally.

- **Use virtual threads when:**
  - Each request issues 1+ blocking I/O calls (JDBC, HTTP client, file)
  - You want to write synchronous-looking code without callback hell
  - You are running JDK 21+ and the library used (JDBC driver, HTTP client) does not hold a synchronized lock during blocking (check for pinning)
  - Thread count per second exceeds ~5,000 -- platform threads have ~1 MB stack by default; virtual threads have a few KB starting stack

- **Do NOT use virtual threads when:**
  - The work is CPU-intensive -- virtual threads are not faster for pure CPU; they just reduce memory overhead during blocking
  - You are calling code that holds a `synchronized` lock while blocking (e.g., legacy JDBC drivers pre-21.x, some SSL implementations) -- this pins the carrier thread; use ReentrantLock instead
  - The framework is already reactive (Reactor, RxJava) -- mixing blocking virtual thread calls into a reactive pipeline blocks the scheduler thread

- **Create a virtual-thread executor:**
  ```java
  ExecutorService vte = Executors.newVirtualThreadPerTaskExecutor();
  ```
  This creates one virtual thread per submitted task -- appropriate for I/O-bound work where tasks spend most of their time parked.

- **Detect pinning** with JVM flag `-Djdk.tracePinnedThreads=full` -- log output identifies synchronized blocks that hold a carrier thread during a blocking park.

---

### Step 3 -- Select the Right ExecutorService

ExecutorService selection is a load-bearing decision -- wrong choice leads to starvation, unbounded queuing, or resource exhaustion.

- **`Executors.newVirtualThreadPerTaskExecutor()`** -- JDK 21+; best for blocking I/O tasks; do not submit CPU-intensive tasks here as it can create millions of threads contending on cores
- **`Executors.newFixedThreadPool(n)`** -- predictable thread count; pair with a bounded `LinkedBlockingQueue` rather than the default unbounded one to add backpressure; set n to available processors × 2 for mixed I/O (rule of thumb; profile to tune)
- **`ForkJoinPool.commonPool()`** -- shared JVM pool; DO NOT use for blocking work; safe for CPU-parallel operations like parallel streams and recursive divide-and-conquer; default parallelism = `Runtime.getRuntime().availableProcessors() - 1`
- **`new ForkJoinPool(n)`** -- private ForkJoinPool; use this when submitting CPU work from a request path to avoid starving the common pool; shut it down explicitly after use
- **`Executors.newCachedThreadPool()`** -- creates platform threads on demand; appropriate only for very short-lived tasks (<100ms); under sustained load it creates unbounded threads -- avoid in production servers
- **`Executors.newScheduledThreadPool(n)`** -- for recurring tasks or delayed one-shots; n=1 for serial scheduling, n>1 for concurrent periodic tasks; prefer `ScheduledExecutorService` over `Timer` (Timer silently swallows exceptions)
- **`Executors.newSingleThreadExecutor()`** -- serializes all tasks; use for ordered event processing or actor-style patterns; wraps a platform thread, not virtual

Set thread names using `Thread.ofVirtual().name("io-worker-", 0).factory()` or `Executors.defaultThreadFactory()` wrappers -- unnamed threads make profiling and thread dumps unreadable.

---

### Step 4 -- Design CompletableFuture Chains Correctly

CompletableFuture is powerful but has sharp edges around executors, exception handling, and completion ordering.

- **Always supply an explicit executor** to async methods; `thenApplyAsync(fn)` without an executor uses `ForkJoinPool.commonPool()`, which can be starved by blocking work
  ```java
  CompletableFuture.supplyAsync(() -> fetchUser(id), ioExecutor)
      .thenApplyAsync(user -> enrich(user), cpuExecutor)
      .thenAcceptAsync(result -> store(result), ioExecutor);
  ```
- **Handle exceptions with `exceptionally` or `handle`** -- `thenApply` on a failed stage skips execution but does NOT reset the failure; use `handle(BiFunction<T, Throwable, R>)` to branch on both success and failure
- **Fan-out with `allOf` and `anyOf`:**
  - `CompletableFuture.allOf(f1, f2, f3).thenRun(...)` waits for all; results must be extracted individually from each future after joining
  - `CompletableFuture.anyOf(f1, f2, f3)` resolves on first completion -- use for speculative execution (hedged requests)
  - Collect results from allOf with a stream join:
    ```java
    List<CompletableFuture<T>> futures = ...;
    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
        .thenApply(_ -> futures.stream().map(CompletableFuture::join).toList());
    ```
- **Timeouts:** Use `orTimeout(5, TimeUnit.SECONDS)` (JDK 9+) to fail a stage after a duration, or `completeOnTimeout(fallback, 5, SECONDS)` to supply a default. Never call `get()` without a timeout in production code.
- **Avoid `join()` on the calling thread inside a stage** -- this blocks a pool thread and can deadlock if the pool is fixed-size
- **Do not chain more than ~10 stages** before the pipeline becomes unreadable; break into named methods or consider structured concurrency for fan-in patterns

---

### Step 5 -- Apply Structured Concurrency (JDK 21+)

Structured concurrency (in preview through JDK 23, targeting stable in JDK 25) enforces that subtask lifetimes are bounded by their parent's scope.

- Use `StructuredTaskScope` when you need to fan out to multiple subtasks and collect results with defined cancellation semantics
- **ShutdownOnFailure policy** -- first task failure cancels remaining tasks and the exception is re-thrown at `scope.join()`:
  ```java
  try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
      Subtask<User> user = scope.fork(() -> fetchUser(userId));
      Subtask<Account> account = scope.fork(() -> fetchAccount(userId));
      scope.join().throwIfFailed();
      return new UserAccount(user.get(), account.get());
  }
  ```
- **ShutdownOnSuccess policy** -- returns the first successful result, cancels others; useful for speculative duplicate requests to redundant services
- Scopes are `AutoCloseable`; always use try-with-resources -- the close() method blocks until all forked tasks complete, guaranteeing no orphaned threads escape the scope
- Nesting scopes is legal and encouraged -- a subtask can open its own inner scope, creating a tree of lifetime-bounded tasks
- Do not use StructuredTaskScope from inside a reactive operator chain -- the blocking join is incompatible with non-blocking scheduler threads

---

### Step 6 -- Integrate Reactive Patterns with Project Reactor

Reactor (Mono/Flux) is the right choice when backpressure, lazy evaluation, and operator composition are all needed simultaneously.

- **Mono<T>** represents 0 or 1 async result; **Flux<T>** represents 0 to N results with backpressure
- Choose Reactor over CompletableFuture when: you have streaming data sources (Kafka, WebSocket, paginated APIs), when downstream consumers may process slower than upstream (backpressure), or when you are already in a reactive stack (Spring WebFlux)
- **Avoid blocking inside Reactor operators** -- `Flux.map()`, `flatMap()`, and `filter()` run on scheduler threads; calling JDBC or `Thread.sleep()` inside them blocks those threads:
  - Wrap blocking calls with `Mono.fromCallable(() -> blockingCall()).subscribeOn(Schedulers.boundedElastic())`
  - `Schedulers.boundedElastic()` is a thread pool capped at `10 × CPU cores` by default with an unbounded task queue (configurable) -- designed specifically for wrapping legacy blocking I/O in reactive pipelines
- **Key operators to know:**
  - `flatMap` -- async fan-out, concurrency controlled by `maxConcurrency` parameter (default 256)
  - `flatMapSequential` -- same as flatMap but preserves ordering
  - `concatMap` -- sequential, one-at-a-time; no concurrency; back-pressures naturally
  - `zipWith` / `zip` -- combines two publishers element-by-element (like allOf for streams)
  - `timeout(Duration)` -- terminates with TimeoutException after duration per element
  - `retryWhen(Retry.backoff(3, Duration.ofMillis(100)))` -- exponential backoff retry
- **Context propagation** -- thread-local variables (MDC logging, SecurityContext) do not survive thread hops in reactive pipelines; use `contextWrite(Context.of(...))` and `Mono.deferContextual()` to thread context through the operator chain
- **Testing Reactor code** -- use `StepVerifier` from `reactor-test`:
  ```java
  StepVerifier.create(myFlux)
      .expectNext("a", "b")
      .expectComplete()
      .verify(Duration.ofSeconds(5));
  ```

---

### Step 7 -- Handle Synchronization and Shared State

Reducing shared mutable state is the goal; when unavoidable, choose the right synchronization mechanism.

- **Prefer `java.util.concurrent` data structures** over manual synchronized blocks:
  - `ConcurrentHashMap` -- compute(), merge(), computeIfAbsent() are atomic; never use get + put as a pair without these atomic methods
  - `CopyOnWriteArrayList` -- zero-cost reads, expensive writes; only use for read-heavy, write-rare lists (e.g., listener registries)
  - `ArrayBlockingQueue` / `LinkedBlockingQueue` -- bounded vs. unbounded; always prefer bounded to create backpressure; set capacity to something meaningful (e.g., 1000 items, not `Integer.MAX_VALUE`)
  - `LinkedTransferQueue` -- higher throughput than LinkedBlockingQueue for producer-consumer when producers can block waiting for a consumer
- **Lock selection:**
  - `synchronized` -- simplest; JVM-optimized with biased locking; but pins virtual threads if blocking occurs inside -- replace with `ReentrantLock` when using virtual threads
  - `ReentrantLock` -- explicit try/finally unlock; supports `tryLock(timeout)` to avoid indefinite blocking; supports fairness (usually leave unfair for throughput)
  - `StampedLock` -- optimistic read path: try `tryOptimisticRead()`, validate stamp, fall back to read lock if stamp invalidated; 20-40% faster than ReentrantReadWriteLock for read-heavy workloads
  - `ReadWriteLock` (ReentrantReadWriteLock) -- multiple concurrent readers, exclusive writer; useful for caches with rare invalidation
- **Atomic variables** for single-variable coordination:
  - `AtomicLong`, `AtomicInteger`, `AtomicReference` -- lock-free CAS operations; use for counters, flags, and single-reference swaps
  - `LongAdder` -- higher throughput than AtomicLong under high contention by striping counters; use for metrics/counters where exact intermediate values are not needed
- **`volatile`** -- guarantees visibility across threads but NOT atomicity of compound operations (read-modify-write still requires CAS or lock); use for single-flag signals (stop requested, initialized)

---

### Step 8 -- Test, Monitor, and Tune

Concurrent code that works in development often fails under production load patterns.

- **Deterministic testing with virtual time:** For Reactor, use `VirtualTimeScheduler` to advance time without real sleep:
  ```java
  StepVerifier.withVirtualTime(() -> Mono.delay(Duration.ofHours(1)))
      .thenAwait(Duration.ofHours(1))
      .expectNextCount(1)
      .verifyComplete();
  ```
- **Stress testing** with `jcstress` (JDK Concurrency Stress tests) -- runs a test class under various CPU interleavings to find atomicity violations; define `@Actor` methods and `@Arbiter` to observe final state
- **Thread dump analysis:** `jstack <pid>` or JDK Flight Recorder; look for threads in BLOCKED state (platform thread waiting for a monitor) vs. WAITING (parked); clusters of BLOCKED threads indicate lock contention
- **JDK Flight Recorder (JFR)** -- zero-overhead profiling in production; enable with `-XX:StartFlightRecording`; look for `jdk.VirtualThreadPinned` events to catch virtual thread pinning
- **Metrics to instrument:** queue depth on bounded executors (>80% full = saturation), active thread count, task rejection rate, p99 task wait time
- **Reject handler policy** for ThreadPoolExecutor:
  - `AbortPolicy` (default) -- throws RejectedExecutionException; good for fail-fast
  - `CallerRunsPolicy` -- runs task on the submitting thread; provides natural backpressure but can slow the caller
  - `DiscardPolicy` -- silently drops; almost never correct in production
  - Custom policy with metric emission before delegating to AbortPolicy is the production best practice
- **Cancellation:** Virtual threads respond to `Thread.interrupt()`; structured scopes propagate cancellation; CompletableFuture.cancel() sets the future as cancelled but does NOT interrupt the underlying thread unless you implement a custom CompletableFuture subclass

---

## Output Format

When responding to a concurrency design question, structure the response as follows:

```
## Workload Classification
- Type: [I/O-bound | CPU-bound | Mixed | Streaming]
- Reasoning: [Why this classification based on the described work]

## Recommended Approach
- Primary API: [Virtual Threads | CompletableFuture | StructuredTaskScope | Reactor Flux/Mono]
- ExecutorService: [Specific pool type and configuration]
- JDK Minimum: [version required]

## Decision Rationale

| Factor                | Option Considered       | Chosen                 | Reason                              |
|-----------------------|-------------------------|------------------------|-------------------------------------|
| Thread model          | Platform threads        | Virtual threads        | I/O blocking, >1K concurrent tasks  |
| Async API             | CompletableFuture       | StructuredTaskScope    | Need structured cancellation        |
| Shared state          | synchronized            | ReentrantLock          | Must not pin virtual threads        |

## Implementation

### Core Setup
[Complete, compilable Java code with all imports and comments]

### Error Handling Strategy
[Code showing exception propagation and recovery]

### Timeout and Cancellation
[Code showing timeout configuration and cancellation propagation]

## Operational Concerns
- Thread pool sizing rationale: [specific numbers with reasoning]
- Pinning risks: [list synchronized blocks or libraries that may pin]
- Monitoring: [JVM flags, metrics, JFR events to enable]
- Testing approach: [specific test library and strategy]

## Trade-offs and Risks
- [Specific trade-off 1 with mitigation]
- [Specific trade-off 2 with mitigation]
```

---

## Rules

1. **Never use `Executors.newCachedThreadPool()` for sustained server-side workloads** -- it creates unbounded platform threads under load and will exhaust OS thread limits (~32K on Linux by default). Use a bounded pool or virtual threads.

2. **Never call blocking I/O inside `ForkJoinPool.commonPool()` tasks** -- this starves parallel stream operations and recursive fork-join tasks across the entire JVM. Submit blocking work to a dedicated executor.

3. **Always use `ReentrantLock` instead of `synchronized` inside virtual thread code** -- `synchronized` blocks pin the virtual thread's carrier platform thread for the duration of the lock hold, reducing the throughput benefit of virtual threads to zero under contention.

4. **Never call `CompletableFuture.get()` without a timeout in production code** -- a hung upstream service creates a thread that waits forever; use `get(5, TimeUnit.SECONDS)` or `orTimeout()`.

5. **Always size bounded queues explicitly** -- `new LinkedBlockingQueue<>()` creates an unbounded queue by default (`Integer.MAX_VALUE` capacity), which allows task buildup to exhaust heap before triggering backpressure; always pass a capacity argument.

6. **Never mix blocking calls directly into Reactor operator chains** -- blocking inside `map()`, `flatMap()`, or `filter()` on a non-elastic scheduler blocks the scheduler's event loop thread; always wrap with `subscribeOn(Schedulers.boundedElastic())`.

7. **Never use `Thread.sleep()` in tests to wait for async completion** -- this creates flaky tests; use `CountDownLatch`, `CompletableFuture.get()` with a timeout, or `StepVerifier` with `verify(Duration)` instead.

8. **Always close ExecutorService instances explicitly** -- use `try-with-resources` (JDK 19+ `ExecutorService implements AutoCloseable`) or call `shutdown()` then `awaitTermination(30, SECONDS)` in a finally block; leaked executors survive application restart and accumulate threads.

9. **Never propagate `ThreadLocal` state across virtual threads or Reactor pipelines without explicit transfer** -- `ThreadLocal` is scoped to a thread; when the task moves to another virtual thread or operator thread, the value is lost. Use `ScopedValue` (JDK 21 preview, stable in JDK 23) or Reactor's `Context` API.

10. **Always test cancellation and interruption explicitly, not just the happy path** -- concurrent code must handle `InterruptedException` by either re-interrupting the thread (`Thread.currentThread().interrupt()`) or propagating it; swallowing it silently causes threads to ignore shutdown signals.

---

## Edge Cases

### Legacy Codebase with Synchronized JDBC Driver

Older JDBC drivers (pre-PostgreSQL 42.6, MySQL Connector/J pre-8.0.33) hold `synchronized` locks during socket reads, pinning the virtual thread's carrier. Detection: run with `-Djdk.tracePinnedThreads=full`; if the driver appears in pinning logs, options are: upgrade the driver, wrap the JDBC calls in a dedicated platform-thread pool (`Executors.newFixedThreadPool(n)` where n = connection pool size), or set `-Djdk.virtualThreadScheduler.maxPoolSize` to accommodate pinning. Do not blindly migrate all platform thread pools to virtual threads until pinning is confirmed absent.

### CompletableFuture Fan-out with Partial Failures

When using `allOf()` to fan out to N services and one fails, the default behavior completes the allOf stage exceptionally with the first failure -- other in-flight futures are NOT cancelled. Under high load this creates resource leaks (dangling HTTP connections, open cursors). Mitigation: after a failure is detected in the `handle()` callback, call `future.cancel(true)` on all remaining futures explicitly, or switch to `StructuredTaskScope.ShutdownOnFailure` which handles this automatically. Track all futures in a list before combining with allOf.

### Virtual Thread Pinning in Third-Party Libraries

Libraries using native synchronized blocks for thread safety (legacy XML parsers like Xerces, some crypto providers, old Hibernate session management) will pin when called from virtual threads. Strategy: profile first with JFR's `jdk.VirtualThreadPinned` event; if pinning is confirmed and the library cannot be replaced, create a dedicated fixed-size platform thread pool to isolate those calls, submit work there, and return a CompletableFuture to the virtual thread context. This isolates pinning to a known, bounded resource.

### Reactor Context Propagation Across Thread Boundaries (MDC/Security)

When using Spring Security or SLF4J MDC inside a Reactor pipeline, `SecurityContextHolder` (which uses ThreadLocal by default) is cleared on every thread hop. In reactive code, MDC values set with `MDC.put()` disappear after the first `subscribeOn()`. Solution: configure Spring Security's `ReactorContextWebFilter`, which stores the SecurityContext in Reactor Context; access it via `.contextWrite()` and `.deferContextual()`. For MDC specifically, use the `reactor-extra` library's `MDCContext` or instrument `Hooks.onEachOperator()` to restore MDC from Reactor context on each operator invocation.

### Structured Concurrency with External Timeouts

`StructuredTaskScope` does not itself implement a global timeout -- it waits indefinitely for all forked tasks unless interrupted. To add a timeout: call `scope.joinUntil(Instant.now().plusSeconds(5))` instead of `scope.join()`. This throws `TimeoutException` if tasks have not completed; forked tasks that are still running are cancelled via interruption. Always wrap `scope.join()` call sites with both `InterruptedException` and `TimeoutException` handlers.

### Thread Pool Sizing Under Variable Load (Adaptive Sizing)

Static thread pool sizes fail under bimodal load (low at night, high during business hours). For CPU-bound pools: size to `availableProcessors()` -- do not override this dynamically. For I/O-bound platform thread pools: use `ThreadPoolExecutor` directly (not the Executors factory) so you can call `setCorePoolSize()` and `setMaximumPoolSize()` at runtime based on observed queue depth metrics. If using virtual threads, this problem largely disappears for I/O work -- the JVM scheduler handles carrier thread allocation automatically.

### Deadlock Between CompletableFuture Stages on Fixed-Size Pool

A subtle deadlock occurs when all threads in a fixed pool are occupied by `thenApply/thenCompose` stages that are themselves waiting on inner `supplyAsync` calls submitted to the same pool. If pool size is 4 and all 4 threads are blocked waiting for 4 more tasks that can never start because the pool is full -- deadlock. Solution: either use separate pools for different pipeline stages, use `thenApplyAsync` with a different executor for inner work, or switch to virtual threads which do not have this constraint because each task gets its own thread.

### Race Condition in `computeIfAbsent` with Complex Lambdas

`ConcurrentHashMap.computeIfAbsent()` is atomic and prevents duplicate insertion -- but the lambda passed to it must not be long-running or itself blocking, because the map segment is locked while the lambda executes. If the lambda calls an external service, the map is locked for that duration, serializing all access to that hash bucket. Solution: use a two-phase pattern -- check the map without locking (`map.get(key)`), perform the expensive computation externally, then `putIfAbsent()` to install the result (accepting that rarely two threads may compute the same value). For cache-style use, `Caffeine` cache handles this correctly with async loading.

---

## Example

**Input:** "I'm building a Java 21 service that handles incoming HTTP requests. Each request needs to: (1) fetch a user record from PostgreSQL, (2) call two external REST APIs in parallel, (3) merge the results and write an audit log to a second database. What concurrency approach should I use?"

---

**Output:**

## Workload Classification
- Type: I/O-bound with fan-out and fan-in
- Reasoning: All three sub-tasks (PostgreSQL fetch, two REST calls, audit write) are network/disk I/O. There is no CPU-intensive transformation. The two REST calls are independent and can run concurrently. Total request latency is dominated by the longest I/O operation in each phase.

## Recommended Approach
- Primary API: StructuredTaskScope (JDK 21) for the parallel REST phase; virtual threads throughout
- ExecutorService: `Executors.newVirtualThreadPerTaskExecutor()` at the HTTP server level
- JDK Minimum: JDK 21 (StructuredTaskScope is in preview; enable with `--enable-preview`)

## Decision Rationale

| Factor                  | Option Considered           | Chosen                          | Reason                                                     |
|-------------------------|-----------------------------|---------------------------------|------------------------------------------------------------|
| Thread model            | Platform threads            | Virtual threads                 | All work is I/O-bound; virtual threads park during blocking with ~1KB overhead vs ~1MB per platform thread |
| Parallel REST calls     | CompletableFuture allOf     | StructuredTaskScope.ShutdownOnFailure | Structured scope cancels both calls if either fails; no orphaned connections |
| DB access               | Reactive R2DBC              | JDBC with virtual threads       | Team uses existing JPA/Hibernate; simpler code; virtual threads absorb blocking cost |
| Lock primitive          | synchronized                | ReentrantLock                   | synchronized pins carrier threads; ReentrantLock parks the virtual thread instead |

## Implementation

### Executor Setup (Application Bootstrap)

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// Create once at application startup, share across all request handlers.
// newVirtualThreadPerTaskExecutor() creates one virtual thread per submitted task.
// No need to size a pool -- the JVM manages carrier thread count automatically.
ExecutorService requestExecutor = Executors.newVirtualThreadPerTaskExecutor();
```

### Request Handler

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.StructuredTaskScope.ShutdownOnFailure;
import java.util.concurrent.StructuredTaskScope.Subtask;
import java.time.Instant;

public UserAuditResponse handleRequest(long userId, RequestContext ctx) throws Exception {

    // Phase 1: Fetch user record from PostgreSQL.
    // Runs on the virtual thread assigned to this request by the HTTP server.
    // JDBC call blocks the virtual thread, NOT a platform thread -- this is cheap.
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new UserNotFoundException(userId));

    // Phase 2: Fan out to two REST APIs concurrently using StructuredTaskScope.
    // ShutdownOnFailure cancels the other subtask if either one fails.
    // The try-with-resources block guarantees both subtasks complete (or are cancelled)
    // before execution continues past the closing brace.
    ExternalProfileData profile;
    RiskScore riskScore;

    try (var scope = new ShutdownOnFailure()) {
        Subtask<ExternalProfileData> profileTask =
            scope.fork(() -> profileApiClient.fetch(user.externalId()));
        Subtask<RiskScore> riskTask =
            scope.fork(() -> riskApiClient.evaluate(user.id()));

        // Block this virtual thread until both subtasks complete or one fails.
        // joinUntil adds a wall-clock timeout for the entire fan-out phase.
        scope.joinUntil(Instant.now().plusSeconds(10))
             .throwIfFailed(ex -> new UpstreamServiceException("Parallel fetch failed", ex));

        // Both tasks succeeded -- extract results.
        // .get() is safe here because ShutdownOnFailure guarantees success at this point.
        profile = profileTask.get();
        riskScore = riskTask.get();
    }
    // After the try block: both virtual threads for subtasks have finished.
    // No goroutine/thread leak is possible -- the scope enforces this.

    // Phase 3: Merge and audit write.
    // Another blocking JDBC write, again on the request's virtual thread.
    UserAuditResponse response = merger.merge(user, profile, riskScore);
    auditRepository.save(new AuditEntry(userId, response, ctx.requestId()));

    return response;
}
```

### HTTP Server Wiring (Jetty/Undertow example)

```java
// For Jetty 12+: configure a virtual-thread executor on the connector.
// This means every accepted HTTP connection dispatches its handler onto a virtual thread.
Server server = new Server();
QueuedThreadPool pool = new QueuedThreadPool();
pool.setVirtualThreadsExecutor(Executors.newVirtualThreadPerTaskExecutor());
server.addConnector(new ServerConnector(server, pool));

// For a plain ExecutorService-dispatched handler pattern:
ExecutorService serverExecutor = Executors.newVirtualThreadPerTaskExecutor();
httpServer.setExecutor(serverExecutor); // com.sun.net.httpserver.HttpServer
```

### Error Handling Strategy

```java
// UpstreamServiceException is thrown by throwIfFailed() in the scope above.
// Catch it at the controller boundary and map to an HTTP 502.

// For timeouts specifically:
try {
    scope.joinUntil(Instant.now().plusSeconds(10))
         .throwIfFailed(...);
} catch (TimeoutException e) {
    // Both subtasks are automatically cancelled via interruption when the scope closes.
    // Log with request ID for tracing.
    log.warn("Fan-out timed out for userId={} requestId={}", userId, ctx.requestId());
    throw new ServiceTimeoutException("External APIs did not respond within 10s");
} catch (InterruptedException e) {
    Thread.currentThread().interrupt(); // Restore interrupt status -- never swallow this.
    throw new ServiceInterruptedException("Request interrupted");
}
```

### Locking for Shared Mutable State (if needed in the service layer)

```java
import java.util.concurrent.locks.ReentrantLock;

// Use ReentrantLock instead of synchronized so that waiting virtual threads PARK
// rather than pinning their carrier platform threads.
private final ReentrantLock cacheLock = new ReentrantLock();
private volatile UserCache cache; // volatile for single-reference visibility

public UserCache getOrRefreshCache() {
    cacheLock.lock(); // Virtual thread parks here if another thread holds the lock.
    try {
        if (cache == null || cache.isExpired()) {
            cache = loadFreshCache();
        }
        return cache;
    } finally {
        cacheLock.unlock(); // Always in finally -- never skip.
    }
}
```

## Operational Concerns

- **Thread pool sizing rationale:** `newVirtualThreadPerTaskExecutor()` requires no explicit sizing. The JVM defaults to one carrier platform thread per CPU core. If pinning is detected, increase carrier count with `-Djdk.virtualThreadScheduler.maxPoolSize=<2x-cores>` as a temporary workaround while fixing the root pinning cause.
- **Pinning risks:** Verify PostgreSQL JDBC driver version >= 42.6 (first release with virtual thread compatibility). Run with `-Djdk.tracePinnedThreads=full` in staging under load. If Hibernate uses a `synchronized` session cache internally, test explicitly -- some versions pin.
- **Monitoring:** Enable JFR event `jdk.VirtualThreadPinned` in production with low overhead (`threshold=20ms`). Track `active_virtual_threads` gauge via JMX (`java.lang:type=Threading`, `ThreadCount`). Alert if p99 request latency exceeds 10× median -- this indicates starvation, not just load.
- **Testing approach:** Use `WireMock` to stub both REST APIs with configurable delays. Verify that when one API stubs a 15-second delay with `scope.joinUntil(10 seconds)`, the response returns a 504 within 10.5 seconds (allowing 500ms overhead). Use `StepVerifier` if wrapping any Reactor components. Use `assertThatThrownBy()` to verify `UpstreamServiceException` is thrown and contains the cause from the failing subtask.

## Trade-offs and Risks

- **Virtual thread pinning on JDBC under Hibernate:** Hibernate's dirty-checking and lazy loading use `synchronized` internally in some versions. Mitigation: use Hibernate 6.2+ which addressed most pinning sources, and test all entity loading paths with JFR pinning events enabled before deploying to production.
- **StructuredTaskScope is preview API through JDK 23:** Requires `--enable-preview` at compile and runtime; cannot be used in libraries shipped without requiring end-user preview flags. Mitigation: if preview is unacceptable, substitute `CompletableFuture.allOf()` with explicit cancellation on failure using a `whenComplete` handler that calls `cancel(true)` on the remaining future. Accept that this is slightly more verbose and does not guarantee immediate cancellation of in-progress network calls.
- **Audit write latency adds to request tail latency:** Writing the audit log synchronously on the request thread means a slow audit database increases p99 request latency. Mitigation: if audit writes are non-critical for the response, move the `auditRepository.save()` call to a fire-and-forget virtual thread with bounded queue -- `requestExecutor.submit(() -> auditRepository.save(entry))` -- and return the response to the caller without waiting. Accept the trade-off that audit entries may be lost if the JVM crashes between response and write.
