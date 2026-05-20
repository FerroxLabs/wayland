---
name: swift-concurrency-patterns
description: |
  Guides expert-level swift concurrency patterns implementation: swift and mobile decision frameworks, production-ready patterns, and concrete templates for swift concurrency patterns workflows.
  Use when the user asks about swift concurrency patterns, swift concurrency patterns configuration, or swift best practices for swift projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "swift mobile optimization"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Swift Concurrency Patterns

## When to Use

**Use this skill when:**
- The user asks how to structure async/await code in Swift 5.5+ to avoid data races, deadlocks, or excessive thread creation
- The user wants to migrate from GCD (Grand Central Dispatch) or DispatchQueue-based code to the Swift concurrency model (actors, async/await, structured concurrency)
- The user needs to decide between `async let`, `TaskGroup`, `Actor`, `@MainActor`, or `Sendable` for a specific iOS/macOS problem
- The user is debugging concurrency bugs such as purple runtime warnings about main thread violations, `Task` cancellation not propagating, or unexpected re-entrancy in actor-isolated code
- The user wants to interop between legacy Objective-C callbacks or Combine publishers and the Swift concurrency system
- The user needs to implement a producer/consumer pipeline, a cache with concurrent reads, or a background data-sync task in a Swift application
- The user asks about `AsyncSequence`, `AsyncStream`, or `continuation`-based bridging with UIKit/AppKit delegate patterns

**Do NOT use this skill when:**
- The user is asking about Combine-specific operators (`.map`, `.flatMap`, `.merge`) without any Swift concurrency involvement -- use a Combine-specific skill instead
- The user needs RxSwift, ReactiveSwift, or other reactive library patterns -- those have different execution models
- The user is working in Swift for server-side (SwiftNIO, Vapor event-loop threading model) where actor isolation rules interact differently with NIO's EventLoop -- those require a server-side Swift skill
- The user needs general iOS architecture patterns (MVVM, TCA, VIPER) without a concurrency component -- use an iOS architecture skill
- The user is asking about Objective-C threading (`NSThread`, `NSOperationQueue`) in a purely Objective-C codebase
- The user needs help with GPU/Metal compute shaders or parallel numerical processing -- that is a separate rendering/compute domain
- The user is asking about Python, Kotlin, or Rust async runtimes -- those use fundamentally different concurrency models

---

## Process

### 1. Diagnose the Concurrency Problem Category

Before recommending any pattern, classify the problem. Swift concurrency has distinct tools for distinct problems, and choosing the wrong primitive causes subtle bugs.

- **Fire-and-forget background work** (e.g., prefetching, analytics) -- use an unstructured `Task` attached to a view or controller lifetime
- **Parallel decomposition of known work** (e.g., downloading 20 images in parallel, then aggregating) -- use `async let` for 2--5 items or `withTaskGroup` / `withThrowingTaskGroup` for dynamic counts
- **Shared mutable state** (e.g., a cache, a counter, a rate limiter) -- use an `actor`; decide whether `@MainActor` isolation or a custom actor is appropriate
- **Streaming/event sequences** (e.g., CoreLocation updates, URLSession byte streams, timer ticks) -- use `AsyncStream` or `AsyncThrowingStream`
- **Bridging callbacks** (e.g., `URLSession` completion handlers, `CLLocationManager` delegate) -- use `withCheckedContinuation` or `withCheckedThrowingContinuation`
- **Child task coordination with cancellation** -- use structured concurrency (`TaskGroup`) so cancellation propagates automatically

Identify which category applies before proceeding. A single request may span multiple categories.

### 2. Audit the Execution Context

Swift concurrency's correctness depends heavily on knowing which actor context code runs in. Mistakes here cause purple runtime warnings and data races.

- Identify all types that must run on the main thread (UIKit views, UIViewController, SwiftUI view models using `@Published`) -- annotate them `@MainActor`
- For `@MainActor`-isolated types, recognize that `await`-ing non-isolated async functions will switch off the main thread; switching back requires either another `await` or calling via `MainActor.run {}`
- Check whether a class conforms to `Sendable`. If a type crosses actor boundaries, it must be `Sendable` -- value types with only `Sendable` stored properties are implicitly `Sendable`; reference types must mark conformance explicitly and carefully
- Enable `-strict-concurrency=complete` in the Swift compiler flags (`OTHER_SWIFT_FLAGS` in Xcode build settings) to surface all `Sendable` and isolation violations as errors -- do this in a dedicated CI build target even if the main target uses `minimal` or `targeted`
- Map the critical path: if a user-facing action triggers async work, every `await` suspension point is a place where the UI can change state; plan for this explicitly

