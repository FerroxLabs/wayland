---
name: threat-modeling-expert
description: |
  Advanced threat modeling covering STRIDE and PASTA methodologies, attack tree construction, threat libraries, DREAD and CVSS risk scoring, security requirements derivation, data flow diagrams, trust boundary analysis, threat modeling for APIs and microservices and cloud architectures, and integration into SDLC.
  Use when the user asks about threat modeling expert, threat modeling expert best practices, or needs guidance on threat modeling expert implementation.
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

# Threat Modeling Expert

## Overview

Threat modeling is the structured process of identifying what can go wrong in a system's security and deciding what to do about it. This skill goes beyond basic STRIDE analysis to cover multiple methodologies, quantitative risk scoring, automated threat identification, security requirements derivation, and embedding threat modeling into the development lifecycle as a continuous practice rather than a one-time exercise.

## Methodology Selection

| Methodology | Focus | Best For | Effort | Output |
|-------------|-------|----------|--------|--------|
| STRIDE | Technical threats per component | Developer-led modeling | Medium | Threat list per element |
| PASTA | Risk-centric, business aligned | Enterprise applications | High | Risk-ranked threat list |
| Attack Trees | Specific attack goal analysis | Focused threat analysis | Low-Med | Attack path diagrams |
| LINDDUN | Privacy threats | GDPR/privacy-sensitive apps | Medium | Privacy threat catalog |
| VAST | Scalable, automated | Large organizations | High | Application + operational models |

## STRIDE Deep Dive

### Per-Element Analysis

```
STRIDE Category        Applies To              Example Threat
------------------------------------------------------------------------
Spoofing               External entities,      Attacker impersonates admin
                       processes               via stolen JWT

Tampering              Data flows,             Man-in-the-middle modifies
                       data stores             API response payload

Repudiation            Processes,              User denies placing order,
                       external entities       no audit trail exists

Information            Data flows,             Database backup exposed
Disclosure             data stores             on public S3 bucket

Denial of Service      Processes,              API flooded with requests,
                       data stores             exhausting connection pool

Elevation of           Processes               Regular user accesses admin
Privilege                                      endpoint via IDOR
```

### STRIDE Analysis Template

```yaml
system: "Payment Processing Service"
date: "2024-06-15"
participants: ["security-lead", "backend-lead", "product-owner"]
scope: "Payment submission flow from checkout to processor"

data_flow_elements:
  - id: EE1
    type: external_entity
    name: "Customer Browser"
    trust_level: untrusted

  - id: P1
    type: process
    name: "API Gateway"
    trust_level: semi-trusted

  - id: P2
    type: process
    name: "Payment Service"
    trust_level: trusted

  - id: DS1
    type: data_store
    name: "Payment DB"
    trust_level: trusted
    data_classification: highly_restricted

  - id: DF1
    type: data_flow
    name: "HTTPS: Checkout -> Gateway"
    from: EE1
    to: P1
    data: "Card number, amount, billing address"

trust_boundaries:
  - name: "Internet boundary"
    between: [EE1, P1]
  - name: "DMZ to internal"
    between: [P1, P2]
  - name: "Service to database"
    between: [P2, DS1]

threats:
  - id: T1
    element: DF1
    stride: [Spoofing, Tampering, Information_Disclosure]
    description: "Attacker intercepts payment data in transit"
    attack_vector: "SSL stripping, compromised CDN, DNS hijack"
    impact: high
    likelihood: medium
    risk_score: high
    mitigations:
      - "TLS 1.3 with certificate pinning"
      - "HSTS with preload"
      - "Certificate transparency monitoring"
    security_requirements:
      - "SR-001: All payment data encrypted in transit with TLS 1.3+"
      - "SR-002: HSTS header with min-age 31536000 and preload"

  - id: T2
    element: P2
    stride: [Elevation_of_Privilege]
    description: "Attacker manipulates payment amount after validation"
    attack_vector: "Race condition between validation and processing"
    impact: critical
    likelihood: low
    risk_score: high
    mitigations:
      - "Atomic validation-and-charge operation"
      - "Server-side amount recalculation from cart"
      - "Idempotency keys prevent replay"
    security_requirements:
      - "SR-003: Payment amount derived server-side, never from client"
      - "SR-004: Idempotency key required for all payment submissions"
```

## PASTA Methodology (7 Stages)

```
Stage 1: Define Objectives
  - Business objectives at risk
  - Compliance requirements (PCI-DSS, SOC 2, GDPR)
  - Risk appetite and tolerance thresholds

Stage 2: Define Technical Scope
  - Application architecture diagrams
  - Infrastructure topology
  - Data flow across boundaries
  - Third-party integrations

Stage 3: Application Decomposition
  - Identify entry points and exit points
  - Map data assets and classification
  - Enumerate user roles and privilege levels
  - Document trust boundaries

Stage 4: Threat Analysis
  - Research relevant threat intelligence
  - Map threats to MITRE ATT&CK techniques
  - Identify applicable threat actors
  - Review historical incidents for similar systems

Stage 5: Vulnerability Analysis
  - Map known CVEs to technology stack
  - Review past penetration test findings
  - Analyze code scan results (SAST/DAST)
  - Evaluate configuration weaknesses

Stage 6: Attack Modeling
  - Build attack trees for high-value targets
  - Simulate attack paths end-to-end
  - Determine probability of each path
  - Identify required attacker capabilities

Stage 7: Risk and Impact Analysis
  - Calculate risk scores (likelihood x impact)
  - Prioritize by business impact
  - Define countermeasures per risk level
  - Derive security requirements and test cases
```

