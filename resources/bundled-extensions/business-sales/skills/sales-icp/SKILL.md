---
slash_command: false
name: sales-icp
description: "Build a comprehensive Ideal Customer Profile (ICP) for any B2B business - firmographic, technographic, behavioral, pain-point, budget, and channel dimensions, plus negative ICP, 100-point scoring rubric, buyer personas, prospecting playbook, and a draft first-outreach message that inherits sales-outreach Phase 0 jurisdiction gates (refuses cold to DE/AT/CH; CAN-SPAM / CASL / GDPR / UWG aware). Templates and analytical tools only - not legal, marketing-compliance, or data-protection advice. Trigger phrases: 'build my ICP', 'ideal customer profile', 'who should I sell to', '/sales icp <description>', '/sales-icp <description>'. Also runs as the Strategy / ICP-fit dimension subagent under /sales prospect, translating prospect research into an actionable outreach plan scored against the user's ICP."
version: 1.1.0
as_of: 2026-05-03
author: Wayland Business Pack (port of zubair-trabzada/ai-sales-team-claude)
license: MIT
metadata:
  wayland:
    tags: [sales, ICP, ideal-customer-profile, sales-strategy, business, smb, can-spam, casl, gdpr, uwg]
    related_skills: [sales-prospect, sales-qualify, sales-research]
prerequisites:
  python_packages: []
attribution:
  lineage: "Wayland Business Suite (Original)"
---

> **Templates and analytical tools only - not legal, marketing-compliance, or data-protection advice.** ICP outputs feed downstream cold-outreach work (CAN-SPAM, CASL, GDPR, UWG §7, CCPA exposure) and should not include illegal targeting (e.g., do not target German B2B prospects for cold email - UWG §7 forbids it without prior express consent). Drafted first messages inherit the sales-outreach Phase 0 jurisdiction gate. Never instruct users to scrape LinkedIn, Glassdoor, G2, Capterra, or Crunchbase free-tier - those ToS forbid it; use official APIs or OSINT.

# Sales ICP

Build a precise, actionable Ideal Customer Profile that downstream skills (`sales-prospect`, `sales-qualify`) consume to score real companies. Runs standalone via `/sales-icp <description>` or as the Strategy / ICP-fit subagent during `/sales prospect`.

## When to Use

Trigger phrases: "build an ICP for <business>", "who should I sell to", "ideal customer profile for my <product>", `/sales icp <description>` (verb form), `/sales-icp <description>` (flat form).

Do NOT use for: scoring an individual company against an existing ICP (`sales-prospect`), qualifying a single deal with BANT/MEDDIC (`sales-qualify`), researching a specific contact (`sales-contacts`).

## Invocation Modes

This skill is **dual-mode**.

**Standalone mode** (`/sales-icp <description>`)
- User passes a description of their business, product, or service.
- Skill runs market research (Phase 0), builds the full 6-dimension ICP, negative ICP, scoring rubric, personas, and prospecting playbook, then writes a Markdown report.
- Default output path: `build_report_path("business-sales", instruction)` -- typically `.wayland/business-sales/<timestamp>-icp.md`.
- Caller may override with an explicit `out_path` argument.

**Subagent mode** (invoked by `sales-prospect` via `delegate_task(tasks=[...])`)
- Parent orchestrator pre-fetches the prospect company's pages, contact intel, and competitive context, AND loads the user's existing `IDEAL-CUSTOMER-PROFILE.md` if available.
- Child receives a fully self-contained `context` payload (see *Subagent contract* below).
- Child does NOT re-fetch; it scores the prospect's ICP-fit and outreach readiness using the inputs.
- Child returns a JSON object matching `output_schema` AND writes a per-dimension Markdown file to the assigned `out_path`.
- Toolset for the child is `[terminal, file, web]` -- `execute_code` is blocked for delegated subagents, so any helper-script work must already be done by the parent.

## Inputs

Standalone mode accepts:
- `description` (required) -- a description of the business, product, or service. Should include: what it does, who it's currently sold to, price point or deal size, key differentiators, industry focus, company stage. If fewer than 10 words or critical context is missing, ask ONE clarifying question before proceeding.
- `out_path` (optional) -- caller-controlled output path; falls back to `build_report_path("business-sales", instruction)`.

