---
name: food-tourism-planner
description: |
  Creates food-focused travel itineraries featuring local markets, signature
  dishes, cooking classes, and food district routing. Produces a day-by-day
  food itinerary with meal scheduling, neighborhood guides, and dietary
  accommodation notes. Use when the user asks about planning food experiences
  abroad, creating a food tour itinerary, finding local culinary highlights,
  or organizing cooking class trips. Do NOT use for general trip planning
  (use trip-itinerary-builder), restaurant reviews, or meal prep and cooking
  technique guidance (use home-household cooking skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel itinerary planning research"
  category: "travel-experiences"
  subcategory: "experiences-activities"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Food Tourism Planner

## When to Use

Use this skill when the user's primary intent is to organize travel experiences around food discovery, culinary culture, and eating as the main activity of a trip.

**Trigger scenarios:**
- User explicitly frames their trip around eating: "We want to plan our whole trip around the food," "I'm going to Lyon just for the food scene," or "Help me build a food itinerary for Oaxaca"
- User asks about specific culinary categories at a destination: street food routes, night markets, wet markets, food halls, mercados, souks, or hawker centers
- User wants to find and schedule cooking classes, food tours, fermentation workshops, cheese-making sessions, or hands-on culinary experiences abroad
- User is building a multi-day trip where every meal is intentional -- they want no wasted meals and are treating food as the primary cultural lens
- User asks about must-try dishes, regional specialties, signature preparations, or the "food bucket list" for a specific destination
- User needs to navigate dietary restrictions (vegetarian, vegan, halal, kosher, gluten-free, severe allergies) in a foreign food culture and wants help finding compatible experiences
- User is planning a food-focused trip for a special occasion: honeymoon culinary tour, food birthday trip, anniversary tasting experience, or group foodie travel

**Do NOT use when:**
- User needs a complete trip itinerary where food is one element among many (use `trip-itinerary-builder` -- food notes can be added as a layer on that plan)
- User wants specific restaurant recommendations by name, reservations guidance, or review-style content (use `restaurant-research-assistant` if available; otherwise decline brand-specific guidance)
- User wants to recreate dishes at home or learn cooking techniques for domestic use (use home-household cooking skills)
- User needs cultural etiquette guidance beyond what is needed at the table -- tipping norms, dress codes, general conduct (use `local-customs-briefing`)
- User is asking about food safety for a medical condition requiring clinical guidance -- this skill provides general food safety awareness, not medical advice
- User needs wine pairing, sommelier guidance, or in-depth beverage program planning for a formal tasting menu experience (use a dedicated beverage-pairing skill if available)
- User is planning a food event, popup, or catering experience rather than a personal trip

---

## Process

### Step 1: Gather the Food Travel Profile

Before building anything, collect the following inputs. If the user has already provided some, confirm them and ask only for what is missing. Do not ask all questions at once -- use conversational intake, grouping related questions together.

**Destination and logistics:**
- Destination city, region, or multi-city route (e.g., "Tokyo and Osaka," "Northern Vietnam from Hanoi to Hoi An")
- Number of days allocated specifically to food exploration (separate from transit days)
- Time of year -- seasonal availability dramatically affects dish quality and market offerings (mango sticky rice peaks March-June in Bangkok; truffle season in Périgord runs November-February; Dungeness crab in San Francisco peaks December-March)

**Food interests and priorities:**
- Primary food modality: street food and markets, casual local restaurants, fine dining or tasting menus, cooking classes, food history and heritage, fermentation or craft beverage culture, or a mix
- Specific dishes or ingredients they already know they want to try
- Interest in food shopping: bringing home spices, condiments, preserved goods, or specialty ingredients
- Whether they want food-paired cultural experiences: sake breweries in Nada, olive oil estates in Tuscany, mezcal distilleries (palenques) in Oaxaca

**Dietary profile:**
- Restrictions (vegetarian, vegan, halal, kosher, pescatarian, no pork, no beef, gluten-free, lactose intolerant)
- Allergens -- distinguish between preference ("I avoid shellfish") and medical necessity ("I carry an EpiPen for shellfish")
- Spice tolerance on a 0-5 scale: 0 = no heat at all, 1 = very mild, 2 = mild, 3 = moderate, 4 = hot, 5 = no limit
- Texture aversions (offal, cartilage, fermented foods, raw preparations)
- Adventurousness quotient: "I eat anything," "I'm adventurous but need to recognize what I'm eating," or "I want authentic but not confronting"

**Practical parameters:**
- Daily food budget per person, including all meals, snacks, and drinks -- frame this in USD or the user's home currency and note that it covers all food spending, not per-meal
- Group composition: solo, couple, family with children (ages matter), multi-generational group, food-focused friend group
- Eating schedule preference: traditional local meal times, grazers who eat many small portions throughout the day, one major meal with lighter bookends
- Mobility considerations: can they walk 4-6 km through food districts, navigate stairs to mezzanine food halls, or do they need flat, accessible routes?
- Prior exposure to this cuisine: first-time encounter with the food culture or returning for deeper exploration beyond the classics

---

### Step 2: Map the Food Landscape

For the confirmed destination, build a structured knowledge base across six dimensions before writing a single day of itinerary. This mapping prevents the common error of randomly assigning food experiences to days without understanding how the food culture actually flows.

**Signature dish taxonomy (target 10-15 dishes):**
- Identify dishes by three tiers: Tier 1 (iconic, non-negotiable -- Pad Thai in Bangkok, Peking duck in Beijing, Pasta cacio e pepe in Rome), Tier 2 (regionally essential and beloved by locals but less tourist-facing), Tier 3 (niche or adventurous, for the food-curious traveler)
- For each dish, document: local-script name, romanized pronunciation, primary ingredients, preparation method (wok-fried, slow-braised, raw-cured, steamed), dominant flavor profile (sour-spicy, sweet-savory, umami-rich, bright and herbal), texture, portion size (single-serve snack vs. shareable main), and typical price band
- Flag every dish that intersects with common allergens or dietary restrictions
- Note which dishes have seasonal constraints -- some preparations are only available during specific festivals, harvest seasons, or weather windows

**Food neighborhood mapping (3-6 districts per city):**
- Each district should have a distinct identity: Old City markets, immigrant community food corridors, fishing village to urban seafood district, working-class lunch circuits, upscale food hall and boutique dining zones
- Document peak operating hours -- many of the world's best food experiences follow schedules that differ radically from tourist expectations (Bangkok's Chinatown is dead at noon and electric at 6 PM; Tokyo's Tsukiji outer market is best at 7 AM; Marrakech's Jemaa el-Fna food stalls run 7 PM - 2 AM)
- Note transit connections: which BTS or MRT stop, which metro line, which bus number, or whether a short taxi or tuk-tuk ride is more practical
- Estimate walking distances within each district -- a proper food district graze requires 1-3 km of walking over 1-3 hours; flag this for users with mobility constraints

