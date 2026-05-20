---
name: market-researcher
description: |
  Comprehensive market research including TAM/SAM/SOM analysis, primary and secondary research methods, customer persona creation, Jobs-to-be-Done framework, competitive intelligence, and research report generation. Use when the user asks about market researcher or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research analysis strategy planning"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Market Researcher

## When to Use

**Use this skill when:**
- The user needs TAM/SAM/SOM market sizing or wants to conduct primary and secondary market research
- The user wants to create customer personas, apply the Jobs-to-be-Done framework, or validate market demand
- The user needs a structured market research report with methodology, findings, and recommendations
- The user wants competitive intelligence gathering as part of a broader market analysis

**Do NOT use this skill when:**
- The user needs deep competitive analysis with battle cards and positioning maps (use competitive-analyst instead)
- The user wants strategic frameworks like SWOT or Porter's Five Forces (use swot-analyzer instead)
- The user is building a full business plan (use business-planner instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to market researcher.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on market researcher
- User asks about market researcher best practices or techniques
- User wants a structured approach to market researcher

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of market researcher
## Questions to Ask the User First

1. **What is the core research question you want to answer?**
2. **What product/service/idea are you researching the market for?**
3. **Who do you believe your target customer is?** (Initial hypothesis)
4. **What industry or sector is this in?**
5. **What geography are you focused on?** (Local, national, global)
6. **What is your budget for research?** ($0 / Under $500 / $500-5K / $5K+)
7. **What is your timeline?** (Days, weeks, months)
8. **Do you have any existing data?** (Surveys, sales data, analytics)
9. **What decisions will this research inform?** (Go/no-go, pricing, positioning, features)
10. **Is this a new market entry or expansion of an existing business?**
---
## Step 1: Define Research Objectives

### Research Brief Template
```
MARKET RESEARCH BRIEF
Project Name: {{project_name}}
Date: {{date}}
Stakeholders: {{who_needs_this}}
PRIMARY RESEARCH QUESTION:
{{The single most important question this research must answer}}
SECONDARY QUESTIONS:
1. {{question_1}}
2. {{question_2}}
3. {{question_3}}
4. {{question_4}}
HYPOTHESES TO TEST:
H1: {{hypothesis_1}}
H2: {{hypothesis_2}}
H3: {{hypothesis_3}}
DECISIONS THIS RESEARCH WILL INFORM:
- {{decision_1}}
- {{decision_2}}
- {{decision_3}}
SCOPE:
  Geography: {{regions}}
  Time period: {{historical_range}} to present
  Industries: {{sic_codes_or_descriptions}}
  Customer segments: {{segment_definitions}}
DELIVERABLES:
- [ ] Market sizing report
- [ ] Customer persona documents
- [ ] Competitive landscape analysis
- [ ] Trend analysis report
- [ ] Final recommendations presentation
TIMELINE: {{start_date}} to {{end_date}}
BUDGET: ${{total_budget}}
```
---
## Step 2: Market Sizing (TAM/SAM/SOM)

### Method A: Top-Down Approach
```
TOP-DOWN MARKET SIZING

Start with published industry data and narrow down.

TOTAL ADDRESSABLE MARKET (TAM):
  Source: {{industry_report_or_database}}
  Global market for {{category}}: ${{global_value}}
  Growth rate (CAGR): {{cagr}}%
  Projected size in {{target_year}}: ${{projected_value}}

SERVICEABLE ADDRESSABLE MARKET (SAM):
  Apply geographic filter: {{geography}} = {{pct_of_tam}}% of TAM
  Apply segment filter: {{target_segment}} = {{pct_of_geo}}% of geographic
  Apply product filter: {{product_category}} = {{pct_of_segment}}%
  SAM = ${{sam_value}}

SERVICEABLE OBTAINABLE MARKET (SOM):
  Realistic penetration rate: {{penetration_pct}}%
  Based on: {{comparable_company_benchmarks}}
  SOM = ${{som_value}}
```

### Method B: Bottom-Up Approach (More Credible)
```
BOTTOM-UP MARKET SIZING
Build from individual customer economics upward.
STEP 1: Define your customer
  Target customer profile: {{profile}}
  Total number of potential customers: {{count}}
  Source for customer count: {{source}}
STEP 2: Estimate spending
  Average annual spend on this problem: ${{annual_spend}}
  Willingness to pay for your solution: ${{wtp}}
  Purchase frequency: {{frequency}}
STEP 3: Calculate
  Total potential customers: {{count}}
  x Average revenue per customer: ${{arpu}}
  = BOTTOM-UP TAM: ${{tam}}
STEP 4: Apply realistic constraints
  Addressable customers (SAM): {{addressable_count}}
  x ARPU: ${{arpu}}
  = SAM: ${{sam}}
  Obtainable in 3 years (SOM): {{obtainable_count}}
  x ARPU: ${{arpu}}
  = SOM: ${{som}}
```

### Method C: Value-Theory Approach
```
VALUE-THEORY MARKET SIZING

Calculate based on value created.

Current cost of the problem: ${{current_cost}} per {{unit}}
Number of {{units}} affected: {{count}}
Total value of the problem: ${{total_problem_value}}

Your solution captures {{capture_rate}}% of value created
Market size = ${{total_problem_value}} x {{capture_rate}}%
= ${{market_size}}
```

### Market Sizing Credibility Checklist

- [ ] Used at least two methods and compared results
- [ ] All sources are cited and verifiable
- [ ] Assumptions are clearly stated and reasonable
- [ ] Bottom-up math is internally consistent
- [ ] Growth rates are based on historical data or analogies
- [ ] TAM is not so large it seems unrealistic
- [ ] SOM is achievable given your current resources
---
## Step 3: Primary Research

### 3A: Customer Interviews
```
INTERVIEW GUIDE
Target: {{number}} interviews with {{customer_segment}}
Duration: 30-45 minutes each
Recording: {{yes/no}} (get consent)
SCREENING QUESTIONS:
1. Do you currently {{behavior_related_to_problem}}?
2. How often do you {{frequency_check}}?
3. What is your role in {{decision_making}}?
WARM-UP (2 minutes):
- Tell me about your role at {{company_type}}.
- Walk me through a typical day/week.
PROBLEM EXPLORATION (15 minutes):
- Tell me about the last time you {{experienced_the_problem}}.
- What did you do? Walk me through the steps.
- What was frustrating about that process?
- How often does this come up?
- What have you tried to solve this? What worked and what did not?
- How much time/money do you spend on this currently?
SOLUTION REACTION (10 minutes):
- If I told you there was a way to {{solution_benefit}}, how would you react?
- What would that need to look like for you to consider it?
- What would make you NOT want to use something like that?
- How much would you expect to pay for something like this?
COMPETITIVE LANDSCAPE (5 minutes):
- What tools/services do you currently use for this?
- What do you like about them? What do you dislike?
- If you could change one thing about your current solution, what would it be?
WRAP-UP (3 minutes):
- Is there anything else about this topic I should have asked?
- Who else should I talk to about this?
- Would you be open to a follow-up conversation?
```

### 3B: Survey Design
```
SURVEY STRUCTURE
Title: {{survey_title}}
Target responses: {{target_n}} (minimum for statistical significance)
Distribution: {{channels}}
Incentive: {{incentive_if_any}}
Estimated completion time: {{minutes}} minutes
SECTION 1: SCREENER (2-3 questions)
  Q1: {{demographic_or_behavior_screener}}
  Q2: {{qualifying_question}}
SECTION 2: CURRENT BEHAVIOR (3-5 questions)
  Q3: How often do you {{behavior}}?
      [ ] Daily [ ] Weekly [ ] Monthly [ ] Rarely [ ] Never
  Q4: Which tools do you currently use for {{task}}?
      [ ] {{option_a}} [ ] {{option_b}} [ ] {{option_c}} [ ] Other
  Q5: How satisfied are you with your current solution?
SECTION 3: PROBLEM VALIDATION (3-5 questions)
  Q6: How significant is {{problem}} for you?
  Q7: Rank these pain points from most to least painful:
      {{pain_1}}, {{pain_2}}, {{pain_3}}, {{pain_4}}
  Q8: What is the biggest challenge you face with {{topic}}?
      [Open text]
SECTION 4: SOLUTION INTEREST (3-4 questions)
  Q9: How interested would you be in a solution that {{value_prop}}?
  Q10: Which features would be most valuable?
      [Checkbox: {{feature_1}}, {{feature_2}}, {{feature_3}}]
  Q11: What would you expect to pay for this?
      [ ] ${{range_1}} [ ] ${{range_2}} [ ] ${{range_3}} [ ] ${{range_4}}
SECTION 5: DEMOGRAPHICS (2-3 questions)
  Q12: {{company_size / role / industry}}
  Q13: {{age / location / other relevant demographic}}
```

### 3C: Focus Groups
```
FOCUS GROUP PLAN

Number of groups: {{count}} (3-4 recommended minimum)
Participants per group: 6-8
Duration: 60-90 minutes
Moderator: {{name}}
Location: {{in_person_or_virtual}}

AGENDA:
  0:00 - Welcome and ground rules (5 min)
  0:05 - Introductions and warm-up (10 min)
  0:15 - Topic 1: Current experience with {{problem}} (20 min)
  0:35 - Topic 2: Reaction to {{concept/prototype}} (20 min)
  0:55 - Topic 3: Pricing and willingness to pay (10 min)
  1:05 - Open discussion and final thoughts (10 min)
  1:15 - Thank you and next steps (5 min)

GROUND RULES:
- No wrong answers
- One person speaks at a time
- We want to hear from everyone
- Disagree respectfully
- This is being recorded for research purposes only
```
---
## Step 4: Secondary Research Sources

### Free Sources

| Source | What It Provides | URL |
|--------|-----------------|-----|
| US Census Bureau | Demographic & economic data | census.gov |
| BLS (Bureau of Labor Statistics) | Employment & industry data | bls.gov |
| SEC EDGAR | Public company filings | sec.gov/edgar |
| Google Trends | Search interest over time | trends.google.com |
| Statista (free tier) | Statistics and market data | statista.com |
| Crunchbase (free tier) | Startup funding data | crunchbase.com |
| SimilarWeb (free tier) | Website traffic estimates | similarweb.com |
| Social Blade | Social media analytics | socialblade.com |
| Reddit / Forums | Unfiltered customer sentiment | reddit.com |
| G2 / Capterra Reviews | Software competitor reviews | g2.com / capterra.com |
| Job Postings | Hiring signals from competitors | linkedin.com/jobs |
| Patent Search | IP landscape | patents.google.com |
| Industry Associations | Market reports and data | (varies by industry) |

### Paid Sources

| Source | What It Provides | Typical Cost |
|--------|-----------------|-------------|
| IBISWorld | Industry reports | $1K-5K/report |
| Gartner | Technology research | $30K+/year |
| CB Insights | Market intelligence | $10K+/year |
| Pitchbook | VC & deal data | $20K+/year |
| Nielsen | Consumer data | Custom pricing |
| SurveyMonkey Audience | Survey panel access | $1-5/response |
---
## Step 5: Customer Persona Creation

### Jobs-to-be-Done (JTBD) Framework
```
JTBD ANALYSIS
CORE FUNCTIONAL JOB:
When I {{situation}}, I want to {{motivation}}, so I can {{desired_outcome}}.
RELATED JOBS:
1. {{related_job_1}}
2. {{related_job_2}}
3. {{related_job_3}}
EMOTIONAL JOBS:
- I want to feel {{emotion_1}} when I {{context}}
- I want to avoid feeling {{emotion_2}} when I {{context}}
SOCIAL JOBS:
- I want to be perceived as {{perception}} by {{audience}}
- I want to avoid being seen as {{negative_perception}}
JOB MAP (steps the customer takes):
1. DEFINE: {{how_they_define_what_needs_to_be_done}}
2. LOCATE: {{how_they_find_inputs_needed}}
3. PREPARE: {{how_they_set_up_to_do_the_job}}
4. CONFIRM: {{how_they_verify_readiness}}
5. EXECUTE: {{how_they_do_the_core_job}}
6. MONITOR: {{how_they_track_progress}}
7. MODIFY: {{how_they_adjust_during_execution}}
8. CONCLUDE: {{how_they_finish_the_job}}
UNDERSERVED OUTCOMES (where current solutions fail):
1. {{outcome_1}}: Importance {{1-5}} / Satisfaction {{1-5}}
2. {{outcome_2}}: Importance {{1-5}} / Satisfaction {{1-5}}
3. {{outcome_3}}: Importance {{1-5}} / Satisfaction {{1-5}}
Opportunity score = Importance + (Importance - Satisfaction)
Highest opportunity: {{outcome_with_highest_score}}
```

### Detailed Persona Template
```
PERSONA: {{persona_name}}
IDENTITY:
  Name: {{fictional_name}}
  Age: {{age}}
  Role: {{job_title}} at {{company_type}}
  Location: {{city/region}}
  Income: ${{range}}
  Education: {{level}}
  Family: {{status}}
A DAY IN THEIR LIFE:
  {{2-3 sentences describing a typical day, highlighting the moments
GOALS:
  Professional:
    1. {{goal_1}}
    2. {{goal_2}}
  Personal:
    1. {{goal_3}}
    2. {{goal_4}}
PAIN POINTS:
  1. {{pain_1}} -- Severity: {{high/medium/low}}
  2. {{pain_2}} -- Severity: {{high/medium/low}}
  3. {{pain_3}} -- Severity: {{high/medium/low}}
INFORMATION SOURCES:
  Reads: {{publications}}
  Follows: {{influencers/thought_leaders}}
  Events: {{conferences/meetups}}
  Social: {{preferred_platforms}}
BUYING BEHAVIOR:
  Decision style: {{analytical / emotional / consensus-driven}}
  Research process: {{how_they_evaluate_options}}
  Budget authority: {{yes / needs_approval / influencer_only}}
  Key objections: {{common_reasons_they_say_no}}
  Purchase triggers: {{what_finally_makes_them_buy}}
QUOTE:
"{{A real or realistic quote this persona would say about the problem}}"
```
---
## Step 6: Trend Analysis

### Trend Identification Framework
```
TREND ANALYSIS: {{industry/market}}
MACRO TRENDS (5-10 year horizon):
1. {{trend_1}}
   - Evidence: {{data_points}}
   - Impact on market: {{high/medium/low}}
   - Implication for us: {{what_to_do}}
2. {{trend_2}}
   - Evidence: {{data_points}}
   - Impact on market: {{high/medium/low}}
   - Implication for us: {{what_to_do}}

MICRO TRENDS (1-3 year horizon):
1. {{trend_3}}
   - Evidence: {{data_points}}
   - Impact on market: {{high/medium/low}}
   - Implication for us: {{what_to_do}}

SIGNALS TO WATCH:
- {{signal_1}}: Monitor via {{source}}
- {{signal_2}}: Monitor via {{source}}
- {{signal_3}}: Monitor via {{source}}

WILDCARDS (low probability, high impact):
- {{wildcard_1}}: If this happens, {{impact}}
- {{wildcard_2}}: If this happens, {{impact}}
```

### PESTLE Analysis
```
PESTLE ANALYSIS: {{market/industry}}
POLITICAL:
- {{factor_1}}: Impact {{+/-}} | Likelihood {{H/M/L}}
- {{factor_2}}: Impact {{+/-}} | Likelihood {{H/M/L}}
ECONOMIC:
- {{factor_3}}: Impact {{+/-}} | Likelihood {{H/M/L}}
- {{factor_4}}: Impact {{+/-}} | Likelihood {{H/M/L}}
SOCIAL:
- {{factor_5}}: Impact {{+/-}} | Likelihood {{H/M/L}}
- {{factor_6}}: Impact {{+/-}} | Likelihood {{H/M/L}}
TECHNOLOGICAL:
- {{factor_7}}: Impact {{+/-}} | Likelihood {{H/M/L}}
- {{factor_8}}: Impact {{+/-}} | Likelihood {{H/M/L}}
LEGAL:
- {{factor_9}}: Impact {{+/-}} | Likelihood {{H/M/L}}
- {{factor_10}}: Impact {{+/-}} | Likelihood {{H/M/L}}
ENVIRONMENTAL:
- {{factor_11}}: Impact {{+/-}} | Likelihood {{H/M/L}}
- {{factor_12}}: Impact {{+/-}} | Likelihood {{H/M/L}}
TOP 3 FACTORS BY IMPACT:
1. {{most_impactful}}
2. {{second_most}}
3. {{third_most}}
```
---
## Step 7: Competitive Intelligence

### Competitive Intelligence Gathering Checklist
```
For each competitor, gather:
BASIC INFO:
- [ ] Company name, founding date, HQ location
- [ ] Funding raised and investors
- [ ] Estimated revenue and employee count
- [ ] Key leadership team
PRODUCT:
- [ ] Core product/service offerings
- [ ] Pricing model and price points
- [ ] Key features and capabilities
- [ ] Technology stack (if visible via BuiltWith, StackShare)
- [ ] Product roadmap signals (blog, changelog, job postings)
MARKET:
- [ ] Target customer segments
- [ ] Positioning and messaging
- [ ] Geographic presence
- [ ] Market share estimates
MARKETING:
- [ ] Website traffic (SimilarWeb)
- [ ] SEO keywords (Ahrefs/SEMrush free tools)
- [ ] Content strategy (blog topics, frequency)
- [ ] Social media presence and engagement
- [ ] Advertising (Facebook Ad Library, Google Ads Transparency)
CUSTOMER:
- [ ] Customer reviews (G2, Capterra, Trustpilot)
- [ ] Case studies on their website
- [ ] NPS or satisfaction data (if available)
- [ ] Common complaints and praise themes
STRATEGIC:
- [ ] Recent partnerships or acquisitions
- [ ] Hiring patterns (what roles are they filling?)
- [ ] Patent filings
- [ ] Regulatory filings or compliance certifications
```
---
## Step 8: Research Report Template
```
MARKET RESEARCH REPORT
Title: {{report_title}}
Date: {{date}}
Prepared by: {{researcher}}
Prepared for: {{stakeholders}}
EXECUTIVE SUMMARY (1 page)
  - Research objective: {{objective}}
  - Key finding 1: {{finding}}
  - Key finding 2: {{finding}}
  - Key finding 3: {{finding}}
  - Primary recommendation: {{recommendation}}
1. RESEARCH METHODOLOGY
  1.1 Research objectives
  1.2 Methods used (primary, secondary)
  1.3 Sample description
  1.4 Limitations and caveats
2. MARKET OVERVIEW
  2.1 Market definition
  2.2 Market size (TAM/SAM/SOM)
  2.3 Market growth and trends
  2.4 PESTLE factors
3. CUSTOMER ANALYSIS
  3.1 Customer segments identified
  3.2 Customer personas
  3.3 Jobs-to-be-Done analysis
  3.4 Unmet needs and opportunities
4. COMPETITIVE LANDSCAPE
  4.1 Competitor profiles
  4.2 Competitive positioning map
  4.3 Feature/capability comparison
  4.4 Pricing comparison
  4.5 Market share estimates
5. KEY FINDINGS
  5.1 Finding 1: {{title}} -- {{detail}}
  5.2 Finding 2: {{title}} -- {{detail}}
  5.3 Finding 3: {{title}} -- {{detail}}
  5.4 Finding 4: {{title}} -- {{detail}}
  5.5 Finding 5: {{title}} -- {{detail}}
6. RECOMMENDATIONS
  6.1 Strategic recommendation 1
  6.2 Strategic recommendation 2
  6.3 Strategic recommendation 3
  6.4 Next steps and further research needed
APPENDICES
  A. Raw survey data
  B. Interview transcripts (anonymized)
  C. Detailed competitor profiles
  D. Data sources and bibliography
```
---
## Research Quality Checklist

- [ ] Research questions are clearly defined before data collection
- [ ] Multiple sources were used to triangulate findings
- [ ] Sample size is sufficient for the conclusions drawn
- [ ] Primary research followed ethical guidelines (consent, anonymity)
- [ ] Bias in research design has been identified and mitigated
- [ ] All data sources are cited
- [ ] Findings are actionable, not just informational
- [ ] Limitations are honestly disclosed
- [ ] Report distinguishes between facts and interpretations
- [ ] Recommendations are directly supported by the research data


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Market Researcher deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with market researcher for a mid-size project."

**Output:** A complete market researcher framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
