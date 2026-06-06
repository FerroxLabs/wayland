---
name: capacity-planner
description: |
  Capacity planning expertise covering load testing methodologies, autoscaling policies, resource forecasting, performance budgets, cost-capacity curves, bottleneck identification, queue theory basics, and building capacity models for production systems.
  Use when the user asks about capacity planner, capacity planner best practices, or needs guidance on capacity planner implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud planning"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Capacity Planner

You are an expert capacity planner who ensures systems have enough resources to handle current load and predictable growth, without over-provisioning and wasting money. Capacity planning is the discipline that answers: "How much do we need, when will we need more, and how much will it cost?" Get it wrong on the low side and you have outages. Get it wrong on the high side and you waste thousands in unused infrastructure.

## Capacity Planning Process

### The Four Questions

```
1. WHERE ARE WE NOW?
   - Current resource utilization (CPU, memory, disk, network, connections)
   - Current request rate, latency, error rate
   - Current cost per unit of work

2. WHERE ARE WE GOING?
   - Traffic growth projections (historical trend + planned events)
   - Feature roadmap impact (new features that change load profile)
   - Seasonal patterns (Black Friday, tax season, school year)

3. WHEN WILL WE HIT LIMITS?
   - At current growth rate, when does each resource saturate?
   - Which resource saturates first? (the bottleneck)
   - What is the cost to push that limit?

4. WHAT SHOULD WE DO ABOUT IT?
   - Scale vertically (bigger instances)?
   - Scale horizontally (more instances)?
   - Optimize (reduce resource usage per request)?
   - Cache (reduce the number of requests that hit backend)?
```

## Load Testing

### Load Testing Types

| Type | Purpose | How | Duration |
|------|---------|-----|----------|
| **Smoke test** | Verify system works under minimal load | 1-5 VUs, happy path | 1-2 min |
| **Load test** | Validate performance at expected load | Expected VUs, realistic scenario | 10-30 min |
| **Stress test** | Find the breaking point | Ramp up until failure | 30-60 min |
| **Soak test** | Find memory leaks, resource exhaustion | Moderate load, extended time | 2-12 hours |
| **Spike test** | Validate behavior under sudden traffic surge | Sudden jump to peak load | 5-10 min |
| **Breakpoint test** | Find maximum capacity | Gradual increase until SLO breach | 30-60 min |

### k6 Load Test Examples

```javascript
// load-test.js - Standard load test
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const orderLatency = new Trend('order_latency');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95th < 500ms, 99th < 1s
    errors: ['rate<0.01'],                             // Error rate < 1%
    order_latency: ['p(95)<800'],                      // Order API < 800ms p95
  },
};

export default function () {
  // Simulate realistic user behavior
  const headers = { 'Content-Type': 'application/json' };

  // Browse products (80% of traffic)
  if (Math.random() < 0.8) {
    const res = http.request('[reference URL]');
    check(res, { 'products 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    sleep(Math.random() * 3 + 1);  // 1-4 seconds think time
  }

  // Place order (20% of traffic)
  if (Math.random() < 0.2) {
    const start = Date.now();
    const res = http.post('[reference URL]',
      JSON.stringify({ items: [{ id: 'prod_1', qty: 1 }] }),
      { headers }
    );
    orderLatency.add(Date.now() - start);
    check(res, { 'order 201': (r) => r.status === 201 });
    errorRate.add(res.status >= 400);
  }

  sleep(1);
}
```

```javascript
// stress-test.js - Find the breaking point
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '2m', target: 400 },
    { duration: '5m', target: 400 },
    { duration: '5m', target: 0 },
  ],
  // No thresholds - we WANT to see where it breaks
};
```

### Interpreting Load Test Results

```
HEALTHY SYSTEM:
  Latency:    p50=50ms, p95=150ms, p99=300ms (stable, low variance)
  Throughput: 5,000 req/sec (linear with virtual users)
  Errors:     <0.1% (random, not correlated with load)
  CPU:        60% utilization (headroom for spikes)

APPROACHING LIMIT:
  Latency:    p50=80ms, p95=500ms, p99=2000ms (growing variance = queueing)
  Throughput: 5,000 req/sec (plateauing despite more VUs = saturated)
  Errors:     1-5% (timeouts beginning)
  CPU:        85%+ (nearing saturation)

PAST LIMIT:
  Latency:    p50=500ms, p95=5000ms, p99=timeout (everything slow)
  Throughput: 3,000 req/sec (DECREASING = collapse under load)
  Errors:     >10% (timeouts, 503s, connection refused)
  CPU:        100% (fully saturated, thrashing)

KEY INSIGHT: When throughput decreases as you add more load,
you have exceeded capacity. The system is spending more time
managing overload (queueing, retrying, garbage collecting)
than doing useful work.
```

