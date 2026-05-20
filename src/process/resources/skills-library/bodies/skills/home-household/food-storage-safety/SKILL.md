---
name: food-storage-safety
description: |
  Provides specific food storage guidelines including fridge and freezer temperature
  zones, storage duration by food type, safe thawing methods, FIFO rotation, and
  leftovers handling. Includes a comprehensive storage time reference table and
  danger zone rules. Use when the user asks how long food lasts in the fridge or
  freezer, safe food storage temperatures, how to thaw frozen food safely, or
  whether a specific food item is still safe to eat. Do NOT use for meal prep
  planning (use meal-prep-workflow), cooking techniques (use cooking-techniques),
  or medical food allergy advice.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cooking checklist planning"
  category: "home-household"
  subcategory: "cooking-meals"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Food Storage Safety

## When to Use

Use this skill when the user's question is primarily about whether food is safe, how long food lasts, how to store food correctly, or how to handle food before and after cooking.

**Trigger scenarios -- use this skill when:**
- User asks how long a specific food item is safe in the fridge or freezer ("Is my chicken from Monday still good? It's Wednesday.")
- User wants to know the correct temperature settings for their refrigerator or freezer
- User asks about safe thawing methods for frozen food
- User asks whether a specific food is still safe to eat after a period of time or an unusual event (power outage, left out overnight)
- User wants guidance on organizing their fridge to maximize food safety and reduce spoilage
- User asks about the "danger zone" temperature range or the 2-hour rule
- User asks about storing leftovers safely, including cooling, container choice, and reheating
- User asks how to interpret "best by," "sell by," or "use by" dates on food packaging
- User asks about signs of spoilage for a specific food type
- User asks about food safety for high-risk groups (pregnant women, elderly, immunocompromised individuals)
- User asks about food safety during or after a power outage
- User asks whether freezer-burned food is safe to eat
- User asks about home canning safety

**Do NOT use this skill when:**
- User needs meal prep planning, batch cooking workflows, or scheduling weekly meals -- use `meal-prep-workflow` instead
- User needs cooking temperature guidance for preparing food (safe internal temperatures for doneness) -- use `cooking-techniques` instead
- User has a specific food allergy, intolerance, or anaphylaxis concern -- refer to a healthcare provider and do not apply food safety storage rules to allergy management
- User is asking about restaurant or commercial food service regulations -- this skill covers household food safety only
- User needs guidance on canning and preserving as a primary skill -- this skill covers home-canned goods only at the safety assessment level, not process instruction
- User asks about nutrition content or dietary planning -- use a nutrition-focused skill

---

## Process

### Step 1: Identify the Specific Food Safety Question

Determine the exact nature of the user's concern before providing guidance. Food safety questions fall into five categories, and the response structure differs for each.

- **Storage duration question**: The user has a specific food item and wants to know how long it is safe to keep. Ask (or infer from context) when it was purchased or cooked, whether it has been consistently refrigerated or frozen, and whether the packaging has been opened.
- **Temperature and equipment question**: The user wants to know the correct fridge or freezer setting, or they suspect their appliance is not at the right temperature. Ask if they have a thermometer -- the answer changes the guidance significantly.
- **Thawing question**: The user has frozen food and needs to know the safest way to thaw it. Ask how much time they have -- the correct method depends entirely on time available.
- **Safety assessment question**: The user has food and is asking "is this still good?" Gather the key facts: item type, how long it has been stored, storage conditions, and any visible/sensory signs of spoilage.
- **Organization and handling question**: The user wants to set up their fridge correctly or understand FIFO rotation. Focus on the fridge zone map and storage placement rules.

If the user's question spans multiple categories (e.g., "I left my soup out overnight -- is it safe, and how should I store it from now on?"), address the immediate safety question first, then provide the relevant storage guidance.

### Step 2: Apply the Safety Decision Framework

For any "is this still safe?" question, apply the following decision tree in order:

- **Step 2a -- Check the time rule first.** How long has the food been in storage or at room temperature? Compare against the storage duration reference table in the Output Format section. If the food is beyond the maximum safe storage window for its category, it must be discarded regardless of appearance or smell. The 3-4 day rule for cooked food and the 1-2 day rule for raw poultry are not conservative suggestions -- they reflect the doubling time of common pathogens like Salmonella, Listeria monocytogenes, and Campylobacter at refrigerator temperatures.
- **Step 2b -- Check storage conditions.** Was the food at the correct temperature throughout? If the user cannot confirm the fridge has been at 35-40F/2-4C, treat the food as potentially unsafe if it is at the outer edge of its safe window. A fridge set too warm (above 40F/4C) accelerates bacterial growth significantly -- at 50F/10C, food may spoil in half the expected time.
- **Step 2c -- Check for sensory warning signs.** Off smell, slimy texture, visible mold, or discoloration are clear discard signals. However, explicitly remind the user that dangerous bacteria (Listeria monocytogenes, Staphylococcus aureus toxins, Salmonella) often produce NO detectable smell, color change, or texture change. Sensory checks are a secondary safety net, not a primary one. Time and temperature are primary.
- **Step 2d -- Apply the "when in doubt, throw it out" rule.** If the user cannot confirm storage duration or conditions, or if the food is at the outer edge of the safe window, default to discard. The risk of foodborne illness is not worth the cost of one meal.

