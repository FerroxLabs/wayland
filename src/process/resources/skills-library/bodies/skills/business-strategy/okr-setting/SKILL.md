---
name: okr-setting
description: |
  Produces completed OKRs (Objectives and Key Results) with 3-5 objectives
  and 2-4 measurable key results each for a quarter or year. Use when the
  user asks to set OKRs, define team or company objectives, create quarterly
  goals, or structure measurable outcomes for strategic priorities.
  Do NOT use for personal goal setting (use goal-setting in productivity),
  project task breakdown (use project-management skills), or KPI definition
  without the OKR structure (use ops-metrics-dashboard).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy planning goal-setting"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# OKR Setting

## When to Use

**Use this skill when:**
- A user asks to write, set, or draft OKRs for a team, department, business unit, or company for any planning period
- A user wants to translate a strategy document, board directive, or exec vision into structured measurable outcomes
- A user needs to cascade company-level OKRs to team or individual-contributor levels and wants the alignment mapped explicitly
- A user has a list of priorities or goals and wants them reformatted into proper OKR structure with baselines, targets, and owners
- A user is preparing for a quarterly planning session and needs a draft set of OKRs to bring to their team for refinement
- A user wants to evaluate or critique existing OKRs and rewrite weak or malformed ones
- A user needs to run an OKR retrospective and frame learnings for the next cycle

**Do NOT use this skill when:**
- The user wants personal productivity goals or life goals -- use the `goal-setting` skill in the productivity category instead
- The user wants to break down a project into tasks and milestones -- use `project-management` skills; OKRs define what success looks like, not how to execute
- The user wants standalone KPI dashboards or metric tracking infrastructure without the OKR strategic layer -- use `ops-metrics-dashboard`
- The user is defining SLAs, SLOs, or operational reliability thresholds -- these are engineering contracts, not strategic OKRs; use `service-level-objectives`
- The user is asking for a performance review or employee evaluation framework -- OKRs must not be directly tied to compensation; this conflation is a well-documented failure mode of OKR programs

---

## Process

### Step 1: Gather Required Context Before Drafting Anything

Do not produce OKRs until you have collected the following inputs. If any are missing, ask explicitly:

- **Entity:** What organization, team, or role are these OKRs for? (Company, Product team, Sales, Engineering, Marketing, Customer Success, IC role)
- **Time period:** Q1-Q4 of which year, H1/H2, or annual? OKRs are most effective on a quarterly cadence; annual OKRs need quarterly milestone check-ins embedded within key results
- **Level:** Are these company-level, team-level, or individual-level OKRs? If team or individual, do parent-level OKRs already exist to cascade from?
- **Strategic priorities:** What are the 3-5 most important things to accomplish this period? Ask the user to rank them if more than 5 are offered
- **Current baseline metrics:** For each priority, what is the current state? Targets cannot be set without baselines -- a target of "85% retention" means nothing without knowing current retention is 72% or 94%
- **Team size and capacity:** How many people, and what is their available bandwidth? This prevents OKRs from being impossible given resource constraints
- **Constraints and dependencies:** What could block these OKRs -- budget approvals, hiring plans, cross-team deliverables, regulatory timelines, product dependencies?
- **Scoring preference:** 0.0-1.0 scale (default and recommended), 0-100%, or binary (done/not done for very discrete deliverables only)
- **OKR maturity:** Is this the organization's first OKR cycle or are they experienced? First-timers need simpler structures and a meta-OKR on the practice itself

### Step 2: Identify and Rank Strategic Priorities

Before writing a single objective, structure the user's inputs into a priority stack:

- Use the **"If we only did 3 things this quarter" test**: force a ranking if more than 5 priorities exist. Ask: "Which two of these seven priorities would cause the most damage if left unaddressed?"
- Categorize priorities by type: **growth** (expand revenue, users, market), **efficiency** (reduce cost, time, friction), **foundation** (build capability, infrastructure, process), **defense** (retention, reliability, compliance). A healthy OKR set for most teams mixes at least two types
- Identify whether each priority is **within the team's control** (owns the outcome end-to-end), **shared** (requires another team's input), or **influenced** (the team can contribute but cannot guarantee the outcome). Shared and influenced objectives need explicit dependency notes
- Check for priority conflicts: a simultaneous objective to "ship more features faster" and "increase engineering quality" will produce tension -- name it and help the user decide which is primary
- Verify the priorities reflect the company strategy, not just what the team is already doing. OKRs should drive directional change, not ratify business-as-usual work

