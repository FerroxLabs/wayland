---
name: meal-prep-batch-cooking
description: |
  Designs batch cooking workflows with optimal prep order, simultaneous cooking strategies, storage container guidance, and food-safe storage duration references. Produces a timed prep-day plan and a refrigerator inventory with use-by dates.
  Use when the user asks about meal prep, batch cooking, Sunday prep routines, or how to cook once and eat multiple meals throughout the week.
  Do NOT use for meal planning (use meal-planning-framework), macro calculations (use macro-calculation), or specific recipe creation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "nutrition meal-planning cooking"
  category: "health-wellness"
  subcategory: "nutrition-diet"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Meal Prep Batch Cooking

> **Disclaimer:** This skill provides general wellness and nutrition information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. Food safety thresholds referenced here are based on standard food science guidelines but are not a substitute for professional food safety certification. Always consult a qualified healthcare professional before making significant dietary changes. If you have a compromised immune system, pregnancy, or chronic illness, consult a physician before following any batch cooking storage guidance.

---

## When to Use

**Use this skill when:**
- The user explicitly asks about meal prep, batch cooking, Sunday prep sessions, or "cook once, eat all week" workflows
- The user wants to know the optimal order to cook multiple items simultaneously to minimize total prep time
- The user asks how long batch-cooked foods last in the fridge or freezer and how to store them safely
- The user wants to reduce weeknight cooking time and needs a structured, component-based meal system
- The user asks which foods batch cook well and which do not hold up in storage
- The user wants a concrete timed plan for a specific prep session (e.g., "I have 90 minutes on Sunday, help me plan")
- The user asks about container types, portioning strategies, or labeling systems for meal prep
- The user wants to prevent food waste by understanding how to stagger refrigerator and freezer use

**Do NOT use when:**
- The user wants a weekly meal plan built around nutritional goals or caloric targets -- use `meal-planning-framework`
- The user needs macro or calorie calculations for their meals -- use `macro-calculation`
- The user is asking for a specific recipe with detailed cooking instructions and technique -- use a dedicated recipe or cooking skill
- The user has food allergies requiring clinical allergy management guidance -- refer to a healthcare professional
- The user asks about food preservation methods beyond standard refrigeration and freezing (canning, fermentation, dehydration) -- those require dedicated preservation skills
- The user is asking about meal delivery services, meal kit subscriptions, or restaurant ordering

---

## Process

### Step 1: Gather Batch Cooking Parameters

Before designing any workflow, collect the specific constraints that govern the session. Missing even one of these details produces a plan that won't work in practice.

- **Number of people and servings per meal:** A single adult prepping 5 lunches needs roughly 5 portions; a family of 4 prepping 5 dinners needs 20 portions. Portion count drives the quantity of every ingredient and affects container needs.
- **Meal slots to cover:** Are these lunches only, dinners only, or both? Are breakfasts included? A two-session approach (proteins and grains Sunday, fresh items Wednesday) is often more effective than trying to cover 14 meals in one session.
- **Total available prep time:** Use these calibrated targets -- 60 minutes supports 3-4 batch items, 90 minutes supports 4-5, 2 hours supports 5-7, 3 hours supports a full week of both lunches and dinners with multiple proteins.
- **Available equipment:** Oven (number of racks matters -- two racks allow simultaneous sheet pan cooking), stovetop burners, slow cooker or Instant Pot, rice cooker, air fryer, food processor. Each unlocks different parallel cooking opportunities.
- **Storage capacity:** Count available fridge containers and freezer bags. Ask if the user has airtight glass containers, plastic meal prep containers, or mason jars. Container type affects storage life by 20-30%.
- **Dietary restrictions or preferences:** Not for medical advice -- for batch item selection. A vegetarian household batches differently than one centered on animal protein.
- **"Flavor fatigue" tolerance:** Ask directly whether the user wants variety built in or is comfortable eating the same base for several days. This determines whether to build one protein in one seasoning or multiple seasoning profiles.

### Step 2: Audit the User's Equipment and Determine Parallelization Potential

The greatest efficiency gain in batch cooking comes from running multiple cooking stations simultaneously. Assess what the user can run in parallel:

- **Two-rack oven:** Can run proteins on one rack and vegetables on another simultaneously. Standard oven roasting temperature of 400-425°F (200-220°C) works for both. Proteins go on the lower rack (more intense heat), vegetables on the upper (faster browning without drying).
- **Oven + stovetop:** While the oven handles proteins and vegetables hands-free, the stovetop handles grains, sauces, or pan-seared proteins. This is the most common dual-station setup.
- **Oven + slow cooker or Instant Pot:** Slow cooker can run a braise or bean dish autonomously while the oven handles sheet pan items. Instant Pot at high pressure cooks dried chickpeas in 40 minutes, chicken thighs in 12 minutes, and dried lentils in 15 minutes.
- **Rice cooker as a dedicated grain station:** A rice cooker running parallel to oven work eliminates one stovetop burden. Standard ratios: white rice 1:1.5 (rice:water), brown rice 1:2, quinoa 1:1.75.
- **Air fryer for finishing or reheating:** If available, the air fryer becomes the reheating station for roasted vegetables throughout the week, restoring crispness in 3-4 minutes at 375°F (190°C) versus soggy microwave results.

