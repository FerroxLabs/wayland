---
name: kubernetes-workload-design
description: |
  Guides expert-level kubernetes workload design implementation: cloud and architecture decision frameworks, production-ready patterns, and concrete templates for kubernetes workload design workflows.
  Use when the user asks about kubernetes workload design, kubernetes workload design configuration, or devops best practices for kubernetes projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud architecture"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Kubernetes Workload Design

## When to Use

**Use this skill when:**
- A user is selecting the correct Kubernetes workload type (Deployment, StatefulSet, DaemonSet, Job, CronJob) for a new or existing application component
- A user needs production-ready YAML for a service and is unsure how to configure resource requests/limits, liveness/readiness probes, pod disruption budgets, or affinity rules
- A user is experiencing pod evictions, OOMKills, or scheduling failures and needs to redesign their workload spec to fix root causes
- A user wants to migrate a stateful application (database, message broker, cache cluster) onto Kubernetes and needs guidance on StatefulSet design, PVC configuration, and headless services
- A user is designing a batch processing or data pipeline workload and needs to choose between Jobs, CronJobs, and controller-managed pod patterns
- A user is building a multi-tenant platform on Kubernetes and needs namespace isolation, resource quotas, and LimitRange design
- A user needs to design horizontally scalable workloads with HorizontalPodAutoscaler (HPA) or vertically scalable workloads with VerticalPodAutoscaler (VPA), including custom metrics integration

**Do NOT use this skill when:**
- The user needs cluster infrastructure design (node pools, control plane HA, etcd tuning) -- that falls under cluster architecture skills
- The user needs Kubernetes networking design (CNI selection, NetworkPolicy authoring, Service Mesh configuration) -- use the kubernetes-networking skill
- The user needs CI/CD pipeline design for delivering to Kubernetes -- use the kubernetes-delivery or gitops skill
- The user needs Kubernetes RBAC policy design in depth -- use the kubernetes-security skill
- The user is asking about Helm chart authoring or Kustomize overlay structure -- use the kubernetes-packaging skill
- The user needs cloud-provider-specific node or managed service configuration (EKS managed node groups, GKE Autopilot, AKS virtual nodes) -- use the cloud-provider-kubernetes skill
- The user is asking about general Docker image building or Dockerfile optimization -- use the container-image-design skill

---

## Process

### Step 1: Classify the workload type

Before writing any YAML, determine the correct API kind. Getting this wrong requires a full replacement (not a rolling update), causing downtime.

- **Deployment** -- use for stateless, horizontally scalable services where any pod can serve any request. Examples: REST APIs, frontend servers, worker processes that pull from a queue. Supports rolling updates natively. This covers 70-80% of workloads.
- **StatefulSet** -- use when pods need stable network identity (pod-0, pod-1), stable persistent storage tied to a specific pod, or ordered startup/shutdown. Examples: PostgreSQL, Kafka, Elasticsearch, Redis Cluster. Never use a Deployment with a PVC for a clustered database.
- **DaemonSet** -- use when exactly one pod must run on every node (or a subset of nodes). Examples: log shippers (Fluent Bit), node exporters (Prometheus node-exporter), network agents (Calico, Cilium). Do not use for application workloads.
- **Job** -- use for finite, one-shot tasks that must run to completion. Examples: database migrations, report generation, data import. Set `restartPolicy: OnFailure` and configure `backoffLimit` (default 6 -- reduce to 3 for fast-fail behavior). Set `ttlSecondsAfterFinished: 300` to auto-clean completed Jobs.
- **CronJob** -- use for periodic Jobs. Be aware that CronJob schedules run in the timezone of the kube-controller-manager; use `timeZone` field (Kubernetes 1.27+) to set an explicit timezone. Set `concurrencyPolicy: Forbid` for jobs that must not overlap; set `startingDeadlineSeconds: 60` to skip missed runs rather than running a cascade.
- **ReplicaSet** -- do not use directly; always manage through a Deployment.

Decision test: Ask "if I delete this pod, does the application care which pod replaced it?" If yes -- StatefulSet. If no -- Deployment.

### Step 2: Define resource requests and limits

Resource misconfiguration is the number one cause of production instability on Kubernetes. Every container must have requests and limits defined.

