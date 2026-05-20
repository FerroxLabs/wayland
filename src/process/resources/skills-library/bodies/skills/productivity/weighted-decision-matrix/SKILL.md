---
name: weighted-decision-matrix
description: |
  Builds and populates a weighted decision matrix for a specific choice. Identifies criteria from user priorities, assigns weights, scores each option, and computes weighted totals with a clear recommendation.
  Use when the user asks about making a decision between multiple options, building a decision matrix, comparing options with weighted criteria, or applying a structured scoring framework to a choice.
  Do NOT use for business strategic decisions or resource allocation (use business strategy skills), simple two-option comparisons (use pro-con-analysis), or task prioritization (use task-prioritization).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "decision-making analysis planning"
  category: "productivity"
  subcategory: "decision-making"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Weighted Decision Matrix

## When to Use

**Use this skill when:**
- The user is choosing between 3 or more distinct options and cannot converge on a winner through intuition alone -- typically because each option excels on different dimensions
- The user explicitly asks to "build a decision matrix," "score my options," "create a weighted comparison," or "help me think through this objectively"
- The user is making a decision with 4 or more competing criteria that cannot be easily traded off in their head (cognitive overload threshold)
- The user describes feeling stuck because "every option has pros and cons" and wants a structured way to surface which trade-offs matter most given their priorities
- The user needs to defend or document a decision to stakeholders and wants a quantified rationale rather than a narrative argument
- The user is comparing options that differ on both quantitative dimensions (cost, distance, time) and qualitative dimensions (culture fit, aesthetic preference, long-term potential) simultaneously
- The user has already done informal comparison and gotten inconsistent results depending on which factor they focus on -- the matrix resolves this by holding all factors simultaneously

**Do NOT use when:**
- The user has exactly two options and no hard constraints -- use `pro-con-analysis` instead, which is faster and less likely to produce false precision on a binary choice
- The user wants to stress-test a decision they have already leaned toward by imagining failure modes -- use `premortem-analysis`, which is purpose-built for that
- The user is allocating a budget or headcount across competing projects or departments -- use business strategy resource allocation skills, which account for portfolio effects and interdependencies that a matrix cannot
- The user has a backlog of tasks or projects to sequence -- use `task-prioritization`, which handles dependency chains, effort/impact ratios, and time horizons better than a static matrix
- The user is trying to understand the downstream consequences of a choice already made -- use `second-order-thinking` to map ripple effects rather than re-scoring the choice
- The user's decision is purely values-based with no meaningful differentiation on factual criteria (e.g., "should I forgive someone?") -- a matrix would manufacture false objectivity
- The decision has one criterion so dominant that it would receive 50%+ weight, making the matrix functionally a single-criterion filter -- just apply that criterion directly and skip the matrix overhead

---

## Process

### Step 1 -- Frame the Decision and Gather Inputs

Before building anything, establish the complete decision context. Ambiguous framing produces misleading matrices.

- State the decision as a closed question the user is actually trying to answer: "Which CRM platform should we adopt?" not "CRM options."
- Collect all options under consideration. Minimum 3, maximum 7. Fewer than 3 does not require a matrix; more than 7 creates cognitive overload during scoring and diminishing differentiation between options.
- Ask whether the user has already done any informal ranking -- knowing their gut instinct in advance helps detect when the matrix reveals something surprising versus confirms existing intuition.
- Establish reversibility on a three-point scale: fully reversible (low-stakes scoring acceptable), partially reversible (significant switching cost), or effectively irreversible (hire more criteria, weight more carefully, treat a 3 score as insufficient). Irreversible decisions should use 6-7 criteria and stricter scoring anchors.
- Confirm the decision timeline and who the decision-maker is -- if multiple stakeholders must agree, criteria weights may need to be negotiated rather than assigned by one person.
- Identify the decision's scope: personal, professional/team, or organizational. This affects whether to include political criteria (stakeholder buy-in) alongside functional ones.

### Step 2 -- Identify and Eliminate Options via Hard Constraints (Deal-Breakers)

Deal-breakers must be applied before any scoring begins. Scoring an option that fails a hard constraint wastes effort and muddies the matrix.

- A deal-breaker is a binary constraint: Pass or Fail. It does not exist on a spectrum. If it could be partially satisfied, it is not a deal-breaker -- it is a low-weight criterion.
- Common legitimate deal-breakers: regulatory compliance requirements, hard budget ceilings, non-negotiable timeline requirements, geographic restrictions, mandatory technical compatibility.
- Present deal-breakers in a table. Mark failing options as ELIMINATED and remove them from all subsequent scoring. If all options fail a deal-breaker, the constraint is wrong (too strict) or the option set is wrong (too narrow) -- surface this to the user before proceeding.
- Do not allow more than 3 deal-breakers. If the user lists 5 or more, they are likely including strong preferences, not true constraints. Reclassify preferences as high-weight criteria instead.
- If only one option passes all deal-breakers, the decision is made by elimination. The matrix is not needed -- confirm with the user and stop.

