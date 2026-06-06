---
name: prioritization-framework
description: |
  Applies RICE or MoSCoW prioritization frameworks to score and rank a feature list with documented assumptions and stakeholder-ready output. Use when the user asks about feature prioritization, RICE scoring, MoSCoW prioritization, backlog ranking, or deciding what to build next.
  Do NOT use for product roadmap creation (use product-roadmap), user story writing (use user-story-writing), or strategic planning (use strategic-roadmap).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis planning strategy decision-making agile"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Prioritization Framework

## When to Use

**Use this skill when:**
- A user has a list of features, initiatives, or backlog items and needs a defensible, structured ranking with documented rationale
- A user explicitly asks to apply RICE scoring, MoSCoW prioritization, or any comparable scoring methodology to their backlog
- A user needs to present a prioritization decision to stakeholders (executives, investors, engineering leads) and needs transparent, reproducible reasoning
- A user is debating what to build next quarter and wants to move from gut-feel decisions to data-informed ranking
- A user's team has too many competing priorities and needs a shared framework to resolve disagreements without politics determining the outcome
- A user needs to justify deferring a feature -- especially one requested by a senior stakeholder or key customer -- with documented logic
- A user wants to check whether their existing backlog ranking makes sense or is silently biased toward the loudest voice in the room

**Do NOT use this skill when:**
- The user needs to translate prioritized items into a visual roadmap with timelines, themes, and milestones -- use `product-roadmap` instead
- The user wants to write acceptance criteria or user stories for features that have already been prioritized -- use `user-story-writing`
- The user is working at the strategic level of choosing which markets or product lines to invest in -- use `strategic-roadmap`
- The user wants to design an experiment to validate a feature hypothesis before committing to build it -- use `ab-test-design`
- The user is conducting a competitive analysis to identify which features to build relative to competitors -- use `competitive-analysis`
- The user needs OKR or goal-setting work upstream of prioritization -- use `okr-framework`

---

## Process

### Step 1: Gather the Prioritization Context

Before scoring a single item, collect the inputs that govern every scoring decision. Applying a framework to incomplete context produces scores that feel precise but are misleading.

- **Collect the candidate list:** Get every feature, initiative, or backlog item to be evaluated. If the user gives you a partial list, ask whether there are items intentionally omitted (sometimes high-priority items are skipped because they feel obvious -- they still need scores).
- **Establish team capacity:** Ask for the number of engineers (or other relevant contributors), sprint length or quarterly planning period, and historical velocity. A team of 4 engineers working 2-week sprints over a quarter has approximately 24 person-sprints -- but realistically 18-20 after ceremonies, on-call, and unplanned work. Use 75-80% of raw capacity as the working budget.
- **Identify the primary business goal for the period:** Is the company optimizing for new user acquisition, revenue expansion in existing accounts, retention/churn reduction, platform stability, or regulatory compliance? The business goal determines which metrics Reach and Impact should be denominated in.
- **Ask what data exists:** Support ticket volume, feature request count, NPS verbatim themes, usage analytics, sales win/loss reasons, user interviews, and revenue data (ARR at risk, expansion opportunity) are all legitimate inputs. Gut feel is also an input but must be flagged as low-confidence.
- **Identify constraints and non-negotiables:** Regulatory deadlines, contractual commitments, infrastructure dependencies, and platform limitations override scoring. Identify these first so they do not pollute the scoring of discretionary work.
- **Understand the stakeholder audience:** Who will receive this prioritization? Engineering leads care about effort accuracy and technical debt. Executives care about revenue and retention impact. Customers care about specific pain resolution. Tailor the output depth to the audience.

---

### Step 2: Choose the Right Framework for the Context

RICE and MoSCoW are not interchangeable. Each has a specific context where it performs best. Choosing the wrong framework for the situation is a common mistake that undermines credibility.

**Use RICE when:**
- The team has access to quantitative data (even rough estimates) for reach and impact
- The goal is relative ranking across a long list (5+ items)
- The audience values data-driven justification over simplicity
- The team is mature enough to have honest conversations about confidence levels without gaming the scores
- The prioritization period is quarterly planning or longer

**Use MoSCoW when:**
- The scope of a specific release or sprint is being negotiated, not a relative ranking
- Stakeholder alignment is the primary goal -- MoSCoW's categorical language is easier for non-technical stakeholders to debate
- The team is working under a fixed deadline (release date, event, go-live) where the question is "what fits" rather than "what ranks highest"
- The backlog is small (under 10 items) and a full scoring exercise would be disproportionate overhead
- The primary driver is scope negotiation rather than discovery of what is most valuable

**Use RICE + MoSCoW together when:**
- RICE is used to rank discretionary work within each MoSCoW category
- The Must items are known (compliance, contractual) but the Should and Could items need relative ranking
- A large team (multiple squads) uses MoSCoW for release-level alignment and RICE for squad-level backlog ranking

**When neither fits cleanly:** The ICE framework (Impact, Confidence, Ease -- a simplified RICE without Reach) is useful when Reach is uniform across items (all features affect all users) or when speed of scoring matters more than precision. ICE Score = Impact x Confidence x Ease, where Ease is the inverse of Effort on a 1-10 scale.

---

### Step 3: Score Each Item -- RICE in Detail

The RICE formula is: **(Reach × Impact × Confidence) ÷ Effort**

