---
name: rust-error-handling
description: |
  Guides expert-level Rust error handling: thiserror vs anyhow decision tree, error propagation with ? operator, custom error types, Result combinators, and error conversion patterns.
  Use when the user asks about Rust error handling, thiserror, anyhow, Result type, ? operator, custom errors, error propagation.
  Do NOT use when the user asks about Rust ownership (use `rust-ownership-patterns`), Rust project setup (use `rust-project-setup`), Rust testing (use `rust-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "rust best-practices debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Rust Error Handling

## When to Use

**Use this skill when:**
- The user asks how to choose between `thiserror` and `anyhow` for a Rust project
- The user is designing a custom error type for a library crate and needs to understand `std::error::Error` trait implementation
- The user has a function returning `Result<T, E>` and wants to propagate or transform errors using `?`, `.map_err()`, `.and_then()`, or combinators
- The user needs to add context to errors (e.g., "failed to parse config at line 42") without losing the original cause
- The user is hitting compiler errors like "the `?` operator can only be used in a function that returns `Result` or `Option`" or "the trait `From<SomeError>` is not implemented"
- The user wants to define an error hierarchy for a multi-module crate with variants for different failure categories
- The user is writing a CLI tool or binary application and wants ergonomic top-level error reporting
- The user needs to convert between error types at FFI, async, or service boundaries
- The user is working with `Box<dyn Error>` and wants to migrate to a more structured approach

**Do NOT use this skill when:**
- The user asks about Rust ownership, lifetimes, or borrow checker issues -- use `rust-ownership-patterns`
- The user is setting up a new Rust project structure, workspace layout, or Cargo.toml dependencies -- use `rust-project-setup`
- The user asks about writing unit tests, integration tests, or property-based tests in Rust -- use `rust-testing-patterns`
- The user asks about async Rust runtime selection or `tokio` vs `async-std` architecture -- use `rust-async-patterns`
- The user is asking about logging frameworks (`tracing`, `log`) in isolation without an error handling question -- use `rust-observability`
- The user asks about panics as a design mechanism for invariant violations -- that is a separate topic from recoverable error handling

---

## Process

### 1. Identify the Crate Type and Error Consumer

The single most important question in Rust error handling is: **who reads this error?**

- **Library crate (`lib.rs` root):** Your users are other Rust programmers. They need to match on specific variants. Use `thiserror` to define strongly-typed, matchable error enums. Never use `anyhow::Error` in a library's public API -- it erases type information that downstream code cannot recover.
- **Binary / application crate (`main.rs`):** Your users are humans at a terminal or log aggregator. Use `anyhow::Error` at the top level for ergonomic `?` chaining and rich context strings. The exact type rarely matters once you reach `main`.
- **Dual-use crate (library with a binary target):** Keep the library's public API using typed errors (`thiserror`). In the `src/bin/` or `main.rs` layer, convert to `anyhow::Error` at the outermost boundary using `?` or `.map_err(|e| anyhow::anyhow!(e))`.
- **Internal modules within a large crate:** You do NOT need a distinct error type per module. Group errors at the public API surface, not at every internal helper. Over-granular error types cause churn.
- **Proc-macro crate:** Use `syn::Error` and `proc_macro2::Span` -- these integrate with the compiler's diagnostic infrastructure and are not replaceable with `thiserror` or `anyhow`.

### 2. Design the Error Enum Structure

Once you know the crate type, design the error enum with these concrete rules:

- **One error enum per public API surface, not per file.** A `DatabaseError` covers all DB operations; you do not need `QueryError`, `ConnectionError`, `TransactionError` as separate top-level types unless they appear in separate public modules.
- **Use `thiserror::Error` derive macro.** It implements `std::error::Error`, `Display`, and optionally `From<SourceError>` for you. Avoid writing these by hand.
- **Each variant maps to a distinct failure category** that callers might handle differently. If two variants would always trigger the same recovery logic, merge them.
- **Embed structured context in variant fields,** not in format strings. Prefer `IoError { path: PathBuf, source: std::io::Error }` over `IoError(String)`. This lets callers inspect the path without parsing strings.
- **Mark the source error with `#[source]`** (or the shorthand `#[from]` when you also want automatic `From` impl). `#[source]` populates the `Error::source()` chain; `#[from]` additionally generates `impl From<SourceError> for YourError`.
- **Do NOT use `#[from]` indiscriminately.** If two variants wrap the same source type (e.g., two variants both wrapping `std::io::Error`), `#[from]` cannot distinguish them -- you must use `.map_err()` explicitly at call sites.
- **Avoid `Box<dyn Error + Send + Sync>` in library enums** unless you genuinely cannot know the source type at compile time (e.g., plugin systems). It loses type information and forces heap allocation.
- **Add `#[non_exhaustive]` to library error enums** when you anticipate adding variants in future minor versions. Without it, adding a variant is a breaking change.

### 3. Apply the `?` Operator and `From` Trait Correctly

The `?` operator desugars to: evaluate the `Result`, on `Err(e)` call `return Err(From::from(e))`. Understanding this prevents 80% of error propagation confusion.

- **`?` works automatically when `impl From<SourceError> for TargetError` exists.** This is what `#[from]` generates. If you get a "the trait bound is not satisfied" error, you are missing a `From` impl or the function's return type is wrong.
- **Use `.map_err(|e| TargetError::Variant { field: ctx, source: e })?`** when you need to attach context that `#[from]` cannot supply (e.g., the file path, the key name, the line number).
- **Never use `.unwrap()` or `.expect()` in library code paths that can receive user input.** Reserve `.expect()` for cases where failure indicates a programming error (invariant violation), not an environmental failure. Document the invariant in the `.expect()` message.
- **Chain `?` through async functions freely** -- `?` works identically in `async fn` returning `Result`. There is no special async syntax needed.
- **In `Option` contexts**, use `.ok_or_else(|| MyError::MissingField { name: "host" })?` to convert `Option<T>` to `Result<T, MyError>` before applying `?`.
- **Avoid deeply nested `match` on `Result`.** More than two levels of nesting signals you should extract a helper function or use combinators.

### 4. Add Error Context Without Losing the Cause

Naked errors without context ("No such file or directory") are useless in production. Add context at every layer crossing.

- **In application code with `anyhow`:** use `.context("loading database config")` or `.with_context(|| format!("reading file {}", path.display()))`. This wraps the error with a message while preserving the original via the `source()` chain.
- **In library code with `thiserror`:** add context as variant fields (`path: PathBuf`, `key: String`, `line: usize`). Context belongs in the type, not in a string attached later.
- **Never double-wrap context.** If a function already returns `MyError::Io { path, source }`, do not also add `.context("io error")` at the call site -- the path is already in the error.
- **Correlation IDs and request IDs** belong in the logging layer (via `tracing` spans), not inside error types. Error types carry structural cause; tracing carries execution context.
- **When wrapping a third-party error**, capture only what you need. If `reqwest::Error` contains the URL, do not duplicate it in your wrapper field -- call `.url()` on the source in your `Display` impl instead.

### 5. Select and Apply Result Combinators Appropriately

Result combinators compose transformations without explicit `match`. Use them for clarity, not for cleverness.

- **`.map(|v| transform(v))`** -- transform the `Ok` value, leave `Err` untouched. Use when the transformation is infallible.
- **`.map_err(|e| convert(e))`** -- transform the `Err` value, leave `Ok` untouched. The most common combinator at type boundaries.
- **`.and_then(|v| fallible_transform(v))`** -- apply a function that itself returns `Result`. Equivalent to `?` inside a closure. Use for chaining dependent fallible operations.
- **`.or_else(|e| fallback(e))`** -- attempt a recovery; if the recovery also fails, return the new error. Use for retry logic or fallback sources.
- **`.unwrap_or_else(|e| default_value(e))`** -- consume the error and produce a default. Only appropriate when an error is genuinely expected and non-fatal.
- **`.flatten()`** -- converts `Result<Result<T, E>, E>` to `Result<T, E>`. Useful after `.map()` that returns another `Result`.
- **Avoid chaining more than 3-4 combinators in a single expression.** Beyond that, extract a named function. The cognitive overhead exceeds the terseness benefit.
- **`Iterator` of Results:** use `.collect::<Result<Vec<_>, _>>()` to fail fast on the first error, or `.filter_map(|r| r.ok())` to skip errors silently (document when you do the latter).

### 6. Handle Errors at Boundaries

Errors must be translated, logged, or surfaced at each architectural layer crossing.

- **HTTP API boundary:** Map error variants to HTTP status codes in a centralized handler, not scattered through route handlers. A `match` on `AppError` variants produces `StatusCode::BAD_REQUEST`, `StatusCode::NOT_FOUND`, `StatusCode::INTERNAL_SERVER_ERROR`. Never expose internal error messages in 5xx responses -- log them with a request ID, return the ID to the client.
- **CLI boundary:** Implement `main() -> Result<(), anyhow::Error>` (or `eyre::Report` for richer formatting). `anyhow` will print the error chain automatically on `Err`. For prettier output, use `miette` with `#[diagnostic]` annotations.
- **FFI boundary:** Rust panics must not cross FFI. Wrap any `Result`-returning Rust function called from C in `std::panic::catch_unwind`. Convert `Err` to a C-compatible integer code or out-parameter error string. Never let `?` propagate across `extern "C"` fn.
- **Thread/task boundary:** `tokio::task::JoinHandle` returns `Result<T, JoinError>`. A `JoinError` can be a panic payload. Check `.is_panic()` and handle panics explicitly. Do not let them silently disappear.
- **Deserialization boundary (serde):** `serde_json::from_str` returns a generic `serde_json::Error`. Wrap it immediately with `.map_err(|e| MyError::DeserializationFailed { field: "config", source: e })` rather than letting the raw serde error bubble up to callers.

### 7. Write Ergonomic Error Display Implementations

`Display` for errors is the message a human reads. Write it with care.

- **Use lowercase for error messages** unless a proper noun requires capitalization. This follows Rust ecosystem convention (matching `std` errors) and allows embedding in sentences: `format!("failed to connect: {}", e)`.
- **Do not end error messages with a period.** They are fragments, not sentences.
- **Do not include "Error" in the message text.** The caller's context supplies that word. Write "connection refused" not "Connection error: connection refused".
- **In `thiserror`**, use `#[error("...")]` attribute with `{field_name}` interpolation. Use `{source}` to embed the source error's display in the message when useful.
- **Make messages specific.** "failed to read file `/etc/app/config.toml`" is useful. "IO error" is not.
- **For `anyhow` context strings**, write them as lowercase verb phrases: `.context("parsing configuration")`, `.context("connecting to database")`.

### 8. Validate and Test Error Paths

Error paths are code paths. Test them like production code.

- **Test that the correct error variant is returned** for each failure condition using `assert!(matches!(result, Err(MyError::Variant { .. })))` or the `assert_matches!` macro (stabilized in Rust 1.82).
- **Test the `Display` output** of your error types to ensure messages are human-readable and do not regress. A simple `assert_eq!(format!("{}", err), "expected message")` catches accidental changes.
- **Test the `source()` chain** when it matters: `assert!(err.source().is_some())` confirms the cause is preserved.
- **Use `should_panic` tests sparingly** -- they test panic messages, not error types, and are fragile.
- **For libraries, test that error types implement `Send + Sync`** using a compile-time assertion: `fn assert_send_sync<T: Send + Sync>() {}` called with your error type in a test. Many async runtimes require `Send` errors.
- **Property-based testing** with `proptest` or `quickcheck` is valuable for parsing/deserialization code -- generate malformed inputs and verify you always get `Err`, never a panic.

---

## Output Format

When responding to a Rust error handling question, structure the response as follows:

```
## Error Handling Strategy for [Context]

### Crate Type Assessment
[Library / Application / Dual-use] -- [one sentence rationale]

### Recommended Dependencies
[thiserror and/or anyhow, with version and Cargo.toml snippet]

### Decision Matrix

| Scenario                          | Library Crate   | Application Crate | Recommendation               |
|-----------------------------------|-----------------|-------------------|------------------------------|
| Public API error types            | thiserror enum  | anyhow::Error     | thiserror for libraries      |
| Internal helper functions         | ? propagation   | ? propagation     | propagate without conversion |
| Top-level main / request handler  | N/A             | anyhow / miette   | anyhow::Result in main       |
| Wrapping third-party errors       | #[from] or map_err | .context()     | depends on type stability    |
| Multiple source error types       | enum variants   | .context() chain  | enum for libraries           |

### Error Type Definition
[Complete, compilable Rust code for the error enum]

### Propagation Pattern
[Complete code showing ? usage, map_err, and context attachment]

### Boundary Handling
[Code showing how errors surface at API, CLI, or FFI boundary]

### Common Pitfalls to Avoid
[Bulleted list of 3-5 specific mistakes relevant to the user's situation]
```

---

## Rules

1. **Never recommend `anyhow::Error` in a library's public API.** It erases type information. Downstream callers cannot match on it. If a library author asks what to use, the answer is always `thiserror` or a hand-rolled `std::error::Error` implementation.

2. **Never use `#[from]` for two variants that wrap the same source type.** The `From` trait cannot have two implementations for the same source type in the same `impl` block. If this situation arises, write explicit `.map_err()` conversions and use `#[source]` (not `#[from]`) on the variant fields.

3. **Never let a Rust panic cross an FFI boundary.** Catching a panic via `catch_unwind` and converting to an error code is mandatory for `extern "C"` functions. Failure to do this causes undefined behavior in the calling process.

4. **Never use `Box<dyn Error>` as a function return type unless the codebase is using it for a plugin/dynamic dispatch system.** In almost all other cases it is a sign of premature generalization or a copy from a pre-`thiserror` tutorial. Replace it with a concrete error enum.

5. **Always implement `Send + Sync` for errors used in async contexts.** `tokio` and other runtimes require errors to be `Send`. `thiserror`-derived types are `Send + Sync` if all their fields are. Verify this. `Box<dyn Error>` is NOT `Send + Sync` by default -- use `Box<dyn Error + Send + Sync>` if you must use it.

6. **Never add `.context()` or `.map_err()` at every single call site in application code.** Context should be added at meaningful layer crossings (loading config, connecting to DB, processing a request) -- not on every individual `?`. Over-annotated error chains become noise.

7. **Never derive `Copy` for error types.** Errors often contain `String`, `PathBuf`, or heap-allocated fields. Error types should be `Clone` when needed but are rarely `Copy`. Attempting this will cause compiler errors.

8. **Always add `#[non_exhaustive]` to library error enums before publishing.** Adding a new variant to an exhaustive enum in a library is a semver-breaking change. `#[non_exhaustive]` allows adding variants in minor versions, requiring downstream code to have a `_` match arm.

9. **Never format an error type's `source()` in the parent's `Display` implementation when using `thiserror`.** The `thiserror` `#[error]` attribute's `{source}` interpolation will include the source error's display. If you also manually call `source()` somewhere in the chain, you get duplicate messages. Use either `#[error("... {source}")]` OR let callers traverse the chain -- not both.

10. **Never silently discard errors with `let _ = fallible_call()`** unless you have explicitly documented why the error is intentionally ignored. Use `if let Err(e) = fallible_call() { tracing::warn!("...") }` as a minimum. Silently dropped errors are the hardest bugs to diagnose in production.

---

## Edge Cases

### The `#[from]` Collision Problem
When two variants in the same enum both need to wrap `std::io::Error`, `#[from]` cannot be used because Rust does not allow two `impl From<io::Error> for MyError` blocks. The solution: use `#[source]` on both variants (which preserves the error chain) and write explicit `.map_err()` at each call site to specify which variant to produce.

```rust
#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("failed to read config file `{path}`")]
    ReadFailed { path: PathBuf, #[source] source: std::io::Error },
    #[error("failed to write config file `{path}`")]
    WriteFailed { path: PathBuf, #[source] source: std::io::Error },
}
// At call site:
fs::read_to_string(&path).map_err(|e| ConfigError::ReadFailed { path: path.clone(), source: e })?;
```

### Async Tasks and `JoinError`
`tokio::task::spawn` returns `JoinHandle<Result<T, E>>`. Awaiting it gives `Result<Result<T, E>, JoinError>`. Callers must handle both layers. Panics inside tasks become `JoinError` with `is_panic() == true`. The standard pattern is:

```rust
let result = task_handle.await
    .map_err(|e| if e.is_panic() {
        AppError::TaskPanicked
    } else {
        AppError::TaskCancelled
    })??;  // The second ? unwraps the inner Result<T, E>
```
Never flatten this with `.unwrap()` -- a panicking task will propagate the panic to the caller's thread.

### Error Types in Trait Objects (`dyn Trait`)
When defining a trait that returns errors, the error type must be part of the trait signature or use `Box<dyn Error + Send + Sync>`. Using an associated type (`type Error: std::error::Error`) is the ergonomic approach for libraries. Using `Box<dyn Error + Send + Sync>` trades type safety for object safety. If a trait needs to be object-safe AND return meaningful errors, the associated type approach breaks object safety -- use `Box<dyn Error + Send + Sync>` and document the trade-off explicitly.

### Error Conversion in Large Dependency Trees
When a crate depends on many sub-crates, each with their own error types, the top-level error enum can explode in variant count. Signs of this problem: your `AppError` enum has 40+ variants, each wrapping a single foreign error type. The solution is **error aggregation layers**: create `DatabaseError`, `NetworkError`, `StorageError` mid-level enums that each consolidate a domain's errors, then have `AppError` wrap these mid-level enums. This limits `AppError` to 6-10 variants representing business domains, not implementation details.

### The `anyhow` / `thiserror` Mix in a Workspace
In a Cargo workspace with multiple crates, the pattern is: all `lib` crates use `thiserror`; the application binary crate uses `anyhow`. The binary's `main.rs` imports library errors as `use my_lib::LibError` and they convert to `anyhow::Error` transparently via `?` because `anyhow` implements `From<E: std::error::Error>`. This is seamless -- you do not need to write any conversion glue. The only mistake is accidentally publishing an internal `anyhow` dependency in a library's public API.

### `serde` Deserialization Errors with Custom Context
`serde_json::Error` exposes line/column information via `.line()` and `.column()` methods. When wrapping serde errors in your own type, preserve this structured data as fields rather than stringifying it:

```rust
#[derive(Debug, thiserror::Error)]
#[error("invalid JSON in {file} at line {line}, column {column}")]
pub struct ParseError {
    pub file: PathBuf,
    pub line: usize,
    pub column: usize,
    #[source]
    pub source: serde_json::Error,
}
```
This allows callers to programmatically access position data, which is essential for editors and language servers.

### `miette` for User-Facing CLI Errors
When the end user is a developer (e.g., a CLI tool, build system, or compiler plugin), `miette` provides diagnostics with source code snippets, labels, and help text -- similar to Rust compiler errors. Use `miette::Diagnostic` derive alongside `thiserror::Error`. This is most valuable when your tool processes source files or configuration formats where pointing to the exact problematic line/column is critical. `miette` is NOT needed for server applications where errors go to log aggregators.

### Recoverable vs. Fatal Error Distinction
Some errors indicate unrecoverable state corruption (e.g., a corrupted database page, an impossible enum variant from deserialization). These should NOT be modeled as error variants to be matched and recovered. Use `panic!` with a clear message, or define a separate `Fatal` type that your top-level handler converts to process exit with a diagnostic. Mixing recoverable and fatal errors in the same enum forces callers to handle cases that can never succeed.

---

## Example

**Input:** "I'm building a Rust library crate that parses TOML configuration files and loads them from disk. It needs to work in an async context with tokio. What error handling approach should I use?"

**Output:**

## Error Handling Strategy for a TOML Configuration Library

### Crate Type Assessment
**Library crate** -- error types must be strongly typed and matchable by downstream application code. `anyhow` is excluded from the public API.

### Recommended Dependencies

```toml
# Cargo.toml
[dependencies]
thiserror = "1"
tokio = { version = "1", features = ["fs"] }
toml = "0.8"
serde = { version = "1", features = ["derive"] }
```

### Decision Matrix

| Scenario                              | Approach                        | Rationale                                                  |
|---------------------------------------|---------------------------------|------------------------------------------------------------|
| Public `ConfigError` type             | `thiserror` enum                | Callers must match `NotFound` vs `ParseError` vs `IoError` |
| Wrapping `std::io::Error`             | `#[source]` + `PathBuf` field   | Two IO variants prevent `#[from]` use                      |
| Wrapping `toml::de::Error`            | `#[from]` if single variant     | Only one TOML parse error variant -- `#[from]` is safe     |
| Async tokio FS operations             | Same `?` propagation            | No special async error handling needed                     |
| Application using this library        | `.context()` with `anyhow`      | App layer adds runtime context, library type is preserved  |

### Error Type Definition

```rust
use std::path::PathBuf;
use thiserror::Error;

/// All errors that can occur when loading or parsing a configuration file.
/// This enum is `#[non_exhaustive]` to allow adding variants in future minor versions
/// without breaking downstream `match` expressions.
#[derive(Debug, Error)]
#[non_exhaustive]
pub enum ConfigError {
    /// The configuration file was not found at the specified path.
    /// Callers may want to fall back to a default config in this case.
    #[error("config file not found at `{path}`")]
    NotFound { path: PathBuf },

    /// The file exists but could not be read (e.g., permission denied).
    /// Distinct from `NotFound` because the recovery strategy differs.
    #[error("failed to read config file `{path}`")]
    ReadFailed {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    /// The file was read successfully but contains invalid TOML syntax.
    #[error("failed to parse config file `{path}`")]
    ParseFailed {
        path: PathBuf,
        #[source]
        source: toml::de::Error,
    },

    /// The TOML was valid but did not match the expected schema (missing fields,
    /// wrong types, failed validation rules).
    #[error("config file `{path}` has invalid structure: {message}")]
    InvalidStructure { path: PathBuf, message: String },
}

// Verify Send + Sync at compile time -- required for use in tokio tasks.
const _: fn() = || {
    fn assert_send_sync<T: Send + Sync>() {}
    assert_send_sync::<ConfigError>();
};
```

### Propagation Pattern

```rust
use serde::Deserialize;
use std::path::{Path, PathBuf};
use tokio::fs;

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub database_url: String,
    pub port: u16,
    pub max_connections: Option<u32>,
}

pub async fn load_config(path: &Path) -> Result<AppConfig, ConfigError> {
    // Use map_err to attach path context -- #[from] cannot be used here because
    // we have two variants wrapping io::Error (NotFound and ReadFailed).
    let contents = match fs::read_to_string(path).await {
        Ok(c) => c,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            return Err(ConfigError::NotFound { path: path.to_owned() });
        }
        Err(e) => {
            return Err(ConfigError::ReadFailed {
                path: path.to_owned(),
                source: e,
            });
        }
    };

    // toml::from_str returns toml::de::Error -- use map_err to attach path.
    let config: AppConfig = toml::from_str(&contents).map_err(|e| ConfigError::ParseFailed {
        path: path.to_owned(),
        source: e,
    })?;

    // Business logic validation after successful parse.
    if config.port == 0 {
        return Err(ConfigError::InvalidStructure {
            path: path.to_owned(),
            message: "port must be non-zero".to_string(),
        });
    }

    Ok(config)
}
```

### Boundary Handling in Application Code

The application binary uses `anyhow` for ergonomics. The library's typed errors convert automatically:

```rust
// In the application's main.rs (binary crate, not the library)
use anyhow::{Context, Result};
use std::path::PathBuf;
use my_config_lib::{load_config, ConfigError};

