---
name: stain-removal-guide
description: |
  Quick reference for removing common stains from clothing and fabrics - matched by stain type, fabric type, and chemical solution with step-by-step techniques.
  Use when the user asks about stain removal guide, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of stain removal guide or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart home-maintenance guide step-by-step testing cleaning"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Stain Removal Guide

## When to Use

**Use this skill when:**
- A user reports a specific stain (fresh or set) on clothing, upholstery, carpet, or household fabrics and needs targeted removal instructions
- A user asks which cleaning agent to use for a stain on a specific fabric type (e.g., "I got red wine on my silk blouse")
- A user wants to understand why a previous stain removal attempt failed and how to correct it
- A user needs emergency guidance for a stain in progress -- at a restaurant, event, or away from home supplies
- A user wants to understand DIY stain removal solutions they can make from household ingredients
- A user needs to treat a set or dried stain that has already been through a wash cycle
- A user wants to know whether an item requires professional cleaning versus safe home treatment

**Do NOT use when:**
- The stain is on a hard surface such as stone countertops, tile grout, or wood floors -- use a surface-specific cleaning skill instead
- The item has explicit "dry clean only" or "professional clean only" labeling and the user is not asking about emergency blotting -- redirect to professional dry cleaning advice
- The stain involves hazardous chemicals (industrial solvents, corrosives, pesticides) on skin or in a living space -- escalate to safety guidance
- The user is asking about carpet deep-cleaning as a routine maintenance task rather than stain-specific treatment -- use a carpet-care skill
- The fabric is antique, heirloom, museum-grade, or a couture garment with unknown fiber content -- recommend textile conservator consultation only
- The user is asking about stain prevention products or fabric protectors as a separate purchase question -- that is a product-recommendation skill
- The question is about disinfecting or sanitizing rather than stain removal -- those have different chemistry and goals

---

## Process

### Step 1: Triage -- Gather the Four Key Variables

Before recommending any treatment, identify all four of the following. If any are unknown, ask. Do not skip this step even for simple queries.

- **Stain type:** What substance caused the stain? Narrow to category: protein (blood, egg, dairy, sweat), tannin (coffee, tea, wine, fruit), oil/grease (cooking oil, butter, motor grease, makeup), dye (ink, berry, grass), chemical (rust, mold, paint, adhesive), or combination (e.g., pizza = grease + tomato + cheese)
- **Fabric type:** What is the garment or fabric made of? Check the care label. Key distinctions: protein fibers (wool, silk, cashmere) vs. cellulose fibers (cotton, linen) vs. synthetics (polyester, nylon, acrylic) vs. blends. Also note construction: knit, woven, pile (velvet, corduroy), or non-woven (felt)
- **Stain age:** Fresh (under 1 hour), recent (1--24 hours), set (washed and dried), or unknown/old. This changes both product selection and required soak time dramatically
- **Previous treatment attempts:** Has the user already applied heat, bleach, commercial stain remover, or rubbing? Prior treatment can complicate or restrict what is safe to use next

### Step 2: Classify the Stain Chemistry

This determines the correct first-line solvent. Using the wrong chemistry wastes time and can set the stain permanently.

- **Protein stains** (blood, sweat, egg, dairy, urine, vomit, glue): Broken down by cold water, enzyme cleaners (protease enzymes), and dilute hydrogen peroxide. Destroyed by heat -- never use hot water or a dryer before full removal
- **Tannin stains** (coffee, tea, red/white wine, beer, fruit juice, cola): Respond to white vinegar, dilute dish soap, and oxidizing agents (oxygen bleach, hydrogen peroxide). Do NOT use soap bars (bar soap sets tannins on cotton)
- **Oil/grease stains** (cooking oil, butter, salad dressing, body lotion, sebum, lipstick, mascara): Require a surfactant (dish soap, undiluted) or an absorbent pre-treatment (cornstarch, talcum powder, baking soda) followed by a degreaser. Water alone is useless -- oil is hydrophobic
- **Dye stains** (ink, grass, berries, beet, turmeric, soy sauce): Require alcohol-based solvents (isopropyl alcohol 70--90%), commercial dye-removing agents, or oxidizing bleach. Among the most difficult category; grass specifically contains chlorophyll which bonds with fabric dyes
- **Oxidative stains** (rust, mold/mildew): Rust requires an acid (lemon juice, white vinegar, commercial oxalic acid products). Mold requires an antimicrobial oxidizer (3% hydrogen peroxide, dilute bleach on safe fabrics only)
- **Combination stains**: Treat the grease/oil component first (absorbent + surfactant), then address any protein or tannin component. Treating in wrong order can set one component while removing another

