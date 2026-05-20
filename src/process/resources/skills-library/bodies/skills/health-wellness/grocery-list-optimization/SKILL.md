---
name: grocery-list-optimization
description: |
  Builds organized grocery lists optimized by store section, budget strategies, waste reduction techniques, and pantry staple management. Produces a categorized shopping list with quantity estimates, budget-saving notes, and a pantry checklist system.
  Use when the user asks about organizing a grocery list, reducing grocery spending, minimizing food waste through smarter shopping, or building a pantry staples inventory.
  Do NOT use for meal planning (use meal-planning-framework), macro calculations (use macro-calculation), or specific recipe ingredients.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "nutrition meal-planning checklist"
  category: "health-wellness"
  subcategory: "nutrition-diet"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Grocery List Optimization

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- The user wants their grocery shopping reorganized by physical store section to reduce backtracking, shopping time, and impulse purchases
- The user asks how to cut their grocery bill without reducing nutrition quality or meal variety -- they want specific tactics, not generic advice
- The user wants to eliminate or significantly reduce food waste and needs a system for buying only what they will actually use
- The user wants to build or audit a pantry staples inventory so they stop re-buying items they already have and always have base ingredients available
- The user wants grocery quantity estimates calibrated to a specific household size, meal count, and shopping interval
- The user is shopping for a specific number of days, a household composition change (adding a roommate, child leaving for college), or a specific event window
- The user mentions they keep throwing food away, running out of key staples mid-week, or spending more than expected at the store

**Do NOT use when:**
- The user wants a full weekly or monthly meal plan with breakfast, lunch, and dinner mapped out -- use `meal-planning-framework` instead, which generates the meal schedule, then optionally feed those meals into this skill
- The user needs macro totals, caloric targets, or protein-per-meal calculations -- use `macro-calculation` and optionally pass results here for quantity scaling
- The user is asking how to cook specific recipes or wants cooking technique guidance -- refer to cooking-specific skills
- The user has a medically supervised dietary restriction (dialysis diet, phenylketonuria, post-surgical nutrition) -- these require registered dietitian oversight, not shopping logistics
- The user is asking for product recommendations or brand comparisons -- this skill does not recommend brands
- The user wants a restaurant or meal kit delivery comparison -- this skill is focused on in-store grocery shopping and pantry management

---

## Process

### Step 1: Gather Shopping Context with Precision

Before generating any list, collect specific inputs. Missing inputs produce low-quality output.

- **Household size and composition:** Number of adults vs. children matters because children aged 2-12 consume roughly 50-75% of adult portions for proteins and grains. Teenagers often eat adult portions or more.
- **Meal count and type:** Ask how many breakfasts, lunches, and dinners are being planned. Confirm which meals will be eaten at home vs. work, school, or restaurants. A household of 2 that eats lunch out every weekday needs groceries for only 5 lunches, not 14.
- **Budget level and any hard dollar ceiling:** "Tight" means roughly under 75 dollars per week for 2 adults. "Moderate" is 75-150 dollars. "Flexible" is 150+ dollars. If the user gives a specific dollar number, use that as a hard constraint.
- **Shopping frequency:** Weekly (7-day supply) vs. bi-weekly (14-day supply) changes which items are viable. Buying 14 days of fresh leafy greens at once is not viable. Bi-weekly shoppers need more frozen and shelf-stable volume.
- **Storage constraints:** Ask about freezer size (no freezer, apartment freezer drawer, full upright or chest freezer), fridge size, and dry pantry space. Storage constraints change which budget strategies are available -- bulk buying is useless without storage.
- **Dietary preferences and restrictions:** Avoid assuming. Ask explicitly about meat, seafood, eggs, dairy, gluten, and any strong preferences. Do not conflate "I prefer less meat" with a prescribed diet.
- **How many pantry staples are already stocked:** A well-stocked pantry means the list focuses on proteins and produce. An empty kitchen means restocking costs must be factored in.

### Step 2: Conduct a Pantry Audit Before Building the List

A grocery list built without a pantry audit leads to duplicate purchasing and budget waste. Guide the user through a structured pantry review.

- Organize pantry audit into three zones: dry goods shelf, refrigerator, and freezer. Each zone has different staleness risks.
- For dry goods: check rice, pasta, oats, canned goods, oils, vinegars, and spices. Flag anything past its best-by date by more than 6 months as a restock priority.
- For refrigerator: identify proteins within 2 days of expiration that must be used or frozen immediately. These items should anchor the first 1-2 meals planned.
- For freezer: inventory proteins and vegetables already frozen. These reduce the protein and frozen produce budget for this trip.
- Use the restock threshold system: restock oils when below 1/4 bottle, spices when the container feels less than 1/4 full by weight, canned goods when below 2 units of a regularly used item, grains when below 2 cups dry weight.
- Create two sub-lists from the audit: "Must restock" (below threshold, needed this week) and "Do not buy" (already stocked in adequate quantity).

### Step 3: Build the Category-Organized List by Store Section

Grocery stores are laid out in a predictable pattern in most layouts: produce at the entry, proteins along the back perimeter, dairy along the back or side perimeter, frozen in interior aisles, dry goods in interior aisles. Organizing the list by this physical flow reduces shopping time and impulse purchases from backtracking.

