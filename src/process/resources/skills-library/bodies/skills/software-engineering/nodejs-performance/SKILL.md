---
name: nodejs-performance
description: |
  Guides expert-level Node.js performance optimization: profiling with clinic.js, V8 optimization strategies, memory leak detection, event loop monitoring, caching strategies, and worker thread utilization.
  Use when the user asks about Node.js performance, profiling, clinic.js, V8 optimization, memory leak detection, event loop lag, caching.
  Do NOT use when the user asks about JavaScript idioms (use `javascript-idioms`), Node.js async patterns (use `nodejs-async-patterns`), general performance testing (use `performance-testing`).
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
# Node.js Performance

## When to Use

**Use this skill when:**
- User asks how to profile a Node.js application to find CPU or memory bottlenecks (e.g., "my API is slow under load, how do I find the bottleneck")
- User asks about clinic.js, 0x, perf_hooks, or V8 profiling tools specifically in a Node.js context
- User asks about V8 optimization hints, hidden classes, deoptimization, or inline caching
- User asks about memory leaks, heap snapshots, garbage collection pressure, or RSS growth in Node.js
- User asks about event loop lag, libuv thread pool saturation, or blocked event loop detection
- User asks about caching strategies at the application layer (in-process LRU, Redis, HTTP cache headers) in a Node.js service
- User asks about worker threads, cluster mode, or CPU-intensive work offloading in Node.js
- User asks about specific throughput or latency numbers and how to improve them in a running Node.js service
- User asks about stream backpressure, Buffer allocation, or high-throughput I/O pipelines in Node.js

**Do NOT use this skill when:**
- User asks about JavaScript language patterns, async/await style, or Promise chaining (use `javascript-idioms`)
- User asks about structuring async control flow, error propagation, or callback patterns in Node.js (use `nodejs-async-patterns`)
- User asks about load testing strategy, test design, or benchmarking methodology across services (use `performance-testing`)
- User asks about Express/Fastify/Koa API design without a performance angle (use appropriate framework skill)
- User asks about Docker or Kubernetes resource limits for Node.js (use `container-orchestration`)
- User asks about database query optimization specifically (use `database-performance`)

---

## Process

### 1. Establish a Profiling Baseline with Real Workload

Before writing a single line of optimization code, capture hard numbers under realistic load.

- Run the application under a representative workload using autocannon (`autocannon -c 100 -d 30 http://localhost:3000/endpoint`) or wrk to generate sustained traffic before profiling -- idle profiling produces useless data
- Record the four essential baseline metrics: **p50 latency**, **p99 latency**, **requests/sec (RPS)**, and **RSS memory over time** -- write these down; every optimization is measured against them
- Enable `--expose-gc` and `--trace-gc` flags temporarily to observe GC frequency and pause duration before diving into profilers; a service pausing 200ms every 3 seconds for GC is a memory pressure problem, not a CPU problem
- Set `NODE_ENV=production` during profiling -- V8 optimizations, process.env checks, and many frameworks behave fundamentally differently between development and production modes
- Capture process metrics with `process.memoryUsage()` at 5-second intervals logged to a file; look for `heapUsed` that never decreases (leak signature) vs. `heapUsed` that sawtooths normally (healthy GC cycle)
- Use `perf_hooks` `PerformanceObserver` to measure event loop utilization natively: `const { eventLoopUtilization } = require('perf_hooks').performance; setInterval(() => console.log(eventLoopUtilization()), 1000)` -- values above 0.85 indicate the loop is near saturation

### 2. Classify the Bottleneck Type Using Diagnostic Tools

Never guess the bottleneck type. Each type has a distinct fingerprint and requires a different tool.

**CPU-Bound Diagnosis:**
- Run `clinic flame` (from the `clinic` npm package) against live traffic: `clinic flame -- node server.js` then replay traffic; the output is an interactive flamegraph showing where CPU time is actually spent
- Alternatively use `0x` for a lower-overhead single-process flamegraph: `0x -o server.js` -- 0x uses `perf` on Linux and DTrace on macOS for native-level profiling
- Look for wide, flat plateaus in the flamegraph -- these are hot functions consuming disproportionate CPU time; a function consuming >15% of total CPU in a web server's hot path almost always indicates an algorithmic problem
- Run `clinic bubbleprof` to visualize async operation timing -- it shows where time is spent between awaits, revealing hidden synchronous blocking or poorly sequenced async work

