---
name: pitch-deck-structure
description: |
  Produces a pitch deck outline with the 10-12 slide sequence for a business
  pitch, specific content required on each slide, and validation criteria for
  each claim. Use when the user asks to create a pitch deck, structure an
  investor presentation, or plan slides for a funding round or business pitch.
  Do NOT use for general presentation structure (use slide-deck-structure),
  executive summary slides (use executive-summary-slide), or business plan
  writing (use business-plan).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "presentation planning template"
  category: "design-creative"
  subcategory: "presentation-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Pitch Deck Structure

## When to Use

Use this skill when the user's request maps to any of these specific scenarios:

- User explicitly asks to create, build, or structure a pitch deck, investor deck, or fundraising presentation for a startup or growth-stage company
- User is preparing for a specific fundraising event: demo day, VC partner meeting, angel syndicate pitch, accelerator application pitch, or Series A roadshow
- User wants to sequence investor-facing slides and needs to know what content belongs on each slide, in what order, and why
- User has a draft pitch deck and wants to audit or improve it for investor credibility, narrative coherence, or claim validation
- User needs to tailor an existing deck to a specific investor audience (seed angels vs. institutional VCs vs. corporate strategics) or a specific time slot (3-minute demo day vs. 10-minute standard VC meeting)
- User is preparing a first pitch after completing an accelerator program (Y Combinator, Techstars, 500 Startups) and needs to understand the standard investor expectations for their stage
- User asks to evaluate whether their deck follows the standard 10-12 slide investor sequence or identify which slides are missing, weak, or out of order

**Do NOT use when:**
- User wants a general business presentation or internal strategy presentation -- use `slide-deck-structure` instead
- User wants a single executive summary slide for distribution to investors before a meeting -- use `executive-summary-slide` instead
- User wants a full business plan document (narrative, 20-40 pages) -- use `business-plan` instead
- User wants a one-page pitch overview or investment teaser -- use `one-pager` instead
- User needs help with the visual design, typography, or layout of slides -- use `presentation-design` instead
- User is pitching for a grant, government contract, or academic funding -- the structure is fundamentally different and does not follow the VC narrative arc
- User is an established company (post-Series C) preparing a board presentation or investor update -- use `board-presentation` instead

---

## Process

### Step 1: Gather Pitch Context -- All Required Inputs Before Building Anything

Do not begin structuring the deck until you have collected these inputs. Missing even one will produce a structurally wrong deck.

- **Company name and one-sentence description:** The description must follow the formula "[Company] is a [category] that helps [customer] [achieve outcome] by [mechanism]." If the user cannot supply this, help them construct it before proceeding.
- **Funding stage:** Pre-seed (idea + founder + early signal), seed (product + early traction), Series A (repeatable revenue + team), Series B+ (scale + unit economics proven). The stage determines what traction evidence is expected and what financial depth is required.
- **Ask amount and use of funds:** Exact dollar amount and at least three categories of spend (product/engineering, sales/marketing, operations/G&A). If the user says "I don't know the amount yet," treat this as pre-raise and structure for a non-fundraising pitch.
- **Audience type:** Angel investors, institutional seed VCs, Series A/B VCs, corporate strategic investors, accelerator judges, family office, crowdfunding audience. Each has different sophistication, diligence norms, and decision timelines.
- **Time slot:** 3 minutes (demo day), 7-10 minutes (standard first meeting), 20-30 minutes (partner meeting deep dive), or async (deck sent without presenter).
- **Strongest traction proof points:** Revenue (MRR/ARR), user count, growth rate, retention, pilot results, letters of intent, notable customer names, press mentions -- whatever is strongest. This determines what the traction slide leads with.
- **Industry and business model type:** SaaS, marketplace, consumer app, hardware, deep tech, services, e-commerce, fintech, healthtech. The business model type changes which metrics are expected on the financials and traction slides.

### Step 2: Select Deck Length and Format Based on Context

Match the format precisely to the time slot and audience. Using the wrong format wastes the most valuable real estate in every pitch -- the opening 90 seconds.

- **3-minute demo day format (5-7 slides):** Problem + Solution combined, Product Demo, Traction, Market, Ask. Deliver Team and Competition verbally only if asked. Every word is spoken, not read. No bullet points -- visuals only.
- **7-10 minute standard VC first meeting (10-12 slides):** The full standard sequence described in Step 3. This is the baseline. Every VC expects this sequence and mentally fills in missing slides with negative inferences.
- **20-30 minute partner meeting (12-16 slides):** Full sequence plus a deeper competitive landscape slide, detailed unit economics breakdown, GTM strategy slide, and technical architecture (if deep tech). Add an appendix with customer references, detailed financials, and cohort analysis -- but do not pitch the appendix.
- **Async email deck (10-12 slides with heavy annotation):** Every slide must stand alone without a presenter. Replace verbal transitions with written context in the slide body. Include a cover page with a two-paragraph executive summary at the front.
- **Special rule for Series A+:** Always include a cohort retention chart (the "smile chart" or logo retention grid), a CAC payback period breakdown, and a hiring plan tied to the use of funds. Institutional investors expect these; their absence signals immaturity.

### Step 3: Build the Slide Sequence -- The Master Framework

Each slide has a single job. If a slide is trying to do two jobs, split it. The sequence must flow as a single logical argument: the world has a problem, we have the solution, the solution addresses a large market, we monetize it this way, we have already proven it, here is who we are, here is where we are going financially, and here is what we need from you.