**Standard section order for list organization:**
1. Produce (fresh)
2. Proteins (meat, seafood, poultry counter -- back perimeter)
3. Dairy and refrigerated (side or back perimeter)
4. Frozen
5. Grains, pasta, rice (dry goods aisles)
6. Canned goods
7. Oils, vinegars, condiments, sauces
8. Spices and baking
9. Snacks and beverages (only if planned)

- Assign every item to one section. Do not mix sections in the same list block.
- For each fresh produce item, include a storage life note. Leafy greens last 4-5 days. Root vegetables (carrots, beets, parsnips) last 2-3 weeks. Alliums (onions, garlic, shallots) last 3-6 weeks at room temperature. Stone fruits last 3-5 days after ripening. Citrus lasts 1-2 weeks.
- Mark items as "perishable within 5 days" so the user knows to plan those meals first.

### Step 4: Apply Quantity Estimation Using Per-Person-Per-Week Benchmarks

Use these calibrated benchmarks as starting points, then adjust for meals eaten outside the home.

**Per adult, per week (7 days, 3 meals per day at home):**
- Fresh vegetables: 3.5-5 lbs
- Fresh fruit: 2-3 lbs
- Animal protein (meat, poultry, fish): 3.5-4.5 lbs raw weight (raw weight loses 20-30% to cooking)
- Plant protein (dried legumes): 1-2 lbs dry (1 lb dry yields roughly 2.5 lbs cooked)
- Eggs: 6-12 per person
- Whole grains (dry rice, pasta, oats combined): 2-3 lbs
- Dairy (milk): 0.5 gallons; reduce proportionally if the household uses non-dairy alternatives
- Cooking fats: restocked by pantry audit, not weekly purchase

**Adjustment factors:**
- Each meal eaten outside the home reduces protein need by ~0.25-0.35 lbs and vegetable need by ~0.4-0.5 lbs
- Children 2-12: multiply adult quantities by 0.5-0.75
- Teenagers: use full adult quantities for proteins and grains; 0.75 for vegetables and fruits
- Batch cooking planned: reduce per-week vegetable variety but increase per-item quantity

**For proteins specifically:** Calculate by meal slot. If a household of 2 is eating 7 dinners, they need protein for 7 meals. Assume 6 oz cooked per adult per dinner = 12 oz cooked = roughly 16 oz (1 lb) raw per dinner. Seven dinners = approximately 7 lbs raw protein total. Mixed protein sources across the week bring this into budget range.

### Step 5: Apply Budget Optimization Strategies by Tier

Budget strategies should be matched to the user's stated budget level. Do not apply all strategies at every budget level -- this creates friction for users who do not need it.

**Tight budget (under 75 dollars per week for 2 adults):**
- Anchor proteins around eggs (lowest cost per gram of protein at approximately 0.10-0.15 dollars per serving), dried legumes (black beans, lentils, chickpeas cost 0.07-0.15 dollars per serving when cooked from dry), and whole chicken (40-60% cheaper per pound than boneless breast; one 4-5 lb chicken yields 4-6 meal-sized portions when broken down)
- Buy frozen vegetables exclusively over fresh for any cooked application. Frozen peas, broccoli, corn, green beans, and spinach are nutritionally comparable to fresh for cooked dishes (blanching before freezing preserves micronutrients) and cost 30-60% less per pound
- Avoid pre-cut, pre-marinated, or pre-seasoned proteins -- these carry a 20-50% premium for labor that takes 5 minutes at home
- Buy rice and oats in 5-10 lb bags rather than 1-2 lb boxes. The cost-per-ounce difference is typically 40-70% in favor of bulk
- Eliminate specialty sauces and condiments unless they replace a more expensive product. A bottle of soy sauce enables 15-20 meals. A specialty marinade enables 1-2 meals at the same price.
- Use the "cost per meal" metric instead of "cost per item." A 12-dollar rotisserie chicken yields 4 meals, making it 3 dollars per meal -- often cheaper than buying and cooking raw if time is constrained.

**Moderate budget (75-150 dollars per week for 2 adults):**
- Mix fresh and frozen produce. Use fresh produce for raw applications (salads, sliced fruit, crudités) where texture and flavor matter. Use frozen for all cooked applications (soups, stir-fries, roasted dishes, casseroles).
- Buy store-brand versions of all commodity items: canned tomatoes, canned beans, frozen vegetables, rice, pasta, flour, sugar, oats, chicken broth. Quality testing by consumer organizations consistently shows store-brand commodity products are equal to name brands. The savings are typically 20-40% per item.
- Buy proteins in multipack or family-pack sizes and portion and freeze what will not be used within 2 days. A 5-lb bag of chicken thighs is typically 25-35% cheaper per pound than a 1.5-lb tray.
- Check unit price (price per ounce or per lb) not total package price. A 28-oz can of diced tomatoes at 2.50 dollars beats two 14-oz cans at 1.50 dollars each.
- Use seasonal produce pricing. In North America: summer = tomatoes, corn, zucchini, berries, stone fruit; fall = apples, pears, winter squash, sweet potatoes; winter = citrus, root vegetables; spring = asparagus, peas, lettuce. Seasonal produce is typically 30-60% cheaper and higher quality than off-season produce.

**Flexible budget (150+ dollars per week for 2 adults):**
- Budget optimization is less critical. Focus on waste reduction and variety over cost cutting.
- Prioritize fresh, high-quality proteins and a wider produce variety.
- Still apply pantry audit and FIFO to prevent spoilage regardless of budget level.

