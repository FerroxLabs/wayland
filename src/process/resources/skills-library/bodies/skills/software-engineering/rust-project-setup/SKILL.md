---
name: rust-project-setup
description: |
  Guides expert-level Rust project initialization: Cargo workspace configuration, feature flags, build.rs patterns, release profile optimization, and toolchain management.
  Use when the user asks about Rust project setup, Cargo workspace, Cargo.toml, feature flags, build.rs, release profiles, rustfmt, clippy.
  Do NOT use when the user asks about Rust ownership patterns (use `rust-ownership-patterns`), Rust testing (use `rust-testing-patterns`), Rust async (use `rust-async-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "rust best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Rust Project Setup

## When to Use

**Use this skill when the user:**
- Asks how to initialize a new Rust project or Cargo workspace, including monorepo layouts with multiple crates
- Asks about structuring `Cargo.toml` -- workspace members, dependency inheritance, resolver version, or package metadata
- Asks about defining or consuming feature flags, including optional dependencies, additive feature design, and `cfg` attribute usage
- Asks about `build.rs` scripts -- linking native libraries, code generation, environment variable injection, or compile-time detection
- Asks about release profile tuning -- `opt-level`, `lto`, `codegen-units`, `panic`, `strip`, and `debug` settings
- Asks about toolchain management -- `rust-toolchain.toml`, `rustup` component installation, pinning nightly vs. stable
- Asks about configuring `rustfmt`, `clippy`, `.cargo/config.toml`, or setting up CI for Rust projects
- Asks about structuring library crates for distribution on crates.io, including documentation, `[lib]` section, and publish metadata

**Do NOT use this skill when:**
- The user asks about Rust ownership, borrowing, or lifetime annotation -- use `rust-ownership-patterns`
- The user asks about writing unit tests, integration tests, or property-based testing -- use `rust-testing-patterns`
- The user asks about async runtimes, tokio configuration, or async/await patterns -- use `rust-async-patterns`
- The user asks about debugging a runtime panic or memory issue -- the question is diagnostic, not structural
- The user asks about publishing a crate for the first time -- that workflow involves `cargo publish`, `cargo login`, and crates.io metadata beyond project setup
- The user asks about cross-compilation targets specifically -- that is a deployment and toolchain topic distinct from project initialization

---

## Process

### 1. Assess Project Shape and Deployment Context

Before writing a single line of configuration, gather the following facts. The answers change almost every configuration decision.

- **Binary vs. library vs. workspace:** A binary crate (`[[bin]]` or `src/main.rs`) needs a minimal `[package]` section and release profile optimization. A library crate (`[lib]`, `src/lib.rs`) needs `doc-url`, `categories`, `keywords`, and a stable API surface. A Cargo workspace needs a root `[workspace]` with `members`, `resolver = "2"`, and `[workspace.dependencies]` for shared dependency versions.
- **Target environment:** Bare metal / embedded (`no_std`) requires `#![no_std]` in `lib.rs`, a `panic` handler, and a linker script in `build.rs`. Server-side Linux workloads tolerate larger binaries and benefit from LTO. WASM targets need `wasm-pack` or `wasm-bindgen` and a separate `[profile.release]` with `opt-level = "s"`.
- **Team vs. solo:** Team projects need `rustfmt.toml`, `clippy.toml`, `.cargo/config.toml` committed to the repository, and a `rust-toolchain.toml`. Solo projects can be more lenient but benefit from the same discipline.
- **Minimum supported Rust version (MSRV):** Set `rust-version` in `Cargo.toml` if you need MSRV guarantees. Crates targeting enterprise customers often pin to a Rust version that shipped 6--12 months ago. Use `cargo msrv` (the `cargo-msrv` tool) to find the actual minimum.
- **Dependency resolver:** Always use `resolver = "2"` (the 2021 edition resolver) in new projects. The old resolver causes feature unification problems across the workspace that are difficult to diagnose.

---

### 2. Initialize the Project Structure

Use `cargo new` or `cargo init` as the starting point, then reshape it.

- For a workspace, create a root `Cargo.toml` that contains only `[workspace]` and `[workspace.dependencies]`. Do not add a `[package]` section to the root unless you intend the root itself to be a crate.
- Use the `members` glob carefully: `members = ["crates/*"]` is convenient but hides new crates until you add them. Prefer explicit listing for small workspaces (fewer than 10 crates) and the glob for large monorepos.
- Set `exclude = ["vendor/*", "examples/scratch"]` in the workspace to avoid Cargo trying to compile throwaway code.
- Place internal crates under `crates/` and integration-test-only crates under `tests/` or `xtask/`. The `xtask` pattern (a dedicated binary crate that acts as a task runner invoked via `cargo xtask build`) replaces Makefile in Rust-idiomatic projects.
- Decide on a `src/lib.rs` plus `src/bin/main.rs` split early. A crate that exposes both a library and a CLI binary should have its logic in `src/lib.rs` and a thin `src/bin/main.rs` that calls into it. This makes the library testable independently of the CLI argument parsing.
- Run `cargo metadata --format-version 1` after initialization to confirm Cargo sees the workspace members correctly before proceeding.

---

### 3. Configure `Cargo.toml` with Precision

The `Cargo.toml` is the most consequential file in a Rust project. Treat it with the same care as source code.

**Root workspace `Cargo.toml`:**
```toml
[workspace]
members = ["crates/core", "crates/api", "crates/cli"]
resolver = "2"

[workspace.dependencies]
# Pin exact versions for internal crates, ranges for external
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.36", features = ["rt-multi-thread", "macros"] }
anyhow = "1.0"
thiserror = "1.0"
tracing = "0.1"

[workspace.metadata.scripts]
# Documented for xtask integration
```

**Per-crate `Cargo.toml`:**
```toml
[package]
name = "myproject-core"
version = "0.1.0"
edition = "2021"
rust-version = "1.74"
authors = ["Your Name <you@example.com>"]
description = "Core domain logic for myproject"
license = "MIT OR Apache-2.0"
repository = "https://github.com/yourorg/myproject"
documentation = "https://docs.rs/myproject-core"

[dependencies]
serde = { workspace = true }
anyhow = { workspace = true }

[dev-dependencies]
# Dev deps are NOT inherited from workspace by default -- list explicitly
pretty_assertions = "1.4"
```

- Use `{ workspace = true }` for all dependencies that exist in `[workspace.dependencies]`. This is the single source of truth for versions.
- Avoid `*` version specifiers. They break reproducible builds and prevent `cargo audit` from catching vulnerabilities.
- Use `default-features = false` at the workspace dependency definition level when you want to opt into features explicitly. This is especially important for `serde` (disable `std` for `no_std` crates), `tokio` (avoid pulling in all features everywhere), and `reqwest` (avoid default TLS).
- Keep `[dev-dependencies]` lean. Pulling in `proptest`, `criterion`, and `wiremock` as dev-dependencies only is fine -- they do not affect the final binary size.
- Specify `[lib] crate-type = ["cdylib", "rlib"]` only when building FFI libraries. `rlib` alone is the default and correct for Rust-to-Rust use.

---

### 4. Define Feature Flags Correctly

Feature flags in Rust are additive by design -- a feature should only enable more functionality, never disable or change existing behavior.

- Name features descriptively: `serde-support`, `async-std-runtime`, `tracing-integration` -- not `feature1` or `extra`.
- Gate dependencies behind features:
  ```toml
  [features]
  default = ["std"]
  std = []
  serde-support = ["dep:serde", "dep:serde_json"]
  async = ["dep:tokio", "tokio/rt-multi-thread"]
  
  [dependencies]
  serde = { version = "1.0", features = ["derive"], optional = true }
  serde_json = { version = "1.0", optional = true }
  tokio = { version = "1.36", optional = true }
  ```
- Use the `dep:` prefix (Rust 1.60+) to avoid the dependency name being automatically treated as a feature. Without `dep:`, `serde = { optional = true }` implicitly creates a `serde` feature, which is confusing and can leak into the public API surface.
- Avoid mutually exclusive features -- Cargo has no built-in mechanism to enforce them and users will combine them. Design the code so combining `async-std-runtime` and `tokio-runtime` produces a compile error with a clear `compile_error!()` message guarded by `cfg` attributes.
- In `src/lib.rs`, gate implementations with `#[cfg(feature = "serde-support")]` -- not `#[cfg_attr]` unless you specifically need the attribute form on an item.
- Test features explicitly in CI:
  - `cargo test` (default features)
  - `cargo test --no-default-features`
  - `cargo test --all-features`
  - `cargo test --features serde-support`
  These four invocations catch the majority of feature-gating bugs.
- Document every feature in the crate-level rustdoc with `//! ## Feature Flags` and a table listing each feature, what it enables, and whether it is on by default.

---

### 5. Write `build.rs` When Necessary

`build.rs` runs before compilation. Use it for specific, justified purposes -- not as a general scripting escape hatch.

**Legitimate `build.rs` uses:**
- Linking a native C library: emit `cargo:rustc-link-lib=static=sodium`, `cargo:rustc-link-search=native=/usr/local/lib`
- Compile-time code generation: invoke `prost-build` for protobuf, `bindgen` for C headers, or a custom codegen step that writes to `OUT_DIR`
- Injecting build metadata: read `GIT_HASH` from the environment or call `git rev-parse HEAD` and emit it as `cargo:rustc-env=BUILD_GIT_HASH=abc123` so code can access it via `env!("BUILD_GIT_HASH")`
- Detecting target platform features: check `std::env::var("CARGO_CFG_TARGET_OS")` to conditionally link platform libraries

**`build.rs` rules:**
- Always print `cargo:rerun-if-changed=build.rs` as the first line. Add `cargo:rerun-if-changed=src/protos/` for any external files you consume. Without these, Cargo will re-run `build.rs` on every build, destroying incremental compilation.
- Write generated code to `std::env::var("OUT_DIR").unwrap()` -- never to `src/`. Generated files in `src/` should never be committed.
- Include generated code with `include!(concat!(env!("OUT_DIR"), "/generated.rs"))` inside the consuming module.
- Keep `build.rs` dependencies in `[build-dependencies]`, separate from `[dependencies]`. `bindgen`, `prost-build`, and `cc` belong here.
- If `build.rs` is complex (more than 50 lines), refactor it into a `build/` directory with `mod` files: `build/main.rs`, `build/codegen.rs`, etc. Configure this with `build = "build/main.rs"` in `Cargo.toml`.

---

### 6. Tune Release Profiles

The default `[profile.release]` in Cargo is conservative. Production deployments and embedded targets require explicit tuning.

```toml
# Cargo.toml (workspace root or package)

[profile.release]
opt-level = 3          # Maximum optimization. Use "s" for size, "z" for aggressive size
lto = "thin"           # Thin LTO: good balance of link time vs. binary quality
                       # Use lto = true (fat LTO) for maximum optimization, slower link
codegen-units = 1      # Serialize all codegen for better inlining across modules
panic = "abort"        # Remove unwinding machinery; saves ~10-20% binary size
strip = "debuginfo"    # Strip debug info from release binary; use "symbols" to strip all
debug = false          # No debug info in release (redundant with strip but explicit)

[profile.dev]
opt-level = 0          # Fast compilation, no optimization
debug = true           # Full debug info
split-debuginfo = "unpacked"  # Faster incremental linking on macOS (use "packed" on Linux)

# Custom profile for profiling: release settings but with debug info retained
[profile.profiling]
inherits = "release"
debug = true
strip = "none"

# Size-optimized profile for WASM or embedded
[profile.release-size]
inherits = "release"
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
strip = "symbols"
```

**Profile decision guidance:**
- `lto = "thin"` reduces build time by 30--50% vs. `lto = true` (fat LTO) with about 5--10% worse runtime performance. For most server-side applications, `thin` is the right choice.
- `codegen-units = 1` is mandatory if you use `lto = true`. Fat LTO with multiple codegen units is redundant and wastes link time.
- `panic = "abort"` breaks any code that catches panics via `std::panic::catch_unwind`. Check your dependencies: some testing and retry logic crates rely on this. If uncertain, leave at `"unwind"`.
- `strip = "debuginfo"` is safe for production. Stripped binaries still produce useful stack traces if you retain the unstripped artifact in your CI system and use a symbol server.
- Always define a `[profile.profiling]` -- you will need it when `perf`, `flamegraph`, or `samply` is applied to a production-like binary.

---

### 7. Configure Toolchain, Linting, and Formatting

Lock down the toolchain and quality tools at the repository level so every developer and CI run uses identical configurations.

**`rust-toolchain.toml` (committed to the repo root):**
```toml
[toolchain]
channel = "stable"
# Pin to a specific version for maximum reproducibility:
# channel = "1.77.0"
components = ["rustfmt", "clippy", "rust-src", "rust-analyzer"]
targets = ["x86_64-unknown-linux-gnu", "wasm32-unknown-unknown"]
```

**`rustfmt.toml` (committed to the repo root):**
```toml
edition = "2021"
max_width = 100
use_small_heuristics = "Default"
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true
format_macro_bodies = true
# Do NOT enable unstable features unless channel = "nightly"
# unstable_features = true
```

**`clippy.toml` (committed to the repo root):**
```toml
msrv = "1.74"
cognitive-complexity-threshold = 25
too-many-arguments-threshold = 7
```

**`.cargo/config.toml` (committed to the repo root):**
```toml
[alias]
xt = "run --package xtask --"
lint = "clippy --all-targets --all-features -- -D warnings"
doc-check = "doc --no-deps --all-features"

[build]
# Parallel front-end compilation jobs (default is logical CPU count)
# jobs = 8

[target.x86_64-unknown-linux-gnu]
# Use mold or lld for faster linking in development
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]

[env]
RUST_BACKTRACE = { value = "1", force = false }
```

**Clippy configuration in `Cargo.toml` (for workspace-wide deny lints):**

Add this to each crate's `src/lib.rs` or `src/main.rs`:
```rust
#![deny(
    clippy::all,
    clippy::pedantic,
    clippy::cargo,
)]
#![warn(
    clippy::nursery,
    missing_docs,
    rustdoc::missing_crate_level_docs,
)]
#![allow(
    clippy::module_name_repetitions,  // Common in Rust, often acceptable
    clippy::must_use_candidate,       // Overly aggressive in many codebases
)]
```

---

### 8. Verify the Setup End to End

Do not declare setup complete until every check passes from a clean checkout.

- `cargo check --workspace --all-features` -- fast type check, catches import and type errors in seconds
- `cargo build --workspace` -- full debug build; confirm zero warnings with `RUSTFLAGS="-D warnings" cargo build`
- `cargo fmt --all -- --check` -- formatting check (fails CI if diffs exist)
- `cargo clippy --workspace --all-targets --all-features -- -D warnings` -- linting with warnings-as-errors
- `cargo doc --workspace --no-deps --all-features` -- documentation builds without broken intra-doc links
- `cargo test --workspace` -- all tests pass (even with only the placeholder test from `cargo new`)
- `cargo audit` (from `cargo-audit`) -- zero known vulnerabilities in dependency tree
- `cargo deny check` (from `cargo-deny`) -- license compliance and duplicate dependency detection

If using a CI system, encode these as separate steps so failures are attributable. A single `cargo check && cargo test && cargo clippy` step masks which check failed.

---

## Output Format

When producing output for a user, structure the response as follows depending on what they asked:

### For Workspace Setup Requests

```
## Project Structure

<directory tree with file names and one-line description of each>

## Root Cargo.toml

```toml
<complete workspace Cargo.toml>
```

## Crate-Level Cargo.toml (crates/<name>/Cargo.toml)

```toml
<complete per-crate Cargo.toml>
```

## Toolchain Configuration (rust-toolchain.toml)

```toml
<complete rust-toolchain.toml>
```

## Quality Configuration

### rustfmt.toml
```toml
<complete rustfmt.toml>
```

### .cargo/config.toml
```toml
<complete .cargo/config.toml>
```

## Verification Commands

```sh
<ordered list of commands to run to verify the setup>
```

## Decision Rationale

| Decision | Choice | Reason |
|----------|--------|--------|
| Resolver | 2 | Avoids feature unification bugs from old resolver |
| LTO | thin | 50% faster link time vs. fat LTO, ~5% perf cost |
| ... | ... | ... |
```

### For Feature Flag Requests

```
## Feature Flag Design

| Feature Name | Enabled by Default | Enables Dependencies | Notes |
|--------------|-------------------|---------------------|-------|
| std          | yes               | (none)              | Required for std types |
| serde-support| no                | serde, serde_json   | Opt-in serialization |

## Cargo.toml [features] Section

```toml
<complete [features] and [dependencies] block>
```

## Usage in Source Code

```rust
<cfg-gated example code>
```

## CI Test Matrix

```sh
<explicit cargo test invocations for each feature combination>
```
```

### For build.rs Requests

```
## Build Script Purpose

<one paragraph explaining what this build.rs does and why>

## build.rs

```rust
<complete build.rs with rerun-if-changed guards>
```

## Cargo.toml [build-dependencies]

```toml
<complete build-dependencies block>
```

## Usage in Crate

```rust
<how to consume the output of build.rs in source code>
```
```

---

## Rules

1. **Always set `resolver = "2"` in workspace `Cargo.toml`.** The v1 resolver performs feature unification globally, meaning enabling a feature in one crate silently enables it in all crates. This causes subtle build failures and unexpected binary bloat that is extremely difficult to diagnose.

2. **Never use `path` dependencies in a published library crate's `[dependencies]` section.** Path dependencies resolve only in your local workspace. They will cause `cargo publish` failures or broken downstream builds. Use `path` for workspace-internal deps only, and always pair with a `version` field for eventual publication: `mylib-core = { path = "../core", version = "0.2" }`.

3. **Never commit `Cargo.lock` for library crates; always commit it for binary crates and applications.** Libraries should float their dependency versions to maximize compatibility with downstream users. Applications and binaries should lock for reproducible deployments. The rule is enforced by adding `Cargo.lock` to `.gitignore` for library-only repositories.

4. **Always specify `default-features = false` when declaring a workspace dependency that has heavy default features.** Crates like `tokio`, `reqwest`, `image`, and `sqlx` pull in significant transitive dependencies through their defaults. Opting in explicitly (`features = ["rt-multi-thread", "macros"]`) keeps compile times and binary sizes controlled.

5. **Every `build.rs` must emit `cargo:rerun-if-changed=build.rs` as its very first output.** Without this, Cargo assumes the script must re-run on every single build, negating all incremental compilation benefits. Add additional `cargo:rerun-if-changed=` lines for every external file or directory the script reads.

6. **Never generate code into `src/`.** Generated files belong in `std::env::var("OUT_DIR")`. Committing generated code creates merge conflicts, misleads readers, and causes divergence between committed files and build outputs. The only exception is checked-in generated files that are explicitly the product of an offline codegen step (like FFI bindings in an `upstream-sys` crate), and even then they must be clearly marked and isolated.

7. **`panic = "abort"` in release profiles must be an explicit team decision, not a default recommendation.** It reduces binary size and improves performance but permanently breaks `std::panic::catch_unwind`. Check all dependencies -- particularly test harnesses, rayon, and any middleware that uses catch-unwind for fault isolation -- before enabling it.

8. **Clippy lints must be configured at the source level (`#![deny(...)]` in `lib.rs` or `main.rs`), not only in CI flags.** Relying solely on `-- -D warnings` in CI means individual developers running `cargo clippy` locally see a different experience. Source-level deny lints are version-controlled, reviewable, and consistent across environments.

9. **The `rust-toolchain.toml` file must be committed to the repository root for any project with more than one developer.** Without it, different developers silently use different Rust versions. When Rust has a breaking change in a lint or a new warning, it manifests as a CI failure that works on one developer's machine but not another's -- a category of problem that `rust-toolchain.toml` eliminates entirely.

10. **Feature flags must be strictly additive -- enabling a feature must never change the behavior of code that was already compiling without that feature.** Non-additive features (where enabling feature B changes how feature A behaves) cause impossible-to-debug failures in downstream crates that transitively enable both features. If you need mutually exclusive behavior, use separate crate types or use a runtime configuration parameter instead of a compile-time feature flag.

---

## Edge Cases

### Migrating an Existing Single-Crate Project to a Workspace

When a project outgrows a single crate, migrating to a workspace requires careful sequencing to avoid breaking dependents.

- Move the existing crate to `crates/<name>/` and create a minimal root `Cargo.toml` with `[workspace]` only.
- If the crate is published on crates.io, its `name` and `version` must not change. The move is transparent to downstream users.
- Any CI scripts that reference `./Cargo.toml` or `cargo build` (without `--workspace`) will continue to work because Cargo resolves workspace membership automatically.
- Update `Cargo.lock` after the move: delete it and regenerate with `cargo generate-lockfile` to avoid stale path references.
- If the crate has a `build.rs`, verify that `OUT_DIR` paths are still resolved correctly -- they sometimes embed the old crate root path in cached artifacts.

### Handling `no_std` Crates in a `std` Workspace

`no_std` crates (for embedded or WASM) often live in the same workspace as `std` crates. This creates configuration friction.

- Add `#![no_std]` to the `no_std` crate's `lib.rs` and add `extern crate alloc;` if heap allocation is needed (and the target provides an allocator).
- In `[workspace.dependencies]`, declare `no_std`-compatible versions: `serde = { version = "1.0", default-features = false }`. Per-crate, add `features = ["derive"]` only where needed.
- Set up a separate target specification in `.cargo/config.toml`:
  ```toml
  [target.thumbv7em-none-eabihf]
  runner = "probe-run --chip STM32F429ZITx"
  rustflags = ["-C", "link-arg=-Tlink.x"]
  ```
- Never add the embedded crate to the `default-members` of the workspace -- it requires a cross-compiler that most developers will not have. Keep it in `members` (so workspace-wide commands find it) but use `cargo build --package myproject-embedded --target thumbv7em-none-eabihf` for explicit builds.

### Conditional Compilation for Platform-Specific Dependencies

When a dependency only exists on one platform (e.g., `winapi` on Windows, `nix` on Unix), use `cfg` platform specifiers in `Cargo.toml`:

```toml
[target.'cfg(unix)'.dependencies]
nix = "0.27"

[target.'cfg(windows)'.dependencies]
winapi = { version = "0.3", features = ["winsock2"] }

[target.'cfg(target_arch = "wasm32")'.dependencies]
web-sys = { version = "0.3", features = ["Window", "Document"] }
```

- The `cfg()` syntax in `Cargo.toml` uses the same predicates as `#[cfg]` in Rust source code.
- `cargo check --all-targets` does not cross-compile -- it only checks the host platform. Use `cargo check --target x86_64-pc-windows-gnu` in CI to verify Windows-specific code from a Linux host.
- Platform-specific dependencies must still appear in `[workspace.dependencies]` if they are shared across multiple workspace members.

### Reproducible Builds and Dependency Auditing

In security-sensitive or regulated environments, build reproducibility and supply chain integrity are requirements.

- Use `cargo vendor` to vendor all dependencies into the repository. Update `[source.crates-io]` in `.cargo/config.toml` to redirect to the vendored copy: `replace-with = "vendored-sources"`. This eliminates network calls and crates.io availability from the build.
- Add `cargo-deny` (`cargo deny check`) to CI. Configure `deny.toml` with `[licenses]` (allowlist only MIT, Apache-2.0, ISC, BSD-2-Clause, BSD-3-Clause), `[bans]` (deny specific crates or limit duplicates), and `[advisories]` (deny known CVEs).
- Use `cargo auditable build` to embed the dependency tree as JSON in the binary's `.note.cargo` section. This allows post-deployment auditing with `cargo audit bin ./target/release/myapp`.
- Pin the Rust toolchain to an exact version (`channel = "1.77.0"` in `rust-toolchain.toml`) rather than `"stable"` for fully reproducible builds.

### Slow Compile Times in Large Workspaces

Compile time is a first-class concern in large Rust workspaces. Address it structurally, not by disabling safety.

- Enable `sccache` or `cargo-cache` for shared CI caching. Configure with `RUSTC_WRAPPER=sccache` in the CI environment.
- Use `mold` or `lld` as the linker in development builds. Add to `.cargo/config.toml` under `[target.x86_64-unknown-linux-gnu]`: `rustflags = ["-C", "link-arg=-fuse-ld=mold"]`. Mold is 5--10x faster than the GNU linker for large projects.
- Audit dependency compile times with `cargo build --timings`. This generates an HTML report showing which crates take the longest. Candidates for trimming: `syn` (pulled in by nearly every derive macro), `regex` (precompile with `once_cell`), and `openssl-sys` (prefer `rustls` for faster compilation).
- Split the workspace into a "hot" set (frequently changed crates) and a "cold" set (stable utility crates). Organize the dependency graph so cold crates do not depend on hot crates. This maximizes cache hit rates.
- `opt-level = 0` in `[profile.dev]` is already the default but confirm that no crate-specific overrides (`[profile.dev.package.serde]`) are setting `opt-level = 3` globally -- this is a common copy-paste mistake that dramatically slows debug builds.

### Workspace with Mixed Rust Editions

When adding a new crate to an older workspace that predates `edition = "2021"`, edition mismatches cause subtle macro expansion and `use` path differences.

- Each crate declares its edition independently in `[package] edition`. A workspace can have crates at different editions simultaneously.
- The 2021 edition's resolver changes (`resolver = "2"`) apply at the workspace level regardless of individual crate editions.
- When upgrading a specific crate's edition, run `cargo fix --edition --package <name>` to automatically migrate syntax. Review the diff carefully -- the tool handles the mechanical parts but not semantic changes.
- `edition = "2021"` enables the disjoint capture improvement for closures, which can change move semantics. If a crate has many closures capturing struct fields, test thoroughly before committing the edition upgrade.

---

## Example

**Input:** "I'm starting a new production Rust project -- a CLI tool that also exposes a Rust library for embedding. It will have a core logic crate, a CLI crate, and potentially WASM support later. I need the workspace set up properly from the start."

**Output:**

---

### Project Structure

```
myproject/
├── Cargo.toml                    # Workspace root
├── Cargo.lock                    # Committed (binary application)
├── rust-toolchain.toml           # Toolchain pin
├── rustfmt.toml                  # Formatting config
├── clippy.toml                   # Lint thresholds
├── deny.toml                     # License and CVE policy
├── .cargo/
│   └── config.toml               # Linker, aliases, env
├── crates/
│   ├── myproject-core/           # Library crate (embeddable)
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs
│   └── myproject-cli/            # Binary crate (CLI entry point)
│       ├── Cargo.toml
│       └── src/
│           └── main.rs
└── xtask/                        # Task runner (replaces Makefile)
    ├── Cargo.toml
    └── src/
        └── main.rs
```

The WASM target will become `crates/myproject-wasm/` when added. Reserve the name in the workspace `members` list as a comment so it is not forgotten.

---

### Root `Cargo.toml`

```toml
[workspace]
members = [
    "crates/myproject-core",
    "crates/myproject-cli",
    "xtask",
    # "crates/myproject-wasm",  # Uncomment when WASM support is added
]
resolver = "2"

[workspace.dependencies]
# Internal crates
myproject-core = { path = "crates/myproject-core", version = "0.1" }

# External dependencies -- single source of truth for versions
anyhow       = "1.0"
thiserror    = "1.0"
serde        = { version = "1.0", default-features = false, features = ["derive"] }
serde_json   = { version = "1.0", default-features = false }
tracing      = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "fmt"] }
clap         = { version = "4.5", features = ["derive", "env"] }

[profile.dev]
opt-level = 0
debug = true
split-debuginfo = "unpacked"   # Faster incremental links on macOS

[profile.release]
opt-level = 3
lto = "thin"
codegen-units = 1
panic = "unwind"               # Keep unwind until team confirms no catch_unwind usage
strip = "debuginfo"

[profile.profiling]
inherits = "release"
debug = true
strip = "none"

[profile.release-size]
inherits = "release"
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
strip = "symbols"
```

---

### `crates/myproject-core/Cargo.toml`

```toml
[package]
name = "myproject-core"
version = "0.1.0"
edition = "2021"
rust-version = "1.74"
description = "Core logic for myproject -- embeddable as a library"
license = "MIT OR Apache-2.0"
repository = "https://github.com/yourorg/myproject"
documentation = "https://docs.rs/myproject-core"
keywords = ["cli", "utility"]
categories = ["command-line-utilities"]

[features]
default = ["std"]
std = []
# Opt-in serialization -- does not pull in serde unless requested
serde-support = ["dep:serde", "dep:serde_json", "std"]

[dependencies]
thiserror = { workspace = true }
anyhow    = { workspace = true }
tracing   = { workspace = true }
serde     = { workspace = true, optional = true }
serde_json = { workspace = true, optional = true }

[dev-dependencies]
pretty_assertions = "1.4"
```

---

### `crates/myproject-core/src/lib.rs`

```rust
//! # myproject-core
//!
//! Core domain logic for myproject. This crate is designed to be embedded
//! in both the CLI binary and future WASM bindings.
//!
//! ## Feature Flags
//!
//! | Feature | Default | Description |
//! |---------|---------|-------------|
//! | `std` | yes | Enables std-dependent types and I/O |
//! | `serde-support` | no | Enables Serialize/Deserialize on all public types |

#![deny(
    clippy::all,
    clippy::pedantic,
    clippy::cargo,
    missing_docs,
    rustdoc::missing_crate_level_docs,
)]
#![warn(clippy::nursery)]
#![allow(
    clippy::module_name_repetitions,
    clippy::must_use_candidate,
)]

pub mod error;
pub mod processor;
```

---

### `crates/myproject-cli/Cargo.toml`

```toml
[package]
name = "myproject-cli"
version = "0.1.0"
edition = "2021"
rust-version = "1.74"
description = "Command-line interface for myproject"
license = "MIT OR Apache-2.0"
repository = "https://github.com/yourorg/myproject"

[[bin]]
name = "myproject"
path = "src/main.rs"

[dependencies]
myproject-core      = { workspace = true, features = ["serde-support"] }
anyhow              = { workspace = true }
clap                = { workspace = true }
tracing             = { workspace = true }
tracing-subscriber  = { workspace = true }
```

---

### `rust-toolchain.toml`

```toml
[toolchain]
channel = "stable"
components = ["rustfmt", "clippy", "rust-src", "rust-analyzer"]
targets = [
    "x86_64-unknown-linux-gnu",
    "aarch64-unknown-linux-gnu",
    "wasm32-unknown-unknown",
]
```

---

### `rustfmt.toml`

```toml
edition = "2021"
max_width = 100
use_small_heuristics = "Default"
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true
format_macro_bodies = true
```

---

### `clippy.toml`

```toml
msrv = "1.74"
cognitive-complexity-threshold = 25
too-many-arguments-threshold = 7
```

---

### `.cargo/config.toml`

```toml
[alias]
xt   = "run --package xtask --"
lint = "clippy --workspace --all-targets --all-features -- -D warnings"
fmt-check = "fmt --all -- --check"
doc-check = "doc --workspace --no-deps --all-features"

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]

[env]
RUST_BACKTRACE = { value = "1", force = false }
RUST_LOG = { value = "info", force = false }
```

---

### Verification Commands

Run these in order from the repository root after initial setup:

```sh
# 1. Confirm Rust toolchain is active
rustc --version && cargo --version

# 2. Type-check everything (fastest feedback)
cargo check --workspace --all-targets --all-features

# 3. Full debug build
RUSTFLAGS="-D warnings" cargo build --workspace

# 4. Formatting check
cargo fmt --all -- --check

# 5. Linting with warnings-as-errors
cargo clippy --workspace --all-targets --all-features -- -D warnings

# 6. Documentation build
cargo doc --workspace --no-deps --all-features

# 7. All tests across feature combinations
cargo test --workspace
cargo test --workspace --no-default-features
cargo test --workspace --all-features

# 8. Security audit (requires cargo-audit and cargo-deny)
cargo audit
cargo deny check
```

All eight steps must pass before the first feature branch is opened. Encode them as individual CI steps so failure attribution is immediate.

---

### Decision Rationale

| Decision | Choice | Reason |
|----------|--------|--------|
| Resolver | `2` | Eliminates feature unification bugs; required for workspace clarity |
| Workspace structure | Separate `core` and `cli` crates | Core is embeddable without CLI deps; tests isolation is cleaner |
| LTO | `"thin"` | 50% faster link time vs. fat LTO; acceptable 5% perf tradeoff |
| `codegen-units` | `1` | Required for meaningful LTO inlining across module boundaries |
| `panic` | `"unwind"` | Preserves `catch_unwind` compatibility; revisit after dependency audit |
| `strip` | `"debuginfo"` | Reduces binary size; retain unstripped artifact in CI for profiling |
| Feature naming | `serde-support` not `serde` | Avoids implicit feature name from dependency, makes intent explicit |
| `xtask` | Dedicated crate | Replaces Makefile; written in Rust; no external tool dependency |
| Linker | `mold` | 5--10x faster than GNU ld in development; transparent to release builds |
| Clippy lints | Source-level `#![deny]` | Version-controlled; consistent across all developer environments |
