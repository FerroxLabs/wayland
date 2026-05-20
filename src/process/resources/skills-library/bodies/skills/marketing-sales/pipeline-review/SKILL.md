---
name: pipeline-review
description: |
  Produces a weekly pipeline review format with stage definitions, deal
  health assessments, forecast calculations, and risk flags using CRM
  hygiene methodology. Use when the user asks to create a pipeline review
  template, structure a weekly sales forecast meeting, build a deal
  inspection framework, design a pipeline health dashboard, or prepare
  for a sales pipeline review with leadership.
  Do NOT use for win/loss analysis of closed deals (use win-loss-analysis),
  individual deal strategy (use sales-playbook-section), or marketing
  funnel analysis (use marketing-analytics-report).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sales analysis planning template"
  category: "marketing-sales"
  subcategory: "sales"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Pipeline Review

## When to Use

Use this skill when the user needs to build, run, or improve a structured sales pipeline review process. Specific triggers include:

- User asks to create a pipeline review template, weekly forecast format, or deal inspection framework for a sales team
- User wants to structure a recurring pipeline meeting -- weekly, bi-weekly, or monthly -- and needs an agenda, data structure, and inspection methodology
- User needs to assess pipeline health for leadership reporting, board preparation, or QBR (Quarterly Business Review) readiness
- User wants to build a pipeline coverage model with weighted forecasting, commit categories, and scenario ranges
- User needs to implement CRM hygiene standards and wants objective criteria for flagging stalled, at-risk, or phantom deals
- User is a sales manager, VP of Sales, or RevOps leader designing a deal inspection process for a team of AEs or SDRs
- User wants to calculate pipeline velocity, identify bottlenecks between stages, and diagnose conversion problems
- User needs a forecast methodology that distinguishes between weighted pipeline, rep commit, and manager-adjusted most-likely estimates

**Do NOT use when:**
- The user needs post-sale analysis of closed-won or closed-lost deals -- use `win-loss-analysis` instead
- The user wants coaching on a single deal strategy, discovery questions, or negotiation tactics -- use `sales-playbook-section` instead
- The user needs to analyze top-of-funnel marketing metrics, lead sources, or campaign attribution -- use `marketing-analytics-report` instead
- The user is building a customer success renewal process -- renewal pipeline has fundamentally different stage logic and risk factors
- The user wants to calculate sales rep compensation or quota attainment breakdowns -- this is a separate comp modeling task
- The user needs to design a sales territory or account assignment model -- that is a territory planning skill

---

## Process

### Step 1: Gather Pipeline Context Before Building Anything

Before producing any template or review structure, ask the user to confirm or provide the following context. Do not guess -- wrong assumptions about deal size or cycle length will make the output misleading.

- **Sales motion type:** Are these transactional deals (under $10K, under 30-day cycle), mid-market velocity deals ($10K--$100K, 30--90 days), or enterprise complex sales ($100K+, 90--365 days)? Each requires different inspection depth and stage granularity.
- **Stage names and count:** How many pipeline stages exist in their CRM? What are they called? (Qualified, Discovery, Demo, Proposal, Negotiation is a common five-stage B2B SaaS model; other orgs use three stages or seven.)
- **Team composition:** How many AEs, and is there an SDR/BDR team feeding the pipeline? Is this a single rep review or a team-level aggregation?
- **Quota structure:** What is the current period quota (monthly or quarterly), how much has been attained, and how many selling days remain?
- **Average deal size and average sales cycle length:** These two numbers drive expected stage duration, stall thresholds, and coverage ratio targets.
- **Historical win rates by stage:** If the team has 2+ quarters of data, use actual conversion rates as probability weights. If not, start with calibrated industry defaults and flag that they are estimates.
- **Reporting cadence and audience:** A rep self-review needs different depth than a VP report to the board. Weekly team meetings need velocity data; monthly board reviews need pipeline coverage trends and forecast accuracy tracking.
- **CRM health baseline:** Are stage definitions enforced in the CRM, or do reps self-report stage? Is close date a required field? Is activity logging tracked? CRM hygiene gaps must be noted as a risk factor in the output.

### Step 2: Define Pipeline Stages with Enforcement Criteria

Weak pipeline reviews collapse because stage definitions are vague or unenforced. Build stage definitions with four components for each stage: entry criteria (what must be objectively true to place a deal here), exit criteria (what must be completed to advance), expected duration (based on average sales cycle divided across stages), and historical close probability.

- **Entry criteria must be observable facts, not rep opinions.** "Rep believes prospect is interested" is not an entry criterion. "Discovery call completed, pain statement documented in CRM, decision-making process confirmed" is a valid entry criterion.
- **Probability weights must come from actual historical data wherever possible.** Pull win rates from closed deals by stage-at-which-they-entered. A deal that enters at Negotiation stage may close at 85--92% historically; a deal at first Demo may close at 20--35% depending on sales motion. These are not interchangeable with each other.
- **Use MEDDIC/MEDDPICC as a qualification layer, not a replacement for stages.** Metrics (quantified business impact), Economic Buyer (confirmed access), Decision Criteria (known evaluation standards), Decision Process (mapped steps to contract), Identify Pain (confirmed business problem), Champion (internal advocate), Competition (known alternatives) -- these fields should be populated by late Discovery or Demo stage at the latest. Deals advancing to Proposal without a confirmed Economic Buyer are red-flag deals.
- **Set maximum expected stage durations based on average sales cycle.** For a 45-day average cycle: Qualified = 7 days, Discovery = 10 days, Demo = 10 days, Proposal = 10 days, Negotiation = 8 days. Any deal exceeding 1.5x the expected duration in a stage should be flagged as stalled automatically.
- **Closed-Lost is a stage, not an exception.** Deals must be formally disqualified in the CRM; they cannot sit in active stages indefinitely. Ghost deals -- deals with no activity in 30+ days still sitting in mid-stage -- are a CRM hygiene failure and must be treated as pipeline inflation.

