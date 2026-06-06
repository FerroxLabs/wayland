---
name: win-loss-analysis
description: |
  Produces a structured win/loss analysis with deal factors, pattern
  identification, and improvement actions using deal analysis methodology.
  Use when the user asks to create a win/loss review, analyze why deals
  were won or lost, build a deal analysis template, review sales outcomes,
  or identify patterns in closed deals to improve win rates.
  Do NOT use for pipeline review or forecasting (use pipeline-review),
  competitive analysis at the market level (use competitive-analysis),
  or customer churn analysis (use operations metrics).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sales analysis strategy planning"
  category: "marketing-sales"
  subcategory: "sales"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Win Loss Analysis

## When to Use

Use this skill when any of the following triggers are present:

- The user wants to analyze why a set of closed deals were won or lost and identify root causes beyond surface-level explanations like "we lost on price"
- The user needs to build or improve a repeatable win/loss review process for their sales organization -- covering both individual deal debrief cadence and quarterly aggregate analysis
- The user has closed a batch of deals (minimum 5, ideally 10+) and wants to extract actionable patterns to improve future win rates, qualification criteria, or competitive positioning
- The user wants to evaluate whether a specific sales motion, territory, or rep is performing differently than others and needs a structured framework to diagnose the gap
- The user is preparing a sales QBR (quarterly business review) or board update and needs a data-backed narrative about why the team is winning and losing
- The user wants to instrument a post-decision buyer interview process and needs guidance on what questions to ask and how to synthesize the responses into insight
- The user is launching a new product, entering a new market segment, or facing a new competitor and wants to rapidly learn from early closed deals to adjust go-to-market positioning

**Do NOT use this skill when:**

- The user needs forward-looking pipeline review, deal-by-deal forecast probability assessment, or stage conversion analysis -- use `pipeline-review` instead
- The user wants market-level competitive intelligence: feature comparisons, positioning maps, analyst reports, or competitor monitoring -- use `competitive-analysis` instead
- The user needs to analyze post-sale customer behavior, churn reasons, renewal rates, or expansion patterns -- use `operations-metrics` (customer health) instead
- The user is asking about sales compensation design, quota setting, or territory carving -- these are sales operations topics requiring their own frameworks
- The user has fewer than 5 deals to analyze and is simply asking why one specific deal was lost -- that is a deal debrief, not a win/loss analysis; address it conversationally with deal debrief guidance instead of this structured framework
- The user wants to build a product roadmap from deal feedback -- while win/loss data informs that, synthesizing it into a roadmap belongs in a product discovery or VOC (voice of customer) skill

---

## Process

### Step 1: Gather Analysis Inputs Before Producing Anything

Do not produce any analysis until you have enough context to avoid generic output. Ask for or infer from the conversation:

- **Deal set definition:** How many deals, what time period (quarter, half-year, trailing 12 months), what deal stage qualifies as "closed" (some orgs count "verbal yes" as closed, others require signed contract)
- **Win/loss split:** How many won, how many lost, and if applicable, how many ended in "no decision" (no decision is a distinct outcome requiring separate analysis -- it means the status quo beat everyone)
- **Business context:** What does the company sell, what is the average contract value (ACV), what is the typical sales cycle length in days, and what market segment are they selling into (SMB under $50K ACV, mid-market $50K-$500K, enterprise over $500K)
- **Current baseline metrics:** Current win rate, target win rate, and whether win rate is calculated on deals entered (total pipeline) or deals with a competitive decision (excludes no-decision outcomes)
- **Data sources available:** CRM records (Salesforce, HubSpot, etc.), rep self-reported notes, recorded calls (Gong, Chorus, Clari), post-decision buyer interviews, or nothing but the rep's memory
- **Competitive landscape:** Which competitors showed up in which deals -- this shapes whether the analysis is primarily execution-focused or competitive-positioning-focused
- **Prior analysis:** Has this team done win/loss analysis before? If yes, is there prior data to compare against? Year-over-year trend analysis is more powerful than a single-period snapshot

If the user provides deal data inline (e.g., a list of companies, outcomes, and notes), extract it and structure it. If they have no data and are asking to build the process, produce the framework and template they can populate.

### Step 2: Classify Every Deal Across Four Loss Archetypes (or Win Archetypes)

Before scoring individual factors, categorize each lost deal into one of four archetypes. This prevents the analysis from becoming an undifferentiated list of scores and forces the analyst to identify root causes:

**For losses:**
- **Qualification failure:** The deal should never have been in the pipeline. The prospect lacked budget, authority, genuine need, or a realistic timeline. These losses waste sales capacity and inflate the denominator of the win rate calculation
- **Execution failure:** The prospect had real need and budget, but the sales process was poorly executed -- weak discovery, no champion built, proposal delivered without understanding the decision criteria, pricing introduced too early or too late
- **Competitive loss:** Execution was adequate, but a competitor won on a dimension the sales team could not overcome -- feature gap, pricing structure, brand preference, reference customers, or incumbent advantage
- **No-decision loss:** The prospect chose to do nothing -- maintain the status quo, delay the project, redirect budget, or lose their champion internally. These are the hardest losses to prevent and require different fixes than competitive losses

**For wins:**
- **Qualification win:** The team correctly identified and pursued a high-fit opportunity
- **Execution win:** The sales process was exemplary -- champion was built early, discovery uncovered quantified pain, proposal was tailored to decision criteria
- **Competitive win:** The team displaced an incumbent or defeated a competitor through superior positioning, reference selling, or a specific competitive play
- **Momentum win:** The deal closed largely because of buyer urgency, a regulatory deadline, or an internal event at the prospect (new CISO, breach, audit finding) -- these are real wins but less repeatable