### Step 6: Assign Waste Reduction Measures to Each Perishable Item

Food waste is the #1 hidden cost in grocery budgets. The average household wastes 30-40% of purchased food by weight. Reducing this to under 5% is achievable with a structured system.

**The consumption timeline method:** For every fresh item on the list, assign a "use by" day based on the shopping date and the item's storage life. Plan meals that use the shortest-shelf-life items earliest in the week.

**Shortest-shelf-life fresh items (use within 1-3 days of purchase):**
- Fresh fish and shellfish: use on day 1 or day 2 maximum; never purchase unless planning to cook within 48 hours
- Fresh berries: 2-3 days; freeze any excess immediately after purchase to prevent mold
- Fresh herbs (basil, cilantro, parsley): 3-5 days in water in the fridge like a bouquet; or wash, dry, chop, freeze in ice cube trays with olive oil

**Short-shelf-life items (use within 4-6 days):**
- Leafy greens, baby spinach, arugula: 4-5 days after opening
- Fresh mushrooms: 4-6 days
- Ground meat: cook or freeze within 2 days of purchase; never leave ground beef at refrigerator temperature for more than 2 days
- Fresh-cut melon: 4-5 days

**FIFO (First In, First Out) system:** When restocking shelves and fridge, move older items to the front. New items go to the back. This applies to every zone: canned goods, refrigerator shelves, and freezer drawers. The single most effective waste reduction habit.

**The wilting vegetable rescue rule:** Slightly wilted but not slimy vegetables are still safe and nutritious. Wilted broccoli, soft bell peppers, and limp greens are ideal for soups, stir-fries, omelets, and sauces where texture is cooked away. Keep a "use first" container at the front of the fridge for any produce approaching the end of shelf life.

**The freezer is not a graveyard:** Many items can be frozen before they go bad if the freezer is used proactively. Bread: freeze at purchase if only half will be used before mold risk. Bananas: peel and freeze when they hit peak ripeness for smoothies. Cheese: most hard and semi-hard cheeses freeze adequately (texture becomes slightly crumbly, ideal for cooked applications). Cooked grains: rice and pasta freeze and reheat well. Batch cook and portion.

### Step 7: Build the Pantry Staples Audit and Restock List

A well-maintained pantry reduces weekly grocery spending by 15-25% because the user already owns the foundational ingredients for most meals.

**Core pantry staples by category:**

*Cooking fats:*
- Neutral oil (vegetable, canola, or avocado) -- for high-heat cooking above 375°F where olive oil degrades
- Olive oil -- for medium heat, finishing, and dressings
- Butter or ghee -- for sautéing, baking, finishing

*Acids and umami builders:*
- White wine vinegar, apple cider vinegar, or rice vinegar
- Soy sauce or tamari (gluten-free equivalent)
- Worcestershire sauce
- Canned diced tomatoes and tomato paste

*Dry proteins and legumes:*
- Dried lentils (fastest cooking -- no soaking required, ready in 20-25 minutes)
- Canned chickpeas, black beans, kidney beans (2-3 varieties, minimum 2 cans each)
- Canned tuna or salmon (emergency protein, 2-3 year shelf life)

*Grains and starches:*
- Long-grain white rice (faster cooking) or brown rice (higher fiber, 45-minute cook time)
- Dried pasta (multiple shapes -- short shapes for baked and saucy dishes, long shapes for simple sauces)
- Rolled oats
- Breadcrumbs (panko or regular) -- doubles as a coating and a topping

*Aromatics (semi-pantry):*
- Onions -- store at room temperature, not in the refrigerator
- Garlic -- store at room temperature, lasts 3-6 weeks
- Dried spices: salt, black pepper, cumin, paprika (sweet and smoked), garlic powder, onion powder, dried oregano, chili powder, red pepper flakes, bay leaves

*Baking basics (if the household bakes at all):*
- All-purpose flour
- Baking powder and baking soda
- Granulated sugar
- Vanilla extract

**Pantry audit restock thresholds:**

| Staple | Restock threshold | Notes |
|--------|-------------------|-------|
| Olive oil | Below 1/4 bottle | Buy 1 liter bottles for 30-40% cost saving vs. small bottles |
| Neutral oil | Below 1/4 bottle | High smoke point oils degrade with heat exposure; store away from stove |
| Soy sauce | Below 1/4 bottle | Check sodium level -- low-sodium is nearly identical in flavor |
| Canned diced tomatoes | Below 2 cans | 28-oz cans are typically cheaper per ounce than 14-oz cans |
| Canned beans | Below 2 cans per type | Keep 3 types minimum for variety |
| Rice | Below 2 cups dry | Buy in 5-lb or 10-lb bags for cost efficiency |
| Pasta | Below 1 lb | Keep 2 shapes on hand |
| Oats | Below 2 cups dry | Rolled oats work for both cooking and baking |
| Cumin, paprika | Feel less than 1/4 full | Spices lose potency after 12-18 months; replace if older |
| Salt | Below 1/4 container | Never run out; stock aggressively |
| Chicken or veg broth | Below 1 carton | Buy low-sodium to control seasoning |

---

## Output Format

