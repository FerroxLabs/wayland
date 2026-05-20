---
name: ansoff-matrix
description: |
  Produces a completed Ansoff growth-share matrix analysis with growth strategy
  selection, risk assessment, and implementation recommendations. Use when the
  user asks to evaluate growth strategies, decide between market penetration,
  market development, product development, or diversification, or plan growth
  direction for a business.
  Do NOT use for product portfolio evaluation (use bcg-matrix), competitive
  landscape analysis (use competitive-analysis), or full go-to-market planning
  (use go-to-market-strategy).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy planning entrepreneurship decision-making"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Ansoff Matrix

## When to Use

**Use this skill when:**
- The user asks how a business should grow and needs a structured framework to evaluate directional options -- "should we expand to new markets or build new products for existing customers?"
- The user's business has hit a growth plateau in its current market and needs to identify the next growth lever -- typically signaled by YoY growth rates declining by more than 30% of their prior rate
- The user is preparing a board presentation, investor deck, or strategic planning session and needs to justify a growth direction with risk-rated alternatives
- The user explicitly mentions choosing between market penetration, market development, product development, or diversification
- The user wants to sequence growth initiatives over a 12-24 month horizon and needs a framework to prioritize competing opportunities with different risk profiles
- The user is a founder, CEO, or strategy leader stress-testing whether they are pursuing the right growth path given resource constraints
- The user has a specific revenue or market share target and needs to evaluate whether organic strategies can realistically achieve it

**Do NOT use when:**
- The user needs to classify an existing product portfolio by market growth and relative market share -- use `bcg-matrix` instead, which maps cash generation vs. investment need across a portfolio
- The user needs a competitive landscape analysis identifying rivals, their positioning, and differentiation gaps -- use `competitive-analysis` instead
- The user has already selected a growth strategy and needs a detailed go-to-market plan with channel strategy, pricing, and launch sequencing -- use `go-to-market-strategy` instead
- The user is evaluating an M&A target or acquisition strategy as a growth mechanism -- Ansoff can frame the strategic rationale, but deal analysis requires a separate financial modeling skill
- The user is asking about operational efficiency, cost structure, or margin improvement -- growth strategy direction is a different problem from operational performance
- The user wants a full business plan -- the Ansoff matrix is one input into a business plan, not a substitute for it

---

## Process

### Step 1: Gather Required Inputs Before Producing Any Analysis

Do not produce the matrix until you have the following inputs. If any are missing, ask for them explicitly. Vague inputs produce useless Ansoff analyses.

- **Current revenue and growth rate:** Ask for current ARR/revenue and the growth rate for the past 1-2 years. A deceleration from 60% to 20% YoY is a qualitatively different situation than growth that has always been 15%. Declining growth rates signal penetration ceiling; steady low growth may signal execution gaps.
- **Core product or service description:** Understand exactly what the company sells -- not the category ("software") but the specific value delivered ("predictive churn scoring for subscription businesses"). The specificity matters when evaluating what counts as "new" versus "existing" product.
- **Current markets served:** Capture geography (US only? EU? global?), customer segment (SMB, mid-market, enterprise?), and industry vertical. A company serving "SMB e-commerce in the US" has very different adjacency options than one serving "enterprise logistics in North America."
- **Total Addressable Market (TAM) and current penetration estimate:** Even a rough estimate matters. If the company has 2% penetration in a $500M TAM, penetration is viable. If it has 40% penetration, the ceiling is near and development strategies must be prioritized.
- **Growth target with timeline:** Revenue goal, market share goal, or customer count goal -- with a specific deadline. Vague targets ("we want to grow") produce vague recommendations. A 3x revenue target in 24 months has very different implications than 20% growth in 12 months.
- **Available resources:** Budget available for growth initiatives, team headcount that could be deployed, and critical capability strengths (sales-led? product-led? distribution partnerships?). The best strategy on paper is worthless if the company cannot execute it.
- **Risk tolerance:** Conservative (protect existing revenue, limit downside), moderate (accept 18-24 month payback on investments, tolerate failed experiments below a threshold), or aggressive (willing to bet the company on a new direction, accept high short-term losses for long-term position).

### Step 2: Estimate Market Penetration Ceiling

Before evaluating all four quadrants, establish the penetration ceiling -- the maximum realistic revenue achievable by growing within existing markets with existing products. This anchors the entire analysis.

- Calculate current penetration rate: (Company Revenue or Customer Count) / (Estimated Total Addressable Market in same unit). If the user cannot provide TAM, estimate it based on the description and note the assumption.
- Apply the penetration ceiling rule: In most B2B markets, a single vendor rarely exceeds 15-25% market share without acquisition. In fragmented SMB markets, 5-10% is often the practical ceiling. Consumer markets with network effects can reach 30-60%.
- Calculate the revenue gap: How much additional revenue is available through penetration before hitting the ceiling? Compare this against the growth target. If penetration alone can close the gap, it is the primary recommendation. If not, additional strategies must be layered in.
- Identify penetration levers specifically: pricing (discounting to displace competitors, raising prices with bundling), marketing investment (increased spend or channel expansion within the existing segment), retention improvement (reducing churn, which mechanically grows net revenue retention), competitive displacement (named competitor accounts the company can target). These are not generic tactics -- identify which ones apply.
- Estimate the timeline to ceiling: At current growth rate, when does the company hit the penetration ceiling? If the ceiling is 3 years away and the growth target is 2 years, penetration alone is likely insufficient.

### Step 3: Evaluate Market Development Options

Market development means taking an existing product to new markets. The key analytical challenge is identifying which "new markets" are genuinely accessible versus aspirational.

