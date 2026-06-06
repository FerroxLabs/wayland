---
name: security-incident-responder
description: |
  Security incident response expertise covering NIST incident response lifecycle, containment strategies, evidence preservation, forensic analysis basics, communication templates, post-incident review, incident classification and severity levels, and playbook creation for handling security incidents efficiently and effectively.
  Use when the user asks about security incident responder, security incident responder best practices, or needs guidance on security incident responder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security forensics guide"
  category: "security"
  subcategory: "incident-response"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Security Incident Responder

## Overview

Security incident response is the organized approach to handling security breaches and attacks. The goal is to minimize damage, reduce recovery time, and prevent recurrence. This skill covers the complete incident response lifecycle from preparation through lessons learned, with practical playbooks for common incident types.

## NIST Incident Response Lifecycle

```
1. PREPARATION
   -> Policies, procedures, tools, training, communication channels

2. DETECTION & ANALYSIS
   -> Monitoring, alerting, triage, investigation, classification

3. CONTAINMENT, ERADICATION & RECOVERY
   -> Short-term containment, evidence collection, root cause removal, restoration

4. POST-INCIDENT ACTIVITY
   -> Lessons learned, process improvements, metric tracking
```

## Incident Classification

### Severity Levels

```yaml
severity_levels:
  SEV-1_Critical:
    description: >
      Active exploitation with significant data loss, system compromise,
      or customer impact. Business operations severely disrupted.
    examples:
      - Active ransomware spreading across systems
      - Confirmed exfiltration of customer PII/PCI data
      - Complete production system compromise
      - Active unauthorized access to customer accounts
    response_time: 15 minutes
    communication: Immediate executive notification
    incident_commander: VP Engineering or CISO
    bridge_call: Continuous until contained
# ... (condensed) ...
      - Phishing email reported but not clicked
    response_time: Next business day
    communication: Ticket in security queue
    incident_commander: Assigned security engineer
    bridge_call: None needed
```

### Incident Categories

```yaml
categories:
  - malware: Ransomware, trojans, worms, cryptominers
  - unauthorized_access: Credential theft, account takeover, privilege escalation
  - data_breach: Exfiltration, unauthorized disclosure, data exposure
  - denial_of_service: DDoS, resource exhaustion, application-level DoS
  - web_attack: SQL injection, XSS, CSRF exploitation
  - insider_threat: Employee misconduct, data theft, sabotage
  - supply_chain: Compromised dependency, vendor breach
  - phishing: Credential harvesting, business email compromise
  - misconfiguration: Exposed database, public S3 bucket, leaked secrets
```

## Containment Strategies

### Short-Term Containment (Stop the Bleeding)

```yaml
containment_actions:
  network_level:
    - block_ip: "Block attacker IP at firewall/WAF"
    - isolate_host: "Move compromised host to isolated VLAN"
    - disable_vpn: "Revoke VPN access for compromised accounts"
    - block_egress: "Block outbound traffic to C2 servers"

  account_level:
    - disable_account: "Disable compromised user account"
    - rotate_credentials: "Force password reset, revoke sessions"
    - revoke_tokens: "Invalidate all API keys and access tokens"
    - revoke_mfa: "Remove and re-enroll MFA devices"

  application_level:
    # ... (condensed) ...

  data_level:
    - revoke_access: "Remove data access permissions"
    - encrypt_exports: "Halt all data export operations"
    - quarantine_files: "Isolate suspicious files"
```

### Containment Decision Tree

```
Is the attack actively ongoing?
  YES:
    Is it spreading to other systems?
      YES -> Network isolation (VLAN segregation)
      NO  -> Account-level containment (disable accounts, revoke tokens)

    Is customer data at risk?
      YES -> Application shutdown may be warranted
      NO  -> Targeted containment (block IPs, disable features)

  NO (discovered after the fact):
    Have credentials been compromised?
      YES -> Rotate all affected credentials immediately
      NO  -> Monitor and investigate before containment
```

## Evidence Preservation

### Chain of Custody

```python
class EvidenceCollector:
    """Collect and preserve digital evidence with chain of custody."""

    def __init__(self, incident_id, collector_name):
        self.incident_id = incident_id
        self.collector = collector_name
        self.evidence_log = []

    def collect_evidence(self, evidence_type, source, description):
        """Collect and document evidence with metadata."""
        import hashlib
        from datetime import datetime

        evidence_id = f"EVD-{self.incident_id}-{len(self.evidence_log) + 1:03d}"
# ... (condensed) ...
        sha256 = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()
```

### What to Collect

```yaml
evidence_collection_checklist:
  system_evidence:
    - system_logs: "/var/log/syslog, [system-path] Event Viewer"
    - process_list: "Running processes at time of detection"
    - network_connections: "Active connections (netstat/ss output)"
    - file_system_timeline: "Modified files in relevant timeframe"
    - memory_dump: "RAM dump if malware suspected"
    - disk_image: "Full disk image for forensics (if warranted)"

  application_evidence:
    - application_logs: "All relevant application log files"
    - access_logs: "Web server access logs (nginx, Apache)"
    - error_logs: "Application error logs"
    - audit_logs: "Authentication and authorization events"
    # ... (condensed) ...
  timeline:
    - first_known_activity: "Earliest evidence of compromise"
    - detection_time: "When the incident was detected"
    - containment_time: "When containment actions were taken"
    - key_events: "Chronological list of significant events"
```

### Evidence Collection Commands

