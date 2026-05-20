---
name: cooking-techniques
description: |
  Teaches fundamental cooking techniques with specific temperature ranges, timing
  guidelines, and visual/auditory cues for doneness. Covers saute, roast, braise,
  poach, steam, grill, and pan-sear with step-by-step instructions and the science
  behind each method. Use when the user asks about cooking methods, temperature
  guidelines, when to use each technique, or how to improve their cooking
  fundamentals. Do NOT use for specific recipes (use one-pot-meals or meal-prep-workflow),
  baking (use baking-fundamentals), or knife technique (use knife-skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking step-by-step guide"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Cooking Techniques

## When to Use

Use this skill when the user's need centers on HOW to cook -- the mechanics, temperatures, timing, and science of a cooking method -- rather than WHAT to cook.

**Trigger scenarios:**
- User asks why a specific technique is not producing the expected result (soggy vegetables, gray band on steak, rubbery chicken, tough braise)
- User asks which cooking method is best suited to a specific ingredient or cut (e.g., "should I roast or saute asparagus?", "is braising right for chicken thighs?")
- User asks about cooking temperatures, timing windows, or doneness indicators for proteins or vegetables
- User wants to understand the underlying science of a technique -- why does browning happen, why does braising tenderize tough meat, why does steaming preserve color
- User is trying to replicate a restaurant result at home and wants the exact method (crust on a scallop, even doneness on a thick ribeye, properly caramelized onions)
- User asks about heat management, pan selection, fat selection, or equipment for a specific method
- User wants to combine multiple techniques (sear then roast, blanch then saute) and needs to know how the stages work together

**Do NOT use this skill when:**
- User needs a specific recipe with measured ingredients -- use `one-pot-meals` or `meal-prep-workflow` instead
- User is asking about baking, pastry, or bread (oven-based baking with leaveners is a separate domain with different chemistry) -- use `baking-fundamentals`
- User needs to learn knife skills, cutting technique, or how to break down a whole bird or fillet a fish -- use `knife-skills`
- User is asking about food storage, refrigeration timelines, or food safety beyond cooking temperatures -- use `food-storage-safety`
- User needs guidance on seasoning, spice blending, or building flavor profiles without a specific technique question -- use `flavor-profiles`
- User is asking about specific dietary substitutions (e.g., replacing eggs in a recipe) -- use `ingredient-substitutions`

---

## Process

### Step 1: Identify the Cooking Goal and Constraints

Before recommending any technique, gather the full picture. Do not skip this step -- recommending roasting when the user has only a stovetop, or braising when they need dinner in 20 minutes, wastes their time.

- **What is being cooked?** Ask for protein type and cut (chicken breast vs. thigh vs. whole leg matters enormously), vegetable type (dense vs. tender vs. leafy), or whether it is a combination dish
- **What result is desired?** Crispy exterior with juicy interior, falling-apart tenderness, bright green color retention, caramelized sweetness, subtle flavor with delicate texture -- these goals map directly to specific techniques
- **What equipment is available?** Stovetop type (gas, electric coil, smooth-top electric, induction), oven type (conventional, convection, broiler access), grill (charcoal vs. gas), specialized equipment (cast iron, carbon steel, wok, Dutch oven, steamer basket, probe thermometer)
- **What is the time constraint?** Braising takes 2-4 hours; a saute takes 5-10 minutes; roasting a whole chicken takes 60-90 minutes -- the technique must fit the timeline
- **What is the user's experience level?** Beginners need more explicit sensory cues (what does shimmering oil look like, what does a proper sizzle sound like); intermediate cooks can handle technique vocabulary without as much scaffolding

### Step 2: Select the Correct Technique Using the Decision Framework

Match ingredient + desired result + time + equipment to the appropriate method. This is the core technical judgment. Use this framework:

**Heat transfer method determines the technique:**
- **Dry heat, direct contact (conduction):** Saute, pan-sear, stir-fry -- fast, high-heat, browning-focused
- **Dry heat, radiant/convection oven:** Roast, broil -- hands-off, even heat, large volumes
- **Dry heat, direct flame or radiant grill heat:** Grill -- char marks, smoke, surface caramelization
- **Moist heat, fully submerged or partially submerged:** Braise (partial), stew (full), poach (submerged, low temp) -- tenderizes collagen, no Maillard reaction
- **Moist heat, vapor only:** Steam -- preserves color and nutrients, no browning, very gentle

**Ingredient-to-technique matching rules:**
- Tough cuts with high connective tissue (chuck, short ribs, pork shoulder, lamb shank, chicken thighs): braise or slow roast
- Tender cuts with low connective tissue (tenderloin, chicken breast, fish fillets, shrimp): pan-sear, saute, poach, steam, or quick grill
- Dense root vegetables (carrots, parsnips, beets, potatoes): roast at high heat or braise alongside proteins
- Tender vegetables (asparagus, peas, spinach, green beans): saute, steam, or blanche
- Proteins with delicate texture that must stay moist (fish fillet, egg, chicken breast for salads): poach or steam
- Proteins where crust is essential (steak, pork chop, duck breast, scallop): pan-sear, grill

### Step 3: Explain the Technique Science First

Before the steps, give the user a brief but concrete explanation of WHY the technique works. This unlocks troubleshooting ability -- a user who understands the Maillard reaction can diagnose why their pan-sear produced a gray crust rather than a brown one, without needing to call for help again.

- **The Maillard reaction** begins at approximately 280F/140C at the food surface. It is a chemical reaction between amino acids and reducing sugars that produces hundreds of flavor compounds and the characteristic brown color. It requires a DRY surface (water evaporates at 212F/100C and holds the surface temperature at that point until gone) and sufficient surface temperature. Every browning technique is engineered to get the food surface above 280F quickly.
- **Caramelization** is a separate process -- the thermal decomposition of sugars -- which begins at approximately 320F/160C for fructose and 340F/171C for sucrose. Caramelization produces sweetness reduction and complex bitter-sweet flavor. Onions caramelize (not Maillard-brown) when cooked very slowly over low heat for 45-60 minutes -- this is why "caramelized onions" take far longer than most recipes claim.
- **Collagen-to-gelatin conversion** occurs when collagen (connective tissue in tough cuts) is held between 160-180F/71-82C for extended periods (1.5-4 hours depending on cut thickness and age of animal). Below 160F, the conversion is too slow. Above 212F (boiling), the muscle fibers contract and expel moisture faster than collagen converts, resulting in dry, stringy meat. Braising at 300-325F/149-163C oven temperature keeps the liquid just below a full simmer -- critical for tender, not dry, braised meat.
- **Steam and moisture loss in cooking:** All proteins lose moisture as internal temperature rises. A chicken breast loses approximately 25% of its weight in moisture when cooked from 40F to 165F. This is why techniques that apply external moisture (braising, poaching) or techniques that cook the interior gently while browning only the exterior (reverse sear) produce juicier results in proteins prone to drying out.

### Step 4: Deliver Step-by-Step Execution With Exact Parameters

Provide the technique's full execution sequence with concrete numbers and sensory cues at each stage. Never use vague descriptors alone -- "medium heat" must be accompanied by what the oil should look like or sound like at that setting.

**For every technique, cover these five elements in the steps:**
1. Pan/oven/grill preparation (including preheat time and temperature target)
2. Food preparation specific to the technique (patting dry, bringing to room temperature, scoring skin, trussing, etc.)
3. Fat selection with smoke point reference when high heat is involved
4. Heat management during cooking (when to adjust, what cues to look for)
5. Doneness indicators -- at minimum two of these three: visual cue, auditory cue, internal temperature with a thermometer

**Critical temperature references to include where relevant:**
- Induction and gas stoves can preheat a cast iron or stainless pan to 400F+ surface temperature in 2-3 minutes; electric coil or smooth-top needs 3-5 minutes
- Oven calibration varies by 25-50F from the set temperature in most home ovens -- suggest an oven thermometer for precision work
- Convection ovens run 25F hotter effectively than conventional ovens at the same set temperature (the fan strips away the insulating moisture layer around food) -- reduce temperature by 25F or reduce time by 20-25% when using convection

### Step 5: Provide a Doneness Reference Table

Always include a structured doneness table specific to the technique. The table must include at minimum: ingredient, time range, internal temperature target where applicable, and the primary visual or tactile cue. This table is what a user will reference in real time while cooking.

- For all proteins, include USDA minimum safe temperatures AND the preferred target temperature for quality (these differ -- USDA minimum for pork is 145F/63C but many cooks prefer 150F/66C for chops, and 185-190F/85-88C for braised pork shoulder collagen breakdown)
- Mark carryover cooking -- proteins continue cooking after removal from heat. Carryover rises 5-10F for steaks and chops, 10-15F for large roasts. Always pull proteins 5-10F below target temperature.
- Vegetable doneness should include color cues (bright green in blanching, golden edges in saute, caramelized surfaces in roasting) because vegetables have no safe internal temperature minimum -- texture and color are the only guides

### Step 6: Address Technique Combinations and Sequencing

Many restaurant-quality results come from combining techniques, not using a single method. Explain the logic of combination when relevant:

- **Sear then roast (reverse or forward):** Forward sear (sear first, then oven): Best for thinner cuts under 1.5 inches where oven time is short. Reverse sear (oven first at 250F/120C, then sear): Best for thick cuts (1.5-3 inches) because it produces edge-to-edge even doneness with a narrow outer crust rather than a gray overcooking band
- **Blanch then saute:** Blanch dense vegetables in heavily salted boiling water (1 tablespoon salt per quart), shock in ice water to stop cooking and lock green chlorophyll, then saute quickly at service time. Reduces saute time, ensures even doneness, and preserves vibrant green color
- **Sear then braise:** Browning the exterior of braising meats via Maillard reaction before adding liquid creates dozens of flavor compounds that dissolve into the braising liquid, building a richer sauce. Never skip this step in a braise -- unbrowned braised meat tastes flat
- **Poach then crisp:** Poach chicken thighs or duck legs until just cooked, chill, then roast at 450F/232C for 15-20 minutes skin-side up. Results in fully cooked, juicy interior with shatteringly crisp skin -- an otherwise difficult combination to achieve with a single technique

### Step 7: List the Top Technique-Specific Mistakes With Solutions

For each technique covered in the response, provide 3-4 specific mistakes with the mechanism behind why they happen and the concrete correction. Generic mistakes like "don't overcook it" are not useful -- the mistake must be mechanistic.

- Frame mistakes as diagnostic: "If your result looks or tastes like X, the cause is Y, and the fix is Z"
- Common Maillard/browning failures: wet food surface, cold pan, overcrowded pan, wrong fat, lid on the pan
- Common braising failures: boiling (vs. simmering) the liquid, not browning first, undersalting the liquid, using too much liquid (the liquid should come no more than halfway up the sides of the meat)
- Common roasting failures: putting cold protein directly from refrigerator into oven (outer layer overcooks before interior reaches temp), wrong rack position (too low = bottom burns before top browns), not resting the protein after cooking

### Step 8: Provide a Quick-Reference Comparison Table

Close every technique response with a comparison table covering all seven core techniques. This gives context and helps the user understand where the recommended technique sits relative to alternatives, empowering future independent technique selection.

---

## Output Format

```
## Cooking Technique: [Technique Name]

**What it does:** [One sentence describing the physical result -- texture, color, flavor development]
**Heat transfer method:** [Conduction / Radiant / Convection / Moist heat / Steam]
**Best for:** [Specific ingredient types and cuts with examples]
**Temperature range:** [Specific range in F and C -- pan surface, oven, or liquid temperature]
**Time window:** [Typical duration range]
**Required equipment:** [Minimum equipment and useful optional equipment]

---

### The Science (Why This Works)
[2-4 sentences explaining the physical/chemical mechanism: Maillard reaction, collagen conversion,
evaporation, steam pressure, etc. Specific temperatures and reactions included.]

---

### Food Preparation for This Technique
- [Prep step specific to the technique -- drying, seasoning timing, room temperature resting, scoring, etc.]
- [Fat/oil selection with smoke point guidance if high heat is involved]
- [Pan or oven preparation with specific preheat times]

---

### Step-by-Step Execution
**Step 1: [Name the action, not just "do this"]**
- [Specific detail with number, temperature, or cue]
- [Sensory cue: what to see, hear, or feel]

**Step 2: [Continue...]**
- [Specific detail]
- [Sensory cue]

[Continue for all steps, typically 5-8 steps total]

---

### Doneness Reference Table
| Ingredient | Technique Time | Pull Temp (F/C) | Target Temp (F/C) | Primary Visual/Tactile Cue |
|-----------|---------------|-----------------|-------------------|---------------------------|
| [Ingredient] | [Time range] | [Pull temp] | [Target after rest] | [Specific cue] |
| [Continue...] | | | | |

*Pull temperature = remove from heat at this point; carryover cooking will bring to target temp.*

---

### Common Mistakes -- Diagnostic Guide
| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| [Specific bad result] | [Specific mechanism] | [Specific correction] |
| [Continue...] | | |

---

### Technique Combinations Using [Technique Name]
- **[Combo name]:** [When and why to combine, what it achieves]
- **[Continue...]**

---

### Quick-Reference: All 7 Core Techniques Compared
| Technique | Heat Type | Temp Range | Time | Fat Needed | Best For | Browning? |
|-----------|----------|-----------|------|-----------|---------|----------|
| Saute | Dry conduction | 375-425F / 190-218C pan | 3-10 min | 1-2 tbsp | Quick veg, thin proteins | Yes |
| Pan-sear | Dry conduction | 425-500F / 218-260C pan | 2-4 min/side | 1 tbsp | Steaks, chops, scallops | Yes, heavy |
| Roast | Dry convection/radiant | 375-500F / 190-260C oven | 20-90 min | 1-2 tbsp coating | Whole proteins, root veg | Yes |
| Braise | Moist/dry combo | 300-325F / 149-163C oven | 1.5-4 hrs | 2 tbsp for sear | Tough cuts, collagen-rich | Sear only |
| Steam | Moist vapor | 212F / 100C at food surface | 3-15 min | None | Delicate veg, fish, eggs | No |
| Poach | Moist submerged | 160-180F / 71-82C liquid | 8-30 min | None | Fish, chicken breast, eggs | No |
| Grill | Dry radiant/conduction | 450-550F / 232-288C grate | 3-10 min/side | Oil food, not grate | Anything needing smoke/char | Yes, char |
```

---

## Rules

1. **Always give temperatures in both Fahrenheit and Celsius.** Home cooks and metric-system users both need the numbers. Never give one without the other for oven temperatures, oil smoke points, and internal protein temperatures.

2. **USDA safe minimum internal temperatures are non-negotiable floors, not targets.** Always cite them AND distinguish them from quality targets: chicken 165F/74C (USDA) but consider 160F/71C pull temp with carryover; whole pork 145F/63C (USDA, 3-minute rest); ground meat 160F/71C (no carryover exemption); fish 145F/63C (USDA) though many cooks prefer 130-135F/54-57C for salmon texture -- flag the USDA minimum explicitly when citing a lower quality-preference temperature.

3. **The Maillard reaction requires three simultaneous conditions -- never teach browning without covering all three.** Surface temperature must exceed 280F/140C; the food surface must be DRY (moisture holds the surface at 212F/100C until fully evaporated); and there must be sufficient amino acids and reducing sugars present. Forgetting any one condition is why browning fails.

4. **Crowding is the single most common cause of failed saute and pan-sear results.** Enforce this rule explicitly and numerically: a 12-inch pan can properly saute approximately 1.5 pounds of cut vegetables or sear 2 large steaks at once. More than this creates steam, drops pan temperature, and prevents browning. If the user is cooking for more than 2 people, either cook in batches or use two pans simultaneously.

5. **Never recommend extra virgin olive oil for high-heat techniques.** EVOO smoke point is 375-400F/190-204C and its flavor compounds degrade and turn acrid above this temperature. For saute, pan-sear, and grill basting: refined avocado oil (520F/271C), refined peanut oil (450F/232C), refined canola oil (400F/204C), or clarified butter/ghee (480F/249C) are the correct choices. EVOO is reserved for finishing, low-heat cooking (below 350F), or raw applications.

6. **Salt timing is technique-dependent and cannot be generic.** For dry-heat high-temperature techniques (saute, pan-sear): salt draws moisture to the food surface via osmosis. Salt 45+ minutes before cooking (dry-brine effect -- moisture draws out then reabsorbs as brine) OR salt immediately before contact with the pan. Salting 5-30 minutes before cooking leaves a wet surface that steams instead of browns. For braises and poaches: season the liquid, not just the protein, and season in layers (before searing and again in the liquid).

7. **Carryover cooking must be cited whenever a protein pull temperature is given.** Small cuts (steaks, chops, fish fillets): 5-10F carryover, rest 5 minutes. Large roasts (whole chicken, pork loin, leg of lamb): 10-15F carryover, rest 15-20 minutes. Very large roasts (beef rib roast, whole turkey): up to 20F carryover, rest 20-30 minutes. Cutting protein before resting releases the moisture that has not yet redistributed from the contracted muscle fibers -- this is the mechanism, not just a rule.

8. **Braise liquid temperature must never reach a rolling boil.** The target is a bare simmer -- small bubbles breaking the surface slowly at approximately 180-190F/82-88C liquid temperature. Full boiling agitates and shreds protein fibers before collagen finishes converting to gelatin, resulting in dry, stringy braised meat. The oven method at 300-325F/149-163C is more reliable than stovetop braising because oven heat is uniform and the temperature fluctuates less.

9. **Pan material selection affects technique outcomes and must be addressed.** Stainless steel and carbon steel: excellent for high-heat saute, sear, and browning; develop fond (browned bits) that builds sauce. Nonstick: use only below 450F/232C (coatings degrade above this); acceptable for eggs, fish, and delicate sautes but produces inferior browning. Cast iron: exceptional heat retention for searing and oven-to-stovetop techniques; slow to heat but holds temperature even when cold food hits the pan. Enameled cast iron (Dutch oven): ideal for braises and stews -- even heat distribution, safe for acidic braising liquids (unlike bare cast iron, which reacts with wine and tomatoes).

10. **Never skip the "why" explanation even if the user only asked "how."** A cook who understands that overcrowding creates steam that prevents browning will diagnose the problem independently next time. A cook who only knows "don't crowd the pan" will return with the same question when they encounter a slightly different scenario. Mechanism-based teaching multiplies the user's capability; rule-only teaching creates dependency.

---

## Edge Cases

### Electric and Induction Stoves vs. Gas

Electric coil and smooth-top electric stoves respond to heat adjustments 30-90 seconds slower than gas. This creates two specific problems: (1) when reducing heat for a braise, the pan stays hot longer, risking a boil; allow a full minute before judging whether the reduction was sufficient, and (2) for searing, preheat the pan 1-2 minutes longer than gas instructions suggest -- 3-4 minutes on electric vs. 1.5-2 minutes on gas for the same target pan temperature.

Induction stoves respond as fast as gas and heat more efficiently but require ferromagnetic cookware. Test with a magnet: if it sticks firmly to the bottom of the pan, the cookware is induction-compatible. Aluminum, copper, and most glass do not work on induction. Cast iron and most stainless steel work well.

For induction: the pan does not heat -- the food and pan heat from the magnetic field. This means an empty induction pan can overheat very quickly. Do not leave an empty induction pan on high heat unattended for more than 60-90 seconds.

### Very Thick Cuts (Over 1.5 Inches)

Traditional forward sear (sear first, then finish in oven) on cuts thicker than 1.5 inches produces a gray overcooked band around the outside because the exterior must reach 280F+ for browning while the interior is still rising through lower temperatures. The solution is reverse sear:

1. Place the seasoned protein on a wire rack over a sheet pan
2. Cook in a 250F/120C oven (conventional) until the interior reaches 10-15F below the final target (e.g., 120F/49C for a medium-rare target of 130-135F/54-57C)
3. Remove, tent loosely with foil while a cast iron or carbon steel pan heats on the stove for 3-5 minutes until screaming hot
4. Sear 1.5-2 minutes per side with 1 tablespoon of high-smoke-point oil -- this is a finishing sear only, very fast
5. No additional rest needed after the oven phase -- the interior has already equilibrated

The result is edge-to-edge pink (or the desired doneness) with a thin, intense crust.

### Cooking for One or Two Portions

Standard recipe logic assumes 4-6 servings. Scaling down creates specific technique problems:

- A single chicken breast or one steak in a 12-inch pan means the exposed pan surface overheats and smokes while the food cooks. Use an 8-inch or 10-inch pan for single portions, or add a second piece of food (even a halved lemon or a few garlic cloves) to occupy surface area.
- Single portions in a large roasting pan dry out faster because there is more exposed hot pan surface radiating heat upward and evaporating moisture. Use a smaller baking dish, or add a splash of liquid (1/4 cup broth or water) to the pan to moderate the dry heat around the food.
- A single braising portion needs a smaller vessel -- the liquid should still come halfway up the sides of the meat. In a full-sized Dutch oven with a single pork chop, the liquid spreads too thin and evaporates unevenly.

### Plant-Based and Vegan Applications

All seven techniques work for vegetables, tofu, and plant proteins, but with specific modifications:

- **Tofu searing:** Tofu contains 70-85% water by weight. Without preparation, it steams instead of sears. Press firm or extra-firm tofu between two plates with a heavy book or cast iron pan on top for 30-60 minutes to expel water, then pat completely dry. Alternatively, freeze tofu, thaw, and press -- freezing changes the protein structure, creating a spongier texture that releases water more readily and absorbs marinades better.
- **Mushrooms** release enormous amounts of water when heated (up to 80% water content). Add them to a dry, hot pan FIRST with no oil and let them cook for 2-3 minutes, stirring occasionally, until they release their liquid and it fully evaporates. THEN add oil and saute for browning. Adding oil at the start causes mushrooms to absorb it all before any evaporation occurs, resulting in greasy, steamed mushrooms.
- **Vegetable roasting temperatures** should be 25-50F higher than protein roasting temperatures. Vegetables at 425-450F/218-232C caramelize properly; the same temperature on a chicken breast produces a dry exterior before the interior cooks through.
- **Tempeh vs. tofu:** Tempeh is denser and drier than tofu -- it does not need pressing and can be pan-seared directly, treating it like a firm protein. Marinate for 30-60 minutes before searing for better flavor penetration.

### High-Altitude Cooking (Above 3,500 Feet)

Moist-heat techniques are most affected by elevation because water boils at lower temperatures:
- At 5,000 feet: water boils at approximately 202F/94C (vs. 212F/100C at sea level)
- At 7,500 feet: approximately 198F/92C
- At 10,000 feet: approximately 194F/90C

This means poaching at "a simmer" is actually happening at 5-8F lower effective temperatures than intended, requiring 15-20% longer cooking times for poached proteins at high altitude. Steaming is similarly affected.

Dry-heat techniques (saute, sear, roast) are minimally affected because pan and oven temperatures far exceed boiling point. However, moisture evaporates faster at altitude, so foods can dry out more quickly in the oven -- adding 10-15 minutes to rest times or tenting with foil earlier helps.

### When No Thermometer Is Available

A thermometer is the only truly reliable tool for protein doneness. However, if unavailable, use the following hierarchy -- listed from most to least reliable:

- **Fish:** Insert a thin knife into the thickest part for 5 seconds; touch the blade to your lower lip or wrist. Warm = underdone; hot = done. Fish also transitions from translucent to opaque when cooked through, though the center should still be barely opaque (not glassy) for ideal texture.
- **Chicken breast:** Pierce the thickest part with a knife or skewer. Juices running CLEAR indicate doneness. Pink-tinged juices mean more time is needed. Note that the pink juice test is less reliable for brined or smoked chicken, which can retain pink color at safe temperatures due to sodium nitrite chemistry.
- **Steaks:** The finger-firmness test compares the feel of the steak to the fleshy area below your thumb when pressing fingers together: thumb to index finger (rare), thumb to middle finger (medium-rare), thumb to ring finger (medium), thumb to pinky (well-done). This is approximate at best and varies by hand size -- treat it as directional, not precise.
- **Pork:** Interior color is no longer a reliable guide (USDA updated guidelines acknowledge this). Slightly pink center is safe at 145F/63C. Without a thermometer, use timing plus firmness and acknowledge the margin for error.

### Fond -- Using What Sticks to the Pan

When sauting or pan-searing, the brown bits stuck to the pan bottom (called fond) are concentrated Maillard reaction products -- the most flavor-dense part of the cooking process. Never discard them.

- After removing protein or vegetables, pour in 1/4 to 1/2 cup of liquid (wine, stock, water, or citrus juice) while the pan is still hot over medium heat
- Use a wooden spoon or heat-resistant spatula to scrape the fond loose as the liquid comes to a simmer
- The liquid picks up all the flavor and becomes the basis for a pan sauce
- Reduce the liquid by half (approximately 2-4 minutes of simmering) for a concentrated sauce; whisk in 1-2 tablespoons of cold butter off the heat for a glossy, restaurant-style pan sauce
- This technique is called deglazing and is the bridge between a saute or sear and a complete dish

---

## Example

**Input:** "I keep trying to pan-sear salmon and it comes out either sticking terribly to the pan, overcooked and dry, or the skin is flabby and not crispy. What am I doing wrong?"

**Output:**

## Cooking Technique: Pan-Sear (Applied to Salmon with Skin)

**What it does:** Creates a deeply caramelized, crispy exterior crust -- especially a shatteringly crisp skin -- while keeping the interior moist and barely cooked through, ranging from silky opaque to translucent in the center depending on preference.
**Heat transfer method:** Dry heat conduction (stovetop, direct pan contact)
**Best for:** Skin-on fish fillets (salmon, sea bass, trout, snapper), boneless chicken thighs, duck breast, scallops, and thick pork chops. Any protein where you want a heavily browned exterior crust and a precisely controlled interior temperature.
**Temperature range:** Pan surface 425-475F / 218-246C
**Time window:** 3-5 minutes skin side, 1-2 minutes flesh side (for a 1-inch thick fillet)
**Required equipment:** 12-inch stainless steel or cast iron skillet (not nonstick -- nonstick does not reach the temperatures needed for proper searing without degrading the coating); fish spatula or thin metal spatula; paper towels; instant-read thermometer (highly recommended)

---

### The Science (Why Your Salmon Is Failing)

Your three problems -- sticking, dryness, and flabby skin -- each have a distinct mechanical cause.

**Sticking** happens because of incomplete protein denaturation at the pan contact point. When a cold, wet piece of fish touches a pan that is not hot enough, the proteins bond with the metal surface before Maillard browning can create the firm, non-stick crust that naturally releases from the pan. A properly seared piece of fish releases on its own when the crust forms -- it tells you when it is ready by letting go. If you have to force it, the crust is not done yet.

**Dryness** comes from overcooking and from starting with refrigerator-cold salmon. The center of a cold fillet needs to travel from 38F/3C to 130-145F/54-63C while the exterior is simultaneously at 425F+. That wide temperature gradient means by the time the center reaches target, the outer 1/4-inch has been at 165F+ for too long. Bringing the fillet to room temperature (15-20 minutes on the counter) closes this gap.

**Flabby skin** is a moisture problem. Salmon skin contains water in the fat layer beneath it. If the skin is not pressed against the hot pan surface consistently during cooking, it steams from its own moisture rather than crisping. The skin must be DRY and must be held in contact with the pan continuously.

---

### Food Preparation for Pan-Searing Salmon

- **Dry the fillet aggressively.** Press paper towels firmly on all sides, especially the skin. Do not rush this -- blot until no moisture transfers to a fresh paper towel. Residual moisture is the enemy of both browning and non-stick release.
- **Score the skin lightly.** With a sharp knife, make 3-4 shallow cuts through the skin (not into the flesh) perpendicular to the fillet length, about 1 inch apart. Salmon skin contracts when it hits heat, curling the fillet upward and creating a gap between the skin and pan. Scoring breaks the connective tissue preventing even skin contact.
- **Season at the right time.** Salt the flesh side and skin side 30 minutes before cooking (dry-brine: salt draws out a small amount of moisture, which then reabsorbs as seasoned brine -- this improves surface dryness AND flavor penetration) OR salt immediately before the fillet hits the pan. Avoid the 5-30 minute window where moisture has been drawn out but not reabsorbed.
- **Bring to room temperature.** Remove from the refrigerator 15-20 minutes before cooking. A cold fillet straight from the fridge guarantees a dry overcooked exterior by the time the center reaches temperature.
- **Fat selection.** Use refined avocado oil (smoke point 520F/271C), refined peanut oil (450F/232C), or refined canola oil (400F/204C). Butter used alone will burn. If you want butter flavor, add 1 tablespoon of butter to the pan in the last 60-90 seconds of cooking and tilt the pan to baste -- the short exposure at the end allows the butter to brown without burning.

---

### Step-by-Step Execution: Crispy Skin Salmon

**Step 1: Preheat the pan empty, then add oil.**
- Place the stainless steel or cast iron pan on medium-high heat for 2 minutes (gas) or 3-4 minutes (electric)
- Test readiness: hover your palm 3-4 inches above the pan -- you should feel intense, uncomfortable heat radiating up within 1-2 seconds
- Add 1 tablespoon of high-smoke-point oil and swirl to coat. The oil should shimmer and move freely like water within 15-20 seconds of hitting the pan
- If the oil smokes immediately upon hitting the pan, reduce heat by 10-15% and wait 30 seconds before proceeding

**Step 2: Place the salmon SKIN SIDE DOWN.**
- Lower the fillet away from you (so any oil splatter goes away from your body) and place it skin-side down in the center of the pan
- You should hear an immediate, aggressive sizzle -- like a sustained crackle, not a quiet bubble. If the sizzle is weak, the pan is too cool.
- Immediately press the fillet firmly and evenly with a fish spatula for 30-45 full seconds. This counteracts the skin's tendency to curl and ensures full skin-to-pan contact across the entire surface.

**Step 3: Maintain pressure, do not move the fillet.**
- After the initial 30-45 second press, hold the spatula lightly against the fillet for another 30 seconds, then release
- Do NOT slide the spatula under the fillet yet -- if you try to move it and it resists, the crust is not formed. Leave it alone.
- Cook skin-side down for 3-4 minutes total for a 1-inch thick fillet, 4-5 minutes for a 1.25-inch fillet
- Watch the flesh: you will see it change color from translucent red-orange at the bottom to opaque pink, slowly traveling upward. When the opaque color has traveled 2/3 of the way up the side of the fillet, the skin side is nearly done.

**Step 4: Test for release, then flip.**
- Slide a thin metal spatula or fish spatula under one edge of the fillet. If it resists or tears, wait another 30-45 seconds and test again. A properly seared fillet releases cleanly with minimal pressure.
- Once released, flip the fillet gently. The skin should be deeply golden to amber-brown and rigid -- it will make a tapping sound when you touch it with a spatula.
- Optionally: add 1 tablespoon of butter and 2 smashed garlic cloves and a thyme sprig to the pan now for basting. Tilt the pan and use a spoon to baste the fillet with the foaming butter every 15-20 seconds.

**Step 5: Cook flesh side briefly and monitor internal temperature.**
- Cook flesh-side down for 60-90 seconds for medium (slightly translucent in the very center) or 2 minutes for fully opaque center
- Insert an instant-read thermometer into the thickest part horizontally through the side of the fillet, not from the top
- Pull the fillet at 120-125F/49-52C for medium (slightly translucent center -- the Japanese-influenced style favored by most restaurant preparations); 130F/54C for medium-well (just barely opaque in the center); 145F/63C for USDA safe minimum (fully opaque, firmer texture)
- Carryover cooking adds 3-5F to salmon after removal

**Step 6: Rest and serve skin-side up.**
- Transfer to a plate or wire rack skin-side up for 2-3 minutes
- Never cover with foil -- steam from the hot fillet will soften the skin you just worked to crisp
- Add finishing salt, lemon juice, or sauce at the table, not on the fish in the kitchen

---

### Doneness Reference Table: Pan-Seared Salmon (1-inch thick fillet)

| Doneness Level | Skin-Side Time | Flesh-Side Time | Pull Temp (F/C) | Target Temp After Rest | Visual Cue |
|---------------|---------------|----------------|-----------------|----------------------|-----------|
| Medium-rare | 3-4 min | 45-60 sec | 115F / 46C | 118-120F / 48-49C | Translucent, dark orange in center |
| Medium (recommended) | 3-4 min | 60-90 sec | 120-125F / 49-52C | 125-128F / 52-53C | Thin translucent layer in very center, opaque edge-to-center |
| Medium-well | 3-4 min | 90-120 sec | 130F / 54C | 133-135F / 56-57C | Fully opaque, lighter pink uniformly |
| USDA safe minimum | 3-4 min | 2-3 min | 140F / 60C | 145F / 63C | Fully opaque, beginning to flake easily |

*Thicker fillets (1.25-1.5 inches): add 60-90 seconds to flesh-side time. Thinner fillets (under 3/4 inch): reduce skin-side to 2-2.5 minutes.*

---

### Common Mistakes -- Diagnostic Guide

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Fillet sticks and tears when flipped | Pan not hot enough before adding fish; or flipped too early before crust formed | Preheat pan longer; test release with light spatula pressure before flipping -- if it resists, wait 30-45 more seconds |
| Skin is soft, pale, steamed-looking | Skin was wet; fillet was not pressed into pan; pan temperature too low | Pat skin completely dry; score the skin to prevent curling; press with spatula for first 45 seconds |
| Exterior dry and overcooked, interior raw | Cold fillet straight from refrigerator; pan too hot | Rest fillet at room temp 15-20 min before cooking; medium-high (not maximum) heat |
| Pan is smoking aggressively and oil is dark | Oil choice has too low a smoke point (EVOO), or pan overheated | Use refined avocado, peanut, or canola oil; reduce heat if oil smokes before food is added |
| Fish smells fishy even when fresh | Surface bacterial bloom from moisture; surface not dried; old fish | Buy the freshest fish available; pat completely dry; use day of purchase or next day maximum |
| Flesh falls apart when flipping | Fish is overcooked and muscle fibers have separated; or fish was frozen-thawed improperly | Monitor internal temp; flip only once when crust has fully formed; use a wide fish spatula to support the full fillet |

---

### Technique Combinations Using Pan-Sear for Salmon

- **Poach-then-sear (for perfect skin on braised preparations):** Poach salmon at 140F/60C in seasoned court bouillon (water, white wine, aromatics) for 8-10 minutes to cook interior completely, chill, then execute a 2-minute high-heat skin-only sear at service for crisp skin. Decouples interior and exterior cooking entirely.
- **Baste with compound butter:** In the last 60-90 seconds of cooking, add 1 tablespoon of herb butter (room temperature butter mixed with lemon zest, dill, or tarragon) to the pan. Tilt and spoon the foaming butter over the flesh side repeatedly. The butter adds flavor and a glossy surface without cooking beyond the already-established crust.
- **Sear then rest in residual heat (thick fillets):** For fillets over 1.25 inches, after flipping, turn off the burner and let the residual pan heat finish the flesh side. This produces gentler, more even interior heat than active high-heat cooking on the flesh side, which can overcook the outer flesh before the center reaches temperature.

---

### Quick-Reference: All 7 Core Techniques Compared

| Technique | Heat Type | Temp Range | Time | Fat Needed | Best For | Browning? |
|-----------|----------|-----------|------|-----------|---------|----------|
| Saute | Dry conduction | 375-425F / 190-218C pan | 3-10 min | 1-2 tbsp | Quick-cut veg, thin proteins, aromatics | Yes, moderate |
| Pan-sear | Dry conduction | 425-475F / 218-246C pan | 2-4 min/side | 1 tbsp | Steaks, salmon, scallops, chops, duck breast | Yes, heavy |
| Roast | Dry convection/radiant | 375-500F / 190-260C oven | 20-90 min | 1-2 tbsp coating | Whole chickens, sheet pan veg, large roasts | Yes, slow |
| Braise | Moist + dry combo | 300-325F / 149-163C oven; 180F liquid | 1.5-4 hrs | 2 tbsp for initial sear | Chuck, short ribs, pork shoulder, chicken thighs | Exterior sear only |
| Steam | Moist vapor | 212F / 100C at food surface | 3-15 min | None | Broccoli, green beans, delicate fish, dumplings | No |
| Poach | Moist submerged | 160-180F / 71-82C liquid | 8-30 min | None | Salmon, chicken breast, eggs, white fish | No |
| Grill | Dry radiant + conduction | 450-550F / 232-288C at grate | 3-10 min/side | Oil on food surface | Steaks, chops, vegetables, fish with skin | Yes, char marks |
