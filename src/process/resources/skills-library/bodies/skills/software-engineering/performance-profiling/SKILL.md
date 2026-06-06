---
name: performance-profiling
description: |
  Guides expert-level performance profiling implementation: optimization and debugging decision frameworks, production-ready patterns, and concrete templates for performance profiling workflows.
  Use when the user asks about performance profiling, performance profiling configuration, or optimization best practices for performance projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "optimization debugging best-practices"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Performance Profiling

## When to Use

**Use this skill when:**
- A user reports unexplained latency spikes, high CPU usage, memory growth over time, or throughput degradation in a running application and needs a structured investigation plan
- A user wants to set up continuous profiling infrastructure (flamegraphs, APM agents, sampling profilers) for a service before performance regressions reach production
- A user is optimizing a specific hotspot identified by a prior measurement -- for example, a database query taking 800ms when the SLA is 200ms, or a Node.js event loop that blocks for 40ms on every request
- A user needs to interpret profiler output -- flamegraph stacks, allocation traces, GC logs, or lock contention reports -- and turn raw data into an actionable fix
- A user is designing a benchmarking harness to measure the impact of a code change and needs guidance on isolating variables, avoiding JIT warm-up artifacts, and computing statistically valid results
- A user wants to establish a performance budget and regression detection pipeline so that CI fails when a pull request introduces a slowdown beyond a defined threshold
- A user is debugging a production incident where high tail latency (p99, p999) differs significantly from median latency and needs to identify the source of variance

**Do NOT use this skill when:**
- The user needs help writing load tests or stress tests to determine system capacity -- use the load-testing skill instead
- The user needs help with distributed tracing across microservices (trace propagation, span correlation, sampling rates) -- use the distributed-tracing skill
- The user is asking about infrastructure-level monitoring such as alerting, dashboards, or SLO error budgets -- use the observability-and-monitoring skill
- The user needs database query plan analysis as a standalone task -- use the database-query-optimization skill
- The user is asking how to reduce bundle size for a frontend application without runtime profiling -- use the frontend-build-optimization skill
- The user wants to implement caching strategy to reduce latency without first profiling -- redirect them to measure first, then apply the caching skill
- The user is asking about algorithmic complexity in the abstract, without a concrete performance problem -- use the algorithm-design skill

---

## Process

### 1. Establish the Performance Problem Statement

Before touching any tooling, nail down what "slow" actually means in measurable terms.

- Identify the metric category: latency (response time for a single request), throughput (requests per second), resource utilization (CPU%, RSS memory), or concurrency (active threads, connection pool saturation).
- Ask the user for a concrete baseline number and a concrete target: "p99 API latency is 1,200ms; the SLA requires 300ms" is actionable -- "the app feels slow" is not.
- Distinguish between steady-state degradation (performance worsens continuously under constant load) and spike behavior (occasional latency spikes during otherwise normal operation) -- they have completely different root causes and profiling strategies.
- Determine whether the problem is reproducible: can it be triggered on demand in a staging environment, or does it only appear in production under specific traffic patterns?
- Capture the deployment context: language and runtime version (Node.js 20, JVM 21, Python 3.11, Go 1.22), hardware class (containerized with 2 vCPU/4GB RAM vs. bare metal 32-core), and whether the workload is CPU-bound, I/O-bound, or memory-bound.
- Record the time the problem started and any deployments, configuration changes, or data volume changes that coincide with the regression.

### 2. Select the Right Profiling Tier

Performance profiling has three tiers with different fidelity/overhead trade-offs. Choosing the wrong tier wastes time.

**Tier 1 -- Lightweight always-on metrics (< 1% overhead):**
- Application-level: record p50/p95/p99 latency histograms using a metrics library (Prometheus histograms, StatsD timers, Micrometer). These are safe to run in production continuously.
- Runtime metrics: JVM GC pause time and frequency via JMX/JFR, Node.js event loop lag via `perf_hooks.monitorEventLoopDelay()`, Go runtime metrics via `runtime/metrics`, Python GIL contention via `gil_load` or `tracemalloc` summaries.
- Use Tier 1 first to confirm which component (service, database, external call) is actually slow before profiling anything.

