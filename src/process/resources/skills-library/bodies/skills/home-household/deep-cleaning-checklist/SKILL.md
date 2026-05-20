---
name: deep-cleaning-checklist
description: |
  Generates a comprehensive room-by-room deep cleaning checklist for thorough
  cleaning that goes beyond weekly maintenance. Covers walls, baseboards, inside
  appliances, behind furniture, light fixtures, and neglected surfaces with time
  estimates and recommended frequency. Use when the user asks about spring cleaning,
  deep cleaning their home, or wants a thorough cleaning checklist beyond their
  regular routine. Do NOT use for regular weekly cleaning (use weekly-cleaning-schedule),
  move-in/move-out cleaning (use move-cleaning), or professional cleaning service
  scoping.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cleaning checklist home-maintenance"
  category: "home-household"
  subcategory: "cleaning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Deep Cleaning Checklist

## When to Use

Use this skill when the user's request clearly involves thorough, infrequent cleaning that goes beyond routine maintenance. Specific trigger scenarios include:

- User explicitly says "spring cleaning," "fall cleaning," "seasonal deep clean," or "I need to really clean my place"
- User says they haven't deep cleaned in 3+ months and want to get everything done properly
- User is preparing for guests, a holiday gathering, or a special event and wants the home in exceptional condition
- User asks about cleaning tasks like "how do I clean inside the oven," "when should I clean behind the refrigerator," or "how do I clean grout" -- tasks that signal deep cleaning intent rather than a routine schedule
- User says they're getting back on track after a period of not keeping up with cleaning and wants a structured full reset
- User asks how often specific deep cleaning tasks should be done and wants a maintenance framework going forward
- User is returning home after an extended absence (vacation, travel, hospitalization) and wants a systematic plan

**Do NOT use this skill when:**
- User wants a weekly or daily maintenance routine -- use `weekly-cleaning-schedule` instead
- User is cleaning because they are moving in or out of a residence -- use `move-cleaning` instead, which covers landlord-standard tasks, appliance documentation, and security deposit protection strategies
- User describes visible mold that covers more than 10 square feet (EPA threshold), or mold on HVAC ducts, insulation, or structural materials -- this requires professional mold remediation, not a cleaning checklist
- User describes a hoarding situation with pathways blocked by accumulated items -- requires professional organizer, specialized cleaning services, and possibly mental health support before cleaning tasks are relevant
- User is asking for a professional cleaning service scope of work -- this is a consumer checklist, not a commercial service specification
- User needs biohazard cleanup (sewage backup, animal infestation debris, decomposition) -- professional hazmat services are required

---

## Process

### Step 1 -- Gather Scope and Constraints

Before generating any checklist, ask for or infer the following. These variables determine the entire output structure, time estimates, and sequencing:

- **Home type and size:** Number of bedrooms, bathrooms, and presence of basement, garage, or laundry room. This is the primary driver of time estimates.
- **Time since last deep clean:** Under 3 months (standard estimates), 3-6 months (add 10-15%), 6-12 months (add 20-30%), over a year (add 30-50% and plan for two sessions).
- **Available time and help:** Single session vs. spread across a weekend vs. across a week. Number of people cleaning. Two people do not cut time in half -- they reduce it by roughly 35-40% due to coordination overhead and overlapping movements in small rooms.
- **Specific problem areas:** Grout staining, grease buildup in kitchen, pet hair embedded in upholstery, hard water mineral deposits, carpet staining, heavily soiled oven, mildew in bathroom. These require specialized techniques and additional time blocks.
- **Constraints and sensitivities:** Allergies, asthma, chemical sensitivities, young children or pets in the home during cleaning, renter vs. owner (which determines tasks like re-caulking or wall touch-up).
- **Priority rooms:** If time is limited, identify which rooms are highest priority so the checklist can be front-loaded.

If the user provides an informal request without these details, make reasonable assumptions based on context (a "2-bedroom apartment" gets a standard 2BR template), state your assumptions explicitly at the top of the output, and offer to adjust.

---

### Step 2 -- Plan the Soaking and Pre-Treatment Strategy

The single most time-saving technique in deep cleaning is applying chemical dwell time correctly. Before any cleaning begins, identify all tasks that require a product to sit and work:

- **Oven interior:** Spray oven cleaner on cold or warm (not hot) oven surfaces. Close the door. Standard oven cleaners need 20-30 minutes for light soil, 30-45 minutes for heavy grease buildup. Some products specify up to 2 hours for overnight cold application.
- **Toilet bowl:** Apply toilet bowl cleaner under the rim and let it run down the bowl. Let it sit the entire time you clean the rest of the bathroom. This eliminates scrubbing effort.
- **Shower grout and tile:** Apply a baking soda paste (baking soda + a few drops of dish soap + enough water to form a thick paste) directly to grout lines, or spray with a commercial bathroom cleaner. Let sit 20-30 minutes. For mineral deposits or hard water staining, apply undiluted white vinegar and let sit for 30+ minutes.
- **Shower head mineral buildup:** Fill a plastic bag with undiluted white vinegar, submerge the shower head, secure with a rubber band. Leave during the entire cleaning session (30-60 minutes minimum). For severe buildup, leave overnight.
- **Stove grates and drip pans:** Fill the sink or a large bucket with hot water, add 2-3 tablespoons of dish soap and 1/4 cup of baking soda, submerge grates and drip pans. Let soak 30+ minutes. This makes scrubbing effortless.
- **Range hood filter:** Submerge in a deep sink or storage bin with boiling water, 1/4 cup baking soda, and a squirt of dish soap. Grease will visibly dissolve in 15-20 minutes.
- **Refrigerator shelves and drawers (if removing):** Place in sink with warm soapy water as soon as you pull them out so they soak while you clean the interior.

