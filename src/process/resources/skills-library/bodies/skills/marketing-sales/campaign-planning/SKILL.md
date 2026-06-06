---
name: campaign-planning
description: |
  Produces a completed marketing campaign brief with objective, audience,
  message hierarchy, channels, timeline, creative requirements, and success
  metrics. Use when the user asks to plan a marketing campaign, create a
  campaign brief, structure a promotional push, or design a multi-channel
  campaign with specific goals and timelines.
  Do NOT use for ongoing marketing strategy (use marketing-strategy), email
  sequence design (use email-campaign), or single ad copy creation (use
  paid-ad-copy).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing planning strategy template"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Campaign Planning

## When to Use

**Use this skill when:**
- A user asks to plan a specific marketing campaign -- a defined initiative with a start date, end date, offer or goal, and budget
- A user wants a campaign brief for a product launch, seasonal promotion, event, limited-time offer, or awareness drive
- A user needs to structure a multi-channel campaign with coordinated messaging, timing, and creative assets across two or more channels
- A user asks to define campaign goals, audience segmentation, channel mix, and success metrics for a bounded initiative
- A user wants a campaign timeline with deliverables, owners, and milestones -- ready to hand off to a creative or media team
- A user is preparing for an agency or vendor briefing and needs a structured document to share
- A user has a specific offer, event, or deadline and needs a coordinated plan to drive action against it

**Do NOT use this skill when:**
- The user needs an annual or quarterly marketing strategy across product lines (use `marketing-strategy` -- campaigns are executions within a strategy, not the strategy itself)
- The user needs a detailed email drip sequence with send logic, segmentation rules, and automation workflows (use `email-campaign`)
- The user needs a single piece of ad copy, a tagline, or an ad creative brief (use `paid-ad-copy`)
- The user is asking about content calendar planning without a specific campaign objective or budget (use `content-calendar`)
- The user wants to analyze a completed campaign's performance and draw attribution conclusions (use `campaign-analysis`)
- The user needs a brand positioning or messaging framework that spans all communications (use `brand-messaging`)
- The user is asking how to choose between marketing channels in a general sense without a specific campaign context (use `channel-strategy`)

---

## Process

### Step 1: Collect Required Campaign Inputs Before Writing Anything

Never produce a campaign brief without first gathering the following. If any are missing, ask for them explicitly.

- **Campaign name or working title** -- a working title focuses the document and signals priority (e.g., "Spring Reactivation Drive" vs. "Q2 Campaign")
- **Business objective the campaign serves** -- is this a revenue objective (drive sales), a pipeline objective (generate leads), a brand objective (drive awareness or consideration), or a retention objective (reduce churn, drive repeat purchase)? The objective type determines every downstream decision
- **Target audience for this campaign specifically** -- not the overall brand audience. Who, exactly, should this campaign reach? Existing customers vs. net-new prospects vs. lapsed users vs. a specific segment? Campaigns fail when audience definition is too broad
- **Total campaign budget** -- exact number, and whether it includes creative production or media spend only. A $10K budget that includes $4K in creative production leaves $6K for media, which is a meaningfully different plan than $10K pure media
- **Campaign dates** -- hard start date, hard end date, and any fixed internal dates (launch event, press embargo lift, product ship date) or external dates (holidays, competitor announcements, seasonal moments)
- **The offer or call-to-action** -- what do you want the audience to do, and what are you offering them to do it? A percentage discount, a free trial, a whitepaper download, an event registration, a demo request -- this determines creative and channel choices
- **Available creative assets** -- what already exists that can be used or repurposed? Existing photography, brand video, product imagery, customer testimonials, or case studies? Knowing this prevents over-engineering the creative plan

**If the user provides a brief description of the campaign**, extract these inputs from it and then state what you inferred before building the plan. Flag any assumptions clearly.

---

### Step 2: Define the Campaign Objective with Precision

A campaign without a precise objective is a budget without accountability. Apply the following framework:

- **Write the objective in a single sentence** using this structure: "Drive [specific metric] from [baseline] to [target] among [audience] by [date] using [campaign]"
- **Choose the correct metric type** for the objective:
  - Revenue objectives: total sale revenue, average order value (AOV), revenue per customer
  - Lead generation objectives: number of Marketing Qualified Leads (MQLs), cost per lead (CPL), lead-to-opportunity conversion rate
  - Awareness objectives: reach (unique users exposed), aided brand awareness score, share of voice
  - Engagement objectives: click-through rate (CTR), video completion rate, engagement rate
  - Retention objectives: repeat purchase rate, reactivation rate, churn reduction percentage
- **Anchor the target to a baseline** -- a 20% increase sounds meaningful; 20% increase from 100 leads (to 120) versus from 10,000 leads (to 12,000) are completely different campaign scales
- **Apply a sanity check**: given the budget and timeline, is the target achievable? A $5K budget driving $500K in new revenue is a red flag unless the campaign is retargeting a high-intent email list. Call out unrealistic objectives and offer a recalibrated version
- **Set a stretch goal at 120-130% of the primary target** -- not aspirational fantasy, but a reach target that drives team ambition without distorting the plan
- **State the business context**: how does this campaign contribute to the quarter or annual goal? This prevents campaigns from being planned in isolation and helps stakeholders prioritize resources

---

### Step 3: Build the Message Hierarchy

This is the most frequently skipped step and the most common reason campaigns underperform -- teams run to channel selection before defining what they are actually saying.

