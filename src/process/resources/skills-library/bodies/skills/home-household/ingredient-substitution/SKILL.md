---
name: ingredient-substitution
description: |
  Provides precise ingredient substitutions organized by ingredient type with
  exact ratios, flavor impact notes, and texture changes. Covers dairy, eggs,
  fats, flours, sweeteners, leavening agents, and common pantry items. Use when
  the user is missing an ingredient and needs a substitute, has dietary
  restrictions requiring alternatives, or wants to understand how substitutions
  affect the final result. Do NOT use for recipe scaling (use recipe-scaling),
  creating new recipes, or medical dietary advice.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking nutrition guide"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Ingredient Substitution

## When to Use

Use this skill when any of the following conditions apply:

- The user is mid-recipe and has discovered they are out of a specific ingredient (e.g., "I'm making chocolate chip cookies and I'm out of eggs")
- The user has a dietary restriction -- dairy-free, egg-free, gluten-free, nut-free, vegan, low-sugar -- and needs workable alternatives to an ingredient in a specific recipe
- The user explicitly asks "what can I use instead of X" or "can I substitute Y for Z"
- The user wants to understand how a specific swap will affect the final dish -- flavor, texture, appearance, shelf life, or structural integrity
- The user wants to make a recipe "healthier" by swapping fats, sweeteners, or refined flours for alternatives, and wants to know the real-world trade-offs
- The user is baking and the leavening chemistry is in question (baking soda without acid, yeast viability, etc.)
- The user has a cultural or regional ingredient gap -- an ingredient is called for that is not sold in their country or region

**Do NOT use this skill when:**

- The user wants to scale a recipe up or down (use `recipe-scaling` -- scaling changes all quantities proportionally and involves different math)
- The user needs a full meal plan or grocery list built around restrictions (use `meal-prep-workflow`)
- The user is seeking medical dietary advice for a diagnosed condition -- substitutions for managing celiac disease, Type 1 diabetes, PKU, or other medical conditions require a registered dietitian, not an AI cooking guide
- The user wants an entirely new recipe created from available ingredients (use `recipe-generation-from-ingredients`)
- The user is asking about shelf life, food safety, or storage of the substitute (use `food-safety-guide`)
- The user needs help with restaurant-scale or commercial food production substitutions -- industrial baking chemistry, food manufacturing, or food science R&D are outside this skill's scope

---

## Process

### Step 1: Gather the Critical Context

Before suggesting any substitution, establish four things. Missing any of these will produce a useless or harmful recommendation.

- **The ingredient to replace:** Get the exact ingredient, including form (whole egg vs. egg white, unsalted vs. salted butter, all-purpose vs. bread flour, granulated vs. powdered sugar)
- **The recipe type and context:** Baking is the most sensitive category. Within baking, distinguish between: (a) lean baked goods -- bread, baguettes, pizza dough (mostly flour, water, yeast, salt), (b) enriched baked goods -- brioche, cinnamon rolls, banana bread, (c) chemically leavened goods -- cakes, muffins, pancakes, quick breads, (d) fat-dependent pastry -- pie crust, croissants, shortbread, (e) egg-dependent goods -- custard, quiche, soufflé, choux, macarons. Savory cooking (soups, stews, stir-fries, sauces) is far more forgiving than baking.
- **The reason for substitution:** "I don't have it" vs. "I'm vegan" vs. "I'm allergic" vs. "I want fewer calories" -- each changes the priority ranking of alternatives
- **What the user has on hand:** A theoretical perfect substitute is useless if the user doesn't have it. Ask what's in their pantry or fridge before suggesting esoteric ingredients.

### Step 2: Identify the Ingredient's Functional Role(s)

Every ingredient serves at least one of these eight functions. Identify which roles apply before suggesting any substitute, because the substitute must cover the same functional roles.