### 3. Select the Right Concurrency Primitive

Apply this decision framework in order:

**For parallelism (doing multiple things at once):**
- 2--4 statically known parallel tasks: use `async let` -- compiles to a child task per binding, automatic cancellation on scope exit
- 5+ tasks or dynamically sized collections: use `withTaskGroup(of:)` for non-throwing work, `withThrowingTaskGroup(of:)` for throwing work; always iterate results inside the group body using `for await result in group` to avoid task accumulation
- Unordered result collection where ordering does not matter: `addTaskUnlessCancelled` inside the group loop lets you bail cleanly when the parent task is cancelled

**For shared state:**
- Mutable state accessed from multiple tasks: `actor` -- guarantates serial access without explicit locking
- High-read, low-write state that does not need mutation (configuration, lookup tables): use a `struct` passed as a `Sendable` value; avoid actor overhead on read-heavy paths
- Main-thread-bound state (view models, UI controllers): `@MainActor` class -- the compiler enforces isolation; `nonisolated` marks functions that can run off the main thread
- Global singletons: use a `global actor` (`@globalActor`) only when you need a single shared executor across multiple types; avoid overusing this pattern as it creates a hidden serialization point

**For streaming:**
- Push-based event source (delegate, callback): wrap in `AsyncStream { continuation in ... }` -- store the continuation; call `continuation.yield(value)` from the callback; call `continuation.finish()` on teardown
- Backpressure-sensitive streaming: use `AsyncStream` with a `bufferingPolicy` of `.bufferingNewest(n)` or `.bufferingOldest(n)` to avoid unbounded memory growth; `.unbounded` is only safe when the producer is slower than the consumer
- Transforming an existing `AsyncSequence`: use `.map`, `.filter`, `.compactMap` from the standard library; for custom transformations, implement the `AsyncSequence` protocol with an `AsyncIteratorProtocol`

**For task lifecycle:**
- Work tied to a SwiftUI view: use `.task {}` modifier -- automatically cancelled when the view disappears
- Work tied to a UIViewController: create a `Task` in `viewDidAppear` and cancel it in `viewDidDisappear` or `deinit`; store the task in a `var task: Task<Void, Never>?` property
- Background work that must complete even if the UI disappears (e.g., uploading a photo): use `URLSession` background sessions, not a detached `Task` -- the OS can terminate the app

### 4. Implement Actor Isolation Correctly

Actor isolation is the most commonly misunderstood part of Swift concurrency. Get this right before writing any actor code.

- Actors serialize access: only one piece of code runs at a time inside an actor's executor; there is no need for `DispatchQueue` serial queues or `NSLock` inside an actor
- Actor `nonisolated` methods run on the caller's executor -- use `nonisolated` for pure functions (computations, formatting, encoding) that do not touch actor state; this avoids unnecessary hops to the actor's executor
- Actor re-entrancy: when an actor calls `await` on an external function, another caller can enter the actor; always re-validate state after any `await` inside an actor -- do not assume state is unchanged across a suspension point
- To batch multiple state reads/writes atomically, perform them all synchronously within a single actor-isolated method; do not interleave `await` calls between dependent reads
- `actor` vs. `class` with a lock: actors provide compile-time isolation guarantees; a `class` with `NSLock` or `os_unfair_lock` provides runtime protection only; prefer actors for new code; when interoping with legacy lock-based code, use actors as a wrapper

**Example of re-entrancy bug to avoid:**
```swift
actor BankAccount {
    var balance: Double = 0

    // WRONG: balance could be read twice before either write completes
    func transfer(amount: Double, to other: BankAccount) async {
        let current = balance  // reads balance
        await other.deposit(amount) // suspension point -- re-entrancy possible
        balance = current - amount  // may operate on stale value
    }

    // CORRECT: validate after await
    func transfer(amount: Double, to other: BankAccount) async throws {
        guard balance >= amount else { throw TransferError.insufficientFunds }
        balance -= amount  // deduct before suspending
        await other.deposit(amount)
    }
}
```

