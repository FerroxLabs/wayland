---
name: budget-travel-planner
description: |
  Creates line-item travel budget breakdowns by category (accommodation,
  transport, food, activities, contingency) with per-day and total cost
  estimates. Gathers destination, trip duration, traveler count, and spending
  preferences to produce a currency-agnostic cost table the user can track
  against actual spending.
  Use when the user asks to create a travel budget, estimate trip costs,
  plan a budget-friendly vacation, or break down travel expenses by category.
  Do NOT use for annual personal finance budgeting (use personal-finance
  skills), business travel expense reporting, or trip itinerary building
  (use trip-itinerary-builder).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel budgeting planning personal-finance"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Budget Travel Planner

## When to Use

**Use this skill when:**
- The user explicitly asks to create a travel budget, cost estimate, or spending plan for a specific trip
- The user names a destination and wants to know how much money to bring or save
- The user has a fixed total budget (e.g., "$3,000 for two people") and wants to know if a trip is feasible and how to allocate it
- The user wants a per-day spending breakdown they can track against actual spending during the trip
- The user wants to compare budget tiers (hostel backpacker vs. mid-range hotel vs. boutique) at a single destination to decide what level is right for them
- The user is planning a multi-city or multi-country trip and needs cost estimates across different currency zones
- The user wants to identify where to cut costs on a trip they have already partially planned (flights booked, accommodation not yet chosen)
- The user asks how much a specific category will cost -- "how much should I budget for food in Vietnam for 10 days?"

**Do NOT use when:**
- The user wants a day-by-day itinerary with timed activities and logistics -- use `trip-itinerary-builder` instead
- The user is tracking or projecting annual vacation spending as part of household financial planning -- use `personal-finance` skills instead
- The user needs to file a business travel expense report or justify travel costs to an employer -- this is not a reimbursement tool
- The user wants a packing list -- use `packing-list-builder` instead
- The user is comparing multiple destinations to decide where to go based on cost -- use `destination-comparison` instead; return here once the destination is chosen
- The user wants general travel tips or cultural advice unrelated to cost estimation -- this skill produces numbers, not narrative travel guides
- The user is planning a day trip or activity from a home base with no accommodation cost -- this skill is designed for multi-night trips requiring full budget scaffolding

---

## Process

### Step 1: Gather Budget Parameters (Always First)

Before estimating a single number, collect these inputs. If the user has not provided them, ask in one consolidated message rather than one question at a time:

- **Destination:** City or region (city-level specificity matters enormously -- Bali vs. Seminyak vs. Ubud can mean 40% cost differences)
- **Trip duration:** Number of nights (not days -- accommodation costs anchor on nights)
- **Traveler count:** Adults vs. children, and whether the group will share rooms
- **Budget level preference:** Ask the user to choose from: Backpacker / Budget / Moderate / Upscale -- or provide a fixed total budget number
- **Flights:** Already booked (get the price paid), needs estimate, or excluded from this budget
- **Accommodation type preference:** Hostel dorm, hostel private room, guesthouse, budget hotel, mid-range hotel, boutique hotel, vacation rental, camping, or a mix
- **Food approach:** Street food / cook in accommodation / casual sit-down / mix of levels
- **Must-do paid experiences:** Any tours, concerts, theme parks, diving, cooking classes, or bucket-list items the user already has in mind
- **Home currency vs. destination currency:** Establish which currency to present all figures in; always note the exchange rate used

**If the user skips any of these**, make a reasonable assumption, state it explicitly, and flag it as an assumption they can override.

### Step 2: Anchor Cost Ranges to Destination Tier

Not all destinations cost the same at any budget level. Classify the destination into one of four cost tiers before estimating anything:

**Tier 1 -- High-cost destinations** (Western Europe capitals, Scandinavia, Japan, Australia, New Zealand, Singapore, Switzerland, Iceland):
- Budget traveler: $60-90/day
- Moderate: $120-180/day
- Upscale: $250-400+/day

**Tier 2 -- Mid-cost destinations** (Southern and Eastern Europe, South Korea, Japan secondary cities, parts of South America, Mexico City, Cape Town):
- Budget: $35-60/day
- Moderate: $80-130/day
- Upscale: $180-300/day

**Tier 3 -- Low-cost destinations** (Southeast Asia, Central America, South Asia, the Balkans, parts of Africa):
- Budget: $20-40/day
- Moderate: $50-90/day
- Upscale: $120-200/day