### Step 3: Write Objectives -- Qualitative, Aspirational, Time-Bound

For each top priority, draft one objective following these rules:

- **Start with a strong verb**: Establish, Accelerate, Transform, Build, Win, Prove, Become, Unlock, Dominate, Solidify. Avoid weak verbs like "improve," "support," or "continue"
- **Make it aspirational but grounded**: The 70% confidence rule -- if a team member would bet 7 out of 10 times they'll fully achieve it, it's calibrated correctly. 100% confidence = not ambitious enough. Below 50% confidence = may demoralize
- **Make it qualitative**: An objective is a direction, not a number. Numbers belong in key results. "Grow revenue" is an objective direction; "$10M ARR" is a key result
- **Make it memorable**: A good objective can be remembered without looking it up. "Make our API the industry's preferred integration layer" is memorable. "Improve API performance and developer experience to support growth" is forgettable
- **One objective per priority, maximum 5 objectives total**: Research by the OKR methodology's practitioners at Google and Intel consistently shows that beyond 5 objectives, teams scatter effort and average performance on all objectives decreases
- **Objectives must be uncomfortable**: If the current trajectory of normal work would achieve the objective without extra effort, it's not an OKR -- it's a budget line
- **Time-bind implicitly**: The objective should describe a state that would be meaningfully different from today's state by the end of the period

### Step 4: Write Key Results -- Quantitative, Outcome-Oriented, Independently Verifiable

Write 2-4 key results per objective using this methodology:

- **Canonical structure**: "[Metric] from [baseline] to [target] by [end of period]." This structure forces explicit baseline documentation and directional clarity
- **Outcomes over outputs**: The most common OKR failure is writing activities as key results. Test every KR with this question: "Could we achieve this number even if the underlying problem isn't solved?" If yes, it's an output. "Ship 3 onboarding email sequences" can be achieved while onboarding still fails. "Reduce time-to-first-value from 21 days to 7 days" cannot be gamed
- **One metric per key result**: Never combine two metrics in one KR ("increase NPS and reduce churn"). They may move independently, require different interventions, and are impossible to score cleanly
- **Set targets at the 70% stretch level**: Target should feel aggressive but not absurd. If your baseline retention is 80%, a target of 95% in one quarter is likely fantasy; a target of 87% is a meaningful stretch; 83% is probably business-as-usual
- **Verify measurability**: Every KR must be answerable with data that already exists or can be instrumented by week 2 of the period. If you cannot describe exactly where the data comes from and who owns it, the KR is not ready
- **Balance leading and lagging indicators**: Lagging indicators (ARR, annual churn, NPS) show final outcomes but change slowly. Leading indicators (weekly active users, trial-to-paid conversion, support ticket volume) move faster and allow mid-quarter course correction. A strong objective has at least one leading indicator KR alongside lagging outcome KRs
- **Cover the full success picture**: If achieving all key results but missing a critical dimension would still feel like failure, add a KR for that dimension. Example: an engineering team with a velocity KR but no quality KR will ship fast and break things

### Step 5: Check for the Four Key Result Failure Modes

Run each KR through these four tests before finalizing:

- **The Sandbagging Test**: Would a team with normal effort hit this target easily? If yes, raise the target by 20-40% or reclassify as business-as-usual. Targets with 100% historical achievement rate indicate sandbagging
- **The Vanity Metric Test**: Does this number look good but not drive real decisions? Page views, downloads, and registered users are classic vanity metrics unless explicitly tied to downstream outcomes. Prefer MAU over DAU if DAU is gamed by notification spam; prefer revenue-per-user over total revenue if you have pricing power problems
- **The Gaming Test**: Could the team hit the number by exploiting the metric definition rather than solving the real problem? "Reduce support ticket volume" can be gamed by making ticket submission harder. Pair it with a customer satisfaction KR to prevent gaming
- **The Attribution Test**: Is the team actually responsible for this number? Marketing cannot own "increase ARR" alone if the sales team closes deals. Define ownership precisely

### Step 6: Assign Owners, Confidence Scores, and Dependencies

For each objective and each key result:

- **Objective owner**: One named person (or named role) who is accountable for the whole objective. This person facilitates the weekly check-ins and is the escalation point for blockers. Never assign a team as owner -- "the product team" cannot be held accountable, a person can
- **KR owner**: Can be the same as the objective owner or a different person for specific KRs. Each KR should have exactly one person responsible for tracking and reporting the number
- **Confidence score**: Set at the time of writing. 70% is the target calibration. Explicitly document confidence below 60% (flag for resource discussion) or above 85% (flag for target recalibration)
- **Dependencies**: For every cross-team dependency, identify: the team being depended on, the specific deliverable needed, and whether there is an explicit commitment from that team or just an assumption. Unconfirmed dependencies are the #1 cause of mid-quarter OKR failure

### Step 7: Define the Review Cadence and Mid-Cycle Protocol

OKRs without a review cadence are aspirational documents, not management tools:

- **Weekly check-ins**: 15-30 minutes per objective. Each KR owner reports current status, projected end-of-period score, and any blockers. Use a simple RAG (Red/Amber/Green) or confidence delta ("last week I was 70% confident of hitting this; this week I'm 55% -- here's why")
- **Mid-cycle review (week 6 of a 13-week quarter)**: Full review of all OKRs. At this point, teams should update confidence scores. If a KR has confidence below 30% and nothing has changed to unblock it, discuss whether to deprioritize it formally (a committed OKR that is clearly failing should be acknowledged, not ignored)
- **Legitimate mid-cycle OKR changes**: OKRs can be revised mid-cycle if: (a) the business context changed materially (acquisition, product pivot, competitive emergency), or (b) the baseline was discovered to be wrong at the time of setting. They should NOT be revised simply because the target looks hard. Document any changes with the reason
- **End-of-cycle scoring**: Score all KRs within 5 business days of period end. Hold a retrospective covering: What did we learn about our priorities? Where did our confidence assessments fail? What should change in the next cycle?

### Step 8: Validate the Complete OKR Set

Before presenting the final OKRs, run this validation checklist:

- [ ] 3-5 objectives total (not fewer, not more)
- [ ] Each objective has 2-4 key results (8-12 KRs total for the entity -- this is the maximum manageable number)
- [ ] Every KR contains exactly one specific number with a baseline and target
- [ ] No KR is an activity, task, or output -- all are outcomes or impact metrics
- [ ] Each objective has one named human owner
- [ ] Each KR has one named human owner
- [ ] Cross-team dependencies are documented with commitment status
- [ ] Confidence scores are set (none should be 100%)
- [ ] At least one leading indicator KR exists per objective
- [ ] No two KRs within the same objective measure the same thing
- [ ] The full set can be achieved with current resources (no single objective requires more than 150% of available capacity)
- [ ] Scoring method is defined and consistent across the entire set

---

## Output Format

