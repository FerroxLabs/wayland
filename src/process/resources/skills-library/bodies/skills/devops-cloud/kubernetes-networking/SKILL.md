---
name: kubernetes-networking
description: |
  Guides expert-level kubernetes networking implementation: cloud and security decision frameworks, production-ready patterns, and concrete templates for kubernetes networking workflows.
  Use when the user asks about kubernetes networking, kubernetes networking configuration, or devops best practices for kubernetes projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud security"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Kubernetes Networking

## When to Use

**Use this skill when:**
- User asks how to design or implement a CNI plugin strategy (Calico, Cilium, Flannel, Weave, etc.) for a Kubernetes cluster
- User needs to configure Services (ClusterIP, NodePort, LoadBalancer, ExternalName), Endpoints, or EndpointSlices
- User wants to implement NetworkPolicy rules to segment traffic between namespaces or pods
- User asks about Ingress controllers, Gateway API, or layer-7 routing for HTTP/HTTPS workloads
- User needs to troubleshoot connectivity between pods, services, or external traffic -- including DNS resolution, kube-proxy rules, or iptables/eBPF data planes
- User is designing a multi-cluster or service mesh architecture (Istio, Linkerd, Cilium Service Mesh)
- User needs to configure pod-to-pod encryption, mutual TLS (mTLS), or zero-trust network policies
- User asks about IP address management (IPAM), CIDR planning, or subnet allocation for nodes and pods
- User needs to implement egress controls, NAT policies, or traffic shaping for Kubernetes workloads
- User asks about DNS configuration, CoreDNS tuning, or service discovery inside a cluster

**Do NOT use this skill when:**
- User needs container image building, Dockerfile optimization, or registry configuration -- use the container-build skill
- User needs Kubernetes storage (PersistentVolumes, StorageClasses, CSI drivers) -- use the kubernetes-storage skill
- User needs cluster provisioning, node scaling, or managed Kubernetes setup (EKS, GKE, AKS) -- use the cluster-provisioning skill
- User needs application deployment patterns (Helm charts, Kustomize, rolling upgrades) -- use the kubernetes-deployment skill
- User needs general cloud VPC/subnet/security-group configuration outside of Kubernetes -- use the cloud-networking skill
- User is asking about load balancer configuration for non-Kubernetes workloads
- User needs observability, metrics, or tracing pipelines -- use the kubernetes-observability skill
- User is asking about authentication/authorization (RBAC, OIDC, service account tokens) rather than network-level controls -- use the kubernetes-security skill

---

## Process

### 1. Establish Network Architecture Constraints

Before writing a single YAML file, capture the constraints that will determine every downstream decision.

- **Cluster IP ranges:** Confirm the pod CIDR and service CIDR do not overlap with each other, the node network, or any on-premises subnets routed to the cluster. A common production-safe layout is `10.244.0.0/16` for pods, `10.96.0.0/12` for services, with nodes in a separate range like `192.168.0.0/24`. Overlapping CIDRs cause silent routing failures that are extraordinarily difficult to diagnose.
- **Node density and pod capacity:** Each node's pod CIDR determines the maximum pods per node. A `/24` per node allows 254 addresses but Kubernetes recommends `--max-pods` set to the actual allocatable value (typically 110 for most CNIs). For high-density workloads, allocate `/23` or use ENI-based IPAM (AWS VPC CNI) which ties pod IPs directly to ENI secondary IPs.
- **Cloud provider constraints:** AWS VPC CNI assigns real VPC IPs to pods, meaning pod counts per node are limited by instance type ENI limits (e.g., m5.large supports 29 secondary IPs across 3 ENIs). GKE uses alias IP ranges which are more flexible. Bare-metal clusters have no such constraints but require explicit IPAM configuration.
- **Dual-stack requirements:** If IPv6 is required (government compliance, large-scale ISP environments), confirm the CNI supports dual-stack mode. Calico and Cilium both support IPv4/IPv6 dual-stack; Flannel support is limited. This decision locks in complexity early.
- **Data plane selection -- iptables vs. eBPF:** kube-proxy in iptables mode adds O(n) rule lookup overhead that degrades at >5,000 services. At that scale, switch to IPVS mode or replace kube-proxy entirely with Cilium's eBPF data plane, which provides O(1) service lookup via BPF maps and reduces CPU usage by 30-40% on large clusters.
- **Compliance and encryption requirements:** PCI-DSS, HIPAA, and FedRAMP typically require encryption in transit. Determine whether mTLS at the application layer (service mesh) or transparent pod-to-pod encryption at the CNI layer (Cilium WireGuard, Calico WireGuard) is required.

---

### 2. Select and Configure the CNI Plugin

CNI selection is the foundational architectural decision and is difficult to change post-production without cluster rebuild.

