---
name: porters-five-forces
description: |
  Produces a completed Porter's Five Forces analysis with industry-specific
  drivers for each force, intensity ratings, and strategic implications.
  Use when the user asks to analyze industry attractiveness, evaluate
  competitive forces, assess market entry barriers, or understand industry
  dynamics using Porter's framework.
  Do NOT use for company-specific SWOT (use swot-analysis), direct competitor
  comparison (use competitive-analysis), or macro-environment scanning (use
  pestle-analysis).
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
# Porter's Five Forces Analysis

## When to Use

Use this skill when any of the following trigger conditions are present:

- The user explicitly asks to apply Porter's Five Forces framework to an industry, market segment, or competitive landscape -- including phrases like "analyze industry attractiveness," "how competitive is this market," or "what are the structural dynamics of this industry"
- The user is evaluating whether to enter a new market and needs to understand structural profitability barriers before committing capital -- distinct from competitive intelligence about specific rivals
- The user is advising investors, a board, or leadership on industry attractiveness as part of a market entry, M&A, or portfolio rationalization decision
- The user needs to understand why an industry is or is not profitable over time -- the analysis explains structural causes of average industry profitability, not just current competitive conditions
- The user is developing or pressure-testing a business model and needs to understand which forces will most constrain margins and how the model must be designed to resist them
- The user is a strategy consultant, business school student, or internal strategist who explicitly asks for a Five Forces output as a deliverable

**Do NOT use this skill when:**

- The user needs a strengths, weaknesses, opportunities, threats assessment of a single company -- use `swot-analysis`, which focuses on internal capabilities and external fit rather than industry structure
- The user wants a side-by-side comparison of specific named competitors on features, pricing, or market share -- use `competitive-analysis`, which maps rival positions rather than structural forces
- The user needs macro-environmental scanning covering political, economic, social, technological, environmental, and legal factors -- use `pestle-analysis`; note that PESTLE factors become inputs to Five Forces (e.g., regulatory changes affect entry barriers) but are not the same analysis
- The user is asking about a single company's financial performance or valuation without an industry attractiveness question -- use financial analysis or DCF skills
- The user needs customer segmentation, persona development, or demand sizing -- the Five Forces framework illuminates structural power, not demand characteristics
- The user is analyzing a product feature set or UX decision -- this is a structural industry-level tool, not a product strategy tool

---

## Process

### Step 1: Gather Required Context Before Producing Any Output

Never begin the analysis without confirming these inputs. Missing inputs produce unreliable force ratings that can lead to bad strategic decisions.

- **Industry definition:** Ask the user to define the industry precisely. "Technology" is too broad. "B2B cloud data warehousing for mid-market enterprises" is specific enough. The industry boundary determines which firms count as rivals vs. substitutes, which is one of the most consequential analytical choices in the framework.
- **Value chain position:** Clarify where the user sits -- manufacturer, distributor, platform/marketplace, service provider, retailer. A manufacturer and a retailer in the same supply chain face completely different buyer and supplier power configurations.
- **Geographic scope:** Local, regional, national, or global scope determines which competitors, suppliers, and buyers are relevant. Rivalry in commercial real estate brokerage is local; rivalry in semiconductor fabrication is global.
- **Company role:** Is the user an incumbent analyzing their existing position, a potential entrant evaluating entry, or a third party advising on investment? Entrant framing focuses on barriers and retaliation; incumbent framing focuses on defending position and improving structure.
- **Strategic decision:** What decision will this analysis inform? Market entry, pricing strategy, M&A target selection, divestiture, competitive response, or capital allocation? The strategic question determines which forces to weight most heavily in the recommendation.
- **Known players and data:** Ask the user for any known competitors, suppliers, customers, and any available financial or market data. If the user has no data, flag that ratings will be directional estimates that require validation.

### Step 2: Analyze Competitive Rivalry

Competitive rivalry is the central force -- it is shaped by the other four forces and directly determines average industry profitability. Rate it High, Medium, or Low with evidence on at least five structural factors.

- **Concentration and number of competitors:** Use the Herfindahl-Hirschman Index (HHI) concept directionally. An HHI above 2,500 indicates a concentrated industry where rivalry is often moderated by tacit coordination; below 1,500 indicates a fragmented market where rivalry is intense. Note: regulators flag acquisitions that push HHI over 2,500 in a previously competitive market.
- **Industry growth rate:** Slow-growth or declining industries intensify rivalry because market share gains come only at a competitor's expense. Growth rates above 10% annually typically reduce price-based rivalry because demand expansion accommodates multiple players without forcing direct confrontation.
- **Product differentiation and switching costs:** Commodity products (fungible grades of steel, bulk chemicals, spot freight capacity) experience intense price rivalry. High switching costs -- measured in time, money, and disruption -- dampen rivalry because customers cannot easily defect.
- **Fixed cost structure and capacity utilization:** Industries with high fixed costs and low variable costs (airlines, semiconductor fabs, hotels, cable infrastructure) face severe pressure to fill capacity, which drives aggressive pricing during downturns. A plant running at 60% capacity in a high-fixed-cost business will cut price to fill the line.
- **Exit barriers:** High exit barriers trap losing competitors in the market, sustaining rivalry even when returns are poor. Exit barriers include specialized assets with low salvage value, long-term contractual obligations, emotional commitment from owner-operators, and government or regulatory barriers to shutdown (e.g., nuclear plants, regulated utilities, defense facilities).
- **Diversity of competitors:** When rivals have different cost structures, ownership models, time horizons, and strategic objectives -- a state-owned enterprise competing against a private equity-backed roll-up, for example -- price signaling and tacit coordination break down, intensifying rivalry.

### Step 3: Analyze Threat of New Entrants

The threat of entry disciplines incumbent pricing even when no entry is occurring -- the mere threat of entry limits how much incumbents can charge. High entry barriers therefore protect industry profitability structurally.