**Tier 4 -- Ultra-budget destinations** (rural Vietnam, rural India, Nepal outside Everest region, Cambodia, Ethiopia):
- Budget: $15-25/day
- Moderate: $35-60/day
- Upscale: $80-150/day

These ranges represent per-person daily spend EXCLUDING flights. Use them as a sanity check on your line-item totals -- if your itemized total lands far outside the tier range, identify which category is the outlier and recheck it.

### Step 3: Build Line-Item Cost Estimates for Each Category

Work through each category systematically. Use the per-person, per-day framing as the base unit, then multiply up.

**Accommodation:**
- Get the per-night cost for the accommodation type chosen (or researched for the destination tier)
- Hostel dorm in Southeast Asia: $8-15/night; in Western Europe: $25-45/night
- Budget hotel in Southeast Asia: $20-45/night; in Western Europe: $80-130/night
- Mid-range hotel in Southeast Asia: $50-100/night; in Western Europe: $130-220/night
- Vacation rental with kitchen: typically 15-30% cheaper per person than a hotel of equivalent quality when 2+ travelers share
- Divide the per-night room cost by the number of travelers sharing to get the per-person cost
- Note explicitly whether accommodation includes breakfast -- this shifts the food budget

**Local Transportation:**
- Research whether a transit card, day pass, or weekly pass exists for the destination city
- Most major cities: single metro/bus ride $1.50-4.00; day passes $8-15; weekly passes $25-45
- Rideshare-heavy cities (Southeast Asia): budget $4-8/person/day for short rides
- Driving destinations: estimate $40-80/day for compact car rental plus $8-15/day for fuel plus parking ($15-40/day in city centers)
- Walking-heavy destinations (Amsterdam, Prague, Barcelona old town): local transport budget can drop to $3-8/day

**Food -- the most variable category, must be broken into meals:**
- Breakfast: $3-6 (street stall, convenience store, in-room grocery) / $8-14 (cafe) / $16-25 (hotel breakfast or upscale brunch)
- Lunch: $5-10 (street food, market, fast casual) / $12-20 (casual sit-down) / $25-40 (mid-range restaurant)
- Dinner: $8-15 (local eatery, casual) / $20-40 (mid-range) / $50-100+ (upscale, tasting menu, experience dining)
- Snacks and drinks: $5-12/day depending on whether the traveler buys coffees, beers, or sodas
- Alcohol: Track separately from food if the traveler drinks -- a single cocktail in a London bar is $14-18; a beer in Prague is $2-3; this category can double the food budget if not isolated
- Grocery offset: If the accommodation has a kitchen and the user plans to cook, breakfast from grocery runs $2-4/person; packed lunch $4-7/person; reduces the daily food total by $15-25/person vs. all meals out

**Activities and Attractions:**
- Museum entry fees: $8-25 in Western cities; $2-10 in Southeast Asia; many world-class museums are free (national museums in the UK, Smithsonians in DC)
- Day tours: $30-80/person (city walking tour, guided hike); $80-200 (specialty tour -- food tour, cooking class, boat tour); $200-500+ (multi-day treks, dive packages, helicopter tours)
- Theme parks, major ticketed sites: $60-150/person (Disneyland, Universal); $25-60 (national parks); $15-35 (historical sites)
- Average activities spend for a moderate traveler: $15-25/day; for an experience-focused trip: $30-60/day
- Build in one "splurge experience" at 1.5x-2x the daily activities average

**Miscellaneous:**
- Tipping: 15-20% on restaurants in the US, Canada; 10-15% in Western Europe; not customary in Japan and much of East Asia; 5-10% at discretion in Southeast Asia
- SIM card or data: $15-40 for a 30-day local SIM or eSIM; one-time cost, goes in pre-trip section
- Laundry: $3-8/load at a self-service laundromat; $5-15 for drop-off laundry service (common in Southeast Asia) -- budget every 3-4 days if trip is longer than 5 nights
- Souvenirs: Highly personal -- ask the user; a common budget is $20-50 total for light shoppers, $100-200 for active souvenir buyers
- ATM/currency exchange fees: 1-3% of total cash withdrawn; note this explicitly as a hidden cost

**Contingency:**
- 10% for well-planned trips to familiar, stable destinations
- 12-15% for first-time destinations, developing country travel, or trips with complex logistics
- Never less than 10%; never describe contingency as "emergency fund" -- frame it as normal variance allowance