**Market typology:**
- Distinguish between wet markets (fresh produce, proteins, and daily ingredients -- primarily local commerce, best at 7-10 AM), covered permanent markets (e.g., La Boqueria in Barcelona, Mercado Benito Juárez in Oaxaca -- mix of local staples and prepared food), night markets (primarily prepared street food, peak 6 PM - midnight), floating markets (specialized tourist-adjacent experience common in Thailand and Vietnam -- schedule for weekends when local vendors predominate), hawker centers (Southeast Asia -- permanent structures with multiple independent stalls sharing communal seating), and food halls (modern, air-conditioned, higher-priced curation of local and regional food)
- For each relevant market type at the destination, note hours, peak times, crowd patterns, cash vs. card acceptance, and what specifically to eat vs. buy vs. photograph

**Cooking class landscape:**
- Four main formats: (1) Market-to-table (90-180 minutes, includes a morning market visit followed by a 3-dish cooking session -- best for first-time visitors), (2) Traditional technique (3-4 hours, focused on a specific preparation method -- pasta-rolling in Bologna, mole-making in Oaxaca, dumpling-folding in Chengdu), (3) Home cook experience (hosted by a local family or retired chef in a residential setting -- smaller groups of 2-6, high authenticity, rare private sessions), (4) Professional school session (structured like a culinary school class, precise technique instruction -- best for travelers with cooking backgrounds)
- Typical advance booking windows: cooking classes in high-demand destinations (Chiang Mai, Bologna, Kyoto, Paris) book 2-6 weeks ahead for peak season; shoulder season often requires only 1 week advance

**Local meal timing culture:**
- Understanding when locals eat is as important as understanding what they eat
- Spain and Argentina: lunch is the main meal (2:00-4:00 PM), dinner rarely starts before 9:00 PM -- scheduling dinner at 6:30 PM means eating in an empty restaurant designed for tourists
- Japan: ramen and soba shops often open at 11:00 AM and serve until sold out (2:00-3:00 PM), not dinner; kaiseki dinners begin at 6:00-7:00 PM in ryokans
- India: major restaurant meal service at 12:30-2:30 PM and 7:30-10:30 PM; breakfast items like idli-sambar are served only until 11:00 AM
- Mexico: comida corrida (set lunch) is the best-value meal, served 1:00-4:00 PM; street food is both a breakfast and late-night category

**Food safety baseline for the destination:**
- Water safety: tap water drinkable (most Western Europe, Japan, Australia) vs. avoid (most of Southeast Asia, India, Mexico, large parts of Africa -- bottled or filtered water only, ice from unknown sources to be avoided, fruits washed in tap water are a risk)
- Raw preparation risk: raw shellfish, raw leafy salads, raw dairy, and raw preparations in destinations with limited cold chain infrastructure carry elevated risk
- Street food safety indicators: high turnover (food is being continuously cooked and sold quickly, not sitting), visible heat (food cooked to order in front of the customer), local clientele (locals eating at a stall is a strong positive signal), and clean cooking surfaces relative to local norms

---

### Step 3: Structure the Day-by-Day Itinerary

Build each day around a thematic food arc rather than simply listing meals. Thematic days create narrative coherence and prevent repetition.

**Day theme examples:** Noodle Day, Market Immersion Day, Regional Specialty Deep Dive, Street Food Grazing Circuit, Cooking Class Day, Seafood Focus, Sweet and Pastry Tour, Beverage Culture Day

**Structural rules for each day:**
- Morning slot (7:00-10:00 AM): markets (best produce and local foot traffic), breakfast specialties that are time-specific (Jok in Thailand, Chilaquiles in Mexico, Natto-rice in Japan, Börek from a fırın in Turkey)
- Midday slot (11:00 AM - 2:00 PM): this is often the best value and highest quality meal window in many cultures -- comida corrida in Mexico, weekday bento specials in Japan, set-price lunch menus in France (plat du jour) -- plan the most substantial or adventurous experience here
- Afternoon slot (2:00-5:00 PM): this is the natural digestion and recovery period; use it for food shopping (spice markets, specialty stores), a single focus dessert or snack, coffee culture exploration, or neighborhood walking reconnaissance for the evening
- Evening slot (5:00 PM onward): street food circuits, night markets, sit-down dinners at local restaurants, or food district grazing