```
## OKRs: [Team/Company Name] -- [Time Period]

**Mission Context:** [One sentence: what enduring purpose do these OKRs serve?]
**Scoring Method:** 0.0–1.0 scale (0.7 = stretch target met; this is success)
**Team Size / Capacity:** [X people, notable constraints]
**Set By:** [Name/role] | **Set On:** [Date] | **Review Date:** [Mid-period date]

---

### Priority Stack (ranked)
1. [Priority 1 -- type: growth/efficiency/foundation/defense]
2. [Priority 2]
3. [Priority 3]
(Include all priorities. Show ranking. Deprioritized items listed below the line if user provided more than 5.)

---

### Objective 1: [Aspirational, verb-led, qualitative statement]
**Owner:** [Named person or role]
**Type:** [Growth / Efficiency / Foundation / Defense]
**Confidence at Setting:** [X]% -- [one-sentence rationale]

| KR# | Key Result | Type | Baseline | Target | Owner | Score |
|-----|-----------|------|----------|--------|-------|-------|
| 1.1 | [Metric] from [X] to [Y] | [Leading/Lagging] | [X] | [Y] | [Name] | /1.0 |
| 1.2 | [Metric] from [X] to [Y] | [Leading/Lagging] | [X] | [Y] | [Name] | /1.0 |
| 1.3 | [Metric] from [X] to [Y] | [Leading/Lagging] | [X] | [Y] | [Name] | /1.0 |

**Why these KRs:** [2-3 sentences explaining how these three numbers together fully represent achievement of the objective -- what would be missing if any one were removed]
**Dependencies:** [Team/person -- specific deliverable needed -- commitment confirmed: Yes/No/Pending]
**Risks:** [1-2 specific risks to this objective, not generic]

---

### Objective 2: [Aspirational, verb-led, qualitative statement]
**Owner:** [Named person or role]
**Type:** [Growth / Efficiency / Foundation / Defense]
**Confidence at Setting:** [X]% -- [one-sentence rationale]

| KR# | Key Result | Type | Baseline | Target | Owner | Score |
|-----|-----------|------|----------|--------|-------|-------|
| 2.1 | [Metric] from [X] to [Y] | [Leading/Lagging] | [X] | [Y] | [Name] | /1.0 |
| 2.2 | [Metric] from [X] to [Y] | [Leading/Lagging] | [X] | [Y] | [Name] | /1.0 |
| 2.3 | [Metric] from [X] to [Y] | [Leading/Lagging] | [X] | [Y] | [Name] | /1.0 |

**Why these KRs:** [Explanation]
**Dependencies:** [Cross-team dependencies with commitment status]
**Risks:** [Specific risks]

---

### Objective 3: [Aspirational, verb-led, qualitative statement]
**Owner:** [Named person or role]
**Type:** [Growth / Efficiency / Foundation / Defense]
**Confidence at Setting:** [X]% -- [one-sentence rationale]

| KR# | Key Result | Type | Baseline | Target | Owner | Score |
|-----|-----------|------|----------|--------|-------|-------|
| 3.1 | [Metric] from [X] to [Y] | [Leading/Lagging] | [X] | [Y] | [Name] | /1.0 |
| 3.2 | [Metric] from [X] to [Y] | [Leading/Lagging] | [X] | [Y] | [Name] | /1.0 |

**Why these KRs:** [Explanation]
**Dependencies:** [Cross-team dependencies with commitment status]
**Risks:** [Specific risks]

---

### [Objective 4 and 5 if applicable -- same structure]

---

### OKR Set Health Check
| Criterion | Status | Notes |
|-----------|--------|-------|
| Objective count (3-5) | ✓ / ✗ | [Count] |
| KR count per objective (2-4) | ✓ / ✗ | [Any outliers] |
| All KRs are outcome metrics | ✓ / ✗ | [Flag any outputs] |
| All owners named | ✓ / ✗ | [Any gaps] |
| Leading indicators present | ✓ / ✗ | [Which objectives lack them] |
| Dependencies confirmed | ✓ / ✗ | [Pending confirmations] |
| Confidence range (50-85%) | ✓ / ✗ | [Any outliers] |

---

### Scoring Reference
| Score | Meaning | Action |
|-------|---------|--------|
| 0.0–0.3 | No meaningful progress | Root cause review -- was the target wrong or did execution fail? |
| 0.4–0.6 | Progress made, target missed | Identify specific blockers; carry forward or retire |
| 0.7 | Stretch target met | This is success -- celebrate and set next target from this new baseline |
| 0.8–0.9 | Exceeded target | Ask if baseline was understated or target was insufficiently ambitious |
| 1.0 | Massively exceeded | Target was almost certainly too conservative -- recalibrate next cycle |

### Review Schedule
| Touchpoint | Cadence | Format | Owner |
|------------|---------|--------|-------|
| Weekly progress check-in | Weekly, [Day of week] | 15-min standup; RAG + confidence delta per KR | [Objective owner] |
| Mid-cycle deep review | [Specific date -- week 6] | 60-min working session; confidence rescore, blocker resolution | [Team lead] |
| End-of-cycle scoring | By [Date -- 5 days post period end] | Async score entry + 45-min retrospective | [All owners] |
| Next cycle planning kickoff | [Date -- 2 weeks before new period] | Draft OKRs based on retrospective learnings | [Team lead] |

### Deprioritized Items (if applicable)
The following priorities were raised but not included in this cycle's OKRs due to capacity constraints or lower strategic urgency. They are candidates for the next cycle or for inclusion if a higher-priority objective is completed early:
- [Item 1 -- reason for deferral]
- [Item 2 -- reason for deferral]
```

---

## Rules

1. **Never produce OKRs without baselines.** A target without a baseline is not a key result -- it is a wish. If the user cannot provide a baseline, help them identify where the data lives and set finding the baseline as a prerequisite action item before the OKR cycle begins. A KR like "achieve NPS of 45" is incomplete; "increase NPS from 28 to 45" is valid.

2. **Enforce the 3-5 objective limit absolutely.** If a user insists on 6 or 7 objectives, do not produce all six -- instead, present the list and ask: "If your team could only accomplish three of these this quarter and everything else stayed flat, which three would you choose?" Document the others in the Deprioritized Items section. More than 5 objectives is a symptom of an inability to say no, not a sign of ambition.

