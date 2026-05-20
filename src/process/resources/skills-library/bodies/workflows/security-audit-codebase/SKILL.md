---
name: security-audit-codebase
description: >-
  Orchestrates a systematic security review of a codebase by chaining five
  security skills into a comprehensive audit pipeline. Covers threat modeling,
  secure development practices review, vulnerability scanning, API security
  assessment, and compliance verification.
  Use when the user needs a thorough security review of an existing codebase
  before a major release, compliance audit, or after a security incident.
  Do NOT use for runtime incident response (use handle-production-incident)
  or for single-vulnerability patching.
license: Apache-2.0
type: workflow
skills: threat-modeling-expert devsecops-engineer penetration-tester api-security-engineer compliance-checker
trigger_phrases: security audit codebase review code security assess application security vulnerability assessment
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: security architecture api-design compliance step-by-step
  category: software-project
  depends: threat-modeling-expert devsecops-engineer penetration-tester api-security-engineer compliance-checker
  disclaimer: none
  difficulty: advanced
---

# Security Audit Codebase

**Estimated time:** 1-3 weeks (depending on codebase size, complexity, and compliance requirements)

This workflow chains five security skills into a comprehensive codebase security audit. It moves from high-level threat modeling through code-level security review, vulnerability scanning, API-specific assessment, and compliance verification. Each step produces findings that inform the next, creating a layered security assessment that catches issues at multiple levels of abstraction.

**Critical note:** This workflow produces a security assessment and remediation plan. It does not automatically fix vulnerabilities. The output is a prioritized list of findings with remediation guidance that the development team implements through their normal development workflow.

## When to Use

- User needs a comprehensive security review before a major product release
- User is preparing for a compliance audit (SOC 2, HIPAA, PCI-DSS, GDPR)
- User wants to establish a security baseline for an existing codebase
- User has experienced a security incident and wants to identify additional vulnerabilities
- User is onboarding a new security-sensitive feature (payments, authentication, PII handling)
- Do NOT use when: responding to an active security incident (use handle-production-incident), patching a single known vulnerability (use devsecops-engineer directly), or setting up security monitoring (use setup-ci-cd-pipeline with security scanning)

## Prerequisites

Before starting this workflow, ensure:

1. **Codebase access is available:** You have read access to the full source code, configuration files, infrastructure-as-code, and deployment configurations
2. **Architecture documentation exists:** You have system architecture diagrams or can reconstruct them from the codebase. Understanding component boundaries is essential for threat modeling.
3. **Dependency manifest is current:** Package lock files, dependency manifests, and container base images are up to date so vulnerability scanning produces accurate results
4. **Compliance scope is defined:** If the audit is compliance-driven, you know which standards apply (SOC 2, HIPAA, PCI-DSS, GDPR) and which controls are in scope

## Steps

**Step 1: Conduct Threat Modeling** (uses: threat-modeling-expert)

Map the application's attack surface by identifying assets, trust boundaries, data flows, and potential threats. This step produces the threat model that guides all subsequent investigation, ensuring the audit focuses on the highest-risk areas rather than reviewing code randomly.

- Input: System architecture documentation, data flow diagrams, user roles and access levels, external integrations and third-party dependencies
- Output: Threat model document with asset inventory, trust boundary map, STRIDE threat classification per component, risk ratings (likelihood times impact), and prioritized list of areas requiring detailed review in Steps 2-4
- Key focus: Prioritize threats by business impact. A SQL injection in the payment processing path is more critical than a reflected XSS in an internal admin tool. The threat model should produce a ranked list that directs the audit toward the highest-risk code paths first.

**Step 2: Review Secure Development Practices** (uses: devsecops-engineer)

Examine the codebase for adherence to secure development practices. This step reviews authentication implementation, input validation, output encoding, cryptographic usage, error handling, and dependency management against the threat model from Step 1.

- Input: Threat model and prioritized risk areas from Step 1, source code access, dependency manifests, CI pipeline configuration
- Output: Secure coding findings report with: authentication and session management issues, input validation gaps, cryptographic misuse (weak algorithms, hardcoded keys, improper random number generation), insecure dependency usage, and missing security controls identified in the threat model
- Key focus: Review the highest-risk code paths from the threat model first. Check for common patterns: secrets in source code, missing input validation on user-facing endpoints, SQL construction without parameterized queries, insufficient output encoding, and overly permissive CORS configurations.

**Step 3: Scan for Known Vulnerabilities** (uses: penetration-tester)

Run automated vulnerability scanning and manual penetration testing techniques against the application. This step identifies known vulnerabilities in dependencies, common web application vulnerabilities, and configuration weaknesses that automated tools can detect.

