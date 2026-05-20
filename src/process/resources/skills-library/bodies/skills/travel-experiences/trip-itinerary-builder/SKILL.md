---
name: trip-itinerary-builder
description: |
  Builds detailed day-by-day travel itineraries with timed activities, transit
  directions, meal windows, and contingency alternatives. Gathers destination,
  dates, traveler count, budget range, and interest preferences, then produces
  a structured schedule the user can print or share.
  Use when the user asks to plan a trip itinerary, create a day-by-day travel
  schedule, organize activities for a vacation, or build a sightseeing plan.
  Do NOT use for road trip route planning (use road-trip-planner), packing
  lists (use packing-list-builder), travel budgets (use budget-travel-planner),
  or business conference logistics.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel itinerary planning step-by-step"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Trip Itinerary Builder

## When to Use

**Use this skill when:**
- A user asks to build a day-by-day itinerary for a specific destination with defined dates -- even if they have only a rough sense of what they want to do
- A user has a trip already booked and wants help structuring their days so they do not waste time backtracking or arriving at closed attractions
- A user wants timed activity blocks, meal windows, and transit directions assembled into a single printable or shareable schedule
- A user needs to fit a known list of "must-see" attractions into a limited number of days and wants help sequencing them efficiently
- A user is returning to a destination they have visited before and wants a fresh itinerary targeting different neighborhoods or experiences
- A user has a mix of pre-booked fixed activities (tours, concerts, restaurant reservations) and wants the remaining days structured around those anchors
- A user asks how to organize a multi-city trip with a clear arrival and departure date for each city

**Do NOT use when:**
- The user's primary need is routing a road trip with driving legs, overnight stops, and fuel or rest break planning -- use `road-trip-planner` instead
- The user wants a packing checklist, even if it references the itinerary destinations or activities -- use `packing-list-builder`
- The user wants a detailed line-item travel budget with currency conversion, daily spend targets, and cost-tracking -- use `budget-travel-planner`
- The user is a solo female or solo traveler whose primary concern is safety routing, neighborhood safety ratings, and emergency contacts -- use `solo-travel-planner`
- The user is traveling with children under 12 and needs age-appropriate activity filtering, nap scheduling, stroller accessibility, and family logistics -- use `family-trip-planner`
- The user is choosing between two or more destinations and has not yet decided where to go -- use `destination-comparison` first, then return to this skill
- The user is planning corporate travel, a conference attendance schedule, or business logistics with meeting rooms and client dinners -- this skill does not handle professional obligation scheduling

---

## Process

### Step 1: Gather Trip Parameters

Before building anything, collect the following inputs. If the user has not provided them, ask for all missing items in a single message -- never in separate follow-up questions.

- **Destination:** City and country, or region if multi-city. If the user says "Europe" or "Southeast Asia," narrow it down before proceeding.
- **Dates:** Exact arrival date, arrival time (morning vs. evening matters for Day 1 planning), and departure date and time. If departure time is unknown, assume a midday flight and note this assumption.
- **Traveler count and composition:** Number of people, relationship type (couple, solo, group of friends, mixed ages), and any mobility considerations. A group of 6 friends moves differently than a couple.
- **Budget tier:** Budget (hostel-level, street food, free attractions), moderate (mid-range hotels, sit-down restaurants, paid museums), or premium (boutique hotels, reservations-required dining, private guides). This affects pacing -- premium travelers spend more time per activity.
- **Core interests:** Ask for a ranked top-3. Common categories: history/architecture, food and culinary experiences, nature/outdoors, art/museums, nightlife/bars, shopping, local culture and neighborhoods, adventure/sport, wellness/spas, photography.
- **Accommodation location:** Neighborhood or district, if already booked. This is the geographic anchor for every day's routing.
- **Pre-booked or fixed-time activities:** Any tours, concerts, restaurant reservations, or transportation with confirmed times. These become schedule anchors.
- **Pace preference:** Define this clearly -- Relaxed (no more than 3-4 destinations per day, minimum 90-minute free blocks), Moderate (5-6 destinations per day, one free block), Packed (7-9 destinations per day, breaks only for meals and transit).
- **Dietary restrictions or food preferences:** Vegetarian, vegan, halal, kosher, severe allergies, or cuisine preferences. This shapes every meal window.
- **Physical considerations:** Walking ability, heat tolerance, altitude concerns, or aversion to long transit rides.

### Step 2: Research Destination Logistics

This step requires applying real destination knowledge. Do not invent opening hours or transit times -- use the knowledge embedded in training data or flag uncertainty explicitly.

- **Opening hours by attraction type:** Most major museums open 09:00-10:00 and close 17:00-18:00, often closed Mondays. Religious sites typically open earlier (08:00) but close for midday prayer in many cultures. Markets are almost always morning-only, peaking 07:00-12:00 and shuttering by 14:00. Night markets and food streets run 18:00-23:00.
- **Attraction crowd patterns:** Globally, the busiest period at top attractions is 10:00-14:00 on weekends. Scheduling popular sites before 09:30 or after 15:00 reduces queue time by 30-60 minutes on busy days. In shoulder season (April-May, September-October), midweek mornings are significantly less crowded.
- **Transit baseline times by city type:** In compact historic European cities (Lisbon, Prague, Dubrovnik), most inter-neighborhood walking is 10-20 minutes. In sprawling Asian megacities (Bangkok, Tokyo, Jakarta), metro or taxi between districts is 25-45 minutes. In North American cities (New York, Chicago), subway is typically 20-35 minutes between central neighborhoods. In small island or coastal towns, everything is often walkable within 15 minutes.
- **Seasonal factors:** October-November and March-April are globally reliable shoulder seasons. December-February closes some outdoor attractions in Northern Europe and high-altitude destinations. July-August in Southern Europe means heat that peaks 13:00-16:00 -- outdoor activities must be front-loaded to morning or back-loaded to late afternoon/evening. Monsoon season in Southeast Asia (May-October depending on location) requires indoor-heavy afternoon scheduling.
- **Day length and usable daylight:** In June at northern latitudes, sunset may be at 21:00, enabling evening outdoor activities. In December, sunset at 16:30 in Central Europe collapses the outdoor window -- account for this or the itinerary will feel rushed.
- **Local holidays and closures:** Identify if the travel dates overlap with national holidays (Easter closures across Catholic Europe, Golden Week in Japan, Diwali in India, Lunar New Year in East/Southeast Asia). These cause attraction closures and major crowd surges simultaneously.

