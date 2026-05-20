---
name: pantry-staples-system
description: |
  Builds a complete pantry staples inventory organized by cuisine type, with
  rotation schedules, storage guidelines, and a restocking system. Covers core
  dry goods, canned essentials, oils, vinegars, spices, and condiments that
  enable cooking any weeknight meal without a special grocery trip. Use when the
  user asks about stocking a pantry, essential ingredients to keep on hand,
  building a spice collection, or creating a pantry restocking routine. Do NOT
  use for meal planning (use meal-prep-workflow), recipe-specific ingredient
  lists, or food storage safety (use food-storage-safety).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking meal-planning planning"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Pantry Staples System

## When to Use

**Use this skill when the user:**
- Is stocking a pantry from scratch -- first apartment, after a move, after a long period of not cooking at home
- Asks what ingredients they should always have on hand to cook without planning ahead
- Wants to build a spice collection systematically without buying 30 spices that expire before being used
- Asks how long pantry items last, when to throw them out, or how to tell if something is still good
- Wants a restocking routine so they stop running out of staples mid-recipe
- Has a specific cuisine focus (Italian, Mexican, South Asian, East Asian, Mediterranean, West African) and wants to stock for that style
- Is trying to reduce grocery trips by maintaining a functional pantry baseline
- Asks specifically about oils, vinegars, canned goods, dried legumes, grains, or condiments as a collection rather than a single ingredient

**Do NOT use this skill when:**
- The user needs a weekly or monthly meal plan -- use `meal-prep-workflow` instead
- The user has a specific recipe and needs a shopping list -- this skill does not work at the recipe level
- The user asks about food safety, refrigeration temperatures, or how to know if cooked food has gone bad -- use `food-storage-safety`
- The user wants batch cooking or meal prep strategies -- use `meal-prep-workflow`
- The user is asking about a single ingredient (e.g., "how do I use miso?") -- answer directly without invoking the full pantry system
- The user's question is about produce, meat, dairy, or any refrigerated item as a primary concern -- this skill covers shelf-stable goods, not perishables

---

## Process

### Step 1: Gather the Cooking Profile (Before Recommending Anything)

Do not output a pantry list without first understanding the user's profile. Ask for the following in a single message to avoid back-and-forth:

- **Cuisines cooked most often:** The single most important input. A South Asian-focused pantry and a Mexican-focused pantry overlap by only about 40%. Prompt with concrete examples: Italian, Mexican, South Asian (Indian/Pakistani/Sri Lankan), East Asian (Chinese/Japanese/Korean), Southeast Asian (Thai/Vietnamese), Mediterranean/Middle Eastern, West African, or "general American comfort food."
- **Household size and eating patterns:** 1 person cooking 4x/week uses spices slowly -- buying whole spices instead of ground becomes more important to prevent potency loss. A household of 4 cooking daily can buy ground spices in larger quantities and use them quickly enough.
- **Dietary requirements:** Gluten-free changes grains and condiments significantly (soy sauce, flour, some stocks). Vegan/vegetarian changes protein staples and broth base. Nut allergies affect oils and some condiments. Dairy-free rarely affects dry pantry goods but matters for some condiments.
- **Budget priority:** Three tiers -- (1) bare minimum functional ($35-50 to start), (2) balanced practical ($70-100 to start), (3) well-invested ($120-160 to start, with quality oils, specialty items, and full spice set).
- **Current pantry state:** Starting from zero, partially stocked but disorganized, or has a decent base but wants a system for restocking and rotation.
- **Kitchen storage situation:** A small apartment kitchen with one cabinet requires a different strategy than a dedicated pantry closet. This determines how much quantity to stock at once.

### Step 2: Define the Pantry Foundation Layer (Cuisine-Neutral)

Every functional pantry -- regardless of cooking style -- requires the same foundation. Present this as the non-negotiable baseline that the cuisine-specific layer builds on top of:

**Fats and Acids (the flavor backbone of almost every dish):**
- A neutral high-heat oil: refined avocado oil (smoke point ~520°F/270°C) or refined sunflower/canola oil (~400-450°F/205-230°C). Used for sautéing, frying, roasting. One 32-48 oz bottle lasts 4-8 weeks at normal cooking frequency.
- A finishing or low-heat oil: extra virgin olive oil for Mediterranean/Italian, toasted sesame oil for Asian, or a high-quality neutral oil. Used in dressings, finishing, or at the end of cooking -- never heated to smoking point, which destroys flavor compounds.
- At minimum two vinegars: one bright and clean (white wine or rice vinegar, pH ~2.4-2.6), one rich and rounded (red wine or apple cider vinegar, pH ~3.0-3.5). These serve different flavor functions and are not interchangeable.

**Salt and Its Variants (the most important pantry item):**
- Kosher salt (Diamond Crystal or Morton -- these are NOT interchangeable by volume; Diamond Crystal is 50% less dense than Morton, meaning 1 tsp Diamond Crystal ≈ 0.5 tsp Morton by weight). Use for all cooking.
- Fine sea salt or table salt for baking, where precise measurement matters.
- Soy sauce or tamari serves as a liquid salt in many cuisines and adds umami that dry salt cannot.

