---
name: seo-content-strategy
description: |
  Produces a completed SEO content strategy with keyword clusters, content
  gap analysis, page priority matrix, and internal link structure using SEO
  content planning methodology. Use when the user asks to plan SEO content,
  create a keyword strategy, identify content gaps, prioritize pages for
  organic search, or build a content-driven SEO plan.
  Do NOT use for writing individual blog posts (use writing skills), full
  marketing strategy (use marketing-strategy), or paid search ad copy (use
  paid-ad-copy).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing seo planning strategy"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# SEO Content Strategy

## When to Use

Use this skill when any of the following triggers are present:

- The user asks to build or plan an SEO content strategy, keyword roadmap, or organic search plan for a website or digital product
- The user wants to identify keyword clusters, topic clusters, or content pillars for their domain and needs a structured methodology to prioritize them
- The user needs a content gap analysis -- identifying what topics competitors rank for that their own site does not cover, or where existing pages rank in positions 11-50 and need improvement
- The user wants a page priority matrix that scores and ranks content opportunities based on search volume, keyword difficulty, business value, and production effort
- The user needs an internal linking architecture designed around the hub-and-spoke (pillar-cluster) model to distribute PageRank and signal topical authority
- The user asks to build a content calendar driven by SEO opportunity rather than editorial preference
- The user needs to audit existing content and decide what to create, optimize, consolidate, or prune to improve organic performance

**Do NOT use this skill when:**

- The user needs an individual blog post, guide, or landing page written -- use a content writing skill instead
- The user wants a full marketing strategy covering brand positioning, paid media, and lifecycle -- use a marketing-strategy skill
- The user needs Google Ads or paid search ad copy, keyword match types, or Quality Score optimization -- use a paid-ad-copy or PPC skill
- The user is asking exclusively about technical SEO issues (crawl budget, schema markup, Core Web Vitals, log file analysis) -- use a technical-seo-audit skill
- The user needs a social media content calendar or platform strategy -- use a social-media-strategy skill
- The user wants conversion rate optimization for existing pages without an organic search component -- use a CRO skill
- The user needs link building outreach sequences or digital PR strategy -- use a link-building skill

---

## Process

### Step 1: Collect All Business and Site Context

Before producing a single recommendation, gather the following. If the user has not provided it, ask explicitly -- do not guess.

- **Business description:** What does the site sell, offer, or publish? What is the revenue model (SaaS, e-commerce, lead generation, affiliate, media)?
- **Target audience:** Who are the primary users and what problems are they searching to solve? Are they B2C consumers, SMB buyers, or enterprise procurement teams?
- **Current organic performance:** Monthly organic visits (from Google Analytics, Google Search Console, or Semrush estimates), number of indexed pages, Domain Rating (DR) or Domain Authority (DA) if known
- **Existing content inventory:** Number of blog posts, landing pages, product/category pages, resources, and a sense of their quality -- thin, outdated, or performing well
- **Top 3-5 organic competitors:** These are competitors in the search results, not necessarily direct business competitors. A SaaS company may compete organically against informational sites and review platforms, not just rival software vendors
- **Primary business objectives the SEO strategy must serve:** Drive trial signups, generate MQL leads, sell products, grow email list, monetize ad inventory -- this determines which search intents are prioritized
- **Content production capacity:** Number of writers, posts per month, ability to do video/infographics, and whether they have technical resources to update URL structures or run internal link audits
- **Geography and language:** Single-country or multi-regional? English-only or multilingual? This affects keyword prioritization dramatically

### Step 2: Define Topical Authority Targets and Keyword Clusters

This is the strategic core of the entire plan. The goal is to identify 5-10 pillar topics where the site can realistically build topical authority and rank broadly.

- **Identify pillar topics** by mapping the intersection of: (a) what the business sells or needs to be known for, and (b) what has meaningful aggregate search demand. A pillar topic is not a single keyword -- it is a semantic territory with hundreds of related queries
- **Build each cluster** with: one primary pillar keyword (typically 1,000--50,000 monthly searches, high commercial or informational value), 8-20 supporting subtopic keywords (often 100--5,000 searches each), and long-tail variants within each subtopic (typically under 500 searches but highly specific intent)
- **Classify every keyword by the four-part intent taxonomy:**
  - *Informational* -- user wants to learn ("how to crate train a puppy," "what is keyword difficulty")
  - *Navigational* -- user is looking for a specific brand or resource ("Ahrefs login," "HubSpot templates")
  - *Commercial investigation* -- user is evaluating options before buying ("best project management software," "Semrush vs Ahrefs")
  - *Transactional* -- user is ready to act ("buy dog training course online," "sign up for SEO tool free trial")
- **Assess competitive difficulty** using relative signals: if the top 10 results are all DR 70+ sites with thousands of backlinks and the content has been published for 5+ years, the difficulty is high. If results include Reddit threads, Quora answers, and thin pages from low-DR sites, difficulty is low -- a real opportunity regardless of the tool-reported difficulty score
- **Apply cluster prioritization logic:** Priority = (Business Value × Search Volume) ÷ Competitive Difficulty × Time-to-Result. Informational clusters with high volume but zero conversion path score lower than medium-volume commercial clusters directly tied to a purchasing decision
- **Note keyword cannibalization risks:** If two or more existing pages target the same keyword or highly overlapping intent, flag them for consolidation before creating new content targeting the same space

### Step 3: Execute the Content Gap Analysis

