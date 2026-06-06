---
name: recipe-modification-diet
description: |
  Adapts standard recipes for common dietary restrictions including gluten-free, dairy-free, vegan, low-sodium, and egg-free modifications. Provides ingredient substitution ratios, texture and flavor impact notes, and technique adjustments for each modification type.
  Use when the user asks about modifying a recipe for dietary restrictions, substituting ingredients for allergies, making a recipe gluten-free or dairy-free, or adapting a dish for someone with dietary limitations.
  Do NOT use for clinical dietary management, allergy severity assessment, or creating new recipes from scratch.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "nutrition cooking guide"
  category: "health-wellness"
  subcategory: "nutrition-diet"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Recipe Modification Diet

> **Disclaimer:** This skill provides general wellness and nutrition information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. Substitution guidance is not a substitute for professional dietary counseling. Individuals managing diagnosed conditions such as celiac disease, phenylketonuria, or severe food allergies should work with a registered dietitian or allergist. If you are experiencing a medical emergency, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- A user has an existing recipe and needs specific ingredient substitutions for a named dietary restriction -- gluten-free, dairy-free, vegan, egg-free, low-sodium, nut-free, low-FODMAP, or any combination thereof
- A user identifies a specific guest, family member, or household member with a dietary limitation and wants to adapt a dish without making an entirely separate meal
- A user asks how a proposed substitution will affect the texture, rise, browning, flavor profile, or shelf life of a dish
- A user needs to decode hidden sources of a restricted ingredient in a recipe (e.g., hidden gluten in soy sauce, hidden dairy in breadcrumbs, hidden egg in pasta dough)
- A user wants to understand why a modified recipe failed and how to troubleshoot it (e.g., "my gluten-free bread came out gummy" or "my vegan cookies spread too thin")
- A user wants to make a recipe compliant with multiple simultaneous restrictions and needs to understand how those substitutions interact structurally
- A user preparing food for someone with a non-anaphylactic intolerance (lactose intolerance, non-celiac gluten sensitivity) wants proportionate guidance on tolerance thresholds

**Do NOT use when:**
- The user describes symptoms of an allergic reaction or anaphylaxis -- direct them to emergency services immediately
- The user needs clinical dietary management for a medical condition such as celiac disease, kidney disease, PKU, or diabetes -- refer them to a registered dietitian (use `clinical-nutrition-guidance` if available)
- The user wants to design a new recipe from scratch based on nutritional macros -- use a recipe-creation or meal-planning skill instead
- The user asks broadly about what diet to follow for a health goal -- use `dietary-pattern-overview` or `nutrition-goal-setting`
- The user needs cross-contamination protocols at the manufacturing or commercial kitchen level -- this exceeds the scope of home cooking modification guidance
- The user asks whether a specific restaurant or packaged product is safe for their allergy -- that requires real-time label verification and is outside the scope of recipe guidance
- The user wants to calculate precise nutritional macros or micronutrients for the modified recipe -- use a `nutrition-calculation` skill

---

## Process

### Step 1: Gather Complete Recipe Information and Restriction Details

Before proposing any substitution, collect the full picture.

- Ask for the complete ingredient list with amounts, not just the ingredient names. Ratios matter -- substituting 1 tablespoon of butter behaves differently from substituting 1 cup.
- Identify the restriction type precisely: Is this a medical allergy (IgE-mediated), an intolerance (enzyme deficiency or sensitivity), a preference (vegan ethics), or a religious/cultural requirement (halal, kosher)? The consequences of trace exposure differ dramatically.
- Ask whether the priority is flavor fidelity, structural equivalence, nutritional equivalence, or simply "good enough for a casual dinner." This determines how aggressive the substitution should be.
- Scan the entire recipe -- not just the obvious ingredients -- for hidden sources of the restricted component. Common hidden sources:
  - Gluten: soy sauce, malt vinegar, modified food starch, barley-based broths, beer, oats (unless certified gluten-free), licorice, some spice blends
  - Dairy: breadcrumbs (sometimes contain butter), some margarines, caramel color in some products, casein in "non-dairy" coffee creamers, lactic acid starter cultures (in some vegan cheeses)
  - Eggs: pasta (especially fresh), some bread doughs, egg wash on pastry, Caesar dressing, hollandaise, some wine (egg white fining agents), marshmallows
  - Sodium: baking powder (30-40 mg per teaspoon), canned tomatoes, soy sauce, Worcestershire sauce, pickled ingredients, seasoning packets
- Identify the structural role each restricted ingredient plays before choosing a substitute (see Step 2).

### Step 2: Identify the Functional Role of Each Restricted Ingredient

Every ingredient serves one or more culinary functions. Substitution must address the function, not just the ingredient.