3. **Key results measure outcomes, not activities or outputs.** The output/outcome distinction is the most common and most damaging OKR error. "Launch the redesigned onboarding flow" is an output -- it can be completed even if onboarding fails. "Reduce median time-to-first-workflow-creation from 18 days to 6 days" is an outcome. When a user writes an output KR, rewrite it as an outcome and show the user why the distinction matters.

4. **One metric per key result, no exceptions.** A KR with two metrics ("increase trial conversion and reduce CAC") cannot be scored cleanly. The two metrics may require contradictory interventions. If a user writes a compound KR, split it into two separate KRs and note that this may push them over the 4 KR limit, requiring one to be dropped.

5. **Never tie OKR scores to compensation or performance ratings.** This is the most well-documented cause of OKR program failure. When compensation is at stake, teams sandbag targets to guarantee a 1.0 score. OKRs are a direction-setting and learning tool, not a performance evaluation instrument. If a user asks to use OKR scores for reviews or bonuses, explicitly flag this as a known failure mode and recommend separating the two processes.

6. **Set and document confidence at 70% for each objective at time of writing.** Objectives with >85% confidence at writing are not ambitious enough and should be escalated. Objectives with <50% confidence at writing are likely to demoralize and should be descoped or given explicit additional resources. Confidence is not a performance prediction -- it is a calibration signal.

7. **Every objective and every KR must have exactly one named human owner, not a team.** "Engineering" cannot be held accountable. "Priya Sharma, Engineering Lead" can be. When a user specifies a team as owner, ask for the specific person who will be accountable.

8. **Flag unconfirmed cross-team dependencies as high-risk.** A key result that depends on another team's deliverable without an explicit commitment is not a valid KR -- it is a hope. Mark all dependencies with commitment status (Confirmed/Pending/Unknown) and flag Pending and Unknown as blockers that must be resolved in week one of the cycle.

9. **At least one leading indicator key result per objective.** Lagging indicators (annual retention, ARR, CSAT score) are important but only visible at the end of the period. Without a leading indicator, teams can spend ten weeks failing before anyone notices. For every objective, ensure at least one KR moves on a weekly or monthly basis.

10. **If a user asks to use binary (done/not done) scoring for all KRs, push back.** Binary scoring eliminates the signal contained in partial achievement. A KR scored 0.6 tells you the team made meaningful progress and got 60% of the way to the target -- valuable information for the next cycle. Binary 0 on the same KR tells you nothing except that it was not completed. Reserve binary scoring only for truly discrete deliverables (e.g., "Achieve SOC 2 Type II certification") that have no meaningful partial state.

11. **Never let OKRs become a task list.** If every item in the key results section describes something the team plans to do rather than a state of the world they plan to create, the OKR set has been written as a project plan. OKRs answer "how will we know we succeeded?" -- project plans answer "what will we do?" Both are necessary; they are not interchangeable.

12. **Validate that the full OKR set is achievable given stated team capacity.** If a team of 5 engineers has three objectives each with 4 key results and ambitious targets, ask whether there is sufficient capacity to pursue all 12 KRs simultaneously. A practical heuristic: each KR requires meaningful dedicated effort from at least one person; 8-12 total KRs is the maximum for most teams of under 20 people.

---

## Edge Cases

### First OKR Cycle -- Organization Has Never Done OKRs Before
Set a lower bar on ambition for cycle one -- the goal is to build the habit, not achieve maximum stretch simultaneously. Limit to 2-3 objectives with 2 KRs each. Include a meta-objective for the OKR practice itself with KRs such as: "Complete 8 of 13 weekly check-ins on schedule," "Score all KRs within 5 business days of quarter end," and "Conduct end-of-cycle retrospective with 80% of objective owners present." Explain to the user that the first cycle's primary output is learning what good OKRs look like for their specific context -- not transformational business results. Targets will be off; baselines will be discovered to be wrong; that is expected and acceptable.

### Cascading Company OKRs to Team Level
Start by documenting the company-level OKRs (which must exist before team OKRs are written). Then for each team, identify which company objectives their work influences most directly. Team objectives should be written to contribute to at least one company objective, with the company objective explicitly referenced. Show the cascade mapping in a table:

| Team Objective | Contributes to Company Objective |
|---------------|----------------------------------|
| [Team O1] | Company O2, Company O3 |

Not every company objective needs a team-level counterpart -- some company objectives are owned entirely at the exec level. Not every team objective needs to map to a company objective -- some team objectives address team-specific foundation work (hiring, technical debt, process) that enables future company objectives without directly moving current ones. The cascade should be explicit but need not be rigid.

