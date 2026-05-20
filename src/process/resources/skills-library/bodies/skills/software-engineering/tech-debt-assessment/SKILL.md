---
name: tech-debt-assessment
description: |
  Guides expert-level tech debt assessment implementation: refactoring and best-practices decision frameworks, production-ready patterns, and concrete templates for tech debt assessment workflows.
  Use when the user asks about tech debt assessment, tech debt assessment configuration, or refactoring best practices for tech projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "refactoring architecture best-practices"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Tech Debt Assessment

## When to Use

**Use this skill when:**
- A user wants to audit an existing codebase to identify, categorize, and prioritize technical debt before a major refactoring initiative or architecture migration
- A user needs to build a business case for allocating engineering time to debt reduction and must quantify the cost of inaction in terms executives or product managers can understand
- A team is experiencing velocity degradation, escalating defect rates, or increasing onboarding time and suspects accumulated technical debt is the root cause
- A user needs to triage which modules or services to tackle first given a fixed sprint budget (e.g., one debt-reduction sprint per quarter)
- A user wants to establish a repeatable, ongoing tech debt assessment process -- not a one-time audit -- including scoring rubrics, ownership assignments, and review cadences
- A user is evaluating a codebase acquired through M&A, open-source adoption, or vendor handoff and needs to understand the liability they are inheriting
- A team is preparing for a platform migration (e.g., monolith to microservices, on-prem to cloud) and needs to understand which components carry the highest debt load before decomposition begins

**Do NOT use this skill when:**
- The user needs guidance on a specific refactoring technique for a known code smell -- use a refactoring patterns skill instead
- The user is asking about software architecture selection (e.g., event-driven vs. REST) without a debt context -- use an architecture decision skill instead
- The user wants to set up static analysis tooling from scratch -- use a code quality tooling skill that covers tool configuration in depth
- The user needs help writing an Architecture Decision Record (ADR) for a past or future decision -- use an ADR authoring skill
- The user is asking about incident post-mortems or operational reliability assessment -- use an SRE or reliability review skill
- The user is conducting a security audit -- security vulnerabilities overlap with debt but require a dedicated threat-modeling skill with different prioritization logic

---

## Process

### Step 1: Establish Scope and Assessment Goals

Before touching the codebase, align on what the assessment is for and what is in bounds.

- **Clarify the trigger:** Is this a scheduled audit, a pre-migration inventory, a velocity investigation, or an acquisition due diligence? The trigger dictates which debt categories matter most and what the output must look like.
- **Define the system boundary:** Identify which repositories, services, or modules are in scope. For a monolith, this may be the entire codebase; for a microservices estate, scope to the 3-5 services most critical to the delivery path.
- **Identify stakeholders and their needs:** Engineering leadership needs an effort estimate and risk ranking. Product management needs a velocity-impact narrative. Executives need a cost-of-delay or risk-of-failure framing. Tailor the output to all three.
- **Set the time budget:** A meaningful assessment of a medium-sized service (50K-200K lines of code) typically takes 1-3 days with automated tooling plus 2-4 hours of structured expert review. Set expectations explicitly.
- **Collect baseline metrics upfront:** Pull cycle time, lead time for changes, change failure rate, and mean time to restore (MTTR) from the team's CI/CD and incident systems before starting the technical review. These are your "before" numbers.

---

### Step 2: Run Automated Static Analysis

Automated tools produce objective, reproducible signals that anchor the qualitative analysis.

- **Cyclomatic complexity:** Use tools like SonarQube, CodeClimate, or language-native tools (Radon for Python, NDepend for .NET, PMD for Java) to identify functions exceeding a complexity threshold. Flag any function with cyclomatic complexity above 10 as moderate debt; above 20 as critical. Functions above 50 are untestable without full refactoring.
- **Code duplication:** Measure clone coverage (percentage of duplicated code blocks) at the file and module level. A healthy codebase has less than 3% duplication. 5-15% indicates moderate debt; above 15% indicates structural debt that will cause divergence bugs.
- **Test coverage by module:** Use coverage tooling (Istanbul/nyc for JavaScript/TypeScript, pytest-cov for Python, JaCoCo for Java) and map coverage to module criticality. A critical payment processing module at 30% coverage is higher priority debt than a reporting module at 40% coverage.
- **Dependency age and vulnerability status:** Run `npm audit`, `pip-audit`, `Dependabot`, or `OWASP Dependency-Check` to identify outdated and vulnerable dependencies. Group by: current (within 2 major versions), stale (2-4 major versions behind), and end-of-life (unsupported by maintainer).
- **Coupling and cohesion metrics:** Measure afferent coupling (Ca -- how many modules depend on this one) and efferent coupling (Ce -- how many modules this one depends on). Calculate instability as Ce / (Ca + Ce). Modules with high instability (score above 0.8) AND high afferent coupling are architectural time bombs.
- **Lines of code per function and per file:** Files exceeding 500 lines and functions exceeding 50 lines are candidates for decomposition. Track the 95th percentile, not just the mean.
- **Build and lint violation counts:** Run your linter in strict mode and count violations by category. Treat these as a lower bound on code health -- well-maintained code has zero lint suppressions without documented justification.

---

### Step 3: Conduct Structured Manual Review