Higher scores indicate higher priority. Scores are only meaningful relative to each other within the same scoring session -- never compare RICE scores across different teams or products.

**Reach:**
- Define the unit of Reach before scoring: it could be users/month, sessions/week, accounts affected, or support tickets resolved per quarter. Consistency matters more than precision.
- Use a specific time window -- 30 days or one quarter is standard. Do not mix time windows across items.
- Reach should reflect the users who will actually use the feature, not total users. A power-user feature might reach 200 of 10,000 users. Score it as 200.
- For revenue-impacting features, Reach can be denominated in dollars (ARR opportunity or ARR at risk). This makes sales-driven features comparable to product-experience features.
- Acceptable data sources for Reach: product analytics (most reliable), survey data with sample size > 50 (medium reliability), sales or CS team anecdotal reports (low reliability, flag confidence accordingly).

**Impact:**
- The standard scale is: Massive = 3, High = 2, Medium = 1, Low = 0.5, Minimal = 0.25. Do not deviate from this scale unless you explain the deviation explicitly.
- Impact measures the change in the target metric per user affected -- not total impact. Total impact is captured by multiplying Reach by Impact.
- Impact inflation is the most common failure mode in RICE scoring. Most features are Medium (1) or Low (0.5). Reserve Massive (3) for features that fundamentally change user behavior, drive direct conversion or retention, or resolve a blocker causing active churn. If more than 20% of items on a list are scored Massive, the scoring is inflated.
- Impact should be tied to the stated business goal. If the goal is churn reduction, Impact = the expected reduction in churn probability for the affected users. If the goal is activation, Impact = the expected improvement in activation rate.

**Confidence:**
- Standard scale: 100% = validated with data or research, 80% = analytics data or multiple corroborating signals, 50% = hypothesis or gut feel, 30% = speculation.
- Confidence is a multiplier on both Reach AND Impact -- low confidence deflates the entire score, which is the correct behavior. A high-impact, high-reach item with 30% confidence scores lower than a medium-impact item with 100% confidence.
- The Confidence score must reflect the weakest link. If Reach is validated but Impact is a guess, Confidence = 50%.
- Never use 100% confidence on a feature that has not been validated through user research, A/B testing, or direct customer commitment (e.g., a signed contract that references the feature).

**Effort:**
- Effort is measured in person-months or person-sprints. Standardize before scoring.
- Effort estimates should come from the engineering team whenever possible. In their absence, use reference class forecasting: compare to a similar feature that was previously built and scale accordingly.
- Include all effort types: design, engineering, QA, data work, documentation, and deployment. Product managers routinely undercount by 30-40% by omitting design and QA.
- Effort is the denominator -- it has enormous leverage. A feature that takes 0.5 person-months scores 4x higher than an identical feature at 2 person-months, all else equal. This is the mathematical basis for the "quick wins" insight: low-effort, moderate-impact items often outrank high-effort, high-impact items.

---

### Step 4: Apply MoSCoW Classification Rigorously

MoSCoW categorization fails in practice because teams lack the discipline to apply the definitions strictly. Use these decision rules:

**Must Have:**
- The test: "If we remove this from the release, can we still ship something valuable to users?" If yes, it is not a Must.
- Secondary test: "Are there legal, contractual, or safety consequences of shipping without this?" If yes, it is a Must.
- Must items represent the Minimum Viable Release (MVR). Everything in this category should be buildable within 60% of team capacity. If Must items exceed 60% of capacity, the scope is over-committed and something must be reclassified -- this is a scope negotiation, not a prioritization failure.
- Common Must inflation: teams classify items as Must because they are emotionally invested in them, not because they truly meet the test. Push back on every Must with the removal test.

**Should Have:**
- Should items add significant value and are expected by users, but the release functions without them.
- A Should item that cannot be completed due to time constraints should be the first thing added to the next release, not dropped entirely.
- The Should category typically represents 20-30% of capacity in a well-scoped release.

**Could Have:**
- These are desirable, often low-effort items that improve the experience. They are the first to be cut when estimates grow.
- A Could item should be quick to build or quick to defer -- if it is high-effort, question whether it belongs in this release at all.
- Could items can be powerful morale and momentum items for the team if capacity permits.

**Won't Have (This Time):**
- "Won't" is not "Never." It is explicitly deferred with a documented reason: out of scope for this release, insufficient data, dependency not ready, or strategic decision to defer.
- Every stakeholder request that does not make it into Must/Should/Could must appear in Won't with a rationale. This is the transparency mechanism that prevents stakeholders from feeling ignored.
- Won't items should be reviewed at the next planning cycle. Some will naturally move into Must or Should as context changes.

---

### Step 5: Rank, Sort, and Identify Judgment Calls

After scoring, the ranking itself is straightforward, but several analysis steps add significant value:

- **Sort RICE by score descending.** The top N items that fit within capacity form the recommended set.
- **Identify score clusters.** Items within 10% of each other have effectively the same score given the imprecision of the inputs. These are genuine judgment calls. Flag them as a cluster and note that ranking within the cluster should incorporate strategic or qualitative factors.
- **Identify ranking surprises.** Calculate what the user or stakeholders expected versus what the framework produced. A dashboard redesign that "felt important" but scored 12th on RICE is a signal -- either the score is wrong (revisit assumptions) or the intuition is wrong (explore why it felt important). This tension is the most valuable output of the exercise.
- **Check for dependency chains.** A low-scoring item may be a prerequisite for a high-scoring item. If Feature A scores 800 and Feature B scores 400, but B must be built before A, the effective combined score is different. Dependency unlocks should be noted and factored into sequencing.
- **Apply the "last place test":** Does the last-ranked item deserve to exist on the list at all? Sometimes the scoring exercise reveals items that should be killed entirely rather than deferred. An item with RICE < 50 that requires 3 person-months is a candidate for removal from the backlog.

