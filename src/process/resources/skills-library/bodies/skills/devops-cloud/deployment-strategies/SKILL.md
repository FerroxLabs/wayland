---
name: deployment-strategies
description: |
  Guides expert-level deployment strategies implementation: ci-cd and best-practices decision frameworks, production-ready patterns, and concrete templates for deployment strategies workflows.
  Use when the user asks about deployment strategies, deployment strategies configuration, or ci-cd best practices for deployment projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ci-cd devops best-practices"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Deployment Strategies

## When to Use

**Use this skill when:**
- User asks which deployment strategy (blue/green, canary, rolling, recreate, A/B, shadow) fits their application and infrastructure
- User needs to implement or improve a zero-downtime deployment pipeline for a production service
- User wants to reduce deployment risk for a high-traffic or business-critical application
- User is debugging a failed deployment and needs to understand rollback procedures and blast radius containment
- User is designing a CI/CD pipeline and needs to choose a deployment pattern that matches their SLO (e.g., <0.1% error rate, <200ms p99 latency)
- User wants to implement progressive delivery -- feature flags, canary releases, or traffic splitting with automated promotion criteria
- User needs to understand the infrastructure prerequisites for a specific strategy (e.g., load balancer requirements for blue/green, service mesh for canary)
- User is migrating from a legacy deploy-and-pray approach to a modern, observable deployment workflow

**Do NOT use this skill when:**
- User needs infrastructure-as-code authoring (Terraform, Pulumi) -- use the infrastructure-as-code skill
- User needs container orchestration configuration (Kubernetes manifests, Helm charts) beyond what is required to implement a deployment strategy -- use the kubernetes-configuration skill
- User is asking about CI pipeline construction (build steps, test stages, artifact management) without a deployment context -- use the ci-pipeline-design skill
- User needs secrets management or vault configuration as a standalone topic -- use the secrets-management skill
- User is asking about database migration strategies as a standalone concern -- use the database-migration skill
- User needs general monitoring or observability setup -- use the observability-stack skill
- User is asking about incident response after a deployment is already failing in production -- use the incident-response skill

---

## Process

### 1. Characterize the Application and Traffic Profile

Before recommending any strategy, gather these concrete facts:

- **Traffic volume:** Requests per second (RPS) at peak. A service handling 50 RPS tolerates more disruption than one at 50,000 RPS. Strategies that require traffic draining (blue/green) need 30--120 seconds of overlap capacity.
- **Deployment frequency:** Teams deploying once a week can tolerate heavier-weight strategies (blue/green with full environment provisioning). Teams deploying 20+ times per day need lightweight, automated strategies (rolling or canary with automated promotion).
- **Session stickiness requirements:** Stateful applications (WebSocket connections, server-side sessions) cannot survive mid-session instance replacement. Identify whether sessions can be externalized (Redis session store, JWT tokens) before choosing a strategy.
- **Database migration coupling:** Does this deploy include schema changes? If yes, the deployment strategy must be backward-compatible migration aware. Blue/green cannot be used naively with breaking schema changes -- the old environment will fail if it shares a database with the new schema.
- **SLO targets:** Note the specific error budget. If SLO is 99.9% availability (8.7 hours downtime/year), even a 2-minute outage consumes 1.4% of the annual budget. This often rules out the Recreate strategy for production.
- **Rollback time objective (RTO):** Ask: "How quickly must you be able to roll back?" Blue/green achieves <30 seconds. Rolling rollbacks take minutes proportional to replica count. This is the single most important differentiator between strategies.

### 2. Apply the Deployment Strategy Decision Framework

Use this decision tree in order:

- **Step 2a -- Can the environment sustain duplicate infrastructure cost?**
  - Yes (cloud, auto-scaling, sufficient budget): Blue/green is viable. Proceed to 2b.
  - No (fixed hardware, cost-constrained, bare metal): Rolling or Canary are the primary options.

- **Step 2b -- Is near-instant rollback (<60 seconds) a hard requirement?**
  - Yes: Blue/green is the strongest choice. DNS or load balancer flip achieves it.
  - No: Canary or rolling with automated rollback gates provides sufficient safety at lower cost.

- **Step 2c -- Is this a user-facing service where you need behavioral validation before full rollout?**
  - Yes, and you can instrument user metrics (conversion rate, error rate per segment): Canary with automated promotion criteria.
  - Yes, but behavioral metrics are hard to define: Blue/green with manual validation gate.
  - No (internal service, batch job, worker): Rolling with health check gates.