Automated tools miss intent, tacit knowledge, and systemic patterns. Expert review surfaces what metrics cannot.

- **Interview the domain experts:** Talk to the engineers who maintain the most-complained-about modules. Ask: "What would you rewrite first if you had a free sprint?" and "What areas do you avoid touching because they always break something else?" These anecdotes triangulate with your automated findings.
- **Review the git log for hotspot analysis:** Use `git log --format="%ae %h" -- <path>` combined with `cloc` to identify files that change frequently AND have high complexity. This is the Adam Tornhill hotspot method. A file touched by 8 different authors with complexity above 15 and no test coverage is your highest-priority debt item, regardless of what the code looks like on first read.
- **Examine error and exception patterns:** Pull the past 90 days of error logs and correlate repeated exception types to modules. A module generating 40% of production errors at 10% of system complexity has a debt multiplier -- its complexity costs are amplified by operational impact.
- **Assess documentation debt separately:** Check for absence of README files, stale architecture diagrams, missing API contracts, and undocumented environment variables. Documentation debt doubles onboarding time and creates hidden risks during incident response.
- **Review configuration and infrastructure-as-code:** Hardcoded secrets, missing environment abstractions, manually provisioned resources not captured in IaC, and divergence between staging and production configurations are debt with security and reliability implications beyond code quality.
- **Identify tribal knowledge concentrations:** Use the git blame history to identify files where more than 60% of commits come from a single author. If that author has left or could leave, this is a bus-factor debt item that needs documentation or refactoring independent of technical quality.

---

### Step 4: Categorize Debt by Type

Not all technical debt is equivalent. Categorize each identified item before scoring it.

Use the four-quadrant classification from the Fowler/Cunningham framework plus two operational additions:

- **Reckless + Deliberate (Type 1):** Shortcuts taken knowingly without a plan to fix them. "We'll just skip validation for now." These carry the highest ongoing interest rate and should be fixed first.
- **Reckless + Inadvertent (Type 2):** Mistakes made without awareness that they were debt -- poor patterns chosen by a team that didn't know better. Requires education alongside refactoring.
- **Prudent + Deliberate (Type 3):** Conscious shortcuts accepted to ship faster with an explicit plan to revisit. This is the only acceptable form of deliberate debt, but only if it is documented with a ticket and revisit date.
- **Prudent + Inadvertent (Type 4):** Design decisions that were correct at the time but are now outdated due to growth, changed requirements, or better patterns becoming available. This is expected and natural; it is managed, not eliminated.
- **Dependency Debt (Type 5):** Outdated libraries, frameworks at end-of-life, or tightly coupled vendor SDKs. This type has a compounding risk profile -- the longer it waits, the harder the upgrade path.
- **Test Debt (Type 6):** Missing or flawed tests. This is a debt multiplier -- every other type of debt is harder and riskier to pay down without test coverage backing the refactoring.

---

### Step 5: Score and Prioritize Each Debt Item

Apply a consistent scoring model to produce a ranked backlog from all identified items.

- **Impact Score (1-5):** How much does this debt slow down feature development, cause bugs, or create operational risk? Use actual data: frequency of bugs traced to this module, engineer complaints, and change failure rate contribution.
- **Effort Score (1-5):** How many engineer-days would it take to fully resolve? Use T-shirt sizes mapped to days: XS = 0.5 days, S = 1-2 days, M = 3-5 days, L = 6-10 days, XL = 10+ days.
- **Risk Score (1-5):** What is the probability and severity of a failure if this debt is not addressed? Consider: data loss risk (5), production downtime risk (4), security exposure (4-5), performance degradation (3), developer experience degradation (1-2).
- **RICE-style Priority Score:** Calculate as (Impact × Risk) / Effort. Sort the backlog by this score descending. Items scoring above 10 are immediate-sprint candidates; 5-10 are next-quarter candidates; below 5 are backlog items.
- **Dependency ordering:** Even after scoring, check for dependency chains. You cannot safely refactor Module A if Module B must be refactored first to remove the tight coupling. Build a dependency graph of debt items before finalizing the ordering.
- **Assign debt ownership:** Every scored item must have a named owning team or engineer. Unowned debt is debt with no interest payment schedule -- it will never be addressed.

---

### Step 6: Estimate the Cost of Inaction

This step is essential for building the business case to fund remediation.

- **Velocity tax calculation:** Survey the team to estimate what percentage of sprint capacity is consumed by working around known debt (slower development, manual workarounds, debugging poorly understood code). Research benchmarks suggest teams with high debt spend 23-42% of capacity on debt-related rework. Even conservative estimates (15%) translate to significant recovered velocity.
- **Defect attribution:** For the past 6 months of bugs, trace each back to a root cause module. Calculate what percentage of bug-fix engineering time can be attributed to high-debt areas. Express this as engineer-hours per quarter.
- **Onboarding time multiplier:** For each new engineer, estimate how many days of onboarding friction are attributable to undocumented or complex modules. Multiply by the cost-per-day of an engineer and the expected hiring rate.
- **Incident cost attribution:** Identify the last 3-5 major incidents. For each, determine whether technical debt contributed (e.g., hard-to-trace error handling, no circuit breakers, unmonitored dependencies). Sum the engineering hours of incident response and multiply by the team's fully-loaded hourly rate.
- **Compound interest framing:** If a Type 1 debt item currently costs 2 engineer-hours per sprint to work around, and the team ships 26 sprints per year, the annual cost is 52 engineer-hours -- roughly 1.3 engineer-weeks. Unaddressed for 3 years, this is nearly 4 engineer-weeks, plus the cost of the debt becoming more entangled as the system grows.

