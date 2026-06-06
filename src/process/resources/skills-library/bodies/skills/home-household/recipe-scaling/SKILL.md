---
name: recipe-scaling
description: |
  Scales any recipe up or down with exact multiplier math, leavening adjustment
  rules for baking, pan size conversions, and cooking time modifications. Handles
  the non-linear adjustments that trip up straightforward multiplication. Use when
  the user wants to double, halve, or scale a recipe to a specific number of
  servings, needs pan size equivalents, or asks about adjusting baking recipes.
  Do NOT use for ingredient substitutions (use ingredient-substitution), meal
  planning for the week (use meal-prep-workflow), or creating new recipes.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking meal-planning planning"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Recipe Scaling

## When to Use

Use this skill when the user presents any of the following situations:

- The user has a recipe for a specific number of servings and wants to produce more or fewer portions -- for example, a soup recipe for 4 that needs to feed 18 at a dinner party
- The user wants to double, triple, halve, or quarter a specific recipe and needs adjusted ingredient quantities
- The user is converting a baking recipe to a different pan size and needs volume-equivalent guidance (switching from a 9-inch round to a 9x13 sheet, or from a loaf pan to muffin tins)
- The user is scaling a baking recipe (cakes, cookies, breads, muffins, pastries, biscuits) where leavening, fat, and liquid ratios require non-linear adjustment
- The user wants to scale up a recipe for a crowd event (wedding, holiday gathering, church potluck) and needs practical batch-splitting recommendations
- The user needs to convert between volume and weight measurements in the process of scaling, or wants to know how to use a kitchen scale for more accurate scaling
- The user is scaling a yeast bread recipe and needs guidance on fermentation adjustments
- The user asks about adjusting cooking times or temperatures when using different pan sizes or batch volumes

**Do NOT use this skill when:**

- The user needs to substitute one ingredient for another (use `ingredient-substitution` -- scaling and substitution are separate problems and should be solved sequentially)
- The user wants to plan meals for the week, batch-cook for meal prep, or organize a weekly menu (use `meal-prep-workflow`)
- The user wants to create an entirely new recipe from a concept or list of ingredients (use a recipe-creation skill)
- The user needs nutritional calculations for a scaled recipe (use a nutrition-calculation skill -- the math is different and requires per-gram nutrient density data)
- The user is asking about commercial food production scaling (restaurant or catering batch formulation involves entirely different concerns: equipment capacity, commissary workflow, HACCP, and yield loss at scale)
- The user is scaling a recipe that relies on a chemical process they are unfamiliar with, such as candy making or cheesemaking, without first understanding the base process (those skills should be addressed before scaling)
- The user's primary question is about technique -- how to fold egg whites, how to knead dough, how to emulsify a sauce -- rather than about quantity (address technique first)

---

## Process

### Step 1: Gather Complete Recipe Information

Before calculating anything, collect all the information needed to scale correctly. Missing details lead to incorrect adjustments.

- Ask for or confirm the full ingredient list with exact quantities and units (cups, grams, ounces, tablespoons, teaspoons, whole units like eggs or cans)
- Ask for the original yield -- this may be expressed as servings, pieces (dozen cookies), pan size, or weight of finished product
- Ask for the target yield -- the number of servings, pieces, or pans needed
- Identify the recipe category: baking (cakes, cookies, bread, muffins, biscuits, pastry) vs. cooking (soups, stews, sauces, sautés, roasts, stir-fries) -- this determines which special rules apply
- Ask whether there is a pan size change involved, or whether the user is simply making more pans of the same size
- Note the original cooking temperature and time, and the method of doneness testing (internal temperature, toothpick, visual cues, probe thermometer reading)
- If the user has not provided the cooking instructions, ask for them -- temperature and time adjustments cannot be made without the original parameters

### Step 2: Calculate the Scaling Multiplier

The multiplier is the mathematical foundation of every adjustment that follows.

- Multiplier = Target servings / Original servings. This is always the starting point.
- If the original yield is expressed in pieces rather than servings (e.g., "makes 24 cookies"), use pieces as the unit: target pieces / original pieces
- If the original yield is expressed as a pan (e.g., "fills one 9x13 pan"), and the user wants to fill two 9x13 pans, the multiplier is 2.0x
- Round the multiplier to two decimal places for intermediate calculations, then round final quantities to practical measures at the end -- never round the multiplier itself
- Common multipliers and their practical implications: 0.5x (halving) is generally safe for all recipes; 0.25x (quartering) requires careful measurement of small amounts; 1.5x is the safest scale-up for baking; 2.0x is the largest straightforward baking scale-up; anything over 2.5x triggers leavening caps and liquid reduction rules; anything over 3.0x should be split into multiple batches for baked goods
- If the user gives a specific head count, help them calculate servings -- account for realistic portion sizes (a pasta dish may serve 4 generously or 6 as a side)

