---
name: threat-modeler
description: |
  Threat modeling expertise covering STRIDE methodology, attack trees, data flow diagrams, trust boundaries, threat prioritization with DREAD scoring, mitigation strategies, threat modeling for APIs and microservices, and automated threat modeling tools for proactively identifying security risks during system design.
  Use when the user asks about threat modeler, threat modeler best practices, or needs guidance on threat modeler implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security threat-modeling guide"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Threat Modeler

## Overview

Threat modeling is the practice of identifying security threats to a system during the design phase, before code is written. It answers four fundamental questions: What are we building? What can go wrong? What are we going to do about it? Did we do a good enough job? This skill covers the methodologies, tools, and frameworks for systematic threat identification and risk assessment.

## The Four Questions of Threat Modeling

```
1. WHAT ARE WE BUILDING?
   -> Data Flow Diagrams (DFD)
   -> Architecture diagrams
   -> Asset inventory

2. WHAT CAN GO WRONG?
   -> STRIDE analysis
   -> Attack trees
   -> Known vulnerability patterns

3. WHAT ARE WE GOING TO DO ABOUT IT?
   -> Mitigations for each threat
   -> Accept, mitigate, transfer, or avoid

4. DID WE DO A GOOD ENOUGH JOB?
   -> Review completeness
   -> Validate mitigations
   -> Update as system evolves
```

## Data Flow Diagrams (DFD)

### DFD Elements

```
Elements:
  [Rectangle]    = External Entity (users, third-party services)
  (Circle)       = Process (application logic, services)
  [== lines ==]  = Data Store (database, file system, cache)
  -->            = Data Flow (network request, function call)
  --- --- ---    = Trust Boundary (network perimeter, auth boundary)

Levels:
  DFD Level 0: Context diagram (entire system as one process)
  DFD Level 1: Major components and their interactions
  DFD Level 2: Detailed view of individual components
```

### Example: E-Commerce Application

```
DFD Level 1:

+------------------+
|  Trust Boundary:  |
|  Internet         |
|                   |
| [Web Browser]     |
|  [Mobile App]     |
+--------|---------+
         |
    HTTPS (TLS 1.3)
         |
+---------v---------+
|  Trust Boundary:   |
# ... (condensed) ...
+----------------------------------------------------+
                                        |
                                   External API
                                        |
                              [Payment Processor]
```

### Detailed Data Flow Specification

```yaml
data_flows:
  - id: DF-001
    name: User Login
    source: Web Browser
    destination: Auth Service
    protocol: HTTPS (TLS 1.3)
    data: "username, password"
    classification: confidential
    trust_boundary_crossed: Internet -> DMZ -> Internal
    authentication: None (pre-auth flow)

  - id: DF-002
    name: Session Token Return
    source: Auth Service
    # ... (condensed) ...
    protocol: HTTPS
    data: "payment token, amount, currency"
    classification: restricted (PCI)
    trust_boundary_crossed: Internal -> External
    authentication: API key (server-side)
```

## STRIDE Methodology

STRIDE is a threat classification framework developed by Microsoft. Each letter represents a category of threat.

### STRIDE Categories

```yaml
S - Spoofing:
  definition: "Pretending to be someone or something else"
  targets: Authentication mechanisms
  examples:
    - Forging authentication tokens
    - IP address spoofing
    - DNS spoofing
    - Phishing to steal credentials
  mitigations:
    - Strong authentication (MFA)
    - Certificate-based identity
    - Mutual TLS for service-to-service

T - Tampering:
  # ... (condensed) ...
  mitigations:
    - Principle of least privilege
    - Input validation
    - Secure coding practices
    - Sandboxing and isolation
```

### STRIDE Per Element Analysis

```yaml
# Apply STRIDE to each DFD element

element: API Gateway
  spoofing:
    threat: "Attacker spoofs requests as legitimate client"
    likelihood: medium
    impact: high
    mitigation: "OAuth 2.0 + PKCE, API key validation"

  tampering:
    threat: "Attacker modifies request in transit"
    likelihood: low
    impact: high
    mitigation: "TLS 1.3 enforced, HSTS"
# ... (condensed) ...
  denial_of_service:
    threat: "Expensive queries exhaust database resources"
    likelihood: medium
    impact: high
    mitigation: "Query timeouts, connection pooling, read replicas"
```

## Attack Trees

Attack trees model the steps an attacker might take to achieve a goal.

```
Goal: Steal Customer Payment Data
  |
  +-- 1. Compromise Application Server
  |   +-- 1.1 Exploit web vulnerability
  |   |   +-- 1.1.1 SQL injection in search
  |   |   +-- 1.1.2 RCE via file upload
  |   |   +-- 1.1.3 SSRF to internal services
  |   +-- 1.2 Compromise employee credentials
  |   |   +-- 1.2.1 Phishing attack
  |   |   +-- 1.2.2 Credential stuffing (reused passwords)
  |   |   +-- 1.2.3 Social engineering
  |   +-- 1.3 Supply chain attack
  |       +-- 1.3.1 Compromise npm/pip dependency
  |       +-- 1.3.2 Compromise CI/CD pipeline
  # ... (condensed) ...
  |
  +-- 4. Access Backups/Logs
      +-- 4.1 Unencrypted backup in public S3
      +-- 4.2 Payment data in application logs
      +-- 4.3 Database snapshot accessible
```

### Attack Tree Quantification

```yaml
# Annotate each leaf node with difficulty and impact

attack_tree:
  goal: "Steal Customer Payment Data"
  nodes:
    - id: "1.1.1"
      path: "SQL injection in search"
      difficulty: medium  # CVSS attack complexity
      cost: low           # Resources needed
      detectability: medium
      impact: critical
      controls_in_place:
        - parameterized_queries
        - waf_sqli_rules
      # ... (condensed) ...
      impact: critical
      controls_in_place:
        - s3_bucket_policies
        - encryption_at_rest
      residual_risk: low  # If controls are properly configured
```

