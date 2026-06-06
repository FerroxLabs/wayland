---
name: fdm-printing-beginner-guide
description: |
  Teaches beginners FDM 3D printing fundamentals: slicer software settings
  (layer height, infill percentage, support structures), bed adhesion
  methods, common print failure diagnosis (stringing, warping, layer
  shifting, under-extrusion), and a first-print sequence that builds
  understanding progressively. Use when the user wants to start 3D
  printing, asks about slicer settings, print quality troubleshooting,
  filament selection, or bed adhesion. Do NOT use for resin (SLA/DLP)
  printing, 3D modeling and CAD design, or professional manufacturing
  processes.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "beginner-friendly step-by-step guide checklist"
  category: "hobbies-crafts"
  subcategory: "making-building"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# FDM Printing Beginner Guide

## When to Use

Use this skill when:

- A user explicitly says they are new to 3D printing, just received a printer, or are considering buying their first FDM printer
- A user asks how to configure slicer software settings -- layer height, infill percentage, wall count, print speed, temperature, or retraction
- A user has a failed or poor-quality print and needs diagnostic help (strings, warping, layer shifting, gaps, elephant foot, under-extrusion, or bed adhesion failures)
- A user asks which filament material to buy first, or wants to understand the differences between PLA, PETG, ABS, ASA, or TPU
- A user asks about bed leveling, first-layer height, Z-offset calibration, or why their prints will not stick to the build plate
- A user wants a structured workflow -- from unboxing through first successful functional print
- A user asks what slicer software to use, how to import a model, or how to orient a print for best quality

Do NOT use this skill when:

- The user is asking about resin-based printing (SLA, MSLA, DLP, or mSLA) -- these use UV-cured photopolymer resin, an entirely different process with different hardware, post-processing, and safety requirements
- The user wants to design or model a 3D object in CAD software (use a CAD beginner skill instead -- the workflow starts upstream of this skill)
- The user is asking about professional additive manufacturing processes -- SLS (selective laser sintering), DMLS (direct metal laser sintering), or binder jetting for industrial applications
- The user is asking about post-processing techniques beyond basic support removal and sanding -- painting, epoxy coating, vapor smoothing, or electroplating require their own dedicated skills
- The user is asking about multi-material or multi-color printing with MMU (multi-material units) or tool-changer systems -- this is intermediate-to-advanced territory
- The user is asking about slicing for a delta or CoreXY kinematics machine with advanced input shaping or resonance compensation -- these require printer-specific expertise beyond beginner scope

---

## Process

### Step 1: Assess the User's Starting Point with Targeted Questions

Before giving any guidance, determine exactly where the user is in their journey. The right advice for someone still shopping is completely different from advice for someone whose print just failed on attempt seven.

- Ask three targeted questions: (1) Do you have a printer already, or are you still shopping? (2) What do you want to print -- decorative objects, functional parts, prototypes, something else? (3) Have you successfully completed any prints yet, or is this completely new?
- If they have a printer, ask which extruder type it has -- Bowden (extruder motor is remote, filament travels through a PTFE tube to the hotend) or direct-drive (extruder motor sits directly above the hotend). This changes retraction settings significantly: Bowden requires 4--7mm retraction, direct-drive requires 0.5--2mm.
- Ask about the build surface type -- PEI (spring steel or glass-coated), plain glass, BuildTak, or whatever came with the printer. Each surface has different adhesion behavior and bed temperature requirements.
- Ask about room temperature if they mention bed adhesion problems -- rooms below 18°C (65°F) cause warping in PLA and significant warping in PETG and ABS. Note this before recommending fixes.
- Identify their slicer software if they have one. The most widely used slicers are Cura (Ultimaker/open-source, highly configurable, beginner-friendly interface), PrusaSlicer (open-source, excellent preset system), Bambu Studio (for Bambu Lab printers), Simplify3D (paid, granular control), and OrcaSlicer (Bambu-based fork with excellent calibration tools). All of these share the same fundamental settings terminology even though menu locations differ.
- Do not overwhelm a beginner with all settings at once. Identify which of the three phases they are in: (A) Setup and first print, (B) Quality improvement, or (C) Failure diagnosis.

---

### Step 2: Explain the FDM Process with Mechanical Accuracy

A beginner cannot troubleshoot what they do not understand. Give them the correct mental model before touching settings.

- FDM stands for Fused Deposition Modeling. The printer melts a solid plastic filament (1.75mm diameter for nearly all consumer printers, 2.85mm for some older Ultimaker-style machines) through a heated brass nozzle (typically 0.4mm diameter) and deposits it on a heated build plate in a precise pattern.
- The process is fundamentally layer-by-layer additive manufacturing. The slicer software cuts the 3D model into horizontal slices, generates a toolpath for each layer (the nozzle path across that slice), and outputs G-code -- a text file of movement and temperature commands that the printer's controller board executes.
- The critical mechanical chain: filament spool -- extruder (pushes filament) -- PTFE tube (in Bowden systems) -- hotend heater block -- nozzle tip -- build plate. Any failure anywhere in this chain produces a print defect. Knowing which part of the chain failed is the core diagnostic skill.
- Explain the three zones of a print: (1) First layer -- the most critical; adhesion to the bed here determines whether the print survives. (2) Walls (perimeters/shells) -- the outer surface visible after printing. (3) Infill -- the internal structure, only partly visible through the walls.
- Print time depends on four factors: object volume, layer height (halving layer height roughly doubles print time), print speed, and infill percentage. A 50mm calibration cube at 0.2mm layers and 50 mm/s takes approximately 1.5--2 hours. The same cube at 0.1mm takes 3--4 hours.
- The filament path outside the printer matters too: filament must feed off the spool without tangling. Always make sure the free end is clipped to the spool before removing from the printer to prevent tangling.

