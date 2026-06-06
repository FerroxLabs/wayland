---
name: azure-patterns
description: |
  Guides expert-level azure architecture patterns implementation: cloud and architecture decision frameworks, production-ready patterns, and concrete templates for azure patterns workflows.
  Use when the user asks about azure architecture patterns, azure patterns configuration, or cloud best practices for azure projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cloud architecture frameworks"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Azure Architecture Patterns

## When to Use

**Use this skill when:**
- User asks how to architect a new Azure workload and needs a pattern recommendation (Hub-Spoke networking, CQRS, Saga, Strangler Fig, etc.)
- User is evaluating architectural trade-offs on Azure -- for example, deciding between Azure Service Bus vs Event Hubs, AKS vs Container Apps vs App Service, or Cosmos DB vs Azure SQL
- User needs a production-ready template or reference architecture for a specific Azure scenario (event-driven microservices, multi-region active-active, API gateway pattern, etc.)
- User is migrating from on-premises or another cloud and needs an Azure-idiomatic architecture that maps their existing design to Azure services
- User asks about Azure reliability patterns -- Retry, Circuit Breaker, Bulkhead, Health Endpoint Monitoring -- and how to implement them with Azure-specific tooling
- User wants to understand Azure Landing Zone design, including management group hierarchy, policy assignment scopes, and connectivity subscriptions
- User is designing for a specific compliance baseline (PCI-DSS, HIPAA, FedRAMP) and needs an architecture that satisfies Azure Policy initiatives for that framework
- User asks about cost-optimization patterns on Azure (Reserved Instances vs Savings Plans, Azure Spot for batch, right-sizing via Azure Advisor, autoscale triggers)

**Do NOT use this skill when:**
- User needs Terraform, Bicep, or ARM template authoring guidance -- use the infrastructure-as-code skill in this subcategory
- User is asking about CI/CD pipeline design for Azure DevOps or GitHub Actions -- use the ci-cd-pipelines skill
- User needs Kubernetes-specific workload configuration (Deployments, Helm, Kustomize) even if running on AKS -- use the kubernetes skill
- User wants Azure Monitor or Application Insights alert configuration details -- use the observability skill
- User is asking about Azure Active Directory / Entra ID identity federation or SSO flows -- use the identity-management skill
- User has a general programming or application code question that happens to run on Azure but has no infrastructure or architecture dimension
- User needs a cost breakdown or billing analysis without an architectural decision attached -- use the cloud-cost-management skill

---

## Process

### 1. Establish Workload Context and Requirements

Before recommending any pattern, extract the full workload profile:

- **Traffic characteristics:** peak RPS, p99 latency SLO (e.g., <200ms API response), expected data volume (GB/day), read/write ratio
- **Reliability target:** SLA tier -- 99.9% (eight hours downtime/year), 99.95%, or 99.99% (52 minutes/year). Each tier requires a different Azure architecture (single-region Active-Passive vs multi-region Active-Active)
- **Operational maturity:** Does the team have experience with AKS, Dapr, or service mesh? An operationally immature team should favor PaaS over IaaS even at higher cost
- **Data residency and compliance:** Is data sovereignty required (single-region only)? Which Azure Policy initiative applies -- CIS Azure Foundations Benchmark, NIST SP 800-53, PCI DSS v4?
- **Growth trajectory:** Expected order-of-magnitude scaling over 24 months determines whether to design for vertical scaling now vs horizontal scaling from day one
- **Integration estate:** Number of external APIs, on-premises systems via ExpressRoute, or third-party SaaS -- this drives the integration topology decision

Produce a one-page workload context card before recommending any pattern.

---

### 2. Select the Foundational Topology Pattern

Apply this decision framework in order:

- **Networking topology:**
  - Single workload, no shared services -- use standalone VNet with application-tier subnets
  - Multiple workloads sharing egress, DNS, or firewall -- use **Hub-Spoke** with Azure Firewall Premium or NVA in the hub, peered spokes per workload
  - Global presence with regional traffic management -- use **Azure Virtual WAN** (Standard tier) with Virtual Hubs per region; use over Hub-Spoke when you have 5+ regions or branch connectivity via SD-WAN
  - Micro-segmentation within a spoke -- use Application Security Groups (ASGs) rather than proliferating NSG rules; tag VMs/NICs with ASG membership

- **Compute pattern selection:**
  - Stateless HTTP workloads, team prefers managed PaaS -- **Azure App Service** (Premium v3) with deployment slots for blue-green
  - Event-driven or background processing, variable load -- **Azure Container Apps** with KEDA scaling rules (HTTP scaler, Service Bus queue length scaler, or custom Prometheus metrics)
  - Complex orchestration requirements, team has Kubernetes expertise -- **AKS** with System and User node pool separation; use at least 3 nodes per pool across 3 availability zones
  - Short-lived, bursty compute (batch, ML training, media encoding) -- **Azure Batch** or Azure Container Instances (ACI) as a burst target from AKS virtual nodes