### 5. Handle Task Cancellation Explicitly

Swift's cooperative cancellation model requires code to check for cancellation -- it does not stop a task forcibly.

- Call `try Task.checkCancellation()` at natural suspension points in long loops or after network calls; this throws `CancellationError` if the task is cancelled
- Use `Task.isCancelled` (a Boolean) for non-throwing contexts where you want to exit gracefully rather than throw
- When implementing `AsyncSequence`, yield `nil` (finishing the sequence) when the iteration task is cancelled; do not continue producing values into a cancelled context
- `withTaskCancellationHandler(operation:onCancel:)` lets you register a synchronous cleanup callback that runs immediately on cancellation -- use this to cancel underlying URLSession data tasks, close file handles, or stop CLLocationManager updates
- `TaskGroup` cancels all child tasks automatically when any child throws -- this is the correct behavior for "fail fast" semantics; if you want "collect all results including errors", use `withThrowingTaskGroup` and catch errors inside the child task body before they propagate

### 6. Bridge Legacy APIs Safely

Most real Swift projects have existing GCD, delegation, and callback-based code that must interoperate with async/await.

- **Completion handlers to async:** use `withCheckedContinuation` (non-throwing) or `withCheckedThrowingContinuation` (throwing); "checked" variants assert that the continuation is resumed exactly once -- a double-resume or missing resume will produce a runtime warning or crash in debug builds
- **Unsafe continuations:** `withUnsafeContinuation` skips the double-resume check; only use this in performance-critical paths where profiling shows the overhead of the check is measurable (it is almost never necessary)
- **Delegate-based APIs (CLLocationManager, AVAudioSession):** wrap with `AsyncStream`; the delegate stores the continuation and yields values; ensure the `AsyncStream` is properly terminated when the delegate receives a terminal event
- **NotificationCenter:** use `NotificationCenter.default.notifications(named:)` which returns an `AsyncSequence` since iOS 15 -- do not wrap this in a custom `AsyncStream`
- **Combine to AsyncSequence:** use `.values` on any `Publisher` (available since iOS 15) -- `somePublisher.values` is an `AsyncSequence` you can iterate with `for await`
- **Mixing DispatchQueue with async:** calling `DispatchQueue.main.async {}` inside a `@MainActor` async function is redundant and potentially harmful; use `await MainActor.run {}` instead when you must explicitly switch to the main actor from a different context

### 7. Test and Validate Concurrency

Concurrency bugs are non-deterministic. Standard XCTest techniques must be supplemented.

- Enable the Swift Concurrency runtime checks in the scheme: "Thread Performance Checker" (`SWIFT_ASYNC_DEBUG=1`) and "Main Thread Checker" in the Diagnostics tab -- these surface actor isolation violations at runtime
- Enable Thread Sanitizer (TSan) on test targets to detect data races in code not yet migrated to actors -- TSan cannot catch actor-isolation violations but catches raw memory races in `nonisolated` code
- Use `XCTestExpectation` with `expectation.fulfill()` inside async tasks; call `await fulfillment(of: [expectation], timeout: 5.0)` instead of `waitForExpectations` for native async test support (Xcode 14.3+)
- Write deterministic tests by injecting a `Clock` conformance -- use `ContinuousClock` for real time and `TestClock` (from the swift-clocks library) for controlled time in unit tests; `Task.sleep(for:clock:)` accepts a `Clock` parameter
- Test cancellation explicitly: create a `Task`, cancel it immediately, then `await` the task's value; assert that the expected `CancellationError` was thrown or that the task exited at the correct checkpoint

### 8. Optimize for Performance

Swift concurrency is not automatically faster than GCD. Apply these benchmarks and decisions deliberately.