### Step 3: Check Fabric Compatibility

Apply the fabric-treatment matrix before recommending any chemical. This prevents irreversible damage.

- **Silk and wool (protein fibers):** Cold water only. pH-neutral detergent. No bleach of any kind. No vinegar (acetic acid degrades wool proteins over time). No agitation or wringing. No enzyme cleaners on wool (proteases attack wool fiber). Hydrogen peroxide at 3% is acceptable on white silk for brief contact (under 5 minutes)
- **Cotton and linen (cellulose fibers):** Most robust. Can withstand dilute bleach (1 tablespoon per gallon of water, 5-minute contact max for colored cotton). Hot water safe. Enzyme cleaners safe and effective. Oxygen bleach (sodium percarbonate) is the preferred bleach for colored cotton
- **Polyester, nylon, acrylic (synthetics):** Avoid high heat (above 104°F / 40°C wash temperatures) as it can set oil stains into synthetic fibers. Dish soap, enzyme cleaners, alcohol, and vinegar all safe. Avoid acetone on acetate fabrics (it dissolves acetate)
- **Blends:** Default to the most restrictive fiber present. A 60/40 cotton-polyester blend should follow polyester heat restrictions even though cotton can handle more
- **Special constructions:** Velvet and corduroy -- never rub or press hard, work with the nap using blotting only. Leather -- damp cloth only, then leather conditioner. Suede -- dry methods only (suede eraser, soft brush); water creates permanent tide marks

### Step 4: Select the Treatment Protocol

Match stain chemistry + fabric compatibility to one of five protocol types:

- **Protocol A -- Cold Flush + Enzyme:** For fresh protein stains on washable fabrics. Flush from the back with cold water for 60 seconds. Apply enzyme-based laundry pre-treater or liquid laundry detergent (which contains protease enzymes). Let sit 15--30 minutes. Wash in coldest safe temperature for that fabric
- **Protocol B -- Absorbent + Surfactant:** For oil/grease stains. Cover immediately with cornstarch, baby powder, or baking soda. Wait 10--15 minutes for absorbent to draw out oil. Brush off. Apply undiluted dish soap directly. Work in gently with fingertip (no scrubbing). Let sit 10 minutes. Flush with warm water from the back. Repeat if needed before washing
- **Protocol C -- Acid + Oxidizer:** For tannin stains (coffee, tea, wine). Blot excess. Apply white distilled vinegar (5% acidity) for 2 minutes. Blot. Apply a paste of oxygen bleach powder (sodium percarbonate) + water. Let sit 20--30 minutes. Rinse. Wash with enzyme detergent at warmest safe temperature
- **Protocol D -- Solvent:** For dye-based stains (ink, grass, markers). Apply isopropyl alcohol 70--90% to a clean white cloth. Blot (never pour directly -- floods the stain outward). Work from outer edge inward. Change to a clean section of cloth with each blot. Follow with dish soap and cold rinse. For permanent marker or printer ink, repeat solvent step 4--6 times before washing
- **Protocol E -- Dry Method / Mechanical:** For wax, chewing gum, tar, dried mud. Freeze item or apply ice pack until material is brittle. Scrape with dull plastic scraper or credit card edge. Remove maximum solid material mechanically before applying any liquid. For wax residue on fabric, lay two layers of plain brown paper over the spot and press with iron at low heat -- wax migrates into the paper. Repeat with fresh paper until no more wax transfers

### Step 5: Execute the Treatment -- Technique Matters