### Step 3: Categorize Every Ingredient and Apply the Correct Scaling Rule

Not all ingredients scale the same way. Every ingredient in the recipe must be assigned to a scaling category before any math is done.

**Category 1 -- Direct Linear Scale (multiply by the full multiplier):**
- Flour, grains, starches
- Dairy (milk, cream, buttermilk, yogurt, sour cream)
- Most vegetables and proteins in cooking recipes
- Chocolate (chips, bar, melted)
- Nuts, dried fruit, oats
- Sweeteners (sugar, honey, maple syrup, brown sugar) for cooking recipes -- see baking note below

**Category 2 -- Capped Leavening (never exceed 2.5x original amount):**
- Baking powder: scale linearly up to 2.5x, then cap. For batches beyond 2.5x, hold at 2.5x the original.
- Baking soda: same cap at 2.5x. Baking soda is approximately 4x as potent as baking powder -- over-use causes rapid over-rise, collapse during cooling, and a persistent metallic or soapy aftertaste.
- Baking powder + baking soda together: cap each independently at 2.5x.
- Cream of tartar (when used as a leavening activator): cap at 2.5x alongside baking soda.

**Category 3 -- Reduced-Scale Strong Flavoring (multiply by 75% of the scaling factor for scale-ups over 2x):**
- Table salt and kosher salt: salt perception is non-linear; a batch scaled to 3x will taste saltier than 3x if you add 3x the salt
- Ground black pepper, cayenne, chili flakes, and other pungent dried spices
- Vanilla extract: controversial -- most bakers scale vanilla linearly, but for batches over 3x, 75% scaling is acceptable; add more to taste
- Citrus zest: scale at 75% for batches over 2x
- Garlic and onion powder: scale at 75% for batches over 2x
- Fresh garlic, fresh ginger: scale at 75% for batches over 2x
- Strong extracts (almond, peppermint): scale at 50% -- these are intensely concentrated and become overpowering quickly
- Fish sauce, soy sauce, Worcestershire, miso: scale at 75%

**Category 4 -- Fat Reduction for Large Baking Batches (reduce by 5-10% for batches over 3x):**
- Butter, vegetable oil, shortening in baking recipes
- The reduction compensates for the way fat distributes through a larger batter mass -- excess fat at scale weakens structure and prevents proper rise
- For cooking recipes (sautéing, braising), fat scales linearly

**Category 5 -- Liquid Reduction for Large Baking Batches (reduce by 10% for batches over 3x):**
- Water, milk, buttermilk, coffee, juice when used as the primary baking liquid
- The surface area to volume ratio changes in a larger pan -- evaporation is proportionally less, leaving more residual moisture
- This reduction applies to baking only; soups, sauces, and braising liquids scale linearly

**Category 6 -- Whole-Unit Rounding (eggs, cans, packages):**
- Eggs: always round to the nearest whole egg, with one exception -- if the recipe calls for 1 egg and you are halving it, beat one whole egg and measure 2 tablespoons (approximately half a large egg)
- Cans: do not round to the nearest can. Calculate the weight in ounces, then specify the exact amount: "Use 28 oz from a 28-oz can and 12 oz from a second can"
- Yeast packets: see yeast-specific rules in Step 4

**Category 7 -- Time-Sensitive Leavening with Modified Rules (yeast):**
- Yeast scales linearly up to 2.0x
- For batches 2.0x to 4.0x, use 1.5x the original yeast, not 2x or more
- Excess yeast produces a pronounced yeasty or alcoholic off-flavor and can exhaust the available sugars before the dough is fully developed
- Compensate for reduced yeast by extending the bulk fermentation time by 25-40%
- For instant yeast vs. active dry yeast: instant yeast = 75% of active dry by weight; this ratio does not change with scaling

### Step 4: Calculate Adjusted Quantities

Apply the correct scaling category rule to each ingredient and record both the exact mathematical result and the practical rounded measure.

