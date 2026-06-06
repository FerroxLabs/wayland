---
name: service-mesh-operator
description: |
  Expert guide for operating service meshes including Istio and Linkerd. Covers traffic management, mutual TLS, observability, canary deployments, circuit breaking, fault injection, and production mesh operations in Kubernetes environments.
  Use when the user asks about service mesh operator, service mesh operator best practices, or needs guidance on service mesh operator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud security"
  category: "devops-cloud"
  subcategory: "containers-orchestration"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Service Mesh Operator

You are an expert in deploying and operating service meshes in Kubernetes environments. You guide teams through mesh selection, traffic management, mutual TLS, observability, deployment strategies, and operational best practices for Istio, Linkerd, and related technologies.

## Core Principles

1. **Start simple, add incrementally** - Begin with mTLS and observability. Add traffic management as needed.
2. **Sidecar overhead is real** - Each proxy adds ~1-2ms latency and ~50-100MB memory. Budget for it.
3. **Mesh is infrastructure** - Routing rules in mesh config, business rules in application code.

## Mesh Selection

```
FEATURE              ISTIO                LINKERD              CONSUL CONNECT
---------------------------------------------------------------------------
Complexity           High                 Low                  Medium
Data plane           Envoy                linkerd2-proxy       Envoy/built-in
Memory per pod       ~100MB               ~20MB                ~60MB
mTLS                 Auto                 Auto                 Auto
Traffic mgmt         Advanced             Basic                Medium
Learning curve       Steep                Gentle               Moderate
Best for             Complex traffic      Simplicity-first     HashiCorp stack
```

```
CHOOSE ISTIO:    Complex routing (canary, mirroring, fault injection), multi-cluster
CHOOSE LINKERD:  Simplicity, low overhead, primary goal is mTLS + observability
NO MESH:         <10 services, no regulatory mTLS requirement
```

## Istio Installation

```shell
istioctl install --set profile=default \
  --set meshConfig.accessLogFile=/dev/stdout \
  --set meshConfig.defaultConfig.holdApplicationUntilProxyStarts=true

kubectl label namespace default istio-injection=enabled
istioctl analyze
```

## Traffic Management

### VirtualService (Routing)

```yaml
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts: [user-service]
  http:
    - match:
        - headers:
            x-canary: { exact: "true" }
      route:
        - destination: { host: user-service, subset: canary }
    - route:
        - destination: { host: user-service, subset: stable }
          weight: 90
        - destination: { host: user-service, subset: canary }
          weight: 10
      retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: 5xx,reset,connect-failure
      timeout: 10s
```

### DestinationRule (Circuit Breaking)

```yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: user-service
spec:
  host: user-service
  trafficPolicy:
    connectionPool:
      tcp: { maxConnections: 100, connectTimeout: 5s }
      http: { h2UpgradePolicy: DEFAULT, http1MaxPendingRequests: 100, http2MaxRequests: 1000 }
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
    loadBalancer:
      simple: LEAST_REQUEST
  subsets:
    - name: stable
      labels: { version: v1 }
    - name: canary
      labels: { version: v2 }
```

### Gateway (Ingress)

```yaml
apiVersion: networking.istio.io/v1
kind: Gateway
metadata:
  name: api-gateway
spec:
  selector: { istio: ingressgateway }
  servers:
    - port: { number: 443, name: https, protocol: HTTPS }
      tls: { mode: SIMPLE, credentialName: api-tls-cert }
      hosts: [api.example.com]
    - port: { number: 80, name: http, protocol: HTTP }
      hosts: [api.example.com]
      tls: { httpsRedirect: true }
```

## Mutual TLS

### Mesh-Wide Strict mTLS

```yaml
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls: { mode: STRICT }
```

### Namespace Supersede (Legacy Support)

```yaml
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: legacy
  namespace: legacy-apps
spec:
  mtls: { mode: PERMISSIVE }
```

## Authorization Policies

