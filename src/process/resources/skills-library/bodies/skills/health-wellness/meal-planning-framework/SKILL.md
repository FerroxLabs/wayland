---
name: meal-planning-framework
description: |
  Builds structured weekly meal plans using a protein-starch-vegetable template with batch cooking integration, portion guidelines, and variety rotation. Produces a 7-day meal planning grid with shopping list categories and prep-day workflow.
  Use when the user asks about meal planning, creating a weekly meal plan, how to plan meals for the week, or organizing meals around a schedule.
  Do NOT use for clinical dietary therapy, eating disorder management, macro calculation (use macro-calculation), or specific recipe creation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "nutrition meal-planning template"
  category: "health-wellness"
  subcategory: "nutrition-diet"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Meal Planning Framework

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- The user explicitly asks to build or receive a weekly meal plan (e.g., "plan my meals for the week," "help me figure out what to eat each day")
- The user wants to reduce the daily cognitive burden of deciding what to eat -- decision fatigue around meals is a specific trigger
- The user wants to integrate batch cooking or meal prep into their routine and needs a structural workflow, not just individual recipes
- The user is trying to reduce food waste by buying intentionally and using ingredients across multiple meals
- The user wants to organize meals around a complex schedule (shift work, multiple household members with different schedules, travel days mid-week)
- The user asks how to eat more variety without constantly cooking from scratch
- The user is new to cooking and needs a scaffolded, repeatable system rather than one-off recipe suggestions
- The user wants to save money on food by planning purchases in advance and minimizing impulse buying

**Do NOT use when:**
- The user needs specific caloric or macronutrient targets calculated (use `macro-calculation` -- meal planning is structural, not numerical)
- The user has a clinically managed condition such as kidney disease (requiring phosphorus/potassium restriction), phenylketonuria, type 1 diabetes requiring precise carbohydrate counting, or celiac disease requiring clinical-grade cross-contamination protocols -- refer to a registered dietitian
- The user asks for a specific recipe with ingredients, technique, and step-by-step cooking instructions (use a recipe-generation skill)
- The user describes symptoms of disordered eating: obsessive restriction, fear of eating certain foods, bingeing and purging cycles, or extreme guilt around food -- do not provide a plan; advise professional support
- The user wants an explanation of a dietary pattern (Mediterranean, DASH, FODMAP) at a conceptual level rather than a meal plan (use `dietary-pattern-overview`)
- The user needs a single-meal suggestion for tonight rather than a structured weekly system (use a quick-meal suggestion skill)
- The user is asking about sports nutrition periodization or nutrient timing around athletic training (use a sports-nutrition skill)

---

## Process

### Step 1: Gather Household and Schedule Parameters

Before building any plan, collect the information that determines every structural decision downstream. Do not skip this step -- generic meal plans fail because they ignore logistics.

- **Household size:** Number of people eating, and whether any have materially different dietary needs (one vegetarian, one allergic to shellfish). This determines batch quantities and whether a split-protein strategy is needed.
- **Meals to plan:** Breakfast, lunch, dinner, snacks -- confirm which meals the user actually needs structured. Many people have lunch provided at work or always eat breakfast at a desk. Plan only what needs planning.
- **Away-from-home meals:** Which days and which meals will definitely be eaten out or at a work cafeteria. Remove those cells from the grid entirely rather than filling them with meals that will be ignored.
- **Weeknight cooking time:** Be precise -- 15 minutes means true 15 minutes from fridge to table. 30 minutes is realistic for one-pan or pasta-based meals. 45+ minutes opens up braised or baked dishes. If the user says "30 minutes" on weeknights, assign 30-minute meals on those nights, not 45-minute ones with a note to rush.
- **Batch cooking availability:** Which day and how many hours. A 2-hour Sunday session yields 3-4 cooked components. A 45-minute prep window yields 1-2 components at most. Size the batch plan to the actual time available.
- **Cooking skill and equipment:** A user with a rice cooker, sheet pans, and an instant pot has different options than one with a single pot and a microwave. Ask what equipment they rely on. Sheet-pan cooking is the single most accessible batch technique for beginners.
- **Budget tier:** Tight (under $75/week for 2 people in the U.S.), moderate ($100-$150), or flexible. Budget determines protein source selection more than anything else. Dried lentils cost roughly $0.25 per serving of protein; skinless chicken thighs run $1.50-2.00; salmon fillets cost $4-6 per serving.
- **Dietary restrictions and preferences:** Collect hard restrictions (allergies, religious observance, medical avoidance) separately from soft preferences (dislike mushrooms, prefer not to eat red meat more than once per week). Hard restrictions are non-negotiable; soft preferences are rotation guidance.

---

### Step 2: Apply the Protein-Starch-Vegetable (PSV) Architecture

The PSV template is not a rigid formula -- it is a decision architecture that makes meal construction fast and nutritionally balanced without requiring calorie counting. Every lunch and dinner slot is built by selecting one item from each category.

