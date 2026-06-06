---
name: security-hardening-sprint
description: >-
  Structured workflow for conducting a security hardening sprint on an existing
  application or infrastructure. Covers vulnerability auditing, threat modeling,
  prioritized remediation, verification testing, and ongoing monitoring setup to
  systematically reduce attack surface and improve security posture.

  Use when the user wants to security hardening sprint or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  security-auditor threat-modeler security-hardener penetration-tester
  secrets-manager compliance-checker supply-chain-security monitoring-engineer
  runbook-writer incident-responder
trigger_phrases: >-
  I want to harden our security I need a security audit How do I improve our
  security posture I want to run a security sprint
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: security compliance penetration-testing step-by-step planning
  category: software-project
  depends: >-
    security-auditor threat-modeler security-hardener penetration-tester
    secrets-manager compliance-checker supply-chain-security monitoring-engineer
    runbook-writer incident-responder
  disclaimer: none
  difficulty: advanced
---
# Security Hardening Sprint

**Estimated time:** 2-4 weeks

A security hardening sprint is an intensive, time-boxed effort to systematically identify and fix security vulnerabilities across your application, infrastructure, and processes. Unlike ad-hoc security fixes, this workflow provides a structured approach: audit first to understand the full picture, prioritize by risk, fix systematically, verify the fixes work, and establish ongoing monitoring to prevent regression.

This workflow is designed for teams that know their security posture needs improvement but lack a systematic approach. It works for applications in production, pre-launch hardening, or periodic security hygiene sprints. The output is not just fixed vulnerabilities -- it is a security monitoring baseline that catches future issues automatically.

## When to Use

- User wants to security hardening sprint
- User needs a structured, step-by-step process for security hardening sprint
- User wants to harden our security
- I need a security audit
- How do I improve our security posture
- Do NOT use when: the request is outside the scope of security hardening sprint or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- An application or infrastructure to harden (production or pre-production)
- Access to source code, configuration, and infrastructure
- Authorization to perform security testing (critical -- unauthorized testing is illegal)
- At least one team member with security knowledge (or willingness to learn)
- Management support for potentially disruptive changes (patches, configuration changes)
- A window for remediation that allows for controlled changes

## Steps

**Step 1: Conduct Security Audit** (uses: security-auditor)

conduct a comprehensive security audit. Cover: OWASP Top 10 for web applications, dependency vulnerability scanning, container image scanning, infrastructure configuration review (cloud security posture), authentication and authorization audit, data encryption assessment (at rest and in transit), and security header analysis. Use automated tools (SAST, DAST, SCA) supplemented by manual review for business logic vulnerabilities.

- Input: Application architecture and technology stack, Infrastructure topology, Previous security findings (if any)
- Output: Security audit report with findings categorized by severity (critical/high/medium/low), Dependency vulnerability scan results, Infrastructure security configuration review
- Key focus: Use the Security Auditor skill to conduct a comprehensive security audit

**Step 2: Perform Threat Modeling** (uses: threat-modeler)

identify threats that automated scanning might miss. Create data flow diagrams showing trust boundaries. Apply STRIDE analysis to each component: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege. Focus on business logic vulnerabilities, authorization bypass scenarios, and data exfiltration paths. Prioritize threats using DREAD scoring (Damage, Reproducibility, Exploitability, Affected Users, Discoverability).

- Input: Application architecture diagrams, Data flow diagrams, Security audit findings from Step 1
- Output: Data flow diagram with trust boundaries, STRIDE analysis per component, Threat catalog with DREAD scores
- Key focus: Use the Threat Modeler skill to identify threats that automated scanning might miss

**Step 3: Prioritize and Plan Remediation** (uses: security-hardener)

create a prioritized remediation plan. Combine audit findings and threat model results into a single prioritized backlog. Score each item by: risk (likelihood x impact), effort to fix, and business disruption. Group fixes into tiers: Tier 1 (critical -- fix this week), Tier 2 (high -- fix this sprint), Tier 3 (medium -- plan for next sprint), Tier 4 (low -- backlog). Create detailed remediation instructions for each Tier 1 and Tier 2 item.

