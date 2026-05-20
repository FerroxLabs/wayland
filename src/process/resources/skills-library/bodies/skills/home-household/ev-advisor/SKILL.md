---
name: ev-advisor
description: |
  Electric vehicle guide covering EV vs hybrid vs gas comparison, range analysis, charging infrastructure including home charging setup and public networks, cost savings calculation, tax credits and incentives, battery care, cold weather performance, EV maintenance differences, and popular models comparison.
  Use when the user asks about ev advisor, or needs help with electric vehicle guide covering ev vs hybrid vs gas comparison, range analysis, charging infrastructure including home charging setup and public networks, cost savings calculation, tax credits and incentives, battery care, cold weather performance, ev maintenance differences, and popular models comparison.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of ev advisor.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automotive home-maintenance guide"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# EV Advisor

> **NOTE:** EV technology, tax incentives, available models, and charging infrastructure evolve rapidly. Verify current pricing, incentive eligibility, and specifications at the time of purchase. Federal and state incentives have income limits, assembly requirements, and MSRP caps that change with legislation. Model-year specifications used throughout this skill reflect typical 2024-2025 values.

---

## When to Use

**Use this skill when:**
- A user is actively considering buying or leasing an EV, PHEV, or hybrid and needs structured guidance to evaluate their real-world fit
- A user already owns an EV and needs help with charging setup, battery care, cold-weather strategy, or cost optimization
- A user wants a side-by-side cost comparison between keeping a gas vehicle, buying a hybrid, or switching to electric
- A user needs to understand which federal, state, or utility incentives they qualify for and how to stack them
- A user is planning a long road trip in an EV and needs a charging strategy
- A user lives in an apartment or cannot install home charging and wants to evaluate whether an EV is still practical
- A user is a fleet manager or household with multiple vehicles weighing electrification priorities

**Do NOT use when:**
- The user needs a licensed electrician's assessment of their home electrical panel -- refer them to a qualified electrician for panel upgrades or load calculations
- The user is asking about EV insurance valuation disputes or warranty claims -- these require licensed adjusters or consumer protection resources
- The user wants detailed DIY battery repair or high-voltage system work -- high-voltage systems require certified EV technician training; redirect to a dealership or certified repair shop
- The user is asking about commercial EV fleet telematics, route optimization software, or depot charging infrastructure design at scale -- those require specialized fleet consulting skills
- The user needs emergency roadside assistance or a stranded-EV situation -- direct them to their vehicle's emergency line (most manufacturers provide 24/7 EV-specific roadside support) and the PlugShare app to locate nearby charging immediately

---

## Questions to Ask the User First

Before delivering analysis, gather the following. If the user provides partial information, ask only for what is missing -- do not repeat questions they have already answered.

1. **Primary purpose:** Are you considering a purchase, evaluating whether EV fits your lifestyle, planning charging infrastructure, or optimizing an EV you already own?
2. **Daily driving pattern:** What is your typical daily mileage, and how often do you drive significantly more (e.g., 2x per month you drive 150+ miles)?
3. **Housing situation:** Do you own a home/condo with a dedicated parking spot, or do you rent/use a shared lot?
4. **Home charging feasibility:** Do you have a 240V outlet (dryer-type) near your parking, or would installation require a new circuit?
5. **Budget:** What is your target purchase price range before incentives? ($25K / $35K / $45K / $55K / $65K / $80K+)
6. **Vehicle form factor:** Sedan, SUV/crossover, pickup truck, or minivan?
7. **Longest regular trip:** What is the farthest single trip you take at least 4 times per year?
8. **Climate:** What is your typical winter low temperature? (Above 20°F / 0-20°F / Below 0°F)
9. **Ownership horizon:** How long do you plan to keep this vehicle? (Under 3 years / 3-5 / 5-8 / 8+ years)
10. **Current vehicle:** What do you drive now, approximately how many miles per year, and what do you pay for fuel?

---

## Process

### Step 1 -- Classify the Powertrain That Actually Fits the User's Life

Before recommending any specific vehicle, determine which powertrain category is appropriate. Many users default to "I want a full EV" without realizing a PHEV may serve them better, or vice versa.

- **BEV (Battery Electric Vehicle):** 100% electric, 200-400+ miles EPA range, zero tailpipe emissions, lowest fuel and maintenance cost over time. Best fit when the user has reliable home charging OR is within 2 miles of abundant public Level 2 or DCFC infrastructure.
- **PHEV (Plug-In Hybrid):** Electric motor + gas engine, 20-60 miles all-electric range, then operates as a hybrid. Best fit for high-mileage drivers with irregular long trips, rural areas with sparse charging, or apartment dwellers. The Toyota RAV4 Prime (42 mi EV range) and Ford Escape PHEV (37 mi) cover 80-90% of average daily driving on electricity alone.
- **HEV (Conventional Hybrid):** No plug, small battery recharged by regenerative braking and engine. No charging infrastructure needed. Best fit when home charging is impossible and public charging is unreliable. Offers 35-55 MPG combined vs. 25-35 MPG for comparable gas vehicles.
- **ICE (Internal Combustion):** Still the right answer when the user drives fewer than 6,000 miles/year (breakeven math rarely works), will keep the vehicle under 2 years, or lives in an area with no charging access and does not want range anxiety.

