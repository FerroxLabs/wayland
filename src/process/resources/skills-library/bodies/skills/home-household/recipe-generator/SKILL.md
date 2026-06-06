---
name: recipe-generator
description: |
  Intelligent recipe creation system that builds recipes from available ingredients using flavor pairing science, cuisine profiles, and cooking method selection. Includes substitution guides for dietary restrictions and allergens, recipe scaling formulas, and plating suggestions.
  Use when the user asks about recipe generator, or needs help with intelligent recipe creation system that builds recipes from available ingredients using flavor pairing science, cuisine profiles, and cooking method selection.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of recipe generator.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking meal-planning template"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Recipe Generator

## When to Use

**Use this skill when:**
- User asks about recipe generator
- User needs guidance on recipe generator topics
- User wants a structured approach to recipe generator

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

```
RECIPE GENERATION INTAKE
===========================

1. AVAILABLE INGREDIENTS:
   Proteins: _______________________________________________
   Vegetables: ____________________________________________
   Starches/Grains: _______________________________________
   Pantry staples available: [ ] Salt/Pepper [ ] Olive oil [ ] Butter
     [ ] Garlic [ ] Onions [ ] Common spices [ ] Soy sauce
     [ ] Vinegar [ ] Flour [ ] Sugar [ ] Stock/broth
   Other: _________________________________________________

2. DIETARY RESTRICTIONS:
   [ ] None
   [ ] Vegetarian       [ ] Vegan
   [ ] Gluten-free      [ ] Dairy-free
   [ ] Nut-free         [ ] Low-sodium
   [ ] Keto / Low-carb  [ ] Paleo
   [ ] Halal            [ ] Kosher
   [ ] Other: ___

3. CUISINE PREFERENCE:
   [ ] No preference / surprise me
   [ ] Italian           [ ] Mexican
   [ ] Chinese           [ ] Japanese
   [ ] Thai              [ ] Indian
   [ ] Mediterranean     [ ] French
   [ ] Korean            [ ] American comfort
   [ ] Middle Eastern    [ ] Other: ___

4. MEAL TYPE:
   [ ] Breakfast  [ ] Lunch  [ ] Dinner
   [ ] Snack      [ ] Appetizer  [ ] Dessert
   [ ] Side dish  [ ] Soup/stew

5. COOKING CONSTRAINTS:
   - Available time: ___ minutes
   - Skill level: [ ] Beginner [ ] Intermediate [ ] Advanced
   - Equipment available: [ ] Stovetop [ ] Oven [ ] Grill
     [ ] Slow cooker [ ] Instant Pot [ ] Air fryer [ ] Microwave only
   - Number of servings needed: ___

6. PREFERENCES:
   - Flavor profile: [ ] Mild [ ] Medium [ ] Bold/Spicy
   - Texture preference: [ ] Crispy [ ] Creamy [ ] Hearty [ ] Light
   - Effort level: [ ] Minimal [ ] Moderate [ ] Willing to work
```

## Flavor Pairing Principles

### The Flavor Balancing Framework

Every great dish balances these five taste elements:

```
THE FIVE TASTES
================
SALT    - Enhances all other flavors; makes food taste more like itself
SWEET   - Balances acidity and bitterness; adds depth
ACID    - Brightens flavors; cuts richness; adds freshness
BITTER  - Adds complexity and sophistication
UMAMI   - Adds savory depth and mouthfeel satisfaction

BALANCING GUIDE:
  Too salty?   -> Add acid (lemon, vinegar) or sweet (sugar, honey)
  Too sweet?   -> Add acid (citrus, vinegar) or salt
  Too sour?    -> Add sweet or fat
  Too bitter?  -> Add salt, sweet, or fat
  Flat/boring? -> Add acid, salt, or umami
  Too rich?    -> Add acid or bitter elements
```

### Classic Flavor Pairings

| Ingredient | Pairs Well With | Cuisine Context |
|-----------|----------------|-----------------|
| Chicken | Lemon, garlic, rosemary, thyme, mushrooms | Universal |
| Beef | Red wine, onions, mushrooms, black pepper, mustard | French, American |
| Pork | Apple, sage, garlic, ginger, soy sauce | Universal |
| Salmon | Dill, lemon, capers, mustard, honey | Nordic, American |
| Shrimp | Garlic, butter, lemon, chili, cilantro | Cajun, Asian |
| Tomato | Basil, garlic, mozzarella, oregano, olive oil | Italian |
| Potato | Rosemary, butter, cheese, sour cream, chives | Universal |
| Egg | Cheese, herbs, tomato, avocado, bacon | Universal |
| Mushroom | Thyme, garlic, cream, soy sauce, truffle | French, Asian |
| Avocado | Lime, cilantro, chili, tomato, cumin | Mexican |
| Lemon | Herbs, garlic, olive oil, capers, butter | Mediterranean |
| Ginger | Garlic, soy sauce, sesame, scallion, chili | Asian |
| Chocolate | Vanilla, coffee, orange, mint, chili, sea salt | Dessert |
| Cinnamon | Apple, vanilla, nutmeg, cardamom, honey | Baking, Indian |
| Basil | Tomato, garlic, mozzarella, pine nuts, lemon | Italian, Thai |