---

### Step 3: Configure Slicer Software with Specific, Numbered Parameters

This is the core technical step. Every setting needs a specific starting value and a clear explanation of when and why to deviate from it.

**Layer height -- the primary quality-vs-speed trade-off:**
- 0.08--0.12mm: fine detail, smooth surfaces, long print times. Use for display figurines, jewelry, models with fine text or surface detail. Nozzle wear is higher at fine layers due to back-pressure.
- 0.16--0.20mm: the default for most prints. Balances surface quality and print time. Start every new printer calibration here.
- 0.24--0.28mm: draft quality, visible layer lines, significantly faster. Use for mechanical prototypes, hidden structural parts, test-fitting before a final quality print.
- 0.30mm: maximum for a 0.4mm nozzle. The 75% rule is non-negotiable: layer height must not exceed 75% of nozzle diameter. At 0.4mm nozzle, max layer height is 0.3mm. Beyond this, the nozzle cannot compress the layer adequately, causing delamination under stress.
- Variable layer height: most slicers support assigning different layer heights to different Z-heights. Use 0.28mm for the infill-heavy base, 0.12mm for detailed top sections. This is intermediate but worth mentioning.

**Wall count (perimeters/shells) -- more important than infill for strength:**
- 2 walls: minimum, adequate for display prints only.
- 3 walls: good default for most prints. Recommended starting point.
- 4--5 walls: use for functional parts that will be drilled, tapped, or stressed. Adding walls increases strength far more efficiently than increasing infill.
- Wall width is typically equal to nozzle diameter (0.4mm). Some slicers allow 0.45mm walls (slight over-extrusion per wall for better bonding).

**Infill -- internal structural density:**
- 0--5%: decorative only. Will crack if handled. Use only for large display pieces where weight matters.
- 10--15%: light household objects, decorative prints that will be handled.
- 20%: the standard starting point. Adequate for most non-load-bearing prints.
- 30--40%: recommended for functional parts -- brackets, enclosures, clips, phone stands.
- 50--80%: high-stress parts, load-bearing brackets, anything that will be screwed into or takes repeated impact.
- 100%: solid infill. Use for small parts where the infill pattern creates no advantage (gaskets, shims, blocks), or for parts where maximum compressive strength is needed. Print time roughly doubles vs. 20%.
- Infill pattern selection: Grid (default, fast, adequate), Gyroid (isotropic strength -- strong in all directions, best for functional parts that may be stressed in unknown directions, ~10% slower than grid), Honeycomb (classic, good lateral strength), Lines (fastest, weakest, use only for non-structural fill on draft prints), Cubic (good for flat stress distribution).

**Temperature settings -- filament-specific, not printer-specific:**
- Always start with the temperature range printed on the filament spool label. A manufacturer printing "195--215°C" on the label has tested their specific formulation.
- PLA: nozzle 190--215°C (200°C is the safe middle-ground starting point), bed 50--65°C. PLA requires no enclosure. Glass transition temperature approximately 60°C -- do not use PLA parts in hot cars or near heat sources.
- PETG: nozzle 225--250°C (235°C starting point), bed 70--85°C. PETG is hygroscopic (absorbs moisture from air), which causes bubbling and poor surface quality. Dry filament before printing if it has been exposed to air for more than a few days.
- ABS: nozzle 230--250°C (240°C starting point), bed 95--110°C, fully enclosed printer required. Produces styrene fumes -- ventilation is a safety requirement, not a suggestion. Glass transition approximately 100°C.
- ASA: similar to ABS (nozzle 240--260°C, bed 90--110°C) but UV-resistant and less prone to warping. Better outdoor choice than ABS.
- TPU (flexible): nozzle 220--240°C, bed 30--60°C, direct-drive extruder required, print speed 15--25 mm/s, retraction off or set to 0.5mm maximum.

**Retraction -- the fix for stringing:**
- Retraction is the extruder reversing the filament slightly during travel moves (when the nozzle moves without printing) to prevent ooze.
- Bowden extruder retraction: 4--7mm at 40--60 mm/s.
- Direct-drive retraction: 0.5--2.0mm at 25--45 mm/s.
- Over-retraction causes grinding, heat creep, and clogs. Never exceed 7mm on Bowden or 3mm on direct-drive for PLA.
- Combing mode: enables the nozzle to travel only over already-printed areas rather than crossing open space, dramatically reducing strings without needing high retraction. Enable by default.

**Print speed:**
- First layer: 15--25 mm/s regardless of material. Slow first layer = better adhesion = print success.
- Outer walls (perimeters): 30--40 mm/s. The surface you see is printed at this speed -- quality depends on it.
- Inner walls: 40--60 mm/s.
- Infill: 50--80 mm/s.
- Travel (non-print moves): 100--200 mm/s (this does not affect quality directly).
- Reducing overall print speed by 20% is the single fastest fix for unexplained print quality issues.