Document the primary archetype for each deal before scoring. The archetype drives which improvement actions matter.

### Step 3: Score Each Deal Across the Eight Core Evaluation Factors

For every closed deal (won and lost), rate each factor on a 1-5 scale using the defined scoring rubric in the Output Format section. The eight factors cover the full sales motion:

**Factor 1 -- Discovery Quality:** Did the rep uncover the prospect's real problem, quantify the cost of inaction, and map that pain to the product's capabilities? Poor discovery is the root cause of most execution failures. Score 5 only if the rep completed a full needs analysis using a methodology like SPIN (Situation, Problem, Implication, Need-Payoff), MEDDIC/MEDDPICC, or Challenger, AND quantified the prospect's pain in dollar terms or business impact terms

**Factor 2 -- Champion Strength:** A champion is a specific person inside the prospect organization who wants the product to win, has organizational credibility, and is willing to actively sell internally on the vendor's behalf. Rate 5 only if the champion presented the business case to the economic buyer unprompted. Rate 1 if no champion was identified at any point in the cycle

**Factor 3 -- Economic Buyer Access:** Did the rep or manager get direct access to the person who controls budget? In deals over $50K ACV, losing without ever speaking to the economic buyer is an almost universal predictor of loss. Rate separately from champion strength -- sometimes the champion IS the economic buyer (simpler), sometimes they are not (complex)

**Factor 4 -- Competitive Positioning:** Did the rep understand which competitors were in the deal, what evaluation criteria the prospect was using, and how to differentiate on those criteria specifically? Generic "we're better because of X" positioning scores 2. Prospect-specific positioning that addresses their stated evaluation criteria scores 4-5

**Factor 5 -- Proposal and Business Case Quality:** Was the proposal responsive to the specific pain uncovered in discovery, or was it a catalog of features? Did it include an ROI model or business case quantifying the value? Was it delivered in a format the buying committee could share internally? A proposal that the champion cannot present to others without the sales rep present scores no higher than 3

**Factor 6 -- Buyer Urgency and Compelling Event:** Was there a real external event creating urgency (compliance deadline, board mandate, competitive threat, renewal date, organizational change), or was urgency artificial and manufactured? Deals won without a compelling event are often accidental wins that are hard to repeat. Deals lost partly because urgency collapsed require different treatment than deals lost because urgency was never real

**Factor 7 -- Buying Committee Alignment:** In deals with more than one stakeholder, did the rep identify all members of the buying committee, understand each person's success criteria, and address objections from non-champions proactively? Unaddressed "blockers" (legal, IT security, procurement, skeptical end users) kill deals at the finish line

**Factor 8 -- Pricing Fit and Commercial Structure:** This is NOT just whether the price was too high. Score this on whether the pricing model matched how the prospect thinks about value (per user vs. flat fee vs. consumption-based), whether the payment terms worked for their fiscal year, and whether discounting was used strategically or as a panic move. Price objections at the end of a cycle almost always reflect a value communication failure earlier in the cycle -- score that failure in discovery and proposal quality, not here

For each factor score, document a one-sentence evidence note. "4/5 -- champion (Sarah Chen, VP of IT) proactively scheduled a meeting with the CFO to present the ROI model" is useful. "4/5" with no evidence is not.

### Step 4: Calculate Aggregate Factor Scores and Identify the Largest Gaps

After all deals are scored, calculate per-factor statistics:

- **Average score for won deals** (separately for each factor)
- **Average score for lost deals** (separately for each factor)
- **Gap = Won average minus Lost average** -- the larger the gap, the more predictive that factor is of outcome
- **Impact rating:** Gaps of 1.5+ are High Impact, 0.8-1.4 are Medium Impact, below 0.8 are Low Impact for improvement prioritization

Sort factors by gap size descending. The top 2-3 factors with the largest gaps are where improvement actions should concentrate. Avoid the mistake of trying to improve everything simultaneously -- the factor with the largest gap represents the highest-leverage improvement opportunity.

Additionally, calculate:
- **Win rate by deal size segment** (e.g., under $25K, $25K-$100K, over $100K) -- teams often have dramatically different win rates by segment that get hidden in aggregate numbers
- **Win rate by competitor** -- not just which competitor appeared most, but what the win rate was against each competitor specifically
- **Win rate by rep or territory** (if the dataset covers multiple reps) -- outlier performers in either direction reveal coaching opportunities or process insights
- **Average sales cycle length for won vs. lost deals** -- longer cycles for lost deals often indicate the deal was never real but stayed in the pipeline due to rep optimism

### Step 5: Identify Patterns Using the Pattern Taxonomy

Patterns in win/loss analysis fall into five categories. Name and classify each pattern explicitly rather than stating vague observations:

**Structural patterns:** These reflect who you should and should not be selling to. Example: "We win 78% of deals with manufacturing companies and 31% with professional services firms." Structural patterns require ICP (Ideal Customer Profile) refinement, not sales coaching

**Process patterns:** These reflect what the sales team does or fails to do consistently. Example: "100% of lost deals had no direct economic buyer contact; 80% of won deals had at least one economic buyer meeting." Process patterns require pipeline stage criteria changes, sales playbook updates, or qualification checkpoints

**Competitive patterns:** These reflect where a specific competitor is systematically beating the team. Example: "Against [Competitor], we lose 70% of deals under $30K because their entry-level SKU is priced at a flat rate vs. our per-seat model, which is more expensive at low user counts." Competitive patterns require specific battle cards and potentially pricing or packaging adjustments

