---
name: nodejs-async-patterns
description: |
  Guides expert-level Node.js asynchronous programming: Promise composition, async/await patterns, event loop model, stream processing, worker threads, and AbortController for cancellation.
  Use when the user asks about Node.js async/await, Promise patterns, event loop, streams, worker threads, AbortController, async iterators.
  Do NOT use when the user asks about JavaScript idioms (use `javascript-idioms`), Node.js error handling (use `nodejs-error-handling`), Node.js performance (use `nodejs-performance`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript backend optimization"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Node.js Async Patterns

## When to Use

**Use this skill when the user asks about:**
- `async/await` syntax, patterns, and anti-patterns in Node.js -- including sequential vs. parallel execution, top-level await, and async IIFE patterns
- Promise composition -- `Promise.all`, `Promise.allSettled`, `Promise.race`, `Promise.any`, chaining, and custom combinators
- The Node.js event loop model -- phases (timers, pending callbacks, idle/prepare, poll, check, close), microtask queues, `process.nextTick` vs `queueMicrotask`, and tick starvation
- Node.js Streams -- Readable, Writable, Duplex, Transform streams; backpressure; `pipeline`; stream composition; async iteration over streams
- Worker threads -- `worker_threads` module, `SharedArrayBuffer`, `Atomics`, `MessageChannel`, thread pool sizing
- `AbortController` and `AbortSignal` -- cooperative cancellation, signal propagation, integration with `fetch`, `fs`, and third-party async APIs
- Async iterators and generators -- `Symbol.asyncIterator`, `for await...of`, async generator functions, composing async iterables
- Concurrency coordination -- queues, semaphores, rate limiting, batching, fan-out/fan-in patterns
- `AsyncLocalStorage` and async context propagation

**Do NOT use this skill when the user asks about:**
- General JavaScript language features not specific to Node.js async -- use `javascript-idioms` instead (covers closures, prototypes, destructuring, optional chaining)
- Handling async errors, `unhandledRejection`, domain modules, or structured error propagation patterns -- use `nodejs-error-handling` instead
- CPU profiling, flame graphs, memory leak detection, garbage collection tuning, or benchmarking async code -- use `nodejs-performance` instead
- Frontend browser async patterns (Web Workers, Service Workers, browser fetch) -- this skill covers Node.js server-side only
- Database query patterns, ORM async usage, or connection pool management -- use the relevant database skill
- HTTP server frameworks (Express, Fastify, Koa) async middleware specifics -- use the relevant framework skill

---

## Process

### 1. Classify the Async Problem

Before writing any code, determine which category the user's problem falls into. Misclassifying leads to choosing the wrong primitive entirely.

- **I/O-bound, sequential** -- one async operation depends on the result of a previous one. The correct tool is `async/await` with `await` in sequence. Common mistake: wrapping multiple independent operations in sequential `await` when they could be parallel.
- **I/O-bound, parallel** -- multiple async operations are independent and can proceed simultaneously. Use `Promise.all` for fail-fast behavior or `Promise.allSettled` when partial failure is acceptable.
- **CPU-bound** -- any synchronous computation exceeding ~1ms that would block the event loop. Use `worker_threads`. Do NOT use `child_process.fork` for CPU tasks unless you need process isolation or legacy CommonJS module compatibility.
- **Streaming data** -- data arrives or must be produced incrementally (large file reads, network responses, ETL pipelines). Use Node.js Streams or async generators, NOT buffering everything into memory.
- **Cancellable operations** -- the user needs to abort an in-flight async operation (HTTP request timeout, user-initiated cancel, race between abort and completion). Use `AbortController`/`AbortSignal`.
- **Context propagation** -- you need request-scoped data (request ID, user identity, trace context) to flow through async call chains without threading it through every function argument. Use `AsyncLocalStorage`.
- **Rate-limited or concurrency-capped** -- you have N items to process but can only run K at a time. Use a semaphore pattern or a library like `p-limit` (concurrency cap) or `p-throttle` (time-rate cap).

### 2. Apply the Event Loop Mental Model

Every async pattern decision in Node.js requires understanding the event loop's phase ordering. Get this wrong and you introduce subtle timing bugs.

- The event loop processes phases in this order: **timers** (`setTimeout`/`setInterval` callbacks) → **pending I/O callbacks** (deferred I/O errors) → **idle/prepare** (internal) → **poll** (new I/O events) → **check** (`setImmediate` callbacks) → **close callbacks** (socket close events).
- **Microtask queues** run after every phase completes -- `Promise` resolution callbacks and `queueMicrotask` callbacks run here. `process.nextTick` callbacks run in a separate queue that drains before microtasks.
- Priority ordering (highest to lowest): `process.nextTick` → `Promise` microtasks → `setImmediate` → `setTimeout(fn, 0)`.
- Use `process.nextTick` sparingly -- it can starve the event loop if called recursively. Prefer `queueMicrotask` for Promise-adjacent scheduling.
- Use `setImmediate` to yield control back to the event loop to allow I/O callbacks to fire before your next chunk of synchronous work.
- CPU-bound synchronous work blocking longer than 10ms will cause measurable latency on concurrent requests. The threshold for "acceptable" synchronous blocking is typically ≤1ms on a heavily loaded server.

### 3. Design Promise Composition

Choose the right combinator based on the failure semantics needed.

- **`Promise.all(promises)`** -- runs all concurrently, resolves when all resolve, rejects immediately when any reject (fail-fast). Use for parallel independent operations where you need all results and any failure is fatal.
- **`Promise.allSettled(promises)`** -- runs all concurrently, always resolves with an array of `{status, value}` or `{status, reason}` objects. Use when partial success is acceptable and you need to inspect every outcome.
- **`Promise.race(promises)`** -- resolves or rejects as soon as the first promise settles. Classic use: implementing timeouts by racing a real operation against a `setTimeout`-based rejection.
- **`Promise.any(promises)`** -- resolves as soon as any promise resolves (ignores rejections), rejects with `AggregateError` only if all reject. Use for "first successful response wins" patterns like hedged requests.
- **Sequential with `reduce`** -- when you need to chain an array of async operations sequentially: `array.reduce(async (prev, item) => { await prev; return processItem(item); }, Promise.resolve())`. Use sparingly -- it defeats the benefit of concurrency.
- **Concurrency-capped fan-out** -- when processing N items with max K concurrent operations, chunk with `p-limit` or implement a semaphore using a Promise counter pattern. Rule of thumb: cap concurrent outbound HTTP requests at 10--50 depending on the target server's limits; cap database queries at your connection pool size (typically 5--20).

### 4. Implement `async/await` Correctly

`async/await` is syntactic sugar over Promises, but the sugar introduces its own failure modes.

- **Avoid the sequential trap** -- `await a(); await b();` when `a` and `b` are independent takes `time(a) + time(b)`. Use `const [ra, rb] = await Promise.all([a(), b()]);` to take `max(time(a), time(b))`.
- **Avoid `async` functions inside `forEach`** -- `array.forEach(async (item) => { ... })` does not await the callbacks; the loop exits before any async work completes. Use `for...of` with `await`, or `Promise.all(array.map(async (item) => ...))` for parallel execution.
- **Avoid `new Promise` wrapping an `async` function** -- the `Promise` constructor executor is synchronous and wrapping `async` code inside it hides the inner async errors. Use `async` functions directly.
- **Return vs. `return await`** -- inside a `try/catch`, write `return await promise` not `return promise`. Without `await`, the function returns before the promise settles, so any rejection escapes the `try/catch` block. Outside a `try/catch`, bare `return promise` is fine and saves a microtask tick.
- **Top-level `await`** -- available in ES modules (`.mjs` or `"type": "module"` in `package.json`). Blocks module initialization, which is the intended behavior for connecting to databases before serving requests. Do NOT use it inside shared utility modules that many files import -- it serializes module loading.
- **Async IIFE pattern** -- for CommonJS files that can't use top-level await: `(async () => { ... })().catch(console.error)`. Always attach a `.catch` handler to prevent unhandled rejection.

### 5. Implement Streams and Async Iteration

Streams are the correct answer whenever data size is unbounded or latency-to-first-byte matters more than total throughput.

- **Use `stream.pipeline`** (or its `stream/promises` variant) instead of `.pipe()` for production code. `pipeline` automatically handles error cleanup and stream destruction. `.pipe()` does not propagate errors and leaves streams open on failure.
- **Backpressure** -- Writable streams signal backpressure via the return value of `.write()` returning `false`. When `false`, stop writing and wait for the `drain` event. Failing to respect backpressure causes unbounded memory growth. `pipeline` handles this automatically.
- **Transform stream pattern** -- subclass `Transform` and implement `_transform(chunk, encoding, callback)`. Call `callback(null, transformedData)` to push data downstream. Call `callback(error)` to signal an error. Keep transforms stateless where possible; accumulate state only when absolutely necessary (e.g., decompression, protocol framing).
- **Async iteration over streams** -- `for await (const chunk of readable)` works on any Readable stream in Node.js 12+. This is the idiomatic way to consume streams in modern code. Remember to destroy the stream on early exit: use `break` inside a `try/finally` block with `stream.destroy()` in the `finally` clause.
- **Object mode streams** -- setting `objectMode: true` allows streams to carry arbitrary JavaScript objects, not just `Buffer` and strings. Use for in-process data pipelines. Do NOT use object-mode streams for network I/O -- serialization must happen at the boundary.
- **Readable.from** -- `Readable.from(asyncIterable)` converts any async iterable (including async generator functions) into a Readable stream. This bridges the async generator and stream worlds.
- **highWaterMark tuning** -- default is 16KB for byte streams, 16 objects for object mode. For large file processing, increase to 64KB--1MB. For high-throughput object pipelines, tune based on the average object size and desired latency.

### 6. Implement Cancellation with AbortController

Cancellation is cooperative -- the callee must check for cancellation; the caller signals it.

- **Create a signal**: `const controller = new AbortController(); const { signal } = controller;`. Pass `signal` into cancelable operations. Call `controller.abort()` to cancel.
- **Integrate with native Node.js APIs**: `fs.readFile`, `fs.writeFile`, `http.request` (via `fetch`), `setTimeout` (via `timers/promises`), and `EventEmitter.once` all accept an `{ signal }` option. When the signal fires, they reject with `AbortError` (`error.name === 'AbortError'`).
- **Implement a timeout shorthand**: `AbortSignal.timeout(5000)` (Node.js 17.3+) creates a signal that automatically aborts after 5000ms. Combine multiple signals with `AbortSignal.any([sig1, sig2])` (Node.js 20.3+).
- **Propagate signals through your own async functions**: Accept `signal` as a parameter and check `signal.throwIfAborted()` at each async boundary. Listen for `signal.addEventListener('abort', cleanup)` to release resources (close sockets, cancel timers) when abort fires.
- **Race pattern for timeout**: For older Node.js versions without `AbortSignal.timeout`: `Promise.race([operation(signal), new Promise((_, reject) => setTimeout(() => { controller.abort(); reject(new Error('Timeout')); }, 5000))])`.
- **Distinguish cancellation from errors**: Always check `error.name === 'AbortError'` before treating a rejection as an unexpected error. Cancellation is not an error -- it is a normal control flow outcome. Log it differently and do not trigger alerts.

### 7. Implement Worker Threads

Use worker threads when profiling confirms the event loop is blocked by CPU-bound work, not for I/O.

- **Determine if worker threads are needed** -- profile first. Only introduce workers if a specific computation exceeds ~10ms consistently. Common legitimate uses: image processing, cryptographic operations (beyond what `crypto` offloads natively), JSON parsing of very large payloads (>500KB), or custom compression.
- **Communication pattern** -- use `worker.postMessage(data)` and `worker.on('message', handler)`. For structured data, postMessage uses the structured clone algorithm (no functions, no prototypes beyond built-ins). Transfer ownership of `ArrayBuffer` with the transfer list to avoid copying: `worker.postMessage(buffer, [buffer])`.
- **SharedArrayBuffer + Atomics** -- use for high-frequency data sharing between the main thread and workers (e.g., a shared ring buffer). Requires `--experimental-shared-memory` flag (Node.js <14) or `Cross-Origin-Isolation` headers in some environments. Use `Atomics.wait` for worker synchronization; never use it on the main thread (it blocks).
- **Worker pool pattern** -- maintain a pool of N workers where N ≈ `os.cpus().length - 1` (leave one CPU for the event loop). Implement a task queue in the main thread; dispatch tasks to idle workers. Track in-flight work with a `Map<workerId, {resolve, reject}>`.
- **`workerData` for initialization** -- pass static configuration to the worker at startup via `workerData` in the `Worker` constructor options. This is cloned once at creation; do not pass large mutable state here.
- **Error handling** -- listen for `worker.on('error', handler)` and `worker.on('exit', code => { if (code !== 0) ... })`. A worker that crashes does not crash the main process, but you must detect and replace it.

### 8. Use AsyncLocalStorage for Context Propagation

Request-scoped context should flow through async call chains without manual threading.

- **Create a store per request** -- instantiate `AsyncLocalStorage` once at module level, then call `storage.run({ requestId, userId, traceId }, asyncHandler)` at the beginning of each request. All async operations called within that callback inherit the store automatically.
- **Access context anywhere** -- call `storage.getStore()` inside any async function in the call chain. Returns `undefined` if called outside a `run()` context; always guard with a null check.
- **Performance cost** -- `AsyncLocalStorage` adds ~10--20% overhead to async context switches in high-throughput scenarios (>100k req/s). For most services this is negligible. Benchmark with your actual workload before optimizing.
- **Combining with Promises** -- `AsyncLocalStorage` correctly propagates through `Promise.all`, `async/await`, and `setTimeout`. It does NOT propagate across `worker_threads` message boundaries -- you must manually serialize and deserialize context when crossing thread boundaries.
- **Common use cases** -- distributed tracing (propagate trace ID to all log statements and downstream calls), per-request caching, audit logging, multi-tenant data isolation.

---

## Output Format

When responding to a user's async pattern question, produce output in this structure:

```
## Async Pattern Analysis

### Problem Classification
- **Category:** [I/O-bound sequential | I/O-bound parallel | CPU-bound | Streaming | Cancellable | Context propagation | Rate-limited]
- **Node.js Versions Supported:** [minimum version for the recommended approach]
- **Key Constraint:** [the primary constraint driving the pattern choice]

### Pattern Decision Matrix

| Pattern | Use When | Avoid When | Overhead |
|---------|----------|------------|----------|
| async/await sequential | operations depend on prior results | operations are independent | minimal |
| Promise.all | parallel independent I/O, fail-fast needed | partial failure is acceptable | minimal |
| Promise.allSettled | parallel I/O, partial failure acceptable | all must succeed | minimal |
| Stream pipeline | unbounded data, backpressure needed | data fits in memory, latency irrelevant | low |
| Worker threads | CPU >10ms blocks event loop | I/O-bound work | medium (thread overhead) |
| AbortController | timeout or user-initiated cancel needed | fire-and-forget operations | minimal |
| AsyncLocalStorage | request context propagation | single-request linear code | low (~10-20% async overhead) |
| Concurrency limiter | N items, max K concurrent | single item, no rate limit | minimal |

### Recommended Implementation

[Pattern name and rationale in 2-3 sentences]

**Key decision:** [Why this pattern over the alternatives]

### Code Implementation

```javascript
// [Label the code with what it demonstrates]
// Node.js [version]+ required

[Complete, production-ready code example with error handling]
```

### Pitfalls to Avoid

- [Specific anti-pattern relevant to this solution]
- [Specific anti-pattern relevant to this solution]
- [Specific anti-pattern relevant to this solution]

### Testing Approach

- [How to test this specific pattern]
- [What edge cases to test]
```

---

## Rules

1. **NEVER use `Promise.all` when partial failure is acceptable.** `Promise.all` rejects on the first failure, canceling the wait for all other promises. If some failures are tolerable (e.g., enriching a response from multiple optional data sources), use `Promise.allSettled` and filter the results.

2. **NEVER use `array.forEach` with async callbacks.** `forEach` ignores the returned Promise and exits the loop synchronously before any async work completes. Use `for...of` for sequential execution or `Promise.all(array.map(...))` for parallel execution.

3. **NEVER block the event loop with synchronous work exceeding 1ms in a server context.** JSON parsing of large payloads, synchronous file reads (`fs.readFileSync`), and CPU-intensive crypto operations block ALL concurrent requests. Profile first; offload to worker threads if confirmed.

4. **ALWAYS use `stream.pipeline` from `stream/promises` instead of `.pipe()` in production code.** `.pipe()` does not propagate errors and does not destroy the source stream when the destination errors, causing memory leaks and resource exhaustion.

5. **ALWAYS write `return await promise` inside `try/catch` blocks.** Without `await`, the function returns before the promise settles, and rejections escape the `try/catch`. This is one of the most common and subtle bugs in async/await code.

6. **NEVER check `error.message` to detect `AbortError`.** The message string is not guaranteed. Always check `error.name === 'AbortError'` or `error instanceof DOMException` (in environments where `DOMException` is available). In Node.js 18+, also check `error.code === 'ABORT_ERR'` for Node-native AbortErrors.

7. **ALWAYS cap concurrency when processing arrays of I/O operations.** `Promise.all(largeArray.map(fetchFromDB))` with 10,000 items opens 10,000 simultaneous connections. Use `p-limit` with a concurrency of 5--50 (tuned to your connection pool size and target server limits) or implement a semaphore pattern.

8. **NEVER use `process.nextTick` in application code for control flow.** It was designed for internal Node.js library use. Recursive `nextTick` calls starve the event loop, preventing I/O callbacks from running. Use `setImmediate` or `queueMicrotask` for yielding in application code.

9. **ALWAYS pass `AbortSignal` through your async call stack.** Cancellation must be propagated to every async operation in the chain. Catching an `AbortError` and swallowing it without re-throwing or re-aborting breaks cancellation semantics -- the upstream caller's abort becomes ineffective.

10. **NEVER create Worker threads on a per-request basis.** Thread creation and teardown is expensive (10--100ms). Workers must be pooled. If you find yourself constructing `new Worker(...)` inside a request handler, refactor to use a pre-initialized thread pool.

11. **ALWAYS handle the `drain` event when manually writing to a Writable stream.** If `writable.write(chunk)` returns `false`, stop writing and resume only on `drain`. Ignoring this causes unbounded memory growth as Node.js buffers all the undelivered chunks.

12. **NEVER assume `async/await` adds parallelism.** `await` suspends the current async function at that point -- it does NOT run operations in parallel. Parallelism requires either `Promise.all` or separate invocations that are not awaited sequentially.

---

## Edge Cases

### Legacy Callback-Based Code Integration

When integrating with Node.js core APIs or third-party libraries that use the `(err, result)` callback style, use `util.promisify`. For APIs with non-standard callback signatures (e.g., callbacks with multiple success arguments, or `(result, err)` reversed order), create a manual wrapper with `new Promise`. Never use `util.promisify` on callback APIs that emit multiple values over time (like `EventEmitter`) -- that pattern requires stream or async iterator conversion, not promisification.

For `EventEmitter` patterns, use `events.once(emitter, 'eventName')` to await a single event, or `events.on(emitter, 'eventName')` to create an async iterable over all events. Always set a timeout or hook into the emitter's error event to avoid hanging forever if the expected event never fires.

### Unintended Promise Floating (Fire and Forget)

When you intentionally fire and forget (e.g., logging to an external service asynchronously without blocking the response), you MUST attach an error handler. `asyncOperation().catch(err => logger.error('background task failed', err))`. Without the `.catch`, a rejection becomes an unhandled rejection warning (Node.js 15+ throws by default, crashing the process). Document clearly in code comments that the fire-and-forget is intentional and that the error handler is the safety net.

### Async Generator Cleanup and Early Exit

When consuming an async generator with `for await...of` and breaking early, the generator's `finally` block executes -- but only if the generator object is properly returned. When the `for...of` loop breaks, JavaScript calls `generator.return()`, which triggers cleanup. However, if you convert the generator to an array (`Array.from`) or pass it to `Promise.all`, early exit cleanup does not happen automatically. In these cases, wrap the generator in a `try/finally` and manually call `generator.return()` on early exit.

For async generators wrapped as streams via `Readable.from`, stream destruction (`stream.destroy()`) correctly propagates back and triggers the generator's `finally` block.

### Combining AbortSignal with Promise.all

`Promise.all` is not abort-aware by default. If one operation aborts, `Promise.all` rejects, but the other in-flight operations continue running until they naturally complete or fail. To truly cancel all operations in a `Promise.all` group on first failure or external abort, create a single `AbortController`, pass its signal to all operations, and call `controller.abort()` in a `.catch()` handler on the `Promise.all`. This implements "cancel all on first error" semantics similar to structured concurrency.

```javascript
const controller = new AbortController();
const { signal } = controller;

try {
  await Promise.all(
    operations.map(op => op(signal))
  );
} catch (err) {
  controller.abort(); // cancel remaining operations
  throw err;
}
```

### Worker Thread Module Loading and Warm-Up

Worker threads run in a fresh V8 context and must re-load and re-JIT all required modules. For workers that import large dependencies (e.g., image processing libraries, ML inference runtimes), the cold start can be 200--2000ms. Mitigate by:
- Pre-creating the worker pool at application startup, not at first use
- Sending a warm-up message that forces JIT compilation of hot code paths
- Using `workerData` to pass initialization config rather than sending it as the first task message

If your Node.js version supports it (18.7+), use `--experimental-vm-modules` and the `Worker` `eval` option to share already-parsed module code.

### Tick Starvation from Recursive Microtasks

A recursive async pattern that schedules new microtasks before completing (e.g., `async function loop() { await processItem(); return loop(); }`) can starve the event loop of I/O callbacks because the microtask queue drains completely before each event loop phase. The event loop never reaches the poll phase to pick up new I/O events. Fix by yielding to the event loop periodically with `await new Promise(resolve => setImmediate(resolve))` every N iterations, where N is tuned to keep I/O latency acceptable (typically every 100--1000 iterations).

### AsyncLocalStorage Across Worker Thread Boundaries

`AsyncLocalStorage` context does NOT automatically propagate into `worker_threads`. Worker threads have their own independent async context. If you need request context (trace ID, request ID) inside a worker, serialize the relevant fields from `storage.getStore()` and pass them via `workerData` or `postMessage`. Inside the worker, reconstruct the context manually by storing the values in module-level variables or creating a new `AsyncLocalStorage` store with the received data.

---

## Example

**Input from user:** "I need to process 50,000 user records from a database, enrich each one by calling an external REST API, and write the results to a file. The API has a rate limit of 100 requests per second and allows up to 20 concurrent connections. How do I structure this in Node.js?"

---

## Async Pattern Analysis

### Problem Classification
- **Category:** I/O-bound parallel with concurrency cap + streaming output
- **Node.js Versions Supported:** 18+ (for `stream/promises`, `AbortSignal.timeout`, async iteration)
- **Key Constraint:** API rate limit (100 req/s) and connection limit (20 concurrent) prevent naive `Promise.all`; data volume (50k records) prevents full in-memory buffering

### Pattern Decision Matrix

| Pattern | Use When | Avoid When | Overhead |
|---------|----------|------------|----------|
| `Promise.all` over all 50k | all could run concurrently | rate/connection limited | catastrophic here |
| Sequential `for...of` | simplest, no concurrency | throughput too low (1 req at a time) | none but slow |
| `p-limit` (concurrency cap) | cap at 20 concurrent | time-rate limiting also needed | minimal |
| `p-throttle` (rate cap) | cap at 100/s | connection limit also needed | minimal |
| Combined semaphore + throttle | both connection and rate limits apply | neither applies | minimal |
| Readable stream → Transform → Writable | 50k rows, can't buffer all in memory | small dataset, buffering fine | low |

### Recommended Implementation

Use a streaming pipeline to read database records without buffering all 50k in memory, process each record through a Transform stream that applies concurrency and rate limiting, and write results to a file using `stream.pipeline`. The combination of a concurrency limiter (max 20 concurrent API calls) with a time-rate throttle (max 100/s) matches the API's constraints exactly.

**Key decision:** Streaming pipeline over `Promise.all` because 50,000 records cannot be loaded into memory simultaneously (typical record + enriched result ≈ 2--10KB each = 100--500MB). Streaming keeps memory bounded to `highWaterMark × record size` ≈ a few MB.

### Code Implementation

```javascript
// Streaming enrichment pipeline with concurrency + rate limiting
// Node.js 18+ required
// Dependencies: p-limit, p-throttle (npm install p-limit p-throttle)

import { pipeline, Transform } from 'node:stream';
import { pipeline as asyncPipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import pLimit from 'p-limit';
import pThrottle from 'p-throttle';

const CONCURRENCY_LIMIT = 20;   // max simultaneous open API connections
const RATE_LIMIT = 100;          // max API calls per second
const RATE_INTERVAL = 1000;      // 1 second window in ms

// Compose both limits: a call must acquire a concurrency slot AND
// pass the throttle before firing.
const limit = pLimit(CONCURRENCY_LIMIT);

const throttledFetch = pThrottle({
  limit: RATE_LIMIT,
  interval: RATE_INTERVAL,
})(async (userId, signal) => {
  const response = await fetch(
    `https://api.example.com/enrich/${userId}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error(`API error ${response.status} for user ${userId}`);
  }
  return response.json();
});

