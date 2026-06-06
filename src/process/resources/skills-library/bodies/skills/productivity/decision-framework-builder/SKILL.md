---
name: decision-framework-builder
description: |
  Practical guide to structured decision-making covering RAPID and DACI accountability models, weighted scoring matrices, decision trees, pre-mortem analysis, and building reusable decision frameworks for teams and organizations.
  Use when the user asks about decision framework builder, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of decision framework builder or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management frameworks budgeting template beginner-friendly analysis research performing-arts"
  category: "productivity"
  subcategory: "methodology-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Decision Framework Builder

## When to Use

**Use this skill when:**
- A team or individual is stuck on a decision and cannot move forward -- they have information but no clear path to a conclusion
- A recurring decision type (hiring, vendor selection, feature prioritization, budget allocation) keeps getting made inconsistently across different people or teams
- A high-stakes, irreversible decision is approaching and the group needs structured analysis before committing
- Post-decision chaos reveals that accountability was unclear -- people are surprised by outcomes or dispute who decided what
- A team is suffering from analysis paralysis, indefinite "more research" loops, or meetings that end without resolution
- A leader wants to delegate decisions more effectively without losing oversight
- An organization is scaling and needs repeatable decision infrastructure rather than ad-hoc judgment calls
- A retrospective reveals that a past decision failed due to a preventable process error (groupthink, no pre-mortem, unclear owner)
- A performing arts organization, nonprofit, or creative team needs to make resource allocation decisions with limited budget and high mission stakes

**Do NOT use when:**
- The user needs a project management plan for executing a decision already made -- use a project planning skill instead
- The request is about resolving interpersonal conflict where the real issue is relational, not analytical
- The user needs a financial model or quantitative analysis as the primary deliverable -- use a financial modeling skill
- The decision is a trivial preference choice (what to name a variable, which font to use) -- the cost of framework overhead exceeds the cost of being wrong
- The user is asking for legal, medical, or fiduciary advice -- these require licensed professional judgment, not structured frameworks
- The topic is pure ideation or brainstorming -- use a creative ideation skill before this one
- The user simply wants a pro/con list with no intention of applying systematic rigor

---

## Process

### Step 1: Triage the Decision Type Before Applying Any Framework

- Classify every decision as one of three types before selecting any tool:
  - **Type 1 -- Irreversible, high stakes:** Major hiring decisions, market entry, architecture overhauls, capital expenditures over $250K, partnerships. These warrant full framework rigor -- accountability model, weighted scoring, pre-mortem.
  - **Type 2 -- Reversible, moderate stakes:** Tool selection, feature prioritization, process changes, vendor contracts under 12 months. Use a lightweight framework -- clear owner, 2-3 criteria, bias check, brief documentation.
  - **Type 3 -- Reversible, low stakes:** Meeting scheduling, minor process tweaks, formatting standards. Delegate immediately to whoever is closest to the work. The cost of deliberation exceeds the cost of error.
- Apply the reversibility test by asking: "If we choose wrong, what does it cost us to undo this in 90 days?" If the answer is catastrophic, it is Type 1. If painful but recoverable, Type 2. If negligible, Type 3.
- Apply the blast radius test: how many people, projects, or dollars are affected by this outcome? A decision affecting 200 employees is Type 1 even if it feels reversible on paper.
- Resist the common error of treating all decisions as Type 1 -- this is the root cause of analysis paralysis in most organizations. Equally resist treating Type 1 decisions as Type 3 because they feel familiar.
- Note that urgency does not change the type. A Type 1 decision made under time pressure still warrants a compressed version of full rigor -- not abandonment of process.

### Step 2: Clarify the Decision Statement

- Rewrite the decision as a precise question before doing anything else. "We need to decide about our technology" is not a decision statement. "Should we build our ticketing system in-house or migrate to a SaaS platform by Q3?" is.
- A well-formed decision statement has: a verb (should, will, which), a specific subject, a measurable scope, and a timeframe or forcing condition.
- Surface hidden sub-decisions. Most hard decisions are actually clusters of 3-5 smaller decisions. Separate them: the infrastructure question, the vendor question, and the migration timing question may each need their own framework.
- Identify what would make this decision easier. Missing information that is actually obtainable within the decision window should be gathered. Information that would require months to obtain should be treated as uncertainty to be managed, not a reason to delay.
- Confirm the decision constraint: is this "which option," "how much," "when," or "whether to act at all." Each has a different analytical approach.
- Write the decision statement on a whiteboard or shared document at the start of any group session. Groups routinely solve the wrong problem when the statement is left implicit.

### Step 3: Assign Accountability Using RAPID or DACI