- **Requests** determine scheduling. The scheduler only places a pod on a node where `allocatable - sum(requests) >= container request`. If requests are too low, pods schedule onto crowded nodes and get evicted under pressure.
- **Limits** determine enforcement. CPU limits throttle (not kill). Memory limits kill via OOMKill. Setting CPU limits too low causes latency spikes from throttling -- consider omitting CPU limits for latency-sensitive workloads and relying on namespace LimitRange defaults.
- **Golden ratio**: Set memory limit at 2x the memory request for most workloads. For JVM services (Java, Kotlin, Scala), set memory limit at 1.25x the heap max (-Xmx) plus 512Mi for off-heap overhead.
- **Starting benchmarks for sizing**: A typical Node.js API pod: `requests: {cpu: "100m", memory: "128Mi"}`, `limits: {cpu: "500m", memory: "256Mi"}`. A Java Spring Boot pod: `requests: {cpu: "250m", memory: "512Mi"}`, `limits: {cpu: "1000m", memory: "1Gi"}`.
- Never set CPU request below 10m -- the kernel scheduler granularity makes this meaningless.
- Enable VPA in recommendation mode first (not enforcement) to gather real usage data before setting final values.
- Use `resources.requests` to define QoS class: if requests == limits on all containers, the pod gets `Guaranteed` QoS -- it will never be evicted before `Burstable` or `BestEffort` pods.

### Step 3: Design health probes

Probes are the mechanism Kubernetes uses to route traffic and restart failed containers. Misconfigured probes cause more incidents than almost any other workload design error.

- **livenessProbe** -- signals that the container is alive and does not need to be restarted. Use conservatively. If the liveness probe trips during a slow startup or GC pause, Kubernetes restarts the pod, potentially causing a cascade. Set `initialDelaySeconds` long enough for the slowest observed startup (add 50% buffer). Typical: `initialDelaySeconds: 30`, `periodSeconds: 10`, `failureThreshold: 3`.
- **readinessProbe** -- signals that the container is ready to receive traffic. This is the most important probe. A failing readiness probe removes the pod endpoint from all Services and Ingress backends without restarting the pod. Use for dependency checks (database connection, cache warmup). Set `periodSeconds: 5`, `failureThreshold: 3` (15 seconds to detect unhealthy).
- **startupProbe** -- introduced in Kubernetes 1.18, prevents liveness probe from killing a slow-starting container. Set `failureThreshold: 30`, `periodSeconds: 10` to give a container up to 300 seconds to start. Once startupProbe succeeds, liveness takes over. Always use startupProbe for JVM or Python applications.
- **Probe implementation**: Prefer `httpGet` over `exec` for HTTP services -- exec probes fork a shell process, which is expensive under load. Use `tcpSocket` only as a last resort (it proves the port is open, not that the application is healthy).
- Never make a liveness probe check external dependencies (database, downstream APIs). If the database is down, all pods will restart simultaneously -- a thundering herd. Liveness should only check internal application health (deadlock detection, memory exhaustion).
- The readiness probe endpoint should check real dependency health (can it query the database, can it reach the cache).

### Step 4: Configure pod disruption budgets and availability guarantees

A pod disruption budget (PDB) is the primary mechanism to guarantee availability during voluntary disruptions (node drains, cluster upgrades). Without PDBs, a rolling node drain can take all pods of a Deployment offline simultaneously.

- For any production Deployment with 2+ replicas, create a PDB with `minAvailable: 1` at minimum. For critical services, use `maxUnavailable: 0` (zero disruption) or `minAvailable: "80%"`.
- PDBs only protect against *voluntary* disruptions (evictions via `kubectl drain`, Cluster Autoscaler scale-down). They do not protect against node hardware failures.
- Set `spec.strategy.rollingUpdate.maxUnavailable: 0` and `maxSurge: 1` on Deployments for zero-downtime rolling updates. This means during an update, Kubernetes creates a new pod before terminating an old one -- requiring enough capacity headroom.
- Set `terminationGracePeriodSeconds` to match your application's shutdown time. Default is 30 seconds. For services that process long-running requests (streaming, batch), set this to 60-120 seconds and implement graceful shutdown (catch SIGTERM, stop accepting new connections, drain in-flight work, exit).
- For StatefulSets, `spec.podManagementPolicy: Parallel` enables faster scaling at the cost of ordered startup -- only use for stateless-like stateful sets (e.g., read replicas). Use the default `OrderedReady` for clustered databases.

