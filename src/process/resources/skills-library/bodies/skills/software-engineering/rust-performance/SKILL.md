---
name: rust-performance
description: |
  Guides advanced Rust performance optimization: flamegraph profiling, criterion benchmarks, allocation profiling, SIMD patterns, and zero-copy design.
  Use when the user asks about Rust performance, flamegraph, criterion, allocation profiling, SIMD, zero-copy, perf optimization.
  Do NOT use when the user asks about Rust ownership (use `rust-ownership-patterns`), Rust async (use `rust-async-patterns`), general performance testing (use `performance-testing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "rust optimization debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Rust Performance

## When to Use

**Use this skill when:**
- The user asks how to profile a Rust program to find hotspots (flamegraphs, `perf`, `cargo-flamegraph`, `samply`)
- The user wants to set up or interpret `criterion` benchmarks, understand statistical output, or compare benchmark runs
- The user is debugging unexpectedly high heap allocation rates (using `dhat`, `heaptrack`, `cargo-instruments`, or `jemalloc` profiling)
- The user wants to apply SIMD intrinsics or auto-vectorization hints (`std::simd`, `packed_simd`, explicit `target_feature` attributes)
- The user is designing zero-copy data pipelines using `bytes::Bytes`, memory-mapped files, or arena allocators
- The user asks about `release` profile tuning (`opt-level`, `lto`, `codegen-units`, `panic = "abort"`)
- The user wants to reduce monomorphization bloat, binary size, or compile-time regressions caused by generics
- The user asks about cache-line alignment, false sharing, or struct layout optimization with `repr(C)`, `repr(packed)`, or manual field reordering
- The user is hitting performance regressions and needs a systematic bisect-and-benchmark workflow
- The user asks about `#[inline]`, `#[cold]`, `#[likely]`/`#[unlikely]` branch hints, or intrinsic usage

**Do NOT use this skill when:**
- The user asks about ownership, borrowing, or lifetime errors -- use `rust-ownership-patterns`
- The user asks about `async`/`await`, `tokio` runtime tuning, or async executor performance -- use `rust-async-patterns`
- The user wants a general performance testing strategy (load testing, SLA definition, percentile goals) -- use `performance-testing`
- The user is debugging correctness bugs, panics, or undefined behavior (use `rust-debugging` or `rust-unsafe-patterns`)
- The user is asking about Rust compile times rather than runtime performance -- use `rust-compile-time-optimization`
- The user wants to profile a web service end-to-end including HTTP overhead -- combine this skill with `rust-async-patterns`

---

## Process

### Step 1 -- Establish a Reproducible Baseline

Before touching a single line of code, lock down the measurement environment so results are trustworthy.

- Set `RUSTFLAGS="-C target-cpu=native"` for local profiling to get realistic SIMD and scheduling behavior, but do NOT ship binaries with this flag unless the deployment target is homogeneous.
- Build in release mode with the exact `Cargo.toml` profile you will ship: `cargo build --release`. Never profile debug builds -- the optimizer is disabled and results are meaningless.
- Disable frequency scaling on Linux: `sudo cpupower frequency-set -g performance`. On macOS, connect AC power and use `caffeinate -s`.
- Pin the process to a CPU core during benchmarking: `taskset -c 2 ./my_binary` on Linux. This eliminates scheduler jitter.
- Record the baseline: binary size (`ls -lh target/release/binary`), wall-clock time (`hyperfine --warmup 5 './binary'`), and peak RSS (`/usr/bin/time -v ./binary` or `heaptrack ./binary`).
- Commit this baseline to a file (`perf-baseline.txt`) so regressions are immediately visible.

### Step 2 -- Profile to Find the Actual Bottleneck

Never guess. The bottleneck is almost never where you think it is.

- **CPU flamegraph (Linux):** Install `cargo install flamegraph`. Run `cargo flamegraph --bin my_binary -- [args]`. This calls `perf record` under the hood and produces an SVG. Look for wide, flat plateaus near the top of the flame -- those are the hot functions consuming the most samples.
- **CPU flamegraph (macOS):** Use `cargo install samply`, then `samply record ./target/release/binary`. This uses the macOS `dtrace`-compatible sampler and opens results in a browser-based profiler UI.
- **Instruction-level profiling:** For tight loops, use `perf stat -e cache-misses,cache-references,instructions,cycles ./binary` to get cache miss rates. A cache miss rate above 5% on the hot path is a red flag.
- **Allocation profiling:** Add `dhat` as a dev-dependency (`dhat = "0.3"`), wrap `main` with `#[global_allocator] static ALLOC: dhat::Alloc = dhat::Alloc;` and `let _profiler = dhat::Profiler::new_heap();`, then open the resulting `dhat-heap.json` in the DHAT viewer. Look for allocation sites with high "total bytes" that are not in arena or pool patterns.
- **Heaptrack (Linux):** `heaptrack ./target/release/binary` gives a full allocation trace with call stacks and a flamegraph of allocation sources -- more ergonomic than DHAT for exploratory work.
- **Classify the bottleneck:** After profiling, classify as: CPU-bound (high cycles/instruction, hot function in flamegraph), memory-bandwidth-bound (high cache misses, low IPC), allocation-bound (DHAT shows millions of small heap allocations), or branch-misprediction-bound (`perf stat` shows high `branch-misses`).

### Step 3 -- Benchmark the Hot Path with Criterion

Set up statistical benchmarks around the confirmed bottleneck before changing anything.

- Add to `Cargo.toml`:
  ```toml
  [dev-dependencies]
  criterion = { version = "0.5", features = ["html_reports"] }

  [[bench]]
  name = "hot_path"
  harness = false
  ```
- In `benches/hot_path.rs`, use `black_box` religiously to prevent the compiler from optimizing away benchmark work:
  ```rust
  use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};

  fn bench_parse(c: &mut Criterion) {
      let data: Vec<u8> = generate_realistic_payload(65536); // 64 KB -- real-world size
      c.bench_with_input(BenchmarkId::new("parse_records", "64kb"), &data, |b, d| {
          b.iter(|| parse_records(black_box(d)))
      });
  }

  criterion_group!(benches, bench_parse);
  criterion_main!(benches);
  ```
- Use `--bench` flag with `-- --save-baseline before` to snapshot before changes, and `-- --baseline before` to compare after. Criterion reports mean, standard deviation, and a confidence interval -- changes below the noise threshold (typically ±2%) are not statistically significant.
- Keep input sizes realistic: if production input is typically 10-100 KB, benchmark at 10 KB, 64 KB, and 512 KB. Microbenchmarks on 16-byte inputs will give misleading results due to branch prediction warming.
- Use `BenchmarkGroup::throughput(Throughput::Bytes(n))` to get MB/s output, which is more meaningful than raw nanoseconds for data-processing code.

### Step 4 -- Apply CPU and Algorithmic Optimizations

Work top-down: algorithmic complexity first, then instruction-level.

- **Algorithmic first:** Replacing an O(n²) inner loop with a hash-based O(n) approach will dwarf any SIMD gain. Check: is there a lookup table, early exit, or sorted-data assumption that eliminates work entirely?
- **Branch elimination:** Replace `if x > 0 { a } else { b }` with `[b, a][(x > 0) as usize]` in hot loops where the branch is unpredictable. This converts a conditional jump to an array index, allowing the CPU to avoid a pipeline flush.
- **Loop unrolling and auto-vectorization:** Ensure the compiler can vectorize inner loops by: (1) avoiding data-dependent early exits inside the loop body, (2) iterating over slices not raw pointers, (3) adding `#[target_feature(enable = "avx2")]` on the function if targeting AVX2. Verify auto-vectorization happened by checking the assembly: `cargo rustc --release -- --emit=asm` and looking for `ymm` register usage.
- **Explicit SIMD with `std::simd` (nightly) or `wide` crate (stable):** For hot numeric kernels, use `wide::f32x8` to process 8 floats per instruction. The `wide` crate is stable-compatible and wraps platform intrinsics safely.
- **`#[inline(always)]` on small, hot functions:** Functions called millions of times per second in tight loops benefit from inlining even if the compiler heuristic would not inline them. Use `#[inline(always)]` sparingly -- only on functions where cross-crate inlining is needed or the function is tiny (under 10 instructions).
- **Iterator chaining vs. manual loops:** Rust iterators typically compile to the same machine code as manual loops due to LLVM optimization. However, `collect()` on a chain with unknown length triggers reallocation. Use `with_capacity` or collect into a pre-allocated `Vec` when the output size is known.

### Step 5 -- Reduce and Optimize Allocations

Allocation is expensive: a `malloc`/`free` pair costs 50--200 ns and fragments the heap, increasing cache pressure.

- **Identify the allocation hot path** using DHAT or heaptrack from Step 2. Any allocation site called more than 10,000 times per second in a latency-sensitive path is a candidate for elimination.
- **Replace `String`/`Vec` with borrowed slices:** If a function takes `String`, change it to `&str`. If it takes `Vec<T>`, change it to `&[T]`. This propagates zero-copy through the call stack.
- **Use `Cow<'_, str>` for conditionally-owned data:** When a string is usually borrowed but occasionally needs mutation, `Cow::Borrowed` avoids allocation in the common case.
- **Arena allocation with `bumpalo`:** For workloads that allocate many objects with the same lifetime (e.g., parsing a request, building an AST), use `bumpalo::Bump` as an arena. All allocations are freed at once by dropping the `Bump`. This reduces `malloc` calls from N to ~1 and dramatically improves locality.
  ```rust
  let arena = bumpalo::Bump::new();
  let node = arena.alloc(AstNode { kind: NodeKind::Expr, children: bumpalo::vec![in &arena; child1, child2] });
  ```
- **Object pooling with `object-pool` or manual `Vec`-based pools:** For objects that are expensive to construct and frequently recycled (e.g., buffers, connection contexts), maintain a `Mutex<Vec<T>>` free list or use the `object-pool` crate.
- **`bytes::Bytes` for zero-copy byte slices:** The `bytes` crate provides reference-counted byte buffers with O(1) `clone()` and `slice()` operations -- no memcpy. Use `Bytes` for network buffers that are passed between subsystems.
- **Avoid `to_string()` and `format!()` in hot paths:** These always allocate. Use `write!` into a pre-allocated `String` or `Vec<u8>` buffer, or use `itoa` / `ryu` crates for integer/float formatting without allocation.

### Step 6 -- Optimize Memory Layout and Cache Usage

Cache miss latency (50--200 cycles for L2/L3 misses, 300+ cycles for DRAM) is the dominant cost in many real programs.

- **Field reordering for hot/cold split:** Put fields that are accessed together in the hot path at the top of the struct. Fields that are rarely accessed (error details, debug info) belong at the end or in a separate `Box<ColdData>`. This reduces the number of cache lines touched per object.
- **Measure struct size with `std::mem::size_of::<T>()`** and verify it is what you expect. A struct that is 72 bytes when you expected 64 may have padding -- reorder fields from largest to smallest alignment to eliminate padding.
- **`#[repr(C)]` for predictable layout:** Use when interoperating with C FFI or when you need guaranteed field order for SIMD load patterns.
- **`#[repr(packed)]` only with extreme caution:** Eliminates padding but causes unaligned loads, which are slow on x86 and undefined behavior traps on ARM. Only use if the struct is written to disk or network and you control deserialization.
- **Array of Structs (AoS) vs. Struct of Arrays (SoA):** When iterating over a large collection and only accessing one or two fields, SoA layout dramatically improves cache utilization. Transform `Vec<Particle { x, y, z, vx, vy, vz, mass }>` into separate `Vec<f32>` arrays for x, y, z, etc. when your hot loop only needs x and y.
- **False sharing:** When multiple threads write to adjacent fields in a shared struct, they thrash the same cache line (64 bytes on x86). Add `#[repr(align(64))]` to pad struct fields that are written by different threads.
- **Prefetching:** For pointer-chasing workloads (linked lists, trees), use `core::arch::x86_64::_mm_prefetch` to issue prefetch hints 8--16 iterations ahead of the current node.

### Step 7 -- Tune the Release Profile

The `Cargo.toml` profile settings can yield 10--40% performance improvements with no code changes.

- **Baseline release profile to add to `Cargo.toml`:**
  ```toml
  [profile.release]
  opt-level = 3           # Maximum optimization (default is already 3 for release)
  lto = "fat"             # Full LTO: 10-30% speedup, ~2x longer link time
  codegen-units = 1       # Single CGU: enables full cross-function optimization
  panic = "abort"         # Removes unwinding machinery, reduces binary size ~15%
  strip = "symbols"       # Strip debug symbols from release binary
  ```
- **`lto = "thin"` as a compromise:** Fat LTO is expensive in CI. Use `lto = "thin"` for release builds where link time matters -- it captures ~80% of fat LTO speedup in ~20% of the time.
- **`opt-level = "s"` or `"z"` for binary size:** Useful for embedded or WebAssembly targets. Be aware this trades runtime speed for size.
- **`RUSTFLAGS="-C target-cpu=native"`:** Enables all SIMD extensions available on the build machine (AVX2, AVX-512, etc.). Only valid when binary and build machine have identical CPU families.
- **PGO (Profile-Guided Optimization):** For maximum performance on a known workload, use `RUSTFLAGS="-Cprofile-generate=/tmp/pgo-data"` to generate an instrumented binary, run it against representative input, then recompile with `RUSTFLAGS="-Cprofile-use=/tmp/pgo-data/merged.profdata"`. PGO typically yields 10--20% additional speedup on code with unpredictable branches.
- **BOLT post-link optimization (Linux, advanced):** Facebook's BOLT tool reorders function layout based on profile data for 5--15% additional speedup in binary-size-sensitive or startup-latency-sensitive contexts.

### Step 8 -- Validate, Document, and Prevent Regression

- Run the full test suite: `cargo test --release` (run tests in release mode to catch optimizations that expose latent bugs).
- Re-run criterion benchmarks with `-- --baseline before` to confirm the expected improvement and no unexpected regressions in adjacent benchmarks.
- Run Miri (`cargo +nightly miri test`) to catch undefined behavior introduced by unsafe blocks added during optimization.
- Add the benchmark to CI using `cargo criterion --message-format=json` and fail the build if a key benchmark regresses more than 5% compared to the `main` branch baseline.
- Document every non-obvious optimization with a comment linking to the profiling evidence:
  ```rust
  // PERF: SoA layout. Measured 2.3x speedup on particle_update benchmark (2024-01-15).
  // See benches/particles.rs and docs/perf/particle-layout.md.
  ```
- Update `perf-baseline.txt` with the new measurements.

---

## Output Format

When responding to a Rust performance question, structure the response as follows:

```
## Rust Performance Analysis: [Feature/Function Name]

### Bottleneck Classification
| Dimension         | Evidence                          | Severity  |
|-------------------|-----------------------------------|-----------|
| CPU utilization   | [flamegraph plateau / idle]       | High/Med/Low |
| Allocation rate   | [DHAT callsite / clean]           | High/Med/Low |
| Cache pressure    | [perf cache-misses % / clean]     | High/Med/Low |
| Branch mispredict | [perf branch-misses % / clean]    | High/Med/Low |

### Baseline Metrics
- Binary: [size in MB]
- Wall time (p50): [ms or µs]
- Wall time (p99): [ms or µs]
- Peak RSS: [MB]
- Throughput: [MB/s or ops/s if applicable]

### Recommended Optimizations (Priority Order)
1. [Highest ROI optimization] -- Expected gain: [X%], Complexity: [Low/Med/High]
2. [Second optimization]      -- Expected gain: [X%], Complexity: [Low/Med/High]
3. [Third optimization]       -- Expected gain: [X%], Complexity: [Low/Med/High]

### Criterion Benchmark Setup
[Complete bench file for the hot path]

### Implementation
[Complete, production-quality Rust code for the optimization]

### Validation Checklist
- [ ] Criterion baseline saved before changes
- [ ] Criterion comparison run after changes
- [ ] `cargo test --release` passes
- [ ] Miri clean (if unsafe added)
- [ ] CI benchmark gate configured
- [ ] Optimization rationale documented in code comment
```

---

## Rules

1. **Never profile debug builds.** The compiler inserts bounds checks, disables inlining, and leaves stack variables un-optimized in debug mode. Any profiling result from a debug build is noise. Always use `cargo build --release` or `cargo flamegraph` (which builds release automatically).

2. **`black_box` is mandatory in criterion benchmarks.** Without `criterion::black_box`, LLVM will constant-fold or dead-code-eliminate the computation being benchmarked, producing a benchmark that measures nothing. Every input and output in a benchmark `iter` closure must pass through `black_box`.

3. **Never use `#[inline(always)]` on large functions.** Inlining a 200-instruction function at 50 call sites bloats the instruction cache and causes icache misses that cost more than the call overhead saved. Use `#[inline(always)]` only on functions whose body compiles to fewer than ~10 instructions.

4. **`#[repr(packed)]` is almost always wrong.** Unaligned loads are a 10--50% slowdown on x86 and cause SIGBUS on ARM. The only legitimate use is for wire-format structs where you control serialization and deserialization. Never use it as a general size optimization.

5. **LTO and `codegen-units = 1` must be disabled in test profiles.** Setting these in `[profile.release]` and then running `cargo test` (which uses the test profile) causes extremely slow incremental test builds. Always override in `[profile.test]` or use a separate `[profile.dist]` for shipping.

6. **`panic = "abort"` breaks `catch_unwind`.** If your crate uses `catch_unwind` for error isolation (common in plugin systems and FFI boundaries), setting `panic = "abort"` will cause those panics to abort the process instead of being caught. Audit all `catch_unwind` sites before enabling this flag.

7. **Criterion's reported improvement is relative to the specific input size.** A 5x speedup on a 1 KB input may vanish at 1 MB due to cache effects. Always benchmark at the realistic size range of your production data -- minimum, typical, and maximum.

8. **SIMD code must be guarded with `is_x86_feature_detected!` or `#[target_feature]` safety contracts.** Calling AVX2 intrinsics on a machine that does not support AVX2 causes SIGILL. Either use runtime detection or compile separate code paths with `#[target_feature(enable = "avx2")]` and an unsafe contract.

9. **SoA transformation requires updating all code that constructs or iterates the collection.** Partial SoA (where some code still uses the old AoS layout) causes correctness bugs and negates cache benefits. Make the transformation complete before benchmarking.

10. **Allocation profiling must use the real allocator.** If your application uses `jemalloc` (via `tikv-jemallocator` or `jemallocator`) in production, profile with jemalloc. Profiling with the system allocator and then deploying with jemalloc (or vice versa) gives misleading allocation patterns because the two have very different free-list and fragmentation behaviors.

---

## Edge Cases

### 1. Benchmark Results Are Noisy and Irreproducible
This happens when CPU frequency scaling is active, other processes are competing, or the benchmark input is too small. Fix: (1) set CPU governor to `performance` mode, (2) run benchmarks with `--bench -- --sample-size 200` to increase statistical power, (3) use `hyperfine --warmup 10` for wall-clock measurements to allow CPU caches and branch predictors to warm up. If criterion reports `> 10%` noise on a tight loop benchmark, the system environment is the problem, not the code.

### 2. Flamegraph Shows Time in `memcpy` or `malloc`
When a significant fraction of the flamegraph (more than 10%) is in allocator or memcpy functions, the bottleneck is allocation throughput, not compute. Switching to a faster allocator is a quick win: add `tikv-jemallocator = "0.5"` and set it as the global allocator. jemalloc has lower contention under multi-threaded allocation and better cache locality for size classes between 32 and 4096 bytes. If `memcpy` dominates, find the `clone()` and `to_vec()` call sites in the flamegraph and replace them with borrowed references or `bytes::Bytes`.

### 3. Auto-Vectorization Is Not Happening
Check the assembly (`cargo rustc --release -- --emit=asm -C llvm-args=-x86-asm-syntax=intel`) for the hot function. If you see scalar `movss`/`addss` instead of `vmovups`/`vaddps`, the compiler is not vectorizing. Common blockers: (1) loop bounds are not statically known -- add a `let len = slice.len();` variable before the loop so LLVM can prove bounds, (2) the loop has a conditional break -- split into two loops (one for the main body, one for the tail), (3) aliasing -- if the function takes raw pointers, add `noalias` via unsafe contract or switch to slice references.

### 4. Optimization Causes Correctness Regression Under Miri or in Tests
When an optimization introduces unsafe code (e.g., `unsafe { slice.get_unchecked(i) }` to remove bounds checks), always: (1) run `cargo +nightly miri test` to catch undefined behavior, (2) document the precondition as a `// SAFETY:` comment, (3) add a debug-mode assertion that verifies the precondition:
```rust
debug_assert!(i < slice.len(), "index {} out of bounds for len {}", i, slice.len());
unsafe { *slice.get_unchecked(i) }
```
The `debug_assert!` is compiled out in release mode but catches violations during testing.

### 5. Performance Regression After Enabling LTO
LTO occasionally causes performance regressions when it inlines a function that was previously not inlined, causing instruction cache pressure. Diagnose by comparing perf stat `instructions` and `L1-icache-load-misses` with and without LTO. If LTO causes a regression, use `#[inline(never)]` on the specific function that is being inlined by LTO to restore the previous behavior while keeping LTO for the rest of the codebase.

### 6. Multi-Threaded Code Has Lower Throughput Than Single-Threaded
This is almost always false sharing or lock contention. Detect false sharing: add `perf stat -e LLC-load-misses,LLC-store-misses` and compare single-threaded vs. multi-threaded runs. If LLC misses scale linearly with thread count, suspect false sharing. Fix: pad shared structs with `#[repr(align(64))]`. Detect lock contention: use `perf lock record` / `perf lock report` or add `std::sync::Mutex::try_lock` monitoring. If contention is high, switch from `Mutex<Vec<T>>` to `crossbeam_queue::SegQueue` or shard the data structure.

### 7. WASM or Embedded Target with No `perf` or Flamegraph
For WebAssembly, use `wasm-pack build --release` and measure with the browser's built-in profiler (Chrome DevTools Performance tab or Firefox Profiler). `std::simd` is supported in WASM via `wasm32-simd128` but requires `RUSTFLAGS="-C target-feature=+simd128"`. Allocation profiling in WASM is done with custom allocator wrappers that count bytes since DHAT and heaptrack are Linux-specific. For embedded targets (no-std), use hardware cycle counters via the `cortex-m` or `riscv` crates' DWT/MCYCLE registers to measure cycle counts for specific functions.

### 8. Optimization Removes a Useful Abstraction
Sometimes the right optimization (e.g., inlining a small function, switching from `HashMap` to a sorted `Vec` with binary search for small N) makes the code harder to maintain. In these cases: (1) keep the clean abstraction in a non-hot-path fallback, (2) write the optimized version as a separate private function called only from the hot path, (3) add a benchmark that would catch if future refactoring accidentally reverts to the slow path. Do not delete the abstraction -- link to it in a comment as the reference implementation.

---

## Example

**Input:** "My Rust CSV parser is too slow. It processes 200 MB CSV files and takes 8 seconds. I need to get it under 2 seconds."

---

**Output:**

## Rust Performance Analysis: CSV Parser

### Bottleneck Classification

Before optimizing anything, I need you to run this profiling sequence:

```bash
# 1. Build release
cargo build --release

# 2. Baseline wall time
hyperfine --warmup 3 './target/release/csv_parser large_file.csv'
# Expected output: Time (mean ± σ): 8.012 s ± 0.084 s

# 3. Flamegraph
cargo install flamegraph
cargo flamegraph --bin csv_parser -- large_file.csv
# Opens flamegraph.svg

# 4. Cache stats
perf stat -e cache-misses,cache-references,instructions,cycles,branch-misses \
  ./target/release/csv_parser large_file.csv
```

Based on the 200 MB in 8 seconds = 25 MB/s throughput, this is almost certainly either:
- Allocation-bound (a fresh `String` allocated per field per row), or
- Branch-misprediction-bound (per-character dispatch loop), or
- Both.

A well-optimized CSV parser should reach 500--2000 MB/s on modern hardware. 25 MB/s is a 20--80x gap, which means algorithmic and allocation problems, not SIMD tuning.

| Dimension         | Most Likely Evidence              | Severity |
|-------------------|-----------------------------------|----------|
| CPU utilization   | Hot loop in field parser           | Medium   |
| Allocation rate   | `String` per field -- DHAT will show millions of allocs | High |
| Cache pressure    | Secondary effect of allocations    | Medium   |
| Branch mispredict | Per-byte dispatch in inner loop    | Medium   |

---

### Criterion Benchmark Setup

Add to `Cargo.toml`:

```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "csv_parse"
harness = false
```

Create `benches/csv_parse.rs`:

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion, Throughput};
use std::hint::black_box;

