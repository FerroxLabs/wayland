---
name: meal-planner
description: |
  Comprehensive weekly meal planning system with batch cooking strategies, meal prep scheduling, balanced meal composition, family-size scaling, leftover incorporation, seasonal ingredient planning, and automated shopping list generation. Designed to save time, reduce food waste, and support nutritional goals.
  Use when the user asks about meal planner, or needs help with comprehensive weekly meal planning system with batch cooking strategies, meal prep scheduling, balanced meal composition, family-size scaling, leftover incorporation, seasonal ingredient planning, and automated shopping list generation.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of meal planner.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking meal-planning step-by-step"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Weekly Meal Planner

## When to Use

**Use this skill when:**
- User asks about meal planner
- User needs guidance on meal planner topics
- User wants a structured approach to meal planner

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

```
MEAL PLANNING INTAKE
=======================

1. HOUSEHOLD:
   - Number of people eating: ___
   - Ages (for portion sizing): ___
   - Picky eaters or strong preferences: ___

2. DIETARY NEEDS:
   [ ] No restrictions
   [ ] Vegetarian   [ ] Vegan
   [ ] Gluten-free  [ ] Dairy-free
   [ ] Nut-free     [ ] Low-sodium
   [ ] Keto         [ ] Paleo
   [ ] Multiple diets in household (specify): ___
   [ ] Other: ___

3. MEALS TO PLAN:
   [ ] Breakfast (all 7 days / weekdays only / weekends only)
   [ ] Lunch (all 7 days / weekdays only / weekends only)
   [ ] Dinner (all 7 days / weekdays only / weekends only)
   [ ] Snacks
   Number of meals to plan per week: ___

4. COOKING CONSTRAINTS:
   - Cooking time available on weeknights: ___ minutes
   - Cooking time available on weekends: ___ minutes
   - Meal prep day available: [ ] Yes (which day: ___) [ ] No
   - Skill level: [ ] Beginner [ ] Intermediate [ ] Advanced
   - Equipment: [ ] Full kitchen [ ] Limited [ ] Instant Pot [ ] Slow cooker

5. BUDGET:
   - Weekly grocery budget: $___
   - Budget priority: [ ] Cost first [ ] Quality first [ ] Balance

6. PREFERENCES:
   - Favorite cuisines: ___
   - Disliked ingredients: ___
   - How often to repeat meals: [ ] Never [ ] 1-2 times/week [ ] Don't mind
   - Leftovers for lunch: [ ] Yes, please [ ] Sometimes [ ] No
   - Eating out planned: ___ times per week (which meals: ___)

7. GOALS:
   [ ] Save time
   [ ] Save money
   [ ] Eat healthier
   [ ] Reduce food waste
   [ ] More variety
   [ ] Lose weight
   [ ] Gain muscle
   [ ] Feed family better
```

## Weekly Meal Plan Template

### Full Week Template

```
WEEKLY MEAL PLAN: Week of ___________
==========================================

         | Breakfast      | Lunch          | Dinner         | Snack
---------|----------------|----------------|----------------|--------
MONDAY   |                |                |                |
TUESDAY  |                |                |                |
WEDNESDAY|                |                |                |
THURSDAY |                |                |                |
FRIDAY   |                |                |                |
SATURDAY |                |                |                |
SUNDAY   |                |                |                |

PREP DAY TASKS (Sunday or chosen day):
  1. _______________________________________________
  2. _______________________________________________
  3. _______________________________________________
  4. _______________________________________________
  5. _______________________________________________

LEFTOVER PLAN:
  Monday dinner -> Tuesday lunch
  Wednesday dinner -> Thursday lunch
  Sunday batch cook -> Monday + Tuesday lunches
```

### Meal Planning Workflow