### Step 3: Cluster Activities by Geography

Geographic clustering is the single most impactful optimization in itinerary planning. A day that zigzags across a city wastes 90-120 minutes of transit that could be used for an additional attraction or rest.

- **Map each activity to its neighborhood or district.** Every major city has 5-10 distinct visitor zones. Group activities into those zones before assigning them to days.
- **Apply the "half-day zone" rule:** Assign one primary neighborhood per half-day block (morning and afternoon). Transit between zones should only happen at natural break points -- lunch or late afternoon return to accommodation.
- **Use accommodation as the day's anchor.** Morning activities should be in or near the accommodation neighborhood, or require only a single transit leg. This allows a midday return for rest without wasted travel.
- **Prioritize geographic proximity over interest category.** If a user loves both history and food, a day that covers a historic district with excellent local restaurants in that district is better than separating the two across the city.
- **Assign one "far zone" day.** If the destination has a major outlying attraction (a coastal town 40 minutes away, a hilltop monastery, a suburban museum), dedicate one full day to it and plan the rest of that day's activities in the same far zone. Do not mix far-zone and city-center activities on the same day.
- **Reserve transit-heavy transit between cities or airports for half-days,** never full days, if the travel time is under 3 hours. If inter-city transit is 3-5 hours, treat it as a full travel day with 1-2 light activities at the arrival end only.

### Step 4: Build the Day-by-Day Schedule

This is the core construction phase. Build each day in sequence, applying the following rules:

- **Assign a day theme:** Each day should have a geographic focus and an experiential identity -- "Medina exploration and traditional crafts," "Coastal headlands and fresh seafood," "Imperial palaces and Zen gardens." This helps the user understand the day at a glance and makes alternatives easier to reason about.
- **Structure each day with six time blocks:** Early morning (07:00-09:00) for breakfast and departure prep; Morning activity (09:00-12:00); Lunch (12:00-13:30 typical); Afternoon activity (13:30-17:00); Late afternoon / golden hour (17:00-19:00) for viewpoints, markets, or cafe time; Evening (19:00-22:00) for dinner and optional evening activity.
- **Insert transit time between every consecutive pair of activities.** Never place two activities back-to-back without a transit entry. Minimum transit entry is 5 minutes for adjacent locations; never assume zero. Transit method must be specified: walk, metro/subway, tram, bus, taxi/rideshare, tuk-tuk, ferry, bicycle.
- **Buffer rules by activity type:** Queue-dependent attractions (Eiffel Tower, Vatican Museums, Sagrada Familia, any globally top-10 site) require a 30-45 minute pre-entry queue buffer even with advance tickets. Outdoor/nature activities require a 15-minute weather-adjustment buffer. Food markets require early arrival -- schedule 30 minutes before the listed opening time.
- **Meal duration minimums:** Breakfast 35-45 minutes; lunch 50-70 minutes (longer for sit-down local restaurants, shorter for market or street food); dinner 75-105 minutes (allow 90 minutes as the standard). Never compress dinner below 60 minutes -- it degrades the travel experience and is unrealistic.
- **Activity duration by type:** Walking a historic neighborhood: 60-90 minutes. A major art museum: 90-120 minutes. A smaller specialty museum: 45-75 minutes. A viewpoint or panorama stop: 20-35 minutes. A food tour: 150-180 minutes. A cooking class: 180-240 minutes. A day-trip excursion with transit: 7-9 hours total. A guided city tour: 120-180 minutes.
- **Include one alternative per half-day block.** Alternatives must be in the same geographic zone as the primary activity and serve the same time slot. Label the reason: (weather alternative), (if closed), (lower-energy option), (if sold out).
- **Pace annotation per day.** After building each day, count total activity hours (excluding transit and meals). Relaxed: up to 5 hours. Moderate: 6-8 hours. Packed: 9-11 hours. Never exceed 11 hours of activity in a single day regardless of stated preference -- this is a physical and logistical limit.

### Step 5: Apply First and Last Day Logic

Arrival and departure days follow different rules from full exploration days.

