---
name: create-content-calendar
description: |
  Guides the user through building a strategic content calendar from
  content audit through audience analysis, editorial planning, and
  repurposing strategy. Use when the user needs to plan content across
  weeks or months, wants to organize their publishing schedule, or needs
  a systematic approach to content planning that aligns with audience needs.
  Do NOT use for writing individual posts (use publish-blog-post), for
  one-time content creation (use content-brief), or for social media
  strategy only (use seo-content-strategy).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "content-marketing planning strategy step-by-step"
  category: "content-creation"
  depends: "content-audit audience-analysis editorial-calendar content-repurposing"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Create a Content Calendar

A four-step workflow that produces a strategic content calendar built on audience data and content gap analysis. The calendar is not just a schedule of dates and topics -- it is a content strategy document that maps audience needs to content types, establishes publishing rhythms, and maximizes the value of each piece through systematic repurposing.

**Estimated time:** 3-5 hours (depending on volume of existing content to audit and number of channels)

## When to Use

- User wants to plan their content publishing schedule for the next month, quarter, or year
- User is starting a blog, newsletter, or content program and needs a strategic foundation
- User has been publishing inconsistently and wants to establish a sustainable rhythm
- User wants to audit existing content and identify gaps before planning new content
- Do NOT use when: the user just needs to write a single post (use publish-blog-post), needs a one-off content brief (use content-brief), or wants to build an SEO keyword strategy without a calendar (use seo-content-strategy)

## Prerequisites

Before starting this workflow, ensure:

1. **Content channels identified:** The user knows where they publish (blog, newsletter, social media, YouTube, podcast, or any combination). The calendar will cover all channels.
2. **Access to existing content:** If the user has previously published content, gather URLs, post titles, or a content inventory. If starting from scratch, note that Step 1 will be abbreviated.
3. **Business or personal goals:** The user has at least one goal their content should serve -- brand awareness, lead generation, audience growth, thought leadership, community building, or revenue.
4. **Time budget:** The user has a realistic estimate of how many hours per week they can dedicate to content creation. The calendar will be scaled to match available capacity.

## Steps

**Step 1: Content Audit** (uses: content-audit)

Evaluate all existing content to identify what has performed well, what has gaps, and what can be updated or retired. For new creators with no existing content, this step catalogs competitor content and industry benchmarks instead.

- Input: List of published content (URLs, titles, publication dates), analytics data if available (page views, engagement, conversion), and the user's content goals
- Output: A content audit report containing: inventory of all existing content categorized by topic, format, and channel; performance analysis identifying top performers and underperformers; content gap analysis showing topics the audience needs but the user has not covered; a list of content eligible for updating, consolidating, or retiring; and competitor content benchmarks for the user's niche
- Key focus: The gap analysis is the most valuable output. It directly feeds Step 3's editorial planning by identifying exactly what topics and formats are missing. Resist the temptation to skip the audit for new creators -- auditing competitor content provides the same strategic value.

**Step 2: Audience Analysis** (uses: audience-analysis)

Define who the content serves, what they need, and how they consume content. Audience analysis transforms content planning from guesswork to data-informed decisions about topics, formats, and timing.

- Input: Content audit results from Step 1 (especially top-performing content topics), any existing audience data (email subscriber demographics, social media analytics, customer profiles), and the user's business goals
- Output: An audience profile containing: 1-3 audience personas with demographics, pain points, content preferences, and preferred platforms; a content affinity map showing which topics resonate with each persona; preferred content formats per persona (long-form articles, quick tips, video, newsletter, infographic); optimal publishing times based on audience activity data; and a content tone and style recommendation matched to audience expectations
- Key focus: Match content capacity to audience needs. If the audience primarily consumes video but the creator can only produce written content, the calendar should plan written content optimized for the platforms the audience uses, not force the creator into video production they cannot sustain.

**Step 3: Build the Editorial Calendar** (uses: editorial-calendar)

