---
name: grocery-optimizer
description: |
  Smart grocery shopping optimization system that helps reduce spending through budget-based strategies, aisle-organized shopping lists, unit price comparison, seasonal produce guidance, bulk buying analysis, and food waste reduction techniques. Includes pantry staples checklists and store brand vs name brand analysis.
  Use when the user asks about grocery optimizer, or needs help with smart grocery shopping optimization system that helps reduce spending through budget-based strategies, aisle-organized shopping lists, unit price comparison, seasonal produce guidance, bulk buying analysis, and food waste reduction techniques.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of grocery optimizer.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking meal-planning checklist"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Grocery Shopping Optimizer

## When to Use

**Use this skill when:**
- User asks about grocery optimizer
- User needs guidance on grocery optimizer topics
- User wants a structured approach to grocery optimizer

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

```
GROCERY OPTIMIZATION ASSESSMENT
==================================

1. BUDGET:
   - Weekly grocery budget: $___
   - Monthly grocery budget: $___
   - Current weekly spending: $___
   - Budget priority: [ ] Minimize cost [ ] Balance cost/quality [ ] Quality first

2. HOUSEHOLD:
   - Number of people: ___
   - Ages: ___
   - Dietary restrictions: ___

3. SHOPPING HABITS:
   - How often do you shop: [ ] Daily [ ] 2-3x/week [ ] Weekly [ ] Bi-weekly
   - Primary store(s): ___
   - Do you use coupons: [ ] Yes [ ] Sometimes [ ] No
   - Do you meal plan: [ ] Yes [ ] Sometimes [ ] No
   - Do you make a shopping list: [ ] Yes [ ] Sometimes [ ] No
   - Estimated food waste per week: [ ] Minimal [ ] Some [ ] A lot

4. SHOPPING PREFERENCES:
   - Organic preference: [ ] Always [ ] Sometimes [ ] Not important
   - Store brand vs name brand: [ ] Always store [ ] Mix [ ] Always name brand
   - Willingness to shop multiple stores: [ ] Yes [ ] For big savings [ ] No
   - Access to: [ ] Warehouse club (Costco/Sam's) [ ] Farmers market
     [ ] Discount store (Aldi/Lidl) [ ] Online grocery [ ] Standard grocery

5. COOKING LEVEL:
   [ ] Minimal cooking (pre-made, convenience)
   [ ] Basic cooking (simple meals from scratch)
   [ ] Moderate cooking (comfortable with most recipes)
   [ ] Advanced cooking (cook most things from scratch)

6. BIGGEST CHALLENGES:
   [ ] Spending too much
   [ ] Throwing away too much food
   [ ] Impulse buying
   [ ] Not knowing what to buy
   [ ] Running out of essentials
   [ ] Unorganized shopping trips
   [ ] Buying things I already have at home
```

## Budget-Based Shopping Strategies

### Monthly Budget Guidelines (USDA Cost of Food, approximate)

| Plan Level | 1 Person/Month | 2 People/Month | Family of 4/Month |
|-----------|---------------|----------------|-------------------|
| Thrifty | $250-300 | $450-550 | $700-900 |
| Low-cost | $300-375 | $550-700 | $900-1100 |
| Moderate | $375-475 | $700-850 | $1100-1400 |
| Liberal | $475-600 | $850-1100 | $1400-1700 |

### Budget Allocation by Category

```
GROCERY BUDGET BREAKDOWN
===========================
Total weekly budget: $___

Recommended allocation:
  Proteins (meat, fish, beans, tofu):   30%  = $___
  Produce (fruits and vegetables):      25%  = $___
  Dairy and eggs:                       15%  = $___
  Grains and starches:                  10%  = $___
  Pantry staples and condiments:        10%  = $___
  Snacks and beverages:                 10%  = $___

Actual allocation (track for 2 weeks):
  Proteins:     $___  ( ___ %)
  Produce:      $___  ( ___ %)
  Dairy/eggs:   $___  ( ___ %)
  Grains:       $___  ( ___ %)
  Pantry:       $___  ( ___ %)
  Snacks/bev:   $___  ( ___ %)

Where to adjust: _______________________________________________
```

### Top 20 Budget-Saving Strategies