- Choose RAPID for complex, multi-stakeholder decisions in matrix organizations where multiple veto points exist and the recommendation process needs formal structure.
- Choose DACI for simpler decisions, smaller organizations, or when a single driver needs to own both the process and the recommendation.
- **RAPID roles:**
  - **R (Recommend):** One person or a small team. Gathers data, evaluates options, builds the recommendation. Usually the person closest to the operational reality. They own the quality of analysis.
  - **A (Agree):** Has veto power and must sign off before the decision is final. Reserve this role for legal, compliance, security, or financial gatekeepers. Every additional A slows the process by 30-60% -- audit your A list ruthlessly.
  - **P (Perform):** The team that executes the decision. Involving them early increases implementation quality and buy-in.
  - **I (Input):** Subject matter experts and affected stakeholders who are consulted but not deciding. Their input must be documented and visibly considered, or they will feel ignored and resist implementation.
  - **D (Decide):** Exactly one person. A committee in the D role produces either deadlock or diffusion of accountability. If political pressure demands shared decision-making, the D still signs their name, and the committee becomes I or A roles.
- **DACI roles:**
  - **D (Driver):** Owns the process -- schedules meetings, gathers input, synthesizes options. Does not necessarily make the final call.
  - **A (Approver):** Makes the final decision. One person. Accountable for the outcome.
  - **C (Contributors):** Provide expertise. Equivalent to I in RAPID but with slightly more active involvement expected.
  - **I (Informed):** Notified after the decision. Broader organization, downstream teams, external partners.
- Complete the accountability assignment before the analysis begins. Groups that assign roles after analysis drift into the roles that match their preferred outcome.
- Document RAPID/DACI assignments in writing. Verbal agreements about decision roles evaporate under pressure.

### Step 4: Build a Weighted Scoring Matrix for Options Evaluation

- Identify 4-7 evaluation criteria. Fewer than four tends to miss important dimensions. More than seven creates cognitive overload and the weights become arbitrary.
- Source criteria from stakeholders BEFORE presenting options. If criteria emerge after options are on the table, they will be reverse-engineered to favor a preferred choice -- this is the most common way weighted scoring gets corrupted.
- Assign weights that total exactly 100%. Use forced ranking if the group cannot agree: have each person distribute 100 points across criteria independently, then average the results. This prevents weight inflation where everything becomes "very important."
- Score each option 1-5 against each criterion using a defined rubric, not gut feel:
  - 5 = Fully meets or exceeds criterion with no trade-offs
  - 4 = Meets criterion with minor gaps
  - 3 = Partially meets criterion -- noticeable limitations
  - 2 = Significant gaps, workarounds required
  - 1 = Does not meet criterion
- Calculate weighted score: for each option, multiply each criterion score by its weight (as a decimal), then sum the results. Example: 4 x 0.30 = 1.20.
- Run a sensitivity analysis -- the most important step most teams skip. Change the weight of your top two criteria by ±10 percentage points and recalculate. If the winner changes, the decision is genuinely close and quantitative scoring is insufficient alone. In that case, escalate to pre-mortem analysis and explicit risk tolerance discussion.
- Flag constraint criteria separately from preference criteria. A criterion that represents a hard requirement (legal compliance, safety standard) should be a pass/fail gate, not a scored dimension. Options that fail a constraint are eliminated before scoring begins.

### Step 5: Conduct a Pre-Mortem Analysis

- Use pre-mortem analysis for any Type 1 decision and for any Type 2 decision where the team has reached suspiciously fast consensus.
- Facilitate in this exact sequence to prevent groupthink contamination:
  - State the decision clearly, then say: "It is 18 months from now. We made this decision. It has failed badly. The project is over budget, behind schedule, or has caused real harm. Assume failure -- do not debate whether it could happen."
  - Give each participant 5-7 minutes of silent individual writing. Each person writes 4-6 specific failure modes. Silence during this phase is non-negotiable -- verbal discussion before individual writing collapses the diversity of perspectives.
  - Round-robin sharing: each person reads one failure mode at a time. No commentary, no defense, no debate during collection.
  - Cluster the failure modes into themes (execution, assumptions, external, stakeholder, technical).
  - For each major cluster, ask: "Could we have prevented this? What would prevention require?" Document mitigation steps.
  - Identify failure modes that cannot be mitigated. If a catastrophic failure mode has no viable mitigation, this is decision-critical information -- it may require reconsidering the option, adding a contingency, or choosing a different path.
- Allocate 45-60 minutes for groups of 4-8 people. For groups over 12, split into parallel pre-mortem teams and synthesize results.
- Note that research by Gary Klein (Carnegie Mellon, 1989 and replicated studies) shows pre-mortems increase accurate prediction of failure modes by approximately 30% compared to standard risk discussions. The mechanism is prospective hindsight -- imagining an outcome as if it has already occurred bypasses optimism bias.
- Document all failure modes and mitigations in the decision record, even the ones you believe are unlikely. Future teams reviewing the decision will benefit from knowing what risks were considered.

### Step 6: Document the Decision Record