Create the actual calendar with assigned dates, topics, formats, and responsible parties. The calendar synthesizes the content gaps from Step 1 and the audience preferences from Step 2 into a concrete publishing plan.

- Input: Content gap analysis from Step 1, audience personas and content preferences from Step 2, the user's available time budget, and any fixed dates or events (product launches, seasonal events, industry conferences)
- Output: A complete editorial calendar containing: specific content pieces assigned to dates with topic, format, target persona, target keyword, and channel; a sustainable publishing frequency matched to the creator's time budget; themed content series or clusters that build authority on key topics; placeholder slots for timely or reactive content; and status tracking columns (idea, outlined, drafted, edited, published)
- Key focus: Sustainability beats ambition. A calendar that calls for 3 posts per week but only gets followed for 2 weeks delivers less value than a calendar calling for 1 post per week that gets followed for 6 months. Set the frequency at 70% of the creator's maximum capacity to leave room for quality and unexpected demands.

**Step 4: Repurposing Strategy** (uses: content-repurposing)

Design a system for extracting maximum value from each piece of content by adapting it across formats and channels. Repurposing is not reposting -- it is transforming content to match the conventions and audience expectations of each channel.

- Input: Completed editorial calendar from Step 3, audience channel preferences from Step 2, and the creator's channel list
- Output: A repurposing plan containing: for each calendar entry, 2-4 derivative content pieces mapped to different channels (e.g., blog post becomes newsletter summary, 3 social media posts, and a short video script); a repurposing workflow showing the sequence and timing of derivative content relative to the original; templates for common repurposing transformations (article-to-thread, article-to-newsletter, article-to-carousel); and estimated additional time per piece for repurposing (typically 30-60 minutes per derivative)
- Key focus: Not all content is worth repurposing. Apply the 80/20 rule: identify the 20% of planned content with the highest strategic value and build full repurposing chains for those pieces. The remaining 80% gets published on the primary channel only. This prevents repurposing from consuming more time than original creation.

## Output Format

```
## Content Calendar: [Brand/Creator Name] -- [Time Period]

### Content Audit Summary
- **Total Existing Pieces:** [count]
- **Top Performers:** [list top 3 by engagement metric]
- **Underperformers:** [count] pieces to update or retire
- **Content Gaps Identified:** [count] topics missing
  1. [gap topic 1] -- [why the audience needs it]
  2. [gap topic 2] -- [why the audience needs it]
  3. [gap topic 3] -- [why the audience needs it]

### Audience Personas
**Persona 1: [Name]**
- Demographics: [age, role, industry]
- Pain points: [top 3]
- Preferred formats: [list]
- Preferred channels: [list]
- Best publishing times: [days and times]

### Editorial Calendar

| Week | Date       | Topic                    | Format    | Channel  | Persona | Keyword       | Status |
|------|------------|--------------------------|-----------|----------|---------|---------------|--------|
| 1    | [date]     | [topic]                  | [format]  | [channel]| [name]  | [keyword]     | Idea   |
| 2    | [date]     | [topic]                  | [format]  | [channel]| [name]  | [keyword]     | Idea   |

- **Publishing Frequency:** [X] pieces per [week/month]
- **Content Pillars:** [pillar 1], [pillar 2], [pillar 3]
- **Reactive Slots:** [count] placeholder dates for timely content

### Repurposing Plan
| Original Piece          | Derivative 1       | Derivative 2        | Derivative 3         | Extra Time |
|------------------------|--------------------|---------------------|----------------------|------------|
| [blog post title]      | Newsletter summary | LinkedIn post       | Twitter/X thread     | 45 min     |
| [blog post title]      | Email highlight    | Instagram carousel  | Community post       | 60 min     |

- **Total Weekly Time:** [hours] (creation) + [hours] (repurposing) = [hours total]
- **Capacity Check:** [within budget / over budget by X hours]
```

## Decision Points

