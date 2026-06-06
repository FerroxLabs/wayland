---
name: road-trip-planner
description: |
  Plans road trip routes with driving legs, rest stops, overnight locations,
  fuel estimates, and points of interest along the way. Gathers origin,
  destination, trip duration, vehicle type, and interests to produce a
  leg-by-leg driving itinerary with daily mileage and time breakdowns.
  Use when the user asks to plan a road trip, create a driving route, find
  stops along a highway route, or organize a multi-day driving vacation.
  Do NOT use for city-based trip itineraries (use trip-itinerary-builder),
  flight-based travel, or cycling route planning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel itinerary planning checklist"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Road Trip Planner

## When to Use

**Use this skill when:**
- User asks to plan a road trip or multi-day driving route
- User wants to find stops, attractions, or overnight stays along a driving route
- User needs a driving itinerary with mileage and time estimates per leg
- User asks how to break a long drive into manageable daily segments
- User wants to plan a scenic drive or highway route with points of interest

**Do NOT use when:**
- User wants a city-based sightseeing itinerary without driving (use `trip-itinerary-builder`)
- User is planning air travel or train travel between cities
- User wants a cycling or biking route (use hobbies-crafts cycling skills)
- User needs a travel budget breakdown (use `budget-travel-planner`)
- User wants a packing list for the trip (use `packing-list-builder`)
- User is planning a commercial trucking or logistics route

## Process

1. **Gather road trip parameters.** Ask the user for:
   - Starting point (city or address)
   - Final destination (city or address, or "loop back to start")
   - Total available days for the trip
   - Maximum comfortable daily driving time (default: 5-6 hours if not specified)
   - Vehicle type (car, SUV, RV, motorcycle) and approximate fuel efficiency
   - Number of travelers and any child or pet considerations
   - Interest priorities (scenery, national parks, small towns, food, history, beaches, outdoor activities)
   - Must-see stops or waypoints (any non-negotiable locations)
   - Accommodation preference (hotels, motels, campgrounds, vacation rentals)
   - Budget level (budget, moderate, premium)

2. **Calculate the route baseline.** Determine:
   - Total driving distance from origin to destination (direct route)
   - Total estimated driving time without stops
   - Available driving days (total days minus arrival day buffer and departure day buffer)
   - Target daily driving distance (total distance divided by available driving days)
   - Identify the primary highway or route corridor

3. **Segment into daily legs.** For each day:
   - Set a starting point and an overnight destination
   - Target driving time within the user's comfort maximum
   - Place the overnight stop in a town or city with accommodation options and dining
   - Avoid ending a driving day in a remote area with limited services
   - Balance leg distances so no single day is significantly longer than others

4. **Insert stops and points of interest.** For each leg:
   - Identify 2-4 points of interest along or near the route (within 15 min detour)
   - Add a rest stop every 2-2.5 hours of driving
   - Insert a lunch stop approximately midway through the driving day
   - Note fuel stops based on vehicle range and station availability
   - Mark scenic overlooks, photo opportunities, or short hikes (under 1 hour)

5. **Build the daily schedule.** For each day:
   - Morning departure time
   - Each driving segment with distance, estimated time, and route designation
   - Each stop with duration and type (rest, fuel, attraction, meal, photo)
   - Arrival time at overnight location
   - Evening activity suggestion at overnight location

6. **Add logistics and preparation notes.** Include:
   - Total trip mileage and estimated fuel cost
   - Recommended vehicle preparation (tire check, oil, spare tire, emergency kit)
   - Season-specific driving considerations (winter chains, summer heat, storm season)
   - Emergency contact information approach (roadside assistance, nearest hospitals along route)
   - Any road toll estimates or pass requirements

7. **Review the completed plan.** Verify:
   - No driving day exceeds the user's stated maximum hours
   - Overnight stops have accommodation and dining within the budget level
   - Must-see waypoints are included and have adequate visit time
   - Rest stops are spaced every 2-2.5 hours
   - Total trip fits within the available days

