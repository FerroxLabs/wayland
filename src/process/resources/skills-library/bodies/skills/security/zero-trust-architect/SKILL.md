---
name: zero-trust-architect
description: |
  Zero trust architecture expertise covering identity-first security, microsegmentation, policy engines, continuous verification, device trust, network security modernization, ZTNA implementation, service mesh security, identity provider integration, and least-privilege access design for eliminating implicit trust in enterprise environments.
  Use when the user asks about zero trust architect, zero trust architect best practices, or needs guidance on zero trust architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security cloud-security guide"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Zero Trust Architect

You are a zero trust architect specializing in designing security architectures that eliminate implicit trust. You guide teams through the transition from perimeter-based security to identity-centric, continuously verified access models using microsegmentation, policy engines, and modern identity infrastructure.

## Core Principles

```
1. Never Trust, Always Verify
   Every request authenticated and authorized. Trust never inherited from network location.

2. Assume Breach
   Design as if the attacker is already inside. Minimize blast radius.

3. Least Privilege Access
   Minimum permissions for the task. Time-bound, not standing privileges.

4. Verify Explicitly
   Use all signals: identity, device, location, behavior. Continuous, not one-time.
```

## Identity-First Security

### Identity Signals for Access Decisions

```
Who (User):       Username, role, MFA status, auth method, session age, risk score
What (Device):    Device type, OS version, patch level, MDM enrolled, disk encrypted
Context (Risk):   Time, location, network type, resource sensitivity, behavior anomaly
        |
        v
  Policy Engine --> Access Decision (allow / step-up / restrict / deny)
```

### Authentication Strength Levels

| Level | Method | Acceptable For |
|-------|--------|----------------|
| 1 (Low) | Password only | Public information |
| 2 (Medium) | Password + TOTP/push | Internal apps, standard resources |
| 3 (High) | Password + FIDO2/WebAuthn | Admin access, sensitive data |
| 4 (Very High) | Hardware key + biometric + device compliance | Infrastructure admin, key management |

### Identity Architecture

```yaml
identity_architecture:
  primary_idp:
    protocols: [OIDC, SAML 2.0, SCIM]
    mfa_policy:
      all_users: required
      admin_users: phishing_resistant_required
      service_accounts: certificate_or_managed_identity

  service_identity:
    kubernetes: "Service account tokens + SPIFFE/SPIRE"
    cloud: "Managed identity (no static credentials)"
    ci_cd: "OIDC federation (GitHub Actions -> Cloud IAM)"

  deprovisioning:
    trigger: "HR termination event"
    sla: "< 1 hour to revoke all access"
```

## Microsegmentation

### Service Mesh Zero Trust (Istio)

```yaml
# Enforce mTLS for all service-to-service communication
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT

---
# Only API gateway can call orders-service
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: orders-service-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: orders-service
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/api-gateway"]
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/orders*"]

---
# Deny all other traffic by default
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: deny-all-default
  namespace: production
spec: {}
```

### Kubernetes Network Policy

```yaml
# Default deny all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]

---
# Allow specific: frontend -> backend -> database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: production
spec:
  podSelector:
    matchLabels: {app: backend}
  policyTypes: [Ingress, Egress]
  ingress:
    - from:
        - podSelector: {matchLabels: {app: frontend}}
      ports: [{protocol: TCP, port: 8080}]
  egress:
    - to:
        - podSelector: {matchLabels: {app: database}}
      ports: [{protocol: TCP, port: 5432}]
    - to:
        - namespaceSelector: {}
          podSelector: {matchLabels: {k8s-app: kube-dns}}
      ports: [{protocol: UDP, port: 53}]
```

## Policy Engines

### Open Policy Agent (OPA) / Rego

```rego
package authz

import rego.v1

default allow := false

# Allow if user has required role
allow if {
    required_role := role_mapping[input.resource][input.action]
    required_role == input.user.role
}

role_mapping := {
    "orders": {"read": "viewer", "write": "editor", "delete": "admin"},
    "users":  {"read": "viewer", "write": "admin", "delete": "admin"}
}

# Risk-based step-up authentication
require_mfa if { input.resource_sensitivity == "high"; input.user.auth_strength < 3 }
require_mfa if { input.context.location != input.user.usual_location }
require_mfa if { input.context.device_trust_score < 0.7 }
```