- **Before Step 1 (single channel vs multi-channel):** If the user publishes on a single channel only, simplify Steps 2 and 4. The audience analysis focuses on one platform's analytics, and the repurposing strategy focuses on format variations within that channel (e.g., long-form posts vs quick tips on the same blog) rather than cross-channel adaptation.
- **After Step 1 (content team vs solo creator):** If the user works with a content team, the editorial calendar in Step 3 must include assignment columns (who writes, who edits, who publishes) and an approval workflow. If the user is a solo creator, the calendar focuses on personal time management -- when to research, when to write, when to publish.
- **After Step 2 (frequency decision):** If the audience analysis reveals the audience expects daily content (common in social media-heavy niches), but the creator can only produce weekly content, resolve this by using repurposing (Step 4) to fill daily slots with derivative content from weekly originals, rather than increasing the original creation frequency.
- **After Step 3 (evergreen vs timely mix):** If the calendar is more than 70% timely content (news, trends, commentary), add an evergreen content track. Timely content drives short-term engagement but evergreen content drives long-term SEO value. Target a 60/40 or 50/50 split between evergreen and timely content.
- **At any point:** If the user's goals change mid-planning (e.g., from brand awareness to lead generation), return to Step 2 to re-evaluate audience targeting, then rebuild the calendar in Step 3. The content audit from Step 1 remains valid.

## Failure Handling

- **Step 1 fails (no content and no competitor data):** If the user has no existing content and cannot identify competitors or industry benchmarks, skip the audit and start with Step 2. Use audience analysis to identify content needs directly. The calendar will be hypothesis-driven rather than data-driven for the first quarter, with a planned re-audit after 3 months of publishing.

- **Step 2 produces vague personas:** If the audience analysis yields generic personas ("small business owners who want to grow"), push for specificity by answering: What is the audience's single biggest frustration? What have they already tried that did not work? What would success look like for them in 90 days? If data is insufficient for specificity, create a single "best guess" persona and plan content experiments in Step 3 to validate or refine it.

- **Step 3 produces an unsustainable calendar:** If the calendar requires more time than the creator has available, reduce frequency before reducing quality. Cut the publishing schedule to the minimum viable frequency (1 post/week for blogs, 1 email/week for newsletters, 3 posts/week for social media) and reallocate the saved time to repurposing in Step 4.

- **Step 4 repurposing creates overwhelming workload:** If the repurposing plan adds more than 50% to the total content creation time, scale back to repurposing only the single highest-value piece per week. Build repurposing capacity gradually as the creator develops templates and workflows that reduce per-piece effort.

- **User wants to change direction mid-workflow:** The content audit from Step 1 is reusable regardless of direction changes. If goals or audience change, restart from Step 2 with the existing audit data. The calendar (Step 3) and repurposing plan (Step 4) must be rebuilt.

## Expected Outcome

When this workflow is complete, the user will have:

1. A content audit documenting existing content performance, gaps, and opportunities
2. Detailed audience personas with content preferences and consumption patterns
3. A complete editorial calendar with topics, dates, formats, and assignments for the planning period
4. A repurposing strategy that multiplies the value of each content piece across channels
5. A sustainable content rhythm that matches the creator's capacity to their audience's needs
6. A foundation for measuring content performance against the calendar's goals

## Edge Cases

- **User is starting from scratch with zero existing content.** Abbreviate Step 1 to a competitor-only audit. Identify 3-5 competitors or industry leaders, catalog their content mix (topics, formats, frequency), and use their gaps as the user's content opportunities. Proceed to Step 2 with competitive benchmarks instead of performance data.
- **User has hundreds of existing content pieces.** Focus the Step 1 audit on the last 12 months and the top/bottom 20% by performance. A comprehensive audit of 500+ pieces is impractical in one session. Flag the remaining content for a phased audit over the next quarter.
- **User publishes in multiple languages.** Create separate audience personas per language in Step 2, and separate calendar tracks in Step 3. Repurposing in Step 4 can include translation as a derivative format, but translated content must be adapted for cultural context, not just word-for-word translated.
- **User has seasonal business cycles.** In Step 3, front-load content production during slow seasons to build a buffer for busy seasons. The calendar should show both publishing dates and production dates, offset by the lead time needed for each piece.
- **User's content team has uneven skill sets.** In Step 3, assign content types to team members based on their strengths (e.g., technical writer handles how-to guides, marketing writer handles thought leadership). The calendar becomes a skills-matched assignment system, not just a date-topic grid.
- **User wants to add a new channel mid-calendar.** Insert the new channel into Step 4's repurposing plan first -- derive content for the new channel from existing planned pieces before creating original content for it. This validates the channel with minimal investment before committing to original content production.

