---
name: risk-assessment
description: |
  Produces a risk assessment with likelihood-impact matrix, risk register,
  and mitigation plans using risk management methodology. Use when the
  user asks to create a risk assessment, build a risk matrix, identify
  and prioritize risks for a project or business, develop risk mitigation
  plans, or prepare a risk register for stakeholder review.
  Do NOT use for process failure analysis (use failure-mode-analysis),
  financial risk modeling (use finance skills), or security threat
  assessment (requires specialized security expertise).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis planning strategy decision-making"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Risk Assessment

## When to Use

Use this skill when the user's request maps to one of these specific scenarios:

- User asks to create a risk assessment, risk register, or risk analysis for a project, product launch, business initiative, operational program, or organizational change
- User wants to build a likelihood-impact matrix to prioritize risks and allocate mitigation resources
- User needs to identify and categorize risks across multiple domains (technical, operational, financial, regulatory, reputational, external) before making a go/no-go decision
- User is preparing a risk register or risk summary for presentation to a board, executive team, steering committee, or external stakeholder such as an investor or regulator
- User wants to evaluate whether a proposed initiative is within the organization's risk tolerance before committing budget and resources
- User needs to develop specific mitigation plans -- including owners, timelines, costs, and residual risk scores -- for risks already identified
- User is establishing a recurring risk monitoring cadence for an ongoing operation, program, or business function
- User needs to compare the risk profiles of two or more strategic options as part of a decision analysis

**Do NOT use this skill when:**

- The user needs structured failure analysis for a specific process, machine, or system component -- use the `failure-mode-analysis` skill, which applies FMEA methodology with severity, occurrence, and detectability dimensions
- The user needs financial scenario modeling, stress testing, Value at Risk (VaR) calculations, or credit risk assessment -- these require quantitative finance methods outside this skill's scope
- The user needs a cybersecurity threat model, penetration testing plan, or information security risk assessment -- these require STRIDE, PASTA, or CVE-based methodologies that are domain-specific
- The user is asking for a root cause analysis of something that already went wrong -- that is a post-incident review, not a prospective risk assessment
- The user wants a SWOT analysis -- use the `swot-analysis` skill, which focuses on strategic strengths and opportunities, not risk prioritization and mitigation
- The user needs compliance gap analysis against a specific regulatory framework such as SOC 2, ISO 27001, or HIPAA -- these require control-mapping methodology, not a general risk register
- The user needs actuarial risk modeling with statistical distributions -- this skill uses qualitative-to-semi-quantitative scoring, not probabilistic simulation

---

## Process

### Step 1: Establish the Risk Assessment Context

Before producing any output, gather the minimum context needed to make the assessment meaningful. Do not assume context -- ask if it is missing.

- **Subject of assessment:** Define precisely what is being assessed. A "product launch" risk assessment is structured differently from a "vendor onboarding" or "organizational restructuring" assessment. Get the name, scope boundaries, and whether this is a project (defined end) or operation (ongoing).
- **Timeline and phase:** Understand how much time exists before launch, go-live, or the next decision gate. Risks with a 6-month horizon are managed differently from risks with a 2-week horizon. For projects, identify which phase is active (discovery, design, build, test, deploy).
- **Risk categories to include:** Use the standard taxonomy below but confirm with the user whether any categories are out of scope or if domain-specific categories should be added (e.g., "clinical trial risk" for a pharma project, "supply chain risk" for a manufacturing operation).
- **Organizational risk tolerance:** Conservative organizations treat medium risks as requiring mitigation; aggressive organizations may accept high risks. This is not a minor detail -- it determines which risks get mitigation plans. If unknown, default to moderate.
- **Existing controls:** Ask what safeguards, processes, or policies already exist. Do not recommend building what already exists. Identify gaps in existing controls rather than starting from zero.
- **Known risks:** Ask what concerns already exist in the team's mind. Known risks are the starting point; the systematic identification in Step 2 extends beyond them.
- **Stakeholder audience:** Who will receive this assessment -- a technical team, an executive committee, a board, an external auditor? This determines the level of technical detail, the language register, and the depth of supporting narrative.

---

### Step 2: Systematically Identify Risks Across All Categories

Use the following taxonomy to ensure comprehensive coverage. For each category, think through the specific failure modes, dependencies, and external factors relevant to the subject being assessed.

- **Operational risks:** Process failures, resource constraints, key-person dependencies, vendor or supplier failures, capacity limitations, quality control breakdowns, handoff failures between teams. Ask: what must function correctly for this to succeed, and what could stop it from functioning?
- **Technical risks:** System integration failures, performance under load, data integrity issues, architectural limitations, third-party API reliability, deployment pipeline failures, technical debt that creates fragility. For software: focus on regression risk, scalability, and data migration.
- **Financial risks:** Budget overruns, cost estimate errors, currency exposure, funding availability, ROI assumptions that prove incorrect. Note: deep financial modeling belongs in finance skills -- this category captures budget and cost risks at a project level.
- **Regulatory and compliance risks:** Changes in law or regulation, permit requirements, licensing requirements, mandatory reporting obligations, failure to meet contractual obligations, data privacy requirements (GDPR, CCPA). In regulated industries, compliance risks are often treated as automatic Critical regardless of likelihood.
- **Reputational risks:** Customer-facing failures, media exposure, social media amplification of failures, damage to brand trust, negative reviews or analyst ratings. Rate severity based on the breadth of audience affected and the permanence of the damage.
- **Market and competitive risks:** Competitor action, market timing failures, customer demand assumptions that prove wrong, pricing pressure, channel disruption. These are often lower probability but high impact if they materialize during a launch window.
- **External and environmental risks:** Economic downturns, geopolitical disruption, natural disasters, pandemic-level disruptions, supply chain shocks. These are typically rare but severe and often outside the organization's control -- the primary mitigation strategy is contingency planning and resilience.
- **People and organizational risks:** Team turnover, skill gaps, change resistance, leadership misalignment, organizational restructuring during the initiative, contractor availability. Key-person risk -- where a single individual's departure causes critical failure -- deserves its own entry.