- **Start with one primary message** -- the single thought a target audience member should remember if they forget everything else. It must combine the core offer with the core differentiation. Test it against this: could this message apply to a competitor? If yes, it is not differentiated enough
- **Write 2-3 supporting messages** that provide reasons to believe, context, or urgency. These do not repeat the primary message -- they amplify it. Common types: proof point (social proof, data), benefit expansion (what specifically improves for the customer), or urgency driver (time limit, scarcity, exclusivity)
- **Gather proof points** -- specific evidence that makes the primary message credible. Industry-specific benchmarks, customer testimonials with named customers and specific outcomes, third-party ratings, before-and-after data. Vague claims ("our customers love us") are not proof points
- **Write the CTA in active, specific language** -- "Shop the sale" is stronger than "Learn more." "Book your free 30-minute demo" is stronger than "Contact us." The CTA should match the funnel stage: awareness campaigns use low-commitment CTAs (follow, explore, discover); conversion campaigns use high-commitment CTAs (buy, register, start your trial)
- **Adapt each message for channel context** -- the primary message must shrink to 6 words for a display banner, expand to 150 words for an email intro, and become a spoken sentence for a podcast ad. Document each adaptation so creative teams have direction, not interpretation
- **Apply a tone descriptor** -- one or two adjectives that describe the voice of this campaign. "Urgent and exclusive" for a flash sale. "Educational and reassuring" for a software onboarding campaign. "Celebratory and generous" for a customer anniversary campaign. Tone inconsistency across channels is the second most common creative execution failure

---

### Step 4: Select and Size the Channel Mix

Channel selection must follow audience behavior and budget reality -- not personal preference or the channels the team is most comfortable with.

- **Start with the audience, not the channel** -- where does the specific target audience for this campaign spend time, and in what mindset? B2B SaaS prospects are on LinkedIn during work hours and consuming industry newsletters. Consumer homebuyers are on Pinterest and Instagram in the evening. Lapsed customers are in your email list and retargeting audiences. Match channel to audience state
- **Apply the 60/30/10 budget allocation rule as a starting point**:
  - 60% to the highest-confidence channel -- the one with the most proven history with this audience
  - 30% to a secondary channel that reaches a different segment of the same audience or a different stage of the funnel
  - 10% to a test channel -- a new format or channel where you have low certainty but meaningful upside
  - Adjust this ratio based on campaign objective: awareness campaigns may invert toward reach channels; retargeting campaigns may concentrate spend into one high-intent channel
- **For each channel, document six things**: tactic (what you will do), format (what the creative looks like), audience targeting (who specifically within the channel), frequency (how often they will see it), budget allocation (dollar amount and percentage), and expected output (reach, leads, revenue, or conversions)
- **Check channel-specific benchmarks** to set realistic expected outputs:
  - Email: 20-25% open rate (engaged list), 2-3% CTR for B2C; 15-20% open rate, 3-5% CTR for B2B
  - Meta paid social: $10-30 CPM for retargeting; $20-50 CPM for prospecting; 0.5-1.5% CTR
  - Google Search: 3-8% CTR on branded terms; 1-3% CTR on non-branded; $2-15 CPC depending on category
  - LinkedIn ads: $50-90 CPM; 0.3-0.6% CTR; $5-15 CPC for sponsored content
  - Organic social: 0.5-2% engagement rate on Instagram/LinkedIn; declining organic reach means organic rarely drives significant direct conversion
- **Match channel to funnel stage**: paid social and display for awareness and consideration (top of funnel); search and retargeting for intent and conversion (bottom of funnel); email and SMS for conversion and retention (owned channels)
- **Cap channel count relative to budget**: under $10K total, use no more than 3 channels; $10-50K, use 3-5 channels; above $50K, use up to 6-8 channels. Spreading thin budgets across many channels wastes setup time and produces no channel with enough frequency to break through

---

### Step 5: Build the Creative Requirements Matrix

Creative production is the most common reason campaigns launch late. Document requirements with enough specificity that a designer or copywriter can begin without a follow-up meeting.

- **List every creative asset needed** -- exhaustively. Each channel format is a separate asset. A Meta campaign running feed ads, story ads, and carousel ads is three assets, not one
- **For digital assets, specify**: exact pixel dimensions (1080x1080 for Instagram feed, 1200x628 for Facebook link preview, 1080x1920 for stories/reels), file format (JPEG for static, MP4 or MOV for video, GIF maximum 5MB), maximum file size, and safe zone requirements for text
- **For copy assets, specify**: character or word count limits (Google RSA: 30 characters per headline, 90 characters per description; Meta primary text: 125 characters before truncation; email subject line: 40-50 characters for mobile preview), tone, and required inclusions (legal disclaimers, pricing, offer end date)
- **For video assets, specify**: duration (6 seconds for bumper ads, 15-30 seconds for social, 30-60 seconds for YouTube pre-roll), aspect ratio (16:9 horizontal, 1:1 square, 9:16 vertical), whether captions are required (they are -- 85% of social video is watched without sound), and whether the brand/offer must appear in the first 3 seconds (it must)
- **Include production deadlines** that are 5-7 business days before the campaign launch date -- not the day before. Ads require platform review and approval (Meta reviews within 24 hours; Google search ads within 1-2 business days; programmatic display varies by network from same-day to 5 days)
- **Identify asset dependencies** -- which assets can be built in parallel and which must be sequenced? Brand photography must exist before ad creatives can be made. Landing pages must be live before paid search campaigns can launch

---

### Step 6: Build the Campaign Timeline

A campaign timeline is a project management document, not a list of dates. Every item must have an owner, deadline, and dependency.

