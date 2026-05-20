---
name: home-energy-audit
description: |
  Conducts a room-by-room home energy audit identifying energy loss points and producing a prioritized fix list with estimated kWh savings, cost per fix, and payback period. Gathers the user's housing type, climate zone, current energy costs, and budget to produce an actionable energy reduction plan distinguishing renter-accessible from homeowner-only improvements.
  Use when the user asks about reducing home energy bills, finding energy leaks, conducting an energy audit, improving home insulation, or lowering heating and cooling costs.
  Do NOT use for commercial building energy audits, HVAC system design or installation, solar panel evaluation as an investment, or utility-scale energy efficiency programs.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "energy-efficiency sustainability checklist planning"
  category: "sustainability"
  subcategory: "home-sustainability"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Home Energy Audit

## When to Use

**Use this skill when:**
- The user asks about reducing home energy bills, electricity costs, or monthly utility spending and wants to understand where the money is going
- The user describes specific comfort problems -- rooms that are always cold or hot, drafts near windows or doors, humidity issues, ice dams on the roof -- that suggest energy loss
- The user explicitly asks about conducting a DIY energy audit, a home energy assessment, or wants to "find energy leaks"
- The user mentions unusually high heating or cooling bills relative to their home size and wants a systematic diagnostic approach
- The user wants to prioritize energy efficiency improvements by cost-effectiveness and is deciding what to fix first with a limited budget
- The user asks about insulation levels, air sealing, weatherstripping, duct efficiency, or any specific component of residential energy performance
- The user is preparing to buy or sell a home and wants to assess its energy performance before committing or listing

**Do NOT use when:**
- The user is asking about a commercial, retail, industrial, or multi-unit apartment building energy audit -- those require ASHRAE Level I/II/III methodology and are a separate domain
- The user wants detailed HVAC system design, sizing calculations (Manual J), or duct design (Manual D) -- refer those to a mechanical engineer or certified HVAC contractor
- The user is evaluating rooftop solar as a financial investment -- that requires a separate solar-specific ROI analysis skill covering panel sizing, net metering, and incentive stacking
- The user asks for specific utility rebate amounts or program enrollment details -- rebate structures change frequently and vary by provider; direct the user to the DSIRE database or their utility's website for current program information
- The user needs a certified energy audit for regulatory compliance, green building certification (ENERGY STAR, LEED, Passive House), or for satisfying a mortgage lender requirement -- those require a BPI-certified or RESNET-certified auditor with calibrated equipment
- The user is asking about new construction energy code compliance -- that is a building code topic, not a retrofit audit topic
- The user wants to calculate whole-home net-zero energy requirements -- that involves load modeling software (EnergyPlus, BEopt) beyond DIY scope

---

## Process

### Step 1: Gather the Home and Energy Profile

Before conducting any diagnostic work, collect the minimum viable dataset. Missing any of these inputs will cause the prioritization to be wrong.

- **Housing type:** Single-family detached, townhouse/rowhouse, semi-detached, apartment (above-grade, below-grade, middle floor), mobile/manufactured home. Townhouse end-units behave more like detached homes; middle units have two protected shared walls and significantly lower heat loss.
- **Ownership status:** Owner or renter. This single variable determines which of the two fix lists to generate. Ask explicitly -- many users assume all improvements require ownership.
- **Square footage and stories:** Single-story homes lose disproportionately more energy through the attic (larger attic-to-floor ratio). Two-story homes have more wall area relative to floor area.
- **Year built:** Group into construction eras: pre-1940 (likely no insulation, balloon-frame construction), 1940-1970 (minimal insulation, single-pane windows common), 1971-1992 (first energy codes, often R-11 walls and R-19 attics -- undersized for today), 1993-2006 (Model Energy Code adoption, R-13 walls, R-30 attics), 2007-present (IECC cycle adoption, better air sealing required). Year built is a strong predictor of likely insulation levels and common failure modes.
- **Climate zone:** Use the IECC climate zone map as the reference framework. Zones 1-2 (hot-humid, FL, southern TX, HI) are cooling-dominant. Zones 3-4 (mixed, mid-Atlantic, Pacific Northwest, northern CA) are mixed. Zones 5-7 (cold, upper Midwest, New England, mountain states) are heating-dominant. Zone 8 (subarctic, AK) requires extreme insulation strategies. If the user gives a city or state, map it to a zone explicitly.
- **Heating system type and fuel:** Gas furnace, oil furnace, propane furnace, electric resistance (baseboard or furnace), air-source heat pump, ground-source heat pump, mini-split heat pump, wood/pellet stove, or combination. Fuel type determines cost per unit of useful heat -- a critical variable for calculating savings. Natural gas is typically $0.80-$1.50/therm; electricity is typically $0.12-$0.22/kWh nationally; propane is $2.00-$4.00/gallon; heating oil is $3.00-$5.00/gallon.
- **Cooling system type:** Central AC, window units, mini-split, evaporative cooler, heat pump (same unit as heating), or none.
- **Current monthly bills:** Ask for a summer high, a winter high, and a spring/fall low -- not just an average. The swing between baseline and peak tells you how much of the bill is thermal conditioning vs. plug loads. A home using $80/month in spring and $280/month in January has a $200/month heating penalty that is the diagnostic target.
- **Known comfort problems:** Ask directly -- "Are there rooms that are always too cold in winter or too hot in summer? Do you notice drafts near windows, doors, or outlets? Have you had ice dams, high humidity, or condensation on windows?" These are symptom-diagnosis clues.
- **Budget range:** Free fixes only, under $500, under $2,000, or no cap. This shapes which tier of the fix list to emphasize.