**Decision rule:** If daily commute ≤ 50 miles AND has home charging → BEV is almost always the best financial choice over 5+ years. If daily commute > 80 miles with uncertain charging → evaluate PHEV or long-range BEV carefully.

---

### Step 2 -- Run the Real-World Range Analysis

Do not rely on EPA range alone. Calculate actual usable range for the user's conditions.

- **Baseline formula:** EPA Range × Efficiency Factor = Real-World Range
  - Ideal conditions (65-75°F, city driving, no cargo): EPA × 0.95
  - Mixed typical use (mild weather, some highway): EPA × 0.85
  - Winter at 20°F, highway 65-70 mph: EPA × 0.70
  - Winter below 0°F, highway 75+ mph: EPA × 0.58-0.62
  - Towing at rated capacity: EPA × 0.45-0.55

- **Daily buffer rule:** Never plan to use more than 80% of rated capacity for daily driving. A 300-mile EPA vehicle has a practical daily budget of 240 miles.

- **Minimum EPA range for purchase:** (Peak daily mileage × 1.25) ÷ 0.80. For a user with a peak day of 120 miles: (120 × 1.25) ÷ 0.80 = 187.5 miles minimum EPA -- a 200-mile vehicle is marginal; 250+ miles is comfortable.

- **Long trip viability:** For any trip over 200 miles, verify DC Fast Charge station spacing along the route using A Better Route Planner (ABRP). Optimal stop spacing is 150-180 miles between chargers for vehicles with 250+ mile range. Never rely on a single charging station with no alternative -- plan a backup.

- **Cold-climate rule of thumb:** In Minnesota, Wisconsin, Montana, or similar climates, add 30% to your minimum EPA range requirement. A user who would be comfortable with 250 miles in California needs at least 325 miles EPA in a Minnesota winter.

---

### Step 3 -- Build the Charging Plan Before Recommending a Vehicle

The charging situation determines EV viability more than any other single factor. Work through all three tiers.

**Tier 1 -- Home Charging (Primary)**

- **Level 1 (120V standard outlet):** Delivers 3-5 miles of range per hour. Adequate only for PHEVs or BEV drivers with under 30 miles/day. Free to install (outlet already exists). Overnight 8-hour charge = 24-40 miles.
- **Level 2 (240V, 32-48 amp circuit):** Delivers 20-44 miles of range per hour depending on vehicle onboard charger capacity. Most BEVs have 7.2-11.5 kW onboard chargers; a 48-amp EVSE at 240V delivers 11.5 kW. Full overnight charge (0-80%) in 4-8 hours for most vehicles.
- **EVSE hardware costs:** $300-500 for a basic 32-amp unit (Grizzl-E Classic, Lectron), $500-750 for a smart 48-amp unit (ChargePoint Home Flex, Emporia Smart, Wallbox Pulsar Plus). Tesla Wall Connector is $450 and NACS-native.
- **Electrician install cost:** $300-600 for a simple run under 30 feet from an adequate panel. $800-1,500 for runs over 50 feet or panels needing a new breaker space. $1,500-4,000+ for a panel upgrade (100A to 200A service), which may or may not be needed.
- **Panel check:** A 200-amp service panel with available breaker space (needs a 50-amp double-pole breaker for a 40-amp continuous EVSE circuit) is almost always sufficient without upgrade. A 100-amp panel with multiple appliances may be tight -- an electrician load calculation is mandatory.
- **Smart EVSE scheduling:** Always configure off-peak charging if the utility offers time-of-use (TOU) rates. Typical off-peak rates are $0.08-0.12/kWh vs. peak rates of $0.20-0.45/kWh. The annual savings from off-peak charging alone can be $150-400.

**Tier 2 -- Workplace Charging**

- Even Level 1 at work (8 hours × 4 mi/hr = 32 miles) effectively doubles a short-range EV's daily reach. Many employers offer Level 2 free or at reduced cost. This changes the math significantly for apartment dwellers.

**Tier 3 -- Public Network**

- **DC Fast Charging (DCFC / Level 3):** 50-350 kW chargers, adds 100-300 miles in 20-45 minutes. Cost: $0.25-0.65/kWh at pay-per-kWh networks or $0.12-0.25/min at per-minute pricing. Tesla Supercharger V3 delivers up to 250 kW (non-Tesla vehicles cap at 150-200 kW on Supercharger network via CCS/NACS adapter).
- **Connector standards (critical):** As of 2024-2025, NACS (North American Charging Standard, originally Tesla) is becoming the industry standard. Ford, GM, Rivian, Honda, Nissan, and others have adopted NACS. CCS (Combined Charging System) remains common on existing vehicles and chargers, but most new non-Tesla EVs are NACS or include NACS adapters.
- **Network reliability:** Tesla Supercharger network has the highest uptime reliability (~98%). Electrify America and EVgo have improved but still average 80-90% uptime. ChargePoint is primarily Level 2 and generally reliable. Always download PlugShare to check real-time community reports of station status.
- **Apartment/no-home-charging strategy:** If charging at home is impossible, calculate the cost of DCFC as the primary charging source. At $0.35/kWh average and 3.5 mi/kWh efficiency, cost is $0.10/mile -- more expensive than Level 2 home charging ($0.03-0.04/mile) but still often cheaper than gas at $3.50/gallon with a 30 MPG vehicle ($0.12/mile). A PHEV with workplace Level 2 may be the better choice.

---