- **Structure:** Gluten (from wheat flour), egg white proteins, starch gelatinization. Without structural ingredients, the recipe collapses.
- **Moisture/Hydration:** Water, milk, eggs (which are 75% water), fruit purees. Affects final texture and how other ingredients hydrate.
- **Fat:** Butter, oil, shortening, lard, coconut oil. Fat provides tenderness (shortens gluten strands), richness, flavor, and in laminated doughs, flakiness. Fat also carries fat-soluble flavor compounds (vanilla, spices).
- **Leavening:** Baking soda requires acid to produce CO2. Baking powder contains its own acid (sodium aluminum sulfate or cream of tartar) and releases CO2 in two stages -- once when wet, once when heated. Yeast produces CO2 biologically. Steam (from water in butter, eggs, or batter) leaven puff pastry and popovers. Each mechanism is different and not interchangeable.
- **Binding:** Eggs (proteins coagulate when heated, gluing the structure together), starch (gelatinizes when heated), hydrocolloids (xanthan gum, psyllium husk). Without binding, baked goods crumble.
- **Flavor:** Vanilla, cocoa, citrus zest, spices, herbs, alcohol extracts, fermented ingredients (buttermilk, sourdough). Flavor ingredients rarely affect structure but removing them changes the recipe's character.
- **Sweetness:** Sugar also provides structure (creaming butter and sugar traps air), moisture retention (hygroscopic -- draws water from air, keeping baked goods moist), browning (Maillard reaction and caramelization), and tenderness (sugar competes with flour for water, limiting gluten development). Substituting sweeteners affects all of these, not just taste.
- **Acidity:** Buttermilk, yogurt, sour cream, vinegar, citrus juice, cream of tartar. Acid activates baking soda, tenderizes gluten, brightens flavor, and in some recipes (red velvet cake) affects color through pH-sensitive anthocyanins.

**Important:** If an ingredient serves multiple roles, the substitute must cover all of them, or you must compensate for the missing roles separately.

### Step 3: Evaluate Substitution Risk Level

Before presenting options, classify the substitution risk:

- **Low risk (Green):** Savory recipes, soups, stews, dressings, marinades. Most ingredient swaps work fine here. Flavor may change but chemistry is not at stake.
- **Medium risk (Yellow):** Enriched quick breads (muffins, banana bread, pancakes), most cookies, brownies. Substitutions usually work but may noticeably change texture or rise.
- **High risk (Red):** Lean yeast bread, croissants, macarons, soufflés, custards, choux pastry, angel food cake, any foam-based or chemically precise recipe. Warn the user explicitly that the result will differ from the original, possibly significantly.
- **Not substitutable (Black):** Some ingredients are foundational to a recipe's identity and have no workable substitute. Eggs in a frittata, gluten in a traditional baguette, fat in a butter croissant. In these cases, tell the user clearly and recommend finding a recipe designed for their constraints rather than forcing a substitution.

### Step 4: Present Substitution Options with Full Specificity

For each option provide -- without exception:

- **Exact ratio:** Use specific measurements. Never say "about the same amount" or "a similar quantity." State "3/4 tbsp" not "slightly less." State "1 cup minus 2 tbsp" not "almost 1 cup."
- **Flavor impact rated on a 4-point scale:** None (indistinguishable), Mild (detectable only to sensitive palates), Noticeable (most people will detect a difference), Significant (recipe tastes meaningfully different)
- **Texture impact rated on the same 4-point scale**
- **Structural or chemical adjustment required:** If the substitute changes moisture, acid content, fat content, or leavening balance, state what compensating adjustment is needed (e.g., "reduce other liquid by 2 tbsp" or "add 1/4 tsp baking soda to counteract added sweetness")
- **Best recipe contexts for this substitute**
- **Recipe contexts to avoid**

### Step 5: Identify Compensating Adjustments

Many substitutions require secondary changes to keep the recipe balanced. These are commonly missed and cause recipe failures.

- **Fat substitutes often change moisture:** Applesauce replacing butter adds significant water. Reduce other liquids or increase flour slightly (1-2 tbsp per 1/2 cup applesauce added).
- **Liquid sweeteners replacing granulated sugar add moisture:** Honey, maple syrup, and agave are 17-25% water. Reduce other liquids by 3 tbsp per cup of liquid sweetener used, and reduce oven temperature by 25°F (because liquid sweeteners brown faster due to fructose content).
- **Non-dairy milks vary in fat and protein:** Oat milk (fat: ~3g per cup) behaves more like whole milk than almond milk (fat: ~2.5g per cup but lower protein). In recipes where milk protein contributes browning (Maillard reaction), low-protein milks (rice milk, oat milk) will produce less browning on crusts and surfaces.
- **Acid substitutes may shift overall acid balance:** If replacing buttermilk with plain milk, the baking soda in the recipe loses its activation partner. Either add 1/2 tsp lemon juice or vinegar per 1/4 tsp baking soda called for, or replace the baking soda with additional baking powder (use 3x the amount of baking powder to replace baking soda when no acid source is present).
- **Gluten-free flours absorb liquid differently:** Almond flour is high-fat and low-starch and barely absorbs water. Rice flour absorbs aggressively and produces gummy results if over-wet. Tapioca starch is elastic and chewy. Coconut flour absorbs 4x more liquid than all-purpose flour and requires additional eggs for binding.

