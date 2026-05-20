---
name: investor-update-email
description: |
  Writes monthly or quarterly investor update emails with key metrics, highlights,
  lowlights, asks, and forward outlook in a concise format that maintains investor
  confidence and engagement. Use when the user needs to update investors, angels,
  or venture partners on company progress. Do NOT use for board narratives (use
  `board-update-narrative`), stakeholder updates (use `stakeholder-update`), or
  fundraising pitch materials (those require a different skill set).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "email writing entrepreneurship"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Investor Update Email

## When to Use

Use this skill when the user needs to write a periodic update email to their investor base -- angels, seed funds, institutional VCs, or LP co-investors -- to communicate company progress, financial health, and near-term priorities.

**Use this skill when:**
- A founder needs to write a monthly or quarterly investor update email for their startup's investor base (angels, pre-seed, seed, or Series A+ investors)
- A founder has just closed a round and needs to establish the first update cadence, setting the tone and template for all future updates
- The company has experienced a difficult period (missed targets, unexpected churn, team changes) and the founder needs to communicate bad news with integrity and a clear response plan
- The company is approaching a fundraise and needs to prime investors with a "fundraising update" section that builds momentum and surfaces warm leads from the existing cap table
- An operator (COO, CFO, or Chief of Staff) has been delegated responsibility for producing the investor update and needs a structured framework to produce it without the CEO writing from scratch each time
- A founder wants to convert a disengaged investor base -- investors who never respond or engage -- by redesigning their update format to be more scannable and compelling
- The reporting period included a major event: a pivot, a key hire or departure, a contract win or loss, a regulatory development, or a competitor move

**Do NOT use this skill when:**
- The user needs to prepare a board meeting narrative with governance items, committee updates, or formal resolutions -- use `board-update-narrative` instead, which covers fiduciary framing and board-appropriate format
- The user needs a cross-functional stakeholder communication covering employees, partners, and advisors in a single document -- use `stakeholder-update` instead
- The user needs to create a pitch deck, investor memo, or fundraising narrative to approach new investors -- that is a distinct persuasion document requiring a different structure and skill set
- The user wants a full business report or operational analysis with department-level deep dives, financial statements, or audit-ready information
- The user is a public company or semi-public entity subject to Regulation FD or SEC disclosure rules -- investor communications for public companies require legal review and this skill does not address those compliance requirements
- The user wants to write a fund-level LP update (for a VC fund reporting to its limited partners) -- that requires a portfolio roll-up format, TVPI/DPI/RVPI metrics, and fund accounting context that is outside this skill's scope

---

## Process

### Step 1: Gather the Reporting Context

Before writing a single word, collect the structured inputs that separate a high-quality update from a generic one. Ask the user for the following, and do not proceed with placeholders if critical fields are missing.

- **Company identity and stage:** Company name, founding date, current stage (pre-revenue, pre-product-market fit, scaling, profitable), last round raised and when, total capital raised to date
- **Reporting period:** Month or quarter, with precise dates (e.g., "January 2026" or "Q4 2025")
- **Audience composition:** How many investors are on the list, their tier (lead VC, angel, advisor), and whether there are any sensitive dynamics (e.g., an investor the founder is avoiding, a bridge investor who is not a full shareholder)
- **Cadence history:** Is this the first update ever, or has the company been sending updates? If existing, what format have they used before? Consistency matters more than perfection.
- **The three financial anchors:** Current MRR or ARR (or equivalent revenue metric), cash on hand, and months of runway at current burn rate -- these are non-negotiable inclusions
- **Business-stage-appropriate operating metrics:** For SaaS, this is MRR, net revenue retention (NRR), churn, CAC, and pipeline. For marketplace, it is GMV, take rate, buyer/seller counts, and repeat rate. For consumer, it is DAU/MAU, retention cohorts, and LTV. For deep tech or hardware, it is technical milestones and contract status. Match the metric set to the business model.
- **Top 2-4 highlights and 1-3 lowlights:** Ask the founder to separate what actually happened from why it matters. "We closed Acme Corp" is not a highlight; "We closed Acme Corp as our first F500 customer, proving enterprise ICP fit" is.
- **Specific asks:** What do they actually need from investors right now? Introductions (to whom, for what purpose), hiring referrals (role, seniority, experience), customer leads (company profile, buyer persona), or strategic advice on a named decision
- **Forward outlook:** What are the 2-4 priorities for next period? What metrics define success? Are there any scheduled events (product launch, fundraise close, contract renewal)?

