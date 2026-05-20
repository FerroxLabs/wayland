---
name: prepare-fundraising
description: |
  Guides the user through preparing for a fundraising round from financial
  modeling through pitch deck creation, competitive analysis, due diligence
  preparation, term sheet literacy, narrative crafting, and investor
  communication. Use when the user is preparing to raise capital and needs
  a structured process covering every stage from financial foundation to
  investor outreach.
  Do NOT use for personal finance fundraising or crowdfunding (use personal
  finance skills), for grant writing (use grant-proposal-writing), or for
  ongoing investor relations after a round closes (use investor-update-email
  directly).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship strategy proposal planning step-by-step"
  category: "business-operations"
  depends: "financial-model-structure sales-pitch-deck competitive-analysis burn-rate-runway cap-table-basics fundraising-narrative investor-update-email"
  disclaimer: "none"
  difficulty: "advanced"
---

# Prepare for Fundraising

A seven-step workflow that prepares a startup founder for a fundraising round through financial modeling, pitch deck creation, competitive analysis, due diligence preparation, term sheet literacy, narrative crafting, and investor communication. Each step builds the evidence base and storytelling foundation that investors evaluate when deciding whether to invest.

**Estimated time:** 8-16 weeks (depending on company stage, data readiness, and fundraising complexity)

## When to Use

- User is preparing to raise a pre-seed, seed, Series A, or later round of venture capital
- User needs to build the complete fundraising package (financials, deck, narrative, data room)
- User wants a structured process that covers both the analytical foundation and the storytelling required for fundraising
- User is a first-time founder who has never raised institutional capital before
- Do NOT use when: the user is seeking personal loans or crowdfunding (different process and documentation), writing grant proposals (use grant-proposal-writing), or managing ongoing investor relations after a closed round (use investor-update-email directly)

## Prerequisites

Before starting this workflow, ensure:

1. **Company existence:** The user has a company (or is incorporating one) with a product, service, or technology to fund. Pre-idea fundraising is not covered by this workflow.
2. **Fundraising decision made:** The user has decided to raise external capital (as opposed to bootstrapping). This decision involves dilution, governance changes, and reporting obligations that the user should understand before starting.
3. **Financial data access:** The user has access to the company's financial information: revenue (if any), expenses, cash on hand, and historical data for at least the last 6-12 months. Pre-revenue companies need expense data and projections.
4. **Time commitment:** Fundraising is a near-full-time activity for 2-4 months. The user (typically the CEO) should plan to dedicate 60-80% of their time to fundraising activities during the active raise period.

## Steps

**Step 1: Financial Model** (uses: financial-model-structure)

Build the financial model that underpins the entire fundraising narrative. The model answers the investor's core question: "How does this company make money, and how much capital does it need to get there?"

- Input: Historical financial data (revenue, expenses, customer metrics), business model assumptions (pricing, unit economics, growth rates), and the target raise amount
- Output: A financial model containing: 3-year revenue projection with monthly granularity for year 1 and quarterly for years 2-3, unit economics (LTV, CAC, payback period, gross margin), expense forecast by category (headcount, infrastructure, marketing, G&A), use of funds breakdown (what the raised capital will be spent on, by category and quarter), and key assumptions clearly listed with sensitivity analysis for the top 3 assumptions
- Key focus: Investors evaluate financial models on the quality of assumptions, not the precision of projections. A model that says "we will grow 300% because our product is great" fails. A model that says "we will grow 300% because our current paid channel delivers $45 CAC with $180 LTV, and we plan to increase spend from $10K to $40K monthly" succeeds. Every projection must trace back to a testable assumption.

**Step 2: Pitch Deck** (uses: sales-pitch-deck)

Create the pitch deck that tells the company's investment story in 10-15 slides. The pitch deck is the single most-used fundraising asset -- it is sent to investors before meetings, presented during meetings, and circulated among partners after meetings.

- Input: Financial model from Step 1, company story (founding, milestones, vision), product details and traction data, team background, and market research
- Output: A pitch deck containing: problem slide (specific, quantified pain point), solution slide (how the product addresses the problem), market slide (TAM, SAM, SOM with bottoms-up methodology), product slide (screenshot or demo with key features), traction slide (metrics showing momentum -- MRR, growth rate, user count, engagement), business model slide (how revenue is generated), team slide (relevant experience and why this team wins), competition slide (positioning matrix, not a feature comparison), financial slide (key projections and use of funds from Step 1), and ask slide (how much, what terms, what milestones the capital unlocks)
- Key focus: The deck must tell a story, not present a data dump. The narrative arc is: (1) this is a real, painful problem, (2) we have built something that solves it, (3) the market is large enough to support a big outcome, (4) we have early proof it works, (5) we are the right team, (6) here is what we need to reach the next inflection point. Each slide advances this narrative. Slides that do not advance the story should be moved to the appendix.

