---
name: home-safety-inspection
description: |
  Creates a room-by-room home safety inspection checklist covering fire safety,
  electrical hazards, carbon monoxide risks, fall prevention, water damage
  indicators, and child/pet safety. Includes specific testing procedures and
  replacement schedules for safety devices. Use when the user asks about home
  safety checks, wants to childproof their home, needs a safety device testing
  schedule, or is preparing for seasonal safety reviews. Do NOT use for
  structural home inspection (hire a licensed home inspector), mold testing
  (requires professional testing), or commercial building safety compliance.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance checklist analysis"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Home Safety Inspection

## When to Use

Use this skill when the user's request falls into one of the following categories:

- **New home walkthrough:** User has recently moved into or purchased a home and wants to verify that basic safety systems are functional, properly placed, and up to date
- **Seasonal safety audit:** User wants to perform a spring or fall review of home safety systems -- seasonal transitions are the most common trigger for battery replacement, equipment testing, and hazard identification
- **Childproofing request:** User has or is expecting a child under age 5 and wants a systematic room-by-room guide to eliminating access hazards, securing furniture, and setting safe appliance temperatures
- **Safety device questions:** User asks about smoke detector placement, CO detector requirements, GFCI testing, fire extinguisher selection, or replacement schedules for any of these devices
- **Elder safety or aging-in-place preparation:** User is preparing a home for an older adult with mobility or vision limitations and needs fall prevention, lighting, and accessibility checks
- **Post-incident review:** User has experienced a minor fire, electrical trip, slip, or near-miss and wants to audit related systems
- **Rental/tenant verification:** User wants to confirm their landlord has met minimum habitability and safety requirements before signing a lease or after moving in
- **Pre-sale preparation:** User is selling a home and wants to address safety deficiencies before listing or before a buyer's inspection

**Do NOT use this skill when:**
- The user suspects structural failure (foundation cracks, roof sagging, load-bearing wall damage) -- refer them to a licensed home inspector ($300-$500 typical cost) who follows ASHI or InterNACHI inspection standards
- The user has visible mold growth exceeding 10 square feet or suspects hidden mold from musty odors and water intrusion history -- professional mold assessment and air sampling is required ($300-$600); DIY surface swabs are not reliable for hidden mold
- The user needs commercial building safety compliance (fire suppression systems, ADA egress requirements, OSHA workplace standards, occupancy load calculations) -- use a commercial fire safety or code compliance specialist
- The user reports a current active hazard (gas smell, sparking wires, active fire) -- direct them to 911 or their gas utility emergency line immediately; do not proceed with an inspection workflow
- The user needs an asbestos assessment -- pre-1980 homes with popcorn ceilings, floor tiles, or pipe insulation require professional asbestos testing before any disturbance; EPA and OSHA regulations govern this specifically
- The user is requesting a full electrical system inspection beyond outlet and panel visual assessment -- this requires a licensed electrician and local permit inspection
- The user needs a full plumbing inspection including drain scoping or supply line pressure testing -- this requires a licensed plumber

---

## Process

### Step 1: Gather Profile Information Before Generating Any Checklist

Never generate a generic checklist immediately. The quality of a home safety inspection depends entirely on the home's specific characteristics. Ask the user for the following, or infer from context if they have already provided it:

- **Home type:** Single-family detached, townhouse, condo, apartment, manufactured/mobile home. This determines which exterior and structural checks apply and whether the user has any responsibility for common areas
- **Number of floors above grade:** Each floor requires its own smoke detector and CO detector placement. Multi-story homes have additional stair and egress concerns
- **Basement type:** Finished, unfinished, or no basement. Unfinished basements have distinct electrical, radon, and moisture hazards. Finished basements require full room treatment
- **Year built:** Pre-1978 triggers lead paint considerations. Pre-1985 triggers possible aluminum wiring considerations. Pre-2000 triggers likely absence of arc-fault circuit interrupter (AFCI) protection. Pre-1970 may have no GFCI at all
- **Heating fuel:** Natural gas, propane, oil, electric, wood-burning, or combination. Gas, propane, oil, and wood all produce carbon monoxide; electric heat does not, but an attached gas water heater or kitchen range still creates CO risk
- **Attached garage:** Yes or no. Attached garages are one of the leading pathways for CO intrusion and require specific firewall, door, and detector checks
- **Occupant profile:** Children under age 5 (childproofing overlay), children ages 5-12 (pool/drowning risk, fire escape training), elderly adults (fall prevention overlay), persons with mobility limitations, persons with hearing impairment (visual/vibrating alarm requirements), pets (pet-specific hazards)
- **Specific concern:** If the user has a particular worry (electrical, water damage, fall risk, gas), prioritize that category but still run the full checklist

### Step 2: Identify the Applicable Overlays

Based on the profile, activate the appropriate specialized overlay modules on top of the base inspection:

- **Childproofing overlay:** Triggered by any child under age 5 in the home. Covers outlet covers, cabinet locks, stair gates, furniture anchoring, cord hazards, water temperature, small object hazards, window fall prevention, pool and spa barriers
- **Elder safety overlay:** Triggered by adults 65+ or any adult with documented mobility, balance, or vision impairment. Covers grab bars, handrails, lighting levels, floor surface hazards, medication management, bathroom safety, stair assessment, emergency communication
- **Gas/CO overlay:** Triggered by any gas, propane, oil, or wood-burning appliance or an attached garage. Covers CO detector placement, appliance venting, gas line visual inspection, combustion air supply, backdrafting risk
- **Pre-1978 overlay:** Triggered by home construction date. Adds lead paint awareness for any upcoming renovation work and notes intact paint monitoring
- **Water intrusion overlay:** Triggered by basement presence, user mention of past flooding, visible water staining, or wet crawl space. Covers sump pump testing, window well drainage, downspout extensions, grading, foundation wall staining
- **Radon overlay:** Triggered by any home with ground contact (basement or slab-on-grade construction). Covers testing recommendation, EPA action levels, and mitigation system indicators