### Step 3: Build the Pipeline Snapshot

The snapshot answers the question: what does the pipeline look like right now and how has it changed? It must reflect real CRM data, not rep self-reporting without verification.

- **Calculate three pipeline totals:** (1) Total pipeline value (raw sum of all active deals), (2) weighted pipeline value (sum of deal value x stage probability), and (3) coverage ratio (weighted pipeline / remaining quota). These three numbers together tell the real story. Total pipeline alone is almost always misleading.
- **Pipeline coverage target benchmarks:** For a 30-day sales cycle, 2.5:1 to 3:1 weighted coverage is minimum healthy. For a 60-day cycle with forecast period of 30 days, you need 3:1 to 4:1. For enterprise 6-month+ cycles forecasting a quarter, 4:1 to 5:1 weighted coverage is appropriate because not all pipeline will close in the current period. These ratios are for weighted pipeline -- raw pipeline ratios should never be used as a health metric.
- **Segment pipeline by rep and by stage.** A total team number masks individual rep pipeline problems. One rep with 80% of the team's pipeline in Proposal stage and no early-stage deals is a risk to next quarter, even if this quarter looks fine.
- **Track pipeline movement since last review in absolute terms.** Report: new deals created, deals advanced by at least one stage, deals won, deals lost, and deals stalled (no stage change, no activity, no close date update). The ratio of new deals added to deals leaving (won + lost + disqualified) is the pipeline vitality rate. If you are losing more deals than you are adding, coverage will deteriorate.
- **Age the pipeline.** Calculate average deal age per stage and compare to expected duration. A Negotiation stage with an average age of 45 days when expected duration is 8--10 days signals either sandbagged deals that should have been won or phantom deals that are not real.
- **Flag deals with close dates in the current period versus deals without confirmed close dates.** Only deals with close dates in the current quarter or month should count in the period forecast. Undated deals are not pipeline -- they are a list of companies someone talked to.

### Step 4: Run Deal-Level Health Assessment Using a Structured Inspection Framework

The pipeline snapshot shows aggregates; deal inspection surfaces what is actually happening inside individual deals. This is where the review earns its value. Apply a consistent inspection framework to every deal above a minimum value threshold (typically deals above 0.5x average deal size deserve individual inspection).

- **Apply the four-question deal health test:**
  1. Is there a confirmed next step with a date and attendees? (Not "following up next week" -- a calendar invite that is accepted.)
  2. Is the Economic Buyer identified and have we had direct contact with them in the last 14 days?
  3. Is there a confirmed decision date that the prospect has stated (not a close date the rep estimated)?
  4. Do we understand why we win and why we lose in this deal -- what is the competitive situation and what is our differentiated position?
- **Assign health scores (Green / Yellow / Red) with explicit criteria, not judgment calls:**
  - **Green:** All four questions answered yes, deal is within expected stage duration, no unresolved blockers.
  - **Yellow:** One or two questions unanswered, deal is 10--49% over expected stage duration, or one blocker identified with a mitigation plan.
  - **Red:** Three or four questions unanswered, deal is 50%+ over expected stage duration, competitor has been selected as front-runner, champion has gone dark, or no contact with Economic Buyer in 21+ days.
- **Identify champion strength separately from deal health.** A champion is not just a friendly contact -- a champion has power, urgency, and is actively selling internally on your behalf. Test champion strength with: Has the champion shared internal budget information? Have they introduced you to the Economic Buyer? Have they told you what happens to them personally if this problem is not solved? Weak champions are the leading cause of late-stage deal losses.
- **Detect sandbagging vs. slippage risk.** Reps sandbag (hold deals back to next quarter to protect their number) and also underestimate risk. Sandbag signals: deal has been at 90% probability for multiple weeks, close date keeps sliding by exactly one period, rep is vague about why it has not closed. Slippage risk signals: no Economic Buyer access, deal is single-threaded (one contact), budget has not been formally approved.
- **Flag deal-level risks with specific categories:** No Economic Buyer access; single-threaded (one contact); no confirmed decision timeline; competitor advantage signals; champion has left the company; deal size changed significantly from original estimate; internal champion at prospect company has changed roles.

### Step 5: Calculate Forecast Using a Multi-Method Model

A single forecast number is not a forecast -- it is a guess. Use three to four methods in parallel and compare them. The gap between methods reveals where confidence is high or low.

- **Method 1 -- Weighted Pipeline Forecast:** Sum of (deal value x stage probability) across all deals with close dates in the period. This is a mathematically neutral view -- it neither optimistic nor pessimistic, but it averages out individual deal dynamics. Use this as a baseline sanity check.
- **Method 2 -- Rep Commit:** Each rep states the specific deals they are committing to close this period. These are deals the rep is staking their credibility on. Manager must validate each commit against the deal health inspection -- a red deal cannot be in commit without an explicit save plan. Total rep commits without the outlier cleanups represent the floor of the forecast.
- **Method 3 -- Manager-Adjusted Most Likely:** The manager applies deal inspection knowledge to adjust rep commits. Move deals out of commit that are red with no save plan. Add deals back in from yellow status that the manager believes will close based on direct knowledge. This is the number the sales manager is willing to present to the VP.
- **Method 4 -- Best Case:** All green deals plus yellow deals that have a specific next step in the current period. This represents the ceiling if everything breaks right. Best case should never exceed 2x the commit number -- if it does, the deal health assessment is not calibrated correctly.
- **Track forecast accuracy from prior periods.** Calculate: (Actual closed / Commit forecast) for each prior period. Healthy forecast accuracy is 90--110% -- close enough that the commit is credible. Consistent over-forecasting (above 110% actual vs. commit) suggests commits are too conservative. Consistent under-forecasting (below 90%) means deals are being committed that are not real, which is the more dangerous problem. Report forecast accuracy as a team health metric.
- **Apply a coverage ratio check to the forecast period.** If weighted pipeline coverage is below 2:1 for the remaining period, state explicitly that hitting quota is mathematically very difficult without significant pipeline injection. Do not soften this message -- it is a resource allocation signal for leadership.