## Autoscaling Policies

### Horizontal Pod Autoscaler (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 20
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # Wait 60s before scaling up more
      policies:
        - type: Percent
          value: 50                     # Scale up by at most 50% at a time
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5min before scaling down
      policies:
        - type: Percent
          value: 25                     # Scale down by at most 25% at a time
          periodSeconds: 120
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70       # Target 70% CPU
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"          # Target 100 req/s per pod
```

### Autoscaling Metric Selection

| Metric | Good For | Watch Out For |
|--------|----------|---------------|
| **CPU** | Compute-bound services | IO-bound services show low CPU even when saturated |
| **Memory** | Memory-intensive workloads | Slow to reflect load changes (GC delays) |
| **Request rate** | Web servers, APIs | Does not account for request complexity |
| **Queue depth** | Worker/consumer services | Needs custom metrics pipeline |
| **Latency** | User-facing services | Lagging indicator (slow AFTER saturation) |
| **Custom business metric** | Specific workloads | Requires metrics instrumentation |

### Autoscaling Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Scaling on CPU for IO-bound service | CPU stays low while service is saturated on DB connections | Scale on request latency or queue depth |
| Too aggressive scale-down | Pods removed, traffic spikes, pods added, repeat (thrashing) | Use stabilization window (5+ min for scale-down) |
| No minimum replicas | Scale to 0, cold start on first request | Set minReplicas >= 2 for availability |
| Scaling on average latency | One slow endpoint skews the metric | Scale on p95 or per-endpoint metrics |
| No max replicas | Runaway scaling costs a fortune | Always set maxReplicas with cost awareness |

## Resource Forecasting

### Capacity Model Template

```
SERVICE: order-api
DATE: 2025-01-15
CURRENT STATE:
  Pods: 5 (4 CPU, 8GB RAM each)
  Peak traffic: 2,500 req/sec
  CPU at peak: 65%
  Memory at peak: 4.2 GB / 8 GB
  DB connections at peak: 80 / 100 pool

PER-POD CAPACITY:
  Max throughput per pod: ~770 req/sec (at 100% CPU)
  Comfortable throughput per pod: ~500 req/sec (at 65% CPU)

GROWTH:
  Traffic growth rate: 15% per quarter
  Seasonal peak: 2.5x during Q4 (holiday season)

FORECAST:
  Q2 2025: 2,875 req/sec peak → 6 pods needed
  Q3 2025: 3,306 req/sec peak → 7 pods needed
  Q4 2025: 3,802 req/sec peak x 2.5 seasonal = 9,505 → 19 pods

BOTTLENECK: Database connections
  At 19 pods x 20 connections/pod = 380 connections
  DB max_connections = 500 (76% utilization)
  ACTION: Increase DB connection limit to 750 before Q4

COST:
  Current: 5 pods x $0.17/hr = $612/month
  Q4 peak: 19 pods x $0.17/hr = $2,330/month (autoscale; average ~$1,400)
```

### Little's Law (Queue Theory Essential)

```
L = lambda * W

WHERE:
  L = average number of items in the system (concurrency)
  lambda = arrival rate (requests per second)
  W = average time in the system (latency)

EXAMPLE:
  Your API handles 500 req/sec with 200ms average latency
  L = 500 * 0.2 = 100 concurrent requests

  If latency doubles to 400ms (due to slower DB):
  L = 500 * 0.4 = 200 concurrent requests

  You now need TWICE the concurrency capacity for the SAME throughput.
  This is why latency increases cause cascading failures:
  more connections held open -> connection pools exhaust -> errors -> retries -> more load

APPLICATION:
  Thread pool size = target_throughput * average_latency
  Connection pool = target_throughput * average_db_query_time

  If you need 1000 req/sec and avg DB query is 10ms:
  Connection pool >= 1000 * 0.01 = 10 connections minimum
  Add 2-3x headroom: 20-30 connections
```

## Performance Budgets

### Defining Performance Budgets

```
PER-REQUEST BUDGET (example: API endpoint):
  Total: 200ms (p95 target)
  ├── Network (ingress/egress): 10ms
  ├── Authentication middleware: 5ms
  ├── Input validation: 2ms
  ├── Business logic: 20ms
  ├── Database query (primary): 50ms
  ├── Cache lookup: 5ms
  ├── External API call: 80ms
  ├── Serialization: 5ms
  └── Headroom: 23ms

PER-PAGE BUDGET (example: web page):
  Time to First Byte: < 200ms
  First Contentful Paint: < 1.5s
  Largest Contentful Paint: < 2.5s
  Total Blocking Time: < 200ms
  Cumulative Layout Shift: < 0.1
  JavaScript bundle: < 200KB gzipped
  Total page weight: < 1MB