### Step 3 -- Extract and Define Decision Criteria

This is the most intellectually demanding step. Poorly defined criteria produce unreliable scores.

- Target 4-7 criteria. Fewer than 4 typically misses important dimensions; more than 7 creates noise and dilutes the weight of genuinely important factors. For high-stakes irreversible decisions, 6-7 criteria are appropriate.
- Each criterion must be independently measurable -- it cannot be a combination of two things. "Cost and quality" is two criteria. Separate them.
- Apply the redundancy test: if two criteria would always produce the same ranking across all options (e.g., "price" and "affordability"), they are measuring the same construct. Merge or eliminate the redundant one to avoid double-counting.
- Each criterion must discriminate. If all options score 3 on a criterion (they are equivalent), that criterion provides no analytical value. Remove it or redefine it at a finer resolution.
- Balance the criterion set across categories: Financial (cost, ROI, budget impact), Operational (implementation time, maintenance burden, scalability), Strategic (long-term fit, growth potential, alignment with goals), Risk (uncertainty, reversibility, downside exposure), and Human/Experiential (user satisfaction, learning curve, cultural fit). A matrix with only financial criteria misrepresents the real decision.
- Define explicit anchors for each criterion: what does a 1 look like? What does a 5 look like? Without anchors, different scorers apply different implicit scales and produce incomparable numbers.
- For qualitative criteria, translate the anchor into behavioral or observable terms. Instead of "1=bad culture, 5=great culture," use "1=significant values conflicts observed, 5=explicit alignment on core values with documented evidence."

### Step 4 -- Assign Weights Using a Structured Method

Weight assignment is where most decision matrices fail. People assign round numbers out of habit, not genuine relative importance.

- Method 1 -- Point Allocation (recommended for individual decisions): Give 100 points to distribute across all criteria. Ask: "If you could only make one criterion perfect, which would it be?" That one gets the most points. Work downward from there.
- Method 2 -- Pairwise Comparison (recommended for group decisions or high-stakes choices): Compare every pair of criteria. For each pair, ask: "Which matters more?" Count how many times each criterion wins. Convert win counts to percentage weights. This method forces the user to confront real trade-offs rather than inflating all weights.
- Method 3 -- Rank-and-Scale: Rank criteria 1 through N by importance. Assign weights inversely proportional to rank using the formula: weight of rank K = (N - K + 1) / sum(1 to N). For 5 criteria ranked 1-5, weights are approximately: 33%, 27%, 20%, 13%, 7%.
- Enforce bounds: no single criterion below 5% (mathematically negligible effect on final score) and no single criterion above 40% (it dominates the result and the matrix becomes a single-criterion comparison with noise added).
- If the user insists on >40% for one criterion, acknowledge it but warn them that the matrix will behave like a filtered ranking on that criterion. Proceed with their weights but note the implication.
- Weights must sum to exactly 100%. Verify arithmetically before proceeding. Rounding errors of 1-2% should be corrected by adjusting the lowest-weight criterion.
- If two people are assigning weights (e.g., co-founders, partners), have them assign weights independently first, then average. Discuss any criteria where weights differ by more than 10 percentage points -- those differences reveal genuine value conflicts that need resolution.

### Step 5 -- Score Each Option on Each Criterion

Scoring requires discipline. The most common error is anchoring scores on one option and scoring others relative to it rather than against the defined scale.

- Score against the anchor definitions, not against each other. The question is not "how does Option A compare to Option B on cost?" -- the question is "given the cost anchor definitions, what score does Option A deserve?"
- Use the 1-5 integer scale. Do not use decimals (e.g., 3.5) -- this creates false precision and signals undefined anchors. If a score feels like it falls between integers, the anchors need better definition.
- Assign rationale for every score before moving to the next. Write the rationale as a brief factual statement: what evidence justifies this score? Avoid justifications that contain relative comparisons to other options (that can contaminate scoring).
- Apply the 3-means-adequate rule: a score of 3 means "meets minimum requirements; acceptable but not strong." If an option merely exists in the right category, it gets a 3, not a 4. Many users over-score out of optimism -- push back when all options receive 4s and 5s.
- For quantitative criteria (cost, time, distance), define specific numeric ranges for each score level before scoring. Example for monthly SaaS cost: 1 = over $500/user, 2 = $300-500/user, 3 = $150-300/user, 4 = $50-150/user, 5 = under $50/user. This removes subjectivity.
- Check for halo effect after scoring: if one option has received mostly 4s and 5s and another mostly 2s and 3s across unrelated criteria, scrutinize whether the scoring reflects genuine differences or unconscious preference. Ask the user to justify any option's score that is 2 or more points different from another option on a criterion where objective differences are small.
- If the user cannot score a criterion because they lack information (e.g., "I haven't talked to them yet"), score it 3 (neutral/unknown) and flag it as an information gap. Do not skip it -- a missing score is not the same as a neutral score and skipping it distorts weighted totals.

### Step 6 -- Calculate Weighted Scores and Identify the Winner

