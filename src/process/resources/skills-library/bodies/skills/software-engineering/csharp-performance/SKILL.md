---
name: csharp-performance
description: |
  Guides advanced .NET performance optimization: Span<T> and Memory<T> usage, BenchmarkDotNet, allocation profiling with dotMemory, source generators, and high-performance patterns.
  Use when the user asks about C# performance, Span, Memory, BenchmarkDotNet, allocation profiling, source generators, high-performance .NET.
  Do NOT use when the user asks about C# async (use `csharp-async-patterns`), C# modern idioms (use `csharp-modern-idioms`), general performance testing (use `performance-testing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "csharp optimization debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# C# Performance Optimization

## When to Use

**Use this skill when the user:**
- Asks about reducing heap allocations in C# -- including boxing, closure captures, LINQ overhead, or excessive `new` expressions
- Wants to use `Span<T>`, `Memory<T>`, `ReadOnlySpan<T>`, or `ArrayPool<T>` to avoid heap pressure in hot paths
- Needs to set up BenchmarkDotNet to measure method-level throughput, memory allocations, or JIT behavior
- Asks about profiling tools -- dotMemory, PerfView, dotTrace, EventPipe, or `dotnet-counters` -- to find allocation hotspots or GC pressure
- Wants to use source generators, `Unsafe`, `MemoryMarshal`, or `NativeMemory` for ultra-low-overhead patterns
- Is hitting GC pauses (Gen2 collections, LOH fragmentation) and needs to redesign object lifecycles
- Asks about value types, `ref struct`, `readonly struct`, struct layout, or `[StructLayout]` packing
- Wants to optimize string handling -- `StringPool`, `SearchValues<T>`, `Regex` compilation, or `CompositeFormat`
- Asks about SIMD via `System.Numerics.Vector<T>` or `System.Runtime.Intrinsics` for data-parallel computation
- Is writing library code targeting `netstandard2.1` or `net8+` and needs to understand API availability trade-offs

**Do NOT use this skill when:**
- The user asks about `async`/`await`, `ValueTask`, `IAsyncEnumerable`, or `ConfigureAwait` -- use `csharp-async-patterns`
- The user asks about C# 10--13 language features, pattern matching, records, or init-only setters in general -- use `csharp-modern-idioms`
- The user needs load testing, k6, Gatling, or HTTP-level throughput testing -- use `performance-testing`
- The user asks about EF Core query optimization, N+1 queries, or compiled queries -- use `efcore-performance`
- The user is asking about general algorithm complexity theory without a C# implementation context -- use a general algorithms skill
- The user asks about containerization, Kubernetes resource limits, or cloud scaling -- those are infrastructure concerns

---

## Process

### Step 1: Establish a Profiling-First Foundation

Before writing a single line of optimized code, build a measurement baseline.

- **Select the right tool for the bottleneck type:**
  - Allocation profiling: JetBrains dotMemory, or `dotnet-gcdump` + PerfView for allocation call trees
  - CPU hotspot profiling: JetBrains dotTrace (Timeline mode), PerfView (CPU stacks), or `perf` on Linux with `dotnet-trace`
  - GC diagnostics: `dotnet-counters monitor --counters System.Runtime` to watch `gen-0-gc-count`, `gen-1-gc-count`, `gen-2-gc-count`, `loh-size`, and `alloc-rate` in real time
  - Quick micro-benchmarks: BenchmarkDotNet with `[MemoryDiagnoser]` and `[DisassemblyDiagnoser]`
  - Production telemetry: EventPipe via DiagnosticPort or OpenTelemetry metrics with `System.Runtime` meters

- **Run the application under a realistic workload** -- never profile with toy data. For web services, replay production traffic via a captured HTTP archive or use a load generator targeting p95 latency scenarios.

- **Capture a baseline snapshot before ANY change.** In dotMemory: take a "Get Snapshot" after stabilization. In PerfView: collect a `.etl` file for 30--60 seconds under load. In BenchmarkDotNet: commit the baseline results to version control as a `.csv` or use `--exporters json`.

- **Identify the top-3 allocation sites by bytes retained, not just bytes allocated.** Allocated bytes tell you about throughput pressure; retained bytes identify leaks and LOH survivors.

- **Check the GC mode.** Server GC (`<GarbageCollectionAdaptationMode>`) allocates per-logical-core heaps and is nearly always correct for ASP.NET Core services. Workstation GC is correct for desktop or CLI tools. Mixing them causes unexpected pause behavior.

---

### Step 2: Classify the Bottleneck with a Decision Framework

Once profiling data exists, classify the root cause before selecting an optimization.

- **Allocation pressure / GC churn:** Gen0 collection rate > 10/sec in a server app, or `alloc-rate` consistently above 100 MB/s with no corresponding throughput -- reduce allocations, pool objects, use `Span<T>`.