- **Cilium** -- recommended for new production clusters. Uses eBPF for all data plane operations, provides native NetworkPolicy plus CiliumNetworkPolicy (L7 HTTP/gRPC/DNS-aware policies), built-in Hubble observability, and optional kube-proxy replacement. Requires Linux kernel 4.19+ (5.4+ for full feature set). Not suitable for clusters where the kernel cannot be upgraded (some managed Kubernetes versions with fixed AMIs).
- **Calico** -- industry standard for NetworkPolicy enforcement. Supports both iptables and eBPF data planes. Excellent BGP integration for bare-metal/on-premises clusters where pods need to be directly routable from the corporate network. Felix is the per-node agent; Typha is required at >200 nodes to prevent API server overload. Use Calico's GlobalNetworkPolicy for cluster-wide egress deny-by-default rules.
- **Flannel** -- simple VXLAN overlay, suitable for development and small clusters. Has no NetworkPolicy support -- requires a separate NetworkPolicy controller. Do not use in production environments with isolation requirements.
- **AWS VPC CNI** -- required when pod IPs must be directly addressable within the VPC (for security group assignment, NLB target group health checks, etc.). Install the VPC Resource Controller and enable security groups for pods (`ENABLE_POD_ENI=true`). Be aware of the ENI warm pool which pre-allocates IPs and increases VPC IP consumption.
- **Weave Net** -- no longer actively developed; avoid for new deployments.

**Installation validation steps:**
```bash
# Verify all CNI pods are Running
kubectl get pods -n kube-system -l k8s-app=cilium

# Confirm node networking is ready
kubectl get nodes -o wide  # all nodes should show Ready

# Test pod-to-pod connectivity
kubectl run test-pod --image=busybox --rm -it --restart=Never -- \
  wget -qO- http://<pod-ip>:8080
```

---

### 3. Design and Implement NetworkPolicy

NetworkPolicy is the Kubernetes-native firewall. Implement a default-deny baseline, then add explicit allow rules.

- **Start with namespace-level default deny:** Apply a deny-all policy to every namespace before deploying workloads. This forces teams to explicitly declare all required communication paths, which serves as living documentation of service dependencies.
- **Label strategy is critical:** NetworkPolicy selectors match on pod labels. Define a consistent labeling taxonomy before writing policies. Use `app`, `tier`, `component`, and `version` as standard selectors. For example: `app: payments`, `tier: backend`, `component: api`.
- **Ingress vs. egress policy:** Both must be specified for full isolation. An ingress-only policy allows unrestricted outbound (pods can call external services, exfiltrate data). Always pair ingress policies with explicit egress rules.
- **Namespace selectors for cross-namespace traffic:** When the monitoring namespace needs to scrape metrics from the application namespace, use a `namespaceSelector` in the NetworkPolicy, not a wide-open ingress rule. This requires namespaces to carry a label like `kubernetes.io/metadata.name: monitoring` (auto-applied in Kubernetes 1.21+).
- **DNS egress must be explicitly allowed:** One of the most common NetworkPolicy mistakes is blocking DNS. After applying egress deny-all, pods cannot resolve service names. Always include an explicit egress rule allowing UDP port 53 and TCP port 53 to the kube-dns ClusterIP (or to pods with label `k8s-app: kube-dns` in the `kube-system` namespace).
- **CiliumNetworkPolicy for L7:** Standard NetworkPolicy operates at L3/L4 only. For HTTP path-based or gRPC method-based policies, use Cilium's `CiliumNetworkPolicy` with an HTTP rule specifying exact path and method. This catches application-layer privilege escalation that port-based policies miss entirely.

---

### 4. Configure Services and Load Balancing

Services are the stable networking abstraction over ephemeral pods. Each type has specific production implications.

- **ClusterIP** -- internal-only service. The default and most common type. kube-proxy writes iptables DNAT rules (or eBPF programs) that intercept traffic to the ClusterIP virtual IP and forward to one of the backing pod IPs. Session affinity (`sessionAffinity: ClientIP`) is available but has a fixed timeout of 10800 seconds (3 hours) -- not configurable below that in standard kube-proxy.
- **NodePort** -- exposes a service on every node at a port in the range 30000-32767. Generates high-cardinality iptables rules at scale. Avoid using NodePort in production except for specific cases (MetalLB layer2 mode, on-premises bare metal with external LB). Each NodePort service adds rules to every node regardless of where the backing pods are scheduled.
- **LoadBalancer** -- provisions a cloud load balancer. On AWS, this creates a Classic Load Balancer by default; add annotation `service.beta.kubernetes.io/aws-load-balancer-type: nlb` for Network Load Balancer. Key annotations: `service.beta.kubernetes.io/aws-load-balancer-internal: "true"` for internal LBs. Set `externalTrafficPolicy: Local` to preserve source IP and avoid an extra hop, but only when all nodes run at least one backing pod (otherwise, nodes with no backing pod return unhealthy to the NLB).
- **EndpointSlices** -- replaces Endpoints for clusters with >100 pods per service. Each EndpointSlice holds up to 100 endpoints. In clusters with thousands of pods per service, the Endpoints object becomes a single multi-megabyte object that triggers full writes on every pod change. EndpointSlices are enabled by default in Kubernetes 1.21+ and reduce control-plane load by 10x in large services.
- **Headless services** (ClusterIP: None) -- used for StatefulSets and direct pod addressing. DNS returns A records for all pod IPs rather than the single ClusterIP. Required for databases, Kafka, ZooKeeper, and any stateful workload where clients need to connect to a specific replica.
- **ExternalName** -- maps a service to an external DNS name. Useful for migrating services from outside the cluster to inside incrementally, or for accessing external managed databases (RDS, Cloud SQL) via a consistent in-cluster DNS name.