- **Arrival day:** If arriving before 14:00, the day can support up to 4 hours of light activity. If arriving after 17:00, the day supports only accommodation check-in, neighborhood orientation walk (30-45 minutes), and dinner. Never schedule a major ticketed attraction on arrival day -- the traveler's energy and luggage situation make this impractical. Always include airport-to-accommodation transit with method, estimated time, and cost tier (budget: metro/bus; moderate: taxi/rideshare; premium: private transfer).
- **Departure day:** Work backwards from the required airport departure time. Add the transit time to the airport (always use the upper-bound estimate, not the optimistic one). Add a 30-minute pre-transit buffer for checkout, luggage, and hailing transport. Add 2.5 hours airport buffer for international flights, 1.5 hours for domestic. Everything before that final buffer is available for activity. If less than 2 hours of activity time remains, schedule only a nearby cafe, a final neighborhood walk, or luggage storage at accommodation followed by a walk.
- **Luggage storage on departure day:** Always note that most mid-range and premium accommodations will hold luggage after checkout. Budget options vary -- flag this. Major train stations in Europe and Asia have coin lockers. Include luggage storage explicitly in the departure morning schedule.

### Step 6: Add Practical Logistics and Advance Booking Flags

A beautiful itinerary fails if the user shows up at a closed attraction or finds the tour sold out. Every action item that requires pre-departure preparation must be explicitly flagged.

- **Advance booking requirements by attraction type:** Top-tier world attractions (Colosseum, Uffizi Gallery, Anne Frank House, Alhambra, Machu Picchu, Sagrada Familia) require booking 2-8 weeks in advance during peak season, 3-7 days during shoulder season. Popular food tours and cooking classes book out 5-10 days ahead. Fado shows and cultural performances: 3-5 days. Restaurants with Michelin stars or cult following: 2-4 weeks. Sunset cruises and boat tours: 3-7 days.
- **Dress code entries:** Religious sites requiring covered shoulders and knees (temples, mosques, cathedrals) must be noted on the specific activity row, not in a general note. Specify what "covered" means: long trousers or skirt below the knee, shoulders covered, shoes removed.
- **Cash vs. card guidance:** Most Northern and Western European cities are near-cashless -- note this. Southeast Asian markets and street food stalls are typically cash-only. In Japan, many smaller establishments and regional attractions are cash-only despite the country's technological reputation. Note the local currency and approximate denomination to carry per day.
- **Accessibility notes:** If any activity involves significant stairs, cobblestones, uneven terrain, or long standing queues, note this so users with mobility considerations can plan alternatives.

### Step 7: Compile the Pre-Trip Checklist and Final Review

Before delivering the itinerary, perform a completeness check:

- Every day has at least one alternative per half-day block
- No activity is within 30 minutes of another in a distant neighborhood without transit explicitly noted
- Arrival and departure logistics are fully specified with time buffers
- Every bookable activity has a booking flag with lead time
- Total activity hours per day are within pace limits
- The schedule does not schedule any attraction during its known closed day (e.g., Louvre on Tuesdays, most Spanish museums on Mondays)
- The Pre-Trip Checklist captures every booking deadline, sorted by urgency (earliest deadline first)
- Packing reminders are specific to activities in this itinerary, not generic travel advice

---

## Output Format

```
## Trip Itinerary: [Destination City, Country]

**Dates:** [Day of Week, Month Day] - [Day of Week, Month Day, Year] ([N] nights / [N+1] days)
**Travelers:** [Count] ([composition: couple / group of friends / solo / mixed])
**Pace:** [Relaxed | Moderate | Packed]
**Budget tier:** [Budget | Moderate | Premium]
**Accommodation area:** [Neighborhood or district]
**Primary interests:** [Interest 1], [Interest 2], [Interest 3]

---

### Day 1: [Day of Week, Month Day] -- Arrival and [Neighborhood] Orientation

**Focus area:** [Neighborhood]
**Day type:** Arrival day

| Time  | Activity                              | Duration | Transit to Next          | Notes                                    |
|-------|---------------------------------------|----------|--------------------------|------------------------------------------|
| HH:MM | Airport to accommodation              | X min    | [Method, X min, cost tier] | Upper-bound transit estimate           |
| HH:MM | Check in at accommodation             | 30 min   | Walk, X min              | Request early luggage drop if early arrival |
| HH:MM | [Light orientation activity]          | X min    | Walk, X min              | Low-energy, no booking required          |
| HH:MM | [Viewpoint or neighborhood cafe]      | X min    | Walk, X min              |                                          |
| HH:MM | Dinner -- [neighborhood area/cuisine] | 75 min   | Walk, X min              | [Booking note if needed]                |

**Alternatives:**
- Instead of [Activity]: [Alternative] ([reason: if tired from travel / if raining])

**Day total:** [X] activity-hours | **Pace:** Relaxed (arrival day)

---

### Day 2: [Day of Week, Month Day] -- [Day Theme]

**Focus area:** [Primary neighborhood or district]

| Time  | Activity                              | Duration | Transit to Next          | Notes                                    |
|-------|---------------------------------------|----------|--------------------------|------------------------------------------|
| HH:MM | Breakfast [location type]             | 40 min   | [Method, X min]          |                                          |
| HH:MM | [Morning attraction]                  | X min    | [Method, X min]          | Book ahead: [X days]. [Dress code if applicable] |
| HH:MM | [Secondary morning activity]          | X min    | [Method, X min]          |                                          |
| HH:MM | Lunch -- [neighborhood/cuisine type]  | 60 min   | [Method, X min]          | [Dietary note if applicable]            |
| HH:MM | [Afternoon attraction]                | X min    | [Method, X min]          |                                          |
| HH:MM | [Late afternoon activity/viewpoint]   | X min    | Walk, X min              |                                          |
| HH:MM | Return to accommodation / rest        | 60 min   | --                       |                                          |
| HH:MM | Dinner -- [neighborhood/cuisine type] | 90 min   | Walk, X min              | [Reservation note]                      |

**Alternatives:**
- Instead of [Morning attraction]: [Alternative] ([reason])
- Instead of [Afternoon attraction]: [Alternative] ([reason])
**Rain plan:** [Swap outdoor afternoon for indoor alternative in same zone]

**Day total:** [X] activity-hours | **Pace:** [Relaxed | Moderate | Packed]

---

[Repeat Day structure for each full day]

---

### Day [N]: [Day of Week, Month Day] -- Departure Day

**Focus area:** [Accommodation neighborhood / departure logistics]
**Flight departure:** [HH:MM] [International/Domestic]
**Required airport arrival:** [HH:MM] ([2.5 hrs before international / 1.5 hrs before domestic])
**Depart accommodation by:** [HH:MM] (includes [X min] transit buffer + [X min] pre-transit buffer)

| Time  | Activity                              | Duration | Transit to Next          | Notes                                    |
|-------|---------------------------------------|----------|--------------------------|------------------------------------------|
| HH:MM | Breakfast                             | 40 min   | Walk, X min              |                                          |
| HH:MM | [Final morning activity near hotel]   | X min    | Walk, X min              | Walk-up, no booking needed              |
| HH:MM | Check out + luggage storage           | 20 min   | --                       | Confirm luggage hold at accommodation   |
| HH:MM | [Last activity or final coffee]       | X min    | [Method, X min]          |                                          |
| HH:MM | Collect luggage + depart for airport  | 15 min   | [Method, X min]          | Upper-bound transit estimate            |

**Alternatives:**
- Instead of [Final activity]: [Alternative if packed or if rain]

**Day total:** [X] activity-hours | **Pace:** Relaxed (departure day)

---

### Pre-Trip Checklist (sorted by booking urgency)

- [ ] [Most time-sensitive booking, e.g., attraction requiring 4+ weeks] -- Book by [date]
- [ ] [Second booking] -- Book by [date]
- [ ] [Restaurant reservation] -- Reserve by [date]
- [ ] [Cultural performance or tour] -- Book by [date]
- [ ] Download offline map of [City] (focus: [neighborhoods])
- [ ] Verify opening hours for [specific attraction] on [specific date -- if near known closed day]
- [ ] Confirm [attraction] is open on [holiday date] if travel overlaps public holidays
- [ ] Obtain [entry document or local transit card] before departure

### Packing Reminders (Itinerary-Specific)

- [Item for specific activity, e.g., walking sandals or hiking shoes for Day 3 trail]
- [Dress code item, e.g., lightweight scarf for mosque visit on Day 2]
- [Practical item, e.g., portable water bottle -- tap water not reliably potable in this destination]
- [Weather item based on season, e.g., compact umbrella for afternoon rain showers in October]
```