- **LOH fragmentation:** Objects >= 85,000 bytes land on the Large Object Heap and are not compacted by default. Symptoms: `loh-size` growing monotonically, `gen-2-gc-count` spiking. Fix: pool large buffers via `ArrayPool<byte>.Shared`, or enable LOH compaction with `GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce` before a single critical GC.

- **CPU hotspot in tight loop:** If a single method consumes >5% of CPU samples and is called millions of times, consider: algorithmic improvement first, then `Span<T>` to remove bounds checks, then SIMD vectorization, then `unsafe` pointer arithmetic as a last resort.

- **String allocation dominance:** Strings are immutable reference types. If string operations dominate allocations, evaluate: `string.Create<TState>()`, `StringBuilderPool`, `ReadOnlySpan<char>` slicing instead of `Substring`, `SearchValues<char>` for membership tests, and `CompositeFormat` (net8+) to avoid repeated format string parsing.

- **Reflection or dynamic dispatch overhead:** If profiling shows `Invoke`, `GetMethod`, `CreateInstance`, or interface dispatch in hot paths, replace with source generators, cached delegates, `MethodTable` tricks via `Unsafe.As`, or `DynamicMethod`-based IL emit (only if source generators are not viable).

- **Contention / false sharing:** If CPU utilization is high but throughput is low and you see lock contentions in profiling, check: lock striping, `ConcurrentDictionary`, `Interlocked` operations, and cache-line-aligned struct layout using `[StructLayout(LayoutKind.Explicit)]` with 64-byte padding fields.

---

### Step 3: Reduce Allocations with Span, Memory, and Pooling

This is the highest-leverage optimization category in modern .NET.

- **`Span<T>` basics:** `Span<T>` is a `ref struct` that wraps a contiguous region of memory -- stack, heap, or native. Because it is a `ref struct`, it cannot be boxed, stored on the heap, or used across `await` points. Use it for synchronous, stack-confined processing of arrays, strings (`ReadOnlySpan<char>`), or stack-allocated memory (`stackalloc`).

- **`stackalloc` thresholds:** Stack space is ~1 MB on most OS thread configurations. A practical safe limit for `stackalloc` is 256--1024 bytes for value types. For anything larger, fall back to `ArrayPool<T>.Shared.Rent(size)`. Always use the pattern:
  ```csharp
  const int StackAllocThreshold = 256;
  byte[]? pooled = null;
  Span<byte> buffer = size <= StackAllocThreshold
      ? stackalloc byte[size]
      : (pooled = ArrayPool<byte>.Shared.Rent(size));
  try { /* use buffer */ }
  finally { if (pooled is not null) ArrayPool<byte>.Shared.Return(pooled); }
  ```

- **`Memory<T>` for async contexts:** When you need to pass a buffer across an `await` boundary, use `Memory<T>` or `ReadOnlyMemory<T>`. These are regular structs (not `ref struct`) that wrap the same contiguous memory. Call `.Span` to get a `Span<T>` inside a synchronous scope.

- **`ArrayPool<T>` correctness rules:** Always `Return` the rented array even on exception (use `try/finally`). Never use a returned array -- zero it first with `clearArray: true` if it contains sensitive or stale data. Never cache `Span<T>` views of a rented array beyond the return call.

- **`MemoryPool<T>` vs `ArrayPool<T>`:** `MemoryPool<T>` returns an `IMemoryOwner<T>` that implements `IDisposable` -- better for encapsulating ownership in `using` blocks. `ArrayPool<T>` is lower overhead and appropriate when lifetime is tightly controlled in a single method.

- **`MemoryMarshal` for zero-copy reinterpretation:** `MemoryMarshal.Cast<TFrom, TTo>()` reinterprets a `Span<TFrom>` as `Span<TTo>` without copying -- useful for reading network protocol headers from a `byte[]` buffer as a struct.

- **Avoid `ToArray()` and `ToString()` in hot paths.** These always allocate. Prefer accepting `ReadOnlySpan<char>` parameters in your own APIs, and use `TryFormat(Span<char>, ...)` overloads on numeric types.

---

### Step 4: Benchmark with BenchmarkDotNet Correctly

BenchmarkDotNet is the standard C# micro-benchmarking framework. Misuse produces misleading results.

- **Minimum viable benchmark setup:**
  ```csharp
  [MemoryDiagnoser]
  [DisassemblyDiagnoser(maxDepth: 3)]
  [SimpleJob(RuntimeMoniker.Net80)]
  public class ParseBenchmarks
  {
      private readonly string _input = new string('a', 1024);

      [Benchmark(Baseline = true)]
      public int SubstringParse() => ParseWithSubstring(_input);

      [Benchmark]
      public int SpanParse() => ParseWithSpan(_input.AsSpan());
  }
  ```
  Run with `dotnet run -c Release --project Benchmarks`. Never run benchmarks in `Debug` configuration -- the JIT does not optimize debug builds and results are meaningless.