```
## Optimized Grocery List: [X] Adults, [X] Children -- [X] Days, [Meal Count by Type]

**Budget level:** [Tight / Moderate / Flexible] [or: Dollar target: $___]
**Shopping frequency:** [Weekly / Bi-weekly / X-day cycle]
**Dietary notes:** [Any restrictions or preferences]
**Storage notes:** [Any constraints affecting strategy]

---

### Pre-Shopping Pantry Audit

Check before leaving home:

| Item | Have it? | Restock needed? |
|------|----------|-----------------|
| [Pantry item 1] | [ ] | Only if below threshold |
| [Pantry item 2] | [ ] | Only if below threshold |
| [Continue for relevant staples] | | |

**Audit summary:** [X] items to restock from pantry, [X] items confirmed stocked.

---

### Shopping List by Store Section

**[1] Produce -- Fresh**
*(Plan meals using these items in this order: shortest shelf life first)*

- [ ] [Item] -- [quantity] -- shelf life: [X days] -- for: [meal or day]
- [ ] [Item] -- [quantity] -- shelf life: [X days] -- for: [meal or day]
- [ ] [Item] -- [quantity] -- shelf life: [2+ weeks, flexible]

**[2] Proteins -- Meat / Seafood / Poultry Counter**
*(Buy fresh; freeze immediately any portion not used within 2 days)*

- [ ] [Item] -- [quantity] -- [raw weight note] -- [batch/meal plan]
- [ ] [Item] -- [quantity] -- [storage instruction]

**[3] Dairy and Refrigerated**

- [ ] [Item] -- [size] -- check expiration; buy only what will be consumed before [date]
- [ ] [Item] -- [size]

**[4] Frozen**

- [ ] [Item] -- [quantity] -- [use: cooked dishes, replaces fresh for budget saving]
- [ ] [Item] -- [quantity]

**[5] Grains, Pasta, Rice**

- [ ] [Item] -- [quantity] -- [note: buy large format if low unit price justifies]

**[6] Canned Goods**

- [ ] [Item] -- [quantity] -- [size recommendation]

**[7] Oils, Vinegars, Condiments**
*(Only if below pantry threshold -- do not duplicate)*

- [ ] [Item] -- [size] -- restock only

**[8] Spices and Baking**
*(Only if below pantry threshold)*

- [ ] [Item] -- restock only

**[9] Snacks and Beverages**
*(Planned items only -- no unplanned additions)*

- [ ] [Item] -- [quantity]

---

### Waste Reduction Timeline

| Item | Use by | If approaching end of shelf life |
|------|--------|----------------------------------|
| [Perishable item 1] | [Day] | [Alternative use: soup, stir-fry, freeze] |
| [Perishable item 2] | [Day] | [Alternative use] |
| [Perishable item 3] | [Day] | Freeze before this date |

**FIFO Reminder:** Move existing fridge and pantry items to the front before restocking new purchases.

---

### Budget Notes

- [Specific substitution or strategy for this particular list]
- [Second specific tip tied to items on this list]
- [Third specific tip if applicable]
- **Cost-per-meal target:** [X meals total] meals across the shopping period
- **Estimated weekly grocery cost range:** [Low estimate] to [High estimate] (varies by region, store format, and sale availability)

---

### Quantity Check

| Category | Target per week (this household) | List total | Match? |
|----------|----------------------------------|------------|--------|
| Vegetables (fresh + frozen) | [X lbs] | [X lbs] | [✓ / Review] |
| Protein (raw weight) | [X lbs] | [X lbs] | [✓ / Review] |
| Grains (dry weight) | [X lbs] | [X lbs] | [✓ / Review] |
| Fruit | [X lbs] | [X lbs] | [✓ / Review] |
```

---

## Rules

1. **Always organize the list by physical store section, not by meal, day, or recipe.** A meal-organized list causes the shopper to traverse the store multiple times and increases impulse buying. The section-ordered format reduces average shopping time by 15-25 minutes and correlates with lower total spend.

2. **Always conduct a pantry audit step before finalizing the list.** A grocery list built without pantry review will produce duplicates. Duplicates are budget waste and, for oils and spices, quality waste (rancidity). If the user has not audited their pantry, prompt them to do so or ask them to confirm what key staples they already have.

3. **Never recommend specific brands.** Provide generic, descriptive item names (e.g., "canned diced tomatoes, 28 oz" not "brand X canned tomatoes"). The exception is category-level descriptors that affect cooking results: "panko breadcrumbs" vs. "fine breadcrumbs" is a legitimate specification; a brand name is not.

4. **Always include raw weight when listing proteins.** Cooked weight is approximately 70-80% of raw weight for most proteins. A shopper who plans to serve 6 oz cooked per person needs to buy approximately 8 oz raw per person. Failing to account for this leads to under-buying.

5. **Never assume the household has a well-stocked pantry unless the user confirms it.** A first-time or recently moved household needs 40-80 dollars in pantry foundation items before the weekly shopping list even starts. Flag this cost separately so it does not look like the weekly list is unusually expensive.

6. **Budget tips must be specific and quantified, not motivational.** "Buy cheaper cuts" is not acceptable. "Chicken thighs are typically 30-45% cheaper per pound than boneless, skinless chicken breast and remain moister during braising, roasting, and slow cooking" is acceptable. The user needs data, not encouragement.

