---
name: ruby-performance
description: |
  Guides expert-level ruby performance implementation: ruby and optimization decision frameworks, production-ready patterns, and concrete templates for ruby performance workflows.
  Use when the user asks about ruby performance, ruby performance configuration, or ruby best practices for ruby projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ruby optimization debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Ruby Performance

## When to Use

**Use this skill when:**
- User asks how to diagnose slow response times, high memory usage, or GC pressure in a Ruby or Ruby on Rails application
- User wants to profile a Ruby application and interpret results from tools like rack-mini-profiler, ruby-prof, stackprof, or derailed_benchmarks
- User needs to optimize specific Ruby constructs -- string allocation, object creation, ActiveRecord queries, or background job throughput
- User is designing a new Ruby service and wants to make performance-conscious architecture decisions upfront
- User needs to tune MRI (CRuby) runtime settings -- GC parameters, thread counts, Ractors, or GVL-aware concurrency patterns
- User is diagnosing memory bloat, memory leaks, or retained object accumulation across requests
- User wants to benchmark competing implementations and interpret results using benchmark-ips or benchmark/memory
- User is experiencing Sidekiq, Delayed Job, or Resque throughput problems and needs queue optimization guidance

**Do NOT use this skill when:**
- User needs help with JRuby or TruffleRuby platform-specific tuning -- those runtimes have different GC models, threading, and JVM/Graal-specific considerations
- User is asking about Rails architecture decisions unrelated to performance (authentication, authorization, API design) -- use a Rails architecture skill instead
- User needs database schema design or query optimization as the primary concern -- use a SQL/database optimization skill; this skill covers the Ruby-side query patterns (N+1, eager loading) but not index design
- User needs frontend performance (JavaScript bundle size, browser rendering, CSS) -- use a frontend performance skill
- User is asking about infrastructure scaling (horizontal pod autoscaling, CDN configuration, load balancing) -- performance gains at the Ruby layer should be established first
- User needs help with Ruby syntax, language fundamentals, or learning Ruby from scratch
- User is debugging a correctness bug rather than a performance problem -- do not conflate the two

---

## Process

### 1. Establish a Baseline with Profiling Before Touching Code

Never optimize without measurement. Guessing at bottlenecks in Ruby code is almost always wrong.

- **For request-level profiling in Rails:** Add `rack-mini-profiler` to the Gemfile (development + production if needed). It overlays per-request timings, SQL queries, and partial render times directly in the browser. Enable flamegraph support with `stackprof` as the backend: `require 'rack-mini-profiler'; require 'flamegraph'`.
- **For CPU profiling:** Use `stackprof` in wall-clock mode (`mode: :wall`) for I/O-bound code or `mode: :cpu` for CPU-bound code. Sample at 1000 Hz (the default). Run `stackprof --text tmp/stackprof.dump` to get a flat caller/callee breakdown. Flamegraphs (SVG output) reveal the full call stack distribution.
- **For memory profiling:** Use `memory_profiler` gem. Wrap a block with `MemoryProfiler.report { ... }` and call `.pretty_print`. Focus on "Total allocated" (objects and bytes), "Total retained" (memory not freed), and the top allocation sites by gem and file.
- **For bulk memory regression testing in Rails:** Use `derailed_benchmarks`. Run `bundle exec derailed exec perf:mem` to measure memory per request and `perf:objects` to count allocated objects. Establish a baseline number before any change and compare after.
- **For micro-benchmarks:** Use `benchmark-ips` (iterations per second) rather than the stdlib `Benchmark` module. It handles warmup automatically (default 5 seconds warmup, 5 seconds measurement). Always run at least 3 rounds and check for variance. Use `Benchmark.ips { |x| x.compare! }` to rank alternatives.
- **Record baseline numbers in a comment or test:** `# Baseline: 2.3ms per request, 12,400 objects allocated` so regressions are immediately visible.

### 2. Identify the Category of Bottleneck

Different bottlenecks require entirely different solutions. Misidentifying the category wastes days.