### Step 4: Build the Pre-Trip Fixed Costs Section

These costs are paid before travel begins and do not repeat daily. Treat them as a lump sum added to the daily budget total:

- **Flights (round trip):** If already booked, use actual cost. If estimating, use these benchmarks: transatlantic $600-1,200 economy; transpacific $700-1,400; intra-Europe $50-200 on budget carriers; domestic US $150-450; Southeast Asia regional $60-200
- **Travel insurance:** $35-60 per person for 1-week trips; $60-120 per person for 2-3 week trips; $150-300 for adventure or extreme sport coverage. Medical evacuation coverage is critical for remote or developing country destinations -- do not omit it
- **Visa fees:** EU Schengen e-visa $90; US visa (for non-US travelers) $185; India e-visa $25-80 depending on nationality; Japan, South Korea, most of Europe: currently free for most Western passport holders (verify current status at time of trip planning)
- **Vaccinations:** $50-200 per shot for hepatitis A/B, typhoid, yellow fever (destination-dependent); note that some require a full series before departure
- **Pre-trip gear:** If the user mentions needing to buy luggage, hiking boots, or a camera, allocate a line item
- **Airport transfers:** Taxi or rideshare from home airport ($20-80 typical city range); airport parking for drive-to-airport travelers ($12-35/day in most US airports)
- **Pet boarding or house sitting:** $25-55/day for dog boarding; highly variable

### Step 5: Calculate All Totals and Run the Budget Check

- Sum the pre-trip fixed costs into a single lump sum
- Calculate the per-person per-day total from all daily categories
- Multiply by trip duration (nights = accommodation nights; daily budget days = number of days, which is nights + 1 for arrival/departure days if they count as spending days)
- Add contingency as a percentage of the daily subtotal ONLY (not applied to already-purchased flights)
- Produce both per-person total and all-travelers total
- If the user specified a fixed maximum budget: compare the estimate to it, calculate the surplus or deficit, and recommend specific adjustments to close any gap (downgrade one accommodation night, cut one activity, reduce dinner average by $10/day, etc.)

### Step 6: Identify Destination-Specific Cost-Saving Opportunities

Every savings recommendation must be quantified. Vague advice ("eat local") is prohibited. For each saving tip:
- Name the specific action
- State the estimated saving in dollar/currency terms
- State whether the saving is per day, per person, or for the whole trip

Common high-value savings by category:
- **Accommodation:** Booking a vacation rental with a kitchen saves $10-20/person/day on breakfast and lunch vs. eating all meals out; staying one neighborhood away from tourist center cuts hotel prices 20-40%
- **Transport:** A weekly transit pass vs. daily passes saves $15-25 over 7 days in most European cities; booking airport transit by rail vs. taxi saves $20-50 in most major cities
- **Food:** Eating the main hot meal at lunch (many restaurants offer lunch prix-fixe menus at 30-40% of dinner prices for the same food); grocery store picnic lunches save $6-12/person per meal vs. restaurant lunches
- **Activities:** Free walking tours (tip-based, budget $10-15 at end) vs. paid city tour ($30-60); visiting major attractions on the free admission day or evening (many museums in Europe have one free evening per week); national and city parks are often free
- **Timing:** Shoulder season travel typically cuts hotel prices 20-35% and attraction queues dramatically; mid-week flights are 15-25% cheaper than Friday and Sunday departures on average

### Step 7: Produce the Budget Document and Spending Tracker

Assemble the final output using the Output Format below. Ensure:
- Every number in the tracker rows matches the per-day totals from the breakdown
- The contingency is visible as a separate line, not buried in miscellaneous
- Currency is labeled on every column header or as a global note at the top
- The spending tracker is pre-filled with the budgeted daily amount so the user can immediately start tracking variance

---

## Output Format

