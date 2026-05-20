---
name: aws-patterns
description: |
  Guides expert-level aws architecture patterns implementation: cloud and architecture decision frameworks, production-ready patterns, and concrete templates for aws patterns workflows.
  Use when the user asks about aws architecture patterns, aws patterns configuration, or cloud best practices for aws projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cloud architecture best-practices"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# AWS Patterns

## When to Use

**Use this skill when:**
- User asks how to architect a specific AWS workload -- web applications, data pipelines, event-driven systems, microservices, or batch processing
- User needs to choose between competing AWS service options (e.g., SQS vs. Kinesis, ECS vs. EKS vs. Lambda, RDS vs. Aurora vs. DynamoDB)
- User wants production-ready infrastructure patterns with security controls, scaling configurations, and operational guardrails built in
- User is designing for specific non-functional requirements: sub-100ms latency, 99.99% availability, data residency compliance, or cost optimization targets
- User is migrating from on-premises or another cloud and needs AWS-idiomatic equivalents for existing patterns
- User needs to understand trade-offs between synchronous and asynchronous communication patterns in a distributed AWS system
- User wants to implement multi-account, multi-region, or multi-AZ strategies for enterprise workloads
- User asks about specific AWS architectural concerns: cold start mitigation, fan-out patterns, circuit breaking, throttling, backpressure, or dead-letter queue design

**Do NOT use this skill when:**
- User needs Terraform or CloudFormation syntax help specifically -- use the IaC skill in the devops-cloud subcategory
- User needs container orchestration deep dives (Kubernetes cluster configuration, Helm chart authoring) -- use the container-orchestration skill
- User needs CI/CD pipeline design -- use the ci-cd-pipelines skill
- User needs general cloud cost optimization without an architecture question -- use the cloud-cost-optimization skill
- User is asking about a non-AWS cloud provider (Azure, GCP) -- use the appropriate cloud-provider skill
- User needs application-level design patterns (DDD, CQRS at the code level) without an AWS infrastructure question
- User needs incident response or AWS outage troubleshooting -- use the cloud-incident-response skill

---

## Process

### 1. Characterize the Workload

Before recommending any pattern, classify the workload along four axes:

- **Traffic shape:** Is demand steady, spiky, bursty, or scheduled? A SaaS application with unpredictable viral traffic needs different patterns than a nightly ETL job. Quantify: requests/second at p50 and p99, burst factor, and ramp speed (seconds to 10x load).
- **Data access pattern:** Is the system read-heavy (consider ElastiCache, DAX, CloudFront), write-heavy (consider DynamoDB with write sharding, Kinesis), or mixed (consider Aurora read replicas or CQRS separation)?
- **Coupling tolerance:** Can downstream failures be tolerated with degraded responses (use async patterns, SQS, SNS fan-out), or is strict consistency required (synchronous calls with circuit breakers, Step Functions orchestration)?
- **Operational maturity:** A team without on-call rotation and runbooks should not operate a self-managed Kafka cluster on EC2 -- use managed services (MSK, Kinesis) even at higher per-unit cost.

Determine the availability tier:
- **Tier 1 (99.99%+):** Multi-region active-active or active-passive with Route 53 health checks and automated failover. RTO < 1 minute, RPO near-zero.
- **Tier 2 (99.9%):** Multi-AZ within a single region. RDS Multi-AZ, ALB across 3 AZs, ECS with tasks spread across AZs.
- **Tier 3 (99.5%):** Single-AZ acceptable for non-production or internal tooling.

### 2. Select the Compute Pattern

Apply this decision tree:

**Is the workload event-driven with discrete, short-lived invocations (< 15 minutes)?**
- Yes, and cold starts are tolerable (async, non-latency-sensitive): **Lambda with SQS or SNS triggers**
- Yes, but cold starts are not tolerable (customer-facing synchronous API): **Lambda with Provisioned Concurrency** or **Fargate with pre-warmed containers**
- No, workload is long-running or stateful: proceed below

**Is the workload containerized?**
- Yes, and team lacks Kubernetes expertise or wants reduced ops overhead: **ECS on Fargate** (no cluster management, pay-per-task-second)
- Yes, and team needs advanced scheduling, custom operators, or runs open-source tooling requiring Kubernetes: **EKS with managed node groups** (use Karpenter for node autoscaling, not Cluster Autoscaler for new deployments)
- No: **EC2 with Auto Scaling Groups**, appropriate for gaming servers, HPC, or workloads requiring specific instance types (GPU, high-memory)

**Is the workload a traditional three-tier web application?**
- ALB -- ECS Fargate (or EKS) -- RDS Aurora with read replicas. This covers 80% of web workload patterns.

Compute sizing rules:
- Lambda: 1,769 MB RAM = 1 vCPU. For CPU-intensive functions, set memory to 1,769 MB or 3,008 MB (1.7 vCPU). Do not set 128 MB for CPU-heavy tasks -- the function will run slower and cost more due to extended duration.
- Fargate task sizing: start at 0.5 vCPU / 1 GB for lightweight services; 1 vCPU / 2 GB for standard APIs; 2 vCPU / 4 GB for data-intensive processing.
- EC2: Use Graviton3 (c7g, m7g, r7g) instances for 40% better price-performance than equivalent x86 instances for most workloads. Reserve Spot Instances for stateless, interruption-tolerant workloads to achieve 60-90% cost reduction vs. On-Demand.

### 3. Select the Data Storage Pattern

Apply the following rules in order:

**Relational workload (ACID transactions, complex joins, reporting):**
- Aurora PostgreSQL-compatible: default choice for new relational workloads. Scales storage automatically to 128 TB. Aurora Serverless v2 for variable workloads (scales from 0.5 ACU to 128 ACU in ~1 second).
- RDS PostgreSQL on Multi-AZ DB instances: choose over Aurora only when you need access to PostgreSQL extensions that Aurora does not support, or when running in a region without Aurora.
- Read replicas: add when read:write ratio exceeds 4:1, or when read query p99 latency exceeds 100ms under load.

**High-throughput key-value or document workload (>10,000 writes/second or single-digit millisecond latency required):**
- DynamoDB: use on-demand capacity for unpredictable workloads; provisioned capacity with Application Auto Scaling for steady traffic (30-40% cheaper). Partition key design is critical -- avoid hot partitions by using high-cardinality keys. For time-series append patterns, append a random suffix (write sharding) or use a composite key with a timestamp component.
- DynamoDB Accelerator (DAX): in-memory cache with microsecond latency for read-heavy DynamoDB workloads. Reduces DynamoDB read costs by up to 70% for cacheable access patterns.

**Large object / binary / unstructured storage:**
- S3 as the default object store. Enable S3 Intelligent-Tiering for objects with unknown or changing access patterns (automatically moves objects between frequent, infrequent, and archive tiers).
- Use S3 Transfer Acceleration for uploads from globally distributed clients.
- Enable S3 Versioning and Object Lock for data that requires immutability guarantees (compliance, audit logs).

**Caching layer:**
- ElastiCache for Redis 7.x: session storage, rate limiting, leaderboards, pub/sub. Use cluster mode enabled for horizontal scaling beyond a single shard's memory.
- ElastiCache for Memcached: pure caching workloads where Redis data structures are not needed and multi-threading is valuable.
- CloudFront: cache at the edge for any content served over HTTP/S, including API responses. Set Cache-Control headers appropriately -- even caching API responses for 5 seconds can reduce origin load by 80% during traffic spikes.

**Time-series and analytical workloads:**
- Amazon Timestream: purpose-built for time-series data. Ingestion is 10x cheaper than RDS for equivalent time-series write rates.
- Amazon Redshift: data warehouse for analytical queries over terabyte-scale datasets. Use RA3 nodes for separation of compute and storage. Enable Redshift Spectrum to query S3 data directly without loading it into Redshift.
- Amazon Athena: serverless SQL over S3 at $5/TB scanned. Best for ad-hoc analysis or infrequent queries. Use Parquet or ORC columnar formats with partition projection to reduce scan cost by 70-90%.

### 4. Design the Messaging and Integration Pattern

Choose based on the required semantics:

**Fan-out (one publisher, many consumers):**
- SNS topic with multiple SQS queue subscriptions. Each consumer gets an independent copy of the message. This is the standard AWS fan-out pattern.
- Add message filtering at the SNS subscription level to route events by type without requiring consumers to filter in code.

**Work queue (competing consumers, each message processed once):**
- SQS Standard Queue: at-least-once delivery, nearly unlimited throughput. Set visibility timeout to 6x the expected processing time to prevent duplicate processing during retries.
- SQS FIFO Queue: exactly-once processing within a 5-minute deduplication window, 300 TPS per message group (or 3,000 TPS with batching). Use ONLY when ordering and deduplication are required -- FIFO queues are slower and more expensive.
- Dead Letter Queue (DLQ): always configure a DLQ on every SQS queue. Set maxReceiveCount to 3-5 depending on retry tolerance. Send DLQ alerts to an SNS topic for operational visibility.

**High-throughput streaming (>1,000 events/second, replay required, multiple independent consumers):**
- Kinesis Data Streams: 1 shard = 1,000 writes/second or 1 MB/s. Shard count = max(write_rate/1000, write_throughput_MBps). Enable enhanced fan-out for consumers that need dedicated 2 MB/s throughput per shard. Retain data for 24 hours (default) to 365 days.
- Amazon MSK (Managed Kafka): use when team already operates Kafka, when ecosystem tooling (Kafka Connect, Kafka Streams) is required, or when Kinesis shard limits are constraining. MSK Serverless for variable throughput without shard management.

**Synchronous API integration:**
- API Gateway (HTTP API): lowest latency (~1ms overhead), lowest cost ($1/million requests), supports JWT authorizers and Lambda integrations. Choose for most REST API use cases.
- API Gateway (REST API): choose when you need request/response transformation, usage plans, API keys, or AWS WAF integration. ~50% more expensive than HTTP API.
- Application Load Balancer direct-to-target: choose for WebSocket connections, gRPC, or when API Gateway features are not needed and you want to avoid per-request pricing.

**Orchestration vs. choreography:**
- Step Functions Standard Workflows: use for business-critical workflows requiring audit trails, human approval steps, or complex error handling. State transitions are persisted -- durable against Lambda/ECS restarts. 2,000 state transitions free, then $0.025 per 1,000.
- Step Functions Express Workflows: use for high-volume, short-duration workflows (< 5 minutes) where durability between steps is not required. Up to 100,000 executions/second.
- EventBridge: use for event-driven choreography where services need to react to state changes without knowing about each other. Define event schemas in EventBridge Schema Registry for type safety between producers and consumers.

### 5. Design the Network and Security Architecture

