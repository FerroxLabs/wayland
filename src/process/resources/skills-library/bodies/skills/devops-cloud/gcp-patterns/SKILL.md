---
name: gcp-patterns
description: |
  Guides expert-level gcp architecture patterns implementation: cloud and architecture decision frameworks, production-ready patterns, and concrete templates for gcp patterns workflows.
  Use when the user asks about gcp architecture patterns, gcp patterns configuration, or cloud best practices for gcp projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cloud architecture optimization"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# GCP Patterns

## When to Use

**Use this skill when:**
- User asks how to architect a new GCP workload and needs guidance on which services to use together (e.g., "should I use Cloud Run or GKE for my API?")
- User needs a production-ready reference architecture for a specific pattern -- microservices, event-driven, data pipeline, multi-region HA, or hub-and-spoke networking
- User wants to evaluate trade-offs between GCP-native services for a concrete use case (e.g., Pub/Sub vs. Eventarc, BigQuery vs. Spanner, Cloud Run vs. Cloud Functions)
- User is designing a landing zone, shared VPC, or multi-project resource hierarchy for an organization
- User asks about GCP-specific best practices for security, cost optimization, observability, or reliability (SLOs, VPC Service Controls, Workload Identity, etc.)
- User needs to migrate an on-premises or AWS/Azure workload to GCP and wants guidance on equivalent services and migration patterns
- User is troubleshooting a GCP architecture problem and needs to understand which pattern to apply to fix it

**Do NOT use this skill when:**
- User needs Terraform or Infrastructure as Code authoring help specifically -- use the infrastructure-as-code skill instead
- User needs CI/CD pipeline design -- use the CI/CD skill in the devops-cloud subcategory
- User is asking about Kubernetes internals or Helm charts unrelated to GKE-specific GCP integration -- use the Kubernetes skill
- User needs database schema design or query optimization -- use the database skill even if the DB runs on GCP
- User asks about GCP billing anomalies or cost attribution without an architecture question -- use the cloud cost skill
- User needs application-level code design that happens to run on GCP -- this skill covers infrastructure and integration patterns, not application logic
- User is asking about a non-GCP cloud provider -- use the AWS or Azure pattern skills respectively

---

## Process

### 1. Establish Architecture Context

Before recommending any pattern, gather the following:

- **Workload type:** Is this a stateless web API, stateful service, batch pipeline, streaming pipeline, ML training/inference, or internal tooling?
- **Traffic profile:** Expected requests per second at p50 and p99, burst multiplier, diurnal vs. steady traffic. Services with 10x burst favor Cloud Run over GKE managed node pools.
- **Data residency and compliance:** Determine required regions, whether VPC Service Controls are mandatory (HIPAA, FedRAMP, PCI), and whether CMEK (Customer-Managed Encryption Keys) is required.
- **Team operational maturity:** A team with no Kubernetes experience should not start with GKE Standard; start with Cloud Run or GKE Autopilot.
- **Latency targets:** Global latency < 100ms at p95 requires multi-region with Global Load Balancer + anycast; single-region suffices for < 300ms.
- **Project hierarchy:** Determine if the org already has a resource hierarchy (folders, shared services project, host project for Shared VPC) or if this is greenfield.
- **Existing GCP footprint:** Identify existing services the workload must integrate with -- Cloud SQL, Bigtable, Spanner, Pub/Sub, etc.

### 2. Select the Core Compute Pattern

Map the workload type to the appropriate compute pattern using this decision framework:

- **Cloud Run (fully managed):** Stateless HTTP/gRPC services, event-driven containers, jobs with variable load. Choose when: team wants zero cluster management, scale-to-zero is acceptable, container startup < 4 seconds, max request timeout < 60 minutes. Limit: no GPU, no shared memory across instances, no persistent local disk.
- **GKE Autopilot:** Stateless and stateful services needing more control than Cloud Run (custom sidecars, DaemonSets not needed, mixed workload profiles). Choose when: team knows Kubernetes, wants pod-level resource specification, needs Workload Identity at pod granularity. Cost model: per-pod resource billing.
- **GKE Standard:** GPU workloads (ML inference, batch training), DaemonSet requirements, custom node configurations, Spot VM node pools for batch. Choose when: team has Kubernetes expertise, cluster-level networking control is needed, node customization is required.
- **Cloud Functions (2nd gen):** Single-function event handlers triggered by Eventarc, Pub/Sub, or HTTP. Choose for lightweight glue code < 9 minutes execution, not for complex multi-step logic.
- **Vertex AI Pipelines / Batch:** ML training, batch inference, data processing pipelines. Do not use Cloud Run for long-running batch; use Batch or Dataflow instead.
- **Compute Engine:** When you need OS-level control, bare-metal-adjacent performance, licensing constraints (Windows, SAP), or migration lift-and-shift before re-platforming.

### 3. Design the Networking Architecture

