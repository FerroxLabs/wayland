---
name: roof-gutter-maintenance
description: |
  Guides homeowners through roof inspection, gutter cleaning, and maintenance
  tasks to prevent water damage, ice dams, and premature roof failure. Covers
  asphalt shingle, metal, tile, and flat roof types with specific inspection
  intervals and repair indicators. Use when the user asks about roof care,
  gutter cleaning schedules, leak prevention, or roof lifespan assessment.
  Do NOT use for full home maintenance planning (use annual-home-maintenance),
  active roof leak emergencies (use home-repair-first-response), or commercial
  roofing systems.
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
# Roof and Gutter Maintenance

## When to Use

Use this skill when the user presents any of these specific scenarios:

- User asks about cleaning gutters, unclogging downspouts, or choosing gutter guards and wants step-by-step guidance or a maintenance schedule
- User wants to know the current condition of their roof and how many years of useful life remain, based on material type, age, and visible symptoms they describe
- User asks about preventing ice dams, moss growth, algae streaks, or moisture-related roof damage
- User notices granules accumulating in gutters or at downspout discharge points and wants to understand what this means for their roof's remaining life
- User has found ceiling stains, attic moisture, or soft spots in roof decking and wants to understand the severity and next steps (before any active storm emergency)
- User wants to understand and compare gutter guard systems (micro-mesh, reverse curve, foam inserts, brush inserts) and choose the right type for their situation
- User asks whether to repair or replace their roof, and wants a data-driven framework for making that decision
- User wants a seasonal maintenance calendar tailored to their climate region and roof material

**Do NOT use this skill when:**

- The user has an active, urgent leak during a current storm event -- use `home-repair-first-response` instead, which covers emergency tarping, interior water diversion, and roofer triage calls
- The user needs roof framing, rafter, or structural decking repair -- this requires a licensed structural engineer or general contractor, not homeowner maintenance guidance
- The user is dealing with commercial flat roofing systems (built-up gravel, commercial TPO, commercial EPDM over 3,000 sq ft) -- commercial systems have different code requirements, warranty structures, and inspection protocols
- The user needs help planning a full annual home maintenance program across all systems -- use `annual-home-maintenance` to coordinate roof maintenance within that broader schedule
- The user needs help filing a homeowner's insurance claim after a storm -- refer to `home-insurance-claims` for documentation, adjuster preparation, and claim process guidance
- The user asks about solar panel installation on a roof -- roof structural loading and penetration sealing for solar involve different expertise outside this skill's scope

---

## Process

### Step 1: Gather the Roof System Profile

Before providing any specific guidance, collect the information needed to tailor the response accurately. Ask the user directly if any of these are missing:

- **Roof material:** 3-tab asphalt shingles, architectural/dimensional asphalt shingles, metal standing seam, corrugated metal panels, clay tile, concrete tile, wood shake or shingle, flat membrane (EPDM, TPO, modified bitumen, built-up/tar-and-gravel)
- **Approximate roof age or installation year:** This is the single most important variable for estimating remaining life and inspection frequency
- **Roof pitch:** Flat (0:12 to 2:12), low slope (2:12 to 4:12), moderate pitch (4:12 to 9:12), steep pitch (9:12 to 12:12), very steep (12:12 and above) -- pitch affects both maintenance risk and drainage behavior
- **Climate region:** Freeze-thaw zone (USDA zones 4-6, northern states), heavy snow load region (Great Lakes, Mountain West, New England), hurricane/high-wind coast (Gulf Coast, Atlantic Coast), wet Pacific Northwest, hot/UV-intense Southwest
- **Gutter configuration:** Sectional aluminum (most common, prone to seam leaks), seamless aluminum (rolled on-site, fewer leak points), vinyl (low cost, brittle in cold), copper (premium, 50+ year lifespan), half-round versus K-style profile, box gutters (integrated into fascia, older construction), or no gutters
- **Tree coverage:** None or minimal (open yard), moderate (trees within 20-40 feet), heavy canopy (branches overhanging or touching the roof)
- **Reported symptoms:** Granules in gutters, ceiling stains, ice dams, moss or algae streaks, curling or missing shingles, sagging gutter sections, soft spots in attic decking, or no known issues
- **Previous maintenance history:** Last professional inspection date, last cleaning, any repairs in the past 5 years

If the user cannot provide specific information, use the most conservative assumption (older age, heavier coverage, more frequent schedule) and flag that assumption explicitly in the output.

### Step 2: Assign the Roofing System Lifespan Benchmark and Remaining Life Estimate

Match the user's roof material to the industry-standard lifespan range, then estimate remaining life based on age and symptoms:

- **3-tab asphalt shingles:** 15-20 years; economical, flat profile, limited wind resistance (60-70 mph typically), no longer the dominant product in most markets
- **Architectural/dimensional asphalt shingles:** 25-30 years under normal conditions; laminated two-layer construction, rated 110-130 mph wind resistance in premium lines; most common residential roof in North America today
- **Metal standing seam:** 40-70 years; concealed fastener system, thermal expansion handled by floating clips, nearly immune to granule degradation, excellent ice dam performance
- **Corrugated/exposed-fastener metal panels:** 30-45 years; fastener washers degrade at 15-20 years and require re-fastening or washer replacement -- a critical maintenance point often overlooked
- **Clay tile:** 50-100 years for the tile itself; underlayment beneath tile is the limiting factor at 20-30 years and requires periodic replacement even when tile is intact
- **Concrete tile:** 40-50 years; heavier than clay (900-1,200 lbs per square vs. 600-900 for clay), requires verified structural capacity before installation
- **Wood shake:** 20-30 years; degrades faster in humid climates, requires annual moss/lichen treatment in wet regions, fire resistance is limited without treatment (Class A rated shakes require periodic re-treatment)
- **EPDM (rubber membrane):** 15-25 years; seam adhesion is the primary failure point; resists UV but degrades with petroleum-based products
- **TPO membrane:** 15-25 years; heat-welded seams are stronger than EPDM adhesive seams; reflective surface reduces cooling loads
- **Modified bitumen:** 15-20 years; two-ply system (base sheet + cap sheet); granule-surfaced cap sheets behave similarly to asphalt shingles in terms of wear indicators
- **Built-up (tar-and-gravel):** 15-30 years; granule aggregate surface is the wear indicator; ponding is the primary failure accelerator