---

### Step 2: Conduct the Room-by-Room Diagnostic Assessment

Work systematically from the top of the home down (attic to basement), because thermal bypasses and air leaks follow the stack effect -- warm air rises and escapes at the top, drawing cold air in at the bottom.

**Attic (always inspect first -- it is the highest-leverage zone):**
- Measure existing insulation depth with a ruler or tape measure. Multiply depth by R-value per inch to get approximate total R-value:
  - Fiberglass batts: R-2.9 to R-3.8 per inch
  - Blown fiberglass: R-2.2 to R-2.7 per inch
  - Blown cellulose: R-3.2 to R-3.8 per inch
  - Open-cell spray foam: R-3.7 per inch
  - Closed-cell spray foam: R-6.0 to R-6.5 per inch
- Compare measured R-value to IECC targets: Zone 5 (Ohio, Illinois, Massachusetts): R-49 to R-60. Zone 4 (Virginia, Tennessee, Oregon): R-38 to R-49. Zone 3 (Texas, Georgia, Carolinas): R-30 to R-38. Zone 2 (Florida, southern Texas): R-30 minimum.
- Check attic hatch: Most hatches are uninsulated drywall -- effective R-1. This single gap can account for 5-15% of attic heat loss.
- Inspect for bypasses before recommending insulation: gaps around light fixtures (especially recessed can lights), top plates of interior partition walls, plumbing and electrical penetrations, chimney chases, and dropped ceilings (soffits above kitchen cabinets often open into attic). Bypasses must be air-sealed before insulation is added -- insulating over unsealed bypasses reduces but does not eliminate the problem.
- Recessed can lights (non-IC-rated, pre-2000 type): each can light in an attic floor is both an air leak and a thermal bridge. Estimate 1-3 CFM air leakage per fixture.
- Attic ductwork: if supply or return ducts run through the attic, check for disconnected joints, holes at boot connections, and uninsulated duct surfaces. Ducts in unconditioned attic space lose 20-30% of conditioned air to the attic in leaky systems.

**Exterior Walls (inspect from inside):**
- On a cold day, use an infrared thermometer (a $20-30 tool) pointed at the center of exterior wall surfaces. Wall surface temperatures more than 5-7F below room air temperature indicate inadequate insulation. Corners and around window frames will always be cooler -- check wall centers specifically.
- Electrical outlets and switches on exterior walls: remove the cover plate (with power off) and check for insulation behind. The cavity should be packed with insulation flush to the back of the box. An empty cavity means the wall is uninsulated or the insulation has settled. Foam gaskets behind cover plates cost $0.50 each and take 10 minutes to install -- a universally good first action.
- For 2x4 framing (pre-1990 construction), maximum cavity depth is 3.5 inches, limiting cavity insulation to R-13 to R-15. For 2x6 framing (most post-1990), maximum cavity depth is 5.5 inches, allowing R-19 to R-21.
- Cathedral ceilings and vaulted ceilings are frequent insulation failures -- they are difficult to retrofit and may be underinsulated from original construction. Symptoms include warm ceiling surfaces in summer and significant snow melt on roof sections above vaulted ceilings.

**Windows and Doors:**
- Identify window type: single-pane (U-factor approximately 1.0), double-pane clear (U-factor 0.45-0.55), double-pane low-e (U-factor 0.25-0.35), triple-pane (U-factor 0.15-0.20). Lower U-factor = better performance.
- Inspect double-pane seals: a fogged or hazy appearance between panes means the inert gas fill has failed and the unit has lost 30-50% of its insulating value. Failed seals can be reglazed (replace just the glass unit) for $75-150 per window versus $300-800 for full window replacement.
- Check weatherstripping on all exterior doors: close the door and look for daylight around the perimeter. On a cold day, hold a candle or lighter near the door frame -- flame deflection indicates infiltration. Worn weatherstripping is one of the most cost-effective fixes in any home.
- Door sweep at the bottom: slide a piece of paper under a closed door. If it slides freely with no resistance, cold air infiltration is occurring along the full door width.
- Window caulk on exterior frames: cracked or missing caulk allows both air and water infiltration. Interior rope caulk (temporary, removable for renters) can be applied to window frames for winter to reduce infiltration without permanent modification.

**Living Areas (Living Room, Bedrooms, Home Office):**
- Check baseboards and the floor-wall junction along exterior walls for gaps. On a cold day, air infiltrating at these points is detectable as a cool sensation at floor level.
- Fireplace damper: an open damper is equivalent to a 48-square-inch hole in the wall. Confirm it seals properly when closed. Older dampers with warped metal may not seal -- a top-sealing damper ($50-150) is a significant upgrade. An unused fireplace can be sealed with an inflatable chimney balloon ($35-55) for the season.
- Lighting inventory: Count bulbs by type. A 60W incandescent running 4 hours per day uses 87.6 kWh/year. A 9W LED replacement uses 13.1 kWh/year. Net savings per bulb: 74.5 kWh/year. At $0.16/kWh, that is $11.90/year per bulb. At 25 bulbs, that is $297/year for a $40-75 investment.
- Plug loads: phantom/standby power from electronics, chargers, and appliances with clocks and displays consumes 5-10% of total home electricity. Smart power strips ($25-40) eliminate standby draw from entertainment centers and home offices.