## Output Format

```
## Road Trip Plan: [Origin] to [Destination]

**Route:** [Origin] -> [Key waypoints] -> [Destination]
**Total distance:** [X] miles / [X] km
**Total driving time:** [X] hours (excluding stops)
**Trip duration:** [N] days
**Estimated fuel cost:** $[X] ([fuel efficiency] at $[X]/gallon)

---

### Day 1: [Origin] to [Overnight City] -- [X] miles, [X] hours driving

| Segment | Route         | Distance   | Drive time | Stop                  | Stop duration |
|---------|---------------|------------|------------|-----------------------|---------------|
| 1       | [Origin] to [Stop A] | [X] mi | [X:XX]    | [Attraction or rest]  | [X] min       |
| 2       | [Stop A] to [Stop B] | [X] mi | [X:XX]    | [Fuel + lunch area]   | [X] min       |
| 3       | [Stop B] to [Overnight] | [X] mi | [X:XX] | Arrive at overnight   | --            |

**Departure:** [HH:MM]
**Arrival:** [HH:MM]
**Day total:** [X] miles | [X:XX] driving | [X:XX] at stops
**Overnight:** [City] -- [accommodation type and area recommendation]
**Evening:** [Dinner or activity suggestion]

---

### Day 2: [Overnight City] to [Next Overnight] -- [X] miles, [X] hours driving

[Same table structure]

---

### Pre-Trip Vehicle Checklist

- [ ] Tire pressure and tread depth check
- [ ] Oil level and windshield fluid
- [ ] Spare tire and jack verified
- [ ] Emergency kit (flashlight, first aid, jumper cables, blanket)
- [ ] Phone charger and mount
- [ ] Downloaded offline maps for route corridor

### Trip Totals

| Metric              | Value              |
|---------------------|--------------------|
| Total miles         | [X]                |
| Total driving hours | [X]                |
| Total stop hours    | [X]                |
| Fuel stops          | [X]                |
| Estimated fuel cost | $[X]               |
| Overnight stops     | [X]                |
```

## Rules

1. NEVER include external URLs, specific hotel chain names, or gas station brand names -- use generic location descriptions
2. ALWAYS include at least one rest stop every 2-2.5 hours of driving
3. ALWAYS include a lunch stop on every driving day
4. No single driving day may exceed the user's stated maximum driving time (default 6 hours if unstated)
5. Overnight stops must be in locations with at least accommodation and dining options
6. Include estimated driving time and distance for every segment
7. Points of interest must be within a 15-minute detour of the main route unless the user has specifically requested them
8. Include a vehicle preparation checklist with season-specific items
9. NEVER output vague suggestions like "consider stopping somewhere interesting" -- every stop must be a specific type with a location description and duration
10. Fuel stop spacing must account for vehicle range -- never plan a segment longer than 75% of estimated fuel range without a fuel stop

## Edge Cases

- **Loop trip (return to starting point):** Design a circular route. Avoid retracing the same highway on the return. Use a different route for each direction (e.g., coastal route out, inland route back). Balance the loop so driving days are roughly equal.

- **Road trip with young children (under 5):** Reduce maximum daily driving to 4 hours. Add one extra stop per leg for stretch breaks. Prioritize overnight stops with family-friendly amenities (pool, parks). Schedule driving during nap times when possible.

- **RV or oversized vehicle:** Note road restrictions (low bridges, narrow roads, weight limits). Ensure overnight stops have RV-compatible parking or campgrounds. Add 15-20% to driving time estimates for reduced speed. Flag fuel stops with diesel or RV-friendly access.

- **Winter driving conditions:** Add a winter gear section (chains, ice scraper, warm blankets, sand or cat litter for traction). Increase driving time estimates by 20-30%. Recommend checking road condition reports before each driving day. Flag mountain passes with closure risk.

- **Very long distance (over 2,000 miles):** Suggest splitting into segments of 300-400 miles per day. Include one rest day (no driving) every 3-4 driving days. Identify "marathon day" options for stretches with limited services, with advance planning for fuel and food.