```
MEAL PLANNING IN 6 STEPS (30 minutes/week)
=============================================

Step 1: CHECK (5 min)
  - What's already in the fridge/freezer/pantry?
  - What needs to be used up soon?
  - What's on sale this week?

Step 2: SCHEDULE (5 min)
  - Which nights are busy? -> Plan quick/simple meals
  - Which nights have time? -> Plan from-scratch meals
  - Any events, eating out, or leftovers from last week?

Step 3: PLAN (10 min)
  - Fill in dinners first (most complex meal)
  - Plan lunches (use dinner leftovers where possible)
  - Plan breakfasts (keep simple, repeatable)
  - Add snacks

Step 4: LIST (5 min)
  - Generate shopping list from plan
  - Cross off items already on hand
  - Organize by store section

Step 5: SHOP (varies)
  - Shop once per week if possible
  - Stick to the list
  - Buy seasonal produce for best value

Step 6: PREP (varies)
  - Batch cook grains, proteins, and sauces
  - Wash and cut vegetables
  - Portion snacks
  - Label and store in fridge
```

## Batch Cooking Strategies

### Sunday Batch Cook Plan (2-3 hours)

```
BATCH COOKING SESSION
========================
Prep these building blocks to mix-and-match all week:

PROTEINS (pick 2):
  [ ] Baked chicken thighs/breasts (season half differently)
  [ ] Slow cooker pulled pork or shredded chicken
  [ ] Hard-boiled eggs (1 dozen)
  [ ] Seasoned ground turkey/beef
  [ ] Baked tofu or tempeh
  [ ] Cooked beans/lentils (from dried or canned)

GRAINS (pick 2):
  [ ] Rice (white, brown, or both)
  [ ] Quinoa
  [ ] Pasta (cook, toss with olive oil)
  [ ] Farro or barley
  [ ] Couscous

VEGETABLES:
  [ ] Roasted sheet pan vegetables (broccoli, sweet potato,
      peppers, onions, zucchini)
  [ ] Washed and cut raw vegetables (for snacking and salads)
  [ ] Sauteed greens (spinach, kale)
  [ ] Prepped salad ingredients (stored separately)

SAUCES/DRESSINGS (pick 2):
  [ ] Vinaigrette (lemon, olive oil, mustard, herbs)
  [ ] Tahini sauce
  [ ] Teriyaki or stir-fry sauce
  [ ] Tomato sauce (big batch)
  [ ] Pesto
  [ ] Hummus

SNACKS:
  [ ] Cut fruit
  [ ] Portioned nuts/trail mix
  [ ] Energy balls/bars
  [ ] Yogurt parfait cups

COOKING ORDER (for efficiency):
  1. Start oven items first (chicken, roasted veg) - 375F
  2. Start slow cooker if using
  3. While oven works: cook grains on stovetop
  4. While grains cook: wash and prep raw vegetables
  5. While everything cooks: make sauces and dressings
  6. When oven items done: boil eggs in the same pot
  7. Assemble, portion, label, refrigerate
```

### Batch Cooking Storage Guide

| Item | Fridge (days) | Freezer (months) | Storage Tip |
|------|--------------|------------------|-------------|
| Cooked chicken | 3-4 days | 2-3 months | Slice or shred before storing |
| Cooked ground meat | 3-4 days | 2-3 months | Cool completely before storing |
| Cooked grains | 4-5 days | 2-3 months | Add splash of water when reheating |
| Roasted vegetables | 3-4 days | 1-2 months | May soften; best fresh |
| Cooked beans | 4-5 days | 3-4 months | Store in cooking liquid |
| Soups and stews | 4-5 days | 3-4 months | Leave room for expansion in freezer |
| Sauces | 5-7 days | 3-6 months | Glass jars or freezer bags |
| Hard-boiled eggs | 7 days | Do not freeze | Peel or unpeeled |
| Cut raw vegetables | 3-5 days | Varies | Store in water (carrots, celery) |

## Balanced Meal Composition

### The Balanced Plate Method

```
BALANCED PLATE TEMPLATE
=========================

  +-------------------+
  |     VEGETABLES    |  <- 1/2 of the plate
  |    (non-starchy)  |     Aim for color variety
  |                   |
  +---------+---------+
  | PROTEIN | STARCH/ |  <- 1/4 protein, 1/4 starch
  |         | GRAIN   |
  |  (lean) | (whole) |
  +---------+---------+

  + Healthy fat (olive oil, avocado, nuts)
  + Fruit (dessert or side)
  + Water or unsweetened beverage
```