- **Gluten (from flour, semolina, durum wheat):** Provides extensibility and elasticity in dough through gliadin and glutenin protein networks. Without it, structure must come from starch gelatinization, hydrocolloids (xanthan gum, psyllium husk), or protein networks from alternative flours (almond, chickpea).
- **Dairy fat (butter, cream, full-fat milk):** Provides fat coating for flakiness (pastry), emulsification (sauces), Maillard browning contributions, and richness. Butter is approximately 80% fat, 18% water, and 2% milk solids -- each component plays a role in baking chemistry.
- **Dairy protein (casein, whey):** Provides stretch in melted cheese, helps bind sauces, contributes to browning in baked goods. This is why most plant-based cheese alternatives do not melt well -- they lack casein.
- **Eggs:** Have four distinct functions that may require separate substitutions:
  - *Binding:* holds structure together (replacement: flax egg, chia egg, aquafaba)
  - *Leavening:* steam and air incorporated during whipping (replacement: aquafaba whipped to stiff peaks, commercial egg replacer with leavening agents)
  - *Emulsification:* lecithin in yolk stabilizes fat-water emulsions (replacement: sunflower lecithin powder, soy lecithin)
  - *Moisture and richness:* yolk fat adds tender crumb (replacement: full-fat plant yogurt, silken tofu)
- **Sodium (salt):** Suppresses bitter compounds, enhances aroma volatiles, controls yeast fermentation rate, strengthens gluten networks, and acts as a preservative in cured items.
- **Nuts:** Provide fat, texture contrast, and flavor. In baked goods, nut flours (almond, hazelnut) also provide protein and fat that affect crumb structure.

### Step 3: Select the Correct Substitution Using Function-Matched Replacement Logic

Apply the following substitution principles, organized by restriction type. Ratios are per unit of the original ingredient unless specified.

**Gluten-Free Substitutions:**

- *All-purpose flour in baked goods:* Use a commercial 1:1 gluten-free blend that already contains a hydrocolloid binder. These blends are typically formulated with rice flour, tapioca starch, and potato starch. For 100g of all-purpose flour, use 100g of the blend. If the blend does not contain xanthan gum, add 1/4 tsp xanthan gum per cup of flour for cookies/cakes, 1/2 tsp per cup for bread, and 3/4 tsp per cup for pizza dough.
- *Alternatively, for single-flour substitution:* Use 70g superfine white rice flour + 15g tapioca starch + 15g potato starch per 100g all-purpose flour. This DIY blend is more cost-effective and allows ratio adjustment.
- *Psyllium husk as a binder in bread:* 1 tsp psyllium husk powder per cup of gluten-free flour creates a gel network that mimics gluten elasticity. Psyllium creates a slightly gummy texture if overused -- do not exceed 2 tsp per cup.
- *Wheat flour as a roux thickener:* Replace with equal parts cornstarch (which has twice the thickening power -- use half the amount if a 1:1 texture match is desired) or arrowroot starch for acidic dishes (arrowroot does not break down in acidic environments, unlike cornstarch). For a butter-flour roux, use sweet rice flour (mochiko) at a 1:1 ratio -- it produces the smoothest gluten-free sauce base.
- *Soy sauce:* Replace with tamari (most is gluten-free, but verify label) or coconut aminos (slightly sweeter, lower sodium, 1:1 ratio).
- *Oats:* Only certified gluten-free rolled oats are appropriate; standard oats carry high cross-contamination risk from shared milling equipment.
- *Breadcrumbs (breading):* Use gluten-free panko (available commercially), crushed rice crackers, or a mixture of 50% gluten-free flour + 50% cornstarch for a lighter coating. The starch blend fries crispier than breadcrumbs alone.

**Dairy-Free Substitutions:**