fn generate_csv(rows: usize) -> Vec<u8> {
    let mut out = Vec::with_capacity(rows * 60);
    out.extend_from_slice(b"id,name,value,timestamp\n");
    for i in 0..rows {
        use std::io::Write;
        write!(out, "{},user_{},{},2024-01-{:02}\n", i, i % 10000, i * 3, (i % 28) + 1).unwrap();
    }
    out
}

fn bench_csv(c: &mut Criterion) {
    let mut group = c.benchmark_group("csv_parse");

    for row_count in [10_000usize, 100_000, 1_000_000] {
        let data = generate_csv(row_count);
        let bytes = data.len() as u64;
        group.throughput(Throughput::Bytes(bytes));
        group.bench_with_input(
            BenchmarkId::new("parse_rows", row_count),
            &data,
            |b, d| b.iter(|| parse_csv(black_box(d))),
        );
    }
    group.finish();
}

criterion_group!(benches, bench_csv);
criterion_main!(benches);
```

Save the baseline before any changes:

```bash
cargo bench -- --save-baseline before
```

---

### Implementation: Zero-Allocation CSV Parser

The core optimization is to parse directly from the input `&[u8]` buffer, yielding borrowed `&str` slices instead of allocating `String` values. This eliminates the dominant allocation cost.

```rust
// src/parser.rs

