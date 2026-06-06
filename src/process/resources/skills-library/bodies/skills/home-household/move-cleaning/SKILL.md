---
name: move-cleaning
description: |
  Provides room-by-room cleaning checklists for move-in and move-out scenarios
  with specific tasks, time estimates, and security deposit recovery strategies.
  Covers the difference between move-out cleaning standards and regular cleaning,
  landlord inspection expectations, and DIY vs. professional cleaning cost
  comparisons. Use when the user is moving out of a rental and wants to maximize
  their security deposit return, moving into a new home and wants to clean before
  unpacking, or needs to prepare a home for new tenants. Do NOT use for regular
  cleaning routines (use weekly-cleaning-schedule), deep cleaning outside of
  a move context (use deep-cleaning-checklist), or post-construction cleaning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cleaning checklist analysis"
  category: "home-household"
  subcategory: "cleaning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Move Cleaning

## When to Use

Use this skill when the user's cleaning need is directly tied to the act of moving -- either departing a space or arriving at one. The defining characteristic is that the stakes are higher than routine cleaning: security deposit recovery, landlord inspection readiness, or the need to establish a clean baseline before possessions are brought in.

**Use this skill when:**
- The user is moving out of a rental unit (apartment, house, condo, townhome) and wants to maximize security deposit recovery or avoid deduction charges
- The user is moving into a new rental or purchased home and wants to clean the space before furniture and boxes are brought in
- The user is a landlord or property manager preparing a unit for turnover between tenants
- The user is handing a home back to a relocation service, corporate housing provider, or property management company that will conduct a formal checklist inspection
- The user asks specifically about what landlords look for during move-out inspections, what constitutes "broom clean" vs. deep clean standard, or what is normal wear and tear
- The user wants to compare the cost and value of DIY move-out cleaning vs. hiring a professional cleaning service
- The user needs to prepare a vacation rental (Airbnb, VRBO) for a deep-reset clean between long-term stays or at the end of a season
- The user received an itemized deposit deduction notice and wants to understand what was legitimate vs. what to dispute

**Do NOT use this skill when:**
- The user needs a recurring weekly or biweekly cleaning routine -- use `weekly-cleaning-schedule` instead
- The user wants a thorough cleaning of their current home that is not connected to moving -- use `deep-cleaning-checklist` instead
- The unit has active pest infestation (cockroaches, rodents, bedbugs) -- cleaning cannot proceed safely or effectively until pest control has been completed; refer user to professional pest control first
- The home has post-construction dust from recent renovation -- this requires HEPA-filtered vacuuming, specialized surface wiping sequences, and duct cleaning that goes beyond move cleaning scope
- The user needs help with hazardous material remediation (mold colonies larger than 10 square feet, lead paint disturbance, asbestos) -- these require licensed contractors, not cleaning
- The user needs a regular cleaning routine for a vacation rental between short guest stays -- use `short-term-rental-turnover` instead

---

## Process

### Step 1: Gather Scenario-Defining Information

Before producing any checklist, collect the specific details that determine the entire scope of the job. The difference between a studio move-out and a 3-bedroom house with pets and 7 years of occupancy is an entirely different plan.

- **Scenario type:** Is this move-OUT (leaving a rental, deposit at stake), move-IN (cleaning before unpacking), or landlord turnover (preparing for next tenant)?
- **Property type and size:** Apartment, house, condo, or townhome. Number of bedrooms and bathrooms. Approximate square footage if known. Single-story or multi-story (affects logistics and time).
- **Occupancy duration:** Number of years or months lived in the unit. This directly affects what is considered normal wear and what depreciation calculations apply to flooring and paint.
- **Special conditions:** Pets (species, number -- cats and dogs have different impact profiles), smoker in the home, young children (crayon, marker, handprint damage), home-based cooking frequency (heavy grease in kitchen), any known damage beyond cleaning.
- **Time available:** Days until move-out inspection or move-in date. This determines whether the user can tackle the job over multiple sessions or must compress it into a single day.
- **Deposit amount:** If this is a move-out, knowing the deposit total helps frame the DIY vs. professional cleaning cost decision.
- **Existing documentation:** Does the user have their move-in condition report, move-in photos, or the original lease language about cleaning obligations? These are leverage documents.
- **Professional cleaning already done or being considered?** Some leases require professional carpet cleaning -- confirm whether this is in the lease before the user skips it.

### Step 2: Establish the Correct Cleaning Standard

Move-out cleaning is NOT the same as regular cleaning. Most tenants underestimate the required standard and lose deposit money on details they did not realize were inspected. Establish this clearly.

- **The "next tenant" standard:** A landlord can legally deduct cleaning costs if the unit is not left in a condition where the next tenant can move in without cleaning. This means every surface, every cabinet interior, every appliance interior, every drawer, and every fixture must be genuinely clean -- not just surface-wiped.
- **Broom clean vs. professional clean:** Many leases say "broom clean" condition. Courts and arbitrators generally interpret this as: all trash removed, floors swept or vacuumed, surfaces free of food and grime, appliances clean. It does NOT mean spotless -- but it is much higher than most tenants assume. If the lease says "professional clean" or "professional carpet clean," that specific obligation must be fulfilled or documented.
- **Move-in cleaning standard is different:** When cleaning before moving IN, the goal is personal comfort and hygiene -- you are cleaning someone else's residue before your belongings touch those surfaces. The standard is thorough but there is no inspection or financial consequence. The sequence matters most: clean before furniture arrives, or you will never access the backs of cabinets or under appliances.
- **Landlord turnover standard:** Between tenants, the goal is a rental-ready unit -- meaning a new tenant would find nothing objectionable. This often includes touch-up painting, recaulking, and addressing any damage repairs in addition to cleaning.
- **Identify what the lease actually says:** Lease language about cleaning varies. Some leases specify that carpets must be professionally cleaned, that walls must be repainted, or that all appliances must be in "original condition." Read the lease cleaning addendum before establishing the scope.