**Aromatics Base (dry forms for pantry stability):**
- Garlic powder and onion powder: do not replace fresh garlic and onion, but serve a distinct role in dry rubs, spice blends, and quick seasoning. 1 tsp garlic powder ≈ 2-3 cloves fresh for potency but different character.
- Whole black peppercorns with a grinder (pre-ground pepper loses 90% of volatile oils within days; a $10 grinder is a worthwhile investment).
- Bay leaves: underrated, used in virtually every braise, soup, bean pot, or stock. Dried bay has a 1-2 year potency window; dried but old bay smells like paper, not herbs.

**Canned and Jarred Foundation:**
- Crushed and diced tomatoes: the single most versatile canned good. San Marzano-style tomatoes are sweeter and less acidic -- worth the price difference for long-cooked sauces. Regular diced or crushed works well for everything else.
- Tomato paste: sold in 6 oz cans or tubes. The tube is significantly more practical -- opened tubes last 6-8 weeks in the fridge versus 7-10 days for an opened can. Tomato paste is cooked (caramelized) before liquid is added -- this step is not optional, it converts harsh raw tomato flavor into deep savory sweetness in about 2-3 minutes over medium-high heat.
- Stock or broth (chicken, vegetable, or beef depending on dietary needs): 32 oz cartons. Once opened, store in the fridge and use within 4-5 days, or freeze in 1-cup portions in zip bags.
- Canned coconut milk (full fat): used in South Asian curries, Thai dishes, West African stews, and even some desserts. One can typically serves 2-4 people. Full fat is not interchangeable with "lite" in most applications -- the fat content is what creates sauce body.

**Dry Grains and Legumes:**
- Long-grain white rice: the most versatile cooking grain. Shelf life of 2-4 years in an airtight container. Brown rice has a shelf life of only 6 months due to oil in the bran layer turning rancid -- do not stock large quantities.
- Dried pasta in 2-3 shapes: a long shape (spaghetti or linguine), a short ridged shape (rigatoni or penne -- ridges hold chunky sauces), and optionally a small shape (orzo or ditalini for soups). Dried pasta lasts 2+ years.
- Dried lentils (green, brown, or red): the fastest-cooking dried legume (15-20 minutes), requiring no soaking. Red lentils dissolve into a creamy texture ideal for dal and soups. Green/brown hold their shape for salads and stews. 1 cup dried yields approximately 2.5 cups cooked.
- Canned beans (2-3 types): canned beans cost 3-4x more per serving than dried but require zero planning. Keep both. Dried beans require 8-12 hours soaking plus 1-2 hours cooking. Canned beans require rinsing (reduces sodium by ~40%) and 10 minutes to heat through. Black beans, chickpeas, and cannellini/white beans cover the widest range of cuisines.

**Baking and Thickening Agents:**
- All-purpose flour: 5 lb bag stored in an airtight container with a tight-fitting lid. Prevents flour beetles (Tribolium confusum) which are the most common pantry pest. Flour lasts 6-12 months in a container; whole wheat flour lasts only 3-6 months due to the germ oil going rancid.
- Cornstarch: for thickening Asian sauces, gravies, pie fillings. 2 tsp cornstarch mixed with 2 tbsp cold water creates a slurry that thickens 1 cup of liquid to a sauce consistency. Unlike flour, it thickens without adding flavor.
- Baking soda and baking powder: required for most baked goods. Test baking soda by adding 1/4 tsp to 2 tbsp warm water -- it should bubble vigorously within 5 seconds. Test baking powder by adding 1 tsp to 1/2 cup hot water -- it should bubble immediately. Replace both every 6 months for reliable baking results.

**Sweeteners:**
- Granulated white sugar: shelf life indefinite in an airtight container. Hard sugar is not spoiled -- add a terra cotta sugar saver or a piece of bread to rehydrate.
- Honey: shelf life is literally indefinite (archeologists have found edible honey in Egyptian tombs). Crystallized honey is not spoiled -- place the jar in warm water (100-110°F/38-43°C) for 15-20 minutes to reliquefy.

### Step 3: Build the Cuisine-Specific Layer

Based on the user's stated cuisines, identify the 8-15 items that move from "the pantry is functional" to "the pantry enables authentic flavor." These are organized below by cuisine cluster:

**Italian/Mediterranean:**
- Dried oregano and dried basil (Italian) vs. fresh herbs where possible. Dried herbs release flavor best when added early to oil or sauce; fresh herbs added at the end.
- Red pepper flakes: shelf life 2-3 years. The key heat component in Italian cooking. Start with 1/8 tsp for warmth, 1/4 tsp for noticeable heat.
- Capers: packed in brine (preferred) or salt. Brine-packed last 1 year in fridge after opening. Used in puttanesca, piccata, and Mediterranean salads.
- Anchovy paste or oil-packed anchovy fillets: dissolves invisibly in hot oil in 2-3 minutes, leaving no "fishy" flavor -- only deep savory umami. This is the secret to depth in countless Italian sauces.
- Pasta water (technique, not an ingredient): reserve 1-2 cups before draining. The starch-loaded water emulsifies with oil and cheese to create sauce body without cream. Pasta water is so important it should be treated as an ingredient.
- Quality tinned whole peeled tomatoes: for slow sauces where you crush them by hand. The difference between whole peeled and crushed is texture control.

