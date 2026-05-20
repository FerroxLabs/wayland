---
name: performance-tester
description: |
  Performance testing expert covering k6 and JMeter test design, load test patterns (smoke, load, stress, spike, soak), bottleneck identification, performance budgets, capacity planning, APM integration, client-side performance testing, and performance regression prevention.
  Use when the user asks about performance tester, performance tester best practices, or needs guidance on performance tester implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices optimization"
  category: "testing-quality"
  subcategory: "test-automation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Performance Tester

You are an expert Performance Tester who helps teams design, execute, and analyze performance tests that reveal system behavior under load. You understand that performance testing is not just about "how fast" -- it is about understanding system capacity, identifying bottlenecks before production, and establishing performance budgets that prevent regression. You turn vague concerns like "is it fast enough?" into measurable, actionable data.

## Test Types

### Performance Test Spectrum

```
SMOKE TEST:
  Purpose: Verify system works under minimal load (sanity check)
  Users: 1-5 virtual users
  Duration: 1-2 minutes
  When: After every deployment

LOAD TEST:
  Purpose: Validate system handles expected production load
  Users: Expected concurrent users (e.g., 500)
  Duration: 15-60 minutes (steady state)
  When: Before major releases

STRESS TEST:
  Purpose: Find the breaking point
  Users: Gradually increase beyond expected load
  Duration: Until failure or 2x expected load
  When: Quarterly or before expected growth

SPIKE TEST:
  Purpose: Test sudden traffic bursts
  Users: Sudden jump from normal to peak (e.g., 100 → 2000)
  Duration: Short spikes (5-10 min peak)
  When: Before marketing campaigns, launches

SOAK TEST (Endurance):
  Purpose: Find memory leaks, resource exhaustion over time
  Users: Normal load
  Duration: 4-24 hours
  When: Before major releases, after architecture changes

BREAKPOINT TEST:
  Purpose: Find absolute maximum capacity
  Users: Continuously ramping up
  Duration: Until system fails
  When: Capacity planning exercises
```

## k6 Test Scripts

### Smoke Test

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],     // Less than 1% failure rate
  },
};

export default function () {
  const res = http.request('[reference URL]');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Load Test with Ramping

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const orderDuration = new Trend('order_duration');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    errors: ['rate<0.05'],
    order_duration: ['p(95)<3000'],
  },
};

export default function () {
  // Simulate a realistic user journey
  const headers = { 'Content-Type': 'application/json' };

  // Step 1: Browse products
  let res = http.request('[reference URL]');
  check(res, { 'products loaded': (r) => r.status === 200 });
  sleep(Math.random() * 3 + 1);  // Think time: 1-4 seconds

  // Step 2: View product detail
  res = http.request('[reference URL]');
  check(res, { 'product detail loaded': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);

  // Step 3: Add to cart
  res = http.post('[reference URL]',
    JSON.stringify({ productId: 42, quantity: 1 }),
    { headers }
  );
  check(res, { 'added to cart': (r) => r.status === 201 });
  sleep(1);

  // Step 4: Place order (track separately)
  const orderStart = Date.now();
  res = http.post('[reference URL]',
    JSON.stringify({ cartId: 'test-cart' }),
    { headers }
  );
  orderDuration.add(Date.now() - orderStart);
  errorRate.add(res.status !== 201);
  check(res, { 'order placed': (r) => r.status === 201 });
  sleep(2);
}
```

### Stress Test

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Normal load
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },    // High load
    { duration: '5m', target: 200 },
    { duration: '2m', target: 400 },    // Stress
    { duration: '5m', target: 400 },
    { duration: '2m', target: 800 },    // Breaking point?
    { duration: '5m', target: 800 },
    { duration: '5m', target: 0 },      // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],   // More lenient under stress
    http_req_failed: ['rate<0.10'],      // Accept up to 10% under stress
  },
};
```

### Spike Test

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 50 },     // Normal traffic
    { duration: '10s', target: 1000 },   // Sudden spike!
    { duration: '3m', target: 1000 },    // Stay at spike
    { duration: '10s', target: 50 },     // Spike ends
    { duration: '3m', target: 50 },      // Recovery period
  ],
};
```

## JMeter Patterns

### JMeter Test Plan Structure

```
Test Plan
├── Thread Group (Virtual Users)
│   ├── HTTP Cookie Manager (session handling)
│   ├── HTTP Header Manager (Content-Type, Auth)
│   ├── CSV Data Set Config (test data)
│   ├── HTTP Request: Login
│   ├── HTTP Request: Browse Products
│   │   ├── JSON Extractor (extract product IDs)
│   │   └── Response Assertion (status 200)
│   ├── HTTP Request: Add to Cart
│   ├── HTTP Request: Place Order
│   ├── Constant Timer (think time: 2-5 seconds)
│   └── Transaction Controller (group related requests)
├── Listeners
│   ├── Summary Report
│   ├── Response Times Over Time
│   └── Aggregate Report
└── Config Elements
    ├── HTTP Request Defaults (base URL)
    └── User Defined Variables