- **Step 2d -- Is downtime acceptable? (Scheduled maintenance window, internal tooling, non-production)**
  - Yes: Recreate strategy -- simplest possible. Stop old, start new.
  - No: Eliminate Recreate from consideration.

- **Step 2e -- Do you need to test with real production traffic without user impact?**
  - Yes: Shadow deployment (traffic mirroring). Run the new version alongside production, mirror real traffic to it, compare responses. Zero user impact, highest fidelity testing.

### 3. Define Automated Promotion and Rollback Criteria

Every deployment strategy must have explicit, metric-based gates -- not manual approval for routine deploys:

- **Error rate gate:** HTTP 5xx rate >1% of requests over a 5-minute window triggers automatic rollback. Tune the threshold based on baseline error rate (never tighter than 3x the p99 baseline variance).
- **Latency gate:** p99 latency increase of >20% relative to the previous 30-minute baseline triggers rollback. Use relative thresholds, not absolute, to account for traffic-dependent variance.
- **Saturation gate:** CPU >80% sustained for 3 minutes or memory >90% triggers rollback. These indicate the new version may degrade under load.
- **Business metric gate (canary-specific):** For canary, define a primary business metric: add-to-cart rate, checkout completion, API success rate. A >5% relative degradation compared to the stable cohort triggers automatic rollback.
- **Soak time:** Define minimum time at each canary stage (e.g., 10% traffic for 10 minutes, 25% for 15 minutes, 50% for 20 minutes) before automatic promotion. Even if metrics look good, statistical significance requires time.
- **Canary stages:** Do not jump from 0% to 100%. Use stages: 1%, 5%, 10%, 25%, 50%, 100%. Each stage doubles (approximately) exposure while keeping blast radius bounded.

### 4. Design the Infrastructure Prerequisites

Each strategy has specific infrastructure requirements -- confirm these before implementation:

- **Blue/Green requirements:**
  - Two identical environment slots (blue and green) -- either pre-provisioned or spin-up-on-deploy
  - A traffic switching mechanism: Load balancer target group swap (ALB, NLB), DNS TTL swap (set TTL to 60 seconds before deploy, not 300), or service mesh weighted routing
  - Shared or replicated data stores -- the two environments must read from the same database, or you must handle data sync
  - Warm-up time budget: New environment needs time to fill JVM caches, warm connection pools, load ML models. Account for 30--300 seconds of warm-up before switching traffic.

- **Canary/Rolling requirements:**
  - Load balancer or service mesh with weighted traffic routing (NGINX with `split_clients`, Envoy with weighted clusters, Kubernetes with service mesh like Istio or Linkerd)
  - Observability stack capable of segmenting metrics by version label -- every metric must carry a `version` or `deployment_id` tag so canary vs. stable can be compared
  - At least 2x replica headroom during the transition period -- rolling updates temporarily reduce capacity
  - Pod disruption budgets (Kubernetes) or equivalent to prevent rolling update from removing too many instances simultaneously

- **Shadow/Traffic Mirroring requirements:**
  - Service mesh or proxy with traffic mirroring capability (Envoy, NGINX `mirror` module, AWS ALB with mirror target)
  - Mirrored traffic must not trigger side effects (no emails, no payments, no database writes in the shadow path) -- use a separate database or mock downstream services
  - Sufficient compute capacity to handle 2x traffic (shadow runs the request twice)

### 5. Implement the Deployment Pipeline

Translate the chosen strategy into pipeline stages:

- **Pre-deploy gate:**
  - Run smoke tests against the artifact before deploying to any environment
  - Validate configuration schema (environment variables, feature flags) against a contract
  - Check that the database migration (if any) is backward-compatible with the current deployed version
  - Confirm infrastructure prerequisites are ready (environment slot exists, load balancer is configured)

- **Deploy stage (strategy-specific):**
  - For rolling: Set `maxUnavailable: 0` and `maxSurge: 25%` (or 1 replica, whichever is larger) to avoid capacity reduction during rollout. This ensures you never have fewer running instances than baseline.
  - For blue/green: Deploy the green environment, run health checks and integration tests against the green environment directly (via internal DNS or direct IP), then switch traffic only after validation passes.
  - For canary: Deploy the canary Deployment with a small replica count and use weighted service routing. Do NOT use Kubernetes `Deployment` replicas alone for canary traffic splitting -- replica ratio is an unreliable proxy for traffic percentage. Use a proper traffic management layer.