The physical technique is as important as the chemistry. Poor application ruins otherwise correct solutions.

- **Always work from the outside edge inward** in concentric circles to prevent creating a tide mark (ring stain) around the treated area
- **Blot, never rub.** Press clean white cloth or paper towel firmly onto the stain and lift straight up. Lateral rubbing physically drives pigment molecules deeper into the fiber matrix and spreads contamination area by 30--50%
- **Apply solution to the cloth, not the fabric** for delicate items -- this gives more controlled saturation
- **Flush from the reverse side** where possible. Water pressure pushes the stain back out through the face of the fabric rather than driving it deeper. Hold the stained section over a sink and run cold water through the underside
- **Never over-saturate.** Excess liquid spreads the stain perimeter and can cause dyes in the fabric itself to bleed. Use the minimum effective volume
- **Dwell time discipline:** Set a timer. Under-treating (insufficient dwell time) leaves stain residue. Over-treating (leaving active bleach or enzyme on fabric beyond recommended time) can weaken fiber structure

### Step 6: Assess and Iterate Before Heat

This step prevents the single most common irreversible error -- running a stain through the dryer.

- After rinsing, inspect the stain in natural daylight or bright white light (yellow incandescent bulbs mask yellow and orange stains)
- If the stain is 80% or more reduced but not fully gone, a second treatment cycle will complete the job -- most stains require 2--3 cycles for full removal
- If the stain is unchanged after two full cycles, switch protocols: either the chemistry is wrong for the stain type or the stain is set and requires a stronger oxidizing agent (oxygen bleach soak for 2--4 hours) or professional treatment
- **Do not place in dryer** until the stain is 100% gone. Heat polymerizes protein and oil residues, creating covalent bonds with fiber molecules that no household product can break. Air dry flat (especially for wool, silk, structured garments). Check again once dry -- some stain residue is invisible when wet and becomes visible on drying

### Step 7: Wash and Verify

The final laundry treatment and confirmation step.

- Wash at the warmest temperature safe for the fabric type according to care label symbols (30°C / 86°F for wool and silk; 40°C / 104°F for most synthetics and blends; 60°C / 140°F for white cotton)
- Add an appropriate detergent: enzyme detergents (most liquid laundry detergents) for protein and food stains; oxygen bleach booster (sodium percarbonate, such as OxiClean) in the wash for tannin and dye stains; no bleach for colored items unless verified safe
- After washing, remove garment immediately. Do not leave wet in drum (mildew risk, color bleeding risk)
- Inspect again before any heat drying. Lay flat or hang to air dry
- If a faint shadow remains after one wash, a targeted enzyme soak (submerge garment in 1 gallon warm water + 2 tablespoons enzyme laundry powder for 2--4 hours) often resolves it on the second attempt

### Step 8: Set Expectations and Escalation Criteria

Not all stains are removable at home. Be honest with the user.

- **High probability of full removal (fresh stains, correct protocol applied promptly):** Coffee, tea, most food and drink stains, blood, sweat, mud, water-based paint, most makeup
- **Partial removal likely (set stains or complex chemistry):** Ink, red wine set overnight, grass, rust, mold, oil that has been heat-set in a dryer
- **Professional treatment required:** Turmeric (curcumin dye bonds tenaciously with cellulose; commercial enzymes are ineffective at home), saffron, permanent fabric dye transfer, extensive mold damage, "dry clean only" items, antique or delicate textiles
- **Likely permanent:** Oil stains that have been through a hot dryer multiple times, any stain on suede that was treated with water, bleach damage (bleach removes color -- it does not add a stain, but color loss is irreversible), fabric dye bleeds that have dried

---

## Output Format

When responding to a stain removal request, structure the answer using this template. Adapt length to urgency -- if the stain is fresh and in progress, lead with the Emergency First Response before any analysis.