GCP networking has unique constructs that directly shape architecture patterns:

- **VPC design:** Use a Shared VPC (host project + service projects) for any organization with 3+ projects sharing networking. Never create a VPC per team -- it creates peering mesh limits (VPC peering is non-transitive; max 25 peering connections per VPC).
- **Subnet strategy:** Allocate subnets by environment and region, not by service. Use RFC 1918 ranges with /20 or larger for production to allow growth. Enable Private Google Access on every subnet so GCP-managed services (Cloud Storage, BigQuery APIs) are reachable without internet egress.
- **Hub-and-spoke with NCC:** For multi-region or hybrid connectivity, use Network Connectivity Center (NCC) with a hub VPC. Spoke VPCs connect to the hub; this solves the peering transitivity problem at scale.
- **Ingress patterns:**
  - Global HTTPS Load Balancer (anycast) -- for multi-region, latency-sensitive workloads; provides Cloud Armor WAF integration
  - Regional External Load Balancer -- for single-region external traffic
  - Internal Load Balancer (passthrough or proxy) -- for service-to-service within VPC
  - Private Service Connect -- for consuming managed services or partner services without exposing to internet
- **Egress control:** Cloud NAT for outbound internet from private VMs/pods. Never assign external IPs to production VMs unless strictly required. Use Cloud NAT logging to audit egress.
- **VPC Service Controls:** Create a service perimeter around sensitive data projects (BigQuery datasets, Cloud Storage buckets with PII). This prevents data exfiltration even by authenticated principals outside the perimeter. Required for FedRAMP High and recommended for HIPAA.

### 4. Design the Data Architecture

Data patterns in GCP are tightly coupled to compute patterns:

- **OLTP workloads:** Cloud SQL (PostgreSQL/MySQL) for < 10TB, single-region, team familiar with managed RDBMS. Cloud Spanner for global consistency, multi-region, > 10TB, or when you need 99.999% availability SLA.
- **Analytical workloads:** BigQuery is the default. Use BigQuery Storage API for high-throughput reads from Spark/Dataflow. Partition tables by date column and cluster by frequently filtered columns -- this alone reduces query costs by 60-90% on large tables.
- **Streaming ingestion:** Pub/Sub as the universal message bus. Pub/Sub Lite for high-throughput, cost-sensitive pipelines where ordering within a partition is acceptable. Use Dataflow (Apache Beam) for stateful streaming transformations before landing in BigQuery or Bigtable.
- **Cache layer:** Memorystore for Redis (primary cache) or Memorystore for Memcached (simple key-value). Use Memorystore with read replicas for read-heavy caching. Do not use Cloud Firestore as a cache -- it is a document database.
- **Object storage:** Cloud Storage with lifecycle policies. Use Standard class for frequently accessed data, Nearline (> 30 days), Coldline (> 90 days), Archive (> 365 days) for tiered cost reduction. Enable uniform bucket-level access (disable ACLs) for all new buckets.
- **Event sourcing / CDC:** Use Datastream for CDC from Cloud SQL or AlloyDB into BigQuery. Use Pub/Sub + Eventarc for GCP-native event sourcing.

### 5. Design the Identity and Security Architecture

- **Workload Identity:** Never use service account keys for GCP-hosted workloads. Use Workload Identity Federation for GKE (binds a Kubernetes service account to a GCP service account) and the metadata server for Cloud Run and Compute Engine. Service account keys should only appear in CI/CD secrets for off-GCP runners.
- **IAM principle of least privilege:** Use predefined roles over primitive roles (Owner, Editor -- never use Editor in production). Prefer roles/cloudsql.client over roles/cloudsql.admin. Audit custom roles quarterly.
- **Secret management:** Always use Secret Manager for credentials, API keys, and certificates. Reference secrets as environment variables in Cloud Run using `--set-secrets` or as mounted volumes in GKE with External Secrets Operator.
- **Binary Authorization:** Enforce in GKE and Cloud Run to ensure only attested container images from your Artifact Registry are deployed. Configure attestors tied to your CI pipeline.
- **Organization Policy Constraints:** Apply at the folder or org level: `constraints/compute.requireOsLogin`, `constraints/iam.disableServiceAccountKeyCreation`, `constraints/compute.vmExternalIpAccess` (deny all or allowlist specific projects). These are the guardrails that prevent common misconfigurations at scale.
- **Cloud Armor:** Attach to Global Load Balancer for WAF rules. Enable adaptive protection (ML-based DDoS detection) for public APIs. Use pre-configured WAF rule sets (OWASP Top 10) as the baseline.

### 6. Design the Observability Stack