Document the user's available stations as "active" (requires attention) or "passive" (runs unattended). Passive time is where prep work and chopping get done.

### Step 3: Select Batch-Friendly Items by Category

Not all foods batch cook equally. Use this tiered framework to select items:

**Tier 1 -- Batch Ideally (5+ day fridge life, excellent reheat quality):**
- Cooked grains: white rice (5 days), brown rice (5 days), quinoa (5-7 days), farro (5 days), barley (5 days). Slightly undercook grains by 1-2 minutes -- they continue absorbing moisture when stored and reheating will complete cooking.
- Legumes: cooked dried beans and lentils (5 days fridge, 3 months freezer). Dried beans cooked from scratch batch-cook 3x the volume of canned at roughly 1/4 the cost.
- Roasted root vegetables: sweet potato, butternut squash, carrots, beets -- all hold 5-6 days refrigerated with minimal texture degradation.
- Hard-boiled eggs: 7 days in shell, 5 days peeled in water. One of the fastest batch proteins (12 minutes start to finish).
- Ground meat cooked plain (no sauce): 4 days fridge, 3 months freezer. Seasoning after storage allows a single batch to become taco filling, pasta sauce, or grain bowl topping.

**Tier 2 -- Batch Well With Caveats (3-4 day fridge life):**
- Roasted boneless chicken thighs or breasts: 3-4 days. Thighs are strongly preferred for batch cooking -- the higher fat content prevents drying during storage and reheating. Breasts dry out by day 3.
- Baked or poached salmon: 3 days maximum. Mark containers clearly as "use first."
- Roasted cruciferous vegetables (broccoli, cauliflower, Brussels sprouts): 4-5 days but texture softens. Best reheated in air fryer or oven, not microwave.
- Pasta: cook to 1-2 minutes under al dente, toss immediately with 1 tsp neutral oil per cup to prevent clumping. 4-5 days refrigerated. Store sauce separately -- pasta stored in sauce becomes mushy within 24 hours.
- Marinated proteins (raw): 2 days for poultry, 3-5 days for red meat. These are "cook-when-ready" items, not cooked batch items.

**Tier 3 -- Limited Batch Suitability (handle carefully):**
- Roasted zucchini, bell pepper, asparagus: 3-4 days but become soft rapidly. Best used in first half of the week.
- Fish other than salmon: most white fish deteriorates in texture after 2 days. Batch cooking fish only makes sense for Monday and Tuesday use.
- Cooked shrimp: 3 days maximum. Texture becomes rubbery when reheated in microwave -- prefer cold use in salads.

**Do NOT batch cook:**
- Leafy greens in any cooked form -- they wilt and become unpleasant within hours. Keep raw, dress at time of use.
- Avocado in any prepared form -- oxidation is rapid and cannot be reliably prevented in batch quantities.
- Fried foods -- texture degrades completely. Acceptable in air fryer reheat only if reheated within 24 hours.
- Eggs scrambled or fried -- rubbery when reheated. Hard-boiled is the only batch egg format.
- Soups or stews with dairy: cream separates. Batch the base without cream and add at reheating.

**Sauces and condiments (separate storage, dramatically increase meal variety):**
- Batch 2-3 sauces from simple pantry ingredients. Store separately -- never dress food before storage.
- Teriyaki: soy sauce + rice vinegar + honey + fresh ginger + cornstarch. Refrigerates 2 weeks.
- Tahini dressing: tahini + lemon + garlic + water. Refrigerates 7 days.
- Chimichurri: parsley + garlic + olive oil + red wine vinegar. Refrigerates 5-7 days.
- Tomato sauce (basic): canned crushed tomatoes + garlic + olive oil + herbs. Refrigerates 5 days, freezes 3 months.

### Step 4: Design the Prep-Day Timeline Using the Cascade Method

The cascade method sequences cooking tasks so each new task begins precisely when a passive window opens in a running task. The goal is 100% utilization of hands-on time and maximum overlap of passive cooking time.

**Cascade rules:**
1. Identify the item with the longest passive cook time (usually oven proteins: 35-50 minutes). Start this first.
2. Start the second-longest passive item within the first 10 minutes (grains: 20-35 minutes).
3. Fill all passive time with active prep work: washing, chopping, sauce making, container preparation.
4. Stagger removal from oven to avoid a cooling bottleneck -- items that need cooling take 15-20 minutes before safe storage. Never portion food that is still steaming.
5. Reserve the final 15-20 minutes for portioning and labeling.

**Specific timing benchmarks for common items:**
- Roasted chicken thighs at 425°F: 35-40 minutes to 165°F internal temperature (verify with instant-read thermometer)
- Roasted salmon at 400°F: 12-15 minutes for 1-inch thick fillets
- Roasted vegetables (1-inch pieces) at 425°F: 20-25 minutes for tender-crisp
- Sheet pan sweet potatoes (½-inch cubes) at 425°F: 25-30 minutes
- White rice stovetop: 18-20 minutes after boil
- Brown rice stovetop: 40-45 minutes after boil (use rice cooker to free a burner)
- Quinoa stovetop: 15 minutes after boil
- Instant Pot dried chickpeas (pre-soaked): 12-15 minutes high pressure + 15 min natural release
- Instant Pot chicken thighs from fresh: 12 minutes high pressure + 10 min natural release

