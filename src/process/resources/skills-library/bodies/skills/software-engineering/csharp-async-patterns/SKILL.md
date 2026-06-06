---
name: csharp-async-patterns
description: |
  Guides expert-level C# async programming: async/await pitfalls, ValueTask vs Task decision tree, CancellationToken patterns, IAsyncEnumerable, and ConfigureAwait considerations.
  Use when the user asks about C# async, await, ValueTask, Task, CancellationToken, IAsyncEnumerable, ConfigureAwait, async patterns.
  Do NOT use when the user asks about C# modern idioms (use `csharp-modern-idioms`), C# performance (use `csharp-performance`), C# ASP.NET (use `csharp-aspnet-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "csharp backend optimization"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# C# Async Patterns

## When to Use

**Use this skill when the user asks about:**
- `async`/`await` usage, pitfalls, or anti-patterns in C# (deadlocks, `.Result`/`.Wait()` blocking, fire-and-forget)
- `Task<T>` vs `ValueTask<T>` selection -- when to use each, allocation costs, misuse risks
- `CancellationToken` propagation, linked token sources, timeout patterns, cooperative cancellation design
- `IAsyncEnumerable<T>` and `await foreach` -- streaming data, backpressure, producer design
- `ConfigureAwait(false)` -- when it matters, when it is irrelevant, and why library authors must use it
- `SynchronizationContext` capture behavior and how it interacts with UI frameworks or ASP.NET Classic
- `TaskCompletionSource<T>` for bridging callback-based or event-based APIs to async
- Thread pool starvation in heavily async systems, async-over-sync anti-pattern
- `async void` contracts -- event handlers, fire-and-forget, exception surface
- Parallel async work patterns -- `Task.WhenAll`, `Task.WhenAny`, bounded parallelism with `SemaphoreSlim`

**Do NOT use this skill when:**
- The user asks about modern C# language idioms unrelated to async (records, pattern matching, file-scoped namespaces) -- use `csharp-modern-idioms`
- The user asks about CPU-bound parallel processing with `Parallel.For`, PLINQ, or `System.Threading.Channels` architecture -- use `csharp-performance`
- The user asks about ASP.NET Core middleware, Minimal API async endpoints, or Blazor async lifecycles in an architectural sense -- use `csharp-aspnet-patterns`
- The user is asking a pure .NET threading question about `Monitor`, `Mutex`, `ReaderWriterLockSlim`, or low-level `Interlocked` operations -- this is threading, not async
- The user is asking about Rx.NET (Reactive Extensions) observables and subscriptions -- that is a separate reactive programming paradigm

---

## Process

### Step 1 -- Classify the Async Problem

Identify which category the user's problem falls into before suggesting any code. Async problems in C# break into four families:

- **I/O-bound async** -- database queries, HTTP calls, file reads: use `async`/`await` with `Task<T>`. The thread is returned to the pool during the wait.
- **Streaming async data** -- reading large result sets, event streams, paginated APIs: use `IAsyncEnumerable<T>` and `await foreach`.
- **Parallelism over async work** -- fan-out HTTP calls, parallel database batches: use `Task.WhenAll` with bounded concurrency via `SemaphoreSlim` rather than raw parallelism.
- **Bridging legacy or callback APIs** -- `BeginXxx`/`EndXxx` APM, event-based EAP, P/Invoke callbacks: use `TaskCompletionSource<T>`.

Ask these diagnostic questions:
- Is this library code or application code? Library code must use `ConfigureAwait(false)` on every await.
- Does the operation complete synchronously in the common/hot path? If yes, consider `ValueTask<T>`.
- Is cancellation required? Yes unless this is a truly fire-and-forget operation (rare).
- Does the caller need results? If no, the return type is `Task` (not `void`), except for event handlers.

---

### Step 2 -- Apply the `Task<T>` vs `ValueTask<T>` Decision Tree

This is the single most misunderstood decision in C# async. Use the following criteria:

