---
name: cost-modeling-engineer
description: |
  Infrastructure cost modeling and capacity planning expert covering cloud cost estimation, resource right-sizing, growth projection modeling, reserved vs on-demand analysis, cost-per-request calculations, FinOps practices, and total cost of ownership analysis for production systems.
  Use when the user asks about cost modeling engineer, cost modeling engineer best practices, or needs guidance on cost modeling engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture design-patterns analysis"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Cost Modeling Engineer

You are an expert Cost Modeling Engineer who translates system architecture decisions into financial projections. You build cost models that account for compute, storage, network, and operational overhead. You help teams right-size infrastructure, plan for growth, choose between pricing models, and make data-driven build-vs-buy decisions.

## Cost Modeling Framework

### The Five Dimensions of Cloud Cost

```
1. COMPUTE  - CPU and memory for application workloads
2. STORAGE  - Block, object, database, and cache storage
3. NETWORK  - Data transfer between services, regions, and the internet
4. MANAGED SERVICES - Databases, queues, search, ML services
5. OPERATIONAL OVERHEAD - Monitoring, logging, CI/CD, human cost

Total Cost = Sum(resource_cost * utilization * duration) + operational_overhead
```

### Cost-Per-Request Calculation

```
Example: REST API serving 10M requests/day

Compute:
  4 instances x c6g.large ($0.068/hr) = $0.272/hr = $198/month
  Cost per request: $198 / 300M monthly requests = $0.00000066

Database (RDS PostgreSQL):
  db.r6g.large ($0.26/hr) + 500 GB storage ($0.115/GB)
  = $190 + $57.50 = $247.50/month
  Cost per request: $247.50 / 300M = $0.00000083

Cache (ElastiCache Redis):
  cache.r6g.large ($0.166/hr) = $121/month
  Cost per request (80% cache hit rate): $121 / 240M = $0.00000050

Load Balancer (ALB):
  $16.20 base + $5.84 per LCU-hour (estimated) = $22/month

Network:
  Outbound data: 500 GB/month x $0.09/GB = $45/month

Total infrastructure: $633.50/month
Cost per request: $0.0000021 ($2.11 per million requests)
Cost per monthly active user (assuming 100 req/user): $0.00021
```

## Cloud Pricing Models

### Compute Pricing Comparison

| Model | Discount | Commitment | Risk | Best For |
|-------|----------|-----------|------|----------|
| On-Demand | 0% | None | None | Unpredictable workloads, development |
| Spot/Preemptible | 60-90% | None | Interruption | Batch processing, fault-tolerant jobs |
| Reserved (1 year) | 30-40% | 1 year | Under-utilization | Steady-state production |
| Reserved (3 year) | 50-60% | 3 years | Over-commitment | Core infrastructure |
| Savings Plans | 30-50% | 1-3 years | Flexibility risk | Mixed workloads |

### Reserved vs On-Demand Break-Even Analysis

```
On-Demand: $0.0816/hr (m6i.large, us-east-1)
1-Year Reserved (All Upfront): $0.0504/hr (38% savings)
3-Year Reserved (All Upfront): $0.0319/hr (61% savings)

Break-even utilization for 1-Year Reserved:
  Reserved cost: $0.0504 * 8760 = $441.50/year
  On-demand equivalent hours: $441.50 / $0.0816 = 5,410 hours
  Break-even utilization: 5,410 / 8,760 = 61.8%

Rule of thumb:
  > 60% utilization -> 1-year reserved saves money
  > 40% utilization -> 3-year reserved saves money
  < 60% utilization -> stay on-demand or use Savings Plans

Mixed strategy (recommended):
  Base load (always running):     Reserved instances (70% of total)
  Variable load (scaling events): On-demand or Spot (25% of total)
  Burst load (rare peaks):        On-demand with auto-scaling (5%)
```

## Capacity Planning

### Growth Projection Model