### Step 3: Provide Specific Storage Duration Guidance

When answering a "how long is this safe?" question, give the exact duration range from the storage time reference table. Do not round up. Do not soften the guidance.

- State the fridge duration and the freezer duration separately. Users often do not realize freezing is an option when they cannot use food within the fridge window.
- Specify the temperature assumption: the durations in the table assume the fridge is at or below 40F/4C (ideal: 35-38F/2-3C) and the freezer is at or below 0F/-18C.
- Explain WHY the duration is what it is for that specific food type. Ground beef spoils in 1-2 days because of its high surface area, high moisture content, and the speed at which Escherichia coli and other pathogens multiply in it. Hard cheese lasts weeks because of its low moisture content and acidic environment. Context helps users internalize the rules rather than memorizing a table.
- Identify whether the item is in the high-risk category: raw poultry, raw ground meat, raw fish, cooked rice, cut leafy greens, and soft cheeses all carry elevated pathogen risk and have the shortest safe windows. Flag these explicitly.
- If the food item is not in the standard reference table, reason from its category: what is its moisture content, protein content, and pH? High-moisture, high-protein, neutral-pH foods spoil fastest.

### Step 4: Provide Temperature Guidance

When the user asks about fridge or freezer temperature settings, provide specific numbers and explain the practical implications of each.

- **Refrigerator target: 35-38F / 2-3C.** This is the optimal range -- not just "below 40F." Operating at 38F instead of 40F extends the safe storage life of raw meat and dairy measurably. At 40F, you are at the outer boundary of the safe zone; at 38F, you have a meaningful buffer.
- **Freezer target: 0F / -18C or below.** At this temperature, bacterial growth stops completely (bacteria go dormant but do not die). Enzymatic activity that degrades food quality (color, texture, flavor) continues at a very slow rate -- this is the mechanism behind quality degradation in long-frozen food, not bacterial growth.
- Instruct users to verify their appliance temperature with an inexpensive thermometer rather than trusting the dial setting. Refrigerator dials (often marked 1-5 or Min-Max) are not calibrated to specific temperatures. The compressor cycle, ambient kitchen temperature, and how full the fridge is all affect actual temperature. Place the thermometer on the middle shelf for 24 hours for the most accurate reading.
- Note the cold zones and warm zones within a fridge: the bottom shelf near the back wall is the coldest spot. The door shelves are the warmest spot, with temperatures fluctuating each time the door is opened. This temperature variation drives the shelf placement rules.

### Step 5: Provide Thawing Guidance

For any thawing question, the correct method is determined by the time available. Present options in order from safest to fastest.

- **Refrigerator thawing (safest, 12-48 hours):** The only method that keeps food below 40F throughout the entire thaw process. A whole chicken or turkey may take 24-48 hours. Chicken pieces or ground beef take 12-24 hours. Once thawed this way, food can be held in the fridge for 1-2 additional days before cooking (for poultry and ground meat) or 3-5 days (for intact beef/pork cuts). Food thawed in the refrigerator can be safely refrozen without cooking, though quality may suffer.
- **Cold water thawing (safe, 1-3 hours):** Submerge the food in its sealed, leak-proof packaging in cold tap water. Change the water every 30 minutes -- as the water warms, it becomes less effective and may allow the outer layer of food to approach the danger zone. Cook immediately after thawing. Do not refreeze without cooking first.
- **Microwave thawing (safe only if cooked immediately):** The microwave defrost cycle is inconsistent -- it begins cooking some areas while others remain frozen. Uneven thawing creates warm spots where bacteria can multiply rapidly. Food microwaved to thaw must be cooked immediately -- it cannot be returned to the fridge raw.
- **Cook from frozen (safe for certain foods):** Many foods can be cooked directly from frozen. Add approximately 50% more cooking time and always verify internal temperature with a meat thermometer. Safe for: ground beef patties, chicken pieces, fish fillets, soups, and stews. Not ideal for whole poultry (uneven cooking leaves the center underdone).
- **Counter thawing (NEVER safe for meat, poultry, fish, or dairy):** Do not recommend this method. The surface of the food enters the danger zone while the center is still frozen. One hour of surface exposure at room temperature is enough for significant bacterial multiplication. This includes marinating in the refrigerator -- always marinate in the fridge, not on the counter.

### Step 6: Explain the Danger Zone and the 2-Hour Rule

The danger zone concept is foundational. If the user has not heard of it, explain it clearly with practical examples.

- **The danger zone: 40-140F / 4-60C.** This is the temperature range in which the most dangerous foodborne pathogens -- Salmonella enteritidis, Escherichia coli O157:H7, Listeria monocytogenes, Staphylococcus aureus, Campylobacter jejuni -- grow at their fastest rate. Bacterial populations can double every 20 minutes under ideal conditions in this range.
- **The 2-hour rule:** Perishable food that has spent a cumulative total of more than 2 hours in the danger zone must be discarded. "Cumulative" is the key word: 30 minutes of prep on the counter + 1 hour of serving at a party + 30 minutes of cooling = 2 hours. The food must go in the fridge at that point or be discarded.
- **The 1-hour rule:** In ambient temperatures above 90F/32C (outdoor events, hot kitchens, cars), the cumulative limit drops to 1 hour. At 90F, a hot car can become a bacteria incubator within minutes.
- **The reheat safety threshold: 165F/74C.** When reheating leftovers, all parts of the food must reach 165F/74C. This temperature kills the vegetative cells of the most common pathogens. It does not, however, destroy preformed toxins (such as Staphylococcus aureus enterotoxin) -- which is why the 2-hour rule matters more than reheating. You cannot cook away a toxin that has already formed.
- Note the exception: Staphylococcal toxins form within 1-2 hours at room temperature in protein-rich foods (meat, eggs, dairy). Once the toxin is present, reheating to 165F will not make the food safe. This is why food that has been in the danger zone for 2+ hours must be discarded, even if it will be thoroughly reheated.