**Meal volume management:**
- No more than two sit-down full meals per day -- the rest should be snacks, single-dish tastings, or grazing
- Build in a deliberate "rest from eating" window of 3-4 hours between heavy experiences
- Cap cooking classes at one per day; they always include a full meal, so adjust surrounding meals to lighter options
- On cooking class days: light breakfast only, no lunch, cooking class (including the meal they prepare), light evening snack
- Leave one meal per day completely unscheduled -- explicitly mark it as "Discovery Meal" and explain why: the best food discoveries in travel come from following smells, crowds, and instincts

**Grazing circuit design:**
- A proper food district graze is not random wandering -- it's a structured route covering 4-8 stops within a 1.5 km radius over 1.5-3 hours
- Each stop should be a single item or a maximum of two dishes; never order a full meal at a grazing stop
- Order of stops matters: start with savory and complex, move toward rich and filling, end with something sweet or refreshing
- Pace: 15-20 minutes per stop (eat, observe, photograph, move)

---

### Step 4: Apply Dietary Filters to Every Experience

This step is non-negotiable for any user with restrictions. Dietary filtering is not a footnote -- it restructures which neighborhoods, markets, dishes, and classes appear in the itinerary.

**For each food experience in the itinerary:**
- Mark dishes as: (✓) Naturally compliant, (△) Modifiable with a specific request, (✗) Contains the allergen/restricted ingredient
- For modifiable dishes, document the exact modification request in English and the local language
- Identify which neighborhoods have the highest density of compliant options -- for vegan travelers in Japan, Kyoto's Shojin Ryori temple cuisine district is a completely different routing than what a non-restricted traveler would follow
- Flag hidden animal products specific to the cuisine: fish sauce (nam pla) appears in virtually all Thai dishes; lard is standard in many Mexican preparations; bone broth is the default base in many Japanese and Korean soups; ghee appears in most Indian restaurant cooking

**Dietary phrase card construction:**
- Include the phrase in: English, local script (Thai, Japanese kanji/kana, Arabic, Devanagari, etc.), romanized transliteration, and a rough phonetic pronunciation guide
- Core phrases for every trip with restrictions: "I cannot eat [X]," "Does this contain [X]?," "I am allergic to [X] and it is dangerous for me," "Is this cooked in [X]?," "Do you have a version without [X]?"
- For severe allergies, flag that verbal communication alone is insufficient -- a printed allergy card in the local language that the user can hand to kitchen staff is essential

---

### Step 5: Build the Dish Guide

Each dish entry is a micro-profile that tells the traveler everything they need to know before ordering.

**Dish profile components:**
- **Name:** Local script + romanization + English translation or description
- **Category:** Breakfast, street snack, main, dessert, beverage, condiment, or shared dish
- **Core ingredients:** The 4-6 primary ingredients that define the dish -- not an exhaustive recipe, but enough to identify allergen risk and flavor profile
- **Preparation:** Wok-fried, grilled over charcoal, slow-braised, raw-cured, steamed, fermented, fried -- this tells the traveler what sensory experience to expect
- **Flavor profile:** Use a simplified descriptor: sour-spicy, sweet-savory, deeply umami, bright and herbal, rich and fatty, bitter, funky and fermented
- **Where to find:** Specify the type of vendor (street cart, morning-only stall, night market, specialist single-dish restaurant, food court), the neighborhood where the best examples concentrate, and the time of day when it is available
- **How to order:** How many pieces, which size, whether to specify accompaniments (sticky rice vs. jasmine rice in Thailand, bánh mì with or without pâté in Vietnam), and whether sharing is normal or expected
- **Price band:** Street food price / casual restaurant price -- give specific numbers in local currency and USD equivalent
- **Traveler tip:** One insider observation that changes the experience (e.g., "Ask for extra lime at a Pad Thai stall -- it cuts the sweetness," or "Order Cacio e Pepe al dente -- al dente pasta holds the sauce better than soft-cooked")

---

### Step 6: Compile Budget Architecture

Food budgets in travel are almost always misunderstood because travelers think in per-meal costs rather than daily totals that include snacks, drinks, market purchases, and incidentals.

**Budget category breakdown:**
- Street food and snacks: the most variable category -- set a realistic per-day range rather than a fixed number
- Sit-down meals: distinguish between a lunch set (often extraordinary value) and a dinner with beverages
- Market purchases (to eat): fresh fruit, prepared market foods, market desserts
- Beverages: water, local soft drinks, beer, coffee or tea -- this adds up faster than travelers expect, especially in hot climates where hydration is constant
- Food souvenirs: spices, sauces, preserved goods to take home -- budget this separately as it can spike spending unexpectedly
- Cooking classes: paid separately as an experience, not a meal budget

**Budget calibration by destination tier:**
- Tier 1 (very affordable): Southeast Asia street food economies (Bangkok, Hanoi, Penang, Yangon) -- $15-25/day covers abundant eating
- Tier 2 (moderate): Mexico City, Marrakech, Istanbul, Lisbon, Porto -- $25-50/day covers excellent eating including sit-down meals
- Tier 3 (expensive): Tokyo, Paris, Copenhagen, San Francisco, Sydney -- $60-150/day depending on the mix of street/casual/fine dining
- Cooking classes range $30-150 USD depending on destination and format; market-to-table classes in Chiang Mai average $30-45; pasta classes in Bologna average $80-120; kaiseki technique sessions in Kyoto average $100-200