### Step 5: Design scheduling controls

Without scheduling controls, Kubernetes places pods wherever capacity exists, which causes availability failures, noisy neighbor problems, and uneven resource utilization.

- **Pod anti-affinity** -- spread replicas across failure domains. Use `requiredDuringSchedulingIgnoredDuringExecution` (hard) for critical services that must never co-locate on the same node. Use `preferredDuringSchedulingIgnoredDuringExecution` (soft) for non-critical services to allow scheduling even if anti-affinity cannot be fully satisfied. Never use hard anti-affinity for a service where `replicas > node count` -- pods will be pending forever.
- **Topology spread constraints** (preferred over anti-affinity for >= Kubernetes 1.19): Use `topologySpreadConstraints` with `maxSkew: 1` and `topologyKey: topology.kubernetes.io/zone` to spread pods evenly across availability zones. Set `whenUnsatisfiable: DoNotSchedule` for critical services, `ScheduleAnyway` for flexible ones.
- **Node affinity and taints/tolerations**: Use node affinity to target specific node pools (e.g., GPU nodes, high-memory nodes). Use taints/tolerations to dedicate nodes to specific workload classes. A common pattern: taint GPU nodes with `dedicated=gpu:NoSchedule` and add the matching toleration only to GPU workloads.
- **Priority classes**: Create a `PriorityClass` for production workloads (value: 1000) and a lower class for batch/background (value: 100). Kubernetes will preempt lower-priority pods to schedule higher-priority ones during resource pressure.
- **Pod topology awareness for Services**: Set `service.spec.internalTrafficPolicy: Local` to route service traffic only to pods on the same node -- reduces cross-zone egress costs but requires pods to be present on every node that runs clients.

### Step 6: Design storage for stateful workloads

Storage is the hardest part of Kubernetes workload design. Most production incidents involving StatefulSets are storage-related.

- **StorageClass selection**: Use the `WaitForFirstConsumer` volume binding mode to defer PVC binding until a pod is scheduled. This prevents a PVC from being bound to a zone where the pod cannot schedule. Always use this mode for zonal storage (AWS EBS, GCE PD).
- **PVC sizing**: Kubernetes cannot shrink PVCs (most CSI drivers). Provision 2x the expected initial data size and enable volume expansion (`allowVolumeExpansion: true` on the StorageClass). For StatefulSets, the `volumeClaimTemplates` field creates one PVC per pod -- deleting the StatefulSet does NOT delete PVCs (intentional, to protect data).
- **Access modes**: `ReadWriteOnce` (RWO) is supported by nearly all CSI drivers and is the correct mode for databases. `ReadWriteMany` (RWX) requires specialized storage (NFS, CephFS, AWS EFS) -- never assume your cloud block storage supports RWX.
- **Init containers for data initialization**: Use an init container to copy seed data or run schema migrations before the main container starts. The init container shares the same volume mount.
- **Backup strategy**: Do not rely on PVC snapshots alone. Implement application-consistent backups (e.g., `pg_dump` for PostgreSQL, Velero for cluster-level backups). Schedule backups via CronJob with the backup tool running as a sidecar or standalone pod.

### Step 7: Configure autoscaling

Autoscaling in Kubernetes has three dimensions. Understand all three before configuring any of them.

- **Horizontal Pod Autoscaler (HPA)**: Scales the number of pod replicas based on metrics. The default metric is CPU utilization relative to requests. Set `targetCPUUtilizationPercentage: 70` for CPU-bound services. For I/O-bound or queue-processing services, use custom metrics via the Prometheus Adapter or KEDA (Kubernetes Event-Driven Autoscaler). Always set `minReplicas: 2` for production (never 1 -- a single pod cannot be disrupted safely). Set `behavior.scaleDown.stabilizationWindowSeconds: 300` to prevent aggressive scale-down that causes cold-start latency spikes.
- **Vertical Pod Autoscaler (VPA)**: Adjusts CPU/memory requests based on observed usage. Do NOT run VPA in `Auto` mode alongside HPA CPU scaling -- they conflict, causing oscillation. Use VPA in `Off` mode for recommendations, or pair VPA with HPA only if HPA uses custom metrics (not CPU). VPA requires pod restarts to apply new resource values.
- **Cluster Autoscaler / Karpenter**: Provisions new nodes when pods are pending due to insufficient capacity. Design your node pool sizes so that one Cluster Autoscaler node can accommodate the largest single pod you run, plus overhead. Karpenter (AWS-native, increasingly used on other clouds) is faster and more cost-efficient than Cluster Autoscaler -- it provisions exact-fit instances rather than pre-defined node groups.
- Set HPA `scaleUp.policies` with a reasonable rate limit: `periodSeconds: 60, value: 4` means at most 4 new pods per minute. This prevents a sudden traffic spike from provisioning dozens of pods simultaneously.

