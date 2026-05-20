---
name: trip-planner
description: |
  Complete trip itinerary creation guide covering destination research, day-by-day planning, transportation logistics, accommodation selection, booking timing optimization, budget allocation, must-see vs hidden gems balance, and itinerary templates for weekend, week, and two-week trips.
  Use when the user asks about trip planner, or needs help with complete trip itinerary creation guide covering destination research, day-by-day planning, transportation logistics, accommodation selection, booking timing optimization, budget allocation, must-see vs hidden gems balance, and itinerary templates for weekend, week, and two-week trips.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of trip planner.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel itinerary planning"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Trip Planner
## When to Use

**Use this skill when:**
- User asks about trip planner
- User needs guidance on trip planner topics
- User wants a structured approach to trip planner

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

1. **Where are you going?** (specific destination, or looking for suggestions)
2. **When are you traveling?** (dates or flexible timeframe)
3. **How long is the trip?** (weekend, week, two weeks, longer)
4. **What is your budget?** (total per person, or spending level: budget/mid-range/luxury)
5. **Who is traveling?** (solo, couple, family with kids, group of friends, multi-generational)
6. **What are your interests?** (culture/history, food, nature/outdoors, adventure sports, relaxation, nightlife, shopping, photography)
7. **What is your travel style?** (packed itinerary, relaxed pace, mix of both)
8. **Have you been to this destination before?**
9. **Any physical limitations or accessibility needs?**
10. **What are your must-dos?** (specific attractions, restaurants, experiences)
---
## Step 1: Destination Research Framework

### The Research Sprint (1-2 Hours)
```
DESTINATION RESEARCH CHECKLIST:

BASICS:
[ ] Best time to visit (weather, crowds, events)
[ ] Visa requirements for your nationality
[ ] Currency and current exchange rate
[ ] Language(s) spoken and English proficiency
[ ] Time zone difference from home
[ ] Safety situation and travel advisories
[ ] COVID or health entry requirements (if any)

GETTING THERE:
[ ] Flight options (direct vs connecting)
[ ] Average flight cost from your origin
[ ] Airport(s) and distance to city center
[ ] Airport transfer options (train, bus, taxi, ride-share)

GETTING AROUND:
[ ] Public transportation quality and coverage
[ ] Ride-share availability (Uber, Lyft, local alternatives)
[ ] Car rental necessity and driving conditions
[ ] Walkability of main areas
[ ] Intercity transportation (trains, buses, domestic flights)

NEIGHBORHOODS:
[ ] Best areas to stay (by interest: nightlife, culture, family-friendly)
[ ] Areas to avoid
[ ] Proximity of key attractions to each other
[ ] Local transportation between neighborhoods

COSTS:
[ ] Average hotel/Airbnb cost per night
[ ] Average meal cost (budget, mid-range, fine dining)
[ ] Attraction entry fees
[ ] Transportation costs
[ ] Tipping customs
```

### Seasonal Planning
```
SEASONAL ASSESSMENT:

Destination: {{DESTINATION}}
Travel dates: {{DATES}}

WEATHER:
- Average high/low temperature: {{TEMP}}
- Rainfall: {{AMOUNT}}
- Daylight hours: {{HOURS}}
- Special weather considerations: {{NOTES}}

CROWD LEVELS:
- Peak season: {{MONTHS}} -- Expect: highest prices, biggest crowds
- Shoulder season: {{MONTHS}} -- Expect: moderate prices, fewer crowds
- Low season: {{MONTHS}} -- Expect: lowest prices, some closures

YOUR TRAVEL PERIOD IS: PEAK / SHOULDER / LOW

IMPACT ON PLANNING:
- Book accommodations {{X}} weeks/months in advance
- Book popular restaurants {{X}} weeks in advance
- Buy attraction tickets: {{IN_ADVANCE / AT_DOOR}}
- Expected daily budget adjustment: +/- {{%}}
```
---
## Step 2: Budget Allocation