## Attack Trees

### Construction Method

```
Goal: Exfiltrate customer PII from database
├── AND: Gain database access
│   ├── OR: Obtain credentials
│   │   ├── Phishing database admin [Cost: Low, Skill: Low]
│   │   ├── Exploit credential leak in repo [Cost: Low, Skill: Med]
│   │   ├── SQL injection via application [Cost: Low, Skill: Med]
│   │   └── Compromise CI/CD to extract secrets [Cost: Med, Skill: High]
│   └── OR: Bypass network controls
│       ├── Exploit VPN vulnerability [Cost: Med, Skill: High]
│       ├── Pivot through compromised app server [Cost: Med, Skill: Med]
│       └── Social engineer network access [Cost: Low, Skill: Med]
├── AND: Extract data
│   ├── OR: Direct query
│   │   ├── SELECT * from sensitive tables [Detectable: High]
│   │   └── Incremental extraction (low volume) [Detectable: Low]
│   └── OR: Indirect extraction
│       ├── Database backup to attacker storage [Detectable: Med]
│       └── Replicate to external server [Detectable: Med]
└── AND: Exfiltrate
    ├── OR: Network exfiltration
    │   ├── HTTPS to attacker C2 [Detectable: Low]
    │   ├── DNS tunneling [Detectable: Med]
    │   └── Cloud storage upload [Detectable: Med]
    └── OR: Physical exfiltration
        └── USB/removable media [Detectable: High if DLP]
```

### Quantitative Attack Tree Analysis

```python
class AttackTreeNode:
    def __init__(self, name, node_type='OR', cost=0, skill=0, time_days=0, detectable=0.5):
        self.name = name
        self.node_type = node_type  # AND or OR
        self.cost = cost            # Dollar cost to attacker
        self.skill = skill          # 0-10 skill level required
        self.time_days = time_days  # Days to execute
        self.detectable = detectable  # 0.0-1.0 probability of detection
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        return child

    def calculate_metrics(self):
        """Compute aggregate metrics up the tree."""
        if not self.children:
            return {
                'cost': self.cost,
                'skill': self.skill,
                'time': self.time_days,
                'detection_prob': self.detectable,
                'feasibility': self._feasibility_score(),
            }

        child_metrics = [c.calculate_metrics() for c in self.children]

        if self.node_type == 'AND':
            # AND: all children must succeed
            return {
                'cost': sum(m['cost'] for m in child_metrics),
                'skill': max(m['skill'] for m in child_metrics),
                'time': sum(m['time'] for m in child_metrics),
                'detection_prob': 1 - prod(1 - m['detection_prob'] for m in child_metrics),
                'feasibility': min(m['feasibility'] for m in child_metrics),
            }
        else:
            # OR: attacker chooses easiest path
            best = max(child_metrics, key=lambda m: m['feasibility'])
            return best

    def _feasibility_score(self):
        """0-100 score of how feasible this attack step is."""
        cost_factor = max(0, 100 - self.cost / 100)
        skill_factor = max(0, 100 - self.skill * 10)
        time_factor = max(0, 100 - self.time_days * 5)
        detection_factor = (1 - self.detectable) * 100
        return (cost_factor + skill_factor + time_factor + detection_factor) / 4
```

## Risk Scoring

### DREAD Scoring

```yaml
scoring_model: DREAD
scale: 1-10

dimensions:
  Damage:
    description: "How severe is the impact if exploited?"
    1: "Minimal impact, no data loss"
    5: "Individual user data compromised"
    10: "Complete system compromise, mass data breach"

  Reproducibility:
    description: "How easy is it to reproduce the attack?"
    1: "Requires specific rare conditions"
    5: "Can be reproduced with some effort"
    10: "Trivially reproducible every time"

  Exploitability:
    description: "What tools/skills are needed?"
    1: "Requires custom zero-day exploit"
    5: "Existing tools with moderate skill"
    10: "Script kiddie with public exploit"

  Affected_Users:
    description: "How many users are impacted?"
    1: "Single user in rare condition"
    5: "Subset of users (one segment/region)"
    10: "All users affected"

  Discoverability:
    description: "How easy is it to find the vulnerability?"
    1: "Requires source code access + deep analysis"
    5: "Discoverable through fuzzing/scanning"
    10: "Publicly known or obvious"

risk_calculation: "(D + R + E + A + D) / 5"
risk_levels:
  critical: ">= 9"
  high: ">= 7"
  medium: ">= 4"
  low: "< 4"
```