**Remaining life calculation logic:**
- Roof under 50% of expected lifespan with no reported symptoms: "Healthy, maintain per schedule"
- Roof at 50-75% of expected lifespan: "Monitor closely, annual professional inspection, begin replacement budget planning"
- Roof at 75-90% of expected lifespan with symptoms: "Plan replacement within 2-5 years"
- Roof beyond 90% of expected lifespan or showing multiple failure indicators: "Replace soon -- continuing to patch is economically inefficient"

**Symptom-based adjustments that accelerate the estimate:**
- Granule accumulation equivalent to a full cup or more per downspout per cleaning cycle: subtract 3-5 years from estimate
- Shingles cracking or cupping (edges turning upward): subtract 3-5 years
- Active moss or lichen coverage exceeding 25% of roof area: subtract 2-4 years (moisture retention accelerates shingle decomposition)
- Multiple visible areas of lost granules (baldingpatches): subtract 4-6 years
- Attic decking with dark staining or soft spots: recommend immediate professional inspection before estimating remaining life

### Step 3: Build the Tailored Inspection Schedule

Generate an inspection schedule customized to the roof's age, material, tree coverage, and climate:

**Ground-level visual inspection (homeowner-conducted):**
- Every roof: minimum 2x per year (early spring after winter, late fall after leaf drop)
- Add: after any storm with winds exceeding 50 mph, hail, or falling branches
- Method: binoculars (8x or 10x magnification) from multiple vantage points 20-40 feet from the home, plus examination from a ladder positioned at the gutter line (not on the roof surface)

**Professional inspection intervals by roof age:**
- Under 10 years old: every 3-5 years, or after any significant storm event
- 10-15 years old: every 2-3 years
- Over 15 years old: annually
- Flat/low-slope roofs: annually regardless of age (drainage problems develop faster and cause more damage)
- After any hail event (any size, any roof age): schedule professional inspection within 30 days -- insurance claims typically have a 1-year reporting window but evidence degrades

**Gutter cleaning schedule by tree coverage:**
- No trees within 40 feet: 2x per year (May and November)
- Moderate coverage: 3x per year (April, August, November)
- Heavy canopy or pine trees overhead: 4x per year (March, June, September, November); pine needles are particularly dangerous because they compact into dense mats that hold moisture and accelerate gutter corrosion
- After any windstorm depositing significant debris: add an unscheduled cleaning

### Step 4: Deliver the Ground-Level Inspection Checklist

Organize the checklist by component. Make each item specific enough that the user knows exactly what a problem looks like:

**Shingles and roof surface (viewed with binoculars from ground):**
- Missing shingles: gaps in the surface where substrate (felt or ice/water shield) is exposed to weather
- Cracked shingles: visible fractures running across the shingle face -- common in older 3-tab and wood shake
- Curling: two failure modes -- cupping (edges curl upward, caused by moisture differential between top and bottom of shingle) and clawing (middle lifts while edges stay flat, caused by nail pull-through or adhesive failure)
- Granule loss: bare or visibly lighter patches on shingle faces, especially on south- and west-facing slopes that receive the most UV exposure
- Moss or algae: moss is green and three-dimensional (biological organism holding moisture); algae produces flat dark gray or black streaks (Gloeocapsa magma bacteria) and is cosmetic primarily but indicates moisture conditions favorable to moss colonization
- Visible sagging between rafters (sheathing depression): indicates wet, rotting decking beneath the surface -- professional assessment required immediately
- Ridge cap condition: ridge caps are the first shingles to lift in wind events; check for lifted edges or missing ridge caps
- Hip cap alignment: similar to ridge caps, hip caps on hipped roofs experience high wind exposure

**Flashing (the thin metal strips sealing roof penetrations and transitions):**
- Chimney flashing: step flashing along the sides, counter-flashing embedded in the mortar joint, and saddle/cricket behind the chimney for chimneys wider than 30 inches; look for gaps, rust, or lifted sections
- Pipe boot flashing: rubber boot around plumbing vents; rubber degrades and cracks at 15-20 years even when shingles remain in good condition -- a very common source of leaks
- Skylight flashing: self-flashing skylights have integrated flanges; curb-mounted skylights rely on step flashing; look for lifted edges or gaps at corners
- Drip edge: the L-shaped metal at eaves and rakes that directs water into the gutter and protects the fascia board
- Valley flashing: open metal valleys (exposed aluminum or galvanized steel) or closed/woven valleys; look for rust, perforations, or debris accumulation in the valley channel