**Memory-Bound Diagnosis:**
- Use `clinic heapprofiler` to capture allocation profiles: it shows which call sites are allocating the most memory per second, not just total heap size
- Take heap snapshots with `v8.writeHeapSnapshot()` at two points (T+0 and T+60s under load), then diff them in Chrome DevTools Memory tab -- objects that grew are the leak candidates
- Look at the "retained size" column in heap snapshots, not "shallow size" -- a 50-byte string retaining a 10MB closure is the real problem
- Watch for `ArrayBuffer` and `Buffer` in heap snapshots -- native Buffer memory is not counted in `heapUsed` but appears in `process.memoryUsage().arrayBuffers`

**I/O-Bound Diagnosis:**
- Run `clinic doctor` first: it automatically detects event loop delay spikes, CPU usage anomalies, and active handle accumulation -- it produces an HTML report with a recommended next tool
- Check libuv thread pool exhaustion: `UV_THREADPOOL_SIZE` defaults to 4, but `dns.lookup()`, `fs` operations, and some crypto functions compete for these threads; add `process.env.UV_THREADPOOL_SIZE` logging and increase to `Math.min(128, os.cpus().length * 4)` when DNS or fs throughput is the bottleneck
- Distinguish network I/O wait from CPU work using `perf_hooks` marks around suspected slow operations

**Event Loop Lag Diagnosis:**
- Measure event loop lag directly: schedule a 0ms `setTimeout`, measure actual delay vs. expected; anything above 50ms p99 indicates event loop blocking
- Use `@clinic/clinic` or the standalone `loopbench` package for continuous lag measurement in production
- Identify synchronous blocking code by searching for synchronous file operations (`fs.readFileSync`, `fs.existsSync`) and long JSON.parse/JSON.stringify calls on large payloads -- these block the loop for their full duration

### 3. Apply V8-Specific Optimizations

V8's JIT compiler makes assumptions that can be violated, causing deoptimizations that crater performance.

**Hidden Classes and Monomorphic Functions:**
- Always initialize all object properties in the constructor and in a consistent order; V8 assigns a hidden class to objects with the same shape -- mixing property order or adding properties after construction creates polymorphic access, which is 2-10x slower than monomorphic access
- Never add or delete properties from objects after creation in hot paths; use `null` instead of `delete` to preserve shape (`obj.prop = null` vs. `delete obj.prop`)
- Use `%HaveSameMap(a, b)` with `--allow-natives-syntax` during development to verify two objects share a hidden class

**Inline Cache Optimization:**
- Keep functions monomorphic -- a function called with the same argument shape every time gets optimized once; a function receiving objects with different shapes (polymorphic) or more than 4 shapes (megamorphic) never gets fully optimized
- Mark intentionally polymorphic functions by reviewing V8 optimization status: `node --trace-opt --trace-deopt server.js 2>&1 | grep "eager deoptimization"` -- deoptimization events in hot paths are serious performance issues

**Avoid Deoptimization Triggers:**
- Do not use `arguments` object in optimized functions -- use rest parameters (`...args`) instead; the `arguments` object prevents optimization in older V8 versions and adds overhead in newer ones
- Avoid `try/catch` blocks inside hot-path functions -- wrap the hot computation in a helper function called from within try/catch, not the reverse
- Do not mix integer and float values in arrays that are iterated in hot paths -- V8 uses SMI (small integer) arrays which are far faster than HEAP_NUMBER arrays; a single `3.5` in a large integer array converts the entire array to heap number representation

**String Optimization:**
- String concatenation in a loop (`str += chunk`) triggers repeated allocation -- use an array of chunks and `join('')` at the end, or better, use a `Buffer` and write to it directly for binary data
- For repeated JSON serialization of the same schema, consider `fast-json-stringify` which compiles a schema-specific serializer -- typically 2-5x faster than `JSON.stringify` for large objects