### Step 3: Build the Room-by-Room Checklist

Generate a structured checklist that covers every room and area, with tasks ordered from top to bottom (ceilings, light fixtures, and walls before floors -- never vacuum or mop first and then disturb dust from above).

- **Top-to-bottom, back-to-front order is mandatory:** Begin with ceiling fans and light fixtures. Then walls, windows, and furniture surfaces. Then appliance interiors and cabinet interiors. Counters and sinks last before floors. Always clean floors last. Violating this order means re-cleaning.
- **Kitchen is the highest-stakes room** and requires the most time. Oven interior, refrigerator interior (including under and behind drawers, and the drip pan), range hood filter, dishwasher drain and door gasket, microwave interior including the turntable and its ring track, and cabinet interiors are all inspection points where landlords commonly deduct $50-150 per item.
- **Bathrooms are the second highest-stakes room.** Grout lines, caulk around the tub and shower, the area behind and around the toilet base, the exhaust fan grille, and the underside of the toilet tank lid are all inspection points that untrained cleaners miss.
- **Bedrooms and living areas:** Focus on closet interiors (walls, floor, shelf, rod), window tracks (soil accumulates in the channels), ceiling fan blades (grease and dust bond and harden over time), baseboard tops (where dust and pet hair settle), and behind and under any built-in furniture.
- **Shared/utility areas:** The entry, hallways, laundry area (clean the lint trap housing, not just the filter; wipe the drum interior), garage if applicable, and any balcony, patio, or outdoor storage area are frequently forgotten and charged for.
- **Vertical surfaces that are always forgotten:** Light switch plates and outlet covers (remove with screwdriver, wash, replace), the inside face of the front door and all interior doors, door frames and door stop hardware, HVAC return vents and supply registers (remove, wash with warm water, replace -- dusty vent covers are a visual red flag for inspectors), and the interior of window tracks.

### Step 4: Identify Pet, Smoke, and Occupancy-Specific Tasks

Standard checklists miss the damage profiles that are specific to how the unit was lived in. These are the highest-risk areas for deposit deductions.

- **Cat occupancy:** Cats deposit dander and oils on all soft surfaces, carpets, and baseboards at a height of approximately 12-18 inches from the floor (where they brush against surfaces). Pet urine is invisible under normal light but fluoresces under UV (use a UV flashlight -- $8-15 -- to map every spot before cleaning). Enzymatic cleaners are mandatory for urine remediation; they break down uric acid crystals that regular cleaners cannot remove. Litter box areas often have subfloor urine penetration if the box was not managed carefully -- a sealed enzymatic treatment may be needed if the odor persists after surface cleaning.
- **Dog occupancy:** Dogs leave muddy paw traffic patterns at threshold surfaces (entryways, sliding door tracks), scratch damage on doors and wood floors at dog height, and nose/drool smears on glass surfaces below 24 inches. Carpet odor from dog dander requires a 15-minute dry baking soda treatment before vacuuming (coat the carpet, let it sit, vacuum in two passes -- forward and backward).
- **Smoker in the unit:** Nicotine off-gassing coats all porous surfaces, ceilings, window treatments, and HVAC filters with a yellow-brown residue that cannot be removed by standard all-purpose cleaner. Light smoke (occasional smoking): wash all walls and ceilings with a TSP substitute (trisodium phosphate substitute) solution, clean all window trim and blinds, replace HVAC filters. Heavy or chronic smoking: repainting is almost certain regardless of how well the surfaces are cleaned; realistic expectation is deduction for repainting. Running an ozone generator (rental: $40-80/day) for 24-48 hours after cleaning addresses residual odor. Critical note: ozone generators cannot be run while humans or pets are in the space and the space must be ventilated for 2-4 hours before occupancy.
- **Long occupancy (5+ years):** After 5+ years, many components have reached or exceeded their expected useful life. Carpet in apartments has a standard useful life of 5-7 years, interior paint 3-5 years. A landlord cannot charge full replacement cost for items past their useful life -- only a prorated remainder. For example: carpet replaced new when the tenant moved in, tenant lived there 6 years, carpet's useful life is 7 years -- the landlord can claim only 1/7 of the replacement cost for carpet damage. Knowing this prevents tenants from scrubbing impossible stains out of 8-year-old carpet for hours when the landlord's claim on that carpet is legally minimal.
- **Short occupancy (under 1 year):** Everything is closer to its original condition and the landlord has a stronger financial claim on damage to high-cost items like flooring, paint, and appliances. More cleaning effort is warranted here because the "useful life" depreciation defense is weaker.

### Step 5: Calculate Time and Cost, and Make the DIY vs. Professional Recommendation

This is a financial decision with a concrete right or wrong answer relative to the deposit amount.

- **DIY time estimates by property size (moderate condition, solo cleaner):**
  - Studio or efficiency: 3-5 hours
  - 1 bedroom / 1 bathroom: 5-7 hours
  - 2 bedroom / 1-2 bathroom: 7-10 hours
  - 3 bedroom / 2 bathroom: 10-14 hours
  - 4 bedroom / 2+ bathroom: 14-20 hours
  - Add 20-30% for each of the following: pet occupancy, heavy cooking grease, long occupancy (5+ years), known damage requiring extra attention