- **`[Params]` for realistic size coverage:**
  ```csharp
  [Params(16, 256, 4096, 65536)]
  public int InputSize { get; set; }
  ```
  Always include at least one small size (fits in L1 cache, ~32 KB), one medium (fits in L2/L3, ~256 KB--8 MB), and one large size (exceeds cache, forces memory bandwidth). Performance characteristics often invert across these tiers.

- **`[GlobalSetup]` for pre-warming:** Allocate test data in `[GlobalSetup]` to exclude setup cost from measurements. Never allocate inside `[Benchmark]` methods unless allocation is the thing being measured.

- **Interpret `[MemoryDiagnoser]` output:** The `Allocated` column shows bytes allocated per operation (not total). A benchmark showing `0 B` means no managed heap allocation occurred -- this is the target for `Span<T>`-based hot paths. `Gen 0`, `Gen 1`, `Gen 2` columns show GC collections per 1000 operations.

- **Statistical validity:** BenchmarkDotNet runs a configurable number of warmup iterations (default 15) and measured iterations (default 100). For high-variance results, increase with `[SimpleJob(warmupCount: 30, iterationCount: 200)]`. Check the `Error` and `StdDev` columns -- a StdDev/Mean ratio above 5% indicates environmental noise; run on an isolated machine or use `--affinity` CPU pinning.

- **`[DisassemblyDiagnoser]`** produces the JIT-emitted x86/ARM64 assembly. Use it to verify: bounds-check elimination (look for absent `cmp`/`jae` pairs), SIMD vectorization (look for `vmovdqu`, `vpaddw`, `vpcmpeqb`), and that the JIT did not box value types (look for `call [mscorlib]System.Object::ToString`).

---

### Step 5: Eliminate JIT and Runtime Overhead with Advanced Patterns

After allocation reduction, these techniques address CPU-level costs.

- **`readonly struct`:** Declare structs `readonly` when all fields are `readonly`. This allows the JIT to pass the struct by reference internally without defensive copies. Without `readonly`, any call to a non-`readonly` method on a struct copied from a `readonly` field or `in` parameter triggers a silent defensive copy.

- **`in` parameters for large structs:** Passing a struct larger than 16 bytes by value copies it. Use `in` to pass by readonly reference: `void Process(in LargeStruct s)`. Combine with `ref readonly` returns to avoid copies on return paths.

- **`ref` returns and `ref` locals:** Enables zero-copy access to array elements or struct fields:
  ```csharp
  ref int element = ref data[index]; // no copy
  element += delta;                  // modifies in-place
  ```

- **`[SkipLocalsInit]` attribute:** By default, the CLR zero-initializes all local variables. `[SkipLocalsInit]` (applied to a method or module) skips this, saving cycles when you have many large stack-allocated buffers. Only safe when you guarantee initialization before first read. Apply at method level, not module level, unless you audit every method.

- **Aggressive inlining:** The JIT inlines methods below approximately 32 IL bytes automatically. For hot path methods just above this threshold, add `[MethodImpl(MethodImplOptions.AggressiveInlining)]`. Avoid applying this to large methods -- it increases code size and can harm instruction-cache efficiency. Verify with `[DisassemblyDiagnoser]` that inlining actually occurred.

- **`AggressiveOptimization`:** `[MethodImpl(MethodImplOptions.AggressiveOptimization)]` tells the JIT to spend more time optimizing a method (Tier 2 immediately). Use on known-hot, stable methods.

- **Avoid virtual dispatch in hot loops:** Interface calls and virtual method calls require an indirect jump through the MethodTable. In tight loops processing known concrete types, prefer: generics with struct constraints (the JIT monomorphizes the generic, eliminating virtual dispatch), or sealed classes (the JIT can devirtualize sealed types).

---

### Step 6: Apply SIMD and Vectorization

SIMD (Single Instruction, Multiple Data) processes multiple data elements per CPU instruction -- 4x to 32x throughput for bulk numeric or byte operations.

- **Check hardware support first:**
  ```csharp
  if (Vector.IsHardwareAccelerated)
      ProcessVectorized(data);
  else
      ProcessScalar(data);
  ```

- **`System.Numerics.Vector<T>`** is the portable SIMD API. `Vector<T>.Count` gives the number of elements per vector (16 for `Vector<byte>` on AVX2, 8 for `Vector<int>`). Use it for sum-of-squares, dot products, element-wise operations on arrays:
  ```csharp
  var sum = Vector<int>.Zero;
  int vectorSize = Vector<int>.Count;
  int i = 0;
  for (; i <= data.Length - vectorSize; i += vectorSize)
      sum += new Vector<int>(data, i);
  int result = Vector.Dot(sum, Vector<int>.One);
  // handle tail elements [i..data.Length)
  ```