**Mexican/Central American:**
- Ground cumin: the dominant spice signature of Mexican cooking. Toast it in dry pan for 30-60 seconds to intensify flavor before adding to oil or other spices.
- Ancho chili powder and chipotle: ancho provides deep, sweet, mild heat with raisin-like undertones. Chipotle provides smoky heat. These are very different from generic commercial "chili powder" (which is a blend). Used together, they replicate enchilada sauce character without a separate sauce purchase.
- Canned chipotles in adobo sauce: the most versatile Mexican pantry item. The chipotles are smoked, dried, then canned in a tomato-vinegar sauce. Use 1-2 peppers for heat; use the sauce alone for smokiness without heat. Freeze unused chipotles individually on a sheet pan then transfer to a bag -- they last 3 months frozen.
- Dried oregano (Mexican oregano if available): Mexican oregano is from the verbena family and has a more citrusy, less anise-like character than Mediterranean oregano. They are not interchangeable in traditional recipes but overlap acceptably in most applications.
- Masa harina (corn flour treated with lime/nixtamal process): for corn tortillas, tamales, and as a thickener for soups. Cannot be substituted with regular cornmeal -- nixtamalization changes the nutritional profile and flavor completely.
- Hot sauce (vinegar-based style): both a table condiment and a cooking acid.

**South Asian (Indian/Pakistani/Sri Lankan):**
- Garam masala: a finishing spice blend added at the end of cooking, not the beginning. Different from curry powder, which is used as a cooking spice throughout. Quality garam masala should smell complex -- if it just smells dusty, it is expired.
- Ground turmeric: used in small amounts (1/4-1/2 tsp) as a background color and anti-inflammatory note. It stains immediately and permanently -- use caution on wooden cutting boards and light surfaces.
- Ground coriander and ground cumin (both): the base of most South Asian tempering. Used at a ratio of approximately 2:1 coriander to cumin in most North Indian-style cooking.
- Whole mustard seeds and cumin seeds (for tadka/tempering): the technique of blooming whole spices in hot oil (ghee preferred) for 30-60 seconds before adding aromatics transforms flavor completely. Mustard seeds should pop within 20-30 seconds in 350°F/175°C oil.
- Ghee (clarified butter): smoke point ~485°F/250°C, much higher than regular butter. Shelf-stable unopened for 6-12 months; refrigerate after opening. Used as the primary cooking fat in South Asian cooking.
- Dried red chili peppers (whole): Kashmiri chilies for color and mild heat; bird's eye for intense heat. Store whole for 1-2 years.
- Canned diced tomatoes with no added salt: used as a sauce base in most North Indian curries, added after aromatics are cooked and before spices are added.

**East Asian (Chinese/Japanese/Korean):**
- Soy sauce (Chinese or Japanese style) and tamari (gluten-free, slightly richer): these are not interchangeable by cuisine but functionally serve the same role of salty umami liquid. Chinese-style soy sauce is saltier and thinner; Japanese-style (shoyu) is slightly sweeter.
- Rice vinegar (unseasoned): essential for dressings, pickling, and sauce balance. Do not buy "seasoned" rice vinegar for cooking (it contains sugar and salt that upset recipe balance).
- Toasted sesame oil: ONLY added at the end of cooking. It burns at moderate heat and becomes bitter. Used as a finishing oil, not a cooking oil.
- Mirin (sweet rice wine): adds gloss and subtle sweetness to Japanese-style glazes, teriyaki, and dressings. Shelf life 3-6 months after opening.
- Oyster sauce: for Chinese-style stir-fries and braises. Adds thick, sweet-savory umami depth. 1-2 tbsp transforms simple stir-fried vegetables completely.
- Gochujang (Korean fermented chili paste): complex heat, not just spice -- the fermentation adds malty, slightly sweet depth. Used in bibimbap, stews, marinades, and as a condiment. Refrigerate after opening; lasts 6-12 months.
- Sesame seeds (white): used for finishing texture and visual appeal. Toast in dry pan 2-3 minutes until golden -- they go from white to golden to burnt in seconds.
- Dried shiitake mushrooms: make an umami-rich stock in 20 minutes, or rehydrate and add directly to soups. The soaking water is the stock -- do not discard it.

**West African:**
- Scotch bonnet or habanero powder (or fresh as needed): the heat signature of West African cooking. Separate from cayenne -- they have distinct fruity heat character.
- Crayfish powder (dried shrimp): an intense umami base used in small amounts (1/2-1 tsp) in soups, stews, and rice dishes. Shelf life 6-12 months.
- Tomato paste: used in larger quantities than in Italian cooking, often 3-4 tbsp per dish as a flavor base.
- Palm oil (red palm oil): the traditional cooking fat with a distinctive earthy flavor. Used in small amounts (2-3 tbsp) as a base or finishing fat. Note: refined palm oil is neutral; red palm oil has the characteristic flavor.
- Ground egusi (melon seeds) or stockfish: for soup bases. These are specialty items that shift this from a general pantry to a specifically West African one.

### Step 4: Assign Shelf Life, Storage Rules, and Freshness Tests

For every category, give specific actionable guidance rather than just a number:

**Spice Freshness Testing -- the Rub Test:**
Rub a pinch of a dried herb or ground spice between your fingers. If it releases a strong aroma within 2-3 seconds, it is still potent. If it smells faintly vegetal, like old dried grass, or like nothing at all, replace it. Ground spices: 6-12 months of viable potency. Whole spices: 2-3 years. Dried leafy herbs (oregano, basil, thyme, bay): 1-2 years. Seeds (cumin, coriander, fennel, mustard): 3-4 years whole.