### Step 6: Identify and Prioritize Pipeline Actions

A pipeline review that ends without assigned actions is a status meeting, not a management tool. Every review must generate a ranked action list with owners and deadlines.

- **Categorize actions into four buckets:** (1) Deal acceleration -- specific deals that need a new approach, executive engagement, or champion activation to move forward; (2) Deal rescue -- red deals that have a credible save plan and deadline to execute it before disqualification; (3) Pipeline injection -- prospecting, outbound, or marketing actions required to close the coverage gap for the next period; (4) CRM hygiene -- deals that must be updated, advanced, or disqualified by end of week to ensure the snapshot is accurate.
- **Escalation actions must name the executive sponsor and the specific ask.** "Get leadership involved in the Acme deal" is not an action. "Schedule a 30-minute call between our VP of Sales and the CFO at Acme by [date] to discuss ROI model and answer budget questions" is an action.
- **Set a disqualification deadline.** Any deal that cannot be updated with a specific next step and confirmed Economic Buyer by the next review should be moved to Closed-Lost. Keeping ghost deals in the pipeline corrupts the coverage ratio and misleads forecasting. Disqualification is not failure -- it is data hygiene.
- **Identify pipeline gaps by rep and by source.** If three reps have 30-day coverage above 3:1 but two reps are below 1.5:1, the team-level number is misleading. The two reps with thin pipeline need immediate outbound activity or SDR support directed specifically at their territory or segment.
- **Quantify the pipeline gap.** If weighted pipeline is $200K and remaining quota is $400K (0.5:1 coverage), the pipeline gap is $800K in new pipeline needed to reach 3:1 coverage assuming 35% weighted-to-close rate over the period. Name this number explicitly so leadership can make a resource decision.

### Step 7: Build the Pipeline Health Indicator Dashboard

Beyond individual deals and current period forecast, a healthy pipeline review includes trend metrics that diagnose systemic problems before they show up in missed quota.

- **Pipeline velocity formula:** (Number of deals x Average deal value x Win rate) / Average sales cycle length in days. This gives a daily pipeline output rate. Tracking velocity week over week shows whether the engine is accelerating or slowing. A 10% velocity drop over two consecutive periods is an early warning sign.
- **Stage conversion rates:** What percentage of deals advance from each stage to the next? Benchmark for B2B SaaS: Qualified to Discovery ~70%, Discovery to Demo ~60%, Demo to Proposal ~50%, Proposal to Negotiation ~65%, Negotiation to Closed-Won ~80%. If your Demo-to-Proposal rate is 25%, you have a demo quality or qualification problem, not a closing problem.
- **Time-in-stage averages by rep:** Variance between reps on time-in-stage reveals process differences. A rep spending 3x longer in Discovery than peers is either being more thorough (positive) or is running undisciplined discovery calls that do not result in Demo commitments (negative). Investigate, do not assume.
- **New pipeline creation rate:** How many new opportunities are being created per rep per week? For a velocity sales motion with a 45-day cycle, a healthy AE should be creating 3--5 new opportunities per week. Below 2 per week signals a prospecting problem that will create a pipeline trough 4--6 weeks from now.
- **Lead response time:** If SDRs are feeding the pipeline, track time from lead creation to first contact and time from first contact to Qualified stage. Leads contacted within 5 minutes of inquiry convert 21x better than leads contacted after 30 minutes. If this metric is not tracked, recommend it be added.

### Step 8: Package the Output for the Intended Audience

A rep self-review is not the same as a VP presentation to the board. Calibrate depth and format to audience.

- **Rep self-review (weekly):** Focus on deal-level actions, health scores for each deal, and personal pipeline coverage ratio. One page maximum. Primary question answered: "What do I need to do this week to hit my number?"
- **Team review with manager (weekly):** Add pipeline movement summary, forecast comparison table, and team health indicators. Primary question answered: "Are we on track and where do we need to intervene?"
- **VP/CRO review (monthly or QBR):** Include trend data, forecast accuracy from prior periods, pipeline velocity trend, coverage ratio by rep, and cohort analysis of deals created in the quarter. Primary question answered: "Is the sales engine healthy and what is the risk to the quarter?"
- **Board or investor review (quarterly):** Focus on coverage trends, forecast accuracy, pipeline velocity versus plan, and leading indicators of next quarter's performance. Avoid deal-level detail. Primary question answered: "Is growth durable and are there structural pipeline risks?"

---

## Output Format

