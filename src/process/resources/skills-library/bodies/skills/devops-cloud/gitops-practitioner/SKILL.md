---
name: gitops-practitioner
description: |
  GitOps expertise covering ArgoCD, Flux, declarative infrastructure management, drift detection and reconciliation, environment promotion strategies, secrets in GitOps, multi-cluster management, and progressive delivery with GitOps workflows.
  Use when the user asks about gitops practitioner, gitops practitioner best practices, or needs guidance on gitops practitioner implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud ci-cd"
  category: "devops-cloud"
  subcategory: "ci-cd-pipelines"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# GitOps Practitioner

You are an expert GitOps practitioner who manages infrastructure and application deployments declaratively through Git. GitOps is not just "infrastructure as code stored in Git." It is a specific operational model: Git is the single source of truth, a reconciliation loop continuously ensures the live state matches the desired state in Git, and all changes flow through pull requests.

## GitOps Principles

### The Four Principles

| Principle | Meaning | Implementation |
|-----------|---------|----------------|
| **Declarative** | System state described, not scripted | Kubernetes manifests, Helm charts |
| **Versioned and Immutable** | Desired state stored in Git | All config in Git, tagged releases |
| **Pulled Automatically** | Agents pull desired state, not pushed by CI | ArgoCD/Flux polls Git |
| **Continuously Reconciled** | Agent corrects drift automatically | Controller loop detects and fixes divergence |

### Push-Based vs Pull-Based

```
PUSH-BASED (traditional CI/CD):
  Developer -> Git -> CI Pipeline -> kubectl apply -> Cluster
  PROBLEMS:
  - CI system has cluster credentials (security risk)
  - No drift detection (manual changes go unnoticed)

PULL-BASED (GitOps):
  Developer -> Git <- Agent (in cluster) -> Cluster
  BENEFITS:
  - Agent runs INSIDE the cluster (no external credentials)
  - Continuous reconciliation (drift auto-corrected)
  - Git is the audit log
```

## ArgoCD

### Application Definition

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-api
  namespace: argocd
spec:
  project: default
  source:
    repoURL: [reference URL]
    targetRevision: main
    path: apps/my-api/overlays/production
  destination:
    server: [reference URL]
    namespace: my-api
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### App of Apps Pattern

```yaml
# root-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  source:
    repoURL: [reference URL]
    path: apps
    targetRevision: main
  destination:
    server: [reference URL]
    namespace: argocd
  syncPolicy:
    automated:
      selfHeal: true
      prune: true
```

### ApplicationSet

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: cluster-apps
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: [reference URL]
        revision: main
        directories:
          - path: apps/*
  template:
    metadata:
      name: '{{path.basename}}'
    spec:
      project: default
      source:
        repoURL: [reference URL]
        targetRevision: main
        path: '{{path}}'
      destination:
        server: [reference URL]
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

## Flux

### Core Resources

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 1m
  url: [reference URL]
  ref:
    branch: main
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 5m
  path: ./apps/my-api/production
  prune: true
  sourceRef:
    kind: GitRepository
    name: my-app
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: my-api
      namespace: my-api
```

### ArgoCD vs Flux

| Feature | ArgoCD | Flux |
|---------|--------|------|
| **UI** | Full web UI | No built-in UI (use Weave GitOps) |
| **Multi-cluster** | Central control plane | Each cluster runs its own Flux |
| **RBAC** | Granular per-app/project | Kubernetes-native RBAC |
| **Image automation** | ArgoCD Image Updater | Built-in Image Automation |
| **Best for** | Teams wanting UI, multi-cluster | Kubernetes-native, composable |

## Drift Detection

### Types of Drift

| Drift Type | Cause | Fix |
|-----------|-------|-----|
| **Configuration drift** | Manual `kubectl edit` | selfHeal auto-reverts |
| **Desired state drift** | Git not updated after change | Update Git to match intent |
| **Image drift** | Container updated outside Git | Update Git with new image tag |

### Ignoring Managed Fields

```yaml
# ArgoCD: Ignore fields managed by controllers
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas       # Let HPA manage replicas
    - group: ""
      kind: Service
      jqPathExpressions:
        - .spec.clusterIP      # Assigned by Kubernetes
```

## Environment Promotion

### Directory-per-Environment (Recommended)

```
repo/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/
│   │   └── kustomization.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       └── kustomization.yaml
```

Promotion is a PR that updates the overlay for the target environment:

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
patches:
  - target:
      kind: Deployment
      name: my-api
    patch: |
      - op: replace
        path: /spec/replicas
        value: 3
      - op: replace
        path: /spec/template/spec/containers/0/image
        value: registry.com/my-api:v1.2.3
```

### Automated Image Updates (Flux)

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: my-api
spec:
  imageRepositoryRef:
    name: my-api
  policy:
    semver:
      range: ">=1.0.0"
---
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImageUpdateAutomation
metadata:
  name: my-api
spec:
  interval: 5m
  sourceRef:
    kind: GitRepository
    name: my-app
  git:
    commit:
      author:
        name: fluxbot
        email: flux@company.com
      messageTemplate: "chore: update my-api to {{.NewImage}}"
    push:
      branch: main
  update:
    path: ./apps/my-api
    strategy: Setters
```

## Secrets in GitOps

| Approach | Tool | How It Works |
|----------|------|-------------|
| **Sealed Secrets** | Bitnami | Encrypt secrets; only cluster can decrypt |
| **External Secrets** | ESO | Sync from Vault/AWS SM/GCP SM |
| **SOPS** | Mozilla SOPS | Encrypt files in Git with KMS |

```yaml
# External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: my-api-secrets
spec:
  refreshInterval: 5m
  secretStoreRef:
    name: aws-secretsmanager
    kind: ClusterSecretStore
  target:
    name: my-api-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: production/my-api
        property: database_url
```

## Common Anti-Patterns

1. **Pushing from CI instead of pulling**: Running `kubectl apply` from CI pipelines gives CI cluster credentials and bypasses reconciliation. Use CI to update Git; let the agent deploy.

2. **Manual kubectl edits**: Changes get overwritten by reconciliation or create undetected drift. All changes go through Git.

3. **Storing secrets in Git unencrypted**: Use Sealed Secrets, External Secrets Operator, or SOPS.

4. **One repo for app code and manifests**: Every app commit triggers a deployment. Separate repos for source and manifests.

5. **Ignoring health checks**: Without health checks, broken deployments show as "synced."

## GitOps Checklist

- [ ] GitOps agent installed (ArgoCD or Flux) in each cluster
- [ ] Manifests in dedicated Git repo (separate from app source)
- [ ] Kustomize overlays per environment
- [ ] Auto-sync with selfHeal and prune enabled
- [ ] Drift detection alerting configured
- [ ] Secrets via External Secrets Operator or Sealed Secrets
- [ ] Health checks configured for all applications
- [ ] RBAC configured for sync/supersede permissions
- [ ] Image update automation for non-production environments
- [ ] PR-based promotion workflow documented
- [ ] Notifications on sync failures (Slack/Teams)
- [ ] Disaster recovery tested (restore cluster from Git)

## When to Use

**Use this skill when:**
- Designing or implementing gitops practitioner solutions
- Reviewing or improving existing gitops practitioner approaches
- Making architectural or implementation decisions about gitops practitioner
- Learning gitops practitioner patterns and best practices
- Troubleshooting gitops practitioner-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Gitops Practitioner Analysis

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

**Input:** "Help me implement gitops practitioner for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended gitops practitioner approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When gitops practitioner must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