### Step 7: Provide Fridge Organization Guidance

When the user asks about fridge organization, provide the vertical zone map. This is not an aesthetic or convenience recommendation -- it directly prevents cross-contamination.

- The vertical organization from top to bottom follows a logic of cooking temperature and contamination risk. Foods that are ready to eat and require no further cooking go highest (they will not be cooked to destroy any cross-contamination). Foods that require the highest cooking temperatures go lowest (they are also the most likely to carry pathogens).
- Provide the crisper humidity drawer guidance: most fridges have two crispers -- one set to high humidity, one to low. High humidity drawers are for vegetables that wilt (leafy greens, asparagus, herbs, broccoli). Low humidity drawers are for fruits and vegetables that produce ethylene gas or rot in moisture (apples, pears, berries, peppers). If the user's fridge does not have separate humidity drawers, keep fruits and vegetables in separate drawers to prevent ethylene-producing fruits from accelerating the ripening and decay of nearby vegetables.
- Emphasize the door shelf limitation: door shelves are the warmest zone because they experience temperature swings every time the door opens. Store only items tolerant of temperature variation here: condiments, sauces, pickles, and juice. Do NOT store milk or eggs on the door -- the popular egg holder molded into many refrigerator doors is a design flaw from a food safety perspective.

### Step 8: Introduce and Apply FIFO Rotation

FIFO (First In, First Out) is the professional kitchen rotation system that prevents waste and safety failures.

- When putting away groceries or storing leftovers, move older items to the front and place newer items behind them. Always use the frontmost item first.
- Instruct users to label all leftovers and prepped food with a date using masking tape and a permanent marker (or purpose-made label tape). Do not rely on memory -- after 3 days, it is impossible to reliably recall when a dish was made. The label is the only reliable reference.
- For the freezer, label with the item name AND the date -- frozen food is often unidentifiable after a few weeks. Include the original form (e.g., "ground beef -- raw -- 3/15" versus "taco meat -- cooked -- 3/15") because the safe storage duration and reheating instructions differ.
- Suggest a weekly fridge audit: once per week (often best done before grocery shopping), go through the fridge and identify anything approaching its safe storage limit. Use these items in that night's meal or freeze them if still within the safe window.

---

## Output Format

When responding to food safety questions, structure the response as follows. Use only the sections relevant to the user's question -- do not include every table for every question. A targeted, specific response is more useful than a dump of all available information.