- **Work backwards from the launch date** -- build the timeline in reverse, starting from go-live and filling in every prerequisite. This surfaces the real start date for pre-production work, which is almost always earlier than teams expect
- **Structure the timeline across four phases**:
  - **Pre-campaign (T-minus 3 to 4 weeks)**: audience segmentation and list pulls, brief sign-off, creative briefing, asset production, copy review, legal/compliance review, platform setup (ad accounts, UTM parameters, conversion tracking pixels), landing page QA, and stakeholder approval
  - **Launch phase (T-0 to T+3 days)**: go-live asset upload, channel-by-channel activation checklist, tracking verification (fire a test conversion, verify UTM data is landing in analytics), launch day monitoring (hourly check of delivery, spend pacing, early CTR/open rates)
  - **Optimization phase (T+3 days to T-minus 5 days of end)**: pause underperforming creative variants, reallocate budget to overperforming placements, A/B test subject lines or headlines, respond to early conversion data
  - **Close phase (final 3-5 days)**: urgency messaging, budget acceleration on proven channels, asset swap to "last chance" creative, campaign shutdown checklist, data export and tagging for post-campaign analysis
- **Include a contingency buffer** -- at minimum, 2 extra business days before the creative production deadline for revision cycles. Creative never ships right on the first version
- **Flag blackout periods** -- platform-specific rules: during peak ad auction times (Thanksgiving Day itself, Super Bowl Sunday), CPMs spike 3-5x. Sometimes it is cheaper to go dark the day of a peak event and run the days immediately before and after

---

### Step 7: Define Measurement Infrastructure

Measurement is not an afterthought -- it must be built before the campaign launches, or the data will be unrecoverable.

- **Define the primary KPI first** and make it singular. A campaign cannot have five primary KPIs. The primary KPI must map directly to the campaign objective: if the objective is revenue, the primary KPI is revenue. If the objective is lead generation, the primary KPI is qualified leads, not form fills (form fills include spam and disqualified submissions)
- **Set up tracking before launch**:
  - UTM parameters on every URL (source, medium, campaign, content, term) -- use a UTM naming convention that is consistent across all campaigns so historical data is comparable
  - Conversion pixels or events on every landing page action (purchase complete, form submit, demo booked)
  - Verify that attribution is set correctly -- last-click attribution overstates the value of search and email; first-click overstates awareness channels. For most campaigns, linear or time-decay attribution is more accurate than last-click
- **Define secondary KPIs by channel** -- these diagnose channel health even when primary KPI data is delayed. If a campaign is driving revenue, the channel KPIs are: email CTR, paid social add-to-cart rate, search impression share, landing page conversion rate
- **Set reporting cadence based on campaign duration**: campaigns under 2 weeks need daily reporting; campaigns 2-8 weeks need twice-weekly or weekly; campaigns over 8 weeks need weekly with a mid-campaign full review
- **Define decision thresholds in advance** -- document what underperformance looks like before the campaign runs so optimization decisions are objective, not reactive. Example: "If email CTR is below 1.5% on the launch send, test a new subject line for the day-3 follow-up." Example: "If CPA on Meta exceeds $45 by day 4, pause prospecting and move budget to retargeting."
- **Schedule the post-campaign review** before the campaign launches -- put it on the calendar for 7-10 days after campaign close. This forces the data to be collected while stakeholders still remember the context

---

## Output Format

