---
name: kubernetes-operator
description: |
  Kubernetes orchestration. Pod design patterns, deployments/statefulsets/daemonsets, service types, ingress configuration, ConfigMaps/Secrets, RBAC, HPA/VPA, resource limits, helm charts, kustomize, troubleshooting pods.
  Use when the user asks about kubernetes operator, kubernetes operator best practices, or needs guidance on kubernetes operator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud guide"
  category: "devops-cloud"
  subcategory: "containers-orchestration"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Kubernetes Operator

You are a Kubernetes orchestration expert with deep knowledge of workload management, networking, security, scaling, and operational patterns for production clusters.

## Core Principles

1. **Declarative over imperative** - Define desired state; let controllers reconcile.
2. **Least privilege** - Every service account, pod, and namespace gets minimal permissions.
3. **Resource governance** - Every container declares requests and limits. No exceptions.
4. **Readiness before traffic** - Pods must pass readiness probes before receiving requests.
5. **Graceful lifecycle** - Handle SIGTERM, use preStop hooks, respect terminationGracePeriodSeconds.

## Pod Design Patterns

### Sidecar Pattern
A helper container runs alongside the main application container in the same pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  containers:
    - name: app
      image: myapp:1.0
      ports:
        - containerPort: 8080
      volumeMounts:
        - name: shared-logs
          mountPath: [system-path]
    - name: log-shipper
      # ... (condensed) ...
    - name: shared-logs
      emptyDir: {}
    - name: fluent-config
      configMap:
        name: fluent-bit-config
```

### Init Container Pattern
Run setup tasks before the main container starts.

```yaml
spec:
  initContainers:
    - name: wait-for-db
      image: busybox:1.36
      command: ['shell-cmd', '-c', 'until nc -z db-service 5432; do echo waiting; sleep 2; done']
    - name: run-migrations
      image: myapp:1.0
      command: ['./migrate', 'up']
      envFrom:
        - secretRef:
            name: db-credentials
  containers:
    - name: app
      image: myapp:1.0
```

### Ambassador Pattern
A proxy container handles outbound communication.

```yaml
spec:
  containers:
    - name: app
      image: myapp:1.0
      env:
        - name: DB_HOST
          value: "localhost"
        - name: DB_PORT
          value: "5432"
    - name: cloud-sql-proxy
      image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2
      args: ["--port=5432", "project:region:instance"]
```

## Workload Controllers Decision Tree

```
Is each instance identical and interchangeable?
  YES -> Does it need to run on every node?
    YES -> DaemonSet
    NO  -> Deployment
  NO -> Does it need stable identity, persistent storage, ordered deployment?
    YES -> StatefulSet
    NO  -> Is it a one-time task?
      YES -> Job
      NO  -> Is it a scheduled task?
        YES -> CronJob
        NO  -> Deployment (with careful design)
```

## Production Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
  labels:
    app.kubernetes.io/name: api-server
    app.kubernetes.io/version: "1.5.0"
    app.kubernetes.io/component: backend
    app.kubernetes.io/part-of: myplatform
    app.kubernetes.io/managed-by: helm
spec:
  replicas: 3
  revisionHistoryLimit: 5
  # ... (condensed) ...
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir:
            sizeLimit: 100Mi
```

## Service Types

| Type | Use Case | Notes |
|------|----------|-------|
| `ClusterIP` | Internal communication | Default. Only accessible within cluster. |
| `NodePort` | Development/testing | Exposes on each node's IP at a static port (30000-32767). |
| `LoadBalancer` | External production traffic | Provisions cloud load balancer. Use with caution (cost). |
| `ExternalName` | DNS alias to external service | Returns CNAME record. No proxying. |
| `Headless` (ClusterIP: None) | StatefulSet DNS discovery | Returns pod IPs directly, no load balancing. |

## Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    # ... (condensed) ...
            backend:
              service:
                name: api-server-v2
                port:
                  number: 8080
```

## ConfigMaps and Secrets

### ConfigMap for Application Config

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: production
data:
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"
  CACHE_TTL: "300"
  config.yaml: |
    server:
      port: 8080
      readTimeout: 30s
    database:
      maxOpenConns: 25
      maxIdleConns: 5
```

### External Secrets (using External Secrets Operator)

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: api-secrets
    creationPolicy: Owner
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: production/api/database-url
    - secretKey: API_KEY
      remoteRef:
        key: production/api/api-key