### 4. Resolve Memory Leaks Systematically

Memory leaks in Node.js follow a small set of patterns -- identify which pattern applies before attempting a fix.

**Common Leak Patterns:**
- **Closure leaks:** A closure captures a large object that is no longer needed but is retained because the closure is still referenced (e.g., event listeners not removed, timers not cleared). Pattern: `emitter.on('data', handler)` without a corresponding `emitter.off('data', handler)` or `{ once: true }` option
- **Global accumulation:** Data pushed to a global array or Map that is never pruned -- common in request logging, metrics accumulation, or session caches without TTL eviction
- **Module-level state:** Singletons that accumulate state (route registrations, middleware chains, request interceptors) -- especially a problem in test suites that create new server instances without destroying old ones
- **Native binding leaks:** Some C++ addon objects are not garbage collected because their JS wrapper is freed but the native handle is not released; check with `process.memoryUsage().external`

**Heap Snapshot Diffing Workflow:**
1. Start server and run load for 60 seconds to warm up
2. Force GC with `global.gc()` (requires `--expose-gc`) and take Snapshot A
3. Run load for another 120 seconds
4. Force GC again, take Snapshot B
5. In Chrome DevTools, load both snapshots, select "Comparison" view between B and A
6. Sort by "# Delta" (new objects) -- focus on object types with high positive delta
7. Click into a leaking object, examine the retaining path in the bottom panel -- this shows exactly which reference is keeping it alive

**Practical Leak Fixes:**
- Replace unbounded Maps and Sets with `lru-cache` (LRU-Cache npm package) with an explicit `max` size and `ttl` -- this alone fixes the majority of cache-based leaks
- Always store `setTimeout`/`setInterval` return values and call `clearTimeout`/`clearInterval` in cleanup code; use `ref()`/`unref()` on timers that should not prevent process exit
- For EventEmitters, use `emitter.setMaxListeners(n)` thoughtfully -- the default warning at 10 listeners is a leak signal, not just a warning to suppress

### 5. Optimize the Event Loop and I/O Pipeline

The event loop is the heart of Node.js performance -- protecting it from blocking work is the primary architectural concern.

**Offloading CPU-Intensive Work:**
- Use `worker_threads` for CPU-bound tasks exceeding ~10ms -- anything running longer than 10ms in the event loop starves other requests; the threshold for "acceptable" synchronous work per tick is closer to 1-2ms in high-throughput services
- Create a worker thread pool manually or use `piscina` (npm) which manages a pool of worker threads with backpressure, FIFO queuing, and task cancellation -- `piscina` is the production-grade choice over raw `worker_threads`
- Pass data between main thread and workers using `SharedArrayBuffer` and `Atomics` for zero-copy communication of large arrays, or `transferList` in `postMessage` to transfer ownership of an `ArrayBuffer` without copying it

**Stream Backpressure:**
- Never ignore the return value of `writable.write(chunk)` -- when it returns `false`, the write buffer is full and you must pause the readable source until the `drain` event fires; ignoring this causes unbounded memory growth
- Use `pipeline()` from `stream/promises` (Node.js 15+) instead of manually piping -- `pipeline` correctly handles error propagation and cleanup, and respects backpressure automatically
- For high-throughput HTTP responses, avoid collecting the entire response in memory before sending; stream directly from the data source to the response object using `readable.pipe(res)`

**Connection Pool Sizing:**
- For PostgreSQL with `pg`: set `max` pool size to `(number_of_cpu_cores * 2) + effective_spindle_count` -- for a typical 4-core server, 10-12 connections is the correct starting point, not the default of 10 (which is coincidentally correct) but understand why
- For Redis with `ioredis`: the default single connection is fine for most cases; use connection pools only when you observe queue depth growing under load -- `ioredis` cluster mode manages its own connection pool per shard
- For HTTP client pools (undici, got, axios): set `connections` and `pipelining` in undici to match your downstream service's capacity; undici's `pool` with `connections: 10, pipelining: 10` can saturate most microservice endpoints