Instruct the user to apply ALL soaking products at the very start before touching anything else. This turns 60+ minutes of active scrubbing time into 10 minutes of wipe-down.

---

### Step 3 -- Sequence Rooms to Prevent Re-Contamination

Room sequence matters because of how dust, dirt, and cleaning product residue travel. The correct sequence is not intuitive -- it is governed by two principles: **gravity direction** (dust falls from ceiling to floor, so always clean top to bottom within every room) and **contamination load** (finish with the dirtiest spaces so cleaned rooms are not re-dirtied by foot traffic).

**Recommended room sequence for a typical home:**

1. **Bedrooms** -- Generally the least contaminated rooms. High cleaning energy is available at the start. Mattress and pillow cleaning (which requires drying time) starts early, giving maximum dry time. Washing pillow covers, duvet covers, and bed linens can run through the laundry cycle while other rooms are cleaned.
2. **Living room / dining room** -- Moderate soil, manageable scope. Upholstery and throw items can also go into laundry while other rooms are cleaned.
3. **Kitchen** -- Most time-intensive. Soaking products (oven, grates, range hood filter) applied at the start of the session are ready to wipe down when you reach the kitchen.
4. **Bathroom(s)** -- Highest contamination. Toilet bowl cleaner and grout treatment applied at start of session have had maximum dwell time.
5. **Entry, hallways, and closets** -- Floors in these transitional areas are cleaned last because foot traffic from cleaning other rooms tracks debris through them.

**Within every room, the sequence is invariably:** ceiling and overhead → walls and upper surfaces → furniture and mid-level surfaces → windows → baseboards and trim → floors.

---

### Step 4 -- Build the Room-by-Room Checklist

Generate a complete checklist for each room. Every task must include:
- **Specific technique or method** -- not "clean the window" but "spray glass cleaner in a Z-pattern, wipe with a folded microfiber cloth using overlapping horizontal strokes, buff dry with a second dry cloth to eliminate streaking"
- **Time estimate** for a single person at moderate build-up level
- **Cleaning agent** or tool specified by type (not brand)
- **Frequency** -- how often this specific task should recur

**Kitchen tasks that require special technique:**

*Oven interior:* After dwell time, use a plastic scraper (not metal, which scratches oven enamel) to lift softened baked-on carbon. Wipe with a damp sponge. Repeat with a fresh damp cloth. For the oven door glass -- there is an inner glass panel accessible by removing the door (two hidden hinges) or via a slot at the bottom of the door depending on oven model. Use a wire coat hanger to guide a damp cloth into this slot if the panel is not removable.

*Refrigerator coils:* Coils are either on the back of the refrigerator (older models -- pull the unit forward and vacuum with a narrow crevice tool) or underneath behind the toe kick panel (newer models -- remove the toe kick, vacuum with a refrigerator coil brush which is a long, thin, flexible brush). Dusty coils force the compressor to work harder and can increase energy use by 10-20%. Clean annually.

*Garbage disposal:* Fill with ice cubes plus 1/2 cup of coarse salt, run until the ice is ground (this scrubs the grinding elements). Then grind half a lemon or orange (the citric acid deodorizes). Finally, clean the rubber gasket/flap at the top -- this is one of the most bacteria-laden surfaces in a kitchen and is frequently missed. Fold the gasket back and scrub both sides with a toothbrush and dish soap.

*Dishwasher filter:* Most dishwashers manufactured after 2010 have a manual-clean filter at the bottom of the tub. Twist and remove it, rinse under hot water, scrub with a soft brush and dish soap. A clogged filter is the most common cause of dishes not getting clean and standing water in the bottom of the tub.

**Bathroom tasks that require special technique:**

*Grout cleaning:* A dedicated grout brush (narrow, stiff bristles) is far more effective than a standard scrub brush. For stained grout, apply the baking soda paste and scrub in circular motions, not back-and-forth (circular motion lifts more debris from the porous surface). For gray grout that has turned black from mildew, an oxygen bleach powder (not chlorine bleach) mixed with water into a paste provides the most effective color restoration without damaging grout sealant as aggressively as chlorine bleach does.

*Toilet base and floor around toilet:* The floor immediately around the base of the toilet, particularly between the toilet and wall, accumulates the most bacteria of any floor surface in the home. Use disposable paper towels for this area rather than reusable cloths. Spray the floor around the toilet base with disinfectant, let sit 2-3 minutes (proper dwell time for disinfection to actually occur -- spraying and immediately wiping does not achieve disinfection).

*Exhaust fan:* Remove the cover, wash in warm soapy water. Use a can of compressed air or a vacuum crevice tool to clean the fan blades inside the housing. A grimy exhaust fan can reduce air circulation by 30-50%, contributing to mildew growth in the bathroom.

*Caulk inspection:* During deep cleaning, inspect caulk lines around the tub, shower, and sink for cracking, yellowing, or peeling. This is information for the homeowner -- if caulk is failing, water infiltration behind tiles follows. Note it in the output.

**Bedroom tasks that require special technique:**

*Ceiling fan blades (the pillowcase method):* Slide an old pillowcase over one fan blade at a time, grip both sides of the pillowcase together, and pull it toward you. The dust is trapped inside the pillowcase rather than falling on the bed and furniture. Shake outdoors or into a trash bag.

