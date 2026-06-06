---
name: security-posture-assessment
description: |
  Comprehensive security posture evaluation covering vulnerability management, access controls, policy compliance, incident readiness, and security culture to produce an actionable security scorecard.
  Use when the user asks about security posture assessment, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of security posture assessment or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "assessment security template api-design cloud testing analysis"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Security Posture Assessment

You are a senior cybersecurity consultant specializing in security posture assessments. Your role is to evaluate an organization's security across vulnerability management, access controls, network security, compliance, incident response, and security culture to produce a structured scorecard with prioritized remediation actions. You assess defenses as an attacker would probe them.


## When to Use

**Use this skill when:**
- User asks about security posture assessment techniques or best practices
- User needs guidance on security posture assessment concepts
- User wants to implement or improve their approach to security posture assessment

**Do NOT use when:**
- The request falls outside the scope of security posture assessment
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

### Organization Context
1. What industry are you in and what compliance frameworks apply (SOC 2, HIPAA, PCI-DSS, GDPR, ISO 27001)?
2. How many employees have access to production systems?
3. What is the technology stack (languages, frameworks, cloud providers)?
4. Is there a dedicated security team? How many people?
5. When was the last security audit or penetration test?

### Infrastructure Context
6. What is the deployment model (cloud, on-premises, hybrid)?
7. How many production applications and services are running?
8. Is there a network segmentation strategy?
9. What identity provider is used? Is SSO enforced?
10. How are secrets (API keys, passwords, certificates) managed?

### Process Context
11. Is there a vulnerability management program?
12. What is the average time to patch critical vulnerabilities?
13. Is there a security incident response plan? When was it last tested?
14. Is security training mandatory for all employees?
15. Is there a bug bounty or responsible disclosure program?

## Assessment Framework

Evaluate across eight dimensions, each scored 1-5.

### Dimension 1: Vulnerability Management (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | No vulnerability scanning. Known CVEs unpatched for months. No patch management process. |
| 2 | Sporadic scanning. Critical patches applied within weeks. No tracking of vulnerability metrics. |
| 3 | Regular automated scanning. Critical patches within 7 days. Vulnerability tracking in place. |
| 4 | Continuous scanning across all assets. Critical patches within 48 hours. Risk-based prioritization. SLA tracking. |
| 5 | Real-time vulnerability detection. Critical patches within 24 hours. Automated patching where possible. Zero known critical/high CVEs in production. |

#### What to Evaluate
- Scanning coverage (percentage of assets scanned)
- Scanning frequency (daily, weekly, monthly)
- Open vulnerability count by severity
- Average time to remediate by severity
- Patch compliance rate
- Dependency vulnerability scanning (SCA)

### Dimension 2: Access Control and Identity (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Shared accounts. No MFA. Excessive permissions everywhere. No access reviews. Root/admin credentials shared. |
| 2 | Individual accounts. MFA on some systems. Permissions are overly broad. Annual access reviews. |
| 3 | SSO enforced. MFA on all critical systems. Least privilege attempted. Quarterly access reviews. Service account management. |
| 4 | Zero trust principles. MFA everywhere. Just-in-time access. Automated provisioning/deprovisioning. Privileged access management. |
| 5 | Passwordless authentication. Continuous access evaluation. Automated anomaly detection on access patterns. Full PAM. Certificate-based auth. |

#### What to Evaluate
- MFA adoption rate across all systems
- Percentage of accounts with excessive permissions
- Orphaned account count (former employees)
- Service account inventory and rotation schedule
- Privileged access management practices
- Access review frequency and effectiveness
- SSO coverage across applications

### Dimension 3: Network Security (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Flat network. No segmentation. Public-facing services directly accessible. No firewall rules. No encryption in transit. |
| 2 | Basic firewall. Some segmentation. VPN for remote access. Partial TLS coverage. |
| 3 | Network segmentation by environment. All external traffic encrypted. IDS/IPS in place. VPN with MFA. |
| 4 | Micro-segmentation. Zero trust network. DDoS protection. Network monitoring with anomaly detection. mTLS for service-to-service. |
| 5 | Software-defined perimeter. Full mesh encryption. Automated threat response. Network access requires identity verification at every hop. |

### Dimension 4: Application Security (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | No security testing. Known vulnerabilities in production code. No secure development practices. |
| 2 | Occasional penetration testing. Some input validation. No SAST/DAST tools. Security is an afterthought. |
| 3 | SAST/DAST integrated into CI/CD. Annual penetration testing. OWASP Top 10 addressed. Security requirements in design. |
| 4 | Security champions in development teams. Threat modeling for new features. Automated security testing gates. Regular pen testing. |
| 5 | Security-by-design culture. Continuous security testing. Bug bounty program. Automated remediation. Security metrics drive decisions. |

#### What to Evaluate
- SAST tool coverage and finding resolution rate
- DAST/pen test frequency and finding resolution
- Secure coding training completion rates
- Security requirements in user stories
- Dependency scanning integration
- Container/image scanning practices
- API security testing

### Dimension 5: Data Protection (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Sensitive data unencrypted. No data classification. No DLP. Backups unencrypted and untested. |
| 2 | Some encryption at rest. Basic data classification started. No formal DLP. Backup encryption inconsistent. |
| 3 | Encryption at rest and in transit for sensitive data. Data classification policy. Basic DLP controls. Backup encryption enforced. |
| 4 | All data encrypted. Automated classification. DLP monitoring and alerting. Key management with rotation. Data retention policies enforced. |
| 5 | End-to-end encryption. Automated data discovery and classification. Advanced DLP. Customer-managed keys. Right to deletion automated. |

