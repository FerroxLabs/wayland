---
name: python-performance
description: |
  Guides expert-level Python performance optimization: cProfile and line_profiler usage, memory profiling with tracemalloc, NumPy vectorization vs pure Python decision tree, Cython integration points, and algorithmic optimization patterns.
  Use when the user asks about Python performance profiling, memory optimization, speeding up Python code, NumPy vs pure Python decisions, or Cython compilation.
  Do NOT use when the user asks about async concurrency (use `python-async-patterns`), general Python idioms (use `python-idioms`), or project setup (use `python-project-setup`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "python optimization debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Python Performance

## When to Use

**Use this skill when:**
- User reports slow Python code and wants to find and eliminate the bottleneck -- "my script takes 3 minutes to process 50,000 rows"
- User wants to set up a profiling workflow using cProfile, line_profiler, py-spy, or memray
- User is deciding whether to vectorize a loop with NumPy, rewrite in Cython, or switch to a compiled extension
- User asks about memory bloat, high RSS in long-running processes, or Python memory allocation behavior
- User wants to reduce object allocation pressure, use `__slots__`, or switch from dict to more compact data structures
- User asks specifically about tracemalloc, objgraph, or memory leak hunting in Python processes
- User wants to benchmark code reliably using timeit, pytest-benchmark, or perf counters
- User is evaluating whether to apply Cython type annotations, use Numba JIT, or call into a C library via cffi

**Do NOT use this skill when:**
- User wants async/concurrent programming patterns, event loops, or asyncio task management → use `python-async-patterns`
- User asks about general Python idioms, Pythonic style, or idiomatic refactoring → use `python-idioms`
- User wants project setup, packaging, dependency management, or virtual environments → use `python-project-setup`
- User is asking about testing strategies, fixtures, or test coverage → use `python-testing-patterns`
- User wants data modeling, Pydantic schemas, dataclass design, or ORM patterns → use `python-data-modeling`
- User is experiencing slow network I/O, database query latency, or disk I/O -- these are architectural problems, not Python performance problems (profiling will confirm I/O wait dominates)
- User asks about multiprocessing or GIL-level thread contention without a profiling-confirmed CPU bottleneck → use `python-async-patterns` for concurrency architecture

---

## Process

### 1. Establish a Profiling Baseline Before Touching Any Code

Optimization without measurement is speculation. Establish a reproducible baseline first.

- Run `python -m cProfile -o profile.out your_script.py` and inspect with `pstats` or `snakeviz` to identify the top 10 functions by cumulative time (`cumtime`) -- not total time (`tottime`). `tottime` excludes callees and misrepresents where time is actually spent in call-heavy code.
- Sort by `cumtime` first: `stats.sort_stats('cumulative'); stats.print_stats(20)`. Then sort by `tottime` to find the actual leaf where CPU cycles burn.
- For long-running or production processes that cannot be wrapped in a script, use `py-spy record -o profile.svg --pid <PID>` to generate a flame graph without modifying the process or stopping it.
- Use `timeit` for micro-benchmarks of isolated snippets: `python -m timeit -n 1000 -r 5 "expression"`. The `-n` flag sets iterations per run, `-r` sets the number of runs -- use `r=5` minimum to account for system noise.
- Record the baseline: wall time, CPU time (from `time.process_time()`), and peak RSS (from `tracemalloc` or `/usr/bin/time -v`). You need all three numbers. Wall time improvement without CPU improvement usually means you moved work elsewhere.
- For I/O-heavy pipelines, check `time` output: if `sys` + `user` time is much less than `real` time, the bottleneck is I/O and this skill does not apply -- the fix is async I/O, connection pooling, or query optimization.

### 2. Classify the Bottleneck Using the Four-Quadrant Decision Tree

Once you have profiling data, classify the bottleneck precisely before choosing a strategy.

- **CPU-bound in numerical computation (floating point, array math):** `tottime` is high in functions doing arithmetic, often in loops. NumPy vectorization or Numba JIT is the correct path. Cython is appropriate if custom control flow is needed inside the loop.
- **CPU-bound in pure Python object operations (dicts, lists, string parsing):** The Python interpreter overhead itself is the cost -- each bytecode instruction carries ~50-100ns of overhead. Consider: built-in functions over manual loops, `collections` module types, algorithmic improvement (reduce O(n²) to O(n log n)), or Cython for the hot path.
- **Memory-bound (high allocation rate causing GC pressure):** Identify by watching GC frequency with `gc.callbacks` or by observing that RSS grows steadily. The fix is reducing allocations: generators instead of list comprehensions in pipelines, `__slots__` on hot classes, object pooling, or switching from nested dicts to NumPy structured arrays.
- **I/O-bound or latency-bound:** `cpu_times.system` is high, or profiling shows time concentrated in `read()`, `write()`, `recv()`, `socket.connect()`. Python performance optimization will not help here. Refer to `python-async-patterns`.
- **Import-time slow (serverless or CLI startup):** Measure with `python -X importtime -c "import your_module"`. Top-level imports of heavy packages (pandas loads ~300ms, matplotlib ~200ms) dominate. Fix with lazy imports.
- **GIL-contention in threaded code:** Only relevant if using threading. Use `sys.getswitchinterval()` (default 5ms) and consider whether threads are actually releasing the GIL. NumPy, I/O operations, and ctypes calls release the GIL; pure Python loops do not.

### 3. Apply the Correct Profiling Tool for the Identified Layer

Different tools reveal different layers of truth about Python performance.

- **cProfile (function-level, deterministic):** Best for initial triage. Use `snakeviz` for visual flame graph from `.out` files: `pip install snakeviz && snakeviz profile.out`. Overhead is ~10-30% of actual runtime -- acceptable for triage, not for production.
- **line_profiler (line-level, selective):** Install with `pip install line-profiler`. Decorate specific functions with `@profile` (the decorator is injected at runtime by `kernprof`). Run as `kernprof -l -v script.py`. Only use on functions already identified as hot by cProfile -- do not annotate everything.
- **py-spy (sampling, zero-overhead, works on live processes):** Uses OS-level sampling, no Python instrumentation required. Run `py-spy top --pid <PID>` for a live top-like view, or `py-spy record` for a flame graph. Ideal for profiling production workloads or processes you cannot restart.
- **tracemalloc (memory allocation tracing):** Call `tracemalloc.start()` at program start, then `snapshot = tracemalloc.take_snapshot()` at the point of interest. Use `snapshot.statistics('lineno')` to get per-line allocation counts and sizes. Filter noise with `tracemalloc.Filter`. Compare two snapshots with `snapshot2.compare_to(snapshot1, 'lineno')` to find what grew.
- **memray (memory profiler with flame graphs):** More powerful than tracemalloc for native extension memory. Run `memray run -o output.bin script.py` and inspect with `memray flamegraph output.bin`. Tracks allocations through C extensions and NumPy.
- **objgraph (reference leak detection):** Use `objgraph.show_growth()` after a suspected leak period to find which types are accumulating. Use `objgraph.show_backrefs(objgraph.by_type('MyClass')[0])` to render the reference graph of a specific object.

### 4. Apply Vectorization -- The Highest-Return Optimization for Numerical Code

NumPy vectorization is the single most impactful optimization for numerical Python, but it has correct and incorrect application patterns.

- **The core principle:** NumPy operations execute in compiled C/Fortran, with Python interpreter overhead paid once per operation (not once per element). A loop over 1M floats pays interpreter overhead 1M times; `np.sum(array)` pays it once.
- **Array creation is NOT free:** For arrays with N < ~100 elements, `np.array()` creation overhead often exceeds the vectorization benefit. The threshold is workload-dependent -- always benchmark. For N > 10,000, vectorization almost always wins.
- **Avoid implicit Python loops in NumPy:** `np.vectorize()` is NOT vectorization -- it is a convenience wrapper that calls a Python function element-by-element. It provides no speedup. Use explicit array operations instead.
- **Use in-place operations when memory is the bottleneck:** `a += b` modifies the array in place (no new allocation). `a = a + b` allocates a new array. For large arrays (>100MB), this distinction matters significantly.
- **Structured arrays vs. dicts:** If you have N records with M fields, a dict-of-lists or list-of-dicts has O(N×M) Python objects. A NumPy structured array (`np.dtype([('field1', 'f4'), ('field2', 'i4')])`) has O(1) Python objects wrapping contiguous memory. Access individual columns as `arr['field1']` -- each returns a view, not a copy.
- **Use `np.where`, `np.searchsorted`, `np.bincount`, `np.unique` for conditional aggregation** instead of Python loops with if-statements. `np.bincount(categories, weights=values)` replaces a category-grouping loop in O(n) time.
- **Avoid `tolist()` until the final output stage.** Calling `.tolist()` on intermediate arrays recreates Python objects and defeats vectorization.
- **Memory layout matters for performance:** C-contiguous arrays (row-major, default) are fast for row iteration. Fortran-contiguous arrays are fast for column iteration. Check with `array.flags`. Transposing a large array without `np.ascontiguousarray()` can cause cache thrashing.

### 5. Apply Algorithmic and Structural Optimizations in Pure Python

When NumPy is not applicable (text processing, graph algorithms, business logic), structural Python optimizations are the lever.

- **Algorithmic complexity first:** Replacing an O(n²) set intersection implemented as nested loops with a Python `set` lookup reduces a 10,000-element comparison from 100M operations to 10,000. No micro-optimization comes close. Always analyze complexity before implementation.
- **Use `collections` types correctly:**
  - `collections.defaultdict` eliminates `if key not in d: d[key] = []` guards, reducing branching overhead.
  - `collections.Counter` is C-implemented for frequency counting and is faster than manual dict accumulation.
  - `collections.deque` provides O(1) appendleft/popleft vs O(n) for `list.insert(0, ...)`.
  - `heapq` for priority queues is C-implemented and faster than sorting on each insertion.
- **`__slots__` on frequently instantiated classes:** A class with `__dict__` allocates a dictionary for every instance (typically 200-300 bytes of overhead). Adding `__slots__ = ('x', 'y', 'z')` eliminates `__dict__`, saving ~40-50% memory per instance. Apply when instantiating more than 10,000 instances of the same class.
- **String building:** `"".join(parts_list)` over `result += piece` in loops. String concatenation in a loop is O(n²) due to immutability -- each concatenation allocates a new string. `join()` is O(n). Use `io.StringIO` when building strings conditionally inside complex logic.
- **Local variable lookups vs. global/attribute lookups:** Inside tight loops, assigning a frequently-accessed global or attribute to a local variable reduces lookup cost. `append = my_list.append` before a loop that calls `my_list.append(x)` 1M times reduces attribute lookup overhead by ~50% for that call.
- **Generator pipelines over intermediate lists:** `sum(x*x for x in data if x > 0)` holds one element in memory at a time. `sum([x*x for x in data if x > 0])` allocates a full list. For large datasets, the list comprehension version can exhaust memory or cause GC pressure.
- **Caching with `functools.lru_cache` and `functools.cache`:** Use `@lru_cache(maxsize=1024)` on pure functions called repeatedly with the same arguments. The cache key is built from function arguments -- all arguments must be hashable. For methods, use `@functools.cached_property` to compute once and cache on the instance.

### 6. Evaluate and Apply Cython or Numba for Native-Speed Hotspots

When pure Python optimizations and NumPy are insufficient, compiled extensions are the next tier.

- **Cython decision criteria:** Apply Cython when you have a tight loop with complex control flow (conditionals, nested function calls) that NumPy cannot vectorize. The key transformation is adding type declarations: `cdef int i`, `cdef double[:] arr` (typed memoryview). Without type declarations, Cython generates code that is only marginally faster than CPython.
- **Essential Cython annotations for performance:**
  - `# cython: boundscheck=False` -- disables array index bounds checking (unsafe but fast)
  - `# cython: wraparound=False` -- disables negative index handling
  - `# cython: cdivision=True` -- uses C division semantics instead of Python (avoids zero-check overhead)
  - `cdef double[:] arr` (typed memoryview) -- allows direct C-level array access without Python overhead
  - `cdef` functions are not callable from Python but are fast for internal use; `cpdef` functions have both a C and Python entry point
- **Numba decision criteria:** Use Numba when you want C-speed on NumPy-heavy loops without a separate compilation step. Decorate with `@numba.jit(nopython=True)` (or `@numba.njit`). Numba compiles to LLVM IR on first call (cold start ~100ms-2s), then runs at near-C speed. Best for: numerical loops that cannot be expressed as NumPy ufuncs, GPU offloading with `@numba.cuda.jit`.
- **cffi vs ctypes for calling C libraries:**
  - `cffi` (C Foreign Function Interface): Preferred. Parses C header declarations directly, generates safer bindings, supports out-of-line mode (compiles to a C extension at install time).
  - `ctypes`: Built-in, no installation required. Use for simple one-off calls to system libraries. Error-prone for complex structs.
  - Neither releases the GIL automatically -- you must explicitly manage GIL release with `with nogil:` in Cython or `ctypes.py_object` patterns.
- **When NOT to use Cython or Numba:**
  - The bottleneck is I/O-bound -- compiled code does not speed up waiting.
  - An existing package already wraps the optimized C code (scipy, scikit-learn, OpenBLAS) -- always check before writing custom extensions.
  - The team cannot maintain Cython build infrastructure -- the `setup.py` with Cython compilation adds significant toolchain complexity.

### 7. Validate, Document, and Prevent Regression

Optimization must be verifiable and maintainable.

- **Re-run the identical profiling command** from Step 1 after applying the optimization. If the hotspot function no longer appears in the top 10, the optimization succeeded. If it moved to a different function, the bottleneck shifted -- repeat the cycle.
- **Use `pytest-benchmark` for repeatable regression prevention:** Fixtures with `benchmark(func, *args)` produce structured JSON output. Store baseline JSON in version control. CI runs with `--benchmark-compare=baseline.json` and fails if performance regresses by more than a configured threshold (e.g., `--benchmark-compare-fail=mean:10%`).
- **Benchmark at production-representative scales.** A function that processes 100 records in 0.001s may be fine; the same function on 10M records for 100s may be the business bottleneck. Always test at 10x, 100x, and expected production scale.
- **Document optimizations inline with profiling evidence:**
  ```python
  # PERF: Replaced dict accumulation with np.bincount.
  # Profiling (2024-03): 94% of pipeline time was in category_sum().
  # Before: 8.2s for 1M records. After: 0.14s (58x). See profile_results/2024-03.out
  ```
- **Add a performance characterization test** for any optimized path: an integration test that asserts the function completes within a wall-time budget on a fixed input size (e.g., `assert elapsed < 0.5, f"Performance regression: {elapsed:.2f}s"`). This is not a substitute for pytest-benchmark but catches severe regressions in CI.

---

## Output Format

When helping a user optimize Python performance, structure your response as follows:

```
## Performance Analysis: [module or function name]

### Profiling Command
[Exact command(s) to run for this specific code, not generic instructions]

### Profiling Results
| Function | Calls | tottime (s) | cumtime (s) | Per Call (ms) |
|----------|-------|-------------|-------------|---------------|
| process_batch | 1 | 38.2 | 42.1 | 38,200 |
| _apply_transform | 1,000,000 | 29.7 | 31.4 | 0.031 |
| dict.__setitem__ | 3,000,000 | 4.2 | 4.2 | 0.001 |

(Note: Sort by cumtime for triage, tottime to find actual CPU sink)

### Bottleneck Classification
- **Type:** CPU-bound / Memory-bound / I/O-bound (choose one and justify)
- **Layer:** Python interpreter overhead / object allocation pressure / algorithmic complexity
- **Root cause:** [Specific description: "Python loop over 1M records paying per-element interpreter overhead for float multiply"]
- **Confirming evidence:** [Which profiling metric confirms this classification]

### Optimization Strategy
- **Approach:** [Specific strategy: vectorization / algorithmic restructure / __slots__ / Cython / caching]
- **Expected speedup range:** [e.g., "10-100x for loops with simple arithmetic, less for dict-heavy code"]
- **Trade-offs:** [Memory vs speed, readability cost, build complexity]

### Code Change

#### Before
```python
# [annotated original code with comments showing the expensive operations]
```

#### After
```python
# [optimized code with comments explaining each change]
```

### Benchmark Results
| Version | Time (s) | Peak RSS (MB) | Speedup |
|---------|----------|---------------|---------|
| Original | 45.2 | 312 | 1x |
| Optimized | 0.83 | 487 | 54x |

### Profiling Command to Verify
[Exact command to confirm the improvement]

### Regression Prevention
[pytest-benchmark snippet or timing assertion to add to test suite]
```

---

## Rules

1. **NEVER optimize without profiling data.** Present the profiling command and interpret the output before suggesting any change. If the user has not run a profiler, the first output should be profiling instructions, not code rewrites.

2. **NEVER use `time.time()` for benchmarking.** It measures wall clock time and is polluted by OS scheduling, other processes, and I/O waits. Use `time.perf_counter()` for wall time, `time.process_time()` for CPU time, and `timeit.timeit()` or `pytest-benchmark` for statistical micro-benchmarks. A single `time.time()` measurement can be 5-50x off from true performance.

3. **NEVER treat `np.vectorize()` as vectorization.** It is a convenience wrapper around a Python for loop. It adds function call overhead to every element and is typically slower than a plain list comprehension for small arrays. Use explicit NumPy array operations (`+`, `-`, `np.where`, `np.dot`) for actual vectorization.

4. **ALWAYS prefer algorithmic complexity reduction over micro-optimization.** An O(n²) → O(n log n) improvement on 100,000 elements gives a 5,800x speedup regardless of language. A CPython → Cython micro-optimization gives at most 100x. Algorithmic improvement should always be the first path evaluated.

5. **NEVER apply `__slots__` to a class that uses multiple inheritance without careful analysis.** `__slots__` on a class whose parent does not also define `__slots__` still allocates `__dict__` (because the parent's `__slots__` omission creates one). The benefit is realized only when the entire MRO chain uses `__slots__`.

6. **ALWAYS benchmark NumPy operations at the actual data size.** NumPy array construction has ~1-10µs overhead. For arrays with N < 50-100 elements, this overhead dominates and pure Python is often faster. For N > 1,000, NumPy almost always wins. The crossover point must be measured, not assumed.

7. **NEVER recommend Cython without acknowledging the build infrastructure cost.** Cython requires a C compiler, a `setup.py` or `pyproject.toml` with Cython build configuration, and either pre-compiled wheels in CI or a compilation step for developers. For most business applications, this maintenance cost is not worth a 2-5x speedup available from NumPy. Cython is justified for 10-100x improvements on confirmed hotspots.

8. **ALWAYS check that GIL release actually occurs** when recommending threading + ctypes/cffi patterns. Not all ctypes calls release the GIL. NumPy releases the GIL for most array operations. Pure Python loops inside Cython functions do NOT release the GIL unless wrapped in `with nogil:`. Incorrect GIL assumptions produce code that is correct but provides no parallelism benefit.

9. **NEVER recommend `@functools.lru_cache` on methods without noting the memory leak risk.** `lru_cache` on an instance method holds a reference to `self` through the cache key, preventing garbage collection of the instance as long as the cache lives. Use `@functools.cached_property` for instance-level caching, or cache on module-level functions.

10. **ALWAYS separate profiling overhead from actual performance.** `cProfile` adds 10-30% overhead to the measured run. `line_profiler` adds 100-200% overhead. Never report profiling-time measurements as the actual runtime -- always run without profiling instrumentation to get the true baseline and final measurements. `py-spy` is the only profiler with near-zero overhead suitable for production.

---

## Edge Cases

### Memory Leak in a Long-Running Service (Worker, Web Server, Daemon)

Symptoms: RSS grows by 10-50MB per hour, never drops, eventually triggers OOM. GC stats (`gc.get_count()`) show generation 2 collections increasing.

- Start with `tracemalloc`: call `tracemalloc.start(10)` (the argument is the depth of the traceback stack), take a snapshot at startup, take another snapshot after the suspected leak period, and call `snapshot2.compare_to(snapshot1, 'filename')` to see what grew.
- Use `objgraph.show_growth(limit=10)` after a request handling cycle to identify which Python types are accumulating.
- Common culprits in Python services:
  - Unbounded caches (`dict` or `@lru_cache` with `maxsize=None`) growing with unique keys (user IDs, request paths)
  - Event handler lists (`signal.connect()`, observer patterns) that add listeners but never remove them
  - Circular reference graphs that the reference counter cannot collect (only the cyclic GC handles these -- check with `gc.collect()` and `gc.garbage`)
  - Module-level globals accumulating state across requests (common in WSGI apps where the module is imported once)
- Fix circular references by using `weakref.ref()` or `weakref.WeakValueDictionary` for back-references in observer/parent relationships.
- For caches, always use `maxsize` in `lru_cache` or switch to `cachetools.TTLCache` for time-bounded expiry.

### Optimizing Serverless Function Cold Start Time (AWS Lambda, Google Cloud Run)

Cold start latency is dominated by import time, not execution time. Standard profiling tools do not capture this.

- Measure import time with `python -X importtime -c "from your_module import handler" 2>&1 | sort -k2 -rn | head -20`. The output shows cumulative import time per module, sorted to find the slowest imports.
- Common offenders and their typical cold-import times: `pandas` (~300ms), `matplotlib` (~200ms), `scipy` (~400ms), `boto3` (~100ms), `sqlalchemy` (~80ms).
- Apply lazy imports for any package not needed on every invocation:
  ```python
  def handler(event, context):
      if event.get('requires_pandas'):
          import pandas as pd  # imported only when needed
          return process_with_pandas(event, pd)
  ```
- For packages that are always needed, pre-import at module level is faster than lazy import on warm invocations. The trade-off is higher cold start. Measure both.
- Use Lambda Layers or container image caching to pre-install packages outside the import chain -- this reduces the file system scan overhead of package discovery.
- Consider `aws-lambda-powertools` lazy loading utilities for structured lazy import management.

### Profiling Code With Side Effects or External Dependencies

Some code cannot be profiled safely because repeated calls modify databases, send emails, charge credit cards, or call external APIs.

- Wrap external calls with a thin interface and substitute stubs during profiling:
  ```python
  # In production
  class PaymentGateway:
      def charge(self, amount): return real_api_call(amount)

  # During profiling
  class StubGateway:
      def charge(self, amount): return {'status': 'ok', 'id': 'stub-123'}
  ```
- Use `unittest.mock.patch` to replace external calls during profiling runs. The mock overhead is ~1-5µs per call and is negligible if the actual call is the bottleneck.
- Profile with realistic data volume but synthetic inputs. The data shape (number of records, field cardinalities, string lengths) matters more than the actual values for performance characterization.
- Never profile against production databases without a read-only replica and rate limiting -- cProfile adds latency that can cause timeouts or trigger circuit breakers.

### NumPy Performance Worse Than Expected -- Hidden Python Bottlenecks

A common failure mode: a developer vectorizes the obvious loop but the code is still slow because a Python bottleneck exists elsewhere.

- **The "last mile" problem:** After vectorizing the main computation, cProfile may show time concentrated in `np.array()` calls for array construction (if records are arriving as Python dicts), or in `result.tolist()` for converting back to Python objects.
- **Array construction from Python objects is expensive.** Converting a list of 1M Python floats to a NumPy array takes ~50-100ms. If this conversion happens repeatedly in a loop, it dominates. Fix: keep data as arrays throughout the pipeline -- never convert to Python objects between stages.
- **Boolean indexing creates copies.** `arr[mask]` creates a new array. For large arrays, this allocation is ~50MB/s throughput limited. If you only need a count, use `mask.sum()`. If you need the values once, that is fine. If you need to apply the mask multiple times, store the result.
- **`np.concatenate` in a loop is O(n²).** If you are building a result array by concatenating inside a loop, pre-allocate with `np.empty(total_size)` and fill with slice assignment: `result[start:end] = chunk`.
- Use `np.asarray()` instead of `np.array()` when the input may already be a NumPy array -- `asarray()` avoids copying if the dtype and layout already match.

### Cython Compilation Producing No Speedup

Cython without type declarations generates code that calls back into the Python C API for every operation -- it is not appreciably faster than CPython.

- Run `cython --annotate mymodule.pyx` to generate an annotated HTML file. Lines highlighted in yellow indicate Python API calls (overhead). The goal is to eliminate yellow lines from the hot loop. A loop body that is entirely white (no Python API calls) will run at C speed.
- The most common cause of unexpected yellow lines:
  - Untyped variables (`x = some_function()` without `cdef` type annotation)
  - Python exceptions propagating through C loops (use `# cython: boundscheck=False` and `cdivision=True` to eliminate)
  - Calling Python functions from inside a `with nogil:` block (illegal -- the compiler will catch this if you declare `nogil`)
  - Using Python list indexing (`my_list[i]`) instead of typed memoryview indexing (`cdef double[:] arr; arr[i]`)
- Minimum effective Cython pattern for a numerical loop:
  ```python
  # cython: boundscheck=False, wraparound=False, cdivision=True
  def sum_array(double[:] arr):
      cdef Py_ssize_t i, n = arr.shape[0]
      cdef double total = 0.0
      for i in range(n):
          total += arr[i]
      return total
  ```
  This pattern achieves within 5-20% of hand-written C performance.

### Profiling Multi-Process or Multiprocessing.Pool Code

`cProfile` does not automatically profile worker processes. The main process profile shows `pool.map()` taking all the time, which tells you nothing useful.

- For `multiprocessing.Pool`, wrap the worker function to enable per-process profiling:
  ```python
  def profiled_worker(args):
      import cProfile, pstats, io
      pr = cProfile.Profile()
      pr.enable()
      result = actual_worker(args)
      pr.disable()
      s = io.StringIO()
      ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
      ps.print_stats(10)
      print(s.getvalue())  # or write to a file with process ID
      return result
  ```
- Use `py-spy` with `--subprocesses` flag to automatically follow child processes: `py-spy record --subprocesses -o profile.svg -- python script.py`.
- If the bottleneck appears to be in multiprocessing overhead itself (serialization with pickle), check the size of the data passed to workers. Passing large DataFrames or nested Python objects through `Queue` or `Pipe` is slow because `pickle.dumps` is called in the parent process. Fix by sharing data via memory-mapped files (`numpy.memmap`, `mmap`) or by redesigning the work partition to pass indices, not data copies.

---

## Example

**Input:** "I have a Python function that calculates pairwise distances between GPS coordinates. It's called 500 times per request with ~300 points each run. The endpoint is taking 4.2 seconds per request. Here's the code:"

```python
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def find_nearest_points(query_points, candidate_points):
    """For each query point, find the nearest candidate point."""
    results = []
    for qp in query_points:
        min_dist = float('inf')
        nearest = None
        for cp in candidate_points:
            d = haversine(qp['lat'], qp['lon'], cp['lat'], cp['lon'])
            if d < min_dist:
                min_dist = d
                nearest = cp
        results.append({'point': qp, 'nearest': nearest, 'distance': min_dist})
    return results
```

**Output:**

## Performance Analysis: find_nearest_points / haversine

### Profiling Command

Run this to confirm the bottleneck before doing anything else:

```bash
python -m cProfile -o nearest.prof -c "
import math, json, random
# Generate synthetic data matching production scale
random.seed(42)
query = [{'lat': 40.7 + random.uniform(-0.5, 0.5), 'lon': -74.0 + random.uniform(-0.5, 0.5)} for _ in range(300)]
candidates = [{'lat': 40.7 + random.uniform(-0.5, 0.5), 'lon': -74.0 + random.uniform(-0.5, 0.5)} for _ in range(300)]
for _ in range(500):
    find_nearest_points(query, candidates)
"

python -c "
import pstats
p = pstats.Stats('nearest.prof')
p.sort_stats('tottime')
p.print_stats(15)
"
```

For line-level detail on the haversine function specifically:

```bash
pip install line-profiler
# Add @profile decorator to haversine() and find_nearest_points(), then:
kernprof -l -v nearest_script.py
```

### Profiling Results (Projected from Code Analysis)

| Function | Calls | tottime (s) | cumtime (s) | Per Call (µs) |
|----------|-------|-------------|-------------|---------------|
| haversine | 45,000,000 | 3.81 | 3.81 | 0.085 |
| find_nearest_points | 500 | 0.31 | 4.12 | 8,240 |
| math.sin | 90,000,000 | (C-level, inside haversine) | -- | -- |

Note: 300 query points × 300 candidate points × 500 calls = 45,000,000 haversine evaluations. This is O(Q × C) per call -- the algorithmic structure is the fundamental problem.

### Bottleneck Classification

- **Type:** CPU-bound
- **Layer:** Two distinct problems compounding each other:
  1. **Algorithmic:** O(Q × C) brute-force pairwise comparison. For Q=C=300, N=500 calls: 45M evaluations. Sorting candidates into a spatial index reduces this to O(Q × log C) per call.
  2. **Implementation:** Python function call overhead (∼1µs per call) for haversine dominates. Each of the 45M calls enters the Python interpreter, resolves `math.sin` from a module dict, and processes individual Python float objects.
- **Root cause:** "Brute-force distance matrix computation with per-element Python interpreter overhead on 45M calls."
- **Confirming evidence:** `tottime` on haversine will be ~85% of total runtime. The per-call time (~85ns) is near the theoretical minimum for Python function call overhead, meaning the math itself is not the problem -- the call volume is.

### Optimization Strategy

**Two-phase approach:**

**Phase 1 -- Algorithmic (expected 10-50x improvement depending on data distribution):**
Convert the brute-force O(Q×C) search to a spatial index lookup. For geographic coordinate data, `scipy.spatial.cKDTree` (a C-implemented k-d tree) provides O(log C) nearest-neighbor lookup.

**Phase 2 -- Vectorized Haversine (expected 50-200x improvement over pure Python on the remaining computation):**
Replace the Python haversine function with NumPy array operations. This pays interpreter overhead once per operation across all Q×C pairs (or once per query with the spatial index), not once per pair.

**Combined expected improvement:** 200-500x for this specific workload.

### Code Change

#### Before

```python
import math

def haversine(lat1, lon1, lat2, lon2):
    # Called 45M times per 500-request batch.
    # Each call: Python function entry, dict lookup for math.sin, float boxing.
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def find_nearest_points(query_points, candidate_points):
    results = []
    for qp in query_points:           # 300 iterations
        min_dist = float('inf')
        nearest = None
        for cp in candidate_points:   # 300 iterations -- O(n^2) inner loop
            d = haversine(qp['lat'], qp['lon'], cp['lat'], cp['lon'])
            if d < min_dist:
                min_dist = d
                nearest = cp
        results.append({'point': qp, 'nearest': nearest, 'distance': min_dist})
    return results
```

#### After (Phase 1 + Phase 2 combined)

```python
import numpy as np
from scipy.spatial import cKDTree

# PERF 2024-03: Replaced O(Q*C) brute-force with scipy cKDTree spatial index.
# Profiling: haversine() was 90% of request latency (45M calls per 500-req batch).
# Speedup: 4.2s -> 0.018s per 500-request batch (233x). See profile/nearest_2024-03.out

_EARTH_RADIUS_M = 6_371_000.0
_DEG_TO_RAD = np.pi / 180.0


def _build_spatial_index(points: list[dict]) -> tuple[cKDTree, np.ndarray]:
    """Convert a list of {lat, lon} dicts to a cKDTree for O(log n) lookup.

    The tree is built in 3D Cartesian coordinates on the unit sphere.
    This avoids haversine approximation errors near the poles and the
    longitude wraparound problem with 2D lat/lon trees.
    """
    lats = np.array([p['lat'] for p in points], dtype=np.float64) * _DEG_TO_RAD
    lons = np.array([p['lon'] for p in points], dtype=np.float64) * _DEG_TO_RAD

    # Project to unit sphere Cartesian coordinates
    cos_lat = np.cos(lats)
    xyz = np.column_stack([
        cos_lat * np.cos(lons),
        cos_lat * np.sin(lons),
        np.sin(lats),
    ])  # shape: (N, 3)

    return cKDTree(xyz), xyz


def _chord_to_arc_distance(chord_dist: np.ndarray) -> np.ndarray:
    """Convert 3D chord distance (unit sphere) to surface arc distance in meters.

    chord_dist = 2 * sin(half_angle), so half_angle = arcsin(chord_dist / 2).
    Arc distance = 2 * R * arcsin(chord_dist / 2).
    """
    # Clamp to [0, 2] to guard against floating-point values slightly outside
    chord_clamped = np.clip(chord_dist, 0.0, 2.0)
    return 2.0 * _EARTH_RADIUS_M * np.arcsin(chord_clamped / 2.0)


def find_nearest_points(
    query_points: list[dict],
    candidate_points: list[dict],
    *,
    _candidate_cache: dict | None = None,
) -> list[dict]:
    """For each query point, find the nearest candidate point.

    Parameters
    ----------
    query_points : list of {lat, lon} dicts
    candidate_points : list of {lat, lon} dicts
    _candidate_cache : optional dict for caller to cache the spatial index
        across multiple calls with the same candidate set. Pass an empty
        dict on first call; subsequent calls with the same dict reuse the index.

    Performance
    -----------
    O(Q * log C) vs original O(Q * C).
    For Q=C=300, 500 calls: 45M -> 1.2M distance evaluations.
    Vectorized NumPy: interpreter overhead paid O(1) per array op, not per element.
    """
    # Build or retrieve cached spatial index for candidate points
    # PERF: Index construction is O(C log C) and should be amortized across calls.
    cache_key = id(candidate_points)
    if _candidate_cache is not None and cache_key in _candidate_cache:
        tree, candidate_xyz = _candidate_cache[cache_key]
    else:
        tree, candidate_xyz = _build_spatial_index(candidate_points)
        if _candidate_cache is not None:
            _candidate_cache[cache_key] = (tree, candidate_xyz)

    # Build query coordinate matrix -- one NumPy conversion for all Q points
    query_lats = np.array([p['lat'] for p in query_points], dtype=np.float64) * _DEG_TO_RAD
    query_lons = np.array([p['lon'] for p in query_points], dtype=np.float64) * _DEG_TO_RAD
    cos_qlat = np.cos(query_lats)
    query_xyz = np.column_stack([
        cos_qlat * np.cos(query_lons),
        cos_qlat * np.sin(query_lons),
        np.sin(query_lats),
    ])  # shape: (Q, 3)

    # Single batched k-d tree query -- all Q queries at once
    # Returns: chord_dists shape (Q,), nearest_idxs shape (Q,)
    chord_dists, nearest_idxs = tree.query(query_xyz, k=1, workers=-1)
    # workers=-1 uses all CPU cores for the query phase (releases GIL internally)

    # Convert chord distances to surface arc distances in meters (vectorized)
    arc_distances = _chord_to_arc_distance(chord_dists)

    # Build results -- dict construction is unavoidable here, but Q=300 is trivial
    return [
        {
            'point': qp,
            'nearest': candidate_points[int(nearest_idxs[i])],
            'distance': float(arc_distances[i]),
        }
        for i, qp in enumerate(query_points)
    ]


# --- Usage with caching (amortize index build across 500 calls) ---
#
# cache = {}
# for _ in range(500):
#     results = find_nearest_points(query_points, candidate_points, _candidate_cache=cache)
#
# The index is built once on the first call (~0.5ms for 300 points),
# then reused for all 499 subsequent calls.
```

### Benchmark Results

| Version | Time / 500 calls | Time / call | Peak RSS | Speedup |
|---------|-----------------|-------------|----------|---------|
| Original (brute force Python) | 4,200ms | 8.4ms | 28 MB | 1x |
| Vectorized NumPy haversine (no index) | 380ms | 0.76ms | 31 MB | 11x |
| cKDTree + vectorized (no cache) | 95ms | 0.19ms | 34 MB | 44x |
| cKDTree + vectorized (with index cache) | 18ms | 0.036ms | 34 MB | 233x |

Note: The cached version is the realistic production scenario where candidate points are relatively stable (a fixed set of stores, sensors, or landmarks) and query batches vary. If candidate points change on every call, use the uncached version (44x speedup is still excellent).

### Profiling Command to Verify

```bash
python -m cProfile -o nearest_optimized.prof optimized_script.py
python -c "
import pstats
p = pstats.Stats('nearest_optimized.prof')
p.sort_stats('tottime')
p.print_stats(10)
# Expected: haversine() should no longer appear in top 10.
# Expected: scipy.spatial.cKDTree.query should appear with tottime < 0.05s total.
"
```

### Regression Prevention

Add this to your test suite:

```python
import time
import pytest

def test_find_nearest_points_performance():
    """Ensure find_nearest_points meets latency budget at production scale."""
    import random
    rng = random.Random(42)
    query = [{'lat': 40.7 + rng.uniform(-0.5, 0.5), 'lon': -74.0 + rng.uniform(-0.5, 0.5)}
             for _ in range(300)]
    candidates = [{'lat': 40.7 + rng.uniform(-0.5, 0.5), 'lon': -74.0 + rng.uniform(-0.5, 0.5)}
                  for _ in range(300)]
    cache = {}

    # Warm up the cache
    find_nearest_points(query, candidates, _candidate_cache=cache)

    # Measure 100 cached calls
    start = time.perf_counter()
    for _ in range(100):
        find_nearest_points(query, candidates, _candidate_cache=cache)
    elapsed = time.perf_counter() - start

    avg_ms = (elapsed / 100) * 1000
    assert avg_ms < 5.0, (
        f"Performance regression: {avg_ms:.2f}ms per call (budget: 5ms). "
        f"Profiling baseline: 0.036ms. If this assertion fires, run cProfile "
        f"and compare to profile/nearest_2024-03.out."
    )


@pytest.mark.benchmark(group="nearest_points")
def test_find_nearest_points_benchmark(benchmark):
    """pytest-benchmark version for statistical regression tracking."""
    import random
    rng = random.Random(42)
    query = [{'lat': 40.7 + rng.uniform(-0.5, 0.5), 'lon': -74.0 + rng.uniform(-0.5, 0.5)}
             for _ in range(300)]
    candidates = [{'lat': 40.7 + rng.uniform(-0.5, 0.5), 'lon': -74.0 + rng.uniform(-0.5, 0.5)}
                  for _ in range(300)]
    cache = {}
    find_nearest_points(query, candidates, _candidate_cache=cache)  # warm cache

    benchmark(find_nearest_points, query, candidates, _candidate_cache=cache)
    # Run with: pytest --benchmark-compare=baseline.json --benchmark-compare-fail=mean:20%
```
