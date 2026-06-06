---
name: dietary-adapter
description: |
  Recipe conversion system for adapting dishes to meet dietary restrictions including vegan, vegetarian, keto, paleo, gluten-free, dairy-free, nut-free, low-sodium, diabetic-friendly, halal, and kosher requirements. Features comprehensive substitution tables, nutritional impact analysis, and cross-contamination awareness.
  Use when the user asks about dietary adapter, or needs help with recipe conversion system for adapting dishes to meet dietary restrictions including vegan, vegetarian, keto, paleo, gluten-free, dairy-free, nut-free, low-sodium, diabetic-friendly, halal, and kosher requirements.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of dietary adapter.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking meal-planning nutrition"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Dietary Restriction Adapter

## When to Use

**Use this skill when:**
- User asks about dietary adapter
- User needs guidance on dietary adapter topics
- User wants a structured approach to dietary adapter

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

```
DIETARY ADAPTATION ASSESSMENT
================================

1. DIETARY REQUIREMENT:
   [ ] Vegan (no animal products)
   [ ] Vegetarian (no meat, may include eggs/dairy)
   [ ] Lacto-vegetarian (dairy yes, eggs no)
   [ ] Ovo-vegetarian (eggs yes, dairy no)
   [ ] Pescatarian (fish yes, meat no)
   [ ] Gluten-free
   [ ] Dairy-free
   [ ] Nut-free
   [ ] Egg-free
   [ ] Soy-free
   [ ] Low-sodium
   [ ] Keto / Low-carb
   [ ] Paleo
   [ ] Diabetic-friendly
   [ ] Halal
   [ ] Kosher
   [ ] Multiple (specify): ___

2. REASON FOR RESTRICTION:
   [ ] Medical / allergy (severity: [ ] Mild [ ] Moderate [ ] Severe/Anaphylaxis)
   [ ] Religious observance
   [ ] Ethical / moral choice
   [ ] Health preference
   [ ] Intolerance (not allergy)
   [ ] Temporary / experimental

3. WHAT NEEDS ADAPTING:
   [ ] Specific recipe (provide recipe)
   [ ] General cooking approach
   [ ] Restaurant/eating out guidance
   [ ] Meal planning for restriction
   [ ] Understanding hidden ingredients

4. SEVERITY / STRICTNESS:
   - Trace amounts a concern? [ ] Yes (allergy) [ ] No (preference)
   - Separate cooking equipment needed? [ ] Yes [ ] No
   - Cross-contamination a concern? [ ] Yes [ ] No
   - Certified products required? [ ] Yes [ ] No

5. ADDITIONAL DIETARY GOALS:
   - Nutritional concerns: ___
   - Flavor preferences: ___
   - Budget considerations: ___
   - Cooking skill level: [ ] Beginner [ ] Intermediate [ ] Advanced
```

## Recipe Conversion Workflow

```
RECIPE ADAPTATION STEPS
=========================

Step 1: IDENTIFY all ingredients that conflict with the restriction
Step 2: CLASSIFY each conflict (direct ingredient vs hidden ingredient)
Step 3: SELECT appropriate substitute from tables below
Step 4: ADJUST quantities (substitutes may have different densities/moisture)
Step 5: MODIFY technique if needed (vegan baking behaves differently)
Step 6: EVALUATE nutritional impact (protein, fat, calories may change)
Step 7: TASTE and adjust seasoning (substitutes may change flavor profile)
```

## Comprehensive Substitution Tables

### Vegan Substitutions

| Original | Vegan Substitute | Ratio | Notes |
|----------|-----------------|-------|-------|
| Butter | Vegan butter, coconut oil | 1:1 | Coconut oil adds slight sweetness |
| Milk | Oat milk, soy milk, almond milk, coconut milk | 1:1 | Oat best for cooking, soy for baking |
| Heavy cream | Full-fat coconut cream | 1:1 | Chill overnight, use solid part |
| Cheese (melting) | Vegan cheese, nutritional yeast | Varies | Nutritional yeast for flavor, not melting |
| Cheese (ricotta) | Tofu ricotta (blend firm tofu + lemon + nutritional yeast) | 1:1 | Add herbs for flavor |
| Eggs (baking) | Flax egg (1 tbsp ground + 3 tbsp water) | Per egg | Let sit 5 minutes to gel |
| Eggs (binding) | Aquafaba (3 tbsp chickpea liquid) | Per egg | Whips like egg whites |
| Eggs (scramble) | Firm tofu + turmeric + kala namak | 1 block = 4 eggs | Kala namak gives egg flavor |
| Honey | Maple syrup, agave nectar | 1:1 | Slight flavor difference |
| Gelatin | Agar-agar | 1 tsp gelatin = 1 tsp agar flakes | Must be boiled to activate |
| Chicken broth | Vegetable broth + miso paste | 1:1 + 1 tsp | Miso adds umami depth |
| Fish sauce | Soy sauce + seaweed + lime juice | 1:1 ratio | Blend for closest match |
| Worcestershire | Vegan Worcestershire or soy + vinegar + molasses | 1:1 | Most Worcestershire contains anchovies |
| Ground beef | Lentils, mushroom-walnut, crumbled tempeh, TVP | 1:1 by volume | Season well; add umami |
| Chicken | Extra-firm tofu, seitan, jackfruit (pulled) | Varies | Press tofu 30 min; marinate well |