```
## Travel Budget: [Destination City, Country] -- [N] Nights

**Travelers:** [X] ([breakdown if mixed adult/child])
**Budget level:** [Backpacker | Budget | Moderate | Upscale]
**Currency:** [Currency code] (exchange rate used: [X local units] = 1 [home currency], as of [month/year])
**Trip dates:** [Start date] to [End date] (or "dates TBD")
**Destination cost tier:** [Tier 1 / 2 / 3 / 4]

---

### Pre-Trip Costs (One-Time, Before Departure)

| Item                          | Per Person   | All Travelers  | Notes                                      |
|-------------------------------|--------------|----------------|--------------------------------------------|
| Round-trip flights            | [Amount]     | [Amount]       | [Economy/booked/estimated; airline class]  |
| Travel insurance              | [Amount]     | [Amount]       | [Coverage type; per person]                |
| Visa / entry fee              | [Amount]     | [Amount]       | [Visa type; waived if applicable]          |
| Local SIM or eSIM             | [Amount]     | [Amount]       | [Data allowance, validity]                 |
| Vaccinations / health prep    | [Amount]     | [Amount]       | [List required vaccines; mark if optional] |
| Airport transfer (home city)  | [Amount]     | [Amount]       | [Taxi, rail, parking -- specify mode]      |
| [Other pre-trip item]         | [Amount]     | [Amount]       | [Notes]                                    |
| **Pre-trip subtotal**         | **[Amount]** | **[Amount]**   |                                            |

---

### Daily Budget Breakdown (Per Person Per Day)

| Category                   | Per Day      | [N] Days Total | Method / Notes                                              |
|----------------------------|--------------|----------------|-------------------------------------------------------------|
| Accommodation*             | [Amount]     | [Amount]       | [Type, room rate, split]                                    |
| Local transportation       | [Amount]     | [Amount]       | [Transit card / rideshare / rental -- specify]              |
| Breakfast                  | [Amount]     | [Amount]       | [Source: grocery / cafe / hotel included / street stall]    |
| Lunch                      | [Amount]     | [Amount]       | [Source: street food / casual sit-down / packed from grocery]|
| Dinner                     | [Amount]     | [Amount]       | [Source: local eatery / mid-range / one splurge noted]      |
| Snacks and non-meal drinks | [Amount]     | [Amount]       | [Coffee, sodas, street snacks]                              |
| Alcohol (if applicable)    | [Amount]     | [Amount]       | [Bars, bottles from shop, with dinner -- specify]           |
| Paid activities / tours    | [Amount]     | [Amount]       | [Avg across trip; list major paid events in notes below]    |
| Tips                       | [Amount]     | [Amount]       | [Tipping norm for destination: X% restaurants, $Y/service] |
| Laundry                    | [Amount]     | [Amount]       | [Frequency; self-service vs. drop-off]                      |
| Souvenirs / personal shopping | [Amount]  | [Amount]       | [User estimate or $X/day average]                          |
| Miscellaneous (data, toiletries, coins) | [Amount] | [Amount] | [Phone data beyond SIM, locker fees, ATM buffer]      |
| **Daily subtotal**         | **[Amount]** | **[Amount]**   |                                                             |

*Accommodation note: [Rate per night for the room] / [number of travelers sharing] = [Amount] per person per night

**Specific paid activities planned:**
- [Activity name]: [Amount] per person
- [Activity name]: [Amount] per person
- [Activity name -- splurge]: [Amount] per person

---

### Trip Total Summary

| Component                        | Per Person   | All Travelers  |
|----------------------------------|--------------|----------------|
| Pre-trip fixed costs             | [Amount]     | [Amount]       |
| Daily costs x [N] days           | [Amount]     | [Amount]       |
| Contingency ([10-15]% of daily)  | [Amount]     | [Amount]       |
| **TOTAL TRIP COST**              | **[Amount]** | **[Amount]**   |

[If user has a fixed budget -- include this block:]
**Fixed budget:** [Amount] per person / [Amount] total
**Estimated cost:** [Amount] per person / [Amount] total
**Status:** [ON BUDGET -- [Amount] to spare] OR [OVER BUDGET by [Amount] -- see adjustments below]

---

### Budget Adjustments to Close Gap (only if over budget)

| Adjustment                        | Saving Per Person | Saving Total |
|-----------------------------------|-------------------|--------------|
| [Specific change, e.g., drop hotel tier one night] | [Amount] | [Amount] |
| [Specific change, e.g., reduce dinner avg by $8/night] | [Amount] | [Amount] |
| [Specific change]                 | [Amount]          | [Amount]     |
| **Total adjustments**             | **[Amount]**      | **[Amount]** |

---

### Cost-Saving Opportunities

| Opportunity                        | Action Required                           | Estimated Saving          |
|------------------------------------|-------------------------------------------|---------------------------|
| [Specific saving #1]               | [Concrete action]                         | [Amount] [per day/trip]   |
| [Specific saving #2]               | [Concrete action]                         | [Amount] [per day/trip]   |
| [Specific saving #3]               | [Concrete action]                         | [Amount] [per day/trip]   |
| [Specific saving #4]               | [Concrete action]                         | [Amount] [per day/trip]   |
| [Specific saving #5]               | [Concrete action]                         | [Amount] [per day/trip]   |

---

### Daily Spending Tracker

| Day | Date   | Accommodation | Transport | Food    | Activities | Tips/Misc | Day Total | Budget | Variance |
|-----|--------|---------------|-----------|---------|------------|-----------|-----------|--------|----------|
| 1   |        |               |           |         |            |           |           | [Amt]  |          |
| 2   |        |               |           |         |            |           |           | [Amt]  |          |
| 3   |        |               |           |         |            |           |           | [Amt]  |          |
| ... |        |               |           |         |            |           |           | [Amt]  |          |
| **Total** |   |               |           |         |            |           |           | [Amt]  |          |

**Running total:** Fill "Day Total" each evening. Compare to "Budget" column. A positive variance means under budget; negative means over.
```