A gap analysis compares what the site covers against what it should cover, and against what competitors have already captured.

- **Inventory mapping:** List every existing page (or representative sample for large sites) and map it to the keyword clusters defined in Step 2. Identify: (a) clusters with strong existing coverage, (b) clusters with partial coverage (1-2 pages, not a pillar), and (c) clusters with zero coverage
- **Performance tier classification for existing content:**
  - *Positions 1-3:* Protect and maintain. Update annually. Build internal links to reinforce
  - *Positions 4-10:* Optimize aggressively -- these pages are close to major traffic gains. Small improvements in E-E-A-T signals, internal linking, and content depth can move them to positions 1-3
  - *Positions 11-30 ("the valley"):* Highest ROI optimization targets. These pages have proven the topic is indexable and Google acknowledges the relevance -- they just need improvement to break onto page one
  - *Positions 31+:* Assess whether the page has any backlinks or traffic. If not, it may be a candidate for consolidation or complete rewrite
- **Competitor gap identification:** For each competitor, identify the 5-10 pages driving their highest organic traffic that the user's site does not have equivalent content for. These are the most validated content opportunities in the market
- **SERP feature opportunities:** Note where the SERP shows featured snippets, People Also Ask boxes, video carousels, or local packs -- these are additional ranking surfaces that require specific content formatting (definition paragraphs under 50 words for snippets, FAQ schema for PAA, YouTube optimization for video carousels)
- **Content freshness flags:** Identify existing pages covering topics with high query freshness signals (Google dating the result matters, such as "best X tools 2024") -- these require scheduled annual or semi-annual refreshes

### Step 4: Build the Page Priority Matrix

Translate gap analysis findings into an actionable ranked list with scoring logic.

- **Score each content opportunity on five dimensions, each rated 1-3:**
  - *Search Volume:* 3 = 5,000+ monthly searches for the primary keyword; 2 = 500-4,999; 1 = under 500
  - *Business Value:* 3 = directly drives the primary conversion action; 2 = drives secondary conversion or builds email list; 1 = brand awareness only
  - *Competitive Difficulty:* 3 = low difficulty (score ≤40 on Ahrefs/Semrush KD or SERP dominated by weaker sites); 2 = medium (KD 41-70); 1 = high (KD 71+)
  - *Content Effort:* 3 = low effort (existing content can be updated or a short guide suffices); 2 = medium (2,000-3,500 word comprehensive guide); 1 = high effort (requires original research, data, tool creation, or multimedia)
  - *Time-to-Rank:* 3 = informational, low competition, likely to show movement in 60-90 days; 2 = medium competition, 3-6 months; 1 = high competition, 6-12+ months
- **Calculate a Priority Score** = (Search Volume + Business Value + Competitive Difficulty + Content Effort + Time-to-Rank) summed. Maximum 15. Rank all opportunities by this score
- **Define the "minimum viable content specification" for each top-priority page:** target keyword, 3-5 secondary keywords to include, primary search intent, recommended content format (comprehensive guide, comparison page, tool/calculator, case study, FAQ page, landing page), estimated word count range, required media (screenshots, original data, video), and which competitor pages to benchmark against
- **Separate the matrix into two tracks:** (a) New content creation, and (b) Existing content optimization. Both tracks must be in the calendar. A common mistake is focusing 100% on new content while leaving optimization wins on the table -- optimization typically delivers results 3x faster than new content

### Step 5: Design the Internal Link Architecture

Internal linking is one of the highest-leverage technical-editorial interventions available. Proper architecture signals topical authority to crawlers and distributes PageRank from high-authority pages to target pages.

- **Implement the pillar-cluster model explicitly:**
  - Each pillar page provides a comprehensive overview of a broad topic (2,500-5,000+ words) and links out to every cluster page in its hub
  - Each cluster page goes deep on one subtopic and links back to the pillar plus to 2-3 semantically related cluster pages in the same hub
  - Cluster pages do not cross-link to other pillar hubs unless there is genuine topical relevance
- **Identify "link equity donors" in the existing site:** Pages with the most backlinks (check via Ahrefs, Semrush, or Moz Link Explorer) are the site's most powerful internal link sources. Any new page in a priority cluster should receive a contextual link from these high-authority existing pages
- **Anchor text strategy:** Use descriptive, keyword-rich anchor text (e.g., "puppy crate training guide") rather than generic text ("click here," "read more," "this article"). Avoid exact-match anchor text 100% of the time -- vary with partial-match and branded+keyword variants to avoid over-optimization signals
- **Define URL structure before any new content is created:** Follow a clean hierarchy -- /topic/ for pillar pages, /topic/subtopic/ for cluster pages, /topic/subtopic/specific-guide/ for deep content. Flat structures (/puppy-crate-training-a-comprehensive-guide-for-new-dog-owners-2024/) are harder to cluster semantically and create URL management problems at scale
- **Identify orphaned pages:** Any existing page with zero internal links pointing to it is invisible to search engine crawlers navigating via links. Audit for orphans and incorporate them into the appropriate cluster
- **Do not over-link:** A page should not have more than 100 total links (internal + external). For typical blog posts, 3-8 internal links is the right range. For pillar pages linking to an entire cluster, 10-20 is appropriate

### Step 6: Develop a Realistic Content Calendar

Map the prioritized content opportunities to a production timeline that respects stated capacity.