For each identified risk, write it as a complete risk statement using this structure: "[Cause/Trigger] leads to [Risk Event], resulting in [Consequence/Impact]." This forces specificity. "Vendor delay" is not a risk statement. "Primary data vendor fails to deliver API credentials before sprint 3 begins, causing a 3-week delay to the integration milestone and pushing the launch date past the committed customer deadline" is a risk statement.

---

### Step 3: Score Likelihood for Each Risk

Apply the 1-5 likelihood scale consistently. The key discipline is anchoring scores to evidence, not intuition.

- **Score 1 -- Rare (<5% probability):** No precedent in this context, would require multiple simultaneous failures to materialize. Example: a core cloud provider experiencing a multi-region outage lasting more than 24 hours.
- **Score 2 -- Unlikely (5-20%):** Has occurred in comparable situations but is not expected here. Example: a key engineer resigning during a 6-week sprint when turnover in the team is historically low.
- **Score 3 -- Possible (20-50%):** A reasonable person would consider this a genuine possibility given current conditions. Example: a third-party integration completing later than scheduled when the vendor has a history of slow delivery.
- **Score 4 -- Likely (50-80%):** Based on current evidence, this is expected to happen unless something changes. Example: a feature requiring rework when user research has not yet validated the design.
- **Score 5 -- Almost Certain (>80%):** Will materialize unless specific action is taken. Example: a performance bottleneck when load testing has already revealed degradation at 60% of target traffic.

Calibration discipline: Force spread across the 1-5 scale. If more than 40% of risks cluster at score 3, revisit the ratings. A realistic assessment will have risks distributed across at least 3 likelihood levels.

---

### Step 4: Score Impact for Each Risk

Impact is scored on what happens to the business or project if the risk materializes in its expected form -- not in a worst-case catastrophic scenario.

- **Score 1 -- Negligible:** Absorbed within normal operations, no timeline or budget effect, no escalation required. Handled by the team without management involvement.
- **Score 2 -- Minor:** Small, recoverable cost or schedule impact (less than 5% budget increase or 1-2 week delay). Requires management awareness but not intervention.
- **Score 3 -- Moderate:** Noticeable effect requiring management attention and resource reallocation. Budget impact of 5-15%, schedule impact of 2-6 weeks, or degraded but acceptable quality.
- **Score 4 -- Major:** Significant threat to project success requiring executive intervention. Budget impact greater than 15%, schedule impact greater than 6 weeks, significant quality degradation, or customer-visible service disruption.
- **Score 5 -- Severe:** Project or initiative failure, major customer or revenue loss, regulatory action, irreversible reputational damage, or organizational-level financial impact.

Impact calibration: Consider multiple dimensions -- schedule, budget, quality, customer experience, regulatory, and reputational -- and score based on the most severe dimension affected. A risk that has negligible budget impact but causes a data privacy breach should be scored 5 on impact because the regulatory and reputational consequences are severe.

---

### Step 5: Calculate Risk Scores, Classify Priority, and Map the Matrix

- **Risk Score = Likelihood (1-5) x Impact (1-5)**, producing a 1-25 scale
- **Priority Classification:**
  - Critical: Score 20-25 -- Requires immediate mitigation plan, executive ownership, and daily monitoring
  - High: Score 12-19 -- Requires a documented mitigation plan, senior ownership, and weekly monitoring
  - Medium: Score 6-11 -- Requires mitigation consideration; can be managed at team level with monthly review
  - Low: Score 1-5 -- Accepted or monitored passively; document the acceptance decision
- Map each risk to its cell in the 5x5 likelihood-impact matrix using the risk ID number, not the full risk name
- Sort the risk register by score descending to create the priority-ordered list
- Apply forced differentiation: if all risks cluster in one band (e.g., all Medium), revisit scoring criteria. A realistic assessment of a complex initiative should produce at least one Critical or High risk.
- Calculate aggregate risk exposure: sum all risk scores to produce a total exposure number. This allows comparison across assessments and tracking of overall risk reduction over time.

---

### Step 6: Develop Mitigation Plans for Critical and High Risks

Every Critical and High risk requires a documented mitigation plan. Medium risks require at minimum a monitoring plan. Low risks require only a documented acceptance decision.

Choose the appropriate mitigation strategy for each risk:

- **Avoid:** Eliminate the activity or condition that creates the risk entirely. Most powerful but often impractical -- avoiding a technical risk by not building the feature avoids the risk but also the value.
- **Reduce (Mitigate):** Take specific actions that lower the likelihood, the impact, or both. This is the most common strategy. Reducing likelihood requires controls that prevent the risk from materializing. Reducing impact requires contingency plans and response capabilities.
- **Transfer:** Shift financial consequences to a third party through insurance, contractual warranties, service level agreements with penalties, or subcontracting. Transfer does not eliminate the operational disruption -- it shifts the financial cost.
- **Accept:** Document the conscious decision to accept the risk without further mitigation. Acceptance is appropriate when: (a) the cost of mitigation exceeds the expected cost of the risk, (b) the risk is below the organization's tolerance threshold, or (c) mitigation options are genuinely unavailable. Acceptance is never the default -- it requires an explicit decision by an appropriate authority.