**Tier 2 -- Sampling profilers (1-5% overhead, safe for short production bursts):**
- JVM: Java Flight Recorder (JFR) with `jcmd <pid> JFR.start duration=60s filename=profile.jfr` -- safe for production with 1-2% overhead. Async-profiler (`async-profiler -d 30 -f flamegraph.html <pid>`) for wall-clock or CPU flamegraphs.
- Node.js: `node --prof app.js` generates isolate tick files; process with `node --prof-process` or route to `0x` for interactive flamegraphs. For production: `clinic flame` from the Clinic.js suite.
- Go: `go tool pprof` with the built-in `net/http/pprof` endpoint (`/debug/pprof/profile?seconds=30`). Captures CPU, heap, goroutine, and block profiles.
- Python: `py-spy record -o flamegraph.svg --pid <pid> --duration 60` -- attaches without restarting the process, 1-3% overhead.
- .NET: `dotnet-trace collect --process-id <pid> --duration 00:01:00` with `dotnet-trace convert` to SpeedScope or PerfView format.

**Tier 3 -- Instrumented/allocation profilers (5-30% overhead, staging/dev only):**
- JVM: YourKit or JProfiler for method-level timing and heap allocation traces. Use `-Xss512k` and `-XX:+HeapDumpOnOutOfMemoryError` together.
- Node.js: `--heap-prof` flag for V8 heap snapshots; compare two snapshots in Chrome DevTools Memory panel to find allocation leaks.
- Python: `memory_profiler` with `@profile` decorator for line-by-line memory tracking.
- Use Tier 3 only when Tier 2 flamegraphs show that the hotspot is in allocation/GC rather than computation.

### 3. Instrument and Collect the Profile

Collecting a meaningful profile requires deliberate setup -- a 10-second CPU sample on an idle server is worthless.

- **Ensure the system is under representative load** before starting the profiler. Use a realistic load generator (wrk, k6, hey, or a replay of production traffic via shadow traffic tools) targeting at least 70% of normal production QPS.
- **Run the profiler for a statistically meaningful window:** 30-60 seconds for CPU sampling profilers (shorter windows miss infrequent but expensive code paths), 5-10 minutes for allocation profilers (to catch slow leaks), and the full duration of a known periodic event (e.g., a batch job that runs every 5 minutes).
- **Capture wall-clock time, not just CPU time** for I/O-heavy workloads. A flamegraph that only shows on-CPU time will make I/O waits invisible. Async-profiler's `-e wall` mode and `py-spy`'s `--idle` flag include threads blocked in syscalls.
- **Disable JIT warm-up effects in benchmarks:** For JVM applications, run at least 10,000 iterations of the hot path before starting measurement to ensure the JIT has compiled hotspots. For Go, use `b.ResetTimer()` after setup in benchmark functions.
- **Capture system-level context simultaneously:** `vmstat 1`, `iostat -x 1`, and `ss -s` (socket statistics) during the profiling window. These reveal whether a CPU-bound flamegraph is actually masking I/O saturation that forces the kernel to schedule other processes.
- **Label threads and goroutines meaningfully** before profiling. JVM: set `Thread.currentThread().setName("request-handler-pool")`. Go: goroutine labels via `pprof.Do(ctx, pprof.Labels("handler", "checkout"))`. Without labels, flamegraphs show hundreds of identical stacks.

### 4. Analyze the Flamegraph and Profile Output

Raw profiler output is data -- this step converts it to insight.

