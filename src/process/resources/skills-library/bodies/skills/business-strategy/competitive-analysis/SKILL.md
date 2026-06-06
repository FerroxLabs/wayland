---
name: competitive-analysis
description: |
  Produces a completed competitor comparison matrix with positioning analysis,
  capability gaps, and strategic recommendations using Porter's Five Forces
  framework. Use when the user asks to analyze competitors, compare market
  alternatives, evaluate competitive landscape, or assess competitive positioning.
  Do NOT use for internal strengths/weaknesses analysis (use swot-analysis),
  macro-environment scanning (use pestle-analysis), or product portfolio
  evaluation (use bcg-matrix).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy analysis planning decision-making"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Competitive Analysis

## When to Use

Use this skill when the user needs a structured, evidence-backed analysis of their competitive environment. Specific trigger scenarios include:

- User asks to analyze competitors, map the competitive landscape, or understand who they are competing against in a defined market segment
- User is preparing for a strategic decision -- entering a new market, launching a product, repricing, or deciding whether to build a feature -- and needs to understand how competitors will respond or how the user's company compares
- User wants to identify differentiation opportunities, positioning gaps, or white space that competitors have failed to address
- User needs to brief leadership, investors, or a board on competitive dynamics and where the company stands relative to alternatives
- User is responding to a competitive threat -- a rival launched a new product, entered their segment, or is actively poaching their customers -- and needs to understand the severity and best countermove
- User is conducting win/loss analysis and wants to understand why deals are being lost to specific competitors
- User needs to evaluate a potential acquisition target and wants to understand where that target sits competitively in its market

**Do NOT use this skill when:**

- The user needs to analyze only their own internal strengths and weaknesses without a competitor benchmark -- use `swot-analysis` instead
- The user needs to scan macro-level environmental factors like regulation, demographics, or technology waves -- use `pestle-analysis` instead
- The user needs to evaluate their own product portfolio by growth rate and market share -- use `bcg-matrix` instead
- The user is asking for a general market sizing or TAM/SAM/SOM breakdown -- use a market-sizing skill instead
- The user only wants to know what a single competitor does without a structured comparison -- a simple competitor profile memo is more appropriate
- The user needs a customer segmentation or persona analysis -- competitive analysis depends on segmentation as an input, not a deliverable
- The analysis is primarily about internal process benchmarking (e.g., comparing internal teams against industry operational benchmarks) -- use a benchmarking or operational excellence framework instead

---

## Process

### Step 1: Clarify the Strategic Question and Context

Before generating any analysis, establish the specific decision this analysis must inform. A competitive analysis produced without a driving question produces generic observations with no actionable output.

- Ask the user: "What decision will this analysis inform or what action will it support?" The answer determines which competitors to include, which buying criteria to weight, and which section of the output deserves the most depth.
- Establish the unit of analysis: is this a company-level comparison, a product-line comparison, or a segment-specific comparison? A company can compete differently across segments -- a CRM vendor may be dominant in mid-market but irrelevant in enterprise.
- Confirm the target customer persona or segment. Buying criteria differ dramatically between an SMB decision-maker who prioritizes price and time-to-value versus an enterprise buyer who weights integration, security compliance, and vendor stability.
- Identify the temporal frame: is the user trying to understand the market as it is today, or trying to anticipate where it will be in 12-24 months? Future-oriented analyses require heavier weight on competitor momentum signals (recent funding, hiring, product roadmap disclosures) rather than static capability snapshots.
- If the user cannot articulate a strategic question, offer four common framings to choose from: (1) "Where should we differentiate to win?", (2) "Which competitor is most vulnerable and how do we attack?", (3) "How do we defend against an incoming threat?", (4) "Should we enter/expand into this market?"

### Step 2: Define the Competitive Set

A poorly scoped competitor set produces a misleading analysis. Include too few and you miss real threats. Include too many and the signal disappears in noise.

- **Direct competitors** share the same target customer, solve the same problem with a comparable solution, and compete in the same buying cycle. Aim for 3-5 direct competitors. If the user names fewer than 3, identify likely alternatives by reasoning from the industry, segment, price point, and distribution channel.
- **Indirect competitors** solve the same underlying customer problem using a different mechanism or delivery model -- for example, a custom-built internal tool vs. a SaaS product, or a consultant vs. a software platform.
- **Substitutes** are solutions the customer can use to avoid the category entirely -- spreadsheets for CRM, email for project management, manual processes for workflow automation. Substitutes matter enormously for Porter's analysis and for framing price-sensitivity arguments.
- **Potential entrants** are companies not yet in the market but with the assets to enter quickly: distribution relationships, complementary technology, capital, or adjacent customer bases. These are often the most dangerous competitors because they do not appear in current competitive scorecards.
- Group competitors into tiers if there are more than 8 in the defined set: Tier 1 (market leaders by revenue or market share), Tier 2 (challengers with meaningful market presence), Tier 3 (niche or emerging players). Analyze 2 representatives from Tier 1 and 1 each from Tiers 2 and 3 to contain scope while preserving breadth.
- Label the source confidence of each competitor's data: verified (from public filings, press releases, or first-hand use), inferred (from reviews, job postings, conference talks), or estimated (extrapolated from market signals). This prevents false precision in the output.

### Step 3: Build Detailed Competitor Profiles

For each competitor in the primary comparison set, gather and assess the following dimensions:

- **Company fundamentals:** Founding year, headcount (use job postings as a proxy if not public), funding stage and total raised, estimated ARR or revenue (public filings, analyst estimates, or industry databases), and ownership structure (VC-backed, bootstrapped, public, PE-owned). Ownership matters because it signals growth pressure, exit timeline, and pricing behavior.
- **Target customer and go-to-market:** Primary customer segment (company size, industry, role), geographic focus, dominant acquisition channel (inside sales, product-led growth, channel/reseller, field sales), and customer concentration risk (do they depend on a few large accounts or have broad distribution?).
- **Product and capability snapshot:** Core value proposition (the single sentence they lead with in sales), key features that are differentiated vs. table stakes, known product limitations from customer reviews (G2, Capterra, Reddit, app store reviews are useful proxies), and recent product launches from release notes or press releases.
- **Pricing architecture:** Model (per-seat, usage-based, flat license, freemium), published price points or estimated range, free trial or freemium availability, and discounting behavior if knowable from sales intelligence. Note whether pricing is transparent or requires a sales conversation -- opaque pricing signals enterprise focus and value-based selling.
- **Momentum signals:** Recent funding rounds, major customer wins or losses (press releases, LinkedIn announcements), leadership changes, new partnership announcements, job posting velocity by department (engineering growth signals product investment; sales growth signals market expansion), and acquisition activity.
- **Competitive positioning claim:** The narrative the competitor uses to differentiate -- their "vs. X" positioning, their awards and analyst placements (Gartner Magic Quadrant position, G2 category leader badges), and the tone of their messaging (premium/enterprise vs. accessible/SMB vs. technical/developer-first).

### Step 4: Define and Weight Buying Criteria

The buying criteria are the dimensions customers actually use to make purchase decisions in this category. These are NOT the features the user wants to highlight -- they are what customers prioritize.

- Source buying criteria from customer reviews on G2, Capterra, and Trustpilot; from win/loss interview data if the user has it; from analyst reports for the category; or from the user's knowledge of their top reasons for winning and losing deals.
- Limit the criteria to 5-7. More than 7 criteria dilute the scorecard and obscure the meaningful differences.
- Assign weights that sum to 100%. Weight distribution should reflect the target customer segment's decision-making priorities, not the user's preferred strengths. A criterion that determines 70% of purchase decisions should not be weighted at 10%.
- Define explicit scoring anchors for the 1-5 scale for each criterion. Do not use a generic scale. Example for "Ease of Implementation": 1 = requires dedicated implementation consultant and 90+ days; 3 = guided self-service with 2-4 week typical onboarding; 5 = self-service, live in under 48 hours with no IT involvement. Undefined scales produce inconsistent, contested scores.
- Score each competitor based on evidence, not perception. A score of 4 should be supportable by a specific product capability, customer review quote, or benchmark result.
- Calculate weighted totals: for each company, multiply each criterion score by its weight and sum the products. A company scoring 3.8 vs. 3.2 represents a 19% composite advantage -- a meaningful gap, but one that can be overcome if the lower-scoring company dominates the highest-weight criterion.
- Identify which criteria represent "hygiene" (minimum threshold all competitors meet, so not differentiating) vs. "differentiators" (where significant variance exists and customers care deeply). Reserve strategic attention for differentiators.

### Step 5: Apply Porter's Five Forces Framework

Porter's Five Forces evaluates the structural attractiveness of the competitive environment -- not just who the competitors are, but what forces shape profitability and sustainability of competitive advantage.

- **Competitive rivalry intensity:** Assess market concentration (are there 3 dominant players or 50 fragmented ones?), revenue growth rate (fast-growing markets reduce zero-sum rivalry; stagnating markets intensify it), product differentiation (commodity markets have higher rivalry), switching costs (low switching costs accelerate rivalry), and exit barriers (companies with high fixed costs fight harder to stay). Rate H/M/L with a one-sentence driver statement.
- **Threat of new entrants:** Evaluate capital requirements to build a minimum viable product, regulatory requirements (licenses, compliance certifications, data sovereignty obligations), network effects that protect incumbents (does the product get better as more users join?), distribution moats (exclusive channel agreements, embedded platform relationships), and the time required to build brand credibility. Rate H/M/L with the single most important barrier.
- **Threat of substitutes:** Identify the functional alternatives -- not competing products, but different ways customers solve the same problem. Assess the relative price-performance of substitutes, the switching cost to move to a substitute, and whether customers currently use substitutes alongside or instead of the product. High substitute threat suppresses pricing power across the entire category.
- **Buyer power:** Assess the number of available alternatives (more alternatives = more buyer power), purchase volume concentration (a customer who represents 20% of revenue has enormous leverage), switching costs, price sensitivity in the segment, and whether the buyer has the ability to self-build (in-house development is a substitute that also signals buyer leverage).
- **Supplier power:** Identify critical dependencies -- cloud infrastructure providers, data licensors, API dependencies (mapping services, payment processors, identity providers), key talent markets, and distribution channel gatekeepers. Assess what share of value the supplier captures and whether alternatives exist. Platform dependencies (building on a single marketplace or distribution channel) deserve special attention.
- For each force, provide a specific causal chain: "Buyer power is HIGH because the average real estate agent evaluates CRM tools twice per year, has 12+ direct alternatives at their price point, and faces zero data migration costs since most competitors provide import tools."

### Step 6: Map Competitive Positioning

Positioning maps reveal where competitors cluster (crowded positions with high rivalry) and where gaps exist (potential white space). Produce two outputs: a quantitative scorecard (Step 4) and a spatial positioning map.

