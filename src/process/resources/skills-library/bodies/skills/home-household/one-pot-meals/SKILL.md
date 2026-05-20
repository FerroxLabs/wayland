---
name: one-pot-meals
description: |
  Creates complete one-pot or one-pan meals using a formula-based approach:
  protein plus aromatics plus liquid plus starch plus vegetables. Provides
  structured recipes with timing sequences, ingredient ratios, and variations
  for different cuisines. Use when the user asks about simple weeknight dinners,
  one-pot meals, sheet pan dinners, or wants to minimize cleanup while cooking
  a complete meal. Do NOT use for batch meal prep (use meal-prep-workflow),
  baking (use baking-fundamentals), or learning cooking techniques in isolation
  (use cooking-techniques).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking meal-planning cleaning"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# One-Pot Meals

## When to Use

**Use this skill when:**
- A user wants a complete weeknight dinner with minimal cleanup and asks for a recipe, formula, or guidance on combining ingredients they already have on hand
- A user explicitly asks for a one-pot meal, one-pan dinner, sheet pan dinner, skillet dinner, Dutch oven dinner, or requests a dish where protein, starch, and vegetables cook together in the same vessel
- A user describes a handful of ingredients (chicken thighs, a can of tomatoes, some rice) and asks "what can I make with this?" -- the one-pot formula is the most useful structure for combining disparate ingredients into a cohesive meal
- A user wants to minimize both cooking complexity and dishes -- especially relevant for small households, dorm cooking, post-surgery meal support, or anyone without a full set of cookware
- A user has 20 to 60 minutes and wants a meal that does not require juggling multiple burners or coordinating separate cooking timelines
- A user is cooking for a family or small group (2-6 people) and wants a formula they can repeat with different ingredients each week without learning a new process every time
- A user asks how to stretch a limited protein (half a rotisserie chicken, four Italian sausages, one pound of ground beef) into a full meal by combining it with pantry starches and vegetables

**Do NOT use this skill when:**
- The user wants to cook large batches for the entire week and store multiple portions -- use `meal-prep-workflow`, which addresses scaling, portioning, and food safety over time
- The user wants to master a specific technique in isolation (braising, sautéing, deglazing) rather than produce a complete meal -- use `cooking-techniques`
- The user is asking about baking bread, muffins, casseroles with pastry, or any dish where precise flour-to-leavener chemistry matters -- use `baking-fundamentals`
- The user wants a fully customed meal plan across an entire week with nutritional targets and grocery lists -- use `weekly-meal-planning`
- The user wants to make a dish that is inherently multi-vessel by nature (dishes requiring separate sauce reductions, deep frying, or delicate emulsified sauces like hollandaise or beurre blanc) -- these cannot be adapted to single-vessel cooking without losing their defining qualities

---

## Process

### Step 1 -- Gather the five inputs before generating anything

Before writing a single recipe line, ask (or infer from context) the following:

- **Protein:** What protein is available or preferred? Key types and their behavior: bone-in chicken (needs 35-45 min simmering), boneless thighs (18-22 min), chicken breast (12-15 min, easy to overcook), ground beef or pork (7-10 min to brown through), Italian or smoked sausage (slice and brown 4-6 min), shrimp (3-5 min, added last), canned beans or chickpeas (already cooked, add with liquid), firm tofu (press first, brown like meat), lentils (red: 15-20 min, green/brown: 30-35 min)
- **Starch:** Rice, pasta (short shapes like penne or orzo work best), potatoes, dried or canned legumes, polenta/grits, couscous, farro, or no starch (low-carb preference). Each starch has a different liquid-absorption rate and timing, which determines the recipe structure.
- **Vegetables:** What is on hand. Categorize immediately by hardness tier: Tier 1 (hard/dense: carrots, potatoes, parsnips, beets, winter squash -- need 25-35 min), Tier 2 (medium: broccoli, green beans, bell peppers, zucchini, cauliflower -- need 8-12 min), Tier 3 (soft/quick: spinach, peas, cherry tomatoes, corn, kale -- need 2-5 min)
- **Equipment:** This changes the method entirely. A 12-inch skillet with lid suits 2-4 servings. A 5.5-quart Dutch oven suits 4-6 servings. A rimmed sheet pan (18x13 inch) is for oven-roasted one-pan meals. An Instant Pot or pressure cooker cuts cooking time by 60-70%. A slow cooker trades speed for complete hands-off cooking.
- **Time available:** Use this as a hard constraint to filter protein and starch options: 20 minutes forces pre-cooked proteins (rotisserie chicken, canned beans, shrimp) and fast-cooking starches (couscous, orzo, quick-cook oats); 30-35 minutes allows boneless chicken thighs and regular long-grain white rice; 45-60 minutes opens up bone-in chicken, dried lentils, and farro.

If the user has not provided some of these, make reasonable assumptions based on what they did provide, state those assumptions explicitly, and offer to adjust.

---

### Step 2 -- Select the correct vessel and method based on inputs

The vessel determines the entire cooking method -- do not skip this mapping:

| Vessel | Best For | Capacity | Stovetop | Oven-Safe |
|--------|----------|----------|----------|-----------|
| 12-inch skillet with lid | 2-4 servings, rice or pasta dishes, quick proteins | 2-3 quarts of liquid | Yes | Most yes (check handle) |
| 5-7 quart Dutch oven | 4-8 servings, braises, soups, bone-in proteins | 5-7 quarts | Yes | Yes (to 500F) |
| Rimmed sheet pan (18x13) | Roasted proteins and vegetables, oven method | No liquid dishes | No | Yes |
| 6-quart slow cooker | Bone-in proteins, long cook, hands-off | 4-6 servings | No | No |
| 6-quart pressure cooker | Fastest cooking, dried beans, tough cuts | 4-6 servings | Yes (sauté mode) | No |
| 4-quart saucepan | Grain-forward dishes, soups, 2-person meals | 2-3 servings | Yes | No |

Critical vessel rules:
- A skillet without a lid cannot make rice-based one-pot meals reliably -- the steam escape prevents proper absorption. Substitute aluminum foil as a makeshift lid.
- Sheet pan meals cannot contain liquid-based sauces or soups by definition. They are a dry-heat roasting method, not a braising method.
- Pressure cookers require minimum liquid (at least 1 cup) and cannot be used to brown in sauce the same way stovetop methods can.

---

### Step 3 -- Apply the one-pot flavor architecture in sequence

Every one-pot meal follows the same five-layer flavor architecture. The sequence matters because each layer builds on the previous one. Skipping or reordering steps produces a flat, one-dimensional dish.

**Layer 1 -- Fat + Dry Aromatics (2-4 min over medium to medium-high heat)**
- Fat choice signals flavor direction: olive oil for Mediterranean and Italian; neutral oil (avocado, canola) for Asian or Mexican; butter for French or comfort food; rendered bacon fat or sausage fat for American Southern
- Aromatics: diced onion (1 medium per 4 servings) is the baseline. Add garlic (2-4 cloves, minced) after the onion softens -- never add garlic to a dry cold pan (it burns in 60 seconds and turns bitter). Fresh ginger (1 tbsp grated) for Asian profiles. Diced celery and carrot with onion forms a soffritto base for Italian dishes. Leek slices replace onion for a milder, sweeter base.
- Bloom dried spices in the fat with the aromatics for 30-45 seconds. This releases fat-soluble flavor compounds (terpenes in cumin, paprika, and curry powder). Spices added to liquid later taste flat by comparison.

**Layer 2 -- Brown the Protein (3-8 min, do not crowd the pan)**
- The goal is Maillard browning, not full cooking. Surface browning creates hundreds of flavor compounds that define the dish's depth. A gray, steamed protein produces a pale, bland one-pot meal.
- Crowding is the single most common mistake: protein pieces touching each other generate steam rather than dry heat, preventing browning. Leave at least 1/4 inch between pieces. If the pan is not large enough to brown all protein in one layer, do two batches.
- Do not move the protein for 2-3 minutes after placing it in the pan. Let the crust form. It will release from the pan naturally when properly seared -- if it sticks, it is not ready to flip.
- Exception: canned beans, shrimp, and delicate fish should not be browned in advance. Canned beans are added with liquid; shrimp and fish are added in the final 3-5 minutes only.

**Layer 3 -- Deglaze + Build the Liquid Base**
- After browning the protein, there will be brown bits on the pan bottom. This is fond -- it is the most concentrated flavor in the dish. Add the liquid while the pan is still hot and scrape vigorously with a wooden spoon or silicone spatula to dissolve it into the sauce. This step is non-negotiable for maximum flavor.
- Deglazing liquids by flavor direction: white wine (2-4 oz) then broth for French or Italian; crushed tomatoes + broth for Mediterranean; coconut milk for Southeast Asian or Caribbean; beer (lager or stout) for Mexican or German-inspired; soy sauce + broth for Japanese or Korean
- Liquid ratios by starch (see Rules section for precise numbers)
- Add the starch now if it will cook in the liquid (rice, orzo, farro, lentils). Bring to a boil, then reduce to a simmer before covering.

**Layer 4 -- Vegetable Addition by Tier (see Step 1 for tier definitions)**
- Tier 1 (hard) vegetables go in with the liquid before covering -- they need full cooking time
- Tier 2 (medium) vegetables go in when 8-10 minutes of covered cooking remain
- Tier 3 (soft) vegetables go in when 3-5 minutes remain, or are stirred in off-heat and allowed to wilt from residual heat
- The most common beginner error is adding all vegetables at the same time, which produces mushy soft vegetables alongside underdone hard vegetables

**Layer 5 -- The Finish (60-90 seconds, always do this)**
- Acid brightens: 1 tbsp lemon juice per 4 servings for Mediterranean/Italian; 1 tbsp lime juice for Mexican/Asian; 1-2 tsp red wine vinegar for Spanish or Eastern European profiles
- Fresh herbs added off-heat: parsley, cilantro, basil, chives, dill. These lose their brightness if cooked -- they are always a finishing element.
- Fat enrichment: 1 tbsp cold butter stirred in off-heat creates a silky finish in pan sauces (this is called mounting). Drizzle of olive oil or sesame oil for similar effect.
- Grated hard cheese (Parmesan, Pecorino, aged Manchego) stirred in at the end adds umami and body.
- Taste and adjust salt at this step only -- the dish reduces during cooking and salt concentrates.