```
## Stain Removal Guide: [Stain Type] on [Fabric Type]

### Situation Assessment
- Stain type: [identified category -- protein / tannin / oil / dye / chemical / combination]
- Stain age: [fresh / recent / set / unknown]
- Fabric: [fiber content and care label instructions]
- Complications: [any prior treatment, dye sensitivity, construction notes]
- Treatment protocol: [Protocol A/B/C/D/E and reasoning]

### Emergency First Response (if stain is in progress)
1. [Immediate action in plain language -- what to do RIGHT NOW]
2. [Secondary immediate action]
3. [What NOT to do -- the most likely mistake in this situation]

### Full Treatment Steps
**What you need:**
- [Supply 1 with specific form -- e.g., "white distilled vinegar, 5% acidity (not apple cider)"]
- [Supply 2 with specifics]
- [Supply 3]
- [Clean white cloths or paper towels (not colored -- dye can transfer)]

**Treatment:**
1. [Step 1 with technique detail]
2. [Step 2 with dwell time or temperature if relevant]
3. [Continue through all steps]

**Wash instructions:**
- Temperature: [specific °C or °F and cycle type]
- Detergent: [type and any additive]
- Post-wash: [air dry / check before drying instruction]

### If This Doesn't Work
- [What to try next if first protocol fails]
- [Signs the stain may need professional treatment]
- [Honest assessment of whether full removal is likely]

### Fabric-Specific Warnings
⚠️ [Any specific risks for this fabric -- bleach sensitivity, heat sensitivity, nap direction, etc.]
```

---

## Rules

1. **Never recommend hot water on an unidentified or protein stain.** If the stain type is unknown, always default to cold water first. Heat denatures protein and creates a bond with fiber that cannot be reversed. Cold water never makes a non-protein stain worse, but hot water can permanently ruin a protein stain.

2. **Never recommend mixing bleach and vinegar, bleach and ammonia, or bleach and hydrogen peroxide in the same treatment step.** Bleach and ammonia produce chloramine gas. Bleach and vinegar produce chlorine gas. These combinations are toxic. Always finish rinsing one chemical completely before applying the next.

3. **Always confirm fabric type before recommending enzyme cleaners on wool or cashmere.** Protease enzymes (the active ingredient in most enzyme stain removers) are derived from microbial proteases -- they attack protein-based fibers exactly as they attack protein-based stains. A 30-minute enzyme soak that would remove blood from cotton can weaken wool fiber structure measurably.

4. **Do not recommend acetone or nail polish remover on acetate, triacetate, or modacrylic fabrics.** Acetone dissolves acetate-based synthetic fibers entirely. Isopropyl alcohol is safe for these; acetone is not. If fabric content is unknown, test with a single cotton swab to an interior seam allowance.

5. **Instruct the user to test any new solution on a hidden area before full application** -- always the interior seam, inside hem, or underside collar. This is not optional even for well-known combinations. Fabric dyes vary enormously in their reaction to acids, alkalis, and solvents. Test contact time should match treatment contact time (minimum 2 minutes, then rinse and check after drying).

6. **If the user has already put the item through a hot dryer, manage expectations immediately.** Heat-set stains -- especially protein and oil stains -- are extremely resistant. An extended cold-water enzyme soak (4--8 hours) may still produce partial improvement, but full removal is unlikely. Do not withhold this information.

7. **Distinguish between oxygen bleach (sodium percarbonate) and chlorine bleach (sodium hypochlorite) in every recommendation.** They are not interchangeable. Oxygen bleach is color-safe on most fabrics (test first on deep-dyed items), effective on tannins, and biodegradable. Chlorine bleach is appropriate only for white cotton and linen, and even then requires dilution (no more than 1 tablespoon per gallon of water) and a maximum 5-minute contact time to prevent fiber degradation.

8. **Never recommend pouring boiling water directly onto silk, wool, synthetics, or any unknown fabric.** The boiling water pour technique (effective for berry and fruit stains on cotton) requires holding the fabric taut over a bowl and pouring from 12--18 inches height to generate hydraulic pressure, not heat. It only works on robust plant-fiber fabrics. On synthetics, boiling water can cause shrinkage or texture damage.