- **CPU-bound:** High `%user` CPU, long `stackprof` frames in pure Ruby computation. Solutions involve algorithmic improvement, C extensions, or moving work to background jobs.
- **I/O-bound:** High `%iowait` or long `mode: :wall` stackprof frames waiting on DB, HTTP, or filesystem. Solutions involve connection pooling, caching, async patterns, or query reduction.
- **Memory/GC-bound:** High GC pause frequency visible in `GC::Profiler.enable; GC::Profiler.report`. Ruby's GC pauses everything (stop-the-world). Solutions involve reducing object allocation, tuning GC parameters, or using frozen string literals.
- **Concurrency-bound:** Threads blocked on the GVL (Global VM Lock) even with I/O work available. Solutions involve Ractors (Ruby 3+), `parallel` gem, multi-process forking (Puma cluster mode), or async I/O with `async` gem.
- **ActiveRecord/ORM-bound:** SQL query count explodes with dataset size (N+1) or individual queries are slow. Solutions involve eager loading, query optimization, or moving to raw SQL for hot paths.

Use this diagnosis checklist:
  - Is GC time > 15% of wall time? -- GC-bound
  - Is `pg` or `mysql2` adapter the top stackprof frame? -- DB I/O bound
  - Is object allocation count > 100,000 per request? -- likely allocation-bound
  - Is CPU pegged at 100% on one core with multiple threads idle? -- GVL-bound

### 3. Address Object Allocation and GC Pressure

Ruby's MRI GC is generational and incremental since Ruby 2.1+ but still creates stop-the-world pauses during major GC. Every object allocated has a cost.

- **Enable frozen string literals globally:** Add `# frozen_string_literal: true` to every file, or configure it runtime-wide with `--enable-frozen-string-literal` in `.ruby-version` / `RUBYOPT`. Strings are the #1 source of unnecessary allocations in most Ruby codebases. This single change typically reduces allocations by 10-30%.
- **Use `String#<<` (mutate) instead of `String#+` (allocate):** `result = ""; parts.each { |p| result << p }` allocates one string. `parts.each { |p| result = result + p }` allocates N strings.
- **Avoid creating intermediate arrays in hot loops:** `array.map { }.select { }` creates two arrays. `array.filter_map { }` (Ruby 2.7+) creates one. `array.each_with_object([]) { }` creates one. For large arrays this matters.
- **Use symbols over strings for hash keys:** `{ name: "Alice" }` vs `{ "name" => "Alice" }`. Symbols are interned (one object per value), strings are not (unless frozen).
- **Preallocate collections when size is known:** `Array.new(1000)` is faster than 1000 `Array#push` calls that trigger internal resizing at capacities 4, 8, 16, 32...
- **Avoid `Object#dup` and `Object#clone` in hot paths:** They allocate a new object and copy instance variables. Cache or reuse objects where possible.
- **Tune GC parameters via environment variables for production:**
  - `RUBY_GC_HEAP_INIT_SLOTS=1000000` -- pre-allocate heap slots to reduce early GC churn
  - `RUBY_GC_HEAP_GROWTH_FACTOR=1.25` -- default is 1.8; lower values reduce memory bloat but increase GC frequency
  - `RUBY_GC_HEAP_OLDOBJECT_LIMIT_FACTOR=2.0` -- controls when major GC triggers; raise to reduce major GC frequency at the cost of memory
  - `RUBY_GC_MALLOC_LIMIT=67108864` (64 MB) -- raise to defer minor GC on malloc-heavy code
  - Shopify's recommendation for Rails apps: set `MALLOC_ARENA_MAX=2` (glibc env var) to dramatically reduce heap fragmentation on multi-threaded servers

### 4. Optimize ActiveRecord Query Patterns

ActiveRecord is convenient but generates N+1 queries and loads more data than necessary by default.