---

### 5. Implement Ingress and Gateway API

Ingress and Gateway API handle external HTTP/HTTPS traffic routing into the cluster.

- **Ingress controller selection:** NGINX Ingress Controller (community version) is the most widely deployed. Contour (uses Envoy), HAProxy Ingress, and Traefik are strong alternatives. For AWS-native environments, the AWS Load Balancer Controller with IngressClass `alb` provisions ALBs with path-based routing natively. For GKE, the GKE Ingress controller is managed and integrates with Cloud CDN and Cloud Armor.
- **TLS termination:** Store certificates in Kubernetes Secrets (type `kubernetes.io/tls`). Use cert-manager with Let's Encrypt (ACME HTTP-01 or DNS-01 challenge) or with an enterprise CA for automatic certificate lifecycle management. Set `spec.tls` in the Ingress resource. Configure `nginx.ingress.kubernetes.io/ssl-redirect: "true"` to force HTTPS. Minimum TLS version: TLS 1.2; configure `ssl-protocols: TLSv1.2 TLSv1.3` in the NGINX ConfigMap.
- **Rate limiting and WAF integration:** NGINX Ingress supports `nginx.ingress.kubernetes.io/limit-rps` for rate limiting. For WAF capability, Modsecurity can be enabled via `nginx.ingress.kubernetes.io/enable-modsecurity: "true"`. For production WAF, prefer cloud-native solutions (AWS WAF on ALB, Cloud Armor on GKE) which have managed rule sets.
- **Gateway API (v1.0 stable as of Kubernetes 1.28):** Supersedes Ingress with a role-oriented API split into GatewayClass (infrastructure team), Gateway (network team), and HTTPRoute/TCPRoute/GRPCRoute (application team). Provides native support for traffic splitting (canary deployments), header-based routing, and URL rewrites that previously required Ingress annotations that varied per-controller. Cilium, Contour, and NGINX all implement Gateway API.
- **Ingress resource structure for multi-service routing:**
  - Use `ingressClassName` field (not the deprecated `kubernetes.io/ingress.class` annotation) in Kubernetes 1.21+.
  - A single Ingress resource can route multiple hostnames and paths, but consider splitting into per-service Ingress resources for independent lifecycle management.
  - Enable `pathType: Prefix` or `pathType: Exact` explicitly -- the default `ImplementationSpecific` has controller-dependent behavior.

---

### 6. Configure CoreDNS for Production

CoreDNS is the cluster DNS server. Default configuration is adequate for small clusters but needs tuning for production.

- **Scaling CoreDNS replicas:** Default deployment is 2 replicas. Scale based on QPS: a single CoreDNS pod handles approximately 10,000 DNS queries per second. For 500-node clusters with high-QPS workloads, run 5-10 replicas and pin them to nodes with pod anti-affinity to spread across failure domains.
- **NodeLocal DNSCache:** Deploy the NodeLocal DNSCache DaemonSet which runs a DNS cache on every node at a link-local address (169.254.20.10). This eliminates conntrack table contention for UDP DNS traffic (a major source of DNS timeouts under load), reduces latency from ~2ms to ~0.1ms for cached responses, and cuts CoreDNS traffic by 60-80% in typical workloads. Enable with the `node-local-dns` addon.
- **ndots and search domain tuning:** Kubernetes pods default to `ndots:5` which causes every short name to be tried with 5 search domain suffixes before attempting the absolute name. A query for `redis` generates 6 DNS lookups. For services that make DNS queries to external FQDNs, set `dnsConfig.options[ndots: 2]` in the pod spec, or append a trailing dot to FQDNs in application config to bypass search domain expansion entirely.
- **CoreDNS ConfigMap tuning:**
  - Enable `ready` plugin health endpoint for pod readiness probes.
  - Configure `cache 30` for positive TTL caching and `cache 5` denial TTL.
  - Use `autopath` plugin to reduce search domain lookup rounds by resolving server-side.
  - Add `rewrite` rules for custom DNS aliases without modifying application code.

---

### 7. Implement Service Mesh (When Required)

Service meshes add mTLS, observability, and traffic management at the application layer. They add real operational overhead -- only introduce them when the requirements justify it.

