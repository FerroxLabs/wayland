---
name: metalworking-intro
description: |
  Comprehensive introductory guide to metalworking covering welding types including MIG, TIG, and stick, essential safety equipment, basic fabrication techniques, cutting and grinding tools, metal types and properties, project ideas, and shop setup requirements. Use when the user asks about metalworking intro or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "guide step-by-step beginner-friendly"
  category: "hobbies-crafts"
  subcategory: "making-building"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Metalworking Intro

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to metalworking intro.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on metalworking intro
- User asks about metalworking intro best practices or techniques
- User wants a structured approach to metalworking intro

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of metalworking intro

## Questions to Ask First

Before providing guidance, establish the metalworker's situation:

1. What type of metalwork interests you? (Welding, fabrication, blacksmithing, machining)
2. What is your experience level?
3. What projects do you want to build?
4. What is your budget for equipment?
5. What is your workspace? (Garage, outdoor, dedicated shop)
6. Do you have electrical service for welding? (120V vs. 240V)
7. What metals will you work with? (Mild steel, stainless, aluminum)
8. Do you have any safety training?
9. What tools do you currently own?
10. Are you interested in hobby or professional metalwork?

## Welding Types

### Welding Process Comparison

```
              | MIG (GMAW)     | TIG (GTAW)      | STICK (SMAW)
--------------|----------------|-----------------|----------------
Difficulty    | Easiest        | Hardest         | Moderate
Speed         | Fast           | Slow            | Moderate
Appearance    | Good           | Excellent       | Rough (needs grinding)
Metals        | Steel, stainless,| All metals     | Steel, stainless,
              | aluminum       |                 | cast iron
Thickness     | Thin to medium | Thin to medium  | Medium to thick
Portability   | Low (gas tank) | Low (gas tank)  | High (no gas needed)
Outdoor use   | Poor (wind)    | Poor (wind)     | Excellent
Cost to start | $400-$1,500    | $500-$2,000     | $200-$800
Best for      | Beginners, fab | Precision, thin,| Outdoor, structural
              | work, auto     | artistic        | repair, heavy steel

CHOOSE MIG IF:
  - You're a beginner wanting the fastest learning curve
  - You work mostly with mild steel
  - You want speed and efficiency
  - You do automotive or fabrication work

CHOOSE TIG IF:
  - You want the best-looking welds
  - You work with thin materials or exotic metals
  - You value precision over speed
  - You're building art, furniture, or bikes

CHOOSE STICK IF:
  - You work outdoors frequently
  - You weld thick structural steel
  - Budget is limited
  - You need portability
  - You're doing farm/ranch repairs
```

### MIG Welding Basics

```
EQUIPMENT:
  MIG welder (140A for hobby, 200A+ for serious work)
  Shielding gas: 75% Argon / 25% CO2 (C25) for steel
                 100% Argon for aluminum
  Wire: ER70S-6 (0.030" for thin, 0.035" for thicker steel)
  Contact tips, nozzle, liner (consumables)

SETTINGS GUIDE (Mild Steel):
  Material    | Wire Size | Voltage | Wire Speed | Gas Flow
  ------------|-----------|---------|------------|----------
  18 gauge    | .030"     | 17-18V  | 180-220 IPM| 20 CFH
  16 gauge    | .030"     | 18-19V  | 220-280 IPM| 20 CFH
  14 gauge    | .030"     | 19-20V  | 280-350 IPM| 25 CFH
  3/16"       | .035"     | 20-22V  | 300-400 IPM| 25 CFH
  1/4"        | .035"     | 22-24V  | 350-450 IPM| 25 CFH

TECHNIQUE:
  - Push angle: 5-15 degrees from vertical (push for flat, less spatter)
  - Travel speed: Consistent, watch the puddle not the arc
  - Stick-out: 3/8" to 1/2" wire extension from contact tip
  - Gun-to-work distance: 3/8" to 1/2"
  - Overlap passes by 30-50% for multi-pass welds
  - Listen: Good weld sounds like frying bacon, not popping or crackling

COMMON MIG PROBLEMS:
  Problem         | Cause                  | Fix
  ----------------|------------------------|---------------------------
  Porosity        | Wind, dirty metal, gas | Shield from wind, clean, check gas
  Spatter         | Voltage too high/low   | Adjust voltage, check ground
  Burn-through    | Too much heat          | Reduce settings, move faster
  Lack of fusion  | Too cold, too fast     | Increase settings, slow down
  Bird-nesting    | Wire feed issue        | Check liner, tension, tip
```