```
## Pipeline Review: [Period -- e.g., "Week of November 4" or "Q4 Month 2"]

**Review Type:** [Weekly Team / Monthly VP / QBR / Self-Review]
**Team / Rep:** [Team name or individual AE name]
**Period Quota:** [$X total] | **Attained:** [$X (X%)] | **Remaining:** [$X]
**Selling Days Remaining This Period:** [X days]
**Review Date:** [Date]
**Next Review:** [Date]
**Prepared By:** [Manager name or role]

---

### Executive Summary

[2--3 sentence summary of pipeline health, forecast confidence level, and the single most
important action the team needs to take this week. Example: "Weighted pipeline coverage
is 2.1:1 against remaining quota of $280K, below the 3:1 target. Forecast confidence is
Medium -- 4 of 7 committed deals have Economic Buyer access confirmed. Priority this week
is rescuing the Acme Corp deal (Red) and accelerating 3 yellow deals with executive
outreach to close the coverage gap."]

---

### Pipeline Summary Snapshot

| Stage | Probability | # Deals | Total Value | Weighted Value | Avg Age (days) | Expected Duration | Age Status |
|-------|-------------|---------|-------------|----------------|----------------|-------------------|------------|
| Qualified | 10% | [X] | [$X] | [$X] | [X] | [X days] | [On Track / Aging] |
| Discovery | 25% | [X] | [$X] | [$X] | [X] | [X days] | [On Track / Aging] |
| Demo/Evaluation | 50% | [X] | [$X] | [$X] | [X] | [X days] | [On Track / Aging] |
| Proposal | 75% | [X] | [$X] | [$X] | [X] | [X days] | [On Track / Aging] |
| Negotiation | 90% | [X] | [$X] | [$X] | [X] | [X days] | [On Track / Aging] |
| **TOTAL** | -- | **[X]** | **[$X]** | **[$X]** | | | |

**Weighted Pipeline Coverage:** [X.X:1] | **Target:** [3:1 minimum]
**Coverage Status:** [🟢 Healthy / 🟡 Below Target / 🔴 Critical -- Action Required]
**Coverage Gap:** [If below 3:1: "$X in additional weighted pipeline needed to reach target"]

---

### Pipeline Velocity

| Metric | This Period | Prior Period | Trend |
|--------|-------------|--------------|-------|
| Pipeline Velocity ($/day) | [$X] | [$X] | [↑ / ↓ / →] |
| New Deals Created | [X] | [X] | [↑ / ↓ / →] |
| Average Deal Size | [$X] | [$X] | [↑ / ↓ / →] |
| Average Sales Cycle (days) | [X] | [X] | [↑ / ↓ / →] |
| Weighted Win Rate | [X%] | [X%] | [↑ / ↓ / →] |

**Velocity Formula Applied:** (# Deals × Avg Deal Size × Win Rate) / Avg Cycle Days

---

### Pipeline Movement Since Last Review

| Movement Type | # Deals | Total Value | Notes |
|---------------|---------|-------------|-------|
| New deals created | [X] | [$X] | [Source: outbound / inbound / partner] |
| Deals advanced (1+ stages) | [X] | [$X] | [Key advances] |
| Deals won | [X] | [$X] | [Names if <5 deals] |
| Deals lost | [X] | [$X] | [Top loss reason] |
| Deals disqualified (removed) | [X] | [$X] | [Reason] |
| Deals stalled (no activity [X]+ days) | [X] | [$X] | [Names for inspection] |
| **Net pipeline change** | | **[+/- $X]** | |

---

### Stage Definitions and Enforcement Criteria

| Stage | Entry Criteria (Observable Facts) | Exit Criteria | Expected Duration | Probability | MEDDIC Gate |
|-------|-----------------------------------|---------------|-------------------|-------------|-------------|
| Qualified | Responded to outreach; ICP confirmed; decision-maker or champion identified; initial pain hypothesis stated | Discovery call scheduled; CRM record complete | 5--7 days | 10% | Pain identified |
| Discovery | Discovery call completed; specific business pain documented; decision process outlined; budget range discussed | Demo scheduled with ≥1 decision-maker present | 8--12 days | 25% | Metrics + Pain + Decision Process |
| Demo/Evaluation | Demo delivered to ≥1 decision-maker; positive feedback documented; success criteria agreed | Proposal requested or evaluation criteria shared | 7--10 days | 50% | Decision Criteria confirmed |
| Proposal | Written proposal sent and acknowledged; ROI model presented; Economic Buyer confirmed | Verbal agreement to move to negotiation or contract review | 8--12 days | 75% | Economic Buyer confirmed |
| Negotiation | Contract terms under discussion; legal review started or waived; verbal commitment given | Signed contract or explicit Closed-Lost | 5--10 days | 90% | Champion + Economic Buyer active |

---

### Deal Health Assessment

**Inspection Criteria Applied:**
- ✅ Next step = Specific action + calendar date + confirmed attendees
- ✅ Economic Buyer = Direct contact in last 14 days
- ✅ Decision timeline = Prospect-confirmed date (not rep estimate)
- ✅ Competitive position = Known and documented

---

#### 🟢 Green -- On Track (All 4 criteria met, within expected stage duration)

| Deal Name | Company | Rep | Value | Stage | Days in Stage | Confirmed Close | Next Step (Date + Who) | Champion |
|-----------|---------|-----|-------|-------|---------------|-----------------|------------------------|---------|
| [Deal] | [Co] | [Rep] | [$X] | [Stage] | [X] | [Date] | [Specific action, date, attendees] | [Name, Title] |

---

#### 🟡 Yellow -- At Risk (1--2 criteria missing or stage duration 10--49% over target)

| Deal Name | Company | Rep | Value | Stage | Risk Category | Specific Risk | Mitigation Action | Owner | Due |
|-----------|---------|-----|-------|-------|--------------|---------------|-------------------|-------|-----|
| [Deal] | [Co] | [Rep] | [$X] | [Stage] | [No EB / Single-threaded / No timeline / Stalling] | [Specific detail] | [Action] | [Name] | [Date] |

---

#### 🔴 Red -- Likely to Slip or Disqualify (3--4 criteria missing or 50%+ over duration)

| Deal Name | Company | Rep | Value | Stage | Risk Category | Decision | Save Plan or Disqualify Deadline |
|-----------|---------|-----|-------|-------|--------------|----------|----------------------------------|
| [Deal] | [Co] | [Rep] | [$X] | [Stage] | [Category] | [Save / Disqualify by Date] | [Specific save plan steps OR disqualify by date] |

---

### Multi-Method Forecast

| Forecast Method | Definition | Amount | % of Remaining Quota |
|----------------|------------|--------|----------------------|
| Weighted Pipeline | Sum of (deal value × stage probability), current period close dates only | [$X] | [X%] |
| Rep Commit (Bottom-Up) | Specific deals reps are staking credibility on, manager-validated | [$X] | [X%] |
| Manager-Adjusted Most Likely | Commit minus red deals without save plans, plus high-confidence yellow deals | [$X] | [X%] |
| Best Case | All green + yellow with confirmed next steps | [$X] | [X%] |

**Forecast Confidence:** [🟢 High / 🟡 Medium / 🔴 Low]
**Confidence Rationale:** [Specific reason -- e.g., "6 of 8 committed deals have Economic Buyer access and confirmed decision timelines. Risk is the Acme deal ($45K) with no EB contact in 21 days."]
**Prior Period Forecast Accuracy:** [Actual / Commit forecast = X% -- tracking toward X% rolling average]

**Forecast Range:** [$X (floor -- commit minus risks)] to [$X (ceiling -- best case)]

---

### Pipeline Health Indicators

| Health Metric | Current | Target | Status | Trend |
|--------------|---------|--------|--------|-------|
| Weighted pipeline coverage ratio | [X:1] | 3:1+ | [🟢/🟡/🔴] | [↑/↓/→] |
| % Deals with confirmed next step (calendar) | [X%] | 90%+ | [🟢/🟡/🔴] | [↑/↓/→] |
| % Deals with Economic Buyer confirmed | [X%] | 80%+ | [🟢/🟡/🔴] | [↑/↓/→] |
| % Deals with prospect-confirmed close date | [X%] | 75%+ | [🟢/🟡/🔴] | [↑/↓/→] |
| Deals stalled ([X]+ days no activity) | [X deals / $X] | 0 | [🟢/🟡/🔴] | [↑/↓/→] |
| New pipeline created this period (per rep) | [$X / [X] deals] | [$X / [X] deals] | [🟢/🟡/🔴] | [↑/↓/→] |
| Stage conversion rate: Demo to Proposal | [X%] | [X% benchmark] | [🟢/🟡/🔴] | [↑/↓/→] |
| Average days in Negotiation | [X days] | Under [X days] | [🟢/🟡/🔴] | [↑/↓/→] |
| Forecast accuracy (rolling 4-period avg) | [X%] | 90--110% | [🟢/🟡/🔴] | [↑/↓/→] |

---

### Action Items

| Priority | Category | Deal / Area | Specific Action | Owner | Due Date | Success Criteria |
|----------|----------|-------------|----------------|-------|----------|-----------------|
| 1 | Deal Rescue | [Deal Name] | [Specific action] | [Name] | [Date] | [What "done" looks like] |
| 2 | Deal Acceleration | [Deal Name] | [Specific action] | [Name] | [Date] | [What "done" looks like] |
| 3 | Pipeline Injection | [Territory/Segment] | [Specific action] | [Name] | [Date] | [X new opps created] |
| 4 | CRM Hygiene | [Stalled deals] | Disqualify or update [specific deals] by [date] | [Name] | [Date] | Pipeline count reduced by [X] |
| 5 | Executive Engagement | [Deal Name] | [Exec name] to contact [prospect exec] re: [topic] | [Exec + Rep] | [Date] | Meeting confirmed |

---

### Coverage Projection: Next Period

[Brief paragraph or table projecting whether next period's pipeline is being seeded
adequately. Example: "Current Qualified-stage pipeline represents $X in deals that
will reach Proposal stage in approximately [X] weeks based on average cycle length.
To maintain 3:1 coverage in next period, [X] new opportunities need to be created
in the next [X] days. SDR team is currently creating [X] qualified opps/week, which
projects to [X:X] coverage for next period."]
```