### Step 4 -- Calculate the True 5-Year Cost of Ownership

Never compare sticker prices. Always build a full 5-year total cost of ownership (TCO) comparison.

**Fuel cost framework:**
- Gas vehicle: (Annual miles ÷ MPG) × average gas price/gallon
- EV: (Annual miles ÷ mi/kWh) × average electricity cost/kWh
- Use 3.5-4.0 mi/kWh for most EVs under normal conditions; 3.0 for large trucks/SUVs; 4.0-5.5 for compact efficient EVs
- Example: 15,000 mi/year, 30 MPG gas, $3.60/gal = $1,800/year fuel. Same miles, EV at 3.8 mi/kWh, $0.13/kWh off-peak = $513/year. Annual savings: $1,287. 5-year fuel savings: $6,435.

**Maintenance cost framework:**
- Gas vehicle typical 5-year maintenance (oil changes, filters, brake pads, tire rotation, transmission service, potential spark plugs and coolant): $4,500-8,000 depending on vehicle type and mileage
- BEV 5-year maintenance (tire rotation, cabin air filter, brake fluid flush, wiper blades, 12V battery): $1,200-2,500
- PHEV 5-year maintenance: $2,500-4,500 (still needs oil changes but less frequently; brakes last longer)
- 5-year maintenance savings: $2,500-5,500 for BEV vs. gas

**Insurance delta:** EVs typically cost $200-600/year more to insure than comparable gas vehicles due to higher repair costs and battery replacement risk. Factor in $1,000-3,000 over 5 years as a cost against EV.

**Depreciation:** BEVs have historically depreciated faster than gas vehicles in years 1-4, but this gap is narrowing as EV adoption increases. For lease decisions, residual value assumptions matter more than purchase depreciation.

**Breakeven formula:**
(Net EV purchase price -- net gas vehicle purchase price) ÷ (annual fuel savings + annual maintenance savings -- annual insurance premium increase) = breakeven in years

A typical result for a $42,000 EV (after $7,500 federal credit = $34,500) vs. a $28,000 comparable gas sedan:
($34,500 -- $28,000) ÷ ($1,287 + $750 -- $400) = $6,500 ÷ $1,637 = 3.97 years

At 5 years, total savings over gas = $8,185 -- $6,500 upfront premium = $1,685 net ahead.
At 8 years, total savings = $13,096 -- $6,500 = $6,596 net ahead.

**The longer the ownership horizon, the stronger the EV financial case.**

---

### Step 5 -- Identify and Stack All Available Incentives

Incentives can reduce net purchase price by $5,000-20,000+. Work through all four layers.

**Layer 1 -- Federal New EV Tax Credit (IRA Section 30D):**
- Up to $7,500 for new qualifying BEVs and PHEVs
- Vehicle must be final assembled in North America
- Battery component sourcing rules apply (percentage thresholds increase each year through 2029)
- MSRP caps: $55,000 for sedans and hatchbacks; $80,000 for SUVs, vans, and pickup trucks
- Income limits: $150,000 MAGI (single filer), $225,000 (head of household), $300,000 (married filing jointly)
- As of 2024: Can be transferred as a point-of-sale discount at participating dealers -- the buyer does not need to wait for tax filing. This is called the "instant rebate" option and requires the dealer to be registered with the IRS Clean Vehicle Credit Program.
- Not all vehicles qualify -- check the official IRS or Department of Energy list at time of purchase

**Layer 2 -- Federal Used EV Tax Credit (Section 25E):**
- Up to $4,000 or 30% of sale price (whichever is less)
- Vehicle must be at least 2 model years old at time of sale
- Sale price must be $25,000 or less
- Must be purchased from a licensed dealer (not private sale)
- Income limits: $75,000 single, $112,500 head of household, $150,000 joint
- Buyer cannot have claimed this credit in the prior 3 years

**Layer 3 -- Federal Home Charging Credit (Section 30C):**
- 30% of EVSE hardware + installation cost, up to $1,000 tax credit
- Applies to installation at primary residence
- Must be claimed on tax return (not transferable at point of sale)

**Layer 4 -- State and Utility Incentives:**
- State rebates vary dramatically: California Clean Vehicle Rebate Project (up to $7,500 for qualifying income), Colorado ($5,000 state tax credit), New York (up to $2,000 rebate), Texas (no state credit -- buyer bears full cost)
- Utility rebates: Many utilities offer $250-1,500 rebates for EVSE installation plus reduced TOU rates for EV charging
- State sales tax exemptions: Washington, Oregon, and several other states exempt EVs from sales tax -- on a $45,000 vehicle, this saves $3,600-4,500
- HOV lane access with clean air vehicle stickers (California, Virginia, Utah, others) has a real economic value for daily commuters -- California stickers are limited but other states are more accessible

**Stacking example:** Colorado buyer purchasing a $52,000 qualifying EV SUV:
- Federal credit: $7,500
- Colorado state tax credit: $5,000
- Xcel Energy EVSE rebate: $500
- Total incentive stack: $13,000
- Effective net price: $39,000

---

### Step 6 -- Assess Battery Health and Long-Term Care Strategy

Battery longevity is the #1 concern for most EV prospects. Address it with data.

**Warranty baseline:** All major manufacturers provide 8-year/100,000-mile battery warranty (whichever comes first). Most warrant to at least 70% remaining capacity; some (Hyundai, Kia) warrant to 70% at 10 years/100,000 miles. Tesla's warranty covers 70% capacity retention.