- The Swift concurrency runtime uses a cooperative thread pool sized to the number of CPU cores; creating thousands of tasks is safe (unlike threads), but each task has overhead (~heap allocation for the task object); batch small units of work into fewer, larger tasks
- `actor` method dispatch has measurable overhead (~50--100ns per hop in benchmarks) compared to a direct function call; for hot paths that call actor methods in tight loops, expose a `nonisolated` function that takes a snapshot of actor state, does the computation, and writes back once
- Avoid `MainActor` as a catchall for synchronization -- it is a single serial executor; pushing work there unnecessarily starves the UI rendering loop; keep `@MainActor` to view-state updates only
- Profile with Instruments' "Swift Concurrency" template (Xcode 14+) -- it shows task creation, suspension counts, actor contention, and thread pool utilization; look for actors with high "enqueued" counts as indicators of bottlenecks
- Prefer value types (`struct`, `enum`) for data passed across task boundaries -- they require no reference counting, are implicitly `Sendable` when their stored properties are `Sendable`, and have zero synchronization overhead

---

## Output Format

When responding to a user question about Swift concurrency patterns, structure output as follows:

```
## Swift Concurrency Analysis

### Problem Classification
- Category: [parallelism | shared state | streaming | bridging | lifecycle]
- Execution context: [main actor | custom actor | unstructured | structured]
- Swift/iOS minimum version required: [e.g., iOS 15 / Swift 5.7]

### Concurrency Primitive Decision

| Requirement | Primitive | Rationale |
|---|---|---|
| [requirement 1] | [async let / TaskGroup / actor / AsyncStream / continuation] | [specific reason] |
| [requirement 2] | [primitive] | [reason] |

### Recommended Pattern
[Name of pattern and one-line summary]

### Implementation

```swift
// Full, compilable Swift code with:
// - Correct actor isolation annotations
// - Explicit Sendable conformances where needed
// - Cancellation checkpoints
// - Error handling (throws / CancellationError)
// - No TODO placeholders -- every function is implemented
```

### Cancellation Strategy
[How and where cancellation is checked or propagated]

### Testing Approach
[Specific XCTest or Swift Testing framework techniques for validating this pattern]

### Performance Considerations
[Specific latency, throughput, or memory trade-offs for this pattern in this context]

### Migration Notes (if applicable)
[How to incrementally replace existing GCD/Combine/callback code with this pattern]
```

---

## Rules

1. **NEVER call `resume` on a continuation more than once** -- double-resuming a `CheckedContinuation` crashes the app in debug builds and causes undefined behavior in release builds; wrap the callback so only the first invocation calls resume, using a flag or by nulling out the continuation reference after use.

2. **NEVER block the cooperative thread pool** -- calling synchronous, blocking APIs (like `semaphore.wait()`, `Thread.sleep()`, or synchronous file I/O) inside an async function starves the thread pool because Swift concurrency cannot reclaim the thread; use `await Task.sleep(for:)` for delays and async file APIs for I/O.

3. **NEVER use `Task.detached` as the default way to create tasks** -- detached tasks inherit no actor context, no task-local values, and no priority from their creating context; use an unstructured `Task {}` (which inherits context) unless you explicitly need isolation from the parent.

4. **ALWAYS re-validate actor state after any `await` suspension point** -- actor re-entrancy means another caller may have mutated state between when you suspended and when you resumed; do not assume that a value read before `await` is still valid after `await`.

5. **NEVER annotate an entire class `@MainActor` to "fix" concurrency warnings** without understanding which methods actually require main-thread execution -- this serializes all work through the main actor, which degrades performance and blocks the UI thread on computation-heavy tasks.

6. **ALWAYS specify a `bufferingPolicy` when creating `AsyncStream`** -- the default `.unbounded` policy can cause unbounded memory growth if the producer is faster than the consumer; use `.bufferingNewest(1)` for live sensor data where only the latest value matters, or `.bufferingOldest(n)` for ordered queues.

7. **NEVER use `@unchecked Sendable` as a quick fix** -- this suppresses compiler checks without providing actual thread safety; use it only when you have manually verified thread safety through an external mechanism (e.g., a lock-protected class that has been audited), and always add a comment documenting the manual guarantee.

8. **ALWAYS cancel tasks stored as properties when their owner is deallocated** -- call `task?.cancel()` in `deinit` or `viewDidDisappear`; failing to do this causes tasks to outlive their owning objects, leading to crashes when the task accesses deallocated memory via a weak reference that has become nil.