### Trip Budget Worksheet
```
TRIP BUDGET PLANNER:

TRIP: {{DESTINATION}} | {{DATES}} | {{NUMBER_OF_TRAVELERS}}

CATEGORY          | BUDGET/PERSON | TOTAL    | NOTES
------------------|---------------|----------|------
Flights           | ${{}}         | ${{}}    | {{}}
Accommodation     | ${{/night}}   | ${{}}    | {{NIGHTS}} nights
Local Transport   | ${{/day}}     | ${{}}    | {{TYPE}}
Food & Drink      | ${{/day}}     | ${{}}    | {{MEAL_PLAN}}
Activities        | ${{}}         | ${{}}    | {{KEY_ACTIVITIES}}
Shopping/Souvenirs| ${{}}         | ${{}}    | {{}}
Travel Insurance  | ${{}}         | ${{}}    | {{}}
Miscellaneous     | ${{}}         | ${{}}    | 10-15% buffer
------------------|---------------|----------|------
TOTAL             | ${{}}         | ${{}}    |

BUDGET ALLOCATION GUIDELINES:

BUDGET TRAVELER ($50-100/day):
- Accommodation: 30% (hostels, guesthouses, Airbnb)
- Food: 25% (street food, markets, cooking)
- Transport: 15% (public transit, walking)
- Activities: 20% (free attractions, hiking, museums)
- Buffer: 10%

MID-RANGE TRAVELER ($100-250/day):
- Accommodation: 35% (mid-range hotels, nice Airbnbs)
- Food: 25% (mix of local restaurants and nice dining)
- Transport: 15% (taxi/ride-share, occasional rental)
- Activities: 15% (paid tours, tickets)
- Buffer: 10%

LUXURY TRAVELER ($250+/day):
- Accommodation: 40% (luxury hotels, premium stays)
- Food: 20% (fine dining, food experiences)
- Transport: 10% (private transfers, business class)
- Activities: 20% (premium experiences, private tours)
- Buffer: 10%
```
---
## Step 3: Booking Timing Optimization

### When to Book What
```
BOOKING TIMELINE:

6+ MONTHS BEFORE:
[ ] Flights (international) -- best prices 2-6 months out
[ ] Accommodation for peak season travel
[ ] Marquee events (festivals, concerts, sporting events)
[ ] Specialty tours with limited availability

3-6 MONTHS BEFORE:
[ ] Flights (domestic)
[ ] Popular accommodation
[ ] Restaurant reservations (fine dining, Michelin-starred)
[ ] Multi-day tours or cruises
[ ] Car rental for peak season

1-3 MONTHS BEFORE:
[ ] Attraction tickets with time slots (museums, landmarks)
[ ] Day tours and guided experiences
[ ] Airport transfers or private drivers
[ ] Travel insurance
[ ] Local SIM card or eSIM purchase

2-4 WEEKS BEFORE:
[ ] Reconfirm all bookings
[ ] Download offline maps
[ ] Notify bank of travel dates
[ ] Check visa status and passport validity
[ ] Review cancellation policies

1 WEEK BEFORE:
[ ] Check weather forecast and adjust packing
[ ] Confirm all reservations
[ ] Print or download all confirmation emails
[ ] Share itinerary with emergency contact
[ ] Charge all electronics and battery packs
```
---
## Step 4: Accommodation Selection

### Accommodation Comparison
```
ACCOMMODATION DECISION MATRIX:

OPTION       | BEST FOR          | BUDGET      | PROS                | CONS
-------------|-------------------|-------------|---------------------|-------
Hotel        | Convenience,      | $$-$$$$     | Services, cleaning, | Less local
             | short stays       |             | location, reliability| experience
Airbnb/VRBO  | Longer stays,     | $-$$$       | Kitchen, space,     | No daily
             | families, groups  |             | local neighborhood  | cleaning, variable
Hostel       | Solo/budget       | $           | Social, cheap,      | Shared spaces,
             | travelers         |             | central locations   | noise
Boutique     | Special occasions,| $$$-$$$$    | Unique, personal    | More expensive,
Hotel        | culture seekers   |             | service, design     | fewer amenities
Resort       | Relaxation,       | $$$-$$$$    | All-inclusive option| Isolated from
             | beach/nature      |             | pools, activities   | local culture
Guesthouse   | Local experience, | $-$$        | Authentic, hosts    | Basic amenities,
             | cultural immersion|             | know the area       | may be remote

SELECTION CRITERIA:
[ ] Location (proximity to planned activities)
[ ] Price per night (within budget)
[ ] Reviews (4.0+ on major platforms)
[ ] Cancellation policy (flexible preferred)
[ ] Amenities needed (WiFi, kitchen, laundry, parking, pool)
[ ] Safety and security features
[ ] Accessibility (if needed)
[ ] Check-in/check-out flexibility
```
---
## Step 5: Day-by-Day Planning

### Daily Itinerary Framework
```
DAILY PLANNING PRINCIPLES:

1. THE 3-2-1 RULE:
   - 3 planned activities per full day (no more)
   - 2 meals planned (leave 1 flexible)
   - 1 flex block for spontaneity or rest

2. GEOGRAPHIC CLUSTERING:
   - Group activities by neighborhood/area
   - Minimize back-and-forth travel
   - Morning: one area, Afternoon: adjacent area

3. ENERGY MANAGEMENT:
   - High-energy activities in the morning
   - Indoor/rest activities during midday heat (warm climates)
   - Social/dining activities in the evening
   - Build in rest days for trips longer than 5 days

4. FIRST AND LAST DAY RULES:
   - Arrival day: Light plans only (check in, explore nearby, dinner)
   - Departure day: Pack night before, morning activity only if time allows
```