9. **For combination stains, always address the oil component first.** If the user has a stain with both a grease and a water-soluble component (pizza, salad dressing, spaghetti sauce), treating the water-soluble component first with water drives the grease deeper into the fiber while wetting it. Remove oil with cornstarch or dish soap first, then address the remaining tannin or protein component.

10. **Do not recommend commercial stain removers by brand name in a way that implies only one product will work.** Any product in a category functions by the same active chemistry. The active ingredient is what matters: enzyme products share protease/lipase/amylase chemistry; oxygen boosters share sodium percarbonate; solvent sticks share petroleum distillate or citrus solvent. Describe the active chemistry so the user can identify what they have at home.

---

## Edge Cases

### Set Stain After Dryer Cycle

This is the most common difficult case. The user reports washing and drying the item before noticing the stain remained.

- Heat from the dryer has likely cross-linked oil or protein molecules with fiber polymers. Standard protocols will have reduced efficacy.
- Begin with a cold soak in a concentrated enzyme solution: dissolve 3 tablespoons of enzyme laundry powder (or 2 tablespoons liquid enzyme detergent) in 1 gallon of cold water. Fully submerge the garment for a minimum of 4 hours, up to overnight.
- After enzyme soak, attempt Protocol B (dish soap, undiluted) for any residual oil component.
- For tannin-based set stains (coffee, wine), follow with a 2-hour oxygen bleach soak (2 tablespoons sodium percarbonate per gallon of warm water -- never hot -- at 104°F / 40°C maximum for colored fabrics).
- Be explicit: each dryer cycle the item has been through reduces the probability of full removal by approximately 30--50%. Three or more heat-dry cycles on an oil or protein stain typically mean permanent incorporation.

### Mystery Stain of Unknown Origin

The user does not know what caused the stain, when it happened, or how long it has been there.

- Examine the stain characteristics for clues: yellow-brown ring = tannin or sweat; greasy or shiny texture = oil/grease; stiff or crusty texture = protein (dried blood, egg, dairy); blue-black or vibrant hue = dye or ink; orange-brown scaling = rust
- Always begin with cold water -- it is the universal safe first step for any unknown stain
- If the stain does not respond to cold water rinse (which removes most fresh water-soluble stains), apply a small amount of dish soap (which addresses oil) and cold water next
- If still no response after dish soap, apply 3% hydrogen peroxide to a small section (2-minute test, then rinse and dry) -- hydrogen peroxide is a mild oxidizer that is safe on most fabrics in brief contact and addresses a wide range of stain chemistries
- Do not use bleach of any kind on an unknown stain on a colored fabric

### Multiple Stains from One Incident (e.g., Mud + Grass, Blood + Grease, Wine + Food)

- Treat each stain component separately, in the correct sequence
- General sequence order: (1) oil/grease first, (2) protein second, (3) tannin/dye last
- Avoid large-area soaking until individual component pre-treatments have been applied, as a broad soak can spread dye components from one stain area into adjacent clean fiber
- If components overlap in the same spot, the grease-first rule applies: dry absorbent (cornstarch), then dish soap, then flush, then enzyme treatment for protein, then vinegar or oxygen bleach for tannin

### Delicate Fabrics with Significant Staining (Silk, Cashmere, Wool)

- The treatment must be gentler, not more aggressive, even though the stain is significant. Aggressive treatment destroys the fabric while saving the stain
- For silk with a tannin stain: mix 1 teaspoon pH-neutral silk detergent in 1 cup of cool water. Apply to stain with cotton swab. Let sit 5 minutes maximum. Rinse by gently pressing clean damp cloth over area. Lay flat on white towel to dry. Repeat up to 3 cycles
- For wool with a protein stain: cold water flush from reverse, then pH-neutral wool wash (no enzymes). No agitation. Support the full weight of the garment when wet -- wet wool stretches permanently under its own weight
- For cashmere: treat as wool, handle only when wet as little as possible. After treatment, reshape and dry flat on mesh drying rack to prevent distortion

### Rust Stains on Clothing

Rust (iron oxide) requires acid treatment and is one of the few stain types where lemon juice and sunlight form a genuinely effective combination.