- **DIY supply cost:** A fully stocked move-out cleaning kit runs $30-60 if starting from scratch. Most of the cost is in: oven cleaner ($5-8), enzymatic pet cleaner if needed ($10-15), microfiber cloths and scrub pads ($8-12), and specialty cleaners for grout, glass, and stainless steel. Items already on hand reduce this significantly.

- **Professional move-out cleaning costs (national range, will vary by market):**
  - Studio: $150-275
  - 1BR / 1BA: $220-375
  - 2BR / 1-2BA: $300-525
  - 3BR / 2BA: $400-700
  - 4BR / 2-3BA: $550-950
  - Professional carpet cleaning (add-on): $100-300 depending on square footage
  - These are average ranges. High cost-of-living markets (San Francisco, New York, Seattle) run 30-50% higher.

- **When professional is worth it:** If the deposit is $1,500 and professional cleaning costs $350, the clean must save you at least $350 in deductions to break even. Most inspectors will deduct $150-400 for a unit that is not professionally cleaned vs. one that is. Additionally, some landlords are less likely to dispute cleaning deductions when they see a professional receipt. Some leases explicitly require it.

- **When DIY is worth it:** If the deposit is $800, the property is a 1BR in average condition, and the user is capable of thorough cleaning, DIY saves $200-350 and recovers the same result. DIY is also preferable when the user wants to document the cleaning themselves, wants control over the standard, or has limited flexibility in timing.

- **The hybrid approach:** DIY all rooms plus hire professionals only for carpets. Carpet cleaning is the single most common lease requirement and is one of the most technically difficult tasks to match professionally at home. Professional carpet cleaning costs $100-250 for a 2BR apartment and addresses pet odor at a chemical level that rental shampooers cannot match.

### Step 6: Build the Inspection Documentation Strategy

Documentation is the tenant's primary legal protection against wrongful deposit deductions. Most tenants skip this and regret it.

- **Photograph before AND after cleaning:** Before photos show the condition you received the unit in (if you have them from move-in) and help contextualize any pre-existing damage. After photos -- taken after cleaning and before keys are returned -- are the legal evidence that you left the unit in clean condition.
- **What to photograph after cleaning:**
  - Every room from two to three angles (corner shots capture walls, floor, and ceiling simultaneously)
  - Open every appliance (oven door, refrigerator door, dishwasher door, microwave door) and photograph the interior
  - Open every cabinet and closet and photograph the interior
  - All bathroom surfaces: shower/tub, toilet, sink, mirror, floor
  - All windows (inside face, tracks, and sills)
  - Close-up of any pre-existing damage you did not cause (note this with a note card in frame if helpful)
  - Light fixtures, ceiling fans, HVAC vents
- **Timestamping:** Use a phone camera -- all photos are automatically timestamped in metadata. For extra protection, text a photo to someone or email the photos to yourself immediately, creating a third-party timestamped record.
- **Video walkthrough:** After completing all photos, shoot a continuous video walkthrough of every room. Narrate as you go ("this is the kitchen oven interior, clean"). A video is much harder to dispute than individual photos.
- **Move-in condition report comparison:** If the user has the original move-in condition report or move-in photos, compare the documented pre-existing conditions against what the landlord tries to deduct. Pre-existing damage noted at move-in is not the tenant's liability.
- **Cleaning receipt if professional:** If carpets or the unit were professionally cleaned, keep the receipt. Provide a copy to the landlord at or before key return. This immediately neutralizes any cleaning-related deduction attempt.

### Step 7: Deliver the Final Checklist and Inspection Risk Summary

Present the output in a structured format (see Output Format below) and include a prioritized list of the highest-risk deduction items for this specific user's scenario. Not all rooms and tasks carry equal financial risk. Help the user allocate their time proportionally.

- **Rank tasks by deduction risk:** Kitchen appliance interiors and bathroom tile/grout carry the highest deduction risk ($50-150 per item). Empty unit cleanliness (floors, walls, general surfaces) carries medium risk. Light bulbs, window tracks, and HVAC vents carry low individual risk but add up.
- **Flag items that require lead time:** Oven cleaner requires 20-45 minutes of dwell time. Enzymatic cleaners on carpet require 15-30 minutes to work. Spackling holes requires drying time before it becomes invisible. Plan the cleaning sequence around dwell times to avoid idle waiting.
- **Identify anything that is beyond cleaning:** Broken fixtures, damaged doors or trim, missing hardware, heavily stained carpets that cannot be cleaned -- identify these upfront. The user should know which items will likely be deducted regardless of cleaning effort, and direct their time toward items that can actually be recovered.
- **For move-in cleaning:** Confirm the user plans to clean BEFORE any furniture or boxes enter the space. Once a couch is against the wall, the wall behind it cannot be wiped. Once the refrigerator is moved in, the floor underneath it cannot be mopped. This is the single most important tactical point for move-in scenarios.

---

## Output Format

