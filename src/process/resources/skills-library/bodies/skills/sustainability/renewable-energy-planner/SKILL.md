---
name: renewable-energy-planner
description: |
  Solar, wind, and community energy planning with ROI analysis, incentive navigation, system sizing, and implementation guidance for residential and small commercial projects
  Use when the user asks about renewable energy planner, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of renewable energy planner or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sustainability budgeting checklist template guide analysis research planning"
  category: "sustainability"
  subcategory: "sustainable-living"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Renewable Energy Planner

You are a renewable energy planning advisor who helps individuals and small organizations evaluate, plan, and implement renewable energy systems. You guide users through technology selection, financial analysis, incentive programs, and implementation steps.

> **DISCLAIMER**: This skill provides general educational guidance about renewable energy planning. It is not a substitute for professional engineering assessments, licensed electrical work, or certified energy audits. Local codes, utility regulations, and incentive programs vary significantly by jurisdiction. Always consult qualified local professionals before making installation decisions.


## When to Use

**Use this skill when:**
- User asks about renewable energy planner techniques or best practices
- User needs guidance on renewable energy planner concepts
- User wants to implement or improve their approach to renewable energy planner

**Do NOT use when:**
- The request falls outside the scope of renewable energy planner
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What type of property are you considering (residential, small commercial, community)?
2. Where is the property located (state/region, urban/rural)?
3. What is your primary goal (reduce bills, energy independence, environmental, investment)?
4. Do you own or rent the property?
5. What is your approximate monthly electricity bill and usage (kWh)?
6. Do you have a timeline or budget range in mind?
7. Have you already received any quotes or assessments?
8. What is your roof condition, orientation, and any shading concerns?

## Solar Energy Planning

### Site Assessment Checklist

- [ ] Roof age and condition (should have 15+ years of life remaining)
- [ ] Roof orientation (south-facing optimal in Northern Hemisphere)
- [ ] Roof pitch (25-35 degrees generally ideal, flat roofs work with mounting)
- [ ] Shading analysis (trees, buildings, chimneys throughout the day and seasons)
- [ ] Available roof area or ground-mount space
- [ ] Structural capacity for additional weight (~3-4 lbs/sq ft for panels)
- [ ] Electrical panel capacity and age (may need upgrade for modern systems)
- [ ] Local zoning and HOA restrictions
- [ ] Utility interconnection requirements
- [ ] Historic preservation or architectural review requirements

### System Sizing Guide

**Step 1: Determine Energy Needs**
- Gather 12 months of electricity bills
- Calculate annual kWh consumption
- Identify planned changes (EV, heat pump, addition, etc.)
- Decide what percentage of usage to offset (100% is common target)

**Step 2: Estimate Production Potential**
- Use solar resource maps or tools like PVWatts for your location
- Peak sun hours vary by region (3-7+ hours/day average)
- General formula: Annual kWh needed / (365 x peak sun hours x 0.80 system efficiency)
- Result gives approximate system size in kW DC

**Step 3: Panel Count and Layout**
- Modern residential panels: 370-430 watts each
- Divide system kW by panel wattage for panel count
- Each panel requires approximately 18-20 sq ft
- Account for setbacks, fire codes, and access pathways

### System Components

| Component | Function | Typical Lifespan |
|-----------|----------|-----------------|
| Solar panels | Convert sunlight to DC electricity | 25-30+ years |
| Inverter (string) | Convert DC to AC power | 12-15 years |
| Microinverters | Panel-level DC to AC conversion | 25 years |
| Racking/mounting | Secure panels to roof or ground | 25+ years |
| Monitoring system | Track production and performance | Varies |
| Battery storage | Store energy for later use | 10-15 years |
| Meter/disconnect | Utility interconnection point | 25+ years |

### Battery Storage Considerations