7. **Always assign a use-by day to every fresh protein and every fresh produce item with a shelf life under 6 days.** This is the mechanism by which the list reduces waste. Without use-by assignments, the list is just a shopping list. With them, it is a waste-reduction system.

8. **Match frozen vs. fresh produce recommendation to the actual application.** Frozen is appropriate for cooked dishes (soups, stir-fries, roasted, casseroles, smoothies). Fresh is appropriate for raw applications (salads, crudités, fresh garnishes, fruit eaten out of hand). Never recommend frozen produce for salad applications.

9. **Scale all quantities explicitly to the household.** If the user has 2 adults and 2 children (ages 7 and 9), that is approximately 3 adult-equivalent portions, not 4. Overbuying perishables to match "4 people" for a household with young children is a waste driver. Apply the 0.5-0.75 multiplier for children explicitly in the quantity notes.

10. **If the user's stated budget conflicts with their stated meal and household requirements, flag the conflict clearly before generating the list.** A tight budget (under 75 dollars for 2 adults per week) combined with a 7-dinner, 7-lunch, 7-breakfast at-home plan is achievable but requires specific protein choices (eggs, legumes, one whole chicken). Do not silently produce an aspirational list that cannot be executed within the stated budget. State the constraint, offer the adjustment, and get confirmation before proceeding.

---

## Edge Cases

### Very Tight Budget (Under 50 Dollars Per Week for 2 Adults)

This is achievable but requires specific structural choices. The protein strategy must be eggs + dried legumes + one economical whole protein.

- Build the protein base around: eggs (12-18 per week, cost roughly 3-5 dollars), dried lentils (1 lb dry = 4-5 cups cooked, cost roughly 1.50-2.00 dollars), canned beans (3-4 cans at 0.75-1.25 dollars each), and one whole chicken (4-5 lbs, 7-10 dollars), which yields 4-6 meal portions.
- Eliminate all convenience premiums: pre-cut vegetables, pre-marinated proteins, individual-serve portions, bottled salad dressings (make vinaigrette from pantry oil and vinegar at under 0.10 dollars per serving vs. 0.40-0.80 dollars per serving for bottled).
- Buy exclusively frozen vegetables. At this budget level, fresh produce is only justified for items that will be eaten raw (carrots, apples, bananas, cabbage) where frozen is not an equivalent substitute.
- Estimate cost-per-meal explicitly in the output. At this budget, target 1.50-2.50 dollars per meal per person.
- Flag that pantry foundation items (oil, spices, condiments) may represent a one-time 25-40 dollar investment that is separate from the weekly grocery spend. If this is the user's first time shopping under this budget with an empty pantry, the first week will be more expensive than ongoing weeks.

### Single-Person Household

Single-person households have the highest food waste rate of any household type because most packaging is sized for 2-4 servings and produce is sold in quantities larger than one person can consume before spoilage.

- Adjust all quantity benchmarks to single-adult levels, then apply the waste-reduction offsets. For example, a standard bunch of celery is 1.5-2 lbs. One adult uses roughly 4-6 stalks per week. Recommend buying pre-cut celery sticks from the salad bar section (by weight), which eliminates the oversupply problem, even though the per-pound cost is higher.
- Recommend freezing strategies aggressively. A loaf of bread: freeze half on purchase day. A bag of spinach: use half fresh this week, blanch and freeze the rest before day 4. Ground beef in a 1 lb package: cook all of it on purchase day, portion into two servings, refrigerate one and freeze one.
- Emphasize batch-cook-and-portion meals: cooking one large pot of soup, chili, or grain-based dish and portioning it into individual servings (freeze after day 3) converts a large purchase into multiple future meals without waste.
- For proteins, recommend canned fish (tuna, salmon, sardines) as reliable single-serving portions that carry no spoilage risk.

### Bi-Weekly or Monthly Shopping Frequency

Users who shop every 2 weeks or once a month face a fundamentally different planning challenge. Fresh produce cannot span 14+ days at most. The list structure changes significantly.

- **Week 1 produce:** Fresh produce, all perishables. Plan meals using short-shelf-life items in days 1-5.
- **Week 2 produce:** Frozen vegetables and fruits for all cooked applications. Long-lasting fresh items only (cabbage, carrots, beets, onions, garlic, citrus, apples, potatoes, winter squash).
- Double the pantry staple quantities: buy 2x canned goods, 2x grains, 2x proteins that can be frozen (whole chickens, ground beef portioned and frozen, fish frozen on purchase day).
- Frozen proteins become the backbone of week 2 meals. Build the second week's meal plan around thaw-and-cook logic.
- Flag that bi-weekly shopping only saves time and money if the user has a large enough freezer and pantry to store 14 days of food. If not, bi-weekly shopping with insufficient storage leads to fresh food waste offsetting any convenience benefit.

### User Has No Planned Meals (Blank-Slate Shopping)

Some users do not meal plan. They want flexible groceries that can become many different meals depending on what they feel like cooking. This requires a different list architecture.