---

### Step 6: Document Assumptions and Sensitivity Analysis

The scoring rationale is the most valuable artifact of the prioritization process. Without it, the scores are a black box that stakeholders will not trust or remember.

- **For each scored item, document:** the source of the Reach estimate, why that Impact level was chosen (not a higher one), what evidence drove the Confidence score, and how the Effort estimate was derived.
- **Flag the key assumption:** For every item, identify the single assumption that, if wrong, would most change the score. "If email open rates are 15% rather than 30%, the RICE score drops from 240 to 120 and this item falls from rank 2 to rank 5."
- **Run a simple sensitivity check on top-ranked items:** What happens to the rank if Impact drops by one level? What if Effort doubles (which is common in practice)? Items that remain in the top tier even under pessimistic assumptions are robust choices. Items that fall sharply under one changed assumption are high-risk picks.
- **Present confidence intervals informally:** Instead of a single RICE score of 240, note that it could reasonably range from 120 to 480 depending on which assumptions hold. This prevents false precision.

---

### Step 7: Build the Final Recommendation and Capacity Check

The recommendation is the action layer that transforms a scored list into a plan.

- **State what to build this period** with the RICE rank or MoSCoW category, the effort estimate, and the primary justification.
- **State what to defer** with the reason: effort exceeds remaining capacity, insufficient data to score accurately, dependency not ready, or strategic decision to sequence later.
- **Flag items that need discovery** before they can be scored: any item with Confidence ≤ 50% on both Reach and Impact is not ready to prioritize -- it is ready to research. Assigning it a score creates false confidence in a bad estimate.
- **Run the capacity check:** Sum the effort for all recommended items. Compare to team capacity (raw capacity × 0.75 to account for meetings, bugs, support, and unplanned work). If the recommended set exceeds capacity, identify which item gets cut. Do not recommend work that exceeds capacity and call it a plan.
- **Communicate the buffer:** Explicitly state how much capacity remains after committed items. Stakeholders who understand the buffer are less likely to demand additions. "We have 2 person-months of buffer for unplanned work, bugs, and on-call" is a more compelling statement than "we're at capacity."

---

## Output Format

