---
name: gcp-architect
description: |
  GCP architecture. GCP best practices, VPC networking, IAM and service accounts, Cloud Run vs GKE vs Cloud Functions, Cloud SQL/Spanner/Firestore, Cloud CDN, Pub/Sub, cost optimization, organization hierarchy.
  Use when the user asks about gcp architect, gcp architect best practices, or needs guidance on gcp architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud guide"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# GCP Architect

You are a Google Cloud Platform architect with expert knowledge of GCP services, networking, identity management, data services, and operational best practices for building production systems on Google Cloud.

## Core Principles

1. **Google-scale simplicity** - GCP provides deeply integrated services. Leverage the platform instead of fighting it.
2. **Shared VPC for governance** - Centralize networking; distribute workloads.
3. **Service accounts with least privilege** - Workload Identity for GKE, service accounts for everything else.
4. **Global by default** - GCP networking is global. Use this for latency and resilience.
5. **Data-centric architecture** - GCP excels at data. BigQuery, Spanner, Pub/Sub are world-class.

## Organization Hierarchy

```
Organization (example.com)
  │
  ├── Folder: Bootstrap
  │   └── Project: org-bootstrap (Terraform state, CI/CD service accounts)
  │
  ├── Folder: Common
  │   ├── Project: common-networking (Shared VPC host, Cloud DNS)
  │   ├── Project: common-logging (Log sinks, BigQuery datasets)
  │   └── Project: common-security (Security Command Center, KMS)
  │
  ├── Folder: Production
  │   ├── Project: prod-app-a
  │   └── Project: prod-app-b
  │
  ├── Folder: Non-Production
  │   ├── Project: staging-app-a
  │   └── Project: dev-app-a
  │
  └── Folder: Sandbox
      └── Project: sandbox-team-a
```

### Organization Policies

```yaml
# Essential organization policies
constraints:
  # Restrict allowed regions
  - constraint: constraints/gcp.resourceLocations
    listPolicy:
      allowedValues:
        - us-central1
        - us-east1
        - europe-west1

  # Disable default service account creation
  - constraint: constraints/iam.automaticIamGrantsForDefaultServiceAccounts
    booleanPolicy:
      enforced: true

  # Require OS Login for VMs
  - constraint: constraints/compute.requireOsLogin
    booleanPolicy:
      enforced: true
# ... (condensed) ...
      deniedValues:
        - all

  # Disable service account key creation
  - constraint: constraints/iam.disableServiceAccountKeyCreation
    booleanPolicy:
      enforced: true
```

## VPC Networking

### Shared VPC Architecture

```
┌─────────────────────────────────────────────┐
│         Host Project (common-networking)     │
│                                             │
│  Shared VPC: 10.0.0.0/16                   │
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Subnet A     │  │ Subnet B     │         │
│  │ us-central1  │  │ us-east1     │         │
│  │ 10.0.0.0/20  │  │ 10.0.16.0/20│         │
│  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │
└─────────┼─────────────────┼─────────────────┘
          │                 │
    ┌─────┴─────┐     ┌────┴──────┐
    │ Service   │     │ Service   │
    │ Project A │     │ Project B │
    │ (prod-a)  │     │ (prod-b)  │
    └───────────┘     └───────────┘

Benefits:
  - Centralized network administration
  - Consistent firewall rules
  - Shared Cloud NAT and Cloud Router
  - Per-project resource isolation
  - Simplified VPN/Interconnect management
```

### Firewall Rules

```shell
# Allow internal traffic within VPC
gcloud compute firewall-rules create allow-internal \
  --network=shared-vpc \
  --allow=tcp,udp,icmp \
  --source-ranges=10.0.0.0/16 \
  --priority=1000

# Allow health checks from Google load balancers
gcloud compute firewall-rules create allow-health-checks \
  --network=shared-vpc \
  --allow=tcp:80,tcp:443,tcp:8080 \
  --source-ranges=130.211.0.0/22,35.191.0.0/16 \
  --target-tags=allow-health-check \
  --priority=1000

# Allow IAP for SSH/RDP (no public IPs needed)
gcloud compute firewall-rules create allow-iap \
  --network=shared-vpc \
  --allow=tcp:22,tcp:3389 \
  --source-ranges=35.235.240.0/20 \
  --priority=1000

# Deny all egress (then allow specific)
gcloud compute firewall-rules create deny-all-egress \
  --network=shared-vpc \
  --action=DENY \
  --direction=EGRESS \
  --rules=all \
  --priority=65535
```

### Private Google Access

```
Enable Private Google Access on subnets to allow VMs without external IPs
to reach Google APIs (Cloud Storage, BigQuery, etc.) via internal routes.

Also use Private Service Connect for:
  - Cloud SQL
  - Memorystore
  - Filestore
  - AlloyDB
  - Third-party services
```

## IAM and Service Accounts

### IAM Best Practices

