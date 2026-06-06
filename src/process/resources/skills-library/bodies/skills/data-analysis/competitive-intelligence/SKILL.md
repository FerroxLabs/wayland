---
name: competitive-intelligence
description: |
  Produces a competitive intelligence framework: defines the competitors to track, the intelligence dimensions (product, pricing, marketing, hiring), the data sources, the collection cadence, and the comparison format.
  Use when the user asks to track competitors, build a competitive analysis, monitor competitor activity, create a market comparison, or set up ongoing competitive intelligence gathering.
  Do NOT use for sentiment analysis of brand mentions (use sentiment-analysis-guide), internal product metric frameworks (use metric-framework or kpi-definition), or general market sizing research (use research-synthesis for source synthesis).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research analysis planning"
  category: "data-analysis"
  subcategory: "research-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Competitive Intelligence

## When to Use

**Use this skill when:**
- User asks to track competitors or build a competitive analysis
- User wants to compare their product, pricing, or positioning against competitors
- User needs a structured framework for ongoing competitive monitoring
- User asks how to gather intelligence on competitor activity (product launches, pricing changes, hiring trends)
- User wants to create a competitive battlecard or comparison matrix

**Do NOT use when:**
- User wants to analyze sentiment in brand mentions or reviews (use `sentiment-analysis-guide`)
- User wants to define internal KPIs or metric frameworks (use `kpi-definition` or `metric-framework`)
- User wants to synthesize findings from published research reports (use `research-synthesis`)
- User wants to design a customer survey about competitors (use `survey-design`)

## Process

1. **Define the competitive intelligence scope.** Ask the user:
   - What is your product or service? (brief description, target market, pricing tier)
   - Who are the competitors you want to track? (direct competitors, indirect competitors, emerging threats)
   - What decisions will this intelligence inform? (product roadmap, pricing strategy, sales positioning, market entry, investor pitch)
   - How often do you need updates? (one-time analysis, quarterly review, continuous monitoring)
   - Who is the audience for the output? (executive team, product team, sales team, investors)

2. **Identify the competitors.** Categorize them:
   - **Direct competitors:** Same target market, similar product, competing for the same customers
   - **Indirect competitors:** Different product but solving the same problem for the same audience
   - **Emerging threats:** New entrants, adjacent players expanding into your market, open-source alternatives
   - **Aspirational benchmarks:** Market leaders you want to learn from, even if they are not direct competitors

   **Recommendation:** Track 3-5 direct competitors in depth, 2-3 indirect competitors at a high level, and scan for emerging threats quarterly. More than 10 tracked competitors dilutes focus.

3. **Select the intelligence dimensions.** Choose which aspects of competitors to monitor:

   | Dimension | What to Track | Signal Value |
   |-----------|--------------|--------------|
   | **Product** | Features, capabilities, integrations, platform changes, product launches, deprecations | What they are building reveals their strategy |
   | **Pricing** | Price points, plan tiers, discounts, free tier limits, enterprise pricing signals | Pricing changes indicate market positioning shifts |
   | **Positioning** | Tagline, homepage messaging, target persona language, case studies highlighted | How they describe themselves reveals who they are targeting |
   | **Marketing** | Content themes, ad spend signals, event sponsorships, partnerships announced | Marketing activity indicates growth priorities |
   | **Hiring** | Job postings by department, seniority, location, technology stack in listings | Hiring reveals investment areas 6-12 months before product changes |
   | **Customer signals** | Review site ratings, customer complaints, churn indicators, case study wins | Customer experience reveals strengths and weaknesses |
   | **Financial** | Revenue estimates, funding rounds, acquisitions, public filings | Financial health indicates sustainability and growth trajectory |
   | **Technology** | Tech stack changes, API updates, performance benchmarks, security certifications | Technical direction signals platform evolution |

   **Default recommendation:** For most competitive analyses, track Product, Pricing, Positioning, and Customer signals. Add Hiring and Financial for strategic planning. Add Technology for platform-level competition.

4. **Define the data sources.** For each intelligence dimension, identify where to collect information:

   **Public sources (available to anyone):**
   - Competitor websites: pricing pages, feature comparison pages, changelog, blog, press releases
   - Review platforms: G2, Capterra, Trustpilot, app store reviews
   - Job boards: LinkedIn Jobs, company careers pages, Indeed, Glassdoor
   - Social media: company accounts, executive posts, community discussions
   - Regulatory filings: SEC filings, patent applications, trademark registrations
   - Industry reports: analyst reports, market research publications, conference presentations

   **Semi-public sources (require effort to access):**
   - Product demos: sign up for free trials, attend webinars, request sales demos
   - Community forums: Slack communities, Reddit, Stack Overflow, Discord servers
   - Conference content: recorded talks, slide decks, booth presence

   **Internal sources (your own data):**
   - Win/loss analysis: why customers chose you or a competitor
   - Sales call notes: what prospects say about competitors
   - Customer support tickets: feature requests that reference competitors
   - Churn interviews: which competitor customers switch to and why