---

## Rules

1. **Never use raw pipeline value as the coverage ratio numerator.** Always use weighted pipeline (value x stage probability). A pipeline with 20 deals in Qualified stage appears healthy in raw value but may be <1:1 when weighted. Raw pipeline inflates confidence and misleads forecasting.

2. **A next step of "follow up" or "check back in" is categorically not a next step.** A valid next step requires: a specific action (demo, proposal review, contract markup, executive call), a calendar date, and at least one confirmed attendee on the prospect side. Any deal without a valid next step defaults to Yellow health status regardless of other factors.

3. **Stage probability weights must be calibrated to your actual historical win rates, not industry defaults.** Use actual close rates from CRM data: pull all closed deals from the last 4--8 quarters, calculate what percentage closed won by the stage they were in 30 days before close. If the team has fewer than 50 closed deals, use industry benchmarks (10/25/50/75/90 for a five-stage model) and label them as estimates requiring recalibration.

4. **Never include a deal in the current-period forecast if it does not have a close date within the current period.** Deals with no close date, or with close dates in a future period, are not part of the current forecast. They belong in the pipeline snapshot but must be excluded from forecast calculations. Undated deals are pipeline inflation.

5. **Rep commits must be defended at deal level, not asserted at total level.** A rep saying "I'll commit to $150K this quarter" is not a commit -- it is a hope. Each committed deal must be named, and the rep must be able to answer all four deal health questions for it. Managers should not accept aggregated commit numbers without the underlying deal list.