**libuv Thread Pool Tuning:**
- The default `UV_THREADPOOL_SIZE=4` is insufficient for services doing significant `dns.lookup()`, file I/O, or `crypto` operations
- Set via environment: `UV_THREADPOOL_SIZE=16` (or up to 1024) -- must be set before any async operations start, so set it in the process environment, not in JavaScript code
- Prefer `dns.resolve4()` over `dns.lookup()` where possible -- `resolve4` uses the V8 async DNS resolver and does not consume thread pool threads

### 6. Implement Application-Layer Caching

Caching decisions have the highest return on investment of any optimization -- a cache hit is orders of magnitude faster than recomputation or I/O.

**In-Process LRU Cache:**
- Use `lru-cache` v10+ (the `LRUCache` class) for in-process caching -- configure `max` (item count), `maxSize` + `sizeCalculation` (for memory-bounded caches), and `ttl` (time-to-live in ms)
- In-process cache lookup is ~100ns; Redis round-trip is ~0.5-1ms on a local network; database query is typically 5-50ms -- understand which layer to hit
- Cache the result of expensive computations (template rendering, schema validation, JWT verification results) keyed by a deterministic hash of the inputs
- For request deduplication (preventing thundering herd on cache miss), use a single in-flight request tracker: store the Promise for an in-flight cache miss keyed by cache key, so concurrent requests for the same missing key await the same Promise rather than all hitting the database

**Distributed Cache with Redis:**
- Use `ioredis` over the older `redis` package for better cluster support, pipelining, and Lua scripting
- Pipeline multiple Redis commands with `pipeline()` to reduce round-trips: `const results = await redis.pipeline().get('key1').get('key2').hget('hash', 'field').exec()` -- a 3-command pipeline saves 2 network round-trips
- Use Redis `SET key value EX 300 NX` (set-if-not-exists with expiry) for distributed locking to prevent thundering herd -- do not use `GET` then `SET` as separate operations (race condition)
- Serialize cache values with `msgpack` (msgpackr npm package) rather than JSON -- msgpack is typically 30-50% smaller and 2-3x faster to serialize/deserialize than JSON for complex objects

**HTTP-Layer Caching:**
- Set `Cache-Control: max-age=N, stale-while-revalidate=M` headers on endpoints where response data has known freshness -- this offloads caching to the CDN or client and costs zero application resources
- Use ETags for GET endpoints with expensive computation -- send the ETag as a hash of the response, and return 304 with empty body on `If-None-Match` match; this saves both serialization and bandwidth

### 7. Monitor and Tune in Production

Optimizations that work in development often behave differently under production load patterns.

**Metrics to Collect Continuously:**
- Event loop lag (p50, p99, p999) via `perf_hooks` `eventLoopUtilization()` or the `toobusy-js` package
- `process.memoryUsage()` fields: `heapUsed`, `heapTotal`, `rss`, `external`, `arrayBuffers` -- alert on `heapUsed/heapTotal > 0.85` (GC pressure) or `rss` growing monotonically
- GC metrics via `--expose-gc` + `PerformanceObserver` on `gc` entries -- alert on GC pause > 100ms or GC frequency > 1 per second
- Active handles and requests: `process._getActiveHandles().length` and `process._getActiveRequests().length` -- growing handle counts indicate leaks

**Production Profiling with Minimal Overhead:**
- `clinic flame` has ~10-15% CPU overhead and is safe for short production profiling sessions (30-60 seconds)
- For continuous low-overhead production profiling, use V8's sampling profiler via `--cpu-prof` flag: `node --cpu-prof --cpu-prof-interval=1000 server.js` -- 1ms sampling interval adds <1% overhead
- Use `node --heap-prof` for continuous heap allocation profiling with configurable sampling; output is a `.heapprofile` file loadable in Chrome DevTools

**Cluster Mode vs. Worker Threads:**
- Use `cluster` module to spawn one process per CPU core for I/O-heavy services -- cluster workers share no memory but each gets a full V8 heap, and Node.js's cluster module uses SO_REUSEPORT for load distribution
- Use `worker_threads` for CPU-intensive work within a single request's lifecycle -- workers share memory via SharedArrayBuffer and can pass Transferable objects
- Do NOT mix cluster and worker threads naively -- a cluster of 8 processes each spawning 8 worker threads creates 64 threads competing for CPU on an 8-core machine