```
## Campaign Brief: [Campaign Name]

**Campaign Type:** [Product Launch / Seasonal Promotion / Lead Generation / Awareness / Retention]
**Objective:** [One-sentence SMART objective]
**Budget:** [$X total | $X media + $X production]
**Timeline:** [Start date] to [End date]
**Target Audience:** [Specific segment, not "our customers"]
**Campaign Owner:** [Name / Role]
**Approvals Required:** [Stakeholders who must sign off before launch]

---

### 1. Campaign Objective

**Primary Goal:** [Metric] from [baseline] to [target] by [date]
**Stretch Goal:** [120-130% of primary target]
**Business Context:** [How this campaign contributes to quarterly/annual goal]
**Objective Type:** [Revenue / Lead Gen / Awareness / Retention]

---

### 2. Target Audience

| Segment | Description | Size (if known) | Funnel Stage | Priority |
|---------|-------------|-----------------|--------------|----------|
| [Segment 1] | [Demographics + behavioral descriptor] | [# of people/accounts] | [Awareness/Consideration/Conversion/Retention] | [Primary / Secondary] |
| [Segment 2] | [Description] | [Size] | [Stage] | [Priority] |

**Audience Insights:** [What do we know about this audience's current attitude, pain point, or behavior that the campaign must address?]
**Exclusions:** [Who should be excluded -- recent purchasers, current customers, competitors, geographic exclusions]

---

### 3. Message Hierarchy

**Campaign Tone:** [2 adjective descriptors -- e.g., "Urgent and direct" / "Warm and reassuring"]

| Level | Message | Purpose | Channel Adaptation |
|-------|---------|---------|-------------------|
| Primary Message | [Core message -- 1 sentence, brand-differentiated] | The one thing they remember | [How it adapts per channel: short/long/visual] |
| Supporting Message 1 | [Reason to believe or benefit] | Amplifies primary | [Adaptation] |
| Supporting Message 2 | [Urgency driver or exclusivity] | Drives action | [Adaptation] |
| Proof Point | [Specific stat, testimonial, or rating with source] | Builds credibility | [Where featured] |
| Call-to-Action | [Active, specific verb phrase] | Drives conversion | [CTA text per channel] |

---

### 4. Channel Plan

| Channel | Tactic | Audience Targeting | Format | Frequency / Volume | Budget | Benchmark | Expected Output |
|---------|--------|--------------------|--------|--------------------|--------|-----------|----------------|
| [Channel 1] | [Tactic] | [Who specifically] | [Format] | [How often / how many] | [$X / X%] | [Industry CTR / CPM / open rate] | [Leads / revenue / reach] |
| [Channel 2] | [Tactic] | [Who] | [Format] | [Frequency] | [$X / X%] | [Benchmark] | [Output] |
| [Channel 3] | [Tactic] | [Who] | [Format] | [Frequency] | [$X / X%] | [Benchmark] | [Output] |

**Budget Summary:**
- Media spend: $[X]
- Creative production: $[X]
- Tools / platforms: $[X]
- Total: $[X]

---

### 5. Creative Requirements

| Asset | Channel | Specs | Copy Requirements | Owner | Due Date |
|-------|---------|-------|-------------------|-------|----------|
| [Asset name] | [Channel] | [Dimensions, format, file size] | [Headline chars, body chars, required inclusions] | [Designer / Copywriter] | [Date] |
| [Asset name] | [Channel] | [Specs] | [Copy requirements] | [Owner] | [Date] |

**Creative Notes:**
- Required brand elements: [Logo lockup, tagline, color palette, legal disclaimer text]
- Accessibility requirements: [Captions on video, alt text on images, contrast ratio minimum]
- Approval chain: [Who reviews: Creative Director → Legal → Campaign Owner]

---

### 6. Campaign Timeline

**Pre-Campaign -- [Start date of prep] to [T-1 day]**

| Task | Owner | Deadline | Dependency | Status |
|------|-------|----------|------------|--------|
| Audience segmentation and list pull | [CRM/Data team] | [Date] | Campaign brief approved | [ ] |
| Creative brief issued to design/copy | [Campaign Owner] | [Date] | Audience and message approved | [ ] |
| Landing page built and QA'd | [Web team] | [Date] | Brief issued | [ ] |
| Ad accounts and UTM parameters set up | [Paid media] | [Date] | Channel plan approved | [ ] |
| Creative assets delivered (all channels) | [Creative team] | [Date -- 5 biz days before launch] | Brief issued | [ ] |
| Legal / compliance review | [Legal] | [Date] | Assets delivered | [ ] |
| Stakeholder approval | [Campaign Owner] | [Date -- 2 biz days before launch] | Legal review complete | [ ] |
| Platform trafficking (ads uploaded) | [Paid media] | [Date -- 1-2 biz days before launch] | Assets approved | [ ] |
| Tracking and pixel verification | [Analytics] | [T-1 day] | Trafficking complete | [ ] |

**Launch Phase -- [Launch date] to [T+3 days]**

| Task | Owner | Deadline | Status |
|------|-------|----------|--------|
| All channels go-live confirmation | [Campaign Owner] | [Launch date, 9am] | [ ] |
| Tracking verification (test conversion) | [Analytics] | [Launch date, 10am] | [ ] |
| Hour-1 delivery and spend check | [Paid media] | [Launch date, 10am] | [ ] |
| End-of-day launch report to stakeholders | [Campaign Owner] | [Launch date, 5pm] | [ ] |
| 48-hour performance review | [Campaign Owner] | [T+2 days] | [ ] |

**Optimization Phase -- [T+3] to [T-5 days from end]**

| Task | Owner | Cadence | Status |
|------|-------|---------|--------|
| Performance reporting against KPIs | [Analytics] | [Daily / Twice-weekly] | [ ] |
| Creative variant testing | [Paid media / Email] | Week 2 | [ ] |
| Budget reallocation based on channel performance | [Paid media] | [Week 2 review date] | [ ] |
| Mid-campaign stakeholder update | [Campaign Owner] | [Date] | [ ] |

**Close Phase -- [T-5 days] to [End date]**

| Task | Owner | Deadline | Status |
|------|-------|----------|--------|
| Urgency creative swap (if applicable) | [Creative team] | [T-5 days] | [ ] |
| Budget acceleration to top performers | [Paid media] | [T-5 days] | [ ] |
| Campaign shutdown checklist (all channels off) | [Paid media] | [End date + 1 hour] | [ ] |
| Final data export and tagging | [Analytics] | [End date + 1 day] | [ ] |
| Post-campaign report | [Campaign Owner] | [End date + 7-10 days] | [ ] |

---

### 7. Measurement Plan

**Primary KPI:** [Single metric that defines success] -- Target: [X] by [date]
**Attribution Model:** [Last-click / Linear / Time-decay -- and why]

| KPI | Type | Target | Baseline | Tracking Method | Report Frequency | Decision Threshold |
|-----|------|--------|----------|----------------|-----------------|-------------------|
| [Primary KPI] | Primary | [Target] | [Baseline] | [Tool] | [Daily/Weekly] | [What triggers a change in strategy] |
| [Channel KPI 1] | Secondary | [Target] | [Benchmark] | [Tool] | [Frequency] | [Decision rule] |
| [Channel KPI 2] | Secondary | [Target] | [Benchmark] | [Tool] | [Frequency] | [Decision rule] |
| [Channel KPI 3] | Secondary | [Target] | [Benchmark] | [Tool] | [Frequency] | [Decision rule] |

**UTM Convention:** utm_source=[channel] | utm_medium=[tactic] | utm_campaign=[campaign-name] | utm_content=[asset-variant]
**Post-Campaign Report Due:** [Date] | **Report Owner:** [Name]
```

---

## Rules

1. **Never produce a brief without objective, audience, budget, and timeline.** These four inputs are non-negotiable. A brief without all four is a creative mood board, not a campaign plan. Ask for missing inputs explicitly rather than guessing.