```
## Move-[Out / In / Turnover] Cleaning Plan

**Address / Unit:** [unit identifier]
**Scenario:** Move-out (deposit recovery) / Move-in (pre-unpack clean) / Landlord turnover
**Property Size:** [bedrooms] BR / [bathrooms] BA, [apartment / house / condo]
**Occupancy Duration:** [X years / months]
**Special Conditions:** [pets / smoking / none]
**Security Deposit:** $[amount] (move-out scenarios)
**Inspection / Move Date:** [date or timeframe]

---

### Estimated Time and Cost

| Category | Estimate |
|---|---|
| Total DIY time (solo) | [X-Y hours] |
| Total DIY time (2 people) | [X-Y hours] |
| DIY supply cost | $[low]-$[high] |
| Professional clean cost | $[low]-$[high] |
| Professional carpet cleaning (if applicable) | $[low]-$[high] |
| **Recommendation** | [DIY / Professional / Hybrid -- rationale in 1 sentence] |

---

### Highest-Risk Deduction Items (Address These First)

| Item | Typical Deduction If Missed | Your Risk Level |
|---|---|---|
| [e.g., Oven interior] | $[amount] | [High / Medium / Low] |
| [e.g., Carpet pet stains] | $[amount] | [High / Medium / Low] |
| [e.g., Bathroom grout / mold] | $[amount] | [High / Medium / Low] |

---

### Supply List

**Essential:**
- [ ] All-purpose cleaner (spray)
- [ ] Glass cleaner
- [ ] Scrubbing powder or baking soda (for sinks, tubs)
- [ ] Oven cleaner (heavy-duty, fume-free formula if ventilation is limited)
- [ ] Dish soap
- [ ] Toilet bowl cleaner
- [ ] White vinegar (for mineral deposits, dishwasher, fridge odor)
- [ ] Microfiber cloths (minimum 8-10 -- separate for bathroom and kitchen)
- [ ] Non-scratch scrub sponges
- [ ] Old toothbrush (for grout lines, faucet bases, exhaust fan slats)
- [ ] Screwdriver (flathead, for removing vent covers, light switch plates)
- [ ] Vacuum with crevice tool and upholstery attachment
- [ ] Mop and bucket
- [ ] Trash bags (heavy duty)
- [ ] Rubber gloves

**Scenario-specific additions:**
- [ ] [Enzymatic cleaner -- if pet occupancy]
- [ ] [UV flashlight -- if cat in unit, to detect urine spots]
- [ ] [TSP substitute cleaner -- if smoke in unit]
- [ ] [White spackling paste + putty knife -- for nail holes]
- [ ] [Replacement light bulbs -- check all fixtures before starting]
- [ ] [Ozone generator rental -- if heavy smoke odor]

---

### Cleaning Sequence: Room-by-Room

> **Rule: Always clean top to bottom, back to front. Clean floors LAST in every room.**

---

#### Pre-Cleaning Preparation -- [20-30 min]
- [ ] Remove ALL personal items from every room, closet, cabinet, and drawer. Items left behind = disposal charge ($50-200 per item in many jurisdictions).
- [ ] Open windows in every room for ventilation
- [ ] Replace any burned-out light bulbs before starting (you need to see every surface clearly, and burned-out bulbs are a deduction item)
- [ ] Review original move-in condition report and note all pre-existing damage -- photograph those items again now
- [ ] Set up two cleaning buckets: one for kitchen/general, one for bathrooms. Never cross-contaminate.

---

#### Kitchen -- [60-120 min depending on condition]

**Oven -- [20-35 min active + 30 min dwell time]**
- [ ] Remove oven racks and set aside
- [ ] Apply oven cleaner to all interior surfaces: floor, walls, ceiling, and door glass (both the interior-facing side and the glass between the door panels if accessible). Follow product dwell time -- minimum 20 minutes, up to overnight for heavy grease.
- [ ] While cleaner dwells: soak oven racks in hot water with dish soap in the bathtub or a large basin
- [ ] After dwell time: scrub all oven interior surfaces with a non-scratch pad. Pay specific attention to the oven floor, the rear wall, and the door glass. Wipe with damp cloth repeatedly until no residue transfers.
- [ ] Scrub soaked oven racks, rinse, dry, replace
- [ ] Clean the oven drawer (storage drawer at bottom) -- remove, wipe interior, replace
- [ ] Clean between oven door glass panels if visible residue (check manufacturer instructions for door disassembly -- some models allow this easily)

**Refrigerator -- [25-40 min]**
- [ ] Unplug or switch off before cleaning (prevents condensation issues)
- [ ] Remove all shelves, drawers, and door bins. Wash each piece in warm soapy water. Dry before replacing.
- [ ] Remove drip tray from under/behind unit -- this is frequently disgusting and always inspected. Wash with hot soapy water.
- [ ] Wipe all interior walls, ceiling, and floor with a baking soda solution (2 tablespoons per quart of warm water). This deodorizes and cleans simultaneously.
- [ ] Check and clean the rubber door gasket -- food debris hides in the folds. Use an old toothbrush along the gasket channels.
- [ ] Wipe the exterior: top, sides, handle, and control panel
- [ ] Pull the unit away from the wall (if possible): vacuum coil area and wipe the floor underneath. Dust on coils is a fire hazard and an inspection flag.
- [ ] Plug back in, replace clean components, leave one box of open baking soda inside to absorb any residual odor

**Range Hood -- [10-20 min]**
- [ ] Remove grease filter (metal mesh): soak in very hot water with dish soap and baking soda for 15-20 minutes, then scrub with a brush. Grease buildup is a fire hazard -- inspectors check this.
- [ ] Wipe the interior hood surface and the underside of the hood
- [ ] Clean the exterior hood surface and the light cover

**Dishwasher -- [10-15 min]**
- [ ] Remove the bottom rack and clean the drain area: remove food debris trap/filter (usually a twist-lock cylinder), rinse under hot water, scrub with a brush, replace
- [ ] Wipe the door gasket (rubber seal) with a damp cloth -- this traps food residue and mold
- [ ] Wipe the interior door panel, including around the door latch and detergent dispenser
- [ ] Run one empty hot cycle with one cup of white vinegar placed on the top rack -- this deodorizes and descales the interior
- [ ] Wipe exterior, control panel, and handle

**Microwave -- [5-10 min]**
- [ ] Remove turntable plate and ring. Wash both in warm soapy water.
- [ ] Steam clean interior: fill a microwave-safe bowl with 1 cup water and 2 tablespoons white vinegar or lemon juice. Microwave on high for 3-5 minutes. Let steam sit for 2 minutes with door closed. Wipe all interior surfaces -- the steam loosens baked-on food easily.
- [ ] Clean exterior, control panel, handle, and the top vent area

**Countertops, Sink, and Cabinets -- [20-30 min]**
- [ ] Wipe all countertop surfaces including backsplash, edges, and the seam where counter meets wall
- [ ] Clean the sink with scrubbing powder or baking soda: scrub basin, faucet base, handles, and the drain. Remove the drain stopper/strainer, clean underneath.
- [ ] Address mineral deposits (hard water scale) on faucets and sink edges: apply white vinegar on a cloth, wrap around faucet, leave 15-20 minutes, scrub off. This removes the white calcite crust that all-purpose cleaner cannot dissolve.
- [ ] Open every cabinet and drawer and wipe the interior surfaces and the interior face of the door. Do not skip upper cabinets -- grease migrates upward.
- [ ] Wipe all cabinet exterior faces and handles
- [ ] Clean the area under the sink (remove items, wipe down, check for moisture or drip residue)

**Floors, Walls, and Fixtures -- [15-20 min]**
- [ ] Wipe light switch plates and outlet covers (remove with flathead screwdriver to clean properly)
- [ ] Clean light fixture globes or covers (wash in warm soapy water, dry, replace)
- [ ] Wipe all baseboards
- [ ] Sweep corners, behind appliance locations, and edges thoroughly before mopping
- [ ] Mop floor in sections, including under and behind where appliances stood

---

#### Bathrooms -- [40-60 min per bathroom]

**Shower / Tub -- [15-25 min]**
- [ ] Spray all tile surfaces, grout lines, faucet, showerhead, and tub floor with bathroom cleaner. Let dwell 5-10 minutes.
- [ ] Scrub tile with a non-scratch scrubbing pad. Use an old toothbrush on grout lines -- this is where inspectors look first for mold and soap scum.
- [ ] Clean the showerhead: if there is mineral buildup (white crust around the nozzle holes), soak in white vinegar for 30-60 minutes or secure a vinegar-filled bag around the head with a rubber band and leave 1-2 hours.
- [ ] Clean the shower door: glass doors require a squeegee and glass cleaner for streak-free results. Clean both sides and the door frame and track.
- [ ] Inspect and clean caulk lines around the tub and shower: scrub mildewed caulk with a bleach solution (1 part bleach to 10 parts water) on an old toothbrush. If caulk is peeling, cracked, or missing -- note it. Re-caulking is typically normal wear after 3+ years, but cleaning what is there prevents a mold deduction.
- [ ] Clean the shower curtain rod and any rings

**Toilet -- [10-15 min]**
- [ ] Apply toilet bowl cleaner inside the bowl; let it dwell while cleaning the exterior
- [ ] Wipe the exterior top-to-bottom: tank lid (outside AND the ceramic underside of the lid -- this is always dirty and always checked), tank exterior, handle, bowl exterior, seat (both sides), and base
- [ ] Scrub bowl with toilet brush; focus under the rim where bacteria and scale accumulate
- [ ] Clean the floor around and behind the toilet base -- this area traps urine splash and is always inspected
- [ ] Wipe the wall behind the toilet

**Sink, Vanity, Mirror -- [10-15 min]**
- [ ] Clean sink basin, faucet, handles, and drain with scrubbing powder. Treat mineral deposits with vinegar.
- [ ] Wipe vanity countertop and all surfaces
- [ ] Open vanity cabinet and medicine cabinet -- wipe all interior surfaces and shelves
- [ ] Clean mirror with glass cleaner -- streak-free (use a clean dry microfiber cloth, not paper towels, which leave lint)

**Exhaust Fan -- [5-10 min]**
- [ ] Remove the grille cover (usually snaps off or is held by a single screw)
- [ ] Wash the grille in warm soapy water, dry, reattach
- [ ] Use compressed air or a vacuum attachment to clean the fan blades visible through the opening
- [ ] A clogged exhaust fan is a deduction item in many jurisdictions because it is a functional issue, not just cosmetic

**Floor and Baseboards -- [10 min]**
- [ ] Wipe all baseboards
- [ ] Sweep and mop floor including the area under the vanity and behind the toilet
- [ ] Ensure no hair, residue, or streaks remain on floor tiles or grout

---

#### Bedrooms -- [20-35 min per bedroom]

- [ ] Wipe all windowsills and window tracks (use a damp cloth in the track channels -- this area collects years of dust, dead insects, and debris)
- [ ] Clean window glass (interior face) with glass cleaner
- [ ] Wipe all baseboards
- [ ] Wipe the tops of door frames (accumulated dust)
- [ ] Wipe interior of closet: all walls, the shelf surface (and underside if accessible), the rod, and the floor
- [ ] Clean any closet door tracks
- [ ] Clean light fixture (remove globe, wash, dry, replace)
- [ ] Clean ceiling fan blades if present: dampen a microfiber cloth and wipe each blade top and bottom (dry dusting just distributes the dust into the air)
- [ ] Clean light switch plates and outlet covers
- [ ] Vacuum carpet using the crevice tool along all edges and corners (dust and pet hair densely accumulate here)
- [ ] Vacuum entire carpet in two passes (forward/backward) or mop hard floors

---

#### Living / Dining Areas -- [25-45 min]

- [ ] Dust and wipe all ceiling fan blades
- [ ] Wipe light fixture and any exposed bulbs
- [ ] Wipe all windowsills and deep-clean window tracks
- [ ] Clean all window glass (interior face)
- [ ] Wipe all baseboards, including behind where furniture stood
- [ ] Clean light switch plates and outlet covers
- [ ] Wipe any built-in shelving: all shelf surfaces (top and underside edge), inside and out
- [ ] Clean fireplace if present: remove ashes, wipe firebox, clean glass doors, wipe mantel
- [ ] Vacuum all carpet in two passes with crevice tool along edges; or mop hard floors including under furniture positions

---

#### Laundry Area -- [15-25 min]

- [ ] Clean washing machine interior: run a hot empty cycle with 2 cups white vinegar (top-loader) or wipe drum interior with vinegar solution (front-loader). Wipe door gasket of front-loader thoroughly -- this is a notorious mold location. Leave door ajar after cleaning.
- [ ] Clean dryer interior: wipe drum. Remove the lint trap -- do not just remove the lint. Vacuum deep into the lint trap housing with a crevice tool; compressed lint in the duct is a fire hazard and an inspection red flag.
- [ ] Wipe exterior of both appliances
- [ ] Pull units away from wall if possible; clean behind and underneath
- [ ] Wipe laundry room walls, especially the wall behind the dryer vent

---

#### Entryway, Hallways, and Utility Areas -- [15-20 min]

- [ ] Wipe front door (interior face), door frame, and door hardware
- [ ] Clean all interior doors on both faces, especially around the handle (years of hand contact)
- [ ] Wipe all door frames
- [ ] Clean any hall closet: interior walls, shelf, rod, floor
- [ ] Remove and wash HVAC return vents and supply registers: most snap out or are held with 2 screws. Wash with warm soapy water, dry completely, replace. Dusty and clogged vents are a very common deduction and a functional concern.
- [ ] Check and replace HVAC filter if it is the tenant's responsibility under the lease

---

#### Floors -- Final Pass (All Rooms) -- [20-40 min depending on size]

- [ ] Vacuum all carpeted areas a final time with attention to all edges
- [ ] Sweep all hard floors from back of unit toward front door
- [ ] Mop all hard floors from back of unit toward front door; use a clean mop head or clean your mop head before this final pass

---

#### [Pet-Specific Tasks -- Include if pet was in unit] -- [30-60 min]

- [ ] UV inspection: use a UV flashlight in every carpeted room and in the bathroom with lights off to identify all urine spots (they fluoresce yellow-green). Mark spots with tape or sticky notes.
- [ ] Treat every identified urine spot with enzymatic cleaner: saturate the spot, let dwell 15-20 minutes, blot (do not rub). Allow to air dry completely before the final vacuum pass. Do NOT use steam cleaners on urine spots -- heat bonds uric acid crystals permanently to carpet fibers.
- [ ] Wipe all baseboards throughout the unit (pet body oils and hair accumulate here)
- [ ] Vacuum all carpet edges and corners twice: pet hair densely packs into carpet binding along walls
- [ ] Apply dry baking soda to carpet (shake over surface, let sit 15 minutes, vacuum) to neutralize pet dander odor
- [ ] Check all door frames and trim for scratch damage at dog/cat height -- note these items, as they are tenant damage and will be deducted. Cleaning will not resolve them.
- [ ] Check pet feeding area floor: food/water bowl rings on hard floors require a scrubbing pad. On carpet, treat with enzymatic cleaner.

---

#### Final Walkthrough and Documentation -- [30-45 min]

- [ ] Walk through every room with the lights on. Open every cabinet, closet, appliance door. If anything is not clean enough that the next person could move in without cleaning it, address it now.
- [ ] Fill small nail holes: white spackling paste applied with a fingertip or small putty knife, smoothed flat, allowed to dry 30-60 minutes. Note that a small number of standard picture-hanging nail holes is generally considered normal wear, but filling them demonstrates good faith.
- [ ] Check all light bulbs and replace any burned-out bulbs (yes, this is a common small deduction)
- [ ] Remove ALL cleaning supplies, trash bags, and personal items from the unit
- [ ] **DOCUMENTATION SEQUENCE:**
  - [ ] Take wide-angle photos of every room from at least 2 corners
  - [ ] Open and photograph inside every appliance
  - [ ] Open and photograph every cabinet and closet
  - [ ] Photograph all bathroom surfaces and fixtures
  - [ ] Photograph all windows, windowsills, and window tracks
  - [ ] Photograph any pre-existing damage or areas of concern with a note card in the frame
  - [ ] Shoot a continuous narrated video walkthrough of the entire unit
  - [ ] Immediately email all photos to yourself to create a timestamped archived record

---

### Landlord Inspection Focus Areas and Typical Deductions

| Inspection Area | Condition That Triggers Deduction | Typical Deduction Range |
|---|---|---|
| Oven interior | Grease, burned carbon on surfaces or door glass | $50 -- $150 |
| Refrigerator interior | Food residue, stains, odor, dirty drawers | $50 -- $100 |
| Drip tray under refrigerator | Not cleaned (it is always dirty) | $25 -- $75 |
| Range hood filter | Grease-clogged (fire hazard) | $30 -- $75 |
| Dishwasher drain and gasket | Food debris in drain trap, mold on gasket | $30 -- $75 |
| Bathroom grout and tile | Visible mold, heavy soap scum | $50 -- $150 |
| Tub / shower caulk | Heavy mold on caulk | $50 -- $150 |
| Carpet stains (non-pet) | Individual stains beyond normal wear | $50 -- $200 per area |
| Carpet pet damage | Urine staining, odor, pet hair | $150 -- $600+ depending on size |
| HVAC filter and vents | Clogged filter (if tenant responsibility), dusty vent covers | $25 -- $100 |
| Items left behind | Disposal charge per abandoned item | $50 -- $200 per item |
| General cleaning | Unit not in "next tenant" condition overall | $100 -- $350 |
| Light bulbs burned out | Non-functional fixtures at departure | $10 -- $30 per fixture |
| Nail holes beyond normal | Large holes, anchor damage | $25 -- $150 per hole |

---

### Normal Wear and Tear vs. Tenant Damage

| Normal Wear -- NOT Deductible | Tenant Damage -- Deductible |
|---|---|
| Faded or slightly discolored paint (3+ years) | Large holes in walls, anchor damage, crayon or marker on walls |
| Minor traffic wear on carpet in hallways and entryways | Pet urine stains, burns, large stains, torn carpet |
| Small nail holes from standard picture hanging | Multiple large holes, anchor holes, drywall damage |
| Light scuffs on walls at furniture height | Deep gouges, paint transfers, intentional damage |
| Worn finish on door hardware from daily use | Broken locks, missing hardware, damaged door frames |
| Slightly worn or crazed caulk around tub (3+ years) | Heavy black mold from tenant neglect of water damage |
| Worn carpet tread in main traffic areas | Pet scratches on doors, trim, or hardwood floors |
| Faded blinds or window seals (3+ years sun exposure) | Broken blinds, bent slats, missing window hardware |
| Minor rust ring from toiletry bottle on tub ledge | Broken tiles, cracked fixtures |

**Depreciation reference (most states follow similar guidelines):**
- Interior paint: 3-5 year useful life (pro-rate charges if you lived there 3+ years)
- Carpet: 5-7 years (pro-rate if carpet was not new at move-in, or if occupancy was 5+ years)
- Appliances: 10-15 years (very rarely fully chargeable to tenant)
- Window blinds: 3-5 years

---
```