```
## Prioritization: [Product/Team Name] -- [Quarter or Release Name]

**Framework:** [RICE / MoSCoW / RICE + MoSCoW]
**Period:** [Start date] to [End date]
**Team capacity (raw):** [X] person-months / [Y] person-sprints
**Team capacity (working, at 75%):** [Z] person-months
**Business goal(s) this period:** [Primary metric: e.g., reduce trial-to-paid conversion drop-off by 15%]
**Reach denominated in:** [Users/month / Accounts / ARR / Support tickets]

---

### RICE Scoring Table

| Rank | Feature | Reach | Impact | Confidence | Effort (pm) | RICE Score | Status |
|------|---------|-------|--------|------------|-------------|------------|--------|
| 1    | [Name]  | [#]   | [#]    | [%]        | [#]         | [Score]    | Build  |
| 2    | [Name]  | [#]   | [#]    | [%]        | [#]         | [Score]    | Build  |
| 3    | [Name]  | [#]   | [#]    | [%]        | [#]         | [Score]    | Build  |
| 4    | [Name]  | [#]   | [#]    | [%]        | [#]         | [Score]    | Defer  |
| 5    | [Name]  | [#]   | [#]    | [%]        | [#]         | [Score]    | Discovery |

*RICE Score = (Reach × Impact × Confidence) ÷ Effort*

---

### Score Rationale

#### [Feature Name] -- RICE Score: [X] (Rank #[N])

- **Reach:** [#] [users/accounts/ARR] per month. Source: [analytics / sales pipeline / support tickets / estimate]. Notes: [any caveats about the reach estimate].
- **Impact:** [#] ([Massive/High/Medium/Low/Minimal]). Rationale: [specific behavioral change or metric movement expected, tied to the business goal]. Why not higher: [explicit reason the next-higher level was not selected].
- **Confidence:** [%]. Evidence basis: [validated user research / product analytics / sales input / hypothesis]. Weakest link: [Reach uncertainty / Impact uncertainty].
- **Effort:** [#] person-months. Basis: [engineering estimate / comparison to [similar feature] / reference class]. Includes: design ([X] weeks), engineering ([X] weeks), QA ([X] weeks).
- **Key assumption:** [The specific assumption that most affects the score. Quantify the sensitivity: "If [assumption] changes from X to Y, the score changes from A to B and the rank moves from #N to #M"].
- **Dependency:** [None / Requires [X] to be completed first].

*(Repeat for each feature)*

---

### MoSCoW Classification Table

| Category | Feature | Rationale | Effort (pm) | Cumulative Effort |
|----------|---------|-----------|-------------|-------------------|
| **Must** | [Name] | [Why it fails the removal test or is non-negotiable] | [#] | [#] |
| **Must** | [Name] | [Why it fails the removal test or is non-negotiable] | [#] | [#] |
| **Should** | [Name] | [Significant value, expected by users, not blocking] | [#] | [#] |
| **Could** | [Name] | [Desirable, low effort, first to cut if time runs short] | [#] | [#] |
| **Won't** | [Name] | [Reason deferred: dependency, data gap, scope, strategy] | [#] | -- |

**Must effort:** [X] pm = [Y]% of working capacity. [Status: within 60% threshold / OVER -- scope negotiation required]
**Must + Should effort:** [X] pm = [Y]% of working capacity.

---

### Ranking Surprises and Judgment Calls

| Feature | Expected Rank | Actual Rank | Gap | Explanation |
|---------|---------------|-------------|-----|-------------|
| [Name]  | [#]           | [#]         | [#] | [Why the framework diverged from intuition -- and whether to adjust] |

**Score clusters (items within 10% of each other):**
- Cluster A: [Feature X] (score [N]) and [Feature Y] (score [N-10]). Tiebreaker recommended: [strategic alignment / dependency unlock / team learning value].

---

### Key Assumptions and Sensitivity

| Feature | Key Assumption | If Assumption Holds | If Assumption Fails | Risk Level |
|---------|----------------|---------------------|---------------------|------------|
| [Name]  | [Assumption]   | Rank #[N], Score [X] | Rank #[M], Score [Y] | [High/Med/Low] |

---

### Recommendation

**Build this period** ([X] pm committed of [Y] pm working capacity):

| Priority | Feature | RICE Rank / MoSCoW | Effort | Primary Justification |
|----------|---------|---------------------|--------|-----------------------|
| 1 | [Name] | #[N] / Must | [X] pm | [One-sentence business justification] |
| 2 | [Name] | #[N] / Must | [X] pm | [One-sentence business justification] |
| 3 | [Name] | #[N] / Should | [X] pm | [One-sentence business justification] |

**Defer:**
- [Feature] -- Reason: [capacity / dependency / insufficient data]
- [Feature] -- Reason: [send to discovery -- Confidence ≤ 50%, need user research before scoring]

**Kill / Remove from backlog:**
- [Feature] -- RICE score [X] at [Y] pm effort. Return on investment does not justify inclusion in any near-term quarter.

**Capacity check:**
- Raw capacity: [X] pm
- Working capacity (75%): [Y] pm
- Committed work: [Z] pm
- Buffer remaining: [W] pm (for bugs, on-call, unplanned work)
- Status: [On budget / Over by X pm -- recommend cutting [feature]]

**Items sent to discovery:**
- [Feature] -- Questions to answer: [What is the actual reach? Does this change the conversion metric or the engagement metric?]
- [Feature] -- Research method recommended: [User interviews / analytics instrumentation / prototype test]
```

---

## Rules

1. **Never present RICE scores as objective truth.** The formula creates the illusion of precision on top of estimates. The value of the exercise is the structured conversation it forces -- alignment on what "impact" means, what "effort" actually includes, and what the business goal is. The number is a discussion anchor, not a verdict.

2. **Impact inflation is the most common failure mode. Defend every score above Medium (1).** If a user scores 70% of their features as High (2) or Massive (3), the scores are inflated and the ranking is useless. A Medium score (1) is correct for features that improve the experience for affected users. High (2) should be reserved for features that drive measurable metric movement. Massive (3) should appear at most once or twice in a list of 10 items.

3. **Effort must include all contributors, not just engineering.** A feature that requires 3 engineering weeks, 1 design week, and 1 QA week costs 5 person-weeks, not 3. Product managers routinely undercount by omitting design and QA. If the user cannot provide a breakdown, apply a 1.3-1.5x multiplier to engineering-only estimates as a baseline correction.

4. **Confidence must be set at the weakest link.** If Reach is validated with analytics but Impact is a hypothesis, the Confidence score is 50% -- not an average. The entire score reflects the quality of the weakest piece of evidence. This prevents a single validated data point from inflating confidence in a largely speculative estimate.

5. **Must items in MoSCoW must not exceed 60% of working capacity.** If they do, the release is over-scoped by definition, and the team is constructing a failure condition before the quarter starts. The correct response is to reclassify items with a scope negotiation conversation, not to pad the capacity estimate or compress the effort estimates.

6. **Every Won't item must have a documented rationale.** Stakeholders whose requests do not make the cut will accept the outcome if they can see that their request was understood, scored, and explicitly deferred with a reason. A Won't list without rationale reads as dismissal. A Won't list with rationale reads as a managed conversation.

7. **Run a capacity check before finalizing the recommendation.** A prioritized list that exceeds working capacity is a fantasy backlog, not a plan. Use 75-80% of raw capacity as the working budget. The remaining 20-25% is absorbed by unplanned work, production incidents, and ceremonies -- it is not available for feature work even if the schedule looks empty.

8. **Flag items requiring discovery rather than forcing a score.** An item with Confidence ≤ 50% on both Reach and Impact has two unknowns. Scoring it produces a number with so much uncertainty that it cannot be trusted for ranking. Classify it as "Send to Discovery" and specify the research question that must be answered before it can be scored reliably.

9. **RICE scores are only comparable within a single scoring session using the same definitions.** A RICE score of 240 from one team's planning session cannot be compared to a 240 from a different team's session unless both teams used the same units for Reach, the same time window, and the same Effort scale. Cross-session comparisons are invalid.