**Cooling rule:** After cooking, food must be moved out of the temperature danger zone (40-140°F / 4-60°C) within 2 hours. For batch cooking, spread large volumes of hot food into shallow containers or sheet pans to accelerate cooling. Do NOT place large pots of hot food directly into the refrigerator -- this raises the internal fridge temperature and creates a food safety risk for other stored items.

### Step 5: Assign Container Types and Storage Designations

Container selection materially affects storage quality and food safety. Apply these specific guidelines:

**Glass containers with airtight lids:**
- Best for acidic foods (tomato-based, citrus-dressed) -- glass does not absorb odors or stain
- Best for foods intended for oven reheating (glass is oven-safe; most plastic is not)
- Heavier and more fragile, but extends useful storage life vs. cheap plastic due to better sealing
- Recommended for complete assembled meals

**BPA-free plastic meal prep containers:**
- Lightweight and stackable -- ideal for portioned lunches
- Use for foods that will be microwave-reheated only
- Replace when scratched -- scratches harbor bacteria and allow off-flavors to transfer
- Not suitable for highly acidic or fatty foods in long-term storage

**Wide-mouth mason jars:**
- Ideal for sauces, dressings, and liquid-adjacent items
- Excellent for overnight oats, grain salads, or any food eaten directly from the container
- Freezer-safe if filled only to the "freeze" line (leaving 1 inch headspace -- liquids expand)

**Silicone freezer bags:**
- Best for freezer storage of proteins, cooked grains, and sauces
- Lay flat to freeze then stack vertically -- doubles effective freezer storage space
- Remove as much air as possible before sealing to prevent freezer burn

**Labeling standard:** Every container must show three pieces of information: (1) contents, (2) date prepared, (3) use-by date. Use masking tape and a permanent marker. A simplified format: "Chicken thighs | Made 1/12 | Use by 1/16."

### Step 6: Build the Refrigerator Inventory and Weekly Use-By Schedule

After portioning, generate a fridge inventory that maps what exists, how many portions remain, and the critical use-by dates for each item. This prevents the most common meal prep failure: forgetting what was made and finding spoiled food at the end of the week.

**The fridge-to-freezer handoff rule:** Any item that will not be consumed before its use-by date should be moved to the freezer within the first 2 days of preparation -- not on the day it expires. Freezing delays bacteria growth; it does not reverse it. Food that is beginning to degrade should not be frozen.

**Consumption order recommendation:**
- Days 1-2: Use Tier 2 proteins (fish, baked salmon, anything with a 3-day window)
- Days 2-4: Use Tier 1 proteins (chicken thighs, ground meat, hard-boiled eggs)
- Days 3-5: Use Tier 1 grains and legumes (rice, quinoa, beans)
- Throughout: Use Tier 1 roasted root vegetables
- Freeze on day 1-2: Any portions beyond what will realistically be consumed in the fridge window

### Step 7: Create the Weeknight Assembly Guide

The assembly guide turns batch components into diverse meals, preventing flavor fatigue and ensuring components are used in order of perishability.

**The flavor multiplication framework:** One batch protein can yield 3-4 distinct meal experiences through sauce and format variation.
- Roasted chicken thighs (plain-seasoned): teriyaki rice bowl (Monday), chicken wrap with hummus and raw vegetables (Tuesday), chicken Caesar salad with croutons (Wednesday), chicken pasta with pesto (Thursday), chicken fried rice using leftover rice (Friday)
- Cooked ground beef (unseasoned): taco bowls with salsa (Monday), pasta Bolognese with tomato sauce (Wednesday), stuffed bell peppers with rice (Friday)
- Roasted salmon: grain bowl with tahini dressing (Monday), salmon cucumber rice paper wrap (Tuesday -- cold), salmon and greens salad with lemon dressing (Wednesday)

**Assembly time targets:**
- Hot assembly (from stored components, microwave): 5-7 minutes
- Cold assembly (no cooking required): 3-5 minutes
- Partial cook assembly (e.g., stir-frying batch rice with eggs): 10-12 minutes

**Reheating protocols by food type:**
- Cooked grains: sprinkle 1 tablespoon of water per cup of grain before microwaving, cover with a damp paper towel, 1.5-2 minutes on high. The moisture prevents the dry, crumbly texture of reheated grain.
- Cooked chicken (sliced or whole): microwave covered with splash of water, 2-2.5 minutes at 70% power (gentler heat prevents further moisture loss). Alternatively, add directly to a hot pan with 1 tsp oil for 2-3 minutes.
- Roasted vegetables: air fryer at 375°F for 3-4 minutes strongly preferred. Microwave acceptable but results in softened texture. Oven at 400°F for 5-7 minutes restores crispness.
- Cooked beans/legumes: microwave 1-1.5 minutes with splash of water, or add directly to a warm pan.
- Sauces: add after reheating solid components, never before. Heating a vinaigrette or tahini dressing destroys volatile flavor compounds.