**Timing patterns:** These reflect how deal timing affects outcome. Example: "Deals that close in the last 2 weeks of a quarter have a 45% win rate vs. 68% for deals closing mid-quarter -- quarter-end pressure is causing premature discounting that does not convert." Timing patterns often require pipeline management and forecasting changes

**Messaging patterns:** These reflect how the team talks about the product and whether it resonates. Example: "Won deals consistently referenced the prospect's specific compliance risk (SOC 2, HIPAA); lost deals referenced product features without connecting them to compliance stakes." Messaging patterns require sales enablement, talk track updates, and potentially marketing alignment

State every pattern with a specific data citation: "X out of Y deals with this characteristic resulted in Z outcome." Never state patterns as impressions or tendencies.

### Step 6: Generate Specific Improvement Actions Tied to Patterns

Each improvement action must meet four criteria to be included:
- **Specific:** The action describes exactly what changes, who changes it, and what the new behavior or artifact looks like
- **Evidenced:** The action cites the specific data pattern that supports it
- **Measurable:** The action defines a metric that will indicate whether it is working, and a timeframe for measurement
- **Owned:** The action names a specific role responsible for execution (Sales Manager, Sales Enablement, Marketing, Product)

Common action categories and what they look like when done well vs. poorly:

| Action Category | Poor (Too Generic) | Specific and Actionable |
|---|---|---|
| Discovery improvement | "Improve discovery quality" | "Add 3 SPIN implication questions about the cost of a phishing breach to the discovery call script; Sales Manager reviews recordings for compliance in first 30 days" |
| Champion building | "Build better champions" | "Add a champion validation checkpoint at Stage 3 (Technical Evaluation): rep must document champion's title, influence level, and whether they have presented the business case internally before deal advances" |
| Competitive positioning | "Create better competitive materials" | "Build a battle card for [Competitor] specifically addressing their pricing advantage in deals under 50 users; include a TCO model showing our 3-year cost is lower due to incident reduction" |
| Qualification | "Qualify deals better" | "Add a disqualification criterion: any deal without economic buyer access within 30 days of discovery call moves to nurture, not active pipeline" |

Rank actions by expected impact, not by ease of implementation. The hardest changes are often the highest leverage. Recommend no more than 3-4 actions per analysis cycle -- more than that exceeds organizational change capacity and dilutes focus.

### Step 7: Produce the Win/Loss Analysis Document

Structure the output using the Output Format below. Calibrate the depth to the dataset:
- 5-9 deals: Include every individual deal review; aggregate statistics are directional only -- note this explicitly
- 10-24 deals: Include a representative sample of 4-6 individual deal reviews (2-3 wins, 2-3 losses), plus full aggregate analysis
- 25+ deals: Aggregate analysis is primary; individual deal reviews are optional appendix; statistical significance becomes meaningful
- If the dataset includes deals across multiple reps, include a rep-level performance table only if the user has indicated this is appropriate for their team culture (rep-level data can be sensitive)

---

## Output Format

