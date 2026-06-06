---
name: performance-testing
description: |
  Guides expert-level performance testing implementation: optimization and debugging decision frameworks, production-ready patterns, and concrete templates for performance testing workflows.
  Use when the user asks about performance testing, performance testing configuration, or testing best practices for performance projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing optimization debugging"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Performance Testing

## When to Use

**Use this skill when:**
- A user wants to design or implement a performance testing strategy for a web service, API, database layer, or distributed system
- A user asks how to identify and diagnose performance bottlenecks -- latency spikes, throughput degradation, memory leaks, or connection pool exhaustion
- A user needs to establish SLOs/SLAs and wants to verify their system can meet those targets under realistic load
- A user is planning a load test, stress test, soak test, or spike test and needs guidance on tooling, scenario design, and result interpretation
- A user's production system has experienced a performance incident (slowdown, outage under load) and they need a root-cause testing approach
- A user wants to add performance regression gates to their CI/CD pipeline
- A user needs to capacity plan for an expected traffic event (product launch, seasonal spike, marketing campaign)

**Do NOT use this skill when:**
- The user needs help with unit testing, integration testing, or end-to-end functional testing -- check the testing-quality sibling skills for those
- The user is asking about application performance monitoring (APM) or observability tooling in production without any load generation component -- that is an observability/monitoring skill
- The user wants to optimize a specific algorithm or data structure in isolation without a broader load testing context -- that is a code optimization skill
- The user is asking about database query tuning or index design without a load test framing -- check the database optimization skill
- The user is asking about frontend rendering performance (Core Web Vitals, Lighthouse scores) -- check the frontend performance skill
- The user needs chaos engineering or fault injection testing -- that is a distinct resilience testing skill

---

## Process

### 1. Define Goals, SLOs, and Test Scope

Before writing a single test script, establish measurable targets. Without them, test results are noise.

- Define response time targets at specific percentiles: P50, P95, P99. Typical web API targets: P50 < 100ms, P95 < 500ms, P99 < 1000ms. These numbers must come from the business or user research, not intuition.
- Define throughput targets in requests per second (RPS) or transactions per second (TPS). Distinguish between sustained throughput and peak burst capacity.
- Define error rate thresholds -- typically 0% for 5xx errors under normal load, and no more than 0.1% under stress conditions.
- Identify which user journeys or API endpoints are in scope. Focus on the critical path: login, search, checkout, or whatever generates revenue or directly impacts users. Do not try to test everything at once.
- Establish the test environment: production-identical infrastructure is ideal. If using a staging environment, document all differences (reduced replica count, smaller database, no CDN) and factor them into result interpretation.
- Agree on a baseline -- run a short 5-minute steady-state test at 10% of target load to capture pre-test system behavior before any load is applied.

### 2. Classify the Test Type You Need

Each test type answers a different question. Selecting the wrong type wastes time and produces misleading results.

- **Baseline / smoke test:** 5-10 minutes at 5-10% of target load. Confirms the test harness works, the system is healthy, and metrics are being collected. Always run this first.
- **Load test:** 20-60 minutes at 100% of expected peak load. Validates that SLOs are met under normal operating conditions. Use a ramp-up of 20-30% of total test duration to let the JVM warm up, connection pools stabilize, and caches populate.
- **Stress test:** Gradually increase load beyond 100% of target until the system degrades or fails. The goal is to find the breaking point and observe failure mode -- does the system fail gracefully (return 503s) or catastrophically (crash, data corruption, cascading failure)?
- **Soak / endurance test:** 4-24 hours at 70-80% of peak load. Exposes memory leaks, connection pool leaks, log rotation issues, and slow resource accumulation. A system that passes a 30-minute load test frequently fails a 12-hour soak test.
- **Spike test:** Instantaneous jump from baseline to 5-10x peak load, held for 2-5 minutes, then back to baseline. Tests autoscaling responsiveness and the system's ability to absorb sudden bursts without data loss or cascading failure.
- **Breakpoint test:** Identical to stress test but with a controlled, slow ramp (5% increase every 2 minutes) to find the exact saturation point, not just that one exists.

### 3. Select and Configure Your Load Generation Tool

