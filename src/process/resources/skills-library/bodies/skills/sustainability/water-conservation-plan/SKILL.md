---
name: water-conservation-plan
description: |
  Creates a room-by-room water conservation plan with usage impact estimates in gallons per day saved per intervention. Gathers the user's housing type, household size, climate, and current water habits to produce a prioritized action list with estimated savings distinguishing renter-accessible from homeowner improvements.
  Use when the user asks about reducing water usage, lowering water bills, conserving water at home, or understanding household water consumption patterns.
  Do NOT use for commercial or agricultural water management, water treatment or purification systems, drought emergency response, or irrigation system design for large landscapes.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sustainability checklist planning guide"
  category: "sustainability"
  subcategory: "home-sustainability"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Water Conservation Plan

## When to Use

**Use this skill when:**
- A user asks about reducing household water usage, lowering water bills, or cutting water consumption at home
- A user mentions a high water bill and wants to understand where the waste is coming from
- A user wants a room-by-room audit of water consumption and a prioritized action list with savings estimates
- A user is moving into a new home or apartment and wants to establish water-efficient habits from the start
- A user mentions drought conditions, water restrictions, or concern about local water supply and wants to respond at the household level
- A user wants to understand how their household's water footprint compares to national or regional averages
- A user asks which water-saving fixtures are worth buying and which are gimmicks
- A user wants to know what changes they can make as a renter versus what requires homeowner approval

**Do NOT use when:**
- The user manages a commercial facility, restaurant, hotel, or industrial operation -- commercial water management involves greywater recycling at scale, cooling tower treatment, and process water optimization that are outside this skill's scope
- The user needs agricultural irrigation system design or farm-level water management -- crop evapotranspiration calculations, irrigation scheduling, and soil moisture monitoring are separate domains
- The user is asking about water purification, filtration, or treatment systems for drinking water quality -- contaminant removal, reverse osmosis sizing, and water softener chemistry are outside this scope
- The user is responding to an active municipal drought emergency with mandatory restrictions -- emergency compliance, stage-based restriction schedules, and watering variance requests require local utility guidance
- The user needs water quality testing, well water assessment, or contamination remediation
- The user is designing a large-scale landscape irrigation system (greater than 2,500 square feet of turf) or an automated drip network requiring hydraulic calculations
- The user is asking about stormwater management, retention ponds, or municipal infrastructure

---

## Process

### Step 1: Gather the Household Water Profile

Before auditing, collect these six data points. Ask for them together in a single message to avoid back-and-forth:

- **Household size:** Number of occupants, including children (children under 10 use approximately 40-60 gallons per day, teens and adults 60-100+)
- **Housing type:** Single-family house, townhouse, apartment, condo, or mobile home -- this determines which interventions are structurally possible
- **Ownership status:** Owner or renter -- this gates every fixture-replacement recommendation
- **Climate zone:** Use these four categories -- arid/semi-arid (annual rainfall below 15 inches: Phoenix, Las Vegas, Albuquerque), Mediterranean (dry summers, wet winters: Los Angeles, Sacramento), temperate (moderate rainfall year-round: Atlanta, Denver, Chicago), or humid (high rainfall, evaporation not the primary pressure: Miami, Houston, Seattle)
- **Outdoor water use:** Does the household have a lawn, garden beds, fruit trees, a swimming pool, or perform regular car washing? For arid-climate homeowners, outdoor use commonly accounts for 50-70% of total consumption
- **Current bill or usage:** Monthly water bill in dollars OR usage in gallons or CCF (1 CCF = 748 gallons; 1 HCF = same as CCF; 1 kgal = 1,000 gallons). If the user doesn't know their usage, estimate from household size: 82 gallons per person per day indoor baseline (EPA WaterSense average), with outdoor multiplier of 1.3x (temperate) to 2.5x (arid with turf lawn)

**If the user cannot provide a bill:** Estimate their baseline using the formula:
- Estimated daily use = (number of adults × 80 gal) + (number of children × 50 gal) + outdoor adjustment
- Outdoor adjustment: 0 gal/day (apartment), 50-100 gal/day (small garden, temperate), 150-300 gal/day (lawn, arid)

**Flag immediately** if their reported usage far exceeds the estimate -- this is a strong signal of a running toilet, slab leak, irrigation controller malfunction, or other hidden leak.

---

### Step 2: Identify the Household's Fixture Generation

The single most important variable determining baseline consumption is fixture age. Guide the user to identify which generation of fixtures they have:

**Toilet generations (the most impactful single fixture):**
- Pre-1980: 5.0-7.0 gallons per flush (GPF) -- these are rare but occasionally found in older homes
- 1980-1993: 3.5 GPF -- still common in housing built before 1994 federal mandate
- 1994-2005: 1.6 GPF -- mandated by the Energy Policy Act of 1992; flush quality was inconsistent in early models
- 2006-present standard: 1.28 GPF -- WaterSense certified; excellent flush performance
- High-efficiency dual-flush: 0.8 GPF (liquid) / 1.28 GPF (solid) -- optimal choice for replacement

**Showerhead generations:**
- Pre-1992: 3.0-5.5 GPM (gallons per minute) -- uncommon but still found in unrenovated homes
- 1992-present federal standard: 2.5 GPM maximum
- WaterSense certified: 2.0 GPM or less -- significant savings with minimal perceived difference
- High-performance low-flow: 1.5-1.8 GPM -- best-in-class; air-infused models maintain pressure sensation

