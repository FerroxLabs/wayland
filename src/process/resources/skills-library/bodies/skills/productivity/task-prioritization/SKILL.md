---
name: task-prioritization
description: |
  Applies a structured prioritization method (RICE, MoSCoW, or weighted scoring) to a list of tasks or features. Produces a ranked list with scoring rationale for each item and a clear action sequence.
  Use when the user asks about prioritizing a backlog, ranking tasks by impact, deciding which features to build first, or applying a scoring framework to competing priorities.
  Do NOT use for sorting tasks by urgency/importance (use eisenhower-matrix), scheduling tasks into time blocks (use time-blocking), or business strategic prioritization (use business strategy skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "decision-making planning analysis"
  category: "productivity"
  subcategory: "task-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Task Prioritization

## When to Use

**Use this skill when:**
- The user has a backlog of 4 or more tasks, features, or projects and needs a data-driven ranking with explicit scoring rationale
- The user explicitly asks to apply RICE, MoSCoW, ICE, weighted scoring, or another named prioritization framework
- The user is a product manager, engineer, or project lead deciding which features to build first within a sprint or quarterly plan
- The user has competing demands from multiple stakeholders and needs an objective scoring artifact to support a defensible decision
- The user wants to distinguish between items that feel equally urgent but need to be sequenced into a concrete action order
- The user has a partially completed backlog and needs to re-rank remaining items after new information has emerged (completed work, changed constraints, failed assumptions)
- The user is preparing a prioritization document for a team review, sprint planning session, or stakeholder presentation

**Do NOT use when:**
- The user wants to sort a small task list by urgency and importance on a 2x2 grid -- use `eisenhower-matrix` instead
- The user wants to block specific tasks into time slots on their calendar -- use `time-blocking` instead
- The user is choosing between exactly two mutually exclusive options -- use `weighted-decision-matrix` instead
- The user is working on organizational or portfolio-level strategic prioritization that involves budget allocation, OKR setting, or roadmap sequencing across multiple teams -- use the appropriate business strategy skill
- The user wants a daily or weekly action plan without scoring -- use `daily-planning` instead
- The user has only 2-3 items and no stated complexity -- a brief pro/con comparison is more appropriate than a full scoring framework
- The user is trying to estimate relative effort only (story points, t-shirt sizing) without prioritizing -- that is a separate estimation skill

---

## Process

### Step 1: Gather the Item List and Context

Before selecting a method or scoring anything, extract all inputs that will affect scoring validity.

- Collect the **complete list of candidate items** -- anything left off the list cannot be compared, so explicitly ask "Is this the full list, or should I expect more items?"
- Identify the **item type**: feature requests, bug fixes, personal tasks, strategic initiatives, or a mixed backlog. Mixed backlogs require explicit grouping before scoring (bugs vs. features have fundamentally different effort profiles).
- Clarify the **planning horizon**: are these items for the next sprint (1-2 weeks), a quarter (13 weeks), or an annual roadmap? Horizon changes how you define Reach and Effort.
- Ask for **hard constraints**: deadlines that cannot move, dependencies that create forced ordering, regulatory requirements, or contractually committed features.
- Ask for **resource constraints**: is this one person working 20 hours per week, a 3-person team at full capacity, or a 10-engineer team? Effort estimates must be calibrated to available capacity.
- Identify the **goal of this prioritization**: maximize user impact, reduce technical debt, hit a specific launch date, or satisfy a stakeholder. The goal determines which scoring method fits best.
- Note any **existing priority signals** the user has already formed -- these are valuable sanity checks and should inform your confidence estimates, not override the scoring.

### Step 2: Select the Prioritization Method

Do not default to RICE for everything. Match the method to the context with precision.

**Use RICE when:**
- The items are product features or improvements
- There is a measurable user population that items will "reach"
- Effort can be estimated in person-hours or story points
- The user wants a single numerical score for ranking
- Classic RICE threshold: best for backlogs of 5-30 items

**Use ICE (Impact, Confidence, Ease) when:**
- RICE is too heavyweight for the context (personal projects, rapid triage)
- Reach is impossible to estimate (no user data, early-stage product)
- Speed of scoring matters more than precision
- ICE Score = Impact x Confidence x Ease, all rated 1-10
- Best for quick gut-check prioritization or backlogs under 15 items

**Use MoSCoW when:**
- You are negotiating scope with stakeholders for a specific delivery (sprint, release, project)
- The audience is non-technical and needs category labels rather than numbers
- The user needs to communicate "what we are not doing" explicitly to manage expectations
- Warning: MoSCoW does not produce a ranked order within each category -- pair with effort estimates inside each bucket if sequencing matters

**Use Weighted Scoring when:**
- The user has multiple criteria that matter at different levels (e.g., strategic alignment matters 40%, user impact 35%, technical feasibility 25%)
- The items are heterogeneous (mixing bugs, features, and operational work that don't share a natural Reach metric)
- The user is reporting to stakeholders who want to see explicit trade-off reasoning by criterion
- Criteria count: 3 minimum, 6 maximum. More than 6 criteria dilutes discrimination -- items converge to similar scores.

**Default heuristic when the user has no preference:**
- Feature backlog with user data → RICE
- Feature backlog without user data or early stage → ICE
- Scope negotiation for a release → MoSCoW
- Mixed strategic initiatives → Weighted Scoring

### Step 3: Define Scoring Criteria, Scales, and Anchors

Scores are only as reliable as the definitions behind them. Ambiguous criteria produce gaming and disagreement.

**For RICE:**

Define Reach in concrete units tied to the planning horizon:
- Sprint scope (2 weeks): users affected per sprint
- Quarterly: users affected per quarter
- Never leave Reach as "relative" -- assign an actual number or range. If unknown, estimate using: DAU × (% of users who encounter this feature path).

Define Impact with explicit anchors, not just labels:
- 3 = Massive: eliminates a blocker for all users, directly drives conversion or retention by >10%
- 2 = High: significantly improves the core workflow for most users, drives 5-10% metric movement
- 1 = Medium: noticeable improvement but narrow use case or marginal metric impact
- 0.5 = Low: minor convenience improvement, affects a small % of users in a secondary flow
- 0.25 = Minimal: cosmetic or trivial change with no measurable metric impact

Define Confidence as the team's certainty in the Reach and Impact estimates combined:
- 100%: backed by user research, A/B test data, or direct stakeholder confirmation
- 80%: backed by qualitative user feedback or analytics trends
- 50%: based on assumption or intuition without supporting evidence

Define Effort in person-hours (not days, which are ambiguous). Use this calibration guide:
- XS: 1-4 hours (bug fix, copy change, config update)
- S: 5-16 hours (small feature, UI change, minor integration)
- M: 17-40 hours (new screen, moderate integration, feature with edge cases)
- L: 41-80 hours (complex feature, significant architecture change)
- XL: 80+ hours (foundational system change, new product area)

RICE formula: **(Reach × Impact × Confidence) ÷ Effort**

A score of 100+ is strong. Scores below 10 are candidates for deferral. Scores above 500 indicate you may be underestimating effort or overestimating reach.

**For ICE:**

All three dimensions scored 1-10 with anchors:
- Impact 10: Will dramatically change the key metric we care about most
- Impact 5: Meaningful improvement to a secondary metric
- Impact 1: Barely noticeable change
- Confidence 10: Validated by data and prior experiments
- Confidence 5: Some qualitative signal but untested
- Confidence 1: Pure hypothesis with no supporting evidence
- Ease 10: Can be done in a few hours by one person
- Ease 5: One person, one week of work
- Ease 1: Requires significant team coordination or months of work

ICE Score = Impact × Confidence × Ease. Scores range from 1 to 1,000. Top items typically cluster above 300. Items below 50 should be questioned.

**For Weighted Scoring:**

Identify 3-6 criteria. Common frameworks by context:

Product backlog criteria: Strategic alignment, User impact, Technical feasibility, Revenue potential, Risk reduction
Personal productivity criteria: Intrinsic value, External urgency, Skill development, Time investment, Dependencies on others
Technical debt criteria: Risk of incident, Developer velocity impact, Cost of delay, Complexity of fix, User visibility

For each criterion:
- Name it precisely ("Revenue impact in next 90 days" not "revenue")
- Assign a weight (all weights must sum to exactly 100%)
- Define score anchors at 1, 3, and 5 (or 1, 5, and 10 if using a 10-point scale)
- Use a consistent scale -- do not mix 1-5 and 1-10 across criteria

Weighted Score = Σ (score × weight/100) for all criteria. Results will fall between 1.0 and 5.0 (or 1.0 and 10.0).

**For MoSCoW:**

Apply the following decision tests before assigning any category:
- **Must**: "If we ship without this, the deliverable fails its primary objective." Test: would you cancel the release if this was missing?
- **Should**: "This significantly improves value but we could ship without it." Test: would stakeholders be disappointed but not derailed?
- **Could**: "This is desirable and adds polish." Test: would most users not notice if it was absent?
- **Won't**: "We are explicitly saying no for this scope." Test: is there a specific future trigger that would make this a Must?

Warning: Scope creep in MoSCoW always flows from Could to Should to Must. Challenge any item that gets labeled Must -- force the "cancel the release" test.

### Step 4: Score Every Item Systematically

Score all items before comparing any. If you compare items while scoring, anchoring bias will corrupt your estimates.

- Work through each item against each criterion independently
- For RICE: estimate Reach before scoring Impact. Reach grounds your thinking in real user numbers, preventing inflated Impact scores.
- For each score, write a one-sentence justification at the time of scoring (not after). Justifications written post-hoc rationalize rather than explain.
- Flag any item where you are assigning a score with more than 30% uncertainty -- mark it with a ⚠️ and note what information would reduce that uncertainty.
- For MoSCoW, apply every decision test before assigning a category -- do not assign by gut feel.
- Check for **scoring compression**: if all items cluster in a 3-4 point range on any criterion, that criterion is not differentiating. Re-anchor the scale or replace the criterion.

### Step 5: Apply Tie-Breaking and Dependency Adjustments

Raw scores alone are not sufficient to produce an actionable sequence.

**Tie-breaking rules (apply in order):**
1. Lower effort wins (same score with less work = higher ROI per hour)
2. Higher confidence wins (a certain 50 beats a speculative 50)
3. Shorter time-to-value wins (the item that delivers value sooner)

**Dependency adjustments:**
- If Item B is blocked until Item A is complete, and Item A has a lower score, move Item A up in sequence (not in score) and note the dependency explicitly.
- Do not artificially inflate Item A's score -- keep scores pure and handle ordering separately.
- If Item A is a low-score blocker for multiple high-score items, it becomes a de facto Tier 1 sequencing item. Mark it as a "dependency accelerator."
- Hard deadline items: if an item has a contractual or regulatory deadline, flag it separately as a constrained item. Do not let deadline pressure inflate its RICE/ICE score -- keep scores honest and surface deadlines as a constraint overlay.

**Effort-to-value consideration:**
- After ranking, scan for any low-scored item with unusually low effort (under 4 hours). These "quick wins" may warrant inclusion even if they rank below the cut, because their cost of inclusion is negligible. Flag them explicitly.

### Step 6: Produce the Ranked List with Tier Groupings

Group items into tiers based on natural score breaks, not arbitrary percentiles.

- Look for **score gaps** of 30% or more between adjacent items -- these are natural tier boundaries.
- If no natural gaps exist, force three tiers: top third, middle third, bottom third. Note that the lack of gaps means the items are closely competitive and the ranking is sensitive to assumption changes.
- Tier labels should reflect action, not just ranking:
  - Tier 1: Act now (current sprint or next 2 weeks)
  - Tier 2: Plan for next cycle (next sprint or 4-6 weeks out)
  - Tier 3: Defer or deprioritize (beyond 6 weeks or to be revisited)
  - Tier 4 (for large backlogs): Archive -- explicitly removed from active consideration until a trigger event

### Step 7: Build the Action Sequence and Identify Revisit Triggers

The ranked list answers "what is most important." The action sequence answers "what do we do first."

- Sequence Tier 1 items by: dependency order, then effort (short-effort items first within a tier to generate early momentum and validate assumptions before committing to high-effort items)
- Assign a start timing (this week, next sprint, Week 3) rather than calendar dates unless the user has provided them
- For each Tier 2 and Tier 3 item, define a **revisit trigger** -- the specific event or date that should cause this item to be re-evaluated. Revisit triggers prevent perpetual deferral.
- Note the total estimated effort for Tier 1 and compare it against available capacity. If Tier 1 effort exceeds 70% of available capacity in the planning horizon, flag the overcommit and recommend trimming to 60% to preserve buffer for unplanned work.
- Identify the **first deliverable** -- the single item that, when completed, will validate the most important assumption underlying this prioritization. Highlight it explicitly.

### Step 8: Deliver the Prioritization Document

Produce the complete output in the format below. Never deliver a partial output -- a ranking without rationale is not useful and is indistinguishable from a gut-feel list.

- Lead with a one-paragraph summary of the prioritization rationale before the tables -- this is what stakeholders read first
- Include all scored items, including deprioritized ones (silent removal is a failure mode)
- State the method used and why
- If you made any assumptions to fill scoring gaps, list them explicitly in an Assumptions section

---

## Output Format

```
## Prioritized [Task / Feature / Project] List

### Summary
[2-4 sentences explaining: which method was chosen and why, what the top priority is, 
and the key trade-off or insight this prioritization reveals. Written for a non-technical 
reader.]

---

### Method: [RICE / ICE / MoSCoW / Weighted Scoring]
### Planning Horizon: [e.g., Current sprint (2 weeks) / Q3 2024 / Next 90 days]
### Available Capacity: [e.g., 1 person × 20 hrs/week = 40 hrs per sprint]

---

### Scoring Criteria

[FOR RICE:]
| Criterion   | Definition for This Context               | Scale              |
|-------------|-------------------------------------------|--------------------|
| Reach       | [specific unit, e.g., registered users/mo] | Estimated number  |
| Impact      | [what outcome this measures]              | 0.25 / 0.5 / 1 / 2 / 3 |
| Confidence  | [certainty in Reach + Impact estimates]   | 50% / 80% / 100%  |
| Effort      | [person-hours of development work]        | Hours              |

Formula: RICE Score = (Reach × Impact × Confidence) ÷ Effort

[FOR ICE:]
| Criterion   | Definition for This Context               | Scale |
|-------------|-------------------------------------------|-------|
| Impact      | [what specific outcome is measured]       | 1-10  |
| Confidence  | [evidence level for impact estimate]      | 1-10  |
| Ease        | [inverse of effort; 10 = trivial]         | 1-10  |

Formula: ICE Score = Impact × Confidence × Ease (max 1,000)

[FOR WEIGHTED SCORING:]
| Criterion              | Weight | Score Anchor (1)      | Score Anchor (3)      | Score Anchor (5)      |
|------------------------|--------|-----------------------|-----------------------|-----------------------|
| [Criterion 1]          | [X]%   | [what a 1 looks like] | [what a 3 looks like] | [what a 5 looks like] |
| [Criterion 2]          | [X]%   | [what a 1 looks like] | [what a 3 looks like] | [what a 5 looks like] |
| [Criterion 3]          | [X]%   | [what a 1 looks like] | [what a 3 looks like] | [what a 5 looks like] |
| **Total**              | **100%** |                     |                       |                       |

[FOR MOSCOW:]
| Category     | Definition Applied                                                      |
|--------------|-------------------------------------------------------------------------|
| Must-have    | Release fails primary objective without this                            |
| Should-have  | Significant value; stakeholders disappointed but not blocked            |
| Could-have   | Desirable polish; most users unaffected if absent                       |
| Won't-have   | Explicitly out of scope; trigger for future consideration documented    |

---

### Scored Items

[FOR RICE / ICE:]
| Rank | Item               | Reach | Impact | Conf. | Effort (hrs) | Score  | Notes / ⚠️ Flags |
|------|--------------------|-------|--------|-------|-------------|--------|-----------------|
| 1    | [Item name]        | [#]   | [#]    | [%]   | [hrs]       | [###.#] | [rationale]    |
| 2    | [Item name]        | [#]   | [#]    | [%]   | [hrs]       | [###.#] | [rationale]    |
| ...  |                    |       |        |       |             |         |                |

[FOR WEIGHTED SCORING:]
| Rank | Item           | [Criterion 1] (×[W]%) | [Criterion 2] (×[W]%) | [Criterion 3] (×[W]%) | Weighted Score | Notes |
|------|----------------|----------------------|----------------------|----------------------|----------------|-------|
| 1    | [Item name]    | [raw score]          | [raw score]          | [raw score]          | [X.X / 5.0]   | [rationale] |

[FOR MOSCOW:]
| Category     | Item           | Effort Est. | Sequencing Note                          |
|--------------|----------------|-------------|------------------------------------------|
| Must-have    | [Item name]    | [hrs]       | [first / second / third within Must tier] |
| Must-have    | [Item name]    | [hrs]       |                                          |
| Should-have  | [Item name]    | [hrs]       |                                          |
| Could-have   | [Item name]    | [hrs]       |                                          |
| Won't-have   | [Item name]    | --          | [trigger that would re-open this]        |

---

### Assumptions
| Assumption                             | Affects               | If Wrong, Rescore?   |
|----------------------------------------|-----------------------|----------------------|
| [e.g., "500 users/mo reach estimate"]  | [Item X -- Reach]     | Yes -- would drop to Rank 4 |
| [another assumption]                   | [item + criterion]    | [impact if wrong]    |

---

### Tier Groupings

| Tier   | Label          | Score Range     | Items                              | Rationale for Tier Boundary        |
|--------|----------------|-----------------|------------------------------------|------------------------------------|
| Tier 1 | Act Now        | [score] and above | [item, item]                    | [natural gap or top X% of scores]  |
| Tier 2 | Plan Next Cycle | [score range]  | [item, item]                       | [score gap or capacity boundary]   |
| Tier 3 | Defer          | [score] and below | [item, item]                    | [below meaningful ROI threshold]   |

---

### Action Sequence

**Capacity check:** Tier 1 total effort = [X hrs] vs. available capacity = [Y hrs]. [Status: fits / overcommit by Z hrs]

| Order | Item                | Tier | Start       | Effort | Dependencies    | First Deliverable? |
|-------|---------------------|------|-------------|--------|-----------------|-------------------|
| 1     | [Item name]         | 1    | [This week] | [hrs]  | [None]          | ✅ Yes            |
| 2     | [Item name]         | 1    | [Week 2]    | [hrs]  | [Item 1]        | No                |
| 3     | [Item name]         | 2    | [Week 3]    | [hrs]  | [None]          | No                |

---

### Deprioritized Items

| Item           | Score  | Reason                              | Revisit Trigger                          |
|----------------|--------|-------------------------------------|------------------------------------------|
| [Item name]    | [#]    | [specific reason, not just "low score"] | [event or date that reopens this]    |

---

### Quick Wins (if applicable)
Items with a score below Tier 1 but with ≤4 hours of effort. These may be worth including 
alongside Tier 1 work at negligible cost:
| Item           | Score | Effort | Recommendation                              |
|----------------|-------|--------|---------------------------------------------|
| [Item name]    | [#]   | [hrs]  | [Include / Exclude -- rationale]            |
```

---

## Rules

1. **Never produce a ranking without scores.** A list labeled "priorities" without explicit scoring is indistinguishable from a gut-feel guess. Every output must include the scoring table, criteria definitions, and per-item rationale -- even for short lists.

2. **Commit to one method per prioritization session.** Do not blend RICE and MoSCoW, or apply ICE to some items and weighted scoring to others. If the user's backlog seems to demand multiple methods (e.g., bugs vs. features), segment the backlog into separate lists and apply one method per segment before merging into a unified sequence.

3. **Define score anchors before scoring any item.** Writing anchor definitions after scoring locks in post-hoc rationalization. The definition of Impact = 3 must be stated before you score Item 1.

4. **RICE scores must use the exact formula: (Reach × Impact × Confidence) ÷ Effort.** Confidence must be expressed as a decimal (100% = 1.0, 80% = 0.8, 50% = 0.5). A RICE score is unitless -- do not label it as "points" or attach any unit label.

5. **Weighted scoring weights must sum to exactly 100%.** If the user proposes weights that do not sum to 100%, normalize them proportionally and state the adjustment explicitly. Never silently renormalize.

6. **Flag every assumption that contributes more than 20% to any item's score.** Unvalidated assumptions are the primary failure mode of prioritization frameworks. An item that scores #1 based on an unvalidated Reach estimate of 10,000 users should carry a prominent ⚠️ flag and a note that its rank is assumption-dependent.

7. **Handle dependencies in the action sequence, not the score.** Do not inflate a blocker item's RICE score to force it higher. Keep scores pure. Surface dependency ordering in the Action Sequence table only. This preserves score integrity and makes the dependency visible as a distinct constraint.

8. **Apply the capacity check before finalizing the action sequence.** If Tier 1 effort exceeds available capacity by more than 10%, trim the action sequence to 60% of available capacity and move the trimmed items to Tier 2. State the capacity constraint explicitly -- do not silently omit items.

9. **Tie-break by effort, then confidence, then time-to-value -- in that order.** Never break ties by gut feel or stakeholder preference without documenting it. If stakeholder preference overrides the tie-break, note it as "Stakeholder override: [reason]."

10. **Every deprioritized item must have a specific revisit trigger, not a vague date.** "Revisit in Q4" is not acceptable. "Revisit when API consumer count exceeds 10 external users" is. Vague revisit dates ensure items are never actually revisited.

11. **Avoid MoSCoW inflation.** In any MoSCoW output, the Must-have category should contain no more than 40% of total items by count. If more than 40% of items are labeled Must, challenge each one with the "cancel the release" test and demote those that fail. An output where 70% of items are Must-have has failed the MoSCoW process.

12. **Surface the first deliverable explicitly.** In every action sequence, identify one item -- the first to be completed -- and label it as the validation milestone. The completion of this item should inform whether to continue with the current prioritization or re-evaluate.

---

## Edge Cases

### 1. Mixed backlog (bugs, features, operational tasks, and technical debt in one list)

Scoring bugs against features with RICE produces distorted results because bugs have a known population (affected users) while features have a hypothetical one. Handle this in two passes:
- **Pass 1**: Separate the backlog into segments: Bugs, Features, Operational/Infra, and Technical Debt.
- **Pass 2**: Score each segment independently using the same method and criteria.
- **Pass 3**: Merge the ranked lists by selecting alternating items from each segment's Tier 1, weighted by the urgency of each segment type (bugs typically get 1.5x weight in the merge because they represent degraded current state, not future opportunity).
- Present the final merged sequence clearly, noting that items from different segments are not directly comparable on score alone.

### 2. Stakeholder insists on overriding the scored ranking

This is one of the most common real-world failure modes. Handle it as follows:
- Do not silently reorder the list to match the stakeholder preference.
- Present the scored ranking first, then add an "Override Scenario" section showing what the ranking would look like if the stakeholder's preferred item were moved to #1.
- Calculate the opportunity cost: "Moving [Item X] to #1 delays [Item Y, current #1] by [Z weeks]. The score difference implies [Item Y] is estimated to deliver [N × more value] per hour of effort."
- This makes the override visible as a deliberate choice with explicit trade-offs rather than a silent corruption of the process.

### 3. Scoring paralysis -- user cannot estimate Reach or Impact

Early-stage products and personal projects frequently cannot produce reliable Reach estimates. Escalation path:
- Switch from RICE to ICE immediately. ICE eliminates Reach and is designed for low-data environments.
- If the user cannot estimate Impact either, run a **forced ranking** pass first: present pairs of items and ask "Which has more impact?" Collect 6-10 pairwise judgments and derive a rough Impact rank order. Use this rank order (converted to a 1-5 scale) as your Impact scores.
- Document the method switch and the reason. Never proceed with fabricated Reach numbers to make RICE work -- garbage inputs produce garbage rankings with false confidence.

### 4. Items with hard external deadlines that disrupt the scored ranking

A regulatory compliance item may score low on RICE (narrow reach, low impact on the core product) but carry a legal deadline that makes it non-negotiable. Handle it as follows:
- Score it honestly against the chosen method. Do not inflate the score.
- Add a **Constrained Items** section separate from the scored ranking, listing deadline-driven items with their deadline, the consequence of missing it, and their required start date.
- Compute required start date as: deadline minus estimated effort minus a 20% buffer. If required start date is within the current planning horizon, it enters the action sequence as a constraint, not a priority.
- Communicate clearly: "This item ranks #6 by RICE score but must begin by [date] due to [reason]. It is sequenced as item #2 in the action sequence accordingly."

### 5. The user wants to reprioritize after completing some items

Do not rescore completed items -- that history is informative but not actionable.
- Remove completed items from the scoring table.
- Re-examine Confidence scores for remaining items. Completed items may have revealed new information (e.g., the auth system was harder than estimated, suggesting that other auth-adjacent items should have their Effort scores increased).
- Check whether any deprioritized items have had their revisit trigger met. A change in circumstances may have promoted a Tier 3 item.
- Explicitly note which scores changed and why: "Item X Confidence updated from 80% to 50% after discovering that the backend dependency is more complex than estimated."
- Rerun the full scoring pass on remaining items. Partial updates without full rescoring introduce inconsistency.

### 6. Large backlogs (30+ items)

Scoring 30+ items individually with full RICE creates analysis paralysis and takes too long to be useful.
- Apply a **two-stage triage**: First, bin all items into three rough buckets (High / Medium / Low) using a rapid 60-second gut-check rule -- do not agonize.
- Score only the High and Medium buckets with full RICE or weighted scoring (typically 10-20 items).
- Park the Low bucket in a "not this cycle" list with no further scoring.
- This reduces cognitive load without sacrificing ranking quality, since Low items will not enter the action sequence regardless of their exact score.

### 7. All items produce very similar scores (scoring compression)

When the top 5 items all score within 10% of each other, the framework is not differentiating effectively.
- Check for **impact inflation**: if every item received Impact = 2 or 3, the scale is being used incorrectly. Force one item to be Impact = 3 and recalibrate all others relative to it.
- Add a **tiebreaker criterion**: for feature backlogs, add "Strategic alignment" or "Customer-requested count" as a secondary sort. For personal tasks, add "Intrinsic motivation" or "Deadline proximity."
- If compression persists after recalibration, run a **dot-voting** or **forced ranking** round: ask the user to assign 10 votes across all tied items (can put multiple votes on one item). Use vote counts as a final tiebreaker. Document this as an override of the scored ranking.

### 8. User has resource constraints mid-list (e.g., an engineer going on leave)

Resource constraints that change mid-sequence invalidate action sequence assumptions even if the scoring is correct.
- Add a **Resource Constraint Overlay** section to the output, listing constraints by name, duration, and impact.
- Recompute available capacity for each time period in the action sequence separately (e.g., "Weeks 1-2: 40 hours. Weeks 3-4: 20 hours due to engineering leave.").
- Adjust the action sequence to front-load high-effort items into high-capacity periods.
- Do not change the prioritization scores -- only the sequencing changes.

---

## Example

**Input:** "I'm a solo founder building a B2B SaaS tool for freelance project managers. I have 6 weeks of solo development time (about 25 hours per week = 150 hours total). My backlog has 8 items: build team collaboration features, set up Stripe billing, fix the date picker bug on the project creation screen, write a help center with documentation, add CSV export for project data, build an email notification system, create an admin dashboard for managing users, and add SSO/SAML login. I want to know what to build first. I have about 200 registered users and 40 paying customers on a monthly plan."

---

**Output:**

## Prioritized Feature Backlog

### Summary
Using RICE scoring calibrated to a 6-week development horizon with 40 paying customers and 200 registered users. The top priority is fixing the date picker bug -- it affects every user's core workflow and takes less than a day to fix, producing the highest ROI per hour in the entire backlog. Stripe billing is the second priority because it directly enables revenue growth and is currently a conversion bottleneck. The critical trade-off this prioritization reveals: SSO/SAML and team collaboration are high in perceived importance but score low because they require the most effort while serving the smallest portion of the current user base at this stage.

---

### Method: RICE Scoring
### Planning Horizon: 6 weeks (150 hours available)
### Available Capacity: 1 person × 25 hrs/week = 150 hours total

---

### Scoring Criteria

| Criterion   | Definition for This Context                                           | Scale              |
|-------------|-----------------------------------------------------------------------|--------------------|
| Reach       | Number of registered users (or paying customers) affected per 6 weeks | Estimated count    |
| Impact      | Effect on core business outcome: conversion, retention, or activation | 0.25 / 0.5 / 1 / 2 / 3 |
| Confidence  | Evidence level for Reach and Impact estimates                         | 50% / 80% / 100%  |
| Effort      | Solo developer hours to implement, test, and deploy                   | Person-hours       |

**Impact anchor definitions (calibrated to this product):**
- 3 = Massive: Directly impacts paying customer activation or prevents churn. Core workflow.
- 2 = High: Meaningfully improves conversion from free to paid, or reduces a significant friction point for majority of users.
- 1 = Medium: Adds clear value for a meaningful segment; secondary to core workflow.
- 0.5 = Low: Nice-to-have; small audience or marginal improvement to an existing flow.
- 0.25 = Minimal: Cosmetic or niche improvement with no measurable business impact.

Formula: RICE Score = (Reach × Impact × Confidence) ÷ Effort

---

### Scored Items

| Rank | Item                      | Reach | Impact | Conf.  | Effort (hrs) | RICE Score | Notes                                                      |
|------|---------------------------|-------|--------|--------|-------------|------------|------------------------------------------------------------|
| 1    | Fix date picker bug        | 200   | 3      | 1.00   | 6           | **100.0**  | Every user hits this on project creation. Fix is scoped and known. |
| 2    | Set up Stripe billing      | 40    | 3      | 0.80   | 20          | **48.0**   | Without billing, growth is capped. Affects all 40 paying customers + future conversions. ⚠️ Assumes Stripe integration is straightforward -- may uncover edge cases. |
| 3    | Email notification system  | 200   | 2      | 0.80   | 24          | **13.3**   | Affects all users; drives re-engagement and task follow-through. Medium-high confidence based on typical SaaS retention patterns. |
| 4    | CSV export                 | 80    | 1      | 0.80   | 12          | **5.3**    | Estimated 40% of users (data-heavy PMs) need this. Low effort, clear scope. |
| 5    | Help center / docs         | 200   | 0.5    | 0.80   | 16          | **5.0**    | Reduces support load; doesn't change core product capability. Broad reach but low per-user impact. |
| 6    | Admin dashboard            | 1     | 2      | 0.80   | 20          | **0.08**   | Only the founder uses this. Very low reach makes RICE score collapse despite high per-user value. ⚠️ Consider if this unlocks other work. |
| 7    | Team collaboration         | 30    | 2      | 0.50   | 60          | **0.50**   | Potential market expander but unvalidated with current users. High effort, low confidence. ⚠️ Assumption: 15% of users need team features -- not validated. |
| 8    | SSO/SAML login             | 5     | 2      | 0.50   | 40          | **0.13**   | Only relevant to enterprise prospects; no current enterprise customers confirmed. ⚠️ Do not build for a customer you don't have yet. |

---

### Assumptions

| Assumption                                              | Affects                   | If Wrong, Impact                                               |
|---------------------------------------------------------|---------------------------|----------------------------------------------------------------|
| Date picker affects all 200 users on project creation  | Row 1 -- Reach = 200       | If only 50% trigger it, score drops to 50.0 -- still Rank 1   |
| Stripe billing is the primary conversion blocker        | Row 2 -- Impact = 3        | If billing is already working partially, score drops; still Tier 1 |
| ~40% of users (80) would use CSV export                | Row 4 -- Reach = 80        | If only 20 users need it, score drops to 1.7 -- drops to Tier 3 |
| Team collaboration has low adoption confidence          | Row 7 -- Confidence = 0.5  | If validated by user interviews, score triples to 1.5 -- still Tier 3 |

---

### Tier Groupings

| Tier   | Label           | Score Range      | Items                                       | Rationale for Tier Boundary                           |
|--------|-----------------|------------------|---------------------------------------------|-------------------------------------------------------|
| Tier 1 | Act Now         | 48.0 and above   | Date picker bug, Stripe billing             | Score gap of 35 points between Rank 2 and Rank 3      |
| Tier 2 | Plan Next Cycle | 5.0 -- 13.3      | Email notifications, CSV export, Help docs  | Clustered scores; all viable but none urgent          |
| Tier 3 | Defer           | Below 1.0        | Admin dashboard, Team collaboration, SSO    | Admin: reach too low. Team + SSO: effort too high vs. validated demand |

---

### Action Sequence

**Capacity check:** Tier 1 total effort = 26 hours vs. available capacity = 150 hours. ✅ Tier 1 fits easily. Proceeding to include Tier 2 items in sequence to fill remaining capacity.

| Order | Item                     | Tier | Start    | Effort  | Dependencies         | First Deliverable? |
|-------|--------------------------|------|----------|---------|----------------------|--------------------|
| 1     | Fix date picker bug       | 1    | Week 1   | 6 hrs   | None                 | ✅ Yes -- validates deployment pipeline |
| 2     | Set up Stripe billing     | 1    | Week 1   | 20 hrs  | None (parallel to #1) | No                |
| 3     | Email notification system | 2    | Week 2-3 | 24 hrs  | Stripe billing (#2) for payment event triggers | No |
| 4     | CSV export                | 2    | Week 3-4 | 12 hrs  | None                 | No                 |
| 5     | Help center / docs        | 2    | Week 4-5 | 16 hrs  | None                 | No                 |
| --    | Admin dashboard           | 3    | Deferred | 20 hrs  | --                   | --                 |
| --    | Team collaboration        | 3    | Deferred | 60 hrs  | --                   | --                 |
| --    | SSO/SAML login            | 3    | Deferred | 40 hrs  | --                   | --                 |

**Total scheduled effort (items 1-5): 78 hours out of 150 available.**
This leaves 72 hours of buffer for unplanned work, bug fixes discovered during development, and scope expansion on Stripe billing if edge cases arise. Do not backfill this buffer with Tier 3 items until Tier 1 and 2 are complete and validated.

---

### Deprioritized Items

| Item                 | Score  | Reason                                                                 | Revisit Trigger                                                |
|----------------------|--------|------------------------------------------------------------------------|----------------------------------------------------------------|
| Admin dashboard      | 0.08   | Reach = 1 (founder only). High effort for zero user-facing value. Internal tooling can wait. | When you have a second admin or customer success hire         |
| Team collaboration   | 0.50   | High effort (60 hrs = 40% of total capacity). Demand is unvalidated -- no current users have explicitly requested this. | After 5+ paying customers request it in support tickets or interviews |
| SSO/SAML login       | 0.13   | Enterprise-only feature with no confirmed enterprise pipeline. Building for a hypothetical customer is a classic early-stage trap. | When a specific enterprise prospect makes it a deal-breaker in a sales call |

---

### Quick Wins

Items outside Tier 1 with ≤4 hours of effort: None identified in this backlog. CSV export at 12 hours is the lowest-effort Tier 2 item. All other items exceed the 4-hour quick win threshold.

---

**Prioritization summary for the 6-week horizon:**

The single most important insight from this scoring is the SSO/SAML item. It is frequently the item that solo B2B founders consider "strategically important" and over-index on. Its RICE score of 0.13 -- 770 times lower than the date picker bug -- quantifies exactly why building enterprise features without enterprise customers is a resource trap. The date picker bug, by contrast, is the kind of task that founders routinely skip because it feels like maintenance rather than product work. The RICE score corrects this intuition: it is the highest ROI task in the entire backlog.
