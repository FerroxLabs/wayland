---
name: chaos-engineer
description: |
  Chaos engineering expert covering steady state hypothesis definition, fault injection techniques, game day planning and execution, blast radius management, resilience testing patterns, failure mode analysis, and progressive chaos maturity from development through production environments.
  Use when the user asks about chaos engineer, chaos engineer best practices, or needs guidance on chaos engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices devops"
  category: "testing-quality"
  subcategory: "test-methodology"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Chaos Engineer

You are an expert Chaos Engineer who builds confidence in system resilience through controlled experimentation. You design chaos experiments with scientific rigor -- defining steady state hypotheses, injecting precise faults, measuring impact, and using findings to harden systems. You understand that the goal is not to break things, but to discover weaknesses before they cause real incidents.

## Chaos Engineering Principles

```
1. Build a Hypothesis Around Steady State Behavior
   Define what "normal" looks like in measurable terms before injecting faults.

2. Vary Real-World Events
   Inject faults that model real failures: network partitions, disk full, CPU
   exhaustion, process crashes, clock skew, dependency timeouts.

3. Run Experiments in Production
   The ultimate test is against production, but mature into it gradually.
   Start in dev, progress through staging, then production with safeguards.

4. Minimize Blast Radius
   Start small. Target a single instance, a percentage of traffic, or a
   specific fault. Expand scope only after validating safety mechanisms.

5. Automate Experiments for Continuous Verification
   Resilience is not a one-time achievement. Automate chaos experiments
   in CI/CD and run them regularly.
```

## Steady State Hypothesis

### Defining Steady State

```
A steady state hypothesis is a measurable assertion about system behavior
that should remain true even when faults are injected.

Format:
  "When [fault condition], the system should maintain [metric] within
  [threshold] for [duration]."

Examples:
  1. "When one API server instance terminates, request success rate
     remains above 99.9% and p99 latency stays below 500ms."

  2. "When the primary database becomes unreachable, the application
     returns cached responses for read endpoints within 200ms, and
     write endpoints return 503 with a retry-after header."

  3. "When 30% of requests to the payment service time out, the
     checkout flow degrades gracefully: users see an error message
     and no duplicate charges are created."

  4. "When a network partition isolates one availability zone, the
     system continues serving 66% of normal traffic from remaining
     AZs with no data loss."
```

### Metrics to Monitor During Experiments

```
Category        | Metric                     | Typical Threshold
----------------|----------------------------|--------------------
Availability    | Request success rate        | > 99.9%
Latency         | p50, p95, p99 response time | p99 < 500ms
Throughput      | Requests per second         | > 80% of baseline
Errors          | Error rate by type          | < 0.1% (5xx)
Business        | Conversion rate             | > 95% of baseline
Business        | Revenue per minute          | > 90% of baseline
Infrastructure  | CPU utilization             | < 85%
Infrastructure  | Memory utilization          | < 90%
Dependencies    | Circuit breaker state       | Open within 30s of fault
Recovery        | Time to recover             | < 5 minutes
```

## Fault Injection Techniques

### Infrastructure Faults

```shell
# Process termination (kill a service instance)
# Validates: auto-restart, load balancer health checks, graceful degradation
kill -9 $(pgrep -f "my-api-server")

# CPU stress (saturate CPU)
# Validates: auto-scaling, request queuing, timeout handling
stress-ng --cpu 4 --timeout 300s

# Memory pressure (consume available memory)
# Validates: OOM handling, memory limits, graceful degradation
stress-ng --vm 2 --vm-bytes 80% --timeout 120s

# Disk fill (exhaust disk space)
# Validates: disk space monitoring, log rotation, graceful errors
fallocate -l 50G /tmp/fill-disk.tmp

# Disk I/O latency
# Validates: timeout handling, async I/O, fallback paths
# Using tc (traffic control) on loopback for local disk simulation
tc qdisc add dev lo root netem delay 100ms 20ms distribution normal
```

### Network Faults

```shell
# Network latency (add 200ms delay with 50ms jitter)
# Validates: timeout configuration, retry logic, user experience
tc qdisc add dev eth0 root netem delay 200ms 50ms distribution normal

# Packet loss (drop 10% of packets)
# Validates: retry mechanisms, idempotency, connection resilience
tc qdisc add dev eth0 root netem loss 10%

# Network partition (block traffic to specific host)
# Validates: failover, split-brain handling, circuit breakers
iptables -A OUTPUT -d 10.0.1.50 -j DROP

# DNS failure (simulate DNS resolution failure)
# Validates: DNS caching, fallback IPs, error handling
iptables -A OUTPUT -p udp --dport 53 -j DROP

# Bandwidth limitation (throttle to 1Mbps)
# Validates: payload size handling, compression, streaming
tc qdisc add dev eth0 root tbf rate 1mbit burst 32kbit latency 400ms

# Clean up network faults
tc qdisc del dev eth0 root
iptables -F OUTPUT
```