- **Health check validation:**
  - Readiness probe must pass on all new instances before traffic is shifted. Configure readiness probes with `initialDelaySeconds: 10`, `periodSeconds: 5`, `failureThreshold: 3` as a baseline -- adjust for application startup time.
  - Liveness probe should be distinct from readiness probe. Readiness checks if the instance can serve traffic; liveness checks if the process is alive and should not be restarted.
  - Deep health check endpoint (e.g., `/health/ready`) should verify database connectivity, cache availability, and downstream service reachability -- not just HTTP 200.

- **Traffic shift and observation window:**
  - Shift traffic according to the stage plan (canary stages or single flip for blue/green)
  - Observe for the defined soak time at each stage
  - Query the observability stack programmatically -- automated gates should read from Prometheus, Datadog, or CloudWatch metrics APIs, not human eyeballs

- **Post-deploy validation:**
  - Run synthetic transactions (canary probes) against the new version in production -- actual HTTP requests to business-critical endpoints
  - Verify that distributed tracing shows the new version handling requests (confirms traffic routing is correct)
  - Check that no alerts have fired in the first 15 minutes post-deploy

### 6. Implement Rollback Procedures

Rollback must be defined before deploy begins, not after something goes wrong:

- **Blue/green rollback:** Flip the load balancer target group back to blue. Execution time: <30 seconds. This is the "undo button" -- it requires no artifact rebuild, no re-deploy.
- **Rolling rollback:** `kubectl rollout undo deployment/<name>` or pipeline trigger that re-deploys the previous artifact tag. Time proportional to replica count -- 10 replicas at 2 replicas/minute = 5 minutes.
- **Canary rollback:** Remove the canary Deployment and route 100% traffic back to stable. If using Argo Rollouts, `kubectl argo rollouts abort <name>`.
- **Database rollback coupling:** If the deploy included a migration, and the migration is not backward-compatible, the database CANNOT be rolled back alongside the application without data loss. This is the most common reason zero-downtime deployments fail. Enforce the expand-contract pattern: never deploy a breaking schema change and application change simultaneously.
- **Artifact immutability:** Tag all artifacts with immutable identifiers (Git SHA, not `latest`). `latest` tags make rollback ambiguous and unreliable.

### 7. Instrument and Close the Feedback Loop

A deployment strategy without observability is a guess:

- **DORA metrics:** Track Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to Recovery. These four metrics objectively measure deployment strategy effectiveness. Target elite performance: deploy frequency daily or more, lead time <1 day, change failure rate <5%, MTTR <1 hour.
- **Deployment annotations:** Push a deployment event annotation to your metrics platform every time a deploy occurs. This allows instant visual correlation between deploys and metric changes in dashboards.
- **Version tagging:** Every metric emitted by your application must carry a version label. This enables side-by-side comparison of canary vs. stable error rates in Prometheus or Datadog.
- **Runbook linkage:** Every automated alert must link to a runbook that explains how to respond. Deployment-related alerts (e.g., "canary error rate elevated") must include the rollback command in the runbook body.
- **Post-deploy review cadence:** After every deployment incident (not just P1s), conduct a 30-minute blameless postmortem. Track whether the deployment strategy's automated gates caught the problem or missed it. Use this to tune gate thresholds.

---

## Output Format

When advising on or designing a deployment strategy, produce the following artifacts:

### Strategy Selection Summary

```
Application:         [service name]
Team size:           [N engineers]
Deploy frequency:    [N per day/week]
Traffic profile:     [peak RPS, p99 latency SLO]
Availability SLO:    [99.X%]
Rollback RTO:        [< N seconds/minutes]

Recommended strategy:  [Blue/Green | Canary | Rolling | Recreate | Shadow]
Rationale:             [2-3 sentences citing the specific factors above]
Ruled out:             [Strategy X -- reason; Strategy Y -- reason]
```

### Deployment Gate Configuration

```yaml
# Automated promotion/rollback criteria
gates:
  error_rate:
    threshold: 1.0%          # HTTP 5xx / total requests
    window: 5m
    action: rollback

  latency_p99:
    threshold: +20%           # relative increase vs. 30m baseline
    window: 5m
    action: rollback

  cpu_saturation:
    threshold: 80%
    sustained_for: 3m
    action: rollback

  soak_time_minimum:
    per_stage: 10m            # minimum time at each canary stage before promotion
    action: hold_until_elapsed

canary_stages:
  - weight: 1
    soak: 10m
  - weight: 5
    soak: 10m
  - weight: 10
    soak: 15m
  - weight: 25
    soak: 15m
  - weight: 50
    soak: 20m
  - weight: 100
    soak: 0m    # final promotion, monitoring continues
```

