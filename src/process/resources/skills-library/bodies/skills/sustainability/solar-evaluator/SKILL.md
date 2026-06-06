---
name: solar-evaluator
description: |
  Comprehensive guide for evaluating residential solar energy systems including system sizing calculations, roof assessment, net metering policies, ROI analysis with payback period calculation, installer comparison framework, federal and state incentives (ITC, SRECs), battery storage considerations, financing options, and ongoing maintenance requirements.
  Use when the user asks about solar evaluator, or needs help with comprehensive guide for evaluating residential solar energy systems including system sizing calculations, roof assessment, net metering policies, roi analysis with payback period calculation, installer comparison framework, federal and state incentives (itc, srecs), battery storage considerations, financing options, and ongoing maintenance requirements.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of solar evaluator.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sustainability energy-efficiency guide"
  category: "sustainability"
  subcategory: "sustainable-living"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Solar Energy Evaluator

## When to Use

**Use this skill when:**
- User asks about solar evaluator
- User needs guidance on solar evaluator topics
- User wants a structured approach to solar evaluator

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask First

1. What is your average monthly electricity bill (in dollars and kWh)?
2. What is your roof's age, condition, and material?
3. What direction does your roof primarily face (south is ideal in the Northern Hemisphere)?
4. Are there significant shading factors (trees, buildings, chimneys)?
5. What is your utility company, and do they offer net metering?
6. How long do you plan to stay in this home?
7. What is your budget, and are you considering purchase, loan, or lease?
8. Have you checked your area's solar irradiance (sun hours per day)?
9. Are you interested in battery storage, or grid-tied only?
10. Have you already received any solar quotes?

---

## Phase 1: System Sizing Calculation

### Step 1: Determine Your Energy Consumption

```
Monthly electricity usage (from utility bill): _______ kWh
Annual electricity usage: _______ kWh (monthly x 12, or sum from 12 months of bills)

Adjustment for future changes:
  - Adding EV? Add 3,000-5,000 kWh/year
  - Adding heat pump? Add based on estimate
  - Reducing consumption? Subtract estimated savings

Adjusted Annual Usage: _______ kWh
```

### Step 2: Calculate System Size Needed

```
System Size (kW) = Annual kWh Needed / (Peak Sun Hours x 365 x System Efficiency)

System Efficiency: ~0.80 (accounts for inverter losses, wiring, temperature, soiling)

Example:
  Annual Usage: 10,000 kWh
  Peak Sun Hours: 5.0 (varies by location -- check PVWatts)
  System Size = 10,000 / (5.0 x 365 x 0.80) = 6.85 kW

Round up slightly: 7 kW system
```

### Step 3: Estimate Panel Count

```
Number of Panels = System Size (watts) / Panel Wattage

Example:
  System Size: 7,000 watts (7 kW)
  Panel Wattage: 400 watts (current standard)
  Panels Needed: 7,000 / 400 = 17.5, round to 18 panels

Roof Space Needed: ~18 sq ft per panel x 18 panels = ~324 sq ft
```

### Peak Sun Hours by Region (US Averages)

| Region | Peak Sun Hours | Example Cities |
|--------|---------------|----------------|
| Southwest | 5.5-7.0 | Phoenix, Las Vegas, Albuquerque |
| Southeast | 4.5-5.5 | Miami, Atlanta, Charlotte |
| Midwest | 4.0-5.0 | Kansas City, Indianapolis, St. Louis |
| Northeast | 3.5-4.5 | New York, Boston, Philadelphia |
| Northwest | 3.5-4.5 | Seattle, Portland (lower in winter) |
| Mountain | 5.0-6.0 | Denver, Salt Lake City |

**Use NREL's PVWatts Calculator (pvwatts.nrel.gov) for precise local data.**

---

## Phase 2: Roof Assessment

### Roof Evaluation Checklist