```

## RBAC

### Least-Privilege Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-server
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/api-server-role
automountServiceAccountToken: false
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: api-server-role
  namespace: production
# ... (condensed) ...
    namespace: production
roleRef:
  kind: Role
  name: api-server-role
  apiGroup: rbac.authorization.k8s.io
```

## Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 20
  behavior:
    scaleUp:
      # ... (condensed) ...
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
```

## Resource Limits Guidelines

```
CPU:
  - requests: Set to the P50 (median) CPU usage
  - limits: Set to 2-4x the request, or omit to allow bursting
  - 1 CPU = 1000m (millicores)

Memory:
  - requests: Set to the P99 memory usage
  - limits: Set to 1.5-2x the request (OOMKill if exceeded)
  - ALWAYS set memory limits (prevents node instability)

Guideline for sizing:
  Small service:  100m-250m CPU request, 128Mi-256Mi memory request
  Medium service: 250m-500m CPU request, 256Mi-512Mi memory request
  Large service:  500m-2000m CPU request, 512Mi-2Gi memory request
```

## Helm Chart Structure

```
mychart/
  Chart.yaml
  values.yaml
  values-staging.yaml
  values-production.yaml
  templates/
    _helpers.tpl
    deployment.yaml
    service.yaml
    ingress.yaml
    hpa.yaml
    configmap.yaml
    serviceaccount.yaml
    networkpolicy.yaml
    pdb.yaml
    NOTES.txt
  charts/          # Subcharts
  tests/
    test-connection.yaml
```

### Key Helm Commands

```shell
# Install or upgrade a release
helm upgrade --install my-release ./mychart \
  -f values-production.yaml \
  --namespace production \
  --create-namespace \
  --atomic \
  --timeout 5m \
  --set image.tag=1.5.0

# Diff before upgrading
helm diff upgrade my-release ./mychart -f values-production.yaml

# Rollback
helm rollback my-release 1 --namespace production

# Template locally (debug)
helm template my-release ./mychart -f values-production.yaml
```

## Kustomize Patterns

```
base/
  kustomization.yaml
  deployment.yaml
  service.yaml
overlays/
  staging/
    kustomization.yaml
    replica-patch.yaml
  production/
    kustomization.yaml
    replica-patch.yaml
    hpa.yaml
```

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: production
resources:
  - ../../base
  - hpa.yaml
patches:
  - path: replica-patch.yaml
images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: 1.5.0
commonLabels:
  environment: production
```

## Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-server-netpol
  namespace: production
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: api-server
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        # ... (condensed) ...
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

## Pod Disruption Budgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-server-pdb
spec:
  minAvailable: 2       # OR use maxUnavailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: api-server
```

## Troubleshooting Pods

```shell
# Pod not starting
kubectl describe pod <pod-name> -n <namespace>    # Check Events section
kubectl logs <pod-name> -n <namespace> --previous  # Previous container logs
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# Pod stuck in Pending
kubectl describe pod <pod-name>   # Check for scheduling failures
kubectl get nodes -o wide         # Check node capacity
kubectl describe node <node>      # Check allocatable resources

# Pod in CrashLoopBackOff
kubectl logs <pod-name> -c <container> --previous   # Previous crash logs
kubectl run-cmd -it <pod-name> -- shell-interpreter               # Debug interactively

# ... (condensed) ...
kubectl top pods -n <namespace> --sort-by=memory
kubectl top nodes

# Debug node
kubectl debug node/<node-name> -it --image=ubuntu
```

## Production Checklist

```
[ ] All containers have resource requests AND limits
[ ] Readiness and liveness probes configured
[ ] Startup probe for slow-starting apps
[ ] Pod Disruption Budget defined
[ ] Pod anti-affinity or topology spread constraints
[ ] Network Policies restrict traffic
[ ] ServiceAccount with minimal RBAC
[ ] Security context: non-root, read-only FS, drop all capabilities
[ ] HPA configured with appropriate metrics
[ ] ConfigMaps and Secrets externalized
[ ] Image tags are immutable (never use :latest)
[ ] Graceful shutdown handling (preStop hook + SIGTERM handler)
[ ] Resource quotas and limit ranges on namespaces
[ ] Logging and monitoring configured
[ ] Revision history limit set on Deployments
```

## When to Use

**Use this skill when:**
- Designing or implementing kubernetes operator solutions
- Reviewing or improving existing kubernetes operator approaches
- Making architectural or implementation decisions about kubernetes operator
- Learning kubernetes operator patterns and best practices
- Troubleshooting kubernetes operator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Kubernetes Operator Analysis

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

**Input:** "Help me implement kubernetes operator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended kubernetes operator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When kubernetes operator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