### Step 2: Diagnose the Update Type and Adjust Tone

Not all investor updates are the same. Before writing, classify which type of update this is and calibrate tone accordingly. Each type has a distinct structural emphasis.

- **Standard cadence update (most common):** Metrics-first, balanced highlights/lowlights, clean asks. Tone is matter-of-fact and efficient. Investors are busy; get to the point in the first three sentences.
- **Momentum update (strong month, preparing to raise):** Lead with the best metric trend but do not oversell. Add a fundraising update section. The goal is to make investors feel they are seeing a company whose next round will be competitive. Avoid the "we're crushing it" tone -- show, don't tell.
- **Crisis or adversity update (bad month, major challenge):** Lead with the honest assessment in the first paragraph before the metrics table. Do not bury the bad news. Present a named, specific response plan -- not vague reassurances. Tone is sober, candid, and confident without being defensive. Investors fund founders who navigate hard moments well.
- **Pivot or strategy change update:** Dedicate a separate section to the pivot. Explain the data that drove the decision, what you are stopping, and what you are starting. Use language that frames the change as a disciplined decision, not a failure. Include the specific metrics you will track in the new direction.
- **First-ever update after closing a round:** Set format expectations explicitly. Tell investors the cadence (monthly vs. quarterly), how they can respond or reach you, and what kind of help is most useful. This is the highest-leverage update to get right because it establishes the relationship template.

### Step 3: Build the Metrics Dashboard

The metrics dashboard is the most-read section of any investor update. Investors scan it before reading anything else. It must follow these standards.

- **Select 4-7 metrics maximum.** More than 7 metrics signals you have not decided what matters. Fewer than 4 is insufficient for pattern recognition across updates.
- **Always include cash and runway as the final row.** Even if the company is well-capitalized, this is a non-negotiable trust signal. Investors who do not see cash/runway assume the founder is hiding something.
- **Show three columns:** Prior period value, current period value, and percentage or absolute change. Never show only the current value -- context is everything. For runway, show both dollar amount and months remaining.
- **For pre-revenue companies:** Replace revenue rows with product and user metrics. Appropriate substitutes include: users in beta (and qualitative NPS or retention), LOIs or signed pilots (with dollar value if possible), technical milestones achieved, and hiring progress. Still show burn rate and runway prominently.
- **Flag metrics that changed definition.** If you changed how you calculate a metric (e.g., switched from gross MRR to net MRR), add a footnote. Investors will notice the discontinuity and trust you more for explaining it.
- **Use consistent formatting across every update.** Investors build pattern recognition over 12-24 months. Changing column order or metric names without explanation creates confusion and erodes trust.
- **Annotate anomalies inline.** If churn spiked, add a small asterisk and note in the table itself: "* 5.0% -- see Challenges." Do not make investors hunt for the explanation.

Key metric frameworks by business model:
- **B2B SaaS:** MRR/ARR, MoM growth rate, net revenue retention (NRR), gross churn, CAC, pipeline value, logo count
- **Marketplace:** GMV, take rate, buyer count, seller count, repeat purchase rate, net revenue
- **Consumer/App:** DAU, MAU, D1/D7/D30 retention, LTV, CAC, revenue or ARPU
- **Hardware/Deep tech:** Technical milestone progress, units shipped or in production, key contract status, IP filings, regulatory progress
- **Services/Agency:** Revenue, headcount, utilization rate, client count, pipeline