- **Decision threshold for service mesh adoption:** Adopt a service mesh when two or more of these are true: (1) mTLS between all services is mandated by compliance, (2) fine-grained traffic shifting for canary deployments is needed across >10 services, (3) distributed tracing with automatic propagation is required, (4) circuit breaking with automatic retry is needed at the platform level, (5) the team cannot modify application code to implement these capabilities.
- **Istio:** Most feature-complete option. Control plane components: istiod (pilot + citadel + galley combined). Data plane: Envoy sidecar injected into every pod. Significant resource overhead: Envoy sidecar uses approximately 50 MiB RAM and 0.5 vCPU per pod at rest. mTLS enforced via PeerAuthentication policy (PERMISSIVE mode for migration, STRICT mode for production). Use `DestinationRule` for circuit breaking (outlier detection with `consecutiveGatewayErrors: 5`, `interval: 30s`, `baseEjectionTime: 30s`).
- **Linkerd:** Lighter weight than Istio. Uses a Rust-based micro-proxy (~10 MiB per sidecar) instead of Envoy. Supports automatic mTLS, latency-aware load balancing (EWMA algorithm), and traffic splitting. Does not support L7 HTTP routing as comprehensively as Istio. Excellent choice when mTLS and observability are the primary requirements and Istio's complexity is unacceptable.
- **Cilium Service Mesh:** Eliminates the sidecar entirely by implementing service mesh features in eBPF and per-node Envoy proxies. Reduces data-plane overhead by 40-60% compared to per-pod sidecars. Supports mTLS, Ingress, Gateway API, and Hubble observability. Requires Cilium as the CNI -- cannot be adopted independently.
- **Sidecar injection:** Enable namespace-level injection with `istio-injection: enabled` or `linkerd.io/inject: enabled` label on namespaces. Never inject sidecars into the `kube-system` namespace. Exclude jobs and init containers that do not require mesh features to avoid startup ordering issues.

---

### 8. Validate, Test, and Document

Networking bugs in production are expensive to debug. Pre-deployment validation is non-negotiable.

- **Policy validation with network-policy-validator:** Use `kubectl neat` and `kube-linter` to statically validate NetworkPolicy YAML before applying. The `netassert` tool runs declarative connectivity tests (pod A can reach pod B on port 8080; pod C cannot reach pod B) that can be run in CI.
- **Connectivity test matrix:** For every service-to-service path, document and test: allowed paths (should return HTTP 200 or TCP connection success), denied paths (should return connection refused or timeout), and DNS resolution (should return expected IP). Tools: `kubectl exec` into a debug pod with `netshoot` image (which includes curl, netcat, tcpdump, nmap, etc.) for ad-hoc testing.
- **iptables/eBPF rule inspection:**
  ```bash
  # Inspect iptables rules for a specific service
  iptables-save | grep <service-cluster-ip>

  # Cilium: inspect BPF service map
  cilium service list

  # Cilium: trace packet path for specific src/dst
  cilium monitor --type=drop

  # Verify kube-proxy mode
  kubectl get cm kube-proxy -n kube-system -o yaml | grep mode
  ```
- **DNS debugging:**
  ```bash
  # Run a debug pod with DNS tools
  kubectl run dnsutils --image=registry.k8s.io/e2e-test-images/jessie-dnsutils:1.3 \
    --rm -it --restart=Never -- nslookup kubernetes.default

  # Check CoreDNS logs for NXDOMAIN errors
  kubectl logs -n kube-system -l k8s-app=kube-dns --tail=100
  ```
- **Load testing ingress:** Use `k6`, `hey`, or `vegeta` to load test ingress routes before production traffic. Measure p95 and p99 latency. Baseline: NGINX Ingress with 10,000 RPS should show p99 < 50ms on a 4-core ingress node. Tune NGINX worker processes to match vCPU count.

---

## Output Format

When responding to a Kubernetes networking question, produce the following artifacts as applicable to the user's scenario:

### Architecture Decision Summary

```
Cluster: <name>
Cloud Provider: <AWS / GCP / Azure / Bare Metal>
Kubernetes Version: <version>
CNI Plugin: <plugin + version>
Data Plane Mode: <iptables / IPVS / eBPF>
kube-proxy Replacement: <yes/no>

IP Allocation:
  Pod CIDR:     <x.x.x.x/xx>
  Service CIDR: <x.x.x.x/xx>
  Node Subnet:  <x.x.x.x/xx>

Service Mesh: <none / Istio / Linkerd / Cilium>
mTLS Enforcement: <none / PERMISSIVE / STRICT>
Ingress Controller: <controller + version>
TLS Management: <cert-manager + issuer / manual>
```

### NetworkPolicy Template (Default Deny + Allow Example)

```yaml
# default-deny-all.yaml
# Apply to every namespace. Forces explicit allow rules for all traffic.
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: <target-namespace>
spec:
  podSelector: {}        # selects ALL pods in the namespace
  policyTypes:
  - Ingress
  - Egress
---
# allow-dns-egress.yaml
# REQUIRED: without this, pods cannot resolve service names after deny-all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: <target-namespace>
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
---
# allow-app-ingress.yaml
# Allow traffic to the application from a specific frontend tier
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: <target-namespace>
spec:
  podSelector:
    matchLabels:
      app: <api-service-name>
      tier: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: <frontend-service-name>
          tier: frontend
    ports:
    - protocol: TCP
      port: 8080
```