---

### Step 7: Produce the Assessment Report and Debt Backlog

Structure the output for both technical and non-technical audiences.

- **Executive summary (1 page maximum):** Total debt load, top 3 risk items, estimated velocity recovery from targeted remediation, and recommended quarterly budget as a percentage of engineering capacity. The standard industry recommendation is 20% of engineering capacity allocated to debt reduction -- cite this benchmark.
- **Technical debt heat map:** A matrix of modules vs. debt dimensions (complexity, coverage, duplication, dependency age, hotspot score) with red/yellow/green ratings. This is the most scannable artifact for engineering leadership.
- **Prioritized debt backlog:** Each item with its type classification, RICE score, effort estimate, risk rating, and assigned owner. This drops directly into Jira, Linear, or GitHub Issues as epics or stories.
- **Quick wins list:** Separately call out the 3-5 items that can be resolved in less than 1 day and have an impact score of 3 or higher. These are the items to tackle first to demonstrate momentum and build stakeholder confidence.
- **Remediation roadmap:** Group the backlog into three horizons -- 0-30 days (critical risk items and quick wins), 30-90 days (high-RICE items fitting in a dedicated sprint), and 90-180 days (structural refactoring requiring multi-sprint planning).
- **Re-assessment schedule:** Recommend a lightweight monthly check-in using automated metrics only, and a full manual re-assessment at 6-month intervals or before any major platform migration.

---

### Step 8: Define the Debt Prevention System

Assessment without prevention creates a recurring emergency. Embed controls to slow future debt accumulation.

- **Definition of Done criteria:** Add explicit debt-related acceptance criteria to the team's Definition of Done: new code must not decrease test coverage below the module's existing coverage floor, must not introduce lint violations, and must not increase the highest-complexity function in the file.
- **Debt tagging in issue tracking:** Establish a `tech-debt` label or tag in the team's issue tracker. Require engineers to file a debt ticket whenever they make a deliberate shortcut (Prudent + Deliberate debt). Require a link to the debt ticket in the commit that introduces the shortcut.
- **Architectural fitness functions:** Implement automated architectural tests that run in CI and fail the build when specific thresholds are violated -- e.g., no new circular dependencies, no files exceeding 500 lines, cyclomatic complexity per function capped at 15 for new code.
- **Debt budget per sprint:** Formally allocate a percentage of each sprint to debt work. 20% is the industry benchmark; teams with severe accumulated debt may need 30-40% temporarily. This must be protected from product pressure.
- **Rotating debt ownership:** Assign one engineer per sprint as the "debt shepherd" responsible for filing new debt tickets and verifying that quick-win items from the backlog are completed during the sprint.

---

## Output Format