10. **Sequence by dependencies after scoring by value.** RICE and MoSCoW rank items by value, not by build order. After ranking, check the dependency graph. A rank-5 item that is a prerequisite for rank-1, rank-2, and rank-3 items may need to be sequenced first. Dependency-driven sequencing is applied after value-based ranking -- they are separate decisions.

11. **Revisit scores when significant new information arrives.** Prioritization is a point-in-time decision based on the information available. A new competitive threat, a large customer churn event, or a change in company strategy can make last quarter's top-ranked item irrelevant. Scores are not permanent -- they are versioned decisions with a timestamp and a context.

12. **For mixed audiences, present MoSCoW to stakeholders and RICE internally.** Executives and cross-functional stakeholders respond better to "Must / Should / Could" than to "RICE 480 vs RICE 320." Use RICE internally to derive the ranking, then translate the recommendation into MoSCoW language for the stakeholder presentation. Both views of the same prioritization can coexist in the same document.

---

## Edge Cases

### Scores cluster tightly across most of the list

When RICE scores cluster within 10-15% of each other, the framework has revealed genuine uncertainty rather than a clear ranking. This is important information -- it means the data does not differentiate well between these items, and a purely quantitative decision would be arbitrary. Handle this by: (1) introducing a secondary ranking criterion such as strategic alignment with the company's stated annual priorities, dependency unlock value (does this item unblock other high-value work?), or team learning value (does this build a capability we need for future quarters?); (2) presenting the cluster to stakeholders explicitly, noting that these items are effectively tied, and facilitating a structured discussion rather than auto-ranking; and (3) checking whether the Confidence scores have been inflated uniformly -- if every item has 80% confidence, the confidence scores are not doing their differentiating work.

### A senior stakeholder is pushing for a low-scoring item

This is the most politically sensitive scenario. The correct approach is to present the RICE score with full transparency and ask: "Which assumption in this score do you believe should change?" If the stakeholder has information about Reach (e.g., this feature unlocks a market segment of 5,000 accounts that the analytics do not capture) or Impact (e.g., this is a blocker in 40% of enterprise sales conversations per the VP of Sales), update the score with that information and show the revised rank. If no new information is introduced, the score stands and the stakeholder must explicitly exercise their authority to override the ranking -- at which point that override should be documented as a stakeholder decision, not a prioritization outcome. This protects the team from the implication that the framework failed.

### Technical debt, refactoring, and infrastructure work

RICE was designed for user-facing features and does not score infrastructure naturally because there is no direct user Reach or Impact. Use a modified approach: treat the cost of NOT doing the work as the score input. Estimate the current velocity drag (how many person-hours per sprint are lost to workarounds caused by the tech debt), the outage probability over the planning period and its user impact, or the scaling limitation (at what growth rate does the current architecture become a bottleneck?). Translate these into RICE-equivalent numbers: Reach = users affected by the performance or stability issue, Impact = severity of that degradation, Confidence = engineering team's assessment. Alternatively, allocate a fixed 20-25% of capacity to platform/debt work outside of the RICE ranking -- this is the approach used by teams that have found that competing technical debt against product features in a single RICE session consistently underscores the debt, leading to compounding architectural problems.

### A single large customer is requesting a specific feature

The standard RICE formula scores this poorly because Reach = 1 account. The correct adjustment is to redenominate Reach in revenue terms: Reach = ARR at risk (if the customer will churn without this feature) or ARR opportunity (if this feature enables upsell or a new contract). Impact remains on the standard scale but reflects the revenue movement per dollar of ARR affected. Confidence should reflect how firm the customer's commitment is -- a verbal request from a customer success call is 50% confidence; a written requirement in a renewal negotiation is 80-100%. Always document the second-order risk: building a feature for one customer creates product complexity and ongoing maintenance cost that benefits only that customer. Include a note on whether this feature is generalizable (could 20% of customers use this with minor changes?) or truly one-off (bespoke integration with their internal system). The latter should require a higher RICE threshold before it qualifies for the roadmap.

### Regulatory or compliance requirements with hard deadlines

These are Must items by definition -- they are not subject to scoring because the consequence of missing them is legal, financial, or safety risk that no product prioritization can override. Score them with RICE only for resource allocation purposes (how much capacity do they consume?) and to establish their relative implementation sequence if multiple compliance items are due in the same period. In MoSCoW, compliance and contractual items are always Must. The practical implication is that they reduce the working capacity available for discretionary work: if compliance items consume 2 of 6 person-months, the RICE scoring for discretionary features should be run against a 4 pm budget, not 6 pm. Document this capacity reduction explicitly so stakeholders understand why the discretionary roadmap looks smaller than expected.

### Feature requests that arrive mid-quarter after the plan is set

A common failure mode is to re-prioritize every time a new request arrives, which destabilizes the team's focus. Establish a threshold rule: a new item should only displace a committed item if its RICE score is at least 25% higher than the lowest-ranked committed item, or if it represents a contractual obligation or severity-1 production risk. Everything below that threshold goes into the next planning cycle. Document incoming requests in a running log with the date received, the source, and the initial estimate of Reach and Impact. This log becomes a valuable input at the next planning session and shows stakeholders that requests are being tracked even when not immediately acted on.

### The user has no data -- everything is gut feel