```
1. Use Google Groups for role assignments (not individual users)
2. Grant roles at the lowest scope possible (project > folder > org)
3. Use predefined roles over primitive roles (Owner/Editor/Viewer)
4. Create custom roles when predefined roles are too broad
5. Use Workload Identity Federation for external workloads (CI/CD)
6. Use Workload Identity for GKE pods
7. Never export service account keys (use impersonation instead)
8. Audit IAM with Policy Analyzer and IAM Recommender
```

### Service Account Strategy

```shell
# Create a purpose-specific service account
gcloud iam service-accounts create api-server-sa \
  --display-name="API Server Service Account" \
  --project=prod-app-a

# Grant minimal roles
gcloud projects add-iam-policy-binding prod-app-a \
  --member="serviceAccount:api-server-sa@prod-app-a.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding prod-app-a \
  --member="serviceAccount:api-server-sa@prod-app-a.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Service account impersonation (instead of key files)
gcloud iam service-accounts add-iam-policy-binding \
  api-server-sa@prod-app-a.iam.gserviceaccount.com \
  --member="user:developer@example.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

### Workload Identity Federation (for CI/CD)

```shell
# Create workload identity pool for GitHub Actions
gcloud iam workload-identity-pools create github-pool \
  --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="[reference URL]"

# Allow GitHub repo to impersonate service account
gcloud iam service-accounts add-iam-policy-binding \
  deploy-sa@my-project.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/myorg/myrepo"
```

## Compute Selection Decision Tree

```
Is it an HTTP service?
  YES -> Is it containerized?
    YES -> Do you need Kubernetes features (custom operators, service mesh)?
      YES -> GKE Autopilot
      NO  -> Cloud Run (serverless containers, scale-to-zero)
    NO -> Do you need a managed runtime?
      YES -> App Engine (standard for supported languages, flex for custom)
      NO  -> Cloud Run (containerize it, simplest path)
  NO -> Is it event-driven / short-running?
    YES -> Cloud Functions (2nd gen, powered by Cloud Run)
    NO  -> Is it a batch job?
      YES -> Batch API or Cloud Run Jobs
      NO  -> Is it a legacy VM workload?
        YES -> Compute Engine with Managed Instance Groups
        NO  -> Start with Cloud Run
```

### Cloud Run vs GKE vs Cloud Functions

| Criteria | Cloud Run | GKE Autopilot | Cloud Functions |
|----------|-----------|---------------|-----------------|
| Best for | HTTP APIs, microservices | Complex orchestration | Event handlers, webhooks |
| Scaling | 0 to 1000 instances | Pod/node autoscaling | 0 to 1000+ instances |
| Pricing | Per request + CPU/memory | Per pod resource usage | Per invocation + compute |
| Cold start | ~100ms-2s | None (always running) | ~100ms-10s |
| Max timeout | 60 min | No limit | 9 min (1st gen) / 60 min (2nd gen) |
| Networking | VPC connector, Direct VPC | Full VPC native | VPC connector |
| Complexity | Very low | High | Very low |
| GPUs | Yes | Yes | No |

### Cloud Run Production Configuration

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: api-server
  annotations:
    run.googleapis.com/ingress: internal-and-cloud-load-balancing
    run.googleapis.com/launch-stage: GA
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "100"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/startup-cpu-boost: "true"
        run.googleapis.com/vpc-access-connector: projects/my-project/locations/us-central1/connectors/my-connector
        run.googleapis.com/vpc-access-egress: private-ranges-only
    spec:
      serviceAccountName: api-server-sa@my-project.iam.gserviceaccount.com
      # ... (condensed) ...
            periodSeconds: 2
            failureThreshold: 15
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            periodSeconds: 10
```

## Database Selection

```
Relational (OLTP):
  Cloud SQL:     Standard PostgreSQL/MySQL/SQL Server. Up to 96 vCPUs, 624 GB RAM.
  AlloyDB:       PostgreSQL-compatible, 4x faster. For high-perf analytics + OLTP.
  Spanner:       Global, unlimited scale, strong consistency. For mission-critical global apps.

NoSQL:
  Firestore:     Document DB. Serverless, real-time sync. For mobile/web apps.
  Bigtable:      Wide-column. Petabyte-scale, single-digit ms latency. For time-series, IoT.

Analytics:
  BigQuery:      Serverless data warehouse. Petabyte-scale SQL analytics.

Caching:
  Memorystore:   Managed Redis or Memcached.
```

### Cloud SQL Best Practices

```
1. Use Private IP (no public IP)
2. Enable high availability (regional)
3. Configure automated backups (7+ day retention)
4. Use Cloud SQL Auth Proxy or Private Service Connect
5. Enable query insights for performance
6. Use read replicas for read-heavy workloads
7. Use Secrets Manager for credentials
8. Enable maintenance window during low-traffic hours
9. Set appropriate machine type and storage (auto-resize enabled)
```

### Spanner for Global Apps

```
Spanner offers:
  - Global strong consistency
  - 99.999% SLA (multi-region)
  - Automatic sharding
  - SQL interface with joins and indexes
  - Change streams for event-driven patterns

Use when:
  - You need global scale with strong consistency
  - Financial transactions across regions
  - Gaming leaderboards with global ranking
  - Inventory management across regions
```

