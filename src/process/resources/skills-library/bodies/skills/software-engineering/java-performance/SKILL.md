---
name: java-performance
description: |
  Guides advanced Java performance optimization: JMH benchmarking, GC tuning, heap profiling with JFR, startup time optimization, and native image compilation with GraalVM.
  Use when the user asks about Java performance, JMH, GC tuning, JFR, heap profiling, startup optimization, GraalVM native image.
  Do NOT use when the user asks about Java concurrency (use `java-concurrency-patterns`), Java modern idioms (use `java-modern-idioms`), general performance testing (use `performance-testing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "java optimization debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Java Performance

## When to Use

**Use this skill when the user asks about:**
- Diagnosing and resolving JVM performance regressions in production or staging environments
- Writing statistically valid microbenchmarks with JMH (Java Microbenchmark Harness)
- Choosing, configuring, or tuning a garbage collector (G1, ZGC, Shenandoah, Parallel GC)
- Capturing and analyzing Java Flight Recorder (JFR) recordings to find allocation hotspots, lock contention, or I/O bottlenecks
- Reducing application startup time (class loading, eager initialization, JIT warm-up)
- Building GraalVM native images for ahead-of-time compilation
- Heap sizing strategy, object lifetime analysis, or GC pause budgeting
- JVM flag tuning (heap regions, survivor spaces, TLAB sizing, code cache)
- Understanding JIT compilation tiers (C1, C2, inlining, escape analysis, on-stack replacement)

**Do NOT use this skill when the user asks about:**
- Thread safety, synchronization, or concurrent data structures -- use `java-concurrency-patterns` instead
- Modern Java language idioms (records, sealed classes, pattern matching) unrelated to performance -- use `java-modern-idioms` instead
- Load testing, stress testing, or capacity planning methodology -- use `performance-testing` instead
- General database query optimization or SQL tuning -- use `database-query-optimization` instead
- Network protocol tuning or TCP socket buffer configuration -- use `network-performance` instead

---

## Process

### 1. Establish a Reproducible Baseline

Before touching a single line of code or JVM flag, capture quantified baseline metrics that will be compared against after every change.

- **Define your SLO targets first.** Common targets: p99 latency < 50 ms, throughput > 10,000 req/s, GC pause < 20 ms, heap usage < 70% of Xmx at steady state, startup to first-request < 500 ms.
- **Run the application under realistic load** using production-representative data volumes. A benchmark that processes 100 records but production processes 10 million is meaningless. Use traffic replay tools (e.g., GoReplay) or a staging environment seeded with production data exports.
- **Record these four pillars:** CPU utilization (user + sys, not total), heap allocation rate (bytes/sec), GC pause frequency and duration (both young and old gen), and wall-clock latency at p50/p95/p99/p999.
- **Enable JFR during baseline capture.** Run with `-XX:StartFlightRecording=filename=baseline.jfr,duration=120s,settings=profile` to get a ground truth recording. The `profile` template captures allocation profiling, method sampling, lock profiling, and I/O events.
- **Document JVM version, GC algorithm, heap settings, and all non-default flags** used during baseline. A performance regression that appeared after a JDK upgrade is very different from one that appeared after a code change.
- **Do not rely on single-run measurements.** Run at least 5 iterations of warm-up followed by 10 measurement iterations and report mean ± standard deviation. This matters even for integration-level benchmarks, not just JMH.

---

### 2. Classify the Bottleneck Using Profiler Evidence

After capturing a JFR recording, or running async-profiler, classify the bottleneck before prescribing a fix. Misclassifying a memory bottleneck as CPU-bound leads to wasted optimization effort.

- **CPU-bound symptoms:** Flame graph shows hot methods consuming > 20% of CPU samples in user-space code, system CPU is low (< 10%), GC CPU overhead is low. Look for tight loops, regex compilation on every call, excessive reflection, or unboxed-to-boxed conversion in hot paths.
- **Allocation/GC-bound symptoms:** High allocation rate (> 1 GB/s is a red flag for latency-sensitive apps), frequent young GC collections (more than 1 per second for G1), high GC CPU overhead visible in JFR GC summary (> 5% of CPU). JFR `jdk.ObjectAllocationInNewTLAB` and `jdk.ObjectAllocationOutsideTLAB` events identify exact allocation sites.
- **Memory-bandwidth-bound symptoms:** CPU utilization is moderate but throughput doesn't improve with more threads, cache miss rates are high (use `perf stat` on Linux to see LLC-misses). Common cause: traversing large arrays with poor locality, or hash maps with many pointer chases.
- **Lock/contention symptoms:** JFR `jdk.JavaMonitorWait` and `jdk.ThreadPark` events show threads waiting. async-profiler's wall-clock mode (`-e wall`) reveals threads blocked on monitors. `jstack` repeatedly shows `BLOCKED` threads.
- **I/O-bound symptoms:** High `sys` CPU, threads stuck in `socketRead` or `fileRead`, JFR I/O events show blocking reads > 10 ms. Fix with connection pooling, async I/O, or caching before tuning the JVM.
- **Startup-bound symptoms (distinct from runtime):** Application is slow only for the first N seconds. JFR class loading events show thousands of classes loaded. JIT compilation events show methods being compiled that are called within the first requests.

---

### 3. Write JMH Benchmarks for Isolated Hypothesis Testing

When a specific code path is suspected as a bottleneck, write a JMH benchmark to measure it in isolation before and after the proposed fix. JMH eliminates JVM measurement artifacts (dead code elimination, constant folding, JIT warm-up effects) that make naive `System.currentTimeMillis()` benchmarks meaningless.

- **Add the JMH dependency correctly.** Use the Maven archetype: `mvn archetype:generate -DarchetypeGroupId=org.openjdk.jmh -DarchetypeArtifactId=benchmarks`. The benchmark JAR must be a fat/uber JAR with `META-INF/BenchmarkList` generated by the annotation processor.
- **Annotate benchmark methods correctly:**
  ```java
  @BenchmarkMode(Mode.AverageTime)
  @OutputTimeUnit(TimeUnit.MICROSECONDS)
  @State(Scope.Thread)
  @Warmup(iterations = 5, time = 1, timeUnit = TimeUnit.SECONDS)
  @Measurement(iterations = 10, time = 1, timeUnit = TimeUnit.SECONDS)
  @Fork(2)
  public class StringConcatBenchmark {
      @Param({"10", "100", "1000"})
      private int elementCount;
      private List<String> data;

      @Setup
      public void setup() {
          data = IntStream.range(0, elementCount)
              .mapToObj(i -> "element-" + i)
              .collect(Collectors.toList());
      }

      @Benchmark
      public String stringBuilder() {
          StringBuilder sb = new StringBuilder();
          for (String s : data) sb.append(s);
          return sb.toString();
      }

      @Benchmark
      public String stringJoiner() {
          return String.join("", data);
      }
  }
  ```
- **Consume benchmark results with `Blackhole`** to prevent dead code elimination: `public void myBenchmark(Blackhole bh) { bh.consume(result); }`. Returning a value from the benchmark method also prevents DCE.
- **Use `@Fork(2)` minimum** to get two independent JVM forks. Results from a single fork can be skewed by JIT compilation decisions specific to that JVM process.
- **Use `@State(Scope.Thread)` for mutable data** to avoid false sharing between threads when running `-t 4` or higher. Use `@State(Scope.Benchmark)` for shared read-only input data.
- **Interpret JMH output correctly.** Focus on `Score ± Error` -- an error more than 5% of the score indicates high variance and you need more iterations. Also check `GC.alloc.rate` in the secondary metrics (`-prof gc`) to detect allocation differences between implementations.
- **Run with `-prof gc` and `-prof async`** (async-profiler integration) to see allocation rates and flame graphs directly from JMH output.

---

### 4. Apply GC Tuning Based on Application Profile

GC tuning is not a single set of flags -- it is a GC algorithm selection followed by algorithm-specific knobs. Using G1 flags on a ZGC application does nothing.

- **Select the GC algorithm first based on pause budget:**
  - **G1GC (default since JDK 9):** Best for 4 GB -- 32 GB heaps, pause target configurable via `-XX:MaxGCPauseMillis=200`. Good for general-purpose microservices. Typical pause range: 20--200 ms.
  - **ZGC (production-ready since JDK 15):** Sub-millisecond pauses at scale. Use for latency-sensitive applications with heap > 8 GB. Concurrent mark, relocate, and remap. Enable with `-XX:+UseZGC`. Does not support all regions -- can use more CPU than G1.
  - **Shenandoah:** Similar to ZGC but available on OpenJDK distributions without Oracle's license. Enable with `-XX:+UseShenandoahGC`. Better at very short pause times on smaller heaps.
  - **Parallel GC:** Maximum throughput, not latency. Use for batch processing jobs where pause time is irrelevant. Enable with `-XX:+UseParallelGC`.

- **Tune G1GC heap sizing:**
  - Always set `-Xms` equal to `-Xmx` in containerized environments to prevent heap resizing pauses and prevent Linux OOM killer from triggering on sudden heap growth.
  - Set `-XX:MaxGCPauseMillis=50` for latency-sensitive services, `200` for general web apps. G1 will try to meet this target but cannot guarantee it.
  - Set `-XX:G1HeapRegionSize` to a power of 2 between 1 MB and 32 MB. For 8 GB heap: 8 MB regions. The formula: heap / 2048 regions, rounded up to power of 2.
  - Increase `-XX:G1ReservePercent=15` (default 10) if you see `Evacuation Failure` in GC logs. This reserves more headroom for G1's evacuation mechanism.
  - Enable `-XX:+G1UseAdaptiveIHOP` (default on) and set `-XX:InitiatingHeapOccupancyPercent=45` as a starting point. If Old Gen mixed GC runs too infrequently, lower to 35.

- **Tune ZGC:**
  - ZGC is mostly self-tuning. The primary knob is heap size -- give it 1.5--2x the live set size.
  - Enable `-XX:+ZGenerational` (JDK 21+) for generational ZGC, which dramatically reduces CPU overhead for allocation-heavy workloads.
  - Set `-XX:SoftMaxHeapSize` smaller than `-Xmx` to leave headroom for GC cycle overlap.
  - Use `-XX:ConcGCThreads=N` to increase concurrent GC threads if GC CPU is the bottleneck.

- **Enable and parse GC logs (essential):**
  ```
  -Xlog:gc*:file=/var/log/app/gc.log:time,uptime,level,tags:filecount=5,filesize=20m
  ```
  Parse with GCEasy or GCViewer. Key metrics: GC cause (allocation failure vs. humongous allocation vs. System.gc()), pause duration trend, promotion rate, allocation rate.

- **Eliminate humongous allocations.** In G1, objects larger than 50% of the region size (e.g., > 4 MB for 8 MB regions) go directly to the Old Gen, bypassing the Young Gen entirely. JFR's `jdk.G1HeapRegionInformation` and allocation profiling events will show this. Fix by avoiding large byte array allocations in hot paths, or increase the region size.

---

### 5. Optimize Allocation Rate and Object Lifetime

High allocation rate is the most common cause of GC pressure. The key insight: objects that die young are cheap (Eden collection), objects that get promoted are expensive.

- **Measure allocation rate first.** Add `-XX:+PrintGCDetails` (legacy) or parse JFR `jdk.GCHeapSummary` events. Allocation rate > 500 MB/s is a warning sign for latency-sensitive services.
- **Identify allocation hotspots with async-profiler:** Run `./profiler.sh -e alloc -d 30 -f heap.html <pid>`. This produces a flame graph of allocation sites, showing what percentage of bytes were allocated from each stack frame.
- **Apply object pooling selectively.** Pool objects that are: expensive to construct (e.g., `javax.xml.parsers.DocumentBuilder`, database connections, SSL contexts), long-lived, and whose identity does not matter. Do NOT pool small, cheap objects -- the pool machinery costs more than allocation. Apache Commons Pool2 is the standard library for custom pools.
- **Use thread-local caches for small mutable objects.** Pattern: `ThreadLocal<byte[]>` for temporary byte buffers in serialization code. This avoids allocation entirely for objects used only within a single method call chain on the same thread.
- **Prefer primitive arrays over boxed collections.** `int[]` of 1000 elements = ~4 KB. `ArrayList<Integer>` of 1000 elements = ~20 KB + 1000 `Integer` objects + GC overhead. In hot paths, use Eclipse Collections primitive maps/lists or manually maintain `int[]` arrays.
- **Minimize String allocation in hot paths.** `String.format()` allocates a `Formatter`, a `StringBuilder`, and intermediate strings. In hot paths, use `StringBuilder.append()` chains directly, or pre-allocate and reuse `StringBuilder` via `ThreadLocal<StringBuilder>` with a `setLength(0)` reset.
- **Understand escape analysis.** The JIT can eliminate allocations of objects that don't "escape" to the heap (are not stored in fields, not returned, not passed to unknown methods). Short-lived objects confined to a single method often get stack-allocated or completely eliminated. Help escape analysis succeed: keep methods small (under ~35 bytecodes for reliable inlining), don't mix object uses in ways that force heap promotion.
- **Value types (Project Valhalla / JDK 23+ preview):** If running JDK 23+ with value class previews enabled, declare small, immutable data holders as `value class Point { int x; int y; }` to eliminate indirection and heap allocation entirely. Not yet stable for production, but worth tracking.

---

### 6. Optimize JIT Compilation and Hot Path Execution

The JVM's JIT compiler is tiered: Tier 1 (interpreter), Tier 2-3 (C1 client compiler), Tier 4 (C2 server compiler). Most optimization happens at Tier 4.

- **Ensure hot methods reach Tier 4.** Methods compiled by C2 are far faster than C1. C2 compilation is triggered after approximately 10,000 invocations (the `-XX:CompileThreshold` default for server JVM). Do not kill and restart JVM processes too frequently in production -- warm-up takes time.
- **Check compilation log for deoptimizations.** Add `-XX:+LogCompilation -XX:+PrintCompilation` in a test environment (not production -- extremely verbose). Look for `made not entrant` and `uncommon trap` entries which indicate C2 deoptimized a method back to the interpreter. Common causes: unexpected null (add null checks earlier), unexpected type in a polymorphic call site, or class loading during compilation.
- **Limit polymorphic call sites to 2 types (bimorphic).** C2 inlines up to 2 types at a virtual call site (bimorphic inline). With 3+ types (megamorphic), it cannot inline and performance drops significantly. Avoid passing heterogeneous collections through shared hot-path methods. Profile with JFR `jdk.CompilerInlining` events.
- **Keep methods under the inlining size limit.** C2 will inline methods under approximately 35 bytecodes (configurable with `-XX:MaxInlineSize=35`). Large methods are not inlined, preventing further optimizations. Split complex methods to ensure the hot inner part is inline-eligible.
- **Use `-XX:+TieredCompilation` (default on).** Disabling it forces everything through the slower C1 compiler. Only disable for batch jobs where startup speed matters more than peak throughput.
- **Code cache sizing.** The code cache stores compiled native code. Default is 256 MB (JDK 11+). If it fills up, JVM falls back to interpretation. Monitor with JFR `jdk.CodeCache*` events. For large applications with many compiled methods, add `-XX:ReservedCodeCacheSize=512m`.
- **SIMD and auto-vectorization.** Modern C2 can auto-vectorize simple array loops using AVX2/AVX-512 instructions. Conditions: simple indexed loops (not iterator-based), no data dependencies between iterations, array length known to be a multiple of the vector width. Use `--add-opens java.base/jdk.internal.vm.vector=ALL-UNNAMED` and Vector API (JDK 16+) for explicit SIMD in latency-critical numeric code.

---

### 7. Optimize Application Startup Time

Startup time matters for serverless functions, CLI tools, microservices in autoscaling environments, and CI pipelines. The JVM's startup overhead comes from three sources: class loading, bytecode interpretation before JIT, and framework initialization.

- **Measure startup phases.** Add `-Xlog:class+load=info` to see which classes load and when. Add a timing log at `main()` entry, after framework context start, and after first request handled.
- **Reduce class loading.** Large classpath with hundreds of JARs causes slow class loading. Use jlink to create a custom JDK module with only needed modules: `jlink --add-modules java.base,java.net.http --output custom-jdk`. This can reduce startup by 100--300 ms.
- **Use CDS (Class Data Sharing).** CDS caches class metadata and bytecode in a shared archive, eliminating repeated parsing on startup.
  - Create archive: `java -Xshare:dump -XX:SharedArchiveFile=app.jsa -cp app.jar`
  - Use archive: `-Xshare:on -XX:SharedArchiveFile=app.jsa`
  - With Application CDS (JDK 10+): `-XX:+UseAppCDS` to cache application classes too. Reduces startup by 200--500 ms for typical Spring Boot apps.
- **AOT compilation with GraalVM native image.** The most aggressive startup optimization: compiles Java to a standalone native binary. Startup in < 50 ms is typical, vs. 1--5 seconds for JVM. Trade-offs: no JIT optimization at runtime (peak throughput lower than warmed JVM by 10--30%), reflection requires configuration, classpath must be closed-world.
  - Build: `native-image -jar app.jar --no-fallback -H:+ReportExceptionStackTraces --initialize-at-build-time=com.example.Config`
  - Configure reflection: generate `reflect-config.json` via the tracing agent: `java -agentlib:native-image-agent=config-output-dir=META-INF/native-image -jar app.jar`
  - Configure resources: `resource-config.json` for classpath resources accessed at runtime.
  - Use GraalVM 22.3+ (JDK 17 base) or 23.0+ (JDK 21 base) for production. Earlier versions have significant missing feature support.
- **Lazy initialization in frameworks.** Spring Boot: add `spring.main.lazy-initialization=true` to defer all bean creation until first use. Can cut startup by 30--50% for large applications but increases first-request latency.
- **Ahead-of-time compilation for JVM (not native).** JDK 21+ includes `java.lang.compiler` (preview). More practical: use GraalVM's JIT-only mode with `native-image` PGO (Profile-Guided Optimization) to capture a JFR recording, then feed it back to native-image: `native-image --pgo=profile.iprof ...`. This brings native image throughput within 5--10% of peak JVM throughput.

---

### 8. Validate, Document, and Regression-Guard Optimizations

- **Run the full test suite** after every optimization, not just unit tests -- performance changes often introduce subtle behavioral differences (e.g., `HashMap` iteration order dependence, `ThreadLocal` state leaks, changed exception paths).
- **Compare JFR recordings before/after.** Use JDK Mission Control (JMC) to diff two recordings. Look for changes in: allocation rate, GC pause frequency/duration, method CPU time distribution.
- **Add JMH benchmarks to CI.** Use the JMH `BenchmarkResult` JSON output mode (`-rf json -rff results.json`) and compare against a stored baseline. Alert if any benchmark degrades by more than 5%. Tools: JMH Visualizer, or custom CI scripts comparing JSON outputs.
- **Add a performance budget to your build.** For GraalVM native image builds, track binary size (alert if > 10% increase) and startup time (alert if > 50 ms increase) in CI.
- **Document every JVM flag in a committed configuration file.** Each non-default flag must have a comment explaining: why it was added, what problem it solved, what value was measured before/after, and when it was last re-evaluated. Unexplained JVM flags accumulate technical debt and often become outdated with JDK upgrades.
- **Re-evaluate GC tuning on every major JDK upgrade.** Defaults and behaviors change significantly between major versions. G1GC in JDK 21 is materially different from JDK 11. Run full baseline capture after every upgrade.

---

## Output Format

When responding to a Java performance question, structure the output as follows:

```
## Java Performance Analysis: [Problem Area]

### Bottleneck Classification
| Symptom                          | Observed Value     | Threshold     | Classification  |
|----------------------------------|--------------------|---------------|-----------------|
| GC pause duration (p99)          | [value] ms         | < 50 ms       | [Pass/Fail]     |
| Allocation rate                  | [value] MB/s       | < 500 MB/s    | [Pass/Fail]     |
| CPU usage (user)                 | [value] %          | < 70%         | [Pass/Fail]     |
| Heap occupancy at steady state   | [value] % of Xmx   | < 70%         | [Pass/Fail]     |
| Young GC frequency               | [value] /sec       | < 1/sec       | [Pass/Fail]     |

**Root Cause:** [Single sentence describing the primary bottleneck]

---

### Recommended GC Configuration
```bash
# GC algorithm selection: [reason]
-XX:+UseG1GC                        # Or ZGC/Shenandoah -- explain choice
-Xms4g -Xmx4g                       # Fixed heap to prevent resizing pauses
-XX:MaxGCPauseMillis=50             # Latency target
-XX:G1HeapRegionSize=8m             # Heap / 2048, rounded to power of 2
-XX:G1ReservePercent=15             # Extra headroom for evacuation
-XX:InitiatingHeapOccupancyPercent=40  # Trigger mixed GC earlier
-XX:+G1UseAdaptiveIHOP              # Let G1 refine IHOP dynamically
-Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=20m
```

---

### JFR Capture Command
```bash
java -XX:StartFlightRecording=filename=analysis.jfr,duration=120s,settings=profile \
     -XX:FlightRecorderOptions=stackdepth=128 \
     [other JVM flags] \
     -jar app.jar
```

Key events to examine in JMC:
- `jdk.ObjectAllocationInNewTLAB` -- top allocation sites by bytes
- `jdk.JavaMonitorEnter` -- lock contention hot spots
- `jdk.GCPauseL2` -- individual GC pause breakdown
- `jdk.ExecutionSample` -- CPU flame graph

---

### Code-Level Optimization
**Before:**
```java
// [original code with problem annotated]
```
**After:**
```java
// [optimized code with explanation of change]
```
**Expected Impact:** [specific, measured prediction, e.g., "reduces allocation rate by ~40% based on JMH results"]

---

### JMH Benchmark (if applicable)
```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Thread)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
@Fork(2)
public class [Name]Benchmark {
    // State fields
    // @Setup method
    // @Benchmark methods (baseline and optimized)
}
```

---

### Validation Checklist
- [ ] Full test suite passing
- [ ] JFR recording captured post-optimization
- [ ] Allocation rate improved by [X]% in JFR
- [ ] GC pause p99 within [N] ms target
- [ ] JMH benchmark confirms [X]% improvement
- [ ] JVM flags documented with rationale
- [ ] CI benchmark regression gate added
```

---

## Rules

1. **NEVER recommend JVM flags without stating the GC algorithm they apply to.** Many flags are GC-specific -- `-XX:G1HeapRegionSize` is meaningless with ZGC. Always pair flags with their applicable GC context.

2. **NEVER optimize without a JFR recording or async-profiler output in hand.** Intuition-based JVM tuning is unreliable. A 60-second JFR profile recording with `settings=profile` is mandatory before prescribing any fix.

3. **NEVER set `-Xms` lower than `-Xmx` in containerized or production environments.** Heap resizing pauses can take hundreds of milliseconds and cause unexpected latency spikes. Always set them equal.

4. **NEVER use `System.currentTimeMillis()` or `System.nanoTime()` loops as benchmarks.** JIT will constant-fold, dead-code eliminate, or fail to warm up the code under test. Use JMH exclusively for microbenchmarks.

5. **NEVER use `-XX:+DisableExplicitGC` without understanding why `System.gc()` is being called.** If third-party libraries call `System.gc()` for a reason (e.g., NIO direct buffer reclamation), disabling it silently causes off-heap memory accumulation. Investigate the call site first.

6. **NEVER recommend object pooling for objects that are small and cheaply constructed.** The synchronization overhead and indirection of a pool often exceed the cost of allocation + GC for small objects. Pool only: database connections, SSL sessions, large byte arrays (> 64 KB), expensive-to-initialize objects like XML parsers.

7. **ALWAYS specify JDK version when recommending features.** ZGC generational mode requires JDK 21+. CDS Application archives require JDK 10+. Vector API requires JDK 16+. GraalVM native image PGO requires GraalVM 22.2+. Never give a recommendation that silently requires a version the user may not have.

8. **NEVER recommend GraalVM native image for applications that rely heavily on dynamic class loading, runtime bytecode generation (CGLIB, ByteBuddy), or extensive reflection without first confirming that the tracing agent has been run.** These applications require significant configuration work and may not be fully compatible.

9. **ALWAYS identify humongous allocations separately from ordinary allocation rate.** Humongous objects (> 50% of G1 region size) bypass Young GC entirely and cause concurrent marking overhead. They require a different fix (larger regions or avoiding large allocations in hot paths) than ordinary high allocation rate.

10. **NEVER treat GC tuning as one-time work.** Every JDK major version upgrade, heap size change, traffic pattern change, or new dependency may invalidate previous tuning. Enforce a policy of recapturing JFR baselines after every JDK upgrade and after any traffic pattern change greater than 20%.

---

## Edge Cases

### Running in Kubernetes/Container with cgroup v2 Limits
JDK 11+ reads cgroup v2 CPU and memory limits correctly with `-XX:+UseContainerSupport` (default on JDK 11+). However, several issues remain:
- If the container `--memory-limit` is set to 1 GB but the JVM sets `-Xmx` to 75% of that (768 MB), other JVM memory regions (Metaspace, native memory, code cache, thread stacks) consume the remaining space. A common OOMKill scenario: `-Xmx768m` but total process RSS reaches 1.2 GB due to Metaspace and off-heap. Add `-XX:MaxMetaspaceSize=256m` and `-XX:ReservedCodeCacheSize=128m` explicitly to bound non-heap memory.
- For containers with CPU limits (e.g., 2 CPU), the JVM's `-XX:ParallelGCThreads` and `-XX:ConcGCThreads` are calculated from the host CPU count (e.g., 64) not the cgroup limit, causing GC thread oversubscription. Set explicitly: `-XX:ParallelGCThreads=2 -XX:ConcGCThreads=1`.

### Legacy Application with Synchronized-Heavy Code (Pre-Java-5 Patterns)
Applications using `synchronized` on shared `Hashtable`, `Vector`, or `StringBuffer` throughout the codebase will show lock contention in JFR before any GC or allocation issue is visible. The fix is not GC tuning -- it is replacing `Hashtable` with `ConcurrentHashMap`, `Vector` with `CopyOnWriteArrayList` or `ArrayList` with external locking, `StringBuffer` with `StringBuilder`. Measure contention with JFR's `jdk.JavaMonitorEnter` events filtered to duration > 1 ms to identify the worst offenders. Prioritize those. Do not attempt a full rewrite -- fix the hottest 3--5 contended monitors and re-profile.

### GraalVM Native Image with Spring Boot / Quarkus / Micronaut
Framework-managed dependency injection and AOP proxies are the hardest part of native image compilation. Quarkus and Micronaut are designed for native image and generate reflection configs at build time -- prefer these for greenfield native image projects. Spring Boot 3.x with GraalVM support (Spring AOT) is production-ready but requires:
- Replacing CGLIB proxies with JDK dynamic proxies (`spring.aop.proxy-target-class=false` where interface exists)
- Annotating all `@Configuration` classes with `@Configuration(proxyBeanMethods = false)` where possible
- Running `./gradlew nativeCompile` to trigger Spring AOT processing before native-image step
- Expect 5--20 minutes build time for non-trivial applications. This is normal and acceptable for CI/CD pipelines with build caching.

### JIT Compilation Instability (Deoptimization Storms)
Symptom: application runs fast for 10 minutes, then suddenly throughput drops by 50% for 30 seconds, then recovers. Cause: a C2-compiled method is deoptimized (e.g., a new class is loaded that breaks a type assumption), re-interpreted, then re-compiled. During recompilation, the method runs in the interpreter, which is 10--100x slower. Fix:
- Enable `-XX:+PrintDeoptimization` in a test environment to see which methods deoptimize and why.
- Avoid loading classes after application startup in hot code paths (lazy class loading triggered by a rare branch in a hot method can cause this).
- If a method repeatedly deoptimizes on a null check, add an early explicit null guard to prevent the uncommon trap from triggering.
- Consider `-XX:CompileThreshold=1000` to reach C2 faster during warm-up, reducing the window of time spent in interpreter after startup.

### Large Heap (> 32 GB) and Compressed OOP Breakdown
With heaps up to 32 GB, the JVM uses compressed ordinary object pointers (OOPs), storing 32-bit references instead of 64-bit. Above 32 GB (specifically 32,760 MB for 8-byte alignment), compressed OOPs are disabled, and all object references double in size from 4 bytes to 8 bytes. This causes:
- 10--20% increase in heap usage (all reference fields and array elements grow)
- More cache misses (larger object graphs)
- Higher GC cost
If your heap is between 28 GB and 48 GB, seriously consider keeping it below 32 GB (set `-Xmx31g`) to retain compressed OOPs. The throughput benefit of compressed OOPs often exceeds the benefit of the additional heap.

### Off-Heap Memory Accumulation (Direct ByteBuffers, Unsafe, JNI)
Applications using `ByteBuffer.allocateDirect()`, `sun.misc.Unsafe.allocateMemory()`, or JNI-allocated native memory can leak memory that never appears in heap metrics. Symptoms: RSS (resident set size) grows unboundedly, but JVM heap metrics are stable. Diagnosis:
- Use JFR's `jdk.DirectBufferStatistics` event to track `DirectByteBuffer` count and capacity.
- Use `jcmd <pid> VM.native_memory` (with `-XX:NativeMemoryTracking=summary` enabled at startup) to see all JVM memory categories.
- For JNI leaks, use Valgrind or AddressSanitizer (Linux) on the native library.
- Fix: ensure `DirectByteBuffer` objects are dereferenced to allow GC-triggered `Cleaner` finalization, or call `((DirectBuffer) buf).cleaner().clean()` explicitly after use.

### Microbenchmark Showing Unexpected Performance Cliff at Power-of-2 Boundary
A benchmark parameterized with array sizes `512, 1024, 2048, 4096` shows good performance at 2048 but suddenly poor performance at 4096. This is typically a CPU cache associativity conflict -- power-of-2 sized arrays map to the same cache set entries, causing L1/L2 thrashing. Fix: pad array sizes by a small prime (e.g., use 4096 + 7 = 4103 elements). This also appears with hash map capacities -- never use power-of-2 initial capacities if you're inserting power-of-2 numbers of elements. Document this finding in benchmark code comments as it is non-obvious to future readers.

---

## Example

**User Input:** "Our Spring Boot microservice handles 5,000 req/s normally, but GC pauses are causing p99 latency spikes to 800 ms every 30 seconds. We're on JDK 17 with 16 GB heap using default G1 settings. How do I diagnose and fix this?"

---

## Java Performance Analysis: G1GC Pause Spikes in High-Throughput Microservice

### Bottleneck Classification

| Symptom                        | Observed Value  | Threshold    | Classification |
|--------------------------------|-----------------|--------------|----------------|
| GC pause duration (p99)        | 800 ms          | < 50 ms      | FAIL           |
| GC pause frequency             | Every 30 sec    | Variable     | Investigate    |
| Heap size                      | 16 GB           | --           | OK             |
| JDK version                    | 17              | 11+          | OK             |
| GC algorithm                   | G1 (default)    | --           | OK for tuning  |

**Root Cause (Hypothesized):** G1's mixed GC cycles are running too late (high IHOP) and doing too much work at once, combined with possible humongous allocations causing concurrent marking overhead. Default `-XX:MaxGCPauseMillis=200` is too lenient for a latency-sensitive service.

---

### Step 1: Capture JFR to Confirm Hypothesis

Run this in production for 2 minutes during peak load:

```bash
java \
  -XX:StartFlightRecording=filename=/tmp/app-perf.jfr,duration=120s,settings=profile \
  -XX:FlightRecorderOptions=stackdepth=128 \
  -XX:+UseG1GC \
  -Xms16g -Xmx16g \
  -Xlog:gc*:file=/tmp/gc.log:time,uptime,level,tags:filecount=3,filesize=10m \
  -jar app.jar
```

**In JDK Mission Control, examine:**
1. `GC` tab -- confirm pause type: Full GC (bad), G1 Mixed GC (expected but long), G1 Young GC (frequent + long)
2. `jdk.ObjectAllocationInNewTLAB` -- top 5 allocation sites by bytes/sec
3. `jdk.G1HeapRegionInformation` -- look for `HUMONGOUS` regions
4. `jdk.JavaMonitorEnter` -- rule out lock contention as a confounding factor

**Expected findings given the symptoms:** Mixed GC pauses of 600--800 ms indicate that G1 is reclaiming many Old Gen regions per cycle. This happens when IHOP fires too late, Old Gen is too full before mixed GC begins, and G1 must collect aggressively to avoid promotion failure.

---

### Step 2: Corrected GC Configuration

```bash
# G1GC tuned for < 50 ms pause target on 16 GB heap, JDK 17

# Heap: fixed size to prevent resizing pauses
-Xms16g
-Xmx16g

# GC algorithm
-XX:+UseG1GC

# Pause target: 50 ms for latency-sensitive service (was 200 ms default)
-XX:MaxGCPauseMillis=50

# Region size: 16 GB / 2048 = 8 MB, already a power of 2 -- correct
-XX:G1HeapRegionSize=8m

# Trigger concurrent marking earlier to avoid full Old Gen before mixed GC
# Default IHOP is ~45%; lower it to 35% to give G1 more time to reclaim
-XX:InitiatingHeapOccupancyPercent=35
-XX:+G1UseAdaptiveIHOP

# Reserve more heap for evacuation to prevent Evacuation Failure
-XX:G1ReservePercent=20

# Spread mixed GC work across more cycles (reduce work per pause)
-XX:G1MixedGCLiveThresholdPercent=65   # Only collect regions with < 65% live data
-XX:G1MixedGCCountTarget=16            # Spread reclaimation across 16 mixed GCs (up from 8)
-XX:G1HeapWastePercent=5               # Stop mixed GC when < 5% of heap is reclaimable

# Code cache and Metaspace bounds to prevent non-heap OOM
-XX:ReservedCodeCacheSize=256m
-XX:MaxMetaspaceSize=256m

# GC logging (mandatory for post-change validation)
-Xlog:gc*,gc+humongous=debug:file=/var/log/app/gc.log:time,uptime,level,tags:filecount=5,filesize=20m

# Disable explicit GC from NIO/libraries (only if no direct buffer cleanup depends on it)
# -XX:+DisableExplicitGC  -- DO NOT enable until verifying no DirectByteBuffer dependency
```

---

### Step 3: Investigate Humongous Allocations

The `+gc+humongous=debug` log flag will print lines like:
```
[info][gc,humongous] GC(42) Live humongous region 47, object size 12582912 bytes
```
An object of 12 MB in an 8 MB region heap is a humongous object. This allocation bypasses Young GC entirely and triggers concurrent marking.

**If humongous allocations are found in JFR (`jdk.ObjectAllocationOutsideTLAB` with size > 4 MB):**

Look for the allocation in your code. Common culprits:
- JSON deserialization into `byte[]` for large payloads (> 4 MB)
- Kafka consumer `ConsumerRecord.value()` for large messages
- JDBC `ResultSet` byte columns

**Fix for large byte array hotspot:**

```java
// BEFORE: allocates a new byte[] per request -- may be humongous for large payloads
public ResponseEntity<byte[]> handleRequest(HttpServletRequest req) throws IOException {
    byte[] body = req.getInputStream().readAllBytes(); // may allocate 8-50 MB byte[]
    return process(body);
}

// AFTER: stream directly to avoid large intermediate allocation
public ResponseEntity<Void> handleRequest(HttpServletRequest req,
                                           HttpServletResponse resp) throws IOException {
    try (InputStream in = req.getInputStream();
         OutputStream out = resp.getOutputStream()) {
        processStream(in, out); // pipeline through 64KB chunks
    }
    return ResponseEntity.ok().build();
}

// If byte[] is unavoidable, use a pooled buffer:
private static final ThreadLocal<byte[]> BUFFER_POOL =
    ThreadLocal.withInitial(() -> new byte[65536]); // 64 KB, not humongous

public void processStream(InputStream in, OutputStream out) throws IOException {
    byte[] buf = BUFFER_POOL.get(); // reuse, no allocation
    int n;
    while ((n = in.read(buf)) != -1) {
        transform(buf, n, out);
    }
}
```

**Expected impact:** Eliminating humongous allocations reduces concurrent marking overhead and stops triggering premature Old Gen growth. Mixed GC frequency may drop by 50--70%.

---

### Step 4: Validate with JMH Benchmark for Allocation-Critical Path

If profiling shows the JSON deserialization itself is the allocation hotspot (not just the byte array), benchmark the deserializer options:

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Thread)
@Warmup(iterations = 5, time = 2, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 10, time = 2, timeUnit = TimeUnit.SECONDS)
@Fork(value = 2, jvmArgsAppend = {"-Xms512m", "-Xmx512m", "-XX:+UseG1GC"})
public class JsonDeserializeBenchmark {

    private ObjectMapper jacksonMapper;
    private JsonbConfig jsonbConfig;
    private byte[] samplePayload;

    @Setup(Level.Trial)
    public void setup() throws Exception {
        jacksonMapper = new ObjectMapper();
        // configure once, reuse -- ObjectMapper is thread-safe
        jacksonMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

        // Generate 500 KB realistic payload
        samplePayload = generateRealisticPayload(512 * 1024);
    }

    @Benchmark
    public OrderRecord jacksonTree() throws Exception {
        return jacksonMapper.readValue(samplePayload, OrderRecord.class);
    }

    @Benchmark
    public OrderRecord jacksonStreaming() throws Exception {
        try (JsonParser p = jacksonMapper.createParser(samplePayload)) {
            return parseWithStreaming(p); // manual streaming parse, fewer intermediate objects
        }
    }
}
```

Run with: `java -jar benchmarks.jar -prof gc -prof async:output=flamegraph -rf json -rff results.json`

The `-prof gc` output will show allocation rate difference:
```
Benchmark                        Score   Error  Units   gc.alloc.rate
jacksonTree                      843     ±12    us/op   1240.3 MB/s
jacksonStreaming                  921     ±18    us/op    287.4 MB/s
```

The streaming parser is slightly slower in raw throughput but allocates 75% less memory, which directly reduces GC pressure.

---

### Step 5: Post-Optimization Validation

Capture a second JFR recording with identical load after applying GC flag changes and code fixes:

```bash
java -XX:StartFlightRecording=filename=/tmp/app-tuned.jfr,duration=120s,settings=profile \
     [new flags from Step 2] \
     -jar app.jar
```

**Compare recordings in JMC:**

| Metric                       | Before Tuning  | After Tuning   | Change       |
|------------------------------|----------------|----------------|--------------|
| GC pause p99                 | 800 ms         | 38 ms          | -95%         |
| Mixed GC duration (avg)      | 620 ms         | 35 ms          | -94%         |
| Allocation rate              | 1,240 MB/s     | 310 MB/s       | -75%         |
| Humongous allocations/min    | 45             | 0              | -100%        |
| Old Gen occupancy at trigger | 78% of 16 GB   | 35% of 16 GB   | Triggered earlier |
| p99 request latency          | 800 ms         | 28 ms          | -97%         |

---

### Validation Checklist

- [x] Full integration test suite passing after code changes
- [x] JFR recording captured under production-like load post-optimization
- [x] GC pause p99 within 50 ms target
- [x] Allocation rate reduced from 1,240 MB/s to 310 MB/s
- [x] Zero humongous allocations confirmed in GC debug log
- [x] JMH benchmark confirms streaming parser allocation reduction
- [x] All JVM flags documented with rationale in `jvm-flags.md`
- [x] CI pipeline updated with JFR-based regression gate (alert if GC pause p99 > 60 ms)
- [x] GC tuning re-evaluation scheduled after next JDK upgrade

---

### JVM Flags Documentation (committed to source control as `jvm-flags.md`)

```markdown
# JVM Flag Rationale -- app-service

Last updated: [date], JDK 17.0.9, G1GC
Next review: After any JDK upgrade or > 20% traffic growth

| Flag                                    | Value | Reason                                      | Measured Benefit           |
|-----------------------------------------|-------|---------------------------------------------|----------------------------|
| -Xms / -Xmx                            | 16g   | Fixed to prevent resizing pauses            | Eliminates 50-200ms spikes |
| -XX:MaxGCPauseMillis                    | 50    | Latency SLO < 50ms p99                      | p99 dropped from 800→38ms  |
| -XX:G1HeapRegionSize                    | 8m    | 16GB / 2048 regions, power-of-2             | Structural, prevents humongous |
| -XX:InitiatingHeapOccupancyPercent      | 35    | Earlier mixed GC trigger, less work/cycle   | Mixed GC pause 620→35ms    |
| -XX:G1MixedGCCountTarget               | 16    | Spread reclamation, reduce per-pause work   | Part of mixed GC improvement |
| -XX:G1ReservePercent                    | 20    | Prevent Evacuation Failure at high load     | No EF events in 7 days     |
| -XX:ReservedCodeCacheSize              | 256m  | Prevent code cache overflow for large app   | Monitoring -- no overflow  |
| -XX:MaxMetaspaceSize                    | 256m  | Bound non-heap memory in container          | Container RSS stable       |
```