- **Detect N+1 queries automatically:** Add `bullet` gem in development/test. Configure `Bullet.raise = true` in test environment to fail tests on N+1. In development set `Bullet.alert = true` or `Bullet.rails_logger = true`.
- **Use `includes` for associations accessed in views or serializers:** `Post.includes(:author, comments: :author).limit(20)`. Use `preload` to force two queries (never a JOIN) or `eager_load` to force a LEFT OUTER JOIN when you need to filter on the association.
- **Use `select` to load only needed columns:** `User.select(:id, :email, :name)` instead of `User.all`. Loading a large `text` or `jsonb` column for 1,000 records has measurable cost.
- **Use `pluck` for scalar values:** `User.where(active: true).pluck(:id)` returns a plain Ruby array of integers -- no ActiveRecord objects instantiated. 10-100x faster than `.map(&:id)` on large result sets.
- **Use `find_each` or `find_in_batches` for large datasets:** Never `User.all.each` on a table with > 10,000 rows. `User.find_each(batch_size: 500)` loads 500 at a time, instantiates, processes, then GCs them before the next batch.
- **Use `update_all` and `delete_all` for bulk mutations:** `User.where(inactive: true).update_all(deleted_at: Time.current)` is one SQL statement. Calling `.each { |u| u.update!(deleted_at: ...) }` is N SQL statements plus N object instantiations plus N ActiveRecord callbacks (which may be intentional -- know the trade-off).
- **Use database-side aggregation:** `Order.where(user: user).sum(:total)` is one SQL `SUM()`. Loading all orders and calling `.sum(&:total)` in Ruby loads all rows into memory.
- **Cache repeated queries with `Rails.cache`:** Use `fetch` with a meaningful key and explicit TTL. For reference data (countries, product categories) that rarely changes, use an initializer with a class-level `@@cache` or `ActiveSupport::Cache::MemoryStore` to avoid any serialization overhead.

### 5. Optimize Concurrency and Server Configuration

MRI Ruby has a GVL that prevents true parallel Ruby thread execution. Design around it.

- **Puma thread count:** The rule of thumb for DB-bound Rails apps is `min_threads = 5, max_threads = 5` (keep min == max to avoid overhead). Each thread holds one DB connection. Set `config/puma.rb`: `threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }`. More threads beyond 5-10 yields diminishing returns under the GVL for CPU-bound work.
- **Puma cluster mode (workers):** Each worker is a separate OS process with its own GVL. `workers = ENV.fetch("WEB_CONCURRENCY") { 2 }`. With 2 workers × 5 threads = 10 concurrent requests. Memory cost: each worker is a full copy of the Rails process (typically 200-600 MB for a mid-size app).
- **Use `preload_app!` in Puma:** `preload_app!` forks workers after loading the app, enabling copy-on-write (CoW) memory sharing on Linux. Workers share read-only pages until they write. This can reduce memory by 30-50% in cluster mode. Must manually reconnect DB/Redis after fork: `on_worker_boot { ActiveRecord::Base.establish_connection }`.
- **For background jobs (Sidekiq):** Sidekiq uses threads within a single process. Default concurrency is 10. Each Sidekiq thread holds one DB connection. Set `config/sidekiq.yml concurrency: 10` and ensure `database.yml pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 10 } %>`. For CPU-intensive jobs, lower concurrency to `4-6` to avoid GVL contention.
- **For genuinely CPU-parallel work in Ruby 3+:** Ractors allow true parallelism but cannot share mutable state and cannot use most gems. Suitable for data processing pipelines with clean data boundaries. Not suitable for general Rails use today.
- **For async I/O in Ruby 3+:** The `async` gem with Fiber-based concurrency enables thousands of concurrent I/O operations in a single thread. Suitable for HTTP clients, websockets, and bulk external API calls. Not a drop-in replacement for thread-based Puma.

### 6. Optimize Hot Code Paths with Ruby Idioms

After identifying a specific hot path via profiling, apply Ruby-specific optimizations.

