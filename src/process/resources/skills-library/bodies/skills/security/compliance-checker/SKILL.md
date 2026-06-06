---
name: compliance-checker
description: |
  Compliance framework audit expertise covering SOC 2 Type II controls, GDPR technical requirements, HIPAA security rule, PCI DSS for developers, ISO 27001 controls, audit evidence collection, compliance-as-code, and continuous compliance monitoring for meeting regulatory and industry security standards.
  Use when the user asks about compliance checker, compliance checker best practices, or needs guidance on compliance checker implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security compliance guide"
  category: "security"
  subcategory: "compliance-audit"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Compliance Checker

## Overview

Compliance is the practice of meeting regulatory, legal, and industry security standards. For engineers, compliance is not paperwork -- it is the implementation of specific technical controls that protect data and systems. This skill covers the technical requirements of major compliance frameworks and how to implement and automate them.

## SOC 2 Type II

SOC 2 is the most common compliance framework for SaaS companies. Type II covers a period of time (typically 6-12 months), not just a point-in-time snapshot.

### Trust Service Criteria (TSC)

```
CC1 - Control Environment
CC2 - Communication and Information
CC3 - Risk Assessment
CC4 - Monitoring Activities
CC5 - Control Activities
CC6 - Logical and Physical Access Controls
CC7 - System Operations
CC8 - Change Management
CC9 - Risk Mitigation

Additional criteria:
A1  - Availability
PI1 - Processing Integrity
C1  - Confidentiality
P1  - Privacy
```

### Key Technical Controls for Engineers

```yaml
# CC6: Logical Access Controls
access_controls:
  - control: CC6.1 - Access Provisioning
    implementation:
      - SSO with SAML/OIDC for all production systems
      - Role-based access control (RBAC) with least privilege
      - Access reviews quarterly (automated via SCIM)
      - Unique user accounts (no shared credentials)
    evidence:
      - IAM policies and role definitions
      - Access review reports (quarterly)
      - SSO provider audit logs

  - control: CC6.2 - Access Revocation
    # ... (condensed) ...
      - Rollback procedures documented
    evidence:
      - Git commit history and PR reviews
      - CI/CD pipeline configuration
      - Deployment logs
```

## GDPR Technical Requirements

### Data Processing Principles (Article 5)

```python
# Technical implementation of GDPR principles

class GDPRCompliantDataProcessor:
    """Implement GDPR data processing principles in code."""

    def process_personal_data(self, data, purpose, legal_basis):
        """
        Article 5(1)(a): Lawfulness, fairness, transparency
        """
        # Verify legal basis exists
        if legal_basis not in ['consent', 'contract', 'legal_obligation',
                                'vital_interests', 'public_task',
                                'legitimate_interests']:
            raise GDPRViolationError("Invalid legal basis")
# ... (condensed) ...
            if field in pseudonymized:
                pseudonymized[field] = hashlib.sha256(
                    (str(pseudonymized[field]) + self.salt).encode()
                ).hexdigest()
        return pseudonymized
```

### Data Subject Rights (Articles 15-22)

```python
class DataSubjectRightsHandler:
    """Handle GDPR data subject requests."""

    def right_of_access(self, user_id):
        """Article 15: Provide all data held about a user."""
        data = {}
        for source in self.data_sources:
            data[source.name] = source.get_all_user_data(user_id)
        return {
            'personal_data': data,
            'processing_purposes': self.get_purposes(user_id),
            'categories': self.get_data_categories(user_id),
            'recipients': self.get_data_recipients(user_id),
            'retention_period': self.get_retention_info(user_id),
            # ... (condensed) ...

    def right_to_portability(self, user_id):
        """Article 20: Export data in machine-readable format."""
        data = self.right_of_access(user_id)
        return json.dumps(data, indent=2, default=str)
```

### Consent Management

```python
class ConsentManager:
    """GDPR-compliant consent management."""

    def record_consent(self, user_id, purpose, version):
        """Record granular, specific consent."""
        consent_record = {
            'user_id': user_id,
            'purpose': purpose,               # Specific purpose
            'consent_version': version,        # Policy version consented to
            'granted_at': datetime.utcnow(),
            'ip_address': get_client_ip(),     # Evidence of consent
            'user_agent': get_user_agent(),
            'method': 'explicit_opt_in',       # How consent was obtained
            'withdrawable': True,
        # ... (condensed) ...
        record = self.db.query(
            'consent_records',
            {'user_id': user_id, 'purpose': purpose, 'withdrawn_at': None}
        )
        return record is not None
```