**Gutters and drainage system:**
- Gutter slope: gutters should slope toward downspouts at approximately 1/4 inch per 10 feet; standing water after rain indicates inadequate slope or a sag caused by bracket failure
- Gutter separation from fascia: look for gaps between the back of the gutter and the fascia board, indicating bracket failure or fascia rot
- Downspout quantity and placement: one downspout per 30-40 linear feet of gutter is a baseline -- overloaded downspouts back up in heavy rain
- Downspout extensions: discharge must direct water at least 4-6 feet from the foundation; extensions, splash blocks, or underground drainage pipes accomplish this
- Overflow points: gutters with no overflow relief overflow into the fascia and soffit area during heavy rain; some systems use planned overflow notches to direct water away from the structure

**Attic interior inspection (from inside the attic with a flashlight):**
- Daylight through decking: any visible light from outside indicates gaps, cracks, or missing decking sections
- Water stains on rafters or decking: dark brown or gray staining indicates past or current moisture intrusion; active drips during or after rain confirm an ongoing leak
- Mold or mildew on sheathing: black, green, or white growth indicates chronically elevated moisture, often from condensation (inadequate ventilation) rather than a roof leak -- both need resolution
- Insulation condition: compressed, wet, or discolored insulation in the attic floor loses R-value and may indicate moisture problems
- Soffit and ridge vent openings: ensure soffit vents are not blocked by insulation (use insulation baffles/rafter vents to maintain the airway), and that the ridge vent is not blocked by debris

### Step 5: Provide the Gutter Cleaning Procedure

This is a sequential, safety-first procedure. Provide every step -- do not assume the user knows ladder safety or tool selection:

**Equipment needed:**
- Extension ladder with standoff/stabilizer arms (prevents ladder from resting against and crushing gutters, and creates safer working position)
- Work gloves (leather or heavy rubber -- decomposed leaf matter harbors bacteria and can contain sharp debris)
- Safety glasses
- 5-gallon bucket with a metal hook to hang on the ladder
- Gutter scoop (plastic preferred -- metal scoops scratch aluminum and vinyl gutters)
- Garden hose with adjustable spray nozzle, or a pressure washer on low setting (avoid high pressure -- it forces water under shingles at the fascia line)
- Plumber's drain snake or plumbing auger for downspout clogs (a garden hose alone often fails on compacted clogs)
- Gutter sealant (polyurethane or silicone formulated for gutters) for seam repairs
- Gutter screws (hex head, self-tapping, 1/4 inch) to replace failed gutter spike-and-ferrule systems -- screws hold 5-10x longer than the original spikes

**Procedure:**
1. **Set up the ladder safely.** Position the base 1 foot away from the wall for every 4 feet of vertical height (the 4:1 ratio gives the correct 75-degree angle). Extend the ladder 3 rungs above the gutter line for stability. Use a standoff bracket to keep the rails off the gutter. Have a second person hold the base if working above 8 feet. Wear non-slip footwear. Never rest a ladder against a vinyl gutter -- it will collapse under the lateral load.

2. **Work systematically from one end to the other.** Start at the end opposite the downspout. Remove large debris by hand into the bucket. Move the ladder every 3-4 feet -- never lean more than arm's length to either side. This is the most dangerous part of gutter maintenance; ladder falls kill approximately 300 Americans per year and injure 164,000.

3. **Flush with water.** After clearing debris, flush from the far end toward the downspout using a garden hose. A garden hose running at full tap pressure (40-60 psi) is sufficient and safe. Observe the flow: water should reach the downspout within 10-15 seconds and flow freely without backing up. Standing water after flushing indicates a slope problem or partial blockage.

4. **Clear downspout clogs.** Insert the hose into the top of the downspout and run at full pressure. If the clog does not clear within 30 seconds, the blockage is compacted. Options: (a) insert a plumber's snake from the top, rotating while advancing; (b) disconnect the downspout at the elbow fitting at the base and clear from below; (c) use a wet/dry vacuum with the hose inserted from below -- this is often the fastest method for leaf-mat clogs.

5. **Inspect gutters while cleaning.** Look for: rust spots on steel gutters (treat immediately with rust-inhibiting primer before they perforate); cracks in vinyl gutters (replace the affected section -- vinyl patches are temporary in freeze-thaw climates); separated seams (dry the area completely, apply gutter sealant to the interior lap joint, allow 24 hours to cure before exposing to rain); failed spikes (replace with 1/4-inch hex head gutter screws driven through the gutter face into the fascia board, spaced 24 inches apart).

6. **Confirm downspout discharge location.** Walk to each downspout discharge point and confirm water exits at least 4-6 feet from the foundation. Extend with a snap-in aluminum extension if needed ($8-15 per section). In climates with wet springs or high water tables, consider underground drainage pipe connecting the downspout to a dry well or daylight outlet at the property line.

7. **Reinstall gutter guards if present.** Micro-mesh guards require occasional surface scrubbing with a soft brush to clear pollen and fine debris from the mesh surface -- the debris does not fall through but can impede flow if it accumulates.

**Time estimates:**
- Single-story home, no gutter guards, moderate debris: 1-2 hours
- Two-story home: 2-3 hours, with significantly higher ladder risk -- professional cleaning ($150-350 per visit) is strongly recommended for two-story work
- Home with heavy debris and compacted clogs: 3-5 hours, plus any repair time

### Step 6: Evaluate Gutter Guard Options If the User Asks

Gutter guards vary enormously in effectiveness. Provide an honest evaluation:

**Micro-mesh guards** (stainless steel mesh over aluminum frame): Best overall performance. Blocks virtually all debris including pine needles and maple seeds. Water flows through the mesh by surface tension. Weakness: pollen, roof grit, and fine particles slowly accumulate on the mesh surface and must be brushed off annually. Cost: $15-25 per linear foot installed. Best for: any climate with moderate to heavy debris.