- **Method lookup:** Ruby method lookup traverses the ancestor chain. Minimize deep inheritance for performance-critical code. Prefer composition over deep inheritance in hot paths.
- **`attr_reader` vs custom getters:** `attr_reader :name` generates optimized C-level bytecode. A manually written `def name; @name; end` does the same but `attr_reader` is marginally faster due to YARV optimization.
- **Avoid `method_missing` in hot paths:** `method_missing` is dispatched only after exhausting the full method lookup chain. Cache the result or use `define_method` to create real methods.
- **Use `Comparable`, `Enumerable` module inclusion wisely:** Including `Enumerable` and defining `each` gives you 50+ methods for free, but calling `include?` on an unsorted `Enumerable` is O(n). If you need fast membership testing, use a `Set` (hash-based, O(1) average).
- **Lazy enumerators for large/infinite sequences:** `(1..Float::INFINITY).lazy.select { |n| n.odd? }.first(100)` does not allocate the intermediate array. Use `Enumerator::Lazy` when chaining operations on large collections where only a subset is consumed.
- **Memoization:** `@result ||= expensive_computation` is idiomatic Ruby memoization. For methods that can legitimately return `nil` or `false`, use `defined?(@result) ? @result : @result = expensive_computation` to avoid recomputing.
- **Struct vs OpenStruct:** `Struct.new(:name, :age)` generates a class with optimized attribute accessors and is nearly as fast as a plain Ruby class. `OpenStruct` (from ostruct library) uses a hash internally and `method_missing` -- it is 5-10x slower for attribute access. Never use `OpenStruct` in hot paths.
- **Regexp compilation:** Compile regexps once as constants (`PHONE_PATTERN = /\A\d{10}\z/.freeze`) rather than creating them inline inside methods. Inline regexps in some Ruby versions create a new Regexp object per call.

### 7. Implement Caching at the Right Layer

Caching is the highest-leverage performance technique after query optimization, but cache invalidation is a source of bugs.

- **Fragment caching in Rails views:** `cache(["v1", post]) { render partial: "post", locals: { post: post } }`. The cache key auto-expires when `post.updated_at` changes. Use Russian doll caching for nested partials.
- **Low-level Rails.cache:** `Rails.cache.fetch("user:#{id}:stats", expires_in: 15.minutes) { compute_stats(id) }`. Use Redis with `redis-rb` or `redis-client` gem as the cache store in production. Configure `config.cache_store = :redis_cache_store, { url: ENV["REDIS_URL"], expires_in: 1.hour }`.
- **Memoize at the request level with instance variables:** A controller or service object that calls the same expensive method multiple times in one request should memoize with `@result ||=`. This is zero-overhead and requires no external cache.
- **HTTP caching with ETags and Last-Modified:** `fresh_when(etag: @post, last_modified: @post.updated_at)` in Rails controllers returns 304 Not Modified and serves no response body if the client's cache is current. Eliminates view rendering and DB reads for cacheable resources.
- **Counter caches:** `belongs_to :post, counter_cache: true` maintains a `comments_count` column on `posts` updated by DB trigger-equivalent callbacks. Replaces `post.comments.count` (SQL COUNT) with `post.comments_count` (integer read).

### 8. Validate with Benchmarks and Regression Prevention

Performance gains must be measured and protected from regression.

- **Write benchmark scripts for hot paths:** Keep a `benchmarks/` directory with `benchmark-ips` scripts. Run before and after optimizations. Commit the results in a comment or separate `.md` file.
- **Add performance tests to CI with `rspec-benchmark`:** Assert response time percentiles (`expect { call }.to perform_under(50).ms.warmup(10).times.sample(30).times`) or allocation counts (`expect { call }.to perform_allocation(500).objects`).
- **Use `derailed_benchmarks` in CI:** `bundle exec derailed exec perf:mem_over_time` detects memory leaks by running 1,000+ requests and plotting heap growth.
- **Track key metrics in production APM:** NewRelic, Datadog APM, or Scout APM provide per-endpoint p50/p95/p99 response times, throughput, error rates, and GC metrics. Set alert thresholds at p95 > 500ms for user-facing endpoints.
- **Profile before and after every significant change:** Do not trust intuition. A "clean" refactor that introduces an N+1 query can turn a 10ms endpoint into a 500ms one.

---

## Output Format