**Real-world degradation data:** Based on fleet studies:
- Year 1-2: 2-4% capacity loss (chemistry stabilization)
- Year 3-5: 1-2% per year
- Year 5-8: 0.5-1.5% per year
- 200,000-mile vehicles typically show 10-20% total degradation
- Extreme heat (Phoenix, Las Vegas) accelerates degradation by 1.5-2× vs. moderate climates

**Daily charging protocol:**
- Set charge limit to 80% for daily use. Every major EV manufacturer recommends this in their app settings.
- Charge to 100% only when needed for a long trip, and begin the trip within a few hours -- do not sit at 100% overnight regularly
- The bottom 10% is also stressful for lithium chemistry -- avoid routine trips to under 15%
- "Opportunity charging" (topping up from 40% to 70%) is fine and does not harm the battery
- Daily DC Fast Charging as the sole charging method can accelerate degradation 5-10% more than regular Level 2 charging over 5 years -- acceptable for road trips, suboptimal as daily habit

**Thermal management systems:** Liquid-cooled battery systems (used by Tesla, GM Ultium, Hyundai/Kia E-GMP, Ford) are significantly more durable than air-cooled systems (used in early-generation Nissan Leaf). When evaluating used EVs, verify the battery management architecture -- avoid air-cooled systems in hot climates.

---

### Step 7 -- Address Cold Weather Performance Specifically

This is the most common area of unpleasant surprise for new EV owners in northern climates. Provide concrete, actionable strategies.

**Range impact quantified:**
- 32°F (0°C): -15 to -25% range
- 14°F (-10°C): -25 to -35% range
- -4°F (-20°C): -35 to -45% range
- -22°F (-30°C): -40 to -55% range

**Heat pump vs. resistance heating -- this matters enormously:**
- Resistance heating (older/cheaper EVs): Draws 4,000-7,000 watts from the battery to heat the cabin. At highway speed in -10°F weather, this alone can consume 30% of total energy draw.
- Heat pump heating (Tesla Model 3/Y 2021+, Hyundai Ioniq 5/6, Ford Mustang Mach-E, Kia EV6, BMW iX, Rivian R1): Moves heat rather than generating it, using 1,500-2,500 watts for the same cabin temperature. Preserves 15-25% additional range in cold conditions vs. resistance-only heating.
- **Recommendation:** In climates below 20°F regularly, prioritize heat pump equipped vehicles. The range difference is the equivalent of 40-80 miles on a winter highway drive.

**Preconditioning strategy:**
- Set a departure time in the vehicle's app (Tesla, Hyundai, Kia, GM all support this)
- The car warms the cabin AND the battery pack while still plugged in, drawing from grid power instead of battery
- Benefits: Full range available when you leave; battery is at optimal temperature for maximum regen and charging speed; steering wheel and seats pre-warmed
- Cost: 1-3 kWh per preconditioning cycle = $0.13-0.40 per morning -- negligible

**Regenerative braking in cold:** Battery Management Systems limit regen when battery is cold (below ~32°F) to prevent lithium plating. This means reduced one-pedal driving effectiveness for the first few miles. Normal braking is fully available -- the friction brakes still work. After 5-10 minutes of driving, battery warms up and full regen returns.

**Charging speed in cold:** DCFC charging speed drops 30-50% when the battery is below 32°F. Most modern EVs (Tesla, Hyundai, Kia, Porsche, Rivian) automatically "precondition the battery for charging" when you navigate to a fast charger via the built-in navigation -- the car warms the pack en route so you arrive ready to charge at near-peak speed. Always use the vehicle's built-in navigation to the charger, not your phone's Google Maps, to trigger this feature.

---

### Step 8 -- Compare Specific Models for the User's Use Case

Only after steps 1-7 are complete, make specific model recommendations. Organize by use case category.

**Compact/Midsize Sedan and Hatchback (best efficiency, lowest cost):**
- Tesla Model 3 Long Range AWD: 333 mi EPA, NACS, heat pump, 0-60 in 4.2s, ~$42,990 before credits
- Hyundai Ioniq 6 SE Long Range AWD: 266 mi EPA, CCS/NACS adapter, heat pump, 800V architecture for 18-min 10-80% charge, ~$41,450 before credits
- Chevrolet Equinox EV LT: 319 mi EPA (2WD), CCS + NACS adapter, ~$34,995 before credits -- one of the strongest value propositions in the segment
- Nissan Ariya Evolve+ AWD: 265 mi EPA, CHAdeMO being phased to CCS, ~$53,990

**Midsize SUV/Crossover (most popular category):**
- Tesla Model Y Long Range AWD: 320 mi EPA, NACS, heat pump, massive Supercharger network advantage, ~$47,990 before credits
- Hyundai Ioniq 5 XRT AWD: 266 mi EPA, 800V architecture, heat pump, exceptional interior space, ~$47,450 before credits
- Ford Mustang Mach-E Premium AWD Extended Range: 290 mi EPA, BlueOval Charge Network (Electrify America + Ford app), heat pump, ~$44,995 before credits
- Kia EV6 Wind AWD: 274 mi EPA, 800V architecture, heat pump, shared E-GMP platform with Ioniq 5, ~$45,995 before credits
- Volkswagen ID.4 Pro S AWD: 255 mi EPA, Electrify America (2 years free charging included), ~$46,995 before credits