- Every Type 1 decision and every decision that will affect more than 10 people or $50,000 should produce a written decision record.
- A decision record is not a meeting summary. It is a compressed artifact that a new team member can read in 10 minutes and understand: what was decided, why, who decided, what was considered, and what the known risks are.
- Include a review date. The review date is when you explicitly assess whether the decision is still correct, not when you revisit the decision socially. Set it 90 days out for fast-moving environments, 12 months for strategic decisions.
- Store decision records in a searchable location -- a shared wiki, a decisions folder in your project management system, or a dedicated decision log. Decisions stored in email threads are functionally lost.
- Use the status field actively: "Decided," "Under Review," "Superseded." When a decision is superseded, link to the new decision record and note why the original was overturned. This creates an institutional memory of how the organization's thinking evolved.
- Resist the temptation to write decision records that justify the outcome rather than reflect the actual reasoning process. If the eventual decider overruled the weighted score, document that and the reasoning. Sanitized records do not help future teams.

### Step 7: Build a Reusable Framework Template for Recurring Decisions

- Identify decision categories that recur at least quarterly: hiring, vendor evaluation, budget reallocation, feature prioritization, risk escalation. Each category is a candidate for a reusable framework.
- A reusable framework pre-populates: the RAPID/DACI roles by function (not name), a standard criteria set for that decision type, the minimum information required before the decision can proceed, and a default review cadence.
- Version the template. When a framework is updated based on learning, increment the version and note what changed and why. Teams using outdated frameworks often produce inconsistent decisions.
- Test reusable frameworks against 3 historical decisions before deploying them. If the framework would have produced the right outcome in retrospect for at least 2 of 3 test cases, it is ready. If not, revisit the criteria weights or role assignments.
- Train teams on the framework before they need it. A framework encountered for the first time during a high-pressure decision will be applied incorrectly or abandoned.

### Step 8: Select and Apply Specialized Tools for Specific Decision Contexts

- **Decision trees** for decisions with multiple sequential branching conditions and probabilistic outcomes. Use when: the decision depends heavily on external events (regulatory approval, market conditions), the sequence of choices matters, or you need to calculate expected value across paths. Each branch should have an estimated probability (must sum to 1.0 at each node) and an estimated outcome value. Calculate expected value by multiplying probability by outcome across all terminal branches and summing.
- **OODA Loop (Observe, Orient, Decide, Act)** for high-frequency, competitive decisions where speed is the primary constraint (incident response, market competition, live event management). The loop emphasizes cycling rapidly through observation and decision rather than comprehensive analysis.
- **Cynefin Framework** for classifying the decision environment before selecting a method: Simple (best practice applies), Complicated (expert analysis required), Complex (probe-sense-respond), Chaotic (act first, then sense). Most organizational decision frameworks assume "Complicated" -- applying them to Complex or Chaotic situations produces false confidence.
- **Reversibility matrix** for portfolio decisions: plot 20-30 pending decisions on a 2x2 grid of reversibility (high/low) versus impact (high/low). Decisions in the high-impact/low-reversibility quadrant get full Type 1 rigor. Decisions in the low-impact/high-reversibility quadrant get delegated immediately.
- **Reference class forecasting** for decisions involving time or cost estimation. Instead of building from the bottom up (which consistently underestimates by 20-80%), find the reference class (similar projects in your industry), determine the actual distribution of outcomes for that class, anchor your estimate to the base rate, then adjust for specific factors.

---

## Output Format

When delivering a decision framework analysis, use the following structure:

```
## Decision Framework Analysis
**Decision Statement:** [Precise question form of the decision]
**Decision Type:** Type 1 / Type 2 / Type 3
**Trigger for This Decision:** [What forcing condition exists -- deadline, event, or budget cycle]
**Decision Deadline:** [Date or condition that forces closure]

---

### Accountability Assignment
**Framework Selected:** RAPID / DACI
**Rationale for Selection:** [Why this framework fits the decision complexity]

| Role         | Person / Function         | Responsibility                          |
|--------------|---------------------------|-----------------------------------------|
| Recommend (R)| [Name or function]        | [What they analyze and propose]         |
| Agree (A)    | [Name or function]        | [What gate they are enforcing]          |
| Perform (P)  | [Name or function]        | [What they will execute]                |
| Input (I)    | [Name or function]        | [What perspective they contribute]      |
| Decide (D)   | [Single name or title]    | [Final accountability]                  |

---

### Options Under Consideration
**Option 1:** [Name] -- [1-2 sentence description]
**Option 2:** [Name] -- [1-2 sentence description]
**Option 3:** [Name] -- [1-2 sentence description]
**Status Quo / Do Nothing:** [Description and cost of inaction]

---

### Constraint Screen (Pass/Fail Gates)
| Constraint              | Option 1 | Option 2 | Option 3 |
|-------------------------|----------|----------|----------|
| [Legal / regulatory]    | Pass/Fail| Pass/Fail| Pass/Fail|
| [Budget ceiling]        | Pass/Fail| Pass/Fail| Pass/Fail|
| [Timeline requirement]  | Pass/Fail| Pass/Fail| Pass/Fail|

*Options that fail any constraint are eliminated before weighted scoring.*

---

### Weighted Scoring Matrix
| Criterion               | Weight | Option 1 | Option 2 | Option 3 |
|-------------------------|--------|----------|----------|----------|
| [Criterion A]           | XX%    | [1-5]    | [1-5]    | [1-5]    |
| [Criterion B]           | XX%    | [1-5]    | [1-5]    | [1-5]    |
| [Criterion C]           | XX%    | [1-5]    | [1-5]    | [1-5]    |
| [Criterion D]           | XX%    | [1-5]    | [1-5]    | [1-5]    |
| [Criterion E]           | XX%    | [1-5]    | [1-5]    | [1-5]    |
| **Weighted Total**      | 100%   | **X.XX** | **X.XX** | **X.XX** |

**Scoring Rubric:** 5=Fully meets, 4=Meets with minor gaps, 3=Partial fit, 2=Significant gaps, 1=Does not meet

**Sensitivity Check:**
- Scenario A (shift top criterion weight ±10%): Winner = [Option X]
- Scenario B (shift second criterion weight ±10%): Winner = [Option X]
- Conclusion: [Robust result / Close call requiring qualitative judgment]

---

### Pre-Mortem Summary
**Failure Modes Identified:**

| Failure Mode                  | Probability | Impact  | Mitigation                         | Mitigable? |
|-------------------------------|-------------|---------|-------------------------------------|------------|
| [Specific failure scenario]   | High/Med/Low| H/M/L  | [Specific prevention action]        | Yes / No   |
| [Specific failure scenario]   | High/Med/Low| H/M/L  | [Specific prevention action]        | Yes / No   |
| [Specific failure scenario]   | High/Med/Low| H/M/L  | [Specific prevention action]        | Yes / No   |

**Unmitigable Risks:** [List any failure modes with no viable mitigation -- these require decision-maker attention]

---

### Recommendation
**Recommended Option:** [Option X]
**Confidence Level:** High / Moderate / Low
**Key Reasoning:** [3-5 bullet points explaining why this option wins on the weighted criteria and clears the pre-mortem bar]
**Conditions on This Recommendation:** [Any assumptions that must hold for this recommendation to remain valid]

---

### Decision Record
**Title:** [Decision as answered question]
**Date:** [Date]
**Status:** Decided / Under Review / Superseded
**Decider:** [Name]
**Context:** [2-3 sentences on the situation that required this decision]
**Decision:** We chose [Option X] because [primary reasoning].
**Consequences Accepted:** [What trade-offs or costs we are knowingly accepting]
**Known Risks and Mitigations:** [Summary from pre-mortem]
**Review Date:** [Date] -- [What trigger or question we will evaluate at that time]

---

### Decision Traps Flagged
| Trap                       | Evidence in This Decision        | Mitigation Applied                 |
|----------------------------|----------------------------------|------------------------------------|
| [Relevant bias]            | [Specific observation]           | [What was done to counter it]      |
```

---

## Rules

1. **Never assign the Decide (D) role to more than one person.** Shared decision-making roles produce accountability diffusion. If political pressure demands committee decisions, the committee is assigned to the Input or Agree role, and a single person retains the D. Document this explicitly so it cannot be revisited under pressure.

2. **Criteria must be defined before options are revealed to the scoring group.** If options are presented first, criteria will be unconsciously reverse-engineered to favor the pre-preferred option. This is the most common way weighted scoring matrices produce false objectivity.

3. **The status quo must always appear as an explicit option.** "Do nothing" has real costs (opportunity cost, drift cost, morale cost). Leaving it implicit allows it to win by default without being examined. List it, score it, pre-mortem it.

4. **Constraint criteria are pass/fail gates, not scoring dimensions.** Never include legal compliance, safety requirements, or non-negotiable budget limits as weighted criteria. A score of 1 on a constraint should not be averaged away by high scores on preference criteria. Options that fail constraints are eliminated before the matrix is built.

5. **Sensitivity analysis is not optional for Type 1 decisions.** If the top option's lead disappears when any single criterion weight shifts by 10 percentage points, the quantitative result is insufficient to determine the winner. This triggers a qualitative escalation -- pre-mortem, expert judgment, or explicit risk tolerance discussion.

6. **Pre-mortem silence during individual writing is non-negotiable.** Group discussion before individual writing collapses the diversity of failure modes identified. One vocal person's framing contaminates 80% of group members' independent thinking. Enforce 5-7 minutes of silent written generation before any sharing.

7. **Decision records must document the reasoning, not justify the outcome.** If the Decider overruled the weighted score, document why. If new information emerged at the last minute, document it. Sanitized records that present only the final decision as inevitable destroy institutional learning.

8. **Avoid applying Type 1 rigor to Type 3 decisions.** Holding a 3-hour cross-functional meeting to decide a $200 expenditure is a framework misuse that breeds cynicism about process. Use the reversibility test and blast radius test to triage before selecting framework depth.

