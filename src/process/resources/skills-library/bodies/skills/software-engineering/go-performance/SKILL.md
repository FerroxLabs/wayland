---
name: go-performance
description: |
  Guides expert-level Go performance optimization: pprof profiling, escape analysis, allocation optimization, GOMAXPROCS tuning, and benchmarking with testing.B.
  Use when the user asks about Go performance, pprof, escape analysis, allocation optimization, GOMAXPROCS, Go benchmarks, memory profiling.
  Do NOT use when the user asks about Go idioms (use `go-idioms`), Go concurrency (use `go-concurrency-patterns`), general performance testing (use `performance-testing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "go optimization debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Go Performance

## When to Use

**Use this skill when the user asks about:**
- Profiling a Go application with `pprof` -- CPU profiles, heap profiles, goroutine profiles, mutex profiles, or block profiles
- Escape analysis output from `go build -gcflags="-m"` and how to interpret or fix allocation decisions
- Reducing heap allocations in hot paths -- `sync.Pool`, value semantics, pre-allocated slices, avoiding interface boxing
- `GOMAXPROCS` tuning for specific deployment environments (containers, NUMA hardware, latency-sensitive services)
- Writing and interpreting Go benchmarks with `testing.B` -- `b.ReportAllocs()`, `b.SetBytes()`, sub-benchmarks, benchmark profiling
- GC pressure reduction -- tuning `GOGC`, `GOMEMLIMIT`, understanding GC pacing, reducing live heap size
- Memory layout optimization -- struct field ordering, cache line alignment, false sharing between goroutines
- Compiler optimizations -- inlining decisions, bounds check elimination, dead code elimination

**Do NOT use this skill when:**
- The user asks about Go idioms, naming, or code style -- use `go-idioms`
- The user asks about goroutines, channels, select, or concurrency patterns -- use `go-concurrency-patterns`
- The user asks about general load testing, k6, wrk, or HTTP benchmarking -- use `performance-testing`
- The user asks about Go module management, versioning, or dependency resolution -- use `go-modules`
- The user asks about debugging logical bugs, nil pointer panics, or runtime errors (not performance-related) -- use `go-debugging`
- The user asks about database query optimization or ORM performance -- use `database-optimization`
- The user asks about network I/O performance independent of Go runtime behavior -- use `network-optimization`

---

## Process

### 1. Establish a Profiling Baseline

Before touching a single line of code, capture quantitative ground truth.

- **Enable pprof endpoints** for long-running services by importing `_ "net/http/pprof"` and exposing an HTTP server on a debug port (e.g., `:6060`). This registers handlers at `/debug/pprof/` automatically.
- **For batch programs or CLIs**, use `pprof.StartCPUProfile(f)` / `pprof.StopCPUProfile()` and `pprof.WriteHeapProfile(f)` around the hot section.
- **Collect the right profile type** for the symptom:
  - High CPU usage -- CPU profile (`/debug/pprof/profile?seconds=30`)
  - High memory or frequent GC -- heap profile (`/debug/pprof/heap`)
  - Goroutine leaks or stalls -- goroutine profile (`/debug/pprof/goroutine`)
  - Lock contention -- mutex profile (requires `runtime.SetMutexProfileFraction(1)`) and block profile (requires `runtime.SetBlockProfileRate(1)`)
  - Scheduler latency -- trace (`/debug/pprof/trace?seconds=5`) analyzed with `go tool trace`
- **Use `go tool pprof`** to analyze profiles interactively: `go tool pprof -http=:8080 cpu.prof` opens a browser UI with flame graphs, top functions, and source annotations.
- **Record wall-clock baselines** before any change: p50, p95, p99 latency, requests-per-second, and `runtime.ReadMemStats` values (HeapAlloc, NumGC, PauseTotalNs).

### 2. Classify the Bottleneck with Profiling Evidence

Do not guess. Let the profiling data drive classification.

- **CPU-bound** if a function appears at the top of the pprof `top` output consuming >20% of CPU, especially in tight loops or string/slice manipulation. Look for `runtime.mallocgc` in the CPU profile -- its presence indicates allocation cost is masquerading as CPU cost.
- **Allocation-bound (GC pressure)** if `runtime.mallocgc` and `runtime.gcBgMarkWorker` consume significant CPU shares, or if `NumGC` in MemStats is >1 GC per second under load, or if heap profile shows a single function responsible for >30% of allocations.
- **Memory-bound** if working set exceeds L3 cache (typically 8--32 MB on server hardware) and the CPU profile shows high time in cache-miss-prone code. Use `perf stat` or `GODEBUG=gccheckmark=1` as supplemental signals.
- **Goroutine contention** if the mutex or block profile shows a lock held for >100 microseconds at high frequency. Look for `sync.Mutex`, `sync.RWMutex`, and channel send/receive as blocking sites.
- **Scheduler latency** if `go tool trace` shows long goroutine runqueue wait times (>1ms) or stop-the-world GC pauses visible in the trace view.
- **I/O-bound** if pprof shows time dominated by `syscall.Read`, `syscall.Write`, or network poll functions. In this case, the optimization path is buffering, batching, or connection pooling -- not Go-level tuning.

### 3. Eliminate Unnecessary Allocations

Allocation reduction is the highest-leverage optimization in most Go programs because every allocation eventually costs GC time.

- **Run escape analysis**: `go build -gcflags="-m=2" ./...`. Variables that "escape to heap" are the candidates. Variables that do NOT escape are stack-allocated and free.
- **Understand the main escape triggers**:
  - Returning a pointer to a local variable
  - Storing a value in an interface (interface boxing always allocates if the concrete type is >1 pointer word and not a scalar)
  - Appending to a slice whose capacity is unknown at compile time
  - Closures capturing outer variables
  - Values passed to `fmt.Sprintf`, `fmt.Println` (interface varargs)
- **Replace `fmt.Sprintf` in hot paths** with `strconv.AppendInt`, `strconv.AppendFloat`, or manual byte-slice building to avoid `interface{}` boxing and the format string parser overhead.
- **Pre-allocate slices** when the final size is known: `make([]T, 0, expectedLen)` avoids repeated doubling reallocations. Each reallocation copies the entire backing array.
- **Use `sync.Pool`** for objects that are frequently allocated and discarded (e.g., `bytes.Buffer`, large temporary slices, decoder structs). Pool objects are reclaimed between GC cycles, not within a request. Always reset pooled objects before returning them to the pool. Never store pointers to Pool-sourced objects across GC cycles.
- **Prefer value receivers and value semantics** for small structs (<=3 pointer-sized fields). Passing a small struct by value keeps it on the stack; passing a pointer may cause it to escape.
- **Use `[]byte` instead of `string` concatenation** in loops. String concatenation with `+` allocates a new string each iteration. Use `strings.Builder` or `bytes.Buffer` instead, then call `.String()` once at the end.

### 4. Optimize CPU-Bound Hot Paths

Once allocations are under control, optimize actual computation.

- **Verify inlining decisions** with `go build -gcflags="-m"`. Functions are NOT inlined if they contain: loops, closures, function literals assigned to variables, calls to `recover()`, or if their AST node budget exceeds ~80 nodes (the exact threshold is runtime-version dependent). Restructure hot functions to fall under the inlining budget if the inlining gain is worth the readability cost.
- **Eliminate bounds checks** in tight loops by assigning the slice length to a local variable before the loop: `n := len(s); for i := 0; i < n; i++ { ... }`. The compiler can then prove the index is in bounds and elide the check. Verify with `go build -gcflags="-d=ssa/check_bce/debug=1"`.
- **Use `unsafe.Slice` and `unsafe.String`** (Go 1.17+) for zero-copy conversion between `[]byte` and `string` in hot serialization paths -- but only when the lifetime of the result does not outlive the source, and document with a safety comment.
- **Profile branch prediction impact** with `go tool trace` or `perf`. Avoid highly unpredictable branches inside tight loops -- sorting input data or restructuring conditionals can improve branch prediction rates.
- **Avoid interface dispatch in hot loops.** Calling a method through an interface involves two pointer dereferences (itab lookup + method call). In a loop executing 10^8 times, this is measurable. Use concrete types or generics (Go 1.18+) to eliminate dynamic dispatch.
- **Consider SIMD via assembly** only after all other optimizations are exhausted, and only if the function is genuinely compute-intensive (e.g., hashing, encoding, matrix operations). Use `golang.org/x/sys/cpu` to detect CPU features and provide a pure-Go fallback.

### 5. Tune GC and Memory Parameters

The Go GC is a concurrent, tricolor mark-and-sweep collector. Its behavior is tunable.

- **`GOGC` (default: 100)**: Sets the GC target as a percentage. `GOGC=100` means GC triggers when heap size doubles from the last collection. Increase `GOGC` (e.g., `GOGC=200`) to reduce GC frequency at the cost of higher peak memory. Decrease it (e.g., `GOGC=50`) to reduce peak memory at the cost of more frequent GC. For latency-sensitive services, try `GOGC=off` combined with `GOMEMLIMIT` (Go 1.19+).
- **`GOMEMLIMIT` (Go 1.19+)**: Sets a soft memory limit for the Go runtime (e.g., `GOMEMLIMIT=512MiB`). This prevents OOM kills in containerized environments by aggressively triggering GC before the limit is hit. Set this to ~90% of the container memory limit. Combine with `GOGC=off` to eliminate periodic GC and rely solely on memory pressure to trigger collection -- this is effective for throughput-focused services with predictable memory usage.
- **Reduce live heap size**: GC pause time and frequency scale with live heap. Eliminate long-lived caches, reduce buffering, and expire data aggressively.
- **Use `runtime.GC()` strategically** after one-time startup operations that generate temporary allocations (loading config, parsing templates) to return heap to steady state before serving traffic.
- **Monitor GC metrics**: Use `runtime.ReadMemStats` or `expvar` to track `NumGC`, `PauseTotalNs`, `GCCPUFraction`, and `HeapInuse`. A `GCCPUFraction` above 0.05 (5%) indicates GC overhead is significant.

### 6. Tune GOMAXPROCS and Scheduler Behavior

`GOMAXPROCS` controls how many OS threads run Go code simultaneously.

- **Default behavior**: Since Go 1.5, `GOMAXPROCS` defaults to the number of logical CPUs reported by the OS. This is correct for bare-metal deployments.
- **Container environments**: Containers often have CPU limits set via cgroups (e.g., `--cpus=2.0`), but the Go runtime reads `/proc/cpuinfo` or `sysconf(_SC_NPROCESSORS_ONLN)`, which reports the host's total CPU count. This causes over-scheduling. Use `uber-go/automaxprocs` or `runtime.GOMAXPROCS(runtime.NumCPU())` combined with reading cgroup CPU quota from `/sys/fs/cgroup/cpu/cpu.cfs_quota_us` and `/sys/fs/cgroup/cpu/cpu.cfs_period_us`. The `automaxprocs` package handles this automatically.
- **Latency-sensitive services**: Setting `GOMAXPROCS` to less than the available CPUs can reduce scheduler thrashing and improve p99 latency by reducing context switching. Benchmark both directions.
- **CPU-pinning and NUMA**: For NUMA-sensitive workloads (e.g., HPC, real-time processing), use `numactl --cpunodebind=0` to restrict the process to a single NUMA node, and set `GOMAXPROCS` to the number of cores on that node.
- **`GODEBUG=schedtrace=1000`**: Prints scheduler state every 1000ms. Use it to detect goroutine runqueue buildup, which indicates either too few threads (increase `GOMAXPROCS`) or lock contention (reduce contention).

### 7. Write and Interpret Benchmarks

Benchmarks are only useful if they measure the right thing with statistical rigor.

- **Basic benchmark structure**: Functions must be `func BenchmarkFoo(b *testing.B)` in `_test.go` files. The loop body runs `b.N` times, where the testing framework auto-scales `b.N` until the total time exceeds 1 second.
- **Always call `b.ReportAllocs()`** to surface allocations-per-operation and bytes-per-operation. This is equivalent to using `-benchmem` but applies per benchmark regardless of flag.
- **Use `b.SetBytes(n)`** when benchmarking throughput (encoding, hashing, parsing): it causes the output to report MB/s, making comparison across implementations intuitive.
- **Prevent dead-code elimination**: Assign results to a package-level `var sink interface{}` or use `runtime.KeepAlive(result)` to prevent the compiler from optimizing away the entire computation.
- **Use `b.ResetTimer()`** after expensive setup code (reading test fixtures, building large data structures) so setup time does not inflate per-operation measurements.
- **Use sub-benchmarks** (`b.Run("size=1000", func(b *testing.B) {...})`) to test across input sizes and generate scaling data. This reveals whether an optimization is O(1), O(n), or has a hidden quadratic component.
- **Use `benchstat`** (from `golang.org/x/perf/cmd/benchstat`) to compare two sets of benchmark runs statistically. Run each benchmark at least 10 times (`go test -bench=. -count=10`) and pass both output files to `benchstat old.txt new.txt`. It reports p-values and confidence intervals to distinguish real improvements from noise.
- **Profile benchmarks directly**: `go test -bench=BenchmarkFoo -cpuprofile=cpu.prof` generates a pprof profile for the benchmark run. This combines measurement and profiling in one step.

### 8. Validate, Document, and Regress

Optimization without regression prevention is temporary.

- **Run the full test suite** (`go test ./... -race`) after every optimization. The race detector catches data races introduced by concurrency changes made during optimization.
- **Add the benchmark to CI** using `benchstat` comparisons against a stored baseline. Alert on regressions >5% in throughput or >10% in allocation count.
- **Document the optimization** with a comment that includes: the problem observed, the profiling evidence (e.g., "heap profile showed 40% of allocations from parseToken"), the technique applied, and the before/after metric.
- **Commit benchmark outputs** alongside code changes. Store `benchstat` baseline files in `testdata/benchmarks/` so future reviewers can reproduce comparisons.
- **Set `GOGC` and `GOMEMLIMIT` values** in deployment configuration with comments explaining the values, not buried in code. Changes to these values should go through the same review process as code changes.

---

## Output Format

When analyzing a Go performance problem, structure the response as:

```
## Go Performance Analysis: [component or function name]

### Symptom Summary
- Observed behavior: [e.g., "p99 latency spikes to 200ms under load"]
- Environment: Go [version], [OS/arch], [deployment context]
- Workload: [RPS, concurrent goroutines, data sizes]

### Profiling Command Used
[Exact commands run to collect the profile]

### Profile Findings
| Rank | Function | Flat% | Cum% | Profile Type |
|------|----------|-------|------|--------------|
| 1    | [func]   | [n%]  | [n%] | CPU / Heap   |
| 2    | [func]   | [n%]  | [n%] | CPU / Heap   |
| 3    | [func]   | [n%]  | [n%] | CPU / Heap   |

### Bottleneck Classification
- Primary type: [CPU-bound | Allocation-bound | GC-pressure | Goroutine contention | I/O-bound]
- Root cause: [Specific diagnosis, e.g., "interface boxing of []byte in fmt.Sprintf call in hot path"]
- Evidence: [pprof line reference, escape analysis output, or MemStats value]

### Optimization Plan
| Step | Technique | Expected Gain | Risk |
|------|-----------|---------------|------|
| 1    | [technique] | [e.g., 30% alloc reduction] | [Low/Med/High] |
| 2    | [technique] | [e.g., 2x throughput]       | [Low/Med/High] |

### Code Change
[Before code snippet]
[After code snippet]

### Benchmark Results
```
BenchmarkFoo/before   1000000   1245 ns/op   512 B/op   8 allocs/op
BenchmarkFoo/after    1000000    312 ns/op    64 B/op   1 allocs/op
```
benchstat: -75% ns/op (p=0.001), -87.5% B/op

### Memory Stats Comparison
| Metric         | Before    | After     | Change   |
|----------------|-----------|-----------|----------|
| HeapAlloc      | 450 MB    | 120 MB    | -73%     |
| NumGC (per min)| 48        | 12        | -75%     |
| GCCPUFraction  | 0.12      | 0.03      | -75%     |
| PauseTotalNs   | 180ms     | 45ms      | -75%     |

### Configuration Changes
- GOGC: [old value] → [new value] (rationale: ...)
- GOMEMLIMIT: [old value] → [new value] (rationale: ...)
- GOMAXPROCS: [old value] → [new value] (rationale: ...)

### Regression Prevention
- Benchmark added: [yes/no, benchmark name]
- Test suite: PASS (go test ./... -race)
- Baseline stored: [testdata/benchmarks/foo_baseline.txt]
```

---

## Rules

1. **Never optimize without a profile.** "This looks slow" is not evidence. The Go compiler and runtime make surprising optimization decisions. Code that looks like it allocates often does not; code that looks cheap often is not. Only `pprof` output constitutes valid evidence for optimization.

2. **Never interpret escape analysis output without the `-m=2` flag.** The single `-m` flag shows decisions but not reasons. `-m=2` shows the full reasoning chain (e.g., "parameter leaks to result" vs. "assigned to interface"). Understanding the reason is required to fix it correctly.

3. **Never use `sync.Pool` for objects with pointer-containing fields that reference external resources** (file handles, network connections, database cursors). Pool objects are released between GC cycles without finalizers running. Use `sync.Pool` only for pure data buffers.

4. **Never benchmark with `b.N = 1` loops that contain only a single operation without a `sink` variable.** The compiler's dead-code elimination and escape analysis will optimize away the computation, making the benchmark measure zero real work. Always store results in a package-level `var Sink` variable.

5. **Never set `GOMAXPROCS` below 1 or above the available logical CPU count without documented justification.** Setting it above the logical CPU count does not improve throughput and increases scheduler overhead. Setting it to 1 eliminates parallelism and is only correct for single-core targets or debugging.

6. **Never recommend `GOGC=off` without simultaneously setting `GOMEMLIMIT`.** Disabling GC without a memory limit causes unbounded heap growth and OOM kills. The two settings are a pair: `GOGC=off` + `GOMEMLIMIT=<90% of container limit>`.

7. **Never use `unsafe` for performance without measuring the actual gain.** `unsafe` operations (pointer arithmetic, `unsafe.Slice`, `unsafe.String`) eliminate safety guarantees. They are only justified when profiling shows the safe version is the measured bottleneck AND the unsafe version shows a statistically significant improvement in `benchstat` output.

8. **Never micro-optimize struct field order without verifying cache line behavior.** Reordering struct fields to minimize padding (use `fieldalignment` from `golang.org/x/tools/go/analysis/passes/fieldalignment`) can reduce struct size, but if the struct is accessed concurrently from multiple goroutines, placing hot fields in the same cache line causes false sharing. Measure both memory usage and mutex/atomic contention together.

9. **Always run benchmarks with `-count=10` minimum before using `benchstat`.** A single benchmark run is not statistically meaningful -- Go benchmarks have variance from GC timing, OS scheduling, and CPU frequency scaling. Fewer than 5 runs makes `benchstat` p-values unreliable.

10. **Never conflate heap profile "inuse_space" with "alloc_space".** `inuse_space` shows current live allocations -- what is consuming memory right now. `alloc_space` shows cumulative allocations since program start -- where allocation pressure is coming from. High `alloc_space` with low `inuse_space` indicates objects are being allocated and freed rapidly (GC pressure). High `inuse_space` indicates a memory leak or large long-lived cache. Use the correct view for the problem being diagnosed.

---

## Edge Cases

### Container CPU Quota Misconfiguration
In Kubernetes or Docker, a pod with `resources.limits.cpu: "2"` has a cgroup CPU quota, but the Go runtime by default reads the host's logical CPU count (e.g., 64 cores on a large node) and sets `GOMAXPROCS=64`. This causes 64 OS threads competing for 2 CPU shares, resulting in severe scheduler thrashing, elevated p99 latency, and CPU throttling visible in container metrics as `container_cpu_cfs_throttled_seconds_total`. Fix: add `uber-go/automaxprocs` as the first import in `main.go` (`import _ "go.uber.org/automaxprocs"`). It reads cgroup CPU quota and sets `GOMAXPROCS` correctly at startup. Verify with `GOMAXPROCS` logged at startup.

### GC Pauses Spiking Under Bursty Load
When a service receives a burst of requests, it allocates a large amount of memory quickly. The GC triggers when heap doubles, causing a concurrent mark phase that competes with the request-handling goroutines for CPU. The symptom is p99/p999 latency spikes that correlate with `NumGC` spikes in metrics. The fix is not to tune `GOGC` lower (that makes it worse). Instead: (1) reduce allocation volume in the hot path using the techniques in Step 3; (2) set `GOMEMLIMIT` to trigger GC based on absolute memory pressure rather than heap doubling; (3) pre-warm the pool before serving traffic by calling `runtime.GC()` after startup initialization to return the heap to steady state.

### `sync.Pool` Causing Latency Jitter
`sync.Pool` objects are cleared at every GC cycle. In services with frequent GC, this means pooled objects are frequently evicted, and pool `Get()` calls frequently allocate new objects -- eliminating the pool's benefit. Diagnosis: add a counter to the pool `New` function and monitor it. If `New` is called at the same rate as `Get`, the pool is not helping. Fix: reduce GC frequency first (via allocation reduction or `GOGC` tuning). Alternatively, for objects that survive across GC cycles, consider a hand-rolled free list protected by a mutex, or a channel-based pool with a fixed capacity.

### Interface Pollution in Hot Paths (Accidental Boxing)
A common pattern that causes hidden allocations: a function accepts `interface{}` or `any` parameters (e.g., a logging function, a metrics recorder, a middleware handler). Every call to that function boxes the concrete argument onto the heap. Diagnosis: escape analysis shows "argument escapes to heap" at the call site, and the heap profile shows the logging/metrics call as a top allocator. Fixes in order of preference: (1) use typed parameters where the interface is not necessary; (2) use generics (Go 1.18+) to specialize the function for common types; (3) use `zap`-style structured logging with typed fields (`zap.Int("count", n)`) instead of `fmt.Sprintf`-style; (4) add a fast path that skips the expensive operation when a condition is false (e.g., `if !logger.Enabled(level) { return }`).

### False Sharing in Concurrent Data Structures
When two goroutines on different cores concurrently access different fields of the same struct, and those fields land in the same 64-byte cache line, every write by one goroutine invalidates the cache line for the other. This causes cache coherence traffic that does not show up as lock contention in pprof -- it appears as mysterious CPU overhead in atomic operations. Diagnosis: use `perf c2c` on Linux to detect cache-to-cache transfers. Fix: pad hot fields to 64-byte boundaries using a `[64]byte` padding field, or separate per-goroutine state into independent cache-line-aligned structs. Example: `type padded struct { value int64; _ [56]byte }` ensures `value` occupies its own cache line.

### String/[]byte Conversion Overhead in Serialization
JSON encoding and HTTP header handling frequently convert between `string` and `[]byte`. Each conversion in the safe model allocates a new backing array. In a high-throughput HTTP service, this can account for 20--40% of all allocations. Diagnosis: heap profile shows `[]byte` allocations in serialization code. Fixes: (1) use `json.Marshal` into a pre-allocated `bytes.Buffer` obtained from `sync.Pool`; (2) use a faster JSON library that avoids intermediate allocations (e.g., one that uses code generation to serialize directly to a writer); (3) where correctness can be guaranteed (the `[]byte` is not mutated and does not outlive the `string`), use the unsafe conversion pattern: `s := *(*string)(unsafe.Pointer(&b))` -- but document the safety invariant explicitly in a comment.

### Benchmark Results Not Reflecting Production Performance
A benchmark shows 5x improvement, but production p99 latency improves by only 10%. Common causes: (1) the benchmark is CPU-isolated and does not model GC interruptions -- add `runtime.GC()` calls within the benchmark loop to simulate GC pressure; (2) the benchmark uses small, cache-hot data while production uses large, cache-cold data -- increase input size to exceed L3 cache; (3) the optimized path is not the actual bottleneck in the production request -- re-profile production under real load to confirm the optimized function is still in the top 5 of the CPU profile; (4) the optimization introduced lock contention under concurrent load -- benchmark with `b.RunParallel` to expose concurrency behavior.

---

## Example

**Input:** "Our Go HTTP service handles JSON decoding of incoming requests. Under load, we see p99 latency of 180ms (target: 20ms) and heap usage of 800MB on a pod with a 1GB limit. The service runs on Kubernetes with `cpu: 2`, but the node has 32 cores. How do I diagnose and fix this?"

**Output:**

## Go Performance Analysis: HTTP Request JSON Decoding

### Symptom Summary
- Observed behavior: p99 latency 180ms (9x above 20ms target); heap 800MB on 1GB pod limit
- Environment: Go 1.21, linux/amd64, Kubernetes pod (2 CPU limit, 32-core node)
- Workload: ~5,000 RPS, JSON decode on every request, average payload 4KB

### Profiling Command Used

```bash
# Step 1: Enable pprof in main.go (already present via net/http/pprof import)
# Step 2: Collect profiles under load
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/profile?seconds=30
go tool pprof -http=:8081 http://localhost:6060/debug/pprof/heap

# Step 3: Collect scheduler trace to inspect GC pause and GOMAXPROCS impact
curl http://localhost:6060/debug/pprof/trace?seconds=5 -o trace.out
go tool trace trace.out

# Step 4: Check MemStats via expvar endpoint
curl http://localhost:6060/debug/vars | jq '.memstats'
```

### Profile Findings

**CPU Profile (30-second sample):**

| Rank | Function | Flat% | Cum% | Profile Type |
|------|----------|-------|------|--------------|
| 1    | `runtime.gcBgMarkWorker` | 28% | 28% | CPU |
| 2    | `encoding/json.(*decodeState).object` | 18% | 31% | CPU |
| 3    | `runtime.mallocgc` | 14% | 42% | CPU |
| 4    | `encoding/json.indirect` | 9%  | 51% | CPU |
| 5    | `runtime.memmove` | 7%  | 58% | CPU |

**Heap Profile (alloc_space -- cumulative allocations):**

| Rank | Function | alloc_space% | Profile Type |
|------|----------|--------------|--------------|
| 1    | `encoding/json.(*decodeState).object` | 44% | Heap |
| 2    | `bytes.(*Buffer).WriteString` | 12% | Heap |
| 3    | `fmt.Sprintf` (in request logger) | 11% | Heap |
| 4    | `http.Header.Set` (string conversion) | 8%  | Heap |

**MemStats at time of capture:**

```
HeapAlloc:      780 MB
NumGC:          61 per minute (>1 per second)
GCCPUFraction:  0.28   ← 28% of CPU is GC -- critical
PauseTotalNs:   420ms accumulated over 30s
GOMAXPROCS:     32     ← reading host CPUs, not cgroup limit
```

### Bottleneck Classification
- **Primary type:** Allocation-bound (GC pressure)
- **Secondary type:** GOMAXPROCS misconfiguration causing scheduler thrashing
- **Root cause:** `encoding/json` decoder allocates a new `map[string]interface{}` and a new `string` for every JSON key and value. With 5,000 RPS at 4KB average payload, this produces ~500 MB/s of allocation throughput. GC cannot keep up, using 28% of CPU. Simultaneously, `GOMAXPROCS=32` causes 32 OS threads competing for 2 CPU shares, inflating all latencies.
- **Evidence:** `gcBgMarkWorker` at 28% CPU + `NumGC=61/min` + `GCCPUFraction=0.28` confirm GC is the primary cost. `GOMAXPROCS=32` on a 2-CPU cgroup pod is confirmed by `runtime.GOMAXPROCS(0)` returning 32 at startup.

### Optimization Plan

| Step | Technique | Expected Gain | Risk |
|------|-----------|---------------|------|
| 1 | Fix `GOMAXPROCS` via `automaxprocs` | 20--40% latency reduction | Low |
| 2 | Set `GOMEMLIMIT=900MiB` + `GOGC=off` | Eliminate periodic GC, prevent OOM | Low |
| 3 | Decode JSON into typed structs, not `map[string]interface{}` | 60--80% alloc reduction in decoder | Low |
| 4 | Pool `json.Decoder` via `sync.Pool` | 10--20% alloc reduction | Low |
| 5 | Replace `fmt.Sprintf` in logger hot path | 11% heap reduction | Low |

### Code Changes

**Fix 1: GOMAXPROCS (main.go)**

```go
// Before: GOMAXPROCS defaults to 32 (host CPUs), ignoring cgroup limit
import (
    "net/http"
    _ "net/http/pprof"
)

// After: automaxprocs reads cgroup quota and sets GOMAXPROCS=2
import (
    "net/http"
    _ "net/http/pprof"
    _ "go.uber.org/automaxprocs" // sets GOMAXPROCS=2 from cgroup cpu quota
)
```

**Fix 2: GOMEMLIMIT + GOGC (deployment config or main.go init)**

```go
// In main() before serving traffic:
import (
    "runtime/debug"
)

func main() {
    // 900 MiB = ~90% of 1 GiB pod limit
    // GOGC=off: rely on GOMEMLIMIT pressure, not heap doubling
    debug.SetMemoryLimit(900 * 1024 * 1024)
    debug.SetGCPercent(-1) // equivalent to GOGC=off

    // Force a GC after initialization to return startup allocations
    runtime.GC()

    startServer()
}
```

**Fix 3: Typed struct decoding instead of `map[string]interface{}`**

```go
// Before: decodes into generic map, allocates a string for every key and value
func handleRequest(r *http.Request) error {
    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        return err
    }
    // access payload["user_id"], payload["action"], etc.
}