- **Minimum efficient scale (MES):** Identify the production or revenue scale at which a new entrant achieves cost parity with incumbents. If MES requires 15% of market share before breaking even (as in commercial aircraft manufacturing), entry is structurally deterred for most players. If MES is achievable at 1-2% market share (as in SaaS products serving fragmented SMBs), barriers are minimal.
- **Capital requirements:** Distinguish between capital required to enter versus capital required to compete. A restaurant requires $200K-$500K to open; competing with a national chain requires marketing, loyalty infrastructure, and multi-unit scale that can require tens of millions. Capital requirements deter individual entrants but not private equity aggregators or well-capitalized strategic players.
- **Economies of scale, scope, and learning curves:** Scale advantages are sustainable when they create absolute cost differences that new entrants cannot replicate at smaller volume. Learning curve advantages -- documented in industries like semiconductors and aerospace where cumulative production drives down unit cost by a fixed percentage (often 15-25% per doubling of cumulative volume) -- create cost gaps that widen over time.
- **Brand loyalty and switching costs:** Measure customer retention rates and contract lengths as proxies. B2B software with multi-year enterprise agreements and deep integration into customer workflows creates 3-5 year switching cycles, effectively freezing out entrants from established accounts.
- **Distribution access:** Assess whether incumbents control or have privileged access to distribution. Shelf space in grocery retail, relationship networks in financial advisory, or exclusive carrier agreements in mobile devices can make distribution a genuine structural barrier.
- **Regulatory and licensing barriers:** Include not just the cost of compliance but the time delays (FDA approval timelines of 5-10 years for new drugs, FCC spectrum licensing, banking charters) and the ongoing compliance cost burden, which disadvantages new entrants relative to incumbents who have already built compliance infrastructure.
- **Expected incumbent retaliation:** Evaluate historical patterns. Have incumbents historically dropped prices, flooded distribution channels, or acquired potential entrants? A credible retaliation threat deters rational entrants. Retaliation credibility increases when incumbents have excess capacity, high strategic stakes, and a history of aggressive competitive response.
- **Network effects:** In markets with network effects (payment systems, social platforms, B2B marketplaces), the installed base creates a self-reinforcing advantage that new entrants cannot replicate by simply building better product. Rate this as a separate sub-factor when relevant.

### Step 4: Analyze Threat of Substitutes

Substitutes are not competitors in the same industry -- they are products or services from a different category that fulfill the same customer job-to-be-done. This distinction is critical: video conferencing is a substitute for business air travel, not a competitor to another airline.

- **Identify substitutes using the jobs-to-be-done lens:** Ask what fundamental need or outcome the industry serves, then identify all alternative ways that need could be met. The commercial real estate industry serves the need for productive workspace; substitutes include remote work, coworking spaces, and subleased space, not other landlords.
- **Price-performance trajectory:** The substitution threat intensifies when substitutes are improving on price-performance at a faster rate than the industry. Apply a technology trajectory lens -- if a substitute product's cost is declining on a learning curve (as solar panels did from $76/watt in 1977 to under $0.30/watt today) while the incumbent industry's costs are stable or rising, substitution is a structural long-term threat regardless of current adoption rates.
- **Customer propensity to switch:** Measure customer attitudes toward the substitute. Is the substitute seen as inferior but acceptable, or as genuinely preferred if price were equal? Behavioral switching costs (habit, familiarity, trust) can suppress substitution even when economic incentives exist.
- **Switching costs to the substitute:** If switching to the substitute requires learning, retraining, process redesign, or upfront capital investment, adoption will be slow even if the long-term economics favor the switch. Quantify the one-time cost if possible.
- **Emerging technology as future substitute:** Apply a 3-5 year horizon. Identify technologies in development that could create substitute products that do not yet exist commercially. This is where most industry analyses fail -- they assess today's substitutes, not tomorrow's.

### Step 5: Analyze Buyer Power

Buyer power analysis must distinguish between different tiers of buyers in the value chain. A packaged goods manufacturer faces completely different buyer power from Walmart (a large concentrated intermediary buyer) than from end consumers (fragmented, low individual volume).

- **Buyer concentration:** If the top 5 buyers account for more than 50% of revenues, buyer power is high. If no single buyer accounts for more than 5% of revenues, power is low. Request or estimate the revenue concentration Herfindahl among customers if possible.
- **Price sensitivity and information availability:** Buyers who can easily compare prices across suppliers and who face low switching costs will use that information as leverage. The internet has dramatically increased price transparency across most industries, structurally increasing buyer power over the past two decades.
- **Backward integration credibility:** Assess whether buyers have the capital, capability, and incentive to produce the input themselves. Amazon building its own logistics and delivery network (and its own private label products) is a real backward integration move that increased buyer power in both carrier services and CPG. Assess by looking at whether buyers have demonstrated investment in vertical integration elsewhere.
- **Switching costs for buyers:** Multi-year contracts, deep product integration, proprietary data formats, and high implementation costs all raise buyer switching costs and reduce buyer power. ERP systems embedded across enterprise workflows represent high switching costs; commodity spot purchases represent low switching costs.
- **Product importance to buyer:** If the purchased input represents 30-50%+ of the buyer's cost structure, the buyer has strong economic incentive to actively manage and pressure suppliers. If the input is a minor line item, buyers often do not invest in price negotiation.
- **Buyer profitability:** Price-pressured buyers who are themselves under margin compression will be more aggressive in extracting concessions. A retailer with 2% net margins has far more incentive to squeeze suppliers than one operating at 15%.

### Step 6: Analyze Supplier Power

Supplier power is the mirror image of buyer power, but the relevant inputs extend beyond physical materials to include labor, technology, capital, and data.