- **Establish the cadence constraint first:** If the user can publish 4 pieces per month, the calendar must never exceed 4 per month. Exceeding capacity produces thin content and burnout -- both SEO killers
- **Allocate capacity between new and optimization work:** For sites with existing content, a 50/50 split is typically ideal (2 new pieces + 2 optimizations per month). For new sites with under 20 pages, allocate 80% to new content
- **Sequence content strategically:**
  - Month 1-2: Publish pillar pages for top 2-3 priority clusters (these are the hub pages everything else links back to)
  - Month 2-4: Publish cluster content for the top priority pillar before moving to the next pillar. Do not scatter across multiple pillars before any one is complete -- Google rewards topical depth
  - Month 3+: Begin scheduled optimizations on the "positions 4-10" and "positions 11-30" targets identified in the gap analysis
  - Ongoing: Schedule quarterly content refreshes for time-sensitive pages (statistics roundups, comparison articles, annual "best of" lists)
- **Assign content specifications to each calendar item:** Each entry should note target keyword, word count, intent type, format, and who owns production (writer, designer, developer)
- **Build in a SERP monitoring cadence:** After publishing, check target keyword rankings at 30, 60, and 90 days. If a new page fails to appear in the top 100 within 90 days, something is structurally wrong -- either the page is not indexed, lacks internal links, or has a relevance mismatch

### Step 7: Include Technical SEO Integration Checkpoints

Content strategy and technical SEO are not separate -- common technical failures will nullify excellent content work.

- **Indexability baseline:** Confirm that no important pages are accidentally blocked in robots.txt, marked noindex, or hidden behind login walls. A content strategy produces zero results if Google cannot crawl and index the output
- **Page speed thresholds:** Google's Core Web Vitals benchmarks require Largest Contentful Paint (LCP) under 2.5 seconds, Cumulative Layout Shift (CLS) under 0.1, and Interaction to Next Paint (INP) under 200ms. Pages that fail these thresholds have a measurable ranking disadvantage, particularly on mobile
- **Schema markup opportunities:** Identify which content types benefit from structured data. How-to content should use HowTo schema. FAQ sections should use FAQPage schema. Review content benefits from Review schema. Course content benefits from Course schema. Product pages need Product schema with price and availability
- **Canonical tags:** When content exists in multiple versions (www vs non-www, HTTP vs HTTPS, paginated content, filtered category pages), canonical tags must explicitly declare the preferred URL
- **XML sitemap:** All priority pages must be included in the XML sitemap, submitted to Google Search Console and Bing Webmaster Tools. Exclude noindex pages, paginated variants (except page 1), and thin utility pages

---

## Output Format

Produce the strategy in this structure. Complete all sections -- do not omit sections or use placeholder text.