---

### Step 4 -- Determine and communicate the critical timing sequence

Every recipe must include explicit timing because one-pot meals fail when the cook does not know when to add each component. Generate the recipe with a cumulative time format (0:00 -- 5:00 -- 22:00 etc.) rather than just "step 1, step 2."

Timing benchmarks by protein and starch combination:
- Shrimp + orzo: 20 minutes total
- Ground beef + small pasta: 25 minutes total
- Boneless chicken thighs + white rice: 33-38 minutes total
- Italian sausage + potatoes: 35-40 minutes total
- Bone-in chicken + farro: 50-55 minutes total
- Lentils (red) + any quick vegetable: 25 minutes total
- Lentils (green or brown) + root vegetables: 40-45 minutes total

---

### Step 5 -- Write the complete recipe with doneness indicators

Every recipe you generate must include:
- Ingredient list with amounts, cut specifications (1.5-inch pieces vs. "chunked"), and any prep notes (pat dry, press tofu, drain and rinse beans)
- Step-by-step instructions with cumulative timestamps
- Explicit visual and tactile doneness cues (not just temperature) -- what the food looks like, smells like, and how it behaves at the pan when done
- Internal temperature targets for all proteins (listed in Rules section)
- What to do if something goes wrong: rice still liquid after 20 minutes (cook uncovered 3-5 min), chicken stuck to pan (wait 30 more seconds), dish too salty (add starch or acid to balance)

---

### Step 6 -- Provide cuisine variations using the swap formula

After the primary recipe, show exactly how to change the seasoning profile to produce a completely different cuisine from the same formula. The protein and starch may stay identical -- only the aromatics, liquid base, spice blend, and finish change.

**The five reliable seasoning profiles:**
- Mediterranean/Greek: olive oil, garlic, oregano, lemon, tomato, olives, feta finish
- Mexican/Tex-Mex: neutral oil, cumin, chili powder, smoked paprika, salsa or canned tomatoes, lime, cilantro finish
- South/Southeast Asian: coconut milk base, ginger, lemongrass or lime leaves, fish sauce or soy sauce, lime and Thai basil finish
- French comfort: butter base, thyme, bay leaf, white wine + broth, Dijon mustard stirred in at finish, fresh parsley
- American comfort/Southern: neutral oil, smoked paprika, garlic powder, chicken broth + cream, hot sauce finish, scallions

---

### Step 7 -- Anticipate and proactively address common execution errors

After the recipe, include a short "What If It Goes Wrong" section for the specific dish. The most common execution errors and their fixes:

- Rice is still crunchy after cooking time: add 2-4 tbsp water or broth, cover, cook 5 more minutes
- Dish is too salty: add a splash of water or broth, a squeeze of lemon juice, or stir in unsalted starch (a handful of dry pasta or extra rice) to absorb and dilute
- Chicken is overcooked and dry: this is irreversible, but add a pat of butter and extra broth to restore some moisture; next time, cut boneless thighs smaller and reduce covered cooking time by 3-4 minutes
- Sauce is too thin: remove lid and simmer uncovered 5-8 minutes to reduce; stir in 1 tbsp tomato paste or a slurry of 1 tsp cornstarch in 1 tbsp cold water
- Pasta has absorbed all liquid and is sticky: add 1/4 cup hot water or broth, stir vigorously to release starch, serve immediately -- pasta-based one-pot meals do not hold well

---

### Step 8 -- Offer storage, leftover, and reheating guidance

One-pot meals are among the best leftover candidates. Include:
- Refrigerator storage: 3-4 days in an airtight container for most one-pot meals
- Reheating: rice and pasta based dishes require added liquid when reheating (2-4 tbsp broth or water per serving) to prevent dryness -- cover and microwave at 70% power, or reheat stovetop over medium-low with a splash of broth
- Freezing: broth-based and tomato-based one-pot meals freeze well for 2-3 months; cream-based dishes and potato-based dishes do not freeze well (cream splits, potatoes become granular)
- Leftover transformation: day-old one-pot rice dishes can be made into fried rice; leftover one-pot pasta dishes can be baked with cheese on top into a pasta bake

---

## Output Format

Every response for this skill should use the following structure:

```
## One-Pot [Meal Name]

**Servings:** [X] | **Total Time:** [X minutes] | **Equipment:** [specific vessel]
**Cuisine Profile:** [style] | **Difficulty:** Beginner

---

### Ingredients
**Protein:**
- [protein name] -- [quantity + cut specification]

**Aromatics & Seasoning:**
- [aromatic] -- [quantity + prep note]
- [spice or dried herb] -- [quantity]

**Liquid Base:**
- [broth or sauce] -- [quantity]

**Starch:**
- [starch] -- [quantity + type note]

**Vegetables:**
- [Tier 1 vegetable] -- [quantity + cut]
- [Tier 2 vegetable] -- [quantity + cut]
- [Tier 3 vegetable] -- [quantity + cut]

**Finish:**
- [acid] -- [quantity]
- [fresh herb or cheese] -- [quantity]

---

### Timing Sequence

| Time | Action |
|------|--------|
| 0:00 -- [X:XX] | [Step description including heat level] |
| [X:XX] -- [X:XX] | [Step description] |
| [X:XX] -- [X:XX] | [Step description] |
| [X:XX] -- done | [Step description + finish] |

---

### Step-by-Step Instructions

**Step 1 -- [Layer Name] ([time range])**
[Detailed instruction with specific technique notes, visual cues, and what to watch for]

**Step 2 -- [Layer Name] ([time range])**
[Detailed instruction]

[continue through all steps]

---

### Doneness Checklist
- [ ] Protein: [specific visual + temperature indicator]
- [ ] Starch: [specific texture indicator]
- [ ] Vegetables: [specific color/texture indicator]
- [ ] Sauce: [consistency indicator]

---

### If Something Goes Wrong
| Problem | Cause | Fix |
|---------|-------|-----|
| [problem] | [cause] | [specific fix] |

---

### Cuisine Variations
| Variation Name | Aromatic Swap | Liquid Swap | Spice Profile | Finish |
|----------------|---------------|-------------|---------------|--------|
| [variation] | [what changes] | [what changes] | [spices] | [finish elements] |

---

### The Formula Behind This Dish
Fat + Aromatics ([X min]) -> Brown Protein ([X min]) -> Deglaze + [Liquid] + [Starch] ([X min covered]) -> [Tier 1 veg] with liquid, [Tier 2 veg] at [X min mark], [Tier 3 veg] at [X min mark] -> Finish with [acid + herb/cheese]

### Storage
- Fridge: [X days], in airtight container
- Reheat: [specific method with liquid addition if needed]
- Freezes: [yes/no and why]
```

---

## Rules

1. **Never add all vegetables at once.** Hard vegetables (carrots, potatoes, winter squash) need 25-35 minutes and go in before covering. Medium vegetables (broccoli, green beans, bell peppers) go in at the 8-10 minute mark. Soft vegetables (spinach, peas, cherry tomatoes, zucchini) go in in the last 3-5 minutes or off-heat. Breaking this rule produces simultaneously mushy and raw vegetables in the same dish.

2. **Liquid-to-starch ratios are non-negotiable.** Use these precise ratios or the dish fails: long-grain white rice: 1:1.75 (1 cup rice, 1.75 cups liquid) in a covered skillet; basmati rice: 1:1.5; brown rice: 1:2.25 (and 35-40 min covered); orzo: enough liquid to cover by 1 inch (~2.5 cups per 1 cup orzo); small pasta (penne, rotini): same as orzo; farro: 1:2.5 (45 min); red lentils: 1:2.5 (20 min); green lentils: 1:2.75 (35 min). The tomato juice in canned tomatoes counts toward liquid volume -- typically a 14.5 oz can contributes approximately 0.75 cups of liquid.

3. **Internal temperature targets are mandatory for all proteins.** Chicken (all forms): 165F/74C. Ground beef and ground pork: 160F/71C. Pork chops and tenderloin: 145F/63C with 3-minute rest. Shrimp: opaque throughout, curled into a loose C-shape (tight O-shape = overcooked). Fish: 145F/63C, or flakes easily with a fork and is opaque through the thickest part. Never state a protein is "done" based on time alone -- always include a visual or temperature check.

4. **The finish step is not optional.** Acid (lemon juice, lime juice, vinegar) and fresh herbs are what separate a flat, one-dimensional dish from one that tastes intentional and restaurant-quality. Every recipe must include this step. A squeeze of lemon over chicken and rice adds brightness that reads as "seasoned by a skilled cook" even though the technique is zero skill. If a user has no fresh herbs or citrus, suggest alternatives: a teaspoon of red wine vinegar, a few shakes of hot sauce, or even a sprinkle of the same dried herb used in cooking (though fresh is strongly preferred for finishing).

5. **Never crowd the protein during browning.** Protein pieces touching each other trap moisture between them, which lowers the pan temperature below the Maillard threshold (~300F/149C) and causes steaming instead of browning. If the pan cannot hold all pieces in a single layer with space between them, brown in two batches. Remove the first batch, set it on a plate, and proceed with the second.

6. **Match the vessel to the batch size.** A 12-inch skillet handles 4 servings comfortably. A 10-inch skillet handles 2 servings. Exceeding vessel capacity produces crowded, steamed protein and uneven heat distribution. If the user has only a small pan but needs 6+ servings, advise a Dutch oven, a large pasta pot, or two separate skillets.

7. **Do not add garlic directly to dry heat or first into oil.** Garlic burns in 60-90 seconds in hot oil with nothing else in the pan and turns sharply bitter. Always add garlic after the onion has softened (creating a buffer of moisture and lower effective pan temperature), and cook garlic for 30-45 seconds only -- until fragrant, never until brown.