---

## Output Format

```
## Node.js Performance Analysis: [service/component name]

### Baseline Metrics (pre-optimization)
| Metric              | Value         | Tool Used         |
|---------------------|---------------|-------------------|
| p50 latency         | Xms           | autocannon        |
| p99 latency         | Xms           | autocannon        |
| Throughput (RPS)    | X req/s       | autocannon        |
| Heap used           | X MB          | process.memoryUsage() |
| RSS                 | X MB          | process.memoryUsage() |
| Event loop lag p99  | Xms           | perf_hooks ELU    |
| GC pause (max)      | Xms           | PerformanceObserver |

### Bottleneck Classification
- **Primary type:** [CPU-bound | Memory-bound | I/O-bound | Event loop blocked]
- **Diagnostic tool used:** [clinic flame | clinic bubbleprof | clinic heapprofiler | 0x | heap snapshot diff]
- **Root cause:** [specific function, call site, or pattern identified]
- **Evidence:** [flamegraph plateau at X% | heap delta of YMB/min | event loop lag spike pattern]

### Optimizations Applied

#### Optimization 1: [Name]
- **Technique:** [specific technique -- hidden class fix | LRU cache | worker offload | etc.]
- **Code change summary:** [brief description of what changed]
- **Justification:** [profiling data that motivated this change]

#### Optimization 2: [Name]
- **Technique:** [specific technique]
- **Code change summary:** [brief description]
- **Justification:** [data]

### Post-Optimization Metrics
| Metric              | Before   | After    | Delta       |
|---------------------|----------|----------|-------------|
| p50 latency         | Xms      | Yms      | -Z% |
| p99 latency         | Xms      | Yms      | -Z% |
| Throughput (RPS)    | X req/s  | Y req/s  | +Z% |
| Heap used           | X MB     | Y MB     | -Z MB       |
| Event loop lag p99  | Xms      | Yms      | -Z% |

### Remaining Risks / Next Steps
- [Any optimizations deferred and why]
- [Monitoring alerts to add]
- [Follow-up profiling recommended after N days of production traffic]
```

---

## Rules

1. **Never optimize without a flamegraph or heap profile.** Intuition about Node.js hot paths is wrong at least 70% of the time -- synchronous code you assume is fast often has hidden allocations, and async code you assume is slow is often dominated by a single DNS lookup or TLS handshake.

2. **`clinic doctor` is always the first tool, not the last.** Run `clinic doctor` before `clinic flame` or `clinic heapprofiler` -- it classifies the bottleneck type automatically and recommends the right next tool, preventing a 30-minute flamegraph analysis when the real problem is UV thread pool starvation.

3. **Never suppress the EventEmitter max-listeners warning without investigating first.** The default warning at 10 listeners for one event is a leak detector, not a noise source. Call `emitter.listenerCount('eventName')` to confirm the count, remove unused listeners, then increase the limit only if the high count is intentional and documented.

4. **The `--max-old-space-size` flag is not a memory leak fix.** Increasing heap size delays the OOM crash -- it does not fix the leak. Set it appropriately for the workload (typically 75% of available container memory) but always pair it with a proper heap snapshot analysis of the leak.

5. **`UV_THREADPOOL_SIZE` must be set as an environment variable before Node.js starts, not inside JavaScript.** Setting `process.env.UV_THREADPOOL_SIZE = '16'` in `server.js` has no effect because the thread pool is initialized at startup before any JS runs. Set it in the process environment via systemd, Docker, or a shell wrapper.

6. **Worker threads do not share the event loop -- they each have their own.** A `worker_threads` worker that blocks its own event loop only blocks that worker, not the main thread. However, workers still compete for CPU time, so spawning more workers than CPU cores does not improve CPU-bound throughput and increases context switching overhead.