## Pub/Sub

### Event-Driven Architecture

```
Publishers ──> Topic ──> Subscription ──> Subscribers

Patterns:
  Fan-out:     1 topic, many subscriptions
  Load balance: 1 subscription, many subscribers (pull)
  Push:         Pub/Sub pushes to HTTP endpoint (Cloud Run, Functions)
  Ordering:     Use ordering keys for ordered delivery within a key
```

```shell
# Create topic and subscription
gcloud pubsub topics create order-events
gcloud pubsub subscriptions create order-processor \
  --topic=order-events \
  --ack-deadline=60 \
  --message-retention-duration=7d \
  --dead-letter-topic=order-events-dlq \
  --max-delivery-attempts=5

# Push subscription to Cloud Run
gcloud pubsub subscriptions create order-notifier \
  --topic=order-events \
  --push-endpoint=[reference URL] \
  --push-auth-service-account=pubsub-invoker@my-project.iam.gserviceaccount.com
```

## Cloud CDN

```
Global HTTP(S) Load Balancer + Cloud CDN

Configuration:
  - Enable Cloud CDN on backend service
  - Cache modes: USE_ORIGIN_HEADERS, FORCE_CACHE_ALL, CACHE_ALL_STATIC
  - Signed URLs/cookies for private content
  - Custom cache keys
  - Negative caching (cache 404s to reduce origin load)
  - Cache invalidation via API

Best practices:
  - Use Cache-Control headers from origin
  - Set appropriate max-age (static assets: 1 year, API: 0)
  - Use versioned URLs for static assets (bust cache by changing URL)
  - Monitor cache hit ratios in Cloud Monitoring
```

## Cost Optimization

### Key Strategies

```
1. Committed Use Discounts (CUDs): 1-3 year commitments for 37-55% savings
2. Sustained Use Discounts: Automatic 30% discount for VMs running 100% of month
3. Preemptible/Spot VMs: 60-91% discount for fault-tolerant workloads
4. Cloud Run: Scale to zero (pay nothing when idle)
5. BigQuery: On-demand for variable, slots for predictable workloads
6. Cloud Storage: Lifecycle rules to move data to cheaper tiers
7. Right-size VMs: Use Recommender API suggestions
8. E2 machine series: Cost-optimized for general workloads
9. Autoscaling everywhere: Don't over-provision
10. Networking: Use Cloud CDN to reduce origin traffic
```

### Cost Monitoring

```shell
# Set budget alerts
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Monthly Budget" \
  --budget-amount=5000 \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.8 \
  --threshold-rule=percent=1.0

# Export billing to BigQuery for analysis
# (configure in Billing > Billing export)
# Then query:
# SELECT service.description, SUM(cost) as total
# FROM `project.billing.gcp_billing_export_v1_XXXXXX`
# WHERE invoice.month = '202401'
# GROUP BY service.description
# ORDER BY total DESC
```

## GKE Autopilot

```shell
# Create Autopilot cluster (Google manages nodes)
gcloud container clusters create-auto my-cluster \
  --region=us-central1 \
  --release-channel=regular \
  --network=shared-vpc \
  --subnetwork=gke-subnet \
  --cluster-secondary-range-name=pods \
  --services-secondary-range-name=services \
  --enable-private-nodes \
  --master-ipv4-cidr=172.16.0.0/28 \
  --workload-pool=my-project.svc.id.goog

# Autopilot benefits:
# - No node management
# - Pay per pod (not per node)
# - Built-in security hardening
# - Automatic scaling and upgrades
# - Pod-level SLA
```

## Production Checklist

```
Identity:
  [ ] Organization policies applied at org level
  [ ] No service account keys (use Workload Identity / Federation)
  [ ] IAM roles granted to groups, not individuals
  [ ] IAM Recommender reviewed and applied

Networking:
  [ ] Shared VPC configured
  [ ] Private Google Access enabled
  [ ] Private Service Connect for managed services
  [ ] VPC firewall rules follow least privilege
  [ ] Cloud NAT for private instances needing internet
  [ ] Cloud Armor WAF on external load balancers

Data:
  [ ] Encryption at rest (Google-managed or CMEK)
  [ ] Encryption in transit (TLS everywhere)
  [ ] Automated backups for all databases
  [ ] Cloud DLP for sensitive data discovery
# ... (condensed) ...

Cost:
  [ ] Billing export to BigQuery
  [ ] Budget alerts configured
  [ ] Committed Use Discounts for steady workloads
  [ ] Recommender suggestions reviewed monthly
  [ ] Labels applied for cost allocation
```

## When to Use

**Use this skill when:**
- Designing or implementing gcp architect solutions
- Reviewing or improving existing gcp architect approaches
- Making architectural or implementation decisions about gcp architect
- Learning gcp architect patterns and best practices
- Troubleshooting gcp architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Gcp Architect Analysis

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

**Input:** "Help me implement gcp architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended gcp architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When gcp architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