```markdown
## Win/Loss Analysis: [Quarter or Period]

**Period:** [Start date] to [End date]
**Deals Analyzed:** [X won, Y lost, Z no-decision, N total]
**Overall Win Rate:** [X%] | competitive win rate (excluding no-decision): [X%]
**Target Win Rate:** [X%]
**Average Contract Value:** [$X won / $Y lost]
**Average Sales Cycle:** [X days won / Y days lost]
**Primary Competitor(s):** [List competitors appearing in 2+ deals]
**Data Sources:** [CRM records / rep interviews / buyer feedback / call recordings]
**Prepared by:** [Author or "AI-assisted analysis"]
**Date:** [Current date]

---

### Executive Summary

**Win Rate Status:** [X%] is [X percentage points above/below] target of [Y%].
[One sentence on the primary driver of the gap.]

**Single Most Important Finding:**
[One sentence stating the highest-impact pattern with data. E.g., "7 of 8 lost deals lacked
a documented champion -- fixing this alone is projected to prevent 2-3 losses per quarter."]

**Recommended Priority Action:**
[One sentence on the single highest-leverage change to make, with a timeline.]

**What Is Working:**
[2-3 bullets on factors where won deals score consistently well -- preserve these behaviors]
- [Pattern with data citation]
- [Pattern with data citation]
- [Pattern with data citation]

**What Needs to Change:**
[2-3 bullets on the largest gaps between won and lost deal scores]
- [Pattern with data citation]
- [Pattern with data citation]
- [Pattern with data citation]

---

### Deal Outcome Summary

| Outcome | Count | % of Total | Avg ACV | Avg Cycle (Days) |
|---------|-------|-----------|---------|-----------------|
| Won | [X] | [X%] | [$X] | [X days] |
| Lost -- Competitive | [X] | [X%] | [$X] | [X days] |
| Lost -- No Decision | [X] | [X%] | [$X] | [X days] |
| Lost -- Qualification | [X] | [X%] | [$X] | [X days] |
| **Total** | **[N]** | **100%** | **[$X]** | **[X days]** |

---

### Deal Factor Scorecard

| Factor | Avg Score (Wins) | Avg Score (Losses) | Gap | Impact Rating |
|--------|-----------------|-------------------|-----|--------------|
| Discovery quality | [X.X / 5] | [X.X / 5] | [X.X] | [High / Med / Low] |
| Champion strength | [X.X / 5] | [X.X / 5] | [X.X] | [High / Med / Low] |
| Economic buyer access | [X.X / 5] | [X.X / 5] | [X.X] | [High / Med / Low] |
| Competitive positioning | [X.X / 5] | [X.X / 5] | [X.X] | [High / Med / Low] |
| Proposal and business case quality | [X.X / 5] | [X.X / 5] | [X.X] | [High / Med / Low] |
| Buyer urgency and compelling event | [X.X / 5] | [X.X / 5] | [X.X] | [High / Med / Low] |
| Buying committee alignment | [X.X / 5] | [X.X / 5] | [X.X] | [High / Med / Low] |
| Pricing fit and commercial structure | [X.X / 5] | [X.X / 5] | [X.X] | [High / Med / Low] |

**Impact Rating Key:** Gap ≥ 1.5 = High | Gap 0.8-1.4 = Medium | Gap < 0.8 = Low

---

### Factor Scoring Rubric (for consistent scoring across reviewers)

| Factor | 1 -- Poor | 2 -- Below Avg | 3 -- Average | 4 -- Good | 5 -- Excellent |
|--------|-----------|----------------|--------------|-----------|----------------|
| **Discovery quality** | No structured discovery; rep pitched features immediately | Surface questions only; pain not quantified | Covered BANT basics; some needs identified | Uncovered core pain with business impact; tailored demo followed | Full SPIN/MEDDIC; pain quantified in $ or business KPI; discovery drove proposal content entirely |
| **Champion strength** | No champion identified at any stage | Prospect contact is friendly but has no internal influence or authority | Contact supports the purchase but has not advocated internally | Documented champion with title/influence; has shared the business case with peers | Champion has presented to economic buyer unprompted; is actively managing internal objections |
| **Economic buyer access** | Economic buyer never identified or contacted | EB identified but declined to meet | EB met once in a group call; no direct relationship | EB met directly; pain and ROI discussed | EB is engaged partner in the deal; called the rep directly with questions or updates |
| **Competitive positioning** | Did not know competitors were in the deal | Named competitors but used only generic positioning | Standard differentiation delivered; not tailored to this prospect | Prospect-specific positioning addressing their stated evaluation criteria | Built a side-by-side POC or TCO model; neutralized specific competitor objections by name |
| **Proposal and business case quality** | No formal proposal; verbal pricing only | Feature list with pricing; no business case | Standard proposal template with minimal customization | Customized proposal referencing discovery findings; includes ROI model | Champion can present the business case to EB without rep present; includes risk quantification and implementation plan |
| **Buyer urgency / compelling event** | No urgency identified; "we'll look at this sometime" | Vague urgency; no external event creating deadline | Soft deadline tied to budget cycle | Real compelling event identified (audit, renewal, breach, mandate) | Urgency is externally imposed and time-bound; delay has a documented cost the prospect acknowledged |
| **Buying committee alignment** | Rep spoke only to one contact; other stakeholders unknown | Stakeholders identified but not engaged | Key stakeholders met; objections partially addressed | All committee members met; success criteria documented per person | Documented buying process; all known objections addressed; no surprises at close |
| **Pricing fit / commercial structure** | Price introduced before value established; significant sticker shock | Price discussed early; value not yet anchored; prospect focused only on cost | Standard pricing delivered; some negotiation but no creative structure | Pricing model matched how prospect thinks about value; terms aligned to their fiscal year | Commercial structure differentiated the offer (payment terms, phased rollout, success-based terms); made price a non-issue |

---

### Pattern Analysis

#### Pattern Category: Structural (ICP Fit)

[State structural patterns with data]

| Segment | Deals | Win Rate | Vs. Overall | Insight |
|---------|-------|---------|------------|---------|
| [Industry A] | [X] | [X%] | [+/-X pp] | [One sentence insight] |
| [Industry B] | [X] | [X%] | [+/-X pp] | [One sentence insight] |
| [Company size: under 200 employees] | [X] | [X%] | [+/-X pp] | [Insight] |
| [Company size: 200-1000 employees] | [X] | [X%] | [+/-X pp] | [Insight] |

#### Pattern Category: Competitive

| Competitor | Deals | Won | Lost | Win Rate | Primary Loss Reason | Battle Card Exists? |
|-----------|-------|-----|------|----------|-------------------|-------------------|
| [Competitor 1] | [X] | [X] | [X] | [X%] | [Specific reason with data] | [Yes / No] |
| [Competitor 2] | [X] | [X] | [X] | [X%] | [Specific reason with data] | [Yes / No] |
| No named competitor (only vs. status quo) | [X] | [X] | [X] | [X%] | [Reason] | N/A |

#### Pattern Category: Process

[List 3-5 process patterns with data citations]
1. [Pattern]: "[X of Y deals with this process characteristic had this outcome]"
2. [Pattern]: "[X of Y deals...]"
3. [Pattern]: "[X of Y deals...]"

#### Pattern Category: Timing

| Deal Timing | Deals | Won | Win Rate | Note |
|------------|-------|-----|---------|------|
| Closed in month 1 of quarter | [X] | [X] | [X%] | [Insight] |
| Closed in month 2 of quarter | [X] | [X] | [X%] | [Insight] |
| Closed in month 3 (quarter-end) | [X] | [X] | [X%] | [Insight] |

#### Pattern Category: Messaging

[List 1-3 messaging patterns with supporting evidence from deal notes or buyer quotes]
1. [Pattern with evidence]
2. [Pattern with evidence]

---

### Individual Deal Reviews

*(Include all deals for datasets under 10; representative sample of 4-6 for larger datasets)*

---

**Deal: [Company Name] | [Won / Lost -- Competitive / Lost -- No Decision / Lost -- Qualification]**

| Factor | Score | Evidence |
|--------|-------|----------|
| Discovery quality | [X/5] | [Specific, one-sentence evidence] |
| Champion strength | [X/5] | [Evidence] |
| Economic buyer access | [X/5] | [Evidence] |
| Competitive positioning | [X/5] | [Evidence] |
| Proposal and business case quality | [X/5] | [Evidence] |
| Buyer urgency / compelling event | [X/5] | [Evidence] |
| Buying committee alignment | [X/5] | [Evidence] |
| Pricing fit / commercial structure | [X/5] | [Evidence] |
| **Total** | **[X/40]** | |

**Deal Archetype:** [Qualification win / Execution win / Competitive win / Momentum win / Qualification loss / Execution loss / Competitive loss / No-decision loss]

**Primary [win/loss] reason (one sentence):** [Reason]

**What to replicate or do differently (one sentence):** [Specific change or behavior to carry forward]

---

*(Repeat block for each deal)*

---

### Improvement Action Plan

| Priority | Action | Pattern Evidence | Expected Impact | Success Metric | Owner | Timeline |
|----------|--------|----------------|-----------------|----------------|-------|----------|
| 1 | [Specific, named action] | [Data pattern that supports it] | [Projected win rate improvement or loss prevention] | [How you'll know it's working, measured at what interval] | [Specific role] | [Month / Quarter] |
| 2 | [Action] | [Evidence] | [Impact] | [Metric] | [Role] | [Timeline] |
| 3 | [Action] | [Evidence] | [Impact] | [Metric] | [Role] | [Timeline] |
| 4 (if applicable) | [Action] | [Evidence] | [Impact] | [Metric] | [Role] | [Timeline] |

**Implementation Note:** [Any dependency between actions, sequencing recommendation, or resource requirement]

---

### Recommendations for Next Analysis Cycle

- **Data collection improvements:** [Specific additions to make future analysis richer, e.g., "Implement post-decision buyer interview within 2 weeks of close for all deals over $30K"]
- **Sample size target:** [X deals to achieve statistically meaningful patterns]
- **Comparison baseline:** [What this quarter's data will be compared against in the next cycle]
- **Metrics to watch:** [2-3 leading indicators that will signal whether improvement actions are working before next full analysis]
```