For each mitigation plan, specify:
- The specific actions to be taken (numbered, concrete, not vague)
- The owner by role, not just name -- roles persist when people change
- The completion deadline in concrete terms (e.g., "before first integration sprint begins" rather than "soon")
- The estimated cost of mitigation: staff-hours, vendor cost, or dollar amount
- The residual risk score after mitigation is implemented -- this is the score that goes into the "after controls" view of the register
- The early warning indicator: the observable signal that tells you this risk is starting to materialize before it becomes a full incident

---

### Step 7: Define the Monitoring and Review Plan

A risk assessment is a living document, not a one-time deliverable. Define how it will be maintained.

- **Review cadence by risk level:** Critical risks reviewed weekly. High risks reviewed bi-weekly. Medium and Low risks reviewed monthly or at project phase gates.
- **Risk indicators:** For each High and Critical risk, define the leading indicator -- the measurable or observable signal that tells you the risk is trending worse before it materializes. For an engineering delay risk, the indicator might be sprint velocity dropping below 80% of planned story points for two consecutive sprints.
- **Escalation thresholds:** Define when a risk should be escalated from team level to manager, from manager to executive, or from executive to board. Common trigger: a risk score increases by more than 4 points between review cycles, or a new Critical risk is identified.
- **Risk status tracking:** At each review, classify each risk as: Open (active, not yet materialized), Closed (no longer relevant, risk has passed), Materialized (the risk occurred -- document it as an issue), or Escalated (elevated to a higher decision authority).
- **Register update triggers:** Beyond scheduled reviews, update the register immediately when: a new risk is identified, a mitigation action is completed, the project scope or timeline changes significantly, or an external event changes the risk landscape.

---

## Output Format

