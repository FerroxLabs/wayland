---
name: rust-ffi-patterns
description: |
  Guides advanced Rust FFI design: C interop with extern, unsafe patterns, bindgen for header generation, cross-language memory management, and safe wrapper design.
  Use when the user asks about Rust FFI, extern C, unsafe, bindgen, cbindgen, cross-language memory, safe wrappers.
  Do NOT use when the user asks about Rust ownership (use `rust-ownership-patterns`), Rust performance (use `rust-performance`), Rust project setup (use `rust-project-setup`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "rust best-practices advanced"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Rust FFI Patterns

## When to Use

**Use this skill when:**
- The user needs to call C or C++ functions from Rust, or expose Rust functions to C/C++ callers, and needs guidance on `extern "C"` declarations, ABI stability, and data layout
- The user is integrating Rust into an existing C/C++ codebase (partial rewrite, plugin system, embedded library) and needs to design the boundary layer
- The user asks about using `bindgen` to generate Rust bindings from C headers, or `cbindgen` to generate C headers from Rust code
- The user needs to manage memory across the language boundary -- allocating in one language and freeing in another, passing ownership of heap data, or sharing references safely
- The user is designing a safe Rust wrapper (a `pub` API that hides `unsafe` internals) over a raw FFI binding layer
- The user asks about opaque pointer patterns, handle-based APIs, or type-safe wrappers for C handles
- The user is debugging undefined behavior, alignment faults, or segfaults in Rust code that interoperates with C

**Do NOT use this skill when:**
- The user asks about Rust ownership semantics in pure Rust code -- use `rust-ownership-patterns` instead
- The user asks about optimizing Rust performance unrelated to FFI boundaries -- use `rust-performance` instead
- The user is setting up a new Rust project from scratch without FFI requirements -- use `rust-project-setup` instead
- The user is asking about Rust async/await design patterns with no cross-language component -- that is a runtime design question, not an FFI question
- The user is asking about calling Rust from Python via PyO3 or Node.js via napi-rs -- those crates provide their own high-level interop layers that supersede raw FFI patterns
- The user asks about WebAssembly bindings via `wasm-bindgen` -- that tool has its own distinct ABI and lifecycle separate from C FFI

---

## Process

### 1. Characterize the FFI Boundary

Before writing any code, map the exact shape of the boundary. Every mistake in FFI design compounds because unsafe code is harder to change later.

- Determine the direction of calls: Rust-calls-C (importing), C-calls-Rust (exporting), or bidirectional
- Identify ownership semantics for every heap-allocated value that crosses the boundary: who allocates, who frees, and whether any shared ownership is required
- Enumerate all types crossing the boundary. Categorize each as: primitive (safe), C-compatible struct (`#[repr(C)]`), opaque handle, function pointer, or string/slice
- Document the threading model: is the C library thread-safe? Does it call back on arbitrary threads? Does it maintain thread-local state? This determines whether your wrapper needs `Send` and/or `Sync` bounds
- Check whether the C library uses errno, a return-code convention, or an out-parameter error style -- each requires a different Rust mapping strategy

### 2. Set Up Tooling and Cargo Configuration

Configure the project correctly before generating or writing any bindings. Wrong configuration creates subtle issues that are hard to diagnose later.

- Add `bindgen` as a build-time dependency in `build-dependencies` if generating from C headers: `bindgen = "0.69"`
- Add `cbindgen` as a build-time dependency if exposing Rust to C: `cbindgen = "0.26"`
- In `build.rs`, configure `bindgen::Builder` with `.parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))` so Cargo reruns the build when headers change
- Enable `#[allow(non_camel_case_types, non_snake_case, dead_code)]` on the generated bindings module -- these are expected in C-style names and should not pollute lints on your safe wrapper
- Use a `bindings/` or `sys/` crate pattern: create a `mylib-sys` crate that contains only the raw generated bindings and the `build.rs`. Your safe wrapper lives in `mylib`. This separation enforces that unsafe code is contained
- In the `sys` crate's `Cargo.toml`, set `links = "mylib"` to declare the native library link. This prevents duplicate linking when multiple crates depend on the same native library
- For `cbindgen`, create a `cbindgen.toml` at the crate root specifying `language = "C"` and `include_guard = "MY_LIB_H"` to produce clean, idiomatic C headers

### 3. Design the Type Boundary

Each type at the FFI boundary needs an explicit layout contract. This is where most correctness bugs originate.

- Apply `#[repr(C)]` to every struct that must match a C layout exactly. Never rely on the default Rust repr for FFI structs -- Rust may reorder fields for optimization
- For types that Rust should treat as opaque (forward-declared C structs), use the standard opaque type idiom: `#[repr(C)] pub struct Foo { _data: [u8; 0], _marker: PhantomData<(*mut u8, PhantomPinned)> }`. The `PhantomPinned` prevents auto-deriving `Unpin`, and the raw-pointer marker prevents `Send`/`Sync` from being auto-derived, which is safe-conservative
- For booleans: never use Rust `bool` at FFI boundaries. C `_Bool` has a 1-byte representation but C `int`-based booleans are 4 bytes. Use `c_int` (0/non-zero) unless the C header explicitly uses `_Bool` or `stdbool.h`
- For strings: `*const c_char` for null-terminated C strings. Use `CStr::from_ptr` on the Rust side to wrap safely. Use `CString` when you need to create a null-terminated string to pass to C. Never pass a Rust `&str` or `String` directly
- For slices: decompose into `*const T` / `*mut T` pointer plus `usize` length. Never pass a `&[T]` directly. Reconstruct with `std::slice::from_raw_parts` inside unsafe blocks with explicit lifetime annotation
- For enums: use `#[repr(C)]` or `#[repr(u32)]` (matching the C `enum` underlying type). Discriminant values must match the C header exactly. Bindgen generates these correctly; hand-written ones must be verified
- For function pointers: use `Option<unsafe extern "C" fn(...)>` rather than bare `extern "C" fn`. The `Option` wrapping makes the null check explicit and aligns with how nullable function pointers work in C

### 4. Write the Raw Binding Layer (`*-sys`)

The `sys` crate should be mechanical and minimal -- a direct transcription of the C API with no safety added yet.

- Use `extern "C"` blocks to declare imported functions. Each declaration must exactly match the C function signature in parameter types, return type, and calling convention
- For variadic C functions, use `extern "C" { fn printf(fmt: *const c_char, ...) -> c_int; }` with the `...` syntax available in stable Rust since 1.44
- Annotate functions that must not be called from multiple threads simultaneously at the raw binding level with a `// SAFETY: not thread-safe` comment -- safety is documented here, enforced by the wrapper layer
- Use `std::os::raw::{c_int, c_uint, c_long, c_char, c_void}` for C primitive types rather than `i32`, `u32` etc., because `c_long` is 32 bits on 32-bit systems and on 64-bit Windows, and 64 bits on 64-bit Linux/macOS. This distinction matters for cross-platform correctness
- Test that `std::mem::size_of::<YourStruct>()` and `std::mem::offset_of!(YourStruct, field)` match the C header values using a static assertion or `#[test]`. For complex structs, use the `memoffset` crate for `offset_of!` prior to Rust 1.77 stabilization
- Check alignment with `std::mem::align_of::<YourStruct>()`. Misaligned access on ARM causes hardware faults; on x86 it causes silent performance degradation or UB in SIMD contexts

### 5. Build the Safe Wrapper Layer

The wrapper layer is where you restore Rust's safety guarantees. The goal is: zero `unsafe` in code that calls the wrapper.

- Wrap handles (opaque C pointers) in a newtype struct: `pub struct Connection(*mut ffi::mysql_connection)`. The inner pointer is private. Implement `Drop` to call the C destructor automatically
- Implement `Send` and/or `Sync` only after verifying the C library's thread-safety contract. Use explicit `unsafe impl Send for Connection {}` with a `// SAFETY:` comment citing the C documentation
- Convert return codes to `Result<T, LibError>` using a custom error type that implements `std::error::Error`. Never return raw `c_int` error codes from the safe layer
- Use lifetime annotations to encode C API constraints. If a C function returns a pointer valid only for the lifetime of a parent object, the Rust wrapper should return `&'a T` where `'a` is the lifetime of the parent wrapper: `pub fn get_record<'a>(&'a self) -> Record<'a>`
- For callbacks: if the C library accepts a function pointer plus a `*mut c_void` userdata pointer, you can pass a fat pointer to a Rust closure by storing the closure on the heap (`Box::into_raw(Box::new(closure))`) and casting to `*mut c_void`. Provide a trampoline `unsafe extern "C" fn` that reconstructs the closure reference and calls it. Always provide a cleanup mechanism so the boxed closure is freed when the callback is deregistered
- Validate all pointer arguments before passing to C. Rust references are never null, but `*const T` from C can be -- validate early and return `Err` rather than letting null propagate into C

### 6. Manage Memory Across the Boundary

Cross-language memory management is the single most common source of use-after-free and double-free bugs in FFI code.

- Establish one rule per allocation: memory allocated by Rust's allocator must be freed by Rust's allocator; memory allocated by C's `malloc` must be freed by C's `free`. Never mix allocators across the boundary
- When Rust passes ownership of heap data to C, use `Box::into_raw()` to produce a raw pointer and document that C must eventually call back into Rust to free it. Provide a `#[no_mangle] pub unsafe extern "C" fn mylib_free_thing(ptr: *mut Thing)` that reconstructs and drops the Box: `drop(unsafe { Box::from_raw(ptr) })`
- When C passes ownership of heap data to Rust (e.g., a C library returns a malloc'd string), wrap it in a custom RAII type rather than converting to `String`. The custom type's `Drop` implementation calls the C free function: `libc::free(self.ptr as *mut c_void)`
- For shared ownership across the boundary, `Arc` is the right model in Rust. Pass `Arc::into_raw()` to C and `Arc::from_raw()` back on the Rust side. Increment the reference count with `Arc::clone` before passing additional references to C
- Avoid double-free by structuring the API so that the allocating side always owns the free. A handle-based API (C gets an opaque integer ID, Rust maintains the map) eliminates raw pointer sharing entirely and is worth the small overhead in high-correctness contexts

### 7. Test, Validate, and Use Sanitizers

FFI bugs are memory safety bugs. Standard Rust tests are insufficient -- run sanitizers.

- Run `RUSTFLAGS="-Z sanitizer=address" cargo test --target x86_64-unknown-linux-gnu` with AddressSanitizer enabled (requires nightly for the sanitizer flag, or use a recent stable with `-Zsanitizer`). ASan catches heap use-after-free, heap buffer overflow, and double-free -- the three most common FFI bugs
- Run with Valgrind (`valgrind --tool=memcheck`) on the integration test binary for leak detection when the C library itself has complex lifecycle management
- Use Miri (`cargo miri test`) for pure-Rust UB detection. Miri cannot run actual FFI calls but can validate the pure-Rust binding infrastructure and test stub implementations
- Write integration tests that exercise the full round-trip: allocate in C, use in Rust, free in C, and verify no leak. Do the reverse: allocate in Rust, pass to C, Rust frees
- Add `#[test] fn layout_test()` functions that assert `size_of`, `align_of`, and `offset_of` for every `#[repr(C)]` struct. These tests catch header drift immediately

### 8. Document Safety Contracts

Every `unsafe` block must have a `// SAFETY:` comment. This is not optional. It is the primary mechanism for making unsafe code auditable.

- Each `unsafe impl Send` or `unsafe impl Sync` needs a comment citing the C library documentation that guarantees thread safety
- Each `unsafe fn` in the `sys` crate needs a `/// # Safety` doc section listing preconditions: which pointers must be non-null, which lifetimes must be valid, what thread state is required
- Each `unsafe { }` block at the call site needs a `// SAFETY:` comment explaining why the invariants are satisfied at that particular point in the code
- Use `#[deny(clippy::undocumented_unsafe_blocks)]` in the wrapper crate to enforce this in CI
- Create a `SAFETY.md` or `FFI_CONTRACT.md` document for complex integrations listing every assumption about the C library's behavior. This is the first place to look when bugs occur

---

## Output Format

When responding to an FFI question, structure the response as follows:

```
## FFI Boundary Analysis

| Aspect             | Detail                                                  |
|--------------------|---------------------------------------------------------|
| Call Direction     | Rust → C / C → Rust / Bidirectional                    |
| Ownership Model    | (who allocates, who frees, per type)                   |
| Thread Safety      | (Safe / Unsafe / Per-function, cite C docs)            |
| Error Convention   | (errno / return code / out-param / exception-unsafe)   |
| Types at Boundary  | (list each type with its Rust representation)          |

## sys Crate: Raw Bindings

// Cargo.toml for the sys crate
[package]
name = "mylib-sys"
links = "mylib"

[build-dependencies]
bindgen = "0.69"

// build.rs
fn main() {
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .allowlist_function("mylib_.*")
        .generate()
        .expect("Unable to generate bindings");
    bindings
        .write_to_file(std::path::PathBuf::from(
            std::env::var("OUT_DIR").unwrap()
        ).join("bindings.rs"))
        .expect("Could not write bindings");
    println!("cargo:rustc-link-lib=mylib");
}

// src/lib.rs
#![allow(non_camel_case_types, non_snake_case, dead_code)]
include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

## Safe Wrapper Crate

// RAII wrapper with Drop
pub struct MyHandle {
    inner: *mut ffi::mylib_handle_t,
}

// SAFETY: mylib handles are safe to send across threads per mylib docs §3.2
unsafe impl Send for MyHandle {}

impl MyHandle {
    pub fn new() -> Result<Self, MyError> {
        let ptr = unsafe { ffi::mylib_create() };
        if ptr.is_null() {
            Err(MyError::AllocationFailed)
        } else {
            Ok(MyHandle { inner: ptr })
        }
    }

    pub fn process(&self, data: &[u8]) -> Result<usize, MyError> {
        let result = unsafe {
            // SAFETY: self.inner is non-null (invariant maintained by new()),
            // data.as_ptr() is valid for data.len() bytes for the duration of this call.
            ffi::mylib_process(
                self.inner,
                data.as_ptr() as *const ffi::c_uchar,
                data.len(),
            )
        };
        if result < 0 {
            Err(MyError::from_code(result))
        } else {
            Ok(result as usize)
        }
    }
}

impl Drop for MyHandle {
    fn drop(&mut self) {
        unsafe {
            // SAFETY: self.inner is non-null and was created by mylib_create().
            // We have exclusive ownership (no clone possible), so this is the only free.
            ffi::mylib_destroy(self.inner);
        }
    }
}

## Memory Ownership Table

| Object           | Allocated By | Freed By     | Rust Mechanism        |
|------------------|--------------|--------------|-----------------------|
| MyHandle         | mylib_create | mylib_destroy| Drop impl             |
| Output buffer    | C library    | mylib_free_buf| Custom RAII wrapper  |
| Callback closure | Rust (Box)   | Rust (Drop)  | Box::from_raw on done |

## Layout Verification Tests

#[cfg(test)]
mod layout_tests {
    use super::*;
    #[test]
    fn verify_my_struct_layout() {
        assert_eq!(std::mem::size_of::<ffi::my_struct_t>(), 24);
        assert_eq!(std::mem::align_of::<ffi::my_struct_t>(), 8);
        assert_eq!(memoffset::offset_of!(ffi::my_struct_t, field_a), 0);
        assert_eq!(memoffset::offset_of!(ffi::my_struct_t, field_b), 8);
    }
}
```

---

## Rules

1. **Never use `#[repr(Rust)]` structs at the FFI boundary.** The default Rust repr allows field reordering and has no stability guarantee. Every struct that crosses the boundary must have `#[repr(C)]`, `#[repr(transparent)]`, or an explicitly sized repr like `#[repr(u32)]`.

2. **Never implement `Copy` or `Clone` on RAII wrappers around C handles.** If a C handle is copyable and the wrapper implements `Clone`, you will double-free. Handles are move-only. Shared access requires `Arc<Mutex<MyHandle>>` or a reference-counted C API.

3. **Always use `c_int`, `c_long`, `c_char` etc. from `std::os::raw` instead of Rust integer primitives.** The size of `c_long` is platform-dependent. On 64-bit Linux it is 64 bits; on 64-bit Windows it is 32 bits. Using `i64` instead will produce silent truncation on Windows.

4. **Never pass a Rust `String` or `&str` to a C function expecting `*const c_char`.** Rust strings are not null-terminated. Always use `CString::new(s).unwrap().as_ptr()` -- but be careful: `CString` must stay alive for the duration of the C call. Assign it to a variable, do not inline it in the argument list, or it will be dropped before the call executes.

5. **Always check for null before dereferencing any pointer received from C.** C functions may return null on allocation failure or to indicate absence. Rust references are guaranteed non-null, so wrapping in `Option<NonNull<T>>` is the idiomatic way to represent a nullable C pointer on the Rust side.

6. **Never call `Box::from_raw` on a pointer that was not created by `Box::into_raw` with the same type.** Mixing `malloc`-allocated C pointers with `Box::from_raw` uses the wrong allocator and produces undefined behavior. Provide explicit C-callable free functions for all Rust-allocated objects.

7. **Always add a `#[no_mangle]` attribute and `extern "C"` ABI to every function exported to C.** Without `#[no_mangle]`, Rust applies name mangling that makes the symbol inaccessible to C linkers. Without `extern "C"`, the calling convention is Rust's unstable internal ABI.

8. **Never return Rust `panic!` across an FFI boundary.** Unwinding across an FFI boundary is undefined behavior. Any `extern "C"` function that might panic must use `std::panic::catch_unwind` to intercept the panic and convert it to an error code before returning to C. Enable `panic = "abort"` in `Cargo.toml` for library crates exposed to C to eliminate the entire class of problem.

9. **Never assume `bool` is ABI-compatible across C and Rust.** A Rust `bool` is guaranteed to be `0` or `1` as a single byte. A C `int`-typed boolean (common in older C code) is 4 bytes. Always use explicit integer types (`c_int`) and convert to `bool` inside the safe wrapper.

10. **Always run the full test suite with AddressSanitizer in CI before merging FFI changes.** Rust's borrow checker does not protect against errors in `unsafe` code. ASan is the minimum viable safety net for FFI. Integrate it as a required CI step, not an optional one, on any platform that supports it (Linux/macOS with nightly or recent stable).

---

## Edge Cases

### C Library Uses a Thread-Local Error State (like errno)

Many C libraries store error information in thread-local variables (errno, or a custom `mylib_errno()`). If you call the C function and then do any Rust operations before reading the error state, intervening Rust code (including allocator calls in `format!`) may reset the error variable. Solution: read the error state as the very first thing after the C call, before any Rust operations, and store it in a local variable. For errno specifically, use `std::io::Error::last_os_error()` immediately after the failing syscall.

### C Library Calls Back Into Rust on a Different Thread

When a C library invokes a Rust callback on a thread that was not created by Rust, the Rust thread-local storage is uninitialized and stack unwinding is unsafe. Ensure: (1) the callback function is `extern "C"` and catches panics with `catch_unwind`, (2) the closure stored in the userdata pointer is `Send` (enforce this with a `where F: Send` bound when storing the closure), and (3) no Rust destructor in the callback path touches thread-local state. If the C library calls back from a signal handler, the restrictions are even tighter -- only async-signal-safe operations are permitted, which excludes all Rust allocations.

### Exposing a Rust Trait Object Across FFI (Virtual Dispatch to C)

C does not have trait objects, but you can simulate them with a vtable struct. Define a `#[repr(C)] struct MyVtable { process: Option<unsafe extern "C" fn(*mut c_void, ...) -> c_int>, destroy: Option<unsafe extern "C" fn(*mut c_void)> }`. Then define `#[repr(C)] struct MyObject { vtable: *const MyVtable, data: *mut c_void }`. To expose a Rust trait implementation, create a `static MY_VTABLE: MyVtable` with trampoline function pointers, box the Rust struct, and pass `Box::into_raw` as the data pointer. This pattern is used in plugin architectures where C must call into Rust implementations of an interface.

### C Header Uses Bitfields

Bindgen generates Rust code for bitfields using accessor methods rather than actual Rust bitfields (which don't exist with stable ABI guarantees). The generated code is safe to use but carries no guarantee that the in-memory bit layout matches when the bitfield struct is passed by value across a separately compiled C boundary. If you must pass bitfield structs by value, test the layout exhaustively with a C test program that prints `offsetof` and field values for known bit patterns, and compare with Rust.

### Mixed Allocator Scenario (C++ `new`/`delete` vs Rust's Allocator)

When the C++ side uses `new` and `delete` (which may use a custom allocator in embedded contexts), you cannot use Rust's `Box::from_raw` to free those objects. The pattern is: provide `extern "C"` wrapper functions on the C++ side (`extern "C" void destroy_thing(Thing* t) { delete t; }`) and call those from Rust's Drop implementation. Never assume that `libc::free` is compatible with `new`-allocated memory.

### The C Library Is Not `async`-aware and Blocks the Executor

When integrating a blocking C library with an async Rust runtime (tokio, async-std), calling the C function directly from an async task will block the executor thread and stall all other tasks. Wrap every blocking C call with `tokio::task::spawn_blocking(|| { unsafe { ffi::blocking_operation(...) } })`. This moves the blocking call to a dedicated thread pool. The FFI wrapper type must implement `Send` (verified above) because `spawn_blocking` requires `Send`. If the C library uses thread-local state that ties operations to a specific thread, use a dedicated `std::thread::spawn`-ed thread with a channel for request/response instead.

### C API Uses Setjmp/Longjmp for Error Handling

`longjmp` across Rust stack frames is undefined behavior because it bypasses Rust's destructors, leaving RAII objects un-dropped and potentially causing memory leaks or double-frees. When you must call a C library that uses `setjmp`/`longjmp` internally (common in image/compression libraries like libjpeg, libpng), ensure the `setjmp` call point is in C code that is the direct caller of the problematic function -- never let `longjmp` unwind through a Rust stack frame. Use the C library's callback-based error handler pattern instead of the default `longjmp` one where available.

### Version Skew Between the C Header and the Linked Library

The `sys` crate generates bindings from a specific header at build time. If the installed system library is a different version, struct layouts may have changed silently. Mitigate this by: (1) using `pkg-config` to verify the library version at build time and emit a `cargo:warning` or `panic!("...")` in `build.rs` if the version is unsupported, (2) embedding the expected version in the `links` metadata, and (3) running layout verification tests on the target system in CI, not just the build system.

---

## Example

**Input:** "I'm wrapping the libsodium C library in Rust. I need to expose a `SecretBox` type that calls `crypto_secretbox_easy` and `crypto_secretbox_open_easy`. The keys and nonces are fixed-size byte arrays. The library is thread-safe. How do I structure this correctly?"

**Output:**

### FFI Boundary Analysis

| Aspect             | Detail                                                                         |
|--------------------|--------------------------------------------------------------------------------|
| Call Direction     | Rust → C                                                                       |
| Ownership Model    | All buffers caller-allocated; libsodium reads/writes in-place, no heap alloc  |
| Thread Safety      | Safe -- libsodium is fully thread-safe after `sodium_init()`                  |
| Error Convention   | Return code: 0 on success, -1 on failure (authentication failure)              |
| Types at Boundary  | `*const u8`/`*mut u8` for byte buffers, `c_ulonglong` for lengths             |

---

### Step 1: The `libsodium-sys` Crate

**Cargo.toml:**
```toml
[package]
name = "libsodium-sys"
version = "0.1.0"
links = "sodium"

[build-dependencies]
bindgen = "0.69"

[dependencies]
libc = "0.2"
```

**build.rs:**
```rust
fn main() {
    // Tell Cargo to re-run if the header changes.
    println!("cargo:rerun-if-changed=wrapper.h");

    // Verify libsodium version using pkg-config.
    let lib = pkg_config::Config::new()
        .atleast_version("1.0.18")
        .probe("libsodium")
        .expect("libsodium >= 1.0.18 not found. Install libsodium-dev.");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        // Only generate bindings for the functions we need.
        .allowlist_function("sodium_init")
        .allowlist_function("crypto_secretbox_.*")
        .allowlist_var("crypto_secretbox_.*")
        .generate()
        .expect("Unable to generate libsodium bindings");

    bindings
        .write_to_file(
            std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap())
                .join("bindings.rs"),
        )
        .expect("Could not write bindings");
}
```

**wrapper.h:**
```c
#include <sodium.h>
```

**src/lib.rs (sys crate):**
```rust
#![allow(non_camel_case_types, non_snake_case, dead_code, non_upper_case_globals)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
```

---

### Step 2: The Safe Wrapper Crate

**Cargo.toml:**
```toml
[package]
name = "libsodium"
version = "0.1.0"

[dependencies]
libsodium-sys = { path = "../libsodium-sys" }
thiserror = "1.0"

[profile.release]
panic = "abort"   # Prevents panic unwinding across FFI boundaries.
```

**src/lib.rs:**
```rust
//! Safe Rust bindings for libsodium secret-key authenticated encryption.

use libsodium_sys as ffi;
use std::sync::OnceLock;
use thiserror::Error;

// ----------------------------------------------------------------
// Initialization
// libsodium_init() must be called before any other function.
// It is safe to call multiple times; subsequent calls are no-ops.
// We use OnceLock to guarantee exactly-once initialization.
// ----------------------------------------------------------------

static SODIUM_INIT: OnceLock<()> = OnceLock::new();

fn ensure_init() {
    SODIUM_INIT.get_or_init(|| {
        let ret = unsafe {
            // SAFETY: sodium_init() is safe to call from any thread.
            // It is idempotent and the OnceLock ensures single execution.
            ffi::sodium_init()
        };
        // -1 means already initialized (fine), 0 means success.
        // 1 means a threading race occurred -- should not happen with OnceLock.
        assert!(ret >= 0, "sodium_init() failed: system entropy unavailable");
    });
}

// ----------------------------------------------------------------
// Constants -- derived from bindgen-generated values.
// ----------------------------------------------------------------

pub const KEY_BYTES: usize = ffi::crypto_secretbox_KEYBYTES as usize;
pub const NONCE_BYTES: usize = ffi::crypto_secretbox_NONCEBYTES as usize;
pub const MAC_BYTES: usize = ffi::crypto_secretbox_MACBYTES as usize;

// ----------------------------------------------------------------
// Key and Nonce newtypes
// Fixed-size arrays with #[repr(transparent)] are ABI-compatible
// with C arrays of the same element type and size.
// ----------------------------------------------------------------

#[repr(transparent)]
pub struct SecretKey([u8; KEY_BYTES]);

#[repr(transparent)]
pub struct Nonce([u8; NONCE_BYTES]);

impl SecretKey {
    /// Create a key from raw bytes. Caller must ensure bytes are
    /// cryptographically random (e.g., from `getrandom`).
    pub fn from_bytes(bytes: [u8; KEY_BYTES]) -> Self {
        SecretKey(bytes)
    }
}

impl Drop for SecretKey {
    fn drop(&mut self) {
        // Zero the key material on drop to reduce window for secret exposure.
        // Use a volatile write to prevent the optimizer from eliding the zero.
        for byte in self.0.iter_mut() {
            unsafe { std::ptr::write_volatile(byte, 0u8) };
        }
    }
}

// ----------------------------------------------------------------
// Error type
// ----------------------------------------------------------------

#[derive(Debug, Error)]
pub enum SodiumError {
    #[error("authentication failed: ciphertext is invalid or tampered")]
    AuthenticationFailed,
    #[error("ciphertext is too short to contain a MAC (minimum {MAC_BYTES} bytes)")]
    CiphertextTooShort,
    #[error("output buffer length overflow")]
    Overflow,
}

// ----------------------------------------------------------------
// SecretBox: authenticated encryption
// ----------------------------------------------------------------

/// Authenticated encryption using XSalsa20-Poly1305.
/// Corresponds to crypto_secretbox_easy / crypto_secretbox_open_easy.
pub struct SecretBox {
    key: SecretKey,
}

impl SecretBox {
    pub fn new(key: SecretKey) -> Self {
        ensure_init();
        SecretBox { key }
    }

    /// Encrypt and authenticate `plaintext` with `nonce`.
    /// Returns ciphertext with prepended MAC (MAC_BYTES + plaintext.len() bytes).
    pub fn encrypt(&self, plaintext: &[u8], nonce: &Nonce) -> Result<Vec<u8>, SodiumError> {
        // Output buffer: MAC || ciphertext
        let ciphertext_len = MAC_BYTES
            .checked_add(plaintext.len())
            .ok_or(SodiumError::Overflow)?;
        let mut ciphertext = vec![0u8; ciphertext_len];

        let ret = unsafe {
            // SAFETY:
            // - ciphertext.as_mut_ptr() is valid for ciphertext_len bytes (just allocated).
            // - plaintext.as_ptr() is valid for plaintext.len() bytes (Rust slice invariant).
            // - nonce.0.as_ptr() points to a [u8; NONCE_BYTES] array (repr(transparent)).
            // - self.key.0.as_ptr() points to a [u8; KEY_BYTES] array (repr(transparent)).
            // - libsodium does not retain any of these pointers after the call returns.
            ffi::crypto_secretbox_easy(
                ciphertext.as_mut_ptr(),
                plaintext.as_ptr(),
                plaintext.len() as ffi::c_ulonglong,
                nonce.0.as_ptr(),
                self.key.0.as_ptr(),
            )
        };

        // crypto_secretbox_easy returns 0 on success; no other error code is defined.
        debug_assert_eq!(ret, 0, "crypto_secretbox_easy returned unexpected value");
        Ok(ciphertext)
    }

    /// Decrypt and verify `ciphertext` (MAC || encrypted plaintext) with `nonce`.
    /// Returns plaintext on success, or `Err(SodiumError::AuthenticationFailed)` if
    /// the MAC does not match (indicating tampering or wrong key/nonce).
    pub fn decrypt(&self, ciphertext: &[u8], nonce: &Nonce) -> Result<Vec<u8>, SodiumError> {
        if ciphertext.len() < MAC_BYTES {
            return Err(SodiumError::CiphertextTooShort);
        }

        let plaintext_len = ciphertext.len() - MAC_BYTES;
        let mut plaintext = vec![0u8; plaintext_len];

        let ret = unsafe {
            // SAFETY:
            // - plaintext.as_mut_ptr() is valid for plaintext_len bytes.
            // - ciphertext.as_ptr() is valid for ciphertext.len() bytes.
            // - nonce and key pointers are valid for NONCE_BYTES and KEY_BYTES respectively.
            // - libsodium does not retain any pointers after return.
            ffi::crypto_secretbox_open_easy(
                plaintext.as_mut_ptr(),
                ciphertext.as_ptr(),
                ciphertext.len() as ffi::c_ulonglong,
                nonce.0.as_ptr(),
                self.key.0.as_ptr(),
            )
        };

        match ret {
            0 => Ok(plaintext),
            _ => {
                // Zero the output buffer before returning the error.
                // Partial plaintext from a failed verification must not leak.
                plaintext.iter_mut().for_each(|b| *b = 0);
                Err(SodiumError::AuthenticationFailed)
            }
        }
    }
}

// libsodium is thread-safe after sodium_init(); SecretBox is safe to share.
// SAFETY: libsodium documentation guarantees thread safety for all crypto operations.
unsafe impl Send for SecretBox {}
unsafe impl Sync for SecretBox {}
```

---

### Step 3: Layout Verification Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constants_match_libsodium() {
        // These values are from libsodium 1.0.18 documentation.
        // If they change, it means we linked against an incompatible version.
        assert_eq!(KEY_BYTES, 32);
        assert_eq!(NONCE_BYTES, 24);
        assert_eq!(MAC_BYTES, 16);
    }

    #[test]
    fn round_trip_encrypt_decrypt() {
        let key = SecretKey::from_bytes([0x42u8; KEY_BYTES]);
        let nonce = Nonce([0x24u8; NONCE_BYTES]);
        let plaintext = b"Hello, FFI world!";
        let sb = SecretBox::new(key);

        let ciphertext = sb.encrypt(plaintext, &nonce).unwrap();
        assert_eq!(ciphertext.len(), MAC_BYTES + plaintext.len());

        let recovered = sb.decrypt(&ciphertext, &nonce).unwrap();
        assert_eq!(recovered, plaintext);
    }

    #[test]
    fn tampered_ciphertext_is_rejected() {
        let key = SecretKey::from_bytes([0x01u8; KEY_BYTES]);
        let nonce = Nonce([0x02u8; NONCE_BYTES]);
        let sb = SecretBox::new(key);

        let mut ciphertext = sb.encrypt(b"secret data", &nonce).unwrap();
        ciphertext[5] ^= 0xFF; // Flip bits in the MAC region.

        let result = sb.decrypt(&ciphertext, &nonce);
        assert!(matches!(result, Err(SodiumError::AuthenticationFailed)));
    }

    #[test]
    fn ciphertext_too_short_error() {
        let key = SecretKey::from_bytes([0x03u8; KEY_BYTES]);
        let nonce = Nonce([0x04u8; NONCE_BYTES]);
        let sb = SecretBox::new(key);

        // A ciphertext shorter than MAC_BYTES cannot possibly be valid.
        let result = sb.decrypt(&[0u8; MAC_BYTES - 1], &nonce);
        assert!(matches!(result, Err(SodiumError::CiphertextTooShort)));
    }
}
```

---

### Memory Ownership Table

| Object               | Allocated By    | Freed By        | Rust Mechanism                   |
|----------------------|-----------------|-----------------|----------------------------------|
| `SecretBox`          | Rust (`Box`)    | Rust (`Drop`)   | Implicit via RAII                |
| `SecretKey` bytes    | Rust (stack)    | Rust (`Drop`)   | Volatile zero + drop             |
| `ciphertext` buffer  | Rust (`Vec`)    | Rust (`Drop`)   | `Vec` RAII                       |
| `plaintext` buffer   | Rust (`Vec`)    | Rust (`Drop`)   | `Vec` RAII, zeroed on auth fail  |
| libsodium internals  | libsodium       | libsodium       | No Rust involvement              |

This structure ensures: libsodium never allocates memory that Rust must free, all Rust allocations are cleaned up by standard RAII, and sensitive key material is zeroed on drop via volatile writes that the optimizer cannot elide.