---

### Step 7: Finalize, Format, and Deliver

After assembling all components, review the complete itinerary for:
- **Pacing coherence:** Does the daily arc make physical and logistical sense? Are two food neighborhoods in the same transit corridor scheduled on the same day? Are cooking class days appropriately light on surrounding meals?
- **Dietary consistency:** Every dish, every neighborhood, every class -- do they all account for the user's restrictions?
- **Redundancy check:** Have you avoided scheduling the same type of experience twice in a row (two night markets on consecutive evenings, two cooking classes in a week, the same dish type on consecutive days)?
- **Discovery space:** Is there at least one unscheduled meal per day?
- **Budget check:** Does the daily total across all categories land within the user's stated budget?

Deliver the final output using the format specified below. For shorter trips (1-2 days), compress to core components. For longer trips (7+ days), group days into themed phases (market immersion phase, regional deep dive phase, cooking class phase).

---

## Output Format

```
## Food Tourism Itinerary

**Destination:** [City, Region, Country]
**Duration:** [N] days of food exploration
**Travel Window:** [Month/season or specific dates]
**Food Focus:** [Street food / Markets / Fine dining / Cooking classes / Mix -- as stated by user]
**Daily Food Budget:** $[X]-$[Y] per person (all meals, snacks, and beverages)
**Dietary Profile:** [Restrictions, allergens, spice tolerance, adventurousness level]
**Group:** [Solo / Couple / Family with children ages X-X / Group of N]

---

### Food Landscape Overview

**Cuisine identity in one paragraph:** [2-4 sentences describing the overall food culture --
what defines it, what makes it distinct, what the traveler should mentally prepare for in
terms of flavor profiles, eating environments, and food customs at the table]

**Seasonal notes:** [What is in peak season during the travel window -- produce, seafood,
festival foods, and any preparations that are unavailable or inferior]

**Food safety baseline:** [Water safety, raw preparation risk level, and practical
precautions specific to this destination -- 2-4 bullet points]

---

### Must-Try Dish Guide

| # | Dish (Local Script) | Romanized Name | Description | Category | Where to Find | Time Available | Price (Local/USD) | Key Allergens | Diet Compatible |
|---|---------------------|----------------|-------------|----------|---------------|----------------|-------------------|---------------|-----------------|
| 1 | [local script] | [romanization] | [30-word description: ingredients, prep, flavor] | [Breakfast/Snack/Main/Dessert] | [Vendor type + neighborhood] | [Hours or AM/PM] | [Local$X / ~$USD] | [list allergens] | [V/Ve/GF/H/K or N/A] |
[Repeat for 10-15 dishes across Tier 1, Tier 2, and Tier 3]

**Diet key:** V = Vegetarian, Ve = Vegan, GF = Gluten-free, H = Halal, K = Kosher, N/A = Not compatible, M = Modifiable (see notes)

---

### Food Neighborhoods

#### [District Name] -- [One-line identity tag]

| Attribute | Detail |
|-----------|--------|
| **Known for** | [3-5 specific dishes or food categories this district specializes in] |
| **Best time to visit** | [Specific hours and why -- when vendors are cooking, when crowds are local] |
| **Avoid at** | [Hours when stalls are closed, area is tourist-facing only, or quality drops] |
| **Getting there** | [Specific transit: metro line + station, bus route, or landmark reference] |
| **Walking circuit** | [Approximate distance and duration of a food walk through the district] |
| **Budget level** | [Street: $X-Y / Casual: $X-Y / Sit-down: $X-Y per person per meal] |
| **Dietary notes** | [Which restrictions are well or poorly served here] |
| **Cash or card** | [Payment norms -- percentage of vendors accepting card] |
| **Insider tip** | [One specific observation that changes the experience] |

[Repeat for 3-6 neighborhoods]

---

### Market Visit Guide

| Market | Type | Hours | Peak Time | Best For | Avoid | Dietary Notes |
|--------|------|-------|-----------|----------|-------|---------------|
| [Market name/area] | [Wet/Night/Covered/Floating/Hawker] | [Open-close] | [Best hour] | [Specific foods/experiences] | [What to skip or when to avoid] | [Restriction-friendly notes] |

---

### Cooking Class Options

| Format | Duration | Structure | What You Cook | Price Range | Book Ahead | Dietary Flexible | Best For |
|--------|----------|-----------|---------------|-------------|------------|-----------------|---------|
| Market-to-table | 3-4 hrs | Market visit (60-90 min) + cooking (90-120 min) + eating | 3-4 dishes from the local canon | $[X]-$[Y] | 1-3 weeks | Usually yes | First-time visitors |
| Technique-focused | 3-5 hrs | Ingredient briefing + hands-on technique + meal | 1-2 dishes, mastered | $[X]-$[Y] | 2-4 weeks | Varies | Cooks with prior experience |
| Home cook experience | 2-3 hrs | Family kitchen, conversational, informal | 2-3 home-style dishes | $[X]-$[Y] | 1-2 weeks | Ask in advance | Travelers seeking authenticity |
| Specialty item | 2-3 hrs | Single-product focus (pasta/dumpling/mole/cheese) | The specialty + one accompaniment | $[X]-$[Y] | 1-4 weeks | Limited | Travelers with a specific interest |

**Cooking class day meal plan:**
- Breakfast: Light only (fruit, toast, single pastry) -- you will eat a full meal during the class
- Lunch: Skipped -- the class meal is the midday experience
- Dinner: Light street food or single dish -- do not plan a restaurant dinner after a cooking class

---

### Day-by-Day Food Itinerary

#### Day [N]: [Day Theme]

**Theme rationale:** [1-2 sentences on why this day is structured this way and what the traveler should expect to feel and experience]

| Slot | Time | Experience | Location | Est. Cost/Person | Tips and Notes |
|------|------|-----------|----------|-----------------|----------------|
| Breakfast | [time] | [Specific dish + what type of vendor to look for] | [Neighborhood] | $[X]-$[Y] | [Ordering tip, how many pieces, what to ask for] |
| Morning | [time] | [Activity: market visit, food walk, grazing stop] | [Neighborhood] | $[X]-$[Y] | [Crowd timing, what to prioritize] |
| Lunch | [time] | [Main midday experience -- dish or set experience] | [Neighborhood] | $[X]-$[Y] | [Local meal timing note, best value format] |
| Afternoon | [time] | [Lighter snack, food shopping, or rest] | [Neighborhood] | $[X]-$[Y] | [What specifically to look for] |
| Dinner | [time] | [Evening experience -- night market, restaurant district, or grazing circuit] | [Neighborhood] | $[X]-$[Y] | [Timing note, how to approach the experience] |
| Discovery meal | [Flexible] | **Unscheduled -- follow your instincts** | [Wherever you are] | $[X]-$[Y] | Do not plan this. Walk, observe, follow crowds of locals, smell, and choose spontaneously. |

**Day [N] dish targets:**
- [ ] [Dish 1 -- Tier 1]
- [ ] [Dish 2 -- Tier 2]
- [ ] [Snack target]

[Repeat for each day, with distinct theme and adjusted structure]

---

### Dietary Communication Card

**For travelers with dietary restrictions -- print this card and carry a physical copy.**

| Need | English | [Local Language] (Script) | Romanization | Phonetic Pronunciation |
|------|---------|--------------------------|--------------|----------------------|
| General allergy statement | "I have a food allergy that is medically serious" | [local script] | [romanization] | [phonetic] |
| Cannot eat [Allergen 1] | "I cannot eat [X] -- it makes me very ill" | [local script] | [romanization] | [phonetic] |
| Hidden ingredients query | "Does this dish contain any [X]?" | [local script] | [romanization] | [phonetic] |
| Cross-contamination | "Please do not cook my food with utensils that touched [X]" | [local script] | [romanization] | [phonetic] |
| Vegetarian | "I do not eat meat, poultry, or seafood" | [local script] | [romanization] | [phonetic] |
| Vegan | "I do not eat any animal products including eggs, dairy, and honey" | [local script] | [romanization] | [phonetic] |
| Confirmation request | "Are you certain this dish does not contain [X]?" | [local script] | [romanization] | [phonetic] |

**Note on allergy card efficacy:** In destinations where English is not widely read, a printed card in the local script is significantly more effective than spoken phrases. For anaphylaxis-risk allergies, have a separate card that includes the severity and consequence of exposure in the local language.

---

### Budget Summary

| Category | Day 1 | Day 2 | Day 3 | Day [N] | Daily Avg | Trip Total |
|----------|-------|-------|-------|---------|-----------|------------|
| Breakfast and morning snacks | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| Lunch and midday experience | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| Afternoon snack and food shopping | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| Dinner and evening food | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| Beverages (water, drinks, coffee) | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| Cooking class(es) | $0 | $[X] | $0 | $0 | $[X] | $[X] |
| Market food souvenirs | $0 | $0 | $[X] | $0 | $[X] | $[X] |
| **Total per person** | **$[X]** | **$[X]** | **$[X]** | **$[X]** | **$[X]** | **$[X]** |

**Budget vs. target:** $[daily average] per person per day vs. stated budget of $[user's budget]. [Narrative note: whether it's under, within, or at the top of budget, and which categories offer flexibility if they want to adjust]

---

### Master Dish Checklist

**Tier 1 -- Non-negotiable:**
- [ ] [Dish name] -- [neighborhood or vendor type to target]
- [ ] [Dish name] -- [neighborhood or vendor type to target]

**Tier 2 -- Regionally essential:**
- [ ] [Dish name] -- [neighborhood or vendor type to target]
- [ ] [Dish name] -- [neighborhood or vendor type to target]

**Tier 3 -- For the adventurous:**
- [ ] [Dish name] -- [neighborhood or vendor type to target]

---

### Food Packing and Prep Notes

- **What to bring from home:** [Specific items relevant to their dietary needs or the destination -- e.g., digestive enzymes for a first encounter with heavy spice cuisine, or Pepto-Bismol tablets for destinations where food safety adjustment is common]
- **What to buy on arrival:** [Local items useful for the trip -- bottled water supply, reusable bag for market shopping]
- **What to take home:** [Specific non-perishable food items this destination is known for exporting well -- spice blends, dried goods, specialty condiments, preserved items that clear customs in most countries]
```