2. **The campaign objective must be measurable and baselined.** "Increase brand awareness" is not an objective -- it is a wish. The objective must name a specific metric, a current baseline, a target value, and a deadline. If the user cannot provide a baseline, acknowledge that explicitly and suggest a proxy metric that can be tracked forward from launch.

3. **Every message hierarchy has exactly one primary message.** Two primary messages means no primary message. If the user proposes two equally important messages, help them identify which one to lead with and how the other becomes a supporting message. The test: what would you put on a billboard with 6 words?

4. **Budget determines channel count -- channel count does not determine budget.** Do not propose a 6-channel plan for a $5,000 budget. Under $10K, recommend a maximum of 3 channels. State this trade-off explicitly and explain why depth beats breadth at limited budgets.

5. **Creative production costs must be in the budget from the start.** If a user says "$10,000 budget" and the channel plan requires 15 custom creative assets, creative production will consume 30-50% of that budget. Surface this conflict before building the full plan, not in the footnotes.

6. **Tracking infrastructure must be confirmed as a pre-campaign requirement.** If UTM parameters are not set up, conversion pixels are not firing, and attribution is not configured before launch day, the campaign data is unrecoverable. List tracking setup as a hard dependency -- campaigns do not go live without it.

7. **Channel benchmarks must be stated when setting KPI targets.** Do not set a 5% email CTR target without noting that the industry average is 2-3%. Do not set a $2 CPL on paid social without noting that B2B SaaS paid social CPL typically runs $40-200. Targets without context are meaningless and often set teams up for perceived failure.

8. **Every deliverable in the timeline must have a named owner role.** "TBD" is not an owner. If the user has not defined team roles, use functional descriptors (Paid Media Manager, Copywriter, Campaign Owner, Analytics, Legal) and note that these roles must be assigned before pre-campaign tasks begin.

9. **The post-campaign review must be scheduled before the campaign launches.** Post-campaign reviews scheduled after campaigns end get deprioritized or skipped. Put the review date in the brief as a firm deliverable with an owner. Without a structured review, the same mistakes recur in the next campaign.

10. **Always state the assumptions made when inputs are incomplete.** If budget is not stated, do not guess quietly -- note "Assumed budget: $X based on [context clue], please confirm before launch." Undocumented assumptions become misaligned expectations when the campaign team receives the brief.

11. **The CTA must match the funnel stage of the target audience.** A cold awareness audience asked to "Buy Now" will ignore the ad. A retargeting audience offered "Learn More" will under-convert. Mismatched CTAs are one of the most common and measurable causes of campaign underperformance.

12. **Legal review is not optional for promotional campaigns.** Any campaign that makes a claim about price, performance, or comparative superiority requires a compliance review step in the timeline. Failure to include it produces campaigns that either launch with legal risk or stall waiting for last-minute legal sign-off.

---

## Edge Cases

### 1. Product Launch Campaign With No Existing Audience Data
When a product is brand new and there is no purchase history, email list, or behavioral data to work from, audience targeting must be built from scratch. Start with first-party data from analogous products in the same company -- existing customers who fit the buyer profile of the new product, regardless of what they bought. Build a lookalike model from that list for paid social. Use interest and job-title targeting on LinkedIn or search intent targeting on Google as the acquisition layer. Do not attempt retention messaging or abandoned-cart retargeting -- these require cookied audiences that take 2-4 weeks to build. Note in the timeline that the first 2 weeks of the campaign should be treated as audience-building, with conversion optimization beginning in week 3.

### 2. Budget Changes After the Brief Is Finalized
Budget cuts happen after campaign plans are approved. When a campaign budget is reduced by 20% or more after the brief is signed off, do not simply scale all channels down proportionally. Instead, apply a triage framework: (1) identify which channel has the highest historical ROI for this audience and protect its budget first; (2) pause the test channel allocation entirely, since testing requires statistical significance that under-budgeted channels cannot achieve; (3) reduce frequency before reducing reach -- it is better to reach the full target audience less often than to reach a fraction of the audience at full frequency. Revise the KPI targets downward to reflect the new budget reality, and document the revision and rationale in the brief.

### 3. Very Short Timeline (Under 2 Weeks From Briefing to Launch)
Compressed timelines force a fundamentally different execution plan. When there are fewer than 10 business days between briefing and launch, prioritize owned channels (email, SMS, owned social) over paid channels -- owned channels require no platform approval cycles and can use existing creative templates. For paid channels, use existing proven creative rather than producing new assets. Reduce the number of channels to two or three maximum. Accept that A/B testing will not be possible -- launch with the single best hypothesis rather than a test-and-learn structure. Flag this explicitly: a rushed campaign produces launch-day data that cannot be optimized because there is no time to respond to it. Set realistic expectations with stakeholders before committing to the timeline.

### 4. Multi-Market or Multi-Language Campaign
A campaign running in multiple languages or geographies is not one campaign -- it is multiple coordinated campaigns sharing a strategy. For each market, the following must be independently specified: audience segment (size and behavior vary by market), channel mix (WeChat is dominant in China; WhatsApp is dominant in Brazil; LinkedIn penetration varies significantly by country), creative localization (not translation -- cultural relevance requires different imagery, humor conventions, and offer structures in different markets), and legal compliance (promotional laws differ significantly: some countries require no-purchase-necessary disclaimers, specific sweepstakes registration, or restrictions on comparative advertising). Add a localization timeline to the creative requirements matrix with a separate deadline for each market, building in enough lead time for back-translation quality review (translated copy sent back to original language by a different translator to verify accuracy).