```
## Ruby Performance Analysis Report

### Baseline Measurements
| Metric                  | Value       | Tool Used           | Threshold |
|-------------------------|-------------|---------------------|-----------|
| p50 response time       | X ms        | rack-mini-profiler  | < 100ms   |
| p95 response time       | X ms        | APM / benchmark-ips | < 300ms   |
| Objects allocated/req   | X objects   | memory_profiler     | < 50,000  |
| Memory per request      | X KB        | derailed_benchmarks | < 2 MB    |
| SQL queries per request | X queries   | rack-mini-profiler  | < 10      |
| GC time % of wall time  | X%          | GC::Profiler        | < 10%     |

### Bottleneck Diagnosis
**Category:** [CPU-bound | I/O-bound | Memory/GC-bound | Concurrency-bound | ORM-bound]
**Evidence:** [stackprof top frame | memory_profiler top allocations | N+1 query trace]
**Root Cause:** [specific finding, e.g., "User.all loading 40,000 rows per request"]

### Recommendations (Prioritized by Impact/Effort)

| Priority | Technique                        | Expected Gain          | Effort | Risk |
|----------|----------------------------------|------------------------|--------|------|
| P1       | [e.g., Add includes(:author)]    | -80% query count       | Low    | Low  |
| P2       | [e.g., frozen_string_literal]    | -15% allocations       | Low    | Low  |
| P3       | [e.g., Redis fragment caching]   | -60% render time       | Medium | Med  |
| P4       | [e.g., Puma preload_app!]        | -30% memory (CoW)      | Low    | Low  |

### Implementation

#### [Technique Name]
**Problem:** [specific observation from profiling]
**Solution:**
```ruby
# Before (problematic code with measurement)
# 2,400ms, 180 SQL queries
posts = Post.all
posts.each { |p| puts p.author.name }

# After (optimized code with measurement)
# 45ms, 2 SQL queries
posts = Post.includes(:author)
posts.each { |p| puts p.author.name }
```
**Verification:** [benchmark command and expected output]

### GC / Runtime Configuration (if applicable)
```bash
# Production environment variables
RUBY_GC_HEAP_INIT_SLOTS=1000000
RUBY_GC_HEAP_GROWTH_FACTOR=1.25
RUBY_GC_HEAP_OLDOBJECT_LIMIT_FACTOR=2.0
MALLOC_ARENA_MAX=2
RAILS_MAX_THREADS=5
WEB_CONCURRENCY=2
```

### Validation Results
| Metric                  | Before  | After   | Improvement |
|-------------------------|---------|---------|-------------|
| p50 response time       | X ms    | Y ms    | Z%          |
| Objects allocated/req   | X       | Y       | Z%          |
| SQL queries per request | X       | Y       | Z%          |
| Memory per request      | X KB    | Y KB    | Z%          |

### Regression Prevention
- [ ] benchmark-ips script added to `benchmarks/`
- [ ] rspec-benchmark assertion added for this endpoint
- [ ] APM alert threshold configured (p95 < Xms)
- [ ] bullet gem enabled in test environment
```

---

## Rules

1. **Never optimize without profiling data.** Premature optimization based on intuition is the leading cause of wasted engineering time and introduced complexity. Every optimization must cite a specific profiler output (stackprof frame, memory_profiler allocation site, or SQL query trace) that justifies it.

2. **frozen_string_literal is always the first optimization applied.** It is zero-risk for most code, requires one line per file, and consistently reduces allocations by 10-30%. Any performance work that does not include this is incomplete.

3. **Distinguish `includes` vs `preload` vs `eager_load`.** `includes` lets Rails decide between the two; it chooses `preload` (two queries) by default but switches to `eager_load` (one JOIN) when you filter on the association in a `where`. Using `eager_load` naively on a `has_many` with many records creates a Cartesian product that can be slower. Profile both.

4. **Never use `pluck` when you need ActiveRecord objects downstream.** `pluck` skips instantiation, which means no callbacks, no virtual attributes, no `after_find`. It is only appropriate when you need raw scalar data.

5. **GC parameter tuning must be validated under production-like load.** Increasing `RUBY_GC_HEAP_OLDOBJECT_LIMIT_FACTOR` reduces GC frequency but increases memory. This trade-off is acceptable on a memory-constrained Heroku dyno only if you have headroom. Always load test after changing GC parameters with `wrk` or `ab` at realistic concurrency levels.

6. **Never set Puma thread count above the database connection pool size.** Every Puma thread holds one connection while active. If `max_threads=10` and `pool=5`, the 6th concurrent thread blocks waiting for a connection, causing request queuing. These two numbers must be equal.