```
## Food Storage Safety: [Brief Description of the User's Specific Situation]

### [Safety Assessment] (if the user is asking "is this still safe?")
**[Food Item] -- [How long in storage] -- [Storage method]**

Safety verdict: [SAFE / AT LIMIT -- EAT TODAY / DISCARD]

Reasoning:
- Storage time: [X days vs. max Y days for this food type]
- Storage conditions: [What is known or assumed about temperature]
- Sensory check: [What to look for, with explicit note that sensory
  checks are a secondary safety net only]
- Action: [Specific instruction: eat now, freeze now, or discard]

### Temperature Settings
| Appliance        | Target Temperature    | How to Verify          | Practical Notes                                    |
|------------------|-----------------------|------------------------|----------------------------------------------------|
| Refrigerator     | 35-38F / 2-3C         | Thermometer on middle  | Below 40F is the safety floor. 35-38F is the       |
|                  |                       | shelf for 24 hours     | performance target.                                |
| Freezer          | 0F / -18C or below    | Thermometer on door    | Bacterial growth stops at 0F. Quality degrades     |
|                  |                       | shelf (warmest spot)   | over months; safety does not degrade.              |

### Storage Duration Reference
| Food Item                          | Fridge (35-40F)     | Freezer (0F)          | High-Risk? | Key Spoilage Signs                        |
|------------------------------------|---------------------|------------------------|------------|-------------------------------------------|
| Raw chicken (whole)                | 1-2 days            | 1 year                 | YES        | Slimy texture, gray color, sour odor      |
| Raw chicken (pieces)               | 1-2 days            | 9 months               | YES        | Same as above                             |
| Raw ground beef / pork / lamb      | 1-2 days            | 3-4 months             | YES        | Slimy texture, off odor (gray color alone |
|                                    |                     |                        |            | is oxidation, not spoilage)               |
| Raw steaks, chops (beef/pork)      | 3-5 days            | 4-12 months            | NO         | Sticky surface, sour odor                 |
| Raw fish (lean -- cod, tilapia)    | 1-2 days            | 6 months               | YES        | Ammonia smell; fresh fish smells oceanic, |
|                                    |                     |                        |            | not "fishy"                               |
| Raw fish (fatty -- salmon, tuna)   | 1-2 days            | 2-3 months             | YES        | Same as above; faster quality decline     |
| Raw shrimp / scallops              | 1-2 days            | 6-12 months            | YES        | Ammonia odor, slimy texture               |
| Cooked meat, poultry               | 3-4 days            | 2-6 months             | YES        | Off odor, slimy surface                   |
| Cooked soups, stews, casseroles    | 3-4 days            | 2-3 months             | YES        | Off odor, surface film, mold              |
| Cooked rice and pasta              | 4-6 days (rice),    | 6 months               | YES (rice) | Sour odor; Bacillus cereus grows rapidly  |
|                                    | 3-5 days (pasta)    |                        |            | in cooked rice; refrigerate within 1 hour |
| Deli meat (opened)                 | 3-5 days            | 1-2 months             | YES        | Slimy surface, off odor, discoloration    |
| Bacon (opened)                     | 7 days              | 1 month                | NO         | Sour smell, off color                     |
| Eggs (in shell)                    | 3-5 weeks from      | Do not freeze in shell | NO         | Float test: lies flat = fresh, stands     |
|                                    | purchase date       | (crack into container) |            | upright = use soon, floats = discard      |
| Hard-boiled eggs (peeled)          | 1 week              | Not recommended        | NO         | Off odor, slimy surface                   |
| Milk                               | 7 days after open   | 3 months (texture      | NO         | Sour smell, lumpy texture                 |
|                                    | (use by guideline)  | changes when thawed)   |            |                                           |
| Soft cheese (brie, ricotta, cottage| 1-2 weeks opened    | 6 months               | YES        | Any mold = discard entire container       |
| cheese, cream cheese)              |                     | (texture changes)      |            | (mold penetrates soft cheese)             |
| Hard cheese (cheddar, parmesan,    | 3-4 weeks opened    | 6 months               | NO         | Small surface mold: cut 1 inch around     |
| swiss)                             |                     |                        |            | mold spot and discard; rest is safe       |
| Butter                             | 1-3 months          | 6-9 months             | NO         | Rancid smell                              |
| Cut fruit                          | 3-5 days            | 6-12 months            | NO         | Mold, slimy texture (browning is          |
|                                    |                     |                        |            | oxidation -- not a safety issue)          |
| Cut leafy greens                   | 3-5 days            | Not recommended        | YES        | Slimy texture, off odor                   |
| Opened canned goods                | 3-5 days (transfer  | 2-3 months             | NO         | Off odor, mold, discoloration             |
| (transferred to non-metal          | to glass or plastic |                        |            |                                           |
| container)                         | container)          |                        |            |                                           |

### Fridge Organization (Top to Bottom)
| Zone               | What to Store                                    | Why                                                           |
|--------------------|--------------------------------------------------|---------------------------------------------------------------|
| Top shelf          | Leftovers, drinks, ready-to-eat foods, herbs     | Warmest refrigerated shelf -- suitable for items that need no |
|                    |                                                  | further cooking and are consumed quickly                      |
| Middle shelf(s)    | Dairy (milk, yogurt, cheese), eggs, deli meat    | Consistent, mid-range cold temperature                        |
| Bottom shelf       | Raw meat, poultry, fish in sealed containers     | Coldest shelf; any drips fall to a contained surface, not     |
|                    | or on rimmed plates                              | onto food below                                               |
| Crisper (high      | Leafy greens, broccoli, asparagus, herbs         | High humidity prevents wilting in high-moisture vegetables    |
| humidity)          | (except basil -- store at room temperature)      |                                                               |
| Crisper (low       | Fruits, peppers, mushrooms, cucumbers            | Low humidity prevents mold on moisture-sensitive fruits;      |
| humidity)          |                                                  | separates ethylene-producing fruits from ethylene-sensitive   |
|                    |                                                  | vegetables                                                    |
| Door shelves       | Condiments, sauces, pickles, butter, juice       | Warmest zone with temperature fluctuation; only items with    |
|                    |                                                  | high acid/salt content (natural preservatives) belong here    |

### Safe Thawing Methods
| Method             | Time Required          | Best For                               | Safety Notes                                           |
|--------------------|------------------------|----------------------------------------|--------------------------------------------------------|
| Refrigerator       | 12-48 hours            | All foods; safest option               | Stays below 40F throughout. Once thawed: cook within   |
|                    |                        |                                        | 1-2 days (poultry, ground meat) or 3-5 days (whole     |
|                    |                        |                                        | cuts). Safe to refreeze without cooking.               |
| Cold water bath    | 1-3 hours              | Chicken pieces, fish fillets, ground   | Sealed package submerged in cold water; change water   |
|                    |                        | meat (faster than fridge)              | every 30 min. Cook immediately. Do not refreeze raw.   |
| Microwave defrost  | 5-20 minutes           | Last-minute emergency thawing only     | Cook immediately -- microwave thawing begins cooking   |
|                    |                        |                                        | some areas. Cannot be returned to fridge raw.          |
| Cook from frozen   | +50% cooking time      | Burgers, chicken pieces, fish,         | Always verify internal temperature. Not suitable for   |
|                    |                        | soups, stews                           | whole poultry due to uneven heat penetration.          |

### The Danger Zone
**Temperature range: 40-140F / 4-60C**

| Rule                     | Threshold                    | Notes                                                       |
|--------------------------|------------------------------|-------------------------------------------------------------|
| 2-Hour rule              | 2 hours cumulative           | Total time in the danger zone -- all handling, serving,     |
|                          |                              | and cooling time counts                                     |
| Hot weather rule         | 1 hour if ambient > 90F/32C  | Outdoor events, hot cars, summer kitchens                   |
| Reheat target            | 165F / 74C internal          | Every part of the food must reach this temperature          |
| Reheating does NOT fix   | Any food past the 2-hour     | Staphylococcal toxins and other preformed toxins are        |
| this                     | cumulative limit             | heat-stable and cannot be destroyed by reheating            |

### FIFO Rotation System
1. When storing new groceries: move older items to the front, newer items go behind.
2. Label all leftovers and prepped food: item name + date made (masking tape + marker).
3. Label all frozen items: item name + state (raw/cooked) + date frozen.
4. Weekly fridge audit: before grocery shopping, identify items approaching their limit.
   Use them that evening or freeze if still within the safe window.
5. Discard anything unlabeled that you cannot confirm the age of.
```