**Oil Freshness Testing -- the Smell Test:**
Rancid oil smells distinctly like crayons, oil paint, or stale nuts. This is caused by oxidation of fatty acids. Rancid oil is not acutely dangerous but contains harmful oxidized lipids and tastes terrible. Protect oils by: storing in dark containers or a dark cabinet (NOT next to the stove), tightly sealing caps after each use, and not decanting into open containers. Extra virgin olive oil should smell grassy, fruity, or peppery -- not musty. Shelf life after opening: 3-6 months for EVOO; 6-12 months for neutral oils.

**Whole Grain and Flour Rancidity:**
Whole grain flours (whole wheat, almond flour, oat flour) contain natural oils in the germ that oxidize. Signs of rancid flour: slight chemical smell, yellowish color. All-purpose white flour has no germ oil and does not go rancid, but it can become infested with flour beetles -- an airtight container is mandatory. Freeze flour in sealed bags for 48 hours before transferring to pantry containers to kill any existing beetle eggs.

**Canned Good Shelf Life -- Reality Check:**
"Best by" dates on canned goods are quality dates, not safety dates. USDA research shows most commercially canned goods are safe indefinitely as long as the can is not bulging, leaking, severely dented (especially on seam lines), or showing rust that penetrates the interior. Quality does degrade: texture softens and flavors mellow. For practical purposes: consume within 2-5 years of the "best by" date for best flavor. Discard any can that is bulging (indicator of Clostridium botulinum activity -- this is the one true safety concern with canned goods).

### Step 5: Design the Cuisine-Specific Spice Build in Phases

For the user's stated cuisines, map a specific phased approach. The general structure:

**Phase 1 (Day 1, $15-25 for 6-8 spices):** The spices that appear in 70%+ of recipes in that cuisine. These are the non-negotiables.
**Phase 2 (2-4 weeks later, $12-18 for 5-6 spices):** Spices that expand range to 90% of recipes but are used less frequently.
**Phase 3 (As needed, $15-25):** Specialty spices that serve one or two recipe categories -- buy them when a specific recipe calls for them, not before.

This phased approach prevents spending $60-80 on spices that sit unused. Ground spices degrade in as little as 6 months -- buying 20 spices at once guarantees that half will expire before being used regularly by a household cooking 3-4 times per week.

### Step 6: Create the Restocking System

A functional restocking system has three components:

**Component 1 -- The Trigger Rule (immediate, automatic):**
The moment you use the last of any staple, it goes on the shopping list before you finish cooking. The psychological trap is that you use the last can of tomatoes, think "I'll remember," and forget. Create friction-reduction: a whiteboard or magnetic notepad on the fridge is more effective than a phone app for most people because there is zero barrier to adding something while your hands are covered in food. The rule: open the second-to-last unit, not the last unit, as your restock trigger. This gives you a 1-unit buffer.

**Component 2 -- The Weekly Scan (60-90 seconds):**
When writing the weekly grocery list, open the pantry, refrigerator door, and spice drawer in sequence. Do not inventory everything -- just scan for anything below the 2-unit threshold. Items below threshold go on the grocery list. This should take no more than 90 seconds and eliminates mid-week emergency trips.

**Component 3 -- The Quarterly Audit (15-20 minutes, 4x per year):**
Pull everything out of one pantry section at a time. Check: (1) expiration dates -- items expiring in the next 60 days move to the front row and a note goes in the kitchen to cook with them, (2) spice potency -- apply the rub test to every spice and discard anything that fails, (3) pest inspection -- check for any tiny flour beetles, weevils, or webbing in grains (flour, cornmeal, and oats are most vulnerable), (4) can integrity -- check for bulging, severe dents, or rust. Take stock of what you are NOT using and consider removing it from the standard restock list.

**FIFO (First In, First Out) Execution:**
New purchases always go BEHIND existing stock. This is standard commercial kitchen practice. The practical method at home: when restocking pasta, pull all existing boxes to the front, add the new boxes behind. For canned goods, remove all cans, add the new cans on the bottom or back, replace older cans in front. This takes an extra 30 seconds per item and effectively prevents ever finding a 4-year-old can of chickpeas behind newer ones.

### Step 7: Calculate Initial Investment and Ongoing Costs

For each budget tier, give realistic estimates segmented by category. The goal is to prevent sticker shock while helping the user plan. Distinguish between one-time startup costs and ongoing monthly replenishment:

**Bare minimum functional pantry ($35-55):**
10-12 core items enabling 10-15 meals. No specialty items. Phase 1 spices only (5-6 total). One oil, one vinegar. Sufficient for a person cooking 2-3x per week on a tight budget.

**Balanced practical pantry ($70-110):**
Full core staples list, Phase 1 and 2 spices, cuisine-specific additions for 1-2 cuisines. Enables 20-25 meals without special trips. One-time investment; ongoing replenishment runs $20-35/month for pantry staples alone (separate from fresh groceries).

**Well-invested pantry ($130-175):**
Full core staples, Phase 1-3 spices for 2-3 cuisines, quality oils and vinegars, specialty condiments (fish sauce, miso paste, harissa), multiple bean and grain varieties. Enables cooking virtually any cuisine without special trips. Ongoing replenishment: $30-45/month.