### 5. B2B Campaign With Long Sales Cycles
B2B campaigns targeting enterprise buyers operate on fundamentally different conversion timeframes than B2C campaigns. A campaign with a 6-week run time cannot be measured primarily by closed revenue if the average sales cycle is 6-9 months. Redefine the primary KPI to a top-of-funnel metric (Marketing Qualified Leads, demo requests, content downloads) with secondary KPIs tracking pipeline influence (opportunities sourced, opportunities influenced, pipeline value attributed). Build a lead handoff protocol into the campaign brief: define what makes a lead "marketing qualified" before the campaign launches, set up lead routing logic in the CRM, and establish a follow-up SLA with the sales team (e.g., "Inbound demo requests followed up by SDR within 4 business hours"). The campaign brief should include a sales enablement section specifying what materials the sales team receives to follow up on campaign-generated leads.

### 6. Reactive or Crisis Campaign
When a campaign must respond to an external event -- a competitor announcement, a public relations crisis, a sudden market shift, or an unexpected viral moment -- the standard 3-4 week pre-campaign timeline collapses to hours or days. In this scenario: prioritize message clarity over creative polish; a text-based social post that goes live in 2 hours beats a beautifully designed graphic that takes 48 hours; use owned channels first because they require no external approvals; pause any in-flight campaigns that are tonally inconsistent with the reactive moment; and brief the full team synchronously (one call, not a chain of approval emails). For crisis communications specifically, legal review is the one step that cannot be skipped even in a reactive scenario -- get legal on the same call. Document all decisions and their rationale in real time, because post-crisis debriefs require a record of what was decided and why.

### 7. Always-On Campaign Structure (No Fixed End Date)
Some campaigns -- brand awareness programs, lead generation programs, ongoing retargeting -- are designed to run indefinitely rather than for a fixed period. For always-on campaigns, replace the fixed-duration timeline structure with a monthly cadence: budget is stated as monthly spend rather than total spend; creative is refreshed on a 4-6 week rotation schedule to prevent audience fatigue (ad frequency above 3-4 impressions per week per person typically causes CTR to decline by 30-50%); measurement focuses on trend lines and rolling 30-day averages rather than campaign-specific lift; and a quarterly review replaces the post-campaign report. Include a creative fatigue monitoring trigger in the measurement plan: if CTR declines more than 25% week-over-week for two consecutive weeks, initiate a creative refresh cycle.