## Trust Boundaries

```yaml
trust_boundaries:
  - name: "Internet Boundary"
    between: "External users/services" and "DMZ"
    controls:
      - TLS termination
      - WAF
      - DDoS protection
      - Rate limiting
    threats:
      - All external attack traffic crosses here
      - Must assume all input is malicious

  - name: "DMZ to Internal Network"
    between: "Edge services" and "Backend services"
    # ... (condensed) ...
      - Rate limiting outbound calls
    threats:
      - SSRF via internal services
      - Data leakage to third parties
      - Supply chain compromise of third-party
```

## Threat Prioritization (DREAD)

DREAD scores each threat on five dimensions (1-10 scale):

```yaml
dread_scoring:
  D - Damage:
    question: "How much damage could this cause?"
    scale:
      1-3: "Minor inconvenience"
      4-6: "Significant data loss or service disruption"
      7-9: "Major breach, regulatory impact"
      10: "Complete system compromise"

  R - Reproducibility:
    question: "How easy is it to reproduce the attack?"
    scale:
      1-3: "Requires specific conditions, timing, or insider access"
      4-6: "Reproducible with some effort"
      # ... (condensed) ...
      7-9: "Easily found with automated scanning"
      10: "Publicly known or obvious"

# Overall risk = average of all five scores
# Priority: > 8 Critical, 6-8 High, 4-6 Medium, < 4 Low
```

### Example Threat Assessment

```yaml
threats:
  - id: T-001
    name: "SQL injection in user search"
    stride: [Tampering, Information Disclosure, Elevation of Privilege]
    dread:
      damage: 9        # Full database access
      reproducibility: 8  # Standard SQLi techniques
      exploitability: 7   # Automated tools available
      affected_users: 10  # All users' data at risk
      discoverability: 7  # Found by automated scanners
    dread_score: 8.2
    priority: Critical
    mitigation: "Parameterized queries + WAF + input validation"
    status: mitigated
# ... (condensed) ...
      discoverability: 6  # Requires API testing
    dread_score: 7.4
    priority: High
    mitigation: "Server-side authorization check on every request"
    status: open
```

## Threat Modeling for APIs

```yaml
api_threat_model:
  asset: "REST API /api/v2/*"

  threats:
    authentication:
      - broken_authentication:
          description: "Missing or weak authentication on endpoints"
          check: "Test each endpoint without auth token"
          mitigation: "OAuth 2.0 + PKCE for all endpoints"

      - jwt_manipulation:
          description: "Tampered JWT accepted by server"
          check: "Modify claims, change algorithm, use expired tokens"
          mitigation: "Strict JWT validation (algorithm allowlist, signature, expiry, issuer)"
# ... (condensed) ...

      - lack_of_rate_limiting:
          description: "No rate limits enable abuse"
          check: "Send 1000 requests rapidly"
          mitigation: "Per-user and per-IP rate limiting"
```

## Microservices Threat Modeling

```yaml
microservices_threats:
  service_mesh:
    - unencrypted_service_communication:
        threat: "Internal traffic intercepted"
        mitigation: "mTLS between all services (Istio/Linkerd)"

    - service_impersonation:
        threat: "Rogue service joins the mesh"
        mitigation: "Service identity verification, SPIFFE"

    - lateral_movement:
        threat: "Compromised service accesses other services"
        mitigation: "Network policies, least-privilege service accounts"

  # ... (condensed) ...
        mitigation: "RBAC, network policies, private API endpoint"

    - pod_security:
        threat: "Privileged pod runs malicious code"
        mitigation: "Pod Security Standards (restricted), OPA/Gatekeeper"
```

## Automated Threat Modeling

### Tools

| Tool | Approach | Best For |
|------|----------|----------|
| Microsoft Threat Modeling Tool | DFD-based, STRIDE | Windows/.NET applications |
| OWASP Threat Dragon | DFD-based, open source | General web applications |
| IriusRisk | Questionnaire + library | Enterprise, compliance-driven |
| Threagile | Code-as-model (YAML) | Infrastructure/architecture |
| pytm | Python-based DFD | Developer-friendly, CI integration |

### Threat Model as Code (pytm)

```python
from pytm import TM, Server, Datastore, Dataflow, Boundary, Actor

tm = TM("E-Commerce Application")
tm.description = "Online store with payment processing"

# Define boundaries
internet = Boundary("Internet")
dmz = Boundary("DMZ")
internal = Boundary("Internal Network")

# Define elements
user = Actor("Customer", inBoundary=internet)
api_gw = Server("API Gateway", inBoundary=dmz)
auth_svc = Server("Auth Service", inBoundary=internal)
# ... (condensed) ...
payment_to_stripe.data = "Payment token, amount"

# Generate threat model
tm.process()
# Outputs: DFD diagram, threat list, and report
```

## When to Threat Model

1. **New system design**: Before writing code
2. **Major feature additions**: When architecture changes
3. **Security incidents**: After a breach, reassess the model
4. **Regulatory requirements**: Before compliance audits
5. **Third-party integrations**: When adding new external dependencies
6. **Infrastructure changes**: Cloud migration, new deployment model
7. **Periodic review**: Annually for all production systems

## When to Use

**Use this skill when:**
- Designing or implementing threat modeler solutions
- Reviewing or improving existing threat modeler approaches
- Making architectural or implementation decisions about threat modeler
- Learning threat modeler patterns and best practices
- Troubleshooting threat modeler-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Threat Modeler Analysis

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

**Input:** "Help me implement threat modeler for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended threat modeler approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When threat modeler must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