**Slide 1: Title / Cover**
- Company name, logo (if exists), and one-sentence positioning statement -- not a tagline, a positioning statement. Example: "AI-powered contract review for mid-market law firms" is better than "Legal tech for the modern era."
- Presenter name and title, date, and contact email. The date matters -- investors want to know if they are seeing a fresh deck or a deck that has been circulating for 18 months without a close.
- Do NOT put financial information, bullet points, or slide numbers on the title slide.
- The one sentence on this slide will be the first thing investors remember. It must encode the category, customer, and outcome.

**Slide 2: Problem**
- Define the specific customer experiencing the pain -- not "businesses" or "people" -- the job title, company size, or demographic that feels this pain most acutely.
- Quantify the cost of the problem in dollars, hours, or risk. The number must be sourced. "$4,100 per new hire" (SHRM) is credible. "Millions of dollars" is not.
- Use the "status quo" framing: describe exactly how the problem is being handled today (manually, with spreadsheets, with legacy software) and why that approach is inadequate.
- One problem per slide. If there are multiple related problems, pick the one that is most expensive, most common, and most urgent.
- Emotional resonance matters: investors must viscerally understand the pain before they will value the solution. A customer quote works better than an industry statistic here.

**Slide 3: Solution**
- One sentence describing what the product does. Then a second sentence explaining how it solves the specific problem on slide 2. The logical link must be explicit.
- Show the product -- do not describe it abstractly. A screenshot, a 10-second screen recording, or a before/after workflow diagram. Investors who have not seen the product cannot evaluate it.
- "Before / After" framing is the most effective structure: what was the customer doing before, and what do they do now with your product.
- Three features maximum. Each feature must be named, briefly described, and linked to a customer benefit. "One-click IT provisioning [feature] means a new hire has their laptop, apps, and credentials ready on day one [benefit]."
- Avoid the word "platform" as the primary noun. Say what the product actually does.

**Slide 4: Product / Demo**
- This slide goes deeper into the product experience than slide 3. If slide 3 is the 10-second answer, slide 4 is the 60-second explanation.
- For a live demo: prepare three screens maximum. Walk the user journey, not the admin journey. Investors want to see what value looks like to the end user.
- For a recorded demo: a 90-second maximum video with narration. Never rely on audio working in a VC conference room. Add captions.
- For hardware: show the physical product in use. Include unit manufacturing cost, current prototype stage, and expected production cost at scale.
- Deep tech companies: include a single-slide technical architecture diagram that explains the core proprietary mechanism without requiring a PhD. The goal is to demonstrate that the technical moat is real and defensible.

**Slide 5: Market Size**
- Always present TAM (Total Addressable Market), SAM (Serviceable Addressable Market), and SOM (Serviceable Obtainable Market) -- in that order, each as a distinct number.
- TAM must be calculated bottom-up, not top-down. Top-down ("the HR software market is $XX billion") tells investors nothing about how you calculated your share. Bottom-up ("there are 350,000 mid-market US companies with 100-1,000 employees, each spending approximately $10,000/year on HR software, yielding a $3.5B TAM") shows the logic.
- SAM is the portion of the TAM you can realistically reach given your product's current geography, language, and segment focus. SAM is always smaller than TAM.
- SOM is what you credibly capture in the next 2-3 years. It should be large enough to justify the company (at least $50M to interest seed VCs, $100M+ to interest Series A investors), but not so large that it looks made up.
- Cite the source for every number: your own calculation, industry reports (IBISWorld, Gartner, IDC), or comparable company disclosures.
- Avoid the "1% of a $1 trillion market" fallacy -- it signals you do not have a real market penetration strategy.

**Slide 6: Business Model**
- State the primary revenue mechanism: subscription (monthly/annual), usage-based, transaction fee, licensing, services, marketplace take rate, or hybrid.
- Show the pricing tier structure if it exists. Three tiers (Starter/Growth/Enterprise) is standard SaaS. Show the price points.
- The four essential unit economics metrics: Average Revenue Per User (ARPU) or Average Contract Value (ACV), Customer Acquisition Cost (CAC), Customer Lifetime Value (LTV), and LTV:CAC ratio. A healthy SaaS LTV:CAC is 3x or higher. If it is below 3x, address it proactively.
- CAC payback period (months to recover CAC from gross margin): under 12 months is strong for SMB SaaS, under 18 months is acceptable for mid-market, under 24 months is common for enterprise. Show this explicitly.
- If pre-revenue: show the planned pricing, explain the logic behind the price point (competitor pricing, willingness-to-pay research, pilot pricing feedback), and give a timeline to revenue.
- Gross margin matters. Software should be 70-85%+. Hardware will be lower (30-60%) and needs explanation of path to improvement at scale.

**Slide 7: Traction**
- This is the single most important slide in the deck for investor decision-making. Lead with the strongest metric.
- Show a growth chart -- not a table, a visual chart -- with time on the x-axis. MRR, ARR, DAU, WAU, or revenue are all acceptable. The shape of the curve matters more than the absolute number.
- Include the rate of growth, not just the level: "20% month-over-month" tells a better story than "$15K MRR" alone.
- For pre-revenue companies: waitlist size and weekly growth, pilot program results (quantified), letters of intent with dollar values, accelerator acceptances, press coverage from credible outlets, or customer quotes from named companies.
- Retention metrics belong here: monthly logo retention (SaaS), daily/weekly active use (consumer), reorder rate (e-commerce). Strong retention signals product-market fit. Churn above 3% monthly for SMB SaaS or above 10% annually for enterprise SaaS is a red flag that needs proactive explanation.
- Milestones timeline: show 4-6 milestones from founding to today that demonstrate continuous progress and evidence of product-market fit signal.

