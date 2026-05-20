---
name: seo-advisor
description: |
  Comprehensive SEO strategy including keyword research, on-page optimization, technical SEO auditing, content strategy, link building, local SEO, Core Web Vitals, schema markup, and monthly SEO workflow planning. Use when the user asks about seo advisor or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "seo marketing analysis"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Seo Advisor

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to seo advisor.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on seo advisor
- User asks about seo advisor best practices or techniques
- User wants a structured approach to seo advisor

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of seo advisor
## Questions to Ask the User First

1. **What is your website URL?**
2. **What does your business do?** (Products, services, content)
3. **Who is your target audience?** (Demographics, geography, intent)
4. **What are your top 5-10 target keywords?** (If you have them)
5. **What is your current organic traffic?** (Monthly sessions from search)
6. **What is your domain age and authority?** (DR/DA if known)
7. **What CMS are you using?** (WordPress, Shopify, custom, etc.)
8. **Do you have an existing content strategy?** (Blog, resources, etc.)
9. **What is your SEO budget?** (Content, tools, link building)
10. **What are your primary conversion goals?** (Leads, sales, signups, traffic)
---
## Step 1: Keyword Research Methodology

### Keyword Research Workflow
```
KEYWORD RESEARCH PROCESS
STEP 1: SEED KEYWORDS
  List 10-20 seed keywords related to your business:
  1. {{seed_keyword_1}}
  2. {{seed_keyword_2}}
  3. {{seed_keyword_3}}
  ...
  Sources for seed keywords:
  - Your product/service descriptions
  - Customer language (how they describe the problem)
  - Competitor websites (titles, headings, content)
  - Sales team (what phrases do prospects use?)
  - Google Autocomplete suggestions
  - Google "People Also Ask" boxes
  - Reddit/forum discussions in your niche
STEP 2: KEYWORD EXPANSION
  For each seed keyword, generate variations:
  - Long-tail variations: "{{seed}} for {{use_case}}"
  - Question keywords: "how to {{seed}}", "what is {{seed}}"
  - Comparison keywords: "{{seed}} vs {{alternative}}"
  - Commercial keywords: "best {{seed}}", "{{seed}} pricing"
  - Local keywords: "{{seed}} in {{city}}"
  Tools for expansion:
  - Google Keyword Planner (free with Google Ads account)
  - Ubersuggest (free tier available)
  - AnswerThePublic (question keywords)
  - Google Search Console (keywords you already rank for)
  - Ahrefs/SEMrush (paid, most comprehensive)
STEP 3: KEYWORD EVALUATION
  For each keyword, assess:
  | Keyword | Monthly Volume | Keyword Difficulty | CPC | Intent | Priority |
  |---------|---------------|-------------------|-----|--------|----------|
  | {{kw1}} | {{vol}}       | {{KD}}            | ${{}}| {{}}  | {{H/M/L}}|
  | {{kw2}} | {{vol}}       | {{KD}}            | ${{}}| {{}}  | {{H/M/L}}|
  | {{kw3}} | {{vol}}       | {{KD}}            | ${{}}| {{}}  | {{H/M/L}}|
STEP 4: SEARCH INTENT CLASSIFICATION
  For each keyword, classify intent:
  - Informational: User wants to learn (how to, what is, guide)
  - Navigational: User looking for specific site/page
  - Commercial: User researching before purchase (best, review, vs)
  - Transactional: User ready to buy (buy, pricing, discount)
STEP 5: KEYWORD MAPPING
  Assign keywords to pages:
  | Target Page          | Primary Keyword | Secondary Keywords | Intent |
  |---------------------|----------------|-------------------|--------|
  | Homepage            | {{kw}}         | {{kw2, kw3}}      | {{}}   |
  | Product page 1      | {{kw}}         | {{kw2, kw3}}      | {{}}   |
  | Category page       | {{kw}}         | {{kw2, kw3}}      | {{}}   |
  | Blog post 1         | {{kw}}         | {{kw2, kw3}}      | {{}}   |
  | Blog post 2         | {{kw}}         | {{kw2, kw3}}      | {{}}   |
  RULE: One primary keyword per page. Avoid keyword cannibalization.
```
---
## Step 2: On-Page SEO Checklist