### Rolling Update Configuration (Kubernetes example)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [service-name]
  annotations:
    deployment.kubernetes.io/change-cause: "[git-sha] [ticket-id] [brief description]"
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0     # never reduce below baseline capacity
      maxSurge: 2           # allow 2 extra replicas during rollout (33% surge)
  minReadySeconds: 30       # instance must pass readiness for 30s before counted as available
  template:
    spec:
      containers:
        - name: [service-name]
          image: [registry]/[service]:[git-sha]   # NEVER use :latest
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 5
            failureThreshold: 3
            successThreshold: 1
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi
      terminationGracePeriodSeconds: 60   # allow in-flight requests to complete
```

### Blue/Green Pipeline Pseudocode

```
PIPELINE blue_green_deploy(artifact_tag):

  1. PROVISION green environment
     - Clone blue infrastructure (IaC parameterized by slot name)
     - Apply artifact_tag to green deployment
     - Wait for all green replicas to pass readiness probes

  2. VALIDATE green (internal traffic only)
     - Run integration test suite against green internal endpoint
     - Run synthetic transactions against green
     - Assert: error rate < 0.5%, p99 latency < SLO threshold
     IF validation fails:
       DESTROY green environment
       FAIL pipeline with validation report

  3. SHIFT traffic
     - Update load balancer: 100% -> green
     - Record rollback point: blue slot, load balancer previous config

  4. OBSERVE (15 minute soak)
     - Poll error rate, latency, saturation every 30 seconds
     IF any gate breached:
       ROLLBACK: update load balancer 100% -> blue
       ALERT on-call with rollback reason and metrics
       FAIL pipeline

  5. PROMOTE
     - Keep blue environment for 2 hours (fast rollback window)
     - After 2 hours: DESTROY blue or re-tag as next deploy slot
     - ANNOTATE metrics platform with deploy event

  6. POST-DEPLOY
     - Verify synthetic transactions passing
     - Confirm no alerts fired
     - Mark deployment as successful in deployment tracking system