---

## Output Format

When producing a workload design, deliver the following structured artifacts:

### Workload Classification Summary

```
Workload Name:       [service-name]
API Kind:            [Deployment | StatefulSet | DaemonSet | Job | CronJob]
Rationale:          [one sentence justification]
Replica Count:       [number] (min: [HPA min] / max: [HPA max])
QoS Class:          [Guaranteed | Burstable | BestEffort]
Storage Required:    [Yes/No -- type and size if yes]
```

### Primary Workload YAML

```yaml
# deployment.yaml -- production-ready Deployment for [service-name]
# QoS: Burstable | Replicas: 3 initial | HPA: 2-10
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [service-name]
  namespace: [namespace]
  labels:
    app.kubernetes.io/name: [service-name]
    app.kubernetes.io/component: [api | worker | frontend]
    app.kubernetes.io/part-of: [platform-name]
    app.kubernetes.io/version: "1.0.0"
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: [service-name]
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0    # zero-downtime: never remove old pod before new one is ready
      maxSurge: 1          # allow one extra pod during rollout
  template:
    metadata:
      labels:
        app.kubernetes.io/name: [service-name]
        app.kubernetes.io/version: "1.0.0"
    spec:
      serviceAccountName: [service-name]  # never use default SA
      terminationGracePeriodSeconds: 60   # match application drain time
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
              app.kubernetes.io/name: [service-name]
      containers:
        - name: [service-name]
          image: [registry]/[service-name]:[tag]
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          resources:
            requests:
              cpu: "100m"      # sizing: adjust based on VPA recommendation after 7 days
              memory: "128Mi"
            limits:
              # cpu limit intentionally omitted to avoid throttling latency
              memory: "256Mi"  # 2x request -- adjust for observed p99 usage
          startupProbe:
            httpGet:
              path: /healthz
              port: http
            failureThreshold: 30   # allows up to 300s for startup
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /readyz        # checks DB connection, cache connectivity
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 3    # 15s to detect unhealthy
            successThreshold: 1
          livenessProbe:
            httpGet:
              path: /healthz       # internal-only check, no external deps
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3
            successThreshold: 1
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          envFrom:
            - configMapRef:
                name: [service-name]-config
            - secretRef:
                name: [service-name]-secrets  # secrets managed externally (ESO, Vault)
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          volumeMounts:
            - name: tmp
              mountPath: /tmp               # writable temp dir for read-only root fs
      volumes:
        - name: tmp
          emptyDir: {}
```

### Supporting Resources YAML

```yaml
---
# pdb.yaml -- Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: [service-name]-pdb
  namespace: [namespace]
spec:
  minAvailable: 1   # for 3 replicas: ensures 2 pods always available during drain
  selector:
    matchLabels:
      app.kubernetes.io/name: [service-name]
---
# hpa.yaml -- Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: [service-name]-hpa
  namespace: [namespace]
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: [service-name]
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0      # scale up immediately on demand
      policies:
        - type: Pods
          value: 4
          periodSeconds: 60              # max 4 new pods per minute
    scaleDown:
      stabilizationWindowSeconds: 300    # wait 5 min before scaling down
      policies:
        - type: Percent
          value: 25
          periodSeconds: 60             # remove at most 25% of pods per minute
```

### Decision Matrix

| Factor | Deployment | StatefulSet | DaemonSet | Job/CronJob |
|--------|-----------|-------------|-----------|-------------|
| Pod identity matters | No | Yes | N/A | No |
| Persistent per-pod storage | No | Yes | Optional | No |
| Ordered startup required | No | Yes | No | No |
| Runs on every node | No | No | Yes | No |
| Runs to completion | No | No | No | Yes |
| Supports HPA | Yes | Limited | No | No |
| Rolling updates | Yes | Yes (ordered) | Yes | No |

### Operational Checklist