- **`System.Runtime.Intrinsics`** gives direct access to AVX2, SSE4.2, ARM NEON, etc. Only use when `Vector<T>` cannot express the operation (e.g., byte shuffle, population count, horizontal min/max). Always guard with `Avx2.IsSupported` or `Sse42.IsSupported` and provide a scalar fallback.

- **`SearchValues<T>` (net8+):** For searching a small fixed set of characters or bytes in a large span -- e.g., URL parsing, CSV tokenization -- `SearchValues<char>` compiles to vectorized scanning automatically. Faster than `IndexOfAny` for sets of 5+ elements.
  ```csharp
  private static readonly SearchValues<char> s_delimiters =
      SearchValues.Create(",;\t\r\n");
  int idx = span.IndexOfAny(s_delimiters);
  ```

- **Always handle tail elements.** Vectorized loops process `N - (N % vectorWidth)` elements. The remaining `N % vectorWidth` elements must be processed with a scalar tail loop. Failing to do so is a silent correctness bug.

---

### Step 7: Use Source Generators to Eliminate Reflection

Reflection-based serialization, logging, and mapping are among the most common hidden allocation sources in .NET applications.

- **System.Text.Json source generation:** Replace runtime reflection with compile-time generated serializers:
  ```csharp
  [JsonSerializable(typeof(OrderDto))]
  [JsonSerializable(typeof(List<OrderDto>))]
  internal partial class AppJsonContext : JsonSerializerContext { }

  // Usage:
  string json = JsonSerializer.Serialize(order, AppJsonContext.Default.OrderDto);
  ```
  This eliminates reflection, reduces startup time, and is AOT-compatible. In hot-path HTTP handlers this can reduce serialization allocations by 60--80%.

- **Microsoft.Extensions.Logging compile-time log messages:** Replace `_logger.LogInformation("User {UserId} logged in", userId)` (which boxes the userId and allocates a string) with:
  ```csharp
  [LoggerMessage(Level = LogLevel.Information, Message = "User {UserId} logged in")]
  private static partial void LogUserLoggedIn(ILogger logger, int userId);
  ```
  The generated code avoids boxing and only evaluates the message string if the log level is enabled.

- **Incremental source generators for custom hot paths:** Write incremental source generators (using `IIncrementalGenerator`) for repetitive patterns like: fast property mapping (instead of AutoMapper reflection), fast enum-to-string conversion (instead of `Enum.GetName`), or pre-compiled regular expressions via `[GeneratedRegex]`:
  ```csharp
  [GeneratedRegex(@"^\d{4}-\d{2}-\d{2}$", RegexOptions.Compiled)]
  private static partial Regex DatePattern();
  ```
  `[GeneratedRegex]` compiles the regex at build time, eliminating the runtime compilation cost and reducing allocations during matching.

- **Avoid `Activator.CreateInstance` in hot paths.** Cache a compiled `Func<T>` delegate instead:
  ```csharp
  private static readonly Func<MyService> _factory =
      Expression.Lambda<Func<MyService>>(
          Expression.New(typeof(MyService))).Compile();
  ```
  Or use a source generator to emit a `new MyService()` call directly.

---

### Step 8: Validate, Document, and Protect the Optimization

Optimizations rot without discipline. Build guardrails.

- **Commit BenchmarkDotNet results to version control.** Store the `BenchmarkDotNet.Artifacts` folder output (or a summary CSV) alongside the code. Review benchmark diffs in PR descriptions.

- **Write regression tests for performance.** In CI, run benchmarks with `--filter *` and compare against the baseline using `--join` mode, or write a unit test using `dotnet-benchmark` assert extensions that fails if throughput drops by more than 10%.

- **Document WHY the optimization exists.** Add an XML doc comment or a `// PERF:` comment block explaining: what profiling showed, what the allocation was, what the fix is, and what the measured improvement was. Example:
  ```csharp
  // PERF: Uses stackalloc + Span<byte> instead of byte[] to avoid heap allocation.
  // Profiling (dotMemory, 2024-01-15) showed this path allocated 4 KB/request
  // at 50K RPS = 200 MB/s allocation pressure. Fix reduces to 0 B/request.
  ```

- **Run the full test suite.** Span-based optimizations frequently introduce subtle bounds bugs. Ensure unit tests cover: empty input, single-element input, exact-vector-width input, and input sizes that are not powers of two.

- **Check for thread safety regressions.** Pooled objects (`ArrayPool`, `MemoryPool`) introduce reuse -- verify that returned buffers are not accessed after returning them. Use `dotnet-asan` or `Span<T>` "poison" wrappers in test builds.

