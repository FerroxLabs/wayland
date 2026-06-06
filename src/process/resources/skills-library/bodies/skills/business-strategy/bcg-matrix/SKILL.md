---
name: bcg-matrix
description: |
  Produces a completed BCG (Boston Consulting Group) growth-share matrix
  with product or business unit placement and investment recommendations.
  Use when the user asks to evaluate product portfolio, allocate resources
  across business units, classify products by growth and market share, or
  decide which products to invest in, maintain, or divest.
  Do NOT use for growth strategy direction (use ansoff-matrix), competitive
  positioning analysis (use competitive-analysis), or single-product
  market analysis (use swot-analysis).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy analysis planning decision-making"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# BCG Matrix

## When to Use

Use this skill when the user's request matches one of the following scenarios:

- The user has 3 or more distinct products, product lines, services, or business units and wants to know where to allocate budget, headcount, or capital expenditure across them
- The user is preparing for an annual planning cycle, board presentation, or strategic review and needs a structured framework for investment prioritization
- The user wants to decide which products to grow aggressively, which to maintain for cash generation, which to turn around, and which to exit or sell
- The user is conducting a portfolio rationalization -- typically triggered by margin pressure, a new competitor entering multiple segments, or a leadership change that demands strategic clarity
- The user is evaluating an acquisition target's product portfolio to understand which units are value-creating and which are liabilities
- The user references the BCG matrix, growth-share matrix, or asks to "classify products by growth and share" or "find our cash cows and stars" explicitly
- The user is managing a PE-backed or VC-funded company where capital is limited and allocation decisions have direct return implications

**Do NOT use this skill when:**

- The user wants to determine which *new markets* to enter or which *growth directions* to pursue -- use `ansoff-matrix` instead, which maps existing vs. new products against existing vs. new markets
- The user wants a complete competitive intelligence analysis for a single product including Porter's Five Forces dynamics -- use `competitive-analysis`
- The user has only one product or service -- the BCG matrix requires relative comparison across a portfolio; use `swot-analysis` for single-product strategic assessment
- The user is asking about their competitive *positioning* and messaging (premium vs. value, differentiated vs. cost leadership) -- use `competitive-positioning`
- The user is performing a whole-company financial health check with no specific portfolio allocation question -- use `financial-analysis`
- The user needs a roadmap for *how* to execute the growth of a specific product -- use `product-roadmap-planning`
- The user is comparing two specific strategic options in a binary choice -- use `decision-matrix` which handles multi-criteria tradeoffs more precisely

---

## Process

### Step 1: Gather Required Inputs Before Producing Any Analysis

Do not produce a matrix with estimated or inferred data without explicit user acknowledgment. Ask for:

- **Company name and industry** -- needed to determine appropriate growth rate thresholds
- **List of products, product lines, services, or business units** -- target 3 to 8 items; fewer than 3 makes the matrix trivial, more than 10 makes it unworkable without grouping
- **Revenue for each unit** -- use the most recent full fiscal year; if quarterly, annualize it
- **Year-over-year market growth rate for each unit's segment** -- this is the *market's* growth rate, not the company's revenue growth rate; these are frequently confused and must be clarified
- **The company's market share percentage** for each unit
- **The largest competitor's market share percentage** for each unit -- this enables relative market share calculation; if unavailable, ask for the user's best estimate and flag it as approximate
- **The strategic decision this analysis informs** -- annual budget allocation, board deck, M&A due diligence, restructuring -- this shapes the specificity and urgency of recommendations

If the user cannot provide all of these, proceed in this priority order: revenue is non-negotiable, growth rate is non-negotiable, market share can use an estimate flagged as approximate. Never proceed with unknown revenue figures.

### Step 2: Calculate Relative Market Share

Relative market share is the single most critical calculation in the BCG framework. It is *not* the company's absolute percentage of the market.

- **Formula:** Relative Market Share = Company's market share % / Largest competitor's market share %
- A value of 1.0 means the company is tied with the market leader
- A value above 1.0 means the company *is* the market leader for that segment
- A value of 0.5 means the company has half the share of the market leader
- A value of 2.0 means the company is twice the size of its nearest competitor -- a strong Star or Cash Cow position
- The dividing line between high and low relative share is always 1.0 -- this is fixed by the BCG methodology and must not be changed
- If the user's company *is* the market leader, calculate relative share vs. the second-largest competitor: Relative Market Share = company share / second-largest competitor's share
- Flag any relative share calculation that relies on user estimates rather than verified market data with "(est.)" in the output
- Relative share values between 0.8 and 1.2 indicate a borderline competitive position -- the company is either barely leading or very close to catching the leader; these require additional strategic nuance

### Step 3: Establish the Market Growth Rate Threshold

The dividing line between "high growth" and "low growth" markets is not always 10%. It must be calibrated to the context.