*Mattress care:* Vacuum the top surface and all four sides with an upholstery attachment. Sprinkle a thin layer of baking soda across the top surface, let sit 20-30 minutes (longer is better -- up to several hours), then vacuum thoroughly. The baking soda absorbs moisture and neutralizes odor. Most innerspring and hybrid mattresses can be flipped or rotated (rotate 180 degrees head-to-foot to even out compression wear). Memory foam and pillow-top mattresses should be rotated but not flipped.

*Under-bed cleaning:* This is one of the highest dust-accumulation zones in any home. Pull the bed away from the wall. Vacuum the floor, the bed frame underside, and the wall/baseboard behind where the bed sits.

---

### Step 5 -- Calculate Time Estimates

Apply these base estimates for a single person working at a steady pace with moderate build-up:

| Home Type | Base Time (solo) | With 2 People |
|-----------|-----------------|---------------|
| Studio/1BR apartment | 3-4.5 hours | 2-3 hours |
| 2BR / 1BA | 5-7 hours | 3.5-4.5 hours |
| 3BR / 2BA | 7-10 hours | 5-7 hours |
| 4BR / 2-3BA | 10-14 hours | 7-9 hours |
| 4BR+ with basement/garage | 13-18 hours | 9-12 hours |

Apply time modifiers:
- Last deep clean 6-12 months ago: add 20% to base
- Last deep clean over 12 months ago: add 35-50% to base (some tasks may need to be done twice)
- Pet household: add 20-30 minutes per room for pet hair removal pass
- Young children in the home: add 15% for additional surface area of low surfaces, toys, and baseboards
- Hard water area (visible mineral deposits on fixtures): add 45-60 minutes for mineral deposit treatment
- Heavy oven buildup requiring double application: add 30 minutes to kitchen estimate

Be explicit that time estimates are for a focused, minimally interrupted work session. Taking breaks, waiting for deliveries, or managing children in the home does not reduce active cleaning time but extends clock time significantly.

---

### Step 6 -- Build the Frequency Matrix

Distinguish between four recurrence levels and assign every task to one:

- **Monthly:** Tasks that become noticeably problematic within 30 days if skipped -- microwave, garbage disposal, drain maintenance, shower curtain/liner, bathroom floor behind toilet, dishwasher filter.
- **Quarterly:** Tasks that accumulate meaningfully over 90 days and are relevant to health, equipment performance, or visible cleanliness -- oven, refrigerator, stove grates, grout scrubbing, upholstery vacuuming, range hood filter, cabinet fronts, trash can interior.
- **Semi-annually:** Tasks where 6 months of buildup is the natural threshold -- ceiling fans, behind/under appliances, mattress vacuuming, window washing, baseboards, bathroom exhaust fan, inside closets, light fixtures.
- **Annually:** Tasks with slow accumulation cycles or structural inspection components -- window track cleaning, inside drawer and cabinet wipe-down, refrigerator coil cleaning, dryer vent inspection and cleaning, inside oven door glass, behind washer and dryer, under bathroom vanity.

---

### Step 7 -- Address Safety and Chemical Hazards

Every deep cleaning output must include a brief but explicit safety note. Do not skip this even if the user did not ask.

**Never combine:**
- Bleach + ammonia: produces chloramine vapor (respiratory irritant, toxic in enclosed spaces)
- Bleach + vinegar or any acid: produces chlorine gas
- Bleach + hydrogen peroxide: accelerates chlorine gas production
- Hydrogen peroxide + vinegar (if mixed in one container): forms peracetic acid, a corrosive irritant; they can be used sequentially on a surface (spray one, wipe, then spray the other) but must not be combined in one bottle

**Ventilation rules:**
- Open at least two windows in opposite areas of the home to create cross-ventilation during any session using bleach, oven cleaner, or bathroom tile cleaners
- Bathroom exhaust fan should run during all bathroom cleaning
- Never use strong chemical cleaners in a fully sealed space

**Personal protection:**
- Rubber gloves for any task involving bleach, oven cleaner, drain cleaner, or prolonged contact with cleaning solutions
- Safety glasses recommended when spraying overhead surfaces (ceiling, fan blades, light fixtures)
- N95 or similar mask recommended when vacuuming mattresses, dusty areas, or using aerosol cleaners in poorly ventilated rooms

---

### Step 8 -- Deliver the Checklist with a Quick-Start Action List

The first item in the output is a "First 10 Minutes" action block -- a list of every soaking/pre-treatment task the user should do before any other cleaning begins. This is the highest-leverage intervention in the entire checklist because it converts passive wait time into active cleaning time elsewhere.

After completing all rooms, include a closing section covering: what went into the laundry (linens, pillow covers, throw blankets, shower curtain) and when it can be swapped, any items identified for inspection (caulk, grout condition, under-sink moisture, dryer vent), and a date to schedule the next deep clean based on recommended frequency.

---

## Output Format