### TIG Welding Basics

```
EQUIPMENT:
  TIG welder with HF start (AC/DC for aluminum capability)
  Tungsten electrodes: 2% Lanthanated (general purpose, gray band)
  Shielding gas: 100% Argon (15-20 CFH)
  Filler rod: ER70S-2 (steel), ER308L (stainless), ER4043 (aluminum)
  Foot pedal or fingertip control for amperage

TECHNIQUE:
  - Hold torch at 15-20 degree angle from vertical
  - Point tungsten in direction of travel
  - Maintain 1/8" arc length (tungsten to work distance)
  - Dab filler rod into the leading edge of the puddle
  - Coordinate both hands: torch moves, filler dabs
  - For thin material: Dab-move-dab-move rhythm
  - Use foot pedal to control heat in real-time

TUNGSTEN PREPARATION:
  DC (steel, stainless): Grind to a sharp point (grind lengthwise, not across)
  AC (aluminum): Sharpen to a point, will form a ball during welding
  Never dip tungsten into the puddle (contamination = poor weld)
  If contaminated: Regrind past the contaminated area

AC vs DC:
  DC Negative (DCEN): Steel, stainless, chromoly, copper
  AC: Aluminum, magnesium (AC provides oxide cleaning action)
```

### Stick Welding Basics

```
EQUIPMENT:
  Stick welder (minimum 150A for general purpose)
  Electrodes (rods):
    6013: Easy to use, general purpose, thin to medium
    6011: All-position, deep penetration, dirty metal OK
    7018: Strongest, smoothest, flat/horizontal only
    7014: Easy arc, smooth bead, flat/horizontal

TECHNIQUE:
  - Strike arc like lighting a match (drag start)
  - Maintain 1/8" arc length (electrode to work)
  - Travel angle: 5-15 degrees drag angle
  - Listen for consistent crackling sound
  - Watch the puddle, not the arc (wear proper shade)
  - Chip slag between passes (ALWAYS wear safety glasses for chipping)

AMPERAGE GUIDE:
  Electrode diameter x 1000 = starting amperage (very rough)
  3/32" (2.4mm): 60-90A
  1/8" (3.2mm):  90-130A
  5/32" (4.0mm): 120-160A
  Adjust based on material thickness and position
```

## Safety Equipment

### Required Personal Protective Equipment

```
WELDING HELMET:
  Auto-darkening (shade 9-13, adjustable)
  Shade 10: TIG on thin material
  Shade 11-12: MIG, general welding
  Shade 13: Stick welding, high amperage
  Budget: Lincoln Viking, Hobart, $80-$200
  Premium: Miller Digital Infinity, $250-$400

  WARNING: Never look at an arc without proper eye protection.
  Even brief exposure causes arc eye (painful cornea burn).
  Bystanders need minimum shade 5 safety glasses.

GLOVES:
  MIG: Medium-weight leather gloves (dexterity + protection)
  TIG: Thin leather gloves (maximum dexterity needed)
  Stick: Heavy leather gauntlet gloves
  Grinding: Leather work gloves (NOT welding gloves)

CLOTHING:
  [ ] 100% cotton or leather - NEVER synthetic (melts onto skin)
  [ ] Long sleeves (leather jacket or welding jacket preferred)
  [ ] Leather boots (steel toe recommended, no laces near sparks)
  [ ] Leather apron (for heavy grinding or overhead welding)
  [ ] Welding cap or bandana (protects head from sparks and UV)
  [ ] Button shirt collars (not open neck that catches sparks)
  [ ] No cuffs on pants (catch sparks)

RESPIRATORY:
  Welding fume respirator: 3M 6000 series with P100/OV cartridges
  Minimum: N95 mask for light grinding
  Ventilation: Exhaust fan or fume extractor at welding station
  WARNING: Welding fumes from galvanized steel, stainless steel,
           and certain metals are extremely toxic. ALWAYS ventilate.

HEARING:
  Grinding and cutting generate significant noise
  Ear plugs or over-ear protection when grinding

FIRE SAFETY:
  [ ] Fire extinguisher (ABC type) within arm's reach
  [ ] Welding blanket to protect surroundings from sparks
  [ ] Clear area of flammables (10 ft minimum from welding)
  [ ] Check for fire 30 minutes after welding/grinding
  [ ] Fire watch when welding near combustibles
```