### Step 8: Output the Complete Batch Cooking Plan

Assemble all elements from the previous steps into the structured output format described below. The plan should be usable as a standalone reference -- the user should be able to tape it to their refrigerator or keep it open on their phone during the prep session.

---

## Output Format

```
## Batch Cooking Plan: [X Meals] for [X People]

**Prep day:** [Day of week]
**Total active hands-on time:** [X minutes]
**Total elapsed time (including passive cooking):** [X hours X minutes]
**Equipment needed:** [Itemized list -- oven, sheet pans, rice cooker, cutting board, knife, etc.]
**Containers needed:** [X meal prep containers, X small jars for sauces, X freezer bags if applicable]

---

### Prep-Day Cascade Timeline

| Elapsed Time | Task | Station | Hands-On Min | Passive Min | Notes |
|---|---|---|---|---|---|
| 0:00 | Preheat oven to 425°F. Season [protein] with [seasoning]. | Oven prep | 5 | -- | |
| 0:05 | Place [protein] on lower oven rack. Start rice in rice cooker. | Oven + rice cooker | 3 | 40 (protein), 25 (rice) | Both now running passively |
| 0:08 | Chop [vegetables] into 1-inch pieces. Toss with olive oil and salt. | Counter | 10 | -- | Fill passive window |
| 0:18 | Place vegetables on upper oven rack. | Oven | 1 | 22 | |
| 0:19 | Make [sauce 1] and [sauce 2]. | Stovetop | 12 | -- | |
| 0:31 | Chop raw vegetables for cold use. Store in containers with paper towel. | Counter | 8 | -- | |
| 0:39 | Remove vegetables from oven. Spread on sheet pan to cool. | Oven | 2 | -- | Do not store until cooled |
| 0:45 | [Protein] done. Remove and spread into shallow pan to cool. Check 165°F internal temp. | Oven | 3 | -- | Thermometer check required |
| 0:48 | Rice complete. Spread in shallow container to cool. | Rice cooker | 2 | -- | |
| 0:50 | Portion cooled items into [X] containers. Label all. | Counter | 15 | -- | Do not portion while hot |
| 1:05 | Store sauces in separate jars. Label. Final fridge/freezer sort. | Counter | 5 | -- | |
| **1:10 total elapsed** | | | **~66 min hands-on** | | |

---

### Batch Items, Quantities, and Storage

| Item | Batch Quantity | Servings | Fridge Life | Use By Date | Freezer Life | Container Type |
|---|---|---|---|---|---|---|
| [Protein -- e.g., roasted chicken thighs] | [X lbs cooked] | [X] | 4 days | [Date] | 3 months | Meal prep container |
| [Grain -- e.g., white rice] | [X cups cooked] | [X] | 5 days | [Date] | 3 months | Meal prep container |
| [Vegetable -- e.g., roasted broccoli] | [X cups] | [X] | 5 days | [Date] | 2 months | Meal prep container |
| [Raw vegetable -- e.g., sliced cucumber] | [X cups] | [X] | 3 days | [Date] | Not suitable | Container with paper towel |
| [Sauce 1 -- e.g., teriyaki] | [X oz] | [X] | 7 days | [Date] | 2 months | Mason jar |
| [Sauce 2 -- e.g., tahini dressing] | [X oz] | [X] | 7 days | [Date] | 2 months | Mason jar |

---

### Weekly Refrigerator Inventory

**Prepared:** [Date]
**Items to use first (within 3 days):** [List Tier 2 perishables]
**Items with full week window (within 5 days):** [List Tier 1 items]
**Items to move to freezer if not used by [Date]:** [List]

---

### Weeknight Meal Assembly Guide

| Day | Components | Assembly Method | Est. Time | Notes |
|---|---|---|---|---|
| Monday | [Protein] + [Grain] + [Roasted Veg] + [Sauce 1] | Reheat protein and grain, top with veg and sauce | 6 min | Use fish or most perishable protein first |
| Tuesday | [Protein] + [Wrap] + [Raw Veg] + [Sauce 2] | Cold assembly, no heat | 4 min | Different format, same batch items |
| Wednesday | [Protein] + [Grain] + [Roasted Veg] + [Sauce 2] | Reheat all, vary sauce | 6 min | Sauce swap creates different flavor profile |
| Thursday | [Protein] + [Grain] + [Raw Veg] | Pan-fry rice with protein for texture variety | 10 min | Fried rice format from batch components |
| Friday | [Protein] + [Remaining Grain] + [Remaining Veg] | Use whatever remains | 6 min | Any items not used should go to freezer today |

---

### Reheating Quick Reference

| Food | Method | Setting | Time | Critical Tip |
|---|---|---|---|---|
| Cooked chicken (whole thigh or sliced) | Microwave covered | 70% power | 2-2.5 min | Add 1 tbsp water; cover with damp paper towel |
| Cooked ground meat | Microwave | High | 1.5-2 min | Stir halfway |
| White or brown rice | Microwave covered | High | 1.5-2 min | Sprinkle 1 tbsp water per cup before heating |
| Roasted vegetables | Air fryer | 375°F | 3-4 min | Restores crispness; microwave produces soft texture |
| Cooked beans/lentils | Microwave | High | 1-1.5 min | Add small splash of water to prevent drying |
| Pasta | Microwave covered | High | 1.5 min | Add 1 tbsp water; sauce added after heating |
| Any sauce or dressing | Do not reheat | -- | -- | Add cold or at room temp after reheating solids |

---

### Food Safety Quick Reference

| Threshold | Rule |
|---|---|
| 2-hour rule | No cooked food at room temperature for more than 2 hours. Move to fridge or freezer. |
| Temperature danger zone | 40°F-140°F (4°C-60°C). Bacteria multiply rapidly in this range. |
| Cooling before storage | Spread hot food thin to cool; do not refrigerate food that is still steaming. |
| Safe internal temperatures | Poultry: 165°F (74°C). Ground meat: 160°F (71°C). Fish: 145°F (63°C). Verify with thermometer. |
| Freezer quality window | Most batch-cooked items maintain peak quality for 2-3 months. Safe beyond that but quality declines. |
```