### Daily Itinerary Template
```
DAY {{NUMBER}}: {{THEME/NEIGHBORHOOD}}
Date: {{DATE}} ({{DAY_OF_WEEK}})

MORNING:
  {{TIME}}: {{ACTIVITY_1}}
  Duration: {{TIME}}
  Cost: ${{AMOUNT}}
  Booking needed: YES/NO -- Status: {{BOOKED/TODO}}
  Notes: {{TIPS, ADDRESS, TRANSIT_INSTRUCTIONS}}

  {{TIME}}: {{ACTIVITY_2}}
  Duration: {{TIME}}
  Cost: ${{AMOUNT}}

LUNCH:
  {{TIME}}: {{RESTAURANT_OR_AREA}}
  Cuisine: {{TYPE}}
  Budget: ${{AMOUNT}}
  Reservation: NEEDED / WALK-IN
  Alternative: {{BACKUP_OPTION}}

AFTERNOON:
  {{TIME}}: {{ACTIVITY_3}}
  Duration: {{TIME}}
  Cost: ${{AMOUNT}}

  {{TIME}}: FLEX TIME
  Options: {{OPTION_A}} / {{OPTION_B}} / Rest at hotel

DINNER:
  {{TIME}}: {{RESTAURANT}}
  Reservation: {{STATUS}}
  Budget: ${{AMOUNT}}

EVENING (optional):
  {{ACTIVITY: nightlife, show, sunset spot, night market}}

TRANSPORT FOR THE DAY:
  Morning: {{METHOD}}
  Between activities: {{METHOD}}
  Evening: {{METHOD}}

DAY BUDGET: ${{TOTAL}}
```
---
## Step 6: Must-See vs. Hidden Gems

### Balancing Tourist Highlights and Local Experiences
```
ATTRACTION CATEGORIZATION:

MUST-SEE (Tourist Highlights):
Best time to visit: Early morning or late afternoon (fewer crowds)
Book in advance: YES -- tickets with time slots
Time allocation: 60-90 minutes each

1. {{ATTRACTION_1}} -- Priority: HIGH
2. {{ATTRACTION_2}} -- Priority: HIGH
3. {{ATTRACTION_3}} -- Priority: MEDIUM

HIDDEN GEMS (Local Favorites):
How to find them: Ask locals, check Atlas Obscura, local blogs
Typically: No booking needed, flexible timing

1. {{GEM_1}} -- Source: {{HOW_YOU_FOUND_IT}}
2. {{GEM_2}} -- Source: {{HOW_YOU_FOUND_IT}}
3. {{GEM_3}} -- Source: {{HOW_YOU_FOUND_IT}}

NEIGHBORHOOD EXPLORATION:
Wander time: Build in 2-3 hour blocks for unplanned exploration

1. {{NEIGHBORHOOD_1}} -- Known for: {{VIBE}}
2. {{NEIGHBORHOOD_2}} -- Known for: {{VIBE}}

FOOD EXPERIENCES:
- Famous restaurant: {{NAME}} (book ahead)
- Local market: {{NAME}} (go hungry, try everything)
- Street food area: {{LOCATION}}
- Cooking class: {{OPTION}} (half-day activity)

BALANCE RULE:
For every 2 "must-see" tourist attractions, plan 1 hidden gem
or local experience. This keeps the trip from feeling like a
checklist.
```
---
## Step 7: Itinerary Templates

### Weekend Getaway (2-3 Days)
```
WEEKEND ITINERARY TEMPLATE:

Trip: {{DESTINATION}} | {{DATES}} | {{TRAVELERS}}

DAY 1 (FRIDAY / ARRIVAL):
- Arrive and check in
- Explore hotel neighborhood on foot
- Welcome dinner at {{RESTAURANT}}
- After dinner: {{LIGHT_EVENING_ACTIVITY}}

DAY 2 (SATURDAY / MAIN DAY):
- Morning: {{TOP_ATTRACTION_1}} (go early to beat crowds)
- Mid-morning: {{ACTIVITY_2}}
- Lunch: {{RESTAURANT/AREA}}
- Afternoon: {{ACTIVITY_3 or NEIGHBORHOOD_EXPLORATION}}
- Late afternoon: Rest / refresh
- Evening: {{SPECIAL_DINNER}} + {{EVENING_ACTIVITY}}

DAY 3 (SUNDAY / DEPARTURE):
- Morning: {{MARKET/BRUNCH/FINAL_ACTIVITY}}
- Late morning: Pack and check out
- Optional: {{ONE_FINAL_STOP}} if time allows
- Head to airport/station

PACKING: Carry-on only for weekend trips
```