---

## Output Format

```markdown
## Pantry Staples System

**Cooking Profile:** [cuisines, e.g., Italian + South Asian]
**Household:** [size and cooking frequency, e.g., 2 people, cooking 4x/week]
**Dietary Requirements:** [any restrictions]
**Budget Tier:** [Bare Minimum / Balanced / Well-Invested]
**Starting Point:** [From scratch / Partially stocked / System refresh]

---

### Layer 1: Foundation Pantry (All Cuisines)

| Category | Item | Stock Quantity | Shelf Life (Stored Correctly) | Storage Method | Notes |
|----------|------|---------------|------------------------------|----------------|-------|
| High-heat oil | Neutral refined oil (avocado or sunflower) | 32-48 oz | 6-12 months open | Dark cabinet, away from stove | Used for sautéing, roasting, frying |
| Finishing oil | Extra virgin olive oil | 16-25 oz | 3-6 months open | Dark bottle or dark cabinet | Not for high heat; for dressings and finishing |
| Acid/vinegar | White wine or rice vinegar | 1 bottle | 2+ years | Pantry shelf | Bright acid; salad dressings, deglazing |
| Acid/vinegar | Red wine or apple cider vinegar | 1 bottle | 2+ years | Pantry shelf | Richer acid; braises, marinades |
| Salt | Kosher salt | 3 lb box | Indefinite | Near stove in open container | [Note Diamond Crystal vs. Morton volume difference] |
| Pepper | Whole black peppercorns | 1-2 oz jar | 2-3 years | Spice drawer | Grind fresh; pre-ground loses potency in days |
| Canned | Crushed tomatoes (28 oz) | 4-6 cans | 2-5 years | Pantry shelf; opened: fridge 5-7 days | San Marzano style for slow sauces |
| Canned | Diced tomatoes (14.5 oz) | 3-4 cans | 2-5 years | Pantry shelf | Use for quick sauces and soups |
| Canned | Tomato paste | 2-3 tubes (preferred) or 6 oz cans | 2-5 years; opened tubes: fridge 6-8 weeks | Pantry/fridge | Always caramelize 2-3 min in oil before adding liquid |
| Canned | Stock/broth (32 oz cartons) | 3-4 cartons | 1-2 years; opened: fridge 4-5 days or freeze in 1-cup portions | Pantry | Match to dietary needs: chicken/vegetable/beef |
| Canned | Coconut milk, full fat (14 oz) | 3-4 cans | 2-5 years | Pantry shelf | Full fat only; "lite" does not create sauce body |
| Dry protein | Dried lentils (red + green/brown) | 1 lb each | 2-3 years | Airtight container | Red = 15-20 min, no soak; green/brown hold shape |
| Dry protein | Canned chickpeas | 4-6 cans | 2-5 years | Pantry shelf; opened: fridge 3-5 days | Rinse to reduce sodium ~40% |
| Dry protein | Canned black beans | 4-6 cans | 2-5 years | Pantry shelf | Same as above |
| Dry protein | Canned white beans (cannellini or navy) | 3-4 cans | 2-5 years | Pantry shelf | Soups, Italian dishes, smashed on toast |
| Grain | Long-grain white rice | 4-5 lb | 2-4 years | Airtight container | Do not stock large brown rice quantities -- goes rancid in 6 months |
| Grain | Dried pasta (spaghetti + penne + small shape) | 3-4 boxes each | 2+ years | Original box or airtight container | 1 lb = 4 servings |
| Baking | All-purpose flour | 5 lb | 6-12 months | Airtight container (pest barrier) | Freeze new bag 48 hrs before storing to kill beetle eggs |
| Baking | Cornstarch | 1 lb box | 2-3 years | Airtight container | Thickener: 2 tsp + 2 tbsp cold water thickens 1 cup liquid |
| Baking | Baking soda | 1 box | Replace every 6 months for baking | Pantry | Test: 1/4 tsp in warm water should bubble vigorously |
| Baking | Baking powder | 1 can | Replace every 6 months | Pantry | Test: 1 tsp in hot water should bubble immediately |
| Sweetener | Granulated sugar | 2-4 lb | Indefinite | Airtight container | Hard sugar = not spoiled; rehydrate with terra cotta disk or bread slice |
| Sweetener | Honey | 1 jar (16 oz) | Indefinite | Pantry | Crystallized = not spoiled; warm jar in water bath to reliquefy |
| Umami liquid | Soy sauce or tamari | 1 bottle | 2-3 years; opened: 1 year at room temp or 2 years refrigerated | Pantry | Tamari = gluten-free alternative; slightly richer flavor |
| Aromatics (dry) | Garlic powder | 1 jar | 6-12 months potency | Spice drawer | Supplement to fresh garlic, not replacement |
| Aromatics (dry) | Onion powder | 1 jar | 6-12 months potency | Spice drawer | Dry rubs, quick weeknight seasoning |

---

### Layer 2: Cuisine-Specific Additions

#### [Cuisine 1 Name, e.g., Italian/Mediterranean]

| Item | What It Enables | Use Method | Shelf Life |
|------|----------------|-----------|-----------|
| [item] | [specific dishes and flavor function] | [how to use it correctly] | [duration] |

#### [Cuisine 2 Name]

| Item | What It Enables | Use Method | Shelf Life |
|------|----------------|-----------|-----------|
| [item] | [specific dishes and flavor function] | [how to use it correctly] | [duration] |

---

### Layer 3: Spice Collection -- Phased Build

**Phase 1 (Buy now, ~$15-25 for [X] spices):**
These appear in 70%+ of your cuisine's recipes. Non-negotiable.
1. [Spice] -- [specific use case and dose guidance]
2. [Spice] -- [specific use case and dose guidance]
[...continue through 6-8 spices]

**Phase 2 (Buy after 2-4 weeks of cooking, ~$12-18 for [X] spices):**
5. [Spice] -- [specific use case and dose guidance]
[...continue through 5-6 spices]

**Phase 3 (Buy when a specific recipe calls for them):**
- [Spice]: [category of recipes that need it]
- [Spice]: [category of recipes that need it]

**Freshness Rule:** Apply the rub test before cooking -- rub a pinch between your fingers. Strong aroma = potent. Dusty or no aroma = replace. Whole spices (seeds, dried chiles, bay leaves) last 2-3 years. Ground spices: 6-12 months of real potency.

---

### Restocking System

**The Trigger Rule:**
When you open the second-to-last unit of any staple (second-to-last can of tomatoes, second-to-last box of pasta), add the item to your shopping list. Never wait until the last unit.

**Weekly Scan (60-90 seconds during grocery list creation):**
Scan the pantry, spice drawer, and canned goods section. Anything below 2-unit threshold goes on the list.

**FIFO Protocol:**
New purchases go BEHIND existing stock. Pull old items forward when restocking.

**Quarterly Audit Checklist:**
- [ ] Pull everything out by section, check expiration dates
- [ ] Move items expiring within 60 days to front row; plan to cook with them
- [ ] Rub-test all spices; discard anything that fails
- [ ] Inspect grains for signs of flour beetles or weevils (webbing, tiny insects)
- [ ] Check all cans for bulging, deep seam dents, or penetrating rust
- [ ] Note any items not used in 6 months -- consider removing from standard restock list

---

### Initial Investment Estimate

| Category | Bare Minimum | Balanced Practical | Well-Invested |
|----------|-------------|-------------------|--------------|
| Foundation dry goods (grains, legumes, baking) | $12-18 | $18-28 | $25-35 |
| Canned goods (tomatoes, beans, broth, coconut milk) | $15-20 | $22-30 | $28-40 |
| Oils and vinegars | $8-12 | $14-20 | $20-30 |
| Phase 1 spices (6-8 spices) | $12-18 | $15-20 | $18-25 |
| Phase 2 spices (5-6 additional) | -- | $12-18 | $15-20 |
| Cuisine-specific additions | $8-12 | $15-22 | $22-30 |
| Specialty condiments | -- | -- | $15-25 |
| **Total (one-time setup)** | **$55-80** | **$96-138** | **$143-205** |
| **Ongoing monthly replenishment** | **$15-20** | **$22-35** | **$30-45** |
```

