---
name: kotlin-coroutines-patterns
description: |
  Guides expert-level kotlin coroutines patterns implementation: kotlin and mobile decision frameworks, production-ready patterns, and concrete templates for kotlin coroutines patterns workflows.
  Use when the user asks about kotlin coroutines patterns, kotlin coroutines patterns configuration, or kotlin best practices for kotlin projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "kotlin mobile backend optimization"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Kotlin Coroutines Patterns

## When to Use

**Use this skill when:**
- User asks how to structure coroutine scopes in an Android ViewModel, Activity, or Fragment, or in a Ktor/Spring Boot backend service
- User wants to implement structured concurrency -- managing parent/child coroutine relationships, cancellation propagation, and lifecycle binding
- User needs to choose between `launch`, `async`/`await`, `Flow`, `StateFlow`, `SharedFlow`, or `Channel` for a given concurrency problem
- User is experiencing coroutine-related bugs: race conditions, leaked coroutines, unhandled exceptions crashing the app, or `CancellationException` being swallowed
- User wants to migrate callback-based or RxJava code to idiomatic Kotlin coroutines
- User needs to implement production-grade patterns: retry logic, timeout handling, backpressure, fan-out, fan-in, or parallel decomposition
- User asks about testing coroutines with `runTest`, `TestCoroutineDispatcher`, or `Turbine`
- User wants to understand dispatcher selection -- `Dispatchers.IO`, `Dispatchers.Default`, `Dispatchers.Main`, or a custom dispatcher

**Do NOT use this skill when:**
- User needs guidance on Kotlin language fundamentals unrelated to concurrency -- check the kotlin-fundamentals skill
- User is asking about Java `CompletableFuture` or `ExecutorService` patterns without a Kotlin migration goal -- check the java-concurrency skill
- User needs RxJava-specific operators or architecture without any coroutines migration intent -- check the rx-reactive-patterns skill
- User is asking about Go goroutines or Rust async/await -- check the respective language-specific concurrency skills
- User needs Kotlin Multiplatform (KMP) architecture decisions beyond coroutines threading -- check the kmp-architecture skill
- User is asking about actor-model concurrency (Akka, Erlang) as a primary concern -- check the actor-model-concurrency skill

---

## Process

### 1. Identify the Concurrency Problem Class

Before recommending any pattern, classify the user's problem into one of five categories:

- **Single async operation:** One-shot work that must complete before proceeding (network call, DB query). Solution space: `suspend fun` + `async`/`await` or plain `launch`.
- **Data stream:** An ongoing sequence of values over time (UI state, sensor data, paginated results, WebSocket messages). Solution space: `Flow`, `StateFlow`, `SharedFlow`.
- **Parallel decomposition:** Multiple independent tasks whose results must be combined. Solution space: `async`/`await` with `coroutineScope` or `supervisorScope`.
- **Background fire-and-forget:** Work that must survive a UI event but doesn't need a result (analytics, cache write). Solution space: scoped `launch` with proper scope selection.
- **Producer/consumer pipeline:** One or more producers feeding consumers with buffering requirements. Solution space: `Channel`, `produce`, or `SharedFlow` with replay.

Ask the user which category applies if it is not obvious from context. Getting this wrong leads to recommending `Flow` for one-shot work or `async`/`await` for streams.

### 2. Determine Scope and Lifecycle Binding

Scope is the most critical decision in structured concurrency. Incorrect scope is the leading cause of coroutine leaks and lifecycle crashes.

