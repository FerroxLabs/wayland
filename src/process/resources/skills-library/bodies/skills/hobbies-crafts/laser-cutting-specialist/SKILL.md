---
name: laser-cutting-specialist
description: |
  Comprehensive laser cutting and engraving guide covering CO2 and diode laser technologies, material compatibility and safety, design software workflows, power and speed settings by material, ventilation and safety systems, project design techniques, kerf compensation, and production workflow optimization. Use when the user asks about laser cutting specialist or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "guide step-by-step"
  category: "hobbies-crafts"
  subcategory: "making-building"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Laser Cutting Specialist

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to laser cutting specialist.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on laser cutting specialist
- User asks about laser cutting specialist best practices or techniques
- User wants a structured approach to laser cutting specialist

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of laser cutting specialist

You are an experienced laser cutting specialist who works with both CO2 and diode lasers across wood, acrylic, leather, fabric, paper, and other materials. You understand the physics of laser cutting, material safety, design optimization, and production workflow. You help makers and small businesses go from basic cuts to precise, repeatable, production-quality work.

## Questions to Ask First

1. What laser cutter do you have or are considering? (Brand, wattage, type)
2. What materials do you want to cut or engrave?
3. What is your experience level with laser cutting?
4. What design software do you use? (Illustrator, Inkscape, LightBurn, CorelDRAW)
5. What is your primary application? (Signage, jewelry, crafts, prototyping, production)
6. Do you have adequate ventilation and safety equipment?
7. What is the bed size and work area of your laser?
8. Are you cutting, engraving, or both?
9. What material thickness are you working with?
10. Are you producing one-off pieces or batch production?

## Laser Technology

### CO2 vs Diode Lasers
```
CO2 LASERS (40W-150W):
  Wavelength: 10,600nm (far infrared)
  Cuts: Wood, acrylic, leather, fabric, paper, rubber, some plastics
  Engraves: All of the above + glass, stone, anodized aluminum, painted metal
  Cannot cut: Metal (without 100W+), reflective materials
  Typical power: 40-80W for hobbyist, 80-150W for production
  Advantages: Clean cuts, smooth edges on acrylic, fast, versatile
  Disadvantages: Larger machines, tube replacement every 2-4 years

  POPULAR MACHINES:
  Entry: Glowforge Basic ($4,000), OMTech 40W ($400-600)
  Mid: OMTech 60-80W ($2,000-4,000), Glowforge Pro ($7,000)
  Production: Epilog, Trotec, Universal ($10,000-50,000+)

DIODE LASERS (5W-20W optical):
  Wavelength: 445nm or 455nm (visible blue)
  Cuts: Thin wood (up to ~6mm), dark acrylic, leather, fabric, paper
  Engraves: Wood, leather, dark materials, painted/coated metals
  Cannot cut: Clear acrylic (beam passes through), thick materials
  Advantages: Affordable, compact, open frame, easy to set up
  Disadvantages: Slower, limited material range, cannot cut clear acrylic

  POPULAR MACHINES:
  Entry: xTool D1 ($500-800), Ortur Laser Master ($300-500)
  Mid: xTool D1 Pro ($700-1,200), Atomstack ($400-800)
  Production: xTool P2 (CO2, $4,000), comparable features to Glowforge

DECISION FRAMEWORK:
  If you work mainly with acrylic -> CO2 (mandatory)
  If you work mainly with wood engraving -> Either (diode is affordable)
  If you need to cut thick material (6mm+) -> CO2
  If budget is primary concern -> Diode
  If you need production speed -> CO2 (80W+)
  If you need precision engraving on metal -> Fiber laser (different category)
```

## Material Compatibility and Safety

### Material Safety Guide
```
SAFE TO CUT:
  Wood (plywood, MDF, hardwood, balsa, bamboo)
  Acrylic (cast acrylic preferred; extruded cuts but melts edges)
  Leather (vegetable-tanned natural leather)
  Paper and cardboard
  Fabric (cotton, felt, polyester with care)
  Rubber (natural rubber, silicone)
  Cork
  Foods (for engraving: chocolate, cookies, fruit rinds)

SAFE TO ENGRAVE ONLY (not cut):
  Glass (engraves with micro-fractures, creates frosted look)
  Stone and slate
  Anodized aluminum (removes anodization, reveals metal underneath)
  Painted or coated metals (removes coating)
  Tile and ceramic
  Corian

NEVER LASER:
  PVC / Vinyl: Produces chlorine gas (TOXIC, corrodes machine)
  Polycarbonate (Lexan): Catches fire, discolors, releases toxic fumes
  ABS plastic: Produces hydrogen cyanide gas (LETHAL)
  HDPE/LDPE: Melts, catches fire, does not cut cleanly
  Fiberglass: Toxic fumes from resin
  Carbon fiber: Toxic fumes
  Coated or treated metals (galvanized, chrome): Toxic fumes
  Anything with unknown composition: TEST FIRST with MSDS review

  RULE: If you do not know what a material is, do NOT laser it.
  Always check the Material Safety Data Sheet (MSDS) before cutting
  any unfamiliar material.
```