### Service Definition Template

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: <service-name>
  namespace: <namespace>
  annotations:
    # For AWS NLB (use instead of classic ELB):
    # service.beta.kubernetes.io/aws-load-balancer-type: nlb
    # service.beta.kubernetes.io/aws-load-balancer-internal: "true"
spec:
  type: ClusterIP            # ClusterIP | NodePort | LoadBalancer | ExternalName
  selector:
    app: <app-label>
    tier: <tier-label>
  ports:
  - name: http               # always name ports; required for NetworkPolicy and Istio
    protocol: TCP
    port: 80                 # service port (what clients connect to)
    targetPort: 8080         # container port (what the app listens on)
  sessionAffinity: None      # or ClientIP for sticky sessions
  # For LoadBalancer type -- preserve client IP, avoid double-hop:
  # externalTrafficPolicy: Local
```

### Ingress / HTTPRoute Template

```yaml
# ingress.yaml (Kubernetes Ingress API)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: <app-ingress>
  namespace: <namespace>
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    # Rate limiting: 100 req/min per IP
    nginx.ingress.kubernetes.io/limit-rps: "100"
spec:
  ingressClassName: nginx     # use ingressClassName, NOT deprecated annotation
  tls:
  - hosts:
    - <app.example.com>
    secretName: <app-tls-secret>  # managed by cert-manager
  rules:
  - host: <app.example.com>
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: <api-service>
            port:
              name: http
      - path: /
        pathType: Prefix
        backend:
          service:
            name: <frontend-service>
            port:
              name: http