Tool selection depends on protocol, team expertise, and test complexity.

- **k6 (Grafana):** Best for teams comfortable with JavaScript. Excellent CI/CD integration, supports HTTP/1.1, HTTP/2, WebSockets, gRPC. Outputs metrics directly to InfluxDB, Prometheus, or Grafana Cloud. Script in ES6. Use `k6 run --vus 100 --duration 10m script.js` for a quick run.
- **Apache JMeter:** Best when testers prefer a GUI or need to test JDBC, LDAP, SMTP, or JMS protocols. Heavily used in enterprise environments. Scales via distributed mode with multiple injectors. Beware: JMeter's default heap is 1GB -- set `JVM_ARGS="-Xms4g -Xmx4g"` for large tests. Thread count per injector should stay below 300 to avoid JMeter itself becoming the bottleneck.
- **Locust:** Best for Python teams. Define load scenarios as Python classes. Excellent for complex stateful workflows. Scales horizontally via master/worker mode. Run workers with `locust --worker --master-host=<ip>`.
- **Gatling:** Best for Scala teams or when detailed HTML reports with percentile histograms are required out of the box. Uses an Akka-based non-blocking engine -- a single injector can sustain 50,000+ concurrent virtual users.
- **Artillery:** Best for Node.js microservices teams and serverless API testing. YAML-based scenario definition. Native support for AWS Lambda as a distributed injector.
- **wrk / wrk2 / hey:** Best for quick HTTP benchmarking of a single endpoint. Not suitable for complex multi-step scenarios. Use `wrk -t12 -c400 -d30s http://target/endpoint` for a fast sanity check.

For distributed load generation (above ~500 RPS from a single machine), deploy multiple injector nodes. A t3.medium EC2 instance can generate approximately 500-1,000 RPS of typical HTTP traffic. Run injectors in the same region as the target to avoid cross-region latency contaminating results.

### 4. Design Realistic Test Scenarios

Synthetic load that does not match real traffic produces unreliable results.

- Analyze production access logs or APM data to determine your traffic distribution. If 60% of requests are GET /api/products, 25% are POST /api/search, and 15% are POST /api/checkout, reflect that ratio in your virtual user workflows.
- Model think time -- real users do not fire requests with zero milliseconds between them. Add realistic pauses: `sleep(randomBetween(1, 5))` seconds between actions. Without think time, virtual user concurrency is not equivalent to real user concurrency.
- Parameterize inputs -- do not send the same user ID, product SKU, or search query on every request. Use CSV data files or generated random data. Repeated identical requests will be served from cache, making results 10-100x better than production reality.
- Model authentication correctly -- obtain JWT tokens or session cookies in a setup phase and reuse them. Do not hit your auth endpoint on every request unless auth performance is what you are testing.
- Implement per-scenario correlation -- capture dynamic values from responses (order IDs, CSRF tokens, pagination cursors) and inject them into subsequent requests. Missing this step causes 400/404 errors that mask real performance data.
- Account for geographic distribution if your users are globally distributed. Use cloud-based load injectors in multiple regions, or a tool like k6 Cloud, to simulate realistic latency profiles.

### 5. Instrument the System Under Test

Load generation metrics alone are insufficient. You need server-side telemetry to diagnose what is happening inside.

- **Application metrics:** Collect request rate, error rate, and latency histograms from the application itself (not just the load generator). Use Prometheus + Grafana, Datadog, or New Relic. The load generator sees external latency; application metrics show where time is spent internally.
- **JVM metrics (if applicable):** Monitor GC pause duration and frequency, heap usage, thread pool size, and class loading. A GC pause > 200ms will appear as a P99 spike in load generator results. Use JMX exporter or the JVM metrics endpoint built into Micrometer.
- **Database metrics:** Monitor query execution time (P95, P99), slow query count, connection pool active/idle/waiting counts, lock wait time, and replication lag. A connection pool wait time > 50ms indicates pool exhaustion.
- **Infrastructure metrics:** CPU utilization (watch for > 80% sustained), memory usage, disk I/O, network bandwidth, and TCP connection states. High SYN_RECV or TIME_WAIT counts indicate socket exhaustion.
- **Thread/worker pool saturation:** Monitor queue depth for thread pools, async job queues, and request queues. A queue depth > 0 under steady load indicates the pool is saturated and latency will grow.
- Set up a single dashboard that shows load generator RPS + error rate alongside server-side CPU, memory, DB connection pool, and P99 latency -- all on the same time axis. This is the core debugging view.