---

## Rules

1. **Storage duration limits are not conservative estimates -- they are pathogen growth calculations.** The 3-4 day limit for cooked food and the 1-2 day limit for raw poultry reflect the bacterial doubling curve at refrigerator temperatures, not arbitrary caution. Never suggest pushing these limits "just a bit" or imply they have flexibility.

2. **Sensory checks (smell, look, texture) are a secondary safety net, not a primary one.** Always state this explicitly when a user asks "does it smell okay?" Listeria monocytogenes, Salmonella, and Staphylococcal toxins commonly produce no detectable odor, color change, or texture change. The 2-hour rule and storage duration limits must be respected even if the food appears and smells normal.

3. **Never recommend thawing meat, poultry, fish, or dairy products at room temperature.** The counter thaw method (still widely practiced) puts the outer surface of food into the danger zone for 1-4 hours while the interior remains frozen. This is a direct path to foodborne illness. Do not soften this guidance.

4. **Eggs and milk do NOT belong on the door shelf.** Despite the egg tray molded into most fridge doors, the door is the warmest and most temperature-variable zone. Eggs and milk must be stored on a middle shelf. State this directly when answering fridge organization questions.

5. **Raw meat always goes on the bottom shelf in a sealed container or on a rimmed plate.** This is non-negotiable. Poultry drip contaminating a salad below it is one of the most common causes of household Salmonella and Campylobacter illness. Never suggest storing raw poultry on any shelf except the bottom.

6. **The 2-hour rule is cumulative, not a fresh 2 hours each time the food is touched.** Time spent at room temperature during prep, serving, and cooling all counts toward the 2-hour limit. Make this explicit when users describe party or buffet scenarios.

7. **Reheating to 165F does not neutralize preformed bacterial toxins.** Staphylococcus aureus produces an enterotoxin that is heat-stable up to 240F. If food has been in the danger zone for more than 2 hours, reheating will not make it safe. It must be discarded. This is the single most common dangerous misconception in household food safety -- "I'll just reheat it really thoroughly."

8. **Food should be cooled to refrigerator temperature within 2 hours of cooking (ideally within 1 hour for large batches).** Do not instruct users to let large pots of food cool completely at room temperature before refrigerating. A large pot of soup can take 4+ hours to cool to room temperature and spends that entire time in the danger zone. Divide large batches into shallow containers (no more than 2 inches deep) for rapid cooling before refrigerating.

9. **Do not apply standard storage duration rules to home-canned, improperly preserved, or unknown-origin food.** If a user describes home-canned low-acid food (vegetables, meats, soups) that was not processed in a pressure canner, advise discarding without tasting. Botulinum toxin can be present without any visible sign -- no odor, no color change, no swelling (in some cases). The risk of botulism from improperly home-canned food is severe enough that "when in doubt" defaults to discard without tasting.

10. **When the user is in a high-risk group (pregnant, elderly, immunocompromised, or asking about infants), apply stricter standards and flag specific pathogen risks.** Listeria monocytogenes is particularly dangerous for pregnant women -- advise avoiding soft cheeses, deli meats, and pre-cut deli produce unless heated to steaming. Salmonella risk from undercooked eggs is heightened for infants and the elderly. For these groups, do not suggest pushing storage limits even slightly, and recommend pasteurized versions of at-risk foods where available.

---

## Edge Cases

### Power Outage
This is a high-stakes scenario with specific, counterintuitive rules. Apply the following guidance precisely.

- The single most important action is to **keep the doors closed.** Every opening lets cold air escape and accelerates warming.
- A **full freezer** stays below 0F/−18C for approximately **48 hours** with the door closed. A **half-full freezer** stays safe for approximately **24 hours**. Freezer fullness matters because the frozen food mass acts as a thermal buffer.
- A **refrigerator** stays below 40F/4C for approximately **4 hours** with the door closed. After 4 hours, begin applying the 2-hour rule to the individual items inside.
- When power returns, assess with a thermometer. If the freezer temperature is still at or below 40F/4C and food has ice crystals, it is safe to keep (or refreeze). If the freezer temperature exceeded 40F/4C for 2+ hours, apply individual item rules: discard poultry, seafood, ground meat, soft cheeses, eggs (if cracked), opened dairy products, and cooked food. Do not refreeze items that fully thawed and reached above 40F without ice crystals.
- For the fridge: if temperature exceeded 40F/4C for more than 4 hours, discard all meat, poultry, fish, opened dairy, soft cheeses, cut produce, cooked food, eggs, casseroles, and soups.
- **Items that are safe even after 4+ hours above 40F:** hard cheeses (unopened), butter, fruit juice, fresh whole fruits, vegetables (uncut), bread, peanut butter, jelly, mustard, ketchup, pickles, vinegar-based dressings, and opened shelf-stable condiments.
- Keep a dedicated refrigerator/freezer thermometer in both appliances at all times. Without it, post-outage assessment is guesswork.