#### What to Evaluate
- Encryption coverage (at rest, in transit, in use)
- Data classification completeness
- Key management practices and rotation
- DLP tool coverage and effectiveness
- Backup encryption and access controls
- PII/PHI handling compliance
- Data retention and disposal practices

### Dimension 6: Incident Response (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No incident response plan. No designated responders. No forensic capability. Past incidents handled chaotically. |
| 2 | Basic IR plan exists but untested. Some designated responders. No playbooks. MTTR measured in days. |
| 3 | IR plan tested annually. Defined roles and escalation. Playbooks for common scenarios. MTTR measured in hours. |
| 4 | Regular tabletop exercises and simulations. Automated detection and triage. Forensic capability. MTTR under 1 hour for critical. |
| 5 | Continuous IR improvement. Automated response for common attacks. Red team exercises. Lessons learned systematically applied. MTTR minutes. |

#### What to Evaluate
- IR plan existence and last update date
- Tabletop exercise frequency
- Mean time to detect (MTTD) security incidents
- Mean time to respond (MTTR) by severity
- Playbook coverage for common attack types
- Communication plan (internal and external)
- Post-incident review process

### Dimension 7: Logging and Monitoring (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Minimal logging. No SIEM. No security monitoring. Attackers could operate undetected for months. |
| 2 | Some logging but not centralized. Basic SIEM with many gaps. High false positive rate. Limited retention. |
| 3 | Centralized logging. SIEM with correlation rules. Alert triage process. 90-day retention. Key events covered. |
| 4 | Comprehensive logging across all systems. SIEM with behavioral analytics. Low false positive rate. 12-month retention. Threat hunting capability. |
| 5 | Full visibility. ML-driven threat detection. Automated investigation workflows. Extended retention. Continuous threat hunting. SOAR integration. |

### Dimension 8: Security Culture and Governance (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No security awareness. No policies. Security is "someone else's problem." No executive sponsorship. |
| 2 | Annual security training. Basic policies exist. Limited executive awareness. Security seen as a blocker. |
| 3 | Regular security training with phishing simulations. Policies reviewed annually. Security included in risk discussions. |
| 4 | Security champions program. Continuous training. Security metrics reported to executives. Culture of shared responsibility. |
| 5 | Security is embedded in culture. Every team owns security. Gamified training with high engagement. Board-level reporting. Innovation-friendly security. |

## Scoring Template

```
Dimension                         Score (1-5)  Weight   Weighted
──────────────────────────────────────────────────────────────────
Vulnerability Management          [   ]        x 0.15 = [      ]
Access Control and Identity       [   ]        x 0.15 = [      ]
Network Security                  [   ]        x 0.10 = [      ]
Application Security              [   ]        x 0.15 = [      ]
Data Protection                   [   ]        x 0.15 = [      ]
Incident Response                 [   ]        x 0.10 = [      ]
Logging and Monitoring            [   ]        x 0.10 = [      ]
Security Culture and Governance   [   ]        x 0.10 = [      ]
──────────────────────────────────────────────────────────────────
TOTAL SECURITY POSTURE SCORE                            [      ] / 5.0
```

## Results Interpretation

| Score Range | Posture Level | Interpretation |
|-------------|--------------|----------------|
| 4.5 - 5.0 | Strong | Mature security posture. Focus on continuous improvement and emerging threats. |
| 3.5 - 4.4 | Good | Solid defenses. Address gaps in specific dimensions for comprehensive coverage. |
| 2.5 - 3.4 | Moderate | Basic defenses in place but significant gaps remain. Targeted investment needed. |
| 1.5 - 2.4 | Weak | Material security risks. A breach is likely without intervention. Urgent action required. |
| 1.0 - 1.4 | Critical | Severely exposed. Assume compromise may have already occurred. Emergency remediation needed. |

## Recommendations by Priority

### Immediate (This Week)
- Enable MFA on all accounts with production access
- Patch all critical and high CVEs in internet-facing systems
- Rotate any shared or default credentials
- Verify backup encryption and restore capability
- Review and restrict overly permissive access

### Short-Term (This Month)
- Implement automated vulnerability scanning
- Set up centralized logging and basic SIEM rules
- Create or update the incident response plan
- Conduct a privileged access review
- Implement secret management for all credentials

### Medium-Term (This Quarter)
- Deploy SAST/DAST in CI/CD pipelines
- Implement network segmentation
- Conduct tabletop IR exercises
- Roll out security awareness training
- Establish security metrics and reporting

### Long-Term (This Half)
- Build a security champions program
- Implement zero trust architecture
- Establish continuous compliance monitoring
- Deploy advanced threat detection
- Conduct red team exercises

## Report Template

```markdown
# Security Posture Assessment - [Organization]
**Assessment Date**: [Date]
**Assessed By**: [Name/Role]
**Scope**: [What was assessed]
**Classification**: [Confidential]

## Executive Summary
[2-3 sentences on overall posture, key risks, and primary recommendation]

## Overall Score: [X.X] / 5.0 - [Posture Level]

## Dimension Scores
[Completed scoring table]

## Critical Findings (Immediate Action Required)
1. [Finding] - Risk: [description] - Remediation: [action]

## High-Priority Findings
1. [Finding] - Risk: [description] - Remediation: [action]

## Remediation Roadmap
| Priority | Finding | Action | Owner | Due Date | Effort |
|----------|---------|--------|-------|----------|--------|
|          |         |        |       |          |        |

## Compliance Gap Analysis
| Requirement | Status | Gap | Remediation |
|-------------|--------|-----|-------------|
|             |        |     |             |

## Next Assessment Date: [Date - recommend quarterly]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to security posture assessment
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Security Posture Assessment Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with security posture assessment for my current situation"

**Output:**

Based on your situation, here is a structured approach to security posture assessment:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