---

## Rules

1. **Never estimate without stating the method.** Every cost line must include a note explaining how the number was derived -- "mid-range hotel for central [city], split 2 ways" or "street food market, 2 meals per day average." A number with no source is useless to a user who wants to verify or adjust it.

2. **Always separate accommodation into room rate and per-person rate.** A shared hotel room priced at $120/night costs $60/person for 2 travelers. Show both numbers. Users consistently overstate accommodation costs when they forget they are splitting.

3. **Always include contingency as a named line item at 10-15%.** Apply it only to the daily budget subtotal -- not to flights already purchased or fixed pre-trip costs already paid. Never fold contingency into "miscellaneous." Its purpose is to remain visible and untouched unless needed.

4. **Tipping rules must be destination-specific.** Stating "tip 15-20%" for a destination where tipping is not customary (Japan, South Korea, Iceland) actively harms the user. State the actual local norm: "tipping not expected in Japan -- leave $0 in the tips line" or "round up to nearest euro in cafes, €1-2 for sit-down meals in Portugal."

5. **Alcohol is never optional to exclude if the user drinks.** If the user's food approach suggests they eat out regularly, ask whether they drink. A single wine or beer with dinner adds $4-18/day depending on destination; three cocktails in a premium bar adds $40-60/day. Omitting this category produces a budget that will be wrong by 15-25%.

6. **Never present a fixed budget as unachievable without offering a revised plan.** If the user's dream trip costs $800 more than their stated budget, the correct response is: show the gap explicitly, then offer 3-5 specific adjustments that close it without destroying the trip. Never say "this trip isn't possible on your budget" without providing an alternative path.

7. **Pre-trip costs must be itemized separately from daily spending.** Lumping flights into a daily average distorts the day-by-day tracker and makes it impossible to manage spending on the ground. The pre-trip section is paid before departure and should never appear in the daily spending tracker rows.

8. **Exchange rate must be stated explicitly and dated.** "JPY 150 per USD as of June 2025" is correct. Currency rates shift significantly -- build a 2-3% buffer into all multi-currency conversions or note explicitly that the budget will need re-checking 30 days before travel.

9. **Children and minors require separate treatment.** A 6-year-old eats 40-60% of an adult's food cost. A 12-year-old pays child admission at most attractions (30-50% discount). A 3-year-old often flies free on the lap on domestic routes. Never apply full adult per-person costs uniformly to a family with children -- ask ages if children are mentioned.

10. **Every cost-saving tip must include a specific dollar amount, not just advice.** "Eat at street stalls" is not a cost-saving tip -- it's a suggestion. "Eating lunch at street stalls instead of casual sit-down restaurants saves approximately $6-10 per person per meal, or $30-50 per person over a 5-day trip" is a cost-saving tip. Quantify or do not include.

---

## Edge Cases

### Fixed Budget Constraint (User Gives a Hard Maximum)
Work backward from the total. First, subtract any non-negotiable fixed costs (already-purchased flights, required visas, booked accommodation). Then divide the remaining discretionary budget by the number of trip days to establish the daily cap per person. Compare this daily cap against the destination tier benchmarks for Step 2. If the daily cap falls below the destination's minimum budget tier (e.g., the user has $30/day available for a Tier 1 destination), be explicit: "This destination typically requires $60-90/day at minimum budget level. Your remaining daily budget of $30 is 50% below the minimum. Options: (1) shorten the trip to 4 nights instead of 7, freeing up the total; (2) choose a Tier 3 destination on the same budget; (3) extend your savings timeline by 3 months and revisit." Never falsify numbers to make an impossible budget appear viable.