- Select the two most important buying criteria (typically the two with highest combined weight) as the axes of the positioning map. Do not choose axes based on where the user's company looks favorable -- choose the axes that matter most to customers.
- Place each competitor at their scored position. Proximity on the map indicates similarity of positioning -- companies close together are direct substitutes in customers' minds.
- Identify quadrant labels that describe the strategic archetype in each zone (e.g., "Premium All-in-One," "Affordable Entry-Level," "Specialist High Performance," "Gap -- No Current Occupant").
- Look for three specific patterns: (1) crowding, where 3+ competitors occupy the same quadrant and compete primarily on price; (2) isolation, where one competitor occupies a quadrant alone and likely commands premium pricing or high loyalty; (3) vacancy, where a quadrant is empty but represents an attractive combination of attributes that customers would value.
- Cross-reference the positioning map with momentum data from Step 3. A crowded quadrant with two well-funded competitors moving toward it is a different strategic situation than a crowded quadrant of declining legacy vendors.

### Step 7: Derive Strategic Implications and Recommendations

The recommendations section is where the analysis earns its value. Observations without recommendations are just a summary; recommendations without evidence are just opinions. This section must bridge the two.

- **Competitive advantages to defend:** Identify attributes where the user's company scores 1+ points higher than the nearest competitor on criteria weighted above 15%. These are the positions worth protecting through continued investment, customer success programs, or aggressive messaging. Calculate the cost of losing this advantage -- if a competitor closed the gap, what would the win-rate and churn implications be?
- **Vulnerabilities to address:** Identify criteria where the user scores 1+ points below a major competitor, especially on high-weight criteria. Categorize each vulnerability as: (a) closeable within one product cycle (12 months) with focused investment; (b) architecturally difficult and would require significant rebuild or acquisition; (c) intentional trade-off that the user has chosen to accept to serve a specific segment better.
- **White space opportunities:** Locate the positioning vacancies from Step 6 and validate them against buying criteria weights. A positioning vacancy on a low-weight criterion is not an opportunity -- it is an unwanted position. A vacancy on two criteria that together represent 40%+ of buying weight is a meaningful strategic opening.
- **Competitive threats to monitor:** Identify which competitor has the most dangerous momentum trajectory -- funding, hiring, product investment direction -- pointed at the user's core position. Specify the leading indicator that would signal the threat is materializing (e.g., "If LionDesk launches a native transaction tracker in Q2, it validates the segment demand and increases threat level from M to H").
- **Priority actions:** Every recommendation must include a functional owner (product, sales, marketing, engineering, BD), a time horizon (immediate: 0-4 weeks, near-term: 4-12 weeks, strategic: 3-12 months), and a measurable success criterion. Three to five priority actions is the right range -- more than five dilutes focus.

---

## Output Format

