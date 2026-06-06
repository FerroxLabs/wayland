---
name: annual-home-maintenance
description: |
  Creates a month-by-month home maintenance calendar customized to the user's
  home type, age, region, and systems. Covers HVAC, plumbing, roofing, exterior,
  interior, and seasonal tasks with time estimates and cost ranges. Use when
  the user asks about home maintenance schedules, annual upkeep checklists,
  or preventive home care planning. Do NOT use for emergency repairs (use
  home-repair-first-response), specific system deep-dives (use hvac-maintenance
  or plumbing-basics), or commercial/industrial building maintenance.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance checklist planning"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Annual Home Maintenance Calendar

## When to Use

**Use this skill when:**
- A user asks for a home maintenance schedule, annual checklist, or month-by-month upkeep plan
- A user recently purchased a home (especially a first-time buyer) and wants a preventive care framework to avoid expensive surprises
- A user asks "what should I be doing to maintain my house this year?" or similar open-ended upkeep questions
- A user wants to build a maintenance budget and needs cost projections broken down by task and season
- A user has neglected maintenance for 2+ years and wants to do a reset/catch-up assessment alongside a going-forward schedule
- A user is preparing a home for sale and wants a maintenance audit to address deferred items before listing
- A user is a landlord wanting a comprehensive annual schedule for a residential rental property

**Do NOT use this skill when:**
- The user has an active emergency -- burst pipe, loss of heat in winter, active roof leak, gas smell (use `home-repair-first-response` instead)
- The user needs deep system-specific diagnostic guidance for a single system -- HVAC troubleshooting, furnace not igniting, AC not cooling (use `hvac-maintenance` instead)
- The user needs detailed plumbing repair instructions for a specific failure (use `plumbing-basics` instead)
- The user needs a roofing repair walkthrough or wants to understand roof inspection in professional detail (use `roof-gutter-maintenance` instead)
- The user maintains a commercial building, multi-unit apartment complex (5+ units), or industrial facility -- those require code-regulated maintenance programs beyond this skill's scope
- The user is asking about landscaping or lawn care as a standalone topic -- this skill touches on exterior items that affect the home structure only

---

## Process

### Step 1: Gather the Home Profile

Before generating any calendar, collect the following information. If the user has not provided it, ask all questions at once in a single message to avoid back-and-forth.

**Required information:**
- **Home type:** Single-family detached, townhouse, condo (unit only), duplex/half-duplex, manufactured/mobile home on permanent foundation
- **Year built:** This determines material ages, likely upgrade needs, and code-era context. Categorize as: Pre-1950 (historic), 1950-1978 (pre-lead-paint-ban overlap zone), 1979-1999 (mid-era), 2000-2015 (modern), 2016-present (recent/potentially under warranty)
- **Climate region:** Use the five practical zones -- Cold/Northern (zones 6-8: upper Midwest, New England, Mountain West), Temperate/Mid-Atlantic (zones 5-6: Ohio Valley, DC corridor, Pacific NW), Hot-Humid/Southern (zones 2-4: Gulf Coast, Southeast, Florida), Arid/Desert (zones 2-3: Southwest, inland California), Mixed-Humid (zones 4-5: Mid-South, Carolinas, lower Midwest)
- **Heating system:** Gas forced-air furnace, oil forced-air furnace, electric heat pump (air-source), gas boiler/radiator, electric baseboard, mini-split (ductless heat pump), geothermal
- **Cooling system:** Central AC (split system), heat pump doubling as AC, window/portable units, evaporative cooler (swamp cooler), mini-split, none
- **Roof material:** Asphalt shingle (3-tab vs. architectural), metal (standing seam vs. corrugated), clay/concrete tile, flat/low-slope membrane (TPO, EPDM, modified bitumen), wood shake
- **Foundation type:** Full basement (finished or unfinished), crawlspace (vented vs. encapsulated), slab-on-grade
- **Lot and site features:** Mature trees overhanging or within 15 feet of structure, steep slope/grading concerns, large lawn area, attached/detached garage, deck or wood structures, pool or hot tub
- **Special systems:** Septic system (vs. municipal sewer), private well (vs. municipal water), whole-house generator, propane tank (above or below ground), irrigation/sprinkler system, solar panels, wood-burning fireplace or pellet stove

**Optional but useful:**
- Known deferred maintenance or recent repairs
- Whether the user does DIY work comfortably or prefers to hire everything out
- Whether there are young children or immunocompromised occupants (affects lead, mold, and air quality priorities)

---

### Step 2: Apply Climate-Region Task Timing

Climate region is the primary driver of WHEN tasks happen. Use this timing framework:

**Cold/Northern (zones 6-8):**
- Winterization tasks: October (hard deadline -- freeze events possible by early November)
- Spring startup: April-May (frost-free date typically late April to mid-May)
- AC prep: May
- Heating prep: September
- Gutter cleaning: May (post-bud) and November (post-full-leaf-drop)
- Ice dam prevention: November (insulation and ventilation check before snowfall)