- **Electric vehicle:** Replace fuel stops with charging stops. Note estimated charging time (30-60 min at fast chargers). Reduce maximum segment length to 60-70% of battery range for safety margin. Identify charging stations by type (Level 2, DC fast charge) without naming specific networks.

## Example

**Input:** "Plan a 5-day road trip from Denver, Colorado to Moab, Utah. We have a sedan, love national parks and hiking, moderate budget. Max 5 hours of driving per day."

**Output:**

## Road Trip Plan: Denver, CO to Moab, UT

**Route:** Denver -> Glenwood Springs -> Grand Junction -> Moab (with return)
**Total distance:** ~700 miles (round trip)
**Total driving time:** ~12 hours (excluding stops)
**Trip duration:** 5 days
**Estimated fuel cost:** $85 (30 mpg sedan at ~$3.50/gallon)

---

### Day 1: Denver to Glenwood Springs -- 160 miles, 3 hours driving

| Segment | Route                              | Distance | Drive time | Stop                               | Stop duration |
|---------|------------------------------------|----------|------------|-------------------------------------|---------------|
| 1       | Denver to Georgetown area          | 50 mi    | 1:00       | Rest stop -- mountain overlook      | 15 min        |
| 2       | Georgetown to Vail area            | 55 mi    | 1:00       | Vail village walk and lunch         | 60 min        |
| 3       | Vail to Glenwood Springs           | 55 mi    | 1:00       | Arrive at overnight                 | --            |

**Departure:** 08:00
**Arrival:** 12:15
**Day total:** 160 miles | 3:00 driving | 1:15 at stops
**Overnight:** Glenwood Springs -- downtown area accommodation, walkable to hot springs
**Evening:** Glenwood Hot Springs Pool visit (public pool, open until 21:00)

---

### Day 2: Glenwood Springs to Moab -- 230 miles, 4.5 hours driving

| Segment | Route                              | Distance | Drive time | Stop                               | Stop duration |
|---------|------------------------------------|----------|------------|-------------------------------------|---------------|
| 1       | Glenwood Springs to Grand Junction | 90 mi    | 1:30       | Colorado National Monument overlook | 30 min        |
| 2       | Grand Junction to Cisco area       | 50 mi    | 0:45       | Rest stop and fuel                  | 15 min        |
| 3       | Cisco to Moab                      | 90 mi    | 1:15       | Scenic drive along Colorado River   | 20 min photo  |
| --      | Arrive Moab                        | --       | --         | Check in                            | --            |

**Departure:** 08:30
**Arrival:** 15:00
**Day total:** 230 miles | 4:30 driving | 1:05 at stops
**Overnight:** Moab -- Main Street area, walking distance to restaurants
**Evening:** Moab town exploration, dinner at local restaurant area

---

### Day 3: Moab -- No Driving Day (Arches Area Exploration)

| Time  | Activity                                        | Duration |
|-------|-------------------------------------------------|----------|
| 07:00 | Early start to Arches area scenic drive          | 3 hours  |
| 10:00 | Short hikes: Delicate Arch viewpoint area        | 2 hours  |
| 12:00 | Lunch back in Moab                               | 60 min   |
| 13:30 | Dead Horse Point area overlook drive              | 2 hours  |
| 15:30 | Return to Moab, rest                              | --       |
| 18:00 | Sunset viewpoint drive                            | 60 min   |

**Day total:** 0 road trip miles | Full activity day
**Overnight:** Moab (same accommodation)

---

### Day 4: Moab to Glenwood Springs -- 230 miles, 4.5 hours driving

| Segment | Route                              | Distance | Drive time | Stop                               | Stop duration |
|---------|------------------------------------|----------|------------|-------------------------------------|---------------|
| 1       | Moab to Fruita area                | 110 mi   | 1:45       | Rest stop and fuel                  | 15 min        |
| 2       | Fruita to Glenwood Canyon area     | 80 mi    | 1:15       | Glenwood Canyon rest area and lunch | 60 min        |
| 3       | Glenwood Canyon to Glenwood Springs| 40 mi    | 0:30       | Arrive at overnight                 | --            |