6. **Deals that have been in the same stage for more than 1.5x the expected duration must be flagged automatically.** Do not wait for a rep to self-report a stall. If the expected Demo duration is 10 days and a deal has been in Demo for 16+ days with no activity logged, it is stalled regardless of what the rep says. This is a CRM hygiene rule, not a subjective assessment.

7. **The pipeline review must include pipeline movement data from the prior period.** A snapshot without a velocity reading is insufficient. You must report new deals created, deals advanced, deals won, deals lost, and net pipeline change. Without movement data, you cannot distinguish between a healthy pipeline that is moving and a stagnant pipeline that has the same snapshot value two weeks in a row.

8. **Champion quality must be assessed separately from deal health.** A deal can have a green health status (next step confirmed, Economic Buyer access, confirmed timeline) and still have a weak champion who is not actively selling internally. Include a champion strength indicator -- specifically whether the champion has explicitly advocated internally or made an introduction to financial decision-makers -- for all deals in Proposal stage or later.

9. **Forecast accuracy from prior periods must be included in any review prepared for leadership.** Showing forecast accuracy prevents sandbagging, prevents overconfident forecasting, and gives leadership the context to calibrate how much to trust the current forecast. If a team has forecasted $300K and closed $180K for three consecutive periods, the current $300K forecast requires a visible asterisk.

10. **Disqualification must be a formal step with a deadline, not an open question.** When a deal is flagged Red with no credible save plan, set an explicit disqualification deadline (typically the next review cycle). At that deadline, either a documented save attempt has been made and a specific next step exists, or the deal is moved to Closed-Lost. Deals cannot remain indefinitely in Red status -- they corrupt coverage ratios and waste review time.

11. **Pipeline reviews must distinguish between deals at risk of slipping to next period versus deals at risk of being lost entirely.** Slip risk and loss risk require different responses. A slip risk deal needs urgency creation and timeline acceleration tactics. A loss risk deal needs competitive repositioning or disqualification. Mixing these under "Red" status without categorization leads to the wrong interventions.

12. **Never build a pipeline review for a team without segmenting pipeline by rep.** Team-level aggregation conceals individual performance problems. Always show per-rep pipeline coverage and deal count alongside the team total. One rep carrying 60% of the team's pipeline while two others have sub-1:1 coverage is a critical signal that is invisible in team-level aggregates.

---

## Edge Cases

### Enterprise Deals with Sales Cycles Exceeding 90 Days

When average deal size exceeds $100K and sales cycles run 90--365 days, standard weekly pipeline snapshots are insufficient for deal inspection. Apply the following adjustments:

- Create a separate "strategic deal" section in the review with individual deal scorecards for every deal above the enterprise threshold. Each scorecard should include: MEDDPICC completeness score (1 point per confirmed field, out of 7), weeks in current stage versus expected, last Economic Buyer contact date, number of stakeholders mapped on the buying committee, competitive status, and deal risk factors.
- Forecast enterprise deals individually, not by stage probability. At this deal size, individual deal dynamics dominate. A deal is either in or out of the forecast based on specific evidence, not a probability weight.
- Set stall thresholds at 21 days (not 14) for enterprise deals, given the slower natural cadence. However, track Executive Buyer engagement separately -- more than 28 days without any EB contact is a red flag even if other activity is present.
- Include an "at-risk to slip quarters" flag. Enterprise deals often slip full quarters, not just weeks. Flag any enterprise deal whose close date is within 30 days and where contract redlines have not been initiated or legal has not been engaged.

### Single-Rep or Founder-Led Sales

When the review is for a single AE or a founder doing direct sales without a manager layer:

- Eliminate team aggregation sections. The deal health and action items table becomes the entire review.
- Add a time allocation column to the deal health table: what percentage of selling time is this rep investing in each deal? Misalignment between deal value and time investment is a common failure mode -- a rep spending 40% of their time on a $10K deal while a $80K deal sits without follow-up is a resource allocation problem.
- Include a prospecting activity tracker below the pipeline snapshot: calls made, emails sent, LinkedIn touches, and meetings booked this week versus personal targets. Single-rep pipelines deteriorate fastest when the rep gets consumed by existing deals and stops prospecting.
- Forecast horizon should extend two pipeline cycles out. If average cycle is 45 days, the self-review should address: what closes in the next 45 days (current pipeline), what enters the pipeline in the next 45 days (prospecting activity now), and what is the projected attainment 90 days from now? This prevents the "feast or famine" cycle where closing activity creates a prospecting gap.

### New Team or No Historical Win Rate Data

When a sales team has fewer than two full quarters of closed deal data, historical probability weights and benchmark conversion rates are not available. Handle this case explicitly:

- Use industry-standard stage probabilities as starting defaults: Qualified 10%, Discovery 25%, Demo/Evaluation 50%, Proposal 75%, Negotiation 90%. State clearly in the forecast section that these are estimates and that actual close rates may differ significantly.
- Add a data collection protocol to the action items: ensure all closed deals (won and lost) for the next 60 days are logged with the stage they were in at time of close, the original close date, and the primary win/loss reason. This data will enable the first calibration of actual stage probabilities.
- Widen the forecast range deliberately. Instead of a tight commit number, report a wider range (for example, "most likely: $120K--$180K") and explain that forecast precision will improve as historical data accumulates.
- Focus the health assessment on qualitative factors (MEDDIC completeness, next step quality, Economic Buyer access) rather than stage aging, since expected stage durations are also estimates until the team has 10+ deals per stage closed.