## HIPAA Security Rule

### Technical Safeguards (164.312)

```yaml
# Required technical safeguards for PHI

access_control:
  unique_user_identification:
    requirement: Assign unique identifier to each user
    implementation: SSO with unique employee IDs
    status: required

  emergency_access:
    requirement: Procedures for accessing PHI in emergencies
    implementation: Break-glass procedure with audit trail
    status: required

  automatic_logoff:
    # ... (condensed) ...
  implementation:
    - TLS 1.2+ for all network communication
    - VPN for remote access to PHI systems
    - Email encryption for PHI (S/MIME or PGP)
    - SFTP for file transfers (never plain FTP)
```

### PHI Data Classification

```python
# Identify and classify PHI fields
PHI_FIELDS = {
    # Direct identifiers (18 HIPAA identifiers)
    'name': {'type': 'direct_identifier', 'deidentify': 'remove'},
    'address': {'type': 'direct_identifier', 'deidentify': 'generalize_to_state'},
    'date_of_birth': {'type': 'direct_identifier', 'deidentify': 'generalize_to_year'},
    'ssn': {'type': 'direct_identifier', 'deidentify': 'remove'},
    'phone': {'type': 'direct_identifier', 'deidentify': 'remove'},
    'email': {'type': 'direct_identifier', 'deidentify': 'remove'},
    'mrn': {'type': 'direct_identifier', 'deidentify': 'pseudonymize'},
    'health_plan_id': {'type': 'direct_identifier', 'deidentify': 'remove'},
    'ip_address': {'type': 'direct_identifier', 'deidentify': 'remove'},
    'biometric': {'type': 'direct_identifier', 'deidentify': 'remove'},
    'photo': {'type': 'direct_identifier', 'deidentify': 'remove'},

    # Clinical data (PHI when combined with identifiers)
    'diagnosis': {'type': 'clinical', 'sensitivity': 'high'},
    'medication': {'type': 'clinical', 'sensitivity': 'high'},
    'lab_results': {'type': 'clinical', 'sensitivity': 'high'},
}
```

## PCI DSS for Developers

### Requirements That Affect Code

```yaml
pci_dss_v4_developer_requirements:

  requirement_3:  # Protect Stored Account Data
    - never_store_full_track_data: true
    - never_store_cvv_after_authorization: true
    - mask_pan_display: "Show only first 6 and last 4 digits"
    - encrypt_pan_at_rest: "AES-256 with key management"
    - use_tokenization: "Replace PAN with non-reversible token"

  requirement_4:  # Protect Data in Transit
    - tls_version: "1.2 minimum, 1.3 preferred"
    - never_send_pan_via: ["email", "chat", "SMS"]

  requirement_6:  # Secure Development
    # ... (condensed) ...

  requirement_11:  # Security Testing
    - vulnerability_scans: "Quarterly by ASV"
    - penetration_test: "Annual (or after significant changes)"
    - file_integrity_monitoring: "Critical system files"
```

### PCI-Compliant Payment Form

```html
<!-- Use hosted payment fields (Stripe Elements, Braintree Hosted Fields) -->
<!-- This keeps cardholder data off YOUR servers entirely -->

<!-- WRONG: Direct card input -->
<!-- <input type="text" name="card_number"> -->
<!-- This puts you in PCI scope -->

<!-- CORRECT: Hosted iframe from payment processor -->
<div id="card-element">
    <!-- Stripe Elements renders an iframe here -->
    <!-- Card data never touches your server -->
</div>
```

## ISO 27001 Controls (Annex A)

### Controls Relevant to Engineering Teams

