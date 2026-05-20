---
name: three-d-printing-guide
description: |
  Comprehensive 3D printing guide covering printer selection between FDM and resin technologies, 3D modeling in TinkerCAD, Fusion 360, and Blender, slicing with Cura and PrusaSlicer, material properties for PLA, PETG, ABS, and TPU, troubleshooting common print issues, and post-processing techniques. Use when the user asks about three d printing guide or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "guide step-by-step guide"
  category: "hobbies-crafts"
  subcategory: "guide"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Three D Printing Guide

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to three d printing guide.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on three d printing guide
- User asks about three d printing guide best practices or techniques
- User wants a structured approach to three d printing guide

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of three d printing guide

## Questions to Ask First

Before providing guidance, establish the user's situation:

1. What do you want to print? (Prototypes, miniatures, functional parts, art, cosplay)
2. Do you already own a printer? If so, which model?
3. What is your budget for a printer?
4. What is your experience level with 3D printing?
5. Do you have 3D modeling experience?
6. What materials do you plan to use?
7. What print quality do you need? (Draft, standard, high detail)
8. What size parts do you need to print?
9. Do you have a ventilated workspace?
10. Are you printing for personal use or to sell?

## Printer Selection

### FDM vs. Resin Comparison

```
                    | FDM (Filament)      | RESIN (SLA/MSLA)
--------------------|--------------------|-----------------------
How it works        | Melts plastic       | UV-cures liquid resin
                    | filament layer      | layer by layer
                    | by layer            |
Detail resolution   | Good (0.1-0.3mm)   | Excellent (0.01-0.05mm)
Print size          | Large (220mm+)     | Small-Medium (130-200mm)
Materials           | Many options        | Fewer, specialized
Material cost       | $15-$35/kg         | $25-$60/liter
Post-processing     | Minimal            | Wash + cure required
Strength            | Good-Excellent     | Moderate (brittle)
Smell/ventilation   | Low (PLA)          | Strong (requires ventilation)
Safety              | Generally safe     | Resin is toxic - gloves required
Noise               | Moderate           | Quiet
Maintenance         | Moderate           | Higher (resin is messy)
Best for            | Functional parts,  | Miniatures, jewelry,
                    | enclosures, proto  | dental, high-detail

CHOOSE FDM IF:
  - You're a beginner
  - You want functional, strong parts
  - You print large objects
  - You want low maintenance and safety hassle
  - Budget is a primary concern

CHOOSE RESIN IF:
  - You need extreme detail (miniatures, jewelry)
  - You have a ventilated workspace
  - You're comfortable with chemical handling
  - Parts are small to medium size
  - Surface finish is critical
```

### Recommended FDM Printers by Budget

```
BUDGET ($150-$300):
  Bambu Lab A1 Mini:    $200, excellent quality, small build volume
  Creality Ender-3 V3:  $200, large community, good learning printer
  Anycubic Kobra 3:     $250, auto-leveling, reliable

MID-RANGE ($300-$700):
  Bambu Lab A1:         $400, multi-color capable, fast
  Bambu Lab P1S:        $600, enclosed, fast, excellent
  Prusa MK4:            $600-$800, gold standard reliability

ADVANCED ($700+):
  Bambu Lab X1 Carbon:  $1,100, multi-material, enclosed, top-tier
  Prusa XL:             $1,600+, large format, tool-changer
  Voron (DIY):          $600-$1,500 (kit), extreme speed, customizable

LARGE FORMAT:
  Creality K1 Max:      $600, 300x300x300mm
  Bambu Lab X1E:        $1,500, engineering-grade, enclosed
```

### Recommended Resin Printers

```
BUDGET ($150-$300):
  Elegoo Mars 4 Ultra:  $200, 7" 9K screen, excellent starter
  Anycubic Photon M3:   $200, reliable, good community
  Phrozen Sonic Mini 8K:$300, highest resolution in budget class

MID-RANGE ($300-$700):
  Elegoo Saturn 3:      $400, larger build plate, excellent detail
  Phrozen Sonic Mega:   $500, large build volume

ADVANCED ($700+):
  Formlabs Form 4:      $3,500+, professional-grade, easiest workflow
  Prusa SL1S Speed:     $1,600, speed + quality
```

## 3D Modeling

### Software Options