| Factor | Ideal | Acceptable | Problematic |
|--------|-------|-----------|-------------|
| Age | Under 10 years old | 10-15 years (may need replacement first) | Over 20 years (replace before installing solar) |
| Condition | No damage, leaks, or wear | Minor wear, no active leaks | Active leaks, missing shingles, sagging |
| Material | Composite shingle, metal, tile | Flat/membrane roof | Wood shake (fire risk), slate (fragile) |
| Direction | South-facing | Southwest or southeast | North-facing (poor production in Northern Hemisphere) |
| Pitch | 15-40 degrees | 0-15 or 40-60 degrees | Very steep (>60 degrees) |
| Shading | No shading 9AM-3PM | Minor shading (1-2 hours) | Significant shading (>3 hours) |
| Structural | Can support ~2.5 lbs/sq ft additional load | Needs verification | Cannot support additional weight |
| Obstructions | Large unbroken roof area | Vents, skylights (can work around) | Many dormers, complex roof geometry |

### Shading Analysis

**Tools for shading assessment:**
- Google Project Sunroof (google.com/get/sunroof) -- free, satellite-based
- Solar installer site visit with shade analysis tool (SunEye, Solmetric)
- PVWatts calculator with shading adjustments
- Satellite imagery review (Google Earth)

**Impact of shading:** Even partial shading on one panel can significantly reduce output of an entire string of panels (with traditional string inverters). Microinverters or power optimizers can mitigate this.

---

## Phase 3: Financial Analysis

### System Cost Estimation

```
SOLAR SYSTEM COST ESTIMATE
============================
System Size: _______ kW

Gross System Cost (before incentives):
  Average cost per watt: $2.50-$3.50 (varies by market)
  System cost: _______ kW x 1,000 x $______/watt = $__________

Federal Investment Tax Credit (ITC):
  Current ITC rate: 30% (through 2032, then steps down)
  ITC value: $__________ x 30% = $__________

State/Local Incentives:
  State tax credit: $__________
  Utility rebate: $__________
  SREC income (est. annual): $__________
  Other incentives: $__________
  Total state/local incentives: $__________

Net System Cost:
  Gross cost: $__________
  - Federal ITC: $__________
  - State/local incentives: $__________
  = Net Cost: $__________
```

### ROI and Payback Period Calculation

```
PAYBACK PERIOD ANALYSIS
========================
Net System Cost (after incentives): $__________

Annual Savings:
  Annual electricity production: _______ kWh
  Utility rate: $_______ /kWh
  Annual electric bill savings: $__________
  + Net metering credits (if applicable): $__________
  + SREC income (if applicable): $__________
  Total Annual Savings: $__________

Simple Payback Period:
  Net Cost / Annual Savings = _______ years

25-Year Financial Analysis:
  Total savings over 25 years: $__________
  (Account for 2-3% annual utility rate increases)
  Net profit over system life: $__________
  Return on Investment: _________%
```

### Typical Financial Benchmarks

| Metric | Good | Average | Poor |
|--------|------|---------|------|
| Payback period | Under 7 years | 7-12 years | Over 12 years |
| 25-year savings | Over $30,000 | $15,000-$30,000 | Under $15,000 |
| Year 1 savings | Over $1,500 | $800-$1,500 | Under $800 |
| Cost per watt (before incentives) | Under $2.75 | $2.75-$3.50 | Over $3.50 |

---

## Phase 4: Net Metering

### How Net Metering Works

When your solar panels produce more electricity than you are using, the excess is sent to the grid. Net metering policies determine how you are credited for that excess.

**Full Retail Net Metering:** You receive a credit at the full retail rate for every kWh exported. This is the most favorable for homeowners.

**Reduced Rate Net Metering:** Credits are calculated at a lower rate than retail (wholesale, avoided cost, or a set rate).

**Net Billing / Buy-All-Sell-All:** You sell all production to the utility at one rate and buy all consumption at another.

**Time-of-Use (TOU) Net Metering:** Credits vary based on when you export (more valuable during peak hours, less during off-peak).

### Questions to Ask Your Utility
- Do you offer net metering?
- At what rate are credits calculated?
- Do credits roll over month to month? Do they expire?
- Is there a system size cap for net metering?
- Are there additional fees for solar customers (grid access fees)?
- What is the interconnection process and timeline?
- Are there any pending changes to net metering policy?

---

## Phase 5: Incentive Programs

### Federal Investment Tax Credit (ITC)

| Year | Credit Rate | Notes |
|------|------------|-------|
| 2022-2032 | 30% | Inflation Reduction Act extended and increased |
| 2033 | 26% | Step-down begins |
| 2034 | 22% | Further reduction |
| 2035+ | 0% (residential) | May be extended by future legislation |