- **Android ViewModel:** Use `viewModelScope`. It is bound to the ViewModel lifecycle via `Dispatchers.Main.immediate` and cancels when `onCleared()` is called. Never use `GlobalScope` in a ViewModel.
- **Android UI layer (Fragment/Activity):** Use `lifecycleScope` for work tied to the view lifecycle. Use `lifecycleScope.launchWhenStarted` for work that should pause when the UI is not visible -- but prefer `repeatOnLifecycle(Lifecycle.State.STARTED)` in modern code because `launchWhenStarted` does not cancel the coroutine, it only suspends it.
- **Backend/service layer:** Create an explicit `CoroutineScope(SupervisorJob() + Dispatchers.Default)` and store it as a class member. Cancel it explicitly in a `close()` or `shutdown()` method. Tie the scope to the service's lifecycle (Spring bean destruction, Ktor application stop event).
- **Repository/use-case layer:** Do NOT create scopes here. Accept the caller's scope through `coroutineScope {}` blocks or expose `suspend fun` and `Flow` -- let the caller decide the scope.
- **Testing:** Use `TestScope` from `kotlinx-coroutines-test`. Never hardcode `Dispatchers.Main` in production code -- inject it or use `Dispatchers.Main.immediate` with a test dispatcher installed via `Dispatchers.setMain`.

### 3. Select the Correct Dispatcher

Dispatcher selection affects throughput, latency, and thread pool exhaustion:

- **`Dispatchers.Main`:** UI thread on Android. Only use for direct UI mutations. Any blocking call here causes ANR at >5 seconds.
- **`Dispatchers.Main.immediate`:** Same as Main but skips dispatch if already on the main thread. Use in ViewModels to avoid unnecessary frame delays.
- **`Dispatchers.IO`:** Backed by a thread pool capped at `max(64, CPU cores)` threads. Designed for blocking I/O: file operations, JDBC queries, blocking network calls. Do NOT use for CPU work -- the pool is not sized for it.
- **`Dispatchers.Default`:** Backed by a pool sized to `CPU cores` (minimum 2). Designed for CPU-intensive work: JSON parsing, sorting, image processing, cryptography.
- **`Dispatchers.Unconfined`:** Runs in the caller's thread until the first suspension point, then continues in the resuming thread. Only appropriate in tests or very specific pipeline stages. Avoid in production application code.
- **Custom dispatcher via `newFixedThreadPoolContext` or `asCoroutineDispatcher()`:** Use for dedicated work (e.g., a single-threaded dispatcher for SQLite access to avoid lock contention). Size it intentionally and close it when done.

Rule of thumb: Switch dispatchers with `withContext` at the boundary of a suspend function, not inside the caller. This keeps the suspend function self-contained and testable.

### 4. Design Exception Handling

Unhandled coroutine exceptions are one of the most dangerous aspects of the library. There are two distinct exception propagation mechanisms:

- **`launch` (fire-and-forget):** Exceptions propagate upward to the parent scope immediately. A `CoroutineExceptionHandler` installed on the scope is the last resort. If no handler exists, the exception crashes the JVM (backend) or triggers an unhandled exception in Android.
- **`async`/`await` (deferred result):** Exceptions are stored in the `Deferred` and rethrown only when `.await()` is called. This means you must wrap `await()` calls in `try/catch` -- not the `async {}` block itself.
- **`supervisorScope` vs `coroutineScope`:** In a `coroutineScope`, any child failure cancels all siblings and the scope itself. In a `supervisorScope`, a child failure is isolated -- siblings continue. Use `supervisorScope` when parallel operations are independent (e.g., loading multiple API resources in parallel where one failure should not kill the rest).
- **`CancellationException`:** This is special. Never catch and swallow `CancellationException` without rethrowing it. Doing so prevents structured cancellation from working. The pattern is: `catch (e: Exception) { if (e is CancellationException) throw e; handleError(e) }`.
- **Install `CoroutineExceptionHandler` at the root scope** for logging unexpected failures, not for recovery. Recovery belongs in the coroutine body.

### 5. Implement Flow Correctly

`Flow` is the primary reactive primitive in Kotlin coroutines. Each variant has a specific use case:

- **Cold `Flow` (plain `flow {}` builder):** Executes the producer block on every collector. Use for: database queries, one-shot network streams, computed sequences. Each `collect` call triggers a fresh execution.
- **`StateFlow`:** A hot flow that holds a single current value. Replays the latest value to new collectors. Requires an initial value. Use for: UI state, observable properties in ViewModel. Replace `LiveData` with `StateFlow` in modern Android. The `MutableStateFlow` update must be atomic -- use `.update {}` instead of `value = value.copy(...)` to avoid race conditions.
- **`SharedFlow`:** A hot flow with configurable replay and buffering. Use for: one-time events (navigation, snackbars), pub/sub within a scope, fanout. Configure `replay` to 0 for events (prevents re-delivery on resubscription) and `extraBufferCapacity` to avoid suspending the emitter.
- **`Channel`:** A hot communication primitive with FIFO ordering. Use for: producer/consumer queues, actor-style message passing, work distribution. Channels can buffer (`BUFFERED`, `CONFLATED`, `RENDEZVOUS`, `UNLIMITED`) -- choose based on backpressure requirements.