**VPC structure (three-tier standard):**
- Public subnets: ALB, NAT Gateway, bastion hosts. Never deploy application servers or databases in public subnets.
- Private application subnets: ECS tasks, Lambda (VPC-attached), EC2 application tier. No direct internet access -- outbound through NAT Gateway.
- Private data subnets: RDS, ElastiCache, OpenSearch. No internet access at all. Accessible only from the application subnets via security group rules.
- Use /24 CIDR blocks for each subnet (251 usable IPs). Reserve /20 or larger VPC CIDR to allow future expansion.
- Deploy subnets in at least 3 Availability Zones for Tier 1 and Tier 2 workloads.

**Security group design:**
- Never use 0.0.0.0/0 inbound on any security group except the ALB on ports 443 and 80.
- Reference security group IDs in inbound rules, not CIDR ranges. This allows resources to move IPs without requiring security group updates.
- ALB SG: inbound 443 from 0.0.0.0/0, outbound to application SG on application port only.
- Application SG: inbound from ALB SG on application port, outbound to database SG on database port and to NAT Gateway CIDR for external calls.
- Database SG: inbound from application SG on database port only. No outbound internet access.

**IAM pattern:**
- Use IAM Roles for all compute -- EC2 instance profiles, ECS task roles, Lambda execution roles. Never use long-lived access keys on compute resources.
- Apply Permission Boundaries on all developer-created roles in multi-team accounts to prevent privilege escalation.
- Use AWS Organizations SCPs to enforce guardrails at the account level (e.g., deny disabling CloudTrail, deny launching resources outside approved regions).
- Enable IAM Access Analyzer in every account to detect overly permissive policies automatically.

**Secrets management:**
- AWS Secrets Manager for database credentials, API keys, and OAuth tokens. Enable automatic rotation for database credentials (built-in rotation for RDS/Aurora).
- AWS Systems Manager Parameter Store (SecureString) for configuration values that do not require rotation. Cost: free for standard parameters, $0.05/month per advanced parameter.
- Never inject secrets as plaintext environment variables. Lambda and ECS both support reading from Secrets Manager at startup via the Secrets Manager extension (Lambda) or secrets injection (ECS).

**Encryption standards:**
- Encrypt all S3 buckets with SSE-S3 minimum; use SSE-KMS for buckets containing sensitive data to get per-object encryption and audit logs via CloudTrail.
- Enable encryption at rest on all RDS/Aurora, ElastiCache, EBS, and DynamoDB resources. This is a checkbox -- there is no performance penalty.
- Enforce TLS 1.2+ on all ALB listeners. Set the security policy to ELBSecurityPolicy-TLS13-1-2-2021-06.
- Enable S3 Block Public Access at the account level via AWS Organizations to prevent accidental public bucket exposure.

### 6. Design Observability and Operational Controls

**The Three Pillars on AWS:**

Metrics -- CloudWatch:
- Enable detailed monitoring (1-minute granularity) on all EC2, RDS, and ElastiCache instances. Default is 5 minutes -- insufficient for incident response.
- Define CloudWatch Alarms on: ECS CPU > 80%, RDS FreeStorageSpace < 20 GB, SQS ApproximateNumberOfMessagesNotVisible > threshold (signals consumer stuck), Lambda ErrorRate > 1%, API Gateway 5xxError > 0.5%.
- Use CloudWatch Container Insights for ECS/EKS for container-level CPU/memory metrics without custom instrumentation.
- Create CloudWatch Dashboards per service, not per AWS service type. A service dashboard shows ALB, ECS, RDS, and ElastiCache metrics side by side.

Logs -- CloudWatch Logs / OpenSearch:
- Use structured JSON logging from all application code. Include: timestamp, level, service_name, trace_id, correlation_id, and error details.
- Set CloudWatch Log Group retention. Default is "never expire" and costs accrue indefinitely. Set retention to 30 days for application logs, 90 days for security/audit logs, 1 year for compliance-required logs.
- For log analytics at scale, ship logs to S3 via Kinesis Data Firehose and query with Athena. Cheaper than OpenSearch for infrequent analysis.

Traces -- AWS X-Ray:
- Instrument all Lambda functions and ECS services with X-Ray SDK or AWS Distro for OpenTelemetry (ADOT). ADOT is the forward-looking choice for vendor-neutral instrumentation.
- Enable X-Ray active tracing on API Gateway to get end-to-end traces across the full request path.
- Use X-Ray Service Map to identify latency bottlenecks and error sources in distributed systems.

Alerting:
- Use a tiered severity model: P1 (service down) pages on-call immediately; P2 (degraded) sends to Slack; P3 (warning threshold) creates a ticket. Map CloudWatch Alarms to SNS topics that route to PagerDuty, OpsGenie, or similar.

### 7. Define the Deployment and Resilience Strategy

**Deployment patterns:**
- Blue/green deployment: use for ECS services via CodeDeploy or ALB target group switching. Zero downtime, instant rollback by switching traffic back. Required for Tier 1 workloads.
- Canary/linear deployment: route 10% of traffic to new version, monitor for 10-30 minutes, then shift remaining 90%. Use CodeDeploy with Lambda or ECS for automated canary with automatic rollback on alarm breach.
- Rolling deployment: acceptable for Tier 2/3 stateless services. ECS rolling update with minimumHealthyPercent=50 and maximumPercent=200 ensures no downtime.