5. **Design the collection cadence.** Define how often each source is checked:

   | Frequency | Sources | Purpose |
   |-----------|---------|---------|
   | **Weekly** | Competitor blog, changelog, pricing page, job postings | Catch product launches and pricing changes quickly |
   | **Monthly** | Review platforms, social media presence, marketing themes | Track sentiment trends and positioning shifts |
   | **Quarterly** | Full competitive matrix update, win/loss analysis, strategic review | Deep analysis for leadership and planning |
   | **Event-driven** | Funding announcements, acquisitions, major launches, outages | React to significant competitive events immediately |

6. **Build the comparison format.** Design the output that will be shared with stakeholders.

## Output Format

```
## Competitive Intelligence Framework: [Your Product/Company]

### Intelligence Scope
- **Your product:** [Brief description]
- **Target market:** [Who you serve]
- **Decision this informs:** [Product roadmap / Pricing / Sales / Strategy]
- **Update cadence:** [One-time / Quarterly / Continuous]
- **Audience:** [Who receives this intelligence]

### Competitor Map

| Competitor | Type | Overlap | Threat Level | Priority |
|-----------|------|---------|-------------- |----------|
| [Competitor A] | Direct | [Which segments overlap] | High | Track weekly |
| [Competitor B] | Direct | [Overlap description] | High | Track weekly |
| [Competitor C] | Indirect | [Overlap description] | Medium | Track monthly |
| [Competitor D] | Emerging | [Overlap description] | Medium | Track quarterly |

### Intelligence Dimensions Tracked

| Dimension | Tracked | Sources | Frequency |
|-----------|---------|---------|-----------|
| Product | Yes | [Sources] | [Cadence] |
| Pricing | Yes | [Sources] | [Cadence] |
| Positioning | Yes | [Sources] | [Cadence] |
| Customer Signals | Yes | [Sources] | [Cadence] |
| Hiring | [Yes/No] | [Sources] | [Cadence] |
| Financial | [Yes/No] | [Sources] | [Cadence] |

### Competitive Comparison Matrix

#### Feature Comparison

| Feature | Your Product | Competitor A | Competitor B | Competitor C |
|---------|-------------|-------------|-------------|-------------|
| [Feature 1] | [Status] | [Status] | [Status] | [Status] |
| [Feature 2] | [Status] | [Status] | [Status] | [Status] |

Status values: Full support, Partial, Planned, Not available, Unknown

#### Pricing Comparison

| Plan | Your Product | Competitor A | Competitor B | Competitor C |
|------|-------------|-------------|-------------|-------------|
| Free tier | [Details] | [Details] | [Details] | [Details] |
| Entry plan | [Price + limits] | [Price + limits] | [Price + limits] | [Price + limits] |
| Mid-tier | [Price + limits] | [Price + limits] | [Price + limits] | [Price + limits] |
| Enterprise | [Pricing model] | [Pricing model] | [Pricing model] | [Pricing model] |

#### Positioning Comparison

| Element | Your Product | Competitor A | Competitor B |
|---------|-------------|-------------|-------------|
| Tagline | [Current tagline] | [Their tagline] | [Their tagline] |
| Target persona | [Who you target] | [Who they target] | [Who they target] |
| Key differentiator | [Your claim] | [Their claim] | [Their claim] |
| Primary use case | [Your focus] | [Their focus] | [Their focus] |

### Competitive Battlecard: [Competitor A]

**Overview:** [One-paragraph description of the competitor]

**Their strengths:**
- [Strength 1 with evidence]
- [Strength 2 with evidence]

**Their weaknesses:**
- [Weakness 1 with evidence]
- [Weakness 2 with evidence]

**When we win against them:**
- [Scenario 1: what the customer values that we deliver better]
- [Scenario 2]

**When we lose to them:**
- [Scenario 1: what the customer values that they deliver better]
- [Scenario 2]

**Objection handling:**
- "They have [feature X]" -> [Response with your alternative or roadmap]
- "They are cheaper" -> [Response with value justification]

### Collection Schedule

| Task | Frequency | Owner | Time Required | Output |
|------|-----------|-------|---------------|--------|
| Pricing page check | Weekly | [Role] | 15 min | Price change log |
| Changelog review | Weekly | [Role] | 30 min | Feature launch log |
| Review site scan | Monthly | [Role] | 1 hour | Sentiment summary |
| Full matrix update | Quarterly | [Role] | 4-8 hours | Updated comparison matrix |
| Win/loss analysis | Quarterly | [Role] | 2-4 hours | Win/loss report |

### Alert Triggers

| Event | Detection Method | Response |
|-------|-----------------|----------|
| Pricing change | Weekly pricing page check | Update pricing comparison; alert sales team within 48 hours |
| Major feature launch | Changelog review or press release | Assess impact; update battlecards within 1 week |
| Funding announcement | News monitoring | Assess strategic implications at next quarterly review |
| Acquisition | News monitoring | Immediate leadership briefing; assess competitive impact |
```