```
# Technical Debt Assessment Report
**System:** [System/service name]
**Assessment Date:** [Date]
**Assessed By:** [Names]
**Scope:** [Repositories, services, or modules in scope]
**Trigger:** [Pre-migration | Velocity investigation | Scheduled audit | M&A due diligence]

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total debt items identified | [N] |
| Critical risk items (immediate action) | [N] |
| Estimated velocity tax (% of sprint capacity) | [X%] |
| Estimated annual cost of inaction | [N engineer-weeks or $N] |
| Recommended remediation budget (% of capacity) | [20-30%] |
| Estimated velocity recovery (post-remediation) | [X%] |

**Top 3 Risk Items:**
1. [Module/area] -- [one-sentence risk description]
2. [Module/area] -- [one-sentence risk description]
3. [Module/area] -- [one-sentence risk description]

---

## Automated Analysis Summary

| Module/Service | Cyclomatic Complexity (P95) | Duplication % | Test Coverage % | Dependency Health | Hotspot Score |
|----------------|----------------------------|---------------|-----------------|-------------------|---------------|
| [auth-service] | [24 -- CRITICAL] | [8% -- MOD] | [31% -- LOW] | [3 EOL deps] | [8.7/10] |
| [payment-core] | [11 -- MOD] | [2% -- OK] | [78% -- OK] | [1 stale dep] | [3.1/10] |
| [reporting-api] | [7 -- OK] | [18% -- HIGH] | [44% -- MOD] | [Current] | [1.9/10] |
| [user-mgmt] | [31 -- CRITICAL] | [12% -- HIGH] | [22% -- CRITICAL] | [5 EOL deps] | [9.2/10] |

**Complexity Thresholds:** OK = <10 | Moderate = 10-20 | Critical = >20
**Duplication Thresholds:** OK = <3% | Moderate = 3-10% | High = >10%
**Coverage Thresholds:** OK = >70% | Moderate = 40-70% | Low = <40% | Critical = <25%
**Hotspot Score:** 0-10 composite of change frequency × complexity × author concentration

---

## Debt Inventory and Prioritization

| ID | Module | Debt Type | Description | Impact (1-5) | Risk (1-5) | Effort (days) | RICE Score | Owner | Horizon |
|----|--------|-----------|-------------|--------------|------------|---------------|------------|-------|---------|
| TD-001 | user-mgmt | Type 1 | [description] | 5 | 5 | 5 | 5.0 | [name] | 0-30d |
| TD-002 | auth-service | Type 5 | [description] | 4 | 4 | 2 | 8.0 | [name] | 0-30d |
| TD-003 | reporting-api | Type 4 | [description] | 3 | 2 | 3 | 2.0 | [name] | 90-180d |

**RICE Score = (Impact × Risk) / Effort. Sort descending. Immediate = >10, Next quarter = 5-10, Backlog = <5.**

---

## Debt Type Classification Summary

| Type | Count | % of Total | Avg RICE Score |
|------|-------|------------|----------------|
| Type 1 -- Reckless + Deliberate | [N] | [X%] | [score] |
| Type 2 -- Reckless + Inadvertent | [N] | [X%] | [score] |
| Type 3 -- Prudent + Deliberate | [N] | [X%] | [score] |
| Type 4 -- Prudent + Inadvertent | [N] | [X%] | [score] |
| Type 5 -- Dependency Debt | [N] | [X%] | [score] |
| Type 6 -- Test Debt | [N] | [X%] | [score] |

---

## Cost of Inaction Analysis

**Velocity Tax:**
- Estimated % of sprint capacity lost to debt workarounds: [X%]
- At [N]-engineer team × [N] sprints/year × avg sprint capacity: [N] engineer-weeks/year

**Defect Attribution:**
- % of bugs in past 6 months traced to high-debt modules: [X%]
- Engineering hours on debt-related bug fixing: [N] hrs/quarter

**Incident Contribution:**
- Incidents in past 90 days with debt as contributing factor: [N of M]
- Engineering hours on debt-related incident response: [N] hrs

**Total Estimated Annual Cost of Inaction:** [N engineer-weeks] (~$[N] at [$N] fully-loaded/week)

---

## Quick Wins (< 1 Day Each, Impact ≥ 3)

| ID | Action | Module | Estimated Time | Expected Benefit |
|----|--------|--------|----------------|------------------|
| [TD-002] | [Upgrade Flask from 1.1.4 to 3.0.x] | [auth-service] | [4 hrs] | [Eliminates 2 CVEs, enables async views] |
| [TD-007] | [Extract duplicated validation logic into shared util] | [reporting-api] | [3 hrs] | [Removes 180 lines of duplicate code] |

---

## Remediation Roadmap

### Horizon 1: 0-30 Days (Critical Risk and Quick Wins)
[List TD items with ID, action, owner, estimated effort]

### Horizon 2: 30-90 Days (Dedicated Debt Sprint)
[List TD items with ID, action, owner, estimated effort]
**Recommended Sprint Format:** 1 dedicated debt sprint every 6 weeks, capacity = 40% for these items.

### Horizon 3: 90-180 Days (Structural Refactoring)
[List TD items requiring multi-sprint planning or architecture decisions]

---

## Prevention System Recommendations

- [ ] Add cyclomatic complexity cap (max 15 per function) to CI pipeline as a blocking check
- [ ] Add test coverage floor per module to CI -- reject PRs that reduce coverage below module baseline
- [ ] Adopt `tech-debt` label in [Jira/Linear/GitHub Issues] with mandatory ticket for deliberate shortcuts
- [ ] Allocate [20%] of sprint capacity formally to debt work -- protected in sprint planning
- [ ] Schedule next full re-assessment: [Date, 6 months out]
- [ ] Schedule lightweight automated-metrics-only check-in: [Date, 1 month out]

---

## Appendix: Raw Tool Outputs
[Link to or embed SonarQube/CodeClimate/Radon/coverage reports]
[Hotspot analysis raw data]
[Dependency audit output]
```

---

## Rules

1. **NEVER score debt items purely on subjective impressions.** Every item in the prioritized backlog must have at least one quantitative data point -- a coverage percentage, a complexity score, a defect count, a dependency age -- supporting its impact or risk rating. Opinion-only assessments lose credibility with engineering and product leadership within one sprint.

2. **NEVER conflate all technical debt as equally bad.** Prudent + Deliberate debt (Type 3) is a legitimate engineering tool. Calling all debt "bad" and demanding elimination destroys the team's ability to make pragmatic ship decisions. The framework must preserve the ability to take on deliberate debt with explicit documentation and a payback plan.

3. **ALWAYS use hotspot analysis (change frequency × complexity) before recommending refactoring targets.** A highly complex file that has not been touched in 18 months and has no planned features is lower priority than a moderately complex file touched 40 times in the last quarter. Refactoring stable, untouched code for aesthetic reasons wastes engineering capacity.

4. **NEVER recommend eliminating all debt within a single initiative.** A realistic debt remediation plan addresses the highest-RICE items first and acknowledges that some low-RICE items may never be worth fixing. Setting an expectation of full elimination creates burnout and sets up the assessment as a failure when normal priorities intervene.

5. **ALWAYS separate test debt identification from other debt remediation.** Test debt must be resolved BEFORE or IN PARALLEL with the module it covers. Attempting to refactor a module with 15% test coverage is high-risk regardless of how strong the refactoring plan is. The rule: bring coverage above 60% for the target module before the refactoring sprint begins.