**Auto Scaling:**
- ECS Service Auto Scaling: scale on ECSServiceAverageCPUUtilization (target 60%) and ECSServiceAverageMemoryUtilization (target 70%). Add an SQS-based scaling policy for queue consumer services -- scale on ApproximateNumberOfMessagesNotVisible / number of tasks.
- Application Auto Scaling on DynamoDB: target utilization 70% for both read and write capacity units.
- Predictive Scaling on EC2 ASG: for workloads with predictable daily patterns (office hours, business hours), enable predictive scaling to pre-warm capacity 15 minutes ahead of expected load.

**Resilience patterns:**
- Circuit breaker: implement at the application level using a library, or at the infrastructure level with App Mesh (service mesh with Envoy sidecar). Configure: failure threshold 50%, wait duration 30 seconds, half-open probe count 3.
- Retry with exponential backoff and jitter: all AWS SDK calls have built-in retry logic -- verify `maxAttempts` is not set to 0. For custom retry loops: base_delay=100ms, multiplier=2, jitter=random(0, base_delay), max_delay=30 seconds.
- Idempotency: design all write operations to be idempotent. Use DynamoDB conditional writes, SQS message deduplication IDs (FIFO), or a dedicated idempotency table pattern for Lambda functions.
- Throttle handling: every AWS service has quotas. Request increases proactively for SES sending rate, Lambda concurrent executions (default 1,000 per region), API Gateway burst limit (default 5,000 per region), and EC2 instance limits before traffic demands it.

### 8. Document Architecture Decisions

Create an Architecture Decision Record (ADR) for every non-obvious choice. A minimal ADR contains:
- **Context:** what problem are we solving and what constraints exist?
- **Decision:** what specific option was chosen?
- **Alternatives considered:** what were the other options and why were they rejected?
- **Consequences:** what are the trade-offs, ongoing costs, and known limitations?

Record ADRs in a `/docs/adr/` directory in the application repository, numbered sequentially (ADR-001, ADR-002). Link from architecture diagrams to the relevant ADRs.

---

## Output Format

When recommending an AWS architecture pattern, produce the following:

### Architecture Summary

```
Workload: [name and description]
Tier:     [1 / 2 / 3] -- [SLA target: 99.99% / 99.9% / 99.5%]
Pattern:  [name, e.g., "Event-Driven Microservices", "Three-Tier Web", "Serverless API"]
Region:   [primary region] + [DR region if applicable]
```

### Service Selection Decision Matrix

| Dimension | Selected Service | Considered Alternatives | Rationale |
|-----------|-----------------|------------------------|-----------|
| Compute | ECS Fargate | Lambda, EKS | Request duration > 15 min; team lacks k8s expertise |
| Database | Aurora PostgreSQL | RDS PostgreSQL, DynamoDB | Complex joins required; Serverless v2 for variable load |
| Cache | ElastiCache Redis | DAX, CloudFront | Session state + rate limiting; Redis data structures needed |
| Messaging | SQS + SNS fan-out | Kinesis, EventBridge | < 1,000 events/sec; no replay requirement |
| API | API Gateway HTTP API | REST API, ALB | No transform needed; lowest cost per request |

### Architecture Diagram (ASCII)

```
Internet
    |
[CloudFront] -- [WAF]
    |
[ALB -- 3 AZs]
    |
[ECS Fargate -- Private App Subnets]
    |              |
[ElastiCache]  [SQS Queue]
    |              |
[Aurora PostgreSQL]  [ECS Worker -- Private App Subnets]
[Multi-AZ -- Private Data Subnets]
```

### Key Configuration Parameters

```yaml
# ECS Service configuration highlights
ecs_service:
  desired_count: 3
  deployment_circuit_breaker: true
  auto_scaling:
    min_capacity: 3
    max_capacity: 20
    target_cpu: 60
    scale_in_cooldown: 300    # seconds -- conservative to avoid thrash
    scale_out_cooldown: 60    # seconds -- aggressive to absorb spikes

# RDS Aurora Serverless v2
aurora:
  engine: aurora-postgresql
  engine_version: "15.3"
  serverless_v2:
    min_acu: 0.5
    max_acu: 32               # 32 ACU = ~64 GB RAM -- size to expected peak
  multi_az: true
  backup_retention_days: 7
  deletion_protection: true

# SQS Queue
sqs_queue:
  visibility_timeout: 300     # 5x expected processing time
  message_retention: 1209600  # 14 days
  dlq:
    max_receive_count: 3
    retention: 1209600
```

### Cost Estimate

| Service | Configuration | Estimated Monthly Cost |
|---------|--------------|----------------------|
| ECS Fargate | 3 tasks @ 1vCPU/2GB, ~50% utilization | $45 |
| Aurora Serverless v2 | avg 2 ACU, Multi-AZ | $175 |
| ElastiCache Redis | cache.r7g.large, 1 replica | $165 |
| SQS | 10M requests/month | $4 |
| ALB | 1 ALB, 10 LCUs | $22 |
| **Total** | | **~$411/month** |

### Security Checklist

- [ ] All subnets follow public/app/data three-tier layout
- [ ] Security groups use SG-ID references, not CIDR ranges
- [ ] IAM roles use least-privilege policies (no `*` actions or resources)
- [ ] Secrets stored in Secrets Manager with rotation enabled
- [ ] Encryption at rest enabled on all data stores
- [ ] S3 Block Public Access enabled at account level
- [ ] CloudTrail enabled in all regions
- [ ] VPC Flow Logs enabled and shipped to CloudWatch or S3
- [ ] ALB access logs enabled and stored in S3

### Operational Runbook Outline