8. **Pasta-based one-pot meals require extra liquid and immediate serving.** Pasta continues to absorb liquid after cooking ends. One-pot pasta dishes cooked through to al dente will become soft and gummy if left in the pot even 10 minutes. Always cook pasta one to two minutes short of package instructions when it will continue cooking in sauce. Serve immediately or keep on very low heat with a splash of reserved broth nearby. Do not hold pasta-based one-pot meals.

9. **Blooming spices in fat before adding liquid is a meaningful technique, not optional flavor.** Dried spices (cumin, coriander, paprika, curry powder, chili powder, turmeric) contain fat-soluble flavor compounds that are fully activated only in hot fat, not in water. Adding these spices directly to liquid produces a fraction of their possible flavor. Add dried spices to the pan during the aromatic step (after onion, before or with garlic) for 30-45 seconds, stirring constantly to prevent burning.

10. **Do not lift the lid during the covered cooking phase.** When rice or lentils cook covered, the trapped steam is doing 30-40% of the work. Every time the lid is lifted, 2-5 minutes of cooking steam escapes and must be rebuilt. Instruct users to set a timer and resist the urge to check. The exception: if you smell burning before the timer ends, lift the lid immediately, add 2-3 tbsp of broth or water, replace the lid, and reduce the heat.

11. **Cream-based one-pot sauces must not boil after cream is added.** Heavy cream or sour cream added to a dish that is then brought to a full boil will break -- the fat separates into greasy pools and the protein solids become grainy. After adding cream, reduce heat to medium-low or a gentle simmer. Stir frequently and watch for the first bubbles at the edge of the pan, which signal sufficient heat.

12. **Account for carryover cooking -- remove from heat slightly before done.** Proteins continue cooking from residual heat for 2-4 minutes after the burner is off, particularly in a Dutch oven that retains heat. Pull chicken off heat when a thermometer reads 160F/71C and it will reach 165F/74C as it rests. This prevents the overcooked, rubbery texture that makes one-pot chicken disappointing.

---

## Edge Cases

### Vegetarian and Vegan Adaptations

Protein replacement requires understanding each alternative's cooking behavior, since none of these behave identically to meat:

- **Canned chickpeas or white beans:** Already fully cooked. Add with the liquid -- do not try to "brown" them in the same way as meat (they will just fall apart). They absorb surrounding flavors during simmering. Increase spices by 20% because beans are comparatively bland and benefit from assertive seasoning. 1 can (15 oz, drained and rinsed) replaces approximately 0.75 lb of boneless chicken.
- **Firm tofu:** Must be pressed for at least 15 minutes before cooking (wrap in paper towels or a clean cloth, press with a heavy pan) to expel moisture. Pat dry before adding to the pan. Brown in oil over medium-high heat with minimal stirring for 3-4 minutes per side to form a crust. It will hold its shape through the rest of the cooking process if browned properly.
- **Red lentils:** Do not need soaking. Cook directly in the liquid. They dissolve into the sauce (rather than holding distinct shape), creating a creamy, thick texture. Use 1 cup red lentils with 2.5 cups liquid for a 4-serving dish. Ready in 15-20 minutes simmering covered.
- **Green or brown lentils:** Hold their shape. Use like a firm protein: add with liquid, cook 30-35 minutes. Better for dishes where distinct texture matters (lentil and vegetable bowls, Mediterranean lentil stews).
- **Eggs (shakshuka method):** Make a tomato-based sauce first following the formula. Create shallow wells in the sauce with a spoon. Crack one egg per well. Cover and cook 4-6 minutes for set whites with runny yolks; 7-8 minutes for fully set yolks. Do not stir after adding eggs.

Use vegetable broth in all vegetarian one-pot meals. Enhance umami without meat through: 1-2 tsp soy sauce or tamari, 1 tbsp tomato paste browned in the fat before liquid is added, or a parmesan rind simmered in the liquid (remove before serving).

---

### Low-Carb / No-Starch Adaptations

The starch step in the formula is responsible for two things: absorbing liquid and adding body. Removing starch changes both the structure and the timing of the dish.

- **Cauliflower rice:** Does not absorb liquid. Treat as a Tier 3 vegetable -- add in the last 3-5 minutes. Reduce the total liquid by approximately half (the liquid becomes a sauce rather than a cooking medium). 1 small head of cauliflower riced = approximately 3 cups, enough for 4 servings.
- **Spiralized zucchini (zoodles):** Add in the last 2-3 minutes only. Zucchini releases significant water -- expect the sauce to thin after adding. Counter this by cooking the sauce to a very thick consistency before adding zoodles, or by adding zoodles entirely off-heat and tossing with residual heat only.
- **White beans as starch replacement:** Technically a legume, not a low-carb option, but for users who want to eliminate grain starch without eliminating all carbs, canned white beans or cannellini beans add creaminess and body when mashed partially into the sauce (press 1/4 of them against the pan side with a spoon).
- **Increase fat and protein:** For genuinely low-carb needs, double the vegetables, increase protein by 25%, and build a richer sauce with butter and cream rather than the starch-liquid combination.

---

### Sheet Pan / Oven Method

Sheet pan meals use the same five-ingredient formula but apply dry roasting heat rather than stovetop simmering. The principles differ enough to warrant specific guidance:

- **Temperature:** 425F/218C is the standard for sheet pan roasting. At this temperature, vegetables caramelize and protein browns in 20-25 minutes. Lower temperatures produce steaming (soggy vegetables, pale protein). Higher temperatures burn smaller items before larger items cook through.
- **Do not overcrowd the pan:** This is the single most common sheet pan failure. Pieces touching each other trap steam and prevent browning. Use two sheet pans if needed, or roast in two batches. Every piece should have clear space on all sides.
- **Stagger addition by density:** Arrange the sheet pan so hard vegetables (potatoes, carrots) roast alone for the first 10-15 minutes, then add protein and medium vegetables. Add soft or quick-cooking items in the last 8 minutes. Alternatively, cut hard vegetables smaller so they cook in the same time as protein.
- **Dry the protein and vegetables thoroughly:** Pat with paper towels before tossing with oil. Surface moisture is the enemy of browning in oven roasting. The steam from wet surfaces prevents the high surface temperature needed for caramelization.
- **Starch on the sheet pan:** Cut Yukon Gold or russet potatoes into 1-inch cubes, toss with oil and salt, and they can roast alongside protein and serve as the starch. Alternatively, cook grains on the stovetop while the sheet pan roasts -- this is the one exception where a second vessel is acceptable and commonly used.

---

### Pressure Cooker Adaptations

Pressure cookers change cooking times by 60-70% but require specific technique adjustments:

- **Minimum liquid requirement:** At least 1 cup of liquid is required to build steam pressure. Most 6-quart pressure cookers require 1.5 cups minimum. Never attempt a thick, low-liquid one-pot meal in a pressure cooker -- it will trigger a burn warning or fail to pressurize.
- **Browning first:** Most modern electric pressure cookers have a sauté mode. Use it. Brown protein and aromatics in sauté mode before switching to pressure mode. This step is not shortened by pressure cooking -- it still takes 3-5 minutes and produces the same fond. Do not skip it.
- **Rice in a pressure cooker:** White rice cooks in 3 minutes at high pressure plus 10 minutes natural release. Brown rice: 20 minutes at high pressure plus 10 minutes natural release. Do not use quick pressure release for rice -- the sudden pressure drop causes starch to foam and spray through the valve.
- **Pasta in a pressure cooker:** Cook at high pressure for half the package time listed (if package says 10 minutes, pressure cook for 5 minutes). Quick release is fine for pasta. Add dairy or delicate ingredients only after pressure is fully released.
- **Timing for proteins:** Bone-in chicken thighs: 15-18 minutes at high pressure. Boneless thighs: 8-10 minutes. Beef stew chunks: 25-30 minutes. Pork shoulder: 60-75 minutes.

---

### Scaling for Large Groups (8+ Servings)

Scaling a one-pot meal beyond 6 servings introduces specific problems that require proactive management:

- **Browning must happen in batches regardless of pan size.** Even in a 7.5-quart Dutch oven, browning 3+ pounds of protein at once will crowd the pan. Plan for 2-3 browning batches and add 8-12 minutes to the total time.
- **Heat distribution:** The larger the volume of liquid, the longer it takes to come to a boil (sometimes 12-15 minutes for a full Dutch oven). Account for this in the timing sequence and keep heat at medium-high through the entire heating phase, then reduce only once a full boil is reached.
- **Liquid ratios scale linearly but evaporation does not.** Stovetop evaporation is driven by surface area, not volume. A Dutch oven with a tight lid loses relatively little liquid. However, if cooking partially uncovered or finishing with the lid off, increase liquid by 10% for very large batches.
- **Seasoning scales by taste, not by formula.** Spices do not scale perfectly linearly. When doubling a recipe, use 1.5x the spice amounts, then taste and add more at the finish. Over-spicing 8 servings is a much larger problem than over-spicing 4.

---

### Rescuing a One-Pot Meal Gone Wrong

Common disasters and their real-world fixes:

- **Burnt bottom:** Remove from heat immediately. Do NOT stir the burnt layer into the rest of the dish -- this distributes the scorched flavor throughout. Carefully pour or spoon the top, unburnt portion into a new pot. Leave the burnt layer behind. The new pot may taste mildly scorched; add extra acid (lemon juice) and fresh herbs to mask it.
- **Dish is too salty:** Stir in a large piece of peeled raw potato and simmer 10-15 minutes -- the potato absorbs salt somewhat (then discard the potato). Add more of any unsalted components (extra broth, unseasoned cooked rice, or cream). A squeeze of citrus does not reduce sodium but does shift the flavor perception and makes it more palatable.
- **Chicken breast is overcooked and stringy:** Shred it finely with two forks, stir back in with extra broth, and let it absorb moisture for 5 minutes. The fine shred and rehydration disguise the overcooked texture much better than large dry chunks.
- **Rice is gummy and stuck together:** Spread it on a sheet pan and let it sit uncovered for 5 minutes to release steam. Stir to separate. Next time, rinse long-grain rice in cold water until the water runs clear before cooking to remove excess surface starch.

---

## Example