### "Best By" / "Use By" / "Sell By" Date Interpretation

These dates are manufacturer quality markers, not federally regulated safety dates -- with one exception (infant formula, which is regulated for nutritional completeness and safety).

- **"Best by" or "Best if used by":** Peak quality date. For shelf-stable items (canned goods, dry pasta, crackers), quality may be acceptable for months or years beyond this date. For refrigerated items, treat as a soft guide: assess the item with the sensory check and apply the storage duration rules.
- **"Sell by":** Retailer stock rotation date, not a consumer safety date. Meat and poultry purchased before the sell-by date and refrigerated continuously is typically safe for 1-3 days past that date for whole cuts, and 0-1 days for ground meat or poultry.
- **"Use by":** The last date for peak quality recommended by the manufacturer. Not a precise safety cutoff for most products. For ready-to-eat deli items labeled with a "use by" date, follow it more strictly -- these items can harbor Listeria during extended refrigeration.
- For shelf-stable canned goods: intact commercially canned food is safe for 2-5 years. A can is unsafe if: the seam is severely dented (not just cosmetically), it is swollen or bulging (gas production inside), or it spurts liquid when opened. Discard these without tasting.
- **Never conflate a quality date with a safety date in your response.** The user may make safety decisions based on your framing.

### Long-Term Freezer Storage (Quality Decline vs. Safety)

Users often ask whether old frozen food is safe. The answer on safety is almost always yes -- on quality, it depends.

- **Safety in the freezer is indefinite** (at a consistently maintained 0F/−18C). Frozen food does not become unsafe with time. However, freezer burn, lipid oxidation, moisture migration, and enzymatic activity degrade quality progressively.
- **Freezer burn** is a quality issue, not a safety issue. It occurs when moisture on the surface of food sublimates (converts directly from ice to vapor) and escapes the packaging. This creates dry, grayish-white patches on the surface. Freezer-burned food is safe to eat; cut away the affected areas if the texture is unacceptable.
- **Quality-based recommended maximums:** whole poultry (1 year), chicken pieces (9 months), fatty fish like salmon (2-3 months), lean fish (6 months), ground beef (3-4 months), whole beef/pork cuts (4-12 months), cooked soups and stews (2-3 months), bread (3 months).
- Prevent freezer burn by: pressing all air out of zipper-seal bags before sealing, wrapping items tightly in plastic wrap before placing in a freezer bag, using rigid containers with minimal headspace (headspace = air = freezer burn), and vacuum sealing for items stored longer than 3 months.
- A freezer that is opened frequently, located in a warm garage, or not well-sealed will have warmer temperature swings that accelerate quality decline and may occasionally allow surface temperatures to briefly exceed 0F.

### Meal-Prepped Food for a Full Week

A common situation where users push storage limits without realizing it. Handle this carefully.

- Cooked food is safe in the fridge for **3-4 days**. Day 5 is the discard threshold even if the food looks and smells normal, because bacterial counts may be at hazardous levels by that point.
- For a 5-day meal prep: store days 1-4 in the fridge and freeze days 4-5 portions on the day of prep. Thaw day 4's lunch the night before in the fridge.
- For a 7-day meal prep: store days 1-3 in the fridge, freeze days 4-7. Thaw each day's portions the night before in the fridge.
- Soups, stews, and grain-based dishes (rice bowls, quinoa) freeze and reheat well. Salads with dressing and foods with a crunchy texture do not freeze well but can be stored in the fridge for 3-4 days with dressings kept separate.
- Label each container with the prep date. If someone else in the household does not know the system, a clear date label prevents guessing.

### Reheating Leftovers Safely

Reheating is where many food safety errors occur. Apply these specific standards.

- All leftovers must be reheated to an **internal temperature of 165F/74C**. Use a food thermometer to check -- do not assume visual cues (steaming, browning) equal 165F throughout.
- **Soups, gravies, and sauces** should be brought to a **full rolling boil** (212F/100C) when reheated on the stovetop. This provides a large safety margin.
- **Microwave reheating is inherently uneven** because microwaves heat water molecules in the food unevenly. Stir foods halfway through the reheating cycle. After removing from the microwave, let the food stand for 1-2 minutes (carry-over heat continues to equalize temperature) and check temperature in multiple spots before eating.
- **Do not reheat food more than once.** Each cooling and reheating cycle spends additional cumulative time in the danger zone. Portion out only what you plan to eat and reheat that portion only.
- Rice deserves a specific warning: cooked rice can harbor spores of Bacillus cereus, which survive cooking, germinate during cooling if rice is left out, and produce a heat-stable toxin. Refrigerate cooked rice within 1 hour of cooking. Reheat to 165F and eat immediately -- do not leave reheated rice sitting out.