- **Supplier concentration:** If three or fewer suppliers dominate an input category globally (as ASML does for extreme ultraviolet lithography machines for chip manufacturing, or as the big three cloud platforms do for enterprise cloud infrastructure), supplier power is extreme and likely growing.
- **Input differentiation and substitutability:** Fungible commodity inputs (wheat, copper, standard fasteners) confer no supplier power. Proprietary, patented, or technically complex inputs where switching requires re-qualification, retesting, or retraining confer substantial power. Note: technical differentiation is not the same as quality differentiation -- a commodity supplier who provides uniquely high quality but is easily replaceable by another quality supplier has low power.
- **Switching costs to change suppliers:** Regulatory approvals, quality requalification processes, supply chain redesign, and contractual exit penalties all raise supplier switching costs. In aerospace and automotive, a supplier qualification process can take 18-36 months, effectively locking in a supplier relationship.
- **Supplier's ability to forward integrate:** Assess whether the supplier has the capability and incentive to bypass the industry and serve end customers directly. Intel's direct-to-consumer NUC products, Apple's shift to in-house chip design, and Google developing its own Tensor chips all represent supplier forward integration moves. The credibility of this threat depends on whether the supplier has demonstrated the move or has the customer relationships and channels to do so.
- **Importance of the industry to the supplier's revenue:** If the industry represents 5% of a supplier's total revenue, the supplier has little incentive to offer favorable terms or invest in the relationship. If the industry represents 50% of supplier revenue, the supplier has strong incentive to support customer profitability.
- **Labor as a supplier:** In labor-intensive industries (healthcare, legal services, consulting, film production), skilled labor has high supplier power when the labor market is tight. Assess whether the relevant skills are scarce (specialized surgeons, machine learning researchers) or abundant (general clerical workers), and whether unions or professional associations amplify labor's collective bargaining power.

### Step 7: Rate Each Force and Synthesize Strategic Implications

Each force must receive a rating (High, Medium-High, Medium, Medium-Low, or Low) supported by at least three evidence points. The synthesis step is where the analysis creates strategic value -- raw force ratings are not conclusions.

- **Use the five-force portfolio to assess overall industry attractiveness:** An industry where all five forces are low-to-moderate (fragmented buyers and sellers, high barriers, few substitutes, differentiated products) will generate above-average returns on invested capital over time. An industry where multiple forces are high simultaneously -- as in discount airline services, commodity chemicals, or print media -- will structurally compress margins regardless of how well individual competitors execute.
- **Identify the dominant force:** Porter's original research showed that in most industries, one or two forces are structurally determinative. Strategic recommendations should address the dominant forces first. Mitigating a medium-intensity force while ignoring a high-intensity force wastes strategic resources.
- **Assess force trends, not just current state:** A force rated Medium today but trending toward High in 3-5 years has different strategic implications than a stable Medium. Technology disruption, regulatory change, and consolidation among buyers or suppliers are the most common sources of force trajectory shifts.
- **Generate three categories of strategic response:** (1) Position in a segment of the industry where the forces are weakest -- not all sub-segments experience forces equally; (2) Exploit or build capabilities that shift force intensity in the company's favor -- building switching costs, forward integrating, creating proprietary standards; (3) Identify potential industry evolution that will make current structural positions advantageous or disadvantageous.

---

## Output Format