### Quick Balanced Meal Ideas by Category

**15-Minute Meals (Busy Weeknights):**
1. Stir-fry with pre-cut vegetables + protein + rice (from batch)
2. Grain bowl with batch-cooked components + fresh toppings
3. Quesadillas with beans, cheese, pre-cooked chicken, salsa
4. Pasta with jarred sauce + frozen vegetables + pre-cooked sausage
5. Sheet pan nachos with beans, cheese, tomatoes, avocado
6. Omelets or frittata with whatever vegetables are on hand
7. Soup from the freezer + crusty bread + side salad

**30-Minute Meals (Standard Weeknights):**
1. One-pan chicken with roasted vegetables
2. Fish tacos with slaw and avocado
3. Pasta primavera with seasonal vegetables
4. Turkey burgers with sweet potato fries
5. Curry with chickpeas and vegetables over rice
6. Salmon with quinoa and steamed broccoli
7. Chicken Caesar salad with homemade dressing

**Weekend Meals (More Time Available):**
1. Homemade pizza with whole wheat dough
2. Slow-braised short ribs or pot roast
3. Homemade soup or stew (big batch for freezing)
4. Grilled meats with multiple sides
5. Stuffed peppers or enchiladas
6. Roast chicken with root vegetables
7. Breakfast for dinner (pancakes, eggs, bacon, fruit)

## Family-Size Scaling

### Portion Guide by Age

| Age Group | Protein | Grains | Vegetables | Fruit |
|-----------|---------|--------|------------|-------|
| Toddler (2-3) | 2 oz | 3 oz eq | 1 cup | 1 cup |
| Child (4-8) | 4 oz | 5 oz eq | 1.5 cups | 1-1.5 cups |
| Tween (9-13) | 5 oz | 5-6 oz eq | 2-2.5 cups | 1.5 cups |
| Teen (14-18) | 5-6.5 oz | 6-8 oz eq | 2.5-3 cups | 1.5-2 cups |
| Adult | 5-6.5 oz | 6-8 oz eq | 2.5-3 cups | 1.5-2 cups |

### Scaling for Families

```
FAMILY MEAL SCALING
=====================
Household members:
  ___ adults x 1.0 portions    = ___ adult portions
  ___ teens x 1.0 portions     = ___ adult portions
  ___ children (4-8) x 0.5     = ___ adult portions
  ___ toddlers x 0.33          = ___ adult portions

TOTAL adult-equivalent portions: ___

Recipe serves 4 adults? Multiply all ingredients by:
  Total portions / 4 = ___ scaling factor
```

## Leftover Incorporation Strategy

### Planned Leftovers (Cook Once, Eat Twice)

| Cook on Day 1 | Transform on Day 2 |
|---------------|-------------------|
| Roast chicken | Chicken salad, chicken tacos, chicken soup |
| Grilled steak | Steak salad, steak sandwich, beef fried rice |
| Baked salmon | Salmon cakes, salmon pasta, salmon grain bowl |
| Pot of chili | Chili cheese fries, chili-stuffed peppers, chili mac |
| Roasted vegetables | Frittata filling, wrap filling, pasta toss, grain bowl |
| Big pot of rice | Fried rice, rice bowls, stuffed peppers, rice pudding |
| Slow-cooker pork | Tacos, sandwiches, pork fried rice, pork ramen |
| Large batch of beans | Burritos, soup, dip/hummus, salad topping |

### Leftover Safety Rules
- Refrigerate within 2 hours of cooking
- Use within 3-4 days
- Reheat to 165F (74C) internally
- Only reheat the portion you will eat (avoid re-reheating)
- When in doubt, throw it out

## Seasonal Ingredient Planning

### Seasonal Produce Guide (approximate, varies by region)

**Spring (March-May):**
Asparagus, artichokes, peas, radishes, strawberries, spinach, green onions, rhubarb, fava beans, spring greens

**Summer (June-August):**
Tomatoes, corn, zucchini, peppers, berries, peaches, watermelon, eggplant, cucumbers, green beans, basil