- **Default threshold:** Use the industry's weighted average market growth rate across all segments being analyzed. If 4 product markets are growing at 4%, 7%, 18%, and 22%, the weighted average (weighted by revenue) is the threshold.
- **Alternative threshold:** GDP growth rate + 2 to 3 percentage points is a common convention for mature, asset-heavy industries (manufacturing, industrials, retail). This typically yields a 5% to 7% threshold.
- **High-tech or SaaS context:** Use a threshold of 10% to 15% because these sectors have structurally higher baseline growth. A market growing at 8% is relatively slow in enterprise software.
- **Declining industry context (e.g., print media, legacy hardware):** Use 0% as the threshold -- positive vs. negative growth is the relevant distinction.
- Document the threshold and its rationale explicitly in the output. A product labeled a "Star" at a 5% threshold might be a "Cash Cow" at a 12% threshold -- this difference has major investment implications.
- If the user's markets span dramatically different industries (e.g., a conglomerate with both SaaS and manufacturing units), use segment-specific thresholds and note them.

### Step 4: Place Each Product in the Correct Quadrant

Apply both metrics simultaneously to assign each product to one of four quadrants:

- **Stars (High Growth >threshold, High Share >1.0):** Market leaders in growing markets. These products consume large amounts of cash to fund their growth but generate strong returns. They are the future Cash Cows. The priority is to defend and extend market leadership, not maximize short-term margin. Stars typically have negative to neutral free cash flow despite high revenue because of heavy reinvestment.
- **Cash Cows (Low Growth <threshold, High Share >1.0):** Market leaders in mature or slow-growing markets. Growth has plateaued so capital requirements are low, but dominant share means strong pricing power and margins. These products generate surplus free cash flow that should fund Stars and selected Question Marks. Protecting a Cash Cow from share erosion is critical -- a Cash Cow that loses share becomes a Dog rapidly.
- **Question Marks (High Growth >threshold, Low Share <1.0):** Followers in fast-growing markets. The market growth is attractive but the weak competitive position means the product requires heavy investment to gain share -- investment that may or may not pay off. Every Question Mark demands a binary choice: commit to a funded investment program to achieve share leadership (targeting 1.0+ relative share), or exit while the market is still growing and the asset has value to a buyer.
- **Dogs (Low Growth <threshold, Low Share <1.0):** Weak competitive position in slow or declining markets. These products rarely justify significant investment. They may generate some cash if managed for harvest (reducing investment while extracting revenue), but the long-term trajectory is decline. The question is not whether to exit but *how* -- harvest and sunset, divest to a competitor who can achieve scale, or restructure into a niche.

For products that fall within 10% of either threshold boundary (e.g., a market growing at 10.5% when the threshold is 10%, or a relative share of 0.93 when 1.0 is the line), mark them as **borderline** and provide analysis for both quadrant interpretations.

### Step 5: Develop Specific Investment Recommendations for Each Product

Generic advice ("invest in Stars, divest Dogs") is not a recommendation -- it is a label. For each product, provide:

- **Recommended strategy:** One of four -- Invest, Hold, Harvest, or Divest. "Monitor" is not a strategy.
- **Budget direction:** A specific percentage or dollar range. Examples: "increase investment by 25-30%", "reduce operating costs by 40% while maintaining sales headcount", "hold flat at current $4M annual spend". Ranges are acceptable; no direction is not.
- **Investment focus:** Where the money goes -- product development, sales headcount, marketing spend, distribution, R&D, partnerships, or working capital.
- **Target trajectory:** Where the product should appear on the matrix in 24 to 36 months if the recommended strategy is executed. Stars should become mature Cash Cows. Question Marks that receive investment should become Stars. Dogs being harvested should generate net cash before exit.
- **Decision triggers:** For Question Marks, specify the measurable conditions that would change the recommendation. Example: "Invest if relative share reaches 0.70 within 18 months; divest if share stagnates below 0.50 after 18 months of increased investment."
- **Key risk:** The single most likely thing that could invalidate the recommendation -- a new entrant, a technology shift, a regulatory change, a loss of a key customer representing >20% of segment revenue.

### Step 6: Assess Portfolio Balance and Cash Flow Dynamics

The BCG matrix is only fully useful when the *portfolio as a whole* is analyzed, not just individual products.

- **Healthy portfolio archetype:** 1 to 2 Cash Cows generating surplus free cash flow that is sufficient to fund 1 to 2 Stars and 1 selected Question Mark simultaneously. This is a self-funding growth machine.
- **Cash flow test:** Estimate whether the Cash Cows generate enough cash to fund the recommended investment increases for Stars and Question Marks. If not, the company faces a funding gap and must either reduce Question Mark investment or seek external financing.
- **Common imbalance patterns and their diagnoses:**
  - *All Question Marks, no Stars or Cash Cows:* Classic early-stage company that has spread resources too thin. None of its bets have achieved market leadership. Prescription: concentrate investment in the 1 or 2 Question Marks with the strongest growth trajectory and exit the others.
  - *All Cash Cows, no Stars:* A company that stopped innovating. The portfolio will generate strong cash now but will face structural decline as markets mature. Prescription: use Cash Cow profits to fund organic R&D or acquire a Star from outside.
  - *All Dogs:* Systemic competitive failure or chronic underinvestment. The portfolio is in managed decline. Prescription: consider full portfolio restructuring, sell individual units to strategic buyers who can achieve scale, or pivot the entire company.
  - *Too many Stars, no Cash Cows:* Cash-consuming portfolio that requires external funding. Common in high-growth tech companies. Prescription: allow at least one Star to mature to Cash Cow before adding more investment bets.