This step is arithmetic, but interpretation requires judgment.

- Weighted score formula for each option: sum of (criterion score × criterion weight expressed as decimal) across all criteria. Example: score of 4 on a 25%-weight criterion contributes 4 × 0.25 = 1.00 to the weighted total.
- Maximum possible weighted score: 5.00 (if an option scored 5 on every criterion). Minimum possible: 1.00. Report scores on this 1.00-5.00 scale, not as percentages.
- Identify the winner. Classify the margin between first and second place using these thresholds: Clear winner = margin ≥ 0.50 (10% of the scale range). Close decision = margin 0.20-0.49. Toss-up = margin < 0.20.
- For a toss-up, do not force a winner. Instead, surface the tiebreaker question: ask the user which single criterion they would most regret having underweighted. That criterion becomes the tiebreaker.
- Calculate raw scores (unweighted sum of all criterion scores) alongside weighted scores. If the raw score ranking differs significantly from the weighted score ranking, highlight this -- it means the weights are doing real analytical work and are worth examining.
- Perform a dominance check: does any option score lower than every other option on every single criterion? If so, name it as dominated and suggest the user remove it from serious consideration regardless of the overall matrix result.

### Step 7 -- Sensitivity Analysis and Final Recommendation

A single matrix output is a point estimate. Sensitivity analysis reveals how robust the recommendation is.

- Test the highest-weight criterion: what happens to rankings if its weight is reduced by 10 percentage points (redistributed proportionally to other criteria)? If the winner changes, the decision is weight-sensitive and the user should reflect carefully on whether that weight is truly correct.
- Test the closest competitor: what score would the runner-up need on its weakest criterion (relative to the winner) to overtake the winner? Express as an achievable change. "Denver would win if you scored Austin's outdoor activities a 2 instead of a 3" is actionable. "Denver would need to score 5 on every criterion" is not a realistic sensitivity.
- Test an information gap: if any criterion was scored 3 due to missing information, show what happens if the actual score turns out to be 1 or 5. This tells the user whether filling that information gap is worth doing before deciding.
- State the recommendation with: winner name, weighted score, margin classification, the 2-3 criteria that most contributed to the win, and the conditions under which the runner-up would be preferred.
- State confidence level: High (margin ≥ 0.50, anchors well-defined, no information gaps), Medium (close decision or 1-2 information gaps), Low (toss-up or significant information gaps or user-reported uncertainty about weights).
- For irreversible decisions with Low confidence, recommend the user resolve information gaps before deciding rather than proceeding with the current matrix.

---

## Output Format