---

## Output Format

When delivering a C# performance analysis or optimization recommendation, structure the response as follows:

```
## Performance Analysis: [Component Name]

### Profiling Evidence
| Metric                  | Baseline          | Target            | Tool Used        |
|-------------------------|-------------------|-------------------|------------------|
| Allocation rate          | 250 MB/s          | < 10 MB/s         | dotnet-counters  |
| Gen0 collections/sec     | 45/sec            | < 2/sec           | dotnet-counters  |
| P99 latency              | 18 ms             | < 5 ms            | dotTrace         |
| Allocated per request    | 12,400 B          | < 200 B           | BenchmarkDotNet  |
| LOH size                 | 2.1 GB (growing)  | Stable < 50 MB    | dotMemory        |

### Bottleneck Classification
- **Root cause:** [e.g., Repeated string Substring() calls in JSON tokenizer hot path]
- **Category:** Allocation pressure -- string heap churn
- **Impact scope:** Called 500,000x per second under p95 load

### Optimization Plan

| Priority | Technique                  | Expected Gain       | Complexity | Risk    |
|----------|----------------------------|---------------------|------------|---------|
| 1        | ReadOnlySpan<char> slicing | -90% allocations    | Low        | Low     |
| 2        | SearchValues<char>         | -40% CPU in scan    | Low        | Low     |
| 3        | ArrayPool<byte> for buffers| Eliminate LOH churn | Medium     | Medium  |
| 4        | Source-gen serialization   | -60% serial alloc   | Medium     | Low     |

### Implementation

#### Before (problematic pattern)
\`\`\`csharp
// PROBLEM: Substring allocates a new string on every call
public int FindField(string input, int startIndex)
{
    string slice = input.Substring(startIndex);   // heap allocation
    return int.Parse(slice.Split(',')[0]);         // two more allocations
}
\`\`\`

#### After (optimized pattern)
\`\`\`csharp
// PERF: Zero-allocation span-based parsing
// Measured: 0 B/call vs 184 B/call before (BenchmarkDotNet, net8.0)
public int FindField(ReadOnlySpan<char> input, int startIndex)
{
    ReadOnlySpan<char> slice = input[startIndex..];  // no allocation
    int comma = slice.IndexOf(',');
    ReadOnlySpan<char> field = comma >= 0 ? slice[..comma] : slice;
    return int.Parse(field, NumberStyles.Integer, CultureInfo.InvariantCulture);
}
\`\`\`

### BenchmarkDotNet Results

| Method         | Mean      | Error    | StdDev   | Gen0   | Allocated |
|----------------|-----------|----------|----------|--------|-----------|
| FindFieldOld   | 245.3 ns  | 1.42 ns  | 1.33 ns  | 0.0458 | 184 B     |
| FindFieldNew   |  38.7 ns  | 0.28 ns  | 0.26 ns  | -      | 0 B       |
| Ratio          | baseline  |          |          |        | 100%      |
|                | 6.3x faster|         |          |        | 0%        |

### Validation Checklist
- [ ] Unit tests pass for: empty span, single-char, no-comma, exact-buffer-size inputs
- [ ] BenchmarkDotNet baseline committed to repo
- [ ] PERF comment added explaining rationale and measurement date
- [ ] `[MemoryDiagnoser]` confirms 0 B allocated on hot path
- [ ] Load test confirms p99 improvement in staging environment
```

---

## Rules

1. **Never use `string.Substring()` in hot paths.** It allocates a new `string` on every call. Replace with `ReadOnlySpan<char>` slicing (`span[start..end]`). If you must produce a `string` at the boundary, call `span.ToString()` exactly once.

2. **Never benchmark in `Debug` configuration.** The C# compiler and JIT disable optimizations in Debug builds. Always use `dotnet run -c Release` or `dotnet build -c Release` before benchmarking. Results from Debug builds are not only meaningless -- they actively mislead.

3. **Never store a `Span<T>` in a field, async method, or iterator.** The compiler enforces this for `ref struct`, but understand WHY: the `Span<T>` may point to stack memory that is no longer valid after the method returns. Use `Memory<T>` when cross-scope storage is needed.

4. **Never return a rented `ArrayPool<T>` buffer more than once.** Double-return corrupts the pool's free list and causes subsequent callers to receive the same buffer, leading to data corruption that is extremely difficult to debug. Use `IMemoryOwner<T>` and `IDisposable` to enforce single-return semantics.

5. **Never apply `[MethodImpl(MethodImplOptions.AggressiveInlining)]` without verifying with `[DisassemblyDiagnoser]`.** The JIT may refuse to inline even with the hint (e.g., method is too large, contains try/catch, or is a P/Invoke). The attribute does not guarantee inlining -- verify it happened.

