---
name: board-update-narrative
description: |
  Writes board-level narrative updates that complement financial reports with
  strategic context, competitive positioning, key risks, and forward-looking
  guidance for board of directors audiences. Use when the user needs to write
  a board update, board meeting narrative, or director-level briefing. Do NOT
  use for stakeholder updates to management (use `stakeholder-update`), investor
  emails (use `investor-update-email`), or full business reports (use
  `business-report`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing business-writing report"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Board Update Narrative

## When to Use

Use this skill when the user needs to produce a written narrative that accompanies or replaces a board deck for a directors meeting, audit committee briefing, or governance committee session. Specific trigger scenarios include:

- The user is a CEO, CFO, or Chief of Staff preparing the written narrative portion of a board package for a quarterly or annual board meeting
- The user needs to frame financial results alongside strategic context for directors who have fiduciary oversight -- not operational management -- responsibility
- The user is preparing a board memo or letter to be distributed in advance of the meeting as a pre-read, allowing directors to come prepared rather than learning facts during the meeting
- The user needs to present a material development to the board between scheduled meetings (a significant acquisition offer, regulatory action, executive departure, or capital emergency) and needs a special-purpose board communication
- The user is preparing materials for a specific governance committee (audit, compensation, nominating and governance, risk) that require the same board-appropriate register and structure as a full board update
- The user needs to document a board-level decision in writing, including the information provided to the board, so the decision is defensible and legally protected under the business judgment rule
- The user is a company secretary or general counsel preparing a factual update for board consumption following a legal or regulatory event

**Do NOT use this skill when:**

- The user wants a management stakeholder update distributed to department heads or senior team (use `stakeholder-update` -- that format is forward-looking, operational, and motivational in register, which is inappropriate for governance audiences)
- The user wants an investor update email for LPs, angels, or VCs outside of a formal board meeting (use `investor-update-email` -- that format has a different persuasion dynamic and investor-relations tone)
- The user wants a full business report with methodology, detailed analysis, footnotes, and appendices (use `business-report` -- board narratives are intentionally summary documents)
- The user wants an executive summary of a specific existing document (use `executive-summary` -- that skill is document-agnostic condensation, not governance-framed narrative)
- The user wants a pitch deck or fundraising narrative (the audience and purpose are different -- boards govern; investors decide whether to commit capital)
- The user needs a management discussion and analysis (MD&A) section for a public company filing -- that is a regulated document requiring legal and accounting review under SEC Rule 10-K/10-Q requirements, not a skill output
- The user wants talking points or a verbal script for presenting to the board (the written narrative and the spoken presentation are different artifacts with different requirements)

---

## Process

### Step 1: Gather the Essential Inputs Before Writing Anything

Board narratives fail most often because the writer substitutes general language for specifics. Before generating a single sentence, collect all of the following. If the user has not provided something, ask directly rather than estimating.

- **Company basics:** Name, legal stage (private -- pre-seed, seed, Series A/B/C; growth-stage; public), and industry vertical
- **Reporting period:** Quarter (Q1/Q2/Q3/Q4) and fiscal year; clarify whether the fiscal year is calendar-aligned or offset (common in retail, healthcare, and government-contracting companies)
- **Board composition context:** Approximate number of directors, whether there are independent directors vs. investor-directors vs. management directors, and whether any board members are new (requiring additional context anchoring)
- **Financial data:** Revenue actual vs. plan, gross margin actual vs. plan, operating burn or EBITDA actual vs. plan, cash balance, and monthly or quarterly burn rate -- produce the plan-vs.-actual table only with numbers the user confirms; never interpolate or estimate financial figures
- **Key events:** Wins, losses, hires, departures, product launches, competitive moves, regulatory changes, or customer events that materially affected the period
- **Risks:** Existing risks that have evolved plus any net-new risks; users often underreport risks in their initial briefing because they want to appear competent -- probe specifically by asking "what keeps you up at night that you have not mentioned yet?"
- **Board asks:** Specific approvals required, items for board discussion and direction, and any executive session topics (legal matters, personnel decisions, M&A discussions) that should be noted but not detailed in the written narrative
- **Audience considerations:** Whether the document is a pre-read (full narrative depth required -- directors will read it alone, cold, without the presenter in the room) or a meeting-room leave-behind (can be more compressed since the CEO will present verbally)

### Step 2: Determine the Appropriate Tone and Length Register

Board narratives are not one-size-fits-all. Apply the following calibration framework based on what the user tells you about their company stage and situation.

**By company stage:**
- Pre-seed and seed: Boards are small (3-5 members), often informal, and founders often lack governance experience. Keep the narrative to 3-4 pages. Focus heavily on cash runway (boards of early-stage companies are acutely focused on this) and product-market fit signals. Skip competitive context sections if the market is too early to have established competitors.
- Series A and B: Boards are formalizing (5-7 members, first independent directors arriving). 4-6 pages. Introduce the full plan-vs.-actual table, competitive framing, and formal risk tracking. This is the stage where governance discipline must be established.
- Series C through pre-IPO: Boards are fully professional (7-9 members, audit and compensation committees forming). 6-8 pages. Add committee-specific reporting, compensation disclosures, and legal/regulatory tracking. Boards at this stage will notice missing governance structure immediately.
- Public company: Board narratives are typically 5-7 pages of CEO/CFO narrative supplementing the formal MD&A and press release. Forward-looking statements require legal review before distribution. Focus the narrative on strategic context that the MD&A does not provide.

**By situation:**
- Normal quarter, results on plan: Keep it tight (3-4 pages). Boards respect brevity when things are on track. Spend word count on forward risks and strategic questions.
- Significant miss or material setback: Expand the financial narrative section. Lead with the facts, not the recovery plan. Boards trust managers who report bad news directly before being asked.
- Transformational event (acquisition, major partnership, capital raise): Add a dedicated section for the event, its strategic rationale, and the board approval or ratification requested.
- Crisis or legal matter: Consult with the user on what can be in writing vs. what must be in executive session. Summarize the situation factually; avoid legal conclusions in the written narrative.

### Step 3: Write the Company Summary (the Most Important Paragraph)

The company summary is read by every board member, including those who will not read the rest of the narrative. It appears first and is written last -- after the rest of the narrative is complete -- so it accurately reflects what follows.

Structure the company summary as exactly three sentences:

1. **Financial health sentence:** State current quarter revenue actual vs. plan (with variance percentage), the key driver of any variance, and cash position with runway in months. Example: "Q3 revenue of $4.2M was 8% below the $4.6M plan, driven by a delayed enterprise close, while gross margin improved 3 percentage points to 71%, and cash position of $9.1M represents 14 months of runway at the current burn rate."
2. **Strategic position sentence:** State the most significant strategic development of the period -- positive or negative -- and its implication for the approved strategic plan. Example: "The launch of the enterprise tier attracted three Fortune 500 pilots in Q3, validating the upmarket motion the board approved in January, though sales cycle length is tracking longer than the 60-day assumption in the plan."
3. **Priority sentence:** State the single most important thing the board needs to do, decide, or know coming out of this meeting. Example: "The most urgent item for board guidance this quarter is the capital allocation decision on the proposed $1.2M engineering infrastructure investment, which appears in Section 6."

The company summary must NOT contain optimistic framing, spin, or conclusions without data support. If all three facts are negative, all three sentences will be negative. That is appropriate for a governance document.

### Step 4: Build the Financial Performance Section

The financial performance section is the technical core of the narrative. Apply these principles:

**Plan-vs.-actual table construction:**
- Always include plan, actual, and variance for each metric -- never actual-only
- Express variance as both a percentage (for relative magnitude) and an absolute dollar amount (for materiality assessment)
- Include at minimum: revenue, gross margin percentage, operating burn or EBITDA, and cash position with runway
- For SaaS companies, add: ARR or MRR, net revenue retention, and customer count
- For marketplace companies, add: GMV, take rate, and active buyers/sellers
- For consumer companies, add: DAU/MAU, average revenue per user, and customer acquisition cost vs. lifetime value ratio
- Cash position does not have a plan variance -- show only actual with runway at current burn and runway at projected burn if those differ

**Financial narrative paragraphs:**
- Paragraph 1: What drove the revenue result. Decompose the miss or beat into its components. A $300K revenue miss explained as "a combination of enterprise sales cycle delay ($200K, one deal that closed two weeks into Q4), lower SMB average contract value ($75K, discount campaign impact), and one customer churn event ($25K)" is infinitely more useful than "revenue was impacted by timing."
- Paragraph 2: Margin and expense. Explain the key cost drivers and whether they were planned or unplanned. Flag any cost acceleration that will persist vs. one-time items.
- Paragraph 3: Cash and runway. State the cash position, the monthly burn rate, the runway calculation, and any known upcoming cash needs (tax payments, bonus cycles, capital expenditures, debt service) that are not reflected in the monthly burn. For companies within 9 months of runway, this paragraph must also address the plan for extending runway.

### Step 5: Write the Strategic Highlights and Competitive Context Sections

These sections provide the interpretation layer that raw financial data cannot. Apply these specific techniques:

**Strategic highlights:**
- Limit to 3-5 items maximum. More than 5 dilutes significance.
- Each highlight must state what happened AND why it matters strategically -- one sentence of fact, one sentence of strategic implication
- Connect each highlight back to the strategic plan the board approved: "This validates / accelerates / complicates the strategy we presented in [month]"
- Do not list operational achievements that have no strategic implication (shipping a minor feature, completing a routine audit, hiring for a budgeted role)

**Competitive and market context:**
- This section is where most board narratives fail. CEOs report internal results but treat external context as optional. It is not optional. Internal results mean nothing without external benchmarks.
- Specific items to cover: new competitor market entries or funding events, competitor pricing changes, regulatory changes affecting the industry, macroeconomic shifts affecting buyer behavior (budget freezes, procurement slowdowns, sector tailwinds), and market share estimates where available
- For early-stage companies without market share data, report leading indicators: win/loss ratios by competitor, sales cycle length trends, average discount depth as a proxy for pricing power
- End the competitive section with an explicit statement of how the company's strategy accounts for what has changed: "Our plan assumed [assumption]. What we have observed this quarter [confirms / challenges] that assumption, and we are [sticking with the plan / proposing an adjustment described in Section 6]."

### Step 6: Build the Risk Section Using a Structured Framework

Board risk reporting is a governance obligation, not an optional narrative element. Apply the following framework:

**Risk classification:**
- Classify each risk on two dimensions: probability (High, Medium, Low) and impact severity (H/M/L) -- this produces a 3x3 risk matrix
- High probability + High impact risks require board-level attention and a mitigation narrative, not just a table entry
- Low probability + High impact risks should be in the table to demonstrate awareness but need only brief mitigation notes
- Risks that are fully mitigated and closed should be removed from the table and noted in a one-sentence "Risks resolved this quarter" footnote

**Risk categories to always consider:**
- Market risk (competitive, regulatory, macroeconomic)
- Execution risk (product delivery, sales pipeline, operational capacity)
- People risk (key person dependency, retention, succession)
- Financial risk (runway, customer concentration, covenant compliance, currency exposure for international businesses)
- Legal and compliance risk (litigation, data privacy, IP, regulatory examinations)
- Reputational risk (customer data breach, executive conduct, social media events)

**Status tracking:**
- Mark each risk as New (arose since the last board meeting), Ongoing (previously reported, still active), Escalating (previously reported, now assessed as more severe), De-escalating (previously reported, now assessed as less severe), or Resolved (closed since the last board meeting)
- The "New" and "Escalating" designations are what board members will focus on -- never understate risk escalation

**Mitigation quality test:**
- After drafting each mitigation, apply this test: "If this risk materializes in the next 30 days, will the mitigation have meaningfully reduced the impact?" If the mitigation is a plan to plan, or a committee that will assess the situation, say so honestly -- boards value honesty about mitigation quality over false confidence

### Step 7: Write the Forward Outlook and Board Asks Sections

**Forward outlook:**
- State the next-period revenue forecast with an explicit range (not a single point estimate) -- using a range signals appropriate epistemic humility and prevents boards from anchoring on a single number
- List the 3-5 key assumptions underlying the forecast explicitly. Examples: "The Meridian account closes by January 15"; "The engineering team reaches full capacity by February"; "No material change to CompetitorX pricing"
- State the upside scenario (what has to go right and what the outcome would be) and the downside scenario (what has to go wrong and what the outcome would be)
- Do NOT present a forward outlook as a commitment. Use language like "we expect," "our current forecast," "based on current pipeline visibility." For public companies, add the required forward-looking statement disclaimer.

**Board approvals and discussion items:**
- This section is why the board is meeting. Make it easy to find and easy to act on.
- Every item needs: a description, a type (approval requiring a formal vote, or discussion where management seeks board guidance), management's recommendation, and a reference to supporting materials
- Approval items should state the resolution language management is proposing so the board secretary can record the vote accurately
- Discussion items should state the specific question management wants the board's input on -- "Discuss go-to-market strategy" is too vague; "We are seeking board input on whether to prioritize mid-market or enterprise in Q2 given the resource constraints described in the financial narrative" is specific enough to generate useful board discussion
- Order items by urgency: items requiring a formal vote before business can proceed, then items requiring a decision before the next board meeting, then standing updates and informational items

### Step 8: Review for Governance Register and Candor Standards

Before finalizing the narrative, apply this quality review:

**Tone register check:**
- Board narratives should be written in third person or first-person plural ("we"), never first-person singular ("I")
- Avoid operational jargon that board members may not know -- define metrics on first use if there is any chance of ambiguity
- Avoid marketing language ("exciting," "incredible," "transformational") -- these words undermine credibility in a governance document
- Avoid hedges that obscure accountability ("performance was impacted by factors") -- use active voice and name the causes

**Candor check -- apply to every section:**
- Would a board member who reads this document and then sees the actual results feel they were given an accurate picture? If not, revise.
- Is every variance explained with a root cause, not a narrative excuse?
- Are the risks the real risks, or are they the sanitized risks that management is comfortable disclosing?
- Is the forward outlook consistent with what management actually believes, or is it optimistic to avoid board concern?

**Legal review flag:**
- For public companies: all forward-looking statements require legal review before distribution
- For pre-IPO companies: be careful about making representations about timing, valuation, or transaction terms in board documents that will become discoverable
- For companies with ongoing litigation: board narratives that discuss the litigation in detail become part of the litigation record -- note the matter and direct board members to speak with legal counsel for details

---

## Output Format

```
# Board Update: [Company Name]

**Period:** [Q1/Q2/Q3/Q4] [Fiscal Year]
**Prepared by:** [Name, Title]
**Board meeting date:** [Month Day, Year]
**Distribution:** [Board members only / Board and senior leadership / Restricted]

---

## Company Summary

[Sentence 1: Financial health -- revenue actual vs. plan with variance percentage,
primary variance driver, cash position, and runway in months.]

[Sentence 2: Strategic position -- most significant strategic development of
the period and its implication for the board-approved strategic plan.]

[Sentence 3: Priority -- the single most important item the board needs to
decide, approve, or understand coming out of this meeting.]

---

## 1. Financial Performance

### Results vs. Plan

| Metric | Plan | Actual | Variance ($) | Variance (%) | Commentary |
|--------|------|--------|-------------|-------------|-----------|
| Revenue | $[X] | $[X] | $[+/-X] | [+/-]% | [1-sentence root cause] |
| Gross margin | [X]% | [X]% | -- | [+/-]pp | [1-sentence explanation] |
| Operating burn / EBITDA | $[X]/mo | $[X]/mo | $[+/-X] | [+/-]% | [1-sentence explanation] |
| Cash position | -- | $[X] | -- | -- | [X] months at current burn |
| [ARR / MRR / GMV / metric relevant to business model] | $[X] | $[X] | $[+/-X] | [+/-]% | [1-sentence explanation] |
| [Net revenue retention / take rate / ARPU] | [X]% | [X]% | -- | [+/-]pp | [1-sentence explanation] |

### Financial Narrative

**Revenue:** [1-2 paragraphs decomposing the revenue result into its components.
Identify each significant driver of variance by dollar amount and root cause.
Distinguish one-time timing factors from structural factors. State whether
the pipeline entering the next period is stronger or weaker as a result.]

**Margins and costs:** [1 paragraph on gross margin drivers and operating
cost items. Flag any costs that will persist vs. one-time events.
Connect cost trends to the operating plan.]

**Cash and runway:** [1 paragraph. State cash balance, monthly burn rate
(average over the quarter, not just month-end), runway in months at current
burn, and runway at projected burn if different. Note any upcoming cash
events (taxes, bonuses, debt service, capital expenditures) not reflected
in monthly burn. If runway is under 9 months, state the plan for extension.]

---

## 2. Strategic Highlights

- **[Highlight 1 -- 3-6 word headline]:** [One sentence of fact stating what
  happened, with specific numbers where available. One sentence of strategic
  implication connecting back to the approved strategic plan.]

- **[Highlight 2]:** [Same structure.]

- **[Highlight 3]:** [Same structure.]

[Optional: Highlight 4 and 5 if warranted. Do not force 5 if fewer are material.]

---

## 3. Competitive and Market Context

**Market conditions:** [1 paragraph. Describe any macroeconomic, sector-specific,
or regulatory changes that materially affected buyer behavior, pricing,
or market structure since the last board meeting.]

**Competitive landscape:** [1-2 paragraphs. Describe specific competitor
moves: funding events, pricing changes, product launches, customer wins/losses,
and any new market entrants. For each significant competitor development,
state the estimated impact on pipeline, win rates, or pricing.]

**Strategic implications:** [1 paragraph. State explicitly whether and how
the company's strategy accounts for what has changed. Name the assumption
in the approved plan that is now confirmed or challenged, and state
management's proposed response.]

---

## 4. Key Risks

| # | Risk Description | Category | Probability | Impact | Mitigation | Status |
|---|-----------------|---------|-----------|--------|-----------|--------|
| 1 | [Specific risk] | [Market/Execution/People/Financial/Legal/Reputational] | [H/M/L] | [H/M/L -- 1-phrase description] | [Specific action underway, not a plan to plan] | [New/Ongoing/Escalating/De-escalating] |
| 2 | [Specific risk] | [Category] | [H/M/L] | [H/M/L -- description] | [Specific action] | [Status] |
| 3 | [Specific risk] | [Category] | [H/M/L] | [H/M/L -- description] | [Specific action] | [Status] |
| 4 | [Specific risk] | [Category] | [H/M/L] | [H/M/L -- description] | [Specific action] | [Status] |
| 5 | [Specific risk] | [Category] | [H/M/L] | [H/M/L -- description] | [Specific action] | [Status] |

**High-priority risk narrative:** [If any risk is classified High probability
+ High impact, add 1-2 paragraphs here describing the situation in detail,
the mitigation in detail, and what board support or input management needs.]

**Risks resolved since the last board meeting:** [List any risks removed from
the table this quarter and the reason for resolution.]

---

## 5. Forward Outlook

**Next-period forecast:** [State revenue range for next quarter, not a point
estimate. State the gross margin and burn expectations. Note the key pipeline
items that underpin the forecast and their current status.]

**Key forecast assumptions:**

| # | Assumption | Basis | If This Assumption Is Wrong |
|---|-----------|-------|---------------------------|
| 1 | [Specific assumption, e.g., "Meridian closes by January 15"] | [Pipeline data / signed LOI / verbal commitment] | [Revenue impact and timing] |
| 2 | [Specific assumption] | [Basis] | [Impact] |
| 3 | [Specific assumption] | [Basis] | [Impact] |

**Upside scenario:** [What has to go right, and what revenue/margin result
that would produce -- expressed as a range with probability estimate.]

**Downside scenario:** [What has to go wrong, and what revenue/margin result
that would produce -- expressed as a range with probability estimate. State
the cash runway implications of the downside scenario if materially different.]

[Public company note: Statements in this section regarding future performance
are forward-looking statements subject to risks and uncertainties as described
in the company's most recent filings with the SEC.]

---

## 6. Board Approvals and Discussion Items

| # | Item | Type | Management Recommendation | Supporting Materials |
|---|------|------|--------------------------|---------------------|
| 1 | [Item requiring formal vote] | Approval | [Proposed resolution language: "The board hereby approves..."] | [Reference to deck page or appendix] |
| 2 | [Item requiring board input] | Discussion | [Specific question: "Management seeks board guidance on whether to..."] | [Reference] |
| 3 | [Standing update or ratification] | Ratification / Information | [Summary of action taken and ratification requested] | [Reference] |

[If any item requires executive session (personnel, legal, M&A), note it as:]

**Executive session requested:** [Topic description only -- no details in the
written narrative. Duration estimate: [X] minutes. Attendees: [Board members
only / Board and General Counsel / Other].]

---

## Appendix A: Key Metrics Definitions

[Include only if the board has new members, the company has changed its
metric definitions, or the business model is unusual. Define each metric
used in the financial performance section with the precise calculation method.]

| Metric | Definition | Why We Track It |
|--------|-----------|----------------|
| [Metric name] | [Precise calculation] | [Strategic relevance] |

---

## Appendix B: Company Context (for New Board Members)

[Include only when one or more board members are attending their first meeting.
Remove in subsequent quarters.]

**Mission:** [One sentence.]
**Business model:** [2-3 sentences on how the company makes money.]
**Strategic plan summary:** [3-5 bullet points on the strategic priorities
the full board approved and the time horizon.]
**Key metrics to understand the business:** [List the 5-6 metrics that appear
throughout board reporting with a brief explanation of each.]
```

---

## Rules

1. **Never write a company summary that is longer than three sentences.** If it takes more than three sentences to orient the board, the narrative body is not well-organized. Length in the company summary indicates a failure of structure elsewhere.

2. **Never present financial results without plan-vs.-actual variance in both dollar and percentage terms.** The percentage tells the board the relative magnitude; the dollar tells them whether the magnitude is material. A 20% revenue miss is very different if it represents $20K vs. $2M. Both numbers are necessary.

3. **Never list a risk without a status designation.** "New" and "Escalating" are the two most important designations -- boards must be able to identify what has changed since the last meeting. A risk list without status tracking is not governance; it is a static worry list.

4. **Never present a forward-looking forecast as a single point estimate.** Point estimates imply false precision and create accountability traps. Always present a range with stated assumptions. This is not hedging -- it is epistemically honest forecasting.

5. **Never write mitigations that are plans to plan.** "A task force will assess the situation" and "Management is monitoring developments" are not mitigations. A mitigation is a specific action already underway with a named owner and a timeline. If no real mitigation exists, say "No mitigation is currently in place; this risk is being accepted." Boards respect honesty about mitigation quality.

6. **Never bury the miss, the setback, or the bad news.** The company summary and the financial narrative must address material negative results directly and early. Board members who discover a significant miss in paragraph 4 of the financial narrative after three paragraphs of highlights will distrust future communications permanently.

7. **Never use marketing language in a board narrative.** Words like "exciting," "transformational," "incredible," "game-changing," and "landmark" are presentation-layer language that damages credibility in a governance document. Use specific facts instead: "The partnership is projected to add $1.2M in revenue in the first year" is informative; "We are thrilled to announce an exciting new partnership" is not.

8. **Always separate approval items from discussion items from informational items in the board asks section.** Blending these types causes board confusion about when a vote is expected. Directors may not realize they are being asked to formally vote, or they may spend time discussing something that only requires acknowledgment. Clarity on type drives meeting efficiency.

9. **Always include competitive and market context, even in strong quarters.** The board approved a strategy based on assumptions about the market. They need to know whether those assumptions are holding. In a strong quarter, the temptation is to skip competitive context because results are good. Skipping it deprives the board of the information they need to assess whether the next quarter will also be strong.

10. **Always apply the business judgment rule standard when writing for boards with legal or fiduciary risk exposure.** The business judgment rule protects directors from liability when they make decisions in good faith, with adequate information, and without self-dealing. The board narrative is evidence of "adequate information." For material decisions -- capital allocation, executive compensation, major contracts, M&A -- the narrative must document what the board was told, not just what management recommended. Include the basis for the recommendation, alternatives considered, and why the recommended course was selected.

11. **For pre-IPO companies, treat the board narrative as a discoverable document.** Litigation, regulatory investigation, or IPO due diligence can bring board packages into discovery. Avoid legal conclusions, speculation about competitor motives, aggressive valuations without basis, or statements about regulatory compliance that have not been verified by counsel.

12. **Never exceed 8 pages for the narrative body, excluding appendices.** Detailed financials, legal agreements, technical documentation, and market research belong in appendices or board deck slides. The narrative is the synthesis layer. If it exceeds 8 pages, cut -- board members will read a tight 5-page document; many will skim a 12-page document and miss the critical items.

---

## Edge Cases

**The company missed plan by more than 20%.**
A miss of this magnitude requires a different structure than a standard quarterly update. Lead the company summary with the miss, stated plainly in percentage and dollar terms. The financial narrative must devote its first paragraph entirely to root cause analysis -- not recovery plans, not silver linings, just the honest diagnosis of what went wrong. Use a root cause decomposition: identify each contributing factor, its estimated dollar impact, and whether it was within or outside management's control. The recovery plan goes in a separate, clearly labeled section immediately after the financial narrative. Present the revised forecast for the next quarter alongside the original plan so the board can see whether the miss is a timing issue or a structural revision. If it is structural, the board needs to discuss whether the strategic plan requires amendment. Flag this explicitly as a discussion item in Section 6.

**One or more board members are attending their first meeting.**
Do not restructure the main narrative for a new director. New board members are expected to get up to speed; restructuring the core document disadvantages experienced directors who rely on the established format. Instead, add Appendix B (Company Context for New Board Members) as described in the output format. Before the meeting, the company secretary or Chief of Staff should arrange a separate onboarding call with the new director to walk through the strategic plan, the company's history, and the metrics framework. Note in the distribution header that Appendix B is included for new directors.

**The board meeting is covering a sensitive personnel matter (executive departure, performance issue, or compensation dispute).**
Under no circumstances should personnel matters appear in detail in the written board narrative. Note the topic in Section 6 with the label "Executive session requested" and a brief, factual descriptor (e.g., "Executive session: CFO succession planning"). All substantive discussion happens verbally in executive session, with only the board members present and no management. The company secretary records only the outcome of executive session, not the discussion. If a board vote on a personnel matter is required, the resolution is drafted before the meeting by legal counsel and approved in session.

**The company is in active fundraising, sale process, or pre-IPO preparation.**
Add a dedicated section between Strategic Highlights and Competitive Context labeled "Capital Markets Update" or "Transaction Update." In this section, state the current status of the process, the timeline, and the key metrics that prospective investors or acquirers are evaluating. For a fundraising process, include the valuation range management is targeting, the stage of investor conversations, and any diligence items outstanding. Be precise about runway -- a company in an active raise with 6 months of runway is in a different risk position than one with 18 months. If the transaction involves potential board changes (new investor directors, restructured board), flag this as a discussion item in Section 6. All materials related to an M&A process should be reviewed by legal and investment banking counsel before distribution.

**The company has restated financial results or discovered a material accounting error.**
This requires immediate notification to the board -- do not wait for the next regularly scheduled meeting. Draft a special-purpose board communication (not a quarterly narrative) describing the nature of the error, the periods affected, the corrected figures, and the internal controls failure that allowed the error to occur. Include the remediation plan for the internal controls failure. Flag any SEC reporting or lender covenant implications. For public companies, this will require coordination with external auditors, audit committee counsel, and the SEC. The board narrative in this scenario is a factual record of what management knew and when -- write with this standard in mind.

**The company's business model or key metrics definitions have changed since the last board meeting.**
Changes to how the company measures and reports its business are material governance events. If the company is changing a metric definition (e.g., shifting from gross ARR to net ARR, or redefining what constitutes an "active customer"), the board narrative must explicitly acknowledge the change, state why the definition was changed, and restate prior-period figures on the new definition so trend analysis is meaningful. Do not silently change metric definitions -- this is how boards and later auditors discover that the company was presenting a distorted picture.

**Results are strong and there is genuinely little negative to report.**
The instinct in this scenario is to write a longer, more celebratory narrative. Resist it. Keep the document tight (3-4 pages). Acknowledge the strong results in the company summary in one sentence. In the financial narrative, briefly explain the drivers of the outperformance. Then shift the narrative weight toward the forward-looking sections: What risks could interrupt the current trajectory? What strategic decisions are approaching that the board should be thinking about? What assumptions in the approved plan are proving correct, and which are still unvalidated? Boards that receive strong updates where management has not thought critically about forward risks come to doubt management's ability to see around corners.

**The company operates in multiple currencies or geographies and FX movements have materially affected reported results.**
Add a line in the financial performance table for "Revenue (constant currency)" alongside reported revenue. In the financial narrative, explicitly state what the reported revenue growth rate is vs. the constant currency growth rate. For example: "Reported revenue grew 12% year-over-year, but on a constant currency basis, growth was 19%; the 7-percentage-point gap reflects the strengthening of the USD against the EUR and GBP in the quarter." Boards -- especially those with independent directors from financial services backgrounds -- will ask about currency effects if you do not address them proactively. Flag currency risk in the risk table as Ongoing if FX volatility is expected to persist.

---

## Example

**User input:** "I need to write a board narrative for our Series B SaaS company. Q2 was tough -- we did $3.1M in revenue vs. $3.8M plan, and we lost two enterprise accounts. Burn is $520K/month and we have $7.8M in the bank. Gross margins are good at 76%. We need board approval to reduce headcount by 10% to extend runway. There's also a new competitor, Vortex Analytics, that just raised a $30M Series B and is pricing aggressively."

**Output:**

---

# Board Update: Meridian Software

**Period:** Q2 2025 (April 1 -- June 30, 2025)
**Prepared by:** Sarah Chen, CEO; Marcus Okafor, CFO
**Board meeting date:** July 18, 2025
**Distribution:** Board members only

---

## Company Summary

Q2 revenue of $3.1M was 18% below the $3.8M plan, driven by the loss of two enterprise accounts (Atlas Group and Pinnacle Corp, combined $480K ARR) and a broader enterprise pipeline slowdown attributed to extended procurement cycles, while gross margin held at 76% and cash stands at $7.8M representing 15 months of runway at the current burn rate. The entry of Vortex Analytics -- which closed a $30M Series B in May and has begun pricing its product at 35% below market -- represents a structural shift in the enterprise competitive environment that the approved strategic plan did not anticipate at this intensity. Management is seeking board approval for a 10% workforce reduction that would extend runway to 21 months and sharpen focus on the mid-market segment where Vortex's current product capabilities are weakest.

---

## 1. Financial Performance

### Results vs. Plan

| Metric | Plan | Actual | Variance ($) | Variance (%) | Commentary |
|--------|------|--------|-------------|-------------|-----------|
| Revenue | $3.8M | $3.1M | -$700K | -18% | Two enterprise churns ($480K ARR) plus pipeline slowdown ($220K) |
| Gross margin | 74% | 76% | -- | +2pp | Infrastructure cost optimization from Q1 project completed |
| Net burn | $480K/mo | $520K/mo | -$40K/mo | -8% | Engineering headcount above plan; see cost narrative |
| Cash position | -- | $7.8M | -- | -- | 15 months at current burn; 21 months post-restructuring |
| ARR | $14.2M | $13.1M | -$1.1M | -8% | Net churn of $480K plus new ARR below plan by $620K |
| Net revenue retention | 105% | 94% | -- | -11pp | Two enterprise churns drove below-100% NRR for first time |

### Financial Narrative

**Revenue:** The $700K revenue miss decomposes into two distinct causes. First, two enterprise accounts -- Atlas Group ($310K ARR) and Pinnacle Corp ($170K ARR) -- churned in May and June respectively. Atlas cited a decision to build internally (a signal of the end of their growth phase, not a product quality issue), while Pinnacle explicitly referenced Vortex Analytics' pricing in their off-boarding survey. Together these represent $480K of the $700K miss. The remaining $220K shortfall reflects a broader enterprise pipeline slowdown: 6 of our 11 Q2 enterprise opportunities extended their evaluation timelines by an average of 47 days, with buyers citing Q2 budget scrutiny and procurement freezes. Three of those deals are now tracking for Q3 close with verbal commitments in hand; the other three remain in active evaluation. Mid-market revenue of $1.4M came in $30K below plan -- effectively on track -- and continues to show predictable conversion patterns.

**Margins and costs:** Gross margin of 76% exceeded the 74% plan by 2 percentage points, the result of the Q1 infrastructure optimization project completing a month ahead of schedule. This improvement represents approximately $62K in annual savings that will persist. Operating burn of $520K/month was $40K above the $480K plan, driven by two factors: the engineering team ended Q2 at 34 headcount vs. the 31-person plan (three hires that closed earlier than planned), and recruiting costs for those hires ($47K in agency fees) were not in the plan. Both items will be addressed in the restructuring proposal.

**Cash and runway:** Cash position of $7.8M at June 30 represents 15 months of runway at the current $520K monthly burn rate. We note three upcoming cash events not reflected in monthly burn: Q3 bonus accruals payable in August ($185K), our annual D&O insurance renewal in September ($140K), and a lease deposit for the Austin office expansion we paused in April ($0 -- the expansion has been formally cancelled, so no cash outlay). If the board approves the proposed restructuring, we project monthly burn to decrease to $370K within 60 days (accounting for severance), extending runway to approximately 21 months and providing meaningful capital cushion for the next 6-12 months of execution.

---

## 2. Strategic Highlights

- **Mid-market segment on plan at $1.4M in Q2:** Self-serve trial conversion improved to 18% from 14% in Q1 following the onboarding redesign shipped in April. Mid-market is proving to be a more predictable revenue engine than enterprise, which informs the proposed reallocation of resources in the restructuring plan.

- **Platform integrations: Salesforce and HubSpot connectors shipped in May:** Both connectors are now generally available. Early data shows customers using either integration have 23% lower churn rates and 14% higher expansion ARR. This validates the integration strategy approved in January and strengthens our case against Vortex, which has announced but not yet shipped integrations.

- **Customer Advisory Board established with 8 enterprise customers:** The CAB met twice in Q2. Feedback confirmed that our real-time processing advantage and audit trail capabilities are significant differentiators in regulated industries (financial services, healthcare). This shapes the segmentation recommendation in Section 6.

---

## 3. Competitive and Market Context

**Market conditions:** Enterprise software procurement cycles extended materially in Q2. Our sales team tracked average enterprise evaluation cycles at 91 days in Q2, up from 68 days in Q1 and 55 days in Q4 2024. This appears to be a broader market condition: our enterprise pipeline from three mutual connections at comparable Series B SaaS companies reports similar slowdowns. This is a timing headwind, not a loss of demand, but it has real cash flow implications that the restructuring proposal addresses.

**Competitive landscape:** The significant development this quarter is Vortex Analytics closing its $30M Series B in May. Vortex launched a competitive product in February and has been pricing at approximately 35% below market rates on annual contracts. In Q2, Vortex appeared in three of our enterprise competitive evaluations (up from zero in Q1). We won two of those three (including Ridgeline Financial, $220K ACV, which cited our audit trail as the deciding factor) and lost one (Pinnacle Corp, as noted above). Vortex's $30M raise gives them the capital to sustain aggressive pricing for an estimated 24-30 months at typical Series B burn rates, which means this is not a temporary pricing challenge.

**Strategic implications:** Our January strategic plan assumed a fragmented competitive landscape with no well-funded direct competitor. That assumption is now invalid. Vortex's product, at its current maturity, is competitive in the general enterprise analytics segment but lacks the real-time processing capabilities and regulatory compliance features that our Customer Advisory Board identified as critical in financial services and healthcare verticals. Management's proposed response is to accelerate segmentation toward regulated industries -- where our feature differentiation is highest and Vortex's product is weakest -- rather than competing on price in the general enterprise segment. This reallocation is the strategic rationale behind the workforce restructuring proposal in Section 6, which reduces the general enterprise sales team and increases the vertical-focused sales motion.

---

## 4. Key Risks

| # | Risk Description | Category | Probability | Impact | Mitigation | Status |
|---|-----------------|---------|-----------|--------|-----------|--------|
| 1 | Vortex Analytics pricing pressure accelerates enterprise churn and reduces new logo win rates | Market | High | High -- could reduce enterprise win rate from 67% to 40% | Segment focus on regulated industries; accelerate integration differentiation; do not match Vortex pricing | New |
| 2 | Runway compression if restructuring is delayed or blocked | Financial | Medium | High -- every month of delay costs $520K vs. $370K post-restructuring | Board approval sought at this meeting; severance plan prepared | New |
| 3 | Key engineer attrition during restructuring announcement | People | High | Medium -- 4 of 34 engineers are classified critical, 2 of whom are known flight risks | Retention packages for 4 critical engineers prepared; announcement sequencing planned to minimize uncertainty | New |
| 4 | Extended enterprise procurement cycles persist through Q3 | Market | Medium | Medium -- affects Q3 revenue predictability; $1.1M in Q3 pipeline is timing-dependent | Three deals have verbal commitments; maintaining weekly executive sponsor contact | Ongoing |
| 5 | Customer concentration risk -- top 3 customers represent 28% of ARR | Financial | Low | High -- loss of any top-3 customer is a material revenue event | Executive-level relationships maintained; QBRs completed with all three in June; all three renewed or expanding | Ongoing |

**High-priority risk narrative -- Vortex Analytics competitive risk:** Vortex now has the capital and market presence to represent a sustained competitive threat, not a temporary new entrant dynamic. The High/High rating reflects both the probability (they are appearing in our pipeline deals and winning on price) and the potential impact (if we cannot arrest the enterprise win rate decline, our path to Series C is materially compromised). Management's proposed mitigation -- focused segmentation into regulated industries -- is the right strategic response, but it takes 2-3 quarters to execute. In the near term, we expect competitive pressure to continue and have built that assumption into the Q3 forecast range below. Board guidance on whether to invest in a direct pricing response or hold the differentiation strategy would be valuable at this meeting.

**Risks resolved since the last board meeting:** The GDPR data residency compliance project, which appeared as a High/High risk in Q1, was resolved in May with the deployment of EU-region data isolation. Three European enterprise prospects that had paused evaluations have re-engaged.

---

## 5. Forward Outlook

**Q3 2025 forecast:** Revenue of $2.9M -- $3.4M. The range reflects meaningful uncertainty driven by the 6 enterprise deals with verbal commitments but unsigned contracts. Gross margin is expected to hold at 75-76%. Burn is expected to decrease from $520K to approximately $370K by August, assuming board approval of the restructuring today and a 60-day implementation timeline (primarily driven by legal notice requirements in California and New York where most affected employees are located).

**Key forecast assumptions:**

| # | Assumption | Basis | If This Assumption Is Wrong |
|---|-----------|-------|---------------------------|
| 1 | Three enterprise deals with verbal commitments close in July | Signed LOIs from Ridgeline and Thornton; verbal from Cascade | Revenue risk of -$340K if all three slip to Q4; -$220K if two close |
| 2 | Board approves restructuring at today's meeting | Management recommendation supported by financial analysis | Every month of delay costs $150K in additional burn vs. plan |
| 3 | No additional enterprise churns in Q3 | Current churn risk flag: one customer (Bluewater, $140K ARR) on a 90-day PIP | Bluewater churn would reduce Q3 revenue by $35K and ARR by $140K |
| 4 | Vortex does not launch additional enterprise features before Q3 end | Their public product roadmap has no Q3 enterprise feature releases announced | If they ship competitive real-time processing, our differentiation advantage narrows sooner than the 2-3 quarter timeline we are assuming |

**Upside scenario ($3.4M):** All three LOI/verbal deals close in July, the Bluewater PIP succeeds, and one of the three remaining enterprise pipeline opportunities moves to contract by September. Probability estimate: 25%.

**Downside scenario ($2.9M):** One of the three committed deals slips to Q4 and Bluewater churns. At this revenue level and with restructuring complete, burn is approximately $410K/month (restructuring savings partially offset by $40K/month in ongoing severance amortization) and cash runway extends to approximately 19 months. Probability estimate: 30%. Base case probability ($3.1-3.2M): 45%.

---

## 6. Board Approvals and Discussion Items

| # | Item | Type | Management Recommendation | Supporting Materials |
|---|------|------|--------------------------|---------------------|
| 1 | Workforce restructuring -- reduction of 12 positions (10% of headcount) across enterprise sales (5 positions), general and administrative (4 positions), and engineering non-critical roles (3 positions) | Approval | The board hereby authorizes management to implement the workforce restructuring plan as described in the attached plan document, including severance payments in accordance with the severance policy adopted in March 2024 | Restructuring plan and financial model, Appendix C |
| 2 | Vertical segmentation strategy -- reallocation of go-to-market resources toward financial services and healthcare verticals in response to Vortex Analytics competitive entry | Discussion | Management seeks board guidance on the proposed reallocation before finalizing Q3 OKRs. Specifically: does the board support exiting the general enterprise market, or does it prefer a hold-and-defend approach pending further Vortex data? | Competitive analysis, Appendix D |
| 3 | Q3 operating budget revision -- updated revenue forecast and expense plan reflecting restructuring | Approval | The board hereby approves the revised Q3 operating budget as submitted, incorporating restructuring-adjusted headcount and burn assumptions | Revised budget, Appendix E |

**Executive session requested:** Compensation committee: CEO and CFO compensation review in the context of the restructuring and revised company performance. Duration estimate: 20 minutes. Attendees: Independent directors only.

---

## Appendix C: Workforce Restructuring Plan Summary

*(Full plan document attached separately)*

**Total positions affected:** 12 (10% of 120 total headcount)
**Breakdown:** 5 enterprise sales (general segment AEs and one sales manager), 4 G&A (2 finance operations, 1 HR coordinator, 1 office manager), 3 engineering (non-critical individual contributors)
**Severance:** Per the March 2024 severance policy -- 4 weeks base for employees under 2 years, 6 weeks for employees 2-5 years. Total estimated severance liability: $187K.
**Timeline:** Notification on July 22 (4 days after board approval); all positions exited by August 5.
**Burn impact:** Monthly burn decreases from $520K to approximately $370K effective August (one-month lag for payroll processing and benefits wind-down).
**Runway impact:** Extends runway from 15 months to approximately 21 months at revised burn rate.
**Retention risk mitigation:** 4 critical engineers and 2 senior mid-market account executives have been identified for retention packages (total cost: $95K in accelerated equity, already within the board-approved equity reserve).