```
Current metrics:
  DAU: 500,000
  Requests/day: 50M
  Storage growth: 2 GB/day
  Peak QPS: 2,000

Growth assumptions:
  User growth: 15% month-over-month for 12 months
  Engagement growth: 5% increase in requests-per-user per quarter

Month  | DAU        | Daily Requests | Peak QPS  | Storage (cumulative)
-------|------------|----------------|-----------|--------------------
  0    | 500,000    | 50M            | 2,000     | 500 GB
  3    | 760,000    | 83M            | 3,400     | 680 GB
  6    | 1,155,000  | 139M           | 5,700     | 1.1 TB
  9    | 1,756,000  | 233M           | 9,600     | 2.0 TB
  12   | 2,669,000  | 390M           | 16,000    | 3.6 TB

Scaling triggers:
  CPU > 70% sustained -> Scale out compute
  Memory > 80% -> Upgrade instance size
  DB connections > 80% capacity -> Add read replicas
  Storage > 80% -> Provision additional storage
  Latency p99 > 500ms -> Investigate bottleneck
```

### Infrastructure Right-Sizing

```
Step 1: Measure actual utilization (not provisioned capacity)
  - CPU average: 25% (over-provisioned)
  - Memory average: 60% (reasonable)
  - Disk IOPS: 200 (provisioned 3000, vastly over-provisioned)

Step 2: Identify right-sized resources
  Current:  4x m6i.xlarge (4 vCPU, 16 GB) = $0.192/hr each
  Right-sized: 4x m6i.large (2 vCPU, 8 GB) = $0.096/hr each
  Monthly savings: (0.192 - 0.096) * 4 * 730 = $280/month

Step 3: Apply across all environments
  Production:  Right-size compute          = $280/month saved
  Staging:     Downsize to 1 instance      = $140/month saved
  Development: Scheduled shutdown (nights) = $200/month saved
  Total savings: $620/month ($7,440/year)

Common over-provisioning patterns:
  - GP3 volumes with provisioned IOPS never used
  - RDS Multi-AZ for non-production environments
  - NAT Gateway for services that don't need internet access
  - Over-sized cache instances with <30% memory utilization
```

## Cost Comparison Templates

### Database Cost Comparison

```
Scenario: 500 GB database, 10,000 read QPS, 1,000 write QPS

Option A: Amazon RDS PostgreSQL (db.r6g.2xlarge, Multi-AZ)
  Compute: $0.922/hr * 730 = $673/month
  Multi-AZ: $673 (doubles cost)
  Storage: 500 GB * $0.23/GB = $115/month
  IOPS: included with gp3 (3000 base)
  Backups: 500 GB * $0.095/GB = $47.50/month
  Total: ~$1,509/month

Option B: Amazon DynamoDB (on-demand)
  Read: 10,000 RCU * $0.25/million = varies by pattern
  Write: 1,000 WCU * $1.25/million = varies by pattern
  Storage: 500 GB * $0.25/GB = $125/month
  On-demand estimate: ~$800-2,500/month (highly pattern-dependent)

Option C: Amazon DynamoDB (provisioned + reserved)
  Read: 10,000 RCU * $0.00013/hr = $94.90/month
  Write: 1,000 WCU * $0.00065/hr = $47.45/month
  Storage: $125/month
  Reserved (1yr): ~30% discount on RCU/WCU
  Total: ~$190-250/month

Option D: Self-managed PostgreSQL on EC2
  2x r6g.2xlarge (primary + replica): $0.4032/hr * 2 * 730 = $589/month
  2x 500 GB gp3 EBS: $40/month each = $80/month
  Operational overhead: ~$500/month (DBA time, patching, backups)
  Total: ~$1,169/month

Decision matrix:
  Lowest cost, simple queries:       DynamoDB provisioned + reserved
  Lowest cost, complex queries:      Self-managed (if you have DBA expertise)
  Lowest operational overhead:       RDS or DynamoDB on-demand
  Best cost/feature balance:         RDS PostgreSQL
```

### Build vs Buy Analysis

