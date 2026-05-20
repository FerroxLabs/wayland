---
name: editorial-calendar
description: |
  Creates 30 or 90-day editorial calendars with content themes, formats, publish
  dates, and keyword targets for content marketing programs. Use when the user
  needs a content calendar, content schedule, publishing plan, or editorial plan.
  Do NOT use for individual content briefs (use `content-brief`), content auditing
  (use `content-audit`), or writing actual content pieces (use `blog-post-writing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "content-marketing writing planning"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Editorial Calendar

## When to Use

Use this skill when the user explicitly needs a structured, multi-week publishing plan -- not a single piece of content.

**Trigger scenarios:**
- User needs a 30, 60, or 90-day content calendar for a blog, newsletter, podcast, or video channel
- User is launching a new content program and needs a framework for what to publish and when
- User wants to coordinate content across multiple channels (e.g., blog + LinkedIn + email) so that content ladder up to a shared theme
- User needs to align content production with a product launch, seasonal campaign, or industry event cycle
- User has a content team and needs a shared operational document for assigning and tracking content work
- User wants to move from ad-hoc publishing ("we post when we have something") to a planned cadence with deliberate keyword and audience targeting
- User is pitching a content program to leadership and needs a concrete, time-bounded plan to show scope and cadence

**Do NOT use when:**
- The user needs a detailed brief for one specific piece of content -- use `content-brief` instead, which captures audience, angle, structure, and source requirements at the piece level
- The user wants to audit existing published content for performance, gaps, or cannibalization -- use `content-audit` instead
- The user wants help writing an individual blog post, article, or newsletter issue -- use `blog-post-writing` instead
- The user wants audience persona documents or customer segmentation -- use `audience-analysis` first, then return to this skill
- The user is asking about social media strategy at the platform level (algorithm, ad spend, follower growth tactics) -- this skill handles social content scheduling, not social strategy
- The user needs a product launch communication plan with press, analyst relations, and internal comms -- that is a different planning artifact
- The user is looking for individual keyword research or topic ideation only -- those are inputs to this process, not the output of it

---

## Process

### Step 1: Collect Content Program Context

Before generating any calendar, establish the foundational inputs. Do not skip this step or assume defaults -- the wrong cadence or channel set will make the entire calendar useless.

- **Business goal:** Identify the primary content marketing objective. The four most common are: (1) organic search growth (SEO-led), (2) pipeline and lead generation (conversion-led), (3) brand authority and thought leadership (positioning-led), and (4) audience retention and community (loyalty-led). Each changes what content types, formats, and keywords to prioritize.
- **Audience:** Get specific beyond "marketers" or "small business owners." The most useful audience description includes role, company size, industry, and the primary frustration or goal driving them to search for or consume this content. A product manager at a 200-person SaaS company has different pain points than a product director at a 5,000-person enterprise.
- **Channels and publishing frequency:** List every channel in scope and its intended cadence. Common combinations: blog 2x/week + newsletter 1x/week; LinkedIn 5x/week + blog 1x/week; YouTube 1x/week + newsletter 2x/week. Frequency is a capacity question -- always push back if the stated cadence is unrealistic given team size.
- **Planning horizon:** Default to 30 days for new programs (prove the cadence first), 90 days for established programs with clear pillars and team bandwidth. Avoid building 60-day calendars -- they are neither tight enough for tactical planning nor broad enough for strategic visibility. Use 30 or 90.
- **Anchor dates:** Collect product launches, trade shows, seasonal peaks, funding announcements, or external events in the planning window. These are fixed points the calendar wraps around.
- **Constraints:** Ask about team capacity (solo writer vs. 3-person team), approval workflows (draft to publish in 3 days vs. 3 weeks), and existing content assets that could be repurposed.

### Step 2: Define Content Pillars

Content pillars are the thematic containers that organize the entire calendar. They prevent topic drift and ensure the content program builds recognizable expertise in specific areas over time.

- Define 3-5 pillars -- never fewer than 3 (too narrow, limits variety) or more than 5 (too broad, prevents deep authority)
- Each pillar should answer a different question your audience is asking, not map to internal product features or org chart divisions
- A strong pillar has a clear audience benefit ("how do I do X better"), a competitive differentiation angle ("what does your brand specifically know about this"), and enough subtopics to sustain 10+ pieces of content without repetition
- Assign target percentage coverage per pillar based on business priority. A common distribution for an SEO-led program: 1 primary pillar at 35%, 2 secondary pillars at 25% each, and 1 supporting pillar at 15%. For thought leadership programs, balance more evenly at 25% each across 4 pillars.
- Validate pillars against your SEO goal: each pillar should correspond to a keyword cluster (a group of semantically related terms). If you cannot name 5-8 distinct keyword targets within a pillar, it is too narrow to sustain a content program.
- Name pillars in plain language your audience uses, not your internal jargon. "Revenue operations" is better than "GTM alignment." "Hiring at scale" is better than "talent acquisition strategy."

### Step 3: Establish the Calendar Architecture

Before filling in individual topics, lay out the structural logic of how weeks and pillars interact.

- **Weekly anchor content:** Every week must have one anchor piece -- a substantive, high-effort content asset that does the strategic heavy lifting. Anchor content types include: long-form blog posts (1,500+ words), original data or survey reports, interview-based articles, video or podcast episodes, or comprehensive guides. Supporting content distributes, repurposes, or extends the anchor.
- **Pillar rotation pattern:** In a 4-pillar program running 30 days, each pillar should appear at least twice in the anchor rotation. In a 90-day program, each pillar should anchor a week at least 5-6 times. Never let a pillar go dark for more than 3 consecutive weeks -- audiences who come for that topic will disengage.
- **Cross-channel content threading:** When a blog post publishes on Tuesday, the newsletter on Friday should reference or extend it, and supporting social posts on Wednesday and Thursday should tease or excerpt it. This threading multiplies reach without requiring new original content for every slot.
- **Buffer allocation:** Reserve 10-15% of all calendar slots as explicit buffer slots for reactive content -- news-jacking, trend responses, or time-sensitive opportunities. In a 30-day blog calendar with 8 planned posts, mark 1-2 as BUFFER. In a 90-day calendar, mark 4-5. Do not leave buffers ambiguous -- put them on specific dates so production schedules account for them.
- **Publish day patterns:** Establish consistent publish days per channel. Research shows Tuesday and Thursday outperform Monday and Friday for blog content consumption in B2B audiences. Newsletters perform best on Tuesday morning or Thursday morning. Social content on LinkedIn peaks mid-week (Tue-Thu), 7-9am or 12-1pm in the audience's primary time zone. These are defaults -- override with the user's historical data if available.

### Step 4: Populate Individual Calendar Entries

For each slot in the calendar, populate all fields with sufficient specificity to hand off to a writer.

- **Topic titles:** Must be specific enough that a writer knows exactly what angle to take. "The Right Way to Write User Stories" is too vague. "How to Write User Stories for Features You Are Still Designing" is actionable. A good test: if two different writers would produce two fundamentally different articles from the same title, the title is not specific enough.
- **Format selection:** Match the format to the content goal and the pillar. How-to guides perform best for high-intent keyword targets. Listicles work well for social sharing and top-of-funnel discovery. Opinion pieces and first-person essays build thought leadership but rarely rank for keywords. Original data or research builds backlinks and PR. Case studies convert existing readers into buyers. Curated roundups are low-production-cost and build goodwill with sources. Each week should include at least 2 different formats.
- **Keyword targets:** For SEO-led programs, assign one primary keyword per piece. Prioritize keywords with 500-10,000 monthly searches (low enough to be winnable for sub-DR60 domains, high enough to generate meaningful traffic). Avoid duplicating the same keyword across two pieces -- this creates keyword cannibalization where both pieces compete and neither ranks well. If two planned pieces target similar terms, combine them or differentiate the angle enough to target distinct intent variants.
- **Content intent classification:** Tag each piece as TOFU (top of funnel, awareness-stage, broad audience), MOFU (middle of funnel, consideration-stage, problem-aware), or BOFU (bottom of funnel, decision-stage, solution-aware). A healthy content mix for lead generation skews 50% TOFU, 30% MOFU, 20% BOFU. A thought leadership program might run 70% TOFU, 25% MOFU, 5% BOFU.
- **Author or owner assignment:** For teams, assign a named owner (not "team") to each piece. Pieces without named owners do not get written.
- **Due dates vs. publish dates:** Distinguish between when the draft is due (publish date minus your review cycle -- typically 5-10 business days for a standard review workflow) and when it publishes. Add both to the calendar if the user has a team.

### Step 5: Incorporate Seasonal, Campaign, and Event Hooks

A calendar that ignores the real-world context around the audience is a missed opportunity.

- **Industry events:** Map trade shows, conferences, and major industry reports to the calendar. Content timed to a major conference (published the week before or week of) earns amplified visibility because the audience is already in a high-attention mode for that topic. The week after a conference is equally valuable for "key takeaways" or "what the industry missed" content.
- **Seasonal demand patterns:** Most industries have predictable search demand cycles. B2B software buyers plan in Q4 and Q1. E-commerce peaks in October-December. Marketing and HR content sees spikes in January (planning season) and September (back-to-business). Use Google Trends data patterns to front-load seasonally relevant content 3-4 weeks before peak demand, not during it -- organic content takes time to rank.
- **Product and company milestones:** Product launches, feature releases, funding rounds, and partner announcements all create content opportunities. A product feature launch is not just a press release -- it is an anchor blog post explaining the problem it solves, a newsletter issue with a behind-the-scenes angle, and a social series of use-case examples.
- **Reactive slots:** Explicitly note in the calendar when reactive content might be needed. If you are in a fast-moving industry (AI, crypto, policy-driven sectors), plan reactive slots weekly. In slower industries, monthly reactive slots are sufficient.
- **Awareness days and cultural moments:** Only include these if there is a genuine, non-forced connection to the brand's content pillars. "National Coffee Day" should not appear in a cybersecurity blog calendar. International Women's Day belongs in a calendar for an HR or DEI-focused brand only if the content says something genuinely substantive -- not performative.

### Step 6: Validate the Calendar for Balance and Production Feasibility

Review the populated calendar against five criteria before delivering it.

- **Pillar distribution check:** Count pieces per pillar. No pillar should exceed its target percentage by more than 10 percentage points or fall below by more than 10 percentage points. If a pillar is over-represented, swap some pieces for underrepresented pillars. If a pillar has no entries for 3+ consecutive weeks, redistribute.
- **Format diversity check:** If any single format represents more than 40% of total pieces, replace some with other formats. A calendar that is 60% blog posts and 40% listicles will produce monotonous content and miss audience segments who prefer different formats.
- **Keyword conflict check:** Scan all keyword targets for semantic overlap. Two pieces targeting "content marketing strategy" and "content strategy for B2B" are too close -- they will compete. Differentiate by intent (one targets beginners, one targets advanced practitioners) or consolidate into a single, more comprehensive piece.
- **TOFU/MOFU/BOFU ratio check:** Verify the funnel stage distribution aligns with the stated business goal. If the user's goal is lead generation but 80% of planned content is TOFU awareness content, flag the imbalance and suggest adding 2-3 MOFU pieces.
- **Production load check:** Calculate total word count burden. A 30-day calendar with 8 blog posts averaging 1,200 words each = 9,600 words of writing per month. For a solo writer producing 3-4 publishable pieces per week, this is feasible. A 90-day calendar with 3 blog posts per week + 1 newsletter = 48 blog posts + 13 newsletters in 90 days -- that requires a team of at least 2-3 writers or a significant repurposing strategy. Flag any calendar where production load exceeds sustainable capacity and propose a reduced cadence alternative.

### Step 7: Build the Distribution Layer

A calendar without a distribution plan produces content that no one sees. For each anchor piece, define the derivative and amplification content.

- **Repurposing map:** For each blog post, identify which newsletter section it feeds, which 2-3 social posts can be derived from it (pull quote, stat, key takeaway, contrarian question), and whether it has video or audio adaptation potential.
- **Internal linking plan:** For SEO programs, note which existing or upcoming pieces should link to each new piece. Content that receives no internal links from other high-traffic pages ranks more slowly regardless of quality. At minimum, each new piece should have 2-3 planned internal links from existing content.
- **Email amplification:** For newsletter-integrated programs, note whether each blog post gets a full newsletter feature, a brief mention in a roundup, or no email promotion. Not every blog post warrants a full newsletter slot -- save featured newsletter placement for anchor content and time-sensitive material.
- **Social threading plan:** Note the LinkedIn, Twitter/X, or other platform posts that will distribute each piece. For LinkedIn in particular, native text posts (not link posts) consistently outperform link-forward posts -- the calendar should note whether social amplification is a native text post adapting the key insight or a link post directing to the article.

### Step 8: Deliver the Calendar with a Usage Guide

The calendar is only useful if the team knows how to operate it.

- Provide explicit instructions for how to handle buffer slots (first-come, first-served for reactive opportunities, but must be approved 48 hours in advance)
- Specify the status tracking workflow: Planned -- In Progress -- In Review -- Approved -- Scheduled -- Published
- Note the review cycle expectation (e.g., "drafts due 7 business days before publish date for standard review; 3 business days for newsletter issues")
- Include a monthly calendar retrospective prompt: which pieces performed best, which pillar drove the most engagement, which formats got the most shares or conversions -- use that data to rebalance the next month's plan
- If the user is building this for a team, call out which fields are writer-owned vs. editor-owned vs. SEO-owned in the calendar template

---

## Output Format

```
## Editorial Calendar: [Brand / Program Name]

**Planning period:** [Start Date] -- [End Date]
**Business goal:** [SEO growth | Lead generation | Thought leadership | Audience retention]
**Primary audience:** [Role], [Company type/size], [Core pain point or goal]
**Channels:** [List all channels]
**Publishing cadence:** [Frequency per channel and days of week]
**Review cycle:** [Number of business days from draft to publish]

---

### Content Pillars

| Pillar | Description | Target % | Keyword Cluster (Examples) | Funnel Stage Mix |
|--------|-------------|----------|---------------------------|-----------------|
| [Pillar 1 name] | [What this covers and why it matters to the audience] | [X%] | [3 example keywords] | [% TOFU / MOFU / BOFU] |
| [Pillar 2 name] | [What this covers and why it matters to the audience] | [X%] | [3 example keywords] | [% TOFU / MOFU / BOFU] |
| [Pillar 3 name] | [What this covers and why it matters to the audience] | [X%] | [3 example keywords] | [% TOFU / MOFU / BOFU] |
| [Pillar 4 name] | [What this covers and why it matters to the audience] | [X%] | [3 example keywords] | [% TOFU / MOFU / BOFU] |

---

### Anchor Content Schedule (High-Level Overview)

| Week | Theme | Anchor Piece | Pillar | Channel |
|------|-------|-------------|--------|---------|
| Week 1 | [theme] | [anchor piece title] | [pillar] | [channel] |
| Week 2 | [theme] | [anchor piece title] | [pillar] | [channel] |
| Week 3 | [theme] | [anchor piece title] | [pillar] | [channel] |
| Week 4 | [theme] | [anchor piece title] | [pillar] | [channel] |
[Continue for all weeks]

---

### Week 1: [Date Range] -- Theme: [Weekly Focus]

**Anchor piece:** [Title]
**Pillar focus:** [Pillar name]

| Date | Day | Channel | Format | Topic Title | Pillar | Target Keyword | Intent | Owner | Status |
|------|-----|---------|--------|-------------|--------|---------------|--------|-------|--------|
| [date] | [Mon/Tue...] | [Blog/Newsletter/LinkedIn...] | [How-to/Listicle/Opinion/Case study...] | [Specific title] | [pillar] | [exact keyword phrase] | [TOFU/MOFU/BOFU] | [name or TBD] | Planned |
| [date] | [day] | [channel] | [format] | [title] | [pillar] | [keyword or --] | [intent] | [owner] | Planned |

**Distribution notes:**
- [Tuesday blog post] feeds [Friday newsletter section]
- [Key stat or quote] repurposed as [Wednesday LinkedIn post]
- Internal links: [existing piece A] and [existing piece B] should link to the Tuesday post

---

[Repeat Week block for each week in planning period]

---

### Content Mix Summary

| Format | Count | % of Total | Primary Goal |
|--------|-------|-----------|-------------|
| How-to guide | [N] | [%] | Keyword ranking / search intent |
| Listicle | [N] | [%] | Social sharing / discovery |
| Opinion / thought leadership | [N] | [%] | Brand positioning |
| Original research / data | [N] | [%] | Backlink acquisition / PR |
| Case study | [N] | [%] | Conversion / bottom-funnel |
| Curated roundup | [N] | [%] | Relationship building / low-cost |
| Newsletter (deep dive) | [N] | [%] | Audience retention |
| Newsletter (curated digest) | [N] | [%] | Audience retention |
| Buffer / reactive | [N] | -- | Timeliness / opportunity |
| **Total** | [N] | 100% | |

### Pillar Distribution Summary

| Pillar | Pieces Planned | % of Total | Target % | Gap |
|--------|---------------|-----------|----------|-----|
| [Pillar 1] | [N] | [%] | [target%] | [+/- X pts] |
| [Pillar 2] | [N] | [%] | [target%] | [+/- X pts] |
| [Pillar 3] | [N] | [%] | [target%] | [+/- X pts] |
| [Pillar 4] | [N] | [%] | [target%] | [+/- X pts] |

### Funnel Stage Distribution

| Stage | Pieces | % of Total | Recommended for [Goal] |
|-------|--------|-----------|----------------------|
| TOFU (awareness) | [N] | [%] | [target %] |
| MOFU (consideration) | [N] | [%] | [target %] |
| BOFU (decision) | [N] | [%] | [target %] |

### Key Dates and Events

| Date | Event/Milestone | Content Tie-In | Lead Time Required |
|------|----------------|---------------|-------------------|
| [date] | [event] | [specific content angle] | [X days before] |
| [date] | [product launch] | [anchor piece + social series] | [X days before] |

### Buffer Slots

| Date | Channel | Notes |
|------|---------|-------|
| [date] | [channel] | Reserved for reactive content -- fill 48hr before publish with editor approval |
| [date] | [channel] | Reserved for reactive content -- fill 48hr before publish with editor approval |

Total buffer slots: [N] ([X]% of calendar)

### Production Load Estimate

| Channel | Pieces | Avg. Length / Duration | Est. Total Effort |
|---------|--------|----------------------|------------------|
| Blog | [N] | [X words avg] | [N total words] |
| Newsletter | [N] | [X words avg] | [N total words] |
| Social posts | [N] | [short-form] | [N posts] |
| **Total written content** | | | [N total words] |
**Recommended minimum team capacity:** [X writers / editor / SEO reviewer]

### Status Workflow

Planned -- In Progress -- In Review -- Approved -- Scheduled -- Published -- Analyzed

**Draft due date rule:** [X] business days before publish date
**Review window:** [X] business days
**Reactive/buffer approval:** [X] hours before publish date
```

---

## Rules

1. **Never build a calendar without content pillars established first.** Pillar-less calendars devolve into random topic collections within 3-4 weeks. Even if the user says "just give me topics," define 3-5 pillars before populating any entries. A calendar without pillars cannot be evaluated for balance or extended for a subsequent period.

2. **Never assign the same primary keyword to two different pieces.** Keyword cannibalization is one of the most common and damaging errors in content programs -- two pieces targeting the same term split ranking signals and neither performs as well as one consolidated piece would. If two planned pieces target near-identical terms, either merge them into a more comprehensive piece or differentiate one toward a clearly distinct intent variant (informational vs. commercial, beginner vs. advanced).

3. **Never schedule more than 40% of slots as a single content format.** A calendar dominated by one format (all listicles, all how-to guides, all opinion pieces) fails to serve the full audience and limits SEO and distribution potential. Enforce format diversity at the weekly level -- no week should have all entries in the same format.

4. **Never use topic titles that could apply to anyone in any industry.** "Tips for Better Marketing," "How to Grow Your Business," and "The Future of Work" are not topics -- they are categories. Every title must be specific enough that a freelance writer with no brand context could produce the correct article. Test: if the title could appear unchanged in a competitor's blog, it is not specific enough.

5. **Never let a content pillar go dark for more than 3 consecutive weeks.** Audiences who discover your content through one pillar expect continuity. A 4-week gap in User Research content from a brand known for user research creates dissonance and loses audience trust. Build rotation checks into the review step.

6. **Never publish every slot -- build in buffer capacity.** A 100% planned calendar with no flexibility is an operational risk. Any production delay or reactive opportunity will either cause a missed publish date or require a last-minute scramble that degrades quality. Buffer slots are not wasted capacity -- they are risk management.

7. **Never confuse the newsletter's job with the blog's job.** The blog primarily serves discoverability (SEO, social sharing, first-time audience acquisition). The newsletter primarily serves retention (deepening relationship with existing subscribers). Topics, angles, and formats that work for one channel often underperform on the other. Newsletter content should be more personal, more opinionated, or more behind-the-scenes than the average blog post targeting the same theme.

8. **Never skip the production load estimate.** The most common editorial calendar failure mode is not bad strategy -- it is capacity mismatch. A team that cannot sustain the planned cadence will miss dates, reduce quality, or abandon the calendar entirely. Always calculate total word volume and flag if it exceeds approximately 8,000 words per writer per month for solo writers or 5,000-6,000 words per writer on teams with review cycles.

9. **Always specify funnel stage (TOFU/MOFU/BOFU) for every entry.** Without funnel stage tracking, content programs almost always over-index on TOFU content (it is easier to write about broad awareness topics) and neglect MOFU and BOFU content that actually drives conversions. The funnel stage tag forces the planner to verify that consideration and decision-stage content is present.

10. **Always treat the calendar as a living document with a defined review cadence.** A calendar built in January should not operate unmodified through March. Build in a monthly retrospective: review which pieces published, which performed, which were delayed, and which pillar is over- or under-indexed. Adjust the next month's plan based on data, not on the original plan's assumptions.

11. **Always distinguish between publish date and draft-due date.** A publish date without a draft-due date is aspirational, not operational. For a team with a 7-business-day review cycle, a March 15 publish date means the draft is due March 6. Without this math explicit in the calendar, dates will slip.

12. **Never include awareness days, cultural moments, or trending hashtags that require a rhetorical stretch to connect to the brand.** Forced relevance ("Happy Pi Day from [CRM Software Company]!") damages brand credibility more than it helps. If the content hook requires more than one logical step to connect to the brand's content pillars, cut it.

---

## Edge Cases

### New program with no existing audience or keyword data
When the user has no prior content program, no analytics, and no keyword research, do not fill a 90-day calendar with specific keyword targets you cannot validate. Instead: build a 30-day calendar at a conservative cadence (1-2 blog posts per week maximum for a solo operator), use topic-first planning based on the audience's documented pain points, and explicitly mark keyword targets as "to be validated" with a note to run keyword research using the pillar themes before publishing. Recommend the user set up Google Search Console on day one so that post-publish query data begins accumulating. After 60 days of publishing, enough signal will exist to refine keyword targeting for the next planning period.

### User manages simultaneous content programs for multiple brands or product lines
Do not combine multiple brands into a single calendar -- brand voice, audience, and pillar differentiation will collapse. Build separate calendar documents per brand. However, if content themes overlap (two brands both cover "enterprise security," for example), add a cross-promotion row to each calendar noting where one brand's content could be referenced by the other, and where the same research or data asset could be used to generate distinct pieces for each brand. This reduces production burden without sacrificing brand separation.

### Requested cadence exceeds team capacity
If a user requests a calendar at a cadence that exceeds realistic production capacity -- for example, daily blog publishing for a solo writer -- do not silently comply by building an unrealistic calendar. Flag the issue explicitly: a solo writer producing 22 blog posts in 30 days at 1,000+ words each is approximately 22,000 words of publishable content per month, which is not sustainable without significant editorial shortcuts or AI-assisted drafting. Propose a reduced cadence alternative (3x/week blog at 12 posts/month), explain the production math, and let the user decide. If they still want daily publishing, shift to a mixed-length format calendar where 3 posts per week are full-length articles and the remaining slots are short-form (300-500 word quick takes, roundups, or repurposed social-to-blog content).

### User has existing content that should be repurposed, not replaced
If the user mentions having an archive of existing blog posts, podcast episodes, webinar recordings, or research reports, treat these as production capacity multipliers before assuming all new content must be created from scratch. Audit the most relevant existing assets (even informally), identify which ones can be updated and republished (content refreshes for SEO), which can be reformatted (turning a webinar into a blog post), and which can be threaded into the newsletter. A content refresh of a high-traffic post with outdated information often generates more SEO value than a new post on the same topic, and costs less production effort. Build at least 20% of a 90-day calendar as "refresh or repurpose" entries when the user has existing content.

### User publishes across more than four channels simultaneously
Calendars covering six or more channels (blog + newsletter + LinkedIn + Twitter + Instagram + YouTube) become difficult to manage in a single table without collapsing readability. In this case, build the calendar in two layers: (1) a master thematic calendar showing weekly anchor content and cross-channel theme, and (2) channel-specific sub-tables for each distribution channel showing that channel's specific schedule. This prevents the master table from becoming a 12-column monstrosity while keeping all channel schedules visible within the same document. Flag to the user that content governance across 6+ channels typically requires a dedicated content operations tool (an asynchronous project management workflow, not just a spreadsheet) to avoid scheduling conflicts and missed dates.

### User operates in a regulated industry (healthcare, finance, legal)
Compliance review cycles are non-negotiable constraints in regulated industries and must be built into the calendar's production timeline, not treated as optional. For healthcare content under FDA guidelines or financial content under FINRA/SEC guidance, draft-to-publish cycles commonly run 15-30 business days when legal or compliance review is required. Build the calendar with dual date columns: Draft Due, Compliance Review Submitted, Expected Clearance, Publish Date. Never place time-sensitive content (conference tie-ins, news commentary) on regulated industry calendars without a clear plan for expedited review or a pre-approved content template that bypasses standard review. Pillar topics should be reviewed at the pillar level for compliance sensitivity before the full calendar is built -- some topic areas may be off-limits entirely regardless of how carefully they are framed.

### Pillar topics face high-competition keyword environments
In categories where domain authority of competitors is very high (major tech publications, industry associations, category leaders with DR 80+), standard keyword targeting for mid-volume terms will not produce rankings for a domain with DR below 50. In this case, restructure the SEO component of the calendar toward long-tail keyword clusters (3-5 word phrases, 100-500 monthly searches, low keyword difficulty) and content differentiation strategies that compete on depth, original data, or specific audience niches rather than broad head terms. A company with a DR of 35 will not rank for "product management" -- but it can rank for "product management frameworks for hardware startups" or "product prioritization for teams under 10 engineers." Adjust the keyword column of every blog entry to reflect this constraint and note the domain authority issue explicitly in the calendar header.

### User requests a full-year calendar
Annual editorial calendars at the topic level are speculative and almost always become obsolete within 60-90 days as business priorities shift, audience data accumulates, and industry events evolve. Build the year in quarterly blocks: deliver Q1 as a fully detailed calendar with specific topics, dates, keywords, and format assignments. Deliver Q2-Q4 as pillar-level frameworks with thematic focus areas, anchor content types, and seasonal hooks identified -- but leave topic titles and keyword assignments blank. Include a quarterly review instruction: at the end of each quarter, use performance data from the prior quarter to refine the next quarter's plan before populating it fully. This gives leadership the annual view they want while preserving the tactical flexibility to make the calendar actually work.

---

## Example

**Input:** "I need a 30-day editorial calendar for a B2B cybersecurity company. We sell endpoint security software to IT directors and security managers at mid-market companies (500-5,000 employees). Our goals are organic search growth and positioning ourselves as a thought leader. We publish 2 blog posts per week and 1 newsletter per week. We have 2 writers and an editor. Our review cycle is 5 business days. We have a big webinar coming up on March 18 about ransomware response."

---

## Editorial Calendar: Vantix Security Blog + Newsletter

**Planning period:** March 3 -- March 31
**Business goal:** Organic search growth (primary) + thought leadership positioning (secondary)
**Primary audience:** IT Directors and Security Managers at mid-market companies (500-5,000 employees) -- responsible for endpoint protection decisions, stretched thin on resources, under pressure from executive leadership after industry breach news cycles
**Channels:** Blog (2x/week), Newsletter (1x/week)
**Publishing cadence:** Blog: Tuesday and Thursday; Newsletter: Friday
**Review cycle:** 5 business days (draft due Monday for Thursday publication; draft due Wednesday of prior week for Tuesday publication)
**Team:** Writer A, Writer B, Editor (Jess)

---

### Content Pillars

| Pillar | Description | Target % | Keyword Cluster (Examples) | Funnel Stage Mix |
|--------|-------------|----------|---------------------------|-----------------|
| Threat Intelligence | Real-world attack patterns, ransomware, phishing, zero-day threats -- what IT teams actually face | 35% | ransomware response plan, endpoint threat detection, zero day attack prevention | 60% TOFU / 30% MOFU / 10% BOFU |
| Endpoint Security Operations | How to implement, configure, and manage endpoint protection in mid-market environments | 30% | endpoint security for small teams, EDR vs antivirus, endpoint detection and response setup | 30% TOFU / 50% MOFU / 20% BOFU |
| Compliance and Risk Management | Meeting NIST, SOC 2, CIS Controls, and cyber insurance requirements without a large security team | 20% | SOC 2 endpoint requirements, CIS controls implementation, cyber insurance checklist | 20% TOFU / 50% MOFU / 30% BOFU |
| Security Team Leadership | Managing security programs, communicating risk to the board, building security culture | 15% | security awareness training program, presenting security risk to board, CISO communication | 70% TOFU / 25% MOFU / 5% BOFU |

---

### Anchor Content Schedule

| Week | Theme | Anchor Piece | Pillar | Channel |
|------|-------|-------------|--------|---------|
| Week 1 | Endpoint Fundamentals | How Mid-Market Companies Should Choose Between EDR and Antivirus in 2024 | Endpoint Ops | Blog (Tue) |
| Week 2 | Ransomware Readiness | Ransomware Response Plan Template: What to Do in the First 72 Hours | Threat Intelligence | Blog (Tue) |
| Week 3 | Compliance Pressure | SOC 2 Type II Endpoint Requirements: A Checklist for Companies Without a Dedicated Security Team | Compliance | Blog (Tue) |
| Week 4 | Board Communication | How to Present Endpoint Security Risk to a Board That Does Not Speak Technical | Leadership | Blog (Tue) |

---

### Week 1: Mar 3-7 -- Theme: Endpoint Security Fundamentals

**Anchor piece:** How Mid-Market Companies Should Choose Between EDR and Antivirus in 2024
**Pillar focus:** Endpoint Security Operations

| Date | Day | Channel | Format | Topic Title | Pillar | Target Keyword | Intent | Owner | Status |
|------|-----|---------|--------|-------------|--------|---------------|--------|-------|--------|
| Mar 4 | Tue | Blog | Comparison guide | How Mid-Market Companies Should Choose Between EDR and Antivirus in 2024 | Endpoint Ops | edr vs antivirus mid-market | MOFU | Writer A | Planned |
| Mar 6 | Thu | Blog | Listicle | 7 Signs Your Current Antivirus Is Not Protecting You From Modern Threats | Threat Intelligence | signs antivirus not enough | TOFU | Writer B | Planned |
| Mar 7 | Fri | Newsletter | Curated digest | What IT Teams Are Talking About This Week: Endpoint Protection Trends | Endpoint Ops | -- | TOFU | Editor | Planned |

**Distribution notes:**
- Mar 4 blog (EDR vs Antivirus) features in Friday newsletter as "this week's deep dive" with 200-word summary and link
- Pull key stat from Mar 4 post ("EDR detects 60% more threats than signature-based AV in mid-market environments") for a Wednesday LinkedIn native text post -- Writer A drafts
- Mar 6 listicle promoted as Thursday LinkedIn link post with "which of these 7 signs does your environment show?" CTA

**Internal links:** Link Mar 4 post to existing "What is Endpoint Detection and Response" explainer; link Mar 6 listicle to Mar 4 comparison guide

---

### Week 2: Mar 10-14 -- Theme: Ransomware Response Readiness

**Anchor piece:** Ransomware Response Plan Template: What to Do in the First 72 Hours
**Pillar focus:** Threat Intelligence
**Note:** Anchor piece supports March 18 webinar registration -- include webinar CTA in body and sidebar

| Date | Day | Channel | Format | Topic Title | Pillar | Target Keyword | Intent | Owner | Status |
|------|-----|---------|--------|-------------|--------|---------------|--------|-------|--------|
| Mar 11 | Tue | Blog | How-to guide + template | Ransomware Response Plan Template: What to Do in the First 72 Hours | Threat Intelligence | ransomware response plan template | MOFU | Writer A | Planned |
| Mar 13 | Thu | Blog | Data-driven post | Ransomware Costs Mid-Market Companies an Average of $1.4M Per Incident -- Here Is Where the Money Goes | Threat Intelligence | ransomware cost mid-market | TOFU | Writer B | Planned |
| Mar 14 | Fri | Newsletter | Deep dive | Before the Webinar: What We Know About Ransomware Response That Most IT Teams Get Wrong | Threat Intelligence | -- | MOFU | Editor | Planned |

**Distribution notes:**
- Both blog posts and Friday newsletter should include a webinar registration CTA (March 18 event)
- Mar 11 template piece earns a gated PDF version for lead capture -- coordinate with demand gen team before publish
- Mar 13 cost data post ideal for LinkedIn as a native post leading with the $1.4M figure -- high shareability, Writer B drafts social adaptation

---

### Week 3: Mar 17-21 -- Theme: Compliance Without a Big Team

**Anchor piece:** SOC 2 Type II Endpoint Requirements: A Checklist for Companies Without a Dedicated Security Team
**Pillar focus:** Compliance and Risk Management
**Note:** March 18 webinar -- newsletter this week covers post-webinar takeaways rather than pre-event promotion

| Date | Day | Channel | Format | Topic Title | Pillar | Target Keyword | Intent | Owner | Status |
|------|-----|---------|--------|-------------|--------|---------------|--------|-------|--------|
| Mar 18 | Tue | Blog | Checklist / guide | SOC 2 Type II Endpoint Requirements: A Checklist for Companies Without a Dedicated Security Team | Compliance | SOC 2 endpoint requirements checklist | MOFU | Writer B | Planned |
| Mar 20 | Thu | Blog | Opinion piece | Why Cyber Insurance Requirements Are Actually Making Mid-Market Security Better | Compliance | cyber insurance security requirements | TOFU | Writer A | Planned |
| Mar 21 | Fri | Newsletter | Event recap | 5 Things Our Ransomware Response Webinar Audience Asked That You Should Know | Threat Intelligence | -- | TOFU | Editor | Planned |

**Distribution notes:**
- Mar 18 checklist piece can be repurposed as a downloadable PDF with Vantix branding -- high MOFU conversion potential
- Mar 21 newsletter leverages webinar Q&A content -- Editor pulls top 5 unanswered or most-asked questions from the live event
- Mar 20 opinion piece seeded to LinkedIn as a longer-form native post (500+ words) to build thought leadership visibility -- Writer A adapts

---

### Week 4: Mar 24-31 -- Theme: Security Leadership and Board Communication

**Anchor piece:** How to Present Endpoint Security Risk to a Board That Does Not Speak Technical
**Pillar focus:** Security Team Leadership

| Date | Day | Channel | Format | Topic Title | Pillar | Target Keyword | Intent | Owner | Status |
|------|-----|---------|--------|-------------|--------|---------------|--------|-------|--------|
| Mar 25 | Tue | Blog | How-to guide | How to Present Endpoint Security Risk to a Board That Does Not Speak Technical | Leadership | presenting security risk to board | TOFU | Writer A | Planned |
| Mar 27 | Thu | Blog | BUFFER -- reactive slot | Reactive content -- hold for news or opportunity | -- | -- | -- | TBD | Buffer |
| Mar 28 | Fri | Newsletter | Curated digest | This Month in Endpoint Security: March Recap and What to Watch in April | Leadership | -- | TOFU | Editor | Planned |

**Distribution notes:**
- Mar 25 board communication post is highly shareable with security directors -- LinkedIn native post leading with "the one metric your board actually understands" framing
- Buffer slot (Mar 27) to be filled if major breach news, CVE disclosure, or regulatory update emerges in the week of Mar 24; otherwise leave unpublished or fill with a lightweight roundup
- Mar 28 newsletter serves as a monthly wrap-up -- reference top 3 performing posts from March and preview April themes

---

### Content Mix Summary

| Format | Count | % of Total | Primary Goal |
|--------|-------|-----------|-------------|
| How-to guide | 2 | 18% | Keyword ranking / search intent |
| Comparison guide | 1 | 9% | Keyword ranking / MOFU conversion |
| Listicle | 1 | 9% | Social sharing / TOFU discovery |
| Data-driven post | 1 | 9% | Backlink potential / PR |
| Checklist / guide | 1 | 9% | MOFU conversion / lead gen |
| Opinion piece | 1 | 9% | Thought leadership positioning |
| Newsletter (deep dive) | 1 | 9% | Audience retention / MOFU |
| Newsletter (curated digest) | 2 | 18% | Audience retention / TOFU |
| Newsletter (event recap) | 1 | 9% | Audience retention / engagement |
| Buffer / reactive | 1 | -- | Timeliness / opportunity |
| **Total** | **12 planned** | **100%** | |

### Pillar Distribution Summary

| Pillar | Pieces Planned | % of Total | Target % | Gap |
|--------|---------------|-----------|----------|-----|
| Threat Intelligence | 4 | 33% | 35% | -2 pts (within range) |
| Endpoint Security Operations | 3 | 25% | 30% | -5 pts (monitor) |
| Compliance and Risk Management | 3 | 25% | 20% | +5 pts (within range) |
| Security Team Leadership | 2 | 17% | 15% | +2 pts (within range) |

### Funnel Stage Distribution

| Stage | Pieces | % of Total | Recommended for SEO + Thought Leadership |
|-------|--------|-----------|----------------------------------------|
| TOFU (awareness) | 6 | 50% | 50% -- on target |
| MOFU (consideration) | 5 | 42% | 35% -- slightly high, acceptable |
| BOFU (decision) | 0 | 0% | 15% -- gap; address in April calendar |

**Note:** No BOFU content is scheduled this month. For April, plan 2 BOFU pieces -- customer case study or product comparison page targeting high-intent terms like "best endpoint security for mid-market" or "Vantix vs [competitor]."

### Key Dates and Events

| Date | Event/Milestone | Content Tie-In | Lead Time Required |
|------|----------------|---------------|-------------------|
| Mar 18 | Vantix Ransomware Response Webinar | Anchor blog post (Mar 11) + newsletter (Mar 14) pre-promote; Newsletter (Mar 21) recaps takeaways | Blog published 7 days before; newsletter 4 days before |
| Mar 31 | End of Q1 / fiscal year-end for many mid-market companies | March 28 newsletter acknowledges Q1 security priorities and sets up April as planning season | None -- newsletter is recap format |

### Buffer Slots

| Date | Channel | Notes |
|------|---------|-------|
| Mar 27 | Blog | Reserved for reactive content -- breach news, CVE, regulatory update, or webinar follow-up extension; Editor approves topic 48 hours before; if no topic, slot remains empty |

Total buffer slots: 1 (8% of blog calendar -- on the lower end; consider 2 buffers in April if March reactive volume is high)

### Production Load Estimate

| Channel | Pieces | Avg. Length | Est. Total Effort |
|---------|--------|-------------|------------------|
| Blog posts | 8 planned + 1 buffer | 1,200 words avg | ~9,600 publishable words |
| Newsletters | 4 | 500 words avg | ~2,000 words |
| **Total** | | | **~11,600 words** |

**Recommended capacity:** 2 writers at ~5,800 words each per month -- within range for quality output with a 5-business-day review window.
**Draft due dates:** All Thursday blog posts require drafts by the prior Thursday (5 business days); all Tuesday blog posts require drafts by the prior Tuesday. Newsletter drafts due Wednesday for Friday publication.

### Status Workflow

Planned -- In Progress -- In Review (Jess) -- Approved -- Scheduled -- Published -- Analyzed

**Monthly retrospective trigger:** April 1 -- review March publish performance (organic traffic, email open rate, LinkedIn engagement) and use findings to rebalance April pillar distribution and format mix.