```
## Decision Matrix: [Decision Question as closed question]

### Decision Parameters
| Parameter | Detail |
|-----------|--------|
| Decision | [question being answered] |
| Options evaluated | [list all options] |
| Reversibility | [Fully reversible / Partially reversible (cost: [describe]) / Effectively irreversible] |
| Decision timeline | [when this must be decided] |
| Decision-maker(s) | [individual / named stakeholders] |
| Stakes | [Low / Medium / High -- brief justification] |

---

### Stage 1: Deal-Breaker Screening

| Hard Constraint | [Option 1] | [Option 2] | [Option 3] | [Option 4] |
|-----------------|-----------|-----------|-----------|-----------|
| [Constraint 1 -- specific and binary] | Pass / FAIL | Pass / FAIL | Pass / FAIL | Pass / FAIL |
| [Constraint 2] | Pass / FAIL | Pass / FAIL | Pass / FAIL | Pass / FAIL |

**Options eliminated by deal-breakers:** [None] OR [list eliminated options and which constraint failed]
**Options advancing to scoring:** [list]

---

### Stage 2: Criteria, Weights, and Anchors

| # | Criterion | Category | Weight | What it Measures | Score 1 | Score 5 |
|---|-----------|----------|--------|-----------------|---------|---------|
| 1 | [Criterion name] | [Financial/Operational/Strategic/Risk/Human] | [X]% | [precise definition] | [1-anchor: specific description] | [5-anchor: specific description] |
| 2 | [Criterion name] | [category] | [X]% | [definition] | [1-anchor] | [5-anchor] |
| 3 | [Criterion name] | [category] | [X]% | [definition] | [1-anchor] | [5-anchor] |
| 4 | [Criterion name] | [category] | [X]% | [definition] | [1-anchor] | [5-anchor] |
| 5 | [Criterion name] | [category] | [X]% | [definition] | [1-anchor] | [5-anchor] |
| **TOTAL** | | | **100%** | | | |

**Weighting method used:** [Point Allocation / Pairwise Comparison / Rank-and-Scale]

---

### Stage 3: Scoring Matrix

| Criterion (Weight) | [Option 1] | [Option 2] | [Option 3] | [Option 4] |
|--------------------|-----------|-----------|-----------|-----------|
| [Criterion 1] ([X]%) | [1-5] | [1-5] | [1-5] | [1-5] |
| [Criterion 2] ([X]%) | [1-5] | [1-5] | [1-5] | [1-5] |
| [Criterion 3] ([X]%) | [1-5] | [1-5] | [1-5] | [1-5] |
| [Criterion 4] ([X]%) | [1-5] | [1-5] | [1-5] | [1-5] |
| [Criterion 5] ([X]%) | [1-5] | [1-5] | [1-5] | [1-5] |
| **Raw Score (unweighted sum)** | [sum] | [sum] | [sum] | [sum] |

**Information gaps (criteria scored 3 due to missing data):** [list criterion + option, or None]

---

### Stage 4: Scoring Rationale

**[Criterion 1 -- name]** (1=[anchor], 5=[anchor])
- [Option 1]: [score] -- [factual justification, no relative comparisons]
- [Option 2]: [score] -- [factual justification]
- [Option 3]: [score] -- [factual justification]
- [Option 4]: [score] -- [factual justification]

**[Criterion 2 -- name]** (1=[anchor], 5=[anchor])
- [Option 1]: [score] -- [justification]
- [Option 2]: [score] -- [justification]
...

[Repeat for all criteria]

---

### Stage 5: Weighted Score Calculation

| Option | Raw Score | Weighted Score | Rank | vs. Winner |
|--------|----------|---------------|------|------------|
| [Option 1] | [sum of scores] | [weighted total to 2 decimal places] | [#] | [--] or [-X.XX] |
| [Option 2] | [sum of scores] | [weighted total] | [#] | [-X.XX] |
| [Option 3] | [sum of scores] | [weighted total] | [#] | [-X.XX] |

**Margin classification:** [Clear winner (≥0.50) / Close decision (0.20-0.49) / Toss-up (<0.20)]
**Dominance check:** [No dominated option] OR [[Option] is dominated -- scores lower than all other options on all criteria]

---

### Stage 6: Sensitivity Analysis

| Test | Change Applied | Winner Under This Scenario | Impact |
|------|---------------|---------------------------|--------|
| Reduce highest-weight criterion | [criterion] from [X]% to [X-10]% | [option] | [winner stays / changes to ___] |
| Information gap test | [criterion + option] scores [1] instead of [3] | [option] | [winner stays / changes to ___] |
| Information gap test | [criterion + option] scores [5] instead of [3] | [option] | [winner stays / changes to ___] |
| Runner-up threshold | What runner-up needs to win | [option] would need [criterion] score of [X] | [likely/unlikely] |

---

### Recommendation

**Winner: [Option Name]** -- Weighted Score: [X.XX] out of 5.00

**Margin:** [X.XX points] over [runner-up name] -- this is a [Clear win / Close decision / Toss-up]

**What drove the win:**
1. [Criterion name] (weighted [X]%): scored [X], contributing [X.XX] to weighted total -- [1-sentence explanation of why this criterion favored the winner]
2. [Criterion name] (weighted [X]%): scored [X], contributing [X.XX] -- [explanation]
3. [Criterion name] (weighted [X]%): scored [X] vs runner-up's [X] -- [explanation of the gap]

**Where the runner-up was stronger:** [criterion(s)] where [runner-up] outscored [winner] and why that was not enough to change the result

**When to choose the runner-up instead:** [specific condition -- e.g., "if your tech team doubles and family proximity becomes less important"] 

**Confidence: [High / Medium / Low]**
- [Reason: e.g., "Scores are well-supported with factual evidence; margin is clear; no information gaps"]
  OR
- [Reason: e.g., "Close margin -- small changes in weights shift the winner; resolve [specific information gap] before finalizing"]

**Recommended next step:** [specific action to take or information to gather before committing]
```

---

## Rules

1. **Never skip the deal-breaker stage.** Applying constraints after scoring is not equivalent -- it creates anchoring bias where the user has already formed opinions about scored options before realizing one should be eliminated. Constraints must be resolved before any scores are assigned.

2. **Weights must sum to exactly 100% before any scoring begins.** Do not allow rounding errors to accumulate. If the user allocates 102%, ask them to reduce a criterion by 2 percentage points before proceeding. Document which method was used to assign weights.

3. **Define anchors for 1 and 5 before scoring every criterion.** An undefined scale produces incomparable scores. For quantitative criteria, express anchors as specific numeric ranges (e.g., "5 = under $50/month per user"). For qualitative criteria, express anchors as observable behaviors or conditions, not adjectives like "great" or "poor."

4. **Every score cell requires a written rationale.** A score without a justification is not a score -- it is a guess. The rationale must reference the anchor definition and cite evidence. "Austin: 5 -- because it felt right" is not acceptable. "Austin: 5 -- three Google campus expansions announced in 2024, 8,000 open tech roles on LinkedIn as of this month" is acceptable.

5. **Do not use decimals on the scoring scale.** Scores are integers 1-5. A score of 3.5 signals that the anchors for 3 and 4 are insufficiently distinct. Resolve the anchor ambiguity rather than splitting the difference. Decimal scores create false precision and make the matrix look more accurate than it is.

