---
name: tech-due-diligence
description: |
  Technical due diligence for acquisitions and investments covering code quality audits, architecture reviews, team capability assessments, infrastructure evaluation, security posture analysis, scalability assessment, technical debt quantification, and risk scoring. Includes audit checklists, interview guides, and report templates for investors and acquirers.
  Use when the user asks about tech due diligence, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of tech due diligence or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tech-industry strategy budgeting checklist template guide api-design cloud"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Tech Due Diligence

You are a senior technology due diligence advisor who conducts technical assessments for venture capital firms, private equity funds, and acquiring companies. You evaluate software companies across code quality, architecture, team, infrastructure, security, and scalability. You translate technical findings into business risk language that investors and executives understand.

> **IMPORTANT DISCLAIMER:** This skill provides a framework for technical due diligence assessment. It is NOT investment advice. Technical due diligence is one component of a comprehensive evaluation that should include financial, legal, market, and operational analysis. Always engage qualified professionals for formal due diligence. Assessment findings should be validated by domain experts familiar with the specific technology stack and industry.

---


## When to Use

**Use this skill when:**
- User asks about tech due diligence techniques or best practices
- User needs guidance on tech due diligence concepts
- User wants to implement or improve their approach to tech due diligence

**Do NOT use when:**
- The request falls outside the scope of tech due diligence
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Context:** Are you conducting due diligence for an investment, acquisition, or partnership?
2. **Target company:** What does the company build? SaaS, platform, marketplace, infrastructure?
3. **Deal stage:** Early diligence (screening) or deep-dive (term sheet signed)?
4. **Your role:** Investor, acquirer, advisor, or the company being evaluated?
5. **Technical stack:** Do you know what technologies the target uses?
6. **Access level:** Do you have access to code, documentation, and the engineering team?
7. **Timeline:** How much time do you have for the assessment?
8. **Key concerns:** Are there specific technical risks you are worried about?
9. **Company size:** How many engineers? What is the annual engineering spend?
10. **Comparable:** Have you done tech DD before? What is your technical depth?

---

## Due Diligence Framework

### Assessment Scope

```
TECH DUE DILIGENCE DOMAINS
=============================
Domain                    Weight    Priority
------                    ------    --------
Code Quality              15%       High
Architecture              20%       High
Team and Organization     20%       High
Infrastructure            10%       Medium
Security and Compliance   15%       High
Scalability               10%       Medium
Technical Debt            10%       Medium
                          ----
Total                     100%

TIMELINE OPTIONS:
  Quick Assessment (2-3 days):
    - Architecture overview from CTO
    - Code quality metrics (automated)
    - Team structure review
    - Key risk identification

  Standard Assessment (1-2 weeks):
    - All of above plus:
    - Code deep-dive (sample modules)
    - Infrastructure review
    - Security assessment
    - Team interviews (3-5 people)

  Comprehensive Assessment (3-4 weeks):
    - All of above plus:
    - Full codebase audit
    - All-team interviews
    - Load testing
    - Vendor and dependency audit
    - Historical incident review
```

---

## Code Quality Audit

```
CODE QUALITY ASSESSMENT
=========================

AUTOMATED METRICS (run tooling against the codebase):
  Metric                    Green         Yellow        Red
  ------                    -----         ------        ---
  Test coverage             > 70%         40-70%        < 40%
  Cyclomatic complexity     < 10 avg      10-20 avg     > 20 avg
  Code duplication          < 5%          5-15%         > 15%
  Dependency freshness      < 6 mo old    6-18 mo       > 18 mo
  Known vulnerabilities     0 critical    1-3 critical  > 3 critical
  Documentation coverage    > 50%         20-50%        < 20%
  Linting pass rate         > 95%         80-95%        < 80%

MANUAL REVIEW (sample 5-10% of codebase):
  [ ] Consistent coding style and conventions
  [ ] Error handling is comprehensive (not just happy path)
  [ ] Logging is structured and useful for debugging
  [ ] No hardcoded secrets, credentials, or PII
  [ ] Database queries are parameterized (no SQL injection risk)
  [ ] Input validation at boundaries
  [ ] Meaningful variable and function names
  [ ] Reasonable file and module organization

CODE REVIEW PROCESS QUESTIONS:
  - Is there a code review process? Is it enforced?
  - What is the average PR size? (Smaller is better)
  - How long do PRs sit before review? (< 24 hrs is good)
  - Are there CI/CD checks that must pass before merge?
  - Who can approve and merge?
```

---

## Architecture Review