Subagent mode receives in `context`:
- `prospect_company` -- name + URL of the company being scored
- `company_research` -- output from the Company Research subagent (firmographics, tech stack, growth signals)
- `contact_intelligence` -- output from the Contact Intelligence subagent (buying committee, personalization anchors)
- `opportunity_assessment` -- output from the Opportunity Assessment subagent (BANT qualification, pain points)
- `competitive_analysis` -- output from the Competitive Positioning subagent (current tools, positioning angles)
- `icp_context` -- contents of the user's `IDEAL-CUSTOMER-PROFILE.md`, especially channel preferences and buyer personas (if available)
- `scoring_rubric` -- rubric text (parent embeds the 5-dimension Outreach Readiness rubric below)
- `output_schema` -- exact JSON shape the child must return
- `out_path` -- deterministic absolute path the child writes its dimension report to

## Workflow (Standalone Mode)

### Phase 0: Market Research

Use `web_search` (5-result cap) to validate assumptions before drafting:
1. `[product category] market size TAM` -- addressable market
2. `[product category] competitors alternatives` -- positioning
3. `[product category] trends 2026` -- market dynamics
4. `[product category] buying process B2B` -- how companies purchase
5. `[product category] pricing benchmarks` -- budget expectations

### Phase 1: Parse the Business Description

Extract: what the product/service does, who it's sold to, price point/deal size, differentiators, industry, company stage. If too vague, ask ONE clarifying question only -- otherwise make best judgment and state assumptions explicitly.

### Phase 2: Build the 6-Dimension ICP

Analyze across all six dimensions. Use concrete numbers, named tools, specific job titles, and real industry examples -- not generic advice.

#### Dimension 1: Firmographic Criteria

- **Company Size by Revenue:** Specify exact ranges (e.g., "$5M-$50M ARR" not "mid-market"). Explain WHY (budget capacity, complexity needs, decision speed).
- **Company Size by Employees:** Specify headcount ranges (e.g., "50-500 employees"). Correlate with revenue range.
- **Industry Verticals:** List 3-5 PRIMARY verticals ranked by fit. For each, explain why it's a fit. List 2-3 SECONDARY verticals worth exploring.
- **Geography:** Specify target regions. Consider language, regulatory environment, time zones, market maturity.
- **Company Stage:** Define ideal stage (seed, Series A-D, growth, public). Explain why this stage aligns with the product.
- **Growth Rate:** Specify ideal growth indicators (YoY revenue growth %, headcount growth %, funding recency).

Present firmographic criteria as a table with columns: Criteria, Ideal Range, Why It Matters, Red Flag If Missing.

#### Dimension 2: Technographic Signals

- **Current Tech Stack:** List specific tools/platforms that indicate fit (e.g., "Uses Salesforce + HubSpot but NOT enterprise tools like SAP"). Group by category (CRM, marketing, analytics, infrastructure).
- **Technical Sophistication:** Rate ideal technical maturity (1-5 scale). Too low = can't implement; too high = built internally.
- **Integration Needs:** What systems does the product need to integrate with? Which integrations signal a prospect is ready?
- **Technology Adoption Patterns:** Early adopters or fast followers? Best-of-breed or all-in-one?
- **Digital Maturity Indicators:** Website quality, content marketing presence, social media activity, online reviews presence.

#### Dimension 3: Behavioral Indicators

- **Content Consumption:** What blogs, podcasts, newsletters, YouTube channels do they follow? What topics do they search for?
- **Event Attendance:** Which conferences, webinars, meetups, trade shows? List 5-10 specific events by name.
- **Community Membership:** Which Slack groups, LinkedIn groups, Reddit communities, Discord servers, forums are they active in?
- **Buying Patterns:** RFP process? Committee decisions? Champion-led? Top-down mandate?
- **Social Signals:** What do they post about on LinkedIn? What job titles engage with relevant content?
- **Hiring Patterns:** What roles are they hiring for that signal need?

#### Dimension 4: Pain Point Mapping

Identify and rank the top 3-5 pain points. For EACH pain point, document:
- **Pain Point Name:** Clear, specific label
- **Severity Ranking:** Critical (business risk) / High (significant inefficiency) / Medium (nice-to-fix)
- **How It Manifests:** Observable symptoms. What does the team complain about? What breaks?
- **Business Impact:** Quantify the cost (lost revenue, wasted hours, missed opportunities)
- **Trigger Events:** What amplifies this pain? (new funding, competitor launch, regulation change, scaling, leadership change, failed initiative)
- **Current Workaround:** How are they solving this today?
- **Your Solution Angle:** How does the product address this specific pain? Before/after story?