### 6. Execute the Test and Monitor in Real Time

Execution discipline prevents wasted test runs.

- Verify the baseline smoke test passes before committing to a full load test. A misconfigured endpoint or missing auth token will waste hours.
- Watch the first 2-3 minutes of ramp-up live. If error rates exceed 1% before reaching target load, stop the test, diagnose, and fix before continuing. Do not let a broken test run to completion and then try to interpret bad data.
- Monitor injector resource utilization during the test. If the injector CPU exceeds 80%, the injector is the bottleneck, not the target system. Reduce virtual users per injector or add more injectors.
- Record wall-clock timestamps for any manual interventions (scaling an instance group, restarting a service, changing a config) -- these events must be overlaid on result graphs during analysis.
- For soak tests, set up automated alerts so you are notified when memory usage grows by > 20% over the baseline, not just when the system falls over.
- Capture a complete thread dump and heap dump at peak load (for JVM applications) and a `pprof` profile for Go applications. These are invaluable for diagnosing CPU-bound or memory-leak issues found during the test.

### 7. Analyze Results and Identify Root Causes

Raw numbers without interpretation are useless. This step separates performance testing from performance benchmarking.

- **Compare against SLOs first.** If P95 < 500ms is the target, check if P95 was met at all load levels. If not, that is the primary finding. Everything else is secondary.
- **Look for the knee of the curve.** Plot RPS vs. P99 latency. Latency should be flat or slowly rising. When latency starts growing super-linearly (the "knee"), that load level is the system's saturation point.
- **Correlate load generator errors with server logs.** HTTP 503 errors usually mean upstream timeout or circuit breaker trip. HTTP 429 means rate limiting is active. HTTP 500 means application errors -- grep server logs for stack traces at the same timestamps.
- **Apply Little's Law to validate results:** L = λW, where L is the average number of requests in the system, λ is throughput (RPS), and W is average response time (seconds). If the load generator shows 1,000 RPS at 200ms average, the system should have ~200 concurrent requests in flight. If this does not match your concurrency settings, something is wrong with the test configuration.
- **Distinguish queueing latency from processing latency.** If P50 is fast (50ms) but P99 is very slow (2,000ms), this is a queueing problem -- some requests wait a long time before being processed. Look at thread pool queue depth and database connection pool wait times.
- **Identify the primary bottleneck before optimizing.** Use the USE method: for every resource (CPU, memory, network, disk, thread pools, connection pools), measure Utilization, Saturation, and Errors. The first resource that saturates is the bottleneck. Fix it before optimizing anything else.

### 8. Report Findings and Establish Regression Gates

Test results must drive action and prevent future regressions.

- Write a test report that includes: test configuration (tool, virtual users, ramp-up, duration), environment description, SLO targets vs. actuals, bottleneck identification with evidence, and recommended remediations with estimated impact.
- For CI/CD regression gates in k6, use the `thresholds` configuration block. Define `http_req_duration: ['p(95)<500', 'p(99)<1000']` and `http_req_failed: ['rate<0.01']`. k6 exits with code 99 (non-zero) when thresholds are violated, failing the pipeline.
- Store test results historically. Use InfluxDB + Grafana or a purpose-built tool like Grafana k6 Cloud to overlay test runs across time. A test that passes today but regresses 5% each week will eventually fail SLOs -- only historical tracking catches this.
- Assign each finding a severity: Critical (SLO violated at current load), High (SLO met but breaking point is < 2x current load), Medium (optimization opportunity that will matter at 3-5x growth), Low (minor improvement with negligible user impact).
- Schedule the next test. Performance testing is not a one-time event. Test after every major feature release, every infrastructure change, and on a regular cadence (monthly or quarterly for stable systems).

---

## Output Format