- **Data store selection (match access pattern to store):**
  - Relational, ACID, <10TB -- Azure SQL Managed Instance or Azure SQL Database (Hyperscale for >1TB)
  - Document, globally distributed, multi-master writes -- Cosmos DB with NoSQL API, Bounded Staleness or Strong consistency based on SLA; avoid Session consistency for financial data
  - Time-series, IoT telemetry -- Azure Data Explorer (ADX) with Hot Cache policy; ingest via Event Hubs
  - Analytical, large-scale -- Azure Synapse Analytics with dedicated SQL pool for structured; serverless SQL pool for ad-hoc on ADLS Gen2
  - Key-value cache -- Azure Cache for Redis (Enterprise tier for cluster mode, geo-replication, and active-active)

---

### 3. Apply the Appropriate Architectural Pattern

Match the workload type to a named pattern:

#### Event-Driven / Async Patterns
- **Competing Consumers:** Multiple workers reading from a single Azure Service Bus queue. Set `MaxDeliveryCount` to 5 and configure a Dead Letter Queue (DLQ). Use message sessions when ordering matters within a group.
- **Event Sourcing + CQRS:** Write side publishes domain events to Event Hubs (partition key = aggregate ID for ordering). Read side is a separate Azure Function (event processor) that materializes projections into Cosmos DB. Use Event Hubs Capture to ADLS Gen2 as the durable event store.
- **Choreography Saga:** Each microservice publishes a domain event on success or a compensating event on failure to Service Bus Topics with subscriptions per service. Prefer over Orchestration Saga when <5 participants to avoid a central orchestrator bottleneck.
- **Orchestration Saga:** Use Azure Durable Functions with the `orchestrator` pattern for complex transactions across >5 services. State is durable in Azure Storage. Handle compensation with explicit rollback activities.

#### Resilience Patterns
- **Retry with Exponential Backoff:** Azure SDKs implement this natively. For custom HTTP clients, use Polly with `WaitAndRetryAsync`, max 3 retries, base delay 200ms, jitter via `DecorrelatedJitterBackoffV2`. Never retry on HTTP 400, 401, 403, 404 -- only on 429, 500, 502, 503, 504.
- **Circuit Breaker:** Polly `CircuitBreakerAsync` -- open after 5 consecutive failures, half-open after 30 seconds. Pair with Azure API Management (APIM) circuit breaker policy for gateway-level protection. Log circuit state transitions to Application Insights.
- **Bulkhead:** Separate thread pools or connection pools per downstream dependency. In AKS, implement as separate Deployments with distinct resource limits. Use `ResourceQuota` per namespace to prevent noisy-neighbor consumption.
- **Health Endpoint Monitoring:** Every service exposes `/health/live` (liveness) and `/health/ready` (readiness). Azure Container Apps and AKS both configure these as probe targets. Back-end dependency checks (DB ping, cache ping, Service Bus connectivity) belong only in the readiness probe -- never in liveness.

#### Scaling Patterns
- **Horizontal Pod Autoscaler + KEDA:** For AKS, combine HPA (CPU/memory) with KEDA ScaledObjects (queue depth, event rate). KEDA `TriggerAuthentication` should reference Azure Workload Identity -- not connection strings.
- **Throttling + Rate Limiting:** Implement at APIM layer using `rate-limit-by-key` policy (e.g., 100 calls/minute per subscription key). Use Azure Front Door WAF rules for DDoS rate limiting upstream of APIM.
- **Queue-Based Load Leveling:** Decouple HTTP ingress from processing via Service Bus queues. Size the queue to absorb at least 10 minutes of peak traffic (calculate: peak_RPS × 600 = minimum message capacity buffer).

#### Integration Patterns
- **Gateway Aggregation:** APIM as the single entry point -- aggregate multiple downstream microservice calls into a single API response using APIM's `send-request` policy and parallel fanout. Reduces client round trips from N to 1.
- **Strangler Fig:** Route traffic via Azure Front Door or APIM using URL-based routing rules. Legacy system handles `/api/v1/*`, new system handles `/api/v2/*`. Gradually migrate paths. Use APIM transformation policies to normalize response schemas during transition.
- **Anti-Corruption Layer:** When integrating legacy on-premises systems, deploy an Azure Integration Services layer (Logic Apps Standard + APIM) that translates between legacy data contracts and modern schemas. Never let legacy schema leak into the new domain model.

---

### 4. Design the Security Architecture

Every Azure pattern must include a security architecture -- never defer it:

- **Identity and Access:**
  - All service-to-service calls use **Managed Identity** -- never client secrets or connection strings in code. Assign roles using Azure RBAC at the narrowest scope (resource level, not subscription level).
  - Use **Azure Workload Identity** for AKS pods -- federated identity credential binds a Kubernetes ServiceAccount to an Azure Managed Identity via OIDC.
  - Key Vault references in App Service / Container Apps configuration ensure secrets are fetched at runtime, not baked into container images or environment files.

- **Network Security:**
  - All Azure PaaS services use **Private Endpoints** -- disable public network access after private endpoint creation. This applies to Azure SQL, Storage, Key Vault, Service Bus, Event Hubs, Container Registry, and Cosmos DB.
  - NSG rules: deny all inbound from Internet by default. Allow inbound only from Azure Load Balancer service tag and specific VNet address ranges. Log NSG flow logs to Storage Account (retention minimum 90 days) and analyze with Traffic Analytics.
  - Azure Firewall Premium for TLS inspection of East-West and North-South traffic in Hub-Spoke topology. Use IDPS signature rules in Alert-and-Deny mode for known threat categories.