## Example

**Input:** "I am a freelance UX designer who wants to build thought leadership through content. I have published 12 blog posts over the past year but have no consistent schedule. I can spend about 5 hours per week on content. I publish on my personal blog and LinkedIn."

**Output:**

## Content Calendar: UX Design Thought Leadership -- Q2

### Content Audit Summary
- **Total Existing Pieces:** 12 blog posts over 12 months
- **Top Performers:** (1) UX case study: e-commerce redesign (2,400 views), (2) Career advice: breaking into UX (1,100 views), (3) Tool tutorial: Figma auto-layout (800 views)
- **Underperformers:** 3 design trend opinion pieces (averaging 300 views each -- retire format)
- **Content Gaps Identified:** 4 topics missing
  1. UX research methods -- high search volume, no existing coverage
  2. Accessibility in UX -- growing demand, competitor weakness
  3. Design systems -- audience-requested topic
  4. Portfolio building -- career-adjacent to top performer

### Audience Personas
**Persona 1: Mid-Career UX Designer ("Maya")**
- Demographics: 3-7 years experience, works at startup or agency, IC or senior IC
- Pain points: Wants to level up strategic skills, build portfolio for senior roles, demonstrate business impact
- Preferred formats: Case studies with real metrics, actionable how-to guides
- Preferred channels: LinkedIn (daily), personal blogs via RSS/bookmarks
- Best publishing times: Tuesday/Wednesday 8-9 AM and 12-1 PM

### Editorial Calendar

| Week | Date   | Topic                            | Format     | Channel | Persona | Keyword              | Status |
|------|--------|----------------------------------|------------|---------|---------|----------------------|--------|
| 1    | Apr 1  | UX case study: onboarding flow   | Case study | Blog    | Maya    | ux onboarding study  | Idea   |
| 3    | Apr 15 | Accessibility audit checklist    | How-to     | Blog    | Maya    | ux accessibility     | Idea   |
| 5    | Apr 29 | Case study: search redesign      | Case study | Blog    | Maya    | ux search design     | Idea   |
| 7    | May 13 | Design system component guide    | How-to     | Blog    | Maya    | design system guide  | Idea   |
| 9    | May 27 | Case study: mobile checkout      | Case study | Blog    | Maya    | mobile ux case study | Idea   |
| 11   | Jun 10 | UX research methods comparison   | How-to     | Blog    | Maya    | ux research methods  | Idea   |

- **Publishing Frequency:** 2 posts per month (biweekly Tuesday)
- **Content Pillars:** Case studies (data-driven), How-to guides (actionable), Career growth (portfolio/interviews)
- **Reactive Slots:** 1 placeholder per month for timely UX industry commentary

### Repurposing Plan
| Original Piece              | Derivative 1           | Derivative 2          | Derivative 3     | Extra Time |
|----------------------------|------------------------|-----------------------|------------------|------------|
| UX case study: onboarding  | LinkedIn article summary| Twitter/X 5-takeaway thread | Newsletter paragraph | 45 min |
| Accessibility audit checklist | LinkedIn carousel (checklist format) | Twitter/X thread | Newsletter paragraph | 45 min |

- **Total Weekly Time:** 3 hours (creation) + 1 hour (repurposing) = 4 hours total
- **Capacity Check:** Within 5-hour weekly budget (1 hour buffer for research and planning)