- Define market dimensions: New geography (expanding from US to UK, EU, APAC), new customer segment (moving from SMB to mid-market or enterprise), new vertical (moving from e-commerce analytics to retail analytics), new channel (from direct sales to partner/reseller). Each of these is a different type of market development with different cost structures, timelines, and risks.
- Assess product-market fit transfer: Does the existing product solve the same problem in the new market? The higher the fit transfer, the lower the development cost and risk. A compliance software tool expanding from financial services to healthcare has moderate fit transfer -- the workflow is similar but regulatory specifics differ. A restaurant management tool expanding from US to Japan has low fit transfer due to operational differences.
- Estimate entry costs by market type: Geographic expansion to English-speaking markets (UK, Australia, Canada) typically costs 15-25% of the domestic CAC for an equivalent sale, due to language and cultural proximity. Non-English geographic expansion typically costs 40-80% more per acquisition due to localization, support, and sales overhead. Segment expansion (SMB to enterprise) often requires building an enterprise sales motion (longer cycles, procurement processes, security reviews), which typically takes 12-18 months and $500K-$2M in sales infrastructure investment before meaningful revenue materializes.
- Identify the beachhead market: Do not recommend "expand internationally" or "target enterprise." Identify a specific beachhead -- the single most attractive new market to enter first. The beachhead should have the highest probability of success with the lowest resource requirement, even if it is not the largest opportunity. Use the beachhead to validate the market development approach before expanding further.
- Flag capability gaps: Sales team coverage, local partnerships, language/localization, regulatory compliance, payment infrastructure, customer success capacity. Every gap increases timeline and investment.

### Step 4: Evaluate Product Development Options

Product development means creating new products or significant extensions for existing customers. The key risk here is overbuilding without validating demand.

- Distinguish between product extension and new product: Adding a new module, feature bundle, or service tier to the existing product is a product extension (lower risk, faster to build, sells to existing customers). Creating an entirely new product with its own brand, pricing, and go-to-market is a new product (higher risk, longer timeline, requires parallel sales motion). Both are product development in Ansoff terms, but they have very different resource profiles.
- Assess existing customer demand signals: What are customers requesting? What adjacent problems do they have that the company is not solving? NPS verbatims, support ticket themes, sales call objections, and churn reasons are all demand signals. If there is no evidence of demand from existing customers, product development is speculative.
- Estimate build vs. buy vs. partner: Building new product capability from scratch typically takes 6-18 months and requires significant engineering capacity. Acquiring a small company with the needed capability can compress timeline to 3-6 months but introduces integration risk and capital requirement. Partnering (white-labeling, OEM, referral) can launch in 1-3 months but limits economics. For each product opportunity, specify which path is appropriate.
- Calculate ARPU uplift potential: How much more revenue per existing customer would the new product generate? A product extension that drives 20-30% ARPU uplift on an existing base is a high-confidence, capital-efficient growth lever. Apply the uplift to the existing customer base to estimate total revenue impact.
- Identify the R&D risk: What is the probability that the product is built but customers do not adopt it? This is the core product development risk -- it is different from market risk (demand exists but the company cannot capture it). De-risk it through customer co-development, paid pilots, or a minimum viable product validated before full investment.

### Step 5: Evaluate Diversification Options

Diversification -- new products for new markets -- is the highest-risk quadrant and should be recommended sparingly. The analysis here is mostly about ruling it out or setting conditions for it.

- Distinguish related from unrelated diversification: Related diversification leverages existing capabilities, distribution, brand, or technology in a new market (a marketing analytics company building a financial analytics product). Unrelated diversification (a marketing analytics company building a hardware device) has no capability transfer and should almost never be recommended except for large conglomerates with specific portfolio reasons.
- Apply the diversification justification test: Diversification is justified only when (a) existing markets are structurally declining or commoditizing, (b) the company has excess capital beyond what penetration and development strategies can absorb, or (c) there is a specific acquisition or partnership opportunity that dramatically reduces the execution risk. If none of these conditions apply, explicitly say so.
- Quantify the risk premium: Diversification has a historically high failure rate. Research by Ansoff himself and subsequent strategy scholars indicates failure rates of 50-70% for unrelated diversification and 30-50% for related diversification. Frame this explicitly in the analysis -- the expected value calculation must account for failure probability, not just upside scenario.
- If recommending diversification: specify the related capability the company is leveraging, the minimum viable entry approach (pilot, acquisition target, JV partner), the capital required, the decision gate at which the company would abandon the effort, and the fallback plan if it fails.

### Step 6: Build the Strategy Evaluation Table

Populate a structured comparison across all four quadrants using consistent metrics:

- **Growth Potential:** Estimate in revenue terms ($X additional annual revenue) and as a percentage of current revenue. Use a range (e.g., $2M-$4M) rather than a point estimate, with the range reflecting execution variability. Show the basis for the estimate (e.g., "20% ARPU uplift on 200 customers at $25K ACV = $1M").
- **Risk Level:** Score Low / Medium / High with 2-3 specific risk factors per quadrant. Risk factors must be context-specific, not generic. "Market development risk: UK e-commerce market has high concentration among 5 major platforms, creating dependency risk" is specific. "Market development is risky" is not.
- **Investment Required:** Estimate total investment over the strategy's execution horizon. Break it into major categories (people, marketing, technology, infrastructure). Do not use a single dollar figure -- ranges with assumptions are more credible and more useful.
- **Timeline to Revenue:** How long until the strategy generates meaningful revenue? Define "meaningful" as the first milestone where revenue from the strategy represents at least 10% of current ARR. This creates a concrete reference point.
- **Strategic Fit:** Score High / Medium / Low based on alignment with existing capabilities, brand positioning, and team expertise. A strategy with high growth potential but low strategic fit is more dangerous than a lower-upside strategy the company can actually execute.