- **Data Protection:**
  - Azure SQL and Storage use platform-managed encryption at rest by default -- upgrade to Customer-Managed Keys (CMK) via Key Vault for regulated workloads.
  - Enable Transparent Data Encryption (TDE) with CMK for Cosmos DB in regulated environments.
  - All data in transit uses TLS 1.2 minimum; enforce via APIM policy `<set-header name="Strict-Transport-Security">` and App Service TLS minimum version setting.

- **Governance:**
  - Apply Azure Policy `Deny` effect for non-compliant resource configurations (e.g., deny Storage Accounts with public blob access, deny resources without tags).
  - Use **Defender for Cloud** with Enhanced Security Features for CSPM scoring. Target Secure Score >80 before production cutover.

---

### 5. Design for Observability

Observability must be architected -- not added retroactively:

- **Azure Monitor Workspace + Log Analytics:** Single workspace per environment (dev/staging/prod separate workspaces). Route all diagnostic logs, activity logs, and custom logs here. Retention: 30 days hot, archive to Storage Account for 365 days (cost-optimized).
- **Application Insights:** One Application Insights resource per application (not shared across applications -- correlation breaks). Configure sampling: adaptive sampling with a minimum of 20% for production to control cost. Use `TelemetryInitializer` to enrich telemetry with environment, version, and region tags.
- **Distributed Tracing:** Every service propagates `traceparent` / `tracestate` W3C headers. APIM passes correlation headers via `set-header`. Trace visualization in Application Insights end-to-end transaction search.
- **Azure Monitor Alerts:** Use metric alerts for fast signals (CPU >85% for 5 minutes, HTTP 5xx rate >1% over 5 minutes). Use log alerts for business signals (failed payment events >10 in 15 minutes). Route to Action Groups: email + Teams webhook for Severity 2-3, PagerDuty integration for Severity 0-1.
- **Dashboards:** Azure Workbook templates for SLO reporting (availability %, p95 latency). Pin to shared Dashboard for NOC visibility.

---

### 6. Define the Deployment Architecture

- **Environment strategy:** Minimum three environments -- Development (shared, cost-optimized), Staging (production-parity scale), Production. Use Azure Resource Tags (`environment`, `workload`, `cost-center`, `owner`) on all resources.
- **Deployment patterns:**
  - **Blue-Green:** Two identical App Service slots (staging/production). Traffic swap is instant with slot swap. Warm-up rules in `applicationInitialization` prevent cold starts during swap.
  - **Canary (Ring Deployment):** Azure Front Door origin groups with weighted routing -- send 5% to canary origin, 95% to stable. Monitor error rates and latency differentials in Application Insights before expanding.
  - **Feature Flags:** Azure App Configuration with feature flag support. Services poll App Configuration (push via Event Grid for near-real-time propagation). Decouple deployment from release.
- **Infrastructure as Code:** All resources defined in Bicep (preferred for Azure-native) or Terraform. Use Azure Verified Modules (AVM) from the official Microsoft registry as baseline -- do not author networking, AKS, or APIM modules from scratch.

---

### 7. Validate the Architecture

Before finalizing, apply these validation passes:

- **Azure Architecture Framework review:** Run the Well-Architected Framework (WAF) assessment against the five pillars -- Reliability, Security, Cost Optimization, Operational Excellence, Performance Efficiency. Target no Critical findings before production.
- **Failure Mode analysis:** For each Azure service in the design, define: What happens if this service is unavailable? What is the blast radius? Does the design degrade gracefully or fail completely?
- **Cost estimation:** Use the Azure Pricing Calculator to estimate monthly cost at 50%, 100%, and 200% of expected load. Identify the top three cost drivers. Evaluate Reserved Instances for any compute or Cosmos DB RU provisioning with steady-state utilization >40%.
- **Architecture Decision Records (ADRs):** Document every non-obvious choice. Format: Context → Decision → Consequences. Store in the repository under `/docs/adr/`.

---

### 8. Produce Deliverables

Emit the following concrete artifacts:

- Workload context card (requirements summary)
- Architecture diagram description (component list, data flows, network topology)
- Service selection decision matrix
- Pattern recommendation with rationale
- Security architecture checklist
- Production configuration templates
- Observability setup checklist
- Cost estimate range
- ADR for primary architectural decisions

---

## Output Format

### Workload Context Card

```
Workload Name:        [name]
SLA Target:           [99.9% / 99.95% / 99.99%]
Peak Load:            [RPS] at [time window], p99 target [ms]
Data Volume:          [GB/day ingest], [TB total stored]
Read/Write Ratio:     [read%] / [write%]
Compliance Baseline:  [None / CIS Benchmark / PCI DSS v4 / HIPAA / FedRAMP]
Team Maturity:        [PaaS-oriented / IaaS-capable / Kubernetes-proficient]
Multi-Region:         [Yes -- Active/Active | Yes -- Active/Passive | No]
Key Integrations:     [list of external systems]
```

### Service Selection Decision Matrix