6. **NEVER present the assessment without a cost-of-inaction estimate.** Debt backlogs without business impact data are ignored. Engineering teams already know they have debt. Stakeholders only allocate budget to address it when the alternative -- continuing to pay the velocity tax -- is made explicit in business terms.

7. **ALWAYS tie each debt item to a named owner before the assessment is complete.** Unowned debt items have a greater than 90% chance of remaining in the backlog permanently. Ownership does not mean that one person fixes it alone; it means one person is accountable for ensuring it progresses.

8. **NEVER use a single coverage threshold for all modules.** A data pipeline with no external users can operate at 50% coverage with acceptable risk. An authentication module at 50% coverage is a critical vulnerability. Apply coverage targets based on module criticality (user-facing, security-relevant, data-mutating), not blanket percentage targets.

9. **ALWAYS distinguish between debt that is expensive to live with and debt that is expensive to fix.** Some items have a high remediation cost but a low carrying cost -- they are annoying but not slowing anyone down. These belong in Horizon 3 or the permanent backlog. Items with high carrying cost but low remediation cost (quick wins) must be surfaced separately and resolved in the first sprint of any remediation plan.

10. **NEVER skip the prevention system recommendations.** An assessment without a prevention plan is guaranteed to produce another equally severe assessment in 12-18 months. The debt prevention controls -- CI fitness functions, Definition of Done criteria, debt budget allocation -- are non-optional outputs of every assessment. Without them, the assessment is remediation theater.

---

## Edge Cases

### Legacy Codebase with No Tests and No Documentation
The standard process assumes some baseline of automated coverage to triangulate with static analysis. When test coverage is below 10% system-wide and documentation is absent, the assessment must shift approach. Prioritize Test Debt (Type 6) as a prerequisite to all other debt work. Before scoring any module, create a characterization test suite using techniques from Michael Feathers' "Working Effectively with Legacy Code" -- write approval tests that capture current behavior (including bugs) to create a refactoring safety net. Do not run the full automated analysis until characterization tests exist for the top 5 highest-complexity modules. Without this foundation, any refactoring recommendation has unacceptable risk of regression.

### Acquired or Vendor-Handoff Codebase
For codebases received from an external party, the hotspot analysis is unreliable -- the git history may be incomplete, sanitized, or represent a different delivery cadence than your team will maintain. Substitute hotspot analysis with stakeholder interviews from the acquiring team about which modules they expect to touch first, combined with a domain criticality map. Double the effort estimates on all items due to the learning curve of an unfamiliar codebase. Add a "knowledge gap tax" of 1.5x to every effort estimate until the team has maintained the code for at least one quarter. Flag all modules with external API dependencies as Dependency Debt regardless of version, since vendor SDK contracts may change without the acquisition team's control.

### High-Frequency Deployment Environment (Multiple Deploys Per Day)
In teams deploying 5+ times per day, traditional refactoring sprints (where a module is frozen while being refactored) are impractical. Recommend the Strangler Fig pattern exclusively for module-level refactoring: build the new implementation alongside the old, route traffic incrementally via feature flags, and retire the old implementation only after the new one has handled 100% of traffic for a defined period (typically 2 weeks). Never recommend big-bang rewrites in this environment. Apply the Expand-Contract pattern for API and database schema changes. All debt items classified as L or XL effort must have a Strangler Fig or Expand-Contract implementation plan included in the debt ticket before work begins.

### Regulated Industry (Finance, Healthcare, Government)
In regulated environments, some technical debt cannot be assessed using standard automated tools without compliance review. Static analysis tools that transmit code to external services (SaaS versions of SonarQube, CodeClimate cloud) may violate data handling requirements. Use only on-premise or self-hosted analysis tooling. Additionally, some intentional "debt" -- such as a deprecated but still-used cryptographic library retained for FIPS compliance -- is not remediable without regulatory re-certification. Classify these items as "Compliance-Locked" rather than standard debt types and exclude them from RICE scoring. They require a separate regulatory track, not an engineering remediation sprint.

### Distributed Microservices (50+ Services)
Assessing 50+ services simultaneously is infeasible in the time budget of a standard assessment. Apply a tiered approach. Tier 1 (assess fully): services in the critical path of the highest-revenue or highest-volume user flows. Identify these using distributed tracing data (Jaeger, Zipkin, or cloud-native equivalents). Tier 2 (automated analysis only): services outside the critical path. Tier 3 (no assessment): services marked for deprecation or with planned rewrites already scheduled. For inter-service debt -- inconsistent API contracts, missing circuit breakers, synchronous chains longer than 3 hops -- use a service dependency graph produced from tracing data rather than code analysis.

### Team Resistance to Debt Acknowledgment
In organizations where engineers fear that acknowledging debt will result in blame or performance consequences, the assessment will be sabotaged through minimization or concealment. Before beginning the technical work, establish a blameless framing in writing: the assessment evaluates the system, not the people who built it, and all debt is understood as the result of reasonable decisions made under constraints that existed at the time. If leadership has previously used quality metrics punitively, this framing must be reinforced by a senior leader (VP Engineering or CTO) before data collection begins. Consider anonymizing the git attribution in the hotspot analysis and presenting only aggregate data in the first report to build trust. The prevention system must explicitly state that future debt tickets filed by engineers are recognized as professional behavior, not admissions of failure.