### Step 7: Produce the Recommendation with Sequencing Logic

The recommendation section is the most important output. It must be specific, justified, and actionable.

- **Name the primary strategy and explain why it beats the alternatives** -- not just why it is good, but why it ranks above the other three options given this company's specific situation.
- **Apply the resource constraint test:** The recommended strategy must be executable with the company's available resources. Do not recommend a strategy that requires doubling the team if the user has told you budget is constrained.
- **Sequence multi-strategy approaches carefully:** If a single strategy cannot achieve the growth target, combine strategies with explicit sequencing. The safest sequencing is: maximize penetration first (lowest risk, generates cash to fund next strategy), then pursue development (market or product based on fit), then optionally layer diversification. Do not recommend two high-risk strategies simultaneously unless the company has the capital and management bandwidth to absorb parallel execution risk.
- **Identify the sequencing trigger:** What event or metric signals it is time to move from the primary to the secondary strategy? "Begin Market Development when penetration growth rate falls below 10% YoY" is a clear trigger. "Start the next phase when ready" is not.
- **Flag strategies to avoid and explain why** -- this is not a throwaway comment. Explain what would happen to the company if it pursued the wrong strategy, which makes the recommendation more credible and helps the user understand the stakes.

### Step 8: Build the Implementation Roadmap

Translate the recommended strategy into a time-phased roadmap with decision gates.

- **90-day milestones:** Identify 2-3 specific actions executable in 90 days that validate the strategy direction before major investment is committed. For market development: signed LOIs or paid pilots in the target market. For product development: a customer advisory board validation session or paid design partner agreement. For penetration: a measurable improvement in conversion rate or NPS.
- **6-month milestones:** Revenue and customer metrics that confirm the strategy is working. Specify the number -- not "meaningful traction" but "15 paying customers in the new segment" or "$500K incremental ARR."
- **12-month goals:** The annual revenue milestone that the strategy should contribute, with a clear statement of whether it puts the company on track for the 24-month growth target.
- **Go/No-Go criteria at each gate:** Define exactly what metric triggers continuation versus pivot. If 90-day validation shows fewer than X customers, pause and diagnose before proceeding. If 6-month revenue is below Y, consider whether the strategy or the execution is the problem. These gates limit downside by preventing indefinite investment in a failing strategy.
- **Resource allocation by phase:** At each phase, specify what team and budget is consumed. Strategies that look affordable in aggregate often front-load costs -- identify when cash requirements peak.

---

## Output Format

```
## Ansoff Growth Strategy: [Company Name]

**Current Position:** [Core product/service] serving [specific customer segment] in [geography]
at [$X revenue], [N] customers, growing at [X%] YoY (down from [X%] prior year)
**Current Penetration Estimate:** ~[X%] of a ~[$XM] TAM
**Growth Target:** [$X revenue / X customers / X% market share] within [N months]
**Required CAGR to Target:** [X%]
**Risk Tolerance:** [Conservative / Moderate / Aggressive]
**Analysis Date:** [Date]

---

### Ansoff Matrix

```
                              PRODUCTS
                    EXISTING                  NEW
              +----------------------+----------------------+
              |  MARKET PENETRATION  |  PRODUCT DEVELOPMENT |
   EXISTING   |  Risk: LOW           |  Risk: MEDIUM        |
   MARKETS    |  Potential: $[X-Y]M  |  Potential: $[X-Y]M  |
              |  Fit: [H/M/L]        |  Fit: [H/M/L]        |
              |  Verdict: [PURSUE /  |  Verdict: [PURSUE /  |
              |  SECONDARY / AVOID]  |  SECONDARY / AVOID]  |
              +----------------------+----------------------+
              |  MARKET DEVELOPMENT  |  DIVERSIFICATION     |
   NEW        |  Risk: MEDIUM        |  Risk: HIGH          |
   MARKETS    |  Potential: $[X-Y]M  |  Potential: $[X-Y]M  |
              |  Fit: [H/M/L]        |  Fit: [H/M/L]        |
              |  Verdict: [PURSUE /  |  Verdict: [PURSUE /  |
              |  SECONDARY / AVOID]  |  SECONDARY / AVOID]  |
              +----------------------+----------------------+