---

## Rules

1. **Never schedule a bookable top-tier attraction without a "Book ahead" flag and a specific lead-time number.** The most common itinerary failure is a traveler arriving at the Colosseum, Alhambra, or Anne Frank House without a ticket. Every globally-recognized high-demand attraction must carry a booking flag with the minimum recommended lead time, adjusted for the travel season (peak vs. shoulder vs. off-peak).

2. **Transit time and method must appear between every consecutive activity row -- never leave the "Transit to Next" column blank except on the final row of the day.** Using "walk" without a time estimate is not acceptable. If the real transit time is uncertain, write the upper-bound estimate and note it as an estimate (e.g., "Walk, ~20 min est.").

3. **Never schedule back-to-back activities in neighborhoods more than 20 walking minutes apart without an explicit transit block.** The most realistic itinerary failure mode is under-estimated travel time between attractions. When in doubt, add 10 minutes to any transit estimate.

4. **Every day must have at least two alternatives -- one for the morning block and one for the afternoon block.** Alternatives must be geographically co-located with the primary activity, not across the city. An alternative that requires 30 minutes of transit is not a usable substitute on a tight schedule.

5. **Activity-hour caps per pace type are hard limits, not guidelines:** Relaxed = 5 hours maximum; Moderate = 8 hours maximum; Packed = 11 hours maximum. Counts do not include transit time or meal windows. If a user requests a packed schedule, the correct response is to maximize quality of activities up to 11 hours, not to pile in 14 hours of activities.

6. **Arrival day and departure day must be treated as fundamentally different schedule types.** Arrival days before 14:00 support up to 4 hours of light activity; after 17:00, 0-1 hours maximum. Departure day activities must be calculated backwards from the required airport arrival time, always using the upper-bound transit estimate.

7. **Meal windows must follow the stated dietary restrictions.** If a user is vegetarian and the focus district is known primarily for meat-based cuisine, acknowledge this in the meal notes and suggest a more suitable area within walking distance. Never default to "find a restaurant" -- specify cuisine type or district.

8. **Never recommend a self-contradictory geographic sequence.** Running the sequence Colosseum (Rome, east side) -- Vatican (Rome, west side) -- Trastevere (Rome, south of Vatican) -- Campo de' Fiori (Rome, east of Trastevere) -- Palatine Hill (Rome, near Colosseum) is a zigzag that wastes 90+ minutes. Group geographically similar sites even if they span different interest categories.

9. **Always note known closed days explicitly on the activity row, not just in the checklist.** If a museum is closed on Mondays and the visit is scheduled for a Monday, the itinerary must flag this conflict -- not just note it in the checklist where it may be missed.

10. **Language of times must be consistent throughout the entire itinerary.** Choose 24-hour or 12-hour format based on user preference or destination convention (24-hour for European destinations, 12-hour for US destinations) and apply it without exception. Mixing "3:00 PM" and "15:00" in the same document is a formatting error.