9. **NEVER perform UI updates from outside `@MainActor`** -- even in Swift concurrency code, UIKit and SwiftUI mutations must happen on the main thread; always wrap view updates in `await MainActor.run {}` or mark the calling function `@MainActor`.

10. **ALWAYS prefer structured concurrency over unstructured tasks** when the tasks are logically children of the current operation -- structured concurrency (`async let`, `TaskGroup`) guarantees that child tasks are cancelled and awaited before the scope exits, preventing resource leaks; use `Task {}` only when the work is genuinely independent of the current task's lifecycle.

---

## Edge Cases

### Actors and Inheritance

Swift actors cannot be subclassed -- they are implicitly `final`. If you have existing class hierarchies that need actor-like isolation, you cannot simply change the base class to `actor`. Instead, extract the mutable state into a dedicated actor, inject it into each class via dependency injection, and have the classes delegate state mutations to the actor. Alternatively, use a protocol with `@MainActor` or a custom global actor annotation applied at the protocol level so all conforming types share the same isolation.

### Mixing Swift Concurrency with Objective-C Delegates

Many UIKit APIs use delegate callbacks (e.g., `UIImagePickerControllerDelegate`, `MKLocalSearchCompleter`). These callbacks often arrive on the main thread but are not annotated with `@MainActor` in the SDK because they predate Swift concurrency. Wrapping them in `AsyncStream` is correct, but you must ensure:
- The continuation's `yield` is called from within the correct actor context; add `MainActor.assumeIsolated {}` in iOS 17+ to satisfy the compiler without a full `await` hop
- The `AsyncStream` is finished on `imagePickerControllerDidCancel` or equivalent terminal delegate method; failure to finish the stream leaks the iterator
- The lifetime of the delegate object is tied to the stream's `onTermination` handler -- cancel the operation and set the delegate to nil when the stream terminates

### Priority Inversion

Swift concurrency has automatic priority escalation to address priority inversion, but it does not eliminate it entirely. If a low-priority background task holds a lock (e.g., inside a `nonisolated` method using `NSLock`) and a high-priority task is waiting on the same lock, the system cannot escalate priority for lock-based synchronization -- only actor contention benefits from priority escalation. In performance-sensitive code:
- Replace lock-based synchronization inside hot paths with actor-isolated state
- Use `Task(priority: .userInitiated)` explicitly for work that must complete before a visible UI update
- Profile with Instruments' "CPU Profiler" template looking for unexpectedly long "waiting for actor" intervals

### Recursive Actor Methods

Calling an actor-isolated method from within the same actor is allowed synchronously (no `await` needed from within the actor itself). However, calling `await self.someActorMethod()` from inside the same actor is legal but creates a suspension point, allowing re-entrancy. This pattern is subtle and dangerous:

```swift
actor Coordinator {
    var isProcessing = false

    func process() async {
        isProcessing = true
        await self.finalize()  // suspension point -- isProcessing can be read as true by another caller
        isProcessing = false
    }
}
```

Avoid awaiting self-referential actor calls. Extract shared logic into `nonisolated` helpers that take actor state as parameters, or restructure the code to avoid the suspension between dependent state reads and writes.

### Sendable Closures Capturing Non-Sendable Types

When passing a closure to `Task {}` or `TaskGroup.addTask {}`, the closure must be `@Sendable`. This means any captured values must be `Sendable`. Common non-`Sendable` types that get captured: `UIImage`, `UIColor`, `NSAttributedString`, `AVAudioPlayer`, and most `@objc` delegate objects. Solutions:
- Convert `UIImage` to `Data` (a `Sendable` value type) before crossing the task boundary; reconstruct the image on the other side
- Mark classes as `@unchecked Sendable` only after auditing thread safety
- Use `@MainActor`-isolated types to remove the need to send them across boundaries -- the compiler knows they stay on the main actor
- In Xcode 16+ with Swift 6 language mode, these errors are errors, not warnings; plan migration ahead of adopting Swift 6

### TaskGroup Child Task Failure Semantics

`withThrowingTaskGroup` has a subtle behavior: when any child task throws, the group immediately cancels all remaining child tasks and rethrows the error when the group body returns. If you are implementing a "download all, ignore individual failures" pattern:

```swift
// WRONG: first failure cancels the whole group
try await withThrowingTaskGroup(of: Data.self) { group in
    for url in urls { group.addTask { try await fetch(url) } }
    for try await data in group { results.append(data) }
}

// CORRECT: catch per-task errors inside the child task
await withTaskGroup(of: Result<Data, Error>.self) { group in
    for url in urls {
        group.addTask { do { return .success(try await fetch(url)) } catch { return .failure(error) } }
    }
    for await result in group { /* handle Result */ }
}
```

Always choose the group type and error-catching location deliberately based on whether partial failure should abort the entire operation.

### SwiftUI `.task` Modifier and State Updates

The `.task {}` modifier creates a task scoped to the view's lifetime, but the task body runs on the main actor when the view is `@MainActor`-isolated (which all SwiftUI views are). Updating `@State` or `@StateObject` from inside `.task {}` is safe because the task is already on the main actor. However:
- Avoid long synchronous work inside `.task {}` -- use `Task.yield()` to voluntarily suspend in CPU-heavy loops, allowing the main actor to process UI events
- When the view reappears (e.g., after a sheet dismiss), SwiftUI creates a new task and cancels the previous one; design the task body to be re-entrant and handle `CancellationError` by exiting cleanly without logging an error
- For paginated data loading triggered by scroll position, combine `.task(id:)` with the current page index as the `id` -- the task is automatically cancelled and restarted whenever the page changes

---

## Example

**Input:** "I'm building an iOS photo browsing app. When a user opens an album, I need to fetch metadata for up to 200 photos in parallel from a REST API, limit concurrency to avoid overwhelming the server, update a progress indicator, and support cancellation if the user navigates away. We're targeting iOS 16, Swift 5.9."

**Output:**

## Swift Concurrency Analysis

### Problem Classification
- Category: parallelism with rate limiting, UI state updates, lifecycle-bound cancellation
- Execution context: custom actor for download state, `@MainActor` for progress updates
- Swift/iOS minimum version required: iOS 16 / Swift 5.9

### Concurrency Primitive Decision

| Requirement | Primitive | Rationale |
|---|---|---|
| Fetch 200 photos in parallel | `withTaskGroup` | Dynamic count known at call time; enables streaming result processing |
| Limit concurrency to N parallel requests | Manual token semaphore via actor | `TaskGroup` has no built-in rate limiting; an actor-based token pool controls in-flight count |
| Update progress indicator | `@MainActor` isolated property + `AsyncStream` | Progress changes must reach the UI thread; stream decouples producer from UI |
| Cancel on view disappear | `.task {}` modifier on SwiftUI view, or `task.cancel()` in `viewDidDisappear` | Structured task cancellation propagates to all child tasks in the group |

### Recommended Pattern
**Rate-Limited Parallel Task Group with Actor Token Pool**

Fetch photos in parallel using `withThrowingTaskGroup`, control concurrency via an actor-based token pool that limits simultaneous in-flight requests, and stream progress back to the UI via `@MainActor` state updates.

### Implementation

