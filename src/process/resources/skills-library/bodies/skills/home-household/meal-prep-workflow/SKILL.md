---
name: meal-prep-workflow
description: |
  Creates a batch meal prep plan with a Sunday (or chosen day) prep sequence
  covering what to batch-cook, the optimal order of operations, storage containers
  and durations, and a reheating guide. Produces a structured workflow that turns
  3-4 hours of cooking into 5 days of ready meals. Use when the user asks about
  meal prepping, batch cooking, Sunday meal prep, or saving time on weeknight
  dinners. Do NOT use for single recipes (use one-pot-meals), pantry stocking
  (use pantry-staples-system), or food safety storage rules (use food-storage-safety).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "meal-planning cooking planning"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Meal Prep Workflow

## When to Use

**Use this skill when the user:**
- Explicitly asks about meal prepping, batch cooking, Sunday prep, or "cooking for the week" in a single session
- Wants to reduce weeknight cooking time to under 15 minutes per meal
- Asks how to turn raw groceries into 5+ ready-to-eat meals in one afternoon
- Wants a structured sequence for overlapping oven, stovetop, and cold prep tasks simultaneously
- Has bought groceries and needs an efficient cooking plan to process them all at once
- Asks how to store cooked components, how long they last, or how to label and rotate prepped food
- Wants to reduce food waste by batch-cooking perishables before they expire
- Is setting up a weekly cooking routine for the first time and needs a repeatable system

**Do NOT use this skill when:**
- The user needs a single specific recipe from scratch -- use `one-pot-meals` instead
- The user wants to learn a cooking technique (how to dice, how to make a roux, knife skills) -- use `cooking-techniques` instead
- The user is asking what to keep stocked in their pantry long-term -- use `pantry-staples-system` instead
- The user has a food safety question (safe thaw times, internal temps, cross-contamination rules) -- use `food-storage-safety` instead
- The user is planning a dinner party or event meal -- this skill is optimized for individual/family weekday efficiency, not presentation cooking
- The user wants a specific diet plan or calorie targets -- meal prep workflow covers cooking logistics, not nutrition prescription; refer to appropriate dietary guidance

---

## Process

### Step 1: Gather Prep Parameters (Before Designing Anything)

Ask for or infer the following inputs before building a plan. Do not skip this step -- wrong assumptions here cascade into an unusable plan.

- **Meals to cover:** Lunches only, dinners only, or both? Breakfast included? This determines total component volume.
- **Headcount and portion size:** 1 person vs. a family of 4 changes batch quantities by 4x. Adults vs. children changes portion size. Athletic adults eating 600-calorie lunches need larger protein portions than sedentary eaters.
- **Dietary restrictions and preferences:** Meat-eater, vegetarian, vegan, gluten-free, dairy-free, low-carb. This governs protein selection and grain/starch choices.
- **Available prep time:** 1-2 hours, 2-3 hours, 3-4 hours, 5+ hours. The plan must fit within the stated window -- never deliver a 4-hour plan to someone with 2 hours.
- **Available equipment:** At minimum, identify whether the user has: oven with two usable racks, stovetop burners (how many), rice cooker or Instant Pot, sheet pans (how many), available containers. Equipment gaps change the entire sequence.
- **Variety tolerance:** Scale of 1-5 -- are they comfortable eating the same protein four days in a row, or do they need distinct meals each day? This determines whether you use 1 protein batch or 2-3 small batches.
- **Fridge and freezer capacity:** If they have minimal freezer space, all meals must stay fridge-stable within the week. If no microwave at lunch (office), meals must be cold-compatible.

If the user has not provided these details, ask before proceeding. A 30-second clarification produces a plan 10x more useful than a generic one.

---

### Step 2: Design the Component Architecture (The "Building Block" Method)

Meal prep efficiency comes from cooking components, not complete dishes. One batch of roasted chicken becomes a grain bowl on Monday, a wrap on Tuesday, a salad on Wednesday, and fried rice on Thursday. Design the menu around 5 core component categories:

- **Protein (1-2 batches):** Choose proteins that hold refrigerator quality for 3-4 days. Best performers: bone-in or boneless chicken thighs (juicier than breast when reheated), hard-boiled eggs (5-7 days shell-on), baked salmon (3 days max, strong flavor), ground meat (turkey, beef, pork -- crumble-cooked in a skillet, drains and stores flat), lentils and chickpeas (5 days, excellent texture retention), baked tofu (4-5 days). Worst performers for meal prep: shrimp (rubbery after 1 day reheated), pork chops (dry out), medium-rare steak (reheating destroys texture -- use only in cold preparations).
- **Grain or starch base (1-2 types):** Brown rice (45-50 min cook, 5 days fridge, freezes well), white rice (18-20 min cook, 4 days fridge), farro (30 min cook, nutty texture holds well, 5 days), quinoa (15 min cook, 4 days, good protein content), roasted sweet potatoes (25-30 min at 425F/218C, 5 days), pasta (cook al dente -- slightly underdone -- so it doesn't turn mushy when reheated with sauce).
- **Vegetables -- roasted (1-2 types):** Roasting at 400-425F/204-218C produces caramelized vegetables that reheat better than steamed. Best for meal prep: broccoli, cauliflower, Brussels sprouts, bell peppers, zucchini, asparagus (keeps 3-4 days), butternut squash (5 days). Cut uniform size for even roasting: broccoli florets 1.5 inches, peppers in 1-inch strips, zucchini in 3/4-inch half-moons.
- **Vegetables -- raw prep (1-2 types):** Wash, dry thoroughly, and chop vegetables that hold well raw: carrots, celery, cucumbers (slice day-before at most), cabbage (shred, holds 5 days), snap peas (whole, 5 days), cherry tomatoes (whole, 4 days), bell peppers (sliced, 4 days in airtight container).
- **Sauces and dressings (2-3 batches):** This is the variety multiplier. Two base components with three different sauces become six distinct-tasting meals. Core sauce formulas: any oil + any acid (ratio 3:1) + aromatics + salt = a dressing. Batch sauces last 5-7 days refrigerated in sealed jars.

Select components so that every protein pairs with every grain, and at least 2 sauces pair with every protein. If a component only works in one meal combination, it is a complete dish -- not a meal prep component.

---

### Step 3: Calculate Quantities Precisely

Imprecise quantities are the most common meal prep failure point. Use these benchmarks as starting points, then adjust for headcount and calorie needs:

**Per person per meal targets:**
- Protein (cooked weight): 4-6 oz for a 500-600 calorie meal, 6-8 oz for athletic/high-calorie needs
- Grain (cooked volume): 3/4 cup to 1.5 cups depending on carb preference
- Vegetables (volume): 1-1.5 cups roasted, 1-2 cups raw

**Raw-to-cooked conversion factors (critical for shopping list accuracy):**
- Dry white rice: 1 cup dry = 3 cups cooked (multiply needed cooked volume by 0.33 for dry amount)
- Dry brown rice: 1 cup dry = 2.5 cups cooked
- Dry quinoa: 1 cup dry = 3 cups cooked
- Dry farro: 1 cup dry = 2.5 cups cooked
- Raw boneless chicken thigh: 1 lb raw = ~11-12 oz cooked (25-30% moisture loss)
- Raw ground meat: 1 lb raw = ~12 oz cooked
- Broccoli: 1 lb raw florets = ~0.75 lb roasted (shrinks ~25%)

**For 5 lunches, 1 person:** ~1.75 lbs raw boneless chicken thigh (yields 5 portions of ~4 oz), ~1.5 cups dry brown rice (yields ~3.75 cups cooked, or ~0.75 cups per meal), ~1.5 lbs broccoli.

**For 5 dinners, 4 people:** ~7 lbs raw chicken thighs, ~6 cups dry brown rice, ~5-6 lbs mixed vegetables.

---

### Step 4: Build the Prep Sequence -- The Parallel Cooking Timeline

The difference between a 3-hour prep and a 5-hour prep is almost entirely parallelization. Every unattended oven or stovetop minute is an opportunity to do cold prep simultaneously.

**Fundamental sequencing rules:**
1. Start the longest-cooking unattended items first: brown rice (45-50 min), dried beans (60-90 min), braised proteins (45-90 min). These run completely in the background.
2. Oven items go in as soon as preheating completes (~10-15 min). Use both racks simultaneously -- proteins on middle rack, vegetables on lower rack (or stagger if one needs higher heat).
3. While oven runs, do stovetop tasks that require attention: sautéed aromatics, sauce reductions, pan proteins.
4. While stovetop simmers, do cold prep: wash and chop raw vegetables, mix dressings, portion containers.
5. Final phase is always portioning and storage -- never try to portion hot food into containers; it steams under the lid and degrades quality. Let everything cool 10-15 minutes on sheet pans or in open pots before portioning.

**Timeline structure to use:**

Divide prep into four phases:
- Phase 1 (first 10 minutes): Start everything that cooks unattended for 30+ minutes -- rice cooker, any braised proteins, preheat oven, soak anything that needs it.
- Phase 2 (minutes 10-50): Active oven work and any stovetop items that need monitoring. Do cold prep in gaps.
- Phase 3 (minutes 50-80): Sauces, dressings, any remaining stovetop work. Oven timers going off during this phase.
- Phase 4 (minutes 80-120): Cool, portion, label, store, and clean.

When oven space is limited (only one usable rack, or only one sheet pan), sequence oven items back-to-back rather than simultaneously. In this case, roast proteins first at 400-425F/204-218C, then use residual oven heat for vegetables at the same temp. Add approximately 25-30 minutes to total prep time.

---

### Step 5: Assign Storage Containers and Label Every Container

Every container needs: contents, preparation date, use-by date. This is not optional. Without labels, prepped food gets forgotten and wasted.

**Container selection logic:**
- Glass containers with locking snap lids: best for refrigerator storage, microwave-safe (without lid), oven-safe for reheating in a pinch. Heavier and breakable but best for sealing.
- BPA-free plastic containers with tight lids: lighter, stackable, good for portable lunches. Not suitable for high-heat oven reheating. Some warp in the dishwasher over time.
- Wide-mouth mason jars (1-quart): ideal for layered grain salads, overnight oats, marinated proteins stored in liquid. The wide mouth allows complete bottom-to-top layering.
- Small condiment containers (2-4 oz): dedicated to sauces and dressings only. Keeping sauces separate prevents sogginess in every stored grain bowl or salad.
- Zip-seal freezer bags (quart and gallon): best for freezer storage of grains and proteins laid flat (stack better, faster thaw, less freezer burn than rigid containers). Squeeze out air before sealing.

**Fridge vs. freezer decision rule:**
- If the meal will be eaten within 3 days of the prep date: fridge storage.
- If the meal will be eaten on day 4 or 5: freeze immediately after cooling, thaw overnight in the fridge the night before eating.
- Exception: sauces and dressings stay refrigerated for up to 7 days. Eggs, hard-boiled: refrigerate, consume within 5-7 days, do not freeze.

---

### Step 6: Create the Daily Assembly and Reheating Guide

Tell the user exactly what to do at meal time -- this should take 0-5 minutes per meal. The goal is that a tired person after a long workday can assemble a complete meal without thinking.

**Reheating protocols by component:**
- Previously cooked poultry and meat: microwave in the storage container (without lid or with lid slightly vented) on high for 2-3 minutes, stirring or flipping halfway, until internal temperature reaches 165F/74C. A meat thermometer is the only reliable way to verify this -- appearance and steam are not sufficient indicators.
- Rice and grains: add 1-2 tablespoons of water before microwaving and cover loosely. This creates steam inside the container and prevents the rice from drying out and becoming hard. Microwave 1.5-2 minutes for a single portion.
- Roasted vegetables: best reheated in the oven or toaster oven at 400F/204C for 8-10 minutes to re-crisp. Microwave works but produces steamed, limp texture. If reheating the whole container together (rice + protein + veg), microwave is acceptable for convenience.
- Sauces: add sauces after reheating, not before. Heating vinaigrette-style dressings in the microwave causes oil-acid separation and wilts greens. Add cold sauces to hot components and toss.
- Frozen meals: move from freezer to fridge the night before. Do not thaw on the counter -- room temperature thawing allows bacterial growth in the outer layers of food while the center is still frozen. Refrigerator thaw (8-12 hours) is the correct method.

---

### Step 7: Deliver the Complete Formatted Plan

Produce the full output following the format below. Do not deliver partial plans or "here's the general idea" responses. The user needs an actionable document they can tape to their fridge or reference from their phone while cooking. Include every table, every time, every container label.

If the user will be shopping for this prep session (not already have ingredients), include the shopping list with quantities. If they already have ingredients, skip the shopping list and go straight to the prep sequence.

After delivering the plan, offer one follow-up: ask if they want the sauce recipes for any of the sauces mentioned, or if they need any prep step explained in more detail. This ensures the plan is complete before they start cooking.

---

## Output Format

```
## Weekly Meal Prep Plan

**Prep Day:** [Day and approximate start time -- e.g., "Sunday, 2:00 PM"]
**Meals Covered:** [e.g., "5 weekday lunches for 1 person" or "5 weekday dinners for a family of 4"]
**Total Active Time:** [minutes hands-on cooking]
**Total Elapsed Time:** [hours from start to cleanup complete]
**Flavor Profile This Week:** [e.g., "Mediterranean / Lemon-herb and Tahini"]

---

### Component Menu

| Component | Type | Quantity to Prep | Meals It Appears In | Fridge Life | Freezer Life |
|-----------|------|-----------------|-------------------|-------------|--------------|
| [e.g., Roasted chicken thighs] | Protein | [e.g., 2 lbs raw] | [e.g., Mon-Fri lunches] | [e.g., 3-4 days] | [e.g., Up to 3 months] |
| [Grain] | Starch | [amount] | [meals] | [days] | [duration] |
| [Roasted veg 1] | Cooked veg | [amount] | [meals] | [days] | [not recommended] |
| [Raw veg prep] | Raw veg | [amount] | [meals] | [days] | [N/A] |
| [Sauce 1] | Sauce | [e.g., 1 cup] | [Mon-Wed meals] | [5-7 days] | [not recommended] |
| [Sauce 2] | Sauce | [e.g., 1 cup] | [Thu-Fri meals] | [5-7 days] | [not recommended] |

---

### Shopping List
*(Skip if user already has ingredients)*

**Proteins:**
- [Item]: [quantity needed]

**Produce:**
- [Item]: [quantity needed]

**Pantry / Dry Goods:**
- [Item]: [quantity needed]

**Estimated cost:** $[range] for [N] meals ($[range] per meal)

---

### Prep Sequence

**PHASE 1 -- Launch Unattended Cooking (Minutes 0-10)**

| Clock Time | Task | Method | Active Minutes |
|-----------|------|--------|---------------|
| [start + 0:00] | [e.g., Add 2 cups brown rice + 4 cups water to pot, bring to boil, cover, reduce to simmer, set timer 45 min] | Stovetop | [e.g., 3 min] |
| [start + 0:03] | [e.g., Preheat oven to 425F/218C. Set timer 10 min for preheat.] | Oven | [1 min] |
| [start + 0:04] | [e.g., Season proteins: coat chicken thighs in oil, salt, pepper, spices. Arrange on sheet pan.] | Cold prep | [5 min] |

**PHASE 2 -- Active Oven and Stovetop Work (Minutes 10-50)**

| Clock Time | Task | Method | Active Minutes |
|-----------|------|--------|---------------|
| [start + 0:13] | [e.g., Chicken into oven, middle rack. Set timer 25 min.] | Oven | [1 min] |
| [start + 0:14] | [e.g., Prep vegetables while oven runs: cut broccoli, slice peppers, toss with oil and salt.] | Cold prep | [10 min] |
| ... | ... | ... | ... |

**PHASE 3 -- Sauces and Secondary Items (Minutes 50-80)**

| Clock Time | Task | Method | Active Minutes |
|-----------|------|--------|---------------|
| ... | ... | ... | ... |

**PHASE 4 -- Cool, Portion, Label, Store (Minutes 80-120)**

| Clock Time | Task | Method | Active Minutes |
|-----------|------|--------|---------------|
| ... | [e.g., Allow all hot items to cool 15 min on counter before portioning. Do not lid hot containers.] | Cooling | [0 min active] |
| ... | [e.g., Portion rice: 1 cup cooked rice into each of 5 containers] | Portioning | [5 min] |
| ... | [Label each container: Day, contents, use-by date] | Labeling | [3 min] |

**PHASE 4 TOTALS:**
- Total active time: [X] minutes
- Total elapsed time (start to cleanup): [X] hours [X] minutes

---

### Storage Plan

| Container | Label | Contents | Store Location | Move/Eat By |
|-----------|-------|----------|---------------|-------------|
| #1 | MON -- Chicken Bowl | Rice + chicken + roasted veg | Fridge | Monday (3 days after Sunday prep) |
| #2 | TUE -- Chicken Bowl | Rice + chicken + roasted veg | Fridge | Tuesday |
| #3 | WED -- Chicken Bowl | Rice + chicken + roasted veg | Fridge | Wednesday |
| #4 | THU -- Chicken Bowl | Rice + chicken + roasted veg | **Freezer** | Move to fridge Wed night, eat Thu |
| #5 | FRI -- Chicken Bowl | Rice + chicken + roasted veg | **Freezer** | Move to fridge Thu night, eat Fri |
| Sauce Jar A | Lemon-herb -- use Mon-Wed | Oil + lemon + garlic + herbs | Fridge | 7 days |
| Sauce Jar B | Soy-ginger -- use Thu-Fri | Soy + ginger + sesame + honey | Fridge | 7 days |

**Container types needed:**
- [N] medium containers (approx. [size] oz / [mL]) for main meal portions
- [N] small containers (2-4 oz) for sauces
- [storage bags or jars as needed]

---

### Daily Meal Assembly Guide

| Day | Meal Name | Protein | Grain | Veg | Sauce | Fresh Add (Optional) | Reheat Time |
|-----|-----------|---------|-------|-----|-------|---------------------|-------------|
| Mon | [e.g., Lemon-herb chicken bowl] | Chicken (fridge) | Brown rice | Roasted broccoli + peppers | Lemon-herb | Sliced cucumber | 2.5 min microwave |
| Tue | [e.g., Same bowl, variation] | Chicken | Brown rice | Roasted broccoli + peppers | Lemon-herb | Cherry tomatoes | 2.5 min microwave |
| Wed | [e.g., Chicken wrap option] | Chicken | [none -- use tortilla instead] | Roasted peppers | Lemon-herb | Shredded cabbage | 1 min microwave (protein only) |
| Thu | [e.g., Soy-ginger chicken bowl] | Chicken (from freezer, thawed) | Brown rice | Roasted broccoli | Soy-ginger | Scallions, sesame seeds | 2.5 min microwave |
| Fri | [e.g., Soy-ginger chicken bowl] | Chicken (thawed) | Brown rice | Roasted broccoli | Soy-ginger | Scallions, sesame seeds | 2.5 min microwave |

**Reheating instructions:**
1. Remove sauce container. Do not reheat sauce.
2. Microwave main container (lid vented or removed) on high: [X] minutes for [portion size].
3. Stir or flip halfway through.
4. Verify protein is steaming hot throughout.
5. Add sauce and fresh toppings after heating.

---

### Sauce Recipes

**[Sauce Name 1]**
- [Ingredient 1]: [amount]
- [Ingredient 2]: [amount]
- Method: [whisk / blend / shake in jar]
- Yield: [approx. volume]

**[Sauce Name 2]**
- [Ingredient 1]: [amount]
- [Ingredient 2]: [amount]
- Method: [method]
- Yield: [approx. volume]
```

---

## Rules

1. **Never deliver a plan without knowing available prep time.** A 5-hour plan handed to someone with 2 hours causes frustration and abandoned preps. If time is unclear, ask before building the sequence.

2. **The 3-day fridge rule for cooked proteins is non-negotiable.** Cooked chicken, ground meat, and cooked seafood stored in the fridge must be consumed within 3-4 days of cooking. Any portion intended for day 4 or day 5 must be frozen on prep day, not on day 3. Moving food to the freezer on day 3 is too late -- it is already near its safety threshold.

3. **Component architecture always beats full-dish prep.** Never design a plan where each day's meal is a completely different full dish requiring unique ingredients. Ingredient overlap (same protein, different sauce) is the efficiency engine of meal prep. A user who wants "totally different meals every day" needs to be gently redirected toward a component system with strong sauce variation.

4. **Parallel cooking is mandatory for any prep over 90 minutes of actual cook time.** If the sequence has the user cooking items one at a time in series, the plan is inefficient. Every timeline must have at least one oven item and one non-oven item running simultaneously for the first 50 minutes.

5. **Never portion hot food directly into sealed containers.** Hot food lidded immediately traps steam, creates condensation on the lid interior, drips back onto the food, and degrades texture significantly by the next day. Always include a 10-15 minute cooling window before portioning. Note this explicitly in Phase 4 of the sequence.

6. **Sauces are always stored separately from the main component containers.** Sauce stored on top of grains and proteins soaks in overnight and creates mushy texture. Exceptions: marinated proteins where liquid is part of the dish (e.g., a bean stew or braised protein stored in its own braising liquid).

7. **Every container in the plan must have a label specifying: (a) day it will be eaten, (b) whether to thaw first and when, (c) use-by date.** Without this information, the user cannot manage the fridge-freezer rotation reliably. Include the labeling step explicitly in the sequence.

8. **Validate equipment capacity against the plan before finalizing.** If the user has one sheet pan and the plan calls for roasting 4 lbs of protein plus 3 lbs of vegetables simultaneously, the plan will fail. Either reduce quantities to fit the sheet pan, sequence oven items back-to-back, or instruct the user that a second sheet pan is needed.

9. **Pasta meal prep requires undercooking on prep day.** Pasta cooked to al dente and refrigerated will absorb sauce and continue softening in the fridge. Instruct the user to cook pasta 1-2 minutes less than package directions on prep day. When reheated with a sauce and a splash of water, it reaches proper texture.

10. **Build in one "fresh element" per day to prevent flavor fatigue.** Even one fresh addition per assembled meal -- a handful of baby spinach, sliced avocado day-of, a squeeze of lemon, a sprinkle of seeds or fresh herbs -- makes a 4-day-old prepped meal feel notably less tired. This is not optional for user retention of the meal prep habit. Flag this explicitly in the daily assembly table.

---

## Edge Cases

### User Has Only 1-2 Hours Available

Do not try to compress a full 5-component plan into 2 hours -- it will fail. Instead, deliver a "semi-prep" plan focused on the three tasks that give the most weeknight time savings per prep minute:

1. **Grain batch (20 min active, 40-50 min elapsed):** Cook a full pot of brown rice or farro. This saves 40-50 minutes per weeknight meal.
2. **Vegetable wash-and-cut prep (20-30 min):** Wash, dry, and cut all produce for the week. Pre-cut vegetables reduce weeknight dinner assembly from 20 minutes to 5. Store in airtight containers lined with a paper towel to absorb moisture.
3. **One sauce or marinade (10 min):** A batch sauce eliminates the weeknight "what flavor am I even making" decision fatigue.

With semi-prep, weeknight cooking is still required (15-20 min), but the chopping and grain cooking are already done. Be explicit that this is not full meal prep -- it is a prep assist.

### Vegetarian or Vegan Prep

Protein storage rules change significantly. Plant-based proteins behave differently than animal proteins:
- Baked extra-firm tofu: press moisture out for at least 20 minutes before cutting and baking. Bake at 400F/204C for 25-30 minutes, flipping halfway, until golden and firm. Stores 4-5 days refrigerated -- longer than chicken. Does not freeze well (texture becomes spongey on thaw).
- Cooked lentils (green or brown): cook in seasoned broth (not water) for flavor. 1 cup dry lentils + 2.5 cups liquid, simmer 25-30 min. Stores 5 days refrigerated. Freezes well in flat bags for up to 3 months.
- Cooked chickpeas (from dried): 1 cup dried chickpeas soaked overnight = ~2.5 cups cooked after 60-90 min boiling. Store 5 days refrigerated. Freeze well. Canned chickpeas (drained, rinsed, patted dry) are an acceptable shortcut.
- Tempeh: slice or cube, steam 10 minutes to reduce bitterness, then marinate and bake or pan-fry. Stores 5 days refrigerated.

The 3-4 day fridge rule for cooked animal proteins does not apply in the same way to legumes and tofu. Legumes and baked tofu commonly last 5 full days at safe refrigerator temperatures (below 40F/4C). Expand fridge-storage days accordingly in the storage plan.

### Family Prep With Picky Eaters or Varying Dietary Needs

Design using the "deconstructed component bar" approach: each core component is stored in its own large container rather than pre-assembled into individual portion containers. At mealtime, each family member builds their own plate from the components on the fridge shelf. This resolves: one adult avoiding carbs, children disliking mixed textures, different sauce preferences. The prep workflow is identical -- the only change is the portioning step. Instead of portioning into 5 individual containers, portion each component into one large container. Label with contents and use-by date.

### No Microwave Available for Reheating (Office Lunches)

Redesign the meal plan entirely around cold-friendly formats:
- **Grain salads (not grain bowls):** Farro, quinoa, or wheat berry salads dressed with oil-and-vinegar dressings hold texture and flavor cold. Use a 3:1 oil-to-acid ratio dressing, toss while grains are still slightly warm so they absorb flavor.
- **Mason jar layered salads:** Layer from bottom to top -- dressing, hard vegetables (carrots, cucumbers), grains or beans, softer vegetables (tomatoes, corn), greens on top. The greens never touch the dressing until the jar is shaken at mealtime. Hold 3-4 days assembled.
- **Wraps assembled mid-week:** Prep all wrap components (proteins, roasted veg, sauces) but assemble individual wraps no more than 1 day before eating. A 5-day-assembled wrap becomes soggy. Prep the components Sunday, assemble Tuesday-Wednesday for that half of the week.
- Explicitly avoid: reheating-dependent grain bowls, any soup or stew format, any meal where cold texture would be unpleasant.

### User Is New to Meal Prep and Feels Overwhelmed

Start with a "First Prep" plan, which is intentionally smaller than a full workflow: one protein, one grain, one vegetable, one sauce. That's it. This produces 5 meals with the lowest possible cognitive load and the highest probability of success. Success on the first attempt creates the habit; complexity can scale in week 2 and week 3. When the user describes feeling overwhelmed, do not deliver the full 6-table output format. Deliver a simplified narrative plan with a short timeline table.

### User Wants to Prep for Two Weeks (Bulk Batch)

Double quantities in every component. All day-8 through day-14 portions must go directly into the freezer on prep day. Important shifts in the plan:
- Use zip-seal freezer bags instead of rigid containers for frozen portions -- they stack flat and take less space.
- Label frozen bags with reheating instructions directly on the bag (reheating from frozen takes longer; add 2-3 minutes to microwave times).
- Freeze grains and proteins separately, not assembled. Assembled frozen meals can be microwaved from frozen, but quality is significantly better when components are frozen separately and assembled after thawing.
- Remind the user that a 2-week bulk prep requires planning fridge/freezer space before starting.

### Ingredient Overlap Leads to Flavor Fatigue Mid-Week

When the same sauce is used across 5 meals, fatigue typically sets in by day 3. Build every plan with a minimum of 2 distinct sauce profiles: one for the first half of the week (Mon-Wed) and one for the second half (Thu-Fri). For a user who reports boredom even with two sauces, introduce a "texture shift" on day 3: same protein and grain, but served cold as a grain salad with vinaigrette instead of a hot bowl. This changes the eating experience significantly without requiring additional prep.

---

## Example

**Input:** "I want to meal prep lunches for the work week. Just for me. I have about 3 hours on Sunday. I eat pretty much anything."

---

## Weekly Meal Prep Plan

**Prep Day:** Sunday, starting at 1:00 PM
**Meals Covered:** 5 weekday lunches for 1 adult
**Total Active Time:** ~70 minutes hands-on
**Total Elapsed Time:** ~2 hours 30 minutes (start to cleanup complete)
**Flavor Profile This Week:** Mediterranean (Mon-Wed) into Asian-inspired (Thu-Fri)

---

### Component Menu

| Component | Type | Quantity to Prep | Meals It Appears In | Fridge Life | Freezer Life |
|-----------|------|-----------------|-------------------|-------------|--------------|
| Roasted boneless chicken thighs | Protein | 1.75 lbs raw (yields ~21 oz cooked, 5 portions of ~4 oz each) | All 5 lunches | 3-4 days (Mon-Wed in fridge) | Up to 3 months (Thu-Fri portions frozen on Sunday) |
| Brown rice | Starch | 1.5 cups dry (yields ~3.75 cups cooked, ~0.75 cup per meal) | All 5 lunches | 4 days | Freeze Thu-Fri portions |
| Roasted broccoli and red bell pepper | Cooked veg | 1 lb broccoli + 2 red bell peppers | All 5 lunches | 4-5 days | Not recommended |
| Sliced cucumber (prep only -- no cooking) | Raw veg | 2 English cucumbers | Mon-Fri (add day-of or night before) | 4 days sliced in container | Not applicable |
| Lemon-herb dressing | Sauce | 3/4 cup (yields ~3 servings of 3-4 tbsp) | Mon-Wed lunches | 7 days | Not recommended |
| Soy-ginger sauce | Sauce | 1/2 cup (yields ~2-3 servings) | Thu-Fri lunches | 7 days | Not recommended |

---

### Shopping List

**Proteins:**
- Boneless, skinless chicken thighs: 1.75 lbs

**Produce:**
- Broccoli (1 large head or pre-cut bag): 1 lb florets
- Red bell peppers: 2
- English cucumbers: 2
- Cherry tomatoes (optional fresh topping): 1 pint
- Lemon: 1
- Fresh garlic: 1 head (will use 3 cloves total)
- Fresh ginger: small knob (~2 inch piece)

**Pantry / Dry Goods:**
- Brown rice: 1.5 cups (from a bag; most bags are 2 lbs = plenty)
- Olive oil: at least 6 tablespoons needed
- Sesame oil: 1 tablespoon
- Soy sauce (or tamari for gluten-free): 3 tablespoons
- Rice vinegar: 1.5 tablespoons
- Red wine vinegar: 1 tablespoon
- Honey: 1 tablespoon
- Dried oregano: 1 teaspoon
- Smoked paprika: 1 teaspoon
- Garlic powder: 1 teaspoon
- Kosher salt and black pepper

**Estimated cost:** $16-24 for 5 lunches ($3.20-4.80 per meal)

---

### Prep Sequence

**PHASE 1 -- Launch Unattended Cooking (1:00 PM - 1:10 PM)**

| Clock Time | Task | Method | Active Minutes |
|-----------|------|--------|---------------|
| 1:00 PM | Combine 1.5 cups brown rice + 3 cups water in a medium saucepan. Add a pinch of salt. Bring to a boil over high heat, then reduce to low, cover tightly, and set a timer for 45 minutes. Do not lift the lid. | Stovetop | 3 min |
| 1:03 PM | Preheat oven to 425F/218C. Both racks in middle and lower positions. Set a timer for 12 minutes for preheat. | Oven | 1 min |
| 1:04 PM | Pat chicken thighs dry with paper towels (critical -- wet chicken steams instead of roasting). Toss with 2 tbsp olive oil, 1 tsp kosher salt, 1/2 tsp black pepper, 1 tsp smoked paprika, 1 tsp garlic powder. Spread in a single layer on a sheet pan. No overlapping. | Cold prep | 6 min |

**PHASE 2 -- Active Oven and Stovetop Work (1:10 PM - 1:50 PM)**

| Clock Time | Task | Method | Active Minutes |
|-----------|------|--------|---------------|
| 1:15 PM | Oven preheated. Put chicken on middle rack. Set timer for 25 minutes. | Oven | 1 min |
| 1:16 PM | Cut broccoli into 1.5-inch florets. Slice bell peppers into 1-inch strips. Toss on a second sheet pan with 1.5 tbsp olive oil, 1/2 tsp salt, few grinds of pepper. Spread in single layer. | Cold prep | 10 min |
| 1:26 PM | Vegetables into oven on lower rack. Set timer for 20 minutes. | Oven | 1 min |
| 1:27 PM | Make lemon-herb dressing: Combine 5 tbsp olive oil + 2.5 tbsp fresh lemon juice + 1 tbsp red wine vinegar + 1 clove garlic (finely minced or grated) + 1 tsp dried oregano + 1/4 tsp salt + pinch black pepper. Whisk vigorously in a small bowl, then pour into a clean jar with a lid. Shake before using. | Cold prep | 6 min |
| 1:33 PM | Make soy-ginger sauce: Combine 3 tbsp soy sauce + 1.5 tbsp rice vinegar + 1 tbsp sesame oil + 1 tbsp honey + 1 tsp fresh ginger (grated on a microplane or fine grater) + 1 clove garlic (grated) + pinch of red pepper flakes (optional). Whisk and pour into a second small jar. | Cold prep | 5 min |
| 1:38 PM | Slice cucumbers into 1/4-inch rounds. Place in an airtight container with a paper towel on the bottom to absorb excess moisture. Seal. Refrigerate now -- these are done. | Cold prep | 5 min |
| 1:43 PM | Check chicken at 25-minute mark (timer goes off). Insert an instant-read thermometer into the thickest piece -- target is 165F/74C. Thighs typically hit 170-175F/77-79C, which is fine and actually improves texture. If not yet at temp, return to oven for 5 minutes. Remove when done. Leave on sheet pan on stovetop -- do NOT cover. Let rest 10 minutes. | Oven | 2 min |
| 1:46 PM | Check vegetables at 20-minute mark (timer goes off). Edges should be golden brown with slight char. Broccoli tips will be dark brown -- this is ideal, not burnt. If not golden, return for 5 more minutes. Remove when done. Leave on sheet pan to cool. | Oven | 1 min |

**PHASE 3 -- Rice Check and Cleanup Prep (1:50 PM - 2:00 PM)**

| Clock Time | Task | Method | Active Minutes |
|-----------|------|--------|---------------|
| 1:50 PM | Rice timer went off at ~1:48 PM. Check: lift lid to see if water is absorbed (no standing liquid) and rice is tender. Fluff with fork. Leave lid off for 5 minutes to allow surface moisture to steam off -- this prevents gummy rice. | Stovetop | 2 min |
| 1:52 PM | Set out 5 medium containers, 3 small sauce containers, labels or masking tape, and a marker. Lay everything out before portioning -- assembly is faster with containers pre-staged. | Setup | 3 min |

**PHASE 4 -- Cool, Portion, Label, Store (2:00 PM - 2:30 PM)**

| Clock Time | Task | Method | Active Minutes |
|-----------|------|--------|---------------|
| 2:00 PM | Allow chicken, rice, and vegetables to sit uncovered and cool for 10 minutes before portioning. Putting hot food directly into sealed containers traps steam, creates condensation, and makes food soggy by the next day. Use this time to wash the rice pot and prep bowls. | Cooling | 0 min active |
| 2:10 PM | Slice or cube rested chicken. Approximately 3/4 inch cubes or thick strips. Each portion is ~4 oz -- eyeball as roughly equal fifths of the total cooked amount. | Portioning | 5 min |
| 2:15 PM | Portion rice: approximately 3/4 cup cooked rice into the bottom of each of the 5 containers. | Portioning | 4 min |
| 2:19 PM | Portion chicken: place one portion on top of rice in each container. | Portioning | 3 min |
| 2:22 PM | Divide roasted broccoli and peppers equally among all 5 containers, alongside the chicken and rice. | Portioning | 3 min |
| 2:25 PM | Pour lemon-herb dressing into 3 small sauce containers (for Mon, Tue, Wed). Pour soy-ginger sauce into 2 small sauce containers (for Thu, Fri). Seal all sauce containers. | Portioning | 2 min |
| 2:27 PM | Label everything using masking tape and marker: MON (use by Wed), TUE (use by Wed), WED (use by Wed), THU -- FREEZE (move to fridge Wed night), FRI -- FREEZE (move to fridge Thu night). Label sauce containers with corresponding days. | Labeling | 3 min |
| 2:30 PM | Store Mon/Tue/Wed containers in fridge. Store Thu/Fri containers in freezer. Store sauce jars in fridge door. Store cucumber container in fridge. | Storage | 2 min |

**Total active time: approximately 68 minutes**
**Total elapsed time (1:00 PM start to storage complete): ~1 hour 30 minutes**
**Cleanup time (not included above): 20-25 minutes**
**Full session with cleanup: ~2 hours**

---

### Storage Plan

| Container | Label | Contents | Location | Action Required |
|-----------|-------|----------|----------|----------------|
| #1 | MON -- Chicken Bowl | Rice + chicken + broccoli/peppers | Fridge | Eat by Monday |
| #2 | TUE -- Chicken Bowl | Rice + chicken + broccoli/peppers | Fridge | Eat by Tuesday |
| #3 | WED -- Chicken Bowl | Rice + chicken + broccoli/peppers | Fridge | Eat by Wednesday |
| #4 | THU -- FREEZE | Rice + chicken + broccoli/peppers | **Freezer** | Move to fridge Wednesday night; eat Thursday |
| #5 | FRI -- FREEZE | Rice + chicken + broccoli/peppers | **Freezer** | Move to fridge Thursday night; eat Friday |
| Sauce Jar A | Lemon-herb (MON-WED) | Oil, lemon, garlic, oregano | Fridge door | Shake before use; good through Sunday |
| Sauce Jar B | Soy-ginger (THU-FRI) | Soy, ginger, sesame, honey | Fridge door | Good through following Sunday |
| Cucumber container | Cucumbers -- use Mon-Thu | Sliced cucumbers on paper towel | Fridge | Replace paper towel if it gets soaked by day 3 |

**Container types needed:**
- 5 medium containers (~32-36 oz / 900-1000 mL) with locking lids, microwave-safe
- 5 small containers or jars (2-4 oz) for sauces
- 1 medium container (~24 oz) for cucumber slices

---

### Daily Meal Assembly Guide

| Day | Meal Name | Sauce | Fresh Addition | Reheat Instructions | Total Assembly Time |
|-----|-----------|-------|---------------|-------------------|-------------------|
| Mon | Lemon-herb chicken grain bowl | Lemon-herb (shake jar, pour over) | Sliced cucumbers + cherry tomatoes | Microwave container (lid vented) 2.5 min, stir at 1:15, verify steaming hot. Add sauce and cucumber after. | 3 min |
| Tue | Lemon-herb chicken grain bowl | Lemon-herb | Cucumbers + handful of baby spinach if available | Same as Monday | 3 min |
| Wed | Lemon-herb chicken grain bowl -- wrap variation | Lemon-herb | Sliced cucumbers + any greens | Optional: microwave chicken only 1.5 min, wrap in a large flour tortilla with rice, veg, and sauce for a different format | 4 min |
| Thu | Soy-ginger chicken grain bowl | Soy-ginger | Sliced scallions and/or sesame seeds if available (these are game-changers here) | Container came from fridge (moved Wed night). Microwave 2.5 min, stir at 1:15. Add sauce after heating. | 3 min |
| Fri | Soy-ginger chicken grain bowl | Soy-ginger | Scallions, sesame seeds, squeeze of lime if available | Same as Thursday | 3 min |

**Universal reheating reminder:**
1. Remove sauce container before microwaving -- do not heat sauce.
2. Vent lid or remove lid before microwaving to prevent pressure buildup.
3. Microwave on high 2.5 minutes for this portion size. Stir or rearrange contents at the halfway mark.
4. Chicken should be fully hot throughout -- no cold spots.
5. Add sauce and any fresh toppings after heating. Never before.

---

### Sauce Recipes (Full Instructions)

**Lemon-herb dressing (makes ~3/4 cup)**
- 5 tablespoons olive oil
- 2.5 tablespoons fresh lemon juice (about 1 medium lemon)
- 1 tablespoon red wine vinegar
- 1 garlic clove, finely grated or minced
- 1 teaspoon dried oregano
- 1/4 teaspoon kosher salt
- Fresh black pepper to taste
- Optional: 1/2 teaspoon honey to balance acidity
- Method: Combine all in a jar, seal, and shake vigorously for 30 seconds until emulsified. Shake again before each use.

**Soy-ginger sauce (makes ~1/2 cup)**
- 3 tablespoons soy sauce (or tamari for gluten-free)
- 1.5 tablespoons rice vinegar
- 1 tablespoon toasted sesame oil
- 1 tablespoon honey (or maple syrup for vegan)
- 1 teaspoon fresh ginger, grated on a microplane
- 1 clove garlic, grated
- Pinch of red pepper flakes (optional for heat)
- Method: Whisk all ingredients in a small bowl until honey is fully incorporated. Pour into a jar. Refrigerate. The sauce will not separate like an oil-based dressing -- no need to shake before use, though stirring is fine.

---

**Want to go further?** Two follow-up options you might want:
1. A different flavor profile for next week (e.g., Mexican-inspired or Indian-spiced) using the exact same prep workflow.
2. A guide to scaling this plan up to 2 people or to include weeknight dinners alongside the lunches.