6. **Never use `Enum.GetName()`, `Enum.ToString()`, or `.ToString("G")` in hot paths.** These use reflection and allocate. Use a `[GeneratedRegex]`-style source generator, a static `ReadOnlySpan<char>`-indexed lookup table, or the `FastEnum` pattern (switch expression over known values).

7. **Always handle the tail when vectorizing.** Vectorized loops must follow with a scalar tail loop for `data.Length % Vector<T>.Count` remaining elements. Omitting the tail loop is a silent correctness bug that only manifests on inputs not divisible by the vector width.

8. **Never optimize a method that is not in a profiler-identified hot path.** The 80/20 rule is mild in .NET -- typically 1--3% of code paths account for 90%+ of allocation and CPU cost. Optimizing the wrong 97% wastes engineering time and introduces maintenance burden with zero measurable benefit.

9. **Never use `object` pooling (e.g., `ObjectPool<T>`) as a substitute for proper allocation design.** Object pools add complexity and thread-safety overhead. They are appropriate for expensive-to-construct objects (e.g., `StringBuilder`, `MemoryStream`, protocol parsers) but not for small DTOs -- use structs or `Span<T>`-based patterns instead.

10. **Never measure latency with `DateTime.Now` or `Stopwatch` inside the benchmarked code.** Use BenchmarkDotNet exclusively for micro-benchmarks -- it handles warmup, JIT tier transitions, OS scheduling noise, and statistical aggregation. For macro/integration latency, use distributed tracing (OpenTelemetry `ActivitySource`) with percentile histograms, not wall-clock diffs.

---

## Edge Cases

### Large Object Heap Fragmentation
Symptom: `loh-size` growing indefinitely in dotMemory, Gen2 GC frequency spiking, but no object leaks visible. Cause: `byte[]` or `string` allocations >= 85,000 bytes (the LOH threshold) that have long-enough lifetimes to survive at least one GC, fragmenting the LOH address space. Fix: Pool all large buffers with `ArrayPool<byte>.Shared` -- rented arrays stay in pool memory which is already on the LOH and is reused. For strings, avoid large concatenations; use `StringBuilder` with a pooled backing store. If you need LOH compaction once, call `GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce` before `GC.Collect(2, GCCollectionMode.Forced)` in a maintenance window -- do not do this on a hot path.

### `ref struct` Incompatibility with Existing APIs
A method returning `Span<T>` or accepting `Span<T>` cannot implement an interface method, be used as a generic type argument in non-`ref struct` generics, or be stored in a class field. If you need to pass `Span<T>`-based processing results to a component that only accepts `IEnumerable<T>` or `T[]`: create a seam -- have the `Span<T>` processing layer call a callback/delegate with the result rather than returning it, or materialize to a pooled array with explicit lifetime control using `IMemoryOwner<T>`. Do not fight the type system by casting -- it indicates an architectural boundary issue.

### Benchmarking Multi-Core / Concurrent Paths
BenchmarkDotNet defaults to single-threaded execution. If the optimized code is accessed concurrently (e.g., a shared cache, a `ConcurrentQueue<T>`, a channel reader), single-threaded benchmarks will not reveal cache-line contention or lock convoy effects. Use `[ThreadingDiagnoser]` and `[Benchmark]` with `OperationsPerInvoke` set to a batch size, and run the benchmark from multiple threads by using `Parallel.For` inside the benchmark method. Alternatively, use load testing tools (k6, wrk2) against a local server instance for concurrency-sensitive paths.

### Source Generator Conflicts and Incremental Build Issues
When multiple source generators run in the same compilation, they can produce conflicting partial class members or duplicate type names. Symptoms: `CS0101 The namespace already contains a definition` or `CS0111 Member is already defined with same parameter types`. Fix: ensure each generator emits into distinct `partial` methods with unique names, use `hintName` uniqueness in `SourceProductionContext.AddSource()`, and add `#nullable enable` at the top of generated files. Incremental generators must use value equality on their `SyntaxValueProvider` to avoid full re-generation on every keystroke -- verify with the `IncrementalGeneratorInitializationContext` `RegisterSourceOutput` vs `RegisterImplementationSourceOutput` distinction.

### `.NET Framework` vs `.NET 8+` API Availability
`Span<T>` and `Memory<T>` exist in `netstandard2.1` but NOT in `netstandard2.0` or `.NET Framework 4.x`. `SearchValues<T>` is net8+ only. `[GeneratedRegex]` is net7+. `[LoggerMessage]` source generation is net6+. If targeting `netstandard2.0` for library compatibility: use `Microsoft.Bcl.Memory` NuGet package for `Span<T>` and `Memory<T>` backport. Use conditional compilation (`#if NET8_0_OR_GREATER`) to enable advanced paths on modern runtimes while providing a correct (slower) fallback on older targets. Never use `#if` to silently skip correctness -- only to swap implementations.