- **Protein (P):** Target one palm-sized portion per person per meal, approximately 4-6 oz (110-170g) of animal protein, or 3/4 cup (150-175g) of cooked legumes, or 3-4 oz (85-115g) of tofu or tempeh. The key constraint: plan at least 3 distinct protein sources across the 7-day plan. Eating chicken 6 nights is nutritionally monotonous and psychologically unsustainable.
- **Starch/Complex Carbohydrate (S):** One cupped-hand portion per person, roughly 3/4 to 1 cup cooked grain, 1 medium potato, or 1 cup cooked pasta. This is flexible and largely driven by the household's energy needs. Active households or people doing physical labor can add a second serving. Starch choices should vary -- alternate between grains (rice, quinoa, farro, couscous), root vegetables (potato, sweet potato, parsnip), and legume-based starches (lentils double as protein AND starch in the PSV system).
- **Vegetable (V):** 1-2 fist-sized portions per person, minimum 1 cup cooked or 2 cups raw. This is the most flexible category -- any vegetable works. The strategic move is to plan 2-3 batch-roasted vegetables on prep day that can serve multiple meals across the week. A single sheet pan of roasted cauliflower, bell pepper, and zucchini yields 4-6 portions and deploys into Monday pasta, Wednesday grain bowls, and Thursday wraps.
- **Fat modifier:** 1-2 tablespoons of a fat source, primarily from cooking oil, dressing, nut-based sauces, or avocado. This is not a separate serving -- it is the flavor and texture bridge between the other three components. Olive oil on roasted vegetables, tahini sauce on a grain bowl, and avocado on tacos are all fat modifiers that make meals feel complete.
- **Flavor system (the fourth invisible component):** The PSV framework produces bland food if you ignore flavor. Assign a flavor profile to each meal: Mediterranean (lemon, olive oil, oregano, garlic), East Asian (soy, ginger, sesame, rice vinegar), Mexican (cumin, chili, lime, cilantro), or simple American (garlic, butter, herbs). Rotating flavor profiles across the week is as important as rotating protein sources for maintaining appetite and variety.

---

### Step 3: Build the Variety Rotation Using the 3-2-1 Rule

The 3-2-1 rule prevents the two failure modes of meal planning: monotony (eating the same thing every day) and overwhelm (cooking 7 completely different meals from scratch).

- **3 protein anchors:** Choose 3 protein sources for the week. Two are batch-cooked on prep day (e.g., roasted chicken thighs and hard-boiled eggs). One is cooked fresh mid-week (e.g., salmon fillets or ground beef). These 3 proteins rotate across 5-6 dinner slots and 4-5 lunch slots.
- **2 batch-cooked starches:** Cook two grain or starch types on prep day. One mild (plain brown rice, plain quinoa) that works under any flavor profile. One more assertive (roasted sweet potatoes, pasta, seasoned farro) that drives specific meals. These two starches serve 4-5 days of meals between them.
- **1 wildcard meal:** One dinner per week that is entirely different from the batch-cooked system -- a fresh cook, a new recipe, or a themed meal (homemade pizza night, taco bar, etc.). This meal keeps the plan engaging and gives the household something to look forward to.
- **Cooking method rotation:** Never repeat the same cooking method on back-to-back nights. If Monday is roasted chicken (dry heat, oven), Tuesday should be sauteed or pan-seared (stovetop), Wednesday should be a one-pot or simmered dish, Thursday assembly-based (tacos, bowls, wraps), and so on. Method variety produces textural variety even when ingredients repeat.
- **Color targeting for vegetables:** Aim for 3 different colored vegetables across the week -- not for nutritional completeness (that is a macro-calculation concern) but as a practical heuristic that naturally produces variety and prevents always defaulting to the same bag of frozen peas.

---

### Step 4: Assign Meals to the Weekly Grid Using Energy Mapping

Match meal complexity to the user's available energy and time on each specific day, not just average weeknight availability.