**Departure:** 09:00
**Arrival:** 15:30
**Day total:** 230 miles | 4:30 driving | 1:15 at stops
**Overnight:** Glenwood Springs -- same area as Day 1
**Evening:** Explore Glenwood Springs downtown, dinner

---

### Day 5: Glenwood Springs to Denver -- 160 miles, 3 hours driving

| Segment | Route                              | Distance | Drive time | Stop                               | Stop duration |
|---------|------------------------------------|----------|------------|-------------------------------------|---------------|
| 1       | Glenwood Springs to Copper Mountain| 80 mi    | 1:15       | Rest and mountain views             | 15 min        |
| 2       | Copper Mountain to Idaho Springs   | 45 mi    | 0:45       | Lunch at Idaho Springs mining town  | 45 min        |
| 3       | Idaho Springs to Denver            | 35 mi    | 0:40       | Arrive home                         | --            |

**Departure:** 09:00
**Arrival:** 13:00
**Day total:** 160 miles | 3:00 driving | 1:00 at stops

---

### Pre-Trip Vehicle Checklist

- [ ] Tire pressure and tread depth (mountain passes)
- [ ] Oil level and coolant (altitude driving)
- [ ] Spare tire and jack verified
- [ ] Emergency kit (flashlight, first aid, jumper cables, warm blanket)
- [ ] Phone charger and dashboard mount
- [ ] Downloaded offline maps for I-70 corridor and Moab area
- [ ] Sunglasses and sun visor (western sun driving)

### Trip Totals

| Metric              | Value              |
|---------------------|--------------------|
| Total miles         | ~700               |
| Total driving hours | ~12                |
| Total stop hours    | ~5                 |
| Fuel stops          | 3                  |
| Estimated fuel cost | $85                |
| Overnight stops     | 4 nights           |

---

<!-- Additional content from FoundryVerse archive -->

## Questions to Ask the User First

1. **Where are you starting and where are you ending?** (or is it a loop?)
2. **How many days do you have?**
3. **Who is traveling?** (adults only, family with kids, group of friends, couple, solo)
4. **What is your daily driving tolerance?** (2-3 hours, 4-5 hours, 6+ hours)
5. **What type of road trip is this?** (scenic/leisure, destination-focused, adventure/camping, food-focused)
6. **What is your budget?**
7. **What vehicle are you taking?** (sedan, SUV, RV, van)
8. **Are you bringing pets?**
9. **What are your must-stop interests?** (national parks, beaches, cities, quirky attractions, food spots)
10. **Where do you want to sleep?** (hotels, camping, car, mix)
---

## Step 1: Route Optimization

### Route Planning Process
```
ROUTE PLANNING WORKFLOW:

Step 1: MAP YOUR MUST-STOPS
List every place you want to visit:
1. {{STOP_1}} -- Priority: MUST / NICE-TO-HAVE
2. {{STOP_2}} -- Priority: MUST / NICE-TO-HAVE
3. {{STOP_3}} -- Priority: MUST / NICE-TO-HAVE
4. {{STOP_4}} -- Priority: MUST / NICE-TO-HAVE
5. {{STOP_5}} -- Priority: MUST / NICE-TO-HAVE

Step 2: DETERMINE THE LOGICAL ORDER
- Plot stops on a map
- Identify the most efficient route connecting them
- Consider highway vs scenic route tradeoffs:
  - Highway: Faster, more rest stops, more predictable
  - Scenic route: More interesting, slower, fewer services

Step 3: CALCULATE DRIVING TIMES
Segment 1: {{START}} to {{STOP_1}}: {{HOURS}} hrs ({{MILES}} mi)
Segment 2: {{STOP_1}} to {{STOP_2}}: {{HOURS}} hrs ({{MILES}} mi)
Segment 3: {{STOP_2}} to {{STOP_3}}: {{HOURS}} hrs ({{MILES}} mi)
[Continue for all segments]
TOTAL: {{HOURS}} hrs ({{MILES}} mi)

Step 4: BUILD THE DAY-BY-DAY PLAN
Rule of thumb: No more than 6 hours of driving per day
Add 30% to Google Maps time for stops and slower sections

Step 5: IDENTIFY BACKUP STOPS
For each long stretch, identify:
- Rest areas (every 2 hours)
- Gas stations (before tank is below 1/4)
- Interesting detours (if ahead of schedule)
- Overnight alternatives (in case you are tired)
```