// After: decodes into typed struct -- compiler-known layout, no map allocations
type RequestPayload struct {
    UserID    int64  `json:"user_id"`
    Action    string `json:"action"`
    Timestamp int64  `json:"timestamp"`
    // ... other fields
}

var decoderPool = sync.Pool{
    New: func() interface{} {
        return json.NewDecoder(nil)
    },
}

func handleRequest(r *http.Request) error {
    var payload RequestPayload

    dec := decoderPool.Get().(*json.Decoder)
    dec.Reset(r.Body)
    err := dec.Decode(&payload)
    decoderPool.Put(dec)

    if err != nil {
        return err
    }
    // access payload.UserID, payload.Action directly
}
```

**Fix 5: Replace `fmt.Sprintf` in logger hot path**

```go
// Before: fmt.Sprintf boxes all arguments into []interface{}, allocates result string
func logRequest(method, path string, status int, duration time.Duration) {
    msg := fmt.Sprintf("method=%s path=%s status=%d duration=%s",
        method, path, status, duration)
    logger.Info(msg)
}

// After: use structured logging with typed fields (zero allocations for scalar types)
func logRequest(method, path string, status int, duration time.Duration) {
    logger.Info("request",
        zap.String("method", method),
        zap.String("path", path),
        zap.Int("status", status),
        zap.Duration("duration", duration),
    )
}
```

### Benchmark Results

```
# Run with: go test -bench=BenchmarkDecode -benchmem -count=10 > after.txt
# Compare:  benchstat before.txt after.txt