**Pickup Trucks:**
- Ford F-150 Lightning Pro: 240 mi EPA (standard range), 320 mi (extended range), 240V Pro Power Onboard for jobsite/camping, ~$49,995 (standard range) before credits
- Rivian R1T Adventure: 314 mi EPA, quad-motor option, exceptional off-road capability, ~$69,900 before credits -- note: MSRP may exceed SUV/truck cap for credits
- Chevrolet Silverado EV RST: 450 mi EPA (Work Truck trim), GM Ultium platform, NACS + DC charging up to 350 kW, ~$74,800 before credits

**PHEVs (for users needing gas backup or apartment living):**
- Toyota RAV4 Prime SE: 42 mi EV range, then 38 MPG hybrid, ~$43,390, no federal credit (Japanese assembly)
- Ford Escape PHEV: 37 mi EV range, then 41 MPG, ~$35,790, may qualify for federal credit depending on model year
- Jeep Wrangler 4xe: 22 mi EV range, capable off-road, ~$55,695, eligible for $3,750 credit
- Kia Sportage PHEV: 34 mi EV range, 84 MPGe, ~$37,990, check current federal eligibility

---

## Output Format

Deliver the final recommendation in this structured format after completing the diagnostic conversation:

```
════════════════════════════════════════════════
EV ADVISOR ANALYSIS
════════════════════════════════════════════════
USER PROFILE
  Daily miles:        [X miles/day typical, Y miles peak day]
  Annual miles:       [Estimated X,XXX miles/year]
  Housing/Charging:   [Own home + garage / Apartment / etc.]
  Climate:            [Region and typical winter low]
  Budget:             [$XX,XXX before incentives]
  Ownership horizon:  [X years]
  Needs:              [Form factor, cargo, towing, etc.]

────────────────────────────────────────────────
POWERTRAIN RECOMMENDATION
  Best fit:           [BEV / PHEV / HEV] -- [2-sentence rationale]
  Minimum EPA range:  [XXX miles for this user's conditions]

────────────────────────────────────────────────
TOP VEHICLE RECOMMENDATIONS

 #  | Vehicle                          | Net Price*  | EPA Range | Key Strength
----|----------------------------------|-------------|-----------|------------------
 1  | [Year Make Model Trim]           | $XX,XXX     | XXX mi    | [Top reason]
 2  | [Year Make Model Trim]           | $XX,XXX     | XXX mi    | [Top reason]
 3  | [Year Make Model Trim]           | $XX,XXX     | XXX mi    | [Top reason]

*Net price after estimated federal + state incentives applied

────────────────────────────────────────────────
5-YEAR TOTAL COST OF OWNERSHIP COMPARISON

                        | EV Option #1    | Current/Gas Alt
------------------------|-----------------|------------------
Purchase price (net):   | $XX,XXX         | $XX,XXX
5-yr fuel cost:         | $X,XXX          | $X,XXX
5-yr maintenance:       | $X,XXX          | $X,XXX
5-yr insurance delta:   | +$X,XXX         | --
5-yr total:             | $XX,XXX         | $XX,XXX
SAVINGS vs. gas:        | $X,XXX          |

Breakeven point:        [X.X years from purchase date]

────────────────────────────────────────────────
CHARGING PLAN

Home charging:
  Tier:              [Level 1 / Level 2 / Not feasible]
  Hardware:          [Recommended EVSE unit, amperage]
  Install estimate:  $X,XXX (hardware) + $XXX-$X,XXX (electrician)
  Cost per charge:   ~$X.XX per full charge at [$X.XX/kWh off-peak]
  Monthly fuel bill: ~$XX-$XX/month

Public charging:
  Primary network:   [Tesla Supercharger / Electrify America / ChargePoint]
  Connector type:    [NACS / CCS]
  Road trip plan:    [Specific guidance for longest regular trip]

────────────────────────────────────────────────
INCENTIVES AVAILABLE

  Federal new EV credit:       $X,XXX (confirm vehicle eligibility)
  State rebate/credit:         $X,XXX ([State name] program)
  Utility EVSE rebate:         $XXX ([Utility name] program)
  Home charging tax credit:    $XXX (30% of install cost)
  TOTAL ESTIMATED INCENTIVES:  $XX,XXX

  Income qualification:        [Confirm at filing / Point-of-sale eligible]

────────────────────────────────────────────────
BATTERY AND COLD WEATHER NOTES

  Daily charge limit:     Set to 80% in vehicle app
  Cold weather strategy:  [Specific precautions for user's climate]
  Heat pump:              [Yes/No for each recommended vehicle]
  Winter range estimate:  ~XXX mi (EPA × [factor] for [user's temp])

────────────────────────────────────────────────
TOP 3 ACTION ITEMS
  1. [Most important next step]
  2. [Second priority]
  3. [Third priority]
════════════════════════════════════════════════
```

---

## Rules

1. **Never quote EPA range as the real-world number.** Always apply the appropriate efficiency factor for the user's climate, driving style, and speed. Presenting 358-mile EPA range as what the user will experience in Minnesota in January is misleading and damages trust when reality falls short.

2. **Confirm federal credit vehicle eligibility explicitly.** Do not assume a vehicle qualifies for the full $7,500 credit -- the qualifying vehicle list changes monthly as manufacturers cycle through battery sourcing compliance windows. Tell the user to verify the specific VIN or trim at the IRS or fueleconomy.gov tool before signing.

