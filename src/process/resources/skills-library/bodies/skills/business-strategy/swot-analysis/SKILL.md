---
name: swot-analysis
description: |
  Produces a completed SWOT analysis grid with 4-6 items per quadrant and
  strategic implications for a specific company, product, or initiative.
  Use when the user asks to do a SWOT analysis, evaluate strengths and
  weaknesses, assess internal and external factors, or analyze strategic
  position before a decision.
  Do NOT use for competitive benchmarking against specific rivals (use
  competitive-analysis), industry-level force analysis (use
  porters-five-forces), or macro-environment scanning (use pestle-analysis).
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
# SWOT Analysis

## When to Use

Use this skill when any of the following conditions apply:

- The user explicitly requests a SWOT analysis for a company, product, business unit, initiative, or career/personal situation
- The user is preparing for a strategic planning session, board meeting, or investor presentation and needs to map internal capabilities against external conditions
- The user is evaluating whether to pursue a major strategic move -- entering a new market, launching a new product line, acquiring a company, or pivoting the business model -- and needs a structured internal/external audit before deciding
- The user wants to identify where to invest, cut, or defend resources across a 12-month or multi-year horizon
- The user is conducting pre-mortem analysis: asking "what could go wrong and do we have the capabilities to handle it?" before committing to a decision
- The user needs to align a leadership team around a shared picture of organizational reality -- SWOT is often used as a facilitation artifact, not just an analytical output
- The user wants to pressure-test a business plan, pitch deck, or strategic proposal by stress-testing assumptions about capabilities and market conditions

**Do NOT use this skill when:**

- The user needs a competitor-by-competitor breakdown comparing feature sets, pricing, and positioning -- use `competitive-analysis` instead, which is structured around rival profiling
- The user needs to map the five structural forces shaping industry profitability (supplier power, buyer power, substitutes, new entrants, rivalry intensity) -- use `porters-five-forces` instead
- The user needs a macro-environmental scan across Political, Economic, Social, Technological, Legal, and Environmental dimensions -- use `pestle-analysis` instead, which is purpose-built for that taxonomy
- The user is asking for a risk register or risk management plan -- SWOT is not a risk framework; use a structured risk matrix with likelihood-impact scoring instead
- The user wants a balanced scorecard or OKR framework -- SWOT informs strategy but does not replace goal-setting frameworks
- The user needs a post-mortem on a completed initiative -- retrospectives require a different structure focused on what happened, not what is strategically true now
- The user is evaluating a financial investment -- SWOT is insufficient for due diligence; direct toward financial modeling, DCF analysis, and comparable transactions

---

## Process

### Step 1: Collect Required Context Before Writing a Single Word of Analysis

Never produce a SWOT grid from a one-line prompt. The quality of a SWOT analysis is entirely determined by the specificity of inputs. Gather the following before proceeding:

- **Subject definition:** Exactly what is being analyzed -- a company, a product, a business unit, a specific initiative, a person, or a geographic expansion? A SWOT for "Acme Inc." and a SWOT for "Acme Inc.'s plan to enter the European SMB market" will produce entirely different, non-interchangeable outputs.
- **The animating question:** What strategic decision does this analysis inform? This is the most important input. "Should we launch a freemium tier?" produces a SWOT that surfaces different factors than "Should we raise a Series B?" even for the same company.
- **Timeframe:** Specify whether the analysis reflects current state, a 12-month forward view, or a 3-5 year horizon. Timeframe determines which weaknesses are critical (a 3-person team is a severe weakness for a 12-month growth sprint; it may be irrelevant for a 5-year horizon if hiring is planned).
- **Competitive reference set:** Identify 2-4 named competitors to serve as the relative benchmark for strengths and weaknesses. Without comparators, "strong brand" and "experienced team" are meaningless absolutes. If the user cannot name competitors, ask for the category and research it.
- **Known data points:** Revenue, customer count, team size, market share estimates, key metrics, recent events (funding rounds, product launches, leadership changes, customer losses). Specificity in inputs produces specificity in outputs.
- **Constraints:** What is the company NOT willing or able to do? Budget ceilings, regulatory environments, board mandates, geographic limits. Constraints shape which strategies are actually actionable.

If any of these are missing, ask for them explicitly. Do not proceed with assumptions silently -- if you must assume, state the assumption in the analysis header and flag it for validation.

### Step 2: Map Internal Strengths with Competitive Calibration

Strengths are capabilities, assets, or attributes that are internal to the organization and create advantage relative to the competitive reference set. Apply this discipline:

- **Test for internal control:** Ask "Can the organization lose this tomorrow if leadership makes a bad decision?" If yes, it is internal. If it depends on market conditions, it is an opportunity, not a strength.
- **Test for competitive differentiation:** A strength must be a relative advantage, not just a capability. "We have a website" is not a strength. "We have the highest-rated iOS app in the construction management category with a 4.8-star average across 3,000 reviews vs. the category average of 3.9" is a strength.
- **Categories to systematically probe:** Proprietary technology or IP; brand equity and customer loyalty; financial health (runway, margins, EBITDA); team depth and domain expertise; customer relationships and NPS scores; operational efficiency and unit economics; distribution channels and partnerships; data assets; regulatory licenses or certifications that competitors lack; speed of execution or culture attributes with demonstrated output.
- **Demand evidence for every item:** Never list a strength without an Evidence/Metric column entry. Use quantitative data where available (ARR, NPS, market share, patents held, years of experience, cost per acquisition). Use qualitative evidence with attribution where quantitative data is absent ("VP of Engineering has 12 years at aerospace firms; three competitors have no comparable domain hire on record").
- **Limit to 4-6 strengths.** More than 6 signals a lack of prioritization and dilutes the strategic value. If the user offers more than 6 candidates, ask them to rank by degree of competitive differentiation and take the top 6.