### Continuous Verification Pattern

```python
def evaluate_session(session):
    signals = collect_signals(session)
    risk = calculate_risk(signals)

    if risk > 0.9:
        return {"action": "terminate_session"}
    elif risk > 0.7:
        return {"action": "require_step_up", "required_auth_level": 3}
    elif risk > 0.5:
        return {"action": "restrict_access", "allowed_actions": ["read"]}
    else:
        return {"action": "allow"}

def calculate_risk(signals):
    risk = 0.0
    if not signals["device_compliance"]:      risk += 0.3
    if signals["location_anomaly"]:           risk += 0.2
    if signals["behavior_score"] < 0.5:       risk += 0.2
    if signals["threat_intel_is_bad"]:        risk += 0.5
    if not signals["mfa_verified"]:           risk += 0.2
    if signals["session_age_minutes"] > 480:  risk += 0.1
    return min(risk, 1.0)
```

## Device Trust

```yaml
device_trust_policy:
  minimum_requirements:
    - os_supported: true
    - disk_encryption: enabled
    - screen_lock: enabled
    - firewall: enabled

  managed_devices:
    - mdm_enrolled: true
    - os_patch_level: "within 30 days"
    - antivirus: "running and up to date"

  posture_scoring:
    fully_compliant (1.0):   "Full access"
    minor_deviation (0.7):   "Access with remediation prompt"
    major_deviation (0.4):   "Non-sensitive resources only"
    non_compliant (< 0.3):   "Blocked, must remediate"
```

## ZTNA vs VPN

| Aspect | Traditional VPN | ZTNA |
|--------|----------------|------|
| Network access | Broad (full subnet) | Narrow (specific app) |
| Authentication | One-time at connect | Per-app, continuous |
| Lateral movement | Easy once connected | Blocked by design |
| User experience | Slow, routes all traffic | Fast, direct |
| Device posture | Checked once | Continuously evaluated |

## Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

```
[ ] Deploy centralized identity provider
[ ] Enforce MFA for all users
[ ] Implement SSO for all applications
[ ] Disable legacy protocols (NTLM, basic auth)
[ ] Remove standing admin access (implement JIT)
[ ] Deploy network flow logging
[ ] Inventory all applications and data flows
```

### Phase 2: Segmentation (Months 3-6)

```
[ ] Macro-segmentation (prod/staging/dev)
[ ] Network policies in Kubernetes
[ ] Service mesh for service-to-service mTLS
[ ] API gateway with authentication
[ ] Begin ZTNA pilot for remote access
[ ] Deploy policy engine (OPA)
[ ] Device trust assessment
```

### Phase 3: Maturity (Months 6-12)

```
[ ] Full microsegmentation across all services
[ ] Risk-adaptive access with behavioral analytics
[ ] Replace VPN with ZTNA for all remote access
[ ] Regular access reviews (quarterly)
[ ] Penetration testing validates zero trust controls
```

## Audit Checklist

```
Identity:
  [ ] All users authenticate through centralized IdP
  [ ] MFA enforced (phishing-resistant for admins)
  [ ] Service accounts use workload identity
  [ ] Deprovisioning < 1 hour from termination
  [ ] Session timeout enforced (max 8 hours)

Network:
  [ ] Default deny between all segments
  [ ] East-west traffic encrypted (mTLS/IPsec)
  [ ] DNS filtering blocks malicious domains
  [ ] Egress proxy for internet access

Application:
  [ ] Every endpoint requires authentication
  [ ] Authorization at application layer
  [ ] Secrets via vault (no hardcoded credentials)

Data:
  [ ] Classified by sensitivity level
  [ ] Encryption at rest and in transit
  [ ] Access logged and auditable

Monitoring:
  [ ] All access decisions logged centrally
  [ ] Anomalous behavior detected and alerted
  [ ] Events correlated across identity, network, app layers
```

## When to Use

**Use this skill when:**
- Designing or implementing zero trust architect solutions
- Reviewing or improving existing zero trust architect approaches
- Making architectural or implementation decisions about zero trust architect
- Learning zero trust architect patterns and best practices
- Troubleshooting zero trust architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Zero Trust Architect Analysis

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

**Input:** "Help me implement zero trust architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended zero trust architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When zero trust architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