**Temperate/Mid-Atlantic (zones 5-6):**
- Winterization: Late October to early November
- Spring startup: March-April
- AC prep: March-April (schedule early; HVAC firms book up by May)
- Heating prep: September-October
- Gutter cleaning: April and November

**Hot-Humid/Southern (zones 2-4):**
- No true winterization needed except freeze-event prep (November)
- AC is the dominant system; schedule professional AC service in February-March (before brutal summer heat)
- Heating (if heat pump): service in October
- Hurricane/wind preparation: May (pre-season)
- Mold and moisture management is year-round, not seasonal
- Gutter cleaning: March and September (or year-round if heavy tree cover)

**Arid/Desert (zones 2-3):**
- Evaporative cooler startup: March, shutdown: October
- Monsoon drainage prep: June (Southwest monsoon season July-September)
- Freeze-event pipe protection: November (desert nights can drop below freezing)
- UV degradation inspection (caulk, roofing, painted surfaces): April and September
- Gutter cleaning: After monsoon season (September-October) and spring (March)

**Mixed-Humid (zones 4-5):**
- Follows Mid-Atlantic timing but with additional humidity/mold monitoring in June-August
- Crawlspace moisture checks are critical in spring and late summer

---

### Step 3: Build the Month-by-Month Task Matrix

For each month, assign tasks from the following master categories. Not every category appears every month -- assign based on climate timing and system intervals.

**HVAC system tasks (driven by fixed intervals):**
- Filter replacement: Every 60-90 days for 1-inch filters (MERV 8-11 rating). Every 6-12 months for 4-5 inch media filters. More frequent (every 30-45 days) in homes with pets, occupants with allergies, or dusty remodeling activity
- Professional AC tune-up: Once annually in spring. Technician should check refrigerant charge (target superheat and subcooling per manufacturer spec), clean evaporator and condenser coils, test capacitors and contactors, verify thermostat calibration, and measure static pressure
- Professional furnace/heat pump tune-up: Once annually in fall. Includes heat exchanger inspection (critical -- cracked exchangers leak CO), burner cleaning, flue inspection, and blower belt check (if applicable)
- Air handler drain line: Flush with distilled white vinegar or diluted bleach (1 cup per gallon) every spring in hot-humid climates to prevent clog-induced overflow. Annual in other climates

**Water heater:**
- Annual sediment flush: Connect garden hose to drain valve, shut off cold supply, open pressure relief valve, drain 2-3 gallons into bucket until clear. On electric heaters, turn off breaker first. On gas heaters, set to pilot. Note: If the unit is more than 8 years old and has never been flushed, partial flushing may dislodge sediment and cause temporary cloudy water -- warn the user this is normal
- Anode rod inspection: Every 3-4 years on tank-style heaters. Magnesium anode rods are the sacrificial element that prevents tank corrosion. If the rod is less than 1/2 inch diameter or heavily encrusted, replace it. A new anode rod ($20-50 part) can extend tank life by 5+ years
- Temperature setting verification: Should be set to 120°F (49°C) to prevent scalding and reduce Legionella risk. Temperatures above 140°F accelerate sediment buildup

**Plumbing and water systems:**
- Whole-house water shut-off exercise: Operate the main shut-off valve once per year (turn off and back on). Valves that sit unused for years can seize and fail when you need them most -- especially ball valves in older homes that were never turned
- Hose bib/exterior faucet winterization: Shut off interior isolation valve, open exterior bib fully to drain, leave open over winter. Failure to do this is one of the most common causes of burst pipes in cold climates -- the exterior section of the line freezes and splits, but damage isn't visible until spring
- Sump pump test: Pour 5 gallons of water into the pit to verify float activation. Check discharge line for blockage and ensure the discharge point is at least 10 feet from the foundation

**Roof and gutters:**
- Ground-level roof inspection with binoculars: Look for missing, cracked, or curled shingles; granule loss (bald patches on asphalt); lifted flashing at chimney, vents, and valleys; moss or algae growth (dark streaking)
- Gutter inspection and cleaning: Flush with garden hose from ridge to downspout. Downspout must discharge at least 4-6 feet from foundation, preferably 10 feet. Check for sag (gutter should have 1/4-inch drop per 10 feet toward downspout)
- Roof professional inspection: Every 3-5 years for asphalt shingles under 15 years old; every 1-2 years for roofs over 20 years old or after any severe hail/wind event. A licensed roofer walking the roof can find things a ground inspection misses -- particularly failed step flashing, lifted ridge cap, and cracked pipe boot collars

**Exterior envelope:**
- Caulking inspection: Check silicone or polyurethane caulk at all window frames, door frames, penetrations (pipes, vents, wires through exterior walls), and where dissimilar materials meet (wood to brick, siding to trim). Failed caulk is the leading cause of water intrusion in the building envelope. Replace when caulk shows cracking, shrinkage gaps, or separation from substrate
- Paint and siding: Wood siding requires repainting every 5-7 years. Fiber cement every 10-15 years. Vinyl requires only cleaning. Look for peeling, bubbling, or dark staining (indicates moisture trapped behind)
- Foundation grading: Soil or mulch at the foundation perimeter must slope away at a minimum of 6 inches of drop over the first 10 feet. Mulch piled against siding or wood trim invites rot and termite entry