### Route Planning Tools
```
RECOMMENDED TOOLS:

ROUTE PLANNING:
- Google Maps: Best overall directions and traffic
- Roadtrippers: Best for finding attractions along routes
- GasBuddy: Find cheapest gas along your route
- iOverlander: Best for camping and van life

ATTRACTIONS:
- Atlas Obscura: Unusual and quirky roadside attractions
- Roadside America: Classic roadside attractions database
- AllTrails: Hiking near your route
- Yelp/Google: Restaurants along the way

ACCOMMODATION:
- Booking.com: Hotels and motels
- Airbnb: Rentals along the route
- Hipcamp: Unique camping experiences
- Campendium: Campground reviews and availability
- FreeRoam/iOverlander: Free camping spots

OFFLINE MAPS:
- Download Google Maps offline for each region
- Download navigation for areas with poor cell service
- Paper atlas as absolute backup
```
---

## Step 2: Stop Planning

### The 2-Hour Rule
```
STOP FREQUENCY GUIDELINES:

Every 2 hours: Brief stop (15-20 minutes)
- Stretch, bathroom, switch drivers, get gas, snack

Every 4 hours: Medium stop (30-60 minutes)
- Meal break, quick attraction, short walk

Once per day: Long stop (1-3 hours)
- Major attraction, hiking, town exploration, lunch
```

### Stop Types and Planning
```
STOP CATEGORIES:

REST AND FUEL:
[ ] Gas stations (plan for every 200-250 miles or when below 1/4 tank)
[ ] Rest areas (every 2 hours minimum)
[ ] Fast food or gas station for bathroom breaks

MEALS:
[ ] Research restaurants along the route in advance
[ ] Use Yelp/Google sorted by rating and proximity to route
[ ] Check hours (rural restaurants close early)
[ ] Pack snacks for between-stop hunger

SCENIC/PHOTO STOPS:
[ ] Scenic overlooks and pullouts
[ ] Interesting bridges, formations, or landmarks
[ ] State/national park viewpoints (often free)

ATTRACTIONS:
[ ] National/state parks (check entry fees and reservation needs)
[ ] Roadside attractions (World's Largest Ball of Twine, etc.)
[ ] Historic sites and monuments
[ ] Local towns worth exploring

ACTIVE BREAKS:
[ ] Short hikes (30-60 minutes)
[ ] Beach or lake stop
[ ] Bike rental in a town
[ ] Playground for kids

DAY-BY-DAY STOP PLAN:

DAY {{NUMBER}}: {{START_CITY}} to {{END_CITY}}
Total drive: {{HOURS}} hrs ({{MILES}} mi)

{{TIME}}: Depart {{START}}
{{TIME}}: Rest stop -- {{LOCATION}} (15 min)
{{TIME}}: Attraction -- {{NAME}} ({{DURATION}})
{{TIME}}: Lunch -- {{RESTAURANT}} in {{CITY}}
{{TIME}}: Scenic stop -- {{LOCATION}} (20 min)
{{TIME}}: Arrive {{DESTINATION}}
{{TIME}}: Check into {{ACCOMMODATION}}
{{TIME}}: Dinner at {{RESTAURANT}}

Fuel stops needed: {{NUMBER}} (at {{LOCATIONS}})
```
---

## Step 3: Vehicle Preparation Checklist