```
TINKERCAD (Beginner):
  Cost: Free (web-based)
  Learning curve: Very easy
  Best for: Simple models, beginners, education
  Limitations: No complex curves or parametric design
  Use when: You need basic shapes combined together

FUSION 360 (Intermediate-Advanced):
  Cost: Free for personal use
  Learning curve: Moderate-steep
  Best for: Engineering parts, parametric design, assemblies
  Features: Parametric modeling, simulation, CAM, technical drawings
  Use when: You need precise, functional parts with exact dimensions

BLENDER (Intermediate-Advanced):
  Cost: Free, open-source
  Learning curve: Steep
  Best for: Organic shapes, artistic models, sculpting, characters
  Features: Sculpting, mesh modeling, animation, rendering
  Use when: You need artistic or organic shapes

OPENSCAD (For Programmers):
  Cost: Free, open-source
  Learning curve: Moderate (if you can code)
  Best for: Parametric designs defined by code
  Use when: You want designs that can be easily parameterized

SHAPR3D (Mobile/Tablet):
  Cost: Free limited / $25 month
  Learning curve: Easy-moderate
  Best for: iPad users, quick concept modeling
```

### Modeling for 3D Printing Best Practices

```
DESIGN RULES:
  1. Minimum wall thickness: 1.2mm FDM, 0.5mm resin
  2. Minimum feature size: 0.8mm FDM, 0.3mm resin
  3. Avoid overhangs greater than 45 degrees (or add supports)
  4. Design for layer orientation (strongest along X/Y, weakest Z)
  5. Add fillets/chamfers to reduce stress concentration
  6. Ensure model is watertight (no holes in mesh)
  7. Avoid very thin horizontal features (may not print reliably)
  8. Design snap-fits with 0.2-0.3mm tolerance
  9. Screw holes: Design 0.1-0.2mm smaller than target (plastic is flexible)
  10. Test-print small sections before committing to full prints

TOLERANCES:
  Press-fit hole:       Design 0.1mm smaller than shaft
  Sliding fit:          Design 0.2-0.3mm larger
  Loose fit:            Design 0.4-0.5mm larger
  Thread inserts:       Follow manufacturer specifications

  These vary by printer and material - always test with your setup

FILE FORMATS:
  STL: Universal, most common
  3MF: Better than STL (supports color, materials, metadata)
  OBJ: Good for multi-material models
  STEP: Parametric, best for engineering collaboration
```

## Slicing

### Slicer Software

```
CURA (by UltiMaker):
  Cost: Free
  Compatibility: Most FDM printers
  Features: Extensive settings, marketplace plugins, tree supports
  Best for: Most users, especially Creality/Anycubic printers

PRUSASLICER:
  Cost: Free, open-source
  Compatibility: Most FDM printers (not just Prusa)
  Features: Organic supports, paint-on supports, variable layer height
  Best for: Prusa owners, advanced settings, organic supports

BAMBU STUDIO:
  Cost: Free
  Compatibility: Bambu Lab printers (and generic printers)
  Features: Based on PrusaSlicer, multi-color support
  Best for: Bambu Lab printer owners

ORCASLICER:
  Cost: Free, open-source
  Compatibility: Most FDM printers
  Features: Fork of Bambu Studio, excellent community
  Best for: Users wanting cutting-edge features

CHITUBOX / LYCHEE (Resin):
  Cost: Free basic / $24-$40 premium
  For: Resin printer slicing
  Features: Auto-support, hollow models, drain holes
```

### Key Slicer Settings Explained

```
LAYER HEIGHT:
  0.08-0.12mm: High detail (slow, smooth surfaces)
  0.16-0.20mm: Standard quality (good balance)
  0.24-0.32mm: Draft quality (fast, visible layers)
  Rule: Layer height should be 25-75% of nozzle diameter

INFILL:
  Percentage: How solid the interior is
    0-10%: Decorative items, display models
    15-20%: Standard prints, general use
    25-40%: Functional parts, some strength needed
    50-100%: Maximum strength, structural parts

  Pattern:
    Grid: Good all-around
    Gyroid: Best strength-to-weight ratio
    Cubic: Good strength in all directions
    Lightning: Fastest, minimum material (decorative only)

WALL COUNT (PERIMETERS):
  2 walls: Light/decorative prints
  3-4 walls: Standard strength
  5+ walls: High strength (more walls = more strength than more infill)

PRINT SPEED:
  40-60 mm/s: Standard quality
  60-100 mm/s: Fast (modern printers handle this well)
  100-300 mm/s: High-speed printers (Bambu, Voron)
  Reduce speed for: First layer, small details, overhangs

TEMPERATURE:
  Varies by material (see material section below)
  First layer: +5-10C above normal for better adhesion

SUPPORTS:
  When needed: Overhangs over 45-60 degrees, bridges over 50mm
  Types:
    Normal/linear: Easier to remove, wastes material
    Tree supports: Less material, better surface finish
    Organic supports: Best surface finish (PrusaSlicer, OrcaSlicer)
  Support interface: Enable for cleaner removal (1-3 layers)

ADHESION:
  Skirt: Outline around print (primes nozzle, no adhesion)
  Brim: Extends first layer outward (improves adhesion for tall/thin prints)
  Raft: Full platform under print (last resort, wastes material)
```