**Faucet aerator flow rates:**
- Kitchen faucets without aerator: 2.2 GPM
- Kitchen faucet with WaterSense aerator: 1.5 GPM
- Bathroom faucet without aerator: 2.2 GPM
- Bathroom faucet with WaterSense aerator: 0.5-1.0 GPM
- Aerators are universally retrofittable and cost $2-8 each -- this is the highest ROI intervention in the plan

**Washing machine generations:**
- Top-loading non-HE (pre-2011 in most households): 40-45 gallons per load
- Top-loading HE (2011-present): 25-35 gallons per load
- Front-loading HE: 14-25 gallons per load -- typically 40-50% less water than top-loaders
- The ENERGY STAR label indicates HE qualification; older top-loaders without this label are candidates for replacement on water grounds alone

---

### Step 3: Conduct the Room-by-Room Audit

Work through each area systematically. Calculate current usage AND potential savings for each fixture and habit.

**Bathroom -- typically 58-65% of indoor water use:**

*Toilets:*
- Identify GPF using the stamp on the toilet bowl underside or inside the tank lid
- Calculate daily household toilet use: (number of people × 5.5 flushes/day × GPF)
- A household of 4 with 3.5 GPF toilets (2 toilets): 4 × 5.5 × 3.5 = 77 gallons/day
- Same household with 1.28 GPF WaterSense toilets: 4 × 5.5 × 1.28 = 28 gallons/day
- Savings: 49 gallons/day -- this is often the single largest indoor savings opportunity
- Leak check: put 5 drops of food coloring in the tank; if color appears in the bowl within 15 minutes without flushing, the flapper is leaking. A slow toilet leak wastes 30-200 gallons per day; a running toilet wastes 200-1,000+ gallons per day

*Showers:*
- Measure actual showerhead flow rate: fill a 1-gallon bucket under the running shower and time it. If it fills in under 24 seconds, flow is above 2.5 GPM
- Calculate daily shower water: (number of showers per day × average shower length in minutes × GPM)
- Example: 4 showers/day × 8 minutes × 2.5 GPM = 80 gallons/day
- With 1.8 GPM showerhead: 4 × 8 × 1.8 = 57.6 gallons/day (savings: 22.4 gal/day)
- Reducing shower length by 2 minutes per person: 4 × 2 × 2.5 = 20 gallons/day saved at zero cost
- Shower timers (suction-cup style, $3-10) increase compliance by making the target visible

*Bathroom faucets:*
- Turn off tap while brushing teeth: running faucet at 2.2 GPM for 2 minutes = 4.4 gallons wasted, twice per day per person
- Household of 4: 35 gallons/day saved by turning off tap while brushing -- this behavioral change alone is meaningful
- Installing 0.5 GPM aerators reduces hands-washing and face-washing flow while maintaining adequate rinsing

*Bathtubs:*
- A full tub holds 35-50 gallons; a half-filled tub 18-25 gallons
- A shower under 10 minutes at 2.0 GPM (20 gallons) is more efficient than most baths; this is a useful comparison for families with children who bath daily

**Kitchen -- typically 10-15% of indoor water use:**

*Dishwasher vs. hand washing:*
- This is the most counterintuitive finding in household water conservation: a full load in a modern dishwasher (manufactured post-2013) uses 3-5 gallons total
- Hand washing the equivalent load with running water uses 20-27 gallons
- Pre-1994 dishwashers use 8-14 gallons per cycle -- still more efficient than hand washing with running water but significantly worse than modern models
- Scraping dishes instead of pre-rinsing saves 6,000+ gallons per year for a household running the dishwasher daily -- modern dishwashers do not need pre-rinsing; the detergent enzymes require food particles to activate properly
- Running only full loads saves 320-450 gallons per month versus running half-loads

*Kitchen faucet:*
- Installing a 1.5 GPM kitchen aerator (WaterSense) instead of 2.2 GPM saves 0.7 GPM; at 10 minutes of daily faucet use, that is 7 gallons/day saved per household
- Keep a pitcher of water in the refrigerator; running the tap until cold before drinking wastes 1-2 gallons per draw. A household of 4 drawing water 4 times per day wastes 16-32 gallons/day this way

*Food preparation:*
- Thawing food under running water: 1-2 gallons per minute. Alternative: thaw overnight in refrigerator (zero water use)
- Rinsing produce in a bowl rather than under running water: saves 5-10 gallons per day for households that cook fresh produce daily

**Laundry -- typically 16-22% of indoor water use:**

- Determine washing machine type and vintage before recommending changes
- Optimizing load size is the highest-impact free action: every eliminated half-load saves 14-22 gallons (top-loader) or 7-12 gallons (front-loader HE)
- Washing machine timing does not reduce water use but running during off-peak hours reduces energy demand
- If replacing a machine, front-loading HE models from WaterSense/ENERGY STAR certified manufacturers save 15-30 gallons per load versus conventional top-loaders
- Cold water washing: does not save water but eliminates 90% of energy per load, reducing the overall environmental footprint of laundry significantly

**Outdoor -- typically 30-70% of total use depending on climate and landscape type:**