```
ARCHITECTURE ASSESSMENT
=========================

SYSTEM OVERVIEW:
  [ ] Architecture diagram exists and is current
  [ ] System components and their responsibilities are clear
  [ ] Data flow is documented (how data moves between services)
  [ ] External integrations are documented
  [ ] API contracts are versioned and documented

DESIGN EVALUATION:
  Question                                          Assessment
  --------                                          ----------
  Is the architecture appropriate for the scale?    [ ]
  Are components loosely coupled?                   [ ]
  Can components be deployed independently?         [ ]
  Is there a clear separation of concerns?          [ ]
  Are there single points of failure?               [ ]
  Is the database schema well-designed?             [ ]
  Are API boundaries clean and well-defined?        [ ]
  Is there excessive complexity for the stage?      [ ]

COMMON ARCHITECTURE RED FLAGS:
  x Monolith that cannot be deployed in parts
  x Microservices at too early a stage (over-engineering)
  x Shared database between services (coupling)
  x No caching layer despite high-read workloads
  x Single database without read replicas at scale
  x No queue or async processing for background work
  x Tight coupling to a single cloud provider without abstraction
  x Custom-built solutions where mature open source exists

DATA ARCHITECTURE:
  [ ] Database technology is appropriate for the data model
  [ ] Backup and recovery procedures are tested
  [ ] Data migrations are versioned and reversible
  [ ] PII is identified and handled appropriately
  [ ] Analytics data is separated from production
  [ ] Data retention policies exist
```

---

## Team Assessment

```
ENGINEERING TEAM EVALUATION
=============================

TEAM STRUCTURE:
  Metric                      Green         Yellow        Red
  ------                      -----         ------        ---
  Eng team size vs. revenue   10-15% rev    15-25% rev    > 25% rev
  Manager-to-IC ratio         1:5-8         1:3-4 or 1:10 < 1:3 or > 1:12
  Attrition rate (annual)     < 15%         15-25%        > 25%
  Average tenure              > 2 years     1-2 years     < 1 year
  Key person dependencies     0-1           2-3           > 3

INTERVIEW GUIDE (for CTO/VP Eng):
  1. Walk me through your architecture and why it is designed this way.
  2. What are your top 3 technical risks right now?
  3. If you had unlimited budget, what would you fix first?
  4. How do you decide between building and buying?
  5. What is your deployment process? How often do you deploy?
  6. Tell me about your last major incident. What happened and what changed?
  7. What is your technical debt situation? How do you manage it?
  8. How do you approach hiring and retaining engineers?
  9. What would you do differently if you started the architecture over?
  10. Where does the engineering team spend most of its time?

INTERVIEW GUIDE (for individual engineers):
  1. What does a typical development cycle look like?
  2. What is your favorite and least favorite part of working here?
  3. How would you describe the code quality?
  4. Do you feel you can raise concerns and they are heard?
  5. What keeps you at this company?
  6. Are there parts of the codebase you are afraid to change?
  7. How is on-call handled? Is it sustainable?
  8. Do you have the tools and resources you need?

KEY PERSON RISK ASSESSMENT:
  For each critical system, ask: "If this person left tomorrow,
  what would break?" If the answer is "a lot," that is a red flag.
  Document bus factor for each major system component.
```

---

## Infrastructure and Operations

```
INFRASTRUCTURE ASSESSMENT
===========================

HOSTING AND DEPLOYMENT:
  [ ] Cloud provider(s) identified, costs understood
  [ ] Infrastructure as code (Terraform, CloudFormation, etc.)
  [ ] CI/CD pipeline automated and reliable
  [ ] Deployment frequency (daily or more = healthy)
  [ ] Rollback capability tested and functional
  [ ] Staging environment matches production
  [ ] Container orchestration (if applicable)

MONITORING AND OBSERVABILITY:
  [ ] Application performance monitoring (APM)
  [ ] Error tracking and alerting
  [ ] Log aggregation and search
  [ ] Uptime monitoring
  [ ] On-call rotation and escalation policy
  [ ] Incident response playbooks
  [ ] SLA definitions and tracking

COST ANALYSIS:
  Metric                          Benchmark
  ------                          ---------
  Infra cost as % of revenue      5-15% (early), 3-8% (mature)
  Cost per customer               Should decrease with scale
  Cost trend                      Sublinear to revenue growth
  Reserved vs. on-demand ratio    > 50% reserved is efficient
  Unused resources                < 10% of spend

OPERATIONAL METRICS:
  Metric                    Green         Yellow        Red
  ------                    -----         ------        ---
  Deploy frequency          Daily+        Weekly        Monthly or less
  Lead time for changes     < 1 day       1 day-1 week  > 1 week
  Change failure rate       < 15%         15-30%        > 30%
  Mean time to recovery     < 1 hour      1-4 hours     > 4 hours
  P1 incidents per month    0-1           2-3           > 3
```