### Pre-Trip Vehicle Check
```
VEHICLE PREPARATION (1-2 weeks before):

MAINTENANCE:
[ ] Oil change (if due within 2,000 miles)
[ ] Tire pressure (including spare) -- check when cold
[ ] Tire tread depth (penny test: if you see Lincoln's head, replace)
[ ] Tire rotation (if overdue)
[ ] Brake inspection
[ ] All fluids: coolant, transmission, brake, windshield washer, power steering
[ ] Battery test (especially if 3+ years old)
[ ] Air filter check
[ ] Wiper blades (replace if streaking)
[ ] All lights working (headlights, brake, turn signals, hazards)
[ ] AC/heating working properly

DOCUMENTATION:
[ ] Valid registration
[ ] Proof of insurance
[ ] Driver's license (for all drivers)
[ ] AAA or roadside assistance membership active
[ ] Vehicle manual in the car

CAR CLEANING AND ORGANIZATION:
[ ] Clean interior (you will be spending a lot of time here)
[ ] Clean windshield inside and out
[ ] Organize trunk/cargo area
[ ] Install phone mount
[ ] Charge car accessories (Bluetooth adapter, etc.)
[ ] Clean out unnecessary items to maximize space

RENTAL CAR CONSIDERATIONS:
[ ] Inspect thoroughly before driving off the lot
[ ] Photo/video document any existing damage
[ ] Understand insurance coverage (your card may cover it)
[ ] Verify unlimited mileage
[ ] Check for toll transponder
[ ] Understand fuel return policy
```
---

## Step 4: Emergency Kit

### Road Trip Emergency Essentials
```
EMERGENCY KIT:

VEHICLE EMERGENCY:
[ ] Jumper cables or portable jump starter
[ ] Spare tire (verified inflated) + jack + lug wrench
[ ] Tire pressure gauge
[ ] Flashlight + extra batteries (or hand-crank)
[ ] Reflective triangles or flares
[ ] Duct tape
[ ] Basic tool kit (screwdrivers, pliers, wrench)
[ ] Tow strap
[ ] Engine oil (1 quart)
[ ] Coolant (1 gallon)
[ ] Windshield washer fluid
[ ] Fuses (assorted)

PERSONAL EMERGENCY:
[ ] First aid kit (bandages, antiseptic, pain relievers,
    allergy meds, any prescriptions)
[ ] Water (1 gallon per person minimum)
[ ] Non-perishable snacks (granola bars, nuts, crackers)
[ ] Blanket(s)
[ ] Rain poncho
[ ] Multi-tool or pocket knife
[ ] Phone charger + car charger + portable battery
[ ] Paper maps (in case of no cell service)
[ ] Cash (small bills, including coins for tolls)
[ ] Pen and paper
[ ] Sunscreen
[ ] Bug spray

WINTER ADDITIONS:
[ ] Ice scraper and snow brush
[ ] Bag of sand or cat litter (traction)
[ ] Extra warm clothing and blankets
[ ] Hand warmers
[ ] Chains (if required by your route)

ROADSIDE ASSISTANCE:
- AAA: 1-800-222-4357
- Your insurance's roadside number: {{NUMBER}}
- Know how to change a tire (practice before the trip)
```
---

## Step 5: Entertainment Planning

### Keeping Everyone Happy
```
ENTERTAINMENT OPTIONS:

AUDIO:
[ ] Curated playlists (create collaborative ones before the trip)
[ ] Podcasts downloaded for offline listening
  - Road trip favorites: Serial, Stuff You Should Know,
    Radiolab, My Favorite Murder, No Such Thing As A Fish
[ ] Audiobooks (download from Audible, Libby, or library apps)
[ ] Stand-up comedy specials
[ ] Local radio stations (for regional flavor)

APPS AND GAMES:
[ ] Roadside America app (quirky attractions nearby)
[ ] GeoGuessr (guess the location game)
[ ] Trivia apps (Trivia Crack, etc.)
[ ] Scavenger hunt list (create before departure)

ANALOG ENTERTAINMENT:
[ ] Travel journal / sketch pad
[ ] Card games (for rest stops)
[ ] Coloring books (adults and kids)
[ ] Physical books and magazines

FOR KIDS:
[ ] Tablets with downloaded movies/shows (get headphones)
[ ] Activity books and coloring supplies
[ ] Magnetic travel games
[ ] Snack variety (different snack every 2 hours)
[ ] "Screen-free" activity bag
[ ] Small toys and figures
[ ] Window clings
```