*Lawn irrigation:*
- A standard pop-up sprinkler zone uses 12-25 gallons per minute depending on head type and zone size
- Watering a 1,000 sq ft lawn twice weekly for 20 minutes: approximately 300-600 gallons per session, 2,400-4,800 gallons per month during irrigation season
- Evapotranspiration (ET) scheduling: watering based on actual plant water demand rather than a fixed schedule. Most irrigation controllers have ET or "smart" mode; enabling this typically reduces irrigation use by 15-30%
- Time of day: watering between 10 AM and 6 PM in arid climates loses 30-40% of applied water to evaporation before it reaches roots; watering before 8 AM or after 8 PM eliminates most of this loss
- Cycle-and-soak programming: instead of one 20-minute run, set three 7-minute cycles with 30-minute breaks; water soaks into soil rather than running off, reducing run time needed by 10-20%
- Soil type matters: clay soils absorb water slowly (max 0.2 inches per hour); sandy soils absorb quickly. Runoff from clay soil during a single long sprinkler cycle can waste 20-40% of applied water

*Garden beds and trees:*
- Drip irrigation vs. sprinklers: drip systems deliver water directly to the root zone at 0.5-2.0 GPH per emitter; they eliminate evaporation and overspray losses, using 30-50% less water than sprinkler irrigation for the same plants
- Three inches of organic mulch (wood chips, bark) reduces soil evaporation by 50-70% and can reduce irrigation frequency by 30-50% -- this is a high-impact, low-cost intervention ($20-60 for a typical garden bed)
- Grouping plants by water need (hydrozoning) eliminates overwatering of drought-tolerant plants placed on the same zone as thirsty annuals

*Swimming pools:*
- A standard residential pool (15,000-20,000 gallons) loses 1,000-1,500 gallons per week to evaporation in arid and hot climates, adding up to 50,000-75,000 gallons per year
- A pool cover reduces evaporation by 90-95% (saves 45,000-70,000 gallons per year) and reduces chemical consumption by 35-60%
- Pool leak detection: the bucket test -- fill a bucket with pool water, place it on the pool step with weight to keep it submerged, and mark water levels inside and outside the bucket. After 24 hours, evaporation affects both equally; if the pool level drops more than the bucket, there is a structural leak. Pool leaks can waste 500-1,000 gallons per day

*Car washing:*
- Running garden hose: 5-10 gallons per minute; a 10-minute car wash uses 50-100 gallons
- Two-bucket method (one soap, one rinse): 8-15 gallons total
- Automatic car wash facilities recycle water and typically use 15-45 gallons per wash -- commercial car washes are often more water-efficient than driveway washing for homeowners without water-recycling equipment

---

### Step 4: Calculate and Rank Savings

For each identified opportunity, calculate three numbers:
1. **Gallons saved per day** (the primary metric -- concrete and motivating)
2. **Annual gallons saved** (daily × 365)
3. **Annual cost savings** -- use the user's actual water rate if known, or the range $3-15 per 1,000 gallons (national range; the U.S. average is approximately $5-7 per 1,000 gallons as of 2024)

To convert gallons saved to dollars: (annual gallons saved ÷ 1,000) × local rate per 1,000 gallons

**Sewer/wastewater billing note:** Most municipal water bills include sewer charges at 1.0-1.5x the water rate. Every gallon of water saved typically saves $1.50-2.50 in combined water and sewer charges. Always factor this into savings calculations -- it often doubles the apparent financial benefit.

Rank actions in four tiers:
- **Free:** Behavioral changes with zero equipment purchase
- **Low cost:** Under $50 total; typically under 3-month payback
- **Moderate cost:** $50-500; typically 6-18 month payback
- **Investment:** $500+; payback period 2-7 years but may have rebate programs that shorten it

---

### Step 5: Apply Renter vs. Owner Filter

Apply this filter to every single recommendation before presenting it:

**Renters CAN do without landlord approval:**
- All behavioral changes (shower length, full loads, tap-off while brushing)
- Installing faucet aerators on standard threaded faucets (these are hand-removable with no damage)
- Installing a removable low-flow showerhead (keep the original; reinstall before moving out)
- Using a shower timer ($3-10)
- Placing a displacement bag in an old toilet tank (reduces per-flush volume by 0.5-1.0 gallon; a plastic bottle filled with water and pebbles works identically)
- Reporting leaks to the landlord (in most U.S. states, landlords are legally required to repair leaks that waste water; document the report in writing)
- Adding mulch to patio containers or small garden areas if permitted

**Renters typically CANNOT do without landlord approval:**
- Toilet replacement
- Any in-wall or under-sink plumbing modifications
- Landscaping changes

**Homeowners can pursue all tiers** including toilet replacement, irrigation controller upgrades, xeriscape conversion, graywater system installation, and rain barrel collection where permitted by law.

**Graywater and rainwater collection note:** Legality varies by state. Arizona, California, Texas, and many western states allow residential graywater reuse and rainwater collection with minimal permitting. Some eastern states historically restricted rainwater collection (Colorado only fully legalized it in 2016). Always recommend the user verify local regulations before installing graywater or rainwater systems.

---

### Step 6: Check for Rebate and Incentive Programs

Before finalizing the plan, always note that many interventions qualify for utility or government rebates that dramatically change the payback calculation:

- **WaterSense toilet rebates:** Many utilities offer $50-200 per toilet replaced with a WaterSense certified model; some cover 50-100% of fixture cost
- **Lawn-to-landscape (turf replacement) rebates:** Western utilities commonly pay $1-5 per square foot of turf removed and replaced with drought-tolerant plants; a 500 sq ft lawn conversion can yield $500-2,500 in rebates
- **Smart irrigation controller rebates:** $50-150 per controller from many western water districts
- **High-efficiency washing machine rebates:** State energy offices and some utilities offer $50-200 for ENERGY STAR certified machines
- **Rain barrel rebates:** $25-75 per barrel in many jurisdictions; some utilities provide them free at distribution events

Recommend the user search "[local utility name] rebates" or visit the EPA WaterSense rebate finder to identify available programs before purchasing anything.

---

### Step 7: Build the Sequential Action Plan

Structure the recommendations as a time-phased action sequence rather than a flat list. Users are more likely to act when they have a clear "what to do this week" versus a long undifferentiated list.

- **This week (free, takes minutes):** Behavioral changes -- shorter showers, full loads, tap off while brushing, water lawn at correct time of day
- **This month (low cost, under $50):** Aerators on all faucets, low-flow showerhead, toilet leak dye test, install shower timer
- **This quarter ($50-500):** Toilet replacement if pre-1994, drip irrigation conversion for garden beds, mulch installation, smart irrigation controller
- **This year ($500+):** Evaluate turf replacement, pool cover if applicable, HE washing machine at end of current machine's life, rain barrel collection

---

### Step 8: Validate the Plan Against the Household Profile

Before finalizing output, cross-check:
- Total projected daily usage after all actions should be within 20-30% of the EPA WaterSense indoor efficiency goal of 52 gallons per person per day for indoor use
- If projected savings exceed 60% of current usage, recalculate -- there may be double-counting
- Confirm every recommendation is tagged renter/owner correctly
- Confirm the most impactful single action is featured prominently -- it is often either outdoor irrigation (arid climates) or toilet replacement (pre-1994 fixtures), not the small behavioral items that feel most familiar
- Confirm leak detection is included regardless of any other recommendations

---

## Output Format