**Electrical safety:**
- GFCI testing: Press test button (outlet should go dead), press reset. Test all GFCI outlets in bathrooms, kitchen, garage, exterior, unfinished basement, and within 6 feet of any sink. If a GFCI doesn't trip cleanly or won't reset, replace it -- GFCIs have an 8-10 year service life
- Smoke and CO detectors: Test monthly with test button. Replace batteries in all non-sealed units annually (October is standard -- change when clocks change is the mnemonic). Replace entire units every 10 years (smoke) and every 5-7 years (CO) -- the sensing elements degrade
- Dryer vent: A clogged dryer vent is the leading cause of residential appliance fires -- approximately 15,000 per year in the US. Clean the full duct run (not just the lint trap) annually. Use a rotary brush kit on a drill. Check the exterior termination cap for blockage, lint buildup, or birds/rodents nesting in it

**Seasonal and climate-specific:**
- Chimney and fireplace: Annual inspection by a Certified Chimney Sweep (CSIA-certified) if the fireplace is used more than 3 times per year. Inspect for creosote buildup (Class 1 = light dusty, Class 2 = shiny flaky, Class 3 = tar-like glazed -- Class 3 requires professional removal before use), cracked flue tiles, failed mortar crown
- Deck/wood structure: Inspect annually in spring. Test boards by pressing with thumb -- soft spots indicate rot. Probe around ledger board connection to house (the ledger is the most failure-prone point; it must have flashing and proper lag bolt spacing). Re-seal decking every 2-3 years with penetrating water repellent; repaint/restain every 4-6 years

---

### Step 4: Apply Home-Age Modifications

Layer these additional tasks onto the base calendar based on the home's construction era:

**Pre-1950 homes:**
- Electrical system: Verify that knob-and-tube wiring has been fully replaced. If K&T is still present, it cannot be safely insulated over (creates fire risk) and is likely at end of service life (70+ years). This is an urgent professional evaluation, not a DIY assessment
- Lead paint: Present in virtually all homes built before 1978. For pre-1950 homes, assume all painted surfaces have lead. Any sanding, scraping, or demolition of painted surfaces requires EPA Renovation, Repair, and Painting (RRP) rule compliance -- either hire a certified renovator or use full containment and HEPA vacuum protocols
- Cast iron drain pipes: Expected service life 75-100 years. Homes with original cast iron drains should have a plumber perform a camera inspection if there are recurring slow drains, to check for interior corrosion (graphitization), cracking, or root intrusion
- Galvanized steel supply lines: Galvanized pipe corrodes from the inside, progressively reducing flow and leaching iron. If original galvanized supply lines are still in place, add replumbing to the 3-5 year capital plan -- don't wait for a pinhole failure