```

### Decision Matrix

| Factor | Recreate | Rolling | Blue/Green | Canary | Shadow |
|---|---|---|---|---|---|
| Downtime | Full | Near-zero | Zero | Zero | Zero |
| Rollback speed | Minutes (redeploy) | 3--15 min | <30 sec | <2 min | N/A |
| Infrastructure cost | 1x | 1x--1.25x | 2x | 1x--1.25x | 2x |
| Blast radius | 100% | Staged | 100% then flip | 1%--100% staged | 0% (shadow only) |
| DB migration safety | Simple | Moderate | Complex (shared DB) | Best (staged) | Read-only test |
| Implementation complexity | Low | Low--Medium | Medium | Medium--High | High |
| Best for | Dev/test, batch | General purpose | Stateless, critical | User-facing, risk-averse | Validation before canary |

---

## Rules

1. **NEVER use `:latest` as an artifact tag in any deployment.** Latest is mutable -- you cannot reliably roll back to it because the tag may point to a different image by the time you attempt rollback. Always tag with the immutable Git SHA (12 characters minimum).

2. **NEVER deploy a breaking database schema change in the same deployment as the application code that depends on it.** Use the expand-contract pattern: Phase 1 -- add the new column (backward-compatible), deploy the app that can read both schemas. Phase 2 -- remove the old column after the new app version is fully deployed and validated.

3. **NEVER configure `maxUnavailable > 0` in a rolling update for a service with fewer than 4 replicas.** With 2 replicas and `maxUnavailable: 1`, you are running at 50% capacity during the rollout. Set `maxUnavailable: 0` and `maxSurge: 1` for small replica counts.

4. **NEVER set DNS TTL to 300 seconds and use DNS-based blue/green switching.** At TTL 300, it takes up to 5 minutes for all clients to see the switch, and rollback is equally slow. Drop TTL to 60 seconds at least 10 minutes before the deploy window.

5. **NEVER treat canary rollout by replica count as equivalent to canary rollout by traffic percentage.** Two canary pods out of 10 total does not guarantee 20% of traffic goes to canary -- it depends on load balancer behavior, session affinity, and request distribution. Use explicit traffic weighting in your load balancer or service mesh.

6. **ALWAYS define rollback criteria and the rollback command before the deployment pipeline runs.** The rollback procedure must be documented, tested, and accessible to the on-call engineer in under 60 seconds. Never improvise rollback steps during an incident.

7. **ALWAYS ensure the readiness probe endpoint performs a deep health check.** A shallow readiness probe (HTTP 200 on `/`) that does not verify database connectivity will mark an instance as ready before it can actually serve traffic successfully, invalidating your deployment health gates.

8. **NEVER skip the minimum soak time gate even when metrics look excellent.** Statistical significance requires time. A canary error rate of 0% after 30 seconds on 1% traffic means nothing -- it may have received fewer than 10 requests. Enforce minimum soak times regardless of observed metrics.

9. **ALWAYS keep the previous deployment artifact available for at least 2 hours after a successful blue/green promotion.** Subtle bugs (memory leaks, cache poisoning, background job failures) often manifest 30--90 minutes after deployment. Keeping the blue environment live enables instant rollback without a rebuild.

10. **NEVER instrument deployment success solely by exit code of the deploy command.** A Kubernetes `kubectl apply` returns 0 even if pods are crash-looping. Success must be confirmed by: all replicas passing readiness probes, error rate within bounds, and at least one successful synthetic transaction against the deployed version in production.

---

## Edge Cases

### Stateful Applications and Session Affinity

**Scenario:** The application maintains server-side state (WebSocket connections, long-polling, sticky sessions) and cannot be dropped mid-session during a rolling update.

**Handling:**
- Configure load balancer sticky sessions (cookie-based affinity, not IP-based -- IP affinity breaks under NAT) before initiating the rollout.
- Set `terminationGracePeriodSeconds` to at least the maximum expected session duration (for WebSockets, this may be 300--900 seconds).
- Configure the application to reject new connections gracefully during shutdown (`SIGTERM` handler closes the accept loop, drains existing connections, then exits).
- For rolling updates, `maxUnavailable: 0` is mandatory -- never pull an instance while it may be holding active sessions.
- If session duration exceeds a reasonable termination grace period, externalize session state (Redis Cluster with TTL) before attempting any live rolling update strategy. This is a prerequisite, not an optimization.

### Database Migration Coupled to Deployment

**Scenario:** A new application version requires schema changes (column rename, table restructure, index addition) that are incompatible with the running version.

**Handling:**
- Apply the expand-contract (also called parallel change) pattern across three sequential deployments:
  1. **Expand:** Add new schema elements (new column, new table) without removing old ones. Deploy application version that writes to both old and new schema simultaneously.
  2. **Migrate:** Run data migration to backfill new schema from old data. Application continues writing to both. Validate backfill completeness.
  3. **Contract:** Deploy application version that reads only new schema. Remove old schema elements.
- Each phase must be independently deployable and rollback-safe.
- For blue/green with a shared database: both blue and green must be compatible with the deployed schema simultaneously, since both may be serving traffic during validation.
- Never use `ON DELETE CASCADE` or destructive migrations in the expand phase -- they cannot be rolled back.

### High-Frequency Deployment (>20 Deploys Per Day)

**Scenario:** A team is deploying dozens of times per day, and heavyweight strategies (full blue/green environment provisioning) introduce unacceptable pipeline latency.

**Handling:**
- Use pre-warmed environment pools (one blue, one green always running) rather than on-demand provisioning. Provisioning a new environment from scratch takes 3--10 minutes; swapping a pre-warmed slot takes 30 seconds.
- Implement progressive delivery with feature flags as the primary risk-reduction mechanism, separate from the deployment event. The deployment ships the code (dark launch); the feature flag controls who sees it. This decouples deployment risk from feature risk.
- Use rolling updates with aggressive automated gates rather than blue/green for most services. Reserve blue/green for the highest-criticality services (payment processing, authentication) where rollback speed justifies 2x infrastructure cost.
- Cap pipeline cycle time: if a deploy pipeline takes >15 minutes, engineers will batch changes to reduce the overhead, which increases blast radius. Optimize pipeline stages (parallel test execution, layer-cached container builds) to stay under 10 minutes gate-to-production.

### Multi-Region and Multi-Cluster Deployment

**Scenario:** The service runs across 3+ AWS regions or Kubernetes clusters, and a deployment must be coordinated across all of them.

**Handling:**
- Never deploy to all regions simultaneously. Use a progressive regional rollout: deploy to the lowest-traffic region first (often us-west-2 or a non-primary region), observe for 15--30 minutes, then proceed to additional regions.
- The primary (highest traffic) region should be the last region deployed. This limits blast radius to a fraction of global traffic during the most dangerous phase.
- Define a "region health gate" -- before promoting to the next region, confirm that the previous region's error rate, latency, and saturation are within bounds.
- Implement global rollback as a single operation via traffic weighting at the CDN or global load balancer layer (Cloudflare, AWS Global Accelerator). Do not rely on per-region rollbacks in a multi-region incident -- it takes too long.
- Version skew: during the rollout window, different regions run different versions. Ensure inter-service APIs are backward-compatible for at least 2 consecutive versions. Use semantic versioning for internal APIs and enforce compatibility contracts in CI.

### Rollback Fails Due to Database State

**Scenario:** Automated rollback triggers during a canary deploy, but the new version has already written data in a format the old version cannot read.

**Handling:**
- This scenario indicates the expand-contract pattern was not followed. The root fix is procedural (enforce backward-compatible migrations), but the immediate handling is:
  1. Do NOT roll back the application if doing so would cause data corruption or application crashes in the old version.
  2. Instead, roll forward with a hotfix that restores read compatibility.
  3. Define this as an incident: the deploy gate failed to catch a data compatibility issue before rollback became unsafe.
- Add a pre-deploy check to the pipeline: query the running database schema version and assert compatibility with both the current and the new application version before the deploy proceeds.
- In the post-incident review, enforce the requirement that all schema migrations be reviewed by a database engineer and tested in a staging environment with production-scale data before merging.

### Shadow Deployment Side Effects

**Scenario:** Shadow/mirroring deployment is used to test a new service version, but the shadow path triggers unintended side effects (emails sent, payments charged, messages published to queues).

**Handling:**
- Shadow deployments require a strict read-only contract for the mirrored path. The shadow service must never write to production databases, call external payment processors, send notifications, or publish to production message queues.
- Implement a shadow-mode flag in the application that, when enabled, replaces all write operations with no-ops or writes to a shadow-specific database.
- Alternatively, provide stub implementations of all side-effecting dependencies for the shadow environment: a stub payment service that accepts but does not process, a stub email service that logs but does not send.
- Verify the stub/no-op behavior in integration tests before enabling shadow traffic. A single missed write path in shadow mode can result in double-charged customers or duplicate notifications.
- Review shadow response body differences against production -- mismatches in response structure (not just latency/error rates) often reveal bugs that would have caused errors in production.

### Canary Deployment on a Service with Low Traffic Volume

**Scenario:** A service handles 20 RPS peak. At 5% canary weight, only 1 request per second goes to the canary. Statistical significance for a 1% error rate requires hundreds of requests, meaning the soak time must be very long.

**Handling:**
- Adjust canary stages for low-traffic services: skip the 1% and 5% stages (too little traffic to be meaningful) and start at 10--20%.
- Extend soak times proportionally. For a service at 2 RPS canary traffic, achieving 500 requests requires 250 seconds (4.2 minutes). Set minimum soak time to at least 10 minutes at 10% to accumulate sufficient data.
- Use wider error rate confidence intervals for low-traffic gates. A single 500 error in 50 requests is 2% -- this should not trigger rollback on its own. Require at least 5 errors in the window, or use a Bayesian error rate model rather than a simple threshold.
- Consider using synthetic load (load test against canary) in addition to organic traffic to accelerate validation, especially for performance regression checks.

---

## Example

**Input:** "We're running a payment processing API on Kubernetes (6 replicas). It handles about 800 RPS at peak, our SLO is 99.95% availability, and we deploy roughly 3--5 times per week. We've been doing rolling updates but had two incidents this year where a bad deploy took 8 minutes to roll back and degraded the service during that time. What deployment strategy should we use and how do we implement it?"

**Output:**

### Analysis

The current situation reveals a specific problem: rolling update rollback takes 8 minutes, and during that window, degraded pods are serving traffic. For a payment API at 99.95% SLO (4.4 hours downtime budget/year), an 8-minute degradation event consumes 3% of the annual budget in a single incident.

The root cause with rolling rollbacks is that `kubectl rollout undo` re-deploys the previous image using the same rolling update mechanism -- it does not instantly revert traffic. With 6 replicas, even with `maxSurge: 2`, replacing all pods takes approximately 6--10 minutes.

**Recommendation: Blue/Green for this service.**

**Ruled out:**
- Rolling update -- current strategy. Rollback RTO of 6--10 minutes is incompatible with payment SLO. Ruled out.
- Canary -- suitable as a secondary risk gate, but canary rollback still takes 2--5 minutes. Payment processing needs faster rollback as the primary mechanism.
- Recreate -- requires full downtime. Payment API cannot have planned downtime. Ruled out completely.

### Strategy Selection Summary

```
Application:         payment-api
Team size:           ~6 engineers (inferred)
Deploy frequency:    3--5 per week
Traffic profile:     800 RPS peak
Availability SLO:    99.95% (4.4 hours/year)
Rollback RTO:        <60 seconds (required for payment criticality)

