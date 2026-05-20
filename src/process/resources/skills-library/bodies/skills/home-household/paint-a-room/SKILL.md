---
name: paint-a-room
description: |
  Guides the user through painting a room from surface preparation through final cleanup, with time estimates per step, material calculations, and technique instructions for cutting in, rolling, and finish coats.
  Use when the user asks about painting a room, choosing paint finishes, how much paint to buy, wall painting technique, or how long it takes to paint a room.
  Do NOT use for exterior painting, painting furniture or cabinets, decorative techniques like murals or faux finishes, or choosing wall colors for design purposes (use interior-design-principles instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance step-by-step guide"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Paint A Room

## When to Use

**Use this skill when:**
- User asks how to paint a room, a specific wall, or an accent wall inside a home
- User wants to calculate how much paint to buy based on room dimensions
- User asks about painting techniques -- cutting in, rolling, feathering, maintaining a wet edge
- User needs a step-by-step painting plan with realistic time and drying estimates
- User asks about primer selection, paint finish types, or paint-and-primer combo products
- User wants to prep walls before painting (patching, sanding, cleaning, taping)
- User asks why their paint looks streaky, has lap marks, or shows roller texture
- User wants to know if they need to prime before painting a new color

**Do NOT use when:**
- User wants to paint the exterior of a house -- different substrate prep, UV-resistant formulations, caulking sequences, and climate timing apply
- User wants to paint cabinets or furniture -- requires scuff sanding, bonding primer, and often oil-based or conversion varnish topcoats
- User wants decorative painting (murals, stenciling, color washing, venetian plaster, faux finishes)
- User needs color selection and design advice (use `interior-design-principles` instead)
- User is painting a commercial or industrial space where OSHA requirements, VOC limits, or fire-rated coatings apply
- User is dealing with lead paint in a pre-1978 home -- this requires EPA RRP (Renovation, Repair, and Painting) protocol, not a standard painting skill
- User asks about specialty coatings (epoxy floor paint, pool paint, chalkboard paint) -- these have unique application requirements

---

## Process

### Step 1 -- Gather Room Dimensions and Calculate Paint Quantities
*(Time: 10-20 minutes)*

- Measure all four walls: length and height of each wall individually rather than relying on a room average, because walls vary in window and door placement
- Wall area formula: add together (wall length x wall height) for each individual wall, sum all four
- Subtract standard openings: a hollow-core interior door = approximately 21 sqft (3 ft x 7 ft); a standard double-hung window = approximately 15 sqft (3 ft x 5 ft); a large picture window or sliding glass door = 30-40 sqft
- Coverage rate: quality latex paint covers 350-400 sqft per gallon per coat on smooth, primed, or previously painted surfaces; on raw drywall or highly porous surfaces, assume 300-350 sqft per gallon because the substrate absorbs paint
- Standard planning rate: use 375 sqft per gallon as a reliable middle estimate for previously painted smooth walls
- Minimum coat count: plan for 2 topcoats on any wall; certain situations require 3 (see Edge Cases)
- Add 10-15% overage: accounts for roller absorption (a standard 9-inch roller saturated with paint holds roughly 1/4 cup; it is loaded and unloaded 80-100 times per gallon), brush waste, and touch-up reserve
- Ceiling calculation (if painting ceiling): length x width = ceiling sqft; ceiling paint often covers at 300-350 sqft per gallon because flat finishes are more porous

**Paint quantity quick reference:**

| Room Size | Ceiling Height | Net Wall Area (approx.) | Paint for 2 Coats |
|-----------|---------------|------------------------|-------------------|
| 10x10 ft | 8 ft | ~250 sqft | 1.5 gallons |
| 12x12 ft | 8 ft | ~295 sqft | 1.5--2 gallons |
| 12x14 ft | 8 ft | ~340 sqft | 2 gallons |
| 12x16 ft | 8 ft | ~370 sqft | 2 gallons |
| 14x18 ft | 9 ft | ~490 sqft | 2.5--3 gallons |
| 16x20 ft | 9 ft | ~555 sqft | 3 gallons |

*Net wall area assumes 2 standard windows and 1 door subtracted from total.*

---

### Step 2 -- Select Paint Finish and Primer
*(Time: 15-30 minutes -- can be done while shopping)*

**Paint finish decision framework:**

| Finish | Sheen Level (GU at 60°) | Washability | Hides Imperfections | Best Applications |
|--------|------------------------|-------------|---------------------|-------------------|
| Flat/Matte | Under 10 GU | Poor -- use damp cloth only | Excellent | Ceilings, formal dining rooms, low-traffic bedrooms |
| Velvet/Matte Enamel | 10-15 GU | Moderate -- wipeable | Very good | Master bedrooms, adult living rooms |
| Eggshell | 15-25 GU | Good -- mild cleaners | Good | Bedrooms, living rooms, dining rooms |
| Satin | 25-40 GU | Very good -- scrubable | Moderate | Hallways, family rooms, kids' rooms |
| Semi-Gloss | 55-70 GU | Excellent -- bleach-safe | Low | Kitchens, bathrooms, doors, trim, wainscoting |
| High-Gloss | 70+ GU | Superior | Minimal | Trim only, doors, furniture-grade applications |

*GU = Gloss Units, the industry measurement for sheen. Most manufacturers print this on the can or product data sheet.*

**Key finish trade-off:** Higher sheen = easier to clean but more visible wall imperfections. For walls with significant texture, patching, or skim coat work, use eggshell over satin. Satin on an imperfect wall with raking light creates a map of every flaw.

**Primer selection decision tree:**

1. **New drywall (never painted):** Use PVA (polyvinyl acetate) primer -- also labeled "drywall primer." It seals the highly porous paper face and dried compound so the topcoat does not soak in unevenly, creating "flashing" (dull spots where compound absorbed the sheen differently than the paper face)
2. **Previously painted smooth wall, same color family:** A single coat of paint-and-primer combo product ("self-priming paint") is acceptable. These are thicker-bodied paints with higher titanium dioxide content -- they are not a separate primer layer; they simply require fewer topcoats
3. **Light color over dark color (e.g., navy to cream):** Use white, high-hide primer -- products labeled "stain-blocking" or "high-build" primer work. Tinting this primer to a gray or mid-value version of the topcoat color is more effective than using straight white -- it reduces topcoat count from 3 to 2
4. **Dark color over light color (e.g., cream to navy):** Tint the primer to a dark gray or a version of the topcoat color at 50% strength. This removes the need for a third topcoat to achieve full saturation
5. **Water stains, rust stains, smoke, nicotine, or marker:** Shellac-based primer (e.g., Zinsser BIN) or oil-based stain-blocking primer only. Water-based primers will not permanently block tannin bleed, rust halo, or smoke odor. Shellac-based primer dries in 30-45 minutes and requires denatured alcohol for cleanup
6. **Over glossy existing paint:** Use a bonding primer (water-based bonding primers work; do not sand glossy walls, which can re-expose raw gypsum at high spots) or scuff with 150-grit sandpaper on trim edges, then spot-prime
7. **Bathroom or high-humidity space:** Use a mold-resistant primer (contains mildewcide additives) as a base before applying satin or semi-gloss topcoat

---

### Step 3 -- Prepare the Room
*(Time: 1-2.5 hours for a standard 12x14 bedroom)*

**Furniture and protection:**
- Move furniture to the center of the room or remove it entirely -- paint fumes and overspray travel further than expected and furniture in the way creates awkward cutting angles near corners
- Cover furniture and floors: canvas drop cloths (10 oz canvas is standard; 12 oz is more durable) on the floor within 3 feet of the walls -- canvas grips the floor and does not slip under foot traffic the way 4-mil plastic sheeting does
- Use 4-mil plastic sheeting only for covering furniture -- it is lightweight and easy to drape
- Remove outlet covers and switch plates entirely -- do not tape over them; paint edges around the tape and the cover looks sloppy when reinstalled. Store screws in a labeled zip-lock bag
- Remove curtain rods and wall anchors; leave the wall anchor holes to fill in the patching step

**Patching wall damage:**
- Nail holes and small divots (under 1/4 inch): use spackling compound (vinyl spackling is easiest -- lightweight, dries white, sands easily). Apply with a flexible putty knife, slightly overfill, let dry 30-60 minutes, sand with 120-150 grit sandpaper until flush
- Medium holes (1/4 inch to 3 inches): use lightweight joint compound (all-purpose or setting-type). Apply in two thin coats with a 4-inch putty knife -- first coat fills, second coat feathers the edges. Sand with 120 grit, prime the patch before painting (unprimed compound will flash)
- Large holes (over 3 inches): requires a backing method -- a California patch (cut drywall piece with paper facing wings adhered to the wall surface) or a mesh patch kit. Skim with joint compound, feather 8-12 inches from the repair, prime when fully dry (24 hours minimum for setting compound; 4-6 hours for lightweight)
- Cracks: hairline cracks -- fill with paintable latex caulk and smooth with a wet finger. Structural cracks (recurring or wider than 1/8 inch at any point) should be investigated before painting

**Taping technique:**
- Use 1.5-inch or 2-inch blue painter's tape (180-day or 60-day depending on how long the job takes -- 14-day tape is too weak and leaves residue)
- Apply tape to: the top edge of baseboard trim, door casing edges (the painted wall side), window casing edges, and the ceiling line only if you cannot cut freehand (an experienced painter often skips ceiling-line tape)
- Press the tape edge firmly with a flexible putty knife or a tape-sealing tool -- run it along the inner edge of the tape that will contact the wet paint. This step prevents paint bleed under the tape, which creates a ragged line regardless of how carefully you rolled
- Do NOT tape the baseboard on top of existing dust -- wipe trim with a tack cloth first or the tape will not adhere and will peel back during painting
- Press tape into interior corners firmly; do not let it bridge across the corner, which leaves a gap that paint will wick into

**Wall cleaning:**
- Wipe all walls with a dry microfiber cloth or tack cloth to remove dust, cobwebs, and loose debris
- Greasy walls (kitchen, areas near candles or fireplaces): wash with a TSP substitute solution (sodium metasilicate products labeled as TSP substitute are less caustic and equally effective) mixed per label, rinse with clean water, let dry 24 hours -- any residual grease acts as a release agent under latex paint
- Do not wet-sponge standard drywall walls aggressively -- the paper face absorbs moisture and can raise a grain or soften joint compound patches

---

### Step 4 -- Apply Primer (When Required)
*(Time: 1-2 hours for a standard room + 2-4 hours drying time; shellac primer dries in 45 minutes)*

- Apply primer using the same cut-in-then-roll sequence described in Steps 5 and 6 for topcoats
- Use the appropriate primer for the situation (see Step 2 decision tree)
- Primer does not need to be perfectly uniform in coverage -- it is a foundation layer, not a finish coat; thin spots in primer are acceptable as long as the surface is sealed
- Sand primer lightly after it fully cures with 150 or 180 grit sandpaper if the surface feels rough (raised grain from moisture in the primer)
- Vacuum sanding dust and wipe with a tack cloth before topcoat
- Do not skip the tack cloth step -- airborne dust that settles on wet paint is the primary cause of texture defects called "nibs" that must be sanded out between coats

---

### Step 5 -- Cut In the First Coat
*(Time: 45-90 minutes for a standard 12x14 room)*

Cutting in means painting a 2-3 inch band of paint along all edges where a roller cannot reach: ceiling line, interior wall corners, top of baseboards, and around window and door casings.

**Brush selection:**
- Use a 2.5-inch angled sash brush for all cutting in -- the angled bristle profile (longer bristles on one side) allows precise line control at ceiling edges and corners
- Quality matters significantly here: a cheap brush with loose bristles leaves brush marks and sheds bristles into the wet paint. A good nylon/polyester blend brush (Purdy XL Glide or comparable) will maintain a sharp tip, hold more paint, and release it smoothly

**Loading and technique:**
- Dip bristles 1/3 of the bristle length into the paint (roughly 1 inch for a 2.5-inch brush) -- deeper loading causes runs and drips
- Tap (do not wipe or scrape) the bristles on the inside of the paint can to knock off excess -- wiping removes too much paint and promotes dry dragging
- Begin cutting in with the long, smooth stroke about 1/4 inch from the edge, then bring the brush to the edge on the second pass -- this creates a controlled, clean line
- Hold the brush like a pencil near the ferrule (the metal band), not like a hammer at the handle end -- this gives tactile feedback through the bristles
- For the ceiling line: load the brush, angle bristles toward the ceiling, and drag smoothly along the line using the wall surface as the guide for your hand position
- Work in 3-4 foot sections per cut-in pass -- do not cut in an entire wall before rolling it; cut-in paint dries within 20-30 minutes in normal conditions and a dried cut-in edge will show as a distinct line (the "lap mark trap")

**Critical sequencing rule:** Cut in one wall section (ceiling, both corners, baseboard strip) and then immediately roll that wall section before either section dries. The goal is to "marry" the wet cut-in edge into the wet rolled field so both blend together -- this is called maintaining a wet edge.

---

### Step 6 -- Roll the First Coat
*(Time: 30-60 minutes for rolling after cut-in on a standard room)*

**Roller selection:**
- Standard frame: 9-inch roller frame is the workhorse for wall painting -- covers enough area per pass to work efficiently without creating excessive overspray (paint mist from a spinning roller)
- 4-inch or 6-inch mini rollers: use for narrow wall sections, behind doors, and accent walls with tight corners
- Nap selection is critical:
  - 3/8-inch nap: smooth to orange-peel drywall texture -- leaves the least roller texture in the final finish
  - 1/2-inch nap: light knockdown or lightly textured walls -- gets paint into valleys without excessive stipple
  - 3/4-inch nap: heavy knockdown, skip-trowel, popcorn-adjacent textures -- necessary to push paint deep into recesses
  - Do not use the wrong nap: a 3/8-inch nap on a textured wall leaves unpainted recesses; a 3/4-inch nap on a smooth wall leaves visible stipple texture in the finish

**Loading the roller:**
- Pour paint into the deep well of the roller tray (about 1/2 inch deep -- do not overfill)
- Load the roller by rolling it back and forth in the well, then working it on the textured ramp section of the tray until the nap is evenly saturated but not dripping -- an overloaded roller spatters and drips; an underloaded roller drags and skips
- The saturated roller should feel heavy and look uniformly wet with no dry patches on the nap

**Rolling technique:**
- Begin at a top corner, one roller width from the ceiling (the cut-in band covers the very top)
- Apply paint in an overlapping W or M pattern across a 3-4 foot wide section: make a W shape with 4-5 strokes, then fill in with vertical strokes without lifting the roller -- this distributes paint evenly before working it in
- Roll the section from top to bottom on fill strokes -- gravity helps the paint level
- Apply moderate, consistent pressure -- pressing hard forces paint out of the nap in uneven ribbons and creates roller texture; the nap should do the work of depositing paint
- Maintain a wet edge: always start a new section by rolling into the edge of the previous wet section before it skins over (within 5-10 minutes in normal conditions, faster in dry heat)
- Feather the edges: end each loaded-roller pass by lifting the roller gradually at the end of the stroke -- this avoids a thick ridge of paint at the edge that causes a lap mark when the next section is applied
- Reload the roller when you see skip marks or when coverage becomes visibly thinner at the end of strokes

**Roller technique specifics for ceiling-to-wall junction:**
- Keep the roller slightly below the cut-in band so you do not roll over the cut-in edge -- rolling over the cut-in band creates visible texture differences because the cut-in strip was applied with a brush (smoother) and the rolled field has nap texture; blending them while both are wet minimizes this difference but it still exists if you over-work the junction

---

### Step 7 -- Apply the Second Coat
*(Time: same as first coat -- allow 2-4 hours minimum drying before second coat; 4-6 hours in humid conditions)*

**Drying vs. curing distinction:**
- Latex paint is touch-dry (can be touched without transferring to fingers) in 30-60 minutes
- Latex paint is recoat-ready when the solvent has sufficiently evaporated -- typically 2-4 hours
- Latex paint is fully cured (reaches final hardness and washability) in 14-30 days -- do not place heavy objects on painted surfaces, scrub, or clean aggressively for at least 2 weeks
- Painting over a coat that is not recoat-ready causes solvent entrapment: the topcoat seals in evaporating solvents, which push back up through the topcoat as bubbles or cause poor adhesion

**Second coat technique:**
- Repeat the exact cut-in-then-roll sequence from Steps 5 and 6
- The second coat should go on slightly faster than the first because the first coat sealed the surface and the second coat has less absorption
- Inspect the wall under raking light between coats: hold a bright flashlight at a very low angle (nearly parallel to the wall surface, 4-6 inches away) and move it slowly across the surface -- thin spots, roller marks, runs, and uneven coverage become immediately visible under raking light and can be corrected with the second coat while they are still inaccessible under the topcoat
- On the second coat, roll in a consistent single direction on the final pass (typically top to bottom) to minimize visible roller stipple -- this is called "tipping off"
- After the second coat, inspect again under raking light once dry -- if thin spots or shadowing exist, a third coat is warranted (see Edge Cases)

---

### Step 8 -- Clean Up and Reassemble
*(Time: 30-60 minutes)*

**Tape removal -- the most frequently botched step:**
- Remove painter's tape while the final coat is still slightly tacky -- about 1-2 hours after applying the final coat, not the next day
- Removing tape from fully dry paint causes the paint film to crack along the tape edge if the paint has bonded across the tape seam
- Pull tape back on itself at a 45-degree angle (not 90 degrees perpendicular to the wall, which tears the paint edge) -- the tight angle causes the tape to score the paint film as it releases rather than prying it up
- If tape has been left overnight or paint has fully dried: score the tape edge with a sharp utility knife along the paint/tape junction before pulling -- this severs the paint film cleanly

**If paint bled under the tape:**
- Let the bleed-through dry completely before touching it
- Do not try to wipe wet bleed-through -- it smears
- Once dry, scrape the bleed with a rigid putty knife or a razor blade scraper at a low angle, then touch up with a small artist's brush

**Brush and roller cleanup:**
- Water-based latex paint: rinse brushes in a bucket of warm water first, then wash with soap, work the bristles against your palm to release paint from the heel of the brush (the area near the ferrule), rinse until water runs clear, reshape bristles, and hang vertically to dry or lay flat -- never store a brush upright on its bristles
- Roller covers: squeeze as much paint as possible back into the can using the roller ramp, then rinse under running water while spinning the roller on the frame, then roll on newspaper to remove remaining paint -- latex-soaked roller covers are difficult to clean fully; for a multi-day project, wrap roller covers tightly in plastic wrap (they stay usable for 2-3 days without drying out) rather than cleaning between sessions
- Oil-based paint (if used): first rinse with mineral spirits, second rinse with fresh mineral spirits, then wash with soap and warm water; dispose of used mineral spirits as hazardous waste

**Paint storage:**
- Seal the can: place a piece of plastic wrap over the opening before pressing the lid on -- this prevents the skin that forms on the paint surface from contaminating future touch-up paint
- Label the can: room name, date applied, finish type, and the brand color number -- color numbers allow an exact match at the store if you need touch-up paint years later
- Store at 50-85°F -- do not allow paint to freeze (emulsion permanently breaks down and becomes grainy and unusable); do not store in a garage in freeze-prone climates
- Do not store a nearly empty can upright -- turn it upside down and store it that way so any remaining paint creates an airtight seal at the lid (some painters do this)

**Reassembly sequence:**
- Replace outlet covers and switch plate screws (clean the covers if paint got on them during taping)
- Reinstall curtain rod hardware
- Move furniture back after the paint is dry to the touch -- ideally wait 24 hours before placing objects against the wall or hanging artwork

---

## Output Format

```
## Room Painting Plan: [Room Name]

### Room Dimensions
- Room size: [L] ft x [W] ft
- Ceiling height: [H] ft
- Number of windows: [X] (standard 15 sqft each) or [describe large windows]
- Number of doors: [X] (standard 21 sqft each)
- Total gross wall area: [X] sqft
- Total deductions: [X] sqft
- Net paintable wall area: [X] sqft

### Paint Quantity Calculations
| Surface | Area | Coats | Coverage Rate | Gallons Needed |
|---------|------|-------|---------------|----------------|
| Walls (primer) | [X] sqft | 1 | 375 sqft/gal | [X] gal |
| Walls (topcoat) | [X] sqft | 2 | 375 sqft/gal | [X] gal |
| Ceiling (if applicable) | [X] sqft | [X] | 325 sqft/gal | [X] gal |
| **Total paint needed** | | | | **[X] gallons** |

### Materials List
| Item | Spec | Quantity | Estimated Cost |
|------|------|----------|----------------|
| Wall paint ([finish]) | [color/sheen] | [X] gal | $[X]--$[X] |
| Primer | [type] | [X] gal | $[X]--$[X] |
| Painter's tape | 1.5" or 2", [14/60/180]-day | [X] rolls | $[X]--$[X] |
| Canvas drop cloths | 9x12 ft, 10 oz | [X] | $[X]--$[X] |
| Roller covers | [nap size] nap, 9" | 3 covers | $[X]--$[X] |
| Roller frame | 9" heavy cage frame | 1 | $[X]--$[X] |
| Paint tray + liner | standard 9" | 1 | $[X]--$[X] |
| Angled sash brush | 2.5" nylon/polyester | 1 | $[X]--$[X] |
| Spackling compound | lightweight vinyl | 1 tub | $[X]--$[X] |
| Sandpaper | 120 and 150 grit, 5-pack each | 2 packs | $[X]--$[X] |
| Putty knife | 3" flexible | 1 | $[X]--$[X] |
| Tack cloth | standard | 1 pack | $[X]--$[X] |
| Extension pole | 4-8 ft adjustable | 1 | $[X]--$[X] |
| **Total estimated** | | | **$[X]--$[X]** |

### Primer and Finish Recommendation
- **Primer type:** [PVA / stain-blocking shellac / gray-tinted high-hide / bonding / none needed] -- [specific reason based on current wall condition and color change]
- **Topcoat finish:** [flat / eggshell / satin / semi-gloss] -- [specific reason based on room type and traffic]
- **Special considerations:** [humidity, texture, existing paint condition]

### Time Estimate
| Phase | Active Time | Drying Time | Notes |
|-------|-------------|-------------|-------|
| Room prep (patching, taping, drop cloths) | [X] hrs | -- | Can be done the evening before |
| Primer coat | [X] hrs | 2-4 hrs | Skip if not needed |
| First topcoat (cut in + roll) | [X] hrs | 2-4 hrs | Cut in one wall, roll it, move to next |
| Second topcoat (cut in + roll) | [X] hrs | 2-4 hrs | Inspect under raking light after |
| Cleanup and reassembly | [X] hrs | -- | Remove tape at 1-2 hrs after final coat |
| **Total active work time** | **[X] hrs** | | |
| **Total elapsed time** | **[X] hrs** | | *Spread over [X] days recommended* |

### Recommended Schedule
- **Day 1:** [Specific tasks with times]
- **Day 2:** [Specific tasks with times]
- [**Day 3 if needed:**] [Specific tasks]

### Room-Specific Notes
- [Finish rationale based on room type and traffic]
- [Primer rationale based on color change and current wall condition]
- [Roller nap recommendation based on wall texture]
- [Any special prep considerations unique to this room]
- [Ventilation or temperature considerations]
```

---

## Rules

1. **Always calculate from actual measurements -- never accept "a medium-sized room" as sufficient input.** If the user has not provided dimensions, ask for them. Generic recommendations like "2 gallons should be fine" lead to mid-job paint runs or significant waste. The formula is simple and quick; use it every time.

2. **Always recommend 2 topcoats minimum, regardless of what the paint label says.** "One coat coverage" claims on premium paint are made under laboratory conditions with a neutral gray background at full-spread rate. Real-world application over a color, with brush and roller at normal technique, requires 2 coats for opacity, depth, and durability.

3. **Never tell a user to cut in the entire room and then roll all four walls.** This is the single most common amateur mistake and the primary cause of visible lap marks. The wet cut-in edge dries within 20-30 minutes. Rolling into a dry cut-in edge creates a distinct line. The rule is: cut in one wall section, roll that wall, move to the next.

4. **Always separate elapsed time from active work time in the schedule.** A user who budgets "5 hours" for a two-coat job and starts at 10am will be rolling a second coat at 1pm onto a first coat that has only dried 1 hour. Drying time is sacred -- violating it causes solvent entrapment, poor adhesion, and peel. Make the schedule explicit.

5. **Specify roller nap based on wall texture, never use 3/8-inch as a universal default.** Smooth drywall: 3/8-inch. Any texture: 1/2-inch minimum. Heavy texture: 3/4-inch. Wrong nap selection causes either excessive stipple texture (too thick) or uneven coverage with dry valleys (too thin).

6. **Never recommend painting over water stains or nicotine with latex primer.** Water stains and nicotine/smoke contain tannins that bleed through latex regardless of how many coats are applied. Specify shellac-based primer (Zinsser BIN or equivalent) or oil-based stain blocker exclusively for these conditions.

7. **Always include the patch-priming step when patches were made with joint compound or spackling.** Unprimed compound absorbs paint differently than the surrounding wall and "flashes" -- the patched areas show through with a dull, matte halo even after 3 coats of paint. Every patch must receive a spot application of PVA primer or a sealing primer before topcoating.

8. **Tape removal timing is critical -- include it in the schedule.** The optimal tape removal window is 1-2 hours after the final coat -- tacky but not fully dry. Fully dry paint tears rather than scoring cleanly at the tape edge. If tape removal was delayed, the scoring-with-utility-knife technique must be specified.

9. **Account for temperature and humidity explicitly when relevant.** Paint applied below 50°F does not form a proper film -- the latex polymer coalescence (the chemical process that creates a paint film) requires a minimum temperature of 50°F (some premium paints state 35°F but the film quality is compromised). Above 85°F, paint dries too quickly to maintain a wet edge and lap marks become unavoidable. Above 70% relative humidity, drying time doubles and the risk of sagging increases significantly.

10. **When a user mentions a pre-1978 home, always surface the lead paint consideration before proceeding.** Homes built before 1978 may have lead paint under the current surface. Sanding or scraping lead paint releases hazardous dust. This skill does not cover lead-safe work practices -- recommend that the user test with an EPA-approved lead test swab or contact an RRP-certified contractor before any sanding or scraping.

---

## Edge Cases

### Painting Over Dark or Saturated Colors (e.g., Dark Navy to White, Deep Red to Light Gray)
High-chroma and dark colors are the result of organic pigments with poor hide -- meaning they transmit rather than absorb light, and they require more opacity to cover. A single coat of white primer over a dark color typically results in the dark color showing through as a gray haze (called "ghost imaging") even after two topcoats. The solution is a two-stage approach:
- Stage 1: Apply a coat of white, high-hide primer (look for 98+ KU viscosity on the product data sheet, indicating a thick-bodied primer)
- Stage 2: Have the primer tinted at the store to a mid-value gray that sits between the old dark color and the new light color
- Result: 1 tinted primer coat + 2 topcoats is typically sufficient versus 3 topcoats without the tinted primer
- In extreme cases (dark red or burgundy under a white, where red tones are particularly persistent), apply 2 primer coats and allow to dry fully before topcoating
- Critical: use a separate primer product, not paint-and-primer-in-one, for dramatic color changes -- the higher pigment load in dedicated primers provides meaningfully better hide

### Painting a Textured Wall (Orange Peel, Knockdown, Skip Trowel, Popcorn-Adjacent)
Textured walls require modified roller technique and increased paint quantity:
- Use 1/2-inch or 3/4-inch nap roller depending on the depth of the texture valleys
- Load the roller more generously than on smooth walls -- texture increases effective surface area by 15-30%
- Roll with light pressure in multiple directions (X pattern rather than just vertical) to push paint into the recesses of the texture
- Do NOT sand between coats on textured walls -- 150-grit sandpaper abrades the texture peaks unevenly and creates visual patchiness that is very difficult to fix without re-texturing
- Increase paint quantity estimate by 15% above the smooth-wall calculation for light texture, 20-25% for medium knockdown

### Painting a Bathroom or Wet Area
- Finish selection is non-negotiable: satin minimum, semi-gloss preferred for walls that receive direct water contact or steam
- Mold/mildew-resistant paint (which contains fungicidal additives -- typically zinc oxide or other registered biocides) is not just a marketing gimmick; in bathrooms without adequate ventilation, standard paint will show mildew within 6-12 months
- Allow extended drying time between coats: 4-6 hours minimum rather than 2-4 hours because the room absorbs humidity from use and the walls themselves may have elevated moisture content in an older bathroom
- If painting around a bathtub or shower surround: use kitchen-and-bath semi-gloss paint (formulated with additional moisture resistance) and finish the edge with paintable silicone caulk rather than painter's tape alone -- caulk creates a proper waterproof junction at the tub/wall seam that paint cannot provide on its own
- Run the exhaust fan continuously during painting and for 4 hours after each coat

### Painting New Drywall (Never Been Painted)
New drywall is one of the most unforgiving surfaces to paint because it has two radically different porosity zones side by side: the paper face (relatively sealed) and the dried joint compound (highly porous). Without PVA primer:
- The compound areas absorb paint at 2-3x the rate of the paper face
- The result is permanent "flashing" -- dull patches over every taped joint and corner bead, visible at any angle in decent light
- PVA primer seals both surfaces to a uniform porosity level so the topcoat lies consistently
- Apply PVA primer and allow to fully cure (4 hours); lightly sand any raised grain with 180 grit, wipe with a tack cloth, then topcoat
- Never use flat paint as a "temporary" measure on new drywall -- flat paints are porous and will not prevent flashing long-term; PVA primer is mandatory

### The Room Has Glossy Existing Paint (Kitchen or Bathroom Previously Painted with Semi-Gloss or High-Gloss)
- Glossy surfaces resist adhesion because new latex paint cannot mechanically bond to a slick film
- Option 1 (preferred): Apply a water-based bonding primer (specifically labeled "bonding primer for glossy surfaces") -- these contain adhesion promoters that chemically grab the slick surface
- Option 2: Scuff sand the entire wall with 180-grit sandpaper, wipe with a tack cloth, then apply a standard primer -- scuffing creates mechanical tooth for adhesion; this approach is labor-intensive on a full room
- Do NOT simply apply paint directly to a glossy surface and assume two coats will adhere -- it will peel within months, especially in humid environments
- After priming, topcoat with the appropriate finish as normal

### Painting Over Wallpaper (When Removal Is Not Feasible)
Painting over wallpaper is a last resort -- it will eventually fail as the wallpaper seams absorb moisture from the paint and lift, creating bubbles and ridge lines in the paint film. However, in older homes where wallpaper is pasted directly to plaster (not drywall), removal may damage the plaster irreparably. In those cases:
- Do not use water-based primer -- water activates the wallpaper paste and causes the paper to lift and bubble almost immediately
- Apply an oil-based or shellac-based primer (both provide the necessary moisture barrier to prevent wallpaper paste from reactivating)
- Fill and feather all seams with joint compound after priming; let dry, sand smooth with 120 grit, prime the compound spots with the same oil/shellac primer
- Apply topcoat normally -- 2 coats of latex topcoat over the oil/shellac primer is fine (latex bonds to oil-based primer once it is cured)
- Warn the user: this is a 3-5 year solution at best; future repainting will require addressing the wallpaper

### The User Plans to Paint Ceiling and Walls
Always paint the ceiling before the walls. The sequence is:
1. Prep entire room (patch, sand, tape, drop cloths)
2. Paint ceiling (flat or matte ceiling paint; roll in one direction parallel to the primary light source -- this is the long wall parallel to the window -- to minimize visible roller texture)
3. Allow ceiling to dry (2-4 hours)
4. Tape the ceiling line (if not cutting freehand) before starting walls
5. Paint walls using the cut-in-then-roll sequence

Use an extension pole for the ceiling -- attempting to roll a ceiling from a ladder creates inconsistent pressure, fatigue-induced roller marks, and is significantly slower than walking the floor with an extended pole. A 4-to-8-foot adjustable extension pole handles standard 8-9 foot ceilings from the floor.

Do not use wall paint on the ceiling -- ceiling paint is formulated as flat/matte to absorb rather than reflect light (hiding the inevitable roller stipple and texture differences) and is thicker-bodied to resist the dripping that affects overhead application.

---

## Example

**User Input:**
"I want to repaint my living room. It's 15 feet long, 13 feet wide, and has 8-foot ceilings. There are 2 standard double-hung windows and 1 door. The walls are currently a terracotta orange and I want to change to a warm off-white. The walls have a slight orange-peel texture. There are a few nail holes from pictures I took down."

---

## Room Painting Plan: Living Room (15x13 ft)

### Room Dimensions and Calculations
- Room size: 15 ft x 13 ft
- Ceiling height: 8 ft
- Windows: 2 (2 x 15 sqft = 30 sqft)
- Doors: 1 (1 x 21 sqft = 21 sqft)
- Total deductions: 51 sqft

**Wall area calculation:**
- Wall 1 (15 ft long): 15 x 8 = 120 sqft
- Wall 2 (15 ft long, opposite): 15 x 8 = 120 sqft
- Wall 3 (13 ft wide): 13 x 8 = 104 sqft
- Wall 4 (13 ft wide, opposite): 13 x 8 = 104 sqft
- Gross total: 448 sqft
- Minus openings: 448 -- 51 = **397 sqft net paintable area**

**Paint calculations:**
- Primer (1 coat, tinted): 397 sqft / 375 sqft per gallon = 1.06 gallons → **1 gallon**
- Topcoat (2 coats): (397 x 2) / 375 = 2.12 gallons + 10% overage = 2.33 gallons → **3 gallons** (purchase 1 gallon + 1 quart as a buffer, or 3 gallons for peace of mind and touch-ups)

*Note: The 15% texture adjustment increases effective area by approximately 60 sqft, bringing the adjusted net area to roughly 457 sqft. The gallon count does not change at this scale, but absorption will be noticeable on the first coat.*

### Primer and Finish Selection
- **Why primer is required:** Terracotta orange to warm off-white is a dramatic color change involving a saturated warm tone transitioning to a light neutral. Two topcoats over no primer will result in an orange-pink cast bleeding through the off-white in virtually all lighting conditions, especially in warm afternoon light. A high-hide primer tinted to a warm tan (approximately 50% strength of the topcoat color) is the correct approach.
- **Primer type:** High-hide latex primer, tinted at the store to a neutral tan at 50% topcoat strength. This neutralizes the orange while avoiding the contrast of painting pure white primer under a warm-toned topcoat.
- **Topcoat finish:** Eggshell (15-25 GU sheen level). Rationale: a living room sees moderate traffic but is not a high-moisture or high-grease environment. Eggshell is wipeable for fingerprints and scuffs, provides a slightly warm, slightly shiny appearance that flatters paint color in evening light, and hides the slight orange-peel texture better than satin (which would highlight the texture under raking light).
- **Roller nap:** 1/2-inch -- the orange-peel texture has shallow valleys that a 3/8-inch nap would bridge across without fully filling.

### Materials List
| Item | Spec | Quantity | Estimated Cost |
|------|------|----------|----------------|
| Wall paint -- eggshell, warm off-white | 9" roller application | 3 gallons | $75--$120 |
| High-hide primer -- tinted tan | 50% topcoat tone at store | 1 gallon | $25--$40 |
| Painter's tape | 1.5", 60-day blue | 3 rolls | $15--$22 |
| Canvas drop cloths | 9x12 ft, 10 oz | 2 | $22--$35 |
| Roller covers | 1/2" nap, 9" | 4 covers | $14--$20 |
| Roller frame | 9" heavy cage | 1 | $8--$14 |
| Paint tray + liner | 9" standard | 1 + 3 liners | $6--$10 |
| Angled sash brush | 2.5" nylon/polyester blend | 1 | $10--$15 |
| Lightweight spackling compound | vinyl spackle | 1 small tub | $5--$8 |
| Sandpaper | 120 grit and 150 grit, 5-pack each | 2 packs | $8--$12 |
| Flexible putty knife | 3" | 1 | $4--$7 |
| Tack cloth | standard pack | 1 | $4--$6 |
| Extension pole | 4--8 ft adjustable | 1 | $15--$25 |
| Plastic sheeting | 2-mil, 9x12 ft | 1 roll | $6--$10 |
| **Total estimated** | | | **$217--$344** |

*Paint alone is $100--$160 for this project. Quality of roller covers and brush significantly affects final result quality -- do not substitute cheap versions of those items.*

### Time Estimate
| Phase | Active Time | Drying Time | Notes |
|-------|-------------|-------------|-------|
| Room prep -- patch, sand, tape, drop cloths | 2 hrs | -- | Patch nail holes first; let dry 45 min before sanding |
| Tinted primer coat | 1.5 hrs | 3--4 hrs | Texture absorbs primer quickly; maintain wet edge |
| First topcoat -- cut in + roll | 1.5 hrs | 3--4 hrs | Inspect under raking light after drying |
| Second topcoat -- cut in + roll | 1.5 hrs | 3--4 hrs | Tape removal at 1--2 hrs after this coat |
| Cleanup and reassembly | 45 min | -- | |
| **Total active work time** | **7.25 hrs** | | |
| **Total elapsed time** | **~19--21 hrs** | | *Strongly recommend spreading over 2 days* |

### Recommended 2-Day Schedule

**Day 1 -- Morning (8:00 AM start):**
- 8:00 AM -- Move furniture to room center, cover with plastic sheeting. Lay canvas drop cloths within 3 feet of all walls. Remove outlet covers and switch plates (store screws in labeled bag). Remove curtain hardware.
- 8:30 AM -- Patch all nail holes with vinyl spackle using the 3-inch putty knife. Slightly overfill each hole. Allow to dry 45 minutes.
- 9:15 AM -- Sand all patches flush with 120-grit sandpaper, then smooth with 150-grit. Wipe all walls with tack cloth -- pay special attention to corners and the ceiling line where dust accumulates.
- 9:30 AM -- Apply painter's tape: press firmly along baseboard trim edge, door casing wall edge, and window casing wall edge. Run the tape-sealing edge of the putty knife along the tape's inner edge to seal against bleed-through.
- 10:00 AM -- Spot-prime all spackled patches with a small brush and the tinted primer. These must be primed separately because unprimed spackle flashes through the topcoat.
- 10:15 AM -- Begin primer coat: cut in ceiling line (freehand or taped), corners, and trim edges. Roll the field with the 1/2-inch nap roller in 1/2 M-pattern sections, working one wall at a time (cut in, then immediately roll each wall before moving to the next).
- 11:45 AM -- Primer coat complete. Allow to dry **3--4 hours minimum.** Do not rush this -- the terracotta will partially show through the primer when wet; check after full drying before deciding if a second primer coat is needed (in this case one should be sufficient with a tinted primer).

**Day 1 -- Afternoon (3:30 PM start):**
- 3:30 PM -- Inspect dry primer under raking light. The terracotta should be largely neutralized to a warm tan. If orange is still clearly visible, apply a second primer coat and wait until Day 2 for the first topcoat.
- 3:45 PM -- First topcoat: cut in the ceiling line, corners, and all edges (2.5-inch angled brush, working wall-by-wall). Roll each wall with the 1/2-inch nap roller immediately after cutting in that wall.
- 5:15 PM -- First topcoat complete. Allow to dry **3--4 hours minimum.** The off-white over the tan primer will look even and clean at this stage.
- Evening: leave the room alone. The paint is drying and needs undisturbed airflow.

**Day 2 -- Morning (8:00 AM start):**
- 8:00 AM -- Inspect first topcoat under raking light. Note any thin spots or areas where the tan primer shows through.
- 8:15 AM -- Second (final) topcoat: cut in corners, edges, and ceiling line (same wall-by-wall sequence); roll field immediately after cutting in each wall. Use a fresh roller cover for this final coat -- a partially dried roller cover leaves more texture than a fresh one.
- 9:45 AM -- Final coat complete. Allow to dry **1--2 hours**, then remove painter's tape (while tacky, at 45-degree angle).
- 10:00 AM -- (While waiting for tape removal timing) clean brushes with warm soapy water; wrap roller in plastic for short-term storage or clean it out.
- 10:15 AM -- Remove painter's tape. Inspect the trim edge for any bleed-through; allow any bleed-through to dry fully, then scrape and touch up with a small brush.
- 11:00 AM -- Touch up any spots missed or affected by tape removal. Allow to dry.
- 11:30 AM -- Reinstall outlet covers, switch plates, and curtain hardware. Move furniture back to position (keep items from resting against the wall for 24 hours -- paint is not yet cured enough to resist impressions).
- 12:00 PM -- Label paint can with "Living Room -- [Brand] [Color Name/Number] -- Eggshell -- [Date]." Press plastic wrap over the can opening before seating the lid. Store in a climate-controlled location (not garage if freezing temperatures are possible).

### Room-Specific Notes
- **Tinted primer is essential for this job.** Terracotta orange contains warm red-yellow organic pigments with low hiding power -- they are chromatic bullies. A white primer will show the orange's warm ghost under 2 coats of off-white in certain lighting. The tinted primer approach costs nothing extra (tinting is free at the paint counter) and saves an entire coat.
- **The orange-peel texture will receive full coverage with the 1/2-inch nap roller.** Use the M-pattern load distribution, then fill in vertically. Do not press