```
[ ] Resource requests and limits set on all containers
[ ] startupProbe configured (especially for JVM/Python services)
[ ] readinessProbe checks real dependency health
[ ] livenessProbe does NOT check external dependencies
[ ] PodDisruptionBudget created
[ ] terminationGracePeriodSeconds >= application drain time
[ ] topologySpreadConstraints configured for multi-AZ
[ ] ServiceAccount created (not using default)
[ ] readOnlyRootFilesystem: true with emptyDir for /tmp
[ ] runAsNonRoot: true
[ ] Image tag is not "latest"
[ ] HPA minReplicas >= 2
[ ] PriorityClass assigned
```

---

## Rules

1. **Never use the `default` ServiceAccount for application pods.** The default ServiceAccount in most clusters has auto-mounted credentials that grant broader API access than intended. Create a dedicated ServiceAccount per workload and set `automountServiceAccountToken: false` unless the pod explicitly needs API server access.

2. **Never use `latest` as an image tag in production manifests.** The `latest` tag is mutable -- a redeployment with the same manifest can silently pull a different image. Always pin to a digest (`image@sha256:...`) or an immutable tag (git SHA or build number). This is non-negotiable for production.

3. **Never set memory requests and limits to the same value unless you explicitly need Guaranteed QoS.** Setting request == limit creates a Guaranteed QoS pod but also means any memory usage over the request triggers an OOMKill. Leave headroom between request and limit unless the workload is latency-critical and you have profiling data to justify exact sizing.

4. **Never make a liveness probe check external dependencies.** If a database goes down and the liveness probe fails, Kubernetes restarts all pods simultaneously, amplifying the outage. Liveness probes must only check internal application state.

5. **Never configure a StatefulSet without a headless Service (`clusterIP: None`).** StatefulSets require a governing headless Service to create stable DNS entries (`pod-0.service.namespace.svc.cluster.local`). Without it, peer discovery for clustered databases and message brokers will not work correctly.

6. **Always set `terminationGracePeriodSeconds` greater than or equal to your application's observed shutdown time.** If the grace period expires before the app finishes draining, the kubelet sends SIGKILL, immediately terminating in-flight requests. Measure your actual shutdown time under load and add 20% buffer.

7. **Never run a single replica in production for any user-facing service.** A single replica cannot safely tolerate a node drain (voluntary disruption) because the PDB `minAvailable: 1` would block the drain entirely, or if no PDB exists, the pod is simply evicted. Always deploy a minimum of 2 replicas and configure a PDB.

8. **Always use `autoscaling/v2` HPA API, not `autoscaling/v1`.** The v1 API only supports CPU-based scaling and is deprecated. The v2 API supports memory, custom metrics (via Prometheus Adapter), and external metrics (via KEDA). Kubernetes 1.23+ defaults to v2.

9. **Never mix VPA (in Auto mode) and HPA (on CPU metric) on the same Deployment.** VPA in Auto mode will continuously adjust resource requests, which changes the denominator for CPU utilization percentage, causing HPA to oscillate. Use VPA for recommendations only, or use HPA with custom metrics (request rate, queue depth) instead of CPU when VPA Auto mode is needed.

10. **Always label pods with the standard Kubernetes recommended labels (`app.kubernetes.io/*`).** Ad-hoc label schemas break tooling, dashboards, and service meshes that rely on label conventions. At minimum: `app.kubernetes.io/name`, `app.kubernetes.io/version`, `app.kubernetes.io/component`, `app.kubernetes.io/part-of`. This is required for PDB label selectors to work predictably and for cost attribution in multi-tenant clusters.

---

## Edge Cases

### 1. JVM-based services with heap sizing and OOMKill loops

JVM services (Java, Kotlin, Scala) are the most commonly misconfigured workloads because the JVM manages its own heap and the container memory limit operates at the cgroup level. If `-Xmx` is not set, the JVM defaults to 25% of detected memory, which in a container is the node's total RAM -- far exceeding the limit.

**Handling**: Always set explicit JVM flags: `-Xms256m -Xmx512m -XX:MaxMetaspaceSize=256m -XX:+UseContainerSupport`. The `+UseContainerSupport` flag (enabled by default in JDK 11+) makes the JVM respect cgroup limits. Set the container memory limit to `Xmx + Metaspace + 512Mi` for off-heap overhead (native memory, thread stacks, JIT compiled code). For a 512Mi heap, set limit to `512Mi + 256Mi + 512Mi = 1280Mi`. Use startupProbe with `failureThreshold: 30, periodSeconds: 10` to allow up to 5 minutes for JIT warmup.