### Step 4: Write the Highlights and Challenges Sections

This section is where founder voice and judgment come through. Apply these principles precisely.

- **Ratio:** Aim for 2-4 highlights and 1-3 challenges. The ratio should roughly match reality. A great month might have 4 highlights and 1 challenge. A hard month might have 2 highlights and 2 challenges. Never send an update with zero challenges.
- **Highlight structure:** Each highlight should follow the format: **[What happened] -- [Why it matters / what it signals].** "Closed 3 enterprise deals" is incomplete. "Closed 3 enterprise deals totaling $22K MRR, two of which came through inbound from the free tier -- signaling the PLG motion is beginning to work" is complete.
- **Challenge structure:** Each challenge must follow the format: **[What happened] -- [Root cause or hypothesis] -- [What you are doing about it].** Investors forgive problems. They do not forgive founders who present problems without a response plan.
- **Avoid performative honesty.** Some founders include token "challenges" that are not really challenges (e.g., "We had too many inbound leads to handle"). Real lowlights are real. If you cannot think of a genuine challenge, you are not being honest with yourself or your investors.
- **Order matters:** Put the highlight that is most relevant to investor interest first. For a company approaching a Series A, that is revenue growth. For a company focused on product-market fit, that is retention or NPS. Lead with what investors are watching most closely.
- **Limit narrative.** Each highlight or challenge gets 1-3 sentences. If more context is needed, link to a supporting document rather than expanding the email body. The investor update is the executive summary, not the analysis.

### Step 5: Craft Specific, Actionable Asks

The asks section is the highest-ROI part of the investor update, and it is almost universally done badly. Vague asks get ignored; specific asks get acted on.

- **Name the person type, not just the function.** "Introductions to potential enterprise customers" is useless. "Introduction to the VP of Operations at a mid-market manufacturer with $100M-$500M revenue who is evaluating supply chain analytics tools" is actionable.
- **Limit to 1-4 asks per update.** More than four asks signals you have not prioritized. Investors will act on zero of them. One to two well-formed asks get real responses.
- **Match the ask to the investor's network and capabilities.** If you have a consumer-focused angel investor, do not ask them for enterprise SaaS introductions. Segment your asks by investor type if you are sending to a mixed audience, or send customized versions to key investors for high-stakes asks.
- **For hiring asks:** Include the role title, 2-3 must-have experience criteria, what makes the role compelling, and how to refer someone (email address, Ashby/Greenhouse link, or a simple "reply to this email"). The friction of figuring out how to help is the #1 reason investors do not follow through.
- **For customer intro asks:** Specify the buyer profile (title, company size, industry), the use case you are solving for them, and what a successful intro looks like (30-minute discovery call with the founder).
- **For capital asks:** If you are raising or considering bridging, be explicit. "We are beginning to explore our Series A. If you have relationships at Tier 1 funds with fintech focus, we would love warm intros" is clear. Ambiguity about fundraising status is one of the most trust-damaging things a founder can do.

### Step 6: Write the Forward Outlook

The forward outlook section is short -- 3-5 sentences or 3-5 bullet points -- but it is what separates a reactive founder from a strategic one.

- **Name 2-4 specific priorities for the next period.** Not themes or aspirations -- specific, measurable initiatives. "Grow revenue" is not a priority. "Hit $55K MRR by February 28 by converting 5 qualified pipeline deals" is a priority.
- **Define what success looks like.** Give investors a benchmark they can reference in the next update to assess whether you hit your goals. This creates accountability and demonstrates you operate with measurable targets.
- **Flag known risks or uncertainties.** If there is a key renewal coming up, a regulatory decision, a competitive product launch, or a team change that may affect results, mention it here. Investors who are surprised by events that were knowable lose confidence.
- **Keep it forward-looking, not backward.** Do not repeat what you already said in the highlights section. The outlook section should be entirely about what comes next.
- **For companies approaching a fundraise:** Include the fundraise timeline and status in the outlook. If you are planning to start in 60 days, say so now so investors have lead time to make introductions and prepare follow-on decisions.