- Use the "versatile ingredient matrix" approach: buy ingredients with high meal-combination potential rather than specific recipe ingredients.
- **Versatile proteins:** Chicken thighs (braise, roast, stir-fry, soup, tacos, rice bowls), eggs (omelets, fried rice, frittata, grain bowls, sandwiches), canned beans (bowls, soups, tacos, salads), one piece of salmon or cod (pan-sear or bake).
- **Versatile vegetables:** Onions, garlic, broccoli or green beans, bell peppers, spinach or kale, one starch vegetable (sweet potato or potato). These 5-7 vegetables combine into the majority of weeknight cooking formats.
- **Versatile starches:** Rice, pasta (two shapes), tortillas (12-count pack).
- **Versatile flavor bases:** One jar of tomato sauce, one bottle of soy sauce, one can of coconut milk, one can of diced tomatoes. These four items unlock Italian, Asian, Thai, and Tex-Mex flavor profiles from the same underlying proteins and vegetables.
- Present this approach transparently to the user: "Since you do not have specific meals planned, this list is built around high-versatility ingredients. Every item on this list works across at least 4-5 different meal types."

### User Plans to Shop at Multiple Store Types

Some users split shopping between a warehouse club (Costco, Sam's Club), a conventional grocery store, and possibly a farmers market. Multi-store shopping can save 15-25% but only if the overhead cost (time, transportation, membership fees) is lower than the savings.

- Generate a store-segmented list with a fourth column indicating which store type is recommended for each category.
- **Warehouse club items:** Highest value for non-perishable staples and items with long freezer life -- olive oil, canned goods, frozen vegetables, frozen proteins in multi-packs, nuts, cheese (freeze what you will not use in 2 weeks), dried pasta, paper goods. Poor value for fresh produce (often too large a quantity for non-bulk households) and fresh bread (shelf life too short).
- **Farmers market items:** Seasonal produce, eggs, artisan bread (day-of consumption). Quality premium is often justified. Cost premium is not always lower than conventional grocery for equivalent items -- do not assume farmers market means cheaper.
- **Conventional grocery store:** Fresh proteins in specific quantities (not warehouse multi-pack when the household cannot freeze the excess), specialty items, smaller-quantity produce when bulk is wasteful.
- Add a column to the list: "Store" -- and populate it with one of three designations: [Warehouse], [Farmers Market], [Grocery]. Make it scannable as a pick list for each location.

### User with Inconsistent Schedule (Unpredictable Meals at Home)

A household where 1-2 people travel for work, have irregular work schedules, or frequently change plans has a high waste risk from over-buying perishables.

- Apply a "conservative buy" multiplier of 0.7 to all fresh perishable quantities. Buy 70% of what the full household would use if everyone were home for all planned meals.
- Prioritize proteins that can be used OR frozen on short notice: fish that can be cooked from frozen, chicken thighs that freeze and thaw well, eggs that last 4-5 weeks refrigerated.
- Emphasize frozen vegetable over fresh for all cooked applications. If a person unexpectedly eats out, the frozen broccoli does not expire. The fresh broccoli becomes waste.
- Recommend building a "default dinner" pantry -- ingredients that can produce a complete meal with zero fresh ingredients on a night when plans change: pasta + canned tomatoes + canned olives + canned tuna + pantry herbs = a complete dinner with zero spoilage risk.

---

## Example

**Input:** "Can you make me a grocery list for 2 adults for a week? We want to spend around 100 dollars. No dietary restrictions. We eat dinner at home every night and lunch on weekdays is at work, so just the 7 dinners plus breakfasts and weekend lunches."

**Output:**

## Optimized Grocery List: 2 Adults -- 7 Days

**Budget target:** 95-105 dollars
**Meals planned:** 7 dinners, 7 breakfasts, 4 weekend lunches (Friday dinner through Sunday)
**Meals NOT planned:** 10 weekday lunches (eaten at work -- excluded from list)
**Shopping frequency:** Weekly
**Dietary notes:** None
**Storage notes:** Assumed standard apartment fridge + freezer drawer

---

### Pre-Shopping Pantry Audit

Check these before leaving. Only restock what is below threshold.

| Item | Check | Restock if below threshold |
|------|-------|---------------------------|
| Olive oil | [ ] | 1/4 bottle (250 ml) |
| Neutral cooking oil | [ ] | 1/4 bottle |
| Soy sauce | [ ] | 1/4 bottle |
| Rice | [ ] | 2 cups dry |
| Pasta | [ ] | 1 lb |
| Canned diced tomatoes | [ ] | 2 cans |
| Canned beans (any type) | [ ] | 2 cans |
| Garlic | [ ] | 4 cloves |
| Onions | [ ] | 2 onions |
| Cumin, paprika, chili powder | [ ] | Each less than 1/4 full |
| Salt and pepper | [ ] | Running low in container |
| Chicken or vegetable broth | [ ] | Less than 1 carton |

**Audit summary:** If most of these are stocked, this week's list focuses on proteins, fresh produce, and targeted restocks -- target spend is well within the 100 dollar range. If pantry is largely empty, flag a first-time pantry foundation cost of an additional 35-55 dollars for oils, spices, and canned goods that will last 4-8+ weeks.

---

### Shopping List by Store Section

**[1] Produce -- Fresh**
*(Use in this order: salmon and berries first, then greens, then broccoli and peppers, then tomatoes, then potatoes last)*

- [ ] Baby spinach -- 5 oz bag -- shelf life: 5 days -- for: Wednesday dinner salad + Saturday frittata
- [ ] Broccoli -- 2 medium crowns (about 1.5 lbs) -- shelf life: 5 days -- for: Tuesday stir-fry + Thursday side
- [ ] Bell peppers -- 3 (1 red, 1 yellow, 1 green) -- shelf life: 5-6 days -- for: Tuesday stir-fry + Friday fajitas
- [ ] Cherry tomatoes -- 1 pint -- shelf life: 4-5 days -- for: Wednesday pasta + Saturday lunch
- [ ] Potatoes, Yukon gold -- 2 lbs -- shelf life: 3 weeks -- for: Monday dinner + Sunday lunch hash
- [ ] Onions -- 3 medium -- shelf life: 3+ weeks, store at room temperature -- for: multiple meals
- [ ] Garlic -- 1 head -- shelf life: 4+ weeks, store at room temperature -- for: multiple meals
- [ ] Bananas -- 4-5 (buy slightly green so they peak mid-week) -- for: weekday breakfasts; freeze any that over-ripen
- [ ] Lemons -- 2 -- for: salmon on Monday + dressing on Wednesday

**[2] Proteins -- Meat / Seafood / Poultry Counter**
*(Freeze chicken immediately after purchase; cook salmon Monday)*

- [ ] Chicken thighs, bone-in skin-on -- 4 lbs -- use 2 lbs Monday-Tuesday (batch roast Sunday), freeze 2 lbs for later this week -- approximately 3.50-5.00 dollars per lb
- [ ] Salmon fillets -- 2 (6 oz each, or one 12 oz piece cut by the counter) -- COOK MONDAY or Tuesday; do not store raw beyond 48 hours
- [ ] Ground beef -- 1 lb -- for: Friday dinner fajitas (optional) or Saturday frittata eggs back-up -- freeze half if not used by Thursday
- [ ] Eggs -- 18-count (2 people × 7 breakfasts = 14 eggs + 4 for weekend lunches; 18 count gives buffer) -- shelf life 4-5 weeks refrigerated

**[3] Dairy and Refrigerated**

- [ ] Shredded Mexican-blend cheese -- 8 oz bag -- for: Friday fajitas + Saturday frittata -- check expiration, should be 2+ weeks out
- [ ] Sour cream -- 8 oz container -- for: fajitas; remaining portion lasts 2-3 weeks refrigerated after opening
- [ ] Butter, unsalted -- 1 stick (4 oz) -- for: potatoes and eggs; supplement pantry butter if needed
- [ ] Plain Greek yogurt -- 32 oz container -- for: weekday breakfasts (7 servings at roughly 4-5 oz each); lasts 10-14 days after opening

**[4] Frozen**
*(For all cooked applications -- nutritionally identical to fresh for these uses)*

- [ ] Frozen stir-fry vegetable mix (broccoli, snap peas, carrots, water chestnuts) -- 16 oz bag -- for: Tuesday stir-fry; extends the fresh broccoli or fully replaces it
- [ ] Frozen corn -- 12 oz bag -- for: Friday fajitas and Saturday lunch bowls
- [ ] Frozen edamame (shelled) -- 12 oz bag -- quick protein addition to grain bowls or sides any night

**[5] Grains, Pasta, Rice**

- [ ] Long-grain white rice -- 2 lbs (buy 5-lb bag if pantry is low; it keeps indefinitely) -- for: Tuesday stir-fry + Friday bowls
- [ ] Dried pasta (penne or rigatoni) -- 1 lb -- for: Wednesday cherry tomato pasta; check pantry first
- [ ] Rolled oats -- 2 lbs (buy 2-lb container or bag) -- for: 7 weekday breakfasts (overnight oats or stovetop); 2 lbs provides approximately 10-12 servings

**[6] Canned Goods**
*(Check pantry first -- only buy what is below 2-can threshold)*

- [ ] Canned diced tomatoes -- 2 × 14 oz cans -- for: Wednesday pasta sauce base; or 1 × 28 oz can (lower unit price)
- [ ] Canned black beans -- 2 × 15 oz cans -- for: Friday fajita bowls; leftover serves as fast protein add-in
- [ ] Canned chickpeas -- 1 × 15 oz can -- for: optional Thursday sheet-pan dinner or weekend lunch addition

**[7] Oils, Vinegars, Condiments**
*(Restock only if below pantry threshold -- do not duplicate)*

- [ ] Olive oil -- 1 liter bottle if below threshold -- cost-per-ounce note: 1 liter bottle is typically 30-40% lower cost per ounce than 500 ml or 16 oz bottles
- [ ] Soy sauce or tamari -- 10 oz bottle if below threshold -- for: stir-fry and rice bowls

**[8] Spices and Baking**
*(Restock only -- skip any that are adequately stocked)*

- [ ] Chili powder and cumin -- for: fajitas, beans; restock if less than 1/4 full
- [ ] Smoked paprika -- versatile for chicken, potatoes, eggs; restock if below threshold

**[9] No planned snack or beverage additions this week** (Keeping within 100 dollar target)

---

### Waste Reduction Timeline

| Item | Use by | If approaching end of shelf life |
|------|--------|----------------------------------|
| Salmon fillets | Day 2 (Monday or Tuesday latest) | No flexibility -- cook on purchase day or next morning |
| Baby spinach | Day 5 (Wednesday) | Use remainder in Saturday frittata even if slightly wilted |
| Cherry tomatoes | Day 5 | If softening, roast in a 425°F oven with olive oil for 20 minutes -- become a sauce for pasta or eggs |
| Broccoli crowns | Day 5 | Chop and freeze any remaining florets before Day 6 |
| Bell peppers | Day 6 | Move any unused peppers to the freezer by Friday -- frozen peppers work perfectly in cooked applications |
| Ground beef | Day 3 (Wednesday) or freeze day of purchase | Pull from freezer Thursday if not cooked by then |
| Bananas | As they peak | Peel and freeze over-ripe bananas immediately -- add to morning oats or yogurt |
| Greek yogurt | Check label, typically 14 days after opening | At 4-5 oz per person per day, a 32 oz container is used in 3-4 days for 2 people |

**FIFO action before unpacking:** Move existing fridge contents to the front. Place new proteins behind existing leftovers. Move older canned goods to the front of the pantry shelf. Move older dry goods to the front of the grain shelf.

---

### Budget Notes

- **Chicken thighs vs. chicken breast:** Bone-in, skin-on chicken thighs run approximately 1.50-2.50 dollars per pound vs. 4.50-7.00 dollars per pound for boneless skinless breast in most markets. Batch-roasting 4 lbs on Sunday produces 6-8 meal portions at under 1.00 dollar per serving in protein cost. This is the single highest-impact budget decision on this list.
- **Frozen vegetables for cooked applications:** The stir-fry mix and frozen corn replace approximately 6-7 dollars in fresh equivalent at a cost of roughly 3-4 dollars total. No nutrition loss for cooked dishes.
- **Eggs as a protein anchor:** At approximately 0.25-0.35 dollars per egg, a 3-egg breakfast costs under 1.00 dollar per person vs. 2.50-4.00 dollars for equivalent protein from meat. Using eggs for all 7 breakfasts and 2 weekend lunches saves approximately 10-20 dollars vs. a meat-centered breakfast plan.
- **Store-brand substitutions for this list:** Canned tomatoes, canned beans, frozen vegetables, shredded cheese, and yogurt are all commodity products where store-brand is equivalent in quality. Switching these items to store-brand saves approximately 5-12 dollars on this list alone.
- **Cost-per-meal target:** This list covers 7 dinners + 7 breakfasts + 4 weekend lunches = 18 meal events for 2 people = 36 individual meal servings. At a 100 dollar target, the target is approximately 2.78 dollars per serving.
- **Estimated weekly cost range:** 85-110 dollars depending on store format, region, and whether pantry restocks (oil, spices) are needed this trip. Exclude pantry foundation restocks from the weekly comparison -- these are not recurring weekly costs.

---

### Rough Meal Map (How the Purchased Ingredients Are Used)

This is provided so the user can confirm the purchase-to-meal logic, not as a rigid plan.

| Day | Dinner | Breakfast | Notes |
|-----|--------|-----------|-------|
| Monday | Lemon garlic roasted chicken thighs + Yukon gold potatoes + simple salad | Oats + banana | Batch roast all 4 lbs chicken; refrigerate leftovers |
| Tuesday | Chicken stir-fry with frozen vegetable mix + rice | Eggs + banana | Use leftover roasted chicken; stir-fry takes 15 minutes |
| Wednesday | Cherry tomato pasta with spinach + white beans | Greek yogurt | Pasta uses pantry olive oil + canned tomatoes |
| Thursday | Sheet-pan chicken thighs (from freezer portion) + broccoli + chickpeas | Oats | Pull frozen chicken from freezer Wednesday night to thaw |
| Friday | Fajita bowls: bell peppers, black beans, corn, cheese, sour cream + rice | Greek yogurt | No additional protein needed; beans anchor the meal |
| Saturday | Frittata: eggs + spinach + cherry tomatoes + shredded cheese | Oats or yogurt | Lunch + dinner versatility; clears remaining produce |
| Sunday | Flexible -- use remaining proteins, grains, or eggs | Potato hash + eggs | Clears potatoes and any remaining proteins |

---

### Quantity Verification

| Category | Target for 2 adults, 7 days (dinners + breakfasts + weekend lunches) | List total | Status |
|----------|-----------------------------------------------------------------------|------------|--------|
| Vegetables (fresh + frozen) | 7-10 lbs | ~9 lbs (3 lbs fresh + ~2 lbs frozen + 2 lbs potato + 1.5 lbs broccoli) | ✓ |
| Protein -- animal (raw weight) | 7-9 lbs for all meals | ~8.5 lbs (4 lbs chicken + 0.75 lbs salmon + 1 lb beef + 1.5 lbs eggs at 1.5 lbs/18 eggs) | ✓ |
| Protein -- plant (canned) | 3-4 meal equivalents | 5 cans (beans + chickpeas) = 5-6 servings each = 25-30 servings available | ✓ (surplus usable) |
| Grains (dry weight) | 3-4 lbs across all meals | ~5 lbs (2 lbs rice + 1 lb pasta + 2 lbs oats) | ✓ |
| Fruit | 4-6 lbs | Bananas (~2 lbs), lemons (0.5 lbs), cherry tomatoes count as culinary fruit (~0.75 lbs) | ✓ (light on fruit -- add 1 bag frozen berries if budget allows) |
| Dairy | 2+ weeks coverage | 32 oz yogurt + eggs + 8 oz cheese + 8 oz sour cream + 1 stick butter | ✓ |