Recommended strategy:  Blue/Green (primary) + Canary gates (pre-switch validation)
Rationale:             Blue/green achieves sub-30-second rollback via load balancer
                       flip, which is the only mechanism meeting the 99.95% SLO at
                       800 RPS. Canary gates validate the green environment with 5%
                       of traffic before the full switch, catching regressions before
                       100% exposure.

Ruled out:
  Rolling update  -- 6--10 min rollback violates SLO budget
  Canary (only)   -- 2--5 min rollback still too slow for payment path
  Recreate        -- requires downtime, never appropriate for payment APIs
```

### Infrastructure Changes Required

The current rolling update setup needs these additions:

1. **Two persistent environment slots** -- Maintain a "blue" and "green" Deployment in the same Kubernetes namespace, or use two separate namespaces. The load balancer (Kubernetes Service + Ingress, or an ALB) routes traffic to the active slot.

2. **Traffic switching mechanism** -- Use Kubernetes Service selector labels to switch traffic. The Service selects pods by label `slot: blue` or `slot: green`. Switching is instantaneous: one `kubectl patch service payment-api -p '{"spec":{"selector":{"slot":"green"}}}'` command.

3. **Internal validation endpoint** -- The green Deployment needs a separate internal Service (not exposed externally) for running integration tests against it before the traffic switch.

### Deployment Gate Configuration

```yaml
# payment-api deployment gates
gates:
  error_rate:
    metric: 'rate(http_requests_total{status=~"5..",service="payment-api"}[5m]) /
             rate(http_requests_total{service="payment-api"}[5m])'
    threshold: 0.5%        # tighter than default for payment -- half of 1%
    window: 5m
    action: rollback

  latency_p99:
    metric: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket
             {service="payment-api"}[5m]))'
    threshold: +15%        # relative increase vs. 30m baseline
    window: 5m
    action: rollback

  payment_success_rate:    # business metric gate -- specific to payment API
    metric: 'rate(payment_transactions_total{status="success"}[5m]) /
             rate(payment_transactions_total[5m])'
    threshold: -2%         # alert if success rate drops more than 2 percentage points
    window: 5m
    action: rollback

  soak_time_pre_switch:    # minimum observation at 5% traffic (canary pre-validation)
    duration: 15m
    action: hold_until_elapsed