- **Revenue concentration risk:** Flag if any single product represents more than 50% of total portfolio revenue -- this is a concentration risk regardless of quadrant.
- Provide an overall portfolio health verdict: **Healthy**, **Needs Rebalancing**, or **At Risk**, with a one-paragraph rationale.

### Step 7: Validate Assumptions and Flag Data Quality Issues

BCG analysis is only as reliable as its inputs. Before finalizing:

- Confirm that market growth rates reference the correct segment -- a company selling "HR software" should use HR tech market growth, not "enterprise software" broadly or the company's own revenue growth
- Note any relative share calculations based on user estimates vs. verified competitive intelligence
- Flag industries where BCG assumptions may not hold: two-sided platforms, network-effect businesses, regulated utilities, and early-stage markets with no clear leader
- If the analysis will be presented to a board or used in an M&A context, recommend that all market share and growth figures be validated against third-party market research (IDC, Gartner, Euromonitor, industry associations) before the presentation

---

## Output Format

```
## BCG Matrix: [Company Name] Product Portfolio

**Analysis Date:** [Date]
**Industry Context:** [Industry or sector]
**Investment Decision:** [What strategic decision this analysis informs]
**Market Growth Threshold:** [X%] -- [rationale: industry average / GDP+2% / weighted average]
**Relative Share Threshold:** 1.0 (fixed BCG methodology)
**Data Quality Note:** [Any estimates or unverified figures, or "All figures provided by client"]

---

### 1. Product Data and Quadrant Placement

| Product / Unit | Revenue | Mkt Growth | Co. Share | Lead. Share | Rel. Share | Quadrant | Data Quality |
|----------------|---------|------------|-----------|-------------|------------|----------|--------------|
| [Product A]    | $[X]M   | [X]%       | [X]%      | [X]%        | [X.XX]     | Star     | Verified     |
| [Product B]    | $[X]M   | [X]%       | [X]%      | [X]%        | [X.XX]     | Cash Cow | Est.*        |
| [Product C]    | $[X]M   | [X]%       | [X]%      | [X]%        | [X.XX]     | Question Mark | Verified |
| [Product D]    | $[X]M   | [X]%       | [X]%      | [X]%        | [X.XX]     | Dog      | Verified     |

*Est. = based on user estimate, not third-party verified

---

### 2. Matrix Visualization

```
                        RELATIVE MARKET SHARE
                   High (>1.0)          Low (<1.0)
               +--------------------+--------------------+
               |     ★  STARS       |  ?  QUESTION MARKS |
  High         |                    |                    |
  (>[X]%)      |  [Product A]       |  [Product C]       |
  MARKET       |  $[X]M | RMS [X.X] |  $[X]M | RMS [X.X] |
  GROWTH       |                    |                    |
               +--------------------+--------------------+
               |   $  CASH COWS     |   ✕   DOGS         |
  Low          |                    |                    |
  (<[X]%)      |  [Product B]       |  [Product D]       |
               |  $[X]M | RMS [X.X] |  $[X]M | RMS [X.X] |
               |                    |                    |
               +--------------------+--------------------+