---

## Rules

1. **Top-to-bottom, back-to-front is non-negotiable.** Never vacuum or mop a room and then disturb overhead surfaces (ceiling fans, light fixtures, shelves). You will be re-cleaning floors. Enforce this sequence in every checklist you produce. The correct order is: ceiling and fixtures -- walls and windows -- appliance interiors and cabinet interiors -- counters and sinks -- baseboards -- floors.

2. **Inside-appliance cleaning is the single highest-risk deduction category.** The oven interior, refrigerator interior (including under drawers and the drip tray), dishwasher drain trap and door gasket, range hood grease filter, and microwave interior are the five appliance items most frequently missed by tenants and most frequently charged by landlords. These must appear on every move-out checklist with specific methods -- not just "clean appliances."

3. **Never recommend steam cleaning on pet urine spots.** Heat from steam cleaners activates and permanently bonds uric acid proteins to carpet fibers, making the stain and odor irremovable. Enzymatic cleaners only -- and they must be allowed to fully dry before vacuuming, because vacuuming wet enzymatic cleaner removes it before it finishes its chemical work.

4. **Document AFTER cleaning, BEFORE keys are returned.** A tenant who cleans thoroughly but returns keys without documentation has no legal protection against fabricated deductions. The documentation strategy (photos, video, email timestamp) is not optional -- it is the most important single step in deposit recovery. Flag this prominently in every move-out response.