canary_pre_validation_stages:
  # Run these against green BEFORE full traffic switch
  - weight: 5
    soak: 15m
    gate: all_above
  # If 5% passes for 15 minutes, proceed to full switch
  # Full switch is atomic (load balancer selector flip), not gradual
```

### Kubernetes Configuration

**Blue and Green Deployments:**

```yaml
# green deployment (deployed during each release cycle)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api-green
  namespace: payments
  annotations:
    deployment.kubernetes.io/change-cause: "a3f92c1 PYMT-1042 fix retry idempotency"
spec:
  replicas: 6
  selector:
    matchLabels:
      app: payment-api
      slot: green
  strategy:
    type: RollingUpdate    # used only within the green slot during warm-up
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 2
  minReadySeconds: 30
  template:
    metadata:
      labels:
        app: payment-api
        slot: green
        version: "a3f92c1"   # git sha -- enables per-version metric segmentation
    spec:
      containers:
        - name: payment-api
          image: registry.example.com/payment-api:a3f92c1
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /health/ready   # checks DB, cache, downstream payment processor
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 5
            failureThreshold: 3
            successThreshold: 2     # must pass TWICE before marked ready (extra safety)
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3
          resources:
            requests:
              cpu: 500m
              memory: 768Mi
            limits:
              cpu: 2000m
              memory: 1.5Gi
          env:
            - name: SLOT
              value: "green"
            - name: VERSION
              value: "a3f92c1"
      terminationGracePeriodSeconds: 90    # payment requests can take up to 60s
      podDisruptionBudget:                 # defined separately, shown below
        maxUnavailable: 1
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: payment-api-pdb
  namespace: payments