```
## Risk Assessment: [Project/Initiative Name]

**Scope:** [Precise description of what is included and excluded]
**Assessed by:** [Role/Title]
**Date:** [YYYY-MM-DD]
**Next Review:** [YYYY-MM-DD]
**Risk Tolerance:** [Conservative / Moderate / Aggressive]
**Assessment Version:** [1.0 -- increment on each update]

---

### Executive Summary

**Total Risks Identified:** [X]
**Critical (20-25):** [X] | **High (12-19):** [X] | **Medium (6-11):** [X] | **Low (1-5):** [X]
**Total Risk Exposure Score:** [Sum of all risk scores] / [Maximum possible = X risks x 25]

**Top 3 Risks Requiring Immediate Attention:**
1. [Risk ID + Name] -- Score: [X/25] -- [One precise sentence describing the risk event and its consequence]
2. [Risk ID + Name] -- Score: [X/25] -- [One precise sentence]
3. [Risk ID + Name] -- Score: [X/25] -- [One precise sentence]

**Single Most Urgent Action:** [One specific action that reduces overall exposure most efficiently -- not a vague recommendation]

**Overall Risk Posture:** [Acceptable / Borderline / Unacceptable] given the organization's [conservative/moderate/aggressive] risk tolerance

---

### Likelihood-Impact Matrix

*Risk IDs are placed in the corresponding cell. Cells are color-coded by priority band.*

|  | **Negligible (1)** | **Minor (2)** | **Moderate (3)** | **Major (4)** | **Severe (5)** |
|---|---|---|---|---|---|
| **Almost Certain (5)** | 5 -- MED | 10 -- MED | 15 -- HIGH | 20 -- CRIT | 25 -- CRIT |
| **Likely (4)** | 4 -- LOW | 8 -- MED | 12 -- HIGH | 16 -- HIGH | 20 -- CRIT |
| **Possible (3)** | 3 -- LOW | 6 -- MED | 9 -- MED | 12 -- HIGH | 15 -- HIGH |
| **Unlikely (2)** | 2 -- LOW | 4 -- LOW | 6 -- MED | 8 -- MED | 10 -- MED |
| **Rare (1)** | 1 -- LOW | 2 -- LOW | 3 -- LOW | 4 -- LOW | 5 -- MED |

*Risk IDs placed in their cells:*
[List each Risk ID in its matrix cell -- e.g., "Almost Certain / Major: R1, R3"]

---

### Risk Register (Priority Order)

| ID | Risk Statement | Category | Likelihood (1-5) | Impact (1-5) | Score | Priority | Owner | Status |
|----|----------------|----------|-----------------|-------------|-------|----------|-------|--------|
| R1 | [Full risk statement: cause → event → consequence] | [Category] | [L] | [I] | [LxI] | Critical | [Role] | Open |
| R2 | [Full risk statement] | [Category] | [L] | [I] | [LxI] | High | [Role] | Open |
| R3 | [Full risk statement] | [Category] | [L] | [I] | [LxI] | High | [Role] | Open |
| R4 | [Full risk statement] | [Category] | [L] | [I] | [LxI] | Medium | [Role] | Open |
| R5 | [Full risk statement] | [Category] | [L] | [I] | [LxI] | Medium | [Role] | Open |
| R6 | [Full risk statement] | [Category] | [L] | [I] | [LxI] | Low | [Role] | Open |

---

### Existing Controls Assessment

*Document controls already in place before recommending new ones.*

| Risk ID | Existing Control | Control Type | Effectiveness | Gap |
|---------|-----------------|--------------|---------------|-----|
| [R1] | [What is currently in place -- specific, not generic] | Preventive / Detective / Corrective | Strong / Moderate / Weak | [What the control does not cover] |
| [R2] | [Existing control] | [Type] | [Effectiveness] | [Gap] |
| [R3] | None identified | -- | -- | [Full exposure -- no controls exist] |

*Control types: Preventive (stops the risk), Detective (identifies the risk as it occurs), Corrective (reduces impact after the risk materializes)*

---

### Mitigation Plans

*Required for all Critical and High risks. Medium risks include monitoring plan. Low risks include acceptance documentation.*

---

**[R1]: [Risk Name] -- CRITICAL (Score: [X/25])**

| Element | Details |
|---------|---------|
| **Strategy** | [Avoid / Reduce / Transfer / Accept] |
| **Action 1** | [Specific, numbered action -- who does what by when] |
| **Action 2** | [Specific action] |
| **Action 3** | [Specific action] |
| **Owner** | [Role] |
| **Completion Deadline** | [Specific date or project milestone] |
| **Estimated Mitigation Cost** | [Dollar amount or staff-hours] |
| **Residual Likelihood** | [Score after mitigation] |
| **Residual Impact** | [Score after mitigation] |
| **Residual Risk Score** | [New score -- should be lower than original] |
| **Early Warning Indicator** | [Specific observable signal that the risk is materializing] |
| **Escalation Trigger** | [The threshold at which this risk is escalated to a higher authority] |

---

**[R2]: [Risk Name] -- HIGH (Score: [X/25])**

[Same table structure as above]

---

**[R3]: [Risk Name] -- HIGH (Score: [X/25])**

[Same table structure as above]

---

**[R4]: [Risk Name] -- MEDIUM (Score: [X/25]) -- Monitoring Plan**

| Element | Details |
|---------|---------|
| **Strategy** | [Reduce / Accept with monitoring] |
| **Monitoring Indicator** | [What to watch] |
| **Review Frequency** | [Weekly / Monthly] |
| **Escalation Trigger** | [When this moves from Medium to High -- what change in conditions triggers re-scoring] |

---

**[R6]: [Risk Name] -- LOW (Score: [X/25]) -- Accepted**

| Element | Details |
|---------|---------|
| **Acceptance Decision** | [Explicit statement that this risk is accepted] |
| **Rationale** | [Why mitigation is not warranted -- cost, probability, or tolerance argument] |
| **Accepted By** | [Role with authority to accept] |

---

### Monitoring and Review Plan

| Risk ID | Early Warning Indicator | Monitoring Method | Review Frequency | Escalation Threshold | Escalation Path |
|---------|------------------------|-------------------|-----------------|---------------------|----------------|
| [R1] | [Specific measurable signal] | [How it is tracked -- dashboard, meeting, report] | Weekly | [Specific condition that triggers escalation] | [Role → Role] |
| [R2] | [Indicator] | [Method] | Bi-weekly | [Threshold] | [Escalation path] |
| [R3] | [Indicator] | [Method] | Monthly | [Threshold] | [Escalation path] |

**Assessment Review Schedule:**
- Next full review: [Date]
- Trigger-based review: Initiated immediately if any Critical risk score increases by 4+ points, a new Critical risk is identified, or project scope changes materially

---

### Scoring Reference

**Likelihood Scale:**
| Score | Label | Probability | Calibration Anchor |
|-------|-------|------------|-------------------|
| 1 | Rare | <5% | No precedent in this context; requires multiple simultaneous failures |
| 2 | Unlikely | 5-20% | Has occurred in comparable situations, not expected here |
| 3 | Possible | 20-50% | A reasonable person considers this a genuine possibility |
| 4 | Likely | 50-80% | Expected to happen given current conditions |
| 5 | Almost Certain | >80% | Will happen unless specific action is taken |

**Impact Scale:**
| Score | Label | Schedule Impact | Budget Impact | Description |
|-------|-------|----------------|--------------|-------------|
| 1 | Negligible | None | <1% | Absorbed in normal operations |
| 2 | Minor | 1-2 weeks | 1-5% | Manageable with existing resources |
| 3 | Moderate | 2-6 weeks | 5-15% | Requires management attention and reallocation |
| 4 | Major | 6+ weeks | >15% | Requires executive intervention |
| 5 | Severe | Project failure | Existential | Irreversible damage or project termination |

**Priority Bands:**
| Score Range | Priority | Required Response |
|-------------|----------|------------------|
| 20-25 | Critical | Immediate mitigation plan; executive ownership; daily monitoring |
| 12-19 | High | Documented mitigation plan; senior ownership; weekly monitoring |
| 6-11 | Medium | Mitigation consideration; team-level ownership; monthly review |
| 1-5 | Low | Accepted or passively monitored; documented acceptance required |
```

---

## Rules

1. **Never produce a risk assessment without defined, anchored scoring criteria.** Every likelihood and impact score must map to a written calibration anchor -- numeric probability ranges for likelihood, and specific schedule/budget/quality thresholds for impact. Subjective labels without anchors ("this seems high risk") produce inconsistent assessments that mislead decision-makers.

2. **Risk scores must be calculated as Likelihood x Impact -- never assigned subjectively.** If a risk "feels" Critical, the feeling is the signal to score it correctly, not a substitute for scoring. A risk cannot be labeled Critical if its L x I score is below 20 unless you explicitly document an override and the reason for it.

3. **Every risk must be stated as a complete risk statement: cause/trigger → risk event → consequence.** A risk labeled "vendor dependency" or "technical complexity" is not an actionable risk statement. It tells a decision-maker nothing about what to watch, when to act, or what is at stake. The consequence must be specific enough to estimate financial impact or schedule impact.

4. **Mitigation plans are mandatory for all Critical and High risks -- no exceptions.** A risk register that lists Critical risks without mitigation plans is a liability document, not a management tool. If no mitigation action is available, that fact must be explicitly stated with rationale, and the risk must be escalated to the appropriate authority for a formal acceptance decision.