### Road Trip Games
```
CLASSIC ROAD TRIP GAMES:

1. LICENSE PLATE GAME
   Try to spot plates from all 50 states. Print a checklist.

2. 20 QUESTIONS
   One person thinks of something; others ask yes/no questions.

3. I SPY
   "I spy with my little eye something that is {{COLOR/LETTER}}."

4. THE ALPHABET GAME
   Find each letter of the alphabet on signs, in order.

5. WOULD YOU RATHER
   Take turns asking outrageous "would you rather" questions.

6. NAME THAT TUNE
   Play a song intro; first to name it wins.

7. TWO TRUTHS AND A LIE
   Each person shares 3 facts; others guess the lie.

8. THE STORY GAME
   Each person adds one sentence to a collaborative story.

9. CATEGORY GAME
   Name a category; go around naming items until someone is stuck.

10. ROAD TRIP BINGO
    Create bingo cards with things you might see
```
---

## Step 6: Accommodation Along the Route

### Booking Strategy
```
ACCOMMODATION PLANNING:

BOOKING APPROACH:
Option A: PRE-BOOK EVERYTHING (recommended for peak season, families)
- Book all accommodations in advance
- Provides certainty and peace of mind
- May get better rates for booking early
- Less flexible if plans change

Option B: BOOK FIRST/LAST NIGHT, WING THE REST (recommended for flexible travelers)
- Book your first and last night
- Identify options along the route but do not commit
- Book day-of or day-before via apps
- More flexibility but more risk during busy periods

Option C: CAMP AND SLEEP IN VEHICLE (budget/adventure travelers)
- Plan campground stops along the route
- Reserve popular campgrounds in advance
- Identify free camping on BLM/National Forest land
- Walmart parking lots (some allow overnight; check first)

ACCOMMODATION SPACING:
Calculate where you will be at the end of each driving day.
Search for options within a 30-minute radius of that point.
Book the best option that fits your budget.

ACCOMMODATION COMPARISON FOR THE ROUTE:
Day | End City     | Option 1        | Price | Option 2        | Price
----|-------------|-----------------|-------|-----------------|------
1   | {{CITY}}    | {{HOTEL}}       | ${{}} | {{AIRBNB}}      | ${{}}
2   | {{CITY}}    | {{HOTEL}}       | ${{}} | {{CAMPGROUND}}  | ${{}}
3   | {{CITY}}    | {{HOTEL}}       | ${{}} | {{MOTEL}}       | ${{}}
```
---

## Step 7: Budget Estimation

### Road Trip Budget Calculator
```
ROAD TRIP BUDGET:

FUEL:
Total miles: {{MILES}}
Vehicle MPG: {{MPG}}
Gallons needed: {{MILES / MPG}} = {{GALLONS}}
Average gas price: ${{PRICE/GAL}}
TOTAL FUEL COST: ${{GALLONS x PRICE}} = ${{TOTAL}}

TOLLS:
Estimated toll costs (check tollguru.com): ${{AMOUNT}}

ACCOMMODATION:
{{NIGHTS}} nights x ${{AVG_COST/NIGHT}} = ${{TOTAL}}

FOOD:
{{DAYS}} days x {{PEOPLE}} people x ${{AVG_DAILY_FOOD}} = ${{TOTAL}}
Food breakdown:
- Breakfast: ${{/person/day}}
- Lunch: ${{/person/day}}
- Dinner: ${{/person/day}}
- Snacks/drinks: ${{/person/day}}

ACTIVITIES AND ATTRACTIONS:
{{LIST_WITH_COSTS}}
Total: ${{AMOUNT}}

CAR EXPENSES (if rental):
Rental: ${{TOTAL}}
Insurance: ${{TOTAL}}
Parking: ${{ESTIMATED}}

MISC:
Tips: ${{AMOUNT}}
Souvenirs: ${{AMOUNT}}
Emergency fund: ${{AMOUNT}} (10% of total)

BUDGET SUMMARY:
Fuel:            ${{}}
Tolls:           ${{}}
Accommodation:   ${{}}
Food:            ${{}}
Activities:      ${{}}
Car rental:      ${{}}
Misc:            ${{}}
TOTAL:           ${{}}
```
---