---

## Rules

1. **Always start the timeline with the longest-cooking item.** Violating cascade order -- for example, starting grains before putting the oven protein in -- wastes the most valuable passive time. The longest item starts at 0:00 or within the first 5 minutes.

2. **Always include a use-by date (not just duration) for every stored item.** Saying "4 days" requires mental math at 6am on a Thursday. Writing "use by Wednesday" eliminates user error. Calculate based on prep day.

3. **Never recommend storing cooked poultry beyond 4 days refrigerated.** USDA guidance for cooked chicken is 3-4 days. Use the conservative end for batch prep because food often sits before the user starts eating it.

4. **Never recommend batch-cooking leafy greens, avocado, or fried foods.** These categories fail consistently in storage. If a user's existing plan includes these, correct it before producing a timeline.

5. **Always recommend slightly undercooking grains when batch cooking.** Grains continue to absorb liquid during storage and reheating. Fully cooked batch rice becomes mushy by day 3. This is the single most common quality complaint in meal prep.

6. **Never allow food safety gaps -- the 2-hour window is not negotiable.** If a user's described workflow would leave food out longer (e.g., cooking a large batch and portioning slowly over 3 hours), restructure the plan into batches or add explicit instructions to refrigerate promptly.

7. **Always store sauces and dressings separately from the food they accompany.** Pre-dressed foods deteriorate rapidly -- rice absorbs sauce and becomes soggy, greens wilt, proteins dry out from acid marinade. The sauce-on-the-side rule is the primary driver of good meal prep quality at day 4-5.

8. **Ground meat must be cooked seasoned lightly or plain when batch cooking for variety.** Ground meat cooked in taco seasoning can only become tacos. Ground meat cooked with only salt becomes infinitely adaptable. Always flag this when the user mentions pre-seasoning large protein batches.

9. **When using an Instant Pot or pressure cooker, account for pressure build and release time in the timeline.** A 12-minute pressure cook cycle on chicken thighs has 8-10 minutes of pressure build time and 10 minutes of natural release -- the total elapsed time is approximately 30 minutes. Failing to account for this makes the timeline inaccurate.

10. **Always advise against refrigerating hot food in large covered containers.** Hot food in a sealed, deep container cools extremely slowly, keeping the interior above 40°F for hours. The correct approach is: spread into shallow containers or sheet pans uncovered, cool at room temperature for no more than 30-40 minutes until the surface is no longer steaming, then refrigerate uncovered for 10 more minutes, then seal and stack.

11. **Cooked fish is always a "use first" protein -- never pair it with a late-week meal slot.** Fish degrades faster than other batch proteins in both safety and quality terms. Monday and Tuesday use only.

12. **Always recommend portioning before refrigerating, not after.** Containers that require returning to a large pot or container multiple times over the week are vectors for contamination and quality loss. One portioning session immediately after cooling is the correct workflow.

---

## Edge Cases

**Case 1: Only 45-60 minutes available for the entire prep session**
Reduce to a "core three" approach: one protein (sheet pan chicken thighs -- 40 minutes in oven, 5 minutes of hands-on), one grain (rice cooker running simultaneously -- 0 minutes of hands-on), and one batch of raw pre-chopped vegetables (10 minutes hands-on during oven passive time). This produces 4-5 lunches with approximately 15 minutes of actual hands-on work. Skip sauces entirely and recommend high-quality store-bought condiments (hummus, salsa, tahini) as sauce substitutes. Do not try to squeeze 3 hours of prep into 60 minutes -- the result is undercooked food, poor storage, and user burnout.

**Case 2: No oven available (stovetop only)**
Replace sheet pan proteins with: pan-seared chicken thighs (8-10 minutes per side in cast iron or stainless steel over medium-high heat, cover in final 5 minutes to cook through) or stovetop poached chicken (submerge in cold water, bring to 160°F, hold for 15 minutes -- results in extremely moist, easily shredded chicken). Replace roasted vegetables with steamed (broccoli, green beans: 5-7 minutes over boiling water) or sauteed in batches. Cooking sequentially rather than in parallel adds approximately 25-35 minutes to total elapsed time -- account for this in the timeline. Grains proceed normally on a second burner.