---

## Rules

1. **Never analyze fewer than 5 deals and call the output statistically meaningful.** Below 10 deals, every stated pattern must be prefaced with a note that it is directional only. Below 5 deals, produce a deal debrief framework instead of a pattern analysis and tell the user explicitly why.

2. **Always include both won and lost deals.** Analyzing only losses produces a distorted picture -- it hides what is already working and makes it impossible to calculate factor score gaps. If the user only wants to analyze losses, push back and explain why including wins matters for the gap analysis.

3. **Classify every lost deal into one of the four archetypes before scoring.** Qualification loss, execution loss, competitive loss, and no-decision loss each require different remedies. Lumping all losses together produces improvement actions that are misdirected -- coaching reps on discovery quality does not help if the losses are qualification failures.

4. **Every factor score must include specific, deal-level evidence -- never just a number.** A score without evidence is an opinion. Evidence requirements: who said what, what happened in the deal, what document or conversation supports the score. If no evidence can be cited, the factor must be scored 3 (average/unknown) and flagged for data gap.

5. **Never attribute losses primarily to price without analyzing the value communication chain first.** Price is almost never the actual root cause. If prospects say "you were too expensive," investigate: Was ROI quantified in discovery? Was the business case included in the proposal? Was the economic buyer involved? If any of these are "no," the loss is an execution failure, not a pricing failure. Only score pricing fit as the primary loss factor if all of the above were done well and the pricing model was genuinely misaligned with the prospect's value perception.

6. **Competitive win rate must be reported separately from overall win rate.** Overall win rate includes no-decision losses (which no competitor won either) and uncontested wins. Competitive win rate -- wins divided by deals with at least one named competitor -- is the number that reflects sales execution against alternatives. Both numbers belong in the analysis.

7. **Improvement actions must be specific enough that a new sales manager could implement them without interpretation.** "Improve discovery" fails this test. "Add the following 3 implication questions to the Stage 2 discovery call script and require managers to verify compliance via call recording review for the first 60 days" passes this test.

8. **Champion strength is the single highest-predictive factor in B2B deals over $25K ACV.** Research across enterprise B2B deals consistently shows that the presence or absence of an internal champion is the strongest predictor of deal outcome -- stronger than pricing, stronger than product fit, stronger than competitive positioning. Always feature this factor prominently regardless of what the data shows in a given sample, because a small sample may not surface it clearly.

9. **Segment win rate by deal size in every analysis.** Teams that aggregate win rate across all deal sizes miss systematic performance problems. A team with a 65% overall win rate might have 80% win rate at under $20K (small, easy deals) and 35% win rate above $75K (where enterprise process and champion-building matter more). Improvement actions for those two segments are entirely different.

10. **No-decision losses must be analyzed separately from competitive losses.** No-decision means the status quo won -- the prospect decided doing nothing was better than buying from anyone. The remedies are different: no-decision losses require better urgency creation and compelling event validation early in the cycle, not better competitive positioning or product features. Combining these two loss types into a single "loss" category produces recommendations that do not address the actual problem.

11. **Rep self-assessment data is systematically biased.** Reps tend to overrate their own performance on execution factors (discovery quality, proposal quality) and underrate competitive positioning and pricing fit as loss factors. When only rep self-report data is available, apply a correction: treat execution scores above 3.5 with skepticism and verify against call recordings or CRM activity data. Always note the data source limitation in the analysis output.