6. **No criterion may receive less than 5% weight** -- at that weight, a criterion contributes a maximum of 0.20 points to the weighted total (5 × 0.05 = 0.25, 1 × 0.05 = 0.05; range of 0.20), which cannot change any ranking in a competitive matrix. Remove it as a criterion or reclassify it as a deal-breaker.

7. **No criterion may receive more than 40% weight without explicit acknowledgment.** A criterion with 40% weight contributes up to 2.00 points to the score, which means it alone can determine the winner regardless of all other criteria combined. This may be intentional (a dominant priority) but it must be stated explicitly so the user understands the matrix is functioning as a dominantly single-criterion ranking.

8. **When the top two options are within 0.20 points (toss-up), never declare a winner without qualification.** Instead, surface the tiebreaker question, test the sensitivity to weight changes, and identify any information gaps. A declared winner in a toss-up without these steps is false precision that may mislead the user into confidence they have not earned.

9. **Score against anchor definitions, not against other options.** The most common scoring error is using comparative language: "Option A gets a 4 on cost because it's cheaper than B." This conflates the scale with the options. Score Option A on cost by asking whether it meets the cost anchor for a 4, independent of what B costs. If both options are expensive, both may deserve 2s -- do not reassign scores to preserve contrast between options.

10. **For irreversible decisions with a Low confidence rating, recommend the user resolve information gaps before deciding.** The matrix is a tool for structuring known information, not for generating false certainty about unknown information. A Low-confidence matrix output for an irreversible decision (job relocation, major purchase, partnership commitment) should conclude with specific research actions, not just a winner declaration.

---

## Edge Cases

**User has only two options and insists on a matrix**
Acknowledge that a two-option matrix is less powerful than a multi-option one because it cannot reveal a dominated option and the scores will mechanically reflect the same ranking as a pro-con list. If the user insists, proceed but note that `pro-con-analysis` may yield the same result with less effort. The matrix is still valid for documenting a two-option choice for stakeholder communication.

**User cannot define criteria and does not know what matters**
Do not guess criteria on the user's behalf. Instead, use a structured prompt: "Let me walk you through five categories of criteria that matter in most decisions. For each, tell me whether it's important for your decision." Present: (1) Financial impact -- cost, ROI, long-term expense. (2) Time -- implementation speed, ongoing time commitment, deadline sensitivity. (3) Risk -- probability of failure, reversibility, downside exposure. (4) Strategic fit -- alignment with your long-term goals or values, growth potential. (5) Experience quality -- how much you'll enjoy or be energized by this option day-to-day. The user's responses will generate the criteria set. If they still struggle, ask: "Three months from now, what would make you feel like this was the right decision? What would make you feel it was the wrong one?" -- answers to those questions map directly onto criteria.

**User disagrees with the matrix result after seeing it**
This is valuable information, not a problem. Ask: "Which specific score feels wrong to you?" Do not accept "the whole thing feels off" -- require identification of a specific cell. If the user adjusts one score and the result changes, the matrix has done its job and the revised result stands. If the user adjusts scores until their preferred option wins but cannot justify the adjustments with evidence, surface this directly: "We've now adjusted [criterion] for [option] from [original score] to [new score] three times. That pattern usually means there's a criterion we haven't included yet that's driving your preference -- often an emotional or values-based factor. What is it?" Then add that criterion explicitly, weight it, score all options on it, and recalculate. Naming hidden criteria is one of the matrix's highest-value outputs.

**All options score nearly identically (range less than 0.30 weighted points)**
Two interpretations exist and they require different responses. First possibility: the criteria are too coarse. Ask whether any criterion could be subdivided. "Tech job market" might split into "remote job density" and "in-office employer quality" -- finer criteria may differentiate options that appeared equivalent. Second possibility: the options genuinely are equivalent on the evaluated dimensions, which is valuable information. Recommend: pick the option with the lowest switching cost (easiest to change later if wrong), or pick the option that generates the least regret if it underperforms. Do not force contrast where none exists.

**One option dominates across all criteria (scores highest on 4 of 5 criteria)**
This is a valid and common matrix outcome. Do not treat it as a sign the matrix is too simple -- dominance is useful confirmation, especially when the user suspected this option was strongest but felt guilty about not being "objective" about alternatives. State clearly: "[Option] is the dominant choice -- it outperforms all alternatives on [list of criteria] and matches or ties the best alternative on [remaining criteria]. The matrix confirms your analysis." However, examine whether the dominant option's criteria were defined in a way that systematically favored it (criteria selection bias). Ask: "Was there any criterion you deliberately excluded because [dominant option] would have scored poorly on it?" If yes, add that criterion and re-score.

**User is deciding as part of a group with conflicting priorities**
Do not average individual matrices after the fact -- this obscures real disagreements. Instead, run the matrix with agreed criteria but have each stakeholder assign weights independently first. Present the individual weight sets side by side before scoring begins. Criteria where weights diverge by more than 10 percentage points represent genuine priority conflicts that require discussion before scoring. If stakeholders cannot align on weights, the matrix can still be run with each person's weights separately to show how the recommendation changes by perspective -- this is often more valuable than a false consensus matrix. Recommend the group use a pairwise comparison method rather than point allocation, as it forces explicit trade-off choices that reveal real priorities.