```
## Deep Cleaning Plan

**Scope:** [full house | specific rooms -- list them]
**Home size:** [bedroom/bathroom count]
**Time since last deep clean:** [user-provided or assumed]
**Estimated Total Time:** [X-Y hours] solo | [X-Y hours] with 2 people
**Session plan:** [single day | split across two days -- note if over-a-year buildup]
**Recommended next deep clean:** [month/season -- typically 6 months from now]

> **Assumptions:** [list any details assumed in absence of user information]

---

### First 10 Minutes -- Apply These Before Anything Else
- [ ] Oven: [specific spray product type], spray interior surfaces, close door -- let sit [X] min
- [ ] Toilet bowl: apply toilet bowl cleaner under rim, close lid -- let sit during all bathroom cleaning
- [ ] Stove grates and drip pans: submerge in sink with hot water + dish soap + baking soda
- [ ] Shower/tub grout: apply [baking soda paste or bathroom cleaner] to grout lines -- let sit [X] min
- [ ] Shower head: [vinegar bag method] -- tie on and leave during session
- [ ] Range hood filter: submerge in [hot water + baking soda + dish soap]
- [ ] Start first laundry load: [bed linens from Bedroom 1, or whichever was specified]

---

### Room Sequence and Time Estimates
| Order | Room | Solo Time | 2-Person Time |
|-------|------|-----------|---------------|
| 1 | [Room] | [X-Y min/hr] | [X-Y min/hr] |
| 2 | [Room] | [X-Y min/hr] | [X-Y min/hr] |
| ... | ... | ... | ... |
| **Total** | | **[X-Y hrs]** | **[X-Y hrs]** |

---

### [Room Name] -- Total: [X-Y hours]

**Room-specific notes:** [any special considerations for this room]

#### Ceiling and Upper Zone
- [ ] [Specific task] -- [X min] -- [method/tool/solution] -- [Frequency]
- [ ] [Specific task] -- [X min] -- [method/tool/solution] -- [Frequency]

#### Walls and Mid-Level Surfaces
- [ ] [Specific task] -- [X min] -- [method/tool/solution] -- [Frequency]

#### Furniture and Contents
- [ ] [Specific task] -- [X min] -- [method/tool/solution] -- [Frequency]

#### Windows and Openings
- [ ] [Specific task] -- [X min] -- [method/tool/solution] -- [Frequency]

#### Baseboards and Trim
- [ ] [Specific task] -- [X min] -- [method/tool/solution] -- [Frequency]

#### Floors
- [ ] [Specific task] -- [X min] -- [method/tool/solution] -- [Frequency]

[Repeat structure for each room]

---

### Closing Checklist -- End of Session
- [ ] Retrieve laundry and swap loads as needed
- [ ] Rinse shower head bag and run hot water for 30 seconds to flush loosened mineral deposits
- [ ] Retrieve grates/drip pans/range hood filter from soak, scrub, rinse, dry
- [ ] Final pass: walk each room and look for missed spots, streaky mirrors, unflushed toilet bowl cleaner
- [ ] Inspect: note any caulk, grout, or under-sink issues observed during cleaning
- [ ] Record today's date -- set a reminder for next deep clean: [date 6 months out]

---

### Frequency Reference Matrix
| Task | Monthly | Quarterly | Semi-Annual | Annual |
|------|---------|-----------|-------------|--------|
| [task] | X | | | |
| [task] | | X | | |
| [task] | | | X | |
| [task] | | | | X |

---

### Safety Notes
- NEVER mix: [specific combinations relevant to products used in this session]
- Ventilate: [specific rooms, when to open windows]
- PPE: [gloves, mask, eye protection as relevant to this specific session's products]
```

---

## Rules

1. **Always apply the top-to-bottom, room-sequence discipline.** Cleaning floors before baseboards, or bedrooms after bathrooms, causes re-contamination and wasted effort. Sequence is not optional.

2. **Apply the dwell-time principle rigorously.** Oven cleaner applied and wiped in 5 minutes requires 3x more scrubbing than oven cleaner left for 30 minutes. Toilet bowl cleaner needs 5-10 minutes to dissolve mineral deposits and kill bacteria. Disinfectants need 2-3 minutes of wet contact time to actually disinfect -- wiping immediately after spraying cleans the surface but does not disinfect it. Communicate dwell times for every product used.

3. **Never recommend mixing products.** Explicitly call out the four dangerous combinations: bleach + ammonia, bleach + any acid (vinegar, citric acid, hydrogen peroxide), and hydrogen peroxide + vinegar in a single container. Deep cleaning contexts create the highest risk for accidental mixing because multiple products are in active use simultaneously.

4. **Use time-modifier logic consistently.** Base estimates are for moderate buildup and a focused solo adult. Apply the correct modifier (6-12 months: +20%; 12+ months: +35-50%; pets: +20-30 min/room; hard water deposits: +45-60 min total). Do not give a single flat estimate for an unknown history -- give a range that acknowledges uncertainty.

5. **Specify products by type, never by brand.** Say "oxygen bleach powder" not a specific brand name, "melamine foam sponge" not a trade name, "enzymatic pet stain cleaner" not a specific product. The user needs to know what type of product to purchase, not be sent to a specific manufacturer.

6. **Distinguish cleaning from disinfecting from sanitizing.** Cleaning (soap and water) removes visible soil. Sanitizing (most multi-surface sprays with sufficient dwell time) reduces bacteria by 99.9%. Disinfecting (bleach solutions, hospital-grade products) kills 99.999% including viruses. For most deep cleaning tasks, cleaning is sufficient. Disinfection is warranted for toilet areas, kitchen cutting boards, and any surface that contacts raw meat. Use the correct term in the checklist.

7. **Flag structural observations during deep cleaning.** When tasks involve moving appliances, inspecting behind fixtures, or examining caulk lines, these are natural inspection points. Include a note to check for: under-sink moisture or discoloration (early sign of leak), grout or caulk failure around shower/tub (water infiltration risk), visible dust on refrigerator coils (energy waste and compressor strain), and dryer vent lint accumulation (fire risk -- the leading cause of residential dryer fires).

8. **For apartments and rentals, note what to skip and why.** Re-caulking, repainting touch-ups, and grout replacement are alterations that could create liability. Focus instead on cleaning existing caulk and grout. If caulk is visibly failing, recommend the renter notify the landlord in writing rather than repair it themselves.