---

## Rules

1. **Never present the full pantry list without gathering the cooking profile first.** A South Asian pantry requires ghee, mustard seeds, turmeric, and garam masala. A Mexican pantry requires masa harina, chipotles in adobo, and ancho chili. Presenting one list for all cuisines wastes the user's money on things they will not cook with.

2. **The spice phase rule is non-negotiable for beginners.** Ground spices bought in phase-3 quantities before the user has established a cooking routine will expire at 6-12 months, wasting $30-50 and discouraging the user. Emphasize building in phases and buying specialty spices only when a specific recipe calls for them.

3. **Distinguish between Diamond Crystal and Morton kosher salt by name and volume.** They are not the same density. A recipe calling for "1 tbsp kosher salt" written using Diamond Crystal will be significantly over-salted if the user has Morton (50% denser). If the user's salt brand is unknown, recommend weighing salt (1 tsp kosher salt = approximately 4-6g depending on brand) rather than measuring by volume.

4. **Tomato paste must be cooked (caramelized) before liquid is added -- always mention this technique.** Most beginner cooks add tomato paste to liquid directly, which produces a raw, slightly tinny, harsh tomato flavor. Cooking it in oil for 2-3 minutes over medium-high heat until it darkens slightly is the difference between a flat sauce and a deep one.

5. **Toasted sesame oil is a finishing oil, never a cooking oil.** It burns at moderate heat (~350°F/175°C, far below its labeled smoke point) and turns bitter. This is one of the most common cooking mistakes in home East Asian cooking. It goes in after heat is off or just before serving.

6. **Canned good safety: only bulging cans are a true safety hazard, not dented or expired ones.** Distinguish quality degradation (texture, flavor changes over time -- safe to consume) from safety issues (bulging = possible C. botulinum = discard without opening). Do not alarm users about mildly dented cans or dates 1-2 years past "best by" on properly stored cans.

7. **Brown rice has a 6-month shelf life, not a 2-year shelf life.** The germ oil in brown rice oxidizes and goes rancid. Many sources incorrectly list brown rice alongside white rice in shelf life charts. Only recommend brown rice stocking if the user cooks it frequently enough to use a 2-5 lb bag within 3-4 months.