**Case 3: User wants to freeze everything (no refrigerator meals)**
This is a valid strategy for single people who travel mid-week or find mid-week meals falling through. Adjustments required: (1) Cool everything before portioning as normal. (2) Portion into freezer-safe containers or silicone bags, leaving ½-inch headspace for any liquid items. (3) Label with preparation date AND reheating instructions on every container. (4) Lay bags flat to freeze, then stand vertically to maximize space. (5) Note that frozen grains become slightly more textured -- undercook by 2 minutes before freezing, not 1. (6) Frozen cooked proteins reheat best by thawing overnight in the refrigerator then using standard microwave reheating -- skipping the thaw step and microwaving from frozen results in uneven heating with cold centers.

**Case 4: Very large batch (family of 4, full week of dinners = 20 portions)**
Scale requires breaking the session into two oven rotations because most home ovens can handle at most 2 sheet pans simultaneously. Rotation 1: proteins and first vegetable batch. Rotation 2: second vegetable batch and optional second protein variety. Total elapsed time expands to 2.5-3 hours. Recommend splitting the session across two days if possible -- proteins and grains on Day 1, vegetables and sauces on Day 2 (when proteins are still at day 1 of freshness). If doing in one session, start slow cooker or Instant Pot as a third cooking station from the beginning to run throughout.

**Case 5: User reports eating the same meal every day and finding it unbearable by Wednesday**
This is a flavor fatigue problem, not a batch cooking problem. The solution is not a smaller batch but a better variety architecture. Introduce the "3 sauces, 1 protein, 2 grain formats" rule: one plain-seasoned protein is cut three ways (sliced for bowls, shredded for wraps, diced for stir-fry), paired with two grain formats (e.g., rice and quinoa), and three sauce options (teriyaki, tahini, chimichurri). The same protein and grain batch yields 9 theoretically distinct meals. Additionally, recommend one completely different cold lunch option (grain salad format with raw vegetables and vinaigrette) alongside the hot meal format.

**Case 6: User has limited refrigerator space (small apartment fridge, college setting)**
Stackable flat containers are essential. Recommend portioning individual meals flat into standard rectangular containers that stack uniformly -- avoid round containers (wasted fridge corners) and variable-depth containers (unstable stacks). A single flat container stacking system can hold a 5-day supply in roughly the same fridge footprint as one takeout bag. Additionally, suggest the freezer-shelf method: freeze portions 3-5 in a flat stack and refrigerate only portions 1-2. Move a container from freezer to fridge each evening to thaw overnight.

**Case 7: User wants to include breakfast in the batch session**
Breakfast batch items add approximately 20-30 minutes to the session. Most breakfast batch items are passive-cook-friendly and can run as a fourth station. Best breakfast batch formats: overnight oats (assemble in mason jars the night before -- 5 minutes total, no cooking), egg muffins or mini frittatas (baked at 350°F in a muffin tin for 18-20 minutes -- can run as a second oven rotation after proteins are done), and homemade granola (baked at 325°F for 20-25 minutes stirring every 7 minutes). Hard-boiled eggs cover both breakfast and lunch protein needs simultaneously. Do not attempt to batch cook pancakes or French toast -- texture degrades significantly and reheating is poor.

**Case 8: User mentions a dietary restriction (gluten-free, dairy-free, vegetarian, vegan)**
Do not provide medical allergy management guidance. Do adjust batch item selection pragmatically. For vegetarian/vegan: replace animal proteins with batch-cooked dried beans from scratch (cheapest, highest yield), baked or pan-fried tofu (press for 20 minutes before cooking for best texture), and lentils. Lentils are the best batch legume -- no soaking required, 20-minute cook time, high protein, refrigerate 5 days. For gluten-free: replace pasta with rice, quinoa, or certified gluten-free oats. All other batch items in this skill are inherently gluten-free. Flag soy sauce in any teriyaki recipe -- suggest tamari as a direct gluten-free substitute.

---

## Example

**Input:** "I want to meal prep for the work week -- I need 5 lunches and 5 dinners for 2 people. I have about 2.5 hours on Sunday. We have an oven with two racks, a rice cooker, stovetop, and an air fryer. No dietary restrictions, but we're getting bored of eating the same thing every day."

**Output:**

## Batch Cooking Plan: 5 Lunches + 5 Dinners for 2 People

**Prep day:** Sunday
**Total active hands-on time:** approximately 75 minutes
**Total elapsed time:** 2 hours 20 minutes
**Equipment needed:** Oven (both racks in use), rice cooker, stovetop (2 burners), air fryer (as reheating tool during the week), 2 sheet pans, cutting board, chef's knife, instant-read meat thermometer, mixing bowls
**Containers needed:** 10 meal prep containers (5 lunches + 5 dinners, portioned for 2), 3 small mason jars for sauces, 1 medium container for raw vegetables

**Variety strategy for this plan:** One plain-seasoned roasted chicken batch and one batch of ground beef will serve as proteins across both lunch and dinner slots. Three different sauces and two grain types will create distinct meal experiences across all 10 meals.

---

### Prep-Day Cascade Timeline