```
## Porter's Five Forces: [Industry Name]

**Scope:** [Geographic and segment scope -- e.g., "North American B2B mid-market SaaS"]
**Analysis Date:** [Date]
**Company Role:** [Incumbent / Potential Entrant / Third-Party Analyst]
**Strategic Question:** [The decision this analysis informs -- be specific]
**Data Confidence:** [High / Medium / Low -- flag if estimates are directional]

---

### Executive Summary

[3-4 sentences. State the overall industry attractiveness rating, identify the 1-2
dominant forces suppressing profitability, and state the single most important
strategic implication. This section should stand alone for an executive audience.]

---

### Force Ratings Summary

| Force                    | Rating       | Trend              | Primary Driver                                |
|--------------------------|--------------|--------------------|-----------------------------------------------|
| Competitive Rivalry      | [H/MH/M/ML/L] | ↑ ↔ ↓             | [Single most important factor]                |
| Threat of New Entrants   | [H/MH/M/ML/L] | ↑ ↔ ↓             | [Single most important factor]                |
| Threat of Substitutes    | [H/MH/M/ML/L] | ↑ ↔ ↓             | [Single most important factor]                |
| Buyer Power              | [H/MH/M/ML/L] | ↑ ↔ ↓             | [Single most important factor]                |
| Supplier Power           | [H/MH/M/ML/L] | ↑ ↔ ↓             | [Single most important factor]                |

**Overall Industry Attractiveness:** [High / Moderate-High / Moderate / Moderate-Low / Low]

[One sentence interpreting what this rating means for expected returns on invested
capital over a 5-year horizon relative to the cost of capital.]

---

### Force 1: Competitive Rivalry -- [Rating]

**Rating Rationale:** [2-3 sentences summarizing why this rating was assigned]

| Structural Factor          | Assessment         | Evidence / Detail                                    |
|----------------------------|--------------------|------------------------------------------------------|
| Industry concentration     | [H/M/L]            | [Estimated HHI or top-3 share; named major players]  |
| Industry growth rate       | [Fast/Moderate/Slow/Declining] | [% growth estimate and source if available] |
| Product differentiation    | [High/Moderate/Low] | [What differentiates products, if anything]         |
| Customer switching costs   | [High/Moderate/Low] | [Contract lengths, integration depth, switching time] |
| Fixed cost / capacity structure | [Heavy/Moderate/Light] | [Fixed cost as % of total cost; utilization pressures] |
| Exit barriers              | [High/Moderate/Low] | [Specialized assets, contracts, regulatory constraints] |
| Competitor diversity       | [High/Low]         | [Mix of ownership models, cost structures, objectives] |

**Trend:** [Rivalry is increasing / stable / decreasing because...]
**Strategic Implication for [Company Role]:** [Specific implication tied to the rating]

---

### Force 2: Threat of New Entrants -- [Rating]

**Rating Rationale:** [2-3 sentences]

| Entry Barrier                 | Height (H/M/L) | Detail                                               |
|-------------------------------|----------------|------------------------------------------------------|
| Minimum efficient scale       | [H/M/L]        | [Scale required for cost parity with incumbents]     |
| Capital requirements          | [H/M/L]        | [Dollar estimate to enter; dollar to compete at scale] |
| Economies of scale / learning | [H/M/L]        | [% cost advantage incumbents hold]                   |
| Brand loyalty / switching costs | [H/M/L]      | [Customer retention rates, contract lengths]         |
| Distribution access           | [H/M/L]        | [Channel control or openness]                        |
| Regulatory / licensing barriers | [H/M/L]      | [Specific licenses, approval timelines]              |
| IP / proprietary technology   | [H/M/L]        | [Key patents, trade secrets, proprietary standards]  |
| Network effects               | [H/M/L / N/A]  | [Strength and scope of network effects if present]   |
| Incumbent retaliation risk    | [High/Low]      | [Historical retaliation evidence]                    |

**Trend:** [Barriers are rising / stable / eroding because...]
**Strategic Implication for [Company Role]:** [Specific implication]

---

### Force 3: Threat of Substitutes -- [Rating]

**Rating Rationale:** [2-3 sentences]

| Substitute Product / Service  | Customer Job Addressed       | Price-Performance vs. Industry | Switching Cost | Adoption Trend    |
|-------------------------------|------------------------------|-------------------------------|----------------|-------------------|
| [Substitute 1 -- be specific] | [Job the substitute fulfills] | [Better / Equal / Inferior]   | [H/M/L]        | [↑ ↔ ↓]          |
| [Substitute 2]                | [Job fulfilled]              | [Better / Equal / Inferior]   | [H/M/L]        | [↑ ↔ ↓]          |
| [Emerging technology threat]  | [Job it could fulfill]       | [Currently inferior / improving] | [H/M/L]    | [↑ emerging]      |

**Trend:** [Substitution threat is rising / stable / declining because...]
**Strategic Implication for [Company Role]:** [Specific implication]

---

### Force 4: Buyer Power -- [Rating]

**Rating Rationale:** [2-3 sentences. Distinguish between buyer tiers if applicable.]

**Buyer Tier Analysis:** [Identify distinct buyer tiers if relevant -- e.g., enterprise vs. SMB; retailer vs. end consumer]

| Buyer Power Factor            | Assessment          | Evidence / Detail                                   |
|-------------------------------|---------------------|-----------------------------------------------------|
| Buyer concentration           | [High/Moderate/Low] | [Top 5 buyer share of revenues if estimable]        |
| Purchase volume per buyer     | [Large/Moderate/Small] | [Typical contract or order size]                 |
| Buyer switching costs         | [High/Moderate/Low] | [Contract length, integration depth, exit penalties] |
| Price sensitivity             | [High/Moderate/Low] | [Buyer margins, input cost as % of buyer COGS]     |
| Backward integration credibility | [Real/Unlikely]  | [Evidence of backward integration moves]            |
| Information availability      | [High/Low]          | [Price transparency, benchmarking access]           |
| Buyer profitability           | [Healthy/Pressured] | [Buyer's own margin environment]                   |

**Trend:** [Buyer power is increasing / stable / decreasing because...]
**Strategic Implication for [Company Role]:** [Specific implication]

---

### Force 5: Supplier Power -- [Rating]

**Rating Rationale:** [2-3 sentences]

**Key Input Categories Analyzed:** [List the 3-5 most important inputs -- materials, components, labor, technology, capital, data]

| Supplier Power Factor         | Assessment          | Evidence / Detail                                   |
|-------------------------------|---------------------|-----------------------------------------------------|
| Supplier concentration        | [High/Moderate/Low] | [Number of viable suppliers; top-3 share]           |
| Input differentiation         | [High/Moderate/Low] | [Proprietary vs. commodity inputs]                  |
| Switching costs to change supplier | [High/Moderate/Low] | [Requalification time, contractual barriers]   |
| Forward integration credibility | [Real/Unlikely]   | [Evidence of forward integration]                   |
| Industry importance to supplier | [High/Low]        | [% of supplier's revenue from this industry]        |
| Substitute inputs available   | [Yes/Limited/No]    | [Alternative materials or components]               |
| Labor market tightness        | [Tight/Balanced/Loose] | [Unemployment, wage pressure, union presence]    |

**Trend:** [Supplier power is increasing / stable / decreasing because...]
**Strategic Implication for [Company Role]:** [Specific implication]

---

### Strategic Synthesis

#### Industry Attractiveness Assessment

[2-3 paragraphs. Connect the force ratings to expected industry profitability. Which
combination of forces creates the structural challenge? Reference specific force
interactions -- e.g., high buyer power plus high rivalry creates a double squeeze on
margins. Compare to a benchmark industry if helpful: "This industry's structure
resembles commodity chemicals -- low barriers, high rivalry, and powerful buyers --
rather than the pharmaceutical model where IP creates barriers and buyer power is
moderated by insurance intermediaries."]

#### Dominant Forces Constraining Profitability

1. **[Force Name] -- [Rating]:** [3-4 sentences explaining why this force is most
   structurally damaging to profitability and which specific factors drive it]
2. **[Force Name] -- [Rating]:** [3-4 sentences]

#### Strategic Positions That Mitigate the Dominant Forces

1. **[Strategic position name]:** [What it is, which force it addresses, what
   capabilities or investments it requires, and what the realistic outcome is]
2. **[Strategic position name]:** [Same structure]
3. **[Strategic position name]:** [Same structure]

#### Recommended Actions

| Priority | Action                          | Force Addressed | Time Horizon | Investment Level |
|----------|---------------------------------|-----------------|--------------|------------------|
| 1        | [Specific action]               | [Force]         | [0-6mo / 6-18mo / 18mo+] | [Low/Med/High] |
| 2        | [Specific action]               | [Force]         | [Horizon]    | [Level]          |
| 3        | [Specific action]               | [Force]         | [Horizon]    | [Level]          |
| 4        | [Specific action]               | [Force]         | [Horizon]    | [Level]          |

#### Data Gaps and Analytical Limitations

[List 2-4 specific pieces of data that were unavailable and how their absence affects
confidence in specific force ratings. Suggest how to obtain missing data.]
```