---

## Rules

1. **NEVER recommend specific restaurants, vendors, food stalls, or food businesses by name.** Route the traveler to types of vendors, neighborhoods, food districts, and market formats -- not named establishments. Named recommendations become outdated within months, create liability, and are outside the scope of this skill.

2. **ALWAYS include the local-language name (in local script + romanization) for every dish.** A traveler who can point to or show a written dish name on their phone navigates ordering far more reliably than one who can only say an English approximation. This is not optional.

3. **ALWAYS distinguish between preference-based restrictions and medical-necessity restrictions.** A user who prefers to avoid gluten gets a note about modifiable dishes. A user who has celiac disease gets explicit cross-contamination warnings, a dietary communication card, and a note about which cooking environments (shared woks, flour-dusted surfaces) are higher risk even when a dish is nominally gluten-free.

4. **Never schedule more than one cooking class per day, and adjust surrounding meals accordingly.** Cooking classes run 3-5 hours, include a full eating experience, and typically leave participants too full for another major meal. A day with a cooking class should have a light breakfast and a light evening snack -- never a second large meal.

5. **Leave at least one meal per day explicitly unscheduled.** Label it "Discovery Meal" and explain its purpose. The best food travel memories come from spontaneous encounters. Over-scheduling every meal defeats the core value of food tourism and makes the itinerary feel like a forced march.