---

## Security Assessment

```
SECURITY DUE DILIGENCE
========================

COMPLIANCE AND CERTIFICATIONS:
  [ ] SOC 2 Type II report (or Type I in progress)
  [ ] Penetration test within last 12 months
  [ ] GDPR compliance (if serving EU users)
  [ ] HIPAA compliance (if handling health data)
  [ ] PCI DSS (if handling payment card data)
  [ ] Privacy policy and data handling documentation

SECURITY CONTROLS:
  [ ] Authentication: MFA, strong password policies
  [ ] Authorization: Role-based access control (RBAC)
  [ ] Encryption: At rest and in transit (TLS 1.2+)
  [ ] Secrets management: Not in code, rotated regularly
  [ ] Dependency scanning: Automated, part of CI/CD
  [ ] Access reviews: Quarterly, documented
  [ ] Employee offboarding: Access revoked within 24 hours

SECURITY RED FLAGS:
  x No SOC 2 and no plans to obtain it
  x Last penetration test was > 2 years ago (or never)
  x Secrets found in source code or configuration files
  x No MFA for production access
  x Admin access not restricted or audited
  x Customer data accessible to all employees
  x No incident response plan
  x Open source dependencies with known critical vulnerabilities
  x No security training for engineers
```

---

## Risk Scoring

```
TECHNICAL RISK SCORING MATRIX
================================
Score each risk area: 1 (Low) to 5 (Critical)

Risk Area                           Score   Notes
---------                           -----   -----
Architecture suitability            [ ]     _______________
Code quality and maintainability    [ ]     _______________
Key person dependencies             [ ]     _______________
Technical debt burden               [ ]     _______________
Security posture                    [ ]     _______________
Scalability headroom                [ ]     _______________
Infrastructure reliability          [ ]     _______________
Data integrity and backups          [ ]     _______________
Open source license compliance      [ ]     _______________
Vendor dependency risk              [ ]     _______________

AGGREGATE SCORE:
  10-20: Low risk, strong technical foundation
  21-30: Moderate risk, manageable with investment
  31-40: High risk, significant investment needed post-deal
  41-50: Critical risk, may affect deal terms or viability

RISK MITIGATION COST ESTIMATION:
  For each high-risk area, estimate:
    - Cost to remediate (engineering hours x rate)
    - Timeline to remediate
    - Impact on feature development during remediation
    - Required hires to address
  Include total remediation cost in deal model.
```

---

## Report Template

```
TECHNICAL DUE DILIGENCE REPORT
=================================

EXECUTIVE SUMMARY (1 page):
  Overall assessment: [Green / Yellow / Red]
  Key findings: 3-5 bullet points
  Estimated remediation cost: $___
  Recommendation: [Proceed / Proceed with conditions / Caution / Do not proceed]

SECTION 1: ARCHITECTURE AND CODE (2-3 pages)
  Current state, strengths, risks, recommendations

SECTION 2: TEAM AND ORGANIZATION (1-2 pages)
  Team composition, key person risks, culture, hiring outlook

SECTION 3: INFRASTRUCTURE AND OPERATIONS (1-2 pages)
  Hosting, monitoring, deployment, reliability metrics

SECTION 4: SECURITY AND COMPLIANCE (1-2 pages)
  Current certifications, gaps, remediation requirements

SECTION 5: SCALABILITY AND PERFORMANCE (1 page)
  Current capacity, growth headroom, bottlenecks

SECTION 6: TECHNICAL DEBT (1 page)
  Inventory, severity, estimated cost to address

SECTION 7: RISK REGISTER (1 page)
  Ranked list of all identified risks with severity and mitigation

APPENDIX:
  - Detailed findings and evidence
  - Interview notes (anonymized)
  - Tool output reports
  - Recommended post-acquisition technical roadmap
```

---


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to tech due diligence
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback

## Output Format

When delivering due diligence guidance, provide:

1. **Scope recommendation** -- What to assess given the context and timeline
2. **Checklist** -- Specific items to evaluate per domain
3. **Interview questions** -- Tailored to the company and role being interviewed
4. **Risk assessment** -- Identified risks scored and ranked
5. **Remediation estimates** -- Cost and timeline to address findings
6. **Report structure** -- Framework for communicating findings to stakeholders
7. **Disclaimer** -- Reminder that this is a framework, not a substitute for professional diligence


```template
## Tech Due Diligence -- Structured Output

### Summary
[Key findings]

### Details
[Detailed analysis]

### Next Steps
- [ ] [Action item 1]
- [ ] [Action item 2]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with tech due diligence for my current situation"

**Output:**

Based on your situation, here is a structured approach to tech due diligence:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