Note: Circle size proportional to revenue. Bubble placement represents
approximate position within quadrant -- not just quadrant label.
```

---

### 3. Investment Recommendations

**★ Stars: Invest Aggressively to Defend and Extend Leadership**

**[Product A] -- $[X]M revenue | [X]% market growth | [X.X] relative share**
- Recommended strategy: Invest
- Budget direction: Increase investment by [X-X]%, targeting [$XM] additional annual spend
- Investment focus: [Specific area -- e.g., engineering headcount, channel partnerships, geographic expansion]
- Target trajectory (24-36 months): Maintain Star position as market matures; projected revenue $[X]M as it transitions to Cash Cow
- Key risk: [Specific risk -- new entrant, technology shift, etc.]
- Decision trigger: If relative share falls below 0.85, re-evaluate investment level immediately

---

**$ Cash Cows: Maximize Cash Generation with Selective Defense**

**[Product B] -- $[X]M revenue | [X]% market growth | [X.X] relative share**
- Recommended strategy: Hold / selective investment to defend share
- Budget direction: Maintain current investment of [$XM]; redirect surplus margin to Stars and Question Marks
- Investment focus: Retention programs, cost efficiency, preventing share erosion -- not growth initiatives
- Estimated cash generation available for portfolio redeployment: [$XM per year]
- Target trajectory (24-36 months): Maintain Cash Cow position; accept gradual revenue decline if market shrinks
- Key risk: [Specific risk -- e.g., disruptive entrant, customer consolidation, pricing pressure]
- Red line: If relative share drops below 0.70, conduct immediate competitive review

---

**? Question Marks: Binary Decision Required -- Invest or Exit**

**[Product C] -- $[X]M revenue | [X]% market growth | [X.X] relative share**
- Recommended strategy: [Invest / Divest] -- rationale below
- Budget direction: [Increase by X% to fund share gain program / Reduce to zero over 12 months]
- Investment focus: [If investing: specific lever -- e.g., product differentiation, aggressive pricing, partnership channel]
- Invest condition: If relative share reaches [X.X] within [X] months, the investment thesis is working
- Divest condition: If relative share stagnates below [X.X] after [X] months of full investment, exit while market growth keeps asset value high
- Target trajectory: [If investing: Star within 18-24 months / If divesting: orderly exit within 12 months]
- Key risk: [Specific risk -- window of opportunity may be closing as market consolidates]

---

**✕ Dogs: Harvest or Exit -- Minimize Capital Trapped**

**[Product D] -- $[X]M revenue | [X]% market growth | [X.X] relative share**
- Recommended strategy: [Harvest / Divest / Niche restructure]
- Budget direction: Reduce investment by [X]%; extract remaining margin
- Restructure condition: If [specific strategic pivot -- e.g., reposition as premium niche, bundle with Product A] can be executed for under $[X]M, evaluate before full exit
- Exit path: [Sell to competitor / white-label / sunset product]
- Exit timeline: [Specific quarter/year]
- Cash recovery estimate: [$XM from sale / $XM from harvest over X years]

---

### 4. Portfolio Cash Flow Analysis

| Cash Source / Use | Amount | Direction |
|--------------------|--------|-----------|
| Cash Cows -- estimated surplus free cash flow | $[X]M/yr | Source |
| Stars -- additional investment required | ($[X]M/yr) | Use |
| Question Marks -- investment program | ($[X]M/yr) | Use |
| Dogs -- harvest proceeds | $[X]M | Source (one-time) |
| **Net portfolio cash position** | **$[X]M** | **[Surplus / Gap]** |

[Narrative: whether Cash Cows can self-fund the investment program, or whether external capital is needed]

---

### 5. Portfolio Health Assessment

| Quadrant | # Products | Revenue | % of Portfolio |
|----------|------------|---------|----------------|
| Stars | [N] | $[X]M | [X]% |
| Cash Cows | [N] | $[X]M | [X]% |
| Question Marks | [N] | $[X]M | [X]% |
| Dogs | [N] | $[X]M | [X]% |
| **Total** | **[N]** | **$[X]M** | **100%** |

**Portfolio Health Verdict:** [Healthy / Needs Rebalancing / At Risk]

**Diagnosis:** [2-3 sentences describing the key structural issue or strength -- e.g., "Portfolio is over-reliant on a single Cash Cow representing 58% of revenue. If that product loses 5 points of market share, the entire investment program for Stars and Question Marks collapses. The Integration Platform Star must be accelerated to serve as a second anchor."]

**Priority Action:** [Single most important portfolio-level action in the next 90 days]
**12-Month Milestone:** [What the portfolio should look like in 12 months if recommendations are executed]
```

---

## Rules

1. **Never confuse company revenue growth with market growth rate.** These are frequently conflated by users and are fundamentally different metrics. If a company's CRM product grew revenue 12% but the CRM market grew only 4%, that product is gaining share in a slow market -- it is a Cash Cow candidate, not a Star. Always explicitly ask which metric the user is referencing.

2. **Relative market share is always calculated against the single largest competitor in that specific segment.** If the company is the market leader, it is calculated against the second-largest competitor. Absolute market share percentage (e.g., "we have 23% of the market") is an input, not the output metric used for placement.

3. **The growth rate threshold must be stated, justified, and consistently applied.** The BCG methodology does not specify a universal threshold -- 10% is a commonly cited default but is wrong for many industries. A 10% growth rate in industrial equipment is exceptional; in consumer mobile apps it signals a stagnant market. Use the weighted average of the markets in the portfolio, or the industry convention for the user's sector, and document the choice explicitly.

4. **Question Marks must receive a binary recommendation: invest or divest.** "Continue monitoring", "evaluate further", or "maintain current investment" are not valid recommendations. The logic is strict: a high-growth market will not stay open indefinitely, and the cost of gaining share increases as the market matures. Every month of indecision in a high-growth market is a strategic forfeit.

5. **Every investment recommendation must include a specific budget direction with a numerical range.** "Invest more" is not a recommendation. "Increase annual product and marketing investment by 25-35%, from $4M to $5-5.4M, concentrated in enterprise sales headcount" is a recommendation.

6. **Dogs must receive either a harvest plan with a specific timeline or a divestiture path -- not both without a deciding criterion.** Leaving a Dog with two equally vague options is an avoidance of the strategic decision. Specify: harvest if [condition], divest if [condition], and give a date by which the decision must be made.

7. **Portfolio cash flow must be explicitly tested.** If the Cash Cows cannot generate enough free cash flow to fund the recommended investments in Stars and Question Marks, say so and quantify the gap. A portfolio recommendation that assumes unlimited capital is analytically incomplete and dangerously misleading for planning purposes.

8. **Borderline products (within 10% of either threshold) must be identified and treated with dual-quadrant analysis.** A product with a relative share of 0.95 has a different strategic reality than one at 0.40. Borderline products are often the most important strategic decisions because a small investment or competitive shift can move them into the favorable quadrant.

9. **Do not apply the BCG matrix to features, customer segments, or geographies without redefining what constitutes a "market" for each.** The framework requires a defined market with a measurable size and growth rate. Features do not have independent market share. If the user wants to analyze geographies, each geography needs its own market growth rate and competitive data -- not blended global averages.

10. **If the analysis will be used in a board presentation, M&A process, or capital raise, flag that all market share and growth data should be validated against third-party sources before use.** BCG matrices built on unverified estimates have caused material strategic errors. The AI can help structure the analysis, but the user bears responsibility for data accuracy in high-stakes decisions.