| Dimension | Option 1 | Option 2 | Option 3 | Recommendation | Rationale |
|-----------|----------|----------|----------|----------------|-----------|
| Compute | App Service P3v3 | Container Apps | AKS Standard D4s_v5 | [choice] | [reason] |
| Messaging | Service Bus Standard | Service Bus Premium | Event Hubs Standard | [choice] | [reason] |
| Primary DB | Azure SQL General Purpose | Azure SQL Hyperscale | Cosmos DB NoSQL | [choice] | [reason] |
| Cache | Redis Basic C1 | Redis Standard C2 | Redis Enterprise E10 | [choice] | [reason] |
| API Gateway | APIM Consumption | APIM Standard v2 | APIM Premium | [choice] | [reason] |

### Pattern Recommendation Card

```
Primary Pattern:        [Pattern Name]
Supporting Patterns:    [list]
Rationale:              [2-3 sentences linking pattern choice to workload requirements]
Key Risks:              [top 2 risks of this pattern for this workload]
Alternatives Rejected:  [pattern] -- rejected because [reason]
```

### Security Architecture Checklist

```
[ ] All PaaS services have Private Endpoints configured
[ ] Public network access disabled on: [list services]
[ ] Managed Identity assigned to all compute resources
[ ] Key Vault references used for all secrets (no plaintext env vars)
[ ] Azure RBAC assignments scoped to resource level (not subscription)
[ ] NSG flow logs enabled, retention 90 days minimum
[ ] Azure Firewall / NVA deployed in Hub (if Hub-Spoke topology)
[ ] Defender for Cloud Enhanced Security Features enabled
[ ] Azure Policy assignments: [list applicable initiatives]
[ ] TLS 1.2 minimum enforced at gateway and service level
[ ] Customer-Managed Keys configured for: [list if regulated]
[ ] Workload Identity configured for AKS (if applicable)
```

### Production Configuration Template -- Container Apps (Example)

```bicep
// container-app.bicep
// Production-ready Azure Container Apps deployment
// Assumptions: Private VNet integration, KEDA scaling, Managed Identity

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${workloadName}-${environment}'
  location: location
  tags: {
    environment: environment
    workload: workloadName
    costCenter: costCenter
    owner: ownerAlias
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      ingress: {
        external: false          // Internal only -- exposed via APIM, not directly
        targetPort: 8080
        transport: 'http2'
        traffic: [
          { weight: 100, latestRevision: true }
        ]
      }
      secrets: [
        // Secrets referenced from Key Vault -- never inline values
        { name: 'db-connection', keyVaultUrl: dbConnectionSecretUri, identity: managedIdentityId }
      ]
      activeRevisionsMode: 'Single'  // Use 'Multiple' for canary deployments
    }
    template: {
      containers: [
        {
          name: workloadName
          image: '${containerRegistryLoginServer}/${imageName}:${imageTag}'
          resources: {
            cpu: '0.5'    // Start conservative; tune from Metrics after load test
            memory: '1Gi'
          }
          env: [
            { name: 'ASPNETCORE_ENVIRONMENT', value: environment }
            { name: 'ApplicationInsights__ConnectionString', secretRef: 'ai-connection' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: { path: '/health/live', port: 8080 }
              initialDelaySeconds: 10
              periodSeconds: 30
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: { path: '/health/ready', port: 8080 }
              initialDelaySeconds: 5
              periodSeconds: 10
              failureThreshold: 3
              // Readiness probe checks DB + cache connectivity
            }
          ]
        }
      ]
      scale: {
        minReplicas: 2        // Never 0 for production -- cold start penalty
        maxReplicas: 20
        rules: [
          {
            name: 'servicebus-queue-scaler'
            custom: {
              type: 'azure-servicebus'
              metadata: {
                queueName: inputQueueName
                messageCount: '50'  // Scale up when queue depth > 50 messages per replica
                namespace: serviceBusNamespace
              }
              auth: [{ secretRef: 'servicebus-connection', triggerParameter: 'connection' }]
            }
          }
        ]
      }
    }
  }
}
```

### Observability Setup Checklist

```
[ ] Log Analytics Workspace created (per-environment, not shared)
[ ] Application Insights resource created (per-application)
[ ] Diagnostic settings configured for: Azure SQL, Service Bus, Key Vault, APIM, Container Apps
[ ] Adaptive sampling configured (minimum 20% in production)
[ ] W3C distributed trace headers propagated through APIM
[ ] Azure Monitor Metric Alerts: CPU >85% (5 min), HTTP 5xx >1% (5 min), Queue Depth >1000 (10 min)
[ ] Azure Monitor Log Alert: Business-critical event failure threshold
[ ] Action Group: Severity 0-1 -> PagerDuty; Severity 2-3 -> Teams + email
[ ] Azure Workbook: SLO dashboard (availability %, p95 latency, error rate)
[ ] Resource Health Alerts configured for all critical Azure services
```

### Cost Estimate Range

| Load Level | Estimated Monthly Cost | Top Cost Driver | Optimization Lever |
|------------|------------------------|-----------------|-------------------|
| 50% expected | $[low] | [service] | [action] |
| 100% expected | $[mid] | [service] | [action] |
| 200% expected | $[high] | [service] | [action] |

---

## Rules