```markdown
## Performance Test Report: [System Name]

### Test Configuration
| Parameter          | Value                              |
|--------------------|------------------------------------|
| Test Type          | [Load / Stress / Soak / Spike]     |
| Tool               | [k6 / JMeter / Gatling / Locust]   |
| Virtual Users      | [N]                                |
| Ramp-Up Duration   | [N minutes]                        |
| Steady-State Duration | [N minutes]                     |
| Target RPS         | [N]                                |
| Test Date          | [YYYY-MM-DD]                       |
| Environment        | [Staging / Production-like]        |
| Key Differences from Prod | [list any infra differences] |

---

### SLO Targets vs. Actuals
| Metric              | SLO Target     | Actual (Peak Load) | Pass / Fail |
|---------------------|----------------|--------------------|-------------|
| P50 Response Time   | < [N]ms        | [N]ms              | [✓ / ✗]     |
| P95 Response Time   | < [N]ms        | [N]ms              | [✓ / ✗]     |
| P99 Response Time   | < [N]ms        | [N]ms              | [✓ / ✗]     |
| Max Response Time   | < [N]ms        | [N]ms              | [✓ / ✗]     |
| Error Rate          | < [N]%         | [N]%               | [✓ / ✗]     |
| Throughput (RPS)    | > [N]          | [N]                | [✓ / ✗]     |

---

### Bottleneck Summary
| Resource              | Utilization at Peak | Saturation Point | Status     |
|-----------------------|---------------------|------------------|------------|
| Application CPU       | [N]%                | [N]% / [N] RPS   | [OK / HOT] |
| Application Memory    | [N]GB / [N]GB       | N/A              | [OK / LEAK]|
| DB Connection Pool    | [N] active / [N] max| [N] waiting       | [OK / EXHAUSTED] |
| DB Query P99          | [N]ms               | --               | [OK / SLOW]|
| Thread Pool Queue     | [N] avg depth       | --               | [OK / SATURATED] |

---

### Load Generator Aggregate Statistics
```
scenarios: (100.00%) 1 scenario, [N] max VUs
default: [N] looping VUs for [N]m0s (gracefulStop: 30s)

✓ http_req_duration.............: avg=[N]ms  min=[N]ms  med=[N]ms  max=[N]ms  p(90)=[N]ms  p(95)=[N]ms  p(99)=[N]ms
✓ http_req_failed...............: [N]%  [N] out of [N]
✓ http_reqs.....................: [N]    [N]/s
  iterations...................: [N]    [N]/s
  vus_max......................: [N]
```

---

### Findings and Recommendations
| Severity | Finding                             | Root Cause              | Recommended Fix                          | Est. Impact         |
|----------|-------------------------------------|-------------------------|------------------------------------------|---------------------|
| Critical | [SLO violation description]         | [Resource / code cause] | [Specific fix]                           | [P99 reduction target] |
| High     | [Near-saturation finding]           | [Cause]                 | [Fix]                                    | [Impact]            |
| Medium   | [Optimization opportunity]          | [Cause]                 | [Fix]                                    | [Impact]            |

---

### Regression Gate Configuration (k6 example)
```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>100'],
  },
};
```

---

### Next Steps
- [ ] [Specific remediation action] -- Owner: [team] -- ETA: [date]
- [ ] Re-test after fix deployment -- Target: [date]
- [ ] Schedule next routine performance test -- Target: [date]
```

---

## Rules

1. **Never test against a production database with live customer data unless you have explicit sign-off and have verified the test will not corrupt data.** Most load tests should target a staging environment with production-schema but synthetic data. If production testing is required (e.g., to test CDN or DNS behavior), use read-only scenarios and run during off-peak hours.

2. **Never accept P50 latency as your primary SLO metric.** P50 hides the worst 50% of user experience. Always define SLOs at P95 and P99. The difference between P50 and P99 tells you how much variance exists -- a P50 of 80ms with a P99 of 3,000ms indicates severe tail latency that affects 1% of users, which at 10,000 RPS is 100 users per second experiencing 3-second responses.

3. **Never generate load from the same network segment as the target without accounting for the removed network latency.** A test from localhost to localhost will show 1-5ms response times that are meaningless for production prediction. Always introduce a realistic network hop, or explicitly note that network latency is excluded and add the expected P95 network latency manually.

