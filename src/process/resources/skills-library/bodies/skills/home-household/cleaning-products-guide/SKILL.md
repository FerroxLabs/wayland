---
name: cleaning-products-guide
description: |
  Guides users in selecting the correct cleaning product type for each surface
  and task in the home. Covers surface-product compatibility, DIY cleaning
  solutions, product safety including dangerous combinations to avoid, and a
  minimal essential product list. Use when the user asks which cleaner to use
  on a surface, wants to simplify their cleaning supplies, needs DIY cleaning
  recipes, or asks about cleaning product safety. Do NOT use for cleaning
  routines or schedules (use weekly-cleaning-schedule), stain removal on
  clothing (use laundry-system), or industrial or commercial cleaning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cleaning guide cooking"
  category: "home-household"
  subcategory: "cleaning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Cleaning Products Guide

## When to Use

Use this skill when the user presents one of the following specific situations:

- User asks which product or ingredient to use on a named surface: "What should I use to clean my marble countertop?" or "How do I get hard water off my shower door?"
- User wants to rationalize or reduce their cleaning supply cabinet -- they feel overwhelmed by specialty products or want to know the minimum effective set of products for their home
- User asks about making DIY cleaning solutions from pantry or pharmacy ingredients (vinegar, baking soda, hydrogen peroxide, castile soap, borax)
- User asks explicitly about cleaning product safety: whether two products are safe to mix, what to do after accidental mixing, ventilation requirements, or storage rules
- User mentions a surface material and wants to know if a specific product will damage it: "Can I use bleach on my tile grout?" or "Will vinegar hurt my hardwood floors?"
- User is moving into a new home and needs to build a starter cleaning kit from scratch
- User is pregnant, has young children or pets, or has chemical sensitivities and needs guidance on low-toxicity or fragrance-free cleaning options
- User asks about the difference between disinfecting, sanitizing, and cleaning -- and which they actually need

**Do NOT use this skill when:**

- User needs a room-by-room or weekly cleaning routine -- use `weekly-cleaning-schedule` instead
- User needs to remove a stain from a garment, fabric, or laundry -- use `laundry-system` instead
- User needs a full deep cleaning task checklist for a specific room -- use `deep-cleaning-checklist` instead
- User is asking about commercial or industrial cleaning settings (restaurants, hospitals, office buildings) -- chemical concentrations, regulatory requirements, and equipment differ substantially from residential use
- User has identified visible mold covering more than 10 square feet (approximately 3x3 feet) -- this requires professional remediation guidance, not product selection
- User has a cleaning emergency involving a hazardous spill or accidental toxic mix and needs immediate safety guidance -- direct them to call Poison Control (1-800-222-1222 in the US) or emergency services first, then provide this skill's safety content

---

## Process

### Step 1: Gather the Three Critical Inputs Before Recommending Anything

Never jump immediately to a product recommendation. Ask for or clarify these three inputs if they are not already stated:

- **Surface material:** Not just the room or object, but the specific substrate. "Countertop" is insufficient -- is it granite, marble, quartz, laminate, butcher block, or concrete? "Shower" is insufficient -- are the walls ceramic tile, porcelain tile, natural stone, or acrylic/fiberglass? This distinction determines whether acidic cleaners will cause permanent damage.
- **Type of soil or buildup:** Grease and cooking residue require alkaline cleaners. Mineral deposits (hard water, lime scale) require acidic cleaners. Soap scum (a combination of minerals and fatty acids) requires mildly acidic or chelating cleaners. Mold and mildew require oxidizing cleaners (bleach, hydrogen peroxide). General dust and light grime require only surfactant-based cleaners. Matching the cleaner chemistry to the soil type is the core of effective cleaning -- using the wrong chemistry just moves soil around.
- **Household sensitivities and constraints:** Children under 2, pets (especially birds and cats, which are highly sensitive to aerosol sprays and phenol-based cleaners), pregnancy, respiratory conditions (asthma), or fragrance allergies all fundamentally change which products are appropriate.

If the user has provided all three, proceed directly to Step 2 without asking redundant questions.

### Step 2: Classify the Surface by Its Chemical Tolerance

Every surface falls into one of four chemical tolerance categories. This classification drives every product recommendation:

- **Acid-intolerant surfaces (pH must stay above 7):** Natural stone (marble, granite, travertine, limestone, slate), cement grout, cast iron cookware, copper, zinc, and galvanized metal. Vinegar, citric acid, lemon juice, many bathroom cleaners, and lime-scale removers will etch, corrode, or strip the finish from these surfaces permanently. Even brief contact with a pH-4 cleaner can etch polished marble visibly.
- **Alkaline-intolerant surfaces:** Aluminum, anodized aluminum, and some natural fibers. Strong alkaline cleaners (oven cleaners, drain openers, washing soda) corrode aluminum, causing pitting and discoloration.
- **Solvent-intolerant surfaces:** Acrylic, plexiglass, some plastics, lacquered finishes, and painted surfaces. Acetone (nail polish remover), strong alcohol (above 70% concentration), and petroleum-based solvents will craze, cloud, or dissolve these surfaces.
- **Moisture-intolerant surfaces:** Solid hardwood, cork, bamboo (unsealed), unfinished wood, and paper-based laminate. Excess water -- not just soaking, but even repeated damp wiping without drying -- causes swelling, warping, delamination, and mold growth inside the material.

Multi-surface households often span all four categories. When a user has both acid-intolerant surfaces (granite) and surfaces that benefit from acid cleaning (hard water on shower tile), make this distinction explicit so they don't cross-contaminate products between rooms.