### 2. Migrations and schema changes with StatefulSets

Running database schema migrations before application startup is a common requirement that creates ordering challenges in Kubernetes.

**Handling**: Use a Kubernetes `Job` (not an init container in the StatefulSet) to run migrations. The Job runs `flyway migrate` or `alembic upgrade head` and exits. The application Deployment depends on the Job completing -- implement this ordering via an init container in the Deployment that waits for a migration-complete ConfigMap or the Job's completion status. In CI/CD pipelines, sequence the Job apply before the Deployment apply with a `kubectl wait --for=condition=complete job/migrate --timeout=300s` check. Never run migrations as part of application startup code in a multi-replica Deployment -- concurrent migrations from multiple pods will cause lock contention or duplicate migrations.

### 3. Stateful workloads with zone-pinned storage

Cloud block storage (AWS EBS, GCE PD, Azure Disk) is zonal -- a PVC created in zone us-east-1a cannot be attached to a pod in us-east-1b. StatefulSet pods with PVCs can become permanently unschedulable after a zone failure.

**Handling**: Use `WaitForFirstConsumer` volume binding mode on the StorageClass to defer PVC creation until pod scheduling. For truly zone-resilient StatefulSets, configure a storage solution that supports cross-zone replication (Amazon EFS, GCP Filestore, Portworx, or Rook-Ceph). For database StatefulSets, design the application layer for active-passive failover across zones (PostgreSQL with Patroni, MySQL with Orchestrator) rather than assuming Kubernetes can transparently move stateful pods across zones. Document in the runbook which zone each StatefulSet pod is pinned to.

### 4. Burst traffic with slow scaling

HPA has a polling interval of 15 seconds by default and the Cluster Autoscaler takes 1-3 minutes to provision a new node. A sudden 10x traffic spike will cause request failures for 2-5 minutes before autoscaling catches up.

**Handling**: Set `minReplicas` higher than the baseline steady-state needs to maintain a warm buffer -- typically target 50-60% average CPU utilization at steady state rather than 80-90%. For services with predictable traffic spikes (scheduled promotions, market open), use KEDA's `CronScaler` trigger to pre-scale before the spike. Implement application-level circuit breakers and retry with exponential backoff so clients survive the 30-60 second window before scaling completes. Set HPA `scaleUp.stabilizationWindowSeconds: 0` to allow immediate upward scaling without any delay.

### 5. Privileged workloads that cannot run with restricted security contexts

Some workloads (log agents, network tools, storage provisioners) require elevated privileges. Applying `readOnlyRootFilesystem: true` or `runAsNonRoot: true` will break them.

**Handling**: Use Kubernetes Pod Security Admission (PSA) with the `privileged` policy namespace label only for infrastructure namespaces. Keep application namespaces under `restricted` or `baseline` policy. For specific containers that need elevated privileges (e.g., a log shipper sidecar that needs to read `/var/log`), place them in the DaemonSet on a dedicated infrastructure namespace rather than as sidecars in application pods. When a DaemonSet truly needs host path access, add explicit audit logging and document the business justification. Never relax security contexts across an entire cluster to accommodate one workload.

### 6. Long-running Jobs that must survive node preemption

Spot/preemptible instances can be reclaimed with 2-minute notice. A 4-hour batch Job running on a spot node will be lost mid-execution.

**Handling**: Set `spec.backoffLimit: 3` and implement checkpointing in the Job's application code -- write progress to a PVC or external storage at regular intervals (every 5 minutes or every N records processed). On restart, the application reads the checkpoint and resumes. Use `spec.completionMode: Indexed` for parallel Jobs so each pod processes a partition of work. Set a PriorityClass of `low` for batch Jobs so they are the first candidates for preemption when node capacity is needed for higher-priority workloads. Use node affinity to schedule batch Jobs on spot node pools and critical services on on-demand pools.

### 7. Canary and blue-green deployments within a single namespace

Kubernetes Deployment rolling updates do not natively support traffic splitting by percentage. A naive `replicas: 9 (v1) + 1 (v2)` approach gives roughly 10% traffic to v2, but this requires running 10 total pods permanently.