12. **The executive summary must contain exactly one primary action, not a list.** Lists in executive summaries give decision-makers permission to defer everything. A single, clearly prioritized action creates accountability. Additional actions belong in the improvement action plan table where they are sequenced and owned.

---

## Edge Cases

### Dataset Under 10 Deals

State prominently in the executive summary: "This analysis covers [N] deals. Patterns identified are directional hypotheses, not statistically validated findings. A minimum of 15-20 deals per segment is required for statistical confidence. Use these findings to generate coaching conversations and data collection priorities, not to make structural process changes."

Focus the output on qualitative deal-by-deal review rather than aggregate statistics. Calculate factor score gaps but note the high variance. Frame improvement actions as "hypotheses to test" rather than "changes to implement." Recommend a specific plan to accumulate more data: how many deals per month, when to conduct the next analysis, what additional data to capture in the interim.

### All or Most Losses Are to a Single Competitor

When one competitor accounts for 60%+ of losses, the analysis shifts from general win/loss to competitive displacement analysis. Expand the competitive section significantly:

- Document every evaluation criterion the prospect used and how each vendor was rated on each criterion (to the degree known from rep notes or buyer feedback)
- Identify whether the competitor is winning on product (feature gap), pricing (structural disadvantage), brand (perceived risk preference), or references (they have customers in this vertical, you do not)
- Each root cause requires a different response: feature gaps go to product roadmap, pricing structure issues go to packaging and commercial leadership, brand gaps go to marketing, reference gaps go to customer success (creating reference-able customers)
- Recommend building a specific competitive displacement play for that competitor, including a battle card, trap questions to set in discovery, and reference customer stories
- Note that when one competitor dominates loss data, it may indicate an ICP problem -- the team is pursuing prospects who are a better fit for the competitor's offering

### No Buyer Feedback Available (Rep Self-Report Only)

Note the limitation explicitly in the data sources field and in the executive summary. Rep self-report data has known biases that make it unreliable for certain factors:

- Execution factors (discovery quality, proposal quality) will be systematically overscored
- External factors (competitive pricing, product gaps) will be systematically overscored as loss reasons to deflect from execution failures
- Buyer urgency will be overscored in won deals and underscored in lost deals (reps remember urgency being present when they won, absent when they lost, even if it was present in both)

Recommend implementing a structured post-decision buyer interview process going forward. The interview should occur within 2 weeks of decision, be conducted by someone other than the rep who worked the deal (a sales manager, a customer success person, or a third-party firm), and cover: what criteria mattered most in the evaluation, how each vendor was rated on those criteria, what was the decisive factor, and what, if anything, could have changed the outcome. Even 5 buyer interviews dramatically improves the accuracy of future win/loss analysis.

### Seasonal or Cyclical Business

If the company sells into industries with strong budget cycles (government: fiscal year ending September 30; education: decisions made in spring for fall implementation; retail: purchasing freezes during holiday season), segment the analysis by quarter before drawing conclusions.

A 40% win rate in Q4 might be normal if Q4 is when budget is being finalized and decisions are deferred -- not a performance problem. A 40% win rate in Q2 in the same company, when budgets are fresh and projects are launching, is a genuine signal. Always ask the user whether there is a known seasonal pattern before interpreting win rate trends.

Recommend comparing the same quarter year-over-year rather than sequential quarters, and building a seasonality baseline before using win rate trends as performance signals.

### New Product Launch or Market Entry (First 2 Quarters of GTM)

Early deals are learning deals. A 30-40% win rate in the first 6 months of a new product or market entry is not necessarily a failure -- it is expected and informative. Frame the analysis differently:

- Focus on what is being learned rather than what is going wrong
- Track loss reason evolution: are loss reasons consistent (systematic product or messaging gap) or diverse (still figuring out ICP)? Consistent loss reasons are actionable; diverse loss reasons indicate the ICP is not yet defined
- Identify the characteristics of won deals aggressively -- early wins often reveal the beachhead customer profile that should define the ICP
- Recommend a "fast fail" qualification framework to keep the pipeline from filling with learning deals that consume sales capacity without producing revenue
- Set a learning goal for the next cycle (e.g., "validate or invalidate the hypothesis that compliance-driven buyers are the primary ICP") rather than a win rate target

### Multiple Reps With Divergent Performance

When the dataset covers 3+ reps with meaningfully different win rates (e.g., 75% vs. 45% for the same types of deals), the analysis must address rep-level performance patterns in addition to aggregate patterns.

Do not name individual reps in the output unless the user has explicitly requested rep-level analysis and you are confident the output will be used constructively. Instead:

- Segment by "top third," "middle third," and "bottom third" performer
- Identify which factors show the largest score gap between high and low performers -- this reveals the coaching priority
- Determine whether the gap is in execution (high performers do discovery better) or in qualification (high performers disqualify bad deals earlier and thus have a higher denominator quality)
- If the gap is in qualification, the fix is deal review cadence and exit criteria enforcement. If the gap is in execution, the fix is skill coaching and call recording review

### Deals Lost Due to Internal Prospect Events Beyond Sales Control

Some deals are lost due to events that had nothing to do with sales execution: the champion left the company, the company froze budget due to an acquisition, a regulatory event redirected priorities, or the project sponsor was reorganized out of their role.

Classify these as "external loss -- force majeure" and exclude them from the factor score aggregate, because including them distorts the pattern analysis. Document them separately with a brief note on what happened. Use them as evidence for building a risk monitoring practice: tracking champion tenure, monitoring prospect company news, and having a multi-threaded relationship strategy to reduce single-point-of-failure risk in every deal.