- **Metrics:** Cloud Monitoring is the primary platform. Define custom SLOs in Cloud Monitoring using request-based SLIs (good requests / total requests). Target 99.9% availability (43.8 minutes downtime/month), 99.95% for business-critical, 99.99% for financial/healthcare.
- **Logging:** Cloud Logging with log-based metrics for alerting on error rates. Use log sinks to export to BigQuery for long-term retention (> 30 days) and analysis. Always include structured JSON logs from applications -- unstructured logs cannot be queried efficiently in Log Explorer.
- **Tracing:** Cloud Trace for distributed tracing. Enable auto-instrumentation in Cloud Run via the `GOOGLE_CLOUD_PROJECT` environment variable with OpenTelemetry SDK. Correlate trace IDs with log entries using the `logging.googleapis.com/trace` log field.
- **Dashboards and alerting:** Create dashboards per service with: request rate, error rate (4xx, 5xx separately), latency (p50, p95, p99), and resource utilization. Alert on error budget burn rate (2x burn rate for 1-hour window + 5x burn rate for 5-minute window) rather than raw error rate.
- **Uptime checks:** Configure Cloud Monitoring uptime checks for all external endpoints. Set 1-minute check interval from 3+ global locations. Alert if 2+ locations fail.

### 7. Apply the Pattern Template and Document

- Produce a reference architecture diagram description (service list, data flows, security boundaries)
- Create a decision matrix comparing the recommended pattern against alternatives considered
- Write an Architecture Decision Record (ADR) for every non-obvious choice
- Specify the Terraform module structure or gcloud commands needed to implement the pattern
- Define the rollout sequence: networking first, then IAM, then data services, then compute, then ingress

---

## Output Format

```
## GCP Architecture Pattern: [Pattern Name]

### Architecture Summary
Workload type: [stateless API / streaming pipeline / batch / etc.]
Primary region: [e.g., us-central1]
Secondary region (if HA): [e.g., us-east1]
Availability target: [e.g., 99.9% -- 43.8 min/month error budget]
Compliance requirements: [e.g., PCI DSS, none, HIPAA]

### Component Map
| Layer          | GCP Service              | Configuration Notes                              |
|----------------|--------------------------|--------------------------------------------------|
| Ingress        | Global HTTPS LB          | anycast, Cloud Armor WAF attached                |
| Compute        | Cloud Run (managed)      | min-instances: 2, concurrency: 80, CPU: 1        |
| Data (primary) | Cloud SQL PostgreSQL 14  | HA replica, automated backups, private IP only   |
| Cache          | Memorystore Redis 7      | 2GB, read replica, auth enabled                  |
| Messaging      | Pub/Sub                  | dead-letter topic after 5 delivery attempts      |
| Secrets        | Secret Manager           | versioned, CMEK encrypted, accessed via binding  |
| Observability  | Cloud Monitoring + Trace | SLO defined, alerting on burn rate               |
| Registry       | Artifact Registry        | Docker repo, Binary Authorization enforced       |
| Networking     | Shared VPC               | Private Google Access, Cloud NAT, no public IPs  |

### Network Topology
[Host project] Shared VPC host
  └── [service-project-a] Cloud Run + Cloud SQL
  └── [service-project-b] GKE cluster
  └── [data-project] BigQuery + GCS buckets (VPC-SC perimeter)

Ingress: Global LB → (anycast) → Cloud Run (private VPC connector)
Service-to-DB: Cloud Run → Cloud SQL Auth Proxy (IAM auth, no passwords)
Egress: Cloud NAT (static IP for allowlisting)

### IAM Bindings
| Principal                        | Role                          | Scope              |
|----------------------------------|-------------------------------|--------------------|
| Cloud Run SA (sa-api@...)        | roles/cloudsql.client         | Cloud SQL instance |
| Cloud Run SA (sa-api@...)        | roles/secretmanager.accessor  | specific secrets   |
| Cloud Run SA (sa-api@...)        | roles/pubsub.publisher        | specific topic     |
| CI/CD SA (sa-cicd@...)           | roles/run.developer           | Cloud Run service  |
| CI/CD SA (sa-cicd@...)           | roles/artifactregistry.writer | specific repo      |

### Decision Matrix
| Criterion           | Chosen: Cloud Run      | Alt: GKE Autopilot     | Alt: App Engine Std   |
|---------------------|------------------------|------------------------|-----------------------|
| Ops complexity      | Low (no cluster mgmt)  | Medium (pod specs)     | Low (managed)         |
| Scale-to-zero       | Yes (cost saving)      | No (min 1 pod billing) | Yes                   |
| Cold start (p95)    | ~800ms (optimized img) | ~2s (pod scheduling)   | ~200ms (warm)         |
| Custom networking   | VPC connector          | Full VPC native        | Limited               |
| GPU support         | No                     | Yes                    | No                    |
| Max request timeout | 60 min                 | Unlimited              | 10 min (F2 instance)  |
| Recommendation      | ✅ Best fit            | If GPU or DaemonSet    | Legacy only           |

### Architecture Decision Records
ADR-001: Use Cloud SQL over Cloud Spanner
- Context: PostgreSQL-compatible OLTP, < 5TB, single-region initially
- Decision: Cloud SQL PostgreSQL with HA replica
- Rationale: Spanner costs $0.90/node-hour minimum ($648/month for 1 node) vs Cloud SQL ~$150/month for db-n1-standard-4. Spanner adds value at global multi-region consistency requirement or > 2000 QPS write throughput.
- Revisit trigger: > 5TB database size, multi-region write requirement, or > 2000 write QPS sustained

ADR-002: Shared VPC over per-service VPCs
- Context: Organization has 5+ GCP projects
- Decision: Shared VPC with host project
- Rationale: Avoids VPC peering mesh (non-transitive), centralizes firewall management, enables consistent RFC 1918 addressing
- Revisit trigger: BU isolation requirement with different network security postures

### Terraform Module Structure
modules/
  network/          # VPC, subnets, Cloud NAT, firewall rules
  iam/              # service accounts, bindings, org policies
  data/             # Cloud SQL, Memorystore, Secret Manager
  compute/          # Cloud Run services, Cloud Run jobs
  ingress/          # Global LB, backend services, Cloud Armor
  observability/    # dashboards, alert policies, SLOs, uptime checks

environments/
  dev/              # tfvars with reduced capacity, no HA replica
  staging/          # mirrors prod topology, smaller machine types
  prod/             # full HA, larger instances, SLO alerting active

### Rollout Sequence
Phase 1 (Day 1): network module -- VPC, subnets, Cloud NAT
Phase 2 (Day 1): iam module -- service accounts, org policy constraints
Phase 3 (Day 2): data module -- Cloud SQL, Memorystore, Secret Manager secrets
Phase 4 (Day 3): compute module -- Cloud Run service with min-instances: 0 for validation
Phase 5 (Day 3): ingress module -- Load balancer, Cloud Armor policies
Phase 6 (Day 4): observability module -- SLOs, dashboards, alert policies
Phase 7 (Day 5): Binary Authorization attestor, CI/CD integration, min-instances: 2
```