4. **Never run a load test without first confirming resource and cost limits with the infrastructure owner.** A stress test on cloud infrastructure can rapidly accumulate compute and data transfer costs. Establish a budget cap and set cloud spending alerts before starting. A 24-hour soak test on oversized instances can easily cost $500-$2,000.

5. **Always ramp up load gradually -- minimum 20% of total test duration as ramp-up.** Cold-starting a system at full load produces artificially bad P99 results due to JIT compilation, cache misses, and connection pool establishment. These startup effects take 2-5 minutes to stabilize and must not be included in the steady-state analysis window.

6. **Never treat load generator results as ground truth for latency.** The load generator adds its own overhead: TCP connect time, DNS resolution, TLS handshake, and HTTP keep-alive behavior. Always cross-reference with server-side timing metrics. If the load generator shows P99 = 800ms but the application reports request processing P99 = 100ms, the remaining 700ms is network or load generator overhead.

7. **Never parameterize virtual user count as the primary load specification.** Concurrent users is not the same as RPS. A system serving 500 concurrent users at 2-second average response time produces 250 RPS. A system serving 500 concurrent users at 200ms average response time produces 2,500 RPS. Always specify both target RPS and the expected concurrency level, and validate that Little's Law is satisfied in your results.

8. **Always isolate the load generator from the system under test on separate infrastructure.** Running the load generator on the same machine as the target contaminates results by competing for CPU, memory, and network bandwidth. The load generator should be on a separate VM, container, or host in the same datacenter region.

9. **Never diagnose a bottleneck without checking the full resource chain.** Application CPU at 30% does not mean the application is not the bottleneck -- it could be blocked on I/O, holding a lock, or waiting for database responses. Always check: application CPU, application thread state (blocked vs. runnable), DB CPU, DB lock waits, and connection pool wait time before concluding where the bottleneck is.

10. **Always archive raw test data and scripts alongside results.** Performance test results without the reproducible test script and environment configuration are worthless for future comparison. Store scripts in version control, store result artifacts (k6 JSON, JMeter JTL files) in object storage, and tag results with the Git SHA of the application under test.

---

## Edge Cases

### Autoscaling Interferes with Stress Test Results

When the system under test is deployed on Kubernetes with HPA or on a cloud ASG with autoscaling, scale-out events during a stress test create artificial relief that masks the true single-instance saturation point.

**Handling:** Disable autoscaling before running stress tests to find the single-node saturation point. Run a separate spike test with autoscaling enabled to validate that the scaling policy responds fast enough (typically target: new instances healthy and serving traffic within 90 seconds of scaling trigger). Document both results separately. If disabling autoscaling is not possible (e.g., shared production cluster), run the stress test at off-peak hours and monitor instance count alongside RPS in your dashboard.

### Connection Pool Exhaustion Causes Misleading Results

When all database connections are exhausted, new requests queue at the application layer. The load generator sees high latency (requests are waiting, not failing), which looks like slow database queries. The actual database CPU and query time may be low.

**Handling:** Always instrument the connection pool directly. For HikariCP (Java): expose `hikaricp_connections_active`, `hikaricp_connections_pending`, and `hikaricp_connections_timeout_total` via Micrometer. For PgBouncer (PostgreSQL pooler): monitor `cl_waiting` from the `SHOW POOLS` output. A `cl_waiting` count > 0 is the definitive signal of pool exhaustion. The fix is usually increasing pool size (carefully -- database servers have hard connection limits), reducing connection hold time in application code, or switching from connection-per-request to async/reactive I/O.

### Third-Party API Dependencies Limit Throughput

Many applications call external APIs (payment processors, email providers, SMS gateways, maps services) in the critical path. These APIs have rate limits (e.g., 100 RPS, 10,000 requests/day) that will be hit during load tests, producing 429 errors that contaminate results.

**Handling:** Identify all third-party calls in the code path being tested. For load tests, replace third-party calls with stubs or mocks at the network layer (WireMock, Hoverfly, or a simple mock server). For end-to-end realism, use sandbox/test environments provided by the third party and confirm their rate limits. Never run load tests against production third-party APIs without explicit permission -- this can result in account suspension and contractual violations.

### Test Data Exhaustion and Cache Distortion