**Kitchen:**
- Refrigerator door seal test: close the door on a piece of paper. Pull the paper out with the door closed. If it slides out with no resistance, the gasket is worn and allowing warm moist air to enter the refrigerator, forcing the compressor to run more. A replacement gasket costs $20-60 depending on model.
- Refrigerator age and efficiency: units manufactured before 2000 use 700-1,200 kWh/year. ENERGY STAR units manufactured after 2015 use 350-500 kWh/year. A 1990-vintage refrigerator costs roughly $80-130/year more to operate than a current efficient model.
- Refrigerator coils: dusty condenser coils (typically on the back or bottom) increase compressor run time by 10-15%. Vacuum the coils annually.
- Dishwasher: heated dry adds approximately 15-20 Wh per cycle. At once-daily use, that is 5.5-7.3 kWh/year -- minor in isolation, but switching to air-dry is free.
- Range hood: confirm it exhausts to the outside, not just recirculates. If it vents to the outside, make sure the exterior damper closes properly to prevent cold air infiltration when not in use.

**Bathrooms:**
- Exhaust fan: confirm it vents to exterior, not to the attic. Attic venting causes moisture damage, mold growth, and creates a permanent air leak. Check by turning the fan on and going to the roof or exterior to confirm airflow from the exterior vent. An exhaust fan on a timer or humidity sensor avoids over-ventilation in winter.
- Showerhead flow rate: hold a bucket under the showerhead and time how long it takes to fill a gallon. If less than 24 seconds, the showerhead exceeds 2.5 GPM. Low-flow showerheads (1.5-2.0 GPM) save 10-20 gallons per shower. For a household of four with one shower per person per day, that is 14,600-29,200 gallons of hot water per year.
- Water heater temperature: if accessible, check the thermostat dial on the tank. Factory default is often 140F. The Department of Energy recommends 120F for most households (140F if an immunocompromised person lives in the home due to Legionella risk). Each 10F reduction saves 3-5% on water heating costs. A water heater running at 140F costs approximately $15-25/year more than one at 120F.
- Water heater insulation jacket: if the tank is warm to the touch, it is losing heat to the surrounding air (standby loss). Tank insulation blankets (R-8) cost $20-30 and reduce standby losses by 25-45%.

**Basement and Crawl Space:**
- Rim joist: this is the horizontal framing member on top of the foundation wall. In most pre-1990 homes, it is uninsulated and directly exposed to exterior temperatures through the sill plate assembly. On a cold day, the rim joist area is noticeably cold to the touch. Rigid foam insulation (R-10 to R-20) cut to fit between joist bays and sealed with can foam is the standard fix -- one of the highest ROI improvements in cold climates.
- Exposed ductwork: if supply or return ducts run through an unconditioned basement or crawl space, check for:
  - Disconnected joints or boots (visible gaps)
  - Holes or tears in duct insulation
  - Unsealed connections (use mastic sealant or foil-backed tape, not standard duct tape which fails at temperature extremes)
  - R-value of duct insulation -- supply ducts in unconditioned spaces should have minimum R-6 insulation jacket
- Crawl space conditions: check for exposed ground. If bare earth is visible, a vapor barrier (6-mil polyethylene) should cover 100% of the ground surface. Uncontrolled moisture evaporation from soil into a crawl space increases the humidity load on the whole house and accelerates wood decay.
- Sump pump: if present, confirm the lid seals tightly. An open sump crock vents soil gases and cold air directly into the living space.

**HVAC System:**
- Air filter: check the filter and note its condition. A standard 1-inch filter should be replaced every 60-90 days. A dirty filter restricts airflow, increasing fan energy use by 5-15% and in extreme cases can cause heat exchanger overheating or evaporator coil freezing. Thicker media filters (4-5 inch) have longer service intervals (6-12 months) and better filtration without significant pressure drop penalties.
- Thermostat capability: identify whether the current thermostat is manual, programmable, or smart/connected. A setback of 7-10F for 8 hours per day while sleeping, and another 8-hour setback while the home is empty, saves 10-15% on annual heating and cooling costs by DOE estimates. For a $3,000/year heating and cooling spend, that is $300-450/year in savings from a $25-200 thermostat upgrade.
- System age and AFUE/SEER rating: gas furnaces have an AFUE (Annual Fuel Utilization Efficiency) rating. Pre-1992 furnaces are 56-70% AFUE. Mid-efficiency units (1993-2006) are 80% AFUE. High-efficiency condensing furnaces are 90-98% AFUE. If the user's furnace is 15+ years old and below 80% AFUE, upgrading to a 95% AFUE unit saves approximately 15-25% on gas heating costs. Air conditioners use SEER ratings -- units installed before 2006 may be SEER 8-10; current minimum is SEER2 13.4 in northern states and 15.2 in southern states; high-efficiency units are SEER 18-25.
- Duct register temperatures: on a heating day, measure supply air temperature at a register (should be 120-140F for a gas furnace, 90-110F for a heat pump) and compare to return air temperature. Large temperature differentials across the system are normal -- very low supply temperatures suggest a heat exchanger issue or equipment malfunction.

---

### Step 3: Quantify Each Finding

For every issue identified, produce a structured estimate:

- **Baseline energy loss:** State what the loss mechanism is (conduction through an assembly, convective air leakage, or inefficiency in a system) and use the appropriate calculation:
  - Conductive loss through under-insulated attic: use Q = A × ΔT / R, where A is area (sq ft), ΔT is average temperature differential (heating degree days × 24 / 65, simplified), and R is current R-value minus target R-value
  - Air leakage savings from sealing: use EPA estimates of 5-30% of heating/cooling energy depending on tightness category (loose = pre-1980 with no air sealing work, average = 1980-2005, tight = post-2005 with attention to sealing)
  - Lighting savings: (old wattage -- new wattage) × daily hours × 365 / 1,000 = kWh/year saved
  - Water heating savings from temperature reduction: 3-5% per 10F reduction × annual water heating energy (typically 15-20% of total home energy budget)
- **Cost conversion:** Use the user's stated energy rate or, if unknown, national averages of $0.16/kWh for electricity and $1.20/therm for natural gas. Always state the assumed rate.
- **Fix cost ranges:** Provide DIY cost (materials only) and professional installation cost (materials plus labor). Note which approach is appropriate for each fix.
- **Payback period:** Fix cost (midpoint of range) divided by annual savings (midpoint of range). Express as months if under 2 years, years if over 2 years. Round to one decimal place.

---

### Step 4: Apply Climate-Zone Weighting

The climate zone shifts which fixes have the highest priority:

- **Zones 1-2 (hot-humid):** Prioritize duct leakage sealing (ducts in hot attics are extremely detrimental), attic radiant barriers, air sealing at the ceiling plane (to keep humid outdoor air out), high-SEER AC, ceiling fans, and solar heat gain reduction (low-SHGC windows, exterior shading). Insulation is less leverage than air sealing and duct sealing in humid climates because moisture intrusion is the more pressing failure mode.
- **Zones 3-4 (mixed):** Balanced approach. Attic insulation and air sealing are both high priority. Window performance matters significantly in this zone because of both heating and cooling season overlap. Heat pumps outperform gas furnaces in this zone more decisively than in colder zones.
- **Zones 5-7 (heating-dominant):** Prioritize attic insulation, rim joist insulation, attic air sealing, duct leakage in unconditioned spaces, furnace efficiency, and thermostat setbacks. Window replacement is economically difficult to justify in these zones purely on energy savings -- the very large temperature differential increases window heat loss but also makes window replacement payback periods extend to 15-25 years.

---

### Step 5: Build the Prioritized Fix List

Organize fixes into four tiers, ranked by payback period within each tier:

- **Free or under $25 (immediate to 3-month payback):** Thermostat setback programming, furnace filter replacement, closing fireplace damper, lowering water heater temperature, turning off lights and standby electronics, adjusting refrigerator temperature (35-38F for refrigerator, 0-5F for freezer -- too cold wastes energy, too warm risks food safety).
- **Low cost ($25-$200, payback under 12 months):** LED bulb replacements, door weatherstripping, window rope caulk (renter-safe), door sweeps, outlet and switch plate foam gaskets, water heater tank blanket, attic hatch insulation cover (foam board sandwich), low-flow showerheads, smart power strips.
- **Moderate cost ($200-$2,000, payback 1-5 years):** Attic insulation top-up (blown cellulose is typically cheapest per R-value), attic air sealing before insulation, duct mastic sealing, rim joist insulation (rigid foam), programmable or smart thermostat (if not already done), recessed light air sealing gaskets, crawl space vapor barrier.
- **Investment ($2,000+, payback 5-15+ years):** Window replacement (justified only when seals have failed, comfort is the priority, or when bundled with other incentives), HVAC replacement (justified when system is 15+ years old and inefficient, especially if converting from electric resistance to heat pump), wall insulation (blown-in retrofit through bored holes -- expensive but high impact in uninsulated walls), whole-house air sealing by professional (blower door guided), heat pump water heater conversion (replaces electric resistance water heater, 2-3× efficiency gain).

---

### Step 6: Apply Renter vs. Owner Differentiation

Every fix in the fix list must carry an explicit "Renter: Yes/No" tag with a brief rationale.

**Renter-accessible without landlord permission (portable or fully reversible):**
- LED bulb replacement (take the bulbs when you move, put the original bulbs back)
- Draft stoppers under doors
- Outlet foam gaskets (peel off cleanly)
- Interior rope caulk on windows (peels off without damage)
- Window insulation film (removable type, leaves no residue if applied and removed correctly)
- Smart power strips
- Low-flow showerhead (save the original in a labeled bag, reinstall before moving)
- Thermostat setback behavior (if thermostat allows -- some rental thermostats are locked)
- Water heater temperature adjustment (if accessible -- many landlords lock this)
- Portable window AC unit or space heater for zone heating

**Renter-accessible with landlord permission (reversible but may require approval):**
- Exterior door weatherstripping
- Door sweep installation
- Window rope caulk on exterior frames (some landlords restrict any caulking application)

**Owner-only (permanent modification or major investment):**
- Attic insulation
- Attic air sealing
- Duct mastic sealing
- Rim joist insulation
- HVAC replacement
- Window replacement
- Wall insulation
- Recessed light sealing gaskets (electrical modification)
- Thermostat replacement (some require electrical work)
- Vapor barrier installation in crawl space