| Elapsed Time | Task | Station | Hands-On Min | Notes |
|---|---|---|---|---|
| 0:00 | Preheat oven to 425°F. Start 3 cups white rice in rice cooker (will yield ~9 cups cooked). | Rice cooker | 2 | Rice will be done at ~0:25. Completely hands-free. |
| 0:02 | Pat dry and season 3 lbs boneless chicken thighs with olive oil, salt, pepper, garlic powder, smoked paprika. Place on lower oven rack. | Oven prep + oven | 8 | Hands-free after entering oven. Done at ~0:42. |
| 0:10 | Chop 2 heads broccoli, 2 bell peppers, 1 zucchini into 1-inch pieces. Toss with 2 tbsp olive oil and 1 tsp salt. Spread on upper oven rack sheet pan. | Counter + oven | 12 | Vegetables will cook 20-22 min. Done at ~0:32. |
| 0:22 | Cook 1.5 lbs ground beef in large skillet over medium-high heat. Season with only salt and black pepper -- no other seasoning. Break into small crumbles. | Stovetop | 10 | Plain-cooked ground beef is flexible for 3 different meal formats. Done at ~0:32. |
| 0:32 | Remove vegetables from oven. Spread on a clean sheet pan or large plate to cool. Remove and drain ground beef from skillet, spread in shallow bowl to cool. | Oven + stovetop | 3 | Do not cover yet -- cooling is the priority. |
| 0:35 | Make 3 sauces: (1) Teriyaki: combine 4 tbsp soy sauce, 2 tbsp rice vinegar, 1.5 tbsp honey, 1 tsp fresh grated ginger, 1 tsp cornstarch. Simmer 3 min until thickened. (2) Tahini dressing: whisk 4 tbsp tahini, 3 tbsp lemon juice, 1 clove garlic minced, 3 tbsp water, salt. (3) Chimichurri: blitz ½ cup parsley, 2 cloves garlic, 3 tbsp red wine vinegar, 4 tbsp olive oil, salt, pinch red pepper flakes -- no cooking required. | Stovetop (teriyaki) + counter (tahini, chimichurri) | 15 | Transfer each sauce to its own labeled mason jar while warm. Teriyaki thickens as it cools -- this is correct. |
| 0:50 | Wash and chop raw vegetables: 1 English cucumber, 1 cup cherry tomatoes (halved), 3 stalks celery. Store in one large container with a folded paper towel beneath. | Counter | 8 | These are for cold lunch salad formats mid-week. |
| 0:58 | Cook 2 cups quinoa on stovetop: 1:1.75 ratio with water, bring to boil, reduce to low simmer, cover 15 min. | Stovetop | 3 | Hands-free after setting to simmer. Done at ~1:13. |
| 1:01 | Remove chicken from oven. Verify 165°F internal temperature with thermometer. Spread onto cutting board and allow to rest -- do not cut yet. | Oven | 2 | Resting 10 min before slicing retains more moisture. |
| 1:03 | Portion rice: rice is now cooled enough. Measure into 5 meal containers (½ cup cooked rice per person = 1 cup per container for 2-person portions). | Counter | 6 | Do not seal lids yet -- food is still slightly warm. |
| 1:09 | Slice chicken thighs. Portion into 10 portions total: 5 for lunch containers (add to rice already in containers), 5 for dinner containers (set aside). | Counter | 8 | 3 lbs raw chicken thighs yields approximately 2.2-2.4 lbs cooked. Each of 10 portions = ~3.5 oz protein. |
| 1:17 | Portion roasted vegetables into containers: add to the 5 lunch containers (alongside chicken and rice). Reserve remaining vegetables for dinner containers. | Counter | 5 | |
| 1:22 | Quinoa is done. Spread briefly to cool. Then portion into 5 dinner containers (½ cup cooked quinoa per person = 1 cup per dinner container for 2). | Counter | 5 | |
| 1:27 | Add remaining chicken portions and roasted vegetables to dinner containers. Seal all 10 meal containers. Label: "Chicken + [rice/quinoa] + veg | Made 1/12 | Use by 1/16." | Counter | 8 | |
| 1:35 | Transfer ground beef into one large container. Label "Ground beef -- plain | Made 1/12 | Use by 1/16." This will be used for 2 dinner variations. | Counter | 2 | |
| 1:37 | Store all 3 sauces. Raw vegetable container goes in fridge. Final fridge organization: perishables (fish, if any) at eye level for "use first" visibility. | Counter + fridge | 5 | |
| **1:42 total elapsed** | | | **~97 min hands-on** | 18 min of remaining buffer before 2-hour mark |

---

### Batch Items, Quantities, and Storage