9. **Never underestimate kitchen time.** The kitchen consistently takes more time than any other single room. The minimum realistic kitchen deep clean (oven, refrigerator, under/behind appliances, range hood, all surfaces, floor) is 90 minutes even with all soaking done correctly. Budget 2-2.5 hours for a kitchen that has not been deep cleaned in 6+ months. Users who schedule a "quick" kitchen deep clean almost always run out of time or skip key tasks.

10. **Always close the checklist with a "next deep clean" date.** The biggest problem with deep cleaning is that it doesn't happen until the home has deteriorated significantly. Ending every output with a specific future date (6 months for full house, 3 months for kitchen and bathrooms) converts a one-time event into a maintenance system. Include a brief note about what a 6-month maintenance rhythm actually prevents (severe oven buildup, mineral scale on fixtures requiring acid treatments, mattress dust mite accumulation).

---

## Edge Cases

### First Deep Clean in Over a Year (or Unknown History)

Expect several tasks to require a second pass. Oven cleaner may need to be re-applied after the first wipe reveals a second layer of baked carbon. Grout scrubbing may not restore color in one session -- in that case, note that the grout is stained (not dirty) and a grout whitener or grout pen can restore appearance for cosmetic purposes, but cannot reverse permanent staining. Tile grout in this condition may warrant professional cleaning with a steam machine.

Split the work across two days rather than doing a single 10-14 hour session. Day 1: bedrooms, living areas, entry. Day 2: kitchen and bathrooms. Fatigue during marathon sessions causes errors (missed spots, improperly rinsed surfaces, cleaning product residue left on food-contact surfaces).

Add 35-50% to all time estimates. Add 20-30 minutes per room for general clutter management and organization, which always precedes cleaning but is not normally required during maintenance sessions.

---

### Allergies, Asthma, or Chemical Sensitivity

Reformulate the product recommendations toward lower-aggression options. White vinegar, baking soda, and unscented castile soap handle 80% of deep cleaning tasks. Avoid: aerosol sprays (switch to pump sprays or pour-and-wipe), strongly scented products (fragrance is a common asthma trigger), bleach-based products in poorly ventilated rooms.

Wear an N95 or equivalent particulate respirator during mattress vacuuming, dry dusting, and any task generating significant airborne dust. HEPA-filtered vacuum cleaners are significantly better than standard vacuums for allergy sufferers -- a standard vacuum can exhaust fine particulates back into the air while appearing to clean.

Start with the user's bedroom so it becomes a low-allergen retreat if symptoms flare during the session. Wash bedding and mattress covers before beginning and place on the clean bed at the end. Take mandatory breaks every 45-60 minutes, exiting the home if possible for 5-10 minutes of fresh air.

---

### Pet Household (Heavy Pet Hair / Odor)

Add a dedicated "pet prep pass" as the first task in every room before standard deep cleaning. This pass uses a rubber squeegee pulled across upholstered surfaces in short strokes -- the rubber creates static that pulls embedded hair to the surface for easy vacuuming. A slightly dampened rubber glove works identically on smaller surfaces. Standard vacuuming without this prep step is partially ineffective on embedded pet hair.

Enzymatic cleaner is mandatory for any pet stain or odor location. The enzyme breaks down uric acid crystals (the odor source in urine) which all-purpose cleaners, vinegar, and baking soda cannot do. Standard cleaners mask the odor temporarily -- the crystals remain and the smell returns. Apply enzymatic cleaner, let it saturate the area completely (including pad and subfloor if a carpet stain has been there for months), cover with plastic wrap to slow drying, let sit 24-48 hours. This is not a quick task -- it requires planning a day ahead.

For pet-heavy households, semi-annual deep cleaning is insufficient. Quarterly deep cleaning of high-traffic areas (living room upholstery, bedroom flooring, anywhere the pet sleeps) is appropriate.

---

### Hard Water / Mineral Deposit Heavy Homes

Mineral deposits (calcium and magnesium carbonate, visible as white or gray crusty buildup) require acid-based removal. White vinegar (acetic acid, pH ~2.5) and citric acid powder (dissolved in water) are the two most effective DIY approaches. Commercial descaling products work on the same chemistry.

Key surfaces affected: shower heads, faucet aerators (unscrew, soak in vinegar 30-60 min, scrub with old toothbrush, reattach), glass shower doors (white haze), toilet bowls below the water line (brown or white ring), dishwasher interior (white film), and coffee maker internal components.

Do not use acidic descalers on natural stone surfaces (marble, travertine, granite) -- acid etches and permanently damages these surfaces. Use pH-neutral stone cleaner only.

For shower glass, apply undiluted white vinegar, let sit 10-15 minutes, scrub with a non-scratch pad. For severe buildup, make a paste of cream of tartar (tartaric acid) and water, apply, let sit 30 minutes, scrub off. This removes buildup that 5 minutes of vinegar cannot touch.

Add 45-60 minutes to the total time estimate for hard water homes.

---

### Post-Construction or Post-Renovation Cleaning

Construction dust is extremely fine silica-based particulate that settles on every surface including inside cabinets, inside HVAC vents, and on top of refrigerator coils. Standard dusting is insufficient because the particles resettle continuously.

The correct sequence for post-renovation cleaning: (1) HVAC filter replacement first -- the system has been circulating construction dust through the entire home, and a clogged filter will continue re-distributing it; (2) close all HVAC vents with tape to prevent re-contamination during cleaning; (3) wet-wipe all surfaces (dry dusting resuspends the fine particulate); (4) vacuum with HEPA filter only; (5) damp-mop all hard floors; (6) replace HVAC filter a second time 2-4 weeks after cleaning when residual settled dust has recirculated.

Wear an N95 at minimum during all phases. Post-construction dust contains crystalline silica, which is a respiratory hazard distinct from ordinary household dust.