- *Milk (1 cup):* In savory dishes and most baking, oat milk is the most neutral substitute. For recipes that require fat content (custards, ice cream base, cream sauces), use full-fat coconut milk -- the fat content (12-17%) approaches whole milk's 3.5% fat only if blended or if the recipe tolerates the coconut flavor. Soy milk has the closest protein content to dairy milk and performs best in baking. Almond milk (low fat, thin) is the least suitable for baking or creamy sauces.
- *Butter in baking (1 cup):* Solid stick-form plant-based butter at 1:1. Avoid spreadable tub margarines -- their higher water content (some contain 35-40% water versus butter's 18%) disrupts pastry and cookie structure, causing excessive spread or soggy texture.
- *Butter for sautéing or finishing sauces:* Refined coconut oil at 1:1, or a neutral-flavor plant-based butter. Virgin coconut oil imparts coconut flavor; refined does not.
- *Heavy cream for sauces (1 cup):* Full-fat canned coconut cream is the closest match in fat content and mouthfeel. For neutral-flavor applications, use cashew cream (soak 1 cup raw cashews in water 4+ hours, blend with 3/4 cup fresh water to produce ~1 cup cream). Cashew cream does not curdle in acidic sauces as readily as coconut cream.
- *Cream cheese (8 oz):* Blended silken tofu (drained) with 1 tbsp lemon juice and 1 tbsp neutral oil approximates cream cheese texture and tang. Alternatively, soaked and blended raw cashews with lemon and apple cider vinegar.
- *Parmesan or sharp cheese as flavor agent:* 3 tbsp nutritional yeast + 1 tbsp cashew flour + 1/4 tsp garlic powder per 1/4 cup grated parmesan. This mixture adds umami and a nutty/savory note.
- *Yogurt (1 cup):* Full-fat coconut yogurt or soy yogurt at 1:1. In baking, dairy yogurt's lactic acid activates baking soda -- plant-based yogurts also contain acid, but the strength varies. If using a very mild plant yogurt, add 1/2 tsp apple cider vinegar to ensure adequate baking soda activation.
- *Buttermilk (1 cup):* 1 cup unsweetened plant milk + 1 tbsp apple cider vinegar or white wine vinegar. Let sit 5 minutes until slightly curdled. This replicates buttermilk's acidity for leavening and tenderizing.

**Vegan Substitutions (Animal Product Removal Beyond Dairy):**

- *Egg as binder (1 large egg = ~50g):* Ground flaxseed egg -- 1 tbsp ground flaxseed + 3 tbsp water, rest 5 minutes. Best for dense baked goods (muffins, cookies, brownies). Chia egg -- 1 tbsp chia seeds + 3 tbsp water, rest 10 minutes. Similar binding, slightly detectable seed texture. Unsweetened applesauce -- 1/4 cup per egg, adds moisture and mild sweetness; best for spiced cakes and quick breads. Mashed ripe banana -- 1/4 cup per egg; adds banana flavor, appropriate in banana bread or tropical recipes only.
- *Egg as leavening (whipped):* Aquafaba (liquid from canned chickpeas) can be whipped to stiff peaks similar to egg whites using a stand mixer -- approximately 3 minutes on high. Use 3 tbsp aquafaba per egg white. Cream of tartar (1/8 tsp per 3 tbsp aquafaba) stabilizes the foam. This works for meringues, pavlova, chocolate mousse, and angel food cake analogues.
- *Egg as emulsifier:* 1/2 tsp sunflower lecithin powder dissolved in the fat component of the recipe. Useful for mayonnaise-style emulsions and smooth custard replacements.
- *Egg for egg wash (glaze):* 2 tbsp plant-based milk + 1 tsp maple syrup brushed on pastry provides golden browning. Plant-based milk alone provides some Maillard browning but less color than egg wash.
- *Honey:* Maple syrup at 1:1 is slightly thinner and less sweet (maple is ~60 brix vs. honey's ~79 brix), so reduce liquid elsewhere in the recipe by 1 tbsp per 1/4 cup maple syrup used. Agave nectar at 3/4:1 (use 3 tbsp agave per 1/4 cup honey) -- agave is sweeter, has a lower glycemic index, and is very neutral in flavor.
- *Gelatin (1 tsp powder):* Agar-agar powder at 1:1, but technique differs critically -- agar must be dissolved in cold liquid then brought to a full boil for 2 minutes to activate. Agar sets firmer and more brittle than gelatin; reduce by 15-20% if a softer set is needed. Agar does not melt at body temperature, so agar-set desserts have a distinct mouthfeel.
- *Meat-based stocks:* Mushroom stock provides the deepest umami substitute for beef or chicken stock. To make a rapid mushroom stock: simmer 1 oz dried porcini mushrooms, 1 tbsp tomato paste, 1/2 tsp soy sauce, and 1 tsp miso in 4 cups water for 20 minutes. This produces rich, savory stock with significant glutamate content.
- *Lard or rendered fat in pastry:* Solid vegetable shortening or chilled coconut oil at 1:1 for flakiness. Coconut oil-based pastry must be kept cold throughout -- coconut oil melts at 76°F (24°C) and warm hands will destroy the fat layers.

**Low-Sodium Substitutions:**

- *Salt reduction:* A 25% reduction is nearly imperceptible to most people. A 50% reduction is noticeable but acceptable with flavor compensation. Below 50% of original salt, the dish will taste flat without strategic layering of other flavor compounds.
- *Flavor compensation for salt reduction:* Acid (lemon juice, lime juice, vinegars) sharpens flavor perception and partially compensates for lost saltiness. Add at the end of cooking to preserve volatile aromatics. Umami compounds (dried mushrooms, tomato paste, nutritional yeast, miso -- check sodium content of miso) enhance flavor depth. Fresh herbs and toasted whole spices bloom fat-soluble aroma compounds that distract from the absence of salt.
- *Soy sauce (1 tbsp, ~900mg sodium):* Low-sodium soy sauce at 1:1 (approximately 570mg sodium). Coconut aminos at 1:1 (approximately 90-130mg sodium, plus slight sweetness -- balance with 1/4 tsp rice vinegar if desired).
- *Canned beans and vegetables:* Rinsing with cold water for 30 seconds removes approximately 40% of sodium. Draining and rinsing canned tomatoes removes 20-30%. For recipes where the canning liquid matters (tuna, sardines), switching to no-salt-added versions and adding 1 tsp liquid back is preferable to rinsing.
- *Baking powder (contains sodium bicarbonate):* Low-sodium baking powder exists commercially. Alternatively, use potassium bicarbonate at a 1:1 ratio as a baking soda substitute for low-sodium baking (mild potassium taste at higher quantities).
- *MSG and salt alternatives:* Potassium chloride-based salt substitutes provide saltiness through a different ionic mechanism but carry a bitter or metallic aftertaste at high quantities. Suitable at up to 30-40% of the total sodium replacement; beyond that, the bitterness becomes noticeable in most users.

**Nut-Free Substitutions:**

- *Almond flour (1 cup):* In baked goods, sunflower seed flour at 1:1. Note that sunflower seed flour turns green when it reacts with baking soda or baking powder due to a chlorogenic acid reaction -- add 1 tsp cream of tartar or 1 tsp apple cider vinegar per cup of sunflower seed flour to prevent this reaction. Pumpkin seed flour at 1:1 is an alternative without the color issue.
- *Peanut butter:* Sunflower seed butter at 1:1. Tahini (sesame paste) at 1:1 for savory applications. Note sesame is a major allergen in many jurisdictions; confirm it is not also a restricted ingredient.
- *Chopped nuts as texture element:* Toasted pumpkin seeds or sunflower seeds for crunch. Rolled oats (if gluten-free is not also required) for texture in cookies. Shredded unsweetened coconut for tropical and sweet applications.
- *Nut-based milks and creams:* See dairy-free section -- oat milk and coconut milk are the primary nut-free alternatives.

### Step 4: Assess Structural Interactions for Multiple Simultaneous Restrictions

When two or more restrictions apply simultaneously, substitutions interact in ways that compound structural challenges.

- **Gluten-free + egg-free:** This combination removes both the gluten network (structure) and egg binding (structure). The recipe needs both a hydrocolloid binder (psyllium, xanthan) and a starch-based binder (flax egg, chia egg). For baked goods, add an extra tablespoon of starch (tapioca or arrowroot) per cup of flour beyond the standard substitution. Increase liquid by 1-2 tbsp to prevent dryness.
- **Gluten-free + dairy-free:** Lower-fat plant milks (almond, oat) are thinner than whole milk, which already combines with gluten-free flours that absorb less liquid. Monitor batter hydration -- gluten-free batters should look wetter than wheat batters, but plant milk may make them too wet. Use full-fat plant milk (oat barista blend or soy milk) to compensate for missing fat.
- **Vegan (egg-free + dairy-free) + gluten-free in baked goods:** This triple combination is the most challenging. Add 1 tbsp extra starch per cup of gluten-free flour, use a flax egg, use solid plant-based butter (not oil), and increase baking time by 5-7 minutes at the same temperature. The internal temperature should reach 200-205°F (93-96°C) -- use an instant-read thermometer for reliable doneness assessment.
- **Low-sodium + vegan:** Miso, soy sauce, and tamari (high-umami, low-sodium alternatives) all contain sodium. When both restrictions apply, rely on acid, fresh aromatics, and herbs rather than fermented condiments. Kombu-based liquid (simmer a 4-inch strip of dried kombu in water for 20 minutes) provides glutamate-driven umami with minimal sodium.

### Step 5: Adjust Cooking Technique for the Substitution

Ingredient substitutions often require parallel technique adjustments. Do not apply the original technique unchanged.

- **Gluten-free batters and doughs:** Do not overmix -- gluten-free batters benefit from a brief rest (20-30 minutes) to allow starches to hydrate fully before baking. Overmixing does not develop gluten (there is none) but can overwork starches and create a gummy texture. Bread doughs should have a single rise (not double); gluten-free yeast breads proof in a wet, batter-like state, not a kneadable dough.
- **Aquafaba meringues:** Whip in a completely grease-free bowl (any fat residue deflates the foam). Use cream of tartar. Beat to stiff glossy peaks, which takes 3-6 minutes in a stand mixer. Bake at low temperature (200-225°F / 93-107°C) for 1.5-2 hours and allow to cool in the oven with the door cracked to prevent cracking from thermal shock.
- **Plant-based butter in laminated doughs (croissants, puff pastry):** Butter-based lamination relies on the plasticity of dairy butter at 60-65°F (15-18°C). Plant-based butter is often more brittle when cold and softer at room temperature -- it has a narrower workable temperature range. Work quickly and return to the refrigerator every 20 minutes during folding. The finished product will have slightly less dramatic layering.
- **Agar-agar in gelatin-set desserts:** Unlike gelatin, agar begins setting at 95-113°F (35-45°C) and must be poured into molds quickly after removing from heat. It sets before it cools to room temperature. For layered jellies, each layer must be fully set before pouring the next, which takes approximately 20-30 minutes at room temperature.
- **Flax egg in cookies:** Chilling the dough is more important when using flax eggs than when using whole eggs -- the flax gel is less structurally rigid at room temperature, causing excessive spread. Minimum 30-minute chill, ideally 1-2 hours or overnight.
- **Low-sodium bread and yeast doughs:** Salt controls yeast fermentation rate. Significantly reduced salt will cause faster, less controlled fermentation. Reduce proofing time by 15-25%, check dough rise visually rather than by time, and use slightly cooler liquids (68-70°F / 20-21°C instead of 75-78°F / 24-26°C) to slow activity.

### Step 6: Evaluate Dishes That Cannot Be Reasonably Modified

Some recipes are structurally incompatible with certain restrictions. Recognize these and propose alternatives rather than a poor modification.

- **Egg-free soufflé:** A soufflé's structure is entirely dependent on whipped egg whites and yolk emulsification. Aquafaba can produce a foam, but it lacks the protein denaturation and heat-set stability of egg white -- an aquafaba soufflé will collapse more readily and cannot replicate the texture. Better alternative: a baked polenta cake or a silken tofu-based Japanese-style "steamed egg" analogue.
- **Gluten-free puff pastry:** Gluten is essential for the extensible, elastic layers in puff pastry. A gluten-free version will not achieve distinct lamination. Better alternative: gluten-free tart shells or pie crusts, which do not require layering.
- **Egg-free meringue (traditional):* Traditional meringue cannot be made without either egg whites or aquafaba. Aquafaba meringue is a viable substitute but requires more stabilization and is more humidity-sensitive. In very high-humidity environments, aquafaba meringue will weep and deflate faster than egg-white meringue.
- **Vegan traditional hollandaise:** Real hollandaise requires emulsified egg yolk lecithin and cannot be replicated exactly. A cashew-butter emulsion sauce with lemon, Dijon, and turmeric (for color) is an acceptable approximation but a different sauce.
- **Low-sodium cured or fermented products (soy sauce from scratch, kimchi, sauerkraut, cured meats):** Salt is microbiologically essential in fermentation for pathogen suppression and osmotic control. These products cannot be meaningfully made low-sodium without compromising food safety or the fermentation process.

### Step 7: Troubleshoot and Iterate

After a first attempt, the user may report failures. Apply systematic troubleshooting logic.

- **Gluten-free baked good is gummy:** Underbaked (increase oven time by 5 minutes and verify internal temperature of 200-205°F), too much xanthan gum (reduce by 1/4 tsp per cup), or too much starch in the blend.
- **Gluten-free bread is too dense:** Not enough binder (increase xanthan or psyllium by 1/4 tsp), under-proofed (gluten-free dough should proof until clearly risen and puffy, not by time), or flour blend is too high in protein-heavy flour (reduce chickpea or bean flour).
- **Vegan cookies spread too thin:** Plant-based butter too soft or high in water content -- use a different brand of solid stick butter, chill dough longer (2 hours minimum), or reduce liquid by 1-2 tbsp.
- **Dairy-free cream sauce is grainy or separated:** Coconut cream curdled due to high heat or acidic ingredients added before emulsification is stable. Keep sauce below a full boil; add acid at the end; use cashew cream instead, which is more acid-stable.
- **Flax egg-bound muffins are too wet in the center:** The flax egg adds more moisture than whole egg -- reduce another liquid in the recipe by 1-2 tbsp, or increase baking time by 5-8 minutes at the same temperature.
- **Low-sodium dish tastes flat despite herb additions:** Fat-soluble flavor compounds in herbs require adequate fat to carry aroma. If the recipe is also reduced-fat, the flavor becomes one-dimensional. Bloom dried spices in a small amount of oil for 30 seconds before adding other ingredients to maximize volatile release.

---

## Output Format

```
## Recipe Modification: [Recipe Name] → [Modification Type(s)]

> **Allergy Note:** [If applicable: Cross-contamination warning and label-check reminder.]
> **Complexity Assessment:** [Low / Medium / High -- note if the combination of restrictions
>   creates significant structural challenges]

---

### Restricted Ingredient Analysis

| Restricted Ingredient | Role in Recipe     | Substitute              | Ratio                     | Flavor/Texture Impact                  |
|-----------------------|--------------------|-------------------------|---------------------------|----------------------------------------|
| [Ingredient]          | [Binding/leavening/| [Substitute name]       | [e.g., 1:1 or 2 tbsp      | [Specific change: denser, nuttier,     |
|                       |  fat/flavor/etc.]  |                         |  per 1 egg]               |  brighter, less browning, etc.]        |
| [Ingredient]          | [Role]             | [Substitute]            | [Ratio]                   | [Impact]                               |

---

### Hidden Restricted Ingredients Found

- [Ingredient name] in [component] -- [substitution action or flag]
- [or "None identified" if none found]

---

### Technique Adjustments

- **[Recipe step or technique]:** [What changes, why it changes, and precise instruction]
- **[Recipe step or technique]:** [Adjustment and rationale]
- [Repeat for each affected step]

---

### Modified Ingredient List

- [Amount] [Substitute ingredient] *(replaces [original])*
- [Amount] [Unchanged ingredient]
- [Amount] [Unchanged ingredient]
- [Repeat full list]

---

### Expected Differences from Original

| Attribute       | Original Recipe         | Modified Version                        |
|-----------------|-------------------------|-----------------------------------------|
| Texture         | [Description]           | [How it will differ and why]            |
| Flavor          | [Description]           | [How it will differ and why]            |
| Appearance      | [Description]           | [Visual changes: browning, color, rise] |
| Shelf Life      | [Original storage]      | [Modified storage recommendation]       |
| Difficulty      | [Original complexity]   | [If more or less forgiving to make]     |

---

### Tips for Best Results

1. [Technique tip specific to this restriction and recipe type]
2. [Measurement or timing precision tip]
3. [Troubleshooting prevention tip]
4. [Label or sourcing note if applicable]

---

### Structural Warnings (if applicable)

- [Flag any aspects of the recipe that are high-risk for this modification --
   e.g., "This sauce involves high heat and acidic ingredients; coconut cream
   may curdle -- add at the end of cooking off the heat."]
```

---

## Rules

1. **Always identify the functional role before selecting a substitute.** Never swap ingredient-to-ingredient by name alone. An egg in a mousse is an aerator; in a meatball it is a binder -- they require different substitutions.
2. **Always provide precise ratios with units.** "Use flaxseed instead of egg" is insufficient. "1 tablespoon ground flaxseed + 3 tablespoons water per 1 large egg" is correct.
3. **Always describe the honest performance gap.** No substitution is perfect. A vegan meringue is more fragile than an egg-white meringue. A gluten-free brioche will never achieve the same feathery crumb as wheat brioche. State this directly and explain the mechanism.
4. **For allergy modifications (not merely preferences), always include a cross-contamination note.** Dedicated equipment (bowls, pans, utensils) should be used; shared bakeware retains allergen residue that is not eliminated by standard washing. This is non-optional when allergy is mentioned.
5. **Scan the full recipe for hidden sources of the restricted ingredient before providing substitutions.** Do not address only the obvious ingredients. A gluten-free modification that misses the soy sauce or the malt vinegar in the dressing is a failure.
6. **For multiple simultaneous restrictions, address structural compounding explicitly.** Do not treat each substitution in isolation -- note when they interact (e.g., gluten-free + egg-free requires additional starch and hydration adjustment).
7. **Never claim any modification is safe for a clinical condition.** The skill provides substitution guidance. Whether a modification is safe for a diagnosed celiac patient, a person with anaphylactic peanut allergy, or a patient on a renal diet is a clinical determination outside this skill's scope.
8. **When a recipe cannot be reasonably modified for a restriction, say so clearly and suggest an alternative dish.** A partially-failed modification presented as a success is worse than an honest assessment. The threshold for "cannot be reasonably modified" is when the defining technique of the dish relies entirely on the restricted ingredient (e.g., egg-set custard without eggs, laminated pastry without a plastic fat).
9. **Technique adjustments are mandatory, not optional.** Substitutions that require different mixing methods, temperature management, resting times, or proofing parameters must always be flagged with specific actionable instructions -- not vague notes like "handle carefully."
10. **Do not recommend reducing salt below 25% of original without explicitly flagging fermentation and food safety implications.** In yeast doughs, salt reduction past 50% creates uncontrolled fermentation. In cured or brined foods, salt is a primary preservation mechanism and its reduction may create a food safety risk.
11. **Identify whether the substitution requires any supporting ingredient change.** Adding coconut cream to replace heavy cream in a high-acid tomato sauce without noting that acid destabilizes coconut cream is an incomplete answer. Always note whether other components of the recipe need to adjust to accommodate the substitution.
12. **Use temperature-specific guidance when relevant.** Plant-based butter has a narrower workable temperature range than dairy butter; agar sets at a different temperature than gelatin; aquafaba foam is grease-sensitive. When temperature or environment matters, state the specific number.

---

## Edge Cases

### Multiple Simultaneous Restrictions in Delicate Baked Goods
When a recipe is gluten-free, dairy-free, and egg-free simultaneously -- commonly called a "triple-free" bake -- the cumulative structural deficit is significant. Gluten-free flour provides no protein network; plant-based butter may have higher water content; flax or chia eggs provide less binding strength than whole eggs. To compensate: increase total starch by adding 1 tbsp tapioca starch per cup of flour beyond standard blend, use full-fat plant-based milk (not almond milk), chill dough before baking, reduce oven temperature by 25°F (14°C), and extend bake time by 8-12 minutes. Use an instant-read thermometer to verify doneness. Accept that the result will be denser and moister than a wheat-dairy-egg original, and frame expectations accordingly.

### User Doesn't Know What Ingredients Are Restricted
The user may say "my friend is vegan" or "someone has a gluten issue" without providing a recipe. In this case: (a) ask for the full recipe or dish type, then (b) proactively identify all animal products or gluten-containing ingredients present, (c) list them with their functional roles, and (d) offer to work through substitutions one by one or as a complete modified recipe. Do not wait for the user to identify hidden restricted ingredients -- that expertise is the value the skill provides.

### User Reports a Failed Modification
Troubleshooting failures requires asking two questions: What happened (gummy, flat, didn't rise, separated, too dense), and exactly what substitutions and techniques were used. Work through the failure systematically using the troubleshooting logic in Step 7. Common failure modes are: insufficient binder (gummy gluten-free baked goods), too much moisture from egg replacers (wet center), plant butter too soft (cookies spread flat), and acid curdling dairy-free cream sauces. Provide a revised recipe or revised technique based on the reported failure, not just generic advice.

### Low-Sodium Baking (Yeast Breads and Chemically Leavened Goods)
Salt in yeast bread is not merely a flavor agent -- it controls gluten strength and yeast fermentation rate. Reducing salt in a yeasted bread by more than 50% produces bread with a coarser crumb, a sour off-flavor (from uncontrolled yeast activity), and a tendency to overproof. When low-sodium bread is requested, recommend: (a) reducing salt by no more than 50%, (b) proofing in a cooler environment (65-68°F / 18-20°C) to slow yeast, and (c) checking dough by visual appearance rather than time. Baking powder in quick breads and cakes contains 30-40mg sodium per teaspoon -- for strict low-sodium baking, use low-sodium baking powder or a small amount of potassium bicarbonate.

### Nut-Free Modification With Sunflower Seed Flour
Sunflower seed flour is one of the most practical nut-free substitutes for almond flour, but it contains chlorogenic acid, which reacts with baking soda and baking powder to produce a green or teal color in baked goods. This color is food-safe but visually alarming if not warned. Prevent it by adding 1 teaspoon of cream of tartar OR 1 teaspoon of apple cider vinegar per cup of sunflower seed flour to neutralize the reaction. Alert the user to this issue proactively rather than letting them discover green muffins after baking.

### Vegan Baking in High-Altitude Environments
At elevations above 3,500 feet (1,067m), baked goods rise more rapidly due to reduced atmospheric pressure. This is more pronounced in vegan baking because egg replacers (aquafaba, flax egg) produce weaker structural foam than beaten eggs. Standard high-altitude adjustments apply: reduce leavening by 15-25%, increase flour by 1-2 tbsp per cup, and increase oven temperature by 15-25°F (8-14°C). For aquafaba meringues at altitude, increase cream of tartar by 50% to help stabilize the foam.

### Modifying a Family Recipe With Unknown Ingredient Amounts
Users sometimes describe a recipe by process ("my grandmother's cake, she used a lot of butter and some eggs") without precise measurements. In this case, provide substitution ratios and qualitative guidance (e.g., "for every egg in the recipe, make one flax egg") so the user can apply the substitution proportionally regardless of their specific amounts. Also flag that first-attempt modifications of unknown-ratio recipes may require iteration, and suggest the user start with a half-batch to test before committing to a full recipe.

### Gluten-Free Modification for Traditional Pasta Dishes
Gluten-free pasta (rice, corn, chickpea, or lentil-based) has significantly different cooking behavior than wheat pasta. It overcooks quickly, becoming mushy rather than al dente. Key adjustments: cook gluten-free pasta in more water (at least 5-6 quarts per pound), salt the water generously (this is especially important for low-protein gluten-free pastas that otherwise taste flat), and taste-test beginning 2 minutes before the package minimum time. Reserve more pasta water than usual (at least 1 cup) because gluten-free pasta starch is different in character and the sauce may need more pasta water to emulsify. Gluten-free pasta should be served immediately -- it continues cooking in its own heat and does not hold well in warm sauces.

---

## Example

**Input:** "I want to make my grandmother's banana bread for my book club. Two people are vegan (no eggs, no dairy), one person is gluten-free, and one person has a nut allergy. Her recipe uses: 3 ripe bananas, 2 eggs, 1/3 cup melted butter, 3/4 cup sugar, 1 tsp vanilla, 1 tsp baking soda, 1/4 tsp salt, 1 1/2 cups all-purpose flour, and sometimes 1/2 cup chopped walnuts. Can I make one batch that works for everyone?"

**Output:**

## Recipe Modification: Grandmother's Banana Bread → Gluten-Free, Vegan (Egg-Free + Dairy-Free), and Nut-Free

> **Allergy Note:** If the gluten-free guest has diagnosed celiac disease (not just a preference), use certified gluten-free flour, baking soda, vanilla, and ensure your mixing bowls and loaf pan have not previously been used with wheat flour without thorough washing. If the nut-free guest has a tree nut or peanut allergy, verify that your oat milk, chocolate chips (if added), and flour blend labels are free from nut cross-contamination warnings.

> **Complexity Assessment:** Medium-High. This is a triple-free modification (gluten-free + egg-free + dairy-free) plus nut-free. The bananas themselves provide significant binding and moisture, which makes this particular recipe one of the more forgiving recipes for heavy substitution. The high banana content compensates for some of the lost egg structure. Proceed with confidence, but review the structural notes below.

---

### Restricted Ingredient Analysis

| Restricted Ingredient       | Role in This Recipe                         | Substitute                                          | Ratio                              | Flavor/Texture Impact                                                             |
|-----------------------------|---------------------------------------------|-----------------------------------------------------|------------------------------------|-----------------------------------------------------------------------------------|
| Eggs (2 large)              | Binding, moisture, some leavening           | Flax eggs (ground flaxseed + water)                 | 1 tbsp ground flaxseed + 3 tbsp water per egg; make 2 flax eggs total | Slightly nuttier flavor (masked well by banana), denser crumb than original. Banana already provides binding so flax eggs work very well here. |
| Butter (1/3 cup melted)     | Fat, tenderness, moisture, flavor           | Melted refined coconut oil OR melted solid plant-based butter | 1:1 (1/3 cup)                | Coconut oil: neutral if refined, very slightly coconut-forward if virgin. Plant butter: closest flavor match to original. Both produce tender crumb. |
| All-purpose flour (1.5 cups)| Structure, starch, some protein network     | 1:1 gluten-free baking blend (with xanthan gum included) | 1:1 (1.5 cups)             | Slightly denser, moister crumb. Gluten-free banana bread is particularly forgiving because banana starch contributes additional structure. |
| Walnuts (1/2 cup, optional) | Texture contrast, flavor                    | Omit entirely or replace with toasted pumpkin seeds | 1:1 (1/2 cup pumpkin seeds)        | Pumpkin seeds provide crunch and a mildly nutty flavor. No color change. Confirm pumpkin seed sourcing is nut-free facility if allergy is severe. |

---

### Hidden Restricted Ingredients Found

- **Vanilla extract:** Verify it is gluten-free (pure vanilla extract is, but some imitation vanilla uses caramel coloring derived from barley malt). Use pure vanilla extract.
- **Baking soda:** Inherently gluten-free and vegan. No substitution needed.
- **Sugar:** Granulated white sugar is vegan and gluten-free. No substitution needed. (Note: some cane sugars are processed using bone char -- if strict vegan guests prefer, substitute with organic cane sugar or coconut sugar at 1:1.)

---

### Technique Adjustments

- **Flax egg preparation:** Combine 2 tbsp ground flaxseed with 6 tbsp water in a small bowl. Stir and let rest for exactly 5 minutes before using. The mixture should be thick and gel-like. If it hasn't gelled, let it rest another 2 minutes. Do not skip the resting step -- ungelled flax provides no binding.
- **Mixing technique:** Combine wet ingredients (bananas, melted fat, flax eggs, sugar, vanilla) in one bowl. Combine dry ingredients (flour blend, baking soda, salt) in a separate bowl. Fold wet into dry until just combined -- do not overmix. With gluten-free flour, there is no gluten to overdevelop, but overworking the batter can make it gummy by overactivating the xanthan gum in the blend.
- **Batter consistency:** Gluten-free batter will look slightly wetter and more pourable than standard banana bread batter. This is correct -- do not add more flour.
- **Baking temperature and time:** Bake at 350°F (175°C) as the original recipe likely specifies, but plan for an additional 8-12 minutes of bake time. Gluten-free loaf cakes take longer to set internally. Begin checking at the original recipe time, but do not rely on the toothpick test alone.
- **Doneness check:** The most reliable method is an instant-read thermometer inserted into the center of the loaf -- target 200-205°F (93-96°C). The top should be deep golden brown and spring back when lightly pressed. If the top is browning too fast before the center is set, tent loosely with foil after the first 30 minutes.
- **Cooling:** Allow to cool in the pan on a wire rack for 15 minutes, then turn out and cool completely before slicing. Gluten-free baked goods continue firming as they cool. Slicing while warm will produce a gummy appearance even in a properly baked loaf.

---

### Modified Ingredient List

- 3 ripe bananas, well mashed *(unchanged -- the riper, the better for structure and sweetness)*
- 2 flax eggs: 2 tbsp ground flaxseed + 6 tbsp water, rested 5 min *(replaces 2 large eggs)*
- 1/3 cup refined coconut oil, melted and cooled slightly OR 1/3 cup melted solid plant-based butter *(replaces dairy butter)*
- 3/4 cup granulated sugar (or organic cane sugar) *(unchanged in amount)*
- 1 tsp pure vanilla extract *(verify gluten-free label)*
- 1 tsp baking soda *(unchanged)*
- 1/4 tsp salt *(unchanged)*
- 1 1/2 cups 1:1 gluten-free baking flour blend (must contain xanthan gum) *(replaces all-purpose flour)*
- 1/2 cup toasted pumpkin seeds, optional *(replaces walnuts)*

---

### Expected Differences from Original

| Attribute    | Original Recipe                                    | Modified Version                                                                          |
|--------------|----------------------------------------------------|-------------------------------------------------------------------------------------------|
| Texture      | Soft, springy crumb with light chew               | Slightly denser and moister, with a tender crumb; holds together well due to banana starch |
| Flavor       | Rich, buttery banana with walnut earthiness        | Nearly identical banana flavor; slight nuttiness from flax masked by banana; coconut oil adds very mild richness |
| Appearance   | Golden brown crust, medium rise                    | Similar golden brown crust; rise may be slightly less dramatic; center may appear more moist |
| Shelf Life   | 3-4 days at room temperature, wrapped              | 2-3 days at room temperature (slightly less stable); refrigerate after day 2; freezes excellently for up to 3 months |
| Difficulty   | Easy, very forgiving                               | Slightly more technique-dependent (flax egg timing, doneness by thermometer), but banana bread is one of the most forgiving recipes for this level of modification |

---

### Tips for Best Results

1. Use very ripe, deeply speckled (or even black-skinned) bananas -- the higher sugar content and softer flesh provide the best flavor, moisture, and structural contribution. Frozen and thawed bananas work exceptionally well here.
2. Do not swap the flax eggs for banana -- the recipe already contains three bananas. Additional banana will make the loaf too wet and dense. Stick to the flax egg substitution.
3. If using a homemade gluten-free flour blend rather than a commercial 1:1 blend, ensure it contains xanthan gum. If it does not, add 1/2 tsp xanthan gum to the dry ingredients. Without xanthan, the loaf will crumble.
4. The loaf is done when an instant-read thermometer reads 200-205°F in the center -- not when a toothpick comes out clean. Gluten-free batter can leave a false "clean" toothpick result while still being underbaked internally.
5. For the nut-free guest with a potential tree nut allergy: verify your specific gluten-free flour blend's label for nut cross-contamination warnings. Many are processed in facilities that also handle almonds or cashews.

---

### Structural Warnings

- This modification removes gluten, eggs, and dairy simultaneously. Banana bread is an excellent candidate for this because bananas provide starch-based binding and moisture that partially offsets the removed egg and fat structure. This particular recipe is significantly more forgiving under triple-free modification than a standard cake or cookie would be.
- Do not substitute plant-based spreadable tub margarine for the butter -- the higher water content (up to 40%) will make the batter too wet. Use solid stick plant-based butter or refined coconut oil.
- If you are baking at high altitude (above 3,500 feet), reduce the baking soda by 1/4 tsp and increase oven temperature to 375°F (190°C). The gluten-free flax egg combination is more sensitive to altitude-driven over-rise and collapse than a standard recipe.