Present as a ranked list with a severity heat map.

#### Dimension 5: Budget Qualification

- **Revenue Thresholds:** Minimum and maximum company revenue for viable deals
- **Funding Stage Requirements:** Funding stages that indicate budget availability
- **Tech Spend Indicators:** What percentage of revenue do ideal customers spend on tech? Absolute dollar range?
- **Deal Size Sweet Spot:** Ideal annual contract value? Minimum viable deal?
- **Budget Cycle Timing:** When do ideal customers set budgets? (calendar year, fiscal year, quarterly)
- **Pricing Sensitivity:** Buy on value or cost?
- **ROI Expectations:** What ROI? What payback period is acceptable?
- **Budget Authority Signals:** External signs of budget (job posts mentioning tools, recent funding, expansion announcements)

#### Dimension 6: Channel Preferences

- **Research Channels:** G2, Capterra, analyst reports, peer recommendations, Google, Reddit, LinkedIn
- **Preferred Contact Methods:** Rank: cold email, LinkedIn DM, phone, referral, event networking, community, content/inbound
- **Decision-Making Process:** Map the buying journey. Who initiates? Evaluates? Approves? How long?
- **Content Preferences:** Case studies, ROI calculators, demos, whitepapers, video testimonials, free trials
- **Engagement Cadence:** How many touchpoints before a meeting? Ideal spacing? Best sequence?
- **Trust Signals:** Customer logos, certifications, analyst recognition, community reputation

### Phase 3: Define the Negative ICP