```

---

### Penetration Ceiling Analysis

**Current Market Share:** [X%] of [$XM TAM]
**Estimated Penetration Ceiling:** [X%] (~[$XM maximum revenue from current market/product)
**Revenue Gap to Ceiling:** [$XM]
**Time to Ceiling at Current Growth Rate:** [X years / already near ceiling]
**Penetration Ceiling Verdict:** [Can penetration alone close the gap to the growth target? Yes / Partial / No]

---

### Strategy Evaluation Table

| Strategy | Addl. Revenue Potential | Risk Level | Key Risk Factors | Est. Investment | Time to First $[X] | Strategic Fit |
|---|---|---|---|---|---|---|
| Market Penetration | $[X-Y]M | LOW | [2-3 specific risks] | $[X-Y]K | [N months] | [HIGH/MED/LOW] |
| Market Development | $[X-Y]M | MEDIUM | [2-3 specific risks] | $[X-Y]K-$[X]M | [N months] | [HIGH/MED/LOW] |
| Product Development | $[X-Y]M | MEDIUM | [2-3 specific risks] | $[X-Y]K-$[X]M | [N months] | [HIGH/MED/LOW] |
| Diversification | $[X-Y]M | HIGH | [2-3 specific risks] | $[X]M+ | [N months] | [HIGH/MED/LOW] |

---

### Quadrant 1: Market Penetration (Existing Product × Existing Market)

**Growth Potential:** $[X-Y]M additional revenue
**Revenue Basis:** [Show the math -- e.g., "Reducing churn from 12% to 8% on $5M ARR = $200K net revenue retention improvement per year; acquiring 40 net new customers at $25K ACV = $1M"]

**Specific Tactics:**
1. [Tactic name]: [Specific action, e.g., "Introduce a SMB tier at $499/mo to compete with [generic competitor type] and capture price-sensitive e-commerce brands below current ICP"]. Expected impact: [+$X ARR / +X customers].
2. [Tactic name]: [Specific action]. Expected impact: [+$X ARR / +X customers].
3. [Tactic name]: [Specific action]. Expected impact: [+$X ARR / +X customers].

**Risk Factors:**
- [Specific risk, e.g., "Price reduction to compete at low end may cannibalize existing $25K ACV customers if they downgrade to the lower tier"]
- [Specific risk, e.g., "Increased marketing spend faces diminishing returns in a segment where top 500 e-commerce brands are already aware of the product"]

**Penetration Ceiling:** $[X]M (~[X%] market share). At current growth rate, ceiling is reached in approximately [N] years.
**Verdict:** [PURSUE AS PRIMARY / PURSUE AS COMPLEMENT / CEILING ALREADY NEAR -- SECONDARY ONLY]

---

### Quadrant 2: Market Development (Existing Product × New Markets)

**Growth Potential:** $[X-Y]M additional revenue
**Revenue Basis:** [Show the math -- e.g., "UK e-commerce market is ~30% of US market. Capturing 1% in 18 months at comparable ACV = ~60 customers × $25K = $1.5M"]

**Target New Markets (ranked by accessibility):**
1. **[Market 1 -- e.g., UK/EU e-commerce]:** Size: ~[$XM TAM for this product]. Product-market fit transfer: [High/Medium/Low] because [reason]. Entry cost estimate: [$X]. Timeline to first 10 customers: [N months].
2. **[Market 2 -- e.g., mid-market US retail/DTC brands]:** Size: ~[$XM TAM]. Fit transfer: [H/M/L] because [reason]. Entry cost estimate: [$X]. Timeline to first 10 customers: [N months].
3. **[Market 3 -- optional third adjacent market]:** [Same structure].

**Required Capability Investments:**
- [Specific gap, e.g., "International billing and tax infrastructure (Stripe Tax or equivalent): ~$30K setup + 3 months engineering"]
- [Specific gap, e.g., "UK-based sales/success coverage: 1 hire at £70-80K + 6 months ramp time before productive"]
- [Specific gap, e.g., "Segment-specific case studies and ROI data for new vertical: 3-month content investment"]

**Risk Factors:**
- [Specific risk]
- [Specific risk]

**Verdict:** [PURSUE AS PRIMARY / PURSUE AS SECONDARY / NOT RECOMMENDED -- with rationale]

---

### Quadrant 3: Product Development (New Product × Existing Markets)

**Growth Potential:** $[X-Y]M additional revenue
**Revenue Basis:** [Show the math -- e.g., "Attribution add-on at $500/mo × 40% adoption of 200 customers = 80 customers × $6K/yr = $480K incremental ARR in year 1"]

**Product Opportunities (ranked by validated demand):**
1. **[Product/feature name -- e.g., Attribution Analytics module]:** Demand signal: [specific evidence, e.g., "Mentioned in 35% of support tickets and 4 of last 10 NPS responses"]. Build vs. Buy vs. Partner: [recommendation]. Dev timeline: [N months]. ARPU uplift: [+$X/customer]. Investment: [$X].
2. **[Product/feature name -- e.g., Competitor Benchmarking dashboard]:** Demand signal: [evidence]. Build/Buy/Partner: [rec]. Timeline: [N months]. ARPU uplift: [+$X]. Investment: [$X].

**Build/Buy/Partner Analysis:**
- Build: [When this makes sense, estimated cost and timeline for this specific context]
- Acquire: [Whether there are acqui-hire or small acquisition targets in adjacent space; estimated cost $1M-$5M for typical SaaS acqui-hire]
- Partner/OEM: [Whether white-labeling a complementary product is viable; timeline advantage]

**Risk Factors:**
- [Specific risk, e.g., "Feature development risk: previous product extensions have taken 2x estimated time, creating 6-month delays"]
- [Specific risk, e.g., "Adoption risk: existing customers may not pay for add-ons if they expect features to be included in base plan"]

**Verdict:** [PURSUE AS PRIMARY / PURSUE AS SECONDARY / NOT RECOMMENDED -- with rationale]

---

### Quadrant 4: Diversification (New Product × New Market)

**Type of Diversification Available:**
- **Related:** [What existing capability could be leveraged -- e.g., "Marketing data infrastructure could serve adjacent verticals like subscription SaaS or media"]
- **Unrelated:** [If applicable -- e.g., "Entering commerce logistics or payments would be unrelated; no existing capability transfer"]

**Conditions That Would Justify Diversification:**
1. [Specific condition, e.g., "E-commerce market experiences a structural contraction of >30% within 12 months (e.g., regulatory change)"]
2. [Specific condition, e.g., "Company reaches $15M ARR with excess capital and has exhausted penetration and development upside"]
3. [Specific condition, e.g., "A specific acquisition target emerges that dramatically reduces execution risk"]

**Risk Assessment:**
- Historical failure rate for related diversification: 30-50%
- Historical failure rate for unrelated diversification: 50-70%
- Investment required before validation: [$X-Y]M
- Time before meaningful revenue: [18-36 months]

**Verdict:** NOT RECOMMENDED at current stage. [Rationale specific to this company.]

---

### Primary Recommendation

**Strategy:** [Strategy Name]
**Rationale:** [3-5 sentences explaining why this strategy -- not just why it is good, but why it ranks above alternatives given this company's specific penetration ceiling, resource level, risk tolerance, and growth target. Include a direct comparison to the runner-up strategy.]

**Secondary Strategy:** [Strategy Name]
**Rationale:** [Why this complements the primary and when to activate it]

**Sequencing Trigger:** [The specific metric that signals it is time to activate the secondary strategy, e.g., "Begin Product Development investment when Market Development has generated at least $1M incremental ARR, confirming execution capacity for a second motion"]

**Strategies Ruled Out:**
- [Strategy]: [Reason it was ruled out, stated as a consequence, e.g., "Diversification was ruled out because the 30-50% failure rate for related diversification would put the $15M ARR target at risk, and there are no structural reasons to abandon the existing market"]

---

### Implementation Roadmap

| Phase | Timeline | Key Actions | Success Metric | Go/No-Go Criteria |
|---|---|---|---|---|
| Validate | Month 1-3 | [2-3 specific actions] | [Specific metric, e.g., "5 signed pilots in new market at full ACV"] | [Below X: stop and diagnose. Above X: proceed to build phase] |
| Build | Month 3-6 | [2-3 specific actions] | [e.g., "$500K new ARR, 20 new customers"] | [Below $300K: reassess strategy. Above $300K: proceed] |
| Scale | Month 6-12 | [2-3 specific actions] | [e.g., "$1.5M incremental ARR, 60 new customers"] | [Below $1M: revisit targeting. Above $1M: begin secondary strategy] |
| Expand | Month 12-24 | [Activate secondary strategy, scale primary] | [e.g., "$5M total incremental ARR across both strategies"] | [Full commitment or major pivot decision] |

**Resource Allocation:**

| Phase | Headcount | Budget | Primary Cost Driver |
|---|---|---|---|
| Month 1-3 | [N FTE] | $[X-Y]K | [e.g., "1 market development sales hire, content localization"] |
| Month 4-6 | [N FTE] | $[X-Y]K | [e.g., "Customer success capacity for new segment, partner development"] |
| Month 7-12 | [N FTE] | $[X-Y]M | [e.g., "Full sales team expansion, product extension build"] |
| Month 13-24 | [N FTE] | $[X-Y]M | [e.g., "Secondary strategy activation, infrastructure scaling"] |

---

### Gap-to-Target Analysis

| Growth Source | ARR Contribution (24 months) | Confidence | Dependency |
|---|---|---|---|
| Market Penetration | $[X]M | [High/Med/Low] | [e.g., "Churn reduction to 8% by month 6"] |
| Market Development -- [Market 1] | $[X]M | [H/M/L] | [e.g., "First UK hire onboarded by month 3"] |
| Market Development -- [Market 2] | $[X]M | [H/M/L] | [Dependency] |
| Product Development (if applicable) | $[X]M | [H/M/L] | [Dependency] |
| **Total Projected** | **$[X]M** | | |
| **Gap to Target** | **$[X]M shortfall or surplus** | | |

[If there is a gap: state whether the gap can be closed by accelerating existing strategies, adding a third growth lever, or whether the growth target timeline needs to be extended.]
```