**Support structures:**
- The 45-degree rule: FDM can bridge angles up to approximately 45° from vertical without support. Surface angles greater than 45° from vertical (or overhangs greater than 45° from horizontal, depending on how your slicer measures) need support.
- Bridging (horizontal overhangs): FDM can bridge gaps up to approximately 50--60mm with no support, using fan cooling to solidify the bridging material mid-air. Beyond 60mm, support is usually needed.
- Normal (linear) supports: print directly beneath the overhang, touching the model. Leave contact marks. Adequate for most prints where appearance of the support-contact surface does not matter.
- Tree supports: organic branching structures that touch the model at minimal contact points. Easier to remove, less scarring, use fewer materials. Preferred for figurines and complex organic shapes.
- Support interface layers: a separate layer material or pattern at the very top of the support, directly beneath the overhang. Dramatically improves overhang surface quality and makes support removal easier. Set interface layer height to 0.1mm regardless of main layer height.
- Support Z-distance: the vertical gap between the top of the support and the bottom of the overhang. 0.2mm for PLA. Too small = support fuses to model and is impossible to remove. Too large = overhang surface quality degrades.

---

### Step 4: Teach Bed Adhesion as a System, Not a Single Setting

Bed adhesion failure is the leading cause of print failure. Teach it as a sequence of causes, not a single fix.

- The Z-offset (first-layer height) is the single most impactful setting. The nozzle must be close enough to the bed that the first layer is slightly squished, creating a wider track that bonds well. Too far away = no adhesion. Too close = nozzle drags and scratches the surface, or clogs.
- The paper test: place a single sheet of standard 80gsm printer paper (approximately 0.1mm thick) between the nozzle (heated to print temperature) and the bed at each corner and at the center. Adjust until there is noticeable drag when pulling the paper -- you feel resistance but can still pull. This is approximately 0.1mm gap.
- After leveling, print a first-layer test: a single-layer 150x150mm square. Watch it lay down. A correctly leveled first layer looks slightly shiny and squished. Gaps between lines = too far. Lines bunching up or nozzle dragging = too close. Adjust Z-offset in 0.025mm increments live during the test.
- Bed surface cleaning protocol: wipe with 90%+ isopropyl alcohol (IPA) before every print session. Skin oils from fingers contaminate the surface and ruin adhesion. Never touch the print surface with bare hands.
- Adhesion aid options: PVA glue stick (cheap, reliable for PLA and PETG, washable with water), hairspray (similar principle, slightly messier), dedicated adhesion sprays. For ABS and ASA on glass beds, ABS slurry (ABS dissolved in acetone, applied thin) is traditional but requires ventilation.
- Bed adhesion by adhesion structure type: Skirt (single or multiple lines around the model -- not attached, just primes the nozzle and shows extrusion quality), Brim (flat single-layer extension attached to model base, typically 5--15mm wide -- adds enormous contact area, prevents warping, must be removed after printing), Raft (thick 3--5 layer platform under the entire print -- adds 30--60 minutes to large prints, use only for severe warping issues or materials like ABS that shrink significantly during cooling).

---

### Step 5: Teach Filament Selection with Material Science Context

Beginners need to understand why materials behave differently, not just which one to buy.

- Start with PLA for every beginner. PLA (polylactic acid) is a bioplastic derived from corn starch. It has the lowest printing temperature of common materials (190--215°C), prints without an enclosure, produces minimal odor, adheres well to most surfaces, and is the most dimensionally accurate material for beginners. Its primary weakness is low heat deflection temperature (~60°C) and brittleness compared to PETG.
- Move to PETG for functional parts. PETG (polyethylene terephthalate glycol) is chemically related to PET plastic (drink bottles). It is significantly stronger and more impact-resistant than PLA, has higher heat resistance (~80°C), and is slightly flexible, reducing brittleness. It strings more than PLA. It is hygroscopic -- store in a sealed bag or dry box when not in use.
- ABS requires full commitment. ABS (acrylonitrile butadiene styrene) produces strong, high-temp parts but requires an enclosed, heated chamber (60--70°C chamber temperature) and active fume ventilation. It warps severely without proper enclosure. It is genuinely not suitable for beginners without the right hardware.
- ASA is the better outdoor material vs. ABS. Near-identical printing requirements to ABS but significantly more UV-stable. Use for outdoor parts, garden fixtures, anything left in sunlight.
- TPU and flexible filaments are advanced. Requires direct-drive extruder, slow speed (15--25 mm/s), and essentially no retraction. Very rewarding once mastered (phone cases, gaskets, flexible hinges).
- PLA+ (sometimes called PLA Pro or Tough PLA): marketing term for modified PLA with added impact modifiers. Generally prints identically to standard PLA but with improved toughness and slightly higher temperature resistance. Good upgrade from standard PLA once comfortable with the basics.