// Wrap with concurrency limiter so both constraints apply
async function enrichUser(record, signal) {
  return limit(() => throttledFetch(record.id, signal));
}

// Transform stream: receives user record objects, outputs enriched JSON lines
class EnrichmentTransform extends Transform {
  constructor(signal) {
    super({ objectMode: true, highWaterMark: 50 }); // buffer max 50 objects
    this.signal = signal;
    this.pending = new Set();
  }

  _transform(record, _encoding, callback) {
    // Check for cancellation at each record boundary
    if (this.signal.aborted) {
      callback(new Error('Pipeline aborted'));
      return;
    }

    const enrichPromise = enrichUser(record, this.signal)
      .then(enriched => {
        const result = { ...record, ...enriched, enrichedAt: new Date().toISOString() };
        // Push as newline-delimited JSON
        if (!this.push(JSON.stringify(result) + '\n')) {
          // Backpressure: downstream is full, but Transform handles this via objectMode
        }
      })
      .catch(err => {
        // Decide: fail the whole pipeline, or log and skip?
        // Here: log and skip to maximize partial success
        console.error(`Failed to enrich user ${record.id}:`, err.message);
        this.push(JSON.stringify({ ...record, enrichmentError: err.message }) + '\n');
      })
      .finally(() => {
        this.pending.delete(enrichPromise);
      });

    this.pending.add(enrichPromise);

    // Do not await -- allow up to highWaterMark records to be in-flight
    // Signal ready for next record immediately (backpressure is via p-limit)
    callback();
  }