- Apply undiluted lemon juice to the rust stain. Sprinkle table salt over the lemon juice to act as a mild abrasive catalyst. Lay the garment flat in direct sunlight for 1--3 hours. The UV light catalyzes the citric acid reaction with the iron oxide. Reapply lemon juice if the fabric dries out
- Rinse thoroughly with cool water after treatment. Wash normally
- For set rust on white cotton: a dilute oxalic acid solution (found in commercial rust removers for fabric) is more effective than lemon juice. Follow product directions precisely -- oxalic acid is an irritant and must be rinsed completely. Do not use on synthetic fabrics or blends without testing
- Do not use chlorine bleach on rust stains -- bleach oxidizes iron further and can worsen the stain. This is a common mistake

### Stain on "Dry Clean Only" Item Not Currently at the Cleaner

The user has a stained dry-clean-only garment and cannot get to a cleaner immediately.

- Blot excess liquid with a dry white cloth immediately. Press and lift, do not rub. This is the only safe intervention
- For fresh grease stains only: apply dry cornstarch or talcum powder liberally. Let it sit for 4--6 hours to absorb oil. Brush off gently with a soft-bristle brush. Do not apply any liquid
- Do not apply water, vinegar, dish soap, alcohol, or any wet treatment. Even plain water can leave permanent tide marks on fine wools, structured suit fabrics, and many specialty materials
- Identify the stain for the dry cleaner: tell them what the stain is and approximately when it occurred. Dry cleaners use different solvents (PERC, HydroCarbon, silicon-based) and the cleaner's selection is improved by knowing stain type
- Bring in as soon as possible -- stains oxidize over time and become progressively harder to remove

### Mold or Mildew on Fabric

Mold stains have both a dye component (the colored spore matter) and a biological component (active fungal material).

- Safety first: handle moldy fabric outdoors or in well-ventilated space with gloves. Do not dry-brush mold indoors -- this aerosolizes spores
- For washable fabrics: pre-soak in solution of 1 cup white vinegar per gallon of cold water for 1 hour. This addresses mild mold
- For significant mold on white cotton or linen: dilute chlorine bleach (1 tablespoon per gallon of water) soak for 5 minutes, rinse thoroughly, then wash hot
- For colored fabrics with mold: apply 3% hydrogen peroxide directly to the affected area. Let sit 10 minutes. Rinse. Repeat up to 3 times. Then wash at the highest safe temperature with enzyme detergent
- After treatment and washing, dry the garment completely and thoroughly in sunlight or at high dryer heat (if safe for fabric) -- residual moisture allows mold to regrow. Do not fold or store until completely dry

---

## Example

**User Input:** "I have a fresh blood stain on my white cotton dress shirt from about 20 minutes ago. I tried dabbing it with a damp cloth but it's not coming out. What do I do?"

**Output:**

---

## Stain Removal Guide: Fresh Blood on White Cotton Dress Shirt

### Situation Assessment
- **Stain type:** Protein (blood -- hemoglobin and serum proteins)
- **Stain age:** Fresh (under 30 minutes) -- high probability of full removal
- **Fabric:** White cotton dress shirt -- robust fiber, bleach-tolerant if needed, but bleach is not the first-line treatment here
- **Complications:** Damp cloth applied -- this is neutral; no damage done as long as no warm or hot water was used
- **Treatment protocol:** Protocol A (Cold Flush + Enzyme), with optional hydrogen peroxide follow-up given white fabric

### Emergency First Response
1. **Stop immediately if you have used or are about to use warm or hot water** -- heat will permanently bond the hemoglobin to the cotton fibers
2. Run cold tap water through the back (reverse side) of the fabric for 30--60 seconds right now -- the hydraulic pressure pushes the blood back out through the face of the shirt
3. Do NOT rub -- the cotton weave will trap red blood cells deeper into the fiber if you apply lateral friction

### Full Treatment Steps