1. **Always shop with a list** - Reduces impulse buying by 40-60%
2. **Never shop hungry** - Eat before you go; hungry shoppers buy more
3. **Shop the perimeter first** - Fresh basics before processed center aisles
4. **Check unit prices** - Not total price; compare cost per ounce/pound
5. **Buy store brands** - Average 25-30% cheaper, often same manufacturer
6. **Buy in bulk wisely** - Only for items you actually use regularly
7. **Plan meals around sales** - Check weekly flyers before meal planning
8. **Use the dirty dozen/clean fifteen** - Prioritize organic where it matters
9. **Buy whole, not pre-cut** - Whole chicken, uncut vegetables cost less
10. **Use frozen produce** - Often cheaper, just as nutritious, lasts longer
11. **Reduce meat frequency** - 2-3 meatless dinners per week saves significantly
12. **Cook from scratch** - Convenience premiums can be 200-500%
13. **Buy seasonal produce** - In-season costs 30-50% less
14. **Join loyalty programs** - Free; accumulates meaningful savings over time
15. **Try discount grocers** - Aldi, Lidl, etc. save 30-40% on staples
16. **Buy day-old bread** - Half price, freeze immediately
17. **Use cashback apps** - Ibotta, Checkout 51, Fetch Rewards
18. **Compare stores strategically** - Some stores are cheaper for specific categories
19. **Avoid checkout aisle items** - Placed there for impulse purchasing
20. **Track spending weekly** - What gets measured gets managed

## Aisle-Organized Shopping Lists

### Master Shopping List Template

```
ORGANIZED SHOPPING LIST
=========================
Date: ___________  Budget: $___

--- PRODUCE SECTION ---
Fruits:
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___

Vegetables:
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___

Fresh Herbs:
  [ ] _______________  qty: ___  est: $___

--- MEAT / SEAFOOD / DELI ---
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___

--- DAIRY / EGGS ---
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___

--- BREAD / BAKERY ---
  [ ] _______________  qty: ___  est: $___

--- CANNED / JARRED ---
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___

--- DRY GOODS / PASTA / RICE ---
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___

--- FROZEN ---
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___

--- CONDIMENTS / SAUCES ---
  [ ] _______________  qty: ___  est: $___

--- SNACKS / BEVERAGES ---
  [ ] _______________  qty: ___  est: $___
  [ ] _______________  qty: ___  est: $___

--- HOUSEHOLD / OTHER ---
  [ ] _______________  qty: ___  est: $___

RUNNING TOTAL: $___
BUDGET REMAINING: $___
```

## Unit Price Comparison

### How to Calculate Unit Price

```
UNIT PRICE FORMULA
====================
Unit Price = Total Price / Total Quantity

Example:
  Brand A: 16 oz jar for $3.49 -> $3.49 / 16 = $0.218/oz
  Brand B: 24 oz jar for $4.79 -> $4.79 / 24 = $0.200/oz
  WINNER: Brand B is cheaper per ounce despite higher total price

COMPARISON WORKSHEET:
Product: _______________

Option A: _______________
  Price: $___ / Size: ___ = $___ per ___

Option B: _______________
  Price: $___ / Size: ___ = $___ per ___

Option C: _______________
  Price: $___ / Size: ___ = $___ per ___

Best value: Option ___ (saves $___ compared to worst option)
```

### Common Unit Price Traps
- **Bigger is not always cheaper** - Always check; sometimes medium is the best deal
- **Sale price vs unit price** - A sale item may still cost more per unit than store brand
- **Multi-packs** - Calculate per-unit cost; sometimes singles are actually cheaper
- **Family size** - Often a good deal, but verify with unit price
- **Fancy packaging** - You are paying for the box, not the food inside

## Seasonal Produce Guide

### Best Buys by Season

```
SPRING (March - May)
=====================
Best prices: Asparagus, artichokes, peas, spinach, strawberries,
  radishes, green onions, lettuce, rhubarb

SUMMER (June - August)
=======================
Best prices: Tomatoes, corn, zucchini, squash, peppers, berries
  (all types), peaches, watermelon, cucumbers, green beans,
  eggplant, fresh herbs

FALL (September - November)
============================
Best prices: Apples, pears, winter squash (butternut, acorn),
  sweet potatoes, Brussels sprouts, broccoli, cauliflower,
  pumpkin, cranberries, grapes

WINTER (December - February)
=============================
Best prices: Citrus (oranges, grapefruit, lemons, clementines),
  root vegetables (carrots, turnips, parsnips, beets),
  cabbage, kale, potatoes, onions, celery
```