---

## Example

**User Input:** "Can you do a win/loss analysis for Q3? We sell a cloud-based compliance management platform (SOC 2, ISO 27001 automation) to SaaS companies. Average deal size around $42K ACV. We had 12 deals close -- 7 won, 4 lost to competitors, 1 no-decision. Two competitors keep coming up: VendorPrime (incumbent in the market, strong brand) and ComplianceFlow (cheaper, simpler). Sales cycle averages 67 days for wins, 94 days for losses. Our target win rate is 65%; we came in at 58%."

---

## Win/Loss Analysis: Q3

**Period:** July 1 to September 30
**Deals Analyzed:** 7 won, 4 lost (competitive), 1 no-decision, 12 total
**Overall Win Rate:** 58.3% | Competitive win rate (excluding no-decision): 63.6% (7 of 11 contested deals)
**Target Win Rate:** 65%
**Average Contract Value:** $42,000 won / $31,500 lost
**Average Sales Cycle:** 67 days won / 94 days lost
**Primary Competitors:** VendorPrime (3 deals), ComplianceFlow (2 deals)
**Data Sources:** CRM deal records, rep-provided notes, 2 post-decision buyer interviews conducted
**Date:** [Current date]

---

### Executive Summary

**Win Rate Status:** 58.3% overall win rate is 6.7 percentage points below the 65% target. However, competitive win rate (63.6%) is closer to target -- the no-decision loss indicates one deal where urgency was never real and the status quo prevailed.

**Single Most Important Finding:**
Lost deals averaged 27 days longer in cycle than won deals (94 vs. 67 days), and every deal that exceeded 85 days in cycle without an economic buyer meeting was lost -- suggesting that extended cycles without executive access are a reliable predictor of loss that should trigger active disqualification or deal restructuring.

**Recommended Priority Action:**
Implement a deal review checkpoint at Day 60 for any deal without a documented economic buyer meeting -- if no EB meeting has occurred and cannot be scheduled within 10 days, move the deal to a nurture track and free the rep's capacity for higher-probability opportunities. Target implementation by October 15 with Sales Manager owning the enforcement.

**What Is Working:**
- Discovery quality is consistently strong in won deals (avg 4.1/5 vs. 2.4/5 in losses) -- the team is effectively quantifying compliance risk in dollar terms during discovery calls, which is driving urgency and anchoring value before pricing is introduced
- Won deals show strong champion identification: 6 of 7 won deals had a documented champion (typically VP of Engineering or Head of Security) by end of Stage 2; only 1 of 5 lost deals had a champion at any stage
- Messaging around SOC 2 audit readiness resonates strongly -- 5 of 7 won deals cited an upcoming audit or investor due diligence as the compelling event, and the team is correctly surfacing and amplifying this urgency

**What Needs to Change:**
- Economic buyer access is the largest factor gap (won: 4.0/5, lost: 1.6/5, gap: 2.4) -- in 4 of 5 losses, the economic buyer was identified but never directly engaged; reps relied on the champion to carry the message upward, and the champion was either too junior or lost the internal deal
- Against VendorPrime, the team is losing 2 of 3 deals on brand and reference customer concerns -- prospects cite VendorPrime's established presence in Series B-C SaaS as a lower-risk choice; the team has no structured reference customer program for this segment
- ComplianceFlow losses (2 of 2) share a consistent pattern: both prospects had under 50 employees and described ComplianceFlow's self-serve, lower-cost option as "right-sized for where we are" -- indicating an ICP boundary the team is not respecting at qualification

---

### Deal Outcome Summary

| Outcome | Count | % of Total | Avg ACV | Avg Cycle (Days) |
|---------|-------|-----------|---------|-----------------|
| Won | 7 | 58.3% | $42,000 | 67 days |
| Lost -- Competitive (VendorPrime) | 3 | 25.0% | $38,000 | 89 days |
| Lost -- Competitive (ComplianceFlow) | 2 | 16.7% | $19,500 | 72 days |
| Lost -- No Decision | 1 | 8.3% | $45,000 | 101 days |
| **Total** | **12** | **100%** | **$37,250** | **77 days** |

*Note: The 2 ComplianceFlow losses average $19,500 ACV -- significantly below the team's average deal size of $42K for won deals. This is an ICP signal, not a competitive execution problem.*

---

### Deal Factor Scorecard

| Factor | Avg Score (Wins) | Avg Score (Losses) | Gap | Impact Rating |
|--------|-----------------|-------------------|-----|--------------|
| Economic buyer access | 4.0 / 5 | 1.6 / 5 | **2.4** | **High** |
| Champion strength | 4.1 / 5 | 1.8 / 5 | **2.3** | **High** |
| Buyer urgency / compelling event | 4.3 / 5 | 2.2 / 5 | **2.1** | **High** |
| Discovery quality | 4.1 / 5 | 2.4 / 5 | **1.7** | **High** |
| Competitive positioning | 3.4 / 5 | 2.0 / 5 | **1.4** | **Medium** |
| Buying committee alignment | 3.6 / 5 | 2.4 / 5 | **1.2** | **Medium** |
| Proposal and business case quality | 3.9 / 5 | 3.1 / 5 | **0.8** | **Medium** |
| Pricing fit / commercial structure | 3.7 / 5 | 3.2 / 5 | **0.5** | **Low** |

**Key Insight:** Pricing fit has the smallest gap (0.5) between won and lost deals, confirming that price is not the primary loss driver despite two losses to a lower-priced competitor. Those losses are ICP and urgency failures (ComplianceFlow prospects were too small and too early-stage to need the platform), not pricing failures.