### Step 7: Draft and Polish the Email Structure

Assembly and presentation determine whether a well-crafted update actually gets read.

- **Subject line format:** `[Company Name] -- [Month or Q# Year] Investor Update` -- always include the date in the subject line so investors can find it in their archives. Avoid clever subject lines. Clarity beats creativity.
- **Opening line:** Write a single executive-summary sentence that captures the most important thing that happened this period. This is the line that appears in email preview panes. Make it count. Example: "MRR grew 14% to $48K on 3 new enterprise deals; churn spiked and is our top priority."
- **Word count target:** 350-550 words for the email body. Under 350 is too thin to build confidence. Over 550 starts losing investors. If more detail is genuinely necessary, link to a supplemental document.
- **Formatting:** Use headers (`###`) to separate sections. Use a table for metrics. Use bold for key numbers and named milestones. Never write investor updates in dense paragraphs -- they will not be read.
- **Tone:** Confident but grounded. First person ("I" or "we") throughout. No corporate jargon, no startup clichés ("crushing it," "hockey stick," "10x"). Factual language with selective enthusiasm for genuine wins.
- **Signature:** Name, title, company name, and a way to respond (reply to the email is standard; some founders add their direct phone for lead investors).
- **Proofread specifically for:** Numerical consistency (does the table match the narrative?), metric definitions (are you using "MRR" when you mean "ARR"?), and ask specificity (could an investor act on every ask right now?).

### Step 8: Review Against the Investor Trust Framework

Before finalizing, run a final check using the investor trust framework. This is the mental model sophisticated founders use.

- **Transparency test:** Would an investor feel misled in hindsight if a problem that existed this month becomes visible next month? If yes, add it to challenges now.
- **Actionability test:** Can every single ask be acted on in under 5 minutes by someone who wants to help? If no, rewrite the ask.
- **Consistency test:** Are the same metrics presented in the same format as the prior update? If not, is the change explained?
- **Signal test:** What signal does this update send about the quality of the founding team? Does it demonstrate clear thinking, operational discipline, and honest self-assessment? Or does it read like a PR document?
- **Cash test:** Is cash and runway clearly visible without hunting? If it takes more than 5 seconds to find the burn rate, restructure the table.

---

## Output Format

The complete investor update email follows this template. All bracketed fields must be replaced with real data. Do not leave any field as a placeholder in the final output.

```
Subject: [Company Name] -- [Month / Q# Year] Investor Update

Hi [First names separated by commas, or "all" for large lists],

[One-sentence executive summary of the period. Lead with the most important 
number or event. Acknowledge the biggest challenge immediately if it is 
significant. 2-3 sentences max before the metrics table.]

---

### Key Metrics

| Metric                    | [Prior Period]   | [Current Period] | Change          |
|---------------------------|------------------|------------------|-----------------|
| MRR / ARR                 | $[X]             | $[X]             | +/-[X]%         |
| [Primary growth metric]   | [value]          | [value]          | +/-[X]%         |
| [Retention/health metric] | [value]          | [value]          | +/-[X]pp or %   |
| [Business model metric]   | [value]          | [value]          | +/-[X]          |
| [Team or pipeline metric] | [value]          | [value]          | +/-[X]          |
| Cash / Runway             | $[X]M / [X]mo    | $[X]M / [X]mo    | [+/-X] months   |

*[Any footnote explaining a metric change or anomaly -- delete if not needed]*

---

### Highlights

- **[Specific win with context]:** [1-2 sentences: what happened + why it matters 
  or what it signals about the business]
- **[Second win with context]:** [1-2 sentences]
- **[Third win if applicable]:** [1-2 sentences]

---

### Challenges

- **[Specific challenge with root cause]:** [What happened, why you think it 
  happened, and what you are doing about it -- 2-3 sentences]
- **[Second challenge if applicable]:** [Same structure]

---

### Asks

- **[Role/type of ask]:** [Specific request with enough detail that an investor 
  can act without asking a follow-up question -- who you want to meet, why, 
  and how to connect them]
- **[Second ask]:** [Same specificity standard]
- **[Third ask if applicable]:** [Same specificity standard]

---

### Looking Ahead

[2-4 sentences or bullets covering the 2-4 specific priorities for next period, 
the metric targets that define success, and any known risks or scheduled events 
investors should be aware of. If a fundraise is planned, state it explicitly here.]

---

[Optional: Fundraising Update -- only include if actively fundraising or 
within 90 days of starting a raise]

### Fundraising Update

[1 paragraph: Target raise amount, structure (priced round, SAFE, bridge), 
current status (soft-circling, term sheet conversations, signed lead), 
timeline, and specifically how investors on this list can help -- 
warm intros to named funds or types of funds.]

---

Thank you for your continued support. Reply to this email anytime -- I read 
every response.

[Founder Name]
[Title]
[Company Name]
```