- Input: Secure coding findings from Step 2, running application instance (staging environment preferred), dependency manifests, infrastructure configuration
- Output: Vulnerability scan results with: dependency vulnerabilities (CVEs with severity ratings), application-level vulnerabilities (injection, authentication bypass, access control failures), infrastructure misconfigurations (open ports, default credentials, missing headers), and proof-of-concept demonstrations for critical findings
- Key focus: Combine automated scanning with targeted manual testing. Automated tools catch known patterns; manual testing catches logic flaws and business logic vulnerabilities that scanners miss. Test the specific attack vectors identified in the threat model from Step 1.

**Step 4: Assess API Security** (uses: api-security-engineer)

Perform a focused security assessment of all API endpoints. This step examines authentication enforcement, authorization logic, rate limiting, input validation, and data exposure across every API route.

- Input: API documentation or endpoint inventory, vulnerability findings from Steps 2-3, authentication and authorization architecture, sample API requests and responses
- Output: API security assessment with: endpoints missing authentication, authorization bypass opportunities (IDOR, privilege escalation), excessive data exposure in responses, missing rate limiting, and insecure direct object reference patterns
- Key focus: Test every endpoint for broken access control. Can a regular user access admin endpoints? Can User A access User B's data by changing an ID parameter? Verify that API responses do not leak sensitive fields (internal IDs, email addresses, timestamps that enable user enumeration). Check that error responses do not reveal implementation details.

**Step 5: Verify Compliance Requirements** (uses: compliance-checker)

Map the findings from Steps 1-4 against the applicable compliance frameworks. This step produces the compliance gap analysis that identifies which controls are satisfied, which are partially implemented, and which are missing entirely.

- Input: All findings from Steps 1-4, applicable compliance framework requirements (SOC 2 trust criteria, HIPAA safeguards, PCI-DSS requirements, GDPR articles), current security controls and policies
- Output: Compliance gap analysis with: control-by-control assessment (satisfied, partially implemented, missing), remediation priority matrix (critical gaps first), evidence inventory for satisfied controls, and estimated remediation effort for each gap
- Key focus: Translate technical findings into compliance language. A "missing input validation on file upload endpoint" becomes "insufficient technical safeguard for data integrity" in HIPAA terms. This translation helps non-technical stakeholders understand the audit results and prioritize remediation funding.

## Decision Points

- **Before Step 1:** If the codebase has never had a security review, expect the audit to take longer. Allocate additional time for Steps 2-3 as there will likely be more findings. If the codebase is under 10,000 lines, consider combining Steps 2 and 3 into a single review pass.

- **At Step 3:** If automated scanning reveals critical vulnerabilities (remote code execution, SQL injection in production), stop the audit and remediate the critical findings immediately before continuing. Critical vulnerabilities supersede the audit timeline.

- **At Step 5:** If no compliance framework applies (internal tool, no regulatory requirements), skip this step entirely. The findings from Steps 1-4 provide sufficient security improvement guidance without compliance mapping.

## Failure Handling

- **Step 1 produces an incomplete threat model:** If architecture documentation is insufficient, spend additional time in Step 1 mapping the system from the codebase itself. Review entry points (API routes, message consumers, scheduled tasks) to reconstruct the architecture.

- **Step 2 findings are overwhelming (50+ issues):** Prioritize by the threat model risk ratings from Step 1. Group similar issues (all input validation gaps, all authentication issues) and address them as categories rather than individual findings.

- **Step 3 scanning produces false positives:** Verify every critical and high finding manually before including it in the report. Document verified false positives to prevent re-investigation in future audits.

- **Step 4 cannot test all endpoints:** If the API has hundreds of endpoints, focus on endpoints that handle sensitive data (PII, financial data, authentication tokens) and endpoints identified as high-risk in the threat model. Document untested endpoints as audit scope limitations.

- **Step 5 compliance framework is ambiguous:** For controls that are open to interpretation, document the interpretation used and provide evidence supporting the assessment. Flag ambiguous controls for legal or compliance team review.

## Expected Outcome

When this workflow is complete, the user will have:

1. A comprehensive threat model mapping the application's attack surface with prioritized risk areas
2. A secure coding practices report identifying authentication, validation, cryptographic, and dependency issues
3. Vulnerability scan results with verified findings, severity ratings, and proof-of-concept demonstrations for critical issues
4. An API security assessment covering access control, data exposure, and rate limiting across all endpoints
5. A compliance gap analysis mapping technical findings to regulatory requirements (if applicable)
6. A prioritized remediation roadmap with estimated effort for each finding category

## Output Format