### Step 3: Build the Room-by-Room Inspection Checklist

Generate specific checks for each applicable area. Every room gets checked across these dimensions: (1) fire hazards and detection, (2) electrical safety, (3) CO risk sources, (4) slip/trip/fall hazards, (5) water damage indicators, (6) storage and access hazards. Specific rooms to cover:

- **Kitchen:** Smoke detector proximity (not within 10 feet of range to prevent nuisance alarms, but within 20 feet), fire extinguisher placement, range anti-tip bracket, appliance cord condition, GFCI outlets within 6 feet of sink, under-sink chemical storage, exhaust fan function
- **Each Bathroom:** GFCI outlet presence and function, electrical items near water, water temperature from tap, slip hazards, medication storage, ventilation fan function (prevents mold growth -- fan should be used during and 20 minutes after showering)
- **Each Bedroom:** Smoke detector mounted on ceiling or high on wall, two exit routes (door plus operable window), window egress size (minimum 5.7 sq ft opening, 20-inch minimum width, 24-inch minimum height per IRC), electrical outlet condition, no extension cords used as permanent wiring, space heater clearance if applicable
- **Living Room and Dining Room:** Smoke detector if no adjacent detector covers the space, fireplace/wood stove clearance (minimum 36 inches to combustibles), hearth extension condition, chimney damper function, electrical outlet load assessment, area rug trip hazards
- **Stairways (all):** Handrail presence and stability on both sides for stairs wider than 44 inches (one side minimum for narrower stairs), riser height consistency (uneven risers cause most stair falls), tread surface condition, lighting at top and bottom with switches at both ends, baluster spacing under 4 inches
- **Basement (if applicable):** Smoke detector, CO detector if any fuel-burning appliance present, GFCI at all outlets (required since 1990 NEC for unfinished basements), water heater temperature setting and pressure relief valve visual, electrical panel visual assessment, sump pump present and operational, radon test status, moisture/efflorescence on walls
- **Garage (if applicable):** CO detector mounted at breathing height (not floor level -- CO is slightly lighter than air and mixes throughout, but the CO standard for garage placement is 5 feet AFF), fire-rated door to living space with self-closing hinges, no unsealed penetrations in firewall, auto-reverse test on garage door opener, chemical and fuel storage in approved containers, no refrigerators or freezers on non-GFCI circuits (these are frequently on unprotected outlets in older garages)
- **Attic (if accessible):** Ventilation adequate (1 sq ft of free vent area per 150 sq ft of attic floor), insulation not blocking soffit vents, no signs of pest intrusion, no visible electrical issues on accessible wiring, smoke detector if finished
- **Exterior:** Address number visible from street (critical for emergency responders -- minimum 4-inch high numbers contrasting with background), outdoor GFCI outlets functional, deck and porch structural visual (no soft wood, no railing wobble), exterior lighting at all entry points, downspout extensions directing water at least 6 feet from foundation, window wells clear of debris, propane tanks at minimum 10-foot clearance from structure

### Step 4: Compile the Safety Device Status Table

For every safety device in the home, document location, last known test date, manufacture date, and replacement due date. Key device specifications:

**Smoke Detectors:**
- Ionization detectors (most common, less expensive) respond faster to fast-flaming fires; photoelectric detectors respond faster to slow-smoldering fires (which are more common in residential fatalities)
- Best practice: dual-sensor detectors or a combination of both types in the home
- Minimum placement: inside every sleeping room, outside every sleeping area (in hallway), on every level including unfinished basement, in finished attic
- Do not install within 3 feet of any air supply or return vent (air movement creates nuisance alarms)
- Do not install within 10 feet of cooking appliances (steam and grease cause nuisance alarms)
- Battery-operated units: replace 9V or AA batteries annually on a fixed date (use the daylight saving time change or New Year's as the annual trigger), or use 10-year lithium-sealed units
- Hardwired units must be replaced every 10 years; test backup battery at the same frequency as standalone units
- Replace date is stamped on the back of the unit -- the manufacture date, not purchase date, is what matters

**Carbon Monoxide Detectors:**
- CO detectors are electrochemical sensors that degrade over time regardless of use; replacement at 5-7 years is non-negotiable
- Placement: at least one on every level, one outside sleeping areas, one in rooms with a gas-burning appliance if the appliance room is separated from the main living area
- NOT required in homes with 100% electric heat and appliances AND no attached garage -- but strongly recommended as a precaution
- CO alarms with digital displays allow users to see accumulated CO levels; units without displays give no warning until alarm threshold is crossed
- Do not place directly above or beside a gas range (combustion byproducts from normal gas ignition can cause nuisance alarms)
- Do not place within 5 feet of the floor in garages (vehicle exhaust disperses, so mid-wall placement is correct)

**Fire Extinguishers:**
- Class A: ordinary combustibles (paper, wood, fabric)
- Class B: flammable liquids (grease, gasoline, paint)
- Class C: electrical fires
- Class K: commercial cooking grease fires (restaurant-grade equipment)
- For residential use, an ABC-rated multipurpose dry chemical extinguisher handles the vast majority of home fires. A 2.5 lb unit is minimum; a 5 lb unit provides more discharge time and is preferred
- Kitchen: an ABC-rated extinguisher is acceptable for residential kitchens; Class K is only required for commercial cooking equipment
- Monthly inspection: confirm needle is in the green zone on the pressure gauge; confirm the tamper seal on the pin is intact; confirm the nozzle is unobstructed
- After any discharge, even partial, the extinguisher must be professionally recharged or replaced -- internal pressure is lost even if the gauge reads green
- Units over 12 years old must be replaced or hydrostatically tested by a licensed fire extinguisher service

**GFCI Outlets:**
- GFCI (Ground Fault Circuit Interrupter) protection prevents electrocution by detecting a current difference of as little as 4-6 milliamps between hot and neutral wires and cutting power within 1/40th of a second
- Required locations per current NEC (2020): all kitchen counter receptacles within 6 feet of a sink, all bathroom receptacles, garage receptacles, outdoor receptacles, unfinished basement receptacles, crawl space receptacles, boathouse receptacles, laundry area receptacles within 6 feet of a sink
- GFCI outlets protect all downstream outlets on the same circuit when properly wired -- one GFCI outlet near the panel or first in the run can protect multiple outlets; check the "protected" label on downstream outlets
- Test monthly: press TEST button (power should cut immediately -- test with a lamp or phone charger plugged in to confirm), press RESET to restore power
- A GFCI outlet that will not reset or does not cut power on test has failed and must be replaced ($15-25 for DIY replacement; call an electrician if uncertain)
- AFCI (Arc Fault Circuit Interrupter) breakers are also required in modern construction for bedroom circuits and increasingly all living spaces; these require panel-level inspection by an electrician

**Garage Door Opener Auto-Reverse:**
- The entrapment protection system must reverse the door before applying full force, OR must reverse on contact with an obstruction
- Test 1 (force-reverse test): place a 2x4 flat on the ground under the center of the door. Close the door; it must reverse within 2 seconds of contact with the board
- Test 2 (photoelectric sensor test): while the door is closing, pass your leg through the sensor beam; the door must reverse immediately
- If either test fails, adjust the force limit or sensitivity dial on the opener unit before calling a technician; if adjustment does not resolve failure, the opener requires professional service or replacement
- Garage door springs are under extreme tension and must NEVER be adjusted by the homeowner; always call a garage door service professional

### Step 5: Add Applicable Overlay Checks

Once the base checklist is complete, add the triggered overlay modules as clearly labeled supplemental sections. Do not bury overlay items within the room-by-room table -- keep them as a distinct addendum so the user knows exactly which items are specific to their household profile. Overlay content is detailed in the Edge Cases section below.

### Step 6: Generate the Priority Action List

Rank every finding across four tiers:

- **Immediate (complete today -- life-threatening hazard):** Missing or non-functional smoke/CO detectors, confirmed gas leak, active water intrusion near electrical panel, non-functional GFCI in bathroom with water present, confirmed fire hazard (combustibles against heat source), confirmed drowning risk for toddler (open pool, toilet without lock)
- **Within 1 week (significant risk, not self-resolving):** Water heater set above 120F with young children present, missing stair gates, unsecured tall furniture in home with under-5 children, failed garage door auto-reverse, overloaded circuit or power strip, no fire extinguisher in kitchen, corded blinds with children present
- **Within 1 month (moderate risk, address before seasonal change):** Radon test not conducted, no fire escape plan, missing exterior lighting, deck railing wobble without active failure, downspout draining toward foundation, smoke detector over 8 years old (approaching end of life), no grab bars in bathroom for elderly occupant
- **Improvement opportunity (reduces risk, not urgent):** Upgrading to dual-sensor smoke detectors, adding interconnected alarm system, improving stair lighting, adding a home security monitoring system, installing a whole-house CO monitoring system

### Step 7: Provide the Safety Device Maintenance Schedule

Deliver a complete maintenance calendar, not just a table. Pair each device with its specific test procedure, not just its frequency. Users who know HOW to test a device are far more likely to actually do it than users who only know they should test it monthly. Connect the schedule to real-world anchors (beginning of daylight saving time, first of each month, seasonal changes) so the user can embed it into their existing routine.

### Step 8: Offer the Fire Escape Plan Framework

Every home safety inspection must conclude with fire escape planning. This is consistently the most underutilized component of residential safety. Cover:
- Two escape routes from every sleeping room (primary: door to hallway; secondary: window)
- Window egress requirements: the window must open to at least 5.7 square feet of clear area, minimum 20 inches wide, minimum 24 inches tall, with the opening no more than 44 inches above the floor
- Designated exterior meeting point at least 100 feet from the structure (a specific neighbor's mailbox, a tree, a driveway end)
- Practice frequency: at minimum twice per year (pair with smoke detector test schedule)
- Special considerations for children: assign a responsible adult to each young child's room; never let children hide or return inside; keep bedroom doors closed at night (a closed interior door can hold back smoke and heat for 10-15 additional minutes)
- Special considerations for mobility-impaired occupants: establish a pre-planned room of rescue assistance (a room with a window and phone where the occupant can shelter while others exit and direct emergency responders)

---

## Output Format

```
## Home Safety Inspection Report

**Property:** [Home type] | [Number of floors] | [Year built]
**Occupants:** [List all household members with relevant characteristics: ages, mobility, hearing]
**Heating/Fuel Source:** [Gas / Propane / Oil / Electric / Wood-burning -- specify which appliances]
**Attached Garage:** [Yes / No]
**Inspection Date:** [Date]
**Active Overlays:** [Childproofing / Elder Safety / Gas-CO / Pre-1978 / Water Intrusion / Radon -- list all that apply]

---

### Safety Device Inventory

| Device | Quantity Needed | Quantity Present | Manufacture Date | Replace By | Test Date | Status |
|--------|----------------|-----------------|-----------------|-----------|-----------|--------|
| Smoke detector (each bedroom) | [#] | [#] | [date or unknown] | [year] | [last tested] | ✅ OK / ⚠️ Aging / ❌ Replace / ❌ Missing |
| Smoke detector (each hallway/floor) | [#] | [#] | [date or unknown] | [year] | [last tested] | ✅ / ⚠️ / ❌ |
| CO detector (each floor) | [#] | [#] | [date or unknown] | [year] | [last tested] | ✅ / ⚠️ / ❌ |
| CO detector (outside sleeping area) | [#] | [#] | [date or unknown] | [year] | [last tested] | ✅ / ⚠️ / ❌ |
| Fire extinguisher (kitchen) | 1 | [#] | [date] | [year] | [last checked] | ✅ / ⚠️ / ❌ |
| Fire extinguisher (each additional floor) | [#] | [#] | [date] | [year] | [last checked] | ✅ / ⚠️ / ❌ |
| Fire extinguisher (garage) | 1 | [#] | [date] | [year] | [last checked] | ✅ / ⚠️ / ❌ |
| GFCI outlet (kitchen) | [per circuit] | Present/Absent | N/A | N/A | [last tested] | ✅ / ❌ |
| GFCI outlet (each bathroom) | [per room] | Present/Absent | N/A | N/A | [last tested] | ✅ / ❌ |
| GFCI outlet (garage) | Present/Absent | Present/Absent | N/A | N/A | [last tested] | ✅ / ❌ |
| GFCI outlet (outdoor) | Present/Absent | Present/Absent | N/A | N/A | [last tested] | ✅ / ❌ |

---

### Room-by-Room Inspection

#### [Room Name]

| Check Item | Specific Test / Observation | Status | Priority if Failed |
|------------|---------------------------|--------|-------------------|
| [Safety item] | [Exactly how to verify] | ✅ Pass / ⚠️ Monitor / ❌ Fail / N/A | [Immediate / 1 week / 1 month / Improvement] |

*(Repeat table for each room: Kitchen, Bathrooms, Bedrooms [individually], Living Room, Stairways, Basement, Garage, Attic, Exterior)*

---

### [Overlay Name] Supplemental Checklist
*(Only include sections for activated overlays)*

| Check Item | What to Do | Products / Cost Estimate | Priority |
|------------|-----------|--------------------------|----------|
| [Overlay-specific item] | [Specific action] | [Specific product type, approximate cost] | [Priority tier] |

---

### Priority Action List

#### ❌ Immediate -- Complete Today (Life-Threatening Hazard)
1. [Specific action with specific location in home]
2. [Specific action]

#### ⚠️ Within 1 Week
1. [Specific action]
2. [Specific action]

#### 📋 Within 1 Month
1. [Specific action]
2. [Specific action]

#### 💡 Improvement Opportunities (No Fixed Deadline)
1. [Specific action]
2. [Specific action]

---

### Safety Device Maintenance Schedule

| Device | Test Method (exact steps) | Test Frequency | Battery Replacement | Unit Replacement |
|--------|--------------------------|----------------|--------------------|--------------------|
| Smoke detector | Press and hold test button until alarm sounds (may take 5-10 seconds). Alarm must be audible from all sleeping rooms with doors closed (85 dB minimum). | Monthly | 9V or AA: annually (change on first day of spring or Nov 1). Sealed 10-year lithium: replace entire unit at end of life | Every 10 years from manufacture date |
| CO detector | Press test button; alarm should sound. Check digital display for any accumulated reading above 0 ppm -- persistent low readings (10-35 ppm) indicate a chronic low-level source | Monthly | Per device specs -- typically annually for battery-operated units | Every 5-7 years from manufacture date |
| Fire extinguisher | Check pressure gauge needle is in green zone. Check tamper seal is intact. Check nozzle is clear. Lift to confirm agent has not settled -- gently rotate the canister to loosen dry chemical | Monthly visual inspection | N/A | Every 12 years, or after ANY discharge (even partial), or when gauge shows out-of-range |
| GFCI outlet | Plug a lamp into the outlet. Press TEST button -- lamp must go off. Press RESET -- lamp must come back on. If lamp does not go off on TEST, the GFCI is wired incorrectly or has failed | Monthly | N/A | Immediately if test fails; average lifespan 10-25 years |
| Garage door auto-reverse | Place a 2x4 flat under center of door. Activate close cycle. Door must reverse within 2 seconds of contact. Also wave hand through the photoelectric beam during closing -- door must reverse immediately | Monthly | Check battery backup on opener annually | Service opener if either test fails; do NOT adjust springs yourself |

---

### Fire Escape Plan

**Exit Routes:**
| Room | Primary Exit | Secondary Exit | Window Operable? | Window Meets Egress Size? |
|------|-------------|----------------|-----------------|--------------------------|
| [Bedroom name] | Door to hallway | [Window description] | Yes / No | Yes / No (min 5.7 sq ft, 20" wide, 24" tall) |

**Meeting Point:** [Describe specific exterior landmark at least 100 feet from home]

**Emergency Numbers Posted:** [Yes / No / Location]

**Escape Plan Practice Schedule:** [Date of last practice] | [Date of next scheduled practice]

**Special Considerations:** [Mobility-impaired occupant: room of rescue assistance. Young children: adult assigned to each room.]
```

---

## Rules

1. **Never skip the profile intake.** A home safety checklist generated without knowing the home's age, fuel type, occupants, and layout will miss the most critical hazards. A 1960s gas-heated home with a toddler has almost nothing in common -- from a hazard profile -- with a 2015 all-electric condo with no children.

2. **Smoke detector type matters.** When the user asks about adding or replacing smoke detectors, specify that ionization-only detectors are faster for flaming fires but slower for smoldering fires, which cause the majority of residential fire fatalities. Photoelectric detectors are specifically recommended by the NFPA for bedrooms and sleeping areas. Dual-sensor units ($25-$45) are the best single-device solution. Never recommend ionization-only as the sole detector type.

3. **120°F water heater setting is a hard floor, not a suggestion.** At 130°F, a child receives a full-thickness (third-degree) burn in 30 seconds. At 140°F, the burn occurs in 5 seconds. At 120°F, 5 minutes of exposure is required for a full-thickness burn. Always state the specific burn time data -- this converts the recommendation from abstract to urgent. The setting is labeled "Warm," "120," or "Low" on most residential gas water heaters; on electric water heaters, the thermostat is behind the upper and lower access panels with the circuit breaker off.

4. **GFCI protection is not optional -- document the gap explicitly.** In homes built before 1975, GFCI protection was not required in any location. In homes built before 1990, unfinished basement protection was not required. In homes built before 1993, outdoor receptacles had more limited requirements. Always state the protection gap for older homes and note that GFCI outlets can be retrofitted without rewiring the entire circuit ($15-$25 per outlet for DIY; $75-$150 per outlet professionally installed).

5. **Do not assess the electrical panel beyond visual observation.** Advising a user on what they can safely do at the electrical panel is outside the scope of this skill. You may instruct the user to LOOK at the panel for obvious signs of concern (double-tapped breakers visible at the edges, breakers that feel warm to the touch, evidence of water intrusion, or a panel brand that has a known safety recall -- Federal Pacific Electric Stab-Lok panels and Zinsco/Sylvania panels are associated with documented failure-to-trip issues and warrant a licensed electrician evaluation). Do not instruct the user to reset breakers, rewire outlets, or touch any component inside the panel cover.

6. **Radon is not optional to mention for ground-contact homes.** The EPA estimates radon is the second leading cause of lung cancer in the United States, causing approximately 21,000 deaths per year. Any home with ground contact (finished or unfinished basement, slab-on-grade construction, crawl space) must receive a radon testing recommendation. The EPA action level is 4 pCi/L; many experts recommend mitigation at 2 pCi/L. Passive short-term test kits cost $15-$30 at hardware stores; professional long-term testing costs $150-$300. Mitigation systems (sub-slab depressurization) cost $800-$2,500 installed and reduce radon levels by 99% in most cases.

7. **Furniture tip-over is a leading cause of child death and must never be presented as optional.** CPSC data reports that a child dies from furniture or TV tip-over approximately every two weeks in the United States. Dressers, bookshelves, armoires, and bookcases taller than 30 inches must be anchored to wall studs with anti-tip brackets or furniture straps in any home with children under age 10. The specific products (furniture anchor kits, anti-tip straps, L-brackets into studs) cost $5-$15 per piece and take 15-20 minutes to install. Do not present this as a preference -- present it as a critical safety action.

8. **A fire escape plan is non-negotiable and must always be included.** Statistical data from the NFPA shows that households with practiced fire escape plans have significantly higher survival rates in residential fires. Every output from this skill must include fire escape planning as a section, even if the user only asked about smoke detectors. The plan requires: two exit routes per bedroom, a designated exterior meeting point by name or description, and a scheduled practice (minimum twice per year, ideally aligned with smoke detector test dates).

9. **CO detector placement height is counterintuitive and must be stated explicitly.** CO is approximately the same density as air and disperses throughout a space. It does NOT accumulate at the floor (unlike propane) or the ceiling (unlike natural gas). Therefore, CO detectors should be placed at breathing height (5 feet AFF) or following the manufacturer's recommendation, which is typically mid-wall or at outlet height. Placing a CO detector at floor level is a common mistake that reduces its effectiveness in detecting realistic CO accumulation patterns.

10. **Lead paint and asbestos acknowledgment is legally and medically important.** For any home built before 1978, include a note that paint disturbance (sanding, scraping, demolition, or impact damage) may release lead dust. Include a note for homes with popcorn ceilings, floor tiles, pipe insulation, or ceiling tiles from before 1980 that these materials may contain asbestos. In both cases, do NOT advise the user to test or disturb these materials themselves beyond a visual inspection of paint condition. Direct them to certified testing resources and, for asbestos, to accredited asbestos inspectors (AHERA certification) before any renovation.

---

## Edge Cases

### 1. Home with Children Under Age 5 (Childproofing Overlay)

Children in this age range have distinct hazard profiles: they reach and grasp at counter height, they cannot swim and can drown in 2 inches of water, they put objects in their mouths (choking hazard: any object that fits entirely in a 35mm film canister is a choking hazard), they pull themselves up on furniture and dressers, and they cannot interpret danger signals.

**Critical additions beyond the base inspection:**

- **Outlets:** Install tamper-resistant receptacles (TRRs) or outlet covers on every accessible outlet. TRRs (spring-loaded shutters that only open with simultaneous pressure on both slots) are superior to plug-in covers, which children can remove and which themselves become choking hazards. TRRs are required in new construction under the 2008 NEC. Retrofit TRRs are available for $3-$5 per outlet
- **Cabinet locks:** Install under-sink cabinet locks in every kitchen and bathroom. U-shaped cable locks or magnetic locks are the most effective. Move all cleaning products, personal care products, medications, vitamins, and supplements to locked or above-72-inch storage. Include dishwasher pods (extremely caustic, visually appealing to toddlers) and laundry detergent pods
- **Stair gates:** Hardware-mounted (wall-anchored) gates at the TOP of every stairway. Pressure-mounted gates are acceptable only at the bottom of stairs and in doorways. A child falling through a pressure-mounted gate at the top of stairs is a fatal risk. Gate height must be at least three-quarters of the child's height
- **Blind cords:** Replace all corded window blinds with cordless versions. Inner cord loops on looped-cord blinds and dangling operating cords on traditional blinds are strangulation hazards. The Consumer Product Safety Commission has documented dozens of child strangulation deaths annually from this hazard. Replacement cordless blinds cost $20-$80 per window; this is a mandatory change, not an optional improvement
- **Furniture anchoring:** Anti-tip brackets or furniture straps on ALL furniture taller than 30 inches: dressers, bookshelves, armoires, entertainment centers. TV must be wall-mounted or strapped with an anti-tip strap to the furniture it rests on
- **Window fall prevention:** Install window stops or window guards that limit opening to 4 inches maximum (some jurisdictions require this by code above the second floor). These devices must be openable from inside without a key for fire egress. Do NOT rely on window screens to prevent falls -- screens are not structural and will not support a child's weight
- **Water hazards:** Toilet locks ($10-$20) for any child under 3. Empty all buckets, laundry basins, and kiddie pools immediately after use. Pool and spa barriers are a separate overlay -- any pool must have a 4-sided barrier fence (minimum 4 feet high, self-latching gate, no child-climbable footholds) that isolates the pool from the house
- **Water heater:** Set to 120°F without exception

### 2. Home with Elderly Occupants or Aging-in-Place Preparation (Elder Safety Overlay)

Falls are the leading cause of injury death in adults 65 and older. Approximately 36 million falls occur in this population annually in the United States, resulting in 32,000 deaths per year. The bathroom accounts for over 80% of fall-related injuries in this demographic.

**Critical additions beyond the base inspection:**

- **Grab bars:** Install ADA-compliant grab bars (not towel bars, which are not rated for weight-bearing load -- a person gripping a towel bar during a fall will pull the bar from the wall and likely sustain additional injury) beside every toilet and inside every shower and tub. Bars must be anchored into studs or wall blocking, rated for at least 250 lbs of force. Placement: toilet -- one bar on the dominant side wall at 33-36 inches AFF; shower -- one vertical bar at entry (36-42 inches AFF) and one horizontal bar on the long wall (33-36 inches AFF)
- **Non-slip surfaces:** Non-slip mat with suction cups inside every tub and shower. Non-slip bath mat outside the tub on tile flooring. Remove or firmly secure ALL throw rugs with non-slip backing -- loose rugs are a primary fall hazard on hard floors
- **Lighting:** Hallways, stairways, and the path from bedroom to bathroom must have lighting sufficient for a person with reduced vision to navigate safely. Minimum 60-watt equivalent (800 lumens) per fixture in hallways; install nightlights at 12-inch AFF intervals along the nighttime travel path. Motion-activated nightlights are ideal. Consider lighted light switches for overnight navigation
- **Stair handrails:** Both sides of every stairway, graspable profile (round or oval, 1.25-2 inch diameter), extending the full length of the stair run and 12 inches beyond the top and bottom nosing. Test every rail for stability -- it must withstand 200 lbs of lateral force without deflecting
- **Bathroom modifications:** Raised toilet seat ($30-$80) or comfort-height toilet (17-19 inches versus standard 15-inch height) reduces fall risk during sit-to-stand transition. Shower bench or fold-down shower seat eliminates the need to stand on a wet, slippery surface for prolonged periods. Lever-style faucet and door handles require less grip strength than knobs
- **Emergency communication:** Ensure a telephone or personal emergency response device (medical alert button) is accessible from the floor level (a person who falls may not be able to reach a counter-mounted phone). Confirm at least one person outside the home has a method to check in daily if the occupant lives alone

### 3. Home Suspected to Have Aluminum Wiring (Pre-1973 Construction)

Aluminum wiring was commonly used in residential construction between approximately 1965 and 1973 as a substitute for copper during high copper prices. Aluminum wiring itself is not inherently dangerous, but aluminum expands and contracts more than copper and is more prone to oxidation at connections, which can create high-resistance connections that generate heat and constitute a fire hazard.

Indicators of aluminum wiring: homes built 1965-1973, "AL" or "ALUMINUM" marked on the wiring jacket visible at the electrical panel, silver-colored wires at outlets or switches (copper is gold/orange), prior electrical work reports noting aluminum wiring.

**Critical steps:**
- Do not inspect the electrical panel interior yourself
- Hire a licensed electrician to evaluate the system specifically for aluminum wiring
- Acceptable remediation options (per CPSC): COPALUM crimp connectors (most reliable permanent solution, must be installed by a licensed electrician), AlumiConn connectors (acceptable alternative, also licensed installation), or complete rewiring with copper (most expensive, most comprehensive)
- Pig-tailing with wire nuts is NOT an approved permanent solution for aluminum-copper connections
- The CPSC estimates aluminum wiring connections are 55 times more likely to reach hazardous fire temperatures than copper connections at the same load
- Cost to evaluate: $150-$300 for a licensed electrical inspection. Cost to remediate with COPALUM connectors: $1,500-$5,000 depending on home size

### 4. Attached Garage -- Carbon Monoxide Intrusion Risk

An attached garage is one of the most dangerous features in a home from a CO perspective. A car engine left running in an attached garage -- even with the garage door open -- can produce lethal CO concentrations in the living space within minutes because CO migrates through any gap in the shared firewall.

**Requirements and checks:**
- CO detector required in the living space adjoining the garage -- specifically on the shared wall or in the first room above the garage
- The firewall between the garage and living space must be continuous 5/8-inch Type X gypsum board (or equivalent fire-rated assembly) with no unsealed penetrations. Check for: cable holes drilled and left open, gaps around pipes, unsealed recessed lights, gaps at the top of the wall where the ceiling meets the garage wall. Seal all penetrations with fire-rated caulk or spray foam
- The door between garage and living space must be a fire-rated door (minimum 20-minute fire rating per IRC) with a self-closing mechanism and a positive-latching mechanism. Test by manually opening the door and releasing it -- it must close and latch fully without assistance
- Never run any gasoline-powered equipment (vehicles, lawn mowers, generators, power washers, snowblowers) in the garage with the door closed, even briefly. CO concentration can reach lethal levels (1,200+ ppm) within 10 minutes
- If the user has a CO alarm that is activating intermittently in a room above or adjacent to the garage, CO intrusion from the garage is the leading cause -- do not dismiss this as a detector malfunction

### 5. Apartment or Rental Property

Tenants have a different inspection framework because they share responsibility with a landlord and have limited ability to make structural modifications.

**What to verify at move-in:**
- Smoke detectors working in every required location (most jurisdictions require one per floor and inside every sleeping room). Document any deficiency with photos and a written notice to landlord -- in most jurisdictions, the landlord must remedy within 24-72 hours or faces liability
- CO detector if gas appliances or attached garage are present. In many states, CO detector installation in rental units is a landlord legal obligation
- GFCI outlets in kitchen and bathrooms -- test every one. Document failures in writing
- Window locks on all accessible windows (ground and second floor especially). Every window should have a functioning lock; sliding windows should have a secondary block (a cut wooden dowel in the track) if the lock is weak
- Deadbolt on all entry doors -- a deadbolt must throw at least 1 inch to provide meaningful forced-entry resistance. Check that the door frame has a strike plate with 3-inch screws into the door frame stud (short screws into just the door jamb provide minimal resistance)
- Fire escape route from each sleeping room -- confirm window opens and is not painted or swollen shut
- Identify the circuit breaker/fuse box location and how to access it in an emergency

**What tenants can do themselves:**
- Install plug-in CO detectors and smoke detectors even if the landlord claims they are not required -- these are inexpensive and non-permanent
- Request all safety deficiency repairs in writing (email creates a timestamp and paper trail)
- In most jurisdictions, a tenant can terminate a lease or withhold rent for health and safety violations if the landlord fails to remedy after proper written notice; recommend consulting a local tenant rights organization for jurisdiction-specific guidance

### 6. Seasonal Inspection Triggers -- What Changes by Season

A home's hazard profile shifts meaningfully across seasons. Incorporate these seasonal triggers when the user's inspection request is tied to a time of year:

**Spring (March-May):**
- Test all smoke and CO detectors as part of the daylight saving time ritual (if applicable to region); replace all batteries
- Inspect the roof and gutters for winter damage; clear gutters of debris; check downspout extensions are directing water away from foundation
- Test sump pump: pour water into the pit to trigger the float switch; confirm pump activates and discharges properly. If the pump has a backup battery, test the backup
- Inspect exterior deck and porch for freeze-thaw damage: check for wood rot at post bases (probe with a screwdriver), check railing connections, check for heaved or cracked steps
- Service HVAC: replace filters ($10-$30), schedule professional AC servicing if applicable, clear condensate drain with diluted bleach solution to prevent algae blockage

**Fall (September-November):**
- Second smoke/CO detector battery replacement trigger (if not using 10-year sealed units)
- Chimney inspection and cleaning before first use of the season: creosote buildup (from wood burning) is a leading cause of chimney fires; hire a CSIA-certified chimney sweep annually if using a wood-burning fireplace or stove ($150-$300)
- Disconnect and store outdoor hoses to prevent pipe freeze; locate and test the shut-off for each outdoor faucet
- Test heating system before first cold weather use; replace furnace filter
- Check weatherstripping and door seals; gaps at door frames allow cold drafts and pest entry
- Inspect garage door seals for winter readiness; a door that does not seal at the bottom in winter allows CO to more easily penetrate the living space when vehicles are warming up

### 7. Home with Wood-Burning Fireplace, Pellet Stove, or Wood Stove

Solid-fuel burning appliances require a distinct set of safety checks beyond what the standard gas-appliance CO overlay covers.

- **Creosote accumulation:** Wood smoke deposits creosote (a combustible compound) on chimney interior walls. Creosote fires can exceed 2,000°F and cause catastrophic structural damage. Any wood-burning appliance must have its flue inspected and swept by a CSIA-certified sweep at least annually. Level 2 inspections (with camera) are recommended if chimney condition is unknown
- **Clearance to combustibles:** Minimum 36-inch clearance from the front of the firebox to any combustible material (furniture, rugs, wood floors). Hearth extension must extend at least 16 inches in front of the firebox opening and at least 8 inches on each side
- **Glass doors and fireplace screens:** Both must be present on any active fireplace to prevent sparks and rolling logs from escaping. Glass doors must be closed when a fire is burning unattended
- **Damper function:** Test the damper before every fire season -- it must open fully and close tightly. A damper that does not close tightly wastes significant heat energy and allows animals (squirrels, birds, raccoons) to enter the chimney
- **CO detector placement for wood-burning appliances:** One CO detector in the room containing the appliance and one outside the adjacent sleeping area. Wood burning produces CO, but the primary risk is backdrafting (flue gas pushed back into the living space when the home is too tightly sealed -- a negative pressure condition). Signs of backdrafting: visible smoke or soot around the fireplace opening, soot staining on the mantel or wall, CO alarm activation during burning

---

## Example

**Input:** "We just bought a 1991 colonial with two floors plus an unfinished basement, attached garage, gas heat and water heater, and two kids ages 2 and 4. Never had a safety inspection done. Where do we start?"

---

## Home Safety Inspection Report

**Property:** Single-family colonial | 2 floors above grade + unfinished basement | Built 1991
**Occupants:** Two adults, two children ages 2 and 4
**Heating/Fuel Source:** Natural gas furnace, gas water heater, gas range (assumed from home age/type -- confirm with user)
**Attached Garage:** Yes
**Inspection Date:** [Current date]
**Active Overlays:** Childproofing (children under 5) | Gas-CO | Water Intrusion (basement present) | Radon (basement present)

---

### Safety Device Inventory

| Device | Quantity Needed | Status Guidance |
|--------|----------------|-----------------|
| Smoke detector -- each bedroom | 1 per bedroom (confirm count) | Test each unit; check manufacture date on back. Any unit older than 2014 must be replaced immediately. A 1991 home may have original detectors -- these are 30+ years past their 10-year replacement schedule |
| Smoke detector -- each floor hallway | 1 per floor (2 floors + basement) = 3 minimum | Same aging concern applies |
| CO detector -- each floor | 1 per floor = 2 minimum above grade; 1 in basement near furnace/water heater area | A 1991 home very likely has NO CO detectors -- they were not widely required until the mid-2000s. Treat all CO detectors as missing until confirmed present and within replacement date |
| CO detector -- outside sleeping areas | 1 per sleeping area grouping | Add to master bedroom hallway and any second hallway serving bedrooms |
| Fire extinguisher -- kitchen | 1 (ABC-rated, minimum 2.5 lb, preferably 5 lb) | Mount on wall near exit path from kitchen, not directly beside the stove. Check gauge and tamper seal |
| Fire extinguisher -- second floor | 1 | Mount in hallway near stair head |
| Fire extinguisher -- garage | 1 (ABC-rated) | Mount near the garage entry door to house |
| GFCI -- kitchen | Required within 6 feet of all sinks | 1991 construction should have GFCI per 1990 NEC; test every outlet with test/reset procedure |
| GFCI -- bathrooms | 1 per bathroom (covers all outlets in the room if properly wired) | Test monthly |
| GFCI -- garage | Required at all garage outlets | Test; 1991 garage receptacles should be GFCI-protected per 1990 NEC |
| GFCI -- unfinished basement | Required at all basement outlets | Test; required since 1990 NEC. This home should have them; confirm and test |
| GFCI -- outdoor | Required at all exterior outlets | Test |

**Immediate action on safety devices:** Assume all smoke and CO detectors in a 1991 home are at or past end-of-life unless manufacture dates can be confirmed as post-2015. Replace the entire smoke detector complement. Purchase and install CO detectors on each floor and outside sleeping areas before sleeping in the home with two young children.

---

### Room-by-Room Inspection

#### Kitchen

| Check Item | How to Verify | Status | Priority if Issue Found |
|------------|--------------|--------|------------------------|
| Smoke detector present and functional | Press test button; alarm must sound loudly. Check manufacture date on back | Likely expired -- 1991 home | Immediate |
| Fire extinguisher mounted and accessible | Check wall mount near exit; gauge in green zone; tamper seal intact | Unknown -- likely missing | 1 week |
| GFCI outlets within 6 feet of sink | Press TEST button at each outlet; power to outlet must cut | Should be present per 1990 NEC | Test today |
| No overloaded outlets or power strips | No more than one heat-producing appliance (toaster, coffee maker, microwave) per circuit; daisy-chained power strips are a fire hazard | Inspect all counter outlets | 1 week |
| Range anti-tip bracket installed | Grasp top of stove and pull forward firmly; if oven tilts, bracket is absent or failed | Very important with 2 and 4 year old in home -- a child pulling on open oven door can tip a full range onto themselves | Immediate |
| Appliance cords in good condition | No fraying, cracking, or kinking; no cords running under rugs or pinched in cabinet doors | Visual inspection | 1 week |
| Under-sink cabinet lock installed | Any lock that requires tool or two-handed adult operation | No lock in a 1991 home -- MISSING | Immediate |
| Stove knob covers installed | Childproof covers over all gas or electric knob controls | Not a standard feature -- likely missing | 1 week |

#### Main Floor Bathroom

| Check Item | How to Verify | Status | Priority if Issue Found |
|------------|--------------|--------|------------------------|
| GFCI outlet present and functional | TEST/RESET procedure with lamp | Should be present | Test today |
| No electrical items on counter near water | Hair dryers, electric razors stored away from sink | Visual | 1 week |
| Water temperature from tap | Run hot water fully for 60 seconds; test with an instant-read kitchen thermometer | Target: 120°F or below. 1991 water heaters are often set to 140°F from factory | Immediate if over 120°F |
| Non-slip mat in tub/shower | Confirm suction cups are intact and mat does not slide | Visual | 1 week |
| Ventilation fan working