---

## Rules

1. **Never omit cash and runway from the metrics table.** This is the single metric every investor tracks regardless of stage. A founder who hides or omits burn rate signals either incompetence or evasion. Include it as the final row of every metrics table without exception.

2. **Never send an all-positive update.** Updates with no lowlights are not trusted. Investors who have backed multiple companies know that every company has problems every month. An update without challenges reads as a PR document, not an operational report. Include at least one genuine challenge with a named response.

3. **Never use vague asks.** "We could use introductions to enterprise customers" will be ignored universally. Every ask must specify: who you want to meet (by title, company size, and industry), why you want to meet them, and what a successful response looks like (a specific email intro, a LinkedIn introduction, a referral to a job posting). If you cannot specify this, you have not done enough thinking about what you need.

4. **Never exceed 600 words in the email body.** Investor updates are skimmed, not read. At 600+ words, completion rates drop sharply. If supporting detail is needed, link to a Google Doc, Notion page, or data room. The email is the summary; everything else is the appendix.

5. **Never change your metric definitions without explaining the change.** If you move from gross MRR to net MRR, from monthly active users to weekly active users, or from contract value to recognized revenue, note the change with a brief explanation. Unexplained metric changes erode trust more than a declining metric does.

6. **Never skip a scheduled update without notice.** Silence is the worst signal in investor communication. If you miss a regular update without explanation, investors fill the silence with their worst assumptions. If a month must be skipped for operational reasons, send a two-sentence note acknowledging the skip and promising a combined update next period.

7. **Always present period-over-period comparisons, never snapshots alone.** A current MRR of $48K means nothing without knowing it was $22K six months ago or $47K last month. Context is the entire point of a metrics table. Show at minimum one period of comparison for every metric.

8. **Always match the metric set to the business model.** Using SaaS metrics (MRR, churn) for a marketplace or consumer company makes the company look like the founders do not understand their own business model. Use the metrics that practitioners in that business model actually use to evaluate health.

9. **Always lead the email body with an executive summary sentence that appears in preview panes.** The first sentence is read by every recipient regardless of whether they open the email fully. It must contain the most important signal of the period: the top metric trend and the top challenge. Founders who lead with pleasantries ("Hope everyone is having a great start to 2026!") are training their investors to skim.

10. **Always send on a consistent schedule.** Pick a day and week of the month (e.g., the first Tuesday of the month) and send every month without drift. Schedule predictability is itself a signal -- it tells investors that the company runs on systems and that the founder has operational discipline. Inconsistent send timing suggests inconsistent operations.

11. **For fundraising updates: never surprise investors.** If you are planning to raise a new round, introduce the topic in investor updates at least 60-90 days before you start formal conversations. Investors who learn about a round from a cold outreach email after receiving no warning in updates feel blindsided and are less likely to participate or help. Prime the narrative over multiple updates.