3. **Never recommend a BEV to an apartment dweller without a clear charging solution.** If the user cannot charge at home and workplace charging is unavailable, a BEV will require DCFC as the primary charging method, which costs more, is less convenient, and accelerates battery degradation. A PHEV is often the correct recommendation in this scenario.

4. **Do not ignore the 12V battery.** Every modern EV has a separate 12V auxiliary battery that powers the electronics, locks, windows, and in many cases the ability to open the charge port and start the car. This battery is often overlooked and typically lasts 3-5 years. A dead 12V battery strands the driver regardless of how much charge is in the main pack. Always mention this in ownership advice.

5. **Account for NACS vs. CCS connector compatibility in charging network advice.** A CCS vehicle cannot use Tesla Superchargers without a CCS-to-NACS adapter (available from Tesla for ~$250). Most new non-Tesla EVs sold after mid-2024 include NACS ports or adapters. Verify connector type for any specific model being discussed and factor in adapter needs.

6. **Time-of-use electricity rates change the economics substantially.** An EV owner who charges during on-peak hours at $0.35/kWh is paying significantly more than one charging off-peak at $0.09/kWh. Always ask whether the user's utility offers TOU rates and factor the correct rate into cost calculations.

7. **Towing dramatically reduces range -- quantify it.** Many buyers focus on towing capacity without realizing that towing at rated capacity reduces effective range by 40-55%. An F-150 Lightning with 300-mile EPA range has approximately 150-165 miles of range when towing a 7,000-lb trailer at 65 mph. For regular trailer towers, PHEV or hybrid truck may deliver more practical utility.

8. **Do not omit depreciation for users considering a lease vs. buy decision.** Leasing avoids the risk of unfavorable residual value but cannot access the federal tax credit in the same way (the leasing company receives the credit; pass-through to the lessee varies by dealer). Leasing also avoids the federal income eligibility limit -- making it attractive for high earners who exceed the income caps.

9. **The PHEV case is often underrated.** A user who drives 35 miles/day with a PHEV that has 40 miles of electric range will drive on electricity ~90% of their miles without any range anxiety, without DCFC dependence, and at a lower vehicle cost than a long-range BEV. Avoid reflexively steering every user toward full BEV -- PHEV frequently outperforms on total cost and convenience in specific profiles.

10. **Always flag battery thermal management architecture for used EV buyers.** Air-cooled packs (early Nissan Leaf gen 1/2, early Mitsubishi i-MiEV) cannot regulate battery temperature and degrade significantly faster in hot climates and with DCFC use. Any used EV recommendation should specify whether the pack is liquid-cooled. For a used EV over 4 years old, recommend requesting a battery health report (available as a dealer or third-party diagnostic for most platforms) showing State of Health (SoH) percentage before purchase.

---

## Edge Cases

### User Lives in an Apartment Without Home Charging
This is the most common scenario where the default BEV recommendation breaks down. Do not dismiss the EV option, but restructure the solution:
- First, determine if workplace or nearby residential Level 2 charging is available -- even 8 hours at Level 2 at work fills most EVs' daily needs
- If only DCFC is available, calculate the true cost: 4,286 kWh/year at $0.35/kWh DCFC = $1,500/year -- still cheaper than gas but eliminating Level 2 home charging savings
- Check right-to-charge laws in the user's state -- California, Colorado, Florida, Connecticut, and others require landlords to allow EVSE installation at the tenant's expense in dedicated parking spots
- Recommend PHEVs seriously for apartment dwellers -- Level 1 at a standard outlet (if available in parking garage) provides 32-40 miles overnight, covering most daily driving electrically without requiring a charging infrastructure build-out

### User Wants to Tow Regularly (Weekly or Bi-Weekly)
Range calculations for regular towing require a fundamentally different framework:
- Effective range while towing = EPA range × 0.45-0.55 (most trucks/SUVs)
- Plan charging stops every 120-160 miles when towing, not the usual 200-250
- Battery heating from frequent DCFC stops while towing can compound thermal stress -- ensure the vehicle has active liquid cooling and at least 15 minutes between consecutive DCFC sessions
- The F-150 Lightning's Pro Power Onboard (7.2 kW version) adds significant campsite/jobsite utility that can offset the towing range penalty for many users
- If the user tows 3+ times per week over 100 miles one-way, a PHEV truck may deliver more practical value than a BEV truck at current infrastructure levels

### User Is in an Extreme Cold Climate (Regularly Below 0°F)
Normal range buffers are insufficient. Additional guidance required:
- Apply 0.55-0.60 efficiency factor for range estimates in sustained sub-zero conditions
- Minimum EPA range recommendation increases to: (peak daily miles × 1.5) ÷ 0.60
- Heat pump is not merely "preferred" but essentially required -- for a Minnesota driver, eliminate air-cooled heat vehicles and resistance-only heating vehicles from consideration
- DCFC charging at -20°F without battery preconditioning can result in charge speeds as low as 20-30 kW even at a 350 kW charger -- this is normal but must be planned for. Allow 50-75% more time at charging stops
- Vehicles with strong cold-weather reputation: Hyundai Ioniq 5/6 (advanced heat pump), Tesla Model Y (improved heat pump since 2021 refresh), Rivian R1S/R1T (thermal management optimized for off-road + cold)
- Keep winter emergency kit in vehicle: wool blanket, portable USB battery bank (for 12V dead situations), jumper cables, and a small 12V jump starter rated to -20°F