7. **`find_each` is mandatory for any query that could return more than 1,000 rows.** Loading 10,000 ActiveRecord objects at once in a job or rake task will spike memory to several GB and trigger major GC. This is non-negotiable for data migration scripts and batch processors.

8. **Cache invalidation must be explicit and tested.** Every cache entry must have either a time-based TTL, a version key tied to a model's `updated_at`, or a manual invalidation call. Cached data with no invalidation strategy causes correctness bugs that are harder to debug than the original performance problem.

9. **Measure memory in addition to speed.** A code change that halves response time but doubles memory usage will cause OOM kills on containers and increase infrastructure cost. Both dimensions must be measured before declaring an optimization successful.

10. **Ractors and async/Fiber concurrency are not production-ready for general Rails use as of Ruby 3.3.** Most gems are not Ractor-safe (they use shared mutable state). Recommending Ractors as a general concurrency solution for a Rails app is incorrect. Limit Ractor recommendations to isolated data-processing use cases with explicit acknowledgment of gem compatibility requirements.

---

## Edge Cases

**Memory leak in long-running processes (Sidekiq workers, Puma workers):**
Ruby memory leaks most commonly come from: (1) objects retained in class-level constants or global variables that grow over time, (2) event listener callbacks that are never deregistered, (3) growing caches with no eviction policy. Use `ObjectSpace.each_object(ClassName).count` to count live instances of suspect classes. In production, use `rbtrace` gem to inspect object counts in a running process without restart: `bundle exec rbtrace -p PID -e 'ObjectSpace.each_object(String).count'`. If Sidekiq workers grow beyond a threshold (e.g., 512 MB), configure `SIDEKIQ_MEMORY_KILLER_MAX_RSS=512000` to restart workers that exceed the limit.

**N+1 queries hidden in serializers (ActiveModel::Serializers or fast_jsonapi):**
N+1 queries in serializers are not detected by simple controller-level analysis because the association is accessed during JSON rendering, which happens after the controller action returns. `bullet` catches these only if configured to monitor all SQL. Add `Bullet.raise = true` to test env and write request specs that call the serializer endpoint. Use `jsonapi-serializer` (formerly `fast_jsonapi`) with explicit `preload` in the controller action -- the serializer itself cannot trigger eager loading retroactively.

**String concatenation inside tight loops (log formatting, CSV generation):**
When building large strings iteratively (generating CSV rows, building SQL strings manually, constructing large reports), use `StringIO` instead of repeated concatenation: `require 'stringio'; io = StringIO.new; loop { io << row }; io.string`. For CSV generation of more than 10,000 rows, stream with `response.stream` in Rails rather than building the entire string in memory.

**Baseline drift in multi-tenant applications:**
In SaaS applications where tenants have vastly different data volumes, a performance benchmark run against a test tenant with 100 records will not reveal problems that appear only for enterprise tenants with 100,000 records. Always benchmark with a dataset representative of the largest 5% of tenants. Use `explain analyze` (PostgreSQL) or query plan analysis to confirm that query plans use indexes and do not fall back to sequential scans as data volume grows.

**ActiveSupport::Notifications and instrumentation overhead:**
Rails uses `ActiveSupport::Notifications` for instrumentation. In applications with many subscribers (custom metrics, APM agents, audit logging) on high-throughput endpoints (> 500 req/s), the notification pub-sub overhead can be measurable. Profile with `stackprof` and check for `ActiveSupport::Notifications::Fanout` in hot frames. Consider using `ActiveSupport::Notifications.unsubscribe` to remove unused subscribers, or replace custom subscribers with direct instrumentation.

**`respond_to?` and `send` in hot paths:**
Dynamic dispatch via `send(:method_name)` bypasses Ruby's inline method cache. `respond_to?` triggers a method lookup on every call. In a tight loop over 100,000 objects, this is measurable. Replace with explicit conditionals or duck-typed interfaces defined with `define_method` at class load time.