### Per-Page Optimization
```
ON-PAGE SEO CHECKLIST (apply to every important page)
URL STRUCTURE:
- [ ] Short, descriptive URL: /{{primary-keyword}}
- [ ] Hyphens between words (not underscores)
- [ ] No unnecessary parameters or IDs
- [ ] HTTPS (not HTTP)
TITLE TAG:
- [ ] Primary keyword included (ideally near the start)
- [ ] 50-60 characters maximum
- [ ] Unique across all pages
- [ ] Compelling for click-through
- [ ] Format: {{Primary Keyword}} - {{Secondary Benefit}} | {{Brand}}
META DESCRIPTION:
- [ ] 150-160 characters
- [ ] Primary keyword included naturally
- [ ] Includes a call-to-action
- [ ] Unique across all pages
- [ ] Compelling enough to earn the click
HEADINGS:
- [ ] H1: One per page, includes primary keyword
- [ ] H2s: Subtopics with secondary keywords
- [ ] H3s: Sub-subtopics where needed
- [ ] Logical hierarchy (no skipping levels)
CONTENT:
- [ ] Primary keyword in first 100 words
- [ ] Keyword variations used naturally throughout
- [ ] Content length appropriate for intent (check top-ranking pages)
- [ ] Unique, original content (not duplicated/thin)
- [ ] Answers the search query comprehensively
- [ ] Includes relevant multimedia (images, video, tables)
- [ ] External links to authoritative sources
- [ ] Internal links to related content on your site
IMAGES:
- [ ] Descriptive file names: {{keyword}}-{{descriptor}}.jpg
- [ ] Alt text on every image (descriptive, keyword where natural)
- [ ] Compressed file size (use WebP format)
- [ ] Responsive/properly sized for display dimensions
- [ ] Lazy loading enabled
INTERNAL LINKING:
- [ ] Link to related content from within body text
- [ ] Use descriptive anchor text (not "click here")
- [ ] Link to important pages from high-authority pages
- [ ] Breadcrumb navigation implemented
- [ ] No orphan pages (every page has at least one internal link)
SCHEMA MARKUP:
- [ ] Organization schema on homepage
- [ ] Article schema on blog posts
- [ ] Product schema on product pages
- [ ] FAQ schema on FAQ content
- [ ] Review/Rating schema where applicable
- [ ] LocalBusiness schema (if local business)
- [ ] BreadcrumbList schema
```
---
## Step 3: Technical SEO Audit
```
TECHNICAL SEO AUDIT CHECKLIST
CRAWLABILITY:
- [ ] robots.txt is configured correctly (not blocking important pages)
- [ ] XML sitemap exists and is submitted to Google Search Console
- [ ] XML sitemap is up to date and includes all important pages
- [ ] No important pages blocked by noindex tags
- [ ] Crawl budget is not wasted on low-value pages
- [ ] Internal linking structure allows all pages to be discovered
INDEXABILITY:
- [ ] All important pages are indexed (check: site:yourdomain.com)
- [ ] No duplicate content issues (canonical tags implemented)
- [ ] Pagination handled properly (rel=prev/next or load more)
- [ ] Parameter URLs managed (Google Search Console URL parameters)
- [ ] Faceted navigation not creating duplicate pages
SITE SPEED (Core Web Vitals):
- [ ] Largest Contentful Paint (LCP): < 2.5 seconds
- [ ] First Input Delay (FID) / Interaction to Next Paint (INP): < 200ms
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] Time to First Byte (TTFB): < 600ms
- [ ] Total page size: < 3MB
- [ ] Render-blocking resources minimized
- [ ] Images optimized (WebP, lazy loading, proper sizing)
- [ ] CDN configured for static assets
- [ ] Caching headers set appropriately
- [ ] JavaScript and CSS minified
MOBILE:
- [ ] Mobile-friendly test passes (Google tool)
- [ ] Responsive design (not separate mobile site)
- [ ] Touch targets are properly sized (48px minimum)
- [ ] No horizontal scrolling
- [ ] Font size readable without zooming (16px minimum)
- [ ] Mobile page speed is acceptable
SECURITY:
- [ ] HTTPS on all pages
- [ ] No mixed content (HTTP resources on HTTPS pages)
- [ ] SSL certificate is valid and not expiring soon
- [ ] HTTP to HTTPS redirects in place
ARCHITECTURE:
- [ ] Clear site hierarchy (max 3 clicks to any page)
- [ ] Logical URL structure matching site hierarchy
- [ ] Breadcrumbs implemented
- [ ] 404 page is custom and helpful
- [ ] No redirect chains (A->B->C, should be A->C)
- [ ] No redirect loops
- [ ] All redirects are 301 (permanent), not 302 (temporary)
STRUCTURED DATA:
- [ ] Schema markup validates (Google Rich Results Test)
- [ ] Appropriate schema types for each page type
- [ ] No schema errors in Google Search Console
```