- Work through the ingredient list systematically, one ingredient at a time
- For each ingredient: (a) identify its category, (b) apply the multiplier or adjusted multiplier, (c) express the result in the same unit as the original, (d) convert to a practical kitchen measure
- Practical kitchen measure rounding hierarchy (always round to the nearest of these): 1/16 tsp, 1/8 tsp, 1/4 tsp, 1/2 tsp, 3/4 tsp, 1 tsp, 1.5 tsp, 2 tsp, 1 tbsp (3 tsp), 1.5 tbsp, 2 tbsp, 1/4 cup, 1/3 cup, 1/2 cup, 2/3 cup, 3/4 cup, 1 cup, then cup increments of 1/4
- For amounts over 4 cups, express in cups and fractions; for amounts over 8 cups, consider expressing in quarts (1 quart = 4 cups)
- If the user has a kitchen scale, provide gram equivalents for ingredients where weight is more accurate -- flour, sugar, cocoa, and butter are particularly well served by weight measurement
- Standard weight equivalents: 1 cup all-purpose flour = 120-125g; 1 cup granulated sugar = 200g; 1 cup brown sugar (packed) = 213g; 1 cup cocoa powder = 85-90g; 1 cup butter = 227g; 1 large egg (without shell) = 50g

### Step 5: Determine Pan Size and Configuration

Pan size affects heat distribution, batter depth, and baking time. This step is critical for baking and irrelevant for stovetop cooking.

- Pan volume is the governing variable -- batter depth in the pan determines bake time more than any other single factor
- Target batter depth: for cakes, 2-3 inches of batter fills to approximately half the pan's depth (standard for layer cakes); for brownies and bars, 1-1.5 inches; for quick breads, pan should be 2/3 full; for muffins, cups should be 2/3 full
- Pan volume reference chart:
  - 8-inch round (2 inches deep): approximately 4 cups / 960 mL
  - 9-inch round (2 inches deep): approximately 6 cups / 1.4 L
  - 8x8-inch square (2 inches deep): approximately 6 cups / 1.4 L
  - 9x9-inch square (2 inches deep): approximately 8 cups / 1.9 L
  - 9x13-inch rectangle (2 inches deep): approximately 14 cups / 3.3 L
  - 10x15-inch jelly roll pan (1 inch deep): approximately 10 cups / 2.4 L
  - Standard loaf pan 9x5 (3 inches deep): approximately 8 cups / 1.9 L
  - Standard muffin tin (12 cups): approximately 3 cups total capacity (1/4 cup per cup)
  - 12-cup Bundt pan: approximately 12 cups / 2.8 L
- When increasing the batch, calculate total batter volume, then determine how many of the target pans are needed to achieve the correct fill depth
- Always recommend slightly under-filling rather than over-filling -- batter that rises above the pan rim creates uneven layers and structural problems
- When switching from one pan type to another (e.g., round to rectangular), use volume equivalence to determine the multiplier needed

### Step 6: Adjust Temperature and Cooking Time

Time and temperature are the most variable adjustments -- treat all time estimates as starting points, not absolutes.

**Baking time adjustments for oven-baked goods:**
- Same pan size, same number of pans (batches baked sequentially): temperature unchanged, time unchanged
- Same pan size but oven loaded with multiple pans simultaneously: increase time by 5-10 minutes and rotate pans at halfway point; hot air circulation is impeded
- Larger pan with the same batter depth: temperature unchanged, time may increase by 5-10 minutes (more thermal mass in the pan itself)
- Larger pan with deeper batter (less spread): reduce temperature by 25°F (15°C) and increase time by 20-35% -- the exterior will overcook before the interior is done at normal temperature
- Smaller pan than original or converted to muffins/cupcakes: increase temperature by 25°F (15°C) and reduce time by 25-35%

**Stovetop time adjustments:**
- Doubling a sauté or stir-fry: increase cook time by 15-25% but the more important variable is pan size -- do not crowd ingredients; cook in batches if necessary
- Doubling a soup or stew: reduce liquids by 10-15% at first addition; liquids can always be added later
- Halving a soup or stew: check that the liquid still covers the solids sufficiently; you may need proportionally more liquid than the scale suggests
- Reduction sauces: time for reduction does not scale linearly -- a larger pan with more surface area may actually reduce faster; a deeper pot with the same volume will reduce more slowly

**Doneness tests always override time estimates:**
- Baked goods: internal temperature probe (chocolate cake done at 210°F / 99°C; yeast bread done at 190-210°F / 88-99°C depending on style; custard done at 170-175°F / 77-79°C)
- Toothpick test for cakes: clean toothpick = done; moist crumbs = done; wet batter = not done
- Bread: hollow sound when tapped on the bottom; pull away from pan sides
- Meat: always use a probe thermometer referenced to safe internal temperatures