- Input: Audit findings from Step 1, Threat model from Step 2, Available engineering time for remediation
- Output: Prioritized remediation backlog with risk scores, Tier classification (critical/high/medium/low), Detailed remediation instructions for Tier 1 and 2 items
- Key focus: Use the Security Hardener skill to create a prioritized remediation plan

**Step 4: Remediate Secrets and Credentials** (uses: secrets-manager)

fix the most impactful vulnerability class first: exposed credentials. Scan the entire repository history for committed secrets (using gitleaks or truffleHog). Rotate every exposed credential immediately. Migrate all secrets to a secrets management solution (HashiCorp Vault, AWS Secrets Manager, or environment variables at minimum). Set up pre-commit hooks to prevent future secret commits. Implement secret rotation schedules for all credentials.

- Input: Current secrets management practices, Hardcoded credentials found in audit, API keys, database passwords, certificates
- Output: Secret scan results (historical and current), Credential rotation log, Secrets management solution configuration
- Key focus: Use the Secrets Manager skill to fix the most impactful vulnerability class first: exposed credentials

**Step 5: Fix Application Vulnerabilities** (uses: security-hardener)

fix application-level vulnerabilities: patch vulnerable dependencies, fix injection vulnerabilities, implement proper input validation, configure security headers (CSP, HSTS, X-Frame-Options), fix authentication weaknesses, and remediate authorization bypass issues. Use the Supply Chain Security skill to set up SBOM generation, dependency scanning in CI, and automated dependency update PRs. Each fix should include a test that verifies the vulnerability is resolved.

- Input: Tier 1 and 2 items from remediation plan, Dependency vulnerability scan results, OWASP findings
- Output: Patched dependency manifest, Fixed application vulnerabilities with verification tests, Security headers configuration
- Key focus: Use the Security Hardener skill to fix application-level vulnerabilities: patch vulnerable dependencies, fix injection vulnerabilities, implement proper input validation, configure security headers (CSP, HSTS, X-Frame-Options), fix authentication weaknesses, and remediate authorization bypass issues

**Step 6: Harden Infrastructure** (uses: security-hardener)

harden infrastructure. Apply CIS benchmarks for your OS and cloud provider. Implement: network segmentation (least-privilege security groups), encryption at rest for all data stores, TLS 1.2+ for all transit, IAM least privilege (audit and tighten overly permissive roles), logging and audit trails for all administrative actions, and backup verification. For containers, scan images and enforce non-root execution.

- Input: Infrastructure findings from audit, CIS benchmark gaps, Cloud security posture assessment
- Output: CIS benchmark compliance report, Network security group audit and tightening, IAM role audit and least-privilege enforcement
- Key focus: Use the Security Hardener skill to harden infrastructure

**Step 7: Verify with Penetration Testing** (uses: penetration-tester)

verify that remediations are effective. Focus on the critical threats from the threat model and the high-severity findings from the audit. Attempt to exploit the original vulnerabilities to confirm they are fixed. Test for new vulnerabilities that may have been introduced by the changes. Document any remaining risks and their accepted risk rationale.

- Input: Remediated application and infrastructure from Steps 4-6, Original threat model from Step 2, Authorization for penetration testing
- Output: Penetration test report, Remediation verification results (pass/fail per finding), New findings discovered during testing
- Key focus: Use the Penetration Tester skill to verify that remediations are effective

**Step 8: Set Up Ongoing Monitoring** (uses: monitoring-engineer)

set up security monitoring: intrusion detection alerts, failed authentication monitoring, anomalous access pattern detection, and dependency vulnerability notifications. Use the Incident Responder skill to establish a security incident response plan. Use the Runbook Writer skill to create runbooks for each security alert. Schedule the next security hardening sprint (recommended: quarterly).