7. **Benchmark with `autocannon` or `wrk`, not `ab` (Apache Bench).** `ab` uses blocking I/O which limits its ability to saturate modern async servers -- it will underreport the throughput of Node.js services. `autocannon` is written in Node.js and properly saturates the server's async pipeline.

8. **Avoid synchronous JSON.parse/JSON.stringify on payloads larger than 1MB in the hot path.** At 1MB, `JSON.parse` takes approximately 50-100ms depending on structure, blocking the event loop for that duration. Stream-parse large JSON with `stream-json` (npm) or validate and reject oversized payloads at the ingress layer.

9. **In-process caches are per-process -- cluster mode means N caches, not 1.** A cache hit ratio measured in development (single process) will be N times lower in production cluster mode. Size in-process caches to fit comfortably within each process's memory budget, or use Redis as the shared cache layer in cluster deployments.

10. **`delete obj.property` in a hot path causes a hidden class transition.** V8 creates a new hidden class for the modified object shape, invalidating the inline cache for all code that previously operated on objects of the original class. Set unwanted properties to `null` or `undefined` instead, or restructure to avoid property removal entirely.

---

## Edge Cases

**Heap snapshot diffing shows false positives after require() calls:**
Node.js caches `require()` results in `Module._cache`. If Snapshot A is taken before a module is first loaded (cold) and Snapshot B is after (warm), the diff will show module-level string allocations as "leaks." Always warm up the application by running full request cycles before taking Snapshot A -- module caches must be fully populated before the baseline snapshot.

**Event loop lag spikes only under connection surge (not sustained load):**
This pattern indicates TCP connection establishment cost, not a steady-state problem. Node.js's `net.Server` calls `accept()` synchronously in the event loop for each new connection. Under a connection burst (e.g., after a deployment or after a brief outage), hundreds of TLS handshakes queue up simultaneously. Mitigate with: (1) keep-alive connections from upstream load balancers, (2) a connection ramp-up on the client side, or (3) `server.maxConnections` throttling with proper backpressure. Profiling this under artificial steady load will miss the problem entirely.

**`clinic flame` shows most time in "node_modules" with no identifiable hot function:**
This indicates the bottleneck is not an algorithmic problem but framework overhead -- middleware chains, serialization, or deserialization in library code. Switch to `clinic bubbleprof` to visualize async operation duration. If bubbleprof shows large blocks between operations, investigate whether the framework is doing synchronous work (headers parsing, route matching, body parsing) that scales poorly with payload size or route count. Consider switching from Express to Fastify (which uses `find-my-way` for O(1) route matching and `fast-json-stringify` for serialization).

**Worker thread pool causes thundering herd on startup:**
Piscina and similar libraries lazy-initialize workers. The first N concurrent requests each trigger a worker spawn, causing a burst of OS-level thread creation that blocks the main thread for 50-200ms per worker. Pre-warm the pool at server startup by calling `pool.run(noopTask)` for each worker slot during the application initialization phase, before accepting traffic.

**Memory usage grows in test suite but not in production:**
This is almost always caused by test frameworks or module-level singletons that accumulate state across tests. Common culprits: (1) Express/Fastify app instances created but not closed (`app.close()`) -- each holds open socket handles, (2) `setInterval` timers started in module initialization code that are never cleared, (3) `jest`'s module registry caching modules with accumulated state across test files. Run with `--detectOpenHandles` in Jest and `--forceExit` as a diagnostic (never as a fix) to identify which handles survive test teardown.

**High RSS but low `heapUsed` -- memory not visible in heap snapshots:**
RSS (Resident Set Size) exceeds `heapUsed` + `heapTotal` + `external` when native addons, Buffer allocations outside V8's heap, or memory-mapped files are involved. Check `process.memoryUsage().arrayBuffers` for Buffer allocations and `external` for native addon objects. Run `node --experimental-vm-modules` with `--heap-prof` and check for Buffer pools that are never released. A common cause is `sharp` (image processing), `bcrypt`, or TLS session caches -- these allocate memory natively and do not appear in V8 heap snapshots.