```
## SEO Content Strategy: [Business/Site Name]

**Primary Goal:** [Specific, measurable organic traffic or ranking objective with timeframe]
**Current Baseline:** [Monthly organic visits | Indexed pages | Domain Rating/Authority if known]
**Production Capacity:** [X pieces/month, split between new content and optimizations]
**Strategy Period:** [e.g., Q1-Q3 2025 -- 9 months]
**Date Prepared:** [Date]

---

### Section 1: Topical Authority Map (Keyword Clusters)

| Pillar Topic | Primary Keyword | Est. Monthly Searches | Cluster Subtopics (count) | Avg. Cluster Difficulty | Business Value | Priority |
|---|---|---|---|---|---|---|
| [Pillar 1 name] | [exact keyword phrase] | [H: 10k+ / M: 1-10k / L: <1k] | [X subtopics listed below] | [H/M/L] | [H/M/L] | [1] |
| [Pillar 2] | [keyword] | [volume] | [count] | [difficulty] | [value] | [2] |
| [Pillar 3] | [keyword] | [volume] | [count] | [difficulty] | [value] | [3] |
| [Pillar 4] | [keyword] | [volume] | [count] | [difficulty] | [value] | [4] |
| [Pillar 5] | [keyword] | [volume] | [count] | [difficulty] | [value] | [5] |

**Cluster Detail -- Pillar 1: [Topic]**
- Primary keyword: [keyword] | Intent: [Informational/Commercial/Transactional]
- Subtopics:
  1. [Subtopic keyword] -- Intent: [type] -- Volume: [H/M/L] -- Difficulty: [H/M/L]
  2. [Subtopic keyword] -- Intent: [type] -- Volume: [H/M/L] -- Difficulty: [H/M/L]
  3. [Continue for all subtopics in the cluster]
- Long-tail variants: [3-5 examples of long-tail queries within this cluster]
- SERP features present: [Featured Snippet / PAA / Video / Local Pack / None]

[Repeat Cluster Detail for each Pillar]

---

### Section 2: Content Gap Analysis

**Existing Coverage Assessment**

| Cluster | Coverage Status | Page Count | Avg. Position | Performance Verdict | Action |
|---|---|---|---|---|---|
| [Pillar 1] | Full / Partial / None | [X pages] | [position range] | Strong / Underperforming / Missing | Maintain / Optimize / Create |
| [Pillar 2] | [status] | [count] | [position] | [verdict] | [action] |

**Top Content Gaps (High Priority -- No Existing Content)**

1. **[Topic/Keyword]**
   - Why it matters: [specific business rationale]
   - Estimated monthly searches: [H/M/L with notes]
   - Who currently ranks: [competitor type description, e.g., "large media sites with DR 70+, Reddit threads"]
   - Opportunity assessment: [Why the user can compete here]

2. [Continue for 5-10 top gaps]

**Optimization Targets (Content Exists, Ranking in Positions 4-30)**

| Page Title | Target Keyword | Current Position | Traffic Opportunity | What to Improve |
|---|---|---|---|---|
| [Title] | [keyword] | [position] | [potential monthly visits if moved to top 3] | [Specific improvements: add FAQ section, expand word count to 2,500, refresh statistics, build 3 internal links from high-authority pages] |

**Competitor Content Not Covered**

| Competitor | Their Top Page | Estimated Traffic | User's Coverage | Gap Priority |
|---|---|---|---|---|
| [Competitor type/name] | [page topic] | [H/M/L] | None / Partial / Indirect | [H/M/L] |

**Cannibalization Risks**

| Keyword | Page 1 URL | Page 2 URL | Recommended Action |
|---|---|---|---|
| [keyword] | [url] | [url] | [Consolidate into Page 1 / Set canonical / Differentiate intent] |

---

### Section 3: Page Priority Matrix

**Scoring Key:** Volume (1-3) + Business Value (1-3) + Difficulty Inverse (1-3) + Effort Inverse (1-3) + Time-to-Rank Potential (1-3) = Total Score out of 15

**Track A: New Content Creation**

| Rank | Target Keyword | Intent | Format | Est. Words | Score /15 | Volume | Biz Value | Difficulty | Effort | Time-to-Rank |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [keyword] | [intent] | [Comprehensive Guide / Comparison / Landing / FAQ / Tool] | [word count] | [X/15] | [1-3] | [1-3] | [1-3] | [1-3] | [1-3] |
| 2 | [keyword] | [intent] | [format] | [count] | [X/15] | [1-3] | [1-3] | [1-3] | [1-3] | [1-3] |
[Continue for top 10-15 new content opportunities]

**Track B: Existing Content Optimization**

| Rank | Page URL | Target Keyword | Current Position | Score /15 | Priority Action |
|---|---|---|---|---|---|
| 1 | [url] | [keyword] | [position] | [X/15] | [Specific: Add 800 words covering subtopics X, Y, Z; Add FAQ schema; Build internal links from pages A, B] |
[Continue for top 5-10 optimization targets]

---

### Section 4: Internal Link Architecture

**Pillar Page Specifications**

| Pillar | Recommended URL | Internal Links Out (to cluster pages) | Internal Links In (from existing high-DR pages) | Priority |
|---|---|---|---|---|
| [Topic] | /[slug]/ | [List all cluster page URLs it should link to] | [List existing pages that should link to it] | [H/M/L] |

**Cluster Organization Map**

[Pillar 1: exact topic]
├── [Cluster page 1: subtopic keyword] → /[pillar]/[subtopic]/
├── [Cluster page 2: subtopic keyword] → /[pillar]/[subtopic]/
├── [Cluster page 3: subtopic keyword] → /[pillar]/[subtopic]/
└── [Continue for all cluster pages]

[Repeat for each Pillar]

**Anchor Text Guidance**

| Link Destination | Recommended Anchor Text Variants |
|---|---|
| [Pillar page URL] | "[keyword]," "[partial-match variant]," "[descriptive phrase not exact-match]" |
| [Cluster page URL] | [variants] |

**Orphaned Pages Identified**
[List any existing pages with no internal links that need to be incorporated]

---

### Section 5: Content Calendar

**Months 1-3 (Foundation Phase)**

| Month | Week | Content Title | Track | Target Keyword | Format | Words | Priority Score | Owner |
|---|---|---|---|---|---|---|---|---|
| 1 | 1-2 | [Pillar page title] | New | [keyword] | Comprehensive Guide | [count] | [X/15] | [Writer/role] |
| 1 | 3-4 | [Cluster page title] | New | [keyword] | [format] | [count] | [X/15] | [role] |
| 2 | 1-2 | [Content title] | Optimize | [keyword] | [format] | [count] | [X/15] | [role] |
[Continue for all months in the strategy period]

**Quarterly Refresh Schedule**

| Page | Topic | Scheduled Refresh | Why Refresh Needed |
|---|---|---|---|
| [URL or title] | [topic] | [Q2 2025] | [Statistics outdated / Rankings page needs update / New competitors emerged] |

---

### Section 6: Technical SEO Checklist

**Pre-Publication Checklist (apply to every new page)**
- [ ] URL follows defined hierarchy (/pillar/subtopic/ pattern), is lowercase, hyphen-separated, under 75 characters
- [ ] Title tag: primary keyword near the front, under 60 characters, unique across the site
- [ ] Meta description: compelling summary with primary keyword, 140-160 characters, unique across the site
- [ ] H1 contains primary keyword -- one H1 per page only
- [ ] H2/H3 headings cover secondary keywords and subtopics naturally
- [ ] Internal links added: 3-8 contextual links to related cluster/pillar pages with descriptive anchor text
- [ ] At least one internal link from a high-authority existing page to this new page
- [ ] All images compressed (WebP format preferred), have descriptive alt text, filenames are keyword-relevant
- [ ] Page passes Core Web Vitals thresholds: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Schema markup implemented where applicable (HowTo, FAQPage, Article, Course, Product)
- [ ] Canonical tag present and pointing to the correct URL
- [ ] Page added to XML sitemap

**Site-Wide Technical Flags**
- [ ] XML sitemap submitted to Google Search Console and Bing Webmaster Tools
- [ ] Robots.txt reviewed -- confirm priority pages are not blocked
- [ ] HTTPS enabled site-wide with no mixed content warnings
- [ ] 301 redirects in place for any consolidated or redirected pages
- [ ] Google Search Console set up and monitoring for crawl errors, manual actions, and coverage issues
```