```

### Decision Matrix

| Factor | Flannel | Calico | Cilium | AWS VPC CNI |
|--------|---------|--------|--------|-------------|
| NetworkPolicy support | No | Yes (L3/L4 + GlobalPolicy) | Yes (L3/L4/L7) | With Calico add-on |
| Data plane | VXLAN | iptables / eBPF | eBPF only | iptables + ENI routing |
| Performance at scale | Medium | High | Highest | High (native VPC) |
| Observability | None | Basic | Hubble (full L7 flow) | None native |
| BGP peering | No | Yes (full BGP) | Yes (BGP control plane) | No |
| Bare metal support | Yes | Yes | Yes | No |
| Operational complexity | Low | Medium | Medium-High | Low (AWS-managed) |
| Best for | Dev/test | On-prem, BGP | High-perf, L7 policy | AWS production |

---

## Rules

1. **NEVER overlap pod CIDR, service CIDR, and node subnet ranges.** Overlapping CIDRs silently break routing in ways that appear as intermittent connectivity failures -- one of the hardest classes of bugs to debug in Kubernetes. Validate with `ipcalc` before cluster creation.

2. **ALWAYS apply a default-deny NetworkPolicy to every namespace, including the default namespace.** Without it, all pods in the cluster can communicate freely. This violates the principle of least privilege and is non-compliant with PCI-DSS, HIPAA, and most zero-trust frameworks.

3. **NEVER forget the DNS egress allow rule when applying default-deny.** This is the most common NetworkPolicy mistake. After applying deny-all egress, pods immediately lose the ability to resolve service names and external hostnames, causing application failures that appear unrelated to network policy changes.

4. **NEVER use the `kubernetes.io/ingress.class` annotation on Ingress resources in Kubernetes 1.21+.** Use `spec.ingressClassName` instead. The annotation is deprecated and behavior is implementation-specific. Using both simultaneously produces undefined behavior in some controllers.

5. **ALWAYS set resource requests and limits on CoreDNS pods and Ingress controller pods.** Without limits, a DNS query spike or traffic surge can starve other kube-system pods of resources on the same node, causing cascading failures. CoreDNS minimum: 100m CPU / 70Mi memory; limit: 500m CPU / 170Mi memory.

6. **NEVER set `externalTrafficPolicy: Local` on a LoadBalancer service without confirming that backing pods are scheduled across all nodes** (or that your cloud LB health checks will correctly drain unhealthy targets). Nodes with no matching pods will fail health checks and drop traffic silently from the node's perspective.

7. **ALWAYS use named ports in Service definitions** (e.g., `name: http`, `name: grpc`). Named ports allow NetworkPolicy rules and Istio VirtualServices to reference port names rather than numbers, making policies readable and resilient to port number changes.

8. **NEVER install multiple CNI plugins simultaneously** unless explicitly using a meta-CNI framework (Multus). Two CNI plugins attempting to manage the same pod network interface will produce inconsistent, irrecoverable pod networking states. Re-initialization requires node draining and CNI reinstallation.

9. **ALWAYS plan the CNI upgrade path before selecting a plugin.** Migrating from one CNI to another in-place is not supported without either a full cluster rebuild or a carefully orchestrated node-by-node replacement. For production clusters, CNI selection is effectively permanent -- evaluate long-term maintainability, not just current features.

10. **ALWAYS configure pod disruption budgets and anti-affinity rules for networking-critical pods** (Ingress controller, CoreDNS, CNI daemon sets). A rolling node upgrade that takes down 2 CoreDNS replicas simultaneously (default PodDisruptionBudget allows this) will cause cluster-wide DNS resolution failures. Set `minAvailable: 2` for CoreDNS at all times.

11. **NEVER rely solely on port-based NetworkPolicy for sensitive workloads.** Port 443 carries many different services. Use pod label selectors and namespace selectors to enforce which exact pods can communicate, not just which ports are open. A misconfigured or compromised pod in the same namespace with the correct port open is not blocked by port-only policies.

12. **ALWAYS validate that eBPF features required by Cilium are available on the target kernel before deploying.** Cilium requires kernel 4.19+ minimum; kube-proxy replacement requires 5.3+; WireGuard encryption requires 5.6+; BandwidthManager requires 5.1+. Deploying Cilium on an incompatible kernel causes silent fallback to iptables mode or agent crashes with obscure error messages.

---

## Edge Cases

### Asymmetric Routing in Multi-Zone Clusters

When pods are spread across availability zones and a LoadBalancer service has `externalTrafficPolicy: Cluster` (the default), traffic entering a node in zone A is SNAT'd and may be forwarded to a pod in zone B, incurring inter-zone data transfer costs (typically $0.01/GB on AWS) and adding ~1ms latency. At scale (1 million requests/minute), this is significant. The fix is `externalTrafficPolicy: Local` paired with `topologySpreadConstraints` ensuring at least one pod runs in each zone. If zone-aware load balancing is required without Local policy, use Kubernetes Topology Aware Hints (`service.kubernetes.io/topology-mode: Auto` in Kubernetes 1.27+), which instructs kube-proxy to prefer local-zone endpoints.

### NodeLocal DNSCache and Cilium Interaction

NodeLocal DNSCache uses a link-local IP address (169.254.20.10) that is configured as a host-local service. When Cilium is operating in kube-proxy replacement mode, it needs explicit awareness of NodeLocal DNSCache to avoid intercepting and misrouting DNS traffic destined for the node-local cache. Configure Cilium with `--nodeport-addresses` excluding the link-local range and verify with `cilium status --verbose` that the local redirect policy for DNS is active. Missing this configuration causes DNS queries to loop or time out intermittently.

### Large-Scale iptables Rule Explosion

At 5,000+ services with kube-proxy in iptables mode, the iptables rule set grows to hundreds of thousands of rules. DNAT rule lookup is O(n), causing measurable packet forwarding latency (>5ms per packet at 10,000 services). Symptoms include intermittent connection timeouts that correlate with high service count, not high traffic volume. Mitigation options in order of preference: (1) Switch to kube-proxy IPVS mode (`--proxy-mode=ipvs`, requires `ipvs` kernel module and `ipvsadm` tooling), which uses hash tables for O(1) lookup. (2) Replace kube-proxy entirely with Cilium eBPF data plane. (3) Reduce service count by consolidating micro-services or using gRPC multiplexing over single services.

### DNS Resolution Failures Under High Pod Churn

In environments with high pod creation/deletion rates (batch workloads, autoscaling clusters), the Endpoints controller may lag behind actual pod state. EndpointSlices with `discovery.endpointslice.kubernetes.io/managed-by` set correctly and `endpointslice-controller` using incremental updates help, but DNS TTLs still cause stale IP caching. Applications that cache DNS results (Java's InetAddress, some gRPC clients) may continue sending to terminated pod IPs for 30-600 seconds. Solution: configure the JVM's `networkaddress.cache.ttl=5` (seconds) system property for Java services, and ensure gRPC clients use `pick_first` load balancing with name resolver refresh intervals of 30 seconds or less.

### Service Mesh Sidecar Injection Ordering for Init Containers

When Istio injects an Envoy sidecar, init containers in the same pod run before the sidecar proxy is ready. If an init container needs to make a network call (e.g., fetching a configuration from Vault, waiting for a database), the call will fail because no network proxy is available. Solutions: (1) In Istio 1.13+, enable `holdApplicationUntilProxyStarts: true` in the mesh config -- this delays init container start until the proxy is ready. (2) Use Kubernetes native sidecars (KEP-753, stable in 1.29) which allow the sidecar to start before init containers. (3) Restructure the init container to retry with exponential backoff for the first 30 seconds. The retry approach is the most portable solution across service mesh versions.

### Dual-Stack Migration on Existing Clusters

Enabling IPv6 dual-stack on an existing single-stack IPv4 cluster is non-trivial and involves: (1) Re-creating the cluster with `--service-cluster-ip-range` specifying both IPv4 and IPv6 ranges, which requires kube-apiserver restart and impacts existing service ClusterIPs -- this is a cluster-wide change with no incremental path. (2) Migrating the CNI to dual-stack mode (for Calico, this means modifying the IPPool resources and node annotations). (3) Updating all Services with both IPv4 and IPv6 addresses. The practical recommendation is to build a new dual-stack cluster and migrate workloads, treating the old single-stack cluster as deprecated. Do not attempt in-place migration on production clusters without a tested rollback to a separate cluster.

### NetworkPolicy Conflicts and Policy Priority

Standard Kubernetes NetworkPolicy is additive -- multiple policies in the same namespace are OR'd together. If one policy allows traffic and another denies it, the allow wins. This means you cannot create a "super-deny" policy that overrides specific allows. For hierarchical policy enforcement (platform team overrides application team policies), use Calico's GlobalNetworkPolicy with `order` field (lower number = higher priority, evaluated first), or CiliumClusterwideNetworkPolicy. Without these, a developer who creates an overly permissive NetworkPolicy in their namespace can bypass platform-level restrictions. Document this behavior explicitly in your organization's security runbook.

### Webhook and API Server Connectivity in Hardened Clusters

When applying default-deny NetworkPolicy to the `kube-system` or workload namespaces, admission webhooks (ValidatingWebhookConfiguration, MutatingWebhookConfiguration) will fail if the API server cannot reach the webhook service. The API server initiates a connection to the webhook service from its own network (node IP), not from a pod IP. This means NetworkPolicy egress rules on webhook pods must allow ingress from the node CIDR (not just pod CIDR). A common symptom: pods fail to create with the error `failed calling webhook` immediately after applying a NetworkPolicy. Fix by adding an ingress rule allowing TCP from the node subnet CIDR to the webhook pod's service port.

---

## Example

**Input:** "We're building a multi-tenant SaaS platform on AWS EKS (Kubernetes 1.29). Each customer gets their own namespace. We have ~50 microservices per tenant, expect to grow to 200 tenants (10,000 services total), need to enforce strict tenant isolation, and want to expose APIs over HTTPS with per-tenant subdomains. We're on m5.xlarge nodes (4 vCPU, 16GB) with autoscaling 5-100 nodes. PCI-DSS compliance is required."

---

**Output:**

### Architecture Decision Summary

```
Cluster: saas-production
Cloud Provider: AWS EKS
Kubernetes Version: 1.29
CNI Plugin: Cilium 1.15 (replacing AWS VPC CNI at this scale)
Data Plane Mode: eBPF (kube-proxy replacement enabled)
kube-proxy Replacement: Yes -- required at 10,000+ services to avoid iptables explosion