### SIMD Producing Incorrect Results on Different Hardware
`Vector<T>.Count` varies by CPU: 4 elements for `Vector<int>` on SSE2, 8 on AVX2, 16 on AVX-512. Code that hardcodes a vector width (e.g., `new Vector<int>(data, i)` when `data.Length` was sized for `Count == 8` only) will produce incorrect results on machines with different SIMD widths. Always derive loop bounds dynamically from `Vector<int>.Count`, and always write and test the scalar tail path. Run BenchmarkDotNet on at least two machines with different SIMD capability levels before shipping vectorized code to production.

### GC Interaction with `fixed` Statements and `GCHandle`
When pinning managed memory with `fixed` or `GCHandle.Alloc(obj, GCHandleType.Pinned)` for P/Invoke or unsafe operations, pinned objects block GC heap compaction. If many objects are pinned simultaneously (e.g., in a tight loop with native interop), heap fragmentation increases rapidly. Fix: pin for the minimum possible duration -- enter `fixed`, do the native call, exit `fixed` immediately. For long-duration pinning (e.g., a buffer passed to an async I/O operation), prefer `NativeMemory.Alloc()` (net6+) or `MemoryPool<byte>` backed by pinned managed memory to minimize impact on the GC heap.

### Struct Defensive Copies from `readonly` Violations
The most insidious struct performance bug: a struct field on a `readonly` context (a `readonly` field, an `in` parameter, a `foreach` iteration variable) that has a non-`readonly` method called on it causes the JIT to silently emit a defensive copy of the entire struct before each call. Symptoms: profiling shows unexpected memory writes in what should be a read-only path; performance scales with struct size. Diagnosis: enable Roslyn analyzer `IDE0064` or use `[DisassemblyDiagnoser]` and look for unexpected `lea`/`mov` sequences. Fix: declare the struct `readonly`, or mark methods that do not mutate state as `readonly` methods (`public readonly int ComputeHash() { ... }`).

---

## Example

**User input:** "I have an ASP.NET Core API endpoint that parses incoming CSV-like log lines and extracts three fields. Under load (20K RPS), dotnet-counters shows 180 MB/s allocation rate and Gen0 GC running 80 times per second. The method is called on every request. How do I optimize it?"

---

### Performance Analysis: Log Line Parser Hot Path

#### Profiling Evidence

| Metric                | Baseline           | Target             | Tool Used          |
|-----------------------|--------------------|--------------------|--------------------|
| Allocation rate        | 180 MB/s           | < 5 MB/s           | dotnet-counters    |
| Gen0 collections/sec   | 80/sec             | < 5/sec            | dotnet-counters    |
| Allocated per request  | ~9,000 B           | < 64 B             | BenchmarkDotNet    |
| P95 latency            | 22 ms              | < 4 ms             | dotTrace           |
| Throughput             | 14K RPS (degraded) | 20K+ RPS           | load test          |

#### Bottleneck Classification

- **Root cause:** `string.Split()` called on every log line allocates a `string[]` and N new `string` objects per call. With 20K RPS and average 6 fields per line, this generates ~120,000 string allocations per second.
- **Category:** Allocation pressure -- `string` heap churn causing Gen0 GC storm
- **Impact scope:** Called synchronously on every request in the middleware pipeline

#### Original Problematic Code

```csharp
// PROBLEM: Three allocations per call minimum: Split array + two Substring results
// Under 20K RPS = ~240,000 allocations/sec, ~9 KB/request
public static (string Timestamp, string Level, string Message) ParseLogLine(string line)
{
    var parts = line.Split('|');          // allocates string[] + N string objects
    return (
        parts[0].Trim(),                  // allocates trimmed string
        parts[1].Trim(),                  // allocates trimmed string
        parts[2]                          // references existing string (ok)
    );
}
```

#### Why This Is Expensive

Every `string.Split('|')` allocates:
1. A `string[]` of length N (24 + N * 8 bytes on 64-bit)
2. N new `string` objects, one per segment
3. Each `Trim()` call potentially allocates another `string` if whitespace is present

At 20K RPS with average 5-field lines: approximately 160,000 `string` objects per second hitting the GC.

#### Optimized Implementation