### Step 3: Map Internal Weaknesses with Brutal Specificity

Weaknesses are internal limitations that reduce competitive position or increase operational risk. This quadrant is the most difficult to populate accurately because it requires organizational honesty. Apply these discipline checks:

- **Test for internal control:** Same test as strengths -- it must be something the organization could fix if it had the will and resources. "Our product doesn't integrate with Salesforce" is a weakness (engineering can fix it). "Salesforce is bundling a competing product" is a threat.
- **Force specificity:** Replace vague statements with quantified ones at every opportunity. "Slow hiring" becomes "Average time-to-fill for engineering roles is 94 days vs. industry benchmark of 45 days, creating a 49-day drag on delivery velocity." "High churn" becomes "Net Revenue Retention of 82% vs. best-in-class SaaS benchmark of 110-120%, implying $360K of ARR erosion per year on current base."
- **Categories to systematically probe:** Resource gaps (funding runway, headcount relative to roadmap demands); technical debt or platform limitations; brand awareness gaps (aided vs. unaided awareness vs. competitors); customer concentration risk (top customer as % of revenue -- anything above 15% is a material weakness); key person dependencies; process immaturity (absent SOPs, no data infrastructure); geographic gaps; regulatory exposure; product feature gaps vs. customer expectations.
- **Distinguish between structural and situational weaknesses.** A structural weakness (e.g., a fundamental technology architecture choice that cannot be reversed without full rebuild) deserves higher severity weighting than a situational weakness (e.g., currently no partnerships in APAC, which could be established in 6 months). Note this distinction in the Impact column.
- **Do not soften weaknesses.** A common failure mode is reframing weaknesses as "areas for improvement." Call them what they are. A board-quality SWOT does not euphemize.

### Step 4: Map External Opportunities with Actionability Tests

Opportunities are favorable external conditions that the organization could act on. Every item in this quadrant must pass two tests:

- **Externality test:** The opportunity must exist regardless of whether this company acts on it. If it requires the company to create the condition, it is a strategic initiative, not an opportunity. "The EU digital construction regulation mandate taking effect in 2026 requires all commercial builders to use certified digital project management tools" is an external opportunity. "We could build a referral program" is an internal initiative.
- **Actionability test:** Every opportunity should be paired with a plausible action the company could take to capture it. Opportunities without paired actions are observations, not strategy inputs. The Potential Action column enforces this discipline -- if you cannot write a plausible action, the opportunity may be too vague or too distant to be useful in the analysis.
- **Categories to systematically probe:** Market growth trends (CAGR of the target segment, adoption curves for adjacent categories); regulatory tailwinds (laws, mandates, or standards that favor the offering); competitor vulnerability (a key competitor is distracted by an acquisition, fundraising, or leadership change; a competitor has recently received public negative press about product quality or data security); technology enablers (new APIs, infrastructure cost drops, AI capabilities) that make new features or business models viable; demographic and behavioral shifts (generational workforce change, remote work adoption, urbanization trends); underserved segments the company is positioned to reach; ecosystem partnership opportunities (platforms, distributors, complementary product integrations).
- **Calibrate time horizon:** Tag each opportunity as near-term (capturable within 12 months), medium-term (12-36 months), or long-term (3+ years). This informs which opportunities belong in the Priority Actions section.

### Step 5: Map External Threats with Impact and Probability Assessment

Threats are external conditions that could damage the company's competitive position, financial performance, or operational stability. Rigor requirements:

- **Externality test:** The threat must originate outside the organization. "Our team might quit" is an internal risk (a weakness). "A competing firm launched an aggressive compensation campaign targeting our engineering team" is an external threat.
- **Severity rating (High/Medium/Low):** Rate each threat on a two-dimensional basis -- probability of occurring within the analysis timeframe, and magnitude of damage if it does occur. High = high probability AND high impact, or certainty of medium impact. Medium = moderate probability OR moderate impact. Low = low probability or minimal impact even if realized. Document the rationale for each rating.
- **Categories to systematically probe:** New entrants (funded startups, big-tech adjacency, international expansion by foreign players); substitute products or business models (not direct competitors, but alternative ways buyers solve the problem); regulatory risk (pending legislation, enforcement actions, data privacy exposure, tariff exposure); macroeconomic sensitivity (is revenue tied to discretionary spend, construction starts, enterprise IT budgets, or other cyclical drivers?); technology disruption (does a technology shift obsolete a core product assumption?); supply chain or vendor concentration (if a key vendor raises prices or exits, what is the cost and timeline to replace?); talent competition (if a major employer opens a local office, what does it do to the wage and attrition environment?); customer consolidation (if key customers merge, are acquired, or shift buying behavior, what is the revenue impact?).
- **Quantify wherever the user provides data or where it is publicly known.** "15% tariff on imported hardware components translates to a $240K annual cost increase at current component volumes" is more useful than "trade policy risk."