```yaml
A5_information_security_policies:
  A5.1: Information security policy
  implementation: Documented security policy in wiki/handbook

A6_organization:
  A6.1: Security roles and responsibilities
  implementation: RACI matrix for security responsibilities

A8_asset_management:
  A8.1: Asset inventory
  implementation: CMDB or infrastructure-as-code that tracks all assets
  A8.2: Information classification
  implementation: Data classification labels (public, internal, confidential, restricted)

# ... (condensed) ...
  implementation: Threat modeling in design phase
  A14.2: Secure development policy
  implementation: Secure SDLC, code review, SAST/DAST
  A14.3: Test data protection
  implementation: Anonymized production data for testing
```

## Audit Evidence Collection

### Automated Evidence Collection

```python
class ComplianceEvidenceCollector:
    """Automatically collect and organize compliance evidence."""

    def __init__(self, output_dir):
        self.output_dir = output_dir

    def collect_access_reviews(self):
        """Collect access review evidence (SOC 2 CC6.1)."""
        # Pull IAM policies from AWS
        iam = boto3.client('iam')
        users = iam.list_users()
        roles = iam.list_roles()
        policies = iam.list_policies(Scope='Local')

        # ... (condensed) ...
            self.output_dir,
            f"{name}_{datetime.utcnow():%Y%m%d}.json"
        )
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
```

## Compliance-as-Code

```python
# Open Policy Agent (OPA) / Rego policies

# policy/terraform.rego
# Ensure all S3 buckets have encryption enabled
REGO_POLICY = """
package terraform.s3

deny[msg] {
    resource := input.resource.aws_s3_bucket[name]
    not resource.server_side_encryption_configuration
    msg := sprintf("S3 bucket '%s' must have encryption enabled", [name])
}

deny[msg] {
    # ... (condensed) ...
    resource := input.resource.aws_db_instance[name]
    resource.publicly_accessible
    msg := sprintf("RDS instance '%s' must not be publicly accessible", [name])
}
"""
```

### Infrastructure Compliance Scanning

```shell
# Prowler (AWS security best practices)
prowler aws --compliance soc2
prowler aws --compliance hipaa
prowler aws --compliance pci_dss_v4

# Checkov (infrastructure-as-code scanning)
checkov --directory ./terraform/ --framework terraform
checkov --file Dockerfile --framework dockerfile

# ScoutSuite (multi-cloud security auditing)
scout aws --report-dir ./scout-report
```

## Continuous Compliance Monitoring

```yaml
# Compliance monitoring dashboard metrics

metrics:
  access_control:
    - name: users_without_mfa
      query: "Count IAM users where MFA is not enabled"
      threshold: 0
      severity: critical

    - name: inactive_users_90_days
      query: "Count users with no login in 90 days"
      threshold: 0
      severity: high

    # ... (condensed) ...

    - name: high_vulns_unpatched_7d
      query: "Count high vulnerabilities older than 7 days"
      threshold: 0
      severity: high
```

## Framework Comparison

| Requirement | SOC 2 | GDPR | HIPAA | PCI DSS | ISO 27001 |
|------------|-------|------|-------|---------|-----------|
| Encryption at rest | CC6.7 | Art. 32 | 164.312(a)(2)(iv) | Req 3.4 | A10.1 |
| Encryption in transit | CC6.7 | Art. 32 | 164.312(e)(1) | Req 4.1 | A10.1 |
| Access control | CC6.1-6.3 | Art. 32 | 164.312(a)(1) | Req 7-8 | A9 |
| Logging/audit | CC7.1-7.2 | Art. 30 | 164.312(b) | Req 10 | A12.4 |
| Incident response | CC7.3 | Art. 33-34 | 164.308(a)(6) | Req 12.10 | A16 |
| Vulnerability mgmt | CC7.1 | Art. 32 | 164.308(a)(5) | Req 6.1, 11 | A12.6 |
| Data retention | CC6.5 | Art. 5(1)(e) | 164.530(j) | Req 3.1 | A8.2 |
| Risk assessment | CC3.1 | Art. 35 | 164.308(a)(1) | Req 12.2 | A6.1.2 |

## When to Use

**Use this skill when:**
- Designing or implementing compliance checker solutions
- Reviewing or improving existing compliance checker approaches
- Making architectural or implementation decisions about compliance checker
- Learning compliance checker patterns and best practices
- Troubleshooting compliance checker-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Compliance Checker Analysis

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

**Input:** "Help me implement compliance checker for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended compliance checker approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When compliance checker must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