12. **Never use startup clichés or vague superlatives.** Phrases like "we're killing it," "hockey-stick growth," "game-changing," or "incredible momentum" reduce credibility. Show the numbers. The numbers speak. Founders who describe their own progress with marketing language are signaling that the numbers do not speak for themselves.

---

## Edge Cases

### Pre-Revenue or Pre-Product-Market Fit Company

For companies with no revenue, the metrics table must still convey momentum and business health. Use these substitutes:
- Replace MRR with users in beta (paying or free), weekly active users, or pilot count
- Add a "Milestones" row showing completion percentage of the current sprint or roadmap phase
- Include signed LOIs or pipeline conversations with dollar-range estimates
- Show NPS or qualitative retention data if formal cohort analysis is not yet possible
- Burn rate and runway remain mandatory -- often the most important metrics at this stage because they define how much time exists before the company must demonstrate traction or raise again
- Highlight any "signal" moments: customer quotes, unsolicited referrals, repeat engagement, enterprise pilots with named companies. These are the pre-revenue equivalent of revenue metrics.
- Avoid the temptation to fill the metrics table with vanity metrics (Twitter followers, press mentions, website visits) that do not correlate with business health.

### Delivering Predominantly Bad News

When the month has been genuinely hard -- missed targets across the board, a major customer loss, a team departure, a market contraction -- the standard format still applies, but the emphasis and opening shift:
- Open the email body with the honest summary, not the metrics table. Say what happened and acknowledge it directly before the data.
- Do not soft-pedal with euphemisms. "Revenue declined 18% due to two large churns" is honest. "Revenue faced some headwinds" is not.
- For each challenge, the response plan must be specific and time-bound. "We are addressing this" is not a response plan. "We are implementing a 90-day churn recovery playbook starting February 1, targeting re-engagement of 3 specific churned accounts" is a response plan.
- If the news is severe enough that it affects runway materially, include a direct statement about it and what options are being explored (bridge, cost reduction, accelerated fundraise).
- End the email with a section called "Why I'm Confident" or similar -- 2-3 sentences of genuine, evidence-based confidence (not cheerleading). Investors need to see that the founder is not in crisis mode and has a clear head.
- Offer a call. Add one line: "Happy to discuss on a call -- reply here or find time at [link]." This signals the founder is not hiding.

### Actively Fundraising a New Round

When a raise is underway or imminent, the investor update plays a dual role: it updates current investors and primes them to help.
- Add a "Fundraising Update" section between Challenges and Asks. This section should cover: target raise amount and structure (e.g., "$3M SAFE at $15M cap"), timeline ("targeting close by April 30"), current status ("2 term sheets, seeking co-investors"), and what current investors can do (specific fund names, types of funds, or angels you want introductions to).
- Current investors often become the best advocates for a new round if they are kept informed of momentum. A strong update during a raise -- showing metrics trending in the right direction -- can tip a co-investor's decision.
- Do not use the investor update to pressure current investors for follow-on capital directly. The ask is introductions and advocacy, not capital (unless you are running a direct follow-on process with existing investors, which should be handled in separate 1:1 conversations, not the group email).
- If a lead investor or term sheet has been secured, say so explicitly. "We have a signed term sheet with [Fund Type] and are filling out the round" creates urgency and social proof.

### Pivot or Major Strategic Shift

A pivot deserves its own dedicated section, not just a bullet point in challenges.
- Create a section called "Strategic Update" or "Company Direction Update" that appears before the standard metrics table.
- Structure it in three parts: (1) What we learned and what drove the decision -- 2-3 data points that made the pivot necessary, (2) What we are stopping or changing, and (3) What we are starting and the hypothesis we are testing.
- Include the specific metrics you will track in the new direction and the timeline for evaluating them. "We will know if this is working by [date] if [metric] reaches [threshold]."
- Address the emotional dimension briefly but directly. Pivots are hard decisions. Founders who acknowledge that fact -- without dwelling on it -- come across as mature and self-aware.
- Do not pivot silently. Some founders bury a pivot inside the "challenges" section with vague language. This is the most trust-damaging mistake possible. Investors funded a thesis; if that thesis is changing, they deserve a clear, dedicated explanation.