5. **Always assess existing controls before recommending new ones.** Recommending a control that already exists wastes credibility and resources. For every risk, ask what is already in place and rate its effectiveness. Mitigation plans address the gap between existing controls and required coverage -- not the full risk from zero.

6. **Mitigation cost must be weighed against the expected cost of risk materialization.** If a mitigation costs $50,000 in staff time and the risk has a 15% probability of causing a $20,000 cost, the mitigation is economically irrational unless non-financial factors (regulatory, reputational) justify it. Document this comparison for any mitigation that costs more than 10% of the risk's estimated financial impact.

7. **Residual risk must be scored after every mitigation plan.** Mitigation reduces but rarely eliminates risk. A risk that starts at 20/25 might reduce to 8/25 after mitigation -- but that residual 8/25 still needs to be managed. The "after-mitigation" register is the operative view for the board or executive audience.

8. **Force differentiation across the full priority spectrum.** If all risks are scored Medium (6-11) in an assessment of a complex initiative, the scoring is almost certainly wrong. Real projects have genuine Critical risks (the ones that kill the project) and genuine Low risks (the ones you worry about but rationally accept). Forced clustering at the median obscures the risks that most need attention.

9. **Include early warning indicators for every Critical and High risk.** A risk that cannot be monitored is a risk that will surprise you. For each Critical and High risk, identify the specific leading indicator -- measurable or observable before the risk fully materializes -- that gives the team actionable warning time. "Dashboard error rate rising above 2% in staging" is an indicator. "Something goes wrong" is not.

10. **Every risk assessment must include a defined review schedule and version number.** A risk assessment without a review date is treated as perpetually current, which creates false confidence. The review schedule must specify frequency (not just "regularly"), the trigger conditions for an immediate out-of-cycle review, and the role responsible for initiating the review. Increment the version number on each update so stakeholders know which version is current.

---

## Edge Cases

### New Venture or Startup (High Uncertainty Across the Board)

When assessing a pre-revenue startup or brand-new venture, most risks will initially cluster at Likelihood 3-4 because historical data does not exist and assumptions are untested. In this context, do not force artificially low likelihood scores to create false differentiation. Instead, differentiate heavily on impact -- specifically, separate existential risks (company fails, product cannot be built, funding runs out) from setback risks (timeline slips, feature is deprioritized, early customers churn). Treat any risk with a Severe (5) impact as automatically requiring a mitigation plan regardless of score. Recommend monthly re-assessment cadence and emphasize that risk scores should decrease as uncertainty resolves -- if scores are not declining over time, the team is not resolving assumptions fast enough. Include a dedicated "assumption risk" category for key business model assumptions that have not yet been validated.

### Regulated Industries (Pharma, Healthcare, Financial Services, Aviation)

Compliance risks in regulated industries often require pass/fail treatment rather than probabilistic scoring. Any regulatory violation may trigger mandatory reporting, license suspension, or criminal liability -- making the standard 1-25 scoring framework insufficient. Add a separate "Regulatory Compliance" column to the risk register with values of Compliant, Watch, Non-compliant (Imminent), or Non-compliant (Actual). Any risk with a non-compliant status is automatically Critical regardless of its L x I score. Note that regulatory impact scales must account for fines (which can be percentage of global revenue under GDPR), mandatory operational shutdown periods, and reputational consequences with regulators that extend beyond the immediate incident. In healthcare, patient safety risks must be treated as Severe impact regardless of probability -- no statistical argument justifies accepting avoidable patient harm.

### Late-Stage Project Assessment (Within 4 Weeks of Launch or Deadline)

When a risk assessment is requested near a deadline, the time horizon for mitigation is compressed. Several adjustments apply: mitigation strategies that require more than 2 weeks to implement are functionally unavailable unless the deadline is movable. For these risks, the realistic strategy choices are Accept, Transfer (e.g., contractual protection), or Contain (limit the blast radius rather than prevent the event). Focus the assessment on: (a) risks that can still be mitigated within the available window, (b) risks that require an explicit launch/no-launch decision from executives, and (c) the contingency plan if the most likely risks materialize immediately post-launch. Late-stage assessments should include a "launch readiness" verdict: Green (proceed), Amber (proceed with named conditions), or Red (do not launch).

### Key-Person Concentration Risk

When the initiative depends critically on one or two individuals -- a single architect who designed the entire system, a sole relationship manager for a major client, or one regulatory expert who holds all institutional knowledge -- standard risk scoring underrepresents the true exposure. Key-person risk has a low likelihood (the person may not leave) but the impact is often Major to Severe because no one else can perform the function. Document this explicitly as its own risk entry. Mitigation must address both the preventive angle (retention incentives, compensation review) and the recovery angle (knowledge transfer sessions, documented runbooks, cross-training). Note that key-person risk in small teams (under 10 people) is often the single highest-exposure risk in the entire register, even when it scores only Medium on the matrix.

### Multiple Interdependent Risks (Risk Correlation)

Standard risk registers treat each risk as independent -- which understates total exposure when risks are correlated. If an engineering delay risk (R2) materializes, it often increases the likelihood of regression risk (R1, because testing time is compressed) and adoption risk (R3, because marketing launch timing is disrupted). When two or more risks share a common trigger or causal chain, note the correlation explicitly in the register. Compound risk scenarios should be described: "If R2 materializes, R1 likelihood increases from 3 to 5." Consider whether the root cause of the correlation can be addressed as a single systemic mitigation -- often more efficient than treating each correlated risk separately.

### Risk Assessment for a Decision Between Options