1. **Never recommend App Service Consumption plan for production APIs** -- the cold start latency (2-10 seconds for .NET, 5-15 seconds for Java) violates most SLOs. Use Premium v3 (always warm) or Container Apps with `minReplicas: 2`.

2. **Never use Cosmos DB Session consistency for financial transaction data** -- Session consistency guarantees reads see your own writes but not other clients' writes. Financial aggregates (account balances, inventory) require Bounded Staleness or Strong consistency, accepting higher RU cost.

3. **Never share a Log Analytics Workspace across production and non-production environments** -- cross-environment data in a single workspace creates compliance risks (prod data accessible to dev engineers), noisy alert conditions, and makes cost attribution impossible.

4. **Always use Private Endpoints for PaaS services in production** -- public endpoints expose services to Internet-based enumeration and attack surface. The operational overhead of Private DNS Zones is fixed; the security risk of public endpoints compounds over time. There are no production scenarios that justify public endpoint access for Azure SQL, Key Vault, Storage, or Service Bus.

5. **Never put Azure Service Bus connection strings in application configuration files or environment variables** -- use Managed Identity with `Azure.Service Bus.ServiceBusClient(namespaceUri, new DefaultAzureCredential())`. Connection strings rotate, get leaked in logs, and violate zero-trust principles.

6. **Always separate AKS System node pools from User node pools** -- system pool runs `kube-system` components (CoreDNS, tunnelfront, metrics-server). If an application workload starves system components of resources, the entire cluster becomes unstable. Use `taints: [CriticalAddonsOnly=true:NoSchedule]` on system pools.

7. **Never design an Active-Active multi-region architecture without a conflict resolution strategy for Cosmos DB** -- multi-master writes across regions require explicit last-writer-wins or custom conflict resolution policies. An architecture diagram showing two regions writing to Cosmos DB without a conflict policy defined is incomplete and will produce data corruption in production.

8. **Always cost-model Cosmos DB provisioned RU/s against actual access patterns before committing** -- at 100 RU/s per container minimum and $0.008/hour per 100 RU/s, a naively partitioned model with 50 containers costs $2,880/month before data storage. Autoscale (1/10 ratio max-to-min) reduces waste but does not eliminate poor partition key choices that cause hot partitions.

9. **Never use Azure Front Door Standard when the workload requires WAF custom rules or Bot Protection** -- Standard tier includes only managed WAF rule sets. Custom rules (IP allowlisting, geo-blocking, rate limiting by header) and Bot Manager require Front Door Premium. Discovering this post-deployment requires a tier migration that has a multi-hour propagation window.

10. **Always set resource locks (`ReadOnly` or `Delete`) on production hub networking resources** -- Azure Firewall, VPN Gateway, and ExpressRoute Circuit deletions are instantaneous and can take hours to restore. A `CanNotDelete` lock on the hub VNet resource group prevents accidental deletion by engineers with Owner role. This is a last-resort control that does not replace RBAC hygiene.

---

## Edge Cases

### Multi-Region Active-Active with Stateful Workloads

Active-Active requires more than deploying the same resources in two regions. Address:
- **Data synchronization latency:** Cosmos DB multi-master sync is asynchronous (~10-100ms cross-region). Any read-after-write pattern that crosses regions will observe stale data under Eventual consistency. Identify all such patterns and either accept eventual consistency explicitly or use Strong/Bounded Staleness (which routes all writes through a single master region, negating the write-locality benefit of Active-Active).
- **Traffic routing:** Azure Front Door with `LatencyBasedRouting` sends users to the nearest healthy origin. Health probes must check application-level health (including DB connectivity), not just TCP port availability. A region with a healthy TCP port but a broken database connection will continue receiving traffic and generating errors.
- **Session affinity conflicts:** Active-Active plus session affinity (cookie-based in Front Door) negates geographic load distribution. Eliminate server-side session state -- use distributed cache (Redis Enterprise with geo-replication) or JWT-based stateless auth.

### Legacy On-Premises Integration via ExpressRoute

Integrating a new Azure workload with on-premises systems via ExpressRoute introduces routing complexity:
- **Address space conflicts:** On-premises RFC 1918 ranges often overlap with default Azure VNet ranges (10.0.0.0/8). Use non-overlapping address planning from day one -- allocating 172.16.0.0/12 to Azure and 10.0.0.0/8 to on-premises avoids BGP route conflicts.
- **DNS resolution:** On-premises resolvers cannot resolve Azure Private DNS zones by default. Deploy Azure DNS Private Resolver with inbound endpoints in the hub VNet. Configure on-premises conditional forwarders to forward `privatelink.blob.core.windows.net` and similar zones to the resolver inbound IP.
- **Bandwidth throttling:** ExpressRoute circuits are provisioned at fixed bandwidth (50Mbps to 100Gbps). Large data migrations or bulk transfers to Azure Storage can saturate the circuit and impact real-time workloads sharing the same circuit. Use ExpressRoute with two circuits in active-passive (FastPath) for production, or use Azure Data Box for initial bulk data transfer.

### APIM at Scale (>1000 RPS Sustained)