BenchmarkDecode/map_interface    1200    982450 ns/op   18432 B/op   312 allocs/op
BenchmarkDecode/typed_struct     8800    136100 ns/op    2048 B/op    14 allocs/op
BenchmarkDecode/typed_pool      12000     98300 ns/op     512 B/op     3 allocs/op

benchstat: typed_struct vs map_interface:
  ns/op:     -86.2% (p=0.000)
  B/op:      -88.9% (p=0.000)
  allocs/op: -95.5% (p=0.000)
```

### Memory Stats Comparison (production, same load)

| Metric          | Before    | After     | Change |
|-----------------|-----------|-----------|--------|
| HeapAlloc       | 780 MB    | 95 MB     | -88%   |
| NumGC (per min) | 61        | 0*        | -100%  |
| GCCPUFraction   | 0.28      | 0.02*     | -93%   |
| PauseTotalNs    | 420ms/30s | 12ms/30s  | -97%   |
| GOMAXPROCS      | 32        | 2         | fixed  |
| p99 latency     | 180ms     | 14ms      | -92%   |

*GC now triggered only by GOMEMLIMIT pressure, not periodically. Occasional GC runs
when heap approaches 900MiB limit; this occurs ~2 times per minute at peak load.

### Configuration Changes
- `GOMAXPROCS`: 32 → 2 via `automaxprocs` (matches cgroup cpu quota of 2.0)
- `GOMEMLIMIT`: unset → 900 MiB (90% of 1GiB pod limit, prevents OOM kill)
- `GOGC`: 100 → -1 (disabled, memory pressure from GOMEMLIMIT drives GC instead)

### Regression Prevention
- Benchmarks added: `BenchmarkDecode/typed_struct`, `BenchmarkDecode/typed_pool`
- Baseline stored: `testdata/benchmarks/decode_baseline.txt`
- Test suite: `go test ./... -race` -- PASS (0 races detected)
- CI check: `benchstat` alert configured for >10% regression in `ns/op` or `allocs/op`
- Startup log: `GOMAXPROCS=2 (from cgroup quota 2.0)` confirmed in pod logs