8. **The "tube over can" recommendation for tomato paste is a practical quality-of-life improvement.** Opened cans of tomato paste require transferring to a container, last only 7-10 days, and produce waste when only 1-2 tbsp are needed per recipe. Tubes last 6-8 weeks refrigerated and dispense in tablespoon increments. This is worth specifying.

9. **EVOO should NEVER be stored next to the stove or in a clear bottle on the counter.** Heat, light, and air are the three enemies of olive oil quality. Many home kitchens have an olive oil bottle sitting in the worst possible location (clear glass, next to the stove). Rancid olive oil costs the same as fresh but tastes terrible and contains oxidized lipids. Specify storage location explicitly.

10. **Vegetarian/vegan pantries require a protein architecture that mirrors meat's role.** Simply removing meat and not replacing the protein staples creates nutritional gaps and meals that feel incomplete. A vegan pantry should have 4-5 protein staples: dried lentils, 3-4 types of canned beans, dried chickpeas, tahini (sesame paste), and nutritional yeast (for cheesy/umami notes in sauces). Each of these occupies a different flavor and texture role that a single can of black beans cannot cover.

---

## Edge Cases

**Starting from absolute zero (first apartment, never cooked consistently):**
Do not present the full pantry list -- it will be overwhelming and expensive. Instead, use a "build from a single meal" approach: identify 3 meals the user already knows how to make or wants to learn, then stock only the ingredients to make those 3 meals. The overlapping staples across those 3 meals are the actual starting pantry. A person who wants to make pasta with marinara, fried rice, and black bean tacos will end up with 80% of the foundational pantry naturally through those three recipes. Phase 1 spices only (5-6), one oil, one vinegar, and only the canned goods those recipes need. Initial cost: $35-55. Expand as cooking range expands.

**Gluten-free household:**
This requires systematic cross-referencing, not just swapping pasta. Changes by category: (1) Grains -- replace wheat pasta with rice pasta or chickpea pasta (note: chickpea pasta holds its texture better than rice pasta and provides more protein); replace all-purpose flour with a 1:1 gluten-free baking blend for general use, or specific alternative flours per application (almond flour for dense baked goods, oat flour for softer baked goods, rice flour for frying). (2) Condiments -- replace standard soy sauce with tamari (check label for "certified gluten-free" -- some tamari brands still contain trace wheat). Worcestershire sauce often contains wheat -- use gluten-free versions. Many hot sauces are naturally gluten-free. (3) Canned goods -- some canned soups, stocks, and sauces contain wheat starch, modified food starch, or barley -- read labels on every canned product. Malt vinegar (found in some chip seasonings and relishes) contains gluten; replace with apple cider vinegar.

**Small kitchen with minimal storage (studio apartment, galley kitchen):**
Reduce standard quantities by 50% and increase shopping frequency from every 2 weeks to every 1 week. Apply "multi-tasker" principle aggressively: cumin works in Mexican, South Asian, and Middle Eastern food -- one jar serves multiple cuisines. Smoked paprika works in Spanish, Mexican, and general American cooking. Soy sauce works in Asian, American, and even Italian (adds umami depth). Rice vinegar can substitute for white wine vinegar in most applications. Limit to 2 oils maximum (one neutral high-heat, one specialty). Use magnetic spice tins mounted inside cabinet doors to recover horizontal shelf space. A full functional pantry for one person can fit in a 24x12-inch shelf space if organized vertically using shelf risers and uniform containers.

**Multiple cuisines from very different flavor worlds (e.g., user cooks both South Asian and Italian):**
Identify the overlap first: both use canned tomatoes, onions, garlic, olive oil, canned legumes, dried herbs. The divergent items are: South Asian requires ghee, mustard seeds, turmeric, garam masala, curry-building spices, and canned coconut milk. Italian requires pasta, Parmesan, capers, anchovies, red wine vinegar, and red pepper flakes. There is no conflict -- these items coexist. Budget for Phase 1 spices for BOTH cuisines simultaneously (~$28-35) rather than phasing them separately, because the user is already cooking both.

**User says "I cook everything" or has no clear cuisine preference:**
This is a trap -- do not try to stock for every cuisine at once. Redirect: "Cooking everything is great, but pantries that try to cover every cuisine end up with 40 half-used ingredients. Which 2-3 cuisines do you cook most often, and which ones do you tend to follow recipes for versus improvise?" Most home cooks, when pressed, have a clear primary cuisine (the one they make without a recipe) and 1-2 secondary ones. Stock fully for the primary, partially for the secondary.

**User has a significant other, housemates, or family members with conflicting dietary restrictions:**
Create separate "modules" rather than one unified list. For example, a household where one person is vegan and one is not: the foundation pantry is the same (oils, vinegars, dry goods, most canned goods), and the divergent items are small and cheap (separate broths, separate condiments like Worcestershire vs. coconut aminos). A household with one gluten-free person does not need to go fully gluten-free in every staple -- maintain both wheat pasta and rice pasta on the shelf.

**User wants to stock for emergencies (natural disaster, extended power outage) rather than just weeknight cooking:**
The pantry goals shift: caloric density becomes more important than culinary versatility. Adjust recommendations: increase dry bean quantities significantly (1-2 lbs per person per week for emergency scenarios), add rolled oats (extremely shelf-stable, 1-2 years, high calorie density), add peanut butter or nut butter (shelf-stable protein and fat, high caloric density), increase canned fish (sardines, tuna, salmon -- complete protein, shelf stable 3-5 years), add dried fruit for caloric and micronutrient density. Cross-reference with `food-storage-safety` for water storage and refrigeration protocols during power outages.