```
## Water Conservation Plan

### Household Profile
| Parameter              | Value                                         |
|------------------------|-----------------------------------------------|
| Household size         | [X adults, X children]                        |
| Housing type           | [Single-family house / Apartment / Condo]     |
| Ownership              | [Owner / Renter]                              |
| Climate zone           | [Arid / Mediterranean / Temperate / Humid]    |
| Estimated daily use    | [X gallons/day]                               |
| Current monthly cost   | $[X] ([X] gallons or [X] CCF if known)        |
| Outdoor water use      | [Yes: lawn / garden / pool / No]              |
| Fixture generation     | [Pre-1994 / 1994-2005 / 2006+]               |

**Baseline context:** [1-3 sentences comparing this household's estimated use to the EPA
indoor average of 82 gallons per person per day and flagging the primary driver
of excess consumption -- e.g., "Your 3.5 GPF toilets are likely responsible for
approximately 50 gallons per day of avoidable indoor use alone."]

---

### Room-by-Room Water Use Assessment

#### Bathroom (est. [X] gallons/day for [X] people)
| Fixture / Habit         | Est. Current Use  | Potential Savings    | Priority  |
|-------------------------|-------------------|----------------------|-----------|
| Toilets ([X] GPF)       | [X] gal/day       | [X] gal/day          | High/Med/Low |
| Showers ([X] min, [X] GPM) | [X] gal/day   | [X] gal/day          | High/Med/Low |
| Bathroom faucets        | [X] gal/day       | [X] gal/day          | High/Med/Low |
| Toilet leak check       | Unknown           | Up to 200+ gal/day if leaking | **Immediate** |

#### Kitchen (est. [X] gallons/day)
| Fixture / Habit         | Est. Current Use  | Potential Savings    | Priority  |
|-------------------------|-------------------|----------------------|-----------|
| Dishwasher / hand wash  | [X] gal/day       | [X] gal/day          | High/Med/Low |
| Kitchen faucet          | [X] gal/day       | [X] gal/day          | High/Med/Low |
| Pre-rinse elimination   | [X] gal/day       | [X] gal/day          | High/Med/Low |

#### Laundry (est. [X] gallons/day)
| Fixture / Habit         | Est. Current Use  | Potential Savings    | Priority  |
|-------------------------|-------------------|----------------------|-----------|
| Washer ([X] type)       | [X] gal/load      | [X] gal/load         | High/Med/Low |
| Load frequency          | [X] loads/week    | [X] gal/week savings | High/Med/Low |

#### Outdoor (est. [X] gallons/day -- include only if applicable)
| Usage                   | Est. Current Use  | Potential Savings    | Priority  |
|-------------------------|-------------------|----------------------|-----------|
| Lawn irrigation         | [X] gal/day       | [X] gal/day          | High/Med/Low |
| Garden beds             | [X] gal/day       | [X] gal/day          | High/Med/Low |
| Pool (if applicable)    | [X] gal/week      | [X] gal/week         | High/Med/Low |

---

### Prioritized Action Plan

#### Phase 1 -- This Week (Free, Behavioral Changes)
| Action                          | Gal Saved/Day | Annual Savings      | Renter OK? |
|---------------------------------|---------------|---------------------|------------|
| [Action]                        | [X] gal       | [X] gal / $[X]      | Yes / No   |

#### Phase 2 -- This Month (Low Cost, Under $50)
| Action                          | Gal Saved/Day | Cost      | Payback     | Renter OK? |
|---------------------------------|---------------|-----------|-------------|------------|
| [Action]                        | [X] gal       | $[X]      | [X] months  | Yes / No   |

#### Phase 3 -- This Quarter (Moderate Cost, $50-$500)
| Action                          | Gal Saved/Day | Cost      | Payback     | Renter OK? |
|---------------------------------|---------------|-----------|-------------|------------|
| [Action]                        | [X] gal       | $[X]      | [X] months  | Yes / No   |

#### Phase 4 -- This Year (Investment, $500+)
| Action                          | Gal Saved/Day | Est. Cost | Payback     | Rebate Available? |
|---------------------------------|---------------|-----------|-------------|-------------------|
| [Action]                        | [X] gal       | $[X]      | [X] years   | Likely / Check    |

---

### Total Savings Potential Summary
| Metric                    | Current Estimate   | After Full Plan    | Total Savings         |
|---------------------------|--------------------|--------------------|-----------------------|
| Daily indoor use          | [X] gal/day        | [X] gal/day        | [X] gal/day ([X]%)   |
| Daily outdoor use         | [X] gal/day        | [X] gal/day        | [X] gal/day ([X]%)   |
| Total daily use           | [X] gal/day        | [X] gal/day        | [X] gal/day           |
| Monthly water + sewer cost| $[X]/month         | $[X]/month         | $[X]/month            |
| Annual cost savings       |                    |                    | **$[X]-$[X]/year**    |
| Annual water saved        |                    |                    | **[X] gallons/year**  |

**Free actions alone (Phase 1) will save approximately [X] gallons/day and $[X]/year.**

---

### Leak Detection Checklist
- [ ] Toilet dye test: add food coloring to tank; wait 15 min without flushing; color in bowl = leak
- [ ] Check water meter with all fixtures off: if meter moves after 30 minutes, there is a hidden leak
- [ ] Inspect under all sink cabinets for moisture, staining, or dripping
- [ ] Check irrigation controller and run each zone visually for broken heads or spray on hardscape
- [ ] Pool bucket test (if applicable): mark levels inside and outside a weighted bucket at pool step; check after 24 hours

---

### Rebate Opportunities to Investigate
- [Specific rebate type relevant to this household] -- check with [local utility type]
- [Additional rebate if applicable]

---

### Co-Benefits Beyond Water Cost
- **Energy savings:** Heating water accounts for 14-18% of household energy use. Reducing hot water consumption (shorter showers, HE washer, low-flow fixtures) reduces both water and energy bills simultaneously
- **Wastewater reduction:** Most municipal bills charge sewer fees equal to 100-150% of water charges. Every gallon saved avoids both a water charge AND a sewer charge
- **Local water supply:** [Climate-specific note -- e.g., "Arizona draws approximately 40% of its water from the Colorado River, which is under severe long-term shortage conditions; household conservation directly reduces pressure on this over-allocated system"]
```

---

## Rules

1. **Always calculate gallons per day as the primary metric** -- never present only percentages. "Saving 20 gallons per day" is more motivating and actionable than "saving 10% of your water use." Percentages must accompany, not replace, concrete volumes.

2. **Leak detection is non-negotiable and must appear in every plan** -- a running toilet leaking 200-1,000 gallons per day makes every other conservation effort irrelevant by comparison. This check costs nothing and must be the first physical action recommended.

3. **Never recommend fixture replacement without first checking fixture generation** -- recommending a low-flow showerhead to someone who already has a 1.8 GPM head wastes their money and erodes trust. Always confirm what they currently have before advising a purchase.

4. **Renter/owner status must gate every single recommendation** -- presenting a toilet replacement recommendation to a renter is unhelpful and can cause the user to dismiss the entire plan as impractical. Tag every item without exception.

5. **Include combined water-plus-sewer savings in all financial calculations** -- presenting only the water charge understates real savings by 50-150% and significantly undersells the plan's financial value to the user.

6. **The dishwasher-vs.-hand-washing finding must always be included for households with dishwashers** -- this is the most commonly held incorrect assumption in household water conservation. Omitting it leaves users actively wasting water while believing they are saving it.

7. **Outdoor irrigation must be calculated separately and prominently** for any homeowner in an arid or Mediterranean climate -- presenting indoor bathroom savings as the top priority for an Arizona homeowner with a lawn actively misdirects their effort toward the smaller problem.

8. **Never recommend water-saving products as free** -- faucet aerators cost $2-8 each, low-flow showerheads cost $15-50. Free actions are behavioral only. Conflating behavioral and equipment recommendations obscures the real cost of the plan.

9. **Always note local rebate availability** -- a toilet that costs $200 with a $100 utility rebate has a 6-month payback instead of a 12-month payback. Omitting this information can cause users to forgo the most financially attractive interventions.

10. **Do not recommend graywater system installation without a jurisdiction legality note** -- graywater regulations vary dramatically by state and even municipality. Presenting graywater reuse as a simple option in states where it requires permitting or is restricted can lead users to install illegal systems.