### Step 6: Flag Recipe-Specific Warnings

Issue explicit warnings in these situations:

- The recipe relies on baking soda AND the substitute removes the only acid source
- The user is making more than two substitutions in the same baking recipe
- The substitute changes the fat content substantially in pastry or laminated dough
- The recipe is designed to be a specific texture (chiffon cake is specifically designed to be airy; adding dense alternatives to an airy recipe will not produce a chiffon cake)
- The substitute contains allergens that may conflict with the reason for substituting (e.g., a nut-based cream substitute for someone with a tree nut allergy who is only avoiding dairy)

### Step 7: Deliver the Output in Standard Format

Organize the response using the format below. Do not omit sections. If a section does not apply (e.g., no high-risk warning needed), note "Not applicable" rather than leaving it blank.

---

## Output Format

```
## Ingredient Substitution: [Original Ingredient]

**Recipe context:** [What the user is making]
**Reason for substituting:** [Not available / Dietary restriction / Preference / Health]
**Risk level:** [Green / Yellow / Red / Black -- with one-sentence explanation]

---

### Functional Role(s) in This Recipe
- Primary role: [e.g., Leavening acid -- activates baking soda]
- Secondary role(s): [e.g., Moisture, Tenderness via gluten inhibition]

---

### Substitution Options (Ranked Best to Worst for This Context)

#### Option 1: [Substitute Name] -- [Match Quality: Excellent / Good / Acceptable / Last Resort]
- **Ratio:** [precise measurement] per [precise original amount]
- **Flavor impact:** [None / Mild / Noticeable / Significant] -- [one sentence explaining what changes and why]
- **Texture impact:** [None / Mild / Noticeable / Significant] -- [one sentence explaining what changes and why]
- **Compensating adjustment required:** [Yes/No] -- [if yes, exact instruction]
- **Best in:** [specific recipe types]
- **Avoid in:** [specific recipe types]
- **Dietary note:** [Vegan / Dairy-free / Gluten-free / Not applicable]
- **Notes:** [Any critical technique or chemistry note]

#### Option 2: [Substitute Name] -- [Match Quality]
[same format]

#### Option 3: [Substitute Name] -- [Match Quality]
[same format]

---

### Compensating Adjustments Summary
[Consolidated list of any secondary changes needed to the recipe when using each option]

---

### What Will Change
| Attribute        | Original Recipe | With Option 1 | With Option 2 | With Option 3 |
|------------------|-----------------|---------------|---------------|---------------|
| Rise/Texture     |                 |               |               |               |
| Flavor           |                 |               |               |               |
| Color/Appearance |                 |               |               |               |
| Moisture Level   |                 |               |               |               |

---

### High-Risk Warning (if applicable)
[Bold warning block explaining what could fail and why, with specific chemistry explanation]

---

### Recommended Option for This User
[One clear recommendation based on what the user has available and their specific context, with a one-sentence rationale]
```

---

## Rules

1. **Always state exact ratios -- never approximate.** "Use about the same" is a failure. Every substitution must have a precise ratio expressed in standard measurement units (cups, tbsp, tsp, grams). If a ratio is variable depending on context, give the range with conditions: "1/4 cup per egg in binding applications; 1/3 cup per egg in moisture-forward recipes like muffins."

2. **Never treat baking like savory cooking.** Baking is applied chemistry. A sauce forgives imprecision; a cake does not. Always specify whether the recipe is a baking recipe, and if so, classify it by type (lean yeast bread, enriched dough, chemically leavened, fat-dependent pastry, foam/protein-dependent). The same substitute can be safe in one baking context and catastrophic in another.

3. **When an ingredient serves multiple roles, address every role.** Eggs serve as binder, leavener (by trapping air when beaten), moisture source, emulsifier (yolk lecithin), and flavor contributor. Replacing eggs with flaxseed meal covers binding only -- it does not contribute emulsification or leavening. Failing to address the unmet roles causes recipe failure.