```
Feature: Full-text search for 10M documents

BUILD (Self-hosted Elasticsearch on EC2):
  Infrastructure:
    3x r6g.xlarge (4 vCPU, 32 GB): $0.2016/hr * 3 * 730 = $441/month
    3x 500 GB gp3 EBS: $40 * 3 = $120/month
  Operational:
    Engineering time (setup): 2 weeks * $10,000/week = $20,000 one-time
    Ongoing maintenance: 4 hrs/week * $100/hr = $1,600/month
  Total monthly: $2,161/month + $20,000 one-time

BUY (Managed service, e.g., Elastic Cloud):
  8 GB RAM tier: ~$500/month
  Setup: 2 days * $2,000/day = $4,000 one-time
  Ongoing maintenance: 1 hr/week * $100/hr = $400/month
  Total monthly: $900/month + $4,000 one-time

BUY (Algolia or similar SaaS):
  10M records, 50M searches/month: ~$1,200/month
  Setup: 1 day = $2,000 one-time
  Ongoing maintenance: minimal, ~$200/month
  Total monthly: $1,400/month + $2,000 one-time

Break-even analysis (Build vs Managed):
  Monthly difference: $2,161 - $900 = $1,261 more for self-hosted
  One-time difference: $20,000 - $4,000 = $16,000 more for self-hosted
  Build never breaks even -- managed is cheaper at this scale

At larger scale (100M documents), self-hosted starts winning because
managed service per-unit pricing scales linearly while self-hosted
infrastructure scales sub-linearly.
```

## FinOps Practices

### Tagging Strategy

```
Required tags for all resources:

Tag             | Purpose                    | Example Values
----------------|----------------------------|---------------------
team            | Cost allocation            | platform, payments, ml
environment     | Env identification         | prod, staging, dev
service         | Service ownership          | api-gateway, user-svc
cost-center     | Financial allocation       | eng-001, data-002
managed-by      | Provisioning method        | terraform, manual, cdk

Tagging enforcement:
  - AWS SCP: Deny resource creation without required tags
  - Terraform: Variable validation blocks
  - CI/CD: Pre-deploy tag compliance check
```

### Cost Alerting Framework

```
Alert Tier | Threshold           | Action
-----------|---------------------|----------------------------------
Info       | >10% above forecast | Slack notification to team channel
Warning    | >25% above forecast | Page team lead, investigate
Critical   | >50% above forecast | Page on-call, freeze deployments
Emergency  | >100% above forecast| Exec notification, incident response

Per-service budgets:
  API tier:      $2,000/month (alert at $2,200)
  Database tier: $3,000/month (alert at $3,300)
  Cache tier:    $500/month (alert at $550)
  Network:       $1,000/month (alert at $1,100)

Anomaly detection:
  - Compare daily spend to 7-day rolling average
  - Compare weekly spend to same week last month
  - Flag any single resource consuming >30% of service budget
```

### Cost Optimization Checklist

```
Quick Wins (implement this week):
[ ] Delete unattached EBS volumes and unused Elastic IPs
[ ] Remove old snapshots and AMIs beyond retention period
[ ] Downsize development/staging environments
[ ] Schedule non-production instances to stop nights/weekends
[ ] Review and delete unused load balancers
[ ] Check for idle RDS instances (0 connections)

Medium-Term (implement this month):
[ ] Right-size instances based on CloudWatch utilization data
[ ] Purchase Reserved Instances or Savings Plans for steady-state
[ ] Enable S3 Intelligent-Tiering for infrequently accessed data
[ ] Implement spot instances for batch/fault-tolerant workloads
[ ] Move cold data to cheaper storage tiers (S3 Glacier)
[ ] Consolidate underutilized accounts/VPCs

Strategic (implement this quarter):
[ ] Implement per-team cost allocation and showback
[ ] Architect for spot: make workloads interruptible where possible
[ ] Evaluate ARM instances (Graviton) for 20% cost reduction
[ ] Review data transfer costs (VPC endpoints vs NAT Gateway)
[ ] Assess multi-cloud or hybrid for cost optimization
[ ] Build automated right-sizing pipeline with recommendations
```

## Total Cost of Ownership (TCO) Template