**Fall (September-November):**
Apples, pears, squash (butternut, acorn, delicata), sweet potatoes, Brussels sprouts, cranberries, figs, pumpkin, cauliflower, beets

**Winter (December-February):**
Citrus (oranges, grapefruit, lemons), root vegetables (turnips, parsnips, carrots), kale, cabbage, potatoes, onions, celery root, pomegranates

### Why Cook Seasonally
- **Cheaper:** In-season produce costs less
- **Better tasting:** Harvested at peak ripeness
- **More nutritious:** Shorter time from harvest to table
- **More sustainable:** Less transportation and storage needed
- **More variety:** Forces you to try new ingredients throughout the year

## Shopping List Generation

### Shopping List Template (organized by store section)

```
WEEKLY SHOPPING LIST: Week of ___________
==========================================

PRODUCE:
  Fruits:
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___
  Vegetables:
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___
  Fresh herbs:
    [ ] _______________  qty: ___

MEAT/PROTEIN:
    [ ] _______________  qty: ___  est: $___
    [ ] _______________  qty: ___  est: $___

DAIRY/EGGS:
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___

BREAD/BAKERY:
    [ ] _______________  qty: ___

DRY GOODS/PANTRY:
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___

CANNED/JARRED:
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___

FROZEN:
    [ ] _______________  qty: ___
    [ ] _______________  qty: ___

CONDIMENTS/SAUCES:
    [ ] _______________  qty: ___

OTHER:
    [ ] _______________  qty: ___

ESTIMATED TOTAL: $___
BUDGET: $___
```

### Shopping List Building Process
1. List all ingredients from the meal plan
2. Check pantry, fridge, and freezer for what you already have
3. Cross off items you have
4. Consolidate quantities (e.g., 3 recipes need onions = buy 5 onions)
5. Organize by store section for efficient shopping
6. Note quantities and estimated costs

## Meal Prep Scheduling

### Weeknight Prep Efficiency

```
DAILY PREP TIMELINE (30-minute dinner)
========================================
5:00 PM  Start oven preheating (if needed)
5:00     Pull pre-made components from fridge
5:05     Start longest-cooking item first
5:10     While that cooks, prep fresh elements
5:20     Start quick-cooking items
5:25     Set table, pour drinks
5:30     Plate and serve

KEY PRINCIPLE: Start with whatever takes longest.
Work backward from serving time.
```

### Make-Ahead Levels

| Level | What to Prep Ahead | Time Saved |
|-------|-------------------|-----------|
| Level 1 | Wash and chop vegetables | 10-15 min/meal |
| Level 2 | Cook grains and proteins | 20-30 min/meal |
| Level 3 | Make complete meals, store in portions | 30-45 min/meal |
| Level 4 | Freeze complete meals for future weeks | Max time saved |

## Budget Meal Planning Tips

### Cost-Saving Strategies
1. **Plan before shopping** - The list prevents impulse buying
2. **Buy in bulk** - Rice, beans, oats, frozen vegetables
3. **Use store brands** - Often 20-40% cheaper, same quality
4. **Buy whole, prep yourself** - Whole chicken cheaper than parts
5. **Eat less meat** - Include 2-3 meatless dinners per week
6. **Use frozen produce** - Often cheaper, just as nutritious, no waste
7. **Cook from scratch** - Convenience foods cost 2-5x more
8. **Repurpose leftovers** - Reduces waste and stretches ingredients
9. **Shop seasonally** - In-season produce is cheaper and better
10. **Check unit prices** - Bigger is not always cheaper per unit

### Budget Meal Ideas (under $3 per serving)
- Bean and rice bowls with salsa and avocado
- Pasta with homemade marinara and vegetables
- Lentil soup with crusty bread
- Egg fried rice with frozen vegetables
- Black bean quesadillas with homemade pico
- Oatmeal with banana and peanut butter
- Baked potato bar with various toppings
- Chickpea curry with rice
- Minestrone soup
- Homemade chili with cornbread


## Output Format

```
MEAL PLANNER OUTPUT
===================

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

**Input:** "Help me get started with meal planner"

**Output:** A structured meal planner plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