**User Input:** "I have four chicken thighs (bone-in, skin-on), a bag of jasmine rice, one can of diced tomatoes, a large onion, three cloves of garlic, a bag of fresh spinach, and a lemon. I have a Dutch oven and about 45 minutes. I want something that feels a little Mediterranean."

---

## One-Pot Mediterranean Chicken and Jasmine Rice

**Servings:** 4 | **Total Time:** 45 minutes | **Equipment:** 5-quart Dutch oven with lid
**Cuisine Profile:** Mediterranean-inspired | **Difficulty:** Beginner

---

### Ingredients

**Protein:**
- 4 bone-in, skin-on chicken thighs (approximately 2 to 2.5 lbs total) -- pat completely dry with paper towels before cooking

**Aromatics & Seasoning:**
- 1 large yellow onion -- diced into 1/2-inch pieces
- 3 cloves garlic -- minced
- 1.5 tsp smoked paprika
- 1 tsp dried oregano
- 1/2 tsp ground cumin
- 1 tsp kosher salt (divided: 1/2 tsp for chicken, 1/2 tsp for the pot)
- 1/2 tsp black pepper
- 2 tbsp olive oil

**Liquid Base:**
- 1 can (14.5 oz) diced tomatoes with juice -- do not drain
- 1.5 cups low-sodium chicken broth

**Starch:**
- 1 cup jasmine rice -- rinsed under cold water until water runs clear, then drained (this removes surface starch and prevents gumminess)

**Vegetables:**
- 4 cups fresh baby spinach (Tier 3 -- adds at the end)

**Finish:**
- 1 lemon -- zested and halved (use both zest and juice)
- Fresh parsley, roughly chopped -- optional but strongly recommended

---

### Timing Sequence

| Clock Time | Action |
|------------|--------|
| 0:00 -- 2:00 | Preheat Dutch oven, add oil, heat until shimmering |
| 2:00 -- 9:00 | Brown chicken skin-side down, flip, brown second side |
| 9:00 -- 10:00 | Remove chicken to plate, reduce heat |
| 10:00 -- 13:00 | Sauté onion in chicken fat |
| 13:00 -- 14:00 | Add garlic and bloom spices |
| 14:00 -- 16:00 | Add tomatoes, deglaze, scrape fond, add broth |
| 16:00 -- 17:00 | Add rinsed rice, stir to combine, bring to boil |
| 17:00 -- 18:00 | Nestle chicken skin-side up into rice, bring back to gentle boil |
| 18:00 -- 36:00 | Cover, reduce to low, cook 18 minutes -- do not lift the lid |
| 36:00 -- 38:00 | Uncover, scatter spinach, replace lid, steam 2 minutes |
| 38:00 -- 40:00 | Finish: lemon zest, lemon juice, taste and adjust, rest 3 minutes uncovered |
| 43:00 | Serve |

---

### Step-by-Step Instructions

**Step 1 -- Pat Dry and Season the Chicken (before cooking)**
Pat the chicken thighs aggressively dry with paper towels on all sides, including under any loose skin. This is not optional -- surface moisture prevents browning. Season skin side with 1/2 tsp salt, 1/2 tsp smoked paprika, and 1/4 tsp black pepper. Do not season the underside yet.

**Step 2 -- Build the Brown Crust (0:00 -- 9:00)**
Heat the Dutch oven over medium-high heat for 90 seconds. Add 2 tbsp olive oil and let it heat until it shimmers and a small droplet of water flicked in immediately sizzles. Place chicken thighs skin-side down in the pot in a single layer. Do not crowd them -- they should not touch. Cook without moving for 5-6 minutes. You will hear aggressive sizzling; this is correct. Resist the urge to move or press the chicken. The skin is done browning when it releases cleanly from the pot surface without sticking. Flip and brown the other side 2-3 minutes. The skin should be deeply golden-brown, not pale yellow.

Transfer chicken to a plate. There will be rendered fat and brown fond on the bottom of the pot. Do not drain or wipe the pot.

**Step 3 -- Sauté the Aromatics (9:00 -- 14:00)**
Reduce heat to medium. Add the diced onion to the same pot and stir to coat in the chicken fat. Cook 3-4 minutes until the onion is soft and translucent, scraping up any fond that releases with the onion's moisture. Add the minced garlic, remaining 1 tsp smoked paprika, 1 tsp oregano, and 1/2 tsp cumin. Stir constantly for 45 seconds until fragrant -- the spices will darken slightly and smell toasted. This blooming step is what gives the dish its depth.

**Step 4 -- Deglaze and Build the Liquid Base (14:00 -- 18:00)**
Pour in the can of diced tomatoes with all its juice. Use a wooden spoon or silicone spatula to scrape the bottom of the pot firmly -- every browned bit that lifts off is flavor. Add the 1.5 cups chicken broth and remaining 1/2 tsp salt. Stir to combine.

Add the rinsed, drained jasmine rice directly to the pot. Stir so the rice is submerged and evenly distributed. Increase heat to medium-high and bring to a full boil -- you should see active, rolling bubbles across the surface, not just at the edges.