### Step 6: Perform Cross-Quadrant Strategic Synthesis (TOWS Analysis)

The SWOT grid is raw material. The strategic value comes from cross-quadrant synthesis, formally called TOWS analysis. The four strategy types are:

- **S-O strategies (Leverage/Exploit):** Identify where specific strengths can be directly deployed to capture specific opportunities. This is offensive strategy -- go where you are strong and the wind is at your back. Example: S3 (proprietary industry-specific data model) + O2 (new open API standard enabling ecosystem integrations) = Build integration marketplace to monetize data assets and capture new distribution.
- **W-O strategies (Invest/Build):** Identify where a weakness is the primary thing preventing the company from capturing an opportunity. This signals where to invest -- fill the gap, capture the prize. Example: W2 (no mobile app) + O1 (60% of field workers use mobile-first tools) = Mobile app development is the prerequisite investment for the largest near-term opportunity.
- **S-T strategies (Defend/Mitigate):** Identify where existing strengths serve as natural defenses against specific threats. This is about protecting existing position. Example: S1 (highest NPS in category at 68 vs. industry average of 42) + T1 (well-funded new entrant targeting same customer segment) = NPS advantage means high switching cost; activate customer reference program and expand loyalty features before new entrant achieves distribution.
- **W-T strategies (Avoid/Minimize):** Identify where a weakness collides with a threat to create an existential or high-severity risk. This is the danger quadrant -- it defines what must be resolved defensively before anything else. Example: W4 (only 4 months runway) + T3 (credit markets tightening, reducing bridge loan options) = Fundraising must begin immediately; defer all non-revenue-generating initiatives until Series A closes.
- **Prioritize across the four cells:** Not all 16 possible cross-references are equally important. Select the 2-3 highest-leverage combinations from each cell type and build the Priority Actions section from those. A SWOT that generates 20 undifferentiated actions is not useful -- one that generates 3-5 prioritized, owner-assigned, time-bound actions drives execution.

### Step 7: Populate Priority Actions and Assign Ownership

The Priority Actions section is the deliverable the user acts on. Requirements for each action:

- **Reference the SWOT IDs** (e.g., S2+O3) so the strategic logic is traceable
- **State the action in verb-noun format:** "Conduct 20 residential builder interviews" not "validate the market"
- **Assign a suggested owner by role** (not name, since the AI does not know org structures): CEO, VP Product, VP Sales, CTO, CFO, Head of Marketing
- **Assign a timeline:** Either a specific number of weeks from now, or a deadline date if the user provided one
- **State the decision gate:** What will this action produce, and what decision does it enable? "Hire two enterprise AEs targeting Fortune 500 construction firms (VP Sales, within 6 weeks) to test whether ACV above $50K is achievable before committing to enterprise product investment" is a complete Priority Action entry.
- Limit to 3-5 Priority Actions. More than 5 signals the analysis has not done the prioritization work.

---

## Output Format

