---
name: solo-travel-planner
description: |
  Creates solo-optimized travel itineraries with built-in safety layers,
  social connection opportunities, and single-traveler logistics. Gathers
  destination, dates, comfort level, and interests to produce a day-by-day
  schedule with emergency contacts template, safety check-in protocol, and
  solo-friendly activity recommendations.
  Use when the user asks to plan a solo trip, travel alone safely, find
  solo-friendly activities, or create a single-traveler itinerary.
  Do NOT use for group trip planning, family trip planning (use
  family-trip-planner), or general itinerary building without solo-specific
  safety considerations (use trip-itinerary-builder).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel planning safety itinerary"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Solo Travel Planner

## When to Use

**Use this skill when:**
- User asks to plan a solo trip or travel alone
- User wants safety-conscious travel planning for a single traveler
- User asks about solo-friendly destinations, activities, or accommodations
- User wants a solo travel itinerary with check-in protocols
- User is a first-time solo traveler seeking structured guidance
- User wants social connection opportunities while traveling alone

**Do NOT use when:**
- User is traveling with others (use `trip-itinerary-builder` or `family-trip-planner`)
- User wants only a general itinerary without solo-specific safety features (use `trip-itinerary-builder`)
- User wants a travel budget (use `budget-travel-planner`)
- User wants a packing list (use `packing-list-builder`)
- User needs business travel planning

## Process

1. **Gather solo trip parameters.** Ask the user for:
   - Destination city or region
   - Travel dates (arrival and departure)
   - Solo travel experience level (first time, experienced, very experienced)
   - Comfort level with solo activities (comfortable eating alone, prefers group tours, mix)
   - Top interests and priorities (culture, food, nature, nightlife, adventure, history)
   - Accommodation preference (hostel for social, hotel for privacy, guesthouse for local experience)
   - Budget range (budget, moderate, premium)
   - Any safety concerns or constraints (mobility, dietary, medical)
   - Check-in contact (someone at home to share location with)
   - Language ability at destination (fluent, basic phrases, none)

2. **Assess destination safety profile.** Determine:
   - General safety reputation for solo travelers (especially solo female travelers if relevant)
   - Neighborhoods to favor and neighborhoods to avoid after dark
   - Common scam types at the destination
   - Local emergency numbers and nearest embassy or consulate location
   - Local SIM card or data availability for maps and communication
   - Typical transportation safety (licensed taxis, transit after dark)

3. **Build the safety infrastructure.** Create:
   - Emergency contacts card (local emergency number, embassy, accommodation address and phone, check-in contact)
   - Daily check-in protocol (time and method for contacting someone at home)
   - Location sharing setup recommendation
   - Copies of critical documents list (passport, insurance, prescriptions)
   - Safe neighborhoods map for daytime and nighttime

4. **Design the solo-optimized itinerary.** For each day:
   - Schedule solo-friendly activities (self-guided tours, museums, markets, parks)
   - Include at least one social opportunity per day (group tour, cooking class, communal hostel event, cafe with communal seating)
   - Avoid isolated locations after dark -- schedule evening activities in well-populated areas
   - Build in flexible free time (solo travelers can be spontaneous)
   - Add one "treat yourself" activity per trip (nice meal, spa, premium experience)
   - Include transit details between activities with solo-safe method noted

5. **Add solo dining strategy.** For meal planning:
   - Identify counter or bar seating restaurants (comfortable for one)
   - Suggest food markets, food halls, or street food areas (casual, no awkward table-for-one)
   - Note breakfast options at or near accommodation
   - Include one communal dining experience (cooking class with meal, food tour)

6. **Add accommodation logistics.** Include:
   - Arrival instructions (how to get from airport to accommodation solo, especially at night)
   - Accommodation safety features to confirm (24-hour reception, room safes, lockers)
   - Neighborhood walkability and nighttime safety assessment
   - Luggage storage options for check-out day activities

7. **Compile the complete plan.** Assemble:
   - Emergency contacts card
   - Day-by-day itinerary with safety annotations
   - Solo dining guide
   - Social connection opportunities list
   - Check-in protocol schedule

## Output Format