When the user is choosing between two or more strategic options (e.g., build vs. buy, launch in Q3 vs. Q4, partner vs. acquire), produce a comparative risk summary rather than a single register. Assess each option independently using the same risk categories and scoring criteria. Then produce a comparison table showing: total risk exposure score per option, number of Critical and High risks per option, the single highest-consequence risk per option, and the mitigation cost per option. Do not recommend the "lowest risk" option by default -- a lower-risk option with lower upside may be a worse decision than a higher-risk option with transformative upside. Present the risk trade-off neutrally and let the decision-maker weigh risk against return.

### Risks Outside the Organization's Control

Some risks -- macroeconomic downturns, regulatory changes not yet finalized, geopolitical disruption -- cannot be avoided, reduced, or transferred at any reasonable cost. For these risks, the assessment should: (a) still score and document them for completeness, (b) focus mitigation on resilience and response capability rather than prevention, (c) define the specific trigger conditions that would require the organization to invoke a contingency response, and (d) be explicit with stakeholders that the primary value of documenting these risks is preparedness, not prevention. Do not waste mitigation budget on risks the organization cannot influence. Redirect that investment toward early detection and rapid response capability.

---

## Example

**Input:** "We're launching a new analytics dashboard feature for our B2B SaaS product next quarter. The engineering team is already behind on the sprint, we haven't done full load testing yet, and the sales team has been promising customers this feature for months. I need a risk assessment before our executive review next week."

**Output:**

---

## Risk Assessment: Analytics Dashboard Feature Launch

**Scope:** New analytics dashboard feature for B2B SaaS platform -- includes build completion, QA, load testing, and production deployment. Excludes post-launch iteration and roadmap planning.
**Assessed by:** Product Manager
**Date:** 2025-01-15
**Next Review:** 2025-01-29 (bi-weekly until launch)
**Risk Tolerance:** Moderate
**Assessment Version:** 1.0

---

### Executive Summary

**Total Risks Identified:** 9
**Critical (20-25):** 2 | **High (12-19):** 3 | **Medium (6-11):** 3 | **Low (1-5):** 1
**Total Risk Exposure Score:** 114 / 225 maximum

**Top 3 Risks Requiring Immediate Attention:**
1. R1: Regression in existing reports -- Score: 20/25 -- New dashboard code shares the reporting data pipeline; incomplete test coverage means a breaking change could cause customer-visible outages in existing reports that sales has committed as a contractual deliverable
2. R2: Feature incomplete at launch date -- Score: 20/25 -- Engineering is already behind sprint velocity; at current pace the feature will reach QA 2 weeks late, making the committed launch date infeasible without a scope reduction decision
3. R3: Performance degradation under production load -- Score: 15/25 -- Load testing has not been completed; B2B customers will generate concurrent queries against the dashboard at business-hours peaks that have not been validated against the database query plan

**Single Most Urgent Action:** Within 48 hours, hold a sprint assessment with Engineering Lead to produce a revised delivery forecast. The launch date decision cannot be made rationally until the engineering completion date is known with ±1 week accuracy. All other mitigation planning depends on this input.

**Overall Risk Posture:** Borderline -- two Critical risks exist with mitigation actions not yet initiated. Proceeding to launch without completing the regression test suite and the load testing baseline would move this assessment to Unacceptable.

---

### Likelihood-Impact Matrix

|  | **Negligible (1)** | **Minor (2)** | **Moderate (3)** | **Major (4)** | **Severe (5)** |
|---|---|---|---|---|---|
| **Almost Certain (5)** | 5 -- MED | 10 -- MED | 15 -- HIGH | 20 -- CRIT | 25 -- CRIT |
| **Likely (4)** | 4 -- LOW | 8 -- MED | 12 -- HIGH | 16 -- HIGH | **20 -- CRIT** |
| **Possible (3)** | 3 -- LOW | 6 -- MED | 9 -- MED | **12 -- HIGH** | **15 -- HIGH** |
| **Unlikely (2)** | 2 -- LOW | 4 -- LOW | 6 -- MED | 8 -- MED | 10 -- MED |
| **Rare (1)** | 1 -- LOW | 2 -- LOW | 3 -- LOW | 4 -- LOW | 5 -- MED |

**Risk ID Placement:**
- Almost Certain / Major (20 -- CRIT): R1, R2
- Possible / Severe (15 -- HIGH): R3
- Possible / Major (12 -- HIGH): R4
- Likely / Moderate (12 -- HIGH): R5
- Possible / Moderate (9 -- MED): R6, R7
- Unlikely / Moderate (6 -- MED): R8
- Unlikely / Minor (4 -- LOW): R9

---

### Risk Register (Priority Order)

| ID | Risk Statement | Category | Likelihood (1-5) | Impact (1-5) | Score | Priority | Owner | Status |
|----|----------------|----------|-----------------|-------------|-------|----------|-------|--------|
| R1 | Dashboard code touches the shared reporting data pipeline without a full regression test suite in place, causing a breaking change that creates customer-visible outages in existing contractual reports | Technical | 4 | 5 | 20 | Critical | Engineering Lead | Open |
| R2 | Engineering sprint velocity is running at 65% of planned story points; at current pace, dashboard feature will reach QA 2 weeks past the committed launch date, forcing a binary choice between delaying launch or releasing an incomplete feature | Operational | 4 | 5 | 20 | Critical | Product Manager | Open |
| R3 | Load testing has not been run against the dashboard's database query plan; concurrent B2B user queries at business-hours peak may cause query timeouts and degrade performance for all platform users, not just dashboard users | Technical | 3 | 5 | 15 | High | Engineering Lead | Open |
| R4 | Sales team has made verbal commitments to 6 named enterprise accounts that the dashboard will be available in Q2; if launch is delayed, these accounts may invoke churn conversations or contractual penalty clauses | Market/Reputational | 3 | 4 | 12 | High | Account Management Lead | Open |
| R5 | Support team has not been trained on the new dashboard feature, resulting in a surge of unresolved support tickets and negative customer experience in the first 2 weeks post-launch | Operational | 4 | 3 | 12 | High | Customer Success Lead | Open |
| R6 | Dashboard displays calculated metrics that depend on customer-specific configuration; edge cases in non-standard configurations could produce incorrect metric values that customers act on | Technical | 3 | 3 | 9 | Medium | Engineering Lead | Open |
| R7 | Key front-end engineer is the only person who understands the dashboard's component architecture; if this person becomes unavailable during the launch window, debugging and hotfixes will be severely delayed | People | 3 | 3 | 9 | Medium | Engineering Manager | Open |
| R8 | User documentation and in-app help text has not been scoped into the sprint; customers will onboard to the feature without guidance, increasing time-to-value and support volume | Operational | 2 | 3 | 6 | Medium | Product Manager | Open |
| R9 | A direct competitor is rumored to be releasing analytics functionality this quarter; if they launch first, the PR value of our announcement is reduced | External | 2 | 2 | 4 | Low | Marketing Lead | Open |