**Requirements:**
- Must own the system (not lease)
- Must have sufficient tax liability to use the credit
- Credit can be carried forward to future tax years
- Applies to solar panels, inverters, racking, installation labor, battery storage

### State and Local Incentives

**Common state-level incentives:**
- State tax credits (additional percentage or fixed amount)
- Property tax exemptions (solar does not increase property tax assessment)
- Sales tax exemptions (no sales tax on solar equipment)
- Renewable portfolio standard (RPS) incentives
- SRECs (Solar Renewable Energy Certificates)
- State rebate programs
- Low-interest loan programs

**Finding incentives in your area:**
- DSIRE database (dsireusa.org) -- comprehensive database of incentives by state
- EnergySage (energysage.com) -- incentive calculator
- Your state's energy office website
- Your utility company's website

### SRECs (Solar Renewable Energy Certificates)
In some states, solar system owners earn SRECs based on electricity production. These certificates can be sold on a market. One SREC = 1,000 kWh (1 MWh) of solar production.

**States with active SREC markets:** New Jersey, Massachusetts, Pennsylvania, Maryland, Washington DC, Illinois, Ohio (partial list -- check current status).

**Potential SREC income:** $20-$400+ per SREC depending on the state market.

---

## Phase 6: Installer Comparison

### Getting and Comparing Quotes

**Get at least 3 quotes. For each, document:**

```
SOLAR INSTALLER COMPARISON
============================
                    Installer A   Installer B   Installer C
Company Name:       ___________   ___________   ___________
Years in Business:  ___________   ___________   ___________
License Verified:   Y / N         Y / N         Y / N
Insurance Verified: Y / N         Y / N         Y / N
NABCEP Certified:   Y / N         Y / N         Y / N

SYSTEM DETAILS:
Panel Brand/Model:  ___________   ___________   ___________
Panel Wattage:      ___________   ___________   ___________
Number of Panels:   ___________   ___________   ___________
Total System Size:  ___________   ___________   ___________
Inverter Type:      ___________   ___________   ___________
Inverter Brand:     ___________   ___________   ___________
Racking System:     ___________   ___________   ___________

PRODUCTION ESTIMATE:
Year 1 Production:  ___________   ___________   ___________
Production Guarantee: Y / N       Y / N         Y / N

COST:
Gross Price:        $__________   $__________   $__________
Cost per Watt:      $__________   $__________   $__________
After Federal ITC:  $__________   $__________   $__________
After All Incentives: $________   $__________   $__________

WARRANTIES:
Panel Warranty:     ___________   ___________   ___________
Inverter Warranty:  ___________   ___________   ___________
Workmanship Warranty: _________   ___________   ___________
Roof Penetration:   ___________   ___________   ___________

REVIEWS/REFERENCES:
Google Rating:      ___________   ___________   ___________
BBB Rating:         ___________   ___________   ___________
References Checked: Y / N         Y / N         Y / N
```

### Inverter Types Comparison

| Type | Pros | Cons | Best For |
|------|------|------|----------|
| String inverter | Lowest cost, proven technology | One shaded panel affects entire string | Unshaded roofs, simple layouts |
| Microinverters | Panel-level optimization, better for shading | Higher cost, more components | Shaded roofs, complex layouts |
| Power optimizers + string inverter | Panel-level optimization, central inverter monitoring | Moderate cost, added complexity | Mixed shading, multiple orientations |

---

## Phase 7: Battery Storage

### When Battery Storage Makes Sense

**Good reasons to add batteries:**
- Time-of-use rate structure (charge during cheap/solar hours, use during expensive peak hours)
- Poor net metering policy (low export rate)
- Frequent power outages
- Desire for energy independence
- Off-grid applications

**When batteries may NOT make financial sense:**
- Full retail net metering available (the grid acts as your battery for free)
- Reliable grid with rare outages
- Limited budget (panels first, batteries can be added later)

### Battery Comparison