**Flow operators to know deeply:**
- `map`, `filter`, `transform` -- standard transformations
- `flatMapLatest` -- cancel and restart inner flow on each upstream emission (search box debounce, live queries)
- `flatMapConcat` -- sequential inner flows (ordered operations)
- `flatMapMerge` -- concurrent inner flows with configurable concurrency (`concurrency` parameter, default `DEFAULT_CONCURRENCY = 16`)
- `combine` -- zip latest values from N flows whenever any emits
- `zip` -- pair values from two flows sequentially
- `buffer(capacity)` -- decouple producer and consumer speeds
- `conflate()` -- drop intermediate values, keep only latest (sensor readings, progress updates)
- `debounce(timeMillis)` -- wait for idle period (search input)
- `distinctUntilChanged()` -- suppress repeated identical values
- `retry(retries) { cause -> cause is IOException }` -- conditional retry with predicate
- `retryWhen { cause, attempt -> }` -- exponential backoff retry

### 6. Apply Production Patterns

Six patterns appear repeatedly in production Kotlin codebases:

**Pattern A -- Retry with Exponential Backoff:**
```kotlin
suspend fun <T> retryWithBackoff(
    maxAttempts: Int = 3,
    initialDelayMs: Long = 100,
    maxDelayMs: Long = 10_000,
    factor: Double = 2.0,
    block: suspend () -> T
): T {
    var currentDelay = initialDelayMs
    repeat(maxAttempts - 1) { attempt ->
        try { return block() } catch (e: Exception) {
            if (e is CancellationException) throw e
        }
        delay(currentDelay)
        currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelayMs)
    }
    return block() // last attempt, let exception propagate
}
```

**Pattern B -- Timeout with Fallback:**
```kotlin
val result = withTimeoutOrNull(5_000) {
    remoteApi.fetchData()
} ?: localCache.getStaleData()
```
Use `withTimeout` when you want the exception to propagate; use `withTimeoutOrNull` when a null fallback is acceptable.

**Pattern C -- Parallel Decomposition:**
```kotlin
suspend fun loadDashboard(): Dashboard = supervisorScope {
    val userDeferred = async { userRepository.getUser() }
    val feedDeferred = async { feedRepository.getFeed() }
    val notificationsDeferred = async(start = CoroutineStart.LAZY) {
        notificationsRepository.getCount()
    }
    notificationsDeferred.start()
    Dashboard(
        user = userDeferred.await(),
        feed = feedDeferred.await(),
        notificationCount = runCatching { notificationsDeferred.await() }.getOrDefault(0)
    )
}
```

**Pattern D -- Mutex for Shared Mutable State:**
```kotlin
private val mutex = Mutex()
private var sharedState: List<Item> = emptyList()

suspend fun addItem(item: Item) {
    mutex.withLock {
        sharedState = sharedState + item
    }
}
```
Prefer `Mutex` over `@Volatile` + CAS for complex state. Use `Mutex(locked = false)` -- never create a pre-locked mutex unless you understand the implications.

**Pattern E -- Flow-based Repository:**
```kotlin
fun getItems(): Flow<List<Item>> = flow {
    emit(localCache.getItems())         // immediate local data
    val remote = remoteApi.getItems()   // network call
    localCache.saveItems(remote)
    emit(localCache.getItems())         // updated local data
}.flowOn(Dispatchers.IO)
```
Always use `flowOn` rather than `withContext` inside a `flow {}` builder. `withContext` inside a flow builder can cause issues with flow context preservation.