---

## Rules

1. **Never fabricate specific search volume numbers.** If the user has not provided keyword research data from a tool, use relative tiers (High: 10,000+ monthly searches, Medium: 1,000-9,999, Low: under 1,000). Stating "this keyword gets 14,800 searches/month" without data is fabrication that will erode the user's trust when they verify it.

2. **Always assign search intent before recommending any content format.** Informational intent requires educational content. Commercial investigation intent requires comparison, pros/cons, or review-style content. Transactional intent requires landing pages with conversion elements. Creating a 2,500-word educational blog post to rank for a transactional keyword is a mismatch that will fail regardless of quality.

3. **Topic clusters must be completed before moving to the next pillar.** Do not recommend publishing one post per pillar simultaneously. Google's Helpful Content system rewards topical depth and expertise. A site with 10 comprehensive pages about one topic outperforms a site with one page each across ten topics.

4. **The page priority matrix must always include existing content optimization alongside new content creation.** Existing pages that rank in positions 4-30 represent the fastest ROI in SEO -- they already have some authority and indexing. Never produce a strategy that is 100% new content.

5. **Never recommend a content production volume that exceeds the user's stated capacity.** Recommending 12 posts/month when a team can produce 4 results in shortcuts, thin content, and a loss of content quality that Google will penalize through reduced crawl frequency and ranking drops.

6. **Internal link architecture must be explicitly designed -- do not treat it as optional or self-evident.** A full strategy without internal link specifications is incomplete. Every new pillar page must have a defined set of cluster pages it links to, and every cluster page must link back to its pillar. Orphan pages produce zero SEO value.

7. **Keyword cannibalization must be identified and resolved before new content is commissioned.** Publishing a third page targeting a keyword already targeted by two existing pages will split ranking signals three ways and cause all three to rank lower. Consolidate first, then create.

8. **Set realistic ranking timelines and communicate them.** New content on a low-DR domain (under 30) in a competitive niche will not rank meaningfully for 6-12 months. New content on a high-DR domain targeting low-difficulty keywords may rank in 4-8 weeks. Timelines that are too optimistic destroy trust and lead to strategy abandonment.

9. **Competitor analysis must be based on organic search competitors, not just business competitors.** A SaaS company selling project management software may compete in the SERPs against Wikipedia, G2, Capterra, and productivity bloggers -- none of which are direct business rivals. The gap analysis and difficulty assessment must be calibrated against who actually ranks, not who the user considers competition.

10. **SERP feature opportunities (Featured Snippets, People Also Ask, video carousels) must be flagged in the strategy.** A keyword showing a featured snippet in the SERP is an opportunity to capture position zero with a specific formatting technique (definition in under 50 words, numbered steps with H2/H3 headers, or table format). Missing this means leaving high-visibility real estate unaddressed.

11. **Content format recommendations must match both the search intent and the competitive SERP landscape.** Before recommending a format, consider what type of content already dominates page one for that keyword. If all page-one results are listicles, a long-form narrative guide faces an intent-mismatch disadvantage. Aim to match or improve on the dominant format, not fight it.

12. **E-E-A-T signals must be addressed for any site in YMYL (Your Money or Your Life) categories.** Health, finance, legal, and safety topics are subject to elevated quality rater scrutiny. Content strategies for these domains must include author credentials, expert review processes, citations to authoritative sources, and About page optimization as part of the plan.

---

## Edge Cases

### New Website With Zero Content or Low Domain Rating (DR < 20)

A new site cannot compete for high-difficulty, high-volume keywords regardless of content quality. Google's trust signals (age, backlinks, topical authority) take time to accumulate.

- Start with 3-5 pillar pages to establish topical signals, but target only low-competition keywords (KD < 30, SERP dominated by low-DR sites or thin content)
- Focus 60% of early production on long-tail, highly specific queries (under 500 monthly searches) where competition is minimal -- these build indexed pages, topical signals, and can drive meaningful traffic in aggregate
- Set a 6-12 month expectation before significant organic traffic materializes. Month-over-month indexed page growth and impressions in Google Search Console are the leading indicators to monitor before traffic arrives
- Avoid targeting brand-name keywords of established competitors entirely until DR exceeds 40

### Local Business (Service Area or Brick-and-Mortar)

Local SEO has a distinct structure where geographic modifiers dominate keyword priority.

- Cluster structure must incorporate location modifiers: "[service] in [city]," "[service] near me," "[service] [city] [neighborhood]"
- The Google Business Profile is a ranking surface outside the website itself -- include GBP optimization (complete categories, services, Q&A, photo cadence, review strategy) as a parallel workstream
- Build location-specific landing pages for each major city or service area served, even if the business only has one physical location
- Local citations (NAP consistency across directories) are a ranking factor -- include a citation audit as a technical task
- Local content gaps are often hyperlocal: "[city] specific guides," "local event partnerships," "community case studies" -- these build relevance signals that national sites cannot replicate

### E-Commerce Site (Category and Product Pages as SEO Primary)

For e-commerce, product and category pages are the commercial core, and the blog supports discovery and top-of-funnel.