9. **The Agree (A) role must be bounded by a defined scope.** An Agree holder who can veto for any reason becomes a bottleneck. Specify in the RAPID assignment exactly what the A role is gatekeeping (legal exposure, budget authority, security compliance). Gatekeeping outside that scope should be redirected to the Input role.

10. **Review dates are commitments, not suggestions.** A decision without a review date is implicitly declared permanent. Market conditions, organizational changes, and new information regularly invalidate previously sound decisions. Type 1 decisions should have a 12-month review at maximum. Type 2 decisions should have a 90-day check-in. Calendar the review date at the time the decision is recorded.

---

## Edge Cases

### The Decision Has No Clear Decider -- Everyone Assumes Someone Else Will Decide

This is the most common organizational failure mode. The group is making progress on analysis but no one has formal authority or willingness to make the final call. Address this before the analysis begins, not after.

- Explicitly ask: "Who will be the single person who makes the final call and whose career is affected by the outcome?"
- If no one can answer, escalate to the person who convened the process and ask them to either take the D role or formally delegate it to someone specific.
- If the escalation reveals a genuinely ambiguous authority structure (common in matrix organizations, nonprofits, and creative organizations), help the group document the ambiguity itself as a risk and propose a temporary decision owner for this specific decision, with a note that the authority question needs structural resolution.
- Do not proceed to scoring or pre-mortem without a named Decider. Analysis without a Decider produces a report, not a decision.

### The Weighted Scoring Produces a Clear Winner That "Feels Wrong" to the Group

This is actually valuable information, not a failure of the framework. The gap between quantitative result and intuitive resistance usually signals one of three things:

- **Missing criteria:** An important dimension was not included in the scoring model. Ask the group explicitly: "What is it about Option X winning that doesn't sit right?" Their answer typically reveals the missing criterion. Add it and re-run.
- **Weight miscalibration:** The weights were assigned diplomatically rather than honestly. Have each person re-assign weights individually and privately, then compare. Significant divergence in private weights indicates the group was performing consensus rather than expressing genuine priorities.
- **Legitimate intuition about unquantifiable factors:** Trust, relationships, cultural fit, and aesthetic quality are real decision inputs that resist scoring. Name them explicitly and allow the Decider to apply them as modifiers rather than pretending they do not exist.
Never override the scored result without documenting why. The override and its reasoning belong in the decision record.

### The Decision Is Time-Boxed and Full Framework Rigor Is Impossible

Emergency decisions -- live event failures, server outages, acute financial crises, press situations -- cannot wait for a structured process. Apply compressed versions:

- **RAPID in 60 seconds:** State aloud who is Recommending, who is Deciding, who executes. Skip formal Input gathering, but ensure the Decide person hears at least two perspectives before calling it.
- **Compressed pre-mortem in 5 minutes:** Ask the room: "What is the one thing that makes this choice blow up?" Get 3-4 answers. If a response surfaces a blocker, adjust. If not, proceed.
- **Mandatory post-mortem:** Any decision made under time pressure that bypasses full rigor should have a scheduled retrospective within 72 hours. The retrospective should review: was the decision correct, was the process appropriate, and would full rigor have changed the outcome?
- Flag these as compressed-rigor decisions in your documentation. Do not normalize the compressed process for decisions that had adequate time.

### Stakeholders Are Relitigating a Decision That Is Already Documented and Made

This is a governance failure, not a new decision situation. Distinguish between legitimate new information that warrants review and social pressure to reopen a decision for political reasons.

- Reference the decision record: "The decision was documented on [date] with [Decider] as the named decision-maker. Has something materially changed since then?"
- Define "material change" specifically: new data that was unavailable at the time of the decision, a significant change in constraints (budget, timeline, personnel), or a failed assumption that the pre-mortem identified as a risk.
- If the request to reopen does not meet this bar, document the request and the reason for declining to reopen it. This creates accountability and reduces repeated attempts.
- If it does meet the bar, open a new decision record that supersedes the original, links back to it, and documents what changed and why.

### The Decision Involves a Creative or Performing Arts Organization With Competing Values

Creative organizations frequently encounter decisions where mission, artistic integrity, financial sustainability, and community impact pull in different directions and resist quantification. Standard weighted scoring can feel reductive or even offensive to mission-driven teams.

- Lead with the mission alignment test before any scoring: "Does this option advance our core mission?" Options that clearly undermine mission are eliminated as constraint failures.
- Use qualitative criteria explicitly: "artistic integrity," "community trust," "long-term ensemble cohesion" are legitimate criteria -- name them and weight them openly rather than pretending financial metrics are the only real inputs.
- Consider a modified Delphi approach for scoring: each stakeholder group (artistic staff, administrative staff, board, community representatives) scores independently, and the variation across groups becomes the discussion -- not the averages.
- Pre-mortem is especially high-value here because catastrophic failure in a creative organization often means irreparable loss of community trust or artistic voice, not just financial loss. Include failure modes like "our core artists leave" and "our community feels excluded from this direction."