```
## Competitive Analysis: [Company/Product Name]

**Market:** [Industry and specific segment, e.g., "B2B SaaS -- mid-market HR software for <500-person companies"]
**Analysis Date:** [Date]
**Strategic Question:** [One specific decision this analysis informs]
**Competitive Set:** [Direct competitors analyzed] | [Substitutes/indirect]
**Data Confidence:** [Note any key data gaps or estimates flagged as [est.]]

---

### Section 1: Competitor Profiles

| Dimension | [Your Company] | [Competitor 1] | [Competitor 2] | [Competitor 3] | [Competitor 4] |
|-----------|---------------|----------------|----------------|----------------|----------------|
| Founded / Funding | | | | | |
| Headcount (est.) | | | | | |
| Revenue / ARR (est.) | | | | | |
| Ownership Structure | | | | | |
| Primary Target Segment | | | | | |
| Go-to-Market Motion | | | | | |
| Core Value Proposition | | | | | |
| Pricing Model | | | | | |
| Approx. Price Point | | | | | |
| Key Differentiator | | | | | |
| Known Weakness | | | | | |
| Momentum Signal | | | | | |
| Data Confidence | | | | | |

---

### Section 2: Buying Criteria Scorecard

**Score definitions for this analysis:**
- 5 = Best-in-class; customers cite this as a reason to buy
- 4 = Strong capability; meets all common requirements with minor gaps
- 3 = Adequate; meets baseline requirements but no differentiation
- 2 = Below par; customers note limitations; competitors exploit this gap
- 1 = Critical gap; customers cite this as a reason NOT to buy

| Criterion | Weight | Definition | [You] | [Comp 1] | [Comp 2] | [Comp 3] | [Comp 4] |
|-----------|--------|------------|-------|----------|----------|----------|----------|
| [Criterion 1 -- highest weight] | [%] | [1-sentence definition] | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
| [Criterion 2] | [%] | | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
| [Criterion 3] | [%] | | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
| [Criterion 4] | [%] | | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
| [Criterion 5] | [%] | | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
| [Criterion 6 -- optional] | [%] | | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
| **Weighted Total** | **100%** | | **[X.X]** | **[X.X]** | **[X.X]** | **[X.X]** | **[X.X]** |

**Scorecard Interpretation:**
- Composite gap vs. leading competitor: [X.X points / X% disadvantage]
- Criteria where user leads (score >= 1 point above nearest rival): [list]
- Criteria where user trails (score >= 1 point below nearest rival): [list]
- Hygiene criteria (all competitors score 3+, low differentiation value): [list]

---

### Section 3: Porter's Five Forces

| Force | Intensity | Key Driver | Implication for User |
|-------|-----------|------------|----------------------|
| Competitive Rivalry | H / M / L | [Specific causal driver] | [What this means for strategy] |
| Threat of New Entrants | H / M / L | [Primary entry barrier or its absence] | [What this means for strategy] |
| Threat of Substitutes | H / M / L | [Most credible substitute and its price-performance gap] | [What this means for strategy] |
| Buyer Power | H / M / L | [Switching cost level + number of alternatives] | [What this means for strategy] |
| Supplier Power | H / M / L | [Critical dependency, if any] | [What this means for strategy] |

**Overall Industry Attractiveness:** [H/M/L with one-paragraph explanation of the dominant forces and their combined effect on long-run profitability and defensibility in this market]

---

### Section 4: Positioning Map

**X-Axis:** [Criterion A -- highest-weight buying criterion] (Low → High)
**Y-Axis:** [Criterion B -- second-highest-weight buying criterion] (Low → High)

| Company | [Criterion A] Score | [Criterion B] Score | Quadrant | Strategic Archetype |
|---------|--------------------|--------------------|----------|---------------------|
| [You] | [1-5] | [1-5] | [Q: top-right, bottom-left, etc.] | [e.g., "Capable but expensive"] |
| [Comp 1] | [1-5] | [1-5] | | |
| [Comp 2] | [1-5] | [1-5] | | |
| [Comp 3] | [1-5] | [1-5] | | |
| [Comp 4] | [1-5] | [1-5] | | |

**Positioning Observations:**
- Crowded positions: [Which quadrant has 2+ competitors and what that implies for rivalry]
- Isolated positions: [Which company occupies a quadrant alone and what advantage that confers]
- Vacant positions: [Which quadrant is empty, whether it is strategically attractive, and what it would require to occupy it]

---

### Section 5: Strategic Recommendations

#### Competitive Advantages to Defend
| Advantage | Evidence | Risk if Lost | Recommended Defense |
|-----------|----------|--------------|---------------------|
| [Specific capability + criterion] | [Score gap + customer evidence] | [Win-rate / churn impact estimate] | [Action] |

#### Vulnerabilities to Address
| Vulnerability | Criterion Weight | Competitor Exploiting It | Closability | Recommended Response |
|---------------|-----------------|--------------------------|-------------|----------------------|
| [Gap description] | [%] | [Competitor name] | [Easy/Hard/Trade-off] | [Action] |

#### White Space Opportunities
| Opportunity | Supporting Evidence | Estimated Addressable Segment | Required Investment | Recommendation |
|-------------|--------------------|-----------------------------|---------------------|----------------|
| [Unmet need + positioning gap] | [Vacancy from map + buyer criterion weight] | [Rough segment size or %, if estimable] | [Build/Buy/Partner] | [Action] |

#### Competitive Threats to Monitor
| Threat | Competitor | Current Intensity | Trigger Signal to Watch | Escalation Action |
|--------|-----------|-------------------|------------------------|-------------------|
| [Threat description] | [Name] | H / M / L | [Specific observable signal] | [Response if signal fires] |

#### Priority Actions
| # | Action | Owner | Timeline | Success Metric |
|---|--------|-------|----------|----------------|
| 1 | [Most urgent action -- defend or close critical gap] | [Function] | [0-4 weeks] | [Measurable outcome] |
| 2 | [Near-term action -- exploit white space or close vulnerability] | [Function] | [4-12 weeks] | [Measurable outcome] |
| 3 | [Strategic action -- reposition or build new capability] | [Function] | [3-6 months] | [Measurable outcome] |
| 4 | [Monitoring or intelligence action] | [Function] | [Ongoing] | [Measurable outcome] |
| 5 | [Optional -- M&A, partnership, or channel action if relevant] | [Function] | [6-12 months] | [Measurable outcome] |
```

---

## Rules

1. **Never produce analysis without a named strategic question.** An analysis framed as "understand our competitive landscape" will produce generic observations. The strategic question must name the decision being made -- "Should we add enterprise SSO to move upmarket?" or "How do we respond to Competitor X entering our core segment?" If the user cannot supply one, offer four standard framings and confirm before proceeding.

2. **Never conflate market position with product quality.** A competitor described as "the market leader" may hold that position due to distribution advantages, legacy contracts, or aggressive pricing -- not superior capability. Always specify the metric behind any market position claim: market leader by revenue, by active users, by analyst ranking, or by customer count. Unqualified superlatives are analytically useless.

3. **Buying criteria weights must reflect customer priorities, not the user's strengths.** If the user's strongest dimension gets over-weighted, the scorecard will flatter the user and obscure real vulnerabilities. When the user's input implies self-serving weights, note the concern explicitly and suggest rebalancing based on what the customer would say drives the purchase decision.

4. **Mark all estimated data explicitly with [est.].** Competitor revenue, headcount, and pricing are frequently unavailable or unverifiable. Presenting estimates as facts destroys credibility when challenged. Flag every unverified figure and note the source or inference basis (e.g., "Estimated 150-200 employees based on LinkedIn headcount and job posting velocity [est.]").

5. **Score criteria on explicit anchors, not intuition.** Before scoring any criterion, define what a 1, 3, and 5 mean in concrete functional terms for that specific criterion in that specific market. A score of 3 for "API capability" in a developer-tools market means something completely different from a 3 in a consumer app market. Undefined scales produce scores that cannot be defended.

6. **Porter's Five Forces ratings require causal chains, not just labels.** A table showing "Buyer Power: H" with no driver is decorative, not analytical. Every force rating must include a one-sentence mechanism: what specific market characteristic drives that rating and what it implies for pricing power, investment requirements, or strategic behavior.

7. **The positioning map axes must use the two highest-weight buying criteria, unless those criteria are correlated.** If the two highest-weight criteria are strongly correlated (e.g., "ease of use" and "time to value" often move together), substitute the next-highest-weight uncorrelated criterion for one axis. A positioning map where the axes are highly correlated produces a diagonal line of competitors, not a meaningful spatial distribution.