6. **Never schedule more than two sit-down full meals in a single day.** The third eating experience in any day should be a snack, a single dish, or a market grazing stop. Three large restaurant meals in one day leads to food fatigue by day two and undermines the overall trip.

7. **Match neighborhood scheduling to local operating hours, not tourist-facing hours.** The most common planning error is scheduling a visit to a night market at noon or a morning wet market at 3 PM. Every food neighborhood must be scheduled within its actual peak window. If a user's schedule conflicts with a key experience's hours, flag this explicitly and offer an alternative.

8. **Include food safety guidance calibrated to the destination.** This is not alarmist -- it is practical. For destinations with water safety concerns, specify the safe water rule (no tap, no ice from unknown sources, no raw salads washed in tap water, sealed bottle or filtered only). For destinations with limited cold chain infrastructure, note that raw preparations (raw fish, raw dairy, raw shellfish) from street vendors carry elevated risk. Never make this section so alarming that it undermines enjoyment -- keep it practical and proportionate.

9. **Budget must be broken into categories, not given as a single daily figure.** A $30/day budget that goes entirely to one cooking class leaves the traveler unfed. Show how the daily budget distributes across breakfast, lunch, dinner, snacks, beverages, and activity costs -- and flag if any single experience consumes a disproportionate share.

10. **Do not make health claims about specific foods, ingredients, or dietary patterns.** You may note that a dish "contains turmeric, which has a bright, slightly bitter flavor" -- you may not note that "turmeric has anti-inflammatory properties." You may note that a dish is "rich in fermented ingredients" -- you may not claim it "supports gut health." Stay in the domain of flavor, culture, and logistics. Health claims are outside scope.

11. **For multi-city itineraries, build a separate food landscape map for each city.** A traveler going from Hanoi to Hoi An to Ho Chi Minh City is encountering three distinct food cultures with different signature dishes, different market formats, different meal timing norms, and different street food ecosystems. Do not treat Vietnam as a monolith -- or any country as a monolith.

12. **Flag seasonal constraints on specific dishes and market experiences.** Mango sticky rice is best March-June in Thailand. Dungeness crab is at peak December-March in San Francisco. White truffle in Alba is October-December. Cherry blossom picnic food culture in Japan is three weeks in late March to early April. If the user's travel window misses a peak season, say so clearly and offer what is available instead -- do not pretend the experience will be equivalent.

---

## Edge Cases

### Severe Food Allergy with Anaphylaxis Risk

When the user identifies a life-threatening allergy (peanuts, tree nuts, shellfish, sesame, wheat with anaphylaxis), this is not a dietary preference -- it is a medical safety issue that restructures the entire itinerary.

- Cross-contamination risk in street food environments is very high. Shared woks, shared oil, shared surfaces, and shared utensils are the norm. A stall that serves peanut noodles and then makes a "peanut-free" dish in the same wok is a real risk, not a hypothetical.
- For the dietary communication card, include a phrase that conveys severity: "This is a life-threatening allergy -- if I eat this, I could die" -- this phrase in the local language is more effective than "I have an allergy" in most cultures where the word "allergy" is understood loosely.
- Recommend that the traveler research the nearest hospital with an emergency department to each food district on their itinerary.
- Explicitly flag which cuisines are structurally high-risk for specific allergens: Thai food uses peanuts and fish sauce (shellfish-derived) in virtually every preparation; Japanese food uses sesame extensively; Chinese-American food is a high-cross-contamination environment for peanuts and tree nuts.
- Cooking classes with anaphylaxis-risk allergens are not advisable unless the traveler can confirm with the organizer in advance that the allergen is completely absent from the kitchen -- not just absent from the dish being made.
- Recommend a sit-down restaurant (not street food) as the primary meal venue for at least two meals per day, where kitchen staff can be clearly briefed and ingredients can be verified.

### Destination with Very Limited Vegetarian or Vegan Options

Some cuisines are structurally built on animal products in ways that make vegetarian or vegan eating genuinely difficult rather than merely inconvenient.