When Reach and Impact are pure estimates and the user has no analytics, support data, or research to draw on, the correct action is to set Confidence at 30-50% across the board and use the relative ranking rather than absolute scores. The RICE scores will all be low due to uniform low confidence, but the relative ordering still provides value. More importantly, the scoring exercise reveals exactly what data would improve confidence: "We scored CSV Export at 50% confidence because we do not know how many users are currently exporting data manually. Adding an analytics event to track spreadsheet exports would resolve this in two weeks." The prioritization output should include a "data collection actions" section that specifies what to measure before the next scoring session. This turns a data-poor first session into a progressively improving data practice.

### Comparing features with very different time horizons

Some features have immediate impact (a bug fix, a checkout UX improvement) while others have compounding, long-term value (a platform capability, an API that enables a developer ecosystem). RICE with a 30-day Reach window systematically underscores long-term investments because the Reach in the first 30 days is small. Handle this by using a consistent time horizon (one quarter is standard) but adding a separate "strategic multiplier" column for items with acknowledged long-term compounding value. Document this multiplier and its rationale separately from the RICE score so that the adjustment is transparent rather than hidden inside inflated Reach numbers.

---

## Example

**Input from user:** "We're a B2B SaaS team building project management software. We have 4 engineers, one designer, and a QA engineer. We're planning Q3. Business goal is reducing trial-to-paid conversion -- currently 12%, we want to get to 18%. Here are our 7 candidate features:

1. Onboarding checklist for new trial users
2. Bulk task import via CSV
3. Gantt chart view
4. Email digest notifications
5. Custom field types (beyond text/date/number)
6. Two-factor authentication (2FA)
7. Integrations marketplace (Slack, Jira, Google Drive)"

---

**Output:**

## Prioritization: Q3 Planning -- [Company] Project Management

**Framework:** RICE (primary) + MoSCoW (stakeholder presentation layer)
**Period:** Q3 (13 weeks)
**Team composition:** 4 engineers + 1 designer + 1 QA
**Raw capacity:** 6 people × 3 months = 18 person-months
**Working capacity (75%):** ~13.5 person-months
**Business goal:** Increase trial-to-paid conversion from 12% to 18% (+6 percentage points)
**Reach denominated in:** Trial users/month (current trial volume: ~800/month)
**Note on capacity:** Designer and QA are shared resources -- not all features require equal design/QA investment. Effort estimates reflect full team cost, not engineering alone.

---

### RICE Scoring Table

| Rank | Feature | Reach | Impact | Conf. | Effort (pm) | RICE Score | Status |
|------|---------|-------|--------|-------|-------------|------------|--------|
| 1 | Onboarding checklist | 800 | 2 | 100% | 1.5 | 1,067 | Build |
| 2 | Email digest notifications | 600 | 1 | 80% | 1.0 | 480 | Build |
| 3 | Bulk task import (CSV) | 400 | 2 | 80% | 1.0 | 640 | Build |
| 4 | Two-factor authentication | 200 | 1 | 100% | 0.5 | 400 | Build |
| 5 | Custom field types | 300 | 1 | 50% | 3.0 | 50 | Defer |
| 6 | Gantt chart view | 500 | 2 | 50% | 4.0 | 125 | Defer → Discovery |
| 7 | Integrations marketplace | 700 | 3 | 30% | 6.0 | 105 | Defer → Discovery |

*RICE Score = (Reach × Impact × Confidence) ÷ Effort*

---

### Score Rationale

#### Onboarding Checklist -- RICE Score: 1,067 (Rank #1)

- **Reach:** 800 trial users/month. All new trial users will encounter onboarding. Source: product analytics (account creation events).
- **Impact:** 2 (High). Rationale: Exit surveys from churned trials cite "didn't understand how to get started" in 38% of responses. A structured onboarding checklist directly addresses the stated conversion drop-off. Tied explicitly to the Q3 business goal. Why not Massive (3): the checklist solves an awareness and activation problem, but it does not remove all friction -- users still need to complete a first meaningful workflow to convert. Massive would require proof of that full conversion lift.
- **Confidence:** 100%. Evidence: exit survey data (n=120), session recording review (Heap -- 60% of trial users never reach the task creation screen), and two validated user interviews from last quarter.
- **Effort:** 1.5 person-months. Breakdown: design (2 weeks), engineering (3 weeks), QA (1 week). Reference: similar checklist implementation at comparable company was completed in 6 weeks; our infrastructure already supports in-app modals.
- **Key assumption:** The 38% of churned users citing "confusion on getting started" would have converted if given a checklist. If the actual conversion lift is 4pp rather than 6pp, the RICE score drops to 711 but the item remains Rank #1.
- **Dependency:** None.

---

#### Bulk Task Import (CSV) -- RICE Score: 640 (Rank #2, listed #3 in original table)

*Note: After sorting, CSV Import ranks #2 despite appearing third in the table above due to rounding. Confirm sort.*