### Spice and Herb Profiles by Cuisine

```
ITALIAN: basil, oregano, rosemary, thyme, garlic, red pepper flakes,
         parsley, fennel seed, marjoram
         Key flavors: olive oil, tomato, garlic, Parmesan

MEXICAN: cumin, chili powder, oregano (Mexican), coriander, paprika,
         chipotle, cilantro, lime
         Key flavors: lime, chili, cilantro, beans, corn

CHINESE: ginger, garlic, five-spice, star anise, Sichuan peppercorn,
         white pepper, scallion, sesame
         Key flavors: soy sauce, rice vinegar, sesame oil, oyster sauce

THAI: lemongrass, galangal, kaffir lime leaf, Thai basil, bird's eye chili,
      cilantro, fish sauce, palm sugar
      Key flavors: sweet, sour, salty, spicy in balance

INDIAN: cumin, coriander, turmeric, garam masala, cardamom, mustard seed,
        fenugreek, chili powder, ginger, garlic
        Key flavors: layered spices, ghee, yogurt, tomato

JAPANESE: dashi, miso, mirin, sake, ginger, wasabi, nori,
          shiso, sansho pepper
          Key flavors: umami-forward, subtle, clean

FRENCH: tarragon, thyme, parsley, chervil, bay leaf, herbes de Provence,
        Dijon mustard, shallots
        Key flavors: butter, wine, cream, stock

MEDITERRANEAN: za'atar, sumac, cumin, coriander, mint, parsley,
               oregano, cinnamon (savory use)
               Key flavors: olive oil, lemon, tahini, yogurt

KOREAN: gochugaru (red pepper flakes), garlic, ginger, sesame,
        doenjang (soybean paste), perilla
        Key flavors: gochujang, sesame oil, soy sauce, fermented elements
```

## Ingredient Combination Logic

### The Flavor Affinity Approach

Ingredients that grow together or share volatile aromatic compounds tend to pair well:

**Complementary Pairings (enhance each other):**
- Tomato + basil (share linalool compound)
- Chocolate + coffee (shared roasted notes)
- Apple + cinnamon (classic volatile match)
- Lemon + dill (bright, fresh compounds)
- Garlic + ginger (pungent aromatics)

**Contrasting Pairings (create interesting tension):**
- Sweet + salty (salted caramel, prosciutto + melon)
- Rich + acidic (butter sauce + lemon)
- Spicy + cooling (chili + yogurt, hot sauce + avocado)
- Crispy + creamy (fried chicken + mashed potatoes)
- Savory + sweet (bacon + maple, miso + caramel)

### Building Flavor Layers

```
FLAVOR LAYERING TECHNIQUE
============================
Layer 1: BASE (aromatic foundation)
  -> Onion, garlic, celery, carrot, ginger, shallot

Layer 2: BODY (main seasoning)
  -> Spices, herbs, sauces, pastes

Layer 3: DEPTH (slow-building flavors)
  -> Tomato paste, miso, anchovy, soy sauce, wine, stock

Layer 4: BRIGHTNESS (added near the end)
  -> Citrus juice, vinegar, fresh herbs

Layer 5: FINISH (at plating)
  -> Good olive oil, flaky salt, fresh herbs, toasted nuts, chili crisp
```

## Recipe Building Workflow

### Step 1: Identify Core Components

```
RECIPE BUILDING TEMPLATE
===========================

PROTEIN: _______________ (amount: ___)
  Cooking method: _______________

STARCH/GRAIN: _______________ (amount: ___)
  Cooking method: _______________

VEGETABLE(S): _______________ (amount: ___)
  Cooking method: _______________

SAUCE/DRESSING: _______________
  Base: _______________
  Flavor builders: _______________

GARNISH/FINISHING: _______________

CUISINE DIRECTION: _______________
```

### Step 2: Select Cooking Method