### Dirty Dozen and Clean Fifteen (EWG Guidelines)

**Dirty Dozen (highest pesticide residue - consider buying organic):**
Strawberries, Spinach, Kale/collard/mustard greens, Peaches, Pears, Nectarines, Apples, Grapes, Bell and hot peppers, Cherries, Blueberries, Green beans

**Clean Fifteen (lowest pesticide residue - conventional is fine):**
Avocados, Sweet corn, Pineapple, Onions, Papaya, Sweet peas (frozen), Asparagus, Honeydew melon, Kiwi, Cabbage, Mushrooms, Mangoes, Sweet potatoes, Watermelon, Carrots

## Bulk Buying Analysis

### When Bulk Buying Makes Sense

```
BULK BUYING DECISION MATRIX
==============================
Ask these questions before buying in bulk:

1. Do I use this product regularly?       [ ] Yes -> Proceed
                                          [ ] No  -> Skip

2. Will I use it before it expires?       [ ] Yes -> Proceed
                                          [ ] No  -> Skip

3. Do I have storage space?               [ ] Yes -> Proceed
                                          [ ] No  -> Skip

4. Is the unit price actually lower?      [ ] Yes -> Proceed
                                          [ ] No  -> Skip

5. Can I afford the upfront cost?         [ ] Yes -> Buy
                                          [ ] No  -> Wait for sale

All Yes = Buy in bulk
Any No = Regular size is better
```

### Best and Worst Items to Buy in Bulk

| Always Buy in Bulk | Sometimes Bulk | Never Bulk |
|-------------------|----------------|------------|
| Rice, dry pasta | Canned goods | Fresh produce (unless freezing) |
| Dried beans, lentils | Cooking oils | Dairy (unless freezing) |
| Flour, sugar | Nuts and seeds | Specialty spices you rarely use |
| Oats | Paper products | New products you have not tried |
| Frozen vegetables | Cleaning supplies | Items near expiration |
| Coffee | Condiments | Snack foods (temptation factor) |
| Chicken (portion and freeze) | Toiletries | |
| Ground meat (portion and freeze) | | |

## Store Brand vs Name Brand

### General Guidance

| Category | Store Brand Quality | Typical Savings |
|----------|-------------------|---------|
| Staples (flour, sugar, salt, rice) | Identical | 20-40% |
| Canned goods (beans, tomatoes) | Very similar | 25-35% |
| Dairy (milk, butter, cheese, eggs) | Identical or very similar | 15-25% |
| Frozen vegetables | Usually identical | 30-40% |
| Cereal and snacks | Quality varies | 20-30% |
| Cleaning products | Usually effective | 30-50% |
| Condiments (ketchup, mustard) | Taste may vary | 20-30% |
| Baby products (diapers, formula) | Comparable quality | 25-40% |
| OTC medications | Identical active ingredients (by law) | 30-60% |

### Store Brand Annual Savings Estimate

```
STORE BRAND SAVINGS CALCULATOR
=================================
If you spend $___ per week on groceries
and switch 50% of purchases to store brand
at an average 25% savings:

Weekly savings: $___ x 0.50 x 0.25 = $___
Annual savings: $___ x 52 = $___

Example: $200/week x 0.50 x 0.25 = $25/week = $1,300/year
```

## Pantry Staples Checklist

### Essential Pantry (stock these always)