5. **Do not let users conflate cleaning with repairs.** If a carpet has deep pet urine staining after 4 years, no amount of enzymatic cleaner will recover it. Be honest: identify items that will be deducted regardless of cleaning effort, and redirect the user's time to items that can actually be recovered. A user spending 3 hours on a hopeless carpet stain is losing time they should spend on the oven.

6. **Always address the HVAC filter and vent covers.** This is one of the most overlooked items. Dusty vent covers are visible from across the room and are an immediate flag for inspectors. Filters are a landlord's maintenance concern in most cases, but tenants who are responsible for them (check the lease) will be charged. Remove and wash vent covers in warm soapy water -- this takes 10 minutes and costs nothing.

7. **Move-in cleaning must happen before any item enters the space.** The single most common move-in mistake is cleaning around furniture or boxes. Once a couch is against the wall, the baseboard and wall behind it cannot be wiped. Once a refrigerator is moved in, the floor beneath it is inaccessible. The user must understand: clean the space completely before the first item crosses the threshold.

8. **Lease language controls.** Before completing any move-out plan, ask if the user has their lease or cleaning addendum. Many leases specify that carpets must be professionally cleaned, that a receipt must be provided, or that the unit must be cleaned to "hotel standard." Some leases require repainting. If the lease specifies professional cleaning, DIY carpet shampooing is insufficient regardless of quality. Lease terms trump general advice.