**Slide 8: Competition**
- Use a 2x2 positioning matrix, never a feature comparison table. Feature tables invite investors to ask "but can't [large competitor] just add this feature?" A 2x2 shows where you uniquely live in the competitive landscape.
- Choose the two axes carefully: they must represent dimensions that customers genuinely care about AND on which you hold a distinctive position. Typical meaningful axes: automation level vs. ease of implementation, specialization depth vs. breadth of coverage, real-time vs. batch processing, self-serve vs. enterprise-grade.
- Place 4-8 competitors on the matrix. Include both direct competitors (same category) and substitutes (how the problem is solved today, including "do it manually" and "build it internally").
- Name the specific competitors. Not naming them signals naivety. Investors know the space and will name them anyway.
- The sustainable competitive advantage (your "moat") must be stated explicitly and must be one of these defensible categories: network effects, proprietary data, switching costs, economies of scale, brand/trust in a regulated industry, or novel IP/technology. "Better product" is not a moat.
- Address the "why can't Google/Salesforce/[big incumbent] just do this?" question directly on the slide or in the speaker notes.

**Slide 9: Team**
- Include only decision-relevant credentials. Each team member gets one credential -- the most relevant one to the role they play in this company.
- The three questions investors are answering from this slide: Does this team have the domain expertise to understand the problem? Do they have the execution track record to build the company? Do they have the relationships to acquire customers and talent?
- For each founder: photo, name, title, one credential (prior company outcome, relevant domain tenure in years, specific technical expertise). Format: "Sarah Chen, CTO -- former principal engineer at Stripe, led payments infrastructure team of 22."
- Notable advisors can be included (2-3 maximum) with their specific domain relevance: "Advis Chen, Board Observer -- Partner at [VC], led investments in [2 relevant portfolio companies]."
- If the team has an obvious gap (no technical co-founder, no sales leader, no domain expert), acknowledge it proactively and state the plan to fill it within the first 6 months of funding.
- "Serial entrepreneur" and "visionary" are empty phrases. Replace them with outcomes: "founded and sold [company] to [acquirer] in [year]" or "led [company] from $0 to $50M ARR."

**Slide 10: Financials**
- Three-year forward projection (not five -- five-year SaaS projections are not credible and signal inexperience). Show revenue, gross margin, operating expenses (split between R&D, S&M, and G&A), and EBITDA by year.
- Current run rate prominently displayed: "Current ARR: $180K, growing 20% MoM."
- The J-curve is expected at seed: spending more than you earn for 12-18 months before reaching profitability. Show when the company reaches operating breakeven.
- Key assumptions must be explicitly listed -- at minimum: assumed average selling price, assumed sales cycle length, assumed monthly churn rate, assumed new hire ramp time, and assumed conversion rate from lead to customer. These assumptions are what investors will probe during diligence.
- For hardware companies: include COGS projections at scale (Year 1 unit cost vs. Year 3 unit cost at volume), tooling and certification costs, and inventory financing assumptions.
- Do not show five different scenarios (bear/base/bull). Pick one base case and state your assumptions. Showing multiple scenarios signals you do not believe your own numbers.

**Slide 11: The Ask**
- State the exact amount being raised. "We are raising $2M" -- not "up to $3M" or "between $1.5M and $2.5M." Ranges signal negotiation uncertainty and erode confidence.
- State the instrument: SAFE (Simple Agreement for Future Equity), convertible note, or priced equity round. For seed rounds, SAFEs with MFN (Most Favored Nation) protection are standard. State the valuation cap if using a SAFE or convertible note only if it is already set.
- Use of funds: three to four categories with percentages that add to 100%. Standard template: Engineering/Product (X%), Sales and Marketing (X%), Operations/Infrastructure (X%), Working Capital (X%). Round numbers are fine: 50/30/20.
- What this funding achieves: the single milestone that this capital funds the company to. The milestone should be either the next funding round (Series A, with specific ARR/metric targets) or profitability.
- Timeline: "This $2M extends our runway 18 months and funds us to $2M ARR, the target Series A threshold." Make the milestone explicit, not vague.
- If not fundraising: replace this slide with a "Partnership Proposal" that states what you are asking the partner to do, what you bring to the partnership, and what success looks like for both parties.

**Slide 12: Closing**
- One sentence restating the company's ultimate vision -- not what you do today, but where you are going. This should be ambitious and memorable.
- Contact information: website, email, LinkedIn. Make it easy to reach you.
- Never end with "Thank You" or "Questions?" These are the two weakest possible endings. End with a forward-looking statement that leaves the audience wanting to be part of the story.
- A strong closing format: "In five years, every mid-market company will have automated onboarding the way they automated payroll. We are building that future. Let's talk."

### Step 4: Assign Validation Criteria to Every Claim

Every assertion that could be challenged must be paired with a validation source before the deck is delivered. Apply this standard:

- **Data claims (market size, problem cost, growth rates):** Must cite a source. Tier 1 sources: primary research (your own survey of 200+ customers), third-party analyst reports (Gartner, IDC, Forrester, Nielsen, SHRM, CB Insights), government databases (BLS, Census Bureau, SEC filings). Tier 2 sources: well-known industry publications, credible news sources. Tier 3 (acceptable only when nothing better exists): competitor press releases, blog posts with cited methodology.
- **Financial projections:** Must list all material assumptions. If a projection shows 300% year-over-year revenue growth, the assumption "adding 4 AEs in Q2, each ramping to $500K quota in 6 months" must be visible.
- **Customer quotes:** Must be attributable to a real person (name + company, or "Head of HR at a Fortune 500 retailer" if the name is confidential). Anonymous quotes from no specified source carry zero weight.
- **Competitive claims:** "No one else does X" must be supported by specific competitor research. Name the competitors you reviewed, what they do, and why they do not address the specific gap.
- **Team credentials:** Must be independently verifiable (LinkedIn, crunchbase, public record). Approximate titles ("former engineering leader at Google") are acceptable; fabricated titles are not.

### Step 5: Calibrate the Deck for the Specific Investor Audience

The same underlying company should produce different deck emphasis depending on who is in the room.

- **Angel investors (checks $25K-$250K):** Lead with team and vision. Angels invest in people and ideas more than metrics. Traction matters but does not need to be institutional-grade. Market size should be understandable to a non-specialist.
- **Seed VCs (funds $500K-$3M):** Lead with traction and product. Seed VCs want evidence of product-market fit signal: strong retention, high NPS, fast organic growth, or a clear "why now" that makes this the inflection moment. They will build their own market size model.
- **Series A institutional VCs (checks $5M-$20M):** Lead with unit economics and repeatable go-to-market. Series A VCs want to see that the revenue engine is working: CAC is known, LTV:CAC is healthy, and scaling the sales team will predictably produce more revenue. Market size must be at least $1B SAM.
- **Corporate strategic investors (CVC funds):** Lead with strategic fit. How does this company make the parent corporation's core business better, more defensible, or more valuable? Revenue and unit economics matter, but strategic relevance matters more.
- **Accelerator judges (Y Combinator, Techstars, etc.):** Lead with founder-market fit and the insight behind the business. Accelerators are evaluating whether the founders understand the problem at a level no one else does and whether the insight is non-obvious.

### Step 6: Run the Coherence Check

Before finalizing the deck structure, trace the narrative through all five logical links:

1. **Problem → Solution:** Does the solution directly and specifically address the described problem? If the problem is "onboarding takes 30 days" and the solution is "AI-powered HR analytics," there is a gap -- analytics does not reduce onboarding time, automation does.
2. **Solution → Market:** Is the market you are claiming large enough to justify the scale of the solution you are building? If the solution is highly specialized (law firms with 10-50 attorneys in the US), the market had better be sized to that segment, not "the legal industry."
3. **Market → Business Model:** Can you actually access and monetize the market you described? A bottom-up market of 10,000 enterprises at $100K ACV requires an enterprise sales motion, not a self-serve product.
4. **Business Model → Traction:** Does your existing traction validate the business model you described? If you claim a $10K ACV SaaS model but your 50 customers are all paying $1,200/year, the model is not validated.
5. **Traction → Ask:** Does the current evidence of traction make a compelling case that investing now is the highest-leverage moment to enter? The ask must describe what this specific injection of capital accelerates, not just that the company needs money to grow.

Flag any link with a gap. Either fix the gap in the content or proactively address it in the speaker notes so the presenter is prepared for the question.

### Step 7: Prepare the Appendix (Optional but Recommended)

Never include appendix material in the main deck. Appendix slides go after slide 12 and are presented only when asked during Q&A or diligence. Standard appendix slides:

- Detailed cohort analysis (monthly cohorts, 6-month and 12-month retention by cohort)
- Full financial model with monthly detail for the first 24 months
- Customer reference list (names and contact information for 5-10 reachable customers)
- Technical architecture diagram (for deep tech, B2B infrastructure, or API-first companies)
- Regulatory landscape (for healthcare, fintech, legal tech, or any regulated industry)
- Cap table summary (for rounds where dilution sensitivity is likely)
- Pipeline detail (for B2B companies with long sales cycles)

---

## Output Format