```
## SWOT Analysis: [Company / Product / Initiative Name]

**Animating Question:** [The specific strategic decision this analysis informs]
**Analysis Subject:** [Exact scope -- e.g., "CoreBuild SaaS platform, commercial construction segment"]
**Timeframe:** [Current state | Next 12 months | 3-year horizon -- specify which]
**Competitive Reference Set:** [Named competitors used as relative benchmarks]
**Key Assumptions:** [Any inputs assumed rather than confirmed -- flag for user validation]
**Date:** [Date of analysis]

---

### Strengths (Internal -- Relative Advantages)

| ID | Strength | Evidence / Metric | Competitive Significance |
|----|----------|-------------------|--------------------------|
| S1 | [Specific, named capability] | [Quantitative or attributed qualitative evidence] | [Why this matters vs. named competitors] |
| S2 | [Specific, named capability] | [Quantitative or attributed qualitative evidence] | [Why this matters vs. named competitors] |
| S3 | [Specific, named capability] | [Quantitative or attributed qualitative evidence] | [Why this matters vs. named competitors] |
| S4 | [Specific, named capability] | [Quantitative or attributed qualitative evidence] | [Why this matters vs. named competitors] |
| S5 | [Specific, named capability] | [Quantitative or attributed qualitative evidence] | [Why this matters vs. named competitors] |

---

### Weaknesses (Internal -- Relative Disadvantages)

| ID | Weakness | Severity | Impact on Decision |
|----|----------|----------|--------------------|
| W1 | [Specific, named limitation] | Structural / Situational | [How this constrains strategy or creates risk] |
| W2 | [Specific, named limitation] | Structural / Situational | [How this constrains strategy or creates risk] |
| W3 | [Specific, named limitation] | Structural / Situational | [How this constrains strategy or creates risk] |
| W4 | [Specific, named limitation] | Structural / Situational | [How this constrains strategy or creates risk] |
| W5 | [Specific, named limitation] | Structural / Situational | [How this constrains strategy or creates risk] |

---

### Opportunities (External -- Favorable Conditions)

| ID | Opportunity | Time Horizon | Potential Action |
|----|------------|--------------|-----------------|
| O1 | [Specific external condition] | Near / Medium / Long | [Concrete action the company could take] |
| O2 | [Specific external condition] | Near / Medium / Long | [Concrete action the company could take] |
| O3 | [Specific external condition] | Near / Medium / Long | [Concrete action the company could take] |
| O4 | [Specific external condition] | Near / Medium / Long | [Concrete action the company could take] |
| O5 | [Specific external condition] | Near / Medium / Long | [Concrete action the company could take] |

---

### Threats (External -- Adverse Conditions)

| ID | Threat | Probability | Impact | Severity | Rationale |
|----|--------|-------------|--------|----------|-----------|
| T1 | [Specific external risk] | H / M / L | H / M / L | H / M / L | [Why rated this way; quantify if possible] |
| T2 | [Specific external risk] | H / M / L | H / M / L | H / M / L | [Why rated this way; quantify if possible] |
| T3 | [Specific external risk] | H / M / L | H / M / L | H / M / L | [Why rated this way; quantify if possible] |
| T4 | [Specific external risk] | H / M / L | H / M / L | H / M / L | [Why rated this way; quantify if possible] |
| T5 | [Specific external risk] | H / M / L | H / M / L | H / M / L | [Why rated this way; quantify if possible] |

---

### Strategic Synthesis (TOWS Cross-Reference)

**S-O Strategies -- Leverage Strengths to Exploit Opportunities**
- [S# + O#]: [Specific strategy with mechanism and expected outcome]
- [S# + O#]: [Specific strategy with mechanism and expected outcome]

**W-O Strategies -- Close Gaps to Capture Opportunities**
- [W# + O#]: [Specific investment or build action, with what changes if gap is closed]
- [W# + O#]: [Specific investment or build action, with what changes if gap is closed]

**S-T Strategies -- Deploy Strengths to Defend Against Threats**
- [S# + T#]: [Specific defensive action and how the strength neutralizes or reduces the threat]
- [S# + T#]: [Specific defensive action and how the strength neutralizes or reduces the threat]

**W-T Strategies -- Protect Against Compounded Vulnerability**
- [W# + T#]: [Specific risk mitigation or avoidance action -- this is the danger quadrant]
- [W# + T#]: [Specific risk mitigation or avoidance action -- this is the danger quadrant]

---

### Priority Actions

| # | Action | SWOT Logic | Suggested Owner | Timeline | Decision Gate |
|---|--------|-----------|----------------|----------|---------------|
| 1 | [Verb-noun action description] | [S/W/O/T IDs] | [Role] | [Weeks / Date] | [What this enables] |
| 2 | [Verb-noun action description] | [S/W/O/T IDs] | [Role] | [Weeks / Date] | [What this enables] |
| 3 | [Verb-noun action description] | [S/W/O/T IDs] | [Role] | [Weeks / Date] | [What this enables] |

---

### Analysis Caveats
- [Any assumption that was stated but not confirmed by the user]
- [Any data gap that limits confidence in a specific quadrant]
- [Recommendation for which quadrant to revisit with more research]
```

---

## Rules

1. **Never begin the analysis without the animating question.** A SWOT without a decision context is an organizational trivia exercise. "Tell me about our company" is not sufficient. If the user does not provide a strategic question, ask: "What specific decision will this SWOT inform?" before writing anything.

2. **Maintain strict internal/external discipline.** Internal factors (Strengths and Weaknesses) are things the organization controls. External factors (Opportunities and Threats) are things the organization must respond to but cannot control. The most common error is placing market trends in Strengths ("the market is growing in our favor") -- market growth is an Opportunity, not a Strength. Validate every item against this test before placing it.

3. **Strengths and Weaknesses must be relative, not absolute.** "We have 50 engineers" is not a strength or weakness without context. "We have 50 engineers vs. our primary competitor's 12-person team" is a strength. "We have 50 engineers vs. the 300-person team at the category leader" may be a weakness. Always name the comparator.

4. **The 4-6 item discipline is a prioritization rule, not a counting rule.** The goal is not to fill boxes but to identify what genuinely matters. If you have only 3 material weaknesses, list 3 and note that the team identified no additional material internal limitations. Do not pad with weak items to reach 4. If you have 10 legitimate threats, select the 4-6 with highest severity and note that additional lower-priority threats exist.

5. **The TOWS synthesis section is not optional.** A SWOT grid without cross-quadrant analysis is a list, not a strategy. The synthesis is where the analytical value is created. If the user asks for "just the grid," provide the grid AND note that the strategic implications section is available -- then provide a condensed version without the user having to ask again.

6. **Quantify or attribute every item.** "Strong customer relationships" is not acceptable. "Net Promoter Score of 67 vs. category median of 31, based on Q3 survey of 180 customers" is acceptable. "Strong customer relationships -- evidenced by 94% contract renewal rate and three unprompted reference calls in the last quarter" is acceptable. If the user cannot provide data, note the measurement gap in the Evidence column and recommend how to close it.

7. **Severity ratings on threats must use two dimensions, not one.** Severity = f(probability, impact). A low-probability, catastrophic-impact threat (e.g., primary enterprise customer representing 40% of ARR going bankrupt) and a high-probability, moderate-impact threat (e.g., a competitor shipping a feature parity update) are both "medium severity" by single-dimension scoring but require completely different responses. Show both dimensions.