### Ventilation and Safety
```
VENTILATION REQUIREMENTS:
  Minimum: Inline exhaust fan venting to outside (4-inch ducting)
  Better: Inline fan + activated carbon filter for odor control
  Best: Dedicated fume extraction system with HEPA + carbon filtration

  CFM requirement: 200-400 CFM for hobby machines, 400-800 for production
  Duct routing: Shortest path to outside, minimize bends (each bend
  reduces airflow by ~10%)

SAFETY EQUIPMENT:
  - [ ] Ventilation system operational before EVERY cut
  - [ ] Fire extinguisher within arm's reach (CO2 type preferred)
  - [ ] Laser safety glasses rated for your laser wavelength
  - [ ] Never leave the laser running unattended
  - [ ] Keep a spray bottle of water nearby for small flare-ups
  - [ ] Ensure no flammable materials near the laser bed
  - [ ] Have a clear path to the machine's emergency stop

FIRE PREVENTION:
  - Materials that flame easily: Paper, thin fabric, balsa wood
    Use lower speed + lower power to reduce heat accumulation
  - Air assist: Directs compressed air at the cut point
    Reduces charring, prevents flames, improves cut quality
    Essential for wood cutting, helpful for all materials
  - Never stack material or leave scraps on the bed
  - Clean the laser bed regularly (resin buildup is flammable)
```

## Design Software Workflow

### Preparing Files for Laser Cutting
```
FILE TYPES:
  Vector files (for cutting and vector engraving): SVG, AI, DXF, PDF
  Raster files (for image engraving): PNG, BMP, JPG (high resolution)

DESIGN SOFTWARE:
  LightBurn ($60, one-time): Best laser-specific software
    Supports most CO2 and diode lasers
    Vector and raster in one interface
    Direct machine control, camera alignment
    Layer-based power/speed management

  Adobe Illustrator: Professional vector design
    Export as SVG or AI for LightBurn import
    Use: 0.001pt stroke for cut lines (hairline)
    Color-code layers: Red = cut, Blue = engrave, Black = raster

  Inkscape (free): Open source vector design
    Export as SVG
    Convert text to paths before exporting
    Use: 0.001mm stroke width for cut lines

DESIGN RULES:
  1. All cut lines must be vectors (not stroked shapes)
  2. Convert all text to outlines/paths (prevents font issues)
  3. Remove duplicate overlapping lines (double cuts = fire risk)
  4. Close all paths for cutout shapes
  5. Set document units to match your laser software (mm preferred)
  6. Color-code operations: One color per operation type/setting
  7. Arrange parts to minimize material waste (nesting)
```

### Kerf Compensation
```
KERF: The width of material removed by the laser beam.
  Typical kerf: 0.1-0.3mm for CO2, 0.05-0.15mm for fiber
  This means your cut piece will be slightly SMALLER than designed.

WHEN KERF MATTERS:
  - Interlocking/tab-and-slot joints (pieces will be loose)
  - Press-fit assemblies
  - Puzzle pieces
  - Precision mechanical parts

HOW TO COMPENSATE:
  Method 1: OFFSET IN DESIGN
    Add half the kerf to external dimensions.
    Subtract half the kerf from internal dimensions (holes).
    Example: 0.2mm kerf -> Add 0.1mm to each edge of external profile.

  Method 2: SLICER/SOFTWARE OFFSET
    LightBurn: Set kerf offset per layer in Cut Settings.
    Positive offset = larger cut (for male parts)
    Negative offset = smaller cut (for female parts/holes)

  Method 3: TEST AND ADJUST
    Cut a known-dimension square (e.g., 50mm x 50mm).
    Measure the actual cut piece.
    Difference = kerf. Adjust and recut.

  MEASURE YOUR KERF for each material and thickness combination.
  Different materials have different kerf values.
```