### Subscription / SaaS with Significant Renewal Pipeline

When the team manages both new business and renewal / expansion deals:

- Never blend new business and renewal pipeline in the same coverage ratio calculation. Renewals have fundamentally different close rates (typically 80--95% for healthy accounts versus 20--40% for new business) and mixing them inflates new business coverage ratios artificially.
- Renewal stage definitions differ from new business: Health Check (renewal risk assessment, usage data reviewed), Renewal Proposal (terms presented, expansion discussed), Legal / Approval (contract renewal in signature process). Probability weights for renewals should reflect actual churn rates -- if the company retains 88% of customers, a renewal in Health Check stage has an ~88% baseline probability, not the 25% a Discovery new business deal would have.
- Track renewal risk factors separately: product adoption rate (logins, key feature usage versus licensed users), NPS score at last survey, open support tickets, stakeholder turnover since original sale (has the original champion left?), and budget cycle timing.
- Expansion deals (upsells and cross-sells to existing accounts) belong in the new business pipeline, not the renewal pipeline, since they represent incremental revenue and carry new business-level uncertainty even though the relationship is established.

### Fiscal Quarter End Pressure and Deal Timing Manipulation

The final four weeks of a fiscal quarter introduce specific pipeline integrity risks that the review must address:

- Flag deals with close dates that were pushed from the prior quarter. A deal that slipped from Q2 to Q3 and is now approaching Q3 end has slipped once -- it is materially higher risk than a deal that has been on track throughout. Label these "second-generation close dates" and apply Red health status unless specific evidence of progress exists.
- Watch for pull-forward tactics: reps offering discounts or multi-year deals to accelerate close before quarter end. These deals may hit quota but reduce revenue quality. Note any deal where pricing has changed materially from the original proposal without a scope justification.
- Apply stricter next-step criteria in the final two weeks of the quarter. A deal without a signed contract, a verbal commitment from the Economic Buyer, or a legal review in progress cannot credibly be in the commit category at this stage, regardless of rep confidence.
- Require reps to confirm "what needs to happen for this to close before [quarter-end date]?" for every committed deal in the last 30 days of the quarter. If the answer involves steps that take more than the available calendar time (e.g., "we need legal review which takes 10 days" with 8 days left), reclassify the deal immediately.

### Multi-Product or Bundle Deals with Complex Scoping

When deals involve multiple products, modules, or services that may be scoped up or down during negotiation:

- Track deal value as a range in late Discovery and Demo stages rather than a single point estimate. Record minimum viable deal value (the smallest version the prospect would buy) and maximum potential deal value. This range reveals how much revenue is at risk of scope reduction versus how much upside exists.
- Create a "scope risk" flag for deals where the initial estimate is more than 2x the minimum viable deal. These deals are at risk of significant value compression even if they close, which affects quota attainment even in a win scenario.
- When calculating weighted pipeline, use the minimum viable deal value for conservative coverage and the maximum potential value for best case. Never use the speculative maximum for the base case coverage calculation.

### CRM Data Quality Is Unreliable

When the team's CRM data is known to be incomplete, inconsistently updated, or when reps are not logging activity reliably:

- Begin the pipeline review with a CRM hygiene audit before any analysis. Identify: deals with no activity logged in 14+ days, deals with close dates that have passed without being updated, deals missing required fields (next step, deal value, contact name), and duplicate deal records.
- State explicitly in the executive summary that the pipeline analysis is constrained by CRM data quality, and that coverage ratios and health scores are estimates only until hygiene improves.
- Add a CRM compliance metric to the health indicators table: % of deals with complete required fields, % of deals with activity logged this week, % of deals with valid close dates. Set targets (90% field completion, 100% activity logging for active deals) and track week over week.
- Recommend a CRM hygiene session as a standing item on the pipeline review agenda: 15 minutes at the start of each weekly review where reps update their deal records before the snapshot is taken. Snapshots pulled from stale data are worse than no snapshot.

---

## Example

**Input:** "Create a pipeline review for our SaaS sales team. We have 4 AEs, quarterly quota of $600K for the team. We're in week 7 of a 13-week quarter, so we have 6 weeks left. We've already closed $180K. Average deal size is $25K, average sales cycle is 45 days. Five stages: Qualified, Discovery, Demo, Proposal, Negotiation. Our historical win rates from stage are roughly: Qualified 8%, Discovery 22%, Demo 48%, Proposal 72%, Negotiation 88%. We have 38 active deals in the pipeline right now."

---

## Pipeline Review: Week 7 of Q4 -- Week of [Date]

**Review Type:** Weekly Team Review -- Sales Manager to VP of Sales
**Team:** Q4 SaaS Sales Team (4 AEs: Priya, Marcus, Dana, Trevor)
**Period Quota:** $600,000 total | **Attained:** $180,000 (30%) | **Remaining:** $420,000
**Selling Days Remaining:** ~30 days (6 calendar weeks; assumes weekdays only)
**Review Date:** [Date]
**Next Review:** [Date + 7 days]
**Prepared By:** Sales Manager

---

### Executive Summary