- Category pages are the pillar pages in e-commerce SEO. Optimize them with unique descriptive copy (minimum 250-300 words above the fold), proper H1/H2 structure, and faceted navigation handled correctly (canonical tags or parameter exclusion to prevent duplicate content from filters)
- Product pages need unique descriptions -- manufacturer copy used across thousands of sites is a duplicate content risk. Even 150-200 words of unique copy per product page differentiates the page
- Blog content strategy for e-commerce targets informational and commercial investigation queries that funnel into category or product pages through internal links. Example: "how to choose a hiking backpack" → links to the hiking backpack category page
- Structured data is especially high-leverage: Product schema with price, availability, and reviews enables rich results that increase click-through rate by 20-30% for product pages
- Seasonal keyword demand requires a calendar that accounts for traffic spikes 60-90 days before peak seasons (build holiday content in September for November peaks)

### B2B SaaS or Professional Services With Low Search Volume

Many B2B topics have monthly search volumes under 500 for primary keywords. Standard volume-weighted prioritization will misdirect the strategy.

- Reweight the Priority Score to emphasize Business Value (3x weight) over Search Volume (1x weight) in the scoring matrix. One keyword with 200 monthly searches that converts at 5% to a $5,000 ACV product is worth more than a 20,000-search keyword with no conversion path
- Focus heavily on "jobs to be done" keyword research: what problems does the target buyer search for before they know a product category exists? This requires going upstream of the product keyword
- Thought leadership content (original research, benchmark reports, data studies) builds domain authority and earns backlinks even in low-search-volume niches -- include one major original research piece per quarter in the calendar
- LinkedIn content amplification of blog posts is standard in B2B -- note where SEO content should be repurposed for social to extend its reach beyond organic search

### User Has No Competitor Data and Cannot Name Competitors

This is common for new businesses or founders who have not yet done competitive research.

- Ask the user for the problem their product or service solves and 2-3 example searches a potential customer might make before finding them
- Use those seed queries to infer what types of sites would rank: industry media, Wikipedia, Reddit/Quora communities, tool comparison sites (G2, Capterra), direct product competitors -- note these as the competitive landscape without fabricating specific site names or metrics
- Make explicit in the strategy: "This plan is built on inferred competitive positioning. It should be validated with a keyword tool audit (Semrush, Ahrefs, or Moz) before production begins to confirm difficulty estimates and identify additional gaps."
- Provide the framework and structure of the strategy in full, but flag all difficulty and volume estimates as provisional

### Multilingual or Multi-Regional Site

International SEO adds structural complexity that must be addressed before content production begins.

- Hreflang tags must be implemented for every page that has language or regional variants -- missing hreflang causes search engines to serve the wrong language version to users in the wrong region, or to treat translations as duplicate content
- Keyword research must be conducted independently in each target language -- do not translate English keyword lists and assume equivalent search behavior. Spanish-speaking users in Mexico search differently than those in Spain; both search differently than a machine-translated English list would suggest
- Subdomains (es.site.com), subdirectories (/es/), or ccTLDs (.es) each have SEO trade-offs. Subdirectories are generally recommended for consolidating domain authority unless there is a strong reason for separate ccTLDs
- Content localization is not translation -- it requires adapting examples, references, and cultural context for the target region

### Site With Large Existing Content Archive (200+ Pages, Significant Traffic Already)

For established sites, the audit and optimization workstream is as important as new content creation.

- Begin with a content audit before any new production. Classify all 200+ pages into four buckets: Keep and maintain (top 10%), Optimize and improve (positions 4-30, roughly 30%), Consolidate (multiple thin pages on the same topic -- merge into one comprehensive page with 301 redirects), Prune (thin, no-traffic, no-backlink pages that dilute crawl budget -- noindex or delete with redirect)
- Pruning low-quality content has historically produced significant organic traffic increases for large sites -- Google rewards a smaller site where every page is high quality over a large site with substantial thin content
- Crawl budget becomes a real concern at 500+ pages. Ensure the sitemap is clean, pagination is handled correctly, and parameter-driven URLs (filters, sorting, search results pages) are handled via robots.txt or canonical tags

---

## Example

**Input provided by user:**
"I need an SEO content strategy for our B2B SaaS platform that helps HR teams automate employee onboarding. We're at about 8,000 organic visits per month, have 35 blog posts and 12 landing pages. Our team can publish 5 pieces per month. Competitors we know of are BambooHR, Workday, and some smaller HR onboarding startups."

---

**Output:**

## SEO Content Strategy: HR Onboarding Automation Platform

**Primary Goal:** Grow organic traffic from 8,000 to 20,000 monthly visits in 9 months; increase organic-sourced demo requests by 40%

**Current Baseline:** 8,000 organic visits/month | 47 indexed pages (35 blog + 12 landing pages) | Domain Rating: Unknown -- recommend verifying in Ahrefs or Semrush

**Production Capacity:** 5 pieces/month -- recommended split: 3 new content + 2 existing content optimizations

**Strategy Period:** 9 months (3 phases of 3 months each)

**Date Prepared:** [Current date]

**Note on Competitor Scope:** BambooHR and Workday are dominant HR platforms with very high domain authority (DR 70-80+). This strategy avoids direct competition on their core brand keywords and instead targets the informational and commercial investigation queries they underinvest in. Smaller HR onboarding startups provide the most actionable competitive benchmark for content gap analysis.

---

### Section 1: Topical Authority Map (Keyword Clusters)