```shell
# Linux system evidence collection

# System information
uname -a > evidence/system_info.txt
date -u >> evidence/system_info.txt
uptime >> evidence/system_info.txt

# Running processes (snapshot)
ps auxwww > evidence/processes.txt

# Network connections
ss -tunap > evidence/network_connections.txt

# Open files
# ... (condensed) ...
# Package information
dpkg -l > evidence/installed_packages.txt  # Debian/Ubuntu

# Hash all evidence files
sha256sum evidence/* > evidence/hashes.txt
```

## Forensic Analysis Basics

### Log Analysis

```python
class IncidentLogAnalyzer:
    """Analyze logs to reconstruct incident timeline."""

    def find_suspicious_logins(self, auth_logs, lookback_hours=72):
        """Identify suspicious authentication events."""
        cutoff = datetime.utcnow() - timedelta(hours=lookback_hours)

        suspicious = []
        for log in auth_logs:
            if log['timestamp'] < cutoff:
                continue

            # Failed login from multiple IPs
            if log['event'] == 'login_failed':
                # ... (condensed) ...
                    })

        # Sort chronologically
        timeline.sort(key=lambda x: x['timestamp'])
        return timeline
```

## Communication Templates

### Initial Notification (Internal)

```markdown
## Security Incident Notification

**Incident ID**: INC-2024-042
**Severity**: SEV-2 (High)
**Status**: Active - Investigation in Progress
**Detected**: 2024-06-15 14:30 UTC
**Incident Commander**: [Name]

### Summary
Unauthorized access detected to internal admin panel.
A compromised employee credential was used to access
the admin dashboard from an unrecognized IP address.

### Current Impact
# ... (condensed) ...
### Next Update
Expected by: 2024-06-15 16:00 UTC

### Bridge Call
[Link to video call] - Continuous until containment confirmed
```

### Customer Communication (if needed)

```markdown
## Security Notice

**Date**: [Date]
**Reference**: [Incident ID]

Dear [Customer/Users],

We are writing to inform you of a security incident that
may have affected your account.

### What Happened
On [date], we detected unauthorized access to [description].
We immediately took action to contain the incident and began
an investigation.
# ... (condensed) ...
Email: security@company.com
Phone: [number]

Sincerely,
[Name, Title]
```

## Post-Incident Review

### Review Meeting Agenda

```markdown
## Post-Incident Review: INC-2024-042

**Date**: [5 business days after resolution]
**Attendees**: Incident responders, affected team leads, management
**Facilitator**: [Name]
**Note-taker**: [Name]

### Agenda (60-90 minutes)

1. **Timeline Review** (15 min)
   - Walk through the incident timeline
   - Identify key decision points
   - Note any gaps in the timeline

# ... (condensed) ...
### Ground Rules
- Blameless: Focus on systems and processes, not individuals
- Honest: Accurate timeline, no covering up mistakes
- Constructive: Every criticism comes with a suggested improvement
- Documented: All findings and actions recorded
```

### Post-Incident Report Template

```markdown
## Post-Incident Report

**Incident ID**: INC-2024-042
**Title**: Admin Panel Unauthorized Access via Compromised Credentials
**Severity**: SEV-2 (High)
**Duration**: 2024-06-15 14:15 UTC to 2024-06-15 16:45 UTC (2h 30m)
**Impact**: No customer data compromised. Internal admin panel
accessed by unauthorized party for approximately 15 minutes.

### Timeline
| Time (UTC) | Event |
|-----------|-------|
| 14:15 | Attacker logged in to admin panel from IP 203.0.113.42 |
| 14:18 | Attacker viewed user list and system configuration |
# ... (condensed) ...
### Lessons Learned
1. MFA should be required for all administrative access
2. Anomaly detection for admin access patterns is essential
3. Response time was good (10 min from alert to containment)
4. RBAC controls prevented data export despite account compromise
```

## Playbook Creation

### Playbook Template

```yaml
playbook:
  name: Compromised Employee Credentials
  id: PB-001
  version: 2.1
  last_updated: 2024-06-20
  owner: security-engineering

  trigger:
    - Alert: "Unusual login location detected"
    - Alert: "Multiple failed MFA attempts"
    - Report: "Employee reports phishing"

  severity_assessment:
    - Is customer data at risk? -> Escalate to SEV-1
    # ... (condensed) ...
      then: "Escalate to SEV-1, engage legal and privacy teams"
    - if: "Multiple accounts compromised"
      then: "Activate company-wide password reset"
    - if: "Source system (email/SSO) compromised"
      then: "Escalate to SEV-1, engage vendor support"
```

## Incident Response Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mean Time to Detect (MTTD) | < 1 hour | Alert time - incident start time |
| Mean Time to Respond (MTTR) | < 15 minutes | First response - alert time |
| Mean Time to Contain (MTTC) | < 4 hours | Containment - detection |
| Mean Time to Recover (MTTRec) | < 24 hours | Full recovery - containment |
| Incidents per month | Trending down | Total count |
| Repeat incidents (same root cause) | 0 | Track by root cause category |
| Action items completed on time | > 90% | Track per post-incident review |

## When to Use

**Use this skill when:**
- Designing or implementing security incident responder solutions
- Reviewing or improving existing security incident responder approaches
- Making architectural or implementation decisions about security incident responder
- Learning security incident responder patterns and best practices
- Troubleshooting security incident responder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Security Incident Responder Analysis

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

**Input:** "Help me implement security incident responder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended security incident responder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When security incident responder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