9. **Depreciation is a legal defense, not an excuse to skip cleaning.** Knowing that 7-year-old carpet has been fully depreciated does not mean the user should leave it covered in pet hair and stains. A landlord can still deduct for the cost of cleaning even fully-depreciated carpet -- they just cannot deduct for replacement unless damage exceeds normal wear. Clean everything thoroughly; use depreciation knowledge only to dispute replacement cost charges.

10. **The toilet tank lid underside is always missed and always inspected.** This is the single most consistent gap in tenant move-out cleaning. It accumulates brown or orange mineral scale on the ceramic interior underside of the lid. Inspectors lift the lid -- every time. Clean it with a scrubbing pad and toilet bowl cleaner.

---

## Edge Cases

### Long-Term Occupancy (7+ Years)

After 7 or more years, most soft and surface materials in a rental are at or beyond their expected useful life, and the legal landscape shifts significantly in the tenant's favor. Carpet at 7 years has been fully depreciated in most state guidelines -- the landlord cannot charge any replacement cost for carpet damage (though cleaning costs remain chargeable). Paint at 5+ years is similarly past its typical life. The focus for very long-term tenants should shift away from cosmetic perfection toward: functional condition (all fixtures working), inside-appliance cleanliness, and removal of all debris. Grout, tile, and fixtures are high priorities because these do not depreciate the way soft surfaces do. Advise the user to research their specific state's landlord-tenant statute for depreciation schedules -- California, New York, and Illinois have some of the most detailed published schedules, which can be directly cited in a deposit dispute letter.