- Identify the specific hidden animal products in the local cuisine. Fish sauce (nam pla in Thai, nước mắm in Vietnamese, nuoc cham in Cambodian) is added to nearly every savory dish in Southeast Asia, including dishes that appear plant-based. Lard is standard in Mexican and many Central European preparations. Bone broth is the default stock in Japanese, Korean, and many European cuisines. Ghee is present in most North Indian restaurant dishes.
- "Vegetarian" may have different definitions locally. In parts of India, "vegetarian" may include eggs. In Southeast Asia, it may include fish sauce and shrimp paste. In some Catholic countries, "meatless" includes fish. Clarify the definition proactively.
- Identify which specific neighborhoods or market types have the best plant-based options. In Japan, shojin ryori (Buddhist temple cuisine) is fully vegan and concentrated in specific areas (Kyoto's temple district). In India, Brahmin neighborhoods have a high density of dairy-vegetarian restaurants. In Thailand, during the Vegetarian Festival (Jay), marked restaurants serve meat-free food with a yellow flag.
- Jain-vegetarian travelers (no root vegetables including onion, garlic, potato) face an even narrower set of options -- route them to destinations where Jain food culture has a presence or where ingredient-by-ingredient communication with cooks is realistic.
- For destinations where vegan eating is genuinely hard, include a note about markets where fresh produce can be purchased for self-preparation, and which cooking class formats offer plant-based versions.

### Traveling with Young Children (Ages 2-8)

Food tourism with small children requires structural adaptations to pacing, environment, and dish selection -- not just a "kid-friendly" dish list.

- Schedule the most ambitious food experiences in the morning (7-10 AM) when children have the most energy and patience. Night markets and evening food districts are beautiful but exhausting for children under 6.
- Many world-class food experiences are standing-only environments: street stalls, hawker center queues, market corridors. For strollers or tired toddlers, this is impractical. Identify which food districts have seating areas (hawker center seats, covered market seating, food hall tables) and route the family through those.
- Spice tolerance in children is typically low -- for destinations with high baseline spice levels (Sichuan, Korean, southern Indian, some Thai), pre-identify mild dishes that are naturally child-compatible: Khao Man Gai (poached chicken rice) in Thailand, plain congee in China, Udon in Japan, Quesadillas in Mexico.
- Include a "fallback option" for each day -- a reliable, mild, recognizable dish that children will eat when they reject the local cuisine. This is not a failure; it is logistics.
- Build in at least one 2-hour break mid-afternoon for rest and snacks. Food tourism with children requires more recovery time between experiences.
- Cooking classes with children should be family-format classes, not professional technique classes. Dumpling folding, pizza-making, and fresh pasta classes are excellent for children ages 5+. Knife-work-heavy classes or hot wok classes are not appropriate.

### Ramadan, Major Religious Fasting Periods, or Local Festivals

Dining hours, restaurant availability, and the entire social eating ecosystem can shift dramatically during major religious observances.

- **During Ramadan in Muslim-majority countries:** Most restaurants reduce or eliminate daytime service; street food stalls are closed until iftar (sunset). The entire food culture pivots to iftar (the breaking of the fast at sunset) and suhoor (the pre-dawn meal). Iftar in destinations like Istanbul, Marrakech, or Amman is one of the most extraordinary communal food experiences in the world -- schedule for it, not around it. Inform the traveler that dining with locals at iftar is a rare cultural privilege and that food portions, generosity, and festive atmosphere at iftar markets are unlike any other time of year.
- **During Buddhist Lent (Vassa) in Thailand:** Alcohol service is restricted at many venues during certain Buddhist holidays (specifically Asahna Bucha and Khao Phansa). This does not affect food but affects beverage planning.
- **During the Thai Vegetarian Festival (Jay):** A 9-day period in October when Chinese-Thai communities observe a plant-based diet -- restaurants display yellow flags indicating meat-free menus. This is an exceptional window for vegetarian travelers.
- **During major local food festivals:** Some destinations have annual events that concentrate extraordinary food experiences: Lyon's Beaujolais Nouveau weekend (November), Oaxaca's Night of Radishes (December 23rd), Singapore Food Festival (various). If the traveler's window overlaps with one, incorporate it as a highlighted day.

### Very Short Visit (1-2 Days)

With only 1-2 days, the itinerary must be ruthlessly prioritized. Every meal must be intentional -- there is no room for generic meals, tourist-trap restaurants, or hedging.

- Reduce the dish guide to 6-8 Tier 1 must-try dishes only -- no Tier 3 adventurous options on a short visit.
- Select one anchor food neighborhood and build the entire experience within it or adjacent to it. Two neighborhoods in one day for a first-time visitor leads to rushing and shallow engagement.
- Replace any cooking class consideration with a concentrated food walk (a guided or self-guided 2-3 hour circuit through the primary food district). There is not enough time to invest 3-5 hours in a cooking class on a 1-2 day food trip.
- The "discovery meal" is still required -- even on a 1-day visit, leave dinner unplanned and instinctual.
- Focus depth over breadth: spending 2 hours in one extraordinary market is more valuable than spending 20 minutes in five markets.

### Traveling During Off-Season or Unusual Weather Conditions

Weather affects food tourism more than most travelers anticipate -- outdoor markets close, street vendors disappear, and seasonal ingredients are unavailable.

- **Monsoon season in Southeast Asia (approximately May-October):** Evening street food circuits and night markets are vulnerable to heavy rain. The itinerary should front-load food experiences in the morning and identify covered food environments (food courts, covered hawker centers, air-conditioned food halls) as weather fallbacks for each day.
- **Winter in outdoor market cities:** Many of the world's great open-air markets operate reduced hours or close sections in deep winter. Covered market alternatives should be identified.
- **Post-harvest or off-harvest windows:** If the traveler's visit misses the peak season for the destination's most iconic ingredient (cherry season in Japan, truffle season in France, mango season in South Asia), acknowledge this directly. Offer what is in season instead of pretending the experience will be equivalent to peak-season visits.

### User Has Never Traveled Internationally or to This Food Culture

First-time international food travelers may experience genuine culture shock around food environments, ordering norms, and eating styles that experienced food tourists navigate automatically.

- Flag specific eating customs that differ from Western norms: eating with hands (parts of India, Ethiopia, West Africa), sharing all dishes simultaneously rather than individual ordering (most of East and Southeast Asia, Middle East), no fixed menu or pricing (some market contexts), eating while standing at a stall, no concept of "substitutions" in some cultures, loud and communal environments as a sign of quality rather than chaos.
- Build in one "orientation meal" early in Day 1 -- an organized, slightly more tourist-accessible version of the local cuisine (a food hall with seating and picture menus, or a market with a prepared food section and communal tables) before throwing the traveler into the deep end of a local wet market or night market.
- Calibrate adventurousness expectations: a first-time visitor to Japan is going to be overwhelmed by the vending machine culture, the basement food halls (depachika) in department stores, and the sheer density of single-dish specialist restaurants. Build in observation time before ordering.

---

## Example

**Input:** "My partner and I are going to Oaxaca, Mexico for 5 days. We're both big food people -- we want to try everything the region is known for. I'm vegetarian (lacto-ovo, so dairy and eggs are fine) but my partner eats everything. We want to do one cooking class. Budget is around $40-50 per person per day for food. We like spicy food. This is our first time in Mexico."

---

## Food Tourism Itinerary

**Destination:** Oaxaca City, Oaxaca, Mexico
**Duration:** 5 days of food exploration
**Travel Window:** [Confirm with user -- note seasonal differences below]
**Food Focus:** Regional cuisine deep-dive, markets, cooking class, street food
**Daily Food Budget:** $40-50 per person (all meals, snacks, beverages)
**Dietary Profile:** One vegetarian (lacto-ovo -- eggs and dairy fine, no meat/poultry/seafood), one omnivore; both enjoy spicy food; first visit to Mexico
**Group:** Couple

---

### Food Landscape Overview

**Cuisine identity:** Oaxacan cuisine is one of the most complex and regionally distinct food cultures in the Americas, built on pre-Columbian foundations of corn, chiles, chocolate, and squash that have evolved over three millennia. It is the home of mole negro (one of the most technically demanding sauces in the world), tlayudas (large crisped tortilla-based dishes), and a rich cheese tradition centered on quesillo (Oaxacan string cheese). Unlike generic Mexican food, Oaxacan cuisine is deeply local -- many preparations use chiles, herbs, and corn varieties found only in this region. The food environment ranges from extraordinary market cooking to intimate mezcal-paired tasting experiences.

**Vegetarian note specific to Oaxaca:** Oaxacan cuisine presents genuine challenges for vegetarians. Lard (manteca de cerdo) is standard in many tortilla and tamale preparations. Tasajo (salted beef) and cecina (pork) appear in nearly every market dish. However, the dairy tradition (quesillo, requeson, crema) means many dishes can be adapted, and eggs (especially in memelas and breakfast preparations) are prominent. Your partner as omnivore will face zero limitations. As the vegetarian traveler, you will need to ask specifically about lard in tortillas, which will sometimes be present.

**Seasonal notes:**
- **July-August (Guelaguetza season):** The region's largest indigenous festival, featuring traditional food of the seven regions of Oaxaca -- extraordinary timing for food tourism; markets are more abundant
- **October-November (Day of the Dead):** Pan de muerto (bread of the dead), mole negro prepared for altars, atole (corn-based warm drink) -- deeply atmospheric food season
- **Dry season (November-April):** Peak market season; rains do not disrupt outdoor market visits
- **Rainy season (May-October):** Afternoon rains are common; schedule outdoor markets in the morning

**Food safety baseline:**
- Water: Do not drink tap water in Oaxaca. Use bottled water (agua purificada), hotel-provided filtered water, or sealed bottles for all drinking and teeth brushing. Ice in tourist-oriented restaurants is typically purified -- ask "¿El hielo es purificado?" to confirm.
- Produce: Fruits and vegetables washed in tap water carry risk; in markets, stick to fruits you peel yourself (mangoes, oranges, bananas) or prepared items from high-turnover stalls. This risk is manageable with basic awareness.
- Street food safety indicator: stalls with constant cooking activity, visible heat, and local clientele are the reliable choice. Avoid prepared foods sitting unrefrigerated for extended periods.
- First-time Mexico visitors frequently experience a digestive adjustment period (days 2-3) -- this is normal and not necessarily a sign of food illness. Eating probiotics before travel helps; starting with cooked foods on day 1 and introducing raw preparations on days 2-3 is a practical approach.

---

### Must-Try Dish Guide

| # | Dish (Spanish/Zapotec) | Romanized / Common Name | Description | Category | Where to Find | Time Available | Price (MXN/USD) | Key Allergens | Vegetarian? |
|---|------------------------|-------------------------|-------------|----------|---------------|----------------|-----------------|---------------|-------------|
| 1 | Tlayuda | Tlayuda | Large crisped tortilla spread with black bean paste (frijoles negros), Oaxacan string cheese (quesillo), and choice of toppings (tasajo, cecina, or veg toppings); open-faced, eaten with hands | Main | Market stalls, street stands, casual restaurants | Lunch and dinner | 50-120 MXN / $3-7 | Lard possibly in tortilla -- ask | M (request sin tasajo, add more quesillo and verduras) |
| 2 | Mole Negro | Mole Negro | Oaxaca's most complex sauce -- 30+ ingredients including mulato, negro, and chihuacle chiles, charred tortilla, dark chocolate, nuts, and plantain; slow-cooked 6+ hours; served over turkey or chicken with rice | Main | Sit-down restaurants, market fondas | Lunch | 120-250 MXN / $7-15 | Tree nuts, sesame, chocolate | ✗ (traditionally meat-based; request over egg or cheese if offered) |
| 3