```
## Solo Trip Plan: [Destination]

**Dates:** [Start] - [End] ([N] days)
**Solo experience level:** [First time | Experienced | Very experienced]
**Budget tier:** [Budget | Moderate | Premium]
**Accommodation type:** [Hostel | Hotel | Guesthouse]

---

### Emergency Contacts Card

| Contact                  | Number/Info                          |
|--------------------------|--------------------------------------|
| Local emergency          | [Number]                             |
| Nearest embassy/consulate| [Location and phone]                 |
| Accommodation            | [Name, address, phone]               |
| Home check-in contact    | [Name and preferred contact method]  |
| Travel insurance         | [Policy number, emergency line]      |

**Check-in protocol:** [Time and method, e.g., "Daily text at 20:00 local time"]

### Safety Notes

- **Safe neighborhoods (day and night):** [List]
- **Avoid after dark:** [List]
- **Common scams:** [2-3 scams with avoidance tips]
- **Transport safety:** [Licensed taxi identification, transit notes]

---

### Day 1: [Date] - [Theme]

**Focus area:** [Neighborhood]

| Time  | Activity                       | Duration | Transit          | Solo notes              |
|-------|--------------------------------|----------|------------------|-------------------------|
| [HH:MM] | [Activity]                  | [X min]  | [Method, X min]  | [Safety or social note] |
| [HH:MM] | [Meal: solo-friendly spot]  | [X min]  | [Method, X min]  | [Counter seating, etc.] |
| [HH:MM] | [Social opportunity]        | [X min]  | [Method, X min]  | [Group tour, class]     |

**Solo dining options today:**
- Breakfast: [Location type and area]
- Lunch: [Location type and area]
- Dinner: [Location type and area, solo-friendly format]

**Evening plan:** [Activity in well-populated area or return to accommodation]
**Check-in:** [Time] -- [text/call home contact]

---

### Social Connection Opportunities

| Day | Activity                    | Type           | Booking needed |
|-----|-----------------------------|----------------|----------------|
| [X] | [Group walking tour]        | Group activity | [Yes/No]       |
| [X] | [Cooking class]             | Social dining  | [Yes/No]       |
| [X] | [Hostel common room event]  | Informal       | No             |

### Solo Packing Additions

- [Safety-specific item, e.g., door wedge for accommodation]
- [Solo-specific item, e.g., portable charger for solo navigation]
- [Item for solo meals, e.g., book or journal for restaurant comfort]
```

## Rules

1. NEVER include external URLs, specific hostel or hotel brand names, or tour company names -- use generic descriptors
2. ALWAYS include an emergency contacts card with local emergency number, embassy info, and check-in protocol
3. ALWAYS include at least one social connection opportunity per day in the itinerary
4. Evening activities must be in well-populated, well-lit areas -- never schedule solo travelers in isolated locations after dark
5. Include solo dining strategy with counter seating, food market, or communal dining options for every meal
6. Transportation recommendations must prioritize safety (licensed vehicles, well-lit transit stops, avoid empty last trains)
7. Include a daily check-in protocol with a specified time and method
8. NEVER output generic safety advice like "be aware of your surroundings" -- every safety note must be destination-specific and actionable
9. First-time solo travelers get extra detail: arrival logistics from airport, first-night orientation, and a "Day 1 confidence builder" activity
10. Include a "Solo packing additions" section with safety and comfort items specific to solo travel

## Edge Cases

- **First-time solo traveler with high anxiety:** Front-load Day 1 with a group activity (walking tour, orientation class) to build confidence. Recommend accommodation with strong social environment (hostels with common areas, guesthouses with communal breakfast). Reduce Day 1 activity count to 2-3 familiar-feeling activities. Include a "solo travel mantras" section: specific reassurances with practical backing.

- **Solo female traveler to conservative destination:** Research dress code norms and include them in packing notes. Identify women-focused accommodation options or female-only hostel dorms. Note areas where solo women receive unwanted attention and suggest alternatives. Include specific scam awareness for solo women. Recommend daytime-heavy scheduling.

- **Extended solo trip (over 2 weeks):** Add one "social reset" day per week (hostel social event, group day tour, language exchange meetup). Include a "solo fatigue management" section: signs to watch for and strategies (change accommodation type, call home, treat-yourself day). Build in 2 unscheduled days per week for spontaneity.

- **Solo traveler with limited language skills:** Prioritize self-guided activities with visual or audio guides. Recommend a translation application setup. Include key phrases list for the destination. Suggest group tours in the user's language. Note restaurants with picture menus or English menus.

- **Solo trip to remote or nature destination:** Require the user to register with a local authority or park service if applicable. Schedule all wilderness activities during daylight. Include emergency beacon or satellite communication device recommendation. Never schedule solo backcountry activities without a filed plan.