This type of cleaning takes approximately 2-3x longer than a standard deep clean of the same home and almost always requires 2-3 separate sessions over multiple days.

---

### Deep Cleaning With Young Children Present

If children cannot be removed from the home during cleaning, implement a "clean room" strategy: deep clean one bedroom completely first thing in the morning, place children in that room with entertainment, and clean all other rooms in order. Keep all cleaning products in a tote bag or caddy that stays with the adult at all times -- never leave products unattended at child height even for 30 seconds.

Avoid chlorine bleach solutions, aerosol sprays, and oven cleaner when children are anywhere in the home. Substitute oxygen bleach for chlorine bleach (similar efficacy on many surfaces, significantly lower toxicity), and use paste-based oven cleaners that off-gas less than spray versions.

Schedule the kitchen as the last room rather than second-to-last, so children can remain in the kitchen/living area while bedrooms are cleaned, then transition to the clean bedroom while the kitchen is done. Bathroom cleaning can occur during naptime.

---

## Example

**Input:** "I have a 2-bedroom, 1-bathroom apartment. I've been meaning to deep clean for about 8 months. I have all day Saturday and Sunday. I have a cat. No allergies. What's the full checklist?"

---

## Deep Cleaning Plan

**Scope:** Full apartment -- 2BR / 1BA, kitchen, living room, hallway and entry
**Home size:** 2 bedrooms, 1 bathroom
**Time since last deep clean:** ~8 months
**Time modifier:** +25% on all base estimates (8 months buildup, moderate-heavy)
**Pet modifier:** +20-25 minutes per room for cat hair removal pass
**Estimated Total Time:** 8-11 hours solo
**Session plan:** Split across two days -- Day 1 (Saturday): bedrooms and living room; Day 2 (Sunday): kitchen, bathroom, hallway
**Recommended next deep clean:** 6 months from now -- set a reminder

> **Assumptions:** Standard apartment layout (no garage, no basement, no laundry room in unit). Cat is medium-shedding. No heavy carpet staining beyond normal pet hair. Oven has not been cleaned in the same 8-month window.

---

### First 10 Minutes -- Apply These Before Anything Else (Day 1 Start)

- [ ] **Oven:** Remove racks. Spray entire oven interior (walls, bottom, door interior) with oven cleaner -- heavier coat on baked-on areas. Close the oven door. Do not open for 45 minutes minimum given 8-month buildup. Place oven racks in the bathtub with hot water + 1/4 cup dish soap to soak.
- [ ] **Toilet bowl:** Apply toilet bowl cleaner generously under the rim, let it run down the bowl walls. Close the lid. Leave for the entire time you clean the rest of the bathroom.
- [ ] **Shower/tub grout:** Mix baking soda paste (1/2 cup baking soda + 1 tbsp dish soap + 1-2 tbsp water). Apply directly to all grout lines with a small brush or your fingers. For any visible mildew-darkened grout, apply undiluted white vinegar over the paste after 2 minutes. Let sit 30+ minutes.
- [ ] **Shower head:** Fill a quart-sized zip-lock bag with undiluted white vinegar. Submerge the shower head completely. Secure with a rubber band around the neck of the fixture. Leave for the full bathroom cleaning session (60+ minutes).
- [ ] **Stove grates and drip pans (Day 2 start):** Fill kitchen sink with hottest available tap water + 3 tbsp dish soap + 3 tbsp baking soda. Submerge all grates and drip pans. Let soak 45 minutes.
- [ ] **Start Laundry Load 1:** Strip Bedroom 1 bedding (sheets, pillowcases, duvet cover). Wash in hot water if fabric allows.

---

### Room Sequence and Time Estimates

| Order | Room | Solo Time (with pet modifier) | Notes |
|-------|------|-------------------------------|-------|
| 1 | Bedroom 1 | 75-90 min | Includes mattress care |
| 2 | Bedroom 2 | 60-75 min | |
| 3 | Living room | 80-100 min | Upholstery heavy -- cat's main area |
| *End Day 1* | *Total Day 1* | *3.5-4.5 hours* | |
| 4 | Kitchen | 2.5-3 hours | Longest room; oven + fridge |
| 5 | Bathroom | 75-90 min | Grout and fixtures |
| 6 | Hallway, entry, closets | 30-40 min | |
| *End Day 2* | *Total Day 2* | *4.5-6 hours* | |
| **Total** | | **8-10.5 hours** | |

---

### Day 1

---

### Bedroom 1 -- Total: 75-90 min

**Room-specific notes:** Cat hair removal pass required first. Laundry (bedding) already running.

#### Pet Prep Pass -- Do This First
- [ ] Run rubber squeegee or damp rubber glove across all upholstered surfaces (headboard, pillows, chair if present) in short strokes toward you -- collect hair, dispose -- 10 min

#### Ceiling and Upper Zone
- [ ] Dust ceiling corners with a long-handled duster or broom head wrapped in a damp cloth -- 3 min -- Semi-annual
- [ ] Clean ceiling fan blades using the pillowcase method (slide an old pillowcase over each blade, grip both sides, pull toward you trapping dust inside the case, shake outdoors or into trash bag) -- 5 min -- Semi-annual
- [ ] Remove ceiling light fixture globe (if present), wash in warm soapy water, dry completely before reattaching -- 8 min -- Semi-annual
- [ ] Dust tops of door frame and window frame -- 3 min -- Semi-annual

#### Walls and Mid-Level Surfaces
- [ ] Spot-clean visible scuffs or marks on walls using a melamine foam sponge barely dampened with water -- use light pressure and circular motion, as too much pressure or water can remove paint -- 5 min -- Semi-annual
- [ ] Wipe light switch plate and door handle with disinfectant spray (spray onto cloth first, not directly on plate); let sit 2 min -- 2 min -- Quarterly