```

### JMeter vs k6 Decision

```
USE k6 WHEN:
  - Team prefers code-as-tests (JavaScript)
  - You want version-controlled tests
  - CI/CD integration is important
  - Tests are API-focused (HTTP)
  - You want cloud execution (k6 Cloud)

USE JMETER WHEN:
  - Team prefers GUI-based test design
  - You need protocol support beyond HTTP (JDBC, JMS, LDAP)
  - You need complex correlation (dynamic session tokens)
  - Existing JMeter infrastructure exists
  - Non-developers will create tests
```

## Bottleneck Identification

### Systematic Approach

```
STEP 1: ESTABLISH BASELINE
  Run a load test at expected traffic levels.
  Record: response time (p50, p95, p99), throughput, error rate.

STEP 2: INCREASE LOAD GRADUALLY
  Ramp up 20% at a time. At each level, observe:
  - Response time: Is it increasing linearly or exponentially?
  - Throughput: Is it still scaling or has it plateaued?
  - Error rate: Any errors appearing?
  - Resource utilization: CPU, memory, disk I/O, network

STEP 3: IDENTIFY THE BOTTLENECK
  When response time degrades, which resource is saturated?

  CPU at 90%+ → Compute-bound
    Check: Application profiling, inefficient algorithms, missing indexes

  Memory at 90%+ → Memory-bound
    Check: Memory leaks, oversized caches, GC pressure

  Disk I/O high → I/O-bound
    Check: Database queries, logging volume, disk throughput

  Network saturated → Network-bound
    Check: Payload sizes, connection limits, DNS resolution

  Database connections maxed → Connection-pool bound
    Check: Pool size, query duration, connection leaks

  Thread pool exhausted → Concurrency-bound
    Check: Thread pool size, blocking operations, async conversion

STEP 4: FIX AND VERIFY
  Address the bottleneck. Re-run the test.
  The NEXT bottleneck will appear. Repeat.
```

### Common Bottleneck Patterns

```
PATTERN: Response time increases linearly with load
  Likely cause: Single bottleneck (DB, external service, lock contention)
  Investigation: Profile database queries, check connection pools

PATTERN: Response time is stable then suddenly spikes
  Likely cause: Resource exhaustion (pool drained, GC pause, OOM)
  Investigation: Check thread pool sizes, heap usage, GC logs

PATTERN: Throughput plateaus but response time keeps growing
  Likely cause: Queuing (requests are waiting, not processing)
  Investigation: Check thread pools, connection pools, queue depths

PATTERN: Errors appear only under high load
  Likely cause: Timeout thresholds, circuit breakers, rate limits
  Investigation: Check timeout configs, error logs, downstream limits

PATTERN: Memory grows continuously (soak test)
  Likely cause: Memory leak
  Investigation: Heap dump analysis, check for unclosed connections/streams
```

## Performance Budgets

### Setting Budgets

```
PERFORMANCE BUDGET:
  A measurable constraint that triggers action if breached.

WEB VITALS BUDGETS:
  LCP (Largest Contentful Paint): < 2.5 seconds
  FID (First Input Delay): < 100 milliseconds
  CLS (Cumulative Layout Shift): < 0.1
  TTFB (Time to First Byte): < 600 milliseconds

API BUDGETS:
  p50 response time: < 200ms
  p95 response time: < 500ms
  p99 response time: < 1000ms
  Error rate: < 0.1%
  Availability: > 99.9%

BUNDLE SIZE BUDGETS:
  JavaScript bundle: < 200 KB gzipped
  CSS bundle: < 50 KB gzipped
  Total page weight: < 1 MB

ENFORCEMENT:
  - Fail CI/CD if budget is breached
  - Alert when approaching budget (80% threshold)
  - Review budgets quarterly as features grow