### Gluten-Free Substitutions

| Original | GF Substitute | Ratio | Notes |
|----------|--------------|-------|-------|
| All-purpose flour | 1:1 GF flour blend | 1:1 | Add xanthan gum (1/4 tsp per cup) if not in blend |
| Bread flour | GF bread flour blend | 1:1 | Results may be denser |
| Cake flour | GF flour + 2 tbsp cornstarch per cup | 1:1 | Lighter texture |
| Pasta | Rice pasta, chickpea pasta, corn pasta | 1:1 | Cook al dente; overcooks quickly |
| Breadcrumbs | GF breadcrumbs, crushed GF crackers, almond meal, cornmeal | 1:1 | Panko-style GF crumbs exist |
| Soy sauce | Tamari (certified GF) or coconut aminos | 1:1 | Always check label for wheat |
| Flour tortillas | Corn tortillas, GF tortillas, lettuce wraps | 1:1 | Corn is naturally GF |
| Couscous | Quinoa, cauliflower rice, rice | 1:1 | Couscous is wheat pasta |
| Barley | Rice, quinoa, buckwheat (despite name, is GF) | 1:1 | Common in soups |
| Beer (cooking) | GF beer, white wine, broth | 1:1 | Depends on recipe |
| Roux (butter + flour) | Butter + cornstarch or rice flour | Use less (2/3 amount) | Thickening power differs |
| Panko | GF panko, crushed rice cereal, cornflake crumbs | 1:1 | Several brands available |

### Dairy-Free Substitutions

| Original | DF Substitute | Ratio | Notes |
|----------|-------------|-------|-------|
| Milk (drinking) | Oat milk, almond milk, soy milk | 1:1 | Oat is creamiest |
| Milk (baking) | Soy milk (best protein match) | 1:1 | Avoid coconut for savory |
| Butter (baking) | Vegan butter | 1:1 | Earth Balance, Miyoko's |
| Butter (cooking) | Olive oil, coconut oil, avocado oil | 3/4 amount | Less for sauteing |
| Heavy cream | Coconut cream, cashew cream | 1:1 | Coconut cream whips well |
| Sour cream | Coconut cream + lemon juice, cashew sour cream | 1:1 | Or store-bought vegan |
| Cream cheese | Vegan cream cheese, cashew cream cheese | 1:1 | Several brands available |
| Parmesan | Nutritional yeast + salt + garlic powder | 3 tbsp = 1/4 cup Parm | For flavor, not melting |
| Yogurt | Coconut yogurt, soy yogurt | 1:1 | Check for added sugar |
| Ice cream | Coconut milk, oat milk, or cashew-based | N/A | Many brands available |

### Keto / Low-Carb Substitutions

| Original | Keto Substitute | Net Carbs Saved | Notes |
|----------|----------------|-----------------|-------|
| Rice | Cauliflower rice | 40g -> 3g per cup | Pulse in food processor, steam |
| Pasta | Zucchini noodles, shirataki noodles | 40g -> 2-4g per serving | Spiralize or buy pre-made |
| Bread | Cloud bread, lettuce wraps, cheese wraps | 15g -> 0-2g per serving | Or keto bread recipes |
| Flour | Almond flour, coconut flour | 22g -> 2-6g per 1/4 cup | Coconut flour absorbs more liquid |
| Sugar | Erythritol, monk fruit, stevia | 50g -> 0g per 1/4 cup | Erythritol 70% as sweet; adjust |
| Potato | Turnips, radishes, celeriac | 26g -> 4-8g per cup | Roast or mash similarly |
| Corn tortilla | Cheese shell, low-carb tortilla | 12g -> 2-4g each | Bake cheese into shell |
| Milk | Heavy cream + water, unsweetened almond milk | 12g -> 0-1g per cup | Almond milk is lowest carb |
| Crackers | Cheese crisps, seed crackers, pork rinds | 15g -> 0g per serving | Bake cheese for crisps |
| Breading | Crushed pork rinds, almond flour, Parmesan | 20g -> 1-3g per coating | Mix for best texture |