### Post-Assessment Prioritization Conflict Between Engineering and Product
A common failure mode is completing a thorough assessment only to have product management override the remediation roadmap in favor of feature work. Address this proactively by including a "debt-feature coupling" analysis in the report: for each item in Horizon 1 and 2, identify which planned product features will be directly slowed or blocked by the unresolved debt. Present these as pre-conditions, not trade-offs. For example: "The proposed real-time notification feature requires changes to user-mgmt. With current test coverage at 22% and complexity at 31, the feature will take 3x longer to implement safely than estimated, or carry a 40% regression risk if rushed." This reframes debt as a feature velocity issue, not a quality abstraction.

---

## Example

**Input:** "We have a 4-year-old Python monolith (Django) running an e-commerce platform -- about 180,000 lines of code across 12 apps. The team is 8 engineers. We've noticed that shipping features is taking longer and longer, and we had two production incidents last quarter that were traced back to our checkout and inventory apps. We're also considering splitting off the checkout service as a microservice in the next 6 months. We've never done a formal tech debt assessment. Where do we start and what should we look like when we're done?"

---

**Output:**

Given your trigger (velocity degradation + two production incidents + a planned microservice extraction), you have a clear, time-bound reason to do this assessment now -- not as a general quality exercise but as risk management before a migration that will be significantly more complex if checkout carries unresolved debt into the new service.

Here is the assessment I would run for your situation:

---

# Technical Debt Assessment Report
**System:** E-commerce Platform Monolith (Django)
**Assessment Date:** [Assessment Date]
**Assessed By:** [Lead Engineer + Senior Architect]
**Scope:** All 12 Django apps in the main monolith repository, with priority focus on `checkout` and `inventory` apps
**Trigger:** Velocity degradation investigation + pre-microservice-extraction due diligence

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total debt items identified | 31 |
| Critical risk items (immediate action) | 5 |
| Estimated velocity tax (% of sprint capacity) | 28% |
| Estimated annual cost of inaction | ~19 engineer-weeks (~$190,000 at $200K fully-loaded/year) |
| Recommended remediation budget (% of capacity) | 30% (elevated due to pre-migration urgency) |
| Estimated velocity recovery (post-remediation of Horizon 1+2 items) | 15-20% of sprint capacity |

**Top 3 Risk Items:**
1. `checkout/views.py` -- 2,800-line file with cyclomatic complexity of 47, 18% test coverage, and 5 of 6 payment gateway integrations sharing a single error handler that swallows exceptions silently. This is the direct root cause of Incident 2 last quarter.
2. `inventory/models.py` -- 11 raw SQL queries bypassing the Django ORM with no parameterization audit, creating both a correctness risk and a latent SQL injection surface. Root cause of Incident 1.
3. `requirements.txt` -- Django 3.2 (LTS expires April 2024), Celery 4.x (EOL), and Pillow 8.x (3 known CVEs). Upgrading these is a prerequisite to the microservice extraction -- migrating a service pinned to EOL dependencies into a new deployment target creates a compounding liability.

---

## Automated Analysis Summary

Run the following tools before the manual review:

```bash
# Complexity analysis (install radon)
pip install radon
radon cc . -s -a --min B  # Show all functions rated B or worse
radon mi . -s             # Maintainability index by file

# Duplication
pip install flake8-bugbear pep8-naming
# Or use jscpd for cross-file clone detection:
npx jscpd . --min-tokens 50 --reporters json

# Coverage
pytest --cov=. --cov-report=term-missing --cov-report=html

# Dependency audit
pip-audit

# Hotspot analysis (requires git log)
git log --format="%H %ae" --name-only | python hotspot_analyzer.py
# (Adam Tornhill's approach -- count commits per file, weight by complexity)
```

| App | Cyclomatic Complexity (P95) | Duplication % | Test Coverage % | Dependency Issues | Hotspot Score |
|-----|----------------------------|---------------|-----------------|-------------------|---------------|
| checkout | 47 -- CRITICAL | 14% -- HIGH | 18% -- CRITICAL | 0 | 9.4/10 |
| inventory | 29 -- CRITICAL | 9% -- MODERATE | 31% -- LOW | 0 | 8.1/10 |
| catalog | 12 -- MODERATE | 5% -- MODERATE | 62% -- OK | 0 | 4.2/10 |
| users | 8 -- OK | 2% -- OK | 71% -- OK | 0 | 2.1/10 |
| orders | 19 -- MODERATE | 11% -- HIGH | 44% -- MODERATE | 0 | 6.7/10 |
| payments | 22 -- CRITICAL | 6% -- MODERATE | 25% -- CRITICAL | 0 | 7.9/10 |
| notifications | 6 -- OK | 18% -- HIGH | 58% -- MODERATE | 0 | 1.8/10 |
| reporting | 9 -- OK | 21% -- HIGH | 39% -- LOW | 0 | 1.4/10 |
| admin_tools | 14 -- MODERATE | 7% -- MODERATE | 48% -- MODERATE | 0 | 3.3/10 |
| shipping | 11 -- MODERATE | 4% -- OK | 55% -- MODERATE | 0 | 3.7/10 |
| promotions | 16 -- MODERATE | 8% -- MODERATE | 41% -- MODERATE | 0 | 4.8/10 |
| core (shared) | 7 -- OK | 3% -- OK | 66% -- OK | 0 | 2.9/10 |
| **Dependency Layer** | -- | -- | -- | Django 3.2 EOL, Celery 4.x EOL, Pillow 8.x (3 CVEs), 4 stale packages | -- |