If your test dataset is too small (e.g., 100 user IDs rotating across 500 virtual users), database caches and application caches will serve most requests from memory, producing unrealistically fast results. The test passes, but production performance with a real dataset (10 million users) is much worse.

**Handling:** Size the test dataset to exceed the database buffer pool size. For PostgreSQL, if `shared_buffers` is 8GB and `effective_cache_size` is 24GB, ensure the working set of data accessed during the test exceeds 32GB so cache hit rates are realistic. Use pre-generated CSV data files with millions of realistic rows, loaded before test execution. Monitor database buffer hit ratio -- for a well-designed load test, buffer hit ratio should match production (typically 90-99% for read-heavy workloads), not 100%.

### JVM Warm-Up Effects Distort Early Results

JVM applications (Java, Kotlin, Scala) run interpreted bytecode for the first 5,000-10,000 invocations of each method before the JIT compiler produces optimized native code. This means the first 2-5 minutes of any load test against a JVM application will show significantly higher latency than steady state.

**Handling:** Always include a warm-up phase in your test scenario, distinct from the ramp-up phase. Structure the test as: 5-minute warm-up at 20% load (excluded from SLO measurement) → ramp-up → steady state. In k6, use the `stages` array to model this. In JMeter, configure a separate thread group for warm-up and uncheck "Include in time measurement". Compare P99 during the first 5 minutes of steady state vs. the last 5 minutes -- if they differ by more than 20%, the warm-up period was insufficient.

### Clock Skew Between Injector and Target Corrupts Correlation

When correlating load generator timestamps with server-side log timestamps to identify which requests correspond to which server events, clock drift between machines (even 100ms) can make correlation impossible during high-frequency tests.

**Handling:** Ensure all machines involved in the test (load injectors, application servers, database servers) are synced to the same NTP source, ideally with < 5ms drift. Verify with `chronyc tracking` (Linux) or `w32tm /query /status` (Windows). Use structured logging with microsecond timestamps on the server side. When in doubt, correlate by request ID propagated in HTTP headers (e.g., `X-Request-ID` or W3C `traceparent`) rather than timestamp alone.

### Distributed Tracing Overhead Changes the System Being Measured

Enabling full distributed tracing (Jaeger, Zipkin, OpenTelemetry) at 100% sampling rate adds 5-15% overhead to request processing time and significantly increases network and storage I/O. A system that passes SLOs with tracing disabled may fail them when tracing is enabled in production.

**Handling:** Always run performance tests with the same observability configuration as production. If production uses 1% trace sampling, use 1% during load tests. If production uses 100% sampling (common in early-stage systems), test with 100% sampling. Document whether SLO targets account for observability overhead. If tracing is being rolled out, run a before-and-after comparison at identical load levels to quantify the overhead precisely.

---

## Example

**Input:** "We have a REST API built in Go (using the Gin framework) backed by PostgreSQL. We're planning to launch a new product next month and expect peak traffic of about 2,000 RPS. Our current service handles ~300 RPS in production. How should I design and run a performance test for this?"

---

**Output:**

### Situation Assessment

You are preparing for a 6.7x traffic increase on a Go/Gin + PostgreSQL stack. The core questions to answer before launch:

1. Does the system meet SLOs at 2,000 RPS?
2. Where does it break if load exceeds 2,000 RPS?
3. Is there a slow resource leak that will cause degradation during the sustained launch period?

**Recommended test sequence:** baseline smoke test → load test at 2,000 RPS → stress test to find breaking point → 4-hour soak test at 1,600 RPS (80% of peak).

---

### Performance Test Report: Product API -- Pre-Launch Validation

#### Test Configuration
| Parameter             | Value                                                     |
|-----------------------|-----------------------------------------------------------|
| Test Type             | Load Test (primary) + Stress Test + Soak Test             |
| Tool                  | k6 v0.47                                                  |
| Virtual Users         | 200 (load test), ramped to 600 (stress test)              |
| Ramp-Up Duration      | 5 minutes (load test), 20 minutes (stress test)           |
| Steady-State Duration | 30 minutes (load test), until degradation (stress)        |
| Target RPS            | 2,000 (load test)                                         |
| Test Date             | 2024-11-15                                                |
| Environment           | Staging -- 2x c5.2xlarge app servers, 1x db.r6g.2xlarge PostgreSQL RDS, identical schema to production |
| Key Differences from Prod | No read replica in staging; production has 1 read replica for analytics queries. CDN not in staging path. |