## Material Properties

### Material Comparison Table

```
           | PLA        | PETG       | ABS        | TPU        | ASA
-----------|-----------|-----------|-----------|-----------|----------
Nozzle Temp| 190-220C  | 220-250C  | 230-260C  | 210-230C  | 240-260C
Bed Temp   | 50-60C    | 70-85C    | 100-110C  | 40-60C    | 90-110C
Enclosure  | No        | No        | YES       | No        | YES
Strength   | Medium    | High      | High      | Flexible  | High
Flexibility| Rigid     | Slightly  | Slightly  | Very      | Slightly
UV Resist  | Poor      | Good      | Poor      | Good      | Excellent
Heat Resist| Low (60C) | Med (80C) | Med (100C)| Low (60C) | Med (95C)
Ease       | Easiest   | Easy      | Difficult | Moderate  | Difficult
Smell      | Minimal   | Minimal   | Strong    | Minimal   | Moderate
Food Safe  | *PLA+     | *PETG     | No        | No        | No
Outdoor    | No        | Yes       | No        | Yes       | Yes
Cost/kg    | $15-$25   | $18-$30   | $18-$28   | $20-$35   | $20-$35

* Food safety requires food-safe filament specifically + stainless nozzle

WHEN TO USE EACH:
  PLA:  Default choice. Decorative items, prototypes, low-stress parts
  PETG: Anything needing strength + heat resistance. Outdoor-okay parts
  ABS:  High-heat applications, professional prototypes (needs enclosure)
  TPU:  Phone cases, bumpers, gaskets, anything that needs to flex
  ASA:  Outdoor functional parts (UV stable version of ABS)

SPECIALTY MATERIALS:
  Nylon (PA): Very strong, flexible, abrasion-resistant (needs dry box)
  Polycarbonate: Extremely strong, high heat resistance (hard to print)
  Carbon fiber filled: Stiff, lightweight (wears brass nozzles - use hardened)
  Wood fill PLA: Contains wood particles, sandable, natural look
  Silk PLA: Shiny, metallic appearance, slightly weaker than standard PLA
```

### Material Storage

```
MOISTURE-SENSITIVE MATERIALS (must be kept dry):
  Very sensitive: Nylon, TPU, PETG, PC
  Moderately sensitive: ABS, ASA
  Less sensitive: PLA (but still degrades over time)

STORAGE SOLUTIONS:
  1. Vacuum-sealed bags with desiccant (silica gel)
  2. Airtight containers/bins with desiccant
  3. Dry box with active desiccant or dehumidifier
  4. Filament dryer (Sunlu, eSun, Polydryer): $30-$60

SIGNS OF WET FILAMENT:
  - Popping/sizzling sounds during printing
  - Stringing and poor surface quality
  - Weak layer adhesion
  - Rough, pitted surface finish
  - Bubbles in extruded filament

DRYING TEMPERATURES:
  PLA: 45C for 4-6 hours
  PETG: 65C for 4-6 hours
  ABS: 80C for 4-6 hours
  Nylon: 80C for 8-12 hours
  TPU: 50C for 4-6 hours
```

## Troubleshooting

### Common Print Issues