**Pattern F -- Semaphore for Concurrency Limiting:**
```kotlin
val semaphore = Semaphore(permits = 10)
val results = items.map { item ->
    async {
        semaphore.withPermit {
            api.process(item)
        }
    }
}.awaitAll()
```
Use to prevent overwhelming downstream services. Set permits based on the target service's rate limit or your measured connection pool size.

### 7. Write Testable Coroutine Code

Testability requires deliberate design:

- Inject dispatchers rather than hardcoding them. Define a `CoroutineDispatchers` interface with properties for `main`, `io`, `default`, and a `TestCoroutineDispatchers` implementation that returns `UnconfinedTestDispatcher` or `StandardTestDispatcher` for each.
- Use `runTest` (from `kotlinx-coroutines-test 1.6+`) as the test coroutine builder. It automatically advances virtual time and fails if uncompleted coroutines exist at the end.
- Use `StandardTestDispatcher` when you need explicit control over coroutine execution ordering (`advanceUntilIdle()`, `advanceTimeBy()`). Use `UnconfinedTestDispatcher` when you want coroutines to execute eagerly without manual advancement.
- Test `Flow` emissions with the Turbine library: `flow.test { assertEquals(expected, awaitItem()) }`. This avoids manual channel plumbing.
- Test cancellation explicitly: launch a coroutine, cancel the job, assert that cleanup (finally blocks, cancellation-aware resources) ran correctly.
- Use `TestScope.backgroundScope` for coroutines that should run in the background and be automatically cancelled after the test.

### 8. Review and Validate the Implementation

Before considering the implementation complete:

- **Coroutine leak check:** Every `CoroutineScope` created explicitly must have a corresponding cancellation path. Trace the scope's lifetime against the owning object's lifecycle.
- **Exception handling audit:** Search for bare `catch (e: Exception)` blocks inside coroutines. Verify each one either rethrows `CancellationException` or is justified by a comment.
- **Dispatcher validation:** Confirm no blocking calls (`Thread.sleep`, JDBC without a coroutine-aware driver, synchronous file I/O) run on `Dispatchers.Default` or `Dispatchers.Main`.
- **Flow hot/cold audit:** Confirm every `SharedFlow` and `StateFlow` is being collected with a scoped `collect` call, not a raw `launchIn` without scope management.
- **Context preservation:** Verify `flowOn` is used for flows performing blocking work, and that the context is not manually overridden by callers without reason.

---

## Output Format

When responding to a user's coroutines question, structure the answer using this template:

```
## Kotlin Coroutines Pattern Recommendation

### Problem Classification
- Problem class: [Single async / Data stream / Parallel decomposition / Fire-and-forget / Producer-consumer]
- Scope: [ViewModel / lifecycleScope / Explicit service scope / Test scope]
- Dispatcher: [Main / IO / Default / Custom -- with justification]

### Pattern Decision Matrix

| Criterion              | Option 1            | Option 2            | Recommended |
|------------------------|---------------------|---------------------|-------------|
| Lifecycle binding      | [assessment]        | [assessment]        | [choice]    |
| Exception isolation    | [assessment]        | [assessment]        | [choice]    |
| Backpressure handling  | [assessment]        | [assessment]        | [choice]    |
| Testability            | [assessment]        | [assessment]        | [choice]    |
| Overhead               | [assessment]        | [assessment]        | [choice]    |

### Recommended Pattern: [Pattern Name]

**Rationale:** [2-3 sentences explaining why this specific pattern fits the stated problem]

### Implementation

```kotlin
// Complete, production-ready code sample with:
// - Correct scope selection
// - Dispatcher assignment
// - Exception handling
// - Cancellation safety
// - Inline comments explaining non-obvious choices
```

### Testing the Implementation

```kotlin
// Matching test using runTest and TestDispatchers
// Covering: happy path, error path, cancellation
```

### Trade-offs and Alternatives
- **If [condition changes]:** switch to [alternative] because [reason]
- **Watch out for:** [one specific pitfall in this implementation]

### Dependency Versions
- `kotlinx-coroutines-core`: [version]
- `kotlinx-coroutines-android` (if applicable): [version]
- `kotlinx-coroutines-test`: [version]
- `app.cash.turbine` (if Flow testing): [version]
```