8. **Do not conflate the absence of a strength with the presence of a weakness.** "We have no mobile app" is a weakness only if a mobile app is expected by customers or required for competitive parity. If no competitor offers a mobile app and customers do not request one, the absence is neutral. Test every potential weakness against: "Does this absence reduce our competitive position or create material operational risk?"

9. **Priority Actions must be the most important output for execution-oriented users.** For users preparing for a board meeting, investor conversation, or strategic planning session, the Priority Actions table is what they will actually use. Make sure every action is specific enough that someone could begin work on it tomorrow without further clarification. Vague actions like "explore partnerships" or "invest in product" fail this test.

10. **When the user's context reveals a W-T collision of high severity, flag it prominently.** If a high-severity threat directly intersects with a structural weakness -- especially combinations involving low cash runway with market downturns, key person dependency with talent competition, or customer concentration with a major customer at risk -- call it out in a bolded warning before the Priority Actions section. These combinations represent existential risks that override normal strategic prioritization logic.

11. **Distinguish between strategic and operational items.** SWOT is a strategic framework. "Our Slack channels are disorganized" is an operational issue, not a strategic weakness, unless the communication breakdown demonstrably impairs strategic execution at scale. Filter out operational noise and focus on factors that affect market position, financial sustainability, competitive advantage, or strategic optionality.

12. **Never produce a SWOT that is interchangeable with another company in the same category.** If the analysis could describe any SaaS company, any retail brand, or any nonprofit, it has failed. Every item must be specific enough that a reader could identify the subject from the SWOT alone.

---

## Edge Cases

### Pre-Revenue or Pre-Product Startup
The framework applies but the evidence base changes fundamentally. Strengths shift to: founding team credentials and prior exits, proprietary research or pilot data, exclusive relationships or LOIs from anchor customers, and speed of iteration demonstrated in prototype cycles. Weaknesses are dominated by unproven assumptions -- every key business model assumption (willingness to pay, distribution channel, product-market fit) is a weakness until validated. Opportunities should weight first-mover positioning and category creation premium -- being first in a new category is worth explicitly naming. Threats must include funding risk: "Current runway of 8 months at current burn rate means a failed seed extension triggers wind-down" is a T1-level threat with H/H severity. Do not soft-pedal existential risks for startups.

### Internal Project or Initiative (Not a Company)
Reframe all four quadrants to the project scope. Internal means internal to the project or team: Strengths become executive sponsorship, dedicated budget, cross-functional team composition, prior successful implementations. Weaknesses become scope ambiguity, competing priorities for shared resources, absence of clear decision rights. External means organizational environment or market environment: Opportunities include platform migrations creating integration windows, organizational appetite for change, budget cycles opening. Threats include budget reallocation risk, organizational change fatigue, competing initiatives. The animating question format changes to: "Should we proceed with this initiative / choose this approach / prioritize this feature set?"

### Nonprofit or Mission-Driven Organization
Replace competitive advantage language with mission-effectiveness and sustainability language. Strengths include: community trust earned over years of service, volunteer base size and retention, government or foundation relationships enabling preferential funding access, program outcome data demonstrating efficacy. Weaknesses include: restricted grant funding limiting operational flexibility (note the % of revenue that is restricted vs. unrestricted), volunteer capacity constraints, absence of earned revenue making sustainability fragile. Opportunities include: policy environments that increase demand for the mission, corporate ESG mandates creating new partnership and funding channels, digital tools reducing program delivery cost. Threats include: funding cycle cliffs (a multi-year grant ending without replacement pipeline), policy reversals affecting the population served, reputation risk from program failures or governance issues.

### Mature Business Defending Market Position
When the subject is a large, established company rather than a startup or growth-stage company, the center of gravity shifts. Strengths are often structural: distribution scale, brand recognition measured by aided awareness, regulatory compliance infrastructure, customer inertia and switching costs. Weaknesses are often structural too: organizational bureaucracy slowing product velocity, legacy technology architectures requiring expensive maintenance, cost structures optimized for yesterday's competitive environment. Opportunities often involve adjacency expansion or category renewal rather than category creation. Threats are often from below (low-cost disruptors) and from technology (platform shifts that render existing distribution advantages less relevant). The TOWS synthesis for mature businesses should heavily weight W-T analysis, as the danger of simultaneous structural weakness and disruption threat is the primary strategic scenario.

### User Provides No Competitor Names
This is a data gap that limits the relative calibration of Strengths and Weaknesses. Do not refuse to proceed, but do note the limitation explicitly in the Analysis Caveats section. Use two substitutes: category norms and industry benchmarks where publicly available (e.g., "median SaaS NPS of 31, median B2B SaaS NRR of 102%"), and logical inferences from the market structure the user describes. Ask the user to name 2-3 competitors before finalizing -- if they genuinely cannot, recommend that competitive research be listed as a Priority Action before any major strategic commitment is made.

### User Asks for a "Quick SWOT" or Has a Time Constraint
Produce the full structured grid -- do not skip quadrants or the TOWS synthesis. However, compress to exactly 4 items per quadrant (the floor for analytical credibility) and condense each Strategic Synthesis cell to 1-2 sentences rather than full strategic narratives. Condense the Priority Actions to the 3 most critical. Explicitly note: "This is a condensed analysis. A full strategic planning session would expand each quadrant and deepen the cross-quadrant synthesis." Offer to expand any specific section on request.