| Pillar Topic | Primary Keyword | Est. Monthly Searches | Cluster Subtopics | Avg. Difficulty | Business Value | Priority |
|---|---|---|---|---|---|---|
| Employee Onboarding Process | "employee onboarding process" | High (10k-50k) | 14 subtopics | Medium | High | 1 |
| HR Automation | "HR process automation" | Medium (1k-10k) | 10 subtopics | Medium-High | High | 2 |
| Remote Onboarding | "remote employee onboarding" | Medium (1k-10k) | 8 subtopics | Low-Medium | High | 3 |
| Onboarding Checklists & Templates | "employee onboarding checklist" | High (10k-50k) | 12 subtopics | Medium | High | 4 |
| Onboarding Best Practices by Role | "IT onboarding process" / "sales onboarding" | Medium (varies by role) | 15 subtopics (5 roles × 3 pages) | Low | Medium | 5 |

**Cluster Detail -- Pillar 1: Employee Onboarding Process**
- Primary keyword: "employee onboarding process" | Intent: Informational / Commercial Investigation
- Subtopics:
  1. "employee onboarding steps" -- Intent: Informational -- Volume: High -- Difficulty: Medium
  2. "new hire onboarding program" -- Intent: Informational -- Volume: Medium -- Difficulty: Medium
  3. "onboarding vs orientation" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
  4. "employee onboarding timeline" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
  5. "preboarding process" -- Intent: Informational -- Volume: Low -- Difficulty: Low
  6. "first 90 days onboarding plan" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
  7. "onboarding metrics and KPIs" -- Intent: Commercial Investigation -- Volume: Low -- Difficulty: Low
  8. "employee onboarding experience" -- Intent: Informational -- Volume: Medium -- Difficulty: Medium
  9. "onboarding program for remote employees" -- Intent: Informational -- Volume: Medium -- Difficulty: Medium (links to Pillar 3)
  10. "how long does onboarding take" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
- Long-tail variants: "employee onboarding process for small companies," "step by step employee onboarding checklist," "what should be included in employee onboarding," "onboarding new employees best practices 2025"
- SERP features present: Featured Snippets (definition + numbered steps), People Also Ask (extensive), Image pack for checklist visuals

**Cluster Detail -- Pillar 2: HR Automation**
- Primary keyword: "HR process automation" | Intent: Commercial Investigation
- Subtopics:
  1. "HR automation tools" -- Intent: Commercial Investigation -- Volume: Medium -- Difficulty: Medium
  2. "automate employee onboarding" -- Intent: Commercial + Transactional -- Volume: Medium -- Difficulty: Medium
  3. "HR workflow automation" -- Intent: Commercial Investigation -- Volume: Medium -- Difficulty: Medium
  4. "automated onboarding software" -- Intent: Transactional -- Volume: Medium -- Difficulty: Medium-High
  5. "HR task automation examples" -- Intent: Informational -- Volume: Low -- Difficulty: Low
  6. "reduce HR administrative tasks" -- Intent: Informational -- Volume: Low -- Difficulty: Low
  7. "HRIS automation" -- Intent: Commercial Investigation -- Volume: Medium -- Difficulty: Medium
  8. "onboarding automation ROI" -- Intent: Commercial Investigation -- Volume: Low -- Difficulty: Low
- Long-tail variants: "how to automate new hire paperwork," "employee onboarding automation software comparison," "benefits of automating HR onboarding"
- SERP features present: Tool comparison carousels, Featured Snippets for definition queries, strong PAA presence

**Cluster Detail -- Pillar 3: Remote Onboarding**
- Primary keyword: "remote employee onboarding" | Intent: Informational / Commercial Investigation
- Subtopics:
  1. "remote onboarding checklist" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
  2. "virtual onboarding best practices" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
  3. "onboarding remote employees tools" -- Intent: Commercial Investigation -- Volume: Low -- Difficulty: Low
  4. "remote onboarding challenges" -- Intent: Informational -- Volume: Low -- Difficulty: Low
  5. "remote employee first day" -- Intent: Informational -- Volume: Low -- Difficulty: Low
  6. "hybrid onboarding process" -- Intent: Informational -- Volume: Low -- Difficulty: Low
- Long-tail variants: "how to onboard remote employees effectively," "remote onboarding program template," "tools for onboarding remote workers"
- SERP features present: Numbered list Featured Snippets, strong PAA

**Cluster Detail -- Pillar 4: Onboarding Checklists and Templates**
- Primary keyword: "employee onboarding checklist" | Intent: Informational (high download/template intent)
- Note: This cluster has extremely high volume and directly generates top-of-funnel leads through content upgrade / gated PDF offers
- Subtopics:
  1. "new hire onboarding checklist template" -- Intent: Informational / Tool -- Volume: High -- Difficulty: Medium
  2. "IT onboarding checklist" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
  3. "HR onboarding checklist" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
  4. "manager onboarding checklist" -- Intent: Informational -- Volume: Low -- Difficulty: Low
  5. "30 60 90 day onboarding plan template" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
  6. "employee onboarding form template" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
  7. "new employee paperwork checklist" -- Intent: Informational -- Volume: Medium -- Difficulty: Low
- SERP features present: Heavy Featured Snippet presence for list-format content; Google will often show the checklist directly in the SERP -- format pages with numbered H3s to capture this