### Annual OKRs Instead of Quarterly
Annual OKRs require quarterly milestone checkpoints embedded within each key result -- otherwise there is no mechanism for mid-year course correction. Structure each annual KR with four quarterly milestones: "Increase ARR from $4.2M to $7.0M, with quarterly checkpoints of $4.8M (Q1), $5.5M (Q2), $6.2M (Q3), $7.0M (Q4)." Review at each quarterly milestone exactly as you would a quarterly OKR end-of-cycle. Annual OKRs work best for objectives that genuinely require a full year to show results (building a new product line, entering a new market, achieving a compliance certification). For anything measurable in 90 days, quarterly is strongly preferred.

### OKRs for a Team in Crisis or Turnaround
In a turnaround context (significant revenue decline, recent layoff, near-miss compliance failure, product outage impacting customers), objectives shift from growth to defense and stabilization. Key results should include explicitly defensive targets: "Maintain customer retention above 78%" rather than "Increase retention to 85%." Confidence scores will be lower -- 55-65% is acceptable and should be acknowledged rather than hidden. Reduce the total number of objectives to 2-3 -- crisis response requires focused effort, not a full-spectrum strategic program. Consider including a Crisis Metrics section beneath the standard OKR set listing the handful of metrics the team will track weekly regardless of OKR structure (cash runway, daily active users, support escalation volume, employee attrition signals).

### OKRs for an Individual Contributor
Individual-level OKRs follow the same structure but with two additional constraints. First, key results must be within the IC's sphere of direct control -- an IC cannot own a KR that depends on a full-team behavior change they cannot enforce. Second, IC objectives should explicitly map to at least one team-level objective to ensure alignment. A common error is IC OKRs that are purely personal development goals -- "get better at SQL," "improve presentation skills." These are personal development items that belong in a growth plan, not OKRs. IC OKRs should describe the business impact the IC will create in their role this quarter.

### OKRs With Missing Baseline Data
If a user cannot provide a baseline for a key result because the metric has never been tracked, handle it explicitly. For the current cycle, create a "measurement establishment" KR: "Instrument and baseline [metric] by week 3 and achieve [target] by end of quarter." This KR acknowledges the measurement gap and makes closing it the first deliverable. Alternatively, set the first cycle's KR as purely measurement-focused: "Establish baseline measurement for customer health score covering 100% of enterprise accounts by week 4." The following cycle can then set a directional target from that baseline. Never invent a baseline number to make the format work.

### OKRs That Are Actually Project Plans in Disguise
Some users will present a set of initiatives or features they plan to ship and ask to convert them into OKRs. The output format will look like OKRs but will be structured as an activity list. Recognize this pattern: "Objective: Launch the new dashboard. KR1: Complete UI design by week 3. KR2: Ship backend API by week 6. KR3: Release to all users by week 10." These are project milestones, not OKRs. Push back and reframe: ask "What business outcome would a successful dashboard launch create?" Then write the OKR around that outcome: "Objective: Make product data effortlessly accessible for every user. KR1: Increase daily active dashboard usage from 18% to 45% of licensed users. KR2: Reduce time spent by users generating standard reports from 25 minutes to under 5 minutes." Point the user to the project management skill for the execution tracking they also need.

---

## Example

**Input:** "Set Q3 2026 OKRs for our 12-person Customer Success team. We're a B2B SaaS company with $8.5M ARR and 340 enterprise customers. We just came off a rough Q2 where we lost 11 customers and our NPS dropped from 42 to 31. The CEO wants us to focus this quarter on stopping the churn, rebuilding customer health scores, and proving the value of CS to the CFO who is questioning the team's ROI. We track NPS, CSAT, churn rate, and we have a health score model that currently rates 38% of our accounts as Red. I don't have a good number for our current expansion revenue contribution. Team capacity is normal -- no headcount changes this quarter."

**Output:**

---

## OKRs: Customer Success Team -- Q3 2026

**Mission Context:** Ensure every enterprise customer achieves measurable value from the platform, making renewal and expansion the natural outcome of a successful partnership.
**Scoring Method:** 0.0--1.0 scale (0.7 = stretch target met; this is success)
**Team Size / Capacity:** 12 CSMs -- full capacity, no headcount changes this quarter
**Set By:** CS Team Lead | **Set On:** [Q3 kickoff date] | **Mid-Cycle Review:** [Week 7 of Q3]

---