```
PROBLEM: First Layer Not Sticking
  Causes and fixes:
  1. Bed not level → Auto-level or manual tramming
  2. Nozzle too far from bed → Lower Z-offset (closer to bed)
  3. Bed not clean → Clean with IPA (isopropyl alcohol)
  4. Bed temp too low → Increase by 5-10C
  5. First layer too fast → Slow to 20-30 mm/s
  6. No adhesion aid → Apply glue stick or hairspray (PVA)

PROBLEM: Stringing (Thin strings between travel moves)
  Causes and fixes:
  1. Retraction too low → Increase retraction distance (1-3mm direct drive, 4-7mm Bowden)
  2. Temperature too high → Decrease by 5-10C
  3. Travel speed too slow → Increase travel speed
  4. Wet filament → Dry the filament
  5. Retraction speed → Increase to 30-50 mm/s

PROBLEM: Warping (Corners lifting from bed)
  Causes and fixes:
  1. Bed temp too low → Increase bed temperature
  2. Drafts hitting print → Use enclosure or block drafts
  3. First layer adhesion → Wider brim, glue stick, cleaner bed
  4. Material choice → PLA warps least; ABS warps most
  5. Part design → Add mouse ears (small discs) at corners

PROBLEM: Layer Shifting (Layers offset horizontally)
  Causes and fixes:
  1. Belt loose → Tighten belts (should twang like a guitar string)
  2. Speed too fast → Reduce print speed
  3. Motor overheating → Reduce motor current or add cooling
  4. Grub screws loose → Tighten set screws on pulleys
  5. Print detached → Improve bed adhesion

PROBLEM: Under-Extrusion (Gaps, missing layers)
  Causes and fixes:
  1. Clogged nozzle → Cold pull or nozzle replacement
  2. Temperature too low → Increase by 5-10C
  3. Print speed too fast → Reduce speed
  4. Filament slipping → Check extruder tension, check for worn gear
  5. Partially clogged PTFE tube → Replace tube

PROBLEM: Over-Extrusion (Blobby, rough surfaces)
  Causes and fixes:
  1. Flow rate too high → Calibrate e-steps, reduce flow to 95%
  2. Nozzle too close to bed → Increase Z-offset slightly
  3. Temperature too high → Decrease by 5C

PROBLEM: Elephant's Foot (First layers bulge out)
  Causes and fixes:
  1. Bed too hot → Reduce bed temp by 5C after first few layers
  2. Nozzle too close → Slightly raise Z-offset
  3. First layer flow too high → Reduce first layer flow rate

PROBLEM: Z-Seam (Visible line running up the print)
  Fixes:
  1. Set seam position to "aligned" (consistent location, easier to post-process)
  2. Set to "sharpest corner" (hides seam at corners)
  3. Set to "random" (scattered dots instead of line)
  4. Linear advance/pressure advance calibration
```

## Post-Processing

### FDM Post-Processing

```
SANDING:
  Start at 120-150 grit, progress to 220, 400, 600, 800
  Wet sanding at higher grits for smoother finish
  Fill layer lines with filler primer (automotive) between sanding passes
  Works best with PLA and ABS

PAINTING:
  1. Sand surface smooth (220-400 grit)
  2. Apply filler primer (2-3 coats, sanding between)
  3. Apply base coat (spray paint or airbrush)
  4. Apply color coats
  5. Apply clear coat for durability

VAPOR SMOOTHING (ABS/ASA only):
  Expose ABS print to acetone vapor
  Smooths layer lines, creates glossy surface
  WARNING: Acetone is flammable - proper ventilation required
  Method: Sealed container with acetone-soaked paper towel, check every 10 min

HEAT INSERTS:
  Brass threaded inserts (M2.5, M3, M4) pressed in with soldering iron
  Creates strong, reusable threaded holes in printed parts
  Use knurled inserts designed for plastics
  Temperature: 200-250C depending on material

ASSEMBLY:
  Superglue (CA glue): Instant bond, works on most materials
  Epoxy: Strongest bond, gap-filling
  Friction welding: Push filament into joint with rotary tool
  Solvent welding: Acetone for ABS, MEK for PETG (use sparingly)
```

### Resin Post-Processing

```
REQUIRED STEPS:
  1. Remove print from build plate (carefully)
  2. Wash in IPA or water (water-washable resin) for 2-5 minutes
  3. Remove supports before or after curing (before is easier, after is stronger)
  4. UV cure: 5-15 minutes in curing station or sunlight
  5. Sand any support marks

WASH STATIONS:
  Elegoo Mercury Plus: $35-$50 (wash and cure in one)
  Anycubic Wash & Cure: $40-$60
  DIY: Container with IPA + UV lamp or sunlight

SAFETY:
  ALWAYS wear nitrile gloves when handling uncured resin
  Work in ventilated area
  Dispose of resin waste properly (cure before disposal)
  IPA waste must be evaporated or properly disposed
  Never pour uncured resin down the drain
```

## Common Mistakes to Avoid

1. Not leveling the bed properly (most print failures start here)
2. Printing too fast before understanding your printer's capabilities
3. Using default slicer settings for every material (each material needs tuning)
4. Not storing filament properly (moisture destroys print quality)
5. Skipping calibration (e-steps, flow rate, temperature tower, retraction test)
6. Ignoring model orientation (strength and supports depend on it)
7. Not using supports when needed (or using too many when not needed)
8. Neglecting maintenance (clean nozzle, lubricate rails, tighten belts)
9. Printing functional parts in PLA that will be exposed to heat or sun
10. Not doing a test fit before committing to a 12-hour print


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Three D Printing Guide deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with three d printing guide for a mid-size project."

**Output:** A complete three d printing guide framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.