**Puma restarts resetting warm caches:**
When deploying a new version of a Rails app, Puma workers restart, clearing all in-process memoization (`@result ||=`) and `ActiveSupport::Cache::MemoryStore` entries. The first requests after deploy are "cold" and may be significantly slower. Mitigate by: (1) using a shared external cache (Redis) that persists across deploys, (2) implementing a cache warming rake task that runs pre-deploy, or (3) using rolling restarts in Puma cluster mode so at least one warm worker is always serving.

---

## Example

**Input:** "Our Rails 7 app's `GET /api/posts` endpoint takes 800ms at p95. It returns a list of blog posts with author names and comment counts. We have 15,000 posts in the database. How do I diagnose and fix this?"

**Output:**

## Ruby Performance Analysis Report

### Step 1: Instrument and Establish Baseline

Add to `Gemfile`:
```ruby
gem 'rack-mini-profiler', require: false
gem 'memory_profiler'
gem 'stackprof'
gem 'bullet', group: :development
```

Enable rack-mini-profiler for this endpoint in `config/initializers/profiler.rb`:
```ruby
if Rails.env.development? || Rails.env.staging?
  require 'rack-mini-profiler'
  Rack::MiniProfiler.config.authorization_mode = :allow_authorized
end
```

Enable bullet in `config/environments/development.rb`:
```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.rails_logger = true
  Bullet.raise = true  # fail on N+1 in tests
end
```

Make one request to `GET /api/posts`. rack-mini-profiler overlay reveals:

### Baseline Measurements
| Metric                  | Value        | Tool Used           | Threshold |
|-------------------------|--------------|---------------------|-----------|
| p95 response time       | 800ms        | rack-mini-profiler  | < 300ms   |
| Objects allocated/req   | 284,000      | memory_profiler     | < 50,000  |
| Memory per request      | 18.4 MB      | derailed_benchmarks | < 2 MB    |
| SQL queries per request | 15,003       | rack-mini-profiler  | < 10      |
| GC time % of wall time  | 22%          | GC::Profiler        | < 10%     |

### Bottleneck Diagnosis
**Category:** ORM-bound (N+1 queries) + Memory/GC-bound (excessive object allocation)
**Evidence:** 15,003 SQL queries = 1 query for posts + 15,000 queries for authors (one per post) + 1 query for... wait, comment counts are coming from a `.count` call per post. Bullet log confirms: `N+1 Query detected Post => [:author]` and `Counter cache not used for Post#comments`.
**Root Cause #1:** `Post.all` loads all 15,000 posts with no pagination, no column selection
**Root Cause #2:** `post.author.name` triggers N+1 (15,000 individual author queries)
**Root Cause #3:** `post.comments.count` triggers N+1 (15,000 COUNT queries)
**Root Cause #4:** Loading full `Post` objects including a large `body:text` column not needed in the list view

### Problematic Controller Code (Before)
```ruby
# app/controllers/api/posts_controller.rb
def index
  @posts = Post.all  # loads 15,000 rows including body:text column
  render json: @posts.map do |post|
    {
      id:            post.id,
      title:         post.title,
      author:        post.author.name,     # N+1: 1 query per post
      comment_count: post.comments.count  # N+1: 1 COUNT per post
    }
  end
end
```

### Recommendations (Prioritized by Impact/Effort)

| Priority | Technique                                | Expected Gain              | Effort | Risk |
|----------|------------------------------------------|----------------------------|--------|------|
| P1       | Add pagination (kaminari/pagy)           | -99% query count, data vol | Low    | Low  |
| P2       | `includes(:author)` to fix author N+1   | -14,999 queries            | Low    | Low  |
| P3       | `counter_cache: true` for comments       | -15,000 COUNT queries      | Low    | Med* |
| P4       | `select` to exclude body column          | -60% memory/request        | Low    | Low  |
| P5       | frozen_string_literal                    | -10% allocations           | Low    | Low  |

*Counter cache requires a migration and backfill

### Implementation

#### P1: Add Pagination with pagy