### Paleo Substitutions

| Original | Paleo Substitute | Notes |
|----------|-----------------|-------|
| Grains (all) | Cauliflower rice, sweet potato, plantain | Paleo excludes all grains |
| Legumes | Extra vegetables, nuts, sweet potato | Paleo excludes legumes |
| Dairy | Coconut cream, ghee (sometimes allowed), nut milks | Ghee is debated in paleo |
| Refined sugar | Honey, maple syrup, dates, coconut sugar | Natural sweeteners only |
| Vegetable oils | Avocado oil, coconut oil, olive oil, tallow | No seed oils |
| Soy sauce | Coconut aminos | Soy is a legume |
| Flour | Almond flour, coconut flour, cassava flour | Cassava closest to AP flour |
| Peanut butter | Almond butter, sunflower seed butter | Peanuts are legumes |
| Corn products | N/A - avoid corn | Corn is a grain in paleo |

### Nut-Free Substitutions

| Original | Nut-Free Substitute | Notes |
|----------|-------------------|-------|
| Peanut butter | Sunflower seed butter (SunButter) | Check for cross-contamination |
| Almond milk | Oat milk, rice milk, soy milk, coconut milk | Coconut is a fruit, not tree nut (most people with tree nut allergies can have coconut; consult allergist) |
| Almond flour | Sunflower seed flour, oat flour, coconut flour | Adjust liquid amounts |
| Cashew cream | Silken tofu blended, coconut cream | Different flavor profile |
| Pine nuts (pesto) | Sunflower seeds, pumpkin seeds | Toast for better flavor |
| Walnut topping | Sunflower seeds, pumpkin seeds, hemp hearts | Similar crunch |
| Nut-based granola | Seed-based granola (pumpkin, sunflower, hemp) | Make your own for safety |
| Trail mix | Seed mix with dried fruit | Verify all components |

### Low-Sodium Substitutions

| Original | Low-Sodium Substitute | Notes |
|----------|---------------------|-------|
| Table salt | Herbs, spices, citrus, vinegar | Build flavor through other means |
| Soy sauce | Low-sodium soy sauce, coconut aminos | Coconut aminos has 73% less sodium |
| Canned beans | Dried beans or rinse canned (removes 40% sodium) | Rinsing is effective |
| Canned tomatoes | No-salt-added canned tomatoes | Available in most stores |
| Broth/stock | Low-sodium or homemade stock | Commercial stock is very high sodium |
| Cheese | Swiss, fresh mozzarella (lower sodium cheeses) | Avoid processed cheese |
| Bread | Low-sodium bread or homemade | Regular bread is surprisingly high |
| Condiments | Make your own; use citrus and herbs | Most condiments are sodium bombs |
| Processed meats | Fresh-cooked meats | Deli meat, bacon, sausage very high |

### Diabetic-Friendly Adaptations

| Strategy | Implementation | Impact |
|----------|---------------|--------|
| Reduce added sugar | Use 1/3 to 1/2 the sugar; add spices (cinnamon, vanilla) | Lower glycemic impact |
| Choose whole grains | Brown rice, whole wheat, quinoa instead of white | Slower glucose release |
| Add protein to meals | Include protein with every meal and snack | Slows carb absorption |
| Increase fiber | More vegetables, beans, whole grains | Slows glucose absorption |
| Control portions | Measure carbs; use the plate method | Prevents glucose spikes |
| Swap refined carbs | Cauliflower rice, zucchini noodles, lettuce wraps | Dramatically lowers carb load |
| Choose lower-GI fruits | Berries, apples, pears over bananas, grapes, watermelon | More stable blood sugar |

> **Important:** Diabetic dietary management should be guided by a healthcare team. These are general strategies, not medical advice.

## Religious Dietary Adaptations

### Halal Guidelines

```
HALAL COOKING CHECKLIST
=========================
Halal means "permissible" in Islamic dietary law.

PERMITTED (Halal):
  [x] All fruits and vegetables
  [x] All grains and legumes
  [x] Seafood (most schools of thought)
  [x] Meat slaughtered according to Islamic method (zabiha)
  [x] Halal-certified meat and poultry
  [x] Eggs and dairy

NOT PERMITTED (Haram):
  [x] Pork and pork byproducts (gelatin, lard, etc.)
  [x] Alcohol and alcohol-based extracts
  [x] Non-zabiha meat
  [x] Blood and blood byproducts
  [x] Carnivorous animals
  [x] Any food contaminated with haram ingredients

HIDDEN INGREDIENTS TO WATCH:
  - Gelatin (often pork-derived) - use agar-agar or halal gelatin
  - Vanilla extract (contains alcohol) - use vanilla powder or halal extract
  - Wine/beer in cooking - use broth, vinegar, or grape juice
  - Lard in baked goods - use butter or vegetable shortening
  - Emulsifiers (mono/diglycerides may be pork-derived)
  - Enzymes in cheese (may be animal-derived; look for microbial enzymes)
```

