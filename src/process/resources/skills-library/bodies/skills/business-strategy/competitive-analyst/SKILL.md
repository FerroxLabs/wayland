---
name: competitive-analyst
description: |
  Comprehensive competitive analysis including competitor identification, feature comparison matrices, pricing analysis, positioning maps, win/loss analysis, competitive intelligence gathering, differentiation strategy, and battle card creation. Use when the user asks about competitive analyst or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy analysis research"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Competitive Analyst

## When to Use

**Use this skill when:**
- The user needs to conduct a competitive analysis with feature comparison matrices and positioning maps
- The user wants help with win/loss analysis, competitive intelligence gathering, or battle card creation
- The user needs a differentiation strategy based on systematic competitor evaluation
- The user wants to map competitors by pricing, features, market positioning, or target segments

**Do NOT use this skill when:**
- The user needs broader strategic analysis beyond competitors (use swot-analyzer instead)
- The user wants market sizing or customer research rather than competitor focus (use market-researcher instead)
- The user needs a full business plan that includes competitive analysis as one section (use business-planner instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to competitive analyst.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on competitive analyst
- User asks about competitive analyst best practices or techniques
- User wants a structured approach to competitive analyst

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of competitive analyst

A systematic competitive analysis skill that guides users through identifying competitors, gathering intelligence, comparing capabilities, analyzing positioning, and developing competitive response strategies. Produces actionable outputs including positioning maps, battle cards, and competitive response playbooks.

---

## Questions to Ask the User First

1. **What is your product/service?**
2. **Who do you consider your top competitors?** (Name them)
3. **What industry/category are you in?**
4. **Who is your target customer?**
5. **What is your primary differentiator today?**
6. **Are you losing deals to specific competitors?** (Which ones?)
7. **What is the purpose of this analysis?** (Sales enablement, strategic planning, investor deck, product roadmap)
8. **Do you have win/loss data available?** (CRM data, deal notes)
9. **What is your budget for competitive intelligence tools?**
10. **How often do you update competitive analysis?** (Ad-hoc, quarterly, ongoing)

---

## Step 1: Competitor Identification

### Competitor Taxonomy

```
COMPETITOR UNIVERSE MAP

DIRECT COMPETITORS (same product, same market):
  1. {{competitor}} -- Why direct: {{reason}}
  2. {{competitor}} -- Why direct: {{reason}}
  3. {{competitor}} -- Why direct: {{reason}}

INDIRECT COMPETITORS (different product, same problem):
  1. {{competitor}} -- How they solve it differently: {{approach}}
  2. {{competitor}} -- How they solve it differently: {{approach}}
  3. {{competitor}} -- How they solve it differently: {{approach}}

POTENTIAL COMPETITORS (could enter your market):
  1. {{company}} -- Why they might enter: {{reason}}
  2. {{company}} -- Why they might enter: {{reason}}

SUBSTITUTE SOLUTIONS (non-product alternatives):
  1. {{alternative}} -- e.g., manual process, spreadsheets, hiring
  2. {{alternative}} -- e.g., doing nothing, internal build

STATUS QUO (biggest competitor for many startups):
  What does the customer do if they buy NOTHING?
  {{description_of_status_quo}}
```

### Competitor Discovery Methods

```
COMPETITOR IDENTIFICATION CHECKLIST

SEARCH METHODS:
- [ ] Google: "{{your_category}} software/tool/service"
- [ ] Google: "alternatives to {{your_product}}"
- [ ] G2/Capterra category pages
- [ ] Product Hunt search
- [ ] Crunchbase industry search
- [ ] Reddit: "r/{{industry}} what do you use for {{problem}}"
- [ ] LinkedIn: companies with similar descriptions
- [ ] App Store/Play Store category search
- [ ] Conference sponsor/exhibitor lists
- [ ] Industry analyst reports (Gartner, Forrester)
- [ ] Ask your customers: "What else did you evaluate?"
- [ ] Ask your sales team: "Who do we lose deals to?"
- [ ] Patent/trademark searches
- [ ] Job postings with competitor product names as skills
```

---

## Step 2: Competitor Profiling

### Detailed Competitor Profile Template

Create one profile for each direct and significant indirect competitor.

```
COMPETITOR PROFILE: {{competitor_name}}

OVERVIEW:
  Company name: {{name}}
  Founded: {{year}}
  Headquarters: {{location}}
  Employees: {{count}} (source: LinkedIn)
  Funding: ${{total_raised}} ({{latest_round}} in {{date}})
  Investors: {{notable_investors}}
  Estimated revenue: ${{revenue}} (source: {{source}})
  Website: {{url}}

PRODUCT:
  Core product: {{description}}
  Key features:
    1. {{feature_1}}
    2. {{feature_2}}
    3. {{feature_3}}
    4. {{feature_4}}
    5. {{feature_5}}
  Technology stack: {{known_technologies}}
  Integrations: {{key_integrations}}
  Mobile app: {{yes/no}} (iOS/Android)
  API available: {{yes/no}}

PRICING:
  Model: {{pricing_model}}
  Entry price: ${{lowest_price}}/{{period}}
  Mid-tier price: ${{mid_price}}/{{period}}
  Enterprise: ${{enterprise_price}} or custom
  Free tier/trial: {{details}}
  Notable discounts: {{if_known}}

TARGET MARKET:
  Primary segment: {{segment}}
  Company size focus: {{SMB/mid-market/enterprise}}
  Industries: {{verticals}}
  Geography: {{regions}}
  Ideal customer profile: {{description}}

MARKETING & POSITIONING:
  Tagline: "{{their_tagline}}"
  Key messaging themes: {{themes}}
  Primary marketing channels: {{channels}}
  Content strategy: {{blog_frequency_and_topics}}
  SEO rankings: {{key_terms_they_rank_for}}
  Social media presence: {{follower_counts_and_activity}}
  Website traffic: {{monthly_visitors}} (SimilarWeb estimate)

CUSTOMER PERCEPTION:
  G2 rating: {{rating}}/5 ({{review_count}} reviews)
  Capterra rating: {{rating}}/5
  Common praise: {{themes_from_positive_reviews}}
  Common complaints: {{themes_from_negative_reviews}}
  NPS (if available): {{score}}

STRATEGY SIGNALS:
  Recent product launches: {{what_they_shipped_recently}}
  Recent partnerships: {{notable_partnerships}}
  Recent acquisitions: {{acquisitions}}
  Hiring patterns: {{roles_being_hired}}
  Patent filings: {{recent_patents}}
  Conference appearances: {{where_they_present}}

STRENGTHS:
  1. {{strength_1}}
  2. {{strength_2}}
  3. {{strength_3}}

WEAKNESSES:
  1. {{weakness_1}}
  2. {{weakness_2}}
  3. {{weakness_3}}
```

---

## Step 3: Feature Comparison Matrix

```
FEATURE COMPARISON MATRIX

Rating scale: Full (fully supported), Partial (limited), None (not available)

| Feature Category     | Feature              | Us      | Comp A  | Comp B  | Comp C  |
|---------------------|---------------------|---------|---------|---------|---------|
| Core Functions      | {{feature_1}}       | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | {{feature_2}}       | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | {{feature_3}}       | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | {{feature_4}}       | {{}}    | {{}}    | {{}}    | {{}}    |
| Integrations        | {{integration_1}}   | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | {{integration_2}}   | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | {{integration_3}}   | {{}}    | {{}}    | {{}}    | {{}}    |
| Security/Compliance | SOC2                | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | GDPR                | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | SSO/SAML            | {{}}    | {{}}    | {{}}    | {{}}    |
| Support             | Email support       | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | Phone support       | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | Dedicated CSM       | {{}}    | {{}}    | {{}}    | {{}}    |
| Platform            | Mobile app          | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | API access          | {{}}    | {{}}    | {{}}    | {{}}    |
|                     | White-label         | {{}}    | {{}}    | {{}}    | {{}}    |
| Pricing             | Starting price      | ${{}}   | ${{}}   | ${{}}   | ${{}}   |
|                     | Free tier           | {{}}    | {{}}    | {{}}    | {{}}    |

OUR UNIQUE FEATURES (not available from competitors):
1. {{unique_feature_1}}
2. {{unique_feature_2}}

COMPETITOR-ONLY FEATURES (gaps we need to address):
1. {{gap_feature_1}} -- Available in: {{competitor}} -- Priority: {{H/M/L}}
2. {{gap_feature_2}} -- Available in: {{competitor}} -- Priority: {{H/M/L}}

TABLE STAKES FEATURES (everyone has these):
1. {{table_stakes_1}}
2. {{table_stakes_2}}
```

---

## Step 4: Pricing Comparison

```
PRICING COMPARISON ANALYSIS

| Pricing Element          | Us         | Comp A     | Comp B     | Comp C     |
|-------------------------|-----------|-----------|-----------|-----------|
| Pricing model           | {{}}      | {{}}      | {{}}      | {{}}      |
| Entry price             | ${{}}     | ${{}}     | ${{}}     | ${{}}     |
| Most popular plan       | ${{}}     | ${{}}     | ${{}}     | ${{}}     |
| Enterprise price        | ${{}}     | ${{}}     | ${{}}     | ${{}}     |
| Free tier               | {{}}      | {{}}      | {{}}      | {{}}      |
| Free trial length       | {{days}}  | {{days}}  | {{days}}  | {{days}}  |
| Annual discount %       | {{}}%     | {{}}%     | {{}}%     | {{}}%     |
| Price per seat/user     | ${{}}     | ${{}}     | ${{}}     | ${{}}     |
| Setup/onboarding fee    | ${{}}     | ${{}}     | ${{}}     | ${{}}     |

PRICE POSITIONING:
  Cheapest: {{competitor}}
  Most expensive: {{competitor}}
  Our position: {{premium / mid-market / value / lowest cost}}

VALUE-FOR-MONEY ANALYSIS:
  For a {{typical_customer}} needing {{common_requirements}}:
    Us: ${{total_cost}}/year for {{what_they_get}}
    Comp A: ${{total_cost}}/year for {{what_they_get}}
    Comp B: ${{total_cost}}/year for {{what_they_get}}

  Best value: {{who}} -- because {{reason}}
  Our value narrative: {{how_we_justify_our_price}}
```

---

## Step 5: Competitive Positioning Map

```
POSITIONING MAP

STEP 1: Select two dimensions most important to buyers
  Dimension options:
  - Price (low to high)
  - Feature depth (basic to comprehensive)
  - Ease of use (complex to simple)
  - Target market (SMB to enterprise)
  - Innovation (traditional to cutting-edge)
  - Customization (rigid to flexible)
  - Service model (self-serve to high-touch)

  X-axis selected: {{dimension_1}}
  Y-axis selected: {{dimension_2}}

STEP 2: Plot competitors
  {{Your company}}: X={{position}}, Y={{position}}
  {{Competitor A}}: X={{position}}, Y={{position}}
  {{Competitor B}}: X={{position}}, Y={{position}}
  {{Competitor C}}: X={{position}}, Y={{position}}
  {{Competitor D}}: X={{position}}, Y={{position}}

STEP 3: Identify clusters and gaps
  Cluster 1: {{companies}} -- Competing on {{basis}}
  Cluster 2: {{companies}} -- Competing on {{basis}}
  White space: {{undserserved_position}} -- Opportunity: {{description}}

STEP 4: Define your position
  Our positioning: We are the {{adjective}} {{category}} for {{segment}}
  Why this position is defensible: {{reasoning}}
  What we are NOT: {{anti-positioning}}
```

---

## Step 6: Win/Loss Analysis

```
WIN/LOSS ANALYSIS FRAMEWORK

DATA COLLECTION:
  Source 1: CRM deal data (closed-won and closed-lost)
  Source 2: Post-deal interviews with prospects
  Source 3: Sales team debrief notes
  Source 4: Customer survey at onboarding

QUANTITATIVE ANALYSIS:
| Metric                      | This Quarter | Last Quarter | Trend |
|-----------------------------|-------------|-------------|-------|
| Win rate overall            | {{pct}}%    | {{pct}}%    | {{}}  |
| Win rate vs Comp A          | {{pct}}%    | {{pct}}%    | {{}}  |
| Win rate vs Comp B          | {{pct}}%    | {{pct}}%    | {{}}  |
| Win rate vs no decision     | {{pct}}%    | {{pct}}%    | {{}}  |
| Average deal size (won)     | ${{}}       | ${{}}       | {{}}  |
| Average sales cycle (won)   | {{days}}    | {{days}}    | {{}}  |
| Average sales cycle (lost)  | {{days}}    | {{days}}    | {{}}  |

TOP WIN REASONS (from post-deal interviews):
  1. {{reason}} -- Frequency: {{pct}}% of wins
  2. {{reason}} -- Frequency: {{pct}}% of wins
  3. {{reason}} -- Frequency: {{pct}}% of wins

TOP LOSS REASONS (from post-deal interviews):
  1. {{reason}} -- Frequency: {{pct}}% of losses -- Lost to: {{competitor}}
  2. {{reason}} -- Frequency: {{pct}}% of losses -- Lost to: {{competitor}}
  3. {{reason}} -- Frequency: {{pct}}% of losses -- Lost to: {{competitor}}

NO-DECISION REASONS:
  1. {{reason}} -- Frequency: {{pct}}%
  2. {{reason}} -- Frequency: {{pct}}%

ACTIONABLE INSIGHTS:
  - To improve win rate vs {{Comp A}}: {{recommendation}}
  - To reduce no-decisions: {{recommendation}}
  - To increase deal size: {{recommendation}}
  - To shorten sales cycle: {{recommendation}}
```

---

## Step 7: Battle Cards

Create one battle card per major competitor for your sales team.

```
BATTLE CARD: {{Competitor Name}}
Last updated: {{date}}

QUICK OVERVIEW
What they do: {{one_sentence}}
Ideal customer: {{their_target}}
Pricing: {{model}} starting at ${{price}}
Our win rate vs them: {{pct}}%

WHEN YOU ENCOUNTER THEM
They tend to appear in deals when the prospect:
- {{trigger_1}}
- {{trigger_2}}
- {{trigger_3}}

THEIR STRENGTHS (acknowledge these)
1. {{strength_1}} -- How to handle: {{talking_point}}
2. {{strength_2}} -- How to handle: {{talking_point}}
3. {{strength_3}} -- How to handle: {{talking_point}}

THEIR WEAKNESSES (attack here)
1. {{weakness_1}} -- Our advantage: {{our_strength}}
   Ask the prospect: "{{discovery_question}}"

2. {{weakness_2}} -- Our advantage: {{our_strength}}
   Ask the prospect: "{{discovery_question}}"

3. {{weakness_3}} -- Our advantage: {{our_strength}}
   Ask the prospect: "{{discovery_question}}"

LANDMINES TO SET
(Questions to ask early that favor you over this competitor)

1. "How important is {{thing_we_do_better}} to your team?"
2. "Have you considered the impact of {{thing_they_lack}}?"
3. "What is your experience with {{their_known_issue}}?"

OBJECTION HANDLING
Objection: "{{Competitor}} is cheaper."
Response: "{{response_acknowledging_and_reframing}}"

Objection: "{{Competitor}} has {{feature}} and you do not."
Response: "{{response_showing_alternative_approach}}"

Objection: "We already use {{Competitor}}."
Response: "{{response_for_displacement_selling}}"

COMPETITIVE PROOF POINTS
- Customer quote: "{{quote_from_customer_who_switched}}"
- Case study: {{customer_name}} switched from {{competitor}} and saw {{result}}
- Data: {{metric}} is {{pct}}% better than {{competitor}} based on {{source}}

KILLER QUESTIONS
(Questions that expose their weakness)
1. "{{question}}"
2. "{{question}}"
3. "{{question}}"
```

---

## Step 8: Competitive Response Planning

```
COMPETITIVE RESPONSE PLAYBOOK

SCENARIO 1: Competitor launches feature that matches yours
  Response timeline: {{days}} days
  Actions:
  - [ ] Assess actual capability vs. marketing claims
  - [ ] Update battle cards
  - [ ] Prepare talking points for sales team
  - [ ] Consider accelerating roadmap items that extend lead
  - [ ] Communicate to existing customers (if needed)

SCENARIO 2: Competitor drops price significantly
  Response timeline: {{days}} days
  Actions:
  - [ ] Analyze their unit economics (is this sustainable?)
  - [ ] Prepare value-based selling response (do NOT match price)
  - [ ] Create ROI calculator to justify premium
  - [ ] Identify accounts at risk and proactively reach out
  - [ ] Monitor win rates for 30-day impact

SCENARIO 3: New competitor enters market
  Response timeline: {{weeks}} weeks
  Actions:
  - [ ] Complete full competitor profile
  - [ ] Assess their differentiation and target market
  - [ ] Determine if they affect your core segment
  - [ ] Create battle card
  - [ ] Monitor their traction (traffic, hiring, funding)

SCENARIO 4: Competitor gets acquired
  Response timeline: {{weeks}} weeks
  Actions:
  - [ ] Assess impact on their product/pricing/strategy
  - [ ] Identify their customers who may be unsettled
  - [ ] Prepare targeted outreach to their customer base
  - [ ] Update positioning to address new competitive dynamic

MONITORING CADENCE:
  Daily: Google Alerts for competitor names
  Weekly: Review competitor social media and blog
  Monthly: Traffic and hiring trend analysis
  Quarterly: Full battle card update and win/loss review
```

---

## Competitive Intelligence Sources Checklist

```
INTELLIGENCE GATHERING TOOLKIT

FREE TOOLS:
- [ ] Google Alerts (competitor name, product name, key people)
- [ ] SimilarWeb (traffic estimates, traffic sources)
- [ ] BuiltWith (technology stack detection)
- [ ] Facebook Ad Library (active ad creatives)
- [ ] LinkedIn (hiring patterns, employee count trends)
- [ ] Glassdoor (employee sentiment, salary data)
- [ ] G2/Capterra (customer reviews and ratings)
- [ ] Wayback Machine (website history and changes)
- [ ] SEC filings / Crunchbase (funding, financials)
- [ ] Patent search (innovation direction)
- [ ] GitHub (open source activity, technology choices)
- [ ] Twitter/X lists (monitoring competitor accounts)
- [ ] Reddit/community mentions
- [ ] Press releases and news

PAID TOOLS:
- [ ] Crayon (competitive intelligence platform)
- [ ] Klue (competitive enablement)
- [ ] SEMrush/Ahrefs (SEO and content analysis)
- [ ] Owler (competitor tracking and alerts)
- [ ] ZoomInfo (contact and company data)

ETHICAL GUIDELINES:
- Never misrepresent yourself to gather intelligence
- Do not contact competitor employees for proprietary information
- Use only publicly available information
- Do not reverse-engineer protected software
- Follow all applicable laws and terms of service
```

---

## Analysis Quality Checklist

- [ ] All direct competitors are identified and profiled
- [ ] Feature comparison is current (within last 30 days)
- [ ] Pricing data is verified (not estimated)
- [ ] Positioning map uses dimensions that matter to buyers
- [ ] Win/loss analysis is based on actual deal data, not assumptions
- [ ] Battle cards are concise and usable by sales team
- [ ] Competitive response plans exist for likely scenarios
- [ ] Intelligence sources are set up for ongoing monitoring
- [ ] Analysis distinguishes facts from assumptions
- [ ] Update schedule is established and assigned


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Competitive Analyst deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with competitive analyst for a mid-size project."

**Output:** A complete competitive analyst framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