---

## Edge Cases

### 1. The Company's Own Revenue Growth Is the Only Data Available

Users frequently provide their own revenue growth rates but cannot obtain market growth rates. These are not substitutes. Handle as follows:

- If the company is gaining share (management believes they are growing faster than the market), ask: "Do you believe you are gaining or losing market share in this segment?" Use this qualitative anchor to estimate a market growth rate.
- As a fallback, look for proxies: publicly traded competitors' segment revenue growth rates are often available in earnings reports and serve as a reasonable market growth proxy.
- Flag every placement made on estimated market growth with "(est.)" and advise that placement accuracy is contingent on data quality.
- Do not produce a confident "Star" or "Cash Cow" designation when the market growth rate is genuinely unknown -- produce a contingent analysis: "If market growth is above [threshold], this is a Star. If below, it is a Cash Cow."

### 2. Network-Effect or Platform Business Models

The BCG matrix was designed for product businesses with discrete competitive dynamics. Platform businesses (two-sided marketplaces, social networks, operating systems) have winner-take-most dynamics that make the 1.0 relative share threshold insufficient.

- A platform product with 0.8 relative share is in a much more precarious position than a traditional product at the same number, because network effects accelerate share consolidation around the leader.
- For platform products, treat any relative share below 1.0 as functionally equivalent to a Question Mark requiring urgent action, regardless of growth rate.
- Annotate platform products explicitly: "Network-effect dynamics apply -- share threshold is less forgiving than standard BCG methodology assumes."
- If the platform product has strong same-side or cross-side network effects, the Star/Question Mark distinction becomes about time pressure: Question Marks in platform markets have very short windows before the leader locks in.

### 3. The Portfolio Has 8+ Products or Business Units

The standard BCG matrix becomes analytically unwieldy above 8 units. Handle as follows:

- Group products into 4 to 6 strategic clusters by market segment or customer type before applying the framework
- Apply BCG at the cluster level, then note sub-unit variations within each cluster
- Alternatively, apply BCG to the highest-revenue products first (those representing 80%+ of revenue by the Pareto principle) and treat remaining small products as a single "Long Tail" unit in the Dog quadrant pending individual review
- Flag the grouping methodology used and its implications for accuracy

### 4. A Market Is Being Actively Disrupted

BCG assumes relatively stable market definitions. In markets facing technological disruption (e.g., a traditional software product being disrupted by AI-native competitors, or a physical retail product being disrupted by direct-to-consumer), the framework still applies but with critical modifications:

- Add a "Disruption Risk" rating (Low / Medium / High / Critical) column to the Product Placement table
- For products with High or Critical disruption risk, compress the strategic timeline: a Dog in a disrupted market may need to be exited in 12 months rather than 36; a Cash Cow in a disrupted market may have only 18 to 24 months before share erodes to Dog territory
- Stars in disrupted markets may be disrupting the disruption -- they deserve additional analysis of whether their moat is real or fragile
- Note: if the market definition itself is changing (e.g., "on-premise ERP" merging with "cloud ERP" into a single market), redefine the market before placing products

### 5. The Company Is the Only Player With Significant Share (Monopoly or Near-Monopoly)

If the company has 70%+ market share in a segment, calculating relative share against the second-largest competitor may yield extreme values (5.0, 8.0+) that distort the visualization.

- Cap displayed relative share at 3.0 for visualization purposes while noting the actual figure
- The strategic implication of dominant share is usually about regulatory risk, margin management, and innovating into adjacent segments rather than defending share
- Note that the BCG framework's recommendations are less useful at extreme share positions -- consider supplementing with a market maturity analysis

### 6. A Startup or Early-Stage Company With No Market Share Data

For startups that have not yet established meaningful market presence (less than 1% market share, pre-revenue or early revenue), the BCG matrix provides limited signal for internal portfolio management. However, it can be useful for evaluating the portfolio of *bets* or product lines:

- Use revenue run rate rather than annual revenue
- Use addressable market capture rate as a proxy for share (total revenue / TAM × 100)
- Be explicit that at sub-1% share, all products are functionally Question Marks and the strategic question is sequencing: which one gets focused resources first
- Recommend revisiting BCG analysis when the company has at least one product with 3%+ market share or $3M+ ARR, whichever comes first

### 7. Conglomerate With Products in Unrelated Industries

A company with units in, say, industrial chemicals, digital media, and financial services cannot apply a single growth threshold to all units. Each unit operates in a fundamentally different growth environment.

- Apply segment-specific growth thresholds: use the industry convention for each unit's sector
- Present a matrix visualization for each industry cluster separately, then a combined portfolio summary table
- The portfolio balance assessment should address whether the corporate parent is adding strategic value to the mix or whether the units would be better served by independent capital allocation (a spin-off or sale rationale)
- Flag that cross-segment cash flow redirection (using chemical unit Cash Cow cash to fund digital media Stars) is only value-creating if the corporate center has a real synergy thesis, not just financial engineering

---

## Example