CRITICAL section. Define characteristics that DISQUALIFY a prospect. Document at least 8-10 disqualification criteria:
- Too small (below revenue/headcount threshold)
- Too large (above complexity/bureaucracy threshold)
- Wrong industry (industries that seem related but aren't a fit, and why)
- Wrong tech stack (technologies that indicate incompatibility)
- Wrong stage (too early, too late, wrong trajectory)
- No budget signals (signs they can't or won't pay)
- Cultural misfit (values or approaches that clash)
- Long sales cycle risk (indicators of 12+ month cycles with low close rates)
- High churn risk (characteristics that predict early cancellation)
- Competitive lock-in (deeply embedded with a competitor, high switching costs)

For each, explain the specific red flag AND why it disqualifies.

### Phase 4: 100-Point ICP Scoring Rubric

Build a lead qualification scorecard anyone on the team can use.

| Category | Max Points | Scoring Criteria |
|----------|-----------|-----------------|
| Firmographic Fit | 25 | Size, industry, geography, stage |
| Technographic Fit | 15 | Tech stack, sophistication, integration readiness |
| Pain Point Alignment | 20 | Severity of pain, urgency, current workaround inadequacy |
| Budget Capacity | 20 | Revenue, funding, tech spend, deal size fit |
| Contact Access | 10 | Decision maker identified, warm path available |
| Timing Signals | 10 | Trigger events, budget cycle, urgency indicators |

For each category, define what scores 0%, 25%, 50%, 75%, and 100% of available points.

**Example -- Firmographic Fit (25 points):**
- **25 points (100%):** Company is in the primary target industry, within ideal revenue AND employee range, in target geography, at ideal stage, and showing strong growth signals
- **19 points (75%):** Meets 4 of 5 firmographic criteria. One minor gap (e.g., slightly outside ideal size range but in perfect industry)
- **13 points (50%):** Meets 3 of 5 criteria. Reasonable fit but needs further validation. Could be a fit with the right use case.
- **6 points (25%):** Meets only 1-2 criteria. Marginal fit. Significant gaps in size, industry, or stage. Low priority unless other signals are very strong.
- **0 points (0%):** Meets zero firmographic criteria. Wrong industry, wrong size, wrong stage. Disqualified on firmographics alone.

Repeat this level of detail for ALL SIX scoring categories. A salesperson should be able to score a lead in under 5 minutes without asking anyone for help.

**Grade Bands:**
- **A+ (90-100):** Drop everything and pursue. Perfect fit, strong signals, clear path. Personalized, multi-threaded outreach within 24 hours.
- **A (75-89):** High priority. Strong fit with minor gaps. Pursue actively with personalized outreach.
- **B (60-74):** Good fit. Worth pursuing but don't over-invest until qualified further. Semi-personalized outreach.
- **C (40-59):** Marginal fit. Only pursue if pipeline is thin. Add to automated nurture sequences.
- **D (0-39):** Does not fit ICP. Do not pursue. Marketing nurture list at most.

**Quick Qualification Checklist** (60-second yes/no):
1. Are they in a target industry? (Y/N)
2. Are they in the ideal size range? (Y/N)
3. Do they show growth signals? (Y/N)
4. Can you identify a likely pain point? (Y/N)
5. Can you find a decision maker to contact? (Y/N)

Score: 5 Yes = likely A. 3-4 Yes = likely B. 1-2 Yes = likely C. 0 Yes = D.

### Phase 5: Buyer Personas (2-3)

Each persona must feel like a real person, not a marketing abstraction.

For EACH persona:
- **Persona Name:** Memorable archetype (e.g., "The Frustrated VP of Engineering", "The Growth-Hungry Founder", "The Risk-Averse CFO")
- **Demographic Profile:** Title, age range, career path, education, reporting structure
- **Day-in-the-Life:** Typical day -- meetings, tasks, pressures
- **Goals and KPIs:** What are they measured on? What does success look like?
- **Pain Points:** Top 3 frustrations -- in their language, not yours
- **Information Diet:** What they read, listen to, watch. Where they get advice.
- **Objections:** Top 3-5 objections during the sales process. Actual words AND underlying concern.
- **Messaging That Resonates:** 2-3 message angles. Specific subject lines and opening lines.
- **What Turns Them Off:** Communication styles, claims, approaches that disengage them.
- **How to Win Them Over:** Key proof points, case studies, demonstrations that move them from skeptical to interested.

### Phase 6: Prospecting Playbook

- **Where to Find Them:** Specific platforms, directories, communities, events, databases. Include exact URLs or search queries.
- **Search Strategies:** LinkedIn Sales Navigator filters, Google operators, industry database queries, job board searches. Provide actual query strings.
- **Signal Monitoring:** Triggers indicating a company just became a better fit. Alerts for: funding announcements, leadership changes, job posts, product launches, competitor departures.
- **Prioritization Framework:** When you find 100 matching companies, how do you pick the top 10? Stack rank criteria.
- **Enrichment Checklist:** After identifying a prospect, what data do you gather before outreach? 10-item checklist.
- **Warm Path Strategies:** Turn cold prospects warm. Mutual connections, content engagement, community involvement, event attendance.
- **Timing Tactics:** Best times of year/month/week/day to reach out. Tied to budget cycles and industry rhythms.
- **Disqualification Speed Check:** First 3 things to check that would immediately disqualify a prospect.
- **Enrichment Sources:** LinkedIn Sales Navigator (official tier - never scraping), Crunchbase API (with paid key), BuiltWith, SimilarWeb (official). G2 / Glassdoor lookups must be **manual human only** - their ToS forbid automated collection. For each source, document what data to extract and how it informs qualification.
- **Outreach Templates by Persona:** For each buyer persona, an opening line and subject line that aligns with their priorities and communication style.

### Phase 7: Market Context and Competitive Awareness

- **Primary Competitors:** 3-5 competitors the sales team will encounter. For each, target segment and key differentiator.
- **Competitive Positioning Statement:** Single sentence that positions the product against the most common competitor.
- **Common Displacement Scenarios:** Which competitor products do ideal customers most often switch FROM? What triggers the switch?
- **Market Trends Affecting ICP:** 2-3 market trends that are making the ICP more (or less) relevant right now.

## Subagent Mode -- Strategy / Outreach Readiness Scoring

When invoked under `sales-prospect`, this skill scores the **Outreach Readiness** dimension (20% of the overall Prospect Score). It translates the other subagents' research into an actionable outreach plan.

### Step 1: Determine Best Outreach Channel

Evaluate and rank channels for this prospect. Do NOT default to email -- choose the channel with the highest probability of getting a response.

| Channel | Best When | Considerations |
|---------|-----------|---------------|
| **Cold Email** | Contact email is findable, prospect role checks email, personalization is strong | Most scalable but lowest response rate. Must be highly personalized to stand out. |
| **LinkedIn DM** | Contact is active on LinkedIn (posts regularly, engages), profile public | Higher response rate than email but more limited in length. Works best with prior engagement. |
| **LinkedIn Engage-First** | Contact creates content regularly | Comment on 2-3 posts before DM. Warms the contact. Takes 1-2 weeks but dramatically improves response. |
| **Phone Call** | Direct phone available, prospect in role that answers calls (sales leaders, founders of small companies) | Highest conversion per attempt but hardest to execute. Best combined with another channel. |
| **Warm Introduction** | Mutual connection exists and willing to intro | Highest response rate of all channels. Always pursue if available. |
| **Event-Based** | Prospect attending or speaking at upcoming event | Natural context for connection. Mention event in outreach. |
| **Community-Based** | Prospect active in a specific community (Slack, Discord, forum) | Engage in community first, then transition to direct conversation. |
| **Referral from Customer** | You have a customer in their network or industry | Social proof + warm path. Ask customer for introduction or permission to name-drop. |
| **Content/Inbound Trigger** | Prospect engages with your content (downloads, webinar) | Requires existing content engine. Most natural conversation starter. |

Select **Primary**, **Secondary**, **Tertiary** channels and justify each based on the specific prospect data available.

### Step 2: Select Messaging Framework

- **Problem-Agitate-Solve (PAS):** Best for prospects with clear, severe pain points. Name the problem, amplify its impact, present your solution. Tone: empathetic, urgent.
- **Before-After-Bridge (BAB):** Best when you can paint a vivid picture of a better future. Describe current state, show ideal state, bridge with your solution. Tone: aspirational, forward-looking.
- **AIDA (Attention-Interest-Desire-Action):** Best when you have a strong hook (trigger event, mutual connection, surprising insight). Tone: engaging, progressive.
- **Challenger Sale:** Best for prospects who think they have it figured out. Lead with an insight they don't know, reframe their problem, position your solution as the answer to the reframed problem. Tone: authoritative, educational.
- **Social Proof Led:** Best for competitive industries where peer validation matters. Lead with what similar companies achieved, create FOMO. Tone: confident, evidence-based.
- **Trigger Event Based:** Best with recent, specific trigger events (funding, hiring, leadership change). Reference the trigger, connect it to a challenge, offer relevant help. Tone: timely, relevant, helpful.

Select the framework that best matches this prospect's situation. Explain WHY.

### Step 3: Build Personalization Strategy Per Decision Maker

For each top 3-5 contact:
- **Contact:** [Name, Title]
- **Buying Role:** [Economic / Technical / User / Champion]
- **Their Priority:** What matters most to this person?
- **Personalization Hook:** Specific, personal element to reference (blog post, conference talk, career move, shared connection)
- **Message Angle:** Which pain point / positioning angle to lead with
- **Tone Adjustment:** Technical detail for CTOs, business impact for CFOs, user experience for team leads
- **CTA Preference:** 15-min call, demo, case study, whitepaper, event invite
- **What NOT to Say:** Messaging that would turn them off

### Step 4: Predict Objections and Prepare Responses

Predict the top 5-7 objections. For each: exact words the prospect might use, underlying concern, response framework, proof point, redirect into a value conversation.

Common categories: status quo, budget, timing, authority, trust, complexity, competition, risk.

### Step 5: Recommend Optimal Timing

- **Day of Week:** Tuesday-Thursday = best response rates. Friday = low urgency.
- **Time of Day:** Morning (decision energy), midday (lunch browsing), afternoon (winding down). Consider timezone.
- **Time of Month:** Beginning (planning mode), mid-month (execution), end (review).
- **Time of Quarter:** Q1 = new budgets. Q4 = use-it-or-lose-it. Mid-quarter = most productive.
- **Trigger Events:** Recent events creating urgency or relevance; upcoming events as natural starters.
- **Follow-Up Cadence:** Day 1 primary -> Day 3 secondary touch -> Day 7 value-add -> Day 14 break-up or new angle -> Day 21 LinkedIn engage -> Day 30 final attempt with new angle.

### Step 6: Draft First Outreach Message

Requirements:
- Email <= 150 words; LinkedIn DM <= 100 words
- At least one specific personalization element (not generic)
- References a real pain point or trigger event
- Clear, low-friction CTA (not "let me give you a demo" -- more like "worth a 15-min chat?")
- Must NOT sound like a template
- NO buzzwords: "synergy", "leverage", "unlock", "revolutionize", "game-changer", "best-in-class"
- NO spam triggers: "I hope this email finds you well", "I wanted to reach out", "Just checking in"

Also draft: subject line (under 50 chars), LinkedIn connection note (under 300 chars), Day-3 follow-up that adds value (doesn't just "bump").

## Scoring Rubric (Subagent Mode)

| Dimension | Score Range | What It Measures |
|-----------|-----------|------------------|
| **Personalization Quality** | 0-10 | How personalized can the outreach be? Strong hooks per contact, or generic at best? |
| **Channel Strategy** | 0-10 | Right channel identified? Multiple viable channels? Warm path? |
| **Messaging Fit** | 0-10 | Framework matches the prospect's situation? Value prop clear and compelling? |
| **Objection Preparedness** | 0-10 | Likely objections predicted with strong responses? Team ready for pushback? |
| **Timing Opportunity** | 0-10 | Favorable timing signals? Trigger events? Good positioning in their buying cycle? |

### Scoring Calibration

- **9-10:** Exceptional. Multiple strong personalization hooks per contact, clear warm path, perfect timing with a recent trigger event, messaging directly addresses confirmed pain. Ready to send TODAY.
- **7-8:** Strong. Good personalization, solid channel strategy, messaging aligns with identified needs. A few unknowns to validate.
- **5-6:** Moderate. Basic personalization available, default channel strategy, messaging based on inferred rather than confirmed needs. Serviceable but not standout.
- **3-4:** Weak. Limited personalization, unclear best channel, messaging is somewhat generic. Better than pure cold outreach but not by much.
- **1-2:** Poor. Almost no personalization available, no warm paths, messaging is essentially a template. Low probability of response.
- **0:** Not ready. Critical information missing (no contacts identified, no pain points found, no channel viable). Needs more research before outreach.

**Outreach Readiness Score** = (Personalization Quality + Channel Strategy + Messaging Fit + Objection Preparedness + Timing Opportunity) / 5 * 10 -> yields a 0-100 integer. This value is emitted as the canonical top-level `dimension_score` (see JSON shape below). Weighted 20% in the `sales-prospect` aggregate.

## Output

### Standalone Mode -- Markdown report

Write to the resolved `out_path` via `file_tools.write`. Sections in order: ICP Summary, Firmographic Criteria, Technographic Profile, Behavioral Signals, Pain Point Map, Budget Qualifiers, Channel Strategy, Negative ICP, 100-point Scoring Rubric, Buyer Personas (2-3), Prospecting Playbook, Competitive Context, ICP Maintenance Guide, attribution footer.

Aim for 300-400 lines of substantive content. Use tables wherever structured data is presented.

### Subagent Mode -- JSON return + Markdown file

Return JSON matching `context.output_schema` (typically this shape, but always honor what the parent passes):

```json
{
  "dimension": "icp",
  "dimension_score": 74,
  "subscores": {
    "personalization_quality": {"score": 80, "rationale": "<one-line>"},
    "channel_strategy":        {"score": 70, "rationale": "<one-line>"},
    "messaging_fit":           {"score": 70, "rationale": "<one-line>"},
    "objection_preparedness":  {"score": 80, "rationale": "<one-line>"},
    "timing_opportunity":      {"score": 70, "rationale": "<one-line>"}
  },
  "key_findings": ["<one-line>", "..."],
  "primary_channel": "<channel + target contact>",
  "messaging_framework": "<framework name + rationale>",
  "draft_message": {
    "subject": "<subject line>",
    "body": "<full first message>"
  },
  "follow_up_cadence": ["Day 1: ...", "Day 3: ...", "..."],
  "top_objections": [
    {"objection": "<exact words>", "response": "<how to respond>", "proof": "<evidence>"}
  ],
  "recommendations": [
    {"tier": "immediate|short_term|long_term", "title": "...", "impact": "high|medium|low", "effort": "low|medium|high"}
  ],
  "outreach_risks": ["<risk + mitigation>"],
  "report_path": "<absolute out_path>"
}
```

**Scale conversion.** The Outreach Readiness rubric grades each of the 5 sub-dimensions on a 0-10 band. For the canonical JSON above:
- `subscores.<bucket>.score = rubric_value * 10` to land on the 0-100 scale.
- Top-level `dimension_score = round(mean(subscores.*.score))` - equivalent to the historical Outreach Readiness Score (sum / 5 * 10). Both yield the same 0-100 integer.

The aggregator (`sales-prospect` Phase 3) reads `dimension_score` directly. Outreach Readiness is weighted **20%** in the Prospect Score.

Also write the same content as Markdown to `context.out_path` with sections: Outreach Readiness Score, Dimension Scores table, Recommended Outreach Channel table (Primary/Secondary/Tertiary), Messaging Framework + rationale, Core Message Structure (Hook/Value/Proof/CTA), Personalization Map (per-contact), Objection Predictions table, Timing Recommendation, Follow-Up Cadence table, Draft First Outreach (subject + body), Day-3 Follow-Up, LinkedIn Connection Note (if applicable), Outreach Risk Factors, Strategy Summary (2-3 sentences).

## ICP Maintenance Guidance (Standalone Output Footer)

- **Review Cadence:** Quarterly, or after any major product/pricing change or market shift.
- **Update Triggers:** Closed 3+ deals outside current ICP; lost 3+ deals to the same competitor or objection; major new feature or new market entry; significant pricing change; major competitor enters or exits market.
- **Feedback Loop:** After `sales-prospect` runs on 10+ companies, review which scores correlated with actual deal outcomes. Adjust ICP criteria and weights.
- **Version Control:** Date-stamp ICPs; keep previous versions for comparison.

## Notes / Pitfalls

- Every criterion must be SPECIFIC (exact ranges, not "medium-sized companies"). Every recommendation must be ACTIONABLE. Every persona must feel REAL. Pain points must reflect the prospect's perspective, not the seller's pitch.
- Do NOT ask more than one clarifying question. Work with what you have and state assumptions explicitly.
- Do NOT skip any section in standalone mode -- all 6 dimensions, negative ICP, scoring rubric, personas, and playbook are required.
- In subagent mode the child cannot call `execute_code` and cannot re-fetch -- work only from `context.*`. If a critical input is missing, score 0 on the affected sub-dimension and acknowledge it rather than fabricating.
- **Personalization must be real** -- never fabricate personal details, blog posts, or accomplishments. **Messages must be ready to send** -- no `[placeholders]`. **Objections must be realistic** -- only include those genuinely likely. **Channel selection must be justified** -- don't default to email; warm intro is always primary if available. **Timing must be specific** -- "Tuesday morning their time, referencing their Series B from last week" not "reach out soon".
- The strategy must be COHERENT: channel, message, timing, personalization, objection handling work together as a unified approach.
- Suggested follow-ups after a standalone run: `/sales-prospect <url>` to score a real company against this ICP, `/sales-qualify` for BANT/MEDDIC qualification.
- **Compliance gate on draft messages.** Subagent-mode draft first messages inherit the sales-outreach Phase 0 jurisdiction gate. If the prospect is in DE/AT/CH, REFUSE to produce cold-message copy and route to "warm intro required". For US recipients, the message must include sender's physical postal address placeholder if the user has not supplied one. For Canadian recipients, confirm CASL consent question before generating.
- **No fabricated mutual connections.** Personalization "warm intro" / "mutual connection" entries must reference a real, documented relationship. Never invent referrers.

## Output footer (REQUIRED on every ICP report)

End every generated ICP document with this block, verbatim:

```
---
**ICP / OUTREACH STRATEGY - NOT LEGAL, MARKETING-COMPLIANCE, OR DATA-PROTECTION ADVICE**

Before targeting prospects per this ICP, the user must:

1. Confirm targeted segments do not include jurisdictions where pure cold email is unlawful (Germany / Austria / Switzerland - UWG §7 / TKG §107 requires prior express consent for B2B cold).
2. Confirm Canadian segments will only receive messages with CASL express OR implied consent.
3. Confirm EU/UK B2B segments have a documented GDPR Art. 6(1)(f) legitimate-interest balancing test (LIA); B2C segments have prior opt-in.
4. Confirm US segments receive messages with accurate sender, conspicuous opt-out, and valid physical postal address (CAN-SPAM §5(a)(5)).
5. Source contacts via OSINT or official platform APIs only - not scraped LinkedIn / Glassdoor / G2 / Capterra / Crunchbase free-tier.
6. Never use ICP "warm path" / "mutual connection" entries to fabricate referrals. Only cite documented, permission-confirmed referrers.

Generated by Wayland business-sales plugin. No warranty, express or implied. Wayland and the plugin authors disclaim all liability for use of this report.
```

---

> _**Templates and analytical tools only - not legal, marketing-compliance, or data-protection advice.** ICP targeting that includes DE/AT/CH cold or unconsented Canadian recipients is not lawful - confirm jurisdiction posture before outreach._