IP Allocation:
  Pod CIDR:     100.64.0.0/10   (4 million pod IPs -- sufficient for 100 nodes * 110 pods)
  Service CIDR: 172.20.0.0/16   (65,535 service IPs -- sufficient for 10,000 services)
  Node Subnet:  10.0.0.0/16     (AWS VPC, nodes use real VPC IPs)

Service Mesh: Istio 1.20 (STRICT mTLS for PCI-DSS in-transit encryption)
mTLS Enforcement: STRICT (all service-to-service traffic encrypted)
Ingress Controller: AWS Load Balancer Controller (ALB) + NGINX Ingress for tenant routing
TLS Management: cert-manager 1.13 with Let's Encrypt (DNS-01 via Route53) for tenant subdomains
```

### Rationale for Key Decisions

**Why Cilium over AWS VPC CNI:** At 10,000 services, kube-proxy iptables mode (default on EKS) generates 500,000+ iptables rules. With m5.xlarge nodes handling tenant traffic, iptables rule processing overhead would add 5-15ms latency per packet and consume 20-30% of CPU time on busy nodes. Cilium eBPF replaces kube-proxy entirely, uses O(1) BPF map lookups, and provides the L7-aware NetworkPolicy needed for PCI-DSS tenant isolation. The kernel requirement (5.10+) is satisfied by the EKS-optimized Amazon Linux 2023 AMI.

**Why Istio for mTLS:** PCI-DSS Requirement 4.2.1 mandates encryption of cardholder data in transit. With 50 microservices per tenant, implementing mTLS in application code is impractical. Istio's automatic sidecar injection enforces STRICT mTLS cluster-wide without application changes, and the Envoy access logs provide the audit trail required by PCI-DSS Requirement 10.

**Why not use a single NGINX Ingress for all tenants:** At 200 tenants each with a unique subdomain (`tenant-abc.api.example.com`), a single NGINX deployment becomes a bottleneck and a blast radius risk. Each tenant's Ingress resource is served by a shared NGINX, meaning a malformed tenant Ingress config can affect all tenants. Deploy one AWS ALB as the external entry point (handles TLS termination at cloud layer) with path/host routing to per-tier NGINX Ingress controllers.

---

### CNI Installation (Cilium on EKS)

```bash
# Remove default aws-node DaemonSet (AWS VPC CNI) before installing Cilium
kubectl patch daemonset aws-node -n kube-system \
  -p '{"spec":{"template":{"spec":{"nodeSelector":{"io.cilium/aws-node-enabled":"true"}}}}}'