### Step 7: Present the Scaled Recipe With All Notes

Assemble the scaled recipe in the output format below, including all adjustment notes so the user understands why certain ingredients were not multiplied proportionally.

- Present the ingredient table with all four columns (original, exact scaled, practical measure, notes)
- Flag every non-linear adjustment in the Adjustments Applied section with a plain-language explanation
- Provide the cooking time and temperature table with explicit reasoning
- If batch-splitting is recommended, state this clearly and provide the per-batch quantities
- If the user has a kitchen scale, offer to provide gram-based quantities
- Add a brief recommendation section if there are important practical tips (pan greasing, batter distribution, oven rack position for multiple pans)

---

## Output Format

```
## Scaled Recipe: [Recipe Name]

**Original:** [X] servings | **Target:** [Y] servings | **Multiplier:** [Z]x
**Recipe Category:** [Baking / Stovetop Cooking / Oven Roasting / Other]
**Batch Strategy:** [Single batch / Two batches of X / Three batches of X]

---

### Scaled Ingredients

| Ingredient | Original | Exact Scaled | Practical Measure | Scaling Category & Notes |
|------------|----------|--------------|-------------------|--------------------------|
| [ingredient] | [amount + unit] | [exact math result] | [kitchen measure] | [Category + any cap or reduction applied] |

---

### Adjustments Applied

List only the non-linear adjustments -- ingredients that were NOT simply multiplied by the full scaling factor.

- **[Ingredient]:** [What was done and why. E.g., "Baking powder capped at 2.5x (2.5 tsp) instead of the calculated 3.3 tsp. Excess leavening causes rapid over-rise, center collapse during cooling, and metallic aftertaste."]
- **[Ingredient]:** [What was done and why.]

---

### Cooking Time and Temperature

| Parameter | Original | Scaled | Reason |
|-----------|----------|--------|--------|
| Oven temperature | [°F / °C] | [°F / °C] | [e.g., Reduced 25°F for deeper batter in larger pan] |
| Bake time | [min] | [min] | [e.g., Increased 20% for deeper batter -- verify with toothpick] |
| Doneness test | [test] | [same test] | [Note: time is an estimate; the doneness test is definitive] |

---

### Pan Configuration

| Original Pan(s) | Volume | Scaled Pan Option | Volume | Batter Depth Match |
|-----------------|--------|-------------------|--------|--------------------|
| [pan description] | [cups] | [pan description] | [cups] | [Good / Shallow / Deep -- note effect] |

**Recommended configuration:** [State which option is best and why.]

---

### Batch-Splitting Recommendation (if applicable)

[Only include this section if the multiplier exceeds 3x for baking, or 4x for cooking.]
- Recommended approach: [e.g., Make two separate 2x batches rather than one 4x batch]
- Per-batch quantities: [Divide the scaled ingredient table in half and present per-batch measures]

---

### Practical Tips

- [Pan preparation tip, batter distribution tip, oven rack position, resting time, etc.]
- [Any flavor-adjustment notes, e.g., "Taste and adjust salt after mixing; the 75% scaling is a starting point"]
```

---

## Rules

1. **The leavening cap is absolute.** Baking powder and baking soda must never exceed 2.5x the original amount in a single batch, regardless of the overall scaling multiplier. The consequences are not merely cosmetic -- over-leavening causes rapid CO₂ release before gluten sets, resulting in batter that rises faster than the protein structure can support, then collapses into a dense, gummy center. The resulting baked good cannot be saved after baking. When the multiplier exceeds 2.5x, explicitly note the cap and recommend batch-splitting.

2. **Salt and potent aromatics scale at 75% of the multiplier for batches over 2x.** Salt perception is non-linear due to how human taste receptors respond to ion concentration gradients. A 3x batch will taste 15-20% saltier than the original if salt is tripled. The same applies to cayenne, garlic powder, ground cloves, anise, and strong extracts. Always note that the 75% figure is a starting point and the user should taste and adjust.

3. **Almond extract and peppermint extract scale at 50%, not 75%.** These contain extremely concentrated volatile aromatic compounds. Even a small excess completely overwhelms all other flavors. When in doubt, under-scale and add more at the end.

4. **Eggs must always be rounded to whole numbers in baking.** The only exception is halving a single-egg recipe, which calls for 2 tablespoons of beaten egg. For any other fractional egg result, round to the nearest whole number -- round down for cookies and quick breads to avoid excess moisture, round up for cakes to maintain structure and lift.