```
PANTRY STAPLES MASTER LIST
=============================

OILS AND VINEGARS:
  [ ] Extra virgin olive oil
  [ ] Neutral cooking oil (vegetable, canola, or avocado)
  [ ] Red wine vinegar or apple cider vinegar
  [ ] Soy sauce (or tamari for GF)

CANNED AND JARRED:
  [ ] Canned diced tomatoes (2-3 cans)
  [ ] Tomato paste
  [ ] Canned beans (black, chickpea, kidney - 3-4 cans)
  [ ] Chicken or vegetable broth/stock
  [ ] Coconut milk (1 can)

DRY GOODS:
  [ ] Rice (white and/or brown)
  [ ] Pasta (2 shapes)
  [ ] Dried lentils
  [ ] Oats (rolled)
  [ ] All-purpose flour
  [ ] Sugar (white and brown)

SPICES AND SEASONINGS:
  [ ] Salt (kosher or table)
  [ ] Black pepper
  [ ] Garlic powder
  [ ] Onion powder
  [ ] Cumin
  [ ] Chili powder or red pepper flakes
  [ ] Italian seasoning or oregano
  [ ] Paprika (sweet and/or smoked)
  [ ] Cinnamon
  [ ] Bay leaves

CONDIMENTS:
  [ ] Mustard (Dijon and/or yellow)
  [ ] Hot sauce
  [ ] Honey or maple syrup
  [ ] Peanut butter (or alternative)

REFRIGERATOR STAPLES:
  [ ] Butter   [ ] Eggs   [ ] Milk
  [ ] Lemons   [ ] Garlic [ ] Onions

FREEZER STAPLES:
  [ ] Frozen vegetables (peas, broccoli, spinach, mixed)
  [ ] Frozen fruit (berries)
  [ ] Bread (backup)
  [ ] Portioned proteins
```

## Reducing Food Waste

### The Food Waste Hierarchy

```
BEST -> 1. PREVENT: Buy only what you will use (meal planning)
     -> 2. USE IT UP: Cook what is about to expire first
     -> 3. REPURPOSE: Turn scraps into stock, stale bread into croutons
     -> 4. PRESERVE: Freeze, pickle, dehydrate before it goes bad
     -> 5. COMPOST: Return nutrients to soil
WORST -> 6. LANDFILL: Last resort
```

### Use-It-Up Strategies

| Item About to Expire | What to Do |
|----------------------|-----------|
| Overripe bananas | Banana bread, smoothies, freeze for later |
| Wilting greens | Saute with garlic, add to soup, blend into smoothie |
| Stale bread | Croutons, breadcrumbs, French toast, bread pudding |
| Soft tomatoes | Cook into sauce, roast, add to soup |
| Bendy carrots/celery | Soup, stock, stew (flavor is fine) |
| Leftover herbs | Herb butter (freeze), herb oil, dry them |
| Yogurt near date | Smoothie, marinade, baking |
| Overripe avocado | Guacamole, freeze mashed for later |
| Leftover rice | Fried rice, rice pudding, stuffed peppers |

### FIFO System (First In, First Out)

```
FIFO IN YOUR KITCHEN
======================
When unpacking groceries:
  1. Pull OLD items to the FRONT of fridge/pantry
  2. Place NEW items in the BACK
  3. Always use from the FRONT first

Weekly fridge check (5 minutes):
  [ ] What needs to be used in the next 2 days?
  [ ] Move those items to an "EAT FIRST" zone
  [ ] Plan meals around those items
  [ ] Freeze anything that will not be used in time
```

## Shopping Trip Efficiency

### Optimal Shopping Route

```
EFFICIENT SHOPPING PATH
=========================
1. Start: Produce section (fruits, vegetables, herbs)
2. Move to: Bakery / bread
3. Next: Deli / prepared foods
4. Then: Meat and seafood
5. Continue: Dairy and eggs
6. Interior aisles: Dry goods, canned, condiments
7. Frozen section: Last (keeps items cold longest)
8. Checkout

TOTAL TIME TARGET: ___ minutes
(An organized list can cut shopping time by 30-50%)
```

### Price Tracking Worksheet

```
PRICE TRACKING (track 10-20 items you buy regularly)
=====================================================
Item           | Store A | Store B | Store C | Best
_______________|_________|_________|_________|______
               |         |         |         |
               |         |         |         |
               |         |         |         |
               |         |         |         |
               |         |         |         |

Track for 4 weeks to identify where to buy each item.
Many people save 15-20% by buying different categories
at different stores.
```


## Output Format

```
GROCERY OPTIMIZER OUTPUT
========================

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

**Input:** "Help me get started with grocery optimizer"

**Output:** A structured grocery optimizer plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