- **Read flamegraphs from bottom to top:** the bottom frames are entry points (main, HTTP handler); the top frames are the actual CPU consumers. Width of a frame = % of samples in that stack. Focus on the widest plateaus near the top of tall stacks.
- **Apply the 80/20 rule aggressively:** in almost every real-world profile, 1-3 functions consume 60-80% of CPU time. Ignore everything below 2% contribution until the top offenders are fixed.
- **Distinguish between self-time and cumulative time:** a function with high cumulative time but low self-time is a caller, not the problem. The function with high self-time that doesn't delegate further is the actual hotspot.
- **For memory profiles, sort by "live bytes retained" not "total allocated":** a function that allocates 10GB over a run but retains only 1MB is not a leak. The leak is in retained allocations that grow linearly with time or request count.
- **Identify the three most common hotspot categories and their signatures in flamegraphs:**
  - *Serialization/deserialization:* look for wide `JSON.parse`, `Unmarshal`, `ObjectMapper.readValue`, or `pickle.loads` frames. Fix by switching to a faster library (simdjson, sonic, protobuf) or caching deserialized results.
  - *Lock contention:* Go profiles show wide `runtime.lock` frames; JVM profiles show wide `java.util.concurrent.locks.ReentrantLock.lock` or `Object.wait` frames. Fix by reducing lock scope, using lock-free data structures, or sharding the lock.
  - *Garbage collection pressure:* JVM GC logs show frequent Young GC pauses (> 50ms more than twice per second indicates over-allocation); Node.js shows wide `V8::GC` frames; Go shows wide `runtime.gcDrain` frames. Fix by reducing allocation rate -- reuse buffers, use sync.Pool in Go, use object pools in Java.
- **For I/O wait analysis:** look for wide syscall frames (`read`, `write`, `epoll_wait`, `futex`). Cross-reference with `iostat` data. If disk I/O utilization is < 50% but the application is blocked on `read`, the issue is sequential access patterns that prevent parallelism, not raw throughput.

### 5. Form and Validate a Hypothesis

A profile tells you *where* time is spent, not *why* -- this step bridges that gap.

- Write a one-sentence hypothesis before making any code change: "The checkout service spends 40% of CPU time in `JSON.Unmarshal` for a 50KB product catalog payload on every request because the catalog is not cached, and this can be eliminated by deserializing once at startup."
- **Quantify the expected impact before optimizing:** if the target is p99 latency < 300ms and the hotspot accounts for 40% of a 1,200ms average request, fixing it fully saves ~480ms -- which gets you to 720ms, still above target. This prevents wasted effort on optimizations that cannot close the gap.
- **Identify the root cause level:** distinguish between algorithmic problems (O(n²) loop that needs a hash map), implementation problems (using a list where a set is appropriate), runtime problems (JVM heap too small causing constant GC), and infrastructure problems (database connection pool size of 5 on an 8-core server).
- **Reproduce the hotspot in isolation before fixing it in the full application.** Write a microbenchmark (Go: `go test -bench=BenchmarkCheckoutUnmarshal -benchmem`, JVM: JMH, Python: `timeit` or `pytest-benchmark`, Node.js: `Benchmark.js`) that exercises only the suspected hotspot.

### 6. Implement and Verify the Fix

Optimization changes must be measured with the same rigor used to identify the problem.