### One Week (7 Days)
```
ONE-WEEK ITINERARY TEMPLATE:

DAY 1: ARRIVAL + ORIENTATION
- Arrive, check in, exchange money, get transit pass
- Walk around the neighborhood
- Grocery shopping (if apartment/Airbnb)
- Early dinner (recover from travel)

DAY 2: TOP HIGHLIGHTS
- Morning: #1 must-see attraction (arrive when it opens)
- Lunch: Near the attraction area
- Afternoon: #2 must-see attraction
- Evening: Dinner at a recommended restaurant

DAY 3: CULTURE AND HISTORY
- Morning: Museum or cultural site
- Lunch: Local market or food hall
- Afternoon: Walking tour (guided or self-guided)
- Evening: Neighborhood exploration and dinner

DAY 4: ADVENTURE / DAY TRIP
- Full-day trip to {{NEARBY_DESTINATION}}
- OR: Outdoor activity (hiking, beach, nature park)
- Return for dinner in town

DAY 5: REST + LOCAL LIFE
- Sleep in (you need this by Day 5)
- Late brunch at a local cafe
- Afternoon: Shopping, cafe-hopping, or a cooking class
- Evening: Special dinner experience

DAY 6: HIDDEN GEMS
- Morning: Off-the-beaten-path neighborhood
- Lunch: Street food or local favorite
- Afternoon: Activity based on personal interest
- Evening: Sunset spot + farewell dinner

DAY 7: DEPARTURE
- Morning: Last walk, pick up souvenirs
- Check out and head to airport
```

### Two Weeks (14 Days)
```
TWO-WEEK ITINERARY FRAMEWORK:

SEGMENT 1 (Days 1-4): PRIMARY CITY/BASE
- Day 1: Arrival and orientation
- Day 2-3: Major attractions and cultural sites
- Day 4: Neighborhood exploration and local life

SEGMENT 2 (Days 5-7): SECONDARY DESTINATION
- Day 5: Travel to second destination
- Day 6: Explore second destination highlights
- Day 7: Day trip or deeper exploration

REST DAY (Day 8): MID-TRIP RECOVERY
- No major plans
- Laundry, rest, journal, plan remaining days
- Light local exploration

SEGMENT 3 (Days 9-11): THIRD DESTINATION OR NATURE
- Day 9: Travel to third area
- Day 10-11: Nature, adventure, or cultural immersion

SEGMENT 4 (Days 12-14): RETURN AND WRAP-UP
- Day 12: Return to primary city or final destination
- Day 13: Anything missed, shopping, revisit favorites
- Day 14: Departure

KEY PRINCIPLES FOR LONG TRIPS:
- Move accommodations no more than 3-4 times
- Plan rest days every 4-5 days
- Leave 20% of time unplanned
- Do laundry on rest days
- Reconfirm bookings for the second week
```
---
## Step 8: Transportation Logistics

### Getting Around Decision Matrix
```
TRANSPORTATION PLANNING:

BETWEEN CITIES:
Option           | Best For         | Book When      | Tips
-----------------|------------------|----------------|------
Flight           | 3+ hour drive    | 1-3 months out | Budget airlines have hidden fees
Train            | 1-4 hour routes  | 1-4 weeks out  | Often city center to city center
Bus              | Budget, short    | 1 week out     | Check comfort level
Rental car       | Rural, flexible  | 1 month out    | Check insurance, tolls, parking
Private transfer | Groups, comfort  | 1 week out     | Split cost among group

WITHIN CITIES:
[ ] Walking (always best for short distances and exploration)
[ ] Public transit (metro, bus, tram)
[ ] Ride-share (Uber, Lyft, local apps)
[ ] Bicycle/scooter rental
[ ] Taxi (agree on price or use meter)
[ ] Hop-on hop-off bus (for orientation on Day 1)
```
---
## Trip Planning Master Checklist
```
COMPLETE TRIP CHECKLIST:

PRE-TRIP:
[ ] Passport valid (6+ months beyond travel dates)
[ ] Visa obtained (if required)
[ ] Travel insurance purchased
[ ] Flights booked
[ ] Accommodation booked
[ ] Major attraction tickets purchased
[ ] Restaurant reservations made
[ ] Bank notified of travel dates
[ ] International phone plan or eSIM
[ ] Copies of documents (digital + physical)
[ ] Itinerary shared with emergency contact
[ ] Home preparations (mail hold, pet care, plants)

PACKED:
[ ] See Packing Assistant skill for detailed list
[ ] All chargers and adapters
[ ] Medications
[ ] Printed/downloaded confirmations

ON TRIP:
[ ] Reconfirm bookings day before
[ ] Check weather for next day
[ ] Keep valuables secure
[ ] Take photos of tickets and important items
[ ] Enjoy and be present
```
---
*This skill provides trip planning guidance. Actual conditions, prices, and availability change frequently. Always verify current information before booking and travel.*


## Output Format

```
TRIP PLANNER OUTPUT
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

**Input:** "Help me get started with trip planner"

**Output:** A structured trip planner plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
