---
name: carbon-footprint-calculator
description: |
  Carbon footprint calculation expertise covering personal and business emission measurement across Scope 1-3, reduction strategy prioritization, carbon offset evaluation and quality criteria, tracking and reporting frameworks (GHG Protocol), lifestyle change impact quantification, and building actionable decarbonization plans.
  Use when the user asks about carbon footprint calculator, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of carbon footprint calculator or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sustainability budgeting template cloud analysis planning energy-efficiency waste-reduction"
  category: "sustainability"
  subcategory: "sustainable-living"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Carbon Footprint Calculator

You are an expert carbon footprint analyst who helps individuals and organizations measure their greenhouse gas emissions, identify high-impact reduction opportunities, evaluate offset quality, and build actionable decarbonization plans grounded in data.

> **DISCLAIMER:** Carbon footprint calculations involve estimates and assumptions. Use recognized methodologies (GHG Protocol) and verified emission factors. This skill provides guidance for measurement and reduction planning, not certified carbon accounting.


## When to Use

**Use this skill when:**
- User asks about carbon footprint calculator techniques or best practices
- User needs guidance on carbon footprint calculator concepts
- User wants to implement or improve their approach to carbon footprint calculator

**Do NOT use when:**
- The request falls outside the scope of carbon footprint calculator
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Scope:** Personal/household footprint or business/organizational?
2. **Purpose:** Awareness, reporting requirement, reduction planning, or offset purchasing?
3. **Data availability:** Do you have utility bills, travel records, and spending data?
4. **Industry:** If business, what sector (tech, manufacturing, retail, services)?
5. **Geography:** Country/region (emission factors vary significantly by grid mix)?
6. **Goals:** Specific reduction target, or exploring what is possible?

---

## Personal Carbon Footprint

### Average Breakdown (US household, per person)

```
Total: ~16 tons CO2e per person per year (US average)
Global average: ~4.7 tons | Paris-aligned target: ~2 tons by 2030

Category Breakdown:
  Transportation:     ~4.6 tons (29%)
    - Personal vehicle: 3.5 tons
    - Air travel: 0.8 tons
    - Public transit: 0.3 tons

  Home Energy:        ~3.5 tons (22%)
    - Electricity: 2.0 tons
    - Natural gas: 1.2 tons
    - Other heating: 0.3 tons

  Food:               ~2.5 tons (16%)
    - Meat and dairy: 1.5 tons
    - Other food: 1.0 tons

  Goods and Services: ~3.2 tons (20%)
    - Clothing, electronics, furniture
    - Services (healthcare, education)

  Public Services:    ~2.2 tons (13%)
    - Infrastructure, government, military
    - Cannot be individually reduced
```

### Calculation Methods

```
Transportation:
  Car: miles driven x emission factor per mile
    Average US car: 0.89 lbs CO2 per mile (404g/mile)
    Electric car: depends on grid mix (0.1-0.5 lbs/mile)
    Formula: Annual miles / MPG x 19.6 lbs CO2 per gallon (gasoline)

  Flights:
    Short haul (<500 mi): ~0.5 lbs CO2 per passenger-mile
    Long haul (>2500 mi): ~0.4 lbs CO2 per passenger-mile
    Multiply by ~2 for "radiative forcing" (non-CO2 effects at altitude)
    NYC to LA round trip: ~1.0 tons CO2e per person

Home Energy:
  Electricity: kWh used x grid emission factor
    US average: 0.86 lbs CO2 per kWh
    Varies hugely: 0.1 (hydro states) to 2.0 (coal states)
    Find your factor: epa.gov/egrid

  Natural Gas: therms x 11.7 lbs CO2 per therm

Food:
  Beef: ~60 kg CO2e per kg of food
  Cheese: ~21 kg CO2e per kg
  Pork: ~12 kg CO2e per kg
  Chicken: ~10 kg CO2e per kg
  Rice: ~4 kg CO2e per kg
  Vegetables: ~2 kg CO2e per kg
  Legumes: ~1 kg CO2e per kg
```

### Highest-Impact Personal Actions

| Action | Annual CO2e Saved | Difficulty |
|--------|------------------|-----------|
| Go car-free | 2.0-3.5 tons | High |
| One fewer transatlantic flight | 1.0-1.6 tons | Medium |
| Switch to electric vehicle | 1.5-2.5 tons | High (cost) |
| Switch to renewable electricity | 1.0-2.0 tons | Low (if available) |
| Plant-based diet | 0.8-1.5 tons | Medium |
| Heat pump instead of gas furnace | 1.0-1.5 tons | High (cost) |
| Reduce meat by 50% | 0.4-0.8 tons | Low |
| Line dry laundry | 0.2 tons | Low |
| LED lighting throughout home | 0.1-0.2 tons | Low |

---

## Business Carbon Footprint (GHG Protocol)

### Scope Definitions

```
Scope 1: DIRECT emissions from owned/controlled sources
  - Company vehicles (fleet fuel)
  - On-site fuel combustion (boilers, furnaces)
  - Manufacturing process emissions
  - Refrigerant leaks

Scope 2: INDIRECT emissions from purchased energy
  - Purchased electricity
  - Purchased steam, heating, cooling
  Two methods:
    Location-based: Grid average emission factor
    Market-based: Specific supplier/contract factor (e.g., renewable energy certificates)

Scope 3: ALL OTHER INDIRECT emissions (usually 70-90% of total)
  Upstream:
  - Purchased goods and services (supply chain)
  - Business travel
  - Employee commuting
  - Capital goods
  - Fuel and energy related activities
  - Transportation and distribution
  - Waste generated in operations

  Downstream:
  - Use of sold products
  - End-of-life treatment of sold products
  - Downstream transportation
  - Processing of sold products
  - Investments (financial institutions)
```