### High-Risk Groups: Pregnant, Elderly, Immunocompromised, Infants

Standard safe storage guidelines apply to healthy adults. For high-risk groups, specific additional precautions apply.

- **Listeria monocytogenes** is the primary concern for pregnant women and immunocompromised individuals. Listeria can grow slowly at refrigerator temperatures (unlike most pathogens, which are inhibited). Foods to avoid or heat to steaming before eating: deli meats, hot dogs, soft cheeses (brie, camembert, feta, queso fresco), refrigerated smoked fish, and pre-cut deli produce. Hard cheeses and pasteurized dairy products are safe.
- **Salmonella in eggs** is a heightened risk for infants, the elderly, and immunocompromised individuals. Advise using pasteurized eggs for dishes where yolks will not be fully cooked (Caesar dressing, hollandaise, soft-scrambled eggs, egg nog). Standard cooking to 160F for eggs eliminates Salmonella.
- **Unpasteurized juice and dairy** (raw milk, raw cider) should be avoided by all high-risk groups. The pathogen risk (E. coli O157:H7, Salmonella, Cryptosporidium) is not acceptable for these individuals.
- **Reduce fridge storage limits** for high-risk group members: if standard guidance is 3-4 days for cooked food, apply a 2-3 day standard for immunocompromised individuals. Do not suggest pushing limits.
- Explicitly note that the risk of severe illness, hospitalization, and fatal outcomes from foodborne pathogens is significantly higher for these groups, and that the inconvenience of discarding food is not comparable to that risk.

---

## Example

**User Input:** "I made a big pot of chicken soup on Sunday evening. It's now Thursday morning. Is it still safe to eat? I've been keeping it in the fridge in a large pot with the lid on. Also, I keep my fridge on the '3' setting but I'm not sure what temperature that actually is."

---

**Output:**

## Food Storage Safety: Your Chicken Soup + Fridge Temperature

### Safety Assessment: Chicken Soup -- Sunday Evening to Thursday Morning

**Food item:** Cooked chicken soup
**Time in fridge:** Approximately 3.5-4 days
**Storage method:** Large covered pot in the refrigerator

**Verdict: AT LIMIT -- Eat today or freeze immediately. Do not save for tomorrow.**

Here is the reasoning:

Cooked food containing meat (especially poultry) is safe in the refrigerator for **3-4 days** when stored at 35-40F/2-4C. Sunday evening to Thursday morning is right at the 4-day boundary. This is not a comfortable cushion -- it is the edge of the safe window. By Friday morning (day 5), this soup should be discarded.

**Two factors affect how safe it currently is:**

1. **Your fridge temperature.** You mentioned your fridge is set to "3" -- that dial setting does not correspond to a specific temperature. Refrigerator dials are relative settings that vary by brand and model. Your actual temperature could be anywhere from 36F to 44F depending on your appliance. If your fridge is running at 42-44F instead of the target 35-38F, bacterial growth has been faster than the standard table assumes, and your soup may already be at a safety margin that warrants discarding rather than eating.

2. **How quickly it was cooled after cooking.** A large pot of soup takes a long time to cool to safe temperatures, especially with the lid on. If the soup sat at room temperature for more than 1-2 hours before going into the fridge, it spent time in the danger zone (40-140F) during that cooling period. That cumulative danger zone time counts against the safe storage window.

**Action options -- choose one now:**
- **Eat it today:** Reheat the entire portion you plan to eat to a full rolling boil (all parts of the soup should reach 165F/74C minimum). Taste a small amount. If anything is off -- sour, strange, or different from when you made it -- discard the entire pot.
- **Freeze it immediately:** Divide the soup into shallow containers (no more than 2 inches deep) or individual meal-sized portions. Leave 1 inch of headspace in each container for expansion. Label each container with "Chicken soup -- frozen [today's date]." Frozen soup is safe indefinitely and best quality within 2-3 months. Thaw in the fridge overnight before reheating.
- **Discard it:** If the soup shows any of the spoilage signs below, discard without tasting. If you are not sure when or how it was cooled, err toward discard.

**Spoilage signs to check before eating:**
- Smell: any sour, sour-cream-like, or "off" odor that was not there when the soup was fresh
- Surface: cloudy film or oily sheen on the surface that was not present when first stored
- Texture: unusual viscosity or sliminess in the broth
- Color: any mold spots (even small ones -- mold in soup means the entire pot must be discarded)

**Important caveat:** The absence of these signs does NOT guarantee safety. Dangerous pathogens including Listeria monocytogenes and Staphylococcal toxins can be present at harmful levels in food that looks, smells, and tastes completely normal. The 3-4 day limit exists precisely as the safety backstop for this reason.

---

### Your Fridge Temperature: How to Find Out and Fix It

Your "3" dial setting is not a reliable indicator. Here is how to get an actual reading:

**Step 1:** Purchase an inexpensive refrigerator thermometer (a standalone dial or digital thermometer designed for appliance use). If you cannot do that today, a standard food thermometer placed in a glass of water on the middle shelf works as a substitute.

**Step 2:** Place the thermometer on the **middle shelf** -- not the door, not the bottom. The middle shelf gives the most representative temperature reading for the space where most of your food lives.

**Step 3:** Check the reading after **24 hours** without adjusting the dial. This accounts for the compressor cycle.