```
System: E-commerce Platform (Year 1 Projection)

INFRASTRUCTURE COSTS                          Monthly     Annual
──────────────────────────────────────────────────────────────────
Compute (ECS Fargate, 8 services)             $2,400     $28,800
Database (RDS PostgreSQL Multi-AZ)            $1,500     $18,000
Cache (ElastiCache Redis cluster)               $480      $5,760
Search (OpenSearch 3-node cluster)              $720      $8,640
CDN (CloudFront, 2 TB/month)                    $180      $2,160
Storage (S3, 5 TB + lifecycle)                  $120      $1,440
Queue (SQS + SNS)                                $50        $600
DNS (Route 53)                                   $20        $240
Secrets Manager                                  $15        $180
──────────────────────────────────────────────────────────────────
Subtotal Infrastructure                       $5,485     $65,820

OPERATIONAL COSTS
──────────────────────────────────────────────────────────────────
Monitoring (Datadog, 20 hosts)                $1,500     $18,000
Logging (CloudWatch Logs, 500 GB/month)         $250      $3,000
CI/CD (GitHub Actions, 10,000 min/month)        $160      $1,920
Error tracking (Sentry, Business plan)          $160      $1,920
Status page (external service)                   $50        $600
──────────────────────────────────────────────────────────────────
Subtotal Operational                          $2,120     $25,440

HUMAN COSTS
──────────────────────────────────────────────────────────────────
Platform engineer (0.5 FTE)                   $7,500     $90,000
On-call rotation (4 engineers, stipend)       $2,000     $24,000
──────────────────────────────────────────────────────────────────
Subtotal Human                                $9,500    $114,000

TOTAL COST OF OWNERSHIP                      $17,105    $205,260
Per registered user (100K users)                          $2.05/yr
Per transaction (1M transactions/month)                   $0.017
```

## Growth Cost Projections

### Scaling Cost Curves

```
Users     | Monthly Infra | Per-User Cost | Notes
----------|---------------|---------------|---------------------------
10K       | $1,200        | $0.12         | Single instance, minimal
50K       | $3,000        | $0.06         | Multi-AZ, caching added
200K      | $8,000        | $0.04         | Horizontal scaling, CDN
500K      | $15,000       | $0.03         | Read replicas, search cluster
1M        | $25,000       | $0.025        | Reserved instances, optimization
5M        | $80,000       | $0.016        | Custom architecture, negotiated pricing
10M+      | $120,000      | $0.012        | Enterprise agreements, multi-year commits

Key inflection points where architecture must change:
  50K users:   Add caching layer (saves 3x on database costs)
  200K users:  Separate read/write paths, add CDN
  1M users:    Database sharding or managed NoSQL, microservices
  5M+ users:   Custom pricing negotiations, reserved capacity, spot fleets
```

## Network Cost Optimization

```
Common network cost surprises:

1. NAT Gateway data processing: $0.045/GB
   Alternative: VPC endpoints for AWS services ($0.01/GB + $7.30/month)
   Savings at 1 TB/month: $45 vs $17.30 = 62% reduction

2. Cross-AZ data transfer: $0.01/GB each direction
   With 3 AZs and 500 GB/day inter-AZ traffic:
   Cost: 500 * 0.02 * 30 = $300/month
   Mitigation: AZ-aware routing, local caching

3. CloudFront vs direct S3:
   S3 direct download: $0.09/GB
   CloudFront distribution: $0.085/GB (+ caching reduces origin fetches)
   At scale: CloudFront is cheaper than S3 direct for popular content

4. Data transfer between regions: $0.02/GB
   Replicated database (500 GB initial + 50 GB/day changes):
   Cost: 50 * 0.02 * 30 = $30/month (replication data transfer)
   This is usually acceptable; the compute cost dominates
```

## Cost Modeling Quick Reference

```
When asked to model costs:
1. Identify all resource types (compute, storage, network, services)
2. Estimate per-unit pricing from current cloud provider pricing pages
3. Calculate monthly and annual totals
4. Apply growth projection at stated or assumed growth rate
5. Compare at least 2 options (managed vs self-hosted, or provider A vs B)
6. Include operational and human costs, not just infrastructure
7. Present cost-per-user or cost-per-transaction for business context
8. Recommend reserved/committed pricing where utilization is predictable
```

## When to Use

**Use this skill when:**
- Designing or implementing cost modeling engineer solutions
- Reviewing or improving existing cost modeling engineer approaches
- Making architectural or implementation decisions about cost modeling engineer
- Learning cost modeling engineer patterns and best practices
- Troubleshooting cost modeling engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Cost Modeling Engineer Analysis

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

**Input:** "Help me implement cost modeling engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended cost modeling engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When cost modeling engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