### The SWOT Reveals a Fundamental "Do Not Proceed" Signal
Occasionally a rigorous SWOT produces a clear recommendation against the user's assumed direction -- for example, a W-T collision so severe that no S-O strategy can offset it within a reasonable timeframe, or a weakness so structural that the opportunity cannot be captured without a fundamental business model change. In these cases, do not soften the conclusion. Present the analysis honestly, flag the W-T collision in a highlighted warning block, and state the implication directly: "The combination of W2 (12-month product rebuild required before feature parity) and T1 (well-capitalized competitor entering the segment in Q2) creates a window-closing scenario where the opportunity (O1) will likely be captured by others before this company can act. The analysis suggests a pivot strategy or partnership approach rather than organic development."

### Multiple Stakeholders with Conflicting Definitions of Strengths and Weaknesses
In facilitation contexts, different team members often disagree on whether something is a strength or a weakness (e.g., "our culture of moving fast" may be a strength to sales and a weakness to engineering). When the user describes this scenario, recommend a structured dot-voting approach: list all candidate items, have each stakeholder independently categorize and weight them, and surface disagreements as explicit discussion items rather than forcing premature consensus. Note in the output that items with high disagreement are themselves strategic signals -- they reveal gaps in shared organizational understanding that must be resolved before execution alignment is possible.

---

## Example

**Input:** "Can you do a SWOT for my company? We're a 35-person B2B SaaS company called FieldOps. We make workforce scheduling and compliance software for home services companies (HVAC, plumbing, electrical contractors). We have $4.8M ARR, growing 40% YoY, 380 customers, mostly small businesses under 20 technicians. Average contract is $12,600/year. Main competitors are ServiceTitan and Jobber. We're thinking about moving upmarket to target companies with 50-200 technicians. NPS is 61. Churn is 8% annually."

---

## SWOT Analysis: FieldOps -- Upmarket Expansion Decision

**Animating Question:** Should FieldOps move upmarket to target home services companies with 50-200 technicians, and if so, how?
**Analysis Subject:** FieldOps B2B SaaS platform -- workforce scheduling and compliance module suite
**Timeframe:** Next 12-18 months (decision horizon for upmarket go-to-market pivot)
**Competitive Reference Set:** ServiceTitan (primary upmarket competitor), Jobber (primary SMB competitor)
**Key Assumptions:** 8% annual churn is logo churn; Net Revenue Retention not confirmed -- assumed ~95% pending user validation. Upmarket segment defined as 50-200 technician contractors. Enterprise (200+) is excluded from this analysis scope.
**Date:** [Current date]

---

### Strengths (Internal -- Relative Advantages)

| ID | Strength | Evidence / Metric | Competitive Significance |
|----|----------|-------------------|--------------------------|
| S1 | Strong product-market fit in SMB segment | NPS of 61 vs. ServiceTitan's publicly cited NPS of ~28; 380 customers with 8% logo churn | NPS advantage signals high switching cost and organic reference potential -- key for upmarket expansion where references drive enterprise sales cycles |
| S2 | Embedded compliance module differentiation | Compliance features purpose-built for licensing, OSHA certification tracking, and state-specific regulation variances | ServiceTitan and Jobber treat compliance as an add-on afterthought; FieldOps has structural product advantage in regulated trade verticals |
| S3 | Lean unit economics supporting reinvestment capacity | $4.8M ARR across 35 staff = $137K ARR per employee; 40% YoY growth at current burn indicates healthy efficiency | Capital efficiency means FieldOps can fund upmarket investment from organic cash flow if ACV expansion succeeds, avoiding dilutive fundraise |
| S4 | Deep SMB customer base as reference and case study engine | 380 customers, many of whom may have grown beyond 20 technicians, represent natural upmarket leads and proof points | Upmarket buyers with 50-200 technicians are skeptical of new vendors; existing customer growth stories provide category-specific social proof |
| S5 | 40% YoY growth rate sustains investor and talent attention | 40% growth in vertical SaaS is top-quartile performance; provides momentum for enterprise hire recruitment and any future fundraising | ServiceTitan has slowed post-IPO; Jobber is SMB-focused; FieldOps growth rate creates a credible challenger narrative in recruiting and PR |

---

### Weaknesses (Internal -- Relative Disadvantages)

| ID | Weakness | Severity | Impact on Decision |
|----|----------|----------|--------------------|
| W1 | Current ACV of $12,600 is below the threshold for enterprise sales motions | Structural | 50-200 technician companies will expect dedicated implementation, CSM support, and SLA commitments; these require $30K-$80K ACV to be unit-economic. At $12,600, FieldOps cannot fund the required sales and success infrastructure |
| W2 | No enterprise sales capability or process | Structural | Current team almost certainly uses product-led growth or inbound SMB sales with short cycles. Upmarket requires 6-12 month sales cycles, RFP response capability, procurement navigation, and executive-level selling -- none of which are currently developed |
| W3 | Product architecture may not support multi-location, multi-crew complexity | Situational -- requires technical audit | Companies with 50-200 technicians often operate across 3-10 locations with complex scheduling hierarchies; if the data model and permissions architecture were built for single-location SMBs, upmarket expansion requires significant platform rework before it can be sold |
| W4 | 35-person team has limited capacity for parallel strategic tracks | Situational | Simultaneously maintaining SMB growth at 40% YoY while building enterprise sales, implementation, and product capabilities is a capacity constraint that commonly causes both motions to underperform; FieldOps is not yet at the team size where true parallel investment is feasible |
| W5 | 8% annual logo churn limits expansion ARR compounding | Situational | Best-in-class vertical SaaS benchmarks 5-6% logo churn at this stage; 8% means FieldOps is replacing roughly $384K of ARR annually before growing, creating a treadmill effect that constrains net expansion math |