```
## Pitch Deck: [Company Name]

**Stage:** [pre-seed | seed | Series A | Series B+ | non-fundraising]
**Ask:** [$X via [SAFE/convertible note/priced equity], [valuation cap if applicable]]
**Use of Funds:** [Category 1: XX%] | [Category 2: XX%] | [Category 3: XX%]
**Time Slot:** [X minutes / async]
**Audience:** [audience type -- e.g., seed VCs, angel syndicate, accelerator judges]
**Industry/Business Model:** [e.g., B2B SaaS, marketplace, consumer, hardware]
**Current State:** [pre-revenue | $XK MRR | $XM ARR, X% MoM growth]

---

### Deck Configuration

**Format:** [3-min demo day | 10-min standard | 20-min partner meeting | async]
**Total Slides:** [X main + Y appendix]
**Lead Emphasis:** [traction | team | product | unit economics] (calibrated to audience)

---

### Slide Sequence

| # | Slide Name | One-Job Description | Lead Content | Validation Required |
|---|------------|---------------------|--------------|---------------------|
| 1 | Title | Brand impression + positioning | [Company] -- [one-line positioning] | None |
| 2 | Problem | Make audience feel the pain | [specific pain + quantified cost] | [source for cost figure] |
| 3 | Solution | Link solution to problem | [what it does + how it solves] | [product evidence] |
| 4 | Product/Demo | Show, do not tell | [screenshots / demo / before-after] | [live or recorded demo] |
| 5 | Market | Justify the opportunity size | [TAM / SAM / SOM, bottom-up] | [data source + calculation] |
| 6 | Business Model | Explain how money is made | [revenue mechanism + unit economics] | [pricing evidence] |
| 7 | Traction | Prove the business is working | [strongest growth metric + chart] | [internal data, timeframe defined] |
| 8 | Competition | Show the unique position | [2x2 matrix + moat description] | [competitor research] |
| 9 | Team | Demonstrate who can win | [credentials relevant to each role] | [LinkedIn-verifiable] |
| 10 | Financials | Show the financial trajectory | [3-year projections + assumptions] | [assumptions listed] |
| 11 | Ask | State what you need | [amount + instrument + use + milestone] | [budget model] |
| 12 | Closing | Leave a memorable vision | [vision statement + contact] | None |

---

### Detailed Content Specification Per Slide

#### Slide 1: Title
**Headline (one-line positioning):** [Company name] -- [category] for [customer] that [outcome]
**Sub-elements:** Presenter: [Name, Title] | Date: [Month Year] | Contact: [email]
**Design note:** Logo, one line of text, contact. No bullets. No financials.

---

#### Slide 2: Problem
**Headline:** [A single insight sentence that frames the cost of the problem]
**Customer:** [Exact job title/segment experiencing the pain]
**Status quo description:** [How this problem is handled today and why it fails]
**Quantification:** [Specific number -- cost in $, time in hours, error rate in %, scale in people affected]
**Validation source:** [Named report, survey, or primary research]
**Emotional anchor:** [Customer quote or scenario that makes the pain concrete]

---

#### Slide 3: Solution
**One-sentence description:** [Company] [verb] [what] for [who] so that [outcome]
**Problem-solution link:** [Explicit restatement of how this addresses slide 2]
**Product visual:** [Screenshot / diagram / before-after -- specify exactly what to show]
**Top 3 features + benefits:**
  - [Feature 1]: [Benefit to end user]
  - [Feature 2]: [Benefit to end user]
  - [Feature 3]: [Benefit to end user]

---

#### Slide 4: Product / Demo
**Demo flow (3 screens maximum):**
  1. [Screen 1: what the user sees, what action they take]
  2. [Screen 2: what happens next, what value is created]
  3. [Screen 3: the outcome state -- what success looks like]
**Key visual:** [Specify: screenshot, video embed, prototype photo, architecture diagram]
**Technical depth note:** [For deep tech -- one sentence on the core technical mechanism]

---

#### Slide 5: Market Size
**TAM:** $[X]B -- [description of the full addressable universe]
  Calculation: [Number of customers in universe] x [annual spend per customer] = $[X]B
**SAM:** $[X]B -- [segment you can realistically reach with your current product]
  Calculation: [Filtered customer count] x [your pricing] = $[X]B
**SOM:** $[X]M -- [what you capture in 24-36 months]
  Calculation: [Achievable customer count] x [your ACV] = $[X]M
**Data sources:** [Specific reports or databases used for market count estimates]
**Bottom-up logic:** [Why the calculation methodology is valid]

---

#### Slide 6: Business Model
**Revenue mechanism:** [subscription | usage | transaction | license | hybrid]
**Pricing:** [Tier 1: $X/mo | Tier 2: $X/mo | Tier 3: custom]
**ACV / ARPU:** $[X]
**CAC:** $[X] (by channel: [paid: $X | outbound: $X | inbound: $X])
**LTV:** $[X] (based on [X]% monthly churn, [X] year average customer life)
**LTV:CAC ratio:** [X]x
**CAC payback period:** [X] months
**Gross margin:** [X]%

---

#### Slide 7: Traction
**Lead metric:** [MRR $X | ARR $X | Users X | DAU X -- whichever is strongest]
**Growth rate:** [X% MoM | X% QoQ | X% YoY]
**Retention:** [X% monthly logo retention | X% net dollar retention]
**Growth chart:** [Specify: MRR over time, line chart with data points labeled by month]
**Milestone timeline:**
  - [Month/Year]: [Milestone 1]
  - [Month/Year]: [Milestone 2]
  - [Month/Year]: [Milestone 3]
**Validation:** [Internal Stripe/Baremetrics/ChartMogul data, verifiable in diligence]

---

#### Slide 8: Competition
**2x2 Matrix:**
  - X-axis: [Dimension 1 -- low to high] (e.g., automation level, ease of deployment)
  - Y-axis: [Dimension 2 -- low to high] (e.g., mid-market focus, vertical specificity)
  - [Company]: [Upper right or whichever quadrant represents the strategic advantage]
  - Competitors plotted: [List 4-8 named competitors with brief description]
**Sustainable moat:** [Specific moat category: network effects | switching costs | proprietary data | regulatory trust | novel IP]
**"Why can't [Incumbent] do this?" answer:** [Specific structural reason -- organization, incentive, technical debt]

---

#### Slide 9: Team
**Core team:**
  | Name | Title | One Credential (relevant to this role) |
  |------|-------|----------------------------------------|
  | [Name] | [Title] | [Credential] |
  | [Name] | [Title] | [Credential] |
**Key gap (if any):** [Missing role] -- plan: [hire within X months post-close]
**Advisors (if notable):**
  - [Name]: [Domain relevance in one sentence]

---

#### Slide 10: Financials
**Current ARR/MRR:** $[X]
**Projections:**
  | Metric | Year 1 | Year 2 | Year 3 |
  |--------|--------|--------|--------|
  | Revenue | $X | $X | $X |
  | Gross Margin | X% | X% | X% |
  | Total OpEx | $X | $X | $X |
  | EBITDA | $(X) | $(X) | $X |
  | Headcount | X | X | X |
**Breakeven:** [Month X of Year Y at $X ARR]
**Key assumptions:**
  - ACV: $[X], growing to $[X] by Year 3
  - Monthly churn: [X]%
  - Sales rep quota: $[X], ramp time: [X] months
  - New logo acquisition: [X] new customers/month by end of Year 1

---

#### Slide 11: Ask
**Amount:** $[X]M
**Instrument:** [SAFE | Convertible Note | Priced Equity]
**Valuation cap / pre-money:** $[X]M (if applicable)
**Use of funds:**
  - [Engineering/Product]: [X]% ($[X]K) -- [specific purpose: e.g., build integrations with Salesforce, Workday, BambooHR]
  - [Sales and Marketing]: [X]% ($[X]K) -- [specific purpose: e.g., hire 3 AEs, fund outbound tool stack]
  - [Operations/G&A]: [X]% ($[X]K) -- [specific purpose: e.g., finance, legal, office]
**Milestone this capital funds to:** [specific, measurable target -- e.g., $2M ARR, Series A raise, cash flow positive]
**Timeline:** [X months of runway, reaching [milestone] by [month/year]]

---

#### Slide 12: Closing
**Vision statement:** [One ambitious sentence about where the category goes in 5 years and the company's role in it]
**Contact:** [Website] | [Email] | [LinkedIn]
**Closing line:** [Not "Thank You" -- a forward-looking statement or provocative question]

---

### Coherence Check

| Narrative Link | From (Slide) | To (Slide) | Logical Connection | Status |
|----------------|--------------|------------|---------------------|--------|
| Problem → Solution | Slide 2: [problem summary] | Slide 3: [solution summary] | [direct / gap / needs bridging] | [✓ / ⚠] |
| Solution → Market | Slide 3: [solution scope] | Slide 5: [market claim] | [direct / gap] | [✓ / ⚠] |
| Market → Business Model | Slide 5: [market segment] | Slide 6: [revenue approach] | [direct / gap] | [✓ / ⚠] |
| Business Model → Traction | Slide 6: [model claim] | Slide 7: [evidence] | [validates / contradicts] | [✓ / ⚠] |
| Traction → Ask | Slide 7: [momentum] | Slide 11: [what funding accelerates] | [logical / speculative] | [✓ / ⚠] |

---

### Validation Checklist

| Claim | Slide | Source Required | Source Available | Status |
|-------|-------|-----------------|-----------------|--------|
| [Problem cost figure] | 2 | Yes | [source name or TBD] | [✓ / ⚠] |
| [TAM/SAM/SOM numbers] | 5 | Yes | [source name or TBD] | [✓ / ⚠] |
| [CAC / LTV figures] | 6 | Internal | [data source] | [✓ / ⚠] |
| [MRR / growth rate] | 7 | Internal | [Stripe/dashboard] | [✓ / ⚠] |
| [Revenue projections] | 10 | Assumption list | [stated / not stated] | [✓ / ⚠] |
| [Team credentials] | 9 | LinkedIn | [verifiable / unverifiable] | [✓ / ⚠] |
```