```
## [Service Name] Runbook

### Health Check
- URL: GET /health -- expected 200 within 2 seconds
- CloudWatch Dashboard: [link]

### Scaling
- ECS auto-scales at 60% CPU -- no manual action needed
- If DynamoDB throttles: check CloudWatch ThrottledRequests; increase provisioned capacity or switch to on-demand

### Common Failure Modes
1. Database connection exhaustion -- check RDS max_connections; add RDS Proxy if Lambda or many ECS tasks
2. SQS DLQ messages accumulating -- check CloudWatch alarm; inspect DLQ messages for error pattern; fix and redrive
3. Lambda cold starts causing timeouts -- enable Provisioned Concurrency for p99 latency-sensitive paths

### Rollback Procedure
1. CodeDeploy console -- select deployment -- click Stop and Roll Back
2. ECS: update service to previous task definition revision (revision N-1)
3. Database: Aurora point-in-time restore if data corruption; RTO ~15-30 minutes
```

---

## Rules

1. **Never deploy application or database resources in public subnets.** Public subnets are exclusively for load balancers, NAT Gateways, and jump boxes. Every year, data breaches occur from RDS instances accidentally placed in public subnets with overly permissive security groups.

2. **Never use SQS FIFO queues by default.** FIFO queues cap throughput at 3,000 TPS with batching and are 30% more expensive than Standard. Most workloads do not require strict ordering -- use Standard queues and design consumers to be idempotent instead.

3. **Never store AWS credentials on compute resources.** EC2 instance profiles, ECS task roles, and Lambda execution roles provide credentials automatically via the metadata service (IMDS). Any access key in code, environment variables, or baked into an AMI is a security violation. Enable IMDSv2 on all EC2 instances to prevent SSRF-based credential theft.

4. **Always size Lambda memory based on profiling, not intuition.** Lambda charges on duration × memory. A function at 512 MB running for 2,000ms costs the same as 1,024 MB running for 1,000ms, but the higher-memory version may deliver better user experience. Use AWS Lambda Power Tuning (open-source Step Functions state machine) to find the optimal memory setting for each function.

5. **Never create VPCs with overlapping CIDR ranges.** Once a VPC is created, the CIDR cannot be changed without destroying and recreating it. Plan a non-overlapping address space up front using RFC 1918 ranges -- document the organization-wide CIDR allocation. Overlapping CIDRs make VPC peering and Transit Gateway routing impossible.

6. **Always set DLQs on every SQS queue, SNS subscription, Lambda async invocation, and EventBridge rule.** Without DLQs, failed messages are silently discarded after exhausting retries. Every message lost in a DLQ-less queue is a business event that disappeared without investigation.

7. **Never use a single AWS account for all environments.** Production, staging, development, and security/audit should be separate AWS accounts managed via AWS Organizations. This provides billing separation, blast radius containment (a misconfigured dev IAM policy cannot affect prod), and cleaner compliance boundaries.

8. **Always set explicit log retention periods on all CloudWatch Log Groups.** The default retention is "never expire." A high-traffic service can accumulate thousands of dollars per month in CloudWatch Logs storage costs without retention policies. Set retention at Log Group creation time via IaC.

9. **Never choose Lambda for workloads with sustained high concurrency and cold start sensitivity.** Lambda cold starts range from 100ms (Python/Node.js, no VPC) to 1,500ms+ (Java in VPC). For APIs requiring < 50ms p99 latency under sustained load, ECS Fargate with pre-warmed containers is the correct choice -- even if Provisioned Concurrency is configured, it adds cost and complexity without matching container warm performance.

10. **Always use Graviton-based instances for new workloads unless a specific dependency requires x86.** Graviton3 instances (c7g, m7g, r7g, t4g) deliver 20-40% better price-performance than equivalent x86 instances. Aurora, ElastiCache, and Fargate all support Graviton. The migration path from x86 is low-risk for most containerized workloads -- test in staging first, but default to Graviton.

---

## Edge Cases

### Workload Exceeds Single-Region Capacity or Requires < 1 Minute RTO

For workloads with zero-downtime requirements across region failures, implement active-active multi-region:
- DynamoDB Global Tables: multi-region replication with ~1 second eventual consistency. Suitable for session data and user profile lookups. Not suitable for financial transactions requiring strong consistency.
- Aurora Global Database: primary region with 1-5 read replicas across secondary regions. Replication lag < 1 second. Failover to secondary region in ~1 minute (managed failover) -- promotes the secondary to primary.
- Route 53 Latency-based routing with health checks: route users to the nearest healthy region. Configure health check failure threshold at 2 consecutive failures (1-minute detection) to avoid false positives from transient errors.
- Application must be stateless or use a global session store. Never use local disk or in-memory state for user sessions in multi-region.
- Test failover quarterly with AWS FIS (Fault Injection Simulator) -- inject region-level failures in pre-production to verify RTO assumptions.

### Lambda Function Hitting Concurrency Limits During Traffic Spikes

Default Lambda concurrency limit is 1,000 per region (shared across all functions). A traffic spike can exhaust this limit, causing throttling on unrelated functions.
- Set reserved concurrency on all critical functions to guarantee allocation. Reserving 200 for a payment processor ensures it always has capacity even if an unrelated function consumes the burst.
- Set reserved concurrency to a non-zero cap on non-critical functions to prevent them from starving critical ones.
- Request a concurrency limit increase (100,000+ is routinely approved) before traffic events.
- Implement a concurrency limit alarm: CloudWatch metric `Throttles` on a Lambda function > 0 for 5 minutes should trigger P2.
- For truly burst-tolerant workloads, place an SQS queue in front of Lambda -- SQS buffers requests and Lambda processes them at its concurrency ceiling without losing messages.