4. **Always identify compensating adjustments.** Every substitution that changes fat, moisture, acid, or leavening content requires a corresponding recipe adjustment. Presenting a substitute without its compensation instructions is incomplete advice that will cause failed recipes.

5. **Rank options from best to worst for the specific context provided.** A flaxseed egg works well in dense cookies but poorly in angel food cake. The ranking must be context-sensitive, not a generic "these are all fine" list.

6. **Issue a Black/not-substitutable verdict when warranted.** Some ingredients cannot be replaced without producing something fundamentally different. Eggs in crème brûlée, gluten in a traditional pretzel, gelatin in panna cotta. Tell the user directly and compassionately. Suggest finding a recipe that is designed for their constraints, and if possible, name a recipe type that already is.

7. **Never omit the flavor impact rating.** Users often care more about taste than texture. Even "neutral" substitutions can introduce off-notes: aquafaba sometimes has a faint legume flavor in very lightly flavored recipes; refined coconut oil is neutral but unrefined coconut oil has a strong coconut taste; oat milk contributes mild sweetness.

8. **Flag allergen cross-risks proactively.** If a user is substituting for an allergen, scan the suggested substitute for related allergens. Someone avoiding dairy should know that some "dairy-free" butters contain tree nuts. Someone avoiding eggs should know that some egg substitutes contain soy. This is safety-critical.

9. **Do not present more than four substitution options unless the context genuinely requires it.** Three to four well-explained options ranked for the specific context is more useful than eight poorly differentiated options. Quality of information over quantity.

10. **Never recommend a substitution for custards, quiche, soufflé, or choux without explicitly stating it will produce a categorically different product.** These recipes depend on egg protein coagulation in ways that plant-based alternatives cannot replicate. A vegan "quiche" made with tofu and turmeric is a legitimate and delicious product -- but it is not a quiche in the culinary chemistry sense. Be honest about this distinction without dismissing the alternative.

---

## Edge Cases

### Gluten-Free Flour Substitution in Baking

Replacing all-purpose flour with gluten-free alternatives is the most complex single substitution in home cooking. Gluten is a protein network formed from glutenin and gliadin when wheat flour is hydrated and worked. It provides elasticity (allowing dough to stretch without tearing), tensile strength (holding CO2 bubbles from leavening), and cohesion. No single ingredient replicates all three properties.

**Recommended approach by recipe type:**