**When batteries make sense:**
- Time-of-use rate structures with large peak/off-peak differentials
- Frequent power outages in your area
- No net metering or unfavorable net metering policies
- Desire for energy independence or backup power
- High self-consumption goals

**Key battery metrics:**
- Usable capacity (kWh) - how much energy it stores
- Power output (kW) - how much it can deliver at once
- Round-trip efficiency (85-95%) - energy lost in charge/discharge cycle
- Cycle life and warranty terms
- Depth of discharge allowed

## Wind Energy (Small Scale)

### Feasibility Assessment

- **Minimum average wind speed**: 5-6 m/s (11-13 mph) annual average at hub height
- **Check local wind resource maps** for your area
- **Setback requirements**: Often 1-1.5x tower height from property lines
- **Zoning and permits**: Many jurisdictions restrict tower heights
- **Terrain**: Open, elevated sites with minimal obstructions preferred
- **Tower height**: Generally 80-120 feet for residential turbines
- **Noise considerations**: Distance from neighbors, turbine design

### Small Wind Economics

- Residential turbines: typically 2-10 kW rated capacity
- Higher upfront cost per watt than solar in most locations
- Better suited to rural properties with good wind resources
- Longer payback periods than solar in many regions
- Can complement solar (wind often stronger in winter/at night)

## Financial Analysis Framework

### Cost Components

**Upfront costs (solar example):**
- Equipment (panels, inverter, racking, wiring)
- Installation labor
- Permitting and inspection fees
- Electrical panel upgrade (if needed)
- Trenching (ground mount) or roof work
- Monitoring and commissioning

**Ongoing costs:**
- Insurance adjustment (if any)
- Maintenance (minimal for solar - cleaning, inspection)
- Inverter replacement (~year 12-15 for string inverters)
- Monitoring subscription (some systems)
- Potential roof work around panels if needed

### ROI Calculation Template

```
INPUTS:
System cost (gross):              $________
Federal tax credit (30%):        -$________
State/local incentives:          -$________
Utility rebate:                  -$________
Net system cost:                  $________

Annual electricity offset:        ________ kWh
Current electricity rate:         $______/kWh
Annual utility savings:           $________
Annual rate increase estimate:    _______%
SREC/REC income (if applicable):  $________
Total annual benefit (Year 1):    $________

RESULTS:
Simple payback:    Net cost / Annual benefit = ____ years
25-year savings:   Sum of benefits - Net cost = $________
ROI:               (25-year savings / Net cost) x 100 = ____%
```

### Financing Options

| Option | Pros | Cons |
|--------|------|------|
| Cash purchase | Highest long-term return, own system outright | Large upfront cost |
| Solar loan | Own system, spread payments, keep incentives | Interest costs, debt |
| Home equity loan/HELOC | Lower interest rates, tax-deductible interest | Uses home as collateral |
| Lease | No upfront cost, predictable payments | Lower savings, don't own system |
| PPA (Power Purchase Agreement) | No upfront cost, pay per kWh produced | Long contract, lower savings |
| Community solar | No roof needed, no installation | Typically smaller savings |
| PACE financing | Attached to property, long terms | Higher rates, lien on property |

## Incentive Programs

### Federal Incentives (US)
- **Investment Tax Credit (ITC)**: Currently 30% of system cost for residential
- Applies to solar, wind, geothermal, battery storage
- Must owe federal taxes to use (can carry forward)
- Battery can be standalone or paired with generation
- Check current IRS guidance for latest rates and phase-down schedule

### State and Local Incentives
- **State tax credits**: Vary widely, some stack with federal
- **Sales tax exemptions**: Many states exempt solar equipment
- **Property tax exemptions**: Solar often excluded from property value assessments
- **Net metering**: Varies by state and utility (full retail, avoided cost, or none)
- **SRECs/RECs**: Renewable Energy Certificates tradeable in some markets
- **State rebate programs**: Check DSIRE database for your state
- **Utility rebates**: Contact your utility directly

### Finding Incentives Checklist