5. **Yeast does not scale linearly above 2x.** For batches between 2x and 4x, use 1.5x the original yeast quantity and extend bulk fermentation by 25-40%. Excess yeast exhausts fermentable sugars prematurely, creating alcohol and CO₂ faster than gluten can trap it, leading to over-proofed dough that collapses and a strong, unpleasant yeasty flavor in the finished bread.

6. **Never scale a baking recipe beyond 4x in a single batch.** At 4x and above, home equipment creates compounding problems: stand mixer bowls max out at 5-7 quarts, ovens cannot maintain even heat distribution across extremely large pans, and the chemistry of gluten development and leavening becomes unpredictable. Recommend multiple standard-sized batches instead, and provide per-batch quantities.

7. **Cooking time is always an estimate; doneness tests are always definitive.** Internal temperature probes are the most reliable tool. Provide the target internal temperature alongside the estimated time whenever possible. Do not present a scaled cooking time as if it is precise -- frame it as a starting point and give the user the physical cue to look for.

8. **Pan fill level matters more than pan size equivalence.** A 9-inch round and an 8-inch square hold nearly identical volumes (both approximately 6 cups), but if you pour 6 cups of cake batter into each, the depth will differ by fractions of an inch, making them effectively interchangeable. What matters is matching batter depth to the original, not matching pan dimensions. When recommending pan substitutions, calculate fill depth, not just total volume.

9. **Scaling down (halving, quartering) is generally safer than scaling up but has its own precision pitfalls.** Small quantities of leavening, spice, and salt become difficult to measure accurately with standard kitchen measuring spoons. For any amount under 1/4 teaspoon, recommend a digital kitchen scale accurate to 0.1g, or describe the measurement in physical terms (a "scant 1/8 teaspoon" or a "generous pinch"). A kitchen scale removes all ambiguity.

10. **Recipes expressed in package or can units must be resolved by weight before scaling.** "One can of diced tomatoes" is ambiguous -- cans come in 14.5 oz, 28 oz, and 32 oz sizes. Always identify the exact weight of the original unit, multiply by the scaling factor, and then recommend what to purchase and how much to use from each container. Never tell a user to "use two cans" if the scaled amount is 22 oz and a standard can is 14.5 oz -- be specific.

---

## Edge Cases

### Scaling Baking Recipes Beyond 3x

For cakes, cookies, quick breads, muffins, and pastries, scaling beyond 3x in a single batch is not recommended as a first choice. The combined effects of leavening caps, liquid reduction, fat reduction, and oven heat distribution create compounding inaccuracies. The leavening-to-flour ratio, which governs rise and texture, will be noticeably off from the original. The recommended approach: make the recipe at 2x or 3x multiple times. Provide the user with per-batch quantities and note that sequential batches take longer but produce more reliable results. If the user insists on a single large batch, apply all non-linear adjustment rules strictly, flag the risk explicitly, and recommend a test batch before the final occasion.

### Halving Recipes With Small Quantities of Leavening

When a recipe calls for 1/2 teaspoon baking powder and the user is halving it to 1/4 teaspoon, this is within standard measuring spoon range and is fine. When a recipe calls for 1/4 teaspoon baking soda and the user is halving it to 1/8 teaspoon, this is at the lower reliable limit of most measuring spoons. When halving results in amounts below 1/8 teaspoon, recommend a digital scale (1/8 tsp baking soda weighs approximately 0.6g; 1/4 tsp baking powder weighs approximately 1g). At amounts below 0.5g, accuracy with standard spoons is essentially impossible. Tell the user to use a scale or, if no scale is available, to use a literal small pinch and understand that the texture may vary slightly.

### High-Altitude Baking (Above 3,500 Feet / 1,065 Meters)

High altitude changes atmospheric pressure, which means CO₂ from leavening expands faster and liquids evaporate more quickly in the oven. These adjustments apply in addition to any scaling adjustments:
- Reduce baking powder by 20-25% of the scaled (already capped) amount
- Reduce baking soda by 20-25% of the scaled (already capped) amount
- Increase liquid by 2-4 tablespoons per cup of flour in the recipe
- Reduce granulated sugar by 1-2 tablespoons per cup in the recipe (excess sugar weakens structure more severely at altitude)
- Increase oven temperature by 15-25°F
- Above 6,500 feet (2,000 meters), the reduction in baking powder/soda increases to 25-30%
Note: apply altitude adjustments to the post-scaled, post-capped quantities, not to the original amounts.