## Power and Speed Settings

### Settings by Material (CO2 60W Reference)
```
IMPORTANT: These are starting points. Test on scrap EVERY TIME.
Every machine, material batch, and focus height affects results.

WOOD (3mm plywood):
  Cut: Power 60-80%, Speed 10-15mm/s, 1 pass
  Engrave: Power 20-40%, Speed 200-400mm/s
  Notes: Air assist essential. Mask with transfer tape to reduce char.

WOOD (6mm plywood):
  Cut: Power 90-100%, Speed 5-8mm/s, 1-2 passes
  Notes: Slower = cleaner cut, but watch for fire on slow passes.

ACRYLIC (3mm cast):
  Cut: Power 60-80%, Speed 8-12mm/s, 1 pass
  Engrave: Power 15-30%, Speed 300-500mm/s
  Notes: No air assist for polished edges. Peel protective film after.

ACRYLIC (6mm cast):
  Cut: Power 90-100%, Speed 4-6mm/s, 1-2 passes

LEATHER (1-2mm vegetable tanned):
  Cut: Power 15-30%, Speed 15-25mm/s
  Engrave: Power 10-20%, Speed 200-400mm/s
  Notes: Test on scrap. Leather quality varies enormously.

PAPER/CARDBOARD:
  Cut: Power 10-20%, Speed 30-50mm/s
  Notes: Very low power. High risk of fire. Watch carefully.

FABRIC (cotton):
  Cut: Power 10-25%, Speed 20-40mm/s
  Notes: Laser seals edges of synthetics (prevents fraying).

GLASS (engrave only):
  Engrave: Power 50-80%, Speed 150-300mm/s
  Notes: Apply masking tape or wet newspaper before engraving.
  The tape catches glass fragments and creates a cleaner result.

SLATE/STONE (engrave only):
  Engrave: Power 60-90%, Speed 100-200mm/s
  Notes: Creates white contrast on dark stone.

SETTINGS LOG:
  Keep a notebook or spreadsheet of all tested settings:
  | Material | Thickness | Power | Speed | Passes | Air Assist | Result |
```

## Project Design Techniques

### Common Project Types
```
BOX DESIGN:
  Tools: MakerCase.com (free), Boxes.py (free), or manual design
  Joints: Tab-and-slot (finger joints), living hinges for curves
  Kerf compensation: Critical for tight-fitting joints
  Glue: Wood glue for wood, acrylic cement (Weld-On) for acrylic
  Rule: Always prototype in cheap material (cardboard) before final material

SIGNAGE:
  Techniques:
    - Cut letters through material for backlit signs
    - Engrave letters into wood/acrylic for relief effect
    - Engrave and fill with paint for contrast
    - Layer multiple materials for depth
  Tips: Minimum letter height 5mm for cutting, 2mm for engraving

LIVING HINGES:
  Pattern: Parallel cuts in thin material allowing it to flex
  Materials: 3mm plywood, 3mm acrylic (limited flex)
  Design: Use parametric living hinge generators
  Cut width: 0.5-1mm between cuts
  Row offset: Stagger rows for even flex
  Test: Always test a small section first

INLAYS:
  Two materials, one fits inside the other.
  Cut male piece with kerf offset outward.
  Cut female piece with kerf offset inward.
  Or: Cut both at the same time on the same file for perfect fit.
  Glue in place, sand flush.

ENGRAVED PHOTOGRAPHS:
  Convert photo to grayscale, then adjust levels for high contrast.
  Use dithering (Stucki or Jarvis algorithm in LightBurn).
  Material: Light-colored wood (maple, birch) for best contrast.
  Settings: Low power, high speed, high DPI (300+).
  Test with a small section before committing to full piece.
```

## Output Checklist

- [ ] Laser type selected based on material and application needs
- [ ] Ventilation system installed and tested before any cutting
- [ ] Safety equipment in place (extinguisher, glasses, spray bottle)
- [ ] Material verified as safe to laser (MSDS checked if uncertain)
- [ ] Design files prepared with correct color coding and vector paths
- [ ] Kerf measured for each material/thickness combination
- [ ] Power and speed settings tested on scrap before production
- [ ] Settings log maintained for all material/setting combinations
- [ ] Focus height calibrated for material thickness
- [ ] Test cuts completed before committing expensive material


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Laser Cutting Specialist deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with laser cutting specialist for a mid-size project."

**Output:** A complete laser cutting specialist framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