```
SECURITY AUDIT REPORT
======================

Codebase: [repository name]
Audit Date: [date range]
Auditor: [name/team]
Scope: [full codebase / specific components]

Summary:
  Critical findings: [count]
  High findings: [count]
  Medium findings: [count]
  Low findings: [count]
  Informational: [count]

[ ] Step 1: Threat Model
    Assets identified: [count]
    Threat scenarios: [count]
    High-risk areas: [list]

[ ] Step 2: Secure Coding Review
    Issues found: [count by severity]
    Top categories: [list]

[ ] Step 3: Vulnerability Scanning
    CVEs identified: [count]
    Application vulns: [count]

[ ] Step 4: API Security
    Endpoints tested: [count]
    Access control issues: [count]

[ ] Step 5: Compliance Mapping
    Controls satisfied: [count/total]
    Gaps identified: [count]

Remediation Priority:
  1. [Critical finding - immediate action]
  2. [High finding - this sprint]
  3. [Medium finding - next sprint]

Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- For small codebases (under 10K lines), combine Steps 2 and 3 into a single pass
- Skip Step 5 if no compliance framework applies
- For microservices, run Steps 2-4 per service and consolidate findings

## Edge Cases

- **Legacy codebase with no tests:** Security fixes in untested code carry higher regression risk. Recommend adding test coverage for security-critical paths before applying remediation.
- **Codebase uses multiple languages:** Run language-specific scanning tools for each language in Step 3. Common vulnerability patterns differ by language (SQL injection in PHP vs. deserialization in Java vs. prototype pollution in JavaScript).
- **Open-source project with public code:** The threat model in Step 1 must account for the fact that attackers can read the source code. Focus on defense-in-depth rather than security through obscurity.
- **Microservices with shared authentication:** Test authentication at every service boundary in Step 4, not just at the API gateway. Verify that internal service-to-service calls enforce authorization even when the gateway has already authenticated the user.
- **Active development during audit:** If the codebase is changing while the audit runs, establish a code freeze for the audit branch or accept that findings may refer to code that has changed. Re-verify critical findings against the latest code before finalizing the report.

## Example

**Scenario:** "Conduct a security audit of our e-commerce platform before launching the new payment processing feature. We need SOC 2 compliance for enterprise customers."

**Input:** E-commerce platform: React frontend, Node.js API, PostgreSQL database, Stripe integration for payments. 85,000 lines of code across 3 services. SOC 2 Type II audit scheduled for next quarter. Current security posture: basic authentication implemented, no prior security audit.

**Output:** Comprehensive security audit report with 47 findings and SOC 2 gap analysis.

**Step 1 (threat-modeling-expert):** Threat model identifies 12 assets (user PII, payment tokens, session data, admin credentials, API keys, database, file uploads, email service, Stripe webhooks, admin panel, customer support tools, analytics data). Trust boundaries mapped between public internet, API gateway, internal services, and database layer. STRIDE analysis produces 34 threat scenarios. Top 5 risks: payment token exposure, admin privilege escalation, Stripe webhook spoofing, customer PII leakage in API responses, and session fixation.

**Step 2 (devsecops-engineer):** Code review against top 5 threats reveals: 3 API endpoints return full user objects including hashed passwords (data exposure), Stripe webhook handler does not verify webhook signatures (spoofing risk), admin endpoints rely on client-side role checks only (privilege escalation), 2 SQL queries use string concatenation instead of parameterized queries, and 4 API keys are committed in configuration files.

**Step 3 (penetration-tester):** Dependency scan finds 7 CVEs (2 critical: prototype pollution in lodash, ReDoS in email validation library). Application scanning confirms the SQL injection and privilege escalation from Step 2. Additional findings: missing Content-Security-Policy headers, session cookies without Secure and HttpOnly flags, and file upload endpoint accepts unrestricted file types.

**Step 4 (api-security-engineer):** API assessment of 47 endpoints reveals: 5 endpoints missing authentication entirely (3 are internal-only but accessible from public internet), 8 endpoints vulnerable to IDOR (user A can access user B's orders by changing the order ID), rate limiting only on login endpoint (other endpoints unlimited), and API error responses include stack traces in production mode.

**Step 5 (compliance-checker):** SOC 2 gap analysis against 61 applicable controls: 23 satisfied (basic access controls, encrypted connections, backup procedures), 19 partially implemented (logging exists but no retention policy, authentication exists but no MFA, monitoring exists but no alert response procedures), 19 missing (no formal change management process, no vendor risk assessment, no incident response plan, no security awareness training).

**Result:** Audit report delivered with 47 findings (4 critical, 11 high, 18 medium, 14 low) and SOC 2 gap analysis showing 38 controls needing remediation. Remediation roadmap: critical findings (SQL injection, privilege escalation, exposed API keys) remediated within 1 week. High findings (IDOR, webhook verification, dependency CVEs) addressed within 1 month. SOC 2 gaps addressed over 3 months with formal policies and procedures.
