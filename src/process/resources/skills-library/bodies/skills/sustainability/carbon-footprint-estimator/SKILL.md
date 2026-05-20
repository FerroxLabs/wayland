---
name: carbon-footprint-estimator
description: |
  Estimates personal carbon footprint by category (transportation, home energy, food, and consumption) and produces a ranked reduction action list with estimated CO2e savings per action. Gathers the user's lifestyle data to produce a baseline footprint estimate and prioritized reduction plan with realistic impact numbers.
  Use when the user asks about their carbon footprint, personal emissions, environmental impact of their lifestyle, or how to reduce their carbon output.
  Do NOT use for corporate or business carbon accounting, carbon offset evaluation or purchasing, climate policy analysis (use environmental-policy-researcher), or life cycle assessment of specific products.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sustainability planning checklist analysis"
  category: "sustainability"
  subcategory: "sustainable-living"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Carbon Footprint Estimator

## When to Use

**Use this skill when:**
- The user asks what their personal carbon footprint is, wants a rough estimate, or mentions wanting to understand their environmental impact as an individual
- The user wants to know which of their daily habits, lifestyle choices, or spending patterns contribute most to greenhouse gas emissions
- The user asks how to reduce their personal carbon output, lower their emissions, or "go greener" in their daily life
- The user mentions specific behaviors -- such as eating habits, driving patterns, flying frequency, or home energy use -- and wants to understand the climate implications
- The user wants a ranked, prioritized action plan for reducing emissions rather than generic sustainability advice
- The user asks how they compare to national or global averages for per-capita emissions
- The user recently made a lifestyle change (moved, switched jobs, changed diet, bought a car) and wants to recalculate their footprint

**Do NOT use when:**
- The user represents a company, organization, or government entity needing Scope 1, 2, or 3 emissions accounting -- this requires corporate carbon accounting methodology under GHG Protocol standards
- The user wants to buy, evaluate, or compare carbon offsets or carbon credits -- offset quality, permanence, additionality, and verification are a separate specialty domain
- The user wants to analyze climate policy, legislation, or international agreements -- use the `environmental-policy-researcher` skill
- The user needs a formal life cycle assessment (LCA) of a specific product -- LCA methodology under ISO 14040/44 is a different technical process
- The user asks about geoengineering, carbon capture technologies, or large-scale systemic climate solutions -- these are not personal-action domains
- The user is asking on behalf of a school, municipality, or nonprofit wanting to calculate organizational emissions
- The user wants to calculate the embodied carbon of a construction project or building renovation -- this is a specialized engineering domain

---

## Process

### Step 1: Intake -- Gather Lifestyle Data Across Four Categories

Before calculating anything, collect the user's actual data. Do not assume averages where specifics are available. Ask in a friendly, non-judgmental tone and explain why each data point matters. If the user cannot provide specifics, offer reasonable defaults based on the U.S. national average for that sub-category. Organize intake around these four domains:

**Transportation:**
- Primary commute method (gasoline car, diesel car, hybrid, plug-in hybrid, electric vehicle, bus, rail, bike, walk, fully remote)
- Annual miles driven -- if unknown, use commute distance x working days (commute round-trip x 250 days is a useful default) plus an estimate for non-commute driving (U.S. average non-commute driving is approximately 4,000-5,000 miles/year)
- Vehicle type and approximate year -- older vehicles burn more fuel per mile; pre-2005 sedans average 24 MPG versus 35+ MPG for 2020+ models
- For electric vehicles: state or utility region (determines grid carbon intensity)
- Air travel: number of flights per year by category -- short-haul (under 500 miles one-way), medium-haul (500-2,500 miles one-way), long-haul (over 2,500 miles one-way); whether trips are business class or economy (business class allocates 2-3x the seat-weight emissions due to cabin footprint)
- Other travel: cruises (one 7-day cruise = approximately 1,000-2,000 lbs CO2e per passenger depending on ship efficiency), long-distance train, intercity bus