---

## Debt Inventory and Prioritization

| ID | App | Debt Type | Description | Impact | Risk | Effort (days) | RICE Score | Owner | Horizon |
|----|-----|-----------|-------------|--------|------|---------------|------------|-------|---------|
| TD-001 | checkout | Type 1 | `checkout/views.py` monolith (2,800 lines) -- single file handles cart, payment, fulfillment dispatch, and error reporting with no separation of concerns | 5 | 5 | 12 | 2.1 | checkout team | 30-90d |
| TD-002 | checkout | Type 6 | Test coverage at 18% across checkout app -- no tests for 4 of 6 payment gateway integrations | 5 | 5 | 5 | 5.0 | checkout team | 0-30d |
| TD-003 | payments | Type 1 | Silent exception swallowing in shared payment error handler -- `except Exception: pass` pattern in 7 call sites | 5 | 5 | 1 | 25.0 | payments team | 0-30d |
| TD-004 | inventory | Type 1 | 11 raw SQL queries with no parameterization -- confirmed SQLi surface, also bypasses Django signals causing cache invalidation failures | 5 | 5 | 3 | 8.3 | inventory team | 0-30d |
| TD-005 | dependency | Type 5 | Django 3.2 LTS expires April 2024 -- upgrade to Django 4.2 LTS required before microservice extraction | 4 | 4 | 8 | 2.0 | platform team | 30-90d |
| TD-006 | dependency | Type 5 | Celery 4.x EOL -- upgrade to Celery 5.x (breaking config changes required) | 4 | 4 | 4 | 4.0 | platform team | 30-90d |
| TD-007 | dependency | Type 5 | Pillow 8.x -- 3 known CVEs including CVE-2023-44271 (DoS via crafted image). Upgrade to 10.x | 3 | 4 | 0.5 | 24.0 | any | 0-30d |
| TD-008 | orders | Type 4 | Order status state machine implemented as ad-hoc if/elif chain across 3 files -- was adequate at 1K orders/day, creates race conditions above 10K/day | 4 | 3 | 5 | 2.4 | orders team | 30-90d |
| TD-009 | reporting | Type 2 | 21% code duplication in reporting app -- 6 near-identical report generators with hardcoded column definitions | 2 | 1 | 3 | 0.7 | reporting team | 90-180d |
| TD-010 | notifications | Type 2 | 18% code duplication -- email, SMS, and push notification builders share 80% logic but were implemented independently | 2 | 2 | 2 | 2.0 | notifications team | 90-180d |
| TD-011 | checkout | Type 3 | Checkout session stored in Django session (cookie-backed) rather than Redis -- deliberate shortcut from 2021, now blocking horizontal scaling | 4 | 3 | 4 | 3.0 | checkout team | 30-90d |
| TD-012 | payments | Type 6 | No integration tests for webhook receipt handlers -- payment status updates from Stripe/PayPal are untested | 5 | 5 | 3 | 8.3 | payments team | 0-30d |

*(19 additional items in full backlog -- omitted for brevity)*

---

## Cost of Inaction Analysis

**Velocity Tax:**
- Team survey estimate: 28% of sprint capacity consumed by debt workarounds (debugging, manual retries, avoiding fragile modules)
- At 8 engineers × 26 sprints/year × 10 days/sprint × 28% = 582 engineer-days/year = ~29 engineer-weeks/year lost

**Defect Attribution:**
- Past 6 months: 73 production bugs. 41 (56%) traced to `checkout`, `inventory`, or `payments` apps.
- Estimated engineering hours on debt-related bug fixing: 180 hrs/quarter

**Incident Contribution:**
- 2 of 2 production incidents last quarter had technical debt as primary root cause
- Combined incident response: 47 engineering hours (RCA + hotfix + post-mortem)
- Customer impact: ~$28,000 in chargebacks and order cancellations attributed to Incident 2 (payment errors)

**Microservice Extraction Risk Premium:**
- Extracting `checkout` at current debt levels would require 3-4x the engineering effort of a clean-slate extraction
- Estimated additional cost of migrating with unresolved debt: 6-8 engineer-weeks of remediation inside the microservice scope that should have been resolved in the monolith

**Total Estimated Annual Cost of Inaction:** ~29 engineer-weeks (~$290,000 at $200K/year fully-loaded) -- plus the $28,000 direct incident cost and the 6-8 week microservice extraction penalty

---

## Quick Wins (< 1 Day Each, Impact ≥ 3)

| ID | Action | App | Estimated Time | Expected Benefit |
|----|--------|-----|----------------|------------------|
| TD-003 | Replace 7 `except Exception: pass` sites with explicit error handling and structured logging | payments | 3 hrs | Directly prevents recurrence of Incident 2; surfaces payment failures that are currently invisible |
| TD-007 | `pip install --upgrade Pillow` to 10.x, run regression on image upload flows | dependency | 2 hrs | Eliminates 3 CVEs including one DoS vector |
| TD-012 (partial) | Write smoke tests for Stripe and PayPal webhook receipt handlers using their test event fixtures | payments | 6 hrs | Catches webhook handler regressions before deploy; Stripe provides a full test event library via `stripe trigger` CLI |