---

## Rules

1. **Never skip the penetration ceiling analysis.** The most common Ansoff mistake is recommending market development or product development before exhausting -- or quantitatively demonstrating the exhaustion of -- penetration opportunity. Always calculate the estimated ceiling before recommending any strategy beyond penetration. Show the math.

2. **Always evaluate all four quadrants, even if ruling three of them out.** A user who hears "I've considered diversification and ruled it out because X" trusts the recommendation more than one who receives a one-quadrant analysis. Ruling out a quadrant is itself strategic guidance.

3. **Require a growth target before producing a recommendation.** Without a specific target (revenue, customers, market share) and timeline, the analysis cannot determine whether a given strategy is sufficient. If the user has not provided a target, ask before proceeding. The target determines whether a single strategy is enough or multiple strategies must be sequenced.

4. **Risk labels must be accompanied by specific risk factors, not just a Low/Medium/High score.** "Medium risk" is not guidance. "Medium risk: entering the UK market requires a local sales hire who takes 6 months to ramp, creating a revenue delay; and UK GDPR compliance requires 2-3 months of legal and engineering investment before launch" is guidance.

5. **Growth potential estimates must show the math.** Do not write "$3-5M growth potential" without showing the calculation basis. The calculation might be wrong -- but it exposes the assumptions so the user can correct them. An unsupported number creates false confidence.

6. **Market Development and Product Development are equally risky in Ansoff's original framework -- do not systematically rank one above the other.** The correct ranking depends on the company's specific capability profile. A product-led company with weak sales often has higher fit for Product Development. A sales-led company with weak engineering often has higher fit for Market Development. Assess fit explicitly rather than defaulting to a fixed hierarchy.

7. **Diversification should be the primary recommendation in fewer than 5% of cases.** If you find yourself recommending diversification as the primary strategy, check whether the user's existing market is actually exhausted or declining, and whether the company has the capital to absorb the failure rate. If neither condition is clearly met, return to development strategies.