```yaml
# Deny all by default
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: production
spec: {}

---
# Allow specific service-to-service calls
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: allow-order-to-user
  namespace: production
spec:
  selector:
    matchLabels: { app: user-service }
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/order-service"]
      to:
        - operation:
            methods: ["GET"]
            paths: ["/api/v1/users/*"]
```

## Canary Deployments with Flagger

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: user-service
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  service: { port: 8080 }
  analysis:
    interval: 1m
    threshold: 5                   # Max failed checks before rollback
    maxWeight: 50
    stepWeight: 10                 # Increase canary 10% per step
    metrics:
      - name: request-success-rate
        thresholdRange: { min: 99 }
        interval: 1m
      - name: request-duration
        thresholdRange: { max: 500 }
        interval: 1m
```

## Observability

### Key Metrics (PromQL)

```
# Success rate
sum(rate(istio_requests_total{destination_service="user-service",response_code!~"5.."}[5m]))
/ sum(rate(istio_requests_total{destination_service="user-service"}[5m]))

# P99 latency
histogram_quantile(0.99,
  sum(rate(istio_request_duration_milliseconds_bucket{destination_service="user-service"}[5m]))
  by (le))

# Error rate by source
sum(rate(istio_requests_total{destination_service="user-service",response_code=~"5.."}[5m]))
by (source_workload)
```

### Trace Header Propagation

```
Applications MUST forward these headers for distributed tracing:
  x-request-id, x-b3-traceid, x-b3-spanid, x-b3-parentspanid
  x-b3-sampled, traceparent, tracestate
```

## Debugging

```shell
istioctl proxy-status                                    # All proxy status
istioctl proxy-config routes deploy/user-service -n prod # Envoy routes
istioctl proxy-config clusters deploy/user-service       # Envoy clusters
istioctl analyze -n production                           # Config issues
istioctl dashboard kiali                                 # Mesh visualization
istioctl dashboard grafana                               # Metrics
```

## Linkerd Quick Start

```shell
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -
linkerd check

kubectl annotate namespace production linkerd.io/inject=enabled
linkerd viz install | kubectl apply -f -
linkerd viz dashboard
```

### Linkerd Service Profile

```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: user-service.production.svc.cluster.local
spec:
  routes:
    - name: GET /api/v1/users/{id}
      condition:
        method: GET
        pathRegex: /api/v1/users/[^/]+
      isRetryable: true
  retryBudget:
    retryRatio: 0.2
    minRetriesPerSecond: 10
    ttl: 10s
```

## Production Checklist

```
INSTALLATION:
  [ ] Resource limits on sidecar proxies
  [ ] Injection enabled per namespace (not globally)
  [ ] holdApplicationUntilProxyStarts enabled
  [ ] Control plane HA (min 2 replicas)
  [ ] outboundTrafficPolicy: REGISTRY_ONLY

SECURITY:
  [ ] Mesh-wide strict mTLS
  [ ] Deny-by-default authorization policies
  [ ] Service accounts per workload
  [ ] Ingress TLS with valid certificates
  [ ] Certificate rotation configured

TRAFFIC:
  [ ] Retry policies with budgets
  [ ] Circuit breakers on inter-service calls
  [ ] Timeouts on all VirtualServices
  [ ] Canary deployment pipeline tested

OBSERVABILITY:
  [ ] Access logging (structured JSON)
  [ ] Prometheus scraping mesh metrics
  [ ] Grafana dashboards (latency, traffic, errors, saturation)
  [ ] Distributed tracing with appropriate sampling
  [ ] Applications propagate trace headers
  [ ] Kiali or equivalent mesh visualization
```

## When to Use

**Use this skill when:**
- Designing or implementing service mesh operator solutions
- Reviewing or improving existing service mesh operator approaches
- Making architectural or implementation decisions about service mesh operator
- Learning service mesh operator patterns and best practices
- Troubleshooting service mesh operator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Service Mesh Operator Analysis

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

**Input:** "Help me implement service mesh operator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended service mesh operator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When service mesh operator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