8. **Recommendations must be triaged, not listed.** Every recommendation section must distinguish between "defend" (existing advantage at risk), "attack" (exploit a competitor vulnerability), "build" (develop a capability to access white space), and "monitor" (watch a developing threat). Mixing these categories without labels produces a list of actions without a strategic logic.

9. **Include at least one substitute or indirect competitor in every analysis.** Substitutes constrain the ceiling on pricing and reveal what customers will fall back to if category players fail to deliver value. Ignoring substitutes produces a competitive analysis that looks strong on paper but misses the real competitive threat -- the customer doing nothing, or solving the problem a different way entirely.

10. **Do not treat the analysis as static.** At the end of every analysis, identify 2-3 specific leading indicators to monitor that would signal the competitive situation has changed materially. These should be observable, specific signals -- a competitor files for a key patent, launches in a new geography, closes a major enterprise contract, raises a growth round -- not vague instructions to "watch the market." A competitive analysis without a re-evaluation trigger becomes dangerously outdated within 6-12 months in most technology markets.

11. **Respect the level of analysis the user needs.** A 45-minute executive briefing needs a 1-page summary and 3 priority actions. A product strategy offsite needs the full matrix, positioning map, and scenario planning. Before producing the output, confirm the intended use and audience, then adjust depth and format accordingly.

12. **Do not manufacture false precision.** Weighted totals like 3.47 vs. 3.51 imply a level of measurement precision that the underlying scoring does not support. Round composite scores to one decimal place and note that a difference smaller than 0.3 points is within scoring uncertainty -- the more important signal is which specific criteria drive the gap.

---

## Edge Cases

### New or Nascent Market With Few Direct Competitors

When the market is early-stage and fewer than 3 direct competitors exist, expand the competitive set to include: (1) adjacent-market solutions that customers currently use as workarounds, (2) enterprise-built internal solutions at target accounts, and (3) offshore or non-English-market analogs that signal what the category may evolve toward. Shift the Porter's analysis emphasis heavily toward Threat of New Entrants and Substitute Threat -- Competitive Rivalry is low not because the market is easy, but because it has not yet attracted the full field. Flag the market maturity stage explicitly in the header ("Early/Growth/Mature/Declining") because maturity determines which forces dominate and which strategic moves are appropriate.

### User's Company Is the New Entrant or Challenger

When the user is attacking an established market, reframe the analysis from "how do we compare?" to "where are incumbents vulnerable and how do we exploit it?" Incumbents in established markets typically have three structural weaknesses: (1) they are optimized for their original customer segment and become progressively less responsive to emerging segment needs, (2) their pricing is anchored to legacy cost structures that new entrants can undercut with modern architecture, and (3) their switching costs that protect existing customers also slow their own product evolution because they cannot break backward compatibility. Focus the recommendations on identifying the incumbent's under-served customer segment, the capability they have systematically under-invested in (typically revealed by review complaints and job posting gaps), and the distribution channel they do not dominate. The standard challenger playbook -- "land in a niche the incumbent ignores, build outward" -- requires identifying that niche precisely in the positioning map.

### Highly Fragmented Market With 15+ Competitors

When the competitive set contains more than 8-10 named competitors, applying the full matrix methodology to each one produces an unmanageable, low-signal output. Tier the competitors first: Tier 1 contains 2-3 players that account for 40-60% of market revenue or share; Tier 2 contains 3-4 established challengers; Tier 3 contains the long tail. Run the full competitor profile and scorecard for Tier 1 only. For Tier 2, run a condensed profile (value proposition, price point, key differentiator, known weakness). For Tier 3, note the category archetype they represent ("X niche players focused on vertical-specific compliance features") without individual profiling. This preserves analytical depth where it matters most while maintaining breadth awareness.

### Missing Pricing Data for Competitors

Opaque pricing is common in enterprise B2B software, professional services, and government contracting. When pricing data is unavailable, use these proxies in order of reliability: (1) published price pages or pricing tiers on the competitor's website; (2) review sites like G2 or Capterra where users often mention what they pay; (3) sales intelligence platforms where disclosed pricing sometimes appears in contract records; (4) job posting language for account executive roles, which often signals deal size ("closing $50K-$500K transactions" implies a specific pricing bracket); (5) Glassdoor or LinkedIn data on sales team compensation, which correlates with deal size. Mark all inferred pricing as [est.] and explain the inference basis. In the scorecard, score the "Price/Value" criterion based on the estimated position relative to the market, not on an absolute dollar figure.

### Analysis Requested for a Mature, Commoditized Market

In mature markets where features have converged and multiple competitors offer near-identical capabilities, the standard buying criteria scorecard will show compressed differentiation -- most companies scoring 3-4 on most criteria. In this environment: (1) shift analytical emphasis from product capability to go-to-market execution, customer success quality, pricing model innovation, and brand equity -- these are where meaningful differentiation persists in commoditized categories; (2) use customer retention and NPS benchmarks as proxy quality signals, since product differentiation alone no longer drives retention; (3) assess ecosystem lock-in specifically -- integrations, data portability constraints, and certification ecosystems are the new moats in mature SaaS markets; (4) the Porter analysis should show high Competitive Rivalry and high Substitute Threat (mature products get replaced by next-generation category entrants), which should drive recommendations toward either consolidation through acquisition or niche vertical specialization rather than broad feature competition.

### Win/Loss Analysis as Input

