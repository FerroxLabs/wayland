---
name: rust-testing-patterns
description: |
  Guides expert-level Rust testing: unit test organization, integration tests, property testing with proptest, benchmark testing with criterion, and mock patterns.
  Use when the user asks about Rust testing, unit tests, integration tests, proptest, criterion, mocking in Rust, test organization.
  Do NOT use when the user asks about Rust project setup (use `rust-project-setup`), Rust error handling (use `rust-error-handling`), general testing concepts (use `unit-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "rust testing tdd"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Rust Testing Patterns

## When to Use

**Use this skill when the user asks about:**
- Writing unit tests in Rust, including test organization within modules, test helper patterns, and assertion strategies
- Setting up integration tests in the `tests/` directory and structuring them for a Cargo workspace
- Property-based testing with `proptest` or `quickcheck`, including strategy composition and shrinking behavior
- Benchmark testing with `criterion`, including statistical configuration and flamegraph integration
- Mocking and faking dependencies in Rust, including trait-based fakes, `mockall`, and conditional compilation patterns
- Test coverage tooling with `cargo-llvm-cov` or `cargo-tarpaulin`, including CI thresholds and HTML reports
- Async test patterns with `tokio::test`, `async-std::test`, or custom async runtimes
- Snapshot testing with `insta` for complex output types

**Do NOT use this skill when:**
- The user asks about setting up a new Rust project from scratch -- use `rust-project-setup` instead, which covers `Cargo.toml` workspace layout, toolchain pinning, and CI bootstrapping
- The user asks about Rust error handling design, `Result`/`Option` combinators, or `thiserror`/`anyhow` usage -- use `rust-error-handling` instead
- The user is asking about general testing philosophy, TDD cycles, or test pyramid theory without Rust-specific context -- use `unit-testing-patterns` instead
- The user is asking about fuzzing with `cargo-fuzz` or `libFuzzer` specifically -- that is a separate security-oriented discipline beyond standard property testing
- The user is asking about load testing or performance benchmarking of HTTP services -- use dedicated HTTP benchmarking tooling guidance instead

---

## Process

### 1. Classify the Testing Need

Before writing any code, determine which testing layer the user actually needs. These layers are not interchangeable.

- **Unit tests** live in the same file as the code under test, inside a `#[cfg(test)]` module. They test a single function or small struct in isolation. They compile into the same crate and have access to private items.
- **Integration tests** live in `tests/` at the crate root. They test the public API of the crate as an external consumer would. Each file in `tests/` becomes a separate binary with its own `main`. Shared helpers must live in `tests/common/mod.rs` (not `tests/common.rs`) to avoid Cargo compiling them as a test binary.
- **Doc tests** are embedded in `///` comments. They verify that documentation examples compile and produce correct output. They are invaluable for public API documentation but inappropriate for complex business logic.
- **Benchmark tests** use `criterion` and live in `benches/`. They are excluded from `cargo test` and run explicitly via `cargo bench`.
- **Property tests** use `proptest` or `quickcheck`. They belong in `#[cfg(test)]` modules like unit tests but require strategy configuration. Default to `proptest` because its macro DSL is more ergonomic and its shrinking is automatic.

Clarify the user's specific layer before proceeding. A user who says "I want to test my database layer" needs integration tests and a test database setup, not a `#[cfg(test)]` module.

---

### 2. Structure Unit Tests Correctly

Unit tests in Rust have specific structural conventions that differ from most other languages.

- Place the test module at the bottom of each source file: `#[cfg(test)] mod tests { use super::*; }`. The `use super::*;` import grants access to private functions, which is intentional and idiomatic -- Rust's visibility system allows this.
- Name test functions using `snake_case` with the pattern `{function_name}_{scenario}_{expected_outcome}`, for example: `parse_date_empty_string_returns_error`, `calculate_tax_zero_income_returns_zero`.
- Use `assert_eq!` for value equality, `assert!` for boolean conditions, and `assert_matches!` (stable since Rust 1.82) for pattern matching assertions. Avoid rolling your own match + panic.
- Provide the optional message argument on assertions when the failure would be ambiguous: `assert_eq!(result, expected, "failed for input: {:?}", input)`.
- Use `#[should_panic(expected = "division by zero")]` for tests that verify panic behavior, always specifying the `expected` substring to avoid masking unrelated panics.
- Extract repeated setup into plain `fn setup() -> T` helper functions within the test module. Do not use lazy statics for test setup unless the initialization is genuinely expensive -- prefer determinism over performance in tests.
- Use `Result`-returning tests -- `fn my_test() -> Result<(), Box<dyn std::error::Error>>` -- to avoid `.unwrap()` in test bodies. This produces cleaner failure messages and allows the `?` operator.

---

### 3. Design Integration Tests

Integration tests exercise your crate's public interface. Poorly organized integration tests are harder to debug than unit tests because failures are less localized.

- Create `tests/common/mod.rs` for all shared test helpers. This file is NOT compiled as a test binary, unlike files directly in `tests/`. Export builder structs, database fixture creators, and HTTP test clients from here.
- Each file in `tests/` compiles as a standalone binary. Group related integration tests into the same file (`tests/user_management.rs`, `tests/billing.rs`) rather than one file per test function. This reduces compilation time significantly in large projects.
- For tests that require external resources (databases, message queues, file system state), use the `tempfile` crate for filesystem isolation. Each test that touches the filesystem should create its own `TempDir` that auto-deletes on drop.
- For database integration tests, prefer spinning up a real database via Docker (using `testcontainers` crate) over SQLite or in-memory substitutes. Testing against the actual database engine catches SQL dialect issues, index behavior, and transaction semantics that a substitute will miss.
- Use `#[ignore]` to tag slow or infrastructure-dependent integration tests. Run them explicitly with `cargo test -- --ignored` in CI. This keeps `cargo test` fast for local development.
- For HTTP API integration tests, use `axum::Server` or `actix-web::test` utilities to bind to port 0 (OS-assigned) and create a real HTTP client against that ephemeral port. Never hardcode port numbers.

---

### 4. Apply Property Testing with `proptest`

Property-based testing finds edge cases that example-based tests miss by generating hundreds of random inputs and automatically shrinking failures to minimal reproducers.

- Add `proptest = "1"` to `[dev-dependencies]`. The most important first step is identifying a property -- an invariant that must hold for ALL valid inputs, not just the examples you thought of.
- Use the `proptest!` macro with `prop_assert!` and `prop_assert_eq!` (not `assert!` -- these integrate with proptest's failure reporting and allow the macro to continue shrinking on failure).
- Common strategy types: `any::<u32>()` for integers, `"[a-z]{1,20}"` regex for strings, `prop::collection::vec(any::<i32>(), 0..100)` for vectors, `prop::option::of(any::<u32>())` for optional values.
- Compose strategies with `.prop_map()` to derive valid domain types: `(1u32..=1000, 1u32..=50).prop_map(|(price, qty)| Order { price, qty })`.
- Use `.prop_filter()` sparingly. Proptest discards filtered values and retries; filtering more than 50% of generated values causes test failure by default. If you find yourself writing complex filters, redesign your strategy.
- The default number of test cases is 256. Increase to 1000+ for critical invariants: `#[test] fn test_invariant() { let config = ProptestConfig { cases: 1024, ..Default::default() }; proptest!(config, |(x in any::<u32>())| { ... }); }`.
- When proptest finds a failure, it saves a regression file in `proptest-regressions/`. Commit these files to version control. They become deterministic regression tests.
- Good property candidates: round-trip properties (serialize then deserialize returns the original), commutativity (order of inputs doesn't change the result), idempotency (applying the function twice equals applying it once), monotonicity (larger input produces larger output).

---

### 5. Write Benchmarks with `criterion`

`criterion` provides statistically rigorous benchmarks with warm-up phases, outlier detection, and regression tracking. It is the standard for Rust performance measurement.

- Add to `Cargo.toml`:
  ```toml
  [dev-dependencies]
  criterion = { version = "0.5", features = ["html_reports"] }

  [[bench]]
  name = "my_benchmark"
  harness = false
  ```
- The `harness = false` is mandatory. Without it, Cargo applies the test harness to `benches/` files, which conflicts with criterion's own `main`.
- Structure each benchmark file with a `criterion_group!` and `criterion_main!` macro. Group related benchmarks to compare them in criterion's HTML output.
- Use `b.iter(|| { ... })` for the hot loop. Wrap return values with `criterion::black_box()` to prevent the compiler from optimizing away the computation. Failing to use `black_box` produces meaningless benchmarks.
- Use `bench_function` for simple benchmarks, `benchmark_group` with `throughput` for data-processing benchmarks where you want MB/s or items/s: `group.throughput(Throughput::Bytes(data.len() as u64))`.
- Set a baseline with `cargo bench -- --save-baseline main` before making changes. After changes, compare with `cargo bench -- --baseline main`. Criterion will report percentage change with confidence intervals.
- A performance difference is only meaningful if criterion's confidence interval excludes 0. Dismiss sub-5% changes unless your application has extremely tight SLAs.
- Enable flamegraph support with `criterion = { features = ["async_futures", "html_reports"] }` and install `cargo-flamegraph`. Run `cargo flamegraph --bench my_benchmark` to identify hot paths within the benchmarked function.

---

### 6. Implement Mocking and Faking Strategies

Rust's ownership model and trait system create different mocking constraints than object-oriented languages. The idiomatic approach is trait-based, not method-interception based.

- **The preferred approach is hand-written fakes.** Define a trait for your dependency, implement it for both the real type and a `Fake` struct in the test module. Fakes are simple, debuggable, and don't require a macro ecosystem. For example: a `Clock` trait with `fn now(&self) -> DateTime<Utc>` can have a `FakeClock { time: DateTime<Utc> }` that returns a fixed time.
- **Use `mockall` when you need dynamic expectation verification** -- specifically when you need to assert that a method was called a specific number of times with specific arguments. Add `mockall = "0.12"` to `[dev-dependencies]`. Annotate the trait with `#[cfg_attr(test, automock)]`. In tests, use `mock.expect_method().times(1).returning(|_| Ok(42))`.
- Never use `mockall` in production code paths. The `#[cfg_attr(test, automock)]` pattern ensures the mock impl only exists during test compilation.
- Use `#[cfg(test)]` blocks to add `new_with_fake_dependency()` constructors to structs -- alternative constructors that accept trait objects for testing. These should not exist in the public API.
- For HTTP dependencies, use `wiremock` crate to spin up a real HTTP mock server. This is more reliable than mocking the HTTP client itself because it tests your serialization, headers, and URL construction.
- Avoid `mockall` for traits with generic methods or complex lifetimes -- the derive macro cannot handle these. Fall back to a hand-written fake.
- Conditional compilation pattern for injectable dependencies:
  ```rust
  #[cfg(not(test))]
  use crate::EmailSender;
  #[cfg(test)]
  use crate::tests::FakeEmailSender as EmailSender;
  ```
  Use this sparingly -- it makes the production type non-injectable at runtime. Prefer trait objects or generics over conditional compilation for real DI needs.

---

### 7. Configure Coverage and CI Integration

Coverage measurement in Rust requires instrumentation at the LLVM level. Two tools are practical: `cargo-llvm-cov` (preferred) and `cargo-tarpaulin` (Linux-only alternative).

- Install: `cargo install cargo-llvm-cov`. Run: `cargo llvm-cov --all-features --workspace --lcov --output-path lcov.info`.
- Generate an HTML report locally with `cargo llvm-cov --open`. This opens a browser with line-by-line and branch coverage.
- Exclude non-testable code with `#[cfg(not(tarpaulin_include))]` (tarpaulin) or `// coverage:off ... // coverage:on` comments (llvm-cov). Exclude generated code, `main.rs` entrypoints, and `impl Display` boilerplate.
- Enforce coverage thresholds in CI: `cargo llvm-cov --fail-under-lines 80`. A threshold between 75--85% line coverage is practical for most production Rust projects. Do not set thresholds below 70% or above 90% -- below 70% is too permissive, above 90% incentivizes coverage theater (testing getters and `derive` impls).
- Run tests with all features enabled for coverage: `cargo llvm-cov --all-features`. Missing features means missing code paths.
- In CI, cache the `~/.cargo/registry` and `target/` directories but invalidate the cache when `Cargo.lock` changes. Benchmark jobs should run on dedicated hardware with fixed CPU frequency governors -- never on shared CI runners where time-sharing introduces noise.
- Separate CI jobs: fast unit tests (< 2 minutes), slow integration tests with `--ignored` flag (< 10 minutes), benchmarks on schedule or PR label (not on every commit).

---

### 8. Handle Async Testing

Async tests require a runtime executor. The approach differs based on which async runtime the project uses.

- For `tokio`, use `#[tokio::test]` instead of `#[test]`. This spawns a single-threaded runtime by default. Use `#[tokio::test(flavor = "multi_thread", worker_threads = 2)]` only when the code under test requires multi-threaded behavior.
- For testing timeout behavior, use `tokio::time::timeout(Duration::from_secs(5), future).await` inside tests. Never rely on `tokio::time::sleep` with arbitrary delays for synchronization -- use channels or `tokio::sync::Notify` instead.
- Use `tokio::time::pause()` and `tokio::time::advance()` to test time-dependent async code without actual wall-clock delays. This makes tests that involve retries, backoff, or TTLs run in milliseconds.
- For `async-std`, use `#[async_std::test]`. The runtime implications are similar to the tokio single-threaded flavor.
- Mock async traits carefully. `mockall` supports async via the `async_trait` crate, but the generated mock requires `#[async_trait]` on both the trait definition and mock impl. If you use `async-trait = "0.1"`, add `mockall`'s async support feature.
- For tests involving multiple async tasks communicating, use `tokio::sync::mpsc` channels in tests as a synchronization primitive. Do not use `Arc<Mutex<Vec<Event>>>` with busy-polling to collect async events -- use a channel with `try_recv` after an `await`.

---

## Output Format

When providing Rust testing guidance, structure your response as follows:

```
## Test Strategy for [Component/Feature]

### Layer Classification
| Layer | Files | Scope | Dependencies |
|-------|-------|-------|--------------|
| Unit  | src/[module].rs | Private + public functions | None (pure) or fakes |
| Integration | tests/[feature].rs | Public API only | testcontainers / wiremock |
| Property | src/[module].rs (cfg(test)) | Invariant under random input | proptest strategies |
| Benchmark | benches/[name].rs | Hot paths identified by profiling | criterion |

### Dependency Matrix
| Dependency | Test Strategy | Crate | Notes |
|------------|---------------|-------|-------|
| [DatabasePool] | testcontainers + real DB | testcontainers | Docker required in CI |
| [HttpClient] | wiremock server | wiremock | Real serialization tested |
| [Clock/Time] | FakeClock struct | (hand-written) | Deterministic timestamps |
| [FileSystem] | TempDir per test | tempfile | Auto-cleanup on drop |

### Coverage Configuration
- Target threshold: [N]% line coverage
- Excluded paths: [list]
- CI command: cargo llvm-cov --all-features --fail-under-lines [N]

### Implementation
[Concrete, compilable Rust code blocks for each layer]
```

---

## Rules

1. **Never place shared test helpers directly in `tests/common.rs`.** Cargo compiles every file in `tests/` as a test binary. A `tests/common.rs` file will appear as a "test binary with 0 tests" in output and wastes compilation time. Always use `tests/common/mod.rs`.

2. **Never use `unwrap()` or `expect()` in integration tests.** Return `Result<(), Box<dyn std::error::Error>>` from integration test functions and use `?` to propagate errors. Panics in test bodies produce less useful output than propagated errors with context.

3. **Never benchmark inside `#[test]` functions.** The test harness does not control warm-up, system load, or iteration count. Use `criterion` in `benches/` for all performance measurements. Timing inside tests is noise, not signal.

4. **Always use `criterion::black_box()` on all outputs of benchmarked code.** The Rust compiler performs aggressive dead-code elimination. Without `black_box`, the optimizer may eliminate the entire computation being benchmarked, producing a benchmark that measures nothing.

5. **Never share mutable state between tests.** Rust tests run in parallel by default (per test binary). Global mutable state via `static mut` or `lazy_static` with interior mutability causes data races or test interference. Use per-test setup functions returning owned values.

6. **Always commit `proptest-regressions/` files.** When proptest finds a minimal failing case, it writes a deterministic seed file. Committing these files prevents regressions -- future runs will re-test the previously failing case even before randomly rediscovering it.

7. **Never mock concrete types -- only mock trait implementations.** Rust has no runtime method interception. Attempting to mock concrete structs requires unsafe code or invasive refactoring. If a type is hard to test, extract a trait first, then mock the trait.

8. **Always use `#[cfg_attr(test, automock)]` for mockall, not `#[automock]`.** Placing `#[automock]` without `cfg_attr(test, ...)` adds the mock implementation to production binaries, increasing binary size and compile times.

9. **Set `RUST_TEST_THREADS=1` for tests that touch global process state** (environment variables, working directory, signal handlers). These tests must run serially. Alternatively, use `serial_test` crate's `#[serial]` attribute to serialize specific tests without serializing the entire test suite.

10. **Never filter more than ~30% of proptest-generated values with `prop_filter`.** Excessive filtering causes proptest to exhaust its rejection budget (default: 32 rejections per value) and fail with a `TestCaseError::Reject`. Design strategies that generate valid values directly rather than filtering invalid ones.

---

## Edge Cases

### Workspace with Multiple Crates

In a Cargo workspace, `cargo test` runs tests for all crates. Integration test files in `crates/my_crate/tests/` can only access the public API of `my_crate`, not sibling crates, unless those sibling crates are added as `[dev-dependencies]`. If you need a shared test utility library used across multiple crates, create a dedicated `crates/test-helpers` crate with `publish = false` in its `Cargo.toml` and add it as a dev-dependency in each crate that needs it.

Coverage with `cargo llvm-cov` in a workspace requires `--workspace` flag. Without it, only the root crate is measured. Report coverage per-crate for meaningful thresholds when crates have very different purposes (a CLI binary crate will have lower testable coverage than a library crate).

### Testing Trait Objects and Dynamic Dispatch

When code accepts `Box<dyn Trait>` or `&dyn Trait`, hand-written fakes are straightforward -- implement the trait on a simple struct and box it. The complication arises when the trait is not object-safe (has generic methods, `Self` bounds, or `async fn` without `async-trait`). In this case, you have three options: make the code generic over `T: Trait` instead of using `dyn Trait` (enables static dispatch and direct fake injection), use `async-trait` to make async traits object-safe, or redesign the interface to remove the problematic method signature. Never force a trait to be object-safe by removing `Clone` bounds or other useful constraints -- the test pain is telling you something about the API design.

### Flaky Async Tests

Async tests are the most common source of test flakiness in Rust projects. The root causes are: tests depending on ordering of futures that may schedule differently under load, tests using `sleep` for synchronization, and tests that don't properly shut down background tasks. Diagnose flaky async tests by running `cargo test -- --test-threads=1` to force serial execution -- if the flakiness disappears, the tests share state or have ordering dependencies. Fix by using `tokio::sync::Barrier`, channels, or `Notify` for explicit synchronization. Never use `tokio::time::sleep(Duration::from_millis(50))` as a "give the background task time to run" hack -- this is timing-dependent and will fail under load.

### Large Property Test Search Spaces

When property testing types with complex invariants (for example, a valid AST node, a balanced binary tree, or a well-formed HTTP request), generating valid instances with `any::<T>()` plus filters is impractical. Instead, implement `proptest::arbitrary::Arbitrary` for your type directly, with a custom `Strategy` implementation. The `proptest-derive` crate can auto-derive `Arbitrary` for structs and enums with `#[derive(Arbitrary)]`, which is sufficient for most cases. For recursive data structures (like trees), use `proptest`'s `prop_recursive` combinator, which manages depth limits to prevent stack overflows during generation.

### Testing `unsafe` Code

Tests for `unsafe` code must verify memory safety guarantees that Rust cannot check statically. Use the `miri` interpreter (`cargo +nightly miri test`) to detect undefined behavior, use-after-free, and invalid memory access in your test suite. Miri is slow (10--100x slower than native execution) so run it on a subset of unit tests, particularly those that exercise the unsafe boundary. Additionally, run tests under AddressSanitizer: `RUSTFLAGS="-Z sanitizer=address" cargo +nightly test -Zbuild-std --target x86_64-unknown-linux-gnu`. Both Miri and AddressSanitizer require nightly; run them in a dedicated CI job, not on every commit.

### Feature-Flagged Code

Code behind `#[cfg(feature = "...")]` is not compiled in the default test run. A test that only exists under a feature flag must be run with `cargo test --features my-feature` or `cargo test --all-features`. In CI, add an explicit job for `cargo test --all-features` to ensure no feature combination is broken. If you have many feature flags with complex interactions, use `cargo hack --feature-powerset test` (from the `cargo-hack` plugin) to test all feature combinations automatically -- though this is only practical for crates with fewer than ~12 features.

### Snapshot Testing Complex Outputs

When testing functions that produce large structured outputs (serialized JSON, rendered templates, AST dumps, formatted code), `assert_eq!` produces diffs that are hard to read and require updating expected values manually. Use the `insta` crate for snapshot testing. Call `insta::assert_snapshot!(result)` or `insta::assert_json_snapshot!(value)`. On first run, insta creates snapshot files under `snapshots/`. Review and approve them with `cargo insta review`. On subsequent runs, insta compares against the stored snapshot. Commit snapshot files to version control -- they serve as explicit, reviewable documentation of output changes. Use `insta::with_settings!(|s| { s.set_sort_maps(true); }, || { ... })` to normalize non-deterministic fields like timestamps or map ordering before snapshotting.

---

## Example

**Input:** "I'm building a billing service in Rust. It has a `BillingEngine` struct that calculates invoice totals, applies discount codes by looking them up in a database, and sends confirmation emails. How should I structure tests for this?"

**Output:**

### Test Strategy for BillingEngine

#### Layer Classification

| Layer | Files | Scope | Dependencies |
|-------|-------|-------|--------------|
| Unit | `src/billing_engine.rs` | `calculate_total`, `apply_discount` pure logic | None -- pure arithmetic |
| Property | `src/billing_engine.rs` (cfg(test)) | Invoice total invariants | proptest strategies |
| Integration | `tests/billing_engine.rs` | Full `BillingEngine::process_invoice` | testcontainers (Postgres), wiremock (SMTP) |
| Snapshot | `src/billing_engine.rs` (cfg(test)) | Invoice JSON serialization format | insta |

#### Dependency Matrix

| Dependency | Test Strategy | Crate | Notes |
|------------|---------------|-------|-------|
| `DiscountRepository` (database) | `FakeDiscountRepository` in unit tests; real Postgres in integration | testcontainers | Docker must be available in CI |
| `EmailSender` (SMTP) | `FakeEmailSender` in unit tests; wiremock in integration | wiremock | Verify email body and recipients |
| `Clock` | `FakeClock` returning fixed `DateTime<Utc>` | (hand-written) | Invoice timestamps must be deterministic |

#### Implementation

**Step 1: Define traits for all external dependencies.**

```rust
// src/ports.rs
use async_trait::async_trait;
use chrono::{DateTime, Utc};

pub trait Clock: Send + Sync {
    fn now(&self) -> DateTime<Utc>;
}

#[async_trait]
pub trait DiscountRepository: Send + Sync {
    async fn find_discount(&self, code: &str) -> Result<Option<Discount>, DbError>;
}

#[async_trait]
pub trait EmailSender: Send + Sync {
    async fn send_invoice_confirmation(
        &self,
        recipient: &str,
        invoice: &Invoice,
    ) -> Result<(), EmailError>;
}
```

**Step 2: Write unit tests with fakes for pure logic.**

```rust
// src/billing_engine.rs

pub struct BillingEngine<R: DiscountRepository, E: EmailSender, C: Clock> {
    repo: R,
    email: E,
    clock: C,
}

impl<R: DiscountRepository, E: EmailSender, C: Clock> BillingEngine<R, E, C> {
    /// Pure calculation -- no I/O, fully unit testable.
    pub fn calculate_total(&self, line_items: &[LineItem]) -> Money {
        line_items.iter().map(|item| item.unit_price * item.quantity).sum()
    }

    pub fn apply_discount(&self, total: Money, discount: &Discount) -> Money {
        match discount.kind {
            DiscountKind::Percentage(pct) => total * (1.0 - pct / 100.0),
            DiscountKind::FixedAmount(amt) => (total - amt).max(Money::ZERO),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    // --- Fakes ---

    struct FakeClock(DateTime<Utc>);
    impl Clock for FakeClock {
        fn now(&self) -> DateTime<Utc> { self.0 }
    }

    struct FakeDiscountRepo(Option<Discount>);
    #[async_trait::async_trait]
    impl DiscountRepository for FakeDiscountRepo {
        async fn find_discount(&self, _code: &str) -> Result<Option<Discount>, DbError> {
            Ok(self.0.clone())
        }
    }

    struct FakeEmailSender { sent: std::sync::Mutex<Vec<String>> }
    impl FakeEmailSender {
        fn new() -> Self { Self { sent: std::sync::Mutex::new(vec![]) } }
        fn sent_to(&self) -> Vec<String> { self.sent.lock().unwrap().clone() }
    }
    #[async_trait::async_trait]
    impl EmailSender for FakeEmailSender {
        async fn send_invoice_confirmation(
            &self, recipient: &str, _invoice: &Invoice,
        ) -> Result<(), EmailError> {
            self.sent.lock().unwrap().push(recipient.to_string());
            Ok(())
        }
    }

    fn make_engine(discount: Option<Discount>) -> BillingEngine<
        FakeDiscountRepo, FakeEmailSender, FakeClock
    > {
        BillingEngine {
            repo: FakeDiscountRepo(discount),
            email: FakeEmailSender::new(),
            clock: FakeClock(Utc.with_ymd_and_hms(2024, 1, 15, 12, 0, 0).unwrap()),
        }
    }

    // --- Unit tests: pure calculation ---

    #[test]
    fn calculate_total_multiple_items_sums_correctly() -> Result<(), Box<dyn std::error::Error>> {
        let engine = make_engine(None);
        let items = vec![
            LineItem { unit_price: Money::from_cents(1000), quantity: 3 },
            LineItem { unit_price: Money::from_cents(500),  quantity: 2 },
        ];
        assert_eq!(engine.calculate_total(&items), Money::from_cents(4000));
        Ok(())
    }

    #[test]
    fn apply_discount_fixed_amount_does_not_go_below_zero() {
        let engine = make_engine(None);
        let discount = Discount {
            kind: DiscountKind::FixedAmount(Money::from_cents(5000)),
        };
        let result = engine.apply_discount(Money::from_cents(3000), &discount);
        assert_eq!(result, Money::ZERO,
            "discount larger than total should clamp to zero, not go negative");
    }

    #[test]
    fn apply_discount_percentage_rounds_to_nearest_cent() {
        let engine = make_engine(None);
        let discount = Discount { kind: DiscountKind::Percentage(33.333) };
        // $10.00 * 66.667% = $6.6667 -- should round to $6.67
        let result = engine.apply_discount(Money::from_cents(1000), &discount);
        assert_eq!(result, Money::from_cents(667));
    }

    // --- Property tests ---

    use proptest::prelude::*;

    prop_compose! {
        fn arb_line_items()(
            items in prop::collection::vec(
                (1u64..=10_000u64, 1u32..=100u32).prop_map(|(cents, qty)| {
                    LineItem {
                        unit_price: Money::from_cents(cents),
                        quantity: qty,
                    }
                }),
                1..=20,
            )
        ) -> Vec<LineItem> { items }
    }

    proptest! {
        #![proptest_config(ProptestConfig { cases: 1024, ..Default::default() })]

        #[test]
        fn calculate_total_never_negative(items in arb_line_items()) {
            let engine = make_engine(None);
            let total = engine.calculate_total(&items);
            prop_assert!(total >= Money::ZERO,
                "total {:?} should never be negative for non-negative inputs", total);
        }

        #[test]
        fn apply_discount_never_increases_total(
            cents in 1u64..=1_000_000u64,
            pct in 0.0f64..=100.0f64,
        ) {
            let engine = make_engine(None);
            let total = Money::from_cents(cents);
            let discount = Discount { kind: DiscountKind::Percentage(pct) };
            let discounted = engine.apply_discount(total, &discount);
            prop_assert!(discounted <= total,
                "discounted {:?} should not exceed original {:?}", discounted, total);
        }
    }
}
```

**Step 3: Write integration tests against real Postgres.**

```rust
// tests/billing_engine.rs

mod common;  // tests/common/mod.rs

use common::{start_postgres, seed_discount_code};
use billing_service::BillingEngine;
use wiremock::{MockServer, Mock, ResponseTemplate};
use wiremock::matchers::{method, path};

#[tokio::test]
async fn process_invoice_with_valid_discount_sends_confirmation_email() {
    // Arrange: real Postgres via testcontainers
    let pg = start_postgres().await;  // returns TestcontainerPool
    seed_discount_code(&pg, "SAVE20", DiscountKind::Percentage(20.0)).await;

    // Arrange: mock SMTP server via wiremock
    let smtp_mock = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/send"))
        .respond_with(ResponseTemplate::new(200))
        .expect(1)  // assert exactly one email sent
        .mount(&smtp_mock)
        .await;

    let engine = BillingEngine::new(pg.pool(), smtp_mock.uri());

    let request = InvoiceRequest {
        customer_email: "alice@example.com".to_string(),
        line_items: vec![
            LineItem { unit_price: Money::from_cents(10_000), quantity: 1 },
        ],
        discount_code: Some("SAVE20".to_string()),
    };

    // Act
    let invoice = engine.process_invoice(request).await
        .expect("process_invoice should succeed");

    // Assert: total is $100.00 - 20% = $80.00
    assert_eq!(invoice.total, Money::from_cents(8_000));
    assert_eq!(invoice.discount_applied, Money::from_cents(2_000));

    // wiremock verifies the email was sent exactly once when smtp_mock drops
}

#[tokio::test]
#[ignore]  // requires Docker -- run with: cargo test -- --ignored
async fn process_invoice_with_invalid_discount_code_returns_error() {
    let pg = start_postgres().await;
    let engine = BillingEngine::new(pg.pool(), "http://unused".to_string());

    let request = InvoiceRequest {
        customer_email: "bob@example.com".to_string(),
        line_items: vec![LineItem { unit_price: Money::from_cents(5_000), quantity: 2 }],
        discount_code: Some("INVALID_CODE".to_string()),
    };

    let result = engine.process_invoice(request).await;
    assert_matches!(result, Err(InvoiceError::InvalidDiscountCode(code)) if code == "INVALID_CODE");
}
```

**Step 4: Snapshot test the serialized invoice format.**

```rust
#[cfg(test)]
mod snapshot_tests {
    use super::*;
    use insta::assert_json_snapshot;

    #[test]
    fn invoice_serialization_format_stable() {
        let invoice = Invoice {
            id: InvoiceId::from("inv_00000000"),  // deterministic test ID
            customer_email: "alice@example.com".to_string(),
            subtotal: Money::from_cents(10_000),
            discount_applied: Money::from_cents(2_000),
            total: Money::from_cents(8_000),
            created_at: Utc.with_ymd_and_hms(2024, 1, 15, 12, 0, 0).unwrap(),
            line_items: vec![
                LineItem { unit_price: Money::from_cents(10_000), quantity: 1 },
            ],
        };

        // On first run, creates snapshots/billing_engine__snapshot_tests__invoice_serialization_format_stable.snap
        // Review with: cargo insta review
        assert_json_snapshot!(invoice, {
            ".id" => "[id]",  // redact non-deterministic fields
        });
    }
}
```

#### Coverage Configuration

```toml
# .cargo/config.toml (not committed for local, but set in CI environment)
[env]
CARGO_INCREMENTAL = "0"  # required for accurate llvm-cov instrumentation
```

```bash
# CI coverage job
cargo llvm-cov \
  --all-features \
  --workspace \
  --ignore-filename-regex "(main\.rs|generated)" \
  --fail-under-lines 82 \
  --lcov --output-path lcov.info

# Upload to coverage service
cargo llvm-cov report --html --output-dir target/coverage-report
```

The 82% threshold reflects that `main.rs` and generated protobuf code are excluded. The `calculate_total` and `apply_discount` functions should reach 100% line and branch coverage due to unit + property test coverage. The database error paths in `process_invoice` that require infrastructure failures (connection timeout, constraint violation) contribute the gap -- document these explicitly rather than artificially inflating coverage with low-value tests.
