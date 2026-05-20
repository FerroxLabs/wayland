---
name: python-async-patterns
description: |
  Guides expert-level Python async and concurrent programming: asyncio event loop, async/await patterns, threading vs multiprocessing decision tree, GIL implications, async context managers, and concurrent task management. Covers when to use each concurrency primitive.
  Use when the user asks about Python async programming, asyncio, threading vs multiprocessing, GIL behavior, async context managers, or concurrent Python execution.
  Do NOT use when the user asks about Python project setup (use `python-project-setup`), testing async code (use `python-testing-patterns`), or general performance optimization (use `python-performance`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "python backend optimization"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Python Async Patterns

## When to Use

**Use this skill when:**
- User asks about `async`/`await` syntax, coroutine behavior, or event loop mechanics in Python
- User wants to choose between asyncio, threading, and multiprocessing for a specific workload
- User asks about the GIL (Global Interpreter Lock) and its impact on concurrency primitives
- User wants to manage concurrent tasks including cancellation, timeouts, and structured concurrency
- User asks about async generators, async iterators, or async context managers
- User wants to integrate synchronous libraries into an async application without blocking the event loop
- User asks about structured concurrency with `TaskGroup`, `asyncio.gather`, or `asyncio.wait`
- User asks about backpressure, rate limiting, or semaphore-based concurrency control
- User wants to build a producer/consumer pipeline with async queues
- User asks about `asyncio.Event`, `asyncio.Condition`, `asyncio.Barrier`, or other synchronization primitives
- User is debugging event loop blocking, slow callbacks, or async performance degradation
- User is building a long-running service and needs graceful shutdown with signal handling

**Do NOT use this skill when:**
- User wants to set up a new Python project structure → use `python-project-setup`
- User is asking about testing async code with pytest-asyncio or unittest async support → use `python-testing-patterns`
- User wants general CPU or memory performance optimization → use `python-performance`
- User wants structured error handling strategies in async code beyond cancellation → use `python-error-handling`
- User is asking about language-agnostic concurrency theory (actor model, CSP) without a Python implementation question → use conceptual explanation only
- User asks about deploying async Python services (WSGI vs ASGI configuration) → use `python-deployment`
- User wants to profile which part of their async code is slow → use `python-performance`

---

## Process

### 1. Classify the Workload and Select the Concurrency Model

The single most important decision in Python concurrency is matching the workload type to the correct primitive. Getting this wrong produces code that is slower, more complex, and harder to debug than the synchronous alternative.

- **I/O-bound with async library support** (httpx, asyncpg, aiofiles, aiobotocore): use native `asyncio` with `async`/`await`. A single-threaded event loop can handle tens of thousands of concurrent connections because I/O suspension yields control without blocking the OS thread.
- **I/O-bound with sync-only libraries** (psycopg2, boto3, legacy SOAP clients): use `asyncio.to_thread()` (Python 3.9+) or `loop.run_in_executor(ThreadPoolExecutor(...))`. The GIL is released by CPython during C-level I/O operations, so threads genuinely run concurrently for these workloads.
- **CPU-bound tasks** (image processing, ML inference, data transformations, cryptography in pure Python): use `multiprocessing.ProcessPoolExecutor`. The GIL is per-process -- spawning processes gives true parallel CPU execution. For tasks under ~1ms of CPU time, the IPC overhead of process spawning (~1-5ms on Linux, ~10-50ms on Windows due to `spawn` start method) exceeds the benefit -- keep those on the main thread.
- **CPU-bound with NumPy/SciPy/PyTorch**: these libraries release the GIL during their C/Fortran inner loops, making `ThreadPoolExecutor` viable and cheaper than processes. Benchmark before assuming you need `ProcessPoolExecutor`.
- **Mixed I/O + CPU workloads**: use asyncio as the orchestration layer. Dispatch I/O-bound work as coroutines. Dispatch CPU-bound work via `loop.run_in_executor(process_pool, ...)`. Keep the event loop thread free of blocking work at all times.
- **Embarrassingly parallel batch jobs** without a running event loop: use `concurrent.futures.ProcessPoolExecutor` with `executor.map()` or `as_completed()` directly -- no asyncio needed.

Apply this decision matrix before writing any code:

| Workload Type | Library has async? | Recommended Model | GIL Impact |
|---|---|---|---|
| HTTP requests, DNS | Yes (httpx, aiohttp) | asyncio | None -- single thread |
| Database queries | Yes (asyncpg, aiomysql) | asyncio | None |
| Database queries | No (psycopg2, pymysql) | ThreadPoolExecutor | Released during C I/O |
| File I/O | Partial (aiofiles) | asyncio + aiofiles or to_thread | Minimal |
| CPU: pure Python | N/A | ProcessPoolExecutor | Bypassed (separate process) |
| CPU: NumPy/C extensions | N/A | ThreadPoolExecutor | Released in C layer |
| CLI batch processing | N/A | multiprocessing.Pool | Bypassed |
| Mixed I/O + CPU | Depends | asyncio + run_in_executor | Managed per task |

### 2. Design the Event Loop Architecture

Before writing any coroutines, define the event loop's lifecycle and what can touch it.

- **One event loop per process.** CPython's asyncio is not thread-safe by default. Never create a second event loop in a thread where one already runs. Never call `asyncio.run()` inside a running loop -- it raises `RuntimeError: This event loop is already running`.
- **Entry point pattern**: use `asyncio.run(main())` as the single entry point for the entire application. This creates a fresh event loop, runs the coroutine to completion, then closes the loop and cancels all remaining tasks. Do not call `loop.run_until_complete()` in production code unless you are managing the loop lifecycle manually (e.g., in a library).
- **For FastAPI/Starlette/aiohttp**: the framework owns the event loop. Never call `asyncio.run()` inside a route handler -- the loop is already running. Use `await` directly.
- **Thread-to-async bridge**: if legacy sync code must submit work to the async world, use `asyncio.run_coroutine_threadsafe(coro, loop)`. This is thread-safe and returns a `concurrent.futures.Future`. Call `.result(timeout=N)` to block the calling thread until completion.
- **Async-to-sync bridge**: if async code must call sync code that itself calls back into the event loop, you have a deadlock risk. Avoid this pattern entirely -- restructure so the boundary is one-directional.
- **Event loop policy**: on Linux with Python 3.12+, the default `SelectorEventLoop` works well. For higher-throughput scenarios, consider `uvloop` (a drop-in replacement built on libuv) which typically delivers 2-4x throughput improvement for network-heavy workloads. Set it with `asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())` before `asyncio.run()`.
- **Windows-specific**: the default `ProactorEventLoop` on Windows 3.8+ handles subprocesses correctly. `SelectorEventLoop` on Windows cannot create subprocesses. `uvloop` does not support Windows.

### 3. Write Correct Coroutines and Avoid the Blocking Trap

The most common asyncio bug is blocking the event loop with synchronous code. A blocked event loop cannot process any other coroutine, connection, or timeout for the entire duration of the blocking call.

- **The 1ms rule**: any operation that takes more than 1ms of wall-clock CPU time without yielding (i.e., without an `await`) will noticeably delay other tasks in the event loop. For latency-sensitive services, use 100 microseconds as your threshold.
- **Detecting blocking calls**: run the event loop with `asyncio.run(main(), debug=True)` during development. This enables the `slow_callback_duration` check (default 100ms) and logs warnings when a callback blocks longer than that threshold. You can also set `loop.slow_callback_duration = 0.05` to lower it to 50ms.
- **Safe I/O in coroutines**: only use libraries that are explicitly async-native (they `await` their I/O calls internally). The most common async library choices:
  - HTTP client: `httpx.AsyncClient` or `aiohttp.ClientSession`
  - PostgreSQL: `asyncpg` (fastest) or `databases` (SQLAlchemy-compatible)
  - Redis: `redis.asyncio.Redis` (formerly `aioredis`)
  - S3/AWS: `aiobotocore` or `boto3` wrapped in `to_thread`
  - File I/O: `aiofiles.open()` or `asyncio.to_thread(open, ...)`
- **`asyncio.to_thread(func, *args, **kwargs)`** (Python 3.9+): runs `func` in the default `ThreadPoolExecutor` managed by the event loop. The thread count defaults to `min(32, os.cpu_count() + 4)`. For production code with many concurrent `to_thread` calls, create an explicit `ThreadPoolExecutor` with a defined worker count to prevent thread exhaustion.
- **`loop.run_in_executor(executor, func, *args)`**: gives explicit control over which executor runs the blocking function. Pass `None` as the executor to use the loop's default thread pool. Pass a custom `ThreadPoolExecutor` or `ProcessPoolExecutor` instance for dedicated pools.
- **Do NOT use `time.sleep()` in async code.** Use `await asyncio.sleep(seconds)`. `time.sleep(1)` blocks the entire event loop for 1 second; `await asyncio.sleep(1)` suspends only the current coroutine and allows others to run.
- **`asyncio.sleep(0)`**: technically valid -- it yields control to the event loop for one iteration, allowing other ready coroutines to run. Use this when implementing a tight CPU loop in a coroutine that must remain cooperative (e.g., processing a large list in chunks). Do not scatter `sleep(0)` throughout code as a fix for blocking -- redesign the blocking operation instead.

### 4. Manage Concurrent Tasks with Structured Concurrency

Unstructured concurrency (fire-and-forget tasks, bare `create_task` calls) creates tasks that can fail silently, leak resources, or outlive their intended scope. Structured concurrency ensures tasks have defined lifetimes tied to a scope.

- **`asyncio.TaskGroup` (Python 3.11+)**: the preferred structured concurrency primitive. All tasks created inside the `async with` block are awaited before the block exits. If any task raises an exception, remaining tasks are cancelled, and all exceptions are re-raised as an `ExceptionGroup`. This prevents silent failures and resource leaks.

  ```python
  async with asyncio.TaskGroup() as tg:
      task_a = tg.create_task(fetch_pricing())
      task_b = tg.create_task(fetch_inventory())
  # Both tasks are done here; exceptions are propagated
  ```

- **`asyncio.gather(*coros, return_exceptions=False)`** (Python 3.4+): runs coroutines concurrently and returns results in input order. With `return_exceptions=False` (default), the first exception cancels nothing -- other coroutines continue running, but the exception propagates to the caller. With `return_exceptions=True`, all exceptions are returned as result values. For Python 3.10 and below, `gather` with `return_exceptions=True` plus manual error filtering is the standard pattern.

- **`asyncio.wait(tasks, return_when=...)`**: lower-level than `gather`. Returns two sets: `done` and `pending`. Use `return_when=asyncio.FIRST_EXCEPTION` to handle the first failure immediately. Use `return_when=asyncio.FIRST_COMPLETED` for speculative execution (launch multiple approaches, use the fastest result, cancel the rest). Use `return_when=asyncio.ALL_COMPLETED` when you want manual control over result extraction.

- **`asyncio.as_completed(coros)`**: yields futures in the order they complete, not the order they were submitted. Use this for streaming result processing where you want to handle each result as soon as it arrives (e.g., displaying search results as they come in).

- **Naming tasks**: always pass `name=` to `create_task()`. The name appears in repr output and debug logs, making task tracking vastly easier. Use descriptive names: `tg.create_task(fetch_user(user_id), name=f"fetch-user-{user_id}")`.

- **Task cancellation**: calling `task.cancel()` schedules a `CancelledError` to be thrown into the coroutine at its next `await` point. The coroutine can catch `CancelledError` for cleanup but must re-raise it (or let it propagate). Swallowing `CancelledError` without re-raising prevents the task from actually cancelling -- this is a common bug.

- **`asyncio.shield(coro)`**: protects a coroutine from being cancelled when the surrounding task is cancelled. Use for critical cleanup operations (e.g., flushing a buffer, committing a transaction) that must complete even if the parent task is being torn down.

### 5. Implement Async Resource Management and Generators

Async context managers and generators are the primary mechanism for managing resources (connections, locks, file handles) and streaming data in async code.

- **Async context manager protocol**: implement `__aenter__(self)` and `__aexit__(self, exc_type, exc_val, exc_tb)` as coroutines. Both must be `async def`. The `async with` statement awaits `__aenter__` on entry and `__aexit__` on exit (even if an exception occurs).

- **`@contextlib.asynccontextmanager`**: the simplest way to create a one-off async context manager. Write a generator function with a single `yield`. Code before `yield` is the `__aenter__` body; code after (in a `finally` block) is the `__aexit__` body. This pattern handles exception propagation correctly.

  ```python
  @contextlib.asynccontextmanager
  async def managed_connection(pool):
      conn = await pool.acquire()
      try:
          yield conn
      finally:
          await pool.release(conn)
  ```

- **Async generators** (`async def` with `yield`): produce values asynchronously. Consumed with `async for`. Each `yield` suspends the generator, allowing the event loop to run other tasks. Use for streaming database results, paginated API responses, or real-time data feeds.

- **`aclose()` on async generators**: if you exit an `async for` loop early (via `break` or exception), the async generator's cleanup code (`finally` blocks, `__aexit__` of nested context managers) does NOT run automatically unless you call `await gen.aclose()`. Python 3.10+ emits a `ResourceWarning` for this. To handle it correctly, wrap async generator consumption in a `try/finally` block that calls `aclose()`, or use `aclosing()` from `contextlib`.

- **`asyncio.timeout(delay)` (Python 3.11+)**: replaces the older `asyncio.wait_for()` for deadline management. More composable -- can be used inside a function without wrapping the entire coroutine. Raises `asyncio.TimeoutError` (which is now an alias of the builtin `TimeoutError` in Python 3.11+).

  ```python
  async with asyncio.timeout(5.0):
      result = await slow_operation()
  ```

- **`asyncio.wait_for(coro, timeout)` (Python 3.4+)**: the pre-3.11 way to add a timeout. Cancels the wrapped coroutine on timeout and raises `asyncio.TimeoutError`. Be aware: if the wrapped coroutine catches `CancelledError` and does not re-raise, `wait_for` will hang because it cannot actually cancel the task.

### 6. Implement Synchronization and Backpressure

Concurrent tasks that share resources or coordinate work need explicit synchronization. Unlike threading, asyncio synchronization primitives do NOT block the OS thread -- they suspend the coroutine and yield to the event loop.

- **`asyncio.Lock`**: mutual exclusion for a shared resource. Equivalent to `threading.Lock` but async. Always use `async with lock:` -- never acquire and release manually, as exceptions will leave the lock permanently acquired.

- **`asyncio.Semaphore(n)`**: limits concurrent access to `n` simultaneous holders. The primary tool for rate limiting and connection pool management. Example: `asyncio.Semaphore(100)` around HTTP calls limits concurrency to 100 simultaneous requests, preventing connection exhaustion or API rate-limit violations.

- **`asyncio.BoundedSemaphore(n)`**: like `Semaphore` but raises `ValueError` if `release()` is called more times than `acquire()`. Use when over-releasing would indicate a logic bug.

- **`asyncio.Queue(maxsize=0)`**: the standard producer/consumer primitive in async code. With `maxsize=0` (default), unbounded. With `maxsize=N`, `put()` blocks when the queue is full -- this implements backpressure automatically. Always pair with `task_done()` and `join()` when the producer needs to know all work is consumed.

- **`asyncio.Event`**: a one-time signal. One coroutine calls `event.set()`; any number of coroutines waiting on `await event.wait()` wake up. The event stays set until `event.clear()` is called. Use for "startup complete", "shutdown requested", or "data available" signals.

- **`asyncio.Condition`**: combines a lock with a notification mechanism. Use when a consumer needs to wait until data meets a specific condition, not just until any data is available. More granular than `Event`.

- **`asyncio.Barrier(parties)` (Python 3.11+)**: all `parties` tasks must call `await barrier.wait()` before any can proceed. Use for phased parallel computation where all workers must complete phase N before any worker starts phase N+1.

- **Fan-out/fan-in pattern**: create one `asyncio.Queue` as the work queue, spawn N worker coroutines that each pull from the queue, and a result queue or list for collecting outputs. Set `maxsize` on the work queue to bound memory usage.

### 7. Handle Cancellation, Shutdown, and Error Propagation

Production async applications must handle cancellation and shutdown correctly. Missing cancellation cleanup is the most common source of resource leaks in async code.

- **Cancellation contract**: when a task receives `CancelledError`, it must either re-raise it (after cleanup) or propagate it. Catching `CancelledError` in a bare `except Exception:` handler that doesn't re-raise is a subtle bug -- the task appears to run forever but never makes progress.

  ```python
  async def worker():
      try:
          await do_work()
      except asyncio.CancelledError:
          await cleanup()  # Run cleanup
          raise             # Always re-raise
  ```

- **Signal-based graceful shutdown**: for long-running services, register signal handlers with the event loop:

  ```python
  loop = asyncio.get_event_loop()
  loop.add_signal_handler(signal.SIGTERM, shutdown_event.set)
  ```

  In `main()`, `await shutdown_event.wait()`, then cancel all running tasks, `await asyncio.gather(*tasks, return_exceptions=True)` to let them clean up, then cancel the executor if one was created.

- **ExceptionGroup handling (Python 3.11+)**: `TaskGroup` raises `ExceptionGroup` (or `BaseExceptionGroup`) containing all exceptions from failed tasks. Use `except*` syntax to handle specific exception types from the group:

  ```python
  try:
      async with asyncio.TaskGroup() as tg:
          tg.create_task(operation_a())
          tg.create_task(operation_b())
  except* ValueError as eg:
      for exc in eg.exceptions:
          log.error("ValueError in task: %s", exc)
  except* httpx.HTTPError as eg:
      # Handle HTTP errors from any task
      pass
  ```

- **Task exception monitoring**: tasks created with `create_task()` that raise exceptions and are never awaited will log a warning "Task exception was never retrieved" but the exception is otherwise silently swallowed. Always either `await` the task, add a `.add_done_callback()`, or wrap the task body with an error handler.

- **Executor shutdown**: always call `executor.shutdown(wait=True)` during application teardown to ensure all threads/processes have finished before the process exits. With `asyncio.run()`, create the executor before `asyncio.run()` and shut it down after. Or use it as a context manager: `with ProcessPoolExecutor() as pool:`.

### 8. Diagnose and Tune Async Performance

Once the architecture is correct, specific tuning steps make the difference between adequate and excellent performance.

- **Event loop lag measurement**: use a background monitoring task that periodically measures the gap between a scheduled `asyncio.sleep(0.01)` and its actual wake time. A lag above 50ms indicates blocking callbacks that need to be moved to executors. Libraries like `prometheus_client` can expose this as a gauge metric.

- **ThreadPoolExecutor sizing**: the default pool size (`min(32, os.cpu_count() + 4)`) is appropriate for moderate I/O. For services with very high concurrency (1000+ concurrent `to_thread` calls), create an explicit `ThreadPoolExecutor(max_workers=N)` where N is tuned based on measured thread utilization. More threads is not always better -- OS context switching overhead increases beyond ~500 threads on most systems.

- **ProcessPoolExecutor sizing**: set `max_workers=os.cpu_count()` for CPU-bound work. Avoid `os.cpu_count() - 1` unless the main process itself does significant CPU work. On machines with hyperthreading, physical core count (cpu_count() // 2) sometimes performs better for pure compute due to cache pressure.

- **Connection pool sizing**: async HTTP clients and database drivers have connection pool settings that must match your concurrency level. For `asyncpg`, set `min_size=10, max_size=20` to match expected concurrent query count. For `httpx.AsyncClient`, set `limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)`. Mismatched pool sizes cause either connection exhaustion or wasteful idle connections.

- **`uvloop` for network-heavy services**: install with `pip install uvloop` and activate with `asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())`. Benchmarks show 2-4x throughput improvement for echo servers and similar network-bound workloads. Not available on Windows.

- **Avoid creating tasks in tight loops**: `asyncio.create_task()` has overhead (~5 microseconds per task). For high-frequency work (>10,000 tasks/second), batch work into larger tasks or use `asyncio.Queue` to decouple producers from workers rather than creating one task per item.

---

## Output Format

When providing async pattern guidance, produce one or more of the following components based on what the user needs:

### Concurrency Model Decision Summary

```
## Concurrency Model Selection

Workload: [describe the user's specific workload]

| Operation | Type | Recommended Primitive | Rationale |
|---|---|---|---|
| [specific operation] | I/O-bound | asyncio native | [async library available] |
| [specific operation] | I/O-bound, sync lib | asyncio.to_thread | [library name] lacks async |
| [specific operation] | CPU-bound | ProcessPoolExecutor | [why CPU, GIL bypass needed] |
| [specific operation] | CPU + C extensions | ThreadPoolExecutor | [GIL released in C layer] |

Orchestration: asyncio event loop with run_in_executor for non-async operations
Python version requirement: [3.9+ / 3.11+ based on primitives used]
```

### Implementation Code

```python
"""
Module: [module_name]
Concurrency model: [asyncio / threading / multiprocessing / hybrid]
Python version: [minimum version]
Key primitives: [list of asyncio/concurrent.futures classes used]
"""

import asyncio
import contextlib
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from dataclasses import dataclass
from typing import AsyncIterator


# --- Executor lifecycle (module-level, created once) ---
_process_pool: ProcessPoolExecutor | None = None
_thread_pool: ThreadPoolExecutor | None = None


async def main() -> None:
    """Entry point. Owns executor lifecycle and graceful shutdown."""
    global _process_pool, _thread_pool
    shutdown_event = asyncio.Event()

    # Register SIGTERM / SIGINT for graceful shutdown (Linux/macOS)
    import signal
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, shutdown_event.set)

    with ProcessPoolExecutor(max_workers=4) as _process_pool, \
         ThreadPoolExecutor(max_workers=16) as _thread_pool:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(run_service(), name="main-service")
            tg.create_task(shutdown_event.wait(), name="shutdown-watcher")


# --- Concurrent I/O pattern ---
@dataclass(frozen=True)
class [ResultType]:
    # fields matching the combined result


async def [fetch_all_sources]([params]) -> [ResultType]:
    """
    Fetch from multiple sources concurrently.

    Concurrency: asyncio TaskGroup (I/O-bound, all async libraries)
    Cancellation: TaskGroup cancels remaining fetches on first failure
    Timeout: each sub-request has an individual deadline
    """
    async with asyncio.TaskGroup() as tg:
        task_a = tg.create_task(
            [async_operation_a]([params]),
            name="fetch-[source-a]"
        )
        task_b = tg.create_task(
            [async_operation_b]([params]),
            name="fetch-[source-b]"
        )
    return [ResultType](
        field_a=task_a.result(),
        field_b=task_b.result(),
    )


# --- CPU-bound offload pattern ---
def [cpu_intensive_fn]([args]) -> [ReturnType]:
    """Pure function, no asyncio. Runs in process pool."""
    # CPU-bound computation


async def [process_data]([data]) -> [ReturnType]:
    """Offload CPU work to process pool without blocking event loop."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        _process_pool,
        [cpu_intensive_fn],
        [data],
    )


# --- Async generator / streaming pattern ---
async def [stream_results]([source]) -> AsyncIterator[[ItemType]]:
    """Yield items as they arrive. Caller uses `async for`."""
    async with [async_client] as client:
        async for item in client.[stream_method]([source]):
            yield [transform](item)


# --- Rate-limited fan-out pattern ---
async def [process_many]([items]: list, concurrency: int = 50) -> list:
    """Process items with bounded concurrency using Semaphore."""
    semaphore = asyncio.Semaphore(concurrency)

    async def [bounded_worker]([item]):
        async with semaphore:
            return await [process_one]([item])

    async with asyncio.TaskGroup() as tg:
        tasks = [
            tg.create_task([bounded_worker]([item]), name=f"work-{i}")
            for i, [item] in enumerate([items])
        ]
    return [task.result() for task in tasks]


# --- Async context manager ---
@contextlib.asynccontextmanager
async def [managed_resource]([config]) -> AsyncIterator[[ResourceType]]:
    """Acquire resource on entry, guarantee release on exit."""
    resource = await [acquire]([config])
    try:
        yield resource
    except Exception:
        await resource.[rollback_or_reset]()
        raise
    finally:
        await resource.[release]()
```

### Key Design Decisions Table

```
## Design Decisions

| Decision | Choice | Alternative Considered | Reason |
|---|---|---|---|
| Task coordination | TaskGroup | gather() | Exception propagation, automatic cancellation |
| Blocking I/O | to_thread / run_in_executor | Sync call | Would block event loop |
| Rate limiting | asyncio.Semaphore(N) | No limit | Prevents connection exhaustion |
| Timeout | asyncio.timeout() | wait_for() | More composable, Python 3.11+ |
| Executor scope | Module-level, reused | Per-call creation | Avoid thread/process spawn overhead |
```

---

## Rules

1. **Never block the event loop.** Any synchronous call that does I/O, sleeps, or computes for more than 1ms without awaiting must be moved to `asyncio.to_thread()` or `run_in_executor()`. This includes `requests.get()`, `time.sleep()`, `json.loads()` on very large payloads, and synchronous file operations. One blocking call stalls every other coroutine in the process.

2. **Never swallow `CancelledError`.** Catching `asyncio.CancelledError` (or its parent `BaseException`) without re-raising is a shutdown-blocking bug. The pattern is always: `except asyncio.CancelledError: await cleanup(); raise`. A bare `except Exception:` handler that wraps an entire coroutine body is the most common accidental form of this mistake.

3. **Never call `asyncio.run()` inside a running event loop.** It raises `RuntimeError`. Inside a running loop (FastAPI route, async test, Jupyter cell), use `await` directly. If you need to run a coroutine from synchronous code while a loop is running in another thread, use `asyncio.run_coroutine_threadsafe(coro, loop)`.

4. **Never create per-request executors.** `ProcessPoolExecutor()` and `ThreadPoolExecutor()` are expensive to construct (they spawn OS threads/processes). Create them once at application startup and reuse them. Treat them like connection pools -- they are shared resources with defined lifecycles.

5. **Always name tasks.** Pass `name=` to every `create_task()` call. Unnamed tasks produce uninformative debug logs and stack traces. Names like `"fetch-user-123"` or `"process-batch-7"` make production debugging 10x faster.

6. **Always use `async with` for locks, never manual acquire/release.** If an exception occurs between `lock.acquire()` and `lock.release()`, the lock is permanently held and all other waiters deadlock. The `async with lock:` pattern guarantees release via `__aexit__` regardless of exceptions.

7. **Size Semaphores explicitly for external services.** An unbounded `asyncio.TaskGroup` with 10,000 tasks all hitting the same database will exhaust the connection pool, trigger rate limits, or crash the remote service. Wrap external calls in `async with asyncio.Semaphore(N):` where N is calibrated to the target service's capacity -- typically 50-200 for HTTP APIs, 10-20 for database queries.

8. **Use `asyncio.Queue` for producer/consumer, not shared lists.** Sharing a list between producer and consumer coroutines without synchronization is a race condition even in async code -- a coroutine can be suspended between checking and modifying the list. `asyncio.Queue` is the correct primitive with built-in thread safety for single-event-loop code.

9. **Do not share `asyncio` primitives across threads.** `asyncio.Lock`, `asyncio.Queue`, `asyncio.Event`, and all other asyncio synchronization objects are not thread-safe. They assume single-threaded event loop execution. For cross-thread coordination, use `threading.Event` or `asyncio.run_coroutine_threadsafe` to push work to the event loop thread.

10. **Always `await gen.aclose()` when abandoning async generators early.** Breaking out of an `async for` loop before exhausting the generator leaves it suspended with open resources (file handles, connections, locks). Use `contextlib.aclosing(gen)` to guarantee cleanup:

    ```python
    from contextlib import aclosing
    async with aclosing(stream_results(source)) as stream:
        async for item in stream:
            if item.is_final:
                break  # aclosing() calls aclose() here
    ```

11. **Do not use `multiprocessing.Queue` with `ProcessPoolExecutor`.** `multiprocessing.Queue` is designed for `multiprocessing.Process` instances. `ProcessPoolExecutor` uses its own internal IPC mechanism. Pass data to process pool workers only through function arguments and return values. For large data, use shared memory (`multiprocessing.shared_memory`) or memory-mapped files.

12. **Validate that async libraries are truly non-blocking.** Some libraries advertise "async" support but wrap synchronous operations in `asyncio.to_thread()` internally (e.g., some early versions of async database drivers). Check if the library uses native async I/O (e.g., `asyncpg` uses libpq's async mode) or just wraps sync calls in threads (some SQLAlchemy async adapters). The latter is functional but loses some of the single-threaded event loop's scalability advantages.

---

## Edge Cases

### Legacy Sync Codebase Adding Async Endpoints

A common scenario: a mature Django or Flask application adding async capabilities via FastAPI or converting specific high-traffic routes to async.

- Do not attempt to rewrite the entire codebase to async at once. Define a clear boundary: async code lives in the new service layer, sync code lives in the domain/data layer.
- Call sync domain functions using `await asyncio.to_thread(sync_domain_fn, *args)` from async route handlers. This offloads the sync work to the thread pool and keeps the event loop free.
- Watch for Django ORM calls in threads: Django's ORM is not thread-safe for connection sharing. Use `django.db.close_old_connections()` at the start of threaded tasks, or use `databases` library as a thin async wrapper over SQLAlchemy Core.
- Incrementally migrate the highest-I/O paths to native async first (external HTTP calls, cache reads/writes) while keeping database access sync in threads. Measure latency improvements at each step to justify the migration cost.
- Avoid calling `sync_to_async` (Django's utility) from within a `ThreadPoolExecutor` worker -- it creates a new event loop per thread which conflicts with Django's connection management. Use it only from the main async context.

### Async Code in Jupyter Notebooks

Jupyter's IPython kernel runs its own event loop (since IPython 7.0). This means `asyncio.run()` raises `RuntimeError: This event loop is already running`.

- Use `await coroutine()` directly in cells -- IPython handles it.
- If a library requires `asyncio.run()` internally (some older async frameworks do), install `nest_asyncio` and call `nest_asyncio.apply()` at the top of the notebook. This patches the event loop to allow nested `run()` calls. Use this only in Jupyter -- never in production code.
- `asyncio.get_event_loop()` in IPython returns the kernel's loop. Do not close it or replace it.
- Long-running tasks in Jupyter cells will block the cell output until completion. For interactive exploration, structure long async operations as `asyncio.Queue`-based generators that yield intermediate results.

### Very High Concurrency (10,000+ Simultaneous Tasks)

At extremely high task counts, asyncio's overhead becomes measurable.

- `create_task()` costs approximately 3-5 microseconds per task. 10,000 tasks = ~50ms of scheduling overhead before any work runs.
- For batch processing at this scale, use a fixed-size worker pool pattern with `asyncio.Queue` instead of creating one task per item. Create N worker tasks (N = desired concurrency, e.g., 500) and feed them via a queue. This amortizes task creation cost and controls memory use.
- `asyncio.gather()` on 10,000 coroutines creates all tasks immediately. Use `asyncio.as_completed()` or a semaphore-gated fan-out to control the active-at-once count.
- Memory: each task uses ~2KB of stack memory in CPython 3.11+. 10,000 tasks = ~20MB. 100,000 tasks = ~200MB. Account for this in memory planning.
- Consider whether this load pattern is better served by a message queue (Celery, RQ, Kafka consumer) rather than in-process async tasks, especially if work must survive process restarts.

### Mixing `threading` and `asyncio` in the Same Application

Some applications need both: a GUI framework (PyQt, wxPython) or legacy synchronous framework running in one thread, with an asyncio event loop in another.

- Start the asyncio event loop in a dedicated daemon thread: `threading.Thread(target=lambda: asyncio.run(main()), daemon=True).start()`. Store the loop reference for later use.
- Submit work to the loop from other threads using `asyncio.run_coroutine_threadsafe(coro, loop)`. This is the only thread-safe way to schedule async work from outside the loop's thread.
- The returned `concurrent.futures.Future` (not `asyncio.Future`) can be used to get the result: `.result(timeout=5.0)`. This blocks the calling thread -- use it sparingly.
- Never await `asyncio.Future` objects across threads. `asyncio.Future` is not thread-safe. Only use `concurrent.futures.Future` for thread-to-async communication.
- If the sync thread calls `run_coroutine_threadsafe` in a tight loop (>1000 calls/second), the submission overhead becomes measurable. Batch work into larger coroutines or use a producer/consumer queue.

### CPU-Bound Work That Must Stay in asyncio Context

Sometimes CPU-bound work cannot be easily moved to a process pool: it captures `asyncio`-specific state, uses objects that aren't picklable, or the overhead of serializing data to a subprocess is larger than the computation itself.

- For small CPU tasks under ~500 microseconds: execute them synchronously in the coroutine. The blocking time is below the event loop's effective resolution (~1ms) and the overhead of executor dispatch exceeds the benefit.
- For medium CPU tasks (500 microseconds to 5ms) where pickling isn't feasible: use `await asyncio.sleep(0)` at logical checkpoints within the computation to yield to the event loop periodically. This doesn't speed up the computation but prevents any single invocation from monopolizing the loop.
- For large CPU tasks with unpicklable objects: refactor the computation to extract the serializable hot path into a pure function (no asyncio state), then call that function in a `ProcessPoolExecutor`. The surrounding async orchestration can remain in the main loop.
- NumPy array operations that release the GIL: these can run genuinely in parallel using `ThreadPoolExecutor`. Wrap the numpy computation in a function and use `loop.run_in_executor(thread_pool, numpy_fn, data)`. Benchmark against the process pool alternative -- threads are cheaper to spawn and share memory, making them superior for large array data.

### `asyncio.run()` vs. Framework-Managed Event Loops

When building libraries or tools that may run in both standalone scripts and framework contexts (FastAPI, Starlette, aiohttp, Celery), the entry point must be adaptive.

- Detect whether a loop is running with `asyncio.get_event_loop().is_running()` (Python 3.10+) or try/except around `asyncio.get_running_loop()`.
- Libraries should never call `asyncio.run()` internally -- that is the application's responsibility. Library async functions should always be pure coroutines that the caller awaits.
- For testing utilities that need to run coroutines synchronously (e.g., a CLI wrapper around an async library), use `asyncio.run()` only at the CLI entry point. Inside the library, expose only async functions.
- When the same code must work in both sync and async contexts, use the "sync wrapper" pattern: expose both `async def fn()` and `def fn_sync()` where `fn_sync` does `asyncio.run(fn())`. Never auto-detect -- explicit is better than implicit.

### Windows-Specific Async Subprocess and Signal Handling

Windows has significant differences in asyncio behavior that affect code portability.

- `asyncio.subprocess` requires `ProactorEventLoop` on Windows. From Python 3.8+, this is the default on Windows, but if code was written for Python 3.6-3.7 it may need `asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())` explicitly.
- Signal handlers (`loop.add_signal_handler`) are not supported on Windows -- the call raises `NotImplementedError`. For cross-platform graceful shutdown, use `asyncio.Event` and trigger it from a separate thread that handles signals, or use the `signal.signal()` synchronous API in a monitoring thread.
- `ProcessPoolExecutor` uses `spawn` as the start method on Windows (vs. `fork` on Linux). `spawn` re-imports the module from scratch in each worker, so all module-level code runs again. Protect initialization code with `if __name__ == "__main__":` guards.
- `uvloop` does not support Windows. Design code so the event loop policy is set at the entry point only, and the rest of the code is loop-agnostic.

---

## Example

**Input:** "I'm building a product catalog service. For each product request, I need to: (1) fetch product details, pricing, and reviews from three separate internal HTTP microservices concurrently, (2) run a recommendation scoring algorithm on the combined data (pure Python, takes ~50ms per product), (3) cache the result in Redis, and (4) support fetching up to 200 products in a single batch request. How do I structure the async architecture?"

**Output:**

```python
"""
Module: product_catalog_service
Concurrency model: Hybrid -- asyncio for I/O, ProcessPoolExecutor for CPU scoring
Python version: 3.11+
Key primitives:
  - asyncio.TaskGroup: concurrent per-product API fetches
  - asyncio.Semaphore: bound batch concurrency to 50 concurrent products
  - ProcessPoolExecutor: scoring algorithm (50ms CPU, benefits from true parallelism)
  - redis.asyncio: async Redis cache reads/writes
  - httpx.AsyncClient: connection-pooled async HTTP
  - contextlib.asynccontextmanager: managed HTTP client lifecycle
"""

import asyncio
import contextlib
import os
import signal
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field
from typing import AsyncIterator

import httpx
import redis.asyncio as aioredis


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ProductDetails:
    product_id: str
    name: str
    description: str
    category: str


@dataclass(frozen=True)
class ProductPricing:
    product_id: str
    amount: float
    currency: str
    discount_pct: float


@dataclass(frozen=True)
class ProductReviews:
    product_id: str
    average_rating: float
    review_count: int
    recent_sentiment: float  # -1.0 to 1.0


@dataclass(frozen=True)
class EnrichedProduct:
    product_id: str
    details: ProductDetails
    pricing: ProductPricing
    reviews: ProductReviews
    recommendation_score: float


# ---------------------------------------------------------------------------
# CPU-bound scoring (pure function, runs in ProcessPoolExecutor)
# Must be a module-level function -- ProcessPoolExecutor pickles function
# references, so lambdas and locally-defined functions cannot be used.
# ---------------------------------------------------------------------------

def compute_recommendation_score(
    pricing: dict,
    reviews: dict,
    category_weights: dict,
) -> float:
    """
    Pure Python scoring algorithm. ~50ms CPU time per product.
    No asyncio state -- safe to run in a separate process.

    Formula: weighted combination of normalized price competitiveness,
    review quality, and sentiment adjusted by category preference.
    """
    price = pricing["amount"]
    discount = pricing["discount_pct"]
    rating = reviews["average_rating"]
    review_count = reviews["review_count"]
    sentiment = reviews["recent_sentiment"]
    category = pricing.get("category", "general")

    # Price competitiveness: lower price + higher discount = better score
    price_score = max(0.0, 1.0 - (price / 1000.0)) + (discount / 100.0) * 0.3

    # Review quality: Bayesian average with minimum 10 reviews for full weight
    confidence = min(review_count / 10, 1.0)
    review_score = confidence * rating / 5.0 + (1 - confidence) * 0.5

    # Sentiment boost: range -0.2 to +0.2
    sentiment_adjustment = sentiment * 0.2

    # Category weight multiplier (passed in from calling context)
    weight = category_weights.get(category, 1.0)

    raw_score = (price_score * 0.35 + review_score * 0.50 + sentiment_adjustment) * weight
    return round(min(max(raw_score, 0.0), 1.0), 4)


# ---------------------------------------------------------------------------
# Application-level shared resources (created once at startup)
# ---------------------------------------------------------------------------

class CatalogServiceResources:
    """
    Owns the lifecycle of all shared async and executor resources.
    Create once, share across all request handlers.
    """

    def __init__(
        self,
        details_base_url: str,
        pricing_base_url: str,
        reviews_base_url: str,
        redis_url: str,
        process_pool_workers: int = 4,
    ) -> None:
        self.details_base_url = details_base_url
        self.pricing_base_url = pricing_base_url
        self.reviews_base_url = reviews_base_url
        self.redis_url = redis_url
        self.process_pool_workers = process_pool_workers

        # Initialized in __aenter__
        self.http_client: httpx.AsyncClient | None = None
        self.redis: aioredis.Redis | None = None
        self.process_pool: ProcessPoolExecutor | None = None

    async def __aenter__(self) -> "CatalogServiceResources":
        # HTTP client with connection pooling:
        #   max_connections=200 supports 200 concurrent product fetches,
        #   each needing 3 connections (details + pricing + reviews).
        #   max_keepalive_connections=40 reuses connections across requests.
        self.http_client = httpx.AsyncClient(
            limits=httpx.Limits(
                max_connections=200,
                max_keepalive_connections=40,
                keepalive_expiry=30,
            ),
            timeout=httpx.Timeout(connect=2.0, read=5.0, write=2.0, pool=10.0),
        )
        # Redis client with connection pool (default pool size = 50)
        self.redis = aioredis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
        # Process pool sized to physical CPU cores for CPU-bound scoring.
        # On a 4-core machine: 4 workers process 4 products simultaneously.
        self.process_pool = ProcessPoolExecutor(
            max_workers=self.process_pool_workers
        )
        return self

    async def __aexit__(self, *_) -> None:
        if self.http_client:
            await self.http_client.aclose()
        if self.redis:
            await self.redis.aclose()
        if self.process_pool:
            # wait=True: block until all in-flight scoring jobs complete
            self.process_pool.shutdown(wait=True)


# ---------------------------------------------------------------------------
# Per-product fetch and enrich pipeline
# ---------------------------------------------------------------------------

CACHE_TTL_SECONDS = 300  # 5 minutes
CATEGORY_WEIGHTS = {
    "electronics": 1.2,
    "clothing": 0.9,
    "books": 1.0,
    "home": 1.1,
    "general": 1.0,
}


async def fetch_single_product(
    product_id: str,
    resources: CatalogServiceResources,
) -> EnrichedProduct:
    """
    Full enrichment pipeline for one product.

    Phase 1 (I/O): Fetch details, pricing, reviews concurrently via TaskGroup.
    Phase 2 (CPU): Score the combined data in the process pool.
    Phase 3 (I
