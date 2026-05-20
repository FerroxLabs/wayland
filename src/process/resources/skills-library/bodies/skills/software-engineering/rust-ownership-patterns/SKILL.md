---
name: rust-ownership-patterns
description: |
  Guides advanced Rust ownership and borrowing: lifetime annotations, smart pointer decision tree (Box vs Rc vs Arc vs Cow), borrow checker strategies, and zero-cost abstraction patterns.
  Use when the user asks about Rust ownership, borrowing, lifetimes, smart pointers, Box, Rc, Arc, Cow, borrow checker.
  Do NOT use when the user asks about Rust project setup (use `rust-project-setup`), Rust error handling (use `rust-error-handling`), Rust performance (use `rust-performance`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "rust best-practices clean-code"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Rust Ownership Patterns

## When to Use

**Use this skill when:**
- The user is designing a data structure and needs to choose between owned types, references, or smart pointers (e.g., "should I store a `String` or `&str` in this struct?")
- The user is fighting the borrow checker -- getting E0502, E0505, E0506, E0515, or E0521 errors and needs to understand the root cause and fix
- The user needs to decide between `Box<T>`, `Rc<T>`, `Arc<T>`, `Cell<T>`, `RefCell<T>`, or `Cow<'a, T>` for a specific use case
- The user is writing generic code or trait objects and needs lifetime annotations (`'a`, `'static`, HRTB with `for<'a>`)
- The user is implementing a self-referential struct, a graph, a tree with parent pointers, or another cyclic/shared-ownership structure
- The user wants to understand when cloning is acceptable versus when to redesign ownership structure
- The user is hitting issues with `Send` + `Sync` bounds in async or multi-threaded code related to ownership
- The user is working with `unsafe` code that requires manual lifetime management (raw pointers, `transmute`, `ManuallyDrop`)

**Do NOT use this skill when:**
- The user asks about setting up a Rust project, workspace layout, Cargo.toml configuration, or feature flags -- use `rust-project-setup`
- The user asks about `Result`, `Option`, `?` operator, custom error types, `thiserror`, or `anyhow` -- use `rust-error-handling`
- The user asks about Rust performance profiling, SIMD, cache optimization, or zero-copy I/O tuning -- use `rust-performance`
- The user is asking about async Rust specifically (`.await`, `Future`, `tokio`, `async-std`) -- use `rust-async-patterns` if available, but note ownership concerns in async code may overlap
- The user asks about Rust macro authorship (`macro_rules!`, proc macros) -- those have distinct concerns not addressed here
- The user is asking about FFI (calling C from Rust or vice versa) -- ownership rules apply but the primary concern is ABI and safety invariants

---

## Process

### 1. Diagnose the Ownership Problem or Design Question

Before recommending any pattern, fully understand what the user is trying to express:

- Identify whether this is a **compiler error** (borrow checker rejection), a **design question** (choosing how to model ownership), or a **performance question** (unnecessary clones or allocations)
- For compiler errors, extract the exact error code (E0502 = cannot borrow as mutable because also borrowed as immutable, E0505 = cannot move out of value because borrowed, E0515 = cannot return reference to local variable, E0521 = borrowed data escapes outside of closure)
- Ask what the **lifetime of the data** should be -- who creates it, who is responsible for dropping it, and who needs to read or mutate it
- Identify whether shared ownership is truly required or whether a different data flow would eliminate the need for `Rc`/`Arc`
- Determine whether the struct owns its data or borrows it: structs that borrow data need lifetime parameters and are harder to use in async contexts and thread-spawning

### 2. Apply the Smart Pointer Decision Tree

Walk through this decision tree in order -- stop at the first match:

- **Does only one place ever own this value at a time, and no heap allocation is needed?** -- Use a plain owned type (`T`) or reference (`&T` / `&mut T`). This is the default; all other options exist to escape limitations of this model.
- **Do you need heap allocation to break infinite type size (e.g., recursive types) or to store a trait object?** -- Use `Box<T>`. Zero runtime overhead beyond the heap allocation itself. Use `Box<dyn Trait>` for dynamic dispatch.
- **Do you need shared ownership within a single thread, with the ability to mutate through shared references?** -- Use `Rc<T>` for shared ownership. Combine with `RefCell<T>` for interior mutability (`Rc<RefCell<T>>`). `RefCell` panics at runtime on aliased mutable borrows; use only when the borrow checker cannot statically prove safety.
- **Do you need shared ownership across threads?** -- Use `Arc<T>`. Combine with `Mutex<T>` or `RwLock<T>` for interior mutability (`Arc<Mutex<T>>`). Prefer `RwLock` when reads vastly outnumber writes. `Mutex` adds 20-40ns per lock/unlock on x86_64 under contention; `RwLock` is faster for concurrent reads.
- **Do you have data that is usually borrowed but occasionally needs to be owned (e.g., function that accepts both `&str` and `String`)?** -- Use `Cow<'a, str>` (or `Cow<'a, [T]>` for slices). Clone only when mutation is required. This is the correct pattern for configuration structs that might hold constants or dynamic strings.
- **Do you need shared ownership within a single thread but with guaranteed single mutation access (no `RefCell` panics)?** -- Consider redesigning with a central owner and passing `&mut T` explicitly, or use an arena allocator (`bumpalo`, `typed-arena`) for data with the same lifetime.
- **Do you need to mutate a `T` through a shared `&T` reference without `Rc` or `Arc`?** -- Use `Cell<T>` for `Copy` types (zero overhead) or `RefCell<T>` for non-`Copy` types (small runtime borrow tracking overhead).

### 3. Design Lifetime Annotations

When a struct or function borrows data, lifetime annotations encode who owns the data and how long the borrow lasts:

- Start with **lifetime elision** -- do not add annotations the compiler can infer. The three elision rules cover most free functions.
- Add explicit lifetimes when a struct holds a reference: `struct Parser<'a> { input: &'a str }`. The lifetime parameter says "a `Parser` cannot outlive the `&str` it was given."
- When a function returns a reference derived from one of multiple input references, annotate to tell the compiler which input it comes from: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str`. The lifetime `'a` is the intersection (shorter) of the two inputs.
- Use `'static` only when data truly lives for the entire program -- string literals, `lazy_static!`/`once_cell` globals, or data explicitly leaked with `Box::leak`. Do NOT use `'static` as a workaround for lifetime problems; it signals permanent heap allocation or global state.
- Use Higher-Rank Trait Bounds (HRTB) with `for<'a>` when a trait must hold for all possible lifetimes: `where F: for<'a> Fn(&'a str) -> &'a str`. This appears in closures stored in structs and in `serde::Deserialize`.
- Prefer **named lifetimes** over single-letter ones in complex APIs: `'input`, `'arena`, `'env` communicate intent. Reserve `'a`, `'b` for simple, obvious cases.
- When a struct has multiple lifetime parameters, explicitly name the relationship if one outlives the other: `struct StrSplit<'haystack, 'delimiter>` where `'haystack: 'delimiter` means haystack outlives delimiter.

### 4. Resolve Borrow Checker Conflicts

When the compiler rejects code, apply these resolution strategies in order of preference:

- **Restructure borrow scopes using blocks**: Wrapping a borrow in `{ }` terminates it before the next borrow begins. This resolves most E0502 errors without changing logic.
- **Clone selectively**: Clone only the specific field needed, not the whole struct. Use `.clone()` on a `String` before passing ownership elsewhere. Cloning a `String` is ~10-50ns and heap-allocates; do it when the alternative is architectural complexity.
- **Use indices instead of references** in graph/tree structures: store `Vec<Node>` and refer to nodes by `usize` index. This is the idiomatic Rust solution for self-referential and graph structures -- no lifetimes, no `Rc`, O(1) lookup.
- **Split structs** to allow independent borrows: if methods borrow all of `self`, split fields into sub-structs so different methods can borrow different sub-structs simultaneously.
- **Use `split_at_mut`** or similar slice primitives when you need two mutable references into the same collection.
- **Reach for `unsafe` only as a last resort** after documenting exactly what invariant the unsafe code relies on, writing a safety comment, and confirming no safe alternative exists.

### 5. Apply Interior Mutability Correctly

Interior mutability bypasses the static borrow checker at the cost of runtime checks or atomic operations:

- `Cell<T>` -- only for `Copy` types. Provides `get()` and `set()`. No runtime borrow tracking. Zero overhead. Use for shared counters, flags, simple values.
- `RefCell<T>` -- for non-`Copy` types on a single thread. `borrow()` returns `Ref<T>`, `borrow_mut()` returns `RefMut<T>`. Panics if you call `borrow_mut()` while any `borrow()` is live. Keep `borrow_mut()` scopes as small as possible. Prefer `try_borrow_mut()` in library code to return an error instead of panicking.
- `Mutex<T>` -- for multi-threaded mutation. Blocks on contention. Always lock for the shortest duration possible -- do not hold a `MutexGuard` across an `.await` point (this is a common bug in async Rust that causes deadlocks or `Send` bound violations).
- `RwLock<T>` -- multiple readers OR one writer. On Linux with `pthreads`, a writer can starve under heavy read load. Use `parking_lot::RwLock` for better performance and starvation resistance (parking_lot locks are 2-5x faster than `std` under contention).
- `AtomicUsize`, `AtomicBool`, etc. -- for primitive values in lock-free contexts. Use `Ordering::SeqCst` when uncertain, then optimize to `Relaxed`/`Acquire`/`Release` only after understanding the memory model implications.

### 6. Handle Cow<'a, B> Properly

`Cow` (Clone on Write) is underused and frequently misunderstood:

- The type constraint is `B: ToOwned` -- `Cow<'a, str>` wraps either `&'a str` (borrowed) or `String` (owned), `Cow<'a, [T]>` wraps either `&'a [T]` or `Vec<T>`.
- Construct with `Cow::Borrowed(&data)` or `Cow::Owned(data)`. Use `Cow::from()` which infers the variant.
- Call `.to_mut()` to get a `&mut <B as ToOwned>::Owned` -- this clones the borrowed data the first time, then mutates in place on subsequent calls.
- Primary use cases: (1) functions that return either a borrowed slice of their input or a newly allocated transformation, (2) config/message structs that hold string fields which are usually `'static` string literals but occasionally runtime strings, (3) avoiding allocation in hot paths that rarely need mutation.
- `Cow<'a, str>` implements `Deref<Target = str>`, so it works anywhere `&str` does.

### 7. Verify Trait Bounds: Send and Sync

Ownership patterns have direct implications for concurrency:

- `T: Send` means `T` can be transferred to another thread. `Rc<T>` is NOT `Send` because its reference count is not atomic.
- `T: Sync` means `&T` can be shared across threads. `Cell<T>` and `RefCell<T>` are NOT `Sync` because their interior mutability is not thread-safe.
- `Arc<T>` is `Send + Sync` if and only if `T: Send + Sync`.
- `Arc<Mutex<T>>` is `Send + Sync` if `T: Send`, which covers most practical cases.
- When the compiler says "the trait `Send` is not implemented for `Rc<...>`", the fix is almost always to replace `Rc` with `Arc` and `RefCell` with `Mutex`/`RwLock`.
- In async code, values held across `.await` points must be `Send` if the executor is multi-threaded (tokio's default). If a `MutexGuard` is held across `.await`, the future is not `Send`. The fix is to drop the guard before `.await` by scoping it in a block.

### 8. Document Ownership Decisions in Code

Every non-obvious ownership choice must be documented at the point of declaration:

- Comment why `Rc<RefCell<T>>` is used instead of redesigning: "// Shared ownership required: multiple UI components update this model. Single-threaded context only."
- Comment `unsafe` blocks with a `// SAFETY:` line explaining the invariant being upheld.
- Comment `'static` bounds when they are not obvious: "// 'static required because this is stored in a global registry."
- Use type aliases to give complex types readable names: `type SharedConfig = Arc<RwLock<Config>>`. Name the alias at module level.
- If the lifetime of a struct is not obvious, add a module-level doc comment explaining the ownership model of the data it processes.

---

## Output Format

When answering a Rust ownership question, structure the response as follows:

```
## Diagnosis
[One paragraph identifying the core ownership problem: what the compiler is enforcing and why]

## Smart Pointer / Pattern Recommendation

| Scenario | Recommended Type | Why |
|---|---|---|
| Single owner, stack or heap | T or Box<T> | Zero overhead; default choice |
| Shared, single-thread, no mutation | Rc<T> | Non-atomic refcount; cheaper than Arc |
| Shared, single-thread, with mutation | Rc<RefCell<T>> | Interior mutability; panics on aliased borrows |
| Shared, multi-thread, no mutation | Arc<T> | Atomic refcount; T must be Sync |
| Shared, multi-thread, with mutation | Arc<Mutex<T>> or Arc<RwLock<T>> | Thread-safe interior mutability |
| Borrowed or owned string/slice | Cow<'a, str> / Cow<'a, [T]> | Avoids allocation when no mutation needed |
| Cell-like, Copy type, single-thread | Cell<T> | Zero overhead; no borrow tracking |
| Dynamic dispatch, heap | Box<dyn Trait> | Trait objects; 8-byte fat pointer |

## Lifetime Annotation Guide
[Explanation of which lifetimes to add and why, with annotated code]

## Corrected / Recommended Implementation

```rust
// [Full, compilable code example with doc comments explaining ownership decisions]
```

## Trade-offs
[Table or bullet list: performance cost, ergonomics, thread safety, and failure mode of the chosen pattern]

## Alternatives Considered
[Brief note on why other patterns were rejected for this specific case]
```

---

## Rules

1. **Never recommend `Rc<RefCell<T>>` without first verifying the use case is truly single-threaded.** If there is any chance of threading, `Arc<Mutex<T>>` is required. Mixing `Rc` into a multi-threaded context causes undefined behavior that the compiler will catch at the `Send`/`Sync` bound.

2. **Never use `'static` as a lifetime workaround.** `'static` means the data lives forever or is leaked. Using `Box::leak` to satisfy a `'static` bound is a memory leak unless you have a specific reclamation strategy. When a user is tempted by `'static`, explore whether an owned type or a shorter lifetime solves the problem.

3. **Never advise holding a `MutexGuard` across an `.await` point.** This makes the `Future` non-`Send` and, if it compiles at all (e.g., with a single-threaded executor), risks deadlock. Always scope guards to the smallest possible block.

4. **Never recommend `unsafe` before exhausting safe alternatives.** Safe alternatives include: restructuring borrow scopes, using indices, splitting structs, using `Cell`/`RefCell`, or using `Arc`. Document when `unsafe` is truly the only option and always include a `// SAFETY:` comment.

5. **Always prefer the simplest ownership model that satisfies the requirements.** The preference order is: owned value > shared reference > `Box` > `Rc`/`Arc` > `RefCell`/`Mutex`. Each step adds complexity or overhead; justify each step up.

6. **Never clone unnecessarily, but never avoid cloning dogmatically.** Cloning a `String` is ~10-50ns and is often the right trade-off. The problem is cloning in hot loops or cloning entire large data structures when only a field is needed. Profile before optimizing clone behavior.

7. **Never put a `RefCell<T>` in a struct without documenting the borrow discipline.** Because `RefCell` panics at runtime, callers must know not to hold a `borrow()` while also calling a method that takes `borrow_mut()`. This is invisible from the type signature.

8. **Always make `Cow<'a, T>` fields explicit about the lifetime in public APIs.** `Cow<'static, str>` in a public struct means the struct owns its string data or uses string literals -- this is a meaningful API contract. Omitting the lifetime or hiding it prevents callers from understanding storage behavior.

9. **Never apply graph/tree pointer structures with `Rc` when an arena allocator fits.** For trees where nodes share a single lifetime (they're all allocated together and freed together), an arena (`bumpalo`, `typed-arena`) is faster (bump allocation ~1ns vs `Rc` allocation ~10-20ns) and produces simpler code with plain references.

10. **Always check `Send + Sync` implications when introducing a new smart pointer.** If a type wraps `Rc`, `Cell`, or `RefCell`, the wrapping type is automatically not `Send`/`Sync`. This silently infects any type that contains it. Run `cargo check` and look for `Send`/`Sync` errors before finalizing a design.

---

## Edge Cases

### Self-Referential Structs
Rust's ownership model makes self-referential structs (a struct with a field that contains a reference to another of its own fields) impossible with safe references. The standard solutions are: (1) Use indices into a `Vec` instead of references -- this is always the correct first choice. (2) Use `Pin<Box<T>>` with `unsafe` for truly intrusive structures like async futures or certain linked list implementations. (3) Use the `ouroboros` or `self_cell` crates which generate safe wrappers around `unsafe` self-referential code. (4) Use an arena allocator so all nodes share a lifetime and can hold plain `&'arena Node` references. Never use `Rc<RefCell<T>>` for self-referential structs -- it adds overhead and does not solve the lifetime problem.

### Cyclic References with Rc
`Rc<T>` uses reference counting, which cannot detect cycles. A cycle of `Rc` pointers leaks memory because the reference count never reaches zero. The solution is to designate one direction of the relationship as `Rc` (strong, owns the child) and the other as `Weak<T>` (weak, does not own). Obtain a `Weak<T>` with `Rc::downgrade(&rc)`. Upgrade to `Rc<T>` with `weak.upgrade()` which returns `Option<Rc<T>>` -- `None` if the value has been dropped. The classic pattern: a tree where parent holds `Vec<Rc<Child>>` and each child holds `Weak<Parent>`.

### Lifetime Variance and Subtyping
Rust lifetimes are covariant in most positions -- a `&'long T` can be used where `&'short T` is expected because `'long` outlives `'short`. However, `&mut T` is invariant in `T`: you cannot use `&mut &'long str` where `&mut &'short str` is expected. This causes surprising errors when storing mutable references to references. The fix is usually to avoid mutable references to references (use owned types) or to add explicit variance annotations via `PhantomData<fn(T) -> T>` in unsafe code.

### Returning References from Methods Across Branches
When a method tries to return a reference from one branch of an `if` or `match` that is computed differently in each branch, the compiler cannot always prove the lifetimes match. A common case: trying to return either `self.cache` (borrowed from self) or a newly computed value (local to the method). You cannot return both from the same function because the local value is dropped. The solution is to either: (1) store the computed value in `self` before returning a reference to it, (2) return an owned value instead of a reference, or (3) use `Cow` to allow returning either borrowed or owned.

### Interior Mutability and Iterator Invalidation
`RefCell<Vec<T>>` does not protect against iterator invalidation because `borrow_mut()` is a runtime check, not a static one. If code borrows the `Vec` for iteration and then calls a function that `borrow_mut()`s the same `Vec` during iteration, it panics. Structure code so that the full iteration completes before any mutation, or collect the iteration results first (`.collect::<Vec<_>>()`) and then process mutations.

### `Arc<Mutex<T>>` Poisoning
When a thread panics while holding a `Mutex`, the mutex is "poisoned." Subsequent calls to `lock()` return `Err(PoisonError)`. Most codebases should handle this: either call `.unwrap()` to propagate the panic (appropriate if the poisoned state is unrecoverable) or call `.unwrap_or_else(|e| e.into_inner())` to recover the data (appropriate if the panic was in unrelated code and the data is still valid). Never silently ignore a `PoisonError` -- it means another thread panicked while mutating shared state.

### Cow with Non-str Types
`Cow<'a, [u8]>` (byte slices) is common in I/O and serialization code. A subtle issue: when you call `.to_mut()` on a `Cow::Borrowed(&[u8])`, it clones the slice into a `Vec<u8>`. If the slice is large (e.g., a multi-megabyte buffer), this is a significant allocation. Profile `Cow` usage in hot paths and consider whether the "rarely needs mutation" assumption actually holds for the data sizes in production.

### Lifetime Bounds on Trait Objects
`Box<dyn Trait>` has an implicit `'static` lifetime bound: it is actually `Box<dyn Trait + 'static>`. This means the trait object cannot contain any borrowed data. If a trait object needs to borrow data, write the bound explicitly: `Box<dyn Trait + 'a>` where `'a` is a lifetime parameter of the enclosing struct or function. Forgetting this is a common source of confusing "does not live long enough" errors when first using trait objects.

---

## Example

**Input:** "I'm building a simple in-memory key-value store that will be accessed by multiple threads. The store holds `String` keys and `Vec<u8>` values. I need to return a reference to values to avoid copying them, and I want multiple readers to be able to read simultaneously. I'm getting lifetime errors when I try to return `&Vec<u8>` from a method that takes `&self`."

---

**Output:**

## Diagnosis

The core problem is that you are trying to return a reference (`&Vec<u8>`) to data inside a `Mutex` or `RwLock` guard, but the guard is a local variable in the method -- when the method returns, the guard is dropped and the reference becomes dangling. The compiler correctly rejects this. Additionally, multi-reader access with single-writer semantics is exactly the use case for `RwLock<T>` rather than `Mutex<T>`.

The fix requires one of two approaches: (1) return an owned value (`Vec<u8>` or `Arc<Vec<u8>>`) instead of a reference, or (2) change the API to accept a closure that operates on the reference while the lock is held. Returning a reference across a lock boundary is fundamentally unsafe in Rust without `unsafe` code or crates like `parking_lot`'s `MappedRwLockReadGuard`.

The recommended production solution is to store values as `Arc<Vec<u8>>` so that returning a clone of the `Arc` is cheap (~5ns, just an atomic increment) and gives callers a stable reference to the data with no lifetime entanglement.

---

## Smart Pointer / Pattern Recommendation

| Scenario | Recommended Type | Why |
|---|---|---|
| Shared store across threads | `Arc<RwLock<HashMap<...>>>` | Multi-reader, single-writer; thread-safe |
| Values in the store | `Arc<Vec<u8>>` | Cheap clone; callers get stable reference |
| Returning value to caller | Clone the `Arc<Vec<u8>>` | ~5ns; avoids lifetime-across-lock-boundary problem |
| Key type | `String` (owned) | No lifetime complications in HashMap key |

---

## Lifetime Annotation Guide

The reason `&Vec<u8>` cannot be returned from a method that locks a `RwLock` is that the reference's lifetime would be tied to the `RwLockReadGuard`, which is local to the method. The lifetime would need to be `'guard` which does not exist at the call site.

By switching values to `Arc<Vec<u8>>`, we return an owned handle. The lifetime of the underlying `Vec<u8>` is managed by the `Arc` reference count, not by any borrow scope. This is the idiomatic solution when references cannot escape lock scope.

---

## Corrected / Recommended Implementation

```rust
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

/// Thread-safe in-memory key-value store.
///
/// Values are stored as `Arc<Vec<u8>>` so that callers receive a cheap,
/// owned handle (just an atomic refcount increment) rather than a reference
/// tied to the internal lock guard's lifetime.
///
/// Use `RwLock` rather than `Mutex` because reads vastly outnumber writes
/// in typical KV store workloads. Multiple readers proceed concurrently;
/// writers have exclusive access.
#[derive(Clone, Default)]
pub struct KvStore {
    // Arc here allows KvStore itself to be cheaply cloned and shared
    // across threads (e.g., passed to multiple tokio tasks).
    inner: Arc<RwLock<HashMap<String, Arc<Vec<u8>>>>>,
}

impl KvStore {
    pub fn new() -> Self {
        Self::default()
    }

    /// Returns a clone of the Arc<Vec<u8>> for the given key, or None.
    ///
    /// Cloning an Arc is ~5ns (one atomic fetch-add). The returned Arc
    /// keeps the data alive independently of the store -- safe to hold
    /// across await points or pass to other threads.
    pub fn get(&self, key: &str) -> Option<Arc<Vec<u8>>> {
        // Acquire a read lock. Multiple threads can hold this simultaneously.
        // The guard is dropped at the end of this block, before we return.
        let guard = self.inner.read().expect(
            // Panic on poison: if a writer panicked mid-mutation,
            // the HashMap may be in an inconsistent state.
            "KvStore RwLock poisoned: a writer panicked during mutation",
        );
        // Clone the Arc, not the Vec<u8>. This is O(1).
        guard.get(key).cloned()
    }

    /// Inserts or replaces a value for the given key.
    ///
    /// The caller passes a Vec<u8>; we wrap it in Arc before storing.
    /// If the caller already has an Arc<Vec<u8>> (e.g., shared with
    /// another part of the system), use `insert_arc` to avoid double-wrapping.
    pub fn insert(&self, key: String, value: Vec<u8>) {
        let mut guard = self.inner.write().expect(
            "KvStore RwLock poisoned",
        );
        guard.insert(key, Arc::new(value));
    }

    /// Inserts a pre-wrapped Arc<Vec<u8>>. Useful when the value is
    /// already shared elsewhere and you want the store to participate
    /// in the same Arc refcount rather than creating a new allocation.
    pub fn insert_arc(&self, key: String, value: Arc<Vec<u8>>) {
        let mut guard = self.inner.write().expect(
            "KvStore RwLock poisoned",
        );
        guard.insert(key, value);
    }

    /// Removes a key. Returns the Arc if it was present.
    pub fn remove(&self, key: &str) -> Option<Arc<Vec<u8>>> {
        let mut guard = self.inner.write().expect(
            "KvStore RwLock poisoned",
        );
        guard.remove(key)
    }

    /// Applies a function to the value for a key while holding the read lock.
    ///
    /// Use this when you need to operate on the &Vec<u8> directly without
    /// cloning. The closure must not acquire the KvStore lock (deadlock).
    pub fn with_value<F, R>(&self, key: &str, f: F) -> Option<R>
    where
        F: FnOnce(&[u8]) -> R,
    {
        let guard = self.inner.read().expect("KvStore RwLock poisoned");
        guard.get(key).map(|v| f(v.as_slice()))
    }
}

// Verify thread-safety at compile time.
// If any field were Rc or RefCell, these would not compile.
static_assertions::assert_impl_all!(KvStore: Send, Sync);

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;

    #[test]
    fn concurrent_reads_are_allowed() {
        let store = KvStore::new();
        store.insert("key".into(), b"hello world".to_vec());

        let handles: Vec<_> = (0..8).map(|_| {
            let store = store.clone(); // Clone the Arc inside; ~5ns
            thread::spawn(move || {
                let val = store.get("key").expect("key missing");
                assert_eq!(val.as_ref(), b"hello world");
            })
        }).collect();

        for h in handles { h.join().unwrap(); }
    }

    #[test]
    fn with_value_avoids_clone() {
        let store = KvStore::new();
        store.insert("greeting".into(), b"hi".to_vec());

        // No Vec<u8> is allocated; we process in-place.
        let length = store.with_value("greeting", |bytes| bytes.len());
        assert_eq!(length, Some(2));
    }
}
```

---

## Trade-offs

| Dimension | This Approach (`Arc<RwLock<HashMap<String, Arc<Vec<u8>>>>>`) | Alternative: Return cloned `Vec<u8>` |
|---|---|---|
| `get()` cost | ~5ns (atomic increment) | ~50-500ns (memcpy proportional to value size) |
| Caller holds stale data | Yes -- Arc clone is a snapshot | Yes -- same problem |
| Lifetime complexity | None -- fully owned | None -- fully owned |
| Memory usage | Slightly higher (two heap objects per entry) | Same per entry, more per read |
| Thread safety | `Send + Sync` verified by compiler | Same |
| Failure mode | `RwLock` poison on writer panic | Same |

---

## Alternatives Considered

- **`Mutex<HashMap<...>>` instead of `RwLock`**: Rejected because `Mutex` serializes all reads. Under a workload of 95% reads, `RwLock` provides significantly higher throughput. Use `parking_lot::RwLock` in production for ~2x faster lock/unlock than `std::sync::RwLock`.

- **Returning `MappedRwLockReadGuard<Vec<u8>>` from `parking_lot`**: Technically possible with `parking_lot`'s `RwLockReadGuard::map()`, which returns a guard that holds the lock open. Rejected because it forces callers to hold the read lock for the duration of their processing, reducing write throughput. Only appropriate for very short-lived access patterns.

- **`DashMap` (concurrent HashMap crate)**: A valid alternative for high-contention workloads. `DashMap` shards the map into 64 sub-maps, each with its own `RwLock`, reducing contention significantly. Appropriate when benchmarking reveals the single `RwLock` is a bottleneck. Not chosen here to keep the example dependency-free.

- **`Arc<Vec<u8>>` stored in a `Vec` with `usize` index keys**: Appropriate if keys are sequential integers rather than strings. Eliminates `HashMap` overhead (~40ns per lookup) in favor of direct index access (~1ns).