**Step 5 -- Nestle the Chicken and Cook Covered (17:00 -- 36:00)**
Nestle the browned chicken thighs skin-side up on top of the rice and liquid. The skin should remain above the liquid surface -- submerging the skin causes it to become flabby. Bring back to a boil, then reduce heat to the lowest setting on your burner. Place the lid on the Dutch oven. Cook for exactly 18 minutes without lifting the lid. Set a timer.

At the 18-minute mark, check the rice by tilting the pot slightly -- liquid should be fully absorbed. If any liquid pools visibly, replace the lid and cook 3-5 more minutes.

**Step 6 -- Wilt the Spinach (36:00 -- 38:00)**
Scatter all 4 cups of spinach over the chicken and rice. Replace the lid and cook 2 minutes. The residual steam will wilt the spinach completely without overcooking it. Remove the lid and stir the spinach gently into the rice around (not under) the chicken.

**Step 7 -- Finish and Rest (38:00 -- 43:00)**
Turn off the heat. Sprinkle lemon zest over the entire dish. Squeeze half the lemon over the pot. Taste a spoonful of rice -- adjust salt if needed. Let the dish rest uncovered for 3-4 minutes before serving; this allows the rice to firm slightly and the chicken temperature to even out.

Serve directly from the Dutch oven. Squeeze remaining lemon at the table for guests to add to their portion. Top with chopped fresh parsley.

---

### Doneness Checklist
- [ ] **Chicken:** Internal temperature 165F/74C at the thickest part without touching bone. Juices run completely clear when pierced. Skin is deeply golden and crisp on top.
- [ ] **Rice (jasmine):** Tender throughout with no chalky crunch. All liquid absorbed. Individual grains separate cleanly when stirred -- not clumped or gummy.
- [ ] **Spinach:** Fully wilted and bright green. If it is dark, slimy, and olive-colored, it overcooked -- reduce the covered steam time to 90 seconds next time.
- [ ] **Sauce:** The tomato and broth should have reduced to a thick, saucy consistency clinging to the rice -- not watery, not dry and stuck.

---

### If Something Goes Wrong
| Problem | Likely Cause | Fix |
|---------|--------------|-----|
| Rice is still crunchy after 18 min covered | Heat too low, lid not sealed, or rice not fully submerged | Add 3-4 tbsp broth or water, replace lid, cook 5 more min |
| Chicken skin is soft, not crisp | Skin submerged in liquid during cooking | For next time, ensure skin stays above liquid surface; in this cook, broil the finished dish for 3-4 min to re-crisp |
| Bottom is dry and rice is sticking | Heat too high, too little liquid | Add 1/4 cup hot water around the edges, reduce heat, cover 5 min |
| Dish tastes flat | Forgot the acid finish | Squeeze the entire lemon over the dish now -- it will noticeably change the flavor |
| Too salty | Broth was full-sodium or tomatoes were salted | Stir in 1/4 cup hot water, a pat of unsalted butter, and extra lemon to shift the balance |

---

### Cuisine Variations

| Variation Name | Aromatic Swap | Spice Profile | Liquid Swap | Finish |
|----------------|---------------|---------------|-------------|--------|
| Mexican-Inspired | Add 1 chipotle pepper in adobo (minced) with garlic | Cumin + chili powder, skip oregano | Replace broth with salsa (1 cup) + water (1 cup) | Lime juice, cilantro, sour cream dollop |
| Coconut-Ginger Asian | Replace onion with scallion whites + 1 tbsp fresh ginger | Turmeric + coriander, skip paprika | Replace broth with 1 can full-fat coconut milk + 1/2 cup water + 1 tbsp soy sauce | Lime juice, scallion greens, Thai basil, sesame oil drizzle |
| French Country | Replace olive oil with butter. Add 1 tbsp tomato paste with garlic. | Herbes de Provence + thyme, skip cumin | Replace tomatoes with 1/2 cup dry white wine + 1.5 cups broth | 1 tsp Dijon mustard stirred in at finish, fresh tarragon or parsley |
| Spanish Arroz con Pollo | Add 1 tsp saffron threads (bloom in 2 tbsp warm water, add with liquid) | Smoked paprika + bay leaf | Replace some broth with 1/2 cup dry sherry | Pitted green olives scattered over top, sliced jarred piquillo peppers |

---

### The Formula Behind This Dish

Fat + Aromatics (3-4 min, medium heat) -> Brown Bone-In Chicken Skin-Down (5-6 min, medium-high, do not move) -> Deglaze with Tomatoes + Bloom Fond + Add Broth + Rice (2 min, boil) -> Covered Low Simmer 18 min (no lid lifting) -> Tier 3 Spinach (2 min steam) -> Finish with Lemon Zest + Juice + Fresh Parsley

---

### Storage
- **Fridge:** 3-4 days in an airtight container. The chicken will be best if stored bone-in and removed before reheating.
- **Reheat:** Add 2-3 tbsp chicken broth or water per serving. Cover and microwave at 70% power for 2-2.5 minutes, stirring once. Or reheat stovetop over medium-low with a splash of broth, covered, 5-6 minutes.
- **Freezes:** Yes -- this dish freezes well for up to 2 months. The tomato-broth base protects the rice texture. Freeze chicken and rice together in portions. Thaw overnight in the refrigerator before reheating with added liquid.