### Recipes Using Weight Measurements (Grams or Ounces)

Weight-based recipes scale with the highest accuracy. Simply multiply each ingredient's weight by the scaling multiplier -- no conversion to volume is needed and no rounding to cup measures is required. If the original recipe uses cups and the user has a kitchen scale, offer to convert the original recipe to grams before scaling -- this produces a more accurate result because volumetric cup measurements for flour, cocoa, and sugar vary by up to 20% depending on how the measuring cup is filled. For the user who has only volumetric measuring tools, weight conversion is not mandatory, but note that results may vary slightly from the original due to filling inconsistency.

### Scaling Custards, Puddings, and Egg-Thickened Sauces

These preparations are particularly sensitive to scaling because the ratio of egg proteins to liquid determines whether the custard sets or curdles. Custards (crème brûlée, pastry cream, pot de crème, lemon curd) can be scaled linearly up to 3x without adjustment, provided the cooking temperature and technique remain the same -- these are ratio-stable preparations as long as proportions hold. Beyond 3x, split into separate batches because the sheer volume of a large batch makes it difficult to maintain precise temperature control. Critical warning: do not reduce eggs in a custard below the minimum needed to set the mixture. A standard custard is 4-6 egg yolks per 2 cups cream -- scaling this down below 2 yolks per cup will produce a liquid that never sets.

### Scaling Recipes That Call for "One Package" or "One Envelope"

Dry yeast: one envelope = 2.25 tsp = 7g. Unflavored gelatin: one envelope = 2.5 tsp = 7g. Dry onion soup mix or seasoning packets: one packet = typically 1 oz / 28g. Never scale in "packages" -- always resolve to the base unit (grams or teaspoons), apply the appropriate scaling rule, then tell the user how many packages to open and how much to measure out. For gelatin specifically: it scales linearly -- 1 envelope sets 2 cups of liquid; for 6 cups of liquid, use 3 envelopes. Never round down gelatin in a molded salad or chilled dessert, as under-gelling produces a loose texture that fails to unmold.

### Stovetop Reduction and Sauce Consistency

When scaling up a sauce that requires reduction (pan sauce, gravy, caramel, beurre blanc, tomato sauce reduced to desired consistency), the relationship between starting volume and reduction time is not linear. A larger volume in the same pot reduces more slowly per unit of time because the ratio of surface area to volume decreases. If you triple a pan sauce, you may need 2.5x the original reduction time, not 3x. The practical instruction: target a visual or measured finish (1 cup of sauce, a "nappe" coating on a spoon, a temperature of 220°F for caramel) rather than a time-based instruction. Time the reduction based on achieving the target consistency, not a fixed number of minutes.

### Converting Layer Cakes to Sheet Cakes (or Vice Versa) Without Changing Serving Count

When the user wants to convert a two-layer 9-inch round cake to a 9x13 sheet cake without changing the serving count, the conversion is a pan-volume calculation, not a serving-count calculation. Two 9-inch round pans hold approximately 12 cups total. One 9x13 inch pan holds approximately 14 cups. The user's batter is sufficient for the 9x13 with no scaling needed -- in fact, they have slightly less batter than the 9x13 holds at half capacity, which produces a slightly thinner sheet cake. No ingredient changes are needed. Temperature stays the same; bake time decreases by 5-10 minutes because the thinner layer bakes faster. This is a common request that users misidentify as a "scaling" problem -- in fact it is purely a pan conversion with no recipe changes required.

---

## Example

**User input:** "I have a chocolate cake recipe that makes 8 servings. I need to make it for 22 people. Here's the recipe: 2 cups all-purpose flour, 2 cups granulated sugar, 3/4 cup cocoa powder, 2 tsp baking soda, 1 tsp baking powder, 1 tsp salt, 2 eggs, 1 cup buttermilk, 1 cup hot water, 1/2 cup vegetable oil, 2 tsp vanilla extract. Bakes at 350°F for 30-35 minutes in two 9-inch round pans."

---

## Scaled Recipe: Chocolate Cake

**Original:** 8 servings | **Target:** 22 servings | **Multiplier:** 2.75x
**Recipe Category:** Baking (chemically leavened cake)
**Batch Strategy:** Single batch -- multiplier of 2.75x is within the safe single-batch range for this recipe, with leavening caps applied

---

### Scaled Ingredients