---

### Opportunities (External -- Favorable Conditions)

| ID | Opportunity | Time Horizon | Potential Action |
|----|------------|--------------|-----------------|
| O1 | Mid-market home services contractors (50-200 technicians) are structurally underserved -- ServiceTitan targets 200+ and Jobber targets under 20 | Near (0-12 months) | Define a distinct "Growth" packaging tier with pricing at $35K-$55K ACV that includes multi-location scheduling, enterprise SLAs, and dedicated CSM -- explicitly positioned between Jobber and ServiceTitan |
| O2 | Increasing state-level contractor licensing and apprenticeship compliance mandates (California, New York, Texas leading) are creating urgent demand for compliance automation | Near (0-12 months) | Run targeted ABM campaign to contractors in the three highest-compliance-burden states leading with compliance ROI; compliance is FieldOps' most defensible product moat |
| O3 | Private equity-backed contractor roll-ups are aggregating smaller contractors into 50-200-person entities at scale | Medium (12-24 months) | Build a "roll-up readiness" product feature set (multi-entity reporting, consolidated billing, technician onboarding at scale) and pitch FieldOps to PE firms managing home services portfolios as a platform tool |
| O4 | FieldOps' SMB customers who have grown organically to 25-40 technicians are natural upgrade candidates | Near (0-9 months) | Conduct a full customer cohort analysis to identify the 30-50 customers who have outgrown SMB tier; launch a dedicated expansion playbook with migration incentives before they evaluate ServiceTitan independently |
| O5 | Construction and home services tech categories are receiving increased VC and PE investment, indicating investor appetite for vertical SaaS | Medium (12-24 months) | If upmarket ACV expansion proves successful, a Series B raise to fund dedicated enterprise sales team becomes more viable and better-priced |

---

### Threats (External -- Adverse Conditions)

| ID | Threat | Probability | Impact | Severity | Rationale |
|----|--------|-------------|--------|----------|-----------|
| T1 | ServiceTitan could extend downmarket with a SMB-priced tier, directly attacking FieldOps' customer base | M | H | H | ServiceTitan has capital post-IPO; downmarket extension with simplified pricing would threaten FieldOps' core 380-customer base. A 25% churn event would erase approximately $1.2M ARR |
| T2 | Upmarket expansion dilutes SMB product focus, causing current customer NPS and churn to deteriorate | H | M | H | This is the most likely self-inflicted threat; roadmap resources spent building multi-location features for 50-200-technician use cases will slow feature delivery for core 20-and-under customers, risking the NPS advantage that differentiates FieldOps |
| T3 | ServiceTitan and Jobber both have established integrations with QuickBooks, Stripe, and major HVAC supplier platforms that mid-market buyers expect | H | M | M | Integration ecosystem gaps are a frequent deal-killer in mid-market evaluations; if FieldOps lacks 5-8 standard integrations, procurement evaluations at 50-200 technician companies will favor incumbents regardless of scheduling feature superiority |
| T4 | Macroeconomic slowdown in residential real estate and new construction reduces demand for HVAC and plumbing services, compressing contractor budgets | M | M | M | Home services contractors are semi-cyclical; a 10-15% reduction in residential construction starts (as seen in 2022-2023) reduces technician headcount and new software investment appetite among the target upmarket segment |
| T5 | A well-funded vertical SaaS entrant targeting the 50-200 technician "gap" segment could preempt FieldOps' upmarket move | L | H | M | The segment gap is visible to any experienced vertical SaaS investor; a seed or Series A competitor with dedicated focus could achieve feature parity in 18-24 months. Low current probability, but impact would be severe if FieldOps delays the move |

---

### Strategic Synthesis (TOWS Cross-Reference)

**S-O Strategies -- Leverage Strengths to Exploit Opportunities**

- **S2 + O2:** FieldOps' compliance module is the strongest available compliance product in the category. State-level mandate tailwinds in California, New York, and Texas create a high-urgency sales hook. Lead the upmarket expansion with a compliance-first value proposition -- "ServiceTitan cannot match our compliance depth; Jobber does not serve your scale" -- before building out full mid-market scheduling features. This allows revenue-generating upmarket sales to begin within 6 months without requiring the full platform rearchitecture.

- **S4 + O4:** The 380-customer base contains an estimated 30-60 accounts that have organically grown to 25-40 technicians and are already running workarounds in the current SMB product. These customers represent the highest-probability, lowest-CAC upmarket opportunity. A structured expansion program targeting this cohort should be the first revenue action, producing upmarket ACV data before any outbound enterprise motion is built.

**W-O Strategies -- Close Gaps to Capture Opportunities**