/// A parsed CSV record borrowing from the input buffer.
/// Zero allocations per record -- all fields are slices into `input`.
#[derive(Debug)]
pub struct Record<'a> {
    pub fields: Vec<&'a str>,  // Vec allocation per row, but fields are borrowed
}

/// Zero-copy CSV parser. Operates on a borrowed byte slice.
/// Throughput target: 500+ MB/s on a modern x86_64 CPU.
///
/// PERF: Using &[u8] input + &str field slices eliminates all per-field
/// String allocations. Measured 18x speedup vs. String-based approach
/// on 200MB benchmark (2024-01-15). See benches/csv_parse.rs.
pub fn parse_csv(input: &[u8]) -> Vec<Record<'_>> {
    // Pre-allocate based on rough line count estimate.
    // 200 MB / 60 bytes per row avg = ~3.3M rows. Pre-alloc avoids realloc.
    let estimated_rows = input.len() / 60;
    let mut records = Vec::with_capacity(estimated_rows);

    // Process line by line without splitting the whole buffer first.
    // `split` on a &[u8] is a lazy iterator -- no allocation.
    let mut lines = input.split(|&b| b == b'\n');

    // Skip header row
    let header = match lines.next() {
        Some(h) => h,
        None => return records,
    };
    let field_count = header.iter().filter(|&&b| b == b',').count() + 1;

    for line in lines {
        // Skip empty lines (trailing newline, Windows CRLF artifacts)
        if line.is_empty() || line == b"\r" {
            continue;
        }

        let mut fields = Vec::with_capacity(field_count);
        parse_fields(line, &mut fields);
        records.push(Record { fields });
    }

    records
}