**Reverse curve (surface tension) guards** (water flows around a curved lip into the gutter): Effective for large leaves but allows pine needles, shingle grit, and small debris to enter the gutter. The gap at the front edge can be entered by birds and insects. Cost: $10-20 per linear foot installed. Best for: areas with large deciduous leaves only.

**Foam inserts** (polyurethane foam that sits inside the gutter): Debris sits on top of the foam and blows away or is washed off. In reality, debris accumulates within the foam cells over 2-4 years and becomes extremely difficult to remove without replacing the foam. Mold growth within the foam is common in humid climates. Cost: $3-6 per linear foot. Best for: very light debris situations only; not recommended for heavy coverage.

**Brush inserts** (cylindrical brushes that sit in the gutter): Same accumulation problem as foam, but with bristles. Debris wraps around bristles and requires manual removal. Cost: $3-8 per linear foot. Not recommended generally.

**Perforated aluminum or vinyl covers** (solid covers with holes or slots): Fail in heavy rain -- water overshoots the gutter. Better than nothing in light rain areas. Cost: $5-10 per linear foot. Acceptable only in arid climates.

**Key message on gutter guards:** No gutter guard eliminates maintenance entirely. All systems require at least annual inspection and periodic cleaning. The primary benefit is reducing frequency from 3-4 cleanings per year to 1-2, which has real value for safety and time savings.

### Step 7: Make the Repair vs. Replace Decision

Use a clear decision framework:

**Continue maintaining (repair as needed) when:**
- Roof is under 70% of expected lifespan with no symptoms or minor isolated issues
- Repair cost for any single incident is under $500-800
- The roof has no more than 10-15% of its surface area showing wear indicators
- A professional inspection confirms no systemic failures (widespread cracking, delamination, adhesive failure)

**Begin replacement planning (12-36 month horizon) when:**
- Roof is between 70-90% of expected lifespan
- Annual repair costs are exceeding $500/year
- A professional finds 15-25% of shingle area showing significant wear
- Any section of roof decking has been wet or soft, even if now dried out (decking rot spreads even when the surface appears dry)
- The roof has already been re-roofed once (most jurisdictions allow a maximum of two layers of asphalt shingles before a full tear-off is required -- a second re-roof means tear-off is mandatory, which adds $1-3 per square foot to cost)

**Replace immediately when:**
- Roof is beyond 90% of expected lifespan with any symptoms
- A professional finds active leakage at multiple points
- Any roofer quotes repair costs exceeding 20% of replacement cost
- The attic shows active mold growth attributable to roofing failures
- Storm damage is extensive enough that an insurance claim will cover most of replacement cost (document everything with photos and timestamps before any temporary repairs)

**Replacement cost reference ranges (national average, residential, per typical 1,500-2,000 sq ft footprint):**
- 3-tab asphalt tear-off and replacement: $6,000-10,000
- Architectural asphalt tear-off and replacement: $8,000-16,000
- Metal standing seam (new install): $18,000-40,000
- Concrete tile (new install, includes structural verification): $20,000-40,000
- Clay tile (new install): $25,000-50,000
- Flat EPDM replacement (per 1,000 sq ft): $5,000-10,000
- Flat TPO replacement (per 1,000 sq ft): $5,500-11,000

Note: Regional variation is significant. Coastal California and New York markets run 30-50% above these figures. Midwest and Southeast markets often run 10-20% below. Steep pitch (over 9:12) adds 20-40% to labor costs. Complex roofs with multiple valleys, dormers, or skylights add 15-30%.

---

## Output Format