**For renter-only users:** Build a separate landlord request template that presents the energy savings data professionally. Frame improvements as property value upgrades and utility cost reductions for the building, not just renter comfort. Note that in many jurisdictions, landlords are required to provide weatherized, habitable conditions -- a highly drafty home may violate local housing codes.

---

### Step 7: Produce the Final Report with Next Steps

Summarize total estimated savings potential across all tiers, state the total investment required to achieve each tier of savings, and provide three to five concrete next steps calibrated to the user's stated budget and situation. Include a recommendation on whether a professional energy audit (blower door test, duct blaster) would meaningfully add value given the home's age, size, and the scale of fixes being considered.

---

## Output Format

```
## Home Energy Audit Report

### Home Profile
| Parameter                | Value                              |
|--------------------------|------------------------------------|
| Housing type             | [Single-family / Townhouse / etc.] |
| Ownership                | [Owner / Renter]                   |
| Square footage           | [Sq ft] ([Stories]-story)          |
| Year built               | [Year] ([Construction era])        |
| Climate zone             | [IECC Zone X -- Descriptor]        |
| Heating system           | [Type and fuel]                    |
| Cooling system           | [Type]                             |
| Current monthly bills    | $[Electric] electric + $[Gas] gas = $[Total]/month ($[Annual]/year) |
| Energy rate assumptions  | $[X]/kWh electric, $[X]/therm gas  |

---

### Comfort Problem Summary
[2-4 sentences describing the primary comfort complaints and what they indicate physically. 
Example: "Cold upstairs bedrooms in winter typically indicate insufficient attic insulation and/or 
bypasses in the ceiling plane that allow heat to escape directly to the attic. Cold drafts near 
windows are usually weatherstripping or caulk failures. These two issues together account for an 
estimated [X-Y]% of your heating bill."]

---

### Room-by-Room Findings

#### [Zone Name -- e.g., "Attic" or "Upstairs Bedrooms"]
| Issue                    | Details                            | Est. Annual Energy Loss | Est. Annual Cost | Priority |
|--------------------------|------------------------------------|-------------------------|------------------|----------|
| [Issue description]      | [Specific measurement or condition]| [X kWh or therms]       | $[Amount]        | High/Med/Low |

[Repeat for each zone inspected]

---

### Prioritized Fix List

#### Tier 1: Free or Under $25 -- Immediate Payback
| Fix                      | How-To                             | Est. Annual Savings | DIY Cost | Payback  | Renter OK? |
|--------------------------|------------------------------------|---------------------|----------|----------|------------|
| [Fix]                    | [Specific action]                  | $[Amount]           | $[Cost]  | Immediate| Yes / No   |

#### Tier 2: Low Cost ($25-$200) -- Payback Under 12 Months
| Fix                      | How-To                             | Est. Annual Savings | DIY Cost | Pro Cost | Payback    | Renter OK? |
|--------------------------|------------------------------------|---------------------|----------|----------|------------|------------|
| [Fix]                    | [Specific action]                  | $[Amount]           | $[Cost]  | $[Cost]  | [Months]   | Yes / No   |

#### Tier 3: Moderate Cost ($200-$2,000) -- Payback 1-5 Years
| Fix                      | How-To / Notes                     | Est. Annual Savings | DIY Cost | Pro Cost | Payback    | Renter OK? |
|--------------------------|------------------------------------|---------------------|----------|----------|------------|------------|
| [Fix]                    | [Specific action]                  | $[Amount]           | $[Cost]  | $[Cost]  | [Years]    | Yes / No   |

#### Tier 4: Investment ($2,000+) -- Payback 5-15 Years
| Fix                      | Justification                      | Est. Annual Savings | Est. Cost       | Payback  | Renter OK? |
|--------------------------|------------------------------------|---------------------|-----------------|----------|------------|
| [Fix]                    | [Specific conditions that justify] | $[Amount]           | $[Range]        | [Years]  | No         |

---

### Cumulative Savings Summary
| Tier                     | Total Investment | Annual Savings | Simple Payback |
|--------------------------|-----------------|----------------|----------------|
| Tier 1 only              | $[Sum]          | $[Sum]/yr      | Immediate      |
| Tiers 1-2                | $[Sum]          | $[Sum]/yr      | [Months]       |
| Tiers 1-3                | $[Sum]          | $[Sum]/yr      | [Years]        |
| Tiers 1-4                | $[Sum]          | $[Sum]/yr      | [Years]        |
| Total estimated savings potential | --    | $[Grand total]/yr | --         |
| % reduction from current bill     | --    | [X-Y]%         | --             |

---

### Next Steps

**This week (free, <30 minutes each):**
1. [Specific action with expected savings]
2. [Specific action with expected savings]

**Within 30 days ($X-Y total investment):**
1. [Specific fix with materials needed and expected savings]
2. [Specific fix with materials needed and expected savings]

**Within 3-6 months ($X-Y total investment):**
1. [Specific fix -- get quotes, specific improvement with expected savings]

**Long-term considerations:**
1. [Investment-tier fix with trigger condition -- "When your furnace needs replacement, upgrade to a 95+ AFUE unit or consider a heat pump"]

---

### Professional Audit Recommendation
[Yes/No recommendation on whether a professional blower door test and/or duct blaster test would 
add meaningful value. Include estimated cost of professional audit ($200-500 for most markets) and 
note that many utilities offer subsidized or free audits for residential customers.]

---
*All savings estimates are ranges based on typical conditions for this housing type, climate zone, 
and construction era. Actual savings depend on occupant behavior, local energy rates (assumed 
$[X]/kWh and $[X]/therm), and specific construction details. Estimates use the midpoint of national 
DOE and ENERGY STAR research ranges. A professional energy audit with calibrated blower door testing 
will produce more precise infiltration measurements.*
```