11. **The Pre-Trip Checklist must be sorted by booking urgency, with the earliest deadline at the top.** A checklist that puts "download offline map" before "book Sagrada Familia tickets (sells out 8 weeks ahead)" inverts the priority order and risks the traveler missing the critical booking.

12. **Never include phrases like "explore the area," "see what catches your eye," or "wander freely" as stand-alone schedule entries without a time allocation.** Free time and wandering are valid schedule entries but must have a duration and a geographic boundary (e.g., "Free time -- Alfama alley walk, 60 min").

---

## Edge Cases

### Single-Day Trip or Day-Trip from a Home Base
Compress into one day with no arrival/departure logistics sections. Remove accommodation references entirely. Replace "Return to hotel" blocks with "Return to transit hub" blocks. Increase activity density toward the upper end of the pace tier. Add an explicit "If time allows" overflow list at the bottom with 2-3 additional nearby activities for travelers who move quickly through the schedule. Note the last viable transit departure time back to the home base and work all activities backwards from that fixed hard deadline.

### Multi-City Trip
Treat each city as a self-contained sub-itinerary within the same document. Insert an inter-city transit day between each sub-itinerary. The transit day entry must specify: departure time from City A accommodation, method of reaching City A transit hub, inter-city transport method and duration, arrival time at City B transit hub, and transport to City B accommodation. Reduce activity count on transit days to 1-2 light items near the arrival-side accommodation. If transit is under 2 hours (e.g., Paris to Brussels by Eurostar, Tokyo to Kyoto by Shinkansen), it need not consume a full day and can be handled as a morning transit followed by an afternoon and evening of activities at the new destination.

### Destination with Limited Tourist Infrastructure
Some destinations have fewer than 6-8 traditional "attraction" entries in any reference. In these cases: extend time allocations per activity (a market that would get 45 minutes in a dense city gets 90 minutes here); add experiential fillers that are universally available -- a 3-hour cooking class, a guided neighborhood walk with a local, a morning market visit, a scenic coastal or rural walk; schedule a day-trip to the nearest notable secondary destination. Never pad the schedule with phantom entries -- if a day has only 4 hours of genuine activity, build a Relaxed pace day and note the free afternoon explicitly.

### Rainy Season or High Unpredictability Weather Destinations
Apply the morning-outdoor / afternoon-indoor rule as the default structure rather than the exception. Always list a full Rain Plan row at the bottom of each day that explicitly swaps every outdoor activity for an indoor alternative in the same zone. In tropical destinations with predictable afternoon thunderstorms (most of Southeast Asia, Caribbean, tropical South America), schedule all outdoor activities before 13:00 and all indoor activities for 13:00-17:00. Note this as a structural feature, not a contingency.

### User Has Multiple Pre-Booked Fixed-Time Activities
Use fixed-time bookings as day anchors before adding any other activities. Build 30 minutes of buffer before each fixed-time activity to account for transit delays or slower movement. Build the rest of the day's schedule by filling slots before and after the anchor activity using the geographic clustering rule -- prioritize activities in the same zone as the anchor to minimize transit. Label fixed-time activities clearly as [LOCKED] in the schedule. Movable activities should be labeled [FLEXIBLE] so the user understands what can shift if needed.

### Very Short Notice (Trip Starts Within 72 Hours)
Every bookable attraction in the itinerary must be marked with its real-time availability status indicator: "Check availability -- typically sells out [X days] in advance." Prioritize walk-up accessible activities: public parks, historic neighborhoods, open-air markets, self-guided walking trails, most free museums, street food districts. Push reservation-required restaurants to the beginning of the checklist and note that same-day availability is unlikely at popular spots. Flag any activity that categorically cannot be accessed without advance purchase (many national park permits, famous viewpoint sunrise slots) and suggest alternatives that do not require booking.

### Traveling During a Major Local Holiday or Festival
A major local holiday is both an opportunity and a logistical hazard. Museums and businesses often close; simultaneously, free street festivals, parades, and cultural performances appear. Acknowledge both dimensions: note specific closures on specific days in the activity rows; add festival or event entries with location, expected time, and duration; warn that transit will be significantly disrupted and walking will be the most reliable movement method; increase time buffers between all activities by 15-20 minutes on holiday days; note that restaurant reservations during major festivals are essential and may require 2-4 weeks lead time even at mid-range establishments.

### Physically Diverse Group (Mixed Mobility or Fitness Levels)
When a group includes participants with significant physical differences (wheelchair user, elderly traveler, young child, injury recovery), the itinerary must flag accessibility requirements on every activity row. Note whether sites have lift/elevator access, step-free entry, paved vs. cobblestone paths, and availability of seating rest areas. Reduce the daily walking distance target to a maximum of 5-6 km total for groups with mobility constraints (vs. 10-14 km typical for moderate-pace fit travelers). Substitute taxi or rideshare for walking legs over 10 minutes whenever mobility is flagged.

---

## Example

**Input:** "My partner and I are visiting Tokyo for 5 days in late March. We love food, Japanese history and temples, and contemporary art. We are staying in Shinjuku. Moderate budget, moderate pace. We have already booked a teamLab digital art venue for Day 3 at 10:00."

---

## Trip Itinerary: Tokyo, Japan

**Dates:** Tuesday, March 25 -- Saturday, March 29 (4 nights / 5 days)
**Travelers:** 2 (couple)
**Pace:** Moderate
**Budget tier:** Moderate
**Accommodation area:** Shinjuku
**Primary interests:** Food, Japanese history and temples, contemporary art