---

## Rules

1. **Never use primitive IAM roles (Owner, Editor) in production.** Primitive roles grant project-wide permissions. A Cloud Run service needing Cloud SQL access should get `roles/cloudsql.client` bound to the Cloud SQL instance, not `roles/editor` on the project.

2. **Never assign external IP addresses to VMs or GKE nodes by default.** Use Cloud NAT for outbound and Internal Load Balancers for internal service communication. External IPs on VMs are attack surface. Enforce with the `constraints/compute.vmExternalIpAccess` org policy.

3. **Never use service account keys for workloads running inside GCP.** Workload Identity (GKE), the metadata server (Compute Engine), and the Cloud Run service identity eliminate the key rotation burden and reduce credential leakage risk. Service account keys should only exist in off-GCP CI runners and must be rotated every 90 days maximum.

4. **Always define Cloud SQL as private IP only.** Public IP on Cloud SQL is never recommended in production. Use the Cloud SQL Auth Proxy (authenticates via IAM, encrypts the tunnel) or Private Service Connect for application connectivity.

5. **Always partition BigQuery tables before querying.** An unpartitioned 10TB BigQuery table queried daily at $5/TB = $50/day = $1,500/month for a single query. Partition by ingestion date or a timestamp column. Cluster by the next most filtered column. Require partition filter in the table settings (`requirePartitionFilter: true`) to prevent accidental full scans.

6. **Never create more than 25 VPC peering connections per VPC.** GCP enforces this hard limit. For organizations exceeding this, use Network Connectivity Center hub-and-spoke or Shared VPC instead of peer meshes.

7. **Always set min-instances > 0 for latency-sensitive Cloud Run services.** Scale-to-zero causes cold starts of 500ms-3s depending on image size and runtime. Set `min-instances: 1` for p95 latency requirements below 500ms, `min-instances: 2` for HA during rolling deployments.

8. **Never store secrets in environment variables as plaintext in Cloud Run or GKE manifests.** Use Secret Manager references in Cloud Run (`--set-secrets ENV_VAR=secret-name:latest`) or External Secrets Operator in GKE. Plaintext secrets in deployment configs end up in version control and Cloud Logging.

9. **Always enable VPC Service Controls for projects handling PII, PHI, PCI, or regulated data.** VPC Service Controls prevent data exfiltration to unauthorized GCP projects even by authenticated users. Without them, a compromised service account can copy Cloud Storage data to an attacker-controlled project.

10. **Always alert on SLO burn rate, not raw error rate thresholds.** A 1% error rate alert on a low-traffic service fires constantly for irrelevant noise. A burn rate alert (consuming 2x the hourly error budget) fires only when the system is on track to exhaust the monthly budget -- the right signal at the right time.