API Management throughput varies dramatically by tier:
- **Consumption tier:** Scales automatically but has a 20,000 calls/minute hard limit per subscription and adds ~50-100ms latency due to cold start. Never use for predictable production load.
- **Standard v2 tier:** Fixed 4 units, approximately 800-1600 RPS depending on policy complexity. Under heavy policy execution (JWT validation, `send-request` fanout, transformation), throughput drops significantly. Load test with representative policy chains before go-live.
- **Premium tier with multiple scale units:** Each unit adds approximately 500 RPS of baseline capacity. Deploy across two availability zones (requires Premium tier) for 99.95% SLA. Cache responses via APIM built-in cache or external Redis for read-heavy endpoints to reduce backend load and increase effective throughput.
- **Policy complexity impact:** A chain of JWT validation + IP filtering + rate limiting + backend routing adds 5-15ms per request. With `send-request` backend fanout, total APIM-added latency can reach 50-200ms. Profile with Azure Monitor APIM metrics (`Backend Duration`, `Gateway Duration`) to identify policy bottlenecks.

### Azure Kubernetes Service Cluster Upgrade Pressure

AKS Kubernetes version support windows are shorter than teams expect:
- Each Kubernetes minor version is supported for approximately 12 months after GA on AKS. After that, the node pool cannot be patched and the cluster becomes non-compliant for CIS Benchmark controls.
- **Node image auto-upgrade:** Enable `nodeOSUpgradeChannel: NodeImage` for automated OS patching without Kubernetes version upgrade. This applies OS-level CVE patches weekly without disrupting workloads.
- **Cluster auto-upgrade:** Set `upgradeChannel: patch` (not `stable` or `rapid`) for production -- patch channel upgrades only within the current minor version (e.g., 1.28.x -> 1.28.y), minimizing breaking change risk.
- **Pod Disruption Budgets are mandatory for upgrade safety:** Without PDBs, an AKS node drain during upgrade can evict all replicas of a Deployment simultaneously. Require `maxUnavailable: 1` PDB for every Deployment with `replicas >= 2` before allowing cluster upgrades.
- Plan a minor version upgrade (e.g., 1.28 -> 1.29) once per year minimum. Budget 4-8 hours of engineer time per cluster for validation and rollback readiness.

### Cosmos DB Partition Key Design Failure