| Method | Best For | Temperature | Time | Texture Result |
|--------|---------|------------|------|---------------|
| Saute | Thin cuts, vegetables | High heat | 3-10 min | Browned, tender-crisp |
| Roast | Large cuts, root veg | 375-450F | 20-60 min | Caramelized, tender |
| Grill | Steaks, chicken, fish, veg | High direct heat | 5-20 min | Charred, smoky |
| Braise | Tough cuts, beans | Low (300-325F) | 2-4 hours | Fall-apart tender |
| Steam | Delicate fish, vegetables | 212F | 5-15 min | Tender, retains nutrients |
| Poach | Eggs, fish, chicken breast | 160-180F | 5-20 min | Gentle, moist |
| Stir-fry | Thin-cut everything | Very high heat | 3-8 min | Crispy, vibrant |
| Bake | Casseroles, grains, desserts | 325-400F | 20-60 min | Even, thorough |
| Boil | Pasta, grains, potatoes | 212F | Varies | Soft, cooked through |
| Deep-fry | Coated proteins, vegetables | 350-375F | 3-8 min | Crispy exterior |

### Step 3: Build the Recipe

```
RECIPE TEMPLATE
=================
Recipe Name: _______________
Cuisine: _______________
Servings: ___  |  Prep Time: ___  |  Cook Time: ___  |  Total: ___

INGREDIENTS:
  _______________________________________________
  _______________________________________________
  _______________________________________________
  _______________________________________________
  _______________________________________________

INSTRUCTIONS:
  1. PREP: _______________________________________________
  2. _______________________________________________
  3. _______________________________________________
  4. _______________________________________________
  5. _______________________________________________
  6. FINISH: _______________________________________________

NOTES:
  - Make ahead: _______________________________________________
  - Storage: _______________________________________________
  - Variations: _______________________________________________
```

## Recipe Scaling

### Scaling Formulas

```
RECIPE SCALING CALCULATOR
============================
Original servings: ___
Desired servings: ___
Scaling factor: Desired / Original = ___

For each ingredient:
  Original amount x Scaling factor = New amount

Example: Recipe serves 4, need to serve 6
  Scaling factor: 6/4 = 1.5
  2 cups flour x 1.5 = 3 cups flour
  1 tsp salt x 1.5 = 1.5 tsp salt
```

### Scaling Exceptions (do NOT scale linearly)

| Category | Scaling Rule |
|----------|-------------|
| Salt and spices | Scale to 75% when doubling; taste and adjust |
| Garlic | Scale to 75% when doubling (can overpower) |
| Baking powder/soda | Scale to 80-90% when doubling |
| Cooking oil (for sauteing) | Only increase slightly; need enough to coat pan |
| Liquids in braises/soups | Scale to 75-80% when doubling (less evaporation per volume) |
| Cooking time | Does NOT scale linearly; use temperature probe |
| Eggs | Round to nearest whole egg |
| Pan size | Must increase or use multiple pans; crowding changes results |

### Common Measurement Conversions

| Measurement | Equivalent |
|------------|-----------|
| 1 tablespoon | 3 teaspoons |
| 1/4 cup | 4 tablespoons |
| 1/3 cup | 5 tbsp + 1 tsp |
| 1/2 cup | 8 tablespoons |
| 1 cup | 16 tablespoons / 8 fl oz |
| 1 pint | 2 cups |
| 1 quart | 4 cups / 2 pints |
| 1 gallon | 4 quarts / 16 cups |
| 1 pound | 16 ounces |
| 1 ounce | 28 grams |
| 1 cup flour | approximately 120-125 grams |
| 1 cup sugar | approximately 200 grams |
| 1 cup butter | 2 sticks / 227 grams |

## Substitution Guides

### Common Allergen Substitutions

**Dairy-Free:**
| Original | Substitute | Notes |
|----------|-----------|-------|
| Milk | Oat milk, almond milk, coconut milk | Oat is best for cooking |
| Butter | Vegan butter, coconut oil, olive oil | 1:1 for most uses |
| Heavy cream | Full-fat coconut cream | Chill can overnight |
| Cheese | Nutritional yeast (flavor), cashew cream | Varies by application |
| Yogurt | Coconut yogurt, soy yogurt | Check sugar content |
| Sour cream | Cashew cream + lemon juice | Blend soaked cashews |

**Gluten-Free:**
| Original | Substitute | Notes |
|----------|-----------|-------|
| All-purpose flour | 1:1 GF flour blend | Add xanthan gum if blend lacks it |
| Breadcrumbs | Crushed GF crackers, almond meal, cornmeal | Texture varies |
| Pasta | Rice pasta, chickpea pasta, zucchini noodles | Cook GF pasta carefully |
| Soy sauce | Tamari (GF version) or coconut aminos | Check labels |
| Flour tortillas | Corn tortillas, lettuce wraps | Corn is naturally GF |