---

## Rules

1. **Never conflate kWh and therms without converting:** When a home has both gas and electric systems, report gas savings in therms and electric savings in kWh separately, then convert both to dollars for the summary. One therm = 29.3 kWh of thermal energy, but because gas furnaces are 80-95% efficient and electric systems are 100% efficient at point of use (heat pumps are 200-300% efficient), never apply a direct thermal equivalency without accounting for system efficiency.

2. **Air sealing always precedes insulation in the recommendation sequence:** Adding insulation over unsealed air bypasses reduces but does not eliminate convective heat loss. The correct sequence is seal first, then insulate. Never recommend adding attic insulation without first checking for and sealing bypasses -- this is the most common error in DIY energy audits and professional recommendations.

3. **Renter status must be explicitly addressed in every fix recommendation:** Do not omit the renter designation for any fix, even if the user has stated they are an owner. Circumstances change, and a complete report is more useful than an abbreviated one. If the user is a renter, the report must include a landlord request section.

4. **All payback calculations must state their assumptions:** A payback period without a stated energy rate and annual savings basis is meaningless. Every payback figure must be traceable to: (fix cost) / (annual savings), where annual savings = (energy reduction in kWh or therms) × (stated rate per unit).

5. **Do not recommend window replacement as a primary energy savings measure:** Window replacement has one of the worst simple paybacks of any energy improvement (10-25 years). It is justified only when: (a) original single-pane windows are present, (b) double-pane seals have visibly failed (fogging), or (c) the user places significant weight on comfort rather than pure ROI. Always note the payback reality when windows appear in the fix list.

6. **Climate zone must govern all insulation targets:** Never state a target R-value without specifying the climate zone it applies to. An R-30 attic is appropriate for Zone 2, seriously deficient for Zone 6. R-value recommendations that omit climate zone context cause homeowners to under-invest in cold climates and over-invest in hot climates.

7. **Pre-1940 homes require a knob-and-tube wiring check before insulation recommendations:** Adding insulation over active knob-and-tube wiring is a fire hazard because the wiring depends on open-air cooling to dissipate heat. If the home was built before 1940 and the user mentions wall insulation or attic insulation, flag the need for an electrical inspection before proceeding. This is a safety constraint, not an energy constraint.

8. **Savings estimates must always be presented as ranges, not precise figures:** The uncertainty in a DIY audit (no blower door measurement, no thermal imaging, no energy modeling software) means that point estimates are false precision. Use 20-30% spread ranges (e.g., "$80-120/year" not "$97/year") and note that actual savings depend on occupant behavior, which accounts for 20-40% of total home energy use variability between similar homes.

9. **Never recommend sealing a gas combustion appliance's air supply:** Gas furnaces, boilers, and water heaters need combustion air. If a user asks about sealing the mechanical room or utility closet as an air sealing measure, explicitly note that combustion appliances require adequate fresh air supply per their manufacturer specifications and local building code. Improperly sealed mechanical rooms cause backdrafting, carbon monoxide risk, and appliance failure. Direct the user to a licensed HVAC technician for combustion appliance zone air sealing.

10. **Do not recommend a specific professional when noting that professional work is required:** The audit report should specify the type of professional needed (BPI-certified auditor, licensed HVAC contractor, licensed electrician, licensed plumber) but not recommend a specific company, contractor, or national service. For finding certified professionals, direct users to their state energy office, local utility, or the Building Performance Institute (BPI) contractor directory as a search starting point.

---

## Edge Cases

### Pre-1940 Balloon-Frame or Uninsulated Home
Homes built before 1940 use balloon-frame construction where exterior wall studs run continuously from the foundation sill to the roof rafter, creating vertical air channels inside the walls that allow cold air to flow from the basement all the way to the attic. This construction type has dramatically higher infiltration rates than platform-frame construction. Diagnosis: the user will report extreme cold near floors in all rooms, very high heating bills relative to home size, and drafts everywhere. Response: (1) Flag knob-and-tube wiring concern -- do not recommend wall insulation until an electrician confirms the wiring is replaced or inactive. (2) Prioritize blocking the top and bottom of wall cavities (fire-stopping, which also stops thermal bypass) before adding insulation. (3) Rim joist and attic air sealing are even more critical in these homes than in post-1970 construction. (4) Estimate that a thorough air sealing project in a pre-1940 home can reduce infiltration by 30-50%, whereas the same effort in a 2000-built home might achieve 10-20%. (5) Note that historic preservation requirements may restrict exterior modifications in designated historic districts.

### Renter With Zero Modification Rights
Some users rent in jurisdictions or under landlords with absolute no-modification policies, or occupy month-to-month situations where no investment is sensible. For this case, build a report focused entirely on behavioral optimization and portable measures: (a) Thermostat programming -- saving $70-150/year costs nothing. (b) LED bulbs -- purchase and install, take them when you leave ($30-75 investment, $80-200/year savings). (c) Draft stoppers at door bases ($5-15 each, portable). (d) Thermal curtains on windows -- up to R-3 effective value, significantly reduce radiant cold from window surfaces ($30-80 per window, improves comfort markedly). (e) Movable furniture placement -- keeping furniture away from exterior walls and grouping seating away from drafty windows reduces perceived cold. (f) Smart power strips for electronics. (g) Cold-water laundry cycles (90% of clothes-washing energy is water heating). Total potential from behavioral and portable measures: $150-350/year with $50-200 in initial investment. Also produce a landlord request letter that references local housing weatherization requirements and frames improvements as reducing landlord turnover costs (tenants leave energy-inefficient homes) and increasing property value.