```
## Roof and Gutter Maintenance Plan

**Roof:** [material], approximately [age] years old
**Expected Lifespan:** [range] years
**Estimated Remaining Life:** [range] years ([condition qualifier: assuming normal maintenance / with current symptoms / based on age alone])
**Roof Pitch:** [flat / low slope / moderate / steep / very steep]
**Climate Region:** [region name and relevant hazards]
**Gutters:** [type and profile, or "none"]
**Tree Coverage:** [none / moderate / heavy canopy]
**Known Symptoms:** [list, or "none reported"]

---

### Lifespan and Condition Summary

| Factor | Status | Impact |
|--------|--------|--------|
| Age vs. expected lifespan | [X of Y years (Z%)] | [Low / Moderate / High concern] |
| Granule loss | [None / Moderate / Significant] | [Description] |
| Shingle condition | [Intact / Curling / Cracking / Missing] | [Description] |
| Flashing condition | [Good / Unknown / Suspect] | [Description] |
| Attic condition | [Checked / Not checked / Issues found] | [Description] |

**Overall Assessment:** [Maintain / Monitor Closely / Plan Replacement / Replace Soon]

---

### Inspection Schedule

| Inspection Type | Frequency | Next Due | DIY Cost | Professional Cost |
|----------------|-----------|----------|----------|------------------|
| Ground-level visual (binoculars) | [frequency] | [month/season] | $0 | N/A |
| Ladder-level gutter inspection | [frequency] | [month/season] | $0 | N/A |
| Professional roof inspection | [frequency] | [timeframe] | N/A | $150-400 |
| Gutter cleaning | [frequency] | [month] | $0 + 1-3 hrs | $150-350/visit |

---

### Ground-Level Inspection Checklist

**Shingles and Roof Surface (use binoculars from 20-40 feet away):**
- [ ] Missing shingles -- gaps exposing felt underlayment or bare decking
- [ ] Cracked or fractured shingles -- visible breaks across the shingle face
- [ ] Cupping -- shingle edges turning upward (moisture stress)
- [ ] Clawing -- shingle middle lifting while edges remain flat (adhesive failure)
- [ ] Granule loss -- lighter-colored bare patches, especially on south/west slopes
- [ ] Moss or algae -- green three-dimensional growth or dark flat streaks
- [ ] Sagging between rafters -- visible depression in the sheathing plane
- [ ] Ridge cap condition -- lifted, cracked, or missing ridge cap shingles
- [ ] [Any material-specific items added for the user's roof type]

**Flashing:**
- [ ] Chimney step flashing and counter-flashing -- gaps, rust, or lifted edges
- [ ] Pipe boot flashings -- rubber boot cracking or separation from pipe
- [ ] Valley flashing -- rust, debris accumulation, or perforation
- [ ] Drip edge at eaves and rakes -- secure and directing water into gutters

**Gutters and Drainage:**
- [ ] Gutter slope -- no standing water 24 hours after rain
- [ ] Gutter-to-fascia gap -- no separation or pulling away from the house
- [ ] Downspout quantity -- one per 30-40 linear feet minimum
- [ ] Downspout discharge -- at least 4-6 feet from foundation
- [ ] Visible debris accumulation -- heavy debris between cleanings

**Attic (inspect from inside with flashlight after any suspected leak):**
- [ ] Daylight visible through roof sheathing -- any pinpoints of light
- [ ] Water stains on rafters or decking -- active drips or dried staining
- [ ] Mold or mildew on sheathing -- black, green, or white growth
- [ ] Soffit vents clear -- not blocked by insulation
- [ ] Ridge vent clear -- not obstructed by debris or nesting material

---

### Gutter Cleaning Procedure (Summary)

1. Set up extension ladder at 75-degree angle with standoff bracket; confirm a helper or ladder stabilization
2. Scoop debris from far end toward downspout using gutter scoop; move ladder every 3-4 feet
3. Flush with garden hose from far end; confirm free flow to downspout
4. Clear any downspout clogs with hose pressure, then plumber's snake if needed
5. Inspect for rust, cracks, separated seams, and failed gutter spikes during cleaning
6. Repair seams with gutter sealant; replace spikes with 1/4-inch hex-head gutter screws
7. Confirm downspout discharge location and distance from foundation

**Estimated time:** [X hours based on home size and tree coverage]

---

### Recommended Actions and Priority Order

| Priority | Action | Cost Estimate | DIY or Pro | Timeframe |
|----------|--------|---------------|------------|-----------|
| 1 | [Most urgent item] | $[range] | [DIY / Professional] | [Immediate / Within 30 days / This season] |
| 2 | [Next item] | $[range] | [DIY / Professional] | [timeframe] |
| 3 | [Next item] | $[range] | [DIY / Professional] | [timeframe] |

---

### Replacement Budget Planning (if applicable)

**Trigger for replacement decision:** [specific condition to watch for]
**Estimated replacement window:** [X-Y years from now]
**Replacement cost range:** $[low]-$[high] for [scope]
**Upgrade option:** [alternative material with cost and lifespan benefit]
**Key note:** [any re-roofing layer limitation, permit requirement, or regional factor]
```

---

## Rules

1. **Never instruct a homeowner to walk on a roof surface for inspection or maintenance.** All homeowner inspection is conducted from the ground using binoculars, or from a ladder positioned at the gutter line only. The only time the user should be above the gutter line is for gutter cleaning, and only with a properly set ladder -- never on the roof surface itself. Professional roofers use fall protection systems (OSHA-required harnesses, ridge anchors, and rope systems) that homeowners do not have.

2. **Always apply the correct lifespan benchmark for the specific material, and never conflate materials.** A 20-year-old architectural asphalt roof is in a fundamentally different position than a 20-year-old metal or tile roof. Do not provide a generic "your roof is old" assessment -- state the specific expected lifespan, percentage consumed, and what that means for this material.

3. **Pipe boot flashing failure is the most common overlooked leak source in aging residential roofs.** Always include it in the inspection checklist. Rubber pipe boots degrade on a 15-20 year cycle, independent of shingle condition. A roof with intact shingles can have a chronic slow leak from a cracked pipe boot for years before it is detected. If the user describes a mystery slow leak, ask specifically about pipe boot condition.

4. **Never recommend rock salt for ice dam treatment.** Rock salt (sodium chloride) corrodes aluminum gutters, damages shingles, kills landscaping, and leaves residue on painted surfaces. The correct recommendation for ice dam chemical treatment is calcium chloride -- placed in a nylon stocking or perforated tube draped perpendicular over the dam to melt a drainage channel, not broadcast across the roof surface.

5. **When the user reports granules accumulating in gutters, calibrate the severity accurately.** Some granule accumulation is normal for the first few months after installation (surface granules from manufacturing) and after any hail event. Persistent, significant granule accumulation in a roof over 15 years old is a genuine wear indicator. Quantify: a tablespoon per cleaning cycle per downspout is minor; a cup or more per downspout per cleaning cycle indicates accelerating wear.

6. **Flat and low-slope roofs require annual professional inspection regardless of age -- no exceptions.** Drainage failures on flat roofs (ponding water remaining more than 48 hours after rain) accelerate membrane degradation by orders of magnitude compared to pitched roofs. A ponding area of 100 sq ft that persists year-round can reduce flat roof life by 30-50%. This is the threshold where a professional inspection each year is non-negotiable.