---

### Existing Controls Assessment

| Risk ID | Existing Control | Control Type | Effectiveness | Gap |
|---------|-----------------|--------------|---------------|-----|
| R1 | Manual QA regression checklist for existing reports | Detective | Weak | Checklist is manual and incomplete -- does not cover all 47 existing report configurations; cannot run at the speed of development |
| R2 | Weekly sprint review with Engineering Lead | Detective | Moderate | Reviews surface the delay but do not produce a quantified delivery forecast -- decision-makers lack a concrete revised date |
| R3 | Staging environment used for pre-deploy testing | Preventive | Weak | Staging database is seeded with synthetic data at 10% of production volume -- does not replicate peak concurrent load |
| R4 | CRM notes documenting verbal commitments to accounts | Detective | Moderate | Notes are logged but not reviewed against launch risk; Account Management Lead is not part of the risk review process |
| R5 | Product release notes sent to Customer Success team | Preventive | Weak | Release notes are informational only -- no structured training or support runbook for the new feature |
| R6 | Unit tests on individual metric calculation functions | Preventive | Moderate | Unit tests cover standard configurations; integration tests for non-standard customer configurations are not in scope for this sprint |
| R7 | None identified | -- | -- | No documentation of dashboard component architecture; no cross-training |
| R8 | None identified | -- | -- | Documentation is currently out of scope for the sprint |
| R9 | Competitive intelligence subscription | Detective | Moderate | Provides market signals but cannot change the risk -- no preventive control available |

---

### Mitigation Plans

---

**R1: Regression in existing reports -- CRITICAL (Score: 20/25)**

| Element | Details |
|---------|---------|
| **Strategy** | Reduce |
| **Action 1** | Engineering Lead to audit which existing report components share code paths with the new dashboard pipeline -- complete within 3 business days |
| **Action 2** | Build automated regression test coverage for all shared code paths, targeting the 47 existing report configurations -- minimum 80% automated coverage before any dashboard code merges to main branch |
| **Action 3** | Add regression test pass as a required CI/CD gate -- no PR merges to main branch without passing regression suite |
| **Action 4** | Run 48-hour staging burn-in with production-representative data before deployment to production |
| **Owner** | Engineering Lead |
| **Completion Deadline** | Automated regression suite operational 4 weeks before launch date |
| **Estimated Mitigation Cost** | 10 engineering days to build test suite (~$8,000 at blended engineering rate) |
| **Residual Likelihood** | 2 (Unlikely) -- automated tests catch the majority of breaking changes |
| **Residual Impact** | 4 (Major) -- a breaking change that escapes automated tests still causes customer impact |
| **Residual Risk Score** | 8 (Medium) -- significant improvement from 20 |
| **Early Warning Indicator** | Any regression test failure during dashboard development, even in a non-critical test, signals integration fragility and triggers immediate code review |
| **Escalation Trigger** | If regression test suite is not operational 4 weeks before launch, launch date must be reviewed by the executive sponsor |

---

**R2: Feature incomplete at launch date -- CRITICAL (Score: 20/25)**

| Element | Details |
|---------|---------|
| **Strategy** | Reduce + contingency plan for Accept/Contain |
| **Action 1** | Engineering Lead to produce a revised delivery forecast with story points remaining, current velocity, and projected completion date -- complete within 48 hours of this assessment |
| **Action 2** | Product Manager and Engineering Lead to identify a Minimum Viable Scope (MVS): the smallest feature set that fulfills the core customer commitment and can be delivered on time -- present to executive sponsor within 1 week |
| **Action 3** | If full scope cannot be delivered on time, prepare a phased launch plan: launch MVS on committed date, communicate remaining features with specific delivery dates to sales-committed accounts |
| **Action 4** | If MVS cannot be delivered on time, prepare a launch delay recommendation with a revised date and the business cost of delay (churn risk from R4) for executive decision |
| **Owner** | Product Manager (forecast and scope decision), Engineering Lead (delivery execution) |
| **Completion Deadline** | Delivery forecast in 48 hours; scope decision in 1 week; launch decision finalized 6 weeks before current launch date |
| **Estimated Mitigation Cost** | 1 day of Product Manager time for scoping; potential cost of contractor engineering support if scope cannot be reduced ($15,000-$25,000 for 2 weeks of senior contractor) |
| **Residual Likelihood** | 2 (Unlikely) -- with MVS defined and active sprint management, a partial delivery is recoverable |
| **Residual Impact** | 3 (Moderate) -- MVS launch instead of full feature is a reputational setback but not a customer-loss event |
| **Residual Risk Score** | 6 (Medium) |
| **Early Warning Indicator** | Sprint velocity below 70% of planned story points for one sprint is the trigger to activate the MVS scoping exercise immediately |
| **Escalation Trigger** | If sprint velocity does not recover to 85%+ within 2 sprints after this assessment, escalate to executive sponsor with launch delay recommendation |