---

## Rules

1. **NEVER recommend `GlobalScope` for application code.** `GlobalScope` bypasses structured concurrency -- coroutines launched in it live for the entire process lifetime and cannot be cancelled by lifecycle events. The only legitimate uses are top-level CLI tools and application-level shutdown hooks where the process lifetime is the intended scope.

2. **NEVER catch and suppress `CancellationException`.** This is the single most dangerous mistake in Kotlin coroutines. Catching `CancellationException` without rethrowing it breaks cancellation propagation, causing coroutines to run past their intended cancellation point, potentially holding resources indefinitely. Always rethrow it.

3. **ALWAYS use `supervisorScope` instead of `coroutineScope` when launching parallel independent operations** where one failure should not abort all others. Failing to do this causes one slow/failing API call to cancel sibling calls that were progressing normally.

4. **NEVER use `withContext(Dispatchers.IO)` inside a `flow {}` builder.** Use `flowOn(Dispatchers.IO)` instead. Using `withContext` inside a flow violates the flow context preservation contract and will throw an `IllegalStateException` at runtime in flows that are collected in a different context.

5. **ALWAYS size custom thread pools intentionally.** `newFixedThreadPoolContext(n, "name")` with n greater than 64 on `Dispatchers.IO` duplicates what the IO dispatcher already provides. Custom pools are for isolation (e.g., a single-threaded dispatcher for SQLite access) or precise sizing for a known workload -- not for bypassing the shared pools.

6. **NEVER create a `CoroutineScope` using only `Job()` for a service that manages parallel child operations.** Use `SupervisorJob()` as the root job so that one failed child does not cancel the entire service scope. Reserve plain `Job()` scopes only when you explicitly want failure propagation to cancel siblings.

7. **ALWAYS inject `CoroutineDispatcher` dependencies rather than referencing `Dispatchers.IO` or `Dispatchers.Default` directly in classes.** Direct references make unit testing impossible without using `Dispatchers.setMain` hacks. Injected dispatchers allow test code to substitute `UnconfinedTestDispatcher` cleanly.

8. **NEVER use `Channel(UNLIMITED)` in production without an upstream flow control mechanism.** An unbounded channel will accept emissions indefinitely, leading to out-of-memory conditions under sustained high-throughput load. Use `BUFFERED` (64-element default) and let the emitter suspend when full, or use `CONFLATED` if only the latest value matters.

9. **ALWAYS use `MutableStateFlow.update {}` instead of direct `value` assignment** when updating state based on the current value. Direct assignment (`flow.value = flow.value.copy(...)`) is a read-modify-write race condition -- two concurrent coroutines can both read the old value, compute updates, and the second write overwrites the first.

10. **NEVER use `delay()` in production retry logic without a jitter component** when multiple clients might retry simultaneously. Pure exponential backoff causes thundering herd problems -- all clients back off to the same delay intervals and hammer the server simultaneously. Add `Random.nextLong(0, currentDelay / 4)` jitter to spread retries.

---

## Edge Cases

### Coroutine Launched in Fragment but ViewModel Survives Configuration Change
If a Fragment uses `lifecycleScope.launch` for an operation that should survive screen rotation (network call, heavy computation), the coroutine will be cancelled and restarted on every rotation. The fix is to move the coroutine to `viewModelScope` and expose results through `StateFlow` or `LiveData`. The Fragment observes the state, not the operation. If the operation truly must run in the Fragment (e.g., UI animation), accept the restart and use a loading state to prevent duplicate side effects.

### `CancellationException` Wrapped in Another Exception
Third-party libraries sometimes catch exceptions and re-throw them wrapped in library-specific exceptions (e.g., `IOException` wrapping a `CancellationException` from a cancelled OkHttp call). When you catch `IOException` and check `cause is CancellationException`, rethrow the original `CancellationException`, not the wrapper. Failing to do this causes structured cancellation to silently fail.

```kotlin
catch (e: IOException) {
    val cause = e.cause
    if (cause is CancellationException) throw cause
    handleNetworkError(e)
}
```