### Large Investor Base (25+ Recipients)

For companies with large cap tables -- common after multiple angel rounds or crowdfunding -- the investor update requires additional structural discipline.
- Send to the full list using the standard template. Do not attempt to personalize individual emails at scale; the time cost is too high and inconsistency creates confusion.
- For high-value investors (lead investors, board members, check sizes above a threshold you define), send a separate brief note before or after the group email with one additional personalized paragraph -- either a specific ask calibrated to their network, or a 1:1 call offer.
- Use a consistent "Reply-to" address and read every reply. Many founders on large lists stop reading responses. Any investor who replies is engaged and valuable; ignoring responses damages relationships.
- Consider using a dedicated investor update tool (email newsletter platforms with open tracking and response management). The data on who opens and engages is useful for understanding which investors are truly monitoring the company.
- Never address 25+ investors as "Dear investors" or use overly formal language. "Hi all" or "Hi team" is appropriate and maintains the personal relationship feel.

### Key Team Departure

When a co-founder, VP, or other key team member departs -- voluntary or otherwise -- the investor update is the right channel to communicate this.
- Do not attempt to hide or minimize the departure. Investors will find out, and discovering it through other channels destroys trust completely.
- State the departure factually in the Challenges section (or as a standalone "Team Update" section if the departure is significant): name, role, departure date, and reason (in one sentence, without excessive detail).
- Follow immediately with the continuity plan: who is covering the role in the interim, what the hiring timeline is, and what the company's capacity looks like in the short term.
- If the departure is a co-founder, this warrants its own paragraph before the metrics table -- it is a material event. Address it directly, with confidence and without deflection.
- For legal reasons, avoid detailed characterizations of the departure circumstances. One factual sentence suffices. Investors who want more context can ask in a 1:1 conversation.

### Missed Commitments From a Prior Update

When the prior update included forward-looking targets ("hitting $55K MRR by February 28") and those targets were not met, the follow-up update must address the miss directly.
- Open the "Looking Ahead" section's retrospective by naming the prior commitment and the actual outcome. "We targeted $55K MRR by February 28; we reached $51K."
- Provide a root-cause explanation (one sentence) without excuses. "We lost two pipeline deals that slipped to March due to procurement delays" is an explanation. "The market was challenging" is not.
- Revise the forward target with the same specificity. If the original target was set with insufficient information, say so and explain what you know now that you did not know then.
- Founders who consistently miss stated targets without clear explanation develop a credibility deficit that compounds over time. Consistently accurate forecasting -- or honest revision of forecasts with explanation -- is more valuable than always hitting optimistic projections.

---

## Example

**Input from founder:** "I need an investor update for February 2026. We're Meridian, a B2B SaaS company that helps mid-market logistics companies optimize last-mile delivery routes. We raised a $2.1M pre-seed 14 months ago from 6 angels and one seed fund (Brightshore Ventures). MRR went from $31K to $36K last month, so that's 16% growth. We now have 22 paying customers. Net revenue retention is 108% -- our best ever. But we had one big churn: Redstone Distribution churned their $4.2K/month contract because we didn't have a mobile app and their drivers won't use a desktop interface. We're actually building the mobile app now -- iOS beta in 8 weeks. We also just hired a VP of Engineering named Marcus Chen who starts March 1. He comes from Flexport. Cash is at $680K and we have about 9 months of runway. We're planning to start a Series A raise in May. I need an intro to logistics-focused VCs and I also need to hire a VP of Sales. We're targeting $42K MRR by end of March."

---

**Output:**

Subject: Meridian -- February 2026 Investor Update

Hi all,