### RDS Connection Exhaustion from Lambda or Many Microservices

Lambda functions create a new database connection on each cold start. At 1,000 concurrent Lambda executions, this creates 1,000 simultaneous connections -- exceeding the max_connections of even a db.r6g.2xlarge (approximately 1,000 connections at the PostgreSQL default).
- Deploy RDS Proxy in front of every RDS/Aurora instance accessed by Lambda. RDS Proxy maintains a connection pool and multiplexes application connections onto a smaller pool of persistent database connections.
- RDS Proxy reduces connection count by 30-90% for Lambda workloads. It also speeds up failover time from ~30 seconds (direct connection) to ~5 seconds.
- RDS Proxy costs approximately $0.015/hour per vCPU of the underlying DB instance -- typically $10-50/month, far less than the cost of a larger DB instance to handle raw connections.
- For ECS microservices, use PgBouncer (for PostgreSQL) or ProxySQL (for MySQL) sidecar containers as connection poolers if RDS Proxy cost is prohibitive.

### S3 Eventual Consistency Causing Data Pipeline Race Conditions

S3 is strongly consistent for new PUT and DELETE operations since December 2020, but upstream assumptions about eventual consistency often appear in legacy code and documentation.
- Strong consistency now applies per-object: after a PUT completes, any subsequent GET returns the new object. After a DELETE, any subsequent GET returns 404.
- The remaining consistency caveat: S3 Inventory and S3 List operations are eventually consistent for large buckets. Do not rely on S3 LIST to confirm a file exists immediately after upload in high-throughput pipelines. Instead, use S3 event notifications (to SQS or Lambda) as the trigger -- the notification fires only after the object is durably stored.
- For workflows where multiple producers write to the same key: use versioning or include a timestamp/UUID in the key to avoid overwrite races. S3 does not support compare-and-swap semantics.

### Data Transfer Costs Exceeding Compute Costs

AWS charges for data transfer out of a region to the internet and across regions. In data-intensive architectures, transfer fees can exceed compute and storage costs.
- Keep data processing within the same region as the data store. An ECS task in us-east-1 reading from S3 in us-west-2 incurs $0.02/GB inter-region transfer in both directions.
- Use CloudFront as a caching layer in front of S3 for any static assets or downloadable content served to users. CloudFront-to-internet transfer is $0.0085/GB (origin-pull pricing) vs. $0.09/GB for S3-to-internet direct. For large-scale content delivery, this is a 10x cost reduction.
- For data pipelines moving data between services, use VPC endpoints (S3 Gateway Endpoint, DynamoDB Gateway Endpoint) to route traffic within the AWS backbone rather than through the public internet. Gateway endpoints are free.
- For cross-region data access that cannot be avoided, use AWS PrivateLink or Direct Connect to reduce transfer costs and improve bandwidth.
- Instrument data transfer costs separately in your cost allocation tags. Tag resources with environment, service, and team to identify cost centers before they become surprises.

### Microservices with Shared Database Becoming a Bottleneck

The single shared database anti-pattern -- multiple microservices sharing one RDS cluster -- creates tight coupling and a single point of failure for independent services.
- Each microservice should own its data store. If splitting is not feasible immediately, start by assigning separate database schemas within the same cluster, with access restricted per-service via PostgreSQL roles.
- Use the Strangler Fig pattern for incremental migration: extract one service at a time to its own database, using the event stream (Kinesis/MSK) to keep the old and new databases in sync during the transition period.
- For read-heavy reporting that requires joins across service data stores, use a separate analytical data store (Redshift, Athena over S3) populated by an event-driven pipeline rather than cross-service database queries.
- If a service genuinely needs data from another service, it should request it via API (synchronous) or subscribe to events (asynchronous) -- never via direct database access.

### Managing Blast Radius in Multi-Tenant SaaS Architectures

When one tenant's workload can degrade service for all other tenants (the "noisy neighbor" problem):
- Implement per-tenant SQS queues for asynchronous processing of high-volume operations. This isolates one tenant's load from others.
- Use DynamoDB partition key design with tenant ID as a prefix to distribute tenant data across partitions. Monitor `ConsumedWriteCapacityUnits` per partition using CloudWatch Contributor Insights.
- Apply per-tenant rate limiting at API Gateway using Usage Plans. Assign each tier (free, professional, enterprise) a throttle limit and burst limit in a Usage Plan.
- For high-isolation requirements (HIPAA, financial services), consider per-tenant ECS services with dedicated Aurora clusters -- this increases cost but provides compliance and performance isolation guarantees.
- Use AWS Cost Allocation Tags with tenant IDs to track per-tenant costs and identify when a tenant's usage exceeds their pricing tier.

---

## Example

**Input:** "We're building a B2B SaaS platform for document processing. Users upload PDFs (up to 50 MB) via a web app, our system extracts text and metadata using a third-party OCR API, stores the results, and makes them searchable. We expect 1,000 uploads/day at launch, growing to 100,000/day in 18 months. Team of 4, nobody has Kubernetes experience. We need GDPR compliance. Budget is $2,000/month initially. What architecture pattern do you recommend?"

**Output:**

---

### Architecture Summary