---

## Remediation Roadmap

### Horizon 1: 0-30 Days -- Stop the Bleeding

| ID | Action | Owner | Effort |
|----|--------|-------|--------|
| TD-003 | Fix silent exception swallowing in payment error handler | payments team | 3 hrs |
| TD-007 | Upgrade Pillow to 10.x | any | 2 hrs |
| TD-012 | Add webhook handler smoke tests | payments team | 6 hrs |
| TD-002 | Begin characterization tests for checkout app -- target 40% coverage as a floor before refactoring begins | checkout team | 5 days |
| TD-004 | Audit and parameterize all 11 raw SQL queries in inventory app | inventory team | 3 days |

**Sprint allocation for Horizon 1:** 30% of one sprint (6-day dedicated block for a team of 8)

### Horizon 2: 30-90 Days -- Structural Risk Reduction

| ID | Action | Owner | Effort |
|----|--------|-------|--------|
| TD-001 | Decompose `checkout/views.py` into CartService, PaymentOrchestrator, FulfillmentDispatcher -- requires TD-002 floor achieved first | checkout team | 12 days |
| TD-005 | Upgrade Django 3.2 to 4.2 LTS -- run django-upgrade tool, address deprecation warnings systematically | platform team | 8 days |
| TD-006 | Upgrade Celery 4.x to 5.x -- migrate configuration from `CELERY_*` prefix to lowercase | platform team | 4 days |
| TD-011 | Migrate checkout sessions from cookie backend to Redis via `django-redis` -- prerequisite for horizontal scaling | checkout team | 4 days |
| TD-008 | Implement order status transitions as an explicit state machine using `django-fsm` | orders team | 5 days |

**Sprint allocation for Horizon 2:** Dedicated 2-week debt sprint (one per 6-week cycle). Reserve the full sprint for these items -- no feature work.

**Critical sequencing note:** TD-001 (checkout decomposition) is the prerequisite for the microservice extraction. The 6-month migration timeline requires this to be complete by the end of Horizon 2. If the Django upgrade (TD-005) slips, accelerate it -- running a microservice extraction on Django 3.2 while the monolith is mid-upgrade to 4.2 creates a version split that will take weeks to reconcile.

### Horizon 3: 90-180 Days -- Quality Normalization

| ID | Action | Owner | Effort |
|----|--------|-------|--------|
| TD-009 | Refactor reporting generators into a parameterized report-builder pattern | reporting team | 3 days |
| TD-010 | Extract shared notification logic into a NotificationBuilder base class | notifications team | 2 days |
| *(remaining 17 lower-RICE items)* | Address in 20% allocation across regular sprints | assigned owners | ongoing |

---

## Prevention System Recommendations

Add the following to your CI pipeline and team process immediately:

```python
# In your CI configuration (e.g., GitHub Actions), add a quality gate step:

# 1. Radon complexity gate -- fail build if any function exceeds complexity 15
radon cc . --min C -j | python -c "
import json, sys
data = json.load(sys.stdin)
violations = [(f, b['name'], b['complexity'])
              for f, blocks in data.items()
              for b in blocks if b['complexity'] > 15]
if violations:
    for f, name, score in violations:
        print(f'COMPLEXITY VIOLATION: {f}::{name} = {score}')
    sys.exit(1)
"

# 2. Coverage floor -- fail build if coverage drops below module floor
# In pytest.ini or pyproject.toml:
# [tool.pytest.ini_options]
# addopts = "--cov=. --cov-fail-under=40"
# (Start at 40 as a floor, raise by 5 points per quarter)

# 3. Dependency vulnerability gate
pip-audit --fail-on-vuln
```

- [ ] Add `tech-debt` label to GitHub Issues. Require a linked debt ticket for any PR that includes a `# TODO`, `# FIXME`, or `# HACK` comment, or suppresses a linter warning
- [ ] Formally reserve 20% of each sprint for debt (increase to 30% for next 2 quarters given migration timeline)
- [ ] Designate one engineer per sprint as debt shepherd -- responsible for filing new debt tickets discovered during feature work and verifying Horizon 1 quick wins are not regressing
- [ ] Schedule lightweight automated check-in: [1 month from assessment date] -- re-run Radon, pip-audit, and coverage only
- [ ] Schedule full re-assessment: [6 months from assessment date] -- full process, measure delta from this baseline
- [ ] Before microservice extraction kicks off: require that `checkout` app test coverage is above 60% and TD-001 decomposition is complete. Make this a hard go/no-go criterion in the migration kickoff checklist.

---

**A note on the microservice extraction timeline:** The 6-month window is achievable if Horizon 1 and 2 items are completed on schedule. The checkout decomposition in TD-001 directly produces the service boundary you need -- a PaymentOrchestrator class with clean inputs and outputs is extractable into a microservice with 2-3 weeks of infrastructure work. Attempting the extraction with the current `checkout/views.py` monolith would require decomposing the service architecture AND the code simultaneously under deployment pressure, which has a high failure rate. Do the decomposition in the monolith first, then extract. It is counterintuitive but faster.