When the user provides win/loss data alongside the competitive brief, it is the most valuable input available and should anchor the scorecard. Win rates below 30% against a specific competitor on a specific deal type indicate a structural disadvantage -- not a sales execution problem. Win rates above 60% indicate a positional advantage worth identifying and defending. Tie win/loss data directly to the buying criteria: "We lose to Competitor X in deals where security compliance is the primary criterion (15% win rate) but win 72% of deals where time-to-deployment is the primary criterion." This type of data transforms the scorecard from an opinion-based exercise into an evidence-based strategic signal.

### Analysis Spans Multiple Customer Segments

Some markets have genuinely distinct buyer segments that use the same product category differently -- enterprise IT buyers, SMB owners, and individual practitioners may all use project management software but weight different criteria. When this applies, produce separate scorecard tables for each primary segment rather than a blended scorecard. A blended scorecard in a multi-segment market obscures the fact that the user may be competitive in one segment and uncompetitive in another. The Porter's Five Forces analysis, however, applies at the market level and does not need to be segmented -- the structural forces operate market-wide regardless of segment.

---

## Example

**Input:**

"We need a competitive analysis. We run a B2B SaaS platform for construction project management called BuildTrack -- $8M ARR, 320 customers mostly general contractors with 10-50 employees, growing 30% YoY. Our main competitors are Procore, Buildertrend, and CoConstruct. We're trying to decide whether to invest in a field inspection mobile app to move upmarket toward larger GCs, or double down on serving small GCs better. We win deals on price and ease of setup but keep losing to Procore on larger projects."

---

**Output:**

## Competitive Analysis: BuildTrack

**Market:** B2B SaaS -- Construction project management, small-to-mid-market general contractors
**Analysis Date:** [Current date]
**Strategic Question:** Should BuildTrack invest in a field inspection mobile app to pursue larger GC accounts (50-200 employees), or deepen its product for the sub-50-employee GC segment it currently dominates?
**Competitive Set:** Procore, Buildertrend, CoConstruct (direct) | Spreadsheets + email, JobNimbus, Contractor Foreman (substitutes / indirect)
**Data Confidence:** Revenue estimates for privately held competitors marked [est.]. Pricing estimates based on published tiers and G2 reviewer disclosures.

---

### Section 1: Competitor Profiles

| Dimension | BuildTrack | Procore | Buildertrend | CoConstruct |
|-----------|-----------|---------|--------------|-------------|
| Founded / Funding | [Founded year] / [Funding] | 2002 / Public (NYSE: PCOR) | 2006 / Private equity-owned | 2006 / Acquired by Buildertrend 2021 |
| Headcount (est.) | ~40 [est.] | ~3,800 | ~550 [est.] | ~100 (integrated into Buildertrend) |
| Revenue / ARR (est.) | $8M | ~$900M (FY2023, public filing) | ~$100M [est.] | Merged into Buildertrend |
| Ownership Structure | VC-backed | Publicly traded | PE-owned | Acquired; no longer independent |
| Primary Target Segment | Small GCs, 10-50 employees | Enterprise and mid-market GCs, 50-500+ employees | Small-to-mid residential builders | Residential custom builders and remodelers |
| Go-to-Market Motion | Product-led with inside sales | Field sales + channel partners | Inside sales with free trial | Inside sales, SMB focus |
| Core Value Proposition | Fast setup, affordable project management for small GC teams | End-to-end construction OS for large project teams | All-in-one for residential builders with client portal | Client communication and job costing for custom builders |
| Pricing Model | Per-user subscription | Per-user, tiered + module add-ons | Flat monthly by tier | Flat monthly by project volume |
| Approx. Price Point | ~$49-$99/user/month [est.] | $375-$600+/user/month [est., opaque enterprise pricing] | $299-$699/month flat [est.] | Now part of Buildertrend pricing |
| Key Differentiator | Price and 1-day onboarding | Deepest feature set; integrations ecosystem; industry certification programs | Residential-specific workflows; client portal | Strong job costing and client communication for remodelers |
| Known Weakness | No field inspection; limited reporting for complex projects | Price prohibitive for small GCs; steep learning curve; 3-6 month onboarding | Weaker for commercial GCs; limited field inspection depth | No longer independently developed post-acquisition |
| Momentum Signal | 30% ARR growth; planning mobile investment | Expanding internationally; launching Procore AI; pushing into financial services integrations | Merged with CoConstruct; expanding into commercial segment | Integration into Buildertrend complete; new branding underway |
| Data Confidence | Verified (internal) | High -- public filings | Medium -- [est.] based on industry reports | Medium -- post-acquisition disclosures limited |

---

### Section 2: Buying Criteria Scorecard

**Score definitions for this analysis:**
- 5 = Best-in-class; customers cite this as a reason to buy; supported by feature evidence and review data
- 4 = Strong; meets all typical requirements; one or two minor gaps
- 3 = Adequate; covers the baseline; customers don't cite it as a differentiator either positively or negatively
- 2 = Below par; G2/Capterra reviews note this as a limitation; competitors exploit the gap in sales cycles
- 1 = Critical gap; customers cite this as a reason not to buy; actively costs deals