# Install Cilium via Helm
helm repo add cilium https://helm.cilium.io/
helm install cilium cilium/cilium --version 1.15.0 \
  --namespace kube-system \
  --set kubeProxyReplacement=true \
  --set k8sServiceHost=<EKS_API_ENDPOINT> \
  --set k8sServicePort=443 \
  --set nodeinit.enabled=true \
  --set ipam.mode=cluster-pool \
  --set ipam.operator.clusterPoolIPv4PodCIDRList="100.64.0.0/10" \
  --set ipam.operator.clusterPoolIPv4MaskSize=24 \
  --set hubble.enabled=true \
  --set hubble.relay.enabled=true \
  --set hubble.ui.enabled=true \
  --set encryption.enabled=true \
  --set encryption.type=wireguard  # pod-to-pod encryption for PCI-DSS

# Verify Cilium is operational
cilium status --wait
cilium connectivity test
```

---

### Tenant Namespace Setup (Applied Per Tenant Onboarding)

```yaml
# tenant-namespace.yaml
# Applied at tenant onboarding time via GitOps (ArgoCD/Flux)
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-<tenant-id>
  labels:
    # Required for NetworkPolicy namespaceSelector matching
    kubernetes.io/metadata.name: tenant-<tenant-id>
    tenant-id: <tenant-id>
    pci-scope: "true"         # marks namespace for PCI-DSS audit
    istio-injection: enabled  # auto-inject Envoy sidecar
---
# Step 1: Default deny ALL traffic in this namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: tenant-<tenant-id>
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
# Step 2: Allow DNS -- CRITICAL, must be applied alongside deny-all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: tenant-<tenant-id>
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
---
# Step 3: Allow intra-tenant traffic (pods within same tenant namespace can communicate)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-intra-tenant
  namespace: tenant-<tenant-id>
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector: {}    # any pod in THIS namespace (same tenant)
  egress:
  - to:
    - podSelector: {}    # any pod in THIS namespace (same tenant)
---
# Step 4: Allow ingress from NGINX ingress controller namespace only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-controller
  namespace: tenant-<tenant-id>
spec:
  podSelector:
    matchLabels:
      tier: api-gateway   # only the API gateway pods receive external traffic
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
```

---

### L7-Aware CiliumNetworkPolicy (PCI-DSS Path Restriction)

```yaml
# cilium-l7-policy.yaml
# Restricts access to payment service -- only specific HTTP methods/paths allowed
# Standard NetworkPolicy cannot enforce this; requires Cilium's L7 capability
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: restrict-payment-service
  namespace: tenant-<tenant-id>
spec:
  endpointSelector:
    matchLabels:
      app: payment-service
  ingress:
  - fromEndpoints:
    - matchLabels:
        app: checkout-service
    toPorts:
    - ports:
      - port: "8080"
        protocol: TCP
      rules:
        http:
        - method: POST
          path: /api/v1/payments
        - method: GET
          path: /api/v1/payments/[0-9a-f-]+   # UUID path only
        # All other methods and paths are implicitly denied
```

---

### Istio PeerAuthentication for STRICT mTLS

```yaml
# istio-mtls.yaml
# Enforce STRICT mTLS across all tenant namespaces
# Apply cluster-wide via root namespace, overrideable per-namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default-strict-mtls
  namespace: istio-system  # root namespace -- applies cluster-wide
spec:
  mtls:
    mode: STRICT
---
# Per-namespace override for healthcheck endpoints that cannot use mTLS
# (e.g., AWS ALB health probes that come from outside the mesh)
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: permissive-healthcheck
  namespace: tenant-<tenant-id>
spec:
  selector:
    matchLabels:
      app: api-gateway
  mtls:
    mode: STRICT
  portLevelMtls:
    "9090":                # health check port
      mode: PERMISSIVE     # ALB cannot present mTLS cert
```

---

### Ingress for Per-Tenant Subdomain Routing

```yaml
# tenant-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tenant-api-ingress
  namespace: tenant-<tenant-id>
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "5m"
    # PCI-DSS: force TLS 1.2 minimum
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
    nginx.ingress.kubernetes.io/ssl-ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384"
    # Rate limiting: 200 req/sec per tenant subdomain
    nginx.ingress.kubernetes.io/limit-rps: "200"
    nginx.ingress.kubernetes.io/limit-connections: "50"
    # cert-manager will provision and renew this certificate automatically
    cert-manager.io/cluster-issuer: letsencrypt-production
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - <tenant-id>.api.example.com
    secretName: tenant-<tenant-id>-tls
  rules:
  - host: <tenant-id>.api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              name: http
```

---

### CoreDNS Tuning ConfigMap

```yaml
# coredns-configmap.yaml
# Tuned for 100-node cluster with high DNS query volume
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
        errors
        health {
          lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
          pods insecure
          fallthrough in-addr.arpa ip6.arpa
          ttl 30
        }
        prometheus :9153
        forward . /etc/resolv.conf {
          max_concurrent 1000         # increase from default 150 for high-QPS clusters
          prefer_udp
        }
        cache 30 {                    # 30s positive cache TTL
          denial 5                    # 5s negative cache TTL
          prefetch 10 1m 10%          # prefetch entries accessed >10 times/min
        }
        loop
        reload
        loadbalance
    }
```

```yaml
# co