### Core Web Vitals Improvement Guide
```
CORE WEB VITALS OPTIMIZATION

IF LCP IS TOO SLOW (> 2.5s):
  1. Optimize the largest image on the page
     - Use WebP format
     - Set proper width/height attributes
     - Preload the LCP image: <link rel="preload" as="image" href="...">
  2. Reduce server response time
     - Upgrade hosting
     - Enable CDN
     - Optimize database queries
  3. Remove render-blocking resources
     - Defer non-critical CSS/JS
     - Inline critical CSS
  4. Reduce third-party script impact
     - Delay non-essential scripts
     - Use async/defer attributes

IF INP IS TOO SLOW (> 200ms):
  1. Reduce JavaScript execution time
  2. Break up long tasks into smaller chunks
  3. Minimize event handler work
  4. Use web workers for heavy computation

IF CLS IS TOO HIGH (> 0.1):
  1. Always include width/height on images and videos
  2. Reserve space for ad slots
  3. Avoid inserting content above existing content
  4. Use CSS aspect-ratio for responsive embeds
  5. Preload web fonts to prevent flash of unstyled text
```
---
## Step 4: Content Strategy for SEO
```
SEO CONTENT STRATEGY
CONTENT PILLARS:
  Define 3-5 topic clusters around your core business:
  Pillar 1: {{topic}}
    Pillar page: {{url}} (comprehensive guide, 3000+ words)
    Cluster articles:
      - {{subtopic_1}} (targets: {{keyword}})
      - {{subtopic_2}} (targets: {{keyword}})
      - {{subtopic_3}} (targets: {{keyword}})
      - {{subtopic_4}} (targets: {{keyword}})
  Pillar 2: {{topic}}
    Pillar page: {{url}}
    Cluster articles:
      - {{subtopic_1}}
      - {{subtopic_2}}
      - {{subtopic_3}}
  Pillar 3: {{topic}}
    Pillar page: {{url}}
    Cluster articles:
      - {{subtopic_1}}
      - {{subtopic_2}}
      - {{subtopic_3}}
CONTENT TYPES BY FUNNEL STAGE:
  Top of Funnel (Awareness):
    - How-to guides
    - Industry trend articles
    - Beginner's guides
    - Infographics
    - Glossary/definitions
  Middle of Funnel (Consideration):
    - Comparison articles (X vs Y)
    - Buyer's guides
    - Case studies
    - Expert roundups
    - Templates and tools
  Bottom of Funnel (Decision):
    - Product/service pages
    - Pricing pages
    - Testimonials/reviews pages
    - Free trial/demo pages
    - FAQ pages
CONTENT BRIEF TEMPLATE:
  Title: {{title}}
  Target keyword: {{primary_keyword}}
  Secondary keywords: {{keyword_2}}, {{keyword_3}}
  Search intent: {{informational/commercial/transactional}}
  Target word count: {{count}} (based on top-ranking competitors)
  Target audience: {{persona}}
  Outline:
    H1: {{title}}
    H2: {{section_1}}
      H3: {{subsection}}
    H2: {{section_2}}
    H2: {{section_3}}
    H2: FAQ
  Competing articles to beat: {{url_1}}, {{url_2}}, {{url_3}}
  Unique angle: {{what_makes_this_better}}
  Internal links to include: {{page_1}}, {{page_2}}
  CTA: {{desired_action}}
```
---
## Step 5: Link Building Strategies
```
LINK BUILDING STRATEGY
TIER 1: EASY WINS (Month 1)
  - [ ] Claim business profiles (Google Business, Bing Places, Yelp)
  - [ ] Industry directories and associations
  - [ ] Supplier/partner "our customers" pages
  - [ ] Social media profiles with website links
  - [ ] Unlinked brand mentions (find with Google Alerts, then request link)
  - [ ] Broken link building (find broken links on relevant sites, offer yours)
TIER 2: CONTENT-DRIVEN (Ongoing)
  - [ ] Create linkable assets (original research, tools, infographics)
  - [ ] Guest posting on relevant industry blogs
  - [ ] Expert quotes/contributions (HARO, Qwoted, SourceBottle)
  - [ ] Skyscraper technique (improve on top-ranking content, then outreach)
  - [ ] Resource page link building
TIER 3: RELATIONSHIP-DRIVEN (Ongoing)
  - [ ] Build relationships with journalists and bloggers
  - [ ] Speak at conferences and webinars (get linked from event pages)
  - [ ] Participate in podcasts (show notes link back)
  - [ ] Co-marketing with complementary businesses
  - [ ] Sponsor relevant events or nonprofits

LINK BUILDING OUTREACH TEMPLATE:

Subject: {{Personalized subject referencing their content}}

Hi {{name}},

I was reading your article on {{topic}} and particularly
liked your point about {{specific_detail}}.

I recently published {{content_description}} that {{relevance
to their audience}}. I thought it might be a valuable addition
to your piece / resource page / roundup.

Here is the link: {{url}}

Either way, keep up the great work on {{their_site}}.

Best,
{{your_name}}

AVOID (will hurt your SEO):
- Buying links from link farms
- Excessive reciprocal linking
- Link schemes or private blog networks (PBNs)
- Comment spam
- Low-quality directory submissions
- Paid links without rel="sponsored" attribute
```
---
## Step 6: Local SEO
```
LOCAL SEO CHECKLIST (for businesses with physical locations)

GOOGLE BUSINESS PROFILE:
- [ ] Claimed and verified
- [ ] Business name matches real name exactly
- [ ] Address is accurate and consistent
- [ ] Phone number is local (not toll-free)
- [ ] Business hours are correct (including holidays)
- [ ] Primary category is correct
- [ ] Secondary categories added
- [ ] Business description optimized with keywords
- [ ] Photos uploaded (exterior, interior, team, products)
- [ ] Posts published regularly (weekly)
- [ ] Q&A section monitored and answered
- [ ] Reviews responded to (all reviews, positive and negative)
- [ ] Products/services listed
- [ ] Messaging enabled (if you can respond promptly)

NAP CONSISTENCY (Name, Address, Phone):
- [ ] Identical NAP on website, Google, Bing, Yelp, Facebook
- [ ] NAP in schema markup on website
- [ ] NAP on website footer (all pages)
- [ ] Audit major directories for incorrect listings (Moz Local, BrightLocal)

LOCAL CITATIONS:
  Priority directories:
  - [ ] Google Business Profile
  - [ ] Bing Places
  - [ ] Apple Maps
  - [ ] Yelp
  - [ ] Facebook Business Page
  - [ ] Better Business Bureau
  - [ ] Industry-specific directories

LOCAL CONTENT:
- [ ] Location pages for each service area
- [ ] Local landing pages for "{{service}} in {{city}}" keywords
- [ ] Local blog content (community events, local partnerships)
- [ ] Customer testimonials mentioning location

REVIEWS STRATEGY:
  Target: {{count}} new reviews per month
  Process:
  1. Identify happy customers (NPS > 8)
  2. Send review request via email/SMS with direct link
  3. Respond to all reviews within 48 hours
  4. Address negative reviews professionally and constructively
```
---
## Step 7: Monthly SEO Workflow
```
MONTHLY SEO WORKFLOW

WEEK 1: MONITOR & ANALYZE
  Monday: Review Google Search Console
    - [ ] Check for crawl errors and fix
    - [ ] Review search performance (clicks, impressions, CTR, position)
    - [ ] Identify declining keywords (position drops)
    - [ ] Check for manual actions or security issues

  Tuesday: Review analytics
    - [ ] Organic traffic trends (MoM, YoY)
    - [ ] Top landing pages by organic traffic
    - [ ] Conversion rate from organic traffic
    - [ ] New vs returning organic visitors

  Wednesday: Competitive check
    - [ ] Check competitor rankings for target keywords
    - [ ] Note any new competitor content in your space
    - [ ] Review competitor backlink activity

WEEK 2: TECHNICAL & ON-PAGE
  - [ ] Run technical crawl (Screaming Frog or Sitebulb)
  - [ ] Fix any new broken links (404s)
  - [ ] Optimize underperforming pages (low CTR, position 4-20)
  - [ ] Update or refresh aging content (older than 12 months)
  - [ ] Check and improve Core Web Vitals

WEEK 3: CONTENT CREATION
  - [ ] Publish {{count}} new pieces of content
  - [ ] Optimize new content with on-page checklist
  - [ ] Add internal links from existing content to new content
  - [ ] Add internal links from new content to important pages
  - [ ] Submit new URLs to Google Search Console for indexing

WEEK 4: LINK BUILDING & OUTREACH
  - [ ] Identify {{count}} link building opportunities
  - [ ] Send {{count}} outreach emails
  - [ ] Follow up on previous outreach
  - [ ] Check for new unlinked brand mentions
  - [ ] Update and distribute linkable assets

MONTHLY REPORT METRICS:
  - Organic traffic: {{sessions}} ({{change}}% MoM)
  - Organic conversions: {{count}} ({{change}}% MoM)
  - Keywords in top 3: {{count}} ({{change}})
  - Keywords in top 10: {{count}} ({{change}})
  - Keywords in top 100: {{count}} ({{change}})
  - Backlinks acquired: {{count}}
  - Domain authority/rating: {{score}} ({{change}})
  - Top gaining keywords: {{list}}
  - Top declining keywords: {{list}}
```
---
## SEO Tools Comparison
```
SEO TOOL RECOMMENDATIONS

FREE TOOLS:
  Google Search Console: Rankings, clicks, indexing, errors
  Google Analytics 4: Traffic, conversions, user behavior
  Google PageSpeed Insights: Core Web Vitals, speed recommendations
  Google Rich Results Test: Schema markup validation
  Ubersuggest (free tier): Basic keyword research
  AnswerThePublic (free tier): Question keyword ideas
  Screaming Frog (free up to 500 URLs): Technical crawl

PAID TOOLS BY NEED:
  All-in-one SEO:
    Ahrefs ($129+/mo): Best for backlink analysis, keyword research
    SEMrush ($139+/mo): Best for competitive analysis, content tools
    Moz Pro ($99+/mo): Good for beginners, local SEO

  Technical SEO:
    Screaming Frog ($259/year): Deep technical crawling
    Sitebulb ($152+/year): Visual technical audits

  Content:
    Clearscope ($170+/mo): Content optimization and scoring
    SurferSEO ($89+/mo): Content editor with NLP analysis

  Local SEO:
    BrightLocal ($39+/mo): Local rank tracking, citation audits
    Whitespark ($39+/mo): Citation building, review management

  Rank Tracking:
    Ahrefs/SEMrush (included): General rank tracking
    AccuRanker ($129+/mo): Dedicated rank tracking at scale

RECOMMENDED STACK BY BUDGET:
  $0/month: Google Search Console + GA4 + Ubersuggest
  $100-200/month: Above + Ahrefs or SEMrush
  $300-500/month: Above + Screaming Frog + Clearscope/SurferSEO
  $500+/month: Full tool stack + dedicated local SEO tools
```
---
## Output Checklist

- [ ] Keyword research covers all funnel stages and intent types
- [ ] On-page optimization checklist applied to priority pages
- [ ] Technical audit identifies and prioritizes issues
- [ ] Content strategy aligns with pillar/cluster model
- [ ] Link building plan includes ethical, sustainable tactics
- [ ] Local SEO covers Google Business Profile and citations (if applicable)
- [ ] Monthly workflow is documented and assigned
- [ ] Tool recommendations match budget constraints
- [ ] All recommendations are prioritized by impact
- [ ] Success metrics and reporting cadence are defined


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Seo Advisor deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with seo advisor for a mid-size project."

**Output:** A complete seo advisor framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