| Criterion | Weight | Definition | BuildTrack | Procore | Buildertrend |
|-----------|--------|------------|-----------|---------|--------------|
| Ease of setup and adoption | 30% | Time from purchase to active use by field crews; measured by typical onboarding duration and IT involvement required | 5 | 2 | 4 |
| Core project management depth | 25% | RFI tracking, submittal management, schedule, budget, change orders -- completeness and reliability for target project type | 3 | 5 | 3 |
| Field inspection and mobile capability | 20% | Native mobile app for site inspections, punch lists, photo documentation, offline capability | 1 | 4 | 3 |
| Price / value for SMB GC | 15% | Total monthly cost for a 15-person GC team vs. capability delivered; lower score = higher relative cost | 5 | 1 | 4 |
| Integrations and ecosystem | 10% | Depth of integrations with accounting (QuickBooks, Sage), payroll, and estimating tools | 3 | 5 | 3 |
| **Weighted Total** | **100%** | | **3.20** | **3.55** | **3.35** |

**Scorecard Interpretation:**
- Composite gap vs. Procore (leading competitor): 0.35 points -- an 11% composite disadvantage at the overall level
- Criteria where BuildTrack leads by 1+ point: Ease of setup (5 vs. 4 next-best), Price/value (5 vs. 4 next-best)
- Criteria where BuildTrack trails by 1+ point: Field inspection (1 vs. 3-4), Core project management depth (3 vs. 5 for Procore)
- Hygiene criteria (all score 3+): Core project management baseline (meets minimum for all), integrations basics
- Critical insight: BuildTrack's 0.35 composite deficit vs. Procore is driven almost entirely by the Field Inspection criterion (weighted 20%), where BuildTrack scores 1 vs. Procore's 4. Closing that gap alone would bring BuildTrack's composite to 3.80, surpassing Procore.

---

### Section 3: Porter's Five Forces

| Force | Intensity | Key Driver | Implication for BuildTrack |
|-------|-----------|------------|---------------------------|
| Competitive Rivalry | H | 40+ vendors in construction PM software; Procore and Buildertrend accelerating feature development with 10-20x BuildTrack's R&D budget; Buildertrend/CoConstruct merger is compressing the mid-market further | BuildTrack cannot win on feature breadth against well-funded incumbents; must win on segment focus, speed, and price |
| Threat of New Entrants | M | Low-code development reduces build time for vertical-specific tools; PE-backed roll-ups acquiring niche players; however, deep construction workflow knowledge and GC trust take years to build | Monitor PE-backed acqui-hires; the most dangerous new entrant is a horizontal PM tool (Procore-scale) extending down-market with aggressive pricing, not a startup |
| Threat of Substitutes | H | Small GCs routinely manage projects via spreadsheets, email, and WhatsApp group chats; switching cost is low because the alternative is free and familiar; ~35% of sub-20-employee GCs still use no dedicated PM software [est.] | Price and simplicity are the primary weapons against substitutes; BuildTrack's onboarding advantage is its single most important anti-substitute lever |
| Buyer Power | H | Sub-50-employee GCs evaluate and switch software annually; average construction PM software tenure is 18-24 months in the SMB segment; no long-term contracts are typical; 12+ alternatives exist at BuildTrack's price point | Customer success investment is critical to retention; low switching costs mean that a competitor closing even one capability gap can trigger churn rapidly |
| Supplier Power | L | Cloud infrastructure (AWS/GCP) is commodity; no proprietary data dependency; integrations with QuickBooks/Sage are standard API partnerships, not locked arrangements | No critical supplier risk; maintain standard API relationships; watch for Procore attempting to make its own integrations ecosystem a lock-in mechanism for shared customers |

**Overall Industry Attractiveness: MEDIUM** -- Construction PM SaaS is a structurally growing market (construction tech adoption accelerating, paper-to-digital transition ongoing in trades) but competitively intense. High buyer power and high substitute threat suppress pricing power in the SMB segment, while Procore's scale creates a resource asymmetry that makes head-to-head feature competition unwinnable for BuildTrack. Long-run profitability in this market depends on establishing a defensible niche with high customer retention rather than pursuing broad feature parity.

---

### Section 4: Positioning Map

**X-Axis:** Ease of Setup and Adoption (Low → High) -- 30% weight criterion
**Y-Axis:** Field Inspection and Mobile Capability (Low → High) -- 20% weight criterion

| Company | Ease of Setup Score | Field Inspection Score | Quadrant | Strategic Archetype |
|---------|--------------------|-----------------------|----------|---------------------|
| BuildTrack | 5 | 1 | Top-left | "Fast and Accessible -- but no field capability" |
| Procore | 2 | 4 | Bottom-right | "Powerful but Complex -- requires dedicated admin" |
| Buildertrend | 4 | 3 | Top-center/right | "SMB-friendly with moderate field tools" |

**Positioning Observations:**
- Crowded positions: The top-right quadrant (Easy Setup + Strong Field Inspection) is currently unoccupied by any competitor. This is the vacancy that matters most to a GC evaluating tools for a 30-person team doing both office coordination and field inspections.
- Isolated positions: Procore occupies the bottom-right alone, which explains why it wins large GC deals unopposed -- no competitor matches its field + PM depth for complex projects. Its isolation confers pricing power at the enterprise tier.
- Vacant position analysis: The top-right quadrant (score 4-5 on both axes) represents "Easy AND field-capable" -- the combination small and growing GCs explicitly request. Buildertrend partially occupies this space but scores only 3 on field inspection. BuildTrack moving from a (5,1) to a (5,4) position on this map would occupy the most strategically attractive and currently empty quadrant.

---

### Section 5: Strategic Recommendations

#### Competitive Advantages to Defend

