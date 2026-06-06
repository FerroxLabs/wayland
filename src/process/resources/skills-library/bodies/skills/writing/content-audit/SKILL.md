---
name: content-audit
description: |
  Creates structured content audits with performance categorization, gap analysis,
  and prioritized action recommendations for existing content libraries. Use when
  the user wants to evaluate their existing content, audit blog posts or website
  pages, identify underperforming content, or plan content updates. Do NOT use for
  planning new content (use `editorial-calendar`), writing content briefs (use
  `content-brief`), or analyzing audience personas (use `audience-analysis`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "content-marketing analysis planning"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Content Audit

## When to Use

Use this skill when any of the following conditions are true:

- The user wants to evaluate their existing content library -- blog posts, landing pages, resource hub, knowledge base, or documentation -- to understand performance, quality, and strategic alignment
- The user explicitly asks for a "content audit," "content inventory," "content health check," or "content review"
- The user reports flat or declining organic traffic and wants to diagnose which content is causing it
- The user is preparing for a site migration, rebrand, CMS switch, or audience pivot and needs to know which content to carry forward
- The user wants to reduce content bloat -- too many thin posts, duplicate topic coverage, outdated guides -- before investing in new creation
- The user needs to justify a content budget to stakeholders and wants data-backed evidence of what is and is not working
- The user wants to identify why a competitor is outranking them and needs to map the gap between their coverage and the competitor's
- The user is building a content strategy and needs to know the starting state of their library before planning forward

Do NOT use this skill in the following situations:

- The user wants to plan what new content to create next quarter -- use `editorial-calendar` instead, which handles forward-looking content scheduling
- The user needs a brief for a single new piece of content -- use `content-brief` instead, which provides keyword research, outline structure, and competitive analysis for one article
- The user wants to understand who their audience is or build persona profiles -- use `audience-analysis` instead, which focuses on psychographics, needs, and channel behavior rather than content inventory
- The user wants to write, rewrite, or edit a specific piece of content -- use `blog-post-writing` or the appropriate content format skill instead
- The user wants to conduct a technical SEO audit (crawl errors, Core Web Vitals, structured data, robots.txt) -- that is a technical audit discipline, not a content audit; route to a technical SEO skill
- The user wants to build an entirely new content program from scratch with no existing library -- there is nothing to audit; start with `audience-analysis` then `editorial-calendar`

## Process

### Step 1: Define Scope, Goals, and Available Data

Before touching a single piece of content, establish exactly what the audit covers and what success looks like. This step prevents audit drift -- the common failure mode where audits balloon into 200-row spreadsheets that never produce action.

- Ask the user to specify content types in scope: blog posts, pillar pages, landing pages, product pages, help center articles, case studies, white papers, or all of the above. Different content types have different performance benchmarks and should be categorized separately.
- Confirm the time period for performance data. A 12-month trailing window is the standard for content audits because it smoothes out seasonal fluctuations. If the user only has 6 months of data, note the limitation in the audit header.
- Identify the primary audit objective from the following specific goals: (a) recover organic traffic, (b) improve conversion rates, (c) reduce content redundancy before a site migration, (d) align content with a new audience or brand positioning, (e) identify gaps before a major content push, or (f) demonstrate ROI to stakeholders. Each objective changes what signals matter most.
- Determine what data sources are accessible. The strongest audits layer multiple data types: Google Search Console for keyword rankings and impressions, Google Analytics 4 for sessions, bounce rate, and on-page engagement, CRM or marketing automation for lead attribution and conversion, and a crawl tool (Screaming Frog, Sitebulb, or equivalent) for technical signals like word count, internal links, and meta data. Note explicitly which data sources are and are not available.
- Set the categorization framework upfront. The standard four-category model (Keep, Update, Consolidate, Remove) works for most audits. For large libraries over 500 pieces, add a fifth category -- Archive -- for historically valuable content that is no longer relevant to current strategy but should not be deleted.
- Ask if any content is off-limits due to legal, compliance, or business constraints. Some companies cannot delete certain pages due to regulatory requirements or active campaigns.

### Step 2: Build the Content Inventory

A content inventory is a complete, structured catalog of every piece in scope. It is the foundation of the audit -- everything else builds on it.

- Pull a URL list from a site crawl, sitemap export, or CMS export. Do not rely on memory or navigation -- there is always content that does not appear in menus. Screaming Frog's free tier crawls up to 500 URLs; for larger sites, the user needs the paid license or an XML sitemap export.
- For each URL, record the following fields: title, URL, content type, primary topic cluster or pillar, word count, publication date, most recent significant update date, author, and meta description.
- Pull performance data for each URL and append it to the inventory. The minimum viable data set for an SEO-focused audit is: organic sessions (12-month), top organic keyword and position, total impressions (Search Console), average position (Search Console), click-through rate, backlinks (total and referring domains). For conversion-focused audits, add: leads generated, conversion rate, and assisted conversions.
- Calculate content age in months from the most recent update date, not the publication date. A post published in 2019 but substantially updated in 2024 is not three years old -- it is current. Use update date as the freshness signal.
- Note internal link count (how many other pages link to this URL) -- this is a strong signal of structural importance. Pages with many internal links matter more architecturally, regardless of external traffic.
- Flag any URLs with technical issues found in the crawl: missing H1, duplicate title tags, meta description over 160 characters, thin content under 300 words, or canonicalization problems. These are separate from content quality issues but affect audit decisions.

### Step 3: Apply Performance Thresholds and Categorize Every Piece

This is the most analytically intensive step. Use specific, defensible thresholds -- not gut feel -- to assign each piece to exactly one category. The thresholds below are calibrated for typical B2B and B2C content programs; adjust them with explicit justification if the user's baseline metrics differ significantly.

**Keep threshold criteria (all three should be true):**
- Organic traffic is in the top 25% of the library by sessions over the trailing 12 months, OR the piece ranks in positions 1-10 for at least one target keyword with meaningful search volume (500+ monthly searches)
- Content is substantively accurate and current -- no outdated statistics, deprecated tools, or retired products
- The piece aligns with the current audience definition and brand positioning

**Update threshold criteria (at least two should be true):**
- Traffic has declined more than 20% year-over-year, OR average position has dropped more than 5 positions in Search Console in the last 6 months
- The content is more than 18 months old and has not been meaningfully updated
- The piece targets a viable keyword (500+ monthly searches) but ranks in positions 11-30, indicating it is close to ranking but needs optimization
- The content has inbound backlinks (at least 2 referring domains) -- this confirms it has earned authority worth preserving

**Consolidate threshold criteria:**
- Two or more pieces target the same primary keyword or close variants within the same intent cluster
- Word count for each piece is under 1,000 words on a topic that warrants comprehensive coverage (1,500-2,500 words)
- Neither piece individually ranks in the top 10, but their combined content quality and backlinks would likely push a merged piece to page one
- Cannibalization is confirmed: multiple URLs from the same domain appearing in Search Console for the same query

**Remove threshold criteria (at least two should be true):**
- Zero organic sessions in the trailing 90 days AND zero inbound backlinks from external referring domains
- The content covers a topic that is permanently off-strategy (discontinued product, retired service, dead platform)
- The content is purely internal/operational (office closure notices, event recaps with no evergreen value)
- The content has been superseded by a stronger piece on the same topic and has fewer than 5 referring domains pointing to it

Assign every piece to exactly one category. If a piece meets criteria for two categories, the hierarchy is: Remove > Consolidate > Update > Keep. A piece eligible for removal should not be sent to the Update queue.

### Step 4: Conduct Gap Analysis

The backward-looking inventory tells you what exists. The gap analysis tells you what is missing. Both are required for a complete audit.

- Map existing content against the full buyer journey using a funnel framework with these stages: Awareness (problem-aware, not solution-aware), Consideration (evaluating options, comparing approaches), Decision (ready to act, needs proof and confidence), and Retention (already a customer, needs ongoing value). Count how many pieces exist at each stage. Most content libraries are 80% Awareness-stage and starved at Decision and Retention.
- Identify topic clusters where the library has partial coverage. A topic cluster is healthy when it has a comprehensive pillar page (2,000+ words, broad coverage) supported by 4-8 cluster posts on specific subtopics. If the user has 6 short posts on email marketing but no comprehensive email marketing guide, the cluster is incomplete.
- Extract queries from Google Search Console that are generating impressions but low clicks (positions 5-20, CTR below 2%). These are keywords the site has partial authority on -- they represent the most efficient gap-fill opportunities because the domain already has relevance signal.
- Compare competitor topic coverage using a structured scan. For each major competitor, note: (a) topics they rank for that the user does not cover at all, (b) content formats they use that the user has not tried (interactive tools, comparison tables, video-first posts), and (c) content depth -- are their pages 400 words or 4,000 words?
- Identify keyword categories with rising search demand in the user's industry that have zero coverage in the library. Use seasonality patterns and industry trend signals to flag emerging topics. A library with no coverage of a topic that has grown 150% in search volume in 12 months has a strategic gap, not just a content gap.
- Note format gaps separately from topic gaps. A library that covers all the right topics but only in long-form blog posts is missing: how-to videos, comparison tables, glossary entries, FAQ pages, and interactive tools -- all of which capture different user intents and SERP features.

### Step 5: Diagnose Performance Patterns

Before recommending actions, identify WHY the best content performs and WHY the worst content fails. These patterns make the action plan defensible and replicable.

- Analyze the top 10% of performing pieces for common structural patterns: title format (listicle vs. how-to vs. question vs. data-led), word count range, presence of original data or research, use of headers and structured formatting, internal link density, and recency of last update.
- Calculate the average word count of top quartile vs. bottom quartile content. In most B2B content libraries, top performers average 1,800-2,500 words and bottom performers average under 700 words. This is a useful diagnostic but is not universal -- some high-intent queries are best served by 400-word direct answers.
- Identify traffic concentration: what percentage of total traffic comes from the top 20% of content? In a typical library with a content decay problem, the top 20% of pages drive 80-90% of traffic (a stronger-than-usual Pareto distribution). This indicates the library has an updating problem, not a creation problem.
- Check the internal linking health of top performers. Pages that receive many internal links from other content typically rank higher because internal links pass PageRank and establish topical authority signals. If top performers are not being internally linked from related content, that is a quick-win gap.
- Look for content cannibalization patterns -- multiple URLs competing for the same query. In Search Console, filter by a specific keyword and check how many URLs from the same domain are appearing. Cannibalization actively suppresses rankings for both pieces and is a primary driver of traffic stagnation.

### Step 6: Build the Prioritized Action Plan

The action plan is the deliverable stakeholders act on. Make every item specific, assigned to a category, and sequenced by impact-to-effort ratio.

- Calculate an effort score for each action item using a simple 1-3 scale: 1 = under 2 hours (metadata update, adding new data points, fixing broken links), 2 = half-day effort (structural rewrite, consolidation of two pieces, adding new sections), 3 = full-day or more (comprehensive rewrite, creating new long-form content, building a new topic cluster).
- Calculate an impact score for each action item: 1 = incremental improvement, 2 = meaningful recovery (restoring a previously performing page), 3 = strategic shift (filling a high-volume gap, fixing cannibalization on a high-priority keyword).
- Prioritize by impact-minus-effort: items with impact 3 and effort 1 are immediate quick wins; items with impact 1 and effort 3 are deprioritized. Items with impact 3 and effort 3 belong in the quarterly roadmap, not the 30-day sprint.
- For every Update item, specify exactly what changes are needed: (a) update specific statistics with links to current sources, (b) add a new section covering a subtopic not in the original, (c) rewrite the introduction to reflect current audience language, (d) update the internal links to newer relevant pieces, (e) optimize the meta title and description for the target keyword. Vague instructions like "refresh the content" produce inconsistent results.
- For every Consolidate item, specify the redirect map before any writing begins. The canonical URL to keep should be: (a) the URL with the most referring domains if there is a clear winner, or (b) the URL with the cleaner, more keyword-rich slug if backlinks are roughly equal. Never keep the URL with more traffic if the other URL has 3x more referring domains -- backlinks are the harder asset to rebuild.
- For every Remove item, assign one of three dispositions: 301 redirect to the most relevant remaining page (required if the page has any inbound links), noindex to keep the URL but remove it from search results (appropriate for internal operational content with no links), or full deletion with a custom 404 (appropriate only for content with zero backlinks and no linked value whatsoever).

### Step 7: Produce the Audit Output

Compile the full audit document following the Output Format below. The document should be self-contained -- a stakeholder who was not involved in the audit process should be able to read it, understand the findings, and assign work without needing a briefing.

- Write the executive summary last, after all categorization and analysis is complete. It should contain: the total content health score (what percentage of the library is performing), the single biggest problem, the single highest-leverage opportunity, and the estimated impact of implementing the top three recommendations.
- Use tables for all inventory and categorization work -- rows and columns are scannable; prose paragraphs are not.
- Include the patterns section even if the user did not ask for it. Understanding what makes content succeed is as important as knowing which pieces to fix.
- Flag data confidence issues explicitly. If a piece was categorized without traffic data, note it. If Search Console data only goes back 6 months instead of 12, note it. Audits based on incomplete data should say so.

## Output Format

```
## Content Audit: [Site or Brand Name]

**Audit date:** [Month YYYY]
**Scope:** [Specific content types included, e.g., "All published blog posts and pillar pages"]
**Total pieces audited:** [Number]
**Data period:** [e.g., "March 2024 -- March 2026 (24 months)"]
**Data sources:** [e.g., "Google Analytics 4, Google Search Console, Ahrefs for backlink data"]
**Primary audit objective:** [e.g., "Recover declining organic traffic / Reduce content bloat before site migration"]

---

### Executive Summary

[Paragraph 1: State the overall content health -- what percentage of the library is performing well,
what percentage needs work, and what the primary driver of underperformance is.]

[Paragraph 2: Identify the single highest-leverage opportunity. Be specific: not "improve SEO"
but "consolidating 12 thin posts into 4 comprehensive guides is estimated to recover
3,200 monthly sessions currently being cannibalized."]

[Paragraph 3: State the top three recommended actions in order of priority. These should match
the action plan below -- the executive summary is a preview, not a separate recommendation.]

---

### Content Health Scorecard

| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| Total pieces audited | [N] | -- | -- |
| % performing (Keep) | [%] | 30-40% healthy library | [Green/Yellow/Red] |
| % needing refresh (Update) | [%] | 30-40% expected | [Green/Yellow/Red] |
| % with cannibalization | [%] | <10% target | [Green/Yellow/Red] |
| % with zero organic traffic (90d) | [%] | <15% target | [Green/Yellow/Red] |
| Top 20% content share of traffic | [%] | 60-80% normal | [Green/Yellow/Red] |
| Content pieces with no internal links | [N] | 0 target | [Green/Yellow/Red] |

---

### Performance Distribution

| Category | Count | % of Total | Primary Issue | Action |
|----------|-------|-----------|--------------|--------|
| Keep | [N] | [%] | None -- performing | Monitor; replicate patterns |
| Update | [N] | [%] | [Primary issue, e.g., content decay] | Refresh content and SEO |
| Consolidate | [N] | [%] | [Primary issue, e.g., cannibalization] | Merge; consolidate backlinks |
| Remove | [N] | [%] | [Primary issue, e.g., zero value] | Redirect or delete |
| **Total** | **[N]** | **100%** | | |

---

### Detailed Inventory

#### Keep -- High-Performing Content (Protect and Replicate)

| Title | URL | Type | Monthly Organic Sessions | Top Keyword | Avg. Position | Referring Domains | Why It Works |
|-------|-----|------|--------------------------|-------------|--------------|-------------------|-------------|
| [title] | [/slug] | [type] | [N] | [keyword] | [pos] | [N] | [1-2 specific success factors] |

**Notes on top performers:** [1-2 sentences on shared patterns -- title format, word count,
freshness, use of original data, internal link density]

---

#### Update -- Refresh Needed (Prioritized by Impact)

| Priority | Title | URL | Current Traffic | Primary Issue | Keyword Opportunity | Word Count Gap | Specific Actions Required | Est. Effort | Est. Impact |
|----------|-------|-----|----------------|--------------|-------------------|----------------|--------------------------|-------------|-------------|
| 1 | [title] | [/slug] | [N sessions/mo] | [e.g., Stats >18mo old] | [keyword, vol] | [current vs. target WC] | [Specific list of changes] | [1-3 hrs] | [recovery estimate] |
| 2 | [title] | [/slug] | [N] | [issue] | [keyword, vol] | [gap] | [changes] | [effort] | [impact] |

**Update criteria used:** [State what thresholds triggered Update classification for this library]

---

#### Consolidate -- Merge Candidates (Grouped by Topic)

| Group Name | Pieces to Merge | URL to Keep | Reason for Keeping That URL | Combined Referring Domains | Redirect Map | New Target Keyword | Est. Word Count After Merge |
|------------|----------------|-------------|----------------------------|---------------------------|-------------|-------------------|----------------------------|
| [topic group] | [Title 1: /slug-1] + [Title 2: /slug-2] | [/slug-to-keep] | [More backlinks / cleaner slug / more traffic] | [combined total] | /slug-2 → 301 → /slug-to-keep | [primary keyword, volume] | [target WC] |

**Cannibalization analysis:** [How many keyword pairs were identified as cannibalizing each other,
and what is the estimated session recovery from resolving them]

---

#### Remove -- No Value (With Disposition Plan)

| Title | URL | Last Traffic (date) | Referring Domains | Reason for Removal | Disposition | Redirect Target |
|-------|-----|--------------------|--------------------|-------------------|-------------|----------------|
| [title] | [/slug] | [date or "none in 12mo"] | [N] | [specific reason] | [301 / noindex / delete] | [/target-url or "--"] |

**Removal risk note:** [Any caveats -- e.g., "2 of the 7 removal candidates have 1 referring domain
each; confirm redirect targets with link owner or ensure redirect is in place before deletion"]

---

### Content Gap Analysis

#### Funnel Coverage Map

| Funnel Stage | Pieces in Library | % of Library | Gap Severity | Notes |
|-------------|------------------|-------------|-------------|-------|
| Awareness (problem education) | [N] | [%] | [Low/Med/High] | [What is missing at this stage] |
| Consideration (comparison, evaluation) | [N] | [%] | [Low/Med/High] | [What is missing] |
| Decision (proof, case studies, bottom-funnel) | [N] | [%] | [Low/Med/High] | [What is missing] |
| Retention (onboarding, expansion, loyalty) | [N] | [%] | [Low/Med/High] | [What is missing] |

#### Topic and Keyword Gaps

| Gap Topic | Estimated Monthly Search Volume | Audience Intent | Content Type Needed | Funnel Stage | Competitor Coverage | Priority |
|-----------|--------------------------------|----------------|-------------------|-------------|-------------------|----------|
| [topic] | [volume] | [informational/navigational/transactional] | [how-to guide/comparison/glossary/etc.] | [stage] | [yes/no + competitor name] | High/Med/Low |

#### Format Gaps

| Missing Format | Estimated Opportunity | Example Topic to Apply It To | Priority |
|---------------|----------------------|------------------------------|----------|
| [e.g., Comparison tables] | [e.g., Captures "X vs Y" SERP features] | [e.g., "Tool A vs Tool B for [use case]"] | High/Med/Low |

---

### Action Plan (Sequenced by Impact/Effort)

**Quick Wins -- Complete within 30 days (< 2 hours each):**

| # | Action | Piece | Expected Impact | Effort |
|---|--------|-------|----------------|--------|
| 1 | [Specific action] | [Title + URL] | [Specific outcome, e.g., "recover ~400 sessions/mo by fixing keyword mismatch"] | 1 hr |
| 2 | [Specific action] | [Title + URL] | [Specific outcome] | 1.5 hrs |
| 3 | [Specific action] | [Title + URL] | [Specific outcome] | 45 min |

**Medium Projects -- Complete within 60 days (half-day to full-day each):**

| # | Action | Piece(s) | Expected Impact | Effort |
|---|--------|----------|----------------|--------|
| 1 | [Consolidation or deep rewrite] | [Titles + URLs] | [Outcome] | 4 hrs |
| 2 | [Consolidation or deep rewrite] | [Titles + URLs] | [Outcome] | 6 hrs |

**Quarterly Roadmap -- Plan for next 90 days (new content and major rewrites):**

| # | Action | Topic/Piece | Expected Impact | Effort |
|---|--------|-------------|----------------|--------|
| 1 | [New piece or comprehensive rewrite] | [Topic/title] | [Outcome] | 8+ hrs |
| 2 | [New piece] | [Topic] | [Fills X gap] | 8+ hrs |

---

### Patterns to Replicate

Based on analysis of the top-performing pieces:

- **Title format:** [Specific pattern, e.g., "Titles with specific numbers outperform vague titles by 2.4x CTR in this library -- '7 Ways to...' and 'How to [Outcome] in [Timeframe]' are the strongest formats"]
- **Word count:** [Specific range, e.g., "Top performers average 1,950 words; under-performers average 640 words. No piece in the top 25% is under 1,200 words."]
- **Content structure:** [e.g., "All top 10 performers include a structured table or framework within the first 500 words -- this likely contributes to featured snippet captures (3 of 10 hold snippets)"]
- **Freshness:** [e.g., "Content updated within the last 9 months outperforms content updated 18+ months ago by 3x in this library, confirming decay is a primary traffic issue"]
- **Internal linking:** [e.g., "Top performers receive an average of 8 internal links from other pages; bottom performers average 1.2 -- orphaned content is a structural weakness"]
```

## Rules

1. NEVER recommend deleting or removing a URL that has any external referring domains without specifying a 301 redirect target. Even a single backlink from a low-authority domain represents an earned link signal that should not be discarded. The redirect must point to the most semantically relevant remaining page, not the homepage.

2. NEVER categorize a piece as Remove based on subjective dislike or topic preference alone. Removal requires at least two of these four conditions: zero organic traffic in 90 days, zero external referring domains, permanent off-strategy subject matter, or content that cannot be made accurate without a full rewrite that would be less efficient than creating new content.

3. NEVER mark two pieces as Consolidate candidates if they target meaningfully different user intents, even if their topics overlap. "Email marketing basics" (informational, top-funnel) and "email marketing platforms compared" (commercial, mid-funnel) should not be merged -- they serve different queries and audience states.

4. NEVER produce an audit without a content health scorecard. Stakeholders need a quantified assessment, not narrative-only findings. The scorecard creates an objective baseline and makes future audits comparable.

5. NEVER recommend updating all underperforming content simultaneously. Prioritize a maximum of 5 Update items for immediate action and sequence the rest into a 60-90 day pipeline. Recommending 25 rewrites at once ensures zero get completed.

6. NEVER skip specifying the redirect map before a consolidation begins. The most common consolidation failure is merging content onto the wrong URL (choosing by traffic instead of backlinks) or failing to redirect at all. Specify every redirect as [source URL] → 301 → [destination URL] in the output.

7. NEVER use average position from Search Console alone to assess performance. Average position is a mean across all queries and all user locations -- a page that ranks #1 in three countries and #50 in twenty others will show an average position of 35, which looks poor but is not. Always contextualize position data with impressions and sessions.

8. ALWAYS distinguish between content decay (a piece that once performed well and is declining) and content that never performed (a piece that was always poor). Content decay candidates should be updated because they proved the topic and keyword has demand. Content that never performed may have been targeting the wrong keyword, have a technical issue, or address a topic with insufficient demand -- diagnosis before prescription is required.

9. ALWAYS check for keyword cannibalization before finalizing Keep recommendations. A piece in the top 25% of traffic may be suppressing an even stronger piece that is competing for the same primary keyword. If cannibalization exists within the Keep category, the Consolidate recommendation should override the Keep designation.

10. ALWAYS include the Patterns to Replicate section. The backward-looking analysis only creates value if it informs forward-looking creation. Identifying what the top 10% of content has in common is the highest-leverage output of the entire audit for teams that will continue publishing content.

11. ALWAYS flag data availability limitations explicitly. If the audit is conducted without Search Console access, without backlink data, or with less than 6 months of analytics, note what decisions this limitation affects and what proxy signals were used instead.

12. NEVER calculate content age from the original publication date if a substantial update has occurred. Use the most recent substantial update date. A post with a publication date of 2018 and a substantial update date of 2024 is not 6 years old for decay purposes -- it is current. Confusing these dates causes accurate content to be flagged for unnecessary rewrites.

## Edge Cases

### No Analytics Data Available

When the user has no access to performance data (no Google Analytics, no Search Console, no third-party SEO tool), conduct a qualitative freshness-and-quality audit using the following proxy framework:
- Assign a freshness score of 0-3 based on content age since last update: under 12 months = 3, 12-24 months = 2, 24-36 months = 1, over 36 months = 0
- Assign a quality score of 0-3 based on word count and structural completeness: over 1,500 words with clear structure = 3, 800-1,500 words with some structure = 2, 300-800 words = 1, under 300 words = 0
- Assign a relevance score of 0-3 based on alignment with current audience and business: clearly on-strategy = 3, tangentially relevant = 2, off-strategy = 1, irrelevant = 0
- Sum the three scores (0-9). Pieces scoring 7-9 are Keep candidates. 4-6 are Update candidates. 1-3 are Consolidate or Remove candidates depending on topic overlap. 0 are Remove.
- Flag the entire audit explicitly as "qualitative audit -- no performance data" so the user knows to revisit categorization decisions when analytics becomes available.

### Very Small Content Library (Under 20 Pieces)

For libraries under 20 pieces, abandon table-based inventory in favor of per-piece narrative assessments:
- Provide a dedicated paragraph for each piece covering: what it does well, what its weakness is, what one specific action should be taken, and how it relates to adjacent pieces in the library.
- The gap analysis becomes the dominant section of the audit. With 20 or fewer pieces, the library almost certainly covers less than 20% of relevant topics. Focus the majority of the output on what does not exist rather than what does.
- Do not use the four-category system rigidly. With 20 pieces, forcing a Remove category may eliminate a piece that only needs minor updating. Apply category labels but weight recommendations toward Keep and Update.

### Content Spans Multiple Languages

Never combine multilingual content into a single performance analysis:
- Create separate inventory tables for each language. Search performance baselines differ dramatically by market -- a blog in Spanish targeting Latin American SMBs has different competition intensity and keyword volumes than the English equivalent.
- Assess translation parity: which content exists in Language A but not Language B? These gaps are often the highest-leverage opportunity for multilingual sites because creating a translated/localized version of a proven top-performer is faster than creating net-new content.
- Note that hreflang implementation issues can suppress performance for all language versions. If the user reports the translated content underperforms despite quality, flag hreflang as a technical audit item outside this skill's scope.
- Apply culturally appropriate freshness signals. Some markets have faster content decay cycles (technology, financial services) than others. Do not apply a uniform 18-month decay threshold across languages -- calibrate to each market's rate of change.

### Significant Keyword Cannibalization Discovered Mid-Audit

When cannibalization is widespread (more than 15% of the library has at least one cannibalizing counterpart), restructure the audit output:
- Dedicate a full cannibalization map table showing each cannibalizing pair, their competing keywords, their respective traffic and backlink counts, and the recommended canonical winner.
- Elevate cannibalization resolution above all other action plan items. Cannibalization actively suppresses rankings in real time -- it is the only audit finding that gets worse the longer it goes unaddressed.
- Provide explicit consolidation guidance: the piece with more referring domains wins the canonical URL. The piece with more traffic but fewer backlinks should be redirected into the canonical piece after its content is merged. Traffic is recoverable; backlinks are not.
- If more than 30% of the library is cannibalizing, the library likely has an architectural problem, not just a content problem -- recommend a topic cluster restructure as a long-term roadmap item.

### Audit Requested as Part of a Site Migration

Site migration audits require additional outputs beyond standard performance categorization:
- Produce a complete URL disposition table with a column for every URL in scope, categorized as: (a) migrate as-is, (b) migrate with redirect from old URL to new slug, (c) consolidate into another page before migrating, (d) do not migrate -- retire.
- Prioritize speed over depth. Migration deadlines are typically fixed. Flag the top 20 highest-traffic pages first and ensure their disposition is decided before dealing with lower-traffic pages.
- Map all internal links that reference URLs being retired or changed. Every internal link pointing to a redirected URL is a PageRank leak. Provide a list of internal link updates required as part of the migration checklist.
- Explicitly warn the user that even 301 redirects lose approximately 10-15% of link equity in transmission. Pages being consolidated should have their inbound links updated at the source over the 3-6 months following migration.

### User Wants Competitor Content Audited

When the user wants to audit a competitor's content library rather than their own, reframe as a Competitive Content Analysis with modified outputs:
- The inventory cannot include performance data from analytics -- use estimated organic traffic from third-party tools (if available) and visible signals like social shares, comment counts, and estimated backlinks.
- Focus the analysis on three questions: (1) What topics does the competitor cover that the user does not? (2) What content formats does the competitor use effectively that the user has not adopted? (3) Where does the competitor have weak content that the user could out-execute?
- Do not apply the Remove or Consolidate categories to competitor content -- those are internal decisions only the competitor can make. Use a two-category system instead: Strong Coverage (they own this topic, hard to compete) and Vulnerable Coverage (thin, outdated, or low-quality -- opportunity to surpass).
- Output the competitive gap analysis as a prioritized list of content opportunities: topics where creating a better piece than the competitor's existing coverage is achievable given the user's resources.

### Gated Content and Content Behind Lead Capture

For gated assets (white papers, ebooks, reports, webinars, templates behind an email gate), performance metrics are different and require different thresholds:
- Do not measure gated content by organic sessions -- most gated content receives minimal search traffic by design. Measure by conversion rate on the landing page (form fills / landing page visits). A healthy gated asset conversion rate is 15-35% depending on audience quality requirements and offer value.
- For gated content with conversion rates under 10%, the problem is usually the offer framing, the landing page copy, or the perceived value of the asset -- not the asset itself. Recommend landing page and offer audit before recommending content changes.
- For gated content with conversion rates over 35% but low total form fills, the problem is traffic to the landing page -- the content is strong but underpromotd. Recommend adding internal links, promoting via email, or adding paid amplification before recommending content changes.
- Audit gated content for ungating as a gap-fill strategy. White papers covering high-search-volume topics that have been gated for more than 18 months may generate more compounded value as ungated SEO content than as lead capture assets.

## Example

**Input:** "I run the content team for a B2B SaaS company that makes project management software. We have 62 blog posts published over 3 years. Organic traffic has been flat for 8 months despite us publishing 2 posts per month. I have Google Analytics 4 and Google Search Console access, and I have Ahrefs for backlink data. Our audience is operations managers at mid-market companies (200-2,000 employees). We're preparing to launch a new product feature for Agile teams next quarter."

---

## Content Audit: Taskflow Blog

**Audit date:** March 2026
**Scope:** All published blog posts
**Total pieces audited:** 62
**Data period:** March 2024 -- March 2026 (24 months)
**Data sources:** Google Analytics 4 (sessions, engagement rate, conversions), Google Search Console (impressions, clicks, average position, CTR), Ahrefs (referring domains, backlink counts)
**Primary audit objective:** Diagnose traffic stagnation; prioritize updates before new Agile feature launch content push

---

### Executive Summary

The Taskflow blog has a concentration problem and a decay problem operating simultaneously. Eleven posts (18% of the library) are driving 81% of total organic traffic -- a distribution indicating the remaining 82% of content is producing negligible organic value. Of the 51 underperforming pieces, 14 are in active traffic decay (formerly ranking in positions 5-15 but now averaging positions 18-35), 9 are cannibalizing each other on overlapping project management keywords, and 12 have never ranked and show no signs of organic traction.

The single highest-leverage opportunity is resolving the 4 cannibalization clusters affecting core commercial keywords. Search Console shows "project management software for teams," "team task management," and "project tracking tools" each triggering 3-4 separate Taskflow URLs -- a pattern that is actively suppressing all of them. Consolidating these into 4 authoritative pillar pieces is estimated to recover 2,800-3,400 organic sessions per month currently being split and suppressed.

The top three priority actions are: (1) consolidate the 9 cannibalizing posts into 4 comprehensive guides before the Agile launch so the blog's authority is concentrated rather than fragmented; (2) refresh the 14 decaying posts with updated statistics and improved on-page optimization to recover an estimated 1,200 sessions per month; and (3) create 3 net-new pieces targeting Agile-specific keywords ahead of the feature launch, anchored by a pillar page the existing blog architecture cannot currently support.

---

### Content Health Scorecard

| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| Total pieces audited | 62 | -- | -- |
| % performing (Keep) | 18% (11 posts) | 30-40% healthy library | Red |
| % needing refresh (Update) | 23% (14 posts) | 30-40% expected | Yellow |
| % with cannibalization | 15% (9 posts across 4 clusters) | <10% target | Red |
| % with zero organic traffic (90d) | 19% (12 posts) | <15% target | Red |
| Top 20% content share of traffic | 81% | 60-80% normal | Red |
| Content pieces with no internal links | 8 posts | 0 target | Yellow |

---

### Performance Distribution

| Category | Count | % of Total | Primary Issue | Action |
|----------|-------|-----------|--------------|--------|
| Keep | 11 | 18% | None -- performing | Monitor; replicate format and topic patterns |
| Update | 14 | 23% | Content decay -- stats and structure outdated | Refresh with current data; re-optimize for target keyword |
| Consolidate | 17 | 27% | Keyword cannibalization + thin content | Merge into 6 comprehensive pieces; consolidate backlink equity |
| Remove | 12 | 19% | Zero organic traction, no backlinks, off-topic | 301 redirect (4), noindex (5), delete (3) |
| Investigate (no traffic but new, <6 months old) | 8 | 13% | Too early to categorize -- insufficient data window | Monitor for 90 more days before acting |
| **Total** | **62** | **100%** | | |

---

### Detailed Inventory

#### Keep -- High-Performing Content (Protect and Replicate)

| Title | URL | Type | Monthly Organic Sessions | Top Keyword | Avg. Position | Referring Domains | Why It Works |
|-------|-----|------|--------------------------|-------------|--------------|-------------------|-------------|
| How to Build a Project Roadmap Your Team Will Actually Use | /project-roadmap-guide | How-to guide | 3,400 | project roadmap template | 4.2 | 18 | Specific outcome in title, includes downloadable template (drives return visits), 2,200 words with clear H2 structure |
| Project Management Terminology: 47 Terms Every Ops Manager Needs | /project-management-glossary | Glossary | 2,800 | project management terms | 3.7 | 31 | Comprehensive reference format earns links; ranks for 90+ long-tail definition queries |
| 5 Project Status Report Templates (With Examples) | /project-status-report-templates | Template + guide | 2,200 | project status report template | 2.9 | 24 | Template format captures high-intent query; downloadable asset drives conversions |
| How Operations Teams Use Taskflow to Eliminate Weekly Status Meetings | /eliminate-status-meetings | Use-case post | 1,900 | replace status meetings with software | 6.1 | 9 | Product-specific use case targets decision-stage query; converts at 4.2% to trial |
| What Is a RACI Matrix and How Do You Build One? | /raci-matrix-guide | Explainer + how-to | 1,600 | raci matrix | 5.8 | 14 | High-volume evergreen topic; comprehensive enough to hold position against larger competitors |

**Notes on top performers:** Every post in the Keep category exceeds 1,800 words, includes at least one downloadable or interactive element (template, framework, checklist), and uses a title that promises a specific, actionable outcome. Average referring domains for Keep posts is 19.2 vs. 2.1 for all other posts -- link acquisition appears to follow practical, reference-style formats strongly.

---

#### Update -- Refresh Needed (Prioritized by Impact)

| Priority | Title | URL | Current Monthly Sessions | Primary Issue | Keyword Opportunity | Current WC | Target WC | Specific Actions Required | Est. Effort | Est. Monthly Session Recovery |
|----------|-------|-----|--------------------------|--------------|-------------------|------------|-----------|--------------------------|-------------|-------------------------------|
| 1 | Best Project Management Software 2024 | /best-project-management-software | 820 (down from 2,100 in Jan 2025) | Year in title; 6 of 10 tools listed have changed pricing; content not updated since Q1 2024 | best project management software (vol: 22,000/mo) | 2,400 | 3,200 | Remove year from title or update to 2026; re-verify all pricing; add 3 tools added to category since 2024; update comparison table; add section on AI-assisted PM tools | 5 hrs | 800-1,200 |
| 2 | How to Write a Project Brief | /project-brief-guide | 640 (down from 1,100) | Introduction uses dated framing; lacks examples; missing section on stakeholder alignment which is now the top follow-on query | project brief template (vol: 8,100/mo) | 1,400 | 2,000 | Rewrite intro; add 2 concrete annotated examples; add 400-word section on stakeholder sign-off process; update internal links to new RACI post | 3 hrs | 300-500 |
| 3 | Remote Team Management: A Practical Guide | /remote-team-management | 510 (historically 900) | Written during peak remote-work interest (2021); framing is "how to adapt to remote" not "how to optimize remote/hybrid" -- search intent has shifted | managing remote teams (vol: 5,400/mo) | 1,800 | 2,200 | Rewrite opening to reflect hybrid-normalized context; update all statistics to 2025 sources; add section on async communication tooling; add Taskflow-specific workflow example | 4 hrs | 250-400 |
| 4 | Sprint Planning Meeting Agenda Template | /sprint-planning-agenda | 390 (was 680) | Directly relevant to upcoming Agile feature launch; currently thin with no examples; Agile keyword traffic is growing 28% YoY in GSC | sprint planning meeting (vol: 4,200/mo) | 900 | 1,800 | Expand from overview to complete guide; add 3 example agendas for different team sizes; link to upcoming Agile feature content; this post should anchor the new Agile cluster | 4 hrs | 200-350 |
| 5 | KPI Tracking for Operations Teams | /operations-kpi-tracking | 420 (was 710) | Core stats from 2022; missing section on OKRs which now ranks as a co-occurring query in GSC; 3 broken internal links | operations kpis (vol: 3,600/mo) | 1,600 | 2,000 | Replace 2022 benchmark data with current sources; add 600-word OKR integration section; fix 3 broken internal links; update meta title to include "OKR" | 3 hrs | 150-300 |

*9 additional Update candidates with lower immediate impact are available in the full audit spreadsheet. The 5 above represent the highest impact-to-effort ratio and should be completed within 30 days.*

---

#### Consolidate -- Merge Candidates (Grouped by Cannibalization Cluster)

| Group Name | Pieces to Merge | URL to Keep | Reason | Combined Referring Domains | Full Redirect Map | New Target Keyword | Target WC After Merge |
|------------|----------------|-------------|--------|---------------------------|-------------------|--------------------|----------------------|
| Task Management Cluster | "Task Management for Teams" (/task-management-teams) + "How to Manage Team Tasks" (/manage-team-tasks) + "Team Task Tracking Best Practices" (/team-task-tracking) | /task-management-teams | 11 referring domains vs. 3 and 1 | 15 combined | /manage-team-tasks → /task-management-teams; /team-task-tracking → /task-management-teams | team task management (vol: 6,600/mo) | 2,800 |
| Workflow Automation Cluster | "Introduction to Workflow Automation" (/workflow-automation-intro) + "Workflow Automation for Operations" (/workflow-automation-ops) + "Automating Repetitive Tasks at Work" (/automating-work-tasks) | /workflow-automation-ops | Strongest keyword specificity; 8 referring domains vs. 2 and 0 | 10 combined | /workflow-automation-intro → /workflow-automation-ops; /automating-work-tasks → /workflow-automation-ops | workflow automation for teams (vol: 4,400/mo) | 2,400 |
| Project Timeline Cluster | "How to Create a Project Timeline" (/create-project-timeline) + "Project Timeline Examples" (/project-timeline-examples) | /create-project-timeline | 7 referring domains; better slug; more traffic | 9 combined | /project-timeline-examples → /create-project-timeline | project timeline template (vol: 5,900/mo) | 2,200 |
| Meeting Productivity Cluster | "Running Effective Team Meetings" (/effective-team-meetings) + "How to Cut Meeting Time in Half" (/cut-meeting-time) + "Meeting Agenda Best Practices" (/meeting-agenda-best-practices) | /effective-team-meetings | 6 referring domains; broadest scope | 8 combined | /cut-meeting-time → /effective-team-meetings; /meeting-agenda-best-practices → /effective-team-meetings | team meeting best practices (vol: 2,900/mo) | 2,000 |

**Cannibalization analysis:** 4 active cannibalization clusters identified across 12 posts (plus the sprint planning post already flagged in Update). GSC shows split traffic and suppressed rankings for all affected clusters. Conservatively, resolving these 4 clusters by consolidation is estimated to recover 2,800-3,400 combined sessions per month as link equity concentrates and rankings stabilize within 60-90 days of redirects being implemented.

---

#### Remove -- No Value (With Disposition Plan)

| Title | URL | Last Organic Traffic | Referring Domains | Reason for Removal | Disposition | Redirect Target |
|-------|-----|---------------------|-------------------|--------------------|-------------|----------------|
| Taskflow Wins "Best UX" at SaaS Awards 2022 | /saas-award-2022 | None in 18 months | 0 | Press announcement with no audience value; not indexable for search | Delete | -- |
| Office Hours Recap: Q3 2023 | /office-hours-q3-2023 | None in 12 months | 0 | Internal event recap; no search demand; no links | Noindex | -- |
| Office Hours Recap: Q1 2024 | /office-hours-q1-2024 | None in 6 months | 0 | Same as above | Noindex | -- |
| Using Basecamp for Project Management | /basecamp-project-management | 12 sessions/mo (non-organic, direct) | 1 | Competitor-named tool; off-brand; wrong audience; single referring domain is a low-DA blog | 301 redirect | /best-project-management-software |
| Top Productivity Apps of 2021 | /productivity-apps-2021 | None in 14 months | 0 | Fully outdated; superseded by updated tools coverage; no links | Delete | -- |
| Why Agile Doesn't Work for Everyone | /agile-doesnt-work | 8 sessions/mo | 0 | Directly contradicts