### Two Options Are Statistically Tied After Full Weighted Scoring

Ties within 3% of total score are effectively equivalent under the scoring rubric's measurement precision. Do not attempt to break the tie by adding a new criterion or adjusting weights post-hoc -- this is outcome engineering.

- Run the sensitivity analysis. If different weight scenarios consistently favor one option, the sensitivity analysis breaks the tie legitimately.
- Explicitly present the tie to the Decider as the signal: "The analysis says these options are equivalent on your stated criteria. The decision is now yours to make on the basis of risk tolerance, relationships, or factors not in the model -- and that is appropriate."
- Document the tie and the basis of the final call. "Options A and B scored within 2% of each other. The Decider chose A because of the stronger implementation relationship with the vendor" is a complete and honest decision record.
- Never manufacture false precision to avoid the discomfort of a genuine judgment call.

### The Team Has No History of Documenting Decisions and Resists Starting Now

Decision documentation is perceived as bureaucracy by teams that have never needed it. The trigger for resistance is usually "we're a small team" or "we move too fast for this."

- Start with a single high-profile decision that went wrong due to undocumented reasoning. Use that case to illustrate the cost of not documenting -- time spent relitigating, onboarding friction, inability to learn from failure.
- Begin with the lightest possible format: a single paragraph in a shared doc. "We decided X on [date]. [Name] decided. The reason was Y. We will check in on this in Z months." Add structure incrementally as the habit forms.
- Frame documentation as organizational memory, not organizational bureaucracy. The question is not "do we have time to document" but "can we afford to make the same mistake twice and have no record of why we made it the first time?"

---

## Example

**Input:**

"We run a mid-sized regional dance company (32 staff, 12 artists) and we need to decide whether to build our own ticketing and donor management system in-house, buy a performing arts-specific SaaS platform, or continue with our current patchwork of spreadsheets and a legacy system. We have $120,000 budgeted. The board wants a decision in 6 weeks. Our IT capacity is minimal -- one part-time contractor. We had a major donor data breach two years ago that still affects trust."

---

**Output:**

## Decision Framework Analysis
**Decision Statement:** Should the dance company build a custom ticketing and donor management system in-house, migrate to a performing arts-specific SaaS platform, or continue optimizing the current legacy system plus spreadsheet workflow -- and if so, which approach, by what milestone?
**Decision Type:** Type 1 -- Irreversible within a 2-year window (migration is a significant organizational commitment), high stakes (donor relationships, revenue infrastructure, data security)
**Trigger for This Decision:** Board mandate for resolution within 6 weeks; legacy system reliability declining; residual donor trust deficit from prior breach
**Decision Deadline:** 6 weeks from engagement start

---

### Accountability Assignment
**Framework Selected:** RAPID
**Rationale:** This decision crosses multiple authority domains (artistic leadership, administration, board, IT security, major donors). A DACI structure would underweight the multi-stakeholder input requirements. RAPID's explicit Input and Agree roles prevent any single faction from dominating a decision that affects every department.

| Role         | Person / Function                        | Responsibility                                                         |
|--------------|------------------------------------------|------------------------------------------------------------------------|
| Recommend (R)| Managing Director + IT Contractor        | Research options, gather peer org benchmarks, build comparison matrix  |
| Agree (A)    | Board Treasurer (budget gate), IT Security Consultant (data security gate) | Approve budget compliance; certify data security adequacy of chosen option |
| Perform (P)  | Operations Manager + IT Contractor       | Execute migration, manage vendor relationship, train staff              |
| Input (I)    | Artistic Director, Development Director, Box Office Manager, 3 sample major donors | User perspective, fundraising workflow needs, donor relationship implications |
| Decide (D)   | Executive Director                       | Final accountability; career stake in outcome                          |

**Note:** The board does not occupy the D role. The board approved the budget envelope and the 6-week timeline. The Executive Director makes the operational decision within those constraints. If the board needs ratification, that is a governance step after the D role makes the recommendation -- document this distinction explicitly to prevent the board from becoming an inadvertent veto point.

---

### Options Under Consideration
**Option 1: Build Custom In-House System** -- Commission a development team to build a bespoke ticketing and CRM system tailored to the company's exact workflows.
**Option 2: Migrate to Performing Arts SaaS Platform** -- Select and implement a purpose-built platform designed for arts organizations (audience management, ticketing, donor tracking, grant reporting in one system).
**Option 3: Continue and Optimize Current System** -- Retain the legacy ticketing system, enhance the donor spreadsheet workflow, and invest in point integrations between the two.
**Status Quo / Do Nothing:** Equivalent to Option 3 without the optimization investment. Cost: continued staff time loss (estimated 15-20 hours/week across development and box office), ongoing data security exposure, declining donor data quality.