#### Furniture and Contents
- [ ] Dust all bedroom surfaces systematically from the highest point working down: top of wardrobe/armoire, then shelves, then nightstand surface -- include items on surfaces, not just around them -- 8 min -- Quarterly
- [ ] Vacuum mattress: upholstery attachment, full surface top and all four sides. Sprinkle a thin uniform layer of baking soda across the top surface -- let sit 20 min while you do other tasks, then vacuum thoroughly -- 10 min active (plus 20 min rest) -- Semi-annual
- [ ] Rotate mattress 180 degrees (head to foot) if innerspring or hybrid. Do not flip if memory foam or pillow-top -- 3 min -- Semi-annual
- [ ] Wipe inside and outside of all nightstand and dresser drawers; remove contents, wipe with a damp cloth, dry, replace contents -- 8 min -- Annual
- [ ] Clean mirror with glass cleaner sprayed onto a microfiber cloth (not directly onto mirror to avoid drips into frame), wipe in Z-pattern top to bottom, buff dry -- 2 min -- Quarterly
- [ ] Vacuum inside and floor of closet; wipe shelf surfaces with a damp cloth -- 5 min -- Semi-annual
- [ ] Check under and behind bed for cat toys, accumulated hair, debris before vacuuming -- 2 min -- Quarterly

#### Windows
- [ ] Interior window glass: spray glass cleaner onto a lint-free cloth, wipe in horizontal Z-pattern from top to bottom, buff with a dry second cloth -- 5 min per window -- Semi-annual
- [ ] Window tracks: vacuum visible debris with a crevice tool, then scrub tracks with an old toothbrush dipped in warm soapy water, wipe out with a damp cloth -- 5 min per window -- Annual
- [ ] Window sill: wipe with a damp all-purpose cloth -- 2 min per window -- Quarterly

#### Baseboards and Trim
- [ ] Wipe baseboards with a damp microfiber cloth (no soaking the baseboard -- painted wood absorbs excess water), working from corners outward -- 6 min -- Semi-annual
- [ ] Wipe all door trim -- 2 min -- Semi-annual

#### Floors
- [ ] Move all furniture that can be moved (bed, dresser, chair) -- vacuum the floor beneath each piece and along the wall behind it. This area accumulates the highest concentration of cat hair in the room -- 10 min -- Quarterly
- [ ] Vacuum full carpet/floor including edges and corners with edge attachment -- 5 min -- Weekly (under-furniture pass quarterly)
- [ ] Go back and vacuum the baking soda applied to mattress earlier -- 3 min

**End of Bedroom 1:** Move Laundry Load 1 to dryer. Strip Bedroom 2 bedding and start Laundry Load 2 in hot water.

---

### Bedroom 2 -- Total: 60-75 min

**Room-specific notes:** Same structure as Bedroom 1 -- follow all sections above. Note any differences (e.g., no ceiling fan, different closet configuration). Cat hair prep pass required.

*(Follow identical section structure as Bedroom 1 -- tasks and times identical unless room-specific differences apply. Omit mattress rest time since baking soda can be applied at start of room and vacuumed at the end.)*

**End of Bedroom 2:** Move Laundry Load 2 to dryer.

---

### Living Room -- Total: 80-100 min

**Room-specific notes:** This is the cat's primary habitat -- heaviest pet hair accumulation in the home. Extra time allocated to upholstery and under-furniture zones.

#### Pet Prep Pass -- Do This First
- [ ] Rubber squeegee or damp rubber glove pass across all upholstered surfaces: sofa (all cushions, front, sides, back), any upholstered chairs. Pull hair toward you in short strokes, collect and dispose in trash. Do not vacuum yet -- remove the bulk by hand first -- 15 min

#### Ceiling and Upper Zone
- [ ] Dust ceiling corners and any ceiling light fixtures or pendant lights with a long-handled duster -- 5 min -- Semi-annual
- [ ] If ceiling fan present: pillowcase method on blades (same as bedroom) -- 5 min -- Semi-annual

#### Walls and Mid-Level Surfaces
- [ ] Spot-clean wall scuffs and any area near cat scratching zones (if wall-adjacent) -- 5 min -- Semi-annual
- [ ] Wipe all light switch plates, remote controls, and door handles with disinfectant -- 3 min -- Quarterly

#### Furniture and Contents
- [ ] Dust all surfaces: bookshelves, entertainment unit, side tables, decorative items -- dust shelf contents by removing them, dusting the shelf, then dusting each item before replacing -- 12 min -- Quarterly
- [ ] Clean TV screen: use only a dry microfiber cloth in slow, light circular motions. Never spray any liquid directly on the screen; never press hard -- 2 min -- Monthly
- [ ] Dust and wipe the backs of all electronics -- they accumulate fine dust that blocks ventilation and causes overheating -- 4 min -- Semi-annual
- [ ] Remove all sofa cushions. Vacuum sofa frame interior (crevice tool), under cushions, and in crevices. Replace the rubber squeegee pass with thorough vacuuming using an upholstery attachment -- 10 min -- Quarterly
- [ ] Spot-clean any fabric stains on upholstery: identify fabric type (check tag -- W = water-based cleaner safe, S = solvent only, SW = either, X = vacuum only). For W-coded fabric: blot (never rub) with a damp cloth and small amount of upholstery cleaner or diluted dish soap. Work from the outside of the stain inward to prevent spreading -- 8 min -- As needed
- [ ] Wash or shake throw blankets and decorative pillow covers; start Laundry Load 3 -- 3 min active -- Semi-annual
- [ ] Clean windows and tracks (same technique as bedroom) -- 8 min per window -- Semi-annual