**Optimization regresses performance on some CPU architectures:**
V8's JIT compilation output is CPU-architecture-specific. An optimization that works on a developer's Apple M1 (ARM64) may behave differently on production x86_64 AMD CPUs because SIMD instruction availability, branch predictor behavior, and L1/L2 cache sizes differ. Always profile and benchmark on the same CPU architecture and OS as production. AWS Graviton (ARM64) and standard Intel/AMD x86_64 instances will produce different flamegraphs for the same code -- do not use one to optimize for the other.

---

## Example

**Input:** "My Node.js REST API is handling about 500 req/s but we need to reach 2000 req/s. It's a product catalog service -- each request fetches a product by ID from PostgreSQL, does some pricing calculation, and returns JSON. The team says it's 'slow' but hasn't profiled it. What do I do?"

**Output:**

## Node.js Performance Analysis: Product Catalog Service

### Phase 1: Establish the Baseline

Before touching code, run `clinic doctor` against live traffic:

```bash
npm install -g clinic autocannon

# Terminal 1 -- start server under clinic
clinic doctor -- node server.js

# Terminal 2 -- generate load for 60 seconds
autocannon -c 100 -d 60 http://localhost:3000/products/12345
```

Record the baseline metrics from autocannon output and clinic report:

| Metric              | Baseline Value  | Tool                    |
|---------------------|-----------------|-------------------------|
| p50 latency         | 18ms            | autocannon              |
| p99 latency         | 145ms           | autocannon              |
| Throughput (RPS)    | 490 req/s       | autocannon              |
| Heap used           | 180 MB          | process.memoryUsage()   |
| RSS                 | 310 MB          | process.memoryUsage()   |
| Event loop lag p99  | 12ms            | clinic doctor           |
| UV thread pool      | 4 threads        | UV_THREADPOOL_SIZE env  |

Clinic doctor flags: "I/O bottleneck detected -- async operations queueing. Recommend running clinic bubbleprof."

The event loop lag p99 of 12ms with async queueing means I/O is the bottleneck type -- not CPU.

---

### Phase 2: Diagnose with clinic bubbleprof

```bash
clinic bubbleprof -- node server.js
# replay load for 30 seconds
autocannon -c 50 -d 30 http://localhost:3000/products/12345
```

Bubbleprof output shows: 78% of request time is in a single async block labeled `pg.query`. The query itself takes 8-12ms. With 100 concurrent requests each waiting 10ms for a PostgreSQL response, and a pool of 10 connections, the queue depth averages 100/10 * 0.010 = ~1 pending request per connection -- we are at pool saturation.

Also visible: the pricing calculation (`calculateRegionalPricing()`) runs 100% synchronously and shows up as a 3ms CPU block per request in the flamegraph. This is fine at 500 req/s but will become the bottleneck if database latency is reduced.

---

### Phase 3: Apply Optimizations

#### Optimization 1: LRU Cache for Product Data

Product catalog data changes infrequently (cache TTL of 60 seconds is acceptable per the business). Add an in-process LRU cache keyed by product ID:

```javascript
const { LRUCache } = require('lru-cache');

const productCache = new LRUCache({
  max: 10_000,         // max 10k products cached (size of catalog)
  ttl: 60_000,         // 60-second TTL
  updateAgeOnGet: false,
});

async function getProduct(productId) {
  const cached = productCache.get(productId);
  if (cached) return cached;

  // Deduplicate in-flight requests for same key (thundering herd prevention)
  if (inflightRequests.has(productId)) {
    return inflightRequests.get(productId);
  }

  const promise = db.query('SELECT * FROM products WHERE id = $1', [productId])
    .then(result => {
      const product = result.rows[0];
      productCache.set(productId, product);
      inflightRequests.delete(productId);
      return product;
    });

  inflightRequests.set(productId, promise);
  return promise;
}

const inflightRequests = new Map();
```

This converts repeated database fetches for popular products (cache hit ratio expected ~85% for top 10k products based on Pareto distribution of product views) into ~100ns in-process lookups.

#### Optimization 2: Increase PostgreSQL Pool Size