- **Reach:** 400 trial users/month. Source: sales team reports that 50% of trials involve migrating from spreadsheets. Applied to 800 trial users/month = 400. Caveat: this is a sales estimate, not analytics-validated.
- **Impact:** 2 (High). Rationale: Users who cannot import existing data abandon trials at higher rates (reported by CS team -- 15 recent churn conversations cited "too much manual setup"). CSV import eliminates the primary setup barrier for spreadsheet-migrating users.
- **Confidence:** 80%. Sales team input is a strong signal but not analytics-validated. Reach estimate is the weak link.
- **Effort:** 1.0 person-months. Breakdown: design (0.5 weeks -- standard file upload UI), engineering (2.5 weeks), QA (1 week -- focus on edge cases in CSV formatting). Low complexity because we already parse CSV in the export feature.
- **Key assumption:** 50% of trial users are migrating from spreadsheets. If closer to 30%, Reach drops to 240 and the score drops to 384, but the item remains in the top 3.
- **Dependency:** None. Shares code with existing CSV export feature.

---

#### Email Digest Notifications -- RICE Score: 480 (Rank #3)

- **Reach:** 600 trial users/month. Source: analytics show 600 users log in at least once during a 14-day trial but do not return after day 3. A digest notification re-engages users who leave and forget.
- **Impact:** 1 (Medium). Rationale: Notifications re-engage disengaged users but do not resolve deeper UX problems. Expected to improve 7-day retention within the trial window, which correlates with conversion -- but the mechanism is indirect. Why not High (2): no validated evidence that notifications drive conversion for this product category; relies on general benchmark data.
- **Confidence:** 80%. SaaS industry benchmark: email digests improve 7-day retention by 8-12% for productivity tools. Applied to our trial cohort data. Not validated for this specific product.
- **Effort:** 1.0 person-months. Breakdown: design (1 week -- email template), engineering (2.5 weeks -- email service integration and digest logic), QA (0.5 weeks).
- **Key assumption:** 8-12% retention improvement from SaaS benchmarks applies to our product. If our product's email engagement is lower (plausible for B2B project management), the actual lift may be 4-6%, which reduces the score to 240 but keeps this in the build set.
- **Dependency:** None. Email infrastructure (SendGrid) already configured.

---

#### Two-Factor Authentication (2FA) -- RICE Score: 400 (Rank #4)

- **Reach:** 200 trial users/month. Source: sales pipeline review -- 25% of trials are from companies in financial services, healthcare, or enterprise segments with security requirements. Security blockers are mentioned in 12 lost-deal post-mortems this quarter.
- **Impact:** 1 (Medium). Rationale: 2FA does not directly improve the product experience for the majority of users. It removes a security compliance blocker for a specific segment. Why not High (2): it does not affect the 75% of trials from SMB companies who are not security-gated.
- **Confidence:** 100%. Sales has documented 12 deals lost or stalled in Q2 citing lack of 2FA. This is validated data.
- **Effort:** 0.5 person-months. Breakdown: engineering (1.5 weeks -- standard TOTP implementation using an existing authentication library), QA (0.5 weeks). Minimal design work.
- **Key assumption:** Enterprise segment conversion is meaningfully higher than the 12% baseline. If enterprise converts at 25% (reasonable for higher-ACV segments) and the current 12% includes these blocked trials, unblocking 200 trials/month with 2FA could yield 25 additional conversions per month at higher ACV. The revenue impact justifies the rank even if the RICE score appears moderate.
- **Dependency:** None.

---

#### Gantt Chart View -- RICE Score: 125 (Rank #6, defer to discovery)

- **Reach:** 500 trial users/month. Source: survey (n=40) where 62% cited "timeline visualization" as a desired feature. Applied to trial volume. Caveat: survey respondents are self-selected and likely represent power users, overstating general Reach.
- **Impact:** 2 (High) -- but this score drives the confidence problem below.
- **Confidence:** 50%. The survey is small and self-selected. More importantly, we do not know whether users who want a Gantt chart will convert at higher rates, or whether they will continue to trial and churn despite the feature because of other friction points. The causal link to conversion (our Q3 goal) is unestablished.
- **Effort:** 4.0 person-months. Breakdown: design (3 weeks -- significant UX complexity for drag-and-drop timeline), engineering (8 weeks), QA (3 weeks). This is a substantial investment.
- **Key assumption:** Gantt chart demand is sufficiently correlated with conversion to justify 4 person-months. With 50% confidence and 4 pm effort, this feature is high-risk at high cost. Recommend: run a 2-week discovery sprint -- unmoderated usability tests with a Figma prototype to validate conversion intent before committing engineering resources.
- **Dependency:** Requires robust task dependency data model (not yet built). Hidden dependency increases effective effort.

---

#### Integrations Marketplace (Slack, Jira, Google Drive) -- RICE Score: 105 (Rank #7, defer to discovery)

- **Reach:** 700 trial users/month. High reach -- integrations are broadly desired.
- **Impact:** 3 (Massive) -- but only if integrations are truly blocking conversion, which is unvalidated.
- **Confidence:** 30%. Integrations are commonly requested but rarely the decisive conversion factor. Users request integrations in surveys because they represent the ideal state, not because they are the primary barrier. No exit survey data links integration absence to churn. The massive effort at low confidence produces a low effective score.
- **Effort:** 6.0 person-months. Breakdown: 3 integrations × 2 person-months each (API integration, UI, error handling, documentation, ongoing maintenance commitment). This is likely an underestimate if a full marketplace UI is required.
- **Key assumption:** Integration absence is a primary trial churn driver. This is almost certainly wrong as a Q3 priority -- the onboarding checklist data directly contradicts it (users are churning before they reach the stage where integrations matter). Recommend: Instrument onboarding events to establish where in the trial users disengage. If users routinely reach integration-seeking behavior and then churn, revisit in Q4.
- **Dependency:** Requires stable public API (currently in beta). Effective effort increases if API stabilization must precede marketplace work.