### Application Faults

```python
# Dependency timeout injection (middleware approach)
import random
import time

class ChaosMiddleware:
    def __init__(self, app, config):
        self.app = app
        self.config = config  # Loaded from feature flags

    def __call__(self, environ, start_response):
        experiment = self.get_active_experiment()

        if experiment:
            if experiment['type'] == 'latency':
                delay = experiment.get('delay_ms', 500) / 1000
                if random.random() < experiment.get('percentage', 0.1):
                    time.sleep(delay)

            elif experiment['type'] == 'error':
                if random.random() < experiment.get('percentage', 0.05):
                    start_response('500 Internal Server Error', [])
                    return [b'{"error": "Chaos experiment: injected failure"}']

            elif experiment['type'] == 'resource_exhaustion':
                if random.random() < experiment.get('percentage', 0.1):
                    # Simulate slow response by consuming CPU
                    end_time = time.time() + 2
                    while time.time() < end_time:
                        _ = sum(range(10000))

        return self.app(environ, start_response)
```

## Game Day Planning

### Game Day Template

```
=== GAME DAY PLAN ===

Title: Database Failover Resilience Test
Date: 2025-03-15
Duration: 2 hours (10:00 - 12:00 UTC)
Owner: Platform Team
Participants: Platform (lead), Backend, SRE, Customer Support

--- PRE-REQUISITES ---
[ ] Steady state metrics baselined (last 7 days)
[ ] Monitoring dashboards prepared and shared
[ ] Rollback procedure documented and tested
[ ] Communication channels established (Slack #chaos-gameday)
[ ] Customer support team briefed (may see elevated latency)
[ ] Stakeholder approval obtained

--- HYPOTHESIS ---
"When the primary RDS instance fails over to standby, the application
experiences <30 seconds of elevated error rate, then recovers to
99.9% success rate within 2 minutes. No data loss occurs."

--- EXPERIMENT STEPS ---
Time    | Action                                | Expected Result
--------|---------------------------------------|----------------------------------
10:00   | Baseline metrics check                | All metrics nominal
10:05   | Begin recording experiment            | Dashboards screenshotted
10:10   | Initiate RDS failover                 | aws rds reboot-db-instance --force-failover
10:10   | Monitor connection errors             | Errors spike, circuit breaker opens
10:11   | Connection pool reconnects            | Errors decrease
10:12   | Verify steady state restored          | Success rate > 99.9%
10:15   | Verify data integrity                 | Run data consistency checks
10:20   | Document findings                     | Record all observations

--- ABORT CRITERIA ---
- Error rate exceeds 50% for more than 2 minutes
- Any indication of data loss or corruption
- Customer-facing impact beyond acceptable threshold
- Any participant calls "ABORT" for safety reasons

--- ROLLBACK PROCEDURE ---
1. If failover does not complete: AWS support escalation
2. If application does not reconnect: Restart application pods
3. If data inconsistency detected: Switch to read-only mode, investigate

--- POST-EXPERIMENT ---
[ ] Screenshot all metrics dashboards
[ ] Document actual vs expected behavior
[ ] List findings and action items
[ ] Schedule follow-up for fixes
[ ] Share findings with broader engineering team
```

### Game Day Progression

```
Level 1: Tabletop Exercise (no real faults)
  Walk through failure scenarios on a whiteboard.
  "What happens if X fails? What is our playbook?"
  Low risk, high learning for new teams.

Level 2: Development/Staging Experiments
  Inject real faults in non-production environments.
  Validate basic resilience mechanisms work.
  No customer impact, limited realism.

Level 3: Production - Single Instance
  Terminate one instance behind a load balancer.
  Smallest possible blast radius in production.
  Validates auto-scaling, health checks, load balancing.

Level 4: Production - Dependency Failure
  Simulate timeout or failure of a specific dependency.
  Tests circuit breakers, fallbacks, graceful degradation.
  Moderate blast radius, requires monitoring.

Level 5: Production - Zone/Region Failure
  Simulate loss of an entire availability zone or region.
  Tests disaster recovery, multi-region failover.
  Largest blast radius, requires extensive preparation.
```

## Blast Radius Management

### Containment Strategies

```
1. PERCENTAGE-BASED TARGETING
   Inject faults for only 1-5% of requests initially.
   Monitor impact. Increase percentage if safe.

2. CANARY DEPLOYMENT
   Run chaos experiments on canary instances only.
   If canary degrades beyond threshold, abort automatically.

3. USER SEGMENT TARGETING
   Target internal users or beta users first.
   Expand to a small percentage of external users.
   Never target all users simultaneously.

4. TIME-BOUNDED EXPERIMENTS
   Set a maximum experiment duration (e.g., 5 minutes).
   Automatic abort after time limit regardless of results.

5. AUTOMATED ABORT CONDITIONS
   Monitor key metrics in real-time during experiments.
   Automatically halt experiment if metrics breach thresholds.
```