11. **Savings figures must be presented as ranges, not point estimates** -- water rates vary from $2-15 per 1,000 gallons nationally; household habits vary; fixture performance varies by water pressure and condition. Use realistic low-high ranges and note the key assumption (e.g., "assuming $6 per 1,000 gallons for water and sewer combined").

12. **Cold water washing for laundry saves energy, not water** -- this is a common confusion. Include it only in the energy co-benefits section, never in the water savings tables, to maintain the accuracy of all savings calculations.

---

## Edge Cases

**User has an unusually high bill but cannot identify a cause:**
When a user reports usage significantly above the estimated baseline (more than 30% higher than the household-size formula predicts), treat this as a probable hidden leak scenario. Walk them through the water meter test before anything else: turn off all fixtures and appliances, record the meter reading, wait 30 minutes without using any water, and re-read the meter. If the meter moved, there is a leak somewhere in the system. Common culprits in order of frequency: running toilet flapper (most common), irrigation system with a stuck zone or broken head, dripping outdoor hose bib, under-slab pipe leak (requires professional plumber). Do not build a conservation plan around behavioral changes until hidden leaks are ruled out -- they can account for 100-500+ gallons per day and make behavioral savings irrelevant.

**User is a renter in an apartment with no outdoor access and already efficient habits:**
This is the lowest-savings-potential scenario. The realistic savings are limited to: removing pre-rinse dish rinsing habits (saves ~6,000 gal/year), installing aerators on standard-threaded faucets (saves 5-10 gal/day), installing a removable low-flow showerhead (saves 10-20 gal/day), running only full laundry loads (saves 5-15 gal/load), and reporting any leaks to landlord in writing. Total realistic savings potential may be only 20-40 gallons per day. Present this honestly -- do not inflate savings estimates to seem more helpful. Instead, note that the user is already performing well relative to national averages and that the main remaining opportunities are behavioral consistency and leak reporting.

**User has a swimming pool in an arid climate:**
Pool evaporation in Phoenix or Las Vegas can easily exceed 1,200 gallons per week in summer -- more than all indoor household use combined. The pool cover recommendation must be the first item in the plan, presented as the single-highest-impact action available to this household before any discussion of showerheads or aerators. Quantify it explicitly: "A pool cover preventing 90% of your pool's evaporation will save an estimated 1,000-1,350 gallons per week, or 52,000-70,000 gallons per year -- roughly 5x more than all indoor fixture upgrades combined." Pool covers cost $100-600 depending on type (solar/thermal covers are at the low end; automatic electric covers at the high end). Payback at $5-7 per 1,000 gallons plus sewer savings: typically under 6 months.

**User is in a water-restrictive jurisdiction with mandatory watering schedules:**
Some municipalities assign watering days by address (odd/even) or limit irrigation to specific hours. Acknowledge this constraint explicitly and build the plan within it rather than recommending schedules that would violate restrictions. The focus shifts to efficiency per watering event: cycle-and-soak programming, proper irrigation head adjustment to eliminate overspray onto hardscape, drip conversion for beds, and mulching to maximize soil moisture retention between allowed watering days. Also note that many utilities with restrictions offer free irrigation system audits and smart controller rebates precisely because outdoor water is where restrictions have the most impact.

**User has pre-1994 toilets throughout a multi-bathroom home:**
This is the highest-ROI indoor scenario. A family of 4 with four 3.5 GPF toilets uses approximately 77 gallons per day on toilet flushing alone. Replacing all four with WaterSense 1.28 GPF models reduces this to approximately 28 gallons per day -- a savings of 49 gallons per day, or 17,885 gallons per year. At $6 per 1,000 gallons combined water and sewer: $107/year savings. Each toilet costs $150-350 installed; many utilities offer $50-150 rebates. Payback: 12-24 months even without rebates, often 6-12 months with rebates. Present this as the primary investment recommendation, above any outdoor work, for a temperate-climate homeowner with old toilets.

**User mentions they are in a severe drought emergency and worried about water access:**
If the user signals genuine emergency concern (day-zero language, severe rationing, well levels dropping), acknowledge the seriousness and shift tone from bill-optimization to genuine conservation prioritization. Focus first on: eliminating all non-essential outdoor use (this is the fastest 30-50% reduction for homeowners with lawns), then maximum indoor reduction through behavioral changes (no baths, 3-minute military showers, full loads only, dishwasher only). Note that this skill does not cover emergency water storage, alternative water sources, or municipal emergency response -- refer the user to their local water utility's emergency conservation guidelines for those elements.

**User in a humid, high-rainfall climate (Pacific Northwest, Southeast) questions whether conservation matters:**
Even in high-rainfall regions, indoor conservation reduces two costs that never disappear: energy for water heating and sewer/wastewater treatment charges. A Seattle household still pays for every gallon it uses regardless of watershed abundance. Additionally, many humid-climate cities face infrastructure strain and aging sewer systems that overflow during high-use periods. Frame conservation as a financial and infrastructure benefit even when water scarcity is not the primary concern. Savings targets will be lower (15-25% realistic for efficient arid households; 10-20% for already-efficient humid households), but the financial case remains valid.

---

## Example