---

**R3: Performance degradation under production load -- HIGH (Score: 15/25)**

| Element | Details |
|---------|---------|
| **Strategy** | Reduce |
| **Action 1** | Define load testing target: concurrent users equal to the top 20 enterprise accounts' combined peak user count, plus 50% headroom -- obtain this number from the Customer Success team within 1 week |
| **Action 2** | Engineer team to run load test against staging environment seeded with production-representative data volume -- complete 3 weeks before launch |
| **Action 3** | If load test reveals query timeouts above 2 seconds at peak load, implement query result caching layer (e.g., materialized views or application-level cache with 5-minute TTL) before launch |
| **Action 4** | Define a performance circuit breaker: if dashboard query response time exceeds 5 seconds in production, automatically disable dashboard queries and display a maintenance message rather than degrading the entire platform |
| **Owner** | Engineering Lead |
| **Completion Deadline** | Load test complete 3 weeks before launch; performance circuit breaker deployed before launch |
| **Estimated Mitigation Cost** | 5 engineering days for load testing and optimization; cache implementation 3-5 additional engineering days if required |
| **Residual Likelihood** | 2 (Unlikely) -- load-tested architecture with circuit breaker reduces probability significantly |
| **Residual Impact** | 3 (Moderate) -- dashboard may be temporarily unavailable but will not degrade existing platform |
| **Residual Risk Score** | 6 (Medium) |
| **Early Warning Indicator** | Staging load test showing query response times above 1.5 seconds at 50% of target load signals performance risk before production |
| **Escalation Trigger** | Load test failure at 50% of target load with no clear optimization path escalates to executive sponsor for launch readiness review |

---

**R4: Customer churn risk from delayed or incomplete launch -- HIGH (Score: 12/25)**

| Element | Details |
|---------|---------|
| **Strategy** | Reduce (proactive communication) + Transfer (contractual review) |
| **Action 1** | Account Management Lead to audit the 6 named enterprise accounts with verbal commitments -- confirm within 1 week whether any written contractual obligations exist |
| **Action 2** | If verbal commitments only: Account Management Lead to schedule proactive calls with each account 6 weeks before launch with a specific feature availability date and, if scope is reduced, a roadmap for remaining features |
| **Action 3** | If contractual obligations exist: Legal to review penalty clause exposure and Product Manager to factor contractual risk into launch/delay decision |
| **Owner** | Account Management Lead (communication), Legal (contractual review) |
| **Completion Deadline** | Contract audit within 1 week; proactive account communication plan in place 6 weeks before launch |
| **Estimated Mitigation Cost** | 2 days of Account Management time; Legal review if contracts are involved |
| **Residual Likelihood** | 2 (Unlikely) -- proactive communication reduces churn risk significantly; customers generally accept delays when communicated early with a credible revised commitment |
| **Residual Impact** | 3 (Moderate) -- some accounts may still be disappointed; churn risk does not disappear but is reduced |
| **Residual Risk Score** | 6 (Medium) |
| **Early Warning Indicator** | Any inbound inquiry from a named account asking about dashboard launch timing signals the risk is present and the account should be prioritized in the communication plan |
| **Escalation Trigger** | Any account referencing contractual terms or making a churn threat escalates immediately to VP of Sales |

---

**R5: Support team unprepared for launch -- HIGH (Score: 12/25) -- Monitoring Plan**

| Element | Details |
|---------|---------|
| **Strategy** | Reduce |
| **Action 1** | Customer Success Lead to develop a dashboard support runbook (top 10 anticipated support questions and resolution steps) -- complete 2 weeks before launch |
| **Action 2** | Run a 90-minute internal training session for support team on dashboard functionality, common edge cases, and escalation path -- complete 1 week before launch |
| **Owner** | Customer Success Lead |
| **Completion Deadline** | Training complete 1 week before launch |
| **Estimated Mitigation Cost** | 3 days of Customer Success Lead time |
| **Residual Likelihood** | 2 | **Residual Impact** | 2 | **Residual Score** | 4 (Low) |
| **Escalation Trigger** | If Customer Success Lead cannot commit training time due to competing priorities, escalate to VP of Customer Success for resource prioritization |

---

**R6: Data accuracy errors in non-standard configurations -- MEDIUM (Score: 9/25)**

| Element | Details |
|---------|---------|
| **Strategy** | Reduce with monitoring |
| **Monitoring Indicator** | Customer support tickets containing keywords "wrong number," "incorrect metric," or "data looks off" |
| **Review Frequency** | Daily in the first 2 weeks post-launch |
| **Escalation Trigger** | Two or more tickets citing data accuracy from different accounts within the same 48-hour window triggers an immediate engineering investigation and potential dashboard disable for affected configurations |

---

**R7: Key-person dependency in front-end architecture -- MEDIUM (Score: 9/25)**

| Element | Details |
|---------|---------|
| **Strategy** | Reduce |
| **Monitoring Indicator** | Front-end engineer's availability and health status -- flag immediately if PTO, illness, or resignation notice occurs in the 6 weeks before launch |
| **Action** | Schedule two 2-hour architecture walkthrough sessions where front-end engineer documents and presents the dashboard component architecture to at least one other engineer before the launch date |
| **Review Frequency** | Weekly check-in on documentation progress |
| **Escalation Trigger** | If front-end engineer is unavailable for more than 3 