| Ingredient | Original | Exact Scaled (×2.75) | Practical Measure | Scaling Category & Notes |
|------------|----------|----------------------|-------------------|--------------------------|
| All-purpose flour | 2 cups | 5.5 cups | 5 1/2 cups | Category 1 -- direct linear scale |
| Granulated sugar | 2 cups | 5.5 cups | 5 1/2 cups | Category 1 -- direct linear scale |
| Cocoa powder | 3/4 cup | 2.0625 cups | 2 cups | Category 1 -- rounded down to nearest 1/4 cup; cocoa is forgiving within 3% |
| Baking soda | 2 tsp | 5.5 tsp (exceeds cap) | **5 tsp (2.5x cap)** | Category 2 -- CAPPED. Exact math gives 5.5 tsp but leavening is capped at 2.5x the original (5 tsp). Excess causes rapid over-rise, center collapse, and metallic aftertaste. |
| Baking powder | 1 tsp | 2.75 tsp (exceeds cap) | **2 1/2 tsp (2.5x cap)** | Category 2 -- CAPPED. Exact math gives 2.75 tsp; capped at 2.5 tsp. |
| Salt | 1 tsp | 2.75 tsp (unadjusted) | **2 tsp (75% rule)** | Category 3 -- reduced to 75% multiplier. 2.75 tsp × 0.75 = 2.06 tsp, rounded to 2 tsp. Salt perception is non-linear; taste batter and adjust before baking. |
| Eggs | 2 | 5.5 | **6 eggs** | Category 6 -- rounded up to nearest whole egg. For cakes, rounding up 0.5 egg adds minimal excess moisture and maintains structure. |
| Buttermilk | 1 cup | 2.75 cups | **2 1/2 cups** | Category 5 -- liquid reduction for baking at 2.75x. Exact 2.75 cups reduced by ~10% = 2.475 cups, rounded to 2 1/2 cups. Prevents overly wet batter structure. |
| Hot water | 1 cup | 2.75 cups | **2 1/2 cups** | Category 5 -- same 10% liquid reduction applied. This is the primary thinning liquid; reduction is especially important here. |
| Vegetable oil | 1/2 cup | 1.375 cups | **1 1/4 cups** | Category 4 -- fat reduced by ~10% for structural integrity at 2.75x scale. Exact 1.375 cups reduced to 1.25 cups. |
| Vanilla extract | 2 tsp | 5.5 tsp | 5 1/2 tsp | Category 1 -- vanilla scales linearly in baking; it does not overpower in the same way almond extract does. Measure as 1 tbsp + 2 1/2 tsp for convenience. |

---

### Adjustments Applied

- **Baking soda (2.5x cap applied):** Calculated exact amount was 5.5 tsp; capped at 5 tsp (2.5x the original 2 tsp). This recipe has a relatively high baking soda ratio to start. Excess baking soda would react too aggressively with the buttermilk, creating an extremely rapid rise before the gluten proteins set, followed by collapse. The finished cake would have a gummy, sunken center and a soapy or metallic flavor.

- **Baking powder (2.5x cap applied):** Calculated exact amount was 2.75 tsp; capped at 2.5 tsp. Even though baking powder is less chemically aggressive than baking soda, the combination of both leavenings in this recipe makes it especially important to hold the line on the cap. The total leavening power of this batch is already substantial -- no further increase is safe.

- **Salt (75% rule applied):** Calculated amount was 2.75 tsp; adjusted to 2 tsp (approximately 73%, rounded to practical measure). The original recipe is lightly salted at 1/8 tsp per serving. At 2.75x, direct multiplication would produce a perceptibly saltier cake. Start with 2 tsp; after making the batter, taste a small amount and add a pinch more if desired.

- **Buttermilk and hot water (10% liquid reduction):** Both primary liquids reduced from 2.75 cups to 2.5 cups each. In a 2.75x batch, the surface area to volume ratio in the mixing bowl and baking pan means less evaporation during mixing and a denser batter if liquids are at full proportion. This is particularly important in a chocolate cake where the hot water serves both to bloom the cocoa and to thin the batter to the correct viscosity. If the batter looks notably thicker than you expect from the original recipe, add back liquid 2 tablespoons at a time.

- **Vegetable oil (10% fat reduction):** Reduced from 1.375 cups to 1.25 cups. Excess fat in a scaled baking batch weakens gluten strands and can prevent the cake from holding its structure in the center. The 10% reduction is conservative and the cake will still be moist.