| Item | Batch Quantity | Total Servings (2-person meals) | Fridge Life | Use By | Container |
|---|---|---|---|---|---|
| Roasted chicken thighs (sliced) | ~2.3 lbs cooked | 10 individual | 4 days | Thursday | Portioned into meal containers |
| Ground beef -- plain | ~1.2 lbs cooked | 4-5 individual | 4 days | Thursday | One large sealed container |
| White rice (cooked) | ~9 cups | 5 two-person portions | 5 days | Friday | Portioned into lunch containers |
| Quinoa (cooked) | ~5 cups | 5 two-person portions | 7 days | Next Sunday | Portioned into dinner containers |
| Roasted broccoli, bell pepper, zucchini | ~6 cups | 10 individual | 5 days | Friday | Portioned across meal containers |
| Raw cucumber, tomato, celery | ~3 cups | 5 individual | 3 days | Wednesday | One large container with paper towel |
| Teriyaki sauce | ~4 oz | 5 servings | 10 days | Jan 22 | Mason jar |
| Tahini dressing | ~3 oz | 4 servings | 7 days | Jan 19 | Mason jar |
| Chimichurri | ~3 oz | 4 servings | 7 days | Jan 19 | Mason jar |

---

### Weekly Refrigerator Inventory and Priority Schedule

**Prepared:** Sunday January 12
**Use first (by Tuesday):** Raw vegetables (cucumber, tomato, celery) -- 3-day window
**Use by Thursday:** All chicken portions and ground beef (4-day cooked protein window)
**Full week window:** Quinoa portions, teriyaki sauce
**Move to freezer if not eaten by Wednesday:** Any chicken or ground beef portions beyond what's scheduled

---

### Weeknight Meal Assembly Guide

| Slot | Day | Components | Format | Assembly Method | Time |
|---|---|---|---|---|---|
| Lunch | Monday | Chicken + rice + roasted veg + teriyaki | Teriyaki rice bowl | Microwave chicken and rice 2.5 min at 70% power. Add veg. Drizzle teriyaki cold. | 7 min |
| Dinner | Monday | Chicken + quinoa + roasted veg + chimichurri | Chimichurri protein bowl | Microwave all together 2.5 min. Add chimichurri after heating. | 6 min |
| Lunch | Tuesday | Chicken + rice + raw vegetables + tahini | Cold grain salad | No heating needed. Layer rice, vegetables, chicken cold. Drizzle tahini. | 3 min |
| Dinner | Tuesday | Ground beef + quinoa + roasted veg + teriyaki | Asian-style ground beef bowl | Microwave ground beef 1.5 min, microwave quinoa 1.5 min. Combine, add sauce. | 6 min |
| Lunch | Wednesday | Chicken + rice + roasted veg + chimichurri | Rice bowl, different sauce | Microwave chicken and rice. Add roasted veg, top with chimichurri. | 7 min |
| Dinner | Wednesday | Ground beef + roasted veg + quinoa + tahini | Ground beef mezze bowl | Microwave ground beef and veg. Serve over quinoa. Tahini drizzle. | 7 min |
| Lunch | Thursday | Chicken + rice + roasted veg + teriyaki | Repeat of Monday format -- last chicken use | Reheat and add remaining teriyaki. Last day for chicken. | 7 min |
| Dinner | Thursday | Chicken + quinoa + any remaining veg + chimichurri | Protein bowl | Last chicken portions. Reheat all, add chimichurri. | 6 min |
| Lunch | Friday | Rice + remaining roasted veg + egg (cook fresh 5 min) | Fried rice | Pan-fry rice with egg in 1 tsp oil over high heat. Add vegetables. Soy sauce to taste. | 10 min |
| Dinner | Friday | Quinoa + remaining components + any fresh additions | Clean-out bowl | Use remaining quinoa and any vegetables. Add fresh ingredients if available. | 8 min |

**Sauce allocation summary:**
- Teriyaki: Monday lunch + Tuesday dinner + Thursday lunch = 3 uses
- Tahini: Tuesday lunch + Wednesday dinner = 2 uses
- Chimichurri: Monday dinner + Wednesday lunch + Thursday dinner = 3 uses
- Each sauce jar used proportionally throughout the week -- no single sauce dominates

---

### Reheating Quick Reference for This Plan

| Food | Method | Setting | Time | Critical Tip |
|---|---|---|---|---|
| Chicken thighs (sliced) | Microwave covered | 70% power | 2-2.5 min | Add 1 tbsp water to container; cover with damp paper towel -- prevents drying |
| Ground beef | Microwave uncovered | High | 1.5 min | Stir once halfway; do not overheat or texture becomes mealy |
| White rice | Microwave covered | High | 1.5-2 min | Sprinkle 1 tbsp water per cup before heating; mandatory step |
| Quinoa | Microwave covered | High | 1 min | Lighter than rice; heats quickly; add small water splash |
| Roasted vegetables | Air fryer | 375°F | 3-4 min | Strongly preferred -- restores original texture. Microwave acceptable (1.5 min) but softens |
| Any sauce | Do not heat | -- | -- | Always add sauce after reheating solids. Heating tahini or chimichurri kills aromatics |

---

### Food Safety Reference for This Session

| Rule | This Session |
|---|---|
| 2-hour room temperature limit | All items portioned and refrigerated by 1:42 -- well within window |
| Chicken internal temperature | Verified at 165°F before portioning |
| Cooling before sealing | All hot items spread on sheet pans or shallow bowls before portioning -- lids sealed only after no visible steam |
| Latest use dates | Chicken and ground beef: Thursday January 16. Rice: Friday January 17. Quinoa: Following Sunday. |
| Freezer option | If Thursday arrives and chicken portions remain, freeze immediately -- do not push to Friday. |