#[tokio::main]
async fn main() -> Result<()> {
    let config_path = PathBuf::from("/etc/myapp/config.toml");

    // Option 1: Let the error chain speak for itself via anyhow
    let config = load_config(&config_path).await
        .context("startup failed: could not load application config")?;

    // Option 2: Handle specific variants for recovery
    let config = match load_config(&config_path).await {
        Ok(c) => c,
        Err(ConfigError::NotFound { .. }) => {
            eprintln!("No config file found, using defaults");
            AppConfig::default()
        }
        Err(e) => return Err(anyhow::anyhow!(e).context("failed to load config")),
    };

    println!("Server starting on port {}", config.port);
    Ok(())
}
```

### Testing Error Paths

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;
    use tokio::fs;

    #[tokio::test]
    async fn test_missing_file_returns_not_found() {
        let result = load_config(Path::new("/nonexistent/path/config.toml")).await;
        assert!(
            matches!(result, Err(ConfigError::NotFound { .. })),
            "expected NotFound, got: {:?}",
            result
        );
    }

    #[tokio::test]
    async fn test_invalid_toml_returns_parse_failed() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config.toml");
        fs::write(&path, b"not valid toml ][[[").await.unwrap();

        let result = load_config(&path).await;
        assert!(matches!(result, Err(ConfigError::ParseFailed { .. })));
    }

    #[tokio::test]
    async fn test_zero_port_returns_invalid_structure() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config.toml");
        fs::write(&path, b"database_url = 'postgres://localhost'\nport = 0").await.unwrap();

        let result = load_config(&path).await;
        assert!(matches!(result, Err(ConfigError::InvalidStructure { .. })));
    }

    #[test]
    fn test_error_display_messages() {
        let err = ConfigError::NotFound {
            path: PathBuf::from("/etc/app/config.toml"),
        };
        assert_eq!(
            format!("{}", err),
            "config file not found at `/etc/app/config.toml`"
        );
    }
}
```

### Common Pitfalls to Avoid

- **Do not add `anyhow` as a dependency of this library.** It belongs in the binary. Adding it to a library's `[dependencies]` is a code smell that will propagate `anyhow::Error` into your public API.
- **Do not use `#[from] source: std::io::Error`** when you have two variants both wrapping `io::Error` (`NotFound` and `ReadFailed`). The compiler will reject duplicate `From` impls. Use explicit `map_err` at call sites as shown above.
- **Do not forget `#[non_exhaustive]`** before the first `0.1.0` publish. Adding it after first release is a breaking change in the opposite direction -- it would break existing exhaustive matches in downstream code.
- **Do not embed `source.to_string()` in variant fields.** Keep the source error as a typed `#[source]` field. String conversion throws away the entire error chain below it and makes the source untraversable via `Error::source()`.
- **Do not panic on `toml::from_str` errors** even during development. The habit of using `unwrap()` in library parsing code is how panics slip into production libraries used by others.