11. **Never use Cloud Firestore or Datastore as a general-purpose cache.** Firestore has a 1-second write lock per document. High-frequency cache writes cause contention. Use Memorystore for Redis for all caching needs.

12. **Always use Artifact Registry instead of Container Registry.** Container Registry (gcr.io) is deprecated as of May 2023. Artifact Registry provides per-repository IAM, multi-format support (Docker, Maven, npm, Python), and is the required path for Binary Authorization attestation.

---

## Edge Cases

### Multi-Region Active-Active with Cloud Spanner
When the workload requires < 10ms global write latency across US and EU simultaneously, Cloud Spanner with a multi-region configuration is the only GCP-native option. Key considerations: Spanner multi-region instances add 2-3x latency overhead vs. single-region for reads (due to Paxos quorum across regions). Use regional read-only endpoints for read-heavy workloads. Cost is significant -- a `nam6` (North America 6-region) Spanner instance with 3 nodes costs ~$5,832/month. Validate that the workload actually requires multi-region writes before committing; 90% of "global" applications only need multi-region reads, which Cloud SQL read replicas handle at 1/10th the cost.

### Hybrid Connectivity (On-Premises to GCP)
When workloads span on-premises data centers and GCP, the connectivity choice determines the entire architecture:
- **Cloud Interconnect (Dedicated):** 10Gbps or 100Gbps physical circuits. Use when sustained bandwidth > 300Mbps or when SLA requirements > 99.9%. 99.99% SLA requires two Dedicated Interconnect attachments in different metro locations. Provisioning takes 4-8 weeks.
- **Cloud Interconnect (Partner):** For < 10Gbps, faster provisioning (1-2 weeks), lower commitment. Bandwidth from 50Mbps to 50Gbps.
- **Cloud VPN (HA VPN):** Use for < 3Gbps, dev/staging environments, or as backup to Interconnect. HA VPN with two tunnels provides 99.99% SLA. Max throughput ~3Gbps per tunnel pair.
- **Pattern:** Route on-premises to GCP via the Shared VPC host project only. Never create VPN/Interconnect attachments in service projects -- it creates routing complexity and bypasses centralized firewall control.

### GKE Autopilot vs. Standard Node Pool Cost Optimization
Autopilot bills per pod resource request (CPU and memory) rather than per node. This is cheaper for bursty or variable workloads but more expensive when pods have high resource requests relative to what they actually use. Concrete example: a pod requesting 4 CPU / 8GB RAM but using 0.5 CPU / 2GB RAM costs $0.048/vCPU-hour in Autopilot vs. the actual node utilization cost in Standard. For steady, predictable workloads with > 70% resource utilization, GKE Standard with committed use discounts (CUDs) is typically 30-40% cheaper. Always run both options through the GCP pricing calculator with actual pod specs before deciding.

### Cloud Run Cold Start Mitigation for Large Images
Cloud Run cold starts increase with image size. An image > 500MB will have cold starts of 3-5 seconds even with optimized code. Mitigation techniques in priority order:
1. Use multi-stage Docker builds to reduce final image size. A Node.js app should have a build stage and a runtime stage using `node:18-slim` or `gcr.io/distroless/nodejs18`. Target < 100MB compressed.
2. Enable CPU always-on with `--cpu-always-allocated` if the service processes background work (Pub/Sub push subscriptions). This prevents the CPU throttling that causes initialization slowness.
3. Set `min-instances: 1` for production services and use Cloud Scheduler to send a synthetic request every 5 minutes if scale-to-zero is cost-required.
4. Use Cloud Run's startup CPU boost feature (`--cpu-boost`) which temporarily doubles CPU during cold start initialization.

### BigQuery Slot Contention Under On-Demand Pricing
Under BigQuery on-demand pricing ($5/TB scanned), high-concurrency analytical workloads create unpredictable query latency when multiple teams run large queries simultaneously. Symptoms: queries that run in 10 seconds at low concurrency take 3-5 minutes under load. Resolution path:
- Move to BigQuery reservations (flat-rate pricing) when monthly on-demand spend exceeds ~$5,000/month or when p95 query latency SLOs exist.
- Use BigQuery reservation slots: 100 slots minimum ($2,000/month committed 1-year). Use flex slots ($0.04/slot-hour) for burst capacity.
- Implement workload management: assign priority 100 to BI dashboards, priority 200 to batch ETL jobs, priority 300 to ad-hoc analyst queries. Higher priority number = lower precedence.
- For real-time dashboards requiring < 1 second query latency, use BigQuery BI Engine (in-memory cache) or materialize to Bigtable for point lookups.