**User has quantitative data available for some criteria but not others**
Use the quantitative data to calibrate the anchors for those criteria, then score against the anchors consistently. Do not mix methods within a criterion (partially quantitative, partially gut feel). If cost data exists: define the 1-5 scale using actual numbers, score every option against those numbers, and note the source. If satisfaction data exists (Net Promoter Scores, user reviews): define the 1-5 scale using those metrics. For criteria with no data, define behavioral anchors and score based on the user's judgment -- but explicitly label those cells as "judgment-based" in the scoring rationale. A mixed-evidence matrix is valid and more realistic than a fully judgment-based one; just make the epistemological status of each score transparent.

**User's weights produce a mathematically correct but obviously counterintuitive result**
If the winner has scored last on the criterion the user verbally describes as "the most important thing," this signals a weight assignment error. The user likely distributed points to too many criteria without reserving enough weight for their true top priority. Surface this: "You mentioned [criterion] is your top priority, but its 15% weight means it contributes at most 0.75 points to the total score. Meanwhile [other criteria collectively] account for 60% of the result. Does that weight distribution reflect your real priorities?" Then offer to rerun the weights using pairwise comparison, which typically redistributes weight more accurately to genuine top priorities.

---

## Example

**Input:** "I'm a solo developer trying to decide which cloud platform to use for a new SaaS product. My options are AWS, Google Cloud, and Azure. I care about pricing, my team's existing skills (it's just me and I know AWS slightly), the quality of managed database services, vendor lock-in risk, and developer documentation quality."

**Output:**

## Decision Matrix: Which Cloud Platform Should I Use for My SaaS Product?

### Decision Parameters
| Parameter | Detail |
|-----------|--------|
| Decision | Which cloud platform should I build my SaaS product on? |
| Options evaluated | AWS, Google Cloud Platform (GCP), Microsoft Azure |
| Reversibility | Partially reversible -- migrating between clouds after launch requires significant re-architecture of managed services; estimated 2-4 weeks of engineering effort per migration |
| Decision timeline | Before starting infrastructure setup (immediate) |
| Decision-maker | Solo developer |
| Stakes | High -- this decision affects architecture, tooling, and cost structure for the life of the product |

---

### Stage 1: Deal-Breaker Screening

| Hard Constraint | AWS | GCP | Azure |
|-----------------|-----|-----|-------|
| Must offer a managed PostgreSQL-compatible service | Pass | Pass | Pass |
| Must have a free tier or pay-as-you-go pricing (no minimum spend commitment required) | Pass | Pass | Pass |

**Options eliminated by deal-breakers:** None
**Options advancing to scoring:** AWS, GCP, Azure

---

### Stage 2: Criteria, Weights, and Anchors

| # | Criterion | Category | Weight | What it Measures | Score 1 | Score 5 |
|---|-----------|----------|--------|-----------------|---------|---------|
| 1 | Pricing for early-stage SaaS | Financial | 25% | Total estimated monthly cost at 0-500 active users, including compute (1 vCPU/2GB), managed Postgres (db.t3.micro equivalent), and egress (50GB/month) | $200+/month with no meaningful free tier | Under $30/month with sustained free tier or credits |
| 2 | Solo developer ramp-up speed | Operational | 30% | Time to productive deployment given solo developer starting from scratch; accounts for console UX, CLI tooling quality, and learning resources | 40+ hours to first production-ready deployment | Under 10 hours to first production-ready deployment |
| 3 | Managed database service quality | Operational | 20% | Quality, reliability, and feature set of the managed relational database offering: automated backups, point-in-time recovery, read replicas, connection pooling | No built-in connection pooling, manual backup management required, limited PITR | PgBouncer-compatible connection pooling built-in, automated PITR to 5-minute resolution, seamless read replica promotion |
| 4 | Vendor lock-in risk | Strategic | 15% | Degree to which core services used for a standard SaaS stack use open standards vs. proprietary APIs; portability of workloads if migration is needed later | Core services use fully proprietary APIs with no open-source equivalent; migration requires full rewrite | Core services map directly to open-source tools (Kubernetes, Postgres, standard S3 API); migration feasible with tooling changes only |
| 5 | Developer documentation quality | Human | 10% | Quality, accuracy, and navigability of official docs, tutorials, and error message explanations for the standard SaaS stack (compute + database + auth + storage) | Docs are fragmented, frequently outdated, error messages are cryptic, community answers are sparse | Official docs cover every API with working code examples, error messages include resolution steps, active community with answered questions |
| **TOTAL** | | | **100%** | | | |

**Weighting method used:** Point Allocation -- developer identified ramp-up speed as highest priority (solo operation, time is the binding constraint), followed by pricing at scale, then database quality, then lock-in risk, then documentation.

---

### Stage 3: Scoring Matrix