```swift
import Foundation

// MARK: - Rate Limiter Actor

/// Limits the number of concurrent operations by issuing and reclaiming tokens.
/// Callers await `acquire()` until a token is available, then call `release()` when done.
actor RateLimiter {
    private let maxConcurrent: Int
    private var available: Int

    init(maxConcurrent: Int) {
        self.maxConcurrent = maxConcurrent
        self.available = maxConcurrent
    }

    func acquire() async {
        // Re-validate after each suspension -- another caller may have taken a token
        while available == 0 {
            await Task.yield()
        }
        available -= 1
    }

    func release() {
        available = min(available + 1, maxConcurrent)
    }
}

// MARK: - Photo Metadata Model

struct PhotoMetadata: Sendable {
    let id: String
    let title: String
    let thumbnailURL: URL
    let dateTaken: Date
}

// MARK: - Photo Fetcher

@MainActor
final class AlbumViewModel: ObservableObject {
    @Published var photos: [PhotoMetadata] = []
    @Published var progress: Double = 0.0
    @Published var error: Error?
    @Published var isLoading = false

    private var fetchTask: Task<Void, Never>?

    func loadAlbum(photoIDs: [String]) {
        // Cancel any in-flight fetch before starting a new one
        fetchTask?.cancel()

        fetchTask = Task {
            isLoading = true
            progress = 0.0
            photos = []
            error = nil

            do {
                let fetched = try await fetchAllPhotos(photoIDs: photoIDs)
                photos = fetched
            } catch is CancellationError {
                // User navigated away -- exit silently, no error state
            } catch {
                self.error = error
            }

            isLoading = false
        }
    }

    func cancelLoad() {
        fetchTask?.cancel()
        fetchTask = nil
    }

    // MARK: - Private Fetch Logic

    /// Fetches metadata for all photo IDs in parallel, rate-limited to 10 concurrent requests.
    /// Streams results back to update progress as each photo completes.
    private func fetchAllPhotos(photoIDs: [String]) async throws -> [PhotoMetadata] {
        let rateLimiter = RateLimiter(maxConcurrent: 10)
        let total = Double(photoIDs.count)
        var completed = 0
        var results: [PhotoMetadata] = []
        results.reserveCapacity(photoIDs.count)

        try await withThrowingTaskGroup(of: PhotoMetadata.self) { group in
            for id in photoIDs {
                // Check cancellation before adding each child task
                // This prevents adding 200 tasks to a cancelled group
                try Task.checkCancellation()

                group.addTask {
                    // Acquire a rate-limit token; suspends if 10 tasks are already in flight
                    await rateLimiter.acquire()
                    defer { Task { await rateLimiter.release() } }

                    // Each child task independently checks cancellation
                    try Task.checkCancellation()
                    return try await PhotoAPI.fetchMetadata(id: id)
                }
            }

            // Collect results as they complete (order is non-deterministic)
            for try await metadata in group {
                results.append(metadata)
                completed += 1

                // Update progress on the main actor (we are already @MainActor here
                // because fetchAllPhotos is called from a @MainActor context)
                progress = Double(completed) / total
            }
        }

        // Sort by date after all fetches complete to produce stable ordering
        return results.sorted { $0.dateTaken < $1.dateTaken }
    }
}

// MARK: - API Layer (bridging async to URLSession)

enum PhotoAPI {
    static func fetchMetadata(id: String) async throws -> PhotoMetadata {
        let url = URL(string: "https://api.example.com/photos/\(id)/metadata")!
        var request = URLRequest(url: url)
        request.timeoutInterval = 10

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw PhotoAPIError.invalidResponse
        }

        return try JSONDecoder().decode(PhotoMetadata.self, from: data)
    }
}

enum PhotoAPIError: Error {
    case invalidResponse
}

// MARK: - SwiftUI View Integration

import SwiftUI

struct AlbumView: View {
    let photoIDs: [String]
    @StateObject private var viewModel = AlbumViewModel()

    var body: some View {
        ZStack {
            photoGrid
            if viewModel.isLoading {
                progressOverlay
            }
        }
        .task {
            // .task {} is automatically cancelled when the view disappears
            await viewModel.loadAlbum(photoIDs: photoIDs)
        }
        .onDisappear {
            viewModel.cancelLoad()
        }
    }

    private var photoGrid: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))]) {
                ForEach(viewModel.photos, id: \.id) { photo in
                    AsyncImage(url: photo.thumbnailURL)
                        .frame(width: 100, height: 100)
                }
            }
        }
    }

    private var progressOverlay: some View {
        VStack {
            ProgressView(value: viewModel.progress)
                .padding()
            Text("\(Int(viewModel.progress * 100))%")
                .monospacedDigit()
        }
        .background(.regularMaterial)
        .cornerRadius(12)
    }
}
```

### Cancellation Strategy

Cancellation propagates through the structured task hierarchy:
1. The SwiftUI `.task {}` modifier cancels the `loadAlbum` task when the view disappears
2. `AlbumViewModel.cancelLoad()` explicitly cancels `fetchTask` on `onDisappear` as a belt-and-suspenders guard
3. Inside `fetchAllPhotos`, `try Task.checkCancellation()` before each `addTask` prevents queuing new work after cancellation is requested
4. Each child task in the `TaskGroup` independently calls `checkCancellation` before the network request
5. `withThrowingTaskGroup` automatically cancels all running child tasks when any task throws -- including `CancellationError`
6. `CancellationError` is caught at the `loadAlbum` level and swallowed silently; the UI resets to empty state without showing an error message