### VPC Service Controls Breaking Legitimate Workflows
VPC Service Controls (VPC-SC) perimeters are the most common source of hard-to-debug 403 errors in GCP. When a service account outside the perimeter tries to access a resource inside, it gets a generic "Access denied" error that does not mention VPC-SC. Diagnostic approach:
1. Check the `cloudaudit.googleapis.com/policy` log in Cloud Logging -- VPC-SC violations appear here with `policyViolationInfo` fields.
2. Use dry-run mode (`enforcementMode: DRY_RUN`) before enforcing a new perimeter. This logs violations without blocking access.
3. Common legitimate access patterns that require explicit perimeter bridges or ingress/egress rules: Cloud Build accessing BigQuery during CI, Looker (external) accessing BigQuery, Dataflow reading from Cloud Storage while writing to BigQuery (all three services must be in the same perimeter or have explicit access levels defined).
4. Service account access levels (`accessPolicies/*/accessLevels/`) are the correct mechanism for granting specific SAs access to perimeter resources from outside -- not perimeter exceptions.

### Shared VPC with Multiple Subnets and GKE Secondary Ranges
GKE requires two secondary IP ranges per subnet: one for pods (recommend /17 for large clusters -- 32,767 pod IPs) and one for services (recommend /22 -- 1,024 service IPs). In a Shared VPC, these secondary ranges must be pre-planned in the host project before GKE clusters are created in service projects. Running out of secondary IP space requires cluster recreation -- there is no in-place expansion. Best practice: allocate /16 for pods and /20 for services per GKE cluster, even if current cluster is small. Use the `subnetwork-range-name` and `cluster-secondary-range-name` flags explicitly when creating GKE clusters in Shared VPC to avoid GKE creating its own ranges.

---

## Example

**Input:** "We're building a real-time order processing system for an e-commerce platform. We expect 500 orders/minute at peak (Black Friday could be 5x that). Orders come in via REST API, need to be processed (inventory check, payment, fulfillment dispatch), and we need a record of every order in our analytics system. We have 8 engineers, most have experience with containers but not Kubernetes. PCI DSS compliance is required. What GCP architecture do you recommend?"

---

**Output:**

## GCP Architecture Pattern: Event-Driven Order Processing (PCI DSS)

### Architecture Summary
```
Workload type:     Event-driven microservices + streaming analytics
Primary region:    us-central1 (low latency to payment processors, low cost)
Secondary region:  us-east1 (HA for stateful services)
Availability target: 99.95% -- 4.38 hours/year error budget
Compliance:        PCI DSS Level 1 -- VPC Service Controls required, CMEK required
Peak throughput:   2,500 orders/minute (500 * 5x Black Friday factor)
```

### Component Map

| Layer | GCP Service | Configuration Notes |
|---|---|---|
| Ingress | Global HTTPS Load Balancer | Cloud Armor WAF, TLS 1.2+ enforced, DDoS protection |
| API Compute | Cloud Run (managed) | min-instances: 3, concurrency: 50, CPU: 2, memory: 1GB |
| Order Queue | Pub/Sub | `orders-received` topic, dead-letter after 5 attempts |
| Inventory Svc | Cloud Run | min-instances: 2, concurrency: 80, connects to Spanner |
| Payment Svc | Cloud Run | min-instances: 2, concurrency: 20, connects to Cloud SQL |
| Fulfillment Svc | Cloud Run | min-instances: 1, concurrency: 50, publishes to `fulfillment-events` |
| Order State (OLTP) | Cloud Spanner (multi-region nam6) | 3 nodes, 99.999% SLA, strong consistency |
| Payment Records | Cloud SQL PostgreSQL 15 HA | Private IP, automated daily backup, point-in-time recovery |
| Analytics | BigQuery | partitioned by `order_date`, clustered by `status`, `region` |
| Streaming ETL | Dataflow (streaming) | Pub/Sub → Dataflow → BigQuery, exactly-once semantics |
| Cache | Memorystore Redis 7 | 4GB, read replica, auth + TLS enabled, inventory counts |
| Secrets | Secret Manager | CMEK with Cloud HSM-backed key, all payment credentials |
| Container Images | Artifact Registry | Docker repo, Binary Authorization enforced in Cloud Run |
| Networking | Shared VPC | Private Google Access, Cloud NAT, no external IPs |
| Security Perimeter | VPC Service Controls | Perimeter around data-project: Spanner, BigQuery, Cloud SQL |

### Network Topology

