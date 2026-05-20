---
name: kubernetes-configuration
description: |
  Guides expert-level kubernetes configuration implementation: cloud and best-practices decision frameworks, production-ready patterns, and concrete templates for kubernetes configuration workflows.
  Use when the user asks about kubernetes configuration, kubernetes configuration configuration, or devops best practices for kubernetes projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud best-practices"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Kubernetes Configuration

## When to Use

**Use this skill when:**
- User asks how to write or review Kubernetes manifests (Deployments, StatefulSets, DaemonSets, Jobs, CronJobs) for production workloads
- User wants guidance on resource requests/limits, pod disruption budgets, horizontal pod autoscaling, or vertical pod autoscaling configuration
- User needs to configure namespaces, RBAC, NetworkPolicies, PodSecurityAdmission, or ServiceAccounts for a Kubernetes cluster
- User is setting up ConfigMaps, Secrets, or external secret management integration (Vault, AWS Secrets Manager, Sealed Secrets) in Kubernetes
- User wants to implement multi-environment configuration patterns using Kustomize overlays, Helm values files, or GitOps workflows with ArgoCD or Flux
- User asks about cluster-level configuration such as LimitRanges, ResourceQuotas, admission webhooks, or Priority Classes
- User needs to tune ingress controllers (NGINX, Traefik), service mesh configuration (Istio, Linkerd), or CNI-level networking policies
- User is troubleshooting misconfigured pods (OOMKilled, CrashLoopBackOff, Pending, Evicted) and needs remediation guidance
- User wants to implement pod topology spread constraints, node affinity, taints/tolerations, or pod anti-affinity for high availability

**Do NOT use this skill when:**
- User needs CI/CD pipeline configuration that only incidentally deploys to Kubernetes -- use a dedicated CI/CD pipeline skill
- User is asking about Terraform or Pulumi infrastructure provisioning of the cluster itself (node groups, VPCs, IAM) -- use infrastructure-as-code skills
- User needs Dockerfile optimization or container image build advice -- use a container image skill
- User is asking about Helm chart authoring and packaging best practices beyond values configuration -- use a Helm chart development skill
- User needs service mesh traffic management (canary deployments, circuit breaking in Istio VirtualServices) beyond basic sidecar injection -- use a service mesh skill
- User is asking about Kubernetes operator development -- use an operator development skill
- User needs cloud-provider-specific managed Kubernetes setup (EKS node groups, GKE Autopilot classes, AKS node pool configuration) -- use provider-specific skills

---

## Process

### 1. Establish Workload Characteristics and Requirements

Before writing a single line of YAML, gather the specific workload profile:

- **Workload type:** Is this a stateless HTTP service (Deployment), stateful database (StatefulSet), batch processor (Job/CronJob), or cluster agent (DaemonSet)? Each requires fundamentally different configuration patterns.
- **Traffic profile:** Peak requests per second, expected p99 latency target (e.g., <200ms), whether traffic is bursty or steady-state. This drives HPA min/max replica counts and CPU request sizing.
- **Startup behavior:** Does the container take >10 seconds to initialize? You need a `startupProbe` separate from `livenessProbe` to avoid premature restarts during slow initialization.
- **State and storage:** Does the container write to local disk? If yes, you cannot use a simple Deployment -- you need a StatefulSet with a VolumeClaimTemplate or a ReadWriteMany PersistentVolume.
- **Privilege requirements:** Does the container need to bind to ports <1024, access the host network, or mount host paths? Document these as exceptions; they require explicit security context overrides.
- **Dependency graph:** Which services does this pod call, and which call it? This shapes NetworkPolicy allow-lists and readiness probe logic (don't mark ready until dependencies are reachable).

### 2. Set Resource Requests and Limits Precisely

Resource misconfiguration is the #1 cause of production Kubernetes incidents. Apply these concrete steps:

- **Requests set the scheduling floor.** The scheduler places the pod on a node with at least this much free capacity. Under-setting requests leads to noisy-neighbor CPU throttling; over-setting leads to wasted capacity and Pending pods.
- **Use Vertical Pod Autoscaler in recommendation mode** for one week on a staging deployment running production-like load to get empirical baseline request values before setting them manually.
- **CPU limits cause throttling, not OOMKill.** Setting a CPU limit of `500m` on a pod that occasionally needs `800m` causes invisible latency spikes. For latency-sensitive services, consider omitting CPU limits and relying only on requests -- enforce total cluster CPU via ResourceQuota instead.
- **Memory limits must be set.** Unlike CPU, memory cannot be throttled -- exceeding the limit results in OOMKill. Set memory limit to 20-30% above the memory request to absorb JVM heap fluctuations or in-request allocation spikes.
- **Concrete sizing example:** A Node.js API handling 500 RPS typically needs `cpu: 200m` request, no CPU limit, `memory: 256Mi` request, `memory: 384Mi` limit as a starting point. Profile and adjust.
- **Set LimitRange defaults at the namespace level** so pods without explicit resource settings get sensible defaults rather than consuming unlimited resources:
  ```yaml
  apiVersion: v1
  kind: LimitRange
  metadata:
    name: default-limits
    namespace: production
  spec:
    limits:
    - type: Container
      default:
        cpu: 500m
        memory: 256Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
  ```
- **ResourceQuota per namespace** caps total consumption: set `requests.cpu`, `limits.cpu`, `requests.memory`, `limits.memory`, and `count/pods` for production namespaces.

### 3. Configure Health Probes Correctly

Probe misconfiguration causes either unnecessary pod restarts (too aggressive) or failed traffic routing to broken pods (too permissive):

- **`startupProbe`:** Use when container initialization takes >10 seconds. Set `failureThreshold * periodSeconds` to cover the worst-case startup time. Example: `failureThreshold: 30, periodSeconds: 5` allows 150 seconds for startup. Once it succeeds once, it disables itself.
- **`livenessProbe`:** Kills and restarts the container when it fails. Only check that the process is alive (not deadlocked). Do NOT check external dependencies (database connectivity) in livenessProbe -- this causes cascading restarts during a database outage.
- **`readinessProbe`:** Removes the pod from Service endpoints when it fails. This probe CAN check external dependencies -- if the database is down, it is correct to stop routing traffic to this pod.
- **Probe timing guidance:** For HTTP probes, `initialDelaySeconds: 0` (use startupProbe instead), `periodSeconds: 10`, `failureThreshold: 3`, `successThreshold: 1`, `timeoutSeconds: 3`. Adjust `timeoutSeconds` to be less than your p99 response time under load.
- **Prefer `/healthz` (liveness) and `/readyz` (readiness)** as separate endpoints. Never combine them. The `/readyz` endpoint should return 503 when the app cannot serve traffic. The `/healthz` endpoint should only return 500 when the process itself is broken.
- **For TCP probes** (databases, gRPC without health endpoint), use `tcpSocket` with `port: 5432` as a fallback, but implement gRPC health protocol or HTTP sidecar where possible for richer health semantics.

### 4. Design for High Availability and Disruption Tolerance

A single misconfigured field can cause 100% downtime during routine node maintenance:

- **Replica count:** Never run a production Deployment with `replicas: 1`. Minimum is 2 for stateless services; 3 for services requiring zero-downtime rolling updates with maxUnavailable: 0.
- **Pod Disruption Budget (PDB):** This is mandatory for every production workload. It prevents node drain operations from simultaneously evicting all pods:
  ```yaml
  apiVersion: policy/v1
  kind: PodDisruptionBudget
  metadata:
    name: api-pdb
  spec:
    minAvailable: 2   # or use maxUnavailable: 1
    selector:
      matchLabels:
        app: api
  ```
  Set `minAvailable` to the minimum number of replicas needed to serve production traffic. For a 3-replica deployment, `minAvailable: 2` allows rolling node drain without service interruption.
- **Pod Anti-Affinity:** Spread replicas across nodes and, if applicable, across availability zones. Use `preferredDuringSchedulingIgnoredDuringExecution` for flexibility, `requiredDuringSchedulingIgnoredDuringExecution` when zone isolation is mandatory:
  ```yaml
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values: ["api"]
        topologyKey: "topology.kubernetes.io/zone"
  ```
- **Topology Spread Constraints** (preferred over podAntiAffinity for even distribution): Use `maxSkew: 1`, `topologyKey: topology.kubernetes.io/zone`, `whenUnsatisfiable: DoNotSchedule` to enforce even zone distribution.
- **Rolling update strategy:** Set `maxUnavailable: 0` and `maxSurge: 1` for zero-downtime deployments. This temporarily uses one extra pod slot during the update. Requires that resource quota accommodates the surge.
- **Termination grace period:** Set `terminationGracePeriodSeconds` to the time your application needs to finish in-flight requests. For most HTTP services, 30-60 seconds is sufficient. Implement SIGTERM handling in your application to stop accepting new connections and drain existing ones.

### 5. Implement Security Controls at Every Layer

Apply the Kubernetes security hierarchy: cluster > namespace > pod > container:

- **PodSecurityAdmission (PSA):** Label namespaces with the appropriate policy level. Use `restricted` for all production workloads unless a specific exception is documented:
  ```yaml
  metadata:
    labels:
      pod-security.kubernetes.io/enforce: restricted
      pod-security.kubernetes.io/enforce-version: v1.28
      pod-security.kubernetes.io/warn: restricted
      pod-security.kubernetes.io/audit: restricted
  ```
- **Security context per container** -- apply all of these unless you have a documented exception:
  ```yaml
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 3000
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop: ["ALL"]
  ```
- **Secrets management:** Never store plaintext secrets in ConfigMaps. Never mount Secrets as environment variables for sensitive values (they appear in `kubectl describe` output). Mount secrets as files at `/run/secrets/` with mode `0400`. Use External Secrets Operator with AWS Secrets Manager or HashiCorp Vault for production secret lifecycle management.
- **RBAC:** Create dedicated ServiceAccounts per application (never use the `default` ServiceAccount). Grant only the exact API verbs and resources needed. Use `ClusterRole` only for cluster-wide resources; use `Role` + `RoleBinding` for namespace-scoped permissions. Audit with `kubectl auth can-i --list --as=system:serviceaccount:production:api-service`.
- **NetworkPolicy:** Default-deny all ingress and egress at namespace level, then allow-list specific flows. A minimal NetworkPolicy looks like:
  ```yaml
  # Default deny all ingress
  spec:
    podSelector: {}
    policyTypes: ["Ingress", "Egress"]
  ```
  Then add explicit allow rules for each required traffic path.
- **Image security:** Set `imagePullPolicy: Always` for `latest` tags (though avoid `latest` in production -- use digest-pinned or semver tags). Enforce via OPA/Gatekeeper policy that images must come from approved registries.

### 6. Configure Multi-Environment Patterns with Kustomize or Helm

Avoid copy-pasting manifests between dev, staging, and production. Use structured parameterization:

- **Kustomize approach:** Maintain a `base/` directory with environment-agnostic manifests and an `overlays/` directory for each environment. The overlay patches only what differs (replica counts, resource sizes, image tags, ingress hostnames). Never duplicate entire manifests in overlays.
  ```
  k8s/
    base/
      deployment.yaml
      service.yaml
      kustomization.yaml
    overlays/
      dev/
        kustomization.yaml      # patches: replicas=1, resources=small
      staging/
        kustomization.yaml      # patches: replicas=2, resources=medium
      production/
        kustomization.yaml      # patches: replicas=5, resources=large + PDB
  ```
- **Helm approach:** Use a single `values.yaml` as the production-equivalent default. Provide environment-specific `values-dev.yaml`, `values-staging.yaml` that override only what differs. Deploy with `helm upgrade --install --values values.yaml --values values-production.yaml`.
- **Image tag management:** In Kustomize, use the `images:` field in `kustomization.yaml` to override the image tag per environment. In CI/CD pipelines, use `kustomize edit set image` to inject the build SHA before applying.
- **GitOps with ArgoCD:** Define one Application per environment, pointing to the corresponding overlay. Set `syncPolicy.automated.prune: true` and `syncPolicy.automated.selfHeal: true` for production. Store encrypted secrets separately using Sealed Secrets or Vault Agent Injector.
- **Configuration drift detection:** With GitOps, use ArgoCD's drift detection (shows `OutOfSync` when someone manually applies a change). For non-GitOps workflows, use `kubectl diff` in CI before `kubectl apply`.

### 7. Validate, Test, and Enforce Standards

Configuration that cannot be validated automatically will drift over time:

- **Static analysis pipeline steps:**
  - `kubeval` or `kubeconform` -- validates YAML against OpenAPI schemas for the target Kubernetes version. Catches API version deprecations (e.g., `extensions/v1beta1` Ingress was removed in 1.22).
  - `kube-score` -- scores manifests against best practices. Flags missing resource limits, missing PodDisruptionBudgets, containers running as root.
  - `checkov` -- scans for security policy violations across IaC including Kubernetes manifests.
  - `pluto` -- detects deprecated API versions across the entire manifest tree.
- **Admission controller enforcement:** Deploy OPA/Gatekeeper or Kyverno ConstraintTemplates to enforce organizational policies at the API server level. Example policies: require resource limits on all containers, prohibit `hostNetwork: true` without approval, require specific label keys (`app`, `version`, `team`).
- **Dry-run validation:** Always use `kubectl apply --dry-run=server` before applying to production. Server-side dry-run invokes admission webhooks and validates against the actual cluster state, catching issues that client-side dry-run misses.
- **CI pipeline order:** lint YAML syntax --> validate with kubeconform --> score with kube-score --> security scan with checkov --> `kubectl diff` against staging --> apply to staging --> smoke test --> apply to production with change window gate.

### 8. Implement Observability Hooks

A Kubernetes manifest that does not expose metrics and logs is not production-ready:

- **Prometheus annotations** (for clusters using annotation-based scraping): add `prometheus.io/scrape: "true"`, `prometheus.io/port: "8080"`, `prometheus.io/path: "/metrics"` to pod template annotations.
- **Structured logging:** Set environment variable `LOG_FORMAT=json` and `LOG_LEVEL=info` via ConfigMap reference. Avoid `LOG_LEVEL=debug` in production -- it dramatically increases log volume and cost.
- **Pod labels for dashboards:** Enforce consistent labels `app`, `version`, `component`, `team` on all pods. Grafana dashboards and Prometheus recording rules depend on these for aggregation. Use `kube-score` to enforce label presence.
- **Graceful shutdown and drain:** Kubernetes sends SIGTERM before SIGKILL (after `terminationGracePeriodSeconds`). The application must handle SIGTERM by: (1) stopping the HTTP listener from accepting new connections, (2) waiting for in-flight requests to complete, (3) flushing log buffers, (4) closing database connections. Add a `preStop` lifecycle hook with a 5-second sleep to account for the iptables rule propagation delay before the pod actually stops receiving traffic:
  ```yaml
  lifecycle:
    preStop:
      exec:
        command: ["/bin/sleep", "5"]
  ```

---

## Output Format

When providing Kubernetes configuration guidance, produce:

**1. Annotated YAML manifests** with inline comments explaining non-obvious decisions:

```yaml
# deployment.yaml
# Service: payment-api
# Environment: production
# Owner: payments-team
# Last reviewed: see git blame

apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
  namespace: production
  labels:
    app: payment-api
    version: "1.4.2"
    team: payments
    component: api
  annotations:
    kubernetes.io/change-cause: "Bumped to v1.4.2 -- adds idempotency keys"
spec:
  replicas: 3
  revisionHistoryLimit: 5       # keep 5 ReplicaSet revisions for rollback
  selector:
    matchLabels:
      app: payment-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0          # never reduce capacity during update
      maxSurge: 1                # allow one extra pod during rollover
  template:
    metadata:
      labels:
        app: payment-api
        version: "1.4.2"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: payment-api-sa   # dedicated SA, not default
      terminationGracePeriodSeconds: 60    # matches max request timeout
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
        seccompProfile:
          type: RuntimeDefault
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: payment-api
      containers:
      - name: payment-api
        image: registry.company.com/payment-api:1.4.2
        imagePullPolicy: IfNotPresent      # digest-pinned tag, no need for Always
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            # No CPU limit -- avoids throttling on bursty workloads
            # Total CPU governed by namespace ResourceQuota
            memory: 384Mi              # 50% headroom above request
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
        startupProbe:                    # handles slow cold-start (JVM, etc.)
          httpGet:
            path: /healthz/startup
            port: http
          failureThreshold: 24          # 24 * 5s = 120s max startup time
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /healthz/live
            port: http
          initialDelaySeconds: 0        # startupProbe handles initial delay
          periodSeconds: 10
          failureThreshold: 3
          timeoutSeconds: 3
        readinessProbe:
          httpGet:
            path: /healthz/ready
            port: http
          periodSeconds: 10
          failureThreshold: 3
          successThreshold: 1
          timeoutSeconds: 3
        env:
        - name: LOG_FORMAT
          value: json
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: payment-api-config
              key: log_level
        - name: DB_PASSWORD                    # mounted from Secret as env var only for non-sensitive
          valueFrom:                           # for truly sensitive: mount as file instead
            secretKeyRef:
              name: payment-api-db-secret
              key: password
        volumeMounts:
        - name: tmp
          mountPath: /tmp                      # readOnlyRootFilesystem needs writable /tmp
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sleep", "5"]    # drain iptables before shutdown
      volumes:
      - name: tmp
        emptyDir: {}
```

**2. Decision matrix for key configuration choices:**

| Decision Point | Option | When to Choose | Trade-off |
|---|---|---|---|
| CPU limits | Set to 2x request | Batch jobs, best-effort workloads | Predictable cost; may throttle latency-sensitive paths |
| CPU limits | Omit, use quota only | Latency-sensitive APIs | No throttling; requires namespace quota guardrail |
| Replicas | 2 | Dev/staging or very low traffic | Cost savings; single AZ failure causes degraded capacity |
| Replicas | 3+ | Production with HA requirement | Survives one zone failure at minAvailable:2 |
| Secret delivery | Environment variable | Non-sensitive config (log levels) | Visible in kubectl describe; acceptable for non-secrets |
| Secret delivery | Mounted file | Passwords, tokens, certs | Not visible in pod spec; requires readOnlyRootFilesystem exception for mount path |
| Image tag | semver digest-pinned | Production | Immutable; reproducible; `imagePullPolicy: IfNotPresent` works |
| Image tag | `latest` | Never in production | Non-deterministic; breaks rollback |
| Update strategy | RollingUpdate maxUnavailable:0 | Zero-downtime services | Requires one extra pod slot; slower rollout |
| Update strategy | Recreate | Dev environments, stateful singletons | Fast; causes downtime; not for production |

**3. Checklist for production readiness review:**

```
PRODUCTION READINESS CHECKLIST
================================
Workload & Scheduling
[ ] replicas >= 2 (3+ for HA with zone spread)
[ ] PodDisruptionBudget configured (minAvailable >= floor(replicas/2)+1)
[ ] topologySpreadConstraints or podAntiAffinity across zones
[ ] priorityClassName set for critical workloads

Resources
[ ] requests.cpu and requests.memory set on all containers
[ ] limits.memory set (with 20-50% headroom above request)
[ ] CPU limit decision documented (set or intentionally omitted)
[ ] namespace LimitRange and ResourceQuota exist

Health Probes
[ ] startupProbe configured (if startup > 10s)
[ ] livenessProbe does NOT check external dependencies
[ ] readinessProbe endpoint is distinct from liveness
[ ] terminationGracePeriodSeconds >= max request timeout
[ ] preStop sleep hook present

Security
[ ] dedicated ServiceAccount (not default)
[ ] runAsNonRoot: true
[ ] allowPrivilegeEscalation: false
[ ] readOnlyRootFilesystem: true
[ ] capabilities.drop: ["ALL"]
[ ] NetworkPolicy: default-deny + explicit allow rules
[ ] Secrets not stored in ConfigMap or git

Observability
[ ] Prometheus scrape annotations present
[ ] Consistent labels: app, version, team, component
[ ] LOG_FORMAT=json
[ ] revisionHistoryLimit set (recommend 5)

Validation
[ ] kubeconform passes for target cluster version
[ ] kube-score passes (no critical issues)
[ ] kubectl apply --dry-run=server passes
[ ] Manifest stored in git under version control
```

---

## Rules

1. **Never set identical values for `requests` and `limits` for CPU** (QoS class `Guaranteed` sounds appealing but causes CPU throttling the instant the container tries to use burst capacity, causing latency spikes that are hard to diagnose). Reserve `Guaranteed` QoS intentionally for latency-critical system components only.

2. **Never write a production Deployment without a PodDisruptionBudget.** Cluster upgrades and node maintenance drain nodes one at a time. Without a PDB, Kubernetes is permitted to evict all pods of a Deployment simultaneously, causing complete service outage during routine operations.

3. **Never use `kubectl apply -f` directly to production without a `--dry-run=server` pass first.** Server-side dry-run validates against live admission webhooks and detects issues that local linting cannot catch, including quota violations and OPA policy rejections.

4. **Never store Kubernetes Secrets in a git repository as plaintext YAML**, even in private repositories. Use Sealed Secrets (encrypts with cluster public key), External Secrets Operator (fetches from Vault/AWS SSM at runtime), or Helm Secrets (SOPS-encrypted values files). The cluster should be the source of truth for secret values, not git.

5. **Always set `revisionHistoryLimit`** on Deployments. The default is 10 ReplicaSets. In clusters with many deployments and frequent releases, unset `revisionHistoryLimit` causes etcd bloat from hundreds of orphaned ReplicaSet objects. Set to 5 for most workloads, 10 for critical services where more rollback history is valuable.

6. **Never combine liveness and readiness probe logic.** A container that fails its liveness probe is killed and restarted -- a catastrophic response to a transient database timeout. A container that fails its readiness probe is simply removed from load balancer rotation -- the correct response. Misusing liveness for dependency checks causes cascading restarts that amplify incidents.

7. **Always use `namePrefix` or explicit namespaces in Kustomize bases**, never rely on the default namespace. A `kubectl apply -k overlays/production` run from the wrong context (pointing at a dev cluster) must fail safely, not silently deploy to the wrong namespace.

8. **Never use `hostNetwork: true`, `hostPID: true`, or `privileged: true` without a documented security exception**, a specific use case (CNI plugin DaemonSet, node monitoring agent), and enforcement via OPA/Gatekeeper to prevent accidental drift. These settings bypass namespace-level network isolation entirely.

9. **Always specify `imagePullPolicy: IfNotPresent` for semver-tagged or digest-pinned images in production.** Using `Always` on every pod start adds latency and creates a registry dependency on the pod startup critical path. The correct pattern is immutable image tags (digest-pinned or semver) with `IfNotPresent`.

10. **Never set `minAvailable: 0` or `maxUnavailable: 100%` on a PodDisruptionBudget.** This is equivalent to having no PDB. Validate PDB effectiveness by running `kubectl get pdb -n production` and confirming `ALLOWED DISRUPTIONS` is at least 1 and `MIN AVAILABLE` is greater than zero.

11. **Always apply `seccompProfile.type: RuntimeDefault`** at the pod level for any workload targeting Kubernetes 1.19+. This enables the container runtime's default seccomp filter, blocking ~40 potentially dangerous syscalls with zero application code change and minimal performance overhead.

12. **When using HPA, always set both `minReplicas` and `maxReplicas` explicitly**, and ensure `minReplicas` satisfies the PDB `minAvailable` value. An HPA with `minReplicas: 1` defeats the purpose of a PDB with `minAvailable: 2` because the HPA can scale down to a level where disruption is impossible to permit safely.

---

## Edge Cases

### Stateful Workloads (Databases, Queues, Caches)

StatefulSets require different HA patterns than Deployments. The `serviceName` headless service must exist before the StatefulSet is created. Rolling updates to StatefulSets use `OnDelete` or `RollingUpdate` with `partition` for canary-style upgrades -- set `updateStrategy.rollingUpdate.partition: N` to update only pods with ordinal >= N, allowing manual validation before completing the rollout. PersistentVolumeClaims created by `volumeClaimTemplates` are NOT deleted when the StatefulSet is deleted -- this is intentional data protection. Explicitly manage PVC lifecycle with `kubectl delete pvc` only after confirming data is backed up or migrated. For Redis or similar in-memory stores, calculate `resources.limits.memory` as 110-120% of your expected dataset size plus overhead -- OOMKill on a Redis node causes full cache cold-start which cascades to database load spikes.

### Jobs and CronJobs at Scale

For CronJobs, always set `concurrencyPolicy: Forbid` unless you have explicitly designed for concurrent runs, and always set `successfulJobsHistoryLimit: 3` and `failedJobsHistoryLimit: 5` (default is 3 and 1 respectively in older versions, but always set explicitly). For Jobs that process large datasets, use `completions` + `parallelism` for indexed job patterns rather than spawning many single-task Jobs. Set `backoffLimit` thoughtfully -- the default of 6 with exponential backoff can mean a failing job retries for up to 10 minutes before giving up. Set `activeDeadlineSeconds` on all production Jobs to bound worst-case runtime and prevent zombie jobs consuming cluster resources indefinitely.

### Cluster Version Upgrades and API Deprecations

Before upgrading a cluster from Kubernetes 1.21 to 1.22 or later, audit manifests for removed APIs: `extensions/v1beta1` and `networking.k8s.io/v1beta1` Ingress, `policy/v1beta1` PodSecurityPolicy (removed in 1.25), `batch/v1beta1` CronJob (removed in 1.25), and `autoscaling/v2beta2` HPA (removed in 1.26). Run `pluto detect-files -d k8s/` against the entire manifest directory before initiating any cluster upgrade. Verify using `kubectl convert` to migrate manifests to the current API version. Always test in a staging cluster running the target Kubernetes version for at least one week under production-like load before upgrading production.

### Very Large Pod Counts in a Single Deployment

When a single Deployment exceeds 50 replicas, rolling updates can cause thundering-herd problems: all 50+ new pods start simultaneously, each pulling their configuration from ConfigMaps and Secrets, potentially saturating the API server. Mitigate by setting `maxSurge` as an absolute number (not percentage) capped at 5-10 pods. Consider splitting a 100-replica monolithic Deployment into multiple smaller Deployments behind the same Service for independent update control. At 500+ replicas, evaluate whether the workload should be served by a DaemonSet (one pod per node) to eliminate scheduling overhead.

### Mixed Node Types and Spot/Preemptible Instances

When your cluster uses a mix of on-demand and spot/preemptible nodes, use node labels (`node.kubernetes.io/lifecycle: spot`) combined with `nodeAffinity` and `tolerations` to express scheduling preferences. For stateless API tiers, prefer spot instances with `preferredDuringSchedulingIgnoredDuringExecution` so pods can still schedule on on-demand if no spot capacity is available. For stateful or latency-sensitive critical paths, use `requiredDuringSchedulingIgnoredDuringExecution` with on-demand nodes. Set `terminationGracePeriodSeconds: 30` on spot workloads and ensure your application handles SIGTERM within that window -- spot preemption gives only a 30-second warning before SIGKILL. PodDisruptionBudgets still apply during spot eviction managed by the cluster autoscaler.

### Namespace-Level Resource Exhaustion

When a pod enters `Pending` state, diagnose with: (1) `kubectl describe pod <name>` -- look for `Insufficient cpu`, `Insufficient memory`, or `exceeded quota` events, (2) `kubectl describe resourcequota -n <namespace>` -- check `Used` vs `Hard` for each resource dimension, (3) `kubectl describe nodes` -- check `Allocatable` vs `Requests` at the cluster level. If the issue is namespace quota exhaustion, do not simply raise the quota without understanding what consumed it -- use `kubectl top pods -n <namespace> --sort-by=memory` to identify over-consuming pods. If the issue is cluster-level node pressure, check if the cluster autoscaler is blocked by PDB constraints or node group max size limits.

### Secrets Rotation Without Downtime

When rotating a database password or TLS certificate stored as a Kubernetes Secret, the naive approach (update Secret, restart pods) causes downtime. The zero-downtime pattern is: (1) add the new credential alongside the old one in the Secret as a new key (e.g., `password_v2`), (2) deploy a new application version that reads `password_v2` (or falls back to `password`), (3) verify the new version is healthy, (4) remove the old key from the Secret, (5) remove the fallback logic in the next deployment cycle. For TLS certificates, mount the entire cert directory as a Secret volume -- when the Secret is updated, Kubernetes propagates the new files to the mounted volume within 60-90 seconds (kubelet sync period) without a pod restart, allowing the application to reload the certificate from disk.

---

## Example

**Input:** "I have a Python FastAPI service that needs to run in production Kubernetes. It handles payment webhooks, takes about 8 seconds to start (loading ML model on startup), processes ~200 req/s at peak, needs a PostgreSQL password, and must have zero downtime during deployments. We're on Kubernetes 1.28, using 3 availability zones. What's the full configuration?"

**Output:**

Here is the complete production configuration for this FastAPI payment webhook service. Each section addresses a specific requirement.

---

### Namespace Setup

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: v1.28
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/audit: restricted
    team: payments
```

```yaml
# resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: payments-quota
  namespace: payments
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 8Gi
    limits.memory: 16Gi
    count/pods: "50"
    count/services: "20"
    count/persistentvolumeclaims: "10"
```

```yaml
# limit-range.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: payments-limits
  namespace: payments
spec:
  limits:
  - type: Container
    default:
      memory: 256Mi
    defaultRequest:
      cpu: 100m
      memory: 128Mi
    max:
      memory: 4Gi
```

---

### ServiceAccount and RBAC

This service reads from PostgreSQL and calls an internal fraud detection API. It does not need any Kubernetes API access, so the ServiceAccount has no RoleBindings.

```yaml
# serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: webhook-api-sa
  namespace: payments
  annotations:
    # If using IRSA (AWS EKS) to access Secrets Manager:
    # eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/webhook-api-role
automountServiceAccountToken: false  # no Kubernetes API access needed
```

---

### ConfigMap and Secret

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: webhook-api-config
  namespace: payments
data:
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  PORT: "8080"
  WORKERS: "4"           # uvicorn workers = 2*CPU_cores+1, here 200m*4 pods = ~1 core per pod
  DB_HOST: "postgres-service.data.svc.cluster.local"
  DB_PORT: "5432"
  DB_NAME: "payments"
  MODEL_PATH: "/models/fraud_v3.pkl"
```

```yaml
# secret.yaml
# DO NOT COMMIT THIS FILE -- managed by Sealed Secrets or External Secrets Operator
# This is shown for structure only; in practice use:
# kubectl create secret generic webhook-api-db-secret --from-literal=password=<value>
apiVersion: v1
kind: Secret
metadata:
  name: webhook-api-db-secret
  namespace: payments
type: Opaque
# data values are base64-encoded; actual secret values managed by External Secrets Operator
```

---

### Core Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webhook-api
  namespace: payments
  labels:
    app: webhook-api
    version: "2.1.0"
    team: payments
    component: api
  annotations:
    kubernetes.io/change-cause: "v2.1.0 -- upgraded fraud model to v3"
spec:
  replicas: 3                          # 3 replicas across 3 zones: survives 1 zone failure
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      app: webhook-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0                # zero-downtime requirement: never reduce capacity
      maxSurge: 1                      # one extra pod during rollout (4 pods briefly)
  template:
    metadata:
      labels:
        app: webhook-api
        version: "2.1.0"
        team: payments
        component: api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: webhook-api-sa
      automountServiceAccountToken: false
      terminationGracePeriodSeconds: 60    # 60s > max request timeout (30s) + preStop (5s)
      
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 3000
        fsGroup: 2000
        seccompProfile:
          type: RuntimeDefault
      
      # Spread evenly across all 3 AZs -- hard requirement for zone failure tolerance
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: webhook-api
      # Also spread across nodes within a zone to prevent same-node colocation
      - maxSkew: 1
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: ScheduleAnyway   # prefer, don't require -- allows scheduling if few nodes
        labelSelector:
          matchLabels:
            app: webhook-api
      
      # Ensure ML model file is available before pod starts
      initContainers:
      - name: model-downloader
        image: registry.company.com/model-sync:1.2.0
        command: ["/bin/sh", "-c", "cp /source/fraud_v3.pkl /models/fraud_v3.pkl"]
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            memory: 128Mi
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
        volumeMounts:
        - name: model-volume
          mountPath: /models
        - name: model-source
          mountPath: /source
          readOnly: true
      
      containers:
      - name: webhook-api
        image: registry.company.com/webhook-api:2.1.0
        imagePullPolicy: IfNotPresent       # semver tag, deterministic
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        
        resources:
          requests:
            cpu: 250m                       # empirically measured: ~200m at 200 req/s
            memory: 512Mi                   # FastAPI + uvicorn + ML model in memory
          limits:
            # CPU limit intentionally omitted: webhook processing is latency-sensitive
            # Total CPU bounded by namespace ResourceQuota (8 cores for namespace)
            memory: 768Mi                   # 50% headroom for request-time allocations
        
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
        
        # startupProbe: 8s startup * 1.5 safety = 12s, use 24 * 1s = 24s max
        startupProbe:
          httpGet:
            path: /healthz/startup          # returns 200 only after model is loaded
            port: http
          failureThreshold: 30              # 30 * 1s = 30s max startup time (buffer above 8s)
          periodSeconds: 1                  # check frequently to minimize startup latency
          timeoutSeconds: 2
        
        livenessProbe:
          httpGet:
            path: /healthz/live             # checks: uvicorn running, no deadlock
            port: http
          periodSeconds: 15                 # don't over-poll the liveness endpoint
          failureThreshold: 3
          timeoutSeconds: 3
          # NO initialDelaySeconds -- startupProbe handles the initial delay
        
        readinessProbe:
          httpGet:
            path: /healthz/ready            # checks: DB connection pool healthy, model loaded
            port: http
          periodSeconds: 10
          failureThreshold: 3
          successThreshold: 1
          timeoutSeconds: 3
        
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sleep", "5"]  # wait for iptables to drain before shutdown begins
        
        envFrom:
        - configMapRef:
            name: webhook-api-config
        
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: webhook-api-db-secret
              key: password
        - name: POD_NAME                    # useful for structured log correlation
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        
        volumeMounts:
        - name: tmp
          mountPath: /tmp                   # uvicorn needs writable /tmp for unix sockets
        - name: model-volume
          mountPath: /models
          readOnly: true                    # model is read-only after init container writes it
      
      volumes:
      - name: tmp
        emptyDir: {}
      - name: model-volume
        emptyDir: {}                        # shared between initContainer and main container
      - name: model-source
        configMap:                          # or use an NFS/S3 CSI driver for large models
          name: model-source-config
```

---

### Pod Disruption Budget

```yaml
# pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: webhook-api-pdb
  namespace: payments
spec:
  # 3 replicas, minAvailable 2: at most 1 pod evicted at a time during node drain
  # This allows rolling cluster upgrades while maintaining production capacity
  minAvailable: 2
  selector:
    matchLabels:
      app: webhook-api
```

---

### Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webhook-api-hpa
  namespace: payments
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webhook-api
  minReplicas: 3       # matches PDB minAvailable + 1, never scale below zone-spread minimum
  maxReplicas: 12      # 12 * 250m = 3 cores, well within quota of 8 cores for requests
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60   # scale up before hitting 100%; leave headroom for spikes
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue
        averageValue: 600Mi      # scale out before hitting 768Mi limit
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300   # wait 5 minutes before scaling down -- avoids flapping
      policies:
      - type: Pods
        value: 1
        periodSeconds: 60              # scale down max 1 pod per minute
    scaleUp:
      stabilizationWindowSeconds: 30   # react quickly to traffic spikes
      policies:
      - type: Pods
        value: 3
        periodSeconds: 60              # scale up max 3 pods per minute
```

---

### Service and NetworkPolicy

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: webhook-api-service
  namespace: payments
  labels:
    app: webhook-api
spec:
  selector:
    app: webhook-api
  ports:
  - name: http
    port: 80
    targetPort: http
    protocol: TCP
  type: ClusterIP                        # expose via Ingress, not directly as LoadBalancer
```

```yaml
# networkpolicy.yaml
# Default deny all traffic in payments namespace, then allow-list
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: payments
spec:
  podSelector: {}
  policyTypes: ["Ingress", "Egress"]

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: webhook-api-allow
  namespace: payments
spec:
  podSelector:
    matchLabels:
      app: webhook-api
  policyTypes: ["Ingress", "Egress"]
  ingress:
  # Only allow traffic from the ingress controller namespace
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  # Allow DNS resolution
  - ports:
    - port: 53
      protocol: UDP
    - port: 53
      protocol: TCP
  # Allow PostgreSQL in the data namespace
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: data
    ports:
    - protocol: TCP
      port: 5432
  # Allow calling internal fraud-detection API
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: fraud
      podSelector:
        matchLabels:
          app: fraud-detection-api
    ports:
    - protocol: TCP
      port: 8080
```

---

### Key Configuration Decisions Summary

| Requirement | Solution | Rationale |
|---|---|---|
| 8-second startup | `startupProbe` failureThreshold:30 periodSeconds:1 | Gives 30s headroom; disables after first success; avoids false liveness kills |
| Zero downtime deploys | maxUnavailable:0 + maxSurge:1 + PDB minAvailable:2 | Zero capacity reduction during rollout; node drain blocked until safe |
| 3 AZ spread | topologySpreadConstraints zone + hostname | Zone failure loses 1 of 3 pods; PDB ensures min 2 remain during voluntary disruption |
| ML model loading | initContainer copies model to