| Metric | Tesla Powerwall | Enphase IQ | LG RESU | Generac PWRcell |
|--------|----------------|-----------|---------|-----------------|
| Capacity | 13.5 kWh | 3.36-10.08 kWh (modular) | 9.6-16 kWh | 9-18 kWh (modular) |
| Power Output | 5 kW continuous | Varies by config | 5-7 kW | 4.5-9 kW |
| Warranty | 10 years | 10-15 years | 10 years | 10 years |
| Approximate Cost (installed) | $12,000-$16,000 | $10,000-$20,000 | $10,000-$14,000 | $12,000-$20,000 |

**Note:** Battery prices and specifications change frequently. Verify current pricing with installers.

### Battery Sizing

```
Battery Size Needed = Critical Load (kWh) x Hours of Backup Desired

Essential loads during outage:
  Refrigerator: ~1.5 kWh/day
  Lights: ~1 kWh/day
  Phone/device charging: ~0.5 kWh/day
  Wi-Fi router: ~0.25 kWh/day
  Sump pump (if needed): ~1 kWh/day
  Medical equipment: varies

Example: 4 kWh/day essential load x 2 days backup = 8 kWh minimum
(Account for ~90% depth of discharge = need ~9 kWh rated capacity)
```

---

## Phase 8: Financing Options

### Comparison of Financing Methods

| Method | Ownership | Upfront Cost | Monthly Cost | ITC Eligible | Best For |
|--------|-----------|-------------|-------------|-------------|----------|
| Cash purchase | You own | Full cost | $0 | Yes | Maximum long-term savings |
| Solar loan | You own | $0-low | Loan payment | Yes | Good credit, want ownership |
| Home equity loan/HELOC | You own | $0 | Loan payment | Yes (interest may be deductible) | Significant home equity |
| Solar lease | Company owns | $0 | Monthly lease | No (company claims) | Low/no upfront, lower savings |
| PPA (Power Purchase Agreement) | Company owns | $0 | Per kWh rate | No (company claims) | Low/no upfront, predictable cost |

### Financial Decision Framework

**If you can afford to buy (cash or loan): BUY.**
- You receive the federal ITC and all incentives
- You own the system and the increased home value
- Maximum lifetime financial benefit
- No escalation clauses or contract complications

**If cash purchase is not possible:**
- Solar loan is the next best option (you still get ITC)
- Ensure the loan payment is less than your current electric bill savings
- Avoid balloon payments or variable rate loans
- Compare at least 3 lenders

**Lease/PPA is better than nothing, but understand:**
- You do not own the system
- Savings are typically 10-30% of current bill (vs. 50-100% with ownership)
- Escalation clauses may increase payments annually
- Can complicate home sale (buyer must assume or you must buy out)
- You do not receive the ITC or other incentives

---

## Phase 9: Ongoing Maintenance

### Solar System Maintenance Schedule

| Task | Frequency | DIY or Professional | Cost |
|------|-----------|-------------------|------|
| Visual inspection (look for damage, debris) | Monthly | DIY | Free |
| Monitor production (via app or inverter) | Weekly/monthly | DIY | Free |
| Panel cleaning (if needed) | 1-2x per year | DIY or professional | $0-$300 |
| Professional inspection | Every 3-5 years | Professional | $150-$300 |
| Inverter replacement | Every 10-15 years (string) | Professional | $1,000-$2,500 |
| Tree trimming (for shading prevention) | As needed | Professional | Varies |

### Monitoring Your System
- Most modern systems include monitoring apps
- Check daily/weekly production against expected output
- Sudden drops in production may indicate a problem
- Compare month-over-month and year-over-year production
- Report anomalies to your installer (usually covered under warranty)

### Panel Longevity
- Most panels are warranted for 25-30 years
- Panels degrade approximately 0.3-0.5% per year
- After 25 years, expect ~85-90% of original production
- Many panels continue producing well beyond warranty period

Solar is a long-term investment. Take the time to analyze your specific situation thoroughly, get multiple quotes, and understand all the financial implications before committing. When the numbers work, solar provides decades of clean energy and significant savings.


## Output Format

```
SOLAR EVALUATOR OUTPUT
======================

Section 1: Assessment / Analysis
- Key findings
- Recommendations

Section 2: Action Plan
- Step-by-step guidance
- Timeline if applicable

Section 3: Resources
- Relevant references
- Next steps
```

## Example

**Input:** "Help me get started with solar evaluator"

**Output:** A structured solar evaluator plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