### Priority Stack (ranked)
1. **Stop customer churn** -- Defense (lost 11 customers in Q2; this is the existential priority)
2. **Rebuild customer health** -- Defense/Foundation (38% Red accounts is a leading indicator of continued churn)
3. **Prove CS team ROI to the CFO** -- Foundation (team budget is at risk without demonstrated impact)
4. **Establish expansion revenue baseline** -- Foundation (currently unmeasured; cannot manage what we cannot see)

*Note: Priority 4 was added because the inability to report expansion revenue is itself a risk to Priority 3. It requires only measurement work, not a full strategic push, so it is embedded into Objective 3 rather than receiving its own standalone objective.*

---

### Objective 1: Halt the churn crisis and make our enterprise base stable
**Owner:** Director of Customer Success
**Type:** Defense
**Confidence at Setting:** 65% -- Q2 churn had multiple root causes, not all of which are within CS control; pricing and product gaps may continue to influence outcomes

| KR# | Key Result | Type | Baseline | Target | Owner | Score |
|-----|-----------|------|----------|--------|-------|-------|
| 1.1 | Reduce monthly gross customer churn rate from 1.1% to 0.4% (trailing 3-month average at Q3 end) | Lagging | 1.1%/mo | 0.4%/mo | Director of CS | /1.0 |
| 1.2 | Reduce percentage of enterprise accounts with a Red health score from 38% to 20% | Leading | 38% | 20% | CS Ops Lead | /1.0 |
| 1.3 | Complete documented save plays for all 43 currently Red-flagged accounts by week 6 | Leading | 0 of 43 | 43 of 43 | All CSMs | /1.0 |

**Why these KRs:** KR 1.1 is the lagging outcome the objective is designed to move. KR 1.2 is the leading indicator -- Red health score is the strongest predictor of churn in our model, and moving it gives a mid-quarter signal on whether the intervention is working before it shows up in the churn rate. KR 1.3 ensures structured action on every at-risk account rather than ad hoc firefighting; without it, teams tend to focus only on the loudest accounts, not the highest-risk ones.

**Dependencies:** Product team -- confirmation of the top 3 product gaps cited in Q2 exit interviews will be addressed (Pending as of OKR setting date). Finance -- access to full customer contract data for renewal date mapping (Confirmed).

**Risks:** External: competitor pricing actions may continue to drive evaluations regardless of CS quality. Internal: if more Red accounts exist than currently identified, KR 1.2 target may need revision after a complete audit in week 1.

---

### Objective 2: Transform CS from a reactive support function into a proactive value driver
**Owner:** CS Operations Lead
**Type:** Foundation
**Confidence at Setting:** 70% -- team has the skills; this is a process change, which is within our control

| KR# | Key Result | Type | Baseline | Target | Owner | Score |
|-----|-----------|------|----------|--------|-------|-------|
| 2.1 | Increase NPS from 31 to 42 (measured via quarterly pulse survey sent week 12) | Lagging | 31 | 42 | Director of CS | /1.0 |
| 2.2 | Increase the percentage of customers receiving a proactive business review (QBR or EBR) before their renewal date from 22% to 70% | Leading | 22% | 70% | CS Ops Lead | /1.0 |
| 2.3 | Increase average CSAT score on post-interaction surveys from 3.8/5 to 4.4/5 | Leading | 3.8 | 4.4 | All CSMs | /1.0 |

**Why these KRs:** NPS (KR 2.1) is the headline outcome metric and tracks overall sentiment trajectory. QBR/EBR coverage (KR 2.2) is the specific behavioral change we believe drives NPS -- customers who receive proactive reviews are 3x more likely to renew and expand in our historical data. CSAT (KR 2.3) tracks quality of individual interactions and catches regressions in team execution before they show up in NPS.

**Dependencies:** Marketing -- updated customer-facing ROI report template needed for QBRs (Pending). RevOps -- renewal date data feed to CS platform (Confirmed).

**Risks:** NPS survey response rate may be low given Q2 trust damage -- we may need to increase outreach to get statistically significant sample. Target of 42 assumes we can reach the accounts most positively impacted first; if the most vocal detractors respond disproportionately, the score may lag even as sentiment improves.

---

### Objective 3: Prove the business impact of Customer Success to secure the team's future investment
**Owner:** Director of Customer Success
**Type:** Foundation
**Confidence at Setting:** 75% -- the data is measurable; this is an execution and communication challenge, not a discovery problem