### All-Electric Home With Electric Resistance Baseboard Heating
Electric resistance heating converts electricity to heat at 100% efficiency -- but electricity costs 3-4 times more per BTU of useful heat than natural gas in most markets. This is the most expensive common heating fuel. If the user is an owner, the single highest-impact improvement -- by a wide margin -- is converting to an air-source heat pump or mini-split system, which operates at 200-350% efficiency (COP 2.0 to 3.5) by moving heat from outside air rather than generating it. In Zone 4 and warmer climates, modern cold-climate heat pumps (rated down to -13F operating with COP >1.0) can cut heating costs by 50-70% versus electric resistance. If the user is a renter, the focus shifts entirely to load reduction because reducing the heating load by 30% through air sealing and insulation saves 30% on a very expensive fuel. Also note: electric resistance heat provides natural zone heating -- each baseboard controls independently. This is inefficient overall but allows shutting off heat in unoccupied rooms, which partially offsets the fuel cost disadvantage. Recommend closing off rooms and concentrating occupancy during cold weather.

### Very New, Tight Home (Post-2012 IECC Construction)
A post-2012 IECC-compliant home may already have R-49 attic insulation, R-20 walls, double or triple-pane low-e windows, and tested air leakage below 3 ACH50. In these homes, the standard prioritization (insulation, air sealing, windows) yields diminishing returns because the home is already relatively tight and well-insulated. Shift the focus to: (a) Mechanical ventilation efficiency -- tight homes require mechanical ventilation (HRV or ERV systems) and if the HRV/ERV is dirty or undersized, indoor air quality suffers and the ventilation system may be running more than necessary. (b) Appliance and equipment efficiency -- plug loads and lighting represent a larger share of total energy use in well-insulated homes. (c) Duct leakage -- even in new homes, duct leakage at 10-15% is common and significantly undermines the well-insulated envelope. (d) Smart thermostat optimization -- a tight home responds more precisely to thermostat setbacks. Acknowledge to the user that their home is likely already in the top quartile of energy efficiency and that further improvements will have smaller absolute dollar returns.

### Home With Oil or Propane Heating (High Fuel Cost)
Heating oil ($3.00-5.00/gallon, roughly 138,690 BTU/gallon at 80% AFUE yields 110,952 usable BTU) and propane ($2.00-4.00/gallon, 91,452 BTU/gallon at 95% AFUE yields 86,879 usable BTU) are significantly more expensive per BTU of delivered heat than natural gas in most markets. The economics of efficiency improvements are more favorable with these fuels -- payback periods on insulation and air sealing improvements are shorter because each therm-equivalent of saved energy is worth more. For a heating-oil home, emphasize: (a) Converting to a heat pump or natural gas if a gas line is accessible. (b) The annual oil delivery cost is a strong motivator -- frame savings as "gallons of oil per year" not just dollars. (c) A 200-gallon reduction in annual oil use saves $600-1,000/year depending on current oil prices. For propane: same logic, but propane is also used for cooking and water heating in many rural homes -- address the water heater specifically (propane heat pump water heater or solar water heating are both payback-positive in propane homes).