7. **The 4:1 ladder safety ratio is not negotiable.** When describing ladder setup, always state: 1 foot of base distance from the wall for every 4 feet of height. At 16 feet of height (typical one-story eave), the base should be 4 feet from the wall. Deviating from this angle makes the ladder either prone to kicking out at the base (too shallow angle) or tipping backward (too steep). Do not abbreviate this guidance -- ladder falls are the most common serious DIY injury in home maintenance.

8. **Re-roofing layer limits are code-driven and affect replacement cost significantly.** Most jurisdictions following the International Residential Code (IRC) permit a maximum of two layers of asphalt shingles before a mandatory tear-off is required. A homeowner with an existing two-layer roof who receives a "just re-roof over it" quote is receiving an illegal and structurally problematic recommendation. Always flag this if the user mentions having an existing re-roof.

9. **Gutter screws outperform gutter spikes in every metric.** Original gutter spike-and-ferrule systems fail as wood fascia boards experience seasonal expansion and contraction. The solution is not re-driving the spike -- it is replacing the spike with a 1/4-inch hex-head self-tapping gutter screw of 1.5-2 inch length, driven through the same hole into solid wood. Screws hold 5-10 times longer. This is a specific, non-obvious repair recommendation that has high value.

10. **Never recommend specific material brands, contractors, or product brands by name.** Guidance must remain brand-agnostic. When referencing products, use generic descriptors: "polyurethane gutter sealant," "micro-mesh gutter guard," "ice-and-water shield membrane," "hex-head gutter screw." If the user asks for brand recommendations, direct them to consumer review resources or local roofing supply dealers.

11. **Cost estimates must always include both DIY and professional options when the task is safely DIY-capable.** Never present only the professional cost as if DIY is not an option, and never present only the DIY option as if there is no professional service available. For tasks on two-story homes or steep roofs, proactively recommend professional service over DIY based on safety risk, even if the task is technically DIY-capable.

12. **Attic ventilation failures produce symptoms that mimic roof leaks.** If the user describes moisture, dripping, or staining during cold weather -- particularly in late winter or early spring -- consider condensation from inadequate attic ventilation as a likely cause before assuming an active roof leak. Poorly ventilated attics in cold climates experience moisture condensation on the underside of cold roof decking as warm interior air reaches the attic. This is resolved through ventilation improvement (soffit and ridge vent balancing, air sealing of attic bypasses), not roofing repair.

---

## Edge Cases

### 1. Flat or Low-Slope Roof (0:12 to 3:12 pitch)
Flat roofs have fundamentally different failure modes and maintenance protocols than pitched roofs. The primary enemies are ponding water and membrane seam failure. Ponding water -- defined as water remaining on the surface 48 or more hours after rain -- is a catastrophic accelerator of membrane degradation: it adds structural dead load, promotes membrane blistering and delamination, creates freeze-thaw cycling damage at the water mass, and prevents UV-protective surfaces from functioning correctly. Any homeowner describing ponding on a flat roof should be directed to professional assessment for drain correction (adding roof drains, reconfiguring slope with tapered insulation) before membrane replacement. Do not walk on flat roofing membranes without first identifying the membrane type: TPO and EPDM typically tolerate foot traffic when installed correctly, but modified bitumen and built-up roofs with aggregate surfaces can be walked on with care, while heavily degraded or blistered surfaces of any type should not be walked on. Flat roof cleaning priority: keep roof drains and drain guards clear of debris after every storm. A single clogged drain on a flat roof during a heavy rain event can add thousands of pounds of water load to the structure and can collapse a roof deck.

### 2. Ice Dam Formation in Freeze-Thaw Climates
Ice dams form when heat loss from the conditioned living space warms the attic and roof deck above the freezing point, melting snow on the upper roof surface. The meltwater flows down the slope and refreezes at the cold eaves overhang, which is not heated from below. The resulting ice mass backs up under shingles and forces liquid water into the attic. The complete solution to ice dams is attic performance improvement -- not roofing repair. The three-part attic approach: (1) air sealing all penetrations through the attic floor (wiring holes, pipe penetrations, recessed light cans, HVAC chases) to stop warm air movement into the attic; (2) increasing attic insulation to R-49 minimum (approximately 14-16 inches of blown cellulose or fiberglass), with R-60 preferable in very cold climates; (3) maintaining continuous ventilation from soffit to ridge to keep the roof deck cold and uniform. For immediate relief of an active ice dam: use a roof rake to remove snow from the lower 3-4 feet of the roof from the ground -- do not use the rake on ice already formed. Place calcium chloride ice melt in a nylon stocking, tie it closed, and drape it perpendicular over the dam's crest every 3-4 feet to melt drainage channels. Heating cables (self-regulating type) installed in a zigzag pattern along the eaves before winter are a mechanical mitigation -- they address the symptom but not the cause, consume electricity, and require annual inspection for physical damage. Metal roofs (standing seam) resist ice dam backup penetration significantly better than asphalt because the interlocked seams provide no pathway for backed-up water.

### 3. Hurricane and High-Wind Coastal Zones
Roofs in hurricane zones (FEMA-designated Wind Zones II, III, and IV, broadly covering Gulf Coast, Florida, Atlantic coastal states) face fundamentally higher wind loads -- up to 150-180 mph design winds in Zone IV. Inspection protocol after any wind event exceeding 60 mph must include a professional visit within 30 days: lifted shingle tabs may be wind-sealed back down by heat and sun, giving the appearance of intact shingles, while the adhesive integrity has been compromised and the shingles will lift again in the next wind event. In the attic, confirm hurricane clips or straps connect every rafter to the top plate of the wall -- these should be visible as metal connector plates at each rafter end. Missing or corroded straps represent a structural uplift vulnerability and require contractor evaluation. After any declared hurricane or tropical storm, photograph all roof damage (and lack of visible damage) within 24 hours for insurance documentation. Sealed roof deck (ice-and-water shield over the entire deck rather than just the eaves and valleys) is now required in many wind zones for new construction and re-roofing; if the user is re-roofing in a wind zone, verify local code requirements for this upgrade.