> **Note on late March:** This is peak cherry blossom season in Tokyo (typical full bloom: March 22-April 5). Crowds at parks and temple grounds will be substantially higher than usual, especially on weekends. Shinjuku Gyoen and Ueno Park will have peak visitor volumes Saturday-Sunday. Booking all restaurant dinners in advance is strongly recommended during this period. Transit times at popular stops may run 10-15 minutes longer than normal on weekends.

---

### Day 1: Tuesday, March 25 -- Arrival and Shinjuku Orientation

**Focus area:** Shinjuku
**Day type:** Arrival day

| Time  | Activity                                          | Duration | Transit to Next              | Notes                                               |
|-------|---------------------------------------------------|----------|------------------------------|-----------------------------------------------------|
| 14:00 | Narita or Haneda airport to Shinjuku accommodation | --      | Narita Express 80 min / Haneda monorail + subway 50 min | Budget option: N'EX or monorail+subway; moderate: limousine bus. IC card (Suica/Pasmo) essential -- purchase at airport |
| 15:30 | Check in at accommodation                         | 30 min   | Walk, 5 min                  | Request room with city view if available; standard Japanese check-in is 15:00 |
| 16:00 | Shinjuku neighborhood orientation walk            | 60 min   | Walk, 10 min                 | Kabukicho, Takashimaya Times Square exterior, Golden Gai alley -- low-energy, no entry fees |
| 17:10 | Shinjuku Gyoen Garden -- late afternoon stroll    | 60 min   | Walk, 10 min                 | Cherry blossom peak likely in late March. Closes 18:00 (last entry 17:30). Minimal ticket fee, no booking required |
| 18:20 | Return to accommodation / rest and freshen up     | 60 min   | --                           |                                                     |
| 19:30 | Dinner -- Omoide Yokocho (Memory Lane) yakitori alley | 75 min | Walk, 5 min               | Cash only at most stalls. Smoky, intimate, very local -- ideal first-night experience |

**Alternatives:**
- Instead of Shinjuku Gyoen: Shinjuku Central Park (free, no closing time, good blossom trees)
- Instead of Omoide Yokocho: Isetan department store B1-B2 food hall for bento dinner (if tired from travel and prefer no smoke)

**Day total:** 3.5 activity-hours | **Pace:** Relaxed (arrival day)

---

### Day 2: Wednesday, March 26 -- Asakusa, Yanaka, and Ueno

**Focus area:** Asakusa and Ueno / Yanaka (eastern traditional districts)

> This day covers Tokyo's most historically dense corridor. Asakusa is Tokyo's best-preserved Edo-period neighborhood. Yanaka is a quiet, largely un-touristed traditional neighborhood that survived WWII bombing. Ueno contains Tokyo's highest concentration of major museums.

| Time  | Activity                                              | Duration | Transit to Next                        | Notes                                                         |
|-------|-------------------------------------------------------|----------|----------------------------------------|---------------------------------------------------------------|
| 08:00 | Breakfast at accommodation or Shinjuku convenience store | 35 min | Subway (Oedo line), 28 min          | Convenience store breakfast (konbini) is a genuine Tokyo experience -- onigiri, tamagoyaki, coffee |
| 09:03 | Depart Shinjuku for Asakusa                           | --       | Subway (Oedo to Asakusa line), 28 min  | Aim to arrive by 09:30 before crowds                         |
| 09:30 | Senso-ji Temple complex                               | 90 min   | Walk, 12 min                           | Free entry. Arrive early -- 10:30 onwards becomes very crowded. Nakamise shopping street alongside temple |
| 11:12 | Asakusa Culture Tourist Information Center observation deck | 20 min | Walk, 8 min                 | Free viewpoint overlooking Senso-ji and Skytree -- underused by tourists |
| 11:40 | Kappabashi Kitchen Street walk                        | 50 min   | Walk, 18 min                           | Street of professional kitchen and restaurant supply shops. Unique food-culture experience; shops open ~10:00 |
| 12:30 | Lunch -- Asakusa ramen or soba restaurant area        | 65 min   | Walk, 15 min                           | Asakusa has strong traditional soba culture. Reservation not typically required at lunch |
| 13:50 | Yanaka neighborhood walking -- Yanaka Ginza shotengai | 75 min   | Walk, 10 min                           | Traditional shotengai (covered shopping street), old temples, quiet residential lanes |
| 15:15 | Tokyo National Museum, Ueno -- Japanese art and history galleries | 90 min | Walk, 12 min           | Book ahead: same-day tickets usually available but online pre-purchase saves queue time. Closed Mondays |
| 16:57 | Ueno Park cherry blossom walk (if in bloom)           | 45 min   | Subway (Ginza line), 40 min            | Hanami (flower viewing) in late March. Evening illumination of blossoms from ~17:30 |
| 17:52 | Return to Shinjuku                                    | 40 min transit | --                            |                                                               |
| 18:30 | Rest at accommodation                                 | 60 min   | Walk, 10 min                           |                                                               |
| 19:30 | Dinner -- Shinjuku izakaya (Japanese pub dining)      | 90 min   | Walk, 5 min                            | Reserve in advance during blossom season. Order omakase small plates. Moderate budget: ¥3,000-5,000 per person |

**Alternatives:**
- Instead of Tokyo National Museum: Shitamachi Museum (smaller, focuses on Edo commoner life, fewer crowds, lower ticket price)
- Instead of Ueno Park blossom walk: Yanaka Cemetery blossom walk (same zone, fewer crowds, equally beautiful)
**Rain plan:** Skip Ueno Park walk; extend Tokyo National Museum visit by 45 minutes and move directly to Shinjuku