### User Is Evaluating a Used EV
Used EVs introduce battery health uncertainty that must be quantified before any recommendation:
- Request or conduct a State of Health (SoH) check. For Tesla, this is visible in the vehicle's energy app and reported by many independent diagnostic tools. For other makes, OBD-II tools with brand-specific apps (Leaf Spy for Nissan, EVBatMon for others) can read SoH from the BMS
- A vehicle at 80% SoH has 80% of its original EPA range available -- a 300-mile car becomes a 240-mile car. This is within warranty coverage threshold for most brands but means charging stop planning must account for reduced range
- Check if the original battery warranty is transferable -- most manufacturers (Tesla, GM, Hyundai, Kia, Ford) honor the battery warranty for subsequent owners within the 8-year/100K-mile window
- Avoid first-generation Nissan Leaf models (2011-2017) in hot climates due to air-cooled degradation. A 2015 Leaf in Phoenix may retain only 60-65% capacity
- For used Teslas specifically, the battery degradation rate can be estimated by looking at the "Rated Range" displayed at 100% charge in the vehicle -- compare to original EPA spec to calculate SoH

### User Has Both a Long Commute and Frequent Long Trips (Over 150 Miles)
This profile requires a long-range BEV but a robust charging plan to avoid anxiety:
- Minimum 300-mile EPA range for users in this profile
- Verify DCFC network density along all regular long-trip corridors using ABRP or PlugShare before purchase
- If one or more regular routes pass through areas with DCFC gaps over 150 miles, PHEV may be more practical regardless of home charging availability
- Auto-route planning in the vehicle's navigation (Tesla, Hyundai, Rivian all do this well) removes most anxiety if the network is adequate
- Consider a DC fast charge membership plan (Tesla app, Electrify America Pass+, EVgo Membership) for high-mileage users -- flat monthly fees reduce per-session costs significantly for frequent users

### User Is Considering Leasing Instead of Buying
Leasing changes the financial framework significantly:
- The federal $7,500 credit goes to the leasing company (as commercial leaner), not the buyer. Reputable dealers and leasing companies are now required to pass this through as a "capitalized cost reduction" -- verify this explicitly in the lease agreement. Some manufacturers (notably Tesla in certain configurations) do pass through the full credit; others pass through only a portion
- Leasing avoids the MSRP cap issue -- a $60,000 sedan that exceeds the $55,000 federal credit cap for purchases may be eligible for the credit through leasing if the leasing company can claim it
- Leasing also bypasses the income eligibility limit entirely for high earners
- 3-year lease term aligns well with the current pace of EV technology improvement -- the 2027 model year will likely offer substantially better range, charging speed, and features than 2024
- Residual value risk: if EV resale values drop significantly during the lease term (as has happened in 2022-2024 due to rapid model improvements and price cuts), the lessee is protected; the leasing company absorbs that depreciation
- Lease mileage limits (typically 10,000-12,000 miles/year) are a real constraint -- high-mileage drivers (15,000+/year) should either negotiate higher mileage allowances or buy rather than lease

### User Asks About Solar + EV Integration
This is increasingly common and worth addressing with specifics:
- A 6 kW rooftop solar array generates approximately 7,200-9,000 kWh/year in a good solar climate (California, Arizona, Texas) -- enough to cover 25,000-32,000 miles of EV driving with surplus for the home
- The economics are strongest when solar feeds into net metering at retail electricity rates and the EV charges during peak solar production hours, avoiding grid draw
- Smart EVSE units (Wallbox Quasar 2, Tesla Wall Connector paired with Powerwall, Emporia Vue) can be configured to charge only when excess solar generation is available, maximizing self-consumption
- For time-of-use rate structures, solar may not always align with off-peak charging windows -- a home battery (Tesla Powerwall, Enphase IQ Battery) can store midday solar for overnight EV charging, but the economics of adding home storage purely for EV charging rarely work on their own
- The combined federal tax credit for solar (30% via ITC) plus the EVSE credit (30%) makes the integrated solar + home charging solution financially compelling when planned together as a single home improvement project

---

## Example

**User input:**
"I'm thinking about buying an EV. I drive about 45 miles a day to work and back, and once or twice a month I drive about 180 miles round trip to see family. I own my home in Denver, Colorado with a 2-car garage. My current car is a 2019 Honda CR-V with about 28 MPG and I drive about 14,000 miles a year. I pay about $3.70/gallon for gas. Budget is around $45,000-$50,000 before any credits. I want something like a small SUV. Denver gets cold -- maybe 5-10°F on the worst nights in winter. How long should I plan to own it? I'd probably keep it 6-7 years."

---

**Full Output:**