### `StateFlow` Not Emitting in Tests
`StateFlow` does not emit the same value twice (`distinctUntilChanged` is baked in). Tests that set the same value twice and expect two emissions will fail silently. Additionally, `StateFlow` requires an active collector -- asserting `stateFlow.value` directly in a `runTest` block works, but testing emissions via `Turbine` requires the `collect` to be active before the emission. Use `backgroundScope.launch { stateFlow.collect { ... } }` in the test to ensure collection is running before the emission occurs.

### Blocking Calls Accidentally on `Dispatchers.Default`
CPU-bound dispatchers have thread pools sized to CPU core count (typically 4-16 threads on mobile/server). One blocking call on `Dispatchers.Default` occupies an entire thread, starving other coroutines. This manifests as unpredictable pauses in CPU-bound operations. Audit with a thread dump: if any `DefaultDispatcher-worker-N` threads are in `BLOCKED` state (not `WAITING`), there is a blocking call. Fix by wrapping the blocking call in `withContext(Dispatchers.IO)` or a dedicated dispatcher.

### `SharedFlow` Replay Buffer and Re-subscription
A `SharedFlow` with `replay = 1` replays the last emission to new subscribers. This is appropriate for state but wrong for events. If a navigation event (`SharedFlow<NavigationEvent>` with `replay = 1`) is used and the screen is destroyed/recreated, the new collector immediately receives the last navigation event and navigates again. For one-time events, use `replay = 0` and `extraBufferCapacity = 1` with `DROP_OLDEST` overflow strategy. Alternatively, use a sealed class with a "consumed" state tracked in `StateFlow`.

### Coroutine Scope Outliving Android Process Kill
When Android kills a process (low memory), all coroutines are terminated without executing `finally` blocks or cleanup code. This means in-progress database writes, file operations, or network requests may be interrupted mid-operation. For critical operations, use `WorkManager` (which survives process death via system scheduling) rather than a coroutine-based approach. For operations that can be interrupted, ensure idempotency -- the operation should be safe to restart from the beginning on the next launch.

### `runBlocking` in Android Main Thread
`runBlocking` blocks the calling thread entirely. Calling `runBlocking` on the Android main thread will cause an ANR if the block takes more than 5 seconds (or even less under system pressure). The only acceptable use of `runBlocking` in Android is in unit tests and in `main()` functions of standalone Kotlin programs. For bridging synchronous APIs that need coroutine results, use callbacks, `lifecycleScope.launch`, or restructure the API to be `suspend` instead.

### `flatMapMerge` Concurrency Exhaustion
`flatMapMerge` defaults to `DEFAULT_CONCURRENCY = 16` concurrent inner flows. If each inner flow makes a network request and downstream has slow response times, 16 simultaneous requests can overwhelm connection pools (typically sized 5-10 for mobile, 50-200 for servers) or hit API rate limits. Always set the `concurrency` parameter explicitly: `flatMapMerge(concurrency = 4) { item -> fetchItem(item) }`. Choose concurrency based on the downstream service's measured capacity, not the default.

---

## Example

**Input:** "I'm building an Android app with a search screen. As the user types, I need to query a REST API and display results. The query should debounce by 300ms, cancel the previous in-flight request when a new query arrives, show a loading state, handle network errors gracefully with a retry option, and the whole thing needs to be testable. What's the right coroutines pattern?"

**Output:**

## Kotlin Coroutines Pattern Recommendation

### Problem Classification
- Problem class: Data stream (continuous UI input driving async queries)
- Scope: `viewModelScope` -- the search operation must survive orientation changes but must not outlive the ViewModel
- Dispatcher: `Dispatchers.IO` for network calls (injected for testability); `Dispatchers.Main.immediate` for UI state updates (handled automatically by `StateFlow`)

### Pattern Decision Matrix