**Cluster Detail -- Pillar 5: Role-Specific Onboarding**
- Primary keyword: varies by role | Intent: Informational
- Subtopics (5 role categories, 3 pages each):
  1. "sales onboarding process" / "sales onboarding plan" / "sales onboarding best practices"
  2. "IT employee onboarding" / "IT onboarding checklist" / "software developer onboarding"
  3. "remote manager onboarding" / "how to onboard a manager" / "executive onboarding plan"
  4. "customer success onboarding" / "onboarding CSM hires" (lower volume but very high business value -- HR teams for SaaS companies)
  5. "healthcare employee onboarding" / "clinical staff onboarding" / "compliance onboarding healthcare"
- SERP features: Generally low competition with Featured Snippet opportunities in almost every query

---

### Section 2: Content Gap Analysis

**Existing Coverage Assessment**

| Cluster | Coverage Status | Page Count | Avg. Position | Performance Verdict | Action |
|---|---|---|---|---|---|
| Employee Onboarding Process | Partial | 6 blog posts | Positions 15-35 | Underperforming | Consolidate thin posts; optimize survivors |
| HR Automation | Partial | 3 blog posts + 2 landing pages | Positions 8-20 | Close to page one | Optimize aggressively |
| Remote Onboarding | Minimal | 2 blog posts | Positions 22-45 | Underperforming | Create pillar page; upgrade existing posts |
| Onboarding Checklists | Minimal | 1 blog post (generic) | Position 28 | Underperforming | Expand into full checklist hub |
| Role-Specific Onboarding | None | 0 pages | Not ranking | Gap | Create from scratch |

**Top Content Gaps (High Priority)**

1. **"Employee Onboarding Process" Pillar Page**
   - Why it matters: This is the broadest, highest-volume keyword in the domain. Without a comprehensive pillar page, all 6 partial posts are competing against each other and no single page has enough depth to rank for the head term
   - Estimated monthly searches: High (10,000-50,000)
   - Who currently ranks: HR software vendors (BambooHR, Rippling), HR media sites, SHRM -- all with high DR
   - Opportunity: A comprehensive 4,000+ word ultimate guide covering every stage of the onboarding process with original data can realistically achieve positions 5-15 in 4-6 months on a site with established topical signals

2. **"Onboarding Checklist" Template Hub**
   - Why it matters: Template and checklist queries have extremely high download intent -- this is the single best top-of-funnel lead magnet opportunity in the entire keyword universe for this product
   - Estimated monthly searches: High (combined cluster 20,000-60,000)
   - Who currently ranks: Templatelab, Process Street, Smartsheet (document template sites) -- not deeply authoritative on onboarding specifically, which creates an opening
   - Opportunity: An interactive or downloadable checklist page with depth on each step can realistically outperform generic document template sites on specific checklist queries

3. **"Automate Employee Onboarding" and "Automated Onboarding Software"**
   - Why it matters: These are the highest-commercial-intent keywords in the entire strategy. A user searching "automate employee onboarding" is at the bottom of the funnel
   - Estimated monthly searches: Medium (1,000-5,000 combined)
   - Who currently ranks: Software review sites (G2, Capterra), competitors with dedicated product landing pages
   - Opportunity: A product-focused guide ("How to Automate Your Employee Onboarding in 5 Steps") combined with a dedicated product landing page optimized for this keyword cluster would directly compete

4. **"Remote Onboarding Best Practices" Pillar**
   - Why it matters: Remote and hybrid work permanently changed onboarding -- this cluster has sustained high demand and relatively low content quality across the SERP
   - Estimated monthly searches: Medium (1,000-10,000 combined cluster)
   - Opportunity: Low to medium difficulty across most subtopics; a comprehensive pillar can achieve page one rankings within 60-90 days given the current site authority

5. **Role-Specific Onboarding Guides (all 5 roles)**
   - Why it matters: Extremely low competition, long-tail traffic aggregates to meaningful volume, and these pages directly speak to the personas buying the product (HR managers onboarding specific team types)
   - Estimated monthly searches: Low per page (100-500), but 15 pages × 200 visits = 3,000 visits/month in aggregate
   - Opportunity: First-mover advantage in most of these subtopics; role-specific pages also demonstrate topical depth that boosts the entire site's authority in the onboarding space

**Optimization Targets (Content Exists, Ranking in Positions 4-30)**

| Page Title | Target Keyword | Current Position | Traffic Opportunity | What to Improve |
|---|---|---|---|---|
| "HR Automation Guide" (existing blog) | "HR process automation" | 8 | Estimated 400 additional visits/month if moved to position 2-3 | Expand from estimated 1,200 words to 3,000+; add tool comparison table; add FAQ schema for PAA capture; build 5 internal links from high-authority pages |
| "New Employee Onboarding Tips" (blog) | "employee onboarding tips" | 14 | Estimated 300 additional visits/month | Restructure with numbered H2s (Featured Snippet eligibility); add expert quotes for E-E-A-T; add internal links from checklist pages once created |
| "HR Software Landing Page" | "automated onboarding software" | 19 | Estimated 150 additional visits/month | Add social proof section; add comparison table vs manual process; expand keyword coverage to include "automate new hire paperwork" in subheadings |

**Competitor Content Not Covered**

| Competitor Type | Their Top Page | Est. Traffic | User's Coverage | Gap Priority |
|---|---|---|---|---|
| HR software vendor (Rippling/BambooHR-type) | "What is employee onboarding" definitional guide | High | None | High -- create foundational definitional pillar content |
| HR software vendor | "New hire onboarding checklist [year]" | High | Minimal (1 weak page) | High -- highest-volume template query |
| Process documentation tool (Process Street) | "HR onboarding process templates" | Medium |