- Input: Hardened application and infrastructure from Steps 4-7, Compliance requirements, On-call and incident response expectations
- Output: Security monitoring dashboard, Alert definitions for security events, Security incident response plan
- Key focus: Use the Monitoring Engineer skill to set up security monitoring: intrusion detection alerts, failed authentication monitoring, anomalous access pattern detection, and dependency vulnerability notifications

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Expand audit scope to cover missed areas
  - If **After Step 3**: Reduce scope to critical/high items only
  - If **After Step 5**: Fix remaining application issues before infrastructure
  - If **After Step 7**: Re-remediate failed fixes and retest

## Failure Handling

- **Audit without remediation:** -- A security report gathering dust is worse than useless -- it is a liability in case of breach. Commit to fixing what you find.
- **Fixing symptoms not causes:** -- Patching one XSS is good; implementing input validation everywhere is better. Fix the class of vulnerability, not just the instance.
- **Skipping secret rotation:** -- Finding exposed secrets without rotating them is incomplete. Every exposed credential must be rotated, even if you think it was not exploited.
- **Hardening without testing:** -- Security changes can break functionality. Every hardening change must be tested for both security and functionality.
- **No ongoing monitoring:** -- Security is not a one-time event. Without monitoring, you will not know when new vulnerabilities appear or attacks begin.

## Expected Outcome

When this workflow is complete, the user will have:

1. All critical and high severity findings are remediated and verified
2. No secrets are exposed in code, configuration, or version history
3. CIS benchmark compliance exceeds 80%
4. Security monitoring detects simulated attacks within 5 minutes
5. Incident response plan is tested and team is trained
6. Dependency vulnerabilities are automatically detected in CI
7. Security posture score improves measurably from the pre-sprint baseline

## Output Format

```
SECURITY HARDENING SPRINT TRACKER
=================================

[ ] Step 1: Conduct Security Audit
    Status: [pending/in-progress/complete]
[ ] Step 2: Perform Threat Modeling
    Status: [pending/in-progress/complete]
[ ] Step 3: Prioritize and Plan Remediation
    Status: [pending/in-progress/complete]
[ ] Step 4: Remediate Secrets and Credentials
    Status: [pending/in-progress/complete]
[ ] Step 5: Fix Application Vulnerabilities
    Status: [pending/in-progress/complete]
[ ] Step 6: Harden Infrastructure
    Status: [pending/in-progress/complete]
[ ] Step 7: Verify with Penetration Testing
    Status: [pending/in-progress/complete]
[ ] Step 8: Set Up Ongoing Monitoring
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Audit without remediation:** -- A security report gathering dust is worse than useless -- it is a liability in case of breach. Commit to fixing what you find.
- **Fixing symptoms not causes:** -- Patching one XSS is good; implementing input validation everywhere is better. Fix the class of vulnerability, not just the instance.
- **Skipping secret rotation:** -- Finding exposed secrets without rotating them is incomplete. Every exposed credential must be rotated, even if you think it was not exploited.
- **Hardening without testing:** -- Security changes can break functionality. Every hardening change must be tested for both security and functionality.

## Example

**Input:** "I want to security hardening sprint and need a structured plan to follow step by step."

**Output:**

**Step 1 (security-auditor):** Conduct Security Audit -- produces concrete deliverables for this phase.

**Step 2 (threat-modeler):** Perform Threat Modeling -- produces concrete deliverables for this phase.

**Step 3 (security-hardener):** Prioritize and Plan Remediation -- produces concrete deliverables for this phase.

**Step 4 (secrets-manager):** Remediate Secrets and Credentials -- produces concrete deliverables for this phase.

**Step 5 (security-hardener-supply-chain-security):** Fix Application Vulnerabilities -- produces concrete deliverables for this phase.

**Step 6 (security-hardener):** Harden Infrastructure -- produces concrete deliverables for this phase.

**Step 7 (penetration-tester):** Verify with Penetration Testing -- produces concrete deliverables for this phase.

**Step 8 (monitoring-engineer-incident-responder-runbook-writer):** Set Up Ongoing Monitoring -- produces concrete deliverables for this phase.

**Result:** User has a complete security hardening sprint plan with all deliverables produced, validated, and ready for implementation.
