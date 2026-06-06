---
name: load-tester
description: |
  Load and stress testing expertise covering k6, Locust, and JMeter patterns, test scenario design (smoke, load, stress, spike, soak), virtual user modeling, think time configuration, ramp patterns, performance thresholds, result analysis, bottleneck identification, and cloud load testing strategies.
  Use when the user asks about load tester, load tester best practices, or needs guidance on load tester implementation.
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

# Load Tester

## Core Philosophy

Load testing is about discovering your system's breaking points before your users do. It is not enough to know that your system works -- you need to know how it works under varying levels of demand. Every system has limits; load testing makes those limits visible and actionable.

## Test Scenario Types

### Smoke Test

Verify that the system works under minimal load. Baseline health check.

```javascript
// k6 smoke test
export const options = {
    vus: 1,
    duration: '1m',
    thresholds: {
        http_req_duration: ['p(99)<1500'],
        http_req_failed: ['rate<0.01'],
    },
};
```

### Load Test

Test the system under expected normal and peak load.

```javascript
export const options = {
    stages: [
        { duration: '5m', target: 100 },   // Ramp up to 100 users
        { duration: '30m', target: 100 },   // Steady state at 100
        { duration: '5m', target: 0 },      // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],
    },
};
```

### Stress Test

Push the system beyond normal capacity to find breaking points.

```javascript
export const options = {
    stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 400 },
        { duration: '5m', target: 400 },
        { duration: '2m', target: 800 },    // Push to breaking point
        { duration: '5m', target: 800 },
        { duration: '5m', target: 0 },       // Recovery
    ],
};
```

### Spike Test

Test sudden bursts of traffic.

```javascript
export const options = {
    stages: [
        { duration: '2m', target: 50 },    // Normal load
        { duration: '10s', target: 1000 },  // Spike!
        { duration: '3m', target: 1000 },   // Hold spike
        { duration: '10s', target: 50 },    // Drop back
        { duration: '5m', target: 50 },     // Recovery
        { duration: '2m', target: 0 },
    ],
};
```

### Soak Test

Run at normal load for extended period to detect memory leaks, connection pool exhaustion, and slow degradation.

```javascript
export const options = {
    stages: [
        { duration: '5m', target: 100 },
        { duration: '8h', target: 100 },   // 8 hours at normal load
        { duration: '5m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.005'],
    },
};
```

## k6 (Recommended Tool)

### Complete Test Script

```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const orderCreated = new Counter('orders_created');
const loginFailRate = new Rate('login_failures');
const checkoutDuration = new Trend('checkout_duration');

export const options = {
    scenarios: {
        browse: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 50 },
                { duration: '10m', target: 50 },
                { duration: '2m', target: 0 },
            ],
            run-cmd: 'browseProducts',
        },
        purchase: {
            executor: 'constant-arrival-rate',
            rate: 10,              // 10 iterations per second
            timeUnit: '1s',
            duration: '10m',
            preAllocatedVUs: 50,
            run-cmd: 'purchaseFlow',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1500'],
        http_req_failed: ['rate<0.01'],
        'http_req_duration{name:checkout}': ['p(95)<2000'],
        orders_created: ['count>100'],
        login_failures: ['rate<0.05'],
    },
};

const BASE_URL = __ENV.BASE_URL || '[reference URL]';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

// Setup: run once before all VUs
export function setup() {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
        email: 'loadtest@example.com',
        password: 'test-password',
    }), { headers: { 'Content-Type': 'application/json' } });

    return { token: loginRes.json('token') };
}

// Scenario: Browse products
export function browseProducts() {
    group('Browse', () => {
        // Homepage
        const homeRes = http.request(`${BASE_URL}/`, { tags: { name: 'homepage' } });
        check(homeRes, {
            'homepage status 200': (r) => r.status === 200,
            'homepage loads < 1s': (r) => r.timings.duration < 1000,
        });

        sleep(randomBetween(1, 3));  // Think time

        // Product listing
        const listRes = http.request(`${BASE_URL}/api/products?page=1&limit=20`, {
            tags: { name: 'product_list' },
        });
        check(listRes, { 'product list status 200': (r) => r.status === 200 });

        sleep(randomBetween(2, 5));

        // Product detail
        const products = listRes.json('items');
        if (products && products.length > 0) {
            const product = products[Math.floor(Math.random() * products.length)];
            const detailRes = http.request(`${BASE_URL}/api/products/${product.id}`, {
                tags: { name: 'product_detail' },
            });
            check(detailRes, { 'product detail status 200': (r) => r.status === 200 });
        }

        sleep(randomBetween(1, 3));
    });
}

// Scenario: Purchase flow
export function purchaseFlow(data) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`,
    };

    group('Purchase', () => {
        // Add to cart
        const cartRes = http.post(`${BASE_URL}/api/cart/items`, JSON.stringify({
            product_id: `prod_${Math.floor(Math.random() * 100)}`,
            quantity: 1,
        }), { headers, tags: { name: 'add_to_cart' } });

        check(cartRes, { 'add to cart': (r) => r.status === 200 || r.status === 201 });
        sleep(1);

        // Checkout
        const startCheckout = Date.now();
        const checkoutRes = http.post(`${BASE_URL}/api/checkout`, JSON.stringify({
            payment_method: 'test_card',
            shipping_address: { street: '123 Test St', city: 'Portland', zip: '97201' },
        }), { headers, tags: { name: 'checkout' } });

        checkoutDuration.add(Date.now() - startCheckout);

        const checkoutOk = check(checkoutRes, {
            'checkout success': (r) => r.status === 200 || r.status === 201,
        });

        if (checkoutOk) {
            orderCreated.add(1);
        }
    });
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}
```

### k6 Configuration

```javascript
// Running k6
// k6 run --env BASE_URL=[reference URL] script.js
// k6 run --out json=results.json script.js
// k6 run --out influxdb=[reference URL] script.js