| Material | Nozzle Temp | Bed Temp | Enclosure | Strength | Heat Resist | Fumes | Beginner Level |
|----------|-------------|----------|-----------|----------|-------------|-------|----------------|
| PLA | 190--215°C | 50--65°C | No | Moderate | ~60°C | Minimal | Start here |
| PLA+ | 195--220°C | 55--65°C | No | Good | ~65°C | Minimal | First upgrade |
| PETG | 225--250°C | 70--85°C | No | High | ~80°C | Low | After 10 PLA prints |
| ABS | 230--250°C | 95--110°C | Required | High | ~100°C | Significant | Advanced only |
| ASA | 240--260°C | 90--110°C | Required | High | ~100°C | Moderate | Advanced only |
| TPU (95A) | 220--240°C | 30--50°C | No | Flexible | ~80°C | Low | Advanced only |

---

### Step 6: Teach Print Failure Diagnosis as a Decision Tree

Every failure has a cause -- a specific mechanical or thermal reason. Teach the diagnosis systematically.

- Warping (corners lift off bed, base curves upward): Cause -- differential cooling. The bottom layers cool and contract while upper layers are still hot. Higher in hot/cold gradient = more warping. Fix sequence: (1) Clean bed with IPA. (2) Increase bed temperature by 5°C. (3) Add brim (8--10mm). (4) Move print to center of bed (corners of many beds run cooler). (5) Eliminate drafts from fans or open windows. (6) If ABS/ASA, build enclosure or use draft shield.
- Stringing (thin spider-web filaments between sections): Cause -- molten material oozing from nozzle during travel moves. Fix sequence: (1) Increase retraction by 0.5mm (Bowden) or 0.2mm (direct-drive). (2) Reduce nozzle temperature by 5°C. (3) Enable combing mode. (4) Increase travel speed to 150--200 mm/s. (5) Enable "avoid crossing perimeters." Stringing is mostly solved by the first two fixes 80% of the time.
- Layer shifting (layers offset sideways, creating staircase appearance): Cause -- mechanical, not thermal. Stepper motor skipping steps. Fix sequence: (1) Check X and Y belts -- they should feel like a taut guitar string when plucked, not slack or overly stiff. (2) Check that print head is not catching on warped corners of the print. (3) Reduce print speed by 20%. (4) Check if the nozzle has accumulated a plastic blob that drags against the print. (5) Verify that the build plate is not shifting (loose bed screws).
- Under-extrusion (gaps in walls, thin or missing layers, weak infill, rough surface): Cause -- not enough material being deposited. Fix sequence: (1) Check for partial nozzle clog -- do a cold pull (see Edge Cases). (2) Check if filament is grinding in the extruder (look for plastic dust on the filament path). (3) Increase nozzle temperature by 5°C. (4) Increase flow rate to 103--105%. (5) Check that the PTFE tube has not pulled back from the hotend, leaving a gap where filament accumulates and clogs.
- Elephant foot (first layer is wider/bulged, overhanging the rest of the print): Cause -- Z-offset too close or bed temperature too high on first layer. Fix sequence: (1) Increase Z-offset by 0.025--0.05mm (move nozzle slightly farther from bed). (2) Reduce bed temperature by 5°C. (3) Reduce first-layer line width to 90% of nozzle diameter.
- Spaghetti / detachment mid-print: Cause -- first-layer adhesion failure, often discovered many layers in when the print has shifted and the nozzle is dragging loose strands. Fix sequence: (1) Stop the print immediately. (2) Re-level bed and clean with IPA. (3) Reduce first-layer speed to 15--20 mm/s. (4) Apply glue stick adhesion aid. (5) Re-check Z-offset.
- Blobs and zits (small lumps on outer surface): Cause -- excess material at layer start/end points. Fix: Enable "seam alignment" to a corner (hide zits at a back corner of the part). Reduce outer wall speed. Enable "wipe on retract" setting. Reduce retraction restart distance by 0.1mm.
- Heat creep (filament softening too far up the hotend, causing intermittent clog): More common with high ambient temps, slow print speeds, or inadequate cooling fan. Fix: Ensure the hotend cooling fan (the always-on fan that cools the heatsink, separate from the part-cooling fan) is spinning. Clean the heatsink fins. Reduce print speed. Check if the PTFE tube liner extends fully to the nozzle tip.

---

### Step 7: Execute the First-Print Sequence Progressively

The four-print sequence is designed so each print teaches a specific skill and validates a specific system. Do not skip prints.

**Print 1 -- Calibration Cube (20mm):**
- Download: search for "calibration cube 20mm" in any model repository. The print should have embossed X, Y, Z labels on each face.
- Settings: 0.2mm layer height, 3 walls, 20% grid infill, no supports, 200°C nozzle, 60°C bed.
- After printing, measure with digital calipers (a $15--25 investment that pays off immediately). Each side should measure 20.0mm ± 0.2mm.
- If X and Y are off but Z is correct: adjust the flow rate (E-steps calibration). If Z is too short: adjust Z-steps or flow rate. If one axis is off: check that axis's belt tension.

**Print 2 -- Benchy (3D Benchy boat benchmark):**
- The Benchy is the universal FDM benchmark model. It tests: bed adhesion (flat bottom), overhang angles (bow), bridging (interior cabin roof), small details (chimney, porthole letters), stringing (chimney to cabin), and general surface quality.
- Settings: 0.2mm layer height, 3 walls, 15% infill (it is hollow, infill is cosmetic), no supports (Benchy is designed to print without supports).
- Evaluate: smooth hull below waterline, clean bow overhang (no drooping), cabin roof bridge with no sagging, no strings between chimney and cabin, legible text on stern.
- A clean Benchy means your printer is calibrated. A Benchy with specific issues tells you exactly which setting to adjust.