| Advantage | Evidence | Risk if Lost | Recommended Defense |
|-----------|----------|--------------|---------------------|
| Fastest onboarding in category (Score: 5 vs. next-best 4) | G2 reviews cite "live in one day" as top purchase driver; 30% of BuildTrack customers cite ease of setup as #1 reason they chose BuildTrack over Buildertrend | If Buildertrend closes onboarding gap, BuildTrack loses its only top-scoring differentiator on the highest-weight criterion; estimated 15-20% increase in churn risk | Invest in onboarding automation, in-app guided setup flows, and a customer success "fast start" program; defend the "<24 hours to first active project" benchmark as a public, verifiable claim |
| Price leadership for SMB segment (Score: 5 vs. next-best 4) | $49-$99/user/month vs. Procore's estimated $375-$600/user/month; cited in 40%+ of deal win notes | Buildertrend currently prices at a flat tier model that is competitive for teams larger than 8 users; BuildTrack's per-seat model becomes less favorable as team size grows past 15 | Introduce a team pricing tier (flat monthly at $599-$799 for teams of 10-25) to eliminate per-seat sticker shock in mid-market sales cycles |

#### Vulnerabilities to Address

| Vulnerability | Criterion Weight | Competitor Exploiting It | Closability | Recommended Response |
|---------------|-----------------|--------------------------|-------------|----------------------|
| No field inspection / mobile punch list capability | 20% | Procore actively uses this gap to disqualify BuildTrack in deals involving field crews; cited in 60%+ of losses to Procore | Closeable within 12 months: native iOS/Android app with punch list, photo documentation, and offline sync is well-understood scope; does not require architectural rebuild | Validate demand (see Priority Actions), then build a dedicated field inspection app as a named product module; target feature parity with Buildertrend (score 3) not Procore (score 4) as the first release milestone |
| Project management depth gap for complex projects (score 3 vs. Procore's 5) | 25% | Procore frames BuildTrack as a "starter tool" in competitive displacement conversations | Hard/Trade-off: matching Procore's submittal management, advanced RFI workflows, and financial integration depth would require 18-36 months of investment and would bloat the product for the core SMB segment | Do NOT attempt full parity with Procore on this criterion; instead, identify the 2-3 specific PM workflows that growing GCs need (change order approval tracking, basic budget-to-actual reporting) and build those specifically -- avoid the trap of building Procore-lite |

#### White Space Opportunities

| Opportunity | Supporting Evidence | Estimated Addressable Segment | Required Investment | Recommendation |
|-------------|--------------------|-----------------------------|---------------------|----------------|
| "Easy AND field-capable" positioning -- top-right quadrant currently unoccupied | Positioning map vacancy; Buildertrend scores only 3 on field inspection despite strong setup score; no competitor currently holds both a 4+ on ease of setup AND field inspection | GCs with 15-50 employees doing both office coordination and field work -- estimated 40,000-60,000 companies in the US in this profile [est.] | $800K-$1.2M engineering investment over 12 months to build a credible field inspection module | High-priority build: this is the single move that simultaneously addresses the top-scoring vulnerability AND occupies a vacant strategic position that Procore cannot easily enter (their onboarding complexity prevents them from credibly claiming the "easy" axis) |
| Residential remodeler segment orphaned post-CoConstruct acquisition | CoConstruct customers are being migrated to Buildertrend; customer reviews indicate friction and dissatisfaction with the merger experience; churn window is typically 6-18 months post-acquisition | CoConstruct had approximately 4,000 active customers at acquisition [est.]; even capturing 10-15% represents 400-600 new logos and $2-3M ARR potential | Primarily a sales and marketing investment; requires a CoConstruct migration tool (data import) and targeted outreach | Opportunistic but time-sensitive: launch a "Switch from Buildertrend" campaign targeting CoConstruct refugees within 60 days; build a one-click import from CoConstruct's standard data export format |

#### Competitive Threats to Monitor

| Threat | Competitor | Current Intensity | Trigger Signal to Watch | Escalation Action |
|--------|-----------|-------------------|------------------------|-------------------|
| Procore launching a simplified "Procore Essentials" tier to attack SMB segment | Procore | M -- Procore has historically focused up-market but faces growth pressure as a public company | Procore announces a sub-$100/user/month tier, launches a PLG (product-led growth) motion, or acquires a small-GC-focused startup | Immediately accelerate field inspection build; double down on onboarding speed as the differentiation Procore cannot replicate quickly; consider aggressive customer lock-in program (annual contracts with discounts) |
| Buildertrend deepening field inspection capability to 4-5 score | Buildertrend | M -- they have the engineering resources post-PE investment and are pushing into commercial | Buildertrend releases a dedicated field inspection app or announces a partnership with a field management tool | Re-evaluate the build timeline; consider accelerating to 9-month delivery; assess whether a strategic acquisition of a small field inspection tool would be faster |

#### Priority Actions

| # | Action | Owner | Timeline | Success Metric |
|---|--------|-------|----------|----------------|
| 1 | **Field inspection demand validation:** Survey 100 current customers and 50 recently lost deals on willingness to pay for a native field inspection module; identify the minimum viable feature set (punch list, photo, offline sync vs. full inspection forms) | Product + Customer Success | 0-4 weeks | Survey complete; clear go/no-go data on whether 30%+ of current customers would pay an add-on price of $15-$25/user/month; win-rate improvement projection documented |
| 2 | **CoConstruct migration campaign:** Build a one-click data import from CoConstruct's CSV export format; launch a targeted "refugees welcome" email and LinkedIn campaign at CoConstruct user communities | Engineering + Marketing | 4-8 weeks | Import tool live; 200+ migration leads generated; 30+ new customer conversions within 90 days of campaign launch |
| 3 | **Field inspection MVP build:** Begin engineering on iOS/Android field inspection module (punch list, photo documentation, offline mode, basic report export); target feature