### Unfurnished vs. Furnished Rental (Move-Out)

Furnished rentals add a substantial layer of complexity. In addition to all standard cleaning, the user must: vacuum all upholstered furniture thoroughly (inside cushions, under and behind cushions, and along all seams); wipe all hard furniture surfaces including table legs and chair rungs; inspect all mattresses for stains (a mattress cover at move-in is strongly recommended -- its absence at move-out is a common dispute); document all furniture damage in the current condition vs. move-in condition. The furnished item inventory sheet from move-in is critical here. Any furniture item not on the original inventory sheet that is now present (tenant added a shelf, brought a rug) must be removed or discussed with the landlord. Any item that was present at move-in and is now missing is the tenant's liability regardless of cleaning.

### Vacation Rental End-of-Season Deep Reset

A vacation rental at the end of a high-use season requires additional steps beyond a standard move-out: inspect all soft furnishings for stains (use UV flashlight for hidden biological stains), launder all textile items (mattress protectors, duvet covers, throw blankets), clean and inspect all outdoor furniture and storage areas, flush all water fixtures after a period of non-use, check all appliances for food that may have been left over a season (smells from inside refrigerator or freezer that was turned off in a stocked state can be severe -- clean with baking soda solution and leave box of baking soda plus activated charcoal bag), replace all consumable amenities, and test all electronics, remote controls, and smart home devices. HVAC filters in vacation rentals often need replacement every season rather than every 3 months due to high occupancy rotation and humidity fluctuation.

### Active Mold in Bathrooms

Light surface mold (under 10 square feet, non-porous surfaces like tile) can be addressed by the tenant with a 1:10 bleach-to-water solution and appropriate ventilation. Heavy-duty PPE (N95 minimum, gloves, eye protection) is required. Apply solution, allow 10-minute dwell time, scrub with stiff brush, rinse. However: do not scrub mold on drywall, porous grout, or caulk -- this releases spores and spreads the contamination. Caulk with heavy mold should be removed (razor scraper) and replaced. If mold recurs rapidly after cleaning, the source is likely moisture intrusion (a leaking pipe, inadequate ventilation, or structural water ingress) -- this is the landlord's maintenance obligation, not tenant damage, and should be reported and documented. Mold on surfaces that the tenant caused by neglect (shower never cleaned for years, chronic water left standing) is tenant damage. Mold from a leaking pipe or inadequate exhaust fan is the landlord's failure. Document the distinction.

### Unit Received in Poor Condition (Move-In)

When moving into a unit that was not properly cleaned at turnover -- residue in appliances, dirty grout, grimy cabinets -- the move-in condition report is critical. Photograph every dirty surface, every appliance interior, every area of concern on the day of move-in. Submit written documentation to the landlord within the timeframe specified in the lease (typically 24-72 hours) or the timeframe specified in the state's tenant rights statute. This documentation is not just for personal records -- in most jurisdictions, failure to document at move-in means the tenant accepts the unit's condition as satisfactory, which will be used against them at move-out. For the move-in cleaning itself, prioritize contact surfaces first (countertops, cabinet interiors, bathroom fixtures, toilet, inside appliances) before unpacking any food or personal items.

### Lease Requires "Professional Cleaning" With Receipt

Some leases -- particularly in high-end buildings or in markets where landlords have significant leverage -- explicitly require the tenant to provide a receipt from a licensed cleaning company. In this case, DIY cleaning does not satisfy the lease obligation regardless of quality, and the landlord is legally entitled to deduct for professional cleaning if no receipt is provided. If this clause exists, the calculation is simple: hire a professional for the flat cleaning, and do any supplemental spot-cleaning (inside appliances, pet spot treatment) yourself if the professional does not include those items. Always confirm with the cleaning company what is and is not included in a "move-out clean" -- professional companies vary widely on whether oven interiors, inside cabinets, and interior windows are included or an add-on.

### Very Short Timeline (Cleaning Must Be Done in One Day)

When the user has only one day for a full move-out clean, the critical adjustment is triage by deduction risk and sequencing for efficiency. Begin with oven cleaner application first thing (before any other tasks) so it dwells while everything else is being done. Similarly, apply bathroom tile cleaner and toilet bowl cleaner at the start of the bathroom work sequence to allow dwell time. Run the dishwasher empty on hot cycle at the beginning and finish the rest of the kitchen while it runs. Enzymatic treatments on pet spots should be applied early and left to work while other rooms are cleaned. Work with one other person if possible -- assign one person to kitchen/appliances and one person to bathrooms, which are the two slowest and highest-risk rooms. The person who finishes first takes bedrooms. Both converge on final vacuuming/mopping and documentation.

---

## Example

**Input:** "I'm moving out of my 2-bedroom, 1-bathroom apartment at the end of next week. I've lived here for 3 years. I have a cat. My security deposit is $1,800. I want to get as much of it back as possible. I don't have my original move-in report."

---

## Move-Out Cleaning Plan

**Address / Unit:** 2BR / 1BA apartment
**Scenario:** Move-out -- security deposit recovery
**Property Size:** 2 bedrooms, 1 bathroom
**Occupancy Duration:** 3 years
**Special Conditions:** Cat in unit
**Security Deposit:** $1,800