8. **Sequencing must include a trigger, not just an order.** "Do penetration first, then market development" without a trigger metric means the user will either move too early (before penetration is genuinely exhausted) or too late (staying in penetration mode while the market window for development closes). Every sequencing recommendation must include the specific metric that triggers the transition.

9. **The implementation roadmap must include go/no-go criteria at every phase gate.** A roadmap without decision gates is a plan without risk management. If Month 3 validation shows fewer than 5 signed pilots, the company should stop spending on Month 4-6 activities until it diagnoses the problem. Gate criteria should be specific numbers, not qualitative assessments like "good progress."

10. **If the projected strategies cannot close the gap to the growth target, say so explicitly.** Do not force the math to work. If $15M ARR in 24 months requires a 73% CAGR and the strategies can realistically deliver 45% CAGR, the right answer is to tell the user the target timeline is likely 36 months at realistic execution, or that the target requires additional capital or M&A to achieve. Intellectual honesty is more valuable than optimism in a growth strategy.

11. **For startups (pre-product-market fit or under $1M ARR), Market Penetration is almost always the only appropriate primary strategy.** Recommending market development or product development to a pre-PMF startup is dangerous -- it dilutes the focus required to establish a repeatable revenue motion. If the user signals a very early stage, flag this explicitly and apply the Ansoff analysis with a strong caveat about sequencing PMF before growth.

12. **Distinguish between related and unrelated diversification every time diversification is analyzed.** They have fundamentally different risk profiles. Related diversification (capability transfer exists) has a 30-50% failure rate in academic literature. Unrelated diversification (no capability transfer) has a 50-70% failure rate. Never present diversification as a single-risk category.

---

## Edge Cases

### 1. The Market is Actually Saturated, Not Declining
A company may report slowing growth and assume their market is saturated, when the real problem is competitive displacement, poor retention, or a CAC/ACV mismatch. Before accepting saturation as given, ask for the evidence: Is total market growth slowing, or just the company's share growth? If the total market is still growing at 15-20% but the company is growing at 5%, the problem is competitive positioning, not market saturation -- and the right response is penetration strategy improvement (competitive displacement, pricing adjustment, retention investment), not market development. Explicitly distinguish between "market is saturating" and "our penetration is stalling."

### 2. The User Wants to Pursue Diversification Immediately
Challenge this before proceeding. Ask the user: What evidence shows that existing markets and products are exhausted or inadequate? What specific opportunity in the new market makes the risk justified? Have you modeled the failure scenario? Most users who ask for diversification analysis are actually describing a product extension (Product Development) or a new segment (Market Development) that they are labeling as diversification. Reframe the request by clarifying what is "new" about the product and what is "new" about the market. If they genuinely mean an entirely new product in an entirely new market, walk through the failure rate data explicitly and ask whether the company has the capital to survive a failed diversification attempt.

### 3. Two Strategies are Equally Viable (Tied Recommendation)
Sometimes Market Development and Product Development genuinely score equally. Do not artificially break the tie with a weak justification. Instead, present both as co-primary strategies and sequence them based on which one can be validated fastest and cheapest. The faster-to-validate strategy goes first. If both can be validated in the same timeframe, assess which one consumes less critical resource -- typically, if the company is engineering-constrained, Market Development (which does not require building new product) should precede Product Development. If the company is sales-constrained, Product Development (which leverages existing customer relationships) should precede Market Development. Make the constraint the deciding factor.

### 4. Conglomerate or Multi-Business-Unit Company
Applying Ansoff at the corporate level for a conglomerate produces a meaningless analysis -- a diversified business cannot meaningfully define a single "existing product" and "existing market." In this case, apply the Ansoff analysis at the business unit level for each major unit. Then provide a portfolio-level summary noting which units are in which quadrant and what the aggregate resource allocation implication is. At the corporate level, the relevant question is portfolio balance: does the overall portfolio have enough penetration-stage businesses generating cash to fund development-stage businesses? Reference the BCG matrix skill for the portfolio-level classification if needed, and use the Ansoff analysis to determine the directional strategy for each unit.

### 5. Rapid Market Decline (Existing Market Structurally Shrinking)
When the existing market is declining -- not slowing, but actually contracting due to structural forces (regulatory change, technological obsolescence, channel disruption) -- the standard Ansoff priority order inverts. Market Penetration has a narrow and closing window. The appropriate analysis is: (a) Quantify the decline rate and estimate how many years of viable penetration remain; (b) Prioritize Market Development aggressively to migrate the customer base to a stable or growing adjacent market; (c) Evaluate Product Development as a mechanism to retain customers who cannot follow to new markets; (d) Frame Diversification as strategic survival rather than growth optionality. Document the market decline evidence clearly -- declining market analysis is more urgent than growth analysis and should be framed as risk mitigation.

### 6. International Expansion Requested but User Has Not Considered Localisation Costs
Users often underestimate what international Market Development actually costs. If a user mentions international expansion, flag three categories of underestimated costs before the analysis proceeds: (a) Regulatory and compliance costs -- GDPR for EU, data residency requirements, local business registration, industry-specific compliance (finance, health) in each country -- often $50K-$200K in legal and technical work before the first sale; (b) Go-to-market investment -- whether the company sells direct (requires local sales hire at $80-150K fully loaded in major markets, 6-9 month ramp) or through partners (requires 6-12 months of partner recruitment and enablement before revenue materialises); (c) Support and success capacity -- serving customers in different time zones and languages requires either staffing for coverage or accepting a degraded customer experience. International expansion is not a low-cost Market Development option; it is a moderate-to-high investment that requires 12-24 months to produce meaningful return.