**Print 3 -- Functional Item with Supports:**
- Choose a phone stand, cable clip, wall hook, or drawer organizer. Any model with at least one overhang greater than 45° that requires support.
- Settings: 0.2mm layer height, 4 walls, 30% gyroid infill, tree supports enabled, support Z-distance 0.2mm.
- Post-print skills to teach: Remove supports by breaking at the base with pliers or flush cutters (diagonal cutting pliers, often called "dikes"). Use fine-grit sandpaper (220--400 grit) to smooth support contact points. A sharp hobby knife (X-Acto or similar) removes support remnants from internal features.

**Print 4 -- Multi-Part Assembly:**
- Print a two-part box with snap-fit lid, or a two-part bracket with bolt holes. The model must have parts that fit together with intentional clearance.
- Standard FDM dimensional tolerance is ±0.2--0.3mm. Designers build clearances of 0.2--0.4mm for slip fits, 0.1--0.2mm for press fits.
- If parts do not fit: try increasing flow rate by 2% (if parts are too big) or decreasing by 2% (if parts are too small). After two or three assemblies, this calibration becomes intuitive.

---

## Output Format

Use this template when responding to a beginner user. Fill in all fields with specific values, not placeholders.

```
## Your 3D Printing Setup and Learning Plan

### Your Profile
- Printer type: [model or "shopping" -- include extruder type: Bowden/direct-drive if known]
- Filament to start: PLA [specific color/brand on hand if mentioned]
- Build surface: [PEI, glass, BuildTak, or unknown]
- Primary goal: [decorative / functional parts / prototypes / all-purpose learning]
- Slicer software: [Cura / PrusaSlicer / OrcaSlicer / Bambu Studio / other]

---

### Phase 1: Initial Setup Checklist
- [ ] Assemble printer per manufacturer instructions
- [ ] Level bed using paper test (0.1mm gap, slight drag at all four corners + center)
- [ ] Set Z-offset to achieve slightly squished, shiny first layer
- [ ] Load PLA filament, heat nozzle to 200°C, manually extrude 50mm to confirm smooth flow
- [ ] Confirm part-cooling fan spins when nozzle reaches print temperature
- [ ] Confirm hotend cooling fan runs continuously (not temperature-triggered)

---

### Phase 2: Slicer Settings Reference (PLA Starting Values)

| Setting              | Starting Value                         | Adjust When...                                      |
|----------------------|----------------------------------------|-----------------------------------------------------|
| Layer height         | 0.20mm                                 | 0.12mm for detail, 0.28mm for speed drafts          |
| Wall count           | 3 walls                                | 4--5 for functional/stress parts                   |
| Top/bottom layers    | 4 layers                               | 5--6 for smoother top surface on large flat areas   |
| Infill percentage    | 20%                                    | 30--40% for functional parts, 50%+ for load-bearing |
| Infill pattern       | Grid                                   | Gyroid for unknown-direction stress                 |
| Nozzle temperature   | 200°C (check spool label)             | ±5°C to tune for this spool                        |
| Bed temperature      | 60°C                                   | +5°C if corners lift (warping)                     |
| Print speed          | 50 mm/s                                | 30 mm/s to resolve quality issues                  |
| First layer speed    | 20 mm/s                                | Never increase -- slower is always better           |
| First layer height   | 0.24mm (120% of layer height)         | Adjust via Z-offset, not slicer                     |
| Retraction distance  | 5mm Bowden / 1mm direct-drive         | +0.5mm if stringing, never exceed 7mm/3mm           |
| Retraction speed     | 45 mm/s                                | Reduce to 25 mm/s for PETG                         |
| Fan speed            | 100% from layer 3 onward              | 50% for PETG, 0% for ABS                           |
| Support type         | Off (enable tree for overhangs >45°) | Enable for any overhang beyond 45°                 |
| Support Z distance   | 0.20mm                                 | 0.25mm if support fuses to model                   |
| Bed adhesion         | Skirt (2--3 lines)                    | Brim (8mm) if small footprint or corners lifting    |
| Combing mode         | On (avoid crossing open spaces)       | Always on for PLA and PETG                         |

---

### Phase 3: First-Print Sequence

| # | Model               | Why This Print                        | Key Settings                   | How to Know It Succeeded                             |
|---|---------------------|---------------------------------------|--------------------------------|------------------------------------------------------|
| 1 | Calibration cube 20mm | Validates dimensional accuracy     | 0.20mm, 3 walls, 20% grid     | Each face measures 20.0mm ±0.2mm with calipers       |
| 2 | 3D Benchy           | Full quality benchmark                | 0.20mm, 3 walls, 15% infill   | Clean bow overhang, no strings, legible stern text   |
| 3 | Functional part (phone stand / hook) | First useful print + support practice | 0.20mm, 4 walls, 30% gyroid, tree supports | Stands up correctly, supports remove cleanly |
| 4 | Two-part assembly   | Fit and tolerance validation          | 0.20mm, 4 walls, 30% gyroid   | Parts assemble with expected clearance, no filing needed |

---

### Phase 4: Failure Diagnosis Reference

| What You See                          | Most Likely Cause                         | First Fix                                 | Second Fix if First Fails                    |
|---------------------------------------|-------------------------------------------|-------------------------------------------|----------------------------------------------|
| Corners lifting off bed               | Thermal warping / poor adhesion           | Clean bed with IPA, +5°C bed temp, brim   | Move print to bed center, eliminate drafts   |
| Spider-web strings between sections   | Insufficient retraction or high temp      | Retraction +0.5mm, nozzle temp -5°C       | Enable combing, check filament for moisture  |
| Layers shifted sideways               | Loose belt or nozzle snagging             | Tighten X and Y belts                     | Reduce speed to 30 mm/s                      |
| Missing/thin sections, rough surface  | Under-extrusion or partial clog           | Cold pull to clear nozzle                 | Flow rate +3%, nozzle temp +5°C              |
| First layer wider than rest           | Z-offset too close or bed too hot         | Increase Z-offset 0.025--0.05mm           | Reduce bed temp by 5°C                       |
| Print knocked loose mid-print         | First layer adhesion failure              | Re-level, clean bed, glue stick, slow first layer | Add brim, dry filament if PETG          |
| Random blobs on surface               | Excess material at layer seam             | Enable seam alignment to corner           | Reduce outer wall speed, enable wipe on retract |

---

### What to Explore After Your First 4 Prints
- Print the same object at 0.12mm and 0.28mm layer heights -- see and feel the difference
- Compare a part printed at 15% infill vs. 40% infill -- push until they break
- Try a print that requires supports -- practice removal technique with flush cutters and sandpaper
- Dry your filament in an oven at 45--50°C for 4--6 hours and compare print quality before vs. after
- When the included spool runs out, try PETG for your first functional load-bearing part
```