**Input from user:** "We run a mid-market B2B software company. We have four products: (1) Document Management -- $18M ARR, the document management software market is growing at 6% per year, we have roughly 15% market share, and the leader Competitor X has about 22%. (2) AI Contract Review -- $4M ARR, market growing at 35%, we have 6% share, leader has 19%. (3) E-Signature -- $9M ARR, market growing at 9%, we have 18% share, leader has 16%. (4) Workflow Automation -- $2M ARR, market growing at 28%, we have 4% share, leader has 24%. We're doing our annual planning and need to know where to put our $8M incremental investment budget."

---

### Pre-Analysis Calculations

**Relative Market Share:**
- Document Management: 15% / 22% = **0.68**
- AI Contract Review: 6% / 19% = **0.32**
- E-Signature: 18% / 16% = **1.13** (Company is the market leader -- we are Competitor X in this segment)
- Workflow Automation: 4% / 24% = **0.17**

**Growth Threshold Calculation (Weighted Average by Revenue):**
- Total ARR: $18M + $4M + $9M + $2M = $33M
- Weighted growth: (18/33 × 6%) + (4/33 × 35%) + (9/33 × 9%) + (2/33 × 28%)
- Weighted growth: (0.545 × 6%) + (0.121 × 35%) + (0.273 × 9%) + (0.061 × 28%)
- Weighted growth: 3.27% + 4.24% + 2.45% + 1.70% = **11.7%** -- rounded to **12%** as the threshold

Note: An alternative threshold of 10% (common B2B SaaS convention) is also appropriate here. The analysis below uses 12% but flags where the 10% threshold would change a placement.

---

## BCG Matrix: [Company Name] Product Portfolio

**Analysis Date:** [Current date]
**Industry Context:** Mid-market B2B software -- document workflow and automation
**Investment Decision:** Allocation of $8M incremental annual investment budget for upcoming fiscal year
**Market Growth Threshold:** 12% (weighted average across portfolio segments; note: 10% is an acceptable alternative for standard SaaS benchmarking)
**Relative Share Threshold:** 1.0 (fixed BCG methodology)
**Data Quality Note:** Market share figures are user-provided estimates. Competitor X market share for Document Management and AI Contract Review should be validated against Gartner or IDC reports before board presentation.

---

### 1. Product Data and Quadrant Placement

| Product / Unit | ARR | Mkt Growth | Co. Share | Lead. Share | Rel. Share | Quadrant | Data Quality |
|----------------|-----|------------|-----------|-------------|------------|----------|--------------|
| Document Management | $18M | 6% | 15% | 22% | 0.68 | Dog | Est.* |
| AI Contract Review | $4M | 35% | 6% | 19% | 0.32 | Question Mark | Est.* |
| E-Signature | $9M | 9% | 18% | 16% (us) | 1.13 | Borderline Cash Cow | Est.* |
| Workflow Automation | $2M | 28% | 4% | 24% | 0.17 | Question Mark | Est.* |

*All figures are user-provided estimates. Third-party validation recommended for any board or investor use.

**Borderline note on E-Signature:** Market growth of 9% sits between the 10% alternative threshold (which would make it a Question Mark) and the 12% primary threshold (which makes it a Cash Cow). Given that this company is the market leader with 1.13 relative share and the market is still growing, it behaves more like a maturing Star transitioning to Cash Cow. It is analyzed as a Cash Cow for resource allocation purposes.

---

### 2. Matrix Visualization

```
                        RELATIVE MARKET SHARE
                   High (>1.0)          Low (<1.0)
               +--------------------+--------------------+
               |     ★  STARS       |  ?  QUESTION MARKS |
  High         |                    |                    |
  (>12%)       |   [None]           |  AI Contract Review|
  MARKET       |                    |  $4M | RMS 0.32    |
  GROWTH       |                    |                    |
               |                    |  Workflow Auto.    |
               |                    |  $2M | RMS 0.17    |
               +--------------------+--------------------+
               |   $  CASH COWS     |   ✕   DOGS         |
  Low          |                    |                    |
  (<12%)       |  E-Signature       |  Document Mgmt     |
               |  $9M | RMS 1.13   |  $18M | RMS 0.68   |
               |  (Borderline)      |  (Largest unit)    |
               +--------------------+--------------------+

Circle sizes (proportional to ARR): Doc Mgmt = largest; E-Sig = medium-large;
AI Contract = medium-small; Workflow Auto = smallest
```

**Critical observation:** This portfolio has no Stars. The company has a single Cash Cow (E-Signature), no market leaders in high-growth segments, two Question Marks competing for investment, and its largest revenue product (Document Management) is a Dog. This is a portfolio at structural risk if E-Signature share erodes.

---

### 3. Investment Recommendations

---

**$ Cash Cows: Maximize Cash Generation -- Defend at All Costs**

**E-Signature -- $9M ARR | 9% market growth | 1.13 relative share (Market Leader)**