**Handling**: Use a Service Mesh (Istio VirtualService, Linkerd TrafficSplit) for percentage-based traffic splitting without requiring proportional replica counts. If a service mesh is unavailable, use two Deployments (`service-v1` and `service-v2`) with a single Service selector on a shared label (`app: service`), and vary the `replicas` ratio between them (9:1, 5:5, 0:10). Use Flagger for automated canary promotion based on Prometheus metrics (error rate < 1%, p99 latency < 500ms). Never delete the old Deployment before the new Deployment is confirmed healthy under production traffic.

### 8. Workloads requiring GPU resources

GPU scheduling in Kubernetes requires device plugin configuration and careful resource management because GPUs cannot be fractionally allocated by default.

**Handling**: Request GPUs with `resources.limits: nvidia.com/gpu: "1"` -- note that GPU resources must be specified in limits, not requests (they are always equal). Use node affinity to target GPU node pools. For workloads that need less than a full GPU (inference workloads), use NVIDIA's time-slicing feature (configured in the device plugin ConfigMap) to share one physical GPU among multiple pods. Set `runtimeClassName: nvidia` on the pod spec to use the NVIDIA container runtime. Never schedule GPU workloads without a dedicated namespace and PriorityClass -- GPU nodes are expensive and should not be wasted by misconfigured lower-priority workloads preempting capacity.

---

## Example

**Input:** "We have a Python FastAPI service that serves a recommendation engine. It reads from PostgreSQL and Redis, starts slowly (about 45 seconds due to model loading), handles ~500 req/s at peak, and our team got burned last month when a rolling deployment caused 30 seconds of 503 errors. We're running on Kubernetes 1.28 on AWS EKS. How should we design the workload?"

---

**Output:**

**Workload Classification Summary:**
```
Workload Name:       recommendation-api
API Kind:            Deployment
Rationale:          Stateless -- any pod can serve any request; no per-pod storage
                    identity needed
Replica Count:       4 baseline (min: 3 / max: 12 via HPA)
QoS Class:          Burstable (memory limits set, CPU limits omitted)
Storage Required:    No (model loaded from S3 at startup via init container)
```

**Root Cause of the 503 Errors -- and Fix:**

The 503s during rolling deployment were caused by one or both of:
1. The new pod receiving traffic before the model finished loading (readiness probe was missing or checked only the port, not model-ready state)
2. The old pod being terminated before it finished draining in-flight requests

The fix requires: a startupProbe that accounts for the 45-second startup, a readinessProbe that checks the `/readyz` endpoint (which returns 200 only after model load completes), and `terminationGracePeriodSeconds: 75` to allow in-flight requests to complete.

**recommendation-api deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: recommendation-api
  namespace: ml-serving
  labels:
    app.kubernetes.io/name: recommendation-api
    app.kubernetes.io/component: api
    app.kubernetes.io/part-of: recommendation-platform
    app.kubernetes.io/version: "2.4.1"