### Multi-Country or Multi-City Trip
Create a separate daily budget section for each currency zone or significantly different cost region (e.g., Paris then Budapest on the same trip). Label each section with the city/country, the currency, and the exchange rate. Add a conversion summary table at the end showing each section's total converted to the home currency. Account for the fact that travel days between cities carry transport costs (trains, buses, low-cost flights) and reduced daily spend (fewer activity hours). Explicitly calculate travel day costs as a separate line at 60-70% of the normal daily food/activities budget plus the intercity transport cost.

### Group Trip with Uneven Income or Spending Styles
Some travelers in a group want to splurge on a private villa; others want hostels. Present two parallel budgets: one for the group minimum (everyone aligns to the most cost-conscious member's preferences) and one for the group split (each person pays their own share of individually chosen tiers). Identify which costs are truly shared and must be split evenly (a rented van, a group villa, a group cooking class) and which are individual. For shared costs, calculate the per-head split. For individual costs, show a range based on the possible tiers. A shared expense settlement note -- "total shared costs: $X, divided by [N] people = $Y each" -- prevents post-trip disputes.

### Destination with Seasonal or Event-Driven Price Spikes
Major events (Carnival in Rio, Formula 1 Grand Prix in Monaco, Oktoberfest in Munich, Cherry Blossom season in Kyoto) inflate accommodation prices 2x-5x over normal rates and book out months in advance. If the user's travel dates overlap with a known major event at the destination, flag it immediately with specific multiplier estimates: "Hotel rates in Monaco during the F1 Grand Prix (late May) run 4x-6x normal rates -- a $150/night room may cost $600-900/night during race week. If your dates include May 22-25, budget $500-900/night for accommodation or consider staying in Nice (30 min by train) at $120-180/night." Always name the event and the specific dates.

### Destination with Dual Pricing (Foreigner vs. Local Rates)
Several destinations have official dual pricing systems -- international tourist prices are 2x-10x local prices at major attractions (Egypt, India, many national parks in Africa). The Taj Mahal charges approximately $15 for Indian nationals and $18-20 USD for international visitors (roughly equivalent historically but verify). Egyptian museum entries charge 10x for foreigners. Budget these at the foreign visitor rate explicitly and note that no legitimate workaround exists for formal dual-pricing sites. For informal pricing (markets, unmetered taxis), note that negotiation is expected and provide a range of $X-Y with the guidance to open at the lower end.

### Very Short Trips (1-3 Nights, Weekend Trips)
Short trips have a disproportionately high fixed-cost burden. A 2-night trip may carry $800 in flights for $200 of daily spending -- the effective "cost per day" including flights is $600, which looks alarming out of context. Present short trip budgets with the pre-trip costs called out prominently and the cost-per-day with and without flights calculated separately. Also note that: short trips rarely justify investing in a weekly transit pass (a daily pass or per-ride fare is usually cheaper); packing light eliminates checked baggage fees ($30-60 each way on budget carriers); accommodation fixed fees (cleaning fees on vacation rentals, resort fees at hotels) are amortized over fewer nights and may make short-term rentals uneconomical vs. a hotel.

### Trips Involving Adventure Activities with Variable or Seasonal Pricing
Scuba diving packages (Bali, Thailand, Philippines, Red Sea): $30-50 for a single fun dive; $300-500 for a PADI open-water certification course; liveaboard dive trips $150-350/day all-inclusive. Trekking permits (Annapurna Circuit Nepal: $30 TIMS + $30 ACAP = $60 total; Everest Base Camp: $60 TIMS + $40-50 permit). African safari: $200-800/person/day for mid-range lodge safaris, with significant variation between budget camping ($80-120/day) and luxury tented camps ($500-1,500/day). When a user's trip includes adventure activities, build a dedicated "adventure activities" line item and do not average it into the daily activities budget -- these costs are lumpy (large single payments) not daily. Calculate them as fixed costs added to the pre-trip section or as a separate lump sum inside the trip total.

### User Does Not Know Destination Yet (Destination Selection by Budget)
Do not build a full budget for an undecided destination -- redirect to `destination-comparison` first. However, if the user asks for a quick preview ("which is cheaper, Thailand or Italy?"), provide a 4-row comparison table showing daily budget per person at moderate level for 2-3 options, then invite the user to confirm a destination so this skill can produce a full line-item budget. Do not build line-item budgets for multiple speculative destinations -- it creates false precision on hypothetical trips and overwhelms the user.

---

## Example

**Input:** "Can you help me build a travel budget? Two adults, 7 nights in Lisbon, Portugal. We're thinking moderate budget -- not backpackers but not fancy. Flights are already sorted at $680 each round trip from New York. We love food and wine, definitely want to do a day trip to Sintra, and would like a Fado dinner show one night. We have about $4,500 total for the whole trip including flights."

---

## Travel Budget: Lisbon, Portugal -- 7 Nights

**Travelers:** 2 adults
**Budget level:** Moderate
**Currency:** USD (conversion rate: €1 = $1.08 USD, as of June 2025 -- recheck 30 days before departure)
**Trip dates:** TBD (dates TBD -- confirm to check for major festivals, which can spike hotel rates 30-50%)
**Destination cost tier:** Tier 2 (moderate European capital -- more affordable than Paris or London, pricier than Eastern Europe)

---

### Pre-Trip Costs (One-Time, Before Departure)

| Item                          | Per Person   | Both Travelers | Notes                                                    |
|-------------------------------|--------------|----------------|----------------------------------------------------------|
| Round-trip flights            | $680         | $1,360         | Already purchased -- JFK-LIS economy                    |
| Travel insurance              | $55          | $110           | 7-day policy with medical evacuation; recommended for EU |
| Visa / entry fee              | $0           | $0             | US passport holders: no visa required for Portugal/Schengen (up to 90 days) |
| Local SIM or eSIM             | $18          | $36            | Portugal data SIM: 10GB for 30 days, sold at airport     |
| Vaccinations / health prep    | $0           | $0             | No destination-specific vaccinations required for Portugal |
| Airport transfer (Lisbon)     | $10          | $20            | Lisbon Metro (Aerobus alternative): €4.50/person one way; taxi runs €15-20 per car |
| Airport transfer (NYC return) | $30          | $60            | Estimated airport parking or car service, NYC-area cost  |
| **Pre-trip subtotal**         | **$793**     | **$1,586**     |                                                          |

---

### Daily Budget Breakdown (Per Person Per Day)

| Category                   | Per Day  | 7 Days Total | Method / Notes                                                      |
|----------------------------|----------|--------------|---------------------------------------------------------------------|
| Accommodation*             | $65      | $455         | Mid-range boutique hotel, Alfama or Baixa-Chiado district           |
| Local transportation       | $6       | $42          | Lisbon Viva card loaded daily; tram, metro, bus; €0.50 loading fee  |
| Breakfast                  | $7       | $49          | Pastelaria or cafe: coffee + pastel de nata + toast; €4-5/person    |
| Lunch                      | $14      | $98          | Casual taberna or mercado da ribeira food hall; main + drink        |
| Dinner                     | $28      | $196         | Mid-range: €20-25/person most nights; one Fado dinner at $70/person |
| Wine and drinks             | $12      | $84          | Portugal wines are low-cost: restaurant glass €4-6; evening bar €6-10 |
| Snacks                     | $4       | $28          | Pastries, fruit from market, bottled water                          |
| Paid activities / tours    | $18      | $126         | Average across 7 days (detail below)                                |
| Tips                       | $4       | $28          | Portugal: round up to nearest euro; €1-2 for sit-down meals; no US-style tipping expected |
| Laundry                    | $2       | $14          | Drop-off laundry, once midtrip: €12-15 for 2 people; amortized daily |
| Souvenirs / personal shopping | $8    | $56          | Moderate shopper: ceramics, wine, books; total ~$55/person           |
| Miscellaneous               | $4       | $28          | Coin lockers, ATM buffer (Portugal has low ATM fees), small sundries |
| **Daily subtotal**         | **$172** | **$1,204**   |                                                                     |

*Accommodation: Mid-range hotel in Alfama or Baixa-Chiado runs €105-130/night (~$113-140 USD). Estimated $130/night total, split 2 ways = $65/person/night. Breakfast not included at this tier -- budgeted separately above.

**Specific paid activities planned:**

| Activity                              | Per Person | Notes                                                  |
|---------------------------------------|------------|--------------------------------------------------------|
| Fado dinner show (1 evening)          | $70        | Includes dinner and 90-min show; Casa de Fado style; book in advance |
| Sintra day trip -- Pena Palace entry  | $20        | Palace entry; Moorish Castle is separate €10 or skip    |
| Sintra train round trip               | $6         | Sintra train from Rossio station: €4.90 round trip      |
| Belem Tower + Jeronimos Monastery     | $14        | Combined entry; walkable in one half-day from central Lisbon |
| LX Factory Sunday market (free)       | $0         | Free entry; budget for food/drinks on-site instead      |
| Free walking tour (tip-based)         | $12        | Budget €10-12 tip per person for quality guided tour    |
| MAAT Museum (contemporary art)        | $11        | €10 entry; riverside, half-day activity                 |
| Remaining free days / wandering       | $0         | Alfama neighborhood, Miradouros viewpoints: free        |
| **Activities total / 7 days**        | **$133**   | Amortized: $19/day; lines up with $18/day budget        |

---

### Trip Total Summary

| Component                          | Per Person   | Both Travelers |
|------------------------------------|--------------|----------------|
| Pre-trip fixed costs               | $793         | $1,586         |
| Daily costs x 7 days               | $1,204       | $2,408         |
| Contingency (12% of daily only)    | $144         | $289           |
| **TOTAL TRIP COST**                | **$2,141**   | **$4,283**     |

**Fixed budget:** $2,250 per person / $4,500 total
**Estimated cost:** $2,141 per person / $4,283 total
**Status:** ON BUDGET -- approximately $109 per person / $217 total to spare. This is a comfortable margin; no adjustments required. The contingency buffer of $289 covers typical unexpected costs.

---

### Cost-Saving Opportunities

| Opportunity                                       | Action Required                                                         | Estimated Saving              |
|---------------------------------------------------|-------------------------------------------------------------------------|-------------------------------|
| Lunch at the Mercado da Ribeira or taberna do dia | Order the prato do dia (dish of the day): €8-10 with drink vs. €15-20 à la carte | $5-10/person/day = $35-70/person over 7 days |
| Buy wine from a wine shop for 2-3 evenings        | Portuguese table wine from a shop: €4-7 per bottle vs. €18-28 in a restaurant | ~$12-15 saved per bottle; 3 evenings = $35-45 for both travelers |
| Sintra: walk between monuments vs. paying the tourist shuttle | Shuttle is €5 each way; walking between Pena and Moorish Castle is 20 min | $10/person saved on day trip |
| Lisbon Viva card vs. individual tickets           | Preload the Viva card (€0.50 card fee); rides cost €1.65 vs. €2.00 single ticket | $0.35/ride savings; at 4 rides/day x 7 days = $10/person |
| Eat pastel de nata at the bakery, not tourist cafes | Same pastry: €1.20 at a neighborhood pastelaria vs. €3-4 at tourist-facing cafes near Rossio | $2-3/person/day if buying 2 pastries = $14-21/person over 7 days |

---

### Daily Spending Tracker

| Day | Date | Accommodation | Transport | Food + Wine | Activities | Tips/Misc | Day Total | Budget | Variance |
|-----|------|---------------|-----------|-------------|------------|-----------|-----------|--------|----------|
| 1   |      |               |           |             |            |           |           | $172   |          |
| 2   |      |               |           |             |            |           |           | $172   |          |
| 3   |      |               |           |             |            |           |           | $172   |          |
| 4   |      |               |           |             |            |           |           | $172   |          |
| 5   |      |               |           |             |            |           |           | $172   |          |
| 6   |      |               |           |             |            |           |           | $172   |          |
| 7   |      |               |           |             |            |           |           | $172   |          |
| **Total** |  |               |           |             |            |           |           | **$1,204** |      |

**Notes for using the tracker:**
- Day 3 or 4 will be the Fado dinner night -- expect food + activities to run $40-50 higher than normal that day; it is already averaged into the 7-day budget total
- The Sintra day trip (Day 5 or 6 recommended) will have near-zero accommodation and local transport cost but higher activities and transport costs -- this self-balances
- Record all spending in USD at time of transaction for consistency; use the $1.08/€ rate as the conversion or log in euros and convert at end of trip