```
Workload: B2B SaaS Document Processing Platform
Tier:     2 -- 99.9% availability SLA
Pattern:  Async Worker Pipeline with Serverless API and S3 Storage
Region:   eu-west-1 (primary) -- GDPR data residency requirement
DR:       eu-central-1 (S3 replication only at launch; promote to active-passive in 18 months)
```

---

### Rationale for Pattern Selection

This workload is a classic async pipeline pattern, not a real-time API pattern:
- Upload is synchronous (user waits for confirmation), but OCR processing takes 5-30 seconds per document -- far too long for a synchronous API response.
- Search is read-heavy with full-text requirements -- a general-purpose relational database is insufficient.
- Volume grows 100x over 18 months -- the architecture must scale without replatforming.
- Team of 4 with no Kubernetes experience rules out EKS. ECS Fargate is the correct managed container choice.
- GDPR requires: data residency in EU, right to erasure (delete-capable architecture), encryption at rest and in transit, and audit logs.

The pattern: API Gateway receives uploads -- writes to S3 -- SQS triggers ECS workers -- workers call OCR API -- results stored in RDS Aurora + OpenSearch -- search served via API Gateway.

---

### Service Selection Decision Matrix

| Dimension | Selected Service | Considered Alternatives | Rationale |
|-----------|-----------------|------------------------|-----------|
| Upload ingestion | API Gateway HTTP API + S3 presigned URLs | ALB direct, API Gateway REST API | Presigned URLs bypass API Gateway for large files (no 10 MB limit); HTTP API for metadata submission |
| File storage | S3 eu-west-1, SSE-KMS | EFS, direct disk | Object storage native for documents; KMS for GDPR encryption audit trail |
| Async trigger | S3 Event Notification -- SQS | Lambda direct, SNS | Decouples ingestion from processing; SQS buffers during OCR API rate limit periods |
| Worker compute | ECS Fargate | Lambda, EKS | Processing takes up to 30 seconds (Lambda 15-min limit ok, but cold starts add latency); no k8s expertise |
| Results database | Aurora PostgreSQL Serverless v2 | RDS PostgreSQL, DynamoDB | Relational metadata (users, documents, jobs); Serverless v2 scales to zero at 0.5 ACU overnight |
| Search | Amazon OpenSearch Serverless | RDS full-text, Elasticsearch on EC2 | Purpose-built full-text; Serverless avoids managing cluster capacity |
| Cache | ElastiCache Redis | CloudFront, DAX | Session storage + API rate limiting against OCR vendor; Redis TTL for recent search results |
| API layer | API Gateway HTTP API | REST API, ALB | No transformation needed; $1/million requests; supports JWT auth |
| Auth | Cognito User Pools | Auth0, custom JWT | GDPR-compliant IdP in EU region; built-in MFA; integrates natively with API Gateway |

---

### Architecture Diagram (ASCII)

```
Web App (React)
    |
    |-- POST /documents/upload-url --> [API Gateway HTTP API] -- [Cognito JWT authorizer]
    |                                         |
    |                                   [Lambda - generate presigned URL]
    |                                         |
    |<------- presigned S3 URL ---------------+
    |
    |-- PUT <presigned URL> --------> [S3: document-uploads-bucket (eu-west-1)]
                                            |
                                  [S3 Event Notification]
                                            |
                                       [SQS Queue]
                                     (DLQ configured)
                                            |
                               [ECS Fargate Worker -- Private Subnet]
                                   (scales 1-20 tasks on SQS depth)
                                            |
                              +-------------+-------------+
                              |                           |
                    [Third-party OCR API]      [S3: document-results-bucket]
                     (external HTTPS)          (processed text, SSE-KMS)
                              |
                    [Aurora PostgreSQL]      [OpenSearch Serverless]
                    (job metadata,            (full-text index of
                     user records,             extracted document text)
                     Serverless v2)
                              |
                    [ElastiCache Redis]
                    (session cache,
                     search result TTL)

GET /documents/search --> [API Gateway] --> [Lambda search handler]
                                                    |
                                         [OpenSearch Serverless]
                                         [Aurora PostgreSQL]
                                         [ElastiCache Redis - TTL 60s]
```

---

### Key Configuration Parameters