```

### Monitoring Budget Compliance

```yaml
# Prometheus alerting rules for performance budgets
groups:
  - name: performance-budget
    rules:
      - alert: APILatencyBudgetExceeded
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket{handler="create_order"}[5m])
          ) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Order API p95 latency exceeds 500ms budget"

      - alert: DatabaseQueryBudgetExceeded
        expr: |
          histogram_quantile(0.95,
            rate(db_query_duration_seconds_bucket[5m])
          ) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database p95 query time exceeds 100ms budget"
```

## Cost-Capacity Curves

### Modeling Cost per Request

```
COMPUTE COST PER REQUEST:

  Instance cost: $0.17/hour (c5.xlarge: 4 vCPU, 8GB)
  Capacity per instance: 500 req/sec at target utilization
  Seconds per hour: 3,600
  Requests per hour per instance: 500 * 3,600 = 1,800,000
  Cost per request: $0.17 / 1,800,000 = $0.000000094 (~$0.094 per million)

SCALING CHARACTERISTICS:
  Linear scaling (stateless API):
    Cost scales linearly with traffic. 2x traffic = 2x cost.

  Sub-linear scaling (with caching):
    Cache absorbs read traffic. 2x traffic ~ 1.3x cost.

  Super-linear scaling (database-bound):
    DB contention grows non-linearly. 2x traffic = 3x cost.
    Sign you need to shard or read-replica.
```

### Cost Optimization Strategies

| Strategy | Savings | Effort | Risk |
|----------|---------|--------|------|
| Right-size instances | 20-40% | Low | Low |
| Reserved/committed use | 30-60% | Low | Medium (lock-in) |
| Spot/preemptible instances | 60-80% | Medium | Medium (interruptions) |
| Autoscaling (scale down off-peak) | 30-50% | Medium | Low |
| Caching (reduce backend calls) | 40-70% | Medium | Low |
| Code optimization | 10-50% | High | Low |
| Architecture change (e.g., serverless) | Varies | Very High | Medium |

## Bottleneck Identification

### The USE Method for Each Resource

```
FOR EACH RESOURCE (CPU, memory, disk, network, DB pool, etc.):

  Utilization: What percentage of capacity is being used?
    CPU: avg(rate(container_cpu_usage_seconds_total[5m]))
    Memory: container_memory_usage_bytes / container_spec_memory_limit_bytes
    Disk: node_filesystem_avail_bytes / node_filesystem_size_bytes
    DB pool: active_connections / max_connections

  Saturation: Is work being queued?
    CPU: load average > number of CPUs
    Memory: swap usage > 0
    Disk: IO queue depth > 1
    DB pool: waiting_for_connection_count > 0

  Errors: Are there error conditions?
    CPU: kernel panics, machine checks
    Memory: OOM kills
    Disk: IO errors
    DB pool: connection timeout errors

THE BOTTLENECK IS:
  The first resource to hit high utilization OR saturation.
  Fix this one. Then re-measure. The next bottleneck will emerge.
```

### Common Bottleneck Locations

```
REQUEST PATH:
  Client -> CDN -> Load Balancer -> API Server -> Database
                                               -> Cache
                                               -> External API

BOTTLENECK HUNT (in order of likelihood):
  1. Database (most common): slow queries, connection exhaustion, lock contention
  2. External APIs: slow third-party, rate limited, timeout cascade
  3. Application: CPU-bound computation, memory pressure, GC pauses
  4. Network: bandwidth saturation (rare), DNS resolution, TLS handshake
  5. Load balancer: connection limits, health check overhead
  6. CDN: cache miss rate, origin pull bandwidth
```

## Capacity Planning Checklist

- [ ] Current resource utilization baselined for all services
- [ ] Load tests run for realistic traffic patterns
- [ ] Stress tests identify breaking points for each service
- [ ] Autoscaling configured with appropriate metrics and policies
- [ ] Scale-up and scale-down stabilization windows set
- [ ] Performance budgets defined for critical paths
- [ ] Growth forecast model built with historical data
- [ ] Seasonal peaks identified and capacity pre-provisioned
- [ ] Bottleneck analysis completed (USE method for each resource)
- [ ] Cost-per-request calculated and optimized
- [ ] Little's Law applied to size connection pools and thread pools
- [ ] Capacity review scheduled quarterly (or before major launches)
- [ ] Alerting configured for early warning (80% utilization thresholds)
- [ ] Runbook for emergency scaling documented and tested

## When to Use

**Use this skill when:**
- Designing or implementing capacity planner solutions
- Reviewing or improving existing capacity planner approaches
- Making architectural or implementation decisions about capacity planner
- Learning capacity planner patterns and best practices
- Troubleshooting capacity planner-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Capacity Planner Analysis

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

**Input:** "Help me implement capacity planner for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended capacity planner approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When capacity planner must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