**Day total:** 7.5 activity-hours | **Pace:** Moderate

---

### Day 3: Thursday, March 27 -- Odaiba, teamLab, and Shibuya Evening

**Focus area:** Odaiba (morning/midday) + Shibuya (evening)

> This day is anchored by the pre-booked teamLab digital art experience at 10:00. Odaiba is a waterfront island district with a futuristic aesthetic that complements the digital art theme. Shibuya in the evening adds energy and contrast.

| Time  | Activity                                              | Duration | Transit to Next                        | Notes                                                         |
|-------|-------------------------------------------------------|----------|----------------------------------------|---------------------------------------------------------------|
| 08:00 | Breakfast at accommodation                            | 40 min   | Subway (JR Yamanote + Yurikamome), 50 min | Allow extra transit time -- Odaiba requires ferry or Yurikamome monorail |
| 09:20 | Depart Shinjuku for Odaiba                            | --       | Yurikamome monorail from Shimbashi, 25 min | Sit at front of monorail for city and bay views            |
| 09:55 | Odaiba waterfront walk and Rainbow Bridge views       | 40 min   | Walk, 5 min                            | Light pre-activity movement. Arrive early to teamLab venue  |
| 10:00 | teamLab Borderless or Planets digital art experience  | 120 min  | Walk, 15 min                           | **[LOCKED -- pre-booked 10:00 entry]** Wear dark, comfortable clothing; no flash photography; remove shoes at some installations |
| 12:15 | Lunch -- Odaiba DiverCity or nearby waterfront food court | 65 min | Walk, 8 min                        | Multiple options including ramen, sushi, Japanese curry. Card widely accepted here |
| 13:30 | Miraikan National Museum of Emerging Science and Innovation | 90 min | Walk, 20 min + Yurikamome, 25 min + JR, 15 min | [FLEXIBLE] Contemporary science and robotics -- thematically aligned with digital art day. Closed Tuesdays |
| 15:20 | Return to Shinjuku and rest                           | --       | Subway, ~50 min                        |                                                               |
| 16:30 | Rest at accommodation                                 | 75 min   | Walk, 15 min                           |                                                               |
| 17:50 | Depart for Shibuya                                    | --       | JR Yamanote line, 6 min                |                                                               |
| 18:00 | Shibuya Crossing at dusk                              | 30 min   | Walk, 5 min                            | Observe from Starbucks Tsutaya second floor or street level. Most photogenic 18:00-19:30 with building lights |
| 18:35 | Shibuya Center-gai and Dogenzaka street exploration   | 45 min   | Walk, 5 min                            | Tokyo street culture, fashion, food stalls -- freeform walking |
| 19:30 | Dinner -- Shibuya area restaurant                     | 90 min   | JR Yamanote, 6 min                     | Reserve in advance. Shibuya has excellent ramen (Ichiran style), yakiniku (grilled meat), and kaiseki options at moderate price points |

**Alternatives:**
- Instead of Miraikan: Toyota Mega Web showroom (free, automotive design and driving simulators -- good if museum fatigue sets in after teamLab)
- Instead of Shibuya Crossing: Harajuku Takeshita Street at dusk (adjacent on Yamanote line, 2 stops, more unusual fashion subculture energy)
**Rain plan:** Miraikan is fully indoor; Shibuya Crossing is equally good in rain (dramatic reflections on wet pavement)

**Day total:** 7 activity-hours | **Pace:** Moderate

---

### Day 4: Friday, March 28 -- Harajuku, Meiji Shrine, Omotesando, and Roppongi Art

**Focus area:** Harajuku / Omotesando / Minami-Aoyama (west-central) + Roppongi (evening)

> This day covers Tokyo's intersection of traditional culture (Meiji Shrine) and contemporary design (Omotesando) -- two neighborhoods within walking distance of each other. Roppongi hosts two of Tokyo's finest contemporary art museums and is 20 minutes from Omotesando by metro.

| Time  | Activity                                              | Duration | Transit to Next                        | Notes                                                         |
|-------|-------------------------------------------------------|----------|----------------------------------------|---------------------------------------------------------------|
| 08:15 | Breakfast at Shinjuku area cafe                       | 40 min   | Walk + JR Yamanote, 12 min             | Shinjuku has excellent morning coffee culture near the south exit |
| 09:05 | Depart for Harajuku                                   | --       | JR Yamanote line, 2 stops, 4 min       |                                                               |
| 09:10 | Meiji Jingu Shrine -- forested approach and main shrine | 75 min | Walk, 15 min                          | Free entry to outer grounds; small fee for inner garden. Arrive before 10:00 for relative quiet. Covered shoulders not required but respectful dress is appropriate |
| 10:40 | Harajuku Takeshita Street                             | 45 min   | Walk, 8 min                            | Tokyo's youth fashion epicenter. Crepe stalls, vintage fashion, extreme streetwear. Busiest after 12:00 -- morning is calmer |
| 11:33 | Omotesando Avenue walk -- architecture and design flagship stores | 50 min | Walk, 5 min                | Omotesando Hills designed by Tadao Ando; observe building architecture. Window-shopping and people-watching |
| 12:25 | Lunch -- Minami-Aoyama neighborhood restaurant        | 70 min   | Metro (Chiyoda line), 7 min            | Aoyama has Tokyo's best mid-range contemporary Japanese cuisine. Avoid main Omotesando cafes -- overpriced tourist positioning |
| 13:45 | 21_21 Design Sight (Tadao Ando building, design exhibitions) | 75 min | Walk, 12 min + Metro (Hibiya line), 10 min | Book ahead: advance online purchase recommended. Closed Tuesdays and Wednesdays |
| 15:22 | Mori Art Museum, Roppongi Hills -- contemporary art    | 90 min   | Walk, 8 min                            | Book ahead: 2-3 days recommended. Tokyo City View observation deck included in ticket -- spectacular sunset view |
| 17:00 | Tokyo City View from Roppongi Hills 52nd floor        | 35 min   | Walk, 5 min                            | Included with Mori Art Museum ticket. Best late afternoon to catch sunset and city lights transition |
| 17:40 | Return to Shinjuku / rest                             | --       | Metro (Hibiya line), 20 min            |                                                               |
| 18:10 | Rest at accommodation                                 | 75 min   | Walk, 10 min                           |                                                               |
| 19:30 | Dinner -- Shinjuku Kabukicho area or Nishi-Shinjuku   | 90 min   | Walk, 15 min                           | Final full dinner -- consider treating up to a slightly elevated restaurant. Reserve 3-5 days ahead in blossom season |