- **Cookies and bars:** A commercial 1:1 gluten-free blend (typically rice flour + tapioca starch + potato starch + xanthan gum) substitutes at true 1:1 by weight. Texture will be slightly more crumbly and may lack chew; add 1 tsp extra fat per cup of flour to compensate.
- **Quick breads and muffins:** 1:1 blend works but the result is often gummy in the center if overbaked slightly -- this is from rice flour starch. Remove from oven when internal temperature reaches 200-205°F rather than relying on the toothpick test, which is unreliable for gluten-free quick breads.
- **Yeast bread:** This is the hardest case. Without gluten, CO2 bubbles from yeast cannot be trapped in an elastic network. Result is a dense, heavy loaf. Add 1 tsp xanthan gum per cup of flour (if not already in the blend), 1 extra egg (or 1 egg's worth of aquafaba for vegan), and expect a batter-like dough that is poured rather than kneaded. Do not compare the process to traditional bread baking -- treat it as a new recipe.
- **Pie crust:** Use a mix of oat flour (certified GF) + tapioca starch + a pinch of xanthan gum. Work cold fat in as usual. The crust will be more delicate and less rollable; press-in methods work better than rolling.
- **Pasta:** Rice flour + tapioca starch + egg produces passable pasta but lacks the al dente snap of semolina pasta. Chickpea flour pasta (made separately as a chickpea pasta recipe) is a better result but is a different product.

**Coconut flour:** Absorbs 4x as much liquid as all-purpose flour. Cannot substitute 1:1. If using coconut flour, use 1/4 the amount of all-purpose flour called for and add 1 egg per 1/4 cup of coconut flour for binding. Results are dense and cake-like.

**Almond flour:** High fat, low starch, no binding power. Works in muffins, cookies, and dense cakes but produces extremely fragile baked goods that fall apart while warm. Always cool completely before handling. Cannot replace flour in bread or anything requiring structural integrity.

### Egg Substitution -- Role-Specific Rules

The single most common mistake in egg substitution is using one substitute regardless of what role the egg plays. Use this decision framework:

- **Egg as binder (cookies, veggie burgers, meatballs, dense muffins):** 1 egg = 1 tbsp ground flaxseed + 3 tbsp water (rest 5 min to gel) = "flax egg." Also: 1 tbsp chia seeds + 3 tbsp water. Both provide binding with no leavening and minimal flavor impact.
- **Egg as moisture (banana bread, muffins, brownies):** 1 egg = 1/4 cup mashed ripe banana (adds banana flavor, some sweetness) or 1/4 cup unsweetened applesauce (neutral flavor, slight apple note). These add moisture but no binding.
- **Egg as leavener (light cakes, pancakes, waffles):** 1 egg = 1 tsp baking powder + 1 tbsp white vinegar + 1 tbsp water (mix just before using -- the acid and base react on contact). This produces CO2 for lift but no binding.
- **Egg as emulsifier (mayonnaise, hollandaise, certain cakes):** Egg yolk lecithin creates stable oil-water emulsions. Aquafaba (the liquid from canned chickpeas, strained) contains saponins that act as surfactants. 3 tbsp aquafaba = 1 whole egg, 2 tbsp = 1 egg white. Aquafaba whips into stiff peaks and is the only widely accessible egg white substitute for meringue.
- **Egg as structural protein (custard, quiche, frittata, cheesecake, soufflé):** No plant-based substitute replicates egg protein coagulation in these applications. Silken tofu blended smooth approximates the texture of a baked egg custard in quiche -- use 1/4 cup blended silken tofu per egg -- but the flavor and exact texture will differ. Add 1 tbsp nutritional yeast and 1/4 tsp black salt (kala namak, which has a sulfurous, eggy flavor) to improve flavor match.

### Multiple Simultaneous Substitutions

When a user needs to make more than two substitutions in one recipe, apply the "cascading failure" warning:

Each substitution changes the moisture, fat, acid, or binding ratio of the recipe. When substitutions stack, their effects compound nonlinearly. Consider a vegan gluten-free chocolate cake that replaces: (1) eggs with flax eggs, (2) butter with coconut oil, (3) all-purpose flour with a gluten-free blend, (4) whole milk with oat milk, and (5) buttermilk with plant milk + acid. Each substitution alone is manageable. Together, the fat content, protein content, moisture level, and leavening chemistry are all simultaneously different from the original recipe. The result is often too dense, too wet, or structurally failed.

**Recommended response:** If the user needs 3+ substitutions in a baking recipe, recommend finding a recipe that is already designed for their constraints (a vegan gluten-free chocolate cake recipe) rather than engineering the substitutions manually. This is not defeatism -- recipes designed for those constraints are tested and optimized; modified conventional recipes are not.

**Exception:** In savory cooking (soups, stews, curries, dressings), multiple substitutions are almost always fine because the chemistry is far less sensitive.

### Liquid Sweetener Replacing Granulated Sugar

This substitution is commonly underestimated in complexity. Honey, maple syrup, and agave nectar all replace granulated sugar but require three simultaneous adjustments:

1. **Volume reduction:** Liquid sweeteners are sweeter per volume than granulated sugar (especially honey, which is about 25% sweeter than sugar by weight). Use 3/4 cup liquid sweetener per 1 cup granulated sugar.
2. **Liquid reduction:** Liquid sweeteners are 17-25% water. Reduce other liquids in the recipe by 3-4 tbsp per cup of liquid sweetener used. If the recipe contains no other liquid (e.g., a dry cookie), no adjustment is needed.
3. **Temperature reduction:** Fructose (found in honey and agave in high concentrations) browns at a lower temperature than sucrose. Reduce oven temperature by 25°F (about 15°C) and start checking doneness 5 minutes early to prevent overbrowning.

Additionally: Sugar substitutes (erythritol, xylitol, allulose, stevia) are not simple 1:1 replacements. Erythritol and xylitol measure cup-for-cup but do not caramelize or produce Maillard browning, resulting in pale baked goods. Allulose behaves most like sugar chemically -- it caramelizes and browns -- at a 1.3:1 ratio (use 1.3 cups allulose per cup of sugar). Stevia is 200-300x sweeter than sugar; recipe reformulation is required, not simple substitution, and stevia alone cannot replace sugar's structural roles.

### Fat Substitution in Pastry

Pastry (pie crust, croissants, shortcrust, puff pastry) is the most fat-sensitive category in baking. Fat serves a physical function -- it coats flour proteins to prevent gluten development, and in laminated doughs, it creates distinct flaky layers by separating sheets of dough that steam-lift during baking.

- **Butter to shortening:** Shortening is 100% fat (no water). Butter is ~80% fat, 16-18% water, and 2-4% milk solids. Shortening produces a more tender, more stable crust with less flavor. Use 7/8 the amount of shortening for butter (if recipe calls for 1 cup butter, use 7/8 cup shortening) and add 1/4 tsp salt per cup if using unsalted shortening.
- **Butter to lard:** Lard is ~99% fat with minimal water. Lard produces the flakiest pie crusts because its fat crystals are different in shape from butter's. Use the same volume as butter. Flavor is neutral but not dairy-free (some lard is processed on shared equipment).
- **Butter to coconut oil:** Works for tender pastries but not laminated doughs. Coconut oil has a similar fat percentage to butter and works at 1:1 by volume in most applications. Use refined coconut oil in savory pastry or where coconut flavor is unwanted.
- **Oil replacing butter in cakes/muffins:** Oil produces moister results than butter because it remains liquid at room temperature (butter solidifies). This is why oil-based cakes (carrot cake, many chocolate cakes) stay moist for days. Use 3/4 the volume of oil for butter (1 cup butter = 3/4 cup oil) because butter is not 100% fat.
- **Applesauce replacing butter:** Works in muffins, quick breads, and oil-based cakes. Applesauce adds moisture and some structure from pectin but no fat. The result is lower in fat, denser, less rich, and less browned. Use 1:1 replacement for up to half the fat; replacing all the fat with applesauce produces very dense, sticky results. Do not use in croissants, pie crust, shortbread, or any recipe where fat creates flakiness.

### Yeast Substitution and Leavening Equivalencies

Yeast comes in three forms with different usage rates:

- **Active dry yeast to instant yeast:** Active dry must be proofed in warm liquid (100-110°F) before use. Instant (rapid-rise) can be mixed directly into dry ingredients and acts faster. Ratio: 1.25 tsp active dry = 1 tsp instant. If replacing active dry with instant, reduce rise time by approximately 25% and monitor dough visually.
- **Fresh yeast to active dry:** Fresh yeast is ~70% water by weight. Use 2.5x the weight of active dry yeast to equal fresh (1 oz fresh = 2.5 tsp active dry). Fresh yeast produces a slightly more complex flavor in artisan breads.
- **Yeast to baking powder (or vice versa):** These are not substitutable. Yeast requires time (30 min to 3 hours for fermentation), produces alcohol and CO2 biologically, and develops flavor through fermentation. Baking powder reacts chemically in minutes. A bread recipe cannot use baking powder as a yeast substitute -- the result is a chemically leavened quick bread (like beer bread), which is a fundamentally different product. Acceptable only if the user understands they are making a different recipe.
- **Baking soda to baking powder:** Baking soda is pure sodium bicarbonate (base). Baking powder contains baking soda + an acid salt + cornstarch. To replace 1 tsp baking powder, use 1/4 tsp baking soda + 1/2 tsp cream of tartar. To replace 1 tsp baking soda, use 3 tsp baking powder -- but warn the user this also adds significantly more sodium and the cornstarch filler may affect texture slightly.

### Non-Dairy Milk Comparison for Baking

Non-dairy milks differ significantly in fat, protein, and sugar content, all of which affect baking results:

| Milk Type     | Fat (per cup) | Protein (per cup) | Notes                                                   |
|---------------|---------------|-------------------|---------------------------------------------------------|
| Whole dairy   | 8g            | 8g                | Baseline reference                                      |
| Oat milk      | 3-5g          | 2-4g              | Mild sweetness; good browning; closest to 2% dairy milk |
| Soy milk      | 4g            | 6-8g              | Highest protein of non-dairy; best for browning and structure |
| Almond milk   | 2.5g          | 1g                | Low fat, very low protein; produces paler crusts        |
| Coconut milk (carton) | 5g  | 0g                | Adds coconut flavor (use refined product to minimize)   |
| Rice milk     | 2g            | 0.5g              | Thin consistency; very low protein; avoid in custards   |
| Cashew milk   | 3g            | 1g                | Creamy texture; mild flavor                             |

For baking, soy milk is the most functionally similar to dairy milk because of its high protein content. For savory cream sauces, full-fat canned coconut milk produces the richest, most stable result among non-dairy alternatives. For custards, no non-dairy milk replicates the protein and fat structure of whole dairy milk -- treat vegan custards as separate recipes requiring recipe-specific development.

---

## Example

**User input:** "I'm making brownies from scratch and I just realized I'm out of regular butter. I'm not dairy-free or anything -- I just don't have any. I have coconut oil, vegetable oil, and some unsweetened applesauce. Which should I use?"

---

## Ingredient Substitution: Unsalted Butter (in Brownies)

**Recipe context:** Fudgy scratch brownies (chemically leavened, fat-dependent, high-cocoa or chocolate recipe)
**Reason for substituting:** Ingredient unavailable (not dietary restriction)
**Risk level:** Yellow -- Brownies are relatively forgiving for fat substitution because they are dense, moist, and high-fat by design. The rich cocoa flavor will mask minor fat-flavor differences. However, the fat choice affects fudginess vs. cakiness significantly.

---

### Functional Role(s) of Butter in Brownies

- **Primary role -- Fat:** Tenderizes the crumb by coating gluten proteins; contributes to the characteristic dense, fudgy texture through its solid-at-room-temperature properties
- **Secondary role -- Flavor:** Butter's milk solids produce Maillard browning and contribute a rich, dairy flavor that pairs with chocolate
- **Secondary role -- Moisture delivery:** Butter is 16-18% water; this small amount of water contributes to steam during baking and affects crumb structure
- **Secondary role -- Emulsification:** Butter helps bind the fat, eggs, and sugar into a cohesive batter; its lecithin content (from milk solids) aids emulsification

---

### Substitution Options (Ranked Best to Worst for Brownies)

#### Option 1: Vegetable Oil -- Good Match

- **Ratio:** 3/4 cup vegetable oil per 1 cup (2 sticks / 227g) unsalted butter called for
- **Flavor impact:** Mild -- vegetable oil is neutral, so you lose butter's milk-solid richness and any dairy flavor notes. In a recipe with strong chocolate flavor, this is nearly undetectable.
- **Texture impact:** Noticeable, but in a desirable direction for most brownie styles -- oil-based brownies are slightly fudgier, moister, and stay moist longer than butter-based brownies. This is because oil remains liquid at room temperature while butter solidifies, keeping the fat evenly distributed even when the brownie cools.
- **Compensating adjustment required:** Yes -- reduce recipe's baking time by 3-5 minutes and check internal temperature or use the toothpick test early. Oil-based brownies can go from underdone to overdone faster than butter-based ones at the same oven temperature. Target an internal temperature of 195-200°F for fudgy brownies.
- **Best in:** Dense, fudgy brownie styles; recipes that call for melted (not creamed) butter; any brownie recipe where the butter is just melted into the chocolate
- **Avoid in:** Brownie recipes that call for creaming butter and sugar (creaming traps air; oil cannot be creamed and will produce a denser result than intended in those specific recipes)
- **Dietary note:** Dairy-free if using non-animal-derived vegetable oil
- **Notes:** This is the standard professional kitchen substitute for butter in brownies. Many popular fudgy brownie recipes are deliberately developed with oil rather than butter. The 3/4 ratio accounts for butter's water content -- you are replacing just the fat portion.

---

#### Option 2: Coconut Oil (Refined) -- Good Match

- **Ratio:** 7/8 cup refined coconut oil per 1 cup unsalted butter (if the coconut oil is solid at room temperature, melt gently before measuring)
- **Flavor impact:** None to Mild with refined coconut oil. Refined coconut oil has had most coconut flavor removed. Unrefined/virgin coconut oil will add a distinct coconut flavor -- noticeable and potentially pleasant in brownies, but not neutral.
- **Texture impact:** Mild -- coconut oil solidifies at room temperature (melting point: 76°F / 24°C), similar to butter. This means coconut oil brownies will firm up when cooled, more like butter brownies than oil brownies. They will be slightly denser and less fudgy than Option 1 but closer to the texture of a butter-based brownie.
- **Compensating adjustment required:** No significant adjustment. If using refined coconut oil, the ratio is slightly different from vegetable oil because coconut oil is closer to 100% fat vs. butter's 80% fat, hence the 7/8 cup amount. No oven temperature change needed.
- **Best in:** Any brownie recipe, especially those calling for melted butter. Works in any chemically leavened quick bread or muffin.
- **Avoid in:** Recipes explicitly relying on the coconut flavor as a negative -- if someone dislikes coconut, use refined only. Do not use unrefined in recipes where the flavor is meant to be purely chocolate.
- **Dietary note:** Vegan, dairy-free. Contains medium-chain triglycerides (MCTs) but this is not a medical claim.
- **Notes:** Brownies made with refined coconut oil are visually and texturally very similar to butter-based brownies. The milk-solid richness of butter will be absent, but the chocolate will dominate the flavor profile and the gap is unlikely to be noticed by most people.

---

#### Option 3: Unsweetened Applesauce -- Acceptable / Last Resort

- **Ratio:** 1/2 cup applesauce + 1/4 cup vegetable oil per 1 cup butter (do not use applesauce alone; the resulting brownies will be very dense, sticky, and almost gummy)
- **Flavor impact:** Noticeable -- applesauce adds a faint fruity, acidic note. Strong chocolate flavor will mask this in most recipes, but the difference is detectable in lightly flavored brownies.
- **Texture impact:** Significant -- applesauce is 88% water (compared to butter's 16-18%). Replacing all butter with applesauce adds a huge amount of water, making brownies sticky, dense, and gummy. The fat content is dramatically reduced, which affects tenderness. The combined oil + applesauce approach balances this.
- **Compensating adjustment required:** Yes -- because the applesauce adds significant moisture, reduce baking time by 5-8 minutes and watch carefully. The brownie will look done on top before it fully sets; check with a toothpick. Also consider reducing other liquids in the recipe (vanilla, any water) by 1-2 tbsp.
- **Best in:** Recipes where lower fat is the goal and a slightly denser, moister, less rich result is acceptable. Best in muffins and quick breads rather than brownies.
- **Avoid in:** Brownie recipes where fudginess and richness are the goal. Do not use applesauce alone (without the oil) as a butter substitute in brownies.
- **Dietary note:** Vegan, dairy-free, significantly lower fat than the original
- **Notes:** This is a compromise. Given that this user has both applesauce and oil available, the hybrid ratio preserves some fat for tenderness and richness while the applesauce contributes moisture and some binding from pectin. It works. But the resulting brownie will be noticeably less rich and less fudgy than the original. Use this only if both oils are unavailable.

---

### Compensating Adjustments Summary

| Option                        | Adjustment Needed                                                                 |
|-------------------------------|-----------------------------------------------------------------------------------|
| Vegetable oil (3/4 cup)       | Check doneness 3-5 minutes early; oil brownies can overcook faster                |
| Refined coconut oil (7/8 cup) | None required; use refined (not unrefined) to keep flavor neutral                 |
| Applesauce + oil hybrid        | Reduce other liquid by 1-2 tbsp; reduce baking time by 5-8 minutes; do not use applesauce alone |

---

### What Will Change

| Attribute           | Butter Brownies         | Vegetable Oil           | Refined Coconut Oil     | Applesauce + Oil Hybrid  |
|---------------------|------------------------|-------------------------|-------------------------|--------------------------|
| Fudginess/Texture   | Dense, fudgy            | Slightly more fudgy     | Very close to butter    | Denser, stickier         |
| Flavor              | Rich, dairy-forward     | Neutral, chocolate-only | Neutral (refined)       | Faint fruity note        |
| Moisture when cool  | Firms up slightly       | Stays moist longer      | Firms up (similar)      | Very moist, may be gummy |
| Surface/Sheen       | Glossy top (classic)   | Glossy (slightly less)  | Glossy (very similar)   | Matte, less glossy       |
| Fat Content         | High                    | High (similar)          | High (similar)          | Noticeably lower         |

---

### High-Risk Warning
Not applicable -- brownies are one of the most forgiving baking recipes for fat substitution. No chemistry-critical warnings apply here.

---

### Recommended Option for This User

**Use refined coconut oil at 7/8 cup (Option 2)** if you want the closest result to a butter brownie in texture and structure. **Use vegetable oil at 3/4 cup (Option 1)** if you want a reliably fudgy, moist brownie and you're not concerned about matching the original exactly -- this is actually how many professional fudge brownie recipes are made. Reserve the applesauce option (Option 3) only if you run short on oil and want to stretch what you have.

For most home bakers, vegetable oil is the cleaner choice: it requires no melting, measures easily, and produces consistently excellent brownies.