- **W1 + O1:** To serve the 50-200 technician segment profitably, FieldOps must redesign its packaging to reach $35K-$55K ACV. This requires not just price increases but scope expansion (dedicated CSM, SLA tiers, implementation services, multi-location licensing). Designing this new tier is a prerequisite for the upmarket motion -- selling at $12,600 to 80-technician companies creates a customer success cost structure that cannot break even.

- **W2 + O3:** PE-backed roll-ups require vendor relationships at the portfolio-company level, not the individual contractor level. FieldOps lacks enterprise sales capability today but can shortcut the learning curve by hiring one experienced vertical SaaS enterprise account executive from the HVAC or field services space. This single hire -- targeted at someone who has closed $100K+ ACV deals in vertical SaaS -- would bootstrap the enterprise sales muscle needed to pursue O3.

**S-T Strategies -- Deploy Strengths to Defend Against Threats**

- **S1 + T1:** FieldOps' NPS of 61 vs. ServiceTitan's ~28 is a structural defense against downmarket encroachment. Activate this advantage immediately: build a customer reference program that produces case studies, G2 and Capterra reviews, and referral incentives. A well-documented NPS and retention story makes ServiceTitan's downmarket pricing play a feature comparison battle rather than a brand battle -- FieldOps wins feature comparisons in its core segment.

- **S3 + T2:** The lean unit economics (low burn, 40% growth) give FieldOps the financial flexibility to hire 3-4 additional engineers specifically dedicated to upmarket product features. Ring-fencing upmarket development resources structurally -- separate sprint teams, separate product owner -- prevents the SMB roadmap from being cannibalized and protects the NPS advantage against T2.

**W-T Strategies -- Protect Against Compounded Vulnerability**

- **W3 + T3:** ⚠️ **High-Priority Risk:** If the platform architecture requires significant rework to support multi-location hierarchy AND FieldOps lacks the integration ecosystem expected at mid-market, the upmarket move will stall at the proof-of-concept stage regardless of sales investment. Conduct an architectural audit and integration gap analysis before committing to upmarket go-to-market spend. This is a $0 investment that prevents a potential $500K-$1M misdirected sales and marketing commitment.

- **W4 + T2:** The team capacity constraint (35 people, two strategic tracks) colliding with the threat of SMB focus dilution is the most likely execution failure mode. Do not attempt to run both motions simultaneously with the current team. Sequence the expansion: (1) validate upmarket product-market fit with 5-10 customers using the existing platform before building new features; (2) only then invest in hiring for parallel development capacity. Premature parallel investment is the most common cause of failed upmarket transitions in vertical SaaS.

---

### Priority Actions

| # | Action | SWOT Logic | Suggested Owner | Timeline | Decision Gate |
|---|--------|-----------|----------------|----------|---------------|
| 1 | Conduct architectural audit: assess multi-location scheduling and permissions for 50-200 technician use cases; produce a feature gap list with engineering effort estimates | W3 + T3 | CTO | Weeks 1-3 | Determines whether upmarket expansion requires a 3-month feature sprint or an 18-month rearchitecture -- this finding fundamentally changes the go/no-go decision |
| 2 | Identify and launch expansion program for 30-50 current customers who have grown to 25-40 technicians; conduct discovery calls to validate feature needs and ACV willingness | S4 + O4, W1 + O1 | VP Customer Success | Weeks 2-8 | Produces real upmarket ACV data and use-case validation before any speculative product investment; target of signing 5 upmarket pilot contracts at $30K+ ACV |
| 3 | Design and price a "FieldOps Growth" tier at $35K-$55K ACV, including scope of implementation, CSM support model, and SLA commitments; model the unit economics at 20, 50, and 100 Growth customers | W1 + O1, W2 + O3 | CEO + VP Sales | Weeks 4-10 | Confirms whether the upmarket commercial model is financially viable before hiring or product investment; must show positive contribution margin at 20 customers |
| 4 | Source and hire one enterprise account executive with vertical SaaS deal experience ($80K-$120K ACV) in field services, HVAC, or construction software | W2 + O3 | CEO | Weeks 6-16 | This hire is the prerequisite for any outbound mid-market motion; without it, upmarket sales depend on inbound only and will not achieve the velocity needed to validate the segment within 12 months |
| 5 | Commission 10 G2 and Capterra reviews from highest-NPS customers; build two 1-page case studies from SMB-to-Growth upgrade customers for use in upmarket competitive situations | S1 + T1 | Head of Marketing | Weeks 2-6 | Produces defensive review infrastructure before ServiceTitan has time to respond to FieldOps' upmarket positioning; reference assets needed before enterprise AE hire joins |

---

### Analysis Caveats
- Net Revenue Retention was not provided -- assumed approximately 95% based on 8% logo churn and limited expansion data. If NRR is materially above 105%, the case for upmarket expansion strengthens significantly (indicating natural expansion already occurring). If NRR is below 90%, churn management should be prioritized before any expansion investment.
- The engineering architecture question (W3) is the highest-uncertainty variable in this analysis. Until the CTO audit in Action 1 is complete, any timeline for upmarket product availability is speculative.
- No financial data on gross margin or burn rate was provided. The strategic options available change materially if gross margin is below 65% (common in services-heavy vertical SaaS) or if the company is burning more than $200K/month.
- Recommend supplementing this SWOT with a Porters Five Forces analysis of the home services software category to understand structural pricing pressure and buyer power dynamics before finalizing the upmarket pricing model.