spec:
  replicas: 4
  selector:
    matchLabels:
      app.kubernetes.io/name: recommendation-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0   # NEVER remove a pod until the replacement is fully ready
      maxSurge: 1         # run 5 pods briefly during rollout -- ensure capacity headroom
  template:
    metadata:
      labels:
        app.kubernetes.io/name: recommendation-api
        app.kubernetes.io/version: "2.4.1"
    spec:
      serviceAccountName: recommendation-api
      # 75s grace: 60s for in-flight request drain + 15s buffer
      terminationGracePeriodSeconds: 75
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
        seccompProfile:
          type: RuntimeDefault
      # Spread across all 3 AZs to survive zone failure
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: recommendation-api
      initContainers:
        # Download model artifact from S3 before main container starts
        - name: model-downloader
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/model-downloader:v1.2
          command: ["aws", "s3", "cp", "s3://ml-models/rec-model-v7.pkl", "/model/"]
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              memory: "512Mi"
          volumeMounts:
            - name: model-storage
              mountPath: /model
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
      containers:
        - name: recommendation-api
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/recommendation-api:sha-a3f8c1d
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          resources:
            requests:
              cpu: "500m"     # Python w/ numpy: I/O bound, generous request for scheduling
              memory: "1Gi"   # model in memory ~700Mi + Python overhead
            limits:
              # CPU limit omitted: Python GIL + numpy are bursty; throttling causes
              # p99 latency spikes that are worse than allowing occasional CPU burst
              memory: "2Gi"   # 2x request; OOMKill before noisy neighbor eviction
          startupProbe:
            httpGet:
              path: /healthz   # returns 200 immediately (pre-model-load, proves process up)
              port: http
            failureThreshold: 12  # 12 * 5s = 60s to start -- covers 45s model load + buffer
            periodSeconds: 5
          readinessProbe:
            httpGet:
              path: /readyz    # returns 200 ONLY after model loaded AND pg/redis reachable
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 3   # 15s to detect unhealthy dependency
            successThreshold: 1
          livenessProbe:
            httpGet:
              path: /healthz   # internal only: checks for Python deadlocks, not pg/redis
              port: http
            initialDelaySeconds: 60  # longer than startup to avoid restart during model load
            periodSeconds: 15
            failureThreshold: 3
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: WORKERS
              value: "4"              # Uvicorn workers: match vCPU count on target node type
            - name: MODEL_PATH
              value: "/model/rec-model-v7.pkl"
            - name: LOG_LEVEL
              value: "info"
          envFrom:
            - configMapRef:
                name: recommendation-api-config
            - secretRef:
                name: recommendation-api-secrets  # DB_URL, REDIS_URL via External Secrets
          lifecycle:
            preStop:
              exec:
                # Signal Uvicorn to stop accepting new connections; wait for drain
                command: ["/bin/sh", "-c", "sleep 5 && kill -SIGTERM 1"]
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          volumeMounts:
            - name: model-storage
              mountPath: /model
              readOnly: true
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: model-storage
          emptyDir: {}          # populated by init container from S3
        - name: tmp
          emptyDir: {}
```

**recommendation-api-pdb.yaml:**
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: recommendation-api-pdb
  namespace: ml-serving
spec:
  # With 4 replicas: always keep 3 available during node drains or EKS upgrades
  minAvailable: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: recommendation-api
```

**recommendation-api-hpa.yaml:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: recommendation-api-hpa
  namespace: ml-serving
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: recommendation-api
  minReplicas: 3    # never below 3: PDB requires minAvailable 3
  maxReplicas: 12
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60   # lower target: Python is bursty; leave headroom
    # Custom metric: scale on request rate if CPU is not the bottleneck
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second   # from Prometheus Adapter
        target:
          type: AverageValue
          averageValue: "150"              # 150 req/s per pod; 4 pods = 600 req/s capacity
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0    # scale up immediately on demand
      policies:
        - type: Pods
          value: 3
          periodSeconds: 60            # add max 3 pods per minute
    scaleDown:
      stabilizationWindowSeconds: 300  # wait 5 minutes before scaling down
      policies:
        - type: Percent
          value: 25
          periodSeconds: 120
```

**Explanation of Key Design Decisions:**

1. **startupProbe with failureThreshold: 12 at 5s intervals** -- gives the pod 60 seconds to complete the 45-second model load, with a 15-second buffer. The startupProbe preventing the liveness probe from firing during startup is what eliminates the restart loop during slow startup.

2. **readinessProbe checks `/readyz` not `/healthz`** -- the `/readyz` endpoint in the FastAPI app should check `psycopg2.connect()` and `redis.ping()`. A failed database check removes the pod from the load balancer without restarting it, allowing the database to recover without a pod restart storm.

3. **maxUnavailable: 0 and maxSurge: 1** -- this is the direct fix for the 503 errors. The old behavior likely had `maxUnavailable: 1` (the default), which allowed one pod to be removed before a replacement was ready. With `maxUnavailable: 0`, Kubernetes will only terminate an old pod after the new pod passes its readinessProbe -- including the 45-second model load time.

4. **terminationGracePeriodSeconds: 75** -- the `preStop` hook adds a 5-second delay before SIGTERM, giving the load balancer time to stop routing new connections to the pod. The 75-second grace period gives in-flight requests up to 70 seconds to complete after SIGTERM.

5. **CPU limits omitted** -- Python FastAPI with numpy/scipy is I/O bound for recommendation inference. CPU throttling at 500m would cause latency spikes. The memory limit of 2Gi prevents runaway memory from consuming node resources.

6. **HPA minReplicas: 3 matches PDB minAvailable: 3** -- if HPA scaled down to 2 and a node drain was requested, the PDB would block the drain indefinitely. Keeping them equal prevents this deadlock.