### 4. Very Steep Roof (12:12 pitch or greater)
On a 12:12 pitch roof, the surface angle is 45 degrees. At this angle, walking without fall protection equipment is dangerous even for experienced roofers. For homeowners, all inspection is ground-only -- no ladder work other than to inspect gutters at the eave. Gutter cleaning on very steep roofs may require professional service because safely positioning a ladder at the gutter line is complicated by the steep fascia angle. When obtaining professional roofing bids on steep roofs, expect a 20-40% labor premium over standard (4:12-7:12) pitch pricing, reflecting the increased time, fall protection equipment requirements, and safety complexity. For users in areas with steep roofs, recommend gutter guards more strongly because the cleaning difficulty means that less-frequent cleaning leads to more overflowing and damage.

### 5. Wood Shake or Shingle Roofs
Wood shake and shingle roofs require specific maintenance not applicable to other systems. In humid climates (Pacific Northwest, Southeast, Great Lakes), moss, lichen, and algae growth on wood roofs is nearly universal and must be actively managed. Annual treatment with zinc sulfate solution (applied by sprayer in dry conditions and left to weather in) inhibits biological growth. Installing zinc strips at the ridge (2-4 inch wide galvanized or zinc metal strips) allows zinc to leach down the roof with rain, providing continuous biological suppression -- this is the most effective long-term passive treatment. Wood roofs require airflow under the shakes to dry after rain: roofs with no gap between the shakes and the solid decking (or those with blocked airflow due to debris accumulation) suffer significantly accelerated rot from the underside. Check that the gaps between shakes have not closed from expansion/swelling -- gaps less than 1/4 inch need trimming or individual shake replacement. Never pressure-wash a wood roof -- the high-pressure water drives moisture deep into the wood grain and removes natural oils, accelerating cracking and splitting. Use only low-pressure soft washing with a moss treatment solution.

### 6. Copper or Premium Metal Gutters
Copper gutters are a 50-100 year system that require specific care distinctions from aluminum. Never use dissimilar metal fasteners (steel or aluminum screws) with copper gutters -- galvanic corrosion at the contact point will destroy the screw and eventually the gutter wall. Use copper or stainless steel screws only. The natural patina development (green verdigris) on copper is protective and should not be cleaned off -- it is not corrosion in the harmful sense. Copper gutters can be cleaned with the same techniques as aluminum, but avoid any abrasive tools that scratch the surface. Downspout connections to aluminum underground drains require an insulating coupler or rubber transition fitting to prevent galvanic corrosion at the dissimilar metal joint.

### 7. Home with No Gutters -- Evaluating Whether to Install
Some homes intentionally have no gutters (wide overhangs in arid climates, some architectural styles) and some homes lack gutters simply due to deferred maintenance. Evaluate whether gutters are necessary by looking for these damage indicators: soil erosion and splash-back marking along the foundation drip line, efflorescence or moisture staining on the foundation masonry, landscape washout from concentrated drip-line discharge, and water staining or mold on siding in the splash zone. If none of these indicators are present and the home is in a low-rainfall climate, no gutters may be the correct choice. If indicators are present, gutter installation is justified. Installation cost ranges: sectional K-style aluminum, $5-15 per linear foot; seamless K-style aluminum (rolled on-site), $8-20 per linear foot; copper half-round (premium), $25-50 per linear foot. Half-round profiles require different hangers (exposed spike-and-ferrule or rounded brackets) and pair with round downspouts -- they have better self-cleaning characteristics than K-style because debris does not accumulate in corners.

### 8. Asphalt Roof with Algae Streaks (Dark Staining)
The dark gray-to-black streaks that appear on north-facing and shaded roof slopes are almost always Gloeocapsa magma, a blue-green algae bacteria that feeds on the limestone filler in asphalt shingles. This is primarily cosmetic but the moisture conditions it indicates are favorable to moss colonization, which causes actual physical shingle damage. Cleaning method: 50/50 solution of liquid sodium hypochlorite (pool chlorine, not laundry bleach which has additives) and water, applied with a low-pressure garden sprayer, left for 15-20 minutes, then rinsed with low-pressure water. Never pressure-wash -- it removes granules. The streaks will lighten significantly within 24-48 hours. Algae-resistant shingles contain copper granules that provide approximately 10 years of protection; after that point, the copper granules have eroded from the surface and algae returns. For long-term prevention after cleaning, install zinc strips at the ridge.

---

## Example

**Input:** "My roof is about 18 years old, architectural asphalt shingles, I'm in the Chicago area with lots of big oak trees close to the house. I've been seeing quite a few granules in my gutters when I clean them, and I think I noticed some dark streaks on the north side of the roof. How do I take care of it and how much longer will it last?"

**Output:**

## Roof and Gutter Maintenance Plan