### Step 3: Match Product Chemistry to Soil Type

Use this decision framework to identify the correct product class before naming specific ingredients or recipes:

- **Alkaline cleaners (pH 8-13):** Best for grease, oils, protein-based soils (food, blood), soap scum (partial), and general grime. Includes dish soap, all-purpose sprays, degreasers, oven cleaners, and baking soda. The higher the pH, the stronger the degreasing action -- dish soap (pH ~7-8) for light grease, a proper degreaser (pH 10-12) for kitchen exhaust filters and stove grates.
- **Acidic cleaners (pH 2-6):** Best for mineral deposits (hard water, lime scale, calcium, rust), soap scum (the mineral component), and brightening grout. Includes white vinegar (pH ~2.4), citric acid solutions, cream of tartar, and commercial lime/calcium/rust removers. Contact time matters: acidic cleaners need 5-30 minutes of dwell time to dissolve mineral deposits, not just a quick spray-and-wipe.
- **Oxidizing cleaners (disinfectants and bleaching agents):** Bleach (sodium hypochlorite), hydrogen peroxide, and oxygen bleach (sodium percarbonate) work by releasing active oxygen or chlorine that destroys cell membranes and organic compounds. Best for mold, mildew, stain bleaching on white or colorfast surfaces, and disinfection. Concentration and contact time are critical: bleach solution must be at minimum 1,000 ppm (approximately 1/4 cup per gallon of water) for disinfection and must contact the surface for at least 10 minutes.
- **Surfactant-based cleaners (neutral pH 6-8):** Dish soap, castile soap, and most all-purpose sprays at neutral pH. Best for everyday cleaning where disinfection is not required. Surfactants surround and lift dirt without chemical reaction. These are the safest option for delicate or chemically sensitive surfaces.
- **Abrasive cleaners (mechanical action):** Baking soda (very mild, 2.5 Mohs hardness), powdered cleanser with calcium carbonate, or cream cleanser. Used to scour mineral deposits, stains, and stuck-on residue from durable surfaces. Never use on surfaces with a Mohs hardness below 4 (soft stone, acrylic, glass cooktops). The key rule: if the abrasive is harder than the surface, it will scratch.

### Step 4: Construct the Surface-Product Matrix for This User's Specific Home

Build a table (see Output Format) populated only with the surfaces the user has mentioned. Do not pad the table with irrelevant surfaces. For each surface, provide:

- The recommended product type with its active ingredient and approximate pH range
- What NEVER to use and the specific damage mechanism (not just "don't use this" but "this will permanently etch the finish by dissolving the calcium carbonate in the stone")
- A specific, measurable DIY alternative with exact ratios

### Step 5: Build the Minimal Essential Product List

The default target is 5-7 products. More than 7 products in a home cleaning kit increases safety risk (accidental mixing, children accessing multiple chemicals) and cost without meaningfully improving cleaning outcomes. The typical complete home kit consists of:

1. A pH-neutral all-purpose spray (covers 60% of routine cleaning needs)
2. Dish soap -- which doubles as a stone-safe cleaner at low dilution (1 tsp per quart water)
3. White distilled vinegar -- acidic cleaner for hard water, glass, stainless steel, and disinfecting at full strength
4. Baking soda -- mild abrasive, deodorizer, and alkaline booster
5. Hydrogen peroxide (3% from pharmacy) -- disinfectant, grout brightener, stain remover
6. A bathroom cleaner (mildly acidic, soap scum and mildew) -- the one product type that genuinely requires purchase, as the combination of acids, chelators, and surfactants is hard to replicate with pantry ingredients at full efficacy
7. A toilet bowl cleaner (angled-bottle design for under-rim application; can be eliminated if user is willing to use baking soda + vinegar method with longer dwell time)

**Optional but genuinely useful:** Microfiber cloths (replace paper towels for most tasks, washable, leave no lint), a grout brush with stiff nylon bristles, a squeegee for shower glass.

If the user's home has no natural stone and no hardwood, the list can collapse to as few as 4 products: dish soap, vinegar, hydrogen peroxide, and a bathroom cleaner.

### Step 6: Provide DIY Recipes Specific to the User's Surfaces

Only provide DIY recipes that are relevant to surfaces the user has mentioned. Each recipe must include:

- Ingredient quantities in standard measurements (cups, tablespoons, parts)
- Mixing method (does order matter? shake vs. stir?)
- Dwell time required
- "Use on" and "Do NOT use on" lists
- Shelf life of the mixed solution

Note for every relevant recipe: a freshly mixed solution is always more effective than a stored one. Many DIY solutions (especially vinegar-based) lose efficacy within 1-2 weeks.

### Step 7: Deliver the Safety Section -- This Is Mandatory in Every Output

The safety section cannot be omitted or abbreviated. It must appear in every output from this skill, regardless of how narrow the user's question was. Structure it to be scannable in an emergency: use bold text for the most dangerous combinations and lead with the highest-risk scenarios. Include:

- The six most dangerous product combinations and their specific chemical reactions
- Ventilation requirements for any product generating fumes
- First-response instructions for accidental mixing or exposure
- Storage rules, especially for households with children or pets

### Step 8: Recommend Surface Sealants and Preventive Measures Where Applicable

For any surface that requires periodic sealing or protective treatment, include this information alongside product guidance. These recommendations dramatically reduce cleaning difficulty:

- **Granite and marble:** Seal annually with a penetrating stone sealant (impregnating sealer). Test current seal by placing a few drops of water on the surface -- if it beads for at least 5 minutes, the seal is adequate. If it absorbs in under 30 seconds, reseal immediately.
- **Tile grout:** Seal with a penetrating grout sealer every 1-2 years after cleaning grout thoroughly. Epoxy grout does not require sealing.
- **Glass shower doors:** A hydrophobic coating (rain-repellent formulations designed for shower glass) applied every 3-6 months dramatically reduces hard water buildup. A squeegee after each shower is the single highest-ROI preventive habit -- 30 seconds of squeegee time prevents 90% of mineral deposit buildup.
- **Hardwood floors:** Reapply a hardwood floor refresher compatible with the finish type (polyurethane vs. oil-based finish) every 2-3 years. Never use wax on polyurethane-finished floors.
- **Stainless steel appliances:** A thin coat of mineral oil applied after cleaning provides a barrier against fingerprints and water spots and extends the time between cleanings.

---

## Output Format

Produce the following structured output. Omit sections that are not relevant to the user's specific situation, but NEVER omit the Safety section.

```
## Cleaning Product Guide: [User's Home Description]

### Surface-Product Matrix

| Surface | Material | Soil Type | Recommended Product (pH Range) | Active Ingredient | NEVER Use (and Why) | DIY Alternative | Dwell Time |
|---------|----------|-----------|-------------------------------|-------------------|---------------------|-----------------|------------|
| [surface name] | [substrate material] | [soil type] | [product type (pH X-Y)] | [key ingredient] | [product + specific damage mechanism] | [recipe with exact ratios] | [seconds/minutes] |

### Essential Product List: [N] Products for Your Home

| # | Product Type | Active Ingredient | Used For | Coverage | Est. Cost |
|---|-------------|-------------------|----------|----------|-----------|
| 1 | [type] | [ingredient] | [surfaces and tasks] | [% of home tasks] | $[range] |

**Total estimated kit cost: $[range]**

Optional additions:
- [Product]: [specific use case and why it earns a spot]

### DIY Cleaning Recipes

#### [Recipe Name]
- **Ingredients:** [Exact quantities]
- **Mix:** [Instructions -- order, temperature, container type]
- **Dwell time:** [X minutes before wiping or rinsing]
- **Use on:** [Specific surfaces]
- **Do NOT use on:** [Specific surfaces and why]
- **Shelf life:** [Duration] -- [storage notes]

### Preventive Measures and Sealing Recommendations

| Surface | Treatment | Frequency | Indicator That It's Needed |
|---------|-----------|-----------|---------------------------|
| [surface] | [treatment type] | [every X months/years] | [observable test or sign] |

---

### ⚠️ SAFETY: Products That Must NEVER Be Combined

**If you accidentally mix any of the following and experience dizziness, throat burning, difficulty breathing, or eye irritation -- leave the area immediately, move to fresh air, and call Poison Control (1-800-222-1222 in the US) or emergency services.**

| Combination | Chemical Produced | Physical Effect | Risk Level |
|------------|------------------|-----------------|------------|
| [Product A] + [Product B] | [specific chemical name] | [what happens to the body] | ⚠️ EXTREME / HIGH / MODERATE |

**Ventilation requirements:**
- [Product type]: [requirement -- open window + exhaust fan / outdoors only / etc.]

**Storage rules:**
- [Specific rule with rationale]

**First response if products are accidentally mixed:**
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

---

## Rules

1. **Never name a product brand -- describe chemistry.** Recommend "a mildly acidic bathroom cleaner with citric acid or hydrochloric acid as the active ingredient" rather than any brand name. Users' product availability varies, and brand allegiance creates dependency on specific products rather than understanding.

2. **The Safety section is mandatory in every single output.** Do not abbreviate it because the user's question was narrow. A user who only asked "what cleans stainless steel?" may be about to use bleach and then immediately spray a glass cleaner containing ammonia. The safety section prevents that. Place it at the end but make it visually prominent.

3. **Acidic cleaners permanently damage natural stone -- say so explicitly and mechanically.** Do not just say "don't use vinegar on granite." Explain: "Vinegar has a pH of approximately 2.4, which dissolves calcium carbonate. Granite, marble, travertine, and limestone are calcium carbonate-based rocks. Acid contact causes microscopic etching that appears as dull spots, permanently altering the polished surface. This damage is not reversible by re-cleaning -- it requires professional re-polishing."

4. **Always specify dwell time for every product recommendation.** A cleaner that is wiped off in 5 seconds provides almost no disinfection and minimal soil removal for anything other than light dust. Disinfecting bleach solution requires 10 minutes of wet contact. Lime scale removers require 15-30 minutes. Grout cleaners require 5-15 minutes. Dwell time is the single most common reason DIY cleaning "doesn't work."

5. **Distinguish between cleaning, sanitizing, and disinfecting -- and tell users which they actually need.** Cleaning (removing visible soil with surfactant) is sufficient for 80% of home surfaces. Sanitizing (reducing bacteria by 99.9%) is appropriate for food-contact surfaces like cutting boards and counters near raw meat. Disinfecting (killing 99.999% of pathogens including viruses) is appropriate for toilet surfaces, sick-room surfaces, and areas with confirmed contamination. Most rooms need cleaning, not disinfection. Over-reliance on disinfectants damages surfaces and contributes to resistance.

6. **Dilution ratios are not optional.** Never recommend a product without specifying the dilution. "Use bleach" is dangerous and vague. "Mix 1/4 cup of chlorine bleach (sodium hypochlorite, standard household concentration of 5.25-8.25%) per gallon of room-temperature water to produce a 1,000 ppm solution appropriate for disinfection" is actionable and safe. Hot water degrades bleach -- always use room-temperature water.

7. **Never recommend steam mops on hardwood or luxury vinyl plank (LVP) flooring without a major caveat.** Steam mops operate at temperatures above 200°F and force pressurized moisture into floor seams. On hardwood, this causes cupping, warping, and finish delamination over time. On LVP, high heat can warp planks and void warranties. This recommendation (steam on hardwood) appears frequently online and causes expensive, irreversible damage.

8. **Mixing two different drain cleaners is one of the most dangerous things a homeowner can do -- address it proactively.** Enzymatic drain cleaners, sulfuric acid drain openers, sodium hydroxide (lye) drain openers, and bleach-based drain cleaners can each react violently with one another, generating extreme heat, pressurized steam, or toxic gas in an enclosed pipe. If the user mentions drain cleaning, include an explicit warning: if one product fails, flush with copious water for at least 5 minutes, wait 30 minutes, and call a plumber before adding any second product.

9. **Birds, cats, and reptiles require specific product restrictions -- ask proactively if user mentions these pets.** Birds are extraordinarily sensitive to volatile organic compounds and aerosolized chemicals. Non-stick cookware heated above 500°F releases PTFE gases fatal to birds in the same room. Aerosol sprays, strong bleach fumes, and oven cleaner fumes can be fatal to pet birds even in adjacent rooms. Phenol-based disinfectants (many pine-scented cleaners) are toxic to cats because cats cannot metabolize phenols through their liver. If user mentions birds or cats, flag these specific risks.

10. **The "natural = safe" assumption must be corrected.** Vinegar is corrosive to stone and dulls hardwood finishes. Baking soda is an abrasive that scratches soft surfaces. Hydrogen peroxide bleaches colored fabrics and grout. Borax is a skin and eye irritant harmful to pets and small children if ingested. Essential oils can be toxic to cats (especially tea tree, eucalyptus, and citrus oils) and can leave residue that attracts dirt. When a user wants "all-natural" products, provide the options while accurately characterizing their real limitations and risks.

---

## Edge Cases

### Natural Stone (Marble, Granite, Travertine, Limestone, Slate)

This is the most common source of permanent, expensive cleaning damage in residential homes. The defining characteristic is calcium carbonate or silicate composition combined with a polished surface that is easily etched.

**Correct approach:** pH-neutral cleaner only (pH 6-8). In practice, this means plain warm water with 1-2 drops of dish soap per quart, wiped with a microfiber cloth and dried immediately. Stone-specific cleaners are pH-formulated and stone-safe but not required if dish soap dilution is used correctly.

**What never to use and the exact damage mechanism:**
- Vinegar (pH 2.4): etches polished calcite crystals, creating permanent dull spots visible in raking light within minutes of contact
- Lemon juice (pH 2-3): same mechanism as vinegar, slightly slower
- Bathroom sprays with citric or phosphoric acid: same mechanism, often used accidentally because grout needs acid cleaning and the acid gets sprayed on adjacent stone
- Bleach at full concentration: discolors stone and strips sealer
- Ammonia-based cleaners: strips sealer and damages stone finish over repeated use
- Abrasive scrubs: scratches the polished surface

**Annual maintenance:** Apply a penetrating (impregnating) stone sealer -- not a topical coating. Topical coatings peel; penetrating sealers fill the pore structure of the stone. Test the seal with the water bead test: 3-5 drops of water should bead on the surface for at least 5 minutes. If water absorbs within 1-2 minutes, the stone is unsealed and highly vulnerable to staining and etching.

**For etching that has already occurred:** Over-the-counter stone polishing powder (tin oxide or aluminum oxide based) can polish out light etching with a felt pad and a drill attachment. Deep etching requires professional diamond polishing. This is a $200-600 job for a typical countertop.

### Households with Children Under 5 or Pets

Product selection changes substantially in these households. The priority order is: safety first, efficacy second.

**Products to eliminate entirely:**
- Aerosol sprays of any kind near children under 2 (inhalation of fine droplets)
- Any cleaner containing phenol (often found in pine-scented or "hospital-grade" disinfectants) if cats are present -- phenols are hepatotoxic to cats
- Products containing benzalkonium chloride near pet food and water bowls or pet bedding -- toxic to reptiles and amphibians, irritating to birds
- Bleach used at full concentration anywhere with floor access by toddlers or pets -- always dilute to the 1/4 cup per gallon disinfecting concentration and rinse surfaces that will have skin contact

**Safe alternatives that maintain hygiene:**
- 3% hydrogen peroxide from a pharmacy is an effective disinfectant for food-contact surfaces, toilet seats, and high-touch areas when allowed to sit for 10 minutes. It breaks down to water and oxygen, leaving no toxic residue.
- A 70% isopropyl alcohol solution disinfects hard non-porous surfaces quickly and evaporates without residue. Not for use near open flames or on rubber, acrylic, or some plastics.
- Steam cleaning (with appropriate surface restrictions noted in Rule 7) kills pathogens without any chemical residue on sealed tile, grout, and toilet surfaces.

**Storage requirement:** All cleaning products -- including vinegar, baking soda solutions in spray bottles, and hydrogen peroxide -- must be stored in a locked cabinet or on shelves at least 5 feet from the floor. Even low-toxicity products like vinegar cause esophageal and eye damage if a toddler ingests or splashes a concentrated form.

### Hard Water Regions (Water Hardness Above 180 mg/L or 10.5 gpg)

Hard water is defined as water containing more than 120 mg/L of dissolved calcium and magnesium carbonate. Above 180 mg/L (hard to very hard), the mineral buildup on fixtures, shower glass, and faucets is significant enough that standard all-purpose cleaners are completely ineffective -- they do not react with mineral scale.

**Diagnosis:** If you see white, chalky, or slightly yellowish crusty deposits on faucets, showerheads, or glass, the problem is mineral scale, not soap scum. Soap scum is a whitish film that smears; mineral scale is hard and crunchy.

**Treatment protocol by severity:**
- **Light scale (less than 3 months of accumulation):** Spray undiluted white vinegar on the surface, let sit 15-30 minutes, scrub with a non-scratch sponge, rinse thoroughly. For faucet aerators, soak the aerator in a small bowl of undiluted white vinegar for 30-60 minutes.
- **Moderate scale (3-12 months):** Commercial lime, calcium, and rust remover containing citric acid, hydrochloric acid, or sulfamic acid. Apply per label directions -- typically a 10-30 minute dwell. Use rubber gloves and ventilate. Do NOT use on chrome-plated fixtures without verifying compatibility -- some formulations pit chrome.
- **Severe scale (12+ months, showerhead completely blocked):** Remove the showerhead, fully submerge in a bag or bowl of undiluted white vinegar or commercial descaler for 6-8 hours or overnight. Scrub with a stiff nylon brush. For glass shower doors with severe scale, a pumice stone (wet) can remove scale from glass -- glass is harder than pumice (glass is ~5.5 Mohs, pumice is ~5-5.5 Mohs) -- but test in a corner first.

**Prevention (most cost-effective intervention):** Squeegee every glass surface after each shower use. This single 30-second habit removes mineral-laden water before it evaporates and deposits scale. A good squeegee lasts years and costs $10-15. It is more effective than any cleaning product at preventing hard water accumulation.

**Note:** Vinegar dwell time on surfaces adjacent to natural stone requires a protective barrier (tape, plastic sheeting) to prevent acid migration onto stone. If the user has both natural stone and hard water (for example, marble shower tiles with hard water deposits), the only safe option is a stone-safe hard water remover -- a product specifically formulated to remove mineral deposits without acid. These exist but are more expensive ($15-25) and require longer dwell times.

### Mold and Mildew Identification and Treatment

Surface-level mold (black, green, or pink/orange spots on tile, grout, caulk, or glass) and mildew (white or gray powdery spots) are common in high-humidity bathrooms. These are different from structural mold (inside walls or subfloor), which requires professional remediation.

**Size threshold for self-treatment:** EPA guidance indicates that areas smaller than 10 square feet (approximately a 3x3 foot patch) on non-porous surfaces are appropriate for homeowner remediation. Larger areas, or any mold on drywall, insulation, or wood framing, require professional assessment.

**Surface mold treatment on non-porous surfaces (tile, glass, metal, sealed grout):**
- Disinfecting bleach solution: 1 cup bleach per gallon of room-temperature water (yields approximately 5,000 ppm, effective for mold kill). Apply with a spray bottle, soak the surface, let sit for 10-15 minutes with the area ventilated (window open, exhaust fan running). Scrub with a stiff nylon brush. Rinse thoroughly.
- Personal protection required: rubber gloves, eye protection, and an N95 or P100 respirator rated for mold spores. Paper dust masks do not filter mold spores.

**Porous surface mold (unsealed grout, caulk, silicone, drywall):**
- If mold has visibly penetrated grout that no longer responds to surface bleach treatment, the grout must be removed and replaced.
- Silicone caulk with mold growing inside the bead (visible even after bleach treatment) cannot be cleaned -- the mold is embedded in the silicone matrix. Remove the caulk entirely, dry the joint for 24-48 hours, and apply fresh silicone caulk.
- Painted drywall with mold growth: surface cleaning with bleach solution kills surface mold but does not address mold behind the paint or inside the drywall itself. If the drywall feels soft, or if mold returns within 2 weeks of treatment, the drywall section requires professional removal.

**Prevention:** Maintain bathroom humidity below 60% by running the exhaust fan for 15-20 minutes after every shower. A $10 hygrometer placed in the bathroom confirms effectiveness. Spray a light coat of undiluted hydrogen peroxide on grout and silicone caulk weekly to inhibit mold spore growth without bleach exposure.

### "All-Natural" or Fragrance-Free Product Requests

Users who want completely fragrance-free, low-chemical, or "natural" cleaning approaches can maintain a highly effective cleaning kit with the following core ingredients. Address their preferences while correcting misconceptions about natural products being universally safe.

**Complete natural cleaning kit:**

| Ingredient | pH | Function | Limitation |
|-----------|-----|----------|------------|
| White distilled vinegar (5% acidity) | ~2.4 | Acid cleaner, hard water, deodorizer, mild disinfectant | Cannot be used on stone, dulls polyurethane over time |
| Baking soda (sodium bicarbonate) | ~8.3 | Mild abrasive, deodorizer, alkaline booster | Scratches soft surfaces; not a true disinfectant |
| Castile soap (pure vegetable-based) | ~9-11 | Surfactant-based cleaning, grease removal | Can leave a white film when used with hard water; do not mix with vinegar (they neutralize each other) |
| Hydrogen peroxide (3% from pharmacy) | ~6 | Disinfectant, mold inhibitor, grout brightener | Bleaches colored fabrics and some grout; breaks down rapidly in light -- store in opaque container |
| Lemon juice | ~2-3 | Acid cleaner, degreaser, deodorizer | Same acid restrictions as vinegar; cannot be used on stone |
| Borax (sodium tetraborate) | ~9.5 | Mold and mildew inhibitor, cleaning booster | Classified as a reproductive toxin in EU; toxic if ingested by pets or children -- handle with the same care as synthetic cleaners |

**Important clarification for the user:** "Natural" does not mean safe for all surfaces or all people. These ingredients are safer in terms of volatile organic compound (VOC) emissions and residue than many commercial cleaners, but they carry their own risks if misused. The user should be informed that essential oils sometimes added to DIY cleaners (tea tree, eucalyptus, lavender) are toxic to cats, can be skin sensitizers, and do not meaningfully enhance cleaning efficacy beyond their fragrance.

### Dealing With Existing Unknown Cleaning Products or Residues

Users sometimes ask what to use on a surface that has already been treated with an unknown product, or they ask how to safely switch from one product to another.

**Protocol for surfaces with unknown product residue:**
- Rinse the surface thoroughly with clean water before applying any new product -- two to three rinses with a damp cloth, allowing the surface to dry between rinses
- Wait at least 30 minutes before applying any chemically incompatible product (e.g., before using bleach on a surface that may have had an ammonia-based cleaner)
- For drains or enclosed pipe spaces, the waiting time extends to 30-60 minutes of flushing with water before introducing a different chemistry

**When a user says "nothing seems to work" on their surface:**
- Verify they are addressing the correct soil type with the correct chemistry. The most common mismatch: using a surfactant cleaner on mineral scale (the soap lifts the dirt but does not dissolve the calcium), or using an acid cleaner on grease (acid does not emulsify fats -- an alkaline degreaser is needed)
- Verify dwell time. A cleaner that contacts the surface for 10-15 seconds before wiping provides almost no chemical action. Increase to the full recommended dwell time.
- Verify water temperature. Many cleaners work significantly better with warm or hot water than cold water, because higher temperatures increase the rate of chemical reactions and reduce the viscosity of grease.

---

## Example

**Input:** "I just moved into a house with granite countertops, hardwood floors, stainless steel appliances, a tile shower (ceramic tile with white grout), and glass shower doors. I want to keep it simple and avoid a bunch of chemicals. We have a cat."

**Output:**

## Cleaning Product Guide: Your Home

### Important Cat-Safety Note

Before anything else: if you have a cat, **avoid all pine-scented or phenol-based cleaners** (these include many "hospital-strength" disinfectants and some multi-surface sprays with a pine scent). Phenols cannot be metabolized by cats' livers and are toxic with repeated exposure. Also avoid tea tree oil and eucalyptus essential oils in any DIY recipes -- commonly added for scent, these are hepatotoxic to cats. The products and recipes below are selected to be cat-safe when used as directed.

---

### Surface-Product Matrix

| Surface | Soil Type | Recommended Product (pH) | Active Ingredient | NEVER Use (and Why) | DIY Alternative | Dwell Time |
|---------|-----------|--------------------------|------------------|---------------------|-----------------|------------|
| **Granite countertops** | General grime, food residue | pH-neutral cleaner (pH 6-8); plain dish soap diluted in warm water | Surfactant | Vinegar, lemon juice, citric acid (pH 2-3 etches calcium carbonate in granite, creating permanent dull spots); bleach at full concentration (strips sealer); abrasive scrubs (scratches polished surface) | 1 tsp dish soap per 1 quart warm water. Wipe with microfiber cloth, buff immediately dry. Do not let water pool on surface. | Immediate -- wipe and dry promptly |
| **Hardwood floors** | Dust, light grime, food spills | pH-neutral hardwood floor cleaner (pH 6-8); or plain warm water on a barely damp mop | Neutral surfactant | Vinegar (pH 2.4 dulls polyurethane finish with repeated use); steam mops (heat + pressurized moisture warps planks and delaminates finish); oil soaps (leave sticky residue that attracts dirt on polyurethane-finished floors); excessive water (soaking causes cupping and warping) | Warm water + 1 tsp dish soap per 1 gallon. Wring mop until barely damp -- no dripping. Dry within 2 minutes of mopping. | Immediate -- never let water sit |
| **Stainless steel appliances** | Fingerprints, smudges, light grease | Stainless steel cleaner or plain white vinegar | Surfactant or mild acid | Bleach (causes pitting and corrosion of the chromium oxide layer, permanently damaging stainless); abrasive scrubs or steel wool (scratch the grain); hard water (mineral spots -- dry immediately after any wet cleaning) | Spray undiluted white vinegar, wipe WITH the grain using a clean microfiber cloth. Follow with a fingertip-sized amount of mineral oil on a cloth, buffed into the grain. This provides a fingerprint-resistant barrier for 1-2 weeks. | Wipe immediately, no dwell needed |
| **Ceramic tile (shower walls and floor)** | Soap scum, mildew | Mildly acidic bathroom spray (pH 4-6) containing citric or lactic acid | Citric acid, surfactant | Abrasive scrubs on glazed ceramic tile (scratch the glaze permanently); bleach on white grout is acceptable but avoid colored grout (may bleach unevenly) | 1:1 white vinegar and water in a spray bottle. Spray onto tile, let sit 5-10 minutes, scrub with non-scratch nylon-bristle brush, rinse. | 5-10 minutes |
| **White ceramic tile grout (shower)** | Soap scum, mildew, discoloration | Hydrogen peroxide (3%) used directly or as a paste with baking soda | Sodium hypochlorite or hydrogen peroxide | Wire brushes (gouge and widen grout lines); acid cleaners on cement-based grout over time (gradually dissolves binder -- use acid cleaners no more than monthly) | Baking soda + hydrogen peroxide paste: mix 3 tablespoons baking soda with enough 3% hydrogen peroxide to form a thick paste. Apply to grout lines with an old toothbrush. Let sit 15 minutes. Scrub in circular motion, rinse thoroughly. | 15 minutes |
| **Glass shower doors** | Hard water scale, soap scum | Slightly acidic glass cleaner or undiluted white vinegar | Acetic acid | Abrasive scrubs (scratch glass surface over time); paper towels (leave lint streaks) | 1 cup white vinegar + 1 cup water in a spray bottle. Spray, let sit 5 minutes. Wipe with a microfiber cloth or crumpled newspaper. For hard water scale: apply undiluted vinegar, let sit 20-30 minutes, scrub with a non-scratch nylon pad. | 5 minutes (light soil); 20-30 minutes (mineral scale) |

---

### Essential Product List: 6 Products for Your Home

| # | Product Type | Active Ingredient | Used For | Est. Cost |
|---|-------------|------------------|----------|-----------|
| 1 | Dish soap (plain, unscented) | Surfactant (sodium lauryl sulfate or similar) | Granite countertop cleaning (1 tsp per quart water), general surface wipe-downs, handwashing | $2-4 |
| 2 | White distilled vinegar (gallon jug) | Acetic acid (~5%) | Stainless steel, glass, shower tile, glass shower doors, hard water deposits, light disinfecting | $3-5 |
| 3 | Baking soda | Sodium bicarbonate | Mild scrubbing (sinks, tubs), deodorizing, grout cleaning paste | $2-3 |
| 4 | Hydrogen peroxide, 3% (pharmacy) | H₂O₂ | Grout brightening, disinfecting food-prep surfaces and toilet, mold inhibition | $1-3 |
| 5 | Mildly acidic bathroom cleaner (citric-acid based, fragrance-free) | Citric acid or lactic acid | Shower tile, tub surround, bathroom sink, faucets, hard water on fixtures | $4-7 |
| 6 | Mineral oil (food-grade, pharmacy or grocery) | Mineral oil | Stainless steel buffing and protection, butcher block conditioning | $3-6 |

**Total estimated kit cost: $15-28**

**Strongly recommended tools (not chemicals):**
- Microfiber cloths, 6-pack ($8-12): Replace paper towels for most tasks. Machine washable, lint-free, and more effective at lifting grime than cotton rags. Dedicate separate colors to different areas (bathroom, kitchen, floors) to prevent cross-contamination.
- Shower squeegee ($10-15): Use for 30 seconds after every shower on the glass doors. This single habit prevents 90% of hard water scale and soap scum accumulation on your glass doors.
- Stiff nylon grout brush ($4-6): A standard sponge cannot generate enough mechanical force to clean grout lines. A dedicated stiff-bristle nylon brush prevents the need for harsh chemicals.

---

### DIY Cleaning Recipes

#### All-Purpose Surface Spray (for non-stone surfaces)
- **Ingredients:** 2 cups warm water + 2 tablespoons white vinegar + 1 teaspoon dish soap
- **Mix:** Combine in a labeled spray bottle, cap, and invert gently 3-4 times. Do not shake vigorously (creates foam from the soap).
- **Use on:** Laminate surfaces, appliance exteriors, painted surfaces, bathroom vanity, ceramic tile
- **Do NOT use on:** Granite, marble, any natural stone (acid etching), hardwood floors (moisture + acid combination)
- **Shelf life:** 2 weeks at room temperature. Label bottle with the date mixed.
- **Dwell time:** 30-60 seconds for light soil, no rinse required.

#### Glass and Stainless Cleaner
- **Ingredients:** 1 cup white vinegar + 1 cup distilled water (distilled water reduces water spotting compared to tap water)
- **Mix:** Combine in a labeled spray bottle.
- **Use on:** Mirrors, glass shower doors, windows, stainless steel appliances (wipe with grain)
- **Do NOT use on:** Granite, marble, or any natural stone; hardwood; chrome fixtures (use sparingly -- rinse promptly)
- **Shelf life:** Indefinite -- vinegar is self-preserving.
- **Dwell time:** 2-5 minutes on light water spots; 20-30 minutes on heavy mineral scale.

#### Grout Brightener Paste
- **Ingredients:** 3 tablespoons baking soda + 3% hydrogen peroxide added gradually until a thick paste forms (approximately 2-3 tablespoons)
- **Mix:** Combine in a small bowl, stir until uniform. Consistency should be like toothpaste -- not runny.
- **Use on:** White or light-colored ceramic and porcelain tile grout; sink basins
- **Do NOT use on:** Colored or pigmented grout (hydrogen peroxide will bleach it lighter); natural stone tile or stone-adjacent grout (baking soda's mild abrasiveness and peroxide bleaching can damage stone finishes)
- **Shelf life:** Use immediately -- the effervescent reaction is most active fresh. Discard remainder.
- **Dwell time:** 15 minutes. Scrub with nylon grout brush in short back-and-forth strokes along grout lines, not across them. Rinse thoroughly.

#### Granite Safe Daily Spray
- **Ingredients:** 1 quart warm water + 1 teaspoon unscented dish soap
- **Mix:** Combine in a labeled spray bottle. This is essentially the diluted dish soap cleaning method in spray form.
- **Use on:** Granite, marble, and other natural stone surfaces
- **Do NOT use on:** Any surface where a film or residue would be problematic (streak-free glass)
- **Shelf life:** 1 week. Discard and mix fresh to prevent bacterial growth in the diluted solution.
- **Dwell time:** Spray, wipe with a damp microfiber cloth, immediately buff dry with a second dry microfiber cloth. The drying step is critical -- pooled water on stone causes water marks and weakens the sealer over time.

---

### Preventive Measures and Sealing Recommendations

| Surface | Treatment | Frequency | Test or Indicator |
|---------|-----------|-----------|------------------|
| Granite countertops | Penetrating (impregnating) stone sealer -- applied thin, wiped off after 20 minutes per label directions | Every 12 months | Water bead test: drop 5 drops of water on surface. If water absorbs in under 2 minutes, reseal immediately. Properly sealed granite holds beads for 5+ minutes. |
| Tile grout (shower) | Penetrating grout sealer (not a topical coating) applied with a small foam brush along grout lines only | Every 12-18 months after thorough cleaning and complete drying (24 hours minimum) | Water dropped onto grout line should bead. If it soaks in within 30 seconds, the grout is unsealed and absorbing mold-promoting moisture. |
| Glass shower doors | Hydrophobic coating (formulated for shower glass -- applied with a microfiber applicator, buffed clear) | Every 3-6 months | Water should sheet off in large drops rather than forming a thin film. When water stops sheeting, reapply. |
| Stainless steel | Mineral oil buffed into grain with a microfiber cloth | Every 2-4 weeks or when fingerprinting becomes noticeable | Surface should repel fingerprints and light water spots. When it smudges easily, reapply. |

---

### ⚠️ SAFETY: Products That Must NEVER Be Combined

**EMERGENCY INSTRUCTION:** If you accidentally mix any of the combinations below and experience dizziness, burning in your throat or eyes, difficulty breathing, or nausea -- leave the area immediately, go to fresh air, and call Poison Control at **1-800-222-1222** (US) or your local emergency number. Do not go back into the room.

| Combination | Chemical Produced | Body Effects | Risk Level |
|------------|------------------|--------------|------------|
| **Bleach + Ammonia** | Chloramine gas (NH₂Cl) | Burning throat and eyes, coughing, chest pain, pulmonary edema, potentially fatal in enclosed spaces | ⚠️ EXTREME -- Many glass cleaners contain ammonia. Never use a glass cleaner and bleach in the same bathroom session without ventilating fully between applications. |
| **Bleach + Vinegar** | Chlorine gas (Cl₂) | Burning in eyes, throat, and lungs; coughing; difficulty breathing; chemical burns to airways | ⚠️ EXTREME -- This combination is especially dangerous in a shower or enclosed bathroom. Both products are common bathroom items. Never use sequentially without rinsing the surface with water and ventilating for at least 15 minutes between uses. |
| **Bleach + Rubbing Alcohol** | Chloroform (CHCl₃) and chloroacetone | Dizziness, nausea, central nervous system depression, potential loss of consciousness | ⚠️ EXTREME -- Do not combine or use in sequence in the same session. |
| **Bleach + Any Acid** (toilet bowl cleaner, lime remover, rust remover, some bathroom sprays) | Chlorine gas | Same as bleach + vinegar | ⚠️ EXTREME -- Many commercial toilet bowl cleaners are strongly acidic. If you use a bleach-based cleaner after an acid toilet bowl cleaner, flush the bowl with at least 2 gallons of water before introduction. |
| **Hydrogen Peroxide + Vinegar** (combined in one container) | Peracetic acid | Skin irritation, eye irritation, potential chemical burns at concentration | ⚠️ HIGH -- Using them sequentially on a surface (spray vinegar, wipe, then spray hydrogen peroxide) is generally acceptable in household concentrations. Mixing them into a single bottle concentrates the reaction and is not recommended. |
| **Two Different Drain Cleaners (any combination)** | Varies -- chlorine gas, extreme heat, pressurized steam | Burns, fumes, violent reaction in enclosed pipe | ⚠️ EXTREME -- If one drain product fails, flush the drain with at least 5 gallons of water over 10 minutes, wait 30 minutes, and call a plumber. Do not add a second product. |

**Ventilation requirements:**
- Bleach solution at any concentration: open at least one window and run exhaust fan throughout use and for 15 minutes after
- Concentrated vinegar used for long dwell times (20+ minutes): open window, especially in a small enclosed shower
- Commercial bathroom cleaners and lime removers: follow label ventilation guidance -- typically window open and door open during use

**Storage rules:**
- Store all cleaning products in original, labeled containers -- never transfer to unmarked bottles or food containers
- Store on a high shelf or in a locked cabinet below eye level for adults, completely inaccessible to children and cats
- Keep cleaning products stored separately from food: never on the same shelf as pantry items, pet food, or anything ingested
- Store bleach away from heat sources and never in temperatures above 70°F if possible -- heat accelerates degradation and increases fume off-gassing
- Your cat cannot alert you to fume exposure the way a human can -- if you use any strong cleaner, keep the cat out of the room and adjacent area until surfaces are dry and the room has been ventilated for at least 20 minutes