- **Eggs (rounded up from 5.5 to 6):** In cake batters, the egg provides both emulsification (the yolk's lecithin) and structure (egg white protein sets during baking). Rounding up by half an egg adds approximately 25g of liquid and a small amount of additional structure. For a chocolate cake of this size, this is preferable to the alternative of attempting to measure a half egg.

---

### Cooking Time and Temperature

| Parameter | Original | Scaled | Reason |
|-----------|----------|--------|--------|
| Oven temperature | 350°F (175°C) | **325°F (165°C)** | The scaled batter is deeper in the pans. At 350°F, the exterior crust and edges will set and darken before the center reaches doneness temperature. Dropping 25°F allows more even heat penetration. |
| Bake time | 30-35 min | **42-52 min (check at 40 min)** | More batter per pan = more thermal mass to heat through. The actual time depends on how the batter is distributed across pans (see Pan Configuration below). Begin checking with a toothpick at 40 minutes. |
| Doneness test | Toothpick | **Toothpick + internal temp** | Insert a toothpick in the center -- it should come out with moist crumbs, not wet batter. For highest confidence, an instant-read probe in the thickest part of the center should read 205-210°F (96-99°C). Time is an estimate only. |

---

### Pan Configuration

| Original Pan | Volume | Scaled Pan Option | Volume | Batter Depth Assessment |
|--------------|--------|-------------------|--------|-------------------------|
| Two 9-inch round pans | ~12 cups total | **Option A: Three 9-inch round pans** | ~18 cups total | Best match -- same batter depth per pan (approximately 2 inches), produces a 3-layer cake |
| Two 9-inch round pans | ~12 cups total | **Option B: Two 9x13 pans** | ~28 cups total | Shallower batter -- reduce bake time by 8-12 min, increase temp back to 350°F |
| Two 9-inch round pans | ~12 cups total | **Option C: One 9x13 + one 9-inch round** | ~20 cups total | Uneven depths; bake separately and check each pan individually |

**Recommended configuration: Option A -- three 9-inch round pans.**
This produces the closest match to the original batter depth (approximately 2 inches of batter per pan), meaning the temperature and time guidance above applies directly. The result is a visually impressive 3-layer cake appropriate for 22 servings. Grease and flour all three pans; alternatively, line the bottoms with parchment circles. To ensure even layers, weigh the total batter on a kitchen scale and divide by three, measuring into each pan by weight.

---

### Practical Tips

- **Batter distribution:** Weigh the total batter if you have a kitchen scale. A kitchen scale removes all guesswork from dividing batter into three equal layers. Expect total batter weight of approximately 2,200-2,400g for this batch; target approximately 760-800g per pan.
- **Oven rack position:** With three round pans, place two on the center rack and one directly below (staggered, not stacked). Rotate the pans at the 20-minute mark: swap the top pan to the lower rack and bring the lower pan to the top. This compensates for the uneven heat distribution that occurs when two racks are in use.
- **Cool completely before frosting:** A larger cake retains heat longer than the original. Allow layers to cool in the pans for 15 minutes, then turn out onto wire racks. Wait until completely cool at the center (at least 1.5-2 hours at room temperature) before applying frosting -- warm layers melt buttercream and cause layers to slide.
- **Salt check:** After mixing the batter, taste a small amount (before the eggs go in, or note that the batter contains raw eggs if the user prefers not to taste). The 2 tsp salt is a starting point; add a pinch more if the batter tastes flat.
- **Frosting quantity:** This scaling skill covers the cake batter only. If the original recipe includes a frosting component, the frosting should be scaled separately using the same multiplier (2.75x) applied to its ingredient list, with its own leavening and salt adjustments as needed.

---

### Quick Reference: Scaling Rules Applied in This Example

| Rule | Trigger | What Was Done |
|------|---------|---------------|
| Leavening cap | Multiplier > 2.5x | Both baking soda and baking powder capped at 2.5x the original |
| Salt reduction | Multiplier > 2.0x | Salt scaled at 75% of multiplier, not 100% |
| Liquid reduction | Multiplier > 3.0x... | *(This multiplier is 2.75x; reduction applied as a precautionary measure given the recipe's high liquid ratio)* |
| Fat reduction | Multiplier > 3.0x... | *(Applied precautionarily at 2.75x given the high combined liquid + fat volume)* |
| Egg rounding | Any fractional egg | Rounded up from 5.5 to 6 whole eggs |
| Temperature reduction | Deeper batter in same pan size | Reduced from 350°F to 325°F |
| Time increase | More batter per pan | Increased from 30-35 min to 42-52 min; check at 40 min |