spec:
  maxUnavailable: 1          # at most 1 pod unavailable at a time (cluster maintenance)
  selector:
    matchLabels:
      app: payment-api
      slot: blue             # PDB applies to whichever slot is active
```

**Service (traffic switching mechanism):**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: payment-api
  namespace: payments
spec:
  selector:
    app: payment-api
    slot: blue              # CURRENT ACTIVE SLOT -- change to "green" to switch traffic
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
---
# Internal validation service -- routes to green without affecting production traffic
apiVersion: v1
kind: Service
metadata:
  name: payment-api-green-internal
  namespace: payments
spec:
  selector:
    app: payment-api
    slot: green
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

### Pipeline Steps

```
PIPELINE payment-api-blue-green-deploy(git_sha):

PRE-CHECKS (fail fast):
  - Assert image registry.example.com/payment-api:[git_sha] exists and is signed
  - Run db-migration-compatibility-check: assert migration is backward-compatible
    with current running version
  - Assert green slot Deployment does not already exist (clean slate)

STEP 1 -- Deploy green (5 min):
  - Apply payment-api-green Deployment with image tag [git_sha]
  - Wait: all 6 replicas pass readiness probes
  - If timeout (10 min): destroy green, fail pipeline, page on-call

STEP 2 -- Internal integration tests against green (3 min):
  - POST /payments/initiate against payment-api-green-internal Service
  - Assert: 200 response, idempotency key handled correctly
  - Assert: database write confirmed (read-back)
  - Assert: no errors in green pod logs in last 60 seconds
  - If any assertion fails: destroy green, fail pipeline

STEP 3 -- Canary pre-validation (15 min soak at 5%):
  - Update Ingress: route 5% of traffic to green (Nginx split_clients or NGINX Plus)
  - Start 15-minute observation timer
  - Poll every 30s: error_rate, latency_p99, payment_success_rate
  - If any gate breaches: route 100% back to blue, destroy green, fail pipeline
  - If soak completes successfully: proceed

STEP 4 -- Full traffic switch (<30 seconds):
  - kubectl patch service payment-api -n payments \
      -p '{"spec":{"selector":{"slot":"green"}}}'
  - Record rollback command: kubectl patch service payment-api -n payments \
      -p '{"spec":{"selector":{"slot":"blue"}}}'
  - Annotate Grafana, Datadog with deployment event: service=payment-api,
    version=[git_sha], slot=green

STEP 5 -- Post-switch observation (15 min):
  - Run synthetic transaction every 30 seconds: full payment flow end-to-end
  - Poll all gates as in Step 3
  - If any gate breaches: IMMEDIATE rollback (selector flip to blue), page on-call
  - Rollback completes in <30 seconds

STEP 6 -- Promote and cleanup:
  - Mark deploy as successful in deployment tracking
  - Retain blue Deployment for 2 hours (fast rollback window)
  - After 2 hours, if no rollback: delete blue Deployment, tag blue slot as next
    deploy target
  - Update PodDisruptionBudget selector to "green"

STEP 7 -- Post-deploy validation:
  - Confirm DORA metrics updated: deployment frequency, lead time
  - Verify no new alerts firing in PagerDuty
  - Send deploy notification to #payments-deploys Slack channel with
    rollback command embedded in message body
```

### Expected Improvements

| Metric | Current (Rolling) | Target (Blue/Green) |
|---|---|---|
| Rollback time | 6--10 minutes | <30 seconds |
| Traffic impact during bad deploy | Full 100% degraded for 8 min | Max 5% for 15 min (canary phase) |
| SLO budget consumed per incident | ~3% of annual | ~0.06% of annual |
| Deploy pipeline duration | ~8 min | ~25 min (longer, but safer) |
| Time-to-detect bad deploy | When rollback starts | Within 30s of canary stage |

The 25-minute pipeline duration is the primary trade-off. For a payment API deploying 3--5 times per week, 25 minutes is acceptable. If pipeline duration becomes a blocker, the canary pre-validation stage (Step 3) can be parallelized with synthetic load to reduce the soak time while maintaining statistical significance.
