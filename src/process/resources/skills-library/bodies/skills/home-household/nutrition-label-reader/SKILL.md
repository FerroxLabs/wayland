---
name: nutrition-label-reader
description: |
  Comprehensive guide to reading and interpreting FDA nutrition facts labels, decoding ingredient lists, identifying hidden sugars and additives, understanding serving size practices, evaluating health claims, comparing products, and understanding allergen labeling requirements.
  Use when the user asks about nutrition label reader, or needs help with comprehensive guide to reading and interpreting fda nutrition facts labels, decoding ingredient lists, identifying hidden sugars and additives, understanding serving size practices, evaluating health claims, comparing products, and understanding allergen labeling requirements.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of nutrition label reader.
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

# Nutrition Label Analyzer

## When to Use

**Use this skill when:**
- User asks about nutrition label reader
- User needs guidance on nutrition label reader topics
- User wants a structured approach to nutrition label reader

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

```
NUTRITION LABEL READING ASSESSMENT
=====================================

1. WHAT DO YOU NEED HELP WITH?
   [ ] Understanding how to read a nutrition label
   [ ] Comparing two or more products
   [ ] Identifying hidden sugars or unhealthy ingredients
   [ ] Understanding health claims on packaging
   [ ] Managing a specific health condition through labels
   [ ] Allergen identification
   [ ] General nutrition literacy improvement

2. HEALTH GOALS:
   [ ] Weight loss / calorie awareness
   [ ] Heart health (watching sodium, saturated fat, cholesterol)
   [ ] Blood sugar management (watching carbs, sugar)
   [ ] Kidney health (watching sodium, potassium, phosphorus)
   [ ] Food allergy management
   [ ] General healthy eating
   # ... (condensed) ...
   [ ] Specific allergens: ___

4. CURRENT KNOWLEDGE:
   [ ] Never really looked at labels
   [ ] Look occasionally but don't understand much
   [ ] Understand basics, want to go deeper
   [ ] Fairly knowledgeable, want to catch hidden things
```

## How to Read an FDA Nutrition Facts Label

### Label Anatomy (Section by Section)

```
+========================================+
|        Nutrition Facts                  |
|----------------------------------------|
| ___ servings per container              |  <- SECTION 1: Serving Info
| Serving size        ___                 |
|========================================|
| Calories            ___                 |  <- SECTION 2: Calories
|----------------------------------------|
+========================================+
```

### Section 1: Serving Size (MOST IMPORTANT - Read This First)

```
WHY SERVING SIZE MATTERS
===========================
EVERYTHING on the label is based on ONE serving.
If you eat 2 servings, DOUBLE all the numbers.

COMMON SERVING SIZE TRAPS:
  - A bottle of soda may contain 2.5 servings
  - A "personal" bag of chips may contain 2-3 servings
  - A pint of ice cream is 3-4 servings
  - A muffin may be labeled as 2 servings
  - A ramen packet may be 2 servings

CALCULATION:
  Actual consumption x label number = what you actually ate

  Example: Label says 150 calories per serving
  You eat the whole bag (2.5 servings)
  150 x 2.5 = 375 actual calories consumed
```

### Section 2: Calories

```
CALORIE CONTEXT
=================
General daily calorie needs (very approximate):
  Sedentary women:  1,600-2,000
  Active women:     2,000-2,400
  Sedentary men:    2,000-2,400
  Active men:       2,400-3,000

PER SERVING GUIDELINES:
  40 calories      = LOW calorie food
  100 calories     = MODERATE calorie food
  400+ calories    = HIGH calorie food (for a single serving)

CALORIE DENSITY (calories per gram):
  Fat: 9 cal/g
  Alcohol: 7 cal/g
  Carbs: 4 cal/g
  Protein: 4 cal/g
```

### Section 3: Nutrients to Limit

```
NUTRIENTS TO LIMIT
====================

TOTAL FAT:
  Daily limit: 44-78g (based on 2,000 cal diet, 20-35% from fat)
  Not all fat is bad - focus on limiting saturated and trans fats
  Healthy fats (unsaturated): olive oil, nuts, avocado, fish

SATURATED FAT:
  Daily limit: Less than 20g (less than 10% of calories)
  Sources: Fatty meats, butter, cheese, coconut oil, palm oil
  5% DV or less = LOW
  20% DV or more = HIGH

TRANS FAT:
  Daily limit: As close to 0g as possible
  Artificial trans fats are banned but some still exist in older products
  Natural trace amounts in dairy and meat
  WARNING: "0g trans fat" can contain up to 0.49g per serving
  # ... (condensed) ...

SODIUM:
  Daily limit: Less than 2,300mg (ideally less than 1,500mg)
  5% DV or less = LOW sodium
  20% DV or more = HIGH sodium
  Average American consumes ~3,400mg/day (way too much)
  Top sources: bread, deli meat, pizza, canned soup, restaurant food
```