---

## Rules

1. **Never produce a Five Forces analysis without confirming industry definition, geographic scope, value chain position, and strategic question.** These four inputs determine the structure of the entire analysis. An undifferentiated "technology industry" analysis produces no actionable insight; "US on-demand B2B freight brokerage" produces specific, actionable findings.

2. **Define industry boundaries explicitly before assessing forces.** The decision about what counts as a competitor vs. a substitute is the single most analytically important judgment in the framework. Video streaming is not a substitute for cinema -- it is a near-competitor with different economics. Use the jobs-to-be-done test: if a product fulfills the same customer need through a different technology or mechanism, it is a substitute. If it fulfills the same need through the same mechanism, it is a rival.

3. **Rate each force on a five-point scale (High, Medium-High, Medium, Medium-Low, Low), not a binary High/Low.** Binary ratings obscure important gradations. An industry facing Medium-High rivalry and Medium-Low supplier power has a very different structure than one facing two Highs or two Lows, and strategy must reflect the gradient.

4. **Support every force rating with a minimum of three specific evidence points.** "Rivalry is high because competition is intense" is not an evidence point. "Rivalry is high because the top-5 players hold approximately 35% combined market share (fragmented), industry revenue growth has been 1-2% annually over the past three years, and switching costs are near zero as contracts are typically 30-day cancelable" constitutes evidence.

5. **Always assess trends, not just current state.** A force that is currently Medium but trending toward High within 3 years has different strategic implications than a stable Medium. Identify the mechanism driving the trend (technology, consolidation, regulation, behavioral change) and assess its speed and certainty.

6. **Distinguish substitute threats from competitive threats rigorously.** When users say "our competitors are..." they frequently conflate rivals with substitutes. Probe with the question: "Does the alternative product come from a company that would appear in the same industry classification code?" If yes, it is likely a rival; if no, it is likely a substitute.

7. **In buyer power analysis, always separate buyer tiers.** A single industry often has multiple buyer types with dramatically different power levels -- for example, a pharmaceutical manufacturer faces powerful group purchasing organizations as intermediary buyers but fragmented individual patients as end consumers. Analyze each tier separately and note which tier's power is most strategically consequential.

8. **Never conflate supplier quality with supplier power.** A single best-in-class supplier of a critical input has high power regardless of how good their product is. Supplier power is a function of switching costs, concentration, and integration credibility -- not quality ratings or relationship quality.

9. **Treat labor as a supplier category when it is strategically relevant.** In professional services, healthcare, entertainment, skilled manufacturing, and technology, skilled labor is the primary input, and its concentration, scarcity, and collective organization levels must be analyzed as supplier power. Ignoring labor as a supplier produces systematically incorrect force ratings in labor-intensive industries.

10. **Strategic recommendations must reference the specific force they address.** "Improve customer service" is not a strategic recommendation in this framework. "Invest in multi-year contractual commitments and deep product integration to raise buyer switching costs and reduce buyer power (currently rated High)" is a recommendation tied to force structure. Every recommendation must name the force it mitigates, exploit, or structurally shifts.

11. **Flag data confidence explicitly.** If force ratings are based on limited data, public estimates, or analyst inference rather than verified financial and operational data, label them as directional estimates. A directional estimate of Medium-High rivalry based on industry reports is more useful than false precision -- but only if the reader understands its basis.

12. **Avoid the common error of listing industry trends as forces.** Digitalization, sustainability pressures, and remote work are macro trends (PESTLE factors) that affect forces -- they are inputs to force analysis, not forces themselves. Always translate macro trends into their effect on a specific force: "Digitalization is reducing buyer switching costs in insurance distribution (Force 4: Buyer Power increasing) and enabling new non-insurance substitutes like embedded insurance in commerce platforms (Force 3: Substitute Threat increasing)."

---

## Edge Cases

### Platform / Marketplace Business Models
Analyze both sides of the marketplace separately -- supply-side participants (the suppliers providing the service or product) and demand-side participants (the buyers consuming it). Network effects create a structural entry barrier not captured in standard supply-side analysis. Specifically: (1) the platform's buyer power analysis covers its leverage over supply-side participants; (2) the platform's supplier power analysis covers the leverage of demand-side participants over the platform; (3) the threat of new entrants must account for the multi-homing cost -- if users and suppliers can simultaneously use multiple platforms at low cost, entry barriers are lower than network effects alone suggest. Rate multi-homing costs as a sub-factor under new entrant threat.

### Rapidly Evolving Technology Markets (AI, Biotech, Semiconductors, Clean Energy)
Static force ratings lose meaning within 12-18 months. Apply scenario-based analysis instead of single-point estimates: assess forces under a "base case" (current trajectory), a "technology acceleration" scenario (leading technology scales faster than expected), and a "incumbent defense" scenario (incumbents lock in standards, IP, or distribution before disruption matures). Substitute threat and new entrant threat are the highest-variance forces in technology markets -- rate them on trajectory rather than current state, and use technology learning curves and patent cliff timelines to anchor the projection.

### Highly Regulated Industries (Healthcare, Financial Services, Defense, Nuclear Energy, Pharmaceuticals)
Regulatory barriers must be disaggregated into: (1) barriers to entry (capital, time, approval requirements); (2) ongoing compliance cost burden (which advantages large incumbents with amortized compliance infrastructure); and (3) regulatory capture risk (incumbents who have influenced regulatory standards to raise barriers against new entrants). In these industries, the regulatory environment is itself a structural force that modifies all five forces simultaneously, and the analysis must map regulation to each force explicitly rather than treating it as a single entry barrier.