  _flush(callback) {
    // Wait for all in-flight enrichments to complete before closing
    Promise.all(this.pending)
      .then(() => callback())
      .catch(callback);
  }
}

// Database cursor as an async iterable (pseudo-code for your DB driver)
// Replace with your actual driver's streaming/cursor API:
// - pg: client.query(new Cursor('SELECT ...'))
// - MySQL2: connection.query('SELECT ...').stream()
// - MongoDB: collection.find({}).stream()
async function* databaseCursor(db) {
  const cursor = db.collection('users').find({}).batchSize(500);
  try {
    for await (const doc of cursor) {
      yield doc;
    }
  } finally {
    await cursor.close();
  }
}

// Main pipeline
async function runEnrichmentPipeline(db) {
  // 5-minute overall timeout for the entire pipeline
  const signal = AbortSignal.timeout(5 * 60 * 1000);

  const sourceStream = Readable.from(databaseCursor(db), {
    objectMode: true,
    highWaterMark: 100, // read ahead 100 records from DB cursor
  });

  const enrichTransform = new EnrichmentTransform(signal);

  const outputStream = createWriteStream('./enriched-users.ndjson', {
    flags: 'w',
    encoding: 'utf8',
  });

  console.time('enrichment-pipeline');

  try {
    await asyncPipeline(
      sourceStream,
      enrichTransform,
      outputStream
    );
    console.timeEnd('enrichment-pipeline');
    console.log('Pipeline complete');
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      console.error('Pipeline timed out after 5 minutes');
    } else {
      console.error('Pipeline failed:', err);
    }
    throw err;
  }
}
```

### Pitfalls to Avoid

- **Do NOT** use `Promise.all(allRecords.map(enrichUser))` -- this fires 50,000 API requests simultaneously, saturates the connection pool, likely triggers API bans, and buffers all results in memory.
- **Do NOT** use sequential `for await` without the concurrency limiter -- it processes 1 record at a time, achieving roughly 1 req/s instead of the allowed 100 req/s, making the job ~100x slower than necessary.
- **Do NOT** call `callback()` inside `_transform` after `callback(error)` -- calling the Transform callback twice corrupts the stream state. Use early `return` after `callback(error)`.
- **Do NOT** forget `_flush` -- without it, in-flight enrichments that haven't pushed their results yet are dropped when the source stream ends.
- **Do NOT** ignore backpressure signals from the output file write stream -- `asyncPipeline` handles this, but if you replace it with manual `.pipe()` calls, you must handle `drain` events.

### Testing Approach

- **Unit test `enrichUser`** with a mocked `fetch` that records call timing. Assert that no more than 20 calls are in-flight simultaneously (use a counter incremented on call start, decremented on completion).
- **Test rate limiting** by recording timestamps of all mock API calls and asserting no 1-second window contains more than 100 calls.
- **Test the timeout** by injecting an `AbortSignal` that is pre-aborted (`AbortSignal.abort()`) and asserting the pipeline rejects with an `AbortError` rather than hanging.
- **Test `_flush` completion** by using a slow mock API (delayed with `setTimeout`) and asserting the output file contains results for all records that were started before the source stream ended.
- **Test partial failure handling** by having the mock API reject for specific user IDs and asserting those records appear in the output with `enrichmentError` set rather than crashing the pipeline.
- **Integration test** against a real or Docker-based instance of your database and a local mock API server (`nock` or `msw` in server mode) to validate end-to-end throughput approaches 100 req/s.