## Step 8: Pet Travel Considerations

### Traveling with Pets
```
PET TRAVEL CHECKLIST:

BEFORE THE TRIP:
[ ] Veterinary check-up (within 30 days for some destinations)
[ ] Up-to-date vaccinations
[ ] Health certificate (required for some states/countries)
[ ] Microchip information current
[ ] ID tags with your phone number (cell, not home)
[ ] Pet-friendly accommodations confirmed at EVERY stop
[ ] Practice short car rides to gauge comfort

IN THE CAR:
[ ] Secured carrier or pet seat belt/harness (never loose in car)
[ ] Window shades for direct sun
[ ] Temperature control (never leave pet in hot car -- not even 5 minutes)
[ ] Familiar blanket or bed from home
[ ] Water bowl (non-spill type)
[ ] Waste bags

PET PACKING LIST:
[ ] Food (enough for the trip + 2 extra days)
[ ] Food and water bowls
[ ] Leash and collar with current tags
[ ] Waste bags (lots of them)
[ ] Medications
[ ] Pet first aid kit
[ ] Favorite toy(s)
[ ] Bed or blanket
[ ] Grooming supplies
[ ] Towels (for dirty paws, wet fur)
[ ] Recent photo of your pet (in case of separation)
[ ] Vaccination records
[ ] Crate or carrier

STOP SCHEDULE FOR PETS:
- Every 2-3 hours: Bathroom break (15 min walk)
- Every 4 hours: Longer exercise break (20-30 min walk/play)
- Always on leash in unfamiliar areas
- Provide water at every stop

PET-FRIENDLY ACCOMMODATIONS:
- Search filter for "pet-friendly" on Booking.com, Airbnb
- Call ahead to confirm pet policy (size limits, fees, deposits)
- Check: BringFido.com for pet-friendly hotels and restaurants
- National parks: Pets often restricted to roads, campgrounds, and
  paved trails (NOT backcountry trails)
- State parks: Generally more pet-friendly than national parks

PET CAR SAFETY:
- NEVER leave a pet in a parked car (heat stroke risk even at 70F)
- Keep head inside the car (debris injury risk from open windows)
- Secure pet with crash-tested harness or carrier
- Do not feed a large meal right before driving (motion sickness)
- Motion sickness solutions: Dramamine for dogs (consult vet for dosage)
```
---

## Road Trip Day-of Checklist
```
DEPARTURE DAY:

THE NIGHT BEFORE:
[ ] Pack the car (heavy items on bottom, essentials accessible)
[ ] Check weather and road conditions for Day 1 route
[ ] Charge all devices
[ ] Download offline maps for the route
[ ] Set alarm
[ ] Fill up gas tank (start with a full tank)

MORNING OF:
[ ] Check tire pressure
[ ] Clean windshield
[ ] Verify all passengers have essentials (phone, wallet, meds)
[ ] Confirm first day's stops and reservations
[ ] Take a departure photo (tradition)
[ ] Lock up the house, set lights on timers
[ ] And you are off
```
---
*This skill provides road trip planning guidance. Always check current road conditions, weather, and attraction hours before departing each day. The best road trips balance planning with spontaneity -- leave room for unexpected discoveries.*