### Unusually High Bills With No Obvious Cause
If the user's bills are 40-60% above expected for their home size and climate and the standard audit checklist does not explain the discrepancy, consider: (a) Duct leakage to outside -- ducts that connect to the outside (detached garage, crawl space with open vents, or broken duct connection) actively exhaust conditioned air to the exterior. This is uncommon but can cause very high unexplained bills. (b) Basement or crawl space with open vents in winter that the user has forgotten about. (c) A gas appliance (pool heater, outdoor fireplace, detached garage heater) running continuously. (d) Electric resistance supplemental heat in a heat pump system -- many heat pump thermostats have an auxiliary/emergency heat setting that, if left on, runs electric resistance coils full time. Check the thermostat display for "AUX" or "EM HEAT" indicator. This alone can double the electric bill. (e) An aging, failing appliance (refrigerator compressor running constantly, water heater with a stuck heating element, failed pump in a radiant system). (f) A water leak through a hot water line causing the water heater to run continuously. Recommend checking the utility's interval data (most smart meters provide hourly data through the utility's online portal) to identify when the high consumption occurs -- at night with no one home, it is standby losses or a malfunctioning appliance; during the day, it is normal use plus conditioning.

### Home in Mixed-Humid Climate With Humidity Problems
In IECC Zones 2A and 3A (Gulf Coast through mid-Atlantic), summer humidity control is as important as temperature control for energy efficiency and health. High indoor humidity in summer is often caused by: (a) Duct leakage that pulls humid outdoor air into the system. (b) Oversized AC units that cool the air too quickly without running long enough to dehumidify it (short cycling). (c) Crawl space moisture migration. (d) Ventilation systems exhausting more than they supply, depressurizing the house and drawing humid outdoor air through cracks. In these cases, seal ducts before anything else. If the AC is oversized (turns on, quickly reaches set temperature, and turns off in under 10-15 minutes), replacing it with a properly sized variable-speed unit will dramatically improve dehumidification performance. Recommend a crawl space vapor barrier and sealed, conditioned crawl space approach rather than vented crawl space in hot-humid climates.

---

## Example

**Input:** "I own a 1,800 sq ft two-story house built in 1987 in Columbus, Ohio. My electric bill averages $165/month in spring and fall but hits $280/month in summer and $240/month in winter. Gas is $45/month in summer and $195/month in January and February. The upstairs bedrooms are always cold in winter. There's a noticeable draft near the front door and the sliding door to the back patio. I'm on a budget of maybe $500 for fixes right now but I'm willing to invest more if the payback makes sense. I own the home."

**Analysis before writing the report:**
- Climate: Columbus, Ohio = IECC Zone 5 (heating-dominant mixed). Target attic R-value: R-49 to R-60.
- Annual energy spend: Electric: ($165 × 4 months) + ($280 × 3 months) + ($240 × 5 months) ≈ $660 + $840 + $1,200 = approximately $2,700/year electric. Gas: ($45 × 4 months) + ($195 × 2 months) + ($120 × 6 months estimated) ≈ $180 + $390 + $720 = approximately $1,290/year gas. Total: approximately $3,990/year.
- Electric baseline (non-thermal): $165/month spring/fall suggests approximately $1,980/year in plug loads and non-HVAC use. The winter and summer premiums are thermal: winter electric premium ~$75/month × 5 months = $375 (likely some electric supplemental heat or heat pump component); summer premium ~$115/month × 3 months = $345 (central AC).
- Gas: Summer $45/month base = water heating and cooking. Winter premium ~$150/month × 4-5 months = $600-750 in gas heating.
- 1987 construction in Ohio = pre-1992 energy code, likely R-19 attic (8-10 inches blown fiberglass), 2x4 walls with R-11 batts, likely original double-pane windows (but seals may have degraded in 35 years).
- Cold upstairs rooms + drafty doors = strong air leakage and likely under-insulated attic indication.
- Budget: $500 immediate, open to more with good payback.

---

**Output:**

## Home Energy Audit Report

### Home Profile
| Parameter                | Value                                    |
|--------------------------|------------------------------------------|
| Housing type             | Single-family detached, 2-story          |
| Ownership                | Owner                                    |
| Square footage           | 1,800 sq ft                              |
| Year built               | 1987 (pre-1992 energy code era)          |
| Climate zone             | IECC Zone 5 -- Heating-dominant mixed (Columbus, OH) |
| Heating system           | Gas furnace (assumed from gas billing pattern) |
| Cooling system           | Central AC (assumed from summer electric premium) |
| Annual energy spend      | ~$2,700/year electric + ~$1,290/year gas = ~$3,990/year |
| Energy rate assumptions  | $0.16/kWh electric, $1.20/therm gas     |

---

### Comfort Problem Summary

Cold upstairs bedrooms in a 1987 two-story home in Zone 5 almost always indicate two compounding problems: (1) attic insulation well below the current R-49 target -- 1987 construction in Ohio typically has R-19 to R-25 in the attic, which is 50-60% below current code, and (2) air leakage at the ceiling-attic interface (unsealed wire, pipe, and light fixture penetrations) that allows warm air to convect out of the living space regardless of insulation depth. Cold bedrooms specifically on the second floor also suggest that ductwork to the upper floor may be undersized, kinked, or leaking conditioned air before it reaches those registers.

The drafts at the front door and sliding patio door are classic weatherstripping failures -- the most fixable and fastest-payback problems in this home. Combined, these two door leaks likely account for 5-8% of annual heating and cooling energy.

Your winter gas premium (~$600-750/year above summer baseline) is the primary target of this audit. Reducing it by 30-40% represents $180-300/year in gas savings alone.

---

### Room-by-Room Findings

#### Attic (Highest Priority Zone)
| Issue                               | Details                                     | Est. Annual Energy Loss | Est. Annual Cost | Priority |
|-------------------------------------|---------------------------------------------|-------------------------|------------------|----------|
| Under-insulated attic               | 1987 construction likely has R-19 to R-25; Zone 5 target is R-49 to R-60; gap of R-24 to R-41 | 120-200 therms gas equivalent | $145-240 | High |
| Attic bypass leakage (ceiling penetrations) | Gaps around top plates, wire penetrations, recessed lights (if present), attic hatch -- likely zero air sealing in 1987 construction | 60-100 therms | $70-120 | High |
| Uninsulated or poorly sealed attic hatch | Standard 1987 hatch = drywall panel, R-1 effective, no weatherstrip | 10-20 therms | $12-24 | High |

#### Exterior Doors (Draft-Confirmed Priority Area)
| Issue                               | Details                                     | Est. Annual Energy Loss | Est. Annual Cost | Priority |
|-------------------------------------|---------------------------------------------|-------------------------|------------------|----------|
| Front door weatherstripping failure | User-confirmed draft -- likely 35-year-old original weatherstripping, compressed and no longer sealing | 15-30 therms | $18-36 | High |
| Sliding patio door seals            | Sliding doors rely on pile weatherstripping (brush-type) that compresses and matts over time; also check door frame corners for caulk failure | 20-40 therms | $24-48 | High |
| Door sweeps (front and patio)       | If daylight visible under doors,