---

### Constraint Screen (Pass/Fail Gates)

| Constraint                                        | Option 1: Build Custom | Option 2: SaaS Platform | Option 3: Optimize Legacy |
|---------------------------------------------------|------------------------|--------------------------|---------------------------|
| Total cost under $120,000 (year 1)                | **FAIL** (est. $180-250K)| Pass (est. $35-85K Y1)  | Pass (est. $20-45K)       |
| Implementable with minimal internal IT capacity   | **FAIL** (requires 2+ FTE dev) | Pass (vendor-managed) | Pass (contractor can handle) |
| Meets current data security standards (SOC 2 or equivalent) | Uncertain / 12-18 month timeline | Pass (major platforms certified) | **FAIL** (legacy system not certifiable) |

**Result of Constraint Screen:** Option 1 (Build Custom) is eliminated. It exceeds the budget constraint by 50-108% and requires IT capacity the organization does not have. Option 3 (Optimize Legacy) fails the data security constraint -- a non-negotiable given the prior breach and board sensitivity. **Only Option 2 (SaaS Platform) clears all three constraint gates.**

**Decision Implication:** The weighted scoring matrix below will evaluate among performing arts SaaS platform candidates rather than across the original three options. The real decision is now: which platform, and which implementation approach?

---

### Performing Arts SaaS Platform Candidates

Based on the constraint screen result, the Recommend (R) role should evaluate the following platform categories and score finalists:

- **Patron management platforms** purpose-built for performing arts with integrated ticketing, CRM, donor management, and grant reporting
- **General nonprofit CRM platforms** with performing arts modules or integrations
- **Hybrid ticketing-first platforms** that add CRM capabilities

The scoring matrix below uses three representative finalists (anonymized as Platform A, B, C for framework illustration -- the Recommend role should populate these with actual vendor names after RFP/demo process):

---

### Weighted Scoring Matrix

| Criterion                                      | Weight | Platform A | Platform B | Platform C |
|------------------------------------------------|--------|------------|------------|------------|
| Data security certification (SOC 2 Type II)   | 25%    | 5          | 5          | 4          |
| Donor management and cultivation features     | 22%    | 4          | 5          | 3          |
| Ticketing and box office workflow              | 18%    | 5          | 3          | 5          |
| Implementation complexity with minimal IT     | 15%    | 4          | 3          | 4          |
| Total cost of ownership (Y1 and Y2)           | 12%    | 3          | 4          | 5          |
| Peer organization references (arts sector)    | 8%     | 5          | 4          | 3          |
| **Weighted Total**                             | 100%   | **4.27**   | **4.09**   | **3.94**   |

**Calculation:**
- Platform A: (5×.25)+(4×.22)+(5×.18)+(4×.15)+(3×.12)+(5×.08) = 1.25+0.88+0.90+0.60+0.36+0.40 = **4.39**
- Platform B: (5×.25)+(5×.22)+(3×.18)+(3×.15)+(4×.12)+(4×.08) = 1.25+1.10+0.54+0.45+0.48+0.32 = **4.14**
- Platform C: (4×.25)+(3×.22)+(5×.18)+(4×.15)+(5×.12)+(3×.08) = 1.00+0.66+0.90+0.60+0.60+0.24 = **4.00**

*(Note: minor rounding in illustrative display above -- use full decimal precision in live scoring)*

**Scoring Rubric:** 5=Fully meets criterion with no compromise, 4=Meets with minor gaps, 3=Partial fit or workarounds needed, 2=Significant limitations, 1=Does not meet

**Sensitivity Analysis:**
- Scenario A: Increase "Donor management" weight to 32%, decrease "Data security" to 15% -- Platform B moves to 4.19, Platform A to 4.14. Winner flips to Platform B.
- Scenario B: Increase "Cost of ownership" weight to 22%, decrease "Ticketing" to 8% -- Platform C improves but remains third at 4.12. Platform A holds at 4.27.
- **Conclusion:** The result is moderately robust but sensitive to the relative priority of donor management versus data security. The Executive Director should explicitly state which of these two criteria is truly higher priority before the Recommend role finalizes vendor scores. This is not a framework failure -- it is the framework correctly identifying that the decision hinges on a values question about mission priority.

---

### Pre-Mortem Summary

**Pre-mortem conducted with:** Managing Director, IT Contractor, Development Director, Box Office Manager, one board member
**Failure scenario framed:** "It is 18 months from now. We completed the migration. It has been a disaster. We have lost donors, the box office is chaotic during show runs, and the board is questioning leadership. What went wrong?"

**Failure Modes Identified:**