## Rules

1. NEVER present competitive intelligence as fact without citing the source -- "Competitor A has 500 employees" must be backed by a specific source (LinkedIn company page, press release, SEC filing), not assumed
2. ALWAYS distinguish between confirmed intelligence (from public sources) and inferred intelligence (from indirect signals like job postings) -- inferences can be wrong
3. Competitive comparison matrices must use consistent evaluation criteria across all competitors -- rating your product "Full support" and a competitor "Partial" for the same capability level is dishonest and undermines credibility with sales teams
4. NEVER include intelligence gathered through unethical means -- do not encourage pretending to be a customer, accessing private repositories, or using deceptive practices to collect competitor data
5. Feature comparison status must be current -- include a "Last verified" date for each competitor column; stale intelligence is worse than no intelligence because it creates false confidence
6. Pricing comparisons must note what is included at each tier, not just the price -- a $50/month plan with 5 users is not comparable to a $50/month plan with unlimited users
7. Battlecards must include "When we lose" scenarios, not just "When we win" -- sales teams that only hear positive positioning are blindsided in competitive deals
8. The collection schedule must assign an owner and time estimate for each task -- intelligence frameworks without owners become shelfware within one quarter
9. NEVER track more than 10 competitors in depth -- focus degrades with breadth; 3-5 deeply tracked competitors produce better intelligence than 15 superficially monitored ones
10. Every competitive intelligence output must answer "So what?" -- stating that a competitor launched a feature is not intelligence; stating what it means for your product strategy is

## Edge Cases

- **Early-stage startup with no clear competitors:** Identify the alternative solutions customers use today (spreadsheets, manual processes, hiring a person to do it). These are your competitors even if they are not products. Frame the competitive analysis as "current alternatives" rather than "direct competitors." Include at least one aspirational benchmark.

- **Competitor is a large platform with many products (Google, Microsoft, Salesforce):** Focus the analysis on the specific product line or feature set that competes with you, not the entire company. A startup CRM is not competing with all of Salesforce -- it is competing with Salesforce Essentials or a specific Sales Cloud feature. Scope the battlecard to the relevant product.

- **Market with rapid competitor turnover (many startups entering and exiting):** Maintain a stable tracking list of 3-5 established competitors and a "watchlist" of 5-10 emerging entrants. Promote from the watchlist to the tracking list when an emerging competitor gains traction (defined criteria: raised Series A, reached 100 reviews on G2, appeared in 3+ win/loss interviews). Demote when a competitor pivots away or shuts down.

- **Regulated industry where pricing is not publicly available:** Note "Pricing not publicly disclosed" in the comparison matrix. Use proxy signals: customer reviews mentioning pricing, analyst reports with pricing estimates, job postings for pricing analysts (indicates pricing complexity). Do not invent pricing data.

- **Competitive intelligence for internal stakeholders with different needs:** Create layered outputs. Executive summary (1 page): market position, top 3 competitive threats, recommended actions. Sales battlecards (1 page per competitor): strengths, weaknesses, objection handling. Product team deep-dive (5-10 pages): feature-level comparison, roadmap implications, technical architecture differences.

## Example

**Input:** "We run a project management tool for small teams (10-50 people). Our main competitors are Asana, Monday.com, and ClickUp. We need to understand how we compare on features and pricing to inform our Q2 product roadmap."

**Output:**

## Competitive Intelligence Framework: TeamFlow (Project Management)

### Intelligence Scope
- **Your product:** TeamFlow -- project management tool for teams of 10-50 people, focused on simplicity and speed
- **Target market:** Small and mid-size businesses, non-technical teams
- **Decision this informs:** Q2 product roadmap prioritization and pricing review
- **Update cadence:** Quarterly (with weekly pricing and changelog monitoring)
- **Audience:** Product team and executive team

### Competitor Map