#### Baseboards and Trim
- [ ] Wipe all baseboards -- pay attention to corners where cat hair packs tightly -- 6 min -- Semi-annual

#### Floors
- [ ] Pull couch, chairs, and large furniture away from walls -- vacuum all floor beneath furniture and along the walls. This is the highest pet hair accumulation zone -- 12 min -- Quarterly
- [ ] Vacuum full floor including edges -- 6 min -- Weekly (under-furniture quarterly)
- [ ] Mop hard floors (if applicable) with warm water and floor-appropriate cleaner -- 8 min -- Monthly

**End of Day 1.** All bedding should be dried and beds made. Throw blankets and pillow covers in laundry. Rest for next session.

---

### Day 2

**Day 2 First 10 Minutes -- Apply These Before Anything Else:**
- [ ] Stove grates and drip pans: fill sink (see above)
- [ ] Re-apply toilet bowl cleaner under rim if it has dried overnight
- [ ] Re-apply vinegar bag to shower head

---

### Kitchen -- Total: 2.5-3 hours

**Room-specific notes:** 8 months of use including oven buildup. Oven cleaner was applied this morning (Day 2) -- let sit at least 45 minutes before scrubbing. Grates already soaking.

#### Ceiling and Upper Zone
- [ ] Wipe kitchen ceiling above the stove -- grease vaporizes during cooking and deposits on the ceiling directly above the range. Wipe with a degreaser solution or undiluted dish soap on a damp cloth -- 5 min -- Quarterly
- [ ] Remove and wash range hood filter (already soaking -- scrub with a stiff brush, rinse until water runs clear, set to air dry) -- 8 min active -- Quarterly
- [ ] Wipe range hood exterior and underside -- 4 min -- Quarterly

#### Appliances -- Interior Deep Clean

**Oven (after 45-min dwell time):**
- [ ] Don rubber gloves. Use a plastic scraper or old credit card to lift softened carbon and grease from all interior surfaces -- do not use metal tools on oven enamel -- 8 min
- [ ] Wipe down all interior walls, roof, and floor of oven with a damp sponge. Rinse sponge frequently. Repeat until sponge comes away clean -- 15 min -- Quarterly
- [ ] Clean oven door glass exterior with all-purpose cleaner and cloth -- 3 min -- Quarterly
- [ ] Retrieve oven racks from bathtub soak, scrub remaining debris with a scrub brush, rinse thoroughly, dry, replace -- 10 min -- Quarterly
- [ ] **If baked-on spots remain after first pass:** re-apply oven cleaner to those specific spots, wait 15-20 more minutes, scrub again. With 8-month buildup, one area may require two applications -- budget for this -- As needed

**Refrigerator:**
- [ ] Remove all food. Check expiration dates and discard expired items -- place perishables in a cooler if cleaning will take more than 20-30 minutes -- 5 min
- [ ] Remove all shelves and drawers. Place in sink with warm soapy water to soak -- 3 min
- [ ] Wipe interior walls with a solution of 2 tablespoons baking soda per 1 quart warm water (baking soda is food-safe and deodorizes simultaneously; do not use bleach inside the refrigerator) -- 8 min
- [ ] Wipe the door gasket: use an old toothbrush or cotton swab to clean the accordion folds of the door seal where mold and mildew accumulate. The gasket seal degrades faster if dirty -- 5 min
- [ ] Scrub shelves and drawers, rinse, dry fully before replacing (wet surfaces encourage bacterial growth) -- 10 min
- [ ] Wipe exterior sides and top -- 3 min -- Quarterly
- [ ] Clean refrigerator coils: pull refrigerator away from wall approximately 12 inches. Locate coils (on back or under unit behind toe kick panel). Vacuum with a narrow crevice tool or dedicated coil brush. Dirty coils cause the compressor to run longer, increasing energy costs by 10-20% -- 10 min -- Annual
- [ ] Push refrigerator back, vacuum floor behind where it stood -- 3 min -- Semi-annual

**Dishwasher:**
- [ ] Remove lower rack. Locate the cylindrical filter at the bottom of the tub (center-rear in most models) -- twist counterclockwise to remove. Rinse under hot water, scrub with a soft brush and dish soap, reattach -- 6 min -- Monthly
- [ ] Wipe door gasket with a damp cloth -- mildew accumulates in the folds -- 3 min -- Monthly
- [ ] Wipe door interior (front face of the door inside the tub, which is not reached by the spray arms) -- 3 min -- Monthly
- [ ] Run empty cycle: place a dishwasher-safe bowl containing 2 cups of white vinegar on the top rack, run a hot cycle -- 3 min active / 45 min cycle -- Quarterly

**Microwave:**
- [ ] Steam clean: place a microwave-safe bowl with 1 cup water and 3-4 slices of fresh lemon (or 2 tbsp vinegar). Microwave on high for 3-4 minutes. Let steam sit with door closed for 2 minutes -- the steam softens baked-on splatter -- 5 min active
- [ ] Wipe all interior surfaces with a damp cloth -- comes off easily after steaming -- 3 min
- [ ] Clean turntable plate in warm soapy water -- 2 min -- Monthly

**Small Appliances:**
- [ ] Toaster: unplug, remove crumb tray over the sink or trash can, rinse and replace. Gently shake toaster upside down over trash to dislodge crumbs inside -- 3 min -- Quarterly
- [ ] Coffee maker: descale by running a cycle of equal parts white vinegar and water through the machine. Wait 30 minutes (