---

### Pattern Analysis

#### Pattern Category: Structural (ICP Fit)

| Segment | Deals | Win Rate | Vs. Overall (58%) | Insight |
|---------|-------|---------|-------------------|---------|
| SaaS companies, 50-500 employees | 7 | 86% | +28 pp | Core ICP -- strong win rate, right-sized deals |
| SaaS companies, under 50 employees | 2 | 0% | -58 pp | Both lost to ComplianceFlow; these deals should be disqualified at prospecting |
| SaaS companies, 500+ employees | 3 | 33% | -25 pp | Losses driven by VendorPrime's enterprise reference base; longer cycle, higher risk |

**Structural Conclusion:** The 50-500 employee SaaS segment is the clear ICP sweet spot for this quarter. Deals outside that range are consuming disproportionate sales capacity with much lower win rates. Adding company size as a hard disqualification criterion below 50 employees would have eliminated 2 losses this quarter without losing any wins.

#### Pattern Category: Competitive

| Competitor | Deals | Won | Lost | Win Rate | Primary Loss Reason | Battle Card Exists? |
|-----------|-------|-----|------|----------|-------------------|-------------------|
| VendorPrime | 3 | 1 | 2 | 33% | Brand trust / reference customers in prospect's stage (Series B-C SaaS) | No -- generic only |
| ComplianceFlow | 2 | 0 | 2 | 0% | Prospect was below ICP size threshold; ComplianceFlow's self-serve model was right-sized | No |
| No named competitor (status quo) | 7 | 6 | 1 | 86% | 1 no-decision loss: urgency was artificial, no compelling event ever confirmed | N/A |

**VendorPrime Note:** The 1 win against VendorPrime came from a prospect who had a prior negative experience with VendorPrime's implementation timeline and was actively seeking an alternative. The rep surfaced this during discovery and ran a "speed to compliance" play, emphasizing the platform's guided implementation path and 60-day SOC 2 readiness guarantee. This play should be codified as a VendorPrime displacement motion.

**ComplianceFlow Note:** These 2 losses should be reclassified as qualification failures, not competitive losses. The team pursued sub-50-employee prospects who were a better fit for a self-serve tool. No competitive response is needed -- an ICP filter is.

#### Pattern Category: Process

1. **Economic buyer meeting by Day 45 predicts outcome:** 6 of 7 won deals had a direct economic buyer meeting before Day 45 of the sales cycle. 0 of 5 lost deals achieved EB access. This is the single strongest process predictor in this dataset
2. **Champion identified by Stage 2 predicts win:** 6 of 7 won deals had a named, documented champion by end of Stage 2 (Technical Evaluation). 1 of 5 lost deals had any champion at any stage. The one won deal without a strong champion was a small deal ($18K) where the economic buyer and champion were the same person (solo founder)
3. **Extended cycles signal lost deals before close:** 4 of 5 lost deals exceeded 80 days. Of the 7 won deals, none exceeded 80 days. A Day 60 deal health checkpoint would have flagged all 4 competitive losses as at-risk before final evaluation
4. **Proposals delivered without EB involvement correlate with loss:** In all 5 lost deals, the proposal was delivered to the champion without the economic buyer present or reviewing. In 5 of 7 won deals, the EB received the proposal directly (in 3 of these, the rep presented to a buying committee that included the EB)

#### Pattern Category: Timing

| Deal Timing | Deals | Won | Win Rate | Note |
|------------|-------|-----|---------|------|
| Closed in July (month 1) | 3 | 3 | 100% | All 3 were strong-ICP, well-qualified deals from Q2 pipeline |
| Closed in August (month 2) | 4 | 3 | 75% | Normal performance; 1 loss to VendorPrime |
| Closed in September (month 3, quarter-end) | 5 | 1 | 20% | 4 losses in final month; 3 were deals that should have been disqualified earlier; 1 was the no-decision |

**Timing Insight:** The September cluster of losses is consistent with pipeline padding -- deals that were unlikely to close were kept active through Q3 to show activity, then collapsed at quarter-end. This inflates the denominator and distorts win rate. Recommend reviewing pipeline exit criteria to remove deals that have missed 2+ milestone checkpoints without exception approval.

#### Pattern Category: Messaging

1. **Audit-urgency messaging resonates strongly:** In 5 of 7 won deals, the rep successfully connected the product to an upcoming SOC 2 audit, investor due diligence request, or customer security questionnaire. In 0 of 5 lost deals was a specific compliance trigger identified. The team has a strong messaging asset here that is not being deployed consistently -- some reps are using it, others are defaulting to feature-based pitches
2. **"Speed to compliance" is an underdeveloped differentiator vs. VendorPrime:** The 1 win against VendorPrime used implementation speed as the differentiator. VendorPrime's implementation timeline (known from customer reviews to average 4-6 months) vs. the platform's 60-day readiness path is a strong differentiator that is not in any current sales material

---

### Individual Deal Reviews

---

**Deal: Meridian Data (Series B SaaS, 180 employees) | Won**

| Factor | Score | Evidence |
|--------|-------|----------|
| Discovery quality | 5/5 | Rep ran 3 discovery sessions; quantified cost of a failed SOC 2 audit at $380K in deferred enterprise revenue from 2 prospects requiring compliance certification |
| Champion strength | 5/5 | VP of Engineering (Maya Torres) presented the platform's ROI model to the CFO and CEO without rep involvement; secured budget reallocation from a deferred DevOps hire |
| Economic buyer access | 4/5 | CFO joined final business case presentation; reviewed and approved commercial terms directly |
| Competitive positioning