Current pool max is 10. Server has 4 CPUs. The formula `(CPU_cores * 2) + spindle_count` gives `(4 * 2) + 1 = 9` for an SSD-backed database -- but since this is a remote PostgreSQL server (not localhost), latency is 8ms not 0.5ms. Use Little's Law: to sustain 2000 req/s with 8ms query time and a 15% cache miss rate, we need `2000 * 0.15 * 0.008 = 2.4` concurrent queries at steady state. A pool of 15 handles bursts safely. Update `pg.Pool`:

```javascript
const pool = new Pool({
  max: 15,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});
```

#### Optimization 3: Offload Pricing Calculation to Worker Thread Pool

`calculateRegionalPricing()` is 3ms of synchronous CPU per request. At 2000 req/s this is 6 seconds of CPU work per second -- clearly exceeding single-core capacity. Offload to `piscina`:

```javascript
const Piscina = require('piscina');

const pricingPool = new Piscina({
  filename: path.resolve(__dirname, 'workers/pricing.js'),
  minThreads: 2,
  maxThreads: require('os').cpus().length - 1, // leave 1 core for event loop
});

// In request handler:
const price = await pricingPool.run({ product, region, userId });
```

`workers/pricing.js`:
```javascript
module.exports = ({ product, region, userId }) => {
  // Pure synchronous calculation -- no I/O, no require() at call time
  return calculateRegionalPricing(product, region, userId);
};
```

Pre-warm the pool on startup:

```javascript
// server.js initialization, before accepting traffic
await Promise.all(
  Array.from({ length: pricingPool.options.maxThreads }, () =>
    pricingPool.run({ product: {}, region: 'US', userId: null })
  )
);
```

#### Optimization 4: Enable Cluster Mode

Spawn one process per CPU core to parallelize the event loop across cores:

```javascript
// cluster.js (new entry point)
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  const numWorkers = os.cpus().length;
  for (let i = 0; i < numWorkers; i++) cluster.fork();
  cluster.on('exit', (worker) => cluster.fork()); // auto-restart
} else {
  require('./server.js');
}
```

Note: the LRU cache is now per-process -- with 4 cluster workers, total in-process cache memory is `4 * 10k entries` which is acceptable. Cache hit ratios per process will be lower during the warmup period after deployment.

---

### Post-Optimization Metrics

| Metric              | Before     | After      | Delta     |
|---------------------|------------|------------|-----------|
| p50 latency         | 18ms       | 3ms        | -83%      |
| p99 latency         | 145ms      | 22ms       | -85%      |
| Throughput (RPS)    | 490 req/s  | 2,340 req/s| +377%     |
| Heap used (per proc)| 180 MB     | 195 MB     | +15 MB    |
| Event loop lag p99  | 12ms       | 1.2ms      | -90%      |
| DB connections      | 10         | 60 (4×15)  | cluster × pool |

The 2000 req/s target is achieved. The small heap increase is the LRU cache population cost (~15 MB for 10k product objects), which is acceptable.

---

### Bottleneck Classification
- **Primary type:** I/O-bound (PostgreSQL connection pool saturation)
- **Secondary type:** CPU-bound (pricing calculation at scale)
- **Diagnostic tool used:** clinic doctor → clinic bubbleprof → clinic flame
- **Root cause:** 10-connection pool insufficient for request concurrency; synchronous pricing calculation blocking event loop per request
- **Evidence:** bubbleprof showed 78% of request time in `pg.query` async block; flamegraph showed 3ms synchronous CPU plateau in `calculateRegionalPricing` per request

### Remaining Risks / Next Steps
- Monitor LRU cache hit ratio per process via `productCache.size` and custom metrics -- if hit ratio drops below 60%, switch to shared Redis cache to avoid per-process duplication
- Add event loop utilization alert: alert if `eventLoopUtilization().utilization > 0.80` for 30+ seconds -- this signals approaching saturation at higher traffic
- The worker thread pool adds latency overhead (~0.5ms IPC) for cached requests where pricing is the only work -- consider making pricing synchronous for cache-hit paths and async-only for cache-miss paths
- Profile again after 1 week of production traffic to validate cache hit ratio assumptions and identify any new bottlenecks that emerge at the new traffic level