## Basic Fabrication Techniques

### Layout and Measuring

```
TOOLS:
  Tape measure (metal case, 25 ft)
  Combination square (check 90 degrees and 45 degrees)
  Soapstone or silver streak marker
  Scribe (for precision marking on metal)
  Center punch (mark drill locations)
  Angle finder / protractor
  Straight edge (36" or longer)

MEASURING RULES:
  1. Measure twice, cut once (measure three times if expensive)
  2. Always reference from the same edge
  3. Use a scribe for precision, soapstone for visibility
  4. Center punch all drill locations before drilling
  5. Account for kerf (material removed by cutting tool)
  6. Mark waste side with X to avoid cutting wrong piece
```

### Cutting Tools

```
ANGLE GRINDER (Most Versatile Tool):
  Sizes: 4.5" (most common for hobby), 7" or 9" for heavy work
  Discs:
    Cut-off disc (1mm): Cutting metal
    Grinding disc (6mm): Removing material, beveling
    Flap disc (40-120 grit): Smoothing, blending, finishing
    Wire wheel: Cleaning rust and paint

BAND SAW (Horizontal):
  Best for: Straight cuts on bar stock, tube, angle
  Accurate, clean cuts with minimal material waste

CHOP SAW (ABRASIVE CUT-OFF):
  Fast cuts on steel
  Less precise than band saw
  Generates sparks and noise (full PPE required)

PLASMA CUTTER:
  Best for: Freehand cutting, curved cuts, sheet metal
  Clean cuts, minimal heat-affected zone
  Cost: $400-$1,500 for hobby-level
  Requires compressed air (30-60 CFH at 60-80 PSI)

OXY-ACETYLENE TORCH:
  Cutting, heating, brazing, welding (multi-purpose)
  Thicker steel capability than plasma
  Also used for bending and heat treatment
  Cost: $300-$500 for tank set and torch kit
  Ongoing cost: Tank refills

HAND TOOLS:
  Hacksaw: Slow but precise, no electricity needed
  Tin snips: Sheet metal up to 18 gauge
  Bolt cutters: Rod and small stock
```

### Metal Types and Properties

```
MILD STEEL (A36, 1018):
  Most common, easiest to weld, affordable
  Magnetic, rusts without coating
  Available as: Sheet, plate, tube, angle, flat bar, round bar
  Finish: Paint, powder coat, galvanize, or oil/wax

STAINLESS STEEL (304, 316):
  Corrosion resistant, more expensive
  Harder to weld (use 308L filler, 316L for 316)
  Use: Food equipment, outdoor furniture, architectural
  Heat management critical (distorts easily)

ALUMINUM (6061, 5052):
  Lightweight, corrosion resistant
  Requires AC TIG or spool gun on MIG
  Different filler rods than steel
  Cannot be as easily bent or forged
  Use: Lightweight structures, marine, automotive

CHROMOLY (4130):
  High strength-to-weight ratio
  Weldable with proper technique and filler (ER80S-D2 or ER70S-2)
  Use: Roll cages, bicycle frames, aircraft
  Requires post-weld stress relief for critical applications

CAST IRON:
  Weldable with special rods (nickel-based)
  Must pre-heat and cool slowly
  Very brittle
  Use: Repair of castings, engine blocks, antique restoration
```