```
[host-project]  Shared VPC (10.0.0.0/8)
  Subnets:
    10.0.0.0/20  -- us-central1  -- compute services
    10.0.16.0/20 -- us-east1     -- HA replicas

[pci-compute-project]  Service project
  Cloud Run services (private VPC connector: 10.0.1.0/28)
  All services: private IP only, no external endpoints

[pci-data-project]  Service project (inside VPC-SC perimeter)
  Cloud Spanner (order state)
  Cloud SQL PostgreSQL (payment records)
  BigQuery dataset (analytics)
  Cloud Storage (audit logs, exports)

VPC-SC Perimeter: "pci-data-perimeter"
  Restricted services: spanner.googleapis.com, bigquery.googleapis.com,
                       sqladmin.googleapis.com, storage.googleapis.com
  Ingress rule: Cloud Run SAs (pci-compute-project) allowed
  Access level: CI/CD SA from Cloud Build allowed for deployments

Traffic flows:
  Internet → Global LB (Cloud Armor) → Cloud Run API (VPC connector)
  Cloud Run API → Pub/Sub (orders-received topic)
  Pub/Sub → Cloud Run Inventory, Payment, Fulfillment (push subscriptions)
  Cloud Run services → Cloud Spanner (via Private Service Connect)
  Cloud Run Payment Svc → Cloud SQL Auth Proxy (IAM auth, no passwords)
  Pub/Sub (order-events) → Dataflow → BigQuery
  All outbound → Cloud NAT (2 static IPs allowlisted at payment processor)
```

### IAM Bindings