**Roof:** Architectural/dimensional asphalt shingles, approximately 18 years old
**Expected Lifespan:** 25-30 years
**Estimated Remaining Life:** 7-12 years -- however, significant granule accumulation is a wear signal that narrows this estimate toward the lower end of the range; see condition assessment below
**Roof Pitch:** Not specified (assumed moderate, 5:12-7:12 -- confirm for any steep-pitch adjustments)
**Climate Region:** Chicago area -- freeze-thaw zone (USDA Zone 5-6), ice dam risk, moderate wind exposure, cold winters with significant snow load
**Gutters:** Not specified -- assumed seamless or sectional aluminum K-style (most common Midwest construction)
**Tree Coverage:** Heavy -- large oak trees close to the house
**Known Symptoms:** Significant granule accumulation in gutters; dark streaks on north-facing slope (Gloeocapsa magma algae)

---

### Lifespan and Condition Summary

| Factor | Status | Impact |
|--------|--------|--------|
| Age vs. expected lifespan | 18 of 25-30 years (60-72%) | Moderate -- entering the monitoring phase |
| Granule loss | Significant accumulation reported | High concern -- granules are the UV protection layer; their loss accelerates shingle degradation |
| Shingle condition | Unknown (no cupping or cracking reported) | Moderate -- professional inspection needed to confirm |
| Algae streaking | Present on north slope | Low immediate concern -- cosmetic, but indicates moisture conditions favorable to moss |
| Flashing condition | Unknown | Moderate -- pipe boots on an 18-year roof are approaching or past their typical replacement window |
| Attic condition | Not checked | Unknown -- strongly recommend one attic inspection given the age and climate |

**Overall Assessment: Monitor Closely -- Annual Professional Inspection Required, Begin Replacement Budget Planning**

---

### Inspection Schedule

| Inspection Type | Frequency | Next Due | DIY Cost | Professional Cost |
|----------------|-----------|----------|----------|------------------|
| Ground-level visual (binoculars) | 2x/year + after any storm above 50 mph | Next: April (spring check) | $0 | N/A |
| Ladder gutter inspection | With each gutter cleaning | Included below | $0 | N/A |
| Professional roof inspection | Annually (roof is over 15 years old) | Schedule within 60 days | N/A | $150-400 |
| Gutter cleaning | 4x/year (heavy oak coverage) | March, June, September, November | $0 + 2-3 hrs per session | $175-325 per visit |

**Note on the professional inspection:** With significant granule accumulation already reported, do not skip this. An inspector can walk specific areas (valleys, south slope, any spots below oak limb contact zones) and give you a quantified assessment of remaining shingle thickness using a granule loss scale. This will either confirm your 7-12 year estimate or tighten it to a 5-8 year window, which changes your budgeting timeline.

---

### Ground-Level Inspection Checklist

Complete in April (post-winter) and October (pre-winter). Use 8x or 10x binoculars from 20-40 feet away, viewing all four elevations.

**Shingles and Roof Surface:**
- [ ] Missing shingles -- gaps exposing felt underlayment or bare wood decking
- [ ] Cracked shingles -- fractures across the shingle face (more common after Midwest freeze-thaw cycling)
- [ ] Cupping -- shingle edges turning upward (sign of moisture stress and adhesion loss)
- [ ] Clawing -- shingle middles lifting with edges flat (adhesion failure, common in older architectural shingles)
- [ ] Granule loss patches -- visibly lighter areas where granules have worn away, especially on south and west slopes
- [ ] Branch impact damage -- any areas where oak limbs have contacted the roof, leaving physical gouges or lifted tabs
- [ ] Oak leaf accumulation on the roof surface -- leaves that remain wet on the surface accelerate shingle degradation and hold moisture against the surface
- [ ] Algae/moss status on north slope -- note whether the current streaking has thickened or whether moss (raised, green, three-dimensional growth) has begun to develop
- [ ] Ridge cap condition -- lifted or cracked ridge cap shingles along the peak
- [ ] Roof line straightness -- viewed from the street, the ridge should be laser-straight; any waviness or sag indicates potential decking issues

**Flashing (critical given the roof's age):**
- [ ] Pipe boot flashings -- look for rubber boots that are cracked, separated from the pipe, or misshapen; on an 18-year roof, this is the highest-probability active leak source
- [ ] Chimney flashing -- if applicable, check for separation at the counter-flashing mortar joint or rust
- [ ] Valley flashing -- the V-shaped channels where roof planes meet; check for rust, debris accumulation, or distortion
- [ ] Any roof-to-wall junctions (dormers, additions) -- step flashing at these transitions should be tight and rust-free

**Gutters and Drainage:**
- [ ] No standing water in gutters 24 hours after rain (slope is correct)
- [ ] Gutters tight to fascia -- no separation or sagging sections
- [ ] Downspouts clear and discharging at least 4-6 feet from foundation -- critical in Chicago freeze-thaw climate where pooled foundation water freezes and causes cracking
- [ ] No bird or squirrel nesting at downspout tops -- oak trees bring heavy wildlife activity
- [ ] Gutter guards (if present) -- clear of oak pollen and debris on mesh surface

**Attic (inspect once this season with a flashlight):**
- [ ] No daylight visible through roof sheathing
- [ ] No water stains or drip marks on rafters or decking
- [ ] No mold or mildew (black, green, or white growth) on sheathing -- Chicago winters create significant condensation risk in under-ventilated attics
- [ ] Soffit vents visible and unblocked from the inside (use a flashlight to confirm airway is open at each rafter bay)
- [ ] Insulation depth at attic floor -- should be approximately 14-16 inches of blown insulation (R-49); inadequate insulation increases ice dam risk

---

### Addressing the Algae Streaks (North Slope)

The dark streaking you see is almost certainly Gloeocapsa magma, a bacteria that is extremely common on north-facing and shaded slopes in the Chicago