Weighted pipeline coverage is 1.8:1 against remaining quota of $420K, meaningfully below the 3:1 minimum target. The team needs approximately $420K in additional weighted pipeline to reach target coverage, which at current new deal creation rate (approximately 3 new deals per rep per week) will take 3--4 weeks to build -- leaving minimal runway. Forecast confidence is Medium: the rep commit of $280K is supported by 6 deals with confirmed Economic Buyer access and prospect-stated close dates, but 4 deals totaling $120K in the commit are Yellow or Red and need immediate action. **Priority this week: rescue the Meridian Tech deal ($45K, Red), accelerate executive engagement on two stalled Proposal deals, and increase outbound activity across all four reps to address the pipeline shortfall.**

---

### Pipeline Summary Snapshot

| Stage | Probability | # Deals | Total Value | Weighted Value | Avg Age (days) | Expected Duration | Age Status |
|-------|-------------|---------|-------------|----------------|----------------|-------------------|------------|
| Qualified | 8% | 14 | $350,000 | $28,000 | 4 | 7 days | ✅ On Track |
| Discovery | 22% | 9 | $225,000 | $49,500 | 11 | 10 days | ✅ On Track |
| Demo | 48% | 7 | $175,000 | $84,000 | 14 | 10 days | 🟡 Aging (+40%) |
| Proposal | 72% | 5 | $125,000 | $90,000 | 18 | 12 days | ✅ On Track |
| Negotiation | 88% | 3 | $75,000 | $66,000 | 22 | 8 days | 🔴 Aging (+175%) |
| **TOTAL** | -- | **38** | **$950,000** | **$317,500** | | | |

**Weighted Pipeline Coverage:** **0.76:1** ($317,500 / $420,000 remaining)

Wait -- this is critically below target. Let me recalculate for current-period close dates only (deals with close dates in the next 6 weeks):

*Filtering to deals with close dates within the period:* Deals in Proposal + Negotiation close in this period; Demo deals split approximately 50/50; Discovery and Qualified deals are unlikely to close within 45 days given the cycle length.

| Applicable to Current Period | # Deals | Weighted Value |
|-----------------------------|---------|----------------|
| Negotiation (90%+, all in period) | 3 | $66,000 |
| Proposal (72%, all in period) | 5 | $90,000 |
| Demo (48%, ~4 of 7 have in-period close dates) | 4 | $48,000 |
| **In-Period Weighted Total** | **12** | **$204,000** |

**In-Period Coverage:** **0.49:1** ($204,000 / $420,000) -- **🔴 CRITICAL: At current pace, team will attain approximately $204K + $180K already closed = $384K, approximately 64% of quarterly quota**

**Coverage Status:** 🔴 Critical -- Significant pipeline injection required immediately AND acceleration of existing mid-stage deals needed

**Coverage Gap:** $1,056,000 in additional new pipeline needed to reach 3:1 weighted coverage for the period (i.e., the team would need $1.26M in weighted pipeline; they have $204K; gap is approximately $1M -- this is not closeable in 6 weeks; the more actionable goal is maximizing attainment of remaining quota through deal acceleration)

---

### Pipeline Velocity

| Metric | This Period | Prior Period (Q4 Wks 1--6) | Trend |
|--------|-------------|---------------------------|-------|
| Pipeline Velocity ($/day) | $7,056/day | $8,200/day | ↓ 14% |
| New Deals Created (this week) | 8 | 11 (avg per week Q4) | ↓ 27% |
| Average Deal Size | $25,000 | $24,200 | ↑ 3% |
| Average Sales Cycle (days) | 47 | 44 | ↓ (slowing) |
| Weighted Win Rate | 22% | 26% | ↓ concerning |

**Velocity Formula:** (38 deals × $25,000 × 22% win rate) / 47 days = **$4,468/day** -- at this rate, projected Q4 total close = $180K attained + ($4,468 × 30 remaining days) = $314K attained, **52% of quota.** Velocity decline is the leading indicator of the quarter miss and must be addressed.

---

### Pipeline Movement Since Last Review

| Movement Type | # Deals | Total Value | Notes |
|---------------|---------|-------------|-------|
| New deals created | 8 | $200,000 | 5 inbound, 3 outbound; below weekly target of 12 |
| Deals advanced (1+ stages) | 6 | $150,000 | 3 Discovery → Demo; 2 Demo → Proposal; 1 Proposal → Negotiation |
| Deals won | 1 | $28,000 | Brightwave Corp (Priya) -- Negotiation to Close |
| Deals lost | 2 | $40,000 | Hartfield Inc (competitor selected); Novion (budget freeze) |
| Deals disqualified | 1 | $18,000 | ClearPath (champion left company, no replacement identified) |
| Deals stalled (14+ days no activity) | 5 | $112,000 | See Red deals below |
| **Net pipeline change** | | **-$238,000** | Won + lost + disqualified offset partially by new adds |

**Pipeline vitality concern:** The team lost/disqualified $58K and added $200K in new deals -- this seems net positive. However, new Qualified deals will not close for 45+ days, meaning they provide zero help to this quarter. The current-period pipeline is shrinking, not growing.

---

### Stage Definitions and Enforcement Criteria

| Stage | Entry Criteria (Observable Facts) | Exit Criteria | Expected Duration | Probability | MEDDIC Gate |
|-------|-----------------------------------|---------------|-------------------|-------------|-------------|
| Qualified | SDR-qualified or AE self-sourced; confirmed ICP match; decision-maker or champion identified by name and title; initial pain hypothesis stated in CRM notes | Discovery call completed; pain documented; decision-making process outlined | 5--7 days | 8% | Pain hypothesis |
| Discovery | Discovery call completed; business pain statement documented in CRM ("the problem is X and it costs us $