**What you need:**
- Cold water only (tap, as cold as it gets)
- Table salt (fine grain)
- Enzyme liquid laundry detergent or any liquid dish soap
- 3% hydrogen peroxide (from the pharmacy first-aid aisle -- confirm it is 3%, not 6% or 12%)
- Clean white cloth or paper towels (no colored cloths -- dye transfer risk when wet)
- A bowl or basin

**Treatment:**

1. **Immediately flush from the reverse side.** Hold the shirt inside-out under cold running tap water. Press the stained area gently against the faucet stream so water flows through the back of the fabric, pushing blood out through the front. Continue for 60 seconds. You should see the water running pink, then clearing. Blot with white cloth -- do not rub.

2. **Salt paste pre-treatment (optional but effective for blood).** Dissolve 2 tablespoons of table salt in 1/2 cup of cold water. Submerge or pour over the stained area. The salt solution creates osmotic pressure that draws hemoglobin out of the fiber matrix. Let sit 5 minutes. Rinse again with cold water from the reverse side.

3. **Apply enzyme detergent.** Pour or squeeze a 50-cent-coin-sized amount of liquid laundry enzyme detergent (or undiluted liquid dish soap) directly onto the damp stain. Use your fingertip to gently press -- not rub -- it into the stain, working from the outside edge of the stain toward the center. Let sit for 10--15 minutes. The protease enzymes in the detergent cleave the hemoglobin protein chains.

4. **Rinse and assess.** Rinse thoroughly with cold water from the reverse side for 30 seconds. Blot dry with clean white cloth. Check in bright light. If the stain is gone or nearly gone, proceed to washing. If a pink or brown shadow remains, move to Step 5.

5. **Hydrogen peroxide treatment (for residual stain on white fabric only).** Apply 3% hydrogen peroxide directly to the remaining stain using a cotton swab or clean cloth. It will fizz slightly -- this is the oxidation reaction working. Let sit for 3--5 minutes maximum on cotton. Do not exceed 10 minutes. Rinse thoroughly with cold water. Blot and check. Repeat once more if needed. Note: do not use hydrogen peroxide on colored fabrics -- it is a bleaching agent and will fade dye.

6. **Final enzyme detergent application.** Apply a small amount of enzyme detergent again, work gently, let sit 10 minutes, rinse with cold water.

**Wash instructions:**
- **Temperature:** 30°C (86°F) or cold cycle -- do not exceed 40°C (104°F) until you have confirmed the stain is fully gone
- **Detergent:** Enzyme-based liquid laundry detergent, standard dose
- **Cycle:** Normal or gentle cycle
- **Post-wash:** Remove from machine immediately. Do NOT put in the dryer yet. Lay flat or hang in natural light. Inspect the stain area in direct daylight once dry. If completely clear, you may then dry as normal. If any faint shadow remains, repeat the enzyme soak step before the next wash

### If This Doesn't Work

- If a faint brownish-yellow shadow remains after washing, this is oxidized hemoglobin residue. Soak the shirt in 1 gallon of cold water with 2 tablespoons of oxygen bleach powder (sodium percarbonate) for 2--4 hours, then rewash. This is safe for white cotton.
- If the stain has been heat-set in a dryer: the proteins have polymerized. Attempt a 6--8 hour cold enzyme soak (enzyme detergent in cold water, fully submerged). Improvement is possible but full removal is unlikely after one dryer cycle at high heat.
- If the stain still remains after two full treatment attempts: a professional shirt laundry or dry cleaner with wet-cleaning capability has access to commercial enzyme spotting agents at concentrations 5--10 times higher than household products.

### Fabric-Specific Warnings
⚠️ Although this shirt is white cotton and can tolerate chlorine bleach, do NOT reach for bleach as a first response. Bleach does not remove blood stains effectively -- it oxidizes the yellow-orange components but can leave a ghost stain and weakens the cotton fiber with repeated use. Hydrogen peroxide at 3% performs better on protein stains with no fiber degradation at correct concentration and contact time.

⚠️ Even on white cotton, avoid temperatures above 40°C in the wash until stain is fully removed. Once the shirt comes out of the wash completely clean, normal hot wash cycles (60°C) are appropriate going forward.