---

## Rules

1. **Always recommend PLA as the first and only filament until the user has 10+ successful prints.** PLA is the most forgiving material. Its lower print temperature (190--215°C vs. 225+°C for PETG) means less heat creep risk, easier nozzle clearing, and more stable first-layer adhesion. Do not suggest PETG, ABS, or TPU as "starters" regardless of what the user says they want to print.

2. **Never give temperature recommendations without a range AND a spool-label caveat.** Filament formulations vary between manufacturers. A "PLA" from manufacturer A may print best at 195°C while manufacturer B's PLA requires 215°C. Always say: "Start with X°C and check your spool label for the manufacturer's range."

3. **Retraction settings must always specify the extruder type (Bowden vs. direct-drive).** Giving a Bowden retraction value (5--7mm) to a direct-drive user will cause grinding, heat creep, and clogging within a few prints. This is one of the most common beginner mistakes caused by generalized advice.

4. **Bed leveling must be presented as a sequential process with verification steps, not a single action.** Re-leveling without checking the Z-offset first, or leveling on a cold bed, will not produce a usable result. Always specify: (1) heat bed to print temperature before leveling, (2) check at all four corners then center, (3) verify with a first-layer test print, not just the paper test alone.

5. **The 75% rule for layer height is non-negotiable.** With a 0.4mm nozzle, never set layer height above 0.3mm. Exceeding this causes adhesion failure between layers (delamination), rough surfaces, and structurally weak prints. If a user asks for "maximum speed," explain that they need a larger nozzle (0.6mm or 0.8mm), not a higher layer height on a 0.4mm nozzle.

6. **ABS must always come with a safety warning, not just a difficulty warning.** ABS emits styrene vapor during printing, which is an irritant and potential carcinogen with long-term exposure. Printing ABS in an unventilated space is not just a print quality issue -- it is a health issue. This warning is mandatory whenever ABS is mentioned to a beginner.

7. **Always diagnose failure from the mechanical root cause, not just the symptom.** Stringing is not fixed by "adjusting retraction" -- it is fixed by diagnosing whether the cause is retraction distance, temperature, travel speed, or moisture in the filament. Walk through the cause-and-fix chain, not just the fix.

8. **The first-print sequence is ordered by learning dependency, not difficulty.** A user who skips the calibration cube and goes straight to a complex model will have no baseline for diagnosing failures. Emphasize that Print 1 (calibration cube) is the foundation -- all other prints are only meaningful if you know your printer is dimensionally accurate.

9. **Cold pull is the only acceptable first-line nozzle clearing technique for beginners, not burning out clogs.** Teaching beginners to "raise the temperature to clear a clog" risks burning PLA carbon deposits into the nozzle, creating a much worse clog. The cold pull method (heat to 200°C, manually push filament through, let cool to 90°C for PLA, pull sharply -- repeat 3--5 times until the pulled piece shows a clean, shiny nozzle impression) is safe and effective.

10. **Ambient environment factors must be checked before advanced troubleshooting.** If a user is troubleshooting warping, stringing, or adhesion issues: ask about room temperature (below 18°C causes adhesion issues and warping in all materials), drafts (air conditioning vents, open windows, desk fans), and filament storage (an open spool of PETG in a humid environment will string and bubble regardless of slicer settings). Environmental causes are dismissed 80% of the time when they are actually responsible.

---

## Edge Cases