| Criterion             | `launch` in `onTextChanged`      | `callbackFlow` in View     | `StateFlow` + `flatMapLatest` (Recommended) |
|-----------------------|----------------------------------|----------------------------|---------------------------------------------|
| Cancels in-flight req | No -- must track manually        | No -- same problem         | Yes -- `flatMapLatest` cancels automatically |
| Debounce support      | Requires manual `Job` tracking   | Possible but complex       | `debounce` operator, one line               |
| ViewModel lifecycle   | Leaks unless tracked carefully   | Tied to View lifecycle     | Survives rotation via `viewModelScope`       |
| Testability           | Poor -- ViewModel tightly coupled| Poor -- View-coupled        | Excellent -- inject dispatcher + TestFlow    |
| Loading state         | Manual flag management           | Manual                     | `map` to sealed UiState in pipeline         |

### Recommended Pattern: `StateFlow` search query + `flatMapLatest` for cancellation + `debounce` for rate limiting

**Rationale:** The user's typing generates a stream of query strings -- this is fundamentally a `Flow` problem. `flatMapLatest` is the exact operator designed to cancel an in-progress inner flow and start a new one when upstream emits, which maps directly to "cancel the previous request when a new query arrives." Hosting the query state in a `MutableStateFlow` in the ViewModel decouples the Fragment from the coroutine lifecycle and makes the state trivially observable and testable.

### Implementation

```kotlin
// SearchUiState.kt
sealed class SearchUiState {
    object Idle : SearchUiState()
    object Loading : SearchUiState()
    data class Success(val results: List<SearchResult>) : SearchUiState()
    data class Error(val message: String, val retryable: Boolean = true) : SearchUiState()
}

// SearchViewModel.kt
class SearchViewModel(
    private val searchRepository: SearchRepository,
    private val dispatchers: CoroutineDispatchers // injected interface
) : ViewModel() {

    // The query input -- Fragment pushes new values here via onQueryChanged()
    private val _query = MutableStateFlow("")

    // Exposed UI state -- Fragment collects this
    val uiState: StateFlow<SearchUiState> = _query
        .debounce(300) // wait for 300ms of typing inactivity
        .filter { it.length >= 2 } // skip very short queries
        .distinctUntilChanged() // don't re-query if the same term re-appears
        .flatMapLatest { query ->
            // flatMapLatest cancels the previous flow block when a new query arrives.
            // This means an in-progress Retrofit call is cancelled via coroutine
            // cancellation -- the OkHttp call is aborted if the Retrofit adapter
            // is coroutine-aware (it is, as of retrofit2-kotlin-coroutines-adapter
            // or Retrofit 2.6.0+ with suspend functions).
            flow {
                emit(SearchUiState.Loading)
                try {
                    val results = withContext(dispatchers.io) {
                        searchRepository.search(query)
                    }
                    emit(SearchUiState.Success(results))
                } catch (e: Exception) {
                    if (e is CancellationException) throw e // always rethrow
                    val message = when (e) {
                        is IOException -> "Network error. Check your connection."
                        is HttpException -> "Server error (${e.code()}). Try again."
                        else -> "Unexpected error."
                    }
                    emit(SearchUiState.Error(message))
                }
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(stopTimeoutMillis = 5_000),
            // 5-second timeout means if the Fragment detaches briefly (rotation),
            // the flow stays active and avoids re-fetching. After 5s (real background),
            // it stops and restarts on next subscription.
            initialValue = SearchUiState.Idle
        )

    fun onQueryChanged(query: String) {
        // Update triggers the flatMapLatest pipeline
        _query.value = query
    }

    fun onRetry() {
        // Force re-emission of the current query by updating to same value
        // wouldn't work due to distinctUntilChanged, so nudge with a copy
        val current = _query.value
        _query.value = "" // reset to bypass distinctUntilChanged
        _query.value = current
    }
}

// SearchFragment.kt (collection side)
viewLifecycleOwner.lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        // repeatOnLifecycle cancels collection when fragment goes to STOPPED
        // and restarts when it returns to STARTED -- preventing background work
        viewModel.uiState.collect { state ->
            when (state) {
                is SearchUiState.Idle -> showEmptyState()
                is SearchUiState.Loading -> showLoadingSpinner()
                is SearchUiState.Success -> showResults(state.results)
                is SearchUiState.Error -> showError(state.message, state.retryable)
            }
        }
    }
}

searchView.setOnQueryTextListener { query ->
    viewModel.onQueryChanged(query)
}
retryButton.setOnClickListener {
    viewModel.onRetry()
}
```