---

## Rules

1. **Never exceed 12 slides in the main deck for a standard 10-minute pitch.** Each additional slide beyond 12 costs approximately 30 seconds and one unit of investor attention. Supplementary material belongs in the appendix, presented only on request.

2. **Every market size number must be accompanied by the calculation methodology.** Top-down market sizing ("the HR tech market is $XX billion") is acceptable only when paired with a bottom-up cross-check. Bottom-up alone is always superior: "350,000 mid-market US companies x $10,000 ACV = $3.5B TAM" is investable logic; "we are targeting a $3.5B market" is not.

3. **The problem slide must quantify the cost of the problem in dollars, time, or measurable impact.** "It is frustrating" is not quantification. "$4,100 per new hire in lost productivity" (SHRM) is. Every quantification must name its source.

4. **Traction must show rate of change, not just a point in time.** "$15K MRR" is a data point. "$15K MRR, growing 20% month over month from $3K 8 months ago" is traction. If you only have a single data point and no growth rate, it is not a traction slide -- it is a "current state" slide, and you must label it honestly.

5. **The competition slide must use a 2x2 positioning matrix, never a feature comparison table.** Feature tables invite the "add a feature" objection. A 2x2 with strategically chosen axes frames where you uniquely live in the market. If the company is not clearly in the best position on the matrix, the axes are wrong -- choose different axes that reflect your genuine differentiation.