### Kosher Guidelines

```
KOSHER COOKING BASICS
========================
Kosher (kashrut) dietary laws:

THREE CATEGORIES:
  1. MEAT (fleishig): Mammals with split hooves that chew cud,
     properly slaughtered; certain poultry
  2. DAIRY (milchig): Milk, cheese, butter, etc.
  3. PAREVE (neutral): Eggs, fish, fruits, vegetables, grains

KEY RULES:
  - Meat and dairy must NEVER be mixed (separate meals)
  - Wait between meat and dairy meals (6 hours in many traditions)
  - Separate utensils, cookware, and dishes for meat and dairy
  - Fish with fins and scales are kosher; shellfish is not
  - Pork is not kosher
  - Look for kosher certification symbols (OU, OK, Star-K, etc.)
  - Fruits and vegetables must be inspected for insects

ADAPTING RECIPES:
  - Cheeseburger -> Use vegan cheese or serve separately
  - Cream sauce on chicken -> Use pareve cream or coconut cream
  - Shrimp dishes -> Substitute kosher fish
  - Bacon -> Turkey bacon (kosher-certified) or vegan bacon
```

## Nutritional Impact of Substitutions

### Nutrient Watchlist by Diet

| Diet | Nutrients to Monitor | Good Sources |
|------|---------------------|-------------|
| Vegan | B12, Iron, Zinc, Omega-3, Calcium, Vitamin D | Fortified foods, supplements, leafy greens, nuts |
| Gluten-free | Fiber, B vitamins, Iron | Quinoa, brown rice, fruits, vegetables |
| Dairy-free | Calcium, Vitamin D, Protein | Fortified plant milks, leafy greens, tofu |
| Keto | Fiber, Vitamin C, Potassium | Low-carb vegetables, avocado, nuts |
| Nut-free | Healthy fats, Vitamin E, Magnesium | Seeds, avocado, olive oil |
| Low-sodium | Iodine (if avoiding iodized salt) | Seafood, dairy, iodized salt in moderation |

## Cross-Contamination Awareness

### For Severe Allergies

```
CROSS-CONTAMINATION PREVENTION
=================================
For life-threatening allergies:

EQUIPMENT:
  [ ] Use separate cutting boards (color-coded)
  [ ] Use separate utensils and cookware
  [ ] Wash hands between handling allergen and safe foods
  [ ] Clean all surfaces with soap and water before preparing safe food

PREPARATION:
  [ ] Prepare allergen-free food FIRST
  [ ] Store allergen-free food separately and labeled
  [ ] Read ALL ingredient labels every time (formulations change)
  [ ] When in doubt, do not serve

HIDDEN ALLERGENS:
  Gluten: soy sauce, malt, modified food starch, seasonings
  Dairy: casein, whey, lactose, ghee (trace), "natural flavors"
  Nuts: "may contain" warnings, shared facilities
  Soy: vegetable oil, lecithin, textured vegetable protein
  Eggs: albumin, lysozyme, meringue, mayonnaise

LABEL READING:
  - Check "Contains:" statement (required by law for top 9 allergens)
  - Check "May contain:" or "Processed in facility:" (voluntary)
  - Check every time you buy (manufacturers change formulations)
```

## Quick Adaptation Reference Card

```
QUICK SUBSTITUTION CHEAT SHEET
=================================
Need to remove:

DAIRY -> Use: oat milk, coconut cream, vegan butter, nutritional yeast
EGGS  -> Use: flax eggs, applesauce, aquafaba, mashed banana
GLUTEN-> Use: GF flour blend, tamari, rice/corn pasta, GF oats
MEAT  -> Use: tofu, tempeh, lentils, beans, mushrooms, seitan
NUTS  -> Use: seeds (sunflower, pumpkin), seed butter, oat milk
SUGAR -> Use: monk fruit, stevia, erythritol, less sugar + spices
SOY   -> Use: coconut aminos, other legumes, seed-based alternatives
```


## Output Format

```
DIETARY ADAPTER OUTPUT
======================

Section 1: Assessment / Analysis
- Key findings
- Recommendations

Section 2: Action Plan
- Step-by-step guidance
- Timeline if applicable

Section 3: Resources
- Relevant references
- Next steps
```

## Example

**Input:** "Help me get started with dietary adapter"

**Output:** A structured dietary adapter plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