| Criterion (Weight) | AWS | GCP | Azure |
|--------------------|-----|-----|-------|
| Pricing for early-stage SaaS (25%) | 3 | 4 | 2 |
| Solo developer ramp-up speed (30%) | 4 | 3 | 2 |
| Managed database service quality (20%) | 4 | 3 | 4 |
| Vendor lock-in risk (15%) | 3 | 4 | 2 |
| Developer documentation quality (10%) | 4 | 3 | 3 |
| **Raw Score (unweighted sum)** | **18** | **17** | **13** |

**Information gaps:** None -- all criteria scored with available factual evidence.

---

### Stage 4: Scoring Rationale

**Pricing for early-stage SaaS** (1 = $200+/month, 5 = under $30/month)
- AWS: 3 -- Estimated $45-65/month for t3.micro EC2 + RDS db.t3.micro + 50GB egress; 12-month free tier covers most compute but expires; no sustained free tier after year one
- GCP: 4 -- e2-micro compute instance is permanently free (not time-limited); Cloud SQL for Postgres starts at ~$7/month for the smallest instance; $300 in credits for new accounts; estimated ongoing monthly cost under $35/month at early-stage traffic
- Azure: 2 -- B1s VM at ~$15/month; Azure Database for Postgres Flexible Server starts at ~$25/month for burstable tier; combined with egress costs ($0.087/GB), estimated $55-80/month with less generous free-tier coverage

**Solo developer ramp-up speed** (1 = 40+ hours, 5 = under 10 hours)
- AWS: 4 -- Developer already has some AWS familiarity; AWS console is complex but AWS CLI tooling (especially CDK and Copilot) has matured significantly; extensive community tutorials specifically for SaaS bootstrappers; existing mental model reduces ramp-up to approximately 8-12 hours for full stack
- GCP: 3 -- No existing familiarity; gcloud CLI is well-designed; Cloud Run + Cloud SQL is a straightforward SaaS pattern with good tutorials; estimated 15-20 hours from scratch without prior knowledge; Firebase documentation is strong but GCP-specific SaaS patterns require more research
- Azure: 2 -- Most complex console UX of the three; Azure Portal navigation requires significant orientation; resource group model adds conceptual overhead; estimated 25-35 hours for a solo developer with no prior Azure experience

**Managed database service quality** (1 = no connection pooling/manual backups, 5 = built-in pooling/5-min PITR/read replica promotion)
- AWS: 4 -- RDS for Postgres offers automated backups with 5-minute PITR, Multi-AZ standby, read replicas with promotion; no built-in connection pooling (requires PgBouncer on a separate instance or RDS Proxy at additional cost ~$0.015/hour); overall strong but connection pooling adds complexity
- GCP: 3 -- Cloud SQL for Postgres offers automated backups and PITR; no built-in connection pooling until you deploy Cloud SQL Auth Proxy or use AlloyDB at higher price point; read replicas available; slightly less mature than RDS on edge-case reliability; Cloud Spanner is overkill for early SaaS
- Azure: 4 -- Azure Database for PostgreSQL Flexible Server includes built-in PgBouncer connection pooling (a genuine differentiator); automated PITR with up to 35-day retention; seamless HA with zone-redundant standby; arguably the strongest Postgres managed service of the three for production SaaS

**Vendor lock-in risk** (1 = fully proprietary APIs, 5 = open-standard workloads only)
- AWS: 3 -- Core SaaS services (EC2/ECS, RDS, S3) use open standards; however SQS, Lambda, Cognito, and DynamoDB have proprietary APIs; risk is medium because a standard SaaS stack using RDS + S3 + ALB is relatively portable, but the AWS ecosystem encourages gradual adoption of proprietary services
- GCP: 4 -- Cloud Run (container-based) uses standard container APIs; Cloud SQL is standard Postgres; GCS uses an S3-compatible API; Firebase is proprietary but optional; Kubernetes on GKE is the most portable managed Kubernetes offering; lower lock-in risk for a containerized SaaS architecture
- Azure: 2 -- Azure Active Directory/Entra ID is deeply integrated and proprietary; Azure Service Bus and Blob Storage have non-standard APIs; Bicep/ARM templates are Azure-specific; higher lock-in risk than both AWS and GCP for standard tooling choices

**Developer documentation quality** (1 = fragmented/outdated, 5 = complete with code examples and active community)
- AWS: 4 -- AWS documentation is comprehensive and up-to-date; re:Post community has high-quality answered questions; AWS error messages often include documentation links; Boto3 docs are thorough; some docs suffer from being written for enterprise teams rather than solo developers but overall quality is high
- GCP: 3 -- Google Cloud docs are accurate but can feel sparse on practical SaaS patterns; Qwiklabs/Google documentation improved substantially 2022-2024; error messages are generally clear; community is smaller than AWS but StackOverflow coverage is adequate
- Azure: 3 -- Microsoft Learn documentation is extremely comprehensive for Azure services; however, docs often assume Windows tooling and .NET stacks, which creates friction for Linux/Node/Python developers; error messages in Azure Portal are sometimes generic; community is strong for enterprise scenarios, weaker for solo SaaS bootstrappers