- **Recommended strategy:** Hold with targeted defensive investment
- **Budget direction from the $8M pool:** Allocate $1.5M (19% of incremental budget) -- not for growth, but for moat-deepening. This protects the single cash engine that funds the entire portfolio.
- **Investment focus:** Integration depth with third-party platforms (Salesforce, Microsoft 365, SAP), SOC 2 Type II and FedRAMP compliance improvements to make switching costs prohibitive, customer success headcount to reduce churn in top 20% of accounts
- **Do not invest in:** Acquiring new logos aggressively or entering new geographic segments -- market is maturing and the 9% growth will not accelerate with marketing spend
- **Estimated surplus free cash flow available for portfolio redeployment:** Approximately $3M to $4M per year at current ARR and SaaS gross margin assumptions (75-80%)
- **Target trajectory (24-36 months):** Maintain Cash Cow status. Accept that ARR growth may slow to 5-7% as market matures. Protect the 1.13 relative share -- any erosion below 1.0 converts this to a Question Mark and eliminates the portfolio's primary funding source.
- **Key risk:** Microsoft or DocuSign bundling e-signature into existing enterprise agreements at no incremental cost. If this happens at scale, relative share could drop 0.2-0.3 points within 18 months. Monitor enterprise bundling announcements monthly.
- **Red line:** If relative share drops below 0.90 in any 12-month period, immediately escalate to a full competitive review and consider whether a platform partnership or acquisition is needed.

---

**? Question Marks: Binary Decisions Required**

**AI Contract Review -- $4M ARR | 35% market growth | 0.32 relative share**

- **Recommended strategy: Invest -- this is the primary growth bet**
- **Budget direction from the $8M pool:** Allocate $3.5M (44% of incremental budget). This is the highest-priority investment in the portfolio.
- **Rationale:** The AI contract review market is growing at 35% annually -- one of the highest-growth legal tech segments in the current AI wave. At 0.32 relative share the company is a distant follower, but the market is still in an early consolidation phase, meaning share gain is possible. The cost to gain share in a 35% growth market is dramatically lower than attempting it in a 10% growth market, because the market is expanding and customers are actively evaluating new solutions.
- **Investment focus:** AI model quality and speed (the primary purchase criterion in contract review -- accuracy benchmarks matter more than features), product-led growth motion via free trial with conversion to paid, and 3 to 4 enterprise sales hires targeting legal departments at $1B+ revenue companies. Consider a strategic partnership with a legal practice management platform to access their installed base.
- **Invest condition (go/no-go checkpoint at month 18):** Relative share must reach 0.55 or higher. This means growing from 6% to approximately 10% share while the leader stays at 19-21%. If ARR reaches $9-10M with maintained or improving net revenue retention (target: 115%+), the investment thesis is validated.
- **Divest condition:** If relative share is still below 0.45 at the 18-month checkpoint despite full investment, the window is closing. Markets growing at 35% today will grow at 20% in year 3 and 12% in year 5. A share of 0.45 in a 12% growth market is a permanent Question Mark, not a future Star. At that point, sell the product to a legal tech consolidator while it still has value in a growing market.
- **Target trajectory:** Star within 18 to 24 months (relative share 0.80+, ARR $12M+) if investment thesis is validated
- **Key risk:** A well-funded pure-play AI legal tech company (Harvey, Ironclad, Kira) running a product-led growth motion with superior AI models. Monitor their pricing and product announcements quarterly.

---

**Workflow Automation -- $2M ARR | 28% market growth | 0.17 relative share**

- **Recommended strategy: Conditional invest -- but not yet as a standalone bet**
- **Budget direction from the $8M pool:** Allocate $1.0M (12% of incremental budget) -- not to pursue independent market share, but to integrate deeply with E-Signature and AI Contract Review
- **Rationale:** At 0.17 relative share, Workflow Automation is in a very weak competitive position in a crowded market (Zapier, Make, ServiceNow, Salesforce Flow all compete here). Attempting to build this into a standalone Star would require $5M+ of investment and still likely fail against entrenched players. However, workflow automation as a *capability* within the company's document workflow suite is highly defensible -- customers who use E-Signature + AI Contract Review + Workflow Automation for a contract-to-close workflow are significantly more sticky than single-product customers.
- **Investment focus:** Build tight native integrations between Workflow Automation and E-Signature (customers who use both are the primary retention play for E-Signature). Position as "Workflow for Document Teams" rather than a general automation tool. Do not compete with Zapier on breadth -- compete on document workflow depth.
- **Revised positioning:** If this bundling strategy is successful, Workflow Automation ceases to be measured as an independent product and becomes a retention feature within the E-Signature and contract management suite. Remove it from independent BCG tracking after 12 months and reassess as part of an "E-Signature Platform" composite unit.
- **Divest condition:** If the bundling strategy does not improve E-Signature retention rates by at least 8 percentage points at the 12-month mark, this product should be sunset. The cost of maintaining a separate engineering team for a $2M ARR product with 0.17 market share is not justified.
- **Key risk:** The investment required to make this a real standalone Star ($5M+) would crowd out the AI Contract Review bet, which has a cleaner path to share leadership. Do not let the Workflow Automation team advocate for more than $1M in incremental investment this cycle.

---

**✕ Dogs: Strategic Restructuring Required -- This Is the Portfolio's Biggest Problem**

**Document Management -- $18M ARR | 6% market growth | 0.68 relative share**