**Input:** "I live in Tucson, Arizona in a house I own. There are 3 of us -- me, my partner, and our 11-year-old. Our water bill has been around $120 per month lately and I know it's higher than it should be. We have a medium-sized front lawn, some desert garden beds in back, and no pool. The house was built in 1989. What can we do?"

**Output:**

---

## Water Conservation Plan

### Household Profile
| Parameter              | Value                                                         |
|------------------------|---------------------------------------------------------------|
| Household size         | 3 (2 adults, 1 child age 11)                                  |
| Housing type           | Single-family house                                           |
| Ownership              | Owner                                                         |
| Climate zone           | Arid (Tucson, AZ -- avg. annual rainfall ~12 inches)          |
| Estimated daily use    | 400-500 gallons/day (based on $120 bill, Tucson rates ~$5-7/1,000 gal water + sewer) |
| Current monthly cost   | $120/month                                                    |
| Outdoor water use      | Yes: medium front lawn + desert garden beds in back           |
| Fixture generation     | Likely 1989-vintage (pre-1994 plumbing standard) -- 3.5 GPF toilets highly probable |

**Baseline context:** The EPA indoor efficiency target is 82 gallons per person per day; your estimated household of 3 should use approximately 246 gallons per day indoors if fixtures are average. Your $120 bill suggests 400-500 gallons per day total, meaning roughly 150-250 gallons per day is going to outdoor irrigation -- typical for a Tucson home with turf lawn in summer. Your 1989 build date is a critical flag: that home almost certainly has 3.5 GPF toilets installed before the 1994 federal 1.6 GPF mandate, which are likely your single largest indoor waste source. Address the lawn and the toilets and you will capture 70%+ of your total savings potential.

---

### Leak Detection -- Do This First

Before any other action, perform these two checks. Hidden leaks routinely add 50-500+ gallons per day to Tucson water bills.

- [ ] **Toilet dye test:** Add 10 drops of food coloring to each toilet tank. Wait 15 minutes without flushing. If any color appears in the bowl, the flapper is leaking -- a $5-10 part that can waste 30-200 gallons per day per toilet
- [ ] **Water meter test:** Record the meter reading with all water off. Wait 30 minutes. If the meter moves, you have a hidden leak somewhere in the system (irrigation valve, hose bib, supply line)
- [ ] **Visual irrigation inspection:** Run each irrigation zone manually and watch for broken heads, heads spraying sidewalk or fence, or zones that won't shut off

---

### Room-by-Room Water Use Assessment

#### Bathroom (estimated 110-130 gallons/day for 3 people with 1989 fixtures)

| Fixture / Habit                  | Est. Current Use       | Potential Savings         | Priority     |
|----------------------------------|------------------------|---------------------------|--------------|
| Toilets (likely 3.5 GPF, 2 toilets) | 57-63 gal/day (3 people × 5.5 flushes × 3.5 GPF) | 38-45 gal/day replacing with 1.28 GPF | **Highest** |
| Showers (3 showers/day, ~8 min, 2.5 GPM) | 60 gal/day          | 12-24 gal/day (low-flow head + 2 min shorter) | High |
| Bathroom faucets (tap-on habits) | 18-26 gal/day         | 10-18 gal/day (aerators + behavior) | Medium |
| Toilet leak check                | Unknown               | Up to 200+ gal/day if leaking | **Immediate** |

#### Kitchen (estimated 25-35 gallons/day)

| Fixture / Habit                  | Est. Current Use       | Potential Savings         | Priority     |
|----------------------------------|------------------------|---------------------------|--------------|
| Kitchen faucet                   | 15-20 gal/day         | 5-7 gal/day (1.5 GPM aerator) | Medium     |
| Pre-rinsing dishes before dishwasher | 8-15 gal/day       | 8-15 gal/day (stop pre-rinsing entirely) | High |
| Running tap until cold for drinking | 5-8 gal/day         | 5-8 gal/day (use refrigerator pitcher) | Medium  |

#### Laundry (estimated 25-40 gallons/day assuming top-loader)

| Fixture / Habit                  | Est. Current Use       | Potential Savings         | Priority     |
|----------------------------------|------------------------|---------------------------|--------------|
| Washer type (est. top-loading, 1989 vintage) | 40-45 gal/load | 15-25 gal/load if replaced with HE front-loader | Low (only at end of machine life) |
| Load optimization (running full loads only) | Varies         | 5-15 gal/week if any partial loads | Medium  |

#### Outdoor (estimated 150-250 gallons/day during Tucson irrigation season -- April through October)