## Project Ideas

### Beginner Projects

```
1. PRACTICE WELDS ON SCRAP
   Material: Mild steel plate and scraps
   Skills: Running beads, flat position, butt joints, T-joints

2. SIMPLE BRACKET OR SHELF SUPPORT
   Material: Flat bar, angle iron
   Skills: Layout, cutting, 90-degree welding

3. FIREWOOD RACK
   Material: Square tube (1"x1" or 1.5"x1.5")
   Skills: Square cuts, assembly, basic fab

4. WELDING TABLE
   Material: Square tube frame, steel plate top
   Skills: Square frame construction, leveling

5. BOTTLE OPENER
   Material: Flat bar, railroad spike, or rebar
   Skills: Grinding, shaping, simple forge work (optional)
```

### Intermediate Projects

```
6. STEEL WORKBENCH
   Material: Square tube, angle iron, sheet metal
   Skills: Complex layout, multiple joints, leveling

7. TRAILER HITCH ACCESSORIES
   Material: Plate, tube, flat bar
   Skills: Load-bearing welds, precision fitting

8. FIRE PIT
   Material: Sheet steel or steel ring
   Skills: Cutting curves, bending, decorative work

9. STEEL FURNITURE (Table, Chair, Shelf)
   Material: Square and round tube, flat bar
   Skills: Grinding, finishing, mixed materials (wood/metal)

10. GATE OR FENCE PANEL
    Material: Square tube, flat bar, round bar
    Skills: Layout, repetitive accurate fabrication
```

## Shop Setup

### Minimum Shop Requirements

```
SPACE:
  Minimum: 10x12 ft (garage bay)
  Ideal: 20x20 ft or larger
  Requirements:
  [ ] Concrete floor (not wood - fire hazard)
  [ ] Ventilation (exhaust fan minimum, open door)
  [ ] Fire-resistant walls or welding screens
  [ ] Adequate lighting
  [ ] Power: 120V minimum (240V for serious welding)

ELECTRICAL:
  MIG 140A: 120V / 20A circuit
  MIG 200A+: 240V / 30-50A circuit
  TIG: 240V / 50A circuit (most machines)
  Angle grinder: 120V / 15A circuit
  Consider dedicated circuits for welders (no shared circuits)

ESSENTIAL SHOP EQUIPMENT:
  [ ] Welding table (steel top, grounded)
  [ ] Vise (4" minimum jaw, bolted to bench)
  [ ] Angle grinder (4.5")
  [ ] Clamps: Welding C-clamps, locking pliers, bar clamps
  [ ] Welding magnets (hold pieces at 45/90 degrees)
  [ ] Wire brush (stainless for stainless steel)
  [ ] Chipping hammer (for stick welding slag)
  [ ] Fire extinguisher (ABC type, easily accessible)
  [ ] First aid kit (with burn gel)

NICE TO HAVE:
  [ ] Drill press
  [ ] Horizontal band saw
  [ ] Bench grinder
  [ ] Belt sander
  [ ] Plasma cutter
  [ ] Metal brake (sheet bending)
  [ ] English wheel (shaping sheet metal)
```

## Common Mistakes to Avoid

1. Welding on dirty, rusty, or painted metal (clean to bare metal first)
2. Wearing synthetic clothing that can melt onto your skin
3. Welding galvanized steel without extreme ventilation (zinc fumes are toxic)
4. Not wearing proper eye protection for EVERY operation (welding AND grinding)
5. Skipping tack welds and trying to weld a full seam on unfixed parts (warping)
6. Grinding without a face shield (grinding discs can shatter)
7. Welding too fast (not getting proper fusion/penetration)
8. Not checking for square before welding (distortion pulls things out of alignment)
9. Ignoring fire safety (sparks travel far; check the area 30 minutes after welding)
10. Underestimating the cost of consumables (gas, wire, discs, electrodes add up)


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Metalworking Intro deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with metalworking intro for a mid-size project."

**Output:** A complete metalworking intro framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