```csharp
// PERF: Zero-allocation log line parser using ReadOnlySpan<char>
// Measured: 0 B/call vs ~9,200 B/call before (BenchmarkDotNet, net8.0, 2024-01-20)
// dotnet-counters alloc-rate: 180 MB/s -> 1.2 MB/s at 20K RPS

public ref struct LogFields
{
    public ReadOnlySpan<char> Timestamp;
    public ReadOnlySpan<char> Level;
    public ReadOnlySpan<char> Message;
}

public static bool TryParseLogLine(
    ReadOnlySpan<char> line,
    out LogFields fields)
{
    fields = default;

    int first = line.IndexOf('|');
    if (first < 0) return false;

    int second = line[(first + 1)..].IndexOf('|');
    if (second < 0) return false;
    second += first + 1; // adjust to absolute index

    fields.Timestamp = line[..first].Trim();
    fields.Level      = line[(first + 1)..second].Trim();
    fields.Message    = line[(second + 1)..];
    return true;
}

// Caller: accept ReadOnlySpan<char> from request body or Pipe reader
// to avoid ever materializing a string if downstream processing can work with spans.
// If a string IS needed for logging/storage, call span.ToString() exactly once at boundary.
```

#### ASP.NET Core Integration Pattern

```csharp
// In the controller or minimal API handler:
// Use PipeReader to read body as ReadOnlySequence<byte>, then process without string allocation
app.MapPost("/ingest", async (HttpContext ctx) =>
{
    var reader = ctx.Request.BodyReader;
    ReadResult result = await reader.ReadAsync();
    ReadOnlySequence<byte> buffer = result.Buffer;

    // Process each line without allocating strings
    foreach (var segment in buffer)
    {
        // MemoryMarshal.Cast to char if UTF-8 encoding is guaranteed ASCII subset
        // Otherwise use a pooled decoder:
        Span<char> charBuffer = stackalloc char[512]; // safe: lines are bounded
        int charCount = Encoding.UTF8.GetChars(segment.Span, charBuffer);
        ReadOnlySpan<char> line = charBuffer[..charCount];

        if (TryParseLogLine(line, out LogFields fields))
        {
            // Process fields -- all are spans, zero allocations
            ProcessFields(fields.Timestamp, fields.Level, fields.Message);
        }
    }

    reader.AdvanceTo(buffer.End);
    return Results.Ok();
});
```

#### BenchmarkDotNet Setup and Results

```csharp
[MemoryDiagnoser]
[SimpleJob(RuntimeMoniker.Net80)]
public class LogParserBenchmarks
{
    private readonly string _line = "2024-01-20T10:30:00Z|INFO|User authenticated successfully";

    [Benchmark(Baseline = true)]
    public (string, string, string) ParseWithSplit()
    {
        var parts = _line.Split('|');
        return (parts[0].Trim(), parts[1].Trim(), parts[2]);
    }

    [Benchmark]
    public bool ParseWithSpan()
    {
        return TryParseLogLine(_line.AsSpan(), out _);
    }
}
```

| Method         | Mean      | Error    | StdDev   | Ratio | Gen0   | Allocated | Alloc Ratio |
|----------------|-----------|----------|----------|-------|--------|-----------|-------------|
| ParseWithSplit | 187.4 ns  | 1.12 ns  | 1.05 ns  | 1.00  | 0.0286 | 120 B     | 1.00        |
| ParseWithSpan  |  31.2 ns  | 0.18 ns  | 0.17 ns  | 0.17  | --     | 0 B       | 0.00        |

**Result: 6x faster, 0 bytes allocated per call vs 120 bytes.**

At 20K RPS: allocation rate drops from ~2.4 GB/min to 0 MB/min for this path.

#### Source Generator Addition for Structured Logging

Replace the log write that would re-allocate strings for the logger:

```csharp
// Before: boxes level string, allocates interpolated string
_logger.LogInformation("Parsed log: timestamp={Timestamp} level={Level}", ts, level);

// After: compile-time generated, no boxing, no allocation when log level disabled
[LoggerMessage(Level = LogLevel.Information,
    Message = "Parsed log: timestamp={Timestamp} level={Level}")]
private static partial void LogParsedEntry(
    ILogger logger,
    ReadOnlySpan<char> timestamp,  // net8+: LoggerMessage supports Span params
    ReadOnlySpan<char> level);
```

#### Validation Checklist

- [x] Unit tests cover: empty line, single-field line, no second delimiter, leading/trailing whitespace in fields, Unicode characters in Message field, exactly 512-char line (stack boundary)
- [x] BenchmarkDotNet results committed to `benchmarks/LogParser_net8_results.json`
- [x] `[MemoryDiagnoser]` confirms `0 B` allocated on optimized path
- [x] Load test at 20K RPS in staging: Gen0 GC rate dropped from 80/sec to 3/sec
- [x] `PERF:` comment block added to `TryParseLogLine` with profiling date and before/after numbers
- [x] `dotnet-counters` monitoring confirmed `alloc-rate` dropped from 180 MB/s to 1.2 MB/s (residual from unrelated paths)
- [x] No regressions in integration test suite (`dotnet test -c Release`)