6. **The ask slide must name an exact dollar amount, the instrument, and the specific milestone the capital funds to.** Ranges ("between $1.5M and $3M") signal you are unsure of your own business model. The milestone must be a next-stage threshold: a specific ARR target, a specific unit economics milestone, or a specific product completion milestone that makes the next raise possible.

7. **Financial projections must list all material assumptions as explicit bullet points on the same slide.** The assumptions are what get validated in diligence. A projection without visible assumptions is not credible. The minimum required assumptions: average selling price, monthly churn rate, sales rep quota and ramp time, and new logo acquisition rate per month.

8. **Team credentials must be directly relevant to the role the person plays in this company.** "Rhodes Scholar" is irrelevant for a head of sales. "Led sales from $0 to $30M ARR at [company]" is relevant. Prioritize outcome credentials over institutional credentials for founders in technical roles. Prioritize domain tenure and relationship network credentials for founders in sales or business development roles.

9. **The closing slide must never be "Thank You" or "Questions?"** These are passive endings that cede control of the conversation to the audience at the least strategic moment. The closing line should plant a forward-looking idea that makes investors want to follow up. The best closing lines articulate the inevitability of the category the company is creating.

10. **The coherence check is mandatory before finalizing any deck.** Every narrative gap in the five-link chain (Problem → Solution → Market → Business Model → Traction → Ask) is a question investors will ask that the presenter is not prepared for. If a gap exists and cannot be closed with better evidence, it must be addressed proactively in the speaker notes with the recommended answer.

11. **Gross margin must be disclosed and defensible.** Investors use gross margin to assess the quality of the revenue. SaaS with 60% gross margins will receive a lower valuation multiple than SaaS with 80% gross margins. Hardware companies must show a credible path to gross margin improvement at scale. Services-heavy revenue in a "software" company will be discounted by institutional investors.

12. **The problem and solution slides must use the same vocabulary.** If the problem slide says "manual onboarding processes," the solution slide cannot say "automated workflow orchestration" without bridging the language. Vocabulary mismatch signals that the company is more focused on its internal description of the product than on its customers' experience of the problem.

---

## Edge Cases

### Pre-Revenue Company -- No Traction Metrics

A pre-revenue deck without any traction evidence is the weakest class of investor pitch. Do not leave the traction slide blank or remove it. Replace it with a "Validation" slide using the strongest available proxies, in descending order of investor credibility:

1. **Signed letters of intent (LOIs) or pre-orders:** Dollar value matters. "$200K in conditional LOIs from 4 named companies" is strong. Show the company names if permission is granted.
2. **Paid pilots with quantified results:** "3 paid pilots at $5K each, results showed 40% reduction in onboarding time" is investable.
3. **Waitlist with growth rate:** "1,200 waitlist signups in 6 weeks, growing 15% week over week" -- show the chart.
4. **Primary customer research:** "Interviewed 80 heads of HR at mid-market companies. 72% said they would pay $500+/month for this solution." Name the methodology and sample size.
5. **Accelerator or competition validation:** Y Combinator acceptance, Techstars batch member, First Round Capital company -- these are meaningful third-party endorsements.
6. **Industry or press validation:** Named coverage in a credible outlet, or a specific analyst quote. Do not manufacture this.

If none of the above exists, the company is not ready to raise money. Tell the user this directly and recommend they spend 8-12 weeks building evidence before pitching.

### B2B Enterprise with Long Sales Cycles -- The "Only 3 Customers" Problem

Enterprise companies often have very few customers but very large contract values and very promising pipelines. The standard traction slide will look weak if it only shows 3 logos. Handle this with a "Pipeline and Early Traction" structure:

- Add a **Pipeline slide** between Traction and Financials: show deals in pipeline by stage (discovery, proof of concept, legal review, verbal commit), with contract value and expected close date for each. A full pipeline of $2M+ TCV shows the business is working even if only 3 deals have closed.
- Show **Net Dollar Retention** from the existing customers -- if your 3 customers each expanded 40% year over year, that is a powerful signal.
- Show **sales cycle length** as a feature, not a bug: "Our average sales cycle is 90 days for a $150K ACV contract -- comparable to Salesforce's 60-day cycle for their mid-market product."
- Show **reference-ability**: "100% of our customers have agreed to be a reference" or "Our first customer introduced us to our third customer" signals genuine customer satisfaction.

### Hardware or Physical Product Company

Hardware pitches fail most often because they underestimate the complexity investors associate with physical products (manufacturing risk, inventory, long development timelines, high COGS). Proactively address all of these:

- Add a **Product Roadmap slide** showing: current prototype stage, regulatory certifications required and timeline (FCC, CE, FDA, UL depending on category), manufacturing partner status (in conversations, selected, or locked), and unit economics at scale vs. today. Show the COGS curve: "$85/unit today at 500-unit pilot production, $22/unit at 10,000-unit scale."
- The competition slide must include software substitutes as well as direct hardware competitors.
- Financials must show inventory financing assumptions and working capital requirements -- hardware companies often need 2-3x the working capital of software companies at the same revenue level.
- If the company is pre-manufacture: show the technical validation evidence (working prototype, teardown of COGS, manufacturing partner NDA signed) that de-risks the production milestone.

### 3-Minute Demo Day Pitch

Demo day pitches at Y Combinator, Techstars, and comparable programs have a specific structure that differs from the standard VC meeting. The audience is 200+ investors in a room with no Q&A during the pitch.