### Section 4: Carbohydrates

```
CARBOHYDRATE BREAKDOWN
========================

TOTAL CARBOHYDRATE:
  Includes fiber + sugars + starches
  Daily target varies by goal:
    General: 225-325g (45-65% of calories)
    Low-carb: 50-100g
    Keto: under 20-50g

DIETARY FIBER:
  Daily target: 25-35g (most Americans get only 15g)
  5% DV or less = LOW fiber (not great)
  20% DV or more = HIGH fiber (good)
  More fiber = better; slows digestion, feeds gut bacteria

TOTAL SUGARS:
  Includes natural sugars (from fruit, milk) AND added sugars
  Natural sugars in whole foods are generally fine

ADDED SUGARS (the important number):
  Daily limit: Less than 25g women / 36g men (AHA recommendation)
  This is the sugar added during processing
  Added sugars provide calories with no nutritional benefit
  5% DV or less = LOW added sugar (good)
  20% DV or more = HIGH added sugar (avoid)
```

### Section 5: Protein

```
PROTEIN ASSESSMENT
====================
No % Daily Value required on labels (unless a protein claim is made)

General daily needs:
  Sedentary: 0.36g per lb body weight (50-60g for most adults)
  Active: 0.6-0.8g per lb body weight
  Athletes/muscle building: 0.8-1.0g per lb body weight

PER SERVING GUIDELINES:
  For a snack: 5-10g protein is good
  For a meal: 20-30g protein is ideal
  Higher protein per calorie = more filling
```

### Section 6: Vitamins and Minerals

## Ingredient List Decoding

### How Ingredient Lists Work

```
INGREDIENT LIST RULES
=======================
1. Ingredients are listed in ORDER OF WEIGHT (most to least)
2. The first 3-5 ingredients make up the majority of the product
3. If sugar is in the first 3 ingredients, the product is mostly sugar
4. Fewer ingredients generally = less processed
5. If you can't pronounce or recognize an ingredient, research it

READING STRATEGY:
  - Check the FIRST 3 ingredients (this IS the product)
  - Look for hidden sugars (see list below)
  - Look for hidden sodium sources
  - Check for allergens
  - Note the number of total ingredients
```

### Hidden Sugar Names (over 60 names for sugar)

```
HIDDEN SUGAR IDENTIFICATION
==============================
All of these are SUGAR by another name:

OBVIOUS: sugar, brown sugar, cane sugar, raw sugar, powdered sugar

SYRUPS: high fructose corn syrup, corn syrup, maple syrup,
  rice syrup, malt syrup, golden syrup, agave syrup/nectar,
  refiner's syrup, sorghum syrup, carob syrup, tapioca syrup

"-OSE" WORDS: sucrose, glucose, fructose, dextrose, maltose,
  galactose, lactose, trehalose

JUICE-BASED: fruit juice concentrate, fruit juice, evaporated
  cane juice, concentrated fruit juice

NATURAL-SOUNDING: honey, molasses, coconut sugar, date sugar,
  palm sugar, turbinado, muscovado, demerara, sucanat,
  panela, jaggery, barley malt

OTHER: dextrin, maltodextrin, ethyl maltol, caramel, Florida
  crystals, crystalline fructose

TRICK: Manufacturers sometimes use multiple types of sugar
so that no single one appears as the first ingredient.
If 3+ types of sugar appear in the ingredient list,
the product is likely very high in sugar overall.
```

### Common Additive Categories

| Additive Type | Purpose | Examples | Concern Level |
|--------------|---------|---------|--------------|
| Preservatives | Extend shelf life | BHA, BHT, sodium benzoate, sodium nitrite | Some controversy; generally recognized as safe |
| Artificial colors | Visual appeal | Red 40, Yellow 5, Blue 1 | Some linked to hyperactivity in sensitive children |
| Artificial sweeteners | Sugar-free sweetness | Aspartame, sucralose, acesulfame-K | Generally recognized as safe; debate ongoing |
| Emulsifiers | Blend oil and water | Lecithin, mono/diglycerides, polysorbate 80 | Generally safe; some gut health research |
| Thickeners | Texture | Xanthan gum, guar gum, carrageenan | Generally safe; carrageenan debated |
| Flavor enhancers | Boost flavor | MSG (monosodium glutamate), yeast extract | MSG is safe for most people despite reputation |
| Natural flavors | Flavoring | "Natural flavors" (broad category) | Legal definition is broad; not always "natural" |