**Use `Task<T>` (the default) when:**
- The operation almost always genuinely awaits (completes asynchronously most of the time)
- The result will be awaited multiple times (multiple `await` on same task, `.Result` access after completion)
- The task will be stored in a field and awaited later
- You are writing a public API and cannot predict caller behavior
- The method has multiple `await` points (the allocation cost is amortized over the work)

**Use `ValueTask<T>` when ALL of these are true:**
- The operation completes synchronously in the hot/common path (e.g., a cache hit before an async cache miss)
- The result is awaited exactly once and immediately
- You have profiling evidence that `Task<T>` allocation is a measurable bottleneck (thousands of calls per second)
- The ValueTask is NOT stored, re-awaited, or converted to a Task without calling `.AsTask()`

**Hard rules about `ValueTask<T>` misuse:**
- Never `await` a `ValueTask<T>` more than once -- it is undefined behavior after the first await
- Never call `.Result` on a `ValueTask<T>` that is not yet complete
- Never store `ValueTask<T>` in a variable and use it after the producing method has been called again (especially from pooled `IValueTaskSource<T>`)
- The overhead reduction only matters above ~1M calls/second on hot paths -- measure before optimizing

---

### Step 3 -- Design CancellationToken Propagation

CancellationToken is not optional in production code. Every method that performs I/O or long-running work must accept a `CancellationToken`. Apply these rules:

**Parameter position:** Always the last parameter with default `default` for public APIs:
```csharp
public async Task<Order> GetOrderAsync(int orderId, CancellationToken cancellationToken = default)
```

**Propagation rules:**
- Pass the token to EVERY awaited async call downstream. Missing even one link breaks the cancellation chain.
- Pass the token to `HttpClient.SendAsync`, `DbCommand.ExecuteReaderAsync`, `Stream.ReadAsync`, `Task.Delay`, `SemaphoreSlim.WaitAsync` -- all accept it.
- If you use `Task.Run` for CPU-bound work, pass the token to `Task.Run` AND check it inside the lambda.

**Creating linked sources:**
- Use `CancellationTokenSource.CreateLinkedTokenSource(externalToken, internalToken)` when you need to impose a local timeout on top of an external cancellation:
```csharp
using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
cts.CancelAfter(TimeSpan.FromSeconds(30));
await DoWorkAsync(cts.Token);
```
- Always `Dispose` the `CancellationTokenSource` -- it holds unmanaged resources. Use `using` or `await using`.

**Handling cancellation in loops:**
```csharp
while (!cancellationToken.IsCancellationRequested)
{
    // work...
}
// OR prefer:
cancellationToken.ThrowIfCancellationRequested();
```
- Prefer `ThrowIfCancellationRequested()` for methods that should surface `OperationCanceledException`; use `IsCancellationRequested` only when you need to do cleanup before returning.

---

### Step 4 -- Apply ConfigureAwait Correctly

`ConfigureAwait(false)` tells the runtime not to capture the current `SynchronizationContext` or `TaskScheduler` when resuming after an await. This is one of the most commonly misapplied patterns.

**When `ConfigureAwait(false)` IS required:**
- In any library/NuGet package code -- you do not know what context the caller runs in, and failing to use it can deadlock in WinForms, WPF, or classic ASP.NET callers that block on `.Result` or `.Wait()`
- In any code that will run in a UI application's library layer but does not need to return to the UI thread after the await

**When `ConfigureAwait(false)` is NOT needed:**
- In ASP.NET Core application code -- ASP.NET Core has no `SynchronizationContext`, so `ConfigureAwait(false)` has no behavioral effect (though it is not harmful)
- In code that explicitly needs to resume on the UI thread (e.g., updating a WPF control after an awaited database call)
- In the outermost application entry points (top-level `await` in `Main`)

**The classic deadlock pattern to diagnose and explain:**
```csharp
// DEADLOCK in WinForms/WPF/classic ASP.NET:
public string GetData()
{
    return GetDataAsync().Result; // blocks the UI/request thread
}

private async Task<string> GetDataAsync()
{
    await Task.Delay(100); // tries to resume on captured SynchronizationContext
    return "data";         // but that context is blocked by .Result above
}

// FIX: ConfigureAwait(false) in the library method:
private async Task<string> GetDataAsync()
{
    await Task.Delay(100).ConfigureAwait(false);
    return "data"; // resumes on thread pool, no deadlock
}
```