- **Solo traveler on a very tight budget:** Recommend hostels with kitchen access for cooking. Identify free walking tours (tip-based). Schedule activities during free-admission hours at museums. Include a daily budget cap and tracking method.

## Example

**Input:** "I want to plan a 4-day solo trip to Barcelona. First time traveling solo. I love food and architecture. Moderate budget. I am a bit nervous about eating alone."

**Output:**

## Solo Trip Plan: Barcelona, Spain

**Dates:** To be confirmed (4 days)
**Solo experience level:** First time
**Budget tier:** Moderate
**Accommodation type:** Social hostel or boutique hotel with communal areas

---

### Emergency Contacts Card

| Contact                  | Number/Info                                    |
|--------------------------|------------------------------------------------|
| Local emergency          | 112 (all services)                             |
| Nearest embassy/consulate| Check your country's embassy directory for Barcelona location |
| Accommodation            | [To be filled after booking -- keep address and phone on paper and phone] |
| Home check-in contact    | [User's designated contact]                    |
| Travel insurance         | [Policy number -- carry a photo of your card]  |

**Check-in protocol:** Daily text at 20:00 local time to home contact. Share live location during the day.

### Safety Notes

- **Safe neighborhoods (day and night):** Eixample, Gracia, Born, Barceloneta (main areas), Gothic Quarter (main streets)
- **Avoid after dark:** Raval side streets, El Port area after midnight, Barceloneta beach at night
- **Common scams:** Fake petitions (decline and walk away), bump-and-grab near tourist sites (use a cross-body bag), unlicensed taxi overcharging (use only licensed yellow and black taxis)
- **Transport safety:** Metro runs until midnight (Sun-Thu), 24h on Fri-Sat. Licensed taxis are yellow/black. Rideshare available.

---

### Day 1: Arrival and Confidence Builder

**Focus area:** Gothic Quarter and Born neighborhood

| Time  | Activity                                     | Duration | Transit          | Solo notes                         |
|-------|----------------------------------------------|----------|------------------|------------------------------------|
| 12:00 | Check in, settle, neighborhood orientation walk | 60 min  | Walk             | Get your bearings, find nearby cafe|
| 13:00 | Lunch -- Born neighborhood food market hall   | 60 min   | Walk, 5 min      | Market stalls, counter seating, casual -- no table-for-one awkwardness |
| 14:15 | Gothic Quarter self-guided walk               | 90 min   | Walk, 10 min     | Cathedral square, narrow streets, Roman walls |
| 15:45 | Coffee at a plaza cafe -- people-watching      | 30 min   | Walk, 5 min      | Outdoor cafe, bring a book or journal |
| 16:30 | Group walking tour of Gothic Quarter          | 120 min  | Walk, 5 min      | **Social opportunity**: meet other travelers, tip-based |
| 18:30 | Free time / rest at accommodation             | 90 min   | Walk              | Recharge before evening            |
| 20:00 | Dinner -- Born neighborhood tapas bar         | 75 min   | Walk, 5 min      | Bar seating is standard for tapas -- solo is normal here |

**Solo dining options today:**
- Lunch: Market hall -- counter stalls, point-and-choose, no menu anxiety
- Dinner: Tapas bar -- bar seating is the norm, order 3-4 small plates, casual

**Evening plan:** Return to accommodation after dinner. Explore common area if hostel. Read or plan tomorrow.
**Check-in:** 20:00 -- text home contact from dinner

---

### Day 2: Architecture and Eixample District

**Focus area:** Eixample

| Time  | Activity                                     | Duration | Transit          | Solo notes                         |
|-------|----------------------------------------------|----------|------------------|------------------------------------|
| 09:00 | Breakfast near accommodation                  | 30 min   | Walk              | Cafe counter or hotel breakfast    |
| 09:45 | Sagrada Familia visit                         | 90 min   | Metro, 15 min    | Book ahead: 7 days. Audio guide works perfectly solo |
| 11:30 | Eixample neighborhood walk -- modernist facades | 60 min  | Walk              | Self-guided, photograph building details |
| 12:30 | Casa Batllo or Casa Mila exterior and area     | 45 min   | Walk, 10 min     | Book interior visit ahead if desired |
| 13:30 | Lunch -- Eixample local lunch counter          | 45 min   | Walk, 5 min      | Many restaurants offer "menu del dia" at counter |
| 14:30 | Cooking class with market visit               | 180 min  | Metro, 10 min    | **Social opportunity**: group class, make a meal together |
| 18:00 | Rest at accommodation                          | 90 min   | Metro, 15 min    |                                    |
| 19:30 | Sunset walk at Bunkers del Carmel viewpoint    | 60 min   | Bus, 20 min      | Popular local hangout, bring a snack |
| 21:00 | Dinner -- Gracia neighborhood small plates     | 75 min   | Walk, 15 min     | Lively area, bar seating available  |

**Solo dining options today:**
- Breakfast: Cafe counter near accommodation
- Lunch: "Menu del dia" counter at Eixample restaurant (set lunch, fast, solo-friendly)
- Dinner: Gracia neighborhood -- vibrant evening atmosphere, comfortable for solo diners

**Evening plan:** Gracia is well-lit and busy until late. Walk back or take metro.
**Check-in:** 20:00 -- text from Bunkers viewpoint or dinner

---

### Day 3: Waterfront, Food, and Culture

**Focus area:** Barceloneta and Montjuic

| Time  | Activity                                     | Duration | Transit          | Solo notes                         |
|-------|----------------------------------------------|----------|------------------|------------------------------------|
| 09:00 | Breakfast at accommodation                    | 30 min   | --                |                                    |
| 09:45 | Barceloneta beach morning walk                | 45 min   | Metro, 10 min    | Daytime only for solo beach visits  |
| 10:50 | Port area exploration and maritime museum area| 60 min   | Walk, 10 min     |                                    |
| 12:00 | Food tour of Born or Barceloneta              | 150 min  | Walk, 5 min      | **Social opportunity**: group food tour, 6-12 people |
| 14:30 | Montjuic cable car and gardens                | 90 min   | Metro + funicular, 20 min | Beautiful solo walk, photo opportunities |
| 16:20 | National Art Museum area                       | 75 min   | Walk, 10 min     | Rooftop terrace has city views     |
| 17:45 | Return to accommodation, rest                  | 90 min   | Metro, 15 min    |                                    |
| 19:30 | Evening at accommodation social area or local bar | 90 min | Walk             | Hostel event or neighborhood wine bar |
| 21:00 | Dinner -- neighborhood casual restaurant       | 60 min   | Walk, 5 min      |                                    |

**Solo dining options today:**
- Lunch: Covered by food tour (social, communal)
- Dinner: Casual neighborhood spot -- counter or small table, relaxed atmosphere

**Check-in:** 20:00 -- text from accommodation

---

### Day 4: Departure Day -- Gracia and Last Bites

**Focus area:** Gracia neighborhood

| Time  | Activity                                     | Duration | Transit          | Solo notes                         |
|-------|----------------------------------------------|----------|------------------|------------------------------------|
| 08:30 | Breakfast at a Gracia cafe                    | 40 min   | Walk or metro     | Last local breakfast               |
| 09:30 | Gracia neighborhood market visit               | 45 min   | Walk, 5 min      | Local food market, buy snacks for travel |
| 10:30 | Park Guell area visit                          | 75 min   | Walk, 15 min     | Book ahead: 3 days                 |
| 12:00 | Last lunch -- Gracia tapas bar                 | 45 min   | Walk, 10 min     |                                    |
| 13:00 | Return to accommodation, check out             | 30 min   | Metro, 10 min    | Luggage storage if needed          |
| 13:45 | Depart for airport                             | --       | Airport bus, 35 min | Arrive 2 hours before flight     |

**Check-in:** Text after arriving at airport

---

### Social Connection Opportunities

| Day | Activity                    | Type           | Booking needed |
|-----|-----------------------------|----------------|----------------|
| 1   | Group walking tour          | Group tour     | No (show up)   |
| 2   | Cooking class with market   | Social dining  | Yes, 5 days ahead |
| 3   | Food tour of Born area      | Group tour     | Yes, 3 days ahead |
| 3   | Accommodation social event  | Informal       | No             |

### Solo Packing Additions

- Cross-body bag with zipper closure (pickpocket prevention)
- Portable phone charger (solo navigation drains battery)
- Door wedge or portable door lock (extra accommodation security)
- Book or journal (comfortable solo dining companion)
- Written copy of accommodation address and emergency contacts (in case phone dies)
- Earbuds (audio guides, podcasts during solo walks, and a social signal for when you want to be left alone)