- **Make exactly one change at a time.** Changing serialization library + adding cache + reducing allocations simultaneously makes it impossible to attribute the improvement and understand regressions.
- **Re-run the same profiling scenario and compare flamegraphs side by side** using a diff-friendly tool (async-profiler supports flamegraph diff output; `go tool pprof -diff_base` compares two pprof profiles; JFR Analyzer has a delta view).
- **Benchmark statistical significance:** run benchmarks at least 10 times, discard the fastest and slowest (outlier trimming), and report mean ± standard deviation. A 3% improvement is within noise; a 40% improvement is real. Use the `benchstat` tool for Go benchmarks to compute statistical confidence automatically.
- **Measure the fix against the original SLA target, not just "is it faster than before":** a 30% improvement on a hotspot that was 20% of total time yields only 6% overall improvement (Amdahl's Law). Document actual end-to-end latency improvement after the fix.
- **Check for performance anti-patterns introduced by the fix:** caching fixes serialization overhead but introduces memory pressure -- recheck RSS and GC metrics after adding a cache to ensure you have not created a new problem.
- **Run the full suite of correctness tests** before and after the optimization. Performance fixes frequently introduce correctness bugs through subtle race conditions, off-by-one errors in buffer reuse, or stale cache entries.

### 7. Establish a Performance Regression Gate

Fixes without a regression gate regress. Instrument the finding so it cannot recur silently.

- **Add a benchmark test that covers the optimized path** and commit it to the repository alongside the fix. For Go: commit the `_test.go` file with `BenchmarkXxx`. For JVM: add a JMH benchmark in the `benchmarks/` module.
- **Integrate benchmarks into CI with a threshold:** use `benchstat` with `-delta-test none -alpha 0.05` in CI; fail the pipeline if a benchmark regresses beyond a defined budget (common thresholds: 10% for non-critical paths, 5% for critical paths, 2% for p99-impacting paths).
- **Add a continuous profiling agent** for long-running regression detection in production: Pyroscope (open source, supports Go, Python, Ruby, Node.js, Java), Grafana Phlare, or vendor agents like AWS CodeGuru Profiler or Datadog Continuous Profiler. These capture CPU flamegraphs at 99Hz continuously with < 1% overhead and diff profiles week-over-week.
- **Document the performance fix in the ADR (Architecture Decision Record)** with: problem statement, root cause, fix applied, before/after benchmark numbers, and a description of the regression test added. Without documentation, the next engineer may "optimize" the code back to the slow version.

---

## Output Format

When helping a user with performance profiling, structure the response as follows:

```markdown
## Performance Profiling Analysis: [Component/Service Name]

### Problem Statement
- **Observed metric:** [e.g., p99 latency = 1,400ms]
- **Target metric:** [e.g., p99 latency ≤ 200ms]
- **Gap:** [e.g., 7x over target]
- **Workload:** [e.g., 500 RPS, 16 vCPU, containerized Node.js 20]
- **Problem type:** [Steady-state degradation / Spike behavior / Gradual leak]

---

### Profiling Tier Recommendation

| Tier | Tool | Overhead | Duration | Safe for Production? |
|------|------|----------|----------|----------------------|
| Tier 1 (metrics) | [e.g., Prometheus histograms] | < 1% | Always-on | Yes |
| Tier 2 (sampling) | [e.g., async-profiler, py-spy] | 1-5% | 30-60s burst | Yes |
| Tier 3 (instrumented) | [e.g., YourKit, memory_profiler] | 5-30% | 5-15 min | Staging only |

**Recommended starting tier:** [Tier X] because [reason].

---

### Collection Commands

```bash
# Step 1: Confirm the hotspot component (Tier 1 -- always safe)
[exact command for the user's stack]

# Step 2: Collect CPU flamegraph (Tier 2)
[exact command with flags, duration, output file]

# Step 3: Collect allocation profile if GC is suspected (Tier 3)
[exact command with flags]
```

---

### Flamegraph Interpretation Guide (for this specific profile)

**What to look for:**
- [Specific frame names or patterns expected in this codebase/stack]
- [GC indicators specific to this runtime]
- [I/O wait patterns to identify]

**Red flags in this stack:**
- [e.g., "Wide `ObjectMapper` frames = JSON re-parsing"]
- [e.g., "Wide `runtime.gcDrain` = allocation pressure"]

---

### Hypothesis and Expected Impact

| Suspected Root Cause | Flamegraph Evidence | Expected CPU/Latency Reduction | Amdahl's Limit |
|----------------------|--------------------|---------------------------------|----------------|
| [e.g., JSON re-parse on every request] | [e.g., 42% of CPU in Unmarshal] | [e.g., ~40% CPU, ~500ms p99] | [e.g., Max 42% improvement] |
| [e.g., Unbounded cache growth] | [e.g., GC 15% of time] | [e.g., ~12% CPU] | [e.g., Max 15% improvement] |

---

### Fix Implementation

```[language]
// Before
[concrete slow code example]

// After
[concrete optimized code example]

// Benchmark to validate
[exact benchmark code]
```

---

### Regression Gate

```bash
# CI command to detect future regressions
[exact CI command]
```

**Threshold:** Fail build if [metric] regresses by more than [X]%.

---

### Before/After Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| p50 latency | | | |
| p99 latency | | | |
| CPU utilization | | | |
| GC pause frequency | | | |
| RSS memory | | | |
```

---

## Rules

1. **Never recommend an optimization before identifying the hotspot with measured data.** The single most common performance mistake is optimizing code that is not on the critical path. Always collect a profile first; always state which specific line or function is the measured bottleneck.

2. **Never collect a Tier 3 instrumented profile against a production system.** Instrumented profilers (YourKit, memory_profiler, full JVM instrumentation) can add 10-30% overhead and cause cascading timeouts in a live system. Reserve them for staging environments with production-like load.

3. **Always load the system before profiling.** A profile collected at 5% CPU utilization identifies the wrong hotspots -- the flamegraph will be dominated by idle/scheduler frames. Target at least 60-70% of normal production load before starting the profiler.

4. **Never report a single benchmark run.** Benchmark variance from JIT compilation, OS scheduling, and CPU frequency scaling is routinely 10-20%. Always run at minimum 5 iterations, apply warmup, and report mean ± standard deviation or use a tool like `benchstat` that computes statistical significance automatically.

5. **Apply Amdahl's Law before committing to an optimization.** If a hotspot consumes 20% of total request time and you eliminate it completely, the maximum possible end-to-end improvement is 20%. Always compute this ceiling and compare it against the performance gap before spending engineering time.

6. **Distinguish wall-clock time from CPU time.** For I/O-bound workloads, CPU flamegraphs are almost useless -- they show what the CPU does while waiting, not why the request is slow. Always clarify which mode the profiler is using and switch to wall-clock mode (async-profiler `-e wall`, py-spy `--idle`) when the workload is network or disk bound.

7. **Never interpret a profile without knowing the sampling rate and sample count.** A 10-second profile at 99Hz generates ~990 samples. A function appearing in 20 samples = ~2% of time, which is within noise. Only act on hotspots that appear in at least 5% of samples with a minimum absolute count of 50 samples.

8. **Always check for observer effects when profiling.** The profiler itself consumes CPU and memory. If the profiling overhead exceeds 5%, the flamegraph may show profiler infrastructure frames as hotspots. Validate that the total system CPU during profiling is within 10% of unprofiled CPU.

9. **Never cache or pool objects as a first optimization without first measuring allocation rate.** Object pooling adds complexity and concurrency risks (sync.Pool in Go, object pools in Java). Only apply when the allocation profile confirms that the specific object type consumes > 10% of total allocation by bytes or count.

10. **Always attach a regression test to every performance fix.** A performance improvement that is not protected by an automated benchmark will regress within 6 months as the codebase evolves. The benchmark must exercise the specific code path that was optimized, not a generic end-to-end test, because end-to-end tests have too much variance to detect small regressions.

---

## Edge Cases

### JVM JIT Compilation Invalidates Profiles Taken Too Early
Java's HotSpot JIT compiles methods after 10,000 invocations (C2 threshold with `-server` flag). Profiles taken during the warm-up phase show interpreter overhead, not compiled code costs, leading to misleading hotspots. Mitigation: for benchmarks, use JMH which handles warmup automatically (default: 5 warmup iterations of 1 second each). For production profiling, ensure the JVM has been running for at least 5 minutes under load before attaching async-profiler. In staging, explicitly warm up by running 20,000 requests through the hot path before starting the profile window. Check `-XX:+PrintCompilation` output to confirm a method is compiled (look for `%` flag indicating OSR compilation) before trusting the profile.

### Node.js Event Loop Profiling Shows Misleading Frame Attribution
V8's sampling profiler (used by `--prof` and Chrome DevTools) attributes time to the caller at the moment of the interrupt, not the actual executing frame in async/await chains. This means a `Promise.then` chain can have all samples attributed to the outer `async` function even when the work happens deep inside the chain. Fix: use `clinic flame` from the Clinic.js suite, which instruments V8 hooks to reconstruct accurate async call trees. Alternatively, add `Performance.mark()` / `Performance.measure()` instrumentation around suspected hotspots in async code to get wall-clock timing independent of the profiler's stack attribution.

### Go Profiler Undersamples Short-Duration Goroutines
The Go CPU profiler uses SIGPROF signals at 100Hz (10ms intervals). Goroutines that complete in less than 5ms appear in fewer than 1 sample on average and are effectively invisible in the profile. This affects high-throughput request handlers that are individually fast but cumulatively expensive. Mitigation: use the goroutine blocking profile (`/debug/pprof/block`) which records blocking events with nanosecond resolution rather than sampling, combined with `runtime.SetBlockProfileRate(1)` (record every blocking event). For allocation pressure in short goroutines, use the heap profile with `runtime.MemProfileRate = 1` (profile every allocation, 10-100x overhead -- staging only).

### Memory Leak in Native Code Not Visible in Runtime Heap Profiles
Runtime heap profilers (Go `pprof heap`, JVM heap dump, Node.js heap snapshot) only track allocations managed by the runtime. Memory allocated via CGo, JNI, native Node.js addons, or Python C extensions is invisible to these tools. The symptom is monotonically increasing RSS (process memory reported by the OS) while the runtime heap remains flat. Diagnosis: use OS-level tools -- `valgrind --tool=massif` (Linux, dev only), `heaptrack` (Linux, low overhead), or `Instruments Leaks` (macOS). For JVM native memory, add `-XX:NativeMemoryTracking=summary` and use `jcmd <pid> VM.native_memory` to see off-heap allocations by category (code cache, metaspace, thread stacks, direct buffers).

### Performance Regression After Dependency Update With No Code Change
When a dependency update causes a performance regression, application-level profiling tools will still attribute time to application code that calls the dependency, making it hard to isolate the change. Mitigation: always run benchmarks against `HEAD~1` (the commit before the dependency update) and `HEAD` using the same profiling setup, then use flamegraph diff tools to find frames that appeared or widened. For JVM: `async-profiler --diff` mode compares two JFR recordings. For Go: `go tool pprof -diff_base old.pprof new.pprof`. If the diff implicates a third-party frame that was not present in the old profile, check the library's changelog for known performance regressions and consider pinning the previous version while reporting the issue.

### Profiling Multithreaded Code That Shows "Flat" Flamegraphs With Long Tail Latency
A service with 32 threads may have perfectly even CPU distribution across threads in the flamegraph, yet p99 latency is 10x the median. This pattern almost always indicates lock contention, thread pool exhaustion, or head-of-line blocking -- not algorithmic inefficiency. Diagnosis steps: (1) collect a thread-blocking profile (JVM: thread dump via `jstack <pid>` every 100ms for 5 seconds, then analyze with fastthread.io; Go: `/debug/pprof/goroutine` + `/debug/pprof/block`; Python: `py-spy dump --pid`). (2) Check if blocked threads are waiting on the same lock object or the same resource (database connection pool, queue, I/O multiplexer). (3) Measure the connection pool hit rate -- if > 85% of requests are waiting for a connection, the pool size is too small for the thread count (rule of thumb: pool size = (core count * 2) + effective spindle count for DB pools).

### Profiling Reveals the Hotspot Is Third-Party Code You Cannot Change
Occasionally, profiling reveals that 60% of CPU time is spent inside a library you do not own (e.g., a JSON library, an ORM, a compression library). The fix is not to modify the library directly. Strategy in priority order: (1) Reduce call frequency -- memoize/cache the result so the library is called once instead of N times per request. (2) Call the library with smaller inputs -- filter/project data before passing it to the expensive function. (3) Switch to an alternative library that provides equivalent functionality with better performance (documented with a benchmark comparison). (4) Move the work off the hot path -- pre-compute at startup or on a background goroutine and serve from memory. (5) As a last resort, vendor the library and apply a targeted patch, with a plan to upstream the fix.

---

## Example

**Input:** "My Go HTTP API is serving 300 RPS but p99 latency has climbed from 80ms to 950ms over the past two weeks. We haven't changed any application code. The service calls PostgreSQL and an internal gRPC catalog service. How do I profile this?"

**Output:**

## Performance Profiling Analysis: Go HTTP API -- Latency Regression

### Problem Statement
- **Observed metric:** p99 latency = 950ms
- **Target metric:** p99 latency ≤ 80ms (historical baseline)
- **Gap:** 11.9x regression
- **Workload:** 300 RPS, Go HTTP service, PostgreSQL dependency, internal gRPC dependency
- **Problem type:** Gradual regression (2-week timeline, no application code change)
- **Key observation:** No code change = suspect data growth, dependency change, connection pool exhaustion, or infrastructure change

---

### Profiling Tier Recommendation

| Tier | Tool | Overhead | Duration | Safe for Production? |
|------|------|----------|----------|----------------------|
| Tier 1 (metrics) | Prometheus histograms + Go runtime metrics | < 1% | Always-on | Yes |
| Tier 2 (sampling) | `net/http/pprof` CPU + block profiles | 1-3% | 30s burst | Yes |
| Tier 3 (instrumented) | Full allocation profiling (`MemProfileRate=1`) | 20-40% | 5 min | Staging only |

**Recommended starting tier:** Tier 1 first (5 minutes), then Tier 2 (30 seconds under load). The 2-week gradual pattern with no code change strongly suggests external dependency or resource saturation rather than a new algorithmic hotspot, making lightweight profiling more diagnostic than instrumented profiling at this stage.

---

### Collection Commands

```bash
# Step 1: Check Go runtime metrics to rule out GC pressure
# (Add this endpoint if not already present in main.go)
import _ "net/http/pprof"
go func() { log.Println(http.ListenAndServe("localhost:6060", nil)) }()

# Step 2: Collect goroutine blocking profile -- most likely culprit for this pattern
# Run under production-level load (300 RPS), 30-second window
curl -o block.pprof "http://localhost:6060/debug/pprof/block?seconds=30"
go tool pprof -http=:8080 block.pprof
# Look for: goroutines blocked on database/sql pool, grpc connection, or sync.Mutex

# Step 3: Collect CPU flamegraph to rule out algorithmic regression
curl -o cpu.pprof "http://localhost:6060/debug/pprof/profile?seconds=30"
go tool pprof -http=:8081 cpu.pprof
# Look for: wide frames in JSON serialization, crypto, or compression

# Step 4: Check goroutine count -- a leak manifests as monotonically growing count
curl -s "http://localhost:6060/debug/pprof/goroutine?debug=1" | head -50
# Normal: ~50-200 goroutines. Leak: thousands, growing with time.

# Step 5: Enable block profile rate before running step 2
# Add to service startup (records every blocking event -- 2-5% overhead):
runtime.SetBlockProfileRate(1)
runtime.SetMutexProfileFraction(1)
```

---

### Flamegraph Interpretation Guide

**What to look for in the blocking profile:**
- Wide `database/sql.(*DB).conn` frames = connection pool exhaustion; all goroutines waiting for a DB connection
- Wide `google.golang.org/grpc.(*clientStream).RecvMsg` frames = gRPC upstream is slow, and goroutines pile up waiting
- Wide `sync.(*Mutex).Lock` frames = lock contention inside a shared cache or rate limiter
- Wide `time.Sleep` or `runtime.selectgo` frames = goroutine leak (goroutines waiting on channels that never fire)

**Red flags specific to this timeline (2-week gradual regression):**
- `database/sql` pool exhaustion is the most common cause -- database query time increases as table grows, requests hold connections longer, pool fills up, new requests queue behind the pool
- gRPC upstream could have deployed a change that increased latency without alerting your team

---

### Hypothesis and Expected Impact

| Suspected Root Cause | Profiler Evidence to Confirm | Expected p99 Reduction | Amdahl's Limit |
|----------------------|------------------------------|------------------------|----------------|
| DB connection pool exhaustion (most likely) | Wide `database/sql.(*DB).conn` in block profile | Full recovery to 80ms | 100% if confirmed |
| Slow PostgreSQL query due to table growth (missing index) | Wide `database/sql.(*Stmt).QueryContext` + long hold time | Full recovery to 80ms | 100% if confirmed |
| gRPC upstream latency increase | Wide `grpc.RecvMsg` frames; measure with `grpc_server_handling_seconds` histogram on upstream | Partial -- depends on upstream fix | 100% if upstream is sole cause |
| Goroutine leak | Goroutine count > 1,000 and growing | Gradual recovery after fix | 100% if confirmed |

---

### Fix Implementation -- Most Likely Case: DB Connection Pool Exhaustion

```go
// DIAGNOSIS: Check current pool settings
db.SetMaxOpenConns(10)       // Default is 0 (unlimited), but many teams set this too low
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)

// DIAGNOSIS: Add pool wait metrics to confirm exhaustion
// Use db.Stats() periodically -- if WaitCount grows continuously, pool is exhausted
stats := db.Stats()
// stats.WaitCount: total times goroutines waited for a connection
// stats.WaitDuration: total time spent waiting
// stats.MaxOpenConnections: the limit you set
// If WaitCount is > 0 and growing, and InUse == MaxOpenConnections, pool is exhausted.

// FIX 1: Increase pool size (rule of thumb for Postgres: (2 * numCPU) + 1)
// For a 4-vCPU container: MaxOpenConns = 9
db.SetMaxOpenConns(9)
db.SetMaxIdleConns(9)  // Set equal to MaxOpenConns to avoid idle connection churn
db.SetConnMaxLifetime(30 * time.Minute)
db.SetConnMaxIdleTime(5 * time.Minute)

// FIX 2: Add query timeout to prevent slow queries from monopolizing connections
ctx, cancel := context.WithTimeout(r.Context(), 200*time.Millisecond)
defer cancel()
rows, err := db.QueryContext(ctx, "SELECT id, name FROM products WHERE category_id = $1", catID)
// A 200ms timeout means a slow query fails fast rather than holding a connection for 950ms.

// FIX 3: If query slowdown is confirmed via EXPLAIN ANALYZE on Postgres,
// add an index on the growing table
// Run on Postgres:
// EXPLAIN (ANALYZE, BUFFERS) SELECT id, name FROM products WHERE category_id = 5;
// If "Seq Scan" appears on a table > 10,000 rows, add a B-tree index:
// CREATE INDEX CONCURRENTLY idx_products_category_id ON products (category_id);
// CONCURRENTLY means no table lock in production.

// REGRESSION TEST: Benchmark that fails if connection wait time exceeds threshold
func BenchmarkProductQuery(b *testing.B) {
    db := setupTestDB(b)
    db.SetMaxOpenConns(9)
    b.ResetTimer()
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
            var id int
            err := db.QueryRowContext(ctx, "SELECT id FROM products WHERE category_id = $1 LIMIT 1", 1).Scan(&id)
            cancel()
            if err != nil {
                b.Fatalf("query failed: %v", err)
            }
        }
    })
    // b.N parallel goroutines simulating concurrent requests
    // If p99 latency exceeds 200ms at 300 RPS concurrency, the test setup catches it.
}
```

---

### Regression Gate

```bash
# Run benchmarks and compare against baseline (committed as bench-baseline.txt)
go test -bench=BenchmarkProductQuery -benchmem -count=10 ./... > bench-new.txt
benchstat bench-baseline.txt bench-new.txt
# Fail CI if delta > 10% (p < 0.05):
# benchstat exits 1 if the change is statistically significant and exceeds threshold
```

**Threshold:** Fail build if `BenchmarkProductQuery` mean latency regresses by more than 10% (p < 0.05 by benchstat).

**Continuous profiling:** Add Pyroscope agent to the Go service to capture weekly CPU flamegraph diffs. Configure a Grafana alert on `db_wait_duration_seconds` Prometheus metric (exported via `db.Stats()`) to page if wait time exceeds 10ms average over a 5-minute window.

---

### Before/After Metrics

| Metric | Before Fix | After Fix (projected) | Improvement |
|--------|------------|----------------------|-------------|
| p50 latency | 120ms | ~25ms | ~79% |
| p99 latency | 950ms | ~80ms | ~92% |
| DB connection wait time | 820ms avg | < 5ms | ~99% |
| Goroutine count | 850 (growing) | ~120 (stable) | Stable |
| DB `WaitCount` rate | +150/min | 0 | Eliminated |

**Note on Amdahl's Law:** In this case, the connection pool exhaustion accounts for ~87% of the p99 latency (950ms - 80ms baseline = 870ms of added latency, almost entirely from queueing). Fixing the pool size and adding the query index is sufficient to reach the 80ms target. If the fix brings p99 to 150ms rather than 80ms, the remaining gap is almost certainly in the gRPC upstream -- at which point collect a separate profile of the gRPC call latency using `grpc_server_handling_seconds` histograms on the upstream service.