**Egg-Free:**
| Original | Substitute (per egg) | Best For |
|----------|---------------------|----------|
| 1 egg | 1 tbsp ground flax + 3 tbsp water (sit 5 min) | Baking |
| 1 egg | 1/4 cup unsweetened applesauce | Moist baking |
| 1 egg | 1/2 mashed banana | Sweet baking |
| 1 egg | 3 tbsp aquafaba (chickpea liquid) | Meringues, binding |
| 1 egg | 1/4 cup silken tofu (blended) | Dense baking |

**Nut-Free:**
| Original | Substitute | Notes |
|----------|-----------|-------|
| Peanut butter | Sunflower seed butter, tahini | Check cross-contamination |
| Almond milk | Oat milk, rice milk, soy milk | Widely available |
| Almond flour | Sunflower seed flour, oat flour | May change texture |
| Cashew cream | Silken tofu (blended), coconut cream | Different flavor |

## Plating Suggestions

### The Rule of Thirds
- Place the main element off-center
- Use the plate as a canvas; leave white space
- Odd numbers of elements are more visually appealing

### Plating Components

```
PLATING CHECKLIST
===================
[ ] HEIGHT: Build upward (stack, lean, mound)
[ ] COLOR: Include 3+ colors on the plate
[ ] TEXTURE: Mix textures (crispy + creamy + tender)
[ ] SAUCE: Swipe, dot, or pool (never drown)
[ ] GARNISH: Fresh herbs, microgreens, seeds, citrus zest
[ ] EDGE: Keep the rim clean (wipe with damp cloth)
```

### Color Guide for Plating
| Color | Food Sources |
|-------|-------------|
| Green | Fresh herbs, microgreens, peas, asparagus, avocado |
| Red | Tomatoes, peppers, radishes, pomegranate |
| Orange | Carrots, sweet potato, citrus, paprika |
| Yellow | Corn, lemon, turmeric, egg yolk |
| White | Rice, cauliflower, cream, cheese, onion |
| Brown/Gold | Seared meats, caramelized onions, toasted nuts |
| Purple | Red cabbage, beets, eggplant, purple potato |

## Quick Recipe Formulas

### Universal Stir-Fry Formula
```
1. Oil in hot wok/pan
2. Aromatics: garlic + ginger + scallion whites (30 sec)
3. Protein: cook and remove (2-3 min)
4. Hard vegetables first: carrots, broccoli stems (2 min)
5. Soft vegetables: peppers, snap peas, mushrooms (1-2 min)
6. Return protein
7. Sauce: soy sauce + rice vinegar + sesame oil + cornstarch slurry
8. Toss everything, finish with scallion greens and sesame seeds
9. Serve over rice or noodles
```

### Universal Pasta Formula
```
1. Salt water generously, cook pasta to al dente (reserve 1 cup pasta water)
2. While pasta cooks: saute aromatics in olive oil
3. Add protein and/or vegetables
4. Add sauce base (tomato, cream, or olive oil based)
5. Toss drained pasta into sauce with splash of pasta water
6. Finish: Parmesan, fresh herbs, black pepper, good olive oil
```

### Universal Grain Bowl Formula
```
BASE:     Cooked grain (rice, quinoa, farro, couscous)
PROTEIN:  Grilled, baked, or pan-seared (4-6 oz)
VEG 1:    Roasted or grilled (warm)
VEG 2:    Raw or pickled (fresh/crunchy)
SAUCE:    Dressing or sauce (2-3 tbsp)
TOPPING:  Seeds, nuts, herbs, crispy element
ACID:     Squeeze of lemon/lime or pickled element
```

### Universal Soup Formula
```
1. Sweat aromatics: onion, celery, carrot (mirepoix) in oil (5 min)
2. Add garlic and spices (1 min)
3. Add main vegetables and/or protein
4. Add liquid (stock/broth - about 4 cups per 2 servings)
5. Add acid (tomatoes, wine) if using
6. Simmer until everything is tender (15-45 min)
7. Season: salt, pepper, acid (lemon/vinegar), fresh herbs
8. Optional: blend partially or fully for creamy texture
```

## Food Safety Quick Reference

| Food | Safe Internal Temperature |
|------|-------------------------|
| Poultry (chicken, turkey) | 165F (74C) |
| Ground meat (beef, pork, lamb) | 160F (71C) |
| Beef/pork/lamb (steaks, chops) | 145F (63C) + 3 min rest |
| Fish and shellfish | 145F (63C) |
| Eggs | Cook until firm; 160F for dishes |
| Leftovers (reheating) | 165F (74C) |

### The Danger Zone
- Bacteria grow rapidly between 40F-140F (4C-60C)
- Do not leave food at room temperature for more than 2 hours
- Refrigerate leftovers promptly
- When in doubt, throw it out


## Output Format

```
RECIPE GENERATOR OUTPUT
=======================

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

**Input:** "Help me get started with recipe generator"

**Output:** A structured recipe generator plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