| Usage                            | Est. Current Use       | Potential Savings         | Priority     |
|----------------------------------|------------------------|---------------------------|--------------|
| Front lawn sprinkler irrigation  | 120-200 gal/day (season avg.) | 90-170 gal/day (xeriscape conversion) | **Highest** |
| Irrigation timing (watering mid-day) | Adds 30-40% waste to above | 40-80 gal/day (shift to pre-7 AM) | **High -- free** |
| Desert garden beds (overhead spray vs. drip) | 20-40 gal/day | 10-20 gal/day (convert to drip + mulch) | High |
| Evaporation from unmulched soil  | Included above         | 5-10 gal/day (3" mulch on beds) | High         |

---

### Prioritized Action Plan

#### Phase 1 -- This Week (Free, Behavioral Changes)
| Action                                    | Gal Saved/Day | Annual Savings            | Renter OK? |
|-------------------------------------------|---------------|---------------------------|------------|
| Shift all lawn watering to before 7 AM    | 40-80 gal     | 14,600-29,200 gal / $73-$204 | Owner only |
| Shorten each shower by 2 minutes          | 10-15 gal     | 3,650-5,475 gal / $18-$38 | Yes        |
| Turn off tap while brushing teeth (3 people) | 13-18 gal  | 4,745-6,570 gal / $24-$46 | Yes        |
| Stop pre-rinsing dishes before dishwasher | 8-15 gal      | 2,920-5,475 gal / $15-$38 | Yes        |
| Refrigerator pitcher for drinking water   | 5-8 gal       | 1,825-2,920 gal / $9-$20  | Yes        |
| Run only full dishwasher and laundry loads | 5-12 gal     | 1,825-4,380 gal / $9-$31  | Yes        |

**Phase 1 Total: approximately 81-148 gallons/day saved, $148-$377/year, at zero cost.**

---

#### Phase 2 -- This Month (Low Cost, Under $50)
| Action                                    | Gal Saved/Day | Cost        | Payback      | Renter OK? |
|-------------------------------------------|---------------|-------------|--------------|------------|
| Low-flow showerhead (1.8 GPM) -- 2 bathrooms | 14-21 gal  | $30-60      | 1-2 months   | Yes (removable) |
| Faucet aerators on all 4-5 faucets        | 10-18 gal     | $10-25      | Under 1 month| Yes (removable) |
| Toilet leak dye test + flapper replacement if needed | Up to 200 gal/day if leak | $5-10 per flapper | Immediate | Yes (report to landlord; owner repairs own) |
| Shower timer (suction-cup, 5-min)         | Behavioral reinforcement | $5-10 | Immediate  | Yes        |
| 3-inch mulch layer on all desert garden beds | 10-15 gal  | $20-40      | 1-2 months   | Owner      |

**Phase 2 Total: approximately 34-54 gallons/day additional savings (excluding leak), $40-$95 investment, payback under 2 months.**

---

#### Phase 3 -- This Quarter (Moderate Cost, $50-$500)
| Action                                    | Gal Saved/Day | Cost        | Payback      | Renter OK? |
|-------------------------------------------|---------------|-------------|--------------|------------|
| Replace both toilets with WaterSense 1.28 GPF | 38-45 gal | $300-700 installed | 8-18 months (6-10 months after Tucson Water rebate of $75-150/toilet) | Owner only |
| Convert back garden beds to drip irrigation | 10-20 gal  | $80-200     | 4-8 months   | Owner only |
| Upgrade irrigation controller to smart/ET model | 20-40 gal (season) | $100-200 | 4-8 months | Owner only |

**Tucson Water Rebate Note:** Tucson Water offers rebates for WaterSense toilets ($75-150 per toilet) and smart irrigation controllers. Check tucsonaz.gov/water or call (520) 791-3242 before purchasing -- these rebates often cover 30-50% of equipment cost and significantly accelerate payback.

---

#### Phase 4 -- This Year (Investment, $500+)
| Action                                    | Gal Saved/Day | Est. Cost     | Payback     | Rebate Available?    |
|-------------------------------------------|---------------|---------------|-------------|----------------------|
| Convert front lawn to desert-adapted xeriscape | 90-170 gal | $1,500-4,000 | 2-5 years   | **Yes -- Tucson Water pays $1.00-2.00/sq ft turf removed** |
| Replace top-loading washer with HE front-loader at end of life | 15-25 gal/load | $600-1,200 | 3-5 years | Check APS/TEP rebates |

**Xeriscape rebate math:** If your front lawn is 400 square feet, Tucson Water may pay $400-800 toward the conversion. Native plants (palo verde, desert willow, brittlebush, agave) require minimal supplemental irrigation after establishment (typically 2-3 years) and then survive on Tucson's natural rainfall. This eliminates 90-170 gallons per day of irrigation demand for 6-7 months per year.

---

### Total Savings Potential Summary

| Metric                     | Current Estimate     | After Full Plan      | Total Savings            |
|----------------------------|----------------------|----------------------|--------------------------|
| Daily indoor use           | ~245 gal/day         | ~120 gal/day         | ~125 gal/day (51%)       |
| Daily outdoor use (season avg.) | ~175 gal/day   | ~25 gal/day          | ~150 gal/day (86%)       |
| **Total daily use**        | **~420 gal/day**     | **~145 gal/day**     | **~275 gal/day (65%)**   |
| Monthly cost (water + sewer) | $120/month         | ~$40-50/month        | **~$70-80/month**        |
| Annual cost savings        |                      |                      | **$840-960/year**        |
| Annual water saved         |                      |                      | **~100,000 gallons/year** |

**Phase 1 (free behavioral changes) alone will save approximately $148-377/year starting immediately.**

---

### Your Sequential Next Steps

1. **Today:** Perform toilet dye test and water meter test. A running toilet in a 1989 home is common and could be adding $15-30/month to your bill alone. Fix any leaking flapper before anything else.
2. **This week:** Shift all irrigation to before 7 AM. Start 2-minute-shorter showers. Stop pre-rinsing dishes. These three changes cost nothing and save an estimated 55-110 
