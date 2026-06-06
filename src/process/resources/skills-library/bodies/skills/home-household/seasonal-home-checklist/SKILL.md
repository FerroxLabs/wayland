---
name: seasonal-home-checklist
description: |
  Generates a focused seasonal transition checklist for a specific season change
  (winter-to-spring, spring-to-summer, summer-to-fall, fall-to-winter) tailored
  to the user's home type and climate region. Covers system changeovers, exterior
  prep, interior adjustments, and safety checks. Use when the user asks about
  preparing their home for a new season, seasonal home prep, or winterizing/
  summerizing their house. Do NOT use for year-round maintenance planning (use
  annual-home-maintenance) or emergency weather preparation.
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
# Seasonal Home Checklist

## When to Use

Use this skill when the user's request matches one of these specific scenarios:

- User explicitly asks how to prepare their home for an upcoming season change ("getting ready for winter," "what do I need to do before summer," "spring prep checklist")
- User mentions winterizing or summerizing their home -- these are the two highest-stakes seasonal transitions and require the most comprehensive checklists
- User is a first-time homeowner who has never done seasonal prep and wants to know what the routine looks like
- User has moved to a new climate region (from the South to the Midwest, from a dry climate to a humid one) and needs region-appropriate guidance, not generic advice
- User wants to confirm they haven't missed anything before an upcoming season -- they may already have a partial list and just want a full framework to cross-reference
- User has a specific trigger event (first frost forecast, noticed a draft, HVAC won't switch modes) and needs immediate seasonal prep prioritization
- User asks specifically about hose bib shutoff, furnace switchover, AC cover-up, gutter cleaning timing, or any other task that signals seasonal home prep

**Do NOT use this skill when:**

- User wants a 12-month recurring maintenance calendar covering all four seasons -- use `annual-home-maintenance` instead, which organizes tasks by month
- User is responding to an imminent severe weather event (approaching hurricane, ice storm warning, tornado watch) -- that is crisis preparation, not seasonal prep; refer to `emergency-weather-prep`
- User manages a commercial, multi-unit, or rental property with professional maintenance contracts -- HOA or property management contexts have regulatory and liability dimensions beyond this skill's scope
- User is asking about major home improvement projects that happen to coincide with a season change (re-roofing, HVAC replacement, attic insulation installation) -- those are renovation projects, not seasonal maintenance
- User is asking about landscaping or gardening only, with no home systems interest -- redirect to a gardening-specific skill
- User is in a temperate or subtropical climate (Miami, Phoenix shoulder seasons) where the concept of "seasonal transition" may be minimal and year-round maintenance is more relevant

---

## Process

### Step 1: Gather the Four Profile Variables Before Writing Any Checklist

Never generate a checklist with missing profile information. The four variables that determine 80% of the content are:

- **Seasonal transition:** fall-to-winter, winter-to-spring, spring-to-summer, or summer-to-fall. If the user says "getting ready for winter," that is fall-to-winter. If they say "spring cleaning," clarify whether they mean preparing for spring weather or end-of-winter systems checks -- these are slightly different.
- **Climate region:** Cold northern (USDA Hardiness Zones 3-5, e.g., Minnesota, upstate New York, northern New England), temperate (Zones 6-7, e.g., mid-Atlantic, Pacific Northwest, Midwest transition zones), hot-humid southeastern (Zones 8-9 coastal, e.g., Georgia, Louisiana, coastal Carolinas), arid/semi-arid (Zones 7-9 interior West, e.g., Arizona, New Mexico, inland California), or Pacific coastal (mild year-round, Zones 9-10, e.g., coastal California, western Oregon/Washington). Ask the user for their state and general region if unsure.
- **Home type:** Single-family detached, townhouse (shared walls, some exterior responsibility), condo/apartment (no exterior responsibility), or manufactured/mobile home (unique structural vulnerabilities). Each type produces a meaningfully different checklist.
- **Heating and cooling system:** Gas forced-air furnace, heat pump (heating and cooling), boiler with radiators or baseboard, electric resistance heat, mini-split systems, window AC units, evaporative/swamp cooler, or no central cooling. The HVAC section is the highest-priority section and cannot be generic.

**Optional but high-value follow-ups:**

- Age of home and known problem areas (old roof, drafty windows, basement moisture history, crawl space)
- Any recent work done (new HVAC, recent insulation upgrade, new roof) -- avoids recommending work the user just completed
- Renter vs. owner -- renters should not be doing HVAC or structural work and need a modified task list

### Step 2: Determine the Correct Seasonal Transition Logic

Each of the four transitions has a distinct emphasis. Do not blend them.

**Fall-to-Winter** -- the highest-stakes transition. Freeze damage, heating system failures, and ice dams are the primary risks. Every Must-do task in this checklist exists to prevent water or cold damage. Key inflection point: first hard frost (sustained temperature below 28°F for 4+ hours). All plumbing freeze-protection tasks must be complete before this date.

**Winter-to-Spring** -- a damage-assessment transition. The primary job is inspecting what winter did to the house. Ice damage, frost heave, moisture infiltration, and HVAC season changeover are the focus. Key inflection point: last frost date (varies from March in Zone 7 to late May in Zone 4). Irrigation and outdoor plumbing activation happen after this date.

**Spring-to-Summer** -- a cooling preparation transition. AC tune-up timing (do it before the first heat wave, not during -- HVAC companies are booked solid in June), exterior maintenance during mild weather, and pest prevention are the focus. Key inflection point: when overnight lows consistently exceed 60°F.

**Summer-to-Fall** -- a preparation-for-transition transition. It is lighter than fall-to-winter but catches the inspection and scheduling tasks that are harder to do in winter (roof inspection, caulk application above 50°F, HVAC scheduling before the fall rush). Key inflection point: first overnight low below 50°F.

### Step 3: Build the HVAC and Systems Section First

This is the highest-priority section. Heating and cooling system failures are the most expensive and most preventable seasonal problems.

- **Furnace filter replacement:** 1-inch filters should be replaced every 60-90 days. 4-inch media filters (Honeywell, Lennox, etc.) every 6-12 months. HEPA filters in whole-home systems: check manufacturer spec, typically 12 months. Filter MERV rating guidance: MERV 8 catches pollen and dust mite debris, adequate for most homes. MERV 11-13 captures smaller particles including mold spores, recommended for allergy sufferers. Do not exceed MERV 13 in a residential system without confirming the blower can handle the increased static pressure.
- **Furnace/boiler inspection:** A professional tune-up should happen every 1-2 years for gas systems. Fall is the right time. Technician will check heat exchanger for cracks (a cracked heat exchanger is a CO hazard and requires immediate system shutdown), clean burners, test igniter and flame sensor, verify flue draft, check refrigerant lines if dual-fuel, and measure combustion efficiency. Cost range: $80-150 for furnace, $100-200 for boiler.
- **Heat pump specifics:** Heat pumps are used for both heating and cooling. In fall-to-winter, verify the reversing valve switches the system to heating mode, check supplemental resistance heating strips (engage at 35°F and below), and confirm defrost cycle is operational. Heat pumps lose efficiency below 35°F in older models; below 25°F in modern cold-climate heat pumps (Mitsubishi Hyper-Heat and similar). Below those thresholds, supplemental heat carries the load.
- **Boiler/radiator systems:** Bleed radiators at the start of each heating season. Use a radiator bleed key (cost: under $5). Open the bleed valve on each radiator until water flows steadily (no air sputtering). Check boiler pressure gauge -- operating pressure should read 12-15 PSI cold, up to 20 PSI when hot. Below 10 PSI, the expansion tank may be waterlogged or the system lost water. Check water feeder/auto-fill valve.
- **Evaporative cooler (swamp cooler) winterization:** Specific to arid climates. Drain the water supply line and cooler pan completely. Remove or replace the pads (aspen or synthetic cellulose pads should be discarded annually). Install a rigid foam cover over the unit or block the duct opening from inside. Failure to winterize results in freeze damage to the water supply valve and pump.
- **Programmable thermostat settings:** Recommended heating season program: 68°F when awake, 60°F sleeping, 60°F away from home. Each degree reduction in setpoint saves approximately 1-3% on heating costs. For heat pumps, avoid large temperature setbacks (more than 4°F) because the system recovers by running resistance heating strips, which are expensive and can negate the savings.

### Step 4: Build the Exterior Section with Region-Specific Tasks

Exterior tasks are season- and region-dependent more than any other category.

**Gutters and downspouts:** The single most universally important exterior task in the fall-to-winter transition. Clean gutters after 75-80% of deciduous leaves have fallen in the area -- typically November in cold northern climates, December in temperate zones. Clogged gutters cause ice dams (water backs under shingles, refreezes, expands, forces water into the attic) and foundation damage (overflow saturates soil at the foundation perimeter). Downspout extensions should direct water at least 6 feet from the foundation. Splash blocks are insufficient.

**Roof inspection:** Do not walk a residential roof unless you have safety equipment and experience. Inspect from the ground with 8x42 binoculars. Signs of concern: missing shingles, shingles with exposed fiberglass mat (loss of granules), curling or cupping shingle edges, dark streaking (algae, begin monitoring), moss growth (root structures lift shingle edges), sagging ridgeline, or daylight visible in the attic. Asphalt shingles have a typical lifespan of 20-30 years for 3-tab, 25-50 years for architectural grade.

**Caulking and sealing:** Caulk adheres properly only above 40°F and requires 24 hours to cure before rain. Fall caulking must be done early in the season. Use silicone or silicone-latex hybrid caulk rated for exterior use (do not use interior painter's caulk outside -- it fails within 1-2 years in freeze-thaw cycles). Seal: around window and door frames where they meet siding, around pipe and wire penetrations through exterior walls, where the sill plate meets the foundation, and under the sill plate on brick homes at weep holes (do not fill weep holes -- they drain moisture from the wall cavity).

**Driveways and walkways:** In cold climates, apply concrete sealant in early fall before freeze-thaw cycles begin. This prevents spalling (surface pitting). Concrete sealant: penetrating silane/siloxane sealer, apply when dry and above 50°F. Asphalt driveway: seal every 2-3 years with coal-tar or asphalt-based sealer -- do NOT seal if less than 6 months old (new asphalt needs time to cure and off-gas oils). Clear leaves from drainage channels to prevent freezing blockages.

**Exterior faucets and hose bibs:** In climates with sustained freezing, all outdoor faucets must be shut off at their interior shutoff valves and drained. Frost-free hose bibs (the standard type installed since the 1980s) self-drain when the exterior faucet handle is open -- but only if the interior valve is in the open position and no hose is attached. A hose left attached prevents draining and causes the self-draining mechanism to fail. If the home has old-style hose bibs (the valve is on the exterior), the interior shutoff is the only protection.

### Step 5: Build the Interior Section

Interior tasks adjust comfort, efficiency, and moisture control.

**Ceiling fans:** Most ceiling fans have a direction switch on the motor housing. In heating mode, clockwise rotation (viewed from below) creates an updraft that pushes warm air pooled at the ceiling back down along the walls. This effect is most noticeable in rooms with ceilings above 9 feet. Run on low speed to avoid creating a wind-chill effect. Reverse for cooling mode (counterclockwise, high speed).

**Indoor humidity:** In cold climates, indoor humidity drops sharply in winter because cold outdoor air, when heated, has very low relative humidity. Target: 30-45% relative humidity (RH) in winter. Below 30% causes wood floor gaps, cracked wood furniture, dry skin and respiratory irritation, and static electricity. Above 50% in winter causes condensation on windows, which leads to mold and rot. Whole-home humidifiers (flow-through drum or steam) attached to forced-air systems are the most effective solution. Portable ultrasonic humidifiers cover 300-500 square feet per unit. Use distilled water in ultrasonic models to avoid white mineral dust.

**Attic inspection:** In fall, before heating season, check the attic for: adequate insulation (see Step 6 for R-value guidance), proper soffit-to-ridge ventilation (attic must stay cold in winter to prevent ice dams -- a warm attic melts snow, which refreezes at the cold eaves), evidence of animal intrusion (droppings, nesting material, chewed wood or wires), and moisture/dark staining on sheathing (indicates condensation from air leaks below).

**Draft detection:** Use a lit incense stick or a smoke pencil to identify air leaks around electrical outlets on exterior walls (add foam gaskets behind the cover plate), around baseboards where the floor meets exterior walls, around attic access hatches (add weatherstripping and rigid foam insulation panel to the back of the hatch), and around recessed light fixtures in the ceiling below the attic (notorious air leaks -- add IC-rated airtight covers if accessible from the attic).

### Step 6: Build the Plumbing Section

Plumbing tasks are the highest-consequence category for freeze-related damage. A burst pipe can discharge 100-200 gallons of water per hour and cause $20,000-$50,000 in damage.

**Pipe freeze thresholds:** The American Red Cross guidelines state that pipes are at risk when exterior temperatures drop below 20°F. In practice, pipes in uninsulated exterior walls can begin to freeze when outdoor temperatures are in the mid-20s if the interior is not adequately heated. Risk factors: pipes on north-facing exterior walls, pipes in cabinets under exterior sinks (open cabinet doors during cold snaps), pipes in unconditioned crawl spaces or unheated garages, and pipes in rim joist cavities (the band joist between the foundation and first floor).

**Irrigation system winterization:** In freeze climates, irrigation systems must be blown out with compressed air before the first hard frost. This is not a DIY task unless the homeowner has experience with compressed air sizing -- using too small a compressor leaves water in the lines; using too large a compressor at too high a PSI damages poly tubing and valves. Professional winterization cost: $50-125 depending on zone count. After blowout, turn off the backflow preventer and insulate it. Set the controller to "off" or "rain mode" -- do not cut power entirely or the programming may be lost.

**Water heater maintenance:** At the start of each heating season, flush 1-2 gallons from the drain valve to remove sediment accumulation. Sediment reduces efficiency (more energy to heat water through the insulating layer), creates rumbling noise, and accelerates tank corrosion. Attach a garden hose to the drain valve, run it to a floor drain, and open the valve briefly. Do not drain completely unless replacing the anode rod -- draining and refilling repeatedly can disturb settled sediment into the hot water supply. Check the anode rod every 3-5 years (sacrificial magnesium or aluminum rod that prevents tank corrosion; costs $20-40 to replace, extends tank life significantly).

**Main water shutoff:** Every adult in the household should know the location of the main water shutoff valve. Test it annually -- older gate valves can seize. If the valve does not turn freely or only partially closes, have a plumber replace it with a ball valve. Ball valves (quarter-turn) are more reliable and faster to operate in an emergency.

### Step 7: Build the Safety Section

Safety checks in seasonal prep prevent the two leading causes of residential fire and CO death -- heating equipment that hasn't run in months and chimneys with blockages or deterioration.

**Smoke and CO detectors:** Test monthly, but the seasonal transition is a reliable reminder. Replace batteries in battery-operated units annually at the fall-to-winter transition (the standard recommendation is the daylight saving time change in November). CO detectors have a useful lifespan of 5-7 years regardless of battery status -- the electrochemical sensor degrades. Check the manufacture date on the back. Smoke detectors: 10-year lifespan for ionization type, 10 years for photoelectric. Install one on each sleeping floor, inside each bedroom, and within 15 feet of each sleeping area. CO detectors: within 15 feet of each sleeping area, one per floor, never inside a garage.

**Chimney and fireplace:** Any wood-burning fireplace or stove that was used in the previous season needs a professional sweep before use. Creosote (pyrolytic carbon from incomplete combustion) accumulates in the flue and is highly flammable. NFPA 211 requires an annual inspection by a qualified chimney professional. Level 1 inspection (visual, no special equipment) is standard for annual use. Level 2 inspection (camera inspection of flue) is required when a new insert is added or after a chimney fire. Cost: $150-300 for sweep plus Level 1 inspection.

**Portable space heater safety:** If recommending space heater use for supplemental heat, note: only use units with automatic tip-over shutoff and overheat protection. Keep 3 feet clearance from all combustibles. Plug directly into wall outlet -- never into an extension cord or power strip (the draw of 1500 watts exceeds the capacity of most extension cords). Never use in a bathroom unless it is specifically bathroom-rated.

**Emergency kit update:** At each fall-to-winter transition, check and refresh the home emergency kit. Components: 1 gallon of water per person per day for 72 hours (3 days), non-perishable food for 72 hours, manual can opener, flashlights with fresh batteries, battery-powered or hand-crank NOAA weather radio, first aid kit, 7-day supply of critical medications, cash, important document copies (insurance, ID), warm blankets or sleeping bags for each person, work gloves.

### Step 8: Apply Climate Region Modifications and Format Final Output

Once all sections are drafted, apply these region-specific filters before delivering the checklist:

- **Cold northern (Zones 3-5):** Maximum content in all categories. Full freeze protection, ice dam prevention, heating system emphasis. Timing: initiate fall-to-winter checklist by September 15 in Zone 3-4, October 1 in Zone 5.
- **Temperate (Zones 6-7):** Moderate freeze protection. Pipes in exterior walls and crawlspaces are at risk but risk window is shorter. Evaporative and condensation management matter more than in dry cold climates. Timing: October 15 for fall-to-winter.
- **Hot-humid southeastern (Zones 8-9 coastal):** Dehumidification is a year-round concern. Fall-to-winter checklist is minimal for freeze protection but should emphasize HVAC maintenance, hurricane damage inspection, and moisture/mold checks after summer. Timing: November for any light freeze protection.
- **Arid/semi-arid interior West (Zones 7-9 interior):** Remove freeze protection tasks in lower-elevation areas. Emphasize UV seal degradation, evaporative cooler winterization, and monsoon drainage inspection. Roof sealant inspection for flat/low-slope roofs is critical.
- **Pacific coastal (Zones 9-10):** Minimal freeze protection. Emphasis on rain drainage, roof integrity, and wood rot prevention. Fall-to-winter checklist emphasizes gutters, drainage, and roof inspection for the rainy season. Timing: October 1.

---

## Output Format

Deliver the checklist in this exact structure. Every field must be populated -- no placeholders.

```
## [Transition Name] Home Preparation Checklist
### [Season], [Year]

**Home Profile:** [Type] | [Climate Region] | [HVAC System Type]
**Key Dates:**
  - Start checklist by: [specific date]
  - Plumbing freeze tasks complete by: [specific date or "before first hard frost"]
  - Full checklist target: [specific date]
**Estimated Total Time:** [X to Y hours] across [N] tasks

---

### Priority Key
- 🔴 Must-Do: Prevents property damage or safety risk if skipped
- 🟡 Should-Do: Prevents accelerated wear, higher energy bills, or comfort issues
- 🟢 Nice-to-Do: Adds comfort or efficiency, no consequence if deferred

---

### HVAC and Systems

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
| 1 | [Specific task with action verb and measurable outcome] | 🔴 Must-Do | [X min] | [Key detail or threshold] |
| 2 | [Task] | 🟡 Should-Do | [X min] | [Spec or tip] |
...

**⚠️ First Time?** [Plain-language explanation of one confusing task in this section]

---

### Exterior

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
...

**⚠️ First Time?** [Explanation]

---

### Interior

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
...

**⚠️ First Time?** [Explanation]

---

### Plumbing

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
...

**⚠️ First Time?** [Explanation]

---

### Safety

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
...

**⚠️ First Time?** [Explanation]

---

### Tasks Requiring Professional Help

| Task | Why Pro Needed | Estimated Cost | Time to Book |
|------|---------------|----------------|--------------|
| [Task] | [Reason -- safety, code, equipment] | $[low]-$[high] | [Lead time to schedule] |
...

---

### Regional Timing Guide

| Climate Region | Start Checklist | Plumbing Freeze Deadline | Full Completion |
|---------------|----------------|--------------------------|-----------------|
| Cold northern (Zone 3-4) | [Date] | [Date] | [Date] |
| Cold northern (Zone 5) | [Date] | [Date] | [Date] |
| Temperate (Zone 6-7) | [Date] | [Date] | [Date] |
| Hot-humid SE (Zone 8-9) | [Date] | [Date] | [Date] |
| Arid West (Zone 7-9 int.) | [Date] | [Date] | [Date] |
| Pacific coastal (Zone 9-10) | [Date] | [Date] | [Date] |

---

### Quick Glossary (First-Time Homeowner)
- **[Term]:** [Plain-language definition]
- **[Term]:** [Plain-language definition]
...

---

### Completion Tracker
- [ ] HVAC Section: [N] tasks complete
- [ ] Exterior Section: [N] tasks complete
- [ ] Interior Section: [N] tasks complete
- [ ] Plumbing Section: [N] tasks complete
- [ ] Safety Section: [N] tasks complete
- [ ] Professional appointments scheduled: [list tasks]
```

---

## Rules

1. **Never generate a checklist without climate region.** A fall-to-winter checklist for Miami and one for Minneapolis share almost no tasks. Asking takes 10 seconds; a wrong checklist wastes the user's time and could leave critical tasks undone. If the user has not provided location, ask before proceeding.

2. **Never omit time estimates.** Every single task must include a realistic time estimate in minutes or hours. "Clean gutters" is not a task -- "Clean gutters and flush downspouts with garden hose -- 1.5 to 2 hours for a standard single-story home, 2.5 to 3.5 hours for two-story" is a task. Time estimates allow users to plan their weekend.

3. **Freeze protection tasks are always 🔴 Must-Do in cold climates.** A burst pipe costs $20,000-$50,000 in water damage. Do not soften this language or mark freeze protection tasks as optional. The one exception is a user who has confirmed the pipes are already winterized by a professional or that the structure is fully heated.

4. **HVAC tasks are always listed first** within the checklist, regardless of section ordering preferences. The heating and cooling system is the most complex, most expensive, and most seasonally critical home system. It sets the context for everything else.

5. **Do not use brand names in recommended product categories.** Say "silicone or silicone-latex hybrid exterior caulk" -- not a named brand. Say "a MERV 11-13 pleated filter" -- not a brand. The exception is when naming an industry standard tool where the category IS the brand (e.g., "a Schrader valve tool" is acceptable technical terminology).

6. **Mark every task that requires minimum temperature.** Caulking (above 40°F), deck staining (above 50°F), concrete sealing (above 50°F), and spray foam (above 40°F) all have temperature minimums. If the user is starting their checklist late in fall, call out which tasks have a weather window and should be done first.

7. **Condos and apartments get a fundamentally different checklist -- not a shortened version of the full one.** The framing shifts entirely: "What does my HOA or building management cover, and what is specifically mine?" The condo checklist covers: HVAC filter change, thermostat switchover, window and door seal inspection, smoke/CO detector testing, balcony drain clearing, humidifier (if in-unit), and reporting exterior issues to management. Typically 8-12 tasks.

8. **Manufactured and mobile homes require explicit structural callouts.** The underbelly (vapor barrier under the floor), skirting, and heat tape on exposed water supply lines are not found in site-built homes. Never omit these for manufactured home users. The exposed underfloor plumbing is the primary freeze risk. Heat tape (self-regulating type) rated for potable water lines is appropriate for pipes under the home.

9. **The spring-to-summer transition requires scheduling AC service before Memorial Day.** HVAC companies are booked 2-4 weeks out by mid-June. The checklist should specify: "Call now to schedule AC tune-up -- do not wait until the first heat wave." Similarly, fall furnace tune-ups should be scheduled in August or September for October appointments.

10. **Provide first-frost and last-frost context, not just calendar dates.** Users in different microclimates within the same state can have 3-4 week differences in frost timing. The National Weather Service Climate Data Online tool (referenced by description, not URL) allows users to look up their zip code's average first and last frost dates. Include this guidance so users can calibrate checklist timing to their specific location rather than relying solely on regional generalizations.

11. **Never recommend a homeowner attempt chimney or flue work themselves.** Chimney inspection is the one seasonal task where DIY has killed people -- both from structural collapse and from undetected CO. Mark it as professional-only, include the NFPA 211 annual inspection requirement, and provide cost context so the user understands it is a routine, expected expense.

12. **Include a "what skipping this costs" note for every 🔴 Must-Do task.** Users are more motivated by specific loss prevention than by general advice. "Shut off and drain hose bibs -- skipping this risks a burst pipe and $20,000-$50,000 in water damage" is more useful than "this is important."

---

## Edge Cases

### First-Time Homeowner (Never Done Seasonal Prep)

Identify this scenario when the user says "just bought," "first winter," "never done this before," or "don't know where to start." This requires a different framing than a standard checklist.

Add a brief orientation note before the checklist: "Seasonal prep is about protecting systems before they are stressed by weather extremes. Think of it in three passes: (1) Shut things down that can be damaged by cold or moisture, (2) Turn on and test systems you'll depend on, (3) Inspect what summer or winter may have damaged."

Add "First Time?" callouts for at least five tasks in the checklist with plain-language instructions. Examples of tasks that confuse new homeowners:
- Bleeding a radiator (what does "bleed" mean, what tool is needed, how do you know it's done)
- Shutting off a hose bib (the interior valve is in the basement, not outside)
- Testing a CO detector (different from smoke detector -- hold the test button 5-10 seconds for CO)
- Checking attic insulation (what are you looking for, what is R-49 in physical terms)
- Reading a water pressure gauge on a boiler (normal range, what low pressure means)

Add a brief glossary at the bottom of the checklist. Include: hose bib, GFCI outlet, soffit, fascia, heat exchanger, MERV, R-value, frost-free, backflow preventer, anode rod, creosote, weep hole, and rim joist.

### Condo or Apartment Owner

The key reframe: the user's responsibility boundary is the unit interior, from the drywall inward (in most HOA configurations). Exterior walls, roof, gutters, and common-area HVAC may all be HOA responsibility.

Ask if they know what their HOA covers. If unsure, provide a dual-column format: "Your responsibility" vs. "Likely HOA responsibility -- report, don't repair."

The condo checklist focuses on: HVAC filter change (if the unit has its own air handler), thermostat switchover and programming, window and door seal inspection from inside the unit, smoke and CO detector testing and battery replacement, balcony or patio drain clearing (commonly the unit owner's responsibility), humidity management in winter, and reporting drafts or moisture around windows/exterior walls to building management rather than self-remedying.

Do not include: gutter cleaning, roof inspection, exterior caulking, hose bib shutoff, irrigation system, or landscape tasks.

### Manufactured or Mobile Home

Flag this as a distinct profile. Manufactured homes have specific vulnerabilities that site-built homes do not:
- **Underbelly:** The vapor barrier and insulation under the floor structure can sag, tear, or be invaded by pests. Inspect for hanging sections, holes, or moisture staining before winter. Repair with heavy polyethylene sheeting and foam insulation.
- **Skirting:** Vented skirting must be sealed for winter to protect under-floor plumbing. Remove or cover foundation vents (use foam vent covers). Maintain a heat source under the home if possible.
- **Water supply lines:** Often exposed or minimally insulated under the home. Self-regulating heat tape rated for potable water is the standard solution. Heat tape should be inspected annually for cracking or charring. Older thermostat-controlled heat tape (not self-regulating) is a fire risk and should be replaced.
- **Roof:** Manufactured homes typically have low-slope or flat roofs with rubber (EPDM) or TPO membrane roofing. Inspect annually for seam lifting, punctures, and pooling water areas. Apply lap sealant around vents and seams annually. Do not use asphalt products on rubber roofing -- incompatible.
- **Tie-downs:** Verify anchor straps are secure before severe weather season, particularly if in a high-wind area.

### User Asks for Two Adjacent Transitions at Once

This happens when a user is catching up on missed prep ("I never did my fall checklist and now it's almost January") or planning ahead ("Can I get both fall and winter prep in one list?").

Generate both checklists but clearly separate them. Add a third section: "Overlapping Tasks (Do Once)." Common overlapping tasks include: HVAC filter replacement (one per transition unless very dirty), smoke/CO detector testing, emergency kit review, and whole-home inspection walkthrough.

Flag time-sensitive tasks from the earlier checklist that may already be overdue. If it is late November and the user is just doing their fall prep, note: "Hose bib shutoff -- if not done, do this today before temperatures drop. This is the highest urgency task if you are starting late."

### Arid or Desert Climate (Minimal Freeze Risk)

The fall-to-winter checklist in Phoenix, Albuquerque, or Las Vegas is fundamentally different from a cold-climate checklist. Do not simply cross off freeze tasks and deliver a thin checklist -- substitute climate-appropriate tasks.

Add: evaporative cooler winterization (full drain, pad removal/replacement, cover installation), HVAC filter cleaning (desert dust loads are heavy -- filters may need monthly checks in summer, bi-monthly in winter), UV degradation inspection (exterior caulk, window glazing compound, paint, and door seals degrade faster in high-UV environments -- inspect and reseal every 1-2 years), drainage channel inspection before winter rains, and pest exclusion (scorpions, rodents, and insects seek warm structures in fall).

For spring-to-summer in arid climates, the emphasis shifts entirely: evaporative cooler startup (drain winterization cover, install new pads, test pump and water distribution), verify outdoor cooling misters are functional, and check shade structures and awnings for sun damage.

### Aging Home or Known Problem Areas

When the user mentions an old roof, chronic basement moisture, known foundation cracks, drafty windows, or prior flooding:

- Escalate the relevant tasks to 🔴 Must-Do
- Add specific inspection criteria (not just "check the roof" but "look for exposed nail heads on shingles, missing or cracked flashing at the chimney base and pipe boots, and dark staining in the attic directly below the chimney")
- Add a recommendation to document current conditions with photographs before the season begins, so damage can be attributed to a specific weather event for insurance purposes
- If the user mentions prior flooding: sump pump testing becomes 🔴 Must-Do, and add: confirm sump pit is clear of debris, test pump by pouring 5 gallons of water into the pit and watching it trigger, and verify the discharge line is not frozen at the outlet. Consider a battery backup sump pump if not already installed.

---

## Example

**User Input:** "I just bought my first house -- a 1985 Cape Cod in central Connecticut with a gas furnace, central AC, and a partial basement. It's October and I know I need to do fall prep but have no idea where to start. The previous owners mentioned the gutters always clog."

**AI Response:**

---

## Fall-to-Winter Home Preparation Checklist
### October-November, First-Time Homeowner Edition

**Home Profile:** Single-family Cape Cod (1985) | Cold northern transitional -- Connecticut Zone 6a | Gas forced-air furnace + central AC

**Key Dates:**
- Start checklist by: Now (you're right on time for central CT)
- Plumbing freeze tasks complete by: November 15 (before sustained nights below 28°F)
- Gutter cleaning: After leaves have fully dropped -- target November 1-15 for central CT
- Full checklist target: November 20

**Estimated Total Time:** 6-9 hours across 26 tasks over 3-4 weekend sessions

---

### Priority Key
- 🔴 Must-Do: Prevents property damage or safety risk if skipped
- 🟡 Should-Do: Prevents accelerated wear, higher energy bills, or comfort issues
- 🟢 Nice-to-Do: Adds comfort or efficiency, fine to defer

---

### HVAC and Systems

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
| 1 | Replace furnace filter -- check size printed on current filter edge | 🔴 Must-Do | 10 min | 1-inch: replace now. 4-inch media: replace if over 12 months old. Choose MERV 8-11 for standard use. |
| 2 | Schedule professional furnace tune-up | 🔴 Must-Do | 5 min to call | Call this week -- fall slots fill fast. Cost: $80-150. Technician checks heat exchanger for cracks (CO hazard), cleans burners, tests igniter. Skipping this risks a no-heat failure on the coldest night. |
| 3 | Switch thermostat to heating mode; test that heat comes on within 2 minutes | 🔴 Must-Do | 10 min | If you smell burning when heat first runs, that's normal -- dust on the heat exchanger burning off. It should clear within 30 minutes. Persistent burning smell means call an HVAC tech. |
| 4 | Program thermostat: 68°F daytime, 62°F sleeping, 60°F away | 🟡 Should-Do | 15 min | Each degree reduction saves approximately 1-3% on heating costs. Do not set below 60°F if pipes run through exterior walls or crawlspaces. |
| 5 | Cover top of central AC condenser with plywood or breathable cover | 🟢 Nice-to-Do | 20 min | Protects from falling ice and debris. Do NOT fully wrap the unit -- trapped moisture corrodes coils. Plywood weighted down is fine. Remove cover the moment heat pump (if applicable) or AC season starts. |

**⚠️ First Time?** Replacing the furnace filter: Locate your furnace (likely in the basement). The filter slides into a slot where the large return air duct connects to the furnace cabinet. The filter has an arrow printed on its frame -- that arrow points toward the furnace (in the direction of airflow). Slide the old one out, note the size (e.g., 16x25x1 inches), buy the same size at a hardware store, and slide the new one in arrow-forward. Dusty filter = the old one, clean white filter = the new one.

---

### Exterior

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
| 6 | Clean gutters and flush downspouts with garden hose -- do this AFTER leaves fully drop | 🔴 Must-Do | 2-3 hr | Previous owners mentioned chronic clogging -- check for overhanging branches that could be trimmed. Clogged gutters cause ice dams in Cape Cods, which can force water under shingles into the attic. |
| 7 | Extend downspouts so they discharge 6+ feet from foundation | 🔴 Must-Do | 30 min | Splash blocks alone are insufficient for clay-heavy CT soils. Flexible downspout extensions cost $5-10 each at hardware stores. |
| 8 | Inspect roof from ground with binoculars | 🔴 Must-Do | 15 min | 1985 home: original roof would be 35+ years old -- well past end of life. Look for curling shingles, missing shingles, exposed brown fiberglass mat (granule loss), and dark staining at the ridge. If concerns found, get a roofer's inspection this fall before winter. |
| 9 | Inspect exterior caulk around all windows, doors, and pipe/wire penetrations | 🟡 Should-Do | 45 min | Do this while temperatures are still above 40°F -- caulk won't adhere in cold. Cracked or missing caulk allows cold air infiltration and moisture entry. Use silicone-latex hybrid exterior caulk. |
| 10 | Check weatherstripping on all exterior doors -- hold a dollar bill in the closed door and pull; if it slides out easily, the seal is worn | 🟡 Should-Do | 20 min | Cape Cods often have a knee-wall door to attic storage -- check this too. Foam tape weatherstripping: $5-12 per door. V-strip metal: $12-20, more durable. |
| 11 | Disconnect all garden hoses from outdoor faucets | 🔴 Must-Do | 10 min | Even frost-free hose bibs will freeze and burst if a hose is left attached -- the hose traps water in the pipe. Store hoses in the basement or garage. Skipping this risks a burst pipe inside the wall. |
| 12 | Store outdoor furniture, cushions, and grill (or cover with weatherproof cover) | 🟢 Nice-to-Do | 30 min | Cushions hold moisture and develop mold. UV and freeze cycles crack plastic and wicker. |

**⚠️ First Time?** Ice dams are a specific risk for Cape Cods. The roof meets the eaves at a shallow angle, and insulation can be thin in the knee walls and eaves. When the attic is warm, heat melts snow on the roof. That snowmelt runs down and refreezes at the cold eave overhang. The ice backs up under shingles and leaks into the ceiling below. Prevention: good attic insulation and adequate soffit-to-ridge ventilation. Check attic insulation thickness in the interior inspection section.

---

### Interior

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
| 13 | Check attic insulation depth above living space (access via attic hatch or knee wall doors) | 🔴 Must-Do | 20 min | Target R-49 for CT (Zone 6a) = approximately 16-18 inches of fiberglass batts or 14-16 inches of blown cellulose. 1985 homes often have R-19 to R-30, which is inadequate. Under-insulated attic = higher heating bills + ice dams. |
| 14 | Check that attic soffit vents are NOT covered by insulation (look for daylight or use a flashlight to locate soffit baffles) | 🔴 Must-Do | 20 min | Blocked soffit vents prevent cold air circulation in the attic, which causes the attic to warm and increases ice dam risk. Add polystyrene baffles if insulation has migrated to the eaves. |
| 15 | Reverse ceiling fan direction to clockwise (there's a small switch on the motor housing) | 🟢 Nice-to-Do | 5 min each fan | Run on low speed. Pushes warm air pooled at the ceiling down the walls. More noticeable benefit in rooms with 9-foot-plus ceilings. |
| 16 | Check indoor humidity with a hygrometer (inexpensive digital models at hardware stores) | 🟡 Should-Do | 10 min | Target 35-45% RH in winter. Below 30% = dry skin, wood floor gaps, static. Above 50% = condensation on windows, mold risk. If forced-air system has a humidifier attached (look for a box on the supply plenum with a water line), set it to 35%. |
| 17 | Check all exterior-wall electrical outlets for cold drafts; add foam gaskets behind the covers | 🟡 Should-Do | 30 min | Remove outlet cover, hold hand near outlet -- if you feel a draft, install a pre-cut foam gasket (sold in packs of 10 for $3). One of the cheapest and most effective air-sealing measures in older homes. |
| 18 | Add weatherstripping to attic access hatch if not already present | 🟡 Should-Do | 30 min | Attic hatches in 1985 homes are often uninsulated and leak massive amounts of warm air. Add foam weatherstripping around the perimeter and glue a rigid foam insulation panel (R-10 or higher) to the back of the hatch. |

**⚠️ First Time?** How to check attic insulation: Open the attic hatch (typically in a closet ceiling or hallway). Look across the floor of the attic. If you can see the tops of the ceiling joists (the wooden beams), insulation is definitely inadequate -- the joists should be buried. Measure from the top of a joist to the top of the insulation. If under 12 inches, adding insulation is one of the highest-return upgrades you can make (estimated $1-3 per square foot for blown cellulose, with 15-20% reduction in heating bills in a 1985 home).

---

### Plumbing

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
| 19 | Shut off interior valves to all exterior hose bibs (outdoor faucets) | 🔴 Must-Do | 15 min | The shutoff valves are inside the basement, near where the pipe exits through the foundation wall. Turn clockwise to close. After shutting off, go outside and open the faucet handle to drain remaining water. Leave the exterior faucet handle open. Skipping risks a burst pipe inside the wall -- $20,000-$50,000 in water damage. |
| 20 | Locate and test the main water shutoff valve | 🔴 Must-Do | 5 min | In a 1985 Connecticut home, likely a gate valve (round wheel handle) or ball valve (lever) near where the water main enters the basement. Turn it completely off and then back on. If it sticks or does not fully close, schedule a plumber to replace with a ball valve -- cost $150-300. Every adult in the home should know where this is. |
| 21 | Insulate exposed water pipes in unheated areas (rim joist, unheated basement sections, under-sink cabinets on exterior walls) | 🔴 Must-Do | 45 min | Use foam pipe insulation sleeves (split-foam tubes, sold by pipe diameter at hardware stores, $0.50-1.50 per foot). Secure with foam tape. For pipe runs in the rim joist cavity, add faced fiberglass batt or rigid foam board over the insulation. |
| 22 | Flush 2-3 gallons from water heater drain valve to clear sediment | 🟡 Should-Do | 15 min | Attach a hose to the valve at the base of the water heater, run to floor drain. Open valve briefly, let it run until water is clear. A 1985 home with original water heater is long overdue for replacement -- check the age sticker on the unit. Average lifespan is 10-15 years. |
| 23 | Note location of the water heater's temperature setting (factory default 140°F -- most plumbers recommend 120°F for safety, which also reduces energy use) | 🟢 Nice-to-Do | 5 min | Scalding risk at 140°F, Legionella risk below 120°F. 120°F is the safe middle ground for residential use. |

**⚠️ First Time?** To find and shut off a hose bib: Go to your basement and look at the exterior walls. Find a copper or steel pipe coming through the foundation wall -- it will have a valve on it. This is the interior shutoff for that outdoor faucet. Turn the wheel or lever clockwise until it stops. Then go outside and open the faucet handle to let the trapped water drain. You should hear a small amount of water dribble out. Once it stops, leave the exterior handle in the open position all winter. If no interior shutoff exists (older homes sometimes lack them), add this to your plumber list.

---

### Safety

| # | Task | Priority | Time | Notes |
|---|------|----------|------|-------|
| 24 | Test all smoke detectors and CO detectors; replace batteries | 🔴 Must-Do | 15 min | Replace all batteries now -- use the daylight saving time change (November) as your annual reminder. CO detectors expire after 5-7 years regardless of batteries -- check manufacture date on the back. New home purchase is a good reason to replace all detectors with known-age units. |
| 25 | Verify CO detector placement -- one on each floor, within 15 feet of each sleeping area | 🔴 Must-Do | 10 min | 1985 homes may not have CO detectors. They are now code-required in Connecticut for all homes with fuel-burning appliances. CO is produced by the gas furnace -- a cracked heat exchanger is the primary risk. |
| 26 | Inspect (or schedule inspection of) fireplace or wood stove if present | 🔴 Must-Do | 10 min check | If this home has a fireplace, do NOT use it until a chimney sweep has inspected it. The previous owner's creosote history is unknown. Schedule a Level 1 sweep and inspection before first use. Cost: $150-300. NFPA 211 requires annual inspection for chimneys in use. |
| 27 | Update or assemble emergency kit for winter power outage | 🟡 Should-Do | 30 min | Connecticut averages 2-5 significant winter outages per decade in inland areas. Kit should include: flashlights with fresh batteries, battery radio, blankets, 72-hour food and water supply (1 gallon per person per day), first aid kit, and if on well water, stored water (municipal water stays on during most outages). |
| 28 | Check fire extinguisher -- needle in green zone on the gauge | 🔴 Must-Do | 2 min | Mount one in the kitchen and one near the furnace room if you have a gas appliance. Replace if gauge reads in the red zone or if it