| KR# | Key Result | Type | Baseline | Target | Owner | Score |
|-----|-----------|------|----------|--------|-------|-------|
| 3.1 | Establish and baseline CS-influenced expansion revenue metric by week 4, with Q3 actuals reported to CFO by week 13 | Leading | Unmeasured | Baseline + actuals documented | CS Ops Lead | /1.0 |
| 3.2 | Increase CS-influenced net revenue retention rate from 94% to 102% (baseline to be confirmed in week 2 audit) | Lagging | ~94% (estimated) | 102% | Director of CS | /1.0 |
| 3.3 | Deliver a CS Impact Report to the CFO by week 12 covering: churn prevention value ($), expansion revenue influenced ($), and cost-per-retained-customer | Lagging | No report exists | Report delivered and reviewed | Director of CS | /1.0 |

**Why these KRs:** KR 3.1 closes the measurement gap immediately -- we cannot manage or report expansion revenue without a definition and baseline, and it must be established early in the quarter to have actuals by week 13. KR 3.2 is the single most important financial metric for CS team ROI -- net revenue retention above 100% means the CS team is generating more revenue from the existing base than is leaving, a compelling CFO argument. KR 3.3 is the explicit deliverable that ties the other two together and ensures the work is communicated, not just done.

**Dependencies:** RevOps -- revenue attribution model for expansion (Pending -- must be confirmed by week 1). Finance -- access to customer contract values for churn prevention calculation (Confirmed).

**Risks:** KR 3.2 baseline of 94% is an estimate -- the actual baseline audit in week 2 may reveal a different number, requiring target revision. KR 3.3 has a discrete binary element; consider adding an intermediate milestone (draft delivered to CS leadership by week 10) to avoid last-minute risk.

---

### OKR Set Health Check

| Criterion | Status | Notes |
|-----------|--------|-------|
| Objective count (3-5) | ✓ | 3 objectives |
| KR count per objective (2-4) | ✓ | All objectives have exactly 3 KRs |
| All KRs are outcome metrics | ✓ | KR 1.3 and KR 3.3 have discrete delivery components -- acceptable given they represent structural changes with clear completion states |
| All owners named | ✓ | All objective and KR owners specified by role |
| Leading indicators present | ✓ | KR 1.2, 1.3, 2.2, 2.3, 3.1 are leading indicators |
| Dependencies confirmed | ⚠ | 3 dependencies Pending -- must be resolved in week 1 |
| Confidence range (50-85%) | ✓ | Range is 65-75%; all within acceptable band |
| Baseline data complete | ⚠ | KR 3.2 baseline is estimated -- audit required by week 2 |

---

### Scoring Reference
| Score | Meaning | Action |
|-------|---------|--------|
| 0.0--0.3 | No meaningful progress | Root cause review -- was the target wrong or did execution fail? |
| 0.4--0.6 | Progress made, target missed | Identify specific blockers; carry forward or retire |
| 0.7 | Stretch target met | This is success -- celebrate and set next target from this new baseline |
| 0.8--0.9 | Exceeded target | Ask if baseline was understated or target was insufficiently ambitious |
| 1.0 | Massively exceeded | Target was too conservative -- recalibrate next cycle |

### Review Schedule
| Touchpoint | Cadence | Format | Owner |
|------------|---------|--------|-------|
| Weekly CS standup | Every Monday, 9am | 20-min RAG check per KR + confidence delta | Director of CS |
| Week 1 action | Week 1 only | Resolve 3 pending dependencies; confirm KR 3.2 baseline | CS Ops Lead |
| Mid-cycle deep review | Week 7 | 60-min session; confidence rescore; baseline correction for KR 3.2 if needed | Director of CS |
| CFO Impact Report draft review | Week 10 | Internal CS review of draft before CFO submission | Director of CS |
| End-of-cycle scoring | 5 days after Q3 end | Async KR scoring + 45-min retrospective: what do we carry into Q4? | All owners |
| Q4 OKR kickoff | 2 weeks before Q4 start | Draft Q4 OKRs using Q3 actuals as new baselines | Director of CS |

### Deprioritized Items This Cycle
The following priorities were discussed but not included in Q3 OKRs due to capacity constraints. They are Q4 candidates:
- **Build a CS certification/training program for customer admins** -- valuable for retention but requires marketing and product collaboration not available this quarter; revisit in Q4 planning
- **Launch a customer community platform** -- a Q2 proposal that requires 2 dedicated CSMs for 6 weeks; not viable until churn crisis is addressed and team has bandwidth