---

### Stage 5: Weighted Score Calculation

| Option | Raw Score | Weighted Score | Rank | vs. Winner |
|--------|----------|---------------|------|------------|
| AWS | 18 | 3.65 | 1 | -- |
| GCP | 17 | 3.45 | 2 | -0.20 |
| Azure | 13 | 2.60 | 3 | -1.05 |

**Calculation detail:**
- AWS: (3×0.25) + (4×0.30) + (4×0.20) + (3×0.15) + (4×0.10) = 0.75 + 1.20 + 0.80 + 0.45 + 0.40 = **3.60**
- GCP: (4×0.25) + (3×0.30) + (3×0.20) + (4×0.15) + (3×0.10) = 1.00 + 0.90 + 0.60 + 0.60 + 0.30 = **3.40**
- Azure: (2×0.25) + (2×0.30) + (4×0.20) + (2×0.15) + (3×0.10) = 0.50 + 0.60 + 0.80 + 0.30 + 0.30 = **2.50**

**Margin classification:** Close decision (AWS leads GCP by 0.20 -- at the boundary between close and toss-up)
**Dominance check:** Azure scores lower than or equal to both AWS and GCP on every criterion except Managed Database Quality (where it ties AWS at 4). Azure is near-dominated and is not a competitive option under these criteria and weights.

---

### Stage 6: Sensitivity Analysis

| Test | Change Applied | Winner Under This Scenario | Impact |
|------|---------------|---------------------------|--------|
| Reduce highest-weight criterion | Ramp-up speed from 30% to 20% (redistributed equally to other 4) | AWS still wins -- 3.50 vs GCP 3.40 | Winner holds but margin shrinks to 0.10, becoming a toss-up |
| Ramp-up speed further reduced | Ramp-up speed from 30% to 10% (redistributed to pricing 35%, others proportional) | GCP wins -- 3.65 vs AWS 3.40 | If prior AWS experience is discounted, GCP's pricing advantage drives a reversal |
| Pricing weight increased | Pricing from 25% to 35% (reduce ramp-up to 20%) | GCP wins -- 3.60 vs AWS 3.50 | GCP's pricing advantage becomes decisive if cost is the primary concern |
| Runner-up threshold | What GCP needs to tie AWS under current weights | GCP would need ramp-up score of 4 instead of 3 | Practically achievable if developer invests in GCP tutorials upfront |

---

### Recommendation

**Winner: AWS** -- Weighted Score: 3.60 out of 5.00

**Margin:** 0.20 points over GCP -- this is a **Close Decision** at the border of toss-up. Azure is not competitive under these priorities (gap of 1.10 points).

**What drove the win:**
1. **Solo developer ramp-up speed** (weighted 30%): AWS scored 4 vs GCP's 3, contributing a 0.30-point advantage on the most heavily weighted criterion. The developer's existing AWS familiarity is a genuine asset that reduces time-to-deployment by an estimated 8-10 hours.
2. **Developer documentation quality** (weighted 10%): AWS scored 4 vs GCP's 3, contributing a small but decisive 0.10-point advantage -- exactly the gap between a close decision and a tie.
3. AWS matched or exceeded GCP on managed database quality (both competitive) and only trailed on pricing and lock-in risk, where GCP's advantages exist but were outweighed.

**Where GCP was stronger:** GCP outscored AWS on Pricing (4 vs 3, saving approximately $15-30/month at early stage) and Vendor Lock-in Risk (4 vs 3, reflecting more portable architecture). For a developer who anticipates multi-cloud deployment or expects to be cost-constrained for an extended period, GCP's advantages are real.

**When to choose GCP instead:** If the developer's AWS familiarity is shallow (less than 10 hours of hands-on experience), the ramp-up score for AWS should be revised to a 3 (tying GCP), which produces a near-tie and makes GCP's pricing advantage decisive. Also, if monthly cost tolerance drops below $30/month, GCP's permanent free-tier compute and lower database pricing becomes a stronger differentiator.

**Confidence: Medium**
The 0.20-point margin between AWS and GCP is small. The result is sensitive to how much the developer's existing AWS familiarity is credited -- that single score is the deciding factor. If the developer rates their AWS experience as minimal, the decision effectively reverses. Recommend: spend 2 hours deploying a basic compute + database stack on both AWS and GCP using the free tier before committing. The concrete experience will either confirm or update the ramp-up scores with actual data, raising confidence to High before any architecture decisions are locked in.

**Recommended next step:** Deploy a "hello world" SaaS stack (VM + managed Postgres + static file storage) on both AWS (using AWS Copilot or CDK) and GCP (using Cloud Run + Cloud SQL) before choosing. Budget 2-3 hours per platform. Score the actual ramp-up experience against the anchors defined above. Use the updated score to recalculate. If AWS still wins after hands-on comparison, proceed with confidence. If GCP proves equally fast to deploy, switch to GCP for the pricing and lock-in advantages.