### User Is Still Shopping for a First Printer
Provide selection criteria without naming specific brands. Key specs to prioritize:
- Build volume: 220x220x250mm (LxWxH) is the standard "starter" envelope. Adequate for the vast majority of household and hobby objects. Larger build volumes cost more and have no benefit for beginners.
- Auto bed leveling (ABL): a proximity sensor that automatically measures the bed surface and compensates for tilt in software. This is not a luxury -- manual bed leveling is a significant source of beginner frustration. ABL reduces first-print failure rates substantially. Prioritize this feature.
- Direct-drive extruder: mounts the extruder motor directly above the hotend. Enables better retraction control, handles flexible filaments, and reduces stringing. The trade-off is slightly increased print head weight, which reduces maximum print speed slightly. Better than Bowden for beginners.
- Heated bed: required for PETG, ABS, and ASA. Strongly recommended for PLA as well. Without a heated bed, PLA warping becomes significantly more common.
- Community/firmware support: a printer with an active user community and open firmware (not a closed proprietary system) means troubleshooting help, upgrades, and replacement parts are accessible.
- Budget tiers: $200--300 covers capable starter FDM printers with ABL, heated beds, and reasonable build volumes. $300--500 adds more reliable components, direct-drive, and better part quality. Over $500 for a beginner usually means paying for features they will not use for 12+ months.

### User Has Persistent First-Layer Adhesion Failures
This is the most common beginner crisis. Work through this exact sequence:
1. Heat the bed to print temperature before starting (thermal expansion changes bed geometry -- always level and set Z-offset at operating temperature).
2. Clean the bed with fresh IPA and a lint-free cloth, wiping in a single direction (not circular scrubbing, which redistributes oils).
3. Confirm Z-offset: the first layer should look slightly squished and lines should be touching each other. If you can see gaps between lines, Z-offset is too high.
4. Reduce first-layer print speed to 15 mm/s and increase first-layer flow rate to 110%.
5. Apply a thin, even coat of PVA glue stick. Let it dry to a haze before starting. Do not apply thick globs.
6. If still failing: check whether the bed surface has degraded (PEI sheets need periodic washing with dish soap, not just IPA -- oils build up over weeks and IPA alone eventually becomes inadequate). Replace or flip PEI sheet.
7. If warping specifically: add an 8--10mm brim and confirm there are no air currents hitting the print (even from the part-cooling fan if mounted to direct air at the bed corners).

### User Wants to Print with a 0.6mm or 0.8mm Nozzle (Speed Printing)
This is not advanced -- it is increasingly common as a technique for large functional parts where surface detail is not critical.
- With a 0.6mm nozzle: maximum layer height = 0.45mm, standard layer height = 0.4mm, wall width = 0.6mm. Print speed can increase by 30--40% vs. 0.4mm.
- With a 0.8mm nozzle: maximum layer height = 0.6mm, standard layer height = 0.5mm. Dramatically faster for large structural parts. Fine details will be lost.
- Temperature increase is required with larger nozzles: the same mass of filament passes through a larger orifice in the same time, requiring more thermal energy. Increase nozzle temperature by 5--10°C vs. 0.4mm settings.
- Retraction settings decrease with larger nozzles: less back-pressure means less retraction needed. Reduce retraction by 0.5--1mm vs. 0.4mm settings.

### User Is Printing in a Cold or Inconsistent Environment
Room temperature below 18°C causes: PLA adhesion failures, more severe warping, and first-layer separation. PETG and ABS become nearly unprintable in cold rooms without an enclosure.
- Immediate fix: build a simple enclosure from cardboard, foam board, or an IKEA LACK table with acrylic panels. An enclosure does not need to be sealed -- even a partially open enclosure traps enough heat to stabilize the ambient temperature around the print.
- Target chamber temperature: 25--35°C for PLA, 35--45°C for PETG, 55--65°C for ABS/ASA.
- Do not enclose PLA printing at high chamber temperatures for extended periods -- PLA benefits from active part cooling, and a fully sealed hot enclosure can cause heat creep at the hotend.
- Move the printer away from exterior walls, air vents, and open windows.

### User Wants to Print Large Objects That Exceed Build Volume
Any model larger than the build plate must be split and assembled. Teach this workflow:
- Most slicers (Cura, PrusaSlicer, OrcaSlicer) include a "split model" or "cut" tool. The user can specify a cutting plane, split the model into two or more parts sized to fit the bed, and print separately.
- Design alignment features into the split: flat split faces are difficult to align accurately. Best practice is to add alignment pins (3mm diameter cylindrical protrusions on one face, corresponding 3.1mm holes on the mating face) at two points minimum.
- Joining methods: CA (cyanoacrylate / super glue) works for PLA and most FDM plastics. For high-stress or outdoor joints, 2-part epoxy is more durable. For PETG, use gel CA. For ABS, acetone welding (brush acetone on both faces, press together for 30 seconds) creates a near-homogeneous bond.
- Clearance at split faces: plan for 0.1--0.2mm clearance on mating surfaces so they press together without forcing.

### User's Filament Is Producing Bubbling, Popping Sounds or Extreme Stringing
This is almost always a moisture problem, not a slicer setting problem. Hygroscopic filaments (PETG, Nylon, PVA, and to a lesser extent PLA) absorb atmospheric moisture. Moisture turns to steam inside the nozzle, creating bubbles, surface roughness, steam-popping sounds during extrusion, and dramatically increased stringing.
- Diagnostic test: extrude 100mm of filament manually through a heated nozzle. Listen for popping sounds. Wet filament pops and snaps. Dry filament extrudes silently.
- Drying protocol: food dehydrator at 45--50°C for 4--6 hours for PLA; 65°C for 4--6 hours for PETG; 80°C for 8--12 hours for Nylon. Oven at the lowest setting (usually 50--60°C) for 4--6 hours also works. Remove spools immediately when done -- leaving them in a warm oven as it cools can cause them to absorb humidity from the cooling air.
- Prevention: store filament in sealed bags or containers with silica gel desiccant. A vacuum-sealed bag with fresh silica gel will keep filament dry for months. A purpose-built filament dry box (heated, with humidity readout) is the best long-term solution for PETG and Nylon users.