**Step 3: Competitive Analysis** (uses: competitive-analysis)

Map the competitive landscape to demonstrate market awareness and articulate the company's defensible position. Investors ask about competition in every meeting -- the analysis prepared here prevents fumbled answers.

- Input: Known competitors (direct and indirect), the company's product features and positioning, customer feedback about alternatives, and market research from Step 2
- Output: A competitive analysis containing: competitive landscape map (2x2 matrix positioning the company against alternatives on the two dimensions that matter most), direct competitor profiles (3-5 competitors with their strengths, weaknesses, funding, and market position), indirect competitor and substitute analysis (what customers use today instead of the company's product), defensibility assessment (what prevents competitors from copying the approach -- network effects, data moats, brand, switching costs), and a "why we win" summary tied to specific evidence rather than assertions
- Key focus: Never claim "we have no competitors." Every company competes with alternatives, even if the alternative is "doing nothing" or "using spreadsheets." Investors interpret "no competition" as market ignorance. Instead, demonstrate that you understand the competitive landscape deeply and can articulate specifically why customers choose you over the alternatives.

**Step 4: Due Diligence Preparation** (uses: burn-rate-runway)

Prepare the financial and operational data that investors review during due diligence. Due diligence preparation before the process begins prevents delays and demonstrates operational maturity.

- Input: Financial model from Step 1, current cash position, monthly burn rate, existing contracts and commitments, and corporate documents
- Output: A due diligence package containing: current burn rate and runway calculation (months of cash remaining at current and projected burn), monthly financial statements for the last 12 months (or since inception), key contract summaries (customer agreements, vendor contracts, partnership deals), cap table showing current ownership structure, corporate document checklist (articles of incorporation, board resolutions, IP assignments, employment agreements), and a data room index organized by due diligence category
- Key focus: The burn rate and runway calculation is the most time-sensitive element. Investors calibrate their urgency based on runway. A company with 3 months of runway sends a signal of desperation (bad negotiating position). A company with 12 months of runway sends a signal of optional fundraising (strong negotiating position). Start fundraising with at least 6-9 months of runway to maintain negotiating leverage.

**Step 5: Term Sheet Literacy** (uses: cap-table-basics)

Understand the key terms and economics of term sheets so the founder can negotiate from an informed position. Term sheet literacy prevents founders from agreeing to terms that seem standard but have significant long-term consequences.

- Input: Cap table from Step 4, target raise amount and valuation range, any existing investor agreements or convertible notes, and the founder's goals for ownership dilution
- Output: A term sheet preparation document containing: cap table modeling showing ownership at target valuation (pre-money and post-money), key term definitions the founder must understand (liquidation preference, participation, anti-dilution, board composition, pro-rata rights, drag-along), scenario modeling showing founder ownership through future rounds (seed through Series B), red flag terms to negotiate or decline (full ratchet anti-dilution, participating preferred without cap, excessive board control), and a negotiation priority list (which terms matter most for this specific round)
- Key focus: Valuation is not the most important term. Founders obsess over valuation because it is the most visible number, but liquidation preference, participation rights, and board composition have a larger impact on founder outcomes in most scenarios. Model the actual dollar outcomes for the founder under different exit scenarios ($10M exit, $50M exit, $200M exit) to see which terms matter most.

**Step 6: Fundraising Narrative** (uses: fundraising-narrative)

Craft the overarching narrative that connects the financial model, pitch deck, competitive analysis, and market opportunity into a compelling investment thesis. The narrative is not a separate document -- it is the connective story that runs through every investor interaction.

- Input: All materials from Steps 1-5, the founder's personal story and motivation, early customer testimonials or case studies, and any unique market timing or trend the company capitalizes on
- Output: A fundraising narrative document containing: the 60-second elevator pitch (opening line, problem, solution, traction, ask), the 5-minute investor meeting opening, the full investor presentation narrative (what to say on each pitch deck slide), answers to the 10 most common investor questions for this stage and sector, the "why now" argument (what market shift or technology change makes this the right time), and the "why us" argument (what about this team's background makes them uniquely suited to solve this problem)
- Key focus: The narrative must be authentic. Investors meet hundreds of founders and can detect rehearsed inauthenticity instantly. The best fundraising narratives come from genuine founder insight -- a personal experience with the problem, a unique market observation, or a technical breakthrough that others have missed. The narrative should feel like the founder is sharing an insight, not performing a sales pitch.

**Step 7: Investor Communication** (uses: investor-update-email)

Design the investor outreach and communication cadence for the active fundraising period. Investor communication turns a pitch into a relationship and a meeting into a decision.

- Input: Target investor list (segmented by tier), fundraising narrative from Step 6, pitch deck from Step 2, and any warm introductions or existing investor relationships
- Output: An investor communication plan containing: outreach email templates (cold intro, warm intro, follow-up after meeting, follow-up after partner meeting), investor CRM tracking structure (pipeline stages: identified, contacted, meeting scheduled, meeting completed, partner meeting, term sheet, closed), meeting preparation checklist (what to research about each investor before the meeting), post-meeting follow-up protocol (thank you within 24 hours, additional materials within 48 hours, check-in if no response within 1 week), and investor update email template for keeping interested investors engaged during the fundraising process
- Key focus: Fundraising follows a sales funnel. Not every investor who takes a meeting will invest. Target 40-60 investor conversations to close a single lead investor at seed stage, 60-100 for Series A. Batch meetings into 2-3 week sprints to create competitive dynamics (multiple investors considering simultaneously creates urgency).

## Output Format

```
## Fundraising Preparation: [Company Name] -- [Round]

### Financial Model Summary
- **Revenue (trailing 12 months):** [amount or "pre-revenue"]
- **Monthly Burn Rate:** [amount]
- **Current Runway:** [months]
- **Target Raise:** [amount]
- **Use of Funds:**
  | Category       | Allocation | Timeline    |
  |---------------|------------|-------------|
  | [category 1]  | [amount]   | [quarters]  |
  | [category 2]  | [amount]   | [quarters]  |
- **Key Assumptions:** [top 3 with sensitivity ranges]

### Pitch Deck
- **Slides:** [count] main + [count] appendix
- **Narrative Arc:** Problem > Solution > Market > Traction > Team > Ask
- **Ask Slide:** [amount] at [valuation range] for [milestones]

### Competitive Landscape
- **Direct Competitors:** [count] profiled
- **Positioning:** [2x2 matrix dimensions: X-axis vs Y-axis]
- **Defensibility:** [primary moat type]

### Due Diligence Readiness
- **Data Room:** [complete/in-progress] -- [count] documents organized
- **Cap Table:** [current ownership summary]
- **Corporate Docs:** [status of key documents]

### Term Sheet Preparation
- **Target Valuation Range:** [pre-money low]-[pre-money high]
- **Dilution at Target:** [percentage]
- **Red Flag Terms Identified:** [count]
- **Negotiation Priorities:** [top 3 terms]

### Fundraising Narrative
- **Elevator Pitch:** [60-second version]
- **Why Now:** [market timing argument]
- **Why Us:** [team differentiation]
- **FAQ Prepared:** [count] questions with answers

### Investor Pipeline
- **Target Investors:** [count]
- **Pipeline Status:**
  | Stage              | Count |
  |-------------------|-------|
  | Identified         | [N]   |
  | Contacted          | [N]   |
  | Meeting Scheduled  | [N]   |
  | Meeting Completed  | [N]   |
  | Partner Meeting    | [N]   |
  | Term Sheet         | [N]   |
```

## Decision Points

- **Before Step 1 (pre-seed vs seed vs Series A):** Pre-seed decks are vision-heavy with minimal financial modeling (focus on team and problem). Seed decks balance vision with early traction data. Series A decks are data-heavy with proven unit economics and clear path to scale. The depth of every step in this workflow scales with the round stage.
- **After Step 1 (revenue vs pre-revenue):** Pre-revenue companies replace revenue projections with milestone-based projections (product milestones, user milestones, partnership milestones). The financial model in Step 1 focuses on expense forecasting and milestone-to-revenue bridge. Revenue-generating companies lead with unit economics and growth rate.
- **After Step 2 (strategic vs financial investor):** Strategic investors (corporate VCs, industry-specific funds) care more about market positioning and product synergies. Financial investors (traditional VCs) care more about financial returns and market size. Tailor the pitch deck emphasis in Step 2 based on the investor type being targeted.
- **After Step 4 (runway assessment):** If the due diligence preparation reveals that runway is below 6 months, consider raising a bridge round (convertible note or SAFE from existing investors) to extend runway before starting the formal fundraising process. Fundraising from a position of strength (long runway) produces better terms than fundraising from desperation (short runway).
- **After Step 5 (dilution modeling):** If term sheet modeling shows that the target valuation will dilute the founding team below 50% ownership after this round plus projected future rounds, consider raising less capital, seeking higher valuation, or exploring alternative funding (revenue-based financing, grants, strategic partnerships).

## Failure Handling

- **Step 1 fails (unit economics do not work):** If the financial model reveals that the business's unit economics are unsustainable at scale (LTV/CAC ratio below 3:1, negative gross margins that do not improve with scale), do not proceed to fundraising. Fix the business model first. Raising capital to scale a broken unit economics model accelerates failure rather than success. Return to product-market fit work.

- **Step 2 fails (no compelling traction story):** If the pitch deck cannot present a credible traction slide because the company has no meaningful metrics, pivot the narrative to founder-market fit and vision. For pre-traction companies, the deck should lead with the problem severity and the team's unique qualification to solve it. If neither traction nor unique team qualification exists, the company may not be ready for institutional fundraising.

- **Step 3 reveals stronger competitors than expected:** If competitive analysis reveals well-funded competitors with similar products and larger teams, refine the positioning to a specific niche the competitors underserve. Investors fund companies that can win a specific wedge of the market, not companies that compete head-to-head with larger, better-funded competitors.

- **Step 4 reveals data room gaps:** If due diligence preparation uncovers missing corporate documents (unsigned IP assignments, informal employee agreements, missing board minutes), prioritize fixing these before investor meetings. Missing corporate hygiene is a red flag that causes investors to question operational competence. Engage a startup attorney to close documentation gaps.

- **Step 5 reveals unfavorable existing terms:** If cap table analysis reveals that prior fundraising rounds created terms that make this round unattractive to new investors (excessive liquidation preferences, full ratchet anti-dilution), negotiate with existing investors to clean up the cap table before approaching new investors. New investors will not invest on top of terms that disadvantage them.

- **Step 7 fails (investor rejection after due diligence -- high-stakes late-stage failure):** If an investor says no after completing due diligence, this is the most painful failure in the workflow because the founder has invested significant time and emotional energy. Recovery protocol: (a) ask the investor for specific, honest feedback on why they passed, (b) categorize the feedback as fixable (data gap, team gap, market concern) or unfixable (fund thesis mismatch, stage mismatch), (c) for fixable feedback, update the relevant Step outputs (financial model, deck, narrative) before the next investor meeting, (d) for unfixable feedback, remove similar investors from the pipeline and focus on better-matched prospects. Re-entry point: return to Step 6 (narrative) with the rejection feedback incorporated, then resume Step 7 outreach with the refined materials. Do not take more than 1 week to process and incorporate feedback before resuming outreach. Momentum matters -- a stalled fundraise signals trouble to the market.

- **User wants to change direction mid-workflow (pivot during fundraise):** A company pivot during an active fundraise is one of the highest-risk scenarios. If the pivot is minor (feature reprioritization, target segment shift), update Steps 1-2 and continue. If the pivot is major (different product, different market), pause the fundraise entirely. Investors who received the original pitch will not respond well to a fundamentally different pitch 4 weeks later. Wait until the pivot has generated new data (3-6 months), then restart from Step 1.

## Expected Outcome

When this workflow is complete, the user will have:

1. A financial model with revenue projections, unit economics, and use-of-funds breakdown
2. A pitch deck that tells a compelling investment story in 10-15 slides
3. A competitive analysis with positioning matrix and defensibility assessment
4. A data room with financial statements, corporate documents, and cap table
5. Term sheet literacy with scenario modeling and negotiation priorities
6. A fundraising narrative that connects all materials into a coherent investment thesis
7. An investor communication plan with outreach templates, CRM tracking, and follow-up protocols
8. Preparedness for the most common investor questions and objection scenarios

## Edge Cases

- **User is a first-time founder with no fundraising experience.** Add a pre-Step 1 orientation covering fundraising fundamentals: round types (pre-seed, seed, Series A), investor types (angels, VCs, strategics), timeline expectations (3-6 months for a typical seed round), and the emotional toll of fundraising. Set realistic expectations before diving into execution.
- **User has previous unsuccessful fundraising attempts.** Step 6 must address the "what changed" question that every investor will ask. Identify what was different about the prior attempt (timing, traction, market, team) and what has improved since then. Prior fundraising failures are not disqualifying but require a clear narrative about progress.
- **Company has existing convertible notes or SAFEs from prior rounds.** Step 5 must model the conversion of existing instruments at the new round's terms. Cap table complexity increases significantly with multiple convertible instruments. Use a cap table management tool or engage a startup attorney to model the conversion accurately.
- **User is raising from international investors or in a non-US market.** Adjust Step 7 outreach for cultural and structural differences in international fundraising (different term conventions, different due diligence expectations, currency considerations). Some investor communication norms vary significantly by geography.
- **Company is raising a down round (lower valuation than previous round).** Step 6 narrative must address the valuation decline directly and credibly. Focus on what the company learned, what changed in the market, and why the current valuation reflects a genuine opportunity rather than a distressed sale. Existing investor relationships (Step 7) become critical -- existing investors who participate in a down round signal confidence to new investors.
- **User is a technical founder with limited business or storytelling experience.** Prioritize Step 6 (narrative) above all other steps. Technical founders often build excellent financial models and products but struggle to tell the investment story. Consider rehearsing the pitch with advisors or mentors 5-10 times before the first real investor meeting. Record practice pitches and review them for pacing, clarity, and confidence.

## Example

**Input:** "We are a seed-stage B2B SaaS company with $15K MRR, 3 founders, 12 months of runway, and we want to raise $2M at a $10M pre-money valuation. We have 40 paying customers in the e-commerce space."

**Output:**

## Fundraising Preparation: CartFlow -- Seed Round

### Financial Model Summary
- **Revenue (trailing 12 months):** $120K ARR ($15K MRR current, grown from $3K MRR 12 months ago)
- **Monthly Burn Rate:** $45K
- **Current Runway:** 12 months ($540K in bank)
- **Target Raise:** $2M
- **Use of Funds:**
  | Category          | Allocation | Timeline     |
  |-------------------|------------|--------------|
  | Engineering (3 hires) | $960K  | Q1-Q4        |
  | Sales (2 hires)   | $480K      | Q2-Q4        |
  | Marketing         | $360K      | Q2-Q4        |
  | G&A + buffer      | $200K      | Q1-Q4        |
- **Key Assumptions:** (1) Net revenue retention stays above 120% (sensitivity: 100-140%), (2) Paid CAC stays below $2,500 (sensitivity: $1,800-$3,200), (3) Sales cycle remains under 30 days (sensitivity: 21-45 days)

### Pitch Deck
- **Slides:** 12 main + 5 appendix
- **Narrative Arc:** E-commerce checkout abandonment problem ($18B annually) > CartFlow reduces abandonment 23% > $120K ARR growing 5x YoY > 40 paying customers with 120% NRR > Founded by ex-Shopify engineers > $2M to reach $1M ARR and Series A readiness
- **Ask Slide:** $2M at $10M pre-money for 18-month runway to $1M ARR

### Competitive Landscape
- **Direct Competitors:** 4 profiled (Bolt, Fast, ThriveCart, SamCart)
- **Positioning:** X-axis: SMB vs Enterprise, Y-axis: Checkout-only vs Full-stack commerce. CartFlow positioned in SMB + full-stack quadrant (underserved by existing players)
- **Defensibility:** Integration depth (40+ e-commerce platform integrations built over 18 months; competitor average is 12)

### Due Diligence Readiness
- **Data Room:** Complete -- 47 documents organized in 8 categories
- **Cap Table:** 3 founders (equal 30% each = 90% total), 10% ESOP
- **Corporate Docs:** All current (Delaware C-Corp, IP assignments signed, employment agreements executed)

### Term Sheet Preparation
- **Target Valuation Range:** $8M-$12M pre-money
- **Dilution at Target:** 16.7% at $10M pre-money ($2M raise)
- **Red Flag Terms Identified:** 2 (participating preferred, super pro-rata rights)
- **Negotiation Priorities:** (1) Non-participating preferred, (2) Single-trigger acceleration for founders, (3) Board composition (2 founders + 1 investor + 2 independents)

### Fundraising Narrative
- **Elevator Pitch:** "E-commerce stores lose $18 billion annually to checkout abandonment. CartFlow reduces abandonment by 23% for Shopify and WooCommerce stores. We have 40 paying customers, $15K MRR growing 5x year-over-year, and 120% net revenue retention. We are raising $2M to build the sales team and reach $1M ARR."
- **Why Now:** E-commerce platforms are opening checkout APIs that were previously closed. CartFlow is the first to integrate with all 40+ platforms through these new APIs.
- **Why Us:** All 3 founders spent 4+ years at Shopify building checkout infrastructure. We know this problem domain better than anyone in the market.
- **FAQ Prepared:** 15 questions with data-backed answers (churn, CAC payback, competitive response, international expansion, team scaling)

### Investor Pipeline
- **Target Investors:** 55 (25 Tier 1 seed funds, 20 Tier 2, 10 angels)
- **Pipeline Status:**
  | Stage              | Count |
  |-------------------|-------|
  | Identified         | 55    |
  | Contacted          | 32    |
  | Meeting Scheduled  | 18    |
  | Meeting Completed  | 12    |
  | Partner Meeting    | 4     |
  | Term Sheet         | 1     |