### 7. Growth Target Requires a CAGR That No Single Strategy Can Deliver
When the gap-to-target analysis shows that even the most optimistic strategy execution leaves a significant shortfall, be direct. Lay out three realistic responses: (a) Extend the timeline -- the target is achievable but requires 36 months rather than 24; (b) Increase investment -- the target is achievable in 24 months with a larger capital commitment than currently planned; (c) Add M&A as a growth lever -- inorganic growth (acqui-hire, tuck-in acquisition, strategic partnership with revenue-sharing) can close gaps that organic strategies cannot. The Ansoff matrix is an organic strategy framework, so note this explicitly as a boundary -- if M&A is needed, the user should reference a separate M&A strategy or inorganic growth skill.

### 8. Single-Product Startup That Has Not Yet Reached Product-Market Fit
If the company is pre-PMF (typically signaled by high churn >15% annually, NPS below 30, inconsistent sales motion, or the founder describing "still figuring out who our best customers are"), the Ansoff analysis should be produced but heavily qualified. Market Penetration is not only the lowest-risk strategy -- it is the required strategy. All other quadrants should be explicitly labelled "Not Applicable Until PMF Achieved" with a brief explanation that attempting Market Development without a repeatable sales motion means burning capital in a new market while the core product problem is unresolved, and attempting Product Development before understanding the existing product's customer deeply enough to know what else they need is speculative. Recommend a modified roadmap: achieve PMF milestones (reduce churn below 8%, NPS above 40, 3 consecutive months of consistent new ACV), then revisit the full Ansoff analysis.

---

## Example

**Input:** "We run a B2B SaaS company offering automated invoice processing and AP automation for mid-market US manufacturing companies. We're at $8M ARR with 160 customers, average ACV of $50K. Growth has slowed from 55% two years ago to 22% last year to a projected 18% this year. We want to reach $20M ARR in 2 years. We have a team of 45, engineering is our constraint (8 engineers, backlog is 14 months). Our risk tolerance is moderate. We have about $3M in reserve capital available for growth initiatives."

**Output:**

---

## Ansoff Growth Strategy: [AP Automation Co.]

**Current Position:** Automated invoice processing and AP automation SaaS for US mid-market manufacturing companies. $8M ARR, 160 customers, $50K average ACV, 45-person team (8 engineers, 14-month backlog).
**Current Penetration Estimate:** ~1.6% of an estimated $500M mid-market US manufacturing AP automation TAM
**Growth Target:** $20M ARR within 24 months ($12M incremental ARR, 2.5x growth, ~58% CAGR)
**Required CAGR to Target:** 58%
**Risk Tolerance:** Moderate
**Resource Constraint:** Engineering-constrained (8 engineers, 14-month backlog). $3M reserve capital available for growth.
**Analysis Date:** [Current date]

---

### Ansoff Matrix

```
                                    PRODUCTS
                      EXISTING (AP Automation)      NEW (Adjacent Products)
               +----------------------------+----------------------------+
               |    MARKET PENETRATION      |   PRODUCT DEVELOPMENT      |
  EXISTING     |    Risk: LOW               |   Risk: MEDIUM-HIGH        |
  (US Mfg      |    Potential: $2-3M        |   Potential: $3-5M         |
  Mid-Market)  |    Fit: HIGH               |   Fit: LOW (eng-constrained)|
               |    Verdict: PURSUE         |   Verdict: SECONDARY/LATER |
               +----------------------------+----------------------------+
               |    MARKET DEVELOPMENT      |   DIVERSIFICATION          |
  NEW          |    Risk: MEDIUM            |   Risk: HIGH               |
  MARKETS      |    Potential: $6-9M        |   Potential: $2-5M         |
               |    Fit: HIGH               |   Fit: LOW                 |
               |    Verdict: PRIMARY        |   Verdict: AVOID           |
               +----------------------------+----------------------------+
```

---

### Penetration Ceiling Analysis

**Current Market Share:** ~1.6% of ~$500M US mid-market manufacturing AP automation TAM
(Basis: 160 customers × $50K ACV = $8M. TAM estimated at ~10,000 mid-market US manufacturers with AP teams, at an average potential ACV of $50K = $500M.)
**Estimated Penetration Ceiling:** ~12-15% share = ~$60-75M maximum revenue from current market/product, well above the $20M target.
**Revenue Gap to Ceiling:** ~$52-67M remains accessible through penetration alone in theory.
**Time to Ceiling at Current Growth Rate:** Penetration ceiling is not the binding constraint -- at 1.6% share, there is substantial headroom. However, the growth rate deceleration (55% → 22% → 18% projected) signals an execution problem, not a market saturation problem.
**Penetration Ceiling Verdict:** Penetration alone is mathematically sufficient to reach $20M ARR. The question is why growth is decelerating despite low penetration, and whether penetration can be re-accelerated. The deceleration from 55% to 18% over two years is concerning -- likely causes include CAC increase as the easiest-to-reach prospects have been acquired, sales capacity constraints, or product gaps that are creating friction in the sales cycle.

---

### Strategy Evaluation Table

| Strategy | Addl. Revenue Potential | Risk Level | Key Risk Factors | Est. Investment | Time to First $1M | Strategic Fit |
|---|---|---|---|---|---|---|
| Market Penetration | $2-4M over 24 months | LOW | (1) Growth deceleration may indicate structural CAC increase; (2) Sales capacity may be the binding constraint, not market size | $400-700K | 6 months | HIGH |
| Market Development | $5-9M over 24 months | MEDIUM | (1) New verticals (distribution, food manufacturing) require vertical-specific ERP integrations; (2) Segment expansion to enterprise requires new sales motion | $800K-1.5M | 9-12 months | HIGH (sales-motion transfer) |
| Product Development | $3-6M over 24 months | MEDIUM-HIGH | (1) Engineering backlog is 14 months -- any new product delays or displaces current roadmap; (2) Adoption risk if customers expect features in base plan | $1.5-3M + eng capacity | 12-18 months | LOW (eng-constrained) |
| Diversification | $2-4M over 36+ months | HIGH | (1) 30-50% failure rate for related; (2) No available capital or engineering capacity post-development investment | $3M+ | 18-24 months | LOW |