### User Has a Partial or Complete Nozzle Clog
Nozzle clogs are a rite of passage. Teach the complete procedure:
- Identify severity: partial clog (filament extrudes but inconsistently or thinly) vs. complete clog (nothing extrudes).
- First response -- cold pull (atomic pull):
  1. Heat nozzle to full print temperature (200°C for PLA).
  2. Manually push 50mm of filament through. 
  3. Reduce nozzle temperature to 90°C (PLA) or 120°C (PETG, ABS).
  4. When temperature reaches target, grip the filament firmly and pull with a single sharp, steady pull.
  5. The pulled filament should have a clean, shiny pointed tip shaped like the nozzle interior. If it is dirty or broken, repeat.
  6. Do 3--5 cold pulls until the tip comes out clean.
- Needle cleaning: after a cold pull, use a 0.35mm nozzle cleaning needle (acupuncture needles work) to poke through the nozzle tip while it is at temperature. This dislodges carbon deposits the cold pull did not remove.
- Nuclear option -- nozzle replacement: nozzle replacement takes 5 minutes and costs less than $2 for standard brass nozzles (buy a 10-pack). Teach this as a maintenance skill, not a last resort. Heat the hotend to 240°C (to expand the metal), unscrew the old nozzle with a 7mm socket wrench while holding the heater block steady with pliers, install the new nozzle hand-tight then snug 1/8 turn further. Never overtighten cold.

---

## Example

**Input:** "I just bought my first 3D printer. It's a Cartesian-style printer with a Bowden extruder and auto bed leveling. Came with one spool of white PLA. I downloaded a slicer app but I have no idea where to start. I want to eventually print useful things like brackets and organizers, but I know I need to learn first. What do I do?"

---

**Output:**

## Your 3D Printing Setup and Learning Plan

### Your Profile
- Printer type: Cartesian FDM with Bowden extruder + auto bed leveling (ABL)
- Extruder type: Bowden -- this affects your retraction settings (use 5mm, not 1mm)
- Build surface: check what came with the printer (likely glass with adhesion coating or PEI spring steel sheet)
- Filament: white PLA (start with this -- exactly the right material)
- Slicer: set up but not configured yet -- we'll fix that
- Primary goal: functional parts (brackets, organizers) -- this means we'll aim for 30--40% infill and 4 walls once you're past calibration

---

### Phase 1: Initial Setup -- Do These Before Opening the Slicer

**1. Mechanical checks (10 minutes):**
- Power on the printer and navigate to the preheat menu. Heat the bed to 60°C and the nozzle to 200°C.
- While heating, check that both the X and Y axis belts feel taut when you pluck them -- like a guitar string that's in tune. If one feels loose, tighten it before your first print.
- With everything at temperature, check that the hotend cooling fan (the smaller fan that runs continuously on the heatsink) is spinning. A dead hotend fan causes heat creep and clogs within minutes of printing.
- Navigate to the extruder control menu. Manually extrude 100mm of PLA at 200°C. Watch the filament come out of the nozzle -- it should flow in a smooth, consistent strand with no bubbling or popping sounds. Wet filament pops. If yours pops, dry it at 45°C for 4--6 hours in an oven before continuing.

**2. Run the auto bed leveling routine (your printer handles the hard part):**
- Follow your printer's ABL procedure (usually in the menu under "Leveling" or "Calibration"). The printer will probe multiple points on the bed surface and build a compensation mesh.
- After ABL completes, you still need to set the Z-offset (the fine-tuning of how close the nozzle is to the bed on the first layer). Navigate to your Z-offset menu.
- Print a single-layer 150x150mm square (any slicer will let you make one, or find a "first layer test" file online). Watch the lines lay down:
  - Lines with visible gaps between them = nozzle too far, reduce Z-offset by 0.05mm
  - Lines are touching and slightly squished, looking a bit shiny = correct
  - Lines bunching up or nozzle dragging = nozzle too close, increase Z-offset by 0.05mm
- Adjust in 0.025--0.05mm increments. Do this step, not just the paper test -- ABL compensates for tilt but cannot set the correct Z-offset height.

---

### Phase 2: Slicer Settings Reference for Your Bowden + PLA Setup

Open your slicer, create a new print profile, and set these values:

| Setting               | Your Value                   | Why / When to Change                                     |
|-----------------------|------------------------------|----------------------------------------------------------|
| Layer height          | 0.20mm                       | Use 0.12mm for quality prints, 0.28mm for fast drafts    |
| Wall count            | 3 walls                      | Bump to 4 walls for all your bracket/organizer prints    |
| Top/bottom layers     | 4 layers                     | 5 layers for large flat top surfaces                     |
| Infill %              | 20% (calibration only)       | 30--40% for everything functional                       |
|