**User is restocking after finding pests in the pantry (flour beetles, weevils, grain moths):**
Full reset protocol: (1) discard ALL opened grain products, flours, cornmeal, breadcrumbs, oats, rice (check for webbing, tiny insects, or grain-colored larvae), (2) remove and wash all shelves with hot soapy water, then wipe with undiluted white vinegar, (3) before restocking, freeze ALL new dry goods in sealed bags for 48-72 hours before transferring to pantry containers -- this kills any eggs in commercial products, (4) store ALL dry goods in airtight hard-sided containers (glass or BPA-free hard plastic with rubber-sealed lids -- soft-sided containers with snap lids are not adequate), (5) place bay leaves in corners of pantry shelves and inside containers of flour -- the essential oils in bay leaves deter grain pests. This is not a repellent applied topically to food; the presence of bay leaves in the container provides passive deterrence.

---

## Example

**Input:** "I just moved into my first real apartment. I used to cook mostly Mexican food and I'm trying to get back into it. I live alone and I'm not a huge cook but I want to stop ordering takeout three times a week. Budget is moderate -- I can spend around $80-90 to start."

**Cooking Profile Interpretation:**
- Cuisines: Mexican primary, with general American comfort food secondary (implied by the "stop ordering takeout" framing)
- Household: 1 person, cooking 3-4x/week target
- Dietary requirements: None stated
- Budget: Balanced practical tier ($80-90 startup)
- Starting point: From scratch, moderate skill level

---

## Pantry Staples System

**Cooking Profile:** Mexican (primary) + General American (secondary)
**Household:** 1 person, target 3-4 meals cooked per week
**Dietary Requirements:** None
**Budget:** Balanced Practical (~$80-90 initial investment)
**Starting Point:** From scratch

---

### Layer 1: Foundation Pantry (Every Kitchen Needs This)

| Category | Item | Stock Quantity | Shelf Life | Storage Method | Notes |
|----------|------|---------------|-----------|----------------|-------|
| High-heat oil | Neutral refined oil (canola, sunflower, or refined avocado) | 32 oz bottle | 6-12 months open | Dark cabinet, NOT next to the stove | Used for sautéing taco fillings, frying, roasting |
| Finishing oil | Extra virgin olive oil | 16 oz bottle | 3-6 months open | Dark cabinet, NOT next to the stove | Salad dressings, finishing drizzle. Not for high heat |
| Vinegar | White wine vinegar or rice vinegar | 1 bottle | 2+ years | Pantry shelf | Bright acid for dressings, pickling quick-pickled onions |
| Vinegar | Apple cider vinegar | 1 bottle | 2+ years | Pantry shelf | Marinades, braises, hot sauce cooking |
| Salt | Kosher salt | 3 lb box | Indefinite | Open container near stove | Check brand: Diamond Crystal and Morton measure differently by volume |
| Pepper | Whole black peppercorns + basic grinder | 1-2 oz | 2-3 years | Near stove | Pre-ground loses potency within days |
| Canned | Crushed tomatoes (28 oz) | 4 cans | 2-5 years | Pantry shelf | For enchilada sauce, soups, chili; opened: fridge 5-7 days |
| Canned | Diced tomatoes (14.5 oz) | 3 cans | 2-5 years | Pantry shelf | Quick weeknight salsas, soups, rice dishes |
| Canned | Tomato paste (tube form) | 1-2 tubes | 2-5 years; opened fridge 6-8 weeks | Fridge after opening | Always caramelize in oil 2-3 min before adding liquid -- it makes the sauce |
| Canned | Chicken or vegetable broth (32 oz) | 2 cartons | 1-2 years; opened: fridge 4-5 days | Pantry | For rice, soups, thinning sauces; freeze extra in 1-cup portions |
| Dry protein | Canned black beans | 6 cans | 2-5 years | Pantry shelf | The single most essential Mexican pantry protein. Rinse before using. |
| Dry protein | Canned pinto beans | 3 cans | 2-5 years | Pantry shelf | Refried beans, burritos, soups |
| Dry protein | Dried lentils (green) | 1 lb | 2-3 years | Airtight container | Budget-friendly protein for soups and salads; 20-25 min cooking, no soak |
| Grain | Long-grain white rice | 4 lb | 2-4 years | Airtight container | Mexican-style rice, burrito bowls, side dishes |
| Grain | Dried pasta (spaghetti, penne) | 2 boxes each | 2+ years | Original box or container | For the "general American" days -- pasta with whatever is in the fridge |
| Baking | All-purpose flour | 5 lb | 6-12 months | Airtight hard-sided container | For flour tortillas (if homemade), thickening sauces, baking |
| Baking | Cornstarch | 1 box | 2-3 years | Airtight | Thickening soups and sauces |
| Sweetener | Granulated sugar | 2 lb | Indefinite | Airtight | Margaritas, cooking balance |
| Sweetener | Honey | 1 jar | Indefinite | Pantry | Glaze for meats, dressings, general cooking |
| Umami | Soy sauce | 1 bottle | 2-3 years; opened 1 year | Pantry | Used in general cooking; optional for Mexican but useful |

---

### Layer 2: Mexican Cuisine Additions