```
════════════════════════════════════════════════
EV ADVISOR ANALYSIS
════════════════════════════════════════════════
USER PROFILE
  Daily miles:        ~45 miles/day commute; 180-mile round trips 2x/month
  Annual miles:       ~14,000 miles/year
  Housing/Charging:   Own home, 2-car garage -- Level 2 home charging feasible
  Climate:            Denver, CO -- winter lows 5-10°F, sunny most days
  Budget:             $45,000-$50,000 before incentives
  Ownership horizon:  6-7 years
  Needs:              Small/midsize SUV or crossover

────────────────────────────────────────────────
POWERTRAIN RECOMMENDATION
  Best fit:          BEV (Battery Electric Vehicle)

  Rationale: You have home charging available, your 45-mile daily commute is
  well within any modern BEV's daily capability, and your 6-7 year ownership
  horizon means you'll capture the full financial benefit of lower fuel and
  maintenance costs. A PHEV would work but delivers less cost savings over
  this timeframe. With a garage, cold-weather preconditioning is easy and
  effective for Denver winters.

  Minimum EPA range needed:
  Peak day = 180 miles. Apply winter factor for Colorado: × 0.72.
  Real-world peak day range needed = 180 ÷ 0.72 = 250 miles minimum EPA.
  Recommendation: 270+ miles EPA for comfortable margin.

────────────────────────────────────────────────
TOP VEHICLE RECOMMENDATIONS

 #  | Vehicle                               | Net Price*  | EPA Range | Key Strength
----|---------------------------------------|-------------|-----------|--------------------------------
 1  | 2024 Chevrolet Equinox EV 2LT AWD    | ~$35,995    | 303 mi    | Best value, large incentive stack
 2  | 2024 Hyundai Ioniq 5 SEL AWD         | ~$34,450    | 266 mi    | 800V fast charging, heat pump
 3  | 2024 Tesla Model Y Long Range AWD    | ~$40,490    | 320 mi    | Supercharger network advantage

*Net price estimates after $7,500 federal credit + $5,000 Colorado state credit.
Verify vehicle-specific eligibility -- Equinox EV and Model Y have strong
eligibility records as of 2024; confirm Ioniq 5 assembly status at IRS site.

────────────────────────────────────────────────
5-YEAR AND 6-YEAR TOTAL COST OF OWNERSHIP

                          | Equinox EV (Rec.)  | 2024 Honda CR-V EX
--------------------------|--------------------|-----------------------
Purchase price (net):     | $35,995            | $33,500 (est.)
6-yr fuel cost:           | $1,274             | $11,100
  (EV: 14K mi ÷ 3.7 mi/kWh × $0.10/kWh off-peak × 6 yr)
  (Gas: 14K ÷ 28 MPG × $3.70/gal × 6 yr = $11,100)
6-yr maintenance:         | $1,800             | $6,200
  (EV: tire rotations, brake fluid, cabin filter, 12V)
  (Gas: oil changes, filters, brake pads, trans service, misc)
Insurance delta (EV +):   | +$1,500            | --
6-yr total:               | $40,569            | $50,800
SAVINGS vs. CR-V:         | $10,231            |

Breakeven point:          ~2.5 years after purchase

  Note: Fuel cost uses $0.10/kWh -- Colorado off-peak rates via Xcel Energy.
  On-peak charging would be $0.22/kWh, raising EV fuel cost to $2,800.
  Set your EVSE to charge 9 PM - 6 AM to capture the off-peak rate.

────────────────────────────────────────────────
CHARGING PLAN

Home charging (primary):
  Tier:              Level 2 -- strongly recommended
  Hardware:          ChargePoint Home Flex (48A) or Grizzl-E Classic (40A)
  Why these:         ChargePoint has Xcel Energy utility rebate integration;
                     Grizzl-E is the best value hardwired unit
  Hardware cost:     $350-600 (EVSE unit)
  Install estimate:  $300-600 electrician (garage = short run, 50A breaker)
                     Total EVSE investment: $650-1,200
  Charging speed:    40A circuit = ~36 mi/hr (full charge overnight in 7 hrs)
  Cost per charge:   0-80% Equinox EV (~55 kWh) at $0.10 = ~$5.50
  Monthly fuel:      ~$18-22/month (vs. ~$155/month current gas spend)

Public charging for 180-mile round trips:
  Route:             If driving to the mountains or out of Denver metro,
                     Electrify America stations are at most Walmart locations
                     along I-70 and I-25 corridors with 150-350 kW chargers.
  Connector:         Equinox EV uses CCS (NACS adapter available for Tesla
                     Superchargers at ~$250). Model Y uses NACS natively.
  Typical road trip: 180-mile round trip = 90 miles each way. With 270+ mi
                     real-world range at 65°F conditions, no stop needed.
                     In winter at 10°F: 303 EPA × 0.72 = ~218 mi real range.
                     You have comfortable margin for 90 miles each way with
                     no DCFC stop needed even in winter.

DCFC backup plan:   PlugShare + your vehicle's built-in trip planner will
                     show ChargePoint, Electrify America, and EVgo stations
                     along any route. Keep PlugShare app on your phone.

────────────────────────────────────────────────
INCENTIVES AVAILABLE

  Federal new EV credit:          $7,500 (point-of-sale at dealer -- no
                                   need to wait for tax filing)
  Colorado state tax credit:       $5,000 (Colorado Form DR 0617, claimed
                                   on state return -- not income-limited
                                   for the first $5,000 tier)
  Xcel Energy EVSE rebate:         $500 (if you are an Xcel customer;
                                   rebate for Level 2 smart EVSE install)
  Federal home charging credit:    ~$240 (30% of $800 install cost)
  TOTAL ESTIMATED INCENTIVES:      $13,240

  Income eligibility check:        At $150K-$300K joint / $150K single,
                                   you likely qualify for the federal credit.
                                   Confirm your M