## Security Requirements Derivation

### From Threats to Requirements

```
Threat -> Mitigation Strategy -> Security Requirement -> Test Case

Example chain:
  T: SQL injection in search endpoint
  M: Parameterized queries + input validation + WAF
  SR-010: All database queries MUST use parameterized statements
  SR-011: User input MUST be validated against allowlist before use in queries
  SR-012: WAF rule must block common SQLi patterns
  TC-010: Attempt SQL injection payloads on search endpoint -> blocked
  TC-011: Review code for string concatenation in queries -> none found
  TC-012: Run SQLMap against search endpoint -> no findings
```

### Requirements Categorization

```yaml
security_requirements:
  authentication:
    - id: SR-AUTH-001
      derived_from: [T1, T5]
      requirement: "Multi-factor authentication required for admin accounts"
      priority: critical
      verification: "Attempt admin login with only password -> rejected"

  authorization:
    - id: SR-AUTHZ-001
      derived_from: [T2, T8]
      requirement: "API endpoints enforce RBAC checked server-side"
      priority: critical
      verification: "Access admin endpoint with user token -> 403"

  data_protection:
    - id: SR-DATA-001
      derived_from: [T3, T7]
      requirement: "PII encrypted at rest with AES-256"
      priority: high
      verification: "Examine database storage -> encrypted columns confirmed"

  logging:
    - id: SR-LOG-001
      derived_from: [T4]
      requirement: "All authentication events logged with user, IP, timestamp"
      priority: high
      verification: "Perform login -> verify audit log entry exists"
```

## Cloud Architecture Threat Model

```yaml
cloud_threats:
  - category: "Identity and Access"
    threats:
      - "Overly permissive IAM roles (wildcard permissions)"
      - "Long-lived access keys not rotated"
      - "Cross-account role assumption abuse"
    mitigations:
      - "Least-privilege IAM policies, reviewed quarterly"
      - "Short-lived credentials via assume-role"
      - "AWS Access Analyzer for policy validation"

  - category: "Network"
    threats:
      - "Public S3 buckets or database endpoints"
      - "Missing VPC flow logs"
      - "Unrestricted security group ingress"
    mitigations:
      - "S3 Block Public Access at account level"
      - "VPC flow logs to CloudWatch"
      - "Security group audit via AWS Config rules"

  - category: "Data"
    threats:
      - "Unencrypted data at rest"
      - "Secrets in environment variables or code"
      - "Backup data accessible without authorization"
    mitigations:
      - "Default encryption on all storage services"
      - "AWS Secrets Manager / Parameter Store"
      - "Backup encryption and access logging"

  - category: "Compute"
    threats:
      - "Container escape from pod to node"
      - "SSRF from Lambda/EC2 to metadata service"
      - "Supply chain attack via compromised base image"
    mitigations:
      - "Pod security standards (restricted)"
      - "IMDSv2 required, SSRF protection"
      - "Signed and scanned base images only"
```

## Threat Modeling Integration in SDLC

```
Phase           Activity                          Owner
----------------------------------------------------------------------
Design          Full threat model for new          Security + Architecture
                services or major features

Sprint Planning Lightweight threat review for      Dev team + security
                stories touching auth, data,       champion
                or external interfaces

Pull Request    Automated SAST checks,             CI/CD pipeline
                dependency scan

Pre-Release     Threat model review for scope      Security team
                changes, new attack surface

Post-Incident   Update threat model with           Incident response +
                lessons learned                    security team
```

## Threat Modeling Workshop Facilitation

```
Agenda (2 hours):
  0:00 - Context setting (10 min)
    - System overview, what's in scope
    - Known security concerns

  0:10 - Data flow diagram (20 min)
    - Draw components, data flows, trust boundaries
    - Identify external entities and data stores

  0:30 - STRIDE analysis (40 min)
    - Walk each element, brainstorm threats per category
    - Record on shared board, no filtering yet

  1:10 - Risk scoring (20 min)
    - Score each threat (DREAD or simple High/Med/Low)
    - Quick voting for disagreements

  1:30 - Mitigations (20 min)
    - Identify mitigations for High and Critical threats
    - Note existing controls vs gaps

  1:50 - Action items (10 min)
    - Assign security requirements to teams
    - Set review cadence
    - Document in threat model registry

Output artifacts:
  - Data flow diagram (DFD)
  - Threat register (ID, description, STRIDE, risk, mitigation, owner)
  - Security requirements list
  - Action items with owners and deadlines
```

## When to Use

**Use this skill when:**
- Designing or implementing threat modeling expert solutions
- Reviewing or improving existing threat modeling expert approaches
- Making architectural or implementation decisions about threat modeling expert
- Learning threat modeling expert patterns and best practices
- Troubleshooting threat modeling expert-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Threat Modeling Expert Analysis

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

**Input:** "Help me implement threat modeling expert for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended threat modeling expert approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When threat modeling expert must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