### Global vs. Local Rivalry Mismatches
Some industries experience local competition at the customer-facing level while supply chains, technology, and capital markets are global. Analyze rivalry at the level where competition actually occurs (usually the local or regional service delivery level) but analyze supplier power and new entrant threat at the global level where those forces operate. A regional hospital network competes locally for patients and staff but faces global pharmaceutical supplier power and may face entry from national telehealth platforms. Conflating the geographic scope across forces produces incorrect ratings.

### User is Evaluating Market Entry
Reframe the entire analysis from the entrant's perspective. The key questions shift: (1) What is the minimum viable scale to achieve cost parity, and can the entrant reach it before incumbents retaliate? (2) Which entry barriers are genuinely prohibitive vs. expensive-but-surmountable? (3) What is the expected retaliation playbook from incumbents, and how quickly can it be triggered? (4) Which segment of the industry has the weakest forces, and is it large enough to build from? The output's strategic recommendations section should produce a go / no-go framework with clear thresholds: "Entry is viable if X, not viable if Y."

### Oligopolistic Industries with Tacit Coordination
When 3-5 players hold 70%+ market share and the industry has a history of stable pricing, assess whether tacit coordination (conscious parallelism, price leadership, or capacity discipline) is suppressing rivalry below what structural factors would otherwise produce. This is common in commercial aviation, wireless telecommunications, ratings agencies, and specialty chemicals. The analytical risk is underrating rivalry because current pricing is stable -- but stability maintained by coordination can collapse quickly when one player defects. Note the fragility of any rivalry rating that depends on continued coordination.

### Family-Owned or Owner-Operated Competitors
In industries where significant competitors are family-owned, founder-led, or otherwise operate with non-financial objectives, exit barriers and rivalry dynamics differ from purely financial analysis. Family businesses often accept below-market returns to preserve employment, legacy, or community standing. This suppresses capacity rationalization, intensifies rivalry in a way that rational financial modeling would not predict, and means standard financial exit barrier analysis underestimates rivalry. Flag when ownership structure creates non-economic competition.

### Industries at an Inflection Point (Pre-Consolidation, Post-Deregulation, Emerging Market Formalization)
When an industry is in structural transition -- a fragmented market beginning to consolidate, a newly deregulated market adjusting to competition, or an informal emerging-market sector formalizing -- all five forces are simultaneously unstable. Provide a current-state analysis alongside a projected 3-5 year state analysis. Identify the specific trigger events (first major acquisition, regulatory threshold change, technology standard adoption) that will shift force ratings and assess the probability and timeline of each trigger.

---

## Example

**Input:** "Can you do a Porter's Five Forces analysis for the US commercial property and casualty insurance market? We're a mid-sized regional P&C insurer considering whether to expand nationally or double down in our existing Southeast region."

---

## Porter's Five Forces: US Commercial Property & Casualty Insurance