- **Recommended strategy: Harvest while restructuring toward platform bundling**
- **Budget direction from the $8M pool:** Allocate $2.0M (25% of incremental budget) -- this is entirely restructuring and retention-focused, not growth investment
- **The counterintuitive problem:** Document Management is the company's largest revenue product at $18M ARR -- 55% of total ARR -- yet it is a Dog by BCG criteria. This creates a dangerous dependency: the company cannot simply divest its way to portfolio health without replacing $18M in ARR. This must be the central context for all other recommendations.
- **Restructuring path:** Reposition Document Management not as a standalone product but as the *foundation layer* of an integrated document workflow platform alongside E-Signature, AI Contract Review, and Workflow Automation. The go-to-market should stop competing for standalone document management customers against the market leader at 22% share. Instead, sell "Document Management + E-Signature + AI Contract Review" as a bundled platform to customers who want a single vendor for their document workflow stack. This improves retention economics across all products and reduces the competitive surface area.
- **Investment focus within the $2M:** Migration path tooling (make it easier for customers to bring existing document libraries into the platform), customer success headcount for the top 50 accounts by ARR (these are the accounts you cannot lose), and documentation of API integrations with core enterprise systems (SAP, Oracle, Salesforce) to increase switching costs
- **Explicit harvesting actions:** Freeze any net-new product development that does not directly serve the bundled platform strategy. Reduce feature development spend by 35% vs. prior year. Redirect that engineering capacity to AI Contract Review and E-Signature integrations.
- **Divestiture consideration:** If the bundled platform strategy does not show traction (measured by multi-product attach rate reaching 30% of Document Management ARR) within 18 months, evaluate a sale of the Document Management unit to a strategic acquirer -- a larger ECM (Enterprise Content Management) vendor who can achieve scale. At $18M ARR with a dominant customer base, this unit has real sale value in the current M&A market for vertical SaaS.
- **Exit timeline:** Divestiture decision point = Q3 of year 2. If platform attach rate is below 30% and the unit is still growing slower than 8% independently, initiate an M&A process.
- **Key risk:** A sudden acceleration of churn from Document Management (e.g., a competitor running an aggressive migration campaign) would eliminate the company's largest revenue base before the AI Contract Review and E-Signature growth engines are large enough to compensate. Monitor Document Management net revenue retention monthly; if it drops below 90%, escalate immediately.

---

### 4. Portfolio Cash Flow Analysis

| Cash Source / Use | Annual Amount | Direction |
|-------------------|---------------|-----------|
| E-Signature -- estimated surplus free cash flow (75% gross margin on $9M ARR, less current opex) | ~$3.5M/yr | Source |
| Document Management -- estimated contribution margin (lower margin given legacy architecture) | ~$2.5M/yr | Source |
| **Total internal cash generation** | **~$6M/yr** | |
| AI Contract Review -- incremental $3.5M investment program | ($3.5M/yr) | Use |
| E-Signature -- defensive investment | ($1.5M/yr) | Use |
| Workflow Automation -- bundling investment | ($1.0M/yr) | Use |
| Document Management -- restructuring investment | ($2.0M/yr) | Use |
| **Total incremental investment required** | **($8.0M)** | |
| **Net gap (requires external funding or existing budget reallocation)** | **~($2.0M)** | **Funding gap** |

**Cash Flow Verdict:** The portfolio's internal cash generation (~$6M/year) is insufficient to fund the full $8M incremental investment program. This gap of approximately $2M must be funded from the existing operating budget (by reducing spend on lower-priority activities), from the company's existing cash reserves, or from external financing. The most direct source is the 35% reduction in Document Management feature development spend, which should release $1.0-1.5M of engineering capacity for redeployment to AI Contract Review. The remaining $0.5-1.0M gap is manageable from operating cash.

---

### 5. Portfolio Health Assessment

| Quadrant | # Products | ARR | % of Portfolio |
|----------|------------|-----|----------------|
| Stars | 0 | $0 | 0% |
| Cash Cows | 1 | $9M | 27% |
| Question Marks | 2 | $6M | 18% |
| Dogs | 1 | $18M | 55% |
| **Total** | **4** | **$33M** | **100%** |

**Portfolio Health Verdict: At Risk -- Needs Urgent Restructuring**

**Diagnosis:** This portfolio has two structural vulnerabilities that make it fragile despite $33M in total ARR. First, the company has no Stars -- no product where it holds market leadership in a high-growth segment. Second, its single largest product (Document Management, 55% of ARR) is a Dog with a weak competitive position in a slow-growth market. The single Cash Cow (E-Signature) at 27% of ARR is a strong market leader but represents an insufficient anchor for the portfolio's future. If E-Signature loses 0.15 points of relative share over the next 24 months due to competitive bundling by Microsoft or DocuSign, the portfolio loses its primary funding engine before AI Contract Review is large enough to replace it.

The recommended investment program addresses these vulnerabilities by making AI Contract Review the priority growth bet (potential Star in 18-24 months), protecting E-Signature's leadership position, and restructuring Document Management from a standalone Dog into a platform retention layer -- which buys time while AI Contract Review scales.

**Priority Action (next 90 days):** Immediately redirect engineering capacity from Document Management feature development to AI Contract Review product improvements (accuracy benchmarking, trial experience, enterprise integrations) and begin hiring 3 enterprise sales representatives for the AI Contract Review product.

**12-Month Milestone:** AI Contract Review reaches $6M ARR (50% growth from $4M, relative share moving toward 0.45-0.50); E-Signature net revenue retention holds at 110%+; Document Management multi-product attach rate reaches 20% of ARR base. If these three milestones are met, the portfolio has a credible path to having 1 Star, 1-2 Cash Cows, and 1 Question Mark by year 3.
