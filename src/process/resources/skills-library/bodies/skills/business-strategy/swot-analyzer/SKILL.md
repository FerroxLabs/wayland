---
name: swot-analyzer
description: |
  Deep strategic analysis using SWOT framework, PESTLE analysis, Porter's Five Forces, competitive positioning matrix, and TOWS matrix for converting analysis into actionable strategy. Use when the user asks about swot analyzer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy analysis frameworks decision-making"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Swot Analyzer

## When to Use

**Use this skill when:**
- The user wants a deep strategic analysis using SWOT, PESTLE, Porter's Five Forces, or TOWS matrix
- The user needs to convert strategic analysis into actionable strategy with a competitive positioning matrix
- The user wants to assess internal strengths and weaknesses alongside external opportunities and threats
- The user needs a structured strategic framework for a business decision, market entry, or organizational change

**Do NOT use this skill when:**
- The user needs detailed competitor-by-competitor analysis (use competitive-analyst instead)
- The user wants market sizing or customer research (use market-researcher instead)
- The user needs a full business plan rather than strategic analysis (use business-planner instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to swot analyzer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on swot analyzer
- User asks about swot analyzer best practices or techniques
- User wants a structured approach to swot analyzer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of swot analyzer

A rigorous strategic analysis skill that goes beyond basic SWOT to deliver actionable strategic insights. Integrates SWOT with PESTLE analysis, Porter's Five Forces, the TOWS strategy matrix, and competitive positioning to produce comprehensive strategic recommendations.

---

## Questions to Ask the User First

1. **What is the entity being analyzed?** (Company, product, project, personal career)
2. **What is the purpose of this analysis?** (Strategic planning, investment decision, competitive response, new market entry, pivot evaluation)
3. **What industry/market are you in?**
4. **Who are your top 3-5 competitors?**
5. **What is your current market position?** (Leader, challenger, follower, niche)
6. **What is the scope of analysis?** (Entire company, specific business unit, specific product)
7. **What time horizon are you planning for?** (6 months, 1 year, 3 years, 5 years)
8. **What strategic decisions will this analysis inform?**
9. **Do you have access to internal data?** (Financials, customer data, employee feedback)
10. **What recent changes in your industry concern you most?**

---

## Step 1: Internal Assessment (Strengths & Weaknesses)

### Strengths Identification Framework

Evaluate each internal area and identify strengths where you have a clear advantage.
```
STRENGTHS ASSESSMENT

CATEGORY: RESOURCES & ASSETS
- Financial position (cash, revenue, profitability): {{assessment}}
- Physical assets (facilities, equipment, inventory): {{assessment}}
- Intellectual property (patents, trademarks, proprietary tech): {{assessment}}
- Brand equity and reputation: {{assessment}}

CATEGORY: CAPABILITIES & COMPETENCIES
- Core technical competencies: {{assessment}}
- Management and leadership quality: {{assessment}}
- Innovation and R&D capacity: {{assessment}}
- Operational efficiency: {{assessment}}
- Customer relationships and loyalty: {{assessment}}

CATEGORY: MARKET POSITION
- Market share: {{assessment}}
- Distribution channels: {{assessment}}
- Pricing power: {{assessment}}
- Product/service quality: {{assessment}}
- Customer satisfaction (NPS, reviews): {{assessment}}

CATEGORY: PEOPLE & CULTURE
- Talent quality and retention: {{assessment}}
- Company culture: {{assessment}}
- Institutional knowledge: {{assessment}}
- Adaptability and agility: {{assessment}}

TOP 5 STRENGTHS (ranked by strategic importance):
S1: {{strength}} -- Evidence: {{data_or_proof}}
S2: {{strength}} -- Evidence: {{data_or_proof}}
S3: {{strength}} -- Evidence: {{data_or_proof}}
S4: {{strength}} -- Evidence: {{data_or_proof}}
S5: {{strength}} -- Evidence: {{data_or_proof}}
```

### Weaknesses Identification Framework

Be honest and specific. Vague weaknesses lead to vague strategies.
```
WEAKNESSES ASSESSMENT

CATEGORY: RESOURCES & ASSETS
- Financial constraints: {{assessment}}
- Technology gaps: {{assessment}}
- Infrastructure limitations: {{assessment}}
- IP or data vulnerabilities: {{assessment}}

CATEGORY: CAPABILITIES & COMPETENCIES
- Skills gaps in the team: {{assessment}}
- Process inefficiencies: {{assessment}}
- Quality control issues: {{assessment}}
- Speed to market: {{assessment}}
- Customer support capacity: {{assessment}}

CATEGORY: MARKET POSITION
- Brand awareness gaps: {{assessment}}
- Distribution weaknesses: {{assessment}}
- Product/service gaps vs. competitors: {{assessment}}
- Customer concentration risk: {{assessment}}
- Geographic limitations: {{assessment}}

CATEGORY: PEOPLE & CULTURE
- Key person dependencies: {{assessment}}
- Hiring challenges: {{assessment}}
- Cultural issues (silos, communication): {{assessment}}
- Change resistance: {{assessment}}

TOP 5 WEAKNESSES (ranked by strategic risk):
W1: {{weakness}} -- Impact: {{potential_consequence}}
W2: {{weakness}} -- Impact: {{potential_consequence}}
W3: {{weakness}} -- Impact: {{potential_consequence}}
W4: {{weakness}} -- Impact: {{potential_consequence}}
W5: {{weakness}} -- Impact: {{potential_consequence}}
```

---

## Step 2: External Assessment (Opportunities & Threats)

### Opportunities Identification
```
OPPORTUNITIES ASSESSMENT

MARKET OPPORTUNITIES:
- Underserved customer segments: {{assessment}}
- Geographic expansion potential: {{assessment}}
- Adjacent market entry: {{assessment}}
- Market growth trends: {{assessment}}

TECHNOLOGY OPPORTUNITIES:
- Emerging technologies applicable: {{assessment}}
- Automation or efficiency gains: {{assessment}}
- Platform or ecosystem opportunities: {{assessment}}
- Data/AI leverage points: {{assessment}}

COMPETITIVE OPPORTUNITIES:
- Competitor weaknesses to exploit: {{assessment}}
- Market gaps not addressed by anyone: {{assessment}}
- Partnership or acquisition targets: {{assessment}}
- Disintermediation possibilities: {{assessment}}

REGULATORY/ECONOMIC OPPORTUNITIES:
- Favorable policy changes: {{assessment}}
- Economic trends benefiting you: {{assessment}}
- Industry deregulation: {{assessment}}
- Government incentives or grants: {{assessment}}

TOP 5 OPPORTUNITIES (ranked by potential impact):
O1: {{opportunity}} -- Potential value: {{estimate}}
O2: {{opportunity}} -- Potential value: {{estimate}}
O3: {{opportunity}} -- Potential value: {{estimate}}
O4: {{opportunity}} -- Potential value: {{estimate}}
O5: {{opportunity}} -- Potential value: {{estimate}}
```

### Threats Identification
```
THREATS ASSESSMENT

COMPETITIVE THREATS:
- New entrants: {{assessment}}
- Existing competitors gaining ground: {{assessment}}
- Substitute products/services: {{assessment}}
- Price wars: {{assessment}}
- Competitor acquisitions: {{assessment}}

MARKET THREATS:
- Market saturation: {{assessment}}
- Changing customer preferences: {{assessment}}
- Demand decline for current offerings: {{assessment}}
- Channel disruption: {{assessment}}

TECHNOLOGY THREATS:
- Technological obsolescence: {{assessment}}
- Cybersecurity risks: {{assessment}}
- Platform dependency risks: {{assessment}}
- Disruptive innovation in the space: {{assessment}}

MACRO THREATS:
- Regulatory changes: {{assessment}}
- Economic downturn exposure: {{assessment}}
- Political/geopolitical risk: {{assessment}}
- Supply chain vulnerabilities: {{assessment}}
- Talent market tightening: {{assessment}}

TOP 5 THREATS (ranked by likelihood x severity):
T1: {{threat}} -- Likelihood: {{H/M/L}} -- Severity: {{H/M/L}}
T2: {{threat}} -- Likelihood: {{H/M/L}} -- Severity: {{H/M/L}}
T3: {{threat}} -- Likelihood: {{H/M/L}} -- Severity: {{H/M/L}}
T4: {{threat}} -- Likelihood: {{H/M/L}} -- Severity: {{H/M/L}}
T5: {{threat}} -- Likelihood: {{H/M/L}} -- Severity: {{H/M/L}}
```

---

## Step 3: PESTLE Analysis

Use PESTLE to systematically scan the external environment.
```
PESTLE ANALYSIS: {{entity/industry}}

POLITICAL FACTORS:
| Factor | Current State | Trend | Impact (+/-) | Relevance (H/M/L) |
|--------|--------------|-------|-------------|-------------------|
| {{political_factor_1}} | {{}} | {{}} | {{}} | {{}} |
| {{political_factor_2}} | {{}} | {{}} | {{}} | {{}} |
| Government stability | {{}} | {{}} | {{}} | {{}} |
| Trade policies | {{}} | {{}} | {{}} | {{}} |
| Tax policy | {{}} | {{}} | {{}} | {{}} |

ECONOMIC FACTORS:
| Factor | Current State | Trend | Impact (+/-) | Relevance (H/M/L) |
|--------|--------------|-------|-------------|-------------------|
| GDP growth | {{}} | {{}} | {{}} | {{}} |
| Inflation rate | {{}} | {{}} | {{}} | {{}} |
| Interest rates | {{}} | {{}} | {{}} | {{}} |
| Consumer spending | {{}} | {{}} | {{}} | {{}} |
| Exchange rates | {{}} | {{}} | {{}} | {{}} |

SOCIAL FACTORS:
| Factor | Current State | Trend | Impact (+/-) | Relevance (H/M/L) |
|--------|--------------|-------|-------------|-------------------|
| Demographics | {{}} | {{}} | {{}} | {{}} |
| Cultural attitudes | {{}} | {{}} | {{}} | {{}} |
| Work-life balance trends | {{}} | {{}} | {{}} | {{}} |
| Education levels | {{}} | {{}} | {{}} | {{}} |
| Health consciousness | {{}} | {{}} | {{}} | {{}} |

TECHNOLOGICAL FACTORS:
| Factor | Current State | Trend | Impact (+/-) | Relevance (H/M/L) |
|--------|--------------|-------|-------------|-------------------|
| AI/Automation | {{}} | {{}} | {{}} | {{}} |
| Digital adoption | {{}} | {{}} | {{}} | {{}} |
| R&D investment (industry) | {{}} | {{}} | {{}} | {{}} |
| Technology lifecycle | {{}} | {{}} | {{}} | {{}} |
| Cybersecurity landscape | {{}} | {{}} | {{}} | {{}} |

LEGAL FACTORS:
| Factor | Current State | Trend | Impact (+/-) | Relevance (H/M/L) |
|--------|--------------|-------|-------------|-------------------|
| Data privacy (GDPR, etc.) | {{}} | {{}} | {{}} | {{}} |
| Employment law | {{}} | {{}} | {{}} | {{}} |
| Industry regulations | {{}} | {{}} | {{}} | {{}} |
| IP protections | {{}} | {{}} | {{}} | {{}} |
| Consumer protection | {{}} | {{}} | {{}} | {{}} |

ENVIRONMENTAL FACTORS:
| Factor | Current State | Trend | Impact (+/-) | Relevance (H/M/L) |
|--------|--------------|-------|-------------|-------------------|
| Sustainability pressure | {{}} | {{}} | {{}} | {{}} |
| Carbon regulations | {{}} | {{}} | {{}} | {{}} |
| Supply chain impact | {{}} | {{}} | {{}} | {{}} |
| Climate risk | {{}} | {{}} | {{}} | {{}} |
| Consumer eco-preferences | {{}} | {{}} | {{}} | {{}} |

TOP 3 PESTLE FACTORS TO MONITOR:
1. {{factor}} -- Why: {{rationale}} -- Review frequency: {{quarterly/monthly}}
2. {{factor}} -- Why: {{rationale}} -- Review frequency: {{quarterly/monthly}}
3. {{factor}} -- Why: {{rationale}} -- Review frequency: {{quarterly/monthly}}
```

---

## Step 4: Porter's Five Forces
```
PORTER'S FIVE FORCES ANALYSIS: {{industry}}

1. THREAT OF NEW ENTRANTS: {{Rating 1-5}}
   Barriers to entry:
   - Capital requirements: {{high/medium/low}}
   - Economies of scale: {{high/medium/low}}
   - Brand loyalty of incumbents: {{high/medium/low}}
   - Access to distribution: {{high/medium/low}}
   - Regulatory barriers: {{high/medium/low}}
   - Switching costs: {{high/medium/low}}
   - Proprietary technology: {{high/medium/low}}
   Assessment: {{summary}}

2. BARGAINING POWER OF SUPPLIERS: {{Rating 1-5}}
   - Number of suppliers: {{few/many}}
   - Switching costs to change supplier: {{high/medium/low}}
   - Supplier concentration: {{high/medium/low}}
   - Availability of substitutes: {{high/medium/low}}
   - Importance of your business to supplier: {{high/medium/low}}
   Assessment: {{summary}}

3. BARGAINING POWER OF BUYERS: {{Rating 1-5}}
   - Number of buyers: {{few/many}}
   - Buyer concentration: {{high/medium/low}}
   - Switching costs for buyer: {{high/medium/low}}
   - Price sensitivity: {{high/medium/low}}
   - Buyer's information availability: {{high/medium/low}}
   - Threat of backward integration: {{high/medium/low}}
   Assessment: {{summary}}

4. THREAT OF SUBSTITUTES: {{Rating 1-5}}
   - Availability of close substitutes: {{high/medium/low}}
   - Price-performance of substitutes: {{high/medium/low}}
   - Switching costs to substitute: {{high/medium/low}}
   - Buyer propensity to substitute: {{high/medium/low}}
   Assessment: {{summary}}

5. COMPETITIVE RIVALRY: {{Rating 1-5}}
   - Number of competitors: {{count}}
   - Industry growth rate: {{growing/stable/declining}}
   - Product differentiation: {{high/medium/low}}
   - Exit barriers: {{high/medium/low}}
   - Fixed cost structure: {{high/medium/low}}
   Assessment: {{summary}}

OVERALL INDUSTRY ATTRACTIVENESS:
  Average force rating: {{average}}/5
  Most concerning force: {{which_force}} -- because {{reason}}
  Most favorable force: {{which_force}} -- because {{reason}}
  Strategic implication: {{what_this_means_for_strategy}}
```

---

## Step 5: TOWS Strategy Matrix

Convert SWOT findings into actionable strategies using the TOWS matrix.
```
TOWS STRATEGY MATRIX

                  | STRENGTHS (S)              | WEAKNESSES (W)
                  | S1: {{}}                   | W1: {{}}
                  | S2: {{}}                   | W2: {{}}
                  | S3: {{}}                   | W3: {{}}
------------------+----------------------------+---------------------------
OPPORTUNITIES (O) | SO STRATEGIES              | WO STRATEGIES
O1: {{}}          | (Use strengths to capture  | (Overcome weaknesses by
O2: {{}}          |  opportunities)            |  exploiting opportunities)
O3: {{}}          |                            |
                  | SO1: {{strategy}}          | WO1: {{strategy}}
                  | SO2: {{strategy}}          | WO2: {{strategy}}
                  | SO3: {{strategy}}          | WO3: {{strategy}}
------------------+----------------------------+---------------------------
THREATS (T)       | ST STRATEGIES              | WT STRATEGIES
T1: {{}}          | (Use strengths to          | (Minimize weaknesses and
T2: {{}}          |  mitigate threats)         |  avoid threats)
T3: {{}}          |                            |
                  | ST1: {{strategy}}          | WT1: {{strategy}}
                  | ST2: {{strategy}}          | WT2: {{strategy}}
                  | ST3: {{strategy}}          | WT3: {{strategy}}
------------------+----------------------------+---------------------------

STRATEGY DESCRIPTIONS:

SO STRATEGIES (Aggressive/Growth):
  SO1: {{detailed_description_and_rationale}}
  SO2: {{detailed_description_and_rationale}}

WO STRATEGIES (Reorientation/Improvement):
  WO1: {{detailed_description_and_rationale}}
  WO2: {{detailed_description_and_rationale}}

ST STRATEGIES (Diversification/Defense):
  ST1: {{detailed_description_and_rationale}}
  ST2: {{detailed_description_and_rationale}}

WT STRATEGIES (Defensive/Survival):
  WT1: {{detailed_description_and_rationale}}
  WT2: {{detailed_description_and_rationale}}
```

---

## Step 6: Competitive Positioning Matrix
```
COMPETITIVE POSITIONING MAP

Select two dimensions most important to your market:

DIMENSION OPTIONS:
  Price (low to high)
  Quality (low to high)
  Features (basic to comprehensive)
  Ease of use (complex to simple)
  Service level (self-serve to high-touch)
  Innovation (traditional to cutting-edge)
  Specialization (general to niche)
  Speed (slow to fast)

SELECTED AXES:
  X-axis: {{dimension_1}} (left = low, right = high)
  Y-axis: {{dimension_2}} (bottom = low, top = high)

PLOTTED POSITIONS:
  Your company: X={{1-10}}, Y={{1-10}}
  Competitor A: X={{1-10}}, Y={{1-10}}
  Competitor B: X={{1-10}}, Y={{1-10}}
  Competitor C: X={{1-10}}, Y={{1-10}}
  Competitor D: X={{1-10}}, Y={{1-10}}

QUADRANT ANALYSIS:
  Top-Right (High/High): {{who_is_here}} -- {{implications}}
  Top-Left (Low X/High Y): {{who_is_here}} -- {{implications}}
  Bottom-Right (High X/Low Y): {{who_is_here}} -- {{implications}}
  Bottom-Left (Low/Low): {{who_is_here}} -- {{implications}}

WHITE SPACE:
  Underserved position: {{description}}
  Opportunity: {{what_this_means}}

YOUR POSITIONING STATEMENT:
  We compete in the {{quadrant}} by offering {{differentiation}}.
  Our moat is {{defensibility}}.
```

---

## Step 7: Strategy Prioritization

### Impact-Effort Matrix
```
STRATEGY PRIORITIZATION

Rate each TOWS strategy on Impact and Effort:

| Strategy | Impact (1-10) | Effort (1-10) | Priority |
|----------|--------------|---------------|----------|
| SO1      | {{}}         | {{}}          | {{}}     |
| SO2      | {{}}         | {{}}          | {{}}     |
| WO1      | {{}}         | {{}}          | {{}}     |
| WO2      | {{}}         | {{}}          | {{}}     |
| ST1      | {{}}         | {{}}          | {{}}     |
| ST2      | {{}}         | {{}}          | {{}}     |
| WT1      | {{}}         | {{}}          | {{}}     |
| WT2      | {{}}         | {{}}          | {{}}     |

PRIORITY CATEGORIES:
  Quick Wins (High Impact, Low Effort): {{strategies}}
  Major Projects (High Impact, High Effort): {{strategies}}
  Fill-ins (Low Impact, Low Effort): {{strategies}}
  Deprioritize (Low Impact, High Effort): {{strategies}}

TOP 3 STRATEGIC PRIORITIES:
1. {{strategy}} -- Timeline: {{}} -- Owner: {{}} -- Budget: ${{}}
2. {{strategy}} -- Timeline: {{}} -- Owner: {{}} -- Budget: ${{}}
3. {{strategy}} -- Timeline: {{}} -- Owner: {{}} -- Budget: ${{}}
```

---

## Step 8: Strategic Action Plan
```
STRATEGIC ACTION PLAN

Strategy: {{selected_strategy_name}}
Objective: {{what_success_looks_like}}
Timeline: {{start}} to {{end}}
Owner: {{responsible_person}}
Budget: ${{budget}}

MILESTONES:
| Milestone | Target Date | Success Metric | Status |
|-----------|------------|----------------|--------|
| {{m1}}    | {{date}}   | {{metric}}     | [ ]    |
| {{m2}}    | {{date}}   | {{metric}}     | [ ]    |
| {{m3}}    | {{date}}   | {{metric}}     | [ ]    |
| {{m4}}    | {{date}}   | {{metric}}     | [ ]    |

KEY ACTIONS:
Week 1-2: {{action_items}}
Week 3-4: {{action_items}}
Month 2: {{action_items}}
Month 3: {{action_items}}

RESOURCES REQUIRED:
- People: {{team_members_and_roles}}
- Budget: ${{budget_breakdown}}
- Tools: {{tools_and_technology}}
- External: {{consultants_partners_vendors}}

RISKS TO THIS STRATEGY:
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| {{r1}} | {{H/M/L}} | {{H/M/L}} | {{mitigation}} |
| {{r2}} | {{H/M/L}} | {{H/M/L}} | {{mitigation}} |

REVIEW CADENCE: {{weekly/biweekly/monthly}}
```

---

## Analysis Quality Checklist

- [ ] Internal assessment is based on evidence, not assumptions
- [ ] Strengths are genuine advantages (not just "we are nice people")
- [ ] Weaknesses are honest and specific (not vague platitudes)
- [ ] Opportunities are external, not internal wishes
- [ ] Threats are realistic and prioritized by likelihood and severity
- [ ] PESTLE covers all six categories comprehensively
- [ ] Porter's Five Forces ratings are justified with evidence
- [ ] TOWS matrix generates specific, actionable strategies
- [ ] Competitive positioning identifies genuine white space
- [ ] Strategies are prioritized with clear next steps and owners
- [ ] Analysis is reviewed by someone outside the team for blind spots


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Swot Analyzer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with swot analyzer for a mid-size project."

**Output:** A complete swot analyzer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