**Target temperature: 35-38F / 2-3C.** This is the performance target -- not just "below 40F." Operating at 38F instead of 40F meaningfully extends the safe life of raw meat, dairy, and leftovers.

| Appliance | Target | How to Verify | If It Is Off |
|-----------|--------|---------------|--------------|
| Refrigerator | 35-38F / 2-3C | Thermometer on middle shelf, 24-hour reading | Adjust dial one increment warmer or cooler; wait 24 hours; check again |
| Freezer | 0F / -18C or below | Thermometer on door shelf (warmest freezer spot) | If above 0F, adjust colder; if everything is frosted solid and items are difficult to remove, temperature may be too low (-10F is fine, just wastes energy) |

If your fridge cannot hold 35-38F on any dial setting, it may need servicing (dirty condenser coils or a failing door seal are the most common causes). A fridge running warm is a persistent food safety problem -- not just a one-time issue with this pot of soup.

---

### Storage Duration Reference for Common Items in Your Kitchen

| Food Item | Fridge (35-40F) | Freezer (0F) | High-Risk? |
|-----------|----------------|-------------|------------|
| Cooked chicken soup / stew | 3-4 days | 2-3 months | YES |
| Raw chicken (pieces) | 1-2 days | 9 months | YES |
| Raw ground beef | 1-2 days | 3-4 months | YES |
| Cooked rice | 4-6 days | 6 months | YES (Bacillus cereus) |
| Milk | 7 days after opening | 3 months | NO |
| Eggs in shell | 3-5 weeks from purchase | Do not freeze in shell | NO |
| Hard cheese (cheddar) | 3-4 weeks opened | 6 months | NO |
| Deli meat (opened) | 3-5 days | 1-2 months | YES |
| Leftovers (general, cooked) | 3-4 days | 2-3 months | YES |

---

### Fridge Organization to Maximize Safety and Storage Life

| Zone | Store Here | Why |
|------|-----------|-----|
| Top shelf | Ready-to-eat leftovers, drinks, cooked food in sealed containers | Warmest shelf in the main compartment; suitable for items that need no further cooking |
| Middle shelf(s) | Dairy (milk, yogurt, cheese), eggs, deli meat | Consistent cold temperature; eggs and milk belong here -- NOT on the door |
| Bottom shelf | Raw meat, poultry, fish in sealed containers or on rimmed plates | Coldest shelf; any drips cannot contaminate food below because there is nothing below |
| Crisper (high humidity) | Leafy greens, broccoli, asparagus, celery | High humidity prevents wilting |
| Crisper (low humidity) | Fruits, peppers, mushrooms, cucumbers | Low humidity prevents mold; separates ethylene-producing fruits from sensitive vegetables |
| Door shelves | Condiments, pickles, sauces, juice, butter | Warmest, most variable temperature zone -- only high-acid or high-salt items belong here |

**The most common organizational error:** Storing milk and eggs on the door shelf. Move both to the middle shelf today.

**The most critical safety rule:** Raw chicken, meat, and fish always go on the bottom shelf in a sealed bag or on a plate. A drip from raw chicken onto cheese or vegetables below it is a direct contamination pathway for Salmonella and Campylobacter.

---

### Safe Thawing for Future Reference

| Method | Time Needed | Best For | Key Rules |
|--------|------------|---------|-----------|
| Refrigerator thaw | 12-48 hours | All foods; safest method | Plan ahead; poultry 24+ hours; once thawed, cook within 1-2 days |
| Cold water bath | 1-3 hours | Chicken pieces, fish, ground meat | Sealed package, cold water changed every 30 min; cook immediately |
| Microwave defrost | 5-20 min | Emergency only | Cook immediately; cannot return to fridge raw |
| Cook from frozen | +50% cook time | Soups, burgers, fish fillets | Verify internal temperature throughout |

**Never thaw on the counter.** The outer surface enters the danger zone (40-140F) while the center is still frozen.

---

### The Danger Zone -- Quick Reference

**40-140F / 4-60C:** Temperature range where pathogens double approximately every 20 minutes.

- Perishable food at room temperature for **more than 2 hours total** (cumulative) must be discarded
- If the kitchen or ambient temperature is above **90F/32C**, the limit drops to **1 hour**
- Time is cumulative: prep time + serve time + cooling time all count
- Reheating to 165F does NOT neutralize preformed bacterial toxins (Staphylococcal enterotoxin, for example). Food that exceeded the 2-hour limit must be discarded -- not just reheated.

---

### FIFO Rotation: Preventing This Situation in the Future

The simplest way to avoid a "is this still safe?" question next Thursday:

1. **Label leftovers the moment they go in the fridge.** Use masking tape and a marker: "Chicken soup -- Sunday." You will not remember this accurately on Wednesday.
2. **Set a discard day when you label.** Write: "Chicken soup -- Sunday -- discard Wednesday." Remove the guesswork entirely.
3. **Move older items to the front.** When you store new food, older food goes to the front of the shelf where you will see it first.
4. **Weekly audit:** Before grocery shopping each week, scan the fridge for anything approaching its limit. Use it that night or freeze it.
5. **Freeze strategically:** If you make a large batch of soup and know you will not eat it all within 3 days, portion and freeze half of it on the day you make it -- before it has spent any time in