Poor partition key selection is the most common Cosmos DB production failure mode:
- **Hot partition symptom:** 429 (Too Many Requests) errors concentrated on a subset of logical partitions. Azure Monitor Cosmos DB metric `NormalizedRUConsumption` shows spikes on specific partitions while others are idle.
- **Diagnosis:** Use Cosmos DB Data Explorer's "Partition Key Statistics" to identify partition size distribution. Any single logical partition approaching 20GB indicates a hot partition key.
- **Common bad keys:** `status` (only 3-5 distinct values), `date` (all today's writes go to one partition), `tenantId` (if one tenant dominates traffic), `type` (enum with few values).
- **Good key patterns:** `userId` (high cardinality, even distribution), `deviceId` + synthetic suffix for IoT (append random 2-digit suffix for very high-volume devices), hierarchical composite key (`{tenantId}_{entityId}`) for multi-tenant scenarios.
- **Remediation:** Partition key is immutable after container creation. Remediation requires creating a new container with the correct key and migrating data using Azure Data Factory or the Cosmos DB bulk executor library. Plan for this -- it requires a maintenance window or dual-write migration period.

### Regulated Workloads (PCI DSS v4 / HIPAA)

Regulated workloads on Azure require architectural constraints beyond standard best practices:
- **PCI DSS v4 Requirement 1 (Network Security):** Cardholder data environment (CDE) must be in a dedicated subscription with a dedicated VNet. No peering between CDE VNet and non-CDE VNets is allowed without firewall inspection of all traffic. Use Azure Firewall Premium with TLS inspection as the peering gateway.
- **PCI DSS v4 Requirement 10 (Audit Logging):** All administrative actions, authentication events, and data access must be logged with tamper-evident storage. Route Azure Activity Logs, Azure AD Sign-in Logs, and resource diagnostic logs to an immutable Storage Account (WORM -- Write Once Read Many, with a legal hold or time-based retention lock). Log retention: minimum 12 months, 3 months immediately available.
- **HIPAA Technical Safeguards:** Azure SQL with Always Encrypted for PHI columns (client-side encryption -- Azure cannot decrypt data at rest). Cosmos DB with CMK. All data movement through Azure Data Factory must use managed VNet integration runtime (no public IP).
- **Azure Policy Initiative assignment:** Assign the built-in `HIPAA HITRUST 9.2` or `PCI DSS v4` initiative at the subscription scope. Run a compliance scan before first workload deployment. Remediate all `Deny` effect policy violations before go-live. `Audit` effect violations must be tracked in a risk register with remediation plans.

---

## Example

**Input:** "We're building a multi-tenant SaaS order management system for 200 enterprise customers. Peak load is around 500 orders/minute during business hours, dropping to near zero overnight. Orders involve inventory reservation, payment processing (Stripe), and email notifications. We need 99.9% uptime and data must stay in the EU. The team of 8 is comfortable with containers but has limited Kubernetes experience. We're on a startup budget, so cost efficiency matters."

---

**Output:**

### Workload Context Card

```
Workload Name:        SaaS Order Management Platform
SLA Target:           99.9% (8.7 hours downtime/year)
Peak Load:            500 orders/minute (~8.3 RPS), business hours EU timezone
                      Order processing latency target: <3 seconds end-to-end (async acceptable)
Data Volume:          ~50 orders/minute average, ~72,000 orders/day, ~2-3 GB/day
Read/Write Ratio:     60% read (order status, history) / 40% write (order create, update)
Compliance Baseline:  No regulated data (Stripe handles PCI scope); standard GDPR data residency
Team Maturity:        Container-proficient, Kubernetes-limited -- favor PaaS/managed services
Multi-Region:         No -- single EU region (West Europe / Amsterdam); data residency constraint
Key Integrations:     Stripe Payments API (outbound), email via SendGrid (outbound),
                      Customer ERP systems (inbound webhooks)
Budget Constraint:    Startup -- optimize for cost; accept operational trade-offs
```

---

### Service Selection Decision Matrix

| Dimension | Option 1 | Option 2 | Option 3 | Recommendation | Rationale |
|-----------|----------|----------|----------|----------------|-----------|
| Compute | App Service P2v3 | Azure Container Apps | AKS Standard | **Container Apps** | Team knows containers; AKS operational overhead unjustified at this scale; App Service lacks KEDA scaling |
| Order Queue | Service Bus Standard | Service Bus Premium | Event Hubs | **Service Bus Standard** | Standard tier supports queues + topics with DLQ; sessions for per-customer ordering; Premium unnecessary at 500 orders/min |
| Primary DB | Cosmos DB NoSQL | Azure SQL General Purpose | Azure SQL Hyperscale | **Azure SQL General Purpose (GP_Gen5_4)** | Multi-tenant relational schema with FK constraints; order domain is highly relational; Cosmos DB adds complexity without benefit at this scale |
| Cache | Redis Basic C1 | Redis Standard C2 | No cache | **Redis Standard C2** | Inventory reservation hot path needs sub-ms reads; Standard C2 gives 6GB memory + replication; Basic has no SLA |
| API Gateway | APIM Consumption | APIM Standard v2 | None / App Gateway | **APIM Standard v2** | Per-tenant rate limiting, subscription keys, JWT validation; Consumption too low for sustained load; Standard v2 fits budget |
| Blob Storage | LRS Standard | ZRS Standard | GRS Standard | **ZRS Standard** | EU-resident requirement, no cross-region replication needed; ZRS protects against zone failure; GRS would replicate outside EU |

---

### Pattern Recommendation Card

```
Primary Pattern:        Choreography Saga (Order Processing)
Supporting Patterns:    - Competing Consumers (order queue workers)
                        - Queue-Based Load Leveling (HTTP -> Service Bus -> processors)
                        - Gateway Aggregation (APIM front-door)
                        - Strangler Fig (ERP integration anti-corruption layer)
                        - Retry with Exponential Backoff (all external API calls)
                        - Circuit Breaker (Stripe payment API calls)

Rationale:              Order processing involves three distinct steps (inventory reservation,
                        payment, notification) with independent failure modes. Choreography Saga
                        via Service Bus topics allows each step to fail and compensate independently
                        without a central orchestrator becoming a bottleneck. Queue-Based Load
                        Leveling absorbs the 500 orders/minute peak without over-provisioning
                        compute; Container Apps scales workers from minReplicas 2 to maxReplicas 20
                        based on Service Bus queue depth. Overnight scale-to-2-replicas reduces
                        cost during the 16-hour low-traffic window.

Key Risks:              1. Saga compensation complexity -- a failed payment after successful
                           inventory reservation requires an explicit inventory release event.
                           This compensating transaction must be idempotent and tested explicitly.
                        2. Tenant data isolation in a shared Azure SQL database requires
                           Row-Level Security (RLS) policies on all tables. A missing RLS
                           predicate causes cross-tenant data leakage -- the highest severity
                           risk for a multi-tenant SaaS.

Alternatives Rejected:  - AKS: operational maturity mismatch; adds $800-1200/month for cluster
                           management overhead (system node pool, ingress controller, cert-manager)
                        - Cosmos DB: relational order schema with FK constraints and JOIN-heavy
                           reporting queries maps poorly to document model; would require
                           denormalization that increases write complexity
                        - Durable Functions Orchestration Saga: viable but Durable Functions
                           storage overhead ($0.30/million executions + Storage) and cold start
                           behavior are less predictable than Container Apps at this scale
```

---

### Architecture Data Flow

The order processing flow works as follows:

1. Customer submits `POST /api/orders` to APIM endpoint. APIM validates JWT (Azure AD B2C tenant token), applies per-tenant rate limiting (100 orders/minute per tenant subscription key), and routes to the Order API Container App.

2. Order API validates the request, writes an `orders` record with `status = PENDING` to Azure SQL (West Europe, ZRS), and publishes an `order.created` event to Service Bus Topic `orders` with the `tenantId` as the session ID.

3. **Inventory Service** (Container App, KEDA-scaled on `order.created` subscription queue depth) receives the event, checks and reserves inventory in Azure SQL. On success, publishes `inventory.reserved`. On failure (out of stock), publishes `order.cancelled` to trigger compensation.

4. **Payment Service** (Container App) receives `inventory.reserved`, calls Stripe API with retry (Polly, max 3 retries, 200ms base, jitter) and circuit breaker (open after 5 consecutive Stripe failures, half-open after 30 seconds). On success publishes `payment.captured`. On failure publishes `payment.failed` -- which triggers the Inventory Service to consume from the `order.compensate` topic and release the reservation.

5. **Notification Service** (Container App, minReplicas 1 overnight) receives `payment.captured`, calls SendGrid API, marks order `status = CONFIRMED` in Azure SQL.

6. Customer polls `GET /api/orders/{id}` via APIM. Order API reads from Azure Cache for Redis (order status cached for 30 seconds, invalidated on status change) to avoid repeated Azure SQL reads for status polling.

---

### Security Architecture Checklist

```
[x] Azure SQL: Private Endpoint in order-data subnet; public access DISABLED
[x] Redis Cache: Private Endpoint in cache subnet; public access DISABLED
[x] Service Bus Premium namespace: Private Endpoint (note: Standard tier does NOT support
    Private Endpoints -- upgrade to Premium if Private Endpoint is required; at startup
    budget, Standard with IP firewall rules restricting to Container Apps outbound IPs
    is an acceptable interim control)
[x] Key Vault: Private Endpoint; Container Apps reference secrets via Key Vault reference
    (not env vars)
[x] Container Apps: User-Assigned Managed Identity for Azure SQL access (Azure AD auth,
    not SQL auth), Redis access, Service Bus send/receive, Key Vault get
[x] APIM: Virtual Network Integration (External mode) -- APIM in dedicated subnet,
    NSG restricts inbound to port 443 from Internet + AzureLoadBalancer service tag
[x] Azure SQL: Azure AD-only authentication; SQL authentication DISABLED
[x] Row-Level Security on all Azure SQL tables with tenant_id predicate --
    enforced via security policy, not application-layer filtering alone
[x] NSG Flow Logs: enabled on all subnets, 90-day retention
[x] Defender for Cloud: Enhanced Security for Azure SQL, Key Vault, Container Apps
[x] Azure Policy: deny Storage public blob access, deny resources without required tags,
    require TLS 1.2 on App Service / APIM
[ ] CMK: not required (no regulated data); revisit if HIPAA or PCI scope changes
[ ] Azure Firewall: deferred (single workload; use NSGs as primary control at startup
    budget; add Firewall when second workload shares hub)
```

---

### Cost Estimate (West Europe, USD/month approximate)

| Component | SKU | 50% Load | 100% Load | 200% Load |
|-----------|-----|----------|-----------|-----------|
| Container Apps | Consumption-based (2-20 replicas) | $90 | $160 | $290 |
| Azure SQL | GP_Gen5_4, 100GB | $370 | $370 | $520 (scale to GP_Gen5_8) |
| Redis Cache | Standard C2 | $95 | $95 | $95 |
| Service Bus | Standard tier | $10 | $18 | $35 |
| APIM | Standard v2 | $145 | $145 | $290 (add units) |
| Key Vault | Standard (operations) | $5 | $8 | $15 |
| Storage (ZRS) | 100GB blobs + queues | $5 | $8 | $12 |
| Log Analytics | ~10GB/day ingestion | $45 | $70 | $130 |
| Application Insights | Adaptive sampling 20% | $15 | $25 | $45 |
| **Total** | | **~$780** | **~$899** | **~$1,432** |

Top cost driver at all load levels: Azure SQL General Purpose. Optimization lever: evaluate Azure SQL Serverless (GP_S_Gen5_4) for steady-state workload -- Serverless auto-pauses after 1 hour idle (saving compute cost overnight) with autopause-resume latency of ~30 seconds, acceptable given async order processing architecture.

Reserved Instance opportunity at 100% load: Azure SQL 1-year Reserved Capacity reduces database cost by ~33% ($370 -> $248). Break-even in 7 months. Commit after 60 days of production data confirming utilization pattern.

---

### Primary ADR: Azure SQL over Cosmos DB for Order Data

```
ADR-001: Relational Database (Azure SQL) for Order Domain
Date: [today]
Status: Accepted

Context:
The order management domain has highly relational data (Orders -> OrderLines ->
Products -> Tenants -> Inventory). Reporting requirements include cross-tenant
aggregation for the SaaS operator and per-tenant order history with complex filtering.
The team has strong SQL expertise and limited NoSQL experience.

Decision:
Use Azure SQL Database (General Purpose, GP_Gen5_4) with Azure AD authentication,
Row-Level Security for tenant isolation, and Private Endpoint for network security.

Consequences:
Positive: ACID transactions across order, inventory, and payment state. Complex
reporting queries via standard SQL. RLS enforces tenant isolation at database layer
(defense in depth against application bugs). Team can be productive immediately.

Negative: Vertical scaling limit (96 vCores max for single Azure SQL DB; use Elastic
Pool or sharding if tenant count exceeds 500 with high per-tenant write volume).
Cannot easily support global distribution if EU data residency constraint is relaxed
in future (Cosmos DB global distribution is superior for that scenario).

Revisit trigger: If write throughput exceeds 5,000 writes/second sustained or if
geographic expansion beyond EU requires multi-master writes -- at that point, evaluate
Cosmos DB with per-tenant containers and a partition key of tenantId_orderId.
```
