---
name: green-transportation-planner
description: |
  Analyzes personal transportation habits and produces a mode-shift plan with CO2 and cost comparisons by commute type (car vs. transit vs. bike vs. EV vs. carpool). Gathers the user's commute details, location, and constraints to produce a practical transition plan with estimated emissions reduction and financial impact.
  Use when the user asks about reducing transportation emissions, comparing commute options by environmental impact, evaluating transit or cycling vs. driving, or considering an EV transition.
  Do NOT use for daily cycling commute route planning (use cycling-route-planner for recreational routes), fleet management or commercial transportation, urban planning or public transit advocacy, or auto purchase decisions based on non-environmental criteria.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sustainability planning analysis checklist"
  category: "sustainability"
  subcategory: "sustainable-living"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Green Transportation Planner

## When to Use

**Use this skill when:**
- User explicitly asks about reducing their personal transportation carbon footprint or commute emissions
- User wants a side-by-side comparison of driving, transit, cycling, carpooling, or EV options with real CO2e and dollar figures
- User is considering transitioning from solo car commuting to a lower-emission mode and needs a practical plan
- User asks whether buying an EV or switching to transit would have a greater environmental or financial impact
- User has recently changed job location, moved, or gained remote work flexibility and wants to reassess their commute
- User wants to understand how much of their personal carbon footprint comes from transportation (typically 28-32% of the average U.S. adult's footprint)
- User is building a personal sustainability plan and transportation is one component to be addressed

**Do NOT use when:**
- User needs turn-by-turn or route-specific cycling guidance (use `cycling-route-planner`)
- User is managing a fleet of company vehicles, delivery routes, or commercial logistics
- User is asking about urban planning, public transit funding, or transportation policy advocacy
- User wants to buy a car and their primary criteria are safety ratings, cargo space, reliability, or financing -- not environmental impact
- User needs travel logistics for a one-time trip (use travel planning skills)
- User asks only about aviation emissions from flights (a different calculation framework applies)
- User is a transportation professional seeking infrastructure or systems-level analysis

---

## Process

### Step 1 -- Gather the Transportation Profile

Ask the user for the following information before running any calculations. Do not guess at inputs that significantly affect the output. If the user provides partial information, ask targeted follow-up questions.

**Primary commute (highest priority -- daily frequency multiplies impact enormously):**
- One-way distance in miles (if unknown, ask for the city/neighborhood pair and estimate based on typical grid distances)
- Days per week they commute in person (account for existing remote work days)
- Current mode: solo car, carpool, bus, subway/rail, bike, walk, or hybrid of these
- If driving: vehicle type (sedan, SUV, pickup, minivan), fuel type (gasoline, diesel, hybrid, plug-in hybrid, electric), and MPG or annual miles if known
- Typical door-to-door commute time each way (including parking search time, which averages 7-12 minutes in urban cores)
- Parking situation: free employer parking vs. paid parking (note: free parking is a powerful behavioral subsidy for driving -- its presence matters)

**Secondary transportation (captures 30-50% of personal vehicle miles for many users):**
- Typical number of errand trips per week and average errand distance
- School drop-off or childcare pickup logistics (a major constraint that often anchors car dependency)
- Weekend recreational trips, shopping, and social travel patterns
- Any regularly recurring trips beyond the commute (gym, medical appointments, etc.)

**Location and infrastructure context:**
- Urban core, inner suburb, outer suburb, or rural (this single variable determines which modes are even worth evaluating)
- Public transit availability: bus routes within 0.5 miles, subway/light rail within 1 mile, commuter rail within 3 miles
- Bike infrastructure quality: protected lanes, multi-use paths, sharrows only, or no infrastructure
- Weather patterns (extreme heat, heavy snow/ice, or heavy rain months affect mode feasibility)
- Topography: flat terrain vs. significant hills (affects cycling viability and e-bike appeal)

**Personal constraints (non-negotiable factors that remove options from consideration):**
- Physical limitations affecting cycling, walking long distances, or standing on transit
- Childcare logistics that require a car at specific times
- Employer flexibility: remote work availability, flexible start/end times (affects transit window)
- Current transportation budget: can they invest in an e-bike ($800-2,500), monthly transit pass ($50-200), or do they need zero-upfront-cost changes only?

---

### Step 2 -- Calculate the Current Transportation Baseline

Establish the precise current annual emissions and cost before proposing any changes. Credibility of the plan depends on accurate baselines.

**Emission calculation methodology:**

Use the EPA's gram CO2 per mile methodology converted to pounds CO2e. The core formula is:

```
Annual commute emissions (lbs CO2e) = 
  (one-way miles × 2) × commute days/year × emission factor (lbs CO2e per mile)
```

Where commute days/year = days per week × 50 (accounting for ~2 weeks vacation/holidays).

**Emission factors by vehicle and mode:**

| Mode | CO2e lbs/passenger-mile | Key Variables |
|------|------------------------|---------------|
| Gas sedan, 20 MPG | 1.10 lbs | City driving, older vehicles |
| Gas sedan, 25 MPG | 0.89 lbs | Average U.S. sedan (2015-2022) |
| Gas sedan, 32 MPG | 0.70 lbs | Efficient compact (e.g., Corolla, Civic) |
| Gas SUV/crossover, 18 MPG | 1.23 lbs | Midsize SUV (RAV4, CR-V) on gasoline |
| Gas SUV/crossover, 22 MPG | 1.01 lbs | Efficient crossover |
| Gas pickup, 16 MPG | 1.38 lbs | Half-ton truck average |
| Diesel sedan/wagon | 0.82-0.95 lbs | Higher NOx but better CO2/mile |
| Plug-in hybrid (electric mode) | 0.10-0.25 lbs | Depends on grid mix and trip length |
| Plug-in hybrid (gas mode) | 0.60-0.75 lbs | After electric range depleted |
| Hybrid (non-plugin), 45 MPG | 0.49 lbs | Prius-class vehicles |
| Battery EV, U.S. avg. grid | 0.25-0.35 lbs | EPA eGRID national avg. ~0.386 lbs CO2/kWh |
| Battery EV, coal-heavy grid | 0.45-0.55 lbs | Wyoming, West Virginia, Kentucky grids |
| Battery EV, clean grid | 0.08-0.15 lbs | Pacific Northwest, California, New England hydro/wind/solar |
| Municipal bus, avg. occupancy | 0.64 lbs | National Transit Database average |
| Subway/light rail | 0.33 lbs | Varies significantly by city and power source |
| Commuter rail (diesel) | 0.41 lbs | Amtrak/regional diesel rail |
| Commuter rail (electric) | 0.22-0.28 lbs | NJ Transit, MARC, Caltrain type |
| Carpool, 2 occupants (gas sedan, 25 MPG) | 0.45 lbs | Halved per-person vs. solo |
| Carpool, 3 occupants | 0.30 lbs | Further reduction |
| E-bike | 0.03-0.06 lbs | ~100 Wh/mile × grid emissions factor |
| Conventional bicycle | 0.00 lbs direct | Food calories offset negligible at scale |
| Walking | 0.00 lbs | |

**Regional EV grid adjustment is non-optional.** Always ask for or estimate the user's state/region when evaluating EV transitions. An EV in Wyoming running on a coal-heavy grid produces approximately 0.50 lbs CO2e per mile -- similar to a hybrid car. The same EV in Oregon or Vermont produces 0.08-0.12 lbs CO2e per mile -- among the cleanest transportation options available. This can shift the EV recommendation dramatically.

**Annual cost calculation -- total cost of ownership (TCO), not just fuel:**

Fuel-only calculations dramatically understate the real cost of car commuting and produce misleading comparisons. Always use TCO.

| Cost Component | Gas Sedan (25 MPG) | Gas SUV (22 MPG) | Battery EV | Notes |
|---|---|---|---|---|
| Fuel/electricity | $0.10-0.14/mile | $0.12-0.16/mile | $0.03-0.06/mile | At $3.50/gal gas, $0.14/kWh electricity |
| Insurance | $0.06-0.10/mile | $0.08-0.12/mile | $0.07-0.10/mile | Amortized over annual miles |
| Maintenance | $0.04-0.07/mile | $0.05-0.08/mile | $0.02-0.04/mile | EVs save ~$800-1,200/yr on maintenance |
| Depreciation | $0.12-0.20/mile | $0.15-0.25/mile | $0.10-0.18/mile | Largest and most-overlooked cost |
| Parking | $0-0.20+/mile | $0-0.20+/mile | $0-0.20+/mile | Urban parking can exceed fuel cost |
| Registration/taxes | $0.01-0.02/mile | $0.01-0.02/mile | $0.01-0.02/mile | |
| **Total TCO range** | **$0.45-0.65/mile** | **$0.55-0.80/mile** | **$0.30-0.50/mile** | IRS standard mileage rate is $0.67 (2024) |

Use the IRS standard mileage rate of $0.67/mile as a credible, defensible shorthand for total car cost when the user doesn't know their detailed costs. It is slightly conservative but accounts for all components.

---

### Step 3 -- Identify Mode-Shift Opportunities by Distance Threshold

Distance is the single most reliable predictor of which modes are feasible. Apply these thresholds before doing detailed evaluation.

**Commute distance decision matrix:**

| One-way distance | Best mode-shift candidates | Modes to exclude | Key consideration |
|---|---|---|---|
| 0-2 miles | Walk, conventional bike, e-bike | Transit (unless route is direct), car | This is the "car trip replacement" sweet spot -- most walkable errands also fall here |
| 2-5 miles | Conventional bike (flat terrain), e-bike, walk (ambitious) | Car (if bike infrastructure exists) | 5 miles by bike takes ~20-25 min at 12-15 mph -- often faster than driving + parking |
| 5-10 miles | E-bike (strong candidate), conventional bike (fit cyclists), transit if direct route | Walk | E-bike covers this in 25-40 min; transit depends on route directness |
| 10-20 miles | E-bike to transit hub + transit, carpool, transit (if direct), hybrid/EV | Conventional bike for most users | Multimodal combos (bike to train) often outperform pure transit in speed |
| 20-35 miles | Commuter rail/express bus, carpool, remote work, EV | Cycling (full distance), local bus | Rail is the key infrastructure question at this range |
| 35-60 miles | Remote work (highest impact), carpool, EV transition | Transit (often not direct), cycling | Even 1-2 remote days/week cuts emissions 20-40% |
| 60+ miles | Remote work, relocation consideration, carpool with ride-sharing app | Almost all active modes | At this range, the job location itself is the primary variable |

**Trip purpose affects mode-shift potential differently:**
- Commute trips: highest leverage because of daily repetition (260 days/year)
- School pickup: schedule-constrained, often anchors car use for the whole day
- Grocery shopping: cargo capacity needed; e-bike cargo bikes or weekly grocery delivery can substitute
- Medical/childcare appointments: car-dependent for many; do not force transit recommendations here
- Recreational trips: high voluntary flexibility; easiest place to shift to cycling or walking

---

### Step 4 -- Evaluate Transit Feasibility Rigorously

Transit recommendations fail in practice if they ignore the "last mile" problem and schedule matching. Do not recommend transit without working through this checklist.

**Transit feasibility checklist:**
- Is there a stop within 0.5 miles of the user's home (for bus) or 2 miles (for rail with parking or bike access)?
- Is there a stop within 0.5 miles of the user's workplace, or is there a practical last-mile connection?
- Does the transit schedule match the user's work start and end times? (Transit gaps before 6am or after 7pm are common and exclude shift workers)
- Is the transit trip time within 1.5x the driving time? Research shows that most commuters abandon transit if it takes more than 1.5x their car commute -- this is a practical, research-backed threshold
- Are transfers required? Each transfer adds approximately 10-15 minutes and significantly increases no-show risk
- Is transit available for return trips at the user's typical departure time? (Last trains are a practical barrier)
- What is the realistic monthly cost? (Day pass vs. monthly pass breakeven is typically 18-20 days)

**Monthly transit pass cost ranges by city type:**
| System type | Monthly cost range | Daily pass breakeven |
|---|---|---|
| Urban subway/metro (major cities) | $90-$132 | 18-20 working days |
| Light rail/bus rapid transit | $65-$110 | 15-18 working days |
| Commuter rail (regional) | $130-$350 | Distance-based; check actual fare |
| Standard city bus network | $50-$100 | 15-18 working days |

---

### Step 5 -- Evaluate E-Bike and Cycling Feasibility

E-bikes are the most underutilized high-impact option for suburban commuters. Evaluate them carefully before dismissing them.

**E-bike viability checklist:**
- Distance under 15 miles one-way (most e-bikes have 20-60 mile range; 15 miles allows buffer and accounts for hills)
- Terrain: flat to moderate hills. E-bikes with mid-drive motors handle 10-15% grades comfortably; hub-drive motors struggle above 8%
- Bike infrastructure: protected lanes or low-traffic streets for at least 70% of the route. Sharrows-only or highway-adjacent roads are not safe for regular commuting
- Weather: assess the number of rain days per year -- 70-80% of days are bikeable in most U.S. regions even without extreme weather accommodation
- Storage and shower: does the employer have secure bike parking (critical -- theft is the #1 reason people stop bike commuting) and shower/changing access for rides over 8 miles?
- Physical ability: e-bikes with pedal assist reduce exertion to a level most healthy adults can sustain daily. However, do not recommend for users with specific lower-body limitations
- E-bike cost amortization: a $1,500 e-bike ridden 5 days/week for 5 years costs approximately $0.06/mile amortized (excluding maintenance ~$150/year and charging ~$20/year)
- Speed comparison: e-bikes average 15-18 mph on mixed terrain. A 10-mile commute takes 35-40 minutes -- often comparable to or faster than driving + parking in urban/inner-suburban settings

**Conventional bike threshold:** Recommend conventional cycling only for distances under 8 miles on flat terrain, or for users who self-identify as regular cyclists. For casual users, e-bikes remove the two biggest barriers (hills and sweat) and have much better adoption rates.

---

### Step 6 -- Evaluate Remote Work as a Transportation Intervention

Remote work is systematically underused as a transportation emissions reduction strategy, yet it is the highest-impact, zero-cost option for eligible workers.

**Remote work emission equivalency:**
- 1 remote day per week = 20% reduction in commute emissions and cost with zero behavior change on the other 4 days
- 2 remote days per week = 40% reduction
- Full remote = 100% commute emission reduction (offset slightly by increased home energy use, typically 10-20 lbs CO2e/day net -- still a net gain)

**Remote work eligibility screening questions:**
- Does the employer formally offer remote work (full or partial)?
- Has the user actually activated existing remote work benefits? (Many workers have untapped remote allowances)
- Are there meeting-heavy days that should remain in-office? (If so, anchor remote days to low-meeting days for maximum practical success)
- For partial remote transitions: Wednesday remote days reduce peak-traffic commutes and have shown highest employer acceptance in workplace research

---

### Step 7 -- Build the Mode-Shift Plan and Calculate Net Impact

Synthesize all feasibility evaluations into a concrete, numbered plan. Structure it as a portfolio of shifts -- not a single replacement -- because real-world commuting is rarely all-or-nothing.

**Plan construction principles:**
- Prioritize shifts by the product of: (emission reduction per trip) × (trips per year). Remote work and commute mode shifts beat errand changes because of frequency
- Show a realistic weekly schedule with each day accounted for
- Calculate per-shift impact before rolling up totals, so the user can see which changes matter most
- Include a payback period for any capital investment (e-bike, transit pass deposit)
- Flag one "long-term" action tied to the next vehicle purchase -- this is a high-stakes, multi-year decision that should be framed but not rushed

**Net impact formula:**
```
Current annual emissions = sum of all trip categories (commute + errands + other)
Proposed annual emissions = recalculated using new mode mix
Net reduction (lbs CO2e/yr) = Current - Proposed
Reduction percentage = (Net reduction / Current) × 100

For context: the average U.S. car produces approximately 4.6 metric tons (10,100 lbs) 
CO2e per year. Eliminating one car trip pattern can approach or exceed 
the full-year emissions of a second car for many households.
```

**Cost payback calculation for capital investments:**
```
E-bike payback period (months) = 
  E-bike purchase price / (Monthly car cost savings from replaced trips)

Example: $1,500 e-bike replacing 3 driving days/week at $0.67/mile × 20 miles/day:
Monthly savings = 3 days × 4.3 weeks × 20 miles × $0.67 = $173/month
Payback = $1,500 / $173 = ~8.7 months
```

---

### Step 8 -- Create a Phased Transition Timeline

Mode shifts fail when they require simultaneous behavior changes. Structure the timeline so each phase builds on the last.

**Phase framework:**
- **Immediate (this week):** Zero-cost, no-infrastructure changes only. Activate unused remote work days. Consolidate errand trips. Adjust departure time to reduce stop-and-go driving (improves MPG by 5-15%)
- **Trial phase (weeks 2-4):** Test the highest-impact mode shift 1-2 times before committing. Buy a day pass before a monthly transit pass. Try the bike commute on a low-stakes day. Assess actual travel time vs. estimate
- **Establish phase (month 1-3):** Commit to the new schedule. Purchase monthly transit pass or e-bike if trial validated the route. Build the new mode into a weekly habit
- **Optimize phase (month 3-6):** Evaluate actual emissions and cost against projections. Adjust schedule based on real-world experience. Address friction points (e.g., buy a good rain jacket to remove weather as a cycling barrier)
- **Long-term decision (next vehicle purchase):** Frame the EV or downsizing decision with updated data. If commute has shifted significantly, the user may need a smaller or less powerful vehicle -- or may be able to eliminate a second car entirely

---

## Output Format

Produce this output structure for every green transportation plan. Fill in all fields with real calculated values -- no placeholder brackets should remain in the delivered output.

```
## Your Green Transportation Plan

### Current Transportation Profile
| Parameter | Value |
|---|---|
| Primary commute | [X miles each way, X days/week in person, by {mode}] |
| Vehicle | [{Year Make Model}, {fuel type}, {MPG or kWh/100mi}] |
| Annual commute miles | [X,XXX miles ({formula: one-way × 2 × commute days/yr})] |
| Annual commute emissions | [X,XXX lbs CO2e ({emission factor} lbs/mile × annual miles)] |
| Annual all-trip emissions | [X,XXX lbs CO2e (commute + errands + other)] |
| Annual transportation cost (TCO) | $[X,XXX - X,XXX (fuel + insurance + maintenance + depreciation + parking)] |
| Remote work days currently used | [X of X available] |

---

### Mode Comparison for Your Commute
| Mode | CO2e per round trip | Cost per round trip | Door-to-door time | Feasible? | Key constraint or enabler |
|---|---|---|---|---|---|
| Current ({vehicle}) | X lbs | $X.XX | X min | Current baseline | |
| Commuter rail | X lbs | $X.XX | X min | Yes / No | [Nearest station distance; schedule fit] |
| Local bus | X lbs | $X.XX | X min | Yes / No | [Route directness; transfer count] |
| E-bike | X lbs | $X.XX | X min | Yes / No | [Infrastructure; distance; storage] |
| Conventional bike | X lbs | $X.XX | X min | Yes / No | [Distance; terrain; infrastructure] |
| Carpool (2 occupants) | X lbs | $X.XX | X min | Yes / No | [Partner availability] |
| Remote work | 0 lbs | $0.00 | 0 min | Yes / No | [Employer policy] |
| EV (at next purchase) | X lbs | $X.XX | X min | Long-term | [Grid mix; upfront cost] |

---

### Recommended Mode-Shift Plan

**Priority ranking (highest emission reduction first):**

| Rank | Shift | From → To | Days/week | CO2e saved/year | Annual cost impact |
|---|---|---|---|---|---|
| 1 | [Specific shift] | [Mode A → Mode B] | X days | X,XXX lbs | Saves/Costs $X,XXX |
| 2 | [Specific shift] | [Mode A → Mode B] | X days | XXX lbs | Saves/Costs $XXX |
| 3 | [Specific shift] | [Mode A → Mode B] | X days | XXX lbs | Saves/Costs $XXX |

**Proposed weekly schedule:**
| Day | Mode | Emissions | Cost | Notes |
|---|---|---|---|---|
| Monday | [Mode] | X lbs | $X.XX | |
| Tuesday | [Mode] | X lbs | $X.XX | |
| Wednesday | [Mode] | X lbs | $X.XX | |
| Thursday | [Mode] | X lbs | $X.XX | |
| Friday | [Mode] | X lbs | $X.XX | |

---

### Total Annual Impact Summary
| Metric | Current | After Full Plan | Change |
|---|---|---|---|
| Annual commute emissions | X,XXX lbs CO2e | X,XXX lbs CO2e | --X,XXX lbs (--XX%) |
| Annual all-trip emissions | X,XXX lbs CO2e | X,XXX lbs CO2e | --X,XXX lbs (--XX%) |
| Annual transportation cost | $X,XXX | $X,XXX | Saves/Costs $X,XXX/yr |
| Annual commute miles driven | X,XXX | X,XXX | --X,XXX miles |
| Equivalent to | | | [Contextual comparison -- e.g., "removing one passenger car from the road for X months"] |

---

### Capital Investment Summary (if applicable)
| Investment | Cost | Monthly savings | Payback period |
|---|---|---|---|
| [E-bike / transit pass / etc.] | $X,XXX | $XXX | X months |

---

### Transition Timeline
| Phase | Action | Owner | Target |
|---|---|---|---|
| This week | [Specific zero-cost action] | User | Immediate |
| Week 2 | [Trial action] | User | [Date] |
| Month 1 | [Commit action] | User | [Date] |
| Month 3 | [Optimize action] | User | [Date] |
| Long-term | [Vehicle or infrastructure decision] | User | [At next purchase / renewal] |

---

### Context and Caveats
[2-4 sentences explaining any significant assumptions, what would change the recommendations, 
and what to monitor over time -- e.g., grid mix improvements, fare changes, employer policy changes]
```

---

## Rules

1. **Never skip the baseline calculation.** A recommendation without a quantified current-state baseline is advice, not a plan. Users need to see what they are comparing against -- and the gap has to be real, not gestural.

2. **Never recommend transit without completing the transit feasibility checklist in Step 4.** Station proximity, schedule fit, transfer count, and trip time ratio must all be assessed. A transit recommendation that fails in week two because the last train leaves before the user's shift ends destroys trust.

3. **EV emissions must always be calculated with regional grid mix.** Never use "EVs are zero emission" framing. An EV in a coal-heavy grid region (Kentucky, Wyoming, West Virginia) produces 0.45-0.55 lbs CO2e/mile -- comparable to a hybrid. EV recommendations in those regions should emphasize the trajectory of grid decarbonization as a secondary long-term benefit, but should not overstate the immediate gain.

4. **Always use total cost of ownership (TCO), not fuel cost alone.** Comparing transit ($90/month) against gas ($150/month) while ignoring that the car also costs $250/month in insurance and $300/month in depreciation produces a false comparison. The IRS mileage rate ($0.67/mile in 2024) is the defensible shorthand for all-in car cost when detailed inputs are unavailable.

5. **Partial mode shifts are a primary outcome, not a fallback.** Most users cannot or should not abandon car use entirely. A plan that reduces driving from 5 days/week to 2 days/week while maintaining car ownership for the other 3 is a legitimate, high-impact outcome. Never frame partial shifts as failure.

6. **Free employer parking is a behavioral barrier to transit -- acknowledge it explicitly.** When a user has free parking at work, the perceived cost of driving is artificially low. Name this explicitly: "Free parking masks the true cost of driving. Even with free parking, your full cost of driving is approximately $X per day, which is why transit or remote work still saves money."

7. **Remote work eligibility must be confirmed before building it into the plan.** Workers sometimes assume they cannot use existing remote work benefits. Ask whether the benefit exists AND whether the user has actually used it. Untapped remote work benefits are the single most commonly missed high-impact opportunity.

8. **Cycling and e-bike recommendations must pass a route safety check.** If the user has not assessed their route, recommend they evaluate it on Google Street View or similar before committing. A commute route that requires significant stretches on 55-mph roads without shoulders is not a realistic cycling recommendation, regardless of distance.

9. **Errand consolidation applies to every user who drives.** Combining 4 separate errand trips into one efficient weekly errand trip reduces errand miles by 40-60% for typical suburban households. This is achievable with zero infrastructure and zero cost. Always include it.

10. **Do not recommend eliminating a car for users with legitimate structural dependencies.** Childcare pickup logistics, rural locations with no transit, disability or physical limitation, or shift work schedules that fall outside transit operating hours all represent real constraints. The plan must work within the user's actual life, not a theoretical one. Acknowledge the constraint, do not try to argue around it.

11. **Always provide an emissions equivalency context figure.** "Saving 5,500 lbs CO2e per year" is abstract. Convert it: that equals removing a passenger car from the road for approximately 6 months, or the carbon sequestered by approximately 40 trees over a year (one mature tree sequesters roughly 48 lbs CO2/year). Context makes the numbers motivating.

12. **Plug-in hybrid users require a special calculation.** A PHEV driven mostly within its electric range (typically 20-50 miles) produces emissions close to a full EV. A PHEV driven primarily beyond its electric range on gasoline produces emissions closer to a standard hybrid. Ask the user how often they charge and what their typical daily miles are relative to their EV range before calculating.

---

## Edge Cases

### User Lives in a Rural Area with No Transit and Long Distances
Do not recommend transit or cycling -- forcing these recommendations onto a rural user immediately signals that the plan is not credible. Focus instead on:
- **Vehicle efficiency:** The vehicle itself is the primary emissions lever. Upgrading from a 16 MPG truck to a 25 MPG sedan at next purchase cuts per-mile emissions by 36%. An EV transition is viable in rural areas if home charging is possible -- rural EV adoption is often higher than expected because home charging eliminates range anxiety for in-town driving.
- **Trip consolidation:** Rural households often make multiple short, inefficient trips to town. Consolidating weekly errands can reduce annual driving by 15-25%.
- **Speed and driving behavior:** Rural highway driving at 65 mph vs. 75 mph reduces fuel consumption by approximately 14%. Cruise control on open roads reduces fuel use by 7-14% versus variable throttle.
- **Carpooling with neighbors:** Rural commute carpooling has a higher per-trip impact than urban carpooling because the distances are longer.
- **Remote work:** If available, even 1 remote day per week has a larger absolute emissions impact in rural areas because the commute distance is typically longer.

### User Already Drives a Battery Electric Vehicle
The user's per-mile driving emissions are already 60-90% below a comparable gas vehicle. Reframe the conversation:
- **Remaining impact levers are trip reduction, not mode substitution.** Focus on remote work, errand consolidation, and replacing short EV trips with walking or cycling (which have effectively zero emissions vs. the EV's small grid footprint).
- **Charging optimization:** Encourage charging during off-peak hours (typically 10pm-6am) when many grids have a higher share of baseload or renewable power. In some regions, utilities offer time-of-use rates that make off-peak charging 30-50% cheaper.
- **Embodied carbon acknowledgment:** The manufacturing of a large-battery EV generates 8-15 metric tons CO2e in production -- roughly 1.5-2 years of avoided tailpipe emissions for a typical commuter. This does not make EVs a bad choice, but it means lifetime miles matter. High-mileage EV users recoup the manufacturing carbon faster.
- **Encourage the user to share actual grid mix data.** Platforms that show real-time grid carbon intensity allow EV owners to optimize charging timing for minimum emissions.

### User Has a Very Long Commute (50+ Miles Each Way)
At 50+ miles, cycling and most transit are not practical. The analysis centers on three levers:
- **Remote work is the dominant recommendation.** Even 2 remote days per week on a 55-mile commute saves approximately 22,000 miles and 15,000+ lbs CO2e per year -- equivalent to taking a medium-efficiency car off the road entirely for a year. Frame remote work as a relocation of the workplace, not a benefit.
- **Carpool.** At this distance, apps like Waze Carpool, Scoop, or employer-matched rideshare programs have better coverage. A 2-person carpool halves per-person emissions and cost immediately.
- **EV transition.** At high annual mileage, the fuel cost savings from an EV are largest. A 55-mile commute 3 days/week (after 2 remote days) = 16,500 commute miles/year. Gas savings at $3.50/gallon vs. $0.04/mile electricity can exceed $1,500-2,000/year -- making EV TCO strongly favorable.
- **Raise the relocation question carefully.** If the user is open to it, note that the commute distance itself is the primary emissions driver and that housing relocation -- or changing jobs -- is the most impactful long-term option. Frame it as information, not a recommendation, and only raise it if the user seems open to structural changes.

### User Has School-Age Children with Pickup/Dropoff Constraints
Childcare and school logistics often anchor one or more vehicles to the household for specific time windows. Handle this carefully:
- **Identify the specific constraint windows.** A parent who must pick up a child at 3:15pm may still be able to take transit in the morning but needs a car for the return trip. A split-mode commute (transit in, drive back from school) can capture 30-40% of the emissions savings.
- **Do not recommend a car-free lifestyle** for a household with school pickup responsibilities in a non-urban area without safe, nearby school transit.
- **Consider e-cargo bikes** for school dropoff trips under 3 miles in bike-friendly areas -- these are increasingly popular and practical for children old enough not to require car seats.
- **Errand batching around pickup time** is highly applicable. Parents often make separate grocery, errand, and pickup trips that can be consolidated into a single after-school route.

### User Is Considering an EV Purchase and Wants Environmental Validation
This is a focused sub-case. The user wants environmental analysis, not a purchase guide.
- **Calculate the break-even mileage** for manufacturing carbon recovery: a mid-size EV carries approximately 10,000-15,000 lbs CO2e in battery manufacturing emissions. At an average savings of 0.6 lbs CO2e/mile vs. a 25 MPG sedan, the EV breaks even at approximately 17,000-25,000 miles of driving -- roughly 1.5-2.5 years for an average driver.
- **Identify the regional grid trajectory.** Even in coal-heavy grids today, most utility projections show grid carbon intensity declining 2-4% annually through 2035 under current policy. An EV purchased today will have lower emissions every year as the grid cleans up -- a gas car's emissions are locked in at purchase.
- **Distinguish between replacing vs. adding.** An EV that replaces a high-mileage gas car produces large emissions savings. A second EV added to a household that already has an EV is a much smaller marginal gain.
- **Remind the user that driving behavior matters as much as powertrain.** A 50-mile daily EV commute produces more emissions than a 10-mile hybrid commute. Mode shift and trip reduction remain the primary levers.

### User Has Already Made Some Shifts and Wants to Optimize Further
When the user is not starting from zero (they already take transit twice a week, or already have an e-bike), recalibrate:
- **Recalculate the baseline using their current mixed-mode reality,** not their pre-transition state.
- **Identify the next highest-impact marginal shift.** The optimization question is: which remaining car trips have the highest feasibility for mode shift?
- **Check for habit drift.** Users who "started taking transit" often have not fully committed -- ask how many weeks in a row they have stuck with the new mode. Habit formation for commute changes typically requires 60-90 days of consistent behavior.
- **Consider a "car-lite" household analysis.** If mode shifts have dramatically reduced actual driving, evaluate whether the household can shed one vehicle. Eliminating a second car saves $6,000-9,000/year in TCO and prevents approximately 4-8 metric tons CO2e/year from being manufactured and maintained.

### User Asks About Offsetting Transportation Emissions Instead of Reducing Them
Be direct but not dismissive: carbon offsets are a legitimate secondary tool, not a substitute for mode shift.
- **Offsets should supplement, not replace, behavior change.** Explain that the most credible offsets (verified reforestation, avoided deforestation, direct air capture) cost $15-50 per metric ton. Offsetting 10,000 lbs CO2e (4.5 metric tons) would cost approximately $70-225/year -- affordable, but the emissions still occurred.
- **If the user wants to offset as a bridge strategy,** recommend only offsets that are verified by Gold Standard, Verra VCS, or equivalent third-party standards.
- **Always complete the mode-shift analysis first** and present offsetting as the final line item, not the primary recommendation.

---

## Example

**Input:** "I drive a 2019 Ford F-150 to my job in the suburbs -- about 18 miles each way on surface roads. I do this 5 days a week. Gas is expensive and I've been thinking about the environmental side too. My company is pretty traditional and there's no remote work. I've heard there's a commuter rail line nearby but I've never looked into it. I also make several small trips during the week for errands, probably 4-5 separate trips averaging 5 miles each. I have no physical limitations and I live in the Chicago suburbs. Budget is flexible -- I can invest a few thousand if it makes sense."

**Output:**

---

## Your Green Transportation Plan

### Current Transportation Profile
| Parameter | Value |
|---|---|
| Primary commute | 18 miles each way, 5 days/week, solo (Ford F-150 gasoline) |
| Vehicle | 2019 Ford F-150 (gasoline, approximately 18 MPG combined suburban/highway) |
| Annual commute miles | 9,000 miles (36 miles/day × 250 working days) |
| Annual errand miles | 1,500 miles (~5 trips/week × 5 miles avg × 60 weeks-equivalent) |
| Annual total driving miles | ~10,500 miles |
| Annual commute emissions | 12,420 lbs CO2e (1.38 lbs/mile × 9,000 miles) |
| Annual errand emissions | 2,070 lbs CO2e (1.38 lbs/mile × 1,500 miles) |
| **Annual total transportation emissions** | **14,490 lbs CO2e** |
| Annual commute cost (TCO at $0.75/mile -- F-150 runs higher than average) | ~$6,750 |
| Annual errand cost | ~$1,125 |
| **Annual total transportation cost** | **~$7,875** |

*Note: The Ford F-150 has a higher-than-average TCO due to fuel (18 MPG at $3.50/gal = $0.19/mile fuel alone), insurance (pickups average $1,600-2,000/year), and depreciation (~$3,500-5,000/year on a late-model F-150). The $0.75/mile TCO estimate is conservative.*

---

### Transit Feasibility Assessment -- Chicago Suburbs

The Chicago Metra commuter rail network has 11 lines serving the suburbs. Based on a Chicago suburban location with an 18-mile commute, a Metra station is very likely within 2-4 miles of your home and within 1-2 miles of your office district, given the density of Metra service in Cook, DuPage, and Lake counties.

**Transit feasibility checklist for this scenario:**
- Station within practical distance: **Likely yes** -- confirm the specific line (BNSF, UP-W, UP-N, etc.)
- Schedule coverage: Metra peak service runs 5:30am-9:00am inbound and 3:30pm-7:30pm outbound -- covers most traditional office schedules
- Trip time estimate: 18-mile Metra trip with suburban station access typically takes 35-55 minutes door-to-door including walking/biking to station
- Transfer count: Metra typically operates as a direct express -- usually 0-1 transfers
- Monthly pass: Metra zone fares for 18-mile commutes typically fall in the Zone D-E range: **$130-175/month**
- Trip time ratio: If driving takes 30-40 minutes (18 miles on surface roads with lights), Metra at 45-55 minutes is within the 1.5x threshold -- **feasible**

---

### Mode Comparison for Your 18-Mile Commute

| Mode | CO2e per round trip | Cost per round trip | Door-to-door time | Feasible? | Key factor |
|---|---|---|---|---|---|
| Current (F-150, solo) | 49.7 lbs | $27.00 | ~40 min | Current baseline | High emissions, highest cost |
| Metra commuter rail | 14.8 lbs | $11.00-14.00 | ~50-60 min | **Yes** | Station access key variable |
| E-bike to Metra + train | 14.9 lbs | $12.00-15.00 | ~50-60 min | **Yes** | 3-5 miles to station is ideal e-bike range |
| E-bike (full commute) | 0.5 lbs | $1.00 | ~70-85 min | Conditional | 18 miles is at the upper e-bike range; route safety is the key question |
| Carpool (2 occupants, F-150) | 24.9 lbs | $13.50 | ~40 min | Possible | Need a commute partner |
| Bus | 23.0 lbs | $5.00-8.00 | ~75-100 min | Unlikely | Suburban bus in Chicago suburbs is typically slow and infrequent |
| Remote work | 0 lbs | $0 | 0 min | No | Employer policy prohibits it |
| EV (long-term, at purchase) | 7.2 lbs | $8.00-11.00 | ~40 min | Long-term | Illinois grid: ~0.40 lbs CO2e/kWh; EV = 0.40 lbs CO2e/mile for a full-size truck equivalent |

*Illinois grid emissions factor: approximately 0.39 lbs CO2e/kWh (Illinois has significant nuclear power, moderating EV emissions well below the national coal-heavy average).*

---

### Recommended Mode-Shift Plan

**Your three highest-impact moves, in priority order:**

**Move 1: Shift 4 of 5 commute days to Metra -- keep the truck for 1 day per week**

Metra is by far your biggest lever. It eliminates 49.7 lbs CO2e per round trip on every day you use it. Keeping the truck for one day per week accommodates any day that requires hauling, flexibility, or early/late meetings outside Metra hours.

**Move 2: Consolidate 4-5 errand trips into 1-2 trips per week**

Your 4-5 separate errand trips are short (5 miles average) but frequent. Consolidating them into one weekly errand run plus one mid-week top-up run reduces errand miles by approximately 50-60%, saving roughly 750-900 miles and 1,000-1,200 lbs CO2e per year at zero cost.

**Move 3: E-bike for the station commute (or short errands)**

An e-bike for the 3-5 miles between your home and the Metra station eliminates station parking costs ($2-6/day at most Metra stations) and adds the station-to-station flexibility that makes Metra more practical in bad weather. Alternatively, the e-bike can replace some of the consolidated errand runs.

---

| Rank | Shift | From → To | Days/week | CO2e saved/year | Annual cost impact |
|---|---|---|---|---|---|
| 1 | Commute via Metra | F-150 solo → Metra (4 days) | 4 days | 8,900 lbs | **Saves $3,500-4,500** |
| 2 | Errand consolidation | 5 separate trips → 2 consolidated | ongoing | 1,000-1,200 lbs | **Saves $550-750** |
| 3 | E-bike for station access | Drive to station → E-bike | 4 days | ~75 lbs (minor) | **Saves $480-1,200/yr in station parking** |
| **Total** | | | | **~10,000-10,200 lbs** | **Saves ~$4,500-6,500/yr** |

---

**Proposed weekly schedule:**
| Day | Mode | Round-trip emissions | Round-trip cost | Notes |
|---|---|---|---|---|
| Monday | Metra | 14.8 lbs | $12-14 | Verify Metra line and schedule this week |
| Tuesday | Metra | 14.8 lbs | $12-14 | |
| Wednesday | Metra | 14.8 lbs | $12-14 | Best day to handle any week's errands on return trip if station is near shops |
| Thursday | Metra | 14.8 lbs | $12-14 | |
| Friday | F-150 (drive) | 49.7 lbs | $27 | Keep for flexibility, hauling, non-standard hours |
| **Weekly total** | | **109 lbs** | **~$75-83** | vs. 248 lbs and $135 currently |

---

### Total Annual Impact Summary

| Metric | Current | After Full Plan | Change |
|---|---|---|---|
| Annual commute emissions | 12,420 lbs CO2e | 3,700 lbs CO2e | **--8,720 lbs (--70%)** |
| Annual errand emissions | 2,070 lbs CO2e | 870 lbs CO2e | **--1,200 lbs (--58%)** |
| Annual total emissions | 14,490 lbs CO2e | 4,570 lbs CO2e | **--9,920 lbs (--68%)** |
| Annual transportation cost | ~$7,875 | ~$2,700-3,500 | **Saves $4,375-5,175/yr** |
| Annual miles driven | 10,500 miles | 3,300 miles | --7,200 miles |
| Equivalent to | | | Removing a passenger car from the road for approximately 11 months, or the annual carbon sequestered by ~207 mature trees |

---

### Capital Investment Summary

| Investment | Estimated cost | Monthly savings vs. current | Payback period |
|---|---|---|---|
| Metra monthly pass (Zone D-E) | $150/month ongoing | ~$364/month vs. driving 4 days | Immediate positive cash flow -- no payback period needed |
| E-bike (quality commuter) | $1,400-1,800 upfront | $40-100/month (station parking + occasional errand trips) | 14-37 months |
| **Net first-year financial outcome** | ~$1,600 invested (e-bike) | | **Saves ~$3,300-4,700 in year 1 even after e-bike purchase** |

---

### Transition Timeline

| Phase | Action | Target |
|---|---|---|
| **This week** | Look up your Metra line using the Metra Trip Planner (enter home ZIP and work address). Identify the nearest station and the correct zone fare. Buy a single-ride ticket and do a trial run on a Tuesday or Thursday -- low-stakes days. | Immediate |
| **Week 2** | Ride Metra for the trial day. Note: actual door-to-door time, platform experience, and whether the schedule works for your typical hours. Also map one consolidated errand route that replaces 3-4 separate trips. | Week 2 |
| **Month 1** | If trial confirmed (it almost certainly will), purchase a monthly Metra pass. Commit to 4-day Metra schedule. Stop making separate errand trips -- one weekly consolidated run. | Month 1 |
| **Month 2** | Evaluate whether station parking is costing $2-6/day. If so, research e-bikes in the $1,200-1,800 range (Trek, Specialized, Cannondale, or equivalent commuter e-bikes). Test-ride before purchasing. | Month 2 |
| **Month 3** | If e-bike acquired, establish the station-to-station e-bike routine. Assess: are there any remaining high-frequency trips the e-bike could absorb? | Month 3 |
| **Long-term (next vehicle purchase)** | With only 3,000-3,500 miles/year of actual driving remaining, evaluate whether you need a full-size truck or whether a smaller, more efficient vehicle -- or an EV -- serves your reduced driving needs better. At under 4,000 miles/year of personal driving, leasing a smaller vehicle or joining a car-share program may cost less than owning an F-150. | At next purchase or registration renewal |

---

### Context and Caveats

This plan assumes a Metra line serves both your home neighborhood and your office district at compatible stations -- this is highly likely given Chicago suburban commute patterns but must be confirmed with the Metra system map. If station access requires more than a 5-minute drive, the analysis still holds; you would drive to the park-and-ride lot and the errand/