### Testing Approach

```swift
@MainActor
final class AlbumViewModelTests: XCTestCase {

    func testLoadAlbumUpdatesProgress() async throws {
        let mockIDs = (0..<20).map { "photo-\($0)" }
        let viewModel = AlbumViewModel()

        // Inject a mock URLSession or PhotoAPI via protocol for testability
        await viewModel.loadAlbum(photoIDs: mockIDs)

        XCTAssertEqual(viewModel.photos.count, 20)
        XCTAssertEqual(viewModel.progress, 1.0, accuracy: 0.001)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testCancellationProducesNoError() async {
        let viewModel = AlbumViewModel()
        let bigList = (0..<200).map { "photo-\($0)" }

        // Start loading, then immediately cancel
        let task = Task { await viewModel.loadAlbum(photoIDs: bigList) }
        task.cancel()
        await task.value

        XCTAssertNil(viewModel.error, "Cancellation should not set error state")
    }

    func testRateLimiterNeverExceedsMaxConcurrent() async {
        let limiter = RateLimiter(maxConcurrent: 5)
        var peak = 0
        var current = 0
        let lock = NSLock()

        await withTaskGroup(of: Void.self) { group in
            for _ in 0..<50 {
                group.addTask {
                    await limiter.acquire()
                    lock.lock()
                    current += 1
                    peak = max(peak, current)
                    lock.unlock()
                    try? await Task.sleep(for: .milliseconds(10))
                    lock.lock()
                    current -= 1
                    lock.unlock()
                    await limiter.release()
                }
            }
        }

        XCTAssertLessThanOrEqual(peak, 5)
    }
}
```

### Performance Considerations

- **10 concurrent requests** is appropriate for most REST APIs on a mobile network; reduce to 5 for APIs with strict rate limits (check `Retry-After` headers); increase to 20 only for local network or CDN endpoints with sub-5ms response times
- The `RateLimiter` actor uses `Task.yield()` polling which has lower overhead than a semaphore but slightly higher than a condition variable; for high-frequency operations, consider an actor-based queue with `AsyncStream` as a token channel for O(1) wakeup
- `results.reserveCapacity(photoIDs.count)` prevents repeated array reallocations during the result collection loop -- at 200 items this saves approximately 7 reallocation cycles
- Sorting 200 items by date after fetch is O(n log n) and takes under 1ms; this is acceptable as a final step; avoid sorting inside the `for await` loop which would be O(n² log n) total
- The `@MainActor` progress update inside `fetchAllPhotos` executes approximately 200 main-actor hops; at ~50ns per hop this is ~10µs total overhead -- negligible, but if you needed to update every byte received, batch updates using a counter and yield to main only every 10 completions

### Migration Notes

If the existing codebase uses `DispatchGroup` + `DispatchSemaphore` for this pattern:

```swift
// BEFORE (GCD-based, common legacy pattern)
let group = DispatchGroup()
let semaphore = DispatchSemaphore(value: 10)
let queue = DispatchQueue(label: "photo.fetch", attributes: .concurrent)
var results: [PhotoMetadata] = []
let lock = NSLock()

for id in photoIDs {
    group.enter()
    queue.async {
        semaphore.wait()
        PhotoAPI.legacyFetch(id: id) { metadata in
            lock.lock()
            results.append(metadata)
            lock.unlock()
            semaphore.signal()
            group.leave()
        }
    }
}
group.notify(queue: .main) { completion(results) }
```

Migrate incrementally:
1. First, wrap `PhotoAPI.legacyFetch` in `withCheckedThrowingContinuation` to get an async version
2. Replace `DispatchGroup` + result aggregation with `withThrowingTaskGroup` -- this is the highest-value change
3. Replace `DispatchSemaphore` with the `RateLimiter` actor
4. Replace `NSLock`-protected `results` array with direct result collection in the `for await` loop inside the group body
5. Finally, remove the `DispatchQueue` -- Swift concurrency manages the thread pool automatically

Each step is independently compilable and testable. Steps 1 and 2 provide the largest safety improvement; complete them first before addressing the remaining GCD infrastructure.