- **Energy mapping:** Ask the user to identify their 2 most demanding weekdays (late meetings, long commutes, kids' activities). These days receive 15-minute or reheat-only dinners without exception. Assigning a 45-minute meal to a Thursday when the user leaves work at 7pm is a plan that will fail.
- **15-minute meal types:** Reheated batch items, grain bowls assembled from prepped components, scrambled eggs with toast and roasted vegetables, quesadillas with canned beans and bagged salad, pasta tossed with jarred sauce and rotisserie chicken. These require minimal active work.
- **30-minute meal types:** Baked salmon or tilapia (oven at 400°F for 12-15 minutes while vegetables roast alongside), ground meat dishes (brown and season ground turkey or beef in 15 minutes, serve over pre-cooked grain), stir-fry over pre-cooked rice, one-pan skillet meals.
- **45+ minute meal types:** Braises, roasted whole chickens, homemade soups, sheet-pan dinners with longer-roasting vegetables (root vegetables need 40-45 minutes at 425°F), casseroles. Reserve these for the least demanding weeknight or a weekend evening.
- **Strategic leftover integration:** Plan Tuesday's dinner to produce explicit leftovers for Wednesday lunch. This is not accidental -- it is built into the batch quantity. If Tuesday dinner is roasted salmon for 2 people, cook 3 portions: 2 for dinner, 1 for Wednesday's lunch grain bowl. This reduces Wednesday's decision and cooking burden simultaneously.
- **The flexible night:** Always designate one night as unplanned -- typically Friday for households that eat out on weekends, or Wednesday as a mid-week reset. Label it "flexible" in the grid, not "leftovers only," to reduce guilt around plan deviation.
- **Breakfast logic:** For breakfast, a repeat-and-rotate approach works better than 7 unique meals. Offer 2-3 breakfast options and let the user rotate freely within them rather than assigning a specific breakfast to each day. Exception: meal-prepped breakfast items (overnight oats, egg muffins, smoothie packs) can be batch-produced and deserve a grid entry.

---

### Step 5: Generate the Quantified Shopping List

A shopping list organized by meal is useless at the store. Organize by store section and include quantities calibrated to the household size and specific meal plan.

- **Quantity calculation method:** For each ingredient, sum across all meals it appears in, then add 10-15% overage for spillage, trimming loss, and appetite variation. Example: if chicken appears in 3 meals for 2 people at 5 oz per person per meal, the calculation is 3 meals × 2 people × 5 oz = 30 oz raw, rounded to 2 lbs (accounting for shrinkage during cooking -- most proteins lose 20-25% of weight when cooked).
- **Produce perishability sequencing:** Note which produce items are perishable (leafy greens, fresh fish, berries) and which are stable (root vegetables, citrus, apples, frozen vegetables). Perishable items should be assigned to early-week meals; shelf-stable items to later in the week. This prevents waste when a flexible Friday means some produce goes unused.
- **Pantry check items vs. buy items:** Distinguish between staple pantry items the user likely already has (olive oil, soy sauce, standard spices, canned tomatoes) and items that must be purchased fresh. List pantry items in a separate "check before buying" section to prevent duplicate purchases.
- **Store section order:** Organize in the physical flow of a standard grocery store to reduce backtracking -- produce first, then meat/fish, then dairy, then dry goods/grains, then canned/pantry, then frozen. This is a usability optimization that makes the list faster to use in the store.
- **Batch scaling notation:** Flag items used in batch cooking with a "(batch)" tag so the user understands why quantities may seem large. Buying 2.5 lbs of chicken thighs seems excessive until it is clear it feeds 3 different meals.

---

### Step 6: Build the Prep-Day Workflow

The prep-day workflow is a sequential task plan that manages the kitchen as a multi-threaded operation. The key principle is active-time minimization: most cooking is passive (oven time, boiling time) and can run simultaneously.

- **Sequence rule -- longest passive time first:** Always start the item with the longest oven or stovetop time first. A 2 lb tray of chicken thighs at 425°F takes 35-40 minutes. Start that first. While it roasts, chop vegetables, measure grains, hard-boil eggs, and prep sauces. This is the core time-compression technique in batch cooking.
- **Oven real estate management:** Standard home ovens hold 2 full sheet pans simultaneously. Plan to use both racks. Proteins on one rack (bottom or middle), vegetables on another (middle or top). Note that oven-roasted vegetables near the top rack brown faster -- rotate at the 15-minute mark if cooking two pans simultaneously.
- **Grain cooking while oven runs:** A rice cooker, instant pot, or stovetop pot can run concurrently with oven items. Brown rice takes 45 minutes on the stovetop or 22 minutes in an instant pot. Quinoa takes 15 minutes. Farro takes 30 minutes. Always start grains after the oven items are in.
- **Cold prep sequence:** After starting oven and grain items, move to cold prep: wash and spin salad greens (store in a container lined with paper towels -- extends freshness 4-5 days), chop raw vegetables for stir-fry or grain bowls, portion snack items, and prepare any sauces or dressings that will be used across the week.
- **Time estimates with realism:** A 2-hour prep window realistically produces: 1 batch protein (35-40 min oven), 2 batch grains (concurrent, 20-45 min), 1-2 sheet pans of roasted vegetables (25 min oven), 1 sauce or dressing (10 min), and portioning/storage (15-20 min). Scale the plan to this capacity -- do not plan a 3-hour prep session for someone who said they have 1.5 hours.
- **Container strategy:** Plan the number of storage containers before prep begins. Glass containers are preferred for reheating (no plastic leaching, better heat distribution). Label each container with day and meal. A standard prep session for 2 people produces approximately 6-8 dinner-sized containers and 4-6 lunch-sized containers. If the user does not have this container inventory, note it as a one-time setup need.
- **Safe storage windows:** Cooked chicken: 3-4 days refrigerated, 3 months frozen. Cooked grains: 4-5 days refrigerated, 1 month frozen. Cooked vegetables: 3-4 days refrigerated (do not freeze unless making soup). Hard-boiled eggs: 7 days refrigerated in shell, 5 days peeled. If the meal plan extends ingredients beyond these windows, designate a mid-week mini-prep or freeze a portion on prep day.

---

### Step 7: Deliver the Plan with Built-In Adaptation Guidance

A meal plan that cannot flex is a plan that will be abandoned by Wednesday. Build explicit flexibility signals into the output.

- **Flag substitution pairs:** For each protein, note a quick swap. "Roasted chicken thighs" can swap to "rotisserie chicken from the store" with zero prep if the user runs out of time. "Baked salmon" can swap to "canned tuna" for a Tuesday when energy is depleted. Naming these swaps in advance removes the decision burden during a stressful weeknight.
- **Identify the failsafe pantry meal:** Every plan should name one pantry-only meal that requires nothing from the shopping list -- a combination of shelf-stable items the user is assumed to have (pasta + canned tomatoes + olive oil + parmesan, or eggs + toast + any vegetable). This is the rescue meal for when the plan breaks down.
- **Note the 2-week rotation option:** If the user wants a sustainable long-term system, suggest this plan becomes Week A of a 2-week rotation. Week B uses largely the same structure but with different protein sources, flavor profiles, and starch choices. Alternating Week A and Week B indefinitely produces variety without weekly planning effort.
- **Check in on portion scaling:** If the user's household size or activity level changes (new baby, started exercising), the portion volumes change but the plan structure does not. Remind the user that PSV scaling is linear -- double the household, double each component.

---

## Output Format

```
## Weekly Meal Plan: [X] People

**Dietary notes:** [Restrictions and preferences]
**Batch cooking day:** [Day] -- estimated [X] hours
**Flexible night:** [Day]
**Pantry failsafe meal:** [Specific dish using pantry staples]

---

### Weekly Meal Grid

| Day       | Breakfast              | Lunch                        | Dinner                            | Cook Time  | Notes                    |
|-----------|------------------------|------------------------------|-----------------------------------|------------|--------------------------|
| Monday    | [Meal + components]    | [PSV meal or packed lunch]   | [P + S + V + Flavor profile]      | [X min]    | [Reheat/Fresh/Assembly]  |
| Tuesday   | [Meal + components]    | [PSV meal or leftovers]      | [P + S + V + Flavor profile]      | [X min]    | [Method]                 |
| Wednesday | [Meal + components]    | [PSV meal or leftovers]      | [P + S + V + Flavor profile]      | [X min]    | [Method]                 |
| Thursday  | [Meal + components]    | [PSV meal or leftovers]      | [P + S + V + Flavor profile]      | [X min]    | [Method]                 |
| Friday    | [Meal + components]    | [Flexible]                   | Flexible night                    | --         | Eat out / pantry / leftovers |
| Saturday  | [Meal + components]    | [Light meal]                 | [P + S + V + Flavor profile]      | [X min]    | Wildcard / new recipe    |
| Sunday    | [Meal + components]    | [Light meal]                 | Batch cook day                    | [X hours]  | See prep workflow below  |

---

### PSV Composition for Each Dinner

| Day       | Protein (P)         | Starch (S)            | Vegetable (V)          | Fat Modifier       | Flavor Profile     |
|-----------|---------------------|-----------------------|------------------------|--------------------|--------------------|
| Monday    | [Protein + oz]      | [Starch + serving]    | [Veg + portion]        | [Fat source]       | [Profile]          |
| Tuesday   | [Protein + oz]      | [Starch + serving]    | [Veg + portion]        | [Fat source]       | [Profile]          |
| Wednesday | [Protein + oz]      | [Starch + serving]    | [Veg + portion]        | [Fat source]       | [Profile]          |
| Thursday  | [Protein + oz]      | [Starch + serving]    | [Veg + portion]        | [Fat source]       | [Profile]          |
| Saturday  | [Protein + oz]      | [Starch + serving]    | [Veg + portion]        | [Fat source]       | [Profile]          |

---

### Batch Cooking Day Workflow ([Day])

**Estimated total time:** [X hours] ([X active, X passive/oven time])

| Step | Task                                        | Method           | Time         | Yields                            | Storage              |
|------|---------------------------------------------|------------------|--------------|-----------------------------------|----------------------|
| 1    | [Longest-cooking item -- start first]        | [Oven/stovetop]  | [X min]      | [X portions for which meals]      | [Container type/days]|
| 2    | [Grain -- start while Step 1 cooks]          | [Method]         | [X min]      | [X portions for which meals]      | [Container type/days]|
| 3    | [Second protein or veg -- load oven rack 2] | [Oven]           | [X min]      | [X portions for which meals]      | [Container type/days]|
| 4    | [Cold prep -- run during passive oven time]  | [Manual]         | [X min]      | [Describe yield]                  | [Container type/days]|
| 5    | [Sauce or dressing]                         | [Manual/stovetop]| [X min]      | [X tbsp / servings]               | [Jar / X days]       |
| 6    | [Portion and label containers]              | [Manual]         | [X min]      | [X containers total]              | [Fridge/freezer note]|

**Oven schedule:**
- [Time] 0:00 -- Preheat oven to [temp]. Season and load [item] on [rack position].
- [Time] 0:10 -- Start grains on stovetop.
- [Time] 0:15 -- Load sheet pan of vegetables on [rack position]. Chop cold prep while oven runs.
- [Time] 0:35 -- Check protein internal temp ([safe temp for protein type]). Remove vegetables if golden.
- [Time] 0:40 -- Remove protein. Rest [X] minutes before slicing.
- [Time] 0:50 -- Portion and store everything. Clean as you go.

---

### Shopping List

**Produce** (buy fresh; assign perishable items to early-week meals):
- [ ] [Item] -- [quantity] -- for [meals] -- [perishable/stable]
- [ ] [Item] -- [quantity] -- for [meals] -- [perishable/stable]

**Proteins** (raw weights; account for 20-25% cooking shrinkage):
- [ ] [Item] -- [weight/count] -- for [meals] -- [storage notes if relevant]
- [ ] [Item] -- [weight/count] -- for [meals]

**Dairy and Refrigerated:**
- [ ] [Item] -- [quantity] -- for [meals]

**Grains and Dry Starches:**
- [ ] [Item] -- [quantity dry] -- yields [quantity cooked] -- for [meals]

**Canned and Pantry:**
- [ ] [Item] -- [quantity] -- for [meals]

**Frozen (if applicable):**
- [ ] [Item] -- [quantity] -- for [meals]

**Pantry Check Before Buying (likely already have):**
- [ ] Olive oil
- [ ] [Spices required this week]
- [ ] [Condiments required this week]

---

### Protein Source Rotation Summary

| Protein           | Days Used            | Cooking Method      | Batch or Fresh |
|-------------------|----------------------|---------------------|----------------|
| [Protein 1]       | [Days]               | [Method]            | Batch          |
| [Protein 2]       | [Days]               | [Method]            | Fresh          |
| [Protein 3]       | [Days]               | [Method]            | Batch / Fresh  |

---

### Quick Swap Guide (If Plan Breaks Down)

| Planned Meal         | Swap Option                          | Extra Time Needed |
|----------------------|--------------------------------------|-------------------|
| [Meal]               | [Easier/faster/pantry alternative]   | [X min / 0 min]   |
| [Meal]               | [Easier/faster/pantry alternative]   | [X min / 0 min]   |
| Any dinner           | [Pantry failsafe meal]               | 15-20 min         |

---

### PSV Portion Reference (Hand-Measurement System)

| Component  | Per Person (volume/weight)  | Visual Cue              | Notes                                   |
|------------|-----------------------------|-------------------------|-----------------------------------------|
| Protein    | 4-6 oz / 110-170g cooked    | Palm of your hand       | 3 oz for lower appetite; 6 oz for active|
| Starch     | 3/4-1 cup cooked            | One cupped hand         | Add a second cupped hand for high energy|
| Vegetable  | 1-2 cups cooked / 2-3 cups raw | 1-2 fists            | More is fine -- no upper limit on veg   |
| Fat mod.   | 1-2 tbsp                    | One thumb               | Cooking oil, dressing, nut butter, etc. |
```

---

## Rules

1. **Always include the disclaimer before providing any nutritional guidance.** The disclaimer is non-negotiable and must appear at the top of every delivered meal plan.

2. **Never prescribe caloric totals or specific macro targets in a meal plan.** Use the hand-measurement PSV system exclusively for portions. If the user explicitly requests calorie targets, acknowledge the request and direct them to the `macro-calculation` skill, then return here to build the structural plan around those targets once calculated.

3. **Every dinner in the plan must explicitly show all three PSV components.** Do not write "chicken and rice" -- write "roasted chicken thighs (P) + brown rice (S) + roasted broccoli (V)." The explicit labeling is instructional -- it teaches the user the framework as they use it.

4. **Enforce the 3-protein-source minimum across any 7-day plan.** A plan with chicken at every dinner, even if the flavor profiles vary, is nutritionally monotonous and will cause plan abandonment. If the user resists variety, explain the strategy (batch variety, not night-by-night cooking effort) and present at least 3 options.

5. **Match assigned meal complexity to the user's stated time, not ideal time.** If the user says 20 minutes on weeknights, assign only meals achievable in 20 minutes on the nights specified. Never pad this with notes like "if you have time, add a salad." Complexity creep is the primary cause of meal plan failure.

6. **Always include the prep-day workflow with a time-sequenced oven schedule.** A list of prep tasks without sequencing is not useful. Users need to know the order of operations, what to start first, and what to do during passive cooking time. The oven schedule section is mandatory.

7. **Shopping list quantities must be calculated from the actual meal plan, not estimated vaguely.** State the calculation method (number of meals × servings × oz per serving = raw quantity). Add 15% overage for shrinkage and variation. Never write "some chicken" or "a few cups of rice."

8. **Assign perishable produce to early-week meals and shelf-stable or frozen items to later in the week.** Fresh spinach and fish are Monday/Tuesday items. Frozen peas, canned beans, root vegetables, and dried pasta are Thursday/Friday items. This rule alone prevents the majority of produce waste in home meal planning.

9. **Include an explicit flexible night on every plan.** Rigid 7-day plans create guilt when broken and get abandoned. The flexible night legitimizes adaptation. Do not fill it with a meal -- label it clearly as flexible and name 2-3 ways to use it (leftovers, pantry meal, eat out without guilt).

10. **If the user describes symptoms consistent with disordered eating -- extreme restriction, fear of specific foods, bingeing, purging, or severe guilt around eating -- do not deliver a meal plan.** Acknowledge what was shared, express genuine care, and recommend speaking with a healthcare professional or a registered dietitian who specializes in eating disorders. This is a hard stop, not a judgment call.

11. **Never recommend specific supplements, protein powders, or branded food products.** Name generic foods (oats, chicken, broccoli) and generic techniques. If a user asks about a specific brand, decline to evaluate it and stay within the structural framework.

12. **The batch cooking plan must respect safe food storage windows.** Cooked poultry is safe for 3-4 days refrigerated. Cooked fish should be consumed within 2 days. If a fish meal is planned for Wednesday but batch-cooked on Sunday, flag this as a food safety concern and instruct the user to cook the fish fresh Wednesday instead. Never plan batch-cooked fish more than 1-2 days ahead.

---

## Edge Cases

### Single-Person Household
Single-person meal planning has a unique failure mode: standard recipes yield 4 servings, and eating the same thing for 4 consecutive days causes abandonment before the week ends. Apply the 2×2 approach: cook 2 different proteins and 2 different starches on prep day, each yielding 2 servings. This produces 4 distinct dinner combinations across the week (Protein A + Starch 1, Protein A + Starch 2, Protein B + Starch 1, Protein B + Starch 2) using only 2 batch cooks. For the remaining 2-3 dinners, use freezer-pull meals (meals portioned and frozen from a previous batch week) and one fresh cook. Emphasize freezer-friendly proteins (cooked ground meat, roasted chicken, bean-based dishes) over delicate proteins that do not freeze well (cooked fish, eggs). Weekly grocery spend for a single person should target $40-60 in the moderate budget tier.

### Very Tight Budget (Under $75/Week for a Family of 4)
Protein is the highest food cost driver; budget plans restructure around plant proteins as the weekly foundation. Build a plan where 3 of 5 dinners use plant-forward protein: dried lentils ($1.50-2.00 per pound, yields 6-8 servings), canned chickpeas ($0.89-1.20 per can, serves 2-3), dried black beans ($1.50/lb, serves 6-8), and eggs ($3-5/dozen, serves 4-6 at 2 eggs per person). The remaining 2 dinners use the most cost-effective animal proteins: chicken thighs (bone-in skin-on cost $1.00-1.50/lb, significantly cheaper than boneless), canned tuna ($1-2 per can), or ground turkey ($3-5/lb). Frozen vegetables cost 30-50% less than fresh with equivalent nutritional value -- normalize frozen broccoli, edamame, peas, and corn in budget plans without apology. Dried grains in bulk (brown rice, oats, dried pasta) cost $0.50-1.00/lb compared to $2-4/lb for convenience packaged portions. Seasonal produce purchased from the produce section (not pre-cut or packaged) reduces costs by 40-60%. A budget plan should contain no pre-marinated proteins, no single-use condiments, and no single-serving packaged items.

### No-Cook or Minimal-Cook Household
Some users genuinely cannot or will not cook, and a plan full of cooking instructions will fail immediately. Build an assembly-based plan using components that require no heat application or only microwave/toaster use: rotisserie chicken (purchased ready-to-eat) pulled over bagged microwaveable rice with bagged salad kit is a complete PSV dinner in 5 minutes. Deli turkey and sliced cheese on whole-grain bread with a cup of cherry tomatoes and hummus is a complete PSV lunch with zero cooking. Hard-boiled eggs (sold pre-cooked in most grocery stores), canned fish, and cottage cheese are no-cook protein sources. Introduce one simple cooked meal each week with explicit permission to skip it if energy is low -- this is the foot-in-the-door technique for building cooking habits gradually. Label this the "one warm meal" for the week to reduce psychological pressure.

### Multiple Dietary Needs in One Household
The most common scenario: one partner is vegetarian, the other is not; or one child has a nut allergy while others do not. The resolution strategy is the shared-base method: build the PSV base using shared starch and vegetable components, then diverge only at the protein. Example: Tuesday dinner base is roasted sweet potatoes + sauteed kale + garlic olive oil. One person's plate adds pan-seared salmon; the other's adds pan-seared tofu with identical seasoning. This requires cooking two proteins simultaneously (2-3 extra minutes of effort) rather than cooking two entirely separate meals. The shopping list diverges only in the protein section. For allergy management, keep the allergen protein entirely separate from shared components during prep -- cross-contact with shared oils or cooking surfaces is a real risk. If the allergy is severe (anaphylaxis risk), note that this is a food safety issue and the household should consult an allergist about kitchen management protocols.

### User Has a Variable or Shift-Work Schedule
Standard Mon-Fri planning does not work for nurses, first responders, service industry workers, or anyone with rotating schedules. Shift to a cycle-based plan rather than a day-of-week plan: Plan for "Day 1 of work stretch," "Rest day," "Day before long shift," etc. On days before long or demanding shifts, plan extra-batch cooking and ensure the next on-shift day has a purely reheatable meal requiring zero decisions. Keep at least 2-3 fully frozen, ready-to-reheat meals in the freezer at all times as a safety net for unplanned schedule changes. The batch cooking day becomes the first rest day after a long stretch, not a fixed Sunday.

### User Wants to Lose Weight (Without Clinical Oversight)
The user may mention weight loss as a context for meal planning. This skill does not produce calorie-restricted plans, but it can acknowledge the goal structurally: (1) emphasize volume -- larger vegetable portions create satiety without increasing caloric density; (2) use the lower end of the PSV starch serving (3/4 cup rather than 1 cup) as the default; (3) suggest cooking methods that do not add significant fat (baking, steaming, air-frying rather than pan-frying in large amounts of oil); (4) include snack planning using high-satiety combinations (protein + fiber: apple + nut butter, Greek yogurt + berries, hummus + vegetables). Explicitly redirect any request for specific calorie targets to the `macro-calculation` skill and note that sustainable weight management is best guided by a registered dietitian, particularly for significant goals.

### User Plans a Vacation Week or Holiday Week
Mid-week holidays, long weekends, and vacations disrupt standard planning. For a week with a Thursday holiday gathering, the plan changes structurally: plan only Monday through Wednesday as normal cooking days, note the holiday gathering as an eating-out or potluck event (no plan needed), and plan only one simple meal for the remaining days assuming the user will have holiday leftovers. Reduce batch cooking quantities proportionally -- a half-week of dinners does not require a full Sunday prep session. For a week where the user travels Tuesday through Friday, plan only Monday and the weekend, note that travel days are out-of-plan, and build a "return day" meal that can be made from pantry staples after travel (pasta + canned sauce + frozen vegetables requires no fresh shopping).

---

## Example

**Input:** "Can you make me a weekly dinner plan for 2 adults? We have about 30 minutes on weeknights. I'd like to batch cook on Sundays. One of us doesn't eat red meat. No other restrictions. Moderate budget."

---

**Output:**

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It is not medical advice. Consult a qualified healthcare professional before making dietary changes, especially if you have a health condition.

## Weekly Meal Plan: 2 Adults

**Dietary notes:** No red meat (one person). All other proteins fine. No other restrictions.
**Batch cooking day:** Sunday -- estimated 1.75 hours
**Flexible night:** Friday (leftovers, pantry meal, or eat out)
**Pantry failsafe meal:** Pasta + canned tomatoes + olive oil + parmesan + any frozen vegetable -- ready in 20 minutes from pantry staples

---

### Weekly Dinner Grid

| Day       | Dinner                                              | Cook Time  | Notes                             |
|-----------|-----------------------------------------------------|------------|-----------------------------------|
| Monday    | Batch chicken thighs + brown rice + roasted broccoli | 10 min    | Reheat Sunday batch; broil broccoli 5 min if desired |
| Tuesday   | Baked salmon + roasted sweet potato + steamed spinach | 30 min   | Fresh cook; oven at 400°F         |
| Wednesday | Chicken thighs (batch) + farro + roasted peppers/zucchini (batch) | 15 min | Reheat; no new cooking |
| Thursday  | Black bean tacos + shredded cabbage slaw + avocado  | 20 min     | Assembly + 5 min stovetop beans   |
| Friday    | Flexible                                            | --         | Use leftovers, pantry meal, or eat out |
| Saturday  | Sheet-pan tofu + jasmine rice + bok choy and snap peas | 30 min  | Wildcard night; fresh cook        |
| Sunday    | Batch cooking day                                   | ~1.75 hrs  | See prep workflow below           |

---

### PSV Composition for Each Dinner

| Day       | Protein (P)                     | Starch (S)               | Vegetable (V)                      | Fat Modifier            | Flavor Profile       |
|-----------|----------------------------------|--------------------------|------------------------------------|-------------------------|----------------------|
| Monday    | Roasted chicken thigh (5 oz each)| Brown rice (3/4 cup)     | Roasted broccoli (1.5 cups)        | Olive oil from batch    | Simple garlic-herb   |
| Tuesday   | Baked salmon fillet (5 oz each)  | Roasted sweet potato (3/4 cup) | Steamed baby spinach (2 cups wilted) | Lemon-olive oil drizzle | Mediterranean        |
| Wednesday | Roasted chicken thigh (5 oz each)| Farro (3/4 cup)          | Roasted peppers + zucchini (1.5 cups) | Olive oil from batch  | Italian herb         |
| Thursday  | Black beans (3/4 cup cooked each)| Corn tortillas (2 each)  | Shredded cabbage + tomato slaw     | Avocado (1/4 each)      | Mexican-lime         |
| Saturday  | Baked tofu (3.5 oz each)         | Jasmine rice (3/4 cup)   | Bok choy + snap peas (2 cups)      | Sesame oil + soy drizzle| East Asian           |

---

### Sunday Batch Cooking Workflow

**Estimated total time:** 1 hour 45 minutes (45 min active, 60 min passive/oven)

| Step | Task                                                        | Method              | Time        | Yields                                      | Storage                            |
|------|-------------------------------------------------------------|---------------------|-------------|---------------------------------------------|------------------------------------|
| 1    | Season 1.5 lbs bone-in skinless chicken thighs (4 thighs), load bottom rack at 425°F | Oven           | 38-42 min   | 4 portions (Mon dinner + Wed dinner for 2)  | Glass container; fridge 3-4 days   |
| 2    | Rinse and start 1.5 cups dry farro on stovetop (3 cups water, simmer 25-30 min) | Stovetop      | 30 min passive | 3 cups cooked (~4 portions)               | Glass container; fridge 4-5 days   |
| 3    | Toss 2 bell peppers (sliced) + 2 zucchini (sliced) in olive oil, load top rack at 425°F | Oven  | 22-25 min   | 4 portions roasted veg (Mon + Wed dinners)  | Glass container; fridge 3-4 days   |
| 4    | Cook 1.5 cups dry brown rice (rice cooker or stovetop, 45 min stovetop / 25 min rice cooker) | Concurrent | 25-45 min passive | 3.5 cups cooked (~5 portions)   | Glass container; fridge 4-5 days   |
| 5    | While oven runs: wash and dry broccoli, portion into florets, set aside for Monday (fresh broil takes 5 min Mon night) | Cold prep | 10 min active | Ready-to-cook broccoli for Mon            | Zip bag or container; fridge 4 days |
| 6    | Make a simple herb marinade: 3 tbsp olive oil + 2 cloves minced garlic + 1 tsp dried oregano + lemon zest -- whisk in jar | Manual | 8 min | ~1/4 cup; used Mon-Wed as finishing sauce   | Jar with lid; fridge 5 days        |
| 7    | Check chicken: internal temp must reach 165°F (use instant-read thermometer at thickest point, not touching bone). Rest 5 min before slicing. | Check temp | 5 min | Confirm doneness     | Slice or leave whole for portioning |
| 8    | Portion and label 6 containers (4 dinners + 2 extra portions for opportunistic lunches) | Manual | 15 min | 6 labeled containers in fridge             | Date label; consume by Wednesday   |

**Oven schedule:**
- 0:00 -- Preheat oven to 425°F. Season chicken; load bottom rack.
- 0:05 -- Start farro on stovetop (medium heat, bring to boil, reduce to low simmer). Start rice in rice cooker.
- 0:15 -- Toss and load sheet pan of peppers and zucchini on top rack. Set 22-minute timer for vegetables.
- 0:20 -- Wash and portion broccoli florets into storage bag. Prep herb marinade.
- 0:37 -- Check and remove vegetables (should be lightly charred at edges). Reduce oven to 400°F.
- 0:40 -- Check chicken internal temp at thickest part (target 165°F). If not reached, add 5 minutes and recheck.
- 0:45 -- Remove chicken; rest on cutting board 5 minutes. Check farro -- should be tender, water absorbed.
- 0:50 -- Slice or shred chicken. Portion all components into labeled containers. Refrigerate.
- 1:05 -- Rice cooker finishes (or check stovetop rice). Portion rice into containers.
- 1:15 -- Load dishwasher, wipe surfaces. Prep complete.

---

### Shopping List

**Produce** (assign perishable items to early-week meals):
- [ ] Broccoli -- 2 medium crowns -- for Monday -- perishable, store unwashed in bag
- [ ] Baby spinach -- 5 oz bag -- for Tuesday -- perishable; use by Wednesday
- [ ] Sweet potatoes -- 2 medium -- for Tuesday -- stable; store at room temp
- [ ] Bell peppers (red or orange) -- 2 large -- for Sunday batch / Wednesday -- stable 5-7 days
- [ ] Zucchini -- 2 medium -- for Sunday batch / Wednesday -- use within 5 days
- [ ] Cabbage -- 1 small head or 1 bag shredded -- for Thursday -- stable 1 week
- [ ] Tomatoes (roma or cherry) -- 2-3 -- for Thursday slaw -- perishable; early week if possible
- [ ] Avocado -- 1 (buy firm; will ripen by Thursday) -- for Thursday
- [ ] Bok choy -- 2 heads or 1 bag baby bok choy -- for Saturday -- perishable; buy Thursday/Friday
- [ ] Snap peas -- 6 oz -- for Saturday -- perishable; buy Thursday/Friday
- [ ] Lemon -- 2 -- for Tuesday + Sunday marinade -- stable

**Proteins** (raw weights; 20-25% cooking shrinkage factored in):
- [ ] Chicken thighs (bone-in, skinless) -- 1.5 lbs (4 thighs) -- for Sunday batch (Mon + Wed dinners) -- buy fresh; refrigerate and cook within 2 days of purchase
- [ ] Salmon fillets -- 2 fillets, 5-6 oz each -- for Tuesday -- buy fresh Tuesday morning or keep frozen and thaw in fridge overnight Monday
- [ ] Firm tofu (extra-firm preferred for baking) -- 1 block (14-16 oz) -- for Saturday -- press for 20 min before cooking for best texture
- [ ] Black beans -- 1 can (15 oz) or 1 cup dried (cook Sunday) -- for Thursday

**Dairy and Refrigerated:**
- [ ] Parmesan (for pantry failsafe meal) -- small wedge or grated -- pantry backup only

**Grains and Dry Starches:**
- [ ] Brown rice -- 1.5 cups dry (yields ~3.5 cups cooked) -- for Monday batch
- [ ] Farro -- 1.5 cups dry (yields ~3 cups cooked) -- for Sunday batch / Wednesday
- [ ] Jasmine rice -- 1 cup dry (yields ~2.5 cups cooked) -- for Saturday
- [ ] Corn tortillas -- 8-count package -- for Thursday

**Canned and Pantry (new purchases):**
- [ ] Canned black beans -- 1 can (15 oz) -- for Thursday (if not cooking dried)
- [ ] Soy sauce -- small bottle -- for Saturday tofu glaze
- [ ] Rice vinegar -- small bottle -- for Saturday and slaw dressing

**Pantry Check Before Buying (likely already have):**
- [ ] Olive oil
- [ ] Sesame oil
- [ ] Garlic (fresh)
- [ ] Dried oregano
- [ ] Cumin + chili powder (for Thursday beans)
- [ ] Salt, pepper
- [ ] Lime juice or fresh limes

---

### Protein Source Rotation Summary

| Protein         | Days Used        | Cooking Method       | Batch or Fresh |
|-----------------|------------------|----------------------|----------------|
| Chicken thighs  | Monday, Wednesday | Oven-roasted (425°F) | Batch (Sunday) |
| Salmon fillet   | Tuesday          | Oven-baked (400°F)   | Fresh cook     |
| Black beans     | Thursday         | Stovetop sauté       | Fresh (5 min)  |
| Extra-firm tofu | Saturday         | Sheet-pan baked      | Fresh cook     |

**3-protein-minimum check:** Chicken, fish, legumes, and soy protein -- 4 distinct sources. ✓

---

### Quick Swap Guide

| Planned Meal              | Swap Option                                                 | Extra Time |
|---------------------------|-------------------------------------------------------------|------------|
| Batch chicken (Mon/Wed)   | Rotisserie chicken from store (skip batch cooking)          | 0 min      |
| Baked salmon (Tuesday)    | Canned salmon or canned tuna tossed with olive oil + lemon  | 5 min      |
| Sheet-pan tofu (Saturday) | Fried eggs (2 per person) over jasmine rice + any vegetable | 10 min     |
| Any dinner                | Pantry failsafe: pasta + canned tomatoes + olive oil + parmesan + frozen peas | 18 min |

---

### PSV Portion Reference

| Component   | Per Person           | Visual Cue              | Notes                                    |
|-------------|----------------------|-------------------------|------------------------------------------|
| Protein     | 4-6 oz / 110-170g cooked | Palm of your hand   | Use lower end for lighter appetite       |
| Starch      | 3/4-1 cup cooked     | One cupped hand         | Add second serving for higher energy days|
| Vegetable   | 1-2 