**Scope:** US commercial P&C insurance market (business insurance covering liability, property, workers' compensation, commercial auto, and specialty lines)
**Analysis Date:** [Current date]
**Company Role:** Incumbent regional carrier evaluating strategic expansion
**Strategic Question:** Should we expand nationally or concentrate resources in the Southeast region?
**Data Confidence:** Medium -- ratings based on publicly available carrier financials, AM Best industry data, and standard industry analysis; specific market share data for regional segments is estimated

---

### Executive Summary

The US commercial P&C insurance industry is structurally moderate in attractiveness -- a large, established market where profitability is achievable but cyclical and structurally constrained. Competitive rivalry is the dominant force, driven by a large number of carriers competing for the same commercial accounts through independent agent channels that give buyers significant choice. Buyer power is moderate but increasing as digital comparison tools reduce information asymmetry. The most important strategic finding for a regional carrier is that national expansion significantly increases exposure to the dominant negative forces -- more rivalry, greater buyer power from national brokers, and higher capital requirements -- while diluting the relationship advantages and local underwriting expertise that make regional carriers competitive in the first place. Concentrating in the Southeast and building differentiation through underwriting specialization is the stronger structural position.

---

### Force Ratings Summary

| Force                    | Rating        | Trend | Primary Driver                                                  |
|--------------------------|---------------|-------|-----------------------------------------------------------------|
| Competitive Rivalry      | Medium-High   | ↑     | Large number of carriers, soft market pricing cycles, commoditization through broker intermediaries |
| Threat of New Entrants   | Medium-Low    | ↑     | Capital and regulatory barriers are substantial, but insurtech-backed MGAs are entering without full carrier infrastructure |
| Threat of Substitutes    | Low-Medium    | ↑     | Captives and self-insurance are growing among large commercial buyers; parametric products emerging |
| Buyer Power              | Medium-High   | ↑     | National broker consolidation concentrating buying power; digital tools increasing price transparency |
| Supplier Power           | Medium        | ↔     | Reinsurance market is moderately concentrated and cyclical; specialized underwriting talent is increasingly scarce |

**Overall Industry Attractiveness:** Moderate-Low for undifferentiated carriers; Moderate for specialists with defensible regional or product niches

The commercial P&C market generates a combined ratio that typically runs 96-105 (where 100 = breakeven on underwriting), meaning most carriers depend on investment income to achieve target returns on equity of 10-14%. This structure indicates that underwriting profitability alone does not cover cost of capital for average players -- a classic characteristic of moderate-to-low industry attractiveness.

---

### Force 1: Competitive Rivalry -- Medium-High

**Rating Rationale:** The US commercial P&C market has over 3,000 licensed carriers, though the top 20 write approximately 65% of commercial lines premium. This combination of concentrated premium among large players and persistent fringe competition from smaller carriers creates intense price competition during soft market cycles. Industry growth tracks GDP at 3-5% annually in normal years, insufficient to absorb capacity without price pressure. Independent agents -- who represent buyers rather than carriers -- structurally intensify rivalry by shopping accounts across carriers at renewal.

| Structural Factor          | Assessment    | Evidence / Detail                                                                       |
|----------------------------|---------------|-----------------------------------------------------------------------------------------|
| Industry concentration     | Moderate      | Top 20 carriers hold ~65% of commercial lines DWP; HHI estimated at 700-900 (fragmented) |
| Industry growth rate       | Moderate      | Commercial lines premium growing 3-5% annually in normal years, accelerating post-2020 due to social inflation and CAT losses |
| Product differentiation    | Low-Moderate  | Policy forms are highly standardized by ISO; differentiation occurs through coverage enhancements, claims handling, and risk engineering |
| Customer switching costs   | Moderate      | Annual renewal cycle with 30-60 day notice; agent relationships reduce carrier switching but do not eliminate it |
| Fixed cost / capacity structure | Moderate | Claims reserves create balance sheet obligations; operating leverage is moderate compared to manufacturing; excess capital seeks premium volume in soft markets |
| Exit barriers              | Moderate-High | State regulatory runoff requirements, long-tail liability exposure (workers' comp, general liability can develop over 10-20 years), and reputational obligations make exit slow and costly |
| Competitor diversity       | High          | Mix of stock carriers, mutual companies, Lloyd's syndicates, captives, state funds, and reinsurer-backed programs with different return expectations and time horizons |

**Trend:** Rivalry is increasing because broker consolidation (top 10 brokers now write approximately 40% of commercial premium vs. 25% a decade ago) is giving consolidated buyers greater leverage at renewal, and insurtech MGAs are entering specific commercial lines with targeted underwriting models that undercut on price in the most profitable segments.

**Strategic Implication for Regional Incumbent:** National expansion increases rivalry exposure significantly -- competing against national carriers on their home ground without scale advantages is a losing structural position. Regional concentration in Southeast markets allows the carrier to compete on relationship quality and local market knowledge rather than price, leveraging the one form of differentiation available.

---

### Force 2: Threat of New Entrants -- Medium-Low

**Rating Rationale:** Substantial regulatory and capital requirements deter new full-stack carrier entrants. However, the managed general agent (MGA) model allows technology-backed new entrants to underwrite specific commercial lines -- cyber, professional liability, specialty contractors -- without carrier capital requirements, effectively entering the most profitable segments while leaving claims and capital to incumbent carriers or reinsurers.

| Entry Barrier                 | Height (H/M/L) | Detail                                                                               |
|-------------------------------|----------------|--------------------------------------------------------------------------------------|
| Minimum efficient scale       | High           | Actuarial credibility in most commercial lines requires 5-7 years of loss development and $100M+ in premium volume per line to price accurately |
| Capital requirements          | High           | Surplus requirements to write $200M in commercial premium require $150-200M+ in statutory surplus; state licensing requires admitted carrier capitalization |
| Economies of scale / learning | High           | Claims databases, actuarial models, and underwriting expertise compound over decades; incumbents hold 50-100 years of proprietary loss data |
| Brand loyalty / switching costs | Moderate     | AM Best financial strength ratings and state guaranty fund participation create institutional credibility barriers; agents favor carriers with proven claims payment |
| Distribution access           | Moderate       | Independent agent channel is open but competitive; access to wholesale brokers and specialty MGAs requires established relationships and underwriting track record |
| Regulatory / licensing barriers | High         | 50-state licensing, NAIC regulatory compliance, state guaranty fund participation, and annual financial filing requirements create sustained compliance overhead |
| IP / proprietary technology   | Moderate       | Legacy carrier systems are inefficient; modern insurtech platforms can underwrite faster and cheaper in defined segments |
| Network effects               | Low            | P&C insurance has weak network effects compared to platform businesses; policyholder networks do not create compounding advantages |
| Incumbent retaliation risk    | Moderate       | Incumbents have responded to insurtech entrants by acquiring MGA capacity, building internal digital underwriting capabilities, and competing on price in targeted segments |

**Trend:** Entry barriers for full-stack carriers remain stable and high. However, barriers for MGA-model entrants are declining as reinsurers and fronting carriers eagerly provide capacity to technology-underwritten programs, reducing the capital barrier for selective line entry. The net threat is rising in specific high-margin specialty lines.

**Strategic Implication for Regional Incumbent:** The MGA entry model threatens the most profitable lines first (cyber, professional liability, specialty contractors). The carrier should evaluate whether to build a competing digital underwriting capability in these lines or accept margin compression as insurtechs commoditize them. National expansion does not provide protection from this threat -- it is a product-line phenomenon, not a geographic one.

---

### Force 3: Threat of Substitutes -- Low-Medium

**Rating Rationale:** Most small and mid-market commercial insureds have no practical substitute for third-party insurance. However, large commercial buyers (Fortune 1000 and large regional businesses) have increasingly adopted captive insurance structures and high-deductible self-insurance programs, diverting the most profitable risk from the commercial market.

| Substitute                    | Customer Job Addressed        | Price-Performance vs. Industry  | Switching Cost | Adoption Trend |
|-------------------------------|-------------------------------|---------------------------------|----------------|----------------|
| Captive insurance programs    | Risk financing for large, predictable loss exposures | Better long-term for large buyers with stable loss histories | High -- requires $1M+ in domicile capital, actuarial and management overhead | ↑ growing among mid-market ($100M+ revenue) companies |
| Self-insurance / high deductible programs | Frequency risk retention, reduce premium spend | Better for loss-controlled risks; worse for catastrophic tail | Moderate -- administrative complexity of claims management | ↑ growing as risk management sophistication increases |
| Risk purchasing groups / captive pools | Access to group purchasing terms | Equal-to-better for stable homogeneous risks (e.g., trade associations) | Low -- minimal disruption | ↑ steady |
| Parametric insurance products | Basis risk hedge for weather, index-linked exposures (agriculture, construction delays) | Inferior for indemnity; better for speed and transparency | Low -- additive rather than replacement purchase | ↑ emerging, still niche |
| Financial hedging (derivatives, weather bonds) | Macroeconomic risk management for large exposures | Specialized, limited applicability | High | ↔ stable, niche |

**Trend:** Substitute threat is gradually increasing at the large commercial end of the market as risk management sophistication improves and captive domicile requirements have become more accessible in states like Vermont, Delaware, and offshore in Cayman and Bermuda. However, small and mid-market commercial -- the natural segment for a regional carrier -- has low substitute exposure.

**Strategic Implication for Regional Incumbent:** Focus on small and mid-market commercial accounts where substitutes are structurally unavailable. Avoid competing for Fortune 1000 accounts where captive migration is a real and growing risk.

---

### Force 4: Buyer Power -- Medium-High

**Rating Rationale:** Buyer power in commercial P&C is primarily exercised through intermediaries. Large national brokers (consolidating through M&A, with the top 10 now controlling approximately 40% of commercial placement) represent hundreds of thousands of individual commercial insureds, concentrating purchasing leverage into a handful of relationships. Directly accessed small commercial buyers have lower individual power but benefit from agent competition.

**Buyer Tier Analysis:**
- **Tier 1 -- National and regional brokers (Marsh, Aon, WTW, Gallagher, Brown & Brown):** High concentrated power; negotiate guaranteed premium volumes, preferential commission structures, and market access agreements. Largest carriers can sustain this pressure; small regional carriers are largely price-takers in broker-driven placements.
- **Tier 2 -- Independent agents representing small-to-mid commercial accounts:** Moderate power; shop accounts at renewal but relationship loyalty creates some stickiness. Agents have strong price transparency through comparative rating systems.
- **Tier 3 -- Direct commercial buyers (commercial accounts that approach carriers without brokers):** Low power; limited price transparency; relationship-dependent.

| Buyer Power Factor            | Assessment   | Evidence / Detail                                                                |
|-------------------------------|--------------|----------------------------------------------------------------------------------|
| Buyer concentration           | High (Tier 1) / Moderate (Tier 2) | Top 5 brokers control ~30% of commercial premium; regional carriers often have 20-30% of premium from top 3 agents |
| Purchase volume per buyer     | Large (Tier 1) / Moderate (Tier 2) | National broker block agreements represent $10M-$100M+ annual premium; individual agent books represent $500K-$5M |
| Buyer switching costs         | Low          | Annual renewal cycle; policy forms are standardized; agents can move accounts with 30-60 days notice |
| Price sensitivity             | High         | Commercial insurance is a significant operating expense for most businesses; agents are legally obligated to demonstrate market shopping |
| Backward integration credibility | Real (large buyers) | Large commercial buyers have demonstrated captive formation; broker forward integration into underwriting (through MGAs) is active |
| Information availability      | High         | Comparative rating platforms give agents real-time premium quotes from 20-30 carriers simultaneously; AM Best ratings and financial strength are publicly available |
| Buyer profitability           | Varies       | Post-pandemic commercial margins are recovering but many industries (retail, hospitality, construction) remain margin-pressured and actively manage insurance cost |

**Trend:** Buyer power is increasing primarily through broker consolidation. Each major broker acquisition (Gallagher acquiring smaller regional brokers, for example) shifts more premium into higher-leverage negotiation tiers.

**Strategic Implication for Regional Incumbent:** A national expansion strategy would increase dependence on Tier 1 national brokers to generate volume -- significantly worsening the carrier's buyer power exposure. Regional concentration preserves access to Tier 2 independent agents where relationships moderate buyer power. Investing in independent agent relationship management, agency management system integrations, and fast quote turnaround are the highest-return tools to retain Tier 2 agents.

---

### Force 5: Supplier Power -- Medium

**Rating Rationale:** The commercial P&C insurer's primary inputs are reinsurance capacity, underwriting and actuarial talent, and increasingly, data analytics technology. Reinsurance market concentration is moderate and cycles between buyer-favorable and seller-favorable conditions. Specialized underwriting talent is the most strategically constrained input.

**Key Input Categories Analyzed:** Reinsurance capacity, underwriting/actuarial talent, data and analytics technology, claims administration, distribution (independent agents)

| Supplier Power Factor         | Assessment   | Evidence / Detail                                                                 |
|-------------------------------|--------------|-----------------------------------------------------------------------------------|
| Supplier concentration        | Moderate (Reinsurance) | Top 10 reinsurers write ~60% of global reinsurance premium; regional carriers are small buyers with limited leverage |
| Input differentiation         | High (talent) / Low (commodity reinsurance) | Catastrophe modeling expertise, niche underwriting specialization, and actuarial talent are genuinely scarce; standard quota share reinsurance is commoditized |
| Switching costs to change supplier | Moderate | Reinsurance relationships are multi-year; switching reinsurers mid-treaty year is rare; underwriter talent replacement takes 6-18 months and institutional knowledge is lost |
| Forward integration credibility | Low | Major reinsurers (Munich Re, Swiss Re) have entered direct commercial underwriting but primarily in specialty lines; wholesale channel pressure is real but moderate |
| Industry importance to supplier | Low | A $300M premium regional carrier represents <0.5% of a large reinsurer's global book; minimal negotiating leverage |
| Substitute inputs available   | Moderate | Alternative reinsurance capital (catastrophe bonds, ILS funds) has grown to approximately 15-20% of global reinsurance capacity, providing some pricing discipline on reinsurers |
| Labor market tightness        | High (specialists) | Experienced commercial underwriters, catastrophe modelers, and actuaries are in high demand; wage growth of 10-20% for specialist talent in the past 3 years |

**Trend:** Supplier power is stable overall but increasing for specialized talent. Reinsurance pricing hardened significantly post-2022 CAT losses (Florida, Ian, turkey earthquakes), temporarily increasing reinsurer power, but alternative capital inflows are beginning to moderate this.

**Strategic Implication for Regional Incumbent:** The carrier's reinsurance purchasing leverage is a direct function of its scale -- national expansion