**Alternatives:**
- Instead of 21_21 Design Sight: National Art Center Roppongi (largest exhibition floor space in Japan, free to enter main atrium)
- Instead of Mori Art Museum: Tokyo Midtown Fujifilm Square (photography-focused, smaller, free admission)
**Rain plan:** Both Mori and 21_21 are fully indoor; rain has no impact on this day's primary schedule

**Day total:** 8 activity-hours | **Pace:** Moderate

---

### Day 5: Saturday, March 29 -- Departure Day

**Focus area:** Shinjuku neighborhood, then airport
**Flight departure:** Assumed 15:00 (international)
**Required airport arrival:** 12:30 (2.5 hours before departure)
**Depart accommodation by:** 11:15 (Narita Express 80 min + 15 min pre-transit buffer; or Haneda 50 min + 15 min buffer)

| Time  | Activity                                              | Duration | Transit to Next                        | Notes                                                         |
|-------|-------------------------------------------------------|----------|----------------------------------------|---------------------------------------------------------------|
| 08:00 | Breakfast at accommodation or nearby                  | 40 min   | Walk, 5 min                            |                                                               |
| 08:45 | Shinjuku morning walk -- Takashimaya Times Square area, last-minute shopping | 60 min | Walk, 5 min     | Department stores open 10:00 but convenience stores (konbini) and small shops are open from 07:00 |
| 09:50 | Last coffee -- Shinjuku south exit cafe area          | 30 min   | Walk, 10 min                           | Relaxed final sit-down. Good moment to review any purchases or repack bag |
| 10:30 | Check out + luggage collection                        | 20 min   | --                                     | Luggage hold available at most Shinjuku hotels until 18:00 if flight is later |
| 10:50 | Final convenience store run for airport snacks        | 15 min   | Walk to Shinjuku station, 10 min       | Japanese konbini airport snacks are superior to airport food options |
| 11:15 | Depart Shinjuku for airport                           | --       | Narita Express 80 min or Limousine Bus 90 min | Use upper-bound estimate. Have IC card loaded or airport express ticket pre-purchased |

**Alternatives:**
- Instead of Takashimaya shopping walk: Shinjuku Gyoen final blossom viewing (opens 09:00, closes 18:00, minimal entry fee -- perfect if blossoms are still at peak)

**Day total:** 2.5 activity-hours | **Pace:** Relaxed (departure day)

---

### Pre-Trip Checklist (sorted by booking urgency)

- [ ] **teamLab Borderless or Planets** -- Already booked for Day 3, 10:00. Confirm entry method (QR code, physical ticket, or app). Check terms for entry time flexibility.
- [ ] **Mori Art Museum + Tokyo City View** -- Book 2-3 days before Day 4. Online purchase saves queue time.
- [ ] **21_21 Design Sight** -- Book 2-3 days before Day 4. Check current exhibition -- design program varies.
- [ ] **Tokyo National Museum** (Day 2) -- Online ticket purchase recommended to skip ticket window queue. Confirm not closed on Day 2 (closed Mondays -- Wednesday is safe).
- [ ] **Dinner reservations** -- Book all four dinner evenings at least 3-5 days before travel. Blossom season (late March) means high demand across all price tiers.
- [ ] **Suica or Pasmo IC card** -- Purchase at airport on arrival or pre-order a mobile version. Load ¥5,000-¥8,000 for the first two days of transit and top up as needed.
- [ ] **Narita Express or airport transit** -- Confirm departure airport (Narita vs. Haneda) and purchase Narita Express tickets in advance if departing from Narita.
- [ ] Download offline maps of Tokyo (focus areas: Shinjuku, Asakusa/Ueno, Odaiba, Harajuku/Omotesando/Roppongi).
- [ ] Verify Shinjuku Gyoen cherry blossom status around March 25 -- bloom timing varies by up to 10 days year to year.
- [ ] Confirm Miraikan (Day 3) is open on Thursday -- closed Tuesdays.
- [ ] Confirm 21_21 Design Sight (Day 4) is open on Friday -- closed Tuesdays and Wednesdays; Friday is safe.

### Packing Reminders (Itinerary-Specific)

- Comfortable walking shoes -- Days 2 and 4 involve 12,000-15,000 steps on mixed surfaces (cobblestones at Senso-ji, paved Omotesando, forest path at Meiji Shrine)
- Dark, soft-sole socks for teamLab installation entry (shoes are removed; socks are required in some rooms)
- Portable pocket WiF