---

#### k6 Test Script

```javascript
import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';

// Load parameterization data -- 500,000 product IDs to avoid cache distortion
const productIds = new SharedArray('products', function () {
  return open('./product_ids.csv').split('\n').map(id => id.trim());
});

const BASE_URL = 'https://api-staging.example.com';

export const options = {
  stages: [
    // Warm-up phase -- excluded from SLO measurement via startTime in analysis
    { duration: '5m', target: 50 },
    // Ramp-up
    { duration: '5m', target: 200 },
    // Steady state at target load (2,000 RPS with 200 VUs at ~100ms avg response)
    { duration: '30m', target: 200 },
    // Ramp-down
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // SLO gates -- pipeline fails if violated
    'http_req_duration{scenario:default}': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.001'],
    'http_reqs': ['rate>1800'], // Must sustain at least 1,800 RPS
  },
};

export default function () {
  const productId = productIds[Math.floor(Math.random() * productIds.length)];
  const userId = Math.floor(Math.random() * 1000000) + 1;

  // Traffic mix: 60% product detail, 25% search, 15% add to cart
  const roll = Math.random();

  if (roll < 0.60) {
    // Product detail page
    const res = http.get(`${BASE_URL}/api/v1/products/${productId}`, {
      headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}` },
      tags: { endpoint: 'product_detail' },
    });
    check(res, {
      'product detail status 200': (r) => r.status === 200,
      'product detail response time < 500ms': (r) => r.timings.duration < 500,
    });

  } else if (roll < 0.85) {
    // Search
    const query = encodeURIComponent(['laptop', 'phone', 'headphones', 'monitor', 'keyboard'][Math.floor(Math.random() * 5)]);
    const res = http.get(`${BASE_URL}/api/v1/search?q=${query}&limit=20&offset=${Math.floor(Math.random() * 100)}`, {
      headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}` },
      tags: { endpoint: 'search' },
    });
    check(res, {
      'search status 200': (r) => r.status === 200,
      'search response time < 800ms': (r) => r.timings.duration < 800,
    });

  } else {
    // Add to cart (write path -- most latency-sensitive)
    const res = http.post(
      `${BASE_URL}/api/v1/cart/items`,
      JSON.stringify({ product_id: productId, quantity: 1, user_id: userId }),
      {
        headers: {
          Authorization: `Bearer ${__ENV.TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        tags: { endpoint: 'add_to_cart' },
      }
    );
    check(res, {
      'add to cart status 201': (r) => r.status === 201,
      'add to cart response time < 300ms': (r) => r.timings.duration < 300,
    });
  }

  sleep(Math.random() * 2 + 0.5); // Think time: 0.5-2.5 seconds
}
```

---

#### SLO Targets vs. Actuals (Load Test Results at 2,000 RPS)

| Metric            | SLO Target | Product Detail | Search   | Add to Cart | Pass / Fail |
|-------------------|------------|----------------|----------|-------------|-------------|
| P50 Response Time | < 100ms    | 78ms           | 142ms    | 61ms        | ✓           |
| P95 Response Time | < 500ms    | 312ms          | 487ms    | 198ms       | ✓           |
| P99 Response Time | < 1,000ms  | 721ms          | 1,247ms  | 389ms       | ✗ (Search)  |
| Error Rate        | < 0.1%     | 0.02%          | 0.08%    | 0.01%       | ✓           |
| Throughput (RPS)  | > 1,800    | 1,201          | 500      | 299         | ✓ (total)   |

**Primary finding:** Search endpoint P99 violates the 1,000ms SLO at 2,000 RPS total load.

---

#### Bottleneck Summary

| Resource                    | Utilization at Peak | Saturation Signal                 | Status     |
|-----------------------------|---------------------|-----------------------------------|------------|
| App Server CPU (avg 2 nodes)| 58%                 | No saturation observed            | OK         |
| App Server Memory           | 4.1GB / 16GB        | Stable over 30 minutes            | OK         |
| PostgreSQL CPU              | 74%                 | Approaching saturation            | HOT        |
| PgBouncer cl_waiting        | 0-3 connections     | Occasional brief waits            | WATCH      |
| Search Query P99 (DB)       | 1,180ms             | Full seq scan on products table   | CRITICAL   |
| DB Connection Pool (app)    | 18 active / 25 max  | No exhaustion                     | OK         |
| Network throughput          | 340 Mbps / 10 Gbps  | No saturation                     | OK         |

---

#### Root Cause Analysis: Search P99 Violation

Server-side slow query logging (`log_min_duration_statement = 200ms`) revealed that `SELECT * FROM products WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery($1)` was performing a sequential scan on the 12-million-row products table when pagination offset exceeded 10,000.

The query uses a GIN index for full-text search, but the planner abandons the index for high-offset pagination (offset > 10,000) because fetching 10,020 rows and discarding 10,000 is cheaper by the planner's cost model than the index scan at that selectivity.

---

#### Findings and Recommendations

| Severity | Finding                              | Root Cause                                   | Recommended Fix                                                                                                      | Est. Impact          |
|----------|--------------------------------------|----------------------------------------------|----------------------------------------------------------------------------------------------------------------------|----------------------|
| Critical | Search P99 = 1,247ms (SLO: 1,000ms) | Seq scan for search queries with offset > 10,000 | Replace offset pagination with keyset (cursor) pagination. Cache the first 3 pages of top-10 search terms in Redis (TTL 60s). | P99 → ~400ms         |
| High     | PostgreSQL CPU at 74% at 2,000 RPS   | Full-text search queries are CPU-intensive    | Add a read replica and route all search traffic to it. Alternatively, move search to Elasticsearch.                  | DB CPU → ~40%        |
| Medium   | PgBouncer cl_waiting spikes to 3     | Pool of 25 connections may exhaust at 3,000+ RPS | Increase PgBouncer pool_size to 40, set application `max_open_conns` to 35.                                          | Eliminates wait time |
| Low      | No circuit breaker on DB calls       | Cascading failure risk if DB slows further   | Add `golang.org/x/time/rate` rate limiter + exponential backoff on DB error. Return 503 with Retry-After instead of queueing indefinitely. | Improves failure mode |

---

#### Stress Test Finding: Breaking Point

The stress test (gradual ramp to 600 VUs) found the system saturation point at approximately 3,400 RPS:
- At 3,400 RPS: PostgreSQL CPU hits 100%, query latency explodes, P99 exceeds 5,000ms
- Error rate reaches 4.2% (all 503s from application-level timeouts)
- Failure mode is graceful -- application returns 503, does not crash, recovers when load drops

**Conclusion:** The system has a safety margin of 1.7x above target load (3,400 / 2,000). This is acceptable for launch but should be improved to 3x within 60 days.

---

#### Regression Gate (add to CI/CD pipeline)

```yaml
# .github/workflows/perf-test.yml
- name: Run k6 Performance Gate
  run: |
    k6 run \
      --vus 50 \
      --duration 5m \
      --env TEST_TOKEN=${{ secrets.PERF_TEST_TOKEN }} \
      --out influxdb=http://metrics.internal:8086/k6 \
      tests/performance/smoke_gate.js
  env:
    K6_THRESHOLDS_ABORT_ON_FAIL: true
```

The CI gate runs a 5-minute, 50-VU smoke load test (approximately 400 RPS) on every merge to main. It fails the pipeline if P95 > 200ms or error rate > 0.1%. This catches regressions before they reach staging or production.

---

#### Next Steps

- [ ] Implement keyset pagination for search -- Owner: backend team -- ETA: 2024-11-22
- [ ] Add Redis caching for top-50 search terms -- Owner: backend team -- ETA: 2024-11-22
- [ ] Provision PostgreSQL read replica and update search query routing -- Owner: infra team -- ETA: 2024-11-20
- [ ] Re-run full load test after fixes -- Target: 2024-11-25
- [ ] Run 4-hour soak test if load test passes -- Target: 2024-11-26
- [ ] Schedule next routine performance test -- 30 days post-launch