## Serving Size Tricks to Watch For

### Common Deceptive Practices

| Product | Serving Size on Label | What You Actually Eat | Real Numbers |
|---------|---------------------|---------------------|-------------|
| 20 oz soda | 12 oz (1.67 servings) | All 20 oz | Label: 140 cal, Reality: 233 cal |
| Ramen noodles | Half package | Whole package | Label: 190 cal, Reality: 380 cal |
| "Personal" pizza | 1/3 pizza | Whole pizza | Label: 300 cal, Reality: 900 cal |
| Muffin | 1/2 muffin | Whole muffin | Label: 200 cal, Reality: 400 cal |
| Pint of ice cream | 2/3 cup (3 servings) | Half or all of pint | Label: 230 cal, Reality: 690+ cal |
| Cookie package | 2 cookies | 4-5 cookies | Double or triple label values |
| Spray oil | 1/4 second spray (0.25g) | 1-2 seconds | Label: 0 cal, Reality: 10-20 cal |

### "0" Labeling Loopholes

```
ZERO DOESN'T ALWAYS MEAN ZERO
================================
Per FDA rules, labels can claim 0g if under a certain threshold PER SERVING:

Trans fat:   Can say "0g" if less than 0.5g per serving
  -> 3 servings could mean 1.47g trans fat (not zero!)

Calories:    Can say "0" if less than 5 per serving
  -> Cooking spray: tiny serving = "0 cal" but you use more

Sugar:       Can say "0g" if less than 0.5g per serving

CHECK THE INGREDIENT LIST:
  "Partially hydrogenated oil" = trans fat exists regardless of 0g label
  Any sugar name = sugar exists regardless of 0g label
```

## Health Claims vs Reality

### Types of Claims on Food Packages

```
CLAIM TYPES (FDA Categories)
==============================

1. HEALTH CLAIMS (FDA-approved, science-backed):
   "Diets low in sodium may reduce the risk of high blood pressure"
   - Must meet specific FDA criteria
   - Strongest evidence requirement
   - Reliable

2. STRUCTURE/FUNCTION CLAIMS (less regulated):
   "Supports immune health" "Promotes digestive wellness"
   - Do NOT require FDA pre-approval
   - Must include disclaimer: "This statement has not been
     evaluated by the FDA"
   - Less reliable; marketing language

3. NUTRIENT CONTENT CLAIMS (regulated definitions):
   "Low fat" "High fiber" "Good source of calcium"
   - Have specific FDA definitions (see below)
   - Reliable for the specific claim
   - But may distract from other nutritional issues
```

### Regulated Nutrient Content Claims

| Claim | FDA Definition |
|-------|---------------|
| "Free" (fat-free, sugar-free) | Less than 0.5g per serving |
| "Low" (low-fat, low-sodium) | Fat: less than 3g; Sodium: less than 140mg; Calories: less than 40 per serving |
| "Reduced" | At least 25% less than the reference product |
| "Light/Lite" | 1/3 fewer calories or 50% less fat than reference |
| "Good source of" | 10-19% Daily Value per serving |
| "Excellent source of" / "High in" | 20% or more Daily Value per serving |
| "Lean" (meat/poultry) | Less than 10g fat, 4.5g saturated fat, 95mg cholesterol per serving |
| "Organic" | USDA certified; 95%+ organic ingredients |

### Marketing Terms That Mean Nothing (not regulated)

```
UNREGULATED MARKETING TERMS
==============================
These terms have NO legal or FDA definition:

  "Natural"     - Almost meaningless; no standard definition
  "Clean"       - Marketing term, no regulation
  "Superfood"   - Marketing term, no regulation
  "Wholesome"   - Marketing term, no regulation
  "Artisanal"   - Marketing term, no regulation
  "Farm-fresh"  - Marketing term, no regulation
  "Lightly sweetened" - No defined sugar threshold
  "Made with real fruit" - Could contain very little actual fruit
  "Multi-grain" - Multiple grains, but not necessarily whole grains
  "Made with whole grains" - Could be mostly refined, with some whole grain

WHAT TO TRUST INSTEAD:
  "100% Whole Grain" - Regulated; means all grains are whole
  "USDA Organic" - Regulated; certified organic
  "Non-GMO Project Verified" - Third-party verified
  Actual nutrition facts numbers (not front-of-package claims)
```