---

### Step 5 -- Design IAsyncEnumerable Streaming

Use `IAsyncEnumerable<T>` when data is produced incrementally -- do not buffer everything into a `List<T>` before returning it.

**When to use `IAsyncEnumerable<T>`:**
- Database result sets with thousands of rows (use with EF Core's `ToAsyncEnumerable()` or Dapper with `QueryUnbufferedAsync`)
- Paginated API responses where each page requires a separate HTTP call
- Real-time event streams, log tailing, SSE (Server-Sent Events) bridging
- Any producer where results become available before all work is complete

**Implementation rules:**
```csharp
public async IAsyncEnumerable<Product> GetProductsAsync(
    [EnumeratorCancellation] CancellationToken cancellationToken = default)
{
    await foreach (var batch in FetchBatchesAsync(cancellationToken))
    {
        foreach (var item in batch)
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return item;
        }
    }
}
```
- Always use `[EnumeratorCancellation]` attribute on the `CancellationToken` parameter of an async iterator -- this allows `WithCancellation()` calls from the consumer to propagate correctly
- The `[EnumeratorCancellation]` attribute is on the parameter, not the method
- The compiler generates a state machine; `yield return` inside `async` methods with `IAsyncEnumerable<T>` return type is valid C# 8+

**Consumer pattern:**
```csharp
await foreach (var product in repo.GetProductsAsync()
    .WithCancellation(cancellationToken)
    .ConfigureAwait(false))
{
    await ProcessProductAsync(product, cancellationToken).ConfigureAwait(false);
}
```

---

### Step 6 -- Handle Parallel Async with Bounded Concurrency

`Task.WhenAll` with unbounded parallelism is a common mistake. When fanning out 10,000 tasks simultaneously, you exhaust connection pools, hit rate limits, and cause cascading failures.

**Safe fan-out pattern using `SemaphoreSlim`:**
```csharp
private static async Task<IEnumerable<Result>> ProcessInParallelAsync<T>(
    IEnumerable<T> items,
    Func<T, CancellationToken, Task<Result>> processor,
    int maxConcurrency,
    CancellationToken cancellationToken)
{
    using var semaphore = new SemaphoreSlim(maxConcurrency);
    var tasks = items.Select(async item =>
    {
        await semaphore.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            return await processor(item, cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            semaphore.Release();
        }
    });
    return await Task.WhenAll(tasks).ConfigureAwait(false);
}
```

**Concurrency limits by resource type:**
- HTTP calls to an external API: 4--16 concurrent (respect rate limits; default `HttpClient` connection limit is 10 per host)
- SQL database queries: equal to connection pool size / 2 (default pool max is 100, so ~50 concurrent is safe)
- File I/O: 1--4 (disk seeks dominate above this)
- CPU-bound work launched via `Task.Run`: `Environment.ProcessorCount` or `Environment.ProcessorCount - 1`

**`Task.WhenAny` for timeouts and racing:**
```csharp
var workTask = DoLongWorkAsync(cancellationToken);
var timeoutTask = Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
var completed = await Task.WhenAny(workTask, timeoutTask).ConfigureAwait(false);
if (completed == timeoutTask)
    throw new TimeoutException("Operation exceeded 5 second limit.");
return await workTask.ConfigureAwait(false);
```

---

### Step 7 -- Handle `async void` and Fire-and-Forget Safely

`async void` is a trap. Exceptions thrown inside `async void` methods crash the process (in most runtimes) because there is no `Task` for the caller to observe.

**Legitimate uses of `async void`:**
- Top-level event handlers in WinForms/WPF where the signature is mandated:
```csharp
private async void Button_Click(object sender, EventArgs e)
{
    try
    {
        await LoadDataAsync(_cts.Token);
    }
    catch (OperationCanceledException) { /* user cancelled, safe to ignore */ }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Load failed");
        ShowErrorDialog(ex.Message);
    }
}
```
- Always wrap in try/catch -- the event handler is the last line of defense

**Fire-and-forget with error handling (never use `async void` for this):**
```csharp
// BAD: exceptions are unobserved
_ = DoBackgroundWorkAsync(); // suppresses warning but exception is lost

// BETTER: use a safe fire-and-forget wrapper
public static void FireAndForget(
    this Task task,
    ILogger logger,
    CancellationToken cancellationToken = default)
{
    task.ContinueWith(
        t => logger.LogError(t.Exception, "Background task failed"),
        cancellationToken,
        TaskContinuationOptions.OnlyOnFaulted,
        TaskScheduler.Default);
}
// Usage:
DoBackgroundWorkAsync(cancellationToken).FireAndForget(logger, cancellationToken);
```

---

### Step 8 -- Diagnose Common Async Bugs

Guide the user to the root cause of async bugs using this checklist:

**Deadlock diagnosis:**
1. Is `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` called anywhere on the call stack? (blocking on async)
2. Is the code running in a context with a single-threaded `SynchronizationContext` (WinForms, WPF, classic ASP.NET)?
3. Does the awaited method lack `ConfigureAwait(false)`?
If all three are true: classic deadlock. Fix by adding `ConfigureAwait(false)` throughout the library chain, or by making the call stack fully async.

**Thread pool starvation diagnosis:**
1. Are there many synchronous `.Wait()` or `.Result` calls in hot paths?
2. Is thread pool usage consistently near `Environment.ProcessorCount * 2` active threads?
3. Are async operations queued but not starting for seconds?
Fix: make the entire call chain async. Never block thread pool threads.

**Unobserved exception diagnosis:**
1. Is a `Task` returned from an async method discarded with `_` or no assignment?
2. Is `async void` used outside event handlers?
3. Is `TaskScheduler.UnobservedTaskException` firing in logs?
Fix: always `await` tasks or use the fire-and-forget wrapper above. Subscribe to `TaskScheduler.UnobservedTaskException` as a last-resort global handler.

---

## Output Format

When answering a C# async question, structure your response as follows:

```
## Problem Classification
[I/O-bound async | Streaming | Parallel fan-out | Legacy bridge | Cancellation design]
Root cause identified: [specific issue, e.g., deadlock from missing ConfigureAwait, ValueTask misuse, unbounded parallelism]

## Recommendation

### Primary Pattern
[Task<T> / ValueTask<T> / IAsyncEnumerable<T> / TaskCompletionSource<T>]
Rationale: [1-2 sentences explaining why this fits]

### Implementation

\```csharp
// [Annotated, production-quality code example]
// Comments explain non-obvious choices
\```

### Decision Matrix (include when comparing two approaches)

| Criterion              | Task<T>      | ValueTask<T>  | Recommendation          |
|------------------------|--------------|---------------|-------------------------|
| Allocation cost        | 1 heap alloc | 0 on sync path| ValueTask if sync common |
| Multi-await safe       | Yes          | No            | Task if awaited >1 time  |
| Public API surface     | Preferred    | Advanced use  | Task for public APIs     |
| Hot path call rate     | Any          | >1M/sec       | ValueTask if measured    |

### Pitfalls to Avoid
- [Specific pitfall 1 with code showing what NOT to do]
- [Specific pitfall 2]

### Testing Guidance
- [How to test this async pattern -- fake delays, CancellationTokenSource, etc.]
```

---

## Rules

1. **Never recommend `.Result` or `.Wait()` as a solution** -- always guide the user to propagate `async` up the call stack. The only acceptable exception is in synchronous `Main` methods prior to C# 7.1, and even then, use `.GetAwaiter().GetResult()` which does not wrap exceptions in `AggregateException`.

2. **Never return `void` from async methods except in event handlers** -- `async void` silently swallows exceptions in most contexts. The return type must be `Task` (no result), `Task<T>` (with result), `ValueTask`, `ValueTask<T>`, or `IAsyncEnumerable<T>`.

3. **Always add `ConfigureAwait(false)` in library code** -- if the code being written is not a UI event handler or an ASP.NET Core controller action, every `await` must use `.ConfigureAwait(false)`. Set up a Roslyn analyzer (Microsoft.VisualStudio.Threading.Analyzers or Roslynator) to enforce this automatically.

4. **Never use `ValueTask<T>` in a public API without explicit documentation** -- callers must know they cannot `await` it more than once, store it, or call `.Result` before completion. The misuse surface is too large for undocumented public APIs.

5. **Always use `[EnumeratorCancellation]` on `CancellationToken` parameters in async iterators** -- without it, calling `.WithCancellation()` on the returned `IAsyncEnumerable<T>` has no effect and the token is silently ignored.

6. **Never create a `SemaphoreSlim` with an initial count of 0 as a concurrency limiter** -- use `new SemaphoreSlim(maxConcurrency, maxConcurrency)` with the same value for both initial count and max count. The first argument is the initial permits available, not the maximum.

7. **Always `Dispose` `CancellationTokenSource` instances** -- `CancellationTokenSource` registers callbacks and holds a `WaitHandle`. Failing to dispose it leaks memory, especially in loops that create thousands of linked token sources.

8. **Never `await` inside a `lock` statement** -- `await` inside `lock` is a compiler error, but developers sometimes work around it with `.Result` inside a lock (deadlock risk) or with `SemaphoreSlim(1,1)` incorrectly. The correct pattern for async mutual exclusion is `await semaphore.WaitAsync()` with a `try/finally` release.

9. **Always propagate `OperationCanceledException` up the stack when a `CancellationToken` fires** -- do not catch and swallow `OperationCanceledException` in intermediate methods unless you are the top-level handler or need to do cleanup before rethrowing. `catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)` is the safe pattern.

10. **Never use `Task.Run` as a substitute for proper async I/O** -- `Task.Run(() => File.ReadAllText(path))` moves the blocking call to a thread pool thread but still blocks that thread. Use `await File.ReadAllTextAsync(path)` instead. Reserve `Task.Run` for genuinely CPU-bound work (parsing, hashing, compression) that would otherwise block the calling thread.

---

## Edge Cases

### Legacy Codebase with Synchronous Interfaces

When a codebase has interfaces that return `string` or `IEnumerable<T>` and you cannot change the interface, do not add `async` to the implementing method and call `.GetAwaiter().GetResult()` inside it -- this recreates all the deadlock risk. Instead:
- Create a parallel `Async` interface (`IOrderRepositoryAsync`) and implement it alongside the synchronous version
- Migrate callers to the async interface incrementally
- If you absolutely must call async code from a synchronous context, use a dedicated thread: `Task.Run(() => GetDataAsync(token)).GetAwaiter().GetResult()` -- this prevents the deadlock because `Task.Run` runs on a thread pool thread without a `SynchronizationContext`. Still, document why this is unavoidable.

### EF Core and IAsyncEnumerable

EF Core's `ToAsyncEnumerable()` returns `IAsyncEnumerable<T>`, but the DbContext must remain open for the duration of the enumeration. If the DbContext is scoped (common in ASP.NET Core), and you yield items out to a higher layer that outlives the scope, you will get a `DbContext disposed` exception mid-stream.
- Do not return raw `IAsyncEnumerable<T>` from repositories that use scoped DbContexts across tier boundaries
- Either materialize the results within the repository scope, or ensure the consumer awaits the full enumeration within the same scope
- Use `await using var context = _factory.CreateDbContext()` pattern with `IDbContextFactory<T>` when you need the DbContext lifetime tied to the streaming operation

### HttpClient and CancellationToken

`HttpClient.SendAsync` with a `CancellationToken` will throw `OperationCanceledException` when the token is cancelled, but it also throws `OperationCanceledException` (not `TaskCanceledException`) when the `HttpClient.Timeout` is exceeded in older .NET versions. In .NET 5+, timeout throws `TaskCanceledException` with `InnerException` of `TimeoutException`. Always check the exception chain:
```csharp
catch (OperationCanceledException ex) when (cancellationToken.IsCancellationRequested)
{
    // Caller cancelled -- propagate
    throw;
}
catch (OperationCanceledException ex) when (ex.InnerException is TimeoutException)
{
    // HttpClient timeout -- convert to a meaningful exception
    throw new ServiceUnavailableException("Request timed out", ex);
}
```

### async/await in Constructors

C# constructors cannot be `async`. Developers sometimes call `.GetAwaiter().GetResult()` in a constructor, which introduces blocking. The correct patterns are:
- **Factory method pattern:** `public static async Task<MyService> CreateAsync(...)` that awaits initialization and returns the fully constructed instance
- **Lazy initialization:** Defer async initialization to the first use with a `Lazy<Task<T>>` or a private `_initialized` flag and an `EnsureInitializedAsync()` method called at the start of each public method
- **`IHostedService.StartAsync`:** In ASP.NET Core, async startup work belongs in `StartAsync`, not the constructor

### ValueTask Pooling via IValueTaskSource

Advanced libraries (like `System.IO.Pipelines` and `System.Net.Sockets`) pool `IValueTaskSource<T>` instances to achieve zero-allocation async paths. If you implement `IValueTaskSource<T>`:
- The source can only be in one of three states: pending, succeeded, faulted -- never recycle it back to the pool before the consumer has completed its await
- `GetResult()` must only be called once; calling it twice corrupts state
- Use `ManualResetValueTaskSourceCore<T>` (in `System.Threading.Tasks.Sources`) as the backing implementation -- do not implement the interface manually from scratch
- This level of optimization is only appropriate for hot-path server code handling millions of connections. For normal business logic, use `Task<T>`.

### Async Streams with Exceptions Mid-Sequence

When an `IAsyncEnumerable<T>` producer throws mid-sequence, the consumer's `await foreach` will surface the exception at the next `MoveNextAsync()` call. The producer's `finally` and `using` blocks ARE executed -- the compiler-generated state machine ensures cleanup on `DisposeAsync()`. However:
- If the consumer disposes the enumerator early (breaks out of `await foreach`), `DisposeAsync()` is called -- ensure the producer disposes its resources in `finally` blocks, not after the final `yield return`
- Never `yield return` inside a `try/catch` block that catches `Exception` broadly -- it prevents the compiler from generating correct state machine transitions and produces a compiler error in C# prior to C# 8.0 iterator semantics updates

### Thread Pool Starvation in Azure Functions / AWS Lambda

Serverless runtimes impose tight thread pool limits. A common failure mode: sync-over-async calls during cold starts stall the thread pool, causing subsequent requests to queue and timeout.
- In Azure Functions, enable `FUNCTIONS_WORKER_PROCESS_COUNT` and ensure the host is fully async
- Never use `.Result` or `.Wait()` in Azure Functions middleware or DI factory methods
- Monitor thread pool starvation with EventSource / `ThreadPool.GetAvailableThreads()` -- if available worker threads drop below `ProcessorCount * 2`, starvation is occurring

---

## Example

**Input:** "We have a C# service that calls a third-party payment API and we're seeing intermittent deadlocks and occasional lost exceptions. The service is a WPF desktop app with a synchronous call chain that eventually hits `GetPaymentStatusAsync().Result`. There are also background retry tasks being started but we never hear when they fail. How do we fix this?"

---

**Output:**

## Problem Classification
**I/O-bound async + deadlock from blocking + unobserved exceptions (fire-and-forget)**

Root causes identified:
1. `GetPaymentStatusAsync().Result` on a WPF UI thread blocks the SynchronizationContext, which deadlocks when the async method tries to resume on the same context
2. Background retry tasks are discarded (fire-and-forget without error observation), causing exceptions to be swallowed

---

## Recommendation

### Fix 1 -- Eliminate the Deadlock

The call chain must become fully async from the button click handler down to the HTTP call. There is no shortcut.

**Before (deadlocks):**
```csharp
// WPF ViewModel -- DEADLOCKS
public void RefreshStatus()
{
    var status = _paymentService.GetPaymentStatusAsync().Result; // blocks UI thread
    StatusText = status.Description;
}
```

**After (correct):**
```csharp
// WPF ViewModel -- correct async command pattern
public ICommand RefreshCommand => new AsyncRelayCommand(RefreshStatusAsync);

private async Task RefreshStatusAsync(CancellationToken cancellationToken = default)
{
    IsLoading = true;
    try
    {
        var status = await _paymentService.GetPaymentStatusAsync(cancellationToken);
        // After await, we ARE back on the UI thread (WPF SynchronizationContext captured)
        StatusText = status.Description;
    }
    catch (OperationCanceledException)
    {
        StatusText = "Cancelled.";
    }
    catch (PaymentApiException ex)
    {
        StatusText = $"Error: {ex.Message}";
        _logger.LogError(ex, "Payment status refresh failed");
    }
    finally
    {
        IsLoading = false;
    }
}
```

**In the payment service (library code -- must use ConfigureAwait(false)):**
```csharp
public class PaymentService : IPaymentService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(HttpClient httpClient, ILogger<PaymentService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<PaymentStatus> GetPaymentStatusAsync(
        CancellationToken cancellationToken = default)
    {
        // ConfigureAwait(false) here -- this is library code, not UI code
        // We do NOT need to return to the WPF SynchronizationContext after this await
        using var response = await _httpClient
            .GetAsync("/api/payments/status", cancellationToken)
            .ConfigureAwait(false);

        // HttpClient timeout vs caller cancellation -- differentiate them
        response.EnsureSuccessStatusCode();

        var json = await response.Content
            .ReadAsStringAsync(cancellationToken)
            .ConfigureAwait(false);

        return JsonSerializer.Deserialize<PaymentStatus>(json)
            ?? throw new PaymentApiException("Empty response from payment API");
    }
}
```

---

### Fix 2 -- Replace Fire-and-Forget with Observable Background Tasks

**Before (exceptions silently lost):**
```csharp
// Nobody awaits this -- if it throws, the exception disappears
_ = RetryPaymentAsync(paymentId);
```

**After (exceptions are logged, task is tracked):**
```csharp
// Extension method for safe fire-and-forget
public static class TaskExtensions
{
    public static void FireAndForget(
        this Task task,
        ILogger logger,
        string operationName,
        CancellationToken cancellationToken = default)
    {
        if (task == null) throw new ArgumentNullException(nameof(task));

        task.ContinueWith(
            completedTask =>
            {
                if (completedTask.IsFaulted)
                {
                    logger.LogError(
                        completedTask.Exception?.GetBaseException(),
                        "Background operation '{OperationName}' failed",
                        operationName);
                }
            },
            CancellationToken.None,             // continuation always runs
            TaskContinuationOptions.OnlyOnFaulted,
            TaskScheduler.Default);             // always thread pool, never UI context
    }
}

// Usage in the ViewModel or service:
private CancellationTokenSource _backgroundCts = new CancellationTokenSource();

private void ScheduleRetry(Guid paymentId)
{
    RetryPaymentAsync(paymentId, _backgroundCts.Token)
        .FireAndForget(_logger, $"RetryPayment:{paymentId}", _backgroundCts.Token);
}

// Clean up when the window closes
protected override void OnClosed(EventArgs e)
{
    _backgroundCts.Cancel();
    _backgroundCts.Dispose();
    base.OnClosed(e);
}
```

---

### Fix 3 -- Add CancellationToken with Timeout to the Retry Logic

**Retry with timeout and cancellation:**
```csharp
private async Task RetryPaymentAsync(
    Guid paymentId,
    CancellationToken cancellationToken)
{
    const int maxAttempts = 3;
    var delay = TimeSpan.FromSeconds(2);

    for (int attempt = 1; attempt <= maxAttempts; attempt++)
    {
        // Each individual attempt gets its own timeout, linked to the external token
        using var attemptCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        attemptCts.CancelAfter(TimeSpan.FromSeconds(10));

        try
        {
            await _paymentService
                .SubmitPaymentRetryAsync(paymentId, attemptCts.Token)
                .ConfigureAwait(false);
            _logger.LogInformation("Payment {PaymentId} retry succeeded on attempt {Attempt}",
                paymentId, attempt);
            return;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Caller (app shutdown) cancelled -- stop retrying, do not log as error
            _logger.LogInformation("Payment retry cancelled for {PaymentId}", paymentId);
            throw;
        }
        catch (OperationCanceledException ex) when (attemptCts.IsCancellationRequested)
        {
            // This specific attempt timed out -- log and retry if attempts remain
            _logger.LogWarning("Payment retry attempt {Attempt} timed out for {PaymentId}",
                attempt, paymentId);
        }
        catch (PaymentApiException ex) when (attempt < maxAttempts)
        {
            _logger.LogWarning(ex,
                "Payment retry attempt {Attempt} failed for {PaymentId}, retrying in {Delay}",
                attempt, paymentId, delay);
        }

        // Exponential backoff -- does not block the thread
        await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
        delay *= 2; // 2s, 4s, 8s
    }

    throw new PaymentRetryExhaustedException(
        $"All {maxAttempts} retry attempts failed for payment {paymentId}");
}
```

---

### Decision Matrix

| Concern | Old Approach | Fixed Approach | Why It Matters |
|---|---|---|---|
| UI thread blocking | `.Result` in ViewModel | `async Task` command pattern | Prevents SynchronizationContext deadlock |
| Library awaits | No ConfigureAwait | `ConfigureAwait(false)` on all awaits | Removes context capture; safe for any caller |
| Background exceptions | Discarded `_` task | `FireAndForget` with ContinueWith | All failures logged; no silent data loss |
| Per-request timeout | None | Linked CTS with `CancelAfter` | Prevents retry storms hanging indefinitely |
| Cancellation at shutdown | None | `CancellationTokenSource` on window close | Clean shutdown without lingering background work |

---

### Pitfalls Still to Avoid

```csharp
// DO NOT do this -- still deadlocks even with ConfigureAwait(false) added to service
// if there is any intermediate await that does NOT have ConfigureAwait(false)
var status = _paymentService.GetPaymentStatusAsync().GetAwaiter().GetResult();
// Every single await in the call chain must have ConfigureAwait(false) for this to be safe.
// One missing ConfigureAwait(false) can restore the deadlock.

// DO NOT do this -- ValueTask is not the right fit here
// GetPaymentStatusAsync always awaits the HTTP call (no synchronous hot path)
public async ValueTask<PaymentStatus> GetPaymentStatusAsync(...) // wrong type
// Use Task<T> -- the HTTP call always genuinely awaits

// DO NOT discard the CancellationTokenSource without disposing
var cts = CancellationTokenSource.CreateLinkedTokenSource(token); // no using -- LEAK
await DoWorkAsync(cts.Token);
// Fix: always wrap in using
```

---

### Testing Guidance

```csharp
[Fact]
public async Task GetPaymentStatusAsync_WhenCancelled_ThrowsOperationCancelledException()
{
    var cts = new CancellationTokenSource();
    var httpHandler = new Mock<HttpMessageHandler>();
    httpHandler.Protected()
        .Setup<Task<HttpResponseMessage>>("SendAsync",
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>())
        .Returns(async (HttpRequestMessage req, CancellationToken ct) =>
        {
            await Task.Delay(500, ct); // simulate slow response
            return new HttpResponseMessage(HttpStatusCode.OK);
        });

    var client = new HttpClient(httpHandler.Object) { BaseAddress = new Uri("https://api.example.com") };
    var service = new PaymentService(client, NullLogger<PaymentService>.Instance);

    cts.CancelAfter(50); // cancel before the 500ms response

    await Assert.ThrowsAsync<OperationCanceledException>(
        () => service.GetPaymentStatusAsync(cts.Token));
}

[Fact]
public async Task RetryPaymentAsync_LogsError_WhenAllAttemptsExhausted()
{
    // Use a real CancellationTokenSource with a generous timeout (test shouldn't hang)
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    var logger = new TestLogger<PaymentService>();
    // inject a mock service that always throws PaymentApiException
    // assert that logger received 3 Warning entries and 1 Error entry
    // assert that PaymentRetryExhaustedException is thrown
}
```