### Testing the Implementation

```kotlin
// SearchViewModelTest.kt
class SearchViewModelTest {

    // Install a test dispatcher as Main before each test
    private val testDispatcher = StandardTestDispatcher()

    @BeforeEach
    fun setup() {
        Dispatchers.setMain(testDispatcher)
    }

    @AfterEach
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `query emits loading then success`() = runTest {
        val fakeResults = listOf(SearchResult("Kotlin"), SearchResult("Coroutines"))
        val fakeRepo = FakeSearchRepository(results = fakeResults)
        val viewModel = SearchViewModel(
            searchRepository = fakeRepo,
            dispatchers = TestCoroutineDispatchers(testDispatcher)
        )

        val states = mutableListOf<SearchUiState>()
        val job = backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect { states.add(it) }
        }

        viewModel.onQueryChanged("kotlin")
        advanceTimeBy(301) // advance past 300ms debounce
        advanceUntilIdle()  // let all coroutines complete

        assertEquals(SearchUiState.Idle, states[0])
        assertEquals(SearchUiState.Loading, states[1])
        assertEquals(SearchUiState.Success(fakeResults), states[2])

        job.cancel()
    }

    @Test
    fun `rapid typing only triggers one network call`() = runTest {
        val fakeRepo = CountingSearchRepository()
        val viewModel = SearchViewModel(fakeRepo, TestCoroutineDispatchers(testDispatcher))

        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect { }
        }

        // Simulate rapid typing -- each within debounce window
        viewModel.onQueryChanged("k")
        advanceTimeBy(100)
        viewModel.onQueryChanged("ko")
        advanceTimeBy(100)
        viewModel.onQueryChanged("kot")
        advanceTimeBy(100)
        viewModel.onQueryChanged("kotl")
        advanceTimeBy(400) // now debounce fires for "kotl" only
        advanceUntilIdle()

        assertEquals(1, fakeRepo.searchCallCount)
        // Only one call despite four query changes
    }

    @Test
    fun `network error emits Error state`() = runTest {
        val fakeRepo = FailingSearchRepository(IOException("No network"))
        val viewModel = SearchViewModel(fakeRepo, TestCoroutineDispatchers(testDispatcher))

        val states = mutableListOf<SearchUiState>()
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect { states.add(it) }
        }

        viewModel.onQueryChanged("kotlin")
        advanceTimeBy(301)
        advanceUntilIdle()

        val errorState = states.last()
        assertIs<SearchUiState.Error>(errorState)
        assertEquals("Network error. Check your connection.", errorState.message)
        assertTrue(errorState.retryable)
    }
}
```

### Trade-offs and Alternatives

- **If the search must work offline with a local Room database:** Replace `searchRepository.search()` with a `Flow<List<SearchResult>>` from Room and use `flatMapLatest` to switch between database queries. Room flows are inherently cold and re-emit when the database changes, giving you real-time results. In this case, remove `withContext(dispatchers.io)` -- Room's `Flow` already handles dispatcher switching internally.
- **If results must be paginated:** Replace `StateFlow<SearchUiState>` with Jetpack Paging 3's `Pager` + `cachedIn(viewModelScope)`. The debounce and cancellation logic remains the same at the query input level, but the output becomes a `Flow<PagingData<SearchResult>>`.
- **Watch out for:** `SharingStarted.WhileSubscribed(5_000)` means if the user backgrounds the app for more than 5 seconds, the flow restarts on return. If the last query result is important to preserve, increase `stopTimeoutMillis` or use `SharingStarted.Lazily` -- but `Lazily` never stops the upstream flow once started, which may be wasteful.

### Dependency Versions
- `org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1`
- `org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1`
- `org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1`
- `app.cash.turbine:turbine:1.1.0` (for Flow emission testing with the `.test {}` DSL)
- `com.squareup.retrofit2:retrofit:2.11.0` (suspend function support built-in since 2.6.0)