**1950-1978 homes:**
- Lead paint: Present in homes built before 1978. Stable, intact paint is not a hazard -- peeling or disturbed paint is. Annual check of any deteriorating painted surfaces
- Asbestos: Present in floor tiles (9x9 inch vinyl tiles are a reliable indicator), pipe insulation, duct insulation, textured ceilings (popcorn ceilings pre-1978), and roof shingles from this era. Do not disturb -- encapsulate or hire a licensed abatement contractor
- Electrical panel: Federal Pacific Stab-Lok and Zinsco panels from this era have well-documented failure modes (breakers that don't trip under fault conditions). If present, prioritize replacement as a safety item, not a discretionary upgrade
- Aluminum wiring: Used in homes built roughly 1965-1973 during the copper shortage. Aluminum branch circuit wiring requires CO/ALR rated devices and anti-oxidant compound at connections, or full replacement -- a licensed electrician should evaluate

**1979-1999 homes:**
- Polybutylene plumbing (gray plastic pipe, often with gray or blue fittings): Used from approximately 1978-1995. Known for chlorine degradation leading to brittle cracking and sudden failure. If present, budget for full replumbing ($3,000-8,000 for average home) -- this is not a "monitor it" situation
- EIFS/synthetic stucco: Popular in the 1990s. Water intrusion behind EIFS is nearly invisible until rot is severe. Annual inspection by probing with a moisture meter at corners, windows, and penetrations is warranted
- Builder-grade HVAC systems from this era are approaching or past their design life (furnaces: 15-25 years; AC compressors: 12-17 years). Add system-age tracking to the calendar

**2000-2015 homes:**
- Systems generally mid-life. Focus on preventive maintenance to maximize remaining service life
- Verify any manufacturers' extended warranties are still active and are being maintained (many require documented annual service)
- Chinese drywall was used in some homes built 2001-2009 in the Southeast (mainly Florida). Indicator: sulfur smell, corroded copper wiring/coils. If suspected, professional testing is required

**2016-present (under 10 years):**
- Builder warranty: Typically 1 year workmanship, 2 years mechanical systems, 10 years structural defects. Flag warranty expiration dates explicitly
- Register all appliances immediately for manufacturer warranty
- Reduce roof and foundation inspection frequency -- annual ground-level visual is sufficient for first 5 years
- Focus on establishing baseline habits: filter changes, detector testing, gutter cleaning

---

### Step 5: Build the Annual Cost Projection

Present costs in three tiers:

**Maintenance cost benchmarks:**
- Homes under 10 years old: 0.5-1% of home value per year
- Homes 10-30 years old: 1-2% of home value per year
- Homes 30-50 years old: 2-3% of home value per year
- Homes over 50 years old: 3-4%+ of home value per year, with potential for capital expenditures on aging systems

**Annual recurring baseline costs (typical single-family home):**
- HVAC filters (four 1-inch changes/year): $30-100
- HVAC professional service (furnace + AC): $160-330
- Gutter cleaning (twice/year, professional): $150-400
- Water heater flush (DIY): $0-15
- Dryer vent cleaning (DIY): $0-30
- Smoke/CO detector batteries: $20-50
- Exterior caulk and sealant: $20-80
- Miscellaneous supplies (drain cleaner, lubricants, light bulbs, weatherstripping): $50-150

**Typical annual total (DIY-friendly homeowner, no major issues): $450-1,100**
**Typical annual total (hiring most tasks out): $1,200-2,800**

**Capital expense planning (set aside separately from routine maintenance):**
- HVAC replacement (furnace + AC): $5,000-15,000, expected at 15-25 years
- Water heater replacement: $800-2,000 installed, expected at 8-15 years
- Roof replacement (asphalt shingle): $8,000-20,000, expected at 20-30 years
- Exterior paint: $3,000-8,000, expected every 7-10 years
- Appliance replacement: $500-2,500 each, expected at 10-15 years per appliance

Recommend the 1% rule as a savings-account target, adjusted upward for home age.

---

### Step 6: Assign Priority Ratings

Every task must be rated. Use this framework consistently:

**Critical -- Do not skip:**
Tasks where skipping for more than one cycle creates a documented risk of damage exceeding $1,000, a safety hazard, or accelerated system failure. Examples: HVAC filter changes, gutter cleaning, exterior hose bib winterization, smoke/CO detector maintenance, water heater flush, sump pump testing, dryer vent cleaning

**Important -- Strongly recommended:**
Tasks where skipping accelerates wear, reduces efficiency, or creates a developing problem that will become expensive within 2-3 years. Examples: exterior caulking, grading inspection, deck inspection, basement moisture monitoring, GFCI testing

**Beneficial -- Recommended when time and budget allow:**
Tasks that maintain appearance, improve comfort, or extend cosmetic life. Skipping one year has minimal structural consequence. Examples: power washing, ceiling fan direction reversal, window cleaning, garage organization, exterior lighting inspection

---

### Step 7: Deliver the Calendar and Systems Summary

Produce the full 12-month table calendar in the format specified below. Then provide:
- A Systems Summary table with service intervals and tracking columns
- A Priority Tasks list (top 5 "never skip" items with explicit consequences)
- A Capital Expense Watch List for systems approaching end of service life
- Home-age-specific notes if applicable

---

### Step 8: Offer to Customize Further

After delivering the calendar, explicitly offer:
- Printable/export format if the user wants to print or share
- A reminder system prompt (suggest they set recurring calendar reminders for Critical tasks)
- Adjustment if they discover additional systems not mentioned in their original profile
- A deferred maintenance catch-up plan if they indicated they've been behind on upkeep

---

## Output Format

```
## Annual Home Maintenance Calendar

**Home Profile:** [Home type] | Built [year] ([age] years old) | [Climate region]
**Systems:** [Heating type] / [Cooling type] | [Roof material] | [Foundation type]
**Special Features:** [Trees / Septic / Well / Pool / etc. or "None noted"]
**Estimated Annual Maintenance Cost:** $[low] – $[high] (routine tasks, DIY-assisted)
**Capital Expense Watch List:** [List any aging systems with approximate replacement timeline]

---

### January
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|
| [Task name: brief description of what to do and why] | [X min/hr] | $[X-X] | $[X-X] | [DIY / Pro / Either] | [Interval] | [Critical/Important/Beneficial] |

### February
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### March
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### April
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### May
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### June
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### July
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### August
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### September
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### October
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### November
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

### December
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|

---

### Systems Tracking Summary
| System | Service Interval | Notes | Last Service | Next Due |
|--------|-----------------|-------|-------------|----------|
| HVAC filter ([size]) | Every [X] days | [MERV rating recommendation] | _______ | _______ |
| AC professional tune-up | Annually ([month]) | Check coils, refrigerant, capacitors | _______ | _______ |
| Furnace/heat professional tune-up | Annually ([month]) | Heat exchanger, burner, flue | _______ | _______ |
| Water heater flush | Annually ([month]) | [Tank or tankless note] | _______ | _______ |
| Anode rod inspection | Every 3-4 years | Magnesium preferred | _______ | _______ |
| Gutter cleaning | [X]x/year ([months]) | [Notes for heavy tree cover] | _______ | _______ |
| Dryer vent cleaning | Annually ([month]) | Full duct run, not just lint trap | _______ | _______ |
| Smoke detector test | Monthly | Replace unit every 10 years | _______ | _______ |
| CO detector test | Monthly | Replace unit every 5-7 years | _______ | _______ |
| Sump pump test | Quarterly ([months]) | [If applicable] | _______ | _______ |
| Roof professional inspection | Every [X] years | [Age/condition note] | _______ | _______ |
| Chimney/flue inspection | Annually ([month]) | [If applicable] | _______ | _______ |
| Septic pumping | Every 3-5 years | [If applicable] | _______ | _______ |
| Well water test | Annually (bacteria) / Every 3 yrs (full panel) | [If applicable] | _______ | _______ |
| Whole-house water shut-off exercise | Annually | Prevent valve seizure | _______ | _______ |

---

### Priority Tasks -- Do Not Skip
1. **[Task]** -- [Specific consequence of skipping with dollar amount or safety risk]
2. **[Task]** -- [Specific consequence]
3. **[Task]** -- [Specific consequence]
4. **[Task]** -- [Specific consequence]
5. **[Task]** -- [Specific consequence]

---

### Home-Age Notes
[Include only if home is pre-1980 or over 30 years old. List specific aging concerns: pipe material, electrical panel era, lead paint status, system end-of-life timeline.]

### Capital Expense Watch List
| System | Age | Expected Remaining Life | Estimated Replacement Cost | Suggested Savings/Year |
|--------|-----|------------------------|---------------------------|------------------------|
| [HVAC furnace] | [X yrs] | [X-X yrs] | $[X,XXX-X,XXX] | $[XXX] |
| [AC unit] | [X yrs] | [X-X yrs] | $[X,XXX-X,XXX] | $[XXX] |
| [Water heater] | [X yrs] | [X-X yrs] | $[XXX-X,XXX] | $[XXX] |
| [Roof] | [X yrs] | [X-X yrs] | $[X,XXX-XX,XXX] | $[XXX] |
```

---

## Rules

1. **Never assign a seasonal task without adjusting for the stated climate region.** A northern-climate homeowner in Minnesota should winterize hose bibs in October; a southern homeowner in Georgia has no such requirement except in rare freeze-event years. Serving generic advice to the wrong climate is one of the most common failures in home maintenance guidance.

2. **HVAC filter intervals must reflect the actual filter type, not a generic "every 3 months."** A 4-inch media filter (such as those used in high-capacity air handlers) has a 6-12 month service interval; a standard 1-inch filter has a 60-90 day interval. Pets in the home reduce all intervals by 30-50%. Stating the wrong interval can cause equipment damage or poor air quality.

3. **Separate DIY costs from professional costs in every task entry.** A homeowner who decides to hire gutter cleaning needs a different number than one who cleans their own gutters. Both numbers must be present. Never state only one.

4. **Flag all tasks requiring professional expertise with the specific reason** -- not just "Pro recommended." The reason matters: working at heights over 12 feet, handling refrigerants (EPA Section 608 certification required), gas line connections, structural assessment, asbestos/lead-disturbing work, electrical panel work. This helps the user understand the risk, not just the recommendation.

5. **Never skip the water heater anode rod on homes where the heater is 8+ years old.** This is the single most neglected maintenance task with the highest ROI. A $20-50 anode rod replacement extends a $1,000-2,000 water heater by 5-10 years. Always include it in the systems summary.

6. **Polybutylene plumbing, Federal Pacific/Zinsco electrical panels, and knob-and-tube wiring are safety issues, not maintenance items.** If the home profile suggests any of these are present, flag them separately as priority professional evaluations, not as calendar tasks that can be scheduled like gutter cleaning.

7. **Dryer vent cleaning must specify the full duct run, not the lint trap.** The lint trap catches approximately 75% of lint; the remaining 25% accumulates in the duct, especially at bends and transitions. The exterior termination cap must also be checked. Omitting this distinction leads to fires that occur even in homes where the user thinks they've completed this task.

8. **Sump pump testing is quarterly in climates with wet springs and fall, not annual.** A sump pump that fails in April during snowmelt can cause $10,000-50,000 in basement flooding damage. January, April, July, and October are standard test months. Do not reduce to annual testing unless the home is in an arid climate with no basement.

9. **Cost estimates must be current-order-of-magnitude realistic.** Do not use cost figures from more than a few years prior. HVAC tune-up: $80-180 per unit (2020s pricing). Gutter cleaning: $150-350 for an average single-story home, $200-500 for two-story. Roof inspection (professional): $150-400. Water heater replacement (tank, installed): $900-2,200. If costs seem outdated, err on the high side and note that local pricing varies significantly.

10. **Always include the consequence of skipping for every Critical task.** Stating "replace HVAC filter" is insufficient. Stating "replace HVAC filter -- clogged filters reduce airflow, increase energy use by 15-25%, and accelerate blower motor and compressor wear, potentially shortening a $6,000-10,000 system's life by 3-7 years" gives the user a reason to actually do it. Motivation drives compliance; compliance prevents damage.

---

## Edge Cases

### Condo or Townhouse with HOA

The HOA typically owns the exterior envelope, roof, common area mechanicals, and shared systems. The unit owner typically owns: everything inside the walls (plumbing from the first shutoff inside the unit, electrical from the breaker panel), HVAC air handler and thermostat, water heater, appliances, smoke/CO detectors, balcony or patio surfaces per the CCRs, and window/door interiors.

Remove all roofing, siding, exterior caulking, gutter, and lawn/tree tasks from the calendar. Replace with: annual review of the HOA's maintenance responsibilities and reserve fund status (a well-funded HOA should have a reserve study; an underfunded HOA is a financial risk to unit owners), and reporting protocols for any exterior damage the user observes.

Focus the condo calendar on: HVAC filter and in-unit system maintenance, water heater (if in-unit), smoke/CO detectors, appliance maintenance, in-unit plumbing fixture checks, and window/door weatherstripping. Note explicitly: "Verify your CC&Rs and unit boundary definition -- some HOAs own the HVAC system, some do not."

### Recently Purchased Home With Unknown Maintenance History

When a user does not know when systems were last serviced, the calendar must include a catch-up inspection phase before establishing the recurring schedule.

First month after purchase:
- Hire a licensed home inspector (if not already done at purchase) or use the purchase inspection report as baseline
- Flush the water heater regardless of when it was last done -- if it has never been flushed and is over 5 years old, sediment is almost certainly present
- Change all HVAC filters immediately -- do not wait for the calendar interval
- Test every smoke detector and CO detector; replace all batteries and replace any unit over 10 years old
- Locate and label: main water shut-off, electrical panel breakers, gas meter shut-off, sump pump, and HVAC filter locations
- Request maintenance records from the sellers for HVAC service, roof repairs, and major appliances

Do not set system "next due" dates until you have confirmed "last service" dates through records or fresh servicing.

### Home With Septic System

Add the following to the calendar and systems summary:

- **Septic pumping:** Every 3-5 years for a typical 2-4 bedroom home (1,000-1,500 gallon tank). A household of 4+ people with high water use should pump every 2-3 years. Cost: $300-600 for pumping; $500-900 if inspection/risers included
- **Annual visual inspection of drain field:** Look for saturated soil, unusually lush green patches (indicating effluent surfacing), or sewage odor. These are signs of drain field failure -- a $5,000-30,000 repair. Do not plant trees within 30 feet of the drain field
- **What not to put down drains:** Flushable wipes (not septic safe despite labeling), grease, bleach in large quantities, antibacterial products in excess (kills the beneficial bacteria), prescription medications, or any non-organic materials. Add this as a standing household rule, not just a maintenance task
- **Distribute laundry loads:** Running multiple consecutive large loads overwhelms the system's hydraulic capacity. Space loads throughout the day or over multiple days
- **Do not drive or park on the drain field** -- compaction destroys the percolation structure

Flag the pumping schedule as Critical with this consequence: a full septic tank that is not pumped allows sludge to overflow into the drain field, destroying biomat structure. Drain field replacement costs $5,000-30,000 and may require permit approval and soil testing before any repair begins.

### Well Water System

Add to the calendar:

- **Annual bacteria testing:** Test for total coliform and E. coli every year, ideally in spring after snowmelt (contamination risk is highest). A certified laboratory test costs $20-50. Do not use home test kits for regulatory-quality results
- **Comprehensive water quality panel:** Every 3 years, test for nitrates, pH, hardness, iron, manganese, arsenic, and radon (radon in well water is a significant issue in granite-geology regions including New England, Appalachian states, and parts of the Rocky Mountain region). Cost: $150-350 depending on panel
- **Pressure tank inspection:** Annual check of tank pressure (should be 2 PSI below pump cut-in pressure, typically 28 PSI for a 30/50 switch). A waterlogged pressure tank causes the pump to short-cycle, dramatically shortening pump life. Replace bladder or full tank if pressure is consistently off
- **Well cap inspection:** Annual check that the well cap is secure, intact, and above grade. Vermin, insects, and surface water entering around a compromised well cap are leading causes of bacterial contamination
- **Well pump service life:** Submersible well pumps last 8-15 years. If the home's pump is approaching or past 10 years, begin budgeting $1,500-4,000 for replacement (cost includes pulling the pump and well casing work)

### Extreme Northern Climate (Subarctic / Cold Zone 7-8)

Add or modify:

- **Pipe freeze prevention:** Begin by mid-October. Insulate all pipes in unheated spaces (rim joist cavities, crawlspace, attached garage walls) with foam pipe insulation (minimum 1/2-inch wall thickness). For copper pipes in exterior walls with known cold spots, consider thermostatically controlled heat tape. Know that heat tape has a service life of 3-5 years and must be replaced when discolored, cracked, or sparking
- **Ice dam prevention:** Ice dams form when warm air from the living space escapes into the attic, melts snow on the roof, and the meltwater refreezes at the cold eaves. Prevention requires air sealing (not just insulation) of the attic floor -- around light fixtures, plumbing penetrations, and top plates. Minimum attic insulation target: R-49 to R-60 for cold climates. If ice dams are recurring, inspect attic insulation and air sealing before the next winter, not during
- **Snow load monitoring:** Flat or low-slope roofs and older structures in heavy snowfall areas (annual snowfall over 60 inches) should have snow removed when accumulation exceeds 12-18 inches. Use a roof rake from ground level; do not walk on a snow-covered roof. The calculated flat roof design load for northern climates is typically 25-40 PSF; fresh snow is 5-20 PSF per foot of depth, wet/dense snow can be 20+ PSF per foot
- **Spring frost heave inspection:** After winter, inspect foundation, driveway, walkways, and deck footings for heave-induced movement. Minor annual movement is typical; progressive worsening year over year warrants a structural evaluation

### New Construction Home (Under 2 Years Old)

The primary risk in this period is not wear-based failure but warranty management and settling-related issues:

- **Builder warranty calendar:** Note exact expiration dates for workmanship warranty (typically 1 year), systems warranty (2 years), and structural warranty (10 years, required by many state statutes). Conduct a formal walkthrough inspection with a third-party home inspector at the 11-month mark (just before the workmanship warranty expires) to document any punch-list items for builder correction
- **Settlement cracks:** Expect hairline cracks in drywall at corners, above door frames, and where walls meet ceilings during the first 1-3 years. These are typically non-structural shrinkage cracks from lumber drying. Monitor width -- cracks wider than 1/8 inch, diagonal cracks radiating from window/door corners, or cracks that reappear after patching warrant a structural evaluation
- **Grading settlement:** New construction grade often settles, creating low spots that direct water toward the foundation. Check and correct grading in the first 2-3 springs
- **Reduce professional inspection frequency:** Roof inspection every 5 years (or after severe weather). Foundation: annual visual only. Focus resources on establishing habits and documenting the home's baseline

---

## Example

**User Input:** "I just bought a 1985 single-family home in the Mid-Atlantic region. It has a gas furnace, central AC, asphalt shingle roof, full basement, and mature oak trees in the yard. What maintenance should I be doing?"

---

## Annual Home Maintenance Calendar

**Home Profile:** Single-family detached | Built 1985 (40 years old) | Temperate/Mid-Atlantic (Climate Zone 5-6)
**Systems:** Gas forced-air furnace / Central AC (split system) | Asphalt shingle roof | Full basement (unfinished assumed)
**Special Features:** Mature oak trees overhanging or near structure (increases gutter frequency)
**Estimated Annual Maintenance Cost:** $1,600 -- $3,000 (DIY-assisted) | $2,800 -- $5,200 (mostly hired out)
**Note on Home Age:** At 40 years old, this home falls in the 2-3% of home value annual maintenance range. Budget accordingly. See Home-Age Notes and Capital Expense Watch List below.

---

### January
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|
| Replace HVAC filter (1-inch, MERV 8-11) | 10 min | $8-25 | N/A | DIY | Every 60-90 days | Critical |
| Test sump pump: pour 5 gallons into pit, confirm float activation and discharge | 15 min | $0 | N/A | DIY | Quarterly (Jan/Apr/Jul/Oct) | Critical |
| Check attic for ice dam evidence: frost on sheathing, icicles forming at eave overhang | 30 min | $0 | N/A | DIY | Annual | Important |
| Inspect basement for new moisture, efflorescence (white mineral deposits), or crack changes | 20 min | $0 | $0 | DIY | Semi-annual | Important |
| Test all smoke detectors and CO detectors with test button | 10 min | $0 | N/A | DIY | Monthly | Critical |
| Lubricate door hinges and deadbolt hardware (prevents corrosion and binding) | 15 min | $5-10 | N/A | DIY | Annual | Beneficial |

### February
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|
| Test all GFCI outlets: press test button (outlet goes dead), press reset -- replace any that fail | 20 min | $15-25 per outlet if replacing | $75-150/outlet Pro | DIY | Semi-annual (Feb/Aug) | Important |
| Clean range hood grease filter: soak 15 min in hot water + degreaser, rinse, dry | 20 min | $5-10 | N/A | DIY | Quarterly | Beneficial |
| Check weatherstripping on all exterior doors: close door on paper strip -- resistance indicates good seal | 20 min | $15-40 if replacing | $80-150 Pro | DIY | Annual | Important |
| Inspect water heater for corrosion at fittings, discoloration around base, and pressure relief valve condition | 15 min | $0 | $0 | DIY | Annual | Important |
| Review homeowner's insurance policy: update dwelling coverage to reflect current rebuild costs (not market value) | 30 min | $0 | N/A | DIY | Annual | Important |

### March
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|
| Replace HVAC filter | 10 min | $8-25 | N/A | DIY | Every 60-90 days | Critical |
| Schedule AC professional tune-up (book now -- HVAC firms fill rapidly in April-May) | 5 min | N/A | $100-180 | Professional | Annual | Critical |
| Inspect exterior grading: soil should drop 6 inches over first 10 feet from foundation perimeter | 30 min | $0 inspection; $200-800 regrading | $500-1,500 Pro | DIY inspect, Pro fix | Annual | Critical |
| Inspect exterior caulking at all window frames, door frames, and wall penetrations: replace cracked, shrunken, or separated caulk | 45 min | $20-60 | $200-400 Pro | DIY | Annual | Important |
| Check crawlspace vents (if applicable) or basement window wells: clear debris, confirm no standing water | 20 min | $0 | N/A | DIY | Annual | Important |
| Operate main water shut-off valve: turn off fully, turn back on -- replace ball valve if it sticks or leaks | 10 min | $0 | $150-300 Pro if valve fails | DIY | Annual | Important |

### April
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|
| Clean gutters and downspouts (spring -- post-oak-pollen / bud drop): flush with hose, check slope | 1.5-2 hr | $0 (DIY) | $175-300 | DIY or Pro | Semi-annual + mid-summer check | Critical |
| Inspect roof from ground with binoculars: missing/curled shingles, granule loss, lifted flashing | 20 min | $0 | $150-350 Pro full inspection | DIY | Semi-annual (Apr/Oct) | Critical |
| Test smoke and CO detectors, replace all batteries | 20 min | $15-30 | N/A | DIY | Semi-annual (Apr/Oct) | Critical |
| Test sump pump | 15 min | $0 | N/A | DIY | Quarterly | Critical |
| Turn on exterior hose bibs: open slowly, check under house for dripping at the pipe connection | 15 min | $0-15 | $75-150 Pro if fitting cracked | DIY | Annual | Important |
| Inspect deck or porch: probe boards for soft spots (rot), check ledger board flashing, look for popped nails/screws | 30 min | $0 inspection; $50-200 for spot repairs | $400-1,200 Pro repairs | DIY inspect | Annual | Important |

### May
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|
| Replace HVAC filter (if 60-day interval) | 10 min | $8-25 | N/A | DIY | Every 60-90 days | Critical |
| Confirm AC professional tune-up is scheduled or completed | 5 min | N/A | $100-180 | Professional | Annual | Critical |
| Inspect window screens: repair or replace torn/damaged screens before summer | 30 min | $5-20 per screen | $30-60 Pro per screen | DIY | Annual | Beneficial |
| Power wash siding, deck, and front walkway: remove mold, mildew, and oxidation | 2-3 hr | $50-80 (rental) | $250-500 Pro | DIY or Pro | Annual | Beneficial |
| Check dryer vent exterior termination cap: confirm flap opens freely, no lint buildup or bird nest | 10 min | $0-15 | N/A | DIY | Semi-annual (May/Nov) | Critical |
| Trim any oak tree branches within 10 feet of roof or overhanging gutters: reduces debris load and prevents branch-impact damage | 1-3 hr | $0 small branches | $350-1,200 Pro (large branches) | Pro for branches over 4 inches diameter or over 12 ft height | Annual | Critical |

### June
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|
| Flush water heater: shut off cold supply, attach hose to drain valve, drain 3 gallons until clear | 30 min | $0-10 | $80-150 Pro | DIY | Annual | Critical |
| Inspect attic: confirm ridge and soffit vents are unobstructed, check for pest activity, check insulation depth (target R-38 for Mid-Atlantic) | 30 min | $0 | N/A | DIY | Annual | Important |
| Check AC condensate drain line: pour 1/2 cup white vinegar or diluted bleach (1:16 ratio) into primary drain line access port to prevent algae clog | 10 min | $2-5 | N/A | DIY | Semi-annual (Jun/Sep) | Important |
| Mid-year gutter check (oak trees warrant extra cleaning due to leaf and twig drop) | 30 min | $0 | $100-175 Pro | DIY or Pro | As needed / semi-annual | Important |
| Inspect exterior paint and siding: look for peeling, bubbling, or dark staining behind siding | 30 min | $0 | $0 | DIY | Annual | Important |

### July
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|
| Replace HVAC filter | 10 min | $8-25 | N/A | DIY | Every 60-90 days | Critical |
| Test sump pump | 15 min | $0 | N/A | DIY | Quarterly | Critical |
| Check basement for moisture after heavy rain events: look for seepage at wall-floor joint and window wells | 15 min | $0 | N/A | DIY | As needed / monthly in summer | Important |
| Inspect deck for sun-induced wood cracking or finish failure: refinish if water no longer beads on surface | 20 min | $0 (inspect); $50-150 (refinish materials) | $400-900 Pro | DIY | Every 2-3 years | Beneficial |

### August
| Task | Time Estimate | Cost (DIY) | Cost (Pro) | DIY or Pro | Frequency | Priority |
|------|---------------|------------|------------|------------|-----------|----------|