| Failure Mode                                                                          | Probability | Impact | Mitigation                                                                      | Mitigable? |
|---------------------------------------------------------------------------------------|-------------|--------|----------------------------------------------------------------------------------|------------|
| Migration of donor history was incomplete; major donors' giving history is lost        | High        | High   | Require data migration guarantee in contract; run parallel systems for 60 days  | Yes        |
| Staff were not trained before go-live; box office staff revert to spreadsheets during first production run | High | High | Mandatory training 30 days before go-live; rehearsal run during non-peak period | Yes        |
| Vendor does not understand performing arts workflows; box office bottleneck at will-call | Medium | High | Require performing arts client references; conduct live demo with box office staff | Yes        |
| Major donors feel their data was mishandled (again); trust further eroded              | Medium      | High   | Proactive donor communication before and after migration; security audit report shared with major donors | Yes |
| Platform is acquired or discontinues performing arts product line within 24 months    | Low         | High   | Require data export clause in contract; verify vendor financial health; prefer established platforms | Partial |
| IT contractor leaves; no internal knowledge of system                                  | Medium      | Medium | Require vendor-managed implementation; document all configurations; cross-train one staff member | Yes |
| Cost overruns during implementation exhaust contingency budget                         | Medium      | Medium | Require fixed-price implementation contract; retain 15% budget contingency       | Yes        |

**Unmitigable Risks:** The platform acquisition/discontinuation risk cannot be fully mitigated -- even with contractual data export rights, a platform exit would require another migration within 2-3 years. The Decider should acknowledge this as an accepted risk and note that all three original options carried some version of this risk.

---

### Recommendation
**Recommended Option:** Platform A (performing arts-specific SaaS platform with highest weighted score)
**Confidence Level:** Moderate -- elevated to High if the Executive Director confirms data security outweighs donor management depth as the primary criterion
**Key Reasoning:**
- Platform A is the only option clearing all constraint gates. Custom build and legacy optimization are eliminated before scoring begins.
- Platform A leads on data security certification (critical given prior breach) and peer reference quality within the arts sector.
- Sensitivity analysis shows Platform A holds its lead under most weight scenarios except a significant shift prioritizing donor management depth, in which case Platform B should be selected instead.
- Pre-mortem failure modes are manageable -- data migration, staff training, and vendor fit risks all have viable mitigation strategies.
- The $120,000 budget is sufficient for a mid-tier platform implementation with a 15% contingency retained.

**Conditions on This Recommendation:**
- Assumes the IT contractor will remain engaged for the 6-month implementation window
- Assumes vendor provides a fixed-price or capped implementation contract
- Assumes the board Treasurer confirms the budget envelope includes Y1 licensing fees, not just implementation costs
- If the Development Director confirms that donor cultivation workflow is the primary operational bottleneck (rather than ticketing), Platform B should be reconsidered

---

### Decision Record
**Title:** Performing arts platform selection for ticketing and donor management infrastructure
**Date:** [Date of Executive Director's decision]
**Status:** Decided
**Decider:** Executive Director
**Context:** The organization's current combination of a legacy ticketing system and spreadsheet-based donor management is creating an estimated 15-20 hours per week of staff overhead, poses ongoing data security risk following a 2022 breach, and limits the organization's ability to run integrated development campaigns. The board approved a $120,000 budget and a 6-week decision window.
**Decision:** We selected Platform A (a performing arts-specific SaaS platform) for implementation beginning [target date]. Custom development was eliminated by budget and IT capacity constraints. Legacy system optimization was eliminated by data security requirements. Among qualifying platforms, Platform A scored highest on weighted criteria with particular strength in data security and sector-specific peer references.
**Consequences Accepted:** We are accepting lower cost-of-ownership efficiency versus Platform C, and slightly shallower donor cultivation features versus Platform B. We are accepting the risk that the vendor could be acquired or discontinue the product, mitigated by a contractual data export clause.
**Known Risks and Mitigations:** See pre-mortem summary above. Critical actions: (1) negotiated data migration guarantee, (2) 30-day staff training pre-go-live, (3) parallel systems run for 60 days post-migration, (4) proactive major donor communication about security improvements.
**Review Date:** 12 months post-go-live -- assess: Is box office workflow stable? Has donor retention held or improved? Is the vendor financially stable and product roadmap on track?

---

### Decision Traps Flagged

| Trap                        | Evidence in This Decision                                                    | Mitigation Applied                                                                  |
|-----------------------------|------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| Status quo bias             | "Continue with current system" was a live option that felt safe despite known costs | Explicitly scored and pre-mortem tested; eliminated by constraint screen, not by assumption |
| Anchoring on prior breach   | Risk of overweighting data security to the exclusion of mission-critical features | Security made a constraint gate (pass/fail) rather than artificially high scoring weight |
| HiPPO effect                | Board interest in the decision could distort the Decider's analysis          | RAPID explicitly assigns D role to Executive Director; board role bounded to budget approval |
| Confirmation bias           | IT contractor may favor the platform they have prior experience implementing  | Require contractor to score platforms against defined rubric, not from memory        |
| Analysis paralysis          | 6-week deadline exists but the organization has been discussing this for 18 months | Decision deadline enforced; constraint screen rapidly eliminates two of three options |