## Comparing Products

### Product Comparison Worksheet

```
PRODUCT COMPARISON TOOL
=========================
Compare two products on equal footing:

                        | Product A      | Product B
Product name:           | ______________ | ______________
Serving size:           | ______________ | ______________
Servings per container: | ______________ | ______________

PER SAME SERVING SIZE (normalize to same amount):

Calories:               | ______________ | ______________
Total Fat:              | ___g  (___%)   | ___g  (___%)
  Saturated Fat:        | ___g           | ___g
  Trans Fat:            | ___g           | ___g
Sodium:                 | ___mg (___%)   | ___mg (___%)
Total Carbs:            | ___g           | ___g
  Fiber:                | ___g           | ___g
  Added Sugars:         | ___g  (___%)   | ___g  (___%)
# ... (condensed) ...
                        | ______________ | ______________

WINNER: ______________ because: ______________

IMPORTANT: Normalize to the SAME serving size before comparing.
If Product A serving is 30g and Product B is 50g, you must
adjust one to match the other for a fair comparison.
```

### Quick Comparison Priorities (in order)

1. **Serving size** - Make sure you are comparing apples to apples
2. **Protein per calorie** - Higher protein per calorie = more filling
3. **Added sugars** - Lower is better
4. **Fiber** - Higher is better
5. **Sodium** - Lower is better (unless specifically needed)
6. **Saturated fat** - Lower is better
7. **Ingredient list** - Shorter and more recognizable is generally better
8. **Price per serving** - Value matters too

## Allergen Labeling Requirements

### FDA Top 9 Allergens (FALCPA + Sesame)

```
MAJOR FOOD ALLERGENS (must be declared on US labels)
=====================================================
1. MILK (includes casein, whey, lactose, lactalbumin)
2. EGGS (includes albumin, lysozyme, globulin)
3. FISH (species must be identified)
4. CRUSTACEAN SHELLFISH (shrimp, crab, lobster)
5. TREE NUTS (species must be identified: almond, walnut, etc.)
6. PEANUTS
7. WHEAT
8. SOYBEANS
9. SESAME (added in 2023)

HOW THEY APPEAR ON LABELS:
  Option A: Bold in ingredient list
    "Ingredients: flour (wheat), sugar, butter (milk)..."

  Option B: "Contains" statement after ingredient list
    "Contains: wheat, milk, soy"

  Both are legally required. "Contains" statement is easiest to find.
```

### Advisory Allergen Warnings (NOT required by law)

```
ADVISORY STATEMENTS (voluntary, not regulated)
================================================
"May contain [allergen]"
"Produced in a facility that also processes [allergen]"
"Made on shared equipment with [allergen]"
"Processed in a plant that handles [allergen]"

WHAT THIS MEANS:
  - These statements are VOLUNTARY (companies choose to include them)
  - Absence of advisory statement does NOT mean it is safe
  - For severe allergies: contact the manufacturer directly
  - Cross-contamination risk is REAL even without advisory statement

FOR LIFE-THREATENING ALLERGIES:
  - Read EVERY label EVERY time (formulations change)
  - Contact manufacturers for facility information
  - When in doubt, do not consume
  - Carry epinephrine (EpiPen) at all times
  - Consult an allergist for guidance
```

## Label Reading Quick Reference Card

```
60-SECOND LABEL CHECK
========================
1. SERVING SIZE: How much is one serving? How much will I eat?
2. CALORIES: Reasonable for this food? Multiply if eating more than 1 serving
3. ADDED SUGARS: Under 5g per serving? (Target under 25-36g/day total)
4. SODIUM: Under 600mg per serving? (Target under 2,300mg/day)
5. FIBER: Over 3g per serving? (Good; target 25-35g/day)
6. PROTEIN: Adequate for a meal (20g+) or snack (5g+)?
7. INGREDIENTS: Recognize most of them? First 3 acceptable?
8. ALLERGENS: Contains statement clear of your allergens?

% DAILY VALUE CHEAT SHEET:
  5% DV or less = LOW (good for things to limit, bad for nutrients you need)
  20% DV or more = HIGH (bad for things to limit, good for nutrients you need)
```


## Output Format

```
NUTRITION LABEL READER OUTPUT
=============================

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

**Input:** "Help me get started with nutrition label reader"

**Output:** A structured nutrition label reader plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