### Automated Safety Controls

```yaml
# Chaos experiment definition with safety controls
experiment:
  name: "api-latency-injection"
  description: "Inject 500ms latency to payment service calls"

  targeting:
    service: "checkout-api"
    percentage: 5           # Only 5% of instances

  fault:
    type: latency
    delay_ms: 500
    jitter_ms: 100

  duration:
    max_seconds: 300        # Auto-stop after 5 minutes

  abort_conditions:         # Automatic halt triggers
    - metric: "error_rate_5xx"
      threshold: 5          # Abort if 5xx rate exceeds 5%
      window_seconds: 60
    - metric: "p99_latency_ms"
      threshold: 2000       # Abort if p99 exceeds 2 seconds
      window_seconds: 60
    - metric: "revenue_per_minute"
      threshold_percent_drop: 10  # Abort if revenue drops 10%
      window_seconds: 120

  rollback:
    automatic: true         # Remove fault injection on abort
    verification_wait: 60   # Wait 60s after rollback to verify recovery
```

## Chaos Experiment Catalog

### Starter Experiments

```
Experiment                | Validates                        | Difficulty
--------------------------|----------------------------------|----------
Kill single instance      | Auto-restart, health checks      | Beginner
Add network latency       | Timeouts, retries, UX            | Beginner
Return 500 from dependency| Circuit breaker, fallback        | Beginner
Fill disk to 95%          | Alerts, log rotation             | Beginner
Revoke DB credentials     | Secret rotation, error handling  | Intermediate
Exhaust connection pool   | Pool sizing, queuing, shedding   | Intermediate
DNS resolution failure    | DNS caching, fallback            | Intermediate
Clock skew (NTP failure)  | Certificate validation, TTLs     | Intermediate
Poison message in queue   | DLQ, error handling, alerting    | Intermediate
AZ network partition      | Multi-AZ failover, replication   | Advanced
Cascading timeout failure | Bulkhead, circuit breaker        | Advanced
Split brain scenario      | Consensus, conflict resolution   | Advanced
Region failover           | DR procedures, data consistency  | Advanced
```

## Chaos Maturity Model

```
Level 0: No Chaos Practice
  - Resilience tested only by real incidents
  - Recovery procedures are untested

Level 1: Informal Experiments
  - Ad-hoc testing in development/staging
  - Manual fault injection
  - No formal hypothesis or metrics tracking

Level 2: Structured Game Days
  - Quarterly game days with documented plans
  - Steady state hypotheses defined
  - Findings tracked and remediated
  - Still manually triggered

Level 3: Automated Chaos in CI/CD
  - Chaos experiments run in staging pipeline
  - Automated abort conditions and rollback
  - Results tracked over time for regression detection
  - Experiment library maintained

Level 4: Continuous Chaos in Production
  - Automated experiments run continuously in production
  - Blast radius controlled by percentage targeting
  - Real-time safety mechanisms prevent customer impact
  - Chaos results feed directly into reliability roadmap

Level 5: Chaos-Driven Development
  - Every new service must pass chaos experiments before production
  - Failure modes documented as part of system design
  - Chaos experiments serve as acceptance criteria for resilience features
  - Organization-wide culture of proactive resilience testing
```

## Chaos Engineering Checklist

```
Before Starting:
[ ] Steady state behavior defined with measurable metrics
[ ] Monitoring and alerting in place for key metrics
[ ] Rollback procedure documented and tested
[ ] Blast radius defined and containment mechanisms ready
[ ] Stakeholders informed and approval obtained
[ ] Abort criteria defined with automatic triggers

During Experiment:
[ ] Baseline metrics captured before fault injection
[ ] Fault injected at defined scope (percentage, instances, duration)
[ ] All metrics monitored in real-time
[ ] Team ready to abort manually if needed
[ ] Observations documented as they happen

After Experiment:
[ ] Fault removed and system recovery verified
[ ] Metrics compared: actual vs hypothesis
[ ] Findings documented (expected and unexpected behaviors)
[ ] Action items created for gaps discovered
[ ] Results shared with broader engineering team
[ ] Experiment added to automation suite for regression
```

## When to Use

**Use this skill when:**
- Designing or implementing chaos engineer solutions
- Reviewing or improving existing chaos engineer approaches
- Making architectural or implementation decisions about chaos engineer
- Learning chaos engineer patterns and best practices
- Troubleshooting chaos engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Chaos Engineer Analysis

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

**Input:** "Help me implement chaos engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended chaos engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When chaos engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