| Principal | Role | Scope |
|---|---|---|
| sa-api-cloudrun@pci-compute.iam | roles/pubsub.publisher | orders-received topic only |
| sa-api-cloudrun@pci-compute.iam | roles/spanner.databaseUser | order-db database only |
| sa-api-cloudrun@pci-compute.iam | roles/secretmanager.secretAccessor | api-secrets/* |
| sa-payment-svc@pci-compute.iam | roles/cloudsql.client | payment-db instance only |
| sa-payment-svc@pci-compute.iam | roles/secretmanager.secretAccessor | payment-secrets/* |
| sa-dataflow@pci-data.iam | roles/bigquery.dataEditor | analytics dataset only |
| sa-dataflow@pci-data.iam | roles/pubsub.subscriber | order-events-sub subscription |
| sa-cicd@pci-build.iam | roles/run.developer | all Cloud Run services |
| sa-cicd@pci-build.iam | roles/artifactregistry.writer | docker-repo only |

### Decision Matrix

| Criterion | Cloud Spanner (chosen) | Cloud SQL HA | Cloud Firestore |
|---|---|---|---|
| Multi-region HA | Yes (99.999% SLA) | Read replica only | Yes (multi-region) |
| Strong consistency | Yes (external) | Yes (single-region) | Eventual (default) |
| Write throughput | 2000 QPS/node | ~500 QPS | ~1 write/doc/sec |
| PCI audit trail | Yes (change streams) | Point-in-time recovery | Limited |
| Cost (3 nodes nam6) | ~$5,832/month | ~$300/month HA | Per-operation |
| Recommendation | ✅ Order state (high QPS, HA) | ✅ Payment records (relational, auditable) | ❌ Not for OLTP |

| Criterion | Cloud Run (chosen for API) | GKE Autopilot | GKE Standard |
|---|---|---|---|
| Ops burden | Minimal | Medium | High |
| Kubernetes exp. req. | No | Yes | Yes |
| Scale-to-zero | Yes (set min-instances: 3 for prod) | No | No |
| 5x burst handling | Automatic (Cloud Run scales in seconds) | Pod scheduling ~30-60s | Node provisioning ~2-4 min |
| PCI network isolation | VPC connector | VPC-native pods | VPC-native pods |
| Recommendation | ✅ Best fit for team maturity + burst | If team gains K8s expertise | Not yet |

### Architecture Decision Records

**ADR-001: Cloud Spanner for Order State**
- Context: 2,500 peak orders/minute, PCI compliance, 99.95% uptime target, 8 engineers without DBA expertise
- Decision: Cloud Spanner `nam6` multi-region, 3 nodes
- Rationale: Cloud SQL HA provides 99.95% but only within a single region; a region failure causes a 1-2 minute failover gap. At 2,500 orders/minute, that is 2,500-5,000 lost orders during failover. Spanner `nam6` provides 99.999% SLA with no failover gap. Change streams provide the audit trail required for PCI DSS Requirement 10.
- Revisit trigger: Monthly cost > $10,000 -- at that scale, dedicated Spanner nodes with CUDs reduce cost by 20%.

**ADR-002: Pub/Sub for Order Pipeline (Not Synchronous)**
- Context: Inventory, payment, and fulfillment must all succeed for an order. Tight synchronous coupling creates latency and failure propagation.
- Decision: API publishes to Pub/Sub `orders-received`. Downstream services consume via push subscriptions. Saga pattern: each service publishes success/failure to `order-events` topic; a state machine in Cloud Spanner tracks order status.
- Rationale: Decoupling allows each service to scale independently. Payment processing averages 800ms; without decoupling, API p95 latency would be > 1 second. Pub/Sub provides at-least-once delivery with dead-letter queuing for failed messages.
- Trade-off: Eventual consistency in the order pipeline. A customer sees "Order processing" for 2-4 seconds before confirmation. Acceptable for e-commerce; revisit if synchronous confirmation is a hard product requirement.

**ADR-003: Dataflow for Pub/Sub to BigQuery (Not Pub/Sub BigQuery Subscription)**
- Context: PCI requires transforming and masking PAN (Primary Account Number) data before it enters the analytics warehouse.
- Decision: Dataflow streaming pipeline with Apache Beam PAN masking step (replace card digits with `****`) between Pub/Sub and BigQuery.
- Rationale: The native Pub/Sub-to-BigQuery subscription writes raw events without transformation. Dataflow allows the PAN masking, schema validation, and deduplication steps required for PCI compliance and data quality.

### Implementation Commands (Key Steps)

```bash
# 1. Enable required APIs in each project
gcloud services enable \
  run.googleapis.com spanner.googleapis.com pubsub.googleapis.com \
  secretmanager.googleapis.com cloudkms.googleapis.com \
  binaryauthorization.googleapis.com dataflow.googleapis.com \
  --project=pci-compute-project

# 2. Create CMEK key for Secret Manager and Spanner
gcloud kms keyrings create pci-keyring \
  --location=us-central1 --project=pci-data-project
gcloud kms keys create pci-data-key \
  --keyring=pci-keyring --location=us-central1 \
  --purpose=encryption --project=pci-data-project

# 3. Create Cloud Spanner instance
gcloud spanner instances create order-processing \
  --config=nam6 --nodes=3 \
  --description="PCI Order State" \
  --project=pci-data-project

# 4. Create Cloud Run service with min-instances and VPC connector
gcloud run deploy order-api \
  --image=us-central1-docker.pkg.dev/pci-compute-project/docker-repo/order-api:v1.0.0 \
  --region=us-central1 \
  --min-instances=3 \
  --max-instances=200 \
  --concurrency=50 \
  --cpu=2 \
  --memory=1Gi \
  --service-account=sa-api-cloudrun@pci-compute-project.iam.gserviceaccount.com \
  --set-secrets=PAYMENT_API_KEY=payment-api-key:latest \
  --vpc-connector=projects/host-project/locations/us-central1/connectors/pci-connector \
  --vpc-egress=all-traffic \
  --no-allow-unauthenticated \
  --project=pci-compute-project
```

### Rollout Sequence

```
Phase 1 (Day 1-2):   Terraform network module -- Shared VPC, subnets, Cloud NAT, VPC-SC dry-run mode
Phase 2 (Day 2):     Terraform IAM module -- SAs, org policy constraints, CMEK keys
Phase 3 (Day 3-4):   Terraform data module -- Cloud Spanner, Cloud SQL, Pub/Sub topics + dead-letter
Phase 4 (Day 4):     Terraform compute module -- Cloud Run services, min-instances: 0 for smoke testing
Phase 5 (Day 5):     Terraform ingress module -- Global LB, SSL cert, Cloud Armor OWASP rules
Phase 6 (Day 6):     Terraform observability -- SLOs (99.95%), burn rate alerts, dashboards
Phase 7 (Day 7):     Dataflow streaming pipeline -- Pub/Sub to BigQuery with PAN masking
Phase 8 (Day 8):     Binary Authorization -- attestor, attestation in CI/CD, enforced in Cloud Run
Phase 9 (Day 9):     VPC-SC enforcement mode ON -- monitor policy violation logs for 48 hours
Phase 10 (Day 10):   Load test at 3x peak (7,500 orders/minute) -- validate autoscaling, SLO compliance
```

### Observability Configuration

```
SLO Definition (Cloud Monitoring):
  Service: order-api
  SLI type: Request-based availability
  Good request: HTTP 2xx responses to /v1/orders
  Total requests: All requests to /v1/orders
  Target: 99.95% over 30-day rolling window

Alert policies:
  1. Burn rate alert -- 2% budget consumed in 1 hour (fast burn):
     Condition: burn_rate > 14.4 for 5 minutes
     Severity: CRITICAL, page on-call immediately

  2. Burn rate alert -- 10% budget consumed in 6 hours (slow burn):
     Condition: burn_rate > 6 for 30 minutes
     Severity: WARNING, create incident ticket

  3. Pub/Sub dead-letter backlog:
     Condition: subscription/num_undelivered_messages on orders-dlq > 5
     Severity: CRITICAL -- indicates payment or inventory service failures

  4. Cloud Spanner CPU utilization:
     Condition: instance/cpu/utilization_by_priority > 0.65 for 15 minutes
     Action: scale to 4 nodes (at 65% CPU, latency begins degrading; add node before hitting 75%)
```

This architecture handles 2,500 orders/minute with headroom to 10,000+ through Cloud Run autoscaling, maintains PCI DSS compliance through VPC Service Controls and CMEK, and is operationally maintainable by an 8-engineer team without Kubernetes expertise. The total infrastructure cost at steady state is approximately $8,500-$9,000/month, dominated by Cloud Spanner ($5,832/month for 3 `nam6` nodes) -- justified by the 99.999% SLA and PCI audit trail requirements.