February was our best growth month yet -- MRR hit $36K (+16%) and net revenue retention reached 108%. The shadow: we lost our second-largest customer due to a product gap we are actively closing. Full picture below.

---

### Key Metrics

| Metric                | January 2026    | February 2026   | Change         |
|-----------------------|-----------------|-----------------|----------------|
| MRR                   | $31,000         | $36,000         | +16%           |
| Paying customers      | 20              | 22              | +2             |
| Net revenue retention | 103%            | 108%            | +5pp           |
| Gross churn           | 0.8%            | 12.0%           | +11.2pp *      |
| Pipeline (qualified)  | $89K            | $114K           | +28%           |
| Cash / Runway         | $720K / 10 mo   | $680K / 9 mo    | -1 month       |

*Churn spike driven entirely by Redstone Distribution -- see Challenges*

---

### Highlights

- **108% net revenue retention -- company record.** Three existing customers expanded their contracts in February: two added routes, one upgraded to our Premium tier. NRR above 100% proves that customers who stay find increasing value in the product, which de-risks the Series A narrative significantly.
- **VP of Engineering hired: Marcus Chen starts March 1.** Marcus was a principal engineer at Flexport where he led the routing infrastructure team. He is joining specifically to accelerate the mobile app build and scale the engineering team from 3 to 6 by Q3. This hire was 4 months in the making and is the single most important thing we did in February.
- **Pipeline grew 28% to $114K.** Seven qualified opportunities are in active evaluation. Four are in verticals we have not penetrated before (cold chain logistics and regional grocery delivery), which validates that the routing optimization problem is not niche to general freight.

---

### Challenges

- **Redstone Distribution churned at $4.2K MRR.** This was our second-largest customer. The root cause is clear: their drivers refused to use a desktop-only interface and Redstone was unwilling to mandate it. We had known mobile was a gap since Q3 but prioritized other features. This is on us. Response plan: iOS beta in 8 weeks (Marcus's first project), driver-focused UX testing starting March 15 with two current customers who have flagged the same concern. We expect to re-engage Redstone in Q3 once the app is live.
- **9 months of runway concentrates our Series A timeline.** With a May start for fundraising, we have limited tolerance for slippage in the raise. If we do not have a term sheet by August, we will need to bridge or cut burn. We are preparing for this scenario but want to be transparent that the timeline is tight.

---

### Asks

- **Introductions to logistics-focused Series A VCs.** We are beginning warm outreach for a May raise. Specifically looking for introductions to partners at funds with logistics, supply chain, or industrial SaaS theses -- firms like Trucks VC, Greycroft's operations team, or similar. If you know a logistics-focused investor whose portfolio includes B2B SaaS, a warm email introduction would be enormously helpful. Reply here and I will send you a one-pager to forward.
- **VP of Sales referrals.** We need a VP of Sales who has closed mid-market logistics or supply chain software deals and has built a team from zero. The comp range is $160K-$185K base plus meaningful equity. This person will define our go-to-market strategy heading into the Series A. If you know someone, please reply or send them directly to jordan@meridian.com -- we are moving fast on this.

---

### Looking Ahead

March priorities: (1) Hit $42K MRR by March 31 by converting 3 of the 7 active pipeline deals -- two are in legal review and likely to close within 3 weeks. (2) Begin iOS beta with 5 driver users from existing customers by March 15, targeting a public launch in week 8. (3) Complete VP of Sales first-round interviews by March 22 and move to offer by April 1. (4) Finalize Series A materials -- deck, data room, and financial model -- by April 15 so we are ready to move at first meeting in May.

The Redstone churn was a real setback and the runway timeline is not comfortable. But the 108% NRR tells us that customers who stay love the product, the pipeline is the strongest it has ever been, and we now have Marcus to build what we should have built six months ago. We are heads down and building.

---

Thank you for your continued support. I read every reply to these updates -- if you have thoughts, introductions, or questions, respond directly here.

Jordan Lee
CEO, Meridian