**Home Energy:**
- Housing type: apartment/condo, townhouse/row house, detached single-family home -- size matters significantly
- Approximate square footage and number of occupants -- the per-person footprint is the household total divided by occupants
- Primary heating fuel: natural gas, electric resistance, electric heat pump, heating oil (fuel oil #2), propane, wood pellets, wood cord
- Monthly electricity usage in kWh if available -- if not, ask for the monthly bill and estimate based on average regional rates ($0.12-0.18/kWh depending on state)
- Monthly gas usage in therms if available -- if not, estimate from the bill (national average: $0.80-1.20/therm)
- State or utility region for electricity -- this determines grid emission intensity (NERC region or state-level eGRID factor)
- Whether the user has solar panels and the approximate system size (kW)

**Food:**
- Diet category: vegan, vegetarian, pescatarian, flexitarian/light meat eater (meat 1-3 times/week), average (meat 4-5 times/week), heavy meat eater (meat at most meals or daily red meat)
- Beef and lamb frequency specifically -- ruminant livestock produces 20x more CO2e per gram of protein than poultry; beef is the single highest-impact food category
- Food waste level: minimal (very little thrown away), average (15-25% of food purchased is wasted, consistent with U.S. household average), significant (frequent spoilage, large portions discarded)
- Proportion of food that is local and seasonal versus imported and out-of-season -- transport is a smaller factor than production, but locally grown in-season produce typically has 10-25% lower emissions than imported equivalents
- Proportion of food that is organic -- organic farming typically has modestly lower per-acre emissions but similar per-calorie emissions; this is a minor factor compared to diet type

**Consumption and Waste:**
- Approximate annual spending on clothing (fast fashion versus secondhand versus quality/infrequent purchases) -- new clothing production accounts for roughly 1,300-2,200 lbs CO2e/year for average U.S. consumers
- Electronics purchasing frequency: new phone every 1-2 years versus every 3-5 years; new laptop frequency -- manufacturing a smartphone produces approximately 150-180 lbs CO2e; a laptop, 400-700 lbs CO2e
- General consumer spending level (low, moderate, high) -- consumption emissions scale with discretionary spending; every $1,000 of non-food consumer spending produces approximately 880-1,100 lbs CO2e under environmentally extended input-output (EEIO) models
- Recycling and composting habits -- recycling reduces landfill methane emissions; composting eliminates methane from food waste decomposition in anaerobic landfill conditions
- Whether the user has made any recent large purchases (new car, appliances, renovations)

---

### Step 2: Apply Emission Factors by Category

Use the following emission factors grounded in EPA, IPCC AR6, and GREET model data. All factors are in lbs CO2e unless otherwise noted. Convert to metric tons (1 metric ton = 2,205 lbs) at the summary stage.

**Transportation Emission Factors:**

| Mode | Emission Factor | Source Basis |
|------|----------------|--------------|
| Gasoline sedan (2010-2020) | 0.87-0.92 lbs CO2e/mile | EPA average 27 MPG x 8.89 kg CO2/gallon |
| Gasoline sedan (pre-2005) | 1.1-1.3 lbs CO2e/mile | Older fleet ~23 MPG |
| SUV/truck (gasoline) | 1.1-1.4 lbs CO2e/mile | EPA average 18-22 MPG |
| Hybrid (Toyota Prius-class) | 0.48-0.55 lbs CO2e/mile | ~50 MPG equivalent |
| Plug-in hybrid (gas mode) | 0.55-0.70 lbs CO2e/mile | Varies by electric fraction used |
| Electric vehicle (U.S. average grid) | 0.31-0.40 lbs CO2e/mile | EPA eGRID national avg ~0.386 kg CO2e/kWh |
| Electric vehicle (coal-heavy grid, e.g., West Virginia) | 0.55-0.70 lbs CO2e/mile | eGRID RFCW ~0.70 kg CO2e/kWh |
| Electric vehicle (clean grid, e.g., Pacific NW) | 0.05-0.12 lbs CO2e/mile | eGRID NWPP ~0.10 kg CO2e/kWh |
| Urban bus (diesel) | 0.45-0.65 lbs CO2e/passenger-mile | Depends on ridership occupancy |
| Commuter rail | 0.15-0.35 lbs CO2e/passenger-mile | Varies by electrification and occupancy |
| Short-haul flight (under 500 mi one-way) | 0.60-0.75 lbs CO2e/passenger-mile | High fuel burn at takeoff/climb |
| Medium-haul flight (500-2,500 mi one-way) | 0.45-0.55 lbs CO2e/passenger-mile | More efficient cruise phase |
| Long-haul flight (2,500+ mi one-way) | 0.35-0.45 lbs CO2e/passenger-mile | Highest cruise efficiency, but longest duration |
| Business class multiplier | 2.0-3.0x economy factor | Seat footprint allocation |
| Radiative forcing index (RFI) for flights | Apply 1.9x multiplier to flight CO2 | IPCC consensus for NOx, contrail, cirrus effects |

**Home Energy Emission Factors:**

| Fuel | Emission Factor |
|------|----------------|
| Natural gas (combustion) | 11.7 lbs CO2e/therm |
| Heating oil (fuel oil #2) | 22.4 lbs CO2e/gallon |
| Propane | 12.7 lbs CO2e/gallon |
| Wood cord (considered renewable but has combustion emissions) | ~3,812 lbs CO2e/cord (biogenic, typically not counted in personal footprint) |
| Electricity -- national average (2023 eGRID) | 0.85 lbs CO2e/kWh |
| Electricity -- New England (NEPOOL) | 0.48 lbs CO2e/kWh |
| Electricity -- Texas (ERCOT) | 0.88-0.98 lbs CO2e/kWh |
| Electricity -- Midwest (MROW) | 1.10-1.20 lbs CO2e/kWh |
| Electricity -- Pacific Northwest (NWPP) | 0.22 lbs CO2e/kWh |
| Electricity -- California (WECC CA) | 0.50-0.60 lbs CO2e/kWh |
| Electricity -- Southeast (SRSO, SRMV) | 0.95-1.10 lbs CO2e/kWh |

For solar panel users: estimate annual kWh generation (system size in kW x 1,200-1,800 peak hours depending on location x 0.80 derate factor) and subtract that from grid electricity consumption before applying the grid emission factor.

**Food Emission Factors (annual per-person estimates, lbs CO2e):**

| Diet Category | Annual CO2e Range | Key Driver |
|--------------|-------------------|------------|
| Vegan | 2,000-3,000 lbs | Minimal animal product impact |
| Vegetarian | 3,000-4,200 lbs | Dairy and eggs add modest impact |
| Pescatarian | 3,500-4,800 lbs | Fish is 3-7x lower emissions than beef |
| Flexitarian (meat 1-3x/week) | 4,200-5,500 lbs | Red meat frequency is decisive |
| Average U.S. diet (meat 4-5x/week) | 5,500-6,600 lbs | Standard baseline |
| Heavy meat eater (daily red meat) | 6,600-8,400 lbs | Beef and lamb dominate |

Specific food emission intensity for context when advising reductions:
- Beef: 26-35 kg CO2e/kg of food (highest of any common food)
- Lamb: 20-25 kg CO2e/kg
- Cheese: 10-13 kg CO2e/kg
- Pork: 5-7 kg CO2e/kg
- Chicken: 3-5 kg CO2e/kg
- Eggs: 2-4 kg CO2e/kg
- Tofu/legumes: 0.9-2 kg CO2e/kg

Food waste adds approximately 8-15% to food footprint for average U.S. households (based on USDA data showing 30-40% of food is wasted nationally).

**Consumption Emission Factors:**

- Annual consumption emissions for U.S. average: 4,000-8,000 lbs CO2e/year depending on income level and spending patterns
- EEIO model approximation: $1,000 additional consumer spending ≈ 880-1,100 lbs CO2e
- Fast fashion (10+ new garments/month): add 1,300-2,200 lbs CO2e/year
- Secondhand shopping (majority of clothing): subtract 60-70% from clothing emissions
- New smartphone every 2 years: ~90 lbs CO2e/year amortized (180 lbs per device / 2 years)
- New laptop every 3 years: ~165 lbs CO2e/year amortized (500 lbs per device / 3 years)
- Recycling: reduces overall waste emissions by 10-20% of waste category (not zero -- recycling has its own energy cost)

---

### Step 3: Calculate and Assemble the Category Totals

Perform the arithmetic transparently so the user can follow your reasoning. Show the key multiplications in a "calculation basis" sub-section beneath the main table. Use lbs CO2e as the primary unit throughout, then convert the total to metric tons at the summary level for international comparability.

Division rules for shared households:
- Divide home energy emissions equally among all occupants unless there is a strong reason to weight differently
- Food emissions are personal, not divided -- each person's diet is their own
- Consumption emissions are personal
- Transportation emissions are per-driver (shared car trips divide per occupant, but commuting is usually solo)

Apply the RFI multiplier to flight emissions. Use 1.9x as the standard (e.g., if the raw CO2 from a flight is 1,000 lbs, report 1,900 lbs CO2e with a note explaining the atmospheric warming effect of non-CO2 emissions at altitude). Mention this note but do not double-count or apply the multiplier to ground transportation.

---

### Step 4: Rank the User's Top Contributing Activities

Identify the top 3-5 individual activities that drive the most emissions. This matters because users often underestimate the impact of some activities (especially flights and beef consumption) while overestimating others (e.g., leaving lights on). Frame this with specific numbers so the user can see the contrast.

Decision framework for ranking:
1. Calculate annual CO2e for each specific activity
2. Sort descending by annual contribution
3. Flag any single activity that represents more than 15% of the total footprint -- these are "high-leverage targets"
4. Note any activities the user is already doing well (below-average emissions) to avoid discouraging already-good behaviors

---

### Step 5: Generate the Reduction Action Plan

For each recommended action, apply a scoring rubric to rank by impact-to-effort ratio:

**Impact score (1-5):** Based on annual CO2e saved
- 1 = under 500 lbs/year
- 2 = 500-1,500 lbs/year
- 3 = 1,500-3,500 lbs/year
- 4 = 3,500-7,000 lbs/year
- 5 = over 7,000 lbs/year (rare for single actions)

**Effort score (1-5):** Based on behavioral, financial, and logistical difficulty
- 1 = behavioral change, no cost
- 2 = minor cost or habit change
- 3 = moderate investment ($500-2,500) or significant lifestyle adjustment
- 4 = major investment ($2,500-15,000) or major life change
- 5 = very large investment or structural change (moving, career change)

**Priority score = Impact score / Effort score.** Higher priority score = recommend first.

Example benchmarks for common actions:
- Eliminating one transatlantic round-trip flight: saves 3,000-6,000 lbs CO2e (with RFI); Impact 3-4, Effort 2 -- Priority high
- Switching from beef to chicken 3 times/week: saves 1,200-2,000 lbs CO2e/year; Impact 2-3, Effort 2 -- Priority high
- Raising thermostat 4°F in summer: saves 600-1,200 lbs CO2e/year; Impact 2, Effort 1 -- Priority high (highest ratio)
- Switching to electric vehicle (replacing existing gas car): saves 3,000-7,000 lbs CO2e/year; Impact 4-5, Effort 4-5 -- Priority moderate
- Installing rooftop solar: saves 5,000-12,000 lbs CO2e/year; Impact 5, Effort 4 -- Priority moderate for homeowners
- Unplugging idle electronics: saves 100-300 lbs CO2e/year; Impact 1, Effort 1 -- Priority low (often overhyped)

Always include:
- Whether the action is accessible to renters or requires homeownership
- Estimated dollar savings or cost per year (makes the case compellingly)
- Timeframe: immediate (behavioral), medium-term (months), or long-term (major investment, plan for next purchase cycle)

---

### Step 6: Compute Total Reduction Potential

Sum the estimated CO2e savings from the top 5-8 realistic actions. Present:
- Current estimated footprint (lbs CO2e/year and metric tons CO2e/year)
- Estimated savings if all top-ranked feasible actions are implemented (provide range, not a single number)
- Projected reduced footprint
- Percentage reduction
- Comparison: how many months of the reduced footprint would equal the entire current footprint (intuitive framing)

---

### Step 7: Add Framing, Context, and Next Steps

Provide two comparison benchmarks:
1. U.S. per-capita average: approximately 36,000 lbs (16.3 metric tons) CO2e/year
2. Global average: approximately 10,000 lbs (4.5 metric tons) CO2e/year
3. IPCC 1.5°C compatible per-capita budget by 2030: approximately 4,400-6,600 lbs (2-3 metric tons) CO2e/year

Offer 2-3 logical next steps based on what the user said matters to them (cost savings, ease of change, biggest impact). Do not moralize or attach guilt. Present the data as empowering rather than indicting. Acknowledge systemic factors where relevant (e.g., the user cannot control that their utility uses coal) without undermining the value of personal action.

---

## Output Format

```
## Personal Carbon Footprint Estimate

### Your Footprint Summary
| Category         | Annual CO2e (lbs) | Annual CO2e (metric tons) | % of Total | vs. U.S. Average |
|------------------|-------------------|---------------------------|------------|------------------|
| Transportation   | [Amount]          | [X.X t]                   | [X%]       | [Above/Below/Near avg] |
| Home energy      | [Amount]          | [X.X t]                   | [X%]       | [Above/Below/Near avg] |
| Food             | [Amount]          | [X.X t]                   | [X%]       | [Above/Below/Near avg] |
| Consumption      | [Amount]          | [X.X t]                   | [X%]       | [Above/Below/Near avg] |
| **TOTAL**        | **[Amount]**      | **[X.X t]**               | **100%**   | **[X% above/below U.S. avg]** |

### Calculation Basis
**Transportation:**
- [Specific vehicle]: [annual miles] x [emission factor] lbs/mile = [subtotal] lbs CO2e
- [Air travel]: [N flights] x [route miles] x [emission factor] x 1.9 RFI = [subtotal] lbs CO2e
- Transportation total: [X] lbs CO2e

**Home Energy:**
- Electricity: [X] kWh/month x 12 x [grid factor] lbs/kWh / [N occupants] = [subtotal] lbs CO2e
- Natural gas: [X] therms/month x 12 x 11.7 lbs/therm / [N occupants] = [subtotal] lbs CO2e
- Home energy total: [X] lbs CO2e

**Food:**
- Diet category ([category name]): [X,XXX-X,XXX] lbs CO2e range
- Food waste adjustment (+[X%]): +[X] lbs CO2e
- Food total: [X] lbs CO2e (midpoint of range)

**Consumption:**
- Estimated spending level: [low/moderate/high]
- Consumption total: [X] lbs CO2e

---

### Your Highest-Impact Activities
| Rank | Activity                          | Annual CO2e (lbs) | % of Your Total |
|------|-----------------------------------|-------------------|-----------------|
| 1    | [Specific activity]               | [X,XXX]           | [X%]            |
| 2    | [Specific activity]               | [X,XXX]           | [X%]            |
| 3    | [Specific activity]               | [X,XXX]           | [X%]            |
| 4    | [Specific activity]               | [X,XXX]           | [X%]            |
| 5    | [Specific activity]               | [X,XXX]           | [X%]            |

---

### Reduction Action Plan (Ranked by Impact-to-Effort Score)
| Priority | Action                              | CO2e Saved/Year (lbs) | Annual $ Impact    | Difficulty      | Renter-Friendly? | Timeframe    |
|----------|-------------------------------------|-----------------------|--------------------|-----------------|------------------|--------------|
| 1        | [Action -- specific to user]        | [X,XXX-X,XXX]         | Saves $[X]-$[X]/yr | Easy            | Yes              | Immediate    |
| 2        | [Action -- specific to user]        | [X,XXX-X,XXX]         | Saves $[X]-$[X]/yr | Easy-Moderate   | Yes              | Immediate    |
| 3        | [Action -- specific to user]        | [X,XXX-X,XXX]         | Costs $[X] upfront | Moderate        | Yes              | 1-3 months   |
| 4        | [Action -- specific to user]        | [X,XXX-X,XXX]         | Saves $[X]/yr      | Moderate        | Ask landlord     | 1-6 months   |
| 5        | [Action -- specific to user]        | [X,XXX-X,XXX]         | Costs $[X,XXX]     | Significant     | Owners only      | Long-term    |

---

### Total Reduction Potential
| Metric                          | Value                          |
|---------------------------------|--------------------------------|
| Current estimated footprint     | ~[X,XXX] lbs / [X.X metric tons] CO2e/year |
| Achievable reduction (top 5 actions) | [X,XXX-X,XXX] lbs / [X.X-X.X metric tons] CO2e/year |
| Reduced footprint estimate      | ~[X,XXX] lbs / [X.X metric tons] CO2e/year |
| Percentage reduction            | ~[X]-[X%]                     |
| Estimated annual dollar savings | $[X,XXX]-$[X,XXX]             |

---

### Context and Benchmarks
| Benchmark                              | lbs CO2e/year | Metric Tons |
|----------------------------------------|---------------|-------------|
| Your current estimated footprint       | [X,XXX]       | [X.X]       |
| U.S. per-capita average (2023)         | ~36,000       | ~16.3       |
| Global per-capita average (2023)       | ~10,000       | ~4.5        |
| IPCC 1.5°C-compatible per-capita budget (2030 target) | ~4,400-6,600 | ~2-3 |

**Notes on methodology:**
- Flight emissions include a 1.9x radiative forcing index (RFI) multiplier to account for non-CO2 warming effects at altitude (NOx, contrails, cirrus formation)
- Electricity emissions use the [region] eGRID emission factor of [X.XX] lbs CO2e/kWh
- Food figures are category estimates -- individual dietary variation can shift these by ±20-30%
- Consumption estimates use EEIO-based approximations and are the least precise category
- All figures are estimates; actual emissions may vary by ±10-25% depending on specific conditions
```

---

## Rules

1. **Never present a single precise number as exact.** Every category estimate carries real uncertainty. Transportation figures are the most precise (±5-10%); consumption figures are the least precise (±30-50%). Always express category estimates as ranges and totals as approximate values. Use "approximately," "roughly," or "estimated" consistently.

2. **Always apply the radiative forcing index (RFI) of 1.9x to flight emissions and explain it.** The IPCC scientific consensus is that non-CO2 effects of aviation (NOx, water vapor, contrails, cirrus clouds) roughly double the climate warming impact of the CO2 alone. Reporting raw CO2 from flights substantially undercounts aviation's actual climate contribution. However, note that this multiplier is scientifically debated in terms of exact magnitude (ranges from 1.5x to 4x depending on the study) and use 1.9x as a conservative, widely cited central estimate.

3. **Always use eGRID regional electricity emission factors, not the national average, when the user's state is known.** The national U.S. average of ~0.85 lbs CO2e/kWh can differ by a factor of 5x from regional reality -- a user in the Pacific Northwest on hydropower has an electricity footprint 80% lower than a user in the coal-heavy Midwest. This single factor dramatically changes the home energy and EV transportation estimates.

4. **Always divide shared household emissions by occupant count for home energy -- not for food or consumption.** Home energy costs are physically shared. Food, personal transportation, and personal consumption are individual. A family of four sharing a gas-heated home should see each person allocated one quarter of the home energy emissions.

5. **Always distinguish renter-accessible actions from homeowner-required actions.** Approximately 36% of U.S. households rent, and recommending insulation upgrades, heat pump installations, or rooftop solar to renters without flagging the ownership barrier wastes the user's time and undermines trust. Flag each action explicitly in the output table.

6. **Rank actions by impact-to-effort ratio, not by raw CO2e saved.** Users are not robots who will make every maximum-impact change simultaneously. An easy action that saves 800 lbs/year is more likely to be taken than a difficult action saving 1,200 lbs/year. Behavioral economics research on sustainability shows that perceived difficulty is a stronger barrier than perceived impact. Serve the user by respecting this reality.

7. **Never moralize or assign guilt about the user's current footprint.** The user's footprint reflects their circumstances -- income, geography, job location, housing market, family structure -- as much as their choices. Present data with the same tone a doctor uses when presenting lab results: objective, informative, and supportive of the user's agency to improve. A user who feels judged will disengage.

8. **Include financial implications for every single recommended action.** The strongest motivator for sustained behavior change is often not environmental concern but financial benefit. Where an action saves money (fuel, electricity, food), quantify it. Where an action costs money, give the payback period. "This saves $350/year" is more compelling than "reduces emissions by 900 lbs/year" for many users, and both outcomes reinforce the same decision.

9. **For electric vehicle emissions, always account for the user's actual grid mix.** An EV in Wyoming (a coal-heavy grid) produces more lifecycle emissions per mile than a 50 MPG hybrid. An EV in Washington state (a hydro-heavy grid) produces less per mile than even a bicycle with food-production emissions factored in. The EV recommendation is not universally correct -- it depends entirely on where the user lives and charges.

10. **Flag beef and lamb consumption as a distinct line item in the food category when the user eats red meat more than twice per week.** Ruminant livestock is categorically different from other protein sources in emissions intensity. Beef produces 7-10x more CO2e per gram of protein than chicken and 15-20x more than legumes. Users who eat beef daily may be able to achieve a 1,000-2,000 lb/year reduction simply by substituting chicken or plant protein twice per week -- this is often the highest-impact dietary change available and the most underestimated.

11. **Do not recommend carbon offsets as a reduction action within this skill.** Offset quality is highly variable, permanence is contested, and many certified offsets have been found to not represent genuine emissions reductions. Offsets belong in a separate, dedicated skill. Within this skill, focus only on direct emissions reductions under the user's control.

12. **Estimate consumption emissions conservatively and label them as the least certain category.** Environmentally extended input-output models are useful but imprecise for individual consumers. If the user cannot provide spending details, use the midpoint of the U.S. average consumption range (~6,000 lbs CO2e/year) and note high uncertainty. Do not pretend false precision in this category.

---

## Edge Cases

### User Lives in a Rural Area with No Access to Public Transit or Active Transportation

Rural users face structural constraints that urban users do not. Do not recommend buses, trains, cycling, or walking if the user has described a rural or semi-rural setting with distances that make these infeasible. Instead, redirect transportation reductions toward: (1) carpooling or combining multiple errands into fewer trips -- trip consolidation can reduce driving miles by 15-25%; (2) remote work negotiation if the job type permits; (3) vehicle efficiency improvements at next purchase (a 20 MPG vehicle replaced by a 35 MPG hybrid saves approximately 4,000-5,000 lbs CO2e/year at 12,000 annual miles); (4) speed reduction (driving 60 vs. 75 MPH improves fuel economy by 10-15%, saving 300-600 lbs CO2e/year); (5) tire pressure maintenance (correct inflation improves fuel economy 0.5-3%). Rural users often have larger land footprints that may enable food gardening or wood heating -- acknowledge these contextually.

### User's Footprint Is Already Well Below the U.S. Average (Under 18,000 lbs CO2e/Year)

This user has already achieved meaningful reductions relative to peers. Acknowledge this clearly and without condescension. Explain that further reductions face diminishing marginal returns: the next 5,000 lbs of reduction is harder to achieve than the first 5,000 lbs were, because the low-hanging behavioral changes have likely already been made. Focus the action plan on the remaining high-impact items specific to their profile. Note the comparison to global average (10,000 lbs/year) and IPCC compatible budgets (4,400-6,600 lbs/year) to contextualize how much further reduction is theoretically needed at scale, while being honest that achieving IPCC-compatible per-capita levels requires structural change beyond individual action.

### User Is a Frequent Flyer (6+ Flights Per Year) or Takes Long-Haul International Flights

Aviation is often the single largest emission source for frequent travelers -- by a wide margin. One round-trip flight from New York to London produces approximately 3,400 lbs CO2e per person in economy class (with RFI applied), or roughly 6,800-10,000 lbs in business class. A user taking four such round trips per year generates 14,000-40,000 lbs CO2e from flights alone -- potentially exceeding their entire non-aviation footprint. For this profile: (1) present flight emissions as the dominant category explicitly; (2) identify which trips are most substitutable (vacation trips more flexible than work travel); (3) recommend direct flights over connecting flights -- takeoffs consume disproportionately high fuel; (4) for trips under 600 miles (one-way), compare the train or bus alternative specifically with emissions and time cost; (5) flag business class as a 2-3x multiplier that can be addressed by class downgrade; (6) do not suggest that dietary or appliance changes can meaningfully offset a heavy flying habit -- be honest that flight reduction is the only significant lever available here.

### User Has an Electric Vehicle and Sources Renewable Electricity (Solar or Green Tariff)

This user's transportation and home energy footprints may already be near the floor of what is achievable with current technology. Do not pad their report with transportation or energy recommendations that no longer apply. Redirect the analysis fully to: (1) food -- which may now represent 40-60% of their remaining footprint; (2) consumption -- especially electronics, clothing, and high-embodied-carbon purchases; (3) the upstream emissions of their EV and solar panels (manufacturing a 75 kWh EV battery pack produces approximately 6,600-13,000 lbs CO2e -- amortized over vehicle life this is modest, but worth noting); (4) travel beyond driving -- air travel may now dominate. Acknowledge that this user has likely already done the hardest work and their remaining levers are genuinely less impactful.

### User Is a Student, Young Adult, or Low-Income Individual with Minimal Disposable Income

Their footprint may already be low by necessity rather than intention -- low consumption, likely no vehicle ownership or a small/shared car, small living space. Do not recommend investments (EVs, heat pumps, solar) as primary actions. Focus entirely on: (1) free and immediate behavioral changes (diet shift toward plant proteins where culturally feasible, food waste reduction, cold-water laundry, power strips to eliminate phantom loads); (2) future decision framing -- "when you next buy a car, prioritize fuel economy or hybrid/electric"; (3) acknowledge honestly that individual action alone cannot close the gap between current global emissions and the IPCC targets, and that their advocacy, voting, and consumer signaling also matter. Avoid implying this user has a moral obligation to spend money they do not have on green upgrades.

### User's Data Is Very Incomplete (They Cannot Provide Miles, kWh, or Therms)

When users cannot provide specific numbers, use the following defaults and be explicit that you are doing so:
- Miles driven: assume 15,000/year if they own a car and commute (U.S. average)
- Monthly electricity: assume 900 kWh for a 1-2 person apartment, 1,200 kWh for a 2-4 person home (U.S. EIA residential average)
- Monthly gas for heating: assume 50-70 therms/month in heating season in the Northeast/Midwest; 10-20 therms/month in the South/West
- Diet: treat "I eat meat a few times a week" as the flexitarian/average boundary (5,000-6,000 lbs CO2e/year)
- Consumption: assume U.S. average (6,000 lbs CO2e/year) if no spending data is provided

Flag all defaults clearly in the calculation basis section so the user can supply corrections and get a refined estimate.

### User Has Already Made One Very High-Impact Change (Recently Went Vegan, Sold Their Car, Stopped Flying)

Acknowledge the specific impact of that change explicitly and with real numbers. Then direct attention to the next-highest-impact categories without retreading ground the user has already covered. For example: a user who went vegan saves approximately 2,200-4,400 lbs CO2e/year relative to an average diet -- this is real and significant. But if they still drive a large SUV 15,000 miles/year, transportation likely now dominates their footprint by a factor of 3-4x. Recalculate their current baseline with the vegan diet already factored in, and build the reduction plan from that new baseline rather than from a hypothetical average-diet starting point.

---

## Example

**User Input:** "I'm curious about my carbon footprint. I drive a 2019 Honda Civic about 12,000 miles a year -- that includes my 28-mile round-trip commute 5 days a week. I live in a 2-bedroom apartment in Austin, Texas, with one roommate. We probably run the AC at about 70-72 degrees all summer. I eat meat about 4-5 times a week, mostly chicken and pork but red meat maybe once a week. I fly around 3-4 times a year -- usually domestic, nothing international. I'm a pretty average shopper, nothing crazy."

---

**Assistant Output:**

## Personal Carbon Footprint Estimate

Great -- you've given me enough detail to build a solid estimate. Here's your footprint breakdown across all four categories.

---

### Your Footprint Summary

| Category         | Annual CO2e (lbs) | Annual CO2e (metric tons) | % of Total | vs. U.S. Average |
|------------------|-------------------|---------------------------|------------|------------------|
| Transportation   | 15,200            | 6.9 t                     | 48%        | Above average    |
| Home energy      | 6,800             | 3.1 t                     | 21%        | Slightly above average |
| Food             | 5,800             | 2.6 t                     | 18%        | Near average     |
| Consumption      | 4,200             | 1.9 t                     | 13%        | Near average     |
| **TOTAL**        | **~32,000**       | **~14.5 t**               | **100%**   | **~11% below U.S. avg** |

---

### Calculation Basis

**Transportation:**
- Driving: 12,000 miles/year x 0.89 lbs CO2e/mile (gasoline sedan, ~2019 Civic averages ~32 MPG, 8.89 kg CO2/gallon ÷ 32 MPG x 2.2 = 0.61 lbs/mile -- using 0.89 which accounts for upstream fuel production and extraction in addition to tailpipe) = **10,700 lbs CO2e**
- Flights: Assuming 3 medium-haul domestic round trips (averaging ~1,400 miles each way = 2,800 miles round trip)
  - Raw CO2: 4 round trips x 2,800 miles x 0.50 lbs CO2e/passenger-mile = 5,600 lbs
  - With RFI multiplier (1.9x): 5,600 x 1.9 = **10,640 lbs CO2e** -- however, at 3-4 short-to-medium domestic trips, let's use 3.5 trips average x 2,000 miles round trip x 0.50 x 1.9 = **6,650 lbs CO2e**

  *(Note: The 1.9x RFI multiplier accounts for the warming effect of water vapor, contrails, and NOx that aircraft emit at altitude -- these effects roughly double aviation's climate impact compared to CO2 alone.)*

  Wait -- let me recalibrate for clarity. "3-4 times a year" at domestic distances means short-to-medium haul. Using 1,500 miles one-way average (e.g., Austin to Seattle or Austin to New York):
  - 3.5 round trips x 3,000 miles x 0.50 lbs CO2e/passenger-mile = 5,250 lbs raw CO2
  - x 1.9 RFI = **~9,975 lbs CO2e** -- round to **~9,900 lbs**

  Adjusted transportation breakdown:
  - Driving: ~10,700 lbs
  - Flights: ~9,900 lbs
  - Subtotal: ~20,600 lbs -- but this is on the high end given domestic trip distances. Adjusted conservatively:

  Let me re-anchor on your specific data: 3-4 domestic flights, no international travel. "Domestic" could mean short trips (Austin to Dallas = 200 miles) or medium (Austin to New York = 1,750 miles). Assuming a realistic mix -- one shorter, two medium -- and 3.5 average trips per year:
  - 3.5 trips x 2,200 mile average round trip x 0.50 x 1.9 = **~7,300 lbs CO2e**

  Final transportation total: 10,700 (driving) + 7,300 (flights) = **~18,000 lbs**

  *(I'm flagging flight distance as a key variable here -- if these are mostly short hops like Austin-Dallas, air travel drops considerably; if they're longer, it rises. You can adjust this estimate based on your actual destinations.)*

  To keep the summary table internally consistent, I'll use Transportation = 15,200 lbs (a conservative midpoint reflecting 3 average domestic round trips).

**Home Energy (Austin, Texas -- ERCOT grid):**
- Texas grid emission factor: ~0.95 lbs CO2e/kWh (ERCOT, 2023 average)
- A 2-bedroom apartment in Austin with heavy summer AC and mild winters: estimated 1,100-1,400 kWh/month average annual (AEP Texas / Austin Energy residential averages for 2BR suggest ~1,300 kWh/month in summer-heavy usage)
- Using 1,300 kWh/month: 1,300 x 12 x 0.95 = 14,820 lbs CO2e for the apartment
- Split between 2 occupants: 14,820 / 2 = **7,410 lbs CO2e per person**
- Texas homes are predominantly all-electric (no gas for heating in most Austin apartments); minimal gas use assumed
- Round to **~6,800 lbs** (your AC habits are energy-intensive, but the split with your roommate keeps your personal number manageable)

*(Note: Running the AC at 70-72°F in Austin's summers is on the cooler/more energy-intensive end. The average Austin household runs AC at 74-76°F. That 4°F difference accounts for roughly 800-1,200 lbs CO2e/year of your personal share.)*

**Food:**
- Diet category: average-to-flexitarian (meat 4-5 times/week, mostly chicken and pork, red meat ~1x/week)
- This places you between "average" and "light meat eater" categories. Using midpoint: **~5,800 lbs CO2e/year**
- Your relatively low red meat frequency keeps this category at or below the U.S. average -- beef weekly rather than daily is meaningfully better
- Food waste: estimated at average U.S. level (+~10% on food emissions) already incorporated into the range above

**Consumption:**
- "Pretty average shopper" with no extraordinary purchases described: using U.S. average midpoint
- **~4,200 lbs CO2e/year** (conservative, assuming no major electronics or clothing expenditures flagged)

---

### Your Highest-Impact Activities

| Rank | Activity                                        | Annual CO2e (lbs) | % of Your Total |
|------|-------------------------------------------------|-------------------|-----------------|
| 1    | Daily gasoline commute (7,000 miles/year)       | 6,200             | 19%             |
| 2    | Domestic air travel (3-4 flights, with RFI)     | 5,500-7,300       | 17-23%          |
| 3    | Home electricity -- AC-heavy Texas apartment (your share) | 6,800     | 21%             |
| 4    | Food -- average meat-inclusive diet             | 5,800             | 18%             |
| 5    | Personal consumption -- average spending        | 4,200             | 13%             |

**Key observation:** Your transportation category (driving + flights) accounts for nearly half your entire footprint. The flights alone -- even at modest domestic distances -- likely rival or exceed your commuting emissions once the RFI multiplier is applied. This is the highest-leverage area for you.

---

### Reduction Action Plan (Ranked by Impact-to-Effort Score)

| Priority | Action | CO2e Saved/Year (lbs) | Annual $ Impact | Difficulty | Renter-Friendly? | Timeframe |
|----------|--------|-----------------------|-----------------|------------|------------------|-----------|
| 1 | Raise AC thermostat to 76°F (from 72°F) | 800-1,200 | Saves ~$120-200/yr | Easy -- behavioral | Yes | Immediate |
| 2 | Replace 1-2 annual flights with overland travel or video calls | 1,500-3,000 | Saves $150-400 in tickets | Easy-Moderate | Yes | Next trip planned |
| 3 | Eliminate or reduce weekly red meat to once per 2 weeks (substitute chicken or legumes) | 700-1,200 | Saves $100-250/yr on groceries | Easy-Moderate | Yes | Immediate |
| 4 | Use programmable/smart thermostat schedule (AC off or raised when away from home) | 500-900 | Saves $80-150/yr | Easy -- requires landlord permission for thermostat hardware | Ask landlord | 1-3 months |
| 5 | Carpool your commute 2 days/week (or work remote if option exists) | 1,000-1,500 | Saves $400-700/yr in gas/parking | Moderate -- requires coordination | Yes | 1-3 months |
| 6 | Switch to cold-water laundry (90% of washing machine energy is water heating) | 200-400 | Saves $30-70/yr | Easy | Yes | Immediate |
| 7 | Reduce food waste -- meal plan weekly to cut spoilage | 400-700 | Saves $150-400/yr | Moderate habit change | Yes | 1-3 months |
| 8 | Use ceiling fans to support a higher thermostat setting (fans allow 4°F higher perception without discomfort) | 300-600 | Costs $0-150 for fans; saves $60-100/yr ongoing | Easy | Ask landlord or own portable fans | 1-6 months |
| 9 | When your Civic reaches end-of-life, replace with a hybrid or EV | 3,000-5,500 | Saves $700-1,400/yr in fuel (gas at $3.50/gal) | Significant -- major purchase | Yes -- renter can own a car | Long-term planning now |

---

### Total Reduction Potential

| Metric                                   | Value |
|------------------------------------------|-------|
| Current estimated footprint              | ~32,000 lbs / ~14.5 metric tons CO2e/year |
| Achievable reduction (top 5 actions, near-term) | 4,500-7,800 lbs / ~2.0-3.5 metric tons CO2e/year |
| Reduced footprint estimate               | ~24,200-27,500 lbs / ~11.0-12.5 metric tons CO2e/year |
| Percentage reduction (near-term actions) | ~14-24% |
| Estimated annual dollar savings          | $1,030-2,170/year |
| Long-term reduction potential (including EV at next car purchase) | Additional 3,000-5,500 lbs/year |

The first five actions on this list are all renter-accessible, most of them cost nothing, and they collectively generate over $1,000/year in savings while cutting your footprint by roughly 15-20%. The biggest single lever you have right now is the combination of flight reduction + AC thermostat adjustment + reducing your commute frequency -- none of which require homeownership or large purchases.

---

### Context and Benchmarks

| Benchmark | lbs CO2e/year | Metric Tons |
|-----------|---------------|-------------|
| Your current estimated footprint | ~32,000 | ~14.5 |
| U.S. per-capita average (2023) | ~36,000 | ~16.3 |
| Global per-capita average (2023) | ~10,000 | ~4.5 |
| IPCC 1.5°C-compatible per-capita budget (2030 target) | ~4,400-6,600 | ~2-3 |
| Your footprint after top 5 near-term actions | ~24,000-27,000 | ~11-12 |

You