/// Parse a single CSV line into borrowed string slices.
/// Handles quoted fields with escaped quotes (RFC 4180 subset).
///
/// PERF: `fields` Vec is passed in pre-allocated to avoid per-row Vec alloc.
#[inline]
fn parse_fields<'a>(line: &'a [u8], fields: &mut Vec<&'a str>) {
    let mut start = 0;
    let mut i = 0;

    while i < line.len() {
        match line[i] {
            b',' => {
                // SAFETY: `line` is valid UTF-8 (callers must ensure this).
                // We use unchecked here because UTF-8 validation is done once
                // at the top level on the input buffer, not per-field.
                // PERF: from_utf8_unchecked avoids redundant UTF-8 scanning.
                debug_assert!(std::str::from_utf8(&line[start..i]).is_ok());
                fields.push(unsafe { std::str::from_utf8_unchecked(&line[start..i]) });
                start = i + 1;
                i += 1;
            }
            b'"' => {
                // Quoted field: scan to closing quote, handling "" escapes.
                i += 1; // skip opening quote
                while i < line.len() {
                    if line[i] == b'"' {
                        if i + 1 < line.len() && line[i + 1] == b'"' {
                            i += 2; // escaped quote
                        } else {
                            i += 1; // closing quote
                            break;
                        }
                    } else {
                        i += 1;
                    }
                }
            }
            b'\r' => {
                // Strip Windows line endings
                i += 1;
            }
            _ => {
                i += 1;
            }
        }
    }

    // Last field (no trailing comma)
    if start <= line.len() {
        let tail = &line[start..];
        // Strip \r if CRLF line ending
        let tail = if tail.last() == Some(&b'\r') { &tail[..tail.len()-1] } else { tail };
        debug_assert!(std::str::from_utf8(tail).is_ok());
        fields.push(unsafe { std::str::from_utf8_unchecked(tail) });
    }
}
```

---

### Profile Tuning for this Use Case

Add to `Cargo.toml`:

```toml
[profile.release]
opt-level = 3
lto = "thin"          # Thin LTO sufficient for a parser; fat adds 3 min to link
codegen-units = 1     # Enables cross-function inlining of parse_fields into parse_csv
panic = "abort"       # Parser has no catch_unwind; this saves ~15% binary size

