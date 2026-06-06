---
name: idea-validation
description: |
  Creates an idea validation plan using lean startup methodology with assumptions mapping, riskiest assumption tests, success criteria, and timeline for systematic business idea validation. Use when the user asks about idea validation, validating a business idea, testing assumptions, lean startup validation, or riskiest assumption testing.
  Do NOT use for building a full business plan (use business-plan), creating a Lean Canvas (use lean-canvas), or defining an MVP (use mvp-definition).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship strategy planning research analysis"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Idea Validation

## When to Use

**Use this skill when:**
- A user has a business idea and wants to determine whether it deserves further investment of time, money, or team before building anything
- A user asks how to test their assumptions systematically before committing to a product roadmap or fundraise
- A user wants to apply lean startup methodology -- specifically assumption mapping, riskiest assumption testing (RAT), and experiment design -- to a specific idea
- A user has already built something that is not getting traction and wants to go back and validate whether the right problem was ever confirmed
- A user wants to design a 4-8 week validation sprint with specific experiments, metrics, and go/no-go decision points
- A user asks about willingness-to-pay testing, problem-solution fit, or fake door tests for a new concept
- A user is evaluating multiple idea directions and wants a structured way to kill the weakest ones quickly

**Do NOT use this skill when:**
- The user wants to build a one-page Lean Canvas (use `lean-canvas` -- assumption mapping here is deeper and experiment-focused)
- The user wants to define what goes into a first shipped product (use `mvp-definition` -- that skill starts after problem-solution fit is confirmed)
- The user wants a comprehensive business plan with financials, competitive analysis, and operational detail (use `business-plan`)
- The user wants to design specific customer discovery interview scripts and conversation frameworks (use `customer-discovery-interview` -- this skill references interviews as one experiment type but does not script them)
- The user already has confirmed problem-solution fit and wants to validate product-market fit at scale (use `growth-strategy` or `pmf-measurement`)
- The user has an established product and wants to validate a new feature (use `feature-prioritization` -- the validation framework differs when you have existing customers and data)

---

## Process

### Step 1: Extract and Clarify the Idea

Before mapping assumptions, the idea must be stated precisely. Vague ideas produce vague assumptions. Ask or derive:

- **Product or service statement (one sentence):** What is being built or offered? Resist compound sentences -- "an app that helps X do Y" is the correct unit, not a paragraph.
- **Target customer:** Push for a specific, reachable segment. "Small business owners" is too broad. "Independent restaurant owners with 1-3 locations doing $500K-$3M in annual revenue who operate without a dedicated finance role" is testable.
- **Problem statement (from the customer's perspective):** Write this as a frustration or consequence, not a feature request. "Owners set menu prices by gut feel and leave 8-15% gross margin unrealized" is a problem. "Owners don't have a pricing tool" is a solution disguised as a problem.
- **Current alternatives:** How do customers solve this problem today? Include the "do nothing" option. Every idea competes with the status quo. Knowing alternatives reveals switching costs and tells you how much better your solution must be.
- **Unique value proposition:** Why would a customer switch from their current behavior? This is not a tagline -- it is a hypothesis about what makes this 10x better or 10x cheaper or 10x faster than the alternative.
- **Revenue model:** How does money change hands? Per seat, per transaction, subscription, usage-based, freemium with paid tier? The revenue model carries its own assumptions that must be validated independently.
- **Founder's unfair advantage (if stated):** Domain expertise, existing relationships, proprietary data, or distribution channels that lower acquisition cost or increase credibility. Note this -- it affects which experiments are accessible and credible.

If the user cannot answer these questions clearly, do not proceed to assumption mapping. Work with them to sharpen the idea first. A fuzzy idea will produce an unmappable assumption list.

---

### Step 2: Map All Assumptions by Category

Every business idea is a stack of assumptions. The job is to make them all explicit before prioritizing them. Most founders operate with 20-40 implicit assumptions and consciously acknowledge 3-5. Surface all of them.

Use the following four categories as an exhaustive taxonomy:

**Problem Assumptions (does the problem exist and matter?):**
- This specific problem exists for the target customer segment
- The problem is experienced frequently enough to drive behavior change (daily frustration vs. annual nuisance)
- The problem is painful enough that customers would pay money to solve it
- Customers are aware of the problem (not a latent need requiring education)
- Customers actively seek solutions (vs. accepting the status quo)

**Solution Assumptions (does your solution solve the problem better?):**
- The proposed solution actually solves the stated problem
- The solution is meaningfully better than existing alternatives (10x improvement threshold, not 10%)
- Customers can and will learn to use the solution (adoption friction is manageable)
- The solution solves the problem reliably and consistently (not just in the demo environment)
- Customers trust the solution enough to act on its outputs (especially relevant for AI/data recommendations)

**Market Assumptions (is there a real market here?):**
- The addressable market is large enough to build a sustainable business (even a niche business needs a minimum viable market)
- Target customers can be identified and reached through accessible, affordable channels
- Customers will pay the proposed price -- not just "something" but specifically this price point
- The market is not controlled by an entrenched incumbent who can easily copy the solution
- Customers will switch from their current solution despite switching costs and inertia

**Business Model Assumptions (do the economics work?):**
- Customer acquisition cost (CAC) is sustainable relative to customer lifetime value (LTV) -- typically LTV:CAC ratio of 3:1 or higher
- The unit economics at scale allow for a viable margin profile (gross margin appropriate to the model: 60-80% for SaaS, 40-60% for marketplaces, 20-40% for services)
- The business can reach break-even or raise sufficient capital before running out of runway
- The founding team can execute the go-to-market motion (sales capability, technical capability, operational capability)
- Retention is achievable -- the product solves a recurring problem, not a one-time event

List every assumption explicitly in a numbered table. Incomplete assumption mapping is the primary failure mode of this process.

---

### Step 3: Score and Rank Assumptions by Risk

Risk = Criticality × Uncertainty. Prioritize assumptions that score High on both dimensions.

**Criticality:** If this assumption is wrong, does the entire idea fail?
- High: Yes, the idea is dead or requires a fundamental pivot
- Medium: The idea survives but requires significant adjustment
- Low: The idea can work around this if it is wrong

**Uncertainty:** How much evidence do you currently have for or against this assumption?
- High: No evidence, pure hypothesis, or contradictory signals
- Medium: Some anecdotal evidence or analogous examples, but not specific to this market
- Low: Direct evidence from data, prior experience, or validated analogies

**Scoring guide:**
- High Criticality + High Uncertainty = Riskiest (test immediately)
- High Criticality + Medium Uncertainty = Very risky (test in first sprint)
- Medium Criticality + High Uncertainty = Risky (test in second sprint)
- All other combinations = Lower priority (validate later, after core assumptions pass)

Select the top 3-5 assumptions ranked by risk score. These are the Riskiest Assumption Tests (RATs). If any of these fail, the idea is either dead or requires a major pivot. Do not test easier assumptions first to build confidence -- that is validation theater.

---

### Step 4: Design a Specific Experiment for Each RAT

For each riskiest assumption, design the cheapest and fastest experiment that could falsify it. The goal is to disprove the assumption, not confirm it. Confirmation bias is the enemy.

For each experiment, define:

- **Hypothesis (if/then/because format):** "If [condition], then [measurable outcome], because [underlying mechanism]." Example: "If we show independent restaurant owners a 60-second demo of automated menu analysis, then at least 40% will ask about pricing or express intent to sign up, because pricing is a top-3 frustration they lack tools to address."
- **Method:** Choose the appropriate experiment type (see Step 5)
- **Minimum sample size:** Small enough to be fast, large enough to be meaningful. For qualitative problem interviews: 8-12 participants in a clearly homogeneous segment is sufficient to identify dominant patterns. For quantitative tests (landing pages, ad campaigns): 200-500 visitors minimum to measure conversion rates with any statistical confidence.
- **Primary metric:** One number that determines the outcome. Not "engagement" -- a specific rate, count, or conversion.
- **Success threshold (pre-committed):** The specific numeric result that validates the assumption. Set this BEFORE running the experiment. "6 out of 10 interviewees name pricing as a top-3 business challenge" is pre-committed. "Most people seemed interested" is post-hoc rationalization.
- **Failure threshold (pre-committed):** The specific numeric result that invalidates the assumption and triggers a pivot or kill decision.
- **Timeline:** Calendar days, not "a few weeks." Two weeks maximum per experiment for problem/solution validation. Four weeks maximum for market/demand validation.
- **Cost in dollars and hours:** Include both. Cheap and fast experiments first is a constraint, not a preference.

---

### Step 5: Select the Right Experiment Type for Each Assumption Category

Different assumptions require fundamentally different experiment designs. Mismatching experiment type to assumption type produces unreliable data.

**For Problem Assumptions -- use discovery-oriented methods:**
- **Problem interviews (qualitative):** 8-15 conversations with target customers. Ask about the last time they experienced the problem, what they tried, what it cost them, what they use now. Never ask "would you use X." This is the highest-signal method for problem validation when done with discipline.
- **Search volume and keyword analysis:** Use Google Keyword Planner data to estimate how many people search for the problem actively. 10K+ monthly searches for a problem-framing keyword is a meaningful signal. Zero searches suggests the problem is not front-of-mind.
- **Online community mining:** Reddit, niche forums, LinkedIn groups, and industry-specific communities contain raw expressions of frustration. Search for complaint patterns without prompting. Recurring, detailed complaints validate problem existence.
- **Support ticket analysis (if applicable):** If you or an adjacent company have customer support data, volume and sentiment of complaints related to the problem area is strong signal.

**For Solution Assumptions -- use behavioral methods, not surveys:**
- **Concierge MVP:** Deliver the solution manually to 3-5 customers before building anything. Do exactly what the product would do, by hand. If customers adopt the manual version, solution demand is validated. If they do not use the human-delivered version, they will not use the automated one.
- **Wizard-of-Oz prototype:** Build a front-end interface that looks like a real product but is powered by humans behind the scenes. Users believe they are using the product; the team fulfills requests manually. Tests solution adoption without engineering investment.
- **Paper or clickable prototype test:** For UI-heavy products, test comprehension and completion rates with a Figma or paper prototype before writing code. Measure task completion rate and time-to-understand. A completion rate below 60% on core tasks indicates usability problems in the solution design.
- **Beta test with real usage data:** 10-20 users given early access with tracking on feature adoption, return visits, and session depth. If fewer than 30% of beta users return in week 2, retention is failing.

**For Willingness-to-Pay and Market Assumptions:**
- **Fake door / smoke test (landing page + call to action):** Build a single-page description of the product with a "Get early access" or "Join waitlist" or "Pre-order" button. Drive traffic via paid ads (minimum $500 budget to get 500+ visitors). Measure conversion rate on the call to action. A 5%+ conversion rate from cold traffic to waitlist signup is a strong positive signal. Below 1% requires explanation -- price too high, message unclear, or market too small.
- **Pre-order campaign:** Sell the product before it exists. Collect real money (Stripe payment, crowdfunding). This is the strongest willingness-to-pay signal because real money overrides stated preferences. Even 20-30 paying customers from a targeted outreach validates demand.
- **Painted door test (B2B):** Add a link to a "feature" that does not exist yet within an existing product or website. Measure click rate. If 15%+ of relevant users click on a non-existent feature, demand is real.
- **Small-budget paid ad test:** Spend $300-$1,000 on Google or Meta ads targeting the customer segment with a clear value proposition. Measure click-through rate (CTR) and cost per click (CPC). A CTR above 2% and CPC under $5 (consumer) or $20 (B2B) for a clear value proposition is a positive channel signal.
- **Direct outreach response rate:** Send 50-100 cold emails or LinkedIn messages to the exact target customer with a concise problem statement and ask for a 20-minute call. A 15%+ response rate indicates the problem resonates. Below 5% suggests the segment or framing is off.

**For Business Model Assumptions:**
- **Unit economics spreadsheet with sensitivity analysis:** Model LTV and CAC at different price points and retention rates. Run three scenarios: pessimistic (churn 8%/month, CAC = $400), base (churn 4%/month, CAC = $200), optimistic (churn 2%/month, CAC = $80). If the pessimistic scenario is a viable business, the model is robust.
- **Pricing survey (Van Westendorp Price Sensitivity Meter):** Ask four questions -- "At what price would you consider this too cheap to be credible? Acceptable? Getting expensive? Too expensive?" The acceptable range intersection gives a real price window grounded in customer perception, not founder preference.
- **Comparable company benchmarks:** Find 3-5 analogous businesses (same model, adjacent market) and use their publicly disclosed metrics (average contract value, churn rates, gross margins) as proxies. Not a substitute for your own data, but it frames what "normal" looks like.

---

### Step 6: Define the Three-Outcome Decision Framework Per Experiment

After each experiment concludes, apply a pre-defined decision framework. The decision must be made before seeing results -- the criteria, not the outcome, determine the conclusion.

**Proceed:** The primary metric met or exceeded the success threshold. The assumption is validated with sufficient confidence to move to the next riskiest assumption. Log the evidence clearly: what method, what sample, what result, what conclusion.

**Pivot:** The primary metric fell below the success threshold but above the failure threshold, OR the experiment produced unexpected insights pointing to a related but different opportunity. Do not kill the idea -- reformulate the assumption, adjust the segment or framing, design a new experiment, and retest. Pivots are hypothesis refinements, not failures.

**Kill:** The primary metric fell below the failure threshold for a critical assumption AND the findings do not suggest a viable pivot direction, OR multiple critical assumptions fail in sequence with no clear alternative. Stop investing time and money. Document every finding -- they are valuable for future work and the intellectual honesty of killing a bad idea is itself a competitive advantage.

A crucial rule: you must define the failure threshold, not just the success threshold. Without a floor, every result becomes "encouraging in some ways." The failure threshold is what makes the framework honest.

---

### Step 7: Build the Validation Sprint Timeline

Structure the validation plan as consecutive two-week sprints, each with a single assumption, a single primary experiment, and a hard decision point at the end.

**Sprint 0 (Days 1-3): Idea sharpening**
- Finalize the idea summary, assumption map, and risk rankings
- Identify the first 3 experiment designs with pre-committed criteria
- Identify 8-15 interview candidates for Sprint 1 if problem validation is the first RAT

**Sprint 1 (Days 4-17): Validate the single highest-risk assumption**
- Execute the designed experiment
- Collect all data before reviewing results (batch analysis, not rolling rationalization)
- Hold a structured decision meeting: review data against pre-committed criteria, make a proceed/pivot/kill call, document the learning

**Sprint 2 (Days 18-31): Validate the second highest-risk assumption**
- Same structure; update the assumption map based on Sprint 1 learnings
- If Sprint 1 was a pivot, revise the idea and re-rank the assumption list before beginning Sprint 2

**Sprint 3 (Days 32-45): Validate the third highest-risk assumption**
- By this sprint, problem validation is typically complete and solution validation or willingness-to-pay is being tested

**Gate Decision (Day 46):** After three sprints, make the macro go/no-go call. If the top 3 riskiest assumptions have been validated, proceed to Lean Canvas and MVP definition. If not, either redesign and revalidate or kill.

Total time: 6-8 weeks. A validation plan that takes longer than 8 weeks is not a validation plan -- it is a slow build.

---

### Step 8: Synthesize Learnings and Issue a Recommendation

After the full validation sprint (or as much as has been completed), synthesize the results into a structured summary.

- Restate the original idea and the riskiest assumptions tested
- Document each experiment: method, sample, result, verdict (validated / invalidated / inconclusive)
- State an overall confidence level: Low (0-1 critical assumptions validated), Medium (2 validated, 1 in question), High (3+ validated with strong signals)
- Issue a specific recommendation: proceed to MVP definition, pivot and retest with a revised hypothesis, or kill and preserve learnings
- If proceeding, identify the next validation questions that will be answered during the MVP phase itself (not all assumptions must be resolved pre-MVP -- only the critical ones)

---

## Output Format

```
## Idea Validation Plan: [Idea Name]

### Idea Summary
| Field | Value |
|-------|-------|
| **Product/service** | [One-sentence description -- what it does, not what it is] |
| **Target customer** | [Specific segment with firmographic or demographic qualifiers] |
| **Problem statement** | [Customer frustration in their language, with consequence] |
| **Current alternatives** | [How customers solve this today, including "do nothing"] |
| **Unique value proposition** | [Why customers switch: 10x better/cheaper/faster on which dimension] |
| **Revenue model** | [How money changes hands: subscription/transaction/usage/etc.] |
| **Founder advantage** | [Domain expertise, relationships, data, or distribution edge, or N/A] |

---

### Assumption Map

| # | Assumption | Category | Criticality | Uncertainty | Risk |
|---|-----------|----------|-------------|-------------|------|
| A1 | [Full assumption text] | Problem | H / M / L | H / M / L | H / M / L |
| A2 | [Full assumption text] | Problem | H / M / L | H / M / L | H / M / L |
| A3 | [Full assumption text] | Solution | H / M / L | H / M / L | H / M / L |
| A4 | [Full assumption text] | Solution | H / M / L | H / M / L | H / M / L |
| A5 | [Full assumption text] | Market | H / M / L | H / M / L | H / M / L |
| A6 | [Full assumption text] | Market | H / M / L | H / M / L | H / M / L |
| A7 | [Full assumption text] | Business | H / M / L | H / M / L | H / M / L |
| A8 | [Full assumption text] | Business | H / M / L | H / M / L | H / M / L |

**Riskiest assumptions selected for testing:** A[X] (High/High), A[X] (High/High), A[X] (High/Medium)

**Rationale:** [One sentence explaining why these are the make-or-break assumptions]

---

### Validation Experiments

#### Experiment 1 -- Test Assumption A[X]: [Assumption short title]

| Field | Value |
|-------|-------|
| **Full assumption** | [Complete assumption text] |
| **Hypothesis** | If [condition], then [measurable outcome], because [mechanism] |
| **Experiment method** | [Specific method: problem interviews / landing page / concierge / pre-order / etc.] |
| **Sample size** | [X participants / X page visitors / X email recipients] |
| **Primary metric** | [The one number that determines the outcome] |
| **Success threshold** | [Specific number that validates -- pre-committed] |
| **Failure threshold** | [Specific number that invalidates -- pre-committed] |
| **Decision outcome** | Proceed if ≥ [X] / Pivot if [Y-Z] / Kill if < [Y] |
| **Timeline** | [Start date or sprint] -- [End date or sprint], [X days total] |
| **Cost** | $[X] cash + [X] hours founder time |
| **Data collection method** | [How results will be recorded: interview notes / Typeform / Google Analytics / etc.] |

---

#### Experiment 2 -- Test Assumption A[X]: [Assumption short title]

| Field | Value |
|-------|-------|
| **Full assumption** | [Complete assumption text] |
| **Hypothesis** | If [condition], then [measurable outcome], because [mechanism] |
| **Experiment method** | [Specific method] |
| **Sample size** | [X participants / visitors / etc.] |
| **Primary metric** | [One number] |
| **Success threshold** | [Pre-committed number] |
| **Failure threshold** | [Pre-committed number] |
| **Decision outcome** | Proceed if ≥ [X] / Pivot if [Y-Z] / Kill if < [Y] |
| **Timeline** | [Sprint and days] |
| **Cost** | $[X] cash + [X] hours |
| **Data collection method** | [Method] |

---

#### Experiment 3 -- Test Assumption A[X]: [Assumption short title]

*(Same structure as above)*

---

### Validation Sprint Timeline

| Sprint | Days | Focus | Assumption | Experiment | Primary Metric | Decision Gate |
|--------|------|-------|-----------|------------|----------------|--------------|
| 0 | 1-3 | Idea sharpening | All | Assumption mapping | Assumption map complete | N/A |
| 1 | 4-17 | [Problem / Solution / Market] validation | A[X] | [Method] | [Metric] | Proceed / Pivot / Kill |
| 2 | 18-31 | [Problem / Solution / Market] validation | A[X] | [Method] | [Metric] | Proceed / Pivot / Kill |
| 3 | 32-45 | [Problem / Solution / Market] validation | A[X] | [Method] | [Metric] | Proceed / Pivot / Kill |
| Gate | 46 | Overall decision | All tested | Synthesis | Confidence level | MVP / Pivot / Kill |

---

### Decision Framework

| Decision | Condition | Criteria | Next Step |
|---------|-----------|----------|-----------|
| **Proceed to MVP** | All 3 RATs validated | Primary metrics met success threshold | Use `mvp-definition` skill |
| **Pivot -- reframe problem** | Problem invalidated but related pain found | Interviews reveal adjacent unmet need | Revise idea summary, re-rank assumptions, begin Sprint 1 again |
| **Pivot -- reframe solution** | Problem validated but solution approach rejected | Users want the outcome, not the proposed mechanism | Redesign solution experiment, retest A[X] |
| **Pivot -- reframe segment** | Problem exists but not for stated segment | Different profile emerges in interviews | Redefine target customer, re-rank assumptions |
| **Kill** | Critical assumption invalidated, no pivot signal | Primary metric below failure threshold, no alternative insight | Stop, document full learnings |

---

### Validation Confidence Summary (fill in after experiments)

| Assumption | Status | Evidence | Confidence |
|-----------|--------|----------|-----------|
| A[X] | Validated / Invalidated / Inconclusive | [What data says] | High / Medium / Low |
| A[X] | Validated / Invalidated / Inconclusive | [What data says] | High / Medium / Low |
| A[X] | Validated / Invalidated / Inconclusive | [What data says] | High / Medium / Low |

**Overall Validation Confidence:** Low / Medium / High
**Recommendation:** [Proceed / Pivot / Kill] -- [One sentence rationale]
```

---

## Rules

1. **Test the problem before testing the solution, always.** Building a solution for a non-existent or non-painful problem is the single most common cause of startup failure. Problem validation must precede solution validation regardless of how confident the founder feels. Domain expertise does not exempt you from this rule.

2. **Pre-commit all success and failure thresholds before running any experiment.** If criteria are set after results are seen, the human brain will rationalize any outcome as positive. Write the thresholds in the plan before a single interview is conducted or a single ad dollar is spent.

3. **"Would you use this?" is not a valid interview question.** People cannot reliably predict their own future behavior. The only reliable interview data comes from past behavior: "Tell me about the last time you experienced this problem. What did you do? What did you try? What did it cost you?" Future-directed hypothetical questions produce optimistic but meaningless responses.

4. **Experiments must be cheap enough to be discardable.** If an experiment costs more than $5,000 or takes more than 4 weeks, it has crossed from validation into early product development. Redesign it to be cheaper and faster. The whole point of validation is to fail cheaply and quickly, not to invest before you know.

5. **Separate the founder's conviction from the evidence.** Founders who are deeply passionate about their ideas will unconsciously select confirming evidence. For each experiment result, ask: "If a skeptical investor saw only this data with no context, would they be convinced?" If not, the evidence is not yet sufficient.

6. **"Interesting" and "people liked it" are not validated outcomes.** The validation plan must translate every experiment into a binary: the threshold was met or it was not. Qualitative summaries like "people were really excited" without a specific, countable backing signal are not validation.

7. **A marketplace, platform, or network-effect business requires validating both sides of the market independently.** Never declare a two-sided idea validated by testing only one side. Supply-side validation and demand-side validation are separate experiments with separate success criteria.

8. **Willingness to pay requires a real behavioral test, not a stated preference.** Asking "How much would you pay for this?" produces inflated numbers. Only actual money collected (pre-orders, paid pilots, deposits) or a fake door experiment with real call-to-action conversion validates price point. Survey responses about price are directional only.

9. **Document every experiment result, including invalidations.** The learning from a failed hypothesis is often more valuable than the result of a successful one. Documented invalidations also prevent re-testing the same failed assumption in a future iteration, which is a surprisingly common waste.

10. **Identify the next 3 assumptions that will be tested during the MVP phase.** Not all assumptions must be resolved pre-MVP -- doing so would require building the product anyway. The goal of pre-MVP validation is to resolve the assumptions that could kill the idea entirely. Remaining assumptions should be staged into the MVP's metrics plan.

11. **A high-signal validation result from a non-representative sample is unreliable.** Ten enthusiastic responses from the founder's personal network are not validation -- they are a convenience sample with massive selection and social desirability bias. The sample must come from the actual target customer segment, reached through cold or independent channels.

12. **Regulatory feasibility is an assumption in health, finance, insurance, legal, and education ideas.** A business model that violates HIPAA, SEC regulations, state licensing requirements, or FTC rules is not a viable business regardless of market demand. Add regulatory feasibility as a critical assumption and validate it early by consulting a domain expert or attorney, not by building first.

---

## Edge Cases

### B2B Ideas Where the Buyer and User Are Different People
In enterprise or mid-market B2B contexts, the person who signs the contract (buyer: CFO, CTO, department head) is rarely the person who uses the product daily (user: analyst, operations manager, front-line worker). Both must be validated separately with different experiments. Validate with the buyer: "Will they authorize budget and sign a contract?" Validate with the user: "Will they actually adopt and use this?" Products that buyers purchase but users reject become shelfware within 90 days, resulting in non-renewal. Design one problem interview track for each persona and check for alignment -- sometimes the buyer and user have conflicting incentives (e.g., a cost-reduction tool the buyer wants but the user fears as a job-threat).

### Hardware and Physical Product Ideas
Physical prototypes are expensive, making the standard lean startup loop harder to execute. Apply staged validation: First, validate the problem and willingness-to-pay entirely through interviews, online community research, and fake door tests before touching hardware. Second, validate solution viability using 3D renders, explainer videos, or simulations to test desirability before building anything. Third, use pre-order campaigns (with real payment collection via Stripe or Kickstarter) as the willingness-to-pay test before manufacturing. Only after demand and willingness-to-pay are confirmed should a first physical prototype be built. The cost of the first prototype is the cost of learning, not the cost of the product.

### Idea in a Two-Sided or Multi-Sided Market
Marketplaces and platforms face a chicken-and-egg problem: neither side has value without the other. The validation challenge is sequencing. Identify which side is the harder supply constraint -- this is almost always the professional, service provider, or inventory side. Validate that side first. Use a "concierge marketplace" approach: manually recruit 10-20 supply-side providers and 10-20 demand-side users and make matches by hand, entirely outside any technology. Track whether transactions actually complete and whether both sides return. If the concierge version does not produce repeated transactions, an automated marketplace version will not solve the underlying problem. Only after manual matching validates both sides should platform development begin.

### Technical or Deep Technology Ideas
When the solution depends on technology that may not yet work at the required performance level (AI accuracy thresholds, hardware battery life, material cost curves, latency requirements), technical feasibility itself is a critical assumption that must be staged into the validation plan. Separate technical feasibility validation from market demand validation. Test market demand first (interviews, fake door tests, pre-orders) -- there is no point proving the technology works if nobody wants it. Then validate technical feasibility through minimum technical experiments (proof of concept at lab scale, API prototype, trained model on sample data) before full product development. The sequence is: market risk first, technical risk second.

### Founder with Deep Domain Expertise and Strong Prior Conviction
Domain expertise is a genuine asset for identifying real problems and credible solutions, but it carries a specific validation risk: the founder may assume the problem is so obvious that validation is unnecessary, or may unconsciously design validation experiments that are easy to pass. Counter this by requiring cold outreach to customers the founder does not personally know -- familiar contacts are too likely to provide socially encouraging responses. Specifically, require that at least 60% of interview or experiment participants have no prior relationship with the founder. Also require the founder to write down their strongest counter-argument to the idea before validation begins. This surfaces the most important invalidation scenarios and ensures the experiments are designed to probe weak points, not confirm strong points.

### Pivot During Validation -- Mid-Sprint Adjustment
Sometimes an experiment produces unexpected signal before the sprint ends -- a different customer profile emerges in interviews, a completely different use case keeps coming up, or the problem as stated is wrong but a related adjacent problem is clearly present. Do not continue the planned experiment mechanically when the data is already pointing elsewhere. Acknowledge the insight, pause the current experiment, and perform a structured pivot assessment: Is the new signal strong enough to change the direction? Does the new direction require a fundamentally different assumption map? Who is the new target customer? Pivots during validation are not failures -- they are the lean startup methodology working correctly. Document the original hypothesis, the unexpected finding, the revised hypothesis, and the new experiment design. Do not simply change direction without updating the formal plan.

### Validation for a Regulated Industry (Health, Finance, Legal, Education)
Regulatory constraints can invalidate an otherwise well-validated idea. Treat regulatory feasibility as a critical assumption with its own experiment: identify the specific regulatory framework governing the proposed service (HIPAA for health data, SEC/FINRA for investment advice, state bar requirements for legal services, state insurance licensing, FERPA for education data). Identify whether the proposed business model requires a license, certification, or compliance program that the founding team does not yet possess. Consult with a relevant attorney or compliance expert early -- this is a validation experiment with a cost of $500-$2,000 and a potential outcome of "idea is not viable in current form." This consultation belongs in Sprint 1 alongside problem validation, not Sprint 5 after the product is built.

---

## Example

**Input:** "I want to start a B2B SaaS service that helps small restaurant owners optimize their menu pricing using data analytics. They would upload their weekly sales data as a CSV and get recommendations on which items to reprice, which to remove, and which to promote. I'm thinking $149/month. I used to work as a food and beverage consultant for 8 years so I know this space well."

---

**Output:**

## Idea Validation Plan: MenuPulse -- Restaurant Menu Pricing Analytics

### Idea Summary

| Field | Value |
|-------|-------|
| **Product/service** | SaaS tool that ingests weekly restaurant POS sales data via CSV and generates automated recommendations on menu item pricing, removal, and promotion |
| **Target customer** | Independent restaurant owners with 1-3 locations doing $600K-$4M annual revenue who lack a dedicated finance or operations analyst |
| **Problem statement** | Owners set menu prices and make menu decisions based on gut feel and quarterly accountant reviews, leading to 8-15% gross margin being left unrealized; they have no systematic way to identify underpriced high-performers or margin-dragging slow-movers |
| **Current alternatives** | Manual Excel analysis (rare), accountant quarterly review (lagging), intuition, or no analysis at all (most common) |
| **Unique value proposition** | Provides the same menu engineering analysis that F&B consultants charge $3,000-$8,000 per engagement for -- automatically, from existing POS export data, every week, for $149/month |
| **Revenue model** | Monthly SaaS subscription at $149/month; targeting 200 paying restaurants in year 1 ($358K ARR) |
| **Founder advantage** | 8 years F&B consulting experience with direct relationships to restaurant owner networks; deep familiarity with menu engineering methodology and POS data formats |

---

### Assumption Map

| # | Assumption | Category | Criticality | Uncertainty | Risk |
|---|-----------|----------|-------------|-------------|------|
| A1 | Independent restaurant owners experience menu pricing as a significant, recurring business problem -- not a nuisance they have made peace with | Problem | H | H | H |
| A2 | Owners believe they are leaving meaningful margin on the table due to poor pricing decisions (not that pricing is fine but other problems are bigger) | Problem | H | H | H |
| A3 | Restaurant owners have POS systems that export structured sales data in a usable CSV format | Problem | H | M | H |
| A4 | Owners are willing to trust and act on automated data recommendations for decisions they currently make by intuition | Solution | H | H | H |
| A5 | The CSV upload workflow is low enough friction that owners (or their managers) will complete it weekly without abandonment | Solution | M | H | H |
| A6 | Automated menu engineering analysis produces recommendations that owners find accurate and credible relative to their own judgment | Solution | H | M | H |
| A7 | Independent restaurant owners can be reached and acquired through digital channels at a CAC under $300 | Market | H | H | H |
| A8 | Owners will pay $149/month for menu analytics -- as opposed to paying once for a one-time report or refusing to pay at all | Market | H | H | H |
| A9 | LTV:CAC ratio achieves 3:1 or better given expected churn rates in the restaurant industry | Business | H | H | H |
| A10 | The target restaurant segment is large enough (50,000+ qualifying independent restaurants in the US) to support $1M+ ARR | Business | M | L | L |
| A11 | A restaurant's POS CSV data contains sufficient signal (item-level sales volume, price, time of day) to produce meaningful recommendations without additional integrations | Solution | H | M | H |
| A12 | Restaurant owners have enough time and digital literacy to evaluate a SaaS tool and sign up without a human sales process | Market | M | M | M |

**Riskiest assumptions selected for testing:** A1 (H/H), A4 (H/H), A8 (H/H), A7 (H/H)

**Rationale:** If owners do not feel the pricing problem acutely (A1), there is no market. If they feel it but will not trust automated recommendations (A4), the product does not solve the problem for them. If they trust it but will not pay $149/month (A8), the business model fails. And if they would pay but cannot be reached digitally at a sustainable CAC (A7), the go-to-market is broken. All four must pass for the idea to work.

---

### Validation Experiments

#### Experiment 1 -- Test A1 + A2: Restaurant owners feel menu pricing is a painful, unsolved problem

| Field | Value |
|-------|-------|
| **Full assumption** | Independent restaurant owners (1-3 locations, $600K-$4M revenue) experience menu pricing decisions as a significant source of margin anxiety, not a background nuisance they have accepted |
| **Hypothesis** | If we conduct 12 problem-focused interviews with qualifying restaurant owners using past-behavior questions about pricing and margin decisions, then at least 7 will describe a specific recent instance of making a pricing or menu change that felt uncertain, costly, or based on incomplete information -- because owners managing $600K+ in revenue are repeatedly exposed to commodity cost volatility and competitive pressure that forces margin trade-off decisions |
| **Experiment method** | Problem discovery interviews (12 owners; cold outreach to local restaurant owners via LinkedIn, restaurant association membership lists, and Yelp owner contacts -- NOT founder's existing consulting network for first 8 interviews) |
| **Sample size** | 12 interviews; minimum 8 from cold contacts with no prior founder relationship |
| **Primary metric** | Number of interviewees who describe a specific, recent, unprompted instance of menu pricing or margin-related pain |
| **Success threshold** | 8 out of 12 describe specific pricing/margin pain unprompted, AND at least 5 of those describe it in the top 3 operational challenges |
| **Failure threshold** | Fewer than 5 describe pricing pain in any form, OR pricing is consistently ranked below 5th in their list of operational concerns |
| **Decision outcome** | Proceed to Experiment 2 if ≥ 8/12 / Pivot (reframe problem or segment) if 5-7/12 / Kill pricing angle if < 5/12 |
| **Timeline** | Sprint 1, Days 4-17 (14 days) |
| **Cost** | $0 cash (offer to buy coffee at their restaurant) + 25 hours founder time (outreach, scheduling, conducting, analysis) |
| **Data collection method** | Structured interview notes with tagged themes; record with permission; code responses for: (1) problem mentioned unprompted, (2) rank among operational challenges, (3) specific dollar consequence described |

---

#### Experiment 2 -- Test A4 + A6: Owners will trust and act on automated pricing recommendations

| Field | Value |
|-------|-------|
| **Full assumption** | Restaurant owners who feel the pricing problem will trust a data-driven automated recommendation enough to act on it -- specifically, they will reprice or remove a menu item based on software output rather than relying solely on their own judgment |
| **Hypothesis** | If we manually deliver a menu engineering analysis report (concierge MVP) to 5 restaurant owners who expressed pain in Experiment 1 interviews, using their actual POS data, then at least 3 will take at least one concrete menu action (price change, item removal, or promotional push) within 2 weeks of receiving the report -- because owners who described feeling uncertain about pricing decisions will act when given credible, data-backed guidance |
| **Experiment method** | Concierge MVP: Manually request POS CSV export from 5 willing participants; perform menu engineering analysis manually (founder's domain expertise makes this feasible); deliver a formatted PDF report with 3-5 specific recommendations; follow up after 2 weeks to record actions taken |
| **Sample size** | 5 restaurant owners (recruited from Experiment 1 participants who described high pain) |
| **Primary metric** | Number of owners who take at least one concrete menu action based on the report within 2 weeks |
| **Success threshold** | 3 out of 5 take a concrete action AND at least 2 describe the recommendations as "credible" or "better than what I would have done alone" |
| **Failure threshold** | Fewer than 2 take any action, OR the majority describe recommendations as obvious/already-known (no incremental value) |
| **Decision outcome** | Proceed to Experiment 3 if ≥ 3/5 act / Pivot (reframe recommendation format or depth) if 2/5 act with reservations / Kill automated recommendation approach if < 2/5 act or trust is absent |
| **Timeline** | Sprint 2, Days 18-31 (14 days) |
| **Cost** | $0 cash + 20 hours founder time (data analysis, report creation, follow-up) |
| **Data collection method** | Follow-up interview or email at Day 14; record: action taken (yes/no), specific action described, owner's language about credibility and value |

---

#### Experiment 3 -- Test A8: Owners will pay $149/month for menu analytics

| Field | Value |
|-------|-------|
| **Full assumption** | Independent restaurant owners who feel the pricing problem and find the solution credible will pay $149/month for ongoing access to automated menu analytics -- not just a one-time report, and not a $29/month commodity tool price |
| **Hypothesis** | If we drive 600 unique visitors from targeted Google and Meta ads (targeting keywords: "restaurant menu pricing," "restaurant profit margin," "menu engineering software") to a landing page with a clear value proposition and a $149/month "Start Free Trial" CTA, then at least 30 visitors (5% conversion rate) will click the CTA and enter payment information -- because the $149 price point represents significant value relative to the $3,000-$8,000 consultant alternative for owners who have confirmed this is a real pain |
| **Experiment method** | Smoke test / fake door landing page with real payment capture. Build a single-page site describing the product (use Carrd or Webflow, no-code). Include a "Start 14-Day Free Trial -- $149/month after" button linking to a Stripe checkout. After payment page is reached, display an "Early access -- we'll contact you within 48 hours" message (do not charge the card; this is the measurement point). Drive traffic via $600 in Google Ads targeting restaurant owner keywords |
| **Sample size** | Minimum 600 unique visitors (required for statistical confidence on a 5% conversion rate hypothesis) |
| **Primary metric** | Conversion rate: percentage of unique visitors who click through to the Stripe payment page |
| **Success threshold** | ≥ 5% of visitors reach payment page (30+ out of 600), AND average CPC is under $1.50 (indicating strong keyword-audience match) |
| **Failure threshold** | < 2% conversion rate (fewer than 12 out of 600), OR CPC above $3.00 indicating poor audience targeting or weak message-market fit |
| **Decision outcome** | Proceed to MVP definition if ≥ 5% conversion / Pivot (test $49 or $79 price point, or reframe value prop) if 2-4% / Kill $149 subscription model if < 2% -- test alternative pricing or model |
| **Timeline** | Sprint 3, Days 32-45 (14 days) |
| **Cost** | $600 ad spend + $50 landing page tools + 8 hours founder time = $650 cash + 8 hours |
| **Data collection method** | Google Analytics conversion tracking on payment page reach; Google Ads CPC and CTR data; Hotjar session recordings to identify page abandonment patterns |

---

### Validation Sprint Timeline

| Sprint | Days | Focus | Assumption | Experiment | Primary Metric | Decision Gate |
|--------|------|-------|-----------|------------|----------------|--------------|
| 0 | 1-3 | Idea sharpening | All | Assumption mapping and interview recruiting | Complete assumption map; 12 interview candidates identified | Ready to begin Sprint 1 |
| 1 | 4-17 | Problem validation | A1, A2 | Problem interviews (12 cold contacts) | Owners describing pricing pain unprompted | ≥ 8/12 → Proceed; 5-7 → Pivot; < 5 → Kill |
| 2 | 18-31 | Solution + trust validation | A4, A6 | Concierge MVP with 5 interview participants | Concrete menu actions taken within 14 days | ≥ 3/5 → Proceed; 2 with issues → Pivot; < 2 → Kill solution approach |
| 3 | 32-45 | Willingness-to-pay validation | A8 | Fake door landing page + $600 Google Ads | Visitor-to-payment-page conversion rate | ≥ 5% → Proceed; 2-4% → Pivot price/message; < 2% → Kill $149/month model |
| Gate | 46 | Overall decision | All tested | Synthesis of all three experiments | 3/3 validated = High confidence | Proceed to `mvp-definition` if all pass |

---

### Decision Framework

| Decision | Condition | Criteria | Next Step |
|---------|-----------|----------|-----------|
| **Proceed to MVP** | All 3 RATs validated | A1: ≥ 8/12 pain; A4: ≥ 3/5 act; A8: ≥ 5% convert | Use `mvp-definition` skill; also validate A3 (POS CSV export) and A7 (CAC) during MVP phase |
| **Pivot -- problem reframe** | Pricing pain not validated but cost/margin pain is | Interviews reveal waste or labor cost is the primary concern, not pricing | Reframe as "restaurant cost analytics" -- revise all assumptions, restart Sprint 1 |
| **Pivot -- trust reframe** | Problem validated but owners won't act on automated output | Concierge MVP produced unused recommendations | Explore "coaching" or "advisor" positioning instead of automated tool; humans deliver recommendations supported by data |
| **Pivot -- pricing model** | Problem + solution validated, but $149/month rejected | Landing page conversion 2-4% or price sensitivity interviews point to $49-$79 | Test $79/month landing page; or test one-time "menu audit" report at $299 |
| **Kill** | Problem not painful enough to drive behavior change | < 5/12 describe pain + < 2/5 take action | Document all learnings; consider whether founder's consulting skills are the real product |

---

### Validation Confidence Summary (to be filled after experiments)

| Assumption | Status | Evidence | Confidence |
|-----------|--------|----------|-----------|
| A1: Pricing pain exists and is acute | [Pending] | [12 interviews completed] | [To be filled] |
| A4: Owners will trust automated recommendations | [Pending] | [5 concierge MVP deliveries] | [To be filled] |
| A8: Owners will pay $149/month | [Pending] | [Landing page + ad test results] | [To be filled] |

**Overall Validation Confidence:** To be determined after Sprint 3
**Recommendation:** Issue at Day 46 gate based on all three experiment outcomes

---

**Additional notes for this idea:**

A3 (POS data accessibility) is a High criticality assumption that was not assigned its own experiment sprint because it can be validated during the concierge MVP in Sprint 2 -- when the 5 participants attempt to export and provide their POS CSV, the founder will directly observe whether this is a barrier. If 3 or more participants struggle to provide usable CSV data, A3 must be treated as a RAT and a data integration strategy (direct POS API connections) becomes a requirement before MVP.

A7 (CAC under $300) will receive partial signal from Experiment 3's CPC data, but full validation of the acquisition model belongs in the MVP phase when a real product can be trialed and conversion through a full funnel can be measured.