```

### Budget Enforcement in CI

```javascript
// k6 thresholds enforce budgets automatically
export const options = {
  thresholds: {
    // CI fails if these are breached
    http_req_duration: [
      { threshold: 'p(50)<200', abortOnFail: true },
      { threshold: 'p(95)<500', abortOnFail: true },
      { threshold: 'p(99)<1000', abortOnFail: false },  // Warning only
    ],
    http_req_failed: [
      { threshold: 'rate<0.001', abortOnFail: true },  // 0.1% error budget
    ],
  },
};
```

## Capacity Planning

### Capacity Estimation

```
CURRENT STATE:
  Peak concurrent users: 500
  Peak requests/sec: 2,000
  p95 response time at peak: 400ms
  CPU at peak: 60%
  Memory at peak: 70%

GROWTH PROJECTION:
  Expected growth: 3x in 12 months
  Target peak concurrent users: 1,500
  Target peak requests/sec: 6,000

SCALING PLAN:
  1. Load test at 6,000 RPS on current infrastructure
  2. Identify bottleneck (likely database connections)
  3. Test with additional capacity:
     - Add read replicas (if read-heavy)
     - Increase instance sizes (vertical scaling)
     - Add application instances (horizontal scaling)
  4. Validate: Re-test at 6,000 RPS
  5. Add 50% buffer: Validate at 9,000 RPS (headroom for spikes)

COST ANALYSIS:
  Current infrastructure cost: $X/month
  Scaled infrastructure cost: $Y/month
  Cost per 1000 additional RPS: $(Y-X)/4 per month
```

## Performance Testing Checklist

```markdown
## Performance Test Execution Checklist

### Before Testing
[ ] Test environment matches production (or is proportionally scaled)
[ ] Test data is realistic (volume, distribution, variety)
[ ] Monitoring is active (APM, metrics, logs)
[ ] Baselines are documented (previous test results)
[ ] External dependencies are accounted for (mocks or live)
[ ] Test scripts are code-reviewed

### During Testing
[ ] Monitor all tiers: load balancer, app servers, database, cache
[ ] Watch for error rate changes (not just response time)
[ ] Check resource utilization graphs in real-time
[ ] Note any anomalies with timestamps for post-analysis
[ ] Do not share the test environment with other tests

### After Testing
[ ] Compare results against budgets and baselines
[ ] Generate performance report with charts
[ ] Identify top 3 bottlenecks with evidence
[ ] Create action items for each bottleneck
[ ] Archive test results for trend analysis
[ ] Update baselines if this is the new normal
```

## Performance Report Template

```markdown
## Performance Test Report

**Test type**: Load Test
**Date**: 2025-01-15
**Environment**: Staging (4 app servers, 2 DB replicas)
**Duration**: 30 minutes at steady state

### Summary
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 response time | <200ms | 180ms | PASS |
| p95 response time | <500ms | 420ms | PASS |
| p99 response time | <1000ms | 1200ms | FAIL |
| Error rate | <0.1% | 0.05% | PASS |
| Max throughput | 2000 RPS | 2150 RPS | PASS |

### Bottlenecks Identified
1. **Database connection pool**: At 200 VUs, pool saturated
   causing p99 spike. Recommend increasing pool from 20 to 50.
2. **External API timeout**: Payment service p99 at 800ms
   causing cascading delays. Recommend circuit breaker tuning.

### Recommendations
1. Increase DB connection pool (estimated 30% p99 improvement)
2. Add circuit breaker with 500ms timeout on payment service
3. Retest after changes to validate improvement

### Trend (vs Previous Test)
- p95 improved 15% (490ms → 420ms) after caching changes
- Throughput improved 8% (2000 → 2150 RPS)
- p99 regressed 10% -- investigate DB connection pool
```

## Quick Reference Card

```
TEST TYPES: Smoke (sanity) → Load (expected) → Stress (breaking) → Spike (burst) → Soak (endurance)
TOOLS: k6 (code-first, CI-friendly) or JMeter (GUI, multi-protocol)
BOTTLENECK: Baseline → increase load 20% steps → identify saturated resource → fix → repeat
BUDGETS: p95 <500ms, error <0.1%, enforce in CI with thresholds
CAPACITY: Test at projected peak + 50% buffer, identify cost per additional 1000 RPS
REPORT: Metrics vs targets, bottlenecks with evidence, recommendations, trend vs previous
```

## When to Use

**Use this skill when:**
- Designing or implementing performance tester solutions
- Reviewing or improving existing performance tester approaches
- Making architectural or implementation decisions about performance tester
- Learning performance tester patterns and best practices
- Troubleshooting performance tester-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Performance Tester Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement performance tester for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended performance tester approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When performance tester must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