| Competitor | Type | Overlap | Threat Level | Priority |
|-----------|------|---------|-------------- |----------|
| Asana | Direct | Same target size; they have more enterprise features | High | Track weekly |
| Monday.com | Direct | Same target size; stronger in non-PM use cases (CRM, HR) | High | Track weekly |
| ClickUp | Direct | Aggressive feature parity strategy; competing on "all-in-one" | High | Track weekly |
| Notion | Indirect | Docs-first, adding PM features; appeals to same audience | Medium | Track monthly |
| Linear | Emerging | Engineering-focused but expanding to general PM | Medium | Track quarterly |

### Feature Comparison (Verified February 2026)

| Feature | TeamFlow | Asana | Monday.com | ClickUp |
|---------|----------|-------|-----------|---------|
| Task management | Full | Full | Full | Full |
| Timeline/Gantt | Full | Full | Full | Full |
| Kanban boards | Full | Full | Full | Full |
| Time tracking | Partial (basic) | Not available (integration only) | Full (built-in) | Full (built-in) |
| Resource management | Not available | Full (Business tier) | Partial | Full |
| Custom fields | Full | Full | Full | Full |
| Automations | Partial (5 templates) | Full (50+ templates) | Full (100+ templates) | Full (50+ templates) |
| Native docs | Not available | Planned Q2 | Full | Full |
| API access | Full (all plans) | Full (paid plans) | Full (paid plans) | Full (paid plans) |
| Guest access | Full (free) | Partial (limited) | Full (paid) | Full (paid) |

### Pricing Comparison (Verified February 2026)

| Plan | TeamFlow | Asana | Monday.com | ClickUp |
|------|----------|-------|-----------|---------|
| Free tier | Up to 5 users, all features | Up to 10 users, limited features | Up to 2 seats, limited views | Free forever, 100MB storage |
| Entry | $8/user/mo (Teams) | $11/user/mo (Starter) | $9/seat/mo (Basic) | $7/user/mo (Unlimited) |
| Mid-tier | $15/user/mo (Business) | $25/user/mo (Advanced) | $12/seat/mo (Standard) | $12/user/mo (Business) |
| Enterprise | Custom pricing | Custom pricing | Custom pricing | Custom pricing |
| Annual discount | 20% | 25% | 18% | 30% |

**Pricing insight:** TeamFlow's mid-tier ($15/user) is significantly below Asana's Advanced ($25/user) but above ClickUp's Business ($12/user). ClickUp competes aggressively on price. Monday.com is price-competitive at entry level but escalates quickly for advanced features.

### Competitive Battlecard: ClickUp

**Overview:** ClickUp positions as the "everything app for work" -- combining project management, docs, whiteboards, and goals in one platform. They compete on feature breadth and aggressive pricing.

**Their strengths:**
- Broadest feature set among competitors (PM, docs, whiteboards, time tracking, goals all built-in)
- Aggressive pricing: lowest entry price ($7/user/mo) with generous free tier
- Rapid feature shipping cadence (weekly changelogs with new features)
- 30% annual discount is the highest in the market

**Their weaknesses:**
- Feature breadth comes at the cost of UX complexity -- common complaint on G2: "too many features, hard to set up"
- Performance issues reported in reviews: slow load times for large workspaces
- Customer support rated below average on Capterra (3.8/5 vs industry average 4.1/5)
- Frequent UI changes frustrate existing users (changelog velocity is a weakness as well as a strength)

**When we win against them:**
- Customer values simplicity and fast onboarding -- TeamFlow's setup time is under 30 minutes vs. ClickUp's 2-4 hours
- Team is non-technical and finds ClickUp's interface overwhelming
- Customer needs reliable performance over feature breadth

**When we lose to them:**
- Customer wants an all-in-one platform (PM + docs + time tracking) to reduce tool count
- Price is the primary decision factor -- ClickUp undercuts us by $1/user/mo at entry tier
- Customer needs advanced automation templates (we have 5, they have 50+)

**Objection handling:**
- "ClickUp has more features" -> "ClickUp has more features, and that is also their biggest complaint on G2. TeamFlow gives you the features your team will actually use, without the 2-hour setup and ongoing complexity tax."
- "ClickUp is cheaper" -> "At $1/user/month difference on entry tier, the real cost difference is setup time and learning curve. Teams using TeamFlow report being productive on day one."

### Collection Schedule

| Task | Frequency | Owner | Time Required | Output |
|------|-----------|-------|---------------|--------|
| Pricing page check (all 4) | Weekly | Product Analyst | 20 min | Price change log |
| Changelog review (all 4) | Weekly | Product Manager | 45 min | Feature launch tracker |
| G2/Capterra review scan | Monthly | Product Analyst | 1.5 hours | Review sentiment summary |
| Win/loss interview analysis | Quarterly | Sales Lead | 3 hours | Win/loss competitive report |
| Full matrix update | Quarterly | Product Manager | 6 hours | Updated framework document |