// Output to multiple backends
// k6 run --out json=results.json --out influxdb=[reference URL] script.js
```

## Locust (Python)

```python
from locust import HttpUser, task, between, events
import json
import random

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)  # Think time between tasks
    host = "[reference URL]"

    def on_start(self):
        """Login on start."""
        response = self.client.post("/api/auth/login", json={
            "email": "loadtest@example.com",
            "password": "test-password"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(5)  # Weight: 5x more likely than weight-1 tasks
    def browse_products(self):
        self.client.get("/api/products?page=1&limit=20", name="/api/products")

    @task(3)
    def view_product(self):
        product_id = random.randint(1, 100)
        self.client.get(f"/api/products/{product_id}", name="/api/products/[id]")

    @task(1)
    def checkout(self):
        # Add to cart
        self.client.post("/api/cart/items", json={
            "product_id": f"prod_{random.randint(1, 100)}",
            "quantity": 1
        }, headers=self.headers, name="/api/cart/items")

        # Checkout
        with self.client.post("/api/checkout", json={
            "payment_method": "test_card"
        }, headers=self.headers, name="/api/checkout",
           catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 429:
                response.failure("Rate limited")
            else:
                response.failure(f"Status: {response.status_code}")

# Run: locust -f locustfile.py --headless -u 100 -r 10 --run-time 10m
# -u: total users, -r: spawn rate (users/second)
```

## Virtual User Modeling

### Think Time

Real users pause between actions. Model this to simulate realistic load.

```javascript
// k6: Variable think time
sleep(randomBetween(1, 5));   // 1-5 seconds between actions

// Lognormal distribution (more realistic)
function lognormalSleep(median, sigma) {
    const u = Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    sleep(Math.exp(Math.log(median) + sigma * z));
}
lognormalSleep(2, 0.5);  // Median 2s, some users faster, some slower
```

### User Profiles

```javascript
// Different user types with different behaviors
export const options = {
    scenarios: {
        casual_browsers: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [{ duration: '10m', target: 200 }],
            run-cmd: 'casualBrowse',
        },
        power_shoppers: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [{ duration: '10m', target: 30 }],
            run-cmd: 'powerShop',
        },
        api_integrations: {
            executor: 'constant-arrival-rate',
            rate: 50,
            timeUnit: '1s',
            duration: '10m',
            preAllocatedVUs: 20,
            run-cmd: 'apiIntegration',
        },
    },
};
```

## Performance Thresholds

### Key Metrics

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Response time (p50) | < 200ms | < 500ms | > 1s |
| Response time (p95) | < 500ms | < 1s | > 2s |
| Response time (p99) | < 1s | < 2s | > 5s |
| Error rate | < 0.1% | < 1% | > 5% |
| Throughput | Meets SLA | 80% SLA | < 50% SLA |

### Setting Thresholds in k6

```javascript
export const options = {
    thresholds: {
        // Global thresholds
        http_req_duration: [
            'p(50)<200',   // 50th percentile under 200ms
            'p(95)<500',   // 95th percentile under 500ms
            'p(99)<1500',  // 99th percentile under 1500ms
            'max<5000',    // No request over 5 seconds
        ],
        http_req_failed: ['rate<0.01'],  // Less than 1% failure

        // Per-endpoint thresholds
        'http_req_duration{name:homepage}': ['p(95)<300'],
        'http_req_duration{name:checkout}': ['p(95)<2000'],
        'http_req_duration{name:api_search}': ['p(95)<800'],

        // Custom metrics
        'checkout_duration': ['p(95)<3000'],
        'orders_created': ['count>50'],
    },
};
```

## Result Analysis

### Key Analysis Areas

```
1. RESPONSE TIME DISTRIBUTION
   - Plot p50, p90, p95, p99 over time
   - Look for: sudden increases, bimodal distributions, gradual degradation

2. ERROR RATE
   - Track 4xx and 5xx errors separately
   - Common: 429 (rate limiting), 503 (overload), 504 (timeout)

3. THROUGHPUT
   - Requests per second (RPS) over time
   - Does RPS plateau while VUs increase? -> System is saturated

4. RESOURCE UTILIZATION (server-side)
   - CPU: > 80% sustained is concerning
   - Memory: Watch for gradual increase (leak)
   - Disk I/O: High IOPS can indicate missing indexes
   - Network: Check bandwidth saturation
   - Connection pools: Exhaustion causes queuing

5. SATURATION INDICATORS
   - RPS stops increasing with more VUs
   - Response times increase non-linearly
   - Error rate spikes at specific concurrency level
```

### Bottleneck Identification

```
Response times high + CPU high + low error rate
  -> Application is CPU-bound (optimize code, scale horizontally)

Response times high + CPU low + DB connections maxed
  -> Database connection pool exhausted (increase pool size, optimize queries)

Response times high + CPU low + high I/O wait
  -> Disk I/O bottleneck (add indexes, use caching, upgrade storage)

Response times increasing linearly with VUs
  -> Single-threaded bottleneck or lock contention

Periodic spikes in response time
  -> Garbage collection, cron jobs, or auto-scaling events

503 errors at specific VU count
  -> Connection limit, worker count, or rate limiting
```

## Cloud Load Testing

### k6 Cloud

```javascript
// Run from multiple geographic locations
export const options = {
    ext: {
        loadimpact: {
            projectID: 12345,
            name: 'Production Load Test',
            distribution: {
                'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 50 },
                'amazon:eu:dublin': { loadZone: 'amazon:eu:dublin', percent: 30 },
                'amazon:ap:tokyo': { loadZone: 'amazon:ap:tokyo', percent: 20 },
            },
        },
    },
};

// Run: k6 cloud script.js
```

### Grafana + InfluxDB Dashboard

```shell
# Stream k6 results to InfluxDB for Grafana dashboards
k6 run --out influxdb=[reference URL] script.js
```

```json
// Grafana dashboard panels:
// 1. Response time percentiles (line chart)
// 2. Requests per second (line chart)
// 3. Error rate (line chart)
// 4. Virtual users over time (line chart)
// 5. Response time by endpoint (bar chart)
// 6. Error breakdown by type (pie chart)
```

## Pre-Test Checklist

```
[ ] Test environment mirrors production (or is a known fraction)
[ ] Test data is seeded and representative
[ ] Monitoring/APM is active on the target environment
[ ] Database has production-representative data volume
[ ] CDN/caching is configured as in production
[ ] Auto-scaling is documented (will it trigger during test?)
[ ] Stakeholders are notified (avoid false alarms)
[ ] Baseline metrics from previous test are available for comparison
[ ] Rate limiting/WAF rules are accounted for
[ ] Test credentials are created and functional
```

## When to Use

**Use this skill when:**
- Designing or implementing load tester solutions
- Reviewing or improving existing load tester approaches
- Making architectural or implementation decisions about load tester
- Learning load tester patterns and best practices
- Troubleshooting load tester-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Load Tester Analysis

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

**Input:** "Help me implement load tester for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended load tester approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When load tester must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