```yaml
# S3 Buckets
s3_uploads_bucket:
  region: eu-west-1
  versioning: enabled             # required for GDPR erasure (delete specific version)
  encryption: SSE-KMS
  kms_key: aws/s3                 # customer-managed KMS key for audit trail
  lifecycle_rules:
    - id: delete_raw_after_90_days
      expiration_days: 90         # raw uploads deleted after processing; GDPR data minimization
  block_public_access: true
  replication:                    # DR replication to eu-central-1
    destination: s3://document-uploads-backup-eu-central-1
    rule: entire_bucket

s3_results_bucket:
  region: eu-west-1
  encryption: SSE-KMS
  block_public_access: true
  lifecycle_rules:
    - id: delete_results_on_account_deletion
      tag: gdpr_erasure_pending   # application tags objects; lifecycle deletes

# SQS Queue
document_processing_queue:
  visibility_timeout: 180         # 3x max expected processing time (60s OCR + buffer)
  message_retention: 1209600      # 14 days -- allows re-processing on worker deploy
  receive_message_wait_time: 20   # long polling -- reduces empty receive calls
  redrive_policy:
    dead_letter_queue: document_processing_dlq
    max_receive_count: 3          # 3 failures before DLQ; avoids poison-pill documents

document_processing_dlq:
  message_retention: 1209600
  cloudwatch_alarm:
    metric: ApproximateNumberOfMessagesVisible
    threshold: 1
    alarm_action: sns_pagerduty_p2  # any DLQ message warrants investigation

# ECS Worker Service
ecs_worker_service:
  launch_type: FARGATE
  task_definition:
    cpu: 1024                     # 1 vCPU -- OCR API calls are I/O bound, not CPU bound
    memory: 2048                  # 2 GB -- accommodates 50 MB PDF loading in memory
    architecture: ARM64           # Graviton -- 20% better price-perf for I/O bound tasks
    container:
      image: ecr/document-worker:latest
      environment:
        LOG_LEVEL: INFO
        OCR_API_TIMEOUT: 45       # seconds
      secrets:
        OCR_API_KEY: arn:aws:secretsmanager:eu-west-1:123456789012:secret:ocr-api-key
  auto_scaling:
    min_capacity: 1
    max_capacity: 20
    scaling_policy:
      metric: sqs_messages_per_task   # custom metric: SQS depth / running task count
      target_value: 5                 # 5 messages per task before scaling out
      scale_in_cooldown: 300
      scale_out_cooldown: 30

# Aurora PostgreSQL Serverless v2
aurora_postgresql:
  engine_version: "15.4"
  serverless_v2_config:
    min_acu: 0.5                  # scales to near-zero overnight (GDPR: no idle cost)
    max_acu: 8                    # 8 ACU = ~16 GB RAM -- sufficient for 100K docs/day
  instances:
    - role: writer
      instance_class: db.serverless
    - role: reader
      instance_class: db.serverless
  multi_az: true
  backup_retention_days: 30       # GDPR: 30-day point-in-time recovery
  deletion_protection: true
  storage_encrypted: true
  performance_insights: true
  parameter_group:
    max_connections: 200          # use RDS Proxy to multiplex ECS + Lambda connections

rds_proxy:
  engine_family: POSTGRESQL
  idle_client_timeout: 1800
  connection_borrow_timeout: 30
  target: aurora_postgresql

# OpenSearch Serverless
opensearch_serverless:
  collection_type: SEARCH
  encryption_policy: aws_owned_key  # upgrade to customer-managed KMS for GDPR audit
  network_policy: vpc               # private access only -- no public endpoint
  data_access_policy:
    principal: ecs_worker_task_role
    permissions: [indices:data/write, indices:data/read]

# ElastiCache Redis
elasticache_redis:
  node_type: cache.t4g.small        # Graviton; 1.37 GB -- sufficient for session/cache
  num_cache_nodes: 2                # primary + replica for HA
  automatic_failover: true
  at_rest_encryption: true
  in_transit_encryption: true
  auth_token: true                  # Redis AUTH required

# Cognito User Pools
cognito_user_pool:
  region: eu-west-1                 # GDPR data residency
  mfa_configuration: OPTIONAL       # enforce MFA for admin roles via group policy
  password_policy:
    minimum_length: 12
    require_uppercase: true
    require_numbers: true
    require_symbols: true
  deletion_protection: ACTIVE
  advanced_security_mode: ENFORCED  # adaptive authentication; blocks compromised credentials
```

---

### GDPR Compliance Architecture Notes

1. **Data residency:** All services deployed in eu-west-1. S3 replication to eu-central-1 is within EU -- acceptable for GDPR. Confirm OCR third-party API processes data within EU -- if not, add contractual DPA or switch to a EU-hosted OCR service.

2. **Right to erasure:** Documents are stored with a user-scoped prefix in S3 (`s3://bucket/user-id/document-id/`). On account deletion, trigger a Lambda that: (a) deletes all S3 objects for the user prefix, (b) deletes Aurora rows for the user, (c) deletes OpenSearch documents by user_id query, (d) flushes ElastiCache keys prefixed with user_id.

3. **Encryption:** All data stores encrypted at rest with KMS. TLS 1.2+ enforced on all connections. CloudTrail logs all KMS key usage to S3 in eu-west-1.

4. **Audit trail:** CloudTrail enabled across all regions with a dedicated S3 bucket in a separate security/audit account. CloudTrail cannot be disabled by the application account.

5. **Data retention:** Raw uploads deleted after 90 days via S3 lifecycle policy. Processed results retained until user deletion or explicit GDPR erasure request.

---

### Cost Estimate (Launch: 1,000 uploads/day)

| Service | Configuration | Est. Monthly Cost |
|---------|--------------|-------------------|
| API Gateway HTTP API | 1M requests/month | $1 |
| S3 (uploads + results) | 200 GB storage + PUT/GET operations | $12 |
| SQS | 1M messages/month | $1 |
| ECS Fargate | avg 2 tasks × 1vCPU/2GB, ARM64, ~8h/day active | $28 |
| Aurora PostgreSQL Serverless v2 | avg 1 ACU, Multi-AZ | $87 |
| RDS Proxy | 1 vCPU target DB | $11 |
| OpenSearch Serverless | 1 OCU search, 1 OCU index | $175 |
| ElastiCache Redis | cache.t4g.small × 2 nodes | $26 |
| Lambda (presigned URL + search) | 2M invocations/month | $3 |
| Cognito | 1,000 MAU | $0 (free tier) |
| CloudWatch, CloudTrail, X-Ray | standard usage | $25 |
| NAT Gateway | 2 AZs, ~50 GB/month | $35 |
| KMS | 2 keys + API calls | $2 |
| **Total** | | **~$406/