### 8. Campaigns With Third-Party or Influencer Components
When a campaign includes paid partnerships, influencer activations, or co-marketing arrangements, additional coordination layers must appear in the brief. Contractual deliverables (post count, content approval rights, usage rights for the brand to repurpose influencer content, exclusivity windows) must be specified in the creative requirements section. Influencer content approval timelines are typically longer than internal creative production -- budget at least 10-14 business days for review cycles when the influencer has content approval rights in their contract. FTC disclosure requirements must be listed as a non-negotiable creative requirement: paid partnerships require explicit disclosure (#ad, #sponsored, or "paid partnership" labels). Include a contingency plan for influencer non-delivery or content that fails brand review -- identify a backup asset or a budget reallocation plan so the channel slot is not empty if an influencer partnership falls through.

---

## Example

**Input:** "We're a B2B project management software company. We want to run a campaign targeting mid-market operations teams (50-500 employees) to drive free trial sign-ups for our new AI scheduling feature. Budget is $40,000 total including creative. We need to launch in 5 weeks and run for 6 weeks. Our current free trial rate from organic traffic is about 150 trials per month. We want to significantly grow that."

---

**Output:**

## Campaign Brief: AI Scheduling Feature -- Free Trial Drive

**Campaign Type:** Feature Launch / Lead Generation
**Objective:** Drive 600 free trial sign-ups for the AI Scheduling feature from operations leaders at mid-market companies (50-500 employees) over 6 weeks -- a 4x increase over organic baseline
**Budget:** $40,000 total ($32,000 media + $8,000 creative production)
**Timeline:** Week 1 of Month 2 to end of Week 6 (6-week active campaign); Pre-campaign production begins 5 weeks prior
**Target Audience:** Operations Managers, Directors of Operations, and COOs at companies with 50-500 employees in industries with complex scheduling needs (professional services, logistics, healthcare staffing, construction project management)
**Campaign Owner:** Head of Demand Generation
**Approvals Required:** VP Marketing (message hierarchy and budget), Legal (claim review), Product Marketing (feature accuracy review)

---

### 1. Campaign Objective

**Primary Goal:** Free trial sign-ups (AI Scheduling feature) from 150/month (organic baseline) to 600 trial starts over the 6-week campaign window (100/week average)
**Stretch Goal:** 780 trial starts (130% of primary target; 130/week)
**Business Context:** The AI Scheduling feature is the product's primary differentiator for Q3. Trial-to-paid conversion for the product currently runs at 28%, meaning 600 trials projects to approximately 168 new paid customers. At an average contract value of $4,800/year, this campaign targets $806,400 in pipeline contribution
**Objective Type:** Lead Generation (top-of-funnel conversion)

**Sanity Check:** At $40K total budget with $32K in media, a target of 600 trials produces a blended Cost Per Trial of $53. This is aggressive but achievable for a B2B SaaS product using a mix of search (high intent), LinkedIn (precise targeting), and retargeting (warm audience). If search CPCs run high, retargeting will be the primary cost-efficiency lever.

---

### 2. Target Audience

| Segment | Description | Est. Size | Funnel Stage | Priority |
|---------|-------------|-----------|--------------|----------|
| Warm prospects (site visitors, non-converting) | People who visited the product website in the last 90 days but did not start a trial | ~8,000 cookies | Consideration | Primary |
| Current free users (non-paid, no AI feature) | Existing free tier users who have not activated the AI Scheduling feature | ~2,200 users | Conversion | Primary |
| Net-new: Operations leaders, mid-market | LinkedIn: Operations Manager / Director / COO, company size 50-500, target industries | ~180,000 on LinkedIn | Awareness / Consideration | Secondary |
| Net-new: High-intent search audience | Google Search users querying "project scheduling software," "AI scheduling tool," "operations management software" | Intent-based, not sized in advance | Consideration / Conversion | Secondary |

**Audience Insights:** Operations leaders in mid-market companies are time-constrained decision-influencers, not always the final budget authority. They respond to proof of time savings (quantified) and peer validation (case studies from similar company sizes). They are skeptical of AI claims without a concrete demonstration -- "AI" alone is not a differentiator; "AI that reduces scheduling conflicts by 40%" is. Free trial framing outperforms demo request framing for this audience because it eliminates the sales interaction barrier at the consideration stage.

**Exclusions:** Current paid subscribers; companies with fewer than 50 employees (below ICP); companies over 500 employees (requires enterprise sales motion, not self-serve trial); recent churned customers (handled by separate retention campaign).

---

### 3. Message Hierarchy

**Campaign Tone:** Direct and credible -- demonstrate value in 10 seconds or explain why in 30

| Level | Message | Purpose | Channel Adaptation |
|-------|---------|---------|-------------------|
| Primary Message | Stop building schedules manually -- our AI does it in under 60 seconds | The one claim that makes the audience stop and engage; quantified, specific, testable | LinkedIn ad headline: "Schedule built in 60 seconds. Not manually." Google ad headline 1: "AI Scheduling -- Built in 60 Seconds." Email subject: "Your team is still building schedules by hand." |
| Supporting Message 1 | Teams using AI Scheduling report 40% fewer scheduling conflicts and 6 hours saved per operations manager per week | Proof-backed benefit; makes the primary claim credible and translates to ROI | Featured in LinkedIn body copy, email body, landing page hero subhead |
| Supporting Message 2 | Free to try -- no credit card, no sales call, live in your workflow today | Removes every friction point the audience would anticipate from a B2B SaaS trial | CTA section of every asset; LinkedIn ad copy line 3; email PS line |
| Proof Point | "We eliminated our weekly scheduling meeting entirely in the first month." -- Sarah T., Director of Operations, 200-person logistics firm | Peer validation from the exact audience archetype; specific outcome, specific company size | LinkedIn carousel slide 3; email mid-body; landing page testimonial section |
| Call-to-Action | Start your free trial -- see your first AI schedule in 60 seconds | Reinforces the primary message through the CTA; makes the trial feel immediate and low-risk | "Start Free Trial" button; LinkedIn CTA button; Google ad CTA extension |

---

### 4. Channel Plan

| Channel | Tactic | Audience Targeting | Format | Frequency / Volume | Budget | Benchmark | Expected Output |
|---------|--------|--------------------|--------|--------------------|--------|-----------|----------------|
| LinkedIn Sponsored Content | Single image ads + Lead Gen Forms (pre-fills LinkedIn profile data into trial sign-up) | Operations Manager / Director / COO, 50-500 employees, professional services + logistics + healthcare staffing industries | 1200x627 static image; 1080x1080 square variant | 3-4 impressions/week per user; continuous 6 weeks | $14,000 (44%) | $60-80 CPM; 0.4-0.6% CTR; $15-25 CPC | 200 trial starts |
| Google Search | Brand terms + feature-intent non-brand terms ("AI scheduling software," "project scheduling tool") | In-market search intent | Responsive Search Ads (RSAs) + Sitelink extensions | Continuous; budget-capped daily | $10,000 (31%) | 3-5% CTR branded; 1.5-2.5% non-branded; $8-14 CPC | 180 trial starts |
| Retargeting (Google Display + Meta) | Retargeting 90-day site visitors who did not convert + lookalike from existing trial users | 90-day pixel audience + 1% lookalike of current trial users | Display banners (728x90, 300x250, 160x600); Meta feed 1080x1080 | 5-6 impressions/week per user; frequency cap at 7/week | $6,000 (19%) | $15-25 CPM retargeting; 0.5-1.2% CTR; $8-18 CPA | 150 trial starts |
| Email to existing free-tier users | 3-email sequence: feature introduction, use case demonstration (video), limited-time upgrade prompt | 2,200 existing free-tier users who have not activated AI Scheduling | HTML email: product screenshot + GIF demo + CTA | 3 sends over 6 weeks; 1 per 2 weeks | $1,000 (3% -- internal tool costs + copywriting) | 20-25% open rate; 3-5% CTR | 70 trial activations |
| Organic LinkedIn (Company Page) | 2 posts/week featuring customer story highlights, product demo clips, and scheduling tips | Company page followers + amplification through employee advocacy | Short-form video (60-90 sec), static graphic, text post with carousel | 2x/week | $1,000 (3% -- content production) | Not a primary conversion driver | Audience warm-up; incremental 20-30 trials |

**Budget Summary:**
- Media spend: $31,000 ($14K LinkedIn, $10K Google Search, $6K Retargeting, $1K Email tool)
- Creative production: $8,000 (copywriting $2K; design assets $4K; video/GIF production $2K)
- Contingency / optimization buffer: $1,000
- Total: $40,000

---

### 5. Creative Requirements

| Asset | Channel | Specs | Copy Requirements | Owner | Due Date |
|-------|---------|-------|-------------------|-------|----------|
| LinkedIn single image ad -- landscape | LinkedIn | 1200x627px, JPG/PNG, max 5MB | Headline: max 70 chars; Body: max 150 chars; must include "free trial" and time-savings claim | Designer | T-10 business days |
| LinkedIn single image ad -- square | LinkedIn | 1080x1080px, JPG/PNG | Same copy; square crop may require image adjustment | Designer | T-10 business days |
| Google RSAs | Google Search | Text only; 15 headlines max 30 chars each; 4 descriptions max 90 chars each | Include brand name in 2 headlines; feature name in 3 headlines; "free trial" in 1 description; "no credit card" in 1 description | Copywriter | T-7 business days |
| Display banner set | Google Display / Retargeting | 728x90, 300x250, 160x600, 300x600 -- all 4 sizes; JPG or HTML5; max 150KB | Headline 6 words max; logo required; "Free Trial" CTA button; no animation exceeding 15 seconds | Designer | T-10 business days |
| Meta retargeting feed ad | Meta | 1080x1080px; 1:1 ratio; keep text under 20% of image area | Primary text: 125 chars; Headline: 40 chars; "Start Free Trial" CTA | Designer | T-10 business days |
| Email 1 -- Feature Introduction | Email (existing users) | HTML email, 600px wide; single CTA button; product screenshot required | Subject line: max 45 chars (mobile preview); Preview text: max 90 chars; Body: 150-200 words; one CTA button "Activate AI Scheduling" | Copywriter + Designer | T-7 business days |
| Email 2 -- Use Case Demo | Email | HTML; animated GIF showing feature in action (max 2MB); or linked video thumbnail | Subject line: different from Email 1; feature a customer outcome in subject; Body: 100-150 words | Copywriter + Designer | T-5 business days |
| Email 3 -- Final Push | Email | HTML; urgency framing; same template as Email 1 | Subject line must include time element; Body: 75-100 words; one CTA | Copywriter | T-3 business days |
| Landing page copy | Web | N/A -- delivered as copy doc | Hero headline mirrors ad primary message; subhead has proof point stat; above-the-fold CTA is "Start Free Trial"; page includes one testimonial, one 60-second demo video embed, and one FAQ section | Copywriter | T-14 business days |
| 60-second product demo video | LinkedIn organic + Email 2 embed | MP4, 1080x1080 or 1920x1080; max 200MB; captions required (85% watched mute); brand/offer in first 3 seconds | Script: demonstrate AI scheduling from blank project to published schedule in under 60 seconds; no voiceover narration required; on-screen text sufficient | Video producer | T-14 business days |

**Creative Notes:**
- All ads must include "Free Trial" language -- this is the primary conversion mechanism and must be visible without requiring a click
- Legal must review any quantified claims before final approval: "40% fewer conflicts" and "6 hours saved per week" require source documentation or must be softened to "up to" language
- Approval chain: Copywriter → Product Marketing (feature accuracy) → Creative Director (brand) → Legal (claims) → Campaign Owner (final)
- Captions are required on all video assets

---

### 6. Campaign Timeline

**Pre-Campaign -- [5 weeks before launch] to [T-1 day]**

| Task | Owner | Deadline | Dependency | Status |
|------|-------|----------|------------|--------|
| Campaign brief finalized and approved | VP Marketing | Week -5, Day 1 | Initial briefing | [ ] |
| Audience segmentation: site retargeting pixel verified, free-tier user list pulled from CRM | Analytics + CRM | Week -5, Day 3 | Brief approved | [ ] |
| LinkedIn Lead Gen Form created and tested | Paid Media Manager | Week -5, Day 3 | Brief approved | [ ] |
| Landing page copy delivered | Copywriter | Week -4, Day 1 | Brief approved | [ ] |
| Landing page built by web team | Web Developer | Week -3, Day 3 | Copy delivered | [ ] |
| Landing page QA: UTM parameters, form submission, thank-you page, pixel firing | Analytics | Week -3, Day 5 | Page built | [ ] |
| Demo video script approved | Product Marketing | Week -4, Day 2 | Brief approved | [ ] |
| Demo video produced and captioned | Video Producer | Week -3, Day 1 | Script approved | [ ] |
| All ad creative assets delivered | Design Team | Week -2, Day 1 -- 10 biz days before launch | Briefs issued Week -4 | [ ] |
| Email copy (all 3 emails) delivered | Copywriter | Week -2, Day 3 | Brief approved | [ ] |
| Legal review of all claims | Legal | Week -2, Day 5 | All copy and creative delivered | [ ] |
| Creative revisions post-legal | Creative Team | Week -1, Day 2 | Legal review complete | [ ] |
| Final stakeholder approval | Campaign Owner | Week -1, Day 3 | Revisions complete | [ ] |
| Ad trafficking: LinkedIn, Google, Meta | Paid Media Manager | Week -1, Day 4 -- 2 biz days before launch | Assets approved | [ ] |
| Email sequences loaded into platform and tested (send test to seed list) | Email Manager | Week -1, Day 4 | Email assets approved | [ ] |
| Tracking verification: fire test conversion on landing page, verify UTM data in Google Analytics, confirm LinkedIn Insight Tag | Analytics | Week -1, Day 5 | All trafficking complete | [ ] |

**Launch Phase -- Launch Day to T+3**

| Task | Owner | Deadline | Status |
|------|-------|----------|--------|
| All paid channels activated (LinkedIn, Google, Meta retargeting) | Paid Media Manager | Launch Day, 9am | [ ] |
| Email 1 sent to free-tier user list | Email Manager | Launch Day, 10am | [ ] |
| Tracking verification: confirm test conversion registered in all dashboards | Analytics | Launch Day, 10am | [ ] |
| Hour-1 delivery check: are ads serving? Is spend pacing correctly? | Paid Media Manager | Launch Day, 10am