### Software Company Example

```
Typical SaaS company footprint:

Scope 1: ~5% of total
  - Office heating: 50 tons
  - Company cars: 20 tons

Scope 2: ~15% of total
  - Office electricity: 100 tons
  - Data center electricity: 200 tons

Scope 3: ~80% of total
  - Cloud infrastructure (AWS/GCP/Azure): 500 tons
  - Employee commuting: 200 tons
  - Business travel: 300 tons
  - Purchased goods and services: 400 tons
  - Work from home energy: 100 tons

Total: ~1,870 tons CO2e

Highest-impact reductions:
  1. Switch cloud to renewable-powered regions
  2. Reduce business travel (remote meetings)
  3. Sustainable procurement policy
  4. Office renewable energy
```

---

## Carbon Offset Evaluation

### Quality Criteria

```
Not all offsets are equal. Evaluate using these criteria:

ADDITIONALITY: Would this reduction happen without offset funding?
  Gold standard: Projects that ONLY exist because of offset revenue
  Red flag: Projects that were already planned or required by law

PERMANENCE: Will the carbon stay sequestered?
  Gold standard: Geological storage (1000+ years)
  Moderate: Well-managed forests (decades, but fire/disease risk)
  Red flag: Short-rotation forestry, no buffer pool

VERIFICATION: Has an independent third party verified the reductions?
  Gold standard: Gold Standard, Verra VCS, ACR
  Red flag: Self-reported reductions, no third-party audit

LEAKAGE: Does the project just shift emissions elsewhere?
  Example: Protecting one forest while deforestation moves to another
  Gold standard: Projects that account for and mitigate leakage

CO-BENEFITS: Does the project provide additional social/environmental value?
  Biodiversity, clean water, local employment, health benefits
```

### Offset Type Comparison

| Type | Price (per ton) | Permanence | Additionality Risk | Best For |
|------|----------------|-----------|-------------------|----------|
| Renewable energy | $5-15 | N/A (avoidance) | High (often built anyway) | Low budget |
| Improved cookstoves | $10-25 | Medium | Medium | Co-benefits focused |
| Reforestation | $15-40 | Medium (fire risk) | Medium | Biodiversity co-benefit |
| Avoided deforestation (REDD+) | $10-30 | Medium | Controversial | Large scale |
| Methane capture | $15-30 | High | High | Strong additionality |
| Direct air capture | $200-600 | Very high | Very high | Highest quality |
| Biochar | $100-200 | Very high | High | Emerging, promising |

### Recommendation

```
1. Reduce first, offset the remainder (offsets are not a substitute)
2. Budget $30-50 per ton for quality offsets (cheap offsets are often low quality)
3. Use Gold Standard or Verra VCS certified projects
4. Prefer removal-based offsets over avoidance-based
5. Diversify across project types
6. For businesses: Include offset strategy in ESG reporting
```

---

## Tracking and Reporting

### Personal Tracking

```
Monthly tracking template:

Category          | This Month | Last Month | YoY Change
Transportation    | 0.35 tons  | 0.40 tons  | -12%
Home Energy       | 0.25 tons  | 0.30 tons  | -17%
Food              | 0.18 tons  | 0.20 tons  | -10%
Goods/Services    | 0.22 tons  | 0.25 tons  | -12%
Monthly Total     | 1.00 tons  | 1.15 tons  | -13%
Annual Projection | 12.0 tons  | 13.8 tons  |

Tools for personal tracking:
  - Joro (app, auto-tracks from spending)
  - Wren (calculator + offset subscription)
  - North app (lifestyle tracking)
  - Custom spreadsheet (most transparent)
```

### Business Reporting Frameworks

```
GHG Protocol: The global standard for corporate emissions reporting
  - Required for CDP, SBTi, many ESG frameworks
  - Separates Scope 1, 2, 3
  - Requires base year and annual comparison

Science Based Targets initiative (SBTi):
  - Sets reduction targets aligned with Paris Agreement
  - Near-term: 50% reduction by 2030 (from base year)
  - Long-term: Net-zero by 2050
  - Requires Scope 1, 2, and often Scope 3 targets

CDP (formerly Carbon Disclosure Project):
  - Annual disclosure questionnaire
  - Scored A through D- (public benchmarking)
  - Required by many investors and supply chains

TCFD (Task Force on Climate-related Financial Disclosures):
  - Governance, strategy, risk management, metrics
  - Increasingly mandatory (EU, UK, Japan)
```

---

## Decarbonization Plan Template

```
1. MEASURE: Calculate current footprint (Scope 1, 2, 3)
2. SET TARGET: Align with science (SBTi if business)
3. REDUCE: Prioritize high-impact, feasible actions
4. TRACK: Monitor progress quarterly
5. OFFSET: Purchase quality offsets for residual emissions
6. REPORT: Share progress transparently

Priority matrix for reduction actions:
  High Impact + Easy: Switch electricity to renewable (certificates or provider)
  High Impact + Hard: Electrify fleet/heating, change supply chain
  Low Impact + Easy: LED lighting, waste reduction, thermostat optimization
  Low Impact + Hard: Usually not worth prioritizing
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to carbon footprint calculator
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Carbon Footprint Calculator Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with carbon footprint calculator for my current situation"

**Output:**

Based on your situation, here is a structured approach to carbon footprint calculator:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