- **Target: 5 slides maximum, but typically delivered from 4-6 as visuals while speaking**
- **Slide 1 (Problem + Solution combined):** One slide, two panels. Problem on the left: one sentence + one number. Solution on the right: one sentence + one product image.
- **Slide 2 (Traction):** One chart only. The growth curve. No bullets. The number overlaid on the chart.
- **Slide 3 (Market):** One number. The SAM. With the bottom-up calculation in 10 words.
- **Slide 4 (Team):** Photos and names only. No titles. No bullets. Investors research teams after the pitch.
- **Slide 5 (Ask):** Amount, instrument, and one milestone. Three lines of text maximum.
- The pitch itself is entirely verbal. Slides are visual cues, not content delivery. Every word is spoken at 130-150 words per minute (never slower -- demo day audience attention span is approximately 2 minutes).
- Practice standard: the deck should be deliverable in exactly 2 minutes 45 seconds, leaving 15 seconds of buffer.

### Non-Fundraising Pitch (Partnership, Enterprise Sale, or Strategic Alliance)

When there is no funding ask, the deck structure shifts from narrative justification of an investment to narrative justification of a commercial or strategic decision.

- Replace **Slide 11 (Ask)** with a **Partnership Proposal slide**: what you are asking the partner to do (co-sell, integrate, white-label, invest strategically), what you bring to the partnership (customer access, technology, distribution), and what success looks like for both parties in 12 months.
- Replace **Slide 10 (Financials)** with an **ROI Analysis slide**: the specific, quantified value this partnership creates for the partner. "Our integration will reduce your enterprise customer churn by an estimated 12% based on data from comparable integrations." This must be credibly sourced.
- The market size slide should frame the opportunity in terms of the partner's existing business: "Your 4,200 mid-market customers represent $420M in potential upsell revenue through an onboarding automation add-on."
- The competition slide should be reframed: "Why partner with us vs. building this internally?" -- address build vs. buy vs. partner explicitly.
- The coherence check ends at "this partnership creates X value for you" rather than "this investment accelerates Y for us."

### Deep Tech or R&D-Intensive Company (AI/ML, Biotech, Clean Energy)

Deep tech companies face a specific investor skepticism: "this sounds like science, not a business." The pitch must walk a very precise line between technical credibility and commercial clarity.

- Add a **Technology Differentiation slide** between Solution and Market. This slide must: (1) explain the core technical mechanism in one analogy understandable to a non-PhD investor, (2) state the specific technical metric that proves it works (accuracy rate, compute efficiency, error rate, yield), (3) describe the IP protection status (patent filed, patent pending, trade secret), and (4) compare the technical performance to the current state of the art.
- The **team slide** must include the technical founders' publication records, relevant PhD or postdoc credentials, and any prior commercialization experience. Academic pedigree matters more in deep tech than in SaaS.
- The **financials slide** must include R&D milestones alongside revenue milestones -- investors need to see that technical risk is being managed against a timeline, not just that the financial projections look good.
- **"Why now" is critical:** Deep tech pitches must explain why the underlying technology is now commercially viable when it was not 3 years ago (compute costs, data availability, regulatory changes, infrastructure maturity). Without a clear "why now," the pitch reads as a research project, not a company.

### International or Non-US Company Pitching US Investors

International companies pitching US VCs face specific structural objections that must be pre-empted in the deck.

- The **Team slide** must include a clear statement of where the company is incorporated (Delaware C-Corp is preferred by US VCs), where the founding team is located, and -- if the team is outside the US -- what US presence exists or is planned.
- The **Market slide** must be clear about whether the TAM/SAM is global or US-only. US VCs typically want to see a clear US market strategy, not just a global market size. If the company is starting outside the US, explain the US expansion plan on the market slide.
- The **Business Model slide** must address currency and payment collection clearly. If the company is billing in a non-USD currency with revenue that appears in USD projections, state the FX assumption explicitly.
- Regulatory and compliance differences that affect the product must be addressed proactively -- either on the competition slide or in an appendix slide. Investors will ask "what changes when you enter the US market?" Have the answer in the deck.

---

## Example

**Input:** "Structure a pitch deck for a seed-stage B2B SaaS startup. The product automates employee onboarding -- IT provisioning, compliance training, equipment ordering, and new hire paperwork -- into one platform. We have 50 paying customers, $15K MRR, growing 20% month over month for the past 8 months. 95% monthly logo retention. Average contract value is $9,600/year. CAC is $2,800, LTV is $14,400. We are raising $2M on a SAFE at a $10M cap. Audience is seed VCs. 10-minute meeting."

---

**Output:**

## Pitch Deck: OnboardFlow

**Stage:** Seed
**Ask:** $2M via SAFE, $10M valuation cap
**Use of Funds:** Engineering 50% ($1M) | Sales 30% ($600K) | Operations 20% ($400K)
**Time Slot:** 10 minutes (standard first VC meeting)
**Audience:** Seed-stage institutional VCs
**Industry/Business Model:** B2B SaaS, annual subscription
**Current State:** $15K MRR ($180K ARR), 20% MoM growth, 50 customers, 95% logo retention

---

### Deck Configuration

**Format:** 10-minute standard, 12 slides + 4 appendix slides
**Total Slides:** 12 main + 4 appendix
**Lead Emphasis:** Traction and unit economics -- calibrated to seed VC audience