```ruby
# Gemfile
gem 'pagy'

# app/controllers/application_controller.rb
include Pagy::Backend

# app/controllers/api/posts_controller.rb
def index
  @pagy, @posts = pagy(
    Post
      .select(:id, :title, :author_id, :comments_count, :created_at)
      .includes(:author)
      .order(created_at: :desc),
    items: 25  # 25 posts per page, not 15,000
  )
  render json: {
    posts: @posts.map { |post| serialize_post(post) },
    meta:  pagy_metadata(@pagy)
  }
end
```

Pagination alone reduces this from 15,000 rows to 25 rows -- a 600x reduction in data volume.

#### P2 + P3: Fix N+1 Queries

```ruby
# Migration to add counter cache
class AddCommentsCountToPosts < ActiveRecord::Migration[7.1]
  def change
    add_column :posts, :comments_count, :integer, default: 0, null: false
    # Backfill existing counts
    Post.find_each { |p| Post.reset_counters(p.id, :comments) }
  end
end

# app/models/comment.rb
class Comment < ApplicationRecord
  belongs_to :post, counter_cache: true  # maintains posts.comments_count
end
```

#### P4: Select Only Needed Columns

```ruby
# Never load the body:text column in the list view
Post.select(:id, :title, :author_id, :comments_count, :created_at)
# This excludes body, metadata, and any other heavy columns
```

#### P5: Frozen String Literals

Add to every file in the project:
```ruby
# frozen_string_literal: true
```

Or add to `.rubocop.yml` to enforce:
```yaml
Style/FrozenStringLiteralComment:
  Enabled: true
  EnforcedStyle: always
```

#### Final Optimized Controller

```ruby
# frozen_string_literal: true

# app/controllers/api/posts_controller.rb
class Api::PostsController < ApplicationController
  include Pagy::Backend

  def index
    @pagy, @posts = pagy(
      Post
        .select(:id, :title, :author_id, :comments_count, :created_at)
        .includes(:author)
        .order(created_at: :desc),
      items: 25
    )
    render json: {
      posts: @posts.map { |post| serialize_post(post) },
      meta:  pagy_metadata(@pagy)
    }
  end

  private

  def serialize_post(post)
    {
      id:            post.id,
      title:         post.title,
      author:        post.author.name,
      comment_count: post.comments_count  # reads integer column, no query
    }
  end
end
```

### GC / Runtime Configuration

```bash
# Production Dockerfile / deployment env vars
RUBY_GC_HEAP_INIT_SLOTS=500000
RUBY_GC_HEAP_GROWTH_FACTOR=1.25
RUBY_GC_HEAP_OLDOBJECT_LIMIT_FACTOR=2.0
RUBY_GC_MALLOC_LIMIT=67108864
MALLOC_ARENA_MAX=2
RAILS_MAX_THREADS=5
WEB_CONCURRENCY=2
```

### Validation Results

After applying P1-P5:

| Metric                  | Before   | After   | Improvement |
|-------------------------|----------|---------|-------------|
| p95 response time       | 800ms    | 18ms    | -97.8%      |
| Objects allocated/req   | 284,000  | 3,200   | -98.9%      |
| Memory per request      | 18.4 MB  | 0.4 MB  | -97.8%      |
| SQL queries per request | 15,003   | 2       | -99.9%      |
| GC time % of wall time  | 22%      | 1.2%    | -94.5%      |

**Two SQL queries remain:** one for the paginated posts (with author preloaded as a second query by `includes`), which is the correct minimum.

### Regression Prevention

Add to `spec/requests/api/posts_spec.rb`:
```ruby
require 'rails_helper'
require 'rspec-benchmark'

RSpec.describe 'GET /api/posts' do
  include RSpec::Benchmark::Matchers

  before { create_list(:post, 100, :with_author, :with_comments) }

  it 'responds in under 50ms' do
    expect { get '/api/posts' }.to perform_under(50).ms
      .warmup(5).times
      .sample(20).times
  end

  it 'executes at most 5 SQL queries' do
    query_count = 0
    counter = ->(*, **) { query_count += 1 }
    ActiveSupport::Notifications.subscribed(counter, 'sql.active_record') do
      get '/api/posts'
    end
    expect(query_count).to be <= 5
  end
end
```

Configure APM alert: p95 response time alert threshold set to 50ms (3x our measured 18ms baseline) so we are alerted before user experience degrades.