---

### Quadrant 1: Market Penetration (AP Automation × US Mid-Market Manufacturing)

**Growth Potential:** $2-4M additional ARR over 24 months
**Revenue Basis:**
- Net Revenue Retention improvement: Current churn unknown, but assume 8% gross annual churn (industry average for mid-market SaaS). Reducing to 5% on $8M base = $240K/year improvement in NRR. ARPU expansion through upsell (additional modules, user seats) at 10% of base = $800K/year. Year 1-2 combined NRR improvement: ~$2M.
- New customer acquisition: If current sales motion generates 35-40 net new customers/year at $50K ACV, re-accelerating to 50 net new customers/year (through sales hiring) adds $500K additional ARR per year = $1M over 24 months.
- Combined: $2-3M from retention and NRR improvement + $1M from sales acceleration = $3-4M total.

**Specific Tactics:**
1. **Diagnose growth deceleration first (Month 1-2):** Analyze closed-won/lost data for the last 12 months by deal stage. Determine whether deceleration is driven by fewer leads entering top of funnel (marketing problem), lower conversion rates (product or sales problem), or longer sales cycles (buyer behavior problem). This diagnosis changes the penetration tactics.
2. **Sales capacity expansion:** At $50K ACV with a 6-month sales cycle, each account executive can close approximately 8-10 deals/year. With the current team size and $8M ARR, the company likely has 2-3 quota-carrying AEs. Adding 2 net new AEs ($150K fully-loaded each) = $300K/year investment to generate 16-20 additional closings/year at $50K = $800K-1M incremental ARR. ROI positive within 12 months.
3. **Reduce churn through customer success investment:** One additional CSM ($100K fully-loaded) managing at-risk accounts can realistically prevent 3-4 churns per year at $50K ACV = $150-200K ARR saved per year. Payback is immediate. Target: reduce gross churn from estimated 8% to 5% within 12 months.
4. **ARPU expansion through packaged upsell:** Create a "Manufacturing Intelligence" add-on tier bundling advanced reporting, multi-entity consolidation, and ERP integration depth at $10-15K/year above base. Target 30% adoption among 160 existing customers in year 1 = 48 customers × $12.5K = $600K incremental ARR.

**Risk Factors:**
- The growth deceleration pattern (55% → 22% → 18%) suggests the initial cohort of easily-identifiable mid-market manufacturing buyers has been captured, and the marginal prospect now requires more effort to find and convert. Sales efficiency (revenue per AE) may be declining, which means adding headcount alone will not solve the problem without also improving targeting.
- Engineering backlog of 14 months creates a product gap risk: if competitors are shipping faster, prospects may be choosing alternatives during demos. Penetration tactics that require product improvement (additional ERP integrations, mobile AP approval workflow) are blocked by the backlog.

**Penetration Ceiling:** ~$60-75M at 12-15% market share. Ceiling is not the binding constraint at current stage.
**Verdict:** PURSUE -- market penetration should be the first-priority activity and can contribute $3-4M toward the $12M gap. But penetration alone will not close the full gap; Market Development must run in parallel.

---

### Quadrant 2: Market Development (AP Automation × New Markets)

**Growth Potential:** $5-9M additional ARR over 24 months
**Revenue Basis:**
- Adjacent verticals (distribution, food & beverage manufacturing, industrial services): Each represents roughly 20-40% of the manufacturing TAM in addressable count. The core product (AP automation, invoice processing) is highly transferable -- the problem is identical. Conservative estimate: entering 2 adjacent verticals and acquiring 40 customers each at $50K ACV = 80 customers × $50K = $4M new ARR over 24 months.
- Segment expansion to lower mid-market (companies with $20-100M revenue, ACV of $25-30K): This is a different buyer profile but the same product. Accessing this segment through a self-serve or light-touch sales motion could add 80-100 customers at $27.5K average ACV = $2.2-2.75M over 24 months.
- Combined with realistic execution: $5-7M is achievable; $9M requires aggressive execution on both vectors.

**Target New Markets (ranked by accessibility):**

1. **US mid-market distribution and wholesale companies:** TAM ~$80-100M (similar structure to manufacturing, AP-intensive operations, similar ERP stack overlap). Product-market fit transfer: HIGH -- invoice volume, three-way matching, and vendor payment workflows are nearly identical to manufacturing. Entry cost: $150-200K (vertical-specific case studies, ERP connector validation for distribution ERPs like NetSuite Distribution, Sage X3, 1 vertical-specialist sales hire). Timeline to first 10 customers: 6-9 months. This is the highest-confidence market development move.

2. **US mid-market food & beverage manufacturers:** TAM ~$60-80M. Fit transfer: MEDIUM-HIGH -- core AP workflow identical, but FDA compliance documentation adds a layer that some competitors have addressed and this company has not. Entry cost: $200-300K including an FDA-compliant document handling module (small engineering project) and a vertical sales hire. Timeline: 9-12 months.

3. **Downmarket expansion -- US small-to-mid manufacturers ($20-100M revenue), $25-30K ACV, lighter sales motion:** TAM ~$150M. Fit transfer: MEDIUM --