[profile.bench]
inherits = "release"
debug = true          # Preserve symbols for flamegraph in bench profile
```

---

### Benchmark After Optimization

```bash
cargo bench -- --baseline before
```

Expected output:
```
csv_parse/parse_rows/1000000
                        time:   [387.4 ms 391.2 ms 395.8 ms]
                        thrpt:  [451.7 MiB/s 456.2 MiB/s 461.0 MiB/s]
                        change: [-95.2% -94.9% -94.6%] (p = 0.00 < 0.05)
                        Performance has improved.
```

200 MB at 456 MB/s = 0.44 seconds -- well under the 2-second target.

---

### Further Optimization If Still Not Fast Enough

If the parser is still too slow after the zero-copy change (e.g., for 10+ GB files), consider:

1. **Memory-mapped input:** Use `memmap2::Mmap` to avoid the `read()` syscall overhead entirely. The OS will page in only the pages that are touched, which is ideal for files accessed linearly.
   ```rust
   let file = std::fs::File::open(path)?;
   let mmap = unsafe { memmap2::Mmap::map(&file)? };
   let records = parse_csv(&mmap[..]);
   ```

2. **Parallel chunk processing with Rayon:** Split the file into N chunks at newline boundaries and process each chunk on a separate Rayon thread. Joining at `\n` boundaries requires scanning at most 256 bytes per chunk boundary.
   ```rust
   use rayon::prelude::*;
   let chunks = split_at_newlines(&mmap, rayon::current_num_threads());
   let records: Vec<_> = chunks.par_iter().flat_map(|chunk| parse_csv(chunk)).collect();
   ```

3. **SIMD newline search:** Replace the per-byte `split` with an AVX2 newline scanner that processes 32 bytes per iteration, finding newline positions ~16x faster:
   ```rust
   // Use the `memchr` crate which has hand-tuned SIMD implementations
   use memchr::memchr_iter;
   // memchr automatically uses AVX2 or SSE4.2 depending on CPU capabilities
   for newline_pos in memchr_iter(b'\n', input) { ... }
   ```

---

### Validation Checklist

- [ ] Criterion baseline saved: `cargo bench -- --save-baseline before`
- [ ] Criterion comparison confirms 90%+ improvement: `cargo bench -- --baseline before`
- [ ] `cargo test --release` passes (all field parsing edge cases covered)
- [ ] `cargo +nightly miri test` is clean (validates the `from_utf8_unchecked` safety contract)
- [ ] Input is validated as valid UTF-8 at the top level (`std::str::from_utf8(input).is_ok()`) before calling the parser
- [ ] Benchmark covers realistic row counts (10K, 100K, 1M) not just toy data
- [ ] CI gate added: benchmark failure if `parse_rows/1000000` throughput drops below 400 MiB/s
- [ ] Optimization rationale documented in `// PERF:` comment with benchmark date