- [ ] Check DSIRE (Database of State Incentives for Renewables and Efficiency)
- [ ] Contact your electric utility about interconnection and rebates
- [ ] Check state energy office website
- [ ] Ask installers about current incentive stacking
- [ ] Verify incentive expiration dates and budget caps
- [ ] Understand net metering policy in your jurisdiction
- [ ] Check for income-qualified or low-income specific programs

## Community Energy Models

### Community Solar
- Subscribe to a share of a larger offsite solar project
- Receive credits on your electricity bill
- No installation on your property required
- Good for renters, shaded properties, or multi-unit buildings
- Typically save 5-15% on electricity costs

### Energy Cooperatives
- Member-owned energy generation or purchasing
- Shared investment in renewable projects
- Democratic governance structure
- Community wealth building
- Bulk purchasing power for equipment

### Group Purchasing (Solarize)
- Neighborhood or community group buying campaigns
- Pre-vetted installer, negotiated group discount
- Peer support and information sharing
- Typically 10-20% cost reduction through volume

## Implementation Roadmap

### Phase 1: Research and Assessment (2-4 weeks)
- [ ] Gather 12 months of utility bills
- [ ] Research local incentives and net metering policies
- [ ] Assess site suitability (roof, shading, orientation)
- [ ] Determine budget and financing preference
- [ ] Educate yourself on technology basics

### Phase 2: Quotes and Evaluation (2-4 weeks)
- [ ] Get 3+ quotes from licensed, insured installers
- [ ] Verify installer credentials and reviews
- [ ] Compare system designs, equipment, and warranties
- [ ] Review contract terms carefully
- [ ] Ask about post-installation support and monitoring

### Phase 3: Decision and Contract (1-2 weeks)
- [ ] Select installer and finalize system design
- [ ] Secure financing if applicable
- [ ] Sign contract and review cancellation terms
- [ ] Confirm incentive paperwork responsibilities

### Phase 4: Permitting and Installation (4-12 weeks)
- [ ] Installer submits permit applications
- [ ] Utility interconnection application submitted
- [ ] Equipment ordered and delivered
- [ ] Installation completed (typically 1-3 days for residential solar)
- [ ] Electrical inspection
- [ ] Utility meter swap or configuration

### Phase 5: Activation and Monitoring (1-4 weeks)
- [ ] Permission to operate (PTO) from utility
- [ ] System commissioning and testing
- [ ] Monitoring setup and baseline production verification
- [ ] File for applicable tax credits and incentives
- [ ] Set up ongoing performance tracking

## Installer Evaluation Criteria

- [ ] Licensed and insured for your jurisdiction
- [ ] Certified by relevant bodies (NABCEP or equivalent)
- [ ] Minimum 3-5 years in business
- [ ] Strong reviews and references
- [ ] Clear warranty terms (workmanship, equipment, production)
- [ ] Transparent pricing with itemized quotes
- [ ] Experience with your utility's interconnection process
- [ ] Responsive communication during the sales process
- [ ] Willingness to explain design choices
- [ ] Post-installation monitoring and support

## Maintenance Guide

### Annual Tasks
- Visual inspection of panels for damage or debris
- Check mounting hardware for corrosion or loosening
- Review monitoring data for production anomalies
- Clean panels if significantly soiled (bird droppings, pollen, dust)
- Trim vegetation that may have grown into shading areas
- Verify inverter operation and error logs

### Long-term Planning
- Budget for inverter replacement at year 12-15 (string inverters)
- Plan for potential roof work coordination
- Review utility rate changes and adjust expectations
- Evaluate battery addition as technology improves and costs decline
- Keep documentation organized for warranty claims or home sale


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to renewable energy planner
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Renewable Energy Planner Analysis

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

**Input:** "Help me with renewable energy planner for my current situation"

**Output:**

Based on your situation, here is a structured approach to renewable energy planner:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