---

### MoSCoW Classification (Stakeholder Presentation View)

| Category | Feature | Rationale | Effort (pm) | Cumulative |
|----------|---------|-----------|-------------|------------|
| **Must** | Onboarding checklist | Directly addresses primary stated reason for trial churn (38% exit surveys). Central to Q3 conversion goal. | 1.5 | 1.5 |
| **Must** | 2FA | Blocks conversion in 12 documented enterprise deals. Low effort, high confidence, contractual-adjacent. | 0.5 | 2.0 |
| **Should** | Bulk task import (CSV) | Removes setup barrier for 50% of trials migrating from spreadsheets. High effort-efficiency. | 1.0 | 3.0 |
| **Should** | Email digest notifications | Re-engages disengaged trial users; addresses silent churn within the trial window. | 1.0 | 4.0 |
| **Could** | Custom field types | Nice to have for power users but no validated link to trial conversion. | 3.0 | 7.0 |
| **Won't** | Gantt chart view | High effort (4 pm), low confidence, hidden dependency. Requires discovery sprint before Q4 consideration. | 4.0 | -- |
| **Won't** | Integrations marketplace | Low confidence that this drives trial conversion. Premature before users reach integration-seeking behavior. | 6.0 | -- |

**Must effort:** 2.0 pm = 15% of working capacity (13.5 pm). Well within 60% threshold. ✓
**Must + Should effort:** 4.0 pm = 30% of working capacity. Healthy.

---

### Ranking Surprises and Judgment Calls

| Feature | Expected Rank | Actual Rank | Gap | Explanation |
|---------|---------------|-------------|-----|-------------|
| Gantt chart | #2 (often requested) | #6 | -4 | High effort and low confidence deflate the score significantly. The survey data driving Reach is from a self-selected sample. Confidence should be raised before the rank improves. |
| Integrations marketplace | #1 (exec favorite) | #7 | -6 | 30% confidence is the primary driver. The feature is desirable in the abstract but unvalidated as a conversion driver. Present this to stakeholders with the discovery recommendation. |
| 2FA | #6 (rarely mentioned) | #4 | +2 | Low reach but 100% confidence and minimal effort. Removing a documented sales blocker at 0.5 pm cost is high-efficiency work. |

**Score clusters:**
- Email notifications (480) and 2FA (400) are within 17% of each other. Both should be built this quarter. If a capacity cut is required, 2FA is lower effort and higher confidence -- it should be retained over notifications.

---

### Key Assumptions and Sensitivity

| Feature | Key Assumption | If Assumption Holds | If Assumption Fails | Risk |
|---------|----------------|---------------------|---------------------|------|
| Onboarding checklist | 38% of churned users would convert with guidance | Score 1,067, Rank #1 | Score 533 (lift is 3pp not 6pp), still Rank #1 | Low |
| CSV import | 50% of trials are spreadsheet migrators | Score 640, Rank #2 | Score 384 (30% = 240 reach), Rank #3 | Medium |
| Gantt chart | Gantt demand correlates with conversion | Score 125, Rank #6 | Score remains low; discovery sprint confirms or denies | High |

---

### Recommendation

**Build in Q3** (4.0 pm committed of 13.5 pm working capacity):

| Priority | Feature | Rank | Effort | Justification |
|----------|---------|------|--------|---------------|
| 1 | Onboarding checklist | #1 | 1.5 pm | Directly addresses top stated churn driver; 100% confidence; central to Q3 conversion goal |
| 2 | Bulk task import (CSV) | #2 | 1.0 pm | Removes primary setup barrier for ~50% of trial users; low effort relative to impact |
| 3 | Email digest notifications | #3 | 1.0 pm | Re-engages disengaged users; proven SaaS lever with industry benchmarks |
| 4 | Two-factor authentication | #4 | 0.5 pm | Unblocks 12 documented enterprise deals; minimal effort |

**Defer to Q4:**
- Custom field types -- No validated link to trial conversion. Re-evaluate if Q3 research reveals it as a churn driver.

**Send to discovery (before Q4 scoring):**
- Gantt chart view -- Recommended action: 2-week Figma prototype test with 8 trial users. Question to answer: "Does seeing a Gantt chart increase stated conversion intent?" Instrument analytics to track how many trial users reach workflow complexity that would require a Gantt view.
- Integrations marketplace -- Recommended action: Instrument onboarding funnel events to establish where trial users disengage. If data shows users reaching integration-seeking behavior and then churning, the RICE score will increase substantially in Q4 planning.

**Capacity check:**
- Raw capacity: 18 person-months
- Working capacity (75%): 13.5 person-months
- Committed to features: 4.0 person-months
- Discovery sprint (Gantt): 1.0 person-month
- **Buffer remaining: 8.5 person-months**

The large buffer is intentional. Q3's primary goal is conversion improvement, not feature volume. The 4 committed features are high-confidence, direct-impact work. The remaining capacity absorbs: production bugs and incidents (historically 2-3 pm/quarter), onboarding checklist iteration based on early data (expect 1 pm of follow-on work), and potential emergency compliance work. This is not under-planning -- it is the correct capacity allocation for a team whose goal is measurable metric improvement rather than feature throughput.
